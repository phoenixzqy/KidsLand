import Dexie, { type EntityTable } from 'dexie';
import type { WordProgress, UserProfile, OwnedItem, SyncMeta, QuizType, VoiceSettings } from '../types';

// All quiz types that need to be passed to master a word
const ALL_QUIZ_TYPES: QuizType[] = ['spelling', 'pronunciation', 'sentence'];

// Define the database
export class KidsLandDB extends Dexie {
  wordProgress!: EntityTable<WordProgress, 'wordId'>;
  userProfile!: EntityTable<UserProfile, 'id'>;
  ownedItems!: EntityTable<OwnedItem, 'id'>;
  syncMeta!: EntityTable<SyncMeta, 'key'>;
  voiceSettings!: EntityTable<VoiceSettings, 'id'>;

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
    return existing;
  }

  const newProfile: UserProfile = {
    id: 'default',
    stars: 0,
    totalStarsEarned: 0,
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
