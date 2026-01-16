import { useCallback, useRef, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getVoiceSettings } from '../db/database';

interface UseSpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

interface UseSpeechReturn {
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

export function useSpeech(options: UseSpeechOptions = {}): UseSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Load persisted voice settings from database
  const voiceSettings = useLiveQuery(() => db.voiceSettings.get('default'));

  // Initialize voice settings
  useEffect(() => {
    getVoiceSettings();
  }, []);

  const {
    rate = voiceSettings?.rate ?? 0.85, // Use saved rate or default
    pitch = voiceSettings?.pitch ?? 1.0, // Use saved pitch or default
    volume = 1,
    lang = 'en-US'
  } = options;

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Load voices
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [isSupported]);

  // Find the best voice - prioritize Google US English
  const findBestVoice = useCallback((availableVoices: SpeechSynthesisVoice[]) => {
    // If user has selected a specific voice, use it
    if (voiceSettings?.voiceName) {
      const selectedVoice = availableVoices.find(v => v.name === voiceSettings.voiceName);
      if (selectedVoice) return selectedVoice;
    }

    // Default to Google US English
    const googleUsVoice = availableVoices.find(v => v.name === 'Google US English');
    if (googleUsVoice) return googleUsVoice;

    // Fallback to any Google English voice
    const googleVoice = availableVoices.find(v => v.name.startsWith('Google') && v.lang.startsWith('en'));
    if (googleVoice) return googleVoice;

    // Final fallback to any English voice
    return availableVoices.find(v => v.lang.startsWith('en'));
  }, [voiceSettings?.voiceName]);

  const speak = useCallback((text: string) => {
    if (!isSupported) {
      console.warn('Speech synthesis is not supported in this browser');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // Use saved settings, fallback to options, then defaults
    utterance.rate = voiceSettings?.rate ?? rate;
    utterance.pitch = voiceSettings?.pitch ?? pitch;
    utterance.volume = volume;
    utterance.lang = lang;

    // Get the best available voice
    const bestVoice = findBestVoice(voices);

    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, rate, pitch, volume, lang, findBestVoice, voices, voiceSettings]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  return { speak, stop, isSpeaking, isSupported };
}

// Preload voices (call this early in the app)
export function preloadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    // Wait for voices to load
    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices());
    };

    // Timeout fallback
    setTimeout(() => {
      resolve(window.speechSynthesis.getVoices());
    }, 1000);
  });
}
