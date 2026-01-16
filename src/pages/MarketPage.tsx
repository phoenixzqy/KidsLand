import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StarCounter } from '../components/ui/StarCounter';
import { useUser } from '../contexts/UserContext';
import { getPrizes, getPrizesByType } from '../db/sync';
import { purchaseItem } from '../db/database';
import type { Prize, PrizeType, Rarity } from '../types';

export function MarketPage() {
  const navigate = useNavigate();
  const { stars, spendStars, isItemOwned, refreshData } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<PrizeType | 'all'>('all');
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [purchaseMessage, setPurchaseMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const allPrizes = getPrizes();

  const filteredPrizes =
    selectedCategory === 'all'
      ? allPrizes.filter((p) => p.cost > 0)
      : getPrizesByType(selectedCategory).filter((p) => p.cost > 0);

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
    } finally {
      setPurchasing(null);
      setTimeout(() => setPurchaseMessage(null), 3000);
    }
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
    { id: 'all', name: 'All', icon: '🛒' },
    { id: 'card', name: 'Cards', icon: '🎴' },
    { id: 'skin', name: 'Skins', icon: '🎨' }
  ];

  return (
    <div className="min-h-screen bg-bg-primary pb-6">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-bg-primary/95 backdrop-blur-sm p-4 border-b border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => navigate('/')} className="text-2xl">
            ←
          </button>
          <h1 className="text-xl font-bold text-slate-800">🛒 Market</h1>
          <StarCounter count={stars} size="md" showAnimation />
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
                className={`relative overflow-hidden ${owned ? 'opacity-75' : ''}`}
                padding="none"
              >
                {/* Rarity Banner */}
                {prize.rarity && (
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getRarityColor(
                      prize.rarity
                    )}`}
                  />
                )}

                {/* Prize Image/Placeholder */}
                <div
                  className={`h-28 flex items-center justify-center text-5xl bg-gradient-to-br ${
                    prize.type === 'card'
                      ? getRarityColor(prize.rarity)
                      : prize.type === 'skin'
                      ? 'from-pink-200 to-purple-200'
                      : 'from-amber-200 to-orange-200'
                  }`}
                >
                  {getTypeIcon(prize.type)}
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
                        onClick={() => handlePurchase(prize)}
                        disabled={!canAfford || isPurchasing}
                      >
                        {isPurchasing ? (
                          'Buying...'
                        ) : (
                          <>
                            {prize.cost} ⭐
                          </>
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
                className="mt-2"
                onClick={() => navigate('/quiz')}
              >
                Go to Quiz
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
