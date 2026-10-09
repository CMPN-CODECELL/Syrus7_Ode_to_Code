import React, { useState } from 'react';
import { Sliders, Shield, AlertTriangle, CloudRain, Cpu, Radio } from 'lucide-react';
import { DemoFailureMode, DemoStatus } from '../types';

interface Props {
  currentMode: DemoFailureMode;
  onModeChange: (mode: DemoFailureMode) => void;
  demoStatus?: DemoStatus | null;
}

export const DemoSwitchBar: React.FC<Props> = ({ currentMode, onModeChange, demoStatus }) => {
  const [isOpen, setIsOpen] = useState(false);

  const modes: { id: DemoFailureMode; label: string; icon: any; color: string }[] = [
    { id: 'NORMAL', label: 'Normal Live/Verified', icon: Shield, color: 'text-emerald-400' },
    { id: 'DATA_OUTAGE', label: 'Market Data Outage', icon: Radio, color: 'text-amber-400' },
    { id: 'STALE_DATA', label: 'Stale Data (3+ sessions)', icon: AlertTriangle, color: 'text-rose-400' },
    { id: 'WEATHER_OUTAGE', label: 'Weather API Outage', icon: CloudRain, color: 'text-blue-400' },
    { id: 'LLM_OUTAGE', label: 'LLM Outage (Template Fallback)', icon: Cpu, color: 'text-purple-400' },
  ];

  return (
    <div className="w-full bg-emerald-900 text-white text-xs py-1.5 px-4 z-40 shadow-sm border-b border-emerald-800 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-100">
            <Sliders className="w-3.5 h-3.5 text-emerald-300" />
            <span>Judge Demo Failure Switch:</span>
          </span>
          <span className="font-mono text-emerald-900 font-bold bg-emerald-200 px-2 py-0.5 rounded text-[11px]">
            {currentMode}
          </span>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-emerald-200 hover:text-white underline text-[11px] ml-1 font-medium"
          >
            {isOpen ? 'Hide Modes' : 'Change Mode'}
          </button>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-emerald-100">
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${demoStatus?.gemini_healthy ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
            Gemini
          </span>
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${demoStatus?.groq_healthy ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
            Groq
          </span>
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${demoStatus?.market_api_healthy ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
            Market API
          </span>
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${demoStatus?.weather_api_healthy ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
            Weather API
          </span>
        </div>
      </div>

      {isOpen && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-emerald-800/80 flex flex-wrap gap-2 animate-fadeIn">
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
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-white text-emerald-900 shadow-sm font-bold'
                    : 'bg-emerald-800/80 text-emerald-100 hover:bg-emerald-800 border border-emerald-700/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-700' : 'text-emerald-300'}`} />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
