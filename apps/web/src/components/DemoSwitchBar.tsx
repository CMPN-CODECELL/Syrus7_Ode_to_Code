import React, { useState } from 'react';
import { Sliders, Shield, AlertTriangle, CloudRain, Cpu, Radio, ChevronDown, ChevronUp } from 'lucide-react';
import { DemoFailureMode, DemoStatus } from '../types';

interface Props {
  currentMode: DemoFailureMode;
  onModeChange: (mode: DemoFailureMode) => void;
  demoStatus?: DemoStatus | null;
}

export const DemoSwitchBar: React.FC<Props> = ({ currentMode, onModeChange, demoStatus }) => {
  const [isOpen, setIsOpen] = useState(false);

  const modes: { id: DemoFailureMode; label: string; icon: any; color: string }[] = [
    { id: 'NORMAL', label: 'Normal (Live/Verified)', icon: Shield, color: 'text-emerald-400' },
    { id: 'DATA_OUTAGE', label: 'Market Data Outage', icon: Radio, color: 'text-amber-400' },
    { id: 'STALE_DATA', label: 'Stale Data (3+ sessions)', icon: AlertTriangle, color: 'text-rose-400' },
    { id: 'WEATHER_OUTAGE', label: 'Weather API Outage', icon: CloudRain, color: 'text-blue-400' },
    { id: 'LLM_OUTAGE', label: 'LLM Outage (Template Fallback)', icon: Cpu, color: 'text-purple-400' },
  ];

  const currentLabel = modes.find(m => m.id === currentMode)?.label || currentMode;

  return (
    <div className="w-full bg-slate-900 text-white text-xs py-1.5 px-4 z-40 border-b border-slate-800 transition-all select-none">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold border border-slate-700 transition"
            title="Toggle Demo Failure Simulation Modes"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>Judge Demo Tools:</span>
            <span className="font-mono text-emerald-300 font-extrabold ml-0.5">
              {currentMode}
            </span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
          </button>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            (Simulate real-world API outages & graceful fallback)
          </span>
        </div>

        {/* Live Service Health Indicators */}
        <div className="flex items-center gap-2.5 text-[11px] text-slate-300">
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${demoStatus?.gemini_healthy ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            Gemini
          </span>
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${demoStatus?.groq_healthy ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            Groq
          </span>
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${demoStatus?.market_api_healthy ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            Market API
          </span>
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${demoStatus?.weather_api_healthy ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            Weather
          </span>
        </div>
      </div>

      {/* Expandable Failure Mode Selector Drawer */}
      {isOpen && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2 animate-in fade-in duration-200">
          <span className="text-[11px] font-bold text-slate-400 mr-1">Select Mode:</span>
          {modes.map((m) => {
            const Icon = m.icon;
            const isSelected = currentMode === m.id;
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
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
