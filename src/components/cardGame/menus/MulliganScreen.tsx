/**
 * MulliganScreen Component
 * Select cards to replace at the start of the game
 */

import React, { useState } from 'react';
import type { GameCard } from '../../../types/cardGame';
import { BattleCard } from '../cards/BattleCard';

interface MulliganScreenProps {
  hand: GameCard[];
  onConfirm: (cardIds: string[]) => void;
  className?: string;
}

export const MulliganScreen: React.FC<MulliganScreenProps> = ({
  hand,
  onConfirm,
  className = ''
}) => {
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());

  // Toggle card selection
  const toggleCard = (cardId: string) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(cardId)) {
      newSelected.delete(cardId);
    } else {
      newSelected.add(cardId);
    }
    setSelectedCards(newSelected);
  };

  // Confirm mulligan
  const handleConfirm = () => {
    onConfirm(Array.from(selectedCards));
  };

  return (
    <div className={`fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-indigo-900 to-slate-900 z-50 ${className}`}>
      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Choose Cards to Replace</h2>
        <p className="text-slate-400">
          Click on cards you want to replace with new ones from your deck
        </p>
        <p className="text-slate-500 text-sm mt-1">
          Selected: {selectedCards.size} card{selectedCards.size !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Hand */}
      <div className="flex gap-4 flex-wrap justify-center mb-8 px-4">
        {hand.map((card) => {
          const isSelected = selectedCards.has(card.instanceId);

          return (
            <div
              key={card.instanceId}
              className={`
                relative transition-all duration-200
                ${isSelected ? 'transform -translate-y-4' : ''}
              `}
            >
              <BattleCard
                card={card}
                size="lg"
                onClick={() => toggleCard(card.instanceId)}
                selected={isSelected}
                className={`
                  ${isSelected ? 'ring-4 ring-red-500' : 'hover:ring-2 hover:ring-yellow-400'}
                `}
              />

              {/* Replace indicator */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  ✕
                </div>
              )}

              {/* Card info */}
              <div className="text-center mt-2">
                <span className={`text-sm ${isSelected ? 'text-red-400' : 'text-slate-400'}`}>
                  {isSelected ? 'Will be replaced' : 'Click to replace'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips */}
      <div className="text-center text-slate-500 text-sm mb-6 max-w-md px-4">
        💡 Tip: Replace high-cost cards (4+ mana) early on for a better start.
        You'll draw new cards from your deck.
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => handleConfirm()}
          className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold text-lg rounded-xl shadow-lg shadow-green-500/30 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          {selectedCards.size > 0
            ? `Replace ${selectedCards.size} Card${selectedCards.size > 1 ? 's' : ''}`
            : 'Keep All Cards'}
        </button>
      </div>
    </div>
  );
};

export default MulliganScreen;
