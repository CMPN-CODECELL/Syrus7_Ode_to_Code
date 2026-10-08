"""
tests/unit/test_net_return.py

Unit tests for canonical net-return formula, sequential spoilage,
unit contract, and regression invariants.
"""

import pytest
import math
from services.decision.net_return import (
    calculate_net_return,
    normalize_quantity_to_qtl,
    compute_holding_loss_sequential,
    compute_travel_loss_sequential,
    calculate_storage_cost,
    calculate_financing_cost,
    UnitConversionError
)


def test_unit_conversion_contract():
    """Verify frozen unit contract conversions."""
    # 1 qtl = 100 kg
    assert normalize_quantity_to_qtl(100, "kg") == 1.0
    assert normalize_quantity_to_qtl(2500, "kg") == 25.0
    
    # 1 tonne = 10 qtl
    assert normalize_quantity_to_qtl(1, "tonne") == 10.0
    assert normalize_quantity_to_qtl(2.5, "tonne") == 25.0
    
    # qtl identity
    assert normalize_quantity_to_qtl(25, "qtl") == 25.0
    
    # Bags conversion with explicit weight
    # 50 bags * 50 kg = 2500 kg = 25 qtl
    assert normalize_quantity_to_qtl(50, "bags", bag_weight_kg=50.0) == 25.0
    
    # Ambiguous bags without bag weight MUST raise error (do NOT guess!)
    with pytest.raises(UnitConversionError):
        normalize_quantity_to_qtl(50, "bags", bag_weight_kg=None)
        
    with pytest.raises(UnitConversionError):
        normalize_quantity_to_qtl(50, "bags", bag_weight_kg=0)

    # Unknown unit
    with pytest.raises(UnitConversionError):
        normalize_quantity_to_qtl(50, "crates")


def test_no_double_counted_spoilage():
    """
    CRITICAL REGRESSION TEST:
    Spoilage reduces quantity sold (Q_sold).
    Gross revenue is Q_sold * P * quality_factor.
    The lost quantity's monetary value must NEVER be deducted again from Net!
    """
    quantity_qtl = 20.0
    price_inr = 1800.0
    # 2% holding loss, 1% travel loss
    daily_holding = [0.02]
    hourly_travel = [0.01]
    
    bd = calculate_net_return(
        quantity_qtl=quantity_qtl,
        price_inr_per_qtl=price_inr,
        daily_holding_losses=daily_holding,
        hourly_travel_losses=hourly_travel,
        transport_cost=1440.0,
        hamali_tolai_cost=240.0,
        storage_cost=80.0,
        financing_cost=22.33
    )
    
    # Expected sequential Q_sold = 20 * 0.98 * 0.99 = 19.404
    assert math.isclose(bd.quantity_sold_qtl, 19.404, rel_tol=1e-5)
    
    # Gross revenue must strictly equal Q_sold * P
    expected_revenue = 19.404 * 1800.0 # 34927.20
    assert math.isclose(bd.gross_revenue, expected_revenue, rel_tol=1e-5)
    
    total_costs = 1440.0 + 240.0 + 80.0 + 22.33 # 1782.33
    assert math.isclose(bd.total_costs, total_costs, rel_tol=1e-5)
    
    # Correct net realization = Gross Revenue - Total Costs
    expected_net = expected_revenue - total_costs
    assert math.isclose(bd.net_realization, expected_net, rel_tol=1e-5)
    
    # INVARIANT PROOF:
    # If someone erroneously deducted spoilage value again:
    spoilage_value = (quantity_qtl - bd.quantity_sold_qtl) * price_inr
    erroneous_double_counted_net = expected_revenue - total_costs - spoilage_value
    assert bd.net_realization > erroneous_double_counted_net
    assert not math.isclose(bd.net_realization, erroneous_double_counted_net)


def test_sequential_loss_vs_direct_sum():
    """Sequential losses Π(1-loss) must not be added directly."""
    # Day 1: 5%, Day 2: 5%
    q = 100.0
    daily_losses = [0.05, 0.05]
    
    bd = calculate_net_return(
        quantity_qtl=q,
        price_inr_per_qtl=1000.0,
        daily_holding_losses=daily_losses
    )
    # Sequential: 100 * 0.95 * 0.95 = 90.25 qtl
    # Direct sum would have given: 100 * (1 - 0.10) = 90.00 qtl
    assert math.isclose(bd.quantity_sold_qtl, 90.25, rel_tol=1e-5)
    assert not math.isclose(bd.quantity_sold_qtl, 90.00, rel_tol=1e-5)


def test_zero_spoilage():
    """Produce with zero transit or holding losses."""
    bd = calculate_net_return(
        quantity_qtl=25.0,
        price_inr_per_qtl=2000.0,
        daily_holding_losses=[],
        hourly_travel_losses=[],
        quality_factor=1.0,
        transport_cost=1000.0,
        hamali_tolai_cost=300.0
    )
    assert bd.quantity_sold_qtl == 25.0
    assert bd.gross_revenue == 50000.0
    assert bd.net_realization == 50000.0 - 1300.0 # 48,700.0


def test_travel_loss_only():
    """Produce sold on day 0 with only 1% travel loss."""
    bd = calculate_net_return(
        quantity_qtl=20.0,
        price_inr_per_qtl=1800.0,
        daily_holding_losses=[],
        hourly_travel_losses=[0.01],
        transport_cost=1440.0,
        hamali_tolai_cost=240.0
    )
    # Q_sold = 20 * 0.99 = 19.8
    assert math.isclose(bd.quantity_sold_qtl, 19.8, rel_tol=1e-5)
    assert math.isclose(bd.gross_revenue, 35640.0, rel_tol=1e-5)
    # Net = 35640 - 1440 - 240 = 33960
    assert math.isclose(bd.net_realization, 33960.0, rel_tol=1e-5)


def test_quality_factor_less_than_one():
    """Lower quality factor scales revenue deterministically."""
    bd = calculate_net_return(
        quantity_qtl=20.0,
        price_inr_per_qtl=1800.0,
        quality_factor=0.90,
        transport_cost=1000.0
    )
    # Revenue = 20 * 1800 * 0.90 = 32,400
    assert math.isclose(bd.gross_revenue, 32400.0, rel_tol=1e-5)
    assert math.isclose(bd.net_realization, 31400.0, rel_tol=1e-5)


def test_storage_and_financing_costs():
    """Verify storage and financing cost calculations."""
    # 20 quintals, 2 days, 2 Rs/qtl/day = 80 Rs
    storage = calculate_storage_cost(quantity_qtl=20.0, holding_days=2, rate_per_qtl_day=2.0)
    assert storage == 80.0
    
    # Zero storage cost when holding_days = 0
    assert calculate_storage_cost(quantity_qtl=20.0, holding_days=0, rate_per_qtl_day=2.0) == 0.0
    
    # Financing: 33,960 tied up for 2 days at 12% p.a.
    fin = calculate_financing_cost(capital_tied_up_inr=33960.0, holding_days=2, annual_rate=0.12)
    # 33960 * 0.12 * 2 / 365 = 22.33
    assert math.isclose(fin, 22.33, rel_tol=1e-2)


def test_extreme_prices():
    """Handles extreme high and floor prices correctly."""
    # Extreme high
    bd_high = calculate_net_return(quantity_qtl=10.0, price_inr_per_qtl=15000.0)
    assert bd_high.net_realization == 150000.0
    
    # Extreme low / zero price
    bd_zero = calculate_net_return(quantity_qtl=10.0, price_inr_per_qtl=0.0, transport_cost=500.0)
    assert bd_zero.net_realization == -500.0
