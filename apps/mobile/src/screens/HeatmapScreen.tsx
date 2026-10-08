import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { HeatmapMatrix } from '../types';

interface Props {
  heatmapData: HeatmapMatrix | null;
}

export const HeatmapScreen: React.FC<Props> = ({ heatmapData }) => {
  if (!heatmapData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading 3×7 Heatmap...</Text>
      </View>
    );
  }

  const { mandis, days, matrix } = heatmapData;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>3×7 Best-Day / Mandi Heatmap</Text>
      <Text style={styles.screenSub}>Risk-adjusted net returns across 3 verified mandis and 7 horizon days.</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollTable}>
        <View>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.headerCell, { width: 140 }]}>Mandi</Text>
            {days.map((d, i) => (
              <Text key={i} style={[styles.headerCell, { width: 85, textAlign: 'center' }]}>
                {d.split(' ')[0]}
              </Text>
            ))}
          </View>

          {mandis.map((mandi, rIdx) => {
            const cells = matrix[rIdx] || [];
            return (
              <View key={rIdx} style={styles.tableDataRow}>
                <Text style={[styles.mandiCell, { width: 140 }]}>{mandi}</Text>
                {cells.map((cell, cIdx) => {
                  if (!cell.is_open) {
                    return (
                      <View key={cIdx} style={[styles.cellBox, styles.cellClosed, { width: 85 }]}>
                        <Text style={styles.cellClosedText}>CLOSED</Text>
                      </View>
                    );
                  }
                  return (
                    <View
                      key={cIdx}
                      style={[
                        styles.cellBox,
                        cell.is_best ? styles.cellBest : styles.cellNormal,
                        { width: 85 }
                      ]}
                    >
                      {cell.is_best && <Text style={styles.bestTag}>★ BEST</Text>}
                      <Text style={[styles.netCellText, cell.is_best && { color: '#86efac', fontWeight: '800' }]}>
                        ₹{cell.net_realization.toLocaleString('en-IN')}
                      </Text>
                      <Text style={styles.gainCellText}>
                        {cell.gain_vs_baseline > 0 ? `+${cell.gain_vs_baseline}` : (cell.gain_vs_baseline < 0 ? `${cell.gain_vs_baseline}` : '0')}
                      </Text>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  content: { padding: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94a3b8' },
  screenTitle: { color: '#f8fafc', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  screenSub: { color: '#64748b', fontSize: 11, marginBottom: 16 },
  scrollTable: { backgroundColor: '#0f172a', borderRadius: 16, padding: 8, borderWidth: 1, borderColor: '#1e293b' },
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#1e293b', paddingBottom: 8 },
  headerCell: { color: '#64748b', fontSize: 10, fontWeight: '700' },
  tableDataRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#1e293b' },
  mandiCell: { color: '#e2e8f0', fontSize: 11, fontWeight: '700' },
  cellBox: { padding: 6, borderRadius: 10, marginHorizontal: 2, alignItems: 'center' },
  cellNormal: { backgroundColor: '#1e293b' },
  cellBest: { backgroundColor: 'rgba(22, 101, 52, 0.4)', borderWidth: 1, borderColor: '#4ade80' },
  cellClosed: { backgroundColor: '#020617', opacity: 0.5 },
  cellClosedText: { color: '#64748b', fontSize: 9, fontWeight: '700' },
  bestTag: { color: '#4ade80', fontSize: 8, fontWeight: '800' },
  netCellText: { color: '#f1f5f9', fontSize: 11, fontWeight: '700' },
  gainCellText: { color: '#94a3b8', fontSize: 9 },
});
