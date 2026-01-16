/**
 * BattleCard Component
 * Displays a card with attack/health stats and visual effects
 */

import React from 'react';
import type { GameCard, CardDefinition, Rarity } from '../../../types/cardGame';
import { AppImage } from '../../ui/AppImage';

interface BattleCardProps {
  card: GameCard | CardDefinition;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  onHover?: (card: GameCard | CardDefinition | null) => void;
  selected?: boolean;
  disabled?: boolean;
  canAttack?: boolean;
  isTarget?: boolean;
  showStats?: boolean;
  className?: string;
}

/**
 * Get rarity border gradient
 */
function getRarityGradient(rarity: Rarity): string {
  const gradients: Record<Rarity, string> = {
    common: 'from-slate-400 to-slate-500',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-orange-500'
  };
  return gradients[rarity];
}

/**
 * Get rarity glow color
 */
function getRarityGlow(rarity: Rarity): string {
  const glows: Record<Rarity, string> = {
    common: 'shadow-slate-400/30',
    rare: 'shadow-blue-500/50',
    epic: 'shadow-purple-500/50',
    legendary: 'shadow-yellow-500/60'
  };
  return glows[rarity];
}

/**
 * Size configurations
 */
const sizeConfig = {
  sm: {
    container: 'w-16 h-24',
    image: 'h-12',
    mana: 'w-5 h-5 text-xs',
    stats: 'text-xs',
    statIcon: 'w-4 h-4'
  },
  md: {
    container: 'w-24 h-36',
    image: 'h-18',
    mana: 'w-6 h-6 text-sm',
    stats: 'text-sm',
    statIcon: 'w-5 h-5'
  },
  lg: {
    container: 'w-32 h-48',
    image: 'h-24',
    mana: 'w-8 h-8 text-base',
    stats: 'text-base font-bold',
    statIcon: 'w-6 h-6'
  }
};

