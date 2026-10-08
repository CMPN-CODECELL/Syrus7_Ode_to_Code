"""Public FastAPI Gateway for KrishiNirnay.
Project tagline: "Sahi Bhav Se, Samriddhi Ki Raah Pe."
Division 3 Full Stack + AI Implementation.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json
import os

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("apps.api.main:app", host="0.0.0.0", port=8000, reload=True)
