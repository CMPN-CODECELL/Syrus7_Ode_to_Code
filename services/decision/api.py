"""
services/decision/api.py

FastAPI Service Layer for KrishiNirnay Decision & Risk Engine.
Project Tagline: "Sahi Bhav Se, Samriddhi Ki Raah Pe"
Authority: SYRUS_PS02_MASTER.md (Section 25A) & SYRUS_PS02_DIVISION_2_DECISION_RISK_ENGINE.md (Section 36)

Exposes Internal Contracts:
  POST /internal/analyze-sale-decision
  POST /internal/run-scenario
  GET  /internal/weather-context
  GET  /internal/health
"""

from __future__ import annotations

from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field

from .decision_policy import DecisionRequest, DecisionEngine
from .decision_record import DecisionRecord
from .scenario_engine import ScenarioEngine, ScenarioParameters, ScenarioResult
from .weather_effects import WeatherContext, WeatherEffectsEngine, WeatherEconomicImpact
from .route_cost import DEFAULT_MANDI_COORDINATES

app = FastAPI(
    title="KrishiNirnay Decision & Risk Engine",
    description="Deterministic Decision, Risk and Economics Intelligence for Agri Supply Chains",
    version="1.0.0"
)

decision_engine = DecisionEngine()
scenario_engine = ScenarioEngine(decision_engine=decision_engine)
weather_engine = WeatherEffectsEngine()


class ScenarioRunPayload(BaseModel):
    """Payload for running what-if scenarios."""
    request: DecisionRequest
    parameters: Optional[ScenarioParameters] = None


@app.get("/internal/health", tags=["System"])
def health_check() -> Dict[str, Any]:
    """Health check endpoint exposing versioned contract metadata."""
    return {
        "status": "healthy",
        "service": "krishinirnay-decision-engine",
        "product_name": "KrishiNirnay",
        "tagline": "Sahi Bhav Se, Samriddhi Ki Raah Pe",
        "engine_version": "1.0.0",
        "rules_version": "1.0.0",
        "cost_config_version": "1.0.0",
        "route_config_version": "1.0.0",
        "routing_host": "api.heigit.org"
    }


@app.post("/internal/analyze-sale-decision", response_model=DecisionRecord, tags=["Decision"])
def analyze_sale_decision_endpoint(request: DecisionRequest) -> DecisionRecord:
    """
    Executes the canonical decision pipeline:
    Evaluates baseline Sell Now, candidate options (Wait & Go), six risk flags,
    and returns one immutable DecisionRecord.
    """
    try:
        record = decision_engine.analyze_sale_decision(request)
        return record
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/internal/run-scenario", response_model=ScenarioResult, tags=["Scenario"])
def run_scenario_endpoint(payload: ScenarioRunPayload) -> ScenarioResult:
    """
    Clones baseline request state, applies stress scenario parameters,
    and executes the EXACT SAME decision engine pipeline.
    """
    try:
        result = scenario_engine.run_scenario(
            baseline_request=payload.request,
            scenario_params=payload.parameters
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/internal/weather-context", tags=["Weather"])
def get_weather_context_endpoint(
    location: str = Query(..., description="Location/Mandi name (e.g. 'Nashik APMC')"),
    latitude: Optional[float] = Query(None, description="Optional latitude"),
    longitude: Optional[float] = Query(None, description="Optional longitude")
) -> Dict[str, Any]:
    """
    Returns normalized weather context and deterministic economic impact multipliers.
    """
    lat = latitude
    lon = longitude
    if lat is None or lon is None:
        coords = DEFAULT_MANDI_COORDINATES.get(location, (19.9975, 73.7898))
        lat, lon = coords

    is_coastal = ("mumbai" in location.lower() or "vashi" in location.lower() or "konkan" in location.lower())

    weather_ctx = WeatherContext(
        location_name=location,
        latitude=lat,
        longitude=lon,
        temperature_max_c=32.0,
        rainfall_mm_24h=0.0,
        imd_warning_color="NONE",
        is_coastal=is_coastal,
        is_available=True,
        source="open_meteo_imd"
    )

    impact = weather_engine.evaluate_weather(weather_ctx)
    return {
        "weather_context": weather_ctx.model_dump(),
        "economic_impact": impact.model_dump()
    }
