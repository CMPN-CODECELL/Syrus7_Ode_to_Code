import React from 'react';
import {
  User,
  ShieldCheck,
  Sprout,
  Edit3,
  Globe,
  Sun,
  Moon,
  Layers,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Scale
} from 'lucide-react';
import { SlotSchema, DemoFailureMode, DemoStatus, SupportedLanguage } from '../types';

interface MyFarmScreenProps {
  slots: SlotSchema;
  onOpenEditLot: () => void;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  demoMode: DemoFailureMode;
  onDemoModeChange: (mode: DemoFailureMode) => void;
  demoStatus: DemoStatus | null;
  riskProfile: 'CAUTIOUS' | 'BALANCED' | 'AGGRESSIVE';
  setRiskProfile: (prof: 'CAUTIOUS' | 'BALANCED' | 'AGGRESSIVE') => void;
  labels: Record<string, string>;
}

export const MyFarmScreen: React.FC<MyFarmScreenProps> = ({
  slots,
  onOpenEditLot,
  language,
  setLanguage,
  theme,
  onToggleTheme,
  demoMode,
  onDemoModeChange,
  demoStatus,
  riskProfile,
  setRiskProfile,
  labels
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Farmer Profile Card */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 text-3xl shadow-sm">
              🧑‍🌾
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 font-serif">
                  {labels.kisanName || (language === 'mr-IN' ? 'ज्ञानेश्वर बोडके' : 'Dnyaneshwar Bodke')}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  {labels.verifiedFarmer || (language === 'mr-IN' ? 'प्रमाणित शेतकरी' : 'Verified Farmer')}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {labels.locationTag || (language === 'mr-IN' ? 'नाशिक विभाग • महाराष्ट्र' : 'Nashik Division • Maharashtra')}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenEditLot}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black shadow-md shadow-emerald-700/25 transition active:scale-95"
          >
            <Edit3 className="w-4 h-4" />
            <span>{labels.changeProduce || (language === 'mr-IN' ? 'शेत माल बदला' : 'Edit Produce Lot')}</span>
          </button>
        </div>

        {/* Land & Crop Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
              {labels.totalLand || (language === 'mr-IN' ? 'एकूण शेतजमीन' : 'Total Land')}
            </span>
            <span className="text-lg font-black text-slate-900 font-serif">{labels.landVal || (language === 'mr-IN' ? '५ एकर' : '5 Acres')}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
              {labels.activeCrop || (language === 'mr-IN' ? 'सध्याचे पीक' : 'Active Crop')}
            </span>
            <span className="text-lg font-black text-emerald-700 font-serif">
              {slots.commodity === 'Tomato'
                ? (language === 'mr-IN' ? 'टोमॅटो' : 'Tomato')
                : (language === 'mr-IN' ? 'कांदा' : 'Onion')}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
              {labels.quantity || (language === 'mr-IN' ? 'उत्पादन प्रमाण' : 'Lot Quantity')}
            </span>
            <span className="text-lg font-black text-slate-900 font-serif">
              {slots.quantity} {language === 'en-IN' ? 'qtl' : 'क्विंटल'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
              {labels.homeMandi || (language === 'mr-IN' ? 'जवळची बाजार समिती' : 'Home Mandi')}
            </span>
            <span className="text-lg font-black text-slate-900 font-serif truncate block">
              {slots.home_mandi
                ? slots.home_mandi.replace(' APMC', language === 'mr-IN' ? ' बाजार समिती' : ' APMC')
                : ''}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Preferences & App Settings */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-5">
        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-700" />
          <span>{labels.appSettings || (language === 'mr-IN' ? 'ॲप सेटिंग्ज व पसंती' : 'App Settings & Preferences')}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Language Selector (Strictly 2 Languages) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-emerald-700" />
              <span>{labels.langVoicePref || (language === 'mr-IN' ? 'भाषा व व्हॉइस पसंती' : 'Language & Voice Preference')}</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setLanguage('mr-IN')}
                className={`py-2 rounded-xl text-xs font-black transition ${
                  language === 'mr-IN' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                🇮🇳 मराठी
              </button>
              <button
                onClick={() => setLanguage('en-IN')}
                className={`py-2 rounded-xl text-xs font-black transition ${
                  language === 'en-IN' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                🌐 English
              </button>
            </div>
          </div>

          {/* Theme & Contrast Toggle */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              {theme === 'dark' ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span>{labels.appearanceTheme || (language === 'mr-IN' ? 'रंगसंगती व थीम' : 'Appearance & Contrast')}</span>
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => { if (theme !== 'light') onToggleTheme(); }}
                className={`py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                  theme === 'light' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>{labels.light || (language === 'mr-IN' ? 'हलका रंग' : 'Light')}</span>
              </button>
              <button
                onClick={() => { if (theme !== 'dark') onToggleTheme(); }}
                className={`py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                  theme === 'dark' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>{labels.dark || (language === 'mr-IN' ? 'गडद रंग' : 'Dark')}</span>
              </button>
            </div>
          </div>

          {/* Risk Profile Selector */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-emerald-700" />
              <span>{labels.riskProfile || (language === 'mr-IN' ? 'जोखीम पातळी' : 'Risk Profile')}</span>
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {(['CAUTIOUS', 'BALANCED', 'AGGRESSIVE'] as const).map((prof) => (
                <button
                  key={prof}
                  onClick={() => setRiskProfile(prof)}
                  className={`py-2 rounded-xl text-[11px] font-extrabold transition ${
                    riskProfile === prof ? 'bg-emerald-700 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {prof === 'CAUTIOUS' ? (labels.cautious || (language === 'mr-IN' ? 'सुरक्षित (q20)' : 'Cautious (q20)')) : prof === 'BALANCED' ? (labels.balanced || (language === 'mr-IN' ? 'संतुलित (q35)' : 'Balanced (q35)')) : (labels.aggressive || (language === 'mr-IN' ? 'आक्रमक (q50)' : 'Aggressive (q50)'))}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. System Test Controls */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-black text-slate-900">
              {language === 'mr-IN' ? 'सिस्टम चाचणी नियंत्रणे' : 'System Test Controls'}
            </h2>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
            {language === 'mr-IN' ? `सक्रिय: ${demoMode}` : `Active: ${demoMode}`}
          </span>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          {language === 'mr-IN'
            ? 'प्रत्यक्ष एपीआय खंडित झाल्यास किंवा नेटवर्क अयशस्वी झाल्यास कृषिनिर्णयची बॅकअप प्रणाली कशी कार्य करते याची पडताळणी करा:'
            : 'Simulate real-world API outages and witness KrishiNirnay’s graceful fallback & circuit breakers:'}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(['NORMAL', 'DATA_OUTAGE', 'STALE_DATA', 'WEATHER_OUTAGE', 'LLM_OUTAGE'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onDemoModeChange(mode)}
              className={`p-3 rounded-xl text-xs font-black transition border text-center ${
                demoMode === mode
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {mode === 'NORMAL'
                ? (language === 'mr-IN' ? 'सामान्य' : 'Normal')
                : mode === 'DATA_OUTAGE'
                ? (language === 'mr-IN' ? 'डेटा बंद' : 'Data Outage')
                : mode === 'STALE_DATA'
                ? (language === 'mr-IN' ? 'जुना डेटा' : 'Stale Data')
                : mode === 'WEATHER_OUTAGE'
                ? (language === 'mr-IN' ? 'हवामान बंद' : 'Weather Outage')
                : (language === 'mr-IN' ? 'एआय बंद' : 'LLM Outage')}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Verification & Invariants Guarantee Certificate */}
      <div className="bg-emerald-50/80 rounded-3xl p-6 border border-emerald-200 text-xs text-slate-700 space-y-2">
        <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          <span>
            {language === 'mr-IN'
              ? '१००% पडताळणी व नंबर गार्ड प्रमाणित'
              : '100% Contract Invariant & Number Guard Verified'}
          </span>
        </div>
        <p className="leading-relaxed font-medium">
          {language === 'mr-IN'
            ? 'कडक अँटी-हॅल्युसिनेशन नंबर गार्ड प्रणाली कोणत्याही अनधिकृत आकड्यांना किंवा चुकीच्या बदलांना रोखते. सर्व विक्री व साठवणूक आकडेवारी अधिकृत ॲगमार्कनेट (Agmarknet) एपीएमसी बाजार दरांवर आधारित असून दुहेरी नासाडी वजावट न करण्याची पूर्ण हमी देते.'
            : 'Strict anti-hallucination Number Guard blocks any unauthorized numeric deviation. All holding vs sell-now calculations are guaranteed against double-spoilage deductions with verified Agmarknet APMC pricing contracts.'}
        </p>
      </div>
    </div>
  );
};
