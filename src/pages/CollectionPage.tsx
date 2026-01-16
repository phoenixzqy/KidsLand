import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StarCounter } from '../components/ui/StarCounter';
import { PrizePreviewModal } from '../components/ui/PrizePreviewModal';
import { ThemedBackground } from '../components/ui/ThemedBackground';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { getPrizeById } from '../db/sync';
import type { Prize, PrizeType, Rarity, SkinTarget } from '../types';

export function CollectionPage() {
  const navigate = useNavigate();
  const { stars, state } = useUser();
  const { equipSkin, unequipSkin, equippedSkins } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<PrizeType | 'all'>('all');
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);

  const ownedItems = state.ownedItems;

  const filteredItems = ownedItems.filter((item) => {
    if (selectedCategory === 'all') return true;
    const prize = getPrizeById(item.prizeId);
    return prize?.type === selectedCategory;
  });

  const handleEquip = async (prizeId: string, target: SkinTarget) => {
    const prize = getPrizeById(prizeId);
    if (!prize || prize.type !== 'skin') return;

    if (equippedSkins[target] === prizeId) {
      // Unequip
      await unequipSkin(target);
    } else {
      // Equip
      await equipSkin(prizeId, target);
    }
  };

  const handleCardClick = (prize: Prize) => {
    setSelectedPrize(prize);
  };

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

  const getTypeIcon = (type: PrizeType): string => {
    switch (type) {
      case 'card':
        return '🎴';
      case 'skin':
        return '🎨';
      case 'badge':
        return '🏅';
      default:
        return '🎁';
    }
  };

  const categories: { id: PrizeType | 'all'; name: string; icon: string }[] = [
    { id: 'all', name: 'All', icon: '🎒' },
    { id: 'card', name: 'Cards', icon: '🎴' },
    { id: 'skin', name: 'Skins', icon: '🎨' },
    { id: 'badge', name: 'Badges', icon: '🏅' }
  ];

  // Count items by type
  const cardCount = ownedItems.filter(
    (item) => getPrizeById(item.prizeId)?.type === 'card'
  ).length;
  const skinCount = ownedItems.filter(
    (item) => getPrizeById(item.prizeId)?.type === 'skin'
  ).length;
  const badgeCount = ownedItems.filter(
    (item) => getPrizeById(item.prizeId)?.type === 'badge'
  ).length;

  return (
    <ThemedBackground className="pb-6">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm p-4 border-b border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => navigate('/')} className="text-2xl">
            ←
          </button>
          <h1 className="text-xl font-bold text-slate-800">🎒 My Collection</h1>
          <StarCounter count={stars} size="sm" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Card className="text-center py-2" padding="sm">
            <div className="text-xl">🎴</div>
            <div className="font-bold text-slate-800">{cardCount}</div>
            <div className="text-xs text-slate-500">Cards</div>
          </Card>
          <Card className="text-center py-2" padding="sm">
            <div className="text-xl">🎨</div>
            <div className="font-bold text-slate-800">{skinCount}</div>
            <div className="text-xs text-slate-500">Skins</div>
          </Card>
          <Card className="text-center py-2" padding="sm">
            <div className="text-xl">🏅</div>
            <div className="font-bold text-slate-800">{badgeCount}</div>
            <div className="text-xs text-slate-500">Badges</div>
          </Card>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4">
        {/* Item Grid */}
        <div className="grid grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const prize = getPrizeById(item.prizeId);
            if (!prize) return null;

            const isSkin = prize.type === 'skin';
            const isEquipped =
              isSkin && prize.target && equippedSkins[prize.target] === prize.id;

            return (
              <Card
                key={item.id}
                className={`relative overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] ${
                  isEquipped ? 'ring-2 ring-primary-500' : ''
                }`}
                padding="none"
                onClick={() => handleCardClick(prize)}
              >
                {/* Rarity Banner */}
                {prize.rarity && (
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getRarityColor(
                      prize.rarity
                    )}`}
                  />
                )}

                {/* Equipped Badge */}
                {isEquipped && (
                  <div className="absolute top-2 right-2 bg-primary-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                    Equipped
                  </div>
                )}

                {/* Prize Image */}
                <div
                  className={`h-32 flex items-center justify-center bg-gradient-to-br ${
                    prize.type === 'card'
                      ? getRarityColor(prize.rarity)
                      : prize.type === 'skin'
                      ? 'from-pink-200 to-purple-200'
                      : 'from-amber-200 to-orange-200'
                  }`}
                >
                  <img
                    src={`${import.meta.env.BASE_URL}${prize.image.startsWith('/') ? prize.image.slice(1) : prize.image}`}
                    alt={prize.name}
                    className="w-full h-full object-contain p-1"
                    onError={(e) => {
                      // Fallback to icon if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = `<span class="text-5xl">${getTypeIcon(prize.type)}</span>`;
                    }}
                  />
                </div>

                {/* Prize Info */}
                <div className="p-3">
                  <h3 className="font-bold text-sm text-slate-800 truncate">
                    {prize.name}
                  </h3>
                  {prize.rarity && (
                    <p className="text-xs text-slate-500 capitalize">
                      {prize.rarity}
                    </p>
                  )}

                  {/* Equip Button for skins */}
                  {isSkin && prize.target && (
                    <Button
                      variant={isEquipped ? 'secondary' : 'primary'}
                      size="sm"
                      fullWidth
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEquip(prize.id, prize.target as SkinTarget);
                      }}
                    >
                      {isEquipped ? 'Unequip' : 'Equip'}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">📦</div>
            <p className="text-slate-500 mb-4">
              {selectedCategory === 'all'
                ? 'Your collection is empty'
                : `No ${selectedCategory}s in your collection`}
            </p>
            <Button variant="primary" onClick={() => navigate('/market')}>
              Visit Market
            </Button>
          </div>
        )}
      </div>

      {/* Prize Preview Modal */}
      <PrizePreviewModal
        prize={selectedPrize}
        isOpen={!!selectedPrize}
        onClose={() => setSelectedPrize(null)}
        isOwned={true}
      />
    </ThemedBackground>
  );
}
