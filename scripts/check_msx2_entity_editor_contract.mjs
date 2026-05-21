#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const editorPath = join(repoRoot, 'components', 'editors', 'Msx2Screen5TileScreenEditor.tsx');
const partsPath = join(repoRoot, 'components', 'msx2_screen5_editor', 'Msx2Screen5EditorParts.tsx');
const generatorPath = join(repoRoot, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2Screen5Generator.ts');
const appUiPath = join(repoRoot, 'components', 'AppUI.tsx');
const componentEditorPath = join(repoRoot, 'components', 'editors', 'ComponentDefinitionEditor.tsx');
const templateEditorPath = join(repoRoot, 'components', 'editors', 'EntityTemplateEditor.tsx');
const projectTargetPath = join(repoRoot, 'utils', 'projectTarget.ts');
const asmTemplatePath = join(repoRoot, 'utils', 'asmTemplateGenerator.ts');
const typesPath = join(repoRoot, 'types.ts');
const source = [
  readFileSync(editorPath, 'utf8'),
  readFileSync(partsPath, 'utf8'),
  readFileSync(generatorPath, 'utf8'),
  readFileSync(appUiPath, 'utf8'),
  readFileSync(componentEditorPath, 'utf8'),
  readFileSync(templateEditorPath, 'utf8'),
  readFileSync(projectTargetPath, 'utf8'),
  readFileSync(asmTemplatePath, 'utf8'),
  readFileSync(typesPath, 'utf8'),
].join('\n');

const generatorSource = readFileSync(generatorPath, 'utf8');
const hardwareSpriteInit = generatorSource.match(/function buildHardwareSpriteInitAsm[\s\S]*?return `init_hardware_sprites:[\s\S]*?copy_to_vram_ext[\s\S]*?copy_to_vram_ext[\s\S]*?copy_to_vram_ext[\s\S]*?ld a, \$\{x\}/)?.[0] || '';
const hardwareSpritePatternBuilder = generatorSource.match(/function buildHardwareSpritePatternForLayer[\s\S]*?return bytes;\n}/)?.[0] || '';
const extendedVramWriters = generatorSource.match(/copy_to_vram_ext:[\s\S]*?write_vram_byte_ext:[\s\S]*?ret/)?.[0] || '';
const effectStateRoutine = generatorSource.match(/update_msx2_effect_state:[\s\S]*?msx2_compare_collectibles_required:/)?.[0] || '';
const verticalRoutine = generatorSource.match(/update_hardware_sprite_vertical:[\s\S]*?apply_hardware_sprite_gravity:/)?.[0] || '';

const checks = [
  ['single Entity Properties panel', (source.match(/Panel title="Entity Properties"/g) || []).length === 1],
  ['Behavior mode button exists', (source.includes("setMode('behavior')") || source.includes("layerButton('behavior'")) && source.includes("'Behavior'")],
  ['Entities mode button exists', (source.includes("setMode('entities')") || source.includes("layerButton('entities'")) && source.includes("'Entities'")],
  ['entity creation palette replaces tile palette in entities mode', source.includes('Panel title="Create MSX2 Entity"') && source.includes("mode !== 'entities'") && source.includes('MSX2_ENTITY_REPERTOIRE')],
  ['entity creation presets include core MSX2 actors', source.includes("id: 'player'") && source.includes("id: 'ghost_maze'") && source.includes("id: 'patrol_x'") && source.includes("id: 'door'")],
  ['MSX2 entity repertoire carries runtime and engine metadata', source.includes('MSX2_ENTITY_REPERTOIRE') && source.includes("runtime: 'MSX2'") && source.includes("engine: 'ghostMaze'") && source.includes("engine: 'patrolX'")],
  ['MSX2 entity kind options exclude generic custom entities', source.includes('MSX2_ENTITY_KIND_OPTIONS') && !source.includes('<option value="custom">Custom</option>')],
  ['movement options include patrol X/Y', source.includes('MSX2_ENTITY_MOVEMENT_OPTIONS') && source.includes("value: 'patrolX'") && source.includes("value: 'patrolY'")],
  ['entity tile coordinate labels exist', source.includes('>Tile X</span>') && source.includes('>Tile Y</span>')],
  ['automation labels exist for core controls', [
    'aria-label="MSX2 screen name"',
    'aria-label="MSX2 effect code"',
    'aria-label="MSX2 behavior code"',
    'aria-label="MSX2 required collectibles"',
    'aria-label="MSX2 initial air"',
    'aria-label="Entity name"',
    'aria-label="Entity kind"',
    'aria-label="Entity movement"',
  ].every((needle) => source.includes(needle))],
  ['patrol X labels exist', source.includes('>Min X</span>') && source.includes('>Max X</span>')],
  ['patrol Y labels exist', source.includes('>Min Y</span>') && source.includes('>Max Y</span>')],
  ['patrol X edits only X bounds', source.includes("selectedEntity.params.movement === 'patrolX'") && source.includes('aria-label="Patrol min X"') && source.includes('aria-label="Patrol max X"')],
  ['patrol Y edits only Y bounds', source.includes('aria-label="Patrol min Y"') && source.includes('aria-label="Patrol max Y"')],
  ['active area clamps width and height to origin', source.includes('MAP_WIDTH - activeAreaX') && source.includes('MAP_HEIGHT - activeAreaY') && source.includes('MAP_WIDTH - x') && source.includes('MAP_HEIGHT - y')],
  ['copy paste uses active or selected area crop', source.includes('activeEditRect.y + y') && source.includes('activeEditRect.x + x') && source.includes('pasteWidth') && source.includes('pasteHeight')],
  ['selection tools panel exists', source.includes('Panel title="MSX2 Selection Tools"') && source.includes('MSX2 Select Area') && source.includes('MSX2 Fill') && source.includes('MSX2 Clear')],
  ['selection rect is rendered in grid', source.includes('selectionRect.x * TILE_SIZE * 2') && source.includes('selectionRect.width * TILE_SIZE * 2')],
  ['variable tile dimensions controls exist', source.includes('MSX2_TILE_DIMENSION_OPTIONS') && source.includes('aria-label="MSX2 tile width"') && source.includes('aria-label="MSX2 tile height"')],
  ['variable tile dimensions are normalized to multiples of 8', source.includes('Math.round(numeric / 8) * 8') && source.includes('Math.max(8, Math.min(32')],
  ['tile list shows visual previews', source.includes('Msx2TilePreview') && source.includes('MSX2 tile ${tile.name} preview')],
  ['tile editor exposes MSX2 palette swatches', source.includes('aria-label="MSX2 tile palette"') && source.includes('aria-label={`MSX2 paint slot ${slot.slotIndex}`}')],
  ['tile editor exposes fill and transform tools', [
    'aria-label="MSX2 fill tile"',
    'aria-label="MSX2 flip tile horizontal"',
    'aria-label="MSX2 flip tile vertical"',
    'aria-label="MSX2 shift tile left"',
    'aria-label="MSX2 shift tile up"',
    'aria-label="MSX2 shift tile right"',
    'aria-label="MSX2 shift tile down"',
  ].every((needle) => source.includes(needle))],
  ['tile editor exposes paint modes', [
    'aria-label="MSX2 tile paint tools"',
    'aria-label={`MSX2 tile tool ${tool}`}',
    "Msx2Screen5TilePaintTool = 'pencil' | 'erase' | 'fill' | 'pick'",
    "paintTool === 'fill'",
    "paintTool === 'pick'",
  ].every((needle) => source.includes(needle))],
  ['hardware sprite init uses extended VRAM copies', hardwareSpriteInit.includes('SCREEN5_SPRPAT_VRAM') && hardwareSpriteInit.includes('SCREEN5_SPRCOL_VRAM') && hardwareSpriteInit.includes('SCREEN5_SPRATR_VRAM') && !hardwareSpriteInit.includes('call LDIRVM')],
  ['hardware 16x16 sprite pattern order is V9938 quadrant order', hardwareSpritePatternBuilder.includes('top-left, bottom-left, top-right, bottom-right') && hardwareSpritePatternBuilder.includes('layerIndex, 0, y));\n  for (let y = 8; y < 16; y++) bytes.push(spritePatternByteForLayer(rowCompositions, layerIndex, 0, y));\n  for (let y = 0; y < 8; y++) bytes.push(spritePatternByteForLayer(rowCompositions, layerIndex, 8, y));')],
  ['maze movement suppresses inline status HUD overlay', generatorSource.includes('function usesInlineStatusHud') && generatorSource.includes('return !usesMazeMovement(analysis)') && generatorSource.includes('Inline status HUD disabled for full-map maze screens')],
  ['extended VRAM writers reset VDP control latch', (extendedVramWriters.match(/in a, \(VDP_CTRL_PORT\)/g) || []).length >= 6],
  ['effect runtime does not flash debug border colors', effectStateRoutine.length > 0 && !effectStateRoutine.includes('call WRTVDP') && !effectStateRoutine.includes('.write_border')],
  ['collectible eraser uses authored tile background color', generatorSource.includes('function getCollectibleErasePaletteIndex') && generatorSource.includes('collectibleErasePackedByte') && !generatorSource.includes("formatBytes('screen5_blank_tile', Array(16 * 8).fill(0)")],
  ['maze player keeps moving in last direction', generatorSource.includes('maze_continue_current_direction') && generatorSource.includes('cp 2\n    jp z, maze_continue_up') && generatorSource.includes('ld a, 3\n    ld (msx2_player_sprite_dx), a')],
  ['maze direction changes are grid-gated to 16 pixels', generatorSource.includes('maze_can_change_direction_16') && generatorSource.includes('and #0F\n    ret nz') && generatorSource.includes('jp z, maze_move_right') && generatorSource.includes('jp z, maze_move_left')],
  ['maze input latches requested direction', generatorSource.includes('maze_try_latched_direction') && generatorSource.includes('ld (msx2_player_sprite_frame), a') && generatorSource.includes('ld a, (msx2_player_sprite_frame)')],
  ['hardware sprite animation uses MSX2-owned frame runtime', generatorSource.includes('buildHardwareSpriteLayersForFrame') && generatorSource.includes('msx2_player_anim_counter EQU #C01D') && generatorSource.includes('msx2_player_anim_frame EQU #C01E') && generatorSource.includes('update_msx2_player_sprite_animation') && generatorSource.includes('msx2_hw_sprite_frame_${frameIndex}_pattern_${layerIndex}')],
  ['MSX2 projects keep legacy MSX1 ECS offline', source.includes("target?: 'MSX1' | 'MSX2' | 'COMMON'") && source.includes('isComponentDefinitionEnabledForProject') && source.includes('isEntityTemplateEnabledForProject') && source.includes("component.target || 'MSX1'") && source.includes("template.target || 'MSX1'") && source.includes('target: projectTarget')],
  ['MSX2 entity normalization keeps projects on the MSX2 runtime', source.includes('normalizeEntityKind') && source.includes("params: { ...(entity.params || {}), runtime: 'MSX2' }")],
  ['maze world transitions bypass platform gravity', generatorSource.includes("const resumeAfterTransition = mazeMovement ? 'upload_hardware_sprite_attrs' : 'update_hardware_sprite_vertical'") && generatorSource.includes('const mazeDirectionReset = mazeMovement')],
  ['maze vertical routine guards against gravity', verticalRoutine.includes('Maze/Pac-Man mode has no platform vertical physics') && verticalRoutine.includes('jp upload_hardware_sprite_attrs')],
];

const failures = checks.filter(([, passed]) => !passed);

for (const [name, passed] of checks) {
  console.log(`${passed ? 'OK' : 'FAIL'}: ${name}`);
}

if (failures.length) {
  console.error(`\nMSX2 entity editor contract failed: ${failures.length} check(s).`);
  process.exit(1);
}

console.log('\nMSX2 entity editor contract passed.');
