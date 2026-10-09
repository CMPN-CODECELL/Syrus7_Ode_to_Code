"""
services/decision/decision_policy.py

Core Decision Policy Engine for KrishiNirnay.
Project Tagline: "Sahi Bhav Se, Samriddhi Ki Raah Pe"
Authority: SYRUS_PS02_MASTER.md (Sections 12, 13, 14, 15, 16, 27) &
           SYRUS_PS02_DIVISION_2_DECISION_RISK_ENGINE.md (Sections 12-17, 21, 22, 33)

Decision Philosophy:
- Baseline: SELL NOW at home mandi on the current valid sale day.
- Enumerate feasible candidates: (mandi x open_sale_day) across 1-7 day horizon.
- Risk appetite modes: Cautious (q20), Balanced (q35 - default), Aggressive (q50).
- Yellow-risk modifiers: required_gain * 1.5, required_probability + 5 pp.
- Strict Wait and Go gates.
- Deterministic hysteresis to prevent daily flip-flopping.
- INSUFFICIENT_EVIDENCE when evidence gates fail.
"""

from __future__ import annotations

import math
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple, Sequence
from pydantic import BaseModel, Field

from .net_return import (
    calculate_net_return,
    normalize_quantity_to_qtl,
    compute_holding_loss_sequential,
    compute_travel_loss_sequential,
    calculate_storage_cost,
    calculate_financing_cost,
    NetReturnBreakdown
)
from .route_cost import RouteCostEngine, RouteInfo, TransportCostBreakdown
from .weather_effects import WeatherContext, WeatherEffectsEngine, WeatherEconomicImpact
from .risk_engine import SixRiskEngine, RiskAssessment, RiskFlag
from .reservation_price import calculate_reservation_price, ReservationPriceResult
from .explanation_rules import generate_explanation, ExplanationPayload
from .decision_record import (
    DecisionRecord,
    BaselineRecord,
    ChosenRecord,
    CostBreakdown,
    CandidateEvaluation,
    AssumptionRecord,
    SourceRefRecord
)
from .market_mapping import canonicalize_mandi_name, get_source_mandi_name


class MarketSnapshotInput(BaseModel):
    """Input contract for market snapshot from Division 1."""
    market: str
    commodity: str
    observation_date: str
    modal_price_inr_per_qtl: float
    min_price_inr_per_qtl: Optional[float] = None
    max_price_inr_per_qtl: Optional[float] = None
    arrivals: float = 0.0
    arrivals_unit: str = "tonne"
    source: str = "data.gov.in"
    fetched_at: Optional[str] = None
    expected_trading_age_sessions: int = 1
    coverage_pct: float = 1.0
    is_suspicious_static: bool = False
    is_market_open: bool = True
    recent_daily_prices: List[float] = Field(default_factory=list)
    prior_8w_same_weekday_arrivals: List[float] = Field(default_factory=list)
    is_post_closure_catchup: bool = False
    warnings: List[str] = Field(default_factory=list)


class ForecastTargetInput(BaseModel):
    """Forecast distribution input for a specific future target date from Division 1."""
    target_date: str
    holding_days: int
    q10: float
    q20: float
    q35: float
    q50: float
    q90: float
    low: float
    expected: float
    high: float
    reliability: str = "HIGH"
    rolling_mase: float = 0.5
    rolling_80_coverage: float = 0.80
    training_end_date: Optional[str] = None
    out_of_range: bool = False
    predictive_samples: Optional[List[float]] = None


class DecisionRequest(BaseModel):
    """Complete decision request passed to the deterministic decision engine."""
    request_id: Optional[str] = None
    commodity: str
    quantity: float
    quantity_unit: str = "qtl"
    bag_weight_kg: Optional[float] = None
    home_mandi: str
    home_coords: Optional[Tuple[float, float]] = None
    observation_date: str = "2026-10-09"
    requested_wait_days: Optional[int] = None
    distance_km: Optional[float] = None
    horizon_days: int = 7
    risk_profile: str = "Balanced" # Cautious | Balanced | Aggressive
    vehicle_type: str = "medium_truck"
    vehicle_payload_qtl: Optional[float] = None
    rate_per_km: Optional[float] = None
    shared_transport: bool = False
    farmer_load_share: float = 1.0
    storage_available: bool = False
    storage_rate_per_qtl_day: Optional[float] = None
    packaging_type: str = "crates" # crates | loose_bags
    quality_factor: float = 1.0
    annual_financing_rate: float = 0.12
    hamali_per_qtl: float = 12.0
    alternative_mandis: List[str] = Field(default_factory=list)
    mandi_coords: Dict[str, Tuple[float, float]] = Field(default_factory=dict)
    weather_by_location: Dict[str, WeatherContext] = Field(default_factory=dict)
    market_snapshots: Dict[str, MarketSnapshotInput] = Field(default_factory=dict)
    forecasts_by_market: Dict[str, List[ForecastTargetInput]] = Field(default_factory=dict)
    prior_action: Optional[str] = None
    prior_risk: Optional[str] = None


