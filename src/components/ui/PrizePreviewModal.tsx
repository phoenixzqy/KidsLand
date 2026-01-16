import { useEffect } from 'react';
import { Button } from './Button';
import { AppImage } from './AppImage';
import type { Prize, Rarity } from '../../types';

interface PrizePreviewModalProps {
  prize: Prize | null;
  isOpen: boolean;
  onClose: () => void;
  onAction?: () => void;
  actionLabel?: string;
  actionDisabled?: boolean;
  isOwned?: boolean;
}

export function PrizePreviewModal({
  prize,
  isOpen,
  onClose,
  onAction,
  actionLabel,
  actionDisabled,
  isOwned
}: PrizePreviewModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !prize) return null;

  const getRarityColor = (rarity?: Rarity): string => {
    switch (rarity) {
      case 'legendary':
        return 'from-yellow-400 to-orange-500';
      case 'epic':
        return 'from-purple-400 to-purple-600';
      case 'rare':
        return 'from-blue-400 to-blue-600';
      default:
        return 'from-slate-300 to-slate-400';
    }
  };

  const getRarityLabel = (rarity?: Rarity): string => {
    switch (rarity) {
      case 'legendary':
        return '⭐ Legendary';
      case 'epic':
        return '💎 Epic';
      case 'rare':
        return '💠 Rare';
      default:
        return '○ Common';
    }
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'card':
        return '🎴 Card';
      case 'skin':
        return '🎨 Skin';
      case 'badge':
        return '🏅 Badge';
      default:
        return type;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-black/30 hover:bg-black/50 rounded-full text-white text-xl transition-colors"
        >
          ×
        </button>

        {/* Rarity Banner */}
        {prize.rarity && (
          <div
            className={`h-2 bg-gradient-to-r ${getRarityColor(prize.rarity)}`}
          />
        )}

        {/* Large Image */}
        <div
          className={`relative h-72 flex items-center justify-center bg-gradient-to-br ${
            prize.type === 'card'
              ? getRarityColor(prize.rarity)
              : prize.type === 'skin'
              ? 'from-pink-100 to-purple-100'
              : 'from-amber-100 to-orange-100'
          }`}
        >
          <AppImage
            src={prize.image}
            alt={prize.name}
            className="w-full h-full object-contain p-2"
          />

          {/* Owned badge */}
          {isOwned && (
            <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
              ✓ Owned
            </div>
          )}
        </div>

        {/* Prize Info */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-xl font-bold text-slate-800">{prize.name}</h2>
            {prize.rarity && (
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full bg-gradient-to-r ${getRarityColor(
                  prize.rarity
                )} text-white`}
              >
                {prize.rarity.charAt(0).toUpperCase() + prize.rarity.slice(1)}
              </span>
            )}
          </div>

          {prize.description && (
            <p className="text-slate-600 mb-3">{prize.description}</p>
          )}

          <div className="flex items-center gap-3 text-sm text-slate-500 mb-4">
            <span>{getTypeLabel(prize.type)}</span>
            {prize.rarity && (
              <>
                <span>•</span>
                <span>{getRarityLabel(prize.rarity)}</span>
              </>
            )}
            {prize.collection && (
              <>
                <span>•</span>
                <span className="capitalize">{prize.collection}</span>
              </>
            )}
          </div>

          {/* Action Button */}
          {onAction && actionLabel && !isOwned && (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={onAction}
              disabled={actionDisabled}
            >
              {actionLabel}
            </Button>
          )}

          {isOwned && !onAction && (
            <div className="text-center py-2 text-green-600 font-semibold">
              You own this item! 🎉
            </div>
          )}

          {onAction && actionLabel && isOwned && (
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={onAction}
              disabled={actionDisabled}
            >
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
