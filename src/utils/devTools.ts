/**
 * Development Tools for KidsLand
 * 
 * These tools are exposed to the browser console for debugging and testing.
 * Access them via `window.kidsland` in the browser console.
 * 
 * Usage examples:
 *   kidsland.resetGame()           - Reset all game data
 *   kidsland.setStars(100)         - Set stars to 100
 *   kidsland.addStars(50)          - Add 50 stars
 *   kidsland.getProfile()          - View current profile
 *   kidsland.getProgress()         - View word progress
 *   kidsland.getOwnedItems()       - View owned items
 *   kidsland.clearOwnedItems()     - Remove all owned items
 *   kidsland.help()                - Show all available commands
 */

import { db, initializeUser } from '../db/database';

export interface DevTools {
  resetGame: () => Promise<void>;
  setStars: (amount: number) => Promise<void>;
  addStars: (amount: number) => Promise<void>;
  getProfile: () => Promise<void>;
  getProgress: () => Promise<void>;
  getOwnedItems: () => Promise<void>;
  clearOwnedItems: () => Promise<void>;
  clearProgress: () => Promise<void>;
  help: () => void;
}

const devTools: DevTools = {
  /**
   * Reset all game data (profile, progress, owned items)
   */
  async resetGame() {
    console.log('🔄 Resetting game...');
    
    try {
      // Clear all tables
      await db.userProfile.clear();
      await db.wordProgress.clear();
      await db.ownedItems.clear();
      await db.syncMeta.clear();
      
      // Re-initialize user with fresh profile
      await initializeUser();
      
      console.log('✅ Game reset complete! Refresh the page to see changes.');
      console.log('📊 New profile created with 0 stars.');
    } catch (error) {
      console.error('❌ Failed to reset game:', error);
    }
  },

  /**
   * Set stars to a specific amount
   */
  async setStars(amount: number) {
    if (typeof amount !== 'number' || amount < 0) {
      console.error('❌ Please provide a valid positive number');
      return;
    }

    try {
      const profile = await db.userProfile.get('default');
      if (!profile) {
        console.error('❌ User profile not found. Try refreshing the page.');
        return;
      }

      await db.userProfile.update('default', {
        stars: amount,
        totalStarsEarned: Math.max(profile.totalStarsEarned, amount)
      });

      console.log(`✅ Stars set to ${amount}`);
    } catch (error) {
      console.error('❌ Failed to set stars:', error);
    }
  },

  /**
   * Add stars to current amount
   */
  async addStars(amount: number) {
    if (typeof amount !== 'number') {
      console.error('❌ Please provide a valid number');
      return;
    }

    try {
      const profile = await db.userProfile.get('default');
      if (!profile) {
        console.error('❌ User profile not found. Try refreshing the page.');
        return;
      }

      const newStars = Math.max(0, profile.stars + amount);
      const newTotal = amount > 0 
        ? profile.totalStarsEarned + amount 
        : profile.totalStarsEarned;

      await db.userProfile.update('default', {
        stars: newStars,
        totalStarsEarned: newTotal
      });

      console.log(`✅ Stars ${amount >= 0 ? 'added' : 'removed'}: ${profile.stars} → ${newStars}`);
    } catch (error) {
      console.error('❌ Failed to add stars:', error);
    }
  },

  /**
   * Display current user profile
   */
  async getProfile() {
    try {
      const profile = await db.userProfile.get('default');
      if (!profile) {
        console.log('❌ No profile found');
        return;
      }

      console.log('📊 User Profile:');
      console.table({
        'Stars': profile.stars,
        'Total Earned': profile.totalStarsEarned,
        'Created': profile.createdAt
      });
    } catch (error) {
      console.error('❌ Failed to get profile:', error);
    }
  },

  /**
   * Display word progress
   */
  async getProgress() {
    try {
      const progress = await db.wordProgress.toArray();
      if (progress.length === 0) {
        console.log('📚 No word progress yet');
        return;
      }

      console.log(`📚 Word Progress (${progress.length} words):`);
      console.table(progress.map(p => ({
        'Word ID': p.wordId,
        'Times Studied': p.timesStudied,
        'Quizzes Passed': p.quizzesPassed,
        'Passed Types': (p.passedQuizTypes || []).join(', ') || 'none',
        'Mastered': p.mastered ? '✅' : '❌',
        'Last Studied': p.lastStudied
      })));
    } catch (error) {
      console.error('❌ Failed to get progress:', error);
    }
  },

  /**
   * Display owned items
   */
  async getOwnedItems() {
    try {
      const items = await db.ownedItems.toArray();
      if (items.length === 0) {
        console.log('🎁 No owned items yet');
        return;
      }

      console.log(`🎁 Owned Items (${items.length} items):`);
      console.table(items.map(i => ({
        'ID': i.id,
        'Prize ID': i.prizeId,
        'Equipped': i.equipped ? '✅' : '❌',
        'Purchased': i.purchasedAt
      })));
    } catch (error) {
      console.error('❌ Failed to get owned items:', error);
    }
  },

  /**
   * Clear all owned items
   */
  async clearOwnedItems() {
    try {
      await db.ownedItems.clear();
      console.log('✅ All owned items cleared');
    } catch (error) {
      console.error('❌ Failed to clear owned items:', error);
    }
  },

  /**
   * Clear all word progress
   */
  async clearProgress() {
    try {
      await db.wordProgress.clear();
      console.log('✅ All word progress cleared');
    } catch (error) {
      console.error('❌ Failed to clear progress:', error);
    }
  },

  /**
   * Show help information
   */
  help() {
    console.log(`
🛠️  KidsLand Dev Tools
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 GAME RESET
   kidsland.resetGame()         Reset all game data

💫 STARS MANAGEMENT  
   kidsland.setStars(100)       Set stars to 100
   kidsland.addStars(50)        Add 50 stars
   kidsland.addStars(-20)       Remove 20 stars

📊 VIEW DATA
   kidsland.getProfile()        View user profile
   kidsland.getProgress()       View word progress
   kidsland.getOwnedItems()     View owned items

🧹 CLEAR DATA
   kidsland.clearOwnedItems()   Clear all owned items
   kidsland.clearProgress()     Clear word progress

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
  }
};

/**
 * Initialize dev tools and expose to window object
 * Only runs in development mode
 */
export function initDevTools(): void {
  if (import.meta.env.DEV) {
    // Expose to window object
    (window as unknown as { kidsland: DevTools }).kidsland = devTools;
    
    console.log('🛠️  KidsLand Dev Tools loaded! Type `kidsland.help()` for available commands.');
  }
}

export default devTools;
