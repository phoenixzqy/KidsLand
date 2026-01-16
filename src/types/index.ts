// Word data types
export interface Word {
  id: string;
  word: string;
  meaning?: string; // Kid-friendly explanation of the word
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
  // Track which quiz types have been passed for this word
  passedQuizTypes: QuizType[];
  mastered: boolean; // True when all 3 quiz types passed
}

// User profile
export interface UserProfile {
  id: 'default';
  stars: number;
  totalStarsEarned: number;
  quizzesCompleted: number; // Track total quizzes completed for achievements
  createdAt: Date;
}

// Achievement tracking
export interface ClaimedAchievement {
  id: string;
  achievementId: string;
  claimedAt: Date;
}

// Prize/Market types
export type PrizeType = 'card' | 'skin' | 'badge';
export type SkinTarget = 'button' | 'card' | 'background' | 'header';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type CardCollection = 'minecraft' | 'princess';

// Card categories for Minecraft renders
export type CardCategory = 'mobs' | 'tools' | 'weapons';
export type MobSubcategory = 'bosses' | 'hostile' | 'neutral' | 'passive' | 'villagers';

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
  category?: CardCategory;
  subcategory?: MobSubcategory;
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

// Voice settings
export interface VoiceSettings {
  id: 'default';
  voiceName: string | null; // null means auto-select
  rate: number;
  pitch: number;
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
  avatar?: string; // Equipped card as avatar
}

// Data version for sync
export interface DataVersion {
  words: number;
  prizes: number;
}
