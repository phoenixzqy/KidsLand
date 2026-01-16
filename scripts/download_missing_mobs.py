#!/usr/bin/env python3
"""
Download missing mobs with corrected file names.
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

# Fixed file names for the ones that failed
MISSING_MOBS = {
    "witch": "File:Witch.png",
    "slime": "File:Slime_JE3_BE2.png",
    "phantom": "File:Phantom.png",
    "stray": "File:Stray_JE1_BE1.png",
    "piglin": "File:Piglin_JE1_BE1.png",
    "hoglin": "File:Hoglin.png",
    "sheep": "File:White_Sheep_JE3.png",
    "wolf": "File:Wolf_JE2_BE2.png",
    "horse": "File:White_Horse_JE4.png",
    "sniffer": "File:Sniffer_JE1_BE1.png",
    "pillager": "File:Pillager_JE1_BE1.png",
    "evoker": "File:Evoker.png",
    "strider": "File:Strider_JE2_BE2.png",
    "squid": "File:Squid_JE2.png",
    "pufferfish": "File:Pufferfish_(max)_JE2.png",
    "silverfish": "File:Silverfish_JE2.png",
    "ocelot": "File:Ocelot_JE4.png",
    "steve": "File:Alex_(skin)_JE1.png",  # Will try Alex first
    "alex": "File:Steve_(skin)_JE4.png",
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
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Downloading {len(MISSING_MOBS)} missing mobs...\n")

    downloaded = 0
    failed = 0

    for name, file_title in MISSING_MOBS.items():
        filename = f"minecraft-{name}.png"
        output_path = os.path.join(OUTPUT_DIR, filename)

        if os.path.exists(output_path):
            print(f"[SKIP] {name}")
            continue

        print(f"Trying {name} ({file_title})...")
        
        image_url = get_image_url(file_title)
        if not image_url:
            print(f"  ✗ Not found")
            failed += 1
            time.sleep(DELAY)
            continue
        
        if download_image(image_url, output_path):
            print(f"  ✓ Downloaded")
            downloaded += 1
        else:
            failed += 1

        time.sleep(DELAY)

    print(f"\nDownloaded: {downloaded}, Failed: {failed}")


if __name__ == "__main__":
    main()
