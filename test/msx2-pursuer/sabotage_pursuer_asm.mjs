#!/usr/bin/env node
// Writes a SABOTAGED copy of a generated pursuer-lab ASM, to prove that the probe / checker go red when the mechanic is broken.
// Never edits its input (refuses in === out); fails (exit 3) if the pattern it must break is not found exactly once, so a sabotage
// that silently did nothing cannot be mistaken for a probe that passed.
//
//   node test/msx2-pursuer/sabotage_pursuer_asm.mjs <in.asm> <out.asm> <mode>
//
// modes
//   no-boot-init     drop the `call bitmap_pursuer_init` of the boot / WorldLink path (the one NOT inside commit_room_flip)
//   no-commit-init   drop the `call bitmap_pursuer_init` of the room-change path (the one inside commit_room_flip)
//   boot-init-before-place  move the boot `call bitmap_pursuer_init` to right after the boot-path `call bitmap_load_enemies`, i.e.
//                    BEFORE "; Place the player at the room spawn point": the soldier's entry point is read from an unplaced player
//   timer-low-byte   `dec hl` -> `dec l` in bitmap_pursuerb_tick: the countdown only works while it fits in a byte (2 s yes, 5 s never)
//   no-park          the init no longer parks the hidden soldier slots at y = #E0 (they stay where the loader left them)
//   leader-only      the bank writes the leader's movement mode (14) but not the follower's (15)
//   ignore-guard     the appearance ignores how close the player is (no `ret c` after the |dy| test)
//   no-tick          drop the per-frame `call bitmap_pursuer_tick`
//   boss-call        the bank code calls bitmap_boss_update-like routine at #8000+ (a call into the resident P2 window); target = --target label
//   p2-read          the bank code reads a byte at an address in the resident P2 window; target = --target label
//   slow-tick        the resident tick burns ~20 ms of CPU every frame (what the CPU probe must catch)
//   rom-write        the bank code stores to #9000 (a Konami mapper register: it would swap its own bank)
//   unlisted-call    the bank code calls a RESIDENT routine (< #8000) that is not on the whitelist of check_msx2_pursuer_bank.mjs;
//                    target = --target label (e.g. bitmap_wait_vblank)
//   whitelist-p2-jump  bitmap_probe_solid (a whitelisted routine) jumps into #8000-#9FFF: its closure leaves the safe zones;
//                    target = --target label that lives in the P2 window of the ROM under test
//   descriptor-sprite  the soldier's resident terrain descriptor 03 03 08 1C (the player's 9x29 hitbox) becomes 00 00 0F 1F: the complete
//                    16x32 sprite, i.e. what every other scripted enemy gets
//   descriptor-short   ... becomes 03 03 08 14: a body 8 px too short (its feet are 8 px above the sprite's)
//   descriptor-head    ... becomes 03 00 08 1F: the head row of the body starts at the top of the sprite (top = 0, same feet row)
//   feet-left-only   the floor probe under the body (bitmap_enemy_script_probe_below) looks at the LEFT column of the body only
//   feet-right-only  ... at the RIGHT column only
//   wall-one-row     the wall probe at the leading edge (bitmap_enemy_body_probe_side) looks at the TOP row of the body only
//   head-short       the head probe looks at the row y+3 (inside the hitbox) instead of y+2 (the one the head would enter): the soldier
//                    rises one pixel too far under a low ceiling
//   clip-as-set-anim ANIM_CLIP is wired to the SET_ANIM handler: the clip is never stored and the automatic animation runs the whole sprite
//   clip-late-frame  ANIM_CLIP stores the clip but does not put the animation on its first frame in the same tick: the old frame stays
//                    on screen until the automatic animation catches up (a few video frames outside the clip)
//   clip-restart     ANIM_CLIP no longer notices that the clip is already playing: a rule that fires every tick restarts the cycle
//   slow-step        bitmap_enemy_script_step burns ~1 ms of CPU on every call (what the soldier-cost probe must catch)
import fs from 'node:fs';
import path from 'node:path';
const [inPath, outPath, mode] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const targetArg = process.argv.indexOf('--target') >= 0 ? process.argv[process.argv.indexOf('--target') + 1] : '';
if (!inPath || !outPath || !mode) { console.error('usage: sabotage_pursuer_asm.mjs <in.asm> <out.asm> <mode> [--target label]'); process.exit(2); }
if (path.resolve(inPath) === path.resolve(outPath)) { console.error('refusing: in === out'); process.exit(2); }
const text = fs.readFileSync(inPath, 'utf8');
const nl = text.includes('\r\n') ? '\r\n' : '\n';
const lines = text.split(/\r?\n/);
const fail = msg => { console.error(`sabotage "${mode}" NOT applied: ${msg}`); process.exit(3); };

