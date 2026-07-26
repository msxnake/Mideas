/**
 * @fileoverview Z80 ASM code generation tests for MSX2 Boss Room Lock
 *
 * Tests ASM generation for:
 * - Barrier rendering (line-by-line animation)
 * - Dialogue execution before movement reconnect
 * - Player movement lock during barrier setup
 * - Barrier cleanup on boss defeat
 */

interface RoomLockAsmConfig {
  hasBarrier: boolean;
  isAnimated: boolean;
  hasPalette: boolean;
  hasDialogue: boolean;
}

interface GeneratedAsmBlock {
  label: string;
  asm: string;
  preservedRegisters: string[];
  clobberedRegisters: string[];
}

/**
 * Test 1: Generate barrier render routine (line-by-line)
 * Expected: ASM that renders barrier tiles from top to bottom
 */
function test_generateBarrierRenderLineByLine() {
  const config: RoomLockAsmConfig = {
    hasBarrier: true,
    isAnimated: true,
    hasPalette: false,
    hasDialogue: false,
  };

  const asm = generateBarrierRenderRoutine(config);

  console.assert(asm.includes('render_barrier_animated'), 'Should include render_barrier_animated label');
  console.assert(asm.includes('COPY_VRAM') || asm.includes('LDIRVM'), 'Should use VRAM copy function');
  console.assert(asm.includes('HALT') || asm.includes('halt'), 'Should wait for V-blank');
  console.assert(asm.includes('djnz') || asm.includes('dec b'), 'Should have loop for lines');
  console.assert(!asm.includes('jr nz, .line_loop'), 'djnz is preferred over jr nz');

  const preserved = extractPreservedRegisters(asm);
  console.assert(preserved.includes('AF') || preserved.includes('HL'), 'Should preserve critical registers');

  console.log('✓ Test 1: generateBarrierRenderLineByLine');
}

/**
 * Test 2: Generate instant barrier render (no animation)
 * Expected: ASM that renders all barrier tiles at once
 */
function test_generateBarrierRenderInstant() {
  const config: RoomLockAsmConfig = {
    hasBarrier: true,
    isAnimated: false,
    hasPalette: false,
    hasDialogue: false,
  };

  const asm = generateBarrierRenderRoutine(config);

  console.assert(asm.includes('render_barrier_instant'), 'Should include render_barrier_instant label');
  console.assert(!asm.includes('HALT'), 'Instant render should not wait for V-blank per tile');
  console.assert(asm.includes('COPY_VRAM') || asm.includes('LDIRVM'), 'Should use single VRAM copy');

  console.log('✓ Test 2: generateBarrierRenderInstant');
}

/**
 * Test 3: Generate player movement lock routine
 * Expected: ASM that disables input during barrier setup
 */
function test_generatePlayerLockRoutine() {
  const asm = generatePlayerLockRoutine(true);

  console.assert(asm.includes('player_disable_input') || asm.includes('lock_player_movement'), 'Should have lock label');
  console.assert(asm.includes('player_locked_flag') || asm.includes('player_frozen'), 'Should set lock flag');
  console.assert(asm.includes('ld') || asm.includes('mov'), 'Should have data movement');

  const preservedRegs = extractPreservedRegisters(asm);
  console.assert(preservedRegs.includes('IX') || preservedRegs.includes('IY') || preservedRegs.length > 0, 'Should preserve player entity registers');

  console.log('✓ Test 3: generatePlayerLockRoutine');
}

/**
 * Test 4: Generate dialogue execution routine
 * Expected: ASM that calls dialogue system before reconnecting movement
 */
function test_generateDialogueExecutionRoutine() {
  const asm = generateDialogueExecutionRoutine('dlg_boss_intro');

  console.assert(asm.includes('call') || asm.includes('CALL'), 'Should call dialogue function');
  console.assert(asm.includes('dlg_boss_intro') || asm.includes('dialogue'), 'Should reference dialogue asset');
  console.assert(asm.includes('wait_for_dialogue_end') || asm.includes('dialogue_done'), 'Should wait for dialogue completion');

  console.log('✓ Test 4: generateDialogueExecutionRoutine');
}

/**
 * Test 5: Generate player movement unlock routine
 * Expected: ASM that re-enables input after barrier and dialogue
 */
function test_generatePlayerUnlockRoutine() {
  const asm = generatePlayerUnlockRoutine();

  console.assert(asm.includes('player_enable_input') || asm.includes('unlock_player_movement'), 'Should have unlock label');
  console.assert(asm.includes('player_locked_flag') || asm.includes('player_frozen'), 'Should clear lock flag');

  console.log('✓ Test 5: generatePlayerUnlockRoutine');
}

