"""Public /api/assist and slot schemas for KrishiNirnay."""

from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field
from contracts.schemas.decision_record import DecisionRecord

class SlotSchema(BaseModel):
    commodity: Optional[str] = None
    quantity: Optional[float] = None
    quantity_unit: str = "qtl"
    origin_text: Optional[str] = None
    origin_coordinates: Optional[List[float]] = None
    home_mandi: Optional[str] = "Nashik APMC"
    target_mandi: Optional[str] = None
    requested_wait_days: Optional[int] = 2
    risk_profile: Literal["CAUTIOUS", "BALANCED", "AGGRESSIVE"] = "BALANCED"
    vehicle_type: Optional[str] = None
    vehicle_payload_qtl: Optional[float] = None
    storage_available: Optional[bool] = None
    harvest_date: Optional[str] = None
    language: str = "mr-IN"
    bag_weight_kg: Optional[float] = None
    is_complete: bool = False
    missing_slots: List[str] = Field(default_factory=list)
    ambiguous_slots: List[str] = Field(default_factory=list)

class AssistRequest(BaseModel):
    session_id: str = Field(..., description="Unique conversation session UUID")
    message: str = Field(..., description="User prompt text")
    language: Literal["mr-IN", "hi-IN", "en-IN"] = "mr-IN"
    input_mode: Literal["text", "voice"] = "text"
    context: Dict[str, Any] = Field(default_factory=dict)
    risk_profile_override: Optional[Literal["CAUTIOUS", "BALANCED", "AGGRESSIVE"]] = None

class AssistResponse(BaseModel):
    session_id: str
    request_id: str
    assistant_text: str
    decision_record: Optional[DecisionRecord] = None
    warnings: List[str] = Field(default_factory=list)
    voice_available: bool = True
    spoken_summary: Optional[str] = None
    fallback_path: Literal["NONE", "GROQ", "TEMPLATE"] = "NONE"
    slots: SlotSchema
    clarification_needed: bool = False
    prompt_for_clarification: Optional[str] = None
