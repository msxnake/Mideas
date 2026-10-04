// Byte-exact check of the Intro with a 4x8 (half width) font: two characters in the place of one.
//
//   npx tsx scripts/check_msx2_intro_half_width.ts [--reuse-build]
//
// 1. Takes test/msx2-intro/fixture_intro.json and turns its custom font into a SCREEN 5 4x8 font
//    (the built-in 3x5 glyphs), so the two text zones of slide 2 use a 4 px cell.
// 2. Generates the ROM (scripts/measure_bitmap_rom_budget.mjs) and runs it in OpenMSX, pressing SPACE
//    through the intro. At the two moments where slide 2 has finished typing, the VRAM rectangle of
//    each zone is dumped.
// 3. Compares those bytes with the editor's own rendering (layoutZoneText + drawZoneText with the same
//    font). They must be identical: the preview and the ROM agree, glyph by glyph.
//
// Also demanded: the picture is not blank, it differs from what an 8 px cell would draw (so the test can
// tell the two apart), and the body text, which needs two lines at 8 px, fits in one.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  INTRO_SCREEN_W,
  createIntroBuffer,
  drawZoneText,
  layoutZoneText,
  normalizeScreenRect,
  resolveIntroFont,
} from '../utils/msx2IntroUtils';
import { DEFAULT_HUD_FONT_4X8_PATTERNS } from '../utils/msx2HudFontUtils';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WORK = path.join(ROOT, 'server', 'temp', 'intro_half');
const OPENMSX = process.env.OPENMSX_EXE || 'C:/Program Files/openMSX/openmsx.exe';
const reuseBuild = process.argv.includes('--reuse-build');
fs.mkdirSync(WORK, { recursive: true });

const project = JSON.parse(fs.readFileSync(path.join(ROOT, 'test', 'msx2-intro', 'fixture_intro.json'), 'utf8'));
const fontAsset = project.assets.find((asset: any) => asset.type === 'msx2hudfont');
const introAsset = project.assets.find((asset: any) => asset.type === 'msx2intro');
const slide = introAsset.data.slides[1];
const zoneTitle = slide.textZones.find((zone: any) => zone.id === 'z_t');
const zoneBody = slide.textZones.find((zone: any) => zone.id === 'z_b');
const stepTitle = slide.steps.find((step: any) => step.zoneId === 'z_t');
const stepBody = slide.steps.find((step: any) => step.zoneId === 'z_b');
assert.ok(fontAsset && zoneTitle && zoneBody && stepTitle && stepBody, 'the fixture lost its custom-font slide');

// ---- 1. the 4x8 font ----
const wideFont = JSON.parse(JSON.stringify(fontAsset));
fontAsset.data.vdpMode = 'SCREEN5';
fontAsset.data.glyphWidth = 4;
fontAsset.data.patterns = Object.fromEntries(Array.from(fontAsset.data.characters as string).map(char => [char, char === ' ' ? new Array(8).fill(0) : [...(DEFAULT_HUD_FONT_4X8_PATTERNS[char] ?? new Array(8).fill(0))]]));
const projectFile = path.join(WORK, 'project.json');
fs.writeFileSync(projectFile, JSON.stringify(project));

// ---- expected rendering, from the editor's code ----
const expectedRect = (zone: any, text: string, font: ReturnType<typeof resolveIntroFont>['font']) => {
  const rect = normalizeScreenRect(zone.rect, font.cellW, font.cellH);
  const buf = createIntroBuffer();
  for (let y = rect.y; y < rect.y + rect.h; y++) for (let x = rect.x; x < rect.x + rect.w; x++) buf[y * INTRO_SCREEN_W + x] = zone.bg & 15;
  const layout = layoutZoneText({ ...zone, rect }, text, font);
  drawZoneText(buf, { ...zone, rect }, layout, layout.totalChars, font);
  const bytes: number[] = [];
  for (let y = rect.y; y < rect.y + rect.h; y++) {
    for (let x = rect.x; x < rect.x + rect.w; x += 2) bytes.push(((buf[y * INTRO_SCREEN_W + x] & 15) << 4) | (buf[y * INTRO_SCREEN_W + x + 1] & 15));
  }
  return { rect, layout, bytes };
};
const halfFont = resolveIntroFont(project.assets, zoneTitle.fontAssetId, undefined).font;
const wideProject = { assets: project.assets.map((asset: any) => (asset.id === fontAsset.id ? wideFont : asset)) };
const fullFont = resolveIntroFont(wideProject.assets, zoneTitle.fontAssetId, undefined).font;
assert.equal(halfFont.cellW, 4, 'the patched font must be a 4 px cell in the editor');
assert.equal(fullFont.cellW, 8, 'the original font must still be an 8 px cell');

