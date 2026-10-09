"""Market snapshot, historical price, and real-time dynamic translation routes for KrishiNirnay."""

from fastapi import APIRouter, Query, HTTPException, Body
from typing import List, Union, Dict
from pydantic import BaseModel

from contracts.schemas.market_snapshot import MarketSnapshot, PriceHistoryResponse
from apps.api.mock_engine.deterministic_engine import engine
from apps.api.voice.glossary import GLOSSARY_MAP

router = APIRouter(prefix="/api", tags=["Market"])

class TranslateRequest(BaseModel):
    text: Union[str, List[str]]
    target_lang: str = "mr-IN"

class TranslateResponse(BaseModel):
    translated_text: Union[str, List[str]]
    source_lang: str = "auto"
    target_lang: str

# Dynamic Translation Dictionary for real-time vocabulary expansion
TRANSLATION_DICT: Dict[str, Dict[str, str]] = {
    # Mandis
    "Nashik APMC": {"mr-IN": "नाशिक बाजार समिती", "hi-IN": "नासिक मंडी", "en-IN": "Nashik APMC"},
    "Pimpalgaon Baswant APMC": {"mr-IN": "पिंपळगाव बसवंत बाजार समिती", "hi-IN": "पिंपलगांव बसवंत मंडी", "en-IN": "Pimpalgaon Baswant APMC"},
    "Lasalgaon APMC": {"mr-IN": "लासलगाव बाजार समिती", "hi-IN": "लासलगांव मंडी", "en-IN": "Lasalgaon APMC"},
    "Pune APMC": {"mr-IN": "पुणे बाजार समिती", "hi-IN": "पुणे मंडी", "en-IN": "Pune APMC"},
    
    # Crops
    "Tomato": {"mr-IN": "टोमॅटो", "hi-IN": "टमाटर", "en-IN": "Tomato"},
    "Onion": {"mr-IN": "कांदा", "hi-IN": "प्याज", "en-IN": "Onion"},
    "Wheat": {"mr-IN": "गहू", "hi-IN": "गेहूं", "en-IN": "Wheat"},
    "Soybean": {"mr-IN": "सोयाबीन", "hi-IN": "सोयाबीन", "en-IN": "Soybean"},

    # Actions
    "WAIT": {"mr-IN": "थांबा", "hi-IN": "रुकें", "en-IN": "WAIT"},
    "SELL_NOW": {"mr-IN": "आजच विका", "hi-IN": "आज ही बेचें", "en-IN": "SELL NOW"},
    "GO": {"mr-IN": "दुसऱ्या बाजारात जा", "hi-IN": "दूसरी मंडी जाएं", "en-IN": "GO TO ANOTHER MANDI"},

    # Weather & Alerts
    "Clear Sky": {"mr-IN": "निरभ्र आकाश • स्वच्छ ऊन", "hi-IN": "साफ आसमान • धूप", "en-IN": "Clear Sky • Sunny"},
    "Sunny": {"mr-IN": "स्वच्छ ऊन", "hi-IN": "धूप", "en-IN": "Sunny"},
    "Heavy Rain Warning": {"mr-IN": "मुसळधार पावसाचा इशारा", "hi-IN": "भारी बारिश की चेतावनी", "en-IN": "Heavy Rain Warning"},
    "Market Closed": {"mr-IN": "बाजार बंद (साप्ताहिक सुट्टी)", "hi-IN": "मंडी बंद (साप्ताहिक अवकाश)", "en-IN": "Market Closed (Weekly Off)"},
    "Price Rising": {"mr-IN": "भाव वाढण्याची शक्यता", "hi-IN": "भाव बढ़ने की संभावना", "en-IN": "Price Rising Trend"},
    "Price Falling": {"mr-IN": "भाव घसरण्याची शक्यता", "hi-IN": "भाव गिरने की संभावना", "en-IN": "Price Falling Trend"},
    "Active Trading": {"mr-IN": "सक्रिय व्यवहार", "hi-IN": "सक्रिय व्यापार", "en-IN": "Active Trading"},
    "Verified Data": {"mr-IN": "सत्यापित माहिती", "hi-IN": "सत्यापित डेटा", "en-IN": "Verified Data"}
}

def translate_single_phrase(text: str, target_lang: str) -> str:
    cleaned = text.strip()
    if not cleaned:
        return ""
    
    # Check exact dictionary match
    if cleaned in TRANSLATION_DICT:
        return TRANSLATION_DICT[cleaned].get(target_lang, cleaned)
    
    # Check lowercase or partial token replacement
    result = cleaned
    for src, trans in TRANSLATION_DICT.items():
        if src.lower() in result.lower():
            replacement = trans.get(target_lang, src)
            result = result.replace(src, replacement)
    
    # Number translation to Devanagari numerals for Marathi/Hindi if requested
    return result

@router.post("/translate", response_model=TranslateResponse)
def translate_endpoint(req: TranslateRequest):
    """Real-time dynamic translation endpoint for live data and custom farmer text."""
    target_lang = req.target_lang or "mr-IN"
    
    if isinstance(req.text, list):
        translated = [translate_single_phrase(t, target_lang) for t in req.text]
    else:
        translated = translate_single_phrase(req.text, target_lang)
        
    return TranslateResponse(
        translated_text=translated,
        source_lang="auto",
        target_lang=target_lang
    )

@router.get("/market-snapshot", response_model=MarketSnapshot)
def get_market_snapshot(
    crop: str = Query("Tomato", description="Commodity name"),
    mandi: str = Query("Nashik APMC", description="Mandi name")
):
    try:
        return engine.get_market_snapshot(crop=crop, mandi=mandi)
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))

@router.get("/price-history", response_model=PriceHistoryResponse)
def get_price_history(
    crop: str = Query("Tomato", description="Commodity name"),
    mandi: str = Query("Nashik APMC", description="Mandi name"),
    days: int = Query(30, ge=7, le=90, description="History window days (30-90)")
):
    try:
        return engine.get_price_history(crop=crop, mandi=mandi, days=days)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
