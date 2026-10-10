#!/usr/bin/env node
/**
 * Contract of the pursuer soldier's DATA side (utils/msx2Pursuer.ts + msx2BitmapPursuerGenerator.ts), no emulator needed:
 *   1. the alert-zone normalizer: defaults (4 s, 32 px), limits (0.5..30 s, 0..255 px), garbage in -> disabled;
 *   2. the project resolver: exactly one enemy with pursuer.enabled; 16x32 stackVertical sprite; a `rules` program;
 *   3. every generator error the Director asked for, each triggered from the real lab project and each expected to THROW
 *      with the right message: boss in an alert room, exceeding the 32 hardware slots, two soldiers, no soldier at all,
 *      soldier also placed by hand, wrong sprite, path_follow program, non-MegaROM export;
 *   3b. the soldier's TERRAIN BODY: the resident descriptor 03 03 08 1C (the player's hitbox), its isolation from an enemy with the same sprite,
 *      the spawn/patrol clamps, the logic interval, ANIM_CLIP and its D9-1 rule (rejected in every behaviour that is not the soldier's);
 *   3c. the guard of the explicit terrain body (limits, rejected shapes);
 *   4. the OFF promise: a pursuer enemy asset with no alert zone anywhere generates the exact same ASM as the project without it;
 *   5. the ORDER of the room-change hook: in commit_room_flip, `call bitmap_pursuer_init` is the last call before the final
 *      `call bitmap_room_restore_resident_banks`. The init reads player_x / player_y as the soldier's entry point, and a loader
 *      that runs after it can still move the player (bitmap_shaft_after_commit rewrites player_y to the lift cabin's).
 *
 *   node scripts/check_msx2_pursuer_contract.mjs [--gen <dir with the tsc output of utils/msxGenerator/index.ts>] [--lab <pursuer_alert_lab.json>]
 *
 * Without --gen it compiles the generator itself (like scripts/measure_bitmap_rom_budget.mjs). Exit code 1 on any failure.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const val = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
let genDir = val('--gen');
const labPath = val('--lab') || path.join(ROOT, 'test', 'msx2-pursuer', 'pursuer_alert_lab.json');

if (!genDir) {
  genDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mideas_pursuer_contract_gen_'));
  try {
    execFileSync(process.execPath, [path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc'), '--pretty', 'false', '--module', 'commonjs', '--target', 'ES2020',
      '--outDir', genDir, '--moduleResolution', 'node', '--skipLibCheck', '--noEmitOnError', 'false', 'utils/msxGenerator/index.ts'], { cwd: ROOT, stdio: 'pipe', maxBuffer: 1 << 28 });
  } catch (error) {
    if (!fs.existsSync(path.join(genDir, 'utils', 'msxGenerator', 'index.js'))) throw new Error(`tsc produced no output:\n${error.stdout || error.message}`);
  }
  fs.writeFileSync(path.join(genDir, 'package.json'), '{"type":"commonjs"}');
}
const req = createRequire(import.meta.url);
const generator = req(path.join(genDir, 'utils', 'msxGenerator', 'index.js'));
const model = req(path.join(genDir, 'utils', 'msx2Pursuer.js'));

let failures = 0;
const check = (name, ok, detail = '') => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`); };

// ---- 1. alert zone normalizer ----------------------------------------------------------------------------------------------------
{
  const n = model.normalizeMsx2AlertZone;
  const d = n(undefined);
  check('alertZone default is disabled, 4 s, 32 px', d.enabled === false && d.spawnDelaySec === 4 && d.guardPx === 32, JSON.stringify(d));
  check('alertZone enabled keeps defaults', n({ enabled: true }).spawnDelaySec === 4 && n({ enabled: true }).guardPx === 32);
  check('alertZone delay clamps to 0.5..30 s', n({ spawnDelaySec: 0 }).spawnDelaySec === 0.5 && n({ spawnDelaySec: 99 }).spawnDelaySec === 30 && n({ spawnDelaySec: 2.5 }).spawnDelaySec === 2.5);
  check('alertZone guard clamps to 0..255 px and rounds', n({ guardPx: -5 }).guardPx === 0 && n({ guardPx: 999 }).guardPx === 255 && n({ guardPx: 31.6 }).guardPx === 32 && n({ guardPx: 0 }).guardPx === 0);
  check('alertZone garbage becomes the defaults', n({ spawnDelaySec: 'abc', guardPx: null, enabled: 'yes' }).spawnDelaySec === 4 && n('x').enabled === false && n(null).guardPx === 32);
  check('alertZone 2 s = 120 frames, 0.5 s = 30, 30 s = 1800', model.msx2AlertSpawnDelayFrames(n({ spawnDelaySec: 2 })) === 120 && model.msx2AlertSpawnDelayFrames(n({ spawnDelaySec: 0.5 })) === 30 && model.msx2AlertSpawnDelayFrames(n({ spawnDelaySec: 30 })) === 1800);
}

// ---- the lab project ---------------------------------------------------------------------------------------------------------------
const load = () => JSON.parse(fs.readFileSync(labPath, 'utf8'));
const config = { generateUnified: true, romMode: 'megarom', targetFormat: 'konami', autoMegaROM: false, screenMode: 'SCREEN 4 (Graphics II)', targetGraphicsBackend: 'screen5' };
function generate(project, cfg = config) {
  const realLog = console.log, realWarn = console.warn, realError = console.error;
  console.log = () => {}; console.warn = () => {}; console.error = () => {};
  try { return generator.generateModularASM(project.name || 'proj', project.assets, cfg)['unitedFiles.asm']; }
  finally { console.log = realLog; console.warn = realWarn; console.error = realError; }
}
function expectThrow(name, project, pattern, cfg = config) {
  try { generate(project, cfg); check(name, false, 'did NOT throw'); }
  catch (error) { const msg = String(error && error.message || error); check(name, pattern.test(msg), `threw: ${msg.slice(0, 170)}`); }
}
const room = (p, letter) => p.assets.find(a => a.id === `pursuer_lab_${letter}`);
const soldierAsset = p => p.assets.find(a => a.type === 'msx2enemy' && a.data.pursuer?.enabled);

// ---- 2. the project resolver --------------------------------------------------------------------------------------------------------
{
  const p = load();
  const r = model.resolveMsx2PursuerProject(p.assets);
  check('resolver finds the one soldier of the lab', !!r.soldier && r.errors.length === 0 && r.candidateCount === 1, JSON.stringify(r.errors));
  check('resolver: no pursuer asset = no soldier, no error', (() => { const q = load(); q.assets = q.assets.filter(a => a !== soldierAsset(q)); const x = model.resolveMsx2PursuerProject(q.assets); return !x.soldier && x.candidateCount === 0 && x.errors.length === 0; })());
}

// ---- 3. generator errors --------------------------------------------------------------------------------------------------------------
{
  const base = generate(load());
  check('the lab itself generates (alert rooms B and C)', typeof base === 'string' && base.includes('bitmap_pursuerb_tick:') && base.includes('"kind":"pursuer-code"'));
}
// The calls of commit_room_flip in program order (its body ends at the next `; FUNCTION:` header). Static checks on the real generator
// output: no emulator, and no flag set by hand (the hook comes from the authored alert zone).
function commitRoomFlipCalls(asm) {
  const lines = asm.split(/\r?\n/);
  const start = lines.findIndex(l => /^commit_room_flip:\s*$/.test(l));
  let end = lines.findIndex((l, i) => i > start && /^; FUNCTION:/.test(l));
  if (end < 0) end = lines.length;
  const calls = start < 0 ? [] : lines.slice(start, end).map((l, i) => ({ line: start + i + 1, m: l.match(/^\s*call\s+([A-Za-z_.][A-Za-z0-9_.]*)\s*(?:;.*)?$/) })).filter(c => c.m).map(c => ({ line: c.line, target: c.m[1] }));
  return { found: start >= 0, calls, tail: calls.slice(-4).map(c => `${c.target}@${c.line}`).join(' -> ') };
}
{
  const { found, calls, tail } = commitRoomFlipCalls(generate(load()));
  const inits = calls.filter(c => c.target === 'bitmap_pursuer_init');
  const last = calls.length - 1;
  const ok = found && inits.length === 1 && last >= 1 && calls[last].target === 'bitmap_room_restore_resident_banks' && calls[last - 1].target === 'bitmap_pursuer_init';
  check('commit_room_flip: `call bitmap_pursuer_init` is the last call before `call bitmap_room_restore_resident_banks`', ok,
    found ? `init calls=${inits.length}; last calls: ${tail}` : 'no commit_room_flip label');
}
{
  // The reason for the order: with a lift (platform_shaft) in the project, bitmap_shaft_after_commit rewrites player_y to the cabin's.
  // The hook has to run AFTER it, or the soldier comes out at the Y of the room edge the player entered by.
  const p = load();
  room(p, 'a').data.entities.push({
    id: 'lift_ab', name: 'Lift A-B', kind: 'platform_shaft', position: { x: 8, y: 10 },
    components: { msx2_hardware_sprite: { msx2SpriteAssetId: '' } },
    params: { path: [room(p, 'a').id, room(p, 'b').id], bottomSlot: 0, bottomY: 176, topSlot: 1, topY: 16, startSlot: 0, startY: 176, speed: 1 },
  });
  const { found, calls, tail } = commitRoomFlipCalls(generate(p));
  const shaftAt = calls.findIndex(c => c.target === 'bitmap_shaft_after_commit');
  const initAt = calls.findIndex(c => c.target === 'bitmap_pursuer_init');
  check('commit_room_flip with a lift: `call bitmap_pursuer_init` comes AFTER `call bitmap_shaft_after_commit`', found && shaftAt >= 0 && initAt > shaftAt,
    found ? `shaft hook at call #${shaftAt}, pursuer init at call #${initAt}; last calls: ${tail}` : 'no commit_room_flip label');
}
{
  const p = load();
  room(p, 'b').data.entities.push({ id: 'a_boss', name: 'Boss', kind: 'boss', position: { x: 8, y: 6 }, components: {}, params: {} });
  expectThrow('alert room with a boss -> error', p, /has a boss/);
}
{
  // Soldier = 2 slots; two more 16x32 enemies = 6. All layers must survive.
  const p = load();
  const asset = soldierAsset(p);
  const extra = i => ({
    id: `extra_${i}`, name: 'Extra', kind: 'enemy', position: { x: 4 + i * 3, y: 9 }, spriteAssetId: asset.data.render.spriteId,
    components: {
      msx2_transform: { tileX: 4 + i * 3, tileY: 9, pixelX: (4 + i * 3) * 16, pixelY: 144, spawnX: (4 + i * 3) * 16, spawnY: 144 },
      msx2_hardware_sprite: { msx2SpriteAssetId: asset.data.render.spriteId, frame: 0, paletteSlot: 10, visible: true },
      msx2_movement: { mode: 'scripted', direction: 1, speed: 1, minX: 16, maxX: 224, boundsUnit: 'px' },
      msx2_ai: { behaviorAssetId: asset.data.behavior.behaviorAssetId, logicUpdateIntervalFrames: 2 },
      msx2_collision: { hitboxW: 16, hitboxH: 32, offsetX: 0, offsetY: 0, solid: false, damage: 1 },
    },
    params: { runtime: 'MSX2', engine: 'staticEnemy', movement: 'scripted', behaviorAssetId: asset.data.behavior.behaviorAssetId },
  });
  room(p, 'c').data.entities.push(extra(0), extra(1));
  const expanded = generate(p);
  check('alert room reserves all six enemy hardware slots', /ENEMY runtime state[^\n]*count \+ 6 slot/.test(expanded));
  check('pursuer retains both body cells with other enemies', /BITMAP_PURSUER_SLOTS\s+EQU\s+2\b/i.test(expanded));
  // A room without alert must also keep every layer rather than silently truncating.
  const q = load();
  room(q, 'a').data.entities.push(extra(0), extra(1), extra(2));
  const withoutAlert = generate(q);
  check('non-alert room reserves all six enemy hardware slots', /ENEMY runtime state[^\n]*count \+ 6 slot/.test(withoutAlert));
  // More than 12 logical enemies must be inspected: SCREEN 4's entity cap must not hide SCREEN 5 overflow.
  const overflow = load();
  room(overflow, 'a').data.entities = Array.from({ length: 17 }, (_, i) => extra(i));
  expectThrow('17 two-cell enemies exceed the real 32-slot ceiling', overflow, /enemies need 34 hardware sprite slots.*32/);
  const combined = load();
  for (const letter of ['a', 'b', 'c', 'd']) delete room(combined, letter).data.runtime.alertZone;
  // One-cell, one-frame art keeps the pattern reservation below 64 groups;
  // the failure must be the SAT budget, independently of pattern memory.
  const simple = structuredClone(combined.assets.find(a => a.id === 'smoke_player_sprite'));
  simple.id = 'slot_budget_enemy'; simple.data.id = simple.id;
  simple.data.frames = simple.data.frames.slice(0, 1);
  simple.data.frames[0].data = Array.from({ length: 16 }, () => Array(16).fill('#FFFFFF'));
  combined.assets.push(simple);
  room(combined, 'a').data.entities = Array.from({ length: 28 }, (_, i) => ({
    id: `budget_${i}`, kind: 'enemy', position: { x: i % 14 + 1, y: 9 }, spriteAssetId: simple.id,
    components: { msx2_hardware_sprite: { msx2SpriteAssetId: simple.id }, msx2_movement: { mode: 'patrol' } },
    params: {},
  }));
  expectThrow('28 single-cell enemies plus the player and reserved slots exceed total SAT capacity', combined, /sprite allocation needs.*32/);
  room(combined, 'a').data.entities.length = 26;
  check('exactly 32 total SAT slots fit with SHOOT disabled', !!generate(combined));
  const player = combined.assets.find(a => a.type === 'msx2player').data.player;
  player.activeSkills.push('shoot');
  player.skillParameters.shoot = { maxBullets: 1 };
  expectThrow('a player bullet beyond the 32 total slots is rejected', combined, /sprite allocation needs 33 hardware slots/);
}
{
  const p = load();
  const clone = JSON.parse(JSON.stringify(soldierAsset(p)));
  clone.id = 'msx2enemy_second_soldier'; clone.name = 'Second soldier'; clone.data.assetId = clone.id; clone.data.enemyId = 'second';
  p.assets.push(clone);
  expectThrow('two enemies with pursuer.enabled -> error', p, /Only one enemy may be the pursuer soldier/);
}
{
  const p = load();
  p.assets = p.assets.filter(a => a !== soldierAsset(p));
  expectThrow('alert zone but no soldier asset -> error', p, /no enemy is the pursuer soldier/);
}
{
  const p = load();
  const asset = soldierAsset(p);
  room(p, 'b').data.entities.push({ id: 'by_hand', name: 'By hand', kind: 'enemy', position: { x: 9, y: 9 }, components: { msx2_movement: { mode: 'scripted' } }, params: { enemyAssetId: asset.id } });
  expectThrow('soldier also placed by hand in an alert room -> error', p, /placed by hand/);
}
{
  const p = load();
  const sprite = p.assets.find(a => a.id === soldierAsset(p).data.render.spriteId);
  sprite.data.superSpriteLayout = 'single16';
  expectThrow('soldier sprite not stackVertical -> error', p, /stackVertical/);
  const q = load();
  q.assets.find(a => a.id === soldierAsset(q).data.render.spriteId).data.size = { width: 16, height: 16 };
  expectThrow('soldier sprite not 16x32 -> error', q, /must be 16x32/);
}
{
  const p = load();
  const behavior = p.assets.find(a => a.id === soldierAsset(p).data.behavior.behaviorAssetId);
  behavior.data.kind = 'path_follow';
  expectThrow('soldier behaviour is a path_follow route -> error', p, /path_follow/);
}
{
  expectThrow('alert zone in a non-MegaROM export -> error', load(), /Alert zones need a Konami MegaROM/, { ...config, romMode: 'normal', targetFormat: 'plain' });
}

// ---- 3b. the soldier's TERRAIN BODY (resident descriptor 03 03 08 1C), its isolation from other enemies, the clamps and ANIM_CLIP ----------
// Every check starts from the alert lab project and reads the generated ASM: nothing here sets a flag by hand, the descriptor has to come out
// of the pursuer generator + the room generator or the soldier is probed as the complete 16x32 sprite (the engine's default for any enemy).
const dbBytes = (asm, label) => {
  const lines = asm.split(/\r?\n/);
  const at = lines.findIndex(l => l.startsWith(`${label}:`));
  if (at < 0) return null;
  const out = [];
  for (let i = at + 1; i < lines.length && /^\s*(DB|db)\b/.test(lines[i]); i++) {
    for (const part of lines[i].replace(/;.*$/, '').replace(/^\s*(DB|db)\s+/, '').split(',')) {
      const m = part.trim().match(/^#([0-9A-Fa-f]+)$/);
      if (m) out.push(parseInt(m[1], 16)); else if (/^\d+$/.test(part.trim())) out.push(parseInt(part.trim(), 10));
    }
  }
  return out;
};
// Room table record: x y dx dy minX maxX minY maxY patGroupOff colorOff frameCount delay mode offX offY damage hitX hitY hitW hitH speed interval | program.
const RECORD = 23;
const F = { x: 0, y: 1, minX: 4, maxX: 5, minY: 6, maxY: 7, colorOff: 9, mode: 12, offY: 14, speed: 20, interval: 21, program: 22 };
const slotBytes = (asm, room, slot) => dbBytes(asm, `bitmap_room_enemy_table_${room}`).slice(1 + slot * RECORD, 1 + (slot + 1) * RECORD);
/** The resident terrain descriptor (hex, left top width-1 height-1) the engine loads for a table record: bitmap_enemy_sprite_body_bounds[4 * colorOff]. */
const descriptorOf = (asm, record) => {
  const table = dbBytes(asm, 'bitmap_enemy_sprite_body_bounds');
  const at = 4 * record[F.colorOff];
  return table && table.length >= at + 4 ? table.slice(at, at + 4).map(v => v.toString(16).toUpperCase().padStart(2, '0')).join('') : null;
};
const SOLDIER_DESC = '0303081C', SPRITE_DESC = '00000F1F';
{
  const p = load();
  const asm = generate(p);
  const table = dbBytes(asm, 'bitmap_enemy_sprite_body_bounds');
  check('the lab ROM has a resident terrain descriptor table (4 bytes per colour block)', !!table && table.length >= 4 && table.length % 4 === 0, `${table && table.length} bytes`);
  // Room B (global index 1) is an alert room: slot 0 is the soldier's leader, slot 1 its second cell.
  const leader = slotBytes(asm, 1, 0), follower = slotBytes(asm, 1, 1);
  check('the soldier loads hidden (mode #FF) and the pool carries the clip byte (stride 31 = 24 + 6 scripted + 1 clip)', leader[F.mode] === 0xff && /BITMAP_PURSUER_POOL_STRIDE EQU 31\b/.test(asm), `mode byte ${leader[F.mode]}`);
  check('THE BUG THIS GUARDS: the soldier\'s leader and follower point at the descriptor 03 03 08 1C (the player\'s hitbox x+3..x+11, y+3..y+31), not at the 16x32 sprite',
    descriptorOf(asm, leader) === SOLDIER_DESC && descriptorOf(asm, follower) === SOLDIER_DESC, `leader ${descriptorOf(asm, leader)}, follower ${descriptorOf(asm, follower)}`);
  // The clamps use the SAME geometry: the leader's origin may reach 192 - (top 3 + height 29) = 160, x up to 256 - (left 3 + width 9) = 244 (its authored 240 is tighter).
  check('the soldier\'s spawn / patrol clamps are the final geometry: minX 0, maxX 240, minY 0, maxY 160 (feet row y+32 = 192) for the leader, +16 for the follower',
    leader[F.minX] === 0 && leader[F.maxX] === 240 && leader[F.minY] === 0 && leader[F.maxY] === 160 && follower[F.maxY] === 176 && follower[F.offY] === 16,
    `leader x ${leader[F.minX]}..${leader[F.maxX]} y ${leader[F.minY]}..${leader[F.maxY]}, follower maxY ${follower[F.maxY]}`);
  check('the soldier\'s logic interval is FORCED to 1 (its asset says 2) in the room table', leader[F.interval] === 1 && soldierAsset(load()).data.logicUpdateIntervalFrames === 2, `table interval=${leader[F.interval]}, asset=${soldierAsset(load()).data.logicUpdateIntervalFrames}`);
  const actCount = (asm.match(/bitmap_enemy_script_act_table:\n((?:\s+dw [^\n]+\n)+)/) || [, ''])[1].trim().split('\n').length;
  check('the action table of a ROM with a soldier has 21 entries and ANIM_CLIP is the last', actCount === 21 && /dw bitmap_enemy_script_act_anim_clip\s+; 14 ANIM_CLIP/.test(asm), `entries=${actCount}`);
  check('no body-profile machinery is left in the ROM (one engine: the complete-body one)', !/bitmap_enemy_script_profile|_tall:|probe_ahead_tall/.test(asm));
}
{
  // CACHE ISOLATION. Sprite grids and sprite records are shared by every enemy with the same art, and the descriptor travels with the record
  // (its colour offset). A plain enemy with the SAME sprite and the SAME behaviour, in the soldier's own alert room and in a room without alert,
  // must keep the complete sprite box, whichever of the two is expanded first; and the soldier must keep the player's box next to it.
  // The plain enemy renders from a CLONE of the soldier's Enemy Asset without `pursuer` (placing the soldier's own asset by hand in an alert room is
  // an error): same sprite, same frames, same speed, same behaviour, so its render cache key is the soldier's up to the soldier flag.
  const make = (p, id, x) => {
    const soldier = soldierAsset(p);
    let clone = p.assets.find(a => a.id === 'msx2enemy_plain_boina');
    if (!clone) {
      clone = JSON.parse(JSON.stringify(soldier));
      clone.id = 'msx2enemy_plain_boina'; clone.name = 'PlainBoina'; clone.data.assetId = clone.id; clone.data.enemyId = 'plain_boina'; clone.data.name = 'PlainBoina';
      delete clone.data.pursuer;
      p.assets.push(clone);
    }
    return {
      id, name: 'PlainBoina', kind: 'enemy', position: { x, y: 9 }, spriteAssetId: soldier.data.render.spriteId,
      components: {
        msx2_transform: { tileX: x, tileY: 9, pixelX: x * 16, pixelY: 144, spawnX: x * 16, spawnY: 144 },
        msx2_hardware_sprite: { msx2SpriteAssetId: soldier.data.render.spriteId, frame: 0, paletteSlot: 10, visible: true },
        msx2_movement: { mode: 'scripted', direction: 1, speed: 1, minX: 16, maxX: 224, boundsUnit: 'px' },
        msx2_ai: { behaviorAssetId: soldier.data.behavior.behaviorAssetId, logicUpdateIntervalFrames: 2 },
        msx2_collision: { hitboxW: 16, hitboxH: 32, offsetX: 0, offsetY: 0, solid: false, damage: 1 },
      },
      params: { runtime: 'MSX2', engine: 'staticEnemy', movement: 'scripted', behaviorAssetId: soldier.data.behavior.behaviorAssetId, enemyAssetId: clone.id },
    };
  };
  const rows = [];
  for (const [label, order] of [['plain enemy in the alert room B', ['b']], ['plain enemy in the quiet room A (expanded BEFORE the soldier\'s room)', ['a']], ['plain enemies in both', ['a', 'b']]]) {
    const p = load();
    order.forEach((letter, i) => room(p, letter).data.entities.push(make(p, `plain_${letter}`, 4 + 3 * i)));
    const asm = generate(p);
    const soldier = slotBytes(asm, 1, 0);
    const soldierDesc = descriptorOf(asm, soldier);
    // the plain enemy: in room B it is entity 1 (after the soldier, slots 2..3); in room A it is entity 0 (slots 0..1)
    const plains = order.map(letter => (letter === 'b' ? slotBytes(asm, 1, 2) : slotBytes(asm, 0, 0)));
    const ok = soldierDesc === SOLDIER_DESC && plains.every(rec => descriptorOf(asm, rec) === SPRITE_DESC && rec[F.colorOff] !== soldier[F.colorOff] && rec[F.interval] === 2);
    check(`ISOLATION (${label}): the soldier keeps 03 03 08 1C and the plain enemy with the SAME sprite keeps the complete sprite box 00 00 0F 1F on its own record`, ok,
      `soldier ${soldierDesc} colorOff ${soldier[F.colorOff]}; plains ${plains.map(rec => `${descriptorOf(asm, rec)} colorOff ${rec[F.colorOff]} interval ${rec[F.interval]}`).join(' | ')}`);
    rows.push({ asm, plains });
  }
  const { asm, plains } = rows[0];
  const soldier = slotBytes(asm, 1, 0);
  check('... both share ONE behaviour program (the program is per asset: no alias, no second copy) and the plain enemy keeps its own clamps (16x32 body: maxY 160)',
    plains[0][F.program] === soldier[F.program] && plains[0][F.maxY] === 160 && !/same bytes as program/.test(asm), `soldier program ${soldier[F.program]}, plain program ${plains[0][F.program]}, plain maxY ${plains[0][F.maxY]}`);
}
{
  // ANIM_CLIP (0x14) and the reserved 0x12/0x13: the soldier's BEHAVIOUR may use them (and so may any other enemy that shares it), any other
  // behaviour asset may not.
  const useClip = (p, behaviorId, action = 'ANIM_CLIP', arg = 0x12) => {
    const b = p.assets.find(a => a.id === behaviorId);
    b.data.states = [{ id: 's0', name: 'Clip', rules: [{ id: 'r0', condition: 'ALWAYS', action, actionArg: arg }] }];
  };
  const p = load();
  const soldierBehaviorId = soldierAsset(p).data.behavior.behaviorAssetId;
  useClip(p, soldierBehaviorId);
  let built = true; try { generate(p); } catch (e) { built = false; }
  check('ANIM_CLIP in the SOLDIER\'s behaviour builds', built);
  // DEFECT D9-1: an enemy of ANOTHER room that shares the soldier's behaviour (the lab has one in room A, expanded before the soldier's rooms)
  // must not break the build with a message about opcodes "only for the soldier".
  const shared = load();
  useClip(shared, soldierBehaviorId);
  const sharedSoldier = soldierAsset(shared);
  const sharer = {
    id: 'sharer_in_a', name: 'Sharer', kind: 'enemy', position: { x: 10, y: 9 }, spriteAssetId: sharedSoldier.data.render.spriteId,
    components: {
      msx2_transform: { tileX: 10, tileY: 9, pixelX: 160, pixelY: 144, spawnX: 160, spawnY: 144 },
      msx2_hardware_sprite: { msx2SpriteAssetId: sharedSoldier.data.render.spriteId, frame: 0, paletteSlot: 10, visible: true },
      msx2_movement: { mode: 'scripted', direction: 1, speed: 1, minX: 16, maxX: 224, boundsUnit: 'px' },
      msx2_ai: { behaviorAssetId: soldierBehaviorId, logicUpdateIntervalFrames: 2 },
      msx2_collision: { hitboxW: 16, hitboxH: 32, offsetX: 0, offsetY: 0, solid: false, damage: 1 },
    },
    params: { runtime: 'MSX2', engine: 'staticEnemy', movement: 'scripted', behaviorAssetId: soldierBehaviorId },
  };
  room(shared, 'a').data.entities.push(sharer);
  let sharedBuilt = true, sharedMessage = '';
  try { generate(shared); } catch (e) { sharedBuilt = false; sharedMessage = String(e && e.message || e).slice(0, 160); }
  check('D9-1: an enemy of another room that SHARES the soldier\'s behaviour (which carries ANIM_CLIP) builds, whichever room is expanded first', sharedBuilt, sharedMessage);
  // the same behaviour used by a classic enemy only (no alert zone anywhere, no soldier asset): refused
  const q = load();
  for (const letter of ['a', 'b', 'c', 'd']) delete room(q, letter).data.runtime.alertZone;
  q.assets = q.assets.filter(a => a !== soldierAsset(q));
  const classicAsset = { id: 'msx2enemybehavior_classic', name: 'Classic', type: 'msx2enemybehavior', data: { id: 'msx2enemybehavior_classic', name: 'Classic', target: 'MSX2', initialState: 0, speedPxPerTick: 1, logicIntervalFrames: 2, states: [{ id: 's0', name: 'Clip', rules: [{ id: 'r0', condition: 'ALWAYS', action: 'ANIM_CLIP', actionArg: 0x12 }] }] } };
  q.assets.push(classicAsset);
  const spriteId = soldierAsset(load()).data.render.spriteId;
  const classicEntity = {
    id: 'classic_clip', name: 'Classic', kind: 'enemy', position: { x: 10, y: 9 }, spriteAssetId: spriteId,
    components: {
      msx2_transform: { tileX: 10, tileY: 9, pixelX: 160, pixelY: 144, spawnX: 160, spawnY: 144 },
      msx2_hardware_sprite: { msx2SpriteAssetId: spriteId, frame: 0, paletteSlot: 10, visible: true },
      msx2_movement: { mode: 'scripted', direction: 1, speed: 1, minX: 16, maxX: 224, boundsUnit: 'px' },
      msx2_ai: { behaviorAssetId: classicAsset.id, logicUpdateIntervalFrames: 2 },
      msx2_collision: { hitboxW: 16, hitboxH: 32, offsetX: 0, offsetY: 0, solid: false, damage: 1 },
    },
    params: { runtime: 'MSX2', engine: 'staticEnemy', movement: 'scripted', behaviorAssetId: classicAsset.id },
  };
  room(q, 'a').data.entities.push(classicEntity);
  expectThrow('ANIM_CLIP in a behaviour that is NOT the soldier\'s -> error (it would be a silent idle)', q, /uses action opcode 0x14/);
  // ... and with a soldier in the project, a classic enemy running ANOTHER behaviour with ANIM_CLIP is still refused
  const r2 = load();
  r2.assets.push(classicAsset);
  const other = JSON.parse(JSON.stringify(classicEntity));
  other.components.msx2_ai.behaviorAssetId = classicAsset.id;
  other.params.behaviorAssetId = classicAsset.id;
  room(r2, 'a').data.entities.push(other);
  expectThrow('... also when the project HAS a soldier: another behaviour with ANIM_CLIP is refused', r2, /uses action opcode 0x14/);
  // the soldier's behaviour may not also set the frame by hand: it would leave the clip
  const r = load();
  const soldierProgram = r.assets.find(a => a.id === soldierBehaviorId);
  soldierProgram.data.states = [{ id: 's0', name: 'Mixed', rules: [{ id: 'r0', condition: 'TIMER_ELAPSED', conditionArg: 10, action: 'SET_ANIM', actionArg: 1 }, { id: 'r1', condition: 'ALWAYS', action: 'ANIM_CLIP', actionArg: 0x12 }] }];
  expectThrow('the soldier\'s behaviour with ANIM_CLIP AND SET_ANIM -> error (a hand-set frame would leave the clip)', r, /uses both Play clip/);
}

