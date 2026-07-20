import type { PT3Instrument, PT3SampleStep, SCCInstrument } from '../../types';

const MAX_INSTRUMENT_ID = 31;

interface FactoryStepOptions {
  volume: number;
  tonePeriodOffset?: number;
  toneEnabled?: boolean;
  noiseEnabled?: boolean;
  hardwareEnvelopeEnabled?: boolean;
  noiseOrEnvelopeOffset?: number;
  accumulateTone?: boolean;
  accumulateNoiseOrEnvelope?: boolean;
}

const clamp = (value: number, minimum: number, maximum: number): number => (
  Math.max(minimum, Math.min(maximum, Math.trunc(value)))
);

/**
 * Build a self-consistent synthetic PT3 line. Factory instruments are authored
 * in Mideas, so `raw` is provenance/debug data rather than copied module data.
 */
const factoryStep = ({
  volume,
  tonePeriodOffset = 0,
  toneEnabled = true,
  noiseEnabled = false,
  hardwareEnvelopeEnabled = false,
  noiseOrEnvelopeOffset = 0,
  accumulateTone = false,
  accumulateNoiseOrEnvelope = false,
}: FactoryStepOptions): PT3SampleStep => {
  const normalizedVolume = clamp(volume, 0, 15);
  const normalizedTone = clamp(tonePeriodOffset, -0x8000, 0x7fff);
  const normalizedGlobal = noiseEnabled
    ? clamp(noiseOrEnvelopeOffset, 0, 15)
    : clamp(noiseOrEnvelopeOffset, 0, 15);
  const toneWord = normalizedTone & 0xffff;
  const c = ((normalizedGlobal & 0x7f) << 1) | (hardwareEnvelopeEnabled ? 0 : 1);
  const b = normalizedVolume
    | (accumulateTone ? 0x40 : 0)
    | (toneEnabled ? 0 : 0x10)
    | (noiseEnabled ? 0 : 0x80)
    | (accumulateNoiseOrEnvelope ? 0x20 : 0);

  return {
    raw: [c & 0xff, b & 0xff, toneWord & 0xff, (toneWord >>> 8) & 0xff],
    volume: normalizedVolume,
    amplitudeSlide: 0,
    tonePeriodOffset: normalizedTone,
    accumulateTone,
    toneEnabled,
    noiseEnabled,
    hardwareEnvelopeEnabled,
    noiseOrEnvelopeOffset: normalizedGlobal,
    accumulateNoiseOrEnvelope,
  };
};

const silentStep = (): PT3SampleStep => factoryStep({
  volume: 0,
  toneEnabled: false,
  noiseEnabled: false,
});

const factoryInstrument = (
  name: string,
  steps: PT3SampleStep[],
  loop = steps.length - 1,
  options: Pick<PT3Instrument, 'ayEnvelopeShape' | 'hardwareEnvelopePeriod'> = {},
): PT3Instrument => ({
  id: 0,
  name,
  chip: 'PSG',
  instrumentMode: 'pt3-sample',
  pt3Sample: {
    loop,
    envelopeSlideMode: 'corrected-16bit',
    steps,
  },
  ...options,
});

/**
 * Original, redistributable PT3 sample programs designed for Mideas. These do
 * not contain sample lines copied from commercial or third-party modules.
 */
