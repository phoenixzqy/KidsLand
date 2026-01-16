/**
 * useGameState Hook
 * Manages game state and AI turns
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  GameState,
  GameCard,
  Deck,
  AIDifficulty,
  CardDefinition
} from '../../../types/cardGame';
import { GameEngine } from '../../../game/cardGame/engine/GameEngine';
import { AIPlayer, getAIName, generateAIDeck } from '../../../game/cardGame/ai/AIPlayer';

interface UseGameStateOptions {
  playerDeck: Deck;
  cardDefinitions: CardDefinition[];
  aiDifficulty: AIDifficulty;
  playerName?: string;
  onGameEnd?: (winner: 'player' | 'opponent' | 'draw', gameState: GameState) => void;
}

interface UseGameStateReturn {
  gameState: GameState | null;
  isPlayerTurn: boolean;
  isLoading: boolean;
  selectedCard: GameCard | null;
  selectedAttacker: GameCard | null;
  validTargets: string[];
  error: string | null;
  aiAttackInfo: { attackerId: string; targetId: string } | null;

  // Actions
  startGame: () => void;
  mulligan: (cardIds: string[]) => void;
  startPlaying: () => void;
  selectCard: (card: GameCard | null) => void;
  selectAttacker: (card: GameCard | null) => void;
  playCard: (cardId: string, targetId?: string) => void;
  attack: (attackerId: string, targetId: string) => void;
  endTurn: () => void;
  resetGame: () => void;
}

export function useGameState(options: UseGameStateOptions | null): UseGameStateReturn {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState<GameCard | null>(null);
  const [selectedAttacker, setSelectedAttacker] = useState<GameCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiAttackInfo, setAiAttackInfo] = useState<{ attackerId: string; targetId: string } | null>(null);

  // Keep engine and AI in refs to persist across renders
  const engineRef = useRef<GameEngine | null>(null);
  const aiRef = useRef<AIPlayer | null>(null);

  // Initialize game engine
  useEffect(() => {
    if (!options) {
      engineRef.current = null;
      aiRef.current = null;
      setGameState(null);
      return;
    }

    engineRef.current = new GameEngine(options.cardDefinitions);
    aiRef.current = new AIPlayer(options.aiDifficulty);
  }, [options?.aiDifficulty, options?.cardDefinitions]);

  // Check if it's player's turn
  const isPlayerTurn = gameState?.currentTurn === 'player' && gameState?.phase === 'playing';

  // Calculate valid targets based on selection
  const validTargets = useCallback((): string[] => {
    if (!engineRef.current || !gameState) return [];

    if (selectedCard?.battlecry) {
      return engineRef.current.getValidTargets(selectedCard);
    }

    if (selectedAttacker) {
      return engineRef.current.getValidAttackTargets(selectedAttacker.instanceId);
    }

    return [];
  }, [gameState, selectedCard, selectedAttacker]);

  // Start a new game
  const startGame = useCallback(() => {
    if (!options || !engineRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      // Generate AI deck from available cards
      const allCardIds = options.cardDefinitions.map(c => c.id);
      const aiDeckCardIds = generateAIDeck(allCardIds, options.aiDifficulty);
      const aiDeck: Deck = {
        id: 'ai-deck',
        name: 'AI Deck',
        cardIds: aiDeckCardIds,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const aiName = getAIName(options.aiDifficulty);

      const newState = engineRef.current.startGame(
        options.playerDeck,
        aiDeck,
        options.playerName || 'Player',
        aiName
      );

      setGameState(newState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game');
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  // Mulligan cards
  const mulligan = useCallback((cardIds: string[]) => {
    if (!engineRef.current || gameState?.phase !== 'mulligan') return;

    const result = engineRef.current.mulligan(cardIds, true);
    if (result.success) {
      setGameState(engineRef.current.getState());
    } else {
      setError(result.error || 'Mulligan failed');
    }
  }, [gameState?.phase]);

  // Start the playing phase after mulligan
  const startPlaying = useCallback(() => {
    if (!engineRef.current || gameState?.phase !== 'mulligan') return;

    // AI mulligan (simple: replace high-cost cards)
    const aiHand = gameState.opponent.hand;
    const highCostCards = aiHand
      .filter(c => c.manaCost > 4)
      .map(c => c.instanceId);
    engineRef.current.mulligan(highCostCards, false);

    const result = engineRef.current.startPlaying();
    if (result.success) {
      setGameState(engineRef.current.getState());
    } else {
      setError(result.error || 'Failed to start game');
    }
  }, [gameState]);

  // Select a card from hand
  const selectCard = useCallback((card: GameCard | null) => {
    setSelectedCard(card);
    setSelectedAttacker(null);
  }, []);

  // Select an attacker minion
  const selectAttacker = useCallback((card: GameCard | null) => {
    setSelectedAttacker(card);
    setSelectedCard(null);
  }, []);

  // Play a card
  const playCard = useCallback((cardId: string, targetId?: string) => {
    if (!engineRef.current || !isPlayerTurn) return;

    const result = engineRef.current.playCard(cardId, targetId);
    if (result.success) {
      setGameState(engineRef.current.getState());
      setSelectedCard(null);
    } else {
      setError(result.error || 'Failed to play card');
    }
  }, [isPlayerTurn]);

  // Attack with a minion
  const attack = useCallback((attackerId: string, targetId: string) => {
    if (!engineRef.current || !isPlayerTurn) return;

    const result = engineRef.current.attack(attackerId, targetId);
    if (result.success) {
      setGameState(engineRef.current.getState());
      setSelectedAttacker(null);
    } else {
      setError(result.error || 'Attack failed');
    }
  }, [isPlayerTurn]);

  // End turn
  const endTurn = useCallback(() => {
    if (!engineRef.current || !isPlayerTurn) return;

    const result = engineRef.current.endTurn();
    if (result.success) {
      setGameState(engineRef.current.getState());
      setSelectedCard(null);
      setSelectedAttacker(null);
    } else {
      setError(result.error || 'Failed to end turn');
    }
  }, [isPlayerTurn]);

  // Reset game
  const resetGame = useCallback(() => {
    setGameState(null);
    setSelectedCard(null);
    setSelectedAttacker(null);
    setError(null);
  }, []);

  // Handle AI turn
  useEffect(() => {
    if (!gameState || !engineRef.current || !aiRef.current) return;
    if (gameState.phase !== 'playing' || gameState.currentTurn !== 'opponent') return;

    const runAITurn = async () => {
      setIsLoading(true);

      try {
        const decisions = await aiRef.current!.decideTurn(engineRef.current!);

        // Execute AI decisions with delays for animation
        for (const decision of decisions) {
          if (gameState?.phase === 'game_over') break;

          // Small delay between actions for visual feedback
          await new Promise(resolve => setTimeout(resolve, 300));

          switch (decision.action) {
            case 'PLAY_CARD':
              if (decision.cardId) {
                engineRef.current!.playCard(decision.cardId, decision.targetId);
              }
              break;

            case 'ATTACK_MINION':
            case 'ATTACK_HERO':
              if (decision.cardId && decision.targetId) {
                // Set attack info for animation
                setAiAttackInfo({ attackerId: decision.cardId, targetId: decision.targetId });
                // Wait for animation
                await new Promise(resolve => setTimeout(resolve, 500));
                engineRef.current!.attack(decision.cardId, decision.targetId);
                // Clear attack info after attack
                setAiAttackInfo(null);
              }
              break;

            case 'END_TURN':
              engineRef.current!.endTurn();
              break;
          }

          setGameState(engineRef.current!.getState());
        }
      } catch (err) {
        console.error('AI turn error:', err);
        // End turn anyway to prevent softlock
        engineRef.current?.endTurn();
        setGameState(engineRef.current?.getState() || null);
      } finally {
        setIsLoading(false);
      }
    };

    runAITurn();
  }, [gameState?.currentTurn, gameState?.phase, gameState?.turnNumber]);

  // Handle game end
  useEffect(() => {
    if (!gameState || gameState.phase !== 'game_over' || !options?.onGameEnd) return;
    if (gameState.winner) {
      options.onGameEnd(gameState.winner, gameState);
    }
  }, [gameState?.phase, gameState?.winner, options]);

  return {
    gameState,
    isPlayerTurn,
    isLoading,
    selectedCard,
    selectedAttacker,
    validTargets: validTargets(),
    error,
    aiAttackInfo,

    startGame,
    mulligan,
    startPlaying,
    selectCard,
    selectAttacker,
    playCard,
    attack,
    endTurn,
    resetGame
  };
}

export default useGameState;
