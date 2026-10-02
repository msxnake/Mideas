// Contract check: no two LIVE RAM labels of a SCREEN 5 bitmap-room ROM may share an address.
//
// Why: the generator hands out RAM through fixed gap bytes AND a chained cursor, and three
// systems once all claimed #C1FC (hud_hearts_drawn, bitmap_carry_held, bitmap_room_pool_index):
// carry_held read the hearts value and a hearts redraw clobbered the pool index. Nothing failed
// to compile, so nothing noticed. This check generates ASM for several project shapes and fails
// on any address claimed by two distinct live labels.
//
// Rules:
//   - Only `NAME EQU <literal address>` in #C000..#F37F is considered (the cartridge RAM).
//   - `A EQU B` (RHS is another symbol) is an explicit alias, never a collision.
//   - A label is LIVE only if some code/data line (comments stripped) references it besides its
//     own EQU. A dead EQU (e.g. bitmap_room_pool_index with multi-world off) cannot clobber anything.
//   - Intentional literal sharing goes in ALLOWED_SHARING below (a group of labels + the reason).
//   - Limit: compares start addresses only, not multi-byte extents (the per-feature contract
//     checks, e.g. check_infinite_room_contract, cover extents of their own blocks).
import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';

const root = process.cwd();
// Each entry is a GROUP of labels that may share one address on purpose.
const ALLOWED_SHARING = [
  {
    reason: 'the single 15-byte V9938 command scratch every overlay system launches from (#C2C0)',
    labels: [/^hud_cmd_block$/, /^bitmap_[a-z0-9]+_cmd_block$/],
  },
  {
    reason: 'struct base label and its first field (offset 0)',
    labels: [/^bitmap_dlg_cfg$/, /^bitmap_dlg_cfg_box_x$/],
  },
];

async function loadGenerator() {
  const bundle = await esbuild.build({
    entryPoints: [path.join(root, 'utils/msxGenerator/index.ts')],
    bundle: true, platform: 'node', format: 'esm', write: false,
    external: ['react', 'react-dom', '@xyflow/react', 'jszip', 'axios', 'lucide-react', 'twgl.js'],
  });
  return import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
}
const generator = await loadGenerator();
const readJson = rel => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));

function generate(raw, romMode) {
  const realLog = console.log; const realWarn = console.warn;
  console.log = () => {}; console.warn = () => {};
  try {
    const files = generator.generateModularASM(raw.name, raw.assets, {
      generateUnified: true, romMode, targetFormat: 'konami',
      screenMode: raw.screenMode, targetGraphicsBackend: raw.targetGraphicsBackend,
    });
    return (files['unitedFiles.asm'] || files['main.asm']).replace(/\r\n/g, '\n');
  } finally { console.log = realLog; console.warn = realWarn; }
}

