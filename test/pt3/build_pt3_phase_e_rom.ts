import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePT3Module } from '../../components/utils/pt3Parser';
import { renderPT3ChannelFrames } from '../../components/utils/pt3PreviewDriver';
import { generateSoundFile } from '../../utils/msxGenerator/generators/soundGenerator';
import { generateVariablesFile } from '../../utils/msxGenerator/generators/variablesGenerator';
import type { PT3Instrument, PT3SampleStep, TrackerSongData } from '../../types';

const root = process.cwd();
const fixturePath = resolve(root, 'public', 'samples', 'pt3', 'kuvo-forgotten-puppet.pt3');
const fixture = readFileSync(fixturePath);
const parsed = parsePT3Module(fixture.buffer.slice(fixture.byteOffset, fixture.byteOffset + fixture.byteLength) as ArrayBuffer);
const sourceKick = parsed.instruments.find(instrument => instrument.id === 4);
if (!sourceKick?.pt3Sample) throw new Error('KUVO sample 4 is required for the Phase-E trace ROM.');

const kick: PT3Instrument = {
  ...sourceKick,
  ayEnvelopeShape: 0x0b,
  pt3Sample: {
    ...sourceKick.pt3Sample,
    steps: sourceKick.pt3Sample.steps.map(step => ({ ...step, raw: [...step.raw] as [number, number, number, number] })),
  },
};

const song: TrackerSongData = {
  id: 'phase-e-golden',
  name: 'Phase E golden',
  soundChip: 'PSG',
  playbackBackend: 'native',
  bpm: 150,
  speed: 6,
  globalVolume: 15,
  patterns: [{
    id: 'p0',
    name: 'Kick',
    numRows: 2,
    rows: [
      { A: { note: 'C-4', instrument: 4, ornament: null, volume: 15 }, B: { note: null, instrument: null, ornament: null, volume: null }, C: { note: null, instrument: null, ornament: null, volume: null } },
      { A: { note: null, instrument: null, ornament: null, volume: null }, B: { note: null, instrument: null, ornament: null, volume: null }, C: { note: null, instrument: null, ornament: null, volume: null } },
    ],
  }],
  order: [0],
  lengthInPatterns: 1,
  restartPosition: 0,
  currentPatternIndexInOrder: 0,
  instruments: [kick],
  ornaments: parsed.ornaments,
  ayNoisePeriod: 10,
  ayHardwareEnvelopePeriod: 0x1234,
};

const analysis = {
  tracks: [song],
  stateMachines: [],
  sprites: [],
  tiles: [],
  screenMaps: [],
  entities: [],
  components: [],
  worldMaps: [],
  fonts: [],
} as any;

const buildTraceAsm = (variablesAsm: string, soundAsm: string): string => `${variablesAsm}

    ORG #4000
    DB "AB"
    DW phase_e_init
    DS 12, 0

; ------------------------------------------------------------
; FUNCTION: phase_e_init
; ------------------------------------------------------------
; PURPOSE: Boot the deterministic native PT3-sample trace fixture.
; INPUT: None
; OUTPUT: Never returns
; DESTROYS: AF, BC, DE, HL
; PRESERVES: IX, IY
; CALLS: init_sound_system, music_play_track, music_update
; SIDE EFFECTS: Programs PSG and advances one music frame per VBlank.
; ------------------------------------------------------------
phase_e_init:
    di
    ld sp, #F380
    call init_sound_system
    xor a
    ld b, 1
    call music_play_track
    ei
    call phase_e_trace_marker
.phase_e_loop:
    halt
    call music_update
    call phase_e_trace_marker
    jp .phase_e_loop

; ------------------------------------------------------------
; FUNCTION: phase_e_trace_marker
; ------------------------------------------------------------
; PURPOSE: Stable OpenMSX breakpoint after each complete AY frame.
; INPUT: None
; OUTPUT: None
; DESTROYS: None
; PRESERVES: AF, BC, DE, HL, IX, IY
; CALLS: None
; SIDE EFFECTS: None
; ------------------------------------------------------------
phase_e_trace_marker:
    ret

${soundAsm}

    DS #C000-$, #FF
`;
const soundAsm = generateSoundFile(analysis);
const variablesAsm = generateVariablesFile(analysis);
const asm = buildTraceAsm(variablesAsm, soundAsm);

