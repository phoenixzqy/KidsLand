import type { ReactNode } from 'react';
import { Card } from '../ui/Card';
import { AppImage } from '../ui/AppImage';
import { getRarityColor, getTypeIcon } from './constants';
import type { Prize } from '../../types';

interface PrizeCardProps {
  prize: Prize;
  onClick?: () => void;
  /** Badge to show in top-right corner */
  badge?: ReactNode;
  /** Whether the card should show equipped styling (ring border) */
  isEquipped?: boolean;
  /** Overlay content (e.g., "Owned" badge) */
  overlay?: ReactNode;
  /** Action area content (buttons, price, etc.) */
  actionArea?: ReactNode;
  /** Additional class name */
  className?: string;
}

export function PrizeCard({
  prize,
  onClick,
  badge,
  isEquipped = false,
  overlay,
  actionArea,
  className = ''
}: PrizeCardProps) {
  return (
    <Card
      className={`relative overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] flex flex-col ${
        isEquipped ? 'ring-2 ring-primary-500' : ''
      } ${className}`}
      padding="none"
      onClick={onClick}
    >
      {/* Rarity Banner */}
      {prize.rarity && (
        <div
          className={`absolute top-0 left-0 right-0 h-1 bg-linear-to-r ${getRarityColor(prize.rarity)}`}
        />
      )}

      {/* Badge (top-right corner) */}
      {badge && (
        <div className="absolute top-2 right-2 z-10">
          {badge}
        </div>
      )}

      {/* Prize Image */}
      <div
        className={`h-32 flex items-center justify-center bg-linear-to-br ${
          prize.type === 'card'
            ? getRarityColor(prize.rarity)
            : prize.type === 'skin'
            ? 'from-pink-200 to-purple-200'
            : 'from-amber-200 to-orange-200'
        }`}
      >
        {/* Button skins show as button-shaped preview */}
        {prize.type === 'skin' && prize.target === 'button' ? (
          <div className="w-[85%] h-12 rounded-xl overflow-hidden shadow-md">
            <AppImage
              src={prize.image}
              alt={prize.name}
              className="w-full h-full object-cover"
              fallback={<span className="text-2xl">{getTypeIcon(prize.type)}</span>}
            />
          </div>
        ) : (
          <AppImage
            src={prize.image}
            alt={prize.name}
            className="w-full h-full object-contain p-1"
            fallback={<span className="text-5xl">{getTypeIcon(prize.type)}</span>}
          />
        )}
      </div>

      {/* Prize Info */}
      <div className="p-3 flex flex-col grow">
        <h3 className="font-bold text-sm text-slate-800 truncate">
          {prize.name}
        </h3>
        {prize.description && (
          <p className="text-xs text-slate-500 truncate">
            {prize.description}
          </p>
        )}

        {/* Spacer to push action area to bottom */}
        <div className="grow" />

        {/* Action Area */}
        {actionArea && (
          <div className="mt-2">
            {actionArea}
          </div>
        )}
      </div>

      {/* Overlay */}
      {overlay}
    </Card>
  );
}

/** Badge component for equipped/owned status */
export function StatusBadge({ 
  children, 
  variant = 'primary' 
}: { 
  children: ReactNode; 
  variant?: 'primary' | 'success';
}) {
  const bgClass = variant === 'success' ? 'bg-success' : 'bg-primary-500';
  return (
    <div className={`${bgClass} text-white px-2 py-0.5 rounded-full text-xs font-bold`}>
      {children}
    </div>
  );
}

/** Overlay for owned items */
export function OwnedOverlay() {
  return (
    <div className="absolute inset-0 bg-white/30 flex items-center justify-center">
      <div className="bg-success text-white px-3 py-1 rounded-full text-sm font-bold">
        Owned ✓
      </div>
    </div>
  );
}
