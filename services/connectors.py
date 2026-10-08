"""Pluggable Microservice Connectors for Division 1 and Division 2.
Permits instantaneous toggle between local deterministic engine (mock)
and live internal microservices when Developers 1 and 2 deliver their endpoints.
"""

import os
from typing import Dict, Any, Optional
import httpx
from contracts.schemas.decision_record import DecisionRecord
from contracts.schemas.market_snapshot import MarketSnapshot, PriceHistoryResponse
from apps.api.mock_engine.deterministic_engine import engine as mock_engine

# Configuration
USE_LIVE_SERVICES = os.getenv("USE_LIVE_INTERNAL_SERVICES", "false").lower() == "true"
DIV1_BASE_URL = os.getenv("DIV1_BASE_URL", "http://localhost:8001")
DIV2_BASE_URL = os.getenv("DIV2_BASE_URL", "http://localhost:8002")

class Division1Connector:
    """Connects to Division 1 Data & Forecasting internal services."""
    @staticmethod
    async def get_market_snapshot(crop: str, mandi: str) -> MarketSnapshot:
        if not USE_LIVE_SERVICES:
            return mock_engine.get_market_snapshot(crop=crop, mandi=mandi)

        async with httpx.AsyncClient(timeout=3.0) as client:
            res = await client.get(f"{DIV1_BASE_URL}/internal/market-snapshot", params={"crop": crop, "mandi": mandi})
            res.raise_for_status()
            return MarketSnapshot(**res.json())

    @staticmethod
    async def get_price_history(crop: str, mandi: str, days: int = 30) -> PriceHistoryResponse:
        if not USE_LIVE_SERVICES:
            return mock_engine.get_price_history(crop=crop, mandi=mandi, days=days)

        async with httpx.AsyncClient(timeout=3.0) as client:
            res = await client.get(f"{DIV1_BASE_URL}/internal/price-history", params={"crop": crop, "mandi": mandi, "days": days})
            res.raise_for_status()
            return PriceHistoryResponse(**res.json())

class Division2Connector:
    """Connects to Division 2 Decision & Economics internal services."""
    @staticmethod
    async def analyze_sale_decision(
        commodity: str,
        quantity: float,
        home_mandi: str,
        requested_wait_days: int = 2,
        risk_profile: str = "BALANCED",
        distance_km: Optional[float] = None
    ) -> DecisionRecord:
        if not USE_LIVE_SERVICES:
            return mock_engine.analyze_sale_decision(
                commodity=commodity,
                quantity=quantity,
                home_mandi=home_mandi,
                requested_wait_days=requested_wait_days,
                risk_profile=risk_profile,
                distance_km=distance_km
            )

        payload = {
            "commodity": commodity,
            "quantity": quantity,
            "home_mandi": home_mandi,
            "requested_wait_days": requested_wait_days,
            "risk_profile": risk_profile,
            "distance_km": distance_km
        }
        async with httpx.AsyncClient(timeout=4.0) as client:
            res = await client.post(f"{DIV2_BASE_URL}/internal/analyze-sale-decision", json=payload)
            res.raise_for_status()
            return DecisionRecord(**res.json())

    @staticmethod
    async def run_scenario(
        base_record: DecisionRecord,
        price_delta_pct: float = -0.10,
        transport_delta_pct: float = 0.20,
        arrival_multiplier: float = 2.0
    ) -> Dict[str, Any]:
        if not USE_LIVE_SERVICES:
            return mock_engine.run_scenario(
                base_decision=base_record,
                price_delta_pct=price_delta_pct,
                transport_delta_pct=transport_delta_pct,
                arrival_multiplier=arrival_multiplier
            )

        payload = {
            "base_decision": base_record.model_dump(),
            "price_delta_pct": price_delta_pct,
            "transport_delta_pct": transport_delta_pct,
            "arrival_multiplier": arrival_multiplier
        }
        async with httpx.AsyncClient(timeout=4.0) as client:
            res = await client.post(f"{DIV2_BASE_URL}/internal/run-scenario", json=payload)
            res.raise_for_status()
            return res.json()
