/**
 * Contract for editable FX/CMD and ENV over a source-faithful PT3 stream.
 *
 * Both are variable-length row commands. An effect's byte lives in the row
 * prefix while its parameters live AFTER the row terminator, unstacked LIFO by
 * the replayer; an envelope is a prefix byte plus a big-endian period. Getting
 * either length or order wrong shifts every following byte of the channel and
 * corrupts the rest of the pattern silently, so this walks real modules rather
 * than a synthetic fixture.
 *
 * Checks, per module:
 *   1. Re-serializing an untouched song is byte-idempotent.
 *   2. Every cell field, FX/CMD and ENV included, survives parse -> write -> parse.
 *   3. Editing one FX/CMD reads back exactly, and changes no other cell.
 *   4. Clearing an existing FX reads back blank and changes no other cell.
 *  4b. The same two checks for an authored and a cleared ENV.
 *   5. Effect codes and envelope shapes the stream cannot spell are refused.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parsePT3File } from '../../components/utils/pt3Parser';
import { rewritePT3PatternNoteStreams } from '../../components/utils/pt3SourceEditor';
import type { TrackerCell, TrackerPattern, TrackerSongData } from '../../types';

/** parsePT3File returns the decoded subset of a song, not a complete asset. */
type ParsedPT3Song = Partial<TrackerSongData> & { patterns: TrackerPattern[] };

let failures = 0;
const fail = (message: string): void => {
  failures += 1;
  console.log(`FAIL: ${message}`);
};

const CHANNELS = ['A', 'B', 'C'] as const;

const modulePaths: string[] = [];
const walk = (dir: string): void => {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.pt3$/i.test(entry)) modulePaths.push(path);
  }
};
walk('pt3');

/** Flatten every cell to a comparable string so a diff names the exact cell. */
const cellKey = (cell: TrackerCell | undefined): string => [
  cell?.note ?? '-',
  cell?.instrument ?? '-',
  cell?.ornament ?? '-',
  cell?.volume ?? '-',
  cell?.effectCommand ?? '-',
  cell?.effectParams ?? '-',
  cell?.pt3Envelope ?? '-',
].join('|');

const snapshot = (patterns: TrackerPattern[]): Map<string, string> => {
  const map = new Map<string, string>();
  patterns.forEach((pattern, patternIndex) => {
    for (let row = 0; row < pattern.numRows; row += 1) {
      for (const channel of CHANNELS) {
        map.set(`p${patternIndex}r${row}${channel}`, cellKey(pattern.rows[row]?.[channel]));
      }
    }
  });
  return map;
};

const diff = (before: Map<string, string>, after: Map<string, string>, ignore: string): string[] => {
  const changes: string[] = [];
  for (const [key, value] of before) {
    if (key === ignore) continue;
    const other = after.get(key);
    if (other !== value) changes.push(`${key}: ${value} -> ${other}`);
  }
  return changes;
};

const writeAndReparse = (source: Uint8Array, patterns: TrackerPattern[]): ParsedPT3Song => {
  const bytes = rewritePT3PatternNoteStreams(new Uint8Array(source), patterns);
  return parsePT3File(bytes.buffer as ArrayBuffer) as ParsedPT3Song;
};

const editCell = (
  patterns: TrackerPattern[],
  patternIndex: number,
  row: number,
  channel: 'A' | 'B' | 'C',
  patch: Partial<TrackerCell>,
): TrackerPattern[] => patterns.map((pattern, index) => {
  if (index !== patternIndex) return pattern;
  return {
    ...pattern,
    rows: pattern.rows.map((current, currentRow) => (
      currentRow === row ? { ...current, [channel]: { ...current[channel], ...patch } } : current
    )),
  };
});

let modulesChecked = 0;
let effectEditsChecked = 0;
let effectClearsChecked = 0;
let envelopesAuthored = 0;
let envelopesCleared = 0;
/** A module this parser accepted, reused by the rejection checks below. */
let knownGood: { song: ParsedPT3Song; bytes: Uint8Array } | null = null;

