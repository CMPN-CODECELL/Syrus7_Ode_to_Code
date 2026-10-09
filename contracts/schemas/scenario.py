"""Scenario and stress-testing schemas for KrishiNirnay."""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from contracts.schemas.decision_record import DecisionRecord

class ScenarioRequest(BaseModel):
    base_request_id: Optional[str] = None
    commodity: str = "Tomato"
    quantity_qtl: float = 20.0
    home_mandi: str = "Nashik APMC"
    price_delta_pct: float = Field(-0.10, description="Price change percentage, e.g. -0.10 for -10%")
    transport_delta_pct: float = Field(0.20, description="Transport cost surge percentage, e.g. +0.20 for +20%")
    arrival_multiplier: float = Field(2.0, description="Arrival volume surge multiplier, e.g. 2.0x")
    risk_profile: Literal["CAUTIOUS", "BALANCED", "AGGRESSIVE"] = "BALANCED"

class ScenarioComparisonItem(BaseModel):
    metric: str
    baseline_value: str
    scenario_value: str
    difference: str
    impact: Literal["POSITIVE", "NEUTRAL", "NEGATIVE"]

class ScenarioResponse(BaseModel):
    scenario_id: str
    base_request_id: str
    applied_stresses: dict
    baseline_decision: DecisionRecord
    stressed_decision: DecisionRecord
    action_flipped: bool
    summary: str
    comparison_table: List[ScenarioComparisonItem]
