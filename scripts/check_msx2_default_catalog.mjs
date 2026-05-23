#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

const read = (...parts) => readFileSync(join(repoRoot, ...parts), 'utf8');

const catalog = read('components', 'msx2_screen5_editor', 'msx2EntityCatalog.ts');
const defaults = read('data', 'defaults.ts');
const projectTarget = read('utils', 'projectTarget.ts');
const useAppState = read('hooks', 'useAppState.tsx');
const projectHandlers = read('handlers', 'useProjectHandlers.tsx');
const projectCleanup = read('utils', 'projectCleanup.ts');
const componentEditor = read('components', 'editors', 'ComponentDefinitionEditor.tsx');
const templateEditor = read('components', 'editors', 'EntityTemplateEditor.tsx');

function sourceBetween(source, startToken, endToken) {
  const start = source.indexOf(startToken);
  const end = source.indexOf(endToken, start + startToken.length);
  if (start === -1 || end === -1 || end <= start) return '';
  return source.slice(start, end);
}

function extractIds(source) {
  return [...source.matchAll(/\bid:\s*'([^']+)'/g)].map(match => match[1]);
}

const componentBlock = sourceBetween(
  catalog,
  'export const MSX2_COMPONENT_REPERTOIRE',
  'export const MSX2_ENTITY_KIND_OPTIONS'
);
const entityBlock = sourceBetween(
  catalog,
  'export const MSX2_ENTITY_REPERTOIRE',
  'export const DEFAULT_MSX2_ENTITY_CREATE_PRESETS'
);

const componentIds = extractIds(componentBlock);
const entityPresetIds = extractIds(entityBlock);
const duplicateComponentIds = componentIds.filter((id, index) => componentIds.indexOf(id) !== index);
const duplicateEntityPresetIds = entityPresetIds.filter((id, index) => entityPresetIds.indexOf(id) !== index);

const requiredEntityPresets = [
  'player',
  'player_maze',
  'ghost_maze',
  'patrol_x',
  'patrol_y',
  'hazard',
  'collectible',
  'door',
  'galaxian_player',
  'galaxian_alien_formation',
  'galaxian_laser',
  'pong_paddle',
  'pong_ball',
  'arkanoid_brick',
  'snake_head',
  'snake_segment',
  'snake_food',
];

const requiredComponents = [
  'msx2_transform',
  'msx2_hardware_sprite',
  'msx2_player_control',
  'msx2_movement',
  'msx2_collision',
  'msx2_collectible',
  'msx2_door_exit',
  'msx2_hazard',
  'msx2_ai',
  'msx2_animation',
  'msx2_health',
  'msx2_damage',
  'msx2_spawn',
  'msx2_timer',
  'msx2_projectile',
  'msx2_paddle',
  'msx2_ball',
  'msx2_brick',
  'msx2_char_render',
  'msx2_snake',
  'msx2_snake_segment',
  'msx2_scroll',
];

