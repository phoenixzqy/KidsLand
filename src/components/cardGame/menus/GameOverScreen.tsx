/**
 * GameOverScreen Component
 * Displays game results and rewards
 */

import React from 'react';
import type { GameWinner, AIDifficulty } from '../../../types/cardGame';
import type { GameReward, MatchStats } from '../../../game/cardGame/utils/cardIntegration';

interface GameOverScreenProps {
  winner: GameWinner;
  playerName: string;
  opponentName: string;
  difficulty: AIDifficulty;
  reward: GameReward;
  stats: MatchStats;
  onPlayAgain: () => void;
  onMainMenu: () => void;
  className?: string;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  winner,
  playerName: _playerName,
  opponentName,
  difficulty,
  reward,
  stats,
  onPlayAgain,
  onMainMenu,
  className = ''
}) => {
  const isVictory = winner === 'player';
  const isDraw = winner === 'draw';

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50 ${className}`}>
      {/* Victory/Defeat animation background */}
      <div className={`absolute inset-0 ${isVictory ? 'bg-linear-to-b from-yellow-900/30 to-green-900/30' : isDraw ? 'bg-linear-to-b from-slate-800/50 to-slate-900/50' : 'bg-linear-to-b from-red-900/30 to-slate-900/50'}`} />

      {/* Content */}
      <div className="relative z-10 bg-slate-800/90 rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl border border-slate-700">
        {/* Result header */}
        <div className="text-center mb-6">
          {isVictory ? (
            <>
              <div className="text-6xl mb-4 animate-bounce">🏆</div>
              <h2 className="text-4xl font-bold text-yellow-400 mb-2">Victory!</h2>
              <p className="text-slate-300">You defeated {opponentName}!</p>
            </>
          ) : isDraw ? (
            <>
              <div className="text-6xl mb-4">🤝</div>
              <h2 className="text-4xl font-bold text-slate-300 mb-2">Draw!</h2>
              <p className="text-slate-400">Both heroes fell at the same time</p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">💀</div>
              <h2 className="text-4xl font-bold text-red-400 mb-2">Defeat</h2>
              <p className="text-slate-300">{opponentName} wins this time</p>
            </>
          )}
        </div>

        {/* Rewards (only on victory) */}
        {isVictory && reward.totalStars > 0 && (
          <div className="bg-yellow-900/30 rounded-xl p-4 mb-6 border border-yellow-600/30">
            <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
              <span>⭐</span> Rewards Earned
            </h3>

            <div className="space-y-2">
              {/* Base reward */}
              <div className="flex justify-between text-slate-300">
                <span>Victory ({difficulty})</span>
                <span className="text-yellow-400">+{reward.baseStars} ⭐</span>
              </div>

              {/* Bonuses */}
              {reward.bonuses.map((bonus, index) => (
                <div key={index} className="flex justify-between text-slate-300">
                  <span className="text-sm">{bonus.description}</span>
                  <span className="text-green-400">+{bonus.stars} ⭐</span>
                </div>
              ))}

              {/* Total */}
              <div className="border-t border-yellow-600/30 pt-2 mt-2 flex justify-between font-bold">
                <span className="text-white">Total</span>
                <span className="text-yellow-400 text-xl">+{reward.totalStars} ⭐</span>
              </div>
            </div>
          </div>
        )}

        {/* Match stats */}
        <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-bold text-slate-400 mb-3">Match Statistics</h3>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{stats.totalTurns}</div>
              <div className="text-xs text-slate-400">Turns</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{formatTime(stats.duration)}</div>
              <div className="text-xs text-slate-400">Duration</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">{stats.playerDamageDealt}</div>
              <div className="text-xs text-slate-400">Damage Dealt</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">{stats.playerMinionsKilled}</div>
              <div className="text-xs text-slate-400">Minions Killed</div>
            </div>
          </div>

          <div className="mt-4 flex justify-between text-sm text-slate-400">
            <span>Cards played: {stats.playerCardsPlayed}</span>
            <span>Final health: {stats.playerFinalHealth}/{stats.opponentFinalHealth}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-4">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-4 bg-linear-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            🔄 Play Again
          </button>
          <button
            onClick={onMainMenu}
            className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors"
          >
            📋 Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverScreen;
