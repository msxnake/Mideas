/**
 * Regression checks for logical Button B / Action 2 in State Machine input.
 */

import fs from 'fs';

const generatorSource = fs.readFileSync('utils/msxGenerator/generators/stateMachineGenerator.ts', 'utf8');
const editorSource = fs.readFileSync('components/editors/statemachine/ConditionBuilder.tsx', 'utf8');
const inputsSource = fs.readFileSync('utils/stateMachineInputs.ts', 'utf8');
const previewSource = fs.readFileSync('components/modals/GameFlowPreviewModal.tsx', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sectionBetween(text, start, end) {
  const startIndex = text.indexOf(start);
  const endIndex = text.indexOf(end, startIndex + start.length);
  assert(startIndex !== -1, `Missing section start: ${start}`);
  assert(endIndex !== -1, `Missing section end: ${end}`);
  return text.slice(startIndex, endIndex);
}

try {
  assert(
    inputsSource.includes("{ value: 'action2', label: 'Button B / Action 2'"),
    'State Machine input selector does not expose Button B / Action 2',
  );
  assert(
    editorSource.includes('stateMachineInputOptions.map(option =>'),
    'State Machine conditions do not consume Player-derived input options',
  );

  assert(generatorSource.includes("'action2': 10"), 'Action 2 is not serialized as key ID 10');
  assert(generatorSource.includes("'buttonb': 10"), 'Button B alias is not serialized as key ID 10');
  assert(generatorSource.includes("'joyb': 10"), 'Joystick Button B alias is not serialized as key ID 10');

  const pressedHandler = sectionBetween(generatorSource, 'Condition_KeyPressed:', 'Condition_KeyReleased:');
  assert(pressedHandler.includes('cp 10'), 'KEY_PRESSED does not dispatch key ID 10');
  assert(pressedHandler.includes('and INPUT_BTN_GRAB'), 'KEY_PRESSED does not read logical Button B');

  const releasedHandler = sectionBetween(generatorSource, 'Condition_KeyReleased:', 'Condition_TimeOut:');
  assert(releasedHandler.includes('cp 10'), 'KEY_RELEASED does not dispatch key ID 10');
  assert(releasedHandler.includes('and INPUT_BTN_GRAB'), 'KEY_RELEASED does not read logical Button B');

  const keyAndMoveHandler = sectionBetween(generatorSource, 'Condition_KeyAndMove:', 'Condition_VariableCompare:');
  assert(keyAndMoveHandler.includes('cp 10'), 'KEY_AND_MOVEMENT does not dispatch key ID 10');
  assert(keyAndMoveHandler.includes('and INPUT_BTN_GRAB'), 'KEY_AND_MOVEMENT does not read logical Button B');

  assert(previewSource.includes('getStateMachineBrowserInputAliases'), 'Preview does not use Player-derived aliases');

  console.log('OK: State Machine exposes logical Button B / Action 2.');
  console.log('OK: State Machine ASM reads INPUT_BTN_GRAB for key ID 10.');
  console.log('OK: Preview recognizes common Button B keyboard bindings.');
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}
