import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { initDevTools } from './utils/devTools';
import { registerSW } from 'virtual:pwa-register';

// Initialize dev tools (only in development mode)
initDevTools();

// Register service worker with auto-update
const updateSW = registerSW({
  // Check for updates immediately when the page loads
  immediate: true,
  onNeedRefresh() {
    // New content is available, show update notification
    // For now, auto-refresh. You could show a prompt instead.
    console.log('New content available, updating...');
    updateSW(true); // Pass true to force update
  },
  onOfflineReady() {
    console.log('App is ready for offline use');
  },
  onRegisteredSW(swUrl, registration) {
    console.log('Service worker registered:', swUrl);
    // Check for updates every hour
    if (registration) {
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // 1 hour
    }
  },
  onRegisterError(error) {
    console.error('Service worker registration failed:', error);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
