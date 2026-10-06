#!/usr/bin/env node
/**
 * SCREEN 5 bitmap-room GameFlow: bitmap title of a SubMenu (`titleImageAssetId`, optional `titleY`).
 *
 *   node scripts/check_msx2_bitmap_menu_title_image.mjs [--static-only]
 *
 * Same feature as the walker (scripts/check_msx2_screen5_menu_title_image.mjs), other backend: the picture
 * box and its palette live in a Konami MegaROM data bank and are copied to VRAM one row at a time through
 * bitmap_copy_banked_to_vram, so the resident window only pays for two small routines.
 *
 * A synthetic 64x24 px logo is drawn on a 256x192 sheet with a pure function; the expected bytes, VRAM
 * address and palette are derived from it and from the layout rules, never from the code under test.
 *
 * Built on test/msx2-lighting/nuts_torchoff.json (2 bitmap rooms): Start -> SubMenu -> WorldLink -> End.
 *   Static:  ASM of the variants with / without the title, refusals, glass.jar assembles them, how many resident
 *            bytes the feature costs.
 *   Dynamic: OpenMSX runs the ROM to the menu: VRAM holds the logo box where it must (and nothing around it),
 *            the VDP palette is the logo palette, the display is on, the options are drawn. Then SPACE picks START
 *            and the game's palette is back when the gameplay loop starts (same as the ROM without a title).
 *            The screenshot is saved in server/temp/menu_title_bitmap.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WORK = path.join(ROOT, 'server', 'temp', 'menu_title_bitmap');
const SOURCE = path.join(ROOT, 'test', 'msx2-lighting', 'nuts_torchoff.json');
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
  for (let b = BOX.x0 / 2; b < BOX.x0 / 2 + BOX_WIDTH_BYTES; b++) expectedBoxBytes.push((logoPixel(2 * b, y) << 4) | logoPixel(2 * b + 1, y));
}
// (r, g, b) levels 0..7 per slot; masterIndex = r<<6 | g<<3 | b. Slot 11 is the brightest non-zero one.
const PALETTE_LEVELS = [
  [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [2, 0, 2], [3, 0, 0], [0, 3, 0], [0, 0, 3],
  [3, 3, 0], [7, 7, 0], [0, 3, 3], [7, 7, 7], [3, 3, 3], [5, 0, 5], [0, 5, 5], [6, 3, 0],
];
const expectedPaletteBytes = PALETTE_LEVELS.flatMap(([r, g, b]) => [(r << 4) | b, g]);
const presentationAsset = (id, name, pixelOf) => {
  const packed = [];
  for (let y = 0; y < 192; y++) for (let b = 0; b < 128; b++) packed.push((pixelOf(2 * b, y) << 4) | pixelOf(2 * b + 1, y));
  const palette = PALETTE_LEVELS.map(([r, g, b], slotIndex) => {
    const channel = level => Math.round((level * 255) / 7).toString(16).padStart(2, '0');
    return { slotIndex, masterIndex: (r << 6) | (g << 3) | b, hex: `#${channel(r)}${channel(g)}${channel(b)}`.toUpperCase() };
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
const MENU_ID = 'gf_menu';
const BF_MENU_TITLE_Y = 24; // msx2BitmapFlowTextGenerator: default titleY
const BF_MENU_FIRST_OPTION_Y = 64;

/** nuts_torchoff trimmed to Start [-> Music] -> SubMenu -> WorldLink -> End. */
function buildProject({ titleImageAssetId, menu = {}, music = false, logoPixelOf = logoPixel } = {}) {
  const raw = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
  const flow = raw.assets.find(asset => asset.type === 'msx2gameflow').data;
  const start = flow.nodes.find(node => node.type === 'Start');
  const world = flow.nodes.find(node => node.type === 'WorldLink');
  const end = flow.nodes.find(node => node.type === 'End');
  const musicNode = flow.nodes.find(node => node.type === 'Music');
  const node = {
    id: MENU_ID, type: 'SubMenu', position: { x: 400, y: 90 }, title: TITLE_TEXT,
    options: [{ id: 'opt_start', text: 'START GAME' }, { id: 'opt_other', text: 'OPTIONS' }],
    ...menu,
  };
  if (titleImageAssetId) node.titleImageAssetId = titleImageAssetId;
  const chain = [start, ...(music ? [musicNode] : []), node];
  flow.nodes = [...chain, world, end];
  flow.connections = chain.slice(0, -1).map((from, index) => ({ id: `gfc_chain_${index}`, from: { nodeId: from.id }, to: { nodeId: chain[index + 1].id } }));
  flow.connections.push({ id: 'gfc_menu_start', from: { nodeId: MENU_ID, sourceId: 'opt_start' }, to: { nodeId: world.id } });
  flow.connections.push({ id: 'gfc_world_end', from: { nodeId: world.id }, to: { nodeId: end.id } });
  if (!music) raw.assets = raw.assets.filter(asset => asset.type !== 'track');
  raw.assets.push(presentationAsset(LOGO_ID, 'LOGO', logoPixelOf));
  return { raw, menuIndex: flow.nodes.findIndex(candidate => candidate.id === MENU_ID) };
}

