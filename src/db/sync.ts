import { db, addStars } from './database';
import type { DataVersion, Word, Prize, CardCategory, MobSubcategory } from '../types';

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
    // Prizes data has been updated - handle migration
    await migratePrizes();
    
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

// Migrate prizes: refund stars for removed prizes and remove them from owned items
async function migratePrizes(): Promise<void> {
  const currentPrizes = getPrizes();
  const currentPrizeIds = new Set(currentPrizes.map(p => p.id));
  
  // Get all owned items
  const ownedItems = await db.ownedItems.toArray();
  
  let totalRefund = 0;
  const itemsToRemove: string[] = [];
  
  for (const item of ownedItems) {
    // Check if the prize still exists
    if (!currentPrizeIds.has(item.prizeId)) {
      // Prize no longer exists - refund the user
      // Try to find the old price from a hardcoded map or use a default
      const refundAmount = getOldPrizeRefundAmount(item.prizeId);
      totalRefund += refundAmount;
      itemsToRemove.push(item.id);
      console.log(`Refunding ${refundAmount} stars for removed prize: ${item.prizeId}`);
    }
  }
  
  // Remove old items from owned items
  for (const itemId of itemsToRemove) {
    await db.ownedItems.delete(itemId);
  }
  
  // Add refunded stars to user
  if (totalRefund > 0) {
    await addStars(totalRefund);
    console.log(`Total refund: ${totalRefund} stars for ${itemsToRemove.length} removed items`);
  }
}

// Get refund amount for old prizes that no longer exist
// This is a hardcoded map of old prize IDs to their costs
function getOldPrizeRefundAmount(prizeId: string): number {
  const oldPrices: Record<string, number> = {
    'card-minecraft-01': 25,
    'card-minecraft-02': 25,
    'card-minecraft-03': 38,
    'card-minecraft-04': 30,
    'card-minecraft-05': 40,
    'card-minecraft-06': 75,
    'card-minecraft-07': 33,
    'card-minecraft-08': 35,
    'card-minecraft-09': 50,
    'card-minecraft-11': 38,
    'card-minecraft-12': 33,
    'card-minecraft-13': 43,
    'card-minecraft-14': 28,
    'card-minecraft-15': 35,
    'card-minecraft-16': 40,
    'card-princess-01': 38,
    'card-princess-02': 38,
    'card-princess-03': 40,
    'card-princess-04': 50,
  };
  
  return oldPrices[prizeId] || 30; // Default refund if price unknown
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

// Get card prizes by category
export function getCardsByCategory(category: CardCategory): Prize[] {
  return getPrizes().filter(p => p.type === 'card' && p.category === category);
}

// Get mob card prizes by subcategory
export function getMobsBySubcategory(subcategory: MobSubcategory): Prize[] {
  return getPrizes().filter(p => p.type === 'card' && p.category === 'mobs' && p.subcategory === subcategory);
}
