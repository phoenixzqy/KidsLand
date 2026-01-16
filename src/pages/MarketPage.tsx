import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StarCounter } from '../components/ui/StarCounter';
import { PrizePreviewModal } from '../components/ui/PrizePreviewModal';
import { ThemedBackground } from '../components/ui/ThemedBackground';
import { AppImage } from '../components/ui/AppImage';
import { useUser } from '../contexts/UserContext';
import { getPrizes } from '../db/sync';
import { purchaseItem } from '../db/database';
import type { Prize, PrizeType, Rarity, MobSubcategory } from '../types';

// Category types for the market
type MarketCategory = 'all' | 'mobs' | 'tools' | 'weapons' | 'skins';
type MobFilter = 'all' | MobSubcategory;

export function MarketPage() {
  const navigate = useNavigate();
  const { stars, spendStars, isItemOwned, refreshData } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory>('all');
  const [selectedMobFilter, setSelectedMobFilter] = useState<MobFilter>('all');
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [purchaseMessage, setPurchaseMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const allPrizes = getPrizes();

  // Filter prizes based on category and subcategory
  const filteredPrizes = useMemo(() => {
    let filtered = allPrizes.filter(p => p.cost > 0);
    
    if (selectedCategory === 'all') {
      // Show all purchasable items (cards and skins)
      filtered = filtered.filter(p => p.type === 'card' || p.type === 'skin');
    } else if (selectedCategory === 'skins') {
      filtered = filtered.filter(p => p.type === 'skin');
    } else if (selectedCategory === 'mobs') {
      filtered = filtered.filter(p => p.type === 'card' && p.category === 'mobs');
      if (selectedMobFilter !== 'all') {
        filtered = filtered.filter(p => p.subcategory === selectedMobFilter);
      }
    } else if (selectedCategory === 'tools') {
      filtered = filtered.filter(p => p.type === 'card' && p.category === 'tools');
    } else if (selectedCategory === 'weapons') {
      filtered = filtered.filter(p => p.type === 'card' && p.category === 'weapons');
    }
    
    // Sort by rarity (legendary first) then by cost
    const rarityOrder: Record<string, number> = {
      'legendary': 0,
      'epic': 1,
      'rare': 2,
      'common': 3,
    };
    
    return filtered.sort((a, b) => {
      const rarityA = rarityOrder[a.rarity || 'common'];
      const rarityB = rarityOrder[b.rarity || 'common'];
      if (rarityA !== rarityB) return rarityA - rarityB;
      return b.cost - a.cost;
    });
  }, [allPrizes, selectedCategory, selectedMobFilter]);

  const handlePurchase = async (prize: Prize) => {
    if (purchasing) return;
    if (isItemOwned(prize.id)) return;

    setPurchasing(prize.id);
    setPurchaseMessage(null);

    try {
      const success = await spendStars(prize.cost);

      if (success) {
        await purchaseItem(prize.id);
        refreshData();
        setSelectedPrize(null); // Close modal on success
        setPurchaseMessage({
          type: 'success',
          text: `You got ${prize.name}! 🎉`
        });
      } else {
        setPurchaseMessage({
          type: 'error',
          text: 'Not enough stars!'
        });
      }
    } catch (error) {
      setPurchaseMessage({
        type: 'error',
        text: 'Something went wrong'
      });
      console.error('Purchase error:', error);
    } finally {
      setPurchasing(null);
      setTimeout(() => setPurchaseMessage(null), 3000);
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

  const categories: { id: MarketCategory; name: string; icon: string }[] = [
    { id: 'all', name: 'All', icon: '/images/minecraft-renders/blocks/minecraft-chest.png' },
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

  return (
    <ThemedBackground className="pb-6">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm p-4 border-b border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => navigate('/')} className="text-2xl">
            ←
          </button>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <AppImage src="/images/minecraft-renders/blocks/minecraft-chest.png" alt="Market" className="w-6 h-6 object-contain" />
            Market
          </h1>
          <StarCounter count={stars} size="md" showAnimation />
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
                    ? 'bg-slate-400 text-white'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                <AppImage src={filter.icon} alt={filter.name} className="w-4 h-4 object-contain shrink-0" />
                {filter.name}
              </button>
            ))}
            <div className="shrink-0 w-1" />
          </div>
        )}
      </header>

      {/* Purchase Message */}
      {purchaseMessage && (
        <div
          className={`fixed top-20 left-4 right-4 p-4 rounded-xl z-50 text-center font-bold shadow-lg ${
            purchaseMessage.type === 'success'
              ? 'bg-success text-white'
              : 'bg-error text-white'
          }`}
        >
          {purchaseMessage.text}
        </div>
      )}

      <div className="p-4">
        {/* Prize Grid */}
        <div className="grid grid-cols-2 gap-4">
          {filteredPrizes.map((prize) => {
            const owned = isItemOwned(prize.id);
            const canAfford = stars >= prize.cost;
            const isPurchasing = purchasing === prize.id;

            return (
              <Card
                key={prize.id}
                className={`relative overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] ${owned ? 'opacity-75' : ''}`}
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

                {/* Prize Info */}
                <div className="p-3">
                  <h3 className="font-bold text-sm text-slate-800 truncate">
                    {prize.name}
                  </h3>
                  {prize.description && (
                    <p className="text-xs text-slate-500 truncate">
                      {prize.description}
                    </p>
                  )}

                  {/* Price/Buy Button */}
                  <div className="mt-2">
                    {owned ? (
                      <div className="text-center text-sm text-success font-bold py-2">
                        ✓ Owned
                      </div>
                    ) : (
                      <Button
                        variant={canAfford ? 'primary' : 'secondary'}
                        size="sm"
                        fullWidth
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePurchase(prize);
                        }}
                        disabled={!canAfford || isPurchasing}
                      >
                        {isPurchasing ? (
                          'Buying...'
                        ) : (
                          <span className="flex items-center justify-center gap-1">
                            {prize.cost}<AppImage src="/images/minecraft-renders/materials/minecraft-emerald.png" alt="emerald" className="w-4 h-4 inline-block" />
                          </span>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Owned Overlay */}
                {owned && (
                  <div className="absolute inset-0 bg-white/30 flex items-center justify-center">
                    <div className="bg-success text-white px-3 py-1 rounded-full text-sm font-bold">
                      Owned ✓
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredPrizes.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">🏪</div>
            <p className="text-slate-500">No items in this category</p>
          </div>
        )}

        {/* Earn More Stars Prompt */}
        {stars < 50 && (
          <Card className="mt-6 bg-primary-50 border border-primary-200">
            <div className="text-center py-2">
              <p className="text-primary-700 font-medium">
                Need more stars? Take a quiz! 🎯
              </p>
              <Button
                variant="primary"
                size="sm"
                className="mt-2 mx-auto"
                onClick={() => navigate('/quiz')}
              >
                Go to Quiz
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Prize Preview Modal */}
      <PrizePreviewModal
        prize={selectedPrize}
        isOpen={!!selectedPrize}
        onClose={() => setSelectedPrize(null)}
        isOwned={selectedPrize ? isItemOwned(selectedPrize.id) : false}
        onAction={selectedPrize && !isItemOwned(selectedPrize.id) ? () => handlePurchase(selectedPrize) : undefined}
        actionLabel={selectedPrize ? `Buy for ${selectedPrize.cost}` : undefined}
        actionDisabled={selectedPrize ? stars < selectedPrize.cost || purchasing === selectedPrize.id : false}
      />
    </ThemedBackground>
  );
}
