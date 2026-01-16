/**
 * Card Game Integration Utilities
 * Functions for integrating with the main app (unlock checks, rewards, etc.)
 */

import type { Prize, OwnedItem } from '../../../types';
import type {
  CardDefinition,
  GameState,
  AIDifficulty
} from '../../../types/cardGame';

// Re-export constants
export { GAME_CONSTANTS, STAR_REWARDS } from '../../../types/cardGame';

/**
 * Progress towards unlocking the card game
 */
export interface UnlockProgress {
  current: number;
  required: number;
  percentage: number;
  isUnlocked: boolean;
}

/**
 * Get progress towards unlocking the card game
 */
export function getUnlockProgress(
  ownedItems: OwnedItem[],
  prizes: Prize[]
): UnlockProgress {
  // Count owned cards
  const ownedPrizeIds = new Set(ownedItems.map(item => item.prizeId));
  const ownedCards = prizes.filter(
    prize => prize.type === 'card' && ownedPrizeIds.has(prize.id)
  );

  const current = ownedCards.length;
  const required = 50; // GAME_CONSTANTS.CARDS_TO_UNLOCK_GAME

  return {
    current,
    required,
    percentage: Math.min(100, Math.round((current / required) * 100)),
    isUnlocked: current >= required
  };
}

/**
 * Check if the user has enough cards to play
 */
export function hasEnoughCardsToPlay(
  ownedItems: OwnedItem[],
  prizes: Prize[]
): boolean {
  const progress = getUnlockProgress(ownedItems, prizes);
  return progress.isUnlocked;
}

/**
 * Get owned card definitions
 */
export function getOwnedCardDefinitions(
  ownedItems: OwnedItem[],
  prizes: Prize[],
  cardDefinitions: CardDefinition[]
): CardDefinition[] {
  const ownedPrizeIds = new Set(ownedItems.map(item => item.prizeId));
  const ownedCardPrizeIds = prizes
    .filter(prize => prize.type === 'card' && ownedPrizeIds.has(prize.id))
    .map(prize => prize.id);

  return cardDefinitions.filter(card => ownedCardPrizeIds.includes(card.prizeId));
}

/**
 * Game reward calculation result
 */
export interface GameReward {
  totalStars: number;
  baseStars: number;
  bonuses: {
    type: 'perfect' | 'quick' | 'comeback' | 'domination';
    stars: number;
    description: string;
  }[];
}

/**
 * Calculate rewards for a completed game
 */
export function calculateGameRewards(
  gameState: GameState,
  difficulty: AIDifficulty
): GameReward {
  // No rewards for losses or draws
  if (gameState.winner !== 'player') {
    return {
      totalStars: 0,
      baseStars: 0,
      bonuses: []
    };
  }

  // Base rewards by difficulty
  const baseStars = {
    easy: 5,   // STAR_REWARDS.WIN_EASY
    medium: 10, // STAR_REWARDS.WIN_MEDIUM
    hard: 20   // STAR_REWARDS.WIN_HARD
  }[difficulty];

  const bonuses: GameReward['bonuses'] = [];

  // Perfect game bonus (no damage taken)
  if (gameState.player.health === gameState.player.maxHealth) {
    bonuses.push({
      type: 'perfect',
      stars: 5, // STAR_REWARDS.BONUS_PERFECT_GAME
      description: 'Perfect Victory! No damage taken'
    });
  }

  // Quick win bonus (8 turns or less)
  if (gameState.turnNumber <= 8) {
    bonuses.push({
      type: 'quick',
      stars: 3, // STAR_REWARDS.BONUS_QUICK_WIN
      description: 'Speed Demon! Won in 8 turns or less'
    });
  }

  // Comeback bonus (won with 5 or less health)
  if (
    gameState.player.health <= 5 &&
    gameState.player.health > 0 &&
    gameState.player.health < gameState.player.maxHealth * 0.5
  ) {
    bonuses.push({
      type: 'comeback',
      stars: 4, // STAR_REWARDS.BONUS_COMEBACK
      description: 'Comeback King! Won with low health'
    });
  }

  // Domination bonus (opponent never got board control)
  const opponentDamageDealt =
    gameState.player.maxHealth - gameState.player.health;
  if (opponentDamageDealt === 0 && gameState.turnNumber > 5) {
    bonuses.push({
      type: 'domination',
      stars: 6,
      description: 'Total Domination! Perfect defense'
    });
  }

  const totalStars = baseStars + bonuses.reduce((sum, b) => sum + b.stars, 0);

  return {
    totalStars,
    baseStars,
    bonuses
  };
}

