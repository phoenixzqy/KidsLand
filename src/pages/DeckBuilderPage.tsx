/**
 * DeckBuilderPage Component
 * Build and edit card decks for the card battle game
 */

import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getAllDecks, createDeck, updateDeck, deleteDeck } from '../db/database';
import { useUser } from '../contexts/UserContext';
import type { Deck, CardDefinition } from '../types/cardGame';
import type { Prize } from '../types';
import { GAME_CONSTANTS } from '../types/cardGame';
import { getCardDefinitions } from '../game/cardGame/data/cardDefinitions';
import { getOwnedCardDefinitions } from '../game/cardGame/utils/cardIntegration';
import { analyzeDeck } from '../game/cardGame/utils/deckGenerator';
import { ThemedBackground, ThemedHeader } from '../components/ui/ThemedBackground';
import { PageContainer } from '../components/ui/PageContainer';
import { StarCounter } from '../components/ui/StarCounter';
import { Card } from '../components/ui/Card';
import { AppImage } from '../components/ui/AppImage';
import prizesData from '../data/prizes.json';

// Cast prizes to proper type
const prizes = prizesData.prizes as Prize[];

type ViewMode = 'list' | 'edit';
type CardFilter = 'all' | 'common' | 'rare' | 'epic' | 'legendary';
type SortBy = 'cost' | 'name' | 'attack' | 'health' | 'rarity';

