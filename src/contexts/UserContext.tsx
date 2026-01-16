import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  db, 
  initializeUser, 
  addStars as dbAddStars, 
  spendStars as dbSpendStars, 
  sellItem as dbSellItem,
  incrementQuizzesCompleted as dbIncrementQuizzes,
  claimAchievement as dbClaimAchievement,
  getClaimedAchievements as dbGetClaimedAchievements
} from '../db/database';
import type { UserProfile, WordProgress, OwnedItem } from '../types';

// State type
interface UserState {
  profile: UserProfile | null;
  wordProgress: WordProgress[];
  ownedItems: OwnedItem[];
  claimedAchievements: string[];
  isLoading: boolean;
  error: string | null;
}

// Action types
type UserAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROFILE'; payload: UserProfile | null }
  | { type: 'SET_WORD_PROGRESS'; payload: WordProgress[] }
  | { type: 'SET_OWNED_ITEMS'; payload: OwnedItem[] }
  | { type: 'SET_CLAIMED_ACHIEVEMENTS'; payload: string[] };

// Initial state
const initialState: UserState = {
  profile: null,
  wordProgress: [],
  ownedItems: [],
  claimedAchievements: [],
  isLoading: true,
  error: null
};

// Reducer
function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_PROFILE':
      return { ...state, profile: action.payload };
    case 'SET_WORD_PROGRESS':
      return { ...state, wordProgress: action.payload };
    case 'SET_OWNED_ITEMS':
      return { ...state, ownedItems: action.payload };
    case 'SET_CLAIMED_ACHIEVEMENTS':
      return { ...state, claimedAchievements: action.payload };
    default:
      return state;
  }
}

// Context type
interface UserContextType {
  state: UserState;
  stars: number;
  ownedItems: OwnedItem[];
  masteredWordsCount: number;
  quizzesCompleted: number;
  claimedAchievements: string[];
  addStars: (amount: number) => Promise<void>;
  spendStars: (amount: number) => Promise<boolean>;
  sellItem: (prizeId: string, refundAmount: number) => Promise<boolean>;
  incrementQuizzesCompleted: () => Promise<void>;
  claimAchievement: (achievementId: string, starsReward: number) => Promise<boolean>;
  getWordProgress: (wordId: string) => WordProgress | undefined;
  isItemOwned: (prizeId: string) => boolean;
  isAchievementClaimed: (achievementId: string) => boolean;
  refreshData: () => void;
}

// Create context
const UserContext = createContext<UserContextType | null>(null);

// Provider component
export function UserProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(userReducer, initialState);

  // Live query for user profile
  const profile = useLiveQuery(() => db.userProfile.get('default'));

  // Live query for word progress
  const wordProgress = useLiveQuery(() => db.wordProgress.toArray());

  // Live query for owned items
  const ownedItems = useLiveQuery(() => db.ownedItems.toArray());

  // Live query for claimed achievements
  const claimedAchievementsData = useLiveQuery(() => db.claimedAchievements.toArray());

  // Initialize user on mount
  useEffect(() => {
    const init = async () => {
      try {
        await initializeUser();
        const claimed = await dbGetClaimedAchievements();
        dispatch({ type: 'SET_CLAIMED_ACHIEVEMENTS', payload: claimed });
        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize user' });
        console.error('Failed to initialize user:', error);
      }
    };
    init();
  }, []);

  // Update state when live queries change
  useEffect(() => {
    if (profile !== undefined) {
      dispatch({ type: 'SET_PROFILE', payload: profile ?? null });
    }
  }, [profile]);

  useEffect(() => {
    if (wordProgress !== undefined) {
      dispatch({ type: 'SET_WORD_PROGRESS', payload: wordProgress });
    }
  }, [wordProgress]);

  useEffect(() => {
    if (ownedItems !== undefined) {
      dispatch({ type: 'SET_OWNED_ITEMS', payload: ownedItems });
    }
  }, [ownedItems]);

  useEffect(() => {
    if (claimedAchievementsData !== undefined) {
      dispatch({ type: 'SET_CLAIMED_ACHIEVEMENTS', payload: claimedAchievementsData.map(a => a.achievementId) });
    }
  }, [claimedAchievementsData]);

  // Actions
  const addStars = async (amount: number) => {
    try {
      await dbAddStars(amount);
    } catch (error) {
      console.error('Failed to add stars:', error);
    }
  };

  const spendStars = async (amount: number): Promise<boolean> => {
    try {
      return await dbSpendStars(amount);
    } catch (error) {
      console.error('Failed to spend stars:', error);
      return false;
    }
  };

  const sellItem = async (prizeId: string, refundAmount: number): Promise<boolean> => {
    try {
      const sold = await dbSellItem(prizeId);
      if (sold) {
        await dbAddStars(refundAmount);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to sell item:', error);
      return false;
    }
  };

  const getWordProgress = (wordId: string): WordProgress | undefined => {
    return state.wordProgress.find(wp => wp.wordId === wordId);
  };

  const isItemOwned = (prizeId: string): boolean => {
    return state.ownedItems.some(item => item.prizeId === prizeId);
  };

  const isAchievementClaimed = (achievementId: string): boolean => {
    return state.claimedAchievements.includes(achievementId);
  };

  const incrementQuizzesCompleted = async (): Promise<void> => {
    try {
      await dbIncrementQuizzes();
    } catch (error) {
      console.error('Failed to increment quizzes:', error);
    }
  };

  const claimAchievement = async (achievementId: string, starsReward: number): Promise<boolean> => {
    try {
      const claimed = await dbClaimAchievement(achievementId);
      if (claimed) {
        await dbAddStars(starsReward);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to claim achievement:', error);
      return false;
    }
  };

  // Computed values
  const masteredWordsCount = state.wordProgress.filter(wp => wp.mastered).length;
  
  // Calculate quizzes completed from both the counter AND existing word progress data
  // This ensures existing users get credit for past quizzes
  const quizzesFromProgress = state.wordProgress.reduce((total, wp) => {
    return total + (wp.passedQuizTypes?.length || 0);
  }, 0);
  const quizzesFromCounter = state.profile?.quizzesCompleted ?? 0;
  // Use the maximum of the two to account for existing progress
  const quizzesCompleted = Math.max(quizzesFromProgress, quizzesFromCounter);

  const refreshData = () => {
    // Live queries auto-refresh, but this can be used to trigger manual refresh if needed
    dispatch({ type: 'SET_LOADING', payload: true });
    setTimeout(() => dispatch({ type: 'SET_LOADING', payload: false }), 100);
  };

  const value: UserContextType = {
    state,
    stars: state.profile?.stars ?? 0,
    ownedItems: state.ownedItems,
    masteredWordsCount,
    quizzesCompleted,
    claimedAchievements: state.claimedAchievements,
    addStars,
    spendStars,
    sellItem,
    incrementQuizzesCompleted,
    claimAchievement,
    getWordProgress,
    isItemOwned,
    isAchievementClaimed,
    refreshData
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// Hook to use the context
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
