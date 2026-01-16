import { db } from './database';
import type { DataVersion, Word, Prize } from '../types';

// Import static data - words split by alphabet
import wordsA from '../data/words/a.json';
import wordsB from '../data/words/b.json';
import wordsC from '../data/words/c.json';
import wordsD from '../data/words/d.json';
import wordsE from '../data/words/e.json';
import wordsF from '../data/words/f.json';
import wordsG from '../data/words/g.json';
import wordsH from '../data/words/h.json';
import wordsI from '../data/words/i.json';
import wordsJ from '../data/words/j.json';
import wordsK from '../data/words/k.json';
import wordsL from '../data/words/l.json';
import wordsM from '../data/words/m.json';
import wordsN from '../data/words/n.json';
import wordsO from '../data/words/o.json';
import wordsP from '../data/words/p.json';
import wordsR from '../data/words/r.json';
import wordsS from '../data/words/s.json';
import wordsT from '../data/words/t.json';
import wordsU from '../data/words/u.json';
import wordsV from '../data/words/v.json';
import wordsW from '../data/words/w.json';
import wordsY from '../data/words/y.json';
import prizesData from '../data/prizes.json';
import versionData from '../data/version.json';

// Combine all words from alphabet files
const allWords: Word[] = [
  ...wordsA.words,
  ...wordsB.words,
  ...wordsC.words,
  ...wordsD.words,
  ...wordsE.words,
  ...wordsF.words,
  ...wordsG.words,
  ...wordsH.words,
  ...wordsI.words,
  ...wordsJ.words,
  ...wordsK.words,
  ...wordsL.words,
  ...wordsM.words,
  ...wordsN.words,
  ...wordsO.words,
  ...wordsP.words,
  ...wordsR.words,
  ...wordsS.words,
  ...wordsT.words,
  ...wordsU.words,
  ...wordsV.words,
  ...wordsW.words,
  ...wordsY.words,
];

interface PrizesDataFile {
  prizes: Prize[];
}

// Get the static data
export function getWords(): Word[] {
  return allWords;
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
