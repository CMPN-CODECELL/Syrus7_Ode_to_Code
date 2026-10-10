"""API Gateway Integration Tests."""

import pytest
from fastapi.testclient import TestClient
from apps.api.main import app

client = TestClient(app)

def test_health_check():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["tagline"] == "Sahi Bhav Se, Samriddhi Ki Raah Pe."

def test_market_snapshot_fresh():
    res = client.get("/api/market-snapshot?crop=Tomato&mandi=Nashik%20APMC")
    assert res.status_code == 200
    data = res.json()
    assert data["commodity"] == "Tomato"
    assert data["modal_price_inr_per_qtl"] == 1800.0
    assert data["freshness"] == "FRESH"

def test_price_history_endpoint():
    res = client.get("/api/price-history?crop=Tomato&mandi=Nashik%20APMC&days=30")
    assert res.status_code == 200
    data = res.json()
    assert len(data["series"]) >= 30
    assert data["days"] == 30

def test_assist_golden_request():
    res = client.post("/api/assist", json={
        "session_id": "pytest-session-001",
        "message": "20 quintal tomato in Nashik wait 2 days",
        "language": "en-IN",
        "input_mode": "text"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["decision_record"] is not None
    rec = data["decision_record"]
    assert rec["baseline"]["net_total"] == 33960.0
    assert rec["chosen"]["net_total"] == 36055.0
    assert rec["chosen"]["reservation_price"] == 1842.0

def test_scenario_endpoint():
    res = client.post("/api/scenario", json={
        "commodity": "Tomato",
        "quantity_qtl": 20.0,
        "home_mandi": "Nashik APMC",
        "price_delta_pct": -0.10,
        "transport_delta_pct": 0.20,
        "arrival_multiplier": 2.0
    })
    assert res.status_code == 200
    data = res.json()
    assert "comparison_table" in data
    assert data["action_flipped"] is True

def test_dynamic_translate_endpoint():
    res = client.post("/api/translate", json={
        "text": ["Nashik APMC", "Tomato", "WAIT"],
        "target_lang": "mr-IN"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["target_lang"] == "mr-IN"
    assert data["translated_text"] == ["नाशिक बाजार समिती", "टोमॅटो", "थांबा"]

    # Test single phrase to Hindi
    res_hi = client.post("/api/translate", json={
        "text": "Pimpalgaon Baswant APMC",
        "target_lang": "hi-IN"
    })
    assert res_hi.status_code == 200
    assert res_hi.json()["translated_text"] == "पिंपलगांव बसवंत मंडी"

def test_market_calendar_endpoint():
    res = client.get("/api/market-calendar?crop=Tomato&mandi=Nashik%20APMC")
    assert res.status_code == 200
    data = res.json()
    assert len(data["days"]) == 7
    # Day 2 is Sunday holiday for Nashik APMC
    day2 = data["days"][2]
    assert day2["is_open"] is False
    assert "Sunday" in day2["holiday_name"]
    assert "Weekly Off" in day2["status_label"]
    # Day 4 is Festival Amavasya holiday
    day4 = data["days"][4]
    assert day4["is_open"] is False
    assert "Festival" in day4["holiday_name"]

def test_weather_impact_endpoint():
    res = client.get("/api/weather-impact?crop=Tomato&mandi=Nashik%20APMC")
    assert res.status_code == 200
    data = res.json()
    assert data["alert_level"] == "YELLOW"
    assert data["rainfall_forecast_mm"] == 18.0
    assert "harvest_disruption" in data
    assert "storage_spoilage_risk" in data

def test_model_validation_endpoints():
    res = client.get("/api/model-validation/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_records"] == 10950
    assert data["total_test_pairs"] > 4000
    assert len(data["comparisons"]) == 42
    assert "cutoff_date" in data
    assert data["cutoff_date"] == "2026-04-22"

    res_series = client.get("/api/model-validation/series?mandi=Nashik%20APMC&crop=Tomato&horizon=1")
    assert res_series.status_code == 200
    series_data = res_series.json()
    assert len(series_data["predictions"]) > 0
    assert "residual_stats" in series_data
    assert "xgboost_mae" in series_data


def test_websocket_market_feed():
    with client.websocket_connect("/ws/market-feed") as ws:
        msg = ws.receive_json()
        assert msg["type"] == "INITIAL_MARKET_STATE"
        assert len(msg["mandis"]) == 3
        assert "weather" in msg
        assert "closures" in msg


