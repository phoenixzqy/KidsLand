import { type ReactNode } from 'react';
import { useTheme } from '../../contexts/useTheme';

interface ThemedBackgroundProps {
  children: ReactNode;
  className?: string;
}

/**
 * A wrapper component that applies the equipped background skin.
 * Use this as the main container for pages that should support background skins.
 */
export function ThemedBackground({ children, className = '' }: ThemedBackgroundProps) {
  const { getBackgroundStyle } = useTheme();
  const backgroundStyle = getBackgroundStyle();
  const hasBackgroundSkin = Object.keys(backgroundStyle).length > 0;

  // Base classes for the background
  const baseClasses = 'min-h-screen';
  
  // Default background if no skin
  const defaultBgClass = hasBackgroundSkin ? '' : 'bg-bg-primary';

  return (
    <div 
      className={`${baseClasses} ${defaultBgClass} ${className}`}
      style={hasBackgroundSkin ? backgroundStyle : undefined}
    >
      {children}
    </div>
  );
}

interface ThemedHeaderProps {
  children: ReactNode;
  className?: string;
}

/**
 * A header component that applies themed header styles when a background skin is equipped.
 */
export function ThemedHeader({ children, className = '' }: ThemedHeaderProps) {
  const { getHeaderStyle } = useTheme();
  const headerStyle = getHeaderStyle();
  const hasHeaderSkin = Object.keys(headerStyle).length > 0;

  return (
    <header 
      className={`${className}`}
      style={hasHeaderSkin ? { ...headerStyle, padding: '0.5rem', borderRadius: '0.75rem', marginBottom: '0.5rem' } : undefined}
    >
      {children}
    </header>
  );
}
