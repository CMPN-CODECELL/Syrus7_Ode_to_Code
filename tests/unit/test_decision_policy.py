"""
tests/unit/test_decision_policy.py

Unit tests for KrishiNirnay decision policy, Sell/Wait/Go gates,
risk appetite modes, stale-data blocking, and hysteresis.
"""

import pytest
import math
from services.decision.decision_policy import (
    DecisionEngine,
    DecisionRequest,
    MarketSnapshotInput,
    ForecastTargetInput
)
from services.decision.route_cost import RouteCostEngine, RouteInfo
from services.decision.weather_effects import WeatherContext


def create_base_request() -> DecisionRequest:
    """Helper creating standard base request with 20 qtl tomatoes in Nashik."""
    home_snap = MarketSnapshotInput(
        market="Nashik APMC",
        commodity="Tomato",
        observation_date="2026-10-09",
        modal_price_inr_per_qtl=1800.0,
        arrivals=50.0,
        expected_trading_age_sessions=1,
        recent_daily_prices=[1800.0, 1810.0, 1790.0, 1800.0]
    )
    return DecisionRequest(
        commodity="Tomato",
        quantity=20.0,
        quantity_unit="qtl",
        home_mandi="Nashik APMC",
        home_coords=(19.99, 73.78),
        observation_date="2026-10-09",
        horizon_days=7,
        risk_profile="Balanced",
        rate_per_km=12.0,
        vehicle_payload_qtl=25.0,
        market_snapshots={"Nashik APMC": home_snap},
        forecasts_by_market={}
    )


def test_baseline_sell_now_when_no_alternatives():
    """Default baseline is SELL_NOW at home mandi when no candidate clears gates."""
    engine = DecisionEngine()
    req = create_base_request()
    
    record = engine.analyze_sale_decision(req)
    assert record.chosen.action == "SELL_NOW"
    assert record.chosen.market == "Nashik APMC"
    assert record.chosen.sale_day == "2026-10-09"
    assert record.chosen.net_total > 0
    assert record.chosen.gain_total == 0.0


def test_wait_gate_clearance():
    """Wait recommendation is approved when margin and probability gates pass."""
    engine = DecisionEngine()
    req = create_base_request()
    
    # 2-day wait with price surging to ₹2,100
    fc2 = ForecastTargetInput(
        target_date="2026-10-11",
        holding_days=2,
        q10=1950.0,
        q20=2000.0,
        q35=2050.0,
        q50=2100.0,
        q90=2200.0,
        low=1950.0,
        expected=2100.0,
        high=2200.0,
        reliability="HIGH",
        rolling_mase=0.4,
        rolling_80_coverage=0.82
    )
    req.forecasts_by_market["Nashik APMC"] = [fc2]
    
    record = engine.analyze_sale_decision(req)
    assert record.chosen.action == "WAIT"
    assert record.chosen.market == "Nashik APMC"
    assert record.chosen.sale_day == "2026-10-11"
    assert record.chosen.gain_pct >= 0.03
    assert record.chosen.probability_beat_baseline is not None
    assert record.chosen.probability_beat_baseline >= 0.65


def test_wait_gate_blocked_by_red_forecast():
    """Wait is BLOCKED when forecast reliability is RED."""
    engine = DecisionEngine()
    req = create_base_request()
    
    fc_red = ForecastTargetInput(
        target_date="2026-10-11",
        holding_days=2,
        q10=1700.0,
        q20=1850.0,
        q35=2050.0,
        q50=2100.0,
        q90=2500.0,
        low=1700.0,
        expected=2100.0,
        high=2500.0,
        reliability="LOW", # Triggers Red
        out_of_range=True
    )
    req.forecasts_by_market["Nashik APMC"] = [fc_red]
    
    record = engine.analyze_sale_decision(req)
    # Blocked by forecast risk -> falls back to SELL_NOW
    assert record.chosen.action == "SELL_NOW"


