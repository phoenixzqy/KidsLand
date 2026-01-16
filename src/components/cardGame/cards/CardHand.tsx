/**
 * CardHand Component
 * Displays player's hand with fan layout and card selection
 */

import React, { useState } from 'react';
import type { GameCard } from '../../../types/cardGame';
import { BattleCard } from './BattleCard';

interface CardHandProps {
  cards: GameCard[];
  currentMana: number;
  onCardSelect?: (card: GameCard) => void;
  selectedCardId?: string | null;
  isPlayerTurn?: boolean;
  disabled?: boolean;
  position?: 'bottom' | 'top';
  className?: string;
}

export const CardHand: React.FC<CardHandProps> = ({
  cards,
  currentMana,
  onCardSelect,
  selectedCardId,
  isPlayerTurn = true,
  disabled = false,
  position = 'bottom',
  className = ''
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Calculate card positions for fan effect
  const getCardStyle = (index: number, total: number): React.CSSProperties => {
    if (total === 0) return {};

    // Card spacing - closer together with more cards
    const baseSpacing = 60; // Base spacing between cards
    const spacing = total <= 4 ? baseSpacing : Math.max(30, baseSpacing - (total - 4) * 8);
    
    // Less rotation with more cards
    const maxRotation = total <= 4 ? 15 : Math.max(5, 15 - (total - 4) * 2);
    
    // Vertical arc offset
    const maxOffset = total <= 4 ? 20 : Math.max(10, 20 - (total - 4) * 2);

    // Calculate position relative to center
    const centerIndex = (total - 1) / 2;
    const offsetFromCenter = index - centerIndex;

    // Rotation (cards at edges rotate more)
    const rotation = (offsetFromCenter / Math.max(1, centerIndex)) * maxRotation;

    // Vertical offset (cards at edges are higher - arc effect)
    const normalizedDistance = Math.abs(offsetFromCenter) / Math.max(1, centerIndex);
    const verticalOffset = normalizedDistance * normalizedDistance * maxOffset;

    // Horizontal position from center
    const horizontalOffset = offsetFromCenter * spacing;

    // Hover effect
    const isHovered = hoveredIndex === index;
    const hoverLift = isHovered ? -30 : 0;
    const hoverScale = isHovered ? 1.15 : 1;
    const hoverRotation = isHovered ? 0 : rotation;

    return {
      transform: `
        translateX(${horizontalOffset}px)
        translateY(${position === 'bottom' ? verticalOffset + hoverLift : -verticalOffset - hoverLift}px)
        rotate(${position === 'bottom' ? hoverRotation : -hoverRotation}deg)
        scale(${hoverScale})
      `,
      // Right cards always on top of left cards so mana cost is visible
      zIndex: isHovered ? 100 : index + 1,
      transition: 'all 0.2s ease-out'
    };
  };

  // Check if a card is playable
  const isPlayable = (card: GameCard): boolean => {
    return isPlayerTurn && !disabled && card.manaCost <= currentMana;
  };

  return (
    <div className={`relative flex justify-center items-end h-24 md:h-32 ${className}`}>
      {/* Hand container */}
      <div className="relative flex justify-center h-full">
        {cards.map((card, index) => {
          const playable = isPlayable(card);
          const isSelected = selectedCardId === card.instanceId;

          return (
            <div
              key={card.instanceId}
              className="absolute"
              style={getCardStyle(index, cards.length)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <BattleCard
                card={card}
                size={cards.length > 6 ? 'sm' : 'md'}
                onClick={() => playable && onCardSelect?.(card)}
                selected={isSelected}
                disabled={!playable}
                className={`
                  ${!playable && !isSelected ? 'brightness-75' : ''}
                  ${isSelected ? 'ring-4 ring-yellow-400' : ''}
                `}
              />

              {/* Not enough mana indicator */}
              {!playable && card.manaCost > currentMana && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <span className="text-red-500 text-2xl">💧</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Hand card count */}
      <div className={`absolute ${position === 'bottom' ? 'top-0' : '-bottom-8'} left-1/2 transform -translate-x-1/2 text-white/60 text-sm`}>
        {cards.length}/10 cards
      </div>
    </div>
  );
};

/**
 * Opponent's hand (cards face down)
 */
interface OpponentHandProps {
  cardCount: number;
  position?: 'top';
  className?: string;
}

export const OpponentHand: React.FC<OpponentHandProps> = ({
  cardCount,
  position: _position = 'top',
  className = ''
}) => {
  // Calculate card positions for fan effect
  const getCardStyle = (index: number, total: number): React.CSSProperties => {
    if (total === 0) return {};

    const maxRotation = 15;
    const maxOffset = 30;
    const cardWidth = 50;

    const normalizedPos = total === 1 ? 0 : (index / (total - 1)) - 0.5;
    const rotation = normalizedPos * maxRotation * 2;
    const verticalOffset = Math.abs(normalizedPos) * maxOffset;
    const horizontalOffset = normalizedPos * cardWidth * Math.min(total, 8);

    return {
      transform: `
        translateX(${horizontalOffset}px)
        translateY(${-verticalOffset}px)
        rotate(${-rotation}deg)
      `,
      zIndex: 50 - Math.abs(Math.round(normalizedPos * 10))
    };
  };

  const cards = Array.from({ length: cardCount }, (_, i) => i);

  return (
    <div className={`relative flex justify-center items-start h-24 ${className}`}>
      <div className="relative flex justify-center">
        {cards.map((_, index) => (
          <div
            key={index}
            className="absolute w-16 h-24 rounded-lg transition-transform duration-200"
            style={getCardStyle(index, cardCount)}
          >
            {/* Card back */}
            <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-purple-900 rounded-lg border-2 border-indigo-600 shadow-lg">
              {/* Card back pattern */}
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full opacity-80 flex items-center justify-center">
                  <span className="text-2xl">⚔️</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Card count */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-white/60 text-sm">
        {cardCount}/10 cards
      </div>
    </div>
  );
};

export default CardHand;
