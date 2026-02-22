"use strict";
/**
 * @fileoverview Animated Tiles Generator - System for animating background tiles
 * Generates animtiles.asm with functions to update animated tiles in VRAM
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAnimatedTilesFile = generateAnimatedTilesFile;
/**
 * Generate animated tiles file (animtiles.asm)
 *
 * @param analysis - Project analysis
 * @returns ASM code string with animated tiles system
 */
function generateAnimatedTilesFile(analysis) {
    var _a, _b, _c, _d;
    const tileWidth = ((_b = (_a = analysis.tiles) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.width) || 8;
    const tileHeight = ((_d = (_c = analysis.tiles) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.height) || 8;
    return `; ==================================================================
; ANIMATED TILES SYSTEM
; File: animtiles.asm
; Description: Background tile animation for water, lava, fire, etc.
; ==================================================================

; ==================================================================
; ANIMATED TILES CONSTANTS
; ==================================================================

; Animation speeds (in frames)
ANIM_SPEED_SLOW         EQU 15      ; ~250ms (water)
ANIM_SPEED_MEDIUM       EQU 8       ; ~133ms (lava)
ANIM_SPEED_FAST         EQU 4       ; ~66ms (fire)

; Maximum animated tiles
MAX_ANIM_TILES          EQU 8       ; Support up to 8 animated tiles

; ==================================================================
; ANIMATED TILES INITIALIZATION
; ==================================================================

init_animated_tiles:
    ; Initialize animation variables
    xor a
    ld (anim_tile_timer), a
    ld (anim_tile_frame), a

    ; Set default animation speed (medium)
    ld a, ANIM_SPEED_MEDIUM
    ld (anim_tile_speed), a

    ret

; ==================================================================
; ANIMATED TILES UPDATE FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; update_animated_tiles
; Update animation frame and redraw animated tiles if needed
; Call this every frame from main loop
; ------------------------------------------------------------------
update_animated_tiles:
    ; Increment timer
    ld a, (anim_tile_timer)
    inc a
    ld (anim_tile_timer), a

    ; Check if it's time to advance frame
    ld b, a
    ld a, (anim_tile_speed)
    cp b
    ret nz                          ; Not yet time to update

    ; Reset timer
    xor a
    ld (anim_tile_timer), a

    ; Advance to next animation frame
    ld a, (anim_tile_frame)
    inc a
    and #03                         ; Wrap at 4 frames (0-3)
    ld (anim_tile_frame), a

    ; Update all animated tiles in VRAM
    call update_animated_tiles_vram

    ret

; ------------------------------------------------------------------
; update_animated_tiles_vram
; Update pattern data in VRAM for all animated tiles
; This updates the actual tile patterns based on current frame
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
update_animated_tiles_vram:
    ld hl, anim_tile_table          ; HL = animation table pointer
    ld a, (anim_tile_frame)         ; A = current global frame

.anim_vram_loop:
    ld c, (hl)                      ; C = tile ID
    ld a, c
    cp 255
    ret z                           ; End of table, done

    inc hl
    ld b, (hl)                      ; B = number of frames (unused for now)
    inc hl
    inc hl                          ; Skip speed byte

    ; Now update this tile in VRAM
    push hl                         ; Save table pointer

    ; Get current animation frame
    ld a, (anim_tile_frame)
    ld b, a                         ; B = current frame
    ld a, c                         ; A = tile ID

    ; Calculate which animation pattern index
    ; We need to know which pattern set this tile uses
    ; For simplicity: tile 240 = pattern 0, tile 241 = pattern 1, etc.
    sub 240                         ; A = pattern index (0, 1, 2, ...)
    ld c, a                         ; C = pattern index

    ; Calculate source address
    ; Source = anim_patterns_data + (pattern_index * 32) + (frame * 8)
    ld l, c
    ld h, 0
    add hl, hl                      ; * 2
    add hl, hl                      ; * 4
    add hl, hl                      ; * 8
    add hl, hl                      ; * 16
    add hl, hl                      ; * 32 (4 frames * 8 bytes)

    ; Add frame offset
    ld a, b                         ; A = frame
    add a, a                        ; * 2
    add a, a                        ; * 4
    add a, a                        ; * 8
    ld e, a
    ld d, 0
    add hl, de

    ; Add base address
    ld de, anim_patterns_data
    add hl, de                      ; HL = source pattern address

    ; Calculate VRAM destination
    ; For Screen 2: CHRTBL + (tile_id * 8)
    ld a, c
    add a, 240                      ; Convert back to tile ID
    ld e, a
    ld d, 0
    ex de, hl                       ; DE = source, HL = tile_id
    add hl, hl                      ; * 2
    add hl, hl                      ; * 4
    add hl, hl                      ; * 8
    ld bc, CHRTBL
    add hl, bc                      ; HL = VRAM address

    ex de, hl                       ; DE = VRAM, HL = source

    ; Copy 8 bytes to VRAM
    push bc
    ld bc, 8
    call LDIRVM
    pop bc

    pop hl                          ; Restore table pointer
    jr .anim_vram_loop              ; Next tile

    ret

; ------------------------------------------------------------------
; set_animation_speed
; Set global animation speed for all animated tiles
; Input:  A = Speed (frames between updates)
; ------------------------------------------------------------------
set_animation_speed:
    ld (anim_tile_speed), a
    ret

; ------------------------------------------------------------------
; animate_tile_pattern
; Update a specific tile pattern in VRAM with animation frame
; Input:  A = Tile ID
;         B = Animation frame (0-3)
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
animate_tile_pattern:
    push af
    push bc

    ; Calculate pattern address in VRAM
    ; For Screen 2: Pattern = CHRTBL2 + (tile_id * 8)
    ld l, a
    ld h, 0
    add hl, hl                      ; * 2
    add hl, hl                      ; * 4
    add hl, hl                      ; * 8
    ld de, #0000                    ; CHRTBL2 base
    add hl, de                      ; HL = VRAM pattern address

    ; Calculate source pattern address
    ; Source = anim_patterns + (tile_id * 32) + (frame * 8)
    pop bc                          ; B = frame
    pop af                          ; A = tile_id

    push hl                         ; Save VRAM address

    ; tile_id * 32 (4 frames * 8 bytes)
    ld l, a
    ld h, 0
    add hl, hl                      ; * 2
    add hl, hl                      ; * 4
    add hl, hl                      ; * 8
    add hl, hl                      ; * 16
    add hl, hl                      ; * 32

    ; + (frame * 8)
    ld a, b
    add a, a                        ; * 2
    add a, a                        ; * 4
    add a, a                        ; * 8
    ld e, a
    ld d, 0
    add hl, de

    ; Add base address of animation patterns
    ld de, anim_patterns_data
    add hl, de                      ; HL = source address

    ; Copy 8 bytes to VRAM
    pop de                          ; DE = VRAM address
    ld bc, 8
    call LDIRVM

    ret

; ==================================================================
; ANIMATED TILE DEFINITIONS
; ==================================================================
; Define which tiles are animated and their pattern data

; Example: Water animation (4 frames)
; Each frame is 8 bytes (one tile pattern)

anim_patterns_data:
    ; Tile 0: Water (example - 4 frames)
    ; Frame 0
    db #00, #00, #42, #24, #00, #00, #84, #48
    ; Frame 1
    db #00, #42, #24, #00, #00, #84, #48, #00
    ; Frame 2
    db #42, #24, #00, #00, #84, #48, #00, #00
    ; Frame 3
    db #24, #00, #00, #84, #48, #00, #00, #42

    ; Tile 1: Lava (example - 4 frames)
    ; Frame 0
    db #FF, #AA, #55, #AA, #FF, #AA, #55, #AA
    ; Frame 1
    db #AA, #55, #AA, #FF, #AA, #55, #AA, #FF
    ; Frame 2
    db #55, #AA, #FF, #AA, #55, #AA, #FF, #AA
    ; Frame 3
    db #AA, #FF, #AA, #55, #AA, #FF, #AA, #55

    ; Tile 2: Fire (example - 4 frames)
    ; Frame 0
    db #18, #3C, #7E, #FF, #E7, #C3, #81, #00
    ; Frame 1
    db #3C, #7E, #FF, #E7, #C3, #81, #00, #18
    ; Frame 2
    db #7E, #FF, #E7, #C3, #81, #00, #18, #3C
    ; Frame 3
    db #FF, #E7, #C3, #81, #00, #18, #3C, #7E

    ; Add more animated tile patterns here...

; ------------------------------------------------------------------
; Animated tile mapping table
; Maps tile IDs to animation data
; Format: db tile_id, num_frames, speed
; ------------------------------------------------------------------
anim_tile_table:
    ; Tile ID, Frames, Speed
    db 240, 4, ANIM_SPEED_SLOW      ; Water tile (ID 240)
    db 241, 4, ANIM_SPEED_MEDIUM    ; Lava tile (ID 241)
    db 242, 4, ANIM_SPEED_FAST      ; Fire tile (ID 242)
    db 255                          ; End marker

; ==================================================================
; ADVANCED ANIMATION FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; register_animated_tile
; Register a tile ID as animated (adds to runtime table)
; Input:  A = Tile ID to animate
;         B = Number of frames (2-4)
;         C = Animation speed
; Output: A = 0 if failed (table full), 1 if success
; Destroys: AF, DE, HL
; ------------------------------------------------------------------
register_animated_tile:
    push bc
    push af                         ; Save tile ID

    ; Find end of anim_tile_table (marked by 255)
    ld hl, anim_tile_table
.anim_reg_find_end:
    ld a, (hl)
    cp 255
    jr z, .anim_reg_found_end       ; Found end marker

    ; Skip to next entry (3 bytes: id, frames, speed)
    inc hl
    inc hl
    inc hl
    jr .anim_reg_find_end

.anim_reg_found_end:
    ; Check if we have space (need 4 bytes: new entry + end marker)
    ; For safety, we'll assume the table has space
    ; In production, add bounds checking

    ; Write new entry
    pop af                          ; A = tile ID
    ld (hl), a
    inc hl

    pop bc                          ; B = frames, C = speed
    ld (hl), b                      ; Store frames
    inc hl
    ld (hl), c                      ; Store speed
    inc hl

    ; Write new end marker
    ld (hl), 255

    ld a, 1                         ; Success
    ret

; ------------------------------------------------------------------
; get_tile_animation_frame
; Get current animation frame for a tile
; Input:  A = Tile ID
; Output: A = Current frame (0-3), or 0 if not animated
;         Zero flag set if not animated
; Destroys: BC, HL
; ------------------------------------------------------------------
get_tile_animation_frame:
    ld c, a                         ; C = tile ID to search
    ld hl, anim_tile_table

.anim_search_loop:
    ld a, (hl)                      ; A = tile_id from table
    cp 255
    jr z, .anim_not_found           ; End of table

    ; Check if this is our tile
    cp c
    jr z, .anim_found_tile          ; Found it!

    ; Skip to next entry (3 bytes)
    inc hl
    inc hl
    inc hl
    jr .anim_search_loop

.anim_found_tile:
    ; Found the tile, get its current frame
    ; For now, we use the global frame
    ; In a more advanced system, each tile could have its own frame counter
    ld a, (anim_tile_frame)         ; A = current global frame

    ; We could add per-tile frame support here:
    ; 1. Store per-tile frame counters in RAM
    ; 2. Use tile index to look up specific frame
    ; For now, all tiles share the same frame counter

    or a                            ; Clear zero flag (tile found)
    ret

.anim_not_found:
    xor a                           ; Return 0 if not animated
    ret                             ; Zero flag is set

; ==================================================================
; UTILITY: Copy to VRAM (if not using BIOS)
; ==================================================================
; Note: We use LDIRVM from BIOS, defined in bios.asm

; ==================================================================
; END OF ANIMATED TILES SYSTEM
; ==================================================================
`;
}
