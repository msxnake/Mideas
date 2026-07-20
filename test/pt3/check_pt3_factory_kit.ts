import { decodePT3SampleStep } from '../../components/utils/pt3SampleEngine';
import { renderPT3ChannelFrames } from '../../components/utils/pt3PreviewDriver';
import {
  mergePT3FactoryKit,
  PT3_FACTORY_INSTRUMENTS,
} from '../../utils/audio/pt3FactoryInstruments';
import { generateSoundFile } from '../../utils/msxGenerator/generators/soundGenerator';
import type { PT3Instrument, TrackerSongData } from '../../types';

const assert: (condition: unknown, message: string) => asserts condition = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(PT3_FACTORY_INSTRUMENTS.length === 12, 'Factory kit must expose the twelve reviewed instruments.');
assert(new Set(PT3_FACTORY_INSTRUMENTS.map(instrument => instrument.name)).size === 12, 'Factory names must be unique.');

PT3_FACTORY_INSTRUMENTS.forEach((instrument) => {
  assert(instrument.instrumentMode === 'pt3-sample', `${instrument.name} must use the native PT3 engine.`);
  assert(instrument.pt3Sample && instrument.pt3Sample.steps.length > 0, `${instrument.name} must contain sample steps.`);
  const macro = instrument.pt3Sample;
  assert(macro.loop >= 0 && macro.loop < macro.steps.length, `${instrument.name} has an invalid loop.`);
  macro.steps.forEach((step, index) => {
    assert(step.raw.length === 4, `${instrument.name} step ${index} needs four provenance bytes.`);
    assert(step.volume >= 0 && step.volume <= 15, `${instrument.name} step ${index} has an invalid volume.`);
    const decoded = decodePT3SampleStep(step.raw);
    for (const field of [
      'volume',
      'tonePeriodOffset',
      'accumulateTone',
      'toneEnabled',
      'noiseEnabled',
      'hardwareEnvelopeEnabled',
      'noiseOrEnvelopeOffset',
      'accumulateNoiseOrEnvelope',
    ] as const) {
      assert(decoded[field] === step[field], `${instrument.name} step ${index} raw/${field} mismatch.`);
    }
  });
});

const emptyMerge = mergePT3FactoryKit([]);
assert(emptyMerge.addedInstrumentIds.join(',') === '1,2,3,4,5,6,7,8,9,10,11,12', 'Empty bank must receive IDs 1..12.');
assert(emptyMerge.skippedPresetNames.length === 0, 'Empty bank must fit the complete kit.');
assert(emptyMerge.alreadyPresentPresetNames.length === 0, 'First install must not report existing presets.');
assert(emptyMerge.instruments[0] !== PT3_FACTORY_INSTRUMENTS[0], 'Installed presets must be cloned.');
assert((emptyMerge.instruments[0] as PT3Instrument).pt3Sample?.steps[0] !== PT3_FACTORY_INSTRUMENTS[0].pt3Sample?.steps[0], 'Installed steps must be deep-cloned.');

const secondMerge = mergePT3FactoryKit(emptyMerge.instruments);
assert(secondMerge.addedInstrumentIds.length === 0, 'Factory kit installation must be idempotent.');
assert(secondMerge.alreadyPresentPresetNames.length === 12, 'Second install must recognize every factory preset.');

const occupied: PT3Instrument[] = Array.from({ length: 25 }, (_, index) => ({
  id: index + 1,
  name: `Occupied ${index + 1}`,
  instrumentMode: 'legacy-envelopes',
}));
const partialMerge = mergePT3FactoryKit(occupied);
assert(partialMerge.addedInstrumentIds.join(',') === '26,27,28,29,30,31', 'Partial install must fill only free IDs.');
assert(partialMerge.skippedPresetNames.length === 6, 'Partial install must report the six presets that do not fit.');
assert(partialMerge.instruments.slice(0, 25).every((instrument, index) => instrument === occupied[index]), 'Existing instruments must remain untouched.');

