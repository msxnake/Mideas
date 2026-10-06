#!/usr/bin/env node
/**
 * SCREEN 5 GameFlow walker: bitmap title of a SubMenu (`titleImageAssetId`).
 *
 *   node scripts/check_msx2_screen5_menu_title_image.mjs [--static-only]
 *
 * The title is an msx2presentation asset. Only the box that holds its non-background pixels is exported
 * (opaque, palette slot 0 is the background), the image palette is loaded when the menu opens and the
 * picture replaces the text title, placed at titleY and aligned like the text title.
 *
 * A synthetic 64x24 px logo is drawn on a 256x192 sheet with a pure function. The expected bytes, VRAM
 * address and palette are derived from that function and from the layout rules, never from the code under
 * test, so a wrong crop, a wrong column or a swapped nibble turns the check red.
 *
 * Static: ASM of the tracked walker fixture (Start -> SubMenu) with / without the title, error messages,
 * glass.jar assembles every variant. Dynamic (OpenMSX): the ROM reaches the menu loop and the VRAM holds
 * the logo box exactly where it must, the VDP palette is the logo palette, and nothing is drawn around it.
 * The screenshot is saved next to the ROM (server/temp/menu_title) for a look: the logo box above the options.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WORK = path.join(ROOT, 'server', 'temp', 'menu_title');
const OPENMSX = process.env.OPENMSX_EXE || 'C:/Program Files/openMSX/openmsx.exe';
const staticOnly = process.argv.includes('--static-only');
fs.mkdirSync(WORK, { recursive: true });

const problems = [];
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok   ' : 'FAIL '} ${name}${ok || !detail ? '' : ` (${detail})`}`);
  if (!ok) problems.push(name);
};

async function loadGenerator() {
  const bundle = await esbuild.build({
    entryPoints: [path.join(ROOT, 'utils/msxGenerator/index.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
    logLevel: 'error',
    external: ['react', 'react-dom', '@xyflow/react', 'jszip', 'axios', 'lucide-react', 'twgl.js'],
  });
  return import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
}

// ---- the logo: a pure function of (x, y), 64x24 px at x 40..103, y 20..43 of a 256x192 sheet ----
const BOX = { x0: 40, x1: 103, y0: 20, y1: 43 };
const logoPixel = (x, y) => {
  if (x < BOX.x0 || x > BOX.x1 || y < BOX.y0 || y > BOX.y1) return 0;
  if (x === BOX.x0 || x === BOX.x1 || y === BOX.y0 || y === BOX.y1) return 9; // frame: touches all four box edges
  if (((x >> 2) + y) % 3 === 0) return 11;
  return y % 2 ? 4 : 0; // slot 0 inside the box is exported too: the blit is opaque
};
const BOX_WIDTH_BYTES = (BOX.x1 - BOX.x0 + 1) / 2; // 32
const BOX_HEIGHT = BOX.y1 - BOX.y0 + 1; // 24
const expectedBoxBytes = [];
for (let y = BOX.y0; y <= BOX.y1; y++) {
  for (let b = BOX.x0 / 2; b < BOX.x0 / 2 + BOX_WIDTH_BYTES; b++) {
    expectedBoxBytes.push((logoPixel(2 * b, y) << 4) | logoPixel(2 * b + 1, y));
  }
}

// Palette as (r, g, b) levels 0..7; masterIndex = r<<6 | g<<3 | b. Slot 11 is the brightest non-zero one.
const PALETTE_LEVELS = [
  [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [2, 0, 2], [3, 0, 0], [0, 3, 0], [0, 0, 3],
  [3, 3, 0], [7, 7, 0], [0, 3, 3], [7, 7, 7], [3, 3, 3], [5, 0, 5], [0, 5, 5], [6, 3, 0],
];
const presentationAsset = (id, name, pixelOf) => {
  const packed = [];
  for (let y = 0; y < 192; y++) {
    for (let b = 0; b < 128; b++) packed.push((pixelOf(2 * b, y) << 4) | pixelOf(2 * b + 1, y));
  }
  const palette = PALETTE_LEVELS.map(([r, g, b], slotIndex) => {
    const masterIndex = (r << 6) | (g << 3) | b;
    const channel = level => Math.round((level * 255) / 7).toString(16).padStart(2, '0');
    return { slotIndex, masterIndex, hex: `#${channel(r)}${channel(g)}${channel(b)}`.toUpperCase() };
  });
  return {
    id, name, type: 'msx2presentation',
    data: {
      enabled: true, name, target: 'MSX2', screenMode: 'SCREEN 5', sourceFileName: null,
      sourceImageWidth: 256, sourceImageHeight: 192, width: 256, height: 192, fitMode: 'contain',
      backgroundSlot: 0, backgroundHex: '#000000', palette, pixels: [], packedBitmap: packed,
      compression: { codec: 'ZX0', enabled: false, chunkLines: 32 },
      runtime: { showAtBoot: true, clearSpritesBeforeShow: true, waitForKey: true, waitForFrames: 0, vramPage: 0, romDataGroup: 'auto' },
    },
  };
};

const LOGO_ID = 'asset_menu_logo';
const TITLE_TEXT = 'ZZ UNIQUE TITLE TEXT';

/** The tracked walker fixture, trimmed to Start -> SubMenu so the menu is what boots. */
function buildProject({ titleImageAssetId, direct = true, menu = {}, logoPixelOf = logoPixel } = {}) {
  const project = JSON.parse(fs.readFileSync(path.join(ROOT, 'test', 'msx2-gameflow', 'screen5_gameflow_menu_project.json'), 'utf8'));
  project.assets.push(presentationAsset(LOGO_ID, 'LOGO', logoPixelOf));
  const flow = project.assets.find(asset => asset.type === 'msx2gameflow').data;
  const node = flow.nodes.find(candidate => candidate.id === 'gf_menu');
  node.title = TITLE_TEXT;
  delete node.textColorIndex; // so the default (brightest slot of the title palette) is what is checked
  Object.assign(node, menu);
  if (titleImageAssetId) node.titleImageAssetId = titleImageAssetId;
  if (direct) {
    flow.connections = flow.connections.filter(connection => connection.from.nodeId !== 'gf_start' && connection.to.nodeId !== 'gf_menu');
    flow.connections.push({ id: 'conn_start_to_menu', from: { nodeId: 'gf_start' }, to: { nodeId: 'gf_menu' } });
  }
  return project;
}

