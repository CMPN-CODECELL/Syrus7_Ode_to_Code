# KrishiNirnay (कृषिनिर्णय)
> **“Sahi Bhav Se, Samriddhi Ki Raah Pe.”**  
> **Agriculture PS_02: AI Market and Risk Intelligence for Agri Supply Chains**  
> **Syrus 7.0 / Integrated Master Implementation**

---

## 🌾 1. Overview & Core Product Vision

**KrishiNirnay** is an integrated farmer-facing decision-support system built for agricultural supply chains in Maharashtra (focused on Tomato and Onion, with data-gated support for Potato).

Rather than treating AI as a price-guessing novelty, KrishiNirnay operates on one immutable principle:

> **“AI converts uncertain market prices into a risk-adjusted net-realization decision.”**

### The Headline Farmer Request
> *“I have 25 quintals of tomatoes. Should I sell today in Nashik or wait three days and send them to another mandi?”*

A higher mandi sticker price does **not** guarantee more money in the farmer’s pocket. Road distance, travel time, labour (*hamali* / *tolai*), APMC market fees, storage charges, capital financing costs, and sequential perishability losses can easily cause a higher headline price to result in a net loss.

KrishiNirnay calculates the **risk-adjusted net realization** (what the farmer actually retains in hand), evaluates six deterministic risk flags, enforces risk-appetite policy gates (Cautious, Balanced, Aggressive), and produces a single, immutable, reproducible **`DecisionRecord`**.

The AI layer (Gemini 3.8 Flash, Groq, Whisper, and TTS) functions strictly as a conversational and linguistic interface—it **never calculates or invents financial numbers**. Every number is verified by the deterministic backend and protected by a strict **Number Guard**.

---

## 🏗️ 2. Integrated Target Architecture

```text
                    ┌──────────────────────────────────────────────┐
                    │              Farmer Interfaces               │
                    │  Primary: React Native + Expo Mobile Client  │
                    │  Companion: React + Vite + Tailwind PWA      │
                    │  (Chat • Voice • Heatmap • Charts • What-If) │
                    └──────────────────────┬───────────────────────┘
                                           │ HTTPS / JSON / Audio
                    ┌──────────────────────▼───────────────────────┐
                    │          FastAPI Public Gateway              │
                    │  Validation • Rate Limiting • Correlation ID │
                    └──────────────────────┬───────────────────────┘
                                           │
                    ┌──────────────────────▼───────────────────────┐
                    │       Bounded AI Orchestration Layer         │
                    │  Primary: Gemini 3.8 Flash                   │
                    │  Fallback: Groq openai/gpt-oss-20b           │
                    │  Fallback 2: Deterministic Multilingual Text │
                    │  🛡️ NUMBER GUARD (Zero Hallucination Barrier) │
                    └──────────────────────┬───────────────────────┘
                                           │ Bounded High-Level Tools Only
                    ┌──────────────────────▼───────────────────────┐
                    │     Deterministic Decision Engine            │
                    │  Canonical Net Return • Sequential Spoilage  │
                    │  Six-Risk System • Margin & Probability Gate │
                    │  Break-Even Reservation Price • Scenarios    │
                    └───────┬───────────────────────────────┬──────┘
                            │                               │
              ┌─────────────▼───────────┐     ┌─────────────▼────────────┐
              │ Division 1 Data & ML    │     │ External Service Adapters │
              │ AGMARKNET Daily Series  │     │ ORS (api.heigit.org)     │
              │ Baselines (Last/MA-7)   │     │ Open-Meteo & IMD Weather │
              │ Walk-Forward Evaluator  │     └──────────────────────────┘
              └─────────────┬───────────┘
                            │
              ┌─────────────▼───────────┐
              │ SQLite / Parquet / CSV  │
              │ Clean Series & Snapshots│
              └─────────────────────────┘
```

---

## 📦 3. System Components & Division Responsibilities

### Division 1: Data + Forecasting
- **Market Ingestion:** Verified AGMARKNET records for Maharashtra Tomato & Onion from July 2024 to September 2026 (`data/raw/`).
- **Clean Daily Series:** Standardized daily model series with arrival-weighted proxy modal prices and deduplication audits (`data/clean/krishinirnay_daily_model_series.csv`).
- **Trading Calendar & Freshness:** Freshness evaluated strictly on expected APMC trading sessions (0–1 Fresh, 2 Yellow, 3+ Red/Blocked).
- **Forecasting Models & Walk-Forward Audit:** 7 direct horizon models. Baselines (Last-Observed & 7-day Moving Average) rigorously evaluated against candidate XGBoost models. XGBoost was evaluated on 42 comparisons (Last-Observed won 29, MA-7 won 9, XGBoost won 4); in accordance with Master §10.3 and §17, the winning baseline is the production forecast, with candidate XGBoost kept experimental.

