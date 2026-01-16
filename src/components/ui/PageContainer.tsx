import type { ReactNode } from 'react';

interface PageContainerProps {
  /** The content to wrap */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Whether this is the main content area (adds padding) */
  variant?: 'full' | 'content';
}

/**
 * A responsive container component that centers content and constrains
 * max-width on larger screens for better readability and aesthetics.
 * 
 * Use this wrapper around page content to ensure consistent responsive behavior.
 * 
 * Breakpoints:
 * - Mobile: Full width with padding
 * - Tablet (md): Max-width 768px, centered
 * - Desktop (lg): Max-width 1024px, centered
 * - Wide (xl): Max-width 1280px, centered
 */
export function PageContainer({ 
  children, 
  className = '',
  variant = 'content'
}: PageContainerProps) {
  const baseClasses = 'w-full mx-auto';
  const maxWidthClasses = 'max-w-3xl lg:max-w-4xl xl:max-w-5xl';
  const paddingClasses = variant === 'content' ? 'px-4' : '';
  
  return (
    <div className={`${baseClasses} ${maxWidthClasses} ${paddingClasses} ${className}`}>
      {children}
    </div>
  );
}

/**
 * A responsive header container that matches PageContainer width constraints.
 * Use this for sticky headers to ensure proper alignment with content.
 */
export function HeaderContainer({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <div className={`w-full mx-auto max-w-3xl lg:max-w-4xl xl:max-w-5xl px-4 ${className}`}>
      {children}
    </div>
  );
}
