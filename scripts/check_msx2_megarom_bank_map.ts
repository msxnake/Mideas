// Contract for the IDE's MegaROM bank map (status bar "Bancos" button).
//
//   npx tsx scripts/check_msx2_megarom_bank_map.ts
//
// The map is built from the `; @mideas-bank-map` comment the SCREEN 5 generator writes plus what a
// compile measures. The only independent ground truth is the ROM itself, so every case generates the
// ASM, assembles it with glass.jar and checks the map against the bytes of the ROM: a bank the map
// calls empty must really hold data, and a bank it calls full must really be full.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateModularASM } from '../utils/msxGenerator';
import {
  MEGAROM_BANK_BYTES,
  buildScreen5BankMap,
  parseResidentEndFromSym,
  parseScreen5BankReport,
  paddedRomBankCount,
  parseSymbolTable,
  usedBytesFromRomTail,
  type Screen5BankReport,
} from '../utils/msx2Screen5MemoryBudget';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---- pure logic, no compile -------------------------------------------------------------------

const hexOf = (bytes: number[]) => Buffer.from(bytes).toString('hex');
const bank = (fill: number, dataLength: number) => [...Array(dataLength).fill(0x12), ...Array(MEGAROM_BANK_BYTES - dataLength).fill(fill)];

// trailing #FF, upper and lower case hex, a bank that is entirely padding, a short ROM
assert.equal(usedBytesFromRomTail(hexOf(bank(0xff, 100)), 0, MEGAROM_BANK_BYTES), 100);
assert.equal(usedBytesFromRomTail(hexOf(bank(0xff, 100)).toUpperCase(), 0, MEGAROM_BANK_BYTES), 100);
assert.equal(usedBytesFromRomTail(hexOf(bank(0xff, 0)), 0, MEGAROM_BANK_BYTES), 0);
assert.equal(usedBytesFromRomTail(hexOf([...bank(0xff, 8), ...bank(0xff, 300)]), 1, MEGAROM_BANK_BYTES), 300);
assert.equal(usedBytesFromRomTail(hexOf(bank(0xff, 8)), 1, MEGAROM_BANK_BYTES), undefined);
assert.equal(usedBytesFromRomTail(hexOf(bank(0x00, 8)), 0, MEGAROM_BANK_BYTES), MEGAROM_BANK_BYTES, 'a bank with no #FF tail is full');

// parsing the report out of an ASM header
const report: Screen5BankReport = {
  bankBytes: MEGAROM_BANK_BYTES,
  banks: [
    { bank: 4, kind: 'data', used: 7000, blockCount: 2, blocks: ['a', 'b'] },
    { bank: 5, kind: 'data', used: 8192 },
    // bank 63 (#3F) is skipped by the generator: it must come out as reserved
    { bank: 64, kind: 'music', measure: 'rom-tail' },
    { bank: 65, kind: 'intro-code', endLabel: 'BITMAP_INTRO_CODE_BANK_USED_END', startAddr: 0x8000 },
    { bank: 66, kind: 'intro-image', used: 1234 },
  ],
};
assert.deepEqual(parseScreen5BankReport(`; x\n; @mideas-bank-map ${JSON.stringify(report)}\n; y`), report);
assert.equal(parseScreen5BankReport('; nothing here'), undefined);
assert.equal(parseScreen5BankReport('; @mideas-bank-map {broken'), undefined);

