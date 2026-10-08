"""Scenario stress-testing endpoint for KrishiNirnay."""

from fastapi import APIRouter, HTTPException
from contracts.schemas.scenario import ScenarioRequest, ScenarioResponse
from apps.api.mock_engine.deterministic_engine import engine
from apps.api.session.session_manager import session_store

router = APIRouter(prefix="/api", tags=["Scenario"])

@router.post("/scenario", response_model=ScenarioResponse)
def run_scenario_endpoint(req: ScenarioRequest):
    try:
        # If base_request_id provided and in session, use it; otherwise compute base decision
        base_decision = None
        if req.base_request_id:
            for s in session_store._sessions.values():
                if s.dialogue_state.get("last_decision_record") and s.dialogue_state["last_decision_record"].request_id == req.base_request_id:
                    base_decision = s.dialogue_state["last_decision_record"]
                    break

        if not base_decision:
            base_decision = engine.analyze_sale_decision(
                commodity=req.commodity,
                quantity=req.quantity_qtl,
                home_mandi=req.home_mandi,
                risk_profile=req.risk_profile
            )

        res = engine.run_scenario(
            base_decision=base_decision,
            price_delta_pct=req.price_delta_pct,
            transport_delta_pct=req.transport_delta_pct,
            arrival_multiplier=req.arrival_multiplier
        )
        return ScenarioResponse(**res)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scenario error: {str(e)}")
