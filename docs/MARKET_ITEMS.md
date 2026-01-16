# Managing Market Items

This guide explains how to add, update, or delete prizes in the KidsLand market.

## Overview

Market items are stored in `src/data/prizes.json`. When you update this file:
1. Bump the version in `src/data/version.json`
2. The app will automatically sync new data to users' IndexedDB on their next visit

## Prize Types

| Type | Description | Example |
|------|-------------|---------|
| `card` | Collectible cards | Ultraman, Minecraft characters |
| `skin` | UI customization | Button backgrounds, themes |
| `badge` | Achievements | Unlockable rewards |

## File Location

```
src/data/prizes.json
```

## Prize Structure

```json
{
  "id": "card-ultraman-01",      // Unique ID (required)
  "type": "card",                 // "card" | "skin" | "badge"
  "name": "Ultraman Tiga",        // Display name
  "description": "The legendary warrior of light",
  "image": "ultraman-tiga",       // Image identifier
  "cost": 50,                     // Price in stars

  // Card-specific fields
  "collection": "ultraman",       // Collection group
  "rarity": "common",             // "common" | "rare" | "epic" | "legendary"

  // Skin-specific fields
  "target": "button",             // "button" | "card" | "background" | "header"

  // Badge-specific fields
  "unlockCondition": "complete_first_quiz"  // Auto-unlock condition
}
```

## Adding a New Prize

### Step 1: Add to prizes.json

```json
{
  "prizes": [
    // ... existing prizes ...

    // Add your new prize
    {
      "id": "card-minecraft-05",
      "type": "card",
      "collection": "minecraft",
      "name": "Wither Boss",
      "description": "The three-headed boss",
      "image": "minecraft-wither",
      "cost": 200,
      "rarity": "legendary"
    }
  ]
}
```

### Step 2: Update version.json

```json
{
  "words": 1,
  "prizes": 2    // Increment this number
}
```

### Step 3: (Optional) Add placeholder image

For now, images use CSS-based placeholders. To add custom images later:
1. Add image to `public/images/prizes/`
2. Update the `image` field with the path

## Updating an Existing Prize

1. Find the prize by `id` in `prizes.json`
2. Modify the desired fields
3. Bump the version in `version.json`

```json
// Before
{
  "id": "card-ultraman-01",
  "cost": 50
}

// After
{
  "id": "card-ultraman-01",
  "cost": 75  // Price increased
}
```

## Deleting a Prize

⚠️ **Warning**: Users who already purchased the item will keep it in their inventory.

1. Remove the prize object from `prizes.json`
2. Bump the version in `version.json`

## Adding a New Collection

To add a new card collection (e.g., Pokemon):

```json
{
  "id": "card-pokemon-01",
  "type": "card",
  "collection": "pokemon",  // New collection name
  "name": "Pikachu",
  "description": "Electric mouse Pokemon",
  "image": "pokemon-pikachu",
  "cost": 60,
  "rarity": "common"
}
```

The collection will automatically appear in the Market's category filter.

## Adding a New Skin

### Button Skin

```json
{
  "id": "skin-btn-ocean",
  "type": "skin",
  "target": "button",
  "name": "Ocean Button",
  "description": "Cool blue wave buttons",
  "image": "skin-ocean",
  "cost": 100
}
```

### Background Skin

```json
{
  "id": "skin-bg-sunset",
  "type": "skin",
  "target": "background",
  "name": "Sunset Theme",
  "description": "Beautiful orange sunset",
  "image": "skin-sunset-bg",
  "cost": 250
}
```

## Adding a Badge

Badges can be:
- **Purchasable** (`cost > 0`)
- **Auto-unlock** (`cost: 0` + `unlockCondition`)

```json
{
  "id": "badge-50-words",
  "type": "badge",
  "name": "Word Master",
  "description": "Learn 50 words",
  "image": "badge-50-words",
  "cost": 0,
  "unlockCondition": "learn_50_words"
}
```

## Rarity Colors

The UI displays different colors based on rarity:

| Rarity | Color |
|--------|-------|
| common | Gray gradient |
| rare | Blue gradient |
| epic | Purple gradient |
| legendary | Gold/Orange gradient |

## Testing Changes

1. Run the dev server: `npm run dev`
2. Open the Market page
3. Check that your new items appear
4. Test purchasing to ensure stars are deducted correctly
