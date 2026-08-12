import type { PT3PatternEffectCommand, TrackerCell } from '../../types';

export const TRACKER_EFFECT_PARAMETER_BYTES: Readonly<Record<number, number>> = {
  0x0: 0,
  0x1: 3,
  0x2: 5,
  0x3: 1,
  0x4: 1,
  0x5: 2,
  0x8: 3,
  0x9: 1,
};

export const TRACKER_EFFECT_NAMES: Readonly<Record<number, string>> = {
  0x0: 'NOP',
  0x1: 'GLISS',
  0x2: 'PORTA',
  0x3: 'SAMPLE POS',
  0x4: 'ORNAMENT POS',
  0x5: 'VIBRATO',
  0x8: 'ENVELOPE SLIDE',
  0x9: 'SPEED',
};

export const normalizeTrackerEffectParams = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const normalized = value.replace(/[^0-9a-f]/gi, '').toUpperCase().slice(0, 10);
  return normalized || null;
};

export const parseTrackerEffectParams = (value: string | null | undefined): number[] => {
  const normalized = normalizeTrackerEffectParams(value);
  if (!normalized) return [];
  const evenHex = normalized.length % 2 === 0 ? normalized : `0${normalized}`;
  const bytes: number[] = [];
  for (let index = 0; index < evenHex.length; index += 2) {
    bytes.push(parseInt(evenHex.slice(index, index + 2), 16) & 0xff);
  }
  return bytes;
};

export const formatTrackerEffectParams = (params: readonly number[]): string | null =>
  params.length > 0
    ? params.map(value => (value & 0xff).toString(16).toUpperCase().padStart(2, '0')).join('')
    : null;

export const getTrackerEffectParameterByteCount = (command: number | null | undefined): number =>
  command === null || command === undefined ? 0 : TRACKER_EFFECT_PARAMETER_BYTES[command & 0x0f] ?? 0;

export const getTrackerEffectValidationMessage = (
  command: number | null | undefined,
  params: string | null | undefined,
): string | null => {
  if (command === null || command === undefined) return null;
  const expectedBytes = getTrackerEffectParameterByteCount(command);
  if (expectedBytes === 0) return null;
  const actualBytes = parseTrackerEffectParams(params).length;
  if (actualBytes !== expectedBytes) {
    const name = TRACKER_EFFECT_NAMES[command & 0x0f] ?? `FX ${(command & 0x0f).toString(16).toUpperCase()}`;
    return `${name} expects ${expectedBytes * 2} hexadecimal CMD digits (${expectedBytes} bytes); received ${actualBytes * 2}.`;
  }
  return null;
};

/**
 * PT3 hardware-envelope column (`ENV`).
 *
 * A row spells its envelope as one byte plus a 16-bit period: B0 switches the
 * envelope off, and B2..BF select AY R13 shapes 2..F followed by the period
 * high byte then low byte. Shapes 0 and 1 are unreachable by design -- those
 * byte values are B0 (off) and B1 (note-skip) -- so the editor refuses them
 * instead of writing a byte that would silently mean something else.
 */
export const PT3_ENVELOPE_OFF = 'OFF';
const PT3_ENVELOPE_PATTERN = /^([2-9A-F]):([0-9A-F]{4})$/;

export interface PT3EnvelopeCommand {
  /** null when the row switches the envelope off. */
  shape: number | null;
  period: number;
}

export const normalizePT3EnvelopeField = (value: string | null | undefined): string | null => {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim().toUpperCase();
  if (!trimmed) return null;
  return trimmed;
};

export const parsePT3EnvelopeField = (value: string | null | undefined): PT3EnvelopeCommand | null => {
  const normalized = normalizePT3EnvelopeField(value);
  if (!normalized) return null;
  if (normalized === PT3_ENVELOPE_OFF) return { shape: null, period: 0 };
  const match = PT3_ENVELOPE_PATTERN.exec(normalized);
  if (!match) return null;
  return { shape: parseInt(match[1], 16), period: parseInt(match[2], 16) };
};

export const formatPT3EnvelopeField = (shape: number | null, period: number): string =>
  shape === null
    ? PT3_ENVELOPE_OFF
    : `${(shape & 0x0f).toString(16).toUpperCase()}:${(period & 0xffff).toString(16).toUpperCase().padStart(4, '0')}`;

