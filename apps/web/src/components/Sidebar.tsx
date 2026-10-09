import React, { useState } from 'react';
import {
  Home,
  Sprout,
  Calendar,
  TrendingUp,
  History,
  Receipt,
  ShieldAlert,
  Sliders,
  Mic,
  User,
  Sun,
  Moon,
  Globe,
  SlidersHorizontal,
  X,
  PlayCircle,
  ShieldCheck,
  Radio,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { DemoFailureMode, DemoStatus } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: 'mr-IN' | 'hi-IN' | 'en-IN';
  setLanguage: (lang: 'mr-IN' | 'hi-IN' | 'en-IN') => void;
  riskProfile: 'CAUTIOUS' | 'BALANCED' | 'AGGRESSIVE';
  setRiskProfile: (prof: 'CAUTIOUS' | 'BALANCED' | 'AGGRESSIVE') => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenVoice: () => void;
  onOpenLanding?: () => void;
  labels: Record<string, string>;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  demoMode: DemoFailureMode;
  onDemoModeChange: (mode: DemoFailureMode) => void;
  demoStatus: DemoStatus | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  riskProfile,
  setRiskProfile,
  theme,
  onToggleTheme,
  onOpenVoice,
  onOpenLanding,
  labels,
  isOpenMobile,
  onCloseMobile,
  demoMode,
  onDemoModeChange,
  demoStatus
}) => {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const navItems = [
    { id: 'home', label: labels.home || 'Home', icon: Home },
    { id: 'decision', label: labels.decision || 'Market Decision', icon: Sprout },
    { id: 'heatmap', label: labels.heatmap || '3×7 Mandi Heatmap', icon: Calendar },
    { id: 'forecast', label: labels.forecast || 'Price Forecast', icon: TrendingUp },
    { id: 'history', label: labels.history || 'Historical Prices', icon: History },
    { id: 'costs', label: labels.costs || 'Cost Breakdown', icon: Receipt },
    { id: 'risk', label: labels.risk || 'Risk Assessment', icon: ShieldAlert },
    { id: 'scenarios', label: labels.scenarios || 'What-If Simulator', icon: Sliders },
    { id: 'assistant', label: labels.assistant || 'Krishi Mitra (Voice)', icon: Mic, badge: 'AI' },
    { id: 'profile', label: labels.profile || 'My Farm & Settings', icon: User },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Main Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-emerald-100 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Top Header: Logo + Tagline */}
        <div className="p-5 border-b border-emerald-100 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              if (onOpenLanding) onOpenLanding();
              onCloseMobile();
            }}
            className="flex items-center gap-3 text-left hover:opacity-90 transition group"
            title="Watch Welcome Video & Landing"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-700 to-green-600 flex items-center justify-center shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-emerald-950 dark:text-emerald-300 font-serif block">
                KrishiNirnay
              </span>
              <p className="text-[10px] text-emerald-800 dark:text-emerald-400 font-medium">
                “Sahi Bhav Se, Samriddhi Ki Raah Pe.”
              </p>
            </div>
          </button>

          {/* Close button for mobile */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Menu List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-1.5 scrollbar-thin">
          <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {language === 'mr-IN' ? 'डॅशबोर्ड मेनू' : language === 'hi-IN' ? 'डैशबोर्ड मेनू' : 'Dashboard Menu'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20 font-black'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800/60 hover:text-emerald-800 dark:hover:text-emerald-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Sidebar Footer: Controls + Language + Risk Mode + Judge Demo */}
        <div className="p-3.5 border-t border-emerald-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 space-y-2.5">
          {/* Risk Profile Selector */}
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {labels.riskProfile || 'Risk Model'}
            </span>
            <div className="grid grid-cols-3 gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              {(['CAUTIOUS', 'BALANCED', 'AGGRESSIVE'] as const).map((prof) => (
                <button
                  key={prof}
                  onClick={() => setRiskProfile(prof)}
                  className={`py-1 rounded-lg text-[10px] font-black transition ${
                    riskProfile === prof
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  {prof === 'CAUTIOUS' ? 'q20' : prof === 'BALANCED' ? 'q35' : 'q50'}
                </button>
              ))}
            </div>
          </div>

          {/* Language Selector + Contrast Toggle Row */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
            {/* Language Switcher */}
            <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700 text-xs">
              <button
                onClick={() => setLanguage('mr-IN')}
                className={`px-2 py-1 rounded-lg text-[10px] font-black transition ${
                  language === 'mr-IN' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                मराठी
              </button>
              <button
                onClick={() => setLanguage('hi-IN')}
                className={`px-2 py-1 rounded-lg text-[10px] font-black transition ${
                  language === 'hi-IN' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                हिंदी
              </button>
              <button
                onClick={() => setLanguage('en-IN')}
                className={`px-2 py-1 rounded-lg text-[10px] font-black transition ${
                  language === 'en-IN' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                EN
              </button>
            </div>

            {/* Contrast / Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-400 border border-slate-200 dark:border-slate-700 transition"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>
          </div>

          {/* Judge Demo Tools Collapsible Accordion */}
          <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setIsDemoOpen(!isDemoOpen)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold border border-slate-200 dark:border-slate-700 transition"
              title="Toggle Judge Demo Outage Simulation"
            >
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Judge Tools</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-mono text-[9px] text-emerald-700 dark:text-emerald-400 font-extrabold uppercase bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  {demoMode}
                </span>
                {isDemoOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </div>
            </button>

            {isDemoOpen && (
              <div className="mt-1.5 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5 shadow-xs">
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  Simulate API Outages:
                </div>
                <div className="grid grid-cols-1 gap-1 text-[10px]">
                  {[
                    { id: 'NORMAL', label: 'Normal (Live)' },
                    { id: 'DATA_OUTAGE', label: 'Market Data Outage' },
                    { id: 'STALE_DATA', label: 'Stale Data (3+ sessions)' },
                    { id: 'WEATHER_OUTAGE', label: 'Weather Outage' },
                    { id: 'LLM_OUTAGE', label: 'LLM Outage (Template)' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        onDemoModeChange(m.id as DemoFailureMode);
                        setIsDemoOpen(false);
                      }}
                      className={`px-2 py-1 rounded-lg text-left font-bold transition flex items-center justify-between ${
                        demoMode === m.id
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>{m.label}</span>
                      {demoMode === m.id && <span>✓</span>}
                    </button>
                  ))}
                </div>

                {/* Health indicators */}
                <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${demoStatus?.gemini_healthy ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    Gemini
                  </span>
                  <span className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${demoStatus?.groq_healthy ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    Groq
                  </span>
                  <span className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${demoStatus?.market_api_healthy ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    Market
                  </span>
                  <span className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${demoStatus?.weather_api_healthy ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    Weather
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
