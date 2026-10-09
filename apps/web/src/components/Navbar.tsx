import React from 'react';
import { Sprout, Mic, Edit3, Globe, Shield, Sparkles, Sun, Moon } from 'lucide-react';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: 'mr-IN' | 'hi-IN' | 'en-IN';
  setLanguage: (lang: 'mr-IN' | 'hi-IN' | 'en-IN') => void;
  riskProfile: 'CAUTIOUS' | 'BALANCED' | 'AGGRESSIVE';
  setRiskProfile: (prof: 'CAUTIOUS' | 'BALANCED' | 'AGGRESSIVE') => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
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
  theme,
  onToggleTheme,
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
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Tagline (PS_02 badge removed) */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-700 to-green-600 flex items-center justify-center shadow-md shadow-emerald-700/20">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-emerald-950 font-serif">
                  KrishiNirnay
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 font-medium hidden sm:block">
                “Sahi Bhav Se, Samriddhi Ki Raah Pe.”
              </p>
            </div>
          </div>

          {/* Lot Summary & Quick Edit */}
          <div className="hidden lg:flex items-center gap-2 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 text-xs text-emerald-900 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>{lotSummary}</span>
            <button
              onClick={onOpenEditLot}
              className="ml-1 text-emerald-700 hover:text-emerald-900 p-1 hover:bg-emerald-100 rounded-full transition"
              title="Edit Produce & Mandi"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Controls: Risk Appetite + Language + Voice Trigger */}
          <div className="flex items-center gap-2">
            {/* Risk Appetite Selector */}
            <div className="hidden md:flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200 text-xs">
              {(['CAUTIOUS', 'BALANCED', 'AGGRESSIVE'] as const).map((prof) => (
                <button
                  key={prof}
                  onClick={() => setRiskProfile(prof)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    riskProfile === prof
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {prof === 'CAUTIOUS' ? 'Cautious (q20)' : prof === 'BALANCED' ? 'Balanced (q35)' : 'Aggressive (q50)'}
                </button>
              ))}
            </div>

            {/* Language Selector */}
            <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200 text-xs">
              <button
                onClick={() => setLanguage('mr-IN')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition ${
                  language === 'mr-IN' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                मराठी
              </button>
              <button
                onClick={() => setLanguage('hi-IN')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition ${
                  language === 'hi-IN' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                हिंदी
              </button>
              <button
                onClick={() => setLanguage('en-IN')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition ${
                  language === 'en-IN' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
            </div>

            {/* Contrast / Theme Toggle (Light / Dark Mode) */}
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition shadow-xs"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle light or dark contrast mode"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline text-[11px] text-amber-200 font-extrabold">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-700" />
                  <span className="hidden sm:inline text-[11px] text-slate-700 font-extrabold">Dark</span>
                </>
              )}
            </button>

            {/* Voice Assistant Button */}
            <button
              onClick={onOpenVoice}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/25 transition transform active:scale-95"
            >
              <Mic className="w-4 h-4 text-emerald-100" />
              <span className="hidden sm:inline">{labels.assistant || 'Voice Assistant'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex items-center space-x-1.5 overflow-x-auto py-2 scrollbar-none border-t border-emerald-50">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50'
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
