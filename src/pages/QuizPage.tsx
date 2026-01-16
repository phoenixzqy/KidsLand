import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { getWords, getPrizeById } from '../db/sync';
import type { QuizType, DifficultyLevel, Word, Prize } from '../types';

const QUESTIONS_PER_QUIZ = 10;
const HARD_MODE_TIME = 10;

interface QuizQuestion {
  word: Word;
  type: QuizType;
  sentence?: string;
  blankWord?: string;
}

export function QuizPage() {
  const { type, level } = useParams<{ type: QuizType; level: DifficultyLevel }>();
  const navigate = useNavigate();
  const { stars, addStars, ownedItems, incrementQuizzesCompleted } = useUser();
  const { speak } = useSpeech();
  const { startListening, stopListening, isListening, transcript } = useSpeechRecognition();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [celebrationItemIndex, setCelebrationItemIndex] = useState(0);
  const [animationIndex, setAnimationIndex] = useState(0);

  const isHardMode = level === 'hard';
  const starsPerQuestion = isHardMode ? 3 : 1;

  // Fun animations for celebration
  const celebrationAnimations = [
    'animate-bounce',
    'animate-bounce-star',
    'animate-wiggle',
    'animate-hop',
    'animate-bounce-slow',
  ];

  // Get celebratable items (cards only, not skins)
  const celebrationItems = useMemo(() => {
    return ownedItems
      .map(item => getPrizeById(item.prizeId))
      .filter((prize): prize is Prize => prize !== undefined && prize.type !== 'skin');
  }, [ownedItems]);

  // Get current celebration item based on stored index
  const currentCelebrationItem = celebrationItems.length > 0 
    ? celebrationItems[celebrationItemIndex % celebrationItems.length] 
    : null;

  // Get current animation based on stored index
  const currentAnimation = celebrationAnimations[animationIndex % celebrationAnimations.length];

  // Randomize celebration item and animation (called in event handlers, not during render)
  const randomizeCelebration = useCallback(() => {
    setCelebrationItemIndex(Math.floor(Math.random() * Math.max(1, celebrationItems.length)));
    setAnimationIndex(Math.floor(Math.random() * celebrationAnimations.length));
  // celebrationAnimations is a constant array, its length never changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebrationItems.length]);

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

  // Generate quiz questions on mount/type change - this is intentionally setting state in effect
  // to initialize questions when the component mounts or quiz type changes
  useEffect(() => {
    const words = getWords();
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, QUESTIONS_PER_QUIZ);

    const generatedQuestions: QuizQuestion[] = selected.map((word) => {
      const question: QuizQuestion = { word, type: type as QuizType };

      if (type === 'sentence' && word.sentences.length > 0) {
        const sentence = word.sentences[Math.floor(Math.random() * word.sentences.length)];
        // Replace the word with blanks
        const regex = new RegExp(`\\b${word.word}\\b`, 'gi');
        question.sentence = sentence.text.replace(regex, '_____');
        question.blankWord = word.word;
      }

      return question;
    });

    setQuestions(generatedQuestions);
  }, [type]);

  const currentQuestion = questions[currentIndex];

  // Handle time up for hard mode
  const handleTimeUp = useCallback(() => {
    setIsCorrect(false);
    setShowResult(true);
    pauseTimer();
    randomizeCelebration();
  }, [pauseTimer, randomizeCelebration]);

  // Start the quiz
  const handleStart = () => {
    setHasStarted(true);
    if (isHardMode) {
      restartTimer();
    }
    // Auto-speak for spelling quiz
    if (type === 'spelling' && currentQuestion) {
      speak(currentQuestion.word.word);
    }
  };

  // Check answer
  const checkAnswer = useCallback(() => {
    if (!currentQuestion || showResult) return;

    let correct = false;

    if (type === 'spelling' || type === 'sentence') {
      correct = answer.toLowerCase().trim() === currentQuestion.word.word.toLowerCase();
    } else if (type === 'pronunciation') {
      const result = compareWords(transcript, currentQuestion.word.word);
      correct = result.isMatch;
    }

    setIsCorrect(correct);
    setShowResult(true);
    pauseTimer();
    randomizeCelebration();

    if (correct) {
      setCorrectCount(prev => prev + 1);
    }
  }, [currentQuestion, answer, transcript, type, showResult, pauseTimer, randomizeCelebration]);

  // Handle speech recognition result - this effect responds to external speech recognition events
  useEffect(() => {
    if (type === 'pronunciation' && transcript && hasStarted && !showResult) {
      stopListening();
      checkAnswer();
    }
  }, [transcript, type, hasStarted, showResult, stopListening, checkAnswer]);

  // Move to next question
  const nextQuestion = async () => {
    if (currentIndex + 1 >= questions.length) {
      // Quiz complete
      if (isCorrect) {
        // Add stars for current correct answer
        await addStars(starsPerQuestion);
      }
      // Track quiz completion for achievements
      await incrementQuizzesCompleted();
      setQuizComplete(true);
    } else {
      // Award stars for correct answer
      if (isCorrect) {
        await addStars(starsPerQuestion);
      }

      // Move to next
      setCurrentIndex(prev => prev + 1);
      setAnswer('');
      setShowResult(false);
      setIsCorrect(false);

      if (isHardMode) {
        restartTimer();
      }

      // Auto-speak for spelling quiz
      if (type === 'spelling') {
        setTimeout(() => {
          speak(questions[currentIndex + 1].word.word);
        }, 300);
      }
    }
  };

  // Quiz Complete Screen
  if (quizComplete) {
    const totalStars = correctCount * starsPerQuestion;
    const percentage = (correctCount / questions.length) * 100;

    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4 overflow-hidden">
        <div className="w-full max-w-md relative">
          <Card className="text-center py-8 relative z-10">
            {/* Trophy/Result Icon */}
            <div className="text-6xl mb-4">
              {percentage >= 80 ? '🏆' : percentage >= 50 ? '👍' : '💪'}
            </div>
            
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {percentage >= 80 ? 'Amazing!' : percentage >= 50 ? 'Good Job!' : 'Keep Trying!'}
            </h2>
            <p className="text-slate-600 mb-4">
              You got {correctCount} out of {questions.length} correct!
            </p>

            {/* Emeralds Earned */}
            <div className="bg-emerald-50 rounded-2xl p-5 mb-5 border border-emerald-200">
              <div className="flex justify-center mb-2">
                <AppImage 
                  src="/images/minecraft-renders/materials/minecraft-emerald.png" 
                  alt="emerald" 
                  className="w-14 h-14 object-contain animate-bounce-star" 
                />
              </div>
              <div className="text-3xl font-bold text-emerald-600">+{totalStars}</div>
              <div className="text-sm text-emerald-700">Emeralds earned!</div>
            </div>

            {/* Celebration Item */}
            {currentCelebrationItem && (
              <div className="mb-5">
                <p className="text-xs text-slate-500 mb-2">Your collection celebrates with you!</p>
                <div className="flex justify-center">
                  <div className={`w-20 h-20 ${currentAnimation}`}>
                    <AppImage
                      src={currentCelebrationItem.image}
                      alt={currentCelebrationItem.name}
                      className="w-full h-full object-contain drop-shadow-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button variant="primary" fullWidth onClick={() => navigate('/quiz')}>
                Try Another Quiz
              </Button>
              <Button variant="secondary" fullWidth onClick={() => navigate('/')}>
                Go Home
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Loading state
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  // Start screen
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center py-8">
          <div className="text-6xl mb-4">
            {type === 'spelling' ? '✏️' : type === 'pronunciation' ? '🎤' : '📝'}
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {type === 'spelling' ? 'Spelling Quiz' : type === 'pronunciation' ? 'Pronunciation Quiz' : 'Sentence Fill-in'}
          </h2>
          <p className="text-slate-600 mb-2">
            {isHardMode ? '🔥 Hard Mode' : '😊 Easy Mode'}
          </p>
          <p className="text-sm text-slate-500 mb-6">
            {QUESTIONS_PER_QUIZ} questions • {starsPerQuestion} star{starsPerQuestion > 1 ? 's' : ''} per correct answer
            {isHardMode && ` • ${HARD_MODE_TIME}s time limit`}
          </p>

          <Button variant="primary" size="lg" fullWidth onClick={handleStart}>
            Start Quiz!
          </Button>
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
            <button onClick={() => navigate('/quiz')} className="text-xl">
              ✕
            </button>
            <span className="text-sm font-medium text-slate-600">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <StarCounter count={stars} size="sm" />
          </div>
          <ProgressBar value={currentIndex + 1} max={questions.length} color="primary" />
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
          {type === 'spelling' && (
            <>
              <p className="text-slate-600 mb-4">Listen and type the word:</p>
              <Button
                variant="primary"
                size="lg"
                onClick={() => speak(currentQuestion.word.word)}
                className="mb-6"
              >
                🔊 Play Sound
              </Button>
            </>
          )}

          {type === 'pronunciation' && (
            <>
              <p className="text-slate-600 mb-4">Say this word out loud:</p>
              <h2 className="text-5xl font-bold text-primary-600 mb-6">
                {currentQuestion.word.word}
              </h2>
            </>
          )}

          {type === 'sentence' && (
            <>
              <p className="text-slate-600 mb-4">Fill in the blank:</p>
              <h2 className="text-xl font-medium text-slate-800 mb-6 leading-relaxed">
                {currentQuestion.sentence}
              </h2>
            </>
          )}

          {/* Answer Input */}
          {(type === 'spelling' || type === 'sentence') && !showResult && (
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
          {type === 'pronunciation' && !showResult && (
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
                  <div className="flex justify-center mb-2">
                    <div className={`w-20 h-20 ${currentAnimation}`}>
                      {currentCelebrationItem ? (
                        <AppImage
                          src={currentCelebrationItem.image}
                          alt={currentCelebrationItem.name}
                          className="w-full h-full object-contain drop-shadow-lg"
                        />
                      ) : (
                        <span className="text-5xl">🎉</span>
                      )}
                    </div>
                  </div>
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
                    The answer was: <strong>{currentQuestion.word.word}</strong>
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
            <Button variant="primary" fullWidth size="lg" onClick={nextQuestion}>
              {currentIndex + 1 >= questions.length ? 'See Results' : 'Next Question'} →
            </Button>
          </PageContainer>
        </div>
      )}
    </div>
  );
}
