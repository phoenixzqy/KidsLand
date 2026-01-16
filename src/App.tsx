import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { syncDataIfNeeded } from './db/sync';
import { preloadVoices } from './hooks/useSpeech';

// Pages
import { HomePage } from './pages/HomePage';
import { WordListPage } from './pages/WordListPage';
import { WordDetailPage } from './pages/WordDetailPage';
import { QuizSelectPage } from './pages/QuizSelectPage';
import { QuizPage } from './pages/QuizPage';
import { WordQuizPage } from './pages/WordQuizPage';
import { MarketPage } from './pages/MarketPage';
import { CollectionPage } from './pages/CollectionPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { SettingsPage } from './pages/SettingsPage';
import { GamesPage } from './pages/GamesPage';
import { CardGamePage } from './pages/CardGamePage';
import { DeckBuilderPage } from './pages/DeckBuilderPage';

function App() {
  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Sync data from repo JSON to IndexedDB
        const syncResult = await syncDataIfNeeded();
        console.log('Data sync result:', syncResult);

        // Preload speech voices
        await preloadVoices();
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    initialize();
  }, []);

  return (
    <BrowserRouter basename="/kidsland">
      <UserProvider>
        <ThemeProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/words" element={<WordListPage />} />
            <Route path="/words/:wordId" element={<WordDetailPage />} />
            <Route path="/quiz" element={<QuizSelectPage />} />
            <Route path="/quiz/:type/:level" element={<QuizPage />} />
            <Route path="/word-quiz/:wordId" element={<WordQuizPage />} />
            <Route path="/market" element={<MarketPage />} />
            <Route path="/collection" element={<CollectionPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/games/card-battle" element={<CardGamePage />} />
            <Route path="/games/card-battle/decks" element={<DeckBuilderPage />} />
          </Routes>
        </ThemeProvider>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
