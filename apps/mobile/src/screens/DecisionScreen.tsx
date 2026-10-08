import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { DecisionRecord } from '../types';
import { FreshnessBadge } from '../components/FreshnessBadge';
import { MobileSpeechService } from '../voice/speechService';

interface Props {
  record: DecisionRecord | null;
  onNavigateTab: (tab: string) => void;
  language: string;
}

export const DecisionScreen: React.FC<Props> = ({ record, onNavigateTab, language }) => {
  if (!record) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>कृषिनिर्णय निर्णय लोड होत आहे...</Text>
      </View>
    );
  }

  const { chosen, baseline, forecast, risk, explanation, lot_quantity_qtl, commodity } = record;

  const handleSpeak = () => {
    MobileSpeechService.speak(explanation.spoken_summary, language);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Large Action Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.actionPill}>
            <Text style={styles.actionPillText}>{chosen.action}</Text>
          </View>
          <FreshnessBadge freshness={risk.flags.find(f => f.id === 'stale_data')?.status === 'RED' ? 'STALE_RED' : 'FRESH'} />
        </View>

        <Text style={styles.heroTitle}>
          {chosen.action === 'WAIT' ? `WAIT ${chosen.wait_days} DAYS` : (chosen.action === 'GO' ? `GO TO ${chosen.market}` : 'SELL NOW')}
        </Text>
        <Text style={styles.heroSubtitle}>
          {chosen.market} • {lot_quantity_qtl} qtl {commodity}
        </Text>

        <View style={styles.netBox}>
          <Text style={styles.netLabel}>EXPECTED NET REALIZATION</Text>
          <View style={styles.netRow}>
            <Text style={styles.netValue}>₹{chosen.net_total.toLocaleString('en-IN')}</Text>
            {chosen.gain_total > 0 && (
              <Text style={styles.gainValue}>(+₹{chosen.gain_total.toLocaleString('en-IN')})</Text>
            )}
          </View>
          <Text style={styles.baselineNote}>
            Sell Now Baseline: ₹{baseline.net_total.toLocaleString('en-IN')} • {Math.round(chosen.probability_beat_baseline * 100)}% Win Odds
          </Text>
        </View>

        {/* Speak Button */}
        <TouchableOpacity style={styles.speakButton} onPress={handleSpeak} activeOpacity={0.8}>
          <Text style={styles.speakButtonText}>🔊 ऐका / Listen Summary</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Key Deterministic Decision Gates */}
      <View style={styles.grid2x2}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>RESERVATION PRICE</Text>
          <Text style={styles.metricVal}>₹{chosen.reservation_price.toLocaleString('en-IN')}/qtl</Text>
          <Text style={styles.metricHint}>Do not accept below this bid</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>FORECAST (q50)</Text>
          <Text style={styles.metricVal}>₹{forecast.expected.toLocaleString('en-IN')}</Text>
          <Text style={styles.metricHint}>Band: ₹{forecast.low} – ₹{forecast.high}</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>RISK LEVEL</Text>
          <Text style={[styles.metricVal, { color: risk.overall === 'GREEN' ? '#4ade80' : '#facc15' }]}>
            {risk.overall} ({risk.score.toFixed(2)})
          </Text>
          <Text style={styles.metricHint}>6 flags deterministic composite</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>NET DEDUCTIONS</Text>
          <Text style={styles.metricVal}>
            ₹{(chosen.cost_breakdown.transport + chosen.cost_breakdown.hamali_tolai + chosen.cost_breakdown.storage + chosen.cost_breakdown.financing).toLocaleString('en-IN')}
          </Text>
          <Text style={styles.metricHint}>Freight, labor, loss & storage</Text>
        </View>
      </View>

      {/* 3. Evidence Reasons */}
      <View style={styles.reasonsCard}>
        <Text style={styles.reasonsTitle}>Fact Evidence Cards (Why?)</Text>
        {explanation.why.map((reason, idx) => (
          <View key={idx} style={styles.reasonRow}>
            <Text style={styles.reasonIdx}>#{idx + 1}</Text>
            <Text style={styles.reasonText}>{reason}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  content: { padding: 16, paddingBottom: 40 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94a3b8', fontSize: 14 },
  heroCard: {
    backgroundColor: '#166534',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionPill: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  actionPillText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 2 },
  heroSubtitle: { color: '#dcfce7', fontSize: 13, fontWeight: '500', marginBottom: 16 },
  netBox: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  netLabel: { color: '#a7f3d0', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  netRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginVertical: 4 },
  netValue: { color: '#fff', fontSize: 28, fontWeight: '900' },
  gainValue: { color: '#86efac', fontSize: 14, fontWeight: '700' },
  baselineNote: { color: '#dcfce7', fontSize: 11 },
  speakButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  speakButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  grid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  metricLabel: { color: '#64748b', fontSize: 9, fontWeight: '700' },
  metricVal: { color: '#f8fafc', fontSize: 16, fontWeight: '800', marginVertical: 3 },
  metricHint: { color: '#64748b', fontSize: 9 },
  reasonsCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  reasonsTitle: { color: '#f8fafc', fontSize: 14, fontWeight: '800', marginBottom: 12 },
  reasonRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  reasonIdx: { color: '#22c55e', fontSize: 11, fontWeight: '800' },
  reasonText: { color: '#cbd5e1', fontSize: 11, flex: 1, lineHeight: 16 },
});
