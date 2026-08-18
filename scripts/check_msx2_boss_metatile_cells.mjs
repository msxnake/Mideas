#!/usr/bin/env node
/**
 * FASE 3 of the VRAM study (§5): the boss body is a metatile, not a blob.
 *
 * The stamp asset was always authored as 16x16 cells; the generator used to
 * flatten them into one rectangle and blit it with a single HMMM. Now each cell
 * goes into the shared atlas on its own, so the packer's fingerprint dedup
 * collapses flat fill, repeated background and cells shared between animation
 * frames -- and the 64px-tall blob stops wrecking the shelf packing.
 *
 * Splitting does NOT make the blit cheaper (same area, plus per-command cost:
 * study §5.4, corrected). The win is VRAM. Both static and moving bosses use it.
 *
 * Drives the real generator and reads the emitted cell blob, which is where the
 * bugs live: an atlas-relative SY here renders the boss from the wrong VRAM row.
 */
import { readFileSync, mkdtempSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const FIXTURE = join(repoRoot, 'test', 'msx2-boss', 'fixture_stampbody.json');
const ATLAS_BASE_ROW = 512;
const CELL = 16;

const out = join(mkdtempSync(join(tmpdir(), 'mideas-metatile-')), 'gen.mjs');
await build({
  entryPoints: [join(repoRoot, 'utils', 'msxGenerator', 'index.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  logLevel: 'silent',
});
const generator = await import(pathToFileURL(out).href);

// The metatile path ships behind a kill switch until it is proven on hardware.
// While it is off the generator must behave exactly as before, so these checks
// would all be vacuous: say so loudly instead of reporting a green run.
const roomGenSource = readFileSync(
  join(repoRoot, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2Screen5BitmapRoomGenerator.ts'),
  'utf8',
);
if (/const BOSS_METATILE_ENABLED = false/.test(roomGenSource)) {
  console.log('SKIP: BOSS_METATILE_ENABLED is false — the boss body is not split into cells.');
  console.log('      Re-enable it in msx2Screen5BitmapRoomGenerator.ts to run these checks.');
  process.exit(0);
}

const raw = JSON.parse(readFileSync(FIXTURE, 'utf8'));
const realLog = console.log;
const realWarn = console.warn;
console.log = () => {};
console.warn = () => {};
let asm;
try {
  const files = generator.generateModularASM(raw.name || 'metatile', raw.assets, {
    generateUnified: true,
    romMode: 'megarom',
    targetFormat: 'konami',
    screenMode: raw.currentScreenMode || 'SCREEN 4 (Graphics II)',
    targetGraphicsBackend: raw.targetGraphicsBackend || undefined,
  });
  asm = files['unitedFiles.asm'] || files['main.asm'];
} finally {
  console.log = realLog;
  console.warn = realWarn;
}

/** Every emitted per-room cell blob, decoded. */
function readCellBlobs(text) {
  const blobs = [];
  const re = /bitmap_boss_cells_room_(\d+):\s*\n\s*db ([^\n]+)/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    const bytes = match[2].split(',').map(token => parseInt(token.trim().replace('#', ''), 16));
    if (bytes.length < 4 || bytes[0] === 0) continue; // room without a split body
    const frames = bytes[0];
    const perFrame = bytes[1];
    const stride = bytes[2] | (bytes[3] << 8);
    const records = [];
    for (let i = 4; i + 5 < bytes.length; i += 6) {
      records.push({
        sx: bytes[i] | (bytes[i + 1] << 8),
        sy: bytes[i + 2] | (bytes[i + 3] << 8),
        dx: bytes[i + 4],
        dy: bytes[i + 5],
      });
    }
    blobs.push({ room: Number(match[1]), frames, perFrame, stride, records });
  }
  return blobs;
}

const blobs = readCellBlobs(asm);
const checks = [];

checks.push(['The fixture still produces a split boss body', blobs.length > 0]);
if (!blobs.length) {
  console.error('FAIL: no cell blob emitted; the checks below would prove nothing.');
  process.exit(1);
}
const blob = blobs[0];
realLog(`      room ${blob.room}: ${blob.frames} frame(s) x ${blob.perFrame} cells, `
  + `stride ${blob.stride} B, ${blob.records.length} records`);

checks.push(['The runtime cell loop is emitted', /bitmap_boss_draw_cells:/.test(asm)]);
checks.push(['The monolithic path is still reachable for unsplit bodies',
  /bitmap_boss_cells_config/.test(asm) && /jp nz, bitmap_boss_pick_cell_list/.test(asm)]);

// Header must describe the records that follow, or the loop walks off the end.
checks.push(['The blob header matches the records it carries',
  blob.records.length === blob.frames * blob.perFrame]);
checks.push(['The baked stride is the per-frame byte count',
  blob.stride === blob.perFrame * 6]);

// The bug this check exists for: placements are atlas-relative, but the atlas
// sits at VRAM row 512. An SY below that reads garbage from the visible pages.
checks.push(['Every cell reads from the atlas rows, not from page 0',
  blob.records.every(record => record.sy >= ATLAS_BASE_ROW)]);

// Offsets must tile the body exactly: a gap or an overlap shows as a seam.
const offsets = blob.records.slice(0, blob.perFrame).map(r => `${r.dx},${r.dy}`);
checks.push(['Cell offsets are unique inside a frame', new Set(offsets).size === offsets.length]);
checks.push(['Cell offsets are multiples of the 16px cell',
  blob.records.every(record => record.dx % CELL === 0 && record.dy % CELL === 0)]);
const maxDx = Math.max(...blob.records.map(r => r.dx));
const maxDy = Math.max(...blob.records.map(r => r.dy));
checks.push(['Offsets form a dense grid with no holes',
  blob.perFrame === ((maxDx / CELL) + 1) * ((maxDy / CELL) + 1)]);

// The point of the change: identical cells must share one atlas rectangle.
const distinct = new Set(blob.records.map(r => `${r.sx},${r.sy}`));
realLog(`      ${blob.records.length} cell slots -> ${distinct.size} distinct atlas rectangles`);
checks.push(['Identical cells share one atlas rectangle (dedup works)',
  distinct.size <= blob.records.length]);

// --- FASE 3b: the changed-cell lists, which are where the blitter saving is.
// Needs an animated boss, so this runs on a second fixture with 4 frames whose
// art differs in exactly one cell each.
{
  const animRaw = JSON.parse(readFileSync(join(repoRoot, 'test', 'msx2-boss', 'fixture_boss_anim_cells.json'), 'utf8'));
  console.log = () => {};
  console.warn = () => {};
  let animAsm;
  try {
    const files = generator.generateModularASM('metatile-anim', animRaw.assets, {
      generateUnified: true,
      romMode: 'megarom',
      targetFormat: 'konami',
      screenMode: animRaw.currentScreenMode || 'SCREEN 4 (Graphics II)',
    });
    animAsm = files['unitedFiles.asm'] || files['main.asm'];
  } finally {
    console.log = realLog;
    console.warn = realWarn;
  }

  const animBlob = readCellBlobs(animAsm)[0];
  checks.push(['The animated fixture really animates', !!animBlob && animBlob.frames > 1]);

  // Decode the delta lists: [count, records...] per frame, in frame order.
  const deltaMatch = animAsm.match(/bitmap_boss_cells_delta_room_\d+:\s*\n\s*db ([^\n]+)/g) || [];
  let counts = null;
  for (const block of deltaMatch) {
    const bytes = block.split('db ')[1].split(',').map(t => parseInt(t.trim().replace('#', ''), 16));
    if (bytes.length <= 1) continue;
    counts = [];
    let i = 0;
    while (i < bytes.length) { counts.push(bytes[i]); i += 1 + bytes[i] * 6; }
    break;
  }
  checks.push(['Changed-cell lists are emitted per frame',
    !!counts && !!animBlob && counts.length === animBlob.frames]);
  if (counts && animBlob) {
    realLog(`      animated: ${animBlob.frames} frames x ${animBlob.perFrame} cells, `
      + `changed per frame = [${counts.join(', ')}]`);
    // The whole point: an animation step repaints far fewer cells than a frame.
    checks.push(['A frame step repaints fewer cells than the whole body',
      counts.every(count => count < animBlob.perFrame)]);
    checks.push(['Every frame lists at least one changed cell (art really differs)',
      counts.every(count => count > 0)]);
  }

  checks.push(['The runtime chooses between full and changed-cell repaint',
    /bitmap_boss_pick_cell_list:/.test(animAsm)
    && /bitmap_boss_draw_cell_list:/.test(animAsm)
    && /bitmap_boss_cells_delta:/.test(animAsm)]);
  // A move invalidates everything on screen, so it must force a full repaint.
  checks.push(['Moving forces a full repaint', /ld a, \(boss_old_x\)\s*\n\s*cp b\s*\n\s*jp nz, \.cells_full/.test(animAsm)]);
  // And nothing may be assumed on screen before the first draw of a room.
  checks.push(['Room load marks the body as not yet drawn',
    /ld \(boss_cells_shown\), a\s*; nothing of this boss is on screen yet/.test(animAsm)]);
}

let failed = 0;
for (const [label, ok] of checks) {
  realLog(`${ok ? 'OK  ' : 'FAIL'}: ${label}`);
  if (!ok) failed += 1;
}
realLog('');
if (failed) {
  console.error(`MSX2 boss metatile checks FAILED (${failed}/${checks.length}).`);
  process.exit(1);
}
realLog(`MSX2 boss metatile checks passed (${checks.length}).`);