const sym = 'bitmap_resident_end: equ 9F3AH\nBITMAP_INTRO_CODE_BANK_USED_END: equ 8456H\n.local: equ 4000H\n';
const romHex = hexOf([...Array(64 * MEGAROM_BANK_BYTES).fill(0xff), ...bank(0xff, 3218)]);
const map = buildScreen5BankMap(report, {
  residentEnd: parseResidentEndFromSym(sym),
  symbols: parseSymbolTable(sym),
  romHex,
});
assert.equal(map.contentBankCount, 67);
assert.equal(map.bankCount, 128, 'the image is padded up to a power of two');
assert.equal(map.banks.length, 128);
// resident image #4000-#9F3A: banks 0 (#4000) and 1 (#6000) full, bank 2 (#8000) filled up to #9F3A, bank 3 (#A000) empty
assert.deepEqual(map.banks.slice(0, 4).map(b => b.used), [8192, 8192, 0x9F3A - 0x8000, 0]);
assert.equal(map.banks[4].used, 7000);
assert.equal(map.banks[5].used, 8192);
assert.equal(map.banks[6].kind, 'reserved', 'a bank nobody uses is reserved');
assert.equal(map.banks[63].kind, 'reserved', 'bank #3F is reserved');
assert.equal(map.banks[64].used, 3218, 'music is measured from the ROM tail');
assert.equal(map.banks[65].used, 0x8456 - 0x8000, 'the intro code bank is measured from its symbol');
assert.equal(map.banks[66].used, 1234);
// the padding is listed as free banks, except bank #7F which the SCC claims
assert.deepEqual(map.banks[67], { bank: 67, kind: 'free', used: 0 });
assert.deepEqual(map.banks[126], { bank: 126, kind: 'free', used: 0 });
assert.equal(map.banks[127].kind, 'reserved', 'bank #7F is reserved even in the padding');
// the server's own figure wins over the derived one
assert.equal(buildScreen5BankMap(report, { romBanks: 256 }).bankCount, 256);
assert.equal(buildScreen5BankMap(report, { romBanks: 8 }).bankCount, 67, 'a figure below the content is ignored: the image is padded, never cut');

// the server pads to 2^n banks of 8 KB, never below 32 KB
assert.deepEqual([1, 3, 4, 5, 8, 9, 16, 18, 33, 64, 65].map(paddedRomBankCount), [4, 4, 4, 8, 8, 16, 16, 32, 64, 64, 128]);
assert.equal(buildScreen5BankMap({ bankBytes: MEGAROM_BANK_BYTES, banks: [] }, {}).bankCount, 4, 'the four boot banks alone still make a 32 KB ROM');
// without the compile, only what the generator knew is measured; nothing is invented
const blind = buildScreen5BankMap(report, {});
assert.equal(blind.banks[0].used, undefined);
assert.equal(blind.banks[4].used, 7000);
assert.equal(blind.banks[64].used, undefined);
assert.equal(blind.banks[65].used, undefined);
console.log('pure logic: OK');

// ---- against a real compile -------------------------------------------------------------------

// Same injection as scripts/check_msx2_intro_bigproject.mjs: an Intro node between Start and WorldLink.
function addIntroNode(raw: any) {
  const flow = raw.assets.find((a: any) => a.type === 'msx2gameflow').data;
  const world = flow.nodes.find((n: any) => n.type === 'WorldLink');
  const palette = raw.assets.find((a: any) => a.type === 'palette').data.slots;
  raw.assets.push({
    id: 'bank_map_intro', name: 'Bank map intro', type: 'msx2intro',
    data: { id: 'bank_map_intro', name: 'Bank map intro', target: 'MSX2', slides: [{
      id: 's1', name: 'One', backgroundColor: 1, palette, images: [],
      textZones: [{ id: 'z', name: 'Body', rect: { x: 16, y: 150, w: 224, h: 40 }, fg: 15, bg: 1, lineSpacing: 10, charDelayFrames: 2 }],
      steps: [{ id: 'a', zoneId: 'z', text: 'BANK MAP.', clearBefore: true, autoAdvanceFrames: 0 }],
      transitionIn: 'cut', transitionOut: 'cut' }] },
  });
  flow.nodes.push({ id: 'gf_bank_map_intro', type: 'Intro', position: { x: 300, y: 300 }, introAssetId: 'bank_map_intro' });
  for (const c of flow.connections) if (c.to.nodeId === world.id) c.to.nodeId = 'gf_bank_map_intro';
  flow.connections.push({ id: 'bank_map_c', from: { nodeId: 'gf_bank_map_intro' }, to: { nodeId: world.id } });
}

