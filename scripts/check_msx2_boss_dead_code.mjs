#!/usr/bin/env node
/**
 * F0.5-1: the boss runtime must not emit routines nothing can reach.
 *
 * The 32 KB resident window (#4000-#BFFF) is the scarcest resource of the SCREEN 5
 * backend, and two groups of boss routines used to be emitted unconditionally:
 *
 *   - the BITMAP projectile launcher (bitmap_boss_proj_spawn / _step / _hit_check and the
 *     helpers they alone use: _tile_solid / _restore / _save / _draw), emitted whenever a boss
 *     fired ANY projectile, although every call into it is gated on hasBitmapProjectiles.
 *     A project whose bosses only fire hardware-sprite bullets carried 507 dead bytes.
 *   - bitmap_boss_draw_animated, whose only caller was replaced by the deferred render queue
 *     in a2c0bf55.
 *
 * This check pins "emitted iff reachable" two ways, so it cannot be satisfied by luck:
 *
 *   1. EXPECTATION per scenario: sprite-only bosses carry none of those routines; bitmap
 *      (aimed and falling-rock) bosses carry all of theirs. The bitmap scenarios are derived
 *      in memory from the tracked sprite-bullet fixture, and double as the POSITIVE CONTROL:
 *      if the derivation stopped producing bitmap projectiles, the scenario would fail instead
 *      of passing vacuously.
 *   2. REACHABILITY: every emitted routine of the guarded set must be reachable from the rest
 *      of the ROM (transitive references plus fall-through). This is what catches a future
 *      "helper nobody calls" without having to list it here.
 *
 * Structural only: it reads the emitted text. The behaviour verdict is the OpenMSX parity
 * run (identical RAM / PSG / SAT traces between the old and the new ROM).
 */
