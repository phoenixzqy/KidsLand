import { useMemo } from 'react';

/**
 * Hook to normalize a URL path with the BASE_URL prefix.
 * Use this for any public asset paths that need to work in both
 * development and production environments.
 * 
 * @param path - The path relative to the public folder (e.g., '/images/hero.png')
 * @returns The normalized URL with BASE_URL prefix
 * 
 * @example
 * const bgUrl = useNormalizedUrl('/background/minecraft-style-bg.png');
 * // Returns '/background/minecraft-style-bg.png' in dev
 * // Returns '/KidsLand/background/minecraft-style-bg.png' in production
 */
export function useNormalizedUrl(path: string): string {
  return useMemo(() => {
    return normalizeUrl(path);
  }, [path]);
}

/**
 * Non-hook version for use outside of React components.
 * Normalizes a URL path with the BASE_URL prefix.
 * 
 * @param path - The path relative to the public folder
 * @returns The normalized URL with BASE_URL prefix
 */
export function normalizeUrl(path: string): string {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${baseUrl}${cleanPath}`;
}
