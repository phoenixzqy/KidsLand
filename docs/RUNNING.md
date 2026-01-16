# Running the App

This guide covers how to run KidsLand in development and production environments.

## Development Mode

### Prerequisites

1. **Node.js 18+** - [Download here](https://nodejs.org/)
2. **npm 9+** - Comes with Node.js

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
```

The app will start at `http://localhost:5173` with hot module replacement (HMR).

### Development Features

- **Hot Reload** - Changes appear instantly without refresh
- **TypeScript Checking** - Run `npm run lint` for type errors
- **PWA Disabled** - Service worker is not active in dev mode

## Production Build

### Build the App

```bash
npm run build
```

This creates optimized files in the `dist/` folder:
- Minified JavaScript bundles
- Optimized CSS
- PWA service worker
- Web manifest

### Preview Production Build

```bash
npm run preview
```

This starts a local server at `http://localhost:4173` to test the production build.

## Project Structure

```
KidsLand/
├── src/
│   ├── data/           # Static JSON data (words, prizes)
│   ├── db/             # IndexedDB setup and sync
│   ├── contexts/       # React Context providers
│   ├── hooks/          # Custom React hooks
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route page components
│   └── types/          # TypeScript type definitions
├── public/             # Static assets (icons, sounds)
├── docs/               # Documentation
└── dist/               # Production build output
```

## Environment Variables

Currently, no environment variables are required. All configuration is in:
- `vite.config.ts` - Build and PWA configuration
- `src/data/` - Application data

## Troubleshooting

### "Module not found" errors

```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors

```bash
npm run lint
```

### PWA not updating

1. Open DevTools → Application → Service Workers
2. Click "Unregister" on the service worker
3. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### Speech API not working

- Ensure you're using HTTPS or localhost
- Check browser permissions for microphone
- Speech recognition requires Chrome, Edge, or Safari
