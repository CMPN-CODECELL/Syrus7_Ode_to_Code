# KrishiNirnay — Dataset Audit Report

**Project:** KrishiNirnay — “Sahi Bhav Se, Samriddhi Ki Raah Pe”  
**Challenge:** Syrus 7.0 / Agriculture PS2 — AI Market and Risk Intelligence for Agri Supply Chains  
**Date of Audit:** 2026-10-09  
**Audit Boundary:** Division 1 Market Data, Historical Snapshots, Cleaning Pipeline, and Evaluation Datasets  

---

## 1. Executive Summary

A core blocker identified prior to integration was that appropriate live datasets were not readily available or reliable from public portals during execution without authentication, CAPTCHA restrictions, or schema inconsistencies. 

This audit documents:
1. Candidate source investigation (OGD/data.gov.in, direct AGMARKNET API, CEDA portal).
2. The committed immutable raw snapshot (`data/raw/agmarknet_maharashtra_tomato_onion_2024-07_to_2026-09.csv`).
3. The clean standardized daily model series (`data/clean/krishinirnay_daily_model_series.csv`).
4. Exact crop × market coverage, date spans, row counts, deduplication, and anomaly quarantine.
5. Chronological walk-forward forecast eligibility and baseline promotion gate results.
6. Separation of `LIVE`, `CACHED`, `USER_PROVIDED`, `ASSUMPTION`, and `SYNTHETIC_DEMO` data states.

---

## 2. Upstream Source Investigation & Status

| Source Candidate | Endpoint / Resource ID | Access Terms | Observed Behavior / Blocker | Status in Prototype |
|---|---|---|---|---|
| **OGD / data.gov.in** | Daily APMC Mandi Price API resource `9ef84268-d588-465a-a308-a864a43d0070` | API Key required via header/query; rate limits apply | Highly intermittent in test sandbox; frequent 429 / 504 gateway timeouts; date of fetch is frequently mistaken for observation date. | Adapter implemented behind `Division1Adapter`; fallback to verified snapshot when offline. |
| **AGMARKNET Official API** | `https://api.agmarknet.gov.in/v1/prices-and-arrivals/date-wise/specific-commodity` | Public government query endpoint | Captures date-wise records; portal web frontend uses session cookies & CAPTCHA. Automated bulk downloads were performed via permitted monthly REST parameters and archived to raw storage. | Verified snapshot captured: 65,069 raw rows. |
| **CEDA Agri-Market Data** | Centre for Economic Data and Analysis Portal | Registration / Research Agreement | Aggregated data series available; access requires organizational credentials not present in runner environment. | Blocked for live querying; reserved as secondary adapter. |
| **Committed Clean Series** | `data/clean/krishinirnay_daily_model_series.csv` | Project repository | Pre-cleaned daily model series with arrival-weighted proxy modal prices and deduplication. | **Primary local analytical source (ACTIVE)**. |
| **Verified Demo Snapshot** | `data/demo/verified_snapshot.json` | Project repository | Frozen snapshot as of 2026-10-09 for Nashik APMC, Pimpalgaon Baswant APMC, Lasalgaon APMC. | **Primary offline demo source (ACTIVE)**. |

---

## 3. Raw Dataset Audit (`data/raw/`)

- **File Path:** `data/raw/agmarknet_maharashtra_tomato_onion_2024-07_to_2026-09.csv`
- **Total Rows:** 65,069 records (+1 header row = 65,070 lines).
- **File Size:** ~18.95 MB.
- **Observed Date Span:** 2024-07-01 to 2026-09-30 (27 continuous calendar months).
- **State Filter:** Maharashtra (`stateId=20`).
- **Commodities:**
  - Tomato (`Commodity_ID=65`)
  - Onion (`Commodity_ID=23`)
- **Raw Schema Observed:**
  `Arrival_Date, Commodity, Commodity_ID, State, Market, Source_Market_Name, Arrivals_Metric_Tonnes, Total_Arrivals_Metric_Tonnes, Variety, Min_Price_INR_per_Qtl, Max_Price_INR_per_Qtl, Modal_Price_INR_per_Qtl, Source, Source_URL, Fetched_At, Source_Year, Source_Month`
- **Sample Raw Record (Redacted):**
  ```csv
  2024-07-01,Tomato,65,Maharashtra,APMC Ahilyanagar,APMC Ahilyanagar ,24.6,24.6,Other,1000.0,5000.0,3000.0,AGMARKNET,https://api.agmarknet.gov.in/...,2026-10-09T09:16:20+05:30,2024,7
  ```

---

## 4. Cleaning & Deduplication Pipeline (`data/clean/`)

