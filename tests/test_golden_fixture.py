"""Golden Fixture Verification Tests.
Asserts that all calculations match Master Section 24 down to the exact rupee.
"""

import pytest
from apps.api.mock_engine.deterministic_engine import engine

def test_golden_fixture_values():
    # 20 qtl tomato, current price ₹1,800/q, 60 km, ₹12/km round trip
    rec = engine.analyze_sale_decision(
        commodity="Tomato",
        quantity=20.0,
        home_mandi="Nashik APMC",
        requested_wait_days=2
    )

    # 1. Baseline Sell Now Net: exactly ₹33,960
    assert rec.baseline.net_total == 33960.0
    assert rec.baseline.modal_price == 1800.0
    assert rec.baseline.cost_breakdown.transport == 1440.0
    assert rec.baseline.cost_breakdown.hamali_tolai == 240.0

    # 2. Wait 2 Days at expected ₹1,950: exactly ₹36,055
    assert rec.chosen.action == "WAIT"
    assert rec.chosen.net_total == 36055.0
    assert rec.chosen.gain_total == 2095.0

    # 3. Reservation Break-Even Price: ~₹1,842/qtl
    assert abs(rec.chosen.reservation_price - 1842.0) <= 2.0

    # 4. Probability of beating baseline: ~62.4%
    assert abs(rec.chosen.probability_beat_baseline - 0.624) <= 0.01

    # 5. Invariant: No double-spoilage deduction
    # Quantity was reduced by sequential loss (20 -> 19.6 -> 19.404 qtl)
    # The cost breakdown must NOT have an additional negative monetary deduction for spoilage!
    cb = rec.chosen.cost_breakdown
    assert cb.quantity_sold_qtl < 20.0
    calculated_deductions = cb.transport + cb.hamali_tolai + cb.storage + cb.financing
    assert abs((cb.gross_revenue - calculated_deductions) - cb.final_net) < 1.0
