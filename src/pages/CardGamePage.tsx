/**
 * CardGamePage Component
 * Main page for the card battle game
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getAllDecks, createDeck, addStars, saveMatchResult } from '../db/database';
import { useUser } from '../contexts/UserContext';
import type { Deck, AIDifficulty, GameState } from '../types/cardGame';
import type { Prize } from '../types';
import { getCardDefinitions } from '../game/cardGame/data/cardDefinitions';
import { generateBalancedDeck } from '../game/cardGame/utils/deckGenerator';
import {
  getUnlockProgress,
  getOwnedCardDefinitions,
  calculateGameRewards,
  calculateMatchStats
} from '../game/cardGame/utils/cardIntegration';
import { useGameState } from '../components/cardGame/hooks/useGameState';
import { MainMenu } from '../components/cardGame/menus/MainMenu';
import { DeckSelector } from '../components/cardGame/menus/DeckSelector';
import { MulliganScreen } from '../components/cardGame/menus/MulliganScreen';
import { GameOverScreen } from '../components/cardGame/menus/GameOverScreen';
import { GameBoard } from '../components/cardGame/board/GameBoard';
import prizesData from '../data/prizes.json';

// Cast prizes to proper type
const prizes = prizesData.prizes as Prize[];

type GameScreen = 'menu' | 'deck-select' | 'mulligan' | 'playing' | 'game-over';

export function CardGamePage() {
  const navigate = useNavigate();
  const { refreshData } = useUser();

  // Local state
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('easy');
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [gameEndData, setGameEndData] = useState<{
    winner: 'player' | 'opponent' | 'draw';
    reward: ReturnType<typeof calculateGameRewards>;
    stats: ReturnType<typeof calculateMatchStats>;
  } | null>(null);

  // Database queries - undefined means still loading
  const ownedItemsQuery = useLiveQuery(() => db.ownedItems.toArray());
  const decksQuery = useLiveQuery(() => getAllDecks());

  const ownedItems = ownedItemsQuery || [];
  const decks = decksQuery || [];
  const isDataLoading = ownedItemsQuery === undefined;

  // Get all card definitions
  const allCardDefinitions = useMemo(() => {
    return getCardDefinitions(prizes);
  }, []);

  const cardDefinitionsMap = useMemo(() => {
    return new Map(allCardDefinitions.map(c => [c.id, c]));
  }, [allCardDefinitions]);

  // Get owned card definitions
  const ownedCardDefinitions = useMemo(() => {
    return getOwnedCardDefinitions(ownedItems, prizes, allCardDefinitions);
  }, [ownedItems, allCardDefinitions]);

  // Check if game is unlocked
  const unlockProgress = useMemo(() => {
    return getUnlockProgress(ownedItems, prizes);
  }, [ownedItems]);

  // Redirect if not enough cards (only after data loads)
  useEffect(() => {
    if (!isDataLoading && !unlockProgress.isUnlocked) {
      navigate('/games');
    }
  }, [isDataLoading, unlockProgress.isUnlocked, navigate]);

  // Handle game end
  const handleGameEnd = useCallback(async (winner: 'player' | 'opponent' | 'draw', gameState: GameState) => {
    const reward = calculateGameRewards(gameState, difficulty);
    const stats = calculateMatchStats(gameState);

    // Save rewards
    if (reward.totalStars > 0) {
      await addStars(reward.totalStars);
      refreshData();
    }

    // Save match history
    if (selectedDeck) {
      await saveMatchResult({
        deckId: selectedDeck.id,
        deckName: selectedDeck.name,
        opponentType: 'ai',
        opponentDifficulty: difficulty,
        opponentName: gameState.opponent.name,
        winner,
        playerFinalHealth: gameState.player.health,
        opponentFinalHealth: gameState.opponent.health,
        totalTurns: gameState.turnNumber,
        cardsPlayed: stats.playerCardsPlayed,
        damageDealt: stats.playerDamageDealt,
        minionsKilled: stats.playerMinionsKilled,
        starsEarned: reward.totalStars,
        playedAt: Date.now(),
        duration: stats.duration
      });
    }

    setGameEndData({ winner, reward, stats });
    setScreen('game-over');
  }, [difficulty, selectedDeck, refreshData]);

  // Initialize game state hook
  const gameConfig = useMemo(() => {
    if (!selectedDeck || (screen !== 'mulligan' && screen !== 'playing' && screen !== 'game-over')) {
      return null;
    }
    return {
      playerDeck: selectedDeck,
      cardDefinitions: allCardDefinitions,
      aiDifficulty: difficulty,
      playerName: 'Player',
      onGameEnd: handleGameEnd
    };
  }, [selectedDeck, screen, allCardDefinitions, difficulty, handleGameEnd]);

  const {
    gameState,
    isPlayerTurn,
    isLoading,
    selectedCard,
    selectedAttacker,
    validTargets,
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
  } = useGameState(gameConfig);

  // Auto-create deck if user has none
  useEffect(() => {
    // Only run once data is loaded and user has no decks
    if (isDataLoading || decks.length > 0 || ownedCardDefinitions.length < 30) {
      return;
    }
    
    const autoCreateDeck = async () => {
      const newDeck = generateBalancedDeck(ownedCardDefinitions, 'My First Deck');
      await createDeck(newDeck.name, newDeck.cardIds);
    };
    autoCreateDeck();
    // Only depend on isDataLoading to prevent multiple runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDataLoading]);

  // Handle play button from menu
  const handlePlay = () => {
    if (decks.length === 0) {
      // Auto-create and select a deck
      const newDeck = generateBalancedDeck(ownedCardDefinitions, 'Auto Deck');
      createDeck(newDeck.name, newDeck.cardIds).then((savedDeck) => {
        setSelectedDeck(savedDeck);
        setScreen('mulligan');
      });
    } else {
      setScreen('deck-select');
    }
  };

  // Handle deck selection
  const handleDeckSelect = (deck: Deck) => {
    setSelectedDeck(deck);
    setScreen('mulligan');
  };

  // Start game after deck selection
  useEffect(() => {
    if (screen === 'mulligan' && selectedDeck && !gameState) {
      startGame();
    }
  }, [screen, selectedDeck, gameState, startGame]);

  // Handle mulligan confirmation
  const handleMulliganConfirm = (cardIds: string[]) => {
    mulligan(cardIds);
    startPlaying();
    setScreen('playing');
  };

  // Handle game over actions
  const handlePlayAgain = () => {
    resetGame();
    setGameEndData(null);
    setScreen('deck-select');
  };

  const handleMainMenu = () => {
    resetGame();
    setGameEndData(null);
    setSelectedDeck(null);
    setScreen('menu');
  };

  // Update screen based on game state
  useEffect(() => {
    if (gameState?.phase === 'game_over' && screen === 'playing') {
      // Game end is handled by the callback
    }
  }, [gameState?.phase, screen]);

  // Render based on current screen
  const renderScreen = () => {
    switch (screen) {
      case 'menu':
        return (
          <MainMenu
            onPlay={handlePlay}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
          />
        );

      case 'deck-select':
        return (
          <DeckSelector
            decks={decks}
            cardDefinitions={cardDefinitionsMap}
            onSelectDeck={handleDeckSelect}
            onBack={() => setScreen('menu')}
            onCreateDeck={() => navigate('/games/card-battle/decks')}
          />
        );

      case 'mulligan':
        if (!gameState || gameState.phase !== 'mulligan') {
          return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
              <div className="text-white text-xl">Loading game...</div>
            </div>
          );
        }
        return (
          <MulliganScreen
            hand={gameState.player.hand}
            onConfirm={handleMulliganConfirm}
          />
        );

      case 'playing':
        if (!gameState) {
          return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
              <div className="text-white text-xl">Loading...</div>
            </div>
          );
        }
        return (
          <GameBoard
            gameState={gameState}
            isPlayerTurn={isPlayerTurn}
            selectedCard={selectedCard}
            selectedAttacker={selectedAttacker}
            validTargets={validTargets}
            aiAttackInfo={aiAttackInfo}
            onCardSelect={selectCard}
            onAttackerSelect={selectAttacker}
            onPlayCard={playCard}
            onAttack={attack}
            onEndTurn={endTurn}
          />
        );

      case 'game-over':
        if (!gameState || !gameEndData) {
          return null;
        }
        return (
          <GameOverScreen
            winner={gameEndData.winner}
            playerName={gameState.player.name}
            opponentName={gameState.opponent.name}
            difficulty={difficulty}
            reward={gameEndData.reward}
            stats={gameEndData.stats}
            onPlayAgain={handlePlayAgain}
            onMainMenu={handleMainMenu}
          />
        );

      default:
        // Fallback to menu if unknown screen state
        console.warn('Unknown screen state:', screen);
        return (
          <MainMenu
            onPlay={handlePlay}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
          />
        );
    }
  };

  // Show loading while data loads
  if (isDataLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="text-4xl animate-spin mb-4">⚔️</div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Error display
  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-900">
        <div className="bg-red-900/50 border border-red-500 rounded-xl p-6 max-w-md text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
          <p className="text-white mb-4">{error}</p>
          <button
            onClick={handleMainMenu}
            className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900 overflow-auto">
      {renderScreen()}

      {/* Loading overlay */}
      {isLoading && screen === 'playing' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 text-center">
            <div className="text-4xl animate-spin mb-4">⚔️</div>
            <p className="text-white">AI is thinking...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CardGamePage;
