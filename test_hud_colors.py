import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

# Create figure with comparison between Before and After
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 8))

# Common properties
text = "SCORE: 000000"
box_width = 12
box_height = 2

# BEFORE (Screen Editor = Red, Play Mode = Blue)
ax1.set_xlim(0, 15)
ax1.set_ylim(0, 10)
ax1.set_title("BEFORE: Inconsistent Colors", fontsize=14, fontweight='bold', color='red')

# Screen Editor box (red text)
rect1 = patches.Rectangle((1, 6), box_width, box_height, linewidth=2, edgecolor='gray', facecolor='black')
ax1.add_patch(rect1)
ax1.text(7, 7, text, ha='center', va='center', fontsize=10, color='red', fontweight='bold')
ax1.text(7, 5, "Screen Editor", ha='center', va='center', fontsize=9, color='gray')

# Play Mode box (blue text)
rect2 = patches.Rectangle((1, 2), box_width, box_height, linewidth=2, edgecolor='gray', facecolor='black')
ax1.add_patch(rect2)
ax1.text(7, 3, text, ha='center', va='center', fontsize=10, color='blue', fontweight='bold')
ax1.text(7, 1, "Play Mode", ha='center', va='center', fontsize=9, color='gray')

# JSON configuration box
ax1.text(7, 9, 'JSON: "textColor": "#FFFFFF"', ha='center', va='center', fontsize=10,
         bbox=dict(boxstyle="round,pad=0.3", facecolor='lightblue', alpha=0.7))

ax1.set_aspect('equal')
ax1.axis('off')

# AFTER (Both = White)
ax2.set_xlim(0, 15)
ax2.set_ylim(0, 10)
ax2.set_title("AFTER: Consistent Colors", fontsize=14, fontweight='bold', color='green')

# Screen Editor box (white text)
rect3 = patches.Rectangle((1, 6), box_width, box_height, linewidth=2, edgecolor='gray', facecolor='black')
ax2.add_patch(rect3)
ax2.text(7, 7, text, ha='center', va='center', fontsize=10, color='white', fontweight='bold')
ax2.text(7, 5, "Screen Editor", ha='center', va='center', fontsize=9, color='gray')

# Play Mode box (white text)
rect4 = patches.Rectangle((1, 2), box_width, box_height, linewidth=2, edgecolor='gray', facecolor='black')
ax2.add_patch(rect4)
ax2.text(7, 3, text, ha='center', va='center', fontsize=10, color='white', fontweight='bold')
ax2.text(7, 1, "Play Mode", ha='center', va='center', fontsize=9, color='gray')

# JSON configuration box
ax2.text(7, 9, 'JSON: "textColor": "#FFFFFF"', ha='center', va='center', fontsize=10,
         bbox=dict(boxstyle="round,pad=0.3", facecolor='lightgreen', alpha=0.7))

# Checkmark
ax2.text(13, 7, "✓", ha='center', va='center', fontsize=30, color='green', fontweight='bold')

ax2.set_aspect('equal')
ax2.axis('off')

plt.tight_layout()
plt.savefig('hud_color_fix_comparison.png', dpi=150, bbox_inches='tight')
plt.show()

# Create a detailed technical diagram of the fix
fig, ax = plt.subplots(1, 1, figsize=(14, 10))
ax.set_xlim(0, 14)
ax.set_ylim(0, 12)
ax.set_title("HUD Color Fix - Technical Implementation", fontsize=16, fontweight='bold')

# JSON Element box
json_box = patches.Rectangle((1, 9.5), 4, 2, linewidth=2, edgecolor='blue', facecolor='lightblue', alpha=0.3)
ax.add_patch(json_box)
ax.text(3, 10.5, 'HUD Element\n"textColor": "#FFFFFF"\n"textBackgroundColor": "transparent"',
        ha='center', va='center', fontsize=9, fontweight='bold')

# msxFontRenderer.ts modifications
renderer_box = patches.Rectangle((6.5, 9), 6, 2.5, linewidth=2, edgecolor='green', facecolor='lightgreen', alpha=0.3)
ax.add_patch(renderer_box)
ax.text(9.5, 10.25, 'msxFontRenderer.ts\n+ renderUnifiedTextToDataURL()\n+ customTextColor?: string\n+ customBackgroundColor?: string',
        ha='center', va='center', fontsize=9, fontweight='bold')

# ScreenGrid.tsx arrow and box
ax.arrow(3, 9.3, 0, -1.5, head_width=0.2, head_length=0.1, fc='purple', ec='purple')
screengrid_box = patches.Rectangle((1, 6.5), 4, 1.5, linewidth=2, edgecolor='purple', facecolor='plum', alpha=0.3)
ax.add_patch(screengrid_box)
ax.text(3, 7.25, 'ScreenGrid.tsx\nExtract hudTextColor &\nhudBackgroundColor',
        ha='center', va='center', fontsize=9, fontweight='bold')

# ScreenPlayModal.tsx arrow and box
ax.arrow(10, 9, 0, -1.5, head_width=0.2, head_length=0.1, fc='orange', ec='orange')
screenplay_box = patches.Rectangle((8, 6.5), 4, 1.5, linewidth=2, edgecolor='orange', facecolor='moccasin', alpha=0.3)
ax.add_patch(screenplay_box)
ax.text(10, 7.25, 'ScreenPlayModal.tsx\nUpdate createTileBasedFont()\n& renderMSX1TextToDataURL()',
        ha='center', va='center', fontsize=9, fontweight='bold')

# Before/After comparison
before_box = patches.Rectangle((1, 3.5), 5, 2, linewidth=2, edgecolor='red', facecolor='mistyrose', alpha=0.5)
ax.add_patch(before_box)
ax.text(3.5, 4.5, 'BEFORE\nHardcoded colors:\n#FF0000 (red) & #000000 (black)',
        ha='center', va='center', fontsize=10, fontweight='bold', color='red')

after_box = patches.Rectangle((8, 3.5), 5, 2, linewidth=2, edgecolor='green', facecolor='lightgreen', alpha=0.5)
ax.add_patch(after_box)
ax.text(10.5, 4.5, 'AFTER\nDynamic colors from\nHUD element configuration',
        ha='center', va='center', fontsize=10, fontweight='bold', color='green')

# Result
result_box = patches.Rectangle((3.5, 0.5), 7, 2, linewidth=3, edgecolor='darkgreen', facecolor='honeydew', alpha=0.7)
ax.add_patch(result_box)
ax.text(7, 1.5, 'RESULT\nBoth Screen Editor and Play Mode\nshow SCORE: 000000 in WHITE\nas configured in JSON',
        ha='center', va='center', fontsize=11, fontweight='bold', color='darkgreen')

# Arrows showing flow
ax.arrow(3.5, 6.3, 0, -0.5, head_width=0.2, head_length=0.1, fc='black', ec='black')
ax.arrow(10, 6.3, 0, -0.5, head_width=0.2, head_length=0.1, fc='black', ec='black')
ax.arrow(6.2, 3.5, 1.3, 0, head_width=0.15, head_length=0.2, fc='darkgreen', ec='darkgreen')
ax.arrow(7, 3.3, 0, -0.5, head_width=0.2, head_length=0.1, fc='darkgreen', ec='darkgreen')

ax.axis('off')
plt.tight_layout()
plt.savefig('hud_color_fix_technical.png', dpi=150, bbox_inches='tight')
plt.show()

print("Imagenes generadas:")
print("- hud_color_fix_comparison.png - Comparacion visual antes/despues")
print("- hud_color_fix_technical.png - Diagrama tecnico de la implementacion")