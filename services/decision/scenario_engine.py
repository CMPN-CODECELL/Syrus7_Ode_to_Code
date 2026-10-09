"""
services/decision/scenario_engine.py

Deterministic What-If Scenario Engine for KrishiNirnay.
Project Tagline: "Sahi Bhav Se, Samriddhi Ki Raah Pe"
Authority: SYRUS_PS02_MASTER.md (Sections 14, 21) & SYRUS_PS02_DIVISION_2_DECISION_RISK_ENGINE.md (Sections 25, 26)

Invariants:
1. Clones baseline DecisionRequest state; NEVER mutates historical or source objects.
2. Runs the EXACT SAME production DecisionEngine pipeline on the stressed state.
3. No separate "scenario math" that can drift from production logic.
4. Arrival surge:
   - Scales arrivals and reruns arrival risk.
   - Does NOT invent arbitrary price elasticity; makes recommendation conservative.
"""

from __future__ import annotations

import copy
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

from .decision_policy import DecisionRequest, DecisionEngine, MarketSnapshotInput, ForecastTargetInput
from .decision_record import DecisionRecord


class ScenarioParameters(BaseModel):
    """What-if stress testing parameters."""
    price_delta_pct: float = Field(default=-10.0, description="Percentage change in market prices (e.g. -10 for -10%)")
    transport_delta_pct: float = Field(default=20.0, description="Percentage change in transport cost (e.g. +20 for +20%)")
    arrival_multiplier: float = Field(default=2.0, description="Arrival volume multiplier (e.g. 2.0 for 2x arrivals)")
    apply_to_future_only: bool = Field(default=True, description="Whether price stress applies to future prices (default True per Master Section 30 demo)")


class ScenarioDifference(BaseModel):
    """Structured comparison between baseline and stressed scenario runs."""
    net_delta: float = Field(..., description="Scenario chosen net minus baseline chosen net in INR")
    risk_changed: bool = Field(..., description="True if risk status changed (e.g. GREEN -> RED)")
    action_changed: bool = Field(..., description="True if action changed (e.g. WAIT -> SELL_NOW)")
    baseline_action: str
    scenario_action: str
    baseline_risk: str
    scenario_risk: str
    baseline_net: float
    scenario_net: float
    baseline_break_even: Optional[float]
    scenario_break_even: Optional[float]
    main_reason: str = Field(..., description="Main economic or risk driver of decision difference")


class ScenarioResult(BaseModel):
    """Complete immutable scenario output."""
    baseline_record: DecisionRecord
    scenario_record: DecisionRecord
    difference: ScenarioDifference
    break_even_changed: bool


