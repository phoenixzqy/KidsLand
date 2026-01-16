import { useEffect, useState } from 'react';

interface StarCounterProps {
  count: number;
  size?: 'sm' | 'md' | 'lg';
  showAnimation?: boolean;
  className?: string;
}

export function StarCounter({
  count,
  size = 'md',
  showAnimation = false,
  className = ''
}: StarCounterProps) {
  const [displayCount, setDisplayCount] = useState(count);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animate count changes
  useEffect(() => {
    if (count !== displayCount) {
      if (showAnimation && count > displayCount) {
        setIsAnimating(true);
        // Animate incrementally
        const diff = count - displayCount;
        const steps = Math.min(diff, 10);
        const stepSize = diff / steps;
        let current = displayCount;
        let step = 0;

        const interval = setInterval(() => {
          step++;
          current += stepSize;
          setDisplayCount(Math.round(current));

          if (step >= steps) {
            setDisplayCount(count);
            setIsAnimating(false);
            clearInterval(interval);
          }
        }, 50);

        return () => clearInterval(interval);
      } else {
        setDisplayCount(count);
      }
    }
  }, [count, displayCount, showAnimation]);

  // Size styles
  const sizeStyles = {
    sm: 'text-sm gap-1',
    md: 'text-lg gap-2',
    lg: 'text-2xl gap-2'
  };

  const iconSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl'
  };

  return (
    <div
      className={`inline-flex items-center ${sizeStyles[size]} ${className}`}
    >
      <span
        className={`${iconSizes[size]} ${isAnimating ? 'animate-bounce-star' : ''}`}
        role="img"
        aria-label="stars"
      >
        ⭐
      </span>
      <span className="font-bold text-star">{displayCount.toLocaleString()}</span>
    </div>
  );
}

// Individual star icon for ratings/rewards
interface StarIconProps {
  filled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function StarIcon({ filled = true, size = 'md', onClick }: StarIconProps) {
  const sizeStyles = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl'
  };

  return (
    <span
      className={`${sizeStyles[size]} ${onClick ? 'cursor-pointer' : ''} transition-transform hover:scale-110`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {filled ? '⭐' : '☆'}
    </span>
  );
}
