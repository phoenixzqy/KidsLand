import { type ReactNode, type ButtonHTMLAttributes } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
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
  ...props
}: ButtonProps) {
  const { getSkinStyle } = useTheme();
  const skinStyle = getSkinStyle('button');

  // Base styles
  const baseStyles = 'btn-touch font-bold transition-all duration-200 ease-out';

  // Size variants
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm min-h-[40px]',
    md: 'px-6 py-3 text-base min-h-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[56px]'
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

  // Combine styles
  const hasSkin = Object.keys(skinStyle).length > 0;
  const combinedClassName = [
    baseStyles,
    sizeStyles[size],
    !hasSkin && variantStyles[variant],
    disabled && disabledStyles,
    widthStyles,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={combinedClassName}
      style={hasSkin ? { ...skinStyle, color: '#fff' } : undefined}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
    </button>
  );
}
