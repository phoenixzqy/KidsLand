#!/usr/bin/env python3
"""
Download Minecraft item renders (weapons, tools, blocks) using MediaWiki API.

Usage: python3 download_items.py
"""

import os
import time
import requests

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "images", "minecraft-renders")
API_URL = "https://minecraft.wiki/api.php"
DELAY = 0.3

HEADERS = {
    "User-Agent": "KidsLand/1.0 (Educational kids app) Python/3.9"
}

# Minecraft items - weapons, tools, armor, blocks, etc.
ITEMS = {
    # Swords
    "wooden-sword": "File:Wooden_Sword_JE2_BE2.png",
    "stone-sword": "File:Stone_Sword_JE2_BE2.png",
    "iron-sword": "File:Iron_Sword_JE2_BE2.png",
    "golden-sword": "File:Golden_Sword_JE2_BE2.png",
    "diamond-sword": "File:Diamond_Sword_JE3_BE3.png",
    "netherite-sword": "File:Netherite_Sword_JE2_BE2.png",
    
    # Pickaxes
    "wooden-pickaxe": "File:Wooden_Pickaxe_JE2_BE2.png",
    "stone-pickaxe": "File:Stone_Pickaxe_JE2_BE2.png",
    "iron-pickaxe": "File:Iron_Pickaxe_JE2_BE2.png",
    "golden-pickaxe": "File:Golden_Pickaxe_JE2_BE2.png",
    "diamond-pickaxe": "File:Diamond_Pickaxe_JE3_BE3.png",
    "netherite-pickaxe": "File:Netherite_Pickaxe_JE2_BE2.png",
    
    # Axes
    "wooden-axe": "File:Wooden_Axe_JE2.png",
    "stone-axe": "File:Stone_Axe_JE2.png",
    "iron-axe": "File:Iron_Axe_JE2.png",
    "golden-axe": "File:Golden_Axe_JE2.png",
    "diamond-axe": "File:Diamond_Axe_JE2.png",
    "netherite-axe": "File:Netherite_Axe_JE1_BE1.png",
    
    # Shovels
    "diamond-shovel": "File:Diamond_Shovel_JE2_BE2.png",
    "netherite-shovel": "File:Netherite_Shovel_JE1_BE1.png",
    
    # Bows and Ranged
    "bow": "File:Bow_(Pull_2)_JE1_BE1.png",
    "crossbow": "File:Crossbow_(Pull_2)_JE1_BE1.png",
    "arrow": "File:Arrow_JE2_BE2.png",
    "trident": "File:Trident_JE1_BE1.png",
    
    # Special Weapons
    "mace": "File:Mace_JE2_BE2.png",
    
    # Armor - Helmets
    "iron-helmet": "File:Iron_Helmet_JE2_BE2.png",
    "diamond-helmet": "File:Diamond_Helmet_JE2_BE2.png",
    "netherite-helmet": "File:Netherite_Helmet_JE2_BE1.png",
    
    # Armor - Chestplates
    "iron-chestplate": "File:Iron_Chestplate_JE2_BE2.png",
    "diamond-chestplate": "File:Diamond_Chestplate_JE2_BE2.png",
    "netherite-chestplate": "File:Netherite_Chestplate_JE2_BE1.png",
    "elytra": "File:Elytra_JE2_BE2.png",
    
    # Armor - Leggings
    "diamond-leggings": "File:Diamond_Leggings_JE2_BE2.png",
    "netherite-leggings": "File:Netherite_Leggings_JE2_BE1.png",
    
    # Armor - Boots
    "diamond-boots": "File:Diamond_Boots_JE2_BE2.png",
    "netherite-boots": "File:Netherite_Boots_JE2_BE1.png",
    
    # Shield
    "shield": "File:Shield_JE2_BE1.png",
    
    # Explosives
    "tnt": "File:TNT_JE3_BE2.png",
    "tnt-minecart": "File:Minecart_with_TNT_JE2_BE2.png",
    
    # Blocks - Ores
    "diamond-ore": "File:Diamond_Ore_JE5_BE5.png",
    "diamond-block": "File:Block_of_Diamond_JE6_BE3.png",
    "emerald-ore": "File:Emerald_Ore_JE4_BE3.png",
    "emerald-block": "File:Block_of_Emerald_JE4_BE3.png",
    "gold-ore": "File:Gold_Ore_JE7_BE4.png",
    "gold-block": "File:Block_of_Gold_JE6_BE3.png",
    "iron-ore": "File:Iron_Ore_JE6_BE4.png",
    "iron-block": "File:Block_of_Iron_JE4_BE3.png",
    "netherite-block": "File:Block_of_Netherite_JE1_BE1.png",
    "ancient-debris": "File:Ancient_Debris_JE1_BE1.png",
    
    # Blocks - Special
    "beacon": "File:Beacon_JE5_BE2.png",
    "enchanting-table": "File:Enchanting_Table.gif",
    "anvil": "File:Anvil_JE3.png",
    "chest": "File:Chest_(S)_JE2_BE2.png",
    "ender-chest": "File:Ender_Chest_(S)_JE2_BE2.png",
    "crafting-table": "File:Crafting_Table_JE4_BE3.png",
    "furnace": "File:Furnace_(S)_JE4.png",
    "brewing-stand": "File:Brewing_Stand_JE10.png",
    
    # Blocks - Nature
    "grass-block": "File:Grass_Block_JE7_BE6.png",
    "dirt": "File:Dirt_JE2_BE2.png",
    "stone": "File:Stone_JE4_BE2.png",
    "cobblestone": "File:Cobblestone_JE5_BE3.png",
    "obsidian": "File:Obsidian_JE3_BE2.png",
    "bedrock": "File:Bedrock_JE2_BE2.png",
    
    # Gems and Materials
    "diamond": "File:Diamond_JE3_BE3.png",
    "emerald": "File:Emerald_JE3_BE3.png",
    "gold-ingot": "File:Gold_Ingot_JE4_BE2.png",
    "iron-ingot": "File:Iron_Ingot_JE3_BE2.png",
    "netherite-ingot": "File:Netherite_Ingot_JE1_BE2.png",
    "nether-star": "File:Nether_Star_JE2_BE2.png",
    
    # Food
    "golden-apple": "File:Golden_Apple_JE2_BE2.png",
    "enchanted-golden-apple": "File:Enchanted_Golden_Apple_JE2_BE2.png",
    "cake": "File:Cake_JE4.png",
    "cookie": "File:Cookie_JE2_BE2.png",
    
    # Special Items
    "ender-pearl": "File:Ender_Pearl_JE3_BE2.png",
    "eye-of-ender": "File:Eye_of_Ender_JE2_BE2.png",
    "totem-of-undying": "File:Totem_of_Undying_JE2_BE2.png",
    "end-crystal": "File:End_Crystal_JE2_BE2.png",
    "dragon-egg": "File:Dragon_Egg_JE4.png",
    
    # Potions
    "potion": "File:Potion_JE2_BE2.png",
    "splash-potion": "File:Splash_Potion_JE2_BE2.png",
    
    # Spawn Eggs / Other
    "experience-bottle": "File:Bottle_o%27_Enchanting_JE2_BE2.png",
    "firework-rocket": "File:Firework_Rocket_JE2_BE2.png",
    
    # Nether Items
    "blaze-rod": "File:Blaze_Rod_JE1_BE1.png",
    "ghast-tear": "File:Ghast_Tear_JE2_BE2.png",
    
    # Music
    "music-disc": "File:Music_Disc_Cat_JE2_BE2.png",
    
    # Books
    "book": "File:Book_JE2_BE2.png",
    "enchanted-book": "File:Enchanted_Book_JE2_BE2.png",
}


