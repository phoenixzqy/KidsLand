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

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      // Filter to Google English voices only
      const googleVoices = voices.filter(v => v.name.startsWith('Google') && v.lang.startsWith('en'));
      setAvailableVoices(googleVoices);
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
