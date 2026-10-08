"""Voice transcription and speech synthesis routes for KrishiNirnay."""

from fastapi import APIRouter, HTTPException
from contracts.schemas.voice import TranscribeRequest, TranscribeResponse, SpeakRequest, SpeakResponse
from apps.api.voice.asr import asr_service
from apps.api.voice.tts import tts_service
from apps.api.mock_engine.deterministic_engine import engine

router = APIRouter(prefix="/api/voice", tags=["Voice"])

@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_endpoint(req: TranscribeRequest):
    try:
        resp = await asr_service.transcribe_audio(
            audio_base64=req.audio_base64,
            language=req.language
        )
        return resp
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ASR error: {str(e)}")

@router.post("/speak", response_model=SpeakResponse)
async def speak_endpoint(req: SpeakRequest):
    try:
        resp = await tts_service.synthesize(
            text=req.text,
            language=req.language
        )
        return resp
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS error: {str(e)}")
