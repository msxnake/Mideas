/**
 * @fileoverview Z80 ASM generation for MSX2 Boss Room Lock runtime
 *
 * Generates ASM routines for:
 * - Barrier animation (line-by-line rendering)
 * - Player movement lock/unlock during barrier setup
 * - Dialogue execution before reconnecting input
 * - Barrier cleanup on boss defeat
 */

interface RoomLockConfig {
  hasBarrier: boolean;
  isAnimated: boolean;
  hasPalette: boolean;
  hasDialogue: boolean;
  dialogueAssetId?: string;
}

/**
 * Generate Z80 ASM routine to render barrier tiles line-by-line.
 * Called once when boss enters room. Animates barrier closing from top to bottom.
 */
export function generateBarrierRenderAsm(config: RoomLockConfig): string {
  if (!config.hasBarrier) return '';

  const label = config.isAnimated ? 'render_barrier_animated' : 'render_barrier_instant';

  if (config.isAnimated) {
    return `
; @mideas:block id=boss_barrier_render_animated kind=routine owner=boss_roomlock preserve=false
${label}:
  push af
  push bc
  push de
  push hl

  ; B = number of rows to draw (24 for typical 256x192)
  ld b, 24
  ; HL = barrier tile VRAM address (row 512 = #8000 in VRAM)
  ld hl, 0x8000 + (512 * 16)  ; VRAM row 512 start

.line_loop:
  ; Copy one row of barrier tiles (32 chars = 256 pixels)
  ; Call into BIOS or custom LDIRVM
  push bc
  ld bc, 32  ; 32 tiles per row
  ld de, barrier_tile_pattern
  call LDIRVM  ; Copy pattern data to VRAM

  pop bc

  ; Wait for V-blank sync before next line
  halt

  ; Advance HL to next row
  add hl, 16  ; next row in VRAM

  djnz .line_loop

  pop hl
  pop de
  pop bc
  pop af
  ret
; @mideas:endblock id=boss_barrier_render_animated
`;
  } else {
    // Instant render: all tiles at once
    return `
; @mideas:block id=boss_barrier_render_instant kind=routine owner=boss_roomlock preserve=false
${label}:
  push af
  push bc
  push hl
  push de

  ; Copy entire barrier to VRAM in one operation
  ld hl, 0x8000 + (512 * 16)  ; VRAM row 512
  ld de, barrier_tile_pattern
  ld bc, 768  ; 24 rows * 32 tiles

  call LDIRVM  ; Copy all at once

  pop de
  pop hl
  pop bc
  pop af
  ret
; @mideas:endblock id=boss_barrier_render_instant
`;
  }
}

/**
 * Generate routine to lock player movement before barrier setup.
 * Prevents input from affecting player position during animation/dialogue.
 */
export function generatePlayerLockAsm(): string {
  return `
; @mideas:block id=boss_player_lock kind=routine owner=boss_roomlock preserve=false
lock_player_movement:
  push af
  push hl

  ; Set player movement lock flag (1 = locked, 0 = unlocked)
  ld hl, player_movement_locked
  ld (hl), 1

  pop hl
  pop af
  ret
; @mideas:endblock id=boss_player_lock
`;
}

/**
 * Generate routine to unlock player movement after barrier/dialogue complete.
 */
export function generatePlayerUnlockAsm(): string {
  return `
; @mideas:block id=boss_player_unlock kind=routine owner=boss_roomlock preserve=false
unlock_player_movement:
  push af
  push hl

  ; Clear player movement lock flag
  ld hl, player_movement_locked
  ld (hl), 0

  pop hl
  pop af
  ret
; @mideas:endblock id=boss_player_unlock
`;
}

/**
 * Generate routine to show dialogue before reconnecting player input.
 * Calls dialogue system; waits for completion.
 */
export function generateDialogueShowAsm(dialogueAssetId: string): string {
  if (!dialogueAssetId) return '';

  return `
; @mideas:block id=boss_show_dialogue kind=routine owner=boss_roomlock preserve=false
show_boss_dialogue:
  push af
  push bc
  push hl

  ; Load dialogue asset ID
  ld hl, dialogue_asset_table
  ; Lookup ${dialogueAssetId} in table (stub: assume A = dialogue index)
  ld a, 0  ; TODO: resolve dialogue asset to index

  ; Call dialogue display routine
  ; (Framework-specific; this is a placeholder)
  call display_dialogue

  ; Poll for dialogue completion
.wait_dialogue:
  ld a, (dialogue_active)
  or a
  jr nz, .wait_dialogue

  pop hl
  pop bc
  pop af
  ret
; @mideas:endblock id=boss_show_dialogue
`;
}

