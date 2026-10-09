/**
 * Real-time Dynamic Translation Service for KrishiNirnay.
 * Ensures incoming dynamic API data, new mandis, weather alerts,
 * and user-entered phrases are translated on the fly.
 */

import { ApiClient } from './client';

// In-memory runtime translation cache
const translationCache: Record<string, Record<string, string>> = {
  // Common dynamic vocabulary
  'Tomato': { 'mr-IN': 'टोमॅटो', 'hi-IN': 'टमाटर', 'en-IN': 'Tomato' },
  'Onion': { 'mr-IN': 'कांदा', 'hi-IN': 'प्याज', 'en-IN': 'Onion' },
  'Wheat': { 'mr-IN': 'गहू', 'hi-IN': 'गेहूं', 'en-IN': 'Wheat' },
  'Soybean': { 'mr-IN': 'सोयाबीन', 'hi-IN': 'सोयाबीन', 'en-IN': 'Soybean' },
  'Nashik APMC': { 'mr-IN': 'नाशिक बाजार समिती', 'hi-IN': 'नासिक मंडी', 'en-IN': 'Nashik APMC' },
  'Pimpalgaon Baswant APMC': { 'mr-IN': 'पिंपळगाव बसवंत बाजार समिती', 'hi-IN': 'पिंपलगांव मंडी', 'en-IN': 'Pimpalgaon Baswant APMC' },
  'Sangamner APMC': { 'mr-IN': 'संगमनेर बाजार समिती', 'hi-IN': 'संगमनेर मंडी', 'en-IN': 'Sangamner APMC' },
  'WAIT': { 'mr-IN': 'थांबा', 'hi-IN': 'रुकें', 'en-IN': 'WAIT' },
  'SELL_NOW': { 'mr-IN': 'आजच विका', 'hi-IN': 'आज ही बेचें', 'en-IN': 'SELL NOW' },
  'GO': { 'mr-IN': 'दुसऱ्या बाजारात जा', 'hi-IN': 'दूसरी मंडी जाएं', 'en-IN': 'GO TO ANOTHER MANDI' },
  'Clear Sky': { 'mr-IN': 'निरभ्र आकाश • स्वच्छ ऊन', 'hi-IN': 'साफ आसमान • धूप', 'en-IN': 'Clear Sky • Sunny' },
  'Heavy Rain Warning': { 'mr-IN': 'मुसळधार पावसाचा इशारा', 'hi-IN': 'भारी बारिश की चेतावनी', 'en-IN': 'Heavy Rain Warning' },
  'Market Closed': { 'mr-IN': 'बाजार बंद (साप्ताहिक सुट्टी)', 'hi-IN': 'मंडी बंद (साप्ताहिक अवकाश)', 'en-IN': 'Market Closed (Weekly Off)' }
};

export class DynamicTranslator {
  /**
   * Synchronously translates a phrase if present in active runtime cache.
   * If missing, returns source text and queues background real-time translation fetch.
   */
  static translateSync(text: string, targetLang: 'mr-IN' | 'hi-IN' | 'en-IN'): string {
    if (!text || targetLang === 'en-IN') return text;
    const clean = text.trim();

    if (translationCache[clean] && translationCache[clean][targetLang]) {
      return translationCache[clean][targetLang];
    }

    // Trigger non-blocking background translation so subsequent renders have it
    this.translateAsync(clean, targetLang);
    return clean;
  }

  /**
   * Asynchronously translates a dynamic string or array of strings via /api/translate
   */
  static async translateAsync(text: string, targetLang: 'mr-IN' | 'hi-IN' | 'en-IN'): Promise<string> {
    if (!text || targetLang === 'en-IN') return text;
    const clean = text.trim();

    if (translationCache[clean] && translationCache[clean][targetLang]) {
      return translationCache[clean][targetLang];
    }

    try {
      const translated = await ApiClient.translate(clean, targetLang);
      if (typeof translated === 'string' && translated) {
        if (!translationCache[clean]) translationCache[clean] = {};
        translationCache[clean][targetLang] = translated;
        return translated;
      }
    } catch (e) {
      console.warn('Dynamic translation failed for:', clean, e);
    }

    return clean;
  }

  /**
   * Formats currency amounts in Indian style (₹36,055)
   */
  static formatRupees(amount: number): string {
    return `₹${Math.round(amount).toLocaleString('en-IN')}`;
  }
}
