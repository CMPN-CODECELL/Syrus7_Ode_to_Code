/**
 * Mobile Offline Storage using AsyncStorage / in-memory fallback.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DecisionRecord } from '../types';

const LAST_DECISION_KEY = '@krishinirnay_last_decision';
const CACHED_SNAPSHOT_KEY = '@krishinirnay_cached_snapshot';

export class OfflineStorage {
  static async saveLastDecision(record: DecisionRecord): Promise<void> {
    try {
      await AsyncStorage.setItem(LAST_DECISION_KEY, JSON.stringify(record));
    } catch (e) {
      console.warn('AsyncStorage save error:', e);
    }
  }

  static async getLastDecision(): Promise<DecisionRecord | null> {
    try {
      const data = await AsyncStorage.getItem(LAST_DECISION_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('AsyncStorage get error:', e);
    }
    return null;
  }
}
