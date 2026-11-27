# KrishiNirnay (कृषिनिर्णय)
<div align="center">

# 🌾 KrishiNirnay (कृषिनिर्णय)
### *“Sahi Bhav Se, Samriddhi Ki Raah Pe” — From Distress Selling to Informed Prosperity*

[![Syrus 7.0](https://img.shields.io/badge/Syrus%207.0-Agriculture%20PS__02-2E7D32.svg?style=for-the-badge)](https://github.com/Parth-Chavan-15/Syrus7_Ode_to_Code)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React-18.3-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%20%7C%203.11-3776AB.svg?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org)
[![Tests Passing](https://img.shields.io/badge/Tests-72%2F72%20Passed-brightgreen.svg?style=for-the-badge&logo=pytest&logoColor=white)](#-6-testing--verification-suite)
[![Localization](https://img.shields.io/badge/Language-मराठी%20%7C%20English-FF9933.svg?style=for-the-badge)](#-5-bilingual-ai-copilot--zero-hallucination-number-guard)

**A deterministic microeconomic decision, risk intelligence, and spatial price arbitrage engine for smallholder farmers across Maharashtra.**

[Live Prototype](#-7-quick-start--setup-guide) • [Core Problem](#-1-the-distress-selling-crisis) • [Economic Engine](#-3-deterministic-economic--decision-engine) • [Walk-Forward ML](#-4-machine-learning--walk-forward-validation) • [Architecture](#-2-system-architecture) • [Testing](#-6-testing--verification-suite)

---

### 🖥️ Interactive Farmer Decision Dashboard Preview
<br/>

<img src="docs/assets/dashboard_preview.png" alt="KrishiNirnay Real-Time Farmer Decision Dashboard" width="100%" style="border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.12);" />

*Real-time interface showing dynamic crop parameters, road route geocoding (Nashik 60 km), round-trip freight selection, storage facility degradation, live APMC stream, and the Krishi Mitra AI Copilot.*

</div>

---

## 📌 Table of Contents
- [1. The Distress Selling Crisis](#-1-the-distress-selling-crisis)
- [2. System Architecture](#-2-system-architecture)
- [3. Deterministic Economic & Decision Engine](#-3-deterministic-economic--decision-engine)
- [4. Machine Learning & Walk-Forward Validation](#-4-machine-learning--walk-forward-validation)
- [5. Bilingual AI Copilot & Zero-Hallucination Number Guard](#-5-bilingual-ai-copilot--zero-hallucination-number-guard)
- [6. Testing & Verification Suite](#-6-testing--verification-suite)
- [7. Quick Start & Setup Guide](#-7-quick-start--setup-guide)
- [8. Repository Structure](#-8-repository-structure)
- [9. Canonical Golden Fixture Benchmark](#-9-canonical-golden-fixture-benchmark)
- [10. API Specification](#-10-api-specification)

---

## 🚨 1. The Distress Selling Crisis

Over **86% of Indian farmers are small and marginal**, frequently trapped in post-harvest distress selling. Because smallholders lack transparent logistics economics, microclimate-adjusted spoilage forecasts, and clear cashflow clarity, they offload produce immediately after harvest at steep market lows, losing an estimated **₹89,000+ crore annually**.

### The Fundamental Farmer Question
> *“I have 20 quintals of harvested tomatoes in Niphad. Should I sell today at Nashik APMC, or store them for 2 days and travel to Pimpalgaon Baswant?”*

Existing agricultural apps offer static APMC rate sheets or naive price forecasts. However, **a higher sticker price does not equal more money in the farmer's pocket**. 
Real-world market realization is governed by hidden economic frictions:
1. **Produce Spoilage Curves:** Perishables deteriorate non-linearly over storage days and road transit vibration.
2. **True Logistics Friction:** Vehicle capacity constraints (pickup vs. truck), round-trip diesel, toll gates, and *hamali/tolai* (loading/unloading fees).
3. **Financing / Capital Opportunity Cost:** Delayed cash realization locks working capital and accrues interest on informal crop loans.
4. **The Reservation Price:** The exact minimum future price ($P_{\text{breakeven}}$) a farmer must receive to justify holding risk.

**KrishiNirnay replaces guesswork with a mathematical Decision Engine that calculates net in-hand realization.**

---

## 🏗️ 2. System Architecture

```text
                    ┌─────────────────────────────────────────────────────────┐
                    │                    Farmer Interfaces                    │
                    │   • Web PWA Companion (React 18 + Vite + Tailwind)      │
                    │   • Mobile Client (React Native + Expo)                 │
                    │   • Dual Dialect: Marathi (मराठी) & English (en-IN)    │
                    └────────────────────────────┬────────────────────────────┘
                                                 │ HTTP / REST / WebSocket
                    ┌────────────────────────────▼────────────────────────────┐
                    │               FastAPI Public Gateway                    │
                    │   Validation • Rate Limiting • Correlation ID Tracking  │
                    └────────────────────────────┬────────────────────────────┘
                                                 │
                    ┌────────────────────────────▼────────────────────────────┐
                    │        Bounded AI Orchestration Layer (LLM)             │
                    │   • Primary: Gemini 3.8 Flash                           │
                    │   • Fallback: Groq openai/gpt-oss-20b                   │
                    │   • Offline Fallback: Deterministic Multilingual Text   │
                    │   🛡️ NUMBER GUARD (Blocks Financial Hallucinations)    │
                    └────────────────────────────┬────────────────────────────┘
                                                 │ Bounded High-Level Tool Calls
                    ┌────────────────────────────▼────────────────────────────┐
                    │            Deterministic Decision Engine                │
                    │   • Net In-Hand Revenue     • Sequential Degradation    │
                    │   • Spatial Arbitrage       • 6-Family Risk Scoring     │
                    │   • Reservation Price       • What-If Scenario Matrix   │
                    └───────────────┬─────────────────────────┬───────────────┘
                                    │                         │
          ┌─────────────────────────▼────────┐      ┌─────────▼────────────────────────┐
          │     Data & Forecasting Tier      │      │     External Service Adapters     │
          │  • AGMARKNET Daily Series        │      │  • OpenRouteService (Geo Routing)│
          │  • Walk-Forward ML (XGBoost)     │      │  • Open-Meteo & IMD Alerts       │
          │  • Baseline Evaluator (Last/MA7) │      │  • Cached Offline Fallback Data  │
          └─────────────────┬────────────────┘      └──────────────────────────────────┘
                            │
          ┌─────────────────▼────────────────┐
          │      Data Store & Snapshots      │
          │  SQLite • Parquet • CSV Fixtures │
          └──────────────────────────────────┘
```

---

## 💰 3. Deterministic Economic & Decision Engine

KrishiNirnay’s economics module computes **Net Realized In-Hand Income**, not hypothetical gross value:

$$\text{Net Revenue} = (\text{Quantity} - \text{Spoilage}) \times P_{\text{expected}} - (\text{Storage Cost} + \text{Logistics Cost} + \text{Market Fees} + \text{Financing Cost})$$

### 3.1 Cost & Degradation Breakdown

| Parameter | Mathematical Formulation | Real-World Significance |
| :--- | :--- | :--- |
| **Sequential Spoilage** | $Q_{\text{sold}} = Q_{\text{initial}} \times \prod(1 - \text{holding}[d]) \times \prod(1 - \text{transit}[h])$ | Enforces strict **no double-spoilage** invariant across storage and road vibration. |
| **Freight Economics** | $\text{Cost}_{\text{transport}} = \lceil Q / \text{Cap}_{\text{veh}} \rceil \times \text{Distance} \times \text{Rate}_{\text{km}} \times \text{RoundTripFactor}$ | Accommodates vehicle capacity limits, empty return trips, and diesel inflation. |
| **Market Handling** | $\text{Cost}_{\text{handling}} = Q \times (\text{Rate}_{\text{hamali}} + \text{Rate}_{\text{tolai}}) + \text{APMC Cess}$ | Local mandi handling and commission charges. |
| **Financing Cost** | $\text{Cost}_{\text{finance}} = Q \times P_{\text{baseline}} \times \left(\frac{r_{\text{annual}}}{365}\right) \times \text{Days}_{\text{held}}$ | Opportunity cost of capital (12% annual rate) locked during storage. |
| **Reservation Price** | $P_{\text{breakeven}} = \frac{\text{Net Revenue}_{\text{today}} + \text{All Holding Costs}}{Q_{\text{sold}}}$ | **The Floor Price**: The minimum market price required on Day $N$ to beat selling today. |

### 3.2 Six-Family Composite Risk Matrix
The engine scores risk along six dimensions before recommending a holding action:
1. **Price Drop Risk ($R_{\text{price}}$):** Likelihood of price collapsing below reservation threshold.
2. **Arrival Volume Spike ($R_{\text{arrival}}$):** Surging crop arrivals at the destination mandi depressing rates.
3. **Market Volatility ($R_{\text{volatility}}$):** Historical standard deviation over the last 14 sessions.
4. **Data Freshness ($R_{\text{staleness}}$):** Trading calendar session gap (0–1 Fresh, 2 Warning, 3+ Stale).
5. **Forecast Uncertainty ($R_{\text{forecast}}$):** Confidence interval width around the predicted mean.
6. **Weather Severity ($R_{\text{weather}}$):** IMD rainfall and temperature alerts accelerating degradation.

---

## 📈 4. Machine Learning & Walk-Forward Validation

### 4.1 Rigorous Time-Series Backtesting
In agricultural commodity forecasting, deep neural networks and complex models frequently overfit to noise. KrishiNirnay validates candidate models through an **honest walk-forward validation framework** evaluated across 42 historical horizons:

```
Historical Comparisons (42 Out-of-Sample Horizons):
├── Last-Observed Baseline Won: 29 comparisons (69.0%)
├── 7-Day Moving Average Won:    9 comparisons (21.4%)
└── Candidate XGBoost Won:       4 comparisons ( 9.5%)
```

> **Engineering Principle:** In accordance with production specifications, the system dynamically selects the winning baseline as the primary production forecast while preserving XGBoost in experimental validation mode. We report actual predictive reality instead of marketing artificial model accuracy.

---

## 🗣️ 5. Bilingual AI Copilot & Zero-Hallucination Number Guard

KrishiNirnay features an integrated bilingual conversational copilot (**Krishi Mitra / कृषी मित्र**) accessible via voice or chat.

### 5.1 Progressive Dialogue State Machine
The AI copilot adheres to conversational guardrails:
- **Greeting & Intent Recognition:** Greets the farmer in Marathi or English and inquires about current harvest details.
- **Progressive Slot Filling:** Collects missing variables (Crop $\rightarrow$ Quantity $\rightarrow$ Nearest Mandi) step-by-step rather than blurting out unsolicited recommendations.
- **Analytical Explanations:** Explains *why* an action was recommended (e.g., breakdown of transport cost vs. expected price gain).

### 5.2 🛡️ The Zero-Hallucination Number Guard
LLMs are notorious for fabricating numerical values. In KrishiNirnay:
1. **The LLM never calculates money:** All financial math is executed in deterministic Python modules.
2. **Strict Regex & Semantic Validator:** Every digit output in AI responses is intercepted and verified against the permitted whitelist from the backend `DecisionRecord`. If an unverified number is detected, the response is blocked and reverted to verified deterministic narration.

---

## 🧪 6. Testing & Verification Suite

The repository includes a comprehensive automated test suite covering unit tests, contract validation, and economic invariants:

```bash
# Run all 72 pytest test suites
python run_tests.py
```

### Test Suite Execution Output
```text
============================= test session starts =============================
platform win32 -- Python 3.10.11, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\Users\parth\Documents\KrishiNirnay
collected 72 items

tests/test_api_gateway.py ...........                                    [ 15%]
tests/test_contracts.py ...............                                  [ 36%]
tests/test_decision_engine.py ..................                         [ 61%]
tests/test_economics_parity.py ..............                            [ 80%]
tests/test_number_guard.py ..............                                [100%]

======================== 72 passed, 1 warning in 3.14s ========================
```

---

## 🚀 7. Quick Start & Setup Guide

### 7.1 Prerequisites
- **Python:** 3.10 or 3.11
- **Node.js:** 18.0 or higher
- **Package Managers:** `pip` and `npm`

### 7.2 Clone Repository
```bash
git clone https://github.com/Parth-Chavan-15/Syrus7_Ode_to_Code.git
cd Syrus7_Ode_to_Code
```

### 7.3 Backend Setup (FastAPI Gateway)
```bash
# 1. Create and activate a virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# 2. Install dependencies
pip install fastapi uvicorn pydantic pyyaml pandas numpy scikit-learn xgboost requests pytest

# 3. Launch the Backend Gateway
python run_gateway.py
```
- **Backend API:** [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

### 7.4 Frontend Setup (React 18 + Vite PWA)
In a separate terminal window:
```bash
# 1. Navigate to the web application
cd apps/web

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```
- **Web App Dashboard:** [http://localhost:3000](http://localhost:3000)

> **Zero-Key Offline Mode:** KrishiNirnay operates 100% offline using verified historical AGMARKNET series, pre-calculated walk-forward models, and local cached routes even if no external API keys (Gemini, Groq, ORS) are supplied.

---

## 📂 8. Repository Structure

```text
KrishiNirnay/
├── apps/
│   ├── api/                      # FastAPI Gateway & Endpoints
│   │   ├── routes/               # Modular API routes (assist, decision, validation, etc.)
│   │   └── llm/                  # Bounded LLM orchestrator & Number Guard
│   ├── web/                      # React 18 + Vite + Tailwind CSS Web Dashboard
│   │   ├── src/components/       # UI Screens (Advice, What-If, Bill, Model Validation)
│   │   └── src/api/              # Typed frontend API client with offline fallbacks
│   └── mobile/                   # React Native + Expo Mobile Client
├── configs/                      # Canonical configuration files (costs, risks, routes)
├── contracts/                    # Pydantic schemas & DecisionRecord data contracts
├── data/
│   ├── raw/                      # Raw AGMARKNET mandi records (2024–2026)
│   └── clean/                    # Cleaned daily time-series & spatial price matrices
├── docs/
│   ├── assets/                   # Architecture diagrams & dashboard screenshots
│   └── integration/              # Economics audit, dataset audit, and test reports
├── models/                       # Walk-forward model checkpoints & summary stats
├── reports/                      # Forecast evaluation & walk-forward comparison CSVs
├── services/
│   ├── decision/                 # Canonical microeconomic decision engine
│   ├── forecast/                 # Time-series baseline & XGBoost predictors
│   └── adapters/                 # Open-Meteo, IMD, and OpenRouteService adapters
├── run_gateway.py                # Backend server bootstrap script
├── run_tests.py                  # Automated test runner (72 tests)
└── README.md                     # Master project documentation
```

---

## 🎯 9. Canonical Golden Fixture Benchmark

For a standard test case of **20 qtl Tomato harvest in Nashik APMC** (60 km round trip freight, 2-day holding, 1% transit loss, 2% storage loss, ₹12/qtl hamali, ₹2/qtl/day storage, 12% capital financing):

| Key Economic Metric | Verified Engine Output | Real-World Farmer Value |
| :--- | :--- | :--- |
| **Sell Now Net Realization** | **₹33,960.00** | Net in-hand payout if sold today at baseline rate. |
| **Wait 2 Days Expected Net ($q50$)** | **₹36,055.00** | Expected net payout on Day 2 after all costs. |
| **Net In-Hand Gain** | **+₹2,095.00 (+6.17%)** | Additional net profit directly in the farmer’s pocket. |
| **Break-Even Reservation Price** | **₹1,842.00 / qtl** | Minimum price needed on Day 2; do not sell below this. |
| **Probability of Beating Baseline** | **62.4%** | Quantified confidence gate based on historical dispersion. |

---

## 🔌 10. API Specification

| HTTP Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Returns service status, version, uptime, and system health. |
| `POST` | `/api/recommendation` | Computes full economic decision record for given crop & farm parameters. |
| `GET` | `/api/model-validation/summary` | Serves walk-forward backtest metrics (MAE, RMSE, R²) for judge inspection. |
| `GET` | `/api/model-validation/series` | Returns 42-horizon actual vs. predicted curves across regional APMCs. |
| `GET` | `/api/heatmap` | Spatial price dispersion across Maharashtra mandis. |
| `POST` | `/api/llm/assist` | Bounded conversational assistant with Number Guard verification. |

---

## 👥 Contributors & Acknowledgments
- **Project:** KrishiNirnay (कृषिनिर्णय)
- **Hackathon:** Syrus 7.0 (Ode-to-Code) — 2026
- **Problem Statement:** Agriculture PS_02: AI Market and Risk Intelligence for Agri Supply Chains
- **Repository:** [Parth-Chavan-15/Syrus7_Ode_to_Code](https://github.com/Parth-Chavan-15/Syrus7_Ode_to_Code)

*Built with passion to bring financial transparency and economic prosperity to Indian agriculture.*
