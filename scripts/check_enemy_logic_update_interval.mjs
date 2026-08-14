#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';

const root = process.cwd();
const read = (...parts) => readFileSync(path.join(root, ...parts), 'utf8');

async function importBundled(entry) {
  const bundle = await esbuild.build({
    entryPoints: [path.join(root, entry)],
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
    external: ['react', 'react-dom', '@xyflow/react', 'jszip', 'axios', 'lucide-react', 'twgl.js'],
  });
  return import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
}

const runtime = await importBundled('utils/msxGenerator/generators/msx2/msx2EntityRuntimeGenerator.ts');

const enemy = (id, interval, mode = 'patrolX', speed = 1, alias = false) => ({
  id,
  kind: 'enemy',
  position: { x: 2, y: 3 },
  components: {
    msx2_movement: { mode, speed, direction: 1, turnPx: 100 },
    msx2_ai: interval === undefined ? {} : { [alias ? 'logicUpdateEveryFrames' : 'logicUpdateIntervalFrames']: interval },
  },
  params: {},
});

const slots = runtime.getMsx2EnemyHazardRuntimeSlots({
  layers: { entities: [
    enemy('every_frame', 1),
    enemy('every_other', 2),
    enemy('every_third', 3),
    enemy('legacy_missing', undefined),
    enemy('legacy_alias', 4, 'patrolX', 1, true),
  ] },
});
assert.deepEqual(
  slots.map(slot => slot.logicUpdateIntervalFrames),
  [1, 2, 3, 1, 4],
  'runtime slot cadence must preserve 1/2/3, default legacy to 1, and read the old alias',
);

const bat = runtime.getMsx2EnemyHazardRuntimeSlots({
  layers: { entities: [enemy('fly8_three', 3, 'flyBounce8', 1)] },
})[0];
assert.equal(bat.mode, runtime.MSX2_ENEMY_MOVEMENT_FLY_BOUNCE_8, 'FlyBounce8 must keep mode 13');
assert.equal(bat.logicUpdateIntervalFrames, 3, 'FlyBounce8 must carry cadence 3');
assert.equal(bat.speed, 1, 'FlyBounce8 speed is pixels per logic update');

const types = read('types.ts');
const library = read('data', 'enemyLibrary.ts');
const editor = read('components', 'editors', 'Msx2EnemyEditor.tsx');
const catalog = read('components', 'msx2_screen4_editor', 'msx2EntityCatalog.ts');
const screen4 = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2Screen4Generator.ts');
const screen5 = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2Screen5BitmapRoomGenerator.ts');
const bitmapEnemy = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2BitmapEnemyGenerator.ts');
const turret = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2BitmapTurretGenerator.ts');

assert(types.includes('logicUpdateIntervalFrames?: number;'), 'EnemyDefinition must expose the canonical field');
assert(library.includes('logicUpdateIntervalFrames: 1,'), 'new Enemy Assets must default to every frame');
assert(editor.includes('enemy.logicUpdateIntervalFrames'), 'Enemy Asset UI must edit the canonical field');
assert(catalog.includes('msx2_ai: aiComponent') && catalog.includes('logicUpdateIntervalFrames,'), 'placements must snapshot cadence');

assert(screen4.includes('update_msx2_enemy_logic_cadence:'), 'SCREEN 4 must compute cadence once per video frame');
assert(screen4.includes('msx2_enemy_logic_due'), 'SCREEN 4 must expose one shared due flag per slot');
assert(screen4.indexOf('call update_msx2_enemy_logic_cadence') < screen4.indexOf("${enemyBulletsEnabled ? '    call update_msx2_enemy_bullet"), 'SCREEN 4 cadence must be computed before attack logic');
assert(screen4.includes('attack spawn shares behavior/movement cadence'), 'SCREEN 4 attack spawn must consult logic_due');
assert(screen4.includes('${enemyLogicCadenceGate(slot)}\n${buildEnemyScreenSlotOffsetAsm(slot)}'), 'SCREEN 4 behavior transition must consult the same gate');
assert(screen4.includes("enemies[index]?.logicUpdateIntervalFrames ?? 1"), 'SCREEN 4 ROM table must use canonical cadence with fallback 1');

assert(screen5.includes('enemyAsset?.logicUpdateIntervalFrames'), 'SCREEN 5 linked Enemy Asset must be source of truth');
assert(screen5.includes('entity?.components?.msx2_ai?.logicUpdateIntervalFrames'), 'SCREEN 5 placement snapshot must be accepted');
assert(bitmapEnemy.includes('ld a, (ix+23)             ; video-frame countdown'), 'SCREEN 5 generic enemies need per-slot countdowns');
assert(bitmapEnemy.includes('cadence skipped: animation still ticks'), 'SCREEN 5 animation must continue on skipped logic frames');
assert(turret.includes('logic interval') && turret.includes('shared aim/fire logic countdown'), 'SCREEN 5 TurretAim must gate aim/fire logic');

const mainLoop = screen5.split('.bitmap_main_loop:')[1]?.split('.bitmap_gameflow_exit:')[0] || '';
const allSatEnd = mainLoop.indexOf('${shootBulletSatCall}');
assert(allSatEnd >= 0, 'main loop must contain the final bullet SAT writer');
assert(mainLoop.indexOf('${playerColorsUpdateCall}') > allSatEnd, 'player colour uploads must follow every SAT writer');
assert(mainLoop.indexOf('${enemySystem.colorCallAsm}') > allSatEnd, 'enemy colour uploads must follow every SAT writer');
assert(mainLoop.indexOf('${shootPatternPrepareCall}') > allSatEnd, 'borrowed pattern VRAM copies must follow every SAT writer');

const enemySatRoutine = bitmapEnemy.split('bitmap_update_enemy_sat:')[1]?.split('bitmap_update_enemy_colors:')[0] || '';
assert(!enemySatRoutine.includes('${colorUploadSlotBlocks}'), 'enemy SAT routine must never perform colour uploads');
assert(bitmapEnemy.includes('colorCallAsm: \'    call bitmap_update_enemy_colors\\n\''), 'enemy colours need a separate deferred call');

const waitVblank = screen5.split('bitmap_wait_vblank:')[1]?.split('update_player_movement:')[0] || '';
assert(waitVblank.includes('ld a, #8F') && waitVblank.includes('R#15 = 0'), 'wait_vblank must explicitly select S#0');

console.log('PASS enemy logic cadence: 1/2/3, legacy fallback, FlyBounce8=3, SCREEN4 shared due, SCREEN5 turret, global SAT-first order');
