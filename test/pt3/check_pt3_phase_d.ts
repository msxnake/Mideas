import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePT3Module } from '../../components/utils/pt3Parser';
import { generateSoundFile } from '../../utils/msxGenerator/generators/soundGenerator';
import { generateVariablesFile } from '../../utils/msxGenerator/generators/variablesGenerator';
import type { TrackerSongData } from '../../types';

const assert: (condition: unknown, message: string) => asserts condition = (condition, message) => {
  if (!condition) throw new Error(message);
};

const fixturePath = resolve(process.cwd(), 'public', 'samples', 'pt3', 'kuvo-forgotten-puppet.pt3');
const fixture = readFileSync(fixturePath);
const parsed = parsePT3Module(fixture.buffer.slice(fixture.byteOffset, fixture.byteOffset + fixture.byteLength) as ArrayBuffer);
const kick = parsed.instruments.find(instrument => instrument.id === 4);
assert(kick?.pt3Sample, 'KUVO sample 4 is required for the ASM runtime fixture.');

const song: TrackerSongData = {
  id: 'phase-d-trace',
  name: 'Phase D trace',
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
const soundAsm = generateSoundFile(analysis);
const variablesAsm = generateVariablesFile(analysis);
for (const marker of [
  'MUSIC_INSTRUMENT_PT3_MODE   EQU 18',
  'music_update_one_pt3_channel:',
  'music_pt3_finalize_frame:',
  'music_pt3_volume_table:',
  'music_track_0_Phase_D_trace_inst_4_pt3_steps:',
]) {
  assert(soundAsm.includes(marker), `Generated sound.asm is missing ${marker}`);
}

const descriptor = soundAsm.match(/music_track_0_Phase_D_trace_inst_4:\s*([\s\S]*?)music_track_0_Phase_D_trace_inst_4_pt3_steps:/)?.[1] ?? '';
assert(/DB #01\s*\r?\n\s*DB #12\s*\r?\n\s*DB #11\s*\r?\n\s*DB #00/.test(descriptor), 'PT3 descriptor extension must encode mode=1, length=18, loop=17, legacy envelope mode.');
assert(/DW #1234/.test(soundAsm), 'PT3-native track header must retain the reducer envelope base without legacy scaling.');
assert(soundAsm.includes('or #80'), 'PT3 frames must force the reference replayer mixer high bit.');
assert(variablesAsm.includes('music_pt3_noise_add EQU'), 'variables.asm must allocate persistent PT3 AddToNs state.');
assert(variablesAsm.includes('music_pt3_ch_c_env_acc_hi EQU'), 'variables.asm must allocate the complete per-channel PT3 accumulator state.');

console.log('PT3 phase D ASM generation checks passed.');