/**
 * Generate routine to clear barrier from VRAM when boss is defeated.
 * Also unlocks player movement.
 */
export function generateBarrierCleanupAsm(): string {
  return `
; @mideas:block id=boss_barrier_cleanup kind=routine owner=boss_roomlock preserve=false
clear_barrier_on_defeat:
  push af
  push bc
  push de
  push hl

  ; Fill barrier area in VRAM with spaces (tile 0)
  ld hl, 0x8000 + (512 * 16)  ; VRAM row 512
  ld bc, 768  ; 24 rows * 32 tiles
  xor a       ; A = 0 (space/empty tile)

.clear_loop:
  ld (hl), a
  inc hl
  dec bc
  ld a, b
  or c
  jr nz, .clear_loop

  ; Unlock player movement
  call unlock_player_movement

  pop hl
  pop de
  pop bc
  pop af
  ret
; @mideas:endblock id=boss_barrier_cleanup
`;
}

/**
 * Generate the complete Room Lock entry flow:
 * 1. Lock player
 * 2. Render barrier (animated or instant)
 * 3. Show dialogue (if configured)
 * 4. Unlock player
 */
export function generateBossRoomLockEntryFlow(config: RoomLockConfig): string {
  const parts: string[] = [
    '; @mideas:block id=boss_room_lock_entry kind=routine owner=boss_roomlock preserve=false',
    'boss_room_lock_entry:',
    '  push af',
    '  push hl',
    '',
    '  ; Step 1: Lock player movement during barrier setup',
    '  call lock_player_movement',
    '',
  ];

  if (config.hasBarrier) {
    parts.push('  ; Step 2: Render barrier tiles');
    if (config.isAnimated) {
      parts.push('  call render_barrier_animated  ; Line-by-line animation');
    } else {
      parts.push('  call render_barrier_instant  ; All at once');
    }
    parts.push('');
  }

  if (config.hasDialogue && config.dialogueAssetId) {
    parts.push('  ; Step 3: Show boss intro dialogue');
    parts.push('  call show_boss_dialogue');
    parts.push('');
  }

  parts.push('  ; Step 4: Reconnect player movement');
  parts.push('  call unlock_player_movement');
  parts.push('');
  parts.push('  pop hl');
  parts.push('  pop af');
  parts.push('  ret');
  parts.push('; @mideas:endblock id=boss_room_lock_entry');

  return parts.join('\n');
}

/**
 * Generate variable declarations needed for Room Lock runtime.
 */
export function generateRoomLockVariables(): string {
  return `
; @mideas:block id=boss_room_lock_vars kind=variables owner=boss_roomlock preserve=false
; Player movement lock flag (1=locked, 0=unlocked)
player_movement_locked     EQU #C380

; Barrier tile pattern data (populated from atlas at build time)
barrier_tile_pattern       EQU #E000

; Dialogue system flags
dialogue_active            EQU #C381
dialogue_asset_table       EQU #E100

; @mideas:endblock id=boss_room_lock_vars
`;
}

/**
 * Assemble all Room Lock ASM routines into a single block.
 */
export function generateAllRoomLockAsm(config: RoomLockConfig): string {
  const asm: string[] = [];

  asm.push('; ==============================================');
  asm.push('; MSX2 Boss Room Lock Runtime - Z80 ASM');
  asm.push('; ==============================================');
  asm.push('');

  asm.push(generateRoomLockVariables());
  asm.push('');

  asm.push(generatePlayerLockAsm());
  asm.push('');

  asm.push(generatePlayerUnlockAsm());
  asm.push('');

  if (config.hasBarrier) {
    asm.push(generateBarrierRenderAsm(config));
    asm.push('');
    asm.push(generateBarrierCleanupAsm());
    asm.push('');
  }

  if (config.hasDialogue && config.dialogueAssetId) {
    asm.push(generateDialogueShowAsm(config.dialogueAssetId));
    asm.push('');
  }

  asm.push(generateBossRoomLockEntryFlow(config));
  asm.push('');

  asm.push('; End of Room Lock routines');
  asm.push('');

  return asm.join('\n');
}
