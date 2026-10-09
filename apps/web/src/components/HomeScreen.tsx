import React, { useState } from 'react';
import {
  Sprout,
  Calendar,
  TrendingUp,
  Sliders,
  Sun,
  ShieldCheck,
  Search,
  Mic,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  MapPin,
  Clock,
  Layers,
  HelpCircle
} from 'lucide-react';
import { DecisionRecord, SlotSchema } from '../types';

interface HomeScreenProps {
  record: DecisionRecord | null;
  slots: SlotSchema;
  onNavigateTab: (tabId: string) => void;
  onOpenVoice: () => void;
  onOpenEditLot: () => void;
  onSelectCropPreset: (crop: string, mandi: string, qty: number) => void;
  labels: Record<string, string>;
  language: 'mr-IN' | 'hi-IN' | 'en-IN';
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  record,
  slots,
  onNavigateTab,
  onOpenVoice,
  onOpenEditLot,
  onSelectCropPreset,
  labels,
  language
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const crops = [
    {
      name: 'Tomato',
      label: language === 'mr-IN' ? 'टोमॅटो' : language === 'hi-IN' ? 'टमाटर' : 'Tomato',
      variety: language === 'mr-IN' ? 'भाजीपाला पीक' : language === 'hi-IN' ? 'सब्जी फसल' : 'Vegetable Crop',
      mandi: 'Nashik APMC',
      defaultQty: 20,
      active: (slots.commodity || '').toLowerCase().includes('tomato'),
      image: '🍅',
      tag: language === 'mr-IN' ? 'सक्रिय लॉट' : language === 'hi-IN' ? 'सक्रिय लॉट' : 'Active Lot',
      tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    },
    {
      name: 'Onion',
      label: language === 'mr-IN' ? 'कांदा' : language === 'hi-IN' ? 'प्याज' : 'Onion',
      variety: language === 'mr-IN' ? 'रब्बी कांदा' : language === 'hi-IN' ? 'रबी प्याज' : 'Rabi Red',
      mandi: 'Lasalgaon APMC',
      defaultQty: 30,
      active: (slots.commodity || '').toLowerCase().includes('onion'),
      image: '🧅',
      tag: language === 'mr-IN' ? 'आशियातील सर्वात मोठी मंडी' : language === 'hi-IN' ? 'एशिया की सबसे बड़ी मंडी' : 'Asia’s Largest Mandi',
      tagColor: 'bg-amber-100 text-amber-800 border-amber-300'
    },
    {
      name: 'Wheat',
      label: language === 'mr-IN' ? 'गहू' : language === 'hi-IN' ? 'गेहूं' : 'Wheat',
      variety: language === 'mr-IN' ? 'शरबती धान्य' : language === 'hi-IN' ? 'शरबती अनाज' : 'Sharbati Grain',
      mandi: 'Daund Mandi',
      defaultQty: 25,
      active: (slots.commodity || '').toLowerCase().includes('wheat'),
      image: '🌾',
      tag: language === 'mr-IN' ? 'दीर्घ साठवणूक' : language === 'hi-IN' ? 'दीर्घ भंडारण' : 'Long Storage',
      tagColor: 'bg-blue-100 text-blue-800 border-blue-300'
    },
    {
      name: 'Soybean',
      label: language === 'mr-IN' ? 'सोयाबीन' : language === 'hi-IN' ? 'सोयाबीन' : 'Soybean',
      variety: language === 'mr-IN' ? 'पिवळे सोयाबीन' : language === 'hi-IN' ? 'पीला सोयाबीन' : 'Yellow Grade-A',
      mandi: 'Latur APMC',
      defaultQty: 15,
      active: (slots.commodity || '').toLowerCase().includes('soybean'),
      image: '🌱',
      tag: language === 'mr-IN' ? 'तेलबिया दर' : language === 'hi-IN' ? 'तिलहन भाव' : 'Oilseed Benchmark',
      tagColor: 'bg-purple-100 text-purple-800 border-purple-300'
    }
  ];

