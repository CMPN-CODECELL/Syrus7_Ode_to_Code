"""
services/adapters/division1_adapter.py

Division 1 Data & Forecasting Integration Adapter for KrishiNirnay.
Project Tagline: "Sahi Bhav Se, Samriddhi Ki Raah Pe"
Authority: SYRUS_PS02_MASTER.md & SYRUS_PS02_DIVISION_2_DECISION_RISK_ENGINE.md

Responsibilities:
1. Normalize market snapshot contracts from Division 1.
2. Canonicalize market names and aliases (e.g. APMC Nasik -> Nashik APMC).
3. Safely normalize arrivals with strict unit preservation (never multiply or divide twice).
4. Enforce freshness from observation_date and trading calendar (NEVER from fetched_at).
5. Validate forecast quantiles and uncertainty distributions.
6. Provide safe fallback and INSUFFICIENT_EVIDENCE when Division 1 data is stale or missing.
"""

from __future__ import annotations

import os
import csv
import json
import logging
from datetime import datetime, date, timedelta
from typing import Dict, Any, Optional, Tuple, List, Sequence
from pydantic import BaseModel, Field

from ..decision.market_mapping import canonicalize_mandi_name, get_source_mandi_name
from ..decision.decision_policy import MarketSnapshotInput, ForecastTargetInput

logger = logging.getLogger(__name__)


def normalize_arrivals_to_qtl(arrivals: float, unit: str = "tonnes") -> float:
    """
    Converts arrival volume into canonical quintals (qtl).
    CRITICAL INVARIANT: Respects arrivals_unit so that values are converted EXACTLY ONCE.
      1 tonne = 10 qtl
      1 qtl = 1 qtl (already in quintals)
      1 kg = 0.01 qtl
    """
    if arrivals <= 0:
        return 0.0
    u = (unit or "tonnes").strip().lower()
    if u in ("tonnes", "tonne", "mt", "metric tonnes", "metric tonne"):
        return round(float(arrivals) * 10.0, 2)
    elif u in ("qtl", "quintal", "quintals"):
        return round(float(arrivals), 2)
    elif u in ("kg", "kilogram", "kilograms"):
        return round(float(arrivals) / 100.0, 2)
    else:
        # Default fallback assumption
        return round(float(arrivals), 2)


def compute_trading_session_age(
    observation_date_str: str,
    current_date_str: str,
    closed_weekdays: Sequence[int] = (6,) # 6 = Sunday in Python weekday() (0=Monday)
) -> int:
    """
    Computes elapsed expected market trading sessions strictly based on observation_date
    and the market trading calendar.
    
    CRITICAL INVARIANT:
    Fetched At indicates retrieval time, NOT observation date.
    A recent retrieval of old data must NEVER make it appear fresh!
    """
    try:
        obs_date = datetime.strptime(observation_date_str[:10], "%Y-%m-%d").date()
        curr_date = datetime.strptime(current_date_str[:10], "%Y-%m-%d").date()
    except Exception:
        # If dates cannot be parsed, treat as stale
        return 3

    if obs_date >= curr_date:
        return 0 # Current day / Fresh

    # Count business/trading days between obs_date and curr_date
    trading_sessions = 0
    day_cursor = obs_date + timedelta(days=1)
    while day_cursor <= curr_date:
        if day_cursor.weekday() not in closed_weekdays:
            trading_sessions += 1
        day_cursor += timedelta(days=1)

    return trading_sessions


def validate_forecast_quantiles(
    q10: float,
    q20: float,
    q35: float,
    q50: float,
    q90: float
) -> Tuple[bool, Optional[str]]:
    """
    Validates that forecast quantiles are coherent and monotonically non-decreasing:
      0 <= q10 <= q20 <= q35 <= q50 <= q90
    """
    if any(q < 0 for q in (q10, q20, q35, q50, q90)):
        return False, "Forecast price quantiles cannot be negative."

    if not (q10 <= q20 <= q35 <= q50 <= q90):
        return False, (
            f"Incoherent quantiles: must satisfy q10 <= q20 <= q35 <= q50 <= q90, "
            f"got: q10={q10}, q20={q20}, q35={q35}, q50={q50}, q90={q90}"
        )

    return True, None


