import React from 'react';

interface AppImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** 
   * The image path relative to the public folder.
   * Automatically handles BASE_URL prefix for proper deployment.
   */
  src: string;
  alt: string;
  /** Optional fallback content to display if image fails to load */
  fallback?: React.ReactNode;
}

/**
 * Unified image component that properly handles BASE_URL for all environments.
 * Use this instead of raw <img> tags for any images in the public folder.
 * 
 * @example
 * // Instead of:
 * <img src={`${import.meta.env.BASE_URL}${path.startsWith('/') ? path.slice(1) : path}`} />
 * 
 * // Use:
 * <AppImage src="/images/cards/hero.png" alt="Hero" />
 */
export function AppImage({ 
  src, 
  alt, 
  fallback,
  className,
  onError,
  ...props 
}: AppImageProps) {
  const [hasError, setHasError] = React.useState(false);

  // Normalize the image path with BASE_URL
  const normalizedSrc = React.useMemo(() => {
    const baseUrl = import.meta.env.BASE_URL || '/';
    // Remove leading slash from src if present, since BASE_URL typically ends with /
    const cleanPath = src.startsWith('/') ? src.slice(1) : src;
    return `${baseUrl}${cleanPath}`;
  }, [src]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true);
    onError?.(e);
  };

  // Reset error state when src changes
  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  if (hasError && fallback) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={normalizedSrc}
      alt={alt}
      className={className}
      onError={handleError}
      {...props}
    />
  );
}

/**
 * Helper function to get the normalized image URL.
 * Use this when you need the URL string directly (e.g., for background-image styles).
 */
export function getImageUrl(src: string): string {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const cleanPath = src.startsWith('/') ? src.slice(1) : src;
  return `${baseUrl}${cleanPath}`;
}
