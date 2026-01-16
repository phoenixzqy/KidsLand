import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { StarCounter } from '../components/ui/StarCounter';
import { useUser } from '../contexts/UserContext';
import { getWords } from '../db/sync';
import type { QuizType } from '../types';

// Quiz type icons for progress display
const QUIZ_TYPE_ICONS: Record<QuizType, string> = {
  spelling: '✏️',
  pronunciation: '🎤',
  sentence: '📝'
};

const ALL_QUIZ_TYPES: QuizType[] = ['spelling', 'pronunciation', 'sentence'];

export function WordListPage() {
  const navigate = useNavigate();
  const { stars, getWordProgress, state } = useUser();
  const words = getWords();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter words based on search
  const filteredWords = words.filter(word =>
    word.word.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate overall progress
  const learnedCount = state.wordProgress.filter(wp => wp.timesStudied > 0).length;
  const masteredCount = state.wordProgress.filter(wp => wp.mastered).length;

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-bg-primary/95 backdrop-blur-sm p-4 border-b border-slate-200">
        <div className="flex justify-between items-center mb-3">
          <button
            onClick={() => navigate('/')}
            className="text-2xl"
          >
            ←
          </button>
          <h1 className="text-xl font-bold text-slate-800">📚 Words</h1>
          <StarCounter count={stars} size="sm" />
        </div>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="🔍 Search words..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200
                     focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent
                     text-base"
        />
      </header>

      {/* Progress Overview */}
      <div className="p-4">
        <Card className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-600">Overall Progress</span>
            <span className="text-sm text-slate-500">{learnedCount} / {words.length} words</span>
          </div>
          <ProgressBar value={learnedCount} max={words.length} color="primary" />
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>⭐ {masteredCount} mastered</span>
            <span>{words.length - learnedCount} remaining</span>
          </div>
        </Card>

        {/* Word Grid */}
        <div className="grid grid-cols-3 gap-3">
          {filteredWords.map((word) => {
            const progress = getWordProgress(word.id);
            const isStudied = progress && progress.timesStudied > 0;
            const isMastered = progress?.mastered;

            return (
              <Link key={word.id} to={`/words/${word.id}`}>
                <Card
                  className={`text-center py-4 relative ${
                    isMastered
                      ? 'bg-gradient-to-br from-star/20 to-star/30 border-2 border-star'
                      : isStudied
                      ? 'bg-primary-50 border-2 border-primary-200'
                      : 'bg-white'
                  }`}
                  padding="sm"
                >
                  {/* Mastered badge */}
                  {isMastered && (
                    <div className="absolute -top-1 -right-1 text-lg">⭐</div>
                  )}

                  <span
                    className={`font-bold ${
                      isMastered
                        ? 'text-star'
                        : isStudied
                        ? 'text-primary-600'
                        : 'text-slate-700'
                    }`}
                  >
                    {word.word}
                  </span>

                  {/* Progress indicator - show quiz type icons */}
                  {isStudied && !isMastered && (
                    <div className="mt-1 flex justify-center gap-0.5 text-xs">
                      {ALL_QUIZ_TYPES.map((type) => {
                        const passed = progress?.passedQuizTypes?.includes(type);
                        return (
                          <span
                            key={type}
                            className={passed ? 'opacity-100' : 'opacity-30 grayscale'}
                          >
                            {QUIZ_TYPE_ICONS[type]}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Empty state */}
        {filteredWords.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-slate-500">No words found for "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-bg-primary/95 backdrop-blur-sm border-t border-slate-200">
        <Link to="/quiz">
          <Button variant="primary" fullWidth size="lg">
            🎯 Start Quiz
          </Button>
        </Link>
      </div>
    </div>
  );
}
