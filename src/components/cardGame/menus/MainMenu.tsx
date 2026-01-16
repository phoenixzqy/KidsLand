/**
 * MainMenu Component
 * Main menu for the card game
 */

import React from 'react';
import { Link } from 'react-router-dom';
import type { AIDifficulty } from '../../../types/cardGame';
import { getDifficultyDescription, getStarRewardRange } from '../../../game/cardGame/utils/cardIntegration';

interface MainMenuProps {
  onPlay: () => void;
  difficulty: AIDifficulty;
  onDifficultyChange: (difficulty: AIDifficulty) => void;
  className?: string;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onPlay,
  difficulty,
  onDifficultyChange,
  className = ''
}) => {
  const difficulties: AIDifficulty[] = ['easy', 'medium', 'hard'];
  const rewardRange = getStarRewardRange(difficulty);

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-4 ${className}`}>
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-2">
          ⚔️ Card Battle
        </h1>
        <p className="text-slate-400 text-lg">Minecraft Edition</p>
      </div>

      {/* Card preview decoration */}
      <div className="flex gap-4 mb-8 opacity-80">
        <div className="w-16 h-24 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg transform -rotate-12 animate-bounce" style={{ animationDelay: '0s' }}>
          <div className="w-full h-full flex items-center justify-center text-3xl">🐉</div>
        </div>
        <div className="w-16 h-24 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 shadow-lg transform rotate-0" style={{ animationDelay: '0.2s' }}>
          <div className="w-full h-full flex items-center justify-center text-3xl">🗡️</div>
        </div>
        <div className="w-16 h-24 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg transform rotate-12 animate-bounce" style={{ animationDelay: '0.4s' }}>
          <div className="w-full h-full flex items-center justify-center text-3xl">🛡️</div>
        </div>
      </div>

      {/* Menu card */}
      <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-700">
        {/* Difficulty selector */}
        <div className="mb-6">
          <label className="block text-slate-300 text-sm font-medium mb-3">
            Select Difficulty
          </label>
          <div className="grid grid-cols-3 gap-2">
            {difficulties.map((diff) => (
              <button
                key={diff}
                onClick={() => onDifficultyChange(diff)}
                className={`
                  px-4 py-3 rounded-lg font-bold text-sm transition-all duration-200
                  ${difficulty === diff
                    ? diff === 'easy'
                      ? 'bg-green-600 text-white ring-2 ring-green-400'
                      : diff === 'medium'
                        ? 'bg-yellow-600 text-white ring-2 ring-yellow-400'
                        : 'bg-red-600 text-white ring-2 ring-red-400'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }
                `}
              >
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {getDifficultyDescription(difficulty)}
          </p>
          <p className="mt-1 text-xs text-yellow-400">
            ⭐ Reward: {rewardRange.min}-{rewardRange.max} stars
          </p>
        </div>

        {/* Play button */}
        <button
          onClick={onPlay}
          className="w-full py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold text-xl rounded-xl shadow-lg shadow-green-500/30 transition-all duration-200 hover:scale-105 active:scale-95 mb-4"
        >
          ⚔️ Play Now!
        </button>

        {/* Other options */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/games/card-battle/decks"
            className="py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg text-center transition-colors"
          >
            📚 Deck Builder
          </Link>
          <Link
            to="/games/card-battle/stats"
            className="py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg text-center transition-colors"
          >
            📊 Stats
          </Link>
        </div>

        {/* Back button */}
        <Link
          to="/games"
          className="block mt-4 py-2 text-slate-400 hover:text-white text-center text-sm transition-colors"
        >
          ← Back to Games
        </Link>
      </div>

      {/* Tip */}
      <div className="mt-6 text-center text-slate-500 text-sm max-w-md">
        💡 Tip: Collect more cards from the Market to build stronger decks!
      </div>
    </div>
  );
};

export default MainMenu;