function generate(generator, project) {
  const realLog = console.log;
  const realWarn = console.warn;
  console.log = () => {};
  console.warn = () => {};
  try {
    const files = generator.generateModularASM('menu_title', project.assets, {
      generateUnified: true,
      romMode: 'simple32k',
      targetFormat: 'konami',
      screenMode: project.screenMode || project.currentScreenMode,
      targetGraphicsBackend: project.targetGraphicsBackend || undefined,
    });
    return (files['unitedFiles.asm'] || files['main.asm'] || '').replace(/\r\n/g, '\n');
  } finally {
    console.log = realLog;
    console.warn = realWarn;
  }
}

function errorOf(generator, project) {
  try {
    generate(generator, project);
    return undefined;
  } catch (error) {
    return String(error?.message || error);
  }
}

function assemble(name, asm) {
  const asmPath = path.join(WORK, `${name}.asm`);
  const romPath = path.join(WORK, `${name}.rom`);
  const symPath = path.join(WORK, `${name}.sym`);
  fs.rmSync(romPath, { force: true });
  fs.writeFileSync(asmPath, asm);
  try {
    execFileSync('java', ['-jar', path.join(ROOT, 'server', 'glass.jar'), '-I', path.join(ROOT, 'server'), asmPath, romPath, symPath], { stdio: 'pipe' });
  } catch (error) {
    return { ok: false, detail: `${error.stdout || ''}${error.stderr || ''}`.slice(0, 600), romPath, symPath };
  }
  if (!fs.existsSync(romPath)) return { ok: false, detail: 'no ROM written', romPath, symPath };
  // openMSX only auto-detects a mapper on power-of-two ROMs.
  const rom = fs.readFileSync(romPath);
  let size = 1;
  while (size < rom.length) size *= 2;
  if (size !== rom.length) fs.writeFileSync(romPath, Buffer.concat([rom, Buffer.alloc(size - rom.length, 0xff)]));
  return { ok: true, detail: '', romPath, symPath };
}

