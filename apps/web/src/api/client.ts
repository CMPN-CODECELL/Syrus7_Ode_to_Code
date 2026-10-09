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
  DemoFailureMode
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
