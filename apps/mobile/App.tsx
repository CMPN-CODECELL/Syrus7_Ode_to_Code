import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, StatusBar } from 'react-native';
import { DecisionScreen } from './src/screens/DecisionScreen';
import { HeatmapScreen } from './src/screens/HeatmapScreen';
import { ForecastScreen } from './src/screens/ForecastScreen';
import { CostScreen } from './src/screens/CostScreen';
import { RiskScreen } from './src/screens/RiskScreen';
import { ScenarioScreen } from './src/screens/ScenarioScreen';
import { VoiceAssistantScreen } from './src/screens/VoiceAssistantScreen';

import { DecisionRecord, HeatmapMatrix } from './src/types';
import { MobileApiClient } from './src/api/client';

import mrDict from './src/localization/mr.json';
import hiDict from './src/localization/hi.json';
import enDict from './src/localization/en.json';

export default function App() {
  const [activeTab, setActiveTab] = useState('decision');
  const [language, setLanguage] = useState<'mr-IN' | 'hi-IN' | 'en-IN'>('mr-IN');
  const [record, setRecord] = useState<DecisionRecord | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapMatrix | null>(null);

  const labels = language === 'mr-IN' ? mrDict : language === 'hi-IN' ? hiDict : enDict;

  useEffect(() => {
    MobileApiClient.assist({
      session_id: 'mobile-init',
      message: '20 quintal tomato in Nashik wait 2 days',
      language: language,
      input_mode: 'text'
    }).then(r => {
      if (r.decision_record) setRecord(r.decision_record);
    });

    MobileApiClient.getHeatmap().then(hm => {
      if (hm) setHeatmap(hm);
    });
  }, [language]);

  const tabs = [
    { id: 'decision', label: labels.decision || 'Decision' },
    { id: 'heatmap', label: labels.heatmap || 'Heatmap' },
    { id: 'forecast', label: labels.forecast || 'Forecast' },
    { id: 'costs', label: labels.costs || 'Costs' },
    { id: 'risk', label: labels.risk || 'Risk' },
    { id: 'scenarios', label: labels.scenarios || 'What-If' },
    { id: 'voice', label: labels.assistant || 'Assistant' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>KrishiNirnay</Text>
          <Text style={styles.brandTagline}>Sahi Bhav Se, Samriddhi Ki Raah Pe.</Text>
        </View>

        <View style={styles.langContainer}>
          <TouchableOpacity
            onPress={() => setLanguage('mr-IN')}
            style={[styles.langBtn, language === 'mr-IN' && styles.langBtnActive]}
          >
            <Text style={[styles.langText, language === 'mr-IN' && styles.langTextActive]}>मराठी</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setLanguage('hi-IN')}
            style={[styles.langBtn, language === 'hi-IN' && styles.langBtnActive]}
          >
            <Text style={[styles.langText, language === 'hi-IN' && styles.langTextActive]}>हिंदी</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setLanguage('en-IN')}
            style={[styles.langBtn, language === 'en-IN' && styles.langBtnActive]}
          >
            <Text style={[styles.langText, language === 'en-IN' && styles.langTextActive]}>EN</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Screen Body */}
      <View style={styles.body}>
        {activeTab === 'decision' && (
          <DecisionScreen
            record={record}
            onNavigateTab={setActiveTab}
            language={language}
          />
        )}
        {activeTab === 'heatmap' && <HeatmapScreen heatmapData={heatmap} />}
        {activeTab === 'forecast' && <ForecastScreen forecast={record ? record.forecast : null} />}
        {activeTab === 'costs' && <CostScreen record={record} />}
        {activeTab === 'risk' && <RiskScreen record={record} />}
        {activeTab === 'scenarios' && <ScenarioScreen record={record} />}
        {activeTab === 'voice' && (
          <VoiceAssistantScreen
            onNewDecision={rec => setRecord(rec)}
            language={language}
          />
        )}
      </View>

      {/* Bottom Tabs Navigation */}
      <View style={styles.tabBar}>
        {tabs.map(t => (
          <TouchableOpacity
            key={t.id}
            onPress={() => setActiveTab(t.id)}
            style={[styles.tabItem, activeTab === t.id && styles.tabItemActive]}
          >
            <Text style={[styles.tabLabel, activeTab === t.id && styles.tabLabelActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#0f172a',
    backgroundColor: '#020617',
  },
  brandTitle: { color: '#4ade80', fontSize: 18, fontWeight: '900' },
  brandTagline: { color: '#64748b', fontSize: 10, fontWeight: '500' },
  langContainer: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: '#0f172a',
    padding: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  langBtnActive: {
    backgroundColor: '#16a34a',
  },
  langText: { color: '#94a3b8', fontSize: 10, fontWeight: '700' },
  langTextActive: { color: '#ffffff' },
  body: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 4, borderRadius: 8 },
  tabItemActive: { backgroundColor: '#166534' },
  tabLabel: { color: '#64748b', fontSize: 9, fontWeight: '700' },
  tabLabelActive: { color: '#f8fafc' },
});
