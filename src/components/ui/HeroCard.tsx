import type { ReactNode } from 'react';
import { Card } from './Card';
import { AppImage } from './AppImage';
import { useNormalizedUrl } from '../../hooks/useNormalizedUrl';

interface HeroCardProps {
  /** Icon image source */
  iconSrc: string;
  /** Alt text for the icon */
  iconAlt: string;
  /** Main title text */
  title: string;
  /** Subtitle/description text */
  subtitle: string;
  /** Additional content to render below the subtitle */
  children?: ReactNode;
  /** Additional CSS classes for the card */
  className?: string;
  /** Icon size - defaults to 'md' */
  iconSize?: 'sm' | 'md' | 'lg';
}

const iconSizes = {
  sm: 'w-10 h-10',
  md: 'w-16 h-16',
  lg: 'w-20 h-20',
};

export function HeroCard({
  iconSrc,
  iconAlt,
  title,
  subtitle,
  children,
  className = '',
  iconSize = 'md',
}: HeroCardProps) {
  const bgUrl = useNormalizedUrl('/background/minecraft-style-bg.png');
  
  return (
    <Card className={`relative overflow-hidden ${className}`}>
      {/* Minecraft-style background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgUrl})` }}
      />
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-amber-50/30" />
      
      {/* Content */}
      <div className="relative text-center py-6 text-white">
        <div className="flex justify-center mb-3">
          <AppImage
            src={iconSrc}
            alt={iconAlt}
            className={`${iconSizes[iconSize]} object-contain drop-shadow-lg`}
          />
        </div>
        <h2 className="text-xl font-bold mb-1 drop-shadow-md">{title}</h2>
        <p className="text-primary-100 drop-shadow-sm">{subtitle}</p>
        {children}
      </div>
    </Card>
  );
}
