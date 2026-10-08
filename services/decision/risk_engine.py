"""
services/decision/risk_engine.py

Six-Risk Engine and Safety Override Logic for KrishiNirnay.
Project Tagline: "Sahi Bhav Se, Samriddhi Ki Raah Pe"
Authority: SYRUS_PS02_MASTER.md (Sections 9, 13) & SYRUS_PS02_DIVISION_2_DECISION_RISK_ENGINE.md (Sections 19, 20, 21, 22)

Six Independent Risk Flags:
1. price_drop (weight 0.25)
2. arrival_spike (weight 0.20)
3. volatility (weight 0.15)
4. stale_data (weight 0.15)
5. forecast_reliability (weight 0.15)
6. weather (weight 0.10)

Color Mapping:
  Green = 0.0
  Yellow = 0.5
  Red = 1.0

Score Thresholds:
  R < 0.25      -> GREEN
  0.25 <= R < 0.55 -> YELLOW
  R >= 0.55     -> RED

Safety Overrides:
  - any Red stale-data -> overall RED
  - any Red forecast -> overall RED
  - 2+ Reds -> overall RED
  - 3+ Yellows -> at least YELLOW
"""

from __future__ import annotations

import math
from typing import List, Dict, Any, Optional, Tuple, Sequence
from pydantic import BaseModel, Field

from .weather_effects import WeatherContext, WeatherEffectsEngine


class RiskFlag(BaseModel):
    """Individual evaluated risk flag."""
    name: str = Field(..., description="Flag name: price_drop, arrival_spike, volatility, stale_data, forecast_reliability, weather")
    status: str = Field(..., description="'GREEN', 'YELLOW', or 'RED'")
    score: float = Field(..., description="0.0 for Green, 0.5 for Yellow, 1.0 for Red")
    weight: float = Field(..., description="Configured weight in overall score")
    reason: str = Field(..., description="Deterministic reason for flag classification")
    metrics: Dict[str, Any] = Field(default_factory=dict, description="Underlying quantitative metrics")


class RiskAssessment(BaseModel):
    """Complete six-risk assessment output with overrides and explanations."""
    overall: str = Field(..., description="Overall risk status: 'GREEN', 'YELLOW', or 'RED'")
    score: float = Field(..., description="Weighted composite risk score R in [0.0, 1.0]")
    raw_score: float = Field(..., description="Score before safety overrides")
    flags: List[RiskFlag] = Field(..., description="The six individual risk flags")
    overrides_applied: List[str] = Field(default_factory=list, description="List of safety overrides triggered")
    is_wait_blocked_by_risk: bool = Field(False, description="True if risk policies strictly block Wait")
    is_go_blocked_by_risk: bool = Field(False, description="True if risk policies strictly block Go")
    blocking_reasons: List[str] = Field(default_factory=list, description="Detailed blocking explanations")


