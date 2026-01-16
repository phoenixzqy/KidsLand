import { useTheme } from '../../contexts/ThemeContext';
import { AppImage } from './AppImage';
import type { Rarity } from '../../types';

interface AvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

// Get gradient colors based on rarity
const getRarityGradient = (rarity?: Rarity): string => {
  switch (rarity) {
    case 'legendary':
      return 'from-yellow-400 to-orange-500';
    case 'epic':
      return 'from-purple-400 to-purple-600';
    case 'rare':
      return 'from-blue-400 to-blue-600';
    case 'common':
    default:
      return 'from-slate-300 to-slate-400';
  }
};

/**
 * Avatar component that displays the equipped card as a profile picture.
 * Falls back to a default emoji avatar if no card is equipped.
 */
export function Avatar({ size = 'md', className = '', onClick }: AvatarProps) {
  const { getEquippedAvatar } = useTheme();
  const avatarCard = getEquippedAvatar();

  // Size configurations
  const sizeStyles = {
    sm: 'w-10 h-10 text-lg',
    md: 'w-14 h-14 text-2xl',
    lg: 'w-20 h-20 text-4xl'
  };

  const getBaseStyles = (rarityGradient: string) => `
    rounded-xl overflow-hidden 
    flex items-center justify-center 
    bg-gradient-to-br ${rarityGradient}
    shadow-lg ring-2 ring-white/50
    transition-transform hover:scale-105
    ${onClick ? 'cursor-pointer' : ''}
  `;

  if (avatarCard) {
    const rarityGradient = getRarityGradient(avatarCard.rarity);
    return (
      <div 
        className={`${sizeStyles[size]} ${getBaseStyles(rarityGradient)} ${className}`}
        onClick={onClick}
        style={{ padding: '4px' }}
      >
        <AppImage 
          src={avatarCard.image} 
          alt={avatarCard.name}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  // Default avatar (no card equipped)
  return (
    <div 
      className={`${sizeStyles[size]} ${getBaseStyles('from-primary-300 to-primary-500')} ${className}`}
      onClick={onClick}
    >
      <span>👤</span>
    </div>
  );
}

interface AvatarWithBadgeProps extends AvatarProps {
  badge?: React.ReactNode;
  badgePosition?: 'top-right' | 'bottom-right';
}

/**
 * Avatar with optional badge overlay (e.g., for showing equipped status or level)
 */
export function AvatarWithBadge({ 
  badge, 
  badgePosition = 'bottom-right',
  ...props 
}: AvatarWithBadgeProps) {
  const positionStyles = {
    'top-right': '-top-1 -right-1',
    'bottom-right': '-bottom-1 -right-1'
  };

  return (
    <div className="relative inline-block">
      <Avatar {...props} />
      {badge && (
        <div className={`absolute ${positionStyles[badgePosition]}`}>
          {badge}
        </div>
      )}
    </div>
  );
}