for (const path of modulePaths) {
  // parsePT3File decodes the module but does not carry the raw stream; that is
  // the importer's job. Keep the file bytes as the source for every rewrite.
  const moduleBytes = new Uint8Array(readFileSync(path));
  let song: ParsedPT3Song;
  try {
    song = parsePT3File(moduleBytes.slice().buffer as ArrayBuffer) as ParsedPT3Song;
  } catch {
    continue; // Modules this parser rejects are out of scope for this contract.
  }
  if (!song.patterns.length) continue;
  modulesChecked += 1;
  knownGood = knownGood ?? { song, bytes: moduleBytes };
  const name = path.replace(/\\/g, '/');

  // --- 1 + 2. Untouched round-trip ----------------------------------------
  const firstBytes = rewritePT3PatternNoteStreams(new Uint8Array(moduleBytes), song.patterns);
  const reparsed = parsePT3File(firstBytes.buffer as ArrayBuffer) as ParsedPT3Song;
  const secondBytes = rewritePT3PatternNoteStreams(new Uint8Array(firstBytes), reparsed.patterns);
  if (Buffer.compare(Buffer.from(firstBytes), Buffer.from(secondBytes)) !== 0) {
    fail(`${name}: re-serializing an untouched song is not byte-idempotent (${firstBytes.length} vs ${secondBytes.length} bytes).`);
  }
  const original = snapshot(song.patterns);
  const afterRoundTrip = snapshot(reparsed.patterns);
  const roundTripChanges = diff(original, afterRoundTrip, '');
  if (roundTripChanges.length) {
    fail(`${name}: ${roundTripChanges.length} cell(s) changed across an untouched round-trip, e.g. ${roundTripChanges.slice(0, 3).join(' ; ')}`);
  }

  // --- 3. Author a new FX on a row that had none --------------------------
  // GLISS (3 payload bytes) is the widest command real modules use, so it is
  // the one most likely to expose a length mistake.
  let target: { patternIndex: number; row: number; channel: 'A' | 'B' | 'C' } | null = null;
  outer: for (let patternIndex = 0; patternIndex < reparsed.patterns.length; patternIndex += 1) {
    const pattern = reparsed.patterns[patternIndex];
    for (let row = 0; row < pattern.numRows; row += 1) {
      for (const channel of CHANNELS) {
        const sourceRow = pattern.pt3SourceRows?.[row]?.[channel];
        const cell = pattern.rows[row]?.[channel];
        if (sourceRow?.decoded && cell?.note && !cell.effectCommand) {
          target = { patternIndex, row, channel };
          break outer;
        }
      }
    }
  }

  if (target) {
    const edited = editCell(reparsed.patterns, target.patternIndex, target.row, target.channel, {
      effectCommand: 0x1,
      effectParams: '05FF7F',
    });
    const after = writeAndReparse(firstBytes, edited);
    const key = `p${target.patternIndex}r${target.row}${target.channel}`;
    const cell = after.patterns[target.patternIndex]?.rows[target.row]?.[target.channel];
    if (cell?.effectCommand !== 0x1 || cell?.effectParams !== '05FF7F') {
      fail(`${name} ${key}: authored GLISS 05FF7F read back as ${cell?.effectCommand}/${cell?.effectParams}.`);
    }
    const collateral = diff(afterRoundTrip, snapshot(after.patterns), key);
    if (collateral.length) {
      fail(`${name} ${key}: authoring an effect changed ${collateral.length} unrelated cell(s), e.g. ${collateral.slice(0, 3).join(' ; ')}`);
    }
    effectEditsChecked += 1;
  }

  // --- 4. Clear an FX the module already had ------------------------------
  let existing: { patternIndex: number; row: number; channel: 'A' | 'B' | 'C' } | null = null;
  search: for (let patternIndex = 0; patternIndex < reparsed.patterns.length; patternIndex += 1) {
    const pattern = reparsed.patterns[patternIndex];
    for (let row = 0; row < pattern.numRows; row += 1) {
      for (const channel of CHANNELS) {
        if (pattern.rows[row]?.[channel]?.effectCommand) {
          existing = { patternIndex, row, channel };
          break search;
        }
      }
    }
  }

  if (existing) {
    const edited = editCell(reparsed.patterns, existing.patternIndex, existing.row, existing.channel, {
      effectCommand: null,
      effectParams: null,
    });
    const after = writeAndReparse(firstBytes, edited);
    const key = `p${existing.patternIndex}r${existing.row}${existing.channel}`;
    const cell = after.patterns[existing.patternIndex]?.rows[existing.row]?.[existing.channel];
    if (cell?.effectCommand !== null && cell?.effectCommand !== undefined) {
      fail(`${name} ${key}: cleared effect came back as ${cell?.effectCommand}/${cell?.effectParams}.`);
    }
    const collateral = diff(afterRoundTrip, snapshot(after.patterns), key);
    if (collateral.length) {
      fail(`${name} ${key}: clearing an effect changed ${collateral.length} unrelated cell(s), e.g. ${collateral.slice(0, 3).join(' ; ')}`);
    }
    effectClearsChecked += 1;
  }
  // --- 4b. Author and clear a hardware-envelope command --------------------
  // ENV lives in the row prefix as B0 (off) or B2..BF plus a big-endian period.
  // Getting its length wrong shifts the rest of the channel exactly like a bad
  // effect payload would, so it gets the same collateral check.
  let envTarget: { patternIndex: number; row: number; channel: 'A' | 'B' | 'C' } | null = null;
  envSearch: for (let patternIndex = 0; patternIndex < reparsed.patterns.length; patternIndex += 1) {
    const pattern = reparsed.patterns[patternIndex];
    for (let row = 0; row < pattern.numRows; row += 1) {
      for (const channel of CHANNELS) {
        const src = pattern.pt3SourceRows?.[row]?.[channel];
        const cell = pattern.rows[row]?.[channel];
        if (src?.decoded && cell?.note && !cell.pt3Envelope) {
          envTarget = { patternIndex, row, channel };
          break envSearch;
        }
      }
    }
  }

  if (envTarget) {
    const edited = editCell(reparsed.patterns, envTarget.patternIndex, envTarget.row, envTarget.channel, {
      pt3Envelope: '9:004B',
    });
    const after = writeAndReparse(firstBytes, edited);
    const key = `p${envTarget.patternIndex}r${envTarget.row}${envTarget.channel}`;
    const cell = after.patterns[envTarget.patternIndex]?.rows[envTarget.row]?.[envTarget.channel];
    if (cell?.pt3Envelope !== '9:004B') {
      fail(`${name} ${key}: authored ENV 9:004B read back as ${cell?.pt3Envelope}.`);
    }
    const collateral = diff(afterRoundTrip, snapshot(after.patterns), key);
    if (collateral.length) {
      fail(`${name} ${key}: authoring an envelope changed ${collateral.length} unrelated cell(s), e.g. ${collateral.slice(0, 3).join(' ; ')}`);
    }
    envelopesAuthored += 1;
  }

  let envExisting: { patternIndex: number; row: number; channel: 'A' | 'B' | 'C' } | null = null;
  envClear: for (let patternIndex = 0; patternIndex < reparsed.patterns.length; patternIndex += 1) {
    const pattern = reparsed.patterns[patternIndex];
    for (let row = 0; row < pattern.numRows; row += 1) {
      for (const channel of CHANNELS) {
        if (pattern.rows[row]?.[channel]?.pt3Envelope) {
          envExisting = { patternIndex, row, channel };
          break envClear;
        }
      }
    }
  }

  if (envExisting) {
    const edited = editCell(reparsed.patterns, envExisting.patternIndex, envExisting.row, envExisting.channel, {
      pt3Envelope: null,
    });
    const after = writeAndReparse(firstBytes, edited);
    const key = `p${envExisting.patternIndex}r${envExisting.row}${envExisting.channel}`;
    const cell = after.patterns[envExisting.patternIndex]?.rows[envExisting.row]?.[envExisting.channel];
    if (cell?.pt3Envelope) {
      fail(`${name} ${key}: cleared envelope came back as ${cell.pt3Envelope}.`);
    }
    const collateral = diff(afterRoundTrip, snapshot(after.patterns), key);
    if (collateral.length) {
      fail(`${name} ${key}: clearing an envelope changed ${collateral.length} unrelated cell(s), e.g. ${collateral.slice(0, 3).join(' ; ')}`);
    }
    envelopesCleared += 1;
  }
}

