import React from 'react';
import { Sprout, Mic, Edit3, Globe, Shield, Sparkles } from 'lucide-react';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: 'mr-IN' | 'hi-IN' | 'en-IN';
  setLanguage: (lang: 'mr-IN' | 'hi-IN' | 'en-IN') => void;
  riskProfile: 'CAUTIOUS' | 'BALANCED' | 'AGGRESSIVE';
  setRiskProfile: (prof: 'CAUTIOUS' | 'BALANCED' | 'AGGRESSIVE') => void;
  onOpenVoice: () => void;
  onOpenEditLot: () => void;
  lotSummary: string;
  labels: Record<string, string>;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  riskProfile,
  setRiskProfile,
  onOpenVoice,
  onOpenEditLot,
  lotSummary,
  labels
}) => {
  const tabs = [
    { id: 'decision', label: labels.decision || 'Decision' },
    { id: 'heatmap', label: labels.heatmap || '3×7 Heatmap' },
    { id: 'forecast', label: labels.forecast || 'Forecast' },
    { id: 'history', label: labels.history || 'History' },
    { id: 'costs', label: labels.costs || 'Costs' },
    { id: 'risk', label: labels.risk || 'Risk' },
    { id: 'scenarios', label: labels.scenarios || 'What-If' },
  ];

  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-agri-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-green-300 to-teal-200 bg-clip-text text-transparent">
                  KrishiNirnay
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  PS_02
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                “Sahi Bhav Se, Samriddhi Ki Raah Pe.”
              </p>
            </div>
          </div>

          {/* Lot Summary & Quick Edit */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-medium text-slate-200">{lotSummary}</span>
            <button
              onClick={onOpenEditLot}
              className="ml-1 text-agri-400 hover:text-agri-300 p-1 hover:bg-slate-800 rounded transition"
              title="Edit Produce & Mandi"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Controls: Risk Appetite + Language + Voice Trigger */}
          <div className="flex items-center gap-2">
            {/* Risk Appetite Selector */}
            <div className="hidden md:flex items-center bg-slate-900/90 rounded-lg p-0.5 border border-slate-800 text-xs">
              {(['CAUTIOUS', 'BALANCED', 'AGGRESSIVE'] as const).map((prof) => (
                <button
                  key={prof}
                  onClick={() => setRiskProfile(prof)}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    riskProfile === prof
                      ? 'bg-agri-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {prof === 'CAUTIOUS' ? 'Cautious (q20)' : prof === 'BALANCED' ? 'Balanced (q35)' : 'Aggressive (q50)'}
                </button>
              ))}
            </div>

            {/* Language Selector */}
            <div className="flex items-center bg-slate-900/90 rounded-lg p-0.5 border border-slate-800 text-xs">
              <button
                onClick={() => setLanguage('mr-IN')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition ${
                  language === 'mr-IN' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                मराठी
              </button>
              <button
                onClick={() => setLanguage('hi-IN')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition ${
                  language === 'hi-IN' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                हिंदी
              </button>
              <button
                onClick={() => setLanguage('en-IN')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition ${
                  language === 'en-IN' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EN
              </button>
            </div>

            {/* Voice Assistant Button */}
            <button
              onClick={onOpenVoice}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 transition transform active:scale-95"
            >
              <Mic className="w-4 h-4 text-emerald-100" />
              <span className="hidden sm:inline">{labels.assistant || 'Voice Assistant'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex items-center space-x-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/60">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? 'bg-agri-600 text-white shadow-md shadow-agri-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};
