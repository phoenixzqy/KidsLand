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

/**
 * Skin style definitions
 * These define the actual CSS styles for each skin, based on the SVG designs
 * but without the extra decorations (text, labels, etc.)
 */
const SKIN_STYLES: Record<string, {
  button?: React.CSSProperties;
  background?: React.CSSProperties;
  header?: React.CSSProperties;
}> = {
  // Rainbow Button - Colorful gradient
  'skin-btn-rainbow': {
    button: {
      background: 'linear-gradient(90deg, #ff0000, #ff8000, #ffff00, #00ff00, #0080ff, #8000ff, #ff0080)',
      border: '2px solid rgba(255,255,255,0.5)',
      boxShadow: '0 4px 15px rgba(255,100,100,0.4)',
      color: '#ffffff',
      textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
    }
  },
  // Space Button - Cosmic purple galaxy
  'skin-btn-space': {
    button: {
      background: 'linear-gradient(135deg, #1a0a2e 0%, #4a1a6e 50%, #2a0a4e 100%)',
      border: '2px solid rgba(155,89,182,0.6)',
      boxShadow: '0 4px 20px rgba(74,26,110,0.5), inset 0 0 20px rgba(155,89,182,0.2)',
      color: '#e8daef',
    }
  },
  // Candy Button - Sweet pink
  'skin-btn-candy': {
    button: {
      background: 'linear-gradient(90deg, #ff69b4 0%, #ff8dc7 50%, #ff69b4 100%)',
      border: '3px solid rgba(255,255,255,0.6)',
      boxShadow: '0 4px 15px rgba(255,105,180,0.4)',
      color: '#ffffff',
    }
  },
  // Ocean Background - Calm blue ocean
  'skin-bg-ocean': {
    background: {
      background: 'linear-gradient(180deg, #87ceeb 0%, #4a9fd4 50%, #1a5a8a 100%)',
    },
    header: {
      background: 'linear-gradient(180deg, rgba(135,206,235,0.9) 0%, rgba(74,159,212,0.8) 100%)',
      backdropFilter: 'blur(10px)',
    }
  },
  // Forest Background - Green forest
  'skin-bg-forest': {
    background: {
      background: 'linear-gradient(180deg, #87ceeb 0%, #a8d8a8 30%, #2d5a30 100%)',
    },
    header: {
      background: 'linear-gradient(180deg, rgba(168,216,168,0.9) 0%, rgba(45,90,48,0.8) 100%)',
      backdropFilter: 'blur(10px)',
    }
  },
  // Desert Background - Warm golden sand
  'skin-bg-desert': {
    background: {
      background: 'linear-gradient(180deg, #87ceeb 0%, #f4d03f 40%, #e67e22 70%, #d35400 100%)',
    },
    header: {
      background: 'linear-gradient(180deg, rgba(244,208,63,0.9) 0%, rgba(230,126,34,0.8) 100%)',
      backdropFilter: 'blur(10px)',
    }
  },
  // Sky Background - Bright sunny sky
  'skin-bg-sky': {
    background: {
      background: 'linear-gradient(180deg, #1e90ff 0%, #87ceeb 40%, #b0e0e6 70%, #ffffff 100%)',
    },
    header: {
      background: 'linear-gradient(180deg, rgba(30,144,255,0.9) 0%, rgba(135,206,235,0.8) 100%)',
      backdropFilter: 'blur(10px)',
    }
  },
  // Snow Background - Winter wonderland
  'skin-bg-snow': {
    background: {
      background: 'linear-gradient(180deg, #a8d8ea 0%, #e8f4f8 30%, #ffffff 60%, #d4e5f7 100%)',
    },
    header: {
      background: 'linear-gradient(180deg, rgba(168,216,234,0.9) 0%, rgba(232,244,248,0.8) 100%)',
      backdropFilter: 'blur(10px)',
    }
  },
  // Desert Button - Warm sandy gradient
  'skin-btn-desert': {
    button: {
      background: 'linear-gradient(135deg, #f4d03f 0%, #e67e22 50%, #d35400 100%)',
      border: '2px solid rgba(255,255,255,0.5)',
      boxShadow: '0 4px 15px rgba(230,126,34,0.4)',
      color: '#ffffff',
    }
  },
  // Ocean Button - Deep blue ocean
  'skin-btn-ocean': {
    button: {
      background: 'linear-gradient(135deg, #1a5a8a 0%, #2980b9 50%, #3498db 100%)',
      border: '2px solid rgba(255,255,255,0.4)',
      boxShadow: '0 4px 15px rgba(41,128,185,0.5)',
      color: '#ffffff',
    }
  },
  // Sky Button - Bright sky blue
  'skin-btn-sky': {
    button: {
      background: 'linear-gradient(135deg, #87ceeb 0%, #1e90ff 50%, #4169e1 100%)',
      border: '2px solid rgba(255,255,255,0.5)',
      boxShadow: '0 4px 15px rgba(30,144,255,0.4)',
      color: '#ffffff',
    }
  },
  // Snow Button - Frosty white
  'skin-btn-snow': {
    button: {
      background: 'linear-gradient(135deg, #ffffff 0%, #e8f4f8 30%, #a8d8ea 100%)',
      border: '2px solid rgba(168,216,234,0.8)',
      boxShadow: '0 4px 15px rgba(168,216,234,0.5)',
      color: '#2c3e50',
    }
  }
};

