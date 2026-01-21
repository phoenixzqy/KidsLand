import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

interface UseSpeechRecognitionReturn {
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
  error: string | null;
}

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const {
    continuous = false,
    interimResults = true,
    lang = 'en-US',
    onResult,
    onError
  } = options;

  // Check for browser support
  const isSupported = typeof window !== 'undefined' && (
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  );

  // Initialize recognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = lang;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);

      if (onResult) {
        onResult(currentTranscript, !!finalTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMessage = event.error || 'Speech recognition error';
      setError(errorMessage);
      setIsListening(false);

      if (onError) {
        onError(errorMessage);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isSupported, continuous, interimResults, lang, onResult, onError]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    setTranscript('');
    setError(null);

    try {
      recognitionRef.current?.start();
    } catch (err) {
      // Recognition might already be started
      console.warn('Failed to start recognition:', err);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    startListening,
    stopListening,
    resetTranscript,
    isListening,
    transcript,
    isSupported,
    error
  };
}

// Utility function to compare spoken word with expected word
export function compareWords(spoken: string, expected: string): {
  isMatch: boolean;
  similarity: number;
} {
  const normalizedSpoken = spoken.toLowerCase().trim();
  const normalizedExpected = expected.toLowerCase().trim();

  // Exact match
  if (normalizedSpoken === normalizedExpected) {
    return { isMatch: true, similarity: 1 };
  }

  // Check if the spoken text contains the expected word as a whole word
  const wordBoundaryRegex = new RegExp(`\\b${escapeRegExp(normalizedExpected)}\\b`, 'i');
  if (wordBoundaryRegex.test(normalizedSpoken)) {
    return { isMatch: true, similarity: 0.95 };
  }

  // Check if the spoken text contains the expected word (substring match)
  if (normalizedSpoken.includes(normalizedExpected)) {
    return { isMatch: true, similarity: 0.9 };
  }

  // Split spoken text into words and check each word
  const spokenWords = normalizedSpoken.split(/\s+/).filter(w => w.length > 0);
  
  // Check each spoken word against the expected word
  for (const word of spokenWords) {
    // Direct match with any word
    if (word === normalizedExpected) {
      return { isMatch: true, similarity: 1 };
    }
    
    // Fuzzy match with individual words
    const wordDistance = levenshteinDistance(word, normalizedExpected);
    const wordMaxLen = Math.max(word.length, normalizedExpected.length);
    const wordSimilarity = wordMaxLen > 0 ? 1 - wordDistance / wordMaxLen : 0;
    
    // High similarity for individual words
    if (wordSimilarity >= 0.75) {
      return { isMatch: true, similarity: wordSimilarity };
    }
  }

  // Check phonetic similarity for single words (common speech recognition mistakes)
  const phoneticMatch = checkPhoneticSimilarity(normalizedSpoken, normalizedExpected);
  if (phoneticMatch.isMatch) {
    return phoneticMatch;
  }

  // Calculate overall Levenshtein distance for fuzzy matching
  const distance = levenshteinDistance(normalizedSpoken, normalizedExpected);
  const maxLen = Math.max(normalizedSpoken.length, normalizedExpected.length);
  const similarity = maxLen > 0 ? 1 - distance / maxLen : 0;

  // Consider it a match if similarity is high enough (allowing for accent/pronunciation variations)
  // Lower threshold for very short words (they're harder to detect accurately)
  const threshold = normalizedExpected.length <= 3 ? 0.6 : 0.65;
  return {
    isMatch: similarity >= threshold,
    similarity
  };
}

// Escape special regex characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Check phonetic similarity for common speech recognition mistakes
function checkPhoneticSimilarity(spoken: string, expected: string): { isMatch: boolean; similarity: number } {
  // Common phonetic variations and mishearings
  const phoneticVariations: Record<string, string[]> = {
    // Numbers that sound similar
    'ten': ['tan', 'tin', 'den', 'then', 'pen'],
    'two': ['to', 'too', 'tu'],
    'four': ['for', 'fore'],
    'one': ['won', 'on', 'juan'],
    'eight': ['ate', 'ait'],
    // Common words with similar sounds
    'the': ['da', 'de', 'duh'],
    'this': ['dis', 'thus'],
    'that': ['dat', 'tat'],
    'they': ['day', 'dey'],
    'there': ['their', 'they\'re', 'dare'],
    'here': ['hear', 'ear'],
    'where': ['wear', 'were', 'ware'],
    'be': ['bee', 'b'],
    'see': ['sea', 'c'],
    'are': ['r', 'our'],
    'you': ['u', 'yu'],
    'why': ['y', 'wai'],
  };

  // Check if expected word has known variations
  const variations = phoneticVariations[expected] || [];
  if (variations.includes(spoken)) {
    return { isMatch: true, similarity: 0.85 };
  }

  // Check reverse - if spoken word is a key and expected is a variation
  for (const [key, vars] of Object.entries(phoneticVariations)) {
    if (key === expected && vars.includes(spoken)) {
      return { isMatch: true, similarity: 0.85 };
    }
  }

  return { isMatch: false, similarity: 0 };
}

// Levenshtein distance algorithm
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}