const cases = [
  { name: 'title', zone: zoneTitle, text: stepTitle.text },
  { name: 'body', zone: zoneBody, text: stepBody.text },
].map(item => ({ ...item, half: expectedRect(item.zone, item.text, halfFont), full: expectedRect(item.zone, item.text, fullFont) }));

// ---- 2. ROM + OpenMSX ----
console.log('generating the ROM ...');
const rom = path.join(WORK, 'intro_half.rom');
const sym = path.join(WORK, 'intro_half.sym');
try {
  execFileSync(process.execPath, [
    '--max-old-space-size=8192', path.join(ROOT, 'scripts', 'measure_bitmap_rom_budget.mjs'), projectFile,
    ...(reuseBuild ? ['--reuse-build'] : []), '--keep', rom, '--sym', sym,
  ], { cwd: ROOT, stdio: 'pipe', maxBuffer: 1 << 28 });
} catch (error: any) {
  throw new Error(`ROM build failed:\n${error.stdout || ''}${error.stderr || ''}`.slice(0, 3000));
}
const symbols = new Map<string, number>();
for (const line of fs.readFileSync(sym, 'utf8').split('\n')) {
  const match = line.match(/^([^:\s]+):\s*equ\s+([0-9A-Fa-f]+)H/i);
  if (match) symbols.set(match[1], parseInt(match[2], 16));
}
const address = (name: string) => {
  const value = symbols.get(name);
  assert.ok(value !== undefined, `${name} missing from the .sym`);
  return `0x${value.toString(16).toUpperCase()}`;
};

const resultFile = path.join(WORK, 'result.txt').replace(/\\/g, '/');
const dumpFile = path.join(WORK, 'vram_dump.txt').replace(/\\/g, '/');
fs.rmSync(resultFile, { force: true });
fs.rmSync(dumpFile, { force: true });
const rectArgs = (item: (typeof cases)[number]) => `${item.half.rect.x} ${item.half.rect.y} ${item.half.rect.w} ${item.half.rect.h}`;
const tcl = `
set result [open "${resultFile}" w]
set dump [open "${dumpFile}" w]
set throttle off
proc rd {a} { return [debug read memory $a] }
proc vram {a} { return [debug read "physical VRAM" $a] }
proc press {} { keymatrixdown 8 0x01; after time 0.2 { keymatrixup 8 0x01 } }
# page 0 is 128 bytes per row (SCREEN 5, 256 px)
proc dump_rect {name x y w h} {
  global dump
  set bytes {}
  for {set r 0} {$r < $h} {incr r} {
    for {set i 0} {$i < [expr {$w / 2}]} {incr i} { lappend bytes [vram [expr {($y + $r) * 128 + $x / 2 + $i}]] }
  }
  puts $dump "$name [join $bytes { }]"
  flush $dump
}
set marker_a ${address('bitmap_intro_marker')}
set slides_a ${address('bitmap_intro_slides')}
set steps_a ${address('bitmap_intro_steps')}
set k 0
set busy 0
set armed 1
set started 0
proc finish {msg} { global result dump; puts $result $msg; close $result; close $dump; exit }
proc press_presentation {} { global started; if {!$started} { press; after time 1.5 press_presentation } }
after time 5.5 press_presentation
# The interpreter counts what is left: slides (after the current one) and steps (after the current one).
# Slide 2 has two steps: the title (slides 0, steps 1) and the body (slides 0, steps 0).
proc on_wait {k} {
  global started slides_a steps_a
  set started 1
  set slides [rd $slides_a]
  set steps [rd $steps_a]
  if {$slides == 0 && $steps == 1} { dump_rect title ${rectArgs(cases[0])} }
  if {$slides == 0 && $steps == 0} { dump_rect body ${rectArgs(cases[1])}; finish "RESULT DUMPED" }
  press
  after time 0.3 { set ::busy 0; set ::armed 0 }
}
proc poll {} {
  global marker_a k busy armed
  set m [rd $marker_a]
  if {$m == 0} { set armed 1 }
  if {!$busy && $armed && $m == 1} { set busy 1; set armed 0; set n $k; incr k; on_wait $n }
  after time 0.05 poll
}
debug write memory $marker_a 0
after time 5 poll
after time 120 { finish "RESULT TIMEOUT: waiting moment $::k never came" }
`;
const tclPath = path.join(WORK, 'intro_half.tcl');
fs.writeFileSync(tclPath, tcl);
console.log('running OpenMSX ...');
const proc = spawnSync(OPENMSX, ['-machine', 'C-BIOS_MSX2+_JP', '-cart', rom.replace(/\\/g, '/'), '-romtype', 'KonamiSCC', '-script', tclPath.replace(/\\/g, '/')], { cwd: ROOT, timeout: 240000, stdio: 'pipe' });
if (!fs.existsSync(resultFile)) {
  console.error(`OpenMSX produced no result file (exit ${proc.status}).\n${proc.stderr?.toString().slice(0, 1500)}`);
  process.exit(2);
}
const resultText = fs.readFileSync(resultFile, 'utf8').trim();
assert.match(resultText, /RESULT DUMPED/, resultText);

