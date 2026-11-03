#!/usr/bin/env node
// Play mode <-> MSX1 ROM parity contract (docs/project/PLAN_PARIDAD_PLAY_ROM.md, phase 0).
//
// Extracts, straight from the source code:
//   - conditions / actions implemented by the live Play mode
//     (components/modals/GameFlowPreviewModal.tsx: evaluateCondition / executeStateActions)
//   - conditions / actions the ROM state machine can encode
//     (utils/msxGenerator/generators/stateMachineGenerator.ts: CONDITION_IDS / ACTION_IDS)
//   - components each side reads (Play: 'comp_*' ids in the Play mode;
//     ROM: STANDARD_COMPONENT_IDS in utils/msxGenerator/utils/componentAnalyzer.ts plus
//     ids checked directly by entitiesGenerator.ts)
//   - the components offered by default in the editor (data/defaults.ts)
// and compares them with the KNOWN divergences below.
//
// It fails when a NEW divergence appears AND when a listed divergence has been fixed
// (so the allowlist must shrink as the plan advances). Decision record: the ROM is the
// source of truth; components implemented by neither side are hidden from the editor.
//
// Run: node scripts/check_play_rom_parity.mjs   (npm run test:play-rom-parity)
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

// ---------------------------------------------------------------------------
// Known divergences (shrink this list phase by phase; empty = full parity)
// ---------------------------------------------------------------------------
const KNOWN = {
  // In the ROM, missing in Play mode (phase 1)
  conditionsRomOnly: [],
  actionsRomOnly: [],
  // In Play mode, missing in the ROM
  conditionsPlayOnly: [],
  actionsPlayOnly: [],
  // Components read by the ROM but not simulated by Play mode (phase 4: port to Play)
  // NOTE (not detectable by id): Play reads comp_wall_collision only for the move-test hitbox;
  // WallCollision tile stopping itself is still ROM-only (tracked in the plan, phase 4).
  componentsRomOnly: ['comp_dash', 'comp_mirror', 'comp_physics', 'comp_pos', 'comp_wall_jump'],
  // Components simulated by Play mode but unknown to the ROM
  componentsPlayOnly: ['comp_child_link'],
  // Default editor components implemented by NEITHER side (phase 4: hidden in the editor via utils/componentAvailability.ts)
  componentsNowhere: [
    'comp_PacmanMovementV2', 'comp_PacmanRotationV2', 'comp_aiming', 'comp_bounce',
    'comp_boss_crush_movement', 'comp_boss_neck_chain', 'comp_inventory', 'comp_pacMovement',
    'comp_rotate', 'comp_spawner',
  ],
};

// ---------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------
const between = (text, startMarker, endMarker) => {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start + 1);
  if (start < 0 || end < 0) throw new Error(`Markers not found: "${startMarker}" .. "${endMarker}"`);
  return text.slice(start, end);
};
const caseLabels = (text) => new Set([...text.matchAll(/case '([A-Z_]+)'/g)].map(m => m[1]));
const typeKeys = (text, objName) => new Set([...between(text, `export const ${objName} = {`, '} as const;').matchAll(/^\s*([A-Z_]+):/gm)].map(m => m[1]));
const romIdKeys = (text, tableName, typeName) => new Set([...between(text, `export const ${tableName}`, '};').matchAll(new RegExp(`\\[${typeName}\\.([A-Z_]+)\\]`, 'g'))].map(m => m[1]));

const play = read('components/modals/GameFlowPreviewModal.tsx');
const smGen = read('utils/msxGenerator/generators/stateMachineGenerator.ts');
const smTypes = read('statemachine.types.ts');
const analyzer = read('utils/msxGenerator/utils/componentAnalyzer.ts');
const entitiesGen = read('utils/msxGenerator/generators/entitiesGenerator.ts');
const defaults = read('data/defaults.ts');

const editorConditions = typeKeys(smTypes, 'ConditionTypes');
const editorActions = new Set([...typeKeys(smTypes, 'ActionTypes')].filter(a => a !== 'NONE'));
const playConditions = caseLabels(between(play, 'const evaluateCondition = useCallback', 'const evaluateGuard = useCallback'));
const playActions = caseLabels(between(play, 'const executeStateActions = (', 'const processEventTransitions = useCallback'));
const romConditions = romIdKeys(smGen, 'CONDITION_IDS', 'ConditionTypes');
const romActions = new Set([...romIdKeys(smGen, 'ACTION_IDS', 'ActionTypes')].filter(a => a !== 'NONE'));

