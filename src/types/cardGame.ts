/**
 * Card Game Type Definitions
 * Hearthstone-inspired card battle game with Minecraft theme
 */

import type { Rarity } from './index';

// Re-export Rarity for convenience
export type { Rarity } from './index';

// ============================================================================
// Card Keywords & Effects
// ============================================================================

/** Keywords that can be applied to cards */
export type CardKeyword =
  | 'taunt'         // Forces enemies to attack this minion first
  | 'charge'        // Can attack immediately when played
  | 'divine_shield' // Blocks the first damage taken
  | 'windfury'      // Can attack twice per turn
  | 'stealth'       // Can't be targeted until it attacks
  | 'lifesteal'     // Damage dealt heals your hero
  | 'poisonous';    // Destroys any minion it damages

/** Tribes for minion synergies */
export type CardTribe = 'beast' | 'undead' | 'elemental' | 'mech' | 'villager';

/** Effect target types */
export type EffectTarget =
  | 'enemy_minion'      // A single enemy minion
  | 'friendly_minion'   // A single friendly minion
  | 'all_enemy_minions' // All enemy minions
  | 'all_friendly_minions' // All friendly minions
  | 'all_minions'       // All minions on the board
  | 'enemy_hero'        // The enemy hero
  | 'friendly_hero'     // Your hero
  | 'self'              // The card itself
  | 'random_enemy'      // Random enemy (minion or hero)
  | 'random_enemy_minion'; // Random enemy minion

/** Types of effects cards can have */
export type EffectType =
  | 'damage'    // Deal damage to target
  | 'heal'      // Heal target
  | 'draw'      // Draw cards
  | 'buff'      // Increase attack/health
  | 'debuff'    // Decrease attack/health
  | 'summon'    // Summon a minion
  | 'destroy'   // Destroy a minion
  | 'freeze'    // Target can't attack next turn
  | 'silence';  // Remove all effects from a minion

/** Card effect definition */
export interface CardEffect {
  type: EffectType;
  target: EffectTarget;
  value: number;           // Primary value (damage amount, cards to draw, etc.)
  secondaryValue?: number; // Secondary value (health buff when type is 'buff')
  summonCardId?: string;   // Card ID to summon when type is 'summon'
  condition?: string;      // Optional condition description
}

// ============================================================================
// Card Definitions
// ============================================================================

/** Card type - minion or weapon (spells may be added later) */
export type CardType = 'minion' | 'weapon';

/** Static card definition - the template for all cards of this type */
export interface CardDefinition {
  id: string;
  prizeId: string;         // Links to existing Prize for asset/unlock checking
  name: string;
  description: string;     // Card ability description
  flavorText?: string;     // Fun flavor text
  image: string;
  type: CardType;
  manaCost: number;        // 0-10
  attack: number;
  health: number;          // For minions: health, for weapons: durability
  rarity: Rarity;
  tribe?: CardTribe;
  keywords?: CardKeyword[];
  battlecry?: CardEffect;  // Effect when played
  deathrattle?: CardEffect; // Effect when destroyed
}

/** Runtime card instance in a game - tracks current state */
export interface GameCard extends CardDefinition {
  instanceId: string;      // Unique ID for this instance in the game
  currentHealth: number;   // Current health (can be damaged/healed)
  currentAttack: number;   // Current attack (can be buffed/debuffed)
  canAttack: boolean;      // Whether this card can attack this turn
  attacksThisTurn: number; // Number of attacks made this turn
  hasDivineShield: boolean; // Whether divine shield is active
  isFrozen: boolean;       // Whether the minion is frozen
  isSilenced: boolean;     // Whether effects have been silenced
  isStealthed: boolean;    // Whether the minion is stealthed
  buffs: CardBuff[];       // Active buffs on this card
}

/** Buff applied to a card */
export interface CardBuff {
  id: string;
  attackModifier: number;
  healthModifier: number;
  source: string;          // What applied this buff
  permanent: boolean;      // Whether this persists after turn end
}

// ============================================================================
// Game State
// ============================================================================

/** Game phases */
export type GamePhase =
  | 'not_started'  // Game not yet begun
  | 'mulligan'     // Initial card replacement phase
  | 'playing'      // Main game phase
  | 'game_over';   // Game has ended

/** Who won the game */
export type GameWinner = 'player' | 'opponent' | 'draw';

/** Who's turn it is */
export type TurnOwner = 'player' | 'opponent';