### Division 2: Decision, Risk & Economics
- **Canonical Net Realization:** Sequential holding loss $\prod(1 - \text{holding}[d])$, sequential transit loss $\prod(1 - \text{travel}[h])$, quality factor, transport costs with round-trip multipliers and multiple trips, hamali/tolai, storage, and financing. Strict **no double-spoilage** invariant.
- **Routing Engine:** OpenRouteService adapter (`api.heigit.org`) with cached-route fallback and labelled Haversine estimate. Weak-route Go decisions are blocked.
- **Weather-to-Money Engine:** Physical weather effects from Open-Meteo & IMD alerts mapped to holding/travel loss and risk (no arbitrary numeric price adjustments).
- **Six-Family Risk Engine:** Price drop, arrival spike, volatility, staleness, forecast reliability, and weather risks with weighted composite scoring ($R$) and deterministic overrides.
- **Decision Policy:** Cautious ($q20$), Balanced ($q35$), and Aggressive ($q50$) profiles with required gain and probability gates. Default: **Sell Now**.
- **Reservation Price:** Exact break-even future price $P_{\text{breakeven}}$ calculated and displayed (*"Do not accept below ₹X/qtl"*).
- **What-If Scenarios:** Deep-cloned deterministic reruns (price -10%, transport +20%, arrivals 2x) without mutating historical records.
- **Immutable `DecisionRecord`:** Single source of numerical truth for dashboards, LLM narration, and voice.

### Division 3: Product, Full Stack, AI & Voice
- **Public Gateway:** FastAPI server exposing `/api/assist`, `/api/voice`, `/api/market-snapshot`, `/api/price-history`, `/api/scenario`, `/api/health`, and `/api/demo`.
- **Bounded LLM Orchestrator:** Gemini 3.8 Flash primary with Groq `openai/gpt-oss-20b` fallback and deterministic multilingual templates.
- **Number Guard:** Regex & semantic number validator that parses every digit in AI responses and blocks hallucinations against allowed numbers from the `DecisionRecord`.
- **Voice System:** Groq Whisper Large V3 Turbo ASR with agricultural glossary (*bhav*, *aavak*, *nasadi*, *katta*, *potan*), bag-weight validation, and Gemini Flash-Lite TTS.
- **Farmer Web PWA & Mobile App:** Fullscreen video landing page, Decision Cards, 3x7 Best-Day/Best-Mandi Heatmap, 30–90 day Historical Chart with arrivals overlay, 7-day Forecast with uncertainty bands, Cost Breakdown, Risk Panel, Scenario Controls, and Demo Failure Switch.

---

## 🚀 4. Quick Start & Execution Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ (for Web and Mobile frontends)

### 4.1 Backend Setup
```bash
# Clone and navigate to repository
git clone https://github.com/CMPN-CODECELL/Syrus7_Ode_to_Code.git
cd Syrus7_Ode_to_Code
git checkout integration

# Set up virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn pydantic pyyaml pandas numpy scikit-learn xgboost requests pytest
```

### 4.2 Configure Environment Variables
Copy `.env.example` to `.env` and fill in API keys as needed:
```bash
cp .env.example .env
```
*(Note: KrishiNirnay operates 100% offline using verified snapshots and deterministic templates even if all external API keys are omitted!)*

### 4.3 Start Public FastAPI Gateway
```bash
python run_gateway.py
# Gateway starts on http://localhost:8000
# Interactive API docs: http://localhost:8000/docs
```

### 4.4 Start Web Companion PWA
```bash
cd apps/web
npm install
npm run dev
# PWA available at http://localhost:5173
```

---

## 🧪 5. Running the Test Suites

Execute all contract, unit, and integration tests across all divisions:

```bash
# 1. Run full test suite with pytest
python -m pytest tests/ -v

# 2. Run contract invariant and golden fixture verifier
python scripts/verify_contracts.py

# 3. Run Division 2 standalone test runner
python run_tests.py

# 4. Run Division 1 baseline backtest
python scripts/evaluate_baselines.py
```

---

## 🎯 6. Canonical Golden Fixture Numbers

For a 20 qtl Tomato harvest in Nashik APMC (60 km round trip transport, 2-day wait, 1% transit loss, 2% holding loss, ₹12/qtl hamali, ₹2/qtl/day storage, 12% financing):

| Metric | Target / Expected Value |
|---|---|
| **Sell Now Net Realization** | **₹33,960.00** |
| **Wait 2 Days Expected Net ($q50$)** | **₹36,055.00** |
| **Net Gain vs Baseline** | **+₹2,095.00 (+6.17%)** |
| **Break-Even Reservation Price** | **~₹1,842.00 / qtl** |
| **Probability of Beating Baseline** | **62.4%** |

*All golden fixture tests assert and verify these exact numbers.*

---

## 📄 7. Documentation & Audit Reports

- `docs/integration/branch_inventory.md` — Complete inventory of all three feature branches.
- `docs/integration/feature_ledger.csv` — Exhaustive ledger tracing every requirement across branches, code, and tests.
- `docs/integration/dataset_audit.md` — Market data audit, source schema, date coverage, deduplication, and fallback analysis.
- `docs/integration/economics_audit.md` — Parameter audit classifying costs as `VERIFIED`, `USER_PROVIDED`, `ASSUMPTION`, or `UNKNOWN`.
- `docs/integration/test_report.md` — Comprehensive test report with exact commands, results, and readiness assessment.
