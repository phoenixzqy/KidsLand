import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// Register service worker for PWA
// vite-plugin-pwa handles this automatically, but we add a manual fallback
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Use the base path for the service worker
    const swPath = import.meta.env.BASE_URL + 'sw.js';
    navigator.serviceWorker.register(swPath).catch((error) => {
      console.log('Service worker registration failed:', error);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
