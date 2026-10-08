import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  freshness: string;
}

export const FreshnessBadge: React.FC<Props> = ({ freshness }) => {
  const isStale = freshness === 'STALE_RED';
  const isSlightlyStale = freshness === 'SLIGHTLY_STALE';

  return (
    <View style={[
      styles.badge,
      isStale ? styles.badgeRed : (isSlightlyStale ? styles.badgeYellow : styles.badgeGreen)
    ]}>
      <Text style={[
        styles.text,
        isStale ? styles.textRed : (isSlightlyStale ? styles.textYellow : styles.textGreen)
      ]}>
        {isStale ? '• Stale (3+ days) • Excluded' : (isSlightlyStale ? '• 2 days old • Caution' : '• Fresh (0 sessions old)')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeGreen: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  badgeYellow: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  badgeRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
  },
  textGreen: { color: '#4ade80' },
  textYellow: { color: '#facc15' },
  textRed: { color: '#f87171' },
});