// ---- 3. compare ----
const dumps = new Map<string, number[]>();
for (const line of fs.readFileSync(dumpFile, 'utf8').split(/\r?\n/)) {
  const [name, ...bytes] = line.trim().split(/\s+/);
  if (name) dumps.set(name, bytes.map(Number));
}
let fails = 0;
const report = (ok: boolean, message: string) => { console.log(`${ok ? 'ok   ' : 'FAIL '} ${message}`); if (!ok) fails++; };
for (const item of cases) {
  const got = dumps.get(item.name);
  const rect = item.half.rect;
  const stride = rect.w / 2;
  if (!got) { report(false, `${item.name}: not dumped from VRAM`); continue; }
  // The blinking "more" marker is a 3x3 byte triangle in the zone's bottom-right corner: not part of the text.
  const inMarker = (index: number) => (index % stride) >= stride - 4 && Math.floor(index / stride) >= rect.h - 4;
  const same = (a: number[], b: number[]) => a.length === b.length && a.every((value, index) => inMarker(index) || value === b[index]);
  const diffs = got.map((value, index) => (!inMarker(index) && value !== item.half.bytes[index] ? `(${rect.x + (index % stride) * 2},${rect.y + Math.floor(index / stride)}) got ${value.toString(16)} want ${item.half.bytes[index]?.toString(16)}` : '')).filter(Boolean);
  const background = ((item.zone.bg & 15) << 4) | (item.zone.bg & 15);
  const inkBytes = item.half.bytes.filter(value => value !== background).length;
  report(got.length === item.half.bytes.length, `${item.name}: ${got.length} VRAM bytes dumped, ${item.half.bytes.length} expected`);
  report(diffs.length === 0, `${item.name}: VRAM is identical to the editor's 4x8 render (${rect.w}x${rect.h}, ${item.half.layout.cols} chars/line, ${inkBytes} ink bytes)${diffs.length ? `: ${diffs.length} bytes differ, first ${diffs.slice(0, 4).join('; ')}` : ''}`);
  report(inkBytes > 10, `${item.name}: the expected picture is real text, not a blank box (${inkBytes} ink bytes)`);
  report(!same(got, item.full.bytes), `${item.name}: the ROM does NOT match an 8 px cell, so this test can tell the two widths apart`);
  report(item.half.layout.cols === item.full.layout.cols * 2, `${item.name}: ${item.half.layout.cols} characters per line against ${item.full.layout.cols} with the 8x8 font`);
}
const body = cases[1];
report(body.half.layout.lines.length < body.full.layout.lines.length,
  `body: ${body.half.layout.lines.length} line at 4 px against ${body.full.layout.lines.length} lines at 8 px`);
console.log(fails ? `\nRESULT FAIL (${fails})` : '\nRESULT PASS');
process.exit(fails ? 1 : 0);
