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

export default function App() {
  const [activeTab, setActiveTab] = useState('decision');
  const [language, setLanguage] = useState<'mr-IN' | 'hi-IN'>('mr-IN');
  const [record, setRecord] = useState<DecisionRecord | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapMatrix | null>(null);

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
    { id: 'decision', label: 'निर्णय' },
    { id: 'heatmap', label: '३×७ तक्ता' },
    { id: 'forecast', label: 'अंदाज' },
    { id: 'costs', label: 'खर्च' },
    { id: 'risk', label: 'जोखीम' },
    { id: 'scenarios', label: 'सिम्युलेटर' },
    { id: 'voice', label: 'सहाय्यक' },
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

        <TouchableOpacity
          onPress={() => setLanguage(language === 'mr-IN' ? 'hi-IN' : 'mr-IN')}
          style={styles.langBtn}
        >
          <Text style={styles.langText}>{language === 'mr-IN' ? 'मराठी' : 'हिंदी'}</Text>
        </TouchableOpacity>
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
  langBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  langText: { color: '#cbd5e1', fontSize: 11, fontWeight: '700' },
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
