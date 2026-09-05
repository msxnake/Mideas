#!/usr/bin/env node
/**
 * Contract for the authored ENEMY BEHAVIOUR baker (utils/msx2EnemyBehavior.ts).
 *
 * The baked program is walked by a single Z80 interpreter that trusts its data
 * completely: it reads a rule count and executes exactly that many rules, and it
 * indexes the state table by an offset it does not validate. Every check below
 * guards one way that trust can be betrayed on hardware:
 *
 *   - a state whose last rule can FAIL lets the interpreter run off the end of
 *     the block and execute whatever bytes follow as rules;
 *   - a rule pointing at a state that does not exist is a wild jump;
 *   - the state offsets are WORDS precisely because a full 8x8 program passes
 *     255 bytes; a truncated high byte lands the interpreter mid-rule. This
 *     project has shipped that exact bug (word table indexed as bytes) before;
 *   - a jump faster than 8px/tick steps past a 16px ceiling cell between two
 *     probes, so the enemy tunnels through the roof.
 *
 * The baker is transpiled and invoked here, not restated.
 */
import { mkdtempSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const out = join(mkdtempSync(join(tmpdir(), 'mideas-enemy-behavior-')), 'behavior.mjs');
await build({
  entryPoints: [join(repoRoot, 'utils', 'msx2EnemyBehavior.ts')],
  bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'silent',
});
const {
  bakeEnemyBehavior,
  createMsx2EnemyBehavior,
  MSX2_ENEMY_COND,
  MSX2_ENEMY_ACT,
  MSX2_ENEMY_BEHAVIOR_RULE_BYTES,
  MSX2_ENEMY_BEHAVIOR_MAX_STATES,
  MSX2_ENEMY_BEHAVIOR_MAX_RULES,
  MSX2_ENEMY_BEHAVIOR_NEXT_STATE_STAY,
  MSX2_ENEMY_BEHAVIOR_PRESETS,
} = await import(pathToFileURL(out).href);

let failed = 0;
const check = (label, condition) => {
  console.log(`${condition ? 'OK  ' : 'FAIL'}: ${label}`);
  if (!condition) failed++;
};

/** Reads a state block back out of the stream the way the Z80 would. */
const readState = (bytes, stateIndex) => {
  const stateCount = bytes[0];
  if (stateIndex >= stateCount) return null;
  const offset = bytes[1 + stateIndex * 2] | (bytes[2 + stateIndex * 2] << 8);
  const ruleCount = bytes[offset];
  const rules = [];
  for (let i = 0; i < ruleCount; i++) {
    const at = offset + 1 + i * MSX2_ENEMY_BEHAVIOR_RULE_BYTES;
    rules.push({
      condition: bytes[at], conditionArg: bytes[at + 1],
      action: bytes[at + 2], actionArg: bytes[at + 3],
      nextState: bytes[at + 4],
    });
  }
  return { offset, ruleCount, rules };
};

const state = (name, rules) => ({ id: name, name, rules: rules.map((r, i) => ({ id: `r${i}`, ...r })) });
const asset = (states, extra = {}) => ({ id: 'b1', name: 'test', states, ...extra });

// ---- the default asset, i.e. the behaviour Jordi described ------------------
// These assert the SHAPE OF THE STREAM and the behaviour Jordi asked for, not a
// frozen copy of the preset: the preset is allowed to improve. When the Walker
// grew a "Look up" state to stop it pogoing under ceilings (measured on
// hardware, 48 jumps across three columns) the old checks failed for no real
// reason, which is a checker telling you about itself instead of the code.
const preset = bakeEnemyBehavior(createMsx2EnemyBehavior('b0', 'Walker'));
const stateCount = preset.bytes[0];
const states = Array.from({ length: stateCount }, (_v, i) => readState(preset.bytes, i));
check('The default behaviour bakes without errors', preset.errors.length === 0);
check('The default behaviour is a state machine, not a single state', stateCount >= 2);
check('Every state offset points at its own rule-count byte', states.every((s, i) => {
  const expected = i === 0
    ? 1 + stateCount * 2
    : states[i - 1].offset + 1 + states[i - 1].ruleCount * MSX2_ENEMY_BEHAVIOR_RULE_BYTES;
  return s.offset === expected;
}));

// The behaviour Jordi described: senses the ledge, senses the wall, and jumps
// off the back of a ceiling test. WHERE those rules live is the preset's
// business; that they all exist is the contract.
const allRules = states.flatMap(s => s.rules);
const has = (cond) => allRules.some(r => r.condition === cond);
check('The default still senses ledges and walls',
  has(MSX2_ENEMY_COND.NO_FLOOR_AHEAD) && has(MSX2_ENEMY_COND.WALL_AHEAD));
check('The default still decides to jump off a ceiling test', (() => {
  const ceiling = allRules.find(r => r.condition === MSX2_ENEMY_COND.SOLID_ABOVE);
  return Boolean(ceiling) && ceiling.action === MSX2_ENEMY_ACT.JUMP && ceiling.conditionArg >= 1;
})());
check('THE BUG THIS GUARDS: the ceiling test is gated on a timer, so the enemy cannot pogo every tick',
  has(MSX2_ENEMY_COND.TIMER_ELAPSED));
check('Some rule returns to the initial state, so the machine is a loop and not a dead end',
  allRules.some(r => r.nextState === preset.initialState));
check('A rule that does not switch state bakes the STAY sentinel',
  states[0].rules[0].nextState === MSX2_ENEMY_BEHAVIOR_NEXT_STATE_STAY);

// ---- THE failure this guards: falling off the end of a state block ----------
check('Every state of the shipped default ends in a catch-all',
  states.every(s => s.rules[s.rules.length - 1].condition === MSX2_ENEMY_COND.ALWAYS));

// The preset check above only proves the shipped data is well formed. This one
// proves the baker ENFORCES it, which is what stops the interpreter executing
// whatever bytes follow a state whose last condition failed.
const noCatchAll = bakeEnemyBehavior(asset([
  state('Walk', [{ condition: 'WALL_AHEAD', action: 'TURN' }]),
]));
check('THE BUG THIS GUARDS: a state authored without a catch-all gets one appended, so the interpreter cannot run past the block',
  noCatchAll.errors.length === 0
  && readState(noCatchAll.bytes, 0).ruleCount === 2
  && readState(noCatchAll.bytes, 0).rules[1].condition === MSX2_ENEMY_COND.ALWAYS
  && noCatchAll.warnings.some(w => w.includes('catch-all')));

// ---- THE failure this guards: word offsets past 255 -------------------------
const maxed = bakeEnemyBehavior(asset(
  Array.from({ length: MSX2_ENEMY_BEHAVIOR_MAX_STATES }, (_v, s) => state(`s${s}`,
    Array.from({ length: MSX2_ENEMY_BEHAVIOR_MAX_RULES - 1 }, () => ({ condition: 'ON_GROUND', action: 'WALK' }))
      .concat([{ condition: 'ALWAYS', action: 'IDLE' }]))),
));
const lastState = readState(maxed.bytes, MSX2_ENEMY_BEHAVIOR_MAX_STATES - 1);
check('A full-size program really does pass the 255-byte mark', maxed.bytes.length > 255 && lastState.offset > 255);
check('THE BUG THIS GUARDS: offsets past 255 survive as little-endian words instead of truncating',
  maxed.bytes[1 + (MSX2_ENEMY_BEHAVIOR_MAX_STATES - 1) * 2] === (lastState.offset & 0xff)
  && maxed.bytes[2 + (MSX2_ENEMY_BEHAVIOR_MAX_STATES - 1) * 2] === (lastState.offset >> 8)
  && lastState.ruleCount === MSX2_ENEMY_BEHAVIOR_MAX_RULES);
check('Every state block in a full-size program is reachable and well formed',
  Array.from({ length: MSX2_ENEMY_BEHAVIOR_MAX_STATES }, (_v, i) => readState(maxed.bytes, i))
    .every(s => s && s.ruleCount === MSX2_ENEMY_BEHAVIOR_MAX_RULES
      && s.rules[s.ruleCount - 1].condition === MSX2_ENEMY_COND.ALWAYS));

// ---- THE failure this guards: a jump to a state that does not exist ---------
const dangling = bakeEnemyBehavior(asset([
  state('Walk', [{ condition: 'ALWAYS', action: 'WALK', nextState: 5 }]),
]));
check('THE BUG THIS GUARDS: a rule pointing at a missing state is an error, not a wild jump',
  dangling.errors.some(e => e.includes('does not exist')));
check('A behaviour with errors collapses to the standing fallback instead of failing the build',
  dangling.bytes[0] === 1
  && readState(dangling.bytes, 0).ruleCount === 1
  && readState(dangling.bytes, 0).rules[0].condition === MSX2_ENEMY_COND.ALWAYS
  && readState(dangling.bytes, 0).rules[0].action === MSX2_ENEMY_ACT.IDLE
  && readState(dangling.bytes, 0).rules[0].nextState === MSX2_ENEMY_BEHAVIOR_NEXT_STATE_STAY);

// ---- argument ranges --------------------------------------------------------
const fastJump = bakeEnemyBehavior(asset([
  state('Walk', [{ condition: 'ALWAYS', action: 'JUMP', actionArg: 99 }]),
]));
check('THE BUG THIS GUARDS: a jump fast enough to tunnel through a 16px ceiling is clamped to 8px/tick',
  readState(fastJump.bytes, 0).rules[0].actionArg === 8
  && fastJump.warnings.some(w => w.includes('JUMP')));

const deepProbe = bakeEnemyBehavior(asset([
  state('Walk', [{ condition: 'SOLID_ABOVE', conditionArg: 40, action: 'IDLE' }, { condition: 'ALWAYS', action: 'WALK' }]),
]));
check('A ceiling probe deeper than the 12-cell room is clamped to 11 tiles',
  readState(deepProbe.bytes, 0).rules[0].conditionArg === 11);

const zeroProbe = bakeEnemyBehavior(asset([
  state('Walk', [{ condition: 'SOLID_ABOVE', conditionArg: 0, action: 'IDLE' }, { condition: 'ALWAYS', action: 'WALK' }]),
]));
check('A zero-tile ceiling probe becomes 1 tile, not a probe into the body itself',
  readState(zeroProbe.bytes, 0).rules[0].conditionArg === 1);

const noArg = bakeEnemyBehavior(asset([
  state('Walk', [{ condition: 'ON_GROUND', conditionArg: 77, action: 'WALK', actionArg: 77 }, { condition: 'ALWAYS', action: 'IDLE' }]),
]));
check('Conditions and actions that take no argument bake a 0, whatever the editor left behind',
  readState(noArg.bytes, 0).rules[0].conditionArg === 0 && readState(noArg.bytes, 0).rules[0].actionArg === 0);

// ---- rejected and reserved --------------------------------------------------
const unknown = bakeEnemyBehavior(asset([
  state('Walk', [{ condition: 'TELEPORT_TO_PLAYER', action: 'WALK' }]),
]));
check('An unknown condition is an error and never reaches the stream',
  unknown.errors.some(e => e.includes('unknown condition')) && unknown.bytes[0] === 1);

const firing = bakeEnemyBehavior(asset([
  state('Walk', [{ condition: 'ALWAYS', action: 'FIRE', actionArg: 1 }]),
]));
check('FIRE bakes, and warns about the cadence trap: with no cooldown byte, a lone firing state shoots every tick',
  firing.errors.length === 0 && firing.warnings.some(w => w.includes('FIRE') && w.includes('TIMER_ELAPSED')));
check('THE BUG THIS GUARDS: the bake reports FIRE in usedActions, which is what makes the generator emit the pool',
  firing.usedActions.includes(MSX2_ENEMY_ACT.FIRE));
// An argument byte that happens to hold 9 is not a FIRE. Scanning for opcode
// values instead of walking the stream would report this program as firing.
const notFiring = bakeEnemyBehavior(asset([
  state('Walk', [{ condition: 'TIMER_ELAPSED', conditionArg: MSX2_ENEMY_ACT.FIRE, action: 'WALK', actionArg: MSX2_ENEMY_ACT.FIRE }]),
]));
check('THE BUG THIS GUARDS: an argument byte holding the FIRE opcode value is not mistaken for a FIRE',
  !notFiring.usedActions.includes(MSX2_ENEMY_ACT.FIRE));

// ---- ceilings and empties ---------------------------------------------------
const tooMany = bakeEnemyBehavior(asset(
  Array.from({ length: MSX2_ENEMY_BEHAVIOR_MAX_STATES + 3 }, (_v, s) =>
    state(`s${s}`, [{ condition: 'ALWAYS', action: 'IDLE' }])),
));
check('States past the ceiling are dropped with a warning, not silently baked',
  tooMany.bytes[0] === MSX2_ENEMY_BEHAVIOR_MAX_STATES && tooMany.warnings.some(w => w.includes('states authored')));

const overRuled = bakeEnemyBehavior(asset([
  state('Walk', Array.from({ length: MSX2_ENEMY_BEHAVIOR_MAX_RULES + 4 }, () => ({ condition: 'ON_GROUND', action: 'WALK' }))),
]));
check('Rules past the ceiling are dropped and the block still ends in a catch-all',
  readState(overRuled.bytes, 0).ruleCount === MSX2_ENEMY_BEHAVIOR_MAX_RULES
  && readState(overRuled.bytes, 0).rules[MSX2_ENEMY_BEHAVIOR_MAX_RULES - 1].condition === MSX2_ENEMY_COND.ALWAYS);

const empty = bakeEnemyBehavior(undefined);
check('A missing behaviour bakes the standing fallback and says so',
  empty.errors.length > 0 && empty.bytes[0] === 1 && readState(empty.bytes, 0).ruleCount === 1);

const badInitial = bakeEnemyBehavior(asset([state('Walk', [{ condition: 'ALWAYS', action: 'WALK' }])], { initialState: 4 }));
check('An initial state that does not exist is clamped to one that does',
  badInitial.initialState === 0 && badInitial.warnings.some(w => w.includes('initial state')));

// ---- the shipped presets ----------------------------------------------------
// Every preset is one click away in the editor, so a broken one ships straight
// into somebody's ROM. Until this ran, only 'walker' was ever baked here and the
// others were taken on trust.
for (const preset of MSX2_ENEMY_BEHAVIOR_PRESETS) {
  // The asset is FLAT, not wrapped in a `data` field. Going through the same
  // factory the editor uses means this cannot drift from the real path.
  const built = preset.build();
  const baked = bakeEnemyBehavior(createMsx2EnemyBehavior(preset.key, preset.label, preset.key));
  check(`Preset "${preset.key}" bakes with no errors`, baked.errors.length === 0);
  const states = built.states.length;
  let wellFormed = baked.bytes[0] === states && baked.initialState < states;
  for (let index = 0; index < states && wellFormed; index += 1) {
    const block = readState(baked.bytes, index);
    // The catch-all is what stops the interpreter running off the block, and a
    // nextState past the end of the table is a wild jump.
    if (block.rules[block.ruleCount - 1].condition !== MSX2_ENEMY_COND.ALWAYS) wellFormed = false;
    for (const item of block.rules) {
      if (item.nextState !== MSX2_ENEMY_BEHAVIOR_NEXT_STATE_STAY && item.nextState >= states) wellFormed = false;
    }
  }
  check(`Preset "${preset.key}": every state ends in a catch-all and every jump lands inside the table`, wellFormed);
}

// Imported data must not renumber states or admit Object.prototype as opcodes.
for (const malformedStates of [{}, [null, state('live', [{ condition: 'ALWAYS', action: 'WALK', nextState: 0 }])], [state('live', [{ condition: 'ALWAYS', action: 'WALK' }]), { id: 'broken' }]]) {
  let result;
  try { result = bakeEnemyBehavior(asset(malformedStates)); } catch { /* asserted below */ }
  check('Malformed states produce a diagnostic and a standing fallback without throwing',
    Boolean(result?.errors.length) && readState(result.bytes, 0).rules[0].action === MSX2_ENEMY_ACT.IDLE);
}
for (const badRule of [
  { condition: 'constructor', action: 'WALK' },
  { condition: 'ALWAYS', action: 'toString' },
]) {
  const result = bakeEnemyBehavior(asset([state('bad opcode', [badRule])]));
  check('Inherited object properties cannot become opcodes', result.errors.length > 0
    && result.bytes.every(byte => Number.isInteger(byte) && byte >= 0 && byte <= 255));
}
const shadowed = bakeEnemyBehavior(asset([state('shadowed', [
  { condition: 'ALWAYS', action: 'WALK' },
  { condition: 'PLAYER_BULLET_INCOMING', conditionArg: 12, action: 'FIRE' },
  { condition: 'ALWAYS', action: 'IDLE' },
])]));
check('Unreachable rules do not allocate optional bullet engines or consume program bytes',
  shadowed.errors.length === 0 && shadowed.bytes.length === 9
  && !shadowed.usedActions.includes(MSX2_ENEMY_ACT.FIRE)
  && !shadowed.usedConditions.includes(MSX2_ENEMY_COND.PLAYER_BULLET_INCOMING)
  && shadowed.warnings.some(w => w.includes('unreachable')));

console.log(failed
  ? `\n${failed} enemy-behaviour check(s) failed.`
  : '\nAll enemy-behaviour checks passed.');
process.exit(failed ? 1 : 0);
