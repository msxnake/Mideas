// Smoke: generate the MSX2 SCREEN 4 layers fixture with carry_object
// enabled on the player plus carryable entities, and assert the runtime
// hook/tables/SAT plumbing is emitted.
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const BUILD = process.env.CARRY_TS_BUILD || path.join(ROOT, 'test', 'ts_build_carry');
const generator = require(path.join(BUILD, 'utils', 'msxGenerator', 'index.js'));

function loadFixture() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'test', 'msx2-screen4', 'msx2screen-layers-project.json'), 'utf8'));
}

function buildSummary(raw) {
  const assets = Array.isArray(raw.assets) ? raw.assets : [];
  const byType = (type) => assets.filter((asset) => asset && asset.type === type);
  return {
    summary: {
      projectInfo: { name: raw.name || 'carry_object_smoke', targetMSX: raw.targetMSX || 'MSX2' },
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
      execution: { mainGameFlow: byType('gameflow')[0].data },
    },
    byType,
  };
}

// The layers fixture only leaves ~900 free ROM bytes in simple32k; the
// carry_object runtime is IX-factored precisely so it stays under that.
function generate(raw, romMode = 'simple32k') {
  const { summary } = buildSummary(raw);
  const files = generator.generateModularASMFromSummary(summary, {
    generateUnified: true,
    romMode,
    targetFormat: 'konami',
  });
  return files['unitedFiles.asm'] || '';
}

// ── positive case: skill on + carryable entities ──
const raw = loadFixture();
const screens = raw.assets.filter((asset) => asset.type === 'msx2screen');
let patchedPlayers = 0;
let addedCarryables = 0;
for (const [screenIndex, screen] of screens.entries()) {
  const entities = screen?.data?.layers?.entities || [];
  for (const entity of entities) {
    if (entity?.kind !== 'player') continue;
    entity.activeSkills = Array.from(new Set([...(entity.activeSkills || []), 'carry_object']));
    entity.skillParameters = {
      ...(entity.skillParameters || {}),
      carry_object: { throwPower: 6, throwCooldown: 20 },
    };
    patchedPlayers += 1;
  }
  // Two carryables on the first screen, one on the rest: rock via flag
  // (no sprite asset -> default rock pattern), key via the catalog-shaped
  // msx2_carryable component with a Render (msx2_hardware_sprite) binding.
  entities.push({ kind: 'carryable', position: { x: 4, y: 9 }, params: { carryable: true } });
  addedCarryables += 1;
  if (screenIndex === 0) {
    entities.push({
      kind: 'enemy',
      position: { x: 9, y: 9 },
      components: {
        msx2_carryable: { enabled: true },
        msx2_hardware_sprite: { msx2SpriteAssetId: 'sprite_msx2_layers_player' },
      },
    });
    addedCarryables += 1;
  }
}
if (patchedPlayers === 0) throw new Error('Fixture has no player entity to patch');

const asm = generate(raw);
const required = [
  // equates + RAM
  'msx2_carry_carried_slot EQU',
  'msx2_carry_runtime_state EQU',
  // ROM tables
  'msx2_screen_carry_count:',
  'msx2_screen_carry_x:',
  'msx2_screen_carry_y:',
  'msx2_screen_carry_sprite:',
  'msx2_carry_color_rows:',
  // routines
  'msx2_control_carry_pressed:',
  'msx2_reset_carry_runtime_for_current_screen:',
  'update_msx2_carry_objects:',
  'msx2_carry_phase_step:',
  'msx2_carry_pickup_probe:',
  '.carry_step_fly',
  '.carry_step_land',
  // pattern data + SAT writes (slot 1 binds a real msx2sprite via Render)
  'msx2_hw_carry_sprite_pattern_0',
  'msx2_hw_carry_sprite_pattern_1',
  'from msx2sprite sprite_msx2_layers_player',
  '.carry_sprite_0_visible',
  '.carry_sprite_1_done',
  // calls
  '    call update_msx2_carry_objects',
  '    call msx2_reset_carry_runtime_for_current_screen',
];
const missing = required.filter((needle) => !asm.includes(needle));
if (missing.length > 0) {
  throw new Error('carry_object ASM is missing: ' + missing.join(', '));
}

// The carryable flagged as kind 'enemy' (msx2_carryable component) must NOT
// become an enemy slot: enemy counts stay as in the unpatched fixture.
const baselineAsm = generate(loadFixture());
const enemyCountLine = (text) => {
  const idx = text.indexOf('msx2_screen_enemy_count:');
  if (idx < 0) throw new Error('msx2_screen_enemy_count table not found');
  const dbIdx = text.indexOf('DB', idx);
  return text.slice(dbIdx, text.indexOf('\n', dbIdx));
};
if (enemyCountLine(asm) !== enemyCountLine(baselineAsm)) {
  throw new Error(`carryable entity leaked into enemy slots: ${enemyCountLine(asm)} vs baseline ${enemyCountLine(baselineAsm)}`);
}

// SAT ordering: carry slot writes must come right before the terminator write.
const satIdx = asm.indexOf('write_hardware_sprite_attrs:');
const carrySpriteIdx = asm.indexOf('; Carryable object hardware sprite slot 0.', satIdx);
const terminatorIdx = asm.indexOf('ld a, 208\n    ld hl, #1E', carrySpriteIdx);
if (!(satIdx >= 0 && carrySpriteIdx > satIdx && terminatorIdx > carrySpriteIdx)) {
  throw new Error(`carry SAT writes misplaced: sat=${satIdx} carry=${carrySpriteIdx} term=${terminatorIdx}`);
}

// ── negative case: no skill -> byte-identical absence (simple32k) ──
const baseline32k = generate(loadFixture(), 'simple32k');
if (baseline32k.includes('msx2_carry') || baseline32k.includes('carry_object')) {
  throw new Error('disabled carry_object leaked into baseline ASM');
}

const outAsm = path.join(ROOT, 'test', 'carry_object_smoke.asm');
fs.writeFileSync(outAsm, asm);
console.log(`carry_object smoke OK: players=${patchedPlayers}, carryables=${addedCarryables}, chars=${asm.length}, asm=${outAsm}`);
