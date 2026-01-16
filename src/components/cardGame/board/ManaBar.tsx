/**
 * ManaBar Component
 * Displays mana crystals
 */

import React from 'react';

interface ManaBarProps {
  current: number;
  max: number;
  side?: 'player' | 'opponent';
  className?: string;
}

export const ManaBar: React.FC<ManaBarProps> = ({
  current,
  max,
  side: _side = 'player',
  className = ''
}) => {
  // Create array of 10 potential mana slots
  const maxSlots = 10;
  const slots = Array.from({ length: maxSlots }, (_, i) => {
    if (i < max) {
      return i < current ? 'full' : 'empty';
    }
    return 'locked';
  });

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      {/* Mana text */}
      <div className="flex items-center gap-1">
        <span className="text-blue-400 text-lg">💧</span>
        <span className="text-white font-bold">
          {current}/{max}
        </span>
      </div>

      {/* Mana crystals */}
      <div className="flex gap-0.5 flex-wrap justify-center max-w-[120px]">
        {slots.map((state, index) => (
          <div
            key={index}
            className={`
              w-3 h-3 rounded-sm transition-all duration-300
              ${state === 'full'
                ? 'bg-linear-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/50'
                : state === 'empty'
                  ? 'bg-blue-900/50 border border-blue-700'
                  : 'bg-gray-800/50 border border-gray-700/30'
              }
            `}
            title={`Mana ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ManaBar;
