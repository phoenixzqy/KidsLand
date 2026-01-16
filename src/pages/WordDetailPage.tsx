import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StarCounter } from '../components/ui/StarCounter';
import { HeaderContainer, PageContainer } from '../components/ui/PageContainer';
import { useUser } from '../contexts/UserContext';
import { useSpeech } from '../hooks/useSpeech';
import { getWordById, getWords } from '../db/sync';
import { getRemainingQuizTypesForWord } from '../db/database';
import type { QuizType } from '../types';

// Quiz type display info
const QUIZ_TYPE_INFO: Record<QuizType, { name: string; icon: string }> = {
  spelling: { name: 'Spelling', icon: '✏️' },
  pronunciation: { name: 'Pronunciation', icon: '🎤' },
  sentence: { name: 'Sentence', icon: '📝' }
};

const ALL_QUIZ_TYPES: QuizType[] = ['spelling', 'pronunciation', 'sentence'];

export function WordDetailPage() {
  const { wordId } = useParams<{ wordId: string }>();
  const navigate = useNavigate();
  const { stars, getWordProgress } = useUser();
  const { speak, isSpeaking } = useSpeech();
  const [activeSentence, setActiveSentence] = useState<number | null>(null);
  const [remainingQuizTypes, setRemainingQuizTypes] = useState<QuizType[]>([]);

  const word = wordId ? getWordById(wordId) : undefined;
  const words = getWords();
  const progress = wordId ? getWordProgress(wordId) : undefined;

  // Load remaining quiz types
  useEffect(() => {
    const loadRemainingTypes = async () => {
      if (wordId) {
        const remaining = await getRemainingQuizTypesForWord(wordId);
        setRemainingQuizTypes(remaining);
      }
    };
    loadRemainingTypes();
  }, [wordId, progress]); // Re-check when progress changes

  if (!word) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <Card className="text-center p-8">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-xl font-bold mb-2">Word not found</h2>
          <Button onClick={() => navigate('/words')}>Go back to words</Button>
        </Card>
      </div>
    );
  }

  // Find previous and next words
  const currentIndex = words.findIndex(w => w.id === wordId);
  const prevWord = currentIndex > 0 ? words[currentIndex - 1] : null;
  const nextWord = currentIndex < words.length - 1 ? words[currentIndex + 1] : null;

  const handleSpeak = (text: string, sentenceIndex?: number) => {
    speak(text);
    if (sentenceIndex !== undefined) {
      setActiveSentence(sentenceIndex);
      // Reset after speech ends (approximate)
      setTimeout(() => setActiveSentence(null), text.length * 80);
    }
  };

  // Highlight the word in a sentence
  const highlightWord = (sentence: string, targetWord: string) => {
    const regex = new RegExp(`\\b(${targetWord})\\b`, 'gi');
    const parts = sentence.split(regex);

    return parts.map((part, index) => {
      if (part.toLowerCase() === targetWord.toLowerCase()) {
        return (
          <span key={index} className="bg-star/30 text-primary-700 font-bold px-1 rounded">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="min-h-screen bg-bg-primary pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-bg-primary/95 backdrop-blur-sm p-4 border-b border-slate-200">
        <HeaderContainer>
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate('/words')}
              className="text-2xl"
            >
              ←
            </button>
            <h1 className="text-lg font-bold text-slate-800">Word Detail</h1>
            <StarCounter count={stars} size="sm" />
          </div>
        </HeaderContainer>
      </header>

      <PageContainer className="p-4">
        {/* Main Word Card */}
        <Card className="text-center py-8 mb-6 bg-linear-to-br from-primary-50 to-primary-100">
          {/* Mastery status */}
          {progress?.mastered ? (
            <div className="flex justify-center items-center gap-2 mb-4">
              <span className="text-2xl">🎓</span>
              <span className="text-success font-bold">Mastered!</span>
            </div>
          ) : (
            /* Quiz type progress indicators */
            <div className="flex justify-center gap-2 mb-4">
              {ALL_QUIZ_TYPES.map((type) => {
                const info = QUIZ_TYPE_INFO[type];
                const passed = progress?.passedQuizTypes?.includes(type) || false;
                return (
                  <div
                    key={type}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
                      passed
                        ? 'bg-success/20 text-success'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                    title={`${info.name}: ${passed ? 'Passed' : 'Not passed'}`}
                  >
                    <span>{info.icon}</span>
                    {passed && <span>✓</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* The Word */}
          <h1 className="text-[4rem] font-bold text-primary-600 mb-4 leading-none">
            {word.word}
          </h1>

          {/* Speak Button */}
          <Button
            variant="primary"
            size="lg"
            onClick={() => handleSpeak(word.word)}
            disabled={isSpeaking}
            className="animate-pulse-glow"
          >
            {isSpeaking ? '🔊 Speaking...' : '🔊 Listen'}
          </Button>
        </Card>

        {/* Word Meaning Section */}
        {word.meaning && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">
              <span>💡</span> What it means
            </h2>
            <Card
              className="cursor-pointer transition-all hover:ring-2 hover:ring-primary-300"
              onClick={() => handleSpeak(word.meaning!)}
            >
              <div className="flex items-start gap-3">
                <button
                  className="mt-1 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpeak(word.meaning!);
                  }}
                >
                  🔊
                </button>
                <p className="text-slate-700 text-lg leading-relaxed flex-1">
                  {word.meaning}
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Sentences Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">
            <span>📝</span> Example Sentences
          </h2>

          <div className="space-y-3">
            {word.sentences.map((sentence, index) => (
              <Card
                key={index}
                className={`transition-all ${
                  activeSentence === index
                    ? 'ring-2 ring-primary-400 bg-primary-50'
                    : ''
                }`}
                onClick={() => handleSpeak(sentence.text, index)}
              >
                <div className="flex items-start gap-3">
                  <button
                    className="mt-1 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSpeak(sentence.text, index);
                    }}
                  >
                    🔊
                  </button>
                  <p className="text-slate-700 text-lg leading-relaxed flex-1">
                    {highlightWord(sentence.text, word.word)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Navigation between words */}
        <div className="flex gap-3">
          {prevWord ? (
            <Link to={`/words/${prevWord.id}`} className="flex-1">
              <Button variant="secondary" fullWidth>
                ← {prevWord.word}
              </Button>
            </Link>
          ) : (
            <div className="flex-1" />
          )}

          {nextWord ? (
            <Link to={`/words/${nextWord.id}`} className="flex-1">
              <Button variant="secondary" fullWidth>
                {nextWord.word} →
              </Button>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      </PageContainer>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-bg-primary/95 backdrop-blur-sm border-t border-slate-200">
        <PageContainer className="p-4">
          <div className="flex gap-3">
            <Link to="/words" className="flex-1">
              <Button variant="ghost" fullWidth>
                📚 All Words
              </Button>
            </Link>
            {progress?.mastered ? (
              <Link to={`/word-quiz/${wordId}?level=easy`} className="flex-1">
                <Button variant="secondary" fullWidth>
                  🔄 Practice Again
                </Button>
              </Link>
            ) : remainingQuizTypes.length === 0 ? (
              <Link to={`/word-quiz/${wordId}?level=easy`} className="flex-1">
                <Button variant="primary" fullWidth>
                  🎯 Start Quiz
                </Button>
              </Link>
            ) : (
              <Link to={`/word-quiz/${wordId}?level=easy`} className="flex-1">
                <Button variant="primary" fullWidth>
                  🎯 Quiz ({remainingQuizTypes.length} left)
                </Button>
              </Link>
            )}
          </div>
        </PageContainer>
      </div>
    </div>
  );
}
