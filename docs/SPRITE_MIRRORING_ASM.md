# Auto-Generated Sprite Mirroring in MSX ASM Generator

## Overview
The MSX ASM generator now automatically creates mirrored versions of sprites when they have `facingDirection` set to `'left'` or `'right'`, matching the behavior of GameFlowPreviewModal.

## How It Works

### Detection
- When generating sprite data, the system checks each sprite's `facingDirection` property
- If `facingDirection === 'left'` or `facingDirection === 'right'`, a mirrored version is auto-generated

### Mirroring Process
1. **Pixel Data Mirroring**: Each frame's pixel data is mirrored horizontally using `mirrorPixelDataHorizontally()`
   - This reverses each row: `[A, B, C, D] → [D, C, B, A]`
   - Mirrors the sprite appearance left-to-right

2. **Sprite Duplication**: Creates a new sprite object with:
   - Name: `{original_name}_MIRRORED`
   - All frames mirrored
   - Same palette and properties as original

3. **ASM Generation**: Generates complete ASM data for mirrored sprite:
   - All frames (F0, F1, F2, etc.)
   - All layers (LAYER0, LAYER1, LAYER2, LAYER3)
   - Pattern labels: `SPRITE_{index}_PATTERN_MIRRORED`

## Example Output

For a sprite named "hero" with `facingDirection: 'left'`:

```asm
; Sprite Asset 0: hero
;; Sprite: hero
;; Total Frames: 4
;; Size: 16x16
;; Background Color: #000000
;; Drawable Palette: C0=#000000, C1=#FFFFFF, C2=#42EBF5, C3=#00FF00

HERO_0_F0_LAYER0:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    ; ... more data ...

; Unified pattern label for sprite 0
SPRITE_0_PATTERN EQU HERO_0_F0_LAYER0

; Auto-generated mirrored version for hero (facing: left)
;; Sprite: hero_MIRRORED
;; Total Frames: 4
;; Size: 16x16
;; Background Color: #000000
;; Drawable Palette: C0=#000000, C1=#FFFFFF, C2=#42EBF5, C3=#00FF00

HERO_MIRRORED_0_F0_LAYER0:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    ; ... mirrored data ...

; Unified pattern label for mirrored sprite 0
SPRITE_0_PATTERN_MIRRORED EQU HERO_MIRRORED_0_F0_LAYER0
```

## Usage in Runtime

In your game code, you can switch between normal and mirrored sprites:

```asm
; Use normal sprite
ld hl, SPRITE_0_PATTERN
call load_sprite_pattern

; Use mirrored sprite (when facing opposite direction)
ld hl, SPRITE_0_PATTERN_MIRRORED
call load_sprite_pattern
```

## Benefits

1. **Automatic Generation**: No manual work needed to create mirrored sprites
2. **Consistency**: Same behavior as Mideas Play mode (GameFlowPreviewModal)
3. **Memory Efficient**: Only generates mirrored versions for sprites that need them
4. **Easy Switching**: Simple labels make runtime switching straightforward

## Parity with Mideas Play Mode

This implementation ensures **100% parity** between:
- Mideas Play mode (browser/Canvas)
- Exported MSX ROM

When a sprite faces left/right in the editor, both environments:
- Auto-generate mirrored frames
- Switch between normal/mirrored based on entity facing direction
- Use identical pixel data mirroring logic

## Technical Details

### Files Modified
- `utils/msxGenerator/generators/spritesGenerator.ts`
  - Added `mirrorPixelDataHorizontally()` function
  - Enhanced sprite generation loop to detect `facingDirection`
  - Generate mirrored sprite data when applicable

### Related Code
- Frontend: `components/modals/GameFlowPreviewModal.tsx` (lines 514-521)
- Utilities: `components/utils/spriteUtils.ts` (`mirrorPixelDataHorizontally`)

### Compatibility
- Works with all sprite sizes (8x8, 16x16, etc.)
- Supports multi-layer sprites (LAYER0-LAYER3)
- Compatible with all animation frame counts
- No impact on sprites with `facingDirection: 'neutral'`, `'up'`, or `'down'`
