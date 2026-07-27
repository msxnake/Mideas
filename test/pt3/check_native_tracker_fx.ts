import {
  applyNativeTrackerChannelEffect,
  applyNativeTrackerGlobalEffect,
  createNativeTrackerChannelEffectState,
  createNativeTrackerGlobalEffectState,
  formatTrackerEffectParams,
  getTrackerEffectValidationMessage,
  parseTrackerEffectParams,
  resolveNativeTrackerRowSpeed,
  sourceEffectToNativeFields,
  stepNativeTrackerChannelEffect,
  stepNativeTrackerGlobalEffect,
} from '../../components/utils/trackerEffects';

const assert: (condition: unknown, message: string) => asserts condition = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(parseTrackerEffectParams('01ff80').join(',') === '1,255,128', 'FX parameter parsing mismatch.');
assert(formatTrackerEffectParams([1, 255, 128]) === '01FF80', 'FX parameter formatting mismatch.');
assert(getTrackerEffectValidationMessage(1, '010100') === null, 'Valid GLISS payload rejected.');
assert(getTrackerEffectValidationMessage(2, '0100000100') === null, 'Valid PORTA payload rejected.');
assert(getTrackerEffectValidationMessage(2, '0100') !== null, 'Truncated PORTA payload must be diagnosed.');

const sourceFields = sourceEffectToNativeFields({
  code: 1,
  name: 'GLISS',
  params: [2, 0x10, 0],
  display: 'GLS 02 +16',
});
assert(sourceFields.effectCommand === 1 && sourceFields.effectParams === '021000', 'Source PT3 FX must materialize byte-exactly.');

let gliss = applyNativeTrackerChannelEffect(
  createNativeTrackerChannelEffectState(),
  1,
  '011000',
  { isNewNote: true, previousPeriod: 1100, targetPeriod: 1000 },
).state;
gliss = stepNativeTrackerChannelEffect(gliss);
assert(gliss.currentPeriod === 1016, `GLISS must add its signed raw period step; received ${gliss.currentPeriod}.`);

let negativeGliss = applyNativeTrackerChannelEffect(
  createNativeTrackerChannelEffectState(),
  1,
  '02F0FF',
  { isNewNote: true, previousPeriod: null, targetPeriod: 1000 },
).state;
negativeGliss = stepNativeTrackerChannelEffect(negativeGliss);
assert(negativeGliss.currentPeriod === 1000, 'GLISS delay must defer the first step.');
negativeGliss = stepNativeTrackerChannelEffect(negativeGliss);
assert(negativeGliss.currentPeriod === 984, 'GLISS must sign-extend a negative 16-bit step.');

let porta = applyNativeTrackerChannelEffect(
  createNativeTrackerChannelEffectState(),
  2,
  '0100000A00',
  { isNewNote: true, previousPeriod: 1000, targetPeriod: 800 },
).state;
for (let tick = 0; tick < 25; tick += 1) porta = stepNativeTrackerChannelEffect(porta);
assert(porta.currentPeriod === 800 && porta.toneMode === 'none', 'PORTA must stop exactly at its target period.');

let gate = applyNativeTrackerChannelEffect(
  createNativeTrackerChannelEffectState(),
  5,
  '0201',
  { isNewNote: true, previousPeriod: null, targetPeriod: 900 },
).state;
gate = stepNativeTrackerChannelEffect(gate);
assert(gate.gateEnabled, 'VIBRATO gate closed too early.');
gate = stepNativeTrackerChannelEffect(gate);
assert(!gate.gateEnabled, 'VIBRATO must toggle off after its on-duration.');
gate = stepNativeTrackerChannelEffect(gate);
assert(gate.gateEnabled, 'VIBRATO must toggle back on after its off-duration.');

const positions = applyNativeTrackerChannelEffect(
  createNativeTrackerChannelEffectState(),
  3,
  '0C',
  { isNewNote: false, previousPeriod: null, targetPeriod: null },
);
assert(positions.samplePosition === 12, 'SAMPLE_POS command mismatch.');
const ornamentPosition = applyNativeTrackerChannelEffect(
  createNativeTrackerChannelEffectState(),
  4,
  '07',
  { isNewNote: false, previousPeriod: null, targetPeriod: null },
);
assert(ornamentPosition.ornamentPosition === 7, 'ORNAMENT_POS command mismatch.');

let envelope = applyNativeTrackerGlobalEffect(createNativeTrackerGlobalEffectState(6), 8, '020300');
envelope = stepNativeTrackerGlobalEffect(envelope);
assert(envelope.envelopeSlideOffset === 0, 'Envelope slide delay applied too early.');
envelope = stepNativeTrackerGlobalEffect(envelope);
assert(envelope.envelopeSlideOffset === 3, 'Envelope slide step mismatch.');

assert(resolveNativeTrackerRowSpeed([
  { effectCommand: 9, effectParams: '04' },
  { effectCommand: null, effectParams: null },
  { effectCommand: 9, effectParams: '07' },
], 6) === 7, 'Last SPEED command in channel order must win.');

console.log('Native tracker Vortex FX checks passed.');
