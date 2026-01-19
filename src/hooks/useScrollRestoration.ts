import { useEffect, useRef, useCallback } from 'react';

interface ScrollState {
  scrollY: number;
  timestamp: number;
}

interface FilterState {
  selectedLetter: string | null;
  searchQuery: string;
}

interface WordListState extends ScrollState, FilterState {}

const STORAGE_KEY = 'wordListState';
const STATE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Hook to save and restore scroll position and filter state for the word list page.
 * State is preserved when navigating to word detail and back.
 */
export function useWordListScrollRestoration(
  selectedLetter: string | null,
  searchQuery: string,
  setSelectedLetter: (letter: string | null) => void,
  setSearchQuery: (query: string) => void
) {
  const isRestored = useRef(false);
  const scrollRestoreAttempted = useRef(false);

  // Save current state to sessionStorage
  const saveState = useCallback(() => {
    const state: WordListState = {
      scrollY: window.scrollY,
      selectedLetter,
      searchQuery,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [selectedLetter, searchQuery]);

  // Restore state from sessionStorage
  const restoreState = useCallback((): WordListState | null => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const state: WordListState = JSON.parse(stored);

      // Check if state has expired
      if (Date.now() - state.timestamp > STATE_EXPIRY_MS) {
        sessionStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return state;
    } catch {
      return null;
    }
  }, []);

  // Clear saved state
  const clearState = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  // Restore filter state on mount (only once)
  useEffect(() => {
    if (isRestored.current) return;
    isRestored.current = true;

    const savedState = restoreState();
    if (savedState) {
      // Restore filter state
      if (savedState.selectedLetter !== null) {
        setSelectedLetter(savedState.selectedLetter);
      }
      if (savedState.searchQuery) {
        setSearchQuery(savedState.searchQuery);
      }
    }
  }, [restoreState, setSelectedLetter, setSearchQuery]);

  // Restore scroll position after filters are applied and content is rendered
  useEffect(() => {
    if (scrollRestoreAttempted.current) return;

    const savedState = restoreState();
    if (savedState && savedState.scrollY > 0) {
      // Use requestAnimationFrame to ensure DOM has updated
      const restoreScroll = () => {
        scrollRestoreAttempted.current = true;
        // Small delay to ensure content has rendered
        setTimeout(() => {
          window.scrollTo({
            top: savedState.scrollY,
            behavior: 'instant',
          });
        }, 50);
      };

      requestAnimationFrame(restoreScroll);
    } else {
      scrollRestoreAttempted.current = true;
    }
  }, [restoreState]);

  // Save state before navigating away
  useEffect(() => {
    const handleBeforeUnload = () => saveState();

    // Save on any click that might navigate away (links to word details)
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (link && link.href.includes('/words/')) {
        saveState();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleClick, true);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick, true);
    };
  }, [saveState]);

  return { saveState, clearState };
}

/**
 * Hook to scroll to top when component mounts or when dependencies change.
 * Used for detail pages that should always start at the top.
 * @param deps - Optional dependencies that trigger scroll to top when changed (e.g., wordId)
 */
export function useScrollToTop(deps: unknown[] = []) {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'instant',
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
