"""
tests/unit/test_reservation_price.py

Unit tests for deterministic break-even and reservation price calculation.
"""

import pytest
import math
from services.decision.reservation_price import calculate_reservation_price


def test_fixture_1_break_even_price():
    """
    Assert exact match for Golden Fixture 1 break-even price:
    Baseline Net = 33,960
    Candidate Costs = 1440 (trans) + 240 (hamali) + 80 (storage) + 22.33 (fin) = 1782.33
    Q_sold = 20 * (1 - 0.02) * (1 - 0.01) = 19.404
    P_break_even = (33960 + 1782.33) / 19.404 = 1842.008 -> ~₹1,842/qtl.
    """
    baseline_net = 33960.0
    total_costs = 1440.0 + 240.0 + 80.0 + 22.33 # 1782.33
    q_sold = 19.404
    
    res = calculate_reservation_price(
        baseline_net=baseline_net,
        total_costs=total_costs,
        quantity_sold_qtl=q_sold,
        quality_factor=1.0
    )
    
    assert math.isclose(res.break_even_price_inr_per_qtl, 1842.01, rel_tol=1e-3)
    assert round(res.break_even_price_inr_per_qtl) == 1842
    assert "₹1842/qtl" in res.farmer_guidance_text


def test_reservation_price_with_quality_discount():
    """Lower quality factor raises break-even mandi price required to match baseline."""
    baseline_net = 30000.0
    total_costs = 2000.0
    q_sold = 20.0
    
    # Standard quality (1.0)
    res_std = calculate_reservation_price(baseline_net, total_costs, q_sold, quality_factor=1.0)
    # (30000 + 2000) / 20 = 1600.0
    assert res_std.break_even_price_inr_per_qtl == 1600.0

    # Discounted quality (0.8)
    res_disc = calculate_reservation_price(baseline_net, total_costs, q_sold, quality_factor=0.8)
    # (30000 + 2000) / (20 * 0.8) = 2000.0
    assert res_disc.break_even_price_inr_per_qtl == 2000.0
