#!/usr/bin/env node
/**
 * MSX2 boss Room Lock (chain barrier) contract + Z80 validity checks.
 *
 * Part A pins the chain barrier that actually ships: the perimeter walk that
 * seals only EMPTY cells, its collision marker, and the lifecycle that raises
 * it after the mandatory auto-walk prelude and drops it on defeat.
 *
 * Part B scans every ASM line the boss generator emits for instructions the
 * Z80 does not have and for literals Glass cannot parse. This exists because a
 * parallel barrier was once added that used `call LDIRVM` (bitmap rooms paint
 * with V9938 commands, so the symbol is not defined here), `add hl, 16` and
 * `0x8000` literals. Glass only reported the first one, at assembly time.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const read = (...parts) => readFileSync(join(repoRoot, ...parts), 'utf8').replace(/\r\n/g, '\n');

const bossGen = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2BitmapBossGenerator.ts');
const roomGen = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2Screen5BitmapRoomGenerator.ts');
const bossEditor = read('components', 'editors', 'Msx2BossEditor.tsx');
const atlasEntries = read('utils', 'msx2AtlasEntries.ts');

// ---------------------------------------------------------------- Part A ---
// The shipping chain barrier. These are the pieces a rewrite must not drop.
const contractChecks = [
  [
    'Barrier raise/drop entry points exist',
    bossGen.includes('bitmap_boss_barrier_apply:') &&
      bossGen.includes('bitmap_boss_barrier_remove:') &&
      bossGen.includes('bitmap_boss_barrier_walk:'),
  ],
  [
    'Perimeter is walked as two rows + two columns (not a full-screen blit)',
    bossGen.includes('bitmap_boss_barrier_row:') &&
      bossGen.includes('bitmap_boss_barrier_col:') &&
      bossGen.includes('bitmap_boss_barrier_cell:'),
  ],
  [
    'Barrier is raised after the intro prelude and dropped on boss defeat',
    bossGen.includes('INTRO_OP_CLOSE_BARRIER') &&
      bossGen.includes('bitmap_boss_intro_start_barrier:') &&
      bossGen.includes('call bitmap_boss_barrier_remove'),
  ],
  [
    'Sealed cells use the #80 marker so only empty cells are restored later',
    bossGen.includes('boss_barrier_draw') && /#80/.test(bossGen),
  ],
  [
    'Barrier RAM is chained off the generator base, never a hardcoded address',
    bossGen.includes('barrierRamBase') &&
      bossGen.includes('boss_barrier_draw EQU ${asmWord(barrierRamBase)'),
  ],
  [
    'Barrier tables stay opt-in (byte-identical ROM when no barrier tile)',
    bossGen.includes('const hasBarrier = (data.barrierTables || []).some'),
  ],
  // The player enters THROUGH the perimeter, so on room load they stand on a
  // cell the chain wants to seal (top entry puts them on row 0, side entries on
  // col 0 / col 15). Sealing it buried them inside a solid tile.
  [
    'A cell the player occupies is never sealed',
    bossGen.includes('call bitmap_player_overlaps_16') &&
      bossGen.includes('.cell_seal') &&
      bossGen.includes('ld (boss_barrier_pending), a'),
  ],
  [
    'The player overlap test preserves the caller loop counter (push/pop bc)',
    /push bc[\s\S]{0,400}?call bitmap_player_overlaps_16[\s\S]{0,40}?pop bc/.test(bossGen),
  ],
  [
    'Skipped openings are retried until the player steps clear',
    bossGen.includes('boss_barrier_pending EQU') &&
      bossGen.includes('boss_barrier_retry EQU') &&
      bossGen.includes('.no_barrier_resweep'),
  ],
  [
    'Barrier RAM block was resized for the two new bytes',
    bossGen.includes('barrierRamBase + (hasBarrier ? 7 : 0)') &&
      !bossGen.includes('(hasBarrier ? 5 : 0)'),
  ],
  [
    'Ordered Room Lock steps compile to per-room bytecode',
    bossGen.includes('function buildIntroStream') &&
      bossGen.includes('introStreams: perRoom.map(entry => entry.intro)') &&
      bossGen.includes('bitmap_boss_intro_ptr_table'),
  ],
  [
    'Rooms without a Boss share one compact Room Lock END stream',
    bossGen.includes('const introStreamIsEmpty =') &&
      bossGen.includes('bitmap_boss_intro_empty:') &&
      bossGen.includes("introStreamIsEmpty(stream) ? 'bitmap_boss_intro_empty'"),
  ],
  [
    'Every live boss intro starts with the mandatory auto-walk flag',
    bossGen.includes('boss_intro_auto_move EQU') &&
      bossGen.includes('ld (boss_intro_auto_move), a') &&
      bossGen.includes('ld a, 5') &&
      bossGen.includes('ld (boss_intro_state), a') &&
      bossGen.includes('const hasIntro = data.roomTables.some'),
  ],
  [
    'Legacy bosses without a sequence defer their barrier until after auto-walk',
    bossGen.includes("else if (String(params?.bossBarrierTileId || '').trim())") &&
      bossGen.includes("steps = [{ kind: 'closeBarrier', animated: false, linesPerFrame: 0xff"),
  ],
  [
    'Auto-walk target centres the configured player hitbox',
    bossGen.includes('Math.round(128 - (hit.x + hit.w / 2))') &&
      bossGen.includes('introAutoMoveTargetX'),
  ],
  [
    'Auto-walk uses normal movement/gravity and skips manual skills',
    bossGen.includes('call update_player_movement') &&
      bossGen.includes('jp .skip_player_movement') &&
      roomGen.includes('inputGateAsm: `${bossSystem.autoMoveInputAsm}${inputHooks}`') &&
      roomGen.includes('.apply_gravity:'),
  ],
  [
    'Auto-walk replaces keyboard input with horizontal-only left/right',
    bossGen.includes('ld c, #10') &&
      bossGen.includes('ld c, #80') &&
      bossGen.includes('ld c, a                    ; no horizontal/jump input on the arrival frame') &&
      bossGen.includes('call bitmap_try_move_x') &&
      !bossGen.includes('ld (player_x), a           ; final one-pixel correction'),
  ],
  [
    'Auto-walk RAM includes its flag byte AND the per-room destination',
    bossGen.includes('const INTRO_RAM_BYTES = 7') &&
      bossGen.includes('boss_intro_auto_move EQU ${asmWord(introRamBase + 5)}') &&
      bossGen.includes('boss_intro_target_x EQU ${asmWord(introRamBase + 6)}'),
  ],
  [
    'The walk-in destination is per room, not one immediate baked into the code',
    bossGen.includes('bitmap_boss_intro_entry_x_table:') &&
      bossGen.includes('ld hl, bitmap_boss_intro_entry_x_table') &&
      bossGen.includes('ld (boss_intro_target_x), a') &&
      bossGen.includes('    ld a, (boss_intro_target_x)\n    ld b, a                    ; B = this room\'s target player_x') &&
      // One byte per room: a shorter table would be indexed out of bounds.
      bossGen.includes('const introTargetXPerRoom = data.roomTables.map('),
  ],
  [
    'A boss that never authored an X still walks to the screen centre',
    bossGen.includes('const INTRO_ENTRY_X_CENTRE = 128') &&
      bossGen.includes("params.bossIntroEntryX === '' || params.bossIntroEntryX === null") &&
      bossEditor.includes('bossIntroEntryX') &&
      bossEditor.includes('value="Walk in (always)"'),
  ],
  [
    'Intro runtime has dispatch/wait/dialogue/barrier states and no seen flag',
    bossGen.includes('boss_intro_state EQU') &&
      bossGen.includes('bitmap_boss_intro_frame:') &&
      bossGen.includes('bitmap_boss_intro_dialogue_wait:') &&
      bossGen.includes('bitmap_boss_intro_barrier_frame:') &&
      !bossGen.includes('boss_intro_seen'),
  ],
  [
    'Barrier animation is a pixel raster that advances from Y=0 to Y=191',
    bossGen.includes('boss_intro_raster_y EQU') &&
      bossGen.includes('bitmap_boss_barrier_raster_line:') &&
      bossGen.includes('bitmap_boss_barrier_scanline_cell:') &&
      bossGen.includes('cp 192') &&
      bossGen.includes('ld hl, 1') &&
      bossGen.includes('ld (boss_cmd_buf + 10), hl ; NY = 1') &&
      !bossGen.includes('bitmap_boss_barrier_cell_order:'),
  ],
  [
    'Raster keeps the barrier on the perimeter instead of filling the room',
    /bitmap_boss_barrier_raster_line:[\s\S]{0,220}?or a[\s\S]{0,80}?jp z, bitmap_boss_barrier_scanline_full[\s\S]{0,80}?cp 11[\s\S]{0,80}?jp z, bitmap_boss_barrier_scanline_full/.test(bossGen) &&
      /ld b, 0[\s\S]{0,100}?call bitmap_boss_barrier_scanline_cell[\s\S]{0,100}?ld b, 15[\s\S]{0,80}?jp bitmap_boss_barrier_scanline_cell/.test(bossGen),
  ],
  [
    'Raster commits collision only when the last line of a cell appears',
    /bitmap_boss_barrier_scanline_cell:[\s\S]{0,1400}?and #0F[\s\S]{0,80}?cp 15[\s\S]{0,120}?ld a, #80[\s\S]{0,80}?ld \(hl\), a/.test(bossGen),
  ],
  [
    'Authored boss projectile sprites export every valid animation frame and delay',
    roomGen.includes('getBitmapRoomSpriteFrameIndices(sprite).map(frameIndex =>') &&
      roomGen.includes('buildHardwareSpriteLayersForFrame(') &&
      roomGen.includes('delayFrames: getBitmapRoomSpriteAnimationDelayFrames(sprite)'),
  ],
  [
    'Boss projectile animation reserves one hardware pattern group per frame',
    roomGen.includes('const bossBulletPatternGroups =') &&
      roomGen.includes('bossBulletSprite?.frames.length || 1') &&
      roomGen.includes('allocatePatternRange(bossBulletPatternGroups, roomHasBoss)') &&
      roomGen.includes('count: bossBulletPatternGroups'),
  ],
  [
    'Only animated sprite bullets pay the two-byte per-slot RAM cost',
    bossGen.includes('const BOSS_SBUL_SLOT_BYTES = hasAnimatedSpriteBullet ? 11 : 9') &&
      bossGen.includes('+9 animation frame, +10 animation tick'),
  ],
  [
    'Each live boss sprite bullet advances and wraps its own frame timer',
    bossGen.includes('ld a, (iy+10)') &&
      bossGen.includes('ld (iy+10), a') &&
      bossGen.includes('ld a, (iy+9)') &&
      bossGen.includes('ld (iy+9), a') &&
      bossGen.includes('.sb_anim_store_frame:'),
  ],
  [
    'Boss bullet SAT selects frame patterns in four-pattern increments',
    bossGen.includes(`ld a, (iy+9)
    add a, a
    add a, a                  ; one 16x16 frame = four pattern numbers`) &&
      bossGen.includes('add a, ${asmByte(sprites ? sprites.patternNumber : 0)}'),
  ],
  [
    'Animated boss bullets refresh their authored line colours per frame and slot',
    bossGen.includes('bitmap_boss_sbul_frame_colors:') &&
      bossGen.includes('frame * 16-byte line-colour table') &&
      bossGen.includes('.sb_color_slot_${i}_done:'),
  ],
  [
    'Boss bullet load uploads all frames and both spawn paths reset animation',
    bossGen.includes('ld bc, ${32 * spriteFrameCount}') &&
      (bossGen.match(/ld \(iy\+9\), a/g) || []).length >= 3 &&
      (bossGen.match(/ld \(iy\+10\), a/g) || []).length >= 3,
  ],
  [
    'Boss editor authors raster speed and explains the descending scan',
    bossEditor.includes('Raster scanlines/frame') &&
      bossEditor.includes('linesPerFrame: 4') &&
      bossEditor.includes('A horizontal pixel scan descends from Y=0 to Y=191') &&
      !bossEditor.includes('Cells per frame'),
  ],
  [
    'Boss intro opens the shared dialogue runtime',
    bossGen.includes('bitmap_boss_intro_start_dialogue:') &&
      bossGen.includes('call bitmap_dlg_open') &&
      roomGen.includes('boss intro dialogue'),
  ],
  [
    'Dialogue advances before the non-dialogue intro player-freeze gate',
    roomGen.includes('${dialogueSystem.mainLoopGateAsm}${bossSystem.playerGateAsm}'),
  ],
  [
    'Boot places the player before arming the boss intro',
    /ld \(player_x\), a[\s\S]{0,1800}?\$\{bossSystem\.loadCallAsm\}/.test(roomGen),
  ],
  [
    'Dialogue-close restores its live snapshot without a second boss redraw',
    roomGen.includes('jp bitmap_dlg_restore_box') &&
      !roomGen.includes('call bitmap_boss_redraw_after_dialogue') &&
      !bossGen.includes('bitmap_boss_redraw_after_dialogue:') &&
      bossGen.includes('bitmap_boss_barrier_redraw:') &&
      bossGen.includes('    cp 2\n    jr z, .cell_redraw') &&
      bossGen.includes('.cell_redraw:'),
  ],
];

// ---------------------------------------------------------------- Part C ---
// Boss Editor "Body & Graphics". The body is a `msx2bitmapstamp` asset drawn as
// a picture, NOT an atlas entry: importing a stamp into a room splits it into
// 16x16 cells, so an atlas-entry dropdown lists stamp fragments
// (`door_market_r0_c0`, `_r0_c1`, ...) repeated once per room. This regressed
// once when the file was reverted wholesale, so it is pinned here.
const editorChecks = [
  [
    'Body picker reads msx2bitmapstamp assets, composed into pixels',
    bossEditor.includes("asset.type !== 'msx2bitmapstamp'") &&
      bossEditor.includes('bitmapStampToPixelGrid') &&
      bossEditor.includes('function useBodyStamps'),
  ],
  [
    'Body picker draws each stamp instead of listing names in a <select>',
    bossEditor.includes('const BossBodyPicker') &&
      bossEditor.includes('const StampCanvas') &&
      bossEditor.includes('<BossBodyPicker'),
  ],
  [
    'Body selection writes bossStampAssetId (not bossAtlasEntryId)',
    bossEditor.includes('bossStampAssetId: id'),
  ],
  [
    'Body label names Bitmap Stamps, not the old atlas entry',
    bossEditor.includes('Body — Bitmap Stamp') &&
      !bossEditor.includes('Body atlas entry'),
  ],
  [
    'Damage-zone canvas draws the stamp body behind the zones',
    bossEditor.includes('bodyStamp={bodyStamp}') &&
      bossEditor.includes('<StampCanvas stamp={bodyStamp}') &&
      !bossEditor.includes('bodyEntry'),
  ],
  [
    'Legacy bossAtlasEntryId bodies still warn instead of silently breaking',
    bossEditor.includes('still points at the old atlas entry'),
  ],
  // Rooms keep a stale private palette once the world moves to a shared one, so
  // previewing atlas pixels with room.palette shows colours the game never has.
  [
    'Atlas tiles are coloured through the world palette',
    atlasEntries.includes('resolveWorldPalettes') &&
      atlasEntries.includes('byRoom.get(asset.id)'),
  ],
  [
    'Stamp previews are coloured through the world palette too',
    bossEditor.includes('useWorldPalettes') &&
      /palette: shared/.test(bossEditor),
  ],
  // A world atlas is shared, so every room lists the same entries: collecting
  // per room floods the pickers with identical thumbnails of the same tile.
  [
    'Atlas tiles are collected once, not once per room',
    bossEditor.includes('collectAtlasEntries') &&
      atlasEntries.includes('byId.set(id,') &&
      !/key: `\$\{asset\.id\}:\$\{entry\.id\}`/.test(atlasEntries + bossEditor),
  ],
];

// ---------------------------------------------------------------- Part B ---
// Strip ASM comments, then look for instructions the Z80 does not have.
// Registers that `add hl,` / `adc hl,` / `sbc hl,` genuinely accept.
const HL_PAIR_OPERANDS = /^(bc|de|hl|sp)$/i;

const invalidPatterns = [
  {
    // `add hl, 16` — no immediate form. Same for ix/iy.
    name: 'add/adc/sbc on a 16-bit pair with a non-pair operand',
    test: (line) => {
      const m = line.match(/^\s*(?:add|adc|sbc)\s+(hl|ix|iy)\s*,\s*([^;]+)$/i);
      if (!m) return false;
      return !HL_PAIR_OPERANDS.test(m[2].trim());
    },
  },
  {
    // `ld hl, de` and friends: no 16-bit register-to-register load.
    name: '16-bit register-to-register ld (use push/pop or two 8-bit lds)',
    test: (line) => /^\s*ld\s+(hl|de|bc)\s*,\s*(hl|de|bc)\s*$/i.test(line),
  },
  {
    name: 'sub on a 16-bit pair (use or a / sbc hl,rr)',
    test: (line) => /^\s*sub\s+(hl|ix|iy)\s*,/i.test(line),
  },
  {
    // Glass wants #FF / 0FFh, not 0xFF.
    name: '0x hex literal (Glass expects #)',
    test: (line) => /\b0x[0-9a-f]+/i.test(line),
  },
  {
    // BIOS name-table helpers do not belong in the SCREEN 5 bitmap path.
    name: 'BIOS LDIRVM/CHGMOD call in the bitmap boss path (use V9938 commands)',
    test: (line) => /^\s*call\s+(LDIRVM|CHGMOD)\b/i.test(line),
  },
];

/**
 * Pull candidate ASM lines out of the generator's template literals. A line
 * counts as ASM when it starts with a known mnemonic; everything else (TS
 * code, JSX, prose) is skipped. Comments are stripped first so a `;` note
 * mentioning `0x40` never trips the literal check.
 */
