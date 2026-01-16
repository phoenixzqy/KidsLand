// Achievement definitions for the badge system
// Each achievement gives 5 stars when completed (one-time reward)

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'words' | 'quizzes' | 'collection';
  requirement: number; // Number needed to unlock
  tier: 1 | 2 | 3 | 4 | 5; // Tier level (bronze, silver, gold, diamond, emerald)
  starsReward: number;
}

// Helper to get tier colors
export function getTierColor(tier: Achievement['tier']): string {
  switch (tier) {
    case 1:
      return 'from-amber-600 to-amber-800'; // Bronze
    case 2:
      return 'from-slate-300 to-slate-500'; // Silver
    case 3:
      return 'from-yellow-400 to-yellow-600'; // Gold
    case 4:
      return 'from-cyan-300 to-blue-500'; // Diamond
    case 5:
      return 'from-emerald-400 to-emerald-600'; // Emerald
    default:
      return 'from-slate-300 to-slate-500';
  }
}

export function getTierName(tier: Achievement['tier']): string {
  switch (tier) {
    case 1:
      return 'Bronze';
    case 2:
      return 'Silver';
    case 3:
      return 'Gold';
    case 4:
      return 'Diamond';
    case 5:
      return 'Emerald';
    default:
      return 'Bronze';
  }
}

// Word mastery achievements - using passive mobs as they're friendly
export const wordAchievements: Achievement[] = [
  {
    id: 'words-5',
    name: 'Word Starter',
    description: 'Master 5 words',
    icon: '/images/minecraft-renders/mobs/passive/minecraft-chicken.png',
    category: 'words',
    requirement: 5,
    tier: 1,
    starsReward: 5,
  },
  {
    id: 'words-10',
    name: 'Word Explorer',
    description: 'Master 10 words',
    icon: '/images/minecraft-renders/mobs/passive/minecraft-pig.png',
    category: 'words',
    requirement: 10,
    tier: 1,
    starsReward: 5,
  },
  {
    id: 'words-25',
    name: 'Word Collector',
    description: 'Master 25 words',
    icon: '/images/minecraft-renders/mobs/passive/minecraft-cow.png',
    category: 'words',
    requirement: 25,
    tier: 2,
    starsReward: 5,
  },
  {
    id: 'words-50',
    name: 'Word Hunter',
    description: 'Master 50 words',
    icon: '/images/minecraft-renders/mobs/passive/minecraft-fox.png',
    category: 'words',
    requirement: 50,
    tier: 2,
    starsReward: 5,
  },
  {
    id: 'words-100',
    name: 'Word Champion',
    description: 'Master 100 words',
    icon: '/images/minecraft-renders/mobs/passive/minecraft-panda.png',
    category: 'words',
    requirement: 100,
    tier: 3,
    starsReward: 5,
  },
  {
    id: 'words-200',
    name: 'Word Master',
    description: 'Master 200 words',
    icon: '/images/minecraft-renders/mobs/passive/minecraft-axolotl-blue.png',
    category: 'words',
    requirement: 200,
    tier: 3,
    starsReward: 5,
  },
  {
    id: 'words-300',
    name: 'Word Legend',
    description: 'Master 300 words',
    icon: '/images/minecraft-renders/mobs/passive/minecraft-turtle.png',
    category: 'words',
    requirement: 300,
    tier: 4,
    starsReward: 5,
  },
  {
    id: 'words-500',
    name: 'Word Wizard',
    description: 'Master 500 words',
    icon: '/images/minecraft-renders/mobs/passive/minecraft-allay.png',
    category: 'words',
    requirement: 500,
    tier: 5,
    starsReward: 5,
  },
];