const initCalls = lines.map((l, i) => (/^\s*call bitmap_pursuer_init\s*$/.test(l) ? i : -1)).filter(i => i >= 0);
// The room-change hook is the init call that sits inside `commit_room_flip` (its nearest preceding non-local label); the other is the boot one.
// (It used to be "the call right after `call bitmap_load_enemies`", but the hook is now the LAST loader of commit_room_flip.)
const enclosingLabel = i => { for (let k = i; k >= 0; k--) { const m = lines[k].match(/^([A-Za-z_][A-Za-z0-9_]*):/); if (m) return m[1]; } return ''; };
const isCommitHook = i => enclosingLabel(i) === 'commit_room_flip';
const bootLoadEnemies = lines.map((l, i) => (/^\s*call bitmap_load_enemies\s*$/.test(l) && !isCommitHook(i) ? i : -1)).filter(i => i >= 0);
const bankStart = lines.findIndex(l => /^bitmap_pursuerb_begin:/.test(l));
const bankEnd = lines.findIndex(l => /^bitmap_pursuerb_code_end:/.test(l));

function dropLine(index) { lines.splice(index, 1); }

switch (mode) {
  case 'no-boot-init':
  case 'no-commit-init': {
    const wantCommit = mode === 'no-commit-init';
    const hits = initCalls.filter(i => isCommitHook(i) === wantCommit);
    if (hits.length !== 1) fail(`expected exactly one ${wantCommit ? 'commit' : 'boot'} init call, found ${hits.length} (of ${initCalls.length})`);
    dropLine(hits[0]);
    break;
  }
  case 'boot-init-before-place': {
    // The boot hook moves from after "Place the player" to right after the boot-path `call bitmap_load_enemies`: it then reads
    // player_x / player_y BEFORE the spawn point is written, so the soldier's entry point is whatever the RAM held.
    const bootInits = initCalls.filter(i => !isCommitHook(i));
    if (bootInits.length !== 1) fail(`expected exactly one boot init call, found ${bootInits.length} (of ${initCalls.length})`);
    if (bootLoadEnemies.length !== 1) fail(`expected exactly one boot-path 'call bitmap_load_enemies', found ${bootLoadEnemies.length}`);
    const place = lines.findIndex(l => /^\s*; Place the player at the room spawn point/.test(l));
    if (place < 0 || place < bootLoadEnemies[0] || place > bootInits[0]) fail('"; Place the player" is not between the boot loaders and the boot init call');
    const initLine = lines[bootInits[0]];
    dropLine(bootInits[0]);
    lines.splice(bootLoadEnemies[0] + 1, 0, initLine.replace(/\s*$/, '') + '      ; SABOTAGE: before the player is placed');
    break;
  }
  case 'leader-only': {
    if (bankStart < 0 || bankEnd < 0) fail('no bank code found');
    // The follower block is the one that loads 15 (MSX2_ENEMY_MOVEMENT_LAYER_FOLLOWER) into A and stores it as a mode.
    const idx = [];
    for (let i = bankStart; i < bankEnd; i++) if (/^\s*ld a, 15\s*$/.test(lines[i])) idx.push(i);
    if (idx.length !== 1) fail(`expected one 'ld a, 15' in the bank, found ${idx.length}`);
    if (!/ld \(bitmap_enemy_pool \+ \d+ \+ 13\), a/.test(lines[idx[0] + 1])) fail('the line after ld a, 15 is not the mode store');
    lines.splice(idx[0], 2);
    break;
  }
  case 'ignore-guard': {
    if (bankStart < 0 || bankEnd < 0) fail('no bank code found');
    const idx = [];
    for (let i = bankStart; i < bankEnd; i++) if (/^\s*ret c\s+;/.test(lines[i])) idx.push(i);
    if (idx.length !== 1) fail(`expected one 'ret c' guard exit, found ${idx.length}`);
    dropLine(idx[0]);
    break;
  }
  case 'timer-low-byte': {
    // The countdown is 16 bits (a delay above 255 frames is allowed: up to 30 s = 1800). A byte-wide decrement works for 2 s
    // (121 frames) and never reaches zero for 5 s (301): only a long-delay run can see it.
    if (bankStart < 0 || bankEnd < 0) fail('no bank code found');
    const idx = [];
    for (let i = bankStart; i < bankEnd; i++) if (/^\s*dec hl\s*$/.test(lines[i])) idx.push(i);
    if (idx.length !== 1) fail(`expected one 'dec hl' in the bank, found ${idx.length}`);
    lines[idx[0]] = '    dec l                                   ; SABOTAGE: the high byte of the countdown never moves';
    break;
  }
  case 'no-park': {
    // Drop the init's "park the hidden body below the room" writes: the group `ld a, #E0` + one `ld (slot + 1), a` per soldier slot.
    if (bankStart < 0 || bankEnd < 0) fail('no bank code found');
    const at = [];
    for (let i = bankStart; i < bankEnd; i++) if (/^\s*ld a, #E0\b/.test(lines[i])) at.push(i);
    if (at.length !== 1) fail(`expected one 'ld a, #E0' in the bank, found ${at.length}`);
    let end = at[0] + 1;
    while (end < bankEnd && /^\s*ld \(bitmap_enemy_pool \+ \d+ \+ 1\), a\s*$/.test(lines[end])) end++;
    if (end === at[0] + 1) fail('no slot y store follows the park value');
    lines.splice(at[0], end - at[0]);
    break;
  }
  case 'no-tick': {
    const idx = lines.map((l, i) => (/^\s*call bitmap_pursuer_tick\s*$/.test(l) ? i : -1)).filter(i => i >= 0);
    if (idx.length !== 1) fail(`expected one tick call, found ${idx.length}`);
    dropLine(idx[0]);
    break;
  }
  case 'descriptor-sprite':
  case 'descriptor-short':
  case 'descriptor-head': {
    // The resident table is `DB #03,#03,#08,#1C,...` lines (4 bytes per colour block). Every aligned quartet equal to the soldier's descriptor is
    // rewritten; any other enemy's descriptor (a different size) is left alone. Fails when there is nothing to rewrite.
    const to = { 'descriptor-sprite': [0x00, 0x00, 0x0f, 0x1f], 'descriptor-short': [0x03, 0x03, 0x08, 0x14], 'descriptor-head': [0x03, 0x00, 0x08, 0x1f] }[mode];
    const at = lines.findIndex(l => /^bitmap_enemy_sprite_body_bounds:/.test(l));
    if (at < 0) fail('no bitmap_enemy_sprite_body_bounds (is this ROM built with scripted enemies?)');
    let end = at + 1;
    const bytes = [];
    for (; end < lines.length && /^\s*DB\b/i.test(lines[end]); end++) {
      for (const part of lines[end].replace(/;.*$/, '').replace(/^\s*DB\s+/i, '').split(',')) {
        const m = part.trim().match(/^#([0-9A-Fa-f]+)$/);
        if (!m) fail(`unexpected byte syntax in the descriptor table: ${part.trim()}`);
        bytes.push(parseInt(m[1], 16));
      }
    }
    if (bytes.length % 4 !== 0) fail(`the descriptor table has ${bytes.length} bytes, not a multiple of 4`);
    let changed = 0;
    for (let i = 0; i < bytes.length; i += 4) {
      if (bytes[i] === 0x03 && bytes[i + 1] === 0x03 && bytes[i + 2] === 0x08 && bytes[i + 3] === 0x1c) { bytes.splice(i, 4, ...to); changed++; }
    }
    if (changed === 0) fail('no descriptor equal to 03 03 08 1C in the table (is there a pursuer soldier in this ROM?)');
    const out = [];
    for (let i = 0; i < bytes.length; i += 16) out.push('    DB ' + bytes.slice(i, i + 16).map(b => '#' + b.toString(16).toUpperCase().padStart(2, '0')).join(',') + '   ; SABOTAGE ' + mode);
    lines.splice(at + 1, end - at - 1, ...out);
    console.error(`  rewrote ${changed} descriptor(s) 03 03 08 1C -> ${to.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')}`);
    break;
  }
  case 'feet-left-only':
  case 'feet-right-only': {
    // bitmap_enemy_script_probe_below sets B = left x, D = right x and scans [B, D]. Collapse the span onto one end.
    const at = lines.findIndex(l => /^bitmap_enemy_script_probe_below:/.test(l));
    if (at < 0) fail('no bitmap_enemy_script_probe_below (the complete-body engine)');
    let call = -1;
    for (let i = at; i < at + 24; i++) if (/^\s*call bitmap_enemy_body_scan_floor_x\s*$/.test(lines[i])) { call = i; break; }
    if (call < 0 || !/^\s*ld d, a\s*$/.test(lines[call - 1])) fail('the span set-up (`ld d, a` / `call bitmap_enemy_body_scan_floor_x`) was not found');
    if (mode === 'feet-left-only') lines[call - 1] = '    ld d, b                        ; SABOTAGE: the floor scan ends on the left column';
    else lines.splice(call, 0, '    ld b, d                        ; SABOTAGE: the floor scan starts on the right column');
    break;
  }
  case 'wall-one-row': {
    const at = lines.findIndex(l => /^bitmap_enemy_body_probe_side:/.test(l));
    if (at < 0) fail('no bitmap_enemy_body_probe_side');
    let call = -1;
    for (let i = at; i < at + 40; i++) if (/^\s*call bitmap_enemy_body_scan_y\s*$/.test(lines[i])) { call = i; break; }
    if (call < 0 || !/^\s*ld d, a\s*$/.test(lines[call - 1])) fail('the span set-up (`ld d, a` / `call bitmap_enemy_body_scan_y`) was not found');
    lines[call - 1] = '    ld d, c                        ; SABOTAGE: the wall scan ends on the top row (C = first Y)';
    break;
  }
  case 'head-short': {
    const at = lines.findIndex(l => /^bitmap_enemy_script_probe_head:/.test(l));
    if (at < 0) fail('no bitmap_enemy_script_probe_head (the complete-body engine)');
    let dec = -1;
    for (let i = at; i < at + 16; i++) if (/^\s*dec a\s*$/.test(lines[i])) { dec = i; break; }
    if (dec < 0) fail('no `dec a` (the row above the body top) in the head probe');
    lines[dec] = '    nop                            ; SABOTAGE: the head probe looks at the body top row instead of the row above it';
    break;
  }
  case 'clip-as-set-anim': {
    const idx = lines.map((l, i) => (/^\s*dw bitmap_enemy_script_act_anim_clip/.test(l) ? i : -1)).filter(i => i >= 0);
    if (idx.length !== 1) fail(`expected one action-table entry for ANIM_CLIP, found ${idx.length}`);
    lines[idx[0]] = lines[idx[0]].replace('bitmap_enemy_script_act_anim_clip', 'bitmap_enemy_script_act_set_anim');
    break;
  }
  case 'clip-restart': {
    const at = lines.findIndex(l => /^bitmap_enemy_script_act_anim_clip:/.test(l));
    if (at < 0) fail('no bitmap_enemy_script_act_anim_clip');
    let or80 = -1;
    for (let i = at; i < at + 30; i++) if (/^\s*or #80/.test(lines[i])) { or80 = i; break; }
    if (or80 < 0 || !/^\s*cp \(ix\+\d+\)/.test(lines[or80 + 1]) || !/^\s*jp z, bitmap_enemy_script_apply/.test(lines[or80 + 2])) fail('the "same clip" test (cp / jp z) does not follow `or #80`');
    lines.splice(or80 + 1, 2);
    break;
  }
  case 'clip-late-frame': {
    const at = lines.findIndex(l => /^bitmap_enemy_script_act_anim_clip:/.test(l));
    if (at < 0) fail('no bitmap_enemy_script_act_anim_clip');
    let store = -1;
    for (let i = at; i < at + 30; i++) if (/^\s*ld \(ix\+\d+\), b\s*(;|$)/.test(lines[i])) { store = i; break; }
    if (store < 0) fail('no `ld (ix+N), b` (the first-frame write) in the ANIM_CLIP handler');
    lines.splice(store, 1);
    break;
  }
  case 'slow-step': {
    const at = lines.findIndex(l => /^bitmap_enemy_script_step:/.test(l));
    if (at < 0) fail('no bitmap_enemy_script_step label');
    if (!/^\s*push bc/.test(lines[at + 1])) fail('bitmap_enemy_script_step does not start with push bc');
    lines.splice(at + 2, 0, '    ld de, 150                     ; SABOTAGE: ~3600 T-states of busy loop per call', '.sab_busy_step:', '    dec de', '    ld a, d', '    or e', '    jp nz, .sab_busy_step');
    break;
  }
  case 'whitelist-p2-jump': {
    if (!targetArg) fail('--target <label> is required');
    const at = lines.findIndex(l => /^bitmap_probe_solid:/.test(l));
    if (at < 0) fail('no bitmap_probe_solid label');
    lines.splice(at + 1, 0, `    jp ${targetArg}                 ; SABOTAGE: a whitelisted routine that leaves for the P2 window`);
    break;
  }
  case 'unlisted-call':
  case 'boss-call':
  case 'p2-read': {
    if (!targetArg) fail('--target <label> is required');
    if (bankStart < 0 || bankEnd < 0) fail('no bank code found');
    // Insert right after the first instruction of bitmap_pursuerb_tick (a harmless xor a would become a real call/read).
    const tickAt = lines.findIndex(l => /^bitmap_pursuerb_tick:/.test(l));
    if (tickAt < 0) fail('no bitmap_pursuerb_tick label');
    lines.splice(tickAt + 1, 0, mode !== 'p2-read' ? `    call ${targetArg}              ; SABOTAGE: a call into code that lives in the P2 window` : `    ld a, (${targetArg})            ; SABOTAGE: a read from the resident P2 window`);
    break;
  }
  case 'slow-tick': {
    const at = lines.findIndex(l => /^bitmap_pursuer_tick:/.test(l));
    if (at < 0) fail('no bitmap_pursuer_tick label');
    lines.splice(at + 1, 0, '    ld bc, 3000                    ; SABOTAGE: ~72000 T-states of busy loop', '.sab_busy:', '    dec bc', '    ld a, b', '    or c', '    jp nz, .sab_busy');
    break;
  }
  case 'rom-write': {
    const tickAt = lines.findIndex(l => /^bitmap_pursuerb_tick:/.test(l));
    if (tickAt < 0) fail('no bitmap_pursuerb_tick label');
    lines.splice(tickAt + 1, 0, '    ld (#9000), a                  ; SABOTAGE: store into a mapper register');
    break;
  }
  default:
    fail(`unknown mode ${mode}`);
}
fs.writeFileSync(outPath, lines.join(nl));
console.log(`sabotage "${mode}" applied: ${path.basename(inPath)} -> ${outPath}`);
