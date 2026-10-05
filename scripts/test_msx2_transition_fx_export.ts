// Contract test for the Transition FX ROM exporter (data/ASM side; the interpreter itself runs in OpenMSX in
// scripts/check_msx2_transition_fx_smoke.mjs and the compiler/decoder in scripts/test_msx2_transition_fx.ts).
// Run: npx tsx scripts/test_msx2_transition_fx_export.ts
//
// Part A drives buildBitmapTransitionFx directly (layout, guards, contract headers).
// Part B drives the whole generator over the smoke fixture (test/msx2-transition-fx/out/fixture_fx.json, built by
//   scripts/build_msx2_transition_fx_test_project.ts), starting from the AUTHORED JSON (a Screen5Presentation node with
//   `fxAssetId`) and checking what comes out: the seam from user data to ROM, not only the functions after the flag.
// Part C proves the walker and the strict presentation backend ignore `fxAssetId` (same ASM, plus a warning).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BITMAP_FX_CODE_BYTES_ESTIMATE,
  BITMAP_FX_RAM_BASE,
  buildBitmapTransitionFx,
  EMPTY_BITMAP_FX_BUILD,
  validateBitmapFxBlock,
} from '../utils/msxGenerator/generators/msx2/msx2BitmapTransitionFxGenerator';
import { generateModularASM } from '../utils/msxGenerator';
import { assembleFxBlock } from '../utils/msx2TransitionFx';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------------------------------------------------------
// Part A: buildBitmapTransitionFx
// ---------------------------------------------------------------------------------------------------------------
const block = (size: number, key = 'k') => ({ key, name: `Effect ${key}`, bytes: new Uint8Array(size).fill(0) });
const build = (blocks = [block(100)], over: Partial<Parameters<typeof buildBitmapTransitionFx>[1]> = {}) =>
  buildBitmapTransitionFx(blocks, { firstBank: 4, megaRom: true, introPresent: false, ...over });

// no effect -> nothing at all (this is what keeps ROMs byte-identical)
const none = buildBitmapTransitionFx([], { firstBank: 4, megaRom: true, introPresent: false });
assert.equal(none, EMPTY_BITMAP_FX_BUILD);
assert.equal(none.banksAsm + none.residentAsm + none.equatesAsm, '');

const ok = build();
assert.ok(ok.banksAsm.includes('org #8000') && ok.residentAsm.includes('bitmap_fx_run:'));
assert.equal(ok.indexByKey.get('k'), 0);
assert.equal(ok.lastBank, 4);
assert.ok(/BITMAP_FX_CODE_BANK\s+EQU 4\b/.test(ok.equatesAsm));
assert.ok(ok.banksAsm.includes('bitmap_fx_block_0:') && ok.banksAsm.includes('BITMAP_FX_CODE_BANK_USED_END:'));
assert.deepEqual(ok.banks, [{ bank: 4, kind: 'code' }]);

// two blocks share the bank and get consecutive indices in the order given
const two = build([block(50, 'a'), block(60, 'b')]);
assert.equal(two.indexByKey.get('a'), 0);
assert.equal(two.indexByKey.get('b'), 1);
assert.ok(/bitmap_fx_table:\s+DW bitmap_fx_block_0, bitmap_fx_block_1/.test(two.banksAsm));

// no MegaROM -> clear error, nothing emitted
assert.throws(() => build([block(10)], { megaRom: false }), /MegaROM/);

// the #3F bank is never handed out: starting right before it, the bank skips it
const skip = build([block(10)], { firstBank: 0x3f });
assert.ok(/BITMAP_FX_CODE_BANK\s+EQU 64\b/.test(skip.equatesAsm), 'bank must not be #3F');
assert.ok(skip.banksAsm.includes('Bank 63 reserved'));

// a block that cannot fit next to the interpreter fails with a message that names the bank, not with a Glass error
const room = 0x2000 - BITMAP_FX_CODE_BYTES_ESTIMATE;
assert.doesNotThrow(() => build([block(room - 2)]), 'a block that exactly fits is accepted');
assert.throws(() => build([block(room - 1)]), /interpreter bank/);
assert.throws(() => build(Array.from({ length: 128 }, (_u, i) => block(1, `k${i}`))), /127/);

// the scratch RAM (#E700-#E70B) must not overlap the project's RAM chain; with an Intro the chain must stop at #E600
assert.doesNotThrow(() => build([block(10)], { ramChainEnd: BITMAP_FX_RAM_BASE }));
assert.throws(() => build([block(10)], { ramChainEnd: BITMAP_FX_RAM_BASE + 1 }), /RAM chain/);
assert.doesNotThrow(() => build([block(10)], { ramChainEnd: 0xe600, introPresent: true }));
assert.throws(() => build([block(10)], { ramChainEnd: 0xe601, introPresent: true }), /RAM chain/);

