/**
 * Decode both worlds' atlas RLE streams straight out of the generated ASM and
 * report VRAM offsets where they DIFFER.
 *
 * A probe that samples a row both worlds fill with the same flat colour proves
 * nothing, so the hardware check has to aim at a row that can only come from
 * one of them.
 */
import { readFileSync } from 'node:fs';

const asmPath = process.argv[2] || 'test/msx2-boss/out/per_world_atlas.asm';
const asm = readFileSync(asmPath, 'utf8').replace(/\r\n/g, '\n');

/** Text between two markers. indexOf, not a regex: the ASM is ~800k chars and
 *  the lazy `[\s\S]*?` forms silently refuse to match at that size. */
function slice(from, to, startAt = 0) {
  const start = asm.indexOf(from, startAt);
  if (start < 0) throw new Error(`marker not found: ${from.trim()}`);
  const end = asm.indexOf(to, start + from.length);
  if (end < 0) throw new Error(`end marker not found after ${from.trim()}: ${to.trim()}`);
  return asm.slice(start + from.length, end);
}

/** All chunks of one world, decoded into a sparse VRAM map. */
function decodeWorld(worldIndex) {
  const vram = new Map();
  const body = slice(`\nbitmap_upload_tileset_atlas_w${worldIndex}:\n`, '\n    ret\n');
  // Each chunk in the body: label + VRAM bank (ld a, N) + offset (ld de, #XXXX).
  const uploadRe = /ld hl, (\S+)\n\s*ld a, (\d+)\n\s*ld de, #([0-9A-F]{4})/g;
  let match;
  while ((match = uploadRe.exec(body)) !== null) {
    const [, label, bank, offset] = match;
    const base = Number(bank) * 0x4000 + parseInt(offset, 16);
    const data = slice(`\n${label}:\n`, `\n${label}_end:`);
    // Only real data lines: `line.includes('DB')` also swallows comments and
    // any directive that merely mentions DB, which poisons the stream with NaN.
    const bytes = data
      .split('\n')
      .filter(line => /^\s*DB\s+#/.test(line))
      .flatMap(line => line.replace(/^\s*DB\s+/, '').split(',').map(token => parseInt(token.trim().replace('#', ''), 16)));
    if (bytes.some(Number.isNaN)) throw new Error(`${label}: non-hex byte in the RLE stream`);
    if (bytes.length % 2 !== 0) throw new Error(`${label}: odd RLE stream (${bytes.length}); pairs are (count, value)`);
    let cursor = base;
    for (let i = 0; i + 1 < bytes.length; i += 2) {
      for (let k = 0; k < bytes[i]; k++) vram.set(cursor++, bytes[i + 1]);
    }
  }
  return vram;
}

const w0 = decodeWorld(0);
const w1 = decodeWorld(1);
const ATLAS_BASE = 512 * 128;
// Math.max(...keys) blows the call stack on a 26 KB atlas; fold instead.
const topRow = map => {
  let highest = 0;
  for (const key of map.keys()) if (key > highest) highest = key;
  return Math.floor((highest - ATLAS_BASE) / 128) + 512;
};
console.log(`world 0: ${w0.size} bytes uploaded, up to VRAM row ${topRow(w0)}`);
console.log(`world 1: ${w1.size} bytes uploaded, up to VRAM row ${topRow(w1)}`);

// Rows where a 16-byte sample would actually tell the two worlds apart.
const rows = [];
for (let row = 512; row < 512 + 208 && rows.length < 6; row++) {
  const base = row * 128;
  let differs = false;
  for (let i = 0; i < 16; i++) {
    if ((w0.get(base + i) ?? -1) !== (w1.get(base + i) ?? -1)) { differs = true; break; }
  }
  if (!differs) continue;
  const hex = map => Array.from({ length: 16 }, (_unused, i) => {
    const value = map.get(base + i);
    return value === undefined ? '--' : value.toString(16).padStart(2, '0').toUpperCase();
  }).join(' ');
  rows.push(row);
  console.log(`\nrow ${row} DIFFERS`);
  console.log(`  world 0: ${hex(w0)}`);
  console.log(`  world 1: ${hex(w1)}   ('--' = not written by this world)`);
}
if (!rows.length) console.log('\nNo differing row found in the first 208 -- the probe cannot tell the worlds apart.');
else console.log(`\nProbe these rows: ${rows.join(', ')}`);
