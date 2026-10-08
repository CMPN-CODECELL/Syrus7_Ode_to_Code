"""Market snapshot and price history schemas for KrishiNirnay."""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class MarketSnapshot(BaseModel):
    market: str
    commodity: str
    observation_date: str
    modal_price_inr_per_qtl: float
    min_price_inr_per_qtl: float
    max_price_inr_per_qtl: float
    arrivals: float
    arrivals_unit: str = "tonnes"
    source: str = "data.gov.in"
    fetched_at: str
    freshness: Literal["FRESH", "SLIGHTLY_STALE", "STALE_RED"]
    trading_day_age: int
    warnings: List[str] = Field(default_factory=list)
    is_open: bool = True

class PriceHistoryPoint(BaseModel):
    date: str
    modal_price: float
    min_price: float
    max_price: float
    arrivals: float
    source: str
    is_confirmed: bool = True

class PriceHistoryResponse(BaseModel):
    commodity: str
    market: str
    series: List[PriceHistoryPoint]
    days: int
    freshness: str
    source: str
    last_confirmed_date: str
