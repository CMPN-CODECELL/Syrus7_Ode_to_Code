import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ForecastPayload } from '../types';

interface Props {
  forecast: ForecastPayload | null;
}

export const ForecastScreen: React.FC<Props> = ({ forecast }) => {
  if (!forecast) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Conformal Forecast & Validation</Text>
      <Text style={styles.screenSub}>{forecast.mandi} • {forecast.crop}</Text>

      {/* Main Expected Card */}
      <View style={styles.mainCard}>
        <Text style={styles.cardHeader}>EXPECTED PRICE (q50)</Text>
        <Text style={styles.priceVal}>₹{forecast.expected} /qtl</Text>
        <View style={styles.bandRow}>
          <Text style={styles.bandText}>Low (q10): ₹{forecast.low}</Text>
          <Text style={styles.bandText}>High (q90): ₹{forecast.high}</Text>
        </View>
        <Text style={styles.bandNotice}>Conformal Interval Spread: ₹{forecast.high - forecast.low}/qtl</Text>
      </View>

      {/* Measured Report Card */}
      <View style={styles.reportCard}>
        <Text style={styles.reportTitle}>Forecast Validation Report Card</Text>
        <View style={styles.metricGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.mLabel}>Rolling MASE</Text>
            <Text style={styles.mVal}>{forecast.rolling_mase}</Text>
            <Text style={styles.mSub}>&lt; 1.0 beats naive</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.mLabel}>80% Coverage</Text>
            <Text style={styles.mVal}>{(forecast.rolling_80_coverage * 100).toFixed(0)}%</Text>
            <Text style={styles.mSub}>Calibrated target</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.mLabel}>Reliability</Text>
            <Text style={[styles.mVal, { color: '#4ade80' }]}>{forecast.reliability}</Text>
            <Text style={styles.mSub}>Model tier</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.mLabel}>Training Through</Text>
            <Text style={[styles.mVal, { fontSize: 13 }]}>{forecast.training_end_date}</Text>
            <Text style={styles.mSub}>End of fold</Text>
          </View>
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
  mainCard: { backgroundColor: '#0f172a', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#1e293b', marginBottom: 16 },
  cardHeader: { color: '#2dd4bf', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  priceVal: { color: '#fff', fontSize: 32, fontWeight: '900', marginVertical: 6 },
  bandRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  bandText: { color: '#cbd5e1', fontSize: 12, fontWeight: '600' },
  bandNotice: { color: '#64748b', fontSize: 10 },
  reportCard: { backgroundColor: '#0f172a', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#1e293b' },
  reportTitle: { color: '#f8fafc', fontSize: 14, fontWeight: '800', marginBottom: 12 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricItem: { width: '48%', backgroundColor: '#020617', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#1e293b' },
  mLabel: { color: '#64748b', fontSize: 10, fontWeight: '700' },
  mVal: { color: '#f8fafc', fontSize: 18, fontWeight: '800', marginVertical: 2 },
  mSub: { color: '#64748b', fontSize: 9 },
});