/** Player state during a game */
export interface PlayerState {
  name: string;
  health: number;
  maxHealth: number;       // Always 30
  mana: number;            // Current available mana
  maxMana: number;         // Maximum mana this turn (increases each turn, max 10)
  deck: GameCard[];        // Remaining cards in deck
  hand: GameCard[];        // Cards in hand (max 10)
  field: GameCard[];       // Minions on the battlefield (max 7)
  graveyard: GameCard[];   // Destroyed cards
  fatigueDamage: number;   // Damage taken when drawing from empty deck
  heroPowerUsed: boolean;  // Whether hero power was used this turn
}

/** Complete game state */
export interface GameState {
  id: string;
  phase: GamePhase;
  turnNumber: number;
  currentTurn: TurnOwner;
  player: PlayerState;
  opponent: PlayerState;
  winner?: GameWinner;
  actionHistory: GameAction[];
  startedAt: number;       // Timestamp
  endedAt?: number;        // Timestamp when game ended
}

// ============================================================================
// Game Actions
// ============================================================================

/** Types of actions that can be taken in a game */
export type GameActionType =
  | 'DRAW_CARD'
  | 'PLAY_CARD'
  | 'ATTACK_MINION'
  | 'ATTACK_HERO'
  | 'END_TURN'
  | 'MULLIGAN'
  | 'HERO_POWER'
  | 'TRIGGER_EFFECT'
  | 'MINION_DIED'
  | 'GAME_START'
  | 'GAME_END';

/** Action log entry */
export interface GameAction {
  type: GameActionType;
  actor: TurnOwner;
  timestamp: number;
  data?: {
    cardId?: string;
    targetId?: string;
    damage?: number;
    healing?: number;
    cardsDrawn?: number;
    effectTriggered?: string;
  };
}

/** Result of attempting an action */
export interface ActionResult {
  success: boolean;
  error?: string;
  stateChanges?: Partial<GameState>;
  animations?: GameAnimation[];
}

/** Animation to play in the UI */
export interface GameAnimation {
  type: 'card_draw' | 'card_play' | 'attack' | 'damage' | 'heal' | 'death' | 'effect';
  sourceId?: string;
  targetId?: string;
  value?: number;
  duration: number;        // milliseconds
}

// ============================================================================
// Deck Building
// ============================================================================

/** A saved deck */
export interface Deck {
  id: string;
  name: string;
  cardIds: string[];       // Card definition IDs (30 cards)
  createdAt: number;
  updatedAt: number;
}

