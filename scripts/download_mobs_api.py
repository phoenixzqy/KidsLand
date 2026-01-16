#!/usr/bin/env python3
"""
Download Minecraft mob renders using the MediaWiki API.
This approach is more reliable as it gets the actual image URLs from the wiki.

Usage: python3 download_mobs_api.py

Requirements:
    pip3 install requests
"""

import os
import re
import time
import requests
from urllib.parse import quote

# Configuration
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "images", "minecraft-renders")
DELAY = 0.3

# MediaWiki API endpoint
API_URL = "https://minecraft.wiki/api.php"

HEADERS = {
    "User-Agent": "KidsLand/1.0 (Educational kids app; contact@example.com) Python/3.9"
}

# Curated list of popular mobs with their wiki file names
MOBS = {
    # Hostile Mobs
    "zombie": "File:Zombie_JE3_BE2.png",
    "skeleton": "File:Skeleton_JE6_BE4.png",
    "creeper": "File:Creeper_JE3_BE1.png",
    "spider": "File:Spider_JE4_BE3.png",
    "enderman": "File:Enderman_JE3_BE1.png",
    "witch": "File:Witch_JE2_BE2.png",
    "slime": "File:Slime_JE4_BE3.png",
    "phantom": "File:Phantom_JE2_BE2.png",
    "drowned": "File:Drowned_JE1.png",
    "husk": "File:Husk_JE2_BE2.png",
    "stray": "File:Stray_JE2_BE2.png",
    "blaze": "File:Blaze_JE2.png",
    "ghast": "File:Ghast_JE2_BE2.png",
    "wither-skeleton": "File:Wither_Skeleton_JE4_BE3.png",
    "piglin": "File:Piglin_JE2_BE2.png",
    "hoglin": "File:Hoglin_JE2_BE1.png",
    "warden": "File:Warden_JE1_BE1.png",
    "breeze": "File:Breeze_JE1.png",
    "creaking": "File:Creaking_JE1_BE1.png",
    
    # Bosses
    "ender-dragon": "File:Ender_Dragon_JE1_BE1.png",
    "wither": "File:Wither_JE2_BE2.png",
    
    # Passive Mobs
    "pig": "File:Pig_JE3_BE2.png",
    "cow": "File:Cow_JE5_BE2.png",
    "sheep": "File:White_Sheep_JE4_BE6.png",
    "chicken": "File:Chicken_JE2_BE2.png",
    "wolf": "File:Wolf_JE3_BE2.png",
    "cat-tabby": "File:Tabby_Cat.png",
    "horse": "File:White_Horse_JE5_BE3.png",
    "rabbit": "File:Brown_Rabbit_JE2_BE2.png",
    "fox": "File:Fox_JE1_BE1.png",
    "panda": "File:Panda_JE1_BE1.png",
    "bee": "File:Bee.png",
    "axolotl-blue": "File:Blue_Axolotl_JE2.png",
    "axolotl-pink": "File:Axolotl_Swimming_(lucy)_JE2.png",
    "goat": "File:Goat_JE1_BE1.png",
    "frog-green": "File:Cold_Frog_JE1_BE1.png",
    "camel": "File:Camel_JE1_BE2.png",
    "armadillo": "File:Armadillo_JE2_BE2.png",
    "allay": "File:Allay_JE1_BE1.png",
    "sniffer": "File:Sniffer_JE2_BE2.png",
    
    # Neutral Mobs  
    "iron-golem": "File:Iron_Golem_JE2_BE2.png",
    "snow-golem": "File:Snow_Golem_JE2_BE2.png",
    "llama": "File:Creamy_Llama_JE2_BE2.png",
    "dolphin": "File:Dolphin.png",
    "polar-bear": "File:Polar_Bear_JE2_BE2.png",
    
    # Villagers & Illagers
    "villager": "File:Plains_Villager_Base.png",
    "wandering-trader": "File:Wandering_Trader_JE1_BE1.png",
    "pillager": "File:Pillager_JE2_BE2.png",
    "evoker": "File:Evoker_JE1_BE2.png",
    "vindicator": "File:Vindicator_JE2_BE2.png",
    "ravager": "File:Ravager.png",
    
    # Nether Mobs
    "zombified-piglin": "File:Zombified_Piglin_JE3_BE2.png",
    "strider": "File:Strider_JE1_BE1.png",
    "magma-cube": "File:Magma_Cube_JE2_BE2.png",
    
    # Water Mobs
    "squid": "File:Squid_JE3_BE2.png",
    "glow-squid": "File:Glow_Squid_JE1.png",
    "turtle": "File:Turtle.png",
    "cod": "File:Cod.png",
    "pufferfish": "File:Pufferfish_(fully_puffed)_JE4.png",
    "guardian": "File:Guardian_JE2_BE2.png",
    "elder-guardian": "File:Elder_Guardian_JE2_BE2.png",
    
    # End Mobs
    "endermite": "File:Endermite.png",
    "shulker": "File:Shulker_JE1_BE1.png",
    
    # Cave Mobs
    "cave-spider": "File:Cave_Spider_JE2_BE2.png",
    "silverfish": "File:Silverfish_JE3_BE2.png",
    "bat": "File:Bat_JE4_BE3.png",
    
    # Special
    "mooshroom": "File:Red_Mooshroom_JE3_BE2.png",
    "charged-creeper": "File:Charged_Creeper_JE1_BE1.png",
    "ocelot": "File:Ocelot_JE5_BE2.png",
    "parrot-blue": "File:Blue_Parrot_JE1_BE1.png",
    
    # Players
    "steve": "File:Steve_(skin)_JE5.png",
    "alex": "File:Alex_(skin)_JE5.png",
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
                return None  # File not found
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
    """Download all mobs using the API."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Downloading {len(MOBS)} mob renders using MediaWiki API...\n")

    downloaded = 0
    failed = 0
    skipped = 0

    for name, file_title in MOBS.items():
        filename = f"minecraft-{name}.png"
        output_path = os.path.join(OUTPUT_DIR, filename)

        if os.path.exists(output_path):
            print(f"[SKIP] {name} (already exists)")
            skipped += 1
            continue

        print(f"[{downloaded + failed + 1}/{len(MOBS)}] {name}...")
        
        # Get the actual image URL from API
        image_url = get_image_url(file_title)
        if not image_url:
            print(f"  ✗ Could not find image URL")
            failed += 1
            time.sleep(DELAY)
            continue
        
        # Download the image
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
