# 🎮 KidsLand

A fun, mobile-first Progressive Web App for kids to learn English high-frequency words through interactive learning and quizzes.

**Live App:** [https://phoenixzqy.github.io/kidsland](https://phoenixzqy.github.io/kidsland)

## ✨ Features

- 📚 **120 High-Frequency Words** - Essential vocabulary with example sentences
- 🔊 **Text-to-Speech** - Native browser speech for word pronunciation
- 🎯 **3 Quiz Types** - Spelling, Pronunciation (with mic), Sentence Fill-in
- ⭐ **Reward System** - Earn stars from quizzes (Easy: 1 star, Hard: 3 stars)
- 🛒 **Market** - Spend stars on cards, UI skins, and badges
- 🎨 **Customizable Themes** - Skinnable UI components
- 📱 **Mobile-First PWA** - Installable, works offline, fullscreen mode

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [Running the App](./docs/RUNNING.md) | Development and production setup |
| [Managing Market Items](./docs/MARKET_ITEMS.md) | Add, update, delete prizes |
| [Managing Words](./docs/WORDS.md) | Add or modify word content |
| [Deployment](./docs/DEPLOYMENT.md) | GitHub Pages deployment guide |

## 🛠 Tech Stack

- **React 18** + TypeScript
- **Vite 7** - Fast build tool
- **Tailwind CSS v4** - Utility-first styling
- **Dexie.js** - IndexedDB wrapper
- **Web Speech API** - Text-to-speech & speech recognition
- **vite-plugin-pwa** - PWA support with Workbox

## 📂 Project Structure

```
KidsLand/
├── src/
│   ├── data/         # Static JSON (words, prizes)
│   ├── db/           # IndexedDB setup
│   ├── contexts/     # React Context providers
│   ├── hooks/        # Custom React hooks
│   ├── components/   # Reusable UI components
│   ├── pages/        # Route pages
│   └── types/        # TypeScript types
├── docs/             # Documentation
├── public/           # Static assets
└── dist/             # Production build
```

## 🚢 Deployment

The app automatically deploys to GitHub Pages when pushing to the `main` branch.

- **URL:** https://phoenixzqy.github.io/kidsland
- **PWA:** Fullscreen, installable on mobile devices

## 📄 License

MIT License - See [LICENSE](./LICENSE) file
