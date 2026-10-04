// Half-width (4x8) SCREEN 5 HUD font: builds a variant of the slime mix fixture
// whose HUD font is 4x8 (built-in 3x5 glyphs), adds two static HUD texts and
// moves the NPC onto the player spawn, then exports + assembles it.
//
// Needs the compiled generator from `node scripts/check_generator_output_identical.mjs`
// (server/temp/tsbuild_cmp). Usage: node test/msx2-hudfont-4x8/build_4x8_test.cjs [8]
// The optional "8" builds the same variant with the normal 8x8 width, as the
// control for a side-by-side check.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const BUILD = path.join(ROOT, 'server', 'temp', 'tsbuild_cmp');
const generator = require(path.join(BUILD, 'utils', 'msxGenerator', 'index.js'));
const { DEFAULT_HUD_FONT_4X8_PATTERNS, MSX2_HUD_FONT_4X8_EXTRA_CHARS } = require(path.join(BUILD, 'utils', 'msx2HudFontUtils.js'));

const width = process.argv[2] === '8' ? 8 : 4;
const tag = `hudfont_${width}`;
const project = JSON.parse(fs.readFileSync(path.join(ROOT, 'test', 'msx2-slime', 'fixture_slime_mix.json'), 'utf8'));
const assets = project.assets;

const font = assets.find(asset => asset.type === 'msx2hudfont').data;
if (width === 4) {
  const bg = font.screen5BackgroundSlot ?? 0;
  const characters = font.characters + Array.from(MSX2_HUD_FONT_4X8_EXTRA_CHARS).filter(c => !font.characters.includes(c)).join('');
  const patterns = {};
  const bitmapPatterns = {};
  for (const char of characters) {
    const pattern = DEFAULT_HUD_FONT_4X8_PATTERNS[char] || Array(8).fill(0);
    patterns[char] = pattern;
    bitmapPatterns[char] = pattern.map(bits => Array.from({ length: 8 }, (_u, x) => (bits & (0x80 >> x)) ? 15 : bg));
  }
  Object.assign(font, { glyphWidth: 4, characters, patterns, bitmapPatterns });
}

// Two static HUD texts in the free right part of the 20px HUD band.
const hud = assets.find(asset => asset.type === 'msx2hud' && asset.name === 'New MSX2 HUD').data;
const textLayer = (id, x, y, text) => ({
  id, name: id, kind: 'widget', visible: true, locked: false,
  element: {
    id: `${id}_el`, kind: 'text', x, y, width: 76, height: 8, text, binding: 'custom', initialValue: 0,
    format: { base: 'dec', zeroPad: false }, colors: { text: 15 }, align: { h: 'left', v: 'top' }, visible: true, blink: 'off',
  },
});
hud.layers.unshift(textLayer('hud_text_a', 180, 2, '4X8 HUD TEXT OK'), textLayer('hud_text_b', 180, 11, 'ABCDEFGHIJKLMNOPQRS'));

// Play starts in pan2 (default entry 147,146): move its NPC onto that spawn
// (cell 9,9 = 144,144) so UP talks at once.
const pan2 = assets.find(asset => asset.type === 'msx2bitmaproom' && asset.name === 'pan2').data;
const npc = pan2.entities.find(entity => entity.kind === 'npc');
npc.position = { x: 9, y: 9 };
npc.components.msx2_transform = { ...npc.components.msx2_transform, tileX: 9, tileY: 9, pixelX: 144, pixelY: 144, spawnX: 144, spawnY: 144 };

const outDir = __dirname;
fs.writeFileSync(path.join(outDir, `${tag}_fixture.json`), JSON.stringify(project));
const realLog = console.log;
console.log = () => {};
const files = generator.generateModularASM(tag, assets, {
  generateUnified: true, romMode: 'megarom', targetFormat: 'konami', screenMode: project.currentScreenMode,
});
console.log = realLog;
const asm = files['unitedFiles.asm'];
fs.writeFileSync(path.join(outDir, `${tag}.asm`), asm);
execFileSync('java', ['-jar', path.join(ROOT, 'server', 'glass.jar'), '-I', path.join(ROOT, 'server'),
  path.join(outDir, `${tag}.asm`), path.join(outDir, `${tag}.rom`), path.join(outDir, `${tag}.sym`)], { stdio: 'pipe' });
console.log(`${tag}: ${asm.split('\n').length} ASM lines, ROM ${fs.statSync(path.join(outDir, `${tag}.rom`)).size} bytes`);