class SixRiskEngine:
    """
    Evaluates the six independent risk dimensions and applies deterministic safety gates.
    """
    def __init__(
        self,
        weights: Optional[Dict[str, float]] = None,
        green_max: float = 0.25,
        yellow_max: float = 0.55
    ):
        self.weights = weights or {
            "price_drop": 0.25,
            "arrival_spike": 0.20,
            "volatility": 0.15,
            "stale_data": 0.15,
            "forecast_reliability": 0.15,
            "weather": 0.10
        }
        self.green_max = green_max
        self.yellow_max = yellow_max
        self.weather_engine = WeatherEffectsEngine()

    def evaluate_price_drop_flag(
        self,
        today_price: float,
        q20_price: Optional[float] = None,
        prob_price_drop: Optional[float] = None,
        price_change_3d_pct: Optional[float] = None
    ) -> RiskFlag:
        """
        Flag 1: Price Drop Risk
        Yellow if any:
          - chance of drop >= 55%
          - q20 <= 97% of today price (q20_ratio <= 0.97)
          - 3-day change <= -10% (-0.10)
        Red if any:
          - chance of drop >= 70%
          - q20 <= 92% of today price (q20_ratio <= 0.92)
          - 3-day change <= -15% (-0.15)
        """
        weight = self.weights["price_drop"]
        metrics = {
            "today_price": today_price,
            "q20_price": q20_price,
            "prob_price_drop": prob_price_drop,
            "price_change_3d_pct": price_change_3d_pct
        }

        q20_ratio = (q20_price / today_price) if (q20_price is not None and today_price > 0) else None
        metrics["q20_ratio"] = q20_ratio

        # Red checks
        red_reasons = []
        if prob_price_drop is not None and prob_price_drop >= 0.70:
            red_reasons.append(f"Price drop probability is high ({prob_price_drop*100:.1f}% >= 70%)")
        if q20_ratio is not None and q20_ratio <= 0.92:
            red_reasons.append(f"Cautious quantile q20 is significantly below current price ({q20_ratio*100:.1f}% <= 92%)")
        if price_change_3d_pct is not None and price_change_3d_pct <= -0.15:
            red_reasons.append(f"3-day price decline is steep ({price_change_3d_pct*100:.1f}% <= -15%)")

        if red_reasons:
            return RiskFlag(
                name="price_drop",
                status="RED",
                score=1.0,
                weight=weight,
                reason="; ".join(red_reasons),
                metrics=metrics
            )

        # Yellow checks
        yellow_reasons = []
        if prob_price_drop is not None and prob_price_drop >= 0.55:
            yellow_reasons.append(f"Price drop probability is elevated ({prob_price_drop*100:.1f}% >= 55%)")
        if q20_ratio is not None and q20_ratio <= 0.97:
            yellow_reasons.append(f"Cautious quantile q20 is below current price ({q20_ratio*100:.1f}% <= 97%)")
        if price_change_3d_pct is not None and price_change_3d_pct <= -0.10:
            yellow_reasons.append(f"3-day price trend is negative ({price_change_3d_pct*100:.1f}% <= -10%)")

        if yellow_reasons:
            return RiskFlag(
                name="price_drop",
                status="YELLOW",
                score=0.5,
                weight=weight,
                reason="; ".join(yellow_reasons),
                metrics=metrics
            )

        return RiskFlag(
            name="price_drop",
            status="GREEN",
            score=0.0,
            weight=weight,
            reason="Price trajectory is stable or positive",
            metrics=metrics
        )

    def evaluate_arrival_spike_flag(
        self,
        today_arrivals: float,
        prior_8w_same_weekday_arrivals: Sequence[float],
        is_post_closure_catchup: bool = False
    ) -> RiskFlag:
        """
        Flag 2: Arrival Spike Risk
        r = today_arrivals / median_same_weekday_prior_8w
        z = (today_arrivals - median) / (1.4826 * MAD)
        Yellow: r >= 1.5 OR z >= 2.5
        Red: r >= 2.0 OR z >= 3.5
        
        Special rules:
        - Post-closure catch-up (e.g. Monday after holiday/Sunday closure) is NOT an arrival spike.
        - Low arrivals are informational, not automatically risky.
        """
        weight = self.weights["arrival_spike"]
        metrics = {
            "today_arrivals": today_arrivals,
            "is_post_closure_catchup": is_post_closure_catchup
        }

        if is_post_closure_catchup:
            return RiskFlag(
                name="arrival_spike",
                status="GREEN",
                score=0.0,
                weight=weight,
                reason="Arrival volume reflects expected catch-up after market closure, not a supply glut",
                metrics=metrics
            )

        clean_history = [float(x) for x in prior_8w_same_weekday_arrivals if x > 0]
        if not clean_history:
            # Insufficient arrival history - informational Green/Neutral
            return RiskFlag(
                name="arrival_spike",
                status="GREEN",
                score=0.0,
                weight=weight,
                reason="Insufficient arrival history for baseline; treated as normal",
                metrics=metrics
            )

        clean_history.sort()
        n = len(clean_history)
        mid = n // 2
        median_arrivals = (clean_history[mid] if n % 2 != 0 else (clean_history[mid-1] + clean_history[mid]) / 2.0)
        metrics["median_arrivals"] = median_arrivals

        r = (today_arrivals / median_arrivals) if median_arrivals > 0 else 1.0
        metrics["arrival_ratio_r"] = r

        # Robust MAD
        deviations = sorted([abs(x - median_arrivals) for x in clean_history])
        mad = (deviations[mid] if n % 2 != 0 else (deviations[mid-1] + deviations[mid]) / 2.0)
        z = ((today_arrivals - median_arrivals) / (1.4826 * mad)) if mad > 0 else 0.0
        metrics["robust_z"] = z

        # Low arrivals check (informational)
        if today_arrivals < median_arrivals:
            return RiskFlag(
                name="arrival_spike",
                status="GREEN",
                score=0.0,
                weight=weight,
                reason=f"Arrivals below median ({today_arrivals:.1f} vs median {median_arrivals:.1f}); supply tight",
                metrics=metrics
            )

        # Red checks
        if r >= 2.0 or z >= 3.5:
            return RiskFlag(
                name="arrival_spike",
                status="RED",
                score=1.0,
                weight=weight,
                reason=f"Severe arrival surge (r={r:.2f} >= 2.0x, robust z={z:.2f} >= 3.5); market collapse risk",
                metrics=metrics
            )

        # Yellow checks
        if r >= 1.5 or z >= 2.5:
            return RiskFlag(
                name="arrival_spike",
                status="YELLOW",
                score=0.5,
                weight=weight,
                reason=f"Elevated arrival surge (r={r:.2f} >= 1.5x, robust z={z:.2f} >= 2.5); potential price suppression",
                metrics=metrics
            )

        return RiskFlag(
            name="arrival_spike",
            status="GREEN",
            score=0.0,
            weight=weight,
            reason="Arrivals within normal weekday range",
            metrics=metrics
        )

    def evaluate_volatility_flag(
        self,
        recent_daily_prices: Sequence[float],
        historical_log_volatilities: Optional[Sequence[float]] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        modal_price: Optional[float] = None
    ) -> RiskFlag:
        """
        Flag 3: Price Volatility & Spread Risk
        14-day log-return volatility compared with same mandi-crop history.
        Modal spread: (max_price - min_price) / modal_price.
        Yellow: volatility > 75th percentile OR spread > 50%
        Red: volatility > 90th percentile OR spread > 100%
        """
        weight = self.weights["volatility"]
        metrics: Dict[str, Any] = {}

        # 1. Price spread check
        spread = None
        if min_price is not None and max_price is not None and modal_price is not None and modal_price > 0:
            spread = (max_price - min_price) / modal_price
            metrics["spread"] = spread

        # 2. 14-day log return volatility
        log_vol = 0.0
        if len(recent_daily_prices) >= 3:
            log_returns = []
            for i in range(1, len(recent_daily_prices)):
                p_prev, p_curr = recent_daily_prices[i-1], recent_daily_prices[i]
                if p_prev > 0 and p_curr > 0:
                    log_returns.append(math.log(p_curr / p_prev))
            if len(log_returns) >= 2:
                mean_lr = sum(log_returns) / len(log_returns)
                var = sum((lr - mean_lr)**2 for lr in log_returns) / (len(log_returns) - 1)
                log_vol = math.sqrt(var)
        metrics["log_return_vol"] = log_vol

        # Volatility percentile
        vol_pct = 0.5
        if historical_log_volatilities and len(historical_log_volatilities) > 0:
            count_less = sum(1 for v in historical_log_volatilities if v <= log_vol)
            vol_pct = count_less / float(len(historical_log_volatilities))
        metrics["vol_percentile"] = vol_pct

        # Red checks
        red_reasons = []
        if vol_pct > 0.90:
            red_reasons.append(f"Historical price volatility in 90th+ percentile ({vol_pct*100:.1f}%)")
        if spread is not None and spread > 1.00:
            red_reasons.append(f"Intra-day price spread exceeds 100% ({spread*100:.1f}%)")

        if red_reasons:
            return RiskFlag(
                name="volatility",
                status="RED",
                score=1.0,
                weight=weight,
                reason="; ".join(red_reasons),
                metrics=metrics
            )

        # Yellow checks
        yellow_reasons = []
        if vol_pct > 0.75:
            yellow_reasons.append(f"Historical price volatility elevated in 75th+ percentile ({vol_pct*100:.1f}%)")
        if spread is not None and spread > 0.50:
            yellow_reasons.append(f"Intra-day price spread exceeds 50% ({spread*100:.1f}%)")

        if yellow_reasons:
            return RiskFlag(
                name="volatility",
                status="YELLOW",
                score=0.5,
                weight=weight,
                reason="; ".join(yellow_reasons),
                metrics=metrics
            )

        return RiskFlag(
            name="volatility",
            status="GREEN",
            score=0.0,
            weight=weight,
            reason="Price volatility and spread within normal market bounds",
            metrics=metrics
        )

    def evaluate_stale_data_flag(
        self,
        expected_trading_age_sessions: int,
        coverage_pct: float = 1.0,
        is_suspicious_static: bool = False
    ) -> RiskFlag:
        """
        Flag 4: Stale Data Risk
        Freshness is based on expected market trading sessions (not raw clock hours).
        0-1 expected trading session: Fresh (Green)
        2 expected trading sessions: Yellow
        3+ expected trading sessions: Red (Blocked)
        """
        weight = self.weights["stale_data"]
        metrics = {
            "expected_trading_age_sessions": expected_trading_age_sessions,
            "coverage_pct": coverage_pct,
            "is_suspicious_static": is_suspicious_static
        }

        # Red checks
        if expected_trading_age_sessions >= 3:
            return RiskFlag(
                name="stale_data",
                status="RED",
                score=1.0,
                weight=weight,
                reason=f"Data is {expected_trading_age_sessions} expected trading sessions stale (>= 3). Current trading blocked.",
                metrics=metrics
            )
        if is_suspicious_static:
            return RiskFlag(
                name="stale_data",
                status="RED",
                score=1.0,
                weight=weight,
                reason="Suspicious static price pattern detected across sessions; unverified data",
                metrics=metrics
            )

        # Yellow checks
        if expected_trading_age_sessions == 2 or coverage_pct < 0.70:
            reasons = []
            if expected_trading_age_sessions == 2:
                reasons.append("Price is from 2 expected trading sessions ago; reduced trust")
            if coverage_pct < 0.70:
                reasons.append(f"Historical reporting coverage low ({coverage_pct*100:.1f}% < 70%)")
            return RiskFlag(
                name="stale_data",
                status="YELLOW",
                score=0.5,
                weight=weight,
                reason="; ".join(reasons),
                metrics=metrics
            )

        return RiskFlag(
            name="stale_data",
            status="GREEN",
            score=0.0,
            weight=weight,
            reason="Data fresh from latest confirmed market trading session",
            metrics=metrics
        )

    def evaluate_forecast_reliability_flag(
        self,
        q10: float,
        q50: float,
        q90: float,
        rolling_mase: float = 0.5,
        rolling_80_coverage: float = 0.80,
        out_of_range: bool = False
    ) -> RiskFlag:
        """
        Flag 5: Forecast Reliability / OOD Risk
        Width: (q90 - q10) / q50
        Yellow: width > 20% OR MASE in [0.8, 1.0] OR coverage in [65%, 75%]
        Red: width > 35% OR MASE > 1.0 OR coverage < 65% OR out_of_range is True
        """
        weight = self.weights["forecast_reliability"]
        width = ((q90 - q10) / q50) if q50 > 0 else 0.0
        metrics = {
            "q10": q10,
            "q50": q50,
            "q90": q90,
            "width": width,
            "rolling_mase": rolling_mase,
            "rolling_80_coverage": rolling_80_coverage,
            "out_of_range": out_of_range
        }

        # Red checks
        red_reasons = []
        if out_of_range:
            red_reasons.append("Inputs outside model training distribution (Out of Range / OOD)")
        if width > 0.35:
            red_reasons.append(f"Conformal uncertainty band too wide ({width*100:.1f}% > 35%)")
        if rolling_mase > 1.0:
            red_reasons.append(f"Rolling MASE ({rolling_mase:.2f} > 1.0) worse than naive baseline")
        if rolling_80_coverage < 0.65:
            red_reasons.append(f"Empirical 80% coverage under-calibrated ({rolling_80_coverage*100:.1f}% < 65%)")

        if red_reasons:
            return RiskFlag(
                name="forecast_reliability",
                status="RED",
                score=1.0,
                weight=weight,
                reason="; ".join(red_reasons),
                metrics=metrics
            )

        # Yellow checks
        yellow_reasons = []
        if width > 0.20:
            yellow_reasons.append(f"Uncertainty width elevated ({width*100:.1f}% > 20%)")
        if 0.8 <= rolling_mase <= 1.0:
            yellow_reasons.append(f"Rolling MASE ({rolling_mase:.2f}) approaching naive benchmark")
        if 0.65 <= rolling_80_coverage <= 0.75:
            yellow_reasons.append(f"Rolling coverage slightly below target ({rolling_80_coverage*100:.1f}%)")

        if yellow_reasons:
            return RiskFlag(
                name="forecast_reliability",
                status="YELLOW",
                score=0.5,
                weight=weight,
                reason="; ".join(yellow_reasons),
                metrics=metrics
            )

        return RiskFlag(
            name="forecast_reliability",
            status="GREEN",
            score=0.0,
            weight=weight,
            reason="Forecast reliable with tight conformal interval and validated benchmark gain",
            metrics=metrics
        )

    def evaluate_weather_flag(
        self,
        weather: Optional[WeatherContext]
    ) -> RiskFlag:
        """
        Flag 6: Weather Risk
        """
        impact = self.weather_engine.evaluate_weather(weather)
        weight = self.weights["weather"]
        return RiskFlag(
            name="weather",
            status=impact.weather_risk_status,
            score=impact.weather_risk_score,
            weight=weight,
            reason=impact.weather_risk_reason,
            metrics={
                "holding_loss_multiplier": impact.holding_loss_multiplier,
                "travel_time_multiplier": impact.travel_time_multiplier,
                "travel_loss_multiplier": impact.travel_loss_multiplier,
                "quality_factor_delta": impact.quality_factor_delta
            }
        )

    def assess_risks(
        self,
        price_drop_flag: RiskFlag,
        arrival_spike_flag: RiskFlag,
        volatility_flag: RiskFlag,
        stale_data_flag: RiskFlag,
        forecast_flag: RiskFlag,
        weather_flag: RiskFlag
    ) -> RiskAssessment:
        """
        Calculates weighted composite risk score and applies deterministic safety overrides:
          R = Σ(w_i * s_i)
          Thresholds:
            R < 0.25 -> GREEN
            0.25 <= R < 0.55 -> YELLOW
            R >= 0.55 -> RED
          Overrides:
            - any Red stale-data -> overall RED
            - any Red forecast -> overall RED
            - 2+ Reds -> overall RED
            - 3+ Yellows -> at least YELLOW
        """
        flags = [
            price_drop_flag,
            arrival_spike_flag,
            volatility_flag,
            stale_data_flag,
            forecast_flag,
            weather_flag
        ]

        # Calculate composite score
        raw_score = sum(f.weight * f.score for f in flags)
        raw_score = round(raw_score, 4)

        if raw_score < self.green_max:
            overall = "GREEN"
        elif raw_score < self.yellow_max:
            overall = "YELLOW"
        else:
            overall = "RED"

        overrides_applied = []
        red_count = sum(1 for f in flags if f.status == "RED")
        yellow_count = sum(1 for f in flags if f.status == "YELLOW")

        # Override 1: any Red stale-data -> Red
        if stale_data_flag.status == "RED":
            if overall != "RED":
                overall = "RED"
                overrides_applied.append("OVERRIDE: Stale data (RED) forces overall RED")

        # Override 2: any Red forecast -> Red
        if forecast_flag.status == "RED":
            if overall != "RED":
                overall = "RED"
                overrides_applied.append("OVERRIDE: Unreliable/OOD forecast (RED) forces overall RED")

        # Override 3: 2+ Reds -> Red
        if red_count >= 2:
            if overall != "RED":
                overall = "RED"
                overrides_applied.append(f"OVERRIDE: Multiple red flags ({red_count}) force overall RED")

        # Override 4: 3+ Yellows -> at least Yellow
        if yellow_count >= 3:
            if overall == "GREEN":
                overall = "YELLOW"
                overrides_applied.append(f"OVERRIDE: Multiple yellow flags ({yellow_count}) force overall YELLOW")

        # Determine Wait vs Go block logic based on Section 22 Red resolution table:
        # | Red source | Wait | Go |
        # | Forecast-only Red | BLOCK | May be allowed only with fresh observed price + strong route |
        # | Stale Red | BLOCK | BLOCK |
        # | Arrival-spike Red | BLOCK | BLOCK |
        # | Multiple critical Reds | BLOCK | BLOCK |
        is_wait_blocked = False
        is_go_blocked = False
        blocking_reasons = []

        if overall == "RED":
            is_wait_blocked = True
            blocking_reasons.append("Overall risk is RED: Future waiting prohibited")

        if stale_data_flag.status == "RED":
            is_wait_blocked = True
            is_go_blocked = True
            blocking_reasons.append("Data is 3+ sessions stale: Wait and Go are both blocked")

        if arrival_spike_flag.status == "RED":
            is_wait_blocked = True
            is_go_blocked = True
            blocking_reasons.append("Severe arrival spike at destination: Wait and Go blocked due to glut risk")

        if red_count >= 2:
            is_wait_blocked = True
            is_go_blocked = True
            blocking_reasons.append(f"Multiple critical red flags ({red_count}): Both Wait and Go blocked")

        if forecast_flag.status == "RED":
            is_wait_blocked = True
            blocking_reasons.append("Forecast reliability is RED: Wait is blocked")

        # Effective score for the record
        final_score = raw_score
        if overall == "RED" and final_score < self.yellow_max:
            final_score = self.yellow_max
        elif overall == "YELLOW" and final_score < self.green_max:
            final_score = self.green_max

        return RiskAssessment(
            overall=overall,
            score=round(final_score, 4),
            raw_score=raw_score,
            flags=flags,
            overrides_applied=overrides_applied,
            is_wait_blocked_by_risk=is_wait_blocked,
            is_go_blocked_by_risk=is_go_blocked,
            blocking_reasons=blocking_reasons
        )
