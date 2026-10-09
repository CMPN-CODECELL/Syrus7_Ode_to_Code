"""
services/decision/explanation_rules.py

Deterministic Explanation Evidence Generator for KrishiNirnay.
Project Tagline: "Sahi Bhav Se, Samriddhi Ki Raah Pe"
Authority: SYRUS_PS02_MASTER.md (Sections 20, 28) & SYRUS_PS02_DIVISION_2_DECISION_RISK_ENGINE.md (Section 28)

Invariants:
1. Every numeric statement shown to the farmer or passed to the LLM must derive
   strictly from the deterministic calculation.
2. The LLM is forbidden from calculating or modifying these numbers.
3. Produces machine-readable evidence items and structured "Why" bullets.
"""

from __future__ import annotations

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from .net_return import NetReturnBreakdown
from .risk_engine import RiskAssessment
from .reservation_price import ReservationPriceResult


class ExplanationPayload(BaseModel):
    """Immutable deterministic explanation evidence."""
    verdict: Optional[str] = Field(None, description="Concise headline verdict")
    why: List[str] = Field(..., description="High-level bulleted rationale for the farmer")
    key_drivers: List[str] = Field(..., description="Top quantitative drivers that determined the outcome")
    evidence: Dict[str, Any] = Field(..., description="Strict machine-readable evidence dictionary")
    spoken_summary: Optional[str] = Field(None, description="Short 3-part spoken text: verdict, net amount, main risk")


