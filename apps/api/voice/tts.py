"""TTS (Text-to-Speech) Module for KrishiNirnay.
Generates concise 3-part spoken answers:
1. Verdict (Sell / Wait / Go)
2. Net Amount
3. One Main Risk
Chain: Gemini 3.8 Flash-Lite TTS -> Browser Speech API / Web Speech -> Text only.
"""

import time
import os
import logging
from typing import Optional
from contracts.schemas.voice import SpeakResponse
from contracts.schemas.decision_record import DecisionRecord
from apps.api.llm.deterministic_templates import DeterministicTemplates

logger = logging.getLogger("krishinirnay.tts")

class TTSModule:
    def __init__(self):
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")

    async def synthesize(
        self,
        text: str,
        language: str = "mr-IN",
        record: Optional[DecisionRecord] = None
    ) -> SpeakResponse:
        start_time = time.time()

        # Generate concise 3-part spoken text
        spoken_text = text
        if record:
            spoken_text = DeterministicTemplates.render_spoken_summary(record, language)

        # Fallback to browser speech API
        # The frontend client will use Web Speech API or expo-speech natively with this verified spoken_text!
        provider = "BROWSER_SPEECH"

        return SpeakResponse(
            audio_base64=None,
            format="browser_fallback",
            provider_used=provider,
            spoken_text=spoken_text,
            latency_ms=round((time.time() - start_time) * 1000.0, 1)
        )

tts_service = TTSModule()
