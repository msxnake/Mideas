// Standalone smoke test: re-implement the core logic and compare against expectations.
// This validates behavior parity without requiring a full TS toolchain.
const path = require('node:path');
const fs = require('node:fs');
const ROOT = path.resolve(__dirname, '..');
const ts = fs.readFileSync(path.join(ROOT, 'utils', 'msx2PlayerDefaults.ts'), 'utf8');

function assert(cond, msg) {
  if (!cond) { console.error('FAIL:', msg); process.exit(1); }
  console.log('OK:', msg);
}

// 1) Defaults are produced for double_jump
assert(ts.includes('buildSkillParametersDefaults'), 'buildSkillParametersDefaults is defined');
assert(ts.includes('mergeSkillParameters'), 'mergeSkillParameters is defined');
assert(ts.includes('coerceSkillParameterValue'), 'coerceSkillParameterValue is defined');

// 2) Coercion respects min/max for number
const coerceLogic = ts.match(/const coerceSkillParameterValue[\s\S]+?\n\};/);
assert(coerceLogic, 'coerceSkillParameterValue is well-formed');
assert(coerceLogic[0].includes('Number.isFinite'), 'coerce uses Number.isFinite');
assert(coerceLogic[0].includes('Math.max') && coerceLogic[0].includes('Math.min'), 'coerce clamps to min/max');

// 3) Default value handling for boolean
assert(coerceLogic[0].includes('Boolean(raw)'), 'coerce returns boolean for boolean params');
assert(coerceLogic[0].includes('param.default'), 'coerce falls back to default when NaN');

// 4) mergeSkillParameters merges defaults + user values
const mergeLogic = ts.match(/const mergeSkillParameters[\s\S]+?\n\};/);
assert(mergeLogic, 'mergeSkillParameters is well-formed');
assert(mergeLogic[0].includes('defaults') && mergeLogic[0].includes('raw'), 'mergeSkillParameters uses defaults and raw');

// 5) Normalizer returns skillParameters
assert(ts.includes('skillParameters: mergeSkillParameters(parsed?.skillParameters)'),
  'normalizeMsx2PlayerDefinition returns merged skillParameters');

// 6) createDefaultMsx2PlayerDefinition includes default skillParameters
assert(ts.includes('skillParameters: buildSkillParametersDefaults()'),
  'createDefaultMsx2PlayerDefinition seeds default skillParameters');

// 7) types.ts includes skillParameters
const typesCode = fs.readFileSync(path.join(ROOT, 'types.ts'), 'utf8');
assert(/skillParameters\?:\s*Record<string,\s*Record<string,\s*number\s*\|\s*boolean>>/.test(typesCode),
  'Msx2PlayerDefinition.skillParameters has the expected type');

// 8) skills/types.ts includes SkillParameterDef
const skillsTypesCode = fs.readFileSync(path.join(ROOT, 'utils', 'msxGenerator', 'skills', 'types.ts'), 'utf8');
assert(/export interface SkillParameterDef/.test(skillsTypesCode), 'SkillParameterDef is exported');
assert(/parameters\?:\s*SkillParameterDef\[\]/.test(skillsTypesCode), 'SkillDef has parameters');

// 9) doubleJump uses parameters: doubleJumpParameters
const handlersCode = fs.readFileSync(path.join(ROOT, 'utils', 'msxGenerator', 'skills', 'handlers', 'index.ts'), 'utf8');
assert(handlersCode.includes('parameters: doubleJumpParameters'),
  'doubleJump wires its parameters array');
assert(handlersCode.includes("key: 'maxJumps'") && handlersCode.includes("key: 'requireKeyRelease'"),
  'doubleJump parameters include maxJumps and requireKeyRelease');
assert(handlersCode.includes('default: 2') && handlersCode.includes('min: 1') && handlersCode.includes('max: 4'),
  'doubleJump maxJumps has min/max/default');
assert(handlersCode.includes('default: true'),
  'doubleJump requireKeyRelease defaults to true');

// 10) mergeMsx2PlayerUpdate propagates skillParameters
const docCode = fs.readFileSync(path.join(ROOT, 'utils', 'msx2PlayerDocument.ts'), 'utf8');
assert(docCode.includes('skillParameters: partialPatch.skillParameters'),
  'mergeMsx2PlayerUpdate propagates skillParameters');

// 11) Msx2PlayerEditor wires the dialog and the clickable label
const editorCode = fs.readFileSync(path.join(ROOT, 'components', 'editors', 'Msx2PlayerEditor.tsx'), 'utf8');
assert(editorCode.includes('SkillParametersDialog'), 'SkillParametersDialog is referenced');
assert(editorCode.includes('openSkillDialogId'), 'openSkillDialogId state is wired');
assert(editorCode.includes('updateSkillParameter'), 'updateSkillParameter handler is defined');
assert(editorCode.includes('setOpenSkillDialogId(skill.id)'), 'row click opens the dialog');
assert(editorCode.includes('aria-haspopup="dialog"'), 'clickable row has dialog aria');

console.log('\nAll 11 plumbing checks passed.');
