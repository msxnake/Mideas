#!/usr/bin/env node
/**
 * Dispatch-border matrix for the SCREEN 5 bitmap enemy step handlers.
 *
 * The optional engines (slime, gear, fly8, scripted) are chained by physical
 * adjacency in the emitted ASM, and twice in one afternoon a border opened:
 * a handler label landed directly behind a conditional jump, so the previous
 * block's tail fell into it (first .enemy_step_patrol, then
 * .walker_turn_right into .enemy_step_scripted — only in scripted-without-
 * gear-and-fly8, the most typical authored-behaviour project).
 *
 * The bug lives in the COMBINATION, not in any single function, so this
 * checker generates the FULL 16-combination matrix of the four optional
 * flags and asserts the structural invariant on the emitted text:
 *
 *   the last non-empty, non-comment instruction before EVERY emitted
 *   .enemy_step_* handler label must end control flow (ret, or an
 *   UNCONDITIONAL jp/jr), so no block can accidentally fall into a handler.
 *
 * One documented exception: .enemy_step_patrol is the dispatcher's designed
 * fall-through for mode 0 — its terminator may be the dispatcher's own
 * conditional `jp z`. Every other handler must be unreachable by fall.
 *
 * This measures the DISPATCH BORDERS. It does not prove runtime behaviour
 * (that needs ROM + emulator) nor reachability beyond text adjacency.
 */
import { mkdtempSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const out = join(mkdtempSync(join(tmpdir(), 'mideas-enemy-matrix-')), 'enemygen.mjs');
await build({
  entryPoints: [join(repoRoot, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2BitmapEnemyGenerator.ts')],
  bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'silent',
});
const { buildBitmapEnemySystemAsm } = await import(pathToFileURL(out).href);

const OPTS = {
  ramBase: 0xc800, satBase: 64, colorBase: 64, patternGroupBase: 64,
  gameYOffset: 8, damageInvulnFrames: 60, maxHealth: 3,
  playerHitbox: { x: 0, y: 0, w: 16, h: 16 },
};

const makeData = ({ slime, gear, fly8, scripted }) => ({
  maxSlots: 4,
  maxFrames: 1,
  roomTables: [[1, ...new Array(22 + (scripted ? 1 : 0)).fill(0)]],
  patternBytes: new Array(slime ? 128 : 64).fill(1),
  colorBytes: new Array(slime ? 32 : 16).fill(1),
  slimeEnabled: slime,
  gearEnabled: gear,
  fly8Enabled: fly8,
  scriptedEnabled: scripted,
});

const COMBOS = [];
for (const scripted of [false, true]) for (const slime of [false, true])
  for (const gear of [false, true]) for (const fly8 of [false, true])
    COMBOS.push({ scripted, slime, gear, fly8 });

const comboName = (c) => [
  c.scripted && 'scripted', c.slime && 'slime', c.gear && 'gear', c.fly8 && 'fly8',
].filter(Boolean).join('+') || 'legacy-only';

/** Returns { conditional, kind } when line is a control transfer, else null. */
const transferOf = (line) => {
  const m = line.match(/^(jp|jr)\s+(?:(nz|z|nc|c|po|pe|p|m)\s*,\s*)?(\S+)/);
  if (m) return { kind: m[1], conditional: Boolean(m[2]), target: m[3] };
  if (/^ret\b/.test(line)) return { kind: 'ret', conditional: false, target: null };
  return null;
};

const checks = [];
const check = (label, ok, detail = '') => checks.push([label, ok, detail]);

for (const combo of COMBOS) {
  const name = comboName(combo);
  const asm = buildBitmapEnemySystemAsm(makeData(combo), OPTS);
  check(`system enabled: ${name}`, asm.enabled === true);

  const lines = asm.routinesAsm.split('\n');
  // The dispatcher's cp/jp-z chain sits immediately above .enemy_step_patrol:
  // the designed mode-0 fall-through. Collecting the contiguous pairs upward
  // from that anchor reads exactly the mode handlers — loop labels elsewhere
  // (.enemy_step_next, .enemy_anim) also use cp/jp-z but never touch this
  // spot — and a future mode 15 joins automatically.
  const patrolIdx = lines.findIndex((l) => l.trim() === '.enemy_step_patrol:');
  const handlerLabels = ['.enemy_step_patrol'];
  const isPair = (a, b) => /^cp\s/.test(a.trim())
    && /^jp z, (\.[a-z0-9_]+)/.test(b.trim());
  for (let i = patrolIdx - 1; i >= 1; i--) {
    if (lines[i].trim() === '' || lines[i].trim().startsWith(';')) continue;
    const jm = lines[i].trim().match(/^jp z, (\.[a-z0-9_]+)/);
    if (jm && /^cp\s/.test(lines[i - 1].trim())) {
      if (!handlerLabels.includes(jm[1])) handlerLabels.push(jm[1]);
      i--;
    } else break;
  }
  check(`dispatcher anchored at patrol: ${name}`,
    patrolIdx >= 0 && handlerLabels.length >= 3,
    handlerLabels.join(' '));
  for (const label of handlerLabels) {
    let i = lines.findIndex((l) => l.startsWith(`${label}:`));
    let j = i - 1;
    while (j >= 0 && (lines[j].trim() === '' || lines[j].trim().startsWith(';'))) j--;
    const prev = j >= 0 ? lines[j].trim() : '';
    const t = transferOf(prev);
    // .enemy_step_patrol is the dispatcher's designed mode-0 fall-through:
    // its terminator may be the dispatcher's last CONDITIONAL jp. Every other
    // handler must sit behind an unconditional transfer.
    const designedFall = label === '.enemy_step_patrol';
    const ok = designedFall
      ? Boolean(t)
      : Boolean(t && !t.conditional);
    check(`border closed before ${label}: ${name}`, ok,
      ok ? '' : `preceding line: "${prev}"`);
  }

  if (!combo.scripted && !combo.slime && !combo.gear && !combo.fly8) {
    check('legacy-only build emits no scripted engine',
      !/script/i.test(asm.routinesAsm) && !/script/i.test(asm.equates));
  }
  if (combo.scripted) {
    check(`scripted engine present: ${name}`,
      asm.routinesAsm.includes('bitmap_enemy_script_step'));
  }
}

// ---- layer followers -------------------------------------------------------
// One placed enemy becomes one pool slot per cell x colour layer, and the extra
// slots carry mode 15 so they copy the slot before them instead of running the
// behaviour again. The saving is real (measured: the interpreter drops from 60
// to 30 calls/second on a two-layer enemy) but it must not exist at all in a
// project whose enemies are single-layer, or every such ROM moves for nothing.
for (const scripted of [false, true]) {
  const name = `layered${scripted ? '+scripted' : ''}`;
  const plain = buildBitmapEnemySystemAsm(makeData({ slime: false, gear: false, fly8: false, scripted }), OPTS);
  check(`no follower path without layered enemies: ${name}`,
    !plain.routinesAsm.includes('.enemy_step_follow')
    && !/cp 15\b/.test(plain.routinesAsm));

  const layered = buildBitmapEnemySystemAsm(
    { ...makeData({ slime: false, gear: false, fly8: false, scripted }), layeredEnemies: true },
    OPTS,
  );
  check(`follower dispatch emitted when layered: ${name}`,
    /cp 15\s*\n\s*jp z, \.enemy_step_follow\b/.test(layered.routinesAsm));
  // The handler is deliberately parked behind the loop's own `ret`: every other
  // block in this routine chains by physical adjacency, and that is exactly how
  // two dispatch borders were opened by accident before.
  const lines = layered.routinesAsm.split('\n');
  let idx = lines.findIndex((l) => l.startsWith('.enemy_step_follow:'));
  let j = idx - 1;
  while (j >= 0 && (lines[j].trim() === '' || lines[j].trim().startsWith(';'))) j--;
  const prev = j >= 0 ? lines[j].trim() : '';
  const t = transferOf(prev);
  check(`border closed before .enemy_step_follow: ${name}`,
    Boolean(t && !t.conditional), t ? '' : `preceding line: "${prev}"`);
  // A follower rebuilds its position from the body origin. Reading the leader's
  // raw x instead would stack every cell of a wide sprite on one point.
  check(`follower rebuilds position from the body origin: ${name}`,
    /ld a, \(iy\+0\)[^\n]*\n\s*sub \(iy\+14\)[^\n]*\n\s*add a, \(ix\+14\)/.test(layered.routinesAsm));
}

let failed = 0;
for (const [label, ok, detail] of checks) {
  console.log(`${ok ? 'OK  ' : 'FAIL'}: ${label}${!ok && detail ? ` -> ${detail}` : ''}`);
  if (!ok) failed += 1;
}
if (failed > 0) {
  console.error(`\n${failed} enemy dispatch-matrix check(s) failed.`);
  process.exit(1);
}
console.log(`\nEnemy dispatch-matrix checks passed (${COMBOS.length} combinations).`);
