"""LLM and Decision Orchestrator for KrishiNirnay.
Coordinates:
1. Glossary normalization & slot extraction
2. Session memory & farmer corrections
3. Ambiguity handling (e.g. bag weight check)
4. Deterministic decision engine execution
5. LLM conversational phrasing (Gemini -> Groq)
6. NUMBER GUARD validation
7. Deterministic template fallback
"""

import uuid
import logging
from typing import Dict, Any, Optional

from contracts.schemas.assist import AssistRequest, AssistResponse, SlotSchema
from contracts.schemas.decision_record import DecisionRecord
from apps.api.session.session_manager import session_store
from apps.api.voice.glossary import AgriculturalGlossary
from apps.api.llm.tools import tool_analyze_sale_decision, tool_run_scenario
from apps.api.llm.number_guard import NumberGuard
from apps.api.llm.deterministic_templates import DeterministicTemplates
from apps.api.llm.adapters import llm_adapter

logger = logging.getLogger("krishinirnay.orchestrator")

class Orchestrator:
    async def process_assist_request(self, req: AssistRequest, simulated_llm_outage: bool = False) -> AssistResponse:
        session = session_store.get_or_create(req.session_id)
        lang = req.language

        # 1. Extract semantic slots from user prompt
        new_slots = AgriculturalGlossary.extract_semantic_slots(req.message, session.active_slots)
        if req.risk_profile_override:
            new_slots.risk_profile = req.risk_profile_override
        active_slots = session.update_slots(new_slots)

        # 2. Check for missing or ambiguous critical slots
        if not active_slots.is_complete:
            # Need clarification
            clarification_prompt = ""
            if "bag_weight_kg" in active_slots.missing_slots:
                if lang == "mr-IN":
                    clarification_prompt = "आपण पोत्यांचा उल्लेख केला आहे. कृपया एका पोत्याचे वजन (उदा. ५० किलो) सांगा, जेणेकरून अचूक क्विंटल काढता येईल."
                elif lang == "hi-IN":
                    clarification_prompt = "आपने कट्टे/बोरी का उल्लेख किया है। कृपया एक कट्टे का वजन (जैसे 50 किलो) बताएं, ताकि सही क्विंटल निकाला जा सके।"
                else:
                    clarification_prompt = "You mentioned bags/sacks. Please specify the weight per bag in kg (e.g. 50 kg) to calculate accurate quintals."
            elif not active_slots.commodity:
                if lang == "mr-IN":
                    clarification_prompt = "कृपया पिकाचे नाव सांगा (उदा. टोमॅटो किंवा कांदा)."
                elif lang == "hi-IN":
                    clarification_prompt = "कृपया फसल का नाम बताएं (जैसे टमाटर या प्याज)।"
                else:
                    clarification_prompt = "Please specify the commodity (e.g. Tomato or Onion)."
            elif active_slots.quantity is None:
                if lang == "mr-IN":
                    clarification_prompt = "तुमच्याकडे किती क्विंटल माल विक्रीसाठी उपलब्ध आहे?"
                elif lang == "hi-IN":
                    clarification_prompt = "आपके पास बिक्री के लिए कितने क्विंटल उपज उपलब्ध है?"
                else:
                    clarification_prompt = "How many quintals of produce do you have for sale?"
            else:
                if lang == "mr-IN":
                    clarification_prompt = "कृपया आपली जवळची बाजार समिती (मंडी) सांगा."
                elif lang == "hi-IN":
                    clarification_prompt = "कृपया अपनी नजदीकी मंडी का नाम बताएं।"
                else:
                    clarification_prompt = "Please specify your preferred home mandi."

            return AssistResponse(
                session_id=req.session_id,
                request_id=f"req-clarify-{uuid.uuid4().hex[:6]}",
                assistant_text=clarification_prompt,
                decision_record=None,
                warnings=[],
                voice_available=True,
                spoken_summary=clarification_prompt,
                fallback_path="NONE",
                slots=active_slots,
                clarification_needed=True,
                prompt_for_clarification=clarification_prompt
            )

        # 3. Slots are complete -> Invoke bounded deterministic decision tool
        commodity = active_slots.commodity or "Tomato"
        qty = active_slots.quantity or 20.0
        mandi = active_slots.home_mandi or "Nashik APMC"
        wait_days = active_slots.requested_wait_days or 2
        risk_profile = active_slots.risk_profile or "BALANCED"

        decision_record = tool_analyze_sale_decision(
            commodity=commodity,
            quantity=qty,
            home_mandi=mandi,
            requested_wait_days=wait_days,
            risk_profile=risk_profile
        )
        session.set_last_decision(decision_record)

        # 4. Generate deterministic reference text and spoken summary
        deterministic_text = DeterministicTemplates.render_recommendation(decision_record, lang)
        spoken_summary = DeterministicTemplates.render_spoken_summary(decision_record, lang)

        # 5. For follow-up conversational queries or conversational styling, attempt LLM
        fallback_path = "TEMPLATE"
        final_text = deterministic_text

        # If user message is a natural conversational question (not a direct slot entry)
        is_conversational_question = "?" in req.message or len(req.message.split()) > 7
        if is_conversational_question and not simulated_llm_outage:
            system_prompt = (
                f"You are KrishiNirnay, an agricultural decision assistant for Maharashtra farmers. "
                f"You must strictly summarize the provided DecisionRecord. "
                f"NEVER invent or recalculate any prices, nets, probabilities, or quantities. "
                f"All numbers must come directly from this DecisionRecord:\n"
                f"- Action: {decision_record.chosen.action}\n"
                f"- Net Return: ₹{int(decision_record.chosen.net_total):,}\n"
                f"- Baseline Net: ₹{int(decision_record.baseline.net_total):,}\n"
                f"- Gain: ₹{int(decision_record.chosen.gain_total):,}\n"
                f"- Reservation Price: ₹{int(decision_record.chosen.reservation_price):,}/qtl\n"
                f"- Probability: {int(decision_record.chosen.probability_beat_baseline*100)}%\n"
                f"- Risk: {decision_record.risk.overall}\n"
                f"Respond in {lang}."
            )
            candidate_text, provider = await llm_adapter.generate_response(
                prompt=req.message,
                system_instruction=system_prompt,
                simulated_llm_outage=simulated_llm_outage
            )

            if candidate_text:
                # 6. RUN NUMBER GUARD!
                is_valid, unsupported = NumberGuard.validate(candidate_text, decision_record)
                if is_valid:
                    final_text = candidate_text
                    fallback_path = provider
                    logger.info(f"Number Guard PASSED for {provider} response.")
                else:
                    logger.warning(
                        f"Number Guard REJECTED {provider} text due to unauthorized numbers: {unsupported}. "
                        f"Falling back to deterministic template."
                    )
                    final_text = deterministic_text
                    fallback_path = "TEMPLATE"

        return AssistResponse(
            session_id=req.session_id,
            request_id=decision_record.request_id,
            assistant_text=final_text,
            decision_record=decision_record,
            warnings=decision_record.warnings,
            voice_available=True,
            spoken_summary=spoken_summary,
            fallback_path=fallback_path,
            slots=active_slots,
            clarification_needed=False,
            prompt_for_clarification=None
        )

# Global orchestrator singleton
orchestrator = Orchestrator()
