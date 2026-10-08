#!/usr/bin/env node
// Writes a SABOTAGED copy of a generated pursuer-lab ASM, to prove that the probe / checker go red when the mechanic is broken.
// Never edits its input (refuses in === out); fails (exit 3) if the pattern it must break is not found exactly once, so a sabotage
// that silently did nothing cannot be mistaken for a probe that passed.
//
//   node test/msx2-pursuer/sabotage_pursuer_asm.mjs <in.asm> <out.asm> <mode>
//
// modes
//   no-boot-init     drop the `call bitmap_pursuer_init` of the boot / WorldLink path (the one NOT preceded by bitmap_load_enemies)
//   no-commit-init   drop the `call bitmap_pursuer_init` of the room-change path
//   leader-only      the bank writes the leader's movement mode (14) but not the follower's (15)
//   ignore-guard     the appearance ignores how close the player is (no `ret c` after the |dy| test)
//   no-tick          drop the per-frame `call bitmap_pursuer_tick`
//   boss-call        the bank code calls bitmap_boss_update-like routine at #8000+ (a call into the resident P2 window); target = --target label
//   p2-read          the bank code reads a byte at an address in the resident P2 window; target = --target label
//   slow-tick        the resident tick burns ~20 ms of CPU every frame (what the CPU probe must catch)
//   rom-write        the bank code stores to #9000 (a Konami mapper register: it would swap its own bank)
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
const prevCode = i => { for (let k = i - 1; k >= 0; k--) { const t = lines[k].trim(); if (t && !t.startsWith(';')) return t; } return ''; };
const bankStart = lines.findIndex(l => /^bitmap_pursuerb_begin:/.test(l));
const bankEnd = lines.findIndex(l => /^bitmap_pursuerb_code_end:/.test(l));

function dropLine(index) { lines.splice(index, 1); }

switch (mode) {
  case 'no-boot-init':
  case 'no-commit-init': {
    const wantCommit = mode === 'no-commit-init';
    const hits = initCalls.filter(i => /^call bitmap_load_enemies$/.test(prevCode(i)) === wantCommit);
    if (hits.length !== 1) fail(`expected exactly one ${wantCommit ? 'commit' : 'boot'} init call, found ${hits.length} (of ${initCalls.length})`);
    dropLine(hits[0]);
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
  case 'no-tick': {
    const idx = lines.map((l, i) => (/^\s*call bitmap_pursuer_tick\s*$/.test(l) ? i : -1)).filter(i => i >= 0);
    if (idx.length !== 1) fail(`expected one tick call, found ${idx.length}`);
    dropLine(idx[0]);
    break;
  }
  case 'boss-call':
  case 'p2-read': {
    if (!targetArg) fail('--target <label> is required');
    if (bankStart < 0 || bankEnd < 0) fail('no bank code found');
    // Insert right after the first instruction of bitmap_pursuerb_tick (a harmless xor a would become a real call/read).
    const tickAt = lines.findIndex(l => /^bitmap_pursuerb_tick:/.test(l));
    if (tickAt < 0) fail('no bitmap_pursuerb_tick label');
    lines.splice(tickAt + 1, 0, mode === 'boss-call' ? `    call ${targetArg}              ; SABOTAGE: a call into code that lives in the P2 window` : `    ld a, (${targetArg})            ; SABOTAGE: a read from the resident P2 window`);
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
