import type { ReactNode } from 'react';
import { useTheme } from '../../contexts/useTheme';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  className = '',
  onClick,
  variant = 'default',
  padding = 'md'
}: CardProps) {
  const { getSkinStyle } = useTheme();
  const skinStyle = getSkinStyle('card');

  // Base styles
  const baseStyles = 'rounded-[var(--radius-kid)] transition-all duration-200';

  // Variant styles
  const variantStyles = {
    default: 'bg-white shadow-lg shadow-slate-200/50',
    elevated: 'bg-white shadow-xl shadow-slate-300/50',
    outlined: 'bg-white border-2 border-slate-200'
  };

  // Padding styles
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  // Clickable styles
  const clickableStyles = onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : '';

  // Combine styles
  const hasSkin = Object.keys(skinStyle).length > 0;
  const combinedClassName = [
    baseStyles,
    !hasSkin && variantStyles[variant],
    paddingStyles[padding],
    clickableStyles,
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={combinedClassName}
      style={hasSkin ? skinStyle : undefined}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
