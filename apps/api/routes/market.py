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
    location: Optional[str] = None
    temperature_c: float
    humidity_pct: int
    rainfall_forecast_mm: float
    wind_speed_kmh: Optional[float] = 14.0
    road_condition_label: Optional[str] = "Wet Approaches (+20% Travel Time)"
    road_slowdown_pct: Optional[int] = 20
    alert_level: str
    weather_summary: str
    price_impact_direction: str
    harvest_disruption: str
    storage_spoilage_risk: str
    recommended_action: str
    weather_summary_mr: Optional[str] = None
    harvest_disruption_mr: Optional[str] = None
    storage_spoilage_risk_mr: Optional[str] = None
    recommended_action_mr: Optional[str] = None

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

LOCATION_MICROCLIMATES = {
    "Default Catchment": {
        "district": "Nashik Central Catchment",
        "temp": 28.4,
        "humidity": 78,
        "rain": 18.0,
        "wind": 14.0,
        "road_label": "Wet Approaches (+20% Time)",
        "road_label_mr": "ओले रस्ते (+२०% वेळ)",
        "road_slowdown": 20,
        "alert": "YELLOW",
        "alert_mr": "यलो अलर्ट",
        "summary": "IMD Yellow Alert: Moderate rainfall and scattered thunderstorms expected across central Nashik belt.",
        "summary_mr": "हवामान खात्याचा यलो अलर्ट: मध्य नाशिक पट्ट्यात मध्यम पाऊस व मेघगर्जनेची शक्यता.",
    },
    "Niphad": {
        "district": "Niphad Taluka (Godavari River Basin)",
        "temp": 27.6,
        "humidity": 82,
        "rain": 22.0,
        "wind": 16.0,
        "road_label": "Flooded Approach Roads (+25% Time)",
        "road_label_mr": "पाणथळ रस्ते (+२५% वेळ)",
        "road_slowdown": 25,
        "alert": "YELLOW",
        "alert_mr": "यलो अलर्ट",
        "summary": "River basin high-moisture alert: 22mm rainfall expected with persistent morning humidity.",
        "summary_mr": "गोदावरी खोरे उच्च आर्द्रता इशारा: २२ मिमी पाऊस व सकाळी धुके/दमट हवामान संभवते.",
    },
    "Dindori": {
        "district": "Dindori Taluka (Sahyadri Foothills)",
        "temp": 25.8,
        "humidity": 86,
        "rain": 26.5,
        "wind": 20.0,
        "road_label": "Slippery Ghat Tracks (+30% Time)",
        "road_label_mr": "निसरडे घाट रस्ते (+३०% वेळ)",
        "road_slowdown": 30,
        "alert": "YELLOW",
        "alert_mr": "यलो अलर्ट",
        "summary": "Foothill rainfall alert: 26.5mm heavy showers along Western Ghats foothills.",
        "summary_mr": "सह्याद्री पायथा पाऊस इशारा: २६.५ मिमी मुसळधार सरी व थंड हवामान संभवते.",
    },
    "Nashik Rural": {
        "district": "Nashik Rural (Plateau Zone)",
        "temp": 28.2,
        "humidity": 75,
        "rain": 16.0,
        "wind": 14.0,
        "road_label": "Damp Highway Approaches (+15% Time)",
        "road_label_mr": "दमट महामार्ग रस्ते (+१५% वेळ)",
        "road_slowdown": 15,
        "alert": "YELLOW",
        "alert_mr": "यलो अलर्ट",
        "summary": "Passing afternoon showers (16mm) with moderate winds across rural plateau.",
        "summary_mr": "दुपारनंतर मध्यम पाऊस (१६ मिमी) व हलके वारे वाहण्याची शक्यता.",
    },
    "Sinnar": {
        "district": "Sinnar Taluka (Rain-Shadow Belt)",
        "temp": 30.5,
        "humidity": 58,
        "rain": 6.5,
        "wind": 18.0,
        "road_label": "Dry Highway Network (+5% Time)",
        "road_label_mr": "कोरडे महामार्ग (+५% वेळ)",
        "road_slowdown": 5,
        "alert": "GREEN",
        "alert_mr": "ग्रीन अलर्ट (सुरक्षित)",
        "summary": "Isolated light drizzle (6.5mm) on leeward plateau; clear road haulage conditions.",
        "summary_mr": "पठारावर हलकी रिमझिम (६.५ मिमी); वाहतुकीसाठी हवामान पूर्णपणे अनुकूल.",
    },
    "Sangamner Rural": {
        "district": "Sangamner Taluka (Pravara Basin)",
        "temp": 31.0,
        "humidity": 62,
        "rain": 8.0,
        "wind": 12.0,
        "road_label": "Clear State Highway (+8% Time)",
        "road_label_mr": "स्वच्छ राज्य महामार्ग (+८% वेळ)",
        "road_slowdown": 8,
        "alert": "GREEN",
        "alert_mr": "ग्रीन अलर्ट (सुरक्षित)",
        "summary": "Warm semi-arid conditions (31°C) with light scattered showers (8mm).",
        "summary_mr": "उबदार हवामान (३१° से) आणि तुरळक पावसाच्या सरी (८ मिमी).",
    }
}