class ScenarioEngine:
    """
    Executes what-if simulations by cloning request state and invoking DecisionEngine.
    """
    def __init__(self, decision_engine: Optional[DecisionEngine] = None):
        self.decision_engine = decision_engine or DecisionEngine()

    def run_scenario(
        self,
        baseline_request: DecisionRequest,
        scenario_params: Optional[ScenarioParameters] = None,
        baseline_record: Optional[DecisionRecord] = None
    ) -> ScenarioResult:
        """
        Runs the what-if simulation:
          1. Computes baseline record (or uses provided verified baseline record).
          2. Deep-clones the request state to guarantee source immutability.
          3. Applies scenario stress adjustments (price, transport rate, arrival volume).
          4. Executes the EXACT SAME DecisionEngine pipeline.
          5. Computes structured delta and comparison.
        """
        params = scenario_params or ScenarioParameters()

        # 1. Baseline DecisionRecord
        if baseline_record is None:
            baseline_record = self.decision_engine.analyze_sale_decision(baseline_request)

        # 2. Deep-clone request state (NEVER mutate source historical/request data)
        stressed_request: DecisionRequest = copy.deepcopy(baseline_request)

        # 3. Apply Scenario Parameters
        # A. Transport cost delta
        current_rate = stressed_request.rate_per_km or 12.0
        stressed_request.rate_per_km = current_rate * (1.0 + params.transport_delta_pct / 100.0)

        # B. Price factor
        price_factor = 1.0 + (params.price_delta_pct / 100.0)

        # Apply price stress to current snapshot if not future-only
        for m_name, snap in stressed_request.market_snapshots.items():
            if not params.apply_to_future_only:
                snap.modal_price_inr_per_qtl = round(snap.modal_price_inr_per_qtl * price_factor, 2)
                if snap.min_price_inr_per_qtl is not None:
                    snap.min_price_inr_per_qtl = round(snap.min_price_inr_per_qtl * price_factor, 2)
                if snap.max_price_inr_per_qtl is not None:
                    snap.max_price_inr_per_qtl = round(snap.max_price_inr_per_qtl * price_factor, 2)

            # C. Arrival multiplier
            snap.arrivals = round(snap.arrivals * params.arrival_multiplier, 2)

        # Apply price delta to future forecasts
        for m_name, fc_list in stressed_request.forecasts_by_market.items():
            for fc in fc_list:
                fc.q10 = round(fc.q10 * price_factor, 2)
                fc.q20 = round(fc.q20 * price_factor, 2)
                fc.q35 = round(fc.q35 * price_factor, 2)
                fc.q50 = round(fc.q50 * price_factor, 2)
                fc.q90 = round(fc.q90 * price_factor, 2)
                fc.low = round(fc.low * price_factor, 2)
                fc.expected = round(fc.expected * price_factor, 2)
                fc.high = round(fc.high * price_factor, 2)
                if fc.predictive_samples:
                    fc.predictive_samples = [round(s * price_factor, 2) for s in fc.predictive_samples]

        # 4. Run the EXACT SAME decision engine
        stressed_record = self.decision_engine.analyze_sale_decision(stressed_request)

        # 5. Compare outputs
        net_delta = round(stressed_record.chosen.net_total - baseline_record.chosen.net_total, 2)
        risk_changed = (stressed_record.risk.overall != baseline_record.risk.overall)
        action_changed = (stressed_record.chosen.action != baseline_record.chosen.action)

        b_be = baseline_record.chosen.reservation_price
        s_be = stressed_record.chosen.reservation_price
        break_even_changed = (b_be != s_be)

        # Determine main reason
        reasons = []
        if action_changed:
            reasons.append(
                f"Action flipped from {baseline_record.chosen.action} to {stressed_record.chosen.action}"
            )
        if risk_changed:
            reasons.append(
                f"Risk shifted from {baseline_record.risk.overall} to {stressed_record.risk.overall}"
            )
        if params.arrival_multiplier > 1.0 and stressed_record.risk.overall == "RED":
            reasons.append("Arrival surge triggered market risk override (RED)")
        if params.price_delta_pct < 0:
            reasons.append(f"Price stress ({params.price_delta_pct:+.1f}%) eroded future net margin")
        if params.transport_delta_pct > 0:
            reasons.append(f"Transport cost increase ({params.transport_delta_pct:+.1f}%) made travel less viable")

        main_reason = "; ".join(reasons) if reasons else "No decision change under tested conditions"

        difference = ScenarioDifference(
            net_delta=net_delta,
            risk_changed=risk_changed,
            action_changed=action_changed,
            baseline_action=baseline_record.chosen.action,
            scenario_action=stressed_record.chosen.action,
            baseline_risk=baseline_record.risk.overall,
            scenario_risk=stressed_record.risk.overall,
            baseline_net=baseline_record.chosen.net_total,
            scenario_net=stressed_record.chosen.net_total,
            baseline_break_even=b_be,
            scenario_break_even=s_be,
            main_reason=main_reason
        )

        return ScenarioResult(
            baseline_record=baseline_record,
            scenario_record=stressed_record,
            difference=difference,
            break_even_changed=break_even_changed
        )
