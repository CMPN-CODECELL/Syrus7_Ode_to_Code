# KrishiNirnay — Branch Inventory & Technical Audit

**Project:** KrishiNirnay — “Sahi Bhav Se, Samriddhi Ki Raah Pe”  
**Challenge:** Syrus 7.0 / Agriculture PS2 — AI Market and Risk Intelligence for Agri Supply Chains  
**Integration Agent Audit Date:** 2026-10-09  
**Repository:** `https://github.com/CMPN-CODECELL/Syrus7_Ode_to_Code`

---

## 1. Overview of Branches Inventoried

This inventory documents all three feature branches before code unification:

1. **Division 1: `origin/Data-+-Forecasting`**
   - **Focus:** Data Engineering, AGMARKNET Market Ingestion, Daily Series Normalization, Freshness Rules, Walk-Forward Validation, Baseline Forecasting (Last-Observed & MA-7), Candidate XGBoost Evaluation.
   - **Base Commit:** `0f95286` (branched from common base with Division 3).
   - **Head Commit:** `1f050ec Add Division 1 data pipeline and forecasting evaluation`.

2. **Division 2: `origin/Decision-Risk-Economics`**
   - **Focus:** Deterministic Decision Brain, Canonical Net Realization (sequential holding/travel losses, no double-spoilage), Transport Engine (OpenRouteService + Haversine fallback), Weather-to-Economics Engine, Six-Family Risk Engine & Safety Overrides, Cautious/Balanced/Aggressive Policy, Break-Even Reservation Price, Scenario Engine, Reproducible Immutable `DecisionRecord`, and Division 1 Data Adapter.
   - **Base Commit:** Initialized commit `9f6631a`.
   - **Head Commit:** `3ffb835 feat(integration): integrate Division 1 contracts, market mapping, and verified data ingestion`.

3. **Division 3: `origin/Product-Full-Stack-AI-Voice`**
   - **Focus:** Public FastAPI Gateway (`/api/assist`, `/api/voice`, `/api/market-snapshot`, `/api/scenario`, `/api/health`, `/api/demo`), Bounded LLM Orchestrator (Gemini 3.8 Flash + Groq fallback + deterministic templates), Strict Regex Number Guard, Multilingual Voice (Groq Whisper ASR + Gemini Flash-Lite TTS + agricultural glossary), React Native Expo Mobile App, React + Vite + Tailwind PWA Companion (with 3x7 Heatmap, Historical Chart, Decision Cards, Why Cards, Risk Panel, Cost Breakdown, What-if Scenarios, Hidden Demo Failure Switch), and Golden Fixture Verifier.
   - **Base Commit:** `8ba343a`.
   - **Head Commit:** `9dc531b feat: add fullscreen video landing page without text and get started flow`.

---

## 2. Division 1: Data + Forecasting Inventory

### 2.1 Source Files & Artifacts
| Path | Type | Responsibility / Description |
|---|---|---|
| `data/raw/agmarknet_maharashtra_tomato_onion_2024-07_to_2026-09.csv` | Dataset | 65,069 lines raw daily market records from AGMARKNET for Maharashtra Tomato & Onion. |
| `data/clean/krishinirnay_daily_model_series.csv` | Dataset | 3,786 rows clean aggregated daily series across APMC Nasik, APMC Pimpalgaon Baswant, and APMC Sangamner (2024-07-01 to 2026-09-30). |
| `reports/data_quality/daily_model_series_manifest.json` | Manifest | Quality manifest documenting aggregation rules, date coverage, exact deduplication count (17 rows), and arrival unit conversions. |
| `reports/data_quality/conflicting_key_values.csv` | Audit | Records of conflicting price/arrival keys detected during deduplication. |
| `reports/data_quality/daily_model_series_summary.csv` | Audit | Summary row counts and date ranges per crop × mandi. |
| `reports/data_quality/daily_series_group_audit.csv` | Audit | Complete audit of daily groups, variety sums, and modal price proxies. |
| `reports/data_quality/repeated_key_audit.csv` | Audit | Audit of multi-variety or repeated daily entries. |
| `reports/forecast/baseline_backtest.csv` | Forecast Report | Walk-forward comparison of Last-Observed vs 7-day Moving Average baselines across horizons 1–7. |
| `reports/forecast/xgboost_walk_forward_comparison.csv` | Forecast Report | Comparison of candidate 7-horizon direct XGBoost models against baselines. |
| `reports/forecast/xgboost_walk_forward_predictions.csv` | Predictions | 4,043 out-of-fold chronological predictions. |
| `reports/forecast/xgboost_walk_forward_summary.json` | Summary | Empirical walk-forward metrics showing XGBoost won only 4/42 comparisons (Last-Observed won 29, MA-7 won 9). Candidate status: `candidate_not_promoted`. |
| `scripts/evaluate_baselines.py` | Script | Evaluates persistence and moving-average baselines using walk-forward splits. |
| `scripts/train_xgboost_candidates.py` | Script | Trains and evaluates candidate XGBoost models without data leakage. |
| `pyproject.toml` | Dependencies | Specifies dependencies for Division 1 pipeline. |

