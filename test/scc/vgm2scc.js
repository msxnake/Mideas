#!/usr/bin/env node
/**
 * vgm2scc.js — convert a VGM/VGZ rip that uses the K051649 (Konami SCC) into
 * compact frame-diff stream data for the Mideas SCC probe driver
 * (test/scc/scc_driver.inc primitives). Study rules honoured:
 *   - registers are written only when they change (frame-state diff)
 *   - waveforms are deduplicated into a table and loaded whole on change
 *   - the Z80 does zero musical math at runtime
 *
 * Stream token format (consumed by scc_vgm_play.asm):
 *   0x00            end of stream -> player loops to start
 *   0x01 n          advance n frames (current frame's writes are done)
 *   0x02 ch lo hi   SCC_SetPeriod  ch=0..4, period=hi<<8|lo (12 bit)
 *   0x03 ch vol     SCC_SetVolume  ch=0..4, vol 0..15
 *   0x04 mask       SCC_SetMixer
 *   0x05 ch idx     SCC_LoadWaveform32 from waveform table entry idx
 *   0x07 off val    raw byte write to #9800+off (partial waveform tweak)
 *
 * Usage: node test/scc/vgm2scc.js <input.vgz|.vgm> <out_basename>
 * Emits <out_basename>.asm (tables) and <out_basename>.waveforms.json.
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const [, , inputPath, outBase] = process.argv;
if (!inputPath || !outBase) {
  console.error('usage: node vgm2scc.js <input.vgz|.vgm> <out_basename>');
  process.exit(1);
}

let buf = fs.readFileSync(inputPath);
if (buf[0] === 0x1f && buf[1] === 0x8b) buf = zlib.gunzipSync(buf);
if (buf.toString('ascii', 0, 4) !== 'Vgm ') {
  console.error('not a VGM file');
  process.exit(1);
}

const version = buf.readUInt32LE(0x08);
const rate = buf.readUInt32LE(0x24) || 60;
const loopOffsetField = buf.readUInt32LE(0x1c);
const loopStart = loopOffsetField ? loopOffsetField + 0x1c : 0;
let dataStart = 0x40;
if (version >= 0x150) {
  const rel = buf.readUInt32LE(0x34);
  if (rel) dataStart = rel + 0x34;
}
const sccClock = buf.length > 0x9c + 4 ? buf.readUInt32LE(0x9c) : 0;

const SAMPLES_PER_FRAME = rate === 50 ? 882 : 735;

// ---- pass 1: replay commands into per-frame chip state snapshots ------------
// Chip shadow: 128 bytes waveform (#9800-#987F), 10 freq, 5 vol, 1 mixer.
const wave = new Uint8Array(128);
const freq = new Uint8Array(10);
const vol = new Uint8Array(5);
let mixer = 0;
const touched = { wave: new Set(), freq: new Set(), vol: new Set(), mixer: false };

const frames = []; // each: {wave:[...changedOffsets], freq:Set, vol:Set, mixer, snapshot}
let sampleAcc = 0;
let pos = dataStart;
let port4Writes = 0;
let testWrites = 0;
let otherChipWrites = 0;
let ended = false;

function flushFramesFromAcc() {
  while (sampleAcc >= SAMPLES_PER_FRAME) {
    sampleAcc -= SAMPLES_PER_FRAME;
    frames.push({
      waveChanges: [...touched.wave],
      freqChanges: [...touched.freq],
      volChanges: [...touched.vol],
      mixerChanged: touched.mixer,
      wave: Uint8Array.from(wave),
      freq: Uint8Array.from(freq),
      vol: Uint8Array.from(vol),
      mixer,
    });
    touched.wave.clear();
    touched.freq.clear();
    touched.vol.clear();
    touched.mixer = false;
  }
}

function sccWrite(port, addr, val) {
  if (port === 0x00) {
    if (addr < 128 && wave[addr] !== val) { wave[addr] = val; touched.wave.add(addr); }
  } else if (port === 0x04) {
    port4Writes++;
    // SCC+ second waveform bank; on SCC original only the ch4/ch5 shared
    // buffer exists. Map ch5 waveform (0x60-0x7F) onto the shared block.
    if (addr >= 0x60 && addr < 0x80 && wave[addr] !== val) { wave[addr] = val; touched.wave.add(addr); }
  } else if (port === 0x01) {
    if (addr < 10 && freq[addr] !== val) { freq[addr] = val; touched.freq.add(addr); }
  } else if (port === 0x02) {
    if (addr < 5) { const v = val & 0x0f; if (vol[addr] !== v) { vol[addr] = v; touched.vol.add(addr); } }
  } else if (port === 0x03) {
    const v = val & 0x1f;
    if (mixer !== v) { mixer = v; touched.mixer = true; }
  } else if (port === 0x05) {
    testWrites++;
  }
}

while (pos < buf.length && !ended) {
  const cmd = buf[pos];
  if (cmd === 0x66) { ended = true; pos += 1; break; }
  else if (cmd === 0x61) { sampleAcc += buf.readUInt16LE(pos + 1); pos += 3; flushFramesFromAcc(); }
  else if (cmd === 0x62) { sampleAcc += 735; pos += 1; flushFramesFromAcc(); }
  else if (cmd === 0x63) { sampleAcc += 882; pos += 1; flushFramesFromAcc(); }
  else if (cmd >= 0x70 && cmd <= 0x7f) { sampleAcc += (cmd & 0x0f) + 1; pos += 1; flushFramesFromAcc(); }
  else if (cmd === 0xd2) { sccWrite(buf[pos + 1], buf[pos + 2], buf[pos + 3]); pos += 4; }
  else if (cmd === 0xa0) { otherChipWrites++; pos += 3; } // AY-3-8910, ignored
  else if (cmd === 0x67) { // data block
    const size = buf.readUInt32LE(pos + 3);
    pos += 7 + size;
  }
  else if (cmd === 0x4f || cmd === 0x50) { otherChipWrites++; pos += 2; }
  else if (cmd >= 0x51 && cmd <= 0x5f) { otherChipWrites++; pos += 3; }
  else if (cmd >= 0x30 && cmd <= 0x3f) { pos += 2; }
  else if (cmd >= 0x40 && cmd <= 0x4e) { pos += 3; }
  else if (cmd >= 0x80 && cmd <= 0x8f) { sampleAcc += cmd & 0x0f; pos += 1; flushFramesFromAcc(); }
  else if (cmd === 0xe0) { pos += 5; }
  else if (cmd >= 0x90 && cmd <= 0x95) { pos += [5, 5, 6, 11, 2, 5][cmd - 0x90]; }
  else if (cmd === 0x68) { pos += 12 + (buf.readUIntLE(pos + 9, 3)); }
  else if (cmd >= 0xb0 && cmd <= 0xbf) { otherChipWrites++; pos += 3; }
  else if (cmd >= 0xc0 && cmd <= 0xdf) { otherChipWrites++; pos += 4; }
  else if (cmd >= 0xe1) { pos += 5; }
  else {
    console.error(`unknown VGM command 0x${cmd.toString(16)} at 0x${pos.toString(16)} — aborting parse here`);
    break;
  }
}
// trailing partial frame
if (touched.wave.size || touched.freq.size || touched.vol.size || touched.mixer) {
  sampleAcc += SAMPLES_PER_FRAME;
  flushFramesFromAcc();
}

// ---- pass 2: build waveform table + token stream ----------------------------
const CH_WAVE_BASE = [0x00, 0x20, 0x40, 0x60]; // ch5 shares 0x60
const waveTable = []; // array of 32-byte arrays (hex key dedup)
const waveKeyToIdx = new Map();

function waveIdxFor(block) {
  const key = Buffer.from(block).toString('hex');
  if (waveKeyToIdx.has(key)) return waveKeyToIdx.get(key);
  const idx = waveTable.length;
  waveTable.push(Array.from(block));
  waveKeyToIdx.set(key, idx);
  return idx;
}

const stream = [];
const stats = { period: 0, volume: 0, mixer: 0, waveLoad: 0, rawByte: 0, waitTokens: 0 };
// player-side shadow to compute frame-to-frame diffs
const pWave = new Uint8Array(128).fill(0xaa); // force initial load
const pFreq = new Uint8Array(10).fill(0xff);
const pVol = new Uint8Array(5).fill(0xff);
let pMixer = -1;
let pendingWait = 0;

for (const f of frames) {
  const tokens = [];
  // waveforms first: whole-block loads when a channel block changed
  for (let ch = 0; ch < 4; ch++) {
    const base = CH_WAVE_BASE[ch];
    const cur = f.wave.subarray(base, base + 32);
    let changed = false;
    for (let i = 0; i < 32; i++) if (pWave[base + i] !== cur[i]) { changed = true; break; }
    if (!changed) continue;
    let diffCount = 0;
    for (let i = 0; i < 32; i++) if (pWave[base + i] !== cur[i]) diffCount++;
    if (diffCount > 4) {
      tokens.push(0x05, ch, waveIdxFor(cur));
      stats.waveLoad++;
    } else {
      for (let i = 0; i < 32; i++) {
        if (pWave[base + i] !== cur[i]) { tokens.push(0x07, base + i, cur[i]); stats.rawByte++; }
      }
    }
    for (let i = 0; i < 32; i++) pWave[base + i] = cur[i];
  }
  // periods: emit one SetPeriod per channel whose lo or hi changed
  for (let ch = 0; ch < 5; ch++) {
    const lo = f.freq[ch * 2], hi = f.freq[ch * 2 + 1] & 0x0f;
    if (pFreq[ch * 2] !== lo || pFreq[ch * 2 + 1] !== hi) {
      tokens.push(0x02, ch, lo, hi);
      pFreq[ch * 2] = lo; pFreq[ch * 2 + 1] = hi;
      stats.period++;
    }
  }
  // volumes
  for (let ch = 0; ch < 5; ch++) {
    if (pVol[ch] !== f.vol[ch]) { tokens.push(0x03, ch, f.vol[ch]); pVol[ch] = f.vol[ch]; stats.volume++; }
  }
  // mixer last (acts as key on/off)
  if (pMixer !== f.mixer) { tokens.push(0x04, f.mixer); pMixer = f.mixer; stats.mixer++; }

  if (tokens.length === 0) {
    pendingWait++;
  } else {
    // close previous gap, then this frame's writes, then a 1-frame advance
    while (pendingWait > 0) {
      const n = Math.min(pendingWait, 255);
      stream.push(0x01, n); stats.waitTokens++;
      pendingWait -= n;
    }
    stream.push(...tokens);
    pendingWait = 1;
  }
}
while (pendingWait > 0) {
  const n = Math.min(pendingWait, 255);
  stream.push(0x01, n); stats.waitTokens++;
  pendingWait -= n;
}
stream.push(0x00);

// ---- emit -------------------------------------------------------------------
function dbLines(bytes, perLine = 16) {
  const lines = [];
  for (let i = 0; i < bytes.length; i += perLine) {
    lines.push('    db ' + bytes.slice(i, i + perLine).map(b => '#' + b.toString(16).toUpperCase().padStart(2, '0')).join(', '));
  }
  return lines.join('\n');
}

const trackName = path.basename(inputPath);
const asm = `; Generated by test/scc/vgm2scc.js — DO NOT EDIT
; Source: ${trackName}
; VGM version #${version.toString(16)}, rate ${rate} Hz, SCC clock ${sccClock}
; Frames: ${frames.length} (~${(frames.length / rate).toFixed(1)}s), waveforms: ${waveTable.length}, stream bytes: ${stream.length}
scc_wave_count:
    db ${waveTable.length}
scc_wave_table:
${waveTable.map((w, i) => `; waveform ${i}\n${dbLines(w)}`).join('\n')}
scc_stream:
${dbLines(stream)}
`;
fs.writeFileSync(outBase + '.asm', asm);
fs.writeFileSync(outBase + '.waveforms.json', JSON.stringify({
  source: trackName,
  rate,
  sccClock,
  frames: frames.length,
  waveforms: waveTable.map((w, i) => ({
    index: i,
    // canonical signed form for the future Mideas instrument model
    samplesSigned: w.map(v => (v << 24) >> 24),
  })),
}, null, 2));

console.log(JSON.stringify({
  track: trackName,
  vgmVersion: '0x' + version.toString(16),
  rate,
  sccClock,
  frames: frames.length,
  seconds: +(frames.length / rate).toFixed(1),
  waveforms: waveTable.length,
  streamBytes: stream.length,
  waveTableBytes: waveTable.length * 32,
  totalDataBytes: stream.length + waveTable.length * 32 + 1,
  loopStartByte: loopStart,
  port4Writes_sccPlus: port4Writes,
  testWrites,
  otherChipWrites_ignored: otherChipWrites,
  stats,
}, null, 2));
