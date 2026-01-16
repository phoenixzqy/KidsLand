import { useEffect, useState } from 'react';
import { AppImage } from './AppImage';

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
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div
      className={`inline-flex items-center ${sizeStyles[size]} ${className}`}
    >
      <AppImage
        src="/images/minecraft-renders/materials/minecraft-emerald.png"
        alt="emeralds"
        className={`${iconSizes[size]} object-contain ${isAnimating ? 'animate-bounce-star' : ''}`}
        style={{ 
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
        }}
      />
      <span 
        className="font-bold text-star"
        style={{
          textShadow: '0 1px 3px rgba(0,0,0,0.4), 0 0 8px rgba(255,255,255,0.8)',
          WebkitTextStroke: '0.5px rgba(0,0,0,0.2)'
        }}
      >
        {displayCount.toLocaleString()}
      </span>
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
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-10 h-10'
  };

  return (
    <AppImage
      src="/images/minecraft-renders/materials/minecraft-emerald.png"
      alt="emerald"
      className={`${sizeStyles[size]} object-contain ${onClick ? 'cursor-pointer' : ''} transition-transform hover:scale-110`}
      onClick={onClick}
      style={{ opacity: filled ? 1 : 0.3 }}
    />
  );
}
