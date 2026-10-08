#!/usr/bin/env node
/**
 * Contract of the pursuer soldier's DATA side (utils/msx2Pursuer.ts + msx2BitmapPursuerGenerator.ts), no emulator needed:
 *   1. the alert-zone normalizer: defaults (4 s, 32 px), limits (0.5..30 s, 0..255 px), garbage in -> disabled;
 *   2. the project resolver: exactly one enemy with pursuer.enabled; 16x32 stackVertical sprite; a `rules` program;
 *   3. every generator error the Director asked for, each triggered from the real lab project and each expected to THROW
 *      with the right message: boss in an alert room, more than the 4 enemy hardware slots, two soldiers, no soldier at all,
 *      soldier also placed by hand, wrong sprite, path_follow program, non-MegaROM export;
 *   4. the OFF promise: a pursuer enemy asset with no alert zone anywhere generates the exact same ASM as the project without it.
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
  genDir = path.join(os.tmpdir(), 'mideas_pursuer_contract_gen');
  fs.rmSync(genDir, { recursive: true, force: true });
  fs.mkdirSync(genDir, { recursive: true });
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
{
  const p = load();
  room(p, 'b').data.entities.push({ id: 'a_boss', name: 'Boss', kind: 'boss', position: { x: 8, y: 6 }, components: {}, params: {} });
  expectThrow('alert room with a boss -> error', p, /has a boss/);
}
{
  // soldier = 2 slots; two more 16x32 enemies (2 slots each) = 6 > 4
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
  expectThrow('alert room with more than 4 enemy hardware slots -> error', p, /would not fit/);
  // the SAME extras in a room without alert keep the old behaviour (warning + truncation, no error)
  const q = load();
  room(q, 'a').data.entities.push(extra(0), extra(1), extra(2));
  let ok = true; try { generate(q); } catch (e) { ok = false; }
  check('more than 4 slots in a room WITHOUT alert is still only a warning (old behaviour)', ok);
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
  expectThrow('alert zone in a non-MegaROM export -> error', load(), /MegaROM/, { ...config, romMode: 'normal', targetFormat: 'plain' });
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