export const getPT3EnvelopeValidationMessage = (value: string | null | undefined): string | null => {
  const normalized = normalizePT3EnvelopeField(value);
  if (!normalized) return null;
  if (normalized === PT3_ENVELOPE_OFF) return null;
  if (PT3_ENVELOPE_PATTERN.test(normalized)) return null;
  const shapeOnly = /^([0-9A-F]):/.exec(normalized);
  if (shapeOnly && (shapeOnly[1] === '0' || shapeOnly[1] === '1')) {
    return `ENV: las formas 0 y 1 no existen en un stream PT3 (esos bytes son "envelope off" y "note skip"). Usa 8..F para las envolventes habituales, o ${PT3_ENVELOPE_OFF}.`;
  }
  return `ENV admite "${PT3_ENVELOPE_OFF}" o forma:periodo con forma 2..F y 4 dígitos hex, por ejemplo 9:004B; recibido "${normalized}".`;
};

export const sourceEffectToNativeFields = (
  effect: PT3PatternEffectCommand | undefined,
): Pick<TrackerCell, 'effectCommand' | 'effectParams'> => ({
  effectCommand: effect ? effect.code & 0x0f : null,
  effectParams: effect ? formatTrackerEffectParams(effect.params) : null,
});

const readSignedWord = (lo = 0, hi = 0): number => {
  const value = (lo & 0xff) | ((hi & 0xff) << 8);
  return value >= 0x8000 ? value - 0x10000 : value;
};

const wrapSignedWord = (value: number): number => {
  const wrapped = value & 0xffff;
  return wrapped >= 0x8000 ? wrapped - 0x10000 : wrapped;
};

const clampTonePeriod = (value: number): number =>
  Math.max(1, Math.min(0x0fff, Math.round(value)));

export interface NativeTrackerChannelEffectState {
  currentPeriod: number | null;
  targetPeriod: number | null;
  toneMode: 'none' | 'gliss' | 'porta';
  toneDelay: number;
  toneCounter: number;
  toneStep: number;
  gateEnabled: boolean;
  gateCounter: number;
  gateOnFrames: number;
  gateOffFrames: number;
}

export interface NativeTrackerEffectApplyContext {
  isNewNote: boolean;
  previousPeriod: number | null;
  targetPeriod: number | null;
}

export interface NativeTrackerEffectApplication {
  state: NativeTrackerChannelEffectState;
  samplePosition: number | null;
  ornamentPosition: number | null;
}

export const createNativeTrackerChannelEffectState = (): NativeTrackerChannelEffectState => ({
  currentPeriod: null,
  targetPeriod: null,
  toneMode: 'none',
  toneDelay: 0,
  toneCounter: 0,
  toneStep: 0,
  gateEnabled: true,
  gateCounter: 0,
  gateOnFrames: 0,
  gateOffFrames: 0,
});

/**
 * Apply one Vortex command at a decoded tracker-row boundary. Commands use
 * the exact PT3 payload byte order, which lets imported source commands and
 * newly authored native commands share the same engine.
 */
export const applyNativeTrackerChannelEffect = (
  previousState: NativeTrackerChannelEffectState,
  command: number | null | undefined,
  paramsText: string | null | undefined,
  context: NativeTrackerEffectApplyContext,
): NativeTrackerEffectApplication => {
  const params = parseTrackerEffectParams(paramsText);
  let state: NativeTrackerChannelEffectState = context.isNewNote
    ? {
      ...createNativeTrackerChannelEffectState(),
      currentPeriod: context.targetPeriod,
      targetPeriod: context.targetPeriod,
    }
    : { ...previousState };
  let samplePosition: number | null = null;
  let ornamentPosition: number | null = null;

  switch (command === null || command === undefined ? -1 : command & 0x0f) {
    case 0x1: {
      const delay = Math.max(1, params[0] ?? 1);
      state = {
        ...state,
        toneMode: 'gliss',
        toneDelay: delay,
        toneCounter: delay,
        toneStep: readSignedWord(params[1], params[2]),
        targetPeriod: null,
      };
      break;
    }
    case 0x2: {
      const delay = Math.max(1, params[0] ?? 1);
      const targetPeriod = context.targetPeriod ?? state.currentPeriod;
      const startPeriod = context.previousPeriod ?? state.currentPeriod ?? targetPeriod;
      const encodedStep = readSignedWord(params[3], params[4]);
      const fallbackStep = readSignedWord(params[1], params[2]);
      const step = Math.max(1, Math.abs(encodedStep || fallbackStep || 1));
      state = {
        ...state,
        currentPeriod: startPeriod,
        targetPeriod,
        toneMode: startPeriod !== null && targetPeriod !== null && startPeriod !== targetPeriod ? 'porta' : 'none',
        toneDelay: delay,
        toneCounter: delay,
        toneStep: step,
      };
      break;
    }
    case 0x3:
      samplePosition = params[0] ?? 0;
      break;
    case 0x4:
      ornamentPosition = params[0] ?? 0;
      break;
    case 0x5: {
      const onFrames = params[0] ?? 0;
      const offFrames = params[1] ?? 0;
      state = {
        ...state,
        gateEnabled: true,
        gateOnFrames: onFrames,
        gateOffFrames: offFrames,
        gateCounter: onFrames,
      };
      break;
    }
    default:
      break;
  }

  return { state, samplePosition, ornamentPosition };
};

