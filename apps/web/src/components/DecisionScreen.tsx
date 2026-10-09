import React, { useState } from 'react';
import {
  Sprout,
  Volume2,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Receipt,
  Truck,
  DollarSign,
  TrendingUp,
  MapPin,
  Clock
} from 'lucide-react';
import { DecisionRecord } from '../types';

interface DecisionScreenProps {
  record: DecisionRecord | null;
  onPlayVoice: (text: string) => void;
  onOpenScenarios?: () => void;
  onOpenCosts?: () => void;
  labels: Record<string, string>;
  isInsufficientEvidence?: boolean;
}

export const DecisionScreen: React.FC<DecisionScreenProps> = ({
  record,
  onPlayVoice,
  onOpenScenarios,
  onOpenCosts,
  labels,
  isInsufficientEvidence
}) => {
  const [selectedMandiPreview, setSelectedMandiPreview] = useState<string>('Nashik APMC');

  if (!record) {
    return (
      <div className="bg-white p-12 text-center rounded-3xl border border-emerald-100 shadow-sm space-y-4 max-w-xl mx-auto">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-bold text-slate-700">
          {labels.engineStarting || 'Calculating your optimal market decision...'}
        </p>
      </div>
    );
  }

  const { chosen, baseline, explanation, lot_quantity_qtl, commodity } = record;
  const isWait = chosen.action === 'WAIT';
  const isGo = chosen.action === 'GO';
  const isSellNow = chosen.action === 'SELL_NOW' || (!isWait && !isGo);

  // Audio text
  const spokenText = explanation.spoken_summary || (
    isWait
      ? `${chosen.wait_days} दिवस थांबा. अंदाजे निव्वळ नफा ${chosen.net_total.toLocaleString('en-IN')} रुपये मिळेल, जो आजपेक्षा ${chosen.gain_total.toLocaleString('en-IN')} रुपये जास्त आहे. स्थानिक बाजारात ${chosen.reservation_price} रुपयांपेक्षा कमी भावात माल विकू नका.`
      : `आजच ${baseline.market} येथे माल विका. अंदाजे निव्वळ रक्कम ${baseline.net_total.toLocaleString('en-IN')} रुपये मिळेल.`
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* 1. Insufficient Evidence / Outage Warning Banner if active */}
      {isInsufficientEvidence && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-xs font-bold">
            {labels.insufficientEvidence || 'Market data is currently unavailable. Showing safe fallback baseline.'}
          </p>
        </div>
      )}

      {/* 2. THE GIANT TRAFFIC-LIGHT DECISION BANNER (अत्यंत सोपा, स्पष्ट निर्णय) */}
      <div className={`rounded-3xl p-6 sm:p-8 text-white shadow-xl transition-all ${
        isWait
          ? 'bg-gradient-to-br from-emerald-800 via-emerald-700 to-green-700'
          : isGo
          ? 'bg-gradient-to-br from-blue-800 via-blue-700 to-indigo-700'
          : 'bg-gradient-to-br from-amber-700 via-amber-600 to-yellow-600'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
            {isWait ? '🟢 योग्य निर्णय: थांबा' : isGo ? '🔵 योग्य निर्णय: दुसऱ्या बाजारात जा' : '🟡 योग्य निर्णय: आजच विका'}
          </span>

          {/* Large Listen Button (मोठे ऐका बटण) */}
          <button
            onClick={() => onPlayVoice(spokenText)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-black text-xs backdrop-blur-md border border-white/30 transition transform active:scale-95 shadow-xs"
            title="Listen in local language"
          >
            <Volume2 className="w-4 h-4 text-emerald-200 animate-pulse" />
            <span>{labels.listen || 'ऐका (Listen)'}</span>
          </button>
        </div>

        {/* Hero Title: Exactly what to do */}
        <div className="space-y-2 mb-6">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-serif text-white">
            {isWait
              ? `${chosen.wait_days} दिवस थांबा (${chosen.market})`
              : isGo
              ? `${chosen.market} येथे माल विका`
              : `आजच ${baseline.market} येथे विका`}
          </h1>
          <p className="text-sm sm:text-base text-emerald-100 font-medium">
            {lot_quantity_qtl} क्विंटल {commodity} • {chosen.market}
          </p>
        </div>

        {/* 3 Large Golden Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 border-t border-white/20">
          {/* Card 1: Expected In-Hand Cash */}
          <div className="bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-200 block">
              हातात मिळणारा निव्वळ नफा
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              ₹{chosen.net_total.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-emerald-200 font-semibold block mt-1">
              सर्व खर्च व नासाडी वजा करून
            </span>
          </div>

          {/* Card 2: Extra Gain vs Today */}
          <div className="bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-200 block">
              आज विकण्यापेक्षा जादा फायदा
            </span>
            <div className="text-2xl sm:text-3xl font-black text-green-300 mt-1">
              {chosen.gain_total > 0 ? `+₹${chosen.gain_total.toLocaleString('en-IN')}` : '₹० आधार भाव'}
            </div>
            <span className="text-[11px] text-emerald-200 font-semibold block mt-1">
              आज विकल्यास: ₹{baseline.net_total.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Card 3: Minimum Reservation Price (कमी भाव घेऊ नका) */}
          <div className="bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-200 block">
              किमान आरक्षण भाव (यापेक्षा कमी नको)
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-300 mt-1">
              ₹{chosen.reservation_price.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-amber-200 font-semibold block mt-1">
              प्रति क्विंटल किमान बोली
            </span>
          </div>
        </div>
      </div>

      {/* 3. Plain Farmer Rationale (का थांबावे? सोप्या भाषेत कारणे) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-sm space-y-4">
        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>हा निर्णय का योग्य आहे? (महत्त्वाची कारणे)</span>
        </h2>

        <div className="space-y-3 text-xs sm:text-sm text-slate-700">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-xl">📈</span>
            <div>
              <strong className="text-emerald-950 font-black block">भाव वाढण्याची दाट शक्यता</strong>
              <span>
                {chosen.market} मध्ये २ दिवसांनंतर आवक संतुलित राहून भाव ₹{chosen.reservation_price} पेक्षा जास्त मिळण्याची {Math.round(chosen.probability_beat_baseline * 100)}% शक्यता आहे.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200">
            <span className="text-xl">🚚</span>
            <div>
              <strong className="text-blue-950 font-black block">खर्च व वजन घट वजा जाता नफा</strong>
              <span>
                गाडी भाडे (₹{Math.round(chosen.cost_breakdown.transport).toLocaleString('en-IN')}), हमाली (₹{Math.round(chosen.cost_breakdown.hamali_tolai).toLocaleString('en-IN')}) आणि २% साठवणूक घट वजा जाता तुम्हाला +₹{chosen.gain_total.toLocaleString('en-IN')} जास्त मिळतील.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
            <span className="text-xl">🛑</span>
            <div>
              <strong className="text-amber-950 font-black block">गावातील व्यापाऱ्यासाठी इशारा</strong>
              <span>
                स्थानिक गावात कोणी व्यापारी माल मागत असेल तर ₹{chosen.reservation_price} / क्विंटल पेक्षा कमी भावाने अजिबात विकू नका!
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Mandi Rates & Prediction Comparison for YOUR Quantity (आजचा भाव vs अंदाजित भाव) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>आजचा भाव vs २ दिवसांनंतरचा अंदाजित भाव</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              तुमच्या {lot_quantity_qtl} क्विंटल {commodity} मालासाठी प्रत्यक्ष बाजार भाव तुलना
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Today's Price Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 uppercase">आजचा चालू भाव (Today)</span>
              <span className="text-xs font-bold text-slate-500">{baseline.market}</span>
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900">₹{baseline.modal_price.toLocaleString('en-IN')}</span>
              <span className="text-xs font-bold text-slate-500 ml-1">/ क्विंटल</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600">एकूण मालाचे मूल्य:</span>
              <span className="font-black text-slate-900">₹{(baseline.modal_price * lot_quantity_qtl).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Future Predicted Price Box */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-900 uppercase">२ दिवसांनंतरचा अंदाजित भाव (Future)</span>
              <span className="text-xs font-bold text-emerald-700">{chosen.market}</span>
            </div>
            <div>
              <span className="text-2xl font-black text-emerald-900">₹{record.forecast.expected.toLocaleString('en-IN')}</span>
              <span className="text-xs font-bold text-emerald-700 ml-1">/ क्विंटल</span>
            </div>
            <div className="pt-2 border-t border-emerald-200 flex items-center justify-between text-xs">
              <span className="text-emerald-800">अंदाजे एकूण मालाचे मूल्य:</span>
              <span className="font-black text-emerald-950">₹{(record.forecast.expected * lot_quantity_qtl).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Navigation Buttons: Go to Pocket Calculator */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          onClick={() => onOpenCosts ? onOpenCosts() : onOpenScenarios && onOpenScenarios()}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm shadow-md shadow-emerald-700/20 transition active:scale-95"
        >
          <Receipt className="w-4 h-4 text-emerald-200" />
          <span>साधा हिशोब व पावती पहा (Pocket Calculator) ➔</span>
        </button>
      </div>
    </div>
  );
};
