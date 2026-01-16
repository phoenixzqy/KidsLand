import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { getPrizeById } from '../db/sync';
import type { EquippedSkins, SkinTarget, Prize } from '../types';

// Default theme colors
const defaultTheme = {
  primary: '#6366f1',
  secondary: '#818cf8',
  accent: '#fbbf24',
  background: '#f8fafc'
};

interface ThemeContextType {
  equippedSkins: EquippedSkins;
  theme: typeof defaultTheme;
  getSkinStyle: (target: SkinTarget) => React.CSSProperties;
  getSkinForTarget: (target: SkinTarget) => Prize | null;
  equipSkin: (prizeId: string, target: SkinTarget) => Promise<void>;
  unequipSkin: (target: SkinTarget) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [equippedSkins, setEquippedSkins] = useState<EquippedSkins>({});

  // Live query for equipped items
  const equippedItems = useLiveQuery(
    () => db.ownedItems.filter(item => item.equipped).toArray()
  );

  // Update equipped skins when items change
  useEffect(() => {
    if (equippedItems) {
      const skins: EquippedSkins = {};
      for (const item of equippedItems) {
        const prize = getPrizeById(item.prizeId);
        if (prize?.type === 'skin' && prize.target) {
          skins[prize.target] = item.prizeId;
        }
      }
      setEquippedSkins(skins);
    }
  }, [equippedItems]);

  // Get CSS styles for a skin target
  const getSkinStyle = (target: SkinTarget): React.CSSProperties => {
    const prizeId = equippedSkins[target];
    if (!prizeId) return {};

    const prize = getPrizeById(prizeId);
    if (!prize) return {};

    // Return skin-specific styles based on the skin image/type
    // For now, we'll use CSS gradients as placeholders
    const skinStyles: Record<string, React.CSSProperties> = {
      'skin-rainbow': {
        background: 'linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3)',
        border: 'none'
      },
      'skin-space': {
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        border: 'none'
      },
      'skin-candy': {
        background: 'linear-gradient(135deg, #f093fb, #f5576c)',
        border: 'none'
      },
      'skin-ocean-bg': {
        background: 'linear-gradient(180deg, #667eea, #764ba2, #00c6fb)',
      },
      'skin-forest-bg': {
        background: 'linear-gradient(180deg, #56ab2f, #a8e063)',
      }
    };

    return skinStyles[prize.image] || {};
  };

  // Get the prize for a specific target
  const getSkinForTarget = (target: SkinTarget): Prize | null => {
    const prizeId = equippedSkins[target];
    if (!prizeId) return null;
    return getPrizeById(prizeId) || null;
  };

  // Equip a skin
  const equipSkin = async (prizeId: string, target: SkinTarget) => {
    // First, unequip any existing skin for this target
    const existingItems = await db.ownedItems.filter(item => item.equipped).toArray();
    for (const item of existingItems) {
      const prize = getPrizeById(item.prizeId);
      if (prize?.type === 'skin' && prize.target === target) {
        await db.ownedItems.update(item.id, { equipped: false });
      }
    }

    // Equip the new skin
    const newItem = await db.ownedItems.where('prizeId').equals(prizeId).first();
    if (newItem) {
      await db.ownedItems.update(newItem.id, { equipped: true });
    }
  };

  // Unequip a skin
  const unequipSkin = async (target: SkinTarget) => {
    const existingItems = await db.ownedItems.filter(item => item.equipped).toArray();
    for (const item of existingItems) {
      const prize = getPrizeById(item.prizeId);
      if (prize?.type === 'skin' && prize.target === target) {
        await db.ownedItems.update(item.id, { equipped: false });
      }
    }
  };

  const value: ThemeContextType = {
    equippedSkins,
    theme: defaultTheme,
    getSkinStyle,
    getSkinForTarget,
    equipSkin,
    unequipSkin
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