import { readFileSync, mkdtempSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const BOSS_DEF = join(repoRoot, 'test', 'msx2-boss', 'fixture_boss_def.json');
const STAMPBODY = join(repoRoot, 'test', 'msx2-boss', 'fixture_stampbody.json');
const NO_ENEMY = join(repoRoot, 'test', 'msx2-boss', 'fixture_boss_burst_freeze_no_enemy.json');
// A 16x16 tile that exists in the atlas of the boss room (pan2) of fixture_boss_def.json.
const PROJECTILE_TILE = 'atlas_new_bitmap_tile_1782329057981_0';

/** The bitmap launcher: emitted only with bitmap projectiles. */
const BITMAP_CHAIN = [
  'bitmap_boss_proj_spawn',
  'bitmap_boss_proj_step',
  'bitmap_boss_proj_tile_solid',
  'bitmap_boss_proj_restore',
  'bitmap_boss_proj_save',
  'bitmap_boss_proj_draw',
  'bitmap_boss_proj_hit_check',
];
const ROCKS = ['bitmap_boss_rock_spawn', 'bitmap_boss_rock_rand'];
/** Dead since a2c0bf55: never to be emitted again without a caller. */
const NEVER = ['bitmap_boss_draw_animated'];
/** What a sprite-only boss still needs from the projectile section. */
const SPRITE_KEEPS = [
  'bitmap_boss_proj_config_ix',
  'bitmap_boss_shoot_update',
  'bitmap_boss_phase_resolve',
  'bitmap_boss_hurt_player',
  'bitmap_boss_sbul_update',
  'bitmap_boss_sbul_hit',
];
const GUARDED = [...BITMAP_CHAIN, ...ROCKS, ...NEVER];

const out = join(mkdtempSync(join(tmpdir(), 'mideas-bossdead-')), 'gen.mjs');
await build({
  entryPoints: [join(repoRoot, 'utils', 'msxGenerator', 'index.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  logLevel: 'silent',
});
const generator = await import(pathToFileURL(out).href);

const realLog = console.log;
const realWarn = console.warn;

function generate(project, name) {
  console.log = () => {};
  console.warn = () => {};
  try {
    const files = generator.generateModularASM(project.name || name, project.assets, {
      generateUnified: true,
      romMode: 'megarom',
      targetFormat: 'konami',
      screenMode: project.currentScreenMode || project.screenMode || 'SCREEN 4 (Graphics II)',
      targetGraphicsBackend: project.targetGraphicsBackend || undefined,
    });
    return String(files['unitedFiles.asm'] || files['main.asm']).replace(/\r\n/g, '\n');
  } finally {
    console.log = realLog;
    console.warn = realWarn;
  }
}

const load = file => JSON.parse(readFileSync(file, 'utf8'));
function bossDefinition(project) {
  const definition = project.assets.find(a => a.type === 'msx2boss' && a.id === 'bossdef_demon');
  if (!definition) throw new Error('fixture_boss_def.json lost its bossdef_demon definition');
  return definition.data.params;
}

// ---- analysis ----------------------------------------------------------------------------
const GLOBAL_LABEL = /^([A-Za-z_][A-Za-z0-9_]*):/;
const IDENT = /[A-Za-z_][A-Za-z0-9_]*/g;
const stripComment = line => line.replace(/;.*$/, '');

function splitBlocks(asm) {
  const blocks = [];
  let current = { name: '<top>', lines: [] };
  for (const line of asm.split('\n')) {
    const match = GLOBAL_LABEL.exec(line);
    if (match) {
      blocks.push(current);
      current = { name: match[1], lines: [] };
    }
    current.lines.push(line);
  }
  blocks.push(current);
  return blocks;
}

/** Last instruction of a block does not continue into the next block. */
function endsFlow(block) {
  for (let i = block.lines.length - 1; i >= 0; i--) {
    const text = stripComment(block.lines[i]).replace(GLOBAL_LABEL, '').trim();
    if (!text || /^\.[A-Za-z0-9_]+:?$/.test(text)) continue;
    const op = text.replace(/^\.[A-Za-z0-9_]+:\s*/, '');
    return /^(ret|reti|retn)$/i.test(op)
      || /^jp\s+(?!(nz|z|nc|c|po|pe|p|m)\s*,)[^,]+$/i.test(op)
      || /^jr\s+(?!(nz|z|nc|c)\s*,)[^,]+$/i.test(op);
  }
  return false;
}

/**
 * Guarded labels that are emitted but unreachable. Everything NOT guarded is assumed live
 * (an over-approximation of live code, so a hit here is never a false alarm); a guarded
 * block becomes live when a live block references it or falls through into it.
 */
function unreachableGuarded(asm, guarded) {
  const blocks = splitBlocks(asm);
  const names = new Set(blocks.map(b => b.name));
  const guardedSet = new Set(guarded);
  const references = new Map();
  const fallsInto = new Map();
  blocks.forEach((block, index) => {
    const refs = new Set();
    block.lines.forEach((line, lineIndex) => {
      const text = lineIndex === 0 ? stripComment(line).replace(GLOBAL_LABEL, '') : stripComment(line);
      for (const token of text.match(IDENT) || []) {
        if (token !== block.name && names.has(token)) refs.add(token);
      }
    });
    references.set(block.name, refs);
    const next = blocks[index + 1];
    if (next && !endsFlow(block)) fallsInto.set(block.name, next.name);
  });
  const live = new Set(blocks.filter(b => !guardedSet.has(b.name)).map(b => b.name));
  for (let changed = true; changed;) {
    changed = false;
    for (const name of [...live]) {
      const targets = [...(references.get(name) || [])];
      if (fallsInto.has(name)) targets.push(fallsInto.get(name));
      for (const target of targets) {
        if (!live.has(target)) {
          live.add(target);
          changed = true;
        }
      }
    }
  }
  return blocks.filter(b => guardedSet.has(b.name) && !live.has(b.name)).map(b => b.name);
}

// ---- scenarios ---------------------------------------------------------------------------
const checks = [];
const has = (asm, label) => new RegExp(`^${label}:`, 'm').test(asm);
function expectScenario(title, asm, { present = [], absent = [] }) {
  for (const label of present) checks.push([`${title}: ${label} is emitted`, has(asm, label)]);
  for (const label of absent) checks.push([`${title}: ${label} is NOT emitted`, !has(asm, label)]);
  const dead = unreachableGuarded(asm, GUARDED);
  checks.push([
    `${title}: no emitted routine of the guarded set is unreachable${dead.length ? ` (dead: ${dead.join(', ')})` : ''}`,
    dead.length === 0,
  ]);
}

// 1. Sprite-only bosses: the fixture the arnés calls bitmap-room-boss.
{
  const asm = generate(load(BOSS_DEF), 'boss_def');
  expectScenario('sprite-only bosses', asm, {
    present: SPRITE_KEEPS,
    absent: [...BITMAP_CHAIN, ...ROCKS, ...NEVER],
  });
  // Positive control for the "keeps" half: the sprite path really calls what it keeps.
  checks.push(['sprite-only bosses: bitmap_boss_sbul_hit reaches bitmap_boss_hurt_player',
    /jp bitmap_boss_hurt_player/.test(asm)]);
}

// 2. Aimed bitmap bullet: everything of the launcher is back, byte for byte what it always was.
{
  const project = load(BOSS_DEF);
  const params = bossDefinition(project);
  params.bossProjectileKind = 'bitmap';
  params.bossProjectileTileId = PROJECTILE_TILE;
  const asm = generate(project, 'boss_aimed');
  expectScenario('aimed bitmap bullet', asm, {
    present: [...BITMAP_CHAIN, 'bitmap_boss_hurt_player', 'bitmap_boss_proj_config_ix', 'bitmap_boss_shoot_update'],
    absent: [...ROCKS, ...NEVER],
  });
  // The one thing that must hold even though hit_check has no `call` into hurt_player.
  checks.push(['aimed bitmap bullet: bitmap_boss_proj_hit_check falls through into bitmap_boss_hurt_player',
    /; fall through to bitmap_boss_hurt_player\n\n; Apply A hearts of damage[^\n]*\n[^\n]*\nbitmap_boss_hurt_player:/.test(asm)]);
}

// 3. Falling rocks: they ride the same single-projectile machinery, so the chain must be there.
{
  const project = load(BOSS_DEF);
  const params = bossDefinition(project);
  params.bossProjectileKind = 'bitmap';
  params.bossProjectilePattern = 'fallingRocks';
  params.bossProjectileTileId = PROJECTILE_TILE;
  const asm = generate(project, 'boss_rocks');
  expectScenario('falling rocks', asm, {
    present: [...BITMAP_CHAIN, ...ROCKS, 'bitmap_boss_hurt_player'],
    absent: NEVER,
  });
}

// 3b. Two bosses in one room, one per back-end: both sets of routines must coexist.
{
  const project = load(BOSS_DEF);
  const params = bossDefinition(project);
  params.bossProjectileKind = 'bitmap';
  params.bossProjectileTileId = PROJECTILE_TILE;
  const spriteDefinition = JSON.parse(JSON.stringify(project.assets.find(a => a.type === 'msx2boss' && a.id === 'bossdef_demon')));
  spriteDefinition.id = 'bossdef_demon2';
  if (spriteDefinition.data?.id) spriteDefinition.data.id = 'bossdef_demon2';
  spriteDefinition.data.params.bossProjectileKind = 'sprite';
  delete spriteDefinition.data.params.bossProjectileTileId;
  project.assets.push(spriteDefinition);
  const room = project.assets.find(a => a.type === 'msx2bitmaproom' && (a.data.entities || []).some(e => e.kind === 'boss'));
  const second = JSON.parse(JSON.stringify(room.data.entities.find(e => e.kind === 'boss')));
  second.id = 'boss_smoke_2';
  second.name = 'Bitmap Boss Smoke B';
  second.position = { x: 10, y: 2 };
  second.params.bossId = 'bossdef_demon2';
  room.data.entities.push(second);
  const asm = generate(project, 'boss_mixed');
  expectScenario('bitmap + sprite bosses in one room', asm, {
    present: [...BITMAP_CHAIN, ...SPRITE_KEEPS],
    absent: [...ROCKS, ...NEVER],
  });
}

// 4. Boss with no projectile at all: neither chain.
{
  const project = load(BOSS_DEF);
  const params = bossDefinition(project);
  delete params.bossProjectileKind;
  delete params.bossShootInterval;
  delete params.bossProjectileSpeed;
  delete params.bossProjectileDamage;
  const asm = generate(project, 'boss_nopj');
  expectScenario('no projectiles', asm, { absent: [...BITMAP_CHAIN, ...ROCKS, ...NEVER, 'bitmap_boss_proj_config_ix'] });
}

// 5. Boss bodies composed of cells (the only ones that ever emitted bitmap_boss_draw_animated).
for (const [title, file] of [['cell-composed body', STAMPBODY], ['cells + zero enemies', NO_ENEMY]]) {
  const asm = generate(load(file), title);
  checks.push([`${title}: the project really has a cell-composed body (bitmap_boss_cells_config)`, has(asm, 'bitmap_boss_cells_config')]);
  expectScenario(title, asm, { absent: NEVER });
}

// ---- report ------------------------------------------------------------------------------
let failed = 0;
for (const [title, ok] of checks) {
  if (!ok) failed++;
  realLog(`${ok ? 'OK  ' : 'FAIL'}: ${title}`);
}
if (failed) {
  console.error(`\nMSX2 boss dead-code checks FAILED (${failed}/${checks.length}).`);
  process.exit(1);
}
realLog(`\nMSX2 boss dead-code checks passed (${checks.length}).`);
