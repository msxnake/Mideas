"""
Tile Collision Bug Analysis - Visual Report
============================================
This script generates PNG diagrams to visualize the tile collision bug in MSX ASM output.

BUG: Tile collisions don't work in MSX ROM, but work in React Preview
ROOT CAUSE: Screen layout pointer is never initialized when screens load
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import numpy as np

# Create figure with subplots
fig = plt.figure(figsize=(16, 12))
fig.suptitle('Tile Collision System Bug Analysis', fontsize=16, fontweight='bold')

# ============================================================================
# DIAGRAM 1: Current (Broken) System Flow
# ============================================================================
ax1 = plt.subplot(2, 2, 1)
ax1.set_xlim(0, 10)
ax1.set_ylim(0, 12)
ax1.axis('off')
ax1.set_title('CURRENT (BROKEN) System Flow', fontsize=14, fontweight='bold', color='red')

# Screen loading (without pointer initialization)
box1 = FancyBboxPatch((0.5, 9), 4, 1.5, boxstyle="round,pad=0.1",
                       edgecolor='red', facecolor='#ffcccc', linewidth=2)
ax1.add_patch(box1)
ax1.text(2.5, 9.75, 'load_screen_pantalla1()\nLoads VRAM data ONLY',
         ha='center', va='center', fontsize=9, fontweight='bold')

# Missing initialization step
arrow1 = FancyArrowPatch((2.5, 9), (2.5, 7.5), arrowstyle='->',
                        mutation_scale=20, color='red', linewidth=2, linestyle='dashed')
ax1.add_patch(arrow1)
ax1.text(5, 8.25, 'MISSING!', ha='center', va='center', fontsize=10,
         color='red', fontweight='bold', bbox=dict(boxstyle='round', facecolor='yellow'))

# Uninitialized pointers
box2 = FancyBboxPatch((0.5, 5.5), 4, 1.5, boxstyle="round,pad=0.1",
                       edgecolor='red', facecolor='#ffcccc', linewidth=2)
ax1.add_patch(box2)
ax1.text(2.5, 6.25, 'current_screen_layout = ???\ncurrent_behavior_map = ???',
         ha='center', va='center', fontsize=9, fontweight='bold')

# Entity movement
arrow2 = FancyArrowPatch((2.5, 5.5), (2.5, 4), arrowstyle='->',
                        mutation_scale=20, color='red', linewidth=2)
ax1.add_patch(arrow2)

box3 = FancyBboxPatch((0.5, 2), 4, 1.5, boxstyle="round,pad=0.1",
                       edgecolor='red', facecolor='#ffcccc', linewidth=2)
ax1.add_patch(box3)
ax1.text(2.5, 2.75, 'update_wallcollision_component\nCalls get_tile_at_position()',
         ha='center', va='center', fontsize=9, fontweight='bold')

# Read from uninitialized pointer
arrow3 = FancyArrowPatch((4.5, 2.75), (5.5, 2.75), arrowstyle='->',
                        mutation_scale=20, color='red', linewidth=2)
ax1.add_patch(arrow3)

box4 = FancyBboxPatch((5.5, 2), 4, 1.5, boxstyle="round,pad=0.1",
                       edgecolor='red', facecolor='#ffcccc', linewidth=2)
ax1.add_patch(box4)
ax1.text(7.5, 2.75, 'ld de, (current_screen_layout)\nReads garbage/zero!\n💥 CRASH/WRONG DATA',
         ha='center', va='center', fontsize=9, fontweight='bold', color='darkred')

ax1.text(2.5, 0.5, 'RESULT: Player passes through walls',
         ha='center', va='center', fontsize=11, fontweight='bold',
         color='red', bbox=dict(boxstyle='round', facecolor='#ffcccc', edgecolor='red', linewidth=2))

# ============================================================================
# DIAGRAM 2: Fixed System Flow
# ============================================================================
ax2 = plt.subplot(2, 2, 2)
ax2.set_xlim(0, 10)
ax2.set_ylim(0, 12)
ax2.axis('off')
ax2.set_title('FIXED System Flow', fontsize=14, fontweight='bold', color='green')

# Screen loading (WITH pointer initialization)
box1 = FancyBboxPatch((0.5, 9), 4, 1.5, boxstyle="round,pad=0.1",
                       edgecolor='green', facecolor='#ccffcc', linewidth=2)
ax2.add_patch(box1)
ax2.text(2.5, 9.75, 'load_screen_pantalla1()\nLoads VRAM data',
         ha='center', va='center', fontsize=9, fontweight='bold')

# Pointer initialization (NEW STEP)
arrow1 = FancyArrowPatch((2.5, 9), (2.5, 7.5), arrowstyle='->',
                        mutation_scale=20, color='green', linewidth=2)
ax2.add_patch(arrow1)
ax2.text(5, 8.25, 'ADDED!', ha='center', va='center', fontsize=10,
         color='green', fontweight='bold', bbox=dict(boxstyle='round', facecolor='lightgreen'))

# Initialize pointers
box2 = FancyBboxPatch((0.5, 5.5), 4, 1.5, boxstyle="round,pad=0.1",
                       edgecolor='green', facecolor='#ccffcc', linewidth=2)
ax2.add_patch(box2)
ax2.text(2.5, 6.25, 'ld hl, SCREEN_PANTALLA1_0_LAYOUT\nld (current_screen_layout), hl',
         ha='center', va='center', fontsize=9, fontweight='bold')

# Entity movement
arrow2 = FancyArrowPatch((2.5, 5.5), (2.5, 4), arrowstyle='->',
                        mutation_scale=20, color='green', linewidth=2)
ax2.add_patch(arrow2)

box3 = FancyBboxPatch((0.5, 2), 4, 1.5, boxstyle="round,pad=0.1",
                       edgecolor='green', facecolor='#ccffcc', linewidth=2)
ax2.add_patch(box3)
ax2.text(2.5, 2.75, 'update_wallcollision_component\nCalls get_tile_at_position()',
         ha='center', va='center', fontsize=9, fontweight='bold')

# Read from initialized pointer
arrow3 = FancyArrowPatch((4.5, 2.75), (5.5, 2.75), arrowstyle='->',
                        mutation_scale=20, color='green', linewidth=2)
ax2.add_patch(arrow3)

box4 = FancyBboxPatch((5.5, 2), 4, 1.5, boxstyle="round,pad=0.1",
                       edgecolor='green', facecolor='#ccffcc', linewidth=2)
ax2.add_patch(box4)
ax2.text(7.5, 2.75, 'ld de, (current_screen_layout)\nReads correct tile data!\n✓ CORRECT',
         ha='center', va='center', fontsize=9, fontweight='bold', color='darkgreen')

ax2.text(2.5, 0.5, 'RESULT: Collisions work correctly!',
         ha='center', va='center', fontsize=11, fontweight='bold',
         color='green', bbox=dict(boxstyle='round', facecolor='#ccffcc', edgecolor='green', linewidth=2))

# ============================================================================
# DIAGRAM 3: Memory Layout & Data Flow
# ============================================================================
ax3 = plt.subplot(2, 2, 3)
ax3.set_xlim(0, 12)
ax3.set_ylim(0, 10)
ax3.axis('off')
ax3.set_title('Memory & Data Structure', fontsize=14, fontweight='bold')

# ROM data
box_rom = FancyBboxPatch((0.5, 7), 3.5, 2.5, boxstyle="round,pad=0.1",
                         edgecolor='blue', facecolor='#cce5ff', linewidth=2)
ax3.add_patch(box_rom)
ax3.text(2.25, 8.8, 'ROM DATA (#4000+)', ha='center', va='center', fontsize=10, fontweight='bold')
ax3.text(2.25, 8.3, 'SCREEN_PANTALLA1_0_LAYOUT:', ha='center', va='center', fontsize=8)
ax3.text(2.25, 7.9, 'DB #00,#00,...,#80,#81,...', ha='center', va='center', fontsize=8, family='monospace')
ax3.text(2.25, 7.5, '(768 bytes: tile IDs)', ha='center', va='center', fontsize=8)

box_behavior = FancyBboxPatch((0.5, 4), 3.5, 2.5, boxstyle="round,pad=0.1",
                              edgecolor='blue', facecolor='#cce5ff', linewidth=2)
ax3.add_patch(box_behavior)
ax3.text(2.25, 5.8, 'BEHAVIOR_PANTALLA1_0_DATA:', ha='center', va='center', fontsize=8)
ax3.text(2.25, 5.4, 'DB #00,#00,#20,#20,...', ha='center', va='center', fontsize=8, family='monospace')
ax3.text(2.25, 5.0, '(768 bytes: collision flags)', ha='center', va='center', fontsize=8)
ax3.text(2.25, 4.5, '#20 = 32 = TILE_SOLID', ha='center', va='center', fontsize=8, color='red', fontweight='bold')

# RAM pointers
box_ram = FancyBboxPatch((5, 7), 3.5, 2.5, boxstyle="round,pad=0.1",
                         edgecolor='orange', facecolor='#fff5cc', linewidth=2)
ax3.add_patch(box_ram)
ax3.text(6.75, 8.8, 'RAM POINTERS (#C000+)', ha='center', va='center', fontsize=10, fontweight='bold')
ax3.text(6.75, 8.3, 'current_screen_layout:', ha='center', va='center', fontsize=8)
ax3.text(6.75, 7.9, 'EQU #C009  ; 16-bit', ha='center', va='center', fontsize=8, family='monospace')
ax3.text(6.75, 7.5, 'MUST point to ROM layout!', ha='center', va='center', fontsize=8, color='red', fontweight='bold')

box_ram2 = FancyBboxPatch((5, 4), 3.5, 2.5, boxstyle="round,pad=0.1",
                          edgecolor='orange', facecolor='#fff5cc', linewidth=2)
ax3.add_patch(box_ram2)
ax3.text(6.75, 5.8, 'current_behavior_map:', ha='center', va='center', fontsize=8)
ax3.text(6.75, 5.4, 'EQU #C00B  ; 16-bit', ha='center', va='center', fontsize=8, family='monospace')
ax3.text(6.75, 5.0, 'OPTIONAL (unused)', ha='center', va='center', fontsize=8)
ax3.text(6.75, 4.5, 'Uses lookup table instead', ha='center', va='center', fontsize=8)

# Arrow showing required initialization
arrow_init = FancyArrowPatch((4, 8.25), (5, 8.25), arrowstyle='->',
                            mutation_scale=20, color='red', linewidth=3)
ax3.add_patch(arrow_init)
ax3.text(4.5, 8.6, 'MUST COPY', ha='center', va='center', fontsize=9,
         color='red', fontweight='bold', bbox=dict(boxstyle='round', facecolor='yellow'))

# Tile behavior lookup table
box_table = FancyBboxPatch((9, 5.5), 2.5, 3, boxstyle="round,pad=0.1",
                           edgecolor='purple', facecolor='#f0e5ff', linewidth=2)
ax3.add_patch(box_table)
ax3.text(10.25, 8.1, 'tile_behavior_table', ha='center', va='center', fontsize=9, fontweight='bold')
ax3.text(10.25, 7.7, '[0-127] = PASSABLE', ha='center', va='center', fontsize=7, family='monospace')
ax3.text(10.25, 7.4, '[128-255] = SOLID', ha='center', va='center', fontsize=7, family='monospace')
ax3.text(10.25, 6.9, '', ha='center', va='center', fontsize=7)
ax3.text(10.25, 6.5, 'Maps tile ID', ha='center', va='center', fontsize=7)
ax3.text(10.25, 6.2, 'to behavior flags', ha='center', va='center', fontsize=7)

# ============================================================================
# DIAGRAM 4: Code Snippets
# ============================================================================
ax4 = plt.subplot(2, 2, 4)
ax4.set_xlim(0, 10)
ax4.set_ylim(0, 10)
ax4.axis('off')
ax4.set_title('Code Fix Required', fontsize=14, fontweight='bold')

# Current code (broken)
box_broken = FancyBboxPatch((0.2, 6), 9.6, 3.5, boxstyle="round,pad=0.1",
                            edgecolor='red', facecolor='#ffeeee', linewidth=2)
ax4.add_patch(box_broken)
ax4.text(5, 9.2, '❌ CURRENT CODE (screensGenerator.ts line ~422)',
         ha='center', va='center', fontsize=10, fontweight='bold', color='red')

code_broken = """load_screen_pantalla1_764187751187:
    ; Set VDP colors
    ld a, 1
    ld b, 1
    call set_screen_colors
    ; Load screen to VRAM
    ld hl, SCREEN_PANTALLA1_0_LAYOUT + 96
    ld de, NAMETBL + 96
    ld bc, 672
    call FAST_LDIRVM
    ret                    ; ← MISSING POINTER INIT!"""

ax4.text(5, 7.5, code_broken, ha='left', va='top', fontsize=7,
         family='monospace', bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))

# Fixed code
box_fixed = FancyBboxPatch((0.2, 0.5), 9.6, 5, boxstyle="round,pad=0.1",
                           edgecolor='green', facecolor='#eeffee', linewidth=2)
ax4.add_patch(box_fixed)
ax4.text(5, 5.2, '✓ FIXED CODE (add these lines)',
         ha='center', va='center', fontsize=10, fontweight='bold', color='green')

code_fixed = """load_screen_pantalla1_764187751187:
    ; Set VDP colors
    ld a, 1
    ld b, 1
    call set_screen_colors
    ; Load screen to VRAM
    ld hl, SCREEN_PANTALLA1_0_LAYOUT + 96
    ld de, NAMETBL + 96
    ld bc, 672
    call FAST_LDIRVM

    ; ▼▼▼ ADD THESE 4 LINES ▼▼▼
    ld hl, SCREEN_PANTALLA1_0_LAYOUT    ; Get screen data address
    ld (current_screen_layout), hl      ; Store in pointer
    ; (Optional: set current_behavior_map if using behavior map approach)
    ret"""

ax4.text(5, 2.8, code_fixed, ha='left', va='top', fontsize=7,
         family='monospace', bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))

plt.tight_layout()
plt.savefig('C:/Users/salam/Documents/Programacion/Mideas/tile_collision_bug_report.png',
            dpi=150, bbox_inches='tight')
print("[OK] Generated: tile_collision_bug_report.png")

# ============================================================================
# SECOND DIAGRAM: Tile Behavior Table vs Behavior Map
# ============================================================================
fig2 = plt.figure(figsize=(14, 10))
fig2.suptitle('Tile Collision: Two Approaches Explained', fontsize=16, fontweight='bold')

ax1 = plt.subplot(1, 2, 1)
ax1.set_xlim(0, 10)
ax1.set_ylim(0, 12)
ax1.axis('off')
ax1.set_title('APPROACH 1: Tile Behavior Lookup Table (CURRENT)', fontsize=12, fontweight='bold')

# Step 1: Screen layout
box1 = FancyBboxPatch((0.5, 9.5), 4, 1.2, boxstyle="round,pad=0.1",
                      edgecolor='blue', facecolor='#e6f2ff', linewidth=2)
ax1.add_patch(box1)
ax1.text(2.5, 10.1, 'SCREEN_LAYOUT', ha='center', va='center', fontsize=10, fontweight='bold')
ax1.text(2.5, 9.7, '[0][0]=0x80 (tile ID 128)', ha='center', va='center', fontsize=8, family='monospace')

# Step 2: Get tile ID
arrow1 = FancyArrowPatch((2.5, 9.5), (2.5, 8.2), arrowstyle='->',
                        mutation_scale=20, color='black', linewidth=2)
ax1.add_patch(arrow1)
ax1.text(4, 8.8, 'Read tile ID\nat position', ha='center', va='center', fontsize=8)

box2 = FancyBboxPatch((0.5, 7), 4, 1, boxstyle="round,pad=0.1",
                      edgecolor='blue', facecolor='#e6f2ff', linewidth=2)
ax1.add_patch(box2)
ax1.text(2.5, 7.5, 'tile_id = 0x80 (128)', ha='center', va='center', fontsize=9, family='monospace')

# Step 3: Lookup in table
arrow2 = FancyArrowPatch((2.5, 7), (2.5, 5.7), arrowstyle='->',
                        mutation_scale=20, color='black', linewidth=2)
ax1.add_patch(arrow2)
ax1.text(4, 6.3, 'Use as index', ha='center', va='center', fontsize=8)

box3 = FancyBboxPatch((0.5, 3.5), 4, 2, boxstyle="round,pad=0.1",
                      edgecolor='purple', facecolor='#f5e6ff', linewidth=2)
ax1.add_patch(box3)
ax1.text(2.5, 5.2, 'tile_behavior_table:', ha='center', va='center', fontsize=10, fontweight='bold')
ax1.text(2.5, 4.8, '[0-127] = 0x00 (PASSABLE)', ha='center', va='center', fontsize=8, family='monospace')
ax1.text(2.5, 4.4, '[128-255] = 0x01 (SOLID)', ha='center', va='center', fontsize=8, family='monospace')
ax1.text(2.5, 4.0, 'table[128] = SOLID ✓', ha='center', va='center', fontsize=8,
         family='monospace', color='green', fontweight='bold')

# Step 4: Result
arrow3 = FancyArrowPatch((2.5, 3.5), (2.5, 2.2), arrowstyle='->',
                        mutation_scale=20, color='green', linewidth=2)
ax1.add_patch(arrow3)

box4 = FancyBboxPatch((0.5, 0.5), 4, 1.5, boxstyle="round,pad=0.1",
                      edgecolor='green', facecolor='#e6ffe6', linewidth=2)
ax1.add_patch(box4)
ax1.text(2.5, 1.25, 'RESULT: SOLID\nBlock movement ✓', ha='center', va='center',
         fontsize=10, fontweight='bold', color='green')

# Pros/Cons
ax1.text(7, 10.5, 'PROS:', ha='left', va='top', fontsize=9, fontweight='bold', color='green')
ax1.text(7, 10, '✓ Simple lookup', ha='left', va='top', fontsize=8)
ax1.text(7, 9.6, '✓ Fast (O(1))', ha='left', va='top', fontsize=8)
ax1.text(7, 9.2, '✓ Small code', ha='left', va='top', fontsize=8)

ax1.text(7, 8, 'CONS:', ha='left', va='top', fontsize=9, fontweight='bold', color='red')
ax1.text(7, 7.6, '✗ All tiles with', ha='left', va='top', fontsize=8)
ax1.text(7.2, 7.3, 'same ID have', ha='left', va='top', fontsize=8)
ax1.text(7.2, 7.0, 'same behavior', ha='left', va='top', fontsize=8)
ax1.text(7, 6.6, '✗ Can\'t customize', ha='left', va='top', fontsize=8)
ax1.text(7.2, 6.3, 'per-instance', ha='left', va='top', fontsize=8)

# ============================================================================
# APPROACH 2: Behavior Map
# ============================================================================
ax2 = plt.subplot(1, 2, 2)
ax2.set_xlim(0, 10)
ax2.set_ylim(0, 12)
ax2.axis('off')
ax2.set_title('APPROACH 2: Behavior Map (ALTERNATIVE)', fontsize=12, fontweight='bold')

# Step 1: Calculate position
box1 = FancyBboxPatch((0.5, 9.5), 4, 1.2, boxstyle="round,pad=0.1",
                      edgecolor='blue', facecolor='#e6f2ff', linewidth=2)
ax2.add_patch(box1)
ax2.text(2.5, 10.1, 'Position (x=10, y=80)', ha='center', va='center', fontsize=10, fontweight='bold')
ax2.text(2.5, 9.7, 'tile_x=1, tile_y=10', ha='center', va='center', fontsize=8, family='monospace')

# Step 2: Calculate index
arrow1 = FancyArrowPatch((2.5, 9.5), (2.5, 8.2), arrowstyle='->',
                        mutation_scale=20, color='black', linewidth=2)
ax2.add_patch(arrow1)
ax2.text(4.5, 8.8, 'index = y*32+x', ha='center', va='center', fontsize=8)

box2 = FancyBboxPatch((0.5, 7), 4, 1, boxstyle="round,pad=0.1",
                      edgecolor='blue', facecolor='#e6f2ff', linewidth=2)
ax2.add_patch(box2)
ax2.text(2.5, 7.5, 'index = 10*32+1 = 321', ha='center', va='center', fontsize=9, family='monospace')

# Step 3: Read behavior map
arrow2 = FancyArrowPatch((2.5, 7), (2.5, 5.7), arrowstyle='->',
                        mutation_scale=20, color='black', linewidth=2)
ax2.add_patch(arrow2)
ax2.text(4.5, 6.3, 'Read from map', ha='center', va='center', fontsize=8)

box3 = FancyBboxPatch((0.5, 3.5), 4, 2, boxstyle="round,pad=0.1",
                      edgecolor='orange', facecolor='#fff5e6', linewidth=2)
ax2.add_patch(box3)
ax2.text(2.5, 5.2, 'BEHAVIOR_MAP (768 bytes):', ha='center', va='center', fontsize=10, fontweight='bold')
ax2.text(2.5, 4.8, '[0]=0x00 (passable)', ha='center', va='center', fontsize=8, family='monospace')
ax2.text(2.5, 4.4, '...', ha='center', va='center', fontsize=8)
ax2.text(2.5, 4.0, '[321]=0x20 (SOLID) ✓', ha='center', va='center', fontsize=8,
         family='monospace', color='green', fontweight='bold')

# Step 4: Result
arrow3 = FancyArrowPatch((2.5, 3.5), (2.5, 2.2), arrowstyle='->',
                        mutation_scale=20, color='green', linewidth=2)
ax2.add_patch(arrow3)

box4 = FancyBboxPatch((0.5, 0.5), 4, 1.5, boxstyle="round,pad=0.1",
                      edgecolor='green', facecolor='#e6ffe6', linewidth=2)
ax2.add_patch(box4)
ax2.text(2.5, 1.25, 'RESULT: SOLID\nBlock movement ✓', ha='center', va='center',
         fontsize=10, fontweight='bold', color='green')

# Pros/Cons
ax2.text(7, 10.5, 'PROS:', ha='left', va='top', fontsize=9, fontweight='bold', color='green')
ax2.text(7, 10, '✓ Per-tile custom', ha='left', va='top', fontsize=8)
ax2.text(7.2, 9.7, 'behavior', ha='left', va='top', fontsize=8)
ax2.text(7, 9.3, '✓ Same tile ID can', ha='left', va='top', fontsize=8)
ax2.text(7.2, 9.0, 'be solid or not', ha='left', va='top', fontsize=8)
ax2.text(7, 8.6, '✓ Screen Editor', ha='left', va='top', fontsize=8)
ax2.text(7.2, 8.3, 'collision layer', ha='left', va='top', fontsize=8)

ax2.text(7, 7, 'CONS:', ha='left', va='top', fontsize=9, fontweight='bold', color='red')
ax2.text(7, 6.6, '✗ Uses 768 bytes', ha='left', va='top', fontsize=8)
ax2.text(7.2, 6.3, 'RAM per screen', ha='left', va='top', fontsize=8)
ax2.text(7, 5.9, '✗ Slower (2 reads)', ha='left', va='top', fontsize=8)
ax2.text(7, 5.5, '✗ Must copy data', ha='left', va='top', fontsize=8)
ax2.text(7.2, 5.2, 'to RAM', ha='left', va='top', fontsize=8)

plt.tight_layout()
plt.savefig('C:/Users/salam/Documents/Programacion/Mideas/tile_collision_approaches.png',
            dpi=150, bbox_inches='tight')
print("[OK] Generated: tile_collision_approaches.png")

print("\n" + "="*70)
print("TILE COLLISION BUG ANALYSIS COMPLETE")
print("="*70)
print("\nGenerated 2 PNG files:")
print("  1. tile_collision_bug_report.png - Problem visualization")
print("  2. tile_collision_approaches.png - Two collision methods explained")
print("\nView these images to understand the bug and its fix!")
