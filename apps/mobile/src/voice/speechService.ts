/**
 * Mobile Speech Service for Native Text-to-Speech using expo-speech.
 */

import * as Speech from 'expo-speech';

export class MobileSpeechService {
  static async speak(text: string, language: string = 'mr-IN') {
    try {
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        await Speech.stop();
      }

      // Map language code to expo-speech voice locale
      const voiceLang = language === 'mr-IN' ? 'mr-IN' : (language === 'hi-IN' ? 'hi-IN' : 'en-IN');

      Speech.speak(text, {
        language: voiceLang,
        pitch: 1.0,
        rate: 0.95,
      });
    } catch (e) {
      console.warn('Expo Speech error:', e);
    }
  }

  static async stop() {
    try {
      await Speech.stop();
    } catch (e) {
      console.warn('Expo Speech stop error:', e);
    }
  }
}