/** Lines of a label block: from `label:` up to the next label at column 0. */
function block(asm, label) {
  const lines = asm.split('\n');
  const start = lines.findIndex(line => line.startsWith(`${label}:`));
  if (start < 0) return undefined;
  let end = start + 1;
  while (end < lines.length && !/^[A-Za-z_][A-Za-z0-9_]*:/.test(lines[end])) end++;
  return lines.slice(start + 1, end).join('\n');
}
const dbBytes = text => [...(text || '').matchAll(/DB ([^\n]+)/gi)].flatMap(match => match[1].split(',').map(value => parseInt(value.trim().replace('#', ''), 16)));
const hex4 = value => `#${value.toString(16).toUpperCase().padStart(4, '0')}`;

const generator = await loadGenerator();

// ---- static: no title image -> nothing of the feature in the ROM ----
const plain = generate(generator, buildProject());
check('no title image: no blit routine, no title data, text title still printed',
  !/gf_blit_rect|gf_title_image_|gf_title_palette_|gf_load_palette_title_/.test(plain) && plain.includes(`"${TITLE_TEXT}"`));

// ---- static: centred title (the default alignment) ----
const centred = generate(generator, buildProject({ titleImageAssetId: LOGO_ID }));
const TITLE_Y = 32; // GF_MENU_TITLE_Y
const centredColumn = Math.floor((128 - BOX_WIDTH_BYTES) / 2); // 48
const menuNodeBlock = block(centred, 'gf_node_gf_menu') || '';
check('the blit routine is emitted once and called once', (centred.match(/^gf_blit_rect:/gm) || []).length === 1 && (centred.match(/call gf_blit_rect/g) || []).length === 1);
check('the cropped box is the logo (bytes, row after row)', JSON.stringify(dbBytes(block(centred, 'gf_title_image_0'))) === JSON.stringify(expectedBoxBytes),
  `${dbBytes(block(centred, 'gf_title_image_0')).length} bytes vs ${expectedBoxBytes.length}`);
const paletteBytes = dbBytes(block(centred, 'gf_title_palette_0'));
check('the title palette is the logo palette (slot 11 = white, (R<<4)|B then G)', paletteBytes.length === 32 && paletteBytes[22] === 0x77 && paletteBytes[23] === 0x07 && paletteBytes[18] === 0x70 && paletteBytes[19] === 0x07,
  paletteBytes.slice(16, 24).join(','));
check('blit parameters: ROM box, VRAM address of titleY + centred column, rows, width',
  menuNodeBlock.includes('ld hl, gf_title_image_0') && menuNodeBlock.includes(`ld de, ${hex4(TITLE_Y * 128 + centredColumn)}`)
    && menuNodeBlock.includes(`ld b, ${BOX_HEIGHT}`) && menuNodeBlock.includes(`ld c, ${BOX_WIDTH_BYTES}`), menuNodeBlock.slice(0, 500));
const order = ['call DISSCR', 'call gf_load_palette_title_0', 'ld hl, gf_title_image_0', 'call gf_blit_rect', 'call ENASCR', 'call gf_menu_wait_release']
  .map(text => menuNodeBlock.indexOf(text));
