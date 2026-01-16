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
import { MarketPage } from './pages/MarketPage';
import { CollectionPage } from './pages/CollectionPage';
import { SettingsPage } from './pages/SettingsPage';

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
    <BrowserRouter>
      <UserProvider>
        <ThemeProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/words" element={<WordListPage />} />
            <Route path="/words/:wordId" element={<WordDetailPage />} />
            <Route path="/quiz" element={<QuizSelectPage />} />
            <Route path="/quiz/:type/:level" element={<QuizPage />} />
            <Route path="/market" element={<MarketPage />} />
            <Route path="/collection" element={<CollectionPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </ThemeProvider>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
