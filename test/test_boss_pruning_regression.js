/**
 * Regression checks for Boss ASM pruning.
 *
 * Boss projects can define many attacks, but generated ASM should only include
 * the attacks referenced by active phase sequences or behavior actions.
 */

import fs from 'fs';

console.log('Boss ASM pruning regression test\n');

const source = fs.readFileSync('utils/msxGenerator/generators/bossesGenerator.ts', 'utf8');
const unifiedSource = fs.readFileSync('utils/msxGenerator/generators/unifiedGenerator.ts', 'utf8');
const builderSource = fs.readFileSync('scripts/build_mideas_unified_rom.py', 'utf8');

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

  const renderData = sectionBetween(source, 'function renderBossDataSections', 'export function generateBossesFile');
  assertOrdered(renderData, [
    'const usedAttackIds = collectUsedBossAttackIds(boss);',
    'const attacks = allAttacks.filter(attack => usedAttackIds.has(attack.id));',
    'const attackIndexById = new Map(attacks.map((attack, index) => [attack.id, index]));',
    'clampByte(attacks.length)',
    '; Boss attack definitions: ${allAttacks.length} defined, ${attacks.length} referenced',
  ], 'renderBossDataSections attack filtering');

  const runtimeStrip = sectionBetween(source, 'function stripUnusedBossAttackRuntime', 'function stripUnusedBossBehaviorRuntime');
  assertOrdered(runtimeStrip, [
    'if (features.usedAttackTypes.size === 1)',
    'const onlyAttackType = [...features.usedAttackTypes][0];',
    'const onlyAttackLabel = BOSS_ATTACK_DRAW_LABELS[onlyAttackType];',
    'jp ${onlyAttackLabel}',
  ], 'stripUnusedBossAttackRuntime single attack dispatcher');
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
  const projectileVelocityStubCount = (runtimeStrip.match(/boss_projectile_select_velocity:\n    ret/g) || []).length;
  assert(
    projectileVelocityStubCount >= 2,
    'Projectile strip stubs must retain boss_projectile_select_velocity as a no-op label'
  );

  assert(source.includes('; Boss attack runtimes included: ${attackTypes}'), 'Missing included attack runtime diagnostic');
  assert(source.includes('; Boss attack runtimes excluded: ${formatBossFeatureList(excludedAttackTypes)}'), 'Missing excluded attack runtime diagnostic');

  const bankSections = sectionBetween(source, 'export function generateBossDataBankSections', 'export function generateBossesFile');
  assertOrdered(bankSections, [
    'runtimeBossEntries.forEach((entry, bankOffset) =>',
    'const physicalBank = firstPhysicalBank + bankOffset;',
    'const orgAddress = 0x4000 + (physicalBank * dataZoneSize);',
    'const endAddress = orgAddress + dataZoneSize;',
    'bankMetadata.push({',
    'bank: physicalBank,',
    'bossId: entry.boss.id ||',
    'freeBytes: Math.max(0, dataZoneSize - bodyBytes),',
    'BOSS DATA BANK ${physicalBank} - ${entry.boss.name}',
    'ds #${endHex} - $, #FF',
    'banks: bankMetadata',
  ], 'generateBossDataBankSections one-bank-per-boss layout');

  assert(unifiedSource.includes('bossDataBanks: bossDataBanks.banks.map'), 'segment_budget.json must expose boss data bank metadata');
  assert(unifiedSource.includes("role: 'boss_data'"), 'Boss data budget entries must be tagged as boss_data');
  assert(unifiedSource.includes("placementReason: 'one boss per mapper data bank'"), 'Boss data budget entries must explain placement policy');
  assert(builderSource.includes('def _validate_segment_budget_boss_data_banks'), 'Builder must validate boss data bank metadata');
  assert(
    builderSource.includes('bossDataBanks must not overlap dataBanks'),
    'Builder must reject boss data banks that overlap asset data banks'
  );
  assert(
    builderSource.includes('bossDataBanks must not overlap codeBanks'),
    'Builder must reject boss data banks that overlap code banks'
  );
  assert(
    builderSource.includes('bossDataBanks reference a bank outside the ROM'),
    'Builder must reject boss data banks outside the final ROM segment count'
  );
  assert(
    builderSource.includes("bossDataBanks={konami8k_artifact_validation['boss_data_bank_count']}"),
    'Konami build summary must report bossDataBanks'
  );
  assert(
    builderSource.includes("bossDataBanks={megarom_mapper_artifact_validation['boss_data_bank_count']}"),
    'Generic MegaROM build summary must report bossDataBanks'
  );

  console.log('OK: Boss attacks are collected only from referenced phase usage.');
  console.log('OK: Boss attack table length is based on referenced attacks.');
  console.log('OK: Unused boss attack runtimes have guarded strip branches.');
  console.log('OK: MegaROM boss data is emitted and reported as one boss per mapper bank.');
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}
