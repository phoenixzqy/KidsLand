import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StarCounter } from '../components/ui/StarCounter';
import { ThemedBackground } from '../components/ui/ThemedBackground';
import { useUser } from '../contexts/UserContext';

export function QuizSelectPage() {
  const navigate = useNavigate();
  const { stars } = useUser();

  const quizTypes = [
    {
      id: 'spelling',
      name: 'Spelling Quiz',
      icon: '✏️',
      description: 'Listen and type the word correctly',
      color: 'from-blue-400 to-blue-600'
    },
    {
      id: 'pronunciation',
      name: 'Pronunciation Quiz',
      icon: '🎤',
      description: 'Say the word out loud',
      color: 'from-purple-400 to-purple-600'
    },
    {
      id: 'sentence',
      name: 'Sentence Fill-in',
      icon: '📝',
      description: 'Complete the sentence with the right word',
      color: 'from-green-400 to-green-600'
    }
  ];

  return (
    <ThemedBackground className="pb-6">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm p-4 border-b border-slate-200">
        <div className="flex justify-between items-center">
          <button onClick={() => navigate('/')} className="text-2xl">
            ←
          </button>
          <h1 className="text-xl font-bold text-slate-800">🎯 Quiz</h1>
          <StarCounter count={stars} size="sm" />
        </div>
      </header>

      <div className="p-4">
        {/* Introduction */}
        <Card className="mb-6 bg-gradient-to-br from-primary-400 to-primary-600 text-white">
          <div className="text-center py-4">
            <div className="text-4xl mb-2">🏆</div>
            <h2 className="text-xl font-bold mb-1">Ready to Test Yourself?</h2>
            <p className="text-primary-100">Choose a quiz type and difficulty</p>
          </div>
        </Card>

        {/* Quiz Type Selection */}
        <h2 className="text-lg font-bold text-slate-700 mb-3">Select Quiz Type</h2>
        <div className="space-y-4 mb-8">
          {quizTypes.map((quiz) => (
            <div key={quiz.id}>
              <Card className="mb-2" variant="elevated">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br ${quiz.color}`}>
                    {quiz.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800">{quiz.name}</h3>
                    <p className="text-sm text-slate-500">{quiz.description}</p>
                  </div>
                </div>

                {/* Difficulty Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <Link to={`/quiz/${quiz.id}/easy`}>
                    <Button variant="secondary" fullWidth>
                      <span className="flex items-center gap-2">
                        <span>😊</span>
                        <span>Easy</span>
                        <span className="text-star">+1⭐</span>
                      </span>
                    </Button>
                  </Link>
                  <Link to={`/quiz/${quiz.id}/hard`}>
                    <Button variant="primary" fullWidth>
                      <span className="flex items-center gap-2">
                        <span>🔥</span>
                        <span>Hard</span>
                        <span className="text-star-glow">+3⭐</span>
                      </span>
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          ))}
        </div>

        {/* Difficulty Explanation */}
        <Card className="bg-slate-50">
          <h3 className="font-semibold text-slate-700 mb-2">Difficulty Levels</h3>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <span>😊</span>
              <span><strong>Easy:</strong> No time limit, earn 1 star per correct answer</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🔥</span>
              <span><strong>Hard:</strong> 10 seconds per question, earn 3 stars per correct answer</span>
            </div>
          </div>
        </Card>
      </div>
    </ThemedBackground>
  );
}
