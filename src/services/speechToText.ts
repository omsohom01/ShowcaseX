/**
 * Speech-to-Text Service (Web Speech API Only)
 * 
 * For native platforms (iOS/Android), we now use Gemini's native audio understanding
 * which is more efficient (1 API call instead of 2) and has better context awareness.
 * See: src/services/gemini.ts -> transcribeAudioWithGemini()
 * 
 * This file only exports Web Speech API functions for browser use.
 * Web Speech API is completely FREE and runs locally in the browser.
 */

import { Platform } from 'react-native';

export type SupportedSpeechLanguage = 'en' | 'hi' | 'bn';

const LANGUAGE_CODES: Record<SupportedSpeechLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  bn: 'bn-IN',
};

// Get window object safely for web platform
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getWindow = (): any => {
  if (Platform.OS !== 'web') return null;
  return typeof globalThis !== 'undefined' ? (globalThis as any) : null;
};

/**
 * Check if Web Speech API is available
 */
export const isWebSpeechAvailable = (): boolean => {
  const win = getWindow();
  if (!win) return false;
  return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
};

/**
 * Use Web Speech API for web platform (browser-native, completely free)
 * This is the preferred method for web - no API calls needed
 */
export const transcribeAudioWeb = (language: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const win = getWindow();
    if (!win) {
      reject(new Error('Web Speech API not available'));
      return;
    }
    
    // @ts-ignore
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      reject(new Error('Speech recognition not supported in this browser'));
      return;
    }
    
    const recognition = new SpeechRecognition();
    const languageCode = LANGUAGE_CODES[language as SupportedSpeechLanguage] || LANGUAGE_CODES.en;
    
    recognition.lang = languageCode;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    let hasResult = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    // Timeout after 10 seconds
    timeoutId = setTimeout(() => {
      recognition.stop();
      if (!hasResult) {
        reject(new Error('Speech recognition timed out'));
      }
    }, 10000);
    
    recognition.onresult = (event: any) => {
      hasResult = true;
      if (timeoutId) clearTimeout(timeoutId);
      const transcript = event.results[0][0].transcript;
      resolve(transcript);
    };
    
    recognition.onerror = (event: any) => {
      if (timeoutId) clearTimeout(timeoutId);
      reject(new Error(event.error || 'Speech recognition failed'));
    };
    
    recognition.onend = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (!hasResult) {
        reject(new Error('No speech detected'));
      }
    };
    
    recognition.start();
  });
};

/**
 * Start live Web Speech recognition (for web platform)
 * Returns a controller to stop recognition
 */
export const startLiveWebSpeechRecognition = (
  language: string,
  onResult: (text: string) => void,
  onError: (error: Error) => void
): { stop: () => void } | null => {
  const win = getWindow();
  if (!win) {
    onError(new Error('Web Speech API not available'));
    return null;
  }
  
  // @ts-ignore
  const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    onError(new Error('Speech recognition not supported'));
    return null;
  }
  
  const recognition = new SpeechRecognition();
  const languageCode = LANGUAGE_CODES[language as SupportedSpeechLanguage] || LANGUAGE_CODES.en;
  
  recognition.lang = languageCode;
  recognition.continuous = true;
  recognition.interimResults = true;
  
  recognition.onresult = (event: any) => {
    const lastResult = event.results[event.results.length - 1];
    if (lastResult.isFinal) {
      onResult(lastResult[0].transcript);
    }
  };
  
  recognition.onerror = (event: any) => {
    onError(new Error(event.error || 'Speech recognition failed'));
  };
  
  recognition.start();
  
  return {
    stop: () => {
      recognition.stop();
    },
  };
};
