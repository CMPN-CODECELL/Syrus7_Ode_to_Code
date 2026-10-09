"""
services/decision/net_return.py

Canonical Net-Return Engine for KrishiNirnay.
Project Tagline: "Sahi Bhav Se, Samriddhi Ki Raah Pe"
Authority: SYRUS_PS02_MASTER.md (Sections 7, 11) & SYRUS_PS02_DIVISION_2_DECISION_RISK_ENGINE.md (Sections 5, 6, 9, 10)

This is the SINGLE PRODUCTION IMPLEMENTATION of the financial calculation.
Invariants:
1. Everything financial uses:
   price = INR/qtl
   quantity = qtl
2. Sequential internal loss implementation:
   Q_after_holding = Q * Π(1 - daily_holding_loss[d])
   Q_sold = Q_after_holding * Π(1 - hourly_travel_loss[h])
3. Revenue = Q_sold * price * quality_factor
4. Net = Revenue - transport - hamali/tolai - commission/fees - storage - financing
5. Spoilage is NEVER double-counted.
"""

from __future__ import annotations

import math
from typing import Sequence
from pydantic import BaseModel, Field


class UnitConversionError(ValueError):
    """Raised when unit conversion fails or ambiguous inputs are supplied."""
    pass


class NetReturnBreakdown(BaseModel):
    """Detailed immutable breakdown of the canonical net-return calculation."""
    quantity_qtl: float = Field(..., description="Original lot quantity in quintals")
    holding_loss_pct: float = Field(..., description="Effective cumulative holding loss fraction")
    quantity_after_holding_qtl: float = Field(..., description="Quantity remaining after storage/holding")
    travel_loss_pct: float = Field(..., description="Effective cumulative travel loss fraction")
    quantity_sold_qtl: float = Field(..., description="Final saleable quantity in quintals (Q_sold)")
    spoilage_loss_qtl: float = Field(..., description="Total quantity lost to spoilage/shrinkage (Q - Q_sold)")
    price_inr_per_qtl: float = Field(..., description="Mandi price in INR/quintal")
    quality_factor: float = Field(default=1.0, description="Quality multiplier (default 1.0)")
    gross_revenue: float = Field(..., description="Gross revenue = Q_sold * price * quality_factor")
    transport_cost: float = Field(default=0.0, description="Transport cost in INR")
    hamali_tolai_cost: float = Field(default=0.0, description="Labour, hamali, loading/unloading in INR")
    commission_and_fees: float = Field(default=0.0, description="Mandi commission and market cess in INR")
    storage_cost: float = Field(default=0.0, description="Holding/storage rental cost in INR")
    financing_cost: float = Field(default=0.0, description="Capital interest cost tied up during holding in INR")
    total_costs: float = Field(..., description="Sum of all logistics, handling and holding expenses")
    net_realization: float = Field(..., description="Net return = Revenue - total_costs")


def normalize_quantity_to_qtl(
    quantity: float,
    unit: str,
    bag_weight_kg: float | None = None
) -> float:
    """
    Converts quantity from any supported unit to quintals (qtl).
    
    Conversions:
      1 qtl = 100 kg
      1 tonne = 10 qtl
      kg -> qtl = kg / 100
      tonne -> qtl = tonne * 10
      bags -> qtl = bag_count * bag_weight_kg / 100
    
    If bag weight is unknown, does NOT guess it. Raises UnitConversionError.
    """
    if quantity <= 0:
        raise UnitConversionError(f"Quantity must be strictly positive, got {quantity}")

    clean_unit = unit.strip().lower()
    if clean_unit in ("qtl", "quintal", "quintals"):
        return float(quantity)
    elif clean_unit in ("kg", "kilogram", "kilograms"):
        return float(quantity) / 100.0
    elif clean_unit in ("tonne", "tonnes", "ton", "tons", "mt"):
        return float(quantity) * 10.0
    elif clean_unit in ("bag", "bags", "katta", "khatta", "potan"):
        if bag_weight_kg is None or bag_weight_kg <= 0:
            raise UnitConversionError(
                f"Bag weight is required to convert '{unit}' to quintals. "
                "Do NOT guess bag weight. Please specify bag_weight_kg."
            )
        return float(quantity) * float(bag_weight_kg) / 100.0
    else:
        raise UnitConversionError(
            f"Unsupported quantity unit '{unit}'. Supported units: 'qtl', 'kg', 'tonne', 'bags'."
        )