function generate(generator, raw, romMode = 'megarom') {
  const realLog = console.log;
  const realWarn = console.warn;
  console.log = () => {};
  console.warn = () => {};
  try {
    const files = generator.generateModularASM('menu_title_bitmap', raw.assets, {
      generateUnified: true,
      romMode,
      targetFormat: 'konami',
      autoMegaROM: romMode === 'megarom',
      screenMode: raw.screenMode || raw.currentScreenMode || 'SCREEN 4 (Graphics II)',
      targetGraphicsBackend: raw.targetGraphicsBackend || undefined,
    });
    return (files['unitedFiles.asm'] || files['main.asm'] || '').replace(/\r\n/g, '\n');
  } finally {
    console.log = realLog;
    console.warn = realWarn;
  }
}
const errorOf = (generator, raw, romMode) => {
  try {
    generate(generator, raw, romMode);
    return undefined;
  } catch (error) {
    return String(error?.message || error);
  }
};

function assemble(name, asm) {
  const asmPath = path.join(WORK, `${name}.asm`);
  const romPath = path.join(WORK, `${name}.rom`);
  const symPath = path.join(WORK, `${name}.sym`);
  fs.rmSync(romPath, { force: true });
  fs.writeFileSync(asmPath, asm);
  try {
    execFileSync('java', ['-jar', path.join(ROOT, 'server', 'glass.jar'), '-I', path.join(ROOT, 'server'), asmPath, romPath, symPath], { stdio: 'pipe', maxBuffer: 1 << 28 });
  } catch (error) {
    return { ok: false, detail: `${error.stdout || ''}${error.stderr || ''}`.slice(0, 600), romPath, symPath };
  }
  if (!fs.existsSync(romPath)) return { ok: false, detail: 'no ROM written', romPath, symPath };
  const rom = fs.readFileSync(romPath);
  let size = 1;
  while (size < rom.length) size *= 2;
  if (size !== rom.length) fs.writeFileSync(romPath, Buffer.concat([rom, Buffer.alloc(size - rom.length, 0xff)]));
  return { ok: true, detail: '', romPath, symPath, rom: fs.readFileSync(romPath) };
}

/** Lines of a label block: from `label:` up to the next label at column 0. */
function block(asm, label) {
  const lines = asm.split('\n');
  const start = lines.findIndex(line => line.startsWith(`${label}:`));
  if (start < 0) return undefined;
  let end = start + 1;
  while (end < lines.length && !/^[A-Za-z_][A-Za-z0-9_.]*:/.test(lines[end])) end++;
  return lines.slice(start + 1, end).join('\n');
}
/** DB bytes between `label:` and `label_end:`. */
function dataBetween(asm, label) {
  const from = asm.indexOf(`\n${label}:`);
  const to = asm.indexOf(`\n${label}_end:`);
  if (from < 0 || to < from) return [];
  return [...asm.slice(from, to).matchAll(/DB ([^\n]+)/gi)].flatMap(match => match[1].split(',').map(value => parseInt(value.trim().replace('#', ''), 16)));
}
/** DB bytes of a resident block: from `label:` up to the next label at column 0. */
function dataBetweenLabels(asm, label) {
  return [...(block(asm, label) || '').matchAll(/DB ([^\n]+)/gi)].flatMap(match => match[1].split(',').map(value => parseInt(value.trim().replace('#', ''), 16)));
}
const hex4 = value => `#${value.toString(16).toUpperCase().padStart(4, '0')}`;
const readSymbols = file => {
  const table = new Map();
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^([^:\s]+):\s*equ\s+([0-9A-Fa-f]+)H/i);
    if (match) table.set(match[1], parseInt(match[2], 16));
  }
  return table;
};
const trailingFF = (buffer, from, to) => {
  let count = 0;
  for (let i = to - 1; i >= from && buffer[i] === 0xff; i--) count++;
  return count;
};

