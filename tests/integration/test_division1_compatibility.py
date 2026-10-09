"""
tests/integration/test_division1_compatibility.py

Integration and compatibility test suite for Division 1 Data & Forecasting contracts.
Authority: SYRUS_PS02_MASTER.md & SYRUS_PS02_DIVISION_2_DECISION_RISK_ENGINE.md
Handoff Specification: Division 1 Integration Milestone (Commit 1f050ec)

Tests:
1. Division 1 connector parsing of normalized market snapshots.
2. Single-conversion arrival units guarantee (tonnes vs qtl vs kg).
3. Observation date vs recent Fetched At: old data with recent retrieval is NOT fresh.
4. Stale data threshold blocks current price claim, Wait, and Go.
5. Incoherent/unreliable forecast handling: no fabricated quantiles or probabilities.
6. Monotonic forecast quantile validation (q10 <= q20 <= q35 <= q50 <= q90).
7. Market identifier & alias mapping (APMC Nasik, APMC Pimpalgaon Baswant, APMC Sangamner).
8. Ingestion from Division 1 clean daily series CSV (krishinirnay_daily_model_series.csv).
9. Loading and evaluating from verified demo snapshot (verified_snapshot.json).
10. Insufficient evidence handling for missing, malformed, or out-of-distribution inputs.
"""

import pytest
import os
import math
from datetime import datetime

from services.adapters.division1_adapter import (
    Division1Adapter,
    normalize_arrivals_to_qtl,
    compute_trading_session_age,
    validate_forecast_quantiles
)
from services.decision.market_mapping import (
    canonicalize_mandi_name,
    get_source_mandi_name,
    resolve_mandi_identity
)
from services.decision.decision_policy import (
    DecisionEngine,
    DecisionRequest,
    MarketSnapshotInput,
    ForecastTargetInput
)


def test_market_alias_mapping():
    """Verify bidirectional mapping between AGMARKNET source names and canonical product mandis."""
    # Source -> Canonical
    assert canonicalize_mandi_name("APMC Nasik") == "Nashik APMC"
    assert canonicalize_mandi_name("APMC Pimpalgaon Baswant") == "Pimpalgaon Baswant APMC"
    assert canonicalize_mandi_name("APMC Sangamner") == "Sangamner APMC"
    assert canonicalize_mandi_name("nashik_apmc") == "Nashik APMC"
    assert canonicalize_mandi_name("pimpalgaon_apmc") == "Pimpalgaon Baswant APMC"
    assert canonicalize_mandi_name("lasalgaon_apmc") == "Lasalgaon APMC"

    # Canonical -> Source
    assert get_source_mandi_name("Nashik APMC") == "APMC Nasik"
    assert get_source_mandi_name("Pimpalgaon Baswant APMC") == "APMC Pimpalgaon Baswant"
    assert get_source_mandi_name("Sangamner APMC") == "APMC Sangamner"

    # Full identity resolution preserves coordinates and traceability
    identity = resolve_mandi_identity("APMC Nasik")
    assert identity.canonical_name == "Nashik APMC"
    assert identity.source_name == "APMC Nasik"
    assert identity.id == "nashik_apmc"
    assert len(identity.coordinates) == 2


def test_arrivals_unit_converted_exactly_once():
    """
    CRITICAL INVARIANT:
    Respect arrivals_unit so arrivals are converted to quintals EXACTLY ONCE.
    Never multiply or divide twice!
    """
    # 1. Source reported in metric tonnes (1 tonne = 10 quintals)
    # 14.2 tonnes -> 142.0 quintals
    assert normalize_arrivals_to_qtl(14.2, "tonnes") == 142.0
    assert normalize_arrivals_to_qtl(14.2, "tonne") == 142.0
    assert normalize_arrivals_to_qtl(14.2, "mt") == 142.0

    # 2. Clean series already converted to quintals (must NOT multiply again)
    # 142.0 quintals -> 142.0 quintals
    assert normalize_arrivals_to_qtl(142.0, "qtl") == 142.0
    assert normalize_arrivals_to_qtl(142.0, "quintal") == 142.0
    assert normalize_arrivals_to_qtl(142.0, "quintals") == 142.0

    # 3. Reported in kilograms (100 kg = 1 quintal)
    # 14200.0 kg -> 142.0 quintals
    assert normalize_arrivals_to_qtl(14200.0, "kg") == 142.0


def test_observation_date_vs_fetched_at_freshness():
    """
    CRITICAL INVARIANT:
    Fetched At indicates retrieval time, NOT observation date.
    A recent retrieval of historical data (e.g. 30 Sept 2026 fetched today)
    must NEVER make it appear fresh!
    """
    # Historical observation date: 2026-09-30
    # Reference current decision date: 2026-10-09
    obs_date = "2026-09-30"
    current_date = "2026-10-09"

    # Compute trading age strictly from calendar (ignoring fetched_at)
    age = compute_trading_session_age(obs_date, current_date)
    # 9 calendar days with Sundays excluded is at least 7 trading sessions
    assert age >= 7

    # Adapt snapshot with recent fetched_at
    adapter = Division1Adapter()
    raw_snap = {
        "market": "APMC Nasik",
        "commodity": "Tomato",
        "observation_date": obs_date,
        "modal_price_inr_per_qtl": 2000.0,
        "arrivals": 813.0,
        "arrivals_unit": "qtl",
        "source": "AGMARKNET",
        "fetched_at": "2026-10-09T09:16:20+05:30" # Recent retrieval timestamp!
    }
    adapted = adapter.adapt_market_snapshot(raw_snap, reference_current_date=current_date)

    # Must be classified as severely stale (>= 3 trading sessions)
    assert adapted.expected_trading_age_sessions >= 3
    assert adapted.market == "Nashik APMC"
    assert any("stale" in w.lower() for w in adapted.warnings)


