import { decodePT3SampleStep } from '../../components/utils/pt3SampleEngine';
import { renderPT3ChannelFrames } from '../../components/utils/pt3PreviewDriver';
import {
  mergePT3FactoryKit,
  PT3_FACTORY_INSTRUMENTS,
} from '../../utils/audio/pt3FactoryInstruments';
import { buildNativePT3SampleRuntimeAsm, generateSoundFile } from '../../utils/msxGenerator/generators/soundGenerator';
import { buildSccIntegratedMusicBlock } from '../../utils/msxGenerator/generators/sccSoundGenerator';
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

// Regression: the SCREEN 5 PSG+SCC route used to serialize pt3-sample assets
// as legacy envelopes, dropping every per-step tone/noise gate in the ROM.
const dualSnare: PT3Instrument = {
  ...snare,
  ayEnvelopeShape: 9,
  pt3Sample: snare.pt3Sample ? {
    ...snare.pt3Sample,
    steps: snare.pt3Sample.steps.map((step, index) => ({
      ...step,
      hardwareEnvelopeEnabled: index === 0,
    })),
  } : undefined,
};
const dualSong: TrackerSongData = {
  ...song,
  id: 'pt3-factory-kit-dual',
  name: 'PT3 Factory Kit Dual',
  soundChip: 'PSG+SCC',
  sccEnabled: true,
  instruments: [dualSnare, closedHat],
  ornaments: [{ id: 1, name: 'Major chord', data: [0, 4, 7], loopPosition: 0 }],
  patterns: [{
    id: 'p0',
    name: 'Dual audition',
    numRows: 2,
    rows: [
      {
        A: { note: 'C-3', instrument: snare.id, ornament: null, volume: 15 },
        B: { note: '---', instrument: null, ornament: null, volume: null },
        // PT3/Vortex music owns all three PSG channels, including C.
        C: { note: 'C-5', instrument: closedHat.id, ornament: 1, volume: 15 },
      },
      {
        A: { note: '---', instrument: null, ornament: null, volume: null },
        B: { note: 'C-4', instrument: closedHat.id, ornament: null, volume: 15 },
        C: { note: '---', instrument: null, ornament: null, volume: null },
      },
    ],
  }],
};
const dualBuild = buildSccIntegratedMusicBlock([], [dualSong], {
  pt3SampleRuntimeAsm: buildNativePT3SampleRuntimeAsm(),
});
assert((dualBuild.dataAsm.match(/_pt3_steps:/g) ?? []).length === 2, 'Dual PSG+SCC export must serialize native PT3 steps.');
assert(dualBuild.runtimeAsm.includes('music_update_one_pt3_channel:'), 'Dual PSG+SCC export must include the shared native PT3 decoder.');
assert(dualBuild.runtimeAsm.includes('psg_music_update_pt3_channels:'), 'Dual PSG+SCC runtime must dispatch PT3 instruments per frame.');
assert(dualBuild.runtimeAsm.includes('psg_music_arm_pt3_envelope:'), 'Dual PSG+SCC note-on must arm R13 only for PT3 hardware-envelope instruments.');
assert(dualBuild.runtimeAsm.includes('ld (hl), 0\n    ld hl, music_pt3_tone_acc_lo_base'), 'PT3 note-on reset must store literal zero after psg_ch_ptr clobbers AF.');
assert(!dualBuild.runtimeAsm.includes('channel C is exclusively for gameplay SFX'), 'PSG music must not discard channel C cells.');
assert(dualBuild.dataAsm.includes('DB #09          ; +21 PT3 envelope shape'), 'Dual PSG+SCC descriptor must retain the PT3 hardware-envelope shape.');
assert(dualBuild.dataAsm.includes('DB #01          ; +10 bit0: music drives PSG channel C'), 'PT3/Vortex songs must claim PSG channel C.');
assert(dualBuild.dataAsm.includes('_orn_1_data:'), 'PSG export must serialize imported PT3 ornament data.');
assert(dualBuild.runtimeAsm.includes('psg_music_update_ornaments:'), 'PSG runtime must advance ornaments every frame.');
assert(dualBuild.runtimeAsm.includes('call psg_music_update_ornaments'), 'Native PT3 frames must calculate ornament-adjusted notes before stepping samples.');

// A full PT3 commonly exceeds one 8KB mapper bank. Pattern banking must keep
// every row and expose a bank lookup instead of rejecting or truncating it.
const largePatterns = Array.from({ length: 18 }, (_, patternIndex) => ({
  id: `large_${patternIndex}`,
  name: `Large ${patternIndex}`,
  numRows: 64,
  rows: Array.from({ length: 64 }, (_, rowIndex) => ({
    A: { note: rowIndex % 16 === 0 ? 'C-3' : '---', instrument: rowIndex % 16 === 0 ? snare.id : null, ornament: null, volume: null },
    B: { note: rowIndex % 16 === 8 ? 'E-3' : '---', instrument: rowIndex % 16 === 8 ? closedHat.id : null, ornament: null, volume: null },
    C: { note: rowIndex % 16 === 12 ? 'G-3' : '---', instrument: rowIndex % 16 === 12 ? closedHat.id : null, ornament: null, volume: null },
  })),
}));
const largeSong: TrackerSongData = {
  ...song,
  id: 'pt3-large-pattern-banked',
  name: 'PT3 Large Pattern Banked',
  patterns: largePatterns,
  order: largePatterns.map((_, index) => index),
  lengthInPatterns: largePatterns.length,
  instruments: [dualSnare, closedHat],
};
const largeBuild = buildSccIntegratedMusicBlock([], [largeSong], {
  dataBankEquateName: 'TEST_MUSIC_BANK',
  pt3SampleRuntimeAsm: buildNativePT3SampleRuntimeAsm(),
});
assert((largeBuild.dataBankChunks?.length ?? 0) > 1, 'Oversized PT3 music must span multiple 8KB banks.');
assert(largeBuild.dataBankChunks!.every(chunk => chunk.usedBytes <= 8192), 'Every PT3 pattern bank must fit the physical 8KB window.');
assert(largeBuild.runtimeAsm.includes('ld (music_data_bank_cur), a\n    ld (#B000), a           ; map the pattern body'), 'Pattern changes must map their owning bank.');
assert(largeBuild.dataAsm.includes('DB TEST_MUSIC_BANK_1          ; @mideas:pattern-bank'), 'Pattern bank table must reference later music banks.');
assert((largeBuild.dataAsm.match(/_pattern_17_rows:/g) ?? []).length === 1, 'The last pattern body must be emitted exactly once, not truncated or duplicated.');

console.log('PT3 factory kit checks passed (12 original instruments, Preview + PSG and PSG+SCC ASM).');