### 2.2 APIs, Contracts & Export Schema
- **Required CSV Schema:** `Date, Market, Commodity, Modal Price, Arrivals, Min Price, Max Price, Source, Fetched At`.
- **Promotion Gate:** Per Master §10.3 and §17, XGBoost must consistently beat baselines in walk-forward evaluation to be promoted to production. Because baselines beat XGBoost (Last-Observed 29 wins, MA-7 9 wins, XGBoost 4 wins), production forecasting legitimately uses the proven baselines.

---

## 3. Division 2: Decision + Risk + Economics Inventory

### 3.1 Source Files & Modules
| Path | Type | Responsibility / Description |
|---|---|---|
| `services/decision/net_return.py` | Core Engine | Canonical net realization with sequential holding loss, sequential travel loss, quality factor, and transport/labour/storage/financing deductions. Strict no-double-spoilage invariant. |
| `services/decision/decision_policy.py` | Policy | Cautious (q20, 5% gain, 70% prob), Balanced (q35, 3% gain, 65% prob), Aggressive (q50, 1.5% gain, 55% prob). Sell now default, Wait and Go decision gates. |
| `services/decision/risk_engine.py` | Risk Engine | 6-factor composite risk (Price drop 0.25, Arrival spike 0.20, Volatility 0.15, Staleness 0.15, Forecast 0.15, Weather 0.10). Red/Yellow/Green bands and safety overrides. |
| `services/decision/reservation_price.py` | Economics | Calculates exact future break-even price ($P_{breakeven}$) required to match Sell Now baseline net return. |
| `services/decision/route_cost.py` | Routing | OpenRouteService adapter (`api.heigit.org`) with fallback to cached routes and labelled Haversine estimate. Blocks Go if route confidence is weak. |
| `services/decision/weather_effects.py` | Weather | Weather-to-holding-loss, travel-loss, and risk multipliers from Open-Meteo/IMD. Strictly no arbitrary numerical price bumps. |
| `services/decision/scenario_engine.py` | Scenarios | What-if simulation (price -10%, transport +20%, arrivals 2x). Clones request and reruns exact same decision engine without mutating history. |
| `services/decision/market_mapping.py` | Mapping | Bidirectional canonical name mapping (e.g., "Nashik APMC" <-> "APMC Nasik") and GPS coordinates. |
| `services/adapters/division1_adapter.py` | Adapter | Ingests Division 1 clean daily series and demo snapshots into validated Pydantic inputs. |
| `services/decision/decision_record.py` | Models | Immutable, reproducible `DecisionRecord` schema with version IDs and audit trails. |
| `services/decision/explanation_rules.py` | Narration | Generates structured, deterministic evidence points and "Why" explanations. |
| `services/decision/api.py` | Service API | Internal FastAPI service exposing `/health`, `/analyze`, `/scenario`, `/weather`. |
| `configs/cost_config.yaml` | Config | Cost parameters with explicit `VERIFIED`, `USER_PROVIDED`, `ASSUMPTION` statuses. |
| `configs/risk_rules.yaml` | Config | Six risk weights, thresholds, and override triggers. |
| `configs/route_config.yaml` | Config | Routing endpoints, speed assumptions, and vehicle capacities. |

### 3.2 Test Suite in Division 2
- 51 passing automated tests across:
  - `tests/contract/test_golden_fixtures.py`
  - `tests/integration/test_api_endpoints.py`
  - `tests/integration/test_division1_compatibility.py`
  - `tests/unit/test_decision_policy.py`
  - `tests/unit/test_net_return.py`
  - `tests/unit/test_reservation_price.py`
  - `tests/unit/test_risk_engine.py`
  - `tests/unit/test_route_cost.py`
  - `tests/unit/test_scenario_engine.py`
  - `tests/unit/test_weather_effects.py`

---

## 4. Division 3: Product + Full Stack + AI/Voice Inventory

