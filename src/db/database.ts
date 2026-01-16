import Dexie, { type EntityTable } from 'dexie';
import type { WordProgress, UserProfile, OwnedItem, SyncMeta } from '../types';

// Define the database
export class KidsLandDB extends Dexie {
  wordProgress!: EntityTable<WordProgress, 'wordId'>;
  userProfile!: EntityTable<UserProfile, 'id'>;
  ownedItems!: EntityTable<OwnedItem, 'id'>;
  syncMeta!: EntityTable<SyncMeta, 'key'>;

  constructor() {
    super('KidsLandDB');

    this.version(1).stores({
      wordProgress: 'wordId',
      userProfile: 'id',
      ownedItems: 'id, prizeId',
      syncMeta: 'key'
    });
  }
}

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

// Word progress management
export async function updateWordProgress(wordId: string, passed: boolean): Promise<void> {
  const existing = await db.wordProgress.get(wordId);

  if (existing) {
    await db.wordProgress.update(wordId, {
      timesStudied: existing.timesStudied + 1,
      lastStudied: new Date(),
      quizzesPassed: passed ? existing.quizzesPassed + 1 : existing.quizzesPassed,
      mastered: passed && existing.quizzesPassed >= 2 // Master after 3 correct quizzes
    });
  } else {
    await db.wordProgress.add({
      wordId,
      timesStudied: 1,
      lastStudied: new Date(),
      quizzesPassed: passed ? 1 : 0,
      mastered: false
    });
  }
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
