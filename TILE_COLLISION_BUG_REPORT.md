# Tile Collision Bug Report - MSX ASM Generator

## Executive Summary

**BUG**: Tile collisions (background limits) do NOT work in MSX ASM/ROM output, but DO work correctly in React Preview mode.

**ROOT CAUSE**: The screen layout pointer `current_screen_layout` is never initialized when screens are loaded. The collision detection code tries to read from an uninitialized pointer, resulting in garbage data or crashes.

**IMPACT**: Players can walk through walls, fall through floors, and ignore all tile-based collision boundaries in the MSX ROM version.

---

## Visual Diagrams Generated

Two PNG files have been created in the project root:
1. **tile_collision_bug_report.png** - Shows the broken vs fixed system flow
2. **tile_collision_approaches.png** - Explains the two collision detection methods

---

## Detailed Analysis

### 1. Behavior Map EXISTS But Is NEVER Used

**File**: `C:\Users\salam\Downloads\nina1.asm` (or any generated ASM)

The generator DOES create behavior map data:

```asm
;; Line 5173 in nina1.asm
BEHAVIOR_PANTALLA1_0_DATA:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    ...
    DB #20,#20,#00,#00,#20,#20,#20,#20,#20,#20,#20,#20,#20,#20,#00,#00
    DB #00,#00,#20,#20,#20,#20,#20,#20,#20,#20,#20,#20,#00,#00,#20,#20
    ...
```

- `#00` = passable tile (0 = TILE_PASSABLE)
- `#20` = solid tile (32 = TILE_SOLID, defined at line 651)

**BUT**: This data is NEVER loaded into the `current_behavior_map` pointer (line 749).

---

### 2. Screen Layout Pointer Is NEVER Initialized

**File**: `C:\Users\salam\Downloads\nina1.asm`

**Line 748**: Variable is declared:
```asm
current_screen_layout   EQU #C009   ; Pointer to current screen layout data (16-bit)
```

**Line 5367-5378**: Screen loading function (load_screen_pantalla1_764187751187):
```asm
load_screen_pantalla1_764187751187:
    ; Set VDP colors FIRST (before loading screen data)
    ld a, 1           ; Background color
    ld b, 1           ; Border color
    call set_screen_colors
    ; Initialize character 0 (empty cells) with background color
    ld a, 1           ; Background color for char 0
    call init_char0_color
    ; Load ONLY game area (skip HUD rows to preserve HUD content)
    ld hl, SCREEN_PANTALLA1_0_LAYOUT + 96  ; Skip first 3 rows
    ld de, NAMETBL + 96            ; VRAM destination: start at row 3
    ld bc, 672                      ; Only 21 rows
    call FAST_LDIRVM           ; Fast VRAM write (direct port access)
    ret    ; <--- RETURNS WITHOUT SETTING current_screen_layout!
```

**PROBLEM**: The function loads the screen graphics to VRAM but NEVER sets the `current_screen_layout` pointer!

---

### 3. Collision Detection Code REQUIRES The Pointer

**File**: `C:\Users\salam\Downloads\nina1.asm`

**Line 3872**: The `get_tile_at_position` function reads from the pointer:
```asm
get_tile_at_position:
    ; ... calculate tile index in HL ...

    ; Read actual tile from current screen layout
    ld de, (current_screen_layout) ; DE = pointer to screen layout data
    add hl, de                    ; HL = pointer to tile at position
    ld a, (hl)                    ; A = tile ID from screen map
```

**PROBLEM**: If `current_screen_layout` is never initialized, `(current_screen_layout)` contains garbage (likely 0x0000), so the code reads from the wrong memory location!

---

### 4. Wall Collision Component Calls This Function

**File**: `C:\Users\salam\Downloads\nina1.asm`

**Lines 2656-2658**: Wall collision checking:
```asm
.wall_check_left:
    ; Moving left - check left tile
    ; ... calculate position ...
    call get_tile_at_position     ; A = tile ID
    call get_tile_behavior        ; A = behavior
    bit 0, a                      ; TILE_SOLID?
    jr z, .wall_left_ok
```