// every routine carries the contract header required by ai/ASM_GUIDELINES.md, and its label follows
const text = `${ok.residentAsm}\n${ok.banksAsm}`;
const routines = [
  'bitmap_fx_run', 'bitmap_fx_main', 'bitmap_fx_end', 'bitmap_fx_op_sync', 'bitmap_fx_op_hmmm', 'bitmap_fx_op_hmmv', 'bitmap_fx_op_pal',
  'bitmap_fx_op_palrun', 'bitmap_fx_op_flip', 'bitmap_fx_op_backdrop', 'bitmap_fx_op_sfx', 'bitmap_fx_op_sfxoff', 'bitmap_fx_op_waitkey',
  'bitmap_fx_tick', 'bitmap_fx_wait_vblank', 'bitmap_fx_wait_ce', 'bitmap_fx_read_key',
  'bitmap_fx_psg_start', 'bitmap_fx_psg_tick', 'bitmap_fx_psg_load_step', 'bitmap_fx_psg_stop',
];
for (const name of routines) {
  const header = new RegExp(`; FUNCTION: ${name}\\n[^]*?\\n${name}:`).exec(text);
  assert.ok(header, `${name} must have a contract header right before its label`);
  assert.ok(/DESTROYS/.test(header![0]), `${name}: the header must say what it DESTROYS`);
  assert.ok(header![0].length < 4000, `${name}: the header must belong to this routine (not span the file)`);
}
// the opcode table names a label per opcode and every one of them exists
const table = /bitmap_fx_ops:\n((?:\s+DW [^\n]+\n)+)/.exec(ok.banksAsm);
assert.ok(table, 'opcode dispatch table present');
const handlers = table![1].replace(/DW/g, '').split(/[\s,]+/).filter(Boolean);
assert.equal(handlers.length, 12, 'one handler per opcode 0..11');
for (const handler of handlers) assert.ok(new RegExp(`\\n${handler}:`).test(ok.banksAsm), `handler ${handler} exists`);
// code hygiene the project rules ask for: no ld a,i / ld a,r, no 16-bit register-to-register LD, jp instead of jr, DI stays
const code = ok.banksAsm.split('\n').filter(line => !line.trim().startsWith(';')).join('\n');
assert.ok(!/\bld\s+a\s*,\s*[ir]\b/i.test(code), 'no ld a,i / ld a,r (errata)');
assert.ok(!/\bld\s+(hl|de|bc)\s*,\s*(hl|de|bc)\b/i.test(code), 'no 16-bit register-to-register LD');
assert.ok(!/\bjr\b|\bdjnz\b/i.test(code), 'jp, never jr/djnz, in generated code');
assert.ok(!/\bei\b/i.test(code), 'the effect runs with interrupts disabled and never enables them');
// the resident trampoline is guarded against crossing #8000
assert.ok(/bitmap_fx_resident_end > #8000\s+ds -1/.test(ok.residentAsm));

// the block checks the interpreter relies on: a good block passes, what it cannot replay is refused by name
const record = [3, 1, 0, 0, 8, 0, 0, 0, 0x3b, 0x24];
const goodBlock = (finalOps: any[] = [{ op: 'END' }]) => assembleFxBlock({
  skippable: true, backdrop: 0, totalFrames: 3, sounds: [[record]],
  mainOps: [{ op: 'PALRUN', first: 0, colors: [[0, 0, 0], [7, 7, 7]] }, { op: 'SFX', id: 0 }, { op: 'SYNC', n: 1 }, { op: 'END' }], finalOps,
});
assert.doesNotThrow(() => validateBitmapFxBlock(goodBlock(), 'E', 'where'));
assert.throws(() => validateBitmapFxBlock(goodBlock([{ op: 'LMMM', sx: 0, sy: 0, dx: 0, dy: 0, w: 4, h: 4, srcPage: 1, dstPage: 0, timp: true }, { op: 'END' }]), 'E', 'where'), /LMMM/);
assert.throws(() => validateBitmapFxBlock(assembleFxBlock({
  skippable: false, backdrop: 0, totalFrames: 1, sounds: [], mainOps: [{ op: 'SFX', id: 3 }, { op: 'END' }],
}), 'E', 'where'), /starts sound 3 but its table has 0/);
assert.throws(() => validateBitmapFxBlock(Uint8Array.from([1, 0, 0, 0, 12, 0, 0, 0, 13, 0, 0, 0, 0x7f]), 'E', 'where'), /malformed/);

// ---------------------------------------------------------------------------------------------------------------
// Part B: the whole generator, from the authored JSON
// ---------------------------------------------------------------------------------------------------------------
const FIXTURE = path.join(ROOT, 'test', 'msx2-transition-fx', 'out', 'fixture_fx.json');
{
  // Always rebuilt (default variant): the smoke's --chain variant writes the same file with a different flow.
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const built = spawnSync(`${npx} tsx scripts/build_msx2_transition_fx_test_project.ts`, [], { cwd: ROOT, stdio: 'pipe', shell: true, maxBuffer: 1 << 28 });
  assert.equal(built.status, 0, `fixture build failed:\n${built.stdout}${built.stderr}`);
}
const fixture = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));

