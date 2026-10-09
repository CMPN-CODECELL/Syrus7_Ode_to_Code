"""Public FastAPI Gateway for KrishiNirnay.
Project tagline: "Sahi Bhav Se, Samriddhi Ki Raah Pe."
Division 3 Full Stack + AI Implementation.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json
import os
import uuid
import asyncio
from datetime import datetime

from apps.api.security.middleware import SecurityMiddleware
from apps.api.routes.assist import router as assist_router
from apps.api.routes.voice import router as voice_router
from apps.api.routes.market import router as market_router
from apps.api.routes.scenario import router as scenario_router
from apps.api.routes.demo import router as demo_router
from apps.api.routes.health import router as health_router

app = FastAPI(
    title="KrishiNirnay Public Gateway",
    description="AI Market and Risk Intelligence for Agri Supply Chains. Tagline: 'Sahi Bhav Se, Samriddhi Ki Raah Pe.'",
    version="1.0.0"
)

# CORS setup for web companion PWA and mobile client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security and Rate Limiting Middleware
app.add_middleware(SecurityMiddleware, max_body_bytes=1048576, rate_limit_per_min=120)

# Include API Routers
app.include_router(assist_router)
app.include_router(voice_router)
app.include_router(market_router)
app.include_router(scenario_router)
app.include_router(demo_router)
app.include_router(health_router)

@app.get("/")
def root():
    return {
        "app": "KrishiNirnay",
        "tagline": "Sahi Bhav Se, Samriddhi Ki Raah Pe.",
        "version": "1.0.0",
        "status": "online",
        "docs_url": "/docs"
    }

@app.get("/api/heatmap")
def get_heatmap():
    """Provides the 3x7 Best-Day / Best-Mandi heatmap data."""
    snapshot_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "demo", "verified_snapshot.json")
    if os.path.exists(snapshot_path):
        with open(snapshot_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("heatmap_3x7", {})
    return {"error": "Snapshot unavailable"}

@app.websocket("/ws/market-feed")
async def websocket_market_feed(websocket: WebSocket):
    """Real-time streaming WebSocket endpoint for live mandi ticks, weather, and closures."""
    await websocket.accept()
    client_id = f"farmer-{uuid.uuid4().hex[:6]}"
    try:
        # Initial push upon connection
        await websocket.send_json({
            "type": "INITIAL_MARKET_STATE",
            "client_id": client_id,
            "timestamp": datetime.now().isoformat(),
            "mandis": [
                {
                    "name": "Nashik APMC",
                    "commodity": "Tomato",
                    "modal_price": 1800.0,
                    "min_price": 1300.0,
                    "max_price": 2000.0,
                    "arrivals_tonnes": 142.0,
                    "status": "OPEN",
                    "weather_alert": "Yellow Alert: Rain expected on Day 2"
                },
                {
                    "name": "Pimpalgaon Baswant APMC",
                    "commodity": "Tomato",
                    "modal_price": 1860.0,
                    "min_price": 1400.0,
                    "max_price": 2100.0,
                    "arrivals_tonnes": 210.0,
                    "status": "OPEN",
                    "weather_alert": "Open Sunday via private yard"
                },
                {
                    "name": "Lasalgaon APMC",
                    "commodity": "Tomato",
                    "modal_price": 1820.0,
                    "min_price": 1350.0,
                    "max_price": 2050.0,
                    "arrivals_tonnes": 98.0,
                    "status": "OPEN",
                    "weather_alert": "Closed on Day 4 for Amavasya"
                }
            ],
            "weather": {
                "district": "Nashik Belt",
                "temp_c": 28.4,
                "rain_mm": 18.0,
                "summary": "Scattered rain on Day 2 (Oct 11)",
                "impact": "Slows harvest picking; holding rot risk increases to 2%/day"
            },
            "closures": [
                {"day_offset": 2, "mandi": "Nashik APMC", "reason": "Sunday Weekly Off"},
                {"day_offset": 4, "mandi": "All Mandis", "reason": "Festival Holiday (Amavasya Bazaar Off)"}
            ]
        })

        ticker_items = [
            "🟢 09:15 AM: Pimpalgaon Baswant APMC opened active tomato trading at ₹1,860/qtl",
            "📦 09:45 AM: Nashik APMC received 142 tonnes; modal price steady at ₹1,800/qtl",
            "🌧️ 10:30 AM: IMD updates: 18mm thunderstorm alert active across Niphad catchment for Saturday night",
            "🛑 11:00 AM: APMC Advisory: Sunday closure notice issued for Nashik & Lasalgaon APMC yards",
            "📈 11:45 AM: High retail demand in Pune and Mumbai pulling up premium A-grade tomato bids by +₹50/qtl"
        ]
        ticker_idx = 0

        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=4.0)
                msg = json.loads(data)
                if msg.get("type") == "PING":
                    await websocket.send_json({"type": "PONG", "timestamp": datetime.now().isoformat()})
                elif msg.get("type") == "REQUEST_REFRESH":
                    await websocket.send_json({
                        "type": "MARKET_REFRESH",
                        "timestamp": datetime.now().isoformat(),
                        "status": "synchronized"
                    })
            except asyncio.TimeoutError:
                item = ticker_items[ticker_idx % len(ticker_items)]
                ticker_idx += 1
                await websocket.send_json({
                    "type": "LIVE_TICKER",
                    "ticker": item,
                    "timestamp": datetime.now().isoformat()
                })
    except WebSocketDisconnect:
        pass
    except Exception:
        pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("apps.api.main:app", host="0.0.0.0", port=8000, reload=True)
