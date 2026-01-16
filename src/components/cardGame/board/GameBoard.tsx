/**
 * GameBoard Component
 * Main game board with Minecraft crafting table theme
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameState, GameCard, CardDefinition } from '../../../types/cardGame';
import { CardPreview } from '../cards/BattleCard';
import { CardHand, OpponentHand } from '../cards/CardHand';
import { HeroPortrait } from './HeroPortrait';
import { ManaBar } from './ManaBar';
import { BattleField } from './BattleField';

interface GameBoardProps {
  gameState: GameState;
  isPlayerTurn: boolean;
  selectedCard: GameCard | null;
  selectedAttacker: GameCard | null;
  validTargets: string[];
  aiAttackInfo?: { attackerId: string; targetId: string } | null;
  onCardSelect: (card: GameCard | null) => void;
  onAttackerSelect: (card: GameCard | null) => void;
  onPlayCard: (cardId: string, targetId?: string) => void;
  onAttack: (attackerId: string, targetId: string) => void;
  onEndTurn: () => void;
  className?: string;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  isPlayerTurn,
  selectedCard,
  selectedAttacker,
  validTargets,
  aiAttackInfo,
  onCardSelect,
  onAttackerSelect,
  onPlayCard,
  onAttack,
  onEndTurn,
  className = ''
}) => {
  const [hoveredCard, setHoveredCard] = useState<GameCard | CardDefinition | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [attackAnimation, setAttackAnimation] = useState<{
    attackerId: string;
    targetId: string;
    attackerPos: { x: number; y: number };
    targetPos: { x: number; y: number };
  } | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Handle hover callback with 2s delay for showing preview
  const handleHover = useCallback((card: GameCard | CardDefinition | null) => {
    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // Don't show preview when in attack mode
    if (selectedAttacker) {
      setShowPreview(false);
      setHoveredCard(null);
      return;
    }

    if (card) {
      setHoveredCard(card);
      // Start timeout to show preview after 2 seconds
      hoverTimeoutRef.current = setTimeout(() => {
        setShowPreview(true);
      }, 2000);
    } else {
      setShowPreview(false);
      setHoveredCard(null);
    }
  }, [selectedAttacker]);

  // Clear hover when attacker selection changes
  useEffect(() => {
    if (selectedAttacker) {
      // Clear timeout and hover state when attack mode starts
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
    }
  }, [selectedAttacker]);

  // Handle AI attack animation
  useEffect(() => {
    if (aiAttackInfo) {
      const attackerEl = cardRefs.current.get(aiAttackInfo.attackerId);
      const targetEl = aiAttackInfo.targetId === 'hero' 
        ? document.getElementById('player-hero')
        : cardRefs.current.get(aiAttackInfo.targetId);

      if (attackerEl && targetEl) {
        const attackerRect = attackerEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();

        setAttackAnimation({
          attackerId: aiAttackInfo.attackerId,
          targetId: aiAttackInfo.targetId,
          attackerPos: { x: attackerRect.left + attackerRect.width / 2, y: attackerRect.top + attackerRect.height / 2 },
          targetPos: { x: targetRect.left + targetRect.width / 2, y: targetRect.top + targetRect.height / 2 }
        });

        // Clear animation after a delay
        setTimeout(() => {
          setAttackAnimation(null);
        }, 400);
      }
    }
  }, [aiAttackInfo]);

  // Handle clicking on the battlefield (to play cards)
  const handleFieldClick = (side: 'player' | 'opponent') => {
    if (selectedCard && side === 'player' && gameState.player.field.length < 7) {
      onPlayCard(selectedCard.instanceId);
      onCardSelect(null);
    }
  };

  // Handle clicking on a minion
  const handleMinionClick = (minion: GameCard, owner: 'player' | 'opponent') => {
    // Clear hover state when clicking
    setShowPreview(false);
    setHoveredCard(null);

    // If we have an attacker selected, this is an attack
    if (selectedAttacker && owner === 'opponent' && validTargets.includes(minion.instanceId)) {
      // Get positions for animation
      const attackerEl = cardRefs.current.get(selectedAttacker.instanceId);
      const targetEl = cardRefs.current.get(minion.instanceId);

      if (attackerEl && targetEl) {
        const attackerRect = attackerEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();

        setAttackAnimation({
          attackerId: selectedAttacker.instanceId,
          targetId: minion.instanceId,
          attackerPos: { x: attackerRect.left + attackerRect.width / 2, y: attackerRect.top + attackerRect.height / 2 },
          targetPos: { x: targetRect.left + targetRect.width / 2, y: targetRect.top + targetRect.height / 2 }
        });

        // Execute attack after animation
        setTimeout(() => {
          onAttack(selectedAttacker.instanceId, minion.instanceId);
          onAttackerSelect(null);
          setAttackAnimation(null);
        }, 300);
      } else {
        // Fallback if elements not found
        onAttack(selectedAttacker.instanceId, minion.instanceId);
        onAttackerSelect(null);
      }
      return;
    }

    // If this is our minion and it can attack, select it as attacker
    if (owner === 'player' && isPlayerTurn && minion.canAttack && !minion.isFrozen) {
      const maxAttacks = minion.keywords?.includes('windfury') ? 2 : 1;
      if (minion.attacksThisTurn < maxAttacks) {
        onAttackerSelect(selectedAttacker?.instanceId === minion.instanceId ? null : minion);
      }
    }

    // If we have a card with targeted battlecry
    if (selectedCard?.battlecry && validTargets.includes(minion.instanceId)) {
      onPlayCard(selectedCard.instanceId, minion.instanceId);
      onCardSelect(null);
    }
  };

  // Handle clicking on hero
  const handleHeroClick = (owner: 'player' | 'opponent') => {
    // Clear hover state
    setShowPreview(false);
    setHoveredCard(null);

    if (selectedAttacker && owner === 'opponent' && validTargets.includes('hero')) {
      const attackerEl = cardRefs.current.get(selectedAttacker.instanceId);
      const heroEl = document.getElementById('opponent-hero');

      if (attackerEl && heroEl) {
        const attackerRect = attackerEl.getBoundingClientRect();
        const heroRect = heroEl.getBoundingClientRect();

        setAttackAnimation({
          attackerId: selectedAttacker.instanceId,
          targetId: 'hero',
          attackerPos: { x: attackerRect.left + attackerRect.width / 2, y: attackerRect.top + attackerRect.height / 2 },
          targetPos: { x: heroRect.left + heroRect.width / 2, y: heroRect.top + heroRect.height / 2 }
        });

        setTimeout(() => {
          onAttack(selectedAttacker.instanceId, 'hero');
          onAttackerSelect(null);
          setAttackAnimation(null);
        }, 300);
      } else {
        onAttack(selectedAttacker.instanceId, 'hero');
        onAttackerSelect(null);
      }
    }
  };

  return (
    <div className={`relative w-full h-[100dvh] bg-gradient-to-b from-amber-900 to-amber-800 overflow-hidden ${className}`}>
      {/* Minecraft wood texture overlay */}
      <div
        className="absolute inset-0 opacity-20 h-full"
        style={{
          backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 40px,
            rgba(0,0,0,0.1) 40px,
            rgba(0,0,0,0.1) 42px
          ), repeating-linear-gradient(
            0deg,
            transparent,
            transparent 40px,
            rgba(0,0,0,0.1) 40px,
            rgba(0,0,0,0.1) 42px
          )`
        }}
      />

      {/* Main board layout */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {/* Opponent section */}
        <div className="flex-shrink-0">
          {/* Opponent hand */}
          <OpponentHand cardCount={gameState.opponent.hand.length} />

          {/* Opponent info bar */}
          <div className="flex justify-between items-center px-2 md:px-4 py-1 md:py-2">
            <div id="opponent-hero">
              <HeroPortrait
                name={gameState.opponent.name}
                health={gameState.opponent.health}
                maxHealth={30}
                isActive={!isPlayerTurn}
                isTargetable={validTargets.includes('hero') && selectedAttacker !== null}
                onClick={() => handleHeroClick('opponent')}
                side="opponent"
              />
            </div>

            <ManaBar
              current={gameState.opponent.mana}
              max={gameState.opponent.maxMana}
              side="opponent"
            />

            <div className="text-white/60 text-sm">
              Deck: {gameState.opponent.deck.length}
            </div>
          </div>
        </div>

        {/* Battlefields */}
        <div className="flex-1 flex flex-col justify-center gap-1 md:gap-2 px-2 md:px-4 min-h-0">
          {/* Opponent battlefield (stone theme) */}
          <div
            className="relative rounded-xl p-2 md:p-4 min-h-[80px] md:min-h-[120px] flex-1"
            style={{
              background: 'linear-gradient(to bottom, #4a5568, #2d3748)',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)'
            }}
          >
            <BattleField
              minions={gameState.opponent.field}
              owner="opponent"
              selectedAttacker={selectedAttacker}
              validTargets={validTargets}
              onMinionClick={(minion) => handleMinionClick(minion, 'opponent')}
              onMinionHover={handleHover}
              cardRefs={cardRefs}
            />
          </div>

          {/* Center divider - Crafting table style */}
          <div className="relative h-8 flex items-center justify-center">
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-600 to-transparent" />
            <div className="relative bg-amber-700 px-4 py-1 rounded-full border-2 border-amber-500 flex items-center gap-2">
              <span className="text-amber-200 text-sm font-bold">
                Turn {gameState.turnNumber}
              </span>
              {isPlayerTurn ? (
                <span className="text-green-400 text-xs">Your turn</span>
              ) : (
                <span className="text-red-400 text-xs animate-pulse">Enemy turn</span>
              )}
            </div>
          </div>

          {/* Player battlefield (grass theme) */}
          <div
            className="relative rounded-xl p-2 md:p-4 min-h-[80px] md:min-h-[120px] flex-1"
            style={{
              background: 'linear-gradient(to bottom, #48bb78, #276749)',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)'
            }}
            onClick={() => handleFieldClick('player')}
          >
            <BattleField
              minions={gameState.player.field}
              owner="player"
              selectedAttacker={selectedAttacker}
              validTargets={validTargets}
              isPlayerTurn={isPlayerTurn}
              onMinionClick={(minion) => handleMinionClick(minion, 'player')}
              onMinionHover={handleHover}
              cardRefs={cardRefs}
            />

            {/* Drop zone indicator when card is selected */}
            {selectedCard && gameState.player.field.length < 7 && (
              <div className="absolute inset-0 rounded-xl border-2 border-dashed border-yellow-400 bg-yellow-400/10 flex items-center justify-center pointer-events-none">
                <span className="text-yellow-400 font-bold animate-pulse">
                  Click to play card!
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Player section */}
        <div className="flex-shrink-0">
          {/* Player info bar */}
          <div className="flex justify-between items-center px-2 md:px-4 py-1 md:py-2">
            <div id="player-hero">
              <HeroPortrait
                name={gameState.player.name}
                health={gameState.player.health}
                maxHealth={30}
                isActive={isPlayerTurn}
                side="player"
              />
            </div>

            <ManaBar
              current={gameState.player.mana}
              max={gameState.player.maxMana}
              side="player"
            />

            {/* End Turn button */}
            <button
              onClick={onEndTurn}
              disabled={!isPlayerTurn}
              className={`
                px-4 md:px-6 py-2 md:py-3 rounded-lg font-bold text-white text-sm md:text-base
                transition-all duration-200
                ${isPlayerTurn
                  ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 active:scale-95 shadow-lg shadow-green-500/30'
                  : 'bg-gray-600 cursor-not-allowed opacity-50'
                }
              `}
            >
              {isPlayerTurn ? '⚔️ End Turn' : '⏳ Waiting...'}
            </button>
          </div>

          {/* Player hand */}
          <div className="pb-2 md:pb-4">
            <CardHand
              cards={gameState.player.hand}
              currentMana={gameState.player.mana}
              onCardSelect={(card) => {
                onAttackerSelect(null); // Clear attacker selection
                onCardSelect(selectedCard?.instanceId === card.instanceId ? null : card);
              }}
              selectedCardId={selectedCard?.instanceId}
              isPlayerTurn={isPlayerTurn}
              disabled={!isPlayerTurn}
            />
          </div>
        </div>
      </div>

      {/* Card preview tooltip - only show after 2s hold and not during attacks */}
      {hoveredCard && showPreview && !selectedAttacker && !attackAnimation && (
        <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50 pointer-events-none">
          <CardPreview card={hoveredCard} />
        </div>
      )}

      {/* Attack animation overlay */}
      {attackAnimation && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          {/* Attack line/effect */}
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <linearGradient id="attackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
            <line
              x1={attackAnimation.attackerPos.x}
              y1={attackAnimation.attackerPos.y}
              x2={attackAnimation.targetPos.x}
              y2={attackAnimation.targetPos.y}
              stroke="url(#attackGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              className="animate-pulse"
            />
          </svg>
          {/* Impact effect at target */}
          <div
            className="absolute w-16 h-16 -translate-x-1/2 -translate-y-1/2 animate-ping"
            style={{
              left: attackAnimation.targetPos.x,
              top: attackAnimation.targetPos.y
            }}
          >
            <span className="text-4xl">💥</span>
          </div>
        </div>
      )}

      {/* Selection instructions */}
      {(selectedCard || selectedAttacker) && (
        <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 z-20 bg-black/80 text-white px-4 py-2 rounded-lg text-sm">
          {selectedCard && (
            <span>
              Click on the battlefield to play <strong>{selectedCard.name}</strong>
              {selectedCard.battlecry && ' (or select a target)'}
            </span>
          )}
          {selectedAttacker && (
            <span>
              Select a target to attack with <strong>{selectedAttacker.name}</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default GameBoard;
