#!/usr/bin/env python3
"""Parse Pacman Mideas project and analyze structure"""
import json
import os

# Load the Pacman project
with open(r'C:\Users\salam\Documents\Programacion\Mideas\Examples\pacman_reply(35).json', 'r', encoding='utf-8') as f:
    project = json.load(f)

# Analyze structure
assets = project.get('assets', [])

sprites = [a for a in assets if a.get('type') == 'sprite']
tiles = [a for a in assets if a.get('type') == 'tile']
tilebanks = [a for a in assets if a.get('type') == 'tileBank']
screens = [a for a in assets if a.get('type') == 'screenMap']
entities = [a for a in assets if a.get('type') == 'entity']
components = [a for a in assets if a.get('type') == 'component']

print("=" * 60)
print("PACMAN PROJECT ANALYSIS")
print("=" * 60)
print(f"\nTotal assets: {len(assets)}")
print(f"  Sprites: {len(sprites)}")
print(f"  Tiles: {len(tiles)}")
print(f"  TileBanks: {len(tilebanks)}")
print(f"  ScreenMaps: {len(screens)}")
print(f"  Entities: {len(entities)}")
print(f"  Components: {len(components)}")

# List sprite names
if sprites:
    print("\nSprite assets:")
    for s in sprites[:10]:  # First 10
        name = s.get('name', 'unnamed')
        sprite_id = s.get('id', 'no-id')
        data = s.get('data', {})
        frames = len(data.get('frames', []))
        print(f"  - {name} (id: {sprite_id[:20]}..., frames: {frames})")
    if len(sprites) > 10:
        print(f"  ... and {len(sprites) - 10} more sprites")

# List tile names
if tiles:
    print("\nTile assets:")
    for t in tiles[:10]:
        name = t.get('name', 'unnamed')
        tile_id = t.get('id', 'no-id')
        print(f"  - {name} (id: {tile_id[:20]}...)")
    if len(tiles) > 10:
        print(f"  ... and {len(tiles) - 10} more tiles")

# List entity names
if entities:
    print("\nEntity assets:")
    for e in entities:
        name = e.get('name', 'unnamed')
        entity_id = e.get('id', 'no-id')
        print(f"  - {name} (id: {entity_id[:20]}...)")

# Check for game flow
game_flow = project.get('gameFlow', {})
if game_flow:
    print(f"\nGame Flow states: {len(game_flow.get('states', []))}")

print("\n" + "=" * 60)
print("Analysis complete. Ready to generate Pygame project.")
print("=" * 60)