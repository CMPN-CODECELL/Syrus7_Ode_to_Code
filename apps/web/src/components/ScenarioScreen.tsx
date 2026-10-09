import React, { useState } from 'react';
import {
  Sliders,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Truck,
  Calendar,
  DollarSign,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import { DecisionRecord, ScenarioResponse } from '../types';
import { ApiClient } from '../api/client';

interface Props {
  record: DecisionRecord | null;
  labels?: Record<string, string>;
  language?: 'mr-IN' | 'hi-IN' | 'en-IN';
}

export const ScenarioScreen: React.FC<Props> = ({ record, labels = {}, language = 'en-IN' }) => {
  // Vehicle Selection State
  const [selectedVehicle, setSelectedVehicle] = useState<'pickup' | 'tractor' | 'truck' | 'self'>('pickup');
  
  // Risk Temperament State
  const [riskTemperament, setRiskTemperament] = useState<'CAUTIOUS' | 'BALANCED' | 'AGGRESSIVE'>(
    (record?.risk_profile as any) || 'BALANCED'
  );

  // Holding Days State
  const [waitDays, setWaitDays] = useState<number>(record?.chosen.wait_days || 2);

  // Shocks State
  const [priceDeltaPct, setPriceDeltaPct] = useState<number>(0);
  const [transportDeltaPct, setTransportDeltaPct] = useState<number>(0);
  const [arrivalMultiplier, setArrivalMultiplier] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(false);
  const [scenarioResult, setScenarioResult] = useState<ScenarioResponse | null>(null);

  // Vehicle rate adjustments
  const vehicleConfig = {
    pickup: { label: 'Pickup / Bolero', icon: '🛺', costMultiplier: 1.0, capacity: '20 qtl', desc: 'Standard rural pickup (₹22/km)' },
    tractor: { label: 'Tractor Trolley', icon: '🚜', costMultiplier: 0.75, capacity: '50 qtl', desc: 'Economical group haul (₹16/km)' },
    truck: { label: '10-Wheeler Truck', icon: '🚚', costMultiplier: 0.60, capacity: '100+ qtl', desc: 'Bulk distance haul (₹12/km)' },
    self: { label: 'Self / Local Sale', icon: '🛵', costMultiplier: 0.0, capacity: 'Flexible', desc: 'Direct farm gate (₹0 freight)' }
  };

  // Holiday check on selected wait day
  const isHolidayDay = waitDays === 4; // Day 4 is Festival Holiday (Oct 13 Amavasya)
  const isSundayDay = waitDays === 2; // Day 2 is Sunday

  const handleRunScenario = async (
    pDelta = priceDeltaPct,
    tDelta = transportDeltaPct,
    aMult = arrivalMultiplier,
    vType = selectedVehicle,
    rProfile = riskTemperament
  ) => {
    if (!record) return;
    setLoading(true);
    try {
      // Vehicle multiplier adjusts transport delta
      const effectiveTransportDelta = tDelta + (vehicleConfig[vType].costMultiplier - 1.0);
      
      const res = await ApiClient.runScenario({
        base_request_id: record.request_id,
        commodity: record.commodity,
        quantity_qtl: record.lot_quantity_qtl,
        home_mandi: record.chosen.market,
        price_delta_pct: pDelta,
        transport_delta_pct: effectiveTransportDelta,
        arrival_multiplier: aMult,
        risk_profile: rProfile
      });
      setScenarioResult(res);
    } catch (e) {
      console.error('Scenario simulation failed:', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (record) {
      handleRunScenario();
    }
  }, [record, selectedVehicle, riskTemperament, waitDays]);

  if (!record) return null;

  // Stressed numbers or baseline
  const baselineNet = record.baseline.net_total;
  const currentSimulatedNet = scenarioResult ? scenarioResult.stressed_decision.chosen.net_total : record.chosen.net_total;
  const netDiff = currentSimulatedNet - baselineNet;
  const actionFlipped = scenarioResult?.action_flipped || false;
  const currentAction = actionFlipped ? 'SELL_NOW' : (scenarioResult?.stressed_decision.chosen.action || record.chosen.action);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* 1. Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-serif">
                What-If Planner & Profit Simulator
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Simulate different vehicles, risk tolerances, holding days, and weather shocks in real time.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setPriceDeltaPct(0);
            setTransportDeltaPct(0);
            setArrivalMultiplier(1.0);
            setSelectedVehicle('pickup');
            setRiskTemperament('BALANCED');
            setWaitDays(2);
            handleRunScenario(0, 0, 1.0, 'pickup', 'BALANCED');
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* 2. Interactive Simulator Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Control A: Vehicle Selection */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>1. Choose Transport Vehicle</span>
            </h2>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {vehicleConfig[selectedVehicle].label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {(Object.keys(vehicleConfig) as Array<keyof typeof vehicleConfig>).map((vKey) => {
              const v = vehicleConfig[vKey];
              const isSelected = selectedVehicle === vKey;
              return (
                <button
                  key={vKey}
                  onClick={() => setSelectedVehicle(vKey)}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/20 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{v.icon}</span>
                    <div>
                      <span className="text-xs font-black text-slate-900 block leading-tight">
                        {v.label}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                        {v.capacity}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold block mt-1.5 truncate">
                    {v.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Control B: Risk Temperament & Holding Capacity */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>2. Risk Temperament & Holding Capacity</span>
            </h2>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {riskTemperament}
            </span>
          </div>

          <div className="space-y-2">
            {[
              {
                id: 'CAUTIOUS' as const,
                title: '🛡️ Cautious (Floor Guarantee)',
                desc: 'Considers lower quartile (Q10/Q25). Prioritizes debt safety, minimum price floor.',
                quantile: 'Q10: ₹1,640/qtl'
              },
              {
                id: 'BALANCED' as const,
                title: '⚖️ Balanced (Median Outlook)',
                desc: 'Uses expected market median (Q50). Standard trade-off with 62.4% success probability.',
                quantile: 'Q50: ₹1,950/qtl'
              },
              {
                id: 'AGGRESSIVE' as const,
                title: '🚀 High Return (Upside Potential)',
                desc: 'Targets upper quartile (Q75/Q90) festive peak. Requires dry covered storage.',
                quantile: 'Q90: ₹2,180/qtl'
              }
            ].map((r) => {
              const isSelected = riskTemperament === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setRiskTemperament(r.id)}
                  className={`w-full p-3 rounded-2xl text-left border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/20 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <span className="text-xs font-black text-slate-900 block">
                      {r.title}
                    </span>
                    <span className="text-[11px] text-slate-600 font-medium block mt-0.5">
                      {r.desc}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-1 rounded-xl whitespace-nowrap">
                    {r.quantile}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Control C: Holding Days Slider with Mandi Holiday Guard */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>3. Target Selling Day (Wait Horizon)</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Select how many days you can safely hold your produce before selling.
            </p>
          </div>
          <div className="text-right">
            <span className="text-base font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
              {waitDays === 0 ? 'Sell Today' : `Wait ${waitDays} Days`}
            </span>
          </div>
        </div>

        {/* Days Range Input */}
        <div className="space-y-3 pt-2">
          <input
            type="range"
            min="0"
            max="6"
            step="1"
            value={waitDays}
            onChange={(e) => setWaitDays(parseInt(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
          />

          <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-600">
            {[
              { d: 0, label: 'Today (Fri)' },
              { d: 1, label: '+1d (Sat)' },
              { d: 2, label: '+2d (Sun)' },
              { d: 3, label: '+3d (Mon)' },
              { d: 4, label: '+4d (Tue)' },
              { d: 5, label: '+5d (Wed)' },
              { d: 6, label: '+6d (Thu)' }
            ].map((dayItem) => (
              <button
                key={dayItem.d}
                onClick={() => setWaitDays(dayItem.d)}
                className={`py-1.5 rounded-xl transition ${
                  waitDays === dayItem.d
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'hover:bg-slate-100'
                }`}
              >
                <span className="block text-[11px] font-black">{dayItem.d}d</span>
                <span className="block text-[9px] truncate">{dayItem.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Holiday / Mandi Closure Alert Banner */}
        {isHolidayDay && (
          <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-rose-900 block">
                🛑 MANDI CLOSED: Regional Festival (Amavasya Bazaar Holiday)
              </span>
              <p className="text-xs font-medium text-rose-800 mt-0.5">
                All auction gates at Nashik and Sangamner APMCs are strictly closed on Day 4 (Tuesday). Transporting produce on this day will result in stranded cargo and quality degradation. Please sell on Day 3 or Day 5!
              </p>
            </div>
          </div>
        )}

        {isSundayDay && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-900 block">
                ⚠️ SUNDAY CLOSURE ALERT: Nashik & Sangamner APMCs Closed
              </span>
              <p className="text-xs font-medium text-amber-800 mt-0.5">
                Nashik main APMC yard is closed for weekly Sunday off. Only Pimpalgaon Baswant sub-market operates special private trades. We recommend selling on Saturday (Day 1) or routing specifically to Pimpalgaon.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Control D: 1-Click Market Stress Shock Presets */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>4. Test Market Shock Scenarios</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">Click to simulate stress</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => {
              setTransportDeltaPct(0.20);
              handleRunScenario(priceDeltaPct, 0.20, arrivalMultiplier);
            }}
            className={`p-3.5 rounded-2xl border text-left transition ${
              transportDeltaPct === 0.20
                ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="text-xs font-black text-amber-900 block">🌧️ Heavy Rain Shock</span>
            <span className="text-[10px] text-slate-600 font-medium block mt-1">+20% Freight & Road Delay</span>
          </button>

          <button
            onClick={() => {
              setPriceDeltaPct(-0.15);
              handleRunScenario(-0.15, transportDeltaPct, arrivalMultiplier);
            }}
            className={`p-3.5 rounded-2xl border text-left transition ${
              priceDeltaPct === -0.15
                ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-400'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="text-xs font-black text-rose-900 block">📉 -15% Price Crash</span>
            <span className="text-[10px] text-slate-600 font-medium block mt-1">Simulate market downturn</span>
          </button>

          <button
            onClick={() => {
              setArrivalMultiplier(2.0);
              handleRunScenario(priceDeltaPct, transportDeltaPct, 2.0);
            }}
            className={`p-3.5 rounded-2xl border text-left transition ${
              arrivalMultiplier === 2.0
                ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-400'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="text-xs font-black text-blue-900 block">📦 2.0x Supply Glut</span>
            <span className="text-[10px] text-slate-600 font-medium block mt-1">Inter-state arrival surge</span>
          </button>

          <button
            onClick={() => {
              setPriceDeltaPct(0.10);
              handleRunScenario(0.10, transportDeltaPct, 1.0);
            }}
            className={`p-3.5 rounded-2xl border text-left transition ${
              priceDeltaPct === 0.10
                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="text-xs font-black text-emerald-900 block">☀️ +10% Festival Surge</span>
            <span className="text-[10px] text-slate-600 font-medium block mt-1">Strong retail buying rush</span>
          </button>
        </div>
      </div>

      {/* 3. SIMULATION REAL-TIME OUTCOME HERO CARD */}
      <div className={`rounded-3xl p-6 sm:p-8 text-white shadow-xl transition-all ${
        currentAction === 'WAIT'
          ? 'bg-gradient-to-br from-emerald-800 to-green-700'
          : 'bg-gradient-to-br from-amber-700 to-yellow-600'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
            {currentAction === 'WAIT' ? 'SIMULATED VERDICT: WAIT' : 'SIMULATED VERDICT: SELL NOW'}
          </span>

          {actionFlipped && (
            <span className="px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-black animate-bounce shadow-md">
              ⚠️ Market Shock Flipped Recommendation to SELL NOW!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          {/* Box 1: Baseline Today */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider block">
              Today's Net Baseline
            </span>
            <div className="text-2xl font-black text-white mt-1">
              ₹{baselineNet.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-emerald-100 font-medium block mt-0.5">
              Selling today at {record.baseline.market}
            </span>
          </div>

          {/* Box 2: Simulated Realization */}
          <div className="bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/25 ring-2 ring-white/30">
            <span className="text-xs font-bold text-amber-200 uppercase tracking-wider block">
              Simulated In-Hand Cash
            </span>
            <div className="text-3xl font-black text-white mt-1">
              ₹{Math.round(currentSimulatedNet).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-amber-100 font-medium block mt-0.5">
              Net cash after vehicle & shock deductions
            </span>
          </div>

          {/* Box 3: Gain / Loss vs Today */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider block">
              Net Profit Difference
            </span>
            <div className={`text-2xl font-black mt-1 ${netDiff >= 0 ? 'text-green-300' : 'text-rose-300'}`}>
              {netDiff >= 0 ? `+₹${Math.round(netDiff).toLocaleString('en-IN')}` : `-₹${Math.round(Math.abs(netDiff)).toLocaleString('en-IN')}`}
            </div>
            <span className="text-[11px] text-emerald-100 font-medium block mt-0.5">
              {netDiff >= 0 ? 'Favorable return over selling today' : 'Downside risk detected!'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