const frameCount = 8;
const expected = renderPT3ChannelFrames({
  instruments: [kick],
  ornaments: parsed.ornaments,
  noiseBase: 10,
  envelopePeriodBase: 0x1234,
  envelopeShape: 0,
  frameCount,
  frameInputs: [{ channels: [{ note: 'C-4', instrumentId: 4, volume: 15 }, undefined, undefined] }],
});

const outDir = resolve(root, 'test', 'pt3', 'out');
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'phase_e_golden.asm'), asm);
writeFileSync(resolve(outDir, 'phase_e_expected.json'), JSON.stringify({
  frames: expected.frames.map((frame, index) => ({
    index,
    registers: frame.registers,
    writeRegister13: frame.writeRegister13,
    noiseAddState: frame.noiseAddState,
  })),
}, null, 2));

const step = (overrides: Partial<PT3SampleStep>): PT3SampleStep => ({
  raw: [0, 0, 0, 0],
  volume: 15,
  amplitudeSlide: 0,
  tonePeriodOffset: 0,
  accumulateTone: false,
  toneEnabled: true,
  noiseEnabled: false,
  hardwareEnvelopeEnabled: true,
  noiseOrEnvelopeOffset: 0,
  accumulateNoiseOrEnvelope: true,
  ...overrides,
});
const macroInstrument = (id: number, name: string, steps: PT3SampleStep[]): PT3Instrument => ({
  id,
  name,
  instrumentMode: 'pt3-sample',
  pt3Sample: { loop: 1, steps, envelopeSlideMode: 'corrected-16bit' },
});
const globalInstruments = [
  macroInstrument(1, 'Noise then envelope A', [
    step({ noiseEnabled: true, hardwareEnvelopeEnabled: false, noiseOrEnvelopeOffset: 1 }),
    step({ noiseOrEnvelopeOffset: 3 }),
  ]),
  macroInstrument(2, 'Envelope B', [
    step({ noiseOrEnvelopeOffset: 2 }),
    step({ noiseOrEnvelopeOffset: -1 }),
  ]),
  macroInstrument(3, 'Noise last then envelope C', [
    step({ noiseEnabled: true, hardwareEnvelopeEnabled: false, noiseOrEnvelopeOffset: 7 }),
    step({ noiseOrEnvelopeOffset: 4 }),
  ]),
];
const globalSong: TrackerSongData = {
  ...song,
  id: 'phase-e-global',
  name: 'Phase E global',
  instruments: globalInstruments,
  ornaments: [],
  ayNoisePeriod: 5,
  ayHardwareEnvelopePeriod: 0x0200,
  patterns: [{
    id: 'p0',
    name: 'Global arbitration',
    numRows: 2,
    rows: [
      { A: { note: 'C-4', instrument: 1, ornament: null, volume: 15 }, B: { note: 'E-4', instrument: 2, ornament: null, volume: 15 }, C: { note: 'G-4', instrument: 3, ornament: null, volume: 15 } },
      { A: { note: null, instrument: null, ornament: null, volume: null }, B: { note: null, instrument: null, ornament: null, volume: null }, C: { note: null, instrument: null, ornament: null, volume: null } },
    ],
  }],
};
const globalAnalysis = { ...analysis, tracks: [globalSong] } as any;
const globalFrameCount = 6;
const globalExpected = renderPT3ChannelFrames({
  instruments: globalInstruments,
  noiseBase: 5,
  envelopePeriodBase: 0x0200,
  frameCount: globalFrameCount,
  frameInputs: [{ channels: [
    { note: 'C-4', instrumentId: 1, volume: 15 },
    { note: 'E-4', instrumentId: 2, volume: 15 },
    { note: 'G-4', instrumentId: 3, volume: 15 },
  ] }],
});
writeFileSync(resolve(outDir, 'phase_e_global.asm'), buildTraceAsm(
  generateVariablesFile(globalAnalysis),
  generateSoundFile(globalAnalysis),
));
writeFileSync(resolve(outDir, 'phase_e_global_expected.json'), JSON.stringify({
  frames: globalExpected.frames.map((frame, index) => ({
    index,
    registers: frame.registers,
    writeRegister13: frame.writeRegister13,
    noiseAddState: frame.noiseAddState,
  })),
}, null, 2));

console.log(`PT3 Phase-E trace fixtures generated (${frameCount} real + ${globalFrameCount} arbitration frames).`);