export const PT3_FACTORY_INSTRUMENTS: readonly PT3Instrument[] = [
  factoryInstrument('Mideas Deep Kick', [
    factoryStep({ volume: 15, tonePeriodOffset: 0, noiseEnabled: true, noiseOrEnvelopeOffset: 0 }),
    factoryStep({ volume: 15, tonePeriodOffset: 150, noiseEnabled: true, noiseOrEnvelopeOffset: 2 }),
    factoryStep({ volume: 14, tonePeriodOffset: 320, noiseEnabled: true, noiseOrEnvelopeOffset: 5 }),
    factoryStep({ volume: 12, tonePeriodOffset: 480 }),
    factoryStep({ volume: 10, tonePeriodOffset: 620 }),
    factoryStep({ volume: 7, tonePeriodOffset: 720 }),
    factoryStep({ volume: 4, tonePeriodOffset: 780 }),
    factoryStep({ volume: 2, tonePeriodOffset: 820 }),
    silentStep(),
  ]),
  factoryInstrument('Mideas Punch Kick', [
    factoryStep({ volume: 15, tonePeriodOffset: 0, noiseEnabled: true, noiseOrEnvelopeOffset: 1 }),
    factoryStep({ volume: 15, tonePeriodOffset: 220, noiseEnabled: true, noiseOrEnvelopeOffset: 4 }),
    factoryStep({ volume: 13, tonePeriodOffset: 430 }),
    factoryStep({ volume: 9, tonePeriodOffset: 600 }),
    factoryStep({ volume: 5, tonePeriodOffset: 720 }),
    factoryStep({ volume: 2, tonePeriodOffset: 780 }),
    silentStep(),
  ]),
  factoryInstrument('Mideas Dry Snare', [
    factoryStep({ volume: 15, tonePeriodOffset: -180, noiseEnabled: true, noiseOrEnvelopeOffset: 1 }),
    factoryStep({ volume: 14, tonePeriodOffset: -100, noiseEnabled: true, noiseOrEnvelopeOffset: 3 }),
    factoryStep({ volume: 13, tonePeriodOffset: -45, noiseEnabled: true, noiseOrEnvelopeOffset: 6 }),
    factoryStep({ volume: 11, tonePeriodOffset: 0, noiseEnabled: true, noiseOrEnvelopeOffset: 9 }),
    factoryStep({ volume: 9, toneEnabled: false, noiseEnabled: true, noiseOrEnvelopeOffset: 12 }),
    factoryStep({ volume: 7, toneEnabled: false, noiseEnabled: true, noiseOrEnvelopeOffset: 15 }),
    factoryStep({ volume: 5, toneEnabled: false, noiseEnabled: true, noiseOrEnvelopeOffset: 12 }),
    factoryStep({ volume: 3, toneEnabled: false, noiseEnabled: true, noiseOrEnvelopeOffset: 8 }),
    factoryStep({ volume: 1, toneEnabled: false, noiseEnabled: true, noiseOrEnvelopeOffset: 4 }),
    silentStep(),
  ]),
  factoryInstrument('Mideas Wide Snare', [
    factoryStep({ volume: 15, tonePeriodOffset: -260, noiseEnabled: true, noiseOrEnvelopeOffset: 0 }),
    factoryStep({ volume: 15, tonePeriodOffset: -170, noiseEnabled: true, noiseOrEnvelopeOffset: 2 }),
    factoryStep({ volume: 14, tonePeriodOffset: -90, noiseEnabled: true, noiseOrEnvelopeOffset: 4 }),
    factoryStep({ volume: 13, tonePeriodOffset: -30, noiseEnabled: true, noiseOrEnvelopeOffset: 7 }),
    factoryStep({ volume: 12, toneEnabled: false, noiseEnabled: true, noiseOrEnvelopeOffset: 10 }),
    factoryStep({ volume: 10, toneEnabled: false, noiseEnabled: true, noiseOrEnvelopeOffset: 13 }),
    factoryStep({ volume: 8, toneEnabled: false, noiseEnabled: true, noiseOrEnvelopeOffset: 15 }),
    factoryStep({ volume: 6, toneEnabled: false, noiseEnabled: true, noiseOrEnvelopeOffset: 13 }),
    factoryStep({ volume: 5, toneEnabled: false, noiseEnabled: true, noiseOrEnvelopeOffset: 10 }),
    factoryStep({ volume: 3, toneEnabled: false, noiseEnabled: true, noiseOrEnvelopeOffset: 7 }),
    factoryStep({ volume: 2, toneEnabled: false, noiseEnabled: true, noiseOrEnvelopeOffset: 4 }),
    factoryStep({ volume: 1, toneEnabled: false, noiseEnabled: true, noiseOrEnvelopeOffset: 2 }),
    silentStep(),
  ]),
  factoryInstrument('Mideas Closed Hat', [
    factoryStep({ volume: 12, toneEnabled: false, noiseEnabled: true, noiseOrEnvelopeOffset: 0 }),
    factoryStep({ volume: 8, toneEnabled: false, noiseEnabled: true, noiseOrEnvelopeOffset: 2 }),
    factoryStep({ volume: 4, toneEnabled: false, noiseEnabled: true, noiseOrEnvelopeOffset: 5 }),
    factoryStep({ volume: 1, toneEnabled: false, noiseEnabled: true, noiseOrEnvelopeOffset: 9 }),
    silentStep(),
  ]),
  factoryInstrument('Mideas Open Hat', [
    factoryStep({ volume: 13, toneEnabled: false, noiseEnabled: true, noiseOrEnvelopeOffset: 0 }),
    factoryStep({ volume: 12, toneEnabled: false, noiseEnabled: true, noiseOrEnvelopeOffset: 1 }),
    factoryStep({ volume: 11, toneEnabled: false, noiseEnabled: true, noiseOrEnvelopeOffset: 2 }),
    factoryStep({ volume: 10, toneEnabled: false, noiseEnabled: true, noiseOrEnvelopeOffset: 3 }),
    factoryStep({ volume: 9, toneEnabled: false, noiseEnabled: true, noiseOrEnvelopeOffset: 4 }),
    factoryStep({ volume: 8, toneEnabled: false, noiseEnabled: true, noiseOrEnvelopeOffset: 6 }),
    factoryStep({ volume: 6, toneEnabled: false, noiseEnabled: true, noiseOrEnvelopeOffset: 8 }),
    factoryStep({ volume: 5, toneEnabled: false, noiseEnabled: true, noiseOrEnvelopeOffset: 10 }),
    factoryStep({ volume: 4, toneEnabled: false, noiseEnabled: true, noiseOrEnvelopeOffset: 12 }),
    factoryStep({ volume: 2, toneEnabled: false, noiseEnabled: true, noiseOrEnvelopeOffset: 15 }),
    factoryStep({ volume: 1, toneEnabled: false, noiseEnabled: true, noiseOrEnvelopeOffset: 12 }),
    silentStep(),
  ]),
  factoryInstrument('Mideas Rimshot', [
    factoryStep({ volume: 15, tonePeriodOffset: 0, noiseEnabled: true, noiseOrEnvelopeOffset: 1 }),
    factoryStep({ volume: 12, tonePeriodOffset: 540, noiseEnabled: true, noiseOrEnvelopeOffset: 4 }),
    factoryStep({ volume: 9, tonePeriodOffset: 120, noiseEnabled: true, noiseOrEnvelopeOffset: 7 }),
    factoryStep({ volume: 5, tonePeriodOffset: 420, noiseEnabled: true, noiseOrEnvelopeOffset: 3 }),
    factoryStep({ volume: 2, tonePeriodOffset: 200 }),
    silentStep(),
  ]),
  factoryInstrument('Mideas Low Tom', [
    factoryStep({ volume: 15, tonePeriodOffset: 0, noiseEnabled: true, noiseOrEnvelopeOffset: 2 }),
    factoryStep({ volume: 15, tonePeriodOffset: 100, noiseEnabled: true, noiseOrEnvelopeOffset: 5 }),
    factoryStep({ volume: 14, tonePeriodOffset: 200 }),
    factoryStep({ volume: 12, tonePeriodOffset: 290 }),
    factoryStep({ volume: 10, tonePeriodOffset: 370 }),
    factoryStep({ volume: 8, tonePeriodOffset: 430 }),
    factoryStep({ volume: 6, tonePeriodOffset: 470 }),
    factoryStep({ volume: 4, tonePeriodOffset: 500 }),
    factoryStep({ volume: 2, tonePeriodOffset: 520 }),
    silentStep(),
  ]),
  factoryInstrument('Mideas High Tom', [
    factoryStep({ volume: 15, tonePeriodOffset: 0, noiseEnabled: true, noiseOrEnvelopeOffset: 1 }),
    factoryStep({ volume: 14, tonePeriodOffset: 90, noiseEnabled: true, noiseOrEnvelopeOffset: 4 }),
    factoryStep({ volume: 12, tonePeriodOffset: 170 }),
    factoryStep({ volume: 10, tonePeriodOffset: 240 }),
    factoryStep({ volume: 7, tonePeriodOffset: 300 }),
    factoryStep({ volume: 4, tonePeriodOffset: 340 }),
    factoryStep({ volume: 2, tonePeriodOffset: 360 }),
    silentStep(),
  ]),
  factoryInstrument('Mideas Pluck Bass', [
    factoryStep({ volume: 15, tonePeriodOffset: -90 }),
    factoryStep({ volume: 15, tonePeriodOffset: -50 }),
    factoryStep({ volume: 14, tonePeriodOffset: -24 }),
    factoryStep({ volume: 13, tonePeriodOffset: -10 }),
    factoryStep({ volume: 12, tonePeriodOffset: 0 }),
    factoryStep({ volume: 11, tonePeriodOffset: 4 }),
    factoryStep({ volume: 10, tonePeriodOffset: 0 }),
    factoryStep({ volume: 11, tonePeriodOffset: -4 }),
  ], 5),
  factoryInstrument('Mideas Bright Lead', [
    factoryStep({ volume: 15, tonePeriodOffset: -5 }),
    factoryStep({ volume: 15, tonePeriodOffset: -3 }),
    factoryStep({ volume: 15, tonePeriodOffset: 0 }),
    factoryStep({ volume: 14, tonePeriodOffset: 3 }),
    factoryStep({ volume: 15, tonePeriodOffset: 5 }),
    factoryStep({ volume: 15, tonePeriodOffset: 3 }),
    factoryStep({ volume: 15, tonePeriodOffset: 0 }),
    factoryStep({ volume: 14, tonePeriodOffset: -3 }),
  ], 0),
  factoryInstrument('Mideas Laser Zap', [
    factoryStep({ volume: 15, tonePeriodOffset: 1100, noiseEnabled: true, noiseOrEnvelopeOffset: 0 }),
    factoryStep({ volume: 15, tonePeriodOffset: 900, noiseEnabled: true, noiseOrEnvelopeOffset: 1 }),
    factoryStep({ volume: 14, tonePeriodOffset: 720, noiseEnabled: true, noiseOrEnvelopeOffset: 2 }),
    factoryStep({ volume: 13, tonePeriodOffset: 550, noiseEnabled: true, noiseOrEnvelopeOffset: 4 }),
    factoryStep({ volume: 12, tonePeriodOffset: 390, noiseEnabled: true, noiseOrEnvelopeOffset: 7 }),
    factoryStep({ volume: 10, tonePeriodOffset: 260, noiseEnabled: true, noiseOrEnvelopeOffset: 10 }),
    factoryStep({ volume: 8, tonePeriodOffset: 150, noiseEnabled: true, noiseOrEnvelopeOffset: 13 }),
    factoryStep({ volume: 6, tonePeriodOffset: 80 }),
    factoryStep({ volume: 4, tonePeriodOffset: 30 }),
    factoryStep({ volume: 2, tonePeriodOffset: 0 }),
    silentStep(),
  ]),
];

