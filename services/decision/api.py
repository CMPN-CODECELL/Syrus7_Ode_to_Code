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
    """Payload for running what-if scenarios supporting both rich and Division 3 gateway schemas."""
    request: Optional[DecisionRequest] = None
    base_decision: Optional[Dict[str, Any]] = None
    parameters: Optional[ScenarioParameters] = None
    price_delta_pct: Optional[float] = None
    transport_delta_pct: Optional[float] = None
    arrival_multiplier: Optional[float] = None


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


@app.post("/internal/run-scenario", tags=["Scenario"])
def run_scenario_endpoint(payload: ScenarioRunPayload) -> Dict[str, Any]:
    """
    Clones baseline request state, applies stress scenario parameters,
    and executes the EXACT SAME decision engine pipeline.
    """
    try:
        # Resolve scenario parameters
        if payload.parameters is not None:
            params = payload.parameters
        else:
            # Check top-level stress inputs (handling decimal or percentage representations)
            p_delta = payload.price_delta_pct if payload.price_delta_pct is not None else -10.0
            if abs(p_delta) <= 1.0 and p_delta != 0.0:
                p_delta = p_delta * 100.0 # e.g. -0.10 -> -10%

            t_delta = payload.transport_delta_pct if payload.transport_delta_pct is not None else 20.0
            if abs(t_delta) <= 1.0 and t_delta != 0.0:
                t_delta = t_delta * 100.0 # e.g. 0.20 -> +20%

            arr_mult = payload.arrival_multiplier if payload.arrival_multiplier is not None else 2.0
            params = ScenarioParameters(
                price_delta_pct=p_delta,
                transport_delta_pct=t_delta,
                arrival_multiplier=arr_mult
            )

        # Resolve DecisionRequest
        if payload.request is not None:
            req = payload.request
        elif payload.base_decision is not None:
            bd = payload.base_decision
            commodity = bd.get("commodity") or bd.get("forecast", {}).get("crop") or "Tomato"
            quantity = float(bd.get("lot_quantity_qtl") or bd.get("baseline", {}).get("quantity_sold_qtl") or 20.0)
            home_mandi = bd.get("baseline", {}).get("market") or "Nashik APMC"
            sale_day = bd.get("baseline", {}).get("sale_day") or "2026-10-09"
            req = DecisionRequest(
                commodity=commodity,
                quantity=quantity,
                home_mandi=home_mandi,
                observation_date=sale_day,
                risk_profile=bd.get("risk_profile", "Balanced")
            )
        else:
            raise ValueError("Either 'request' or 'base_decision' must be provided in scenario payload.")

        result = scenario_engine.run_scenario(
            baseline_request=req,
            scenario_params=params
        )
        return result.model_dump()
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
