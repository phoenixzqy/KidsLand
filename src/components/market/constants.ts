import type { PrizeType, Rarity, MobSubcategory } from '../../types';

// Category types shared between Market and Collection pages
export type ItemCategory = 'all' | 'mobs' | 'tools' | 'weapons' | 'skins';
export type MobFilter = 'all' | MobSubcategory;

export interface CategoryOption {
  id: ItemCategory;
  name: string;
  icon: string;
}

export interface MobFilterOption {
  id: MobFilter;
  name: string;
  icon: string;
}

// Default categories for market view
export const MARKET_CATEGORIES: CategoryOption[] = [
  { id: 'all', name: 'All', icon: '/images/minecraft-renders/blocks/minecraft-chest.png' },
  { id: 'mobs', name: 'Mobs', icon: '/images/minecraft-renders/mobs/hostile/minecraft-creeper.png' },
  { id: 'tools', name: 'Tools', icon: '/images/minecraft-renders/tools/minecraft-diamond-pickaxe.png' },
  { id: 'weapons', name: 'Weapons', icon: '/images/minecraft-renders/weapons/minecraft-diamond-sword.png' },
  { id: 'skins', name: 'Skins', icon: '/images/minecraft-renders/special/minecraft-totem-of-undying.png' }
];

// Categories for collection view (uses ender chest icon)
export const COLLECTION_CATEGORIES: CategoryOption[] = [
  { id: 'all', name: 'All', icon: '/images/minecraft-renders/blocks/minecraft-ender-chest.png' },
  { id: 'mobs', name: 'Mobs', icon: '/images/minecraft-renders/mobs/hostile/minecraft-creeper.png' },
  { id: 'tools', name: 'Tools', icon: '/images/minecraft-renders/tools/minecraft-diamond-pickaxe.png' },
  { id: 'weapons', name: 'Weapons', icon: '/images/minecraft-renders/weapons/minecraft-diamond-sword.png' },
  { id: 'skins', name: 'Skins', icon: '/images/minecraft-renders/special/minecraft-totem-of-undying.png' }
];

export const MOB_FILTERS: MobFilterOption[] = [
  { id: 'all', name: 'All Mobs', icon: '/images/minecraft-renders/mobs/hostile/minecraft-creeper.png' },
  { id: 'bosses', name: 'Bosses', icon: '/images/minecraft-renders/mobs/bosses/minecraft-ender-dragon.png' },
  { id: 'hostile', name: 'Hostile', icon: '/images/minecraft-renders/mobs/hostile/minecraft-skeleton.png' },
  { id: 'neutral', name: 'Neutral', icon: '/images/minecraft-renders/mobs/neutral/minecraft-wolf.png' },
  { id: 'passive', name: 'Passive', icon: '/images/minecraft-renders/mobs/passive/minecraft-pig.png' },
  { id: 'villagers', name: 'Villagers', icon: '/images/minecraft-renders/mobs/villagers/minecraft-villager.png' }
];

export function getRarityColor(rarity?: Rarity): string {
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
}

export function getTypeIcon(type: PrizeType): string {
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
}
