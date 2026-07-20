import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { PT3Instrument, PT3Ornament, SCCInstrument } from '../../types';
import { mergePT3Assets } from '../../components/utils/pt3InstrumentImport';
import { parsePT3Module } from '../../components/utils/pt3Parser';

const assert: (condition: unknown, message: string) => asserts condition = (condition, message) => {
  if (!condition) throw new Error(message);
};

const fixturePath = resolve(process.cwd(), 'public', 'samples', 'pt3', 'kuvo-forgotten-puppet.pt3');
const fixture = readFileSync(fixturePath);
const parsed = parsePT3Module(fixture.buffer.slice(fixture.byteOffset, fixture.byteOffset + fixture.byteLength) as ArrayBuffer);

const cleanImport = mergePT3Assets([], [], parsed);
assert(cleanImport.importedInstrumentIds.length === parsed.instruments.length, 'Every parsed PT3 sample must be imported when capacity is available.');
assert(cleanImport.importedOrnamentIds.length === parsed.ornaments.length, 'Every parsed PT3 ornament must be imported when capacity is available.');
assert(cleanImport.importedInstrumentIds.join(',') === parsed.instruments.map(instrument => instrument.id).join(','), 'Free source sample IDs must be retained.');
assert(cleanImport.importedOrnamentIds.join(',') === parsed.ornaments.map(ornament => ornament.id).join(','), 'Free source ornament IDs must be retained.');
assert(cleanImport.instruments.every(instrument => instrument.chip === 'PSG'), 'Extracted samples must explicitly target PSG.');

const importedKick = cleanImport.instruments.find(instrument => instrument.id === 4) as PT3Instrument | undefined;
const sourceKick = parsed.instruments.find(instrument => instrument.id === 4);
assert(importedKick?.pt3Sample && sourceKick?.pt3Sample, 'KUVO kick sample 4 must survive extraction.');
assert(importedKick.pt3Sample !== sourceKick.pt3Sample, 'Imported sample macros must not alias parser output.');
assert(importedKick.pt3Sample.steps[0] !== sourceKick.pt3Sample.steps[0], 'Imported sample steps must be cloned.');
assert(importedKick.pt3Sample.sourceSampleId === 4, 'Reassigned assets must retain the original PT3 sample ID as provenance.');

const existingPSG: PT3Instrument = { id: 1, name: 'Existing PSG', volumeEnvelope: [15] };
const existingSCC: SCCInstrument = { id: 4, name: 'Existing SCC', chip: 'SCC', waveform: Array(32).fill(0) };
const existingOrnament: PT3Ornament = { id: 1, name: 'Existing ornament', data: [0] };
const collisionImport = mergePT3Assets([existingPSG, existingSCC], [existingOrnament], parsed);
assert(collisionImport.instruments.includes(existingPSG) && collisionImport.instruments.includes(existingSCC), 'Existing instruments must remain untouched.');
assert(collisionImport.ornaments.includes(existingOrnament), 'Existing ornaments must remain untouched.');
assert(new Set(collisionImport.instruments.map(instrument => instrument.id)).size === collisionImport.instruments.length, 'Instrument IDs must remain unique across PSG and SCC assets.');
assert(new Set(collisionImport.ornaments.map(ornament => ornament.id)).size === collisionImport.ornaments.length, 'Ornament IDs must remain unique.');
const remappedKick = collisionImport.instruments.find(instrument =>
  (instrument as PT3Instrument).pt3Sample?.sourceSampleId === 4
) as PT3Instrument | undefined;
assert(remappedKick && remappedKick.id !== 4, 'A PT3 source ID occupied by SCC must be remapped.');
assert(remappedKick.pt3Sample?.sourceSampleId === 4, 'Remapping must not lose PT3 provenance.');

const partiallyOccupied: PT3Instrument[] = [1, 2, 5, 6, 7].map(id => ({
  id,
  name: `Existing ${id}`,
  volumeEnvelope: [15],
}));
const preservationImport = mergePT3Assets(partiallyOccupied, [], parsed);
const preservedKick = preservationImport.instruments.find(instrument =>
  (instrument as PT3Instrument).pt3Sample?.sourceSampleId === 4
) as PT3Instrument | undefined;
assert(preservedKick?.id === 4, 'Earlier collisions must not consume a later sample\'s free source ID.');

const fullInstruments: PT3Instrument[] = Array.from({ length: 31 }, (_, index) => ({
  id: index + 1,
  name: `Existing ${index + 1}`,
  volumeEnvelope: [15],
}));
const fullOrnaments: PT3Ornament[] = Array.from({ length: 15 }, (_, index) => ({
  id: index + 1,
  name: `Existing ornament ${index + 1}`,
  data: [0],
}));
const fullImport = mergePT3Assets(fullInstruments, fullOrnaments, parsed);
assert(fullImport.instruments.length === 31 && fullImport.skippedSampleIds.length === parsed.instruments.length, 'Full instrument banks must report every skipped PT3 sample.');
assert(fullImport.ornaments.length === 15 && fullImport.skippedOrnamentIds.length === parsed.ornaments.length, 'Full ornament banks must report every skipped PT3 ornament.');

console.log(`PT3 instrument extraction checks passed (${cleanImport.importedInstrumentIds.length} samples, ${cleanImport.importedOrnamentIds.length} ornaments).`);
