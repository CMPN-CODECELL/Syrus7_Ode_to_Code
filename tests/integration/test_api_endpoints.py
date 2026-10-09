"""
tests/integration/test_api_endpoints.py

Integration tests for the internal FastAPI service endpoints owned by Division 2:
  GET  /internal/health
  POST /internal/analyze-sale-decision
  POST /internal/run-scenario
  GET  /internal/weather-context
"""

import pytest
from fastapi.testclient import TestClient
from services.decision.api import app

client = TestClient(app)


def test_health_endpoint():
    """Verify health endpoint returns healthy status and engine versions."""
    resp = client.get("/internal/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["product_name"] == "KrishiNirnay"
    assert data["tagline"] == "Sahi Bhav Se, Samriddhi Ki Raah Pe"
    assert data["engine_version"] == "1.0.0"
    assert data["routing_host"] == "api.heigit.org"


def test_analyze_sale_decision_endpoint():
    """Verify POST /internal/analyze-sale-decision endpoint."""
    payload = {
        "commodity": "Tomato",
        "quantity": 25.0,
        "quantity_unit": "qtl",
        "home_mandi": "Nashik APMC",
        "home_coords": [19.9975, 73.7898],
        "observation_date": "2026-10-09",
        "horizon_days": 7,
        "risk_profile": "Balanced",
        "market_snapshots": {
            "Nashik APMC": {
                "market": "Nashik APMC",
                "commodity": "Tomato",
                "observation_date": "2026-10-09",
                "modal_price_inr_per_qtl": 1800.0,
                "arrivals": 45.0,
                "expected_trading_age_sessions": 1
            }
        },
        "forecasts_by_market": {}
    }
    resp = client.post("/internal/analyze-sale-decision", json=payload)
    assert resp.status_code == 200
    record = resp.json()
    assert record["chosen"]["action"] == "SELL_NOW"
    assert record["baseline"]["net_total"] > 0
    assert record["risk"]["overall"] in ("GREEN", "YELLOW", "RED")
    assert len(record["explanation"]["why"]) > 0


def test_run_scenario_endpoint():
    """Verify POST /internal/run-scenario endpoint."""
    payload = {
        "request": {
            "commodity": "Tomato",
            "quantity": 20.0,
            "quantity_unit": "qtl",
            "home_mandi": "Nashik APMC",
            "observation_date": "2026-10-09",
            "horizon_days": 7,
            "risk_profile": "Balanced",
            "market_snapshots": {
                "Nashik APMC": {
                    "market": "Nashik APMC",
                    "commodity": "Tomato",
                    "observation_date": "2026-10-09",
                    "modal_price_inr_per_qtl": 1800.0,
                    "arrivals": 40.0,
                    "expected_trading_age_sessions": 1
                }
            },
            "forecasts_by_market": {}
        },
        "parameters": {
            "price_delta_pct": -10.0,
            "transport_delta_pct": 20.0,
            "arrival_multiplier": 2.0
        }
    }
    resp = client.post("/internal/run-scenario", json=payload)
    assert resp.status_code == 200
    result = resp.json()
    assert "baseline_record" in result
    assert "scenario_record" in result
    assert "difference" in result
    assert result["difference"]["net_delta"] <= 0 # Stressed prices should lower net


def test_weather_context_endpoint():
    """Verify GET /internal/weather-context endpoint."""
    resp = client.get("/internal/weather-context?location=Nashik%20APMC")
    assert resp.status_code == 200
    data = resp.json()
    assert "weather_context" in data
    assert "economic_impact" in data
    assert data["economic_impact"]["holding_loss_multiplier"] >= 1.0