/** Deck validation result */
export interface DeckValidation {
  isValid: boolean;
  cardCount: number;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// AI Configuration
// ============================================================================

/** AI difficulty levels */
export type AIDifficulty = 'easy' | 'medium' | 'hard';

/** AI decision for an action */
export interface AIDecision {
  action: GameActionType;
  cardId?: string;
  targetId?: string;
  priority: number;        // Higher = more important
  reasoning?: string;      // For debugging
}

// ============================================================================
// Match History & Stats
// ============================================================================

/** Record of a completed match */
export interface MatchRecord {
  id: string;
  deckId: string;
  deckName: string;
  opponentType: 'ai';
  opponentDifficulty: AIDifficulty;
  opponentName: string;
  winner: GameWinner;
  playerFinalHealth: number;
  opponentFinalHealth: number;
  totalTurns: number;
  cardsPlayed: number;
  damageDealt: number;
  minionsKilled: number;
  starsEarned: number;
  playedAt: number;        // Timestamp
  duration: number;        // Seconds
}

/** Aggregated player statistics */
export interface CardGameStats {
  id: 'default';
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winsByDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  totalStarsEarned: number;
  totalDamageDealt: number;
  totalMinionsKilled: number;
  longestWinStreak: number;
  currentWinStreak: number;
  favoriteCardId?: string;  // Most played card
  lastPlayedAt?: number;
}

// ============================================================================
// Card Generation Config
// ============================================================================

/** Configuration for generating card stats from prizes */
export interface CardGenerationConfig {
  minAttack: number;
  maxAttack: number;
  minHealth: number;
  maxHealth: number;
  minCost: number;
  maxCost: number;
  possibleKeywords: CardKeyword[];
  tribe?: CardTribe;
}

/** Default generation configs by category */
export const CARD_GENERATION_CONFIGS: Record<string, CardGenerationConfig> = {
  // Bosses - powerful legendary cards
  'mobs/bosses': {
    minAttack: 6, maxAttack: 12,
    minHealth: 6, maxHealth: 12,
    minCost: 7, maxCost: 10,
    possibleKeywords: ['taunt', 'charge', 'divine_shield', 'windfury'],
    tribe: undefined
  },
  // Hostile mobs - aggressive stats
  'mobs/hostile': {
    minAttack: 2, maxAttack: 6,
    minHealth: 1, maxHealth: 5,
    minCost: 2, maxCost: 6,
    possibleKeywords: ['charge', 'stealth', 'poisonous', 'lifesteal'],
    tribe: 'undead'
  },
  // Neutral mobs - balanced stats
  'mobs/neutral': {
    minAttack: 2, maxAttack: 5,
    minHealth: 2, maxHealth: 6,
    minCost: 2, maxCost: 5,
    possibleKeywords: ['taunt', 'divine_shield', 'windfury'],
    tribe: 'beast'
  },
  // Passive mobs - defensive stats
  'mobs/passive': {
    minAttack: 1, maxAttack: 3,
    minHealth: 2, maxHealth: 7,
    minCost: 1, maxCost: 4,
    possibleKeywords: ['taunt', 'divine_shield', 'lifesteal'],
    tribe: 'beast'
  },
  // Villagers - utility focused
  'mobs/villagers': {
    minAttack: 1, maxAttack: 3,
    minHealth: 2, maxHealth: 5,
    minCost: 2, maxCost: 4,
    possibleKeywords: ['taunt'],
    tribe: 'villager'
  },
  // Weapons - high attack, low durability
  'weapons': {
    minAttack: 2, maxAttack: 5,
    minHealth: 2, maxHealth: 4,
    minCost: 2, maxCost: 5,
    possibleKeywords: ['windfury', 'lifesteal'],
    tribe: undefined
  },
  // Tools - utility
  'tools': {
    minAttack: 1, maxAttack: 3,
    minHealth: 3, maxHealth: 5,
    minCost: 1, maxCost: 3,
    possibleKeywords: [],
    tribe: 'mech'
  },
  // Armor - defensive
  'armor': {
    minAttack: 1, maxAttack: 2,
    minHealth: 3, maxHealth: 8,
    minCost: 2, maxCost: 5,
    possibleKeywords: ['taunt', 'divine_shield'],
    tribe: 'mech'
  },
  // Materials - varied
  'materials': {
    minAttack: 1, maxAttack: 4,
    minHealth: 1, maxHealth: 4,
    minCost: 1, maxCost: 4,
    possibleKeywords: [],
    tribe: 'elemental'
  },
  // Food - healing focused
  'food': {
    minAttack: 1, maxAttack: 2,
    minHealth: 2, maxHealth: 4,
    minCost: 1, maxCost: 3,
    possibleKeywords: ['lifesteal'],
    tribe: undefined
  },
  // Blocks - defensive
  'blocks': {
    minAttack: 0, maxAttack: 2,
    minHealth: 3, maxHealth: 8,
    minCost: 1, maxCost: 4,
    possibleKeywords: ['taunt'],
    tribe: undefined
  },
  // Special items - unique effects
  'special': {
    minAttack: 2, maxAttack: 6,
    minHealth: 2, maxHealth: 6,
    minCost: 3, maxCost: 7,
    possibleKeywords: ['divine_shield', 'stealth', 'charge'],
    tribe: undefined
  }
};

// ============================================================================
// Game Constants
// ============================================================================

export const GAME_CONSTANTS = {
  STARTING_HEALTH: 30,
  MAX_HEALTH: 30,
  STARTING_MANA: 1,
  MAX_MANA: 10,
  MAX_HAND_SIZE: 10,
  MAX_FIELD_SIZE: 7,
  DECK_SIZE: 30,
  MAX_CARD_COPIES: 2,       // Max copies of a non-legendary card
  MAX_LEGENDARY_COPIES: 1,  // Max copies of a legendary card
  CARDS_TO_UNLOCK_GAME: 50, // Minimum cards needed to play
  INITIAL_HAND_FIRST: 3,    // Cards drawn going first
  INITIAL_HAND_SECOND: 4,   // Cards drawn going second (+ The Coin)
} as const;

// ============================================================================
// Star Rewards
// ============================================================================

export const STAR_REWARDS = {
  WIN_EASY: 5,
  WIN_MEDIUM: 10,
  WIN_HARD: 20,
  BONUS_PERFECT_GAME: 5,    // No damage taken
  BONUS_QUICK_WIN: 3,       // Win in 8 turns or less
  BONUS_COMEBACK: 4,        // Win with 5 or less health
} as const;
