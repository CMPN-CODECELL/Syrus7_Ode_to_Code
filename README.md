# KrishiNirnay (कृषिनिर्णय)
> **“Sahi Bhav Se, Samriddhi Ki Raah Pe.”**  
> **Agriculture PS_02: AI Market and Risk Intelligence for Agri Supply Chains**  
> **Division 3 — Product + Full Stack + AI/Voice Engineering**

---

## 🌾 1. Overview & Core Product Vision

**KrishiNirnay** is an end-to-end, farmer-facing decision-support system built for smallholder farmers in Maharashtra.  
Rather than treating artificial intelligence as a price-prediction toy, KrishiNirnay operates on one core principle:

> **“AI converts uncertain market prices into a risk-adjusted net-realization decision.”**

### The Core Selling Dilemma
> *“I have 25 quintals of tomatoes. Should I sell today in Nashik or wait three days and send them to another mandi?”*

A higher mandi sticker price does **not** equal more money in the farmer’s pocket. Distance, road travel time, labor (*hamali*), APMC fees, storage costs, capital financing costs, and sequential perishability losses can easily turn a higher headline price into a financial loss.

KrishiNirnay computes the **true net realization** (what the farmer actually keeps in hand) across multiple verified mandis and multiple horizon days, evaluates six deterministic risk flags, enforces margin and probability policy gates, and produces a single immutable **`DecisionRecord`**.

The AI layer (Gemini 3.8 Flash, Groq, Whisper, and TTS) serves as a **conversational shell and translator**—it **never calculates or invents financial numbers**.

---

## 🏗️ 2. Architectural Blueprint

```text
                     ┌──────────────────────────────────────────────┐
                     │              Farmer Interfaces               │
                     │  Primary: React Native + Expo Mobile Client  │
                     │  Secondary: React + Vite + Tailwind PWA      │
                     │  (Chat • Voice • Heatmap • Charts • What-If) │
                     └──────────────────────┬───────────────────────┘
                                            │ HTTPS / JSON / Audio
                     ┌──────────────────────▼───────────────────────┐
                     │          FastAPI Public Gateway              │
                     │  Rate Limiting • Correlation IDs • Validation│
                     └──────────────────────┬───────────────────────┘
                                            │
                     ┌──────────────────────▼───────────────────────┐
                     │       Bounded AI Orchestration Layer         │
                     │  Primary: Gemini 3.8 Flash                   │
                     │  Fallback 1: Groq openai/gpt-oss-20b         │
                     │  Fallback 2: Deterministic Templates         │
                     │  🛡️ NUMBER GUARD (0% Hallucination Barrier)  │
                     └──────────────────────┬───────────────────────┘
                                            │ Bounded Tools Only
                     ┌──────────────────────▼───────────────────────┐
                     │     Deterministic Decision Engine (Core)     │
                     │  Sequential Loss • Transport • Storage • Net │
                     │  Six-Risk System • Margin Gates • Scenarios  │
                     └──────────────────────┬───────────────────────┘
                                            │
                     ┌──────────────────────▼───────────────────────┐
                     │          Verified Data & Fixture Layer       │
                     │  Verified Offline Snapshot • Golden Fixture  │
                     │  Division 1 & 2 Microservice Connectors      │
                     └──────────────────────────────────────────────┘
```

---

## 📁 3. Repository Structure

