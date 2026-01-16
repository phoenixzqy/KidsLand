# Claude Instructions for KidsLand

## Project Overview
KidsLand is a PWA for kids to learn English words through games and quizzes, built with React, TypeScript, Vite, and Tailwind CSS v4.

## Critical: Asset URL Handling

This project deploys to GitHub Pages at `https://phoenixzqy.github.io/KidsLand/`. The `BASE_URL` is `/KidsLand/` in production but `/` in development.

### Rule: NEVER use raw paths for public assets

When referencing any file in the `public/` folder (images, SVGs, sounds, etc.), you MUST use the provided utilities to avoid 404 errors in production.

### Available Utilities

#### 1. `AppImage` Component (for `<img>` tags)
```tsx
import { AppImage } from '../components/ui/AppImage';

// ✅ Correct
<AppImage src="/images/minecraft-renders/blocks/grass.png" alt="Grass" />

// ❌ Wrong - will 404 in production
<img src="/images/minecraft-renders/blocks/grass.png" alt="Grass" />
```

#### 2. `useNormalizedUrl` Hook (for background images in components)
```tsx
import { useNormalizedUrl } from '../hooks/useNormalizedUrl';

function HeroCard() {
  const bgUrl = useNormalizedUrl('/background/minecraft-style-bg.png');
  
  return (
    <div style={{ backgroundImage: `url(${bgUrl})` }}>
      Content
    </div>
  );
}
```

#### 3. `normalizeUrl` Function (for non-React contexts)
```tsx
import { normalizeUrl } from '../hooks/useNormalizedUrl';

// Use in style definitions, constants, or outside React components
const SKIN_STYLES = {
  'skin-btn-snow': {
    button: {
      backgroundImage: `url(${normalizeUrl('/images/skins/skin-snow-btn.svg')})`,
    }
  }
};
```

Note: The `ThemeContext.tsx` has a built-in `normalizeStyleUrls` helper that automatically normalizes `backgroundImage` URLs in skin styles, so skin definitions can use plain paths like `'url(/path/to/image.svg)'`.

### When to Use Each

| Scenario | Use This |
|----------|----------|
| Displaying an image with `<img>` | `AppImage` component |
| CSS `backgroundImage` in a component | `useNormalizedUrl` hook |
| Style objects defined outside components | `normalizeUrl` function |
| Skin styles in `ThemeContext.tsx` | Plain `url()` (auto-normalized) |

### File Locations
- `src/hooks/useNormalizedUrl.ts` - Hook and function exports
- `src/components/ui/AppImage.tsx` - Image component (also re-exports `getImageUrl` as alias for `normalizeUrl`)

## Tailwind CSS v4 Notes

This project uses Tailwind CSS v4 which has renamed some classes:
- Use `bg-linear-to-*` instead of `bg-gradient-to-*`
- Run `npm run fix:tailwind` to auto-fix deprecated class names

## Project Structure
- `public/` - Static assets (images, sounds, icons)
- `src/components/ui/` - Reusable UI components
- `src/hooks/` - Custom React hooks
- `src/contexts/` - React contexts (Theme, User)
- `src/pages/` - Page components
- `src/data/` - JSON data files (words, prizes)
