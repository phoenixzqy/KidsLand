/**
 * DeckSelector Component
 * Select a deck before starting a game
 */

import React, { useState } from 'react';
import type { Deck, CardDefinition } from '../../../types/cardGame';
import { analyzeDeck } from '../../../game/cardGame/utils/deckGenerator';

interface DeckSelectorProps {
  decks: Deck[];
  cardDefinitions: Map<string, CardDefinition>;
  onSelectDeck: (deck: Deck) => void;
  onBack: () => void;
  onCreateDeck: () => void;
  className?: string;
}

export const DeckSelector: React.FC<DeckSelectorProps> = ({
  decks,
  cardDefinitions,
  onSelectDeck,
  onBack,
  onCreateDeck,
  className = ''
}) => {
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(decks[0] || null);

  // Get deck analysis for selected deck
  const analysis = selectedDeck ? analyzeDeck(selectedDeck, cardDefinitions) : null;

  return (
    <div className={`flex flex-col items-center min-h-screen bg-gradient-to-b from-slate-900 via-indigo-900 to-slate-900 p-4 pb-8 overflow-y-auto ${className}`}>
      {/* Title */}
      <div className="text-center mb-6 pt-4">
        <h2 className="text-3xl font-bold text-white mb-2">Choose Your Deck</h2>
        <p className="text-slate-400">Select a deck to battle with</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl flex-1 min-h-0">
        {/* Deck list */}
        <div className="flex-1 bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700 min-h-0 flex flex-col">
          <h3 className="text-lg font-bold text-white mb-4">Your Decks</h3>

          {decks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-4">No decks yet!</p>
              <button
                onClick={onCreateDeck}
                className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors"
              >
                Create Your First Deck
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] md:max-h-[400px] overflow-y-auto flex-1">
              {decks.map((deck) => {
                const deckAnalysis = analyzeDeck(deck, cardDefinitions);
                const isSelected = selectedDeck?.id === deck.id;

                return (
                  <button
                    key={deck.id}
                    onClick={() => setSelectedDeck(deck)}
                    className={`
                      w-full p-4 rounded-lg text-left transition-all duration-200
                      ${isSelected
                        ? 'bg-indigo-600 ring-2 ring-indigo-400'
                        : 'bg-slate-700 hover:bg-slate-600'
                      }
                    `}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-white">{deck.name}</h4>
                        <p className="text-sm text-slate-300">
                          {deck.cardIds.length}/30 cards
                          {!deckAnalysis.isValid && (
                            <span className="text-red-400 ml-2">⚠️ Incomplete</span>
                          )}
                        </p>
                      </div>
                      <div className="text-right text-sm text-slate-400">
                        <div>Avg: {deckAnalysis.averageManaCost} mana</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Create new deck button */}
          {decks.length > 0 && (
            <button
              onClick={onCreateDeck}
              className="w-full mt-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
            >
              + Create New Deck
            </button>
          )}
        </div>

        {/* Deck preview */}
        {selectedDeck && analysis && (
          <div className="flex-1 bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">{selectedDeck.name}</h3>

            {/* Mana curve */}
            <div className="mb-4">
              <h4 className="text-sm text-slate-400 mb-2">Mana Curve</h4>
              <div className="flex items-end gap-1 h-24">
                {analysis.manaCurve.map((count, cost) => (
                  <div key={cost} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-blue-500 rounded-t"
                      style={{
                        height: `${(count / Math.max(...analysis.manaCurve, 1)) * 100}%`,
                        minHeight: count > 0 ? '4px' : '0'
                      }}
                    />
                    <span className="text-xs text-slate-500 mt-1">{cost}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-white">{analysis.cardCount}</div>
                <div className="text-xs text-slate-400">Total Cards</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-400">{analysis.averageManaCost}</div>
                <div className="text-xs text-slate-400">Avg Mana Cost</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-yellow-400">{analysis.totalAttack}</div>
                <div className="text-xs text-slate-400">Total Attack</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-red-400">{analysis.totalHealth}</div>
                <div className="text-xs text-slate-400">Total Health</div>
              </div>
            </div>

            {/* Rarity breakdown */}
            <div className="mb-4">
              <h4 className="text-sm text-slate-400 mb-2">Rarity</h4>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-slate-600 rounded text-xs text-slate-300">
                  Common: {analysis.rarityCount.common}
                </span>
                <span className="px-2 py-1 bg-blue-900 rounded text-xs text-blue-300">
                  Rare: {analysis.rarityCount.rare}
                </span>
                <span className="px-2 py-1 bg-purple-900 rounded text-xs text-purple-300">
                  Epic: {analysis.rarityCount.epic}
                </span>
                <span className="px-2 py-1 bg-yellow-900 rounded text-xs text-yellow-300">
                  Legend: {analysis.rarityCount.legendary}
                </span>
              </div>
            </div>

            {/* Select button */}
            <button
              onClick={() => analysis.isValid && onSelectDeck(selectedDeck)}
              disabled={!analysis.isValid}
              className={`
                w-full py-4 font-bold text-lg rounded-xl transition-all duration-200
                ${analysis.isValid
                  ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-lg shadow-green-500/30 hover:scale-105 active:scale-95'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {analysis.isValid ? '⚔️ Select & Play' : '⚠️ Deck Incomplete (30 cards required)'}
            </button>
          </div>
        )}
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        className="mt-6 px-6 py-2 text-slate-400 hover:text-white transition-colors"
      >
        ← Back to Menu
      </button>
    </div>
  );
};

export default DeckSelector;
