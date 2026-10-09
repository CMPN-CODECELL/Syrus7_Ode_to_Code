"""Voice transcription and synthesis schemas for KrishiNirnay."""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class TranscribeRequest(BaseModel):
    audio_base64: Optional[str] = None
    language: Literal["mr-IN", "hi-IN", "en-IN"] = "mr-IN"
    sample_rate_hertz: int = 16000

class TranscribeResponse(BaseModel):
    transcript: str
    detected_language: str
    confidence_score: float = Field(..., description="Estimated acoustic/language confidence [0, 1]")
    provider_used: Literal["GROQ_WHISPER_TURBO", "WHISPER_V3", "BROWSER_SPEECH", "SIMULATED_MOCK"]
    normalized_terms: List[str] = Field(default_factory=list)
    latency_ms: float
    is_ambiguous: bool = False
    clarification_prompt: Optional[str] = None

class SpeakRequest(BaseModel):
    text: str = Field(..., description="Text to synthesize")
    language: Literal["mr-IN", "hi-IN", "en-IN"] = "mr-IN"
    format: Literal["mp3", "wav", "browser_fallback"] = "mp3"
    concise_mode: bool = True

class SpeakResponse(BaseModel):
    audio_base64: Optional[str] = None
    format: str = "mp3"
    provider_used: Literal["GEMINI_FLASH_LITE_TTS", "BROWSER_SPEECH", "TEXT_ONLY"]
    spoken_text: str
    latency_ms: float
