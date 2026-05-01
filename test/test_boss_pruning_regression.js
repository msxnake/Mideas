/**
 * Regression checks for Boss ASM pruning.
 *
 * Boss projects can define many attacks, but generated ASM should only include
 * the attacks referenced by active phase sequences or behavior actions.
 */

import fs from 'fs';

console.log('Boss ASM pruning regression test\n');

const source = fs.readFileSync('utils/msxGenerator/generators/bossesGenerator.ts', 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function sectionBetween(text, start, end) {
  const startIndex = text.indexOf(start);
  assert(startIndex !== -1, `Missing section start: ${start}`);
  const endIndex = text.indexOf(end, startIndex + start.length);
  assert(endIndex !== -1, `Missing section end after ${start}: ${end}`);
  return text.slice(startIndex, endIndex);
}

function assertOrdered(text, tokens, label) {
  let cursor = -1;
  for (const token of tokens) {
    const index = text.indexOf(token, cursor + 1);
    assert(index !== -1, `${label}: missing token "${token}"`);
    assert(index > cursor, `${label}: token out of order "${token}"`);
    cursor = index;
  }
}

try {
  const collectUsed = sectionBetween(source, 'function collectUsedBossAttackIds', 'function collectBossFeatureSet');
  assertOrdered(collectUsed, [
    '(phase.attackSequence || []).forEach(attackId =>',
    'usedAttackIds.add(attackId);',
    "(phase.behaviorLoop || []).forEach(action =>",
    "if (action.type === 'attack' && action.attackId)",
    'usedAttackIds.add(action.attackId);',
  ], 'collectUsedBossAttackIds');

  const generateStart = source.indexOf('export function generateBossesFile');
  assert(generateStart !== -1, 'Missing generateBossesFile export');
  const generateBosses = source.slice(generateStart);
  assertOrdered(generateBosses, [
    'const usedAttackIds = collectUsedBossAttackIds(boss);',
    'const attacks = allAttacks.filter(attack => usedAttackIds.has(attack.id));',
    'const attackIndexById = new Map(attacks.map((attack, index) => [attack.id, index]));',
    'clampByte(attacks.length)',
    '; Boss attack definitions: ${allAttacks.length} defined, ${attacks.length} referenced',
  ], 'generateBossesFile attack filtering');

  const runtimeStrip = sectionBetween(source, 'function stripUnusedBossAttackRuntime', 'function stripUnusedBossBehaviorRuntime');
  for (const attackType of [
    'Projectile',
    'SlamRocks',
    'FallingBlocks',
    'Meteor',
    'Bomb',
    'Boomerang',
    'Rock',
    'SineWave',
    'HomingMissile',
    'Laser',
  ]) {
    assert(
      runtimeStrip.includes(`if (!usesBossAttack(features, '${attackType}'))`),
      `Missing runtime strip branch for ${attackType}`
    );
  }

  assert(source.includes('; Boss attack runtimes included: ${attackTypes}'), 'Missing included attack runtime diagnostic');
  assert(source.includes('; Boss attack runtimes excluded: ${formatBossFeatureList(excludedAttackTypes)}'), 'Missing excluded attack runtime diagnostic');

  console.log('OK: Boss attacks are collected only from referenced phase usage.');
  console.log('OK: Boss attack table length is based on referenced attacks.');
  console.log('OK: Unused boss attack runtimes have guarded strip branches.');
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}