export const BattleCard: React.FC<BattleCardProps> = ({
  card,
  size = 'md',
  onClick,
  onHover,
  selected = false,
  disabled = false,
  canAttack = false,
  isTarget = false,
  showStats = true,
  className = ''
}) => {
  const config = sizeConfig[size];
  const isGameCard = 'instanceId' in card;

  // Get current stats (for GameCard) or base stats (for CardDefinition)
  const attack = isGameCard ? (card as GameCard).currentAttack : card.attack;
  const health = isGameCard ? (card as GameCard).currentHealth : card.health;
  const maxHealth = card.health;

  // Check for damage
  const isDamaged = isGameCard && health < maxHealth;
  const isBuffed = isGameCard && attack > card.attack;

  // Get card states
  const hasDivineShield = isGameCard && (card as GameCard).hasDivineShield;
  const isFrozen = isGameCard && (card as GameCard).isFrozen;
  const isSilenced = isGameCard && (card as GameCard).isSilenced;
  const isStealthed = isGameCard && (card as GameCard).isStealthed;

  // Build class names
  const containerClasses = [
    'relative rounded-lg overflow-hidden transition-all duration-200',
    'cursor-pointer transform',
    config.container,
    // Solid background color first, then gradient border on top
    'bg-slate-900',
    // Selection state
    selected && 'ring-4 ring-yellow-400 scale-105',
    // Can attack indicator
    canAttack && !disabled && 'ring-2 ring-green-400 animate-pulse',
    // Target indicator
    isTarget && 'ring-2 ring-red-400',
    // Disabled state
    disabled && 'cursor-not-allowed',
    // Frozen state
    isFrozen && 'ring-2 ring-cyan-300',
    // Hover effects
    !disabled && 'hover:scale-105 hover:shadow-lg',
    getRarityGlow(card.rarity),
    'shadow-lg',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={containerClasses}
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={() => onHover?.(card)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Gradient border overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getRarityGradient(card.rarity)} rounded-lg`} />
      {/* Card background */}
      <div className="absolute inset-0.5 bg-slate-900 rounded-md">
        {/* Card image */}
        <div className={`relative ${config.image} overflow-hidden rounded-t-md bg-slate-800`}>
          <AppImage
            src={card.image}
            alt={card.name}
            className="w-full h-full object-contain bg-slate-800"
          />

          {/* Divine Shield overlay */}
          {hasDivineShield && (
            <div className="absolute inset-0 bg-yellow-300/30 border-2 border-yellow-400 rounded-t-md animate-pulse" />
          )}

          {/* Stealth overlay */}
          {isStealthed && (
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm">
              <span className="absolute top-1 right-1 text-xs">👁️</span>
            </div>
          )}

          {/* Frozen overlay */}
          {isFrozen && (
            <div className="absolute inset-0 bg-cyan-300/40 backdrop-blur-sm">
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl">❄️</span>
            </div>
          )}

          {/* Silenced indicator */}
          {isSilenced && (
            <div className="absolute top-1 left-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs">🔇</span>
            </div>
          )}
        </div>

        {/* Card name (visible on larger sizes) */}
        {size !== 'sm' && (
          <div className="px-1 py-0.5 text-center">
            <span className="text-xs text-white font-semibold truncate block">
              {card.name}
            </span>
          </div>
        )}

        {/* Keywords (icons) */}
        {card.keywords && card.keywords.length > 0 && size !== 'sm' && (
          <div className="absolute bottom-8 left-1 flex gap-0.5">
            {card.keywords.includes('taunt') && (
              <span className="text-xs" title="Taunt">🛡️</span>
            )}
            {card.keywords.includes('charge') && (
              <span className="text-xs" title="Charge">⚡</span>
            )}
            {card.keywords.includes('windfury') && (
              <span className="text-xs" title="Windfury">🌀</span>
            )}
            {card.keywords.includes('lifesteal') && (
              <span className="text-xs" title="Lifesteal">💚</span>
            )}
            {card.keywords.includes('poisonous') && (
              <span className="text-xs" title="Poisonous">☠️</span>
            )}
          </div>
        )}
      </div>

      {/* Mana cost (top left) */}
      <div className={`absolute -top-1 -left-1 ${config.mana} rounded-full bg-blue-600 border-2 border-blue-400 flex items-center justify-center text-white font-bold shadow-lg`}>
        {card.manaCost}
      </div>

      {/* Stats (bottom) */}
      {showStats && (
        <>
          {/* Attack (bottom left) */}
          <div className={`absolute -bottom-1 -left-1 ${config.mana} rounded-full bg-yellow-600 border-2 border-yellow-400 flex items-center justify-center font-bold shadow-lg ${isBuffed ? 'text-green-300' : 'text-white'}`}>
            {attack}
          </div>

          {/* Health (bottom right) */}
          <div className={`absolute -bottom-1 -right-1 ${config.mana} rounded-full bg-red-600 border-2 border-red-400 flex items-center justify-center font-bold shadow-lg ${isDamaged ? 'text-red-300' : 'text-white'}`}>
            {health}
          </div>
        </>
      )}

      {/* Can attack glow */}
      {canAttack && !disabled && (
        <div className="absolute inset-0 rounded-lg bg-green-400/20 animate-pulse pointer-events-none" />
      )}
    </div>
  );
};

/**
 * Card tooltip/preview component
 */
interface CardPreviewProps {
  card: GameCard | CardDefinition;
  className?: string;
}

export const CardPreview: React.FC<CardPreviewProps> = ({ card, className = '' }) => {
  return (
    <div className={`bg-slate-800 rounded-xl p-4 shadow-2xl border border-slate-600 max-w-xs ${className}`}>
      {/* Card image and basic info */}
      <div className="flex gap-4">
        <BattleCard card={card} size="lg" showStats />

        <div className="flex-1">
          <h3 className="text-lg font-bold text-white">{card.name}</h3>
          <p className={`text-sm ${getRarityTextColor(card.rarity)}`}>
            {card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}
            {card.tribe && ` • ${card.tribe}`}
          </p>

          <div className="mt-2 space-y-1 text-sm text-slate-300">
            <p>⚔️ Attack: {card.attack}</p>
            <p>❤️ Health: {card.health}</p>
            <p>💧 Mana: {card.manaCost}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      {card.description && (
        <p className="mt-3 text-sm text-slate-200 border-t border-slate-600 pt-3">
          {card.description}
        </p>
      )}

      {/* Flavor text */}
      {card.flavorText && (
        <p className="mt-2 text-xs text-slate-400 italic">
          "{card.flavorText}"
        </p>
      )}
    </div>
  );
};

function getRarityTextColor(rarity: Rarity): string {
  const colors: Record<Rarity, string> = {
    common: 'text-slate-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-yellow-400'
  };
  return colors[rarity];
}

export default BattleCard;
