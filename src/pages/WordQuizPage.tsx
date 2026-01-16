import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Timer } from '../components/ui/Timer';
import { StarCounter } from '../components/ui/StarCounter';
import { ProgressBar } from '../components/ui/ProgressBar';
import { AppImage } from '../components/ui/AppImage';
import { useUser } from '../contexts/UserContext';
import { useTimer } from '../hooks/useTimer';
import { useSpeech } from '../hooks/useSpeech';
import { useSpeechRecognition, compareWords } from '../hooks/useSpeechRecognition';
import { getWordById } from '../db/sync';
import { updateWordQuizProgress, getRemainingQuizTypesForWord } from '../db/database';
import type { QuizType, DifficultyLevel, Word } from '../types';

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
  const { stars, addStars, refreshData } = useUser();
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

  const isHardMode = level === 'hard';
  const starsPerQuestion = isHardMode ? 3 : 1;

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

  // Prepare sentence with blank for sentence quiz
  useEffect(() => {
    if (word && quizState.currentQuizType === 'sentence' && word.sentences.length > 0) {
      const sentence = word.sentences[Math.floor(Math.random() * word.sentences.length)];
      const regex = new RegExp(`\\b${word.word}\\b`, 'gi');
      setSentenceWithBlank(sentence.text.replace(regex, '_____'));
    }
  }, [word, quizState.currentQuizType]);

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

    if (quizState.currentQuizType === 'spelling' || quizState.currentQuizType === 'sentence') {
      correct = answer.toLowerCase().trim() === word.word.toLowerCase();
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
  }, [word, quizState.currentQuizType, answer, transcript, showResult, pauseTimer, wordId, addStars, starsPerQuestion]);

  // Handle speech recognition result
  useEffect(() => {
    if (quizState.currentQuizType === 'pronunciation' && transcript && hasStarted && !showResult) {
      stopListening();
      checkAnswer();
    }
  }, [transcript, quizState.currentQuizType, hasStarted, showResult, stopListening, checkAnswer]);

  // Move to next quiz type or complete
  const nextQuiz = async () => {
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
      </header>

      <div className="p-4">
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

          {/* Answer Input for spelling and sentence */}
          {(quizState.currentQuizType === 'spelling' || quizState.currentQuizType === 'sentence') && !showResult && (
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
              <div className="text-4xl mb-2">{isCorrect ? '✅' : '❌'}</div>
              <p className={`text-lg font-bold ${isCorrect ? 'text-success' : 'text-error'}`}>
                {isCorrect ? 'Correct!' : 'Not quite!'}
              </p>
              {!isCorrect && (
                <p className="text-slate-600 mt-2">
                  The answer was: <strong>{word.word}</strong>
                </p>
              )}
              {isCorrect && (
                <p className="text-star font-bold mt-2 flex items-center justify-center gap-1">+{starsPerQuestion}<AppImage src="/images/minecraft-renders/materials/minecraft-emerald.png" alt="emerald" className="w-5 h-5 inline-block" /></p>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Next Button */}
      {showResult && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-bg-primary/95 backdrop-blur-sm border-t border-slate-200">
          <Button variant="primary" fullWidth size="lg" onClick={nextQuiz}>
            {quizState.remainingTypes.length === 0 ? 'See Results' : 'Next Quiz'} →
          </Button>
        </div>
      )}
    </div>
  );
}
