/**
 * Card Definitions Generator
 * Generates GameCard definitions from existing Prize data
 */

import type { Prize, Rarity } from '../../../types';
import type {
  CardDefinition,
  CardKeyword,
  CardEffect,
  CardGenerationConfig
} from '../../../types/cardGame';
import { CARD_GENERATION_CONFIGS } from '../../../types/cardGame';

/**
 * Simple seeded random number generator for consistent card stats
 * Based on string hash of card name
 */
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return () => {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return hash / 0x7fffffff;
  };
}

/**
 * Get the configuration key for a prize based on its category/subcategory
 */
function getConfigKey(prize: Prize): string {
  if (prize.subcategory) {
    return `${prize.category}/${prize.subcategory}`;
  }
  return prize.category || 'default';
}

/**
 * Get default config for unknown categories
 */
const DEFAULT_CONFIG: CardGenerationConfig = {
  minAttack: 1,
  maxAttack: 4,
  minHealth: 1,
  maxHealth: 4,
  minCost: 1,
  maxCost: 4,
  possibleKeywords: [],
  tribe: undefined
};

/**
 * Rarity multipliers for stats
 */
const RARITY_MULTIPLIERS: Record<Rarity, number> = {
  common: 1.0,
  rare: 1.15,
  epic: 1.3,
  legendary: 1.5
};

/**
 * Generate random value in range using seeded random
 */
function randomInRange(min: number, max: number, rand: () => number): number {
  return Math.floor(min + rand() * (max - min + 1));
}

/**
 * Select keywords based on rarity
 */
