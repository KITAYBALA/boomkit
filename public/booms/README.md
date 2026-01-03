# Boom Assets Directory

This directory contains SVG/PNG assets for booms (collectible creatures).

## Structure

Each boom should have an asset file named: `{boom-name-kebab-case}.svg` or `.png`

Example:
- `butterfly.svg`
- `golden-beetle.svg`
- `cosmic-mantis.svg`

## Current Status

Assets are currently using emoji placeholders. To add real assets:
1. Create SVG/PNG files for each boom
2. Update the `asset` field in `PACKS` data in `app/page.tsx`
3. Update the pack opening modal to use the asset path

## Asset Guidelines

- Keep assets simple and "blook-style" (toy/monster/creature themed)
- Recommended size: 200x200px for SVG, or 400x400px for PNG
- Use bright, vibrant colors matching rarity themes
- Ensure assets are original (not copied from Blooket)