def get_image_url(file_title):
    """Get the actual image URL using MediaWiki API."""
    params = {
        "action": "query",
        "titles": file_title,
        "prop": "imageinfo",
        "iiprop": "url",
        "format": "json"
    }
    
    try:
        response = requests.get(API_URL, params=params, headers=HEADERS, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        pages = data.get("query", {}).get("pages", {})
        for page_id, page_data in pages.items():
            if page_id == "-1":
                return None
            imageinfo = page_data.get("imageinfo", [])
            if imageinfo:
                return imageinfo[0].get("url")
        return None
    except Exception as e:
        print(f"  API Error: {e}")
        return None


def download_image(url, output_path):
    """Download an image."""
    try:
        response = requests.get(url, headers=HEADERS, timeout=60, stream=True)
        response.raise_for_status()
        
        with open(output_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        return True
    except Exception as e:
        print(f"  Download Error: {e}")
        return False


def main():
    """Download all items."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Downloading {len(ITEMS)} item renders...\n")

    downloaded = 0
    failed = 0
    skipped = 0

    for name, file_title in ITEMS.items():
        # Determine file extension from wiki file
        ext = ".gif" if file_title.endswith(".gif") else ".png"
        filename = f"minecraft-{name}{ext}"
        output_path = os.path.join(OUTPUT_DIR, filename)

        if os.path.exists(output_path):
            print(f"[SKIP] {name}")
            skipped += 1
            continue

        print(f"[{downloaded + failed + 1}/{len(ITEMS)}] {name}...")
        
        image_url = get_image_url(file_title)
        if not image_url:
            print(f"  ✗ Not found")
            failed += 1
            time.sleep(DELAY)
            continue
        
        if download_image(image_url, output_path):
            print(f"  ✓ Saved as {filename}")
            downloaded += 1
        else:
            failed += 1

        time.sleep(DELAY)

    print(f"\n{'='*40}")
    print(f"Summary:")
    print(f"  Downloaded: {downloaded}")
    print(f"  Skipped:    {skipped}")
    print(f"  Failed:     {failed}")
    print(f"\nImages saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
