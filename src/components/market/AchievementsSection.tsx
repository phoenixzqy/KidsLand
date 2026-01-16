import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { AppImage } from '../ui/AppImage';
import { useUser } from '../../contexts/UserContext';
import { 
  allAchievements, 
  wordAchievements, 
  quizAchievements,
  collectionAchievements,
  getTierColor,
  getTierName,
  type Achievement
} from '../../data/achievements';

type AchievementFilter = 'all' | 'words' | 'quizzes' | 'collection';

export function AchievementsSection() {
  const { 
    masteredWordsCount, 
    quizzesCompleted,
    ownedItems,
    claimedAchievements,
    claimAchievement,
    isAchievementClaimed 
  } = useUser();
  
  const [filter, setFilter] = useState<AchievementFilter>('all');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [justClaimed, setJustClaimed] = useState<string | null>(null);

  // Get collection count
  const collectionCount = ownedItems.length;

  // Get current progress for an achievement
  const getProgress = (achievement: Achievement): number => {
    if (achievement.category === 'words') {
      return masteredWordsCount;
    } else if (achievement.category === 'quizzes') {
      return quizzesCompleted;
    } else {
      return collectionCount;
    }
  };

  // Check if achievement can be claimed
  const canClaim = (achievement: Achievement): boolean => {
    const progress = getProgress(achievement);
    return progress >= achievement.requirement && !isAchievementClaimed(achievement.id);
  };

  // Check if achievement is completed (claimed)
  const isCompleted = (achievement: Achievement): boolean => {
    return isAchievementClaimed(achievement.id);
  };

  // Handle claiming an achievement
  const handleClaim = async (achievement: Achievement) => {
    if (claimingId || !canClaim(achievement)) return;
    
    setClaimingId(achievement.id);
    const success = await claimAchievement(achievement.id, achievement.starsReward);
    
    if (success) {
      setJustClaimed(achievement.id);
      setTimeout(() => setJustClaimed(null), 2000);
    }
    
    setClaimingId(null);
  };

  // Filter achievements
  const filteredAchievements = filter === 'all' 
    ? allAchievements 
    : filter === 'words' 
      ? wordAchievements 
      : filter === 'quizzes'
        ? quizAchievements
        : collectionAchievements;

  // Sort: claimable first, then in-progress, then completed
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    const aCanClaim = canClaim(a);
    const bCanClaim = canClaim(b);
    const aCompleted = isCompleted(a);
    const bCompleted = isCompleted(b);

    if (aCanClaim && !bCanClaim) return -1;
    if (!aCanClaim && bCanClaim) return 1;
    if (aCompleted && !bCompleted) return 1;
    if (!aCompleted && bCompleted) return -1;
    return a.requirement - b.requirement;
  });

  // Stats
  const totalAchievements = allAchievements.length;
  const completedCount = claimedAchievements.length;

  return (
    <div className="space-y-4">
      {/* Stats Header */}
      <Card className="bg-linear-to-r from-amber-100 to-orange-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">🏆 Achievements</h3>
            <p className="text-sm text-slate-600">
              {completedCount} / {totalAchievements} completed
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-600">Total Stars Earned</div>
            <div className="font-bold text-amber-600 text-lg">
              ⭐ {completedCount * 5}
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 bg-white/50 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full bg-linear-to-r from-amber-400 to-orange-500 transition-all duration-500"
            style={{ width: `${(completedCount / totalAchievements) * 100}%` }}
          />
        </div>
      </Card>

      {/* Current Progress Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center py-3" padding="sm">
          <AppImage 
            src="/images/minecraft-renders/special/minecraft-book.png" 
            alt="Words" 
            className="w-8 h-8 mx-auto mb-1 object-contain" 
          />
          <div className="font-bold text-slate-800">{masteredWordsCount}</div>
          <div className="text-xs text-slate-500">Words Mastered</div>
        </Card>
        <Card className="text-center py-3" padding="sm">
          <AppImage 
            src="/images/minecraft-renders/special/minecraft-enchanted-book.png" 
            alt="Quizzes" 
            className="w-8 h-8 mx-auto mb-1 object-contain" 
          />
          <div className="font-bold text-slate-800">{quizzesCompleted}</div>
          <div className="text-xs text-slate-500">Quizzes Done</div>
        </Card>
        <Card className="text-center py-3" padding="sm">
          <AppImage 
            src="/images/minecraft-renders/blocks/minecraft-chest.png" 
            alt="Collection" 
            className="w-8 h-8 mx-auto mb-1 object-contain" 
          />
          <div className="font-bold text-slate-800">{collectionCount}</div>
          <div className="text-xs text-slate-500">Prizes Collected</div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'all' as const, name: 'All', icon: '🏆' },
          { id: 'words' as const, name: 'Words', icon: '📚' },
          { id: 'quizzes' as const, name: 'Quizzes', icon: '✏️' },
          { id: 'collection' as const, name: 'Collection', icon: '📦' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f.id
                ? 'bg-primary-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.icon} {f.name}
          </button>
        ))}
      </div>

      {/* Achievement Cards */}
      <div className="space-y-3">
        {sortedAchievements.map((achievement) => {
          const progress = getProgress(achievement);
          const progressPercent = Math.min(100, (progress / achievement.requirement) * 100);
          const completed = isCompleted(achievement);
          const claimable = canClaim(achievement);
          const isClaiming = claimingId === achievement.id;
          const wasJustClaimed = justClaimed === achievement.id;

          return (
            <Card 
              key={achievement.id}
              className={`relative overflow-hidden transition-all ${
                completed 
                  ? 'bg-linear-to-r from-green-50 to-emerald-50 border-green-200' 
                  : claimable
                    ? 'bg-linear-to-r from-amber-50 to-yellow-50 border-amber-300 ring-2 ring-amber-300 animate-pulse-slow'
                    : ''
              } ${wasJustClaimed ? 'animate-bounce-once' : ''}`}
              padding="sm"
            >
              {/* Tier Badge */}
              <div 
                className={`absolute top-0 right-0 px-2 py-0.5 text-xs font-bold text-white rounded-bl-lg bg-linear-to-r ${getTierColor(achievement.tier)}`}
              >
                {getTierName(achievement.tier)}
              </div>

              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-linear-to-br ${getTierColor(achievement.tier)} p-0.5`}>
                  <div className="w-full h-full rounded-lg bg-white flex items-center justify-center">
                    <AppImage 
                      src={achievement.icon} 
                      alt={achievement.name} 
                      className={`w-10 h-10 object-contain ${completed ? '' : 'grayscale-30'}`}
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800 text-sm truncate">
                      {achievement.name}
                    </h4>
                    {completed && (
                      <span className="text-green-500 text-lg">✓</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {achievement.description}
                  </p>
                  
                  {/* Progress */}
                  {!completed && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500">
                          {progress} / {achievement.requirement}
                        </span>
                        <span className="text-amber-600 font-medium">
                          ⭐ +{achievement.starsReward}
                        </span>
                      </div>
                      <div className="bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            claimable 
                              ? 'bg-linear-to-r from-amber-400 to-yellow-500' 
                              : 'bg-linear-to-r from-blue-400 to-blue-500'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Completed indicator */}
                  {completed && (
                    <div className="mt-1 text-xs text-green-600 font-medium">
                      ⭐ +{achievement.starsReward} claimed!
                    </div>
                  )}
                </div>

                {/* Claim Button */}
                {claimable && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleClaim(achievement)}
                    disabled={isClaiming}
                    className="animate-bounce-slow shrink-0"
                  >
                    {isClaiming ? '...' : 'Claim!'}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Empty state */}
      {sortedAchievements.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🏆</div>
          <p className="text-slate-500">No achievements in this category</p>
        </div>
      )}
    </div>
  );
}
