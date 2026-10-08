# KrishiNirnay (कृषिनिर्णय)
> **“Sahi Bhav Se, Samriddhi Ki Raah Pe.”**
> **AI Market and Risk Intelligence for Agri Supply Chains (Agriculture PS_02)**

---

## 🌾 Overview
KrishiNirnay is a farmer-facing decision-support product that converts uncertain market prices into a **risk-adjusted net-realization decision**:
- **Baseline:** Sell today at home mandi (Nashik APMC).
- **Alternatives:** Wait (1–7 days) or Go to another mandi (Pimpalgaon Baswant, Lasalgaon).
- **Core Principle:** The LLM is the conversational shell, **never the calculation engine**. Net realization beats headline sticker price after sequential holding loss, travel loss, round-trip transport, labor (hamali), storage, and financing. Zero double-spoilage deduction.

---

## 📁 Repository Structure
```text
krishinirnay/
├── apps/
│   ├── api/                  # FastAPI Public Gateway & AI Layer
│   │   ├── main.py
│   │   ├── routes/           # /api/assist, /api/voice/*, /api/market-snapshot, etc.
│   │   ├── llm/              # Gemini 3.8 Flash, Groq fallback, Number Guard
│   │   ├── voice/            # Multilingual ASR, Agricultural Glossary, TTS
│   │   ├── security/         # Rate limiting, body limits, correlation IDs
│   │   ├── session/          # Stateful slot memory & corrections
│   │   └── mock_engine/      # Deterministic engine implementing Div 1 & 2 contracts
│   ├── web/                  # Secondary Browser Companion (React + Vite + Tailwind + PWA)
│   │   ├── src/components/   # 7 screens: Decision, 3x7 Heatmap, Forecast, History, Costs, Risk, What-If
│   │   └── public/           # manifest.webmanifest, service worker (sw.js)
│   └── mobile/               # Primary Mobile Client (React Native + Expo)
├── configs/
│   ├── cost_config.yaml      # Transport ₹12/km, hamali ₹12/q, storage ₹2/q/day, 12% APR
│   ├── risk_rules.yaml       # 6-risk weights & composite score thresholds
│   └── app_config.yaml       # Models, mandis, commodities, rate limits
├── contracts/
│   ├── schemas/              # Pydantic schema contracts
│   ├── types.ts              # Shared TypeScript interfaces
│   ├── fixtures/             # golden_fixture.json (Master ₹33,960 vs ₹36,055)
│   └── decision_record.schema.json
├── data/
│   └── demo/                 # verified_snapshot.json (Verified offline dataset)
└── tests/                    # 15 tests covering Number Guard, Glossary, Golden Fixture, E2E
```

---

## 🚀 Setup & Run Instructions

### 1. Backend Gateway (FastAPI)
```bash
# Install dependencies
pip install fastapi uvicorn pydantic python-multipart httpx pyyaml pytest pytest-asyncio

# Start the server (Port 8000)
uvicorn apps.api.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation available at: `http://localhost:8000/docs`

### 2. Browser Companion PWA (React + Vite)
```bash
cd apps/web
npm install
npm run dev
```
Accessible at: `http://localhost:3000`

### 3. Primary Mobile Client (React Native + Expo)
```bash
cd apps/mobile
npm install
npx expo start
```
Scan the QR code in Expo Go (Android/iOS) or press `a` for Android Emulator.

---

## 🧪 Running Tests
```bash
# Run the complete test suite
python -m pytest tests/ -v
```
All 15 tests pass with sub-second execution, confirming exact rupee-level numerical equivalence across API, UI cards, charts, text, and speech.