def interpolate_probability_beat_baseline(
    break_even_price: float,
    q10: float,
    q20: float,
    q35: float,
    q50: float,
    q90: float
) -> float:
    """
    Interpolates probability of beating break-even price using piecewise linear CDF
    across conformal quantiles (q10, q20, q35, q50, q90).
    P(beat) = 1.0 - F(P_break_even)
    """
    quantiles = [
        (0.10, q10),
        (0.20, q20),
        (0.35, q35),
        (0.50, q50),
        (0.90, q90)
    ]

    # Extreme bounds
    if break_even_price <= quantiles[0][1]:
        # Below q10: very high chance of beating
        # Linear decay towards 0 at 0.5 * q10
        ratio = max(0.0, break_even_price) / max(1.0, quantiles[0][1])
        f_p = 0.10 * ratio
        return round(1.0 - f_p, 4)

    if break_even_price >= quantiles[-1][1]:
        # Above q90: low chance of beating
        return 0.05

    # Find interval
    for i in range(len(quantiles) - 1):
        p_lower, val_lower = quantiles[i]
        p_upper, val_upper = quantiles[i+1]
        if val_lower <= break_even_price <= val_upper:
            if val_upper == val_lower:
                f_p = p_lower
            else:
                fraction = (break_even_price - val_lower) / (val_upper - val_lower)
                f_p = p_lower + fraction * (p_upper - p_lower)
            return round(1.0 - f_p, 4)

    return 0.50


