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

