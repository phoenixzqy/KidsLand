/**
 * Deck Generator Utility
 * Auto-generates balanced decks from owned cards
 */

import type { CardDefinition, Deck, Rarity } from '../../../types/cardGame';

/**
 * Ideal mana curve for a balanced deck
 * Index = mana cost (0-10), value = number of cards
 */
const IDEAL_MANA_CURVE = [
  0,   // 0 mana
  2,   // 1 mana
  4,   // 2 mana
  5,   // 3 mana
  5,   // 4 mana
  4,   // 5 mana
  3,   // 6 mana
  3,   // 7 mana
  2,   // 8 mana
  1,   // 9 mana
  1    // 10 mana
];

/**
 * Card evaluation score for deck building
 */
function evaluateCard(card: CardDefinition): number {
  let score = 0;

  // Base stats value
  score += card.attack + card.health;

  // Mana efficiency (stats per mana)
  const manaEfficiency = (card.attack + card.health) / Math.max(1, card.manaCost);
  score += manaEfficiency * 2;

  // Rarity bonus (higher rarity = generally better effects)
  const rarityBonus: Record<Rarity, number> = {
    common: 0,
    rare: 2,
    epic: 4,
    legendary: 6
  };
  score += rarityBonus[card.rarity];

  // Keyword bonuses
  if (card.keywords) {
    for (const keyword of card.keywords) {
      switch (keyword) {
        case 'taunt': score += 3; break;
        case 'charge': score += card.attack; break;
        case 'divine_shield': score += 4; break;
        case 'windfury': score += card.attack; break;
        case 'lifesteal': score += 3; break;
        case 'poisonous': score += 4; break;
        case 'stealth': score += 2; break;
      }
    }
  }

  // Effect bonuses
  if (card.battlecry) {
    score += 2 + card.battlecry.value;
  }
  if (card.deathrattle) {
    score += 2 + card.deathrattle.value;
  }

  return score;
}

/**
 * Group cards by mana cost
 */
function groupByManaCost(cards: CardDefinition[]): Map<number, CardDefinition[]> {
  const grouped = new Map<number, CardDefinition[]>();

  for (const card of cards) {
    const cost = Math.min(card.manaCost, 10); // Group 10+ together
    const existing = grouped.get(cost) || [];
    existing.push(card);
    grouped.set(cost, existing);
  }

  // Sort each group by evaluation score (descending)
  for (const [_cost, cardList] of grouped) {
    cardList.sort((a, b) => evaluateCard(b) - evaluateCard(a));
  }

  return grouped;
}

/**
 * Generate a balanced deck from available cards
 */
