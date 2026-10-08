import React from 'react';
import {
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Volume2,
  AlertTriangle,
  Sparkles,
  Info,
  DollarSign
} from 'lucide-react';
import { DecisionRecord } from '../types';
import { FreshnessBadge } from './FreshnessBadge';

interface Props {
  record: DecisionRecord | null;
  onPlayVoice: (text: string) => void;
  onOpenScenarios: () => void;
  labels: Record<string, string>;
  isInsufficientEvidence?: boolean;
}

export const DecisionScreen: React.FC<Props> = ({
  record,
  onPlayVoice,
  onOpenScenarios,
  labels,
  isInsufficientEvidence = false
}) => {
  if (isInsufficientEvidence || !record) {
    return (
      <div className="glass-panel-elevated p-8 rounded-3xl border border-amber-500/30 text-center max-w-2xl mx-auto my-8 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">
          {labels.insufficientEvidence || 'Insufficient Market Evidence'}
        </h2>
        <p className="text-sm text-slate-300">
          नवीनतम बाजार भाव किंवा हवामान माहिती पुरेशी ताजी नसल्यामुळे थांबण्याचा (Wait) किंवा दुसऱ्या बाजारात जाण्याचा (Go) सल्ला देणे आर्थिकदृष्ट्या धोकादायक ठरू शकते.
        </p>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-left text-slate-400 space-y-2">
          <p className="font-semibold text-slate-200">सुरक्षित उपाय (Safe Recommendations):</p>
          <ul className="list-disc list-inside space-y-1">
            <li>स्थानिक खात्रीशीर बाजार समितीत (Nashik APMC) आजच विक्रीचा विचार करा.</li>
            <li>पुढील ट्रेडिंग सत्रात नवीन अधिकृत आवक व भाव जाहीर होण्याची प्रतीक्षा करा.</li>
          </ul>
        </div>
      </div>
    );
  }

  const { chosen, baseline, forecast, risk, explanation, lot_quantity_qtl, commodity } = record;
  const isWait = chosen.action === 'WAIT';
  const isGo = chosen.action === 'GO';
  const isSellNow = chosen.action === 'SELL_NOW';

  const actionBg = isWait
    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700'
    : isGo
    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-700'
    : 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700';

  const actionTitle = isWait
    ? `${labels.waitDays || 'Wait'} ${chosen.wait_days} ${labels.days || 'Days'}`
    : isGo
    ? `${labels.goToMandi || 'Go to'} ${chosen.market}`
    : `${labels.sellNow || 'Sell Now'} (${baseline.market})`;

  return (
    <div className="space-y-6">
      {/* 1. Primary Action & Net Card */}
      <div className={`p-6 sm:p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden ${actionBg}`}>
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/25 backdrop-blur-md border border-white/20">
              {chosen.action}
            </span>
            <FreshnessBadge freshness={record.risk.flags.find(f => f.id === 'stale_data')?.status === 'RED' ? 'STALE_RED' : 'FRESH'} />
          </div>

          {/* Read-Aloud Voice Button */}
          <button
            onClick={() => onPlayVoice(explanation.spoken_summary)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-xs font-semibold transition border border-white/30 active:scale-95"
            title="Read out spoken summary"
          >
            <Volume2 className="w-4 h-4 text-white animate-pulse" />
            <span>{labels.listen || 'Listen (बोला/ऐका)'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end relative z-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
              {actionTitle}
            </h1>
            <p className="text-emerald-100 text-sm font-medium">
              {chosen.market} • {lot_quantity_qtl} qtl {commodity}
            </p>
          </div>

          <div className="bg-black/25 backdrop-blur-md p-5 rounded-2xl border border-white/20 flex flex-col justify-center">
            <div className="text-xs uppercase tracking-wider font-semibold text-emerald-200 mb-1">
              {labels.expectedNet || 'Expected Net Realization'}
            </div>
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-baseline gap-2">
              <span>₹{chosen.net_total.toLocaleString('en-IN')}</span>
              {chosen.gain_total > 0 && (
                <span className="text-sm font-bold text-emerald-300">
                  (+₹{chosen.gain_total.toLocaleString('en-IN')})
                </span>
              )}
            </div>
            <div className="text-xs text-emerald-200 mt-1 flex items-center justify-between">
              <span>Sell Now Baseline: ₹{baseline.net_total.toLocaleString('en-IN')}</span>
              <span className="font-semibold">{Math.round(chosen.probability_beat_baseline * 100)}% Win Prob</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Deterministic Decision Parameters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Reservation Price Card */}
        <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>{labels.reservationPrice || 'Reservation Price'}</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">
            ₹{chosen.reservation_price.toLocaleString('en-IN')}
            <span className="text-xs font-normal text-slate-400"> /qtl</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Do NOT accept any bid below this threshold to preserve baseline net profit.
          </p>
        </div>

        {/* Forecast Range Card */}
        <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-teal-500">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>{labels.forecast || 'Forecast Range'}</span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">
            ₹{forecast.expected.toLocaleString('en-IN')}
            <span className="text-xs font-normal text-slate-400"> (q50)</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Low (q10): ₹{forecast.low}</span>
            <span>High (q90): ₹{forecast.high}</span>
          </div>
        </div>

        {/* Risk State Card */}
        <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>{labels.riskLevel || 'Composite Risk'}</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${
              risk.overall === 'GREEN' ? 'text-emerald-400' : risk.overall === 'YELLOW' ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {risk.overall}
            </span>
            <span className="text-xs font-mono text-slate-400">({risk.score.toFixed(2)})</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {risk.flags.filter(f => f.status !== 'GREEN').length} elevated risk factor(s) monitored.
          </p>
        </div>

        {/* Avoided Loss & Spoilage Factor */}
        <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Deductions Accounted</span>
            <Info className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">
            ₹{(chosen.cost_breakdown.transport + chosen.cost_breakdown.hamali_tolai + chosen.cost_breakdown.storage + chosen.cost_breakdown.financing).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400">
            Transport, storage, labor & sequential holding/travel loss factored.
          </p>
        </div>
      </div>

      {/* 3. Evidence-Backed "Why?" Cards */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-agri-400" />
            <span>{labels.whyTitle || 'Key Evidence & Reasons'}</span>
          </h2>
          <button
            onClick={onOpenScenarios}
            className="text-xs font-semibold text-agri-400 hover:text-agri-300 flex items-center gap-1"
          >
            <span>Stress Test This Decision</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {explanation.why.map((reason, idx) => (
            <div key={idx} className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <span className="font-bold text-agri-400">Fact #{idx + 1}</span>
              <p className="leading-relaxed">{reason}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