const generator = await loadGenerator();

// ---- static: no title image -> nothing of the feature in the ROM ----
const plainProject = buildProject();
const plainAsm = generate(generator, plainProject.raw);
check('no title image: no title routines, no title data, text title still printed',
  !/bitmap_flow_blit_title|bitmap_flow_load_palette|bitmap_flow_title_/.test(plainAsm) && plainAsm.includes(`"${TITLE_TEXT}"`));

// ---- static: banked title (MegaROM), default titleY ----
const titled = buildProject({ titleImageAssetId: LOGO_ID });
const titleAsm = generate(generator, titled.raw);
const TITLE_Y = BF_MENU_TITLE_Y;
const column = Math.floor((128 - BOX_WIDTH_BYTES) / 2); // 48
const entry = block(titleAsm, `bitmap_gf_node_${titled.menuIndex}`) || '';
check('the two routines are emitted once each', (titleAsm.match(/^bitmap_flow_blit_title:/gm) || []).length === 1 && (titleAsm.match(/^bitmap_flow_load_palette:/gm) || []).length === 1);
const blob = dataBetween(titleAsm, 'bitmap_flow_title_0');
check('the data bank holds the palette (32 bytes) and then the cropped box', blob.length === 32 + expectedBoxBytes.length
  && JSON.stringify(blob.slice(0, 32)) === JSON.stringify(expectedPaletteBytes) && JSON.stringify(blob.slice(32)) === JSON.stringify(expectedBoxBytes),
  `${blob.length} bytes, expected ${32 + expectedBoxBytes.length}`);
