import { useNavigate } from 'react-router-dom';
import { StarCounter } from '../components/ui/StarCounter';
import { ThemedBackground } from '../components/ui/ThemedBackground';
import { Avatar } from '../components/ui/Avatar';
import { AppImage } from '../components/ui/AppImage';
import { AchievementsSection } from '../components/market/AchievementsSection';
import { useUser } from '../contexts/UserContext';

export function AchievementsPage() {
  const navigate = useNavigate();
  const { stars } = useUser();

  return (
    <ThemedBackground className="pb-6">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm p-4 border-b border-slate-200">
        <div className="flex justify-between items-center">
          <button onClick={() => navigate('/')} className="text-2xl">
            ←
          </button>
          <div className="flex items-center gap-3">
            <Avatar size="sm" />
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <AppImage 
                src="/images/minecraft-renders/materials/minecraft-netherite-ingot.png" 
                alt="Achievements" 
                className="w-6 h-6 object-contain" 
              />
              Achievements
            </h1>
          </div>
          <StarCounter count={stars} size="sm" />
        </div>
      </header>

      <div className="p-4">
        <AchievementsSection />
      </div>
    </ThemedBackground>
  );
}
