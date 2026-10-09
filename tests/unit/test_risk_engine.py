"""
tests/unit/test_risk_engine.py

Unit tests for the six-risk engine, flag scoring, composite thresholds,
safety overrides, and Wait/Go blocks.
"""

import pytest
from services.decision.risk_engine import (
    SixRiskEngine,
    RiskFlag,
    RiskAssessment
)


def test_price_drop_flag():
    """Verify Flag 1: Price drop Yellow and Red thresholds."""
    engine = SixRiskEngine()
    today_p = 2000.0
    
    # Normal / Green
    f_green = engine.evaluate_price_drop_flag(
        today_price=today_p,
        q20_price=2050.0,
        prob_price_drop=0.30,
        price_change_3d_pct=0.02
    )
    assert f_green.status == "GREEN"
    assert f_green.score == 0.0

    # Yellow: drop prob >= 55% or q20 <= 97% or 3d change <= -10%
    f_yellow = engine.evaluate_price_drop_flag(
        today_price=today_p,
        q20_price=1900.0, # 95% <= 97%
        prob_price_drop=0.40,
        price_change_3d_pct=-0.05
    )
    assert f_yellow.status == "YELLOW"
    assert f_yellow.score == 0.5

    # Red: drop prob >= 70% or q20 <= 92% or 3d change <= -15%
    f_red = engine.evaluate_price_drop_flag(
        today_price=today_p,
        q20_price=1800.0, # 90% <= 92%
        prob_price_drop=0.75,
        price_change_3d_pct=-0.16
    )
    assert f_red.status == "RED"
    assert f_red.score == 1.0


def test_arrival_spike_and_post_closure_catchup():
    """Verify Flag 2: Arrival spike and closure catch-up suppression."""
    engine = SixRiskEngine()
    history = [100.0, 110.0, 95.0, 105.0, 100.0, 100.0, 90.0, 100.0] # median 100
    
    # Normal arrivals
    f_normal = engine.evaluate_arrival_spike_flag(today_arrivals=100.0, prior_8w_same_weekday_arrivals=history)
    assert f_normal.status == "GREEN"
    
    # 2x arrivals (Red)
    f_spike = engine.evaluate_arrival_spike_flag(today_arrivals=210.0, prior_8w_same_weekday_arrivals=history)
    assert f_spike.status == "RED"
    assert f_spike.score == 1.0

    # Post-closure catch-up: Monday after Sunday closure must NOT be flagged as spike
    f_catchup = engine.evaluate_arrival_spike_flag(
        today_arrivals=210.0,
        prior_8w_same_weekday_arrivals=history,
        is_post_closure_catchup=True
    )
    assert f_catchup.status == "GREEN"
    assert f_catchup.score == 0.0


def test_stale_data_flag():
    """Verify Flag 4: Stale data based on expected trading sessions."""
    engine = SixRiskEngine()
    
    # 0-1 sessions = Fresh / Green
    assert engine.evaluate_stale_data_flag(expected_trading_age_sessions=1).status == "GREEN"
    
    # 2 sessions = Yellow
    f2 = engine.evaluate_stale_data_flag(expected_trading_age_sessions=2)
    assert f2.status == "YELLOW"
    assert f2.score == 0.5
    
    # 3+ sessions = RED (current trading blocked)
    f3 = engine.evaluate_stale_data_flag(expected_trading_age_sessions=3)
    assert f3.status == "RED"
    assert f3.score == 1.0


def test_forecast_reliability_flag():
    """Verify Flag 5: Uncertainty width, MASE, coverage, and OOD."""
    engine = SixRiskEngine()
    
    # Normal / Green
    f_good = engine.evaluate_forecast_reliability_flag(q10=1800, q50=2000, q90=2200, rolling_mase=0.6, rolling_80_coverage=0.80)
    assert f_good.status == "GREEN"

    # Red via OOD (out of range)
    f_ood = engine.evaluate_forecast_reliability_flag(q10=1800, q50=2000, q90=2200, out_of_range=True)
    assert f_ood.status == "RED"

    # Red via MASE > 1.0
    f_mase = engine.evaluate_forecast_reliability_flag(q10=1800, q50=2000, q90=2200, rolling_mase=1.2)
    assert f_mase.status == "RED"


def test_safety_overrides():
    """
    Overrides:
      - any Red stale-data -> overall RED
      - any Red forecast -> overall RED
      - 2+ Reds -> overall RED
      - 3+ Yellows -> at least YELLOW
    """
    engine = SixRiskEngine()
    
    def make_flag(name, status, score, weight):
        return RiskFlag(name=name, status=status, score=score, weight=weight, reason="test")

    # Override 1: Red stale data alone forces overall RED
    p_drop = make_flag("price_drop", "GREEN", 0.0, 0.25)
    arr_spike = make_flag("arrival_spike", "GREEN", 0.0, 0.20)
    vol = make_flag("volatility", "GREEN", 0.0, 0.15)
    stale = make_flag("stale_data", "RED", 1.0, 0.15)
    fc = make_flag("forecast_reliability", "GREEN", 0.0, 0.15)
    wth = make_flag("weather", "GREEN", 0.0, 0.10)
    # Raw score = 0.15 * 1.0 = 0.15 (< 0.25 Green threshold)
    res_stale = engine.assess_risks(p_drop, arr_spike, vol, stale, fc, wth)
    assert res_stale.overall == "RED"
    assert any("Stale data" in o for o in res_stale.overrides_applied)
    assert res_stale.is_wait_blocked_by_risk is True
    assert res_stale.is_go_blocked_by_risk is True

    # Override 2: 3+ Yellows forces at least YELLOW
    f_p_y = make_flag("price_drop", "YELLOW", 0.5, 0.25)
    f_a_y = make_flag("arrival_spike", "YELLOW", 0.5, 0.20)
    f_v_y = make_flag("volatility", "YELLOW", 0.5, 0.15)
    f_s_g = make_flag("stale_data", "GREEN", 0.0, 0.15)
    f_f_g = make_flag("forecast_reliability", "GREEN", 0.0, 0.15)
    f_w_g = make_flag("weather", "GREEN", 0.0, 0.10)
    # Raw score = 0.25*0.5 + 0.20*0.5 + 0.15*0.5 = 0.30 (already yellow, but let's test lower)
    res_yellows = engine.assess_risks(f_p_y, f_a_y, f_v_y, f_s_g, f_f_g, f_w_g)
    assert res_yellows.overall == "YELLOW"
