import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const interruptSource = fs.readFileSync('utils/msxGenerator/generators/interruptGenerator.ts', 'utf8');
const variablesSource = fs.readFileSync('utils/msxGenerator/generators/variablesGenerator.ts', 'utf8');
const componentsSource = fs.readFileSync('utils/msxGenerator/generators/componentsGenerator.ts', 'utf8');
const gameFlowSource = fs.readFileSync('utils/msxGenerator/generators/gameFlowGenerator.ts', 'utf8');
const spritesSource = fs.readFileSync('utils/msxGenerator/generators/spritesGenerator.ts', 'utf8');
const unifiedSource = fs.readFileSync('utils/msxGenerator/generators/unifiedGenerator.ts', 'utf8');
const indexSource = fs.readFileSync('utils/msxGenerator/index.ts', 'utf8');
const docSource = fs.readFileSync('docs/project/VBLANK_HARD_PLAYER_SCHEDULER.md', 'utf8');

function assertContains(source, pattern, label) {
  assert.match(source, pattern, label);
}

function assertOrder(source, labels) {
  let previousIndex = -1;
  for (const [label, needle] of labels) {
    const index = source.indexOf(needle);
    assert.notEqual(index, -1, `Missing marker: ${label}`);
    assert.ok(index > previousIndex, `${label} must appear after previous marker`);
    previousIndex = index;
  }
}

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `Missing start marker: ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `Missing end marker after ${startNeedle}: ${endNeedle}`);
  return source.slice(start, end);
}

function compileSpritesGeneratorForRuntimeTest() {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mideas-sprites-generator-'));
  const tscBin = path.join('node_modules', '.bin', process.platform === 'win32' ? 'tsc.cmd' : 'tsc');
  const tscArgs = [
    'utils/msxGenerator/generators/spritesGenerator.ts',
    '--target', 'ES2022',
    '--module', 'commonjs',
    '--moduleResolution', 'node',
    '--esModuleInterop',
    '--skipLibCheck',
    '--allowJs',
    '--jsx', 'react-jsx',
    '--outDir', outDir,
    '--noEmit', 'false',
  ];
  try {
    if (process.platform === 'win32') {
      execFileSync(process.env.ComSpec || 'cmd.exe', ['/c', tscBin, ...tscArgs], { stdio: 'pipe' });
    } else {
      execFileSync(tscBin, tscArgs, { stdio: 'pipe' });
    }
  } catch (error) {
    fs.rmSync(outDir, { recursive: true, force: true });
    throw error;
  }
  return {
    outDir,
    modulePath: path.join(outDir, 'utils/msxGenerator/generators/spritesGenerator.js'),
  };
}

function makeSolidSprite(id, name, color) {
  return {
    id,
    name,
    size: { width: 16, height: 16 },
    backgroundColor: '#000000',
    spritePalette: ['#000000', color],
    frames: [{
      id: `${id}_frame0`,
      name: 'frame0',
      data: Array.from({ length: 16 }, () => Array.from({ length: 16 }, () => color)),
    }],
  };
}

function extractDbPairs(asm, label, count) {
  const body = sliceBetween(asm, `${label}:`, '\n\n');
  return [...body.matchAll(/^\s*db\s+(\d+),\s*(\d+)/gm)]
    .slice(0, count)
    .map(match => [Number(match[1]), Number(match[2])]);
}

function extractDbValues(asm, label, count) {
  const body = sliceBetween(asm, `${label}:`, '\n\n');
  return [...body.matchAll(/^\s*db\s+(-?\d+)/gm)]
    .slice(0, count)
    .map(match => Number(match[1]));
}

function assertGeneratedSatReservation() {
  const { outDir, modulePath } = compileSpritesGeneratorForRuntimeTest();
  try {
    const require = createRequire(import.meta.url);
    const { generateSpritesFile } = require(modulePath);
    const analysis = {
      sprites: [
        makeSolidSprite('enemySprite', 'EnemySprite', '#FC5554'),
        makeSolidSprite('playerSprite', 'PlayerSprite', '#21C842'),
      ],
      components: [
        { id: 'comp_sprite', properties: [{ name: 'spriteAssetId', type: 'sprite_ref' }] },
        { id: 'comp_input', properties: [] },
      ],
      templates: [
        {
          id: 'enemyTpl',
          name: 'Enemy',
          isPlayer: false,
          components: [{ definitionId: 'comp_sprite', defaultValues: { spriteAssetId: 'enemySprite' } }],
        },
        {
          id: 'playerTpl',
          name: 'Player',
          isPlayer: true,
          components: [
            { definitionId: 'comp_sprite', defaultValues: { spriteAssetId: 'playerSprite' } },
            { definitionId: 'comp_input', defaultValues: {} },
          ],
        },
      ],
      entities: [
        { id: 'enemy0', name: 'Enemy0', entityTemplateId: 'enemyTpl', position: { x: 1, y: 1 } },
        { id: 'player0', name: 'Player0', entityTemplateId: 'playerTpl', position: { x: 2, y: 2 } },
      ],
      gameFlow: { nodes: [] },
      bosses: [],
      worldmaps: [],
    };

    const originalLog = console.log;
    const originalWarn = console.warn;
    console.log = () => {};
    console.warn = () => {};
    let asm;
    try {
      asm = generateSpritesFile(analysis);
    } finally {
      console.log = originalLog;
      console.warn = originalWarn;
    }
    const configPairs = extractDbPairs(asm, 'entity_sprite_config', 2);
    assert.deepEqual(configPairs[0], [4, 1], 'enemy entity table entry must move behind reserved Player slots');
    assert.deepEqual(configPairs[1], [0, 1], 'Player entity table entry must own SAT base slot 0');

    const colors = extractDbValues(asm, 'sprite_layer_colors_init', 5);
    assert.deepEqual(colors, [2, 0, 0, 0, 8], 'Player reserves slots 0..3 and enemy color starts at slot 4');
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
}

const dispatcherSource = sliceBetween(interruptSource, 'interrupt_dispatcher:', '; Helper for indirect call');
const hardPlayerTickSource = sliceBetween(interruptSource, 'run_hard_player_tick:', '; @mideas:endblock id=runtime.interrupt.hard_player_tick');
const playerSatUploadSource = sliceBetween(spritesSource, 'upload_player_sprites_to_vram:', '; SPRITE CONSTANTS');
const entityJobGateSource = sliceBetween(componentsSource, 'entity_job_should_run_c:', '; Initialize position component');
const worldLoopTemplateSource = sliceBetween(gameFlowSource, 'gameflow_world_game_loop:', '; @mideas:endblock id=runtime.gameflow.world_loop');
const spriteAllocationSource = sliceBetween(spritesSource, 'interface EntitySpriteAllocation', 'const spritePatternUsage = buildSpritePatternUsage');
const stopInterruptSource = sliceBetween(interruptSource, 'stop_interrupt_system:', '; @mideas:endblock id=runtime.interrupt.stop');
const residentReplacementsSource = sliceBetween(unifiedSource, 'const replacements: Array<[string, string]> = [', '];');
const residentWrappersSource = sliceBetween(unifiedSource, 'call_update_sprites_to_vram_resident:', 'resident_noop:');

// Public config remains opt-in. Existing exports must not start running the
// hard Player IRQ path unless interruptConfig.enableHardPlayerTick is explicit.
assert.match(indexSource, /enableHardPlayerTick\?: boolean/);
assert.match(indexSource, /const hardPlayerTickEnabled = \(config\.interruptConfig\?\.enableHardPlayerTick \?\? false\)/);
assert.match(indexSource, /!\(romMode === 'megarom' && targetFormat === 'ascii16'\)/);
assert.match(interruptSource, /function generateInitInterruptSystem\(hardPlayerTickEnabled: boolean\)/);
assert.match(interruptSource, /ld a, \$\{hardPlayerTickEnabled \? 1 : 0\}/);

assert.match(interruptSource, /hardPlayerTickEnabled\?: boolean/);
assert.match(interruptSource, /ld \(player_hard_tick_enabled\), a/);
assert.match(interruptSource, /ld \(player_hard_tick_lost\+1\), a/);
assert.match(interruptSource, /call run_hard_player_tick/);
assert.match(interruptSource, /run_hard_player_tick:/);
assert.match(stopInterruptSource, /ld \(interrupt_system_enabled\), a/);
assert.match(stopInterruptSource, /ld \(player_hard_tick_enabled\), a/);

assertOrder(dispatcherSource, [
  ['VBlank status latch', 'call update_vblank_flag'],
  ['interrupt counter increment', 'ld (interrupt_counter), hl'],
  ['hard Player tick', 'call run_hard_player_tick'],
  ['soft task table walk', 'ld hl, task_table'],
]);

assertOrder(hardPlayerTickSource, [
  ['enable gate load', 'ld a, (player_hard_tick_enabled)'],
  ['enable gate branch', 'jp z, .hard_player_done'],
  ['lock depth check', 'ld a, (far_call_irq_lock_depth)'],
  ['lost counter increment', 'ld hl, player_hard_tick_lost'],
  ['gameplay engine gate', 'ld a, (current_screen_engine)'],
  ['input poll', 'call task_update_input'],
  ['Player realtime pipeline', 'call update_player_realtime_pipeline'],
  ['Player SAT upload', 'call upload_player_sprites_to_vram'],
]);

assert.match(variablesSource, /player_hard_tick_enabled EQU/);
assert.match(variablesSource, /player_hard_tick_lost\s+EQU/);
assert.match(variablesSource, /far_call_irq_lock_depth EQU/);

assert.match(componentsSource, /update_player_realtime_pipeline:/);
assert.match(componentsSource, /call refresh_player_sprite_fastpath/);
assert.doesNotMatch(
  sliceBetween(componentsSource, 'update_player_realtime_pipeline:', '; HELPER: Force update'),
  /call update_wallgrab_component/,
  'hard Player pipeline must not call full soft WallGrab sweep'
);
assertOrder(entityJobGateSource, [
  ['Player flag table', 'ld hl, entity_is_player'],
  ['Player flag read', 'ld a, (hl)'],
  ['Player bypasses soft cadence', 'jr nz, entity_job_run_active'],
  ['soft cadence period table', 'ld hl, entity_job_period'],
]);

assertOrder(worldLoopTemplateSource, [
  ['frame sync', 'halt'],
  ['hard tick gate before input', 'ld a, (player_hard_tick_enabled)'],
  ['skip duplicated Player pre-update', 'jp nz, .skip_player_fastpath_pre_update'],
  ['soft ECS update', 'call update_all_entities'],
  ['hard tick gate before Player SM fastpath', 'jp nz, .skip_player_fastpath_before_sm'],
  ['generic soft state machines', 'call execute_all_state_machines'],
  ['hard tick gate before Player post-update', 'jp nz, .skip_player_fastpath_post_update'],
]);

assert.match(spritesSource, /upload_player_sprites_to_vram:/);
assert.match(spritesSource, /Copy only the Player-owned hardware sprite slots from RAM to VRAM/);
assert.match(spritesSource, /const isPlayerEntity = \(entity: any\): boolean/);
assert.match(spritesSource, /hasExplicitPlayerTemplate/);
assert.match(spritesSource, /reservedSlotCount: number/);
assert.match(spritesSource, /comp_player_input/);
assert.match(spriteAllocationSource, /allocationOrder/);
assert.match(spriteAllocationSource, /a\.isPlayer \? -1 : 1/);
assert.match(spriteAllocationSource, /Math\.max\(layerCount, 4\)/);
assert.match(spriteAllocationSource, /entityAllocationsByEntityIndex/);
assert.match(spriteAllocationSource, /spriteLayerColorsInit\[hwSlot\]/);
assert.match(spriteAllocationSource, /spriteLayerYOffsetsInit\[hwSlot\]/);
assertOrder(playerSatUploadSource, [
  ['Player entity index', 'ld a, (player_entity_index)'],
  ['sprite component gate', 'and COMP_MASK_SPRITE'],
  ['entity sprite config', 'ld hl, entity_sprite_config'],
  ['RAM SAT source', 'ld de, sprite_attributes'],
  ['VRAM SAT destination', 'ld de, SPRATR'],
  ['layer count byte copy', 'BC = layer count * 4 bytes'],
  ['bounded VRAM copy', 'call FAST_LDIRVM'],
]);
assert.doesNotMatch(playerSatUploadSource, /ld bc, \$\{uploadBytes\}/);

assert.match(unifiedSource, /'update_player_realtime_pipeline'/);
assert.match(unifiedSource, /'upload_player_sprites_to_vram'/);
assert.match(residentReplacementsSource, /\['upload_player_sprites_to_vram', 'call_upload_player_sprites_to_vram_resident'\]/);
assert.match(residentReplacementsSource, /\['update_player_realtime_pipeline', 'call_update_player_realtime_pipeline_resident'\]/);
assert.match(residentWrappersSource, /call_upload_player_sprites_to_vram_resident:/);
assert.match(residentWrappersSource, /ld de, SPRATR/);
assert.match(residentWrappersSource, /call FAST_LDIRVM/);
assert.match(unifiedSource, /call_update_player_realtime_pipeline_resident:/);
assert.match(unifiedSource, /HARD_PLAYER is disabled for ASCII16 MegaROM/);

assertGeneratedSatReservation();

assertContains(docSource, /MSX1 VBlank interrupt as the authoritative game tick/, 'doc must define VBlank as the game tick');
assertContains(docSource, /MSX2 line IRQ, must not increment `interrupt_counter`/, 'doc must say line IRQ does not increment tick');
assertContains(docSource, /Hard zone/, 'doc must define the hard zone');
assertContains(docSource, /Soft zone/, 'doc must define the soft zone');
assertContains(docSource, /disabled by default/, 'doc must state opt-in default');
assertContains(docSource, /no massive catch-up loop/, 'doc must ban massive catch-up');
assertContains(docSource, /SAT slots are 0\.\.3/, 'doc must reserve Player SAT slots 0..3');
assertContains(docSource, /Recommended Cadences/, 'doc must include cadence guidance');
assertContains(docSource, /## Invariants/, 'doc must include invariants');
assertContains(docSource, /## Acceptance Tests/, 'doc must include acceptance tests');
assertOrder(docSource, [
  ['runtime policy', '## Runtime Policy'],
  ['hard pipeline', '## Hard Player Pipeline'],
  ['SAT rule', '## SAT Rule'],
  ['line IRQ section', '## MSX1 VBlank vs MSX2 Line IRQ'],
  ['recommended cadences', '## Recommended Cadences'],
  ['invariants', '## Invariants'],
  ['acceptance tests', '## Acceptance Tests'],
]);

console.log('vblank hard player scheduler source checks passed');