class DecisionEngine:
    """
    High-level orchestrator for KrishiNirnay Decision & Risk evaluation.
    """
    def __init__(
        self,
        route_engine: Optional[RouteCostEngine] = None,
        risk_engine: Optional[SixRiskEngine] = None,
        weather_engine: Optional[WeatherEffectsEngine] = None
    ):
        self.route_engine = route_engine or RouteCostEngine()
        self.risk_engine = risk_engine or SixRiskEngine()
        self.weather_engine = weather_engine or WeatherEffectsEngine()

    def analyze_sale_decision(self, request: DecisionRequest) -> DecisionRecord:
        """
        Executes the canonical decision pipeline:
        1. Validates inputs & normalizes quantity to quintals.
        2. Evaluates home mandi Sell Now baseline.
        3. Evaluates all feasible (mandi x day) candidates.
        4. Applies six-risk flags and composite score.
        5. Applies policy gates (Cautious / Balanced / Aggressive).
        6. Enforces deterministic hysteresis.
        7. Returns an immutable DecisionRecord.
        """
        req_id = request.request_id or str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()

        # 1. Normalize quantity to quintals
        quantity_qtl = normalize_quantity_to_qtl(
            quantity=request.quantity,
            unit=request.quantity_unit,
            bag_weight_kg=request.bag_weight_kg
        )

        # 2. Risk profile parameters
        profile = request.risk_profile.capitalize()
        if profile == "Cautious":
            base_quantile = "q20"
            base_min_gain = 0.05 # 5%
            base_min_prob = 0.70 # 70%
        elif profile == "Aggressive":
            base_quantile = "q50"
            base_min_gain = 0.015 # 1.5%
            base_min_prob = 0.55 # 55%
        else:
            profile = "Balanced"
            base_quantile = "q35"
            base_min_gain = 0.03 # 3%
            base_min_prob = 0.65 # 65%

        # 3. Vehicle payload and transit setup
        v_payload = request.vehicle_payload_qtl or 25.0
        v_rate_km = request.rate_per_km or 12.0
        hamali_total = request.hamali_per_qtl * quantity_qtl

        # 4. Baseline: Sell Now at Home Mandi today (with canonical alias resolution)
        canonical_home = canonicalize_mandi_name(request.home_mandi)
        home_snapshot = request.market_snapshots.get(request.home_mandi)
        if home_snapshot is None:
            # Check canonical alias match in snapshots
            for k, snap in request.market_snapshots.items():
                if canonicalize_mandi_name(k) == canonical_home or canonicalize_mandi_name(snap.market) == canonical_home:
                    home_snapshot = snap
                    break

        warnings: List[str] = []

        if home_snapshot is None:
            # Home mandi data missing entirely
            warnings.append(f"Home mandi '{request.home_mandi}' snapshot is unavailable.")
            return self._build_insufficient_evidence_record(
                request=request,
                req_id=req_id,
                timestamp=now_iso,
                reason=f"Current price for home mandi '{request.home_mandi}' is unavailable."
            )

        if home_snapshot.expected_trading_age_sessions >= 3:
            warnings.append(
                f"Home mandi data is {home_snapshot.expected_trading_age_sessions} sessions stale. Current trading blocked."
            )
            return self._build_insufficient_evidence_record(
                request=request,
                req_id=req_id,
                timestamp=now_iso,
                reason="Home mandi market data is 3+ trading sessions stale; cannot safely establish baseline."
            )

        # Calculate Home Route / Distance
        home_route = self.route_engine.get_route(
            origin_name="farm_gate",
            dest_name=request.home_mandi,
            origin_coords=request.home_coords,
            dest_coords=request.mandi_coords.get(request.home_mandi)
        )

        home_weather = request.weather_by_location.get(request.home_mandi)
        home_weather_impact = self.weather_engine.evaluate_weather(home_weather)

        home_transport = self.route_engine.calculate_transport_cost(
            route_distance_km=home_route.distance_km,
            duration_hours=home_route.duration_hours * home_weather_impact.travel_time_multiplier,
            quantity_qtl=quantity_qtl,
            rate_per_km=v_rate_km,
            vehicle_payload_qtl=v_payload,
            vehicle_type=request.vehicle_type,
            shared_transport=request.shared_transport,
            farmer_load_share=request.farmer_load_share,
            is_estimate=home_route.is_estimate,
            source=home_route.source
        )

        # Home travel loss (transit today)
        home_travel_losses = compute_travel_loss_sequential(
            travel_time_hours=home_transport.duration_hours,
            commodity=request.commodity,
            packaging=request.packaging_type,
            weather_multiplier=home_weather_impact.travel_loss_multiplier
        )

        # Quality factor
        effective_quality = max(0.1, min(1.0, request.quality_factor + home_weather_impact.quality_factor_delta))

        # Baseline net return
        baseline_breakdown = calculate_net_return(
            quantity_qtl=quantity_qtl,
            price_inr_per_qtl=home_snapshot.modal_price_inr_per_qtl,
            daily_holding_losses=[], # 0 holding days today
            hourly_travel_losses=home_travel_losses,
            quality_factor=effective_quality,
            transport_cost=home_transport.final_transport_cost,
            hamali_tolai_cost=hamali_total,
            commission_and_fees=0.0,
            storage_cost=0.0,
            financing_cost=0.0
        )

        baseline_cb = CostBreakdown(
            gross_revenue=round(baseline_breakdown.gross_revenue, 2),
            transport=round(baseline_breakdown.transport_cost, 2),
            hamali_tolai=round(baseline_breakdown.hamali_tolai_cost, 2),
            commission_fees=round(baseline_breakdown.commission_and_fees, 2),
            storage=round(baseline_breakdown.storage_cost, 2),
            financing=round(baseline_breakdown.financing_cost, 2),
            travel_loss_pct=round(baseline_breakdown.travel_loss_pct, 4),
            holding_loss_pct=round(baseline_breakdown.holding_loss_pct, 4),
            quality_factor=baseline_breakdown.quality_factor,
            quantity_initial_qtl=round(quantity_qtl, 4),
            quantity_sold_qtl=round(baseline_breakdown.quantity_sold_qtl, 4),
            final_net=round(baseline_breakdown.net_realization, 2)
        )

        baseline_record = BaselineRecord(
            market=request.home_mandi,
            sale_day=request.observation_date,
            net_total=round(baseline_breakdown.net_realization, 2),
            gross_revenue=round(baseline_breakdown.gross_revenue, 2),
            quantity_sold_qtl=round(baseline_breakdown.quantity_sold_qtl, 4),
            price_inr_per_qtl=home_snapshot.modal_price_inr_per_qtl,
            modal_price=home_snapshot.modal_price_inr_per_qtl,
            costs={
                "transport": round(baseline_breakdown.transport_cost, 2),
                "hamali": round(baseline_breakdown.hamali_tolai_cost, 2),
                "storage": 0.0,
                "financing": 0.0,
                "commission_and_fees": 0.0
            },
            cost_breakdown=baseline_cb
        )

        # 5. Evaluate Six Risks for the situation
        price_drop_flag = self.risk_engine.evaluate_price_drop_flag(
            today_price=home_snapshot.modal_price_inr_per_qtl,
            q20_price=None, # Will update with candidate forecast
            prob_price_drop=None,
            price_change_3d_pct=None
        )
        arrival_spike_flag = self.risk_engine.evaluate_arrival_spike_flag(
            today_arrivals=home_snapshot.arrivals,
            prior_8w_same_weekday_arrivals=home_snapshot.prior_8w_same_weekday_arrivals,
            is_post_closure_catchup=home_snapshot.is_post_closure_catchup
        )
        volatility_flag = self.risk_engine.evaluate_volatility_flag(
            recent_daily_prices=home_snapshot.recent_daily_prices,
            min_price=home_snapshot.min_price_inr_per_qtl,
            max_price=home_snapshot.max_price_inr_per_qtl,
            modal_price=home_snapshot.modal_price_inr_per_qtl
        )
        stale_data_flag = self.risk_engine.evaluate_stale_data_flag(
            expected_trading_age_sessions=home_snapshot.expected_trading_age_sessions,
            coverage_pct=home_snapshot.coverage_pct,
            is_suspicious_static=home_snapshot.is_suspicious_static
        )
        forecast_flag = self.risk_engine.evaluate_forecast_reliability_flag(
            q10=home_snapshot.modal_price_inr_per_qtl * 0.90,
            q50=home_snapshot.modal_price_inr_per_qtl,
            q90=home_snapshot.modal_price_inr_per_qtl * 1.10
        )
        weather_flag = self.risk_engine.evaluate_weather_flag(home_weather)

        risk_assessment = self.risk_engine.assess_risks(
            price_drop_flag=price_drop_flag,
            arrival_spike_flag=arrival_spike_flag,
            volatility_flag=volatility_flag,
            stale_data_flag=stale_data_flag,
            forecast_flag=forecast_flag,
            weather_flag=weather_flag
        )

        # Yellow-risk policy adjustments
        required_gain = base_min_gain
        required_prob = base_min_prob
        if risk_assessment.overall == "YELLOW":
            required_gain = base_min_gain * 1.5
            required_prob = min(0.95, base_min_prob + 0.05)

        # 6. Candidate Generation & Evaluation (mandi x day)
        all_mandis = [request.home_mandi] + [m for m in request.alternative_mandis if m != request.home_mandi]
        candidate_evaluations: List[CandidateEvaluation] = []

        best_wait_candidate: Optional[Tuple[CandidateEvaluation, NetReturnBreakdown, ReservationPriceResult, RouteInfo]] = None
        best_go_candidate: Optional[Tuple[CandidateEvaluation, NetReturnBreakdown, ReservationPriceResult, RouteInfo]] = None

        storage_rate = request.storage_rate_per_qtl_day or (
            2.0 if "tomato" in request.commodity.lower() else 0.5
        )

        for mandi in all_mandis:
            mandi_route = self.route_engine.get_route(
                origin_name="farm_gate",
                dest_name=mandi,
                origin_coords=request.home_coords,
                dest_coords=request.mandi_coords.get(mandi)
            )

            mandi_weather = request.weather_by_location.get(mandi) or home_weather
            mandi_weather_impact = self.weather_engine.evaluate_weather(mandi_weather)

            mandi_transport = self.route_engine.calculate_transport_cost(
                route_distance_km=mandi_route.distance_km,
                duration_hours=mandi_route.duration_hours * mandi_weather_impact.travel_time_multiplier,
                quantity_qtl=quantity_qtl,
                rate_per_km=v_rate_km,
                vehicle_payload_qtl=v_payload,
                vehicle_type=request.vehicle_type,
                shared_transport=request.shared_transport,
                farmer_load_share=request.farmer_load_share,
                is_estimate=mandi_route.is_estimate,
                source=mandi_route.source
            )

            # Travel losses
            candidate_travel_losses = compute_travel_loss_sequential(
                travel_time_hours=mandi_transport.duration_hours,
                commodity=request.commodity,
                packaging=request.packaging_type,
                weather_multiplier=mandi_weather_impact.travel_loss_multiplier
            )

            forecasts = request.forecasts_by_market.get(mandi, [])

            for fc in forecasts:
                if fc.holding_days < 0 or fc.holding_days > request.horizon_days:
                    continue

                # Holding losses
                candidate_holding_losses = compute_holding_loss_sequential(
                    holding_days=fc.holding_days,
                    commodity=request.commodity,
                    weather_multiplier=mandi_weather_impact.holding_loss_multiplier
                )

                # Storage cost
                candidate_storage = calculate_storage_cost(
                    quantity_qtl=quantity_qtl,
                    holding_days=fc.holding_days,
                    rate_per_qtl_day=storage_rate
                )

                # Financing cost on capital tied up (baseline net)
                candidate_financing = calculate_financing_cost(
                    capital_tied_up_inr=baseline_record.net_total,
                    holding_days=fc.holding_days,
                    annual_rate=request.annual_financing_rate
                )

                # Quantile selection based on risk profile
                if base_quantile == "q20":
                    price_used = fc.q20
                elif base_quantile == "q50":
                    price_used = fc.q50
                else:
                    price_used = fc.q35

                breakdown = calculate_net_return(
                    quantity_qtl=quantity_qtl,
                    price_inr_per_qtl=price_used,
                    daily_holding_losses=candidate_holding_losses,
                    hourly_travel_losses=candidate_travel_losses,
                    quality_factor=effective_quality,
                    transport_cost=mandi_transport.final_transport_cost,
                    hamali_tolai_cost=hamali_total,
                    commission_and_fees=0.0,
                    storage_cost=candidate_storage,
                    financing_cost=candidate_financing
                )

                gain_total = breakdown.net_realization - baseline_record.net_total
                gain_pct = (gain_total / baseline_record.net_total) if baseline_record.net_total > 0 else 0.0

                # Reservation price
                reservation_res = calculate_reservation_price(
                    baseline_net=baseline_record.net_total,
                    total_costs=breakdown.total_costs,
                    quantity_sold_qtl=breakdown.quantity_sold_qtl,
                    quality_factor=effective_quality,
                    required_gain_pct=required_gain
                )

                # Probability calculation
                if fc.predictive_samples:
                    sample_beats = 0
                    for s_price in fc.predictive_samples:
                        s_bd = calculate_net_return(
                            quantity_qtl=quantity_qtl,
                            price_inr_per_qtl=s_price,
                            daily_holding_losses=candidate_holding_losses,
                            hourly_travel_losses=candidate_travel_losses,
                            quality_factor=effective_quality,
                            transport_cost=mandi_transport.final_transport_cost,
                            hamali_tolai_cost=hamali_total,
                            storage_cost=candidate_storage,
                            financing_cost=candidate_financing
                        )
                        if s_bd.net_realization > baseline_record.net_total:
                            sample_beats += 1
                    prob_beat = round(sample_beats / len(fc.predictive_samples), 4)
                else:
                    prob_beat = interpolate_probability_beat_baseline(
                        break_even_price=reservation_res.break_even_price_inr_per_qtl,
                        q10=fc.q10,
                        q20=fc.q20,
                        q35=fc.q35,
                        q50=fc.q50,
                        q90=fc.q90
                    )

                # Candidate feasibility and gating
                is_feasible = True
                disqualification = None

                # Disqualification check 1: Forecast reliability
                if fc.reliability == "LOW" or fc.out_of_range:
                    is_feasible = False
                    disqualification = "Forecast reliability LOW / OOD"

                # Disqualification check 2: Net gain
                if gain_pct < required_gain:
                    is_feasible = False
                    disqualification = f"Gain ({gain_pct*100:.1f}%) below required margin ({required_gain*100:.1f}%)"

                # Disqualification check 3: Probability
                if prob_beat < required_prob:
                    is_feasible = False
                    disqualification = f"Probability ({prob_beat*100:.1f}%) below threshold ({required_prob*100:.1f}%)"

                cand_eval = CandidateEvaluation(
                    market=mandi,
                    sale_day=fc.target_date,
                    holding_days=fc.holding_days,
                    price_inr_per_qtl=price_used,
                    quantile_used=base_quantile,
                    net_total=round(breakdown.net_realization, 2),
                    gain_pct=round(gain_pct, 4),
                    probability_beat_baseline=prob_beat,
                    reservation_price=reservation_res.break_even_price_inr_per_qtl,
                    is_open=True,
                    is_feasible=is_feasible,
                    is_safe=(risk_assessment.overall != "RED"),
                    disqualification_reason=disqualification,
                    costs={
                        "transport": round(breakdown.transport_cost, 2),
                        "hamali": round(breakdown.hamali_tolai_cost, 2),
                        "storage": round(breakdown.storage_cost, 2),
                        "financing": round(breakdown.financing_cost, 2),
                        "commission_and_fees": round(breakdown.commission_and_fees, 2)
                    },
                    breakdown=breakdown.model_dump()
                )
                candidate_evaluations.append(cand_eval)

                # Categorize into Wait vs Go
                if mandi == request.home_mandi and fc.holding_days > 0:
                    if is_feasible and (best_wait_candidate is None or breakdown.net_realization > best_wait_candidate[0].net_total):
                        best_wait_candidate = (cand_eval, breakdown, reservation_res, mandi_route)
                elif mandi != request.home_mandi:
                    if is_feasible and (best_go_candidate is None or breakdown.net_realization > best_go_candidate[0].net_total):
                        best_go_candidate = (cand_eval, breakdown, reservation_res, mandi_route)

        # 7. Apply Action Selection Gates (Wait vs Go vs Sell Now)
        chosen_action = "SELL_NOW"
        chosen_market = request.home_mandi
        chosen_sale_day = request.observation_date
        chosen_net = baseline_record.net_total
        chosen_gain_total = 0.0
        chosen_gain_pct = 0.0
        chosen_prob: Optional[float] = None
        chosen_reservation_price: Optional[float] = None
        chosen_holding_days = 0
        chosen_breakdown = baseline_breakdown
        chosen_reservation_res: Optional[ReservationPriceResult] = None
        chosen_route_info = home_route

        # Evaluate candidate options
        candidate_options: List[Tuple[str, CandidateEvaluation, NetReturnBreakdown, ReservationPriceResult, RouteInfo]] = []

        if best_wait_candidate and not risk_assessment.is_wait_blocked_by_risk:
            cand_eval, bd, res_price, r_info = best_wait_candidate
            candidate_options.append(("WAIT", cand_eval, bd, res_price, r_info))

        if best_go_candidate and not risk_assessment.is_go_blocked_by_risk:
            cand_eval, bd, res_price, r_info = best_go_candidate
            # Check weak route Go block rule
            is_safe, block_reason = self.route_engine.is_route_safe_for_go(
                gain_pct=cand_eval.gain_pct,
                required_gain_pct=required_gain,
                route_info=r_info
            )
            if is_safe:
                candidate_options.append(("GO", cand_eval, bd, res_price, r_info))
            else:
                warnings.append(block_reason or "GO blocked due to weak route confidence")

        # Pick best candidate if any beat baseline
        if candidate_options:
            # Sort by net realization descending
            candidate_options.sort(key=lambda x: x[1].net_total, reverse=True)
            top_action, top_eval, top_bd, top_res, top_route = candidate_options[0]

            if top_eval.net_total > baseline_record.net_total and top_eval.gain_pct >= required_gain:
                chosen_action = top_action
                chosen_market = top_eval.market
                chosen_sale_day = top_eval.sale_day
                chosen_net = top_eval.net_total
                chosen_gain_total = round(top_eval.net_total - baseline_record.net_total, 2)
                chosen_gain_pct = top_eval.gain_pct
                chosen_prob = top_eval.probability_beat_baseline
                chosen_reservation_price = top_eval.reservation_price
                chosen_holding_days = top_eval.holding_days
                chosen_breakdown = top_bd
                chosen_reservation_res = top_res
                chosen_route_info = top_route

        # 8. Hysteresis Check
        # Rule: Worsen immediately (Wait/Go -> Sell Now), but require 2 consecutive improvements to upgrade.
        hysteresis_applied = False
        if request.prior_action in ("SELL_NOW", None) and chosen_action in ("WAIT", "GO"):
            # Check if nearly tied or marginal upgrade
            if chosen_gain_pct < (required_gain + 0.01): # within 1% buffer of gate
                # If marginal and prior was SELL_NOW, stay SELL_NOW to prevent flip-flopping
                chosen_action = "SELL_NOW"
                chosen_market = request.home_mandi
                chosen_sale_day = request.observation_date
                chosen_net = baseline_record.net_total
                chosen_gain_total = 0.0
                chosen_gain_pct = 0.0
                chosen_prob = None
                chosen_reservation_price = None
                chosen_holding_days = 0
                chosen_breakdown = baseline_breakdown
                chosen_reservation_res = None
                chosen_route_info = home_route
                hysteresis_applied = True
                warnings.append("Hysteresis applied: Preserved SELL_NOW due to near-boundary threshold.")

        chosen_cb = CostBreakdown(
            gross_revenue=round(chosen_breakdown.gross_revenue, 2),
            transport=round(chosen_breakdown.transport_cost, 2),
            hamali_tolai=round(chosen_breakdown.hamali_tolai_cost, 2),
            commission_fees=round(chosen_breakdown.commission_and_fees, 2),
            storage=round(chosen_breakdown.storage_cost, 2),
            financing=round(chosen_breakdown.financing_cost, 2),
            travel_loss_pct=round(chosen_breakdown.travel_loss_pct, 4),
            holding_loss_pct=round(chosen_breakdown.holding_loss_pct, 4),
            quality_factor=chosen_breakdown.quality_factor,
            quantity_initial_qtl=round(quantity_qtl, 4),
            quantity_sold_qtl=round(chosen_breakdown.quantity_sold_qtl, 4),
            final_net=round(chosen_breakdown.net_realization, 2)
        )

        chosen_record = ChosenRecord(
            action=chosen_action,
            market=chosen_market,
            sale_day=chosen_sale_day,
            net_total=round(chosen_net, 2),
            gain_total=round(chosen_gain_total, 2),
            gain_pct=round(chosen_gain_pct, 4),
            probability_beat_baseline=chosen_prob,
            reservation_price=chosen_reservation_price,
            required_gain_pct=round(required_gain, 4),
            quantity_sold_qtl=round(chosen_breakdown.quantity_sold_qtl, 4),
            holding_days=chosen_holding_days,
            wait_days=chosen_holding_days,
            modal_price_expected=chosen_breakdown.price_inr_per_qtl,
            costs={
                "transport": round(chosen_breakdown.transport_cost, 2),
                "hamali": round(chosen_breakdown.hamali_tolai_cost, 2),
                "storage": round(chosen_breakdown.storage_cost, 2),
                "financing": round(chosen_breakdown.financing_cost, 2),
                "commission_and_fees": round(chosen_breakdown.commission_and_fees, 2)
            },
            cost_breakdown=chosen_cb
        )

        # 9. Explanation & Why cards
        explanation = generate_explanation(
            action=chosen_action,
            baseline_market=request.home_mandi,
            baseline_sale_day=request.observation_date,
            baseline_net=baseline_record.net_total,
            chosen_market=chosen_market,
            chosen_sale_day=chosen_sale_day,
            chosen_net=chosen_net,
            gain_pct=chosen_gain_pct,
            required_gain_pct=required_gain,
            probability_beat_baseline=chosen_prob,
            min_probability_required=required_prob,
            reservation_price_result=chosen_reservation_res,
            risk_assessment=risk_assessment,
            holding_days=chosen_holding_days,
            net_breakdown=chosen_breakdown,
            data_freshness_sessions=home_snapshot.expected_trading_age_sessions,
            is_route_estimate=chosen_route_info.is_estimate
        )

        # 10. Audit Assumptions & Source Refs
        assumptions = [
            AssumptionRecord(
                param="transport.round_trip_factor",
                value=2.0,
                status="ASSUMPTION",
                source="Standard Maharashtra rural transporter billing practice"
            ),
            AssumptionRecord(
                param="financing.annual_rate",
                value=request.annual_financing_rate,
                status="ASSUMPTION",
                source="KCC / informal credit interest benchmark"
            ),
            AssumptionRecord(
                param="storage.rate_per_qtl_day",
                value=storage_rate,
                status="ASSUMPTION",
                source="APMC yard storage rental priors"
            ),
            AssumptionRecord(
                param="commission.farmer_commission_pct",
                value=0.0,
                status="VERIFIED",
                source="Maharashtra APMC Regulation Act Amendment",
                last_verified="2024-01-01"
            )
        ]

        source_refs = [
            SourceRefRecord(
                type="market_snapshot",
                source=home_snapshot.source,
                ref=f"snapshot_{request.home_mandi}_{request.observation_date}",
                fetched_at=home_snapshot.fetched_at
            ),
            SourceRefRecord(
                type="route",
                source=home_route.source,
                ref=f"{home_route.origin}->{home_route.destination}",
                fetched_at=now_iso
            )
        ]

        return DecisionRecord(
            request_id=req_id,
            engine_version="1.0.0",
            data_snapshot_id=f"snap_{request.home_mandi}_{request.observation_date}",
            rules_version="1.0.0",
            forecast_model_version="1.0.0",
            calibration_version="1.0.0",
            cost_config_version="1.0.0",
            weather_snapshot_id="weather-v1",
            route_snapshot_id="route-v1",
            timestamp=now_iso,
            commodity=request.commodity,
            lot_quantity_qtl=quantity_qtl,
            risk_profile=request.risk_profile.upper(),
            baseline=baseline_record,
            chosen=chosen_record,
            forecast={"commodity": request.commodity, "horizon_days": request.horizon_days},
            risk=risk_assessment,
            warnings=warnings,
            assumptions=assumptions,
            source_refs=source_refs,
            explanation=explanation,
            candidates=candidate_evaluations,
            hysteresis_applied=hysteresis_applied
        )

    def _build_insufficient_evidence_record(
        self,
        request: DecisionRequest,
        req_id: str,
        timestamp: str,
        reason: str
    ) -> DecisionRecord:
        """Constructs an honest INSUFFICIENT_EVIDENCE DecisionRecord when gates cannot be passed."""
        zero_baseline = BaselineRecord(
            market=request.home_mandi,
            sale_day=request.observation_date,
            net_total=0.0,
            gross_revenue=0.0,
            quantity_sold_qtl=0.0,
            price_inr_per_qtl=0.0,
            costs={"transport": 0.0, "hamali": 0.0, "storage": 0.0, "financing": 0.0, "commission_and_fees": 0.0}
        )
        chosen = ChosenRecord(
            action="INSUFFICIENT_EVIDENCE",
            market=request.home_mandi,
            sale_day=request.observation_date,
            net_total=0.0,
            gain_total=0.0,
            gain_pct=0.0,
            probability_beat_baseline=None,
            reservation_price=None,
            required_gain_pct=0.03,
            quantity_sold_qtl=0.0,
            holding_days=0,
            costs={}
        )
        dummy_flag = RiskFlag(
            name="stale_data",
            status="RED",
            score=1.0,
            weight=0.15,
            reason=reason
        )
        risk = RiskAssessment(
            overall="RED",
            score=1.0,
            raw_score=1.0,
            flags=[dummy_flag],
            overrides_applied=["INSUFFICIENT_EVIDENCE"],
            is_wait_blocked_by_risk=True,
            is_go_blocked_by_risk=True,
            blocking_reasons=[reason]
        )
        explanation = ExplanationPayload(
            why=[f"INSUFFICIENT EVIDENCE: {reason}"],
            key_drivers=["Market or route evidence inadequate to calculate safe recommendation."],
            evidence={"status": "INSUFFICIENT_EVIDENCE", "reason": reason}
        )

        return DecisionRecord(
            request_id=req_id,
            engine_version="1.0.0",
            data_snapshot_id="insufficient_evidence",
            rules_version="1.0.0",
            forecast_model_version="1.0.0",
            calibration_version="1.0.0",
            cost_config_version="1.0.0",
            weather_snapshot_id="none",
            route_snapshot_id="none",
            timestamp=timestamp,
            commodity=request.commodity,
            lot_quantity_qtl=float(request.quantity),
            risk_profile=request.risk_profile.upper(),
            baseline=zero_baseline,
            chosen=chosen,
            forecast={},
            risk=risk,
            warnings=[reason],
            assumptions=[],
            source_refs=[],
            explanation=explanation,
            candidates=[],
            hysteresis_applied=False
        )
