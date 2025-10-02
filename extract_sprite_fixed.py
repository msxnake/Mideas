#!/usr/bin/env python3
"""Extract sprite data with correct structure"""
import json

# Load project
with open(r'C:\Users\salam\Documents\Programacion\Mideas\Examples\pacman_reply(35).json', 'r', encoding='utf-8') as f:
    project = json.load(f)

# Find sprite
assets = project.get('assets', [])
sprites = [a for a in assets if a.get('type') == 'sprite']

print("=" * 60)
print("EXTRACTING SPRITE DATA (FIXED)")
print("=" * 60)

for sprite in sprites:
    sprite_name = sprite.get('name', 'unnamed')
    sprite_data = sprite.get('data', {})
    frames = sprite_data.get('frames', [])
    bg_color = sprite_data.get('backgroundColor', '#000000')
    size = sprite_data.get('size', {})
    width = size.get('width', 16)
    height = size.get('height', 16)

    print(f"\nSprite: {sprite_name}")
    print(f"Size: {width}x{height}")
    print(f"Background color: {bg_color}")
    print(f"Frame count: {len(frames)}")

    for i, frame in enumerate(frames):
        # Correct key: 'data' not 'pixels'
        pixels = frame.get('data', [])
        if pixels:
            print(f"\nFrame {i}:")
            print(f"  Size: {len(pixels[0])}x{len(pixels)} pixels")
            print(f"  Sample (first 3x10 pixels):")
            for row in pixels[:3]:
                sample = row[:10] if len(row) > 10 else row
                print(f"    {sample}")
        else:
            print(f"\nFrame {i}: NO DATA")

    # Save to Python file
    output_file = f'sprite_{sprite_name}_fixed.py'
    with open(output_file, 'w', encoding='utf-8') as out:
        out.write(f"""# Sprite: {sprite_name}
# Size: {width}x{height}
# Frames: {len(frames)}

SPRITE_DATA = {{
    'name': '{sprite_name}',
    'width': {width},
    'height': {height},
    'bg_color': '{bg_color}',
    'frames': [
""")
        for frame_idx, frame in enumerate(frames):
            pixels = frame.get('data', [])
            out.write(f"        # Frame {frame_idx}\n")
            out.write(f"        {repr(pixels)},\n")
        out.write("    ]\n")
        out.write("}\n")

    print(f"\nData saved to: {output_file}")

print("\n" + "=" * 60)