```text
krishinirnay/
├── apps/
│   ├── api/                              # FastAPI Public Gateway & Bounded AI Layer
│   │   ├── main.py                       # Gateway setup, CORS, correlation middleware
│   │   ├── security/
│   │   │   └── middleware.py             # Correlation ID tracking & IP rate limiting
│   │   ├── session/
│   │   │   └── session_manager.py        # Stateful slot memory & farmer correction handler
│   │   ├── mock_engine/
│   │   │   └── deterministic_engine.py   # Canonical Division 1 & 2 calculation engine
│   │   ├── llm/
│   │   │   ├── number_guard.py           # Number Guard verification (blocks hallucinations)
│   │   │   ├── deterministic_templates.py# Multilingual templates (Marathi, Hindi, English)
│   │   │   ├── tools.py                  # 5 Bounded LLM tools (no leaf formulas exposed)
│   │   │   ├── adapters.py               # Gemini 3.8 Flash & Groq adapters with circuit breakers
│   │   │   └── orchestrator.py           # Slot extraction -> engine execution -> Number Guard
│   │   ├── voice/
│   │   │   ├── glossary.py               # Agri vocabulary & bag-weight invariant parser
│   │   │   ├── asr.py                    # Whisper Large V3 Turbo & ambiguity prompt generator
│   │   │   └── tts.py                    # Concise 3-part spoken text generator
│   │   └── routes/
│   │       ├── assist.py                 # POST /api/assist
│   │       ├── voice.py                  # POST /api/voice/transcribe, POST /api/voice/speak
│   │       ├── market.py                 # GET /api/market-snapshot, GET /api/price-history
│   │       ├── scenario.py               # POST /api/scenario
│   │       ├── demo.py                   # GET /api/demo/status, POST /api/demo/failure-mode
│   │       └── health.py                 # GET /api/health
│   │
│   ├── web/                              # Secondary Web Companion (React + Vite + Tailwind + PWA)
│   │   ├── index.html                    # PWA metadata & Google Fonts
│   │   ├── vite.config.ts                # Reverse proxy to :8000
│   │   ├── tailwind.config.js            # Agricultural design tokens
│   │   ├── public/
│   │   │   ├── manifest.webmanifest      # PWA App Manifest
│   │   │   ├── sw.js                     # Offline Service Worker cache
│   │   │   └── favicon.svg               # KrishiNirnay logo
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx                   # Master screen coordinator
│   │       ├── index.css                 # Glassmorphic utilities & custom scrollbars
│   │       ├── types.ts                  # Shared TypeScript contracts
│   │       ├── api/client.ts             # API client with offline golden fallback
│   │       ├── localization/             # mr.json, hi.json, en.json dictionaries
│   │       └── components/
│   │           ├── Navbar.tsx            # Header, language switcher, risk appetite pill
│   │           ├── FreshnessBadge.tsx    # Fresh / 2-session / 3+ session red exclusion badge
│   │           ├── DemoSwitchBar.tsx     # Failure mode toggle bar (Normal/Data/Stale/Weather/LLM)
│   │           ├── DecisionScreen.tsx    # Screen 1: Action hero card, net return, Why cards
│   │           ├── HeatmapScreen.tsx     # Screen 2: 3x7 Best-Day / Best-Mandi decision matrix
│   │           ├── ForecastScreen.tsx    # Screen 3: 7-day conformal uncertainty & report card
│   │           ├── HistoricalChartScreen.tsx # Screen 4: 30-90 day modal price curve & arrivals
│   │           ├── CostScreen.tsx        # Screen 5: Itemized logistics & sequential loss
│   │           ├── RiskScreen.tsx        # Screen 6: Six risk flags & composite score
│   │           ├── ScenarioScreen.tsx    # Screen 7: What-If sliders & decision flip alert
│   │           ├── VoiceAssistantDrawer.tsx # Drawer with mic & TTS audio playback
│   │           └── FarmerInputsModal.tsx # Custom lot adjustment modal (bags, mandi, etc.)
│   │
│   └── mobile/                           # Primary Mobile Client (React Native + Expo)
│       ├── App.tsx                       # Tab container
│       ├── app.json                      # Expo permissions & Android package config
│       ├── package.json
│       ├── assets/                       # App icons & adaptive splash
│       └── src/
│           ├── types.ts                  # Shared types
│           ├── storage/offlineStorage.ts # AsyncStorage persistence
│           ├── voice/speechService.ts    # Native expo-speech integration
│           ├── api/client.ts             # Mobile client with 10.0.2.2 proxy
│           ├── localization/             # mr.json, hi.json, en.json
│           └── screens/                  # 7 core screens matching PWA functionality
│
├── configs/
│   ├── cost_config.yaml                  # Transport ₹12/km, hamali ₹12/q, storage ₹2/q/day, 12% APR
│   ├── risk_rules.yaml                   # 6-risk weights, thresholds & profile quantiles
│   └── app_config.yaml                   # Mandis, commodities, models, rate limits
│
├── contracts/
│   ├── schemas/                          # Pydantic schema contracts
│   ├── types.ts                          # Single source of truth TypeScript contracts
│   ├── fixtures/
│   │   └── golden_fixture.json           # Master golden numbers (Baseline: ₹33,960 vs Wait: ₹36,055)
│   └── decision_record.schema.json       # JSON Schema definition
│
├── data/demo/
│   └── verified_snapshot.json            # 3 verified mandis x 7 days x 90-day history demo dataset
│
├── services/
│   └── connectors.py                     # Pluggable microservice connectors for Div 1 & Div 2
│
├── scripts/
│   ├── verify_contracts.py               # CLI contract & number invariant verification
│   └── start_demo.bat                    # One-click demo launcher (Gateway + Web)
│
├── run_gateway.py                        # Standalone FastAPI launcher script
└── tests/                                # 15 Automated Pytest Verification Tests
    ├── test_number_guard.py
    ├── test_glossary_and_slots.py
    ├── test_golden_fixture.py
    ├── test_api_endpoints.py
    ├── test_failure_modes.py
    └── test_e2e_consistency.py
```

---

## 🛡️ 4. The Number Guard System (Non-Negotiable AI Safety)

The greatest safety risk in agricultural AI is price and money hallucination.  
KrishiNirnay implements a **strict zero-hallucination barrier**:

1. **Deterministic Authority:** The backend engine generates the canonical `DecisionRecord`.
2. **Authorized Number Extraction:** [`NumberGuard.extract_allowed_numbers()`](file:///c:/Users/ajitm/SYRUS%207.0/apps/api/llm/number_guard.py) extracts every single valid number in the record (baseline net, future net, gain, prices, quantiles, quantities, distances, rates, reservation price, probability).
3. **Devanagari Normalization:** Assistant responses with Marathi/Hindi numerals (`०–९`) are normalized to standard digits (`0–9`).
4. **Token Extraction:** All currency, decimal, integer, and percentage tokens are parsed.
5. **Rejection & Fallback:** If the LLM invents an unsupported number (e.g. hallucinating `₹40,350` instead of `₹36,055`), the response is **immediately rejected** and the system falls back to the deterministic multilingual template.
6. **Result:** **Zero possibility of financial number hallucination.**

---

## 🗣️ 5. Multilingual Voice & Agricultural Glossary

* **Supported Languages:** Marathi (`mr-IN`), Hindi (`hi-IN`), and English fallback (`en-IN`).
* **ASR Hierarchy:** Groq Whisper Large V3 Turbo → Whisper Large V3 → Web Speech API → manual typing.
* **TTS Hierarchy:** Gemini 3.8 Flash-Lite TTS → native `expo-speech` / Web Speech API → text only.
* **Concise Spoken Constraint:** Spoken audio is strictly 3 parts:
  1. Verdict (`WAIT 2 DAYS` / `SELL NOW` / `GO TO MANDI`)
  2. Net amount (e.g., `३६,०५५ रुपये`)
  3. One main risk (e.g., `हवामानाचा यलो अलर्ट असल्याने मालाची काळजी घ्या`).
* **Agricultural Vocabulary:**
  * भाव / दर / रेट / दाम → `modal_price`
  * आवक / गाडी आली → `arrivals_volume`
  * हमीभाव / MSP → `minimum_support_price`
  * क्विंटल → `qtl` (100 kg)
  * कट्टा / पोतं / बोरी / गोणी → `bag`
* **Bag Weight Invariant:** Mentions of bags without a known bag weight (e.g. *“५० पोतं टोमॅटो”*) are flagged with `missing_slots = ['bag_weight_kg']`. The system asks the farmer for the weight per bag and **refuses to convert until bag weight is known**.

---

## 📊 6. The Seven Dashboard Screens

Both the Web PWA companion and Mobile App provide seven specialized screens:

1. **Decision Screen (Screen 1):**  
   Prominent Action Card (`WAIT 2 DAYS` / `SELL NOW` / `GO TO MANDI`), Expected Net Realization (large font, ₹36,055), Delta vs sell-now baseline (+₹2,095), Reservation Break-Even Price (₹1,842/qtl), Win Odds (62.4%), Composite Risk Badge, Freshness Badge, Fact Evidence Cards, and Read-Aloud speech button. Safe `INSUFFICIENT_EVIDENCE` banner when data is inadequate.
2. **3×7 Best-Day / Best-Mandi Heatmap (Screen 2):**  
   Rows: 3 Mandis (Nashik APMC, Pimpalgaon Baswant APMC, Lasalgaon APMC). Columns: Today through +6 Days. Cells display risk-adjusted net return (₹). Closed days are disabled and marked *Mandi Closed*. Best feasible candidate highlighted with an emerald glow.
3. **Price Forecast Screen (Screen 3):**  
   1–7 Day horizon chart with Low (q10), Expected (q50), and High (q90) uncertainty band. Forecast Report Card displaying only measured walk-forward validation values: MASE (0.74), 80% conformal coverage (82%), interval spread, and training end date. Key upward and downward price drivers.
4. **Historical Price Chart (Screen 4):**  
   30–90 Day historical modal price line, min/max price spread band, and daily arrivals volume overlay. Interactive point inspector displaying observation date, modal price, and confirmed source.
5. **Cost Breakdown Screen (Screen 5):**  
   Itemized logistics deductions: gross revenue, round-trip transport, hamali/tolai, holding storage, financing cost (12% APR), and sequential perishability loss waterfall. Displays assumption and APMC provenance badges. **Strict invariant: No double spoilage.**
6. **Risk Panel (Screen 6):**  
   Deterministic six risk flags: Price Drop, Arrival Spike, Volatility, Stale Data, Forecast Reliability, Weather. Weighted composite formula ($R = 0.25P + 0.20A + 0.15V + 0.15S + 0.15F + 0.10W$). Displays status, scores, evidence, and safety overrides.
7. **What-If Stress Simulator (Screen 7):**  
   Interactive sliders for Price Delta (-10%), Transport Surge (+20%), and Arrival Volume Glut (2.0x). Reruns the backend engine without mutating source data. Displays side-by-side Before vs After comparison and detects decision flips.

---

## ⚖️ 7. Shared Golden Fixture Reference Values

To ensure mathematical precision across API JSON, cards, charts, chat, and voice, KrishiNirnay is verified against the canonical Master golden fixture:
* **Lot:** 20 qtl Tomato, Nashik APMC, 60 km, ₹1,800/qtl observed price.
* **Sell Now Baseline Net:** **₹33,960.00**  
  * Q_sold = 19.8 qtl (1% travel loss), Gross = ₹35,640.00, Transport = ₹1,440.00, Hamali = ₹240.00.
* **Wait 2 Days Expected Net (q50 = ₹1,950/qtl):** **₹36,055.00**  
  * Q_sold = 19.404 qtl (2% holding + 1% travel loss), Gross = ₹37,838.00, Deductions = ₹1,783.00 (Transport ₹1,440 + Hamali ₹240 + Storage ₹80 + Financing ₹23).
  * **Net Gain vs Selling Today:** **+₹2,095.00** (+6.17%).
* **Wait Cautious (q20 = ₹1,700/qtl):** **₹31,204.00** (-₹2,756.00 vs baseline).
* **Reservation / Break-Even Price:** **~₹1,842.00/qtl** (Price at which Wait Net equals Baseline Net).
* **Probability of Beating Baseline:** **62.4%**.
* **Three-Mandi Sell-Now Comparison:** Home A (Nashik): ₹35,172; Mandi B: ₹34,554; Mandi C: ₹33,968.
* **Two-Day Horizon Quantiles:** q20 ₹1,760 → ₹33,570; q35 ₹1,830 → ₹34,937; q50 ₹1,900 → ₹36,305.

---

## 🎛️ 8. Demo Failure-Mode Injection Switch

Accessible via the UI header and `POST /api/demo/failure-mode`:
* **`NORMAL`:** Verified live snapshot, high reliability.
* **`DATA_OUTAGE`:** Simulates upstream API timeout; UI switches to `INSUFFICIENT_EVIDENCE` safe state.
* **`STALE_DATA`:** Simulates 3-session stale data; mandi status turns `STALE_RED`; stale mandi is excluded from current decisions; recommendation safely reverts to Sell Now.
* **`WEATHER_OUTAGE`:** Weather provider outage; no invented weather price effects; caution note displayed.
* **`LLM_OUTAGE`:** Simulates AI service outage; assistant routes to deterministic multilingual templates.

---

## 🚀 9. Setup & Execution Instructions

### Prerequisites
* Python 3.11+
* Node.js v18+ & npm

### Step 1: Install Python Dependencies
```bash
pip install fastapi uvicorn pydantic python-multipart httpx pyyaml pytest pytest-asyncio
```

### Step 2: Run Verification Test Suite
```bash
# Verify contract invariants & golden numbers
python scripts/verify_contracts.py

# Run complete pytest test suite (15 tests)
python -m pytest tests/ -v
```

### Step 3: Launch Public Gateway
```bash
python run_gateway.py
# Gateway active at: http://localhost:8000
# OpenAPI Docs: http://localhost:8000/docs
```

### Step 4: Launch Web Companion PWA
```bash
cd apps/web
npm install
npm run dev
# Browser UI active at: http://localhost:3000
```

### Step 5: Launch Mobile App (Expo)
```bash
cd apps/mobile
npm install
npx expo start
# Scan QR code in Expo Go app (Android/iOS) or press 'a' for Android Emulator
```

### Step 6: One-Click Demo (Windows)
Double click `scripts/start_demo.bat` to launch both Gateway and PWA simultaneously.

---

## 🔗 10. Integration Handoff for Divisions 1 & 2

The public gateway connects to Divisions 1 and 2 via [`services/connectors.py`](file:///c:/Users/ajitm/SYRUS%207.0/services/connectors.py). Setting `USE_LIVE_INTERNAL_SERVICES=true` directs calls to the live microservices:

* **Division 1 (Data & Forecasting):**
  * `GET /internal/market-snapshot?crop={crop}&mandi={mandi}`
  * `GET /internal/price-history?crop={crop}&mandi={mandi}&start_date={s}&end_date={e}`
  * `GET /internal/forecast?crop={crop}&mandi={mandi}&target_date={d}`
  * `GET /internal/freshness`
  * `GET /internal/market-calendar`
* **Division 2 (Decision & Economics):**
  * `POST /internal/analyze-sale-decision`
  * `POST /internal/run-scenario`
  * `GET /internal/weather-context`

---

## 🎯 11. SDG Alignment
* **SDG 2.3 (Zero Hunger):** Enhances net realization for smallholder farmers and reduces distress selling.
* **SDG 12.3 (Responsible Consumption):** Models sequential perishability, storage, and transit losses to reduce avoidable post-harvest food waste.
