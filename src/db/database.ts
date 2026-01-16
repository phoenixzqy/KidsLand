import Dexie, { type EntityTable } from 'dexie';
import type { WordProgress, UserProfile, OwnedItem, SyncMeta, QuizType, VoiceSettings, ClaimedAchievement } from '../types';
import type { Deck, MatchRecord, CardGameStats } from '../types/cardGame';

// All quiz types that need to be passed to master a word
const ALL_QUIZ_TYPES: QuizType[] = ['spelling', 'pronunciation', 'sentence'];

// Define the database
export class KidsLandDB extends Dexie {
  wordProgress!: EntityTable<WordProgress, 'wordId'>;
  userProfile!: EntityTable<UserProfile, 'id'>;
  ownedItems!: EntityTable<OwnedItem, 'id'>;
  syncMeta!: EntityTable<SyncMeta, 'key'>;
  voiceSettings!: EntityTable<VoiceSettings, 'id'>;
  claimedAchievements!: EntityTable<ClaimedAchievement, 'id'>;
  // Card game tables
  cardGameDecks!: EntityTable<Deck, 'id'>;
  cardGameMatches!: EntityTable<MatchRecord, 'id'>;
  cardGameStats!: EntityTable<CardGameStats, 'id'>;

  constructor() {
    super('KidsLandDB');

    this.version(1).stores({
      wordProgress: 'wordId',
      userProfile: 'id',
      ownedItems: 'id, prizeId',
      syncMeta: 'key'
    });

    // Add voice settings table
    this.version(2).stores({
      wordProgress: 'wordId',
      userProfile: 'id',
      ownedItems: 'id, prizeId',
      syncMeta: 'key',
      voiceSettings: 'id'
    });

    // Add claimed achievements table
    this.version(3).stores({
      wordProgress: 'wordId',
      userProfile: 'id',
      ownedItems: 'id, prizeId',
      syncMeta: 'key',
      voiceSettings: 'id',
      claimedAchievements: 'id, achievementId'
    });

    // Add card game tables
    this.version(4).stores({
      wordProgress: 'wordId',
      userProfile: 'id',
      ownedItems: 'id, prizeId',
      syncMeta: 'key',
      voiceSettings: 'id',
      claimedAchievements: 'id, achievementId',
      cardGameDecks: 'id, name',
      cardGameMatches: 'id, playedAt, deckId',
      cardGameStats: 'id'
    });
  }
}

// Default voice settings
const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  id: 'default',
  voiceName: 'Google US English',
  rate: 0.85,
  pitch: 1.0
};

// Create the database instance
export const db = new KidsLandDB();

// Initialize user profile if it doesn't exist
export async function initializeUser(): Promise<UserProfile> {
  const existing = await db.userProfile.get('default');
  if (existing) {
    // Migrate existing profile to include quizzesCompleted if missing
    if (existing.quizzesCompleted === undefined) {
      await db.userProfile.update('default', { quizzesCompleted: 0 });
      return { ...existing, quizzesCompleted: 0 };
    }
    return existing;
  }

  const newProfile: UserProfile = {
    id: 'default',
    stars: 0,
    totalStarsEarned: 0,
    quizzesCompleted: 0,
    createdAt: new Date()
  };

  await db.userProfile.add(newProfile);
  return newProfile;
}

// Voice settings management
export async function getVoiceSettings(): Promise<VoiceSettings> {
  const existing = await db.voiceSettings.get('default');
  if (existing) {
    return existing;
  }
  // Initialize with defaults
  await db.voiceSettings.add(DEFAULT_VOICE_SETTINGS);
  return DEFAULT_VOICE_SETTINGS;
}

export async function updateVoiceSettings(settings: Partial<Omit<VoiceSettings, 'id'>>): Promise<VoiceSettings> {
  const existing = await db.voiceSettings.get('default');
  if (!existing) {
    const newSettings = { ...DEFAULT_VOICE_SETTINGS, ...settings };
    await db.voiceSettings.add(newSettings);
    return newSettings;
  }
  
  const updated = { ...existing, ...settings };
  await db.voiceSettings.update('default', settings);
  return updated;
}

// Star management
export async function addStars(amount: number): Promise<number> {
  const profile = await db.userProfile.get('default');
  if (!profile) {
    throw new Error('User profile not found');
  }

  const newStars = profile.stars + amount;
  const newTotal = profile.totalStarsEarned + amount;

  await db.userProfile.update('default', {
    stars: newStars,
    totalStarsEarned: newTotal
  });

  return newStars;
}

export async function spendStars(amount: number): Promise<boolean> {
  const profile = await db.userProfile.get('default');
  if (!profile || profile.stars < amount) {
    return false;
  }

  await db.userProfile.update('default', {
    stars: profile.stars - amount
  });

  return true;
}

