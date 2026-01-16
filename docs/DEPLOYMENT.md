# Deployment Guide

This guide covers deploying KidsLand to GitHub Pages.

## Overview

KidsLand is deployed to GitHub Pages at:
```
https://phoenixzqy.github.io/kidsland
```

## Automatic Deployment

The app automatically deploys when you push to the `main` branch via GitHub Actions.

### How It Works

1. Push to `main` branch
2. GitHub Actions runs the workflow
3. App is built with Vite
4. Built files are deployed to GitHub Pages
5. App is live at the URL above

## Manual Deployment

### Prerequisites

1. Repository access with push permissions
2. GitHub Pages enabled in repository settings
3. `KIDSLAND_PAGES_DEPLOYMENT_SECRET` secret configured

### Steps

```bash
# 1. Build the app
npm run build

# 2. The dist/ folder contains deployable files
# GitHub Actions handles the rest automatically
```

## GitHub Actions Workflow

The deployment workflow is located at:
```
.github/workflows/deploy.yml
```

### Workflow Triggers

- **Push to main**: Automatic deployment
- **Manual trigger**: Via GitHub Actions UI

## Configuration

### Base Path

The app is configured to run at `/kidsland/` path:

**vite.config.ts**
```typescript
export default defineConfig({
  base: '/kidsland/',
  // ...
})
```

### PWA Configuration

The PWA manifest is configured for the correct URL:

```json
{
  "start_url": "/kidsland/",
  "scope": "/kidsland/",
  "display": "fullscreen"
}
```

## Troubleshooting

### App shows 404 on GitHub Pages

1. Check that `base: '/kidsland/'` is set in `vite.config.ts`
2. Ensure the workflow completed successfully
3. Wait a few minutes for GitHub Pages to update

### PWA not installing

1. Must be served over HTTPS (GitHub Pages does this)
2. Check manifest is accessible at `/kidsland/manifest.webmanifest`
3. Verify service worker is registered

### Old version still showing

1. Open DevTools → Application → Service Workers
2. Click "Unregister"
3. Clear site data
4. Hard refresh (Cmd+Shift+R)

### Workflow fails

1. Check GitHub Actions logs for errors
2. Verify `KIDSLAND_PAGES_DEPLOYMENT_SECRET` is set correctly
3. Ensure Node.js version matches (18+)

## Secrets Configuration

### Setting up the deployment secret

1. Go to repository Settings → Secrets and variables → Actions
2. Add new secret: `KIDSLAND_PAGES_DEPLOYMENT_SECRET`
3. Value: Your GitHub token with `repo` and `pages` permissions

## Local Testing of Production Build

Before deploying, test the production build locally:

```bash
# Build the app
npm run build

# Preview with correct base path
npm run preview
```

Visit `http://localhost:4173/kidsland/` to test.

## Rollback

If a deployment breaks the site:

1. Go to GitHub Actions
2. Find the last successful workflow run
3. Click "Re-run all jobs"

Or revert the commit:
```bash
git revert HEAD
git push
```

## Environment-Specific Builds

### Development
```bash
npm run dev
# Runs at http://localhost:5173/
```

### Production (GitHub Pages)
```bash
npm run build
# Built for https://phoenixzqy.github.io/kidsland/
```
