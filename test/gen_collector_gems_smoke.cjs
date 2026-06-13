// Smoke: generate the MSX2 SCREEN 4 layers fixture with collector_gems
// enabled on the player and assert the runtime hook + sfx are emitted.
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const generator = require(path.join(ROOT, 'test', 'ts_build_gems', 'utils', 'msxGenerator', 'index.js'));

const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'test', 'msx2-screen4', 'msx2screen-layers-project.json'), 'utf8'));
const assets = Array.isArray(raw.assets) ? raw.assets : [];
const byType = (type) => assets.filter((asset) => asset && asset.type === type);

// Enable collector_gems on every player entity (gemValue=250, sound on).
let patchedPlayers = 0;
for (const screen of byType('msx2screen')) {
  const entities = screen?.data?.layers?.entities || [];
  for (const entity of entities) {
    if (entity?.kind !== 'player') continue;
    entity.activeSkills = Array.from(new Set([...(entity.activeSkills || []), 'collector_gems']));
    entity.skillParameters = {
      ...(entity.skillParameters || {}),
      collector_gems: { gemValue: 250, collectSound: true },
    };
    patchedPlayers += 1;
  }
}
if (patchedPlayers === 0) throw new Error('Fixture has no player entity to patch');

const gameFlowAsset = byType('gameflow')[0];
const summary = {
  projectInfo: { name: raw.name || 'collector_gems_smoke', targetMSX: raw.targetMSX || 'MSX2' },
  screenMode: raw.screenMode,
  currentScreenMode: raw.currentScreenMode,
  targetGraphicsBackend: raw.targetGraphicsBackend,
  assets: {
    sprites: byType('sprite'),
    msx2Sprites: byType('msx2sprite'),
    msx2Bitmaps: byType('msx2bitmap'),
    msx2Screens: byType('msx2screen'),
    tiles: byType('tile'),
    tileBanks: byType('tilebank'),
    screens: byType('screenmap'),
    entities: byType('entity'),
    components: byType('componentdefinition'),
    templates: byType('entitytemplate'),
    fonts: byType('font'),
    stateMachines: byType('statemachine'),
    worldmaps: byType('worldmap'),
    bosses: byType('boss'),
    globalVariables: byType('globalvariable'),
    tracks: byType('music').map((asset) => asset.data || asset),
    menus: byType('menu'),
  },
  execution: { mainGameFlow: gameFlowAsset.data },
};

const files = generator.generateModularASMFromSummary(summary, {
  generateUnified: true,
  romMode: 'simple32k',
  targetFormat: 'konami',
});
const asm = files['unitedFiles.asm'] || '';

const required = [
  'collector_gems skill: +250 points per gem',
  'add a, #FA',          // 250 & 0xFF
  'adc a, #00',          // 250 >> 8
  'call draw_msx2_score_hud',
  'call msx2_sfx_gem',
  'msx2_sfx_gem:',
  'msx2_sfx_gem_data:',
  'db 7,#3E,0,#1C,1,#00,11,#28,12,#00,8,#10,13,#09',
];
const missing = required.filter((needle) => !asm.includes(needle));
if (missing.length > 0) {
  throw new Error('collector_gems ASM is missing: ' + missing.join(', '));
}

// Order check: the score hook must run after the latch set and before
// the required-collectibles compare inside the .collectible branch.
const collectibleIdx = asm.indexOf('.collectible:');
const latchIdx = asm.indexOf('ld (msx2_collectible_latch), a', collectibleIdx);
const hookIdx = asm.indexOf('collector_gems skill: +250', collectibleIdx);
const compareIdx = asm.indexOf('call msx2_compare_collectibles_required', collectibleIdx);
if (!(collectibleIdx >= 0 && latchIdx > collectibleIdx && hookIdx > latchIdx && compareIdx > hookIdx)) {
  throw new Error(`collector_gems hook order is wrong: collectible=${collectibleIdx} latch=${latchIdx} hook=${hookIdx} compare=${compareIdx}`);
}

const outAsm = path.join(ROOT, 'test', 'collector_gems_smoke.asm');
fs.writeFileSync(outAsm, asm);
console.log(`collector_gems smoke OK: players=${patchedPlayers}, chars=${asm.length}, asm=${outAsm}`);