function generate(project: any, romMode: 'megarom' | 'simple32k' = 'megarom'): { asm: string; warnings: string[] } {
  const warnings: string[] = [];
  const realLog = console.log;
  const realWarn = console.warn;
  console.log = () => {};
  console.warn = (...args: unknown[]) => { warnings.push(args.map(String).join(' ')); };
  try {
    const files = generateModularASM(project.name || 'fx', JSON.parse(JSON.stringify(project.assets)), {
      generateUnified: true, romMode, targetFormat: 'konami', screenMode: 'SCREEN 4 (Graphics II)',
    } as any);
    return { asm: files['unitedFiles.asm'] || files['main.asm'], warnings };
  } finally {
    console.log = realLog;
    console.warn = realWarn;
  }
}
const withProject = (edit: (assets: any[], flow: any, presNode: any, fxAsset: any) => void) => {
  const project = JSON.parse(JSON.stringify(fixture));
  const flow = project.assets.find((a: any) => a.type === 'msx2gameflow').data;
  const presNode = flow.nodes.find((n: any) => n.type === 'Screen5Presentation');
  const fxAsset = project.assets.find((a: any) => a.type === 'msx2transition');
  edit(project.assets, flow, presNode, fxAsset);
  return project;
};

// the authored node, untouched, exports an effect
const base = generate(fixture);
assert.ok(base.asm.includes('call bitmap_fx_run'), 'the scene calls the interpreter');
assert.ok(base.asm.includes('bitmap_intro_scene0_fx_done:'));
assert.ok(!base.asm.includes('@@BITMAP_INTRO_RESIDENT@@'), 'the resident marker was substituted');
assert.ok(base.asm.indexOf('bitmap_fx_run:') < base.asm.indexOf('bitmap_resident_end:'), 'the trampoline is part of the resident window');
assert.ok(base.asm.indexOf('BITMAP_FX_CODE_BANK_PHYS_START:') > base.asm.indexOf('bitmap_resident_end:'), 'the bank comes after the resident window');
assert.ok(/@mideas-bank-map .*"kind":"fx-code","endLabel":"BITMAP_FX_CODE_BANK_USED_END"/.test(base.asm), 'the IDE bank map knows the effect bank, with its own kind');
assert.ok(/ld hl, bitmap_intro_scene0_palette\n\s+call bitmap_intro_load_palette\n\s+call bitmap_intro_upload_scene0[^\n]*\n\s+ld a, 0\n\s+call bitmap_fx_run/.test(base.asm), 'palette, upload, then the effect');
assert.ok(/call vdp_write_register\s+; R#7 = the room backdrop/.test(base.asm), 'the room backdrop comes back after the effect');
assert.ok(/ld a, #07\n\s+ld e, #05\n\s+call vdp_write_register\s+; R#7 = the room backdrop/.test(base.asm), 'the restored backdrop is the room one (5 in the fixture)');
// the picture goes to VRAM page 1: the first RLE chunk starts at #8000 (bank 2 of the 16 KB VRAM banks, offset 0)
assert.ok(/bitmap_intro_upload_scene0:\n\s+ld a, \w+_DATA_BANK\n\s+call bitmap_room_select_data_bank_a\n\s+ld hl, bitmap_intro_scene0_rle_chunk_0\n\s+ld a, 2\n\s+ld de, #0000/.test(base.asm), 'the effect picture is uploaded to VRAM #8000 (page 1)');
// the compiler's warnings reach the console, prefixed
assert.ok(base.warnings.some(w => /Transition FX/.test(w) && /no cabe en 1\/60 s/.test(w)), 'effect warnings are reported');

// without the effect nothing of it is emitted, and the picture goes to page 0 as before
const plain = generate(withProject((_a, _f, node) => { delete node.fxAssetId; }));
assert.ok(!/bitmap_fx/i.test(plain.asm), 'no effect -> no trace of it in the ROM');
assert.ok(/bitmap_intro_upload_scene0:\n\s+ld a, \w+_DATA_BANK\n\s+call bitmap_room_select_data_bank_a\n\s+ld hl, bitmap_intro_scene0_rle_chunk_0\n\s+ld a, 0\n\s+ld de, #0000/.test(plain.asm), 'plain scene: page 0 as before');
// (the effect asset stays in the project, unreferenced: dead weight, not an error, and nothing is emitted for it)

// error: the effect needs MegaROM
assert.throws(() => generate(fixture, 'simple32k'), /MegaROM/);
// error: the node names an effect that does not exist
assert.throws(() => generate(withProject((_a, _f, node) => { node.fxAssetId = 'nope'; })), /no such Transition asset/);
// error: the effect was authored for another picture
assert.throws(() => generate(withProject((_a, _f, _n, fx) => { fx.data.sourcePresentationAssetId = 'other_presentation'; })), /authored for the presentation "other_presentation"/);
// error: the effect itself does not compile (two overlapping layers)
assert.throws(() => generate(withProject((_a, _f, _n, fx) => {
  fx.data.layers.push({ id: 'dup', name: 'Dup', rect: { ...fx.data.layers[0].rect } });
})), /cannot be compiled[^]*se solapan/);
// error: a palette Transition right before the effect (fade in / crossfade) already drives the palette
assert.throws(() => generate(withProject((_a, flow, presNode) => {
  const first = { ...JSON.parse(JSON.stringify(presNode)), id: 'gf_first_scene' };
  delete first.fxAssetId;
  first.waitFrames = 1;
  const fade = { id: 'gf_fade_in', type: 'Transition', effect: 'palette_fade_in', durationFrames: 0, position: { x: 0, y: 0 } };
  flow.nodes.push(first, fade);
  // Start -> first -> fade -> presNode(effect)
  const start = flow.connections.find((c: any) => c.to.nodeId === presNode.id);
  start.to.nodeId = first.id;
  flow.connections.push(
    { id: 'c_first_fade', from: { nodeId: first.id }, to: { nodeId: fade.id } },
    { id: 'c_fade_pres', from: { nodeId: fade.id }, to: { nodeId: presNode.id } },
  );
})), /already drives the palette/);
// the first scene already starts on the page the boot cleared; a LATER scene must clear it (the effect composes onto black)
assert.ok(/; Intro scene 0: Back to Mars\n\s+ld hl, bitmap_intro_scene0_palette/.test(base.asm), 'scene 0 pays no second clear');
const chained = generate(withProject((_a, flow, presNode) => {
  const first = { id: 'gf_first', type: 'Screen5Presentation', presentationAssetId: presNode.presentationAssetId, waitForKey: false, waitFrames: 1, position: { x: 0, y: 0 } };
  flow.nodes.push(first);
  const toEffect = flow.connections.find((c: any) => c.to.nodeId === presNode.id);
  toEffect.to.nodeId = first.id;
  flow.connections.push({ id: 'c_first_fx', from: { nodeId: first.id }, to: { nodeId: presNode.id } });
}));
assert.ok(/; Intro scene 1: Back to Mars\n\s+call bitmap_intro_cls[^\n]*\n\s+ld hl, bitmap_intro_scene1_palette\n\s+call bitmap_intro_load_palette\n\s+call bitmap_intro_upload_scene1/.test(chained.asm), 'a later effect scene clears page 0 first');
// warning: an effect on a presentation that is not part of the boot sequence is ignored, loudly
const midflow = generate(withProject((_a, flow) => {
  flow.nodes.push({ id: 'gf_orphan_scene', type: 'Screen5Presentation', presentationAssetId: flow.nodes.find((n: any) => n.type === 'Screen5Presentation').presentationAssetId, fxAssetId: 'msx2transition_smoke', position: { x: 0, y: 0 } });
}));
assert.ok(midflow.warnings.some(w => /gf_orphan_scene/.test(w) && /not part of the boot sequence/.test(w)));

// ---------------------------------------------------------------------------------------------------------------
// Part C: the other SCREEN 5 backends ignore the property: same ASM, a warning
// ---------------------------------------------------------------------------------------------------------------
for (const [label, file] of [
  ['walker', 'test/msx2-gameflow/screen5_gameflow_menu_project.json'],
  ['strict presentation backend', 'test/msx2-gameflow/screen5_presentation_flow_project.json'],
] as const) {
  const project = JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
  const without = generate(project, 'simple32k');
  const edited = JSON.parse(JSON.stringify(project));
  let tagged = 0;
  for (const asset of edited.assets) {
    if (asset.type !== 'msx2gameflow') continue;
    for (const node of asset.data.nodes) if (node.type === 'Screen5Presentation') { node.fxAssetId = 'msx2transition_smoke'; tagged++; }
  }
  assert.ok(tagged > 0, `${label}: the fixture has a Screen5Presentation node`);
  const withFx = generate(edited, 'simple32k');
  assert.equal(withFx.asm, without.asm, `${label}: fxAssetId must not change the ROM`);
  assert.ok(withFx.warnings.some(w => /Transition FX/.test(w) && /static picture/.test(w)), `${label}: must warn that the effect is not played`);
  assert.ok(!without.warnings.some(w => /Transition FX/.test(w)), `${label}: no warning without the property`);
}

console.log('test_msx2_transition_fx_export: all checks passed');
