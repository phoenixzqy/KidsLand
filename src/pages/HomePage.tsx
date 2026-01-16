import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { StarCounter } from '../components/ui/StarCounter';
import { Avatar } from '../components/ui/Avatar';
import { ThemedBackground, ThemedHeader } from '../components/ui/ThemedBackground';
import { AppImage } from '../components/ui/AppImage';
import { HeroCard } from '../components/ui/HeroCard';
import { PageContainer } from '../components/ui/PageContainer';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/useTheme';

export function HomePage() {
  const { stars } = useUser();
  const { getEquippedAvatar } = useTheme();
  const avatar = getEquippedAvatar();

  return (
    <ThemedBackground className="p-4">
      <PageContainer>
        {/* Header */}
        <ThemedHeader className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Link to="/collection">
              <Avatar size="md" />
            </Link>
            <div className="flex items-center gap-2">
              <AppImage 
                src="/images/minecraft-renders/blocks/minecraft-crafting-table.png" 
                alt="KidsLand"
                className="w-6 h-6 object-contain"
              />
              <h1 className="text-xl font-bold text-primary-600">
                KidsLand
              </h1>
              {avatar && (
                <p className="text-xs text-slate-900">{avatar.name} equipped</p>
              )}
            </div>
          </div>
          <StarCounter count={stars} size="md" showAnimation />
        </ThemedHeader>

        {/* Welcome Card */}
        <HeroCard
          iconSrc="/images/minecraft-renders/blocks/minecraft-grass-block.png"
          iconAlt="Welcome"
          title="Welcome, Learner!"
          subtitle="Ready to learn some words today?"
          className="mb-6"
        />

        {/* Main Menu - responsive grid on larger screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Learn Words */}
        <Link to="/words">
          <Card
            className="flex items-center gap-4 hover:shadow-xl transition-shadow h-full"
            variant="elevated"
          >
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center p-2 shrink-0">
              <AppImage 
                src="/images/minecraft-renders/special/minecraft-enchanted-book.png" 
                alt="Learn Words"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-800">Learn Words</h3>
              <p className="text-sm text-slate-500">Study new words and sentences</p>
            </div>
            <div className="text-primary-400 text-2xl shrink-0">→</div>
          </Card>
        </Link>

        {/* Quiz */}
        <Link to="/quiz">
          <Card
            className="flex items-center gap-4 hover:shadow-xl transition-shadow h-full"
            variant="elevated"
          >
            <div className="w-16 h-16 bg-success/20 rounded-2xl flex items-center justify-center p-2 shrink-0">
              <AppImage 
                src="/images/minecraft-renders/materials/minecraft-eye-of-ender.png" 
                alt="Take a Quiz"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-800">Take a Quiz</h3>
              <p className="text-sm text-slate-500">Test your knowledge and earn stars</p>
            </div>
            <div className="text-primary-400 text-2xl shrink-0">→</div>
          </Card>
        </Link>

        {/* Market */}
        <Link to="/market">
          <Card
            className="flex items-center gap-4 hover:shadow-xl transition-shadow h-full"
            variant="elevated"
          >
            <div className="w-16 h-16 bg-star/20 rounded-2xl flex items-center justify-center p-2 shrink-0">
              <AppImage 
                src="/images/minecraft-renders/blocks/minecraft-chest.png" 
                alt="Market"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-800">Market</h3>
              <p className="text-sm text-slate-500">Spend stars on cool rewards</p>
            </div>
            <div className="text-primary-400 text-2xl shrink-0">→</div>
          </Card>
        </Link>

        {/* Collection */}
        <Link to="/collection">
          <Card
            className="flex items-center gap-4 hover:shadow-xl transition-shadow h-full"
            variant="elevated"
          >
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center p-2 shrink-0">
              <AppImage 
                src="/images/minecraft-renders/blocks/minecraft-ender-chest.png" 
                alt="My Collection"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-800">My Collection</h3>
              <p className="text-sm text-slate-500">View your cards & skins</p>
            </div>
            <div className="text-primary-400 text-2xl shrink-0">→</div>
          </Card>
        </Link>

        {/* Achievements */}
        <Link to="/achievements">
          <Card
            className="flex items-center gap-4 hover:shadow-xl transition-shadow h-full"
            variant="elevated"
          >
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center p-2 shrink-0">
              <AppImage
                src="/images/minecraft-renders/materials/minecraft-netherite-ingot.png"
                alt="Achievements"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-800">Achievements</h3>
              <p className="text-sm text-slate-500">Track your progress & earn badges</p>
            </div>
            <div className="text-primary-400 text-2xl shrink-0">→</div>
          </Card>
        </Link>

        {/* Games */}
        <Link to="/games">
          <Card
            className="flex items-center gap-4 hover:shadow-xl transition-shadow h-full"
            variant="elevated"
          >
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center p-2 shrink-0">
              <AppImage
                src="/images/minecraft-renders/weapons/minecraft-diamond-sword.png"
                alt="Games"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-800">Games</h3>
              <p className="text-sm text-slate-500">Play card battles & more!</p>
            </div>
            <div className="text-primary-400 text-2xl shrink-0">→</div>
          </Card>
        </Link>
      </div>

      {/* Quick Stats */}
      <Card className="mt-6">
        <h3 className="text-sm font-semibold text-slate-500 mb-3">Your Progress</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary-600">0</div>
            <div className="text-xs text-slate-500">Words Learned</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-success">0</div>
            <div className="text-xs text-slate-500">Quizzes Passed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-star">{stars}</div>
            <div className="text-xs text-slate-500">Total Stars</div>
          </div>
        </div>
      </Card>

      {/* Settings Button */}
      <div className="mt-6 text-center">
        <Link to="/settings">
          <Button variant="ghost" size="sm" className="flex items-center gap-2 mx-auto bg-white/80 backdrop-blur-sm hover:bg-white/90">
            <AppImage 
              src="/images/minecraft-renders/blocks/minecraft-crafting-table.png" 
              alt="Settings"
              className="w-5 h-5 object-contain"
            />
            Settings
          </Button>
        </Link>
      </div>
      </PageContainer>
    </ThemedBackground>
  );
}