function compileAndCheck(label: string, fixture: string, expectKinds: string[], mutate?: (raw: any) => void) {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, fixture), 'utf8'));
  mutate?.(raw);
  const realLog = console.log;
  const realWarn = console.warn;
  console.log = () => {};
  console.warn = () => {};
  let asm: string;
  try {
    // Same call the IDE makes (measureScreen5MemoryBudget).
    const files = generateModularASM(raw.name || label, raw.assets, {
      generateUnified: true,
      romMode: 'megarom',
      targetFormat: 'konami',
      autoMegaROM: false,
      screenMode: 'SCREEN 4 (Graphics II)',
      targetGraphicsBackend: 'screen5',
    } as any);
    asm = files['unitedFiles.asm'] || files['main.asm'];
  } finally {
    console.log = realLog;
    console.warn = realWarn;
  }

  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'mideas_bankmap_'));
  try {
    const asmPath = path.join(work, 'p.asm');
    const romPath = path.join(work, 'p.rom');
    const symPath = path.join(work, 'p.sym');
    fs.writeFileSync(asmPath, asm);
    execFileSync('java', ['-jar', path.join(ROOT, 'server', 'glass.jar'), '-I', path.join(ROOT, 'server'), asmPath, romPath, symPath], { cwd: ROOT, stdio: 'pipe', maxBuffer: 1 << 28 });
    const rom = fs.readFileSync(romPath);
    const symText = fs.readFileSync(symPath, 'utf8');

    const bankReport = parseScreen5BankReport(asm);
    assert.ok(bankReport, `${label}: the generated ASM carries no bank report`);
    const result = buildScreen5BankMap(bankReport, {
      residentEnd: parseResidentEndFromSym(symText),
      symbols: parseSymbolTable(symText),
      romHex: rom.toString('hex'),
    });

    // Glass writes the unpadded image; the server rounds it up to 2^n banks, which is what the map must show.
    assert.equal(result.contentBankCount, rom.length / MEGAROM_BANK_BYTES, `${label}: content banks must match the ROM image`);
    assert.equal(result.bankCount, paddedRomBankCount(rom.length / MEGAROM_BANK_BYTES), `${label}: bank count must be the padded ROM size`);
    assert.ok((result.bankCount & (result.bankCount - 1)) === 0, `${label}: ${result.bankCount} banks is not a power of two`);
    const kinds = new Set(result.banks.map(b => b.kind));
    for (const kind of expectKinds) assert.ok(kinds.has(kind as any), `${label}: expected a "${kind}" bank, got ${[...kinds].join(',')}`);

    let checked = 0;
    for (const entry of result.banks.filter(candidate => candidate.bank >= result.contentBankCount)) {
      assert.ok(entry.kind === 'free' || entry.kind === 'reserved', `${label}: padding bank ${entry.bank} must be free or SCC-reserved, got ${entry.kind}`);
    }
    for (const entry of result.banks.slice(0, result.contentBankCount)) {
      const bytes = rom.subarray(entry.bank * MEGAROM_BANK_BYTES, (entry.bank + 1) * MEGAROM_BANK_BYTES);
      let tail = 0;
      while (tail < bytes.length && bytes[bytes.length - 1 - tail] === 0xff) tail++;
      const truth = bytes.length - tail;
      if (entry.kind === 'reserved') {
        assert.equal(truth, 0, `${label}: reserved bank ${entry.bank} must be all #FF`);
        continue;
      }
      assert.notEqual(entry.used, undefined, `${label}: bank ${entry.bank} (${entry.kind}) was not measured`);
      // The generator/symbol figure counts every byte it wrote, so it may exceed the ROM-tail figure only when
      // the data itself ends in #FF; it can never be smaller.
      assert.ok(entry.used! >= truth, `${label}: bank ${entry.bank} (${entry.kind}) says ${entry.used} used but the ROM has ${truth} non-#FF bytes`);
      assert.ok(entry.used! - truth <= 16, `${label}: bank ${entry.bank} (${entry.kind}) says ${entry.used} used but the ROM only has ${truth} (a padded bank is reported full)`);
      checked++;
    }
    const resident = result.banks.slice(0, 4).reduce((total, b) => total + (b.used ?? 0), 0);
    assert.equal(resident, parseResidentEndFromSym(symText)! - 0x4000, `${label}: banks 0-3 must add up to the resident image`);
    console.log(`${label}: OK (${result.contentBankCount} banks of content padded to ${result.bankCount}, ${checked} measured against the ROM; kinds: ${[...kinds].join(', ')})`);
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

compileAndCheck('boss + PT3 music', 'test/msx2-boss/fixture_test606.json', ['resident', 'data', 'music']);
compileAndCheck('Intro node', 'test/msx2-boss/fixture_test606.json', ['resident', 'data', 'music', 'intro-code'], addIntroNode);
console.log('RESULT PASS');
