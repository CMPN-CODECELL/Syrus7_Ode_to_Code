import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { DecisionRecord } from '../types';

interface Props {
  record: DecisionRecord | null;
}

export const CostScreen: React.FC<Props> = ({ record }) => {
  if (!record) return null;
  const cb = record.chosen.cost_breakdown;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Deduction & Net Reconciler</Text>
      <Text style={styles.screenSub}>Canonical formulas • No double spoilage</Text>

      {/* Saleable Weight Card */}
      <View style={styles.box}>
        <Text style={styles.boxTitle}>Saleable Produce Weight Cascade</Text>
        <Text style={styles.rowItem}>Harvest Weight: {cb.quantity_initial_qtl} qtl</Text>
        <Text style={styles.rowItem}>Holding Loss: {(cb.holding_loss_pct * 100).toFixed(1)}%</Text>
        <Text style={styles.rowItem}>Transit Loss: {(cb.travel_loss_pct * 100).toFixed(1)}%</Text>
        <Text style={[styles.rowItem, { color: '#4ade80', fontWeight: '800' }]}>
          Sold at Mandi: {cb.quantity_sold_qtl} qtl
        </Text>
      </View>

      {/* Itemized Table */}
      <View style={styles.box}>
        <Text style={styles.boxTitle}>Monetary Itemization</Text>
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Gross Produce Revenue</Text>
          <Text style={[styles.costVal, { color: '#4ade80' }]}>₹{cb.gross_revenue.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Transport (Round Trip)</Text>
          <Text style={[styles.costVal, { color: '#f87171' }]}>-₹{cb.transport.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Hamali / Labor</Text>
          <Text style={[styles.costVal, { color: '#f87171' }]}>-₹{cb.hamali_tolai.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Holding Storage</Text>
          <Text style={[styles.costVal, { color: '#f87171' }]}>-₹{cb.storage.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Financing (12% APR)</Text>
          <Text style={[styles.costVal, { color: '#f87171' }]}>-₹{cb.financing.toLocaleString('en-IN')}</Text>
        </View>

        <View style={[styles.costRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Final Net (In Hand)</Text>
          <Text style={styles.totalVal}>₹{cb.final_net.toLocaleString('en-IN')}</Text>
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
  box: { backgroundColor: '#0f172a', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1e293b' },
  boxTitle: { color: '#e2e8f0', fontSize: 13, fontWeight: '800', marginBottom: 10 },
  rowItem: { color: '#cbd5e1', fontSize: 12, marginBottom: 4 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#1e293b' },
  costLabel: { color: '#cbd5e1', fontSize: 12 },
  costVal: { fontSize: 12, fontWeight: '700' },
  totalRow: { borderBottomWidth: 0, paddingTop: 14 },
  totalLabel: { color: '#4ade80', fontSize: 14, fontWeight: '800' },
  totalVal: { color: '#4ade80', fontSize: 18, fontWeight: '900' },
});