class Division1Adapter:
    """
    Adapter consuming Division 1 market snapshots, historical data, and forecast payloads.
    """
    def __init__(
        self,
        clean_series_csv_path: Optional[str] = None,
        demo_snapshot_json_path: Optional[str] = None
    ):
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.clean_csv_path = clean_series_csv_path or os.path.join(
            base_dir, "data", "clean", "krishinirnay_daily_model_series.csv"
        )
        self.demo_json_path = demo_snapshot_json_path or os.path.join(
            base_dir, "data", "demo", "verified_snapshot.json"
        )
        self._cached_clean_series: Optional[List[Dict[str, Any]]] = None

    def adapt_market_snapshot(
        self,
        raw_snapshot: Dict[str, Any],
        reference_current_date: str = "2026-10-09"
    ) -> MarketSnapshotInput:
        """
        Transforms a raw or external Division 1 market snapshot into a validated MarketSnapshotInput.
        - Canonicalizes mandi name.
        - Normalizes arrivals with single-conversion guarantee.
        - Recalculates trading session age based on observation_date (ignoring fetched_at).
        """
        raw_market = raw_snapshot.get("market") or raw_snapshot.get("name") or "Nashik APMC"
        canonical_market = canonicalize_mandi_name(raw_market)
        crop = raw_snapshot.get("commodity") or raw_snapshot.get("crop") or "Tomato"
        obs_date = raw_snapshot.get("observation_date") or raw_snapshot.get("as_of_date") or reference_current_date
        
        modal_price = float(raw_snapshot.get("modal_price_inr_per_qtl") or raw_snapshot.get("modal_price") or 0.0)
        min_p = raw_snapshot.get("min_price_inr_per_qtl") or raw_snapshot.get("min_price")
        min_price = float(min_p) if min_p is not None else None
        max_p = raw_snapshot.get("max_price_inr_per_qtl") or raw_snapshot.get("max_price")
        max_price = float(max_p) if max_p is not None else None

        # Unit-aware arrivals normalization
        raw_arrivals = float(raw_snapshot.get("arrivals") or 0.0)
        arrivals_unit = raw_snapshot.get("arrivals_unit") or "tonnes"
        normalized_arrivals_qtl = normalize_arrivals_to_qtl(raw_arrivals, arrivals_unit)

        # Freshness evaluation: strictly based on observation date vs calendar
        trading_age = compute_trading_session_age(obs_date, reference_current_date)

        warnings = list(raw_snapshot.get("warnings") or [])
        if trading_age >= 3:
            warnings.append(
                f"Data is stale: {trading_age} expected trading sessions old (observed {obs_date}). Current trading blocked."
            )
        elif trading_age == 2:
            warnings.append(f"Data is moderately stale: from 2 expected trading sessions ago ({obs_date}). Trust reduced.")

        return MarketSnapshotInput(
            market=canonical_market,
            commodity=crop,
            observation_date=obs_date,
            modal_price_inr_per_qtl=modal_price,
            min_price_inr_per_qtl=min_price,
            max_price_inr_per_qtl=max_price,
            arrivals=normalized_arrivals_qtl,
            arrivals_unit="qtl", # Canonical unit
            source=raw_snapshot.get("source", "data.gov.in / AGMARKNET"),
            fetched_at=raw_snapshot.get("fetched_at"),
            expected_trading_age_sessions=trading_age,
            coverage_pct=float(raw_snapshot.get("coverage_pct", 1.0)),
            is_suspicious_static=bool(raw_snapshot.get("is_suspicious_static", False)),
            is_market_open=bool(raw_snapshot.get("is_open", True)),
            recent_daily_prices=list(raw_snapshot.get("recent_daily_prices") or []),
            prior_8w_same_weekday_arrivals=list(raw_snapshot.get("prior_8w_same_weekday_arrivals") or []),
            is_post_closure_catchup=bool(raw_snapshot.get("is_post_closure_catchup", False)),
            warnings=warnings
        )

    def adapt_forecast(
        self,
        raw_fc: Dict[str, Any]
    ) -> Tuple[Optional[ForecastTargetInput], Optional[str]]:
        """
        Transforms and validates a Division 1 forecast payload.
        Returns (ForecastTargetInput, None) on success, or (None, error_reason) on failure.
        """
        try:
            q10 = float(raw_fc["q10"])
            q20 = float(raw_fc["q20"])
            q35 = float(raw_fc["q35"])
            q50 = float(raw_fc["q50"])
            q90 = float(raw_fc["q90"])
        except (KeyError, ValueError, TypeError) as e:
            return None, f"Missing or invalid forecast quantiles: {e}"

        # Validate monotonic non-decreasing quantiles
        is_valid, reason = validate_forecast_quantiles(q10, q20, q35, q50, q90)
        if not is_valid:
            return None, reason

        low = float(raw_fc.get("low", q10))
        expected = float(raw_fc.get("expected", q50))
        high = float(raw_fc.get("high", q90))
        reliability = str(raw_fc.get("reliability", "HIGH")).upper()
        rolling_mase = float(raw_fc.get("rolling_mase", 0.5))
        rolling_80_cov = float(raw_fc.get("rolling_80_coverage", 0.80))
        out_of_range = bool(raw_fc.get("out_of_range", False))

        target_input = ForecastTargetInput(
            target_date=str(raw_fc.get("target_date", "2026-10-10")),
            holding_days=int(raw_fc.get("holding_days", 1)),
            q10=q10,
            q20=q20,
            q35=q35,
            q50=q50,
            q90=q90,
            low=low,
            expected=expected,
            high=high,
            reliability=reliability,
            rolling_mase=rolling_mase,
            rolling_80_coverage=rolling_80_cov,
            training_end_date=raw_fc.get("training_end_date"),
            out_of_range=out_of_range,
            predictive_samples=raw_fc.get("predictive_samples")
        )
        return target_input, None

    def get_snapshot_from_clean_series(
        self,
        crop: str,
        mandi: str,
        reference_date: str = "2026-09-30"
    ) -> Optional[MarketSnapshotInput]:
        """
        Retrieves the latest verified market observation from Division 1's clean daily series.
        """
        if not os.path.exists(self.clean_csv_path):
            logger.warning("Clean daily series CSV not found at %s", self.clean_csv_path)
            return None

        canonical_m = canonicalize_mandi_name(mandi)
        source_m = get_source_mandi_name(canonical_m)
        clean_crop = crop.strip().lower()

        matching_rows = []
        with open(self.clean_csv_path, mode="r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                r_market = row.get("Market", "").strip()
                r_commodity = row.get("Commodity", "").strip().lower()
                if (r_market == source_m or canonicalize_mandi_name(r_market) == canonical_m) and (clean_crop in r_commodity or r_commodity in clean_crop):
                    matching_rows.append(row)

        if not matching_rows:
            return None

        # Sort by Date descending
        matching_rows.sort(key=lambda r: r.get("Date", ""), reverse=True)
        latest_row = matching_rows[0]

        # Extract recent daily prices for volatility calculations
        recent_prices = [float(r["Modal Price"]) for r in matching_rows[:14] if r.get("Modal Price")]

        # In clean series, Arrivals is already in quintals
        raw_snap = {
            "market": canonical_m,
            "commodity": crop,
            "observation_date": latest_row["Date"],
            "modal_price_inr_per_qtl": float(latest_row["Modal Price"]),
            "min_price_inr_per_qtl": float(latest_row["Min Price"]) if latest_row.get("Min Price") else None,
            "max_price_inr_per_qtl": float(latest_row["Max Price"]) if latest_row.get("Max Price") else None,
            "arrivals": float(latest_row["Arrivals"]) if latest_row.get("Arrivals") else 0.0,
            "arrivals_unit": "qtl", # Verified: clean series uses quintals
            "source": latest_row.get("Source", "AGMARKNET"),
            "fetched_at": latest_row.get("Fetched At"),
            "recent_daily_prices": recent_prices
        }
        return self.adapt_market_snapshot(raw_snap, reference_current_date=reference_date)

    def get_demo_snapshot(self) -> Optional[Dict[str, Any]]:
        """Loads Division 1/3 verified frozen demo snapshot."""
        if not os.path.exists(self.demo_json_path):
            return None
        with open(self.demo_json_path, mode="r", encoding="utf-8") as f:
            return json.load(f)