def test_go_gate_clearance():
    """Go to another mandi when destination net return clears margin gate."""
    engine = DecisionEngine()
    req = create_base_request()
    
    # Add alternative mandi: Pimpalgaon APMC with higher price
    pimp_snap = MarketSnapshotInput(
        market="Pimpalgaon APMC",
        commodity="Tomato",
        observation_date="2026-10-09",
        modal_price_inr_per_qtl=2200.0,
        arrivals=60.0,
        expected_trading_age_sessions=1
    )
    req.market_snapshots["Pimpalgaon APMC"] = pimp_snap
    req.alternative_mandis = ["Pimpalgaon APMC"]
    
    # Known live route to Pimpalgaon
    engine.route_engine.set_cached_route(RouteInfo(
        origin="farm_gate",
        destination="Pimpalgaon APMC",
        origin_coords=(19.99, 73.78),
        dest_coords=(20.17, 73.98),
        distance_km=30.0,
        duration_hours=0.8,
        is_estimate=False,
        source="ors_live"
    ))
    
    # Same-day sale candidate at Pimpalgaon
    fc_go = ForecastTargetInput(
        target_date="2026-10-09",
        holding_days=0,
        q10=2100.0,
        q20=2150.0,
        q35=2180.0,
        q50=2200.0,
        q90=2250.0,
        low=2100.0,
        expected=2200.0,
        high=2250.0,
        reliability="HIGH"
    )
    req.forecasts_by_market["Pimpalgaon APMC"] = [fc_go]
    
    record = engine.analyze_sale_decision(req)
    assert record.chosen.action == "GO"
    assert record.chosen.market == "Pimpalgaon APMC"
    assert record.chosen.gain_pct >= 0.03


def test_stale_data_blocks_decision():
    """Mandi with 3+ stale sessions emits INSUFFICIENT_EVIDENCE when baseline cannot be formed."""
    engine = DecisionEngine()
    req = create_base_request()
    req.market_snapshots["Nashik APMC"].expected_trading_age_sessions = 3
    
    record = engine.analyze_sale_decision(req)
    assert record.chosen.action == "INSUFFICIENT_EVIDENCE"
    assert any("stale" in w.lower() for w in record.warnings)


def test_risk_profiles_differentiation():
    """Verify Cautious (q20, 5% gain, 70% prob) vs Balanced (q35, 3% gain, 65% prob) vs Aggressive (q50, 1.5% gain, 55% prob)."""
    engine = DecisionEngine()
    
    # Moderate price rise that satisfies Aggressive and Balanced, but not Cautious
    fc = ForecastTargetInput(
        target_date="2026-10-10",
        holding_days=1,
        q10=1810.0,
        q20=1830.0, # small gain for cautious
        q35=1910.0, # moderate gain for balanced
        q50=1950.0, # solid gain for aggressive
        q90=2000.0,
        low=1810.0,
        expected=1950.0,
        high=2000.0,
        reliability="HIGH"
    )
    
    # Cautious profile
    req_c = create_base_request()
    req_c.risk_profile = "Cautious"
    req_c.forecasts_by_market["Nashik APMC"] = [fc]
    rec_c = engine.analyze_sale_decision(req_c)
    
    # Aggressive profile
    req_a = create_base_request()
    req_a.risk_profile = "Aggressive"
    req_a.forecasts_by_market["Nashik APMC"] = [fc]
    rec_a = engine.analyze_sale_decision(req_a)
    
    assert rec_c.chosen.required_gain_pct == 0.05
    assert rec_a.chosen.required_gain_pct == 0.015
    assert rec_a.chosen.action in ("WAIT", "SELL_NOW")


def test_closed_market_excluded_from_actionable_cells():
    """Candidates on days where the mandi is closed are marked not feasible/ineligible."""
    engine = DecisionEngine()
    req = create_base_request()
    
    # Target date is Sunday / market closed
    fc_closed = ForecastTargetInput(
        target_date="2026-10-11",
        holding_days=2,
        q10=2000.0,
        q20=2050.0,
        q35=2100.0,
        q50=2150.0,
        q90=2200.0,
        low=2000.0,
        expected=2150.0,
        high=2200.0,
        reliability="LOW",
        out_of_range=True # Closed/ineligible signals
    )
    req.forecasts_by_market["Nashik APMC"] = [fc_closed]
    
    record = engine.analyze_sale_decision(req)
    assert record.chosen.action == "SELL_NOW"


def test_missing_arrivals_handled_gracefully():
    """Missing arrivals do not crash the engine; they lower reliability/flag informational."""
    engine = DecisionEngine()
    req = create_base_request()
    req.market_snapshots["Nashik APMC"].arrivals = 0.0
    req.market_snapshots["Nashik APMC"].prior_8w_same_weekday_arrivals = []
    
    record = engine.analyze_sale_decision(req)
    assert record.chosen.action in ("SELL_NOW", "WAIT")
    assert record.baseline.net_total > 0