// Word progress management - legacy function for general quizzes
export async function updateWordProgress(wordId: string, passed: boolean): Promise<void> {
  const existing = await db.wordProgress.get(wordId);

  if (existing) {
    await db.wordProgress.update(wordId, {
      timesStudied: existing.timesStudied + 1,
      lastStudied: new Date(),
      quizzesPassed: passed ? existing.quizzesPassed + 1 : existing.quizzesPassed,
      mastered: existing.mastered // Don't change mastery status here
    });
  } else {
    await db.wordProgress.add({
      wordId,
      timesStudied: 1,
      lastStudied: new Date(),
      quizzesPassed: passed ? 1 : 0,
      passedQuizTypes: [],
      mastered: false
    });
  }
}

// Update word progress for a specific quiz type - used in word-specific quiz flow
export async function updateWordQuizProgress(
  wordId: string,
  quizType: QuizType,
  passed: boolean
): Promise<{ mastered: boolean; newlyMastered: boolean }> {
  const existing = await db.wordProgress.get(wordId);

  if (existing) {
    const passedQuizTypes = [...(existing.passedQuizTypes || [])];

    // Add quiz type to passed list if passed and not already there
    if (passed && !passedQuizTypes.includes(quizType)) {
      passedQuizTypes.push(quizType);
    }

    // Check if all quiz types are now passed
    const allPassed = ALL_QUIZ_TYPES.every(type => passedQuizTypes.includes(type));
    const newlyMastered = allPassed && !existing.mastered;

    await db.wordProgress.update(wordId, {
      timesStudied: existing.timesStudied + 1,
      lastStudied: new Date(),
      quizzesPassed: passed ? existing.quizzesPassed + 1 : existing.quizzesPassed,
      passedQuizTypes,
      mastered: allPassed
    });

    return { mastered: allPassed, newlyMastered };
  } else {
    const passedQuizTypes = passed ? [quizType] : [];
    const mastered = passedQuizTypes.length === ALL_QUIZ_TYPES.length; // Only if single type is all types

    await db.wordProgress.add({
      wordId,
      timesStudied: 1,
      lastStudied: new Date(),
      quizzesPassed: passed ? 1 : 0,
      passedQuizTypes,
      mastered
    });

    return { mastered, newlyMastered: mastered };
  }
}

// Get the next quiz type that hasn't been passed for a word
export async function getNextQuizTypeForWord(wordId: string): Promise<QuizType | null> {
  const existing = await db.wordProgress.get(wordId);
  const passedTypes = existing?.passedQuizTypes || [];

  for (const type of ALL_QUIZ_TYPES) {
    if (!passedTypes.includes(type)) {
      return type;
    }
  }

  return null; // All quiz types passed
}

// Get remaining quiz types for a word
export async function getRemainingQuizTypesForWord(wordId: string): Promise<QuizType[]> {
  const existing = await db.wordProgress.get(wordId);
  const passedTypes = existing?.passedQuizTypes || [];

  return ALL_QUIZ_TYPES.filter(type => !passedTypes.includes(type));
}

// Owned items management
export async function purchaseItem(prizeId: string): Promise<OwnedItem | null> {
  // Check if already owned
  const existing = await db.ownedItems.where('prizeId').equals(prizeId).first();
  if (existing) {
    return null; // Already owned
  }

  const newItem: OwnedItem = {
    id: `${prizeId}-${Date.now()}`,
    prizeId,
    purchasedAt: new Date(),
    equipped: false
  };

  await db.ownedItems.add(newItem);
  return newItem;
}

export async function equipItem(itemId: string, _target: string): Promise<void> {
  // Unequip any other item with the same target
  const allItems = await db.ownedItems.toArray();

  for (const item of allItems) {
    if (item.equipped && item.id !== itemId) {
      await db.ownedItems.update(item.id, { equipped: false });
    }
  }

  // Equip the selected item
  await db.ownedItems.update(itemId, { equipped: true });
}

export async function unequipItem(itemId: string): Promise<void> {
  await db.ownedItems.update(itemId, { equipped: false });
}

// Sell an item (returns stars at 60% of original price)
export async function sellItem(prizeId: string): Promise<boolean> {
  // Find the owned item
  const item = await db.ownedItems.where('prizeId').equals(prizeId).first();
  if (!item) {
    return false; // Item not owned
  }

  // Delete the item from owned items
  await db.ownedItems.delete(item.id);
  return true;
}

// Quiz completion tracking
export async function incrementQuizzesCompleted(): Promise<number> {
  const profile = await db.userProfile.get('default');
  if (!profile) {
    throw new Error('User profile not found');
  }

  const newCount = (profile.quizzesCompleted || 0) + 1;
  await db.userProfile.update('default', { quizzesCompleted: newCount });
  return newCount;
}

// Get count of mastered words
export async function getMasteredWordsCount(): Promise<number> {
  const allProgress = await db.wordProgress.toArray();
  return allProgress.filter(wp => wp.mastered).length;
}

// Achievement management
export async function claimAchievement(achievementId: string): Promise<boolean> {
  // Check if already claimed
  const existing = await db.claimedAchievements.where('achievementId').equals(achievementId).first();
  if (existing) {
    return false; // Already claimed
  }

  const claimed = {
    id: `achievement-${achievementId}-${Date.now()}`,
    achievementId,
    claimedAt: new Date()
  };

  await db.claimedAchievements.add(claimed);
  return true;
}