/** Advance one 50 Hz Vortex effect tick for one channel. */
export const stepNativeTrackerChannelEffect = (
  previousState: NativeTrackerChannelEffectState,
): NativeTrackerChannelEffectState => {
  const state = { ...previousState };

  if (state.toneMode !== 'none' && state.currentPeriod !== null) {
    state.toneCounter = Math.max(0, state.toneCounter - 1);
    if (state.toneCounter === 0) {
      state.toneCounter = Math.max(1, state.toneDelay);
      if (state.toneMode === 'gliss') {
        state.currentPeriod = clampTonePeriod(state.currentPeriod + state.toneStep);
      } else if (state.targetPeriod !== null) {
        const direction = state.targetPeriod > state.currentPeriod ? 1 : -1;
        const candidate = state.currentPeriod + direction * Math.max(1, Math.abs(state.toneStep));
        const reachedTarget = direction > 0 ? candidate >= state.targetPeriod : candidate <= state.targetPeriod;
        state.currentPeriod = reachedTarget ? state.targetPeriod : clampTonePeriod(candidate);
        if (reachedTarget) {
          state.toneMode = 'none';
          state.toneCounter = 0;
        }
      }
    }
  }

  if (state.gateOnFrames > 0 && state.gateOffFrames > 0) {
    state.gateCounter = Math.max(0, state.gateCounter - 1);
    if (state.gateCounter === 0) {
      state.gateEnabled = !state.gateEnabled;
      state.gateCounter = state.gateEnabled ? state.gateOnFrames : state.gateOffFrames;
    }
  }

  return state;
};

export interface NativeTrackerGlobalEffectState {
  rowSpeed: number;
  envelopeSlideDelay: number;
  envelopeSlideCounter: number;
  envelopeSlideStep: number;
  envelopeSlideOffset: number;
}

export const createNativeTrackerGlobalEffectState = (rowSpeed = 6): NativeTrackerGlobalEffectState => ({
  rowSpeed: Math.max(1, Math.min(31, rowSpeed | 0)),
  envelopeSlideDelay: 0,
  envelopeSlideCounter: 0,
  envelopeSlideStep: 0,
  envelopeSlideOffset: 0,
});

export const applyNativeTrackerGlobalEffect = (
  previousState: NativeTrackerGlobalEffectState,
  command: number | null | undefined,
  paramsText: string | null | undefined,
): NativeTrackerGlobalEffectState => {
  const params = parseTrackerEffectParams(paramsText);
  const state = { ...previousState };
  switch (command === null || command === undefined ? -1 : command & 0x0f) {
    case 0x8:
      state.envelopeSlideDelay = Math.max(1, params[0] ?? 1);
      state.envelopeSlideCounter = state.envelopeSlideDelay;
      state.envelopeSlideStep = readSignedWord(params[1], params[2]);
      break;
    case 0x9:
      state.rowSpeed = Math.max(1, Math.min(31, params[0] ?? state.rowSpeed));
      break;
    default:
      break;
  }
  return state;
};

export const stepNativeTrackerGlobalEffect = (
  previousState: NativeTrackerGlobalEffectState,
): NativeTrackerGlobalEffectState => {
  const state = { ...previousState };
  if (state.envelopeSlideDelay > 0) {
    state.envelopeSlideCounter = Math.max(0, state.envelopeSlideCounter - 1);
    if (state.envelopeSlideCounter === 0) {
      state.envelopeSlideCounter = state.envelopeSlideDelay;
      state.envelopeSlideOffset = wrapSignedWord(state.envelopeSlideOffset + state.envelopeSlideStep);
    }
  }
  return state;
};

/** Vortex decodes channels in order, so the last SPEED command wins. */
export const resolveNativeTrackerRowSpeed = (
  cells: readonly Pick<TrackerCell, 'effectCommand' | 'effectParams'>[],
  fallbackSpeed: number,
): number => {
  let speed = Math.max(1, Math.min(31, fallbackSpeed | 0));
  for (const cell of cells) {
    if ((cell.effectCommand ?? -1) !== 0x9) continue;
    speed = applyNativeTrackerGlobalEffect(
      createNativeTrackerGlobalEffectState(speed),
      cell.effectCommand,
      cell.effectParams,
    ).rowSpeed;
  }
  return speed;
};
