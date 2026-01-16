import { createContext } from 'react';
import type { SkinTarget, Prize } from '../types';

export interface EquippedSkins {
  button?: string;
  background?: string;
  header?: string;
  avatar?: string;
  [key: string]: string | undefined;
}

export interface ThemeContextType {
  equippedSkins: EquippedSkins;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  getSkinStyle: (target: SkinTarget) => React.CSSProperties;
  getBackgroundStyle: () => React.CSSProperties;
  getHeaderStyle: () => React.CSSProperties;
  getSkinForTarget: (target: SkinTarget) => Prize | null;
  getEquippedAvatar: () => Prize | null;
  equipSkin: (prizeId: string, target: SkinTarget) => Promise<void>;
  unequipSkin: (target: SkinTarget) => Promise<void>;
  equipAvatar: (prizeId: string) => Promise<void>;
  unequipAvatar: () => Promise<void>;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);
