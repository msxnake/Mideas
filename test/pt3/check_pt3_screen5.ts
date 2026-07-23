import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { analyzeProject } from '../../utils/asmTemplateGenerator';
import { generateMsx2Screen5BitmapRoomFiles } from '../../utils/msxGenerator/generators/msx2/msx2Screen5BitmapRoomGenerator';
import { parsePT3Module } from '../../components/utils/pt3Parser';
import { rewritePT3PatternNoteStreams } from '../../components/utils/pt3SourceEditor';
import type { ProjectAsset, TrackerSongData } from '../../types';

const assert: (condition: unknown, message: string) => asserts condition = (condition, message) => {
  if (!condition) throw new Error(message);
};

const project = JSON.parse(readFileSync(resolve(process.cwd(), 'test', 'msx2-walljumper', 'walljumper_smoke.json'), 'utf8'));
const fixture = readFileSync(resolve(process.cwd(), 'public', 'samples', 'pt3', 'kuvo-forgotten-puppet.pt3'));
const fixtureBytes = new Uint8Array(fixture.buffer, fixture.byteOffset, fixture.byteLength);
const parsedFixture = parsePT3Module(fixtureBytes.slice().buffer);
const editedPatterns = parsedFixture.patterns.map((pattern, patternIndex) => patternIndex === parsedFixture.order[0]
  ? {
    ...pattern,
    rows: pattern.rows.map((row, rowIndex) => rowIndex === 1
      ? { ...row, A: { ...row.A, note: 'D-2' } }
      : row),
  }
  : pattern);
const editedFixture = rewritePT3PatternNoteStreams(fixtureBytes, editedPatterns);
const trackId = 'screen5-source-pt3';
const track: TrackerSongData = {
  id: trackId,
  name: 'SCREEN 5 source PT3',
  title: 'SCREEN 5 source PT3',
  author: 'regression',
  playbackBackend: 'external-pt3',
  externalPt3Data: Array.from(editedFixture),
  externalPt3HasHeader: true,
  externalPt3PlayerId: 'custom',
  soundChip: 'PSG',
  bpm: 125,
  speed: editedFixture[100] || 6,
  globalVolume: 15,
  patterns: [],
  order: [],
  lengthInPatterns: 0,
  restartPosition: 0,
  instruments: [],
  ornaments: [],
  currentPatternIndexInOrder: 0,
};
const assets: ProjectAsset[] = [
  ...(project.assets as ProjectAsset[]),
  { id: trackId, name: track.name, type: 'track', data: track } as ProjectAsset,
];
const analysis = analyzeProject(project.name, assets);
const files = generateMsx2Screen5BitmapRoomFiles(project.name, analysis, {
  screenMode: 'SCREEN 4 (Graphics II)',
  romMode: 'megarom',
  targetFormat: 'konami',
  autoMegaROM: true,
});
const asm = files['unitedFiles.asm'];

assert(asm.includes('; PT3 MUSIC BACKEND'), 'SCREEN 5 must emit the source-faithful PT3 runtime.');
assert(asm.includes('call PT3_INIT') && asm.includes('call PT3_PLAY') && asm.includes('call PT3_ROUT'), 'SCREEN 5 must call the reference PT3 player.');
assert(asm.includes('BITMAP_MUSIC_DATA_BANK_0 EQU') && asm.includes('BITMAP_MUSIC_DATA_BANK_1 EQU'), 'A source PT3 must reserve both 8KB mapper halves.');
assert(asm.includes('pt3_track_0_bank_0:') && asm.includes('pt3_track_0_bank_1:'), 'The original PT3 bytes must be emitted in banked SCREEN 5 data.');
assert(asm.includes('ld a, (music_pt3_data_bank_0)') && asm.includes('call mapper_set_bank_p2'), 'PT3 half 0 must be mapped into #8000.');
assert(asm.includes('ld a, (music_pt3_data_bank_1)') && asm.includes('call mapper_set_bank_p3'), 'PT3 half 1 must be mapped into #A000.');
assert(asm.includes('call music_update'), 'The SCREEN 5 main loop must tick PT3 every video frame.');
assert(asm.includes('call music_play_track    ; no Music node in the flow: autoplay track 0 (loop)'), 'A SCREEN 5 project without a Music node must autoplay its only PT3 track.');
assert(editedFixture.length > fixture.length, 'SCREEN 5 regression must exercise a canonical PT3 produced by Mideas note editing.');

console.log('PT3 SCREEN 5 source backend checks passed.');
