#!/usr/bin/env python3
"""Extract sprite pixel data from Pacman project"""
import json

# Load project
with open(r'C:\Users\salam\Documents\Programacion\Mideas\Examples\pacman_reply(35).json', 'r', encoding='utf-8') as f:
    project = json.load(f)

# Find sprite
assets = project.get('assets', [])
sprites = [a for a in assets if a.get('type') == 'sprite']

print("=" * 60)
print("SPRITE DATA EXTRACTION")
print("=" * 60)

for sprite in sprites:
    sprite_name = sprite.get('name', 'unnamed')
    sprite_data = sprite.get('data', {})
    frames = sprite_data.get('frames', [])
    bg_color = sprite_data.get('backgroundColor', '#000000')

    print(f"\nSprite: {sprite_name}")
    print(f"Background color: {bg_color}")
    print(f"Frame count: {len(frames)}")

    for i, frame in enumerate(frames):
        pixels = frame.get('pixels', [])
        if pixels:
            print(f"\nFrame {i}:")
            print(f"  Size: {len(pixels[0])}x{len(pixels)}")
            print(f"  First 3 rows:")
            for row in pixels[:3]:
                print(f"    {row[:10]}...")
        else:
            print(f"\nFrame {i}: NO PIXEL DATA")

    # Save frame data to file
    output_file = f'sprite_{sprite_name}_data.py'
    with open(output_file, 'w', encoding='utf-8') as out:
        out.write(f"# Sprite data for {sprite_name}\n")
        out.write(f"SPRITE_NAME = '{sprite_name}'\n")
        out.write(f"BG_COLOR = '{bg_color}'\n")
        out.write(f"FRAMES = [\n")
        for frame in frames:
            pixels = frame.get('pixels', [])
            out.write(f"    {repr(pixels)},\n")
        out.write("]\n")
    print(f"\nSaved to: {output_file}")

print("\n" + "=" * 60)