  const quickActions = [
    {
      id: 'decision',
      title: labels.decision || 'Market Decision',
      desc: language === 'mr-IN' ? 'आज विकावे की थांबावे?' : language === 'hi-IN' ? 'आज बेचें या रुकें?' : 'Sell Now vs Hold Decision',
      icon: Sprout,
      bg: 'bg-emerald-500 text-white',
      border: 'border-emerald-200 hover:border-emerald-400'
    },
    {
      id: 'heatmap',
      title: labels.heatmap || '3×7 Heatmap',
      desc: language === 'mr-IN' ? '३ दिवस व ७ बाजार समित्या' : language === 'hi-IN' ? '३ दिन व ७ प्रमुख मंडियां' : '3 Days × 7 Regional Mandis',
      icon: Calendar,
      bg: 'bg-teal-600 text-white',
      border: 'border-teal-200 hover:border-teal-400'
    },
    {
      id: 'forecast',
      title: labels.forecast || 'Price Forecast',
      desc: language === 'mr-IN' ? 'किंमत अंदाज व आलेख' : language === 'hi-IN' ? 'मूल्य पूर्वानुमान व रुझान' : 'Quantile Machine Learning',
      icon: TrendingUp,
      bg: 'bg-blue-600 text-white',
      border: 'border-blue-200 hover:border-blue-400'
    },
    {
      id: 'scenarios',
      title: labels.scenarios || 'What-If Simulator',
      desc: language === 'mr-IN' ? 'डिझेल व नासाडी ताण चाचणी' : language === 'hi-IN' ? 'डीजल व खराबी तनाव जांच' : '1-Click Stress Test Presets',
      icon: Sliders,
      bg: 'bg-indigo-600 text-white',
      border: 'border-indigo-200 hover:border-indigo-400'
    }
  ];

  const isWait = record?.chosen.action === 'WAIT';

