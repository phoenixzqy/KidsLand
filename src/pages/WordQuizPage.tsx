import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Timer } from '../components/ui/Timer';
import { StarCounter } from '../components/ui/StarCounter';
import { ProgressBar } from '../components/ui/ProgressBar';
import { AppImage } from '../components/ui/AppImage';
import { HeaderContainer, PageContainer } from '../components/ui/PageContainer';
import { useUser } from '../contexts/UserContext';
import { useTimer } from '../hooks/useTimer';
import { useSpeech } from '../hooks/useSpeech';
import { useSpeechRecognition, compareWords } from '../hooks/useSpeechRecognition';
import { getWordById, getPrizeById } from '../db/sync';
import { updateWordQuizProgress, getRemainingQuizTypesForWord } from '../db/database';
import type { QuizType, DifficultyLevel, Word, Prize } from '../types';

const HARD_MODE_TIME = 5;

// Quiz type display info
const QUIZ_TYPE_INFO: Record<QuizType, { name: string; icon: string; instruction: string }> = {
  spelling: {
    name: 'Spelling',
    icon: '✏️',
    instruction: 'Listen and type the word:'
  },
  pronunciation: {
    name: 'Pronunciation',
    icon: '🎤',
    instruction: 'Say this word out loud:'
  },
  sentence: {
    name: 'Sentence Fill-in',
    icon: '📝',
    instruction: 'Fill in the blank:'
  }
};

interface QuizState {
  currentQuizType: QuizType | null;
  remainingTypes: QuizType[];
  completedTypes: QuizType[];
  passedTypes: QuizType[];
}