interface ThemeContextType {
  equippedSkins: EquippedSkins;
  theme: typeof defaultTheme;
  getSkinStyle: (target: SkinTarget) => React.CSSProperties;
  getSkinForTarget: (target: SkinTarget) => Prize | null;
  getBackgroundStyle: () => React.CSSProperties;
  getHeaderStyle: () => React.CSSProperties;
  getEquippedAvatar: () => Prize | null;
  equipSkin: (prizeId: string, target: SkinTarget) => Promise<void>;
  unequipSkin: (target: SkinTarget) => Promise<void>;
  equipAvatar: (prizeId: string) => Promise<void>;
  unequipAvatar: () => Promise<void>;
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
        // Handle cards equipped as avatar
        if (prize?.type === 'card') {
          skins.avatar = item.prizeId;
        }
      }
      setEquippedSkins(skins);
    }
  }, [equippedItems]);

  // Get CSS styles for a skin target (button, card, etc.)
  const getSkinStyle = (target: SkinTarget): React.CSSProperties => {
    const prizeId = equippedSkins[target];
    if (!prizeId) return {};

    const skinDef = SKIN_STYLES[prizeId];
    if (!skinDef) return {};

    // Return the appropriate style based on target
    if (target === 'button' && skinDef.button) {
      return skinDef.button;
    }
    if (target === 'background' && skinDef.background) {
      return skinDef.background;
    }
    if (target === 'header' && skinDef.header) {
      return skinDef.header;
    }

    return {};
  };

  // Get background style specifically
  const getBackgroundStyle = (): React.CSSProperties => {
    const prizeId = equippedSkins['background'];
    if (!prizeId) return {};

    const skinDef = SKIN_STYLES[prizeId];
    return skinDef?.background || {};
  };

  // Get header style specifically
  const getHeaderStyle = (): React.CSSProperties => {
    const prizeId = equippedSkins['background'];
    if (!prizeId) return {};

    const skinDef = SKIN_STYLES[prizeId];
    return skinDef?.header || {};
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

  // Get the equipped avatar card
  const getEquippedAvatar = (): Prize | null => {
    const prizeId = equippedSkins.avatar;
    if (!prizeId) return null;
    return getPrizeById(prizeId) || null;
  };

  // Equip a card as avatar
  const equipAvatar = async (prizeId: string) => {
    const prize = getPrizeById(prizeId);
    if (!prize || prize.type !== 'card') return;

    // First, unequip any existing avatar
    const existingItems = await db.ownedItems.filter(item => item.equipped).toArray();
    for (const item of existingItems) {
      const itemPrize = getPrizeById(item.prizeId);
      if (itemPrize?.type === 'card') {
        await db.ownedItems.update(item.id, { equipped: false });
      }
    }

    // Equip the new avatar
    const newItem = await db.ownedItems.where('prizeId').equals(prizeId).first();
    if (newItem) {
      await db.ownedItems.update(newItem.id, { equipped: true });
    }
  };

  // Unequip avatar
  const unequipAvatar = async () => {
    const existingItems = await db.ownedItems.filter(item => item.equipped).toArray();
    for (const item of existingItems) {
      const prize = getPrizeById(item.prizeId);
      if (prize?.type === 'card') {
        await db.ownedItems.update(item.id, { equipped: false });
      }
    }
  };

  const value: ThemeContextType = {
    equippedSkins,
    theme: defaultTheme,
    getSkinStyle,
    getSkinForTarget,
    getBackgroundStyle,
    getHeaderStyle,
    getEquippedAvatar,
    equipSkin,
    unequipSkin,
    equipAvatar,
    unequipAvatar
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
