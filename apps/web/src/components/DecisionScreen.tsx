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
  DollarSign,
  CheckCircle2
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
      <div className="bg-white p-8 rounded-3xl border border-amber-300 text-center max-w-2xl mx-auto my-8 space-y-4 shadow-md">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">
          {labels.insufficientEvidence || 'Insufficient Market Evidence'}
        </h2>
        <p className="text-sm text-slate-700 font-medium">
          नवीनतम बाजार भाव किंवा हवामान माहिती पुरेशी ताजी नसल्यामुळे थांबण्याचा (Wait) किंवा दुसऱ्या बाजारात जाण्याचा (Go) सल्ला देणे आर्थिकदृष्ट्या धोकादायक ठरू शकते.
        </p>
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-left text-slate-800 space-y-2">
          <p className="font-bold text-slate-900">सुरक्षित उपाय (Safe Recommendations):</p>
          <ul className="list-disc list-inside space-y-1 text-slate-700">
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
    ? 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-700'
    : isGo
    ? 'bg-gradient-to-r from-blue-700 via-indigo-700 to-teal-700'
    : 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700';

  const actionTitle = isWait
    ? `${labels.waitDays || 'Wait'} ${chosen.wait_days} ${labels.days || 'Days'}`
    : isGo
    ? `${labels.goToMandi || 'Go to'} ${chosen.market}`
    : `${labels.sellNow || 'Sell Now'} (${baseline.market})`;

  return (
    <div className="space-y-6">
      {/* 0. Beginner-Friendly 3-Step Farmer Summary Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-200 shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-emerald-100 pb-2">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{labels.stepGuideTitle || '3-Step Farmer Action Guide'}</span>
          </span>
          <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
            {labels.stepGuideSubtitle || '3 Simple Rules to Remember'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Step 1: Decision */}
          <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-xs">
              1
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 block">
                {labels.step1Title || 'Step 1: Recommended Action'}
              </span>
              <p className="text-sm font-black text-emerald-950 mt-0.5">
                {isWait
                  ? (labels.step1Wait ? labels.step1Wait.replace('{days}', String(chosen.wait_days)) : `Wait ${chosen.wait_days} Days`)
                  : isGo
                  ? (labels.step1Go ? labels.step1Go.replace('{mandi}', chosen.market) : `Go to ${chosen.market}`)
                  : (labels.step1SellNow ? labels.step1SellNow.replace('{mandi}', baseline.market) : `Sell Today (${baseline.market})`)}
              </p>
              <p className="text-[11px] text-slate-600 font-medium">
                {labels.step1Sub ? labels.step1Sub.replace('{mandi}', chosen.market) : `Sell produce at ${chosen.market}`}
              </p>
            </div>
          </div>

          {/* Step 2: In-Hand Money */}
          <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-xs">
              2
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 block">
                {labels.step2Title || 'Step 2: Net In-Hand Realization'}
              </span>
              <p className="text-sm font-black text-emerald-950 mt-0.5">
                ₹{chosen.net_total.toLocaleString('en-IN')}
                {chosen.gain_total > 0 && (
                  <span className="text-xs font-black text-emerald-700 ml-1.5">
                    ({labels.step2Gain ? labels.step2Gain.replace('{amount}', chosen.gain_total.toLocaleString('en-IN')) : `+₹${chosen.gain_total.toLocaleString('en-IN')}`})
                  </span>
                )}
              </p>
              <p className="text-[11px] text-slate-600 font-medium">
                {labels.step2Sub || 'After deducting freight, labor, spoilage & mandi fees'}
              </p>
            </div>
          </div>

          {/* Step 3: Reservation Price */}
          <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-xs">
              3
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 block">
                {labels.step3Title || 'Step 3: Minimum Reservation Price'}
              </span>
              <p className="text-sm font-black text-amber-950 mt-0.5">
                ₹{chosen.reservation_price.toLocaleString('en-IN')} {labels.step3Unit || '/ qtl'}
              </p>
              <p className="text-[11px] text-slate-600 font-medium">
                {labels.step3Sub || 'Strictly do not accept any bid below this price'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Primary Action & Net Card */}
      <div className={`p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden ${actionBg}`}>
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/20 backdrop-blur-md border border-white/30 text-white">
              {chosen.action}
            </span>
            <FreshnessBadge freshness={record.risk.flags.find(f => f.id === 'stale_data')?.status === 'RED' ? 'STALE_RED' : 'FRESH'} />
          </div>

          {/* Read-Aloud Voice Button */}
          <button
            onClick={() => onPlayVoice(explanation.spoken_summary)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold transition shadow-md active:scale-95"
            title="Read out spoken summary"
          >
            <Volume2 className="w-4 h-4 text-emerald-700 animate-pulse" />
            <span>{labels.listen || 'Listen'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end relative z-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 drop-shadow-sm">
              {actionTitle}
            </h1>
            <p className="text-emerald-100 text-sm font-semibold">
              {chosen.market} • {lot_quantity_qtl} {labels.quantity || 'qtl'} {commodity}
            </p>
          </div>

          <div className="bg-black/25 backdrop-blur-md p-5 rounded-2xl border border-white/30 flex flex-col justify-center shadow-inner">
            <div className="text-xs uppercase tracking-wider font-bold text-emerald-100 mb-1">
              {labels.expectedNet || 'Expected Net Realization'}
            </div>
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-baseline gap-2">
              <span>₹{chosen.net_total.toLocaleString('en-IN')}</span>
              {chosen.gain_total > 0 && (
                <span className="text-sm font-black text-emerald-200">
                  (+₹{chosen.gain_total.toLocaleString('en-IN')})
                </span>
              )}
            </div>
            <div className="text-xs text-emerald-100 mt-1 flex items-center justify-between font-medium">
              <span>{labels.sellNowBaseline || 'Sell Now Baseline:'} ₹{baseline.net_total.toLocaleString('en-IN')}</span>
              <span className="font-bold">{Math.round(chosen.probability_beat_baseline * 100)}% {labels.winProbability || 'Win Prob'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Deterministic Decision Parameters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Reservation Price Card */}
        <div className="bg-white p-5 rounded-3xl space-y-2 border-l-4 border-l-emerald-600 border border-emerald-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>{labels.reservationPrice || 'Reservation Price'}</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{chosen.reservation_price.toLocaleString('en-IN')}
            <span className="text-xs font-medium text-slate-500"> {labels.step3Unit || '/qtl'}</span>
          </div>
          <p className="text-[11px] text-slate-600 font-medium">
            {labels.reservationSub || 'Do NOT accept any bid below this threshold to preserve baseline net profit.'}
          </p>
        </div>

        {/* Forecast Range Card */}
        <div className="bg-white p-5 rounded-3xl space-y-2 border-l-4 border-l-teal-600 border border-emerald-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>{labels.forecast || 'Forecast Range'}</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{forecast.expected.toLocaleString('en-IN')}
            <span className="text-xs font-medium text-slate-500"> (q50)</span>
          </div>
          <div className="text-[11px] text-slate-600 font-semibold flex items-center justify-between">
            <span>q10: ₹{forecast.low}</span>
            <span>q90: ₹{forecast.high}</span>
          </div>
        </div>

        {/* Risk State Card */}
        <div className="bg-white p-5 rounded-3xl space-y-2 border-l-4 border-l-amber-500 border border-emerald-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>{labels.riskLevel || 'Composite Risk'}</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-black ${
              risk.overall === 'GREEN' ? 'text-emerald-700' : risk.overall === 'YELLOW' ? 'text-amber-600' : 'text-rose-600'
            }`}>
              {risk.overall}
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">({risk.score.toFixed(2)})</span>
          </div>
          <p className="text-[11px] text-slate-600 font-medium">
            {risk.flags.filter(f => f.status !== 'GREEN').length} {labels.factorsMonitored || 'elevated risk factor(s) monitored.'}
          </p>
        </div>

        {/* Avoided Loss & Spoilage Factor */}
        <div className="bg-white p-5 rounded-3xl space-y-2 border-l-4 border-l-blue-600 border border-emerald-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>{labels.costs || 'Cost Deductions'}</span>
            <Info className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{(chosen.cost_breakdown.transport + chosen.cost_breakdown.hamali_tolai + chosen.cost_breakdown.storage + chosen.cost_breakdown.financing).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-600 font-medium">
            {labels.step2Sub || 'Transport, storage, labor & sequential holding/travel loss factored.'}
          </p>
        </div>
      </div>

      {/* 3. Evidence-Backed "Why?" Cards */}
      <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>{labels.whyTitle || 'Key Evidence & Reasons'}</span>
          </h2>
          <button
            onClick={onOpenScenarios}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
          >
            <span>{labels.stressTestBtn || labels.scenarios || 'Stress Test This Decision'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {explanation.why.map((reason, idx) => (
            <div key={idx} className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 text-xs text-slate-800 space-y-1.5 shadow-xs">
              <span className="font-extrabold text-emerald-800 uppercase tracking-wider text-[10px] block">
                {labels.factPrefix || 'Fact #'}{idx + 1}
              </span>
              <p className="leading-relaxed font-medium">{reason}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
