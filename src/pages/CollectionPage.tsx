import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StarCounter } from '../components/ui/StarCounter';
import { PrizePreviewModal } from '../components/ui/PrizePreviewModal';
import { ThemedBackground } from '../components/ui/ThemedBackground';
import { Avatar } from '../components/ui/Avatar';
import { AppImage } from '../components/ui/AppImage';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { getPrizeById } from '../db/sync';
import type { Prize, PrizeType, Rarity, SkinTarget, MobSubcategory } from '../types';

// Collection category types
type CollectionCategory = 'all' | 'mobs' | 'tools' | 'weapons' | 'skins';
type MobFilter = 'all' | MobSubcategory;

export function CollectionPage() {
  const navigate = useNavigate();
  const { stars, state, sellItem } = useUser();
  const { equipSkin, unequipSkin, equippedSkins, equipAvatar, unequipAvatar } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<CollectionCategory>('all');
  const [selectedMobFilter, setSelectedMobFilter] = useState<MobFilter>('all');
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);

  const ownedItems = state.ownedItems;

  // Filter items based on category and subcategory
  const filteredItems = useMemo(() => {
    let filtered = ownedItems;
    
    if (selectedCategory === 'all') {
      return filtered;
    } else if (selectedCategory === 'skins') {
      return filtered.filter(item => getPrizeById(item.prizeId)?.type === 'skin');
    } else if (selectedCategory === 'mobs') {
      filtered = filtered.filter(item => {
        const prize = getPrizeById(item.prizeId);
        return prize?.type === 'card' && prize?.category === 'mobs';
      });
      if (selectedMobFilter !== 'all') {
        filtered = filtered.filter(item => {
          const prize = getPrizeById(item.prizeId);
          return prize?.subcategory === selectedMobFilter;
        });
      }
      return filtered;
    } else if (selectedCategory === 'tools') {
      return filtered.filter(item => {
        const prize = getPrizeById(item.prizeId);
        return prize?.type === 'card' && prize?.category === 'tools';
      });
    } else if (selectedCategory === 'weapons') {
      return filtered.filter(item => {
        const prize = getPrizeById(item.prizeId);
        return prize?.type === 'card' && prize?.category === 'weapons';
      });
    }
    
    return filtered;
  }, [ownedItems, selectedCategory, selectedMobFilter]);

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

  const handleEquipAvatar = async (prizeId: string) => {
    if (equippedSkins.avatar === prizeId) {
      await unequipAvatar();
    } else {
      await equipAvatar(prizeId);
    }
  };

  const handleSell = async (prize: Prize) => {
    if (!prize.cost) return;

    const sellPrice = Math.floor(prize.cost * 0.75);

    // Unequip if it's currently equipped
    if (prize.type === 'skin' && prize.target && equippedSkins[prize.target] === prize.id) {
      await unequipSkin(prize.target);
    }
    if (prize.type === 'card' && equippedSkins.avatar === prize.id) {
      await unequipAvatar();
    }

    // Sell the item
    const sold = await sellItem(prize.id, sellPrice);
    if (sold) {
      setSelectedPrize(null);
    }
  };

  const getSellPrice = (prize: Prize): number => {
    return Math.floor((prize.cost || 0) * 0.75);
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

  const categories: { id: CollectionCategory; name: string; icon: string }[] = [
    { id: 'all', name: 'All', icon: '/images/minecraft-renders/blocks/minecraft-ender-chest.png' },
    { id: 'mobs', name: 'Mobs', icon: '/images/minecraft-renders/mobs/hostile/minecraft-creeper.png' },
    { id: 'tools', name: 'Tools', icon: '/images/minecraft-renders/tools/minecraft-diamond-pickaxe.png' },
    { id: 'weapons', name: 'Weapons', icon: '/images/minecraft-renders/weapons/minecraft-diamond-sword.png' },
    { id: 'skins', name: 'Skins', icon: '/images/minecraft-renders/special/minecraft-totem-of-undying.png' }
  ];

  const mobFilters: { id: MobFilter; name: string; icon: string }[] = [
    { id: 'all', name: 'All Mobs', icon: '/images/minecraft-renders/mobs/hostile/minecraft-creeper.png' },
    { id: 'bosses', name: 'Bosses', icon: '/images/minecraft-renders/mobs/bosses/minecraft-ender-dragon.png' },
    { id: 'hostile', name: 'Hostile', icon: '/images/minecraft-renders/mobs/hostile/minecraft-skeleton.png' },
    { id: 'neutral', name: 'Neutral', icon: '/images/minecraft-renders/mobs/neutral/minecraft-wolf.png' },
    { id: 'passive', name: 'Passive', icon: '/images/minecraft-renders/mobs/passive/minecraft-pig.png' },
    { id: 'villagers', name: 'Villagers', icon: '/images/minecraft-renders/mobs/villagers/minecraft-villager.png' }
  ];

  // Count items by category
  const getMobCount = () => ownedItems.filter(item => {
    const prize = getPrizeById(item.prizeId);
    return prize?.type === 'card' && prize?.category === 'mobs';
  }).length;
  
  const getToolCount = () => ownedItems.filter(item => {
    const prize = getPrizeById(item.prizeId);
    return prize?.type === 'card' && prize?.category === 'tools';
  }).length;
  
  const getWeaponCount = () => ownedItems.filter(item => {
    const prize = getPrizeById(item.prizeId);
    return prize?.type === 'card' && prize?.category === 'weapons';
  }).length;

  return (
    <ThemedBackground className="pb-6">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm p-4 border-b border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => navigate('/')} className="text-2xl">
            ←
          </button>
          <div className="flex items-center gap-3">
            <Avatar size="sm" />
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <AppImage src="/images/minecraft-renders/blocks/minecraft-ender-chest.png" alt="Collection" className="w-6 h-6 object-contain" />
              My Collection
            </h1>
          </div>
          <StarCounter count={stars} size="sm" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <Card className="text-center py-2" padding="sm">
            <div className="flex justify-center"><AppImage src="/images/minecraft-renders/mobs/hostile/minecraft-creeper.png" alt="Mobs" className="w-6 h-6 object-contain" /></div>
            <div className="font-bold text-slate-800 text-sm">{getMobCount()}</div>
            <div className="text-xs text-slate-500">Mobs</div>
          </Card>
          <Card className="text-center py-2" padding="sm">
            <div className="flex justify-center"><AppImage src="/images/minecraft-renders/tools/minecraft-diamond-pickaxe.png" alt="Tools" className="w-6 h-6 object-contain" /></div>
            <div className="font-bold text-slate-800 text-sm">{getToolCount()}</div>
            <div className="text-xs text-slate-500">Tools</div>
          </Card>
          <Card className="text-center py-2" padding="sm">
            <div className="flex justify-center"><AppImage src="/images/minecraft-renders/weapons/minecraft-diamond-sword.png" alt="Weapons" className="w-6 h-6 object-contain" /></div>
            <div className="font-bold text-slate-800 text-sm">{getWeaponCount()}</div>
            <div className="text-xs text-slate-500">Weapons</div>
          </Card>
          <Card className="text-center py-2" padding="sm">
            <div className="flex justify-center"><AppImage src="/images/minecraft-renders/special/minecraft-totem-of-undying.png" alt="Skins" className="w-6 h-6 object-contain" /></div>
            <div className="font-bold text-slate-800 text-sm">{ownedItems.filter(item => getPrizeById(item.prizeId)?.type === 'skin').length}</div>
            <div className="text-xs text-slate-500">Skins</div>
          </Card>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSelectedMobFilter('all');
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <AppImage src={cat.icon} alt={cat.name} className="w-5 h-5 object-contain shrink-0" />
              {cat.name}
            </button>
          ))}
        </div>

        {/* Mob Subcategory Filters */}
        {selectedCategory === 'mobs' && (
          <div className="flex gap-2 overflow-x-auto pb-2 mt-2 -mx-4 px-4">
            {mobFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedMobFilter(filter.id)}
                style={{ width: 'fit-content', minWidth: 'fit-content' }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  selectedMobFilter === filter.id
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                <AppImage src={filter.icon} alt={filter.name} className="w-4 h-4 object-contain shrink-0" />
                {filter.name}
              </button>
            ))}
            {/* Spacer to ensure last item is fully visible when scrolling */}
            <div className="shrink-0 w-1" />
          </div>
        )}
      </header>

      <div className="p-4">
        {/* Item Grid */}
        <div className="grid grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const prize = getPrizeById(item.prizeId);
            if (!prize) return null;

            const isSkin = prize.type === 'skin';
            const isCard = prize.type === 'card';
            const isSkinEquipped =
              isSkin && prize.target && equippedSkins[prize.target] === prize.id;
            const isAvatarEquipped = isCard && equippedSkins.avatar === prize.id;
            const isEquipped = isSkinEquipped || isAvatarEquipped;

            return (
              <Card
                key={item.id}
                className={`relative overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] flex flex-col ${
                  isEquipped ? 'ring-2 ring-primary-500' : ''
                }`}
                padding="none"
                onClick={() => handleCardClick(prize)}
              >
                {/* Rarity Banner */}
                {prize.rarity && (
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 bg-linear-to-r ${getRarityColor(
                      prize.rarity
                    )}`}
                  />
                )}

                {/* Equipped Badge */}
                {isEquipped && (
                  <div className="absolute top-2 right-2 bg-primary-500 text-white px-2 py-0.5 rounded-full text-xs font-bold z-10">
                    {isAvatarEquipped ? 'Avatar' : 'Equipped'}
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
                  <AppImage
                    src={prize.image}
                    alt={prize.name}
                    className="w-full h-full object-contain p-1"
                    fallback={<span className="text-5xl">{getTypeIcon(prize.type)}</span>}
                  />
                </div>

                {/* Prize Info - flex-grow to fill remaining space */}
                <div className="p-3 flex flex-col flex-grow">
                  <h3 className="font-bold text-sm text-slate-800 truncate">
                    {prize.name}
                  </h3>
                  <p className="text-xs text-slate-500 capitalize h-4">
                    {prize.rarity || '\u00A0'}
                  </p>

                  {/* Spacer to push button to bottom */}
                  <div className="flex-grow" />

                  {/* Equip Button - always shown for skins and cards */}
                  {isSkin && prize.target && (
                    <Button
                      variant={isSkinEquipped ? 'secondary' : 'primary'}
                      size="sm"
                      fullWidth
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEquip(prize.id, prize.target as SkinTarget);
                      }}
                    >
                      {isSkinEquipped ? 'Unequip' : 'Equip'}
                    </Button>
                  )}

                  {isCard && (
                    <Button
                      variant={isAvatarEquipped ? 'secondary' : 'primary'}
                      size="sm"
                      fullWidth
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEquipAvatar(prize.id);
                      }}
                    >
                      {isAvatarEquipped ? 'Remove' : 'Set Avatar'}
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
                : `No ${selectedCategory} in your collection`}
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
        onSell={selectedPrize ? () => handleSell(selectedPrize) : undefined}
        sellPrice={selectedPrize ? getSellPrice(selectedPrize) : undefined}
      />
    </ThemedBackground>
  );
}
