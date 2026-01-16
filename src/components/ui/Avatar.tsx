import { useTheme } from '../../contexts/ThemeContext';
import { AppImage } from './AppImage';

interface AvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

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

  const sizePixels = {
    sm: 40,
    md: 56,
    lg: 80
  };

  const baseStyles = `
    rounded-full overflow-hidden 
    flex items-center justify-center 
    bg-gradient-to-br from-primary-300 to-primary-500
    shadow-lg ring-2 ring-white/50
    transition-transform hover:scale-105
    ${onClick ? 'cursor-pointer' : ''}
  `;

  if (avatarCard) {
    return (
      <div 
        className={`${sizeStyles[size]} ${baseStyles} ${className}`}
        onClick={onClick}
        style={{ padding: 0 }}
      >
        <AppImage 
          src={avatarCard.image} 
          alt={avatarCard.name}
          className="w-full h-full object-cover"
          style={{
            width: sizePixels[size],
            height: sizePixels[size],
            objectFit: 'cover',
            objectPosition: 'center 30%', // Focus on upper part of card (usually the character)
          }}
        />
      </div>
    );
  }

  // Default avatar (no card equipped)
  return (
    <div 
      className={`${sizeStyles[size]} ${baseStyles} ${className}`}
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
