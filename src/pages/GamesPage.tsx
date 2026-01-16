/**
 * GamesPage Component
 * Hub page for all games
 */

import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { ThemedBackground, ThemedHeader } from '../components/ui/ThemedBackground';
import { PageContainer } from '../components/ui/PageContainer';
import { StarCounter } from '../components/ui/StarCounter';
import { AppImage } from '../components/ui/AppImage';
import { Card } from '../components/ui/Card';
import { useUser } from '../contexts/UserContext';
import { getUnlockProgress } from '../game/cardGame/utils/cardIntegration';
import type { Prize } from '../types';
import prizesData from '../data/prizes.json';

// Cast prizes to proper type
const prizes = prizesData.prizes as Prize[];

interface Game {
  id: string;
  name: string;
  description: string;
  icon: string;
  image: string;
  route: string;
  requiredCards: number;
  comingSoon?: boolean;
}

const GAMES: Game[] = [
  {
    id: 'card-battle',
    name: 'Card Battle',
    description: 'Battle with your collected cards in a Hearthstone-style game!',
    icon: '⚔️',
    image: '/images/minecraft-renders/weapons/minecraft-diamond-sword.png',
    route: '/games/card-battle',
    requiredCards: 50
  },
  {
    id: 'coming-soon-1',
    name: 'Memory Match',
    description: 'Match pairs of cards to test your memory!',
    icon: '🎴',
    image: '/images/minecraft-renders/blocks/minecraft-chest.png',
    route: '/games/memory',
    requiredCards: 10,
    comingSoon: true
  },
  {
    id: 'coming-soon-2',
    name: 'Card Quiz',
    description: 'Test your Minecraft knowledge!',
    icon: '❓',
    image: '/images/minecraft-renders/special/minecraft-enchanted-book.png',
    route: '/games/quiz',
    requiredCards: 0,
    comingSoon: true
  }
];

export function GamesPage() {
  const navigate = useNavigate();
  const { stars } = useUser();

  // Get owned items from database
  const ownedItems = useLiveQuery(() => db.ownedItems.toArray()) || [];

  // Calculate unlock progress for card battle
  const cardBattleProgress = useMemo(() => {
    return getUnlockProgress(ownedItems, prizes);
  }, [ownedItems]);

  // Handle game click
  const handleGameClick = (game: Game) => {
    if (game.comingSoon) {
      return; // Do nothing for coming soon games
    }

    // Check if game is unlocked
    if (game.id === 'card-battle' && !cardBattleProgress.isUnlocked) {
      // Could show a message or redirect to market
      return;
    }

    navigate(game.route);
  };

  return (
    <ThemedBackground className="p-4 min-h-screen">
      <PageContainer>
        {/* Header */}
        <ThemedHeader className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-2xl hover:scale-110 transition-transform"
            >
              ←
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-3xl">🎮</span>
              <h1 className="text-xl font-bold text-primary-600">
                Game Zone
              </h1>
            </div>
          </div>
          <StarCounter count={stars} size="md" showAnimation />
        </ThemedHeader>

        {/* Welcome card */}
        <Card className="mb-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="flex items-center gap-4">
            <span className="text-5xl">🎮</span>
            <div>
              <h2 className="text-xl font-bold">Welcome to the Game Zone!</h2>
              <p className="text-white/80">
                Play fun games with your collected cards
              </p>
            </div>
          </div>
        </Card>

        {/* Collection progress */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800">Your Card Collection</h3>
            <span className="text-2xl font-bold text-primary-600">
              {cardBattleProgress.current} cards
            </span>
          </div>
          <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, cardBattleProgress.percentage)}%` }}
            />
          </div>
          <p className="text-sm text-slate-500 mt-2">
            {cardBattleProgress.isUnlocked
              ? '✅ Card Battle unlocked!'
              : `Collect ${cardBattleProgress.required - cardBattleProgress.current} more cards to unlock Card Battle`}
          </p>
        </Card>

        {/* Games grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GAMES.map((game) => {
            const isCardBattle = game.id === 'card-battle';
            const isUnlocked = isCardBattle ? cardBattleProgress.isUnlocked : true;
            const progress = isCardBattle ? cardBattleProgress.percentage : 100;

            return (
              <Card
                key={game.id}
                className={`
                  relative overflow-hidden transition-all duration-200
                  ${game.comingSoon ? 'opacity-60' : isUnlocked ? 'hover:shadow-xl cursor-pointer' : 'opacity-80'}
                `}
                onClick={() => handleGameClick(game)}
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${
                  isUnlocked && !game.comingSoon
                    ? 'from-green-500/10 to-blue-500/10'
                    : 'from-slate-500/10 to-slate-600/10'
                }`} />

                {/* Content */}
                <div className="relative z-10 flex items-center gap-4">
                  {/* Game icon */}
                  <div className={`
                    w-20 h-20 rounded-xl flex items-center justify-center shrink-0
                    ${isUnlocked && !game.comingSoon
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                      : 'bg-slate-600'
                    }
                  `}>
                    {game.image ? (
                      <AppImage
                        src={game.image}
                        alt={game.name}
                        className="w-12 h-12 object-contain"
                      />
                    ) : (
                      <span className="text-4xl">{game.icon}</span>
                    )}
                  </div>

                  {/* Game info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-800">
                        {game.name}
                      </h3>
                      {game.comingSoon && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {game.description}
                    </p>

                    {/* Progress bar for locked games */}
                    {!isUnlocked && !game.comingSoon && (
                      <div className="mt-2">
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {cardBattleProgress.current}/{game.requiredCards} cards
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Status indicator */}
                  <div className="shrink-0">
                    {game.comingSoon ? (
                      <span className="text-2xl">🔜</span>
                    ) : isUnlocked ? (
                      <span className="text-2xl text-green-500">▶️</span>
                    ) : (
                      <span className="text-2xl">🔒</span>
                    )}
                  </div>
                </div>

                {/* Lock overlay */}
                {!isUnlocked && !game.comingSoon && (
                  <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-4xl">🔒</span>
                      <p className="text-white font-bold mt-2">
                        {game.requiredCards - cardBattleProgress.current} more cards
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Market link */}
        {!cardBattleProgress.isUnlocked && (
          <Card className="mt-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            <Link to="/market" className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🛒</span>
                <div>
                  <h3 className="font-bold">Need more cards?</h3>
                  <p className="text-sm text-white/80">Visit the Market to collect cards!</p>
                </div>
              </div>
              <span className="text-2xl">→</span>
            </Link>
          </Card>
        )}
      </PageContainer>
    </ThemedBackground>
  );
}

export default GamesPage;