def generate_explanation(
    action: str,
    baseline_market: str,
    baseline_sale_day: str,
    baseline_net: float,
    chosen_market: str,
    chosen_sale_day: str,
    chosen_net: float,
    gain_pct: float,
    required_gain_pct: float,
    probability_beat_baseline: Optional[float],
    min_probability_required: float,
    reservation_price_result: Optional[ReservationPriceResult],
    risk_assessment: RiskAssessment,
    holding_days: int,
    net_breakdown: NetReturnBreakdown,
    data_freshness_sessions: int,
    is_route_estimate: bool
) -> ExplanationPayload:
    """
    Constructs deterministic machine-readable explanation and human-facing Why cards.
    """
    why_bullets: List[str] = []
    key_drivers: List[str] = []
    net_delta = chosen_net - baseline_net

    # 1. Action rationale
    if action == "SELL_NOW":
        if holding_days == 0 and chosen_market == baseline_market:
            why_bullets.append(
                f"Selling today at {baseline_market} secures the highest safe net realization (₹{baseline_net:,.0f})."
            )
            key_drivers.append("Sell Now at home mandi minimizes holding loss, transit costs and market downside risk.")
        else:
            why_bullets.append(
                f"Sell Now recommended: Alternative options do not clear safety, margin or probability thresholds."
            )
    elif action == "WAIT":
        why_bullets.append(
            f"Waiting {holding_days} day(s) until {chosen_sale_day} at {chosen_market} yields an estimated net gain of ₹{net_delta:,.0f} (+{gain_pct*100:.1f}%)."
        )
        if probability_beat_baseline is not None:
            why_bullets.append(
                f"High probability of gain ({probability_beat_baseline*100:.1f}% exceeds required {min_probability_required*100:.1f}% gate)."
            )
        key_drivers.append(
            f"Expected price increase clears cumulative holding loss ({net_breakdown.holding_loss_pct*100:.1f}%), storage (₹{net_breakdown.storage_cost:.0f}) and capital interest (₹{net_breakdown.financing_cost:.0f})."
        )
    elif action == "GO":
        why_bullets.append(
            f"Transporting to {chosen_market} on {chosen_sale_day} yields an extra net realization of ₹{net_delta:,.0f} (+{gain_pct*100:.1f}%)."
        )
        key_drivers.append(
            f"Higher destination price comfortably overcomes transport costs (₹{net_breakdown.transport_cost:.0f}) and transit shrinkage ({net_breakdown.travel_loss_pct*100:.2f}%)."
        )
    elif action == "INSUFFICIENT_EVIDENCE":
        why_bullets.append(
            "Cannot safely recommend waiting or traveling: market data or forecast uncertainty does not meet evidence gates."
        )

    # 2. Reservation Price Driver
    if reservation_price_result is not None:
        key_drivers.append(reservation_price_result.farmer_guidance_text)

    # 3. Risk Drivers
    if risk_assessment.overall == "GREEN":
        why_bullets.append("Market risk is low (GREEN): stable prices, normal arrivals, and favorable weather.")
    elif risk_assessment.overall == "YELLOW":
        yellow_reasons = [f.reason for f in risk_assessment.flags if f.status == "YELLOW"]
        why_bullets.append(f"Moderate market risk (YELLOW): {'; '.join(yellow_reasons[:2])}.")
    elif risk_assessment.overall == "RED":
        red_reasons = [f.reason for f in risk_assessment.flags if f.status == "RED"]
        why_bullets.append(f"High risk alert (RED): {'; '.join(red_reasons[:2])}.")

    # 4. Freshness and Route Drivers
    if data_freshness_sessions > 1:
        key_drivers.append(f"Market data is from {data_freshness_sessions} expected trading sessions ago.")
    if is_route_estimate:
        key_drivers.append("Transport distance based on road-factor estimate; live route check recommended before dispatch.")

    # 5. Machine-readable evidence dictionary
    evidence = {
        "baseline_market": baseline_market,
        "baseline_sale_day": baseline_sale_day,
        "baseline_net_inr": round(baseline_net, 2),
        "chosen_market": chosen_market,
        "chosen_sale_day": chosen_sale_day,
        "chosen_net_inr": round(chosen_net, 2),
        "net_delta_inr": round(net_delta, 2),
        "gain_pct": round(gain_pct, 4),
        "required_gain_pct": round(required_gain_pct, 4),
        "probability_beat_baseline": round(probability_beat_baseline, 4) if probability_beat_baseline is not None else None,
        "min_probability_required": round(min_probability_required, 4),
        "reservation_price_inr_per_qtl": (
            reservation_price_result.break_even_price_inr_per_qtl if reservation_price_result else None
        ),
        "overall_risk": risk_assessment.overall,
        "risk_score": risk_assessment.score,
        "risk_flags": {f.name: f.status for f in risk_assessment.flags},
        "holding_loss_pct": round(net_breakdown.holding_loss_pct, 4),
        "travel_loss_pct": round(net_breakdown.travel_loss_pct, 4),
        "quantity_sold_qtl": round(net_breakdown.quantity_sold_qtl, 4),
        "transport_cost_inr": round(net_breakdown.transport_cost, 2),
        "storage_cost_inr": round(net_breakdown.storage_cost, 2),
        "financing_cost_inr": round(net_breakdown.financing_cost, 2),
        "hamali_cost_inr": round(net_breakdown.hamali_tolai_cost, 2),
        "data_freshness_sessions": data_freshness_sessions,
        "is_route_estimate": is_route_estimate
    }

    # 6. Concise spoken summary (3 parts: verdict, net amount, main risk)
    if action == "SELL_NOW":
        verdict = f"Sell Now at {baseline_market}"
    elif action == "WAIT":
        verdict = f"Wait {holding_days} days to sell at {chosen_market}"
    elif action == "GO":
        verdict = f"Go to {chosen_market} today"
    else:
        verdict = "Insufficient Evidence"

    spoken_summary = (
        f"Verdict: {verdict}. Net amount: ₹{round(chosen_net):,}. "
        f"Risk: {risk_assessment.overall}."
    )

    return ExplanationPayload(
        verdict=verdict,
        why=why_bullets,
        key_drivers=key_drivers,
        evidence=evidence,
        spoken_summary=spoken_summary
    )
