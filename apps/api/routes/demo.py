"""Demo and failure injection routes for KrishiNirnay."""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Literal
from apps.api.mock_engine.deterministic_engine import engine
from apps.api.llm.adapters import llm_adapter

router = APIRouter(prefix="/api/demo", tags=["Demo"])

class FailureModeRequest(BaseModel):
    mode: Literal["NORMAL", "DATA_OUTAGE", "STALE_DATA", "WEATHER_OUTAGE", "LLM_OUTAGE"]

@router.get("/status")
def get_demo_status():
    return {
        "mode": engine.failure_mode,
        "snapshot_id": "verified_snapshot_mh_2026",
        "snapshot_date": "2026-10-09",
        "is_offline": False,
        "gemini_healthy": llm_adapter.gemini_breaker.can_attempt() and engine.failure_mode != "LLM_OUTAGE",
        "groq_healthy": llm_adapter.groq_breaker.can_attempt() and engine.failure_mode != "LLM_OUTAGE",
        "market_api_healthy": engine.failure_mode != "DATA_OUTAGE",
        "weather_api_healthy": engine.failure_mode != "WEATHER_OUTAGE"
    }

@router.post("/failure-mode")
def set_failure_mode(req: FailureModeRequest):
    engine.set_failure_mode(req.mode)
    return {
        "status": "success",
        "active_mode": req.mode,
        "message": f"Failure mode set to {req.mode}. All engine and assistant calls will exhibit this degradation."
    }
