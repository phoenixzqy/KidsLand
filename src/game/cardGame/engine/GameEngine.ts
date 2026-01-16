/**
 * Card Game Engine
 * Implements Hearthstone-like game rules
 */

import type {
  GameState,
  PlayerState,
  GameCard,
  CardDefinition,
  GameAction,
  ActionResult,
  TurnOwner,
  GameWinner,
  CardEffect,
  Deck
} from '../../../types/cardGame';

// Re-export constants
export { GAME_CONSTANTS } from '../../../types/cardGame';

/**
 * Generate a unique instance ID for a card
 */
function generateInstanceId(): string {
  return `inst_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a GameCard instance from a CardDefinition
 */
export function createGameCard(definition: CardDefinition): GameCard {
  return {
    ...definition,
    instanceId: generateInstanceId(),
    currentHealth: definition.health,
    currentAttack: definition.attack,
    canAttack: false, // Summoning sickness by default
    attacksThisTurn: 0,
    hasDivineShield: definition.keywords?.includes('divine_shield') || false,
    isFrozen: false,
    isSilenced: false,
    isStealthed: definition.keywords?.includes('stealth') || false,
    buffs: []
  };
}

/**
 * Create initial player state
 */
function createPlayerState(name: string, deckCards: GameCard[]): PlayerState {
  // Shuffle the deck
  const shuffledDeck = [...deckCards].sort(() => Math.random() - 0.5);

  return {
    name,
    health: 30,
    maxHealth: 30,
    mana: 0,
    maxMana: 0,
    deck: shuffledDeck,
    hand: [],
    field: [],
    graveyard: [],
    fatigueDamage: 0,
    heroPowerUsed: false
  };
}

/**
 * Draw cards for a player
 */
function drawCards(player: PlayerState, count: number): { drawnCards: GameCard[]; fatigueDealt: number } {
  const drawnCards: GameCard[] = [];
  let fatigueDealt = 0;

  for (let i = 0; i < count; i++) {
    if (player.deck.length > 0) {
      const card = player.deck.shift()!;

      // Check hand limit (10 cards)
      if (player.hand.length < 10) {
        player.hand.push(card);
        drawnCards.push(card);
      }
      // If hand is full, card is burned (discarded)
    } else {
      // Fatigue damage
      player.fatigueDamage++;
      player.health -= player.fatigueDamage;
      fatigueDealt += player.fatigueDamage;
    }
  }

  return { drawnCards, fatigueDealt };
}

/**
 * Main Game Engine class
 */
export class GameEngine {
  private state: GameState;
  private cardDefinitions: Map<string, CardDefinition>;

  constructor(cardDefinitions: CardDefinition[]) {
    this.cardDefinitions = new Map(cardDefinitions.map(c => [c.id, c]));
    this.state = this.createEmptyState();
  }

  private createEmptyState(): GameState {
    return {
      id: `game_${Date.now()}`,
      phase: 'not_started',
      turnNumber: 0,
      currentTurn: 'player',
      player: createPlayerState('Player', []),
      opponent: createPlayerState('Opponent', []),
      actionHistory: [],
      startedAt: Date.now()
    };
  }

  /**
   * Get current game state (readonly copy)
   */
  getState(): Readonly<GameState> {
    return { ...this.state };
  }

  /**
   * Start a new game
   */
  startGame(
    playerDeck: Deck,
    opponentDeck: Deck,
    playerName: string = 'Player',
    opponentName: string = 'Opponent',
    playerGoesFirst: boolean = Math.random() < 0.5
  ): GameState {
    // Convert deck card IDs to GameCard instances
    const playerCards = this.deckToGameCards(playerDeck.cardIds);
    const opponentCards = this.deckToGameCards(opponentDeck.cardIds);

    // Create player states
    this.state = {
      id: `game_${Date.now()}`,
      phase: 'mulligan',
      turnNumber: 0,
      currentTurn: playerGoesFirst ? 'player' : 'opponent',
      player: createPlayerState(playerName, playerCards),
      opponent: createPlayerState(opponentName, opponentCards),
      actionHistory: [],
      startedAt: Date.now()
    };

    // Draw initial hands
    const playerDrawCount = playerGoesFirst ? 3 : 4;
    const opponentDrawCount = playerGoesFirst ? 4 : 3;

    drawCards(this.state.player, playerDrawCount);
    drawCards(this.state.opponent, opponentDrawCount);

    // Log game start
    this.logAction('GAME_START', playerGoesFirst ? 'player' : 'opponent');

    return this.getState();
  }

  /**
   * Convert deck card IDs to GameCard instances
   */
  private deckToGameCards(cardIds: string[]): GameCard[] {
    return cardIds
      .map(id => {
        const definition = this.cardDefinitions.get(id);
        if (!definition) {
          console.warn(`Card definition not found: ${id}`);
          return null;
        }
        return createGameCard(definition);
      })
      .filter((card): card is GameCard => card !== null);
  }

  /**
   * Complete mulligan phase
   * @param cardsToReplace Card instance IDs to replace from hand
   */
  mulligan(cardsToReplace: string[], isPlayer: boolean = true): ActionResult {
    if (this.state.phase !== 'mulligan') {
      return { success: false, error: 'Not in mulligan phase' };
    }

    const playerState = isPlayer ? this.state.player : this.state.opponent;

    // Find cards to replace
    const replacedCards: GameCard[] = [];
    for (const instanceId of cardsToReplace) {
      const index = playerState.hand.findIndex(c => c.instanceId === instanceId);
      if (index !== -1) {
        const card = playerState.hand.splice(index, 1)[0];
        replacedCards.push(card);
      }
    }

    // Draw new cards
    drawCards(playerState, replacedCards.length);

    // Shuffle replaced cards back into deck
    playerState.deck.push(...replacedCards);
    playerState.deck.sort(() => Math.random() - 0.5);

    this.logAction('MULLIGAN', isPlayer ? 'player' : 'opponent', {
      cardsDrawn: replacedCards.length
    });

    return { success: true };
  }

  /**
   * Start the game after mulligan
   */
  startPlaying(): ActionResult {
    if (this.state.phase !== 'mulligan') {
      return { success: false, error: 'Not in mulligan phase' };
    }

    this.state.phase = 'playing';
    this.state.turnNumber = 1;

    // Start first turn
    this.beginTurn();

    return { success: true };
  }

  /**
   * Begin a new turn
   */
  private beginTurn(): void {
    const activePlayer = this.getActivePlayer();

    // Increase max mana (up to 10)
    if (activePlayer.maxMana < 10) {
      activePlayer.maxMana++;
    }

    // Refresh mana
    activePlayer.mana = activePlayer.maxMana;

    // Reset hero power
    activePlayer.heroPowerUsed = false;

    // Draw a card
    drawCards(activePlayer, 1);

    // Unfreeze and reset attack status for minions
    for (const minion of activePlayer.field) {
      minion.isFrozen = false;
      minion.attacksThisTurn = 0;

      // Minions can attack (unless summoned this turn)
      if (!minion.keywords?.includes('charge')) {
        minion.canAttack = true;
      }
    }

    this.logAction('DRAW_CARD', this.state.currentTurn);
  }

  /**
   * Play a card from hand
   */
  playCard(cardInstanceId: string, targetInstanceId?: string): ActionResult {
    if (this.state.phase !== 'playing') {
      return { success: false, error: 'Game not in playing phase' };
    }

    const activePlayer = this.getActivePlayer();

    // Find card in hand
    const cardIndex = activePlayer.hand.findIndex(c => c.instanceId === cardInstanceId);
    if (cardIndex === -1) {
      return { success: false, error: 'Card not in hand' };
    }

    const card = activePlayer.hand[cardIndex];

    // Check mana cost
    if (card.manaCost > activePlayer.mana) {
      return { success: false, error: 'Not enough mana' };
    }

    // Check field limit for minions
    if (card.type === 'minion' && activePlayer.field.length >= 7) {
      return { success: false, error: 'Battlefield is full' };
    }

    // Remove from hand and spend mana
    activePlayer.hand.splice(cardIndex, 1);
    activePlayer.mana -= card.manaCost;

    // Place on field
    if (card.type === 'minion') {
      // Set initial canAttack based on charge keyword
      card.canAttack = card.keywords?.includes('charge') || false;
      activePlayer.field.push(card);

      // Trigger battlecry
      if (card.battlecry && !card.isSilenced) {
        this.applyEffect(card.battlecry, card, targetInstanceId);
      }
    }

    this.logAction('PLAY_CARD', this.state.currentTurn, { cardId: card.id });

    // Check for game over
    this.checkGameOver();

    return { success: true };
  }

  /**
   * Attack with a minion
   */
  attack(attackerInstanceId: string, targetInstanceId: string): ActionResult {
    if (this.state.phase !== 'playing') {
      return { success: false, error: 'Game not in playing phase' };
    }

    const activePlayer = this.getActivePlayer();
    const opponent = this.getInactivePlayer();

    // Find attacker
    const attacker = activePlayer.field.find(c => c.instanceId === attackerInstanceId);
    if (!attacker) {
      return { success: false, error: 'Attacker not found' };
    }

    // Check if can attack
    if (!attacker.canAttack) {
      return { success: false, error: 'Minion cannot attack (summoning sickness)' };
    }

    if (attacker.isFrozen) {
      return { success: false, error: 'Minion is frozen' };
    }

    // Check attack limit (windfury allows 2)
    const maxAttacks = attacker.keywords?.includes('windfury') ? 2 : 1;
    if (attacker.attacksThisTurn >= maxAttacks) {
      return { success: false, error: 'Minion has already attacked' };
    }

    // Check for taunt
    const tauntMinions = opponent.field.filter(
      m => m.keywords?.includes('taunt') && !m.isStealthed
    );
    if (tauntMinions.length > 0) {
      const target = opponent.field.find(c => c.instanceId === targetInstanceId);
      if (!target || !target.keywords?.includes('taunt')) {
        return { success: false, error: 'Must attack a taunt minion' };
      }
    }

    // Find target (minion or hero)
    const targetMinion = opponent.field.find(c => c.instanceId === targetInstanceId);

    if (targetMinion) {
      // Check if target is stealthed
      if (targetMinion.isStealthed) {
        return { success: false, error: 'Cannot attack stealthed minion' };
      }

      // Minion vs minion combat
      this.minionCombat(attacker, targetMinion, activePlayer, opponent);
    } else if (targetInstanceId === 'hero') {
      // Attack hero
      this.attackHero(attacker, opponent);
    } else {
      return { success: false, error: 'Invalid target' };
    }

    // Attacker loses stealth after attacking
    attacker.isStealthed = false;

    // Increment attack count
    attacker.attacksThisTurn++;

    // Check for game over
    this.checkGameOver();

    return { success: true };
  }

  /**
   * Minion vs minion combat
   */
  private minionCombat(
    attacker: GameCard,
    defender: GameCard,
    attackerOwner: PlayerState,
    defenderOwner: PlayerState
  ): void {
    // Deal damage to defender
    this.dealDamageToMinion(defender, attacker.currentAttack, defenderOwner);

    // Deal damage to attacker (unless defender has 0 attack)
    if (defender.currentAttack > 0) {
      this.dealDamageToMinion(attacker, defender.currentAttack, attackerOwner);
    }

    // Lifesteal
    if (attacker.keywords?.includes('lifesteal')) {
      attackerOwner.health = Math.min(
        attackerOwner.maxHealth,
        attackerOwner.health + attacker.currentAttack
      );
    }

    this.logAction('ATTACK_MINION', this.state.currentTurn, {
      cardId: attacker.id,
      targetId: defender.id,
      damage: attacker.currentAttack
    });
  }

  /**
   * Deal damage to a minion
   */
  private dealDamageToMinion(
    minion: GameCard,
    damage: number,
    owner: PlayerState
  ): void {
    // Check divine shield
    if (minion.hasDivineShield && damage > 0) {
      minion.hasDivineShield = false;
      return;
    }

    minion.currentHealth -= damage;

    // Check if minion dies
    if (minion.currentHealth <= 0) {
      this.destroyMinion(minion, owner);
    }
  }

  /**
   * Attack the opponent's hero
   */
  private attackHero(attacker: GameCard, opponent: PlayerState): void {
    opponent.health -= attacker.currentAttack;

    // Lifesteal
    if (attacker.keywords?.includes('lifesteal')) {
      const activePlayer = this.getActivePlayer();
      activePlayer.health = Math.min(
        activePlayer.maxHealth,
        activePlayer.health + attacker.currentAttack
      );
    }

    this.logAction('ATTACK_HERO', this.state.currentTurn, {
      cardId: attacker.id,
      damage: attacker.currentAttack
    });
  }

  /**
   * Destroy a minion
   */
  private destroyMinion(minion: GameCard, owner: PlayerState): void {
    const index = owner.field.findIndex(c => c.instanceId === minion.instanceId);
    if (index !== -1) {
      owner.field.splice(index, 1);
      owner.graveyard.push(minion);

      // Trigger deathrattle
      if (minion.deathrattle && !minion.isSilenced) {
        this.applyEffect(minion.deathrattle, minion);
      }

      this.logAction('MINION_DIED', this.state.currentTurn, { cardId: minion.id });
    }
  }

  /**
   * Apply a card effect
   */
  private applyEffect(
    effect: CardEffect,
    _source: GameCard,
    targetInstanceId?: string
  ): void {
    const activePlayer = this.getActivePlayer();
    const opponent = this.getInactivePlayer();

    switch (effect.type) {
      case 'damage':
        this.applyDamageEffect(effect, activePlayer, opponent, targetInstanceId);
        break;

      case 'heal':
        this.applyHealEffect(effect, activePlayer, opponent, targetInstanceId);
        break;

      case 'draw':
        drawCards(activePlayer, effect.value);
        break;

      case 'buff':
        this.applyBuffEffect(effect, activePlayer, opponent, targetInstanceId);
        break;

      case 'freeze':
        this.applyFreezeEffect(effect, opponent, targetInstanceId);
        break;
    }

    this.logAction('TRIGGER_EFFECT', this.state.currentTurn, {
      effectTriggered: effect.type
    });
  }

  private applyDamageEffect(
    effect: CardEffect,
    _activePlayer: PlayerState,
    opponent: PlayerState,
    targetInstanceId?: string
  ): void {
    switch (effect.target) {
      case 'enemy_minion':
        if (targetInstanceId) {
          const target = opponent.field.find(c => c.instanceId === targetInstanceId);
          if (target) {
            this.dealDamageToMinion(target, effect.value, opponent);
          }
        }
        break;

      case 'all_enemy_minions':
        for (const minion of [...opponent.field]) {
          this.dealDamageToMinion(minion, effect.value, opponent);
        }
        break;

      case 'random_enemy_minion':
        if (opponent.field.length > 0) {
          const randomTarget = opponent.field[Math.floor(Math.random() * opponent.field.length)];
          this.dealDamageToMinion(randomTarget, effect.value, opponent);
        }
        break;

      case 'enemy_hero':
        opponent.health -= effect.value;
        break;

      case 'random_enemy':
        const targets = [...opponent.field, 'hero'];
        const target = targets[Math.floor(Math.random() * targets.length)];
        if (target === 'hero') {
          opponent.health -= effect.value;
        } else {
          this.dealDamageToMinion(target as GameCard, effect.value, opponent);
        }
        break;
    }
  }

  private applyHealEffect(
    effect: CardEffect,
    activePlayer: PlayerState,
    _opponent: PlayerState,
    targetInstanceId?: string
  ): void {
    switch (effect.target) {
      case 'friendly_hero':
        activePlayer.health = Math.min(
          activePlayer.maxHealth,
          activePlayer.health + effect.value
        );
        break;

      case 'friendly_minion':
        if (targetInstanceId) {
          const target = activePlayer.field.find(c => c.instanceId === targetInstanceId);
          if (target) {
            target.currentHealth = Math.min(target.health, target.currentHealth + effect.value);
          }
        }
        break;

      case 'all_friendly_minions':
        for (const minion of activePlayer.field) {
          minion.currentHealth = Math.min(minion.health, minion.currentHealth + effect.value);
        }
        break;
    }
  }

  private applyBuffEffect(
    effect: CardEffect,
    activePlayer: PlayerState,
    _opponent: PlayerState,
    targetInstanceId?: string
  ): void {
    const attackBuff = effect.value;
    const healthBuff = effect.secondaryValue || 0;

    switch (effect.target) {
      case 'friendly_minion':
        if (targetInstanceId) {
          const target = activePlayer.field.find(c => c.instanceId === targetInstanceId);
          if (target) {
            target.currentAttack += attackBuff;
            target.currentHealth += healthBuff;
            target.health += healthBuff; // Increase max health too
          }
        }
        break;

      case 'all_friendly_minions':
        for (const minion of activePlayer.field) {
          minion.currentAttack += attackBuff;
          minion.currentHealth += healthBuff;
          minion.health += healthBuff;
        }
        break;
    }
  }

  private applyFreezeEffect(
    effect: CardEffect,
    opponent: PlayerState,
    targetInstanceId?: string
  ): void {
    switch (effect.target) {
      case 'enemy_minion':
        if (targetInstanceId) {
          const target = opponent.field.find(c => c.instanceId === targetInstanceId);
          if (target) {
            target.isFrozen = true;
          }
        }
        break;

      case 'all_enemy_minions':
        for (const minion of opponent.field) {
          minion.isFrozen = true;
        }
        break;
    }
  }

  /**
   * End the current turn
   */
  endTurn(): ActionResult {
    if (this.state.phase !== 'playing') {
      return { success: false, error: 'Game not in playing phase' };
    }

    this.logAction('END_TURN', this.state.currentTurn);

    // Switch turns
    this.state.currentTurn = this.state.currentTurn === 'player' ? 'opponent' : 'player';

    // Increment turn number when it becomes player's turn again
    if (this.state.currentTurn === 'player') {
      this.state.turnNumber++;
    }

    // Begin next turn
    this.beginTurn();

    return { success: true };
  }

  /**
   * Check if game is over
   */
  private checkGameOver(): boolean {
    if (this.state.player.health <= 0 && this.state.opponent.health <= 0) {
      this.endGame('draw');
      return true;
    }

    if (this.state.player.health <= 0) {
      this.endGame('opponent');
      return true;
    }

    if (this.state.opponent.health <= 0) {
      this.endGame('player');
      return true;
    }

    return false;
  }

  /**
   * End the game
   */
  private endGame(winner: GameWinner): void {
    this.state.phase = 'game_over';
    this.state.winner = winner;
    this.state.endedAt = Date.now();

    this.logAction('GAME_END', this.state.currentTurn);
  }

  /**
   * Get the active player's state
   */
  private getActivePlayer(): PlayerState {
    return this.state.currentTurn === 'player' ? this.state.player : this.state.opponent;
  }

  /**
   * Get the inactive player's state
   */
  private getInactivePlayer(): PlayerState {
    return this.state.currentTurn === 'player' ? this.state.opponent : this.state.player;
  }

  /**
   * Log an action to history
   */
  private logAction(
    type: GameAction['type'],
    actor: TurnOwner,
    data?: GameAction['data']
  ): void {
    this.state.actionHistory.push({
      type,
      actor,
      timestamp: Date.now(),
      data
    });
  }

  /**
   * Get valid targets for a card's battlecry
   */
  getValidTargets(card: GameCard): string[] {
    if (!card.battlecry) return [];

    const activePlayer = this.getActivePlayer();
    const opponent = this.getInactivePlayer();
    const targets: string[] = [];

    switch (card.battlecry.target) {
      case 'enemy_minion':
        targets.push(...opponent.field.map(m => m.instanceId));
        break;

      case 'friendly_minion':
        targets.push(...activePlayer.field.map(m => m.instanceId));
        break;

      case 'all_minions':
        targets.push(...activePlayer.field.map(m => m.instanceId));
        targets.push(...opponent.field.map(m => m.instanceId));
        break;
    }

    return targets;
  }

  /**
   * Get valid attack targets for a minion
   */
  getValidAttackTargets(attackerInstanceId: string): string[] {
    const activePlayer = this.getActivePlayer();
    const opponent = this.getInactivePlayer();

    const attacker = activePlayer.field.find(c => c.instanceId === attackerInstanceId);
    if (!attacker || !attacker.canAttack || attacker.isFrozen) {
      return [];
    }

    // Check attack limit
    const maxAttacks = attacker.keywords?.includes('windfury') ? 2 : 1;
    if (attacker.attacksThisTurn >= maxAttacks) {
      return [];
    }

    const targets: string[] = [];

    // Check for taunt
    const tauntMinions = opponent.field.filter(
      m => m.keywords?.includes('taunt') && !m.isStealthed
    );

    if (tauntMinions.length > 0) {
      // Can only attack taunt minions
      targets.push(...tauntMinions.map(m => m.instanceId));
    } else {
      // Can attack any non-stealthed minion or hero
      targets.push(
        ...opponent.field
          .filter(m => !m.isStealthed)
          .map(m => m.instanceId)
      );
      targets.push('hero');
    }

    return targets;
  }

  /**
   * Check if a card can be played
   */
  canPlayCard(cardInstanceId: string): boolean {
    const activePlayer = this.getActivePlayer();
    const card = activePlayer.hand.find(c => c.instanceId === cardInstanceId);

    if (!card) return false;
    if (card.manaCost > activePlayer.mana) return false;
    if (card.type === 'minion' && activePlayer.field.length >= 7) return false;

    return true;
  }

  /**
   * Get playable cards from hand
   */
  getPlayableCards(): string[] {
    const activePlayer = this.getActivePlayer();
    return activePlayer.hand
      .filter(card => this.canPlayCard(card.instanceId))
      .map(card => card.instanceId);
  }

  /**
   * Get minions that can attack
   */
  getAttackableMinions(): string[] {
    const activePlayer = this.getActivePlayer();
    return activePlayer.field
      .filter(minion => {
        if (!minion.canAttack || minion.isFrozen) return false;
        const maxAttacks = minion.keywords?.includes('windfury') ? 2 : 1;
        return minion.attacksThisTurn < maxAttacks;
      })
      .map(minion => minion.instanceId);
  }
}
