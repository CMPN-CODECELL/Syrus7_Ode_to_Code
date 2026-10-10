import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Sliders,
  X,
  ShieldAlert,
  Calendar,
  TrendingUp,
  History,
  Bot
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
import { AssistantScreen } from './components/AssistantScreen';
import { BottomNav } from './components/BottomNav';
import { MyFarmScreen } from './components/MyFarmScreen';
import { FloatingAssistant } from './components/FloatingAssistant';

import { DecisionRecord, HeatmapMatrix, SlotSchema, DemoFailureMode, DemoStatus } from './types';
import { ApiClient } from './api/client';

import mrDict from './localization/mr.json';
import hiDict from './localization/hi.json';
import enDict from './localization/en.json';

export const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'advice' | 'simulator' | 'costs' | 'farm'>('advice');
  const [language, setLanguage] = useState<'mr-IN' | 'hi-IN' | 'en-IN'>('en-IN');
  const [riskProfile, setRiskProfile] = useState<'CAUTIOUS' | 'BALANCED' | 'AGGRESSIVE'>('BALANCED');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [demoMode, setDemoMode] = useState<DemoFailureMode>('NORMAL');
  const [demoStatus, setDemoStatus] = useState<DemoStatus | null>(null);

  // WebSocket Live Stream State
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [liveTicker, setLiveTicker] = useState<string>('🟢 Live Mandi Stream Active: 142 tonnes traded at Nashik APMC • Modal rate steady at ₹1,800/qtl');

  const [decisionRecord, setDecisionRecord] = useState<DecisionRecord | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapMatrix | null>(null);
  const [isVoiceOpen, setIsVoiceOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isJudgeModalOpen, setIsJudgeModalOpen] = useState<boolean>(false);
  const [judgeSubTab, setJudgeSubTab] = useState<'heatmap' | 'forecast' | 'history' | 'scenarios'>('heatmap');
  const [loading, setLoading] = useState<boolean>(true);

  const [currentSlots, setCurrentSlots] = useState<SlotSchema>({
    commodity: 'Tomato',
    quantity: 20.0,
    quantity_unit: 'qtl',
    home_mandi: 'Nashik APMC',
    requested_wait_days: 2,
    risk_profile: 'BALANCED',
    language: 'en-IN',
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

  // WebSocket Live Stream Lifecycle
  useEffect(() => {
    const socket = ApiClient.connectMarketFeed(
      (msg) => {
        if (msg.type === 'INITIAL_MARKET_STATE' || msg.type === 'MARKET_REFRESH') {
          setWsStatus('connected');
        } else if (msg.type === 'LIVE_TICKER' && msg.ticker) {
          setLiveTicker(msg.ticker);
        }
      },
      (st) => {
        setWsStatus(st);
      }
    );

    return () => {
      socket?.close();
    };
  }, []);

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

  const handleUpdateSlots = (updated: Partial<SlotSchema>) => {
    const newSlots = { ...currentSlots, ...updated };
    setCurrentSlots(newSlots);
    const newRisk = (updated.risk_profile as any) || riskProfile;
    if (updated.risk_profile && updated.risk_profile !== riskProfile) {
      setRiskProfile(newRisk);
    }
    loadDecisionData(newSlots, newRisk);
  };

  const lotSummary = language === 'mr-IN'
    ? `${currentSlots.quantity || 20} क्विंटल ${currentSlots.commodity === 'Tomato' ? 'टोमॅटो' : 'कांदा'} • ${currentSlots.home_mandi ? currentSlots.home_mandi.replace(' APMC', ' बाजार समिती') : 'नाशिक बाजार समिती'}`
    : `${currentSlots.quantity || 20} qtl ${currentSlots.commodity || 'Tomato'} • ${currentSlots.home_mandi || 'Nashik APMC'}`;

  // Welcome Screen (Fast, clean, no video loop)
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
    <div className="min-h-screen flex flex-col bg-[#F6F8F6] text-slate-900 pb-24 md:pb-8">
      {/* 1. Top Navigation Bar (Simplified) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(t: any) => setActiveTab(t)}
        language={language}
        setLanguage={setLanguage}
        riskProfile={riskProfile}
        setRiskProfile={setRiskProfile}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onOpenVoice={() => setIsVoiceOpen(true)}
        onOpenEditLot={() => setIsEditModalOpen(true)}
        onOpenLanding={() => setShowLanding(true)}
        onOpenJudgeTools={() => setIsJudgeModalOpen(true)}
        lotSummary={lotSummary}
        labels={labels}
        wsStatus={wsStatus}
      />

      {/* 2. Main 4 Clear Tabs */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {loading && !decisionRecord ? (
          <div className="bg-white p-16 text-center rounded-3xl border border-emerald-100 shadow-sm space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-bold text-slate-700">
              {labels.engineStarting || 'Loading Market Intelligence...'}
            </p>
          </div>
        ) : (
          <>
            {/* Tab 1: Market Advice (Today's Decision & 7-Day Horizon) */}
            {activeTab === 'advice' && (
              <DecisionScreen
                record={decisionRecord}
                slots={currentSlots}
                onUpdateSlots={handleUpdateSlots}
                onPlayVoice={handlePlayVoice}
                onOpenCosts={() => setActiveTab('costs')}
                onOpenScenarios={() => setActiveTab('simulator')}
                labels={labels}
                language={language}
                isInsufficientEvidence={demoMode === 'DATA_OUTAGE'}
                liveTicker={liveTicker}
                wsStatus={wsStatus}
              />
            )}

            {/* Tab 2: What-If Planner & Simulator */}
            {activeTab === 'simulator' && (
              <ScenarioScreen
                record={decisionRecord}
                labels={labels}
                language={language}
              />
            )}

            {/* Tab 3: Itemized Expense Bill */}
            {activeTab === 'costs' && (
              <CostScreen
                record={decisionRecord}
                slots={currentSlots}
                labels={labels}
                language={language}
              />
            )}

            {/* Tab 4: My Farm & Settings */}
            {activeTab === 'farm' && (
              <MyFarmScreen
                slots={currentSlots}
                onOpenEditLot={() => setIsEditModalOpen(true)}
                language={language}
                setLanguage={setLanguage}
                theme={theme}
                onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
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

      {/* 3. Footer */}
      <footer className="border-t border-emerald-100 bg-white text-slate-600 text-xs py-5 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="font-bold text-slate-900">KrishiNirnay</span> — Sahi Bhav Se, Samriddhi Ki Raah Pe.
            <span className="block text-[11px] text-slate-500 font-medium">
              SDG 2.3 (Net Realization & Market Access) & SDG 12.3 (Preventing Perishability Loss)
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-bold">
            <button
              onClick={() => setIsJudgeModalOpen(true)}
              className="text-emerald-700 hover:text-emerald-900 underline"
            >
              सखोल तांत्रिक अहवाल (Judge View)
            </button>
          </div>
        </div>
      </footer>

      {/* 4. Bottom Navigation Bar for Mobile */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={(t: any) => setActiveTab(t)}
        labels={labels}
        language={language}
      />

      {/* 5. Judge & Expert Tools Modal (Keeps 100% of advanced features preserved!) */}
      {isJudgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-5xl max-h-[92vh] bg-white border border-slate-200 rounded-3xl flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>
                    {language === 'mr-IN'
                      ? 'सखोल तांत्रिक अहवाल (तज्ज्ञ व परीक्षक साधन)'
                      : language === 'hi-IN'
                      ? 'विशेषज्ञ व निर्णायक तकनीकी रिपोर्ट'
                      : 'Judge & Expert Analytics Engine'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {language === 'mr-IN'
                    ? '१००% प्रमाणित निर्णय इंजिन: XGBoost कॉन्फॉर्मल अंदाज, ३×७ नफा मॅट्रिक्स, क्रमिक नासाडी व फॉलबॅक सुरक्षा'
                    : '100% Verified Engine: XGBoost Conformal, 3×7 Matrix, Sequential Losses & Circuit Breakers'}
                </p>
              </div>
              <button
                onClick={() => setIsJudgeModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Outage Simulation Switcher Bar */}
            <DemoSwitchBar
              currentMode={demoMode}
              onModeChange={handleModeChange}
              demoStatus={demoStatus}
            />

            {/* Expert Sub-tabs (Clean 4 Analytics views; persistent Floating AI Assistant handles conversation) */}
            <div className="flex items-center gap-2 p-3 bg-slate-100 border-b border-slate-200 overflow-x-auto">
              {[
                {
                  id: 'heatmap',
                  label: language === 'mr-IN' ? '३×७ नफा मॅट्रिक्स' : language === 'hi-IN' ? '3×7 मैट्रिक्स' : '3×7 Heatmap',
                  icon: Calendar
                },
                {
                  id: 'forecast',
                  label: language === 'mr-IN' ? 'XGBoost भाव अंदाज' : language === 'hi-IN' ? 'XGBoost पूर्वानुमान' : 'XGBoost Forecast',
                  icon: TrendingUp
                },
                {
                  id: 'history',
                  label: language === 'mr-IN' ? 'ऐतिहासिक भाव कल' : language === 'hi-IN' ? 'ऐतिहासिक रुझान' : 'Historical Trend',
                  icon: History
                },
                {
                  id: 'scenarios',
                  label: language === 'mr-IN' ? 'काय घडेल नियोजन' : language === 'hi-IN' ? 'क्या होगा अगर' : 'What-If Simulator',
                  icon: Sliders
                }
              ].map((tab) => {
                const Icon = tab.icon;
                const isSel = judgeSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setJudgeSubTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition whitespace-nowrap ${
                      isSel ? 'bg-emerald-700 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {judgeSubTab === 'heatmap' && (
                <HeatmapScreen
                  heatmapData={heatmapData}
                  labels={labels}
                />
              )}
              {judgeSubTab === 'forecast' && (
                <ForecastScreen
                  forecast={decisionRecord?.forecast || null}
                  labels={labels}
                />
              )}
              {judgeSubTab === 'history' && (
                <HistoricalChartScreen
                  commodity={currentSlots.commodity || 'Tomato'}
                  mandi={currentSlots.home_mandi || 'Nashik APMC'}
                  labels={labels}
                />
              )}
              {judgeSubTab === 'scenarios' && (
                <ScenarioScreen
                  record={decisionRecord}
                  labels={labels}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Voice Drawer and Lot Edit Modal */}
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

      {/* 7. Persistent Floating AI Assistant (Krishi Mitra AI) */}
      <FloatingAssistant
        decisionRecord={decisionRecord}
        slots={currentSlots}
        language={language}
        onPlayVoice={handlePlayVoice}
        onUpdateSlots={(updated) => {
          handleUpdateSlots(updated);
        }}
      />
    </div>
  );
};
