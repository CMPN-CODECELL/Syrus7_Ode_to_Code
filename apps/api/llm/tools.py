"""Bounded LLM Tools for KrishiNirnay.
Per MASTER Section 4 and DIVISION 3 Section 11:
Expose ONLY these five high-level tools to the LLM:
- analyze_sale_decision()
- get_price_history()
- get_market_snapshot()
- run_scenario()
- get_weather_context()
Do NOT expose internal leaf financial or risk formulas to the LLM.
"""

from typing import Dict, Any, Optional
from apps.api.mock_engine.deterministic_engine import engine
from contracts.schemas.decision_record import DecisionRecord

def tool_analyze_sale_decision(
    commodity: str = "Tomato",
    quantity: float = 20.0,
    home_mandi: str = "Nashik APMC",
    requested_wait_days: int = 2,
    risk_profile: str = "BALANCED",
    distance_km: Optional[float] = None
) -> DecisionRecord:
    """Executes the complete deterministic decision pipeline."""
    return engine.analyze_sale_decision(
        commodity=commodity,
        quantity=quantity,
        home_mandi=home_mandi,
        requested_wait_days=requested_wait_days,
        risk_profile=risk_profile,
        distance_km=distance_km
    )

def tool_get_price_history(commodity: str = "Tomato", mandi: str = "Nashik APMC", days: int = 30) -> Dict[str, Any]:
    """Retrieves 30-90 day historical price trends."""
    resp = engine.get_price_history(crop=commodity, mandi=mandi, days=days)
    return resp.model_dump()

def tool_get_market_snapshot(commodity: str = "Tomato", mandi: str = "Nashik APMC") -> Dict[str, Any]:
    """Retrieves current market price, arrivals, and freshness status."""
    snap = engine.get_market_snapshot(crop=commodity, mandi=mandi)
    return snap.model_dump()

def tool_run_scenario(
    base_record: DecisionRecord,
    price_delta_pct: float = -0.10,
    transport_delta_pct: float = 0.20,
    arrival_multiplier: float = 2.0
) -> Dict[str, Any]:
    """Reruns the deterministic engine under stressed market assumptions."""
    return engine.run_scenario(
        base_decision=base_record,
        price_delta_pct=price_delta_pct,
        transport_delta_pct=transport_delta_pct,
        arrival_multiplier=arrival_multiplier
    )

def tool_get_weather_context(location: str = "Nashik", mandi: str = "Nashik APMC") -> Dict[str, Any]:
    """Retrieves weather context and its economic holding/travel loss effect."""
    return engine.get_weather_context(location=location, mandi=mandi)
