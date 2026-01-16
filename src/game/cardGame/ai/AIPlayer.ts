/**
 * AI Player for Card Game
 * Implements Easy, Medium, and Hard difficulty levels
 */

import type {
  GameState,
  GameCard,
  AIDifficulty,
  AIDecision,
  PlayerState,
  CardEffect
} from '../../../types/cardGame';
import { GameEngine } from '../engine/GameEngine';

/**
 * AI Player class
 */
export class AIPlayer {
  private difficulty: AIDifficulty;
  private thinkDelay: number; // Milliseconds to simulate thinking

  constructor(difficulty: AIDifficulty) {
    this.difficulty = difficulty;
    this.thinkDelay = {
      easy: 500,
      medium: 800,
      hard: 1200
    }[difficulty];
  }

  /**
   * Get the AI's difficulty level
   */
  getDifficulty(): AIDifficulty {
    return this.difficulty;
  }

  /**
   * Decide what actions to take this turn
   * Returns a list of actions in order
   */
  async decideTurn(engine: GameEngine): Promise<AIDecision[]> {
    // Simulate thinking time
    await this.delay(this.thinkDelay);

    switch (this.difficulty) {
      case 'easy':
        return this.decideEasyTurn(engine);
      case 'medium':
        return this.decideMediumTurn(engine);
      case 'hard':
        return this.decideHardTurn(engine);
      default:
        return this.decideEasyTurn(engine);
    }
  }

  /**
   * Easy AI: Random plays and attacks
   */
  private decideEasyTurn(engine: GameEngine): AIDecision[] {
    const decisions: AIDecision[] = [];
    const state = engine.getState();

    // Randomly play cards (50% chance for each playable card)
    const playableCards = engine.getPlayableCards();
    for (const cardId of playableCards) {
      if (Math.random() < 0.5) {
        const card = state.opponent.hand.find(c => c.instanceId === cardId);
        if (card) {
          const targets = engine.getValidTargets(card);
          decisions.push({
            action: 'PLAY_CARD',
            cardId,
            targetId: targets.length > 0 ? targets[Math.floor(Math.random() * targets.length)] : undefined,
            priority: 1,
            reasoning: 'Random card play'
          });
        }
      }
    }

    // Randomly attack with minions (70% chance)
    const attackableMinions = engine.getAttackableMinions();
    for (const minionId of attackableMinions) {
      if (Math.random() < 0.7) {
        const targets = engine.getValidAttackTargets(minionId);
        if (targets.length > 0) {
          decisions.push({
            action: 'ATTACK_MINION',
            cardId: minionId,
            targetId: targets[Math.floor(Math.random() * targets.length)],
            priority: 2,
            reasoning: 'Random attack'
          });
        }
      }
    }

    // End turn
    decisions.push({
      action: 'END_TURN',
      priority: 0,
      reasoning: 'End turn'
    });

    return decisions;
  }