check('the block lives in a data bank (equate defined, label under org #8000)', /^bitmap_flow_title_0_DATA_BANK EQU \d+$/m.test(titleAsm) && /BITMAP_ROOM_DATA_BANK_\d+_ROM_START:[\s\S]*?\nbitmap_flow_title_0:/.test(titleAsm));
check('RAM byte for the bank is defined', /^bitmap_flow_title_bank EQU #E009/m.test(titleAsm));
check('palette: copied out of the bank into RAM, then written to the VDP',
  /ld a, bitmap_flow_title_0_DATA_BANK\n\s+ld hl, bitmap_flow_title_0\n\s+ld de, bitmap_flow_textbuf\n\s+ld bc, 32\n\s+call bitmap_copy_banked_to_ram\n\s+ld hl, bitmap_flow_textbuf\n\s+call bitmap_flow_load_palette/.test(entry), entry.slice(0, 700));
check('blit parameters: box after the palette, VRAM address of titleY + centred column, rows, width',
  entry.includes('ld hl, bitmap_flow_title_0 + 32') && entry.includes(`ld de, ${hex4(TITLE_Y * 128 + column)}`)
    && entry.includes(`ld b, ${BOX_HEIGHT}`) && entry.includes(`ld c, ${BOX_WIDTH_BYTES}`) && entry.includes('ld (bitmap_flow_title_bank), a'), entry.slice(0, 900));
const order = ['ld e, #22', '; backdrop = logo palette slot 0', 'call bitmap_flow_load_palette', 'ld a, #C0', 'call bitmap_flow_blit_title', `call bitmap_flow_menu_draw_${MENU_ID}`, 'ld e, #62', 'call bitmap_flow_menu_wait_release']
  .map(text => entry.indexOf(text));
check('order: display off, backdrop 0, palette, background fill, blit, draw options, display on, key release wait',
  order.every(position => position >= 0) && order.every((position, index) => index === 0 || position > order[index - 1]), order.join(','));
check('the picture replaces the text title (string not in the ROM)', !titleAsm.includes(TITLE_TEXT));
check('a wired option blanks the page, puts the room palette and the room backdrop (R#7 = 1) back before leaving (a WorldLink reloads neither)',
  /bitmap_flow_menu_pick_gf_menu_0:\n\s+call bitmap_flow_title_leave\n\s+ld a, #07\n\s+ld e, #01\n\s+call vdp_write_register[^\n]*\n\s+call bitmap_flow_sprites_on/.test(titleAsm)
    && /\nbitmap_flow_title_leave:[\s\S]*?ld a, #C0[\s\S]*?jp load_screen5_bitmap_palette/.test(titleAsm));
check('an unwired option stays on the menu, so it keeps the logo (no leave call)', /bitmap_flow_menu_pick_gf_menu_1:\n\s+call bitmap_flow_sprites_on\n\s+jp bitmap_flow_menu_loop_gf_menu/.test(titleAsm));
check('without a title the pick stubs are the original ones', !/bitmap_flow_title_leave/.test(plainAsm));
check('menu text defaults to the brightest slot of the title palette (#0B)', /ld a, #0B\n\s+ld \(bitmap_flow_fg\), a/.test(block(titleAsm, `bitmap_flow_menu_draw_${MENU_ID}`) || ''));

// ---- static: titleY, music runtime, refusals ----
let placed = '';
let placedError;
try {
  placed = generate(generator, buildProject({ titleImageAssetId: LOGO_ID, menu: { titleY: 40 } }).raw);
} catch (error) {
  placedError = String(error?.message || error);
}
check('titleY 40 moves the picture (and a title that exactly fits is accepted)', (block(placed, `bitmap_gf_node_${titled.menuIndex}`) || '').includes(`ld de, ${hex4(40 * 128 + column)}`), placedError);
check('a title taller than the room above the first option is refused',
  /runs into the first option at y=64/.test(errorOf(generator, buildProject({ titleImageAssetId: LOGO_ID, menu: { titleY: 41 } }).raw) || ''));
check('an unknown asset is refused', /missing msx2presentation asset "nope"/.test(errorOf(generator, buildProject({ titleImageAssetId: 'nope' }).raw) || ''));
check('an image with only palette slot 0 is refused', /image is empty/.test(errorOf(generator, buildProject({ titleImageAssetId: LOGO_ID, logoPixelOf: () => 0 }).raw) || ''));
const withMusic = generate(generator, buildProject({ titleImageAssetId: LOGO_ID, music: true }).raw);
check('with a music runtime the picture path is the same and the menu still ticks the song', /call bitmap_flow_blit_title/.test(withMusic) && /call bitmap_flow_wait_vblank/.test(block(withMusic, `bitmap_flow_menu_loop_${MENU_ID}`) || ''));

// ---- assemble ----
const built = {};
for (const [name, asm] of [['plain', plainAsm], ['titled', titleAsm], ['music', withMusic]]) {
  built[name] = assemble(name, asm);
  check(`glass.jar assembles the ${name} variant`, built[name].ok, built[name].detail);
}
// 32KB ROM (no data banks): the picture and its palette stay in the resident stream, read straight by copy_to_vram_ext.
const asm32 = generate(generator, buildProject({ titleImageAssetId: LOGO_ID }).raw, 'simple32k');
const rows32 = block(asm32, 'bitmap_flow_blit_title_row') || '';
check('32KB ROM: the data is resident (no data bank, no bank byte) and the blit reads it with copy_to_vram_ext',
  /^bitmap_flow_title_0:/m.test(asm32) && !/bitmap_flow_title_0_DATA_BANK|bitmap_flow_title_bank/.test(asm32) && /call copy_to_vram_ext/.test(rows32) && !/bitmap_copy_banked_to_vram/.test(rows32), rows32.slice(0, 200));
check('32KB ROM: the resident picture block is the palette + the cropped box',
  JSON.stringify(dataBetweenLabels(asm32, 'bitmap_flow_title_0')) === JSON.stringify([...expectedPaletteBytes, ...expectedBoxBytes]));
built.k32 = assemble('titled32', asm32);
check('glass.jar assembles the 32KB variant', built.k32.ok, built.k32.detail);

if (built.plain.ok && built.titled.ok) {
  const free = rom => trailingFF(rom, 0, 4 * 0x2000);
  const plainFree = free(built.plain.rom);
  const titleFree = free(built.titled.rom);
  console.log(`      resident window (#4000-#BFFF) free bytes: ${plainFree} without the title, ${titleFree} with it -> the feature costs ${plainFree - titleFree} resident bytes`);
  check('the resident cost is small (< 160 bytes)', plainFree - titleFree < 160, `${plainFree - titleFree} bytes`);
  const symbols = readSymbols(built.titled.symPath);
  check('bitmap_flow_blit_title sits below #8000 (it may be called with a data bank mapped around its copy)', (symbols.get('bitmap_flow_blit_title') ?? 0xffff) < 0x8000, hex4(symbols.get('bitmap_flow_blit_title') ?? 0));
}

if (staticOnly || !built.titled.ok || !built.plain.ok) {
  console.log(problems.length ? `\nRESULT FAIL (${problems.length})` : '\nRESULT PASS (static only)');
  process.exit(problems.length ? 1 : 0);
}

// ---- dynamic: OpenMSX ----
const addr = (table, name) => {
  if (!table.has(name)) throw new Error(`symbol ${name} missing from the .sym`);
  return table.get(name);
};
function runOpenMsx(build, tcl, resultName, romtype = 'KonamiSCC') {
  const resultPath = path.join(WORK, resultName).replace(/\\/g, '/');
  fs.rmSync(resultPath, { force: true });
  const tclPath = path.join(WORK, resultName.replace('.txt', '.tcl'));
  fs.writeFileSync(tclPath, tcl(resultPath));
  const proc = spawnSync(OPENMSX, [
    '-machine', 'C-BIOS_MSX2+_JP', '-cart', build.romPath.replace(/\\/g, '/'), ...(romtype ? ['-romtype', romtype] : []), '-script', tclPath.replace(/\\/g, '/'),
  ], { cwd: ROOT, timeout: 300000, stdio: 'pipe' });
  if (!fs.existsSync(resultPath)) {
    console.error(`OpenMSX produced no result file (exit ${proc.status}).\n${proc.stderr?.toString().slice(0, 1200)}`);
    process.exit(2);
  }
  return fs.readFileSync(resultPath, 'utf8');
}
const palettePart = '{ set pal {}; for {set i 0} {$i < 32} {incr i} { lappend pal [debug read "VDP palette" $i] }; return $pal }';

// Plain ROM: the game's palette at the menu and when the gameplay loop starts.
const plainSymbols = readSymbols(built.plain.symPath);
const plainOut = runOpenMsx(built.plain, resultPath => `
set result [open "${resultPath}" w]
set throttle off
set stage 0
proc palette {} ${palettePart}
debug set_bp ${addr(plainSymbols, `bitmap_flow_menu_loop_${MENU_ID}`)} {} {
  if {$::stage == 0} { set ::stage 1; puts $::result "PAL_MENU [palette]"; puts $::result "R7_MENU [debug read "VDP regs" 7]"; keymatrixdown 8 0x01; after time 0.3 { keymatrixup 8 0x01 } }
}
debug set_bp ${addr(plainSymbols, 'bitmap_enter_game_loop')} {} {
  if {$::stage == 1} { set ::stage 2; puts $::result "PAL_GAME [palette]"; puts $::result "R7_GAME [debug read "VDP regs" 7]"; puts $::result "RESULT DONE"; close $::result; exit }
}
after time 120 { puts $::result "RESULT TIMEOUT stage $::stage"; close $::result; exit }
`, 'plain.txt');
const plainPaletteGame = (/^PAL_GAME (.+)$/m.exec(plainOut)?.[1] || '').trim();
check('plain ROM: the menu and the gameplay loop are reached', /RESULT DONE/.test(plainOut), plainOut.slice(0, 200));

// Titled ROM: the picture in VRAM at the menu, then START and the game's palette back.
const symbols = readSymbols(built.titled.symPath);
const shotPath = path.join(WORK, 'menu_title.png').replace(/\\/g, '/');
fs.rmSync(shotPath, { force: true });
const rows = BOX_HEIGHT;
const titledOut = runOpenMsx(built.titled, resultPath => `
set result [open "${resultPath}" w]
set throttle off
set stage 0
proc palette {} ${palettePart}
proc dump_menu {} {
  global result
  for {set r 0} {$r < ${rows}} {incr r} {
    set base [expr {(${TITLE_Y} + $r) * 128 + ${column}}]
    set line {}
    for {set b 0} {$b < ${BOX_WIDTH_BYTES}} {incr b} { lappend line [debug read "physical VRAM" [expr {$base + $b}]] }
    puts $result "BOX $line"
  }
  foreach {name a} [list L [expr {${TITLE_Y} * 128 + ${column} - 1}] R [expr {${TITLE_Y} * 128 + ${column} + ${BOX_WIDTH_BYTES}}] ABOVE [expr {(${TITLE_Y} - 1) * 128 + ${column}}] BELOW [expr {(${TITLE_Y} + ${rows}) * 128 + ${column}}]] {
    puts $result "EDGE $name [debug read "physical VRAM" $a]"
  }
  # the option rows: some pixel of the first row (y 64..71) is not background
  set lit 0
  for {set b 0} {$b < 128} {incr b} { for {set y 64} {$y < 72} {incr y} { if {[debug read "physical VRAM" [expr {$y * 128 + $b}]] != 0} { incr lit } } }
  puts $result "OPTION_PIXELS $lit"
  puts $result "R1 [debug read "VDP regs" 1]"
  puts $result "PAL_MENU [palette]"
  puts $result "R7_MENU [debug read "VDP regs" 7]"
}
debug set_bp ${addr(symbols, `bitmap_flow_menu_loop_${MENU_ID}`)} {} {
  if {$::stage == 0} {
    set ::stage 1
    dump_menu
    # a screenshot taken with the throttle off shows a stale frame: run in real time for two seconds first
    set ::throttle on
    after time 2 {
      screenshot "${shotPath}"
      set ::throttle off
      keymatrixdown 8 0x01
      after time 0.3 { keymatrixup 8 0x01 }
    }
  }
}
debug set_bp ${addr(symbols, 'bitmap_enter_game_loop')} {} {
  if {$::stage == 1} { set ::stage 2; puts $::result "PAL_GAME [palette]"; puts $::result "R7_GAME [debug read "VDP regs" 7]"; puts $::result "RESULT DONE"; close $::result; exit }
}
after time 150 { puts $::result "RESULT TIMEOUT stage $::stage"; close $::result; exit }
`, 'titled.txt');
check('titled ROM: the menu and the gameplay loop are reached', /RESULT DONE/.test(titledOut), titledOut.split('\n').find(line => /TIMEOUT/.test(line)) || titledOut.slice(0, 200));
const boxRows = [...titledOut.matchAll(/^BOX (.+)$/gm)].map(match => match[1].trim().split(/\s+/).map(Number));
check('VRAM holds the logo box at titleY, centred, byte for byte', JSON.stringify(boxRows.flat()) === JSON.stringify(expectedBoxBytes),
  `${boxRows.flat().filter((value, index) => value !== expectedBoxBytes[index]).length} bytes differ of ${expectedBoxBytes.length}`);
const edge = name => Number(new RegExp(`EDGE ${name} (\\d+)`).exec(titledOut)?.[1] ?? -1);
check('nothing is drawn around the box (left, right, row above, row below are clear)', ['L', 'R', 'ABOVE', 'BELOW'].every(name => edge(name) === 0),
  ['L', 'R', 'ABOVE', 'BELOW'].map(name => `${name}=${edge(name)}`).join(' '));
check('the first option row is drawn', Number(/OPTION_PIXELS (\d+)/.exec(titledOut)?.[1] ?? 0) > 0);
check('the display is on at the menu (R#1 bit 6)', (Number(/^R1 (\d+)/m.exec(titledOut)?.[1] ?? 0) & 0x40) !== 0);
const menuPalette = (/^PAL_MENU (.+)$/m.exec(titledOut)?.[1] || '').trim().split(/\s+/).map(Number);
check('the VDP palette at the menu is the logo palette', JSON.stringify(menuPalette) === JSON.stringify(expectedPaletteBytes), menuPalette.join(','));
const titledPaletteGame = (/^PAL_GAME (.+)$/m.exec(titledOut)?.[1] || '').trim();
check('after START the game palette is back (same as the ROM without a title)', titledPaletteGame !== '' && titledPaletteGame === plainPaletteGame,
  `titled ${titledPaletteGame.slice(0, 60)} / plain ${plainPaletteGame.slice(0, 60)}`);
const r7 = (text, name) => Number(new RegExp(`^${name} ([0-9]+)`, 'm').exec(text)?.[1] ?? -1);
check('the fixture room has a non-zero backdrop colour (so the R#7 check can tell)', r7(plainOut, 'R7_GAME') > 0, `R#7 = ${r7(plainOut, 'R7_GAME')}`);
check('at the menu the backdrop is slot 0 of the logo palette (R#7 = 0)', r7(titledOut, 'R7_MENU') === 0, `R#7 = ${r7(titledOut, 'R7_MENU')}`);
check('after START R#7 is the room backdrop again', r7(titledOut, 'R7_GAME') === r7(plainOut, 'R7_GAME'), `titled ${r7(titledOut, 'R7_GAME')} / plain ${r7(plainOut, 'R7_GAME')}`);
check('the game palette is not the logo palette (the test can tell them apart)', plainPaletteGame !== expectedPaletteBytes.join(' '));
check('a screenshot was written (server/temp/menu_title_bitmap/menu_title.png)', fs.existsSync(shotPath));

// 32KB ROM: the same picture from resident data.
if (built.k32.ok) {
  const symbols32 = readSymbols(built.k32.symPath);
  const out32 = runOpenMsx(built.k32, resultPath => `
set result [open "${resultPath}" w]
set throttle off
set done 0
proc palette {} ${palettePart}
debug set_bp ${addr(symbols32, `bitmap_flow_menu_loop_${MENU_ID}`)} {} {
  if {!$::done} {
    set ::done 1
    for {set r 0} {$r < ${rows}} {incr r} {
      set base [expr {(${TITLE_Y} + $r) * 128 + ${column}}]
      set line {}
      for {set b 0} {$b < ${BOX_WIDTH_BYTES}} {incr b} { lappend line [debug read "physical VRAM" [expr {$base + $b}]] }
      puts $::result "BOX $line"
    }
    puts $::result "PAL_MENU [palette]"
    puts $::result "R7_MENU [debug read "VDP regs" 7]"
    puts $::result "RESULT DONE"
    close $::result
    exit
  }
}
after time 100 { puts $::result "RESULT TIMEOUT"; close $::result; exit }
`, 'titled32.txt', null);
  const box32 = [...out32.matchAll(/^BOX (.+)$/gm)].map(match => match[1].trim().split(/\s+/).map(Number)).flat();
  check('32KB ROM: the menu is reached and VRAM holds the logo box byte for byte', /RESULT DONE/.test(out32) && JSON.stringify(box32) === JSON.stringify(expectedBoxBytes),
    `${box32.filter((value, index) => value !== expectedBoxBytes[index]).length} bytes differ`);
  const pal32 = (/^PAL_MENU (.+)$/m.exec(out32)?.[1] || '').trim().split(/\s+/).map(Number);
  check('32KB ROM: the VDP palette is the logo palette and the backdrop is slot 0', JSON.stringify(pal32) === JSON.stringify(expectedPaletteBytes) && r7(out32, 'R7_MENU') === 0, `R#7 = ${r7(out32, 'R7_MENU')}`);
}

console.log(problems.length ? `\nRESULT FAIL (${problems.length}): ${problems.join('; ')}` : '\nRESULT PASS');
process.exit(problems.length ? 1 : 0);