export function generateBalancedDeck(
  availableCards: CardDefinition[],
  deckName: string = 'My First Deck'
): Deck {
  const deckSize = 30;
  const maxCopies = 2;
  const maxLegendaryCopies = 1;

  // Track what we've added
  const deck: string[] = [];
  const cardCounts = new Map<string, number>();

  // Group cards by mana cost
  const cardsByMana = groupByManaCost(availableCards);

  /**
   * Try to add a card to the deck
   * Returns true if added, false if not possible
   */
  function tryAddCard(card: CardDefinition): boolean {
    const currentCount = cardCounts.get(card.id) || 0;
    const maxAllowed = card.rarity === 'legendary' ? maxLegendaryCopies : maxCopies;

    if (currentCount >= maxAllowed || deck.length >= deckSize) {
      return false;
    }

    deck.push(card.id);
    cardCounts.set(card.id, currentCount + 1);
    return true;
  }

  // First pass: Follow ideal mana curve
  for (let cost = 0; cost <= 10; cost++) {
    const cardsAtCost = cardsByMana.get(cost) || [];
    const idealCount = IDEAL_MANA_CURVE[cost];

    let addedAtCost = 0;
    for (const card of cardsAtCost) {
      if (addedAtCost >= idealCount) break;
      if (tryAddCard(card)) {
        addedAtCost++;
      }
    }
  }

  // Second pass: Fill remaining slots with best available cards
  if (deck.length < deckSize) {
    // Get all cards sorted by score
    const allCardsSorted = [...availableCards].sort(
      (a, b) => evaluateCard(b) - evaluateCard(a)
    );

    for (const card of allCardsSorted) {
      if (deck.length >= deckSize) break;
      tryAddCard(card);
    }
  }

  // Third pass: If still not full, add duplicates of best cards
  if (deck.length < deckSize) {
    const allCardsSorted = [...availableCards].sort(
      (a, b) => evaluateCard(b) - evaluateCard(a)
    );

    for (const card of allCardsSorted) {
      if (deck.length >= deckSize) break;

      // Try to add another copy
      const currentCount = cardCounts.get(card.id) || 0;
      const maxAllowed = card.rarity === 'legendary' ? maxLegendaryCopies : maxCopies;

      if (currentCount < maxAllowed) {
        deck.push(card.id);
        cardCounts.set(card.id, currentCount + 1);
      }
    }
  }

  // Shuffle the deck
  const shuffledDeck = [...deck].sort(() => Math.random() - 0.5);

  return {
    id: `deck-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: deckName,
    cardIds: shuffledDeck,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

/**
 * Analyze a deck's composition
 */
export function analyzeDeck(deck: Deck, cardDefinitions: Map<string, CardDefinition>): DeckAnalysis {
  const manaCurve: number[] = new Array(11).fill(0);
  const rarityCount: Record<Rarity, number> = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0
  };

  let totalAttack = 0;
  let totalHealth = 0;
  let totalScore = 0;

  for (const cardId of deck.cardIds) {
    const card = cardDefinitions.get(cardId);
    if (card) {
      const costIndex = Math.min(card.manaCost, 10);
      manaCurve[costIndex]++;
      rarityCount[card.rarity]++;
      totalAttack += card.attack;
      totalHealth += card.health;
      totalScore += evaluateCard(card);
    }
  }

  const averageManaCost =
    manaCurve.reduce((sum, count, cost) => sum + count * cost, 0) / deck.cardIds.length;

  return {
    cardCount: deck.cardIds.length,
    manaCurve,
    averageManaCost: Math.round(averageManaCost * 10) / 10,
    rarityCount,
    totalAttack,
    totalHealth,
    totalScore,
    isValid: deck.cardIds.length === 30
  };
}

/**
 * Deck analysis result
 */
export interface DeckAnalysis {
  cardCount: number;
  manaCurve: number[];
  averageManaCost: number;
  rarityCount: Record<Rarity, number>;
  totalAttack: number;
  totalHealth: number;
  totalScore: number;
  isValid: boolean;
}

/**
 * Validate a deck
 */
export function validateDeck(
  deck: Deck,
  ownedCardIds: Set<string>,
  cardDefinitions: Map<string, CardDefinition>
): DeckValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check deck size
  if (deck.cardIds.length !== 30) {
    errors.push(`Deck has ${deck.cardIds.length} cards (need exactly 30)`);
  }

  // Check card ownership and copy limits
  const cardCounts = new Map<string, number>();

  for (const cardId of deck.cardIds) {
    // Check ownership
    if (!ownedCardIds.has(cardId)) {
      errors.push(`You don't own card: ${cardId}`);
      continue;
    }

    // Count copies
    const count = (cardCounts.get(cardId) || 0) + 1;
    cardCounts.set(cardId, count);

    // Check copy limit
    const card = cardDefinitions.get(cardId);
    if (card) {
      const maxCopies = card.rarity === 'legendary' ? 1 : 2;
      if (count > maxCopies) {
        errors.push(
          `Too many copies of ${card.name} (${count}/${maxCopies} allowed for ${card.rarity})`
        );
      }
    }
  }

  // Check mana curve (warnings only)
  const analysis = analyzeDeck(deck, cardDefinitions);

  if (analysis.averageManaCost > 5) {
    warnings.push('Deck has high average mana cost - may be slow');
  }
  if (analysis.averageManaCost < 2.5) {
    warnings.push('Deck has very low average mana cost - may run out of cards');
  }

  const lowCostCards = analysis.manaCurve.slice(1, 4).reduce((a, b) => a + b, 0);
  if (lowCostCards < 8) {
    warnings.push('Deck has few early game cards (1-3 mana)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Deck validation result
 */
export interface DeckValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Get suggested cards to add to a deck
 */
export function suggestCardsForDeck(
  currentDeck: Deck,
  availableCards: CardDefinition[],
  maxSuggestions: number = 5
): CardDefinition[] {
  // Get cards not in deck or below copy limit
  const cardCounts = new Map<string, number>();
  for (const cardId of currentDeck.cardIds) {
    cardCounts.set(cardId, (cardCounts.get(cardId) || 0) + 1);
  }

  // Analyze current deck's mana curve
  const manaCurve: number[] = new Array(11).fill(0);
  for (const cardId of currentDeck.cardIds) {
    const card = availableCards.find(c => c.id === cardId);
    if (card) {
      manaCurve[Math.min(card.manaCost, 10)]++;
    }
  }

  // Find gaps in mana curve
  const gaps: number[] = [];
  for (let cost = 1; cost <= 7; cost++) {
    if (manaCurve[cost] < IDEAL_MANA_CURVE[cost]) {
      gaps.push(cost);
    }
  }

  // Score and sort available cards
  const scoredCards = availableCards
    .filter(card => {
      const count = cardCounts.get(card.id) || 0;
      const maxCopies = card.rarity === 'legendary' ? 1 : 2;
      return count < maxCopies;
    })
    .map(card => {
      let score = evaluateCard(card);

      // Bonus for filling mana curve gaps
      if (gaps.includes(card.manaCost)) {
        score += 5;
      }

      return { card, score };
    })
    .sort((a, b) => b.score - a.score);

  return scoredCards.slice(0, maxSuggestions).map(s => s.card);
}
