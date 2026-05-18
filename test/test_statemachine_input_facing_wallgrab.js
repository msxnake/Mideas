/**
 * Regression checks for StateMachine sprite facing and WallGrab ownership.
 *
 * These checks protect the joc51 left-facing regression:
 * StateMachine CHANGE_SPRITE runs before movement updates facing, so it must
 * refresh input-driven facing itself before directional sprite remap.
 */

import fs from 'fs';

console.log('StateMachine input-facing and WallGrab guard regression test\n');

const source = fs.readFileSync('utils/msxGenerator/generators/stateMachineGenerator.ts', 'utf8');
const typesSource = fs.readFileSync('statemachine.types.ts', 'utf8');

function sectionBetween(text, start, end) {
  const startIndex = text.indexOf(start);
  if (startIndex === -1) {
    throw new Error(`Missing section start: ${start}`);
  }
  const endIndex = text.indexOf(end, startIndex + start.length);
  if (endIndex === -1) {
    throw new Error(`Missing section end after ${start}: ${end}`);
  }
  return text.slice(startIndex, endIndex);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
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

function assertWallGrabGuard(text, label) {
  const active = text.indexOf('entity_wallgrab_active');
  assert(active !== -1, `${label}: missing entity_wallgrab_active`);

  const after = text.slice(active, active + 160);
  assert(after.includes('ld a, (hl)'), `${label}: missing active flag read`);
  assert(after.includes('or a'), `${label}: missing active flag zero check`);
  assert(/j[pr] (?:z|nz),/.test(after), `${label}: missing branch after active check`);
}

try {
  const changeSprite = sectionBetween(source, 'Action_ChangeSprite:', 'Action_PlayAnimation:');

  assertOrdered(changeSprite, [
    'ld hl, entity_wallgrab_active',
    'ld a, (hl)',
    'or a',
    'jr z, .acs_not_wall_grabbing',
  ], 'Action_ChangeSprite WallGrab guard');

  assertOrdered(changeSprite, [
    'pop af                  ; A = Sprite Asset ID',
    'push hl                 ; [stack] guarda &entity_sprite_asset_index[entity]',
    'push af                 ; [stack] guarda Sprite Asset ID durante refresh facing',
    'ld hl, entity_comp_masks',
    'and COMP_MASK_INPUT',
    'ld a, (input_state)',
    'ld hl, entity_facing_dir',
    'ld (hl), a',
    'pop af                  ; A = Sprite Asset ID original',
    'pop hl                  ; HL = &entity_sprite_asset_index[entity]',
  ], 'Action_ChangeSprite input facing refresh');

  for (const label of [
    ['Action_PlayAnimation:', 'Action_SetAnimSpeed:', 'Action_PlayAnimation'],
    ['Action_SetAnimSpeed:', 'Action_ToggleAnim:', 'Action_SetAnimSpeed'],
    ['Action_ToggleAnim:', 'Action_PlaySound:', 'Action_ToggleAnim'],
  ]) {
    const body = sectionBetween(source, label[0], label[1]);
    assertWallGrabGuard(body, `${label[2]} WallGrab guard`);
  }

  const setComponentProperty = sectionBetween(source, '.scp_set_sprite:', '.scp_done:');
  for (const label of [
    '.scp_set_sprite',
    '.scp_set_frame',
    '.scp_set_anim_speed',
    '.scp_set_anim_playing',
  ]) {
    const start = setComponentProperty.indexOf(`${label}:`);
    assert(start !== -1, `Missing ${label}`);
    const nextLabel = setComponentProperty.indexOf('\n.scp_', start + label.length + 1);
    const body = setComponentProperty.slice(start, nextLabel === -1 ? undefined : nextLabel);
    assertOrdered(body, [
      'entity_wallgrab_active',
      'ld a, (hl)',
      'or a',
      'jp nz, .scp_done',
    ], `${label} WallGrab guard`);
  }

  const conditionHandler = sectionBetween(source, 'Condition_IsWallGrabbing:', 'Condition_AnimComplete:');
  assert(typesSource.includes("IS_WALL_GRABBING: 'IS_WALL_GRABBING'"), 'Missing IS_WALL_GRABBING condition type');
  assert(source.includes('[ConditionTypes.IS_WALL_GRABBING]: 17'), 'Missing IS_WALL_GRABBING condition ID');
  assert(source.includes('DW Condition_IsWallGrabbing ; 17'), 'Missing IS_WALL_GRABBING dispatch entry');
  assertOrdered(conditionHandler, [
    'ld hl, entity_wallgrab_active',
    'ld e, b',
    'add hl, de',
    'ld a, (hl)',
    'ld a, 1',
  ], 'Condition_IsWallGrabbing handler');
  assert(source.includes("stripSection(asm, 'Condition_IsWallGrabbing', 'Condition_AnimComplete')"), 'Missing IS_WALL_GRABBING strip section');
  assert(source.includes("patchConditionEntry(asm, 'Condition_IsWallGrabbing')"), 'Missing IS_WALL_GRABBING dispatch patch');

  console.log('OK: CHANGE_SPRITE refreshes input-facing before directional remap.');
  console.log('OK: WallGrab animation guards read the RAM active flag.');
  console.log('OK: IS_WALL_GRABBING condition reads the active WallGrab runtime flag.');
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}
