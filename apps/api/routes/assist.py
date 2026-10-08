"""Assist endpoint for KrishiNirnay."""

from fastapi import APIRouter, HTTPException, Depends
from contracts.schemas.assist import AssistRequest, AssistResponse
from apps.api.llm.orchestrator import orchestrator
from apps.api.mock_engine.deterministic_engine import engine

router = APIRouter(prefix="/api", tags=["Assist"])

@router.post("/assist", response_model=AssistResponse)
async def assist_endpoint(req: AssistRequest):
    simulated_llm_outage = (engine.failure_mode == "LLM_OUTAGE")
    try:
        response = await orchestrator.process_assist_request(req, simulated_llm_outage=simulated_llm_outage)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
