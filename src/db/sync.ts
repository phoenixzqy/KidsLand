import { db } from './database';
import type { DataVersion, Word, Prize } from '../types';

// Import static data
import wordsData from '../data/words.json';
import prizesData from '../data/prizes.json';
import versionData from '../data/version.json';

interface WordsDataFile {
  words: Word[];
}

interface PrizesDataFile {
  prizes: Prize[];
}

// Get the static data
export function getWords(): Word[] {
  return (wordsData as WordsDataFile).words;
}

export function getPrizes(): Prize[] {
  return (prizesData as PrizesDataFile).prizes;
}

export function getDataVersion(): DataVersion {
  return versionData as DataVersion;
}

// Check and sync data on app load
export async function syncDataIfNeeded(): Promise<{
  wordsUpdated: boolean;
  prizesUpdated: boolean;
}> {
  const currentVersion = getDataVersion();
  let wordsUpdated = false;
  let prizesUpdated = false;

  // Check words version
  const wordsSyncMeta = await db.syncMeta.get('words');
  if (!wordsSyncMeta || wordsSyncMeta.version < currentVersion.words) {
    // Words data has been updated - just update sync meta
    // The actual words come from the static JSON, no need to store in IndexedDB
    await db.syncMeta.put({
      key: 'words',
      version: currentVersion.words,
      lastSynced: new Date()
    });
    wordsUpdated = true;
    console.log(`Words data synced to version ${currentVersion.words}`);
  }

  // Check prizes version
  const prizesSyncMeta = await db.syncMeta.get('prizes');
  if (!prizesSyncMeta || prizesSyncMeta.version < currentVersion.prizes) {
    // Prizes data has been updated
    await db.syncMeta.put({
      key: 'prizes',
      version: currentVersion.prizes,
      lastSynced: new Date()
    });
    prizesUpdated = true;
    console.log(`Prizes data synced to version ${currentVersion.prizes}`);
  }

  return { wordsUpdated, prizesUpdated };
}

// Helper to get a single word by ID
export function getWordById(wordId: string): Word | undefined {
  return getWords().find(w => w.id === wordId);
}

// Helper to get a single prize by ID
export function getPrizeById(prizeId: string): Prize | undefined {
  return getPrizes().find(p => p.id === prizeId);
}

// Get prizes by type
export function getPrizesByType(type: 'card' | 'skin' | 'badge'): Prize[] {
  return getPrizes().filter(p => p.type === type);
}

// Get prizes by collection (for cards)
export function getPrizesByCollection(collection: string): Prize[] {
  return getPrizes().filter(p => p.type === 'card' && p.collection === collection);
}
