import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { StarCounter } from '../components/ui/StarCounter';
import { ThemedBackground, ThemedHeader } from '../components/ui/ThemedBackground';
import { useUser } from '../contexts/UserContext';

export function HomePage() {
  const { stars } = useUser();

  return (
    <ThemedBackground className="p-4">
      {/* Header */}
      <ThemedHeader className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-primary-600">
          🎮 KidsLand
        </h1>
        <StarCounter count={stars} size="md" showAnimation />
      </ThemedHeader>

      {/* Welcome Card */}
      <Card className="mb-6 bg-gradient-to-br from-primary-400 to-primary-600 text-white">
        <div className="text-center py-4">
          <div className="text-4xl mb-2">👋</div>
          <h2 className="text-xl font-bold mb-1">Welcome, Learner!</h2>
          <p className="text-primary-100">Ready to learn some words today?</p>
        </div>
      </Card>

      {/* Main Menu */}
      <div className="space-y-4">
        {/* Learn Words */}
        <Link to="/words">
          <Card
            className="flex items-center gap-4 hover:shadow-xl transition-shadow mb-2"
            variant="elevated"
          >
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center text-3xl">
              📚
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-800">Learn Words</h3>
              <p className="text-sm text-slate-500">Study new words and sentences</p>
            </div>
            <div className="text-primary-400 text-2xl">→</div>
          </Card>
        </Link>

        {/* Quiz */}
        <Link to="/quiz">
          <Card
            className="flex items-center gap-4 hover:shadow-xl transition-shadow mb-2"
            variant="elevated"
          >
            <div className="w-16 h-16 bg-success/20 rounded-2xl flex items-center justify-center text-3xl">
              🎯
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-800">Take a Quiz</h3>
              <p className="text-sm text-slate-500">Test your knowledge and earn stars</p>
            </div>
            <div className="text-primary-400 text-2xl">→</div>
          </Card>
        </Link>

        {/* Market */}
        <Link to="/market">
          <Card
            className="flex items-center gap-4 hover:shadow-xl transition-shadow mb-2"
            variant="elevated"
          >
            <div className="w-16 h-16 bg-star/20 rounded-2xl flex items-center justify-center text-3xl">
              🛒
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-800">Market</h3>
              <p className="text-sm text-slate-500">Spend stars on cool rewards</p>
            </div>
            <div className="text-primary-400 text-2xl">→</div>
          </Card>
        </Link>

        {/* Collection */}
        <Link to="/collection">
          <Card
            className="flex items-center gap-4 hover:shadow-xl transition-shadow mb-2"
            variant="elevated"
          >
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center text-3xl">
              🎒
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-800">My Collection</h3>
              <p className="text-sm text-slate-500">View your cards, badges & skins</p>
            </div>
            <div className="text-primary-400 text-2xl">→</div>
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
          <Button variant="ghost" size="sm">
            ⚙️ Settings
          </Button>
        </Link>
      </div>
    </ThemedBackground>
  );
}