const installed = emptyMerge.instruments as PT3Instrument[];
const byName = (name: string): PT3Instrument => {
  const instrument = installed.find(candidate => candidate.name === name);
  assert(instrument, `Missing factory instrument ${name}.`);
  return instrument;
};

const render = (instrument: PT3Instrument, frameCount: number, note = 'C-3') => renderPT3ChannelFrames({
  instruments: [instrument],
  frameCount,
  noiseBase: 4,
  envelopePeriodBase: 100,
  frameInputs: [{ channels: [{ note, instrumentId: instrument.id, volume: 15 }, undefined, undefined] }],
});

const kick = byName('Mideas Deep Kick');
const kickFrames = render(kick, kick.pt3Sample!.steps.length + 2, 'C-2');
const kickPeriods = kickFrames.frames.slice(0, 8).map(frame => frame.registers[0] | (frame.registers[1] << 8));
assert(kickPeriods.every((period, index) => index === 0 || period >= kickPeriods[index - 1]), 'Deep Kick period must fall monotonically in pitch.');
assert(kickFrames.frames[0].registers[8] > 0 && kickFrames.frames.at(-1)!.registers[8] === 0, 'Deep Kick must decay to silence.');

const snare = byName('Mideas Dry Snare');
const snareFrames = render(snare, 3);
assert((snareFrames.frames[0].registers[7] & 0x09) === 0, 'Dry Snare attack must mix tone and noise.');

const closedHat = byName('Mideas Closed Hat');
const hatFrames = render(closedHat, closedHat.pt3Sample!.steps.length + 1);
assert((hatFrames.frames[0].registers[7] & 0x01) !== 0, 'Closed Hat must mask tone.');
assert((hatFrames.frames[0].registers[7] & 0x08) === 0, 'Closed Hat must enable noise.');
assert(hatFrames.frames.at(-1)!.registers[8] === 0, 'Closed Hat must end silent.');

const bass = byName('Mideas Pluck Bass');
const bassFrames = render(bass, 12, 'C-2');
assert(bassFrames.channelPositions[8][0] === 5, 'Pluck Bass must loop back to sustain step 5.');
assert(bassFrames.frames.slice(8).every(frame => frame.registers[8] > 0), 'Pluck Bass sustain loop must remain audible.');

PT3_FACTORY_INSTRUMENTS.forEach((template) => {
  const instrument = byName(template.name);
  render(instrument, instrument.pt3Sample!.steps.length + 2, instrument.name.includes('Bass') ? 'C-2' : 'C-3');
});

const song: TrackerSongData = {
  id: 'pt3-factory-kit',
  name: 'PT3 Factory Kit',
  soundChip: 'PSG',
  playbackBackend: 'native',
  bpm: 150,
  speed: 6,
  globalVolume: 15,
  patterns: [{
    id: 'p0',
    name: 'Audition',
    numRows: 1,
    rows: [{
      A: { note: 'C-2', instrument: 1, ornament: null, volume: 15 },
      B: { note: null, instrument: null, ornament: null, volume: null },
      C: { note: null, instrument: null, ornament: null, volume: null },
    }],
  }],
  order: [0],
  lengthInPatterns: 1,
  restartPosition: 0,
  currentPatternIndexInOrder: 0,
  instruments: installed,
  ornaments: [],
  ayNoisePeriod: 4,
  ayHardwareEnvelopePeriod: 100,
};
const soundAsm = generateSoundFile({
  tracks: [song],
  stateMachines: [],
  sprites: [],
  tiles: [],
  screenMaps: [],
  entities: [],
  components: [],
  worldMaps: [],
  fonts: [],
} as any);
const serializedMacros = soundAsm.match(/_pt3_steps:/g) ?? [];
assert(serializedMacros.length === 12, `ASM generator serialized ${serializedMacros.length}/12 factory macros.`);
assert(soundAsm.includes('music_update_one_pt3_channel:'), 'Factory song must select the native PT3 ASM runtime.');

console.log('PT3 factory kit checks passed (12 original instruments, Preview + ASM).');
