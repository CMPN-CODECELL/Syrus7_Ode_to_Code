/**
 * Centralized Localization and Translation System for KrishiNirnay.
 * Provides strict language switching between pure Marathi, English, and Hindi.
 * Zero hybrid parenthetical leaks.
 */

import mrDict from './mr.json';
import enDict from './en.json';
import hiDict from './hi.json';

export type LanguageCode = 'mr-IN' | 'hi-IN' | 'en-IN';

const dictionaries: Record<LanguageCode, Record<string, string>> = {
  'mr-IN': mrDict,
  'hi-IN': hiDict,
  'en-IN': enDict
};

/**
 * Translates a given key with optional string parameter replacement.
 */
export function t(
  key: string,
  lang: LanguageCode = 'en-IN',
  params?: Record<string, string | number>
): string {
  const dict = dictionaries[lang] || dictionaries['en-IN'];
  let text = dict[key] || dictionaries['en-IN'][key] || key;

  if (params) {
    Object.entries(params).forEach(([paramKey, paramVal]) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
    });
  }

  return text;
}

/**
 * Standardizes crop names without hybrid parenthetical leaks.
 */
export function localizeCrop(crop: string, lang: LanguageCode = 'en-IN'): string {
  const isTomato = crop.toLowerCase().includes('tomato');
  const isOnion = crop.toLowerCase().includes('onion');

  if (lang === 'mr-IN') {
    if (isTomato) return 'टोमॅटो';
    if (isOnion) return 'कांदा';
    return crop;
  }
  if (lang === 'hi-IN') {
    if (isTomato) return 'टमाटर';
    if (isOnion) return 'प्याज';
    return crop;
  }
  return isTomato ? 'Tomato' : isOnion ? 'Onion' : crop;
}

/**
 * Standardizes mandi names without hybrid parenthetical leaks.
 */
export function localizeMandi(mandi: string, lang: LanguageCode = 'en-IN'): string {
  if (lang === 'mr-IN') {
    if (mandi.includes('Nashik')) return 'नाशिक बाजार समिती';
    if (mandi.includes('Pimpalgaon')) return 'पिंपळगाव बसवंत बाजार समिती';
    if (mandi.includes('Sangamner')) return 'संगमनेर बाजार समिती';
    if (mandi.includes('Pune')) return 'पुणे बाजार समिती';
    return mandi;
  }
  if (lang === 'hi-IN') {
    if (mandi.includes('Nashik')) return 'नासिक मंडी';
    if (mandi.includes('Pimpalgaon')) return 'पिंपलगांव बसवंत मंडी';
    if (mandi.includes('Sangamner')) return 'संगमनेर मंडी';
    if (mandi.includes('Pune')) return 'पुणे मंडी';
    return mandi;
  }
  return mandi;
}

/**
 * Formats currency values cleanly in INR.
 */
export function formatCurrency(amount: number, _lang: LanguageCode = 'en-IN'): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

/**
 * Localizes action badges (WAIT, SELL_NOW, GO).
 */
export function localizeAction(
  action: 'WAIT' | 'SELL_NOW' | 'GO',
  lang: LanguageCode = 'en-IN',
  waitDays: number = 2
): string {
  if (lang === 'mr-IN') {
    if (action === 'WAIT') return `${waitDays} दिवस थांबा`;
    if (action === 'GO') return 'दुसऱ्या बाजारात जा';
    return 'आजच विक्री करा';
  }
  if (lang === 'hi-IN') {
    if (action === 'WAIT') return `${waitDays} दिन रुकें`;
    if (action === 'GO') return 'दूसरी मंडी जाएं';
    return 'आज ही बेचें';
  }
  if (action === 'WAIT') return `Wait ${waitDays} Days`;
  if (action === 'GO') return 'Go to Alternative Mandi';
  return 'Sell Today';
}