export function WordQuizPage() {
  const { wordId } = useParams<{ wordId: string }>();
  const [searchParams] = useSearchParams();
  const level = (searchParams.get('level') || 'easy') as DifficultyLevel;
  const navigate = useNavigate();
  const { stars, addStars, refreshData, ownedItems, incrementQuizzesCompleted } = useUser();

  // Fun animations for celebration
  const celebrationAnimations = [
    'animate-bounce',
    'animate-bounce-star',
    'animate-wiggle',
    'animate-hop',
    'animate-bounce-slow',
  ];

  // Get a random owned item for celebration (re-randomizes each render)
  const getRandomCelebrationItem = () => {
    const items = ownedItems
      .map(item => getPrizeById(item.prizeId))
      .filter((prize): prize is Prize => prize !== undefined && prize.type !== 'skin');
    
    if (items.length === 0) return null;
    return items[Math.floor(Math.random() * items.length)];
  };

  const getRandomAnimation = () => {
    return celebrationAnimations[Math.floor(Math.random() * celebrationAnimations.length)];
  };
  const { speak } = useSpeech();
  const { startListening, stopListening, isListening, transcript, resetTranscript } = useSpeechRecognition();

  const [word, setWord] = useState<Word | null>(null);
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuizType: null,
    remainingTypes: [],
    completedTypes: [],
    passedTypes: []
  });
  const [answer, setAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [newlyMastered, setNewlyMastered] = useState(false);
  const [sentenceWithBlank, setSentenceWithBlank] = useState('');
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const isHardMode = level === 'hard';
  const starsPerQuestion = isHardMode ? 3 : 1;

  // Generate similar-looking wrong options for multiple choice
  const generateWrongOptions = useCallback((correctWord: string): string[] => {
    const wrongOptions: Set<string> = new Set();
    const word = correctWord.toLowerCase();
    
    // Strategy 1: Swap adjacent letters
    for (let i = 0; i < word.length - 1 && wrongOptions.size < 5; i++) {
      const swapped = word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2);
      if (swapped !== word) wrongOptions.add(swapped);
    }
    
    // Strategy 2: Replace vowels with other vowels
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    for (let i = 0; i < word.length && wrongOptions.size < 8; i++) {
      if (vowels.includes(word[i])) {
        for (const v of vowels) {
          if (v !== word[i]) {
            const replaced = word.slice(0, i) + v + word.slice(i + 1);
            if (replaced !== word) wrongOptions.add(replaced);
          }
        }
      }
    }
    
    // Strategy 3: Double a letter
    for (let i = 0; i < word.length && wrongOptions.size < 10; i++) {
      const doubled = word.slice(0, i) + word[i] + word.slice(i);
      if (doubled !== word) wrongOptions.add(doubled);
    }
    
    // Strategy 4: Remove a letter
    for (let i = 0; i < word.length && wrongOptions.size < 12; i++) {
      const removed = word.slice(0, i) + word.slice(i + 1);
      if (removed !== word && removed.length >= 2) wrongOptions.add(removed);
    }
    
    // Convert to array, shuffle, and take 3
    const shuffled = Array.from(wrongOptions).sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, []);

  // Timer for hard mode
  const { timeLeft, restart: restartTimer, pause: pauseTimer } = useTimer({
    initialTime: HARD_MODE_TIME,
    onTimeUp: () => {
      if (hasStarted && !showResult && !quizComplete) {
        handleTimeUp();
      }
    },
    autoStart: false
  });

  // Load word and remaining quiz types
  useEffect(() => {
    const loadData = async () => {
      if (!wordId) return;

      const wordData = getWordById(wordId);
      if (!wordData) {
        navigate('/words');
        return;
      }
      setWord(wordData);

      // Get remaining quiz types for this word
      const remaining = await getRemainingQuizTypesForWord(wordId);

      if (remaining.length === 0) {
        // Word already mastered, but allow re-quiz
        setQuizState({
          currentQuizType: 'spelling',
          remainingTypes: ['pronunciation', 'sentence'],
          completedTypes: [],
          passedTypes: []
        });
      } else {
        setQuizState({
          currentQuizType: remaining[0],
          remainingTypes: remaining.slice(1),
          completedTypes: [],
          passedTypes: []
        });
      }
    };

    loadData();
  }, [wordId, navigate]);

  // Prepare sentence with blank and multiple choice options for sentence quiz
  useEffect(() => {
    if (word && quizState.currentQuizType === 'sentence' && word.sentences.length > 0) {
      const sentence = word.sentences[Math.floor(Math.random() * word.sentences.length)];
      const regex = new RegExp(`\\b${word.word}\\b`, 'gi');
      setSentenceWithBlank(sentence.text.replace(regex, '_____'));
      
      // Generate multiple choice options
      const wrongOptions = generateWrongOptions(word.word);
      const allOptions = [word.word.toLowerCase(), ...wrongOptions];
      // Shuffle options
      const shuffled = allOptions.sort(() => Math.random() - 0.5);
      setMultipleChoiceOptions(shuffled);
      setSelectedOption(null);
    }
  }, [word, quizState.currentQuizType, generateWrongOptions]);

  // Handle time up for hard mode
  const handleTimeUp = useCallback(() => {
    setIsCorrect(false);
    setShowResult(true);
    pauseTimer();
  }, [pauseTimer]);

  // Start the current quiz
  const handleStart = () => {
    setHasStarted(true);
    if (isHardMode) {
      restartTimer();
    }
    // Auto-speak for spelling quiz
    if (quizState.currentQuizType === 'spelling' && word) {
      speak(word.word);
    }
  };

  // Check answer
  const checkAnswer = useCallback(async () => {
    if (!word || !quizState.currentQuizType || showResult) return;

    let correct = false;

    if (quizState.currentQuizType === 'spelling') {
      correct = answer.toLowerCase().trim() === word.word.toLowerCase();
    } else if (quizState.currentQuizType === 'sentence') {
      correct = selectedOption?.toLowerCase() === word.word.toLowerCase();
    } else if (quizState.currentQuizType === 'pronunciation') {
      const result = compareWords(transcript, word.word);
      correct = result.isMatch;
    }

    setIsCorrect(correct);
    setShowResult(true);
    pauseTimer();

    // Update progress in database
    if (wordId && quizState.currentQuizType) {
      const result = await updateWordQuizProgress(wordId, quizState.currentQuizType, correct);

      // Track passed types for final summary
      if (correct) {
        setQuizState(prev => ({
          ...prev,
          passedTypes: [...prev.passedTypes, prev.currentQuizType!]
        }));
      }

      // Award stars immediately for correct answer
      if (correct) {
        await addStars(starsPerQuestion);
      }

      // Check if newly mastered (will be checked at quiz complete)
      if (result.newlyMastered) {
        setNewlyMastered(true);
      }
    }
  }, [word, quizState.currentQuizType, answer, selectedOption, transcript, showResult, pauseTimer, wordId, addStars, starsPerQuestion]);

  // Handle speech recognition result
  useEffect(() => {
    if (quizState.currentQuizType === 'pronunciation' && transcript && hasStarted && !showResult) {
      stopListening();
      checkAnswer();
    }
  }, [transcript, quizState.currentQuizType, hasStarted, showResult, stopListening, checkAnswer]);

  // Move to next quiz type or complete
  const nextQuiz = async () => {
    // Track each completed quiz type for achievements
    await incrementQuizzesCompleted();
    
    if (quizState.remainingTypes.length === 0) {
      // All quizzes complete
      setQuizComplete(true);
      refreshData(); // Refresh user context to get updated progress
    } else {
      // Move to next quiz type
      const nextType = quizState.remainingTypes[0];
      setQuizState(prev => ({
        ...prev,
        currentQuizType: nextType,
        remainingTypes: prev.remainingTypes.slice(1),
        completedTypes: [...prev.completedTypes, prev.currentQuizType!]
      }));

      // Reset for next quiz
      setAnswer('');
      setSelectedOption(null);
      setShowResult(false);
      setIsCorrect(false);
      setHasStarted(false);
      if (typeof resetTranscript === 'function') {
        resetTranscript();
      }
    }
  };

  // Quiz Complete Screen
  if (quizComplete && word) {
    const totalPassed = quizState.passedTypes.length;
    const totalQuizzes = quizState.completedTypes.length + 1; // +1 for current
    const totalStars = totalPassed * starsPerQuestion;

    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center py-8">
          {newlyMastered ? (
            <>
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-primary-600 mb-2">
                Word Mastered!
              </h2>
              <p className="text-lg text-slate-700 mb-2">
                You've learned "<span className="font-bold">{word.word}</span>"!
              </p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">
                {totalPassed === totalQuizzes ? '🏆' : totalPassed > 0 ? '👍' : '💪'}
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                {totalPassed === totalQuizzes ? 'Perfect!' : totalPassed > 0 ? 'Good Progress!' : 'Keep Practicing!'}
              </h2>
            </>
          )}

          <p className="text-slate-600 mb-6">
            You passed {totalPassed} out of {totalQuizzes} quizzes for "{word.word}"
          </p>

          {/* Quiz results summary */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <div className="space-y-2">
              {[...quizState.completedTypes, quizState.currentQuizType!].map((type) => {
                const info = QUIZ_TYPE_INFO[type];
                const passed = quizState.passedTypes.includes(type);
                return (
                  <div key={type} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span>{info.icon}</span>
                      <span className="text-sm">{info.name}</span>
                    </span>
                    <span className={passed ? 'text-success' : 'text-error'}>
                      {passed ? '✅' : '❌'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-star/10 rounded-2xl p-6 mb-6">
            <div className="flex justify-center mb-2"><AppImage src="/images/minecraft-renders/materials/minecraft-emerald.png" alt="emerald" className="w-12 h-12 object-contain" /></div>
            <div className="text-3xl font-bold text-star">+{totalStars}</div>
            <div className="text-sm text-slate-500">Emeralds earned!</div>
          </div>

          <div className="space-y-3">
            <Button
              variant="primary"
              fullWidth
              onClick={() => navigate(`/words/${wordId}`)}
            >
              Back to Word
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => navigate('/words')}
            >
              All Words
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Loading state
  if (!word || !quizState.currentQuizType) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  const currentQuizInfo = QUIZ_TYPE_INFO[quizState.currentQuizType];
  const totalQuizTypes = quizState.completedTypes.length + quizState.remainingTypes.length + 1;
  const currentQuizNumber = quizState.completedTypes.length + 1;

  // Start screen for each quiz type
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center py-8">
          <div className="text-6xl mb-4">{currentQuizInfo.icon}</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {currentQuizInfo.name} Quiz
          </h2>
          <p className="text-lg text-primary-600 mb-2">
            Word: <span className="font-bold">{word.word}</span>
          </p>
          <p className="text-slate-600 mb-2">
            {isHardMode ? '🔥 Hard Mode' : '😊 Easy Mode'}
          </p>
          <p className="text-sm text-slate-500 mb-2">
            Quiz {currentQuizNumber} of {totalQuizTypes}
          </p>
          <p className="text-sm text-slate-500 mb-6">
            {starsPerQuestion} star{starsPerQuestion > 1 ? 's' : ''} if correct
            {isHardMode && ` • ${HARD_MODE_TIME}s time limit`}
          </p>

          <Button variant="primary" size="lg" fullWidth onClick={handleStart}>
            Start Quiz!
          </Button>

          <button
            onClick={() => navigate(`/words/${wordId}`)}
            className="mt-4 text-slate-500 text-sm underline"
          >
            Cancel
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-bg-primary/95 backdrop-blur-sm p-4 border-b border-slate-200">
        <HeaderContainer>
          <div className="flex justify-between items-center mb-2">
            <button onClick={() => navigate(`/words/${wordId}`)} className="text-xl">
              ✕
            </button>
            <span className="text-sm font-medium text-slate-600">
              {currentQuizInfo.icon} {currentQuizInfo.name} ({currentQuizNumber}/{totalQuizTypes})
            </span>
            <StarCounter count={stars} size="sm" />
          </div>
          <ProgressBar value={currentQuizNumber} max={totalQuizTypes} color="primary" />
        </HeaderContainer>
      </header>

      <PageContainer className="p-4">
        {/* Timer (hard mode) */}
        {isHardMode && !showResult && (
          <div className="flex justify-center mb-4">
            <Timer timeLeft={timeLeft} totalTime={HARD_MODE_TIME} size="lg" />
          </div>
        )}

        {/* Question Card */}
        <Card className="text-center py-8 mb-6">
          <p className="text-slate-600 mb-4">{currentQuizInfo.instruction}</p>

          {quizState.currentQuizType === 'spelling' && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => speak(word.word)}
              className="mb-6"
            >
              🔊 Play Sound
            </Button>
          )}

          {quizState.currentQuizType === 'pronunciation' && (
            <h2 className="text-5xl font-bold text-primary-600 mb-6">
              {word.word}
            </h2>
          )}

          {quizState.currentQuizType === 'sentence' && (
            <h2 className="text-xl font-medium text-slate-800 mb-6 leading-relaxed">
              {sentenceWithBlank}
            </h2>
          )}

          {/* Answer Input for spelling */}
          {quizState.currentQuizType === 'spelling' && !showResult && (
            <div className="space-y-4">
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                placeholder="Type your answer..."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-200
                           focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent
                           text-center text-xl font-bold"
                autoFocus
              />
              <Button
                variant="primary"
                fullWidth
                size="lg"
                onClick={checkAnswer}
                disabled={!answer.trim()}
              >
                Check Answer
              </Button>
            </div>
          )}

          {/* Multiple choice options for sentence quiz */}
          {quizState.currentQuizType === 'sentence' && !showResult && (
            <div className="space-y-3">
              {multipleChoiceOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedOption(option);
                    // Auto-submit on selection
                    setTimeout(() => {
                      setSelectedOption(option);
                    }, 0);
                  }}
                  className={`w-full px-4 py-4 rounded-xl text-lg font-bold transition-all
                    ${selectedOption === option
                      ? 'bg-primary-500 text-white ring-2 ring-primary-300'
                      : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                    }`}
                >
                  {option}
                </button>
              ))}
              <Button
                variant="primary"
                fullWidth
                size="lg"
                onClick={checkAnswer}
                disabled={!selectedOption}
                className="mt-4"
              >
                Check Answer
              </Button>
            </div>
          )}

          {/* Microphone for pronunciation */}
          {quizState.currentQuizType === 'pronunciation' && !showResult && (
            <Button
              variant={isListening ? 'danger' : 'primary'}
              size="lg"
              onClick={isListening ? stopListening : startListening}
              className={isListening ? 'animate-pulse' : ''}
            >
              {isListening ? '🎤 Listening...' : '🎤 Start Speaking'}
            </Button>
          )}

          {/* Result Display */}
          {showResult && (
            <div className={`mt-6 p-4 rounded-2xl ${isCorrect ? 'bg-success/10' : 'bg-error/10'}`}>
              {isCorrect ? (
                <>
                  {/* Celebration item replaces checkmark */}
                  {(() => {
                    const item = getRandomCelebrationItem();
                    return (
                      <div className="flex justify-center mb-2">
                        <div className={`w-20 h-20 ${getRandomAnimation()}`}>
                          {item ? (
                            <AppImage
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-contain drop-shadow-lg"
                            />
                          ) : (
                            <span className="text-5xl">🎉</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  <p className="text-lg font-bold text-success">Correct!</p>
                  <p className="text-emerald-600 font-bold mt-2 flex items-center justify-center gap-1">
                    +{starsPerQuestion}
                    <AppImage src="/images/minecraft-renders/materials/minecraft-emerald.png" alt="emerald" className="w-5 h-5 inline-block" />
                  </p>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-2">❌</div>
                  <p className="text-lg font-bold text-error">Not quite!</p>
                  <p className="text-slate-600 mt-2">
                    The answer was: <strong>{word.word}</strong>
                  </p>
                </>
              )}
            </div>
          )}
        </Card>
      </PageContainer>

      {/* Next Button */}
      {showResult && (
        <div className="fixed bottom-0 left-0 right-0 bg-bg-primary/95 backdrop-blur-sm border-t border-slate-200">
          <PageContainer className="p-4">
            <Button variant="primary" fullWidth size="lg" onClick={nextQuiz}>
              {quizState.remainingTypes.length === 0 ? 'See Results' : 'Next Quiz'} →
            </Button>
          </PageContainer>
        </div>
      )}
    </div>
  );
}