def compute_holding_loss_sequential(
    holding_days: int,
    commodity: str = "tomato",
    custom_daily_losses: Sequence[float] | None = None,
    spoilage_config: dict | None = None,
    weather_multiplier: float = 1.0
) -> list[float]:
    """
    Returns sequential daily holding losses Π(1 - daily_holding_loss[d]).
    
    Starting prototype priors from Master / Division 2:
    Tomato:
      days 0-2: ~1.0%/day
      days 3-5: ~3.5%/day
      days 6+:  ~7.0%/day
    Onion:
      days 0-2: ~0.10%/day
      days 3-5: ~0.15%/day
      days 6+:  ~0.20%/day
    """
    if holding_days <= 0:
        return []

    if custom_daily_losses is not None:
        return [float(loss) * weather_multiplier for loss in custom_daily_losses]

    comm = commodity.strip().lower()
    daily_rates: list[float] = []

    # Default rates from prototype specification
    for day_idx in range(holding_days):
        if "tomato" in comm:
            if day_idx < 2:
                rate = 0.010
            elif day_idx < 5:
                rate = 0.035
            else:
                rate = 0.070
        elif "onion" in comm:
            if day_idx < 2:
                rate = 0.0010
            elif day_idx < 5:
                rate = 0.0015
            else:
                rate = 0.0020
        else:
            # Fallback conservative default
            rate = 0.010

        daily_rates.append(rate * weather_multiplier)

    return daily_rates


def compute_travel_loss_sequential(
    travel_time_hours: float,
    commodity: str = "tomato",
    packaging: str = "crates",
    custom_hourly_losses: Sequence[float] | None = None,
    weather_multiplier: float = 1.0
) -> list[float]:
    """
    Returns sequential hourly travel losses Π(1 - hourly_travel_loss[h]).
    
    Starting prototype priors:
    Tomato:
      crates: 0.15%/hr (0.0015)
      loose bags: 0.40%/hr (0.0040)
    Onion:
      0.05%/hr (0.0005)
    """
    if travel_time_hours <= 0:
        return []

    if custom_hourly_losses is not None:
        return [float(loss) * weather_multiplier for loss in custom_hourly_losses]

    comm = commodity.strip().lower()
    pkg = packaging.strip().lower()

    if "tomato" in comm:
        base_rate = 0.0040 if ("bag" in pkg or "loose" in pkg) else 0.0015
    elif "onion" in comm:
        base_rate = 0.0005
    else:
        base_rate = 0.0010

    effective_rate = base_rate * weather_multiplier
    full_hours = int(math.floor(travel_time_hours))
    fractional_hour = travel_time_hours - full_hours

    rates = [effective_rate] * full_hours
    if fractional_hour > 0:
        rates.append(effective_rate * fractional_hour)

    return rates


def calculate_financing_cost(
    capital_tied_up_inr: float,
    holding_days: int,
    annual_rate: float = 0.12
) -> float:
    """
    Computes interest / financing cost for holding produce:
      finance_cost = capital_tied_up * annual_rate * holding_days / 365
    """
    if holding_days <= 0 or capital_tied_up_inr <= 0 or annual_rate <= 0:
        return 0.0
    return float(capital_tied_up_inr * annual_rate * holding_days / 365.0)


