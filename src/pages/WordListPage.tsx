import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { StarCounter } from '../components/ui/StarCounter';
import { ThemedBackground } from '../components/ui/ThemedBackground';
import { AppImage } from '../components/ui/AppImage';
import { useUser } from '../contexts/UserContext';
import { getWords } from '../db/sync';
import type { QuizType, Word } from '../types';

// Quiz type icons for progress display
const QUIZ_TYPE_ICONS: Record<QuizType, string> = {
  spelling: '✏️',
  pronunciation: '🎤',
  sentence: '📝'
};

const ALL_QUIZ_TYPES: QuizType[] = ['spelling', 'pronunciation', 'sentence'];

// All letters for quick navigation
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function WordListPage() {
  const navigate = useNavigate();
  const { stars, getWordProgress, state } = useUser();
  const words = getWords();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  // Filter words based on search and selected letter
  const filteredWords = useMemo(() => {
    let result = words;
    
    if (searchQuery) {
      result = result.filter(word =>
        word.word.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedLetter) {
      result = result.filter(word =>
        word.word.toUpperCase().startsWith(selectedLetter)
      );
    }
    
    return result;
  }, [words, searchQuery, selectedLetter]);

  // Group words by first letter
  const groupedWords = useMemo(() => {
    const groups: Record<string, Word[]> = {};
    
    filteredWords.forEach(word => {
      const letter = word.word[0].toUpperCase();
      if (!groups[letter]) {
        groups[letter] = [];
      }
      groups[letter].push(word);
    });
    
    // Sort words within each group
    Object.keys(groups).forEach(letter => {
      groups[letter].sort((a, b) => a.word.localeCompare(b.word));
    });
    
    return groups;
  }, [filteredWords]);

  // Get letters that have words
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    words.forEach(word => letters.add(word.word[0].toUpperCase()));
    return letters;
  }, [words]);

  // Calculate overall progress
  const learnedCount = state.wordProgress.filter(wp => wp.timesStudied > 0).length;
  const masteredCount = state.wordProgress.filter(wp => wp.mastered).length;

  const handleLetterClick = (letter: string) => {
    if (selectedLetter === letter) {
      setSelectedLetter(null);
    } else {
      setSelectedLetter(letter);
      setSearchQuery('');
      // Scroll to top when selecting a letter
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const clearFilters = () => {
    setSelectedLetter(null);
    setSearchQuery('');
  };

  return (
    <ThemedBackground className="pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm p-4 border-b border-slate-200">
        <div className="flex justify-between items-center mb-3">
          <button
            onClick={() => navigate('/')}
            className="text-2xl"
          >
            ←
          </button>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <AppImage src="/images/minecraft-renders/special/minecraft-enchanted-book.png" alt="Words" className="w-6 h-6 object-contain" />
            Words
          </h1>
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
            <span className="flex items-center gap-1"><AppImage src="/images/minecraft-renders/materials/minecraft-emerald.png" alt="emerald" className="w-4 h-4 inline-block" /> {masteredCount} mastered</span>
            <span>{words.length - learnedCount} remaining</span>
          </div>
        </Card>

        {/* Alphabet Filter */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1 justify-center">
            {ALPHABET.map((letter) => {
              const hasWords = availableLetters.has(letter);
              const isSelected = selectedLetter === letter;
              return (
                <button
                  key={letter}
                  onClick={() => hasWords && handleLetterClick(letter)}
                  disabled={!hasWords}
                  className={`w-8 h-8 rounded-lg font-bold text-sm transition-all
                    ${isSelected 
                      ? 'bg-primary-500 text-white shadow-md scale-110' 
                      : hasWords 
                        ? 'bg-white text-slate-700 hover:bg-primary-100 border border-slate-200' 
                        : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                    }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
          {(selectedLetter || searchQuery) && (
            <div className="text-center mt-3">
              <button
                onClick={clearFilters}
                className="text-sm text-primary-500 hover:text-primary-600 font-medium"
              >
                ✕ Clear filters ({filteredWords.length} words shown)
              </button>
            </div>
          )}
        </div>

        {/* Word Sections by Letter */}
        {Object.keys(groupedWords).sort().map((letter) => (
          <div key={letter} className="mb-6">
            {/* Letter Header */}
            <div className="sticky top-30 z-10 bg-linear-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-lg mb-3 shadow-md">
              <span className="text-lg font-bold">{letter}</span>
              <span className="text-sm ml-2 opacity-80">({groupedWords[letter].length} words)</span>
            </div>
            
            {/* Word Grid */}
            <div className="grid grid-cols-3 gap-3">
              {groupedWords[letter].map((word) => {
                const progress = getWordProgress(word.id);
                const isStudied = progress && progress.timesStudied > 0;
                const isMastered = progress?.mastered;

                return (
                  <Link key={word.id} to={`/words/${word.id}`}>
                    <Card
                      className={`text-center py-4 relative ${
                        isMastered
                          ? 'bg-linear-to-br from-star/20 to-star/30 border-2 border-star'
                          : isStudied
                          ? 'bg-primary-50 border-2 border-primary-200'
                          : 'bg-white'
                      }`}
                      padding="sm"
                    >
                      {/* Mastered badge */}
                      {isMastered && (
                        <div className="absolute -top-1 -right-1"><AppImage src="/images/minecraft-renders/materials/minecraft-emerald.png" alt="mastered" className="w-5 h-5" /></div>
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
          </div>
        ))}

        {/* Empty state */}
        {filteredWords.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-slate-500 mb-2">
              {searchQuery 
                ? `No words found for "${searchQuery}"`
                : selectedLetter
                ? `No words starting with "${selectedLetter}"`
                : 'No words found'
              }
            </p>
            <button
              onClick={clearFilters}
              className="text-primary-500 hover:text-primary-600 font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-20 bg-white/90 backdrop-blur-sm border-t border-slate-200">
        <Link to="/quiz">
          <Button variant="primary" fullWidth size="lg">
            🎯 Start Quiz
          </Button>
        </Link>
      </div>
    </ThemedBackground>
  );
}