function selectKeywords(
  possibleKeywords: CardKeyword[],
  rarity: Rarity,
  rand: () => number
): CardKeyword[] {
  if (possibleKeywords.length === 0) return [];

  const keywordCount: Record<Rarity, number> = {
    common: 0,
    rare: 1,
    epic: 1,
    legendary: 2
  };

  const count = keywordCount[rarity];
  if (count === 0) return [];

  // Shuffle possible keywords
  const shuffled = [...possibleKeywords].sort(() => rand() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Generate a description based on keywords and effects
 */
function generateDescription(
  prize: Prize,
  keywords: CardKeyword[],
  battlecry?: CardEffect,
  deathrattle?: CardEffect
): string {
  const parts: string[] = [];

  // Add keyword descriptions
  const keywordDescriptions: Record<CardKeyword, string> = {
    taunt: 'Taunt',
    charge: 'Charge',
    divine_shield: 'Divine Shield',
    windfury: 'Windfury',
    stealth: 'Stealth',
    lifesteal: 'Lifesteal',
    poisonous: 'Poisonous'
  };

  if (keywords.length > 0) {
    parts.push(keywords.map(k => keywordDescriptions[k]).join('. ') + '.');
  }

  // Add battlecry description
  if (battlecry) {
    parts.push(`Battlecry: ${describeEffect(battlecry)}`);
  }

  // Add deathrattle description
  if (deathrattle) {
    parts.push(`Deathrattle: ${describeEffect(deathrattle)}`);
  }

  // If no effects, use the prize description
  if (parts.length === 0) {
    return prize.description || '';
  }

  return parts.join(' ');
}

/**
 * Convert an effect to a description string
 */
function describeEffect(effect: CardEffect): string {
  const targetDescriptions: Record<string, string> = {
    enemy_minion: 'an enemy minion',
    friendly_minion: 'a friendly minion',
    all_enemy_minions: 'all enemy minions',
    all_friendly_minions: 'all friendly minions',
    all_minions: 'all minions',
    enemy_hero: 'the enemy hero',
    friendly_hero: 'your hero',
    self: 'this minion',
    random_enemy: 'a random enemy',
    random_enemy_minion: 'a random enemy minion'
  };

  const target = targetDescriptions[effect.target] || effect.target;

  switch (effect.type) {
    case 'damage':
      return `Deal ${effect.value} damage to ${target}.`;
    case 'heal':
      return `Restore ${effect.value} Health to ${target}.`;
    case 'draw':
      return `Draw ${effect.value} card${effect.value > 1 ? 's' : ''}.`;
    case 'buff':
      return `Give ${target} +${effect.value}/+${effect.secondaryValue || 0}.`;
    case 'debuff':
      return `Give ${target} -${effect.value}/-${effect.secondaryValue || 0}.`;
    case 'summon':
      return `Summon a minion.`;
    case 'destroy':
      return `Destroy ${target}.`;
    case 'freeze':
      return `Freeze ${target}.`;
    case 'silence':
      return `Silence ${target}.`;
    default:
      return '';
  }
}

/**
 * Generate a battlecry effect for epic/legendary cards
 */
function generateBattlecry(prize: Prize, rand: () => number): CardEffect | undefined {
  const rarity = prize.rarity || 'common';

  // Only epic and legendary get battlecries
  if (rarity !== 'epic' && rarity !== 'legendary') {
    return undefined;
  }

  const effects: CardEffect[] = [
    { type: 'damage', target: 'random_enemy_minion', value: rarity === 'legendary' ? 3 : 2 },
    { type: 'heal', target: 'friendly_hero', value: rarity === 'legendary' ? 5 : 3 },
    { type: 'draw', target: 'self', value: 1 },
    { type: 'buff', target: 'all_friendly_minions', value: 1, secondaryValue: 1 },
    { type: 'damage', target: 'all_enemy_minions', value: rarity === 'legendary' ? 2 : 1 }
  ];

  // Pick based on category for thematic effects
  let effectIndex = Math.floor(rand() * effects.length);

  // Hostile mobs prefer damage
  if (prize.subcategory === 'hostile' || prize.subcategory === 'bosses') {
    effectIndex = rand() < 0.6 ? 0 : effectIndex; // 60% chance of damage
  }

  // Passive mobs prefer healing/buffs
  if (prize.subcategory === 'passive') {
    effectIndex = rand() < 0.6 ? (rand() < 0.5 ? 1 : 3) : effectIndex;
  }

  return effects[effectIndex];
}

/**
 * Generate a deathrattle effect for legendary cards
 */
function generateDeathrattle(prize: Prize, rand: () => number): CardEffect | undefined {
  const rarity = prize.rarity || 'common';

  // Only legendary cards get deathrattles
  if (rarity !== 'legendary') {
    return undefined;
  }

  const effects: CardEffect[] = [
    { type: 'damage', target: 'all_enemy_minions', value: 2 },
    { type: 'draw', target: 'self', value: 2 },
    { type: 'buff', target: 'all_friendly_minions', value: 2, secondaryValue: 2 },
    { type: 'heal', target: 'friendly_hero', value: 5 }
  ];

  return effects[Math.floor(rand() * effects.length)];
}

/**
 * Generate a CardDefinition from a Prize
 */
export function generateCardFromPrize(prize: Prize): CardDefinition | null {
  // Only process cards
  if (prize.type !== 'card') {
    return null;
  }

  // Get config for this prize type
  const configKey = getConfigKey(prize);
  const config = CARD_GENERATION_CONFIGS[configKey] || DEFAULT_CONFIG;

  // Create seeded random for consistent stats
  const rand = seededRandom(prize.id + prize.name);

  // Get rarity multiplier
  const rarity = prize.rarity || 'common';
  const multiplier = RARITY_MULTIPLIERS[rarity];

  // Generate base stats
  const baseAttack = randomInRange(config.minAttack, config.maxAttack, rand);
  const baseHealth = randomInRange(config.minHealth, config.maxHealth, rand);
  const baseCost = randomInRange(config.minCost, config.maxCost, rand);

  // Apply rarity multiplier
  const attack = Math.round(baseAttack * multiplier);
  const health = Math.round(baseHealth * multiplier);

  // Cost scales less aggressively
  const cost = Math.min(10, Math.round(baseCost * (multiplier * 0.85)));

  // Select keywords
  const keywords = selectKeywords(config.possibleKeywords, rarity, rand);

  // Generate effects for higher rarity cards
  const battlecry = generateBattlecry(prize, rand);
  const deathrattle = generateDeathrattle(prize, rand);

  // Generate description
  const description = generateDescription(prize, keywords, battlecry, deathrattle);

  // Determine card type (weapons category = weapon type)
  const cardType = prize.category === 'weapons' ? 'weapon' : 'minion';

  return {
    id: `card_${prize.id}`,
    prizeId: prize.id,
    name: prize.name,
    description,
    flavorText: prize.description,
    image: prize.image,
    type: cardType,
    manaCost: cost,
    attack,
    health,
    rarity,
    tribe: config.tribe,
    keywords: keywords.length > 0 ? keywords : undefined,
    battlecry,
    deathrattle
  };
}

// Cache for card definitions
let cardDefinitionsCache: CardDefinition[] | null = null;

/**
 * Generate all card definitions from prizes data
 */
export function generateAllCardDefinitions(prizes: Prize[]): CardDefinition[] {
  const cards: CardDefinition[] = [];

  for (const prize of prizes) {
    const card = generateCardFromPrize(prize);
    if (card) {
      cards.push(card);
    }
  }

  return cards;
}

/**
 * Get all card definitions (cached)
 * This should be called with prizes data loaded from JSON
 */
export function getCardDefinitions(prizes: Prize[]): CardDefinition[] {
  if (!cardDefinitionsCache) {
    cardDefinitionsCache = generateAllCardDefinitions(prizes);
  }
  return cardDefinitionsCache;
}

/**
 * Get a specific card definition by ID
 */
export function getCardDefinitionById(
  cardId: string,
  prizes: Prize[]
): CardDefinition | undefined {
  const allCards = getCardDefinitions(prizes);
  return allCards.find(card => card.id === cardId);
}

/**
 * Get card definitions that the user owns
 */
export function getOwnedCardDefinitions(
  ownedPrizeIds: string[],
  prizes: Prize[]
): CardDefinition[] {
  const allCards = getCardDefinitions(prizes);
  const ownedSet = new Set(ownedPrizeIds);

  return allCards.filter(card => ownedSet.has(card.prizeId));
}

/**
 * Clear the card definitions cache (useful for testing or when prizes data changes)
 */
export function clearCardDefinitionsCache(): void {
  cardDefinitionsCache = null;
}

/**
 * Get cards grouped by mana cost (for deck building mana curve display)
 */
export function getCardsByManaCost(cards: CardDefinition[]): Map<number, CardDefinition[]> {
  const grouped = new Map<number, CardDefinition[]>();

  for (const card of cards) {
    const cost = card.manaCost;
    const existing = grouped.get(cost) || [];
    existing.push(card);
    grouped.set(cost, existing);
  }

  return grouped;
}

/**
 * Get cards grouped by rarity
 */
export function getCardsByRarity(cards: CardDefinition[]): Map<Rarity, CardDefinition[]> {
  const grouped = new Map<Rarity, CardDefinition[]>();

  for (const card of cards) {
    const rarity = card.rarity;
    const existing = grouped.get(rarity) || [];
    existing.push(card);
    grouped.set(rarity, existing);
  }

  return grouped;
}
