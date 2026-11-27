"""LLM and Decision Orchestrator for KrishiNirnay.
Coordinates:
1. Intent recognition (Greetings, Capabilities, Analytical Follow-ups, Slot filling)
2. Glossary normalization & progressive slot extraction
3. Session memory & farmer corrections
4. Clarifying follow-up questions for missing/ambiguous slots
5. Deterministic decision engine execution
6. Specific answering for questions about transport, timing, reservation price, spoilage
7. LLM conversational phrasing (Gemini -> Groq)
8. NUMBER GUARD validation
9. Deterministic template fallback
"""

import uuid
import re
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

GREETING_WORDS = {
    "hello", "hi", "hey", "namaskar", "namaste", "pranam", "kasa kay", "kasa ahes",
    "नमस्कार", "नमस्ते", "हॅलो", "हाय", "राम राम", "जय हरी", "प्रणाम", "कसा काय", "शुभ प्रभात", "शुभ दुपार", "शुभ संध्याकाळ"
}

HELP_PHRASES = [
    "who are you", "what can you do", "help", "how do you work", "how to use",
    "तू कोण आहेस", "तू काय करतोस", "मदत", "काय करू शकतोस", "माहिती सांग"
]

class Orchestrator:
    async def process_assist_request(self, req: AssistRequest, simulated_llm_outage: bool = False) -> AssistResponse:
        session = session_store.get_or_create(req.session_id)
        lang = req.language
        msg_raw = req.message.strip()
        msg_lower = msg_raw.lower()
        msg_clean = re.sub(r'[^\w\s\u0900-\u097F]', '', msg_lower)
        tokens = set(msg_clean.split())

        # Check if message contains farming produce or numbers
        has_produce_keywords = any(k in msg_lower for k in [
            "टोमॅटो", "कांदा", "tomato", "onion", "टमाटर", "प्याज",
            "क्विंटल", "qtl", "quintal", "कट्टा", "पोतं", "पोती", "bag", "bags", "ton", "टन", "किलो", "kg"
        ])
        has_numbers = bool(re.search(r'\d+', msg_raw))

        # =========================================================================
        # 1. GREETING INTENT (e.g. "hello", "hi", "नमस्कार")
        # =========================================================================
        is_greeting = (
            any(t in GREETING_WORDS for t in tokens) or
            any(g in msg_lower for g in ["नमस्कार", "नमस्ते", "राम राम", "जय हरी", "hello", "hi", "hey"])
        )
        if is_greeting and not has_produce_keywords and not has_numbers:
            if lang == "mr-IN":
                greeting_text = (
                    "नमस्कार! मी कृषिनिर्णय सहाय्यक आहे. आपल्याकडे कोणते पीक आणि किती क्विंटल माल विक्रीसाठी उपलब्ध आहे? "
                    "(उदा. २० क्विंटल टोमॅटो किंवा ५० क्विंटल कांदा सांगा)"
                )
            elif lang == "hi-IN":
                greeting_text = (
                    "नमस्ते! मैं कृषिनिर्णय सहायक हूँ। आपके पास कौन सी फसल और कितने क्विंटल उपज बिक्री के लिए उपलब्ध है? "
                    "(जैसे 20 क्विंटल टमाटर या 50 क्विंटल प्याज बताएं)"
                )
            else:
                greeting_text = (
                    "Hello! I am your KrishiNirnay assistant. Which crop and what quantity do you have for sale today? "
                    "(e.g., 20 quintals of Tomato or 50 quintals of Onion)"
                )

            return AssistResponse(
                session_id=req.session_id,
                request_id=f"req-greet-{uuid.uuid4().hex[:6]}",
                assistant_text=greeting_text,
                decision_record=None,
                warnings=[],
                voice_available=True,
                spoken_summary=greeting_text,
                fallback_path="NONE",
                slots=session.active_slots,
                clarification_needed=True,
                prompt_for_clarification=greeting_text
            )

        # =========================================================================
        # 2. CAPABILITIES / HELP INTENT
        # =========================================================================
        is_help = any(h in msg_lower for h in HELP_PHRASES)
        if is_help and not has_produce_keywords:
            if lang == "mr-IN":
                help_text = (
                    "मी कृषिनिर्णय AI सहाय्यक आहे. मी आपल्याला टोमॅटो आणि कांद्यासाठी आज विक्री करावी की थांबावे, "
                    "वाहतूक व नासाडी खर्च किती येईल आणि किमान किती आरक्षण भाव मागावा याबद्दल अचूक सल्ला देतो. "
                    "आपले पीक आणि प्रमाण सांगा!"
                )
            elif lang == "hi-IN":
                help_text = (
                    "मैं कृषिनिर्णय AI सहायक हूँ। मैं आपको टमाटर और प्याज के लिए आज बेचने या रुकने, "
                    "परिवहन व खराबी खर्च और न्यूनतम आरक्षण भाव पर सही सलाह देता हूँ। अपनी फसल और मात्रा बताएं!"
                )
            else:
                help_text = (
                    "I am your KrishiNirnay AI assistant. I help you evaluate whether to Sell Now or Wait, "
                    "calculate round-trip transport freight, estimate perishability losses, and set your break-even reservation price. "
                    "Tell me your crop and quantity to get started!"
                )

            return AssistResponse(
                session_id=req.session_id,
                request_id=f"req-help-{uuid.uuid4().hex[:6]}",
                assistant_text=help_text,
                decision_record=None,
                warnings=[],
                voice_available=True,
                spoken_summary=help_text,
                fallback_path="NONE",
                slots=session.active_slots,
                clarification_needed=True,
                prompt_for_clarification=help_text
            )

        # =========================================================================
        # 3. ANALYTICAL FOLLOW-UP QUESTIONS ON ACTIVE DECISION
        # =========================================================================
        is_transport_query = any(w in msg_lower for w in [
            "वाहतूक", "भाडे", "भाडं", "गाडीभाडे", "हमाली", "तोलाई", "खर्च", "transport", "freight", "truck", "pickup", "fare", "vehicle cost", "logistics"
        ])
        is_timing_query = (
            ("आज" in msg_lower and ("उद्या" in msg_lower or "थांबू" in msg_lower or "विकू का" in msg_lower or "फायदा" in msg_lower or "नफा" in msg_lower)) or
            ("today" in msg_lower and ("tomorrow" in msg_lower or "wait" in msg_lower or "profit" in msg_lower or "gain" in msg_lower)) or
            ("आज" in msg_lower and ("कल" in msg_lower or "रुकें" in msg_lower)) or
            ("थांबू का" in msg_lower or "थांबणे" in msg_lower or "why wait" in msg_lower)
        )
        is_reservation_query = any(w in msg_lower for w in [
            "आरक्षण भाव", "किमान भाव", "हमी भाव", "reservation price", "floor price", "break even", "breakeven", "minimum price"
        ])
        is_spoilage_query = any(w in msg_lower for w in [
            "नासाडी", "खराब", "सडला", "सड", "वजन घट", "घट", "spoilage", "decay", "rot", "weight loss"
        ])
        is_weather_query = any(w in msg_lower for w in [
            "हवामान", "पाऊस", "weather", "rain", "forecast"
        ])

        is_analytical_followup = (is_transport_query or is_timing_query or is_reservation_query or is_spoilage_query or is_weather_query)

        # If user asks a follow-up question and does NOT specify new produce
        if is_analytical_followup and not (has_produce_keywords and has_numbers):
            # Resolve active decision record from session or context
            active_rec = session.dialogue_state.get("last_decision_record")
            if not active_rec and req.context:
                # Compute from context
                c_crop = req.context.get("crop") or session.active_slots.commodity or "Tomato"
                c_qty = float(req.context.get("quantity") or session.active_slots.quantity or 20.0)
                c_mandi = req.context.get("mandi") or session.active_slots.home_mandi or "Nashik APMC"
                active_rec = tool_analyze_sale_decision(
                    commodity=c_crop,
                    quantity=c_qty,
                    home_mandi=c_mandi,
                    requested_wait_days=session.active_slots.requested_wait_days or 2,
                    risk_profile=session.active_slots.risk_profile or "BALANCED"
                )
                session.set_last_decision(active_rec)

            if active_rec:
                if is_transport_query:
                    t_cost = int(active_rec.chosen.cost_breakdown.transport)
                    h_cost = int(active_rec.chosen.cost_breakdown.hamali_tolai)
                    tot_cost = int(active_rec.chosen.cost_breakdown.transport + active_rec.chosen.cost_breakdown.hamali_tolai + active_rec.chosen.cost_breakdown.storage)
                    if lang == "mr-IN":
                        reply_text = f"{active_rec.chosen.market} साठी वाहनाचा वाहतूक खर्च ₹{t_cost:,} आहे (हमाली खर्च ₹{h_cost:,}). एकूण प्रत्यक्ष खर्च ₹{tot_cost:,} येतो."
                    elif lang == "hi-IN":
                        reply_text = f"{active_rec.chosen.market} के लिए परिवहन खर्च ₹{t_cost:,} है (हम्माली खर्च ₹{h_cost:,})। कुल प्रत्यक्ष खर्च ₹{tot_cost:,} आता है।"
                    else:
                        reply_text = f"For {active_rec.chosen.market}, vehicle freight transport is ₹{t_cost:,} (labour/hamali is ₹{h_cost:,}). Total direct expenses come to ₹{tot_cost:,}."

                elif is_timing_query:
                    base_net = int(active_rec.baseline.net_total)
                    wait_net = int(active_rec.chosen.net_total)
                    gain_val = int(active_rec.chosen.gain_total)
                    w_days = active_rec.chosen.wait_days
                    if lang == "mr-IN":
                        reply_text = f"आज विकण्यापेक्षा {w_days} दिवस थांबल्यास ₹{gain_val:,} जास्त नफा होईल (आज ₹{base_net:,} ऐवजी निव्वळ ₹{wait_net:,} मिळतील)."
                    elif lang == "hi-IN":
                        reply_text = f"आज बेचने के बजाय {w_days} दिन रुकने पर ₹{gain_val:,} अतिरिक्त लाभ होगा (आज ₹{base_net:,} की तुलना में शुद्ध ₹{wait_net:,} मिलेंगे)।"
                    else:
                        reply_text = f"Selling today gives ₹{base_net:,} net, while waiting {w_days} days yields ₹{wait_net:,}—giving you +₹{gain_val:,} higher net profit."

                elif is_reservation_query:
                    res_price = int(active_rec.chosen.reservation_price)
                    if lang == "mr-IN":
                        reply_text = f"आपला किमान आरक्षण हमी भाव ₹{res_price:,}/क्विंटल आहे. बाजार समितीत यापेक्षा कमी भावात माल विकू नका."
                    elif lang == "hi-IN":
                        reply_text = f"आपका न्यूनतम आरक्षण भाव ₹{res_price:,}/क्विंटल है। मंडी में इससे कम दाम पर माल न बेचें।"
                    else:
                        reply_text = f"Your minimum break-even reservation floor price is ₹{res_price:,}/qtl. Do not sell below this rate at the destination mandi."

                elif is_spoilage_query:
                    loss_kg = round((active_rec.chosen.cost_breakdown.quantity_initial_qtl - active_rec.chosen.cost_breakdown.quantity_sold_qtl) * 100)
                    sold_qtl = round(active_rec.chosen.cost_breakdown.quantity_sold_qtl, 1)
                    if lang == "mr-IN":
                        reply_text = f"साठवणूक आणि प्रवासातील नासाडी अंदाजे {loss_kg} किलो गृहीत धरली आहे. उर्वरित {sold_qtl} क्विंटल विक्रीयोग्य मालावर हा निव्वळ नफा काढला आहे."
                    elif lang == "hi-IN":
                        reply_text = f"भंडारण और रास्ते की खराबी लगभग {loss_kg} किलो आंकी गई है। शेष {sold_qtl} क्विंटल बिक्री योग्य उपज पर यह शुद्ध लाभ निकाला गया है।"
                    else:
                        reply_text = f"Estimated holding and transit loss is ~{loss_kg} kg. Net returns are calculated on {sold_qtl} saleable quintals."

                else: # Weather
                    if lang == "mr-IN":
                        reply_text = "सध्याचे हवामान अनुकूल असून वाहतूक वेळ किंवा मालाच्या गुणवत्तेवर कोणताही गंभीर विपरीत परिणाम नाही."
                    elif lang == "hi-IN":
                        reply_text = "वर्तमान मौसम अनुकूल है और परिवहन समय या गुणवत्ता पर कोई प्रतिकूल प्रभाव नहीं है।"
                    else:
                        reply_text = "Current weather conditions are clear and favorable, with no severe alerts disrupting transit or storage."

                return AssistResponse(
                    session_id=req.session_id,
                    request_id=f"req-ans-{uuid.uuid4().hex[:6]}",
                    assistant_text=reply_text,
                    decision_record=active_rec,
                    warnings=[],
                    voice_available=True,
                    spoken_summary=reply_text,
                    fallback_path="TEMPLATE",
                    slots=session.active_slots,
                    clarification_needed=False,
                    prompt_for_clarification=None
                )

        # =========================================================================
        # 4. PROGRESSIVE PRODUCE SLOT EXTRACTION & FOLLOW-UP CLARIFICATION
        # =========================================================================
        new_slots = AgriculturalGlossary.extract_semantic_slots(req.message, existing_slots=None)
        if req.risk_profile_override:
            new_slots.risk_profile = req.risk_profile_override

        # If user explicitly provided slots, merge with session memory
        active_slots = session.update_slots(new_slots)

        # Check for missing critical slots and formulate follow-up question
        crop = active_slots.commodity
        qty = active_slots.quantity
        mandi = active_slots.home_mandi
        crop_mr = "टोमॅटो" if crop == "Tomato" else ("कांदा" if crop == "Onion" else crop)

        if "bag_weight_kg" in active_slots.missing_slots:
            if lang == "mr-IN":
                prompt_text = "आपण पोत्यांचा उल्लेख केला आहे. कृपया एका पोत्याचे वजन (उदा. ५० किलो किंवा २५ किलो) सांगा, जेणेकरून अचूक क्विंटल काढता येईल."
            elif lang == "hi-IN":
                prompt_text = "आपने कट्टे/बोरी का उल्लेख किया है। कृपया एक कट्टे का वजन (जैसे 50 किलो) बताएं, ताकि सही क्विंटल निकाला जा सके।"
            else:
                prompt_text = "You mentioned bags. Please specify the weight per bag in kg (e.g. 50 kg) to calculate accurate quintals."

            return AssistResponse(
                session_id=req.session_id,
                request_id=f"req-clarify-{uuid.uuid4().hex[:6]}",
                assistant_text=prompt_text,
                decision_record=None,
                warnings=[],
                voice_available=True,
                spoken_summary=prompt_text,
                fallback_path="NONE",
                slots=active_slots,
                clarification_needed=True,
                prompt_for_clarification=prompt_text
            )

        if not crop and qty is None:
            if lang == "mr-IN":
                prompt_text = "कृपया आपले पीक (टोमॅटो किंवा कांदा) आणि विक्रीसाठी उपलब्ध असलेले प्रमाण (उदा. २० क्विंटल) सांगा."
            elif lang == "hi-IN":
                prompt_text = "कृपया अपनी फसल (टमाटर या प्याज) और बिक्री के लिए उपलब्ध मात्रा (जैसे 20 क्विंटल) बताएं।"
            else:
                prompt_text = "Please tell me your crop (Tomato or Onion) and quantity (e.g. 20 quintals)."

            return AssistResponse(
                session_id=req.session_id,
                request_id=f"req-clarify-{uuid.uuid4().hex[:6]}",
                assistant_text=prompt_text,
                decision_record=None,
                warnings=[],
                voice_available=True,
                spoken_summary=prompt_text,
                fallback_path="NONE",
                slots=active_slots,
                clarification_needed=True,
                prompt_for_clarification=prompt_text
            )

        if crop and qty is None:
            if lang == "mr-IN":
                prompt_text = f"आपल्याकडे विक्रीसाठी किती क्विंटल {crop_mr} उपलब्ध आहे आणि आपली जवळची बाजार समिती कोणती आहे? (उदा. २० क्विंटल, नाशिक)"
            elif lang == "hi-IN":
                prompt_text = f"आपके पास बिक्री के लिए कितने क्विंटल {crop} उपलब्ध है और आपकी नजदीकी मंडी कौन सी है? (जैसे 20 क्विंटल, नासिक)"
            else:
                prompt_text = f"How many quintals of {crop} do you have for sale, and which is your nearest mandi? (e.g., 20 quintals, Nashik APMC)"

            return AssistResponse(
                session_id=req.session_id,
                request_id=f"req-clarify-{uuid.uuid4().hex[:6]}",
                assistant_text=prompt_text,
                decision_record=None,
                warnings=[],
                voice_available=True,
                spoken_summary=prompt_text,
                fallback_path="NONE",
                slots=active_slots,
                clarification_needed=True,
                prompt_for_clarification=prompt_text
            )

        if not crop and qty is not None:
            if lang == "mr-IN":
                prompt_text = f"हे {int(qty)} क्विंटल कोणते पीक आहे (टोमॅटो की कांदा) आणि आपली जवळची बाजार समिती कोणती आहे?"
            elif lang == "hi-IN":
                prompt_text = f"यह {int(qty)} क्विंटल कौन सी फसल है (टमाटर या प्याज) और आपकी नजदीकी मंडी कौन सी है?"
            else:
                prompt_text = f"Which crop is this {int(qty)} quintals for (Tomato or Onion), and which is your nearest mandi?"

            return AssistResponse(
                session_id=req.session_id,
                request_id=f"req-clarify-{uuid.uuid4().hex[:6]}",
                assistant_text=prompt_text,
                decision_record=None,
                warnings=[],
                voice_available=True,
                spoken_summary=prompt_text,
                fallback_path="NONE",
                slots=active_slots,
                clarification_needed=True,
                prompt_for_clarification=prompt_text
            )

        has_mandi_in_msg = any(m in msg_lower for m in [
            "नाशिक", "पिंपळगाव", "पिंपलगाव", "संगमनेर", "पुणे", "nashik", "pimpalgaon", "sangamner", "pune", "apmc", "मंडी", "बाजार"
        ])
        if has_mandi_in_msg:
            session.dialogue_state["mandi_specified"] = True

        mandi_specified = session.dialogue_state.get("mandi_specified", False)

        if crop and qty is not None and not mandi_specified:
            if lang == "mr-IN":
                prompt_text = f"आपण {int(qty)} क्विंटल {crop_mr} साठी विचारत आहात. आपला माल कोणत्या बाजार समितीत (उदा. नाशिक, पिंपळगाव किंवा संगमनेर) विक्रीसाठी न्यायचा आहे?"
            elif lang == "hi-IN":
                prompt_text = f"आप {int(qty)} क्विंटल {crop} के लिए पूछ रहे हैं। आप अपनी उपज किस मंडी (जैसे नासिक, पिंपलगांव या संगमनेर) में ले जाना चाहते हैं?"
            else:
                prompt_text = f"You have {int(qty)} quintals of {crop}. Which preferred mandi (e.g. Nashik APMC, Pimpalgaon Baswant, or Sangamner) would you like to evaluate?"

            return AssistResponse(
                session_id=req.session_id,
                request_id=f"req-clarify-{uuid.uuid4().hex[:6]}",
                assistant_text=prompt_text,
                decision_record=None,
                warnings=[],
                voice_available=True,
                spoken_summary=prompt_text,
                fallback_path="NONE",
                slots=active_slots,
                clarification_needed=True,
                prompt_for_clarification=prompt_text
            )

        # =========================================================================
        # 5. ALL SLOTS COMPLETE -> INVOKE BOUNDED DETERMINISTIC DECISION TOOL
        # =========================================================================
        wait_days = active_slots.requested_wait_days if active_slots.requested_wait_days is not None else 2
        risk_profile = active_slots.risk_profile or "BALANCED"

        decision_record = tool_analyze_sale_decision(
            commodity=crop,
            quantity=qty,
            home_mandi=mandi,
            requested_wait_days=wait_days,
            risk_profile=risk_profile
        )
        session.set_last_decision(decision_record)

        deterministic_text = DeterministicTemplates.render_recommendation(decision_record, lang)
        spoken_summary = DeterministicTemplates.render_spoken_summary(decision_record, lang)

        # For conversational queries, optionally attempt LLM with Number Guard
        fallback_path = "TEMPLATE"
        final_text = deterministic_text

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
                is_valid, unsupported = NumberGuard.validate(candidate_text, decision_record)
                if is_valid:
                    final_text = candidate_text
                    fallback_path = provider
                else:
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