def calculate_storage_cost(
    quantity_qtl: float,
    holding_days: int,
    rate_per_qtl_day: float = 2.0
) -> float:
    """
    Computes holding / storage rental charges:
      storage_cost = quantity_qtl * rate_per_qtl_day * holding_days
    """
    if holding_days <= 0 or quantity_qtl <= 0 or rate_per_qtl_day <= 0:
        return 0.0
    return float(quantity_qtl * rate_per_qtl_day * holding_days)


def calculate_net_return(
    quantity_qtl: float,
    price_inr_per_qtl: float,
    daily_holding_losses: Sequence[float] = (),
    hourly_travel_losses: Sequence[float] = (),
    quality_factor: float = 1.0,
    transport_cost: float = 0.0,
    hamali_tolai_cost: float = 0.0,
    commission_and_fees: float = 0.0,
    storage_cost: float = 0.0,
    financing_cost: float = 0.0
) -> NetReturnBreakdown:
    """
    The CANONICAL net-return calculation for KrishiNirnay.
    
    Sequential implementation:
      Q_after_holding = Q * Π(1 - daily_holding_loss[d])
      Q_sold = Q_after_holding * Π(1 - hourly_travel_loss[h])
      Revenue = Q_sold * price * quality_factor
      Net = Revenue - transport - hamali/tolai - commission/fees - storage - financing
      
    Critical Invariants:
    - Never add loss percentages directly when losses occur sequentially.
    - Spoilage is NEVER double-counted (lost volume is already excluded from Revenue,
      and not subtracted a second time from Net).
    """
    if quantity_qtl <= 0:
        raise ValueError(f"Quantity must be positive, got {quantity_qtl}")
    if price_inr_per_qtl < 0:
        raise ValueError(f"Price cannot be negative, got {price_inr_per_qtl}")
    if quality_factor <= 0 or quality_factor > 1.0:
        raise ValueError(f"Quality factor must be in (0, 1.0], got {quality_factor}")

    # 1. Sequential holding loss
    holding_factor = 1.0
    for loss in daily_holding_losses:
        loss_clamped = max(0.0, min(1.0, float(loss)))
        holding_factor *= (1.0 - loss_clamped)

    q_after_holding = quantity_qtl * holding_factor

    # 2. Sequential travel loss
    travel_factor = 1.0
    for loss in hourly_travel_losses:
        loss_clamped = max(0.0, min(1.0, float(loss)))
        travel_factor *= (1.0 - loss_clamped)

    q_sold = q_after_holding * travel_factor
    spoilage_loss_qtl = quantity_qtl - q_sold

    # Effective cumulative percentages
    holding_loss_pct = 1.0 - holding_factor
    travel_loss_pct = 1.0 - travel_factor

    # 3. Gross revenue
    gross_revenue = q_sold * price_inr_per_qtl * quality_factor

    # 4. Total explicit costs
    total_costs = (
        float(transport_cost) +
        float(hamali_tolai_cost) +
        float(commission_and_fees) +
        float(storage_cost) +
        float(financing_cost)
    )

    # 5. Net realization
    # Note: Spoilage is reflected in q_sold. Do NOT subtract spoilage_loss_qtl * price again!
    net_realization = gross_revenue - total_costs

    return NetReturnBreakdown(
        quantity_qtl=float(quantity_qtl),
        holding_loss_pct=float(holding_loss_pct),
        quantity_after_holding_qtl=float(q_after_holding),
        travel_loss_pct=float(travel_loss_pct),
        quantity_sold_qtl=float(q_sold),
        spoilage_loss_qtl=float(spoilage_loss_qtl),
        price_inr_per_qtl=float(price_inr_per_qtl),
        quality_factor=float(quality_factor),
        gross_revenue=float(gross_revenue),
        transport_cost=float(transport_cost),
        hamali_tolai_cost=float(hamali_tolai_cost),
        commission_and_fees=float(commission_and_fees),
        storage_cost=float(storage_cost),
        financing_cost=float(financing_cost),
        total_costs=float(total_costs),
        net_realization=float(net_realization)
    )
