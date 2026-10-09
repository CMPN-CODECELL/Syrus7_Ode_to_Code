"""
services/decision/reservation_price.py

Reservation & Break-Even Price Calculator for KrishiNirnay.
Project Tagline: "Sahi Bhav Se, Samriddhi Ki Raah Pe"
Authority: SYRUS_PS02_MASTER.md (Sections 12, 18) & SYRUS_PS02_DIVISION_2_DECISION_RISK_ENGINE.md (Section 18)

Definition:
The reservation/break-even price is the future mandi price required for the candidate
alternative (Wait or Go) to beat the baseline net realization after all waiting, routing,
spoilage, financing, labour, and configured expenses:
  P_break_even = (baseline_net + total_costs) / (Q_sold * quality_factor)

Exposed as:
  "Do not accept below ₹X/qtl."
"""

from __future__ import annotations

from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class ReservationPriceResult(BaseModel):
    """Deterministic reservation and break-even price outputs."""
    baseline_net: float = Field(..., description="Baseline net realization in INR (Sell Now)")
    candidate_total_costs: float = Field(..., description="Sum of transport, handling, storage and financing for candidate")
    quantity_sold_qtl: float = Field(..., description="Saleable quantity in quintals after sequential holding and travel loss")
    quality_factor: float = Field(1.0, description="Quality multiplier")
    break_even_price_inr_per_qtl: float = Field(..., description="Mandi price where candidate net == baseline net")
    target_price_with_margin_inr_per_qtl: Optional[float] = Field(
        None,
        description="Mandi price required to achieve the profile's minimum gain gate"
    )
    farmer_guidance_text: str = Field(..., description="Farmer-facing actionable threshold text")


def calculate_reservation_price(
    baseline_net: float,
    total_costs: float,
    quantity_sold_qtl: float,
    quality_factor: float = 1.0,
    required_gain_pct: float = 0.0
) -> ReservationPriceResult:
    """
    Computes exact deterministic break-even and reservation prices.
    
    Formula:
      P_break_even = (baseline_net + total_costs) / (quantity_sold_qtl * quality_factor)
      P_target = (baseline_net * (1 + required_gain_pct) + total_costs) / (quantity_sold_qtl * quality_factor)
    """
    if quantity_sold_qtl <= 0:
        raise ValueError(f"Saleable quantity must be positive, got {quantity_sold_qtl}")
    if quality_factor <= 0:
        raise ValueError(f"Quality factor must be positive, got {quality_factor}")

    effective_q = quantity_sold_qtl * quality_factor

    # Exact break-even price (to match baseline net realization)
    break_even_price = (baseline_net + total_costs) / effective_q
    break_even_price = round(break_even_price, 2)

    # Price required to clear policy gain margin
    target_price = None
    if required_gain_pct > 0:
        target_net = baseline_net * (1.0 + required_gain_pct)
        target_price = round((target_net + total_costs) / effective_q, 2)

    guidance = f"Do not accept below ₹{round(break_even_price)}/qtl at destination mandi."

    return ReservationPriceResult(
        baseline_net=round(baseline_net, 2),
        candidate_total_costs=round(total_costs, 2),
        quantity_sold_qtl=round(quantity_sold_qtl, 4),
        quality_factor=quality_factor,
        break_even_price_inr_per_qtl=break_even_price,
        target_price_with_margin_inr_per_qtl=target_price,
        farmer_guidance_text=guidance
    )
