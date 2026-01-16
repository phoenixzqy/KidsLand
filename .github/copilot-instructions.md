# GitHub Copilot Instructions for KidsLand

## Asset URL Handling (IMPORTANT - Avoid 404 Errors!)

This project is deployed to GitHub Pages with a subpath (`/KidsLand/`). All public asset URLs must be properly normalized to work in both development and production.

### ❌ NEVER do this:
```tsx
// Direct paths will cause 404 in production!
<img src="/images/hero.png" />
style={{ backgroundImage: 'url(/images/bg.svg)' }}
```

### ✅ ALWAYS use these utilities:

#### For React Components - Use `AppImage`:
```tsx
import { AppImage } from '../components/ui/AppImage';

<AppImage src="/images/hero.png" alt="Hero" />
```

#### For Background Images in Components - Use `useNormalizedUrl`:
```tsx
import { useNormalizedUrl } from '../hooks/useNormalizedUrl';

function MyComponent() {
  const bgUrl = useNormalizedUrl('/background/image.png');
  return <div style={{ backgroundImage: `url(${bgUrl})` }} />;
}
```

#### For Non-React Code (e.g., style definitions) - Use `normalizeUrl`:
```tsx
import { normalizeUrl } from '../hooks/useNormalizedUrl';

// In style objects or outside components
const style = {
  backgroundImage: `url(${normalizeUrl('/images/skin.svg')})`,
};
```

### File Locations:
- `src/hooks/useNormalizedUrl.ts` - Contains both `useNormalizedUrl` hook and `normalizeUrl` function
- `src/components/ui/AppImage.tsx` - Image component with automatic URL normalization

### How It Works:
The utilities prepend `import.meta.env.BASE_URL` to paths:
- Development: `/images/hero.png` → `/images/hero.png`
- Production: `/images/hero.png` → `/KidsLand/images/hero.png`