// Quiz completion achievements - using materials/gems as rewards
export const quizAchievements: Achievement[] = [
  {
    id: 'quizzes-1',
    name: 'First Quiz',
    description: 'Complete your first quiz',
    icon: '/images/minecraft-renders/materials/minecraft-iron-ingot.png',
    category: 'quizzes',
    requirement: 1,
    tier: 1,
    starsReward: 5,
  },
  {
    id: 'quizzes-5',
    name: 'Quiz Beginner',
    description: 'Complete 5 quizzes',
    icon: '/images/minecraft-renders/materials/minecraft-gold-ingot.png',
    category: 'quizzes',
    requirement: 5,
    tier: 1,
    starsReward: 5,
  },
  {
    id: 'quizzes-10',
    name: 'Quiz Taker',
    description: 'Complete 10 quizzes',
    icon: '/images/minecraft-renders/materials/minecraft-emerald.png',
    category: 'quizzes',
    requirement: 10,
    tier: 2,
    starsReward: 5,
  },
  {
    id: 'quizzes-25',
    name: 'Quiz Pro',
    description: 'Complete 25 quizzes',
    icon: '/images/minecraft-renders/materials/minecraft-diamond.png',
    category: 'quizzes',
    requirement: 25,
    tier: 2,
    starsReward: 5,
  },
  {
    id: 'quizzes-50',
    name: 'Quiz Expert',
    description: 'Complete 50 quizzes',
    icon: '/images/minecraft-renders/materials/minecraft-ender-pearl.png',
    category: 'quizzes',
    requirement: 50,
    tier: 3,
    starsReward: 5,
  },
  {
    id: 'quizzes-100',
    name: 'Quiz Master',
    description: 'Complete 100 quizzes',
    icon: '/images/minecraft-renders/materials/minecraft-eye-of-ender.png',
    category: 'quizzes',
    requirement: 100,
    tier: 3,
    starsReward: 5,
  },
  {
    id: 'quizzes-200',
    name: 'Quiz Legend',
    description: 'Complete 200 quizzes',
    icon: '/images/minecraft-renders/materials/minecraft-netherite-ingot.png',
    category: 'quizzes',
    requirement: 200,
    tier: 4,
    starsReward: 5,
  },
  {
    id: 'quizzes-500',
    name: 'Quiz Champion',
    description: 'Complete 500 quizzes',
    icon: '/images/minecraft-renders/mobs/bosses/minecraft-ender-dragon.png',
    category: 'quizzes',
    requirement: 500,
    tier: 5,
    starsReward: 5,
  },
];

// Collection achievements - for collecting prizes from the market
export const collectionAchievements: Achievement[] = [
  {
    id: 'collection-1',
    name: 'First Prize',
    description: 'Collect your first prize',
    icon: '/images/minecraft-renders/blocks/minecraft-chest.png',
    category: 'collection',
    requirement: 1,
    tier: 1,
    starsReward: 5,
  },
  {
    id: 'collection-5',
    name: 'Treasure Hunter',
    description: 'Collect 5 prizes',
    icon: '/images/minecraft-renders/blocks/minecraft-iron-block.png',
    category: 'collection',
    requirement: 5,
    tier: 1,
    starsReward: 5,
  },
  {
    id: 'collection-10',
    name: 'Collector',
    description: 'Collect 10 prizes',
    icon: '/images/minecraft-renders/blocks/minecraft-gold-block.png',
    category: 'collection',
    requirement: 10,
    tier: 2,
    starsReward: 5,
  },
  {
    id: 'collection-25',
    name: 'Hoarder',
    description: 'Collect 25 prizes',
    icon: '/images/minecraft-renders/blocks/minecraft-emerald-block.png',
    category: 'collection',
    requirement: 25,
    tier: 2,
    starsReward: 5,
  },
  {
    id: 'collection-50',
    name: 'Treasure Master',
    description: 'Collect 50 prizes',
    icon: '/images/minecraft-renders/blocks/minecraft-diamond-ore.png',
    category: 'collection',
    requirement: 50,
    tier: 3,
    starsReward: 5,
  },
  {
    id: 'collection-75',
    name: 'Elite Collector',
    description: 'Collect 75 prizes',
    icon: '/images/minecraft-renders/blocks/minecraft-ancient-debris.png',
    category: 'collection',
    requirement: 75,
    tier: 3,
    starsReward: 5,
  },
  {
    id: 'collection-100',
    name: 'Legendary Collector',
    description: 'Collect 100 prizes',
    icon: '/images/minecraft-renders/blocks/minecraft-netherite-block.png',
    category: 'collection',
    requirement: 100,
    tier: 4,
    starsReward: 5,
  },
  {
    id: 'collection-150',
    name: 'Ultimate Collector',
    description: 'Collect 150 prizes',
    icon: '/images/minecraft-renders/special/minecraft-dragon-egg.png',
    category: 'collection',
    requirement: 150,
    tier: 5,
    starsReward: 5,
  },
];

// All achievements combined
export const allAchievements: Achievement[] = [...wordAchievements, ...quizAchievements, ...collectionAchievements];

// Get achievement by ID
export function getAchievementById(id: string): Achievement | undefined {
  return allAchievements.find(a => a.id === id);
}

// Get achievements by category
export function getAchievementsByCategory(category: 'words' | 'quizzes' | 'collection'): Achievement[] {
  return allAchievements.filter(a => a.category === category);
}