export async function isAchievementClaimed(achievementId: string): Promise<boolean> {
  const existing = await db.claimedAchievements.where('achievementId').equals(achievementId).first();
  return !!existing;
}

export async function getClaimedAchievements(): Promise<string[]> {
  const claimed = await db.claimedAchievements.toArray();
  return claimed.map(c => c.achievementId);
}

// ============================================================================
// Card Game Database Operations
// ============================================================================

// Default card game stats
const DEFAULT_CARD_GAME_STATS: CardGameStats = {
  id: 'default',
  totalGames: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  winsByDifficulty: {
    easy: 0,
    medium: 0,
    hard: 0
  },
  totalStarsEarned: 0,
  totalDamageDealt: 0,
  totalMinionsKilled: 0,
  longestWinStreak: 0,
  currentWinStreak: 0
};

// Deck management
export async function saveDeck(deck: Deck): Promise<Deck> {
  const existing = await db.cardGameDecks.get(deck.id);
  if (existing) {
    await db.cardGameDecks.update(deck.id, {
      ...deck,
      updatedAt: Date.now()
    });
  } else {
    await db.cardGameDecks.add(deck);
  }
  return deck;
}

export async function getDeck(deckId: string): Promise<Deck | undefined> {
  return db.cardGameDecks.get(deckId);
}

export async function getAllDecks(): Promise<Deck[]> {
  return db.cardGameDecks.toArray();
}

export async function deleteDeck(deckId: string): Promise<boolean> {
  const existing = await db.cardGameDecks.get(deckId);
  if (!existing) {
    return false;
  }
  await db.cardGameDecks.delete(deckId);
  return true;
}

export async function createDeck(name: string, cardIds: string[]): Promise<Deck> {
  const deck: Deck = {
    id: `deck-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name,
    cardIds,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  await db.cardGameDecks.add(deck);
  return deck;
}

export async function updateDeck(deckId: string, name: string, cardIds: string[]): Promise<Deck | null> {
  const existing = await db.cardGameDecks.get(deckId);
  if (!existing) {
    return null;
  }
  const updatedDeck = {
    ...existing,
    name,
    cardIds,
    updatedAt: Date.now()
  };
  await db.cardGameDecks.update(deckId, updatedDeck);
  return updatedDeck;
}

// Match history management
export async function saveMatchResult(match: Omit<MatchRecord, 'id'>): Promise<MatchRecord> {
  const fullMatch: MatchRecord = {
    ...match,
    id: `match-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  };

  await db.cardGameMatches.add(fullMatch);

  // Keep only the last 20 matches
  const allMatches = await db.cardGameMatches.orderBy('playedAt').toArray();
  if (allMatches.length > 20) {
    const toDelete = allMatches.slice(0, allMatches.length - 20);
    await db.cardGameMatches.bulkDelete(toDelete.map(m => m.id));
  }

  // Update stats
  await updateCardGameStats(fullMatch);

  return fullMatch;
}

export async function getRecentMatches(limit: number = 20): Promise<MatchRecord[]> {
  return db.cardGameMatches
    .orderBy('playedAt')
    .reverse()
    .limit(limit)
    .toArray();
}

export async function getMatchesByDeck(deckId: string): Promise<MatchRecord[]> {
  return db.cardGameMatches
    .where('deckId')
    .equals(deckId)
    .reverse()
    .toArray();
}

// Card game stats management
export async function getCardGameStats(): Promise<CardGameStats> {
  const existing = await db.cardGameStats.get('default');
  if (existing) {
    return existing;
  }
  // Initialize with defaults
  await db.cardGameStats.add(DEFAULT_CARD_GAME_STATS);
  return DEFAULT_CARD_GAME_STATS;
}

async function updateCardGameStats(match: MatchRecord): Promise<void> {
  const stats = await getCardGameStats();

  const isWin = match.winner === 'player';
  const isLoss = match.winner === 'opponent';
  const isDraw = match.winner === 'draw';

  // Update win streak
  let currentWinStreak = stats.currentWinStreak;
  let longestWinStreak = stats.longestWinStreak;

  if (isWin) {
    currentWinStreak++;
    longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
  } else {
    currentWinStreak = 0;
  }

  // Update wins by difficulty
  const winsByDifficulty = { ...stats.winsByDifficulty };
  if (isWin) {
    winsByDifficulty[match.opponentDifficulty]++;
  }

  await db.cardGameStats.update('default', {
    totalGames: stats.totalGames + 1,
    wins: stats.wins + (isWin ? 1 : 0),
    losses: stats.losses + (isLoss ? 1 : 0),
    draws: stats.draws + (isDraw ? 1 : 0),
    winsByDifficulty,
    totalStarsEarned: stats.totalStarsEarned + match.starsEarned,
    totalDamageDealt: stats.totalDamageDealt + match.damageDealt,
    totalMinionsKilled: stats.totalMinionsKilled + match.minionsKilled,
    currentWinStreak,
    longestWinStreak,
    lastPlayedAt: match.playedAt
  });
}

export async function resetCardGameStats(): Promise<void> {
  await db.cardGameStats.put(DEFAULT_CARD_GAME_STATS);
}