export function DeckBuilderPage() {
  const { stars } = useUser();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [deckName, setDeckName] = useState('');
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<CardFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('cost');
  const [searchQuery, setSearchQuery] = useState('');

  // Database queries
  const ownedItems = useLiveQuery(() => db.ownedItems.toArray()) || [];
  const decks = useLiveQuery(() => getAllDecks()) || [];

  // Get all card definitions
  const allCardDefinitions = useMemo(() => {
    return getCardDefinitions(prizes);
  }, []);

  const cardDefinitionsMap = useMemo(() => {
    return new Map(allCardDefinitions.map(c => [c.id, c]));
  }, [allCardDefinitions]);

  // Get owned card definitions
  const ownedCardDefinitions = useMemo(() => {
    return getOwnedCardDefinitions(ownedItems, prizes, allCardDefinitions);
  }, [ownedItems, allCardDefinitions]);

  // Filter and sort cards
  const filteredCards = useMemo(() => {
    let cards = [...ownedCardDefinitions];

    // Apply rarity filter
    if (filter !== 'all') {
      cards = cards.filter(c => c.rarity === filter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      cards = cards.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.keywords?.some(k => k.toLowerCase().includes(query))
      );
    }

    // Sort
    cards.sort((a, b) => {
      switch (sortBy) {
        case 'cost':
          return a.manaCost - b.manaCost;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'attack':
          return b.attack - a.attack;
        case 'health':
          return b.health - a.health;
        case 'rarity':
          const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3 };
          return rarityOrder[b.rarity] - rarityOrder[a.rarity];
        default:
          return 0;
      }
    });

    return cards;
  }, [ownedCardDefinitions, filter, sortBy, searchQuery]);

  // Count cards in deck
  const getCardCountInDeck = useCallback((cardId: string) => {
    return selectedCardIds.filter(id => id === cardId).length;
  }, [selectedCardIds]);

  // Check if can add card to deck
  const canAddCard = useCallback((card: CardDefinition) => {
    if (selectedCardIds.length >= GAME_CONSTANTS.DECK_SIZE) return false;
    const count = getCardCountInDeck(card.id);
    const maxCopies = card.rarity === 'legendary' ? 1 : 2;
    return count < maxCopies;
  }, [selectedCardIds, getCardCountInDeck]);

  // Add card to deck
  const addCardToDeck = useCallback((card: CardDefinition) => {
    if (!canAddCard(card)) return;
    setSelectedCardIds(prev => [...prev, card.id]);
  }, [canAddCard]);

  // Remove card from deck
  const removeCardFromDeck = useCallback((cardId: string) => {
    const idx = selectedCardIds.indexOf(cardId);
    if (idx !== -1) {
      setSelectedCardIds(prev => {
        const next = [...prev];
        next.splice(idx, 1);
        return next;
      });
    }
  }, [selectedCardIds]);

  // Start creating new deck
  const startNewDeck = useCallback(() => {
    setEditingDeck(null);
    setDeckName('New Deck');
    setSelectedCardIds([]);
    setViewMode('edit');
  }, []);

  // Start editing existing deck
  const startEditDeck = useCallback((deck: Deck) => {
    setEditingDeck(deck);
    setDeckName(deck.name);
    setSelectedCardIds([...deck.cardIds]);
    setViewMode('edit');
  }, []);

  // Save deck
  const saveDeck = useCallback(async () => {
    if (!deckName.trim()) return;
    if (selectedCardIds.length !== GAME_CONSTANTS.DECK_SIZE) return;

    try {
      if (editingDeck) {
        await updateDeck(editingDeck.id, deckName.trim(), selectedCardIds);
      } else {
        await createDeck(deckName.trim(), selectedCardIds);
      }
      setViewMode('list');
    } catch (error) {
      console.error('Failed to save deck:', error);
    }
  }, [deckName, selectedCardIds, editingDeck]);

  // Delete deck
  const handleDeleteDeck = useCallback(async (deckId: string) => {
    if (confirm('Are you sure you want to delete this deck?')) {
      await deleteDeck(deckId);
    }
  }, []);

  // Cancel editing
  const cancelEdit = useCallback(() => {
    setViewMode('list');
    setEditingDeck(null);
    setSelectedCardIds([]);
    setDeckName('');
  }, []);

  // Deck analysis for current selection
  const currentAnalysis = useMemo(() => {
    if (selectedCardIds.length === 0) return null;
    const tempDeck: Deck = {
      id: 'temp',
      name: deckName,
      cardIds: selectedCardIds,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    return analyzeDeck(tempDeck, cardDefinitionsMap);
  }, [selectedCardIds, deckName, cardDefinitionsMap]);

  // Group selected cards by card definition for display
  const deckCardGroups = useMemo(() => {
    const groups = new Map<string, { card: CardDefinition; count: number }>();
    for (const cardId of selectedCardIds) {
      const card = cardDefinitionsMap.get(cardId);
      if (card) {
        const existing = groups.get(cardId);
        if (existing) {
          existing.count++;
        } else {
          groups.set(cardId, { card, count: 1 });
        }
      }
    }
    return Array.from(groups.values()).sort((a, b) => a.card.manaCost - b.card.manaCost);
  }, [selectedCardIds, cardDefinitionsMap]);

  // Rarity colors
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-yellow-400 bg-yellow-900/30';
      case 'epic': return 'border-purple-400 bg-purple-900/30';
      case 'rare': return 'border-blue-400 bg-blue-900/30';
      default: return 'border-slate-400 bg-slate-700/30';
    }
  };

  const getRarityBadgeColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-yellow-500 text-black';
      case 'epic': return 'bg-purple-500 text-white';
      case 'rare': return 'bg-blue-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  // Render deck list view
  const renderDeckList = () => (
    <>
      <ThemedHeader className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/games/card-battle"
            className="text-2xl hover:scale-110 transition-transform"
          >
            <span className="text-slate-600">←</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-3xl">📚</span>
            <h1 className="text-xl font-bold text-primary-600">
              Deck Builder
            </h1>
          </div>
        </div>
        <StarCounter count={stars} size="md" showAnimation />
      </ThemedHeader>

      {/* Info card */}
      <Card className="mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="flex items-center gap-4">
          <span className="text-4xl">🃏</span>
          <div>
            <h2 className="text-lg font-bold">Build Your Decks</h2>
            <p className="text-sm text-white/80">
              Create {GAME_CONSTANTS.DECK_SIZE}-card decks from your collection
            </p>
          </div>
        </div>
      </Card>

      {/* Deck list */}
      <div className="space-y-4 mb-6">
        {decks.length === 0 ? (
          <Card className="text-center py-8">
            <span className="text-4xl mb-4 block">📭</span>
            <p className="text-slate-500 mb-4">No decks yet!</p>
            <p className="text-sm text-slate-400">
              Create your first deck to start battling
            </p>
          </Card>
        ) : (
          decks.map((deck) => {
            const analysis = analyzeDeck(deck, cardDefinitionsMap);
            return (
              <Card key={deck.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800">{deck.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                      <span>{deck.cardIds.length}/{GAME_CONSTANTS.DECK_SIZE} cards</span>
                      <span>Avg: {analysis.averageManaCost} mana</span>
                      {!analysis.isValid && (
                        <span className="text-red-500">Incomplete</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEditDeck(deck)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteDeck(deck.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Create new deck button */}
      <button
        onClick={startNewDeck}
        className="w-full py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold text-lg rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
      >
        + Create New Deck
      </button>

      {/* Card collection info */}
      <Card className="mt-6">
        <h3 className="font-bold text-slate-800 mb-2">Your Card Collection</h3>
        <p className="text-sm text-slate-500">
          You have <span className="font-bold text-indigo-600">{ownedCardDefinitions.length}</span> cards available for deck building
        </p>
        <div className="flex gap-2 mt-3 flex-wrap">
          {['common', 'rare', 'epic', 'legendary'].map(rarity => {
            const count = ownedCardDefinitions.filter(c => c.rarity === rarity).length;
            return (
              <span
                key={rarity}
                className={`px-2 py-1 text-xs font-medium rounded ${getRarityBadgeColor(rarity)}`}
              >
                {rarity}: {count}
              </span>
            );
          })}
        </div>
      </Card>
    </>
  );

  // Render deck editor view
  const renderDeckEditor = () => (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={cancelEdit}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ← Cancel
            </button>
            <input
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              className="bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none"
              placeholder="Deck name..."
            />
          </div>
          <div className="flex items-center gap-4">
            <span className={`font-bold ${selectedCardIds.length === GAME_CONSTANTS.DECK_SIZE ? 'text-green-400' : 'text-slate-400'}`}>
              {selectedCardIds.length}/{GAME_CONSTANTS.DECK_SIZE}
            </span>
            <button
              onClick={saveDeck}
              disabled={selectedCardIds.length !== GAME_CONSTANTS.DECK_SIZE || !deckName.trim()}
              className={`px-6 py-2 font-bold rounded-lg transition-colors ${
                selectedCardIds.length === GAME_CONSTANTS.DECK_SIZE && deckName.trim()
                  ? 'bg-green-600 hover:bg-green-500 text-white'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              Save Deck
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 p-4 max-w-7xl mx-auto">
        {/* Card collection (left side) */}
        <div className="flex-1 lg:w-2/3">
          {/* Filters */}
          <div className="bg-slate-800 rounded-xl p-4 mb-4">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cards..."
                className="flex-1 min-w-[200px] bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none"
              />

              {/* Rarity filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as CardFilter)}
                className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600"
              >
                <option value="all">All Rarities</option>
                <option value="common">Common</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600"
              >
                <option value="cost">Sort: Mana Cost</option>
                <option value="name">Sort: Name</option>
                <option value="attack">Sort: Attack</option>
                <option value="health">Sort: Health</option>
                <option value="rarity">Sort: Rarity</option>
              </select>
            </div>
          </div>

          {/* Card grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredCards.map((card) => {
              const countInDeck = getCardCountInDeck(card.id);
              const canAdd = canAddCard(card);
              const maxCopies = card.rarity === 'legendary' ? 1 : 2;

              return (
                <button
                  key={card.id}
                  onClick={() => addCardToDeck(card)}
                  disabled={!canAdd}
                  className={`
                    relative p-2 rounded-lg border-2 transition-all duration-200 text-left
                    ${getRarityColor(card.rarity)}
                    ${canAdd ? 'hover:scale-105 cursor-pointer' : 'opacity-50 cursor-not-allowed'}
                  `}
                >
                  {/* Card image */}
                  <div className="aspect-square rounded-lg overflow-hidden bg-slate-800 mb-2">
                    <AppImage
                      src={card.image}
                      alt={card.name}
                      className="w-full h-full object-contain p-2"
                    />
                  </div>

                  {/* Mana cost */}
                  <div className="absolute top-1 left-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {card.manaCost}
                  </div>

                  {/* Count in deck */}
                  {countInDeck > 0 && (
                    <div className="absolute top-1 right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {countInDeck}
                    </div>
                  )}

                  {/* Card info */}
                  <div className="text-xs">
                    <div className="font-bold text-white truncate">{card.name}</div>
                    <div className="flex justify-between text-slate-300">
                      <span>⚔️{card.attack}</span>
                      <span>❤️{card.health}</span>
                    </div>
                  </div>

                  {/* Max indicator */}
                  {countInDeck >= maxCopies && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">MAX</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {filteredCards.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <span className="text-4xl mb-4 block">🔍</span>
              <p>No cards match your search</p>
            </div>
          )}
        </div>

        {/* Deck panel (right side) */}
        <div className="lg:w-1/3 lg:max-w-sm">
          <div className="bg-slate-800 rounded-xl p-4 sticky top-24">
            <h3 className="text-lg font-bold text-white mb-4">
              {deckName || 'New Deck'} ({selectedCardIds.length}/{GAME_CONSTANTS.DECK_SIZE})
            </h3>

            {/* Mana curve */}
            {currentAnalysis && (
              <div className="mb-4">
                <h4 className="text-xs text-slate-400 mb-2">Mana Curve</h4>
                <div className="flex items-end gap-1 h-16">
                  {currentAnalysis.manaCurve.map((count, cost) => (
                    <div key={cost} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-blue-500 rounded-t transition-all"
                        style={{
                          height: `${(count / Math.max(...currentAnalysis.manaCurve, 1)) * 100}%`,
                          minHeight: count > 0 ? '4px' : '0'
                        }}
                      />
                      <span className="text-xs text-slate-500 mt-1">{cost}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deck cards list */}
            <div className="max-h-[400px] overflow-y-auto space-y-1">
              {deckCardGroups.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">
                  Click cards on the left to add them to your deck
                </p>
              ) : (
                deckCardGroups.map(({ card, count }) => (
                  <button
                    key={card.id}
                    onClick={() => removeCardFromDeck(card.id)}
                    className={`
                      w-full flex items-center gap-2 p-2 rounded-lg border
                      ${getRarityColor(card.rarity)}
                      hover:bg-red-900/30 transition-colors
                    `}
                  >
                    {/* Mana */}
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {card.manaCost}
                    </div>

                    {/* Name */}
                    <span className="flex-1 text-white text-sm truncate text-left">
                      {card.name}
                    </span>

                    {/* Count */}
                    {count > 1 && (
                      <span className="text-yellow-400 font-bold text-sm">×{count}</span>
                    )}

                    {/* Remove hint */}
                    <span className="text-red-400 text-xs">✕</span>
                  </button>
                ))
              )}
            </div>

            {/* Stats */}
            {currentAnalysis && selectedCardIds.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-slate-400">Avg Cost:</div>
                  <div className="text-white font-bold">{currentAnalysis.averageManaCost}</div>
                  <div className="text-slate-400">Total Attack:</div>
                  <div className="text-yellow-400 font-bold">{currentAnalysis.totalAttack}</div>
                  <div className="text-slate-400">Total Health:</div>
                  <div className="text-red-400 font-bold">{currentAnalysis.totalHealth}</div>
                </div>
              </div>
            )}

            {/* Clear button */}
            {selectedCardIds.length > 0 && (
              <button
                onClick={() => setSelectedCardIds([])}
                className="w-full mt-4 py-2 text-red-400 hover:text-red-300 text-sm transition-colors"
              >
                Clear All Cards
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (viewMode === 'edit') {
    return renderDeckEditor();
  }

  return (
    <ThemedBackground className="p-4 min-h-screen">
      <PageContainer>
        {renderDeckList()}
      </PageContainer>
    </ThemedBackground>
  );
}

export default DeckBuilderPage;
