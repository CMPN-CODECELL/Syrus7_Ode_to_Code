/**
 * API Client for KrishiNirnay with offline fallback support.
 */

import {
  DecisionRecord,
  MarketSnapshot,
  PriceHistoryResponse,
  HeatmapMatrix,
  AssistRequest,
  AssistResponse,
  ScenarioRequest,
  ScenarioResponse,
  DemoStatus,
  DemoFailureMode,
  MarketCalendarResponse,
  WeatherImpactResponse,
  LiveMarketMessage,
  ValidationSummaryResponse,
  SeriesValidationResponse
} from '../types';

const API_BASE = ''; // uses vite proxy or relative path

export class ApiClient {
  static async assist(req: AssistRequest): Promise<AssistResponse> {
    try {
      const res = await fetch(`${API_BASE}/api/assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn('API assist failed, falling back to cached golden snapshot:', e);
      return this.getCachedFallbackAssist(req);
    }
  }

  static async getMarketSnapshot(crop: string = 'Tomato', mandi: string = 'Nashik APMC'): Promise<MarketSnapshot> {
    const res = await fetch(`${API_BASE}/api/market-snapshot?crop=${encodeURIComponent(crop)}&mandi=${encodeURIComponent(mandi)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  static async getPriceHistory(crop: string = 'Tomato', mandi: string = 'Nashik APMC', days: number = 30): Promise<PriceHistoryResponse> {
    const res = await fetch(`${API_BASE}/api/price-history?crop=${encodeURIComponent(crop)}&mandi=${encodeURIComponent(mandi)}&days=${days}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  static async getHeatmap(): Promise<HeatmapMatrix> {
    const res = await fetch(`${API_BASE}/api/heatmap`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  static async getMarketCalendar(crop: string = 'Tomato', mandi: string = 'Nashik APMC'): Promise<MarketCalendarResponse> {
    try {
      const res = await fetch(`${API_BASE}/api/market-calendar?crop=${encodeURIComponent(crop)}&mandi=${encodeURIComponent(mandi)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      // Offline fallback
      return {
        mandi,
        crop,
        generated_at: '2026-10-09T05:30:00+05:30',
        days: [
          { day_offset: 0, date_str: '2026-10-09', day_name: 'Today (Fri)', is_open: true, status_label: 'OPEN', modal_price: 1800, expected_arrivals_tonnes: 142, advisory: 'Active trading' },
          { day_offset: 1, date_str: '2026-10-10', day_name: 'Tomorrow (Sat)', is_open: true, status_label: 'OPEN', modal_price: 1880, expected_arrivals_tonnes: 165, advisory: 'Strong weekend demand' },
          { day_offset: 2, date_str: '2026-10-11', day_name: 'Day 2 (Sun)', is_open: false, status_label: 'CLOSED (Weekly Off)', holiday_name: 'Sunday APMC Holiday', modal_price: 0, expected_arrivals_tonnes: 0, advisory: 'Nashik APMC closed on Sunday! Divert to Pimpalgaon private yard' },
          { day_offset: 3, date_str: '2026-10-12', day_name: 'Day 3 (Mon)', is_open: true, status_label: 'OPEN', modal_price: 1840, expected_arrivals_tonnes: 190, advisory: 'Post-weekend arrival surge' },
          { day_offset: 4, date_str: '2026-10-13', day_name: 'Day 4 (Tue)', is_open: false, status_label: 'CLOSED (Festival Holiday)', holiday_name: 'Amavasya Mandi Holiday', modal_price: 0, expected_arrivals_tonnes: 0, advisory: 'Mandi closed for festival! Do not travel today.' },
          { day_offset: 5, date_str: '2026-10-14', day_name: 'Day 5 (Wed)', is_open: true, status_label: 'OPEN', modal_price: 1750, expected_arrivals_tonnes: 210, advisory: 'Delayed produce arrives' },
          { day_offset: 6, date_str: '2026-10-15', day_name: 'Day 6 (Thu)', is_open: true, status_label: 'OPEN', modal_price: 1720, expected_arrivals_tonnes: 175, advisory: 'Normal weekday' }
        ]
      };
    }
  }

  static async getWeatherImpact(
    crop: string = 'Tomato',
    mandi: string = 'Nashik APMC',
    location: string = 'Default Catchment'
  ): Promise<WeatherImpactResponse> {
    try {
      const res = await fetch(
        `${API_BASE}/api/weather-impact?crop=${encodeURIComponent(crop)}&mandi=${encodeURIComponent(mandi)}&location=${encodeURIComponent(location)}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      const isDindori = location.toLowerCase().includes('dindori');
      const isSinnar = location.toLowerCase().includes('sinnar');
      const isNiphad = location.toLowerCase().includes('niphad');
      const isSangamner = location.toLowerCase().includes('sangamner');
      const isOnion = crop.toLowerCase().includes('onion');

      let temp = 28.4;
      let humidity = 78;
      let rain = 18.0;
      let alert = 'YELLOW';
      let roadLabel = 'Wet Approaches (+20% Travel Time)';
      let roadLabelMr = 'ओले रस्ते (+२०% वेळ)';
      let summary = 'IMD Yellow Alert: Moderate rain (18mm) expected over Day 1 night to Day 2.';
      let summaryMr = 'हवामान खात्याचा यलो अलर्ट: मध्य नाशिक पट्ट्यात मध्यम पाऊस व मेघगर्जनेची शक्यता.';

      if (isDindori) {
        temp = 25.8; humidity = 86; rain = 26.5; roadLabel = 'Slippery Ghat Tracks (+30% Time)'; roadLabelMr = 'निसरडे घाट रस्ते (+३०% वेळ)';
        summary = 'Foothill rainfall alert: 26.5mm heavy showers along Western Ghats foothills.';
        summaryMr = 'सह्याद्री पायथा पाऊस इशारा: २६.५ मिमी मुसळधार सरी व थंड हवामान संभवते.';
      } else if (isNiphad) {
        temp = 27.6; humidity = 82; rain = 22.0; roadLabel = 'Flooded Approach Roads (+25% Time)'; roadLabelMr = 'पाणथळ रस्ते (+२५% वेळ)';
        summary = 'River basin high-moisture alert: 22mm rainfall expected with persistent morning humidity.';
        summaryMr = 'गोदावरी खोरे उच्च आर्द्रता इशारा: २२ मिमी पाऊस व सकाळी धुके/दमट हवामान संभवते.';
      } else if (isSinnar) {
        temp = 30.5; humidity = 58; rain = 6.5; alert = 'GREEN'; roadLabel = 'Dry Highway Network (+5% Time)'; roadLabelMr = 'कोरडे महामार्ग (+५% वेळ)';
        summary = 'Isolated light drizzle (6.5mm) on leeward plateau; clear road haulage conditions.';
        summaryMr = 'पठारावर हलकी रिमझिम (६.५ मिमी); वाहतुकीसाठी हवामान पूर्णपणे अनुकूल.';
      } else if (isSangamner) {
        temp = 31.0; humidity = 62; rain = 8.0; alert = 'GREEN'; roadLabel = 'Clear State Highway (+8% Time)'; roadLabelMr = 'स्वच्छ राज्य महामार्ग (+८% वेळ)';
        summary = 'Warm semi-arid conditions (31°C) with light scattered showers (8mm).';
        summaryMr = 'उबदार हवामान (३१° से) आणि तुरळक पावसाच्या सरी (८ मिमी).';
      }

      return {
        district: `${location} Agricultural Belt`,
        location,
        temperature_c: temp,
        humidity_pct: humidity,
        rainfall_forecast_mm: rain,
        wind_speed_kmh: 14.0,
        road_condition_label: roadLabel,
        road_slowdown_pct: alert === 'GREEN' ? 5 : 20,
        alert_level: alert,
        weather_summary: summary,
        price_impact_direction: rain > 10 ? 'UPWARD_SHORT_TERM' : 'STABLE',
        harvest_disruption: isOnion
          ? `Rain of ${rain}mm delays field lifting; wet topsoil must dry before harvesting.`
          : 'Wet fields slow picking labor and transport loading by ~25%.',
        storage_spoilage_risk: isOnion
          ? `Elevated humidity (${humidity}%) risks neck-rot in open field piles (0.4%/day). Ventilated bamboo chawls keep loss safe at 0.2%/day.`
          : `High humidity (${humidity}%) causes fruit fungal softening; perishable crate decay doubles to 2.0%/day.`,
        recommended_action: isOnion
          ? `Store in elevated ventilated chawls. Tie down waterproof tarpaulins against ${rain}mm rainfall.`
          : 'Harvest and sell on Saturday (Day 1) or transport in covered crates early Sunday.',
        weather_summary_mr: summaryMr,
        harvest_disruption_mr: isOnion
          ? `${rain} मिमी पावसामुळे शेतातील कांदा काढणी लांबणीवर पडेल; जमीन सुकेपर्यंत काढणी थांबवा.`
          : 'पावसामुळे शेतात चिखल होऊन तोडणी २५% लांबेल; बाजारात सकाळची आवक घटल्याने भावात तात्पुरती वाढ होईल.',
        storage_spoilage_risk_mr: isOnion
          ? `हवेतील दमटपणामुळे (${humidity}%) उघड्या ढिगाऱ्यात सड लागण्याची भीती आहे. हवेशीर चाळीत साठवणूक नुकसान ०.२%/दिवस इतके नियंत्रित राहते.`
          : `जास्त आर्द्रतेमुळे (${humidity}%) टोमॅटो मऊ पडून नासण्याची शक्यता वाढते; क्रेटमधील नासाडी २%/दिवस होते.`,
        recommended_action_mr: isOnion
          ? `कांदा हवेशीर चाळीत सुरक्षित ठेवा. ${rain} मिमी पावसापासून संरक्षणासाठी ताडपत्री बांधून माल बाजारात पाठवा.`
          : 'पावसापूर्वी तोडणी करून माल शनिवारीच विका किंवा रविवारी सकाळी प्लास्टिक क्रेट्सवर ताडपत्री झाकून विक्री करा.'
      };
    }
  }

  static connectMarketFeed(
    onMessage: (data: LiveMarketMessage) => void,
    onStatusChange?: (status: 'connected' | 'disconnected' | 'connecting') => void
  ): WebSocket | null {
    try {
      const isSecure = window.location.protocol === 'https:';
      const wsProtocol = isSecure ? 'wss:' : 'ws:';
      const host = window.location.host || 'localhost:3000';
      const wsUrl = `${wsProtocol}//${host}/ws/market-feed`;

      onStatusChange?.('connecting');
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        onStatusChange?.('connected');
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          onMessage(parsed);
        } catch (e) {
          console.warn('Failed to parse WS data:', e);
        }
      };

      socket.onerror = (err) => {
        console.warn('Market WebSocket error:', err);
        onStatusChange?.('disconnected');
      };

      socket.onclose = () => {
        onStatusChange?.('disconnected');
      };

      return socket;
    } catch (e) {
      console.warn('WebSocket connection not supported or failed:', e);
      onStatusChange?.('disconnected');
      return null;
    }
  }

  static async runScenario(req: ScenarioRequest): Promise<ScenarioResponse> {
    const res = await fetch(`${API_BASE}/api/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  static async getDemoStatus(): Promise<DemoStatus> {
    const res = await fetch(`${API_BASE}/api/demo/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  static async setDemoFailureMode(mode: DemoFailureMode): Promise<any> {
    const res = await fetch(`${API_BASE}/api/demo/failure-mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  static async translate(text: string | string[], target_lang: string = 'mr-IN'): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, target_lang })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.translated_text;
    } catch (e) {
      return text;
    }
  }

  static async getModelValidationSummary(): Promise<ValidationSummaryResponse> {
    const res = await fetch(`${API_BASE}/api/model-validation/summary`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  static async getSeriesValidation(
    mandi: string = 'Nashik APMC',
    crop: string = 'Tomato',
    horizon: number = 1
  ): Promise<SeriesValidationResponse> {
    const res = await fetch(
      `${API_BASE}/api/model-validation/series?mandi=${encodeURIComponent(mandi)}&crop=${encodeURIComponent(crop)}&horizon=${horizon}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  static async transcribeAudio(audioBase64?: string, language: string = 'mr-IN', simulatedText?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/voice/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio_base64: audioBase64, language, sample_rate_hertz: 16000 })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  static async synthesizeSpeech(text: string, language: string = 'mr-IN'): Promise<any> {
    const res = await fetch(`${API_BASE}/api/voice/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language, format: 'browser_fallback' })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  private static getCachedFallbackAssist(req: AssistRequest): AssistResponse {
    // Offline deterministic golden fallback
    return {
      session_id: req.session_id,
      request_id: 'offline-cached-golden',
      assistant_text: '२ दिवस थांबा (नाशिक एपीएमसी). अंदाजे निव्वळ नफा ₹३६,०५५ मिळेल, जो आजपेक्षा +₹२,०९५ जास्त आहे. किमान आरक्षण भाव ₹१,८४२/क्विंटल.',
      decision_record: {
        request_id: 'offline-cached-golden',
        engine_version: '1.0.0',
        data_snapshot_id: 'cached_verified_snapshot_2026',
        rules_version: 'rules_v1.0',
        forecast_model_version: 'xgboost_direct_h7_v1',
        calibration_version: 'conformal_residual_v1',
        cost_config_version: 'cost_v1.0',
        weather_snapshot_id: 'openmeteo_imd_v1',
        route_snapshot_id: 'ors_heigit_v1',
        timestamp: '2026-10-09T06:00:00+05:30',
        commodity: 'Tomato',
        lot_quantity_qtl: 20.0,
        risk_profile: 'BALANCED',
        baseline: {
          market: 'Nashik APMC',
          sale_day: '2026-10-09',
          modal_price: 1800.0,
          quantity_sold_qtl: 19.8,
          gross_revenue: 35640.0,
          net_total: 33960.0,
          cost_breakdown: {
            gross_revenue: 35640.0,
            transport: 1440.0,
            hamali_tolai: 240.0,
            commission_fees: 0.0,
            storage: 0.0,
            financing: 0.0,
            travel_loss_pct: 0.01,
            holding_loss_pct: 0.0,
            quality_factor: 1.0,
            quantity_initial_qtl: 20.0,
            quantity_sold_qtl: 19.8,
            final_net: 33960.0
          }
        },
        chosen: {
          action: 'WAIT',
          market: 'Nashik APMC',
          sale_day: '2026-10-11',
          wait_days: 2,
          modal_price_expected: 1950.0,
          net_total: 36055.0,
          gain_total: 2095.0,
          gain_pct: 0.0617,
          probability_beat_baseline: 0.624,
          reservation_price: 1842.0,
          cost_breakdown: {
            gross_revenue: 37838.0,
            transport: 1440.0,
            hamali_tolai: 240.0,
            commission_fees: 0.0,
            storage: 80.0,
            financing: 23.0,
            travel_loss_pct: 0.01,
            holding_loss_pct: 0.02,
            quality_factor: 1.0,
            quantity_initial_qtl: 20.0,
            quantity_sold_qtl: 19.404,
            final_net: 36055.0
          }
        },
        forecast: {
          crop: 'Tomato',
          mandi: 'Nashik APMC',
          target_date: '2026-10-11',
          q10: 1640.0,
          q20: 1700.0,
          q35: 1830.0,
          q50: 1950.0,
          q90: 2180.0,
          low: 1640.0,
          expected: 1950.0,
          high: 2180.0,
          reliability: 'HIGH',
          rolling_mase: 0.74,
          rolling_80_coverage: 0.82,
          training_end_date: '2026-10-07',
          out_of_range: false,
          top_drivers_up: ['Festive demand pickup', 'Declining local arrivals'],
          top_drivers_down: ['Inter-state supply from Karnataka'],
          unit: 'INR_PER_QUINTAL'
        },
        risk: {
          overall: 'YELLOW',
          score: 0.38,
          flags: [
            { id: 'price_drop', name: 'Price Drop Risk', status: 'GREEN', score: 0.0, reason: 'Forecast prices trend upward', evidence: 'q20 at ₹1,700' },
            { id: 'arrival_spike', name: 'Arrival Spike Risk', status: 'GREEN', score: 0.0, reason: 'Normal arrivals', evidence: '1,420 qtl' },
            { id: 'volatility', name: 'Volatility Risk', status: 'YELLOW', score: 0.5, reason: '14-day spread 54%', evidence: 'Min 1300 to Max 2000' },
            { id: 'stale_data', name: 'Data Freshness Risk', status: 'GREEN', score: 0.0, reason: 'Cached verified morning session', evidence: '0 trading sessions old' },
            { id: 'forecast_reliability', name: 'Forecast Reliability Risk', status: 'GREEN', score: 0.0, reason: 'MASE 0.74, 82% coverage', evidence: 'Standard envelope' },
            { id: 'weather', name: 'Weather Risk', status: 'YELLOW', score: 0.5, reason: 'Moderate rain (18mm) Day 2', evidence: 'IMD Yellow' }
          ]
        },
        warnings: ['Offline demo mode: Using verified cached snapshot.'],
        assumptions: ['Transport ₹12/km round trip 60 km', 'Storage ₹2.0/qtl/day for 2 days'],
        source_refs: ['data.gov.in AGMARKNET daily feed'],
        explanation: {
          verdict: 'WAIT 2 DAYS',
          why: [
            'Expected net realization is ₹36,055 compared to ₹33,960 today, giving an extra net gain of ₹2,095.',
            '62.4% probability of beating today\'s baseline after holding loss (2%), travel loss (1%), storage (₹80), and financing (₹23).',
            'Do not accept below reservation price of ₹1,842/qtl.'
          ],
          key_drivers: ['Forecast modal price rises from ₹1,800 to ₹1,950/qtl'],
          evidence: ['Baseline: ₹33,960', 'Wait: ₹36,055', 'Reservation: ₹1,842/qtl'],
          spoken_summary: '२ दिवस थांबा. अंदाजे निव्वळ नफा ३६,०५५ रुपये मिळेल, जो आजपेक्षा २,०९५ रुपये जास्त आहे. हवामानाचा यलो अलर्ट असल्याने मालाची काळजी घ्या.'
        }
      },
      warnings: ['Offline demo mode active'],
      voice_available: true,
      spoken_summary: '२ दिवस थांबा. अंदाजे निव्वळ नफा ३६,०५५ रुपये मिळेल.',
      fallback_path: 'TEMPLATE',
      slots: {
        commodity: 'Tomato',
        quantity: 20.0,
        quantity_unit: 'qtl',
        home_mandi: 'Nashik APMC',
        requested_wait_days: 2,
        risk_profile: 'BALANCED',
        language: req.language,
        is_complete: true,
        missing_slots: [],
        ambiguous_slots: []
      },
      clarification_needed: false
    };
  }
}
