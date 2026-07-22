import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePT3Module } from '../../components/utils/pt3Parser';
import { generateSoundFile, getSoundBank4Data } from '../../utils/msxGenerator/generators/soundGenerator';
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

// External/source-faithful PT3 playback runs the reference replayer. PTDECOD
// and CHREGS temporarily repurpose SP, so music_update must preserve IFF2 and
// mask interrupts around both normal playback and loop reinitialisation.
const externalSong: TrackerSongData = {
  ...song,
  id: 'phase-d-external',
  name: 'Phase D external',
  playbackBackend: 'external-pt3',
  externalPt3Data: Array.from(fixture),
  externalPt3HasHeader: true,
  externalPt3PlayerId: 'custom',
  patterns: [],
  order: [],
  lengthInPatterns: 0,
  instruments: [],
  ornaments: [],
};
const externalAsm = generateSoundFile({ ...analysis, tracks: [externalSong] } as any);
assert((externalAsm.match(/ld a, i/g) ?? []).length >= 2, 'External PT3 update and loop paths must preserve IFF2 before using the stack-based replayer.');
assert(externalAsm.includes('jp po, .pt3_upd_play_ret'), 'External PT3 playback must not enable interrupts when called from an ISR.');
assert(externalAsm.includes('jp po, .pt3_upd_loop_ret'), 'External PT3 loop restart must restore the caller interrupt state.');
assert(externalAsm.includes('include "mideas-pt3-replayer-glass.asm"'), 'External PT3 must use the canonical include wrapper so stale temp replayers cannot shadow it.');

// MegaROM keeps the replayer in its code overlay and exposes the original PT3
// through two complete, consecutive 8KB data zones at #8000/#A000.
const externalMegaAsm = generateSoundFile({ ...analysis, tracks: [externalSong] } as any, undefined, 'megarom', 'konami');
const externalMegaData = getSoundBank4Data({ ...analysis, tracks: [externalSong] } as any, 'megarom', 'konami');
assert(externalMegaAsm.includes('music_pt3_track_bank_table:'), 'MegaROM PT3 code must emit a mapper-bank table.');
assert(externalMegaAsm.includes('call mapper_set_bank_p2'), 'Konami PT3 must map its first 8KB half at #8000.');
assert(externalMegaAsm.includes('call mapper_set_bank_p3'), 'Konami PT3 must map its second 8KB half at #A000.');
assert(!externalMegaAsm.includes('pt3_track_0_data:'), 'MegaROM sound code must not inline the original PT3 bytes in its 8KB overlay.');
assert(externalMegaData.includes('pt3_track_0_bank_0:'), 'MegaROM data must contain the first PT3 bank.');
assert(externalMegaData.includes('pt3_track_0_bank_1:'), 'MegaROM data must contain the second PT3 bank.');
assert(externalMegaData.includes('DS #13A4, #FF'), 'The final KUVO bank must be padded to a complete 8KB mapper zone.');
assert(variablesAsm.includes('music_pt3_data_bank_0 EQU'), 'variables.asm must allocate the primary source-PT3 bank state.');
assert(variablesAsm.includes('music_pt3_data_bank_1 EQU'), 'variables.asm must allocate the secondary source-PT3 bank state.');
let ascii16Rejected = false;
try {
  generateSoundFile({ ...analysis, tracks: [externalSong] } as any, undefined, 'megarom', 'ascii16');
} catch (error) {
  ascii16Rejected = error instanceof Error && error.message.includes('requires targetFormat="konami"');
}
assert(ascii16Rejected, 'Non-Konami MegaROM PT3 export must fail clearly instead of emitting an unverified ROM.');

const replayerAsm = readFileSync(resolve(process.cwd(), 'server', 'PT3-ROM-alltables-glass.asm'), 'utf8');
assert(/ADD A,A[\s\S]{0,160}SUB #E0[\s\S]{0,160}LD E,A[\s\S]{0,160}LD D,0/.test(replayerAsm), 'PT3 special-command dispatch must remove the #E0 classifier bias and clear D before indexing SPCCOMS.');
const replayerWrapperAsm = readFileSync(resolve(process.cwd(), 'server', 'mideas-pt3-replayer-glass.asm'), 'utf8');
assert(replayerWrapperAsm.includes('include "PT3-ROM-alltables-glass.asm"'), 'Canonical PT3 wrapper must include the maintained replayer source.');

console.log('PT3 phase D ASM generation checks passed.');