@router.get("/weather-impact", response_model=WeatherImpactResponse)
def get_weather_impact(
    crop: str = Query("Tomato", description="Commodity name"),
    mandi: str = Query("Nashik APMC", description="Mandi name"),
    location: str = Query("Default Catchment", description="Farm catchment location")
):
    """Provides meteorological forecast and its quantified impact on agricultural prices and transit risks."""
    is_onion = "Onion" in crop
    loc_key = "Default Catchment"
    for k in LOCATION_MICROCLIMATES.keys():
        if k.lower() in location.lower():
            loc_key = k
            break
            
    clim = LOCATION_MICROCLIMATES.get(loc_key, LOCATION_MICROCLIMATES["Default Catchment"])
    
    if is_onion:
        harvest_text = f"Rain of {clim['rain']}mm delays field lifting; wet topsoil must dry before harvesting."
        harvest_mr = f"{clim['rain']} मिमी पावसामुळे शेतातील कांदा काढणी लांबणीवर पडेल; जमीन सुकेपर्यंत काढणी थांबवा."
        storage_text = f"Elevated humidity ({clim['humidity']}%) risks neck-rot in open field piles (0.4%/day). Ventilated bamboo chawls keep loss strictly safe at 0.2%/day."
        storage_mr = f"हवेतील दमटपणामुळे ({clim['humidity']}%) उघड्या ढिगाऱ्यात सड लागण्याची भीती आहे. हवेशीर कांदा चाळीत साठवणूक नुकसान ०.२%/दिवस इतके नियंत्रित राहते."
        action_text = f"Store in elevated ventilated chawls. Tie down waterproof tarpaulins against {clim['rain']}mm rainfall before dispatching to {mandi}."
        action_mr = f"कांदा हवेशीर चाळीत सुरक्षित ठेवा. {clim['rain']} मिमी पावसापासून संरक्षणासाठी ताडपत्री बांधून {mandi} मध्ये पाठवा."
    else:
        harvest_text = f"Muddy fields delay tomato hand-picking by ~25%; temporary supply dip creates morning price strength."
        harvest_mr = "पावसामुळे शेतात चिखल होऊन तोडणी २५% लांबेल; बाजारात सकाळची आवक घटल्याने भावात तात्पुरती वाढ होईल."
        storage_text = f"High humidity ({clim['humidity']}%) causes fruit skin softening and fungal rot; perishable crate decay doubles to 2.0%/day."
        storage_mr = f"जास्त आर्द्रतेमुळे ({clim['humidity']}%) टोमॅटो मऊ पडून नासण्याची शक्यता वाढते; क्रेटमधील नासाडी २%/दिवस होते."
        action_text = f"Harvest on Saturday (Day 1) before showers or transport in covered crates early Sunday via Pimpalgaon private yard."
        action_mr = "पावसापूर्वी तोडणी करून माल शनिवारीच विका किंवा रविवारी सकाळी प्लास्टिक क्रेट्सवर ताडपत्री झाकून विक्री करा."
        
    return WeatherImpactResponse(
        district=clim["district"],
        location=loc_key,
        temperature_c=clim["temp"],
        humidity_pct=clim["humidity"],
        rainfall_forecast_mm=clim["rain"],
        wind_speed_kmh=clim["wind"],
        road_condition_label=clim["road_label"],
        road_slowdown_pct=clim["road_slowdown"],
        alert_level=clim["alert"],
        weather_summary=clim["summary"],
        price_impact_direction="UPWARD_SHORT_TERM" if clim["rain"] > 10 else "STABLE",
        harvest_disruption=harvest_text,
        storage_spoilage_risk=storage_text,
        recommended_action=action_text,
        weather_summary_mr=clim["summary_mr"],
        harvest_disruption_mr=harvest_mr,
        storage_spoilage_risk_mr=storage_mr,
        recommended_action_mr=action_mr
    )

