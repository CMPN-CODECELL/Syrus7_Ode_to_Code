import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Calendar,
  TrendingUp,
  History,
  Receipt,
  ShieldAlert,
  Sliders,
  Mic,
  Bell,
  User,
  Edit3,
  Sun,
  CloudRain,
  Sparkles,
  Home,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { DemoSwitchBar } from './components/DemoSwitchBar';
import { DecisionScreen } from './components/DecisionScreen';
import { HeatmapScreen } from './components/HeatmapScreen';
import { ForecastScreen } from './components/ForecastScreen';
import { HistoricalChartScreen } from './components/HistoricalChartScreen';
import { CostScreen } from './components/CostScreen';
import { RiskScreen } from './components/RiskScreen';
import { ScenarioScreen } from './components/ScenarioScreen';
import { VoiceAssistantDrawer } from './components/VoiceAssistantDrawer';
import { FarmerInputsModal } from './components/FarmerInputsModal';
import { LandingPage } from './components/LandingPage';
import { HomeScreen } from './components/HomeScreen';
import { MyFarmScreen } from './components/MyFarmScreen';
import { AssistantScreen } from './components/AssistantScreen';
import { BottomNav } from './components/BottomNav';

import { DecisionRecord, HeatmapMatrix, SlotSchema, DemoFailureMode, DemoStatus } from './types';
import { ApiClient } from './api/client';

import mrDict from './localization/mr.json';
import hiDict from './localization/hi.json';
import enDict from './localization/en.json';

