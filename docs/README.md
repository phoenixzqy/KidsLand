# KidsLand - Kids English Word Learning PWA

A fun, mobile-first Progressive Web App for kids to learn English high-frequency words through interactive learning and quizzes.

## Features

- 📚 **120 High-Frequency Words** - Essential vocabulary with example sentences
- 🔊 **Text-to-Speech** - Native browser speech for word pronunciation
- 🎯 **3 Quiz Types** - Spelling, Pronunciation (with mic), Sentence Fill-in
- ⭐ **Reward System** - Earn stars from quizzes (Easy: 1 star, Hard: 3 stars)
- 🛒 **Market** - Spend stars on cards, UI skins, and badges
- 🎨 **Customizable Themes** - Skinnable UI components
- 📱 **Mobile-First PWA** - Installable, works offline

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/phoenixzqy/KidsLand.git
cd KidsLand

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

## Documentation

- [Running the App](./RUNNING.md) - Development and production setup
- [Managing Market Items](./MARKET_ITEMS.md) - Add, update, delete prizes
- [Managing Words](./WORDS.md) - Add or modify word content
- [Deployment](./DEPLOYMENT.md) - GitHub Pages deployment guide

## Tech Stack

- **React 18** + TypeScript
- **Vite 7** - Fast build tool
- **Tailwind CSS v4** - Utility-first styling
- **Dexie.js** - IndexedDB wrapper
- **Web Speech API** - Text-to-speech & speech recognition
- **vite-plugin-pwa** - PWA support with Workbox

## License

MIT License - See [LICENSE](../LICENSE) file
