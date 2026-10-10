import React, { useState } from 'react';
import {
  Sliders,
  Shield,
  AlertTriangle,
  CloudRain,
  Cpu,
  Radio,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Info
} from 'lucide-react';
import { DemoFailureMode, DemoStatus, SupportedLanguage } from '../types';

interface Props {
  currentMode: DemoFailureMode;
  onModeChange: (mode: DemoFailureMode) => void;
  demoStatus?: DemoStatus | null;
  language?: SupportedLanguage;
}

export const DemoSwitchBar: React.FC<Props> = ({
  currentMode,
  onModeChange,
  demoStatus,
  language = 'en-IN'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const modes: {
    id: DemoFailureMode;
    labelEn: string;
    labelMr: string;
    descEn: string;
    descMr: string;
    icon: any;
    color: string;
  }[] = [
    {
      id: 'NORMAL',
      labelEn: 'Normal (Live / Verified)',
      labelMr: 'सामान्य थेट प्रमाणित प्रणाली',
      descEn: 'Connected to verified live mandi data and production pipeline.',
      descMr: 'थेट सत्यापित बाजार माहिती व प्रमाणित निर्णय प्रणाली कार्यरत.',
      icon: Shield,
      color: 'text-emerald-400'
    },
    {
      id: 'DATA_OUTAGE',
      labelEn: 'Market Data Outage',
      labelMr: 'बाजार माहिती खंडित',
      descEn: 'Simulates data.gov.in upstream timeout. Downstream engine switches to verified historical snapshot.',
      descMr: 'सरकारी बाजार सर्व्हर खंडित; प्रणाली आपोआप सुरक्षित ऐतिहासिक पर्यायावर वर्ग होते.',
      icon: Radio,
      color: 'text-amber-400'
    },
    {
      id: 'STALE_DATA',
      labelEn: 'Stale Data (3+ Sessions)',
      labelMr: 'कालबाह्य जुनी माहिती (३+ सत्रे)',
      descEn: 'Simulates >48h stale market observation. Decision policy triggers safety override to SELL NOW.',
      descMr: '४८ तासांपेक्षा जुना भाव आढळल्यास सुरक्षिततेसाठी थांबण्याचा सल्ला रोखून आजच विक्रीचा आदेश दिला जातो.',
      icon: AlertTriangle,
      color: 'text-rose-400'
    },
    {
      id: 'WEATHER_OUTAGE',
      labelEn: 'Weather API Outage',
      labelMr: 'हवामान सेवा खंडित',
      descEn: 'Simulates Open-Meteo downtime. Degrades gracefully to regional climatology without hallucinating rain.',
      descMr: 'हवामान उपग्रह खंडित; खोटी माहिती न देता प्रादेशिक सरासरी जोखीम पातळी वापरली जाते.',
      icon: CloudRain,
      color: 'text-blue-400'
    },
    {
      id: 'LLM_OUTAGE',
      labelEn: 'LLM Outage (Deterministic Fallback)',
      labelMr: 'एआय सेवा खंडित (नियमबद्ध पावती)',
      descEn: 'Simulates LLM API outage. Assistant switches 100% to verified deterministic rule templates.',
      descMr: 'एआय क्लाउड खंडित; सहाय्यक शून्य चुकांसह थेट गणितीय सूत्रे व पावती सादर करतो.',
      icon: Cpu,
      color: 'text-purple-400'
    }
  ];

  const activeModeObj = modes.find((m) => m.id === currentMode) || modes[0];

  return (
    <div className="w-full bg-slate-900 text-white text-xs py-2 px-4 z-40 border-b border-slate-800 transition-all select-none">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black border border-slate-700 transition"
            title="Toggle System Test Controls & Resilience Simulation"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {language === 'mr-IN' ? 'सिस्टम चाचणी नियंत्रणे:' : 'System Test Controls:'}
            </span>
            <span className="font-mono text-emerald-300 font-extrabold ml-0.5">
              {currentMode}
            </span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
          </button>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            {language === 'mr-IN'
              ? '(प्रणालीची लवचिकता व पर्यायी मार्गांची चाचणी)'
              : '(Evaluator resilience stress testing & graceful fallback verification)'}
          </span>
        </div>

        {/* Live Service Health Indicators */}
        <div className="flex items-center gap-3 text-[11px] text-slate-300 font-medium">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${demoStatus?.gemini_healthy ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            Gemini
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${demoStatus?.groq_healthy ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            Groq
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${demoStatus?.market_api_healthy ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            Market API
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${demoStatus?.weather_api_healthy ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            Weather
          </span>
        </div>
      </div>

      {/* Active Failure Mode Banner (When NOT in Normal mode) */}
      {currentMode !== 'NORMAL' && (
        <div className="max-w-7xl mx-auto mt-2 p-2.5 rounded-xl bg-slate-800/90 border border-amber-500/40 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="font-bold text-amber-200">
              {language === 'mr-IN'
                ? `सक्रिय चाचणी: ${activeModeObj.labelMr} — ${activeModeObj.descMr}`
                : `Active Simulation: ${activeModeObj.labelEn} — ${activeModeObj.descEn}`}
            </span>
          </div>
          <button
            onClick={() => onModeChange('NORMAL')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] transition shadow-xs"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{language === 'mr-IN' ? 'सामान्य स्थितीत परत या' : 'Reset to Normal'}</span>
          </button>
        </div>
      )}

      {/* Expandable Failure Mode Selector Drawer */}
      {isOpen && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2 animate-in fade-in duration-200">
          <span className="text-[11px] font-bold text-slate-400 mr-1">
            {language === 'mr-IN' ? 'चाचणी मोड निवडा:' : 'Select Mode:'}
          </span>
          {modes.map((m) => {
            const Icon = m.icon;
            const isSelected = currentMode === m.id;
            const label = language === 'mr-IN' ? m.labelMr : m.labelEn;
            return (
              <button
                key={m.id}
                onClick={() => {
                  onModeChange(m.id);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black scale-102'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : m.color}`} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