export const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [language, setLanguage] = useState<'mr-IN' | 'hi-IN' | 'en-IN'>('mr-IN');
  const [riskProfile, setRiskProfile] = useState<'CAUTIOUS' | 'BALANCED' | 'AGGRESSIVE'>('BALANCED');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('krishi_theme') as 'light' | 'dark') || 'light';
  });
  const [demoMode, setDemoMode] = useState<DemoFailureMode>('NORMAL');
  const [demoStatus, setDemoStatus] = useState<DemoStatus | null>(null);

  const [decisionRecord, setDecisionRecord] = useState<DecisionRecord | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapMatrix | null>(null);
  const [isVoiceOpen, setIsVoiceOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('krishi_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [currentSlots, setCurrentSlots] = useState<SlotSchema>({
    commodity: 'Tomato',
    quantity: 20.0,
    quantity_unit: 'qtl',
    home_mandi: 'Nashik APMC',
    requested_wait_days: 2,
    risk_profile: 'BALANCED',
    language: 'mr-IN',
    is_complete: true,
    missing_slots: [],
    ambiguous_slots: []
  });

  const labels = language === 'mr-IN' ? mrDict : language === 'hi-IN' ? hiDict : enDict;

  // Initial Data Fetch
  const loadDecisionData = async (slots: SlotSchema, prof: 'CAUTIOUS' | 'BALANCED' | 'AGGRESSIVE') => {
    setLoading(true);
    try {
      const resp = await ApiClient.assist({
        session_id: 'session-app-main',
        message: `${slots.quantity || 20} quintal ${slots.commodity || 'tomato'} in ${slots.home_mandi || 'Nashik APMC'} wait ${slots.requested_wait_days || 2} days`,
        language: language,
        input_mode: 'text',
        risk_profile_override: prof
      });
      if (resp.decision_record) {
        setDecisionRecord(resp.decision_record);
      }
      const hm = await ApiClient.getHeatmap();
      setHeatmapData(hm);
      const ds = await ApiClient.getDemoStatus();
      setDemoStatus(ds);
    } catch (e) {
      console.error('Failed to load decision data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDecisionData(currentSlots, riskProfile);
  }, [language, riskProfile]);

  const handleModeChange = async (mode: DemoFailureMode) => {
    setDemoMode(mode);
    try {
      await ApiClient.setDemoFailureMode(mode);
      const ds = await ApiClient.getDemoStatus();
      setDemoStatus(ds);
      loadDecisionData(currentSlots, riskProfile);
    } catch (e) {
      console.error('Mode change error:', e);
    }
  };

  const handlePlayVoice = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = language;
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    }
  };

  const handleSelectCropPreset = (commodity: string, mandi: string, qty: number) => {
    const updated: SlotSchema = {
      ...currentSlots,
      commodity,
      home_mandi: mandi,
      quantity: qty
    };
    setCurrentSlots(updated);
    loadDecisionData(updated, riskProfile);
  };

  const lotSummary = `${currentSlots.quantity || 20} ${currentSlots.quantity_unit || 'qtl'} ${currentSlots.commodity || 'Tomato'} • ${currentSlots.home_mandi || 'Nashik APMC'}`;

  if (showLanding) {
    return (
      <LandingPage
        onGetStarted={() => setShowLanding(false)}
        language={language}
        setLanguage={setLanguage}
        labels={labels}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7F4] text-slate-900 pb-24 md:pb-8">
      {/* 1. Judge Demo Failure Mode Switcher Bar */}
      <DemoSwitchBar
        currentMode={demoMode}
        onModeChange={handleModeChange}
        demoStatus={demoStatus}
      />

      {/* 2. Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        riskProfile={riskProfile}
        setRiskProfile={setRiskProfile}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenVoice={() => setActiveTab('assistant')}
        onOpenEditLot={() => setIsEditModalOpen(true)}
        onOpenLanding={() => setShowLanding(true)}
        lotSummary={lotSummary}
        labels={labels}
      />

      {/* 3. Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Compact Status Banner for secondary screens */}
        {activeTab !== 'home' && activeTab !== 'assistant' && activeTab !== 'profile' && (
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-emerald-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
            {/* Left: Farmer Profile & Lot Summary */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shadow-xs flex-shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    {labels.goodMorning || 'Good Morning, Kisan Friend! 🌾'}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" />
                    {labels.verifiedFarmer || 'Verified'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold transition shadow-xs"
                    title="Click to edit crop lot, quantity, or mandi"
                  >
                    <Sprout className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{lotSummary}</span>
                    <Edit3 className="w-3 h-3 text-emerald-600 ml-0.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Weather & Mandi Status Pills + Intro Video + Voice Trigger */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              {/* Weather Pill */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 font-bold shadow-2xs">
                <Sun className="w-4 h-4 text-amber-500 animate-spin-slow" />
                <span>28°C • {labels.sunnyClear || 'Clear Sky'}</span>
              </div>

              {/* Mandi & Freshness Pill */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{currentSlots.home_mandi || 'Nashik'} {labels.activeTrading || 'Active'}</span>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-1.5 py-0.5 rounded-md">
                  {labels.verified || '100% Verified'}
                </span>
              </div>

              {/* Watch Intro Video Button */}
              <button
                onClick={() => setShowLanding(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold text-xs transition shadow-2xs"
                title="Watch Intro Video / Landing Page"
              >
                <span>🎬</span>
                <span className="hidden sm:inline">{labels.introVideo || 'Intro'}</span>
              </button>

              {/* Voice Assistant Call-to-Action */}
              <button
                onClick={() => setActiveTab('assistant')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-md shadow-emerald-700/25 transition active:scale-95"
                title="Open Voice Assistant"
              >
                <Mic className="w-4 h-4 text-white" />
                <span>{labels.speak || 'Speak'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Screen View */}
        {loading && !decisionRecord ? (
          <div className="bg-white p-16 text-center rounded-3xl border border-emerald-100 shadow-sm space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-bold text-slate-700">
              {language === 'mr-IN' ? 'कृषिनिर्णय इंजिन सुरू होत आहे...' : language === 'hi-IN' ? 'कृषिनिर्णय इंजन प्रारंभ हो रहा है...' : 'Initializing KrishiNirnay Engine...'}
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeScreen
                record={decisionRecord}
                slots={currentSlots}
                onNavigateTab={setActiveTab}
                onOpenVoice={() => setActiveTab('assistant')}
                onOpenEditLot={() => setIsEditModalOpen(true)}
                onSelectCropPreset={handleSelectCropPreset}
                labels={labels}
                language={language}
              />
            )}

            {activeTab === 'decision' && (
              <DecisionScreen
                record={decisionRecord}
                onPlayVoice={handlePlayVoice}
                onOpenScenarios={() => setActiveTab('scenarios')}
                labels={labels}
                isInsufficientEvidence={demoMode === 'DATA_OUTAGE'}
              />
            )}

            {activeTab === 'heatmap' && (
              <HeatmapScreen
                heatmapData={heatmapData}
                onSelectCell={(cell) => {
                  console.log('Selected cell:', cell);
                }}
                labels={labels}
              />
            )}

            {activeTab === 'forecast' && (
              <ForecastScreen
                forecast={decisionRecord ? decisionRecord.forecast : null}
                labels={labels}
              />
            )}

            {activeTab === 'history' && (
              <HistoricalChartScreen
                commodity={currentSlots.commodity || 'Tomato'}
                mandi={currentSlots.home_mandi || 'Nashik APMC'}
                labels={labels}
              />
            )}

            {activeTab === 'costs' && (
              <CostScreen
                record={decisionRecord}
                labels={labels}
              />
            )}

            {activeTab === 'risk' && (
              <RiskScreen
                risk={decisionRecord ? decisionRecord.risk : null}
                labels={labels}
              />
            )}

            {activeTab === 'scenarios' && (
              <ScenarioScreen
                record={decisionRecord}
                labels={labels}
              />
            )}

            {activeTab === 'assistant' && (
              <AssistantScreen
                language={language}
                labels={labels}
                onPlayVoice={handlePlayVoice}
              />
            )}

            {activeTab === 'profile' && (
              <MyFarmScreen
                slots={currentSlots}
                onOpenEditLot={() => setIsEditModalOpen(true)}
                language={language}
                setLanguage={setLanguage}
                theme={theme}
                onToggleTheme={handleToggleTheme}
                demoMode={demoMode}
                onDemoModeChange={handleModeChange}
                demoStatus={demoStatus}
                riskProfile={riskProfile}
                setRiskProfile={setRiskProfile}
                labels={labels}
              />
            )}
          </>
        )}
      </main>

      {/* 4. Footer */}
      <footer className="border-t border-emerald-100 bg-white text-slate-600 text-xs py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="font-bold text-slate-900">KrishiNirnay</span> — Sahi Bhav Se, Samriddhi Ki Raah Pe.
            <span className="block text-[11px] text-slate-500 font-medium">
              SDG 2.3 (Net realization & market access) & SDG 12.3 (Perishability & avoidable food-loss reduction).
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-medium">
            <span>Engine: v1.0.0</span>
            <span>Snapshot: mh_2026</span>
            <span className="text-emerald-700 font-mono font-bold">100% Deterministic Authority</span>
          </div>
        </div>
      </footer>

      {/* 5. Modern Bottom Navigation Bar (AgriCare Mockup Style) */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        labels={labels}
        language={language}
      />

      {/* 6. Drawers and Modals */}
      <VoiceAssistantDrawer
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        language={language}
        onNewDecision={(rec) => setDecisionRecord(rec)}
        labels={labels}
      />

      <FarmerInputsModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentSlots={currentSlots}
        onSave={(updated) => {
          setCurrentSlots(updated);
          loadDecisionData(updated, updated.risk_profile);
        }}
        labels={labels}
      />
    </div>
  );
};
