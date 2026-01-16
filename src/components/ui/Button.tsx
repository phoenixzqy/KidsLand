import { type ReactNode, type ButtonHTMLAttributes } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  /** If true, skin styles will not be applied to this button */
  noSkin?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  noSkin = false,
  ...props
}: ButtonProps) {
  const { getSkinStyle } = useTheme();
  const skinStyle = noSkin ? {} : getSkinStyle('button');

  // Base styles - whitespace-nowrap prevents text wrapping
  const baseStyles = 'btn-touch font-bold transition-all duration-200 ease-out rounded-xl whitespace-nowrap';

  // Size variants
  const sizeStyles = {
    sm: 'px-3 py-2 text-xs min-h-[40px]',
    md: 'px-5 py-3 text-sm min-h-[48px]',
    lg: 'px-7 py-4 text-base min-h-[56px]'
  };

  // Color variants (only if no skin is applied)
  const variantStyles = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/30',
    secondary: 'bg-slate-200 hover:bg-slate-300 text-slate-700',
    success: 'bg-success hover:bg-green-600 text-white shadow-lg shadow-success/30',
    danger: 'bg-error hover:bg-red-600 text-white shadow-lg shadow-error/30',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-700'
  };

  // Disabled styles
  const disabledStyles = 'opacity-50 cursor-not-allowed';

  // Width styles
  const widthStyles = fullWidth ? 'w-full' : '';

  // Check if skin is applied
  const hasSkin = Object.keys(skinStyle).length > 0;

  // Combine styles - don't apply variant colors if skin is active
  const combinedClassName = [
    baseStyles,
    sizeStyles[size],
    !hasSkin && variantStyles[variant],
    disabled && disabledStyles,
    widthStyles,
    className
  ].filter(Boolean).join(' ');

  // Merge skin styles with any inline styles from props
  // Add text stroke for better readability on colorful backgrounds
  const mergedStyle: React.CSSProperties = hasSkin 
    ? { 
        ...skinStyle, 
        textShadow: '0 1px 2px rgba(0,0,0,0.5), 0 0 1px rgba(0,0,0,0.8)',
        WebkitTextStroke: '0.5px rgba(0,0,0,0.3)',
        ...props.style 
      }
    : props.style || {};

  return (
    <button
      className={combinedClassName}
      style={Object.keys(mergedStyle).length > 0 ? mergedStyle : undefined}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
    </button>
  );
}
