import { Msx2PathEasing, Msx2PathTiming, Msx2PathTimingKey } from '../types';

export const PATH_EASING_OPTIONS: Array<{ value: Msx2PathEasing; label: string; formula: string }> = [
  { value: 'linear', label: 'Constante', formula: 't' },
  { value: 'quadIn', label: 'Acelerar · cuadrática', formula: 't²' },
  { value: 'quadOut', label: 'Frenar · cuadrática', formula: '1 − (1 − t)²' },
  { value: 'cubicIn', label: 'Acelerar · cúbica', formula: 't³' },
  { value: 'cubicOut', label: 'Frenar · cúbica', formula: '1 − (1 − t)³' },
  { value: 'sineIn', label: 'Acelerar · seno', formula: '1 − cos(πt/2)' },
  { value: 'sineOut', label: 'Frenar · seno', formula: 'sin(πt/2)' },
  { value: 'sineInOut', label: 'Acelerar y frenar · seno', formula: '(1 − cos(πt))/2' },
  { value: 'smoothstep', label: 'Acelerar y frenar · suave', formula: '3t² − 2t³' },
];

const unit = (n: number) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
export const normalizePathIntensity = (value?: number) => Number.isFinite(value)
  ? Math.round(Math.max(0, Math.min(4, value!)) * 1000) / 1000 : 1;
const intensityTables = new Map<string, number[]>();

/** Integrate powered nonnegative speed, then normalise to preserve endpoints. */
function intensifiedProgress(easing: Msx2PathEasing, t: number, intensity: number): number {
  if (intensity === 0 || easing === 'linear') return t;
  if (easing === 'quadIn') return t ** (intensity + 1);
  if (easing === 'quadOut') return 1 - (1 - t) ** (intensity + 1);
  if (easing === 'cubicIn') return t ** (2 * intensity + 1);
  if (easing === 'cubicOut') return 1 - (1 - t) ** (2 * intensity + 1);
  const cacheKey = `${easing}:${intensity}`;
  let table = intensityTables.get(cacheKey);
  const count = 1024;
  if (!table) {
    table = [0];
    for (let i = 0; i < count; i++) {
      const u = (i + 0.5) / count;
      const speed = easing === 'sineIn' ? Math.sin(Math.PI * u / 2)
        : easing === 'sineOut' ? Math.cos(Math.PI * u / 2)
        : easing === 'sineInOut' ? Math.sin(Math.PI * u)
        : easing === 'smoothstep' ? u * (1 - u) : 1;
      table.push(table[i] + speed ** intensity);
    }
    const total = table[count];
    table = table.map(value => value / total);
    if (intensityTables.size >= 128) intensityTables.delete(intensityTables.keys().next().value!);
    intensityTables.set(cacheKey, table);
  }
  const position = t * count, index = Math.floor(position);
  return table[index] + (table[index + 1] - table[index]) * (position - index);
}

/** Maps elapsed time to travelled distance. This runs only in the editor/exporter. */
export function evaluatePathEasing(easing: Msx2PathEasing, time: number, authoredIntensity?: number): number {
  const t = unit(time);
  if (t === 0 || t === 1) return t;
  const intensity = normalizePathIntensity(authoredIntensity);
  if (intensity !== 1) return intensifiedProgress(easing, t, intensity);
  switch (easing) {
    case 'quadIn': return t * t;
    case 'quadOut': return 1 - (1 - t) ** 2;
    case 'cubicIn': return t ** 3;
    case 'cubicOut': return 1 - (1 - t) ** 3;
    case 'sineIn': return 1 - Math.cos(Math.PI * t / 2);
    case 'sineOut': return Math.sin(Math.PI * t / 2);
    case 'sineInOut': return (1 - Math.cos(Math.PI * t)) / 2;
    case 'smoothstep': return t * t * (3 - 2 * t);
    default: return t;
  }
}

export function createPathTiming(): Msx2PathTiming {
  return { durationFrames: 60, keys: [
    { time: 0, distance: 0, easing: 'sineInOut' },
    { time: 1, distance: 1, easing: 'linear' },
  ] };
}

/** Imported data and UI share the same bounded, non-reversing curve contract. */
export function normalizePathTiming(timing: Msx2PathTiming): Msx2PathTiming {
  const raw = (Array.isArray(timing.keys) ? timing.keys : [])
    .filter(key => key && Number.isFinite(key.time) && Number.isFinite(key.distance))
    .map(key => ({ time: unit(key.time), distance: unit(key.distance),
      easing: PATH_EASING_OPTIONS.some(option => option.value === key.easing) ? key.easing : 'linear' as Msx2PathEasing }))
    .sort((a, b) => a.time - b.time);
  const keys: Msx2PathTimingKey[] = [{ time: 0, distance: 0, easing: raw.find(key => key.time === 0)?.easing || 'linear' }];
  for (const key of raw) {
    if (keys.length >= 63) break;
    if (key.time < keys[keys.length - 1].time + 0.001 || key.time > 0.999) continue;
    keys.push({ ...key, distance: Math.max(keys[keys.length - 1].distance, key.distance) });
  }
  keys.push({ time: 1, distance: 1, easing: 'linear' });
  const legacyIntensity = Array.isArray(timing.keys) ? timing.keys.find(key => key?.time === 0)?.intensity : undefined;
  return { intensity: normalizePathIntensity(timing.intensity ?? legacyIntensity), endNodeId: timing.endNodeId, durationFrames: Math.max(1, Math.min(3600, Math.round(Number.isFinite(timing.durationFrames) ? timing.durationFrames : 60))), keys };
}

/** Takes normalised keys; equal distances give a pause, without a division by zero. */
export function evaluatePathTiming(keys: Msx2PathTimingKey[], time: number, intensity = 1): number {
  const t = unit(time);
  if (t === 0 || t === 1) return t;
  const nextIndex = keys.findIndex(key => key.time >= t);
  if (nextIndex <= 0) return 0;
  const a = keys[nextIndex - 1];
  const b = keys[nextIndex];
  const u = (t - a.time) / (b.time - a.time);
  return a.distance + (b.distance - a.distance) * evaluatePathEasing(a.easing, u, intensity);
}

/** Arc-length lookup keeps spatial shape and temporal interpolation independent. */
export function sampleTimedPath(
  from: { x: number; y: number }, samples: Array<{ x: number; y: number }>, authored: Msx2PathTiming,
): Array<{ x: number; y: number }> {
  const timing = normalizePathTiming(authored);
  const points = [from, ...samples];
  const lengths = [0];
  for (let i = 1; i < points.length; i++) {
    lengths.push(lengths[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
  }
  const length = lengths[lengths.length - 1];
  const out: Array<{ x: number; y: number }> = [];
  let index = 1;
  for (let frame = 1; frame <= timing.durationFrames; frame++) {
    const distance = evaluatePathTiming(timing.keys, frame / timing.durationFrames, timing.intensity) * length;
    while (index < points.length - 1 && lengths[index] < distance) index++;
    if (points.length === 1 || !length) { out.push({ ...from }); continue; }
    const a = points[index - 1];
    const b = points[index];
    const span = lengths[index] - lengths[index - 1];
    const u = span ? unit((distance - lengths[index - 1]) / span) : 0;
    out.push({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
  }
  return out;
}