check('order: screen off, palette, blit, screen on, then the menu', order.every(position => position >= 0) && order.every((position, index) => index === 0 || position > order[index - 1]), order.join(','));
check('the picture replaces the text title (string not in the ROM)', !centred.includes(TITLE_TEXT));
const idleDraw = block(centred, 'gf_menu_draw_gf_menu') || '';
check('menu text defaults to the brightest slot of the title palette (#0B)', /ld a, #0B\n\s+ld \(GF_FG_PIX\), a/.test(idleDraw), idleDraw.slice(0, 200));

// ---- static: alignment follows the text title ----
const left = generate(generator, buildProject({ titleImageAssetId: LOGO_ID, menu: { align: 'left' } }));
check('align left: the title starts at the menu column (2 cells = 6 bytes)', (block(left, 'gf_node_gf_menu') || '').includes(`ld de, ${hex4(TITLE_Y * 128 + 6)}`));
const placed = generate(generator, buildProject({ titleImageAssetId: LOGO_ID, menu: { menuX: 30, titleY: 8 } }));
check('menuX 30 px (cell 5 = byte 15) and titleY 8', (block(placed, 'gf_node_gf_menu') || '').includes(`ld de, ${hex4(8 * 128 + 15)}`));

// ---- static: the original flow (a presentation behind the menu) and a shared asset ----
const behind = generate(generator, buildProject({ titleImageAssetId: LOGO_ID, direct: false }));
check('with a presentation before the menu both pictures are in the ROM, the logo only as its box',
  /gf_upload_bitmap_0:/.test(behind) && /gf_title_image_0:/.test(behind) && (behind.match(/gf_title_image_\d+:/g) || []).length === 1);

// ---- static: refusals ----
check('a title taller than the room above the options is refused', /runs into the first option/.test(errorOf(generator, buildProject({ titleImageAssetId: LOGO_ID, menu: { titleY: 60 } })) || ''));
check('a title that exactly fits is accepted (ends at the first option row)', errorOf(generator, buildProject({ titleImageAssetId: LOGO_ID, menu: { titleY: 48 } })) === undefined);
check('an unknown asset is refused', /missing msx2presentation asset "nope"/.test(errorOf(generator, buildProject({ titleImageAssetId: 'nope' })) || ''));
check('an image with only palette slot 0 is refused', /image is empty/.test(errorOf(generator, (() => {
  const project = buildProject({ titleImageAssetId: LOGO_ID, logoPixelOf: () => 0 });
  return project;
})()) || ''));

// ---- assemble ----
const built = {};
for (const [name, asm] of [['plain', plain], ['centred', centred], ['left', left], ['behind', behind]]) {
  built[name] = assemble(name, asm);
  check(`glass.jar assembles the ${name} variant`, built[name].ok, built[name].detail);
}

if (staticOnly || !built.centred.ok) {
  console.log(problems.length ? `\nRESULT FAIL (${problems.length})` : '\nRESULT PASS (static only)');
  process.exit(problems.length ? 1 : 0);
}

// ---- dynamic: OpenMSX ----
const readSymbols = file => {
  const table = new Map();
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^([^:\s]+):\s*equ\s+([0-9A-Fa-f]+)H/i);
    if (match) table.set(match[1], parseInt(match[2], 16));
  }
  return table;
};
const symbols = readSymbols(built.centred.symPath);
const loopAddress = symbols.get('gf_menu_loop_gf_menu');
if (loopAddress === undefined) {
  check('the .sym has the menu loop label', false);
  process.exit(1);
}
const resultPath = path.join(WORK, 'result.txt').replace(/\\/g, '/');
const shotPath = path.join(WORK, 'menu_title.png').replace(/\\/g, '/');
fs.rmSync(resultPath, { force: true });
fs.rmSync(shotPath, { force: true });
const rows = BOX_HEIGHT;
const tcl = `
set result [open "${resultPath}" w]
set throttle off
set done 0
proc finish {} {
  global result
  # VRAM: the logo box, one line per row
  for {set r 0} {$r < ${rows}} {incr r} {
    set base [expr {(${TITLE_Y} + $r) * 128 + ${centredColumn}}]
    set line {}
    for {set b 0} {$b < ${BOX_WIDTH_BYTES}} {incr b} { lappend line [debug read "physical VRAM" [expr {$base + $b}]] }
    puts $result "BOX $line"
  }
  # the byte just left and right of the box on the first and last row, and a row above and below it
  foreach {name addr} [list L [expr {${TITLE_Y} * 128 + ${centredColumn} - 1}] R [expr {${TITLE_Y} * 128 + ${centredColumn} + ${BOX_WIDTH_BYTES}}] ABOVE [expr {(${TITLE_Y} - 1) * 128 + ${centredColumn}}] BELOW [expr {(${TITLE_Y} + ${rows}) * 128 + ${centredColumn}}]] {
    puts $result "EDGE $name [debug read "physical VRAM" $addr]"
  }
  set pal {}
  for {set i 0} {$i < 32} {incr i} { lappend pal [debug read "VDP palette" $i] }
  puts $result "PALETTE $pal"
  puts $result "RESULT DONE"
}
# With the throttle off a screenshot shows a stale (black) frame: dump the VRAM at full speed, then let the
# emulator run in real time for two seconds before taking the picture.
debug set_bp ${loopAddress} {} {
  if {!$::done} {
    set ::done 1
    finish
    set ::throttle on
    after time 2 { screenshot "${shotPath}"; close $::result; exit }
  }
}
after time 120 { puts $::result "RESULT TIMEOUT: the menu loop never ran"; close $::result; exit }
`;
const tclPath = path.join(WORK, 'menu_title.tcl');
fs.writeFileSync(tclPath, tcl);
console.log('running OpenMSX ...');
const proc = spawnSync(OPENMSX, [
  '-machine', 'C-BIOS_MSX2+_JP', '-cart', built.centred.romPath.replace(/\\/g, '/'), '-romtype', 'KonamiSCC', '-script', tclPath.replace(/\\/g, '/'),
], { cwd: ROOT, timeout: 240000, stdio: 'pipe' });
if (!fs.existsSync(resultPath)) {
  console.error(`OpenMSX produced no result file (exit ${proc.status}).\n${proc.stderr?.toString().slice(0, 1200)}`);
  process.exit(2);
}
const out = fs.readFileSync(resultPath, 'utf8');
check('the ROM reaches the menu loop', /RESULT DONE/.test(out), out.split('\n').find(line => /TIMEOUT/.test(line)) || out.slice(0, 200));
const boxRows = [...out.matchAll(/^BOX (.+)$/gm)].map(match => match[1].trim().split(/\s+/).map(Number));
check('VRAM holds the logo box at titleY, centred, byte for byte', JSON.stringify(boxRows.flat()) === JSON.stringify(expectedBoxBytes),
  `${boxRows.flat().filter((value, index) => value !== expectedBoxBytes[index]).length} bytes differ of ${expectedBoxBytes.length}`);
const edge = name => Number(new RegExp(`EDGE ${name} (\\d+)`).exec(out)?.[1] ?? -1);
check('nothing is drawn around the box (left, right, row above, row below are clear)', ['L', 'R', 'ABOVE', 'BELOW'].every(name => edge(name) === 0),
  ['L', 'R', 'ABOVE', 'BELOW'].map(name => `${name}=${edge(name)}`).join(' '));
const vdpPalette = (/^PALETTE (.+)$/m.exec(out)?.[1] || '').trim().split(/\s+/).map(Number);
const expectedPalette = PALETTE_LEVELS.flatMap(([r, g, b]) => [(r << 4) | b, g]);
check('the VDP palette is the logo palette', JSON.stringify(vdpPalette) === JSON.stringify(expectedPalette), vdpPalette.join(','));
check('a screenshot was written (server/temp/menu_title/menu_title.png)', fs.existsSync(shotPath));

console.log(problems.length ? `\nRESULT FAIL (${problems.length}): ${problems.join('; ')}` : '\nRESULT PASS');
process.exit(problems.length ? 1 : 0);