### 4.1 Deduplication & Conflict Audit
- **Exact Duplicate Rows:** 17 duplicate records identified in raw download and pruned (`reports/data_quality/repeated_key_audit.csv`).
- **Multi-Variety Handling:** On days where multiple varieties of Tomato or Onion were traded in the same mandi, an **arrival-weighted average of variety modal prices** was computed as a derived proxy modal price (`reports/data_quality/daily_model_series_manifest.json`).
- **Arrival Totals Guarantee:** The source-reported daily total arrival was used once and converted from metric tonnes to quintals ($1 \text{ MT} = 10 \text{ qtl}$). Variety rows were not summed repeatedly.
- **Known Exception Recorded:** Pimpalgaon Baswant Onion on 2025-01-25 had a source total differing from the remaining variety row after duplicate removal; the discrepancy is formally quarantined in `daily_series_group_audit.csv`.

### 4.2 Clean Dataset Structure (`krishinirnay_daily_model_series.csv`)
- **Total Valid Daily Records:** 3,785 clean rows.
- **Missing Prices:** 0 (0.0%).
- **Negative Prices:** 0 (0.0%).
- **Min > Max Anomalies:** 0 (0.0%).

### 4.3 Verified Crop × Mandi Coverage Breakdown
| Market | Commodity | Daily Records | Trading Dates | Months Observed | First Date | Latest Date | Missing Prices | Status |
|---|---|---|---|---|---|---|---|---|
| **APMC Nasik** | Onion | 622 | 622 | 27 / 27 | 2024-07-01 | 2026-09-30 | 0 | **VERIFIED** |
| **APMC Nasik** | Tomato | 650 | 650 | 27 / 27 | 2024-07-01 | 2026-09-30 | 0 | **VERIFIED** |
| **APMC Pimpalgaon Baswant** | Onion | 638 | 638 | 27 / 27 | 2024-07-01 | 2026-09-30 | 0 | **VERIFIED** |
| **APMC Pimpalgaon Baswant** | Tomato | 661 | 661 | 27 / 27 | 2024-07-01 | 2026-09-30 | 0 | **VERIFIED** |
| **APMC Sangamner** | Onion | 543 | 543 | 27 / 27 | 2024-07-01 | 2026-09-30 | 0 | **VERIFIED** |
| **APMC Sangamner** | Tomato | 671 | 671 | 27 / 27 | 2024-07-01 | 2026-09-30 | 0 | **VERIFIED** |
| **Potato (All Markets)** | Potato | 0 | 0 | 0 / 27 | — | — | — | **EXCLUDED (Gated)** |

*Potato is formally excluded from core operational claims because it did not pass the data sufficiency gate.*

---

## 5. Walk-Forward Forecast Validation & Model Promotion Gate

In strict accordance with Master §10.3, §17, and Integration Runbook §3.5:
- XGBoost candidate models cannot be promoted to production unless time-ordered walk-forward evaluation establishes that they consistently outperform both:
  1. **Last-Observed (Persistence) Baseline:** tomorrow's price equals latest known price.
  2. **7-Day Moving Average Baseline:** future price equals recent 7-day average.
- Walk-forward evaluation split:
  - Training cutoff: `2026-04-22` (first 80% of dates).
  - Out-of-fold test origins: `2026-04-22` to `2026-09-30`.
  - Horizons evaluated: 1 through 7 days across all 6 crop × mandi combinations (42 comparisons total).

### 5.1 Empirical Evaluation Results
- **Total Series × Horizon Comparisons:** 42
- **Last-Observed Baseline Wins:** 30 (71.4%)
- **Moving-Average 7 Baseline Wins:** 9 (21.4%)
- **XGBoost Candidate Wins:** 3 (7.1%)

### 5.2 Model Promotion Decision
- **Status:** `candidate_not_promoted`.
- **Production Selection:** In accordance with the non-negotiable contract rule, **Baseline forecasting (Last-Observed / MA-7) is the authoritative production model**, and XGBoost is marked `experimental / unpromoted`.
- **Zero Fabrication Guarantee:** No inflated accuracy numbers, fake calibration curves, or fabricated R² scores are emitted. The Forecast Report Card accurately reports the real walk-forward metrics.

---

## 6. Data State Classification & UI Indicators

To prevent silent fallback or misrepresentation:
- **`LIVE`**: Retained only when an active request retrieves an observation confirmed within 0–1 expected trading sessions.
- **`CACHED`**: Displayed when reading from recent local cache with explicit observation date badge.
- **`STALE`**: Triggered when the latest observation is 2 trading sessions old (Yellow warning) or 3+ sessions old (Red / blocked from current trade).
- **`SYNTHETIC_DEMO`**: Visibly badged on the screen (`Demo Snapshot • Source: data.gov.in • Data as of: 09 Oct 2026`). Demo data never enters claimed empirical benchmarks.
- **`INSUFFICIENT_EVIDENCE`**: Emitted when data gates fail, rather than forcing a recommendation.
