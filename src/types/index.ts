// Word data types
export interface Word {
  id: string;
  word: string;
  sentences: Sentence[];
}

export interface Sentence {
  text: string;
  highlightIndex: number; // Index of the word in the sentence (for highlighting)
}

// User progress types
export interface WordProgress {
  wordId: string;
  timesStudied: number;
  lastStudied: Date;
  quizzesPassed: number;
  mastered: boolean;
}

// User profile
export interface UserProfile {
  id: 'default';
  stars: number;
  totalStarsEarned: number;
  createdAt: Date;
}

// Prize/Market types
export type PrizeType = 'card' | 'skin' | 'badge';
export type SkinTarget = 'button' | 'card' | 'background' | 'header';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type CardCollection = 'ultraman' | 'minecraft' | 'pokemon';

export interface Prize {
  id: string;
  type: PrizeType;
  name: string;
  description?: string;
  image: string;
  cost: number;
  // Card-specific
  collection?: CardCollection;
  rarity?: Rarity;
  // Skin-specific
  target?: SkinTarget;
  // Badge-specific
  unlockCondition?: string;
}

// Owned items
export interface OwnedItem {
  id: string;
  prizeId: string;
  purchasedAt: Date;
  equipped: boolean;
}

// Sync metadata
export interface SyncMeta {
  key: 'words' | 'prizes';
  version: number;
  lastSynced: Date;
}

// Quiz types
export type QuizType = 'spelling' | 'pronunciation' | 'sentence';
export type DifficultyLevel = 'easy' | 'hard';

export interface QuizQuestion {
  type: QuizType;
  wordId: string;
  word: string;
  // For sentence fill-in
  sentence?: string;
  blankIndex?: number;
  // For multiple choice (optional alternative)
  options?: string[];
  correctAnswer: string;
}

export interface QuizResult {
  questionId: string;
  correct: boolean;
  timeSpent: number; // in milliseconds
  userAnswer: string;
}

export interface QuizSession {
  id: string;
  type: QuizType;
  difficulty: DifficultyLevel;
  questions: QuizQuestion[];
  results: QuizResult[];
  startedAt: Date;
  completedAt?: Date;
  starsEarned: number;
}

// Theme/Skin types
export interface EquippedSkins {
  button?: string; // Prize ID or null
  card?: string;
  background?: string;
  header?: string;
}

// Data version for sync
export interface DataVersion {
  words: number;
  prizes: number;
}