/** Returns { collisions: [[addr, [labels]]], live } for one ASM text. */
export function findAliases(asm) {
  const lines = asm.split('\n').map(line => line.replace(/;.*$/, ''));
  const equ = new Map();       // name -> address (literal only)
  const equLine = new Map();   // name -> line index of its EQU
  lines.forEach((line, index) => {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s+EQU\s+(?:#|\$|0x)([0-9A-Fa-f]+)\s*$/);
    if (!m) return;
    const addr = parseInt(m[2], 16);
    if (addr < 0xC000 || addr >= 0xF380) return;
    equ.set(m[1], addr); equLine.set(m[1], index);
  });
  const used = new Set();
  lines.forEach((line, index) => {
    for (const token of line.match(/[A-Za-z_][A-Za-z0-9_]*/g) || []) {
      if (equ.has(token) && equLine.get(token) !== index) used.add(token);
    }
  });
  // An alias (`c EQU a`) counts as a use of `a`, so `a` is live even when only the alias is read.
  const byAddr = new Map();
  for (const [name, addr] of equ) {
    if (!used.has(name)) continue;
    if (!byAddr.has(addr)) byAddr.set(addr, []);
    byAddr.get(addr).push(name);
  }
  const allowed = (a, b) => ALLOWED_SHARING.some(({ labels }) => labels.some(re => re.test(a)) && labels.some(re => re.test(b)));
  const collisions = [];
  for (const [addr, names] of byAddr) {
    const bad = names.filter((a, i) => names.slice(i + 1).some(b => !allowed(a, b)));
    if (names.length > 1 && bad.length) collisions.push([addr, names]);
  }
  return { collisions, live: used.size };
}

// ---- project shapes ----------------------------------------------------------------------
const roomOf = assets => assets.find(asset => asset.id === 'bitmap_room_smoke').data;
const infinite = () => structuredClone(readJson('test/msx2-infinite-room/infinite_fixture.json'));
const cases = [];
// classic hearts HUD + carry_and_throw + infinite room (the shape that exposed the bug)
cases.push(['hearts + carry (infinite fixture)', infinite(), 'simple32k']);
// HUD hidden: hearts are gone, carry may keep #C1FC
{ const raw = infinite(); roomOf(raw.assets).runtime.showHud = false; cases.push(['carry, hearts hidden', raw, 'simple32k']); }
// carry skill off: hearts only
{
  const raw = infinite();
  const player = raw.assets.find(a => a.type === 'msx2player').data;
  player.activeSkills = player.activeSkills.filter(id => id !== 'carry_and_throw');
  cases.push(['hearts only', raw, 'simple32k']);
}
cases.push(['hearts + carry, MegaROM', infinite(), 'megarom']);

// two worlds (multi-world => bitmap_room_pool_index is live), with and without the classic hearts HUD
function twoWorlds(removeLinkedHud) {
  const raw = readJson('test/msx2-boss/fixture_boss_anim_cells.json');
  const assets = raw.assets;
  const flow = assets.find(a => String(a.type || '').toLowerCase().includes('gameflow'));
  const nodes = flow.data.nodes; const connections = flow.data.connections;
  const firstLink = nodes.find(n => n.type === 'WorldLink');
  const worldIdOf = n => n.worldAssetId || n.data?.worldAssetId || n.data?.worldMapId;
  const srcId = worldIdOf(firstLink);
  const src = assets.find(a => a.id === srcId) || (raw.worldmaps || []).find(w => w.id === srcId);
  const clone = structuredClone(src); clone.id = `${srcId}_w2`; if (clone.data) clone.data.id = clone.id;
  if (assets.some(a => a.id === srcId)) assets.push(clone); else (raw.worldmaps = raw.worldmaps || []).push(clone);
  const link2 = structuredClone(firstLink); link2.id = `${firstLink.id}_w2`;
  if (link2.worldAssetId !== undefined) link2.worldAssetId = clone.id;
  if (link2.data) for (const k of ['worldAssetId', 'worldMapId']) if (link2.data[k] !== undefined) link2.data[k] = clone.id;
  nodes.push(link2);
  const out = connections.find(c => c?.from?.nodeId === firstLink.id && !c?.from?.sourceId);
  if (out) { connections.push({ ...structuredClone(out), from: { nodeId: link2.id } }); out.to = { nodeId: link2.id }; }
  else connections.push({ from: { nodeId: firstLink.id }, to: { nodeId: link2.id } });
  if (removeLinkedHud) {
    for (const a of assets) {
      if (a.data?.runtime?.hudAssetId) delete a.data.runtime.hudAssetId;
    }
  }
  return raw;
}
cases.push(['two worlds + hearts, MegaROM', twoWorlds(true), 'megarom']);
cases.push(['two worlds + linked HUD, MegaROM', twoWorlds(false), 'megarom']);

let failed = 0;
for (const [label, raw, mode] of cases) {
  let result;
  try { result = findAliases(generate(raw, mode)); }
  catch (error) { console.log(`FAIL  ${label}: generation threw ${String(error.message).slice(0, 200)}`); failed++; continue; }
  if (result.collisions.length) {
    failed++;
    console.log(`FAIL  ${label}`);
    for (const [addr, names] of result.collisions) console.log(`        #${addr.toString(16).toUpperCase()} shared by ${names.join(', ')}`);
  } else console.log(`OK    ${label} (${result.live} live RAM labels, no aliasing)`);
}
// the checker itself must be able to go red: a synthetic ROM with two live labels on one byte
{
  const synthetic = ['a_flag EQU #C1FC', 'b_flag EQU #C1FC', 'c_alias EQU a_flag', '    ld a, (a_flag)', '    ld (b_flag), a',
    '    ld (c_alias), a', '; dead_flag EQU #C1FC', ''].join('\n');
  const res = findAliases(synthetic);
  const ok = res.collisions.length === 1 && res.collisions[0][1].slice().sort().join() === 'a_flag,b_flag';
  console.log(`${ok ? 'OK  ' : 'FAIL'}  self-test: synthetic alias is detected`);
  if (!ok) failed++;
}
if (failed) { console.error(`\n${failed} check(s) failed`); process.exit(1); }
console.log('\nall RAM aliasing checks passed');
