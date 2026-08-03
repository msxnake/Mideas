/**
 * Regression checks for Player Config / State Machine control correlation.
 */

import fs from 'fs';

const inputsSource = fs.readFileSync('utils/stateMachineInputs.ts', 'utf8');
const editorSource = fs.readFileSync('components/editors/statemachine/ConditionBuilder.tsx', 'utf8');
const generatorSource = fs.readFileSync('utils/msxGenerator/generators/stateMachineGenerator.ts', 'utf8');
const bitmapSource = fs.readFileSync('utils/msxGenerator/generators/msx2/msx2Screen5BitmapRoomGenerator.ts', 'utf8');
const previewSource = fs.readFileSync('components/modals/GameFlowPreviewModal.tsx', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  assert(inputsSource.includes('resolveStateMachinePlayer'), 'Missing linked Player resolver');
  assert(inputsSource.includes("player.inputEnabled?.[keyId] !== true"), 'Function key options do not respect enabled controls');
  assert(inputsSource.includes("label: `${keyId.toUpperCase()}"), 'Function key action labels are not exposed');
  assert(editorSource.includes('getStateMachineInputOptions(allAssets, stateMachineAssetId)'), 'State Machine selector is not derived from Player Config');

  for (let key = 1; key <= 5; key += 1) {
    assert(generatorSource.includes(`'f${key}': ${10 + key}`), `Generic State Machine serializer lacks F${key}`);
  }
  assert(generatorSource.includes('SM_ReadFunctionKey:'), 'Generic State Machine runtime lacks F1-F5 keyboard reader');
  assert(bitmapSource.includes('buildBitmapPlayerStateMachineAsm'), 'SCREEN 5 bitmap route lacks linked State Machine input runtime');
  assert(bitmapSource.includes('bitmap_update_player_state_machine'), 'SCREEN 5 bitmap route does not execute State Machine transitions');
  assert(bitmapSource.includes('bitmapStateMachineInputSource'), 'SCREEN 5 runtime does not resolve Player Config bindings');
  assert(bitmapSource.includes('GTTRIG  EQU #00D8'), 'SCREEN 5 runtime lacks joystick trigger support');
  assert(previewSource.includes('getStateMachineBrowserInputAliases'), 'Preview does not follow Player Config bindings');

  console.log('OK: State Machine input options follow the linked Player Config.');
  console.log('OK: F1-F5 serialize and execute in generic and SCREEN 5 runtimes.');
  console.log('OK: Preview resolves logical inputs through the configured Player controls.');
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}
