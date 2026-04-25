/**
 * Validate canonical MSX 2D entity templates.
 */

import fs from 'fs';

const defaultsPath = 'data/defaults.ts';
const source = fs.readFileSync(defaultsPath, 'utf8');

const componentIds = new Set(
  [...source.matchAll(/id:\s*"([^"]+)"/g)]
    .map(match => match[1])
    .filter(id => id.startsWith('comp_'))
);

const requiredTemplates = [
  'tpl_msx_platform_player',
  'tpl_msx_topdown_player',
  'tpl_msx_shooter_player',
  'tpl_msx_projectile',
  'tpl_msx_basic_patrol_enemy',
];

function getTemplateBlock(templateId) {
  const marker = `id: "${templateId}"`;
  const start = source.indexOf(marker);
  if (start === -1) return null;

  const nextTemplate = source.indexOf('\n  {\n    id: "tpl_', start + marker.length);
  const listEnd = source.indexOf('\n];', start + marker.length);
  const end = nextTemplate === -1 ? listEnd : Math.min(nextTemplate, listEnd);

  return source.slice(start, end);
}

const failures = [];

for (const templateId of requiredTemplates) {
  const block = getTemplateBlock(templateId);
  if (!block) {
    failures.push(`Missing template ${templateId}`);
    continue;
  }

  const refs = [...block.matchAll(/definitionId:\s*"([^"]+)"/g)].map(match => match[1]);
  if (refs.length === 0) {
    failures.push(`${templateId} has no components`);
    continue;
  }

  for (const ref of refs) {
    if (!componentIds.has(ref)) {
      failures.push(`${templateId} references unknown component ${ref}`);
    }
  }
}

const semanticChecks = [
  ['tpl_msx_platform_player', 'comp_wall_collision'],
  ['tpl_msx_platform_player', 'comp_gravity'],
  ['tpl_msx_platform_player', 'comp_jump'],
  ['tpl_msx_topdown_player', 'comp_tile_collector'],
  ['tpl_msx_shooter_player', 'comp_shoot'],
  ['tpl_msx_projectile', 'comp_lifetime'],
  ['tpl_msx_basic_patrol_enemy', 'comp_patrol'],
];

for (const [templateId, componentId] of semanticChecks) {
  const block = getTemplateBlock(templateId) || '';
  if (!block.includes(`definitionId: "${componentId}"`)) {
    failures.push(`${templateId} must include ${componentId}`);
  }
}

if (failures.length > 0) {
  console.error('MSX 2D template validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('MSX 2D template validation passed');