// ---- 3c. the guard of the explicit terrain body (getEnemySpriteBodyBounds with a 3rd argument) -----------------------------------------------
{
  const body = req(path.join(genDir, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2EnemyBodyCollision.js'));
  const bytesOf = box => { try { return body.getEnemySpriteBodyBounds({ width: 16, height: 32 }, [{ x: 0, y: 0 }, { x: 0, y: 16 }], box).bytes; } catch (error) { return null; } };
  const hex = bytes => (bytes ? bytes.map(v => v.toString(16).toUpperCase().padStart(2, '0')).join('') : 'THROWS');
  const soldier = model.MSX2_PURSUER_TERRAIN_BODY;
  check('the soldier\'s terrain body constant is left 3, top 3, 9 x 29 and its descriptor bytes are 03 03 08 1C', soldier.left === 3 && soldier.top === 3 && soldier.width === 9 && soldier.height === 29 && hex(bytesOf(soldier)) === '0303081C', hex(bytesOf(soldier)));
  const generic = body.getEnemySpriteBodyBounds({ width: 16, height: 32 }, [{ x: 0, y: 0 }, { x: 0, y: 16 }]);
  check('without an explicit body the complete sprite comes out unchanged: 00 00 0F 1F, left/top 0, right 16, bottom 32', hex(generic.bytes) === '00000F1F' && generic.left === 0 && generic.top === 0 && generic.right === 16 && generic.bottom === 32);
  const accepted = [
    [{ left: 0, top: 0, width: 256, height: 192 }, '00 00 FF BF'.replace(/ /g, '')],
    [{ left: -128, top: -128, width: 256, height: 192 }, '8080FFBF'],
    [{ left: 127, top: 127, width: 1, height: 1 }, '7F7F0000'],
  ];
  for (const [box, want] of accepted) check(`terrain body ${JSON.stringify(box)} is accepted with the descriptor ${want}`, hex(bytesOf(box)) === want, hex(bytesOf(box)));
  const rejected = [
    // the two found by Codex's review: a span that no longer fits one byte (257 -> 256) / that escapes the 192-row limit of the generic branch
    { left: -1, top: 0, width: 257, height: 1 },
    { left: 0, top: -1, width: 1, height: 193 },
    { left: 0, top: 0, width: 257, height: 1 }, { left: 0, top: 0, width: 1, height: 193 },
    { left: -128, top: 0, width: 257, height: 1 }, { left: 0, top: -128, width: 1, height: 193 },
    { left: 0, top: 0, width: 0, height: 1 }, { left: 0, top: 0, width: 1, height: 0 }, { left: 0, top: 0, width: -3, height: 1 },
    { left: -129, top: 0, width: 1, height: 1 }, { left: 0, top: -129, width: 1, height: 1 },
    { left: 128, top: 0, width: 1, height: 1 }, { left: 0, top: 128, width: 1, height: 1 },
    { left: 250, top: 0, width: 9, height: 1 }, { left: 0, top: 190, width: 1, height: 9 },
    { left: 1.5, top: 0, width: 1, height: 1 }, { left: 0, top: 0, width: 8.5, height: 1 }, { left: NaN, top: 0, width: 1, height: 1 },
  ];
  const leaked = rejected.filter(box => bytesOf(box) !== null);
  check(`${rejected.length} out-of-range / empty / fractional terrain bodies are rejected (none emits a descriptor)`, leaked.length === 0, leaked.length ? `ACCEPTED: ${JSON.stringify(leaked)}` : '');
}

// ---- 4. OFF = identical ---------------------------------------------------------------------------------------------------------------
{
  const withAsset = load();
  for (const letter of ['a', 'b', 'c', 'd']) delete room(withAsset, letter).data.runtime.alertZone;
  const withoutAsset = JSON.parse(JSON.stringify(withAsset));
  withoutAsset.assets = withoutAsset.assets.filter(a => a !== soldierAsset(withoutAsset));
  const a = generate(withAsset), b = generate(withoutAsset);
  check('pursuer asset with no alert zone anywhere: ASM identical to the project without the asset', a === b, a === b ? `${a.length} chars` : 'DIFFERENT');
  check('... and no pursuer symbol at all (no label, no EQU, no bank)', !/bitmap_pursuer|BITMAP_PURSUER|pursuer-code/.test(a));
}

console.log(failures ? `\n${failures} check(s) FAILED` : '\nall pursuer contract checks passed');
process.exit(failures ? 1 : 0);