  /**
   * Medium AI: Greedy strategy - play best value cards, make favorable trades
   */
  private decideMediumTurn(engine: GameEngine): AIDecision[] {
    const decisions: AIDecision[] = [];
    const state = engine.getState();
    const opponent = state.opponent; // AI is opponent
    const player = state.player;

    // Sort playable cards by value (mana cost as proxy for power)
    const playableCards = engine.getPlayableCards();
    const sortedCards = playableCards
      .map(id => opponent.hand.find(c => c.instanceId === id)!)
      .filter(Boolean)
      .sort((a, b) => b.manaCost - a.manaCost);

    // Play cards greedily (highest cost first that we can afford)
    let remainingMana = opponent.mana;
    for (const card of sortedCards) {
      if (card.manaCost <= remainingMana && opponent.field.length < 7) {
        const targets = engine.getValidTargets(card);
        let targetId: string | undefined;

        // For damage effects, target highest health minion
        if (card.battlecry?.type === 'damage' && targets.length > 0) {
          const targetMinions = player.field.filter(m => targets.includes(m.instanceId));
          if (targetMinions.length > 0) {
            targetMinions.sort((a, b) => b.currentHealth - a.currentHealth);
            targetId = targetMinions[0].instanceId;
          }
        } else if (targets.length > 0) {
          targetId = targets[0];
        }

        decisions.push({
          action: 'PLAY_CARD',
          cardId: card.instanceId,
          targetId,
          priority: card.manaCost,
          reasoning: `Play ${card.name} (${card.manaCost} mana)`
        });

        remainingMana -= card.manaCost;
      }
    }

    // Make favorable trades
    const attackableMinions = engine.getAttackableMinions();
    for (const minionId of attackableMinions) {
      const attacker = opponent.field.find(c => c.instanceId === minionId);
      if (!attacker) continue;

      const targets = engine.getValidAttackTargets(minionId);

      // Find favorable trades (kill enemy without dying)
      let bestTarget: string | null = null;
      let bestValue = -Infinity;

      for (const targetId of targets) {
        if (targetId === 'hero') {
          // Going face - less valuable unless lethal
          const value = attacker.currentAttack >= player.health ? 1000 : attacker.currentAttack;
          if (value > bestValue) {
            bestValue = value;
            bestTarget = targetId;
          }
        } else {
          const target = player.field.find(c => c.instanceId === targetId);
          if (target) {
            // Calculate trade value
            const canKill = attacker.currentAttack >= target.currentHealth;
            const willSurvive = target.currentAttack < attacker.currentHealth;
            const targetValue = target.currentAttack + target.currentHealth;

            let value = 0;
            if (canKill && willSurvive) {
              value = targetValue + 10; // Very favorable
            } else if (canKill) {
              value = targetValue - attacker.currentAttack; // Trade
            } else if (willSurvive) {
              value = attacker.currentAttack; // Chip damage
            }

            if (value > bestValue) {
              bestValue = value;
              bestTarget = targetId;
            }
          }
        }
      }

      if (bestTarget) {
        decisions.push({
          action: bestTarget === 'hero' ? 'ATTACK_HERO' : 'ATTACK_MINION',
          cardId: minionId,
          targetId: bestTarget,
          priority: bestValue,
          reasoning: `Attack with ${attacker.name}`
        });
      }
    }

    // End turn
    decisions.push({
      action: 'END_TURN',
      priority: -1,
      reasoning: 'End turn'
    });

    // Sort by priority (highest first, except END_TURN)
    return decisions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Hard AI: Minimax-inspired strategy with look-ahead
   */
  private decideHardTurn(engine: GameEngine): AIDecision[] {
    const decisions: AIDecision[] = [];
    const state = engine.getState();
    const opponent = state.opponent;
    const player = state.player;

    // Prioritize lethal if available
    const totalDamage = this.calculatePotentialDamage(opponent, player);
    if (totalDamage >= player.health) {
      // Go for lethal!
      return this.planLethal(engine);
    }

    // Play cards strategically
    const playableCards = engine.getPlayableCards()
      .map(id => opponent.hand.find(c => c.instanceId === id)!)
      .filter(Boolean);

    // Evaluate each card play
    const cardPlays: { card: GameCard; value: number; targetId?: string }[] = [];

    for (const card of playableCards) {
      if (opponent.field.length >= 7 && card.type === 'minion') continue;

      const targets = engine.getValidTargets(card);
      let bestTargetId: string | undefined;
      let bestValue = this.evaluateCardPlay(card, state);

      // If card has targeted battlecry, find best target
      if (targets.length > 0) {
        for (const targetId of targets) {
          const value = this.evaluateCardPlayWithTarget(card, targetId, state);
          if (value > bestValue) {
            bestValue = value;
            bestTargetId = targetId;
          }
        }
      }

      cardPlays.push({ card, value: bestValue, targetId: bestTargetId });
    }

    // Sort by value and play best cards within mana budget
    cardPlays.sort((a, b) => b.value - a.value);
    let remainingMana = opponent.mana;

    for (const { card, value, targetId } of cardPlays) {
      if (card.manaCost <= remainingMana && value > 0) {
        decisions.push({
          action: 'PLAY_CARD',
          cardId: card.instanceId,
          targetId,
          priority: value,
          reasoning: `Strategic play: ${card.name}`
        });
        remainingMana -= card.manaCost;
      }
    }

    // Plan attacks strategically
    const attackPlan = this.planAttacks(engine);
    decisions.push(...attackPlan);

    // End turn
    decisions.push({
      action: 'END_TURN',
      priority: -1,
      reasoning: 'End turn'
    });

    return decisions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Evaluate a minion's value
   */
  private evaluateMinion(minion: GameCard): number {
    let value = minion.currentAttack + minion.currentHealth;

    // Keywords add value
    if (minion.keywords?.includes('taunt')) value += 2;
    if (minion.keywords?.includes('divine_shield')) value += 3;
    if (minion.keywords?.includes('windfury')) value += minion.currentAttack;
    if (minion.keywords?.includes('lifesteal')) value += 2;
    if (minion.keywords?.includes('poisonous')) value += 3;

    // Can attack adds value
    if (minion.canAttack && !minion.isFrozen) {
      value += minion.currentAttack * 0.5;
    }

    return value;
  }

  /**
   * Evaluate playing a card
   */
  private evaluateCardPlay(card: GameCard, state: GameState): number {
    let value = card.currentAttack + card.health;

    // Adjust for mana efficiency
    const manaEfficiency = (card.currentAttack + card.health) / Math.max(1, card.manaCost);
    value += manaEfficiency;

    // Keywords
    if (card.keywords?.includes('taunt')) {
      // Taunt more valuable when behind or low health
      value += state.opponent.health < 15 ? 5 : 2;
    }
    if (card.keywords?.includes('charge')) {
      // Charge more valuable for aggression
      value += card.currentAttack;
    }

    // Effects
    if (card.battlecry) {
      value += this.evaluateEffect(card.battlecry);
    }

    return value;
  }

  /**
   * Evaluate playing a card with a specific target
   */
  private evaluateCardPlayWithTarget(
    card: GameCard,
    targetId: string,
    state: GameState
  ): number {
    let value = this.evaluateCardPlay(card, state);

    if (card.battlecry) {
      // Find target
      const allMinions = [...state.player.field, ...state.opponent.field];
      const target = allMinions.find(m => m.instanceId === targetId);

      if (target) {
        if (card.battlecry.type === 'damage') {
          // Damage effects - value killing high-value targets
          const isEnemy = state.player.field.some(m => m.instanceId === targetId);
          if (isEnemy && card.battlecry.value >= target.currentHealth) {
            value += this.evaluateMinion(target);
          }
        } else if (card.battlecry.type === 'buff') {
          // Buff effects - value buffing strong minions
          const isFriendly = state.opponent.field.some(m => m.instanceId === targetId);
          if (isFriendly) {
            value += target.currentAttack * 0.5;
          }
        }
      }
    }

    return value;
  }

  /**
   * Evaluate an effect's value
   */
  private evaluateEffect(effect: CardEffect): number {
    switch (effect.type) {
      case 'damage':
        return effect.value * 1.5;
      case 'heal':
        return effect.value;
      case 'draw':
        return effect.value * 3;
      case 'buff':
        return effect.value + (effect.secondaryValue || 0);
      default:
        return 0;
    }
  }

  /**
   * Calculate potential damage AI can deal this turn
   */
  private calculatePotentialDamage(ai: PlayerState, player: PlayerState): number {
    let damage = 0;

    // Damage from minions that can attack
    for (const minion of ai.field) {
      if (minion.canAttack && !minion.isFrozen) {
        // Check if blocked by taunt
        const hasTaunt = player.field.some(
          m => m.keywords?.includes('taunt') && !m.isStealthed
        );
        if (!hasTaunt) {
          damage += minion.currentAttack;
          if (minion.keywords?.includes('windfury')) {
            damage += minion.currentAttack;
          }
        }
      }
    }

    // Damage from charge minions in hand
    for (const card of ai.hand) {
      if (card.keywords?.includes('charge') && card.manaCost <= ai.mana) {
        damage += card.currentAttack;
      }
    }

    return damage;
  }

  /**
   * Plan a lethal attack sequence
   */
  private planLethal(engine: GameEngine): AIDecision[] {
    const decisions: AIDecision[] = [];
    const state = engine.getState();
    const opponent = state.opponent;

    // Play charge minions first
    for (const card of opponent.hand) {
      if (card.keywords?.includes('charge') && card.manaCost <= opponent.mana) {
        decisions.push({
          action: 'PLAY_CARD',
          cardId: card.instanceId,
          priority: 100,
          reasoning: 'Lethal: play charge minion'
        });
      }
    }

    // Attack face with everything
    const attackableMinions = engine.getAttackableMinions();
    for (const minionId of attackableMinions) {
      const targets = engine.getValidAttackTargets(minionId);
      if (targets.includes('hero')) {
        decisions.push({
          action: 'ATTACK_HERO',
          cardId: minionId,
          targetId: 'hero',
          priority: 99,
          reasoning: 'Lethal: attack hero'
        });
      }
    }

    decisions.push({
      action: 'END_TURN',
      priority: -1,
      reasoning: 'End turn'
    });

    return decisions;
  }

  /**
   * Plan attack sequence
   */
  private planAttacks(engine: GameEngine): AIDecision[] {
    const decisions: AIDecision[] = [];
    const state = engine.getState();
    const opponent = state.opponent;
    const player = state.player;

    const attackableMinions = engine.getAttackableMinions();

    // Sort minions by attack power
    const sortedMinions = attackableMinions
      .map(id => opponent.field.find(c => c.instanceId === id)!)
      .filter(Boolean)
      .sort((a, b) => b.currentAttack - a.currentAttack);

    // Plan trades first
    const plannedAttacks: { attacker: GameCard; target: string; value: number }[] = [];

    for (const attacker of sortedMinions) {
      const targets = engine.getValidAttackTargets(attacker.instanceId);
      let bestTarget = 'hero';
      let bestValue = attacker.currentAttack; // Default: face damage

      // Check for taunt - must attack taunt if present
      const hasTaunt = player.field.some(
        m => m.keywords?.includes('taunt') && !m.isStealthed && targets.includes(m.instanceId)
      );

      for (const targetId of targets) {
        if (targetId === 'hero') {
          if (!hasTaunt) {
            // Going face value
            const value = player.health <= attacker.currentAttack ? 100 : attacker.currentAttack;
            if (value > bestValue) {
              bestValue = value;
              bestTarget = targetId;
            }
          }
        } else {
          const target = player.field.find(c => c.instanceId === targetId);
          if (target) {
            // Calculate trade value
            const canKill = attacker.currentAttack >= target.currentHealth;
            const willSurvive = target.currentAttack < attacker.currentHealth ||
              attacker.hasDivineShield;
            const targetValue = this.evaluateMinion(target);
            const attackerValue = this.evaluateMinion(attacker);

            let value = 0;
            if (canKill && willSurvive) {
              // Great trade
              value = targetValue + 10;
            } else if (canKill && targetValue >= attackerValue) {
              // Even trade
              value = targetValue - attackerValue + 5;
            } else if (canKill) {
              // Bad trade but necessary if taunt
              value = target.keywords?.includes('taunt') ? 5 : -5;
            } else {
              // Just chip damage
              value = hasTaunt ? attacker.currentAttack : 0;
            }

            if (value > bestValue || (hasTaunt && target.keywords?.includes('taunt'))) {
              bestValue = value;
              bestTarget = targetId;
            }
          }
        }
      }

      if (bestTarget) {
        plannedAttacks.push({
          attacker,
          target: bestTarget,
          value: bestValue
        });
      }
    }

    // Sort by value
    plannedAttacks.sort((a, b) => b.value - a.value);

    for (const { attacker, target, value } of plannedAttacks) {
      decisions.push({
        action: target === 'hero' ? 'ATTACK_HERO' : 'ATTACK_MINION',
        cardId: attacker.instanceId,
        targetId: target,
        priority: value,
        reasoning: `Attack: ${attacker.name} -> ${target}`
      });
    }

    return decisions;
  }

  /**
   * Helper: delay for simulated thinking
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create an AI player with the specified difficulty
 */
export function createAIPlayer(difficulty: AIDifficulty): AIPlayer {
  return new AIPlayer(difficulty);
}

/**
 * Get AI player names by difficulty
 */
export function getAIName(difficulty: AIDifficulty): string {
  const names: Record<AIDifficulty, string[]> = {
    easy: ['Zombie', 'Creeper', 'Spider', 'Skeleton'],
    medium: ['Enderman', 'Blaze', 'Ghast', 'Witch'],
    hard: ['Wither', 'Ender Dragon', 'Warden', 'Elder Guardian']
  };

  const nameList = names[difficulty];
  return nameList[Math.floor(Math.random() * nameList.length)];
}

/**
 * Generate a random deck for AI
 */
export function generateAIDeck(
  availableCardIds: string[],
  _difficulty: AIDifficulty
): string[] {
  // For harder difficulties, build a more optimized deck
  const deckSize = 30;
  const deck: string[] = [];

  // Shuffle available cards
  const shuffled = [...availableCardIds].sort(() => Math.random() - 0.5);

  // For hard AI, prefer better cards (could be enhanced with actual card evaluation)
  // For now, just random selection

  // Add cards to deck (max 2 copies each)
  const cardCounts = new Map<string, number>();

  for (const cardId of shuffled) {
    const count = cardCounts.get(cardId) || 0;
    if (count < 2 && deck.length < deckSize) {
      deck.push(cardId);
      cardCounts.set(cardId, count + 1);
    }

    if (deck.length >= deckSize) break;
  }

  // If not enough cards, duplicate some
  while (deck.length < deckSize && shuffled.length > 0) {
    const cardId = shuffled[Math.floor(Math.random() * shuffled.length)];
    const count = cardCounts.get(cardId) || 0;
    if (count < 2) {
      deck.push(cardId);
      cardCounts.set(cardId, count + 1);
    }
  }

  return deck;
}