### 4.1 Source Files & Modules
| Path | Type | Responsibility / Description |
|---|---|---|
| `apps/api/main.py` | Public Gateway | FastAPI entry point with CORS, security middleware, and routes. |
| `apps/api/routes/assist.py` | Route | Farmer chat & recommendation gateway (`POST /api/assist`). |
| `apps/api/routes/voice.py` | Route | Audio transcription (`/transcribe`) and speech synthesis (`/speak`). |
| `apps/api/routes/market.py` | Route | Market snapshot (`/api/market-snapshot`) and price history (`/api/price-history`). |
| `apps/api/routes/scenario.py` | Route | What-if simulation endpoint (`POST /api/scenario`). |
| `apps/api/routes/demo.py` | Route | Hidden failure injection switch (`POST /api/demo/failure-mode`). |
| `apps/api/routes/health.py` | Route | Health check (`GET /api/health`). |
| `apps/api/llm/orchestrator.py` | AI Orchestrator | Bounded LLM routing (Gemini 3.8 Flash -> Groq -> deterministic template). |
| `apps/api/llm/number_guard.py` | Safety Gate | Strict numerical guard that prevents AI hallucinations by whitelisting numbers from `DecisionRecord`. |
| `apps/api/llm/deterministic_templates.py`| Fallback | Deterministic multilingual templates for zero-LLM reliability. |
| `apps/api/llm/tools.py` | Tool Definitions | High-level tools exposed to LLM (`analyze_sale_decision`, `get_price_history`, etc.). |
| `apps/api/voice/asr.py` | Speech-to-Text | Groq Whisper Large V3 Turbo with fallback to browser transcription. |
| `apps/api/voice/tts.py` | Text-to-Speech | Gemini 3.8 Flash-Lite TTS with concise voice contract (verdict, net, 1 risk). |
| `apps/api/voice/glossary.py` | Localization | Agricultural glossary parsing local Marathi/Hindi farming terms (bhav, aavak, nasadi, katta, potan). |
| `apps/api/session/session_manager.py` | State | Manages farmer context, quantities, preferences across dialog turns. |
| `apps/web/src/App.tsx` | Web App | Main PWA interface with navigation between views. |
| `apps/web/src/components/LandingPage.tsx` | UI | Fullscreen video animation landing page with "Get Started" entry. |
| `apps/web/src/components/DecisionScreen.tsx` | UI | Primary decision recommendation card with net gain and break-even price. |
| `apps/web/src/components/HeatmapScreen.tsx` | UI | 3x7 Best-Day / Best-Mandi heatmap of risk-adjusted net returns. |
| `apps/web/src/components/HistoricalChartScreen.tsx` | UI | 30–90 day historical price and arrivals chart with freshness badges. |
| `apps/web/src/components/ForecastScreen.tsx` | UI | 7-day forecast with uncertainty bands and reliability metrics. |
| `apps/web/src/components/RiskScreen.tsx` | UI | 6-family risk radar/breakdown with safety override indicators. |
| `apps/web/src/components/CostScreen.tsx` | UI | Itemized cost breakdown (transport, labour, storage, finance, loss). |
| `apps/web/src/components/ScenarioScreen.tsx` | UI | Interactive what-if controls (price -10%, transport +20%, arrivals 2x). |
| `apps/web/src/components/VoiceAssistantDrawer.tsx` | UI | Multilingual conversational voice drawer with visual transcript. |
| `apps/web/src/components/DemoSwitchBar.tsx` | UI | Demo toolbar with failure simulation toggles. |
| `apps/mobile/` | Mobile App | Full React Native + Expo implementation with parallel screens and offline storage. |

### 4.2 Test Suite in Division 3
- Automated tests across:
  - `tests/test_api_endpoints.py`
  - `tests/test_e2e_consistency.py`
  - `tests/test_failure_modes.py`
  - `tests/test_glossary_and_slots.py`
  - `tests/test_golden_fixture.py`
  - `tests/test_number_guard.py`
  - `scripts/verify_contracts.py`

---

## 5. Branch Conflict & Reconciliation Analysis

1. **`mock_engine/deterministic_engine.py` vs `services/decision/`**:
   - Division 3 originally used an internal `DeterministicEngine` mock while Division 2 was being constructed in its own branch.
   - **Resolution:** Route public gateway endpoints (`/api/assist`, `/api/scenario`, `/api/market-snapshot`, `/api/price-history`) directly to Division 2's authoritative decision services (`services/decision/`), backed by Division 1 data pipelines and adapters. Preserve deterministic mock engine as a safe fallback test double.

2. **Web UI Landing Page & Theme (`apps/web/`)**:
   - Division 3 HEAD contains a video reveal animation landing page (`LandingPage.tsx`) and high-contrast green-and-white farmer dashboard redesign.
   - `Data-+-Forecasting` branched before these UI additions.
   - **Resolution:** Preserve Division 3's latest landing page, animation assets, and UI components in full.

3. **CSV Clean Data Path**:
   - Division 1 established `data/clean/krishinirnay_daily_model_series.csv` and `data/raw/agmarknet_maharashtra_tomato_onion_2024-07_to_2026-09.csv`.
   - Division 2 commit `3ffb835` already incorporated this clean series via `services/adapters/division1_adapter.py`.
   - **Resolution:** Keep unified dataset under `data/clean/` and `data/raw/` in the merged branch.

4. **Forecasting Promotion**:
   - Master §10.3 requires comparing XGBoost against persistence and moving-average baselines.
   - Division 1's backtest showed Last-Observed (persistence) won 29/42 and MA-7 won 9/42, while XGBoost won 4/42.
   - **Resolution:** In production, use the winning baseline model (persistence / MA-7), label XGBoost experimental/candidate as per Master policy, and expose the complete report card.
