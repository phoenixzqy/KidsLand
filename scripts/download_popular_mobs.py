#!/usr/bin/env python3
"""
Download a curated list of popular Minecraft mob renders.
These are the most recognizable mobs for a card game.

Usage: python download_popular_mobs.py

Requirements:
    pip install requests
"""

import os
import requests
import time

# Configuration
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "images", "minecraft-renders")
DELAY = 0.5

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
}

# Curated list: (filename, wiki_image_url)
# These URLs point directly to the PNG files on the wiki
POPULAR_MOBS = {
    # Players
    "steve": "https://static.wikia.nocookie.net/minecraft_gamepedia/images/1/1b/Steve_%28skin%29_JE5.png",
    "alex": "https://static.wikia.nocookie.net/minecraft_gamepedia/images/c/c6/Alex_%28skin%29_JE5.png",
    
    # Hostile Mobs
    "zombie": "https://minecraft.wiki/images/Zombie_JE3_BE2.png",
    "skeleton": "https://minecraft.wiki/images/Skeleton_JE6_BE4.png",
    "creeper": "https://minecraft.wiki/images/Creeper_JE3_BE1.png",
    "spider": "https://minecraft.wiki/images/Spider_JE4_BE3.png",
    "enderman": "https://minecraft.wiki/images/Enderman_JE3_BE1.png",
    "witch": "https://minecraft.wiki/images/Witch_JE2_BE2.png",
    "slime": "https://minecraft.wiki/images/Slime_JE4_BE3.png",
    "phantom": "https://minecraft.wiki/images/Phantom_JE2_BE2.png",
    "drowned": "https://minecraft.wiki/images/Drowned_JE1.png",
    "husk": "https://minecraft.wiki/images/Husk_JE2_BE2.png",
    "stray": "https://minecraft.wiki/images/Stray_JE2_BE2.png",
    "blaze": "https://minecraft.wiki/images/Blaze_JE2.png",
    "ghast": "https://minecraft.wiki/images/Ghast_JE2_BE2.png",
    "wither-skeleton": "https://minecraft.wiki/images/Wither_Skeleton_JE4_BE3.png",
    "piglin": "https://minecraft.wiki/images/Piglin_JE2_BE2.png",
    "hoglin": "https://minecraft.wiki/images/Hoglin_JE2_BE1.png",
    "warden": "https://minecraft.wiki/images/Warden_JE1_BE1.png",
    "breeze": "https://minecraft.wiki/images/Breeze_JE1.png",
    
    # Bosses
    "ender-dragon": "https://minecraft.wiki/images/Ender_Dragon_JE1_BE1.png",
    "wither": "https://minecraft.wiki/images/Wither_JE2_BE2.png",
    
    # Passive Mobs
    "pig": "https://minecraft.wiki/images/Pig_JE3_BE2.png",
    "cow": "https://minecraft.wiki/images/Cow_JE5_BE2.png",
    "sheep": "https://minecraft.wiki/images/White_Sheep_JE4_BE6.png",
    "chicken": "https://minecraft.wiki/images/Chicken_JE2_BE2.png",
    "wolf": "https://minecraft.wiki/images/Wolf_JE3_BE2.png",
    "cat": "https://minecraft.wiki/images/Tabby_Cat.png",
    "horse": "https://minecraft.wiki/images/White_Horse_JE5_BE3.png",
    "rabbit": "https://minecraft.wiki/images/Brown_Rabbit_JE2_BE2.png",
    "fox": "https://minecraft.wiki/images/Fox_JE1_BE1.png",
    "panda": "https://minecraft.wiki/images/Panda_JE1_BE1.png",
    "bee": "https://minecraft.wiki/images/Bee.png",
    "axolotl": "https://minecraft.wiki/images/Blue_Axolotl_JE2.png",
    "goat": "https://minecraft.wiki/images/Goat_JE1_BE1.png",
    "frog": "https://minecraft.wiki/images/Cold_Frog_JE1_BE1.png",
    "camel": "https://minecraft.wiki/images/Camel_JE1_BE2.png",
    "armadillo": "https://minecraft.wiki/images/Armadillo_JE2_BE2.png",
    "allay": "https://minecraft.wiki/images/Allay_JE1_BE1.png",
    "sniffer": "https://minecraft.wiki/images/Sniffer_JE2_BE2.png",
    
    # Neutral Mobs
    "iron-golem": "https://minecraft.wiki/images/Iron_Golem_JE2_BE2.png",
    "snow-golem": "https://minecraft.wiki/images/Snow_Golem_JE2_BE2.png",
    "llama": "https://minecraft.wiki/images/Creamy_Llama_JE2_BE2.png",
    "dolphin": "https://minecraft.wiki/images/Dolphin.png",
    "polar-bear": "https://minecraft.wiki/images/Polar_Bear_JE2_BE2.png",
    
    # Villagers & Illagers
    "villager": "https://minecraft.wiki/images/Plains_Villager_Base.png",
    "wandering-trader": "https://minecraft.wiki/images/Wandering_Trader_JE1_BE1.png",
    "pillager": "https://minecraft.wiki/images/Pillager_JE2_BE2.png",
    "evoker": "https://minecraft.wiki/images/Evoker_JE1_BE2.png",
    "vindicator": "https://minecraft.wiki/images/Vindicator_JE2_BE2.png",
    "ravager": "https://minecraft.wiki/images/Ravager.png",
    
    # Nether Mobs
    "zombified-piglin": "https://minecraft.wiki/images/Zombified_Piglin_JE3_BE2.png",
    "strider": "https://minecraft.wiki/images/Strider_JE1_BE1.png",
    "magma-cube": "https://minecraft.wiki/images/Magma_Cube_JE2_BE2.png",
    
    # Water Mobs
    "squid": "https://minecraft.wiki/images/Squid_JE3_BE2.png",
    "glow-squid": "https://minecraft.wiki/images/Glow_Squid_JE1.png",
    "turtle": "https://minecraft.wiki/images/Turtle.png",
    "cod": "https://minecraft.wiki/images/Cod.png",
    "pufferfish": "https://minecraft.wiki/images/Pufferfish_%28fully_puffed%29_JE4.png",
    "guardian": "https://minecraft.wiki/images/Guardian_JE2_BE2.png",
    "elder-guardian": "https://minecraft.wiki/images/Elder_Guardian_JE2_BE2.png",
    
    # Undead
    "zombie-villager": "https://minecraft.wiki/images/Plains_Zombie_Villager_Base.png",
    
    # End Mobs
    "endermite": "https://minecraft.wiki/images/Endermite.png",
    "shulker": "https://minecraft.wiki/images/Shulker_JE1_BE1.png",
    
    # Cave Mobs
    "cave-spider": "https://minecraft.wiki/images/Cave_Spider_JE2_BE2.png",
    "silverfish": "https://minecraft.wiki/images/Silverfish_JE3_BE2.png",
    "bat": "https://minecraft.wiki/images/Bat_JE4_BE3.png",
    
    # Mooshroom
    "mooshroom": "https://minecraft.wiki/images/Red_Mooshroom_JE3_BE2.png",
    
    # Charged Creeper (special)
    "charged-creeper": "https://minecraft.wiki/images/Charged_Creeper_JE1_BE1.png",
    
    # Ocelot
    "ocelot": "https://minecraft.wiki/images/Ocelot_JE5_BE2.png",
    
    # Parrot
    "parrot": "https://minecraft.wiki/images/Blue_Parrot_JE1_BE1.png",
}


def download_image(url, output_path):
    """Download an image."""
    try:
        response = requests.get(url, headers=HEADERS, timeout=30, stream=True)
        response.raise_for_status()
        
        with open(output_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        return True
    except requests.RequestException as e:
        print(f"  Error: {e}")
        return False


def main():
    """Download all popular mobs."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Downloading {len(POPULAR_MOBS)} mob renders...\n")

    downloaded = 0
    failed = 0
    skipped = 0

    for name, url in POPULAR_MOBS.items():
        filename = f"minecraft-{name}.png"
        output_path = os.path.join(OUTPUT_DIR, filename)

        if os.path.exists(output_path):
            print(f"[SKIP] {name} (already exists)")
            skipped += 1
            continue

        print(f"[DOWNLOAD] {name}...")
        
        if download_image(url, output_path):
            print(f"  ✓ Saved as {filename}")
            downloaded += 1
        else:
            failed += 1

        time.sleep(DELAY)

    print(f"\n=== Summary ===")
    print(f"Downloaded: {downloaded}")
    print(f"Skipped: {skipped}")
    print(f"Failed: {failed}")
    print(f"\nImages saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
