import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StarCounter } from '../components/ui/StarCounter';
import { PrizePreviewModal } from '../components/ui/PrizePreviewModal';
import { ThemedBackground } from '../components/ui/ThemedBackground';
import { AppImage } from '../components/ui/AppImage';
import { HeaderContainer, PageContainer } from '../components/ui/PageContainer';
import {
  CategoryTabs,
  MobFilters,
  PrizeCard,
  OwnedOverlay,
  MARKET_CATEGORIES,
  MOB_FILTERS,
  type ItemCategory,
  type MobFilter
} from '../components/market';
import { useUser } from '../contexts/UserContext';
import { getPrizes } from '../db/sync';
import { purchaseItem } from '../db/database';
import type { Prize } from '../types';

export function MarketPage() {
  const navigate = useNavigate();
  const { stars, spendStars, isItemOwned, refreshData } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('all');
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
        setSelectedPrize(null);
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

  const handleCategorySelect = (category: ItemCategory) => {
    setSelectedCategory(category);
    setSelectedMobFilter('all');
  };

  return (
    <ThemedBackground className="pb-6">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm p-4 border-b border-slate-200">
        <HeaderContainer>
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

          <CategoryTabs
            categories={MARKET_CATEGORIES}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
          />

          {selectedCategory === 'mobs' && (
            <MobFilters
              filters={MOB_FILTERS}
              selectedFilter={selectedMobFilter}
              onSelectFilter={setSelectedMobFilter}
              variant="light"
            />
          )}
        </HeaderContainer>
      </header>

      {/* Purchase Message */}
      {purchaseMessage && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 max-w-md w-[calc(100%-2rem)] p-4 rounded-xl z-50 text-center font-bold shadow-lg ${
            purchaseMessage.type === 'success'
              ? 'bg-success text-white'
              : 'bg-error text-white'
          }`}
        >
          {purchaseMessage.text}
        </div>
      )}

      <PageContainer className="p-4">
        {/* Prize Grid - responsive columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPrizes.map((prize) => {
            const owned = isItemOwned(prize.id);
            const canAfford = stars >= prize.cost;
            const isPurchasing = purchasing === prize.id;

            return (
              <PrizeCard
                key={prize.id}
                prize={prize}
                onClick={() => setSelectedPrize(prize)}
                className={owned ? 'opacity-75' : ''}
                overlay={owned ? <OwnedOverlay /> : undefined}
                actionArea={
                  owned ? (
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
                  )
                }
              />
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
      </PageContainer>

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
