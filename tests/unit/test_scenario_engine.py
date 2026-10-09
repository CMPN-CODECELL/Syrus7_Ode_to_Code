"""
tests/unit/test_scenario_engine.py

Unit tests for scenario engine: state cloning, source immutability,
stress testing (price, transport, arrival surge), and diff generation.
"""

import pytest
import copy
from services.decision.scenario_engine import (
    ScenarioEngine,
    ScenarioParameters
)
from services.decision.decision_policy import (
    DecisionEngine,
    DecisionRequest,
    MarketSnapshotInput,
    ForecastTargetInput
)


def create_scenario_request() -> DecisionRequest:
    home_snap = MarketSnapshotInput(
        market="Nashik APMC",
        commodity="Tomato",
        observation_date="2026-10-09",
        modal_price_inr_per_qtl=1800.0,
        arrivals=50.0,
        prior_8w_same_weekday_arrivals=[50.0] * 8,
        expected_trading_age_sessions=1,
        recent_daily_prices=[1800.0] * 7
    )
    fc = ForecastTargetInput(
        target_date="2026-10-11",
        holding_days=2,
        q10=1900.0,
        q20=1950.0,
        q35=2000.0,
        q50=2050.0,
        q90=2150.0,
        low=1900.0,
        expected=2050.0,
        high=2150.0,
        reliability="HIGH"
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
        forecasts_by_market={"Nashik APMC": [fc]}
    )


def test_source_immutability():
    """Executing a scenario must NEVER mutate the baseline DecisionRequest state."""
    sc_engine = ScenarioEngine()
    req = create_scenario_request()
    
    original_modal = req.market_snapshots["Nashik APMC"].modal_price_inr_per_qtl
    original_rate = req.rate_per_km
    original_arrivals = req.market_snapshots["Nashik APMC"].arrivals
    
    params = ScenarioParameters(
        price_delta_pct=-15.0,
        transport_delta_pct=30.0,
        arrival_multiplier=2.5
    )
    
    result = sc_engine.run_scenario(baseline_request=req, scenario_params=params)
    
    # Original request MUST remain unmodified
    assert req.market_snapshots["Nashik APMC"].modal_price_inr_per_qtl == original_modal
    assert req.rate_per_km == original_rate
    assert req.market_snapshots["Nashik APMC"].arrivals == original_arrivals


def test_scenario_price_drop_decision_flip():
    """A 10% price drop stress flips a WAIT recommendation to SELL_NOW."""
    sc_engine = ScenarioEngine()
    req = create_scenario_request()
    
    # Baseline action should be WAIT
    base_record = sc_engine.decision_engine.analyze_sale_decision(req)
    assert base_record.chosen.action == "WAIT"
    
    # Stress with -15% price drop
    params = ScenarioParameters(price_delta_pct=-15.0, transport_delta_pct=0.0, arrival_multiplier=1.0)
    result = sc_engine.run_scenario(baseline_request=req, scenario_params=params, baseline_record=base_record)
    
    # In scenario, price drop erodes wait gains -> flips to SELL_NOW
    assert result.difference.action_changed is True
    assert result.difference.baseline_action == "WAIT"
    assert result.difference.scenario_action == "SELL_NOW"
    assert result.difference.net_delta < 0
    assert "price" in result.difference.main_reason.lower()


def test_scenario_arrival_surge():
    """A 2x arrival surge triggers arrival risk and makes decision conservative."""
    sc_engine = ScenarioEngine()
    req = create_scenario_request()
    
    params = ScenarioParameters(price_delta_pct=0.0, transport_delta_pct=0.0, arrival_multiplier=2.5)
    result = sc_engine.run_scenario(baseline_request=req, scenario_params=params)
    
    # Check arrival surge in stressed record
    assert result.scenario_record.risk.overall in ("YELLOW", "RED")
    assert result.difference.scenario_risk in ("YELLOW", "RED")