  return (
    <div className="space-y-6">
      {/* 1. Farmer Greeting & Search / Voice Bar (Screen 2 Mockup Style) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-emerald-700/20">
              🌾
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 font-serif">
                  {labels.goodMorning || 'Good Morning, Kisan Friend! 🌾'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  {labels.verifiedFarmer || 'Verified'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {labels.farmerSubtitle || 'Healthy crops, prosperous farmers • Maximizing net realization'}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenEditLot}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold transition shadow-2xs"
          >
            <Sprout className="w-4 h-4 text-emerald-700" />
            <span>{slots.quantity} {slots.quantity_unit} {slots.commodity} • {slots.home_mandi}</span>
            <span className="text-emerald-700 underline ml-1">{labels.changeProduce || 'Edit'}</span>
          </button>
        </div>

        {/* Search & Voice Bar */}
        <div className="relative flex items-center">
          <div className="absolute left-4 text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={labels.searchPlaceholder || 'Search mandi, commodity, prices or speak...'}
            className="w-full pl-11 pr-24 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
          <button
            onClick={onOpenVoice}
            className="absolute right-2 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95"
            title="Speak with Krishi Mitra Voice Assistant"
          >
            <Mic className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">{labels.speak || 'Speak'}</span>
          </button>
        </div>
      </div>

      {/* 2. Today's Weather & Mandi Status Banner (From AgriCare Mockup) */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-7 text-white bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-700 shadow-lg shadow-emerald-950/10">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 blur-2xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold text-emerald-100">
              <Sun className="w-3.5 h-3.5 text-amber-300" />
              <span>{labels.todaysWeather || "Today's Weather & Mandi Status"}</span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black font-serif">28°C</span>
              <span className="text-sm sm:text-base font-bold text-emerald-100">
                {labels.sunnyClear || 'Sunny • Clear Sky'}
              </span>
            </div>

            <p className="text-xs text-emerald-200 font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-300" />
              <span>{slots.home_mandi || 'Nashik APMC'} • {labels.activeTrading || 'Active Trading'}</span>
              <span className="bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                {labels.verified || '100% Verified'}
              </span>
            </p>
          </div>

          {/* Quick Decision Snapshot on Banner */}
          {record && (
            <div className="bg-black/25 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/20 flex flex-col justify-between space-y-2 min-w-[220px]">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-200">
                {labels.expectedNet || 'Expected Net Realization'}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white">
                ₹{record.chosen.net_total.toLocaleString('en-IN')}
              </div>
              <div className="flex items-center justify-between text-xs text-emerald-100 pt-1 border-t border-white/10">
                <span>{record.chosen.gain_total > 0 ? `+₹${record.chosen.gain_total.toLocaleString('en-IN')}` : '₹0'}</span>
                <span className="font-extrabold text-emerald-300">
                  {Math.round(record.chosen.probability_beat_baseline * 100)}% {labels.winProbability || 'Win Prob'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. 4 Main Quick Action Buttons (Matching Mockup Screen 2 Grid) */}
      <div className="space-y-3">
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
          {labels.quickActions || 'Quick Action Features'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => onNavigateTab(action.id)}
                className={`p-4 rounded-2xl bg-white border ${action.border} shadow-xs hover:shadow-md transition text-left space-y-2.5 group`}
              >
                <div className={`w-11 h-11 rounded-2xl ${action.bg} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-700 transition">
                    {action.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                    {action.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Active Recommendation Spotlight Card */}
      {record && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping"></span>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                {labels.decision || 'Optimal Recommendation'}
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('decision')}
              className="text-xs font-extrabold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 transition"
            >
              <span>{labels.viewDecision || 'View Full Decision'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
            {/* Step 1 Pill */}
            <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black text-base flex items-center justify-center flex-shrink-0 shadow-xs">
                1
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 block">
                  {labels.step1Title || 'Step 1: Action'}
                </span>
                <p className="text-sm font-black text-emerald-950">
                  {isWait
                    ? (labels.step1Wait ? labels.step1Wait.replace('{days}', String(record.chosen.wait_days)) : `Wait ${record.chosen.wait_days} Days`)
                    : `${labels.sellNow || 'Sell Today'} (${record.baseline.market})`}
                </p>
              </div>
            </div>

            {/* Step 2 Pill */}
            <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-black text-base flex items-center justify-center flex-shrink-0 shadow-xs">
                2
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 block">
                  {labels.step2Title || 'Step 2: Net In-Hand'}
                </span>
                <p className="text-sm font-black text-emerald-950">
                  ₹{record.chosen.net_total.toLocaleString('en-IN')}
                  {record.chosen.gain_total > 0 && (
                    <span className="text-xs font-black text-emerald-700 ml-1.5">
                      (+₹{record.chosen.gain_total.toLocaleString('en-IN')})
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Step 3 Pill */}
            <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white font-black text-base flex items-center justify-center flex-shrink-0 shadow-xs">
                3
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 block">
                  {labels.step3Title || 'Step 3: Reservation Price'}
                </span>
                <p className="text-sm font-black text-amber-950">
                  ₹{record.chosen.reservation_price.toLocaleString('en-IN')} {labels.step3Unit || '/ qtl'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. My Produce & Crops Cards (Matching Screen 2 & Screen 10 in Mockup) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
            {labels.myCrops || 'My Produce & Crops'}
          </h2>
          <span className="text-xs font-bold text-slate-500">
            {language === 'mr-IN' ? 'लॉट निवडण्यासाठी टॅप करा' : language === 'hi-IN' ? 'लॉट चुनने हेतु टैप करें' : 'Tap to switch active lot'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {crops.map((crop) => (
            <div
              key={crop.name}
              onClick={() => onSelectCropPreset(crop.name, crop.mandi, crop.defaultQty)}
              className={`p-4 rounded-2xl bg-white border cursor-pointer transition shadow-xs hover:shadow-md ${
                crop.active
                  ? 'border-emerald-600 ring-2 ring-emerald-600/20'
                  : 'border-slate-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">{crop.image}</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${crop.tagColor}`}>
                  {crop.tag}
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900">
                {crop.label}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {crop.variety}
              </p>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-bold">{crop.defaultQty} qtl</span>
                <span className="text-emerald-700 font-extrabold">{crop.mandi}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