def test_stale_data_blocks_decision_and_forces_insufficient_evidence():
    """
    Data at or above the 3+ stale sessions threshold cannot produce
    an unsafe current-price baseline, Wait, or Go recommendation.
    """
    engine = DecisionEngine()
    adapter = Division1Adapter()

    # Create stale snapshot (3+ sessions old)
    raw_snap = {
        "market": "APMC Nasik",
        "commodity": "Tomato",
        "observation_date": "2026-09-30",
        "modal_price_inr_per_qtl": 2000.0,
        "arrivals": 500.0,
        "arrivals_unit": "qtl",
        "source": "AGMARKNET"
    }
    stale_snap = adapter.adapt_market_snapshot(raw_snap, reference_current_date="2026-10-09")

    req = DecisionRequest(
        commodity="Tomato",
        quantity=20.0,
        home_mandi="Nashik APMC",
        observation_date="2026-10-09",
        market_snapshots={"Nashik APMC": stale_snap}
    )

    record = engine.analyze_sale_decision(req)
    assert record.chosen.action == "INSUFFICIENT_EVIDENCE"
    assert record.risk.overall == "RED"
    assert record.risk.is_wait_blocked_by_risk is True
    assert record.risk.is_go_blocked_by_risk is True


def test_forecast_quantile_validation_rejects_incoherent_quantiles():
    """
    Quantiles must be coherent and monotonically non-decreasing:
      0 <= q10 <= q20 <= q35 <= q50 <= q90.
    Incoherent quantiles must be rejected.
    """
    # Valid quantiles
    valid, err = validate_forecast_quantiles(1700, 1750, 1800, 1850, 2000)
    assert valid is True
    assert err is None

    # Incoherent: q35 > q50
    invalid, err = validate_forecast_quantiles(1700, 1750, 1900, 1850, 2000)
    assert invalid is False
    assert "Incoherent quantiles" in err

    # Negative price quantile
    invalid_neg, err_neg = validate_forecast_quantiles(-100, 1750, 1800, 1850, 2000)
    assert invalid_neg is False
    assert "negative" in err_neg


def test_adapter_parses_forecast_and_flags_low_reliability():
    """
    Forecast adapter consumes documented forecast contract and propagates
    reliability and out-of-range metadata.
    """
    adapter = Division1Adapter()

    # Valid forecast
    raw_fc = {
        "crop": "Tomato",
        "mandi": "APMC Nasik",
        "target_date": "2026-10-11",
        "holding_days": 2,
        "q10": 1800.0,
        "q20": 1850.0,
        "q35": 1900.0,
        "q50": 1950.0,
        "q90": 2100.0,
        "reliability": "HIGH",
        "rolling_mase": 0.45,
        "rolling_80_coverage": 0.82,
        "out_of_range": False
    }
    fc_input, err = adapter.adapt_forecast(raw_fc)
    assert err is None
    assert fc_input is not None
    assert fc_input.q50 == 1950.0
    assert fc_input.reliability == "HIGH"

    # Unreliable forecast (OOD / out of range)
    raw_ood = dict(raw_fc, reliability="LOW", out_of_range=True)
    fc_ood, err_ood = adapter.adapt_forecast(raw_ood)
    assert fc_ood.out_of_range is True
    assert fc_ood.reliability == "LOW"


def test_ingestion_from_clean_daily_series_csv():
    """
    Test direct ingestion from Division 1's krishinirnay_daily_model_series.csv.
    Verifies that APMC Nasik and APMC Pimpalgaon Baswant can be queried.
    """
    adapter = Division1Adapter()
    if not os.path.exists(adapter.clean_csv_path):
        pytest.skip("krishinirnay_daily_model_series.csv not found in data/clean")

    # Query latest Tomato observation for APMC Nasik
    snap_nasik = adapter.get_snapshot_from_clean_series("Tomato", "Nashik APMC", reference_date="2026-09-30")
    assert snap_nasik is not None
    assert snap_nasik.market == "Nashik APMC"
    assert snap_nasik.commodity.lower() == "tomato"
    assert snap_nasik.modal_price_inr_per_qtl > 0
    assert snap_nasik.arrivals > 0
    assert snap_nasik.arrivals_unit == "qtl"

    # Query latest Onion observation for APMC Pimpalgaon Baswant
    snap_pimp = adapter.get_snapshot_from_clean_series("Onion", "Pimpalgaon Baswant APMC", reference_date="2026-09-30")
    assert snap_pimp is not None
    assert snap_pimp.market == "Pimpalgaon Baswant APMC"
    assert snap_pimp.modal_price_inr_per_qtl > 0


def test_verified_demo_snapshot_loading():
    """
    Test loading from Division 1/3 verified demo snapshot (verified_snapshot.json).
    Verifies mandis list and 3x7 heatmap matrix.
    """
    adapter = Division1Adapter()
    demo_data = adapter.get_demo_snapshot()
    assert demo_data is not None
    assert "mandis" in demo_data
    assert "heatmap_3x7" in demo_data

    # Find Nashik in demo mandis
    nashik_mandi = next((m for m in demo_data["mandis"] if "nashik" in m["name"].lower()), None)
    assert nashik_mandi is not None
    assert nashik_mandi["today"]["modal_price"] == 1800.0

    # Adapt demo snapshot
    adapted = adapter.adapt_market_snapshot(nashik_mandi["today"], reference_current_date="2026-10-09")
    assert adapted.modal_price_inr_per_qtl == 1800.0
    # In demo, arrivals = 142.0 tonnes -> 1420.0 qtl
    assert adapted.arrivals == 1420.0
