"""Failure mode and graceful degradation tests."""

import pytest
from fastapi.testclient import TestClient
from apps.api.main import app
from apps.api.mock_engine.deterministic_engine import engine

client = TestClient(app)

def test_stale_data_failure_mode():
    # Set failure mode to STALE_DATA
    client.post("/api/demo/failure-mode", json={"mode": "STALE_DATA"})

    # Market snapshot should report STALE_RED and 3 trading day age
    res_snap = client.get("/api/market-snapshot?crop=Tomato&mandi=Nashik%20APMC")
    assert res_snap.status_code == 200
    assert res_snap.json()["freshness"] == "STALE_RED"
    assert res_snap.json()["trading_day_age"] == 3

    # Decision engine must exclude stale mandi from Wait and recommend safe SELL NOW
    res_assist = client.post("/api/assist", json={
        "session_id": "pytest-stale-session",
        "message": "20 quintal tomato in Nashik wait 2 days",
        "language": "en-IN",
        "input_mode": "text"
    })
    rec = res_assist.json()["decision_record"]
    assert rec["chosen"]["action"] == "SELL_NOW"
    assert rec["risk"]["overall"] == "RED"

    # Reset back to NORMAL
    client.post("/api/demo/failure-mode", json={"mode": "NORMAL"})

def test_data_outage_mode():
    client.post("/api/demo/failure-mode", json={"mode": "DATA_OUTAGE"})

    # Live market endpoint raises 503
    res_snap = client.get("/api/market-snapshot?crop=Tomato&mandi=Nashik%20APMC")
    assert res_snap.status_code == 503

    # Reset back to NORMAL
    client.post("/api/demo/failure-mode", json={"mode": "NORMAL"})
