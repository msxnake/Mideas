// Smoke: Enemy Library -> screen bridge (snapshot at placement).
// 1) buildMsx2EnemyEntityFromAsset maps an EnemyDefinition into a placed enemy
//    entity (movement mode + render sprite + enemyAssetId link).
// 2) The generator turns that placed enemy into a runtime slot (mode byte) and
//    resolves the enemy sprite from the referenced asset's render.spriteId.
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'test', 'ts_build_enemybridge');
const generator = require(path.join(BUILD, 'utils', 'msxGenerator', 'index.js'));
const catalog = require(path.join(BUILD, 'components', 'msx2_screen4_editor', 'msx2EntityCatalog.js'));

// --- 1) authoring: behavior mapping + entity builder (pure TS) ---
const map = catalog.mapEnemyBehaviorToMovementMode;
if (map('PatrolHorizontal').movementName !== 'patrolX') throw new Error('PatrolHorizontal should map to patrolX');
if (map('WalkerTurnOnEdge').movementName !== 'walkerEdge') throw new Error('WalkerTurnOnEdge should map to walkerEdge');
if (map('HopperTowardsPlayer').movementName !== 'static' || map('HopperTowardsPlayer').implemented) {
  throw new Error('unimplemented behavior should map to static fallback (implemented:false)');
}

const enemyAsset = {
  id: 'enemy_walker_bat', name: 'Walker Bat', type: 'msx2enemy',
  data: {
    enemyId: 'walker_bat', name: 'Walker Bat',
    behavior: {
      type: 'WalkerTurnOnEdge',
      stateTransitions: [{
        id: 'near_chase',
        condition: 'PlayerNear',
        toBehavior: 'ChaseHorizontal',
        returnBehavior: 'WalkerTurnOnEdge',
        rangeX: 48,
        rangeY: 32,
      }],
    },
    attack: { type: 'DamageOnTouch' },
    render: { renderMode: 'hardwareSprite', spriteId: 'sprite_loderunner_guard_msx2', palette: '', size: '16x16', animations: {} },
    stats: { hp: 1, damage: 1 },
  },
};
const placed = catalog.buildMsx2EnemyEntityFromAsset(enemyAsset, 10, 6);
if (placed.kind !== 'enemy') throw new Error('placed enemy kind must be enemy');
if (placed.components.msx2_movement.mode !== 'walkerEdge') throw new Error('placed enemy movement mode must be walkerEdge');
if (placed.params.enemyAssetId !== 'enemy_walker_bat') throw new Error('placed enemy must keep enemyAssetId link');
if (placed.components.msx2_hardware_sprite.msx2SpriteAssetId !== 'sprite_loderunner_guard_msx2') throw new Error('placed enemy must snapshot render spriteId');
if (!placed.components.msx2_ai?.stateSwitchEnabled) throw new Error('placed enemy must snapshot state switch component');
if (placed.components.msx2_ai.nearMode !== 'chaseH') throw new Error('PlayerNear transition should map to chaseH');
if (placed.components.msx2_ai.farMode !== 'walkerEdge') throw new Error('return behavior should map to walkerEdge');

// --- 2) end-to-end: place it on the loderunner screen, generate ROM ASM ---
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'server', 'temp', 'loderunner_jumper_project.json'), 'utf8'));
const assets = Array.isArray(raw.assets) ? raw.assets : [];
assets.push(enemyAsset);
const byType = (type) => assets.filter((a) => a && a.type === type);
// replace screen enemies with the placed library enemy
for (const screen of byType('msx2screen')) {
  const ents = screen?.data?.layers?.entities || [];
  screen.data.layers.entities = ents.filter(e => e.kind !== 'enemy' && e.kind !== 'hazard');
  screen.data.layers.entities.push(placed);
}
const summary = {
  projectInfo: { name: raw.name || 'enemy_bridge_smoke', targetMSX: 'MSX2' },
  screenMode: raw.screenMode, currentScreenMode: raw.currentScreenMode, targetGraphicsBackend: raw.targetGraphicsBackend,
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
const asm = generator.generateModularASMFromSummary(summary, { generateUnified: true, romMode: 'megarom', targetFormat: 'konami' })['unitedFiles.asm'] || '';

// the placed enemy must become a walker (mode 7) slot
const modeIdx = asm.indexOf('msx2_screen_enemy_mode:');
if (modeIdx < 0) throw new Error('enemy mode table missing');
const modeBlock = asm.slice(modeIdx, asm.indexOf('\n', asm.indexOf('DB', modeIdx)));
if (!/#07/.test(modeBlock)) throw new Error('placed library enemy did not become mode 7 (walkerEdge): ' + modeBlock);
if (!asm.includes('msx2_enemy_walker_edge_shared')) throw new Error('walker shared handler missing');
if (!asm.includes('update_msx2_enemy_behavior_states:')) throw new Error('enemy behavior state switch runtime missing');
if (!asm.includes('msx2_screen_enemy_state_switch:')) throw new Error('enemy state switch table missing');
if (!asm.includes('msx2_screen_enemy_state_near_mode:')) throw new Error('enemy state near-mode table missing');
const nearIdx = asm.indexOf('msx2_screen_enemy_state_near_mode:');
const nearBlock = asm.slice(nearIdx, asm.indexOf('\n', asm.indexOf('DB', nearIdx)));
if (!/#08/.test(nearBlock)) throw new Error('near-mode table should contain chaseH mode 8: ' + nearBlock);

fs.writeFileSync(path.join(ROOT, 'test', 'enemy_bridge_smoke.asm'), asm);
console.log(`enemy_bridge smoke OK: placed mode=${placed.components.msx2_movement.mode}, chars=${asm.length}`);
