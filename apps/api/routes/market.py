"""Market snapshot and historical price routes for KrishiNirnay."""

from fastapi import APIRouter, Query, HTTPException
from contracts.schemas.market_snapshot import MarketSnapshot, PriceHistoryResponse
from apps.api.mock_engine.deterministic_engine import engine

router = APIRouter(prefix="/api", tags=["Market"])

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
