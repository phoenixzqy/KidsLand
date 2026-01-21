import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getVoiceSettings, updateVoiceSettings } from '../db/database';
import type { VoiceSettings } from '../types';

interface UseVoiceSettingsReturn {
  settings: VoiceSettings | null;
  availableVoices: SpeechSynthesisVoice[];
  updateSettings: (settings: Partial<Omit<VoiceSettings, 'id'>>) => Promise<void>;
  isLoading: boolean;
  testVoice: (voiceName: string | null) => void;
}

export function useVoiceSettings(): UseVoiceSettingsReturn {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Live query for voice settings
  const settings = useLiveQuery(() => db.voiceSettings.get('default'));

  // Initialize settings if not exists
  useEffect(() => {
    getVoiceSettings().then(() => setIsLoading(false));
  }, []);

  // Load available voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    // Novelty/strange voice patterns to exclude
    const excludedPatterns = [
      /grandma/i,
      /grandpa/i,
      /grandmother/i,
      /grandfather/i,
      /granny/i,
      /whisper/i,
      /robot/i,
      /alien/i,
      /monster/i,
      /child/i,
      /baby/i,
      /cartoon/i,
      /funny/i,
      /novelty/i,
      /effect/i,
      /enhanced/i,
      /bells/i,
      /organ/i,
      /wobble/i,
      /bubbles/i,
      /jester/i,
      /bad news/i,
      /good news/i,
      /superstar/i,
      /trinoids/i,
      /hysterical/i,
      /junior/i,
      /princess/i,
      /prince/i,
      /zarvox/i,
      /cellos/i,
      /pipe organ/i,
      /boing/i,
      /deranged/i,
    ];

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      // Filter to English voices only and exclude novelty/strange voices
      const englishVoices = voices.filter(v => {
        // Must be English language
        if (!v.lang.startsWith('en')) return false;
        // Exclude novelty/strange voices
        const isNovelty = excludedPatterns.some(pattern => pattern.test(v.name));
        return !isNovelty;
      });
      setAvailableVoices(englishVoices);
    };

    // Try loading immediately
    loadVoices();

    // Also listen for voices changed event
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const update = useCallback(async (newSettings: Partial<Omit<VoiceSettings, 'id'>>) => {
    await updateVoiceSettings(newSettings);
  }, []);

  const testVoice = useCallback((voiceName: string | null) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance('Hello! This is how I sound.');
    utterance.rate = settings?.rate ?? 0.85;
    utterance.pitch = settings?.pitch ?? 1.0;
    utterance.lang = 'en-US';

    if (voiceName) {
      const voice = availableVoices.find(v => v.name === voiceName);
      if (voice) {
        utterance.voice = voice;
      }
    } else {
      // Use Google US English as default
      const googleUsVoice = availableVoices.find(v => v.name === 'Google US English');
      if (googleUsVoice) {
        utterance.voice = googleUsVoice;
      }
    }

    window.speechSynthesis.speak(utterance);
  }, [availableVoices, settings]);

  return {
    settings: settings ?? null,
    availableVoices,
    updateSettings: update,
    isLoading,
    testVoice
  };
}
