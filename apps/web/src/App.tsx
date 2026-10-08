import React, { useState, useEffect } from 'react';
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

import { DecisionRecord, HeatmapMatrix, SlotSchema, DemoFailureMode, DemoStatus } from './types';
import { ApiClient } from './api/client';

import mrDict from './localization/mr.json';
import hiDict from './localization/hi.json';
import enDict from './localization/en.json';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('decision');
  const [language, setLanguage] = useState<'mr-IN' | 'hi-IN' | 'en-IN'>('mr-IN');
  const [riskProfile, setRiskProfile] = useState<'CAUTIOUS' | 'BALANCED' | 'AGGRESSIVE'>('BALANCED');
  const [demoMode, setDemoMode] = useState<DemoFailureMode>('NORMAL');
  const [demoStatus, setDemoStatus] = useState<DemoStatus | null>(null);

  const [decisionRecord, setDecisionRecord] = useState<DecisionRecord | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapMatrix | null>(null);
  const [isVoiceOpen, setIsVoiceOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

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
      // Reload decision under new mode
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

  const lotSummary = `${currentSlots.quantity || 20} ${currentSlots.quantity_unit || 'qtl'} ${currentSlots.commodity || 'Tomato'} • ${currentSlots.home_mandi || 'Nashik APMC'}`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
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
        onOpenVoice={() => setIsVoiceOpen(true)}
        onOpenEditLot={() => setIsEditModalOpen(true)}
        lotSummary={lotSummary}
        labels={labels}
      />

      {/* 3. Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {loading && !decisionRecord ? (
          <div className="glass-panel p-16 text-center rounded-3xl space-y-4">
            <div className="w-12 h-12 border-4 border-agri-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-semibold text-slate-300">
              कृषिनिर्णय इंजिन सुरू होत आहे...
            </p>
          </div>
        ) : (
          <>
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
          </>
        )}
      </main>

      {/* 4. Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 text-slate-500 text-xs py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="font-bold text-slate-300">KrishiNirnay</span> — Sahi Bhav Se, Samriddhi Ki Raah Pe.
            <span className="block text-[11px] text-slate-600">
              SDG 2.3 (Net realization & market access) & SDG 12.3 (Perishability & avoidable food-loss reduction).
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Engine: v1.0.0</span>
            <span>Snapshot: mh_2026</span>
            <span className="text-emerald-500 font-mono">100% Deterministic Authority</span>
          </div>
        </div>
      </footer>

      {/* 5. Drawers and Modals */}
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
