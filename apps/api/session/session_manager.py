"""Session Memory and State Manager for KrishiNirnay.
Tracks farmer profile, active crop context, dialogue history, and slot updates.
"""

from typing import Dict, Any, Optional
import time
from contracts.schemas.assist import SlotSchema
from contracts.schemas.decision_record import DecisionRecord

class SessionState:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.created_at = time.time()
        self.last_active_at = time.time()
        self.farmer_profile = {
            "district": "Nashik",
            "tehsil": "Niphad",
            "coordinates": [19.9975, 73.7898],
            "preferred_language": "mr-IN"
        }
        self.active_slots = SlotSchema()
        self.dialogue_state = {
            "last_tool": None,
            "last_decision_record": None,
            "last_mandi": "Nashik APMC",
            "unresolved_ambiguity": None,
            "turns_count": 0
        }

    def update_slots(self, new_slots: SlotSchema) -> SlotSchema:
        """Merges new slots with existing memory while allowing explicit farmer corrections."""
        self.last_active_at = time.time()

        if new_slots.commodity:
            self.active_slots.commodity = new_slots.commodity
        if new_slots.quantity is not None:
            self.active_slots.quantity = new_slots.quantity
            self.active_slots.quantity_unit = new_slots.quantity_unit
        if new_slots.home_mandi:
            self.active_slots.home_mandi = new_slots.home_mandi
        if new_slots.target_mandi:
            self.active_slots.target_mandi = new_slots.target_mandi
        if new_slots.requested_wait_days is not None:
            self.active_slots.requested_wait_days = new_slots.requested_wait_days
        if new_slots.risk_profile:
            self.active_slots.risk_profile = new_slots.risk_profile
        if new_slots.language:
            self.active_slots.language = new_slots.language
        if new_slots.bag_weight_kg is not None:
            self.active_slots.bag_weight_kg = new_slots.bag_weight_kg

        # Re-check completeness
        missing = []
        if not self.active_slots.commodity:
            missing.append("commodity")
        if self.active_slots.quantity is None:
            missing.append("quantity")
        if not self.active_slots.home_mandi:
            missing.append("home_mandi")

        self.active_slots.missing_slots = missing
        self.active_slots.is_complete = len(missing) == 0

        return self.active_slots

    def set_last_decision(self, record: DecisionRecord):
        self.dialogue_state["last_decision_record"] = record
        self.dialogue_state["last_mandi"] = record.chosen.market
        self.dialogue_state["turns_count"] += 1

class SessionManager:
    def __init__(self):
        self._sessions: Dict[str, SessionState] = {}

    def get_or_create(self, session_id: str) -> SessionState:
        if session_id not in self._sessions:
            self._sessions[session_id] = SessionState(session_id)
        return self._sessions[session_id]

# Global singleton session store
session_store = SessionManager()
