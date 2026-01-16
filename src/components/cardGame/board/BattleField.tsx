/**
 * BattleField Component
 * Displays minions on the battlefield
 */

import React from 'react';
import type { GameCard, CardDefinition } from '../../../types/cardGame';
import { BattleCard } from '../cards/BattleCard';

interface BattleFieldProps {
  minions: GameCard[];
  owner: 'player' | 'opponent';
  selectedAttacker?: GameCard | null;
  validTargets?: string[];
  isPlayerTurn?: boolean;
  onMinionClick?: (minion: GameCard) => void;
  onMinionHover?: (minion: GameCard | CardDefinition | null) => void;
  cardRefs?: React.MutableRefObject<Map<string, HTMLDivElement>>;
  className?: string;
}

export const BattleField: React.FC<BattleFieldProps> = ({
  minions,
  owner,
  selectedAttacker,
  validTargets = [],
  isPlayerTurn = true,
  onMinionClick,
  onMinionHover,
  cardRefs,
  className = ''
}) => {
  // Check if a minion can attack
  const canAttack = (minion: GameCard): boolean => {
    if (owner !== 'player' || !isPlayerTurn) return false;
    if (!minion.canAttack || minion.isFrozen) return false;

    const maxAttacks = minion.keywords?.includes('windfury') ? 2 : 1;
    return minion.attacksThisTurn < maxAttacks;
  };

  // Check if minion is a valid target
  const isTarget = (minion: GameCard): boolean => {
    return validTargets.includes(minion.instanceId);
  };

  // Check if minion is the selected attacker
  const isSelected = (minion: GameCard): boolean => {
    return selectedAttacker?.instanceId === minion.instanceId;
  };

  return (
    <div className={`flex ${minions.length > 6 ? 'flex-wrap' : ''} justify-center items-center gap-1 content-center min-h-[80px] ${className}`}>
      {minions.length === 0 ? (
        <div className="text-white/30 text-sm italic">
          {owner === 'player' ? 'Play minions here' : 'Enemy minions appear here'}
        </div>
      ) : (
        minions.map((minion) => (
          <div
            key={minion.instanceId}            ref={(el) => {
              if (el && cardRefs) {
                cardRefs.current.set(minion.instanceId, el);
              }
            }}            className="relative transition-transform duration-200 hover:scale-105"
          >
            <BattleCard
              card={minion}
              size={minions.length > 4 ? 'sm' : 'md'}
              onClick={() => onMinionClick?.(minion)}
              onHover={onMinionHover}
              selected={isSelected(minion)}
              canAttack={canAttack(minion)}
              isTarget={isTarget(minion)}
            />

            {/* Attack arrow indicator */}
            {isSelected(minion) && (
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-2xl animate-bounce">
                ⚔️
              </div>
            )}

            {/* Taunt indicator */}
            {minion.keywords?.includes('taunt') && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-xs">
                🛡️
              </div>
            )}
          </div>
        ))
      )}

      {/* Field limit indicator */}
      {minions.length >= 7 && (
        <div className="absolute bottom-1 right-2 text-xs text-white/50">
          Field full (7/7)
        </div>
      )}
    </div>
  );
};

export default BattleField;