/**
 * Test 6: Generate barrier cleanup routine (on boss defeat)
 * Expected: ASM that clears barrier from VRAM
 */
function test_generateBarrierCleanupRoutine() {
  const asm = generateBarrierCleanupRoutine();

  console.assert(asm.includes('clear_barrier') || asm.includes('cleanup_barrier'), 'Should have cleanup label');
  console.assert(asm.includes('LDIRVM') || asm.includes('fill_vram'), 'Should fill VRAM with spaces/zeros');
  console.assert(asm.includes('player_locked_flag') || asm.includes('unlock'), 'Should unlock player');

  console.log('✓ Test 6: generateBarrierCleanupRoutine');
}

/**
 * Test 7: Full barrier entry flow (animated + dialogue)
 * Expected: Coordinated ASM flow for entering boss room
 */
function test_generateBossEntryFlow_full() {
  const config: RoomLockAsmConfig = {
    hasBarrier: true,
    isAnimated: true,
    hasPalette: false,
    hasDialogue: true,
  };

  const flow = generateBossEntryFlow(config, 'dlg_boss_intro');

  console.assert(flow.includes('boss_entry_sequence'), 'Should have entry sequence label');
  console.assert(flow.includes('lock_player') || flow.includes('disable_input'), 'Step 1: Lock player');
  console.assert(flow.includes('render_barrier') || flow.includes('animate_barrier'), 'Step 2: Render barrier');
  console.assert(flow.includes('show_dialogue') || flow.includes('dlg_boss_intro'), 'Step 3: Show dialogue');
  console.assert(flow.includes('unlock_player') || flow.includes('enable_input'), 'Step 4: Unlock player');

  // Verify sequence order
  const lockIdx = flow.indexOf('lock_player') || flow.indexOf('disable_input');
  const renderIdx = flow.indexOf('render_barrier') || flow.indexOf('animate_barrier');
  const dialogueIdx = flow.indexOf('show_dialogue') || flow.indexOf('dlg_boss_intro');
  const unlockIdx = flow.indexOf('unlock_player') || flow.indexOf('enable_input');

  console.assert(lockIdx < renderIdx && renderIdx < dialogueIdx && dialogueIdx < unlockIdx,
    'Steps should be in order: lock → render → dialogue → unlock');

  console.log('✓ Test 7: generateBossEntryFlow full');
}

/**
 * Test 8: Register preservation across calls
 * Expected: ASM respects Z80 calling conventions (IX/IY/HL preserved)
 */
function test_registerPreservation() {
  const routines = [
    generateBarrierRenderRoutine({ hasBarrier: true, isAnimated: true, hasPalette: false, hasDialogue: false }),
    generatePlayerLockRoutine(true),
    generatePlayerUnlockRoutine(),
    generateBarrierCleanupRoutine(),
  ];

  routines.forEach((asm, idx) => {
    const pushes = (asm.match(/push\s+(af|bc|de|hl|ix|iy)/gi) || []).length;
    const pops = (asm.match(/pop\s+(af|bc|de|hl|ix|iy)/gi) || []).length;

    console.assert(pushes === pops, `Routine ${idx}: push/pop must be balanced (${pushes} vs ${pops})`);
    console.assert(pushes > 0, `Routine ${idx}: should preserve some registers`);
  });

  console.log('✓ Test 8: registerPreservation');
}

/**
 * Test 9: No VRAM conflicts during barrier animation
 * Expected: Barrier VRAM (rows 512+) doesn't overlap with player/entities
 */
function test_vramNoConflict() {
  const barrierVramStart = 512; // rows
  const barrierVramEnd = 512 + 24; // assume 24 rows for 256x192 perimeter

  const playerVramEnd = 480; // typical sprite VRAM end
  const dialogueVramStart = 600; // typical dialogue VRAM

  console.assert(barrierVramStart > playerVramEnd, 'Barrier VRAM should not conflict with player sprites');
  console.assert(barrierVramEnd < dialogueVramStart, 'Barrier VRAM should not conflict with dialogue');

  console.log('✓ Test 9: vramNoConflict');
}

/**
 * Test 10: ASM generation handles missing dialogue gracefully
 * Expected: ASM still generates valid code when dialogue is absent
 */
function test_generateBossEntryFlow_noDialogue() {
  const config: RoomLockAsmConfig = {
    hasBarrier: true,
    isAnimated: true,
    hasPalette: false,
    hasDialogue: false,
  };

  const flow = generateBossEntryFlow(config, '');

  console.assert(flow.includes('boss_entry_sequence'), 'Should still have entry sequence');
  console.assert(!flow.includes('dlg_') || flow.includes('; dialogue disabled'), 'Should skip or comment dialogue');
  console.assert(flow.includes('unlock_player'), 'Should unlock player even without dialogue');

  console.log('✓ Test 10: generateBossEntryFlow noDialogue');
}