const MNEMONIC = /^\s*(ld|add|adc|sub|sbc|and|or|xor|cp|inc|dec|push|pop|call|jp|jr|djnz|ret|rst|ex|exx|halt|nop|di|ei|rl|rr|rla|rra|rlc|rrc|sla|sra|srl|bit|set|res|ldir|lddr|ldi|ldd|neg|cpl|scf|ccf|in|out|im)\b/i;

const offenders = [];
bossGen.split(/\r?\n/).forEach((raw, index) => {
  // Drop the ASM comment tail; keep the instruction.
  const line = raw.split(';')[0];
  if (!MNEMONIC.test(line)) return;
  // Template interpolations are not literal ASM; the emitted value is checked
  // where it is built, not here.
  if (line.includes('${')) return;
  for (const pattern of invalidPatterns) {
    if (pattern.test(line)) {
      offenders.push({ line: index + 1, text: raw.trim(), rule: pattern.name });
    }
  }
});

// ------------------------------------------------------------------ run ---
let failed = 0;

for (const [name, passed] of [...contractChecks, ...editorChecks]) {
  console.log(`${passed ? 'OK' : 'FAIL'}: ${name}`);
  if (!passed) failed += 1;
}

if (offenders.length === 0) {
  console.log('OK: emitted ASM has no invalid Z80 instructions or 0x literals');
} else {
  failed += offenders.length;
  console.log(`FAIL: ${offenders.length} invalid ASM line(s):`);
  for (const offender of offenders) {
    console.log(`  msx2BitmapBossGenerator.ts:${offender.line}  ${offender.text}`);
    console.log(`    -> ${offender.rule}`);
  }
}

if (failed) {
  throw new Error(`MSX2 boss Room Lock checks failed: ${failed}`);
}
console.log('MSX2 boss Room Lock checks passed.');