const checks = [
  ['MSX2 component catalog has unique ids', componentIds.length > 0 && duplicateComponentIds.length === 0],
  ['MSX2 entity preset catalog has unique ids', entityPresetIds.length > 0 && duplicateEntityPresetIds.length === 0],
  ['MSX2 component catalog covers simple-game runtime essentials', requiredComponents.every(id => componentIds.includes(id))],
  ['MSX2 entity catalog covers platform, maze, patrol, collectible, door, shooter, Pong, Arkanoid, and Snake basics', requiredEntityPresets.every(id => entityPresetIds.includes(id))],
  [
    'MSX2 catalog declares dedicated paddle, ball, and brick engines',
    catalog.includes("'paddleHorizontal'") &&
      catalog.includes("'ballBounce'") &&
      catalog.includes("'brick'") &&
      catalog.includes("movementMode: 'paddleHorizontal'") &&
      catalog.includes("movement: 'ballBounce'") &&
      catalog.includes("engine: 'brick'"),
  ],
  [
    'MSX2 catalog declares Snake as a SCREEN 4 char/tile family',
    catalog.includes("'snakeChar'") &&
      catalog.includes("'snakeFood'") &&
      catalog.includes('msx2_char_render') &&
      catalog.includes('useHardwareSprite: false') &&
      catalog.includes("movementMode: 'snakeChar'") &&
      catalog.includes("engine: 'snakeFood'"),
  ],
  [
    'MSX2 component defaults are generated from the component repertoire',
    defaults.includes('DEFAULT_MSX2_COMPONENT_DEFINITIONS') &&
      defaults.includes('MSX2_COMPONENT_REPERTOIRE.map(component =>') &&
      defaults.includes('id: component.id') &&
      defaults.includes("target: 'MSX2'") &&
      defaults.includes('...DEFAULT_MSX2_COMPONENT_DEFINITIONS'),
  ],
  [
    'MSX2 entity defaults are generated from the entity repertoire',
    defaults.includes('DEFAULT_MSX2_ENTITY_TEMPLATES') &&
      defaults.includes('MSX2_ENTITY_REPERTOIRE.map(preset =>') &&
      defaults.includes('id: `tpl_msx2_${preset.id}`') &&
      defaults.includes("target: 'MSX2'") &&
      defaults.includes("isPlayer: preset.kind === 'player'") &&
      defaults.includes('buildMsx2EntityComponents(preset, 0, 0)') &&
      defaults.includes('...DEFAULT_MSX2_ENTITY_TEMPLATES'),
  ],
  [
    'target filters are reusable for catalogs and project state',
    projectTarget.includes('filterComponentDefinitionsForProject') &&
      projectTarget.includes('filterEntityTemplatesForProject') &&
      projectTarget.includes("component.target || 'MSX1'") &&
      projectTarget.includes("template.target || 'MSX1'"),
  ],
  [
    'initial project state and new/load project flows filter defaults by screen mode',
    useAppState.includes('DEFAULT_PROJECT_COMPONENT_DEFINITIONS') &&
      useAppState.includes('DEFAULT_PROJECT_ENTITY_TEMPLATES') &&
      projectHandlers.includes('filterComponentDefinitionsForProject(DEFAULT_COMPONENT_DEFINITIONS, newProjectScreenMode)') &&
      projectHandlers.includes('filterEntityTemplatesForProject(DEFAULT_ENTITY_TEMPLATES, newProjectScreenMode)') &&
      projectHandlers.includes('filterComponentDefinitionsForProject(migratedComponentDefinitions, loadedMode)') &&
      projectHandlers.includes('isEntityTemplateEnabledForProject(template, loadedMode)'),
  ],
  [
    'save cleanup prevents opposite-target defaults from being serialized',
    projectHandlers.includes('currentScreenMode,') &&
      projectCleanup.includes('currentScreenMode?: string') &&
      projectCleanup.includes('isComponentDefinitionEnabledForProject(compDef, currentScreenMode)') &&
      projectCleanup.includes('isEntityTemplateEnabledForProject(template, currentScreenMode)'),
  ],
  [
    'component, template, and Player Kit imports cannot bypass active-target filtering',
    componentEditor.includes('target: definition.target || projectTarget') &&
      componentEditor.includes('isComponentDefinitionEnabledForProject(definition, currentScreenMode)') &&
      templateEditor.includes('target: template.target || projectTarget') &&
      templateEditor.includes('isEntityTemplateEnabledForProject(template, currentScreenMode)') &&
      templateEditor.includes('componentDefinitionsToImport') &&
      templateEditor.includes('templatesToImport'),
  ],
];

const failures = checks.filter(([, passed]) => !passed);

for (const [name, passed] of checks) {
  console.log(`${passed ? 'OK' : 'FAIL'}: ${name}`);
}

if (failures.length) {
  console.error(`\nMSX2 default catalog failed: ${failures.length} check(s).`);
  if (duplicateComponentIds.length) console.error(`Duplicate MSX2 component ids: ${duplicateComponentIds.join(', ')}`);
  if (duplicateEntityPresetIds.length) console.error(`Duplicate MSX2 entity preset ids: ${duplicateEntityPresetIds.join(', ')}`);
  process.exit(1);
}

console.log('\nMSX2 default catalog passed.');
