#!/usr/bin/env python3
"""
Script to download Minecraft mob renders from the Minecraft Wiki.
Usage: python download_minecraft_wiki_renders.py

Requirements:
    pip install requests beautifulsoup4
"""

import os
import re
import time
import requests
from urllib.parse import unquote, urljoin
from bs4 import BeautifulSoup

# Configuration
BASE_URL = "https://minecraft.wiki"
CATEGORY_URL = "https://minecraft.wiki/w/Category:Mob_renders"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "images", "minecraft-renders")
DELAY_BETWEEN_REQUESTS = 0.5  # Be nice to the server

# Headers to mimic a browser
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}


def get_page(url):
    """Fetch a page and return BeautifulSoup object."""
    try:
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
        return BeautifulSoup(response.text, "html.parser")
    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return None


def get_image_urls_from_category(category_url):
    """Get all image file URLs from a category page (handles pagination)."""
    all_file_pages = []
    current_url = category_url
    page_count = 0

    while current_url:
        page_count += 1
        print(f"Fetching category page {page_count}: {current_url}")
        
        soup = get_page(current_url)
        if not soup:
            break

        # Find all file links in the gallery
        gallery = soup.find("div", class_="mw-category-media") or soup.find("div", id="mw-category-media")
        if gallery:
            links = gallery.find_all("a", href=True)
            for link in links:
                href = link.get("href", "")
                if "/w/File:" in href:
                    full_url = urljoin(BASE_URL, href)
                    all_file_pages.append(full_url)

        # Also try the gallery items directly
        gallery_items = soup.select(".gallerybox .thumb a")
        for item in gallery_items:
            href = item.get("href", "")
            if "/w/File:" in href:
                full_url = urljoin(BASE_URL, href)
                if full_url not in all_file_pages:
                    all_file_pages.append(full_url)

        # Find "next page" link
        next_link = None
        for a in soup.find_all("a"):
            if a.text and "next page" in a.text.lower():
                next_link = urljoin(BASE_URL, a.get("href", ""))
                break

        if next_link and next_link != current_url:
            current_url = next_link
            time.sleep(DELAY_BETWEEN_REQUESTS)
        else:
            current_url = None

    return list(set(all_file_pages))  # Remove duplicates


def get_full_image_url(file_page_url):
    """Get the actual image URL from a file page."""
    soup = get_page(file_page_url)
    if not soup:
        return None

    # Try to find the full resolution image link
    full_res = soup.find("div", class_="fullImageLink")
    if full_res:
        img = full_res.find("a")
        if img and img.get("href"):
            return urljoin(BASE_URL, img["href"])

    # Fallback: find image in fullMedia
    full_media = soup.find("div", class_="fullMedia")
    if full_media:
        link = full_media.find("a", href=True)
        if link:
            return urljoin(BASE_URL, link["href"])

    return None


def download_image(url, output_path):
    """Download an image to the specified path."""
    try:
        response = requests.get(url, headers=HEADERS, timeout=60, stream=True)
        response.raise_for_status()
        
        with open(output_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        return True
    except requests.RequestException as e:
        print(f"Error downloading {url}: {e}")
        return False


def sanitize_filename(filename):
    """Clean up filename for safe saving."""
    # Decode URL encoding
    filename = unquote(filename)
    # Remove or replace problematic characters
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Limit length
    if len(filename) > 200:
        name, ext = os.path.splitext(filename)
        filename = name[:195] + ext
    return filename


def main():
    """Main function to download all mob renders."""
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Output directory: {OUTPUT_DIR}")

    # Get all file page URLs
    print("\n=== Collecting image file pages ===")
    file_pages = get_image_urls_from_category(CATEGORY_URL)
    print(f"\nFound {len(file_pages)} file pages")

    if not file_pages:
        print("No file pages found. The wiki structure may have changed.")
        return

    # Download each image
    print("\n=== Downloading images ===")
    downloaded = 0
    skipped = 0
    failed = 0

    for i, file_page in enumerate(file_pages, 1):
        # Extract filename from URL
        filename = file_page.split("/w/File:")[-1]
        filename = sanitize_filename(filename)
        output_path = os.path.join(OUTPUT_DIR, filename)

        # Skip if already exists
        if os.path.exists(output_path):
            print(f"[{i}/{len(file_pages)}] Skipped (exists): {filename}")
            skipped += 1
            continue

        print(f"[{i}/{len(file_pages)}] Processing: {filename}")

        # Get full image URL
        image_url = get_full_image_url(file_page)
        if not image_url:
            print(f"  Could not find image URL")
            failed += 1
            continue

        # Download
        if download_image(image_url, output_path):
            print(f"  Downloaded successfully")
            downloaded += 1
        else:
            failed += 1

        time.sleep(DELAY_BETWEEN_REQUESTS)

    print(f"\n=== Summary ===")
    print(f"Downloaded: {downloaded}")
    print(f"Skipped (already existed): {skipped}")
    print(f"Failed: {failed}")
    print(f"Total: {len(file_pages)}")


if __name__ == "__main__":
    main()