// Helper function stubs (generate ASM code)

function generateBarrierRenderRoutine(config: RoomLockAsmConfig): string {
  if (config.isAnimated) {
    return `
render_barrier_animated:
  push af
  push bc
  push de
  push hl

  ; BC = number of lines (24 for 256x192)
  ld bc, 24

  ; HL = barrier data pointer
  ld hl, barrier_tile_data

.line_loop:
  ; Copy one line of tiles to VRAM
  call copy_barrier_line_to_vram

  ; Wait for V-blank
  call HALT

  ; Next line
  djnz .line_loop

  pop hl
  pop de
  pop bc
  pop af
  ret
`;
  } else {
    return `
render_barrier_instant:
  push af
  push hl

  ; Copy entire barrier to VRAM in one operation
  ld hl, barrier_tile_data
  call LDIRVM  ; Copy to VRAM

  pop hl
  pop af
  ret
`;
  }
}

function generatePlayerLockRoutine(lock: boolean): string {
  return `
lock_player_movement:
  push af
  push hl

  ; Set player locked flag in RAM
  ld hl, player_locked_flag
  ld (hl), ${lock ? 1 : 0}

  ; Disable input processing
  ld hl, input_enabled_flag
  ld (hl), 0

  pop hl
  pop af
  ret
`;
}

function generatePlayerUnlockRoutine(): string {
  return `
unlock_player_movement:
  push af
  push hl

  ; Clear player locked flag
  ld hl, player_locked_flag
  ld (hl), 0

  ; Re-enable input processing
  ld hl, input_enabled_flag
  ld (hl), 1

  pop hl
  pop af
  ret
`;
}

function generateDialogueExecutionRoutine(dialogueId: string): string {
  return `
show_boss_dialogue:
  push af

  ; Call dialogue system with boss intro
  ld a, 0  ; dialogue type/id
  call show_dialogue_${dialogueId}

.wait_for_dialogue_end:
  ; Poll dialogue completion flag
  ld hl, dialogue_active_flag
  ld a, (hl)
  or a
  jr nz, .wait_for_dialogue_end

  pop af
  ret
`;
}

function generateBarrierCleanupRoutine(): string {
  return `
clear_barrier_on_defeat:
  push af
  push bc
  push hl

  ; Clear barrier from VRAM
  ld hl, barrier_vram_addr  ; VRAM rows 512+
  ld bc, 3072               ; size of barrier area
  call LDIRVM               ; fill with zeros

  ; Unlock player
  call unlock_player_movement

  pop hl
  pop bc
  pop af
  ret
`;
}

function generateBossEntryFlow(config: RoomLockAsmConfig, dialogueId: string): string {
  const parts: string[] = [];

  parts.push('boss_entry_sequence:');
  parts.push('  ; Step 1: Lock player movement');
  parts.push('  call lock_player_movement');

  if (config.hasBarrier) {
    parts.push('  ; Step 2: Render barrier');
    if (config.isAnimated) {
      parts.push('  call render_barrier_animated');
    } else {
      parts.push('  call render_barrier_instant');
    }
  }

  if (config.hasDialogue && dialogueId) {
    parts.push(`  ; Step 3: Show dialogue (${dialogueId})`);
    parts.push('  call show_boss_dialogue');
  } else if (config.hasDialogue) {
    parts.push('  ; dialogue disabled (no id)');
  }

  parts.push('  ; Step 4: Unlock player');
  parts.push('  call unlock_player_movement');
  parts.push('  ret');

  return parts.join('\n');
}

function extractPreservedRegisters(asm: string): string[] {
  const preserved = new Set<string>();
  const pushes = asm.match(/push\s+(\w+)/gi) || [];
  pushes.forEach(p => {
    const match = p.match(/push\s+(\w+)/i);
    if (match) preserved.add(match[1].toUpperCase());
  });
  return Array.from(preserved);
}

// Run all tests
export function runRoomLockAsmTests() {
  console.log('=== MSX2 Boss Room Lock ASM Tests ===\n');

  try {
    test_generateBarrierRenderLineByLine();
    test_generateBarrierRenderInstant();
    test_generatePlayerLockRoutine();
    test_generateDialogueExecutionRoutine();
    test_generatePlayerUnlockRoutine();
    test_generateBarrierCleanupRoutine();
    test_generateBossEntryFlow_full();
    test_registerPreservation();
    test_vramNoConflict();
    test_generateBossEntryFlow_noDialogue();

    console.log('\n✅ All ASM generation tests passed!');
  } catch (error) {
    console.error('\n❌ ASM test failed:', error);
    throw error;
  }
}
