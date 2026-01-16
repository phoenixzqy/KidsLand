import React, { useMemo, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { getPrizeById } from '../db/sync';
import { normalizeUrl } from '../hooks/useNormalizedUrl';
import { ThemeContext, type EquippedSkins, type ThemeContextType } from './ThemeContextType';
import type { SkinTarget, Prize } from '../types';

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
  // Rainbow Button - Colorful gradient with SVG
  'skin-btn-rainbow': {
    button: {
      backgroundImage: 'url(/images/skins/skin-rainbow-btn.svg)',
      backgroundSize: '100% 100%',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      border: 'none',
      boxShadow: '0 3px 12px rgba(255,100,100,0.4)',
      color: '#ffffff',
      borderRadius: '14px',
    }
  },
  // Space Button - Cosmic purple galaxy with SVG
  'skin-btn-space': {
    button: {
      backgroundImage: 'url(/images/skins/skin-space-btn.svg)',
      backgroundSize: '100% 100%',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      border: 'none',
      boxShadow: '0 3px 15px rgba(74,26,110,0.5)',
      color: '#e8daef',
      borderRadius: '14px',
    }
  },
  // Candy Button - Sweet pink with SVG
  'skin-btn-candy': {
    button: {
      backgroundImage: 'url(/images/skins/skin-candy-btn.svg)',
      backgroundSize: '100% 100%',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      border: 'none',
      boxShadow: '0 3px 12px rgba(255,105,180,0.4)',
      color: '#ffffff',
      borderRadius: '14px',
    }
  },
  // Ocean Background - Calm blue ocean with SVG
  'skin-bg-ocean': {
    background: {
      backgroundImage: 'url(/images/skins/skin-ocean-bg-full.svg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      backgroundRepeat: 'no-repeat',
      backgroundColor: '#1a5a8a',
    },
    header: {
      background: 'linear-gradient(180deg, rgba(135,206,235,0.85) 0%, rgba(74,159,212,0.75) 100%)',
      backdropFilter: 'blur(10px)',
    }
  },
  // Forest Background - Green forest with SVG
  'skin-bg-forest': {
    background: {
      backgroundImage: 'url(/images/skins/skin-forest-bg-full.svg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      backgroundRepeat: 'no-repeat',
      backgroundColor: '#2d5a30',
    },
    header: {
      background: 'linear-gradient(180deg, rgba(168,216,168,0.85) 0%, rgba(45,90,48,0.75) 100%)',
      backdropFilter: 'blur(10px)',
    }
  },
  // Space Background - Cosmic galaxy with SVG
  'skin-bg-space': {
    background: {
      backgroundImage: 'url(/images/skins/skin-space-bg-full.svg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      backgroundRepeat: 'no-repeat',
      backgroundColor: '#1a0a2e',
    },
    header: {
      background: 'linear-gradient(180deg, rgba(26,10,46,0.9) 0%, rgba(74,26,110,0.8) 100%)',
      backdropFilter: 'blur(10px)',
    }
  },
  // Desert Background - Warm golden sand with SVG
  'skin-bg-desert': {
    background: {
      backgroundImage: 'url(/images/skins/skin-desert-bg-full.svg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      backgroundRepeat: 'no-repeat',
      backgroundColor: '#d35400',
    },
    header: {
      background: 'linear-gradient(180deg, rgba(244,208,63,0.85) 0%, rgba(230,126,34,0.75) 100%)',
      backdropFilter: 'blur(10px)',
    }
  },
  // Sky Background - Bright sunny sky with SVG
  'skin-bg-sky': {
    background: {
      backgroundImage: 'url(/images/skins/skin-sky-bg-full.svg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      backgroundRepeat: 'no-repeat',
      backgroundColor: '#87ceeb',
    },
    header: {
      background: 'linear-gradient(180deg, rgba(30,144,255,0.85) 0%, rgba(135,206,235,0.75) 100%)',
      backdropFilter: 'blur(10px)',
    }
  },
  // Snow Background - Winter wonderland with SVG
  'skin-bg-snow': {
    background: {
      backgroundImage: 'url(/images/skins/skin-snow-bg-full.svg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      backgroundRepeat: 'no-repeat',
      backgroundColor: '#a8d8ea',
    },
    header: {
      background: 'linear-gradient(180deg, rgba(135,206,235,0.85) 0%, rgba(168,216,234,0.75) 100%)',
      backdropFilter: 'blur(10px)',
    }
  },
  // Desert Button - Warm sandy with SVG
  'skin-btn-desert': {
    button: {
      backgroundImage: 'url(/images/skins/skin-desert-btn.svg)',
      backgroundSize: '100% 100%',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      border: 'none',
      boxShadow: '0 3px 12px rgba(230,126,34,0.4)',
      color: '#ffffff',
      borderRadius: '14px',
    }
  },
  // Ocean Button - Deep blue ocean with SVG
  'skin-btn-ocean': {
    button: {
      backgroundImage: 'url(/images/skins/skin-ocean-btn.svg)',
      backgroundSize: '100% 100%',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      border: 'none',
      boxShadow: '0 3px 12px rgba(41,128,185,0.5)',
      color: '#ffffff',
      borderRadius: '14px',
    }
  },
  // Sky Button - Bright sky blue with SVG
  'skin-btn-sky': {
    button: {
      backgroundImage: 'url(/images/skins/skin-sky-btn.svg)',
      backgroundSize: '100% 100%',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      border: 'none',
      boxShadow: '0 3px 12px rgba(30,144,255,0.4)',
      color: '#ffffff',
      borderRadius: '14px',
    }
  },
  // Snow Button - Frosty white with SVG background
  'skin-btn-snow': {
    button: {
      backgroundImage: 'url(/images/skins/skin-snow-btn.svg)',
      backgroundSize: '100% 100%',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      border: 'none',
      boxShadow: '0 3px 12px rgba(168,216,234,0.5)',
      color: '#2c3e50',
      borderRadius: '14px',
    }
  }
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Live query for equipped items
  const equippedItems = useLiveQuery(
    () => db.ownedItems.filter(item => item.equipped).toArray()
  );

  // Compute equipped skins from items
  const equippedSkins = useMemo(() => {
    if (!equippedItems) return {} as EquippedSkins;
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
    return skins;
  }, [equippedItems]);

  // Helper to normalize backgroundImage URLs in styles
  const normalizeStyleUrls = (style: React.CSSProperties): React.CSSProperties => {
    if (!style.backgroundImage) return style;
    
    // Extract URL from backgroundImage property like 'url(/path/to/image.svg)'
    const urlMatch = style.backgroundImage.match(/url\(['"]?([^'"()]+)['"]?\)/);
    if (urlMatch && urlMatch[1]) {
      const normalizedPath = normalizeUrl(urlMatch[1]);
      return {
        ...style,
        backgroundImage: `url(${normalizedPath})`,
      };
    }
    return style;
  };

  // Get CSS styles for a skin target (button, card, etc.)
  const getSkinStyle = (target: SkinTarget): React.CSSProperties => {
    const prizeId = equippedSkins[target];
    if (!prizeId) return {};

    const skinDef = SKIN_STYLES[prizeId];
    if (!skinDef) return {};

    // Return the appropriate style based on target, with normalized URLs
    if (target === 'button' && skinDef.button) {
      return normalizeStyleUrls(skinDef.button);
    }
    if (target === 'background' && skinDef.background) {
      return normalizeStyleUrls(skinDef.background);
    }
    if (target === 'header' && skinDef.header) {
      return normalizeStyleUrls(skinDef.header);
    }

    return {};
  };

  // Get background style specifically
  const getBackgroundStyle = (): React.CSSProperties => {
    const prizeId = equippedSkins['background'];
    if (!prizeId) return {};

    const skinDef = SKIN_STYLES[prizeId];
    return skinDef?.background ? normalizeStyleUrls(skinDef.background) : {};
  };

  // Get header style specifically
  const getHeaderStyle = (): React.CSSProperties => {
    const prizeId = equippedSkins['background'];
    if (!prizeId) return {};

    const skinDef = SKIN_STYLES[prizeId];
    return skinDef?.header ? normalizeStyleUrls(skinDef.header) : {};
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
