/**
 * Centralized Localization and Translation System for KrishiNirnay.
 * Provides strict 2-language switching between pure Marathi and English.
 * Eliminates all Hindi options and hybrid parenthetical leaks.
 */

import mrDict from './mr.json';
import enDict from './en.json';

export type LanguageCode = 'mr-IN' | 'en-IN';

const dictionaries: Record<LanguageCode, Record<string, string>> = {
  'mr-IN': mrDict,
  'en-IN': enDict
};

/**
 * Returns localized branding wordmark, tagline, and description.
 */
export function getLocalizedBrand(lang: LanguageCode = 'en-IN') {
  if (lang === 'mr-IN') {
    return {
      wordmark: 'कृषिनिर्णय',
      tagline: 'योग्य भावात, समृद्धीच्या वाटेवर.',
      description: 'केवळ बाजार भाव नव्हे, तर गाडी भाडे व नासाडी वजा करून शेतकऱ्याचा खरा निव्वळ नफा ठरवणारे सोपे ॲप.'
    };
  }
  return {
    wordmark: 'KrishiNirnay',
    tagline: 'From Right Price to Prosperity.',
    description: 'Not just market prices, but factoring freight and perishability to maximize your true pocket realization.'
  };
}

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
  if (action === 'WAIT') return `Wait ${waitDays} Days`;
  if (action === 'GO') return 'Go to Alternative Mandi';
  return 'Sell Today';
}