/**
 * Get cards needed to unlock the game
 */
export function getCardsNeededToUnlock(
  ownedItems: OwnedItem[],
  prizes: Prize[]
): number {
  const progress = getUnlockProgress(ownedItems, prizes);
  return Math.max(0, progress.required - progress.current);
}

/**
 * Get affordable cards in the market
 */
export function getAffordableCards(
  prizes: Prize[],
  ownedItems: OwnedItem[],
  currentStars: number
): Prize[] {
  const ownedPrizeIds = new Set(ownedItems.map(item => item.prizeId));

  return prizes.filter(
    prize =>
      prize.type === 'card' &&
      !ownedPrizeIds.has(prize.id) &&
      prize.cost <= currentStars
  );
}

/**
 * Calculate match statistics for display
 */
export function calculateMatchStats(gameState: GameState): MatchStats {
  const playerCardsPlayed = gameState.actionHistory.filter(
    action => action.type === 'PLAY_CARD' && action.actor === 'player'
  ).length;

  const opponentCardsPlayed = gameState.actionHistory.filter(
    action => action.type === 'PLAY_CARD' && action.actor === 'opponent'
  ).length;

  const playerDamageDealt =
    gameState.opponent.maxHealth - gameState.opponent.health;
  const opponentDamageDealt =
    gameState.player.maxHealth - gameState.player.health;

  const playerMinionsKilled = gameState.opponent.graveyard.length;
  const opponentMinionsKilled = gameState.player.graveyard.length;

  const duration = gameState.endedAt
    ? Math.floor((gameState.endedAt - gameState.startedAt) / 1000)
    : 0;

  return {
    totalTurns: gameState.turnNumber,
    duration,
    playerCardsPlayed,
    opponentCardsPlayed,
    playerDamageDealt,
    opponentDamageDealt,
    playerMinionsKilled,
    opponentMinionsKilled,
    playerFinalHealth: gameState.player.health,
    opponentFinalHealth: gameState.opponent.health
  };
}

/**
 * Match statistics
 */
export interface MatchStats {
  totalTurns: number;
  duration: number; // seconds
  playerCardsPlayed: number;
  opponentCardsPlayed: number;
  playerDamageDealt: number;
  opponentDamageDealt: number;
  playerMinionsKilled: number;
  opponentMinionsKilled: number;
  playerFinalHealth: number;
  opponentFinalHealth: number;
}

/**
 * Format duration as mm:ss
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get difficulty description
 */
export function getDifficultyDescription(difficulty: AIDifficulty): string {
  const descriptions: Record<AIDifficulty, string> = {
    easy: 'Random plays - great for learning!',
    medium: 'Smarter plays - a fair challenge',
    hard: 'Strategic AI - prepare for battle!'
  };
  return descriptions[difficulty];
}

/**
 * Get difficulty color class
 */
export function getDifficultyColor(difficulty: AIDifficulty): string {
  const colors: Record<AIDifficulty, string> = {
    easy: 'text-green-500',
    medium: 'text-yellow-500',
    hard: 'text-red-500'
  };
  return colors[difficulty];
}

/**
 * Get star reward range for a difficulty
 */
export function getStarRewardRange(difficulty: AIDifficulty): { min: number; max: number } {
  const base = { easy: 5, medium: 10, hard: 20 }[difficulty];
  const maxBonus = 5 + 3 + 4 + 6; // All bonuses

  return {
    min: base,
    max: base + maxBonus
  };
}