export interface PT3FactoryKitMergeResult {
  instruments: (PT3Instrument | SCCInstrument)[];
  addedInstrumentIds: number[];
  alreadyPresentPresetNames: string[];
  skippedPresetNames: string[];
}

const cloneFactoryInstrument = (instrument: PT3Instrument, id: number): PT3Instrument => ({
  ...instrument,
  id,
  pt3Sample: instrument.pt3Sample ? {
    ...instrument.pt3Sample,
    steps: instrument.pt3Sample.steps.map(step => ({
      ...step,
      raw: [...step.raw] as [number, number, number, number],
    })),
  } : undefined,
});

/** Add as much of the factory kit as fits, preserving every existing ID/asset. */
export const mergePT3FactoryKit = (
  existingInstruments: readonly (PT3Instrument | SCCInstrument)[],
): PT3FactoryKitMergeResult => {
  const usedIds = new Set(existingInstruments.map(instrument => instrument.id));
  const existingNames = new Set(existingInstruments.map(instrument => instrument.name));
  const added: PT3Instrument[] = [];
  const alreadyPresentPresetNames: string[] = [];
  const skippedPresetNames: string[] = [];

  PT3_FACTORY_INSTRUMENTS.forEach((preset) => {
    if (existingNames.has(preset.name)) {
      alreadyPresentPresetNames.push(preset.name);
      return;
    }
    let destinationId: number | null = null;
    for (let id = 1; id <= MAX_INSTRUMENT_ID; id += 1) {
      if (!usedIds.has(id)) {
        destinationId = id;
        break;
      }
    }
    if (destinationId === null) {
      skippedPresetNames.push(preset.name);
      return;
    }
    usedIds.add(destinationId);
    existingNames.add(preset.name);
    added.push(cloneFactoryInstrument(preset, destinationId));
  });

  return {
    instruments: [...existingInstruments, ...added].sort((left, right) => left.id - right.id),
    addedInstrumentIds: added.map(instrument => instrument.id),
    alreadyPresentPresetNames,
    skippedPresetNames,
  };
};