const playComponents = new Set([...play.matchAll(/'(comp_[A-Za-z0-9_]+)'/g)].map(m => m[1]));
const romComponents = new Set([
  ...[...between(analyzer, 'const STANDARD_COMPONENT_IDS', '};').matchAll(/'(comp_[A-Za-z0-9_]+)'\s*:/g)].map(m => m[1]),
  ...[...entitiesGen.matchAll(/definitionId === '(comp_[A-Za-z0-9_]+)'/g)].map(m => m[1]),
]);
const editorComponents = new Set([...defaults.matchAll(/id:\s*"(comp_[A-Za-z0-9_]+)"/g)].map(m => m[1]));

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------
const diff = (a, b) => [...a].filter(x => !b.has(x)).sort();
const only = (set, ...others) => [...set].filter(x => others.every(o => !o.has(x))).sort();

const actual = {
  conditionsRomOnly: diff(romConditions, playConditions).filter(c => editorConditions.has(c)),
  actionsRomOnly: diff(romActions, playActions).filter(a => editorActions.has(a)),
  conditionsPlayOnly: diff(playConditions, romConditions).filter(c => editorConditions.has(c)),
  actionsPlayOnly: diff(playActions, romActions).filter(a => editorActions.has(a)),
  componentsRomOnly: only(romComponents, playComponents).filter(c => editorComponents.has(c)),
  componentsPlayOnly: only(playComponents, romComponents).filter(c => editorComponents.has(c)),
  componentsNowhere: only(editorComponents, playComponents, romComponents),
};

// Sanity: the editor offers every condition/action at least one side implements.
const unimplementedEverywhere = [
  ...[...editorConditions].filter(c => !playConditions.has(c) && !romConditions.has(c)).map(c => `condition ${c}`),
  ...[...editorActions].filter(a => !playActions.has(a) && !romActions.has(a)).map(a => `action ${a}`),
];

let failed = false;
for (const key of Object.keys(KNOWN)) {
  const expected = [...KNOWN[key]].sort();
  const got = actual[key];
  const added = got.filter(x => !expected.includes(x));
  const fixed = expected.filter(x => !got.includes(x));
  if (added.length || fixed.length) {
    failed = true;
    console.error(`FAIL ${key}:`);
    if (added.length) console.error(`  new divergence (fix it or add it to KNOWN.${key}): ${added.join(', ')}`);
    if (fixed.length) console.error(`  no longer divergent (remove from KNOWN.${key}): ${fixed.join(', ')}`);
  } else {
    console.log(`ok   ${key}: ${got.length ? got.join(', ') : '(parity)'}`);
  }
}
// Phase 4 decision: components implemented by neither side are hidden from the editor pickers.
const hiddenIds = new Set([...between(read('utils/componentAvailability.ts'), 'UNIMPLEMENTED_COMPONENT_IDS', ']);').matchAll(/'(comp_[A-Za-z0-9_]+)'/g)].map(m => m[1]));
const notHidden = actual.componentsNowhere.filter(c => !hiddenIds.has(c));
const hiddenButImplemented = [...hiddenIds].filter(c => !actual.componentsNowhere.includes(c)).sort();
if (notHidden.length || hiddenButImplemented.length) {
  failed = true;
  if (notHidden.length) console.error(`FAIL components implemented nowhere but not hidden (add to utils/componentAvailability.ts): ${notHidden.join(', ')}`);
  if (hiddenButImplemented.length) console.error(`FAIL hidden components that are now implemented (remove from utils/componentAvailability.ts): ${hiddenButImplemented.join(', ')}`);
} else {
  console.log(`ok   hidden components == implemented nowhere (${hiddenIds.size})`);
}
if (unimplementedEverywhere.length) {
  failed = true;
  console.error(`FAIL editor offers items implemented by neither side: ${unimplementedEverywhere.join(', ')}`);
}

console.log(`\nPlay: ${playConditions.size} conditions, ${playActions.size} actions | ROM: ${romConditions.size} conditions, ${romActions.size} actions | editor components: ${editorComponents.size}`);
if (failed) {
  console.error('\nPlay/ROM parity contract FAILED (see docs/project/PLAN_PARIDAD_PLAY_ROM.md).');
  process.exit(1);
}
console.log('Play/ROM parity contract OK (known divergences unchanged).');
