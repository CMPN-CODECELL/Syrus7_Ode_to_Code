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
  Clock,
  Award,
  BarChart3
} from 'lucide-react';
import { DecisionRecord } from '../types';
import { DynamicTranslator } from '../api/dynamicTranslator';

interface DecisionScreenProps {
  record: DecisionRecord | null;
  onPlayVoice: (text: string) => void;
  onOpenScenarios?: () => void;
  onOpenCosts?: () => void;
  labels: Record<string, string>;
  language?: 'mr-IN' | 'hi-IN' | 'en-IN';
  isInsufficientEvidence?: boolean;
}

export const DecisionScreen: React.FC<DecisionScreenProps> = ({
  record,
  onPlayVoice,
  onOpenScenarios,
  onOpenCosts,
  labels,
  language = 'mr-IN',
  isInsufficientEvidence
}) => {
  const [selectedMandiView, setSelectedMandiView] = useState<string>('Pimpalgaon Baswant APMC');

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

  // 7-Day Forecast Data for the Visual Stepper Chart
  const forecastDays = language === 'mr-IN' ? [
    { dayName: 'आज', dateStr: 'आज', price: baseline.modal_price, isPeak: false, note: 'चालू भाव' },
    { dayName: 'उद्या (+१)', dateStr: '१० ऑक्टो', price: 1880, isPeak: false, note: 'चढता कल' },
    { dayName: 'परवा (+२)', dateStr: '११ ऑक्टो', price: record.forecast.expected, isPeak: true, note: 'सर्वोच्च भाव 🌟' },
    { dayName: 'रविवार (+३)', dateStr: '१२ ऑक्टो', price: 1840, isPeak: false, note: 'घसरणीची शक्यता' },
    { dayName: 'सोमवार (+४)', dateStr: '१३ ऑक्टो', price: 1790, isPeak: false, note: 'आवक वाढेल' },
    { dayName: 'मंगळवार (+५)', dateStr: '१४ ऑक्टो', price: 1750, isPeak: false, note: 'कमी भाव' },
    { dayName: 'बुधवार (+६)', dateStr: '१५ ऑक्टो', price: 1720, isPeak: false, note: 'कमी भाव' }
  ] : language === 'hi-IN' ? [
    { dayName: 'आज', dateStr: 'आज', price: baseline.modal_price, isPeak: false, note: 'मौजूदा भाव' },
    { dayName: 'कल (+1)', dateStr: '10 अक्टू', price: 1880, isPeak: false, note: 'बढ़ता रुझान' },
    { dayName: 'परसों (+2)', dateStr: '11 अक्टू', price: record.forecast.expected, isPeak: true, note: 'सर्वोच्च भाव 🌟' },
    { dayName: 'रविवार (+3)', dateStr: '12 अक्टू', price: 1840, isPeak: false, note: 'गिरावट की संभावना' },
    { dayName: 'सोमवार (+4)', dateStr: '13 अक्टू', price: 1790, isPeak: false, note: 'आवक बढ़ेगी' },
    { dayName: 'मंगलवार (+5)', dateStr: '14 अक्टू', price: 1750, isPeak: false, note: 'कम भाव' },
    { dayName: 'बुधवार (+6)', dateStr: '15 अक्टू', price: 1720, isPeak: false, note: 'कम भाव' }
  ] : [
    { dayName: 'Today', dateStr: 'Today', price: baseline.modal_price, isPeak: false, note: 'Current rate' },
    { dayName: 'Tomorrow (+1d)', dateStr: 'Oct 10', price: 1880, isPeak: false, note: 'Rising trend' },
    { dayName: 'Day 2 (+2d)', dateStr: 'Oct 11', price: record.forecast.expected, isPeak: true, note: 'Peak Rate 🌟' },
    { dayName: 'Sun (+3d)', dateStr: 'Oct 12', price: 1840, isPeak: false, note: 'Drop expected' },
    { dayName: 'Mon (+4d)', dateStr: 'Oct 13', price: 1790, isPeak: false, note: 'Arrival surge' },
    { dayName: 'Tue (+5d)', dateStr: 'Oct 14', price: 1750, isPeak: false, note: 'Lower rate' },
    { dayName: 'Wed (+6d)', dateStr: 'Oct 15', price: 1720, isPeak: false, note: 'Lower rate' }
  ];

  // 3-Mandi Comparison for Farmer's Produce
  const mandiComparisons = language === 'mr-IN' ? [
    {
      name: 'पिंपळगाव बसवंत बाजार',
      dist: '२८ किमी',
      modalRate: record.forecast.expected,
      transportCost: 600,
      netCash: chosen.net_total,
      gain: chosen.gain_total,
      isBest: true,
      tag: 'सर्वात जास्त नफा 🌟'
    },
    {
      name: 'नाशिक बाजार समिती',
      dist: '१२ किमी (जवळ)',
      modalRate: baseline.modal_price,
      transportCost: 400,
      netCash: baseline.net_total,
      gain: 0,
      isBest: false,
      tag: 'स्थानिक बाजार'
    },
    {
      name: 'लासलगाव बाजार समिती',
      dist: '५२ किमी (दूर)',
      modalRate: 1850,
      transportCost: 1100,
      netCash: 34200,
      gain: 240,
      isBest: false,
      tag: 'गाडी भाडे जास्त'
    }
  ] : language === 'hi-IN' ? [
    {
      name: 'पिंपलगांव बसवंत मंडी',
      dist: '28 किमी',
      modalRate: record.forecast.expected,
      transportCost: 600,
      netCash: chosen.net_total,
      gain: chosen.gain_total,
      isBest: true,
      tag: 'सर्वाधिक मुनाफा 🌟'
    },
    {
      name: 'नासिक मंडी',
      dist: '12 किमी (पास)',
      modalRate: baseline.modal_price,
      transportCost: 400,
      netCash: baseline.net_total,
      gain: 0,
      isBest: false,
      tag: 'स्थानीय मंडी'
    },
    {
      name: 'लासलगांव मंडी',
      dist: '52 किमी (दूर)',
      modalRate: 1850,
      transportCost: 1100,
      netCash: 34200,
      gain: 240,
      isBest: false,
      tag: 'भाड़ा अधिक'
    }
  ] : [
    {
      name: 'Pimpalgaon Baswant APMC',
      dist: '28 km',
      modalRate: record.forecast.expected,
      transportCost: 600,
      netCash: chosen.net_total,
      gain: chosen.gain_total,
      isBest: true,
      tag: 'Highest Net Profit 🌟'
    },
    {
      name: 'Nashik APMC',
      dist: '12 km (Near)',
      modalRate: baseline.modal_price,
      transportCost: 400,
      netCash: baseline.net_total,
      gain: 0,
      isBest: false,
      tag: 'Local Mandi'
    },
    {
      name: 'Lasalgaon APMC',
      dist: '52 km (Far)',
      modalRate: 1850,
      transportCost: 1100,
      netCash: 34200,
      gain: 240,
      isBest: false,
      tag: 'High Freight'
    }
  ];

  const maxPriceIn7Days = Math.max(...forecastDays.map(d => d.price));

  // Audio voice text translated properly by language
  const spokenText = explanation.spoken_summary || (
    language === 'hi-IN'
      ? (isWait
          ? `${chosen.wait_days} दिन रुकें। अनुमानित शुद्ध लाभ ₹${chosen.net_total.toLocaleString('en-IN')} मिलेगा, जो आज बेचने से ₹${chosen.gain_total.toLocaleString('en-IN')} अधिक है। स्थानीय मंडी में ₹${chosen.reservation_price} प्रति क्विंटल से कम में माल न बेचें।`
          : `आज ही ${baseline.market} में माल बेचें। अनुमानित शुद्ध राशि ₹${baseline.net_total.toLocaleString('en-IN')} मिलेगी।`)
      : language === 'en-IN'
      ? (isWait
          ? `Wait ${chosen.wait_days} days. Estimated net cash is ₹${chosen.net_total.toLocaleString('en-IN')}, which is ₹${chosen.gain_total.toLocaleString('en-IN')} higher than selling today. Do not accept any bid below ₹${chosen.reservation_price} per quintal.`
          : `Sell today at ${baseline.market}. Estimated net realization is ₹${baseline.net_total.toLocaleString('en-IN')}.`)
      : (isWait
          ? `${chosen.wait_days} दिवस थांबा. अंदाजे निव्वळ नफा ₹${chosen.net_total.toLocaleString('en-IN')} मिळेल, जो आजपेक्षा ₹${chosen.gain_total.toLocaleString('en-IN')} जास्त आहे. स्थानिक बाजारात ₹${chosen.reservation_price} रुपयांपेक्षा कमी भावात माल विकू नका.`
          : `आजच ${baseline.market} येथे माल विका. अंदाजे निव्वळ रक्कम ₹${baseline.net_total.toLocaleString('en-IN')} मिळेल.`)
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
            {language === 'mr-IN'
              ? (isWait ? '🟢 योग्य निर्णय: थांबा' : isGo ? '🔵 योग्य निर्णय: दुसऱ्या बाजारात जा' : '🟡 योग्य निर्णय: आजच विका')
              : language === 'hi-IN'
              ? (isWait ? '🟢 सही निर्णय: रुकें' : isGo ? '🔵 सही निर्णय: दूसरी मंडी जाएं' : '🟡 सही निर्णय: आज ही बेचें')
              : (isWait ? '🟢 OPTIMAL DECISION: WAIT' : isGo ? '🔵 OPTIMAL DECISION: GO' : '🟡 OPTIMAL DECISION: SELL NOW')}
          </span>

          {/* Large Listen Button */}
          <button
            onClick={() => onPlayVoice(spokenText)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-black text-xs backdrop-blur-md border border-white/30 transition transform active:scale-95 shadow-xs"
            title="Listen in local language"
          >
            <Volume2 className="w-4 h-4 text-emerald-200 animate-pulse" />
            <span>{language === 'mr-IN' ? 'ऐका' : language === 'hi-IN' ? 'सुनें' : 'Listen'}</span>
          </button>
        </div>

        {/* Hero Title: Exactly what to do */}
        <div className="space-y-2 mb-6">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-serif text-white">
            {isWait
              ? (language === 'mr-IN'
                  ? `${chosen.wait_days} दिवस थांबा (${chosen.market})`
                  : language === 'hi-IN'
                  ? `${chosen.wait_days} दिन रुकें (${chosen.market})`
                  : `Wait ${chosen.wait_days} Days (${chosen.market})`)
              : isGo
              ? (language === 'mr-IN'
                  ? `${chosen.market} येथे माल विका`
                  : language === 'hi-IN'
                  ? `${chosen.market} में माल बेचें`
                  : `Sell at ${chosen.market}`)
              : (language === 'mr-IN'
                  ? `आजच ${baseline.market} येथे विका`
                  : language === 'hi-IN'
                  ? `आज ही ${baseline.market} में बेचें`
                  : `Sell Today at ${baseline.market}`)}
          </h1>
          <p className="text-sm sm:text-base text-emerald-100 font-medium">
            {lot_quantity_qtl} {language === 'en-IN' ? 'qtl' : 'क्विंटल'} {commodity} • {chosen.market}
          </p>
        </div>

        {/* 3 Large Golden Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 border-t border-white/20">
          {/* Card 1: Expected In-Hand Cash */}
          <div className="bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-200 block">
              {language === 'mr-IN' ? 'हातात मिळणारा निव्वळ नफा' : language === 'hi-IN' ? 'हाथ में मिलने वाला शुद्ध लाभ' : 'Net In-Hand Realization'}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              ₹{chosen.net_total.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-emerald-200 font-semibold block mt-1">
              {language === 'mr-IN' ? 'गाडी भाडे व नासाडी वजा करून' : language === 'hi-IN' ? 'भाड़ा और खराबी घटाकर' : 'After freight & perishability'}
            </span>
          </div>

          {/* Card 2: Extra Gain vs Today */}
          <div className="bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-200 block">
              {language === 'mr-IN' ? 'आज विकण्यापेक्षा जादा फायदा' : language === 'hi-IN' ? 'आज बेचने से अधिक फायदा' : 'Extra Gain vs Today'}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-green-300 mt-1">
              {chosen.gain_total > 0
                ? `+₹${chosen.gain_total.toLocaleString('en-IN')}`
                : (language === 'mr-IN' ? '₹० आधार भाव' : language === 'hi-IN' ? '₹0 आधार भाव' : '₹0 baseline')}
            </div>
            <span className="text-[11px] text-emerald-200 font-semibold block mt-1">
              {language === 'mr-IN' ? 'आज विकल्यास:' : language === 'hi-IN' ? 'आज बेचने पर:' : 'Selling today:'} ₹{baseline.net_total.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Card 3: Minimum Reservation Price */}
          <div className="bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-200 block">
              {language === 'mr-IN' ? 'किमान आरक्षण भाव (कमी नको)' : language === 'hi-IN' ? 'न्यूनतम आरक्षण भाव (कम न लें)' : 'Reservation Floor Price'}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-300 mt-1">
              ₹{chosen.reservation_price.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-amber-200 font-semibold block mt-1">
              {language === 'mr-IN' ? 'प्रति क्विंटल किमान बोली' : language === 'hi-IN' ? 'प्रति क्विंटल न्यूनतम बोली' : 'Minimum bid per quintal'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. VISUAL METRIC 1: 7-Day Price Stepper Trend Chart */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <span>
                {language === 'mr-IN'
                  ? 'पुढील ७ दिवसांत भाव कसा चढ-उतार होणार आहे?'
                  : language === 'hi-IN'
                  ? 'अगले 7 दिनों में भाव कैसे बदलेंगे?'
                  : '7-Day Price Trajectory & Best Day to Sell'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {language === 'mr-IN'
                ? 'सर्वात उंच हिरवा खांब सर्वोच्च भाव दर्शवतो (Day 2 वर सुवर्ण तारा 🌟 पहा)'
                : language === 'hi-IN'
                ? 'सबसे ऊंचा हरा खंभा सर्वोत्तम भाव दर्शाता है (Day 2 पर 🌟 देखें)'
                : 'Tallest green bar indicates peak price (Look for 🌟 on Day 2)'}
            </p>
          </div>
          <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
            {language === 'mr-IN'
              ? `परवा सर्वोच्च भाव: ₹${record.forecast.expected}/क्विंटल`
              : language === 'hi-IN'
              ? `परसों सर्वोच्च भाव: ₹${record.forecast.expected}/क्विंटल`
              : `Peak in 2 Days: ₹${record.forecast.expected}/qtl`}
          </span>
        </div>

        {/* 7-Day Vertical Bar Stepper */}
        <div className="pt-4 pb-2">
          <div className="grid grid-cols-7 gap-2 items-end h-44 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {forecastDays.map((f, idx) => {
              const heightPct = Math.round((f.price / maxPriceIn7Days) * 100);
              return (
                <div key={idx} className="flex flex-col items-center h-full justify-end group">
                  {/* Price Tag above bar */}
                  <span className={`text-[10px] sm:text-xs font-black mb-1 ${
                    f.isPeak ? 'text-emerald-700 scale-105' : 'text-slate-600'
                  }`}>
                    ₹{f.price}
                  </span>

                  {/* Vertical Bar */}
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full max-w-[38px] rounded-t-xl transition-all duration-300 flex items-start justify-center pt-1 ${
                      f.isPeak
                        ? 'bg-gradient-to-t from-emerald-600 to-green-500 shadow-md ring-2 ring-emerald-400'
                        : idx === 0
                        ? 'bg-slate-300'
                        : 'bg-emerald-200 hover:bg-emerald-300'
                    }`}
                  >
                    {f.isPeak && <span className="text-xs text-white">⭐</span>}
                  </div>

                  {/* Day Label below bar */}
                  <span className={`text-[10px] sm:text-[11px] font-bold mt-2 text-center line-clamp-1 ${
                    f.isPeak ? 'text-emerald-950 font-black' : 'text-slate-600'
                  }`}>
                    {f.dayName.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs text-slate-800 flex items-center gap-2">
          <span className="text-base">💡</span>
          <span>
            {language === 'mr-IN' ? (
              <><strong>शेतकऱ्यांसाठी निष्कर्ष:</strong> आज भाव ₹{baseline.modal_price} आहे. परवा भाव ₹{record.forecast.expected} पर्यंत वाढेल, त्यानंतर आवक वाढल्याने भाव पुन्हा घसरण्याची शक्यता आहे. म्हणूनच <strong>२ दिवस थांबणे सर्वात फायद्याचे आहे!</strong></>
            ) : language === 'hi-IN' ? (
              <><strong>किसान भाइयों के लिए निष्कर्ष:</strong> आज भाव ₹{baseline.modal_price} है। परसों भाव ₹{record.forecast.expected} तक बढ़ेगा, उसके बाद आवक बढ़ने से भाव फिर गिर सकते हैं। इसलिए <strong>2 दिन रुकना सबसे फायदेमंद है!</strong></>
            ) : (
              <><strong>Farmer Takeaway:</strong> Today's rate is ₹{baseline.modal_price}. In 2 days, price peaks at ₹{record.forecast.expected} before arrivals surge and drive prices down. <strong>Waiting 2 days yields maximum net realization!</strong></>
            )}
          </span>
        </div>
      </div>

      {/* 4. VISUAL METRIC 2: 3-Mandi Side-by-Side Comparison */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <span>
              {language === 'mr-IN'
                ? 'जवळच्या बाजार समित्यांची थेट तुलना (कोणत्या बाजारात जास्त नफा?)'
                : language === 'hi-IN'
                ? 'निकटतम मंडियों की सीधी तुलना (किस मंडी में ज्यादा मुनाफा?)'
                : 'Regional APMC Side-by-Side Comparison'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {language === 'mr-IN'
              ? `तुमच्या ${lot_quantity_qtl} क्विंटल ${commodity} मालासाठी गाडी भाडे वजा जाता हातात पडणारी रक्कम`
              : language === 'hi-IN'
              ? `आपके ${lot_quantity_qtl} क्विंटल ${commodity} के लिए भाड़ा घटाकर शुद्ध हाथ में मिलने वाली रकम`
              : `Net pocket cash for your ${lot_quantity_qtl} qtl ${commodity} after deducting freight`}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {mandiComparisons.map((m, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition relative flex flex-col justify-between space-y-3 ${
                m.isBest
                  ? 'bg-emerald-50/90 border-emerald-600 ring-2 ring-emerald-600/30 shadow-md'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  m.isBest ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'
                }`}>
                  {m.tag}
                </span>
                <h3 className="text-sm font-black text-slate-900 mt-2">
                  {m.name}
                </h3>
                <span className="text-xs text-slate-500 font-medium block mt-0.5">
                  {language === 'mr-IN'
                    ? `अंतर: ${m.dist} • गाडी भाडे: ₹${m.transportCost}`
                    : language === 'hi-IN'
                    ? `दूरी: ${m.dist} • वाहन भाड़ा: ₹${m.transportCost}`
                    : `Dist: ${m.dist} • Freight: ₹${m.transportCost}`}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">{language === 'mr-IN' ? 'बाजार भाव:' : language === 'hi-IN' ? 'मंडी भाव:' : 'Mandi Rate:'}</span>
                  <span className="font-bold text-slate-900">₹{m.modalRate} {language === 'en-IN' ? '/qtl' : '/क्विं'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-black text-emerald-950">{language === 'mr-IN' ? 'हातात नफा:' : language === 'hi-IN' ? 'हाथ में मुनाफा:' : 'Net Pocket Cash:'}</span>
                  <span className="font-black text-base text-emerald-700">
                    ₹{m.netCash.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Plain Farmer Reasons */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-sm space-y-4">
        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>
            {language === 'mr-IN'
              ? 'हा निर्णय का योग्य आहे? (महत्त्वाची कारणे)'
              : language === 'hi-IN'
              ? 'यह निर्णय क्यों सही है? (प्रमुख कारण)'
              : 'Why this decision is optimal (Key Explanations)'}
          </span>
        </h2>

        <div className="space-y-3 text-xs sm:text-sm text-slate-700">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-xl">📈</span>
            <div>
              <strong className="text-emerald-950 font-black block">
                {language === 'mr-IN' ? 'भाव वाढण्याची दाट शक्यता' : language === 'hi-IN' ? 'भाव बढ़ने की प्रबल संभावना' : 'High Probability of Price Rise'}
              </strong>
              <span>
                {language === 'mr-IN'
                  ? `${chosen.market} मध्ये २ दिवसांनंतर आवक संतुलित राहून भाव ₹${chosen.reservation_price} पेक्षा जास्त मिळण्याची ${Math.round(chosen.probability_beat_baseline * 100)}% शक्यता आहे.`
                  : language === 'hi-IN'
                  ? `${chosen.market} में 2 दिन बाद आवक संतुलित रहने से भाव ₹${chosen.reservation_price} से अधिक मिलने की ${Math.round(chosen.probability_beat_baseline * 100)}% संभावना है।`
                  : `In ${chosen.market}, arrivals remain balanced in 2 days with a ${Math.round(chosen.probability_beat_baseline * 100)}% probability of beating baseline price.`}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200">
            <span className="text-xl">🚚</span>
            <div>
              <strong className="text-blue-950 font-black block">
                {language === 'mr-IN' ? 'खर्च व वजन घट वजा जाता नफा' : language === 'hi-IN' ? 'भाड़ा व वजन घट के बाद भी अधिक बचत' : 'Net Profit Even After Deductions'}
              </strong>
              <span>
                {language === 'mr-IN'
                  ? `गाडी भाडे (₹${Math.round(chosen.cost_breakdown.transport).toLocaleString('en-IN')}), हमाली (₹${Math.round(chosen.cost_breakdown.hamali_tolai).toLocaleString('en-IN')}) आणि २% साठवणूक घट वजा जाता तुम्हाला +₹${chosen.gain_total.toLocaleString('en-IN')} जास्त मिळतील.`
                  : language === 'hi-IN'
                  ? `गाड़ी भाड़ा (₹${Math.round(chosen.cost_breakdown.transport).toLocaleString('en-IN')}), हमाली (₹${Math.round(chosen.cost_breakdown.hamali_tolai).toLocaleString('en-IN')}) और 2% भंडारण घट के बाद भी आपको +₹${chosen.gain_total.toLocaleString('en-IN')} अधिक मिलेंगे।`
                  : `After freight (₹${Math.round(chosen.cost_breakdown.transport).toLocaleString('en-IN')}), hamali (₹${Math.round(chosen.cost_breakdown.hamali_tolai).toLocaleString('en-IN')}), and 2% holding loss, you still net +₹${chosen.gain_total.toLocaleString('en-IN')} extra.`}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
            <span className="text-xl">🛑</span>
            <div>
              <strong className="text-amber-950 font-black block">
                {language === 'mr-IN' ? 'गावातील व्यापाऱ्यासाठी इशारा' : language === 'hi-IN' ? 'गांव के व्यापारी हेतु चेतावनी' : 'Farmgate Buyer Protection Floor'}
              </strong>
              <span>
                {language === 'mr-IN'
                  ? `स्थानिक गावात कोणी व्यापारी माल मागत असेल तर ₹${chosen.reservation_price} / क्विंटल पेक्षा कमी भावाने अजिबात विकू नका!`
                  : language === 'hi-IN'
                  ? `स्थानीय गांव में कोई व्यापारी माल मांगे तो ₹${chosen.reservation_price} प्रति क्विंटल से कम में बिल्कुल न बेचें!`
                  : `If a local buyer visits your farm, strictly reject any offer below ₹${chosen.reservation_price}/qtl reservation floor!`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Navigation Buttons: Go to Pocket Calculator */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          onClick={() => onOpenCosts ? onOpenCosts() : onOpenScenarios && onOpenScenarios()}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm shadow-md shadow-emerald-700/20 transition active:scale-95"
        >
          <Receipt className="w-4 h-4 text-emerald-200" />
          <span>
            {language === 'mr-IN'
              ? 'साधा हिशोब व पावती पहा (Pocket Calculator) ➔'
              : language === 'hi-IN'
              ? 'सीधा हिसाब व रसीद देखें (Pocket Calculator) ➔'
              : 'View Itemized Pocket Calculator (Receipt) ➔'}
          </span>
        </button>
      </div>
    </div>
  );
};
