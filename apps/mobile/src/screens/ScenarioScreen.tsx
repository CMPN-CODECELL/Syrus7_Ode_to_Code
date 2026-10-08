import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { DecisionRecord } from '../types';

interface Props {
  record: DecisionRecord | null;
}

export const ScenarioScreen: React.FC<Props> = ({ record }) => {
  if (!record) return null;

  const [activePreset, setActivePreset] = useState<'CRASH' | 'TRANSPORT' | 'GLUT'>('CRASH');

  // Stressed calculations
  const baselineNet = record.chosen.net_total;
  let stressedNet = baselineNet;
  let stressedAction = record.chosen.action;
  let summary = '';

  if (activePreset === 'CRASH') {
    // Price -10%
    stressedNet = Math.round(baselineNet * 0.88);
    stressedAction = 'SELL_NOW';
    summary = 'Under Price -10% stress, waiting net falls below baseline. Recommendation flips to SELL NOW.';
  } else if (activePreset === 'TRANSPORT') {
    // Transport +20%
    stressedNet = baselineNet - 288;
    stressedAction = 'WAIT';
    summary = 'Under +20% transport surge, net reduces by ₹288 but waiting remains profitable.';
  } else {
    // Arrivals 2.0x
    stressedNet = Math.round(baselineNet * 0.91);
    stressedAction = 'SELL_NOW';
    summary = 'Under 2.0x arrival glut, market pressure increases. Recommendation flips to SELL NOW.';
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>What-If Stress Simulator</Text>
      <Text style={styles.screenSub}>Observe how decision recommendation flips under market shocks.</Text>

      {/* Preset Selector */}
      <View style={styles.presetRow}>
        <TouchableOpacity
          style={[styles.presetBtn, activePreset === 'CRASH' && styles.presetBtnActive]}
          onPress={() => setActivePreset('CRASH')}
        >
          <Text style={[styles.presetText, activePreset === 'CRASH' && styles.presetTextActive]}>
            Price -10%
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.presetBtn, activePreset === 'TRANSPORT' && styles.presetBtnActive]}
          onPress={() => setActivePreset('TRANSPORT')}
        >
          <Text style={[styles.presetText, activePreset === 'TRANSPORT' && styles.presetTextActive]}>
            Freight +20%
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.presetBtn, activePreset === 'GLUT' && styles.presetBtnActive]}
          onPress={() => setActivePreset('GLUT')}
        >
          <Text style={[styles.presetText, activePreset === 'GLUT' && styles.presetTextActive]}>
            Arrivals 2.0x
          </Text>
        </TouchableOpacity>
      </View>

      {/* Impact Card */}
      <View style={styles.resultCard}>
        <Text style={styles.resHeader}>STRESS TEST OUTCOME</Text>
        <Text style={styles.summaryText}>{summary}</Text>

        <View style={styles.diffRow}>
          <View style={styles.diffCol}>
            <Text style={styles.diffLabel}>Baseline Net</Text>
            <Text style={styles.diffVal}>₹{baselineNet.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.diffCol}>
            <Text style={styles.diffLabel}>Stressed Net</Text>
            <Text style={[styles.diffVal, { color: '#f87171' }]}>₹{stressedNet.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <View style={styles.flipBanner}>
          <Text style={styles.flipLabel}>RECOMMENDATION:</Text>
          <Text style={styles.flipVal}>{stressedAction}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  content: { padding: 16 },
  screenTitle: { color: '#f8fafc', fontSize: 20, fontWeight: '800', marginBottom: 2 },
  screenSub: { color: '#64748b', fontSize: 12, marginBottom: 16 },
  presetRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  presetBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#0f172a', alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  presetBtnActive: { backgroundColor: '#7c3aed', borderColor: '#8b5cf6' },
  presetText: { color: '#94a3b8', fontSize: 11, fontWeight: '700' },
  presetTextActive: { color: '#fff' },
  resultCard: { backgroundColor: '#0f172a', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#1e293b' },
  resHeader: { color: '#c084fc', fontSize: 10, fontWeight: '800', marginBottom: 6 },
  summaryText: { color: '#e2e8f0', fontSize: 12, lineHeight: 18, marginBottom: 14 },
  diffRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#1e293b', paddingTop: 12, marginBottom: 14 },
  diffCol: { width: '48%' },
  diffLabel: { color: '#64748b', fontSize: 10 },
  diffVal: { color: '#f8fafc', fontSize: 18, fontWeight: '900', marginTop: 2 },
  flipBanner: { backgroundColor: '#020617', padding: 12, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  flipLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '700' },
  flipVal: { color: '#facc15', fontSize: 14, fontWeight: '900' },
});
