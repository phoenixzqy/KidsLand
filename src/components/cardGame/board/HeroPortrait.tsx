/**
 * HeroPortrait Component
 * Displays hero health and status
 */

import React from 'react';

interface HeroPortraitProps {
  name: string;
  health: number;
  maxHealth: number;
  isActive?: boolean;
  isTargetable?: boolean;
  onClick?: () => void;
  side: 'player' | 'opponent';
  className?: string;
}

export const HeroPortrait: React.FC<HeroPortraitProps> = ({
  name,
  health,
  maxHealth,
  isActive = false,
  isTargetable = false,
  onClick,
  side,
  className = ''
}) => {
  const healthPercentage = Math.max(0, (health / maxHealth) * 100);
  const isLowHealth = health <= 10;
  const isCriticalHealth = health <= 5;

  // Choose hero avatar based on side
  const heroEmoji = side === 'player' ? '👤' : '🤖';

  return (
    <div
      className={`
        relative flex items-center gap-3 p-2 rounded-xl
        transition-all duration-200
        ${isActive ? 'ring-2 ring-yellow-400' : ''}
        ${isTargetable ? 'ring-2 ring-red-500 cursor-pointer hover:scale-105' : ''}
        ${side === 'player' ? 'bg-blue-900/50' : 'bg-red-900/50'}
        ${className}
      `}
      onClick={isTargetable ? onClick : undefined}
    >
      {/* Hero avatar */}
      <div className={`
        relative w-14 h-14 rounded-lg flex items-center justify-center
        ${side === 'player' ? 'bg-gradient-to-br from-blue-500 to-blue-700' : 'bg-gradient-to-br from-red-500 to-red-700'}
        border-2 ${isActive ? 'border-yellow-400' : 'border-white/30'}
        shadow-lg
      `}>
        <span className="text-3xl">{heroEmoji}</span>

        {/* Active turn indicator */}
        {isActive && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse" />
        )}

        {/* Targetable indicator */}
        {isTargetable && (
          <div className="absolute inset-0 rounded-lg border-4 border-red-500 animate-pulse" />
        )}
      </div>

      {/* Hero info */}
      <div className="flex flex-col">
        <span className="text-white font-bold text-sm">{name}</span>

        {/* Health bar */}
        <div className="relative w-24 h-4 bg-gray-700 rounded-full overflow-hidden mt-1">
          <div
            className={`
              h-full transition-all duration-300
              ${isCriticalHealth ? 'bg-gradient-to-r from-red-700 to-red-500 animate-pulse' :
                isLowHealth ? 'bg-gradient-to-r from-orange-600 to-orange-400' :
                'bg-gradient-to-r from-green-600 to-green-400'}
            `}
            style={{ width: `${healthPercentage}%` }}
          />

          {/* Health text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xs font-bold ${health <= 0 ? 'text-red-400' : 'text-white'} drop-shadow-lg`}>
              {health}/{maxHealth}
            </span>
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex gap-1 mt-1">
          {isCriticalHealth && health > 0 && (
            <span className="text-xs text-red-400 animate-pulse">⚠️ Critical!</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroPortrait;
