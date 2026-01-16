import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StarCounter } from '../components/ui/StarCounter';
import { PrizePreviewModal } from '../components/ui/PrizePreviewModal';
import { ThemedBackground } from '../components/ui/ThemedBackground';
import { Avatar } from '../components/ui/Avatar';
import { AppImage } from '../components/ui/AppImage';
import {
  CategoryTabs,
  MobFilters,
  PrizeCard,
  StatusBadge,
  COLLECTION_CATEGORIES,
  MOB_FILTERS,
  type ItemCategory,
  type MobFilter
} from '../components/market';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { getPrizeById } from '../db/sync';
import type { Prize, SkinTarget } from '../types';

export function CollectionPage() {
  const navigate = useNavigate();
  const { stars, state, sellItem } = useUser();
  const { equipSkin, unequipSkin, equippedSkins, equipAvatar, unequipAvatar } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('all');
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
      await unequipSkin(target);
    } else {
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

    const sold = await sellItem(prize.id, sellPrice);
    if (sold) {
      setSelectedPrize(null);
    }
  };

  const getSellPrice = (prize: Prize): number => {
    return Math.floor((prize.cost || 0) * 0.75);
  };

  const handleCategorySelect = (category: ItemCategory) => {
    setSelectedCategory(category);
    setSelectedMobFilter('all');
  };

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

  const getSkinCount = () => ownedItems.filter(item => 
    getPrizeById(item.prizeId)?.type === 'skin'
  ).length;

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
            <div className="font-bold text-slate-800 text-sm">{getSkinCount()}</div>
            <div className="text-xs text-slate-500">Skins</div>
          </Card>
        </div>

        <CategoryTabs
          categories={COLLECTION_CATEGORIES}
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
        />

        {selectedCategory === 'mobs' && (
          <MobFilters
            filters={MOB_FILTERS}
            selectedFilter={selectedMobFilter}
            onSelectFilter={setSelectedMobFilter}
            variant="dark"
          />
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
              <PrizeCard
                key={item.id}
                prize={prize}
                onClick={() => setSelectedPrize(prize)}
                isEquipped={isEquipped}
                badge={isEquipped ? (
                  <StatusBadge>
                    {isAvatarEquipped ? 'Avatar' : 'Equipped'}
                  </StatusBadge>
                ) : undefined}
                actionArea={
                  <>
                    {isSkin && prize.target && (
                      <Button
                        variant={isSkinEquipped ? 'secondary' : 'primary'}
                        size="sm"
                        fullWidth
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEquipAvatar(prize.id);
                        }}
                      >
                        {isAvatarEquipped ? 'Remove' : 'Set Avatar'}
                      </Button>
                    )}
                  </>
                }
              />
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