// --- 5. Codes the replayer cannot execute are refused ----------------------
if (knownGood) {
  const { song, bytes: goodBytes } = knownGood;
  const refuse = (patch: Partial<TrackerCell>, what: string): void => {
    const edited = editCell(song.patterns, 0, 0, 'A', patch);
    try {
      rewritePT3PatternNoteStreams(new Uint8Array(goodBytes), edited);
      fail(`${what} was accepted; it must be refused before it reaches the stream.`);
    } catch {
      /* expected */
    }
  };
  refuse({ effectCommand: 0x6, effectParams: null }, 'effect code 6 (no replayer handler)');
  refuse({ effectCommand: 0xf, effectParams: null }, 'effect code F (no replayer handler)');
  refuse({ effectCommand: 0x1, effectParams: '05' }, 'GLISS with 1 payload byte instead of 3');
  refuse({ effectCommand: 0x9, effectParams: '0102' }, 'SPEED with 2 payload bytes instead of 1');
  refuse({ pt3Envelope: '0:0040' }, 'envelope shape 0 (that byte is "envelope off")');
  refuse({ pt3Envelope: '1:0040' }, 'envelope shape 1 (that byte is "note skip")');
  refuse({ pt3Envelope: '9:04B' }, 'envelope period with 3 digits instead of 4');
  refuse({ pt3Envelope: 'nonsense' }, 'unparseable envelope value');
}

if (modulesChecked === 0) {
  fail('no PT3 module could be parsed; the contract checked nothing.');
}
if (failures > 0) {
  console.log(`PT3 effect editing: ${failures} failure(s).`);
  process.exit(1);
}
console.log(
  `PT3 effect editing: ${modulesChecked} modules idempotent and cell-stable, `
  + `${effectEditsChecked} authored / ${effectClearsChecked} cleared effects and `
  + `${envelopesAuthored} authored / ${envelopesCleared} cleared envelopes round-tripped, invalid codes refused.`,
);
