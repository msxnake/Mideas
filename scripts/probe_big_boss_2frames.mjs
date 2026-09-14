#!/usr/bin/env node
/**
 * Probe: can a LARGE SCREEN 5 bitmap boss (8x6 cells = 128x96) carry a 2-frame
 * animation in the user's real project (Downloads/test606.json)?
 *
 * Cases:
 *   A) as-is (1 frame)              -> baseline sanity
 *   B) sparse variant, few cells    -> the normal "+ Añadir frame" edit
 *   C) sparse variant, all 48 cells -> worst-case VRAM (frames share nothing)
 *
 * Mirrors scripts/check_generator_output_identical.mjs build + config flow.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TS_BUILD_DIR = path.join(ROOT, 'server', 'temp', 'tsbuild_probe');
const PROJECT = 'C:\\Users\\salam\\Downloads\\test606.json';
const STAMP_ID = 'tuneladora1_1786869743459';
const BOSS_DEF_ID = 'msx2boss_1786877495004';

function buildGenerator(reuse = false) {
  const compiledIndex = path.join(TS_BUILD_DIR, 'utils', 'msxGenerator', 'index.js');
  console.log('Compiling the generator with tsc...');
  if (!reuse) fs.rmSync(TS_BUILD_DIR, { recursive: true, force: true });
  if (reuse && fs.existsSync(compiledIndex)) return require(compiledIndex);
  fs.mkdirSync(TS_BUILD_DIR, { recursive: true });
  const tscBin = path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');
  execFileSync(process.execPath, [
    tscBin, '--pretty', 'false', '--module', 'commonjs', '--target', 'ES2020',
    '--outDir', TS_BUILD_DIR, '--moduleResolution', 'node', '--skipLibCheck',
    '--noEmitOnError', 'false', 'utils/msxGenerator/index.ts',
  ], { cwd: ROOT, stdio: 'pipe' });
  fs.writeFileSync(path.join(TS_BUILD_DIR, 'package.json'), '{"type":"commonjs"}');
  return require(compiledIndex);
}

// Clone a stamp tile and flip some pixels so its fingerprint differs.
function mutatedTile(tile, salt) {
  const pixels = tile.pixelData.slice();
  for (let i = 0; i < pixels.length; i += 7) pixels[i] = (pixels[i] + salt) % 15;
  return { ...tile, id: `${tile.id}_v${salt}`, pixelData: pixels };
}

function addSecondFrame(assets, changedCells) {
  for (const asset of assets) {
    if (asset.type !== 'msx2bitmapstamp' || asset.id !== STAMP_ID) continue;
    const stamp = asset.data.stamp;
    const cells = [];
    for (let index = 0; index < changedCells; index++) {
      cells.push({ index, tile: mutatedTile(stamp.tiles[index], index + 1) });
    }
    stamp.frameVariants = [{ id: `${stamp.id}_probe_f1`, name: 'Frame 1', cells }];
    return stamp;
  }
  throw new Error(`stamp ${STAMP_ID} not found`);
}

function setBossFrames(assets, frames) {
  for (const asset of assets) {
    if (asset.type !== 'msx2boss') continue;
    const data = asset.data || {};
    if (asset.id === BOSS_DEF_ID) {
      data.bossFrames = frames;
      console.log(`   [setBossFrames] def ${asset.id} (${asset.name}) -> bossFrames=${frames}`);
    }
  }
  for (const asset of assets) {
    if (asset.type !== 'msx2bitmaproom') continue;
    for (const entity of (asset.data?.entities || [])) {
      if (entity?.kind !== 'boss') continue;
      const params = entity.params || {};
      if (params.bossId === BOSS_DEF_ID) params.bossFrames = frames;
    }
  }
}

function run(generator, label, assets) {
  const warnings = [];
  const logs = [];
  const realWarn = console.warn;
  const realLog = console.log;
  console.warn = (...args) => { warnings.push(args.join(' ')); };
  console.log = (...args) => { logs.push(args.join(' ')); };
  let outcome;
  try {
    const files = generator.generateModularASM('test606_probe', assets, {
      generateUnified: true,
      romMode: 'megarom',
      targetFormat: 'konami',
      screenMode: 'SCREEN 4 (Graphics II)',
    });
    const asm = files['unitedFiles.asm'] || files['main.asm'];
    const hash = createHash('sha256').update(asm.replace(/\r\n/g, '\n')).digest('hex').slice(0, 16);
    outcome = `OK  asm bytes=${asm.length} sha=${hash}`;
    fs.writeFileSync(path.join(ROOT, 'server', 'temp', 'probe_last.asm'), asm);
  } catch (error) {
    outcome = `THROW  ${String(error.message).split('\n')[0]}`;
  } finally {
    console.warn = realWarn;
    console.log = realLog;
  }
  console.log(`${label}: ${outcome}`);
  if (fs.existsSync(path.join(ROOT, 'server', 'temp', 'probe_last.asm'))) {
    const asm = fs.readFileSync(path.join(ROOT, 'server', 'temp', 'probe_last.asm'), 'utf8');
    const bands = asm.split('\n').filter(l => /body band/.test(l)).map(l => l.trim());
    for (const b of bands) console.log(`   bands: ${b}`);
  }
  const interesting = [...logs, ...warnings].filter(w =>
    /boss window|vram tenant|atlas (ends|rows)|dialogue blob|dark|rows before/i.test(w));
  for (const w of interesting.slice(0, 12)) console.log(`   · ${w.slice(0, 220)}`);
}

const generator = buildGenerator(true);

run(generator, 'A) as-is (1 frame)', JSON.parse(fs.readFileSync(PROJECT, 'utf8')).assets);

for (const changed of [7, 8]) {
  const assets = JSON.parse(fs.readFileSync(PROJECT, 'utf8')).assets;
  addSecondFrame(assets, changed);
  setBossFrames(assets, 2);
  run(generator, `N=${changed}/48 cells changed`, assets);
}

// Small boss in an EXPORTED room (Boss_Drone, 5x3, pan18): 2 sparse frames.
{
  const assets = JSON.parse(fs.readFileSync(PROJECT, 'utf8')).assets;
  for (const asset of assets) {
    if (asset.type !== 'msx2bitmapstamp' || asset.id !== 'boss_drone_1785058523184') continue;
    const stamp = asset.data.stamp;
    stamp.frameVariants = [{
      id: `${stamp.id}_probe_f1`, name: 'Frame 1',
      cells: Array.from({ length: 6 }, (_u, index) => ({ index, tile: mutatedTile(stamp.tiles[index], index + 1) })),
    }];
  }
  for (const asset of assets) {
    if (asset.type === 'msx2boss' && asset.id === 'msx2boss_1785006926743') asset.data.bossFrames = 2;
    if (asset.type !== 'msx2bitmaproom') continue;
    for (const entity of (asset.data?.entities || [])) {
      if (entity?.kind === 'boss' && entity.params?.bossId === 'msx2boss_1785006926743') entity.params.bossFrames = 2;
    }
  }
  run(generator, 'E) small boss (drone) 2 frames, 6 cells', assets);
}
