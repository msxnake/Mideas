import type {
  PT3Instrument,
  PT3Ornament,
  PT3SampleStep,
  SCCInstrument,
} from '../../types';
import type { ParsedPT3Module } from './pt3Parser';

const MAX_INSTRUMENT_ID = 31;
const MAX_ORNAMENT_ID = 15;

export interface PT3AssetImportResult {
  instruments: (PT3Instrument | SCCInstrument)[];
  ornaments: PT3Ornament[];
  importedInstrumentIds: number[];
  importedOrnamentIds: number[];
  skippedSampleIds: number[];
  skippedOrnamentIds: number[];
}

const firstFreeId = (usedIds: Set<number>, maximum: number): number | null => {
  for (let id = 1; id <= maximum; id += 1) {
    if (!usedIds.has(id)) return id;
  }
  return null;
};

const compactModuleName = (parsed: ParsedPT3Module): string => {
  const label = parsed.title.trim() || parsed.author.trim() || 'Imported PT3';
  return label.length > 32 ? `${label.slice(0, 29)}...` : label;
};

const cloneStep = (step: PT3SampleStep): PT3SampleStep => ({
  ...step,
  raw: [...step.raw] as [number, number, number, number],
});

/**
 * Merge PT3 samples and ornaments into an editable Mideas song without
 * changing patterns or replacing any existing asset. Source IDs are retained
 * when possible; collisions are assigned the first free Mideas ID.
 */
export const mergePT3Assets = (
  existingInstruments: readonly (PT3Instrument | SCCInstrument)[],
  existingOrnaments: readonly PT3Ornament[],
  parsed: ParsedPT3Module,
): PT3AssetImportResult => {
  const moduleName = compactModuleName(parsed);
  const usedInstrumentIds = new Set(existingInstruments.map(instrument => instrument.id));
  const usedOrnamentIds = new Set(existingOrnaments.map(ornament => ornament.id));
  const importedInstruments: PT3Instrument[] = [];
  const importedOrnaments: PT3Ornament[] = [];
  const skippedSampleIds: number[] = [];
  const skippedOrnamentIds: number[] = [];
  const sortedInstruments = [...parsed.instruments].sort((a, b) => a.id - b.id);
  const sortedOrnaments = [...parsed.ornaments].sort((a, b) => a.id - b.id);

  // Reserve every still-free source ID first. Otherwise an early collision
  // could consume the native ID of a later sample that did not collide.
  const reservedInstrumentIds = new Set(
    sortedInstruments
      .map(instrument => instrument.id)
      .filter(id => id >= 1 && id <= MAX_INSTRUMENT_ID && !usedInstrumentIds.has(id)),
  );
  const reservedOrnamentIds = new Set(
    sortedOrnaments
      .map(ornament => ornament.id)
      .filter(id => id >= 1 && id <= MAX_ORNAMENT_ID && !usedOrnamentIds.has(id)),
  );
  reservedInstrumentIds.forEach(id => usedInstrumentIds.add(id));
  reservedOrnamentIds.forEach(id => usedOrnamentIds.add(id));

  sortedInstruments
    .forEach((sourceInstrument) => {
      const keepsSourceId = reservedInstrumentIds.delete(sourceInstrument.id);
      const destinationId = keepsSourceId
        ? sourceInstrument.id
        : firstFreeId(usedInstrumentIds, MAX_INSTRUMENT_ID);
      if (destinationId === null) {
        skippedSampleIds.push(sourceInstrument.id);
        return;
      }
      if (!keepsSourceId) usedInstrumentIds.add(destinationId);
      importedInstruments.push({
        ...sourceInstrument,
        id: destinationId,
        name: `S${String(sourceInstrument.id).padStart(2, '0')} · ${moduleName}`,
        chip: 'PSG',
        instrumentMode: 'pt3-sample',
        pt3Sample: sourceInstrument.pt3Sample ? {
          ...sourceInstrument.pt3Sample,
          sourceSampleId: sourceInstrument.pt3Sample.sourceSampleId ?? sourceInstrument.id,
          steps: sourceInstrument.pt3Sample.steps.map(cloneStep),
        } : undefined,
      });
    });

  sortedOrnaments
    .forEach((sourceOrnament) => {
      const keepsSourceId = reservedOrnamentIds.delete(sourceOrnament.id);
      const destinationId = keepsSourceId
        ? sourceOrnament.id
        : firstFreeId(usedOrnamentIds, MAX_ORNAMENT_ID);
      if (destinationId === null) {
        skippedOrnamentIds.push(sourceOrnament.id);
        return;
      }
      if (!keepsSourceId) usedOrnamentIds.add(destinationId);
      importedOrnaments.push({
        ...sourceOrnament,
        id: destinationId,
        name: `O${String(sourceOrnament.id).padStart(2, '0')} · ${moduleName}`,
        data: [...sourceOrnament.data],
      });
    });

  return {
    instruments: [...existingInstruments, ...importedInstruments].sort((a, b) => a.id - b.id),
    ornaments: [...existingOrnaments, ...importedOrnaments].sort((a, b) => a.id - b.id),
    importedInstrumentIds: importedInstruments.map(instrument => instrument.id),
    importedOrnamentIds: importedOrnaments.map(ornament => ornament.id),
    skippedSampleIds,
    skippedOrnamentIds,
  };
};
