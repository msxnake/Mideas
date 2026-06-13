// Smoke: generate a SCREEN 4 ROM with a WalkerTurnOnEdge enemy and assert the
// shared handler + mode-7 dispatch + slot mode byte are emitted.
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const generator = require(path.join(ROOT, 'test', 'ts_build_walker', 'utils', 'msxGenerator', 'index.js'));

const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'server', 'temp', 'loderunner_jumper_project.json'), 'utf8'));
const assets = Array.isArray(raw.assets) ? raw.assets : [];
const byType = (type) => assets.filter((a) => a && a.type === type);

// Switch every non-patrol enemy to WalkerTurnOnEdge.
let patched = 0;
for (const screen of byType('msx2screen')) {
  for (const entity of (screen?.data?.layers?.entities || [])) {
    if (entity?.kind !== 'enemy' && entity?.kind !== 'hazard') continue;
    if ((entity.params?.movement || entity.components?.msx2_movement?.mode) === 'patrolX') continue;
    entity.components = entity.components || {};
    entity.components.msx2_movement = { ...(entity.components.msx2_movement || {}), mode: 'walkerTurnOnEdge', direction: 1 };
    entity.params = { ...(entity.params || {}), movement: 'walkerTurnOnEdge' };
    patched += 1;
  }
}
if (patched === 0) throw new Error('No enemy patched to walkerTurnOnEdge');

const summary = {
  projectInfo: { name: raw.name || 'walker_edge_smoke', targetMSX: raw.targetMSX || 'MSX2' },
  screenMode: raw.screenMode,
  currentScreenMode: raw.currentScreenMode,
  targetGraphicsBackend: raw.targetGraphicsBackend,
  assets: {
    sprites: byType('sprite'), msx2Sprites: byType('msx2sprite'), msx2Bitmaps: byType('msx2bitmap'),
    msx2Screens: byType('msx2screen'), tiles: byType('tile'), tileBanks: byType('tilebank'),
    screens: byType('screenmap'), entities: byType('entity'), components: byType('componentdefinition'),
    templates: byType('entitytemplate'), fonts: byType('font'), stateMachines: byType('statemachine'),
    worldmaps: byType('worldmap'), bosses: byType('boss'), globalVariables: byType('globalvariable'),
    tracks: byType('music').map((a) => a.data || a), menus: byType('menu'),
  },
  execution: { mainGameFlow: byType('gameflow')[0]?.data },
};

const files = generator.generateModularASMFromSummary(summary, {
  generateUnified: true,
  romMode: 'megarom',
  targetFormat: 'konami',
});
const asm = files['unitedFiles.asm'] || '';

const required = [
  'msx2_enemy_walker_edge_shared:',
  'FUNCTION: msx2_enemy_walker_edge_shared',
  '.enemy_slot_0_walker_edge',
  'jp msx2_enemy_walker_edge_shared',
  '.walker_edge_turn',
  '    neg',
];
const missing = required.filter((needle) => !asm.includes(needle));
if (missing.length > 0) throw new Error('walker ASM missing: ' + missing.join(', '));

// The patched enemy must carry mode byte 7 in the per-screen enemy mode table.
const modeIdx = asm.indexOf('msx2_screen_enemy_mode:');
if (modeIdx < 0) throw new Error('msx2_screen_enemy_mode table not found');
const modeBlock = asm.slice(modeIdx, asm.indexOf('\n', asm.indexOf('DB', modeIdx)));
if (!/#07/.test(modeBlock)) throw new Error('mode 7 (#07) not present in enemy mode table: ' + modeBlock);

// PUSH/POP balance sanity inside the shared handler (each push has a pop).
const h0 = asm.indexOf('msx2_enemy_walker_edge_shared:');
const h1 = asm.indexOf('.walker_edge_turn:', h0);
const body = asm.slice(h0, h1 + 200);
const pushes = (body.match(/\bpush (bc|af)\b/g) || []).length;
const pops = (body.match(/\bpop (bc|af)\b/g) || []).length;
if (pushes !== pops) throw new Error(`PUSH/POP imbalance in walker handler: ${pushes} push vs ${pops} pop`);

fs.writeFileSync(path.join(ROOT, 'test', 'walker_edge_smoke.asm'), asm);
console.log(`walker_edge smoke OK: patched=${patched}, push=pop=${pushes}, chars=${asm.length}`);
