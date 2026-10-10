"""Market snapshot, historical price, and real-time dynamic translation routes for KrishiNirnay."""

from fastapi import APIRouter, Query, HTTPException, Body
from typing import List, Union, Dict, Optional
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
    "Sangamner APMC": {"mr-IN": "संगमनेर बाजार समिती", "hi-IN": "संगमनेर मंडी", "en-IN": "Sangamner APMC"},
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

class MandiDayStatus(BaseModel):
    day_offset: int
    date_str: str
    day_name: str
    is_open: bool
    status_label: str
    holiday_name: Optional[str] = None
    modal_price: float
    expected_arrivals_tonnes: float
    advisory: str

class MarketCalendarResponse(BaseModel):
    mandi: str
    crop: str
    generated_at: str
    days: List[MandiDayStatus]

class WeatherImpactResponse(BaseModel):
    district: str
    temperature_c: float
    humidity_pct: int
    rainfall_forecast_mm: float
    alert_level: str
    weather_summary: str
    price_impact_direction: str
    harvest_disruption: str
    storage_spoilage_risk: str
    recommended_action: str

@router.get("/market-calendar", response_model=MarketCalendarResponse)
def get_market_calendar(
    crop: str = Query("Tomato", description="Commodity name"),
    mandi: str = Query("Nashik APMC", description="Mandi name")
):
    if "Onion" in crop:
        base_modal = 2700.0 if "Nashik" in mandi else (2950.0 if "Pimpalgaon" in mandi else 2050.0)
    else:
        base_modal = 1800.0 if "Nashik" in mandi else (1860.0 if "Pimpalgaon" in mandi else 1820.0)
    
    # Day 2 is Sunday (Oct 11); Day 4 is Festival Holiday (Oct 13 Amavasya)
    schedule = [
        MandiDayStatus(
            day_offset=0,
            date_str="2026-10-09",
            day_name="Today (Fri)",
            is_open=True,
            status_label="OPEN",
            holiday_name=None,
            modal_price=base_modal,
            expected_arrivals_tonnes=142.0,
            advisory="Active morning session. Standard arrivals."
        ),
        MandiDayStatus(
            day_offset=1,
            date_str="2026-10-10",
            day_name="Tomorrow (Sat)",
            is_open=True,
            status_label="OPEN",
            holiday_name=None,
            modal_price=round(base_modal + 80.0, 0),
            expected_arrivals_tonnes=165.0,
            advisory="Pre-weekend retail restocking demand. Strong price momentum."
        ),
        MandiDayStatus(
            day_offset=2,
            date_str="2026-10-11",
            day_name="Day 2 (Sun)",
            is_open=False if "Pimpalgaon" not in mandi else True,
            status_label="CLOSED (Weekly Off)" if "Pimpalgaon" not in mandi else "OPEN (Private Sub-Yard)",
            holiday_name="Sunday APMC Holiday" if "Pimpalgaon" not in mandi else None,
            modal_price=1950.0 if "Pimpalgaon" in mandi else 0.0,
            expected_arrivals_tonnes=85.0 if "Pimpalgaon" in mandi else 0.0,
            advisory="Nashik & Sangamner closed on Sunday! Divert to Pimpalgaon private yard or sell on Saturday."
        ),
        MandiDayStatus(
            day_offset=3,
            date_str="2026-10-12",
            day_name="Day 3 (Mon)",
            is_open=True,
            status_label="OPEN",
            holiday_name=None,
            modal_price=round(base_modal + 40.0, 0),
            expected_arrivals_tonnes=190.0,
            advisory="Post-weekend arrival surge. Normal competitive auctions."
        ),
        MandiDayStatus(
            day_offset=4,
            date_str="2026-10-13",
            day_name="Day 4 (Tue)",
            is_open=False,
            status_label="CLOSED (Amavasya Holiday)",
            holiday_name="Regional Festival / Amavasya Bazaar Closure",
            modal_price=0.0,
            expected_arrivals_tonnes=0.0,
            advisory="Mandis completely closed for festival holiday. Transporting produce today will incur stranded holding loss!"
        ),
        MandiDayStatus(
            day_offset=5,
            date_str="2026-10-14",
            day_name="Day 5 (Wed)",
            is_open=True,
            status_label="OPEN",
            holiday_name=None,
            modal_price=round(base_modal - 50.0, 0),
            expected_arrivals_tonnes=210.0,
            advisory="Post-holiday supply backlog arrives; expect moderate price softening."
        ),
        MandiDayStatus(
            day_offset=6,
            date_str="2026-10-15",
            day_name="Day 6 (Thu)",
            is_open=True,
            status_label="OPEN",
            holiday_name=None,
            modal_price=round(base_modal - 80.0, 0),
            expected_arrivals_tonnes=175.0,
            advisory="Normal weekday market clearing."
        )
    ]
    return MarketCalendarResponse(
        mandi=mandi,
        crop=crop,
        generated_at="2026-10-09T05:30:00+05:30",
        days=schedule
    )

@router.get("/weather-impact", response_model=WeatherImpactResponse)
def get_weather_impact(
    crop: str = Query("Tomato", description="Commodity name"),
    mandi: str = Query("Nashik APMC", description="Mandi name")
):
    """Provides meteorological forecast and its quantified impact on agricultural prices and transit risks."""
    is_onion = "Onion" in crop
    return WeatherImpactResponse(
        district="Nashik Agricultural District",
        temperature_c=28.4,
        humidity_pct=78,
        rainfall_forecast_mm=18.0,
        alert_level="YELLOW",
        weather_summary="IMD Yellow Alert: Moderate rainfall and scattered thunderstorms expected across Niphad, Dindori, and Nashik belt over Day 1 night to Day 2.",
        price_impact_direction="UPWARD_SHORT_TERM",
        harvest_disruption="Wet fields slow picking labor and transport loading by ~25%, causing a temporary drop in early morning arrival volumes.",
        storage_spoilage_risk=(
            "Ambient moisture increases neck rot and surface mould in damp storage; onion holding loss in well-aerated chawl remains controlled at ~0.2%/day."
            if is_onion
            else "High ambient moisture and humidity (78%) accelerates fungal bacterial softening; perishable tomato holding decay doubles from 1.0% to 2.0%/day."
        ),
        recommended_action=(
            "Ensure covered transport tarpaulins against rainfall. Safe to hold up to 3 days in ventilated dry storage before selling at peak mandi."
            if is_onion
            else "Harvest and sell on Day 1 (Saturday) before rainfall. If holding till Day 2, use tarpaulin-covered crates and sell early at Pimpalgaon."
        )
    )