**RESULT**: Since `get_tile_at_position` returns garbage, `get_tile_behavior` returns wrong data, and the collision check fails!

---

## How The System SHOULD Work

### Current Approach: Tile Behavior Lookup Table

The generator uses a **lookup table approach** (simpler, faster):

1. **Screen Layout** (ROM): Contains tile IDs (0-255) for each cell
2. **Tile Behavior Table** (ROM): Maps tile ID → behavior flags
   - Indices 0-127: TILE_PASSABLE (0x00)
   - Indices 128-255: TILE_SOLID (0x01)

**Collision Check Flow**:
```
Position (x,y) → Calculate tile coords → Read tile ID from screen layout
              → Look up tile ID in behavior table → Get behavior flags
              → Check if SOLID → Block movement
```

**Key Requirement**: `current_screen_layout` MUST point to the screen layout data in ROM.

---

## The Fix

### Location: `utils/msxGenerator/generators/screensGenerator.ts`

**Around line 422-438** (for screens with HUD) and **line 442-457** (for screens without HUD):

**CURRENT CODE**:
```typescript
code += `load_screen_${screenName.toLowerCase()}${screenIdSuffix.toLowerCase()}:
    ; Set VDP colors FIRST (before loading screen data)
    ld a, ${bgColor}           ; Background color
    ld b, ${borderColor}       ; Border color
    call set_screen_colors
    ; Initialize character 0 (empty cells) with background color
    ld a, ${bgColor}           ; Background color for char 0
    call init_char0_color
    ; Load ONLY game area (skip HUD rows to preserve HUD content)
    ld hl, SCREEN_${screenName}_${index}_LAYOUT + ${hudSkipBytes}
    ld de, NAMETBL + ${hudSkipBytes}
    ld bc, ${gameAreaBytes}
    call FAST_LDIRVM
    ret
`;
```

**FIXED CODE** (add 2 lines before `ret`):
```typescript
code += `load_screen_${screenName.toLowerCase()}${screenIdSuffix.toLowerCase()}:
    ; Set VDP colors FIRST (before loading screen data)
    ld a, ${bgColor}           ; Background color
    ld b, ${borderColor}       ; Border color
    call set_screen_colors
    ; Initialize character 0 (empty cells) with background color
    ld a, ${bgColor}           ; Background color for char 0
    call init_char0_color
    ; Load ONLY game area (skip HUD rows to preserve HUD content)
    ld hl, SCREEN_${screenName}_${index}_LAYOUT + ${hudSkipBytes}
    ld de, NAMETBL + ${hudSkipBytes}
    ld bc, ${gameAreaBytes}
    call FAST_LDIRVM

    ; Initialize screen layout pointer for collision detection
    ld hl, SCREEN_${screenName}_${index}_LAYOUT
    ld (current_screen_layout), hl
    ret
`;
```

**Same fix for non-HUD screens** (around line 442):
```typescript
code += `load_screen_${screenName.toLowerCase()}${screenIdSuffix.toLowerCase()}:
    ; Set VDP colors FIRST (before loading screen data)
    ld a, ${bgColor}           ; Background color
    ld b, ${borderColor}       ; Border color
    call set_screen_colors
    ; Initialize character 0 (empty cells) with background color
    ld a, ${bgColor}           ; Background color for char 0
    call init_char0_color
    ; Now load screen layout (full 32x24)
    ld hl, SCREEN_${screenName}_${index}_LAYOUT
    ld de, NAMETBL
    ld bc, 768
    call FAST_LDIRVM

    ; Initialize screen layout pointer for collision detection
    ld hl, SCREEN_${screenName}_${index}_LAYOUT
    ld (current_screen_layout), hl
    ret
`;
```

---

## Why This Bug Exists

