import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { DecisionRecord } from '../types';

interface Props {
  record: DecisionRecord | null;
}

export const RiskScreen: React.FC<Props> = ({ record }) => {
  if (!record) return null;
  const { risk } = record;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Deterministic Six Risk Flags</Text>
      <Text style={styles.screenSub}>Composite score: {risk.score.toFixed(2)} • Overall: {risk.overall}</Text>

      {risk.flags.map((flag) => {
        const isGreen = flag.status === 'GREEN';
        const isYellow = flag.status === 'YELLOW';
        const color = isGreen ? '#4ade80' : isYellow ? '#facc15' : '#f87171';

        return (
          <View key={flag.id} style={[styles.card, { borderLeftColor: color, borderLeftWidth: 4 }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.flagName}>{flag.name}</Text>
              <Text style={[styles.statusTag, { color }]}>{flag.status}</Text>
            </View>
            <Text style={styles.flagReason}>{flag.reason}</Text>
            <Text style={styles.flagEvidence}>Evidence: {flag.evidence}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  content: { padding: 16 },
  screenTitle: { color: '#f8fafc', fontSize: 20, fontWeight: '800', marginBottom: 2 },
  screenSub: { color: '#64748b', fontSize: 12, marginBottom: 16 },
  card: { backgroundColor: '#0f172a', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#1e293b' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  flagName: { color: '#f1f5f9', fontSize: 13, fontWeight: '700' },
  statusTag: { fontSize: 11, fontWeight: '800' },
  flagReason: { color: '#94a3b8', fontSize: 11, lineHeight: 16, marginBottom: 6 },
  flagEvidence: { color: '#64748b', fontSize: 10, fontStyle: 'italic' },
});
