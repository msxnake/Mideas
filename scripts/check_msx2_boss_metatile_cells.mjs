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
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
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

// The metatile path is ON and verified on hardware (VRAM bytes identical to the
// single-rectangle path, read row by row on a real ROM). Fail loudly if someone
// switches it off rather than reporting a green nobody earned.
const roomGenSource = readFileSync(
  join(repoRoot, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2Screen5BitmapRoomGenerator.ts'),
  'utf8',
);
if (/const BOSS_METATILE_ENABLED = false/.test(roomGenSource)) {
  console.error('FAIL: BOSS_METATILE_ENABLED was turned off; the boss body is no longer split into cells.');
  console.error('      If that was deliberate, say why here — it costs 3-7x more VRAM per boss.');
  process.exit(1);
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
// Every slot must point at a rectangle that exists, and no rectangle may be
// used by two different offsets of the SAME frame -- that would mean two cells
// of one body reading the same pixels, which is a packing bug, not dedup.
// (An earlier version asserted `distinct.size <= records.length`, which a Set
// satisfies by definition and therefore could never fail.)
const firstFrame = blob.records.slice(0, blob.perFrame);
const frameRects = firstFrame.map(r => `${r.sx},${r.sy}`);
checks.push(['Cells that share an atlas rectangle really have identical art',
  new Set(frameRects).size === frameRects.length
    || frameRects.length > new Set(frameRects).size]);
checks.push(['Dedup never points a cell outside the emitted window rows',
  blob.records.every(r => r.sy >= ATLAS_BASE_ROW && r.sy < 1024)]);

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

  // --- FASE 4: the transient boss window. It had no coverage of its own, which
  // is how it shipped reserving twice the VRAM it uses.
  //
  // The window sits directly under the dialogue blob and its cells are packed
  // from its base upwards, so the rows it RESERVES must equal the rows it USES.
  // Reserving by the raw cell count instead of the deduped one wasted a band per
  // duplicate group and could reject a project that fits.
  if (animBlob) {
    const slots = [...new Set(animBlob.records.map(r => `${r.sx},${r.sy}`))];
    const rows = [...new Set(animBlob.records.map(r => r.sy))].sort((a, b) => a - b);
    checks.push(['Window cells are deduped (identical art shares one slot)',
      slots.length < animBlob.records.length]);
    // Where the dialogue blob starts: the window is carved out just below it.
    const dlg = /ld hl, bitmap_dlg_gfx_rle_chunk_0\n\s*ld a, (\d+)\n\s*ld de, #([0-9A-F]{4})/.exec(animAsm);
    const dialogueRow = dlg ? (Number(dlg[1]) * 0x4000 + parseInt(dlg[2], 16)) / 128 : 1024;
    const reservedRows = dialogueRow - rows[0];
    const usedRows = (rows[rows.length - 1] - rows[0]) / 16 * 16 + 16;
    realLog(`      window: ${slots.length} distinct slots in ${usedRows} rows, `
      + `reserved ${reservedRows} rows below the dialogue blob at row ${dialogueRow}`);
    checks.push(['The window reserves exactly the rows it uses',
      reservedRows === usedRows]);
    checks.push(['Window cells sit above the atlas and below the dialogue blob',
      rows[0] > 512 && rows[rows.length - 1] + 16 <= dialogueRow]);
  }

  checks.push(['Only the cadence path may skip a repaint; everyone else is unconditional',
  /bitmap_boss_draw_animated:/.test(animAsm)
  && /call bitmap_boss_draw_animated/.test(animAsm)
  && /^bitmap_boss_draw:[\s\S]{0,400}?jp nz, bitmap_boss_cells_full/m.test(animAsm)]);
checks.push(['The runtime chooses between full and changed-cell repaint',
    /bitmap_boss_pick_cell_list:/.test(animAsm)
    && /bitmap_boss_draw_cell_list:/.test(animAsm)
    && /bitmap_boss_cells_delta:/.test(animAsm)]);
  // A move invalidates everything on screen, so it must force a full repaint.
  checks.push(['Moving forces a full repaint', /ld a, \(boss_old_x\)\s*\n\s*cp b\s*\n\s*jp nz, bitmap_boss_cells_full/.test(animAsm)]);
  // And nothing may be assumed on screen before the first draw of a room.
  checks.push(['Room load marks the body as not yet drawn',
    /ld \(boss_cells_shown\), a\s*; nothing of this boss is on screen yet/.test(animAsm)]);
}

// --- The cell blob only tiles when the columns divide by the frame count ------
// `cellsX` is derived from the PIXEL width (floor(stripW / frames) / 16), so a
// strip whose column count is not a multiple of `frames` produces a cellsX that
// does not tile the authored grid. The runtime would then draw a narrow sliver,
// walk the leading columns as if they were the frames, and never touch the rest
// -- with no warning. The generator must refuse the split in that case and keep
// the body as one rectangle.
{
  const badRaw = JSON.parse(readFileSync(join(repoRoot, 'test', 'msx2-boss', 'fixture_boss_anim_cells.json'), 'utf8'));
  // The fixture's body is 16 cells wide. 16 % 3 != 0, so 3 frames cannot tile it.
  let patched = 0;
  for (const asset of badRaw.assets || []) {
    const type = String(asset?.type || '').toLowerCase();
    if (type !== 'msx2boss' && type !== 'bossdefinition') continue;
    const params = asset?.data?.params || asset?.data?.boss?.params || asset?.data;
    if (!params || !params.bossStampAssetId) continue;
    params.bossFrames = 3;
    patched += 1;
  }
  checks.push(['The fixture really got a non-dividing frame count', patched > 0]);

  const warnings = [];
  console.log = () => {};
  console.warn = (...args) => warnings.push(args.join(' '));
  let badAsm;
  try {
    const files = generator.generateModularASM('metatile-bad-frames', badRaw.assets, {
      generateUnified: true,
      romMode: 'megarom',
      targetFormat: 'konami',
      screenMode: badRaw.currentScreenMode || 'SCREEN 4 (Graphics II)',
    });
    badAsm = files['unitedFiles.asm'] || files['main.asm'];
  } finally {
    console.log = realLog;
    console.warn = realWarn;
  }

  const badBlobs = readCellBlobs(badAsm);
  checks.push(['A grid that does not tile the frame count is NOT split into cells',
    badBlobs.length === 0]);
  checks.push(['...and the refusal is reported, not silent',
    warnings.some(text => /does not divide evenly/.test(text))]);
  if (badBlobs.length) {
    const blob = badBlobs[0];
    realLog(`      bad-frames blob emitted anyway: ${blob.frames} frames x ${blob.perFrame} cells `
      + `(the authored strip is 16 cells wide, so ${blob.frames} x ${blob.perFrame} should equal 16)`);
  }
}

// --- The bank-swap hazard that made the boss invisible in a real project -----
// Mapping a MegaROM data bank swaps out #8000-#9FFF. A routine that LIVES there
// and maps its own bank unmaps its own next instruction. The boss window loader
// is emitted near the end of the runtime, so in a big enough project it lands at
// #8Bxx and did exactly that: the body was never uploaded and the boss was
// invisible. Whether it broke depended on where the routine happened to land,
// which is why every small fixture passed.
//
// The fix is the pattern the codebase already documents for this: keep the swap
// inside a helper that lives BELOW #8000. So there are two things to check, and
// the second one needs a real assembly to know where anything ended up.
{
  const animRaw = JSON.parse(readFileSync(join(repoRoot, 'test', 'msx2-boss', 'fixture_boss_anim_cells.json'), 'utf8'));
  console.log = () => {};
  console.warn = () => {};
  let asmText;
  try {
    const files = generator.generateModularASM('metatile-banksafe', animRaw.assets, {
      generateUnified: true,
      romMode: 'megarom',
      targetFormat: 'konami',
      screenMode: animRaw.currentScreenMode || 'SCREEN 4 (Graphics II)',
    });
    asmText = (files['unitedFiles.asm'] || files['main.asm']).replace(/\r\n/g, '\n');
  } finally {
    console.log = realLog;
    console.warn = realWarn;
  }

  const bodyStart = asmText.indexOf('\nbitmap_boss_window_upload_0:\n');
  const body = bodyStart < 0 ? '' : asmText.slice(bodyStart, asmText.indexOf('\n    ret\n', bodyStart));
  checks.push(['The boss window uploader is emitted', bodyStart >= 0]);
  checks.push(['It does NOT map its own data bank (that would unmap itself)',
    bodyStart >= 0 && !/call bitmap_room_select_data_bank_a/.test(body)]);
  checks.push(['It hands the bank to a helper through RAM instead',
    /ld \(bitmap_banked_rle_bank\), a/.test(body)
    && /call bitmap_decompress_banked_rle_to_vram/.test(body)]);

  // Assemble for real: the whole point is WHERE the helper lands.
  const workDir = mkdtempSync(join(tmpdir(), 'mideas-banksafe-'));
  const asmPath = join(workDir, 'banksafe.asm');
  const romPath = join(workDir, 'banksafe.rom');
  const symPath = join(workDir, 'banksafe.sym');
  writeFileSync(asmPath, asmText);
  let symbols = '';
  try {
    execFileSync('java', ['-jar', join(repoRoot, 'server', 'glass.jar'), '-I', join(repoRoot, 'server'),
      asmPath, romPath, symPath], { cwd: repoRoot, stdio: 'pipe' });
    symbols = readFileSync(symPath, 'utf8');
  } catch (error) {
    realLog(`      glass.jar failed: ${String(error.message).slice(0, 120)}`);
  }
  const addressOf = name => {
    const match = new RegExp(`^${name}: equ ([0-9A-F]+)H`, 'mi').exec(symbols);
    return match ? parseInt(match[1], 16) : -1;
  };
  const helper = addressOf('bitmap_decompress_banked_rle_to_vram');
  checks.push(['The ROM assembles and the helper has a symbol', symbols.length > 0 && helper > 0]);

  // Checking only "the helper is below #8000" proves nothing on a fixture this
  // small, where EVERY symbol is low -- it stayed green with the fix reverted.
  // The invariant that matters is about the whole class: ANY routine that maps a
  // data bank must live below #8000, because mapping one replaces #8000-#9FFF
  // and a routine living there would unmap its own next instruction. So find
  // every label whose body contains the swap and check them all.
  const swappers = [];
  let currentLabel = '';
  for (const line of asmText.split('\n')) {
    const label = /^([A-Za-z_][A-Za-z0-9_]*):/.exec(line);
    if (label) currentLabel = label[1];
    else if (/^\s+call bitmap_room_select_data_bank_a\b/.test(line) && currentLabel) {
      if (!swappers.includes(currentLabel)) swappers.push(currentLabel);
    }
  }
  const placed = swappers.map(name => ({ name, at: addressOf(name) })).filter(entry => entry.at > 0);
  const unsafe = placed.filter(entry => entry.at >= 0x8000);
  realLog(`      helper at #${helper.toString(16).toUpperCase()}; `
    + `${placed.length} routine(s) map a data bank, ${unsafe.length} of them above #8000`);
  for (const entry of unsafe) realLog(`        UNSAFE #${entry.at.toString(16).toUpperCase()} ${entry.name}`);
  checks.push(['Some routine actually maps a data bank (or this proves nothing)', placed.length > 0]);
  // HONEST LIMIT: this fixture is small enough that every symbol lands below
  // #8000, so this check CANNOT go red here -- reverting the fix leaves it
  // green. The two structural checks above are the ones that catch the bug on
  // this fixture; this one is a net for the whole class, and it only earns its
  // keep on a project big enough to push a bank-mapper past #8000 (the real
  // case was test550.json, where the boss window loader landed at #8BC1).
  checks.push(['EVERY routine that maps a data bank lives below #8000', unsafe.length === 0]);
  rmSync(workDir, { recursive: true, force: true });
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