1. **The collision system was implemented in `componentsGenerator.ts`** (lines 3692-3782)
2. **The screen loading was implemented in `screensGenerator.ts`** (lines 422-457)
3. **These two files don't communicate** - screensGenerator doesn't know that componentsGenerator needs the pointer initialized
4. **No initialization code was added** to connect the two systems

---

## Testing The Fix

### Before Fix:
1. Load nina2.json in Mideas
2. Export to Z80 ASM (all-in-one)
3. Compile with glass.jar
4. Run in OpenMSX
5. **RESULT**: Player walks through walls ❌

### After Fix:
1. Apply the 2-line fix to screensGenerator.ts
2. Regenerate ASM from nina2.json
3. Compile with glass.jar
4. Run in OpenMSX
5. **EXPECTED**: Player collides with walls correctly ✓

---

## React Preview Comparison

**Why does React Preview work?**

The React/Canvas version likely uses a similar approach but in JavaScript:

```javascript
// Somewhere in the game loop (React/Canvas)
function checkTileCollision(x, y) {
    const tileX = Math.floor(x / TILE_WIDTH);
    const tileY = Math.floor(y / TILE_HEIGHT);
    const tileId = currentScreen.layout[tileY][tileX]; // Reads from loaded screen
    const tile = tiles.find(t => t.id === tileId);
    return tile?.logicalProperties?.isSolid || false;
}
```

The key difference: **React automatically has access to the screen data** because it's loaded in memory. The MSX ASM version needs **explicit pointer initialization** because it uses indirect addressing.

---

## Additional Notes

### Behavior Map vs Lookup Table

The generator creates BOTH:
1. **BEHAVIOR_PANTALLA1_0_DATA** (behavior map - 768 bytes per screen)
2. **tile_behavior_table** (lookup table - 256 bytes total)

**Currently ONLY the lookup table is used** (more efficient). The behavior map data exists but is unused.

**If you wanted to use the behavior map instead**:
- Would allow per-tile customization (same tile ID could be solid in one place, passable in another)
- Would require 768 bytes RAM per screen (vs 0 bytes for lookup table)
- Would be slightly slower (requires reading behavior map after reading screen layout)

**Current approach (lookup table) is better** for most games unless you need per-instance tile behavior customization.

---

## Files To Modify

### Primary Fix:
- **`utils/msxGenerator/generators/screensGenerator.ts`** (lines 422-457)
  - Add 2 lines to initialize `current_screen_layout` pointer in both HUD and non-HUD screen loading functions

### Optional (if using behavior map approach):
- **`utils/msxGenerator/generators/screensGenerator.ts`**
  - Also initialize `current_behavior_map` pointer
- **`utils/msxGenerator/generators/componentsGenerator.ts`**
  - Modify `get_tile_behavior` to read from behavior map instead of lookup table

---

## Verification Checklist

After applying the fix, verify:

- [ ] Regenerate ASM from nina2.json
- [ ] Check that `load_screen_*` functions include the 2 new lines
- [ ] Compile successfully with glass.jar
- [ ] Run in OpenMSX
- [ ] Player STOPS at walls (can't walk through)
- [ ] Player STOPS at screen edges
- [ ] Gravity works correctly with platforms
- [ ] Compare behavior with React Preview (should be identical)

---

## Summary

**Bug**: Tile collision doesn't work in MSX ROM
**Cause**: `current_screen_layout` pointer never initialized
**Fix**: Add 2 lines to `screensGenerator.ts` screen loading functions
**Impact**: CRITICAL - affects all games with tile collision
**Effort**: MINIMAL - 2 lines of code per screen loading function
**Risk**: LOW - only adds pointer initialization, doesn't change existing logic

---

**Generated**: 2026-02-12
**Project**: Mideas MSX
**Files Analyzed**:
- `C:\Users\salam\Downloads\nina2.json` (510KB)
- `C:\Users\salam\Downloads\nina1.asm` (12,379 lines)
- `utils/msxGenerator/generators/componentsGenerator.ts` (3,700+ lines)
- `utils/msxGenerator/generators/screensGenerator.ts` (500+ lines)
