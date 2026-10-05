#!/usr/bin/env node
/**
 * In-memory fixtures for the "move the SCREEN 5 transition engine (bitmap_tfx_*) to a bank" task
 * (docs/msx/MSX2_TFX_BANK_PLAN.md, sections 5(b) and 6/F0).
 *
 * Nothing here is ever written to a versioned file: every case is produced by loading a VERSIONED
 * project JSON and mutating its GameFlow in memory. test719 (152 MB, not versioned, lives in
 * Downloads) is parsed on demand and never copied. Used by scripts/build_tfx_bank_reference.mjs
 * (library import) and runnable by hand:
 *
 *   node scripts/build_tfx_bank_parity_fixtures.mjs --list             case table (id, group, flow, effect, ROM mode)
 *   node scripts/build_tfx_bank_parity_fixtures.mjs --selftest         builds every SMALL case in memory and asserts
 *                                                                      its GameFlow walks the intended node chain
 *   node scripts/build_tfx_bank_parity_fixtures.mjs --selftest --all   same, including the test719 variants
 *                                                                      (needs: node --max-old-space-size=8192)
 *
 * Environment: TEST719_JSON overrides the location of test719.json.
 *
 * Cases (what each one exercises in the transition engine call sites of plan section 3):
 *   A  boot intro, no music, Konami MegaROM. Base test/msx2-bitmap-intro/bitmap_intro_test.json.
 *      Start -> Screen5Presentation -> Transition(effect) -> WorldLink -> End.
 *      The transition is consumed by the intro scene (run_bitmap_intro, site A of the plan).
 *      A_control_legacy: the UNMODIFIED fixture in MegaROM (old routine, no engine) = byte-identical guard.
 *      A_simple32k_pattern: the same fixture in simple32k with a pattern dissolve (plan 5(a): ASM must stay identical).
 *   B  boot intro with a PT3 track in the ROM. Base test/msx2-lighting/nuts_torchoff.json + the presentation
 *      asset of bitmap_intro_test (as scripts/check_msx2_gameflow_menu_music.mjs does for music_trans).
 *      Start -> Screen5Presentation -> Music -> Transition(effect) -> SubMenu -> WorldLink -> End: the same
 *      Presentation -> Music -> Transition order as test719. resolveBitmapIntroScenes walks through the
 *      Music node, so the transition still plays inside run_bitmap_intro, BEFORE the song starts, but with the
 *      music runtime already initialised (waits call music_update through bitmap_flow_wait_vblank).
 *   C  dispatcher with the PT3 track playing: nuts_torchoff, Start -> Music -> Transition(effect) -> WorldLink
 *      -> End (site B of the plan; the transition node is a dispatcher `case 'Transition'`).
 *      Every effect (the 8 test719 can hold today, plus diagonal and iris) and palette_fade_out.
 *      C_scc_wipe / B_scc_wipe: the same two shapes with the compact SCC tracker track of the versioned
 *      test/scc/scc_mideas_integration.json instead of the PT3 one (the SCC driver moves P2/P3, which is what a
 *      banked engine has to survive; plan 5(c)).
 *   D  dispatcher after a game: nuts_torchoff WITHOUT the track (silent), Start -> WorldLink ->
 *      Transition(effect) -> End. The TCL smoke has to set bitmap_gameflow_exit_flag to leave the game.
 *   T719_*  the real project: the Transition node of the Main MSX2 flow set to each effect in turn, or bridged
 *      out (Music -> Intro directly).
 *
 * Every effect case carries the same node parameters as test719 (durationFrames 30, reverse true): that is
 * what routes the four legacy pixel wipes through the engine, exactly as in the project that overflows.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const FIXTURE_PATHS = {
  introTest: path.join(ROOT, 'test', 'msx2-bitmap-intro', 'bitmap_intro_test.json'),
  nutsTorchoff: path.join(ROOT, 'test', 'msx2-lighting', 'nuts_torchoff.json'),
  sccIntegration: path.join(ROOT, 'test', 'scc', 'scc_mideas_integration.json'),
  test719: process.env.TEST719_JSON || 'C:/Users/salam/Downloads/test719.json',
};

/** Node parameters of the Transition node in test719 (they route the legacy wipes through the engine). */
export const TFX_NODE_PARAMS = Object.freeze({ durationFrames: 30, reverse: true });

/** short name -> Transition `effect`. The first 8 are the ones test719 can hold today (plan section 1). */
export const EFFECTS = Object.freeze({
  cls: 'cls',
  fade_to_black: 'fade_to_black',
  vertical: 'screen5_vertical_pixel_wipe',
  horizontal: 'screen5_horizontal_pixel_wipe',
  mirror: 'screen5_mirror_pixel_wipe',
  blinds: 'screen5_blinds',
  pattern: 'screen5_pattern',
  wipe: 'screen5_wipe',
  diagonal: 'screen5_diagonal_pixel_wipe',
  iris: 'screen5_iris',
  palette_fade_out: 'palette_fade_out',
});
export const TEST719_FITTING_EFFECTS = ['cls', 'fade_to_black', 'vertical', 'horizontal', 'mirror', 'blinds', 'pattern', 'wipe'];
const SAMPLE_EFFECTS = ['diagonal', 'blinds', 'wipe'];
const DISPATCHER_ALL = ['cls', 'fade_to_black', 'vertical', 'horizontal', 'mirror', 'blinds', 'pattern', 'wipe', 'diagonal', 'iris', 'palette_fade_out'];

/** Node of the "Main MSX2" flow the test719 transition lives in. */
export const TEST719_FLOW_ID = 'asset_bitmapPlatform_gameflow_1781954607779';

// ---------------------------------------------------------------------------
// Case table
// ---------------------------------------------------------------------------

/**
 * expectsTfx: the generated ASM must contain the shared transition engine (`bitmap_tfx_play:`);
 * cls / fade_to_black keep their old routines, and the unmodified / bridged cases have no engine at all.
 * @type {Array<{id:string, group:string, kind:'small'|'test719', base:string, effect?:string, romMode:'megarom'|'simple32k', chain:string[], blurb:string, variant?:string, expectsTfx:boolean, expectsMusic?:'none'|'pt3'|'scc', scc?:boolean}>}
 */
export const CASES = [];
const add = def => CASES.push({
  ...def,
  expectsTfx: Boolean(def.effect) && !['cls', 'fade_to_black'].includes(def.effect),
  // Music runtime the ASM must carry (checked by the reference script); test719 is not pinned.
  expectsMusic: def.group === 'A' || def.group === 'D' ? 'none' : def.group === 'T719' ? undefined : def.scc ? 'scc' : 'pt3',
});

add({
  id: 'A_control_legacy', group: 'A', kind: 'small', base: 'introTest', romMode: 'megarom',
  chain: ['Start', 'Screen5Presentation', 'Transition:screen5_vertical_pixel_wipe', 'WorldLink', 'End'],
  blurb: 'unmodified bitmap_intro_test in MegaROM: legacy wipe routine, no engine (ROM must not move)',
});
for (const short of SAMPLE_EFFECTS) {
  add({
    id: `A_${short}`, group: 'A', kind: 'small', base: 'introTest', romMode: 'megarom', effect: short,
    chain: ['Start', 'Screen5Presentation', `Transition:${EFFECTS[short]}`, 'WorldLink', 'End'],
    blurb: `boot intro consumes the ${short} transition (run_bitmap_intro), MegaROM, no music`,
  });
}
add({
  id: 'A_simple32k_pattern', group: 'A', kind: 'small', base: 'introTest', romMode: 'simple32k', effect: 'pattern',
  chain: ['Start', 'Screen5Presentation', 'Transition:screen5_pattern', 'WorldLink', 'End'],
  blurb: 'pattern dissolve in a plain 32 KB ROM (plan 5(a): the ASM must stay identical)',
});
for (const short of SAMPLE_EFFECTS) {
  add({
    id: `B_${short}`, group: 'B', kind: 'small', base: 'nutsTorchoff', romMode: 'megarom', effect: short,
    chain: ['Start', 'Screen5Presentation', 'Music', `Transition:${EFFECTS[short]}`, 'SubMenu', 'WorldLink', 'End'],
    blurb: `boot intro ${short} with PT3 initialised (Presentation -> Music -> Transition, like test719)`,
  });
}
for (const short of DISPATCHER_ALL) {
  add({
    id: `C_${short}`, group: 'C', kind: 'small', base: 'nutsTorchoff', romMode: 'megarom', effect: short,
    chain: ['Start', 'Music', `Transition:${EFFECTS[short]}`, 'WorldLink', 'End'],
    blurb: `dispatcher ${short} between the Music node (song playing) and the game`,
  });
}
for (const short of SAMPLE_EFFECTS) {
  add({
    id: `D_${short}`, group: 'D', kind: 'small', base: 'nutsTorchoff', romMode: 'megarom', effect: short,
    chain: ['Start', 'WorldLink', `Transition:${EFFECTS[short]}`, 'End'],
    blurb: `dispatcher ${short} after the game (silent ROM)`,
  });
}
add({
  id: 'B_scc_wipe', group: 'B', kind: 'small', base: 'nutsTorchoff', romMode: 'megarom', effect: 'wipe', scc: true,
  chain: ['Start', 'Screen5Presentation', 'Music', 'Transition:screen5_wipe', 'SubMenu', 'WorldLink', 'End'],
  blurb: 'boot intro wipe with the SCC driver initialised (test/scc/scc_mideas_integration.json track)',
});
add({
  id: 'C_scc_wipe', group: 'C', kind: 'small', base: 'nutsTorchoff', romMode: 'megarom', effect: 'wipe', scc: true,
  chain: ['Start', 'Music', 'Transition:screen5_wipe', 'WorldLink', 'End'],
  blurb: 'dispatcher wipe between the Music node (SCC song playing) and the game',
});
const T719_CHAIN_HEAD = ['Start', 'Screen5Presentation', 'Music'];
const T719_CHAIN_TAIL = ['Intro', 'SubMenu', 'WorldLink', 'Restart'];
add({
  id: 'T719_bridged', group: 'T719', kind: 'test719', base: 'test719', romMode: 'megarom', variant: 'bridged',
  chain: [...T719_CHAIN_HEAD, ...T719_CHAIN_TAIL],
  blurb: 'test719 with the Transition node removed (Music -> Intro directly): the 1.120 B free baseline',
});
for (const short of [...TEST719_FITTING_EFFECTS, 'diagonal', 'iris']) {
  add({
    id: `T719_${short}`, group: 'T719', kind: 'test719', base: 'test719', romMode: 'megarom', effect: short, variant: short,
    chain: [...T719_CHAIN_HEAD, `Transition:${EFFECTS[short]}`, ...T719_CHAIN_TAIL],
    blurb: short === 'diagonal'
      ? 'test719 AS SHIPPED (diagonal wipe): does not fit today'
      : `test719 with the Transition node set to ${EFFECTS[short]}`,
  });
}

export function findCase(id) {
  const found = CASES.find(item => item.id === id);
  if (!found) throw new Error(`unknown case "${id}". Known: ${CASES.map(item => item.id).join(', ')}`);
  return found;
}

// ---------------------------------------------------------------------------
// GameFlow helpers
// ---------------------------------------------------------------------------

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));

function mainFlow(project) {
  const flows = project.assets.filter(asset => asset.type === 'msx2gameflow');
  const flow = flows.find(asset => asset.name === 'Main MSX2') || flows[0];
  if (!flow?.data) throw new Error('fixture has no msx2gameflow asset');
  return flow.data;
}

function nodeOfType(flow, type, label = type) {
  const found = flow.nodes.find(node => node.type === type);
  if (!found) throw new Error(`fixture flow has no ${label} node`);
  return found;
}

/** Node chain a player walks from Start (first option of a SubMenu, default port elsewhere): ['Start', 'Transition:screen5_wipe', ...]. */
export function walkFlow(flow) {
  const byId = new Map(flow.nodes.map(node => [node.id, node]));
  const out = [];
  const seen = new Set();
  let current = flow.nodes.find(node => node.type === 'Start');
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    out.push(current.type === 'Transition' ? `Transition:${current.effect}` : current.type);
    const outgoing = (flow.connections || []).filter(connection => connection.from.nodeId === current.id);
    const link = current.type === 'SubMenu'
      ? outgoing.find(connection => connection.from.sourceId === current.options?.[0]?.id)
      : outgoing.find(connection => !connection.from.sourceId);
    current = link ? byId.get(link.to.nodeId) : undefined;
  }
  return out;
}

/** Rebuild flow.nodes / flow.connections as a straight chain (SubMenu START option continues the chain). */
function setChain(flow, chain) {
  flow.nodes = chain;
  flow.connections = [];
  chain.slice(0, -1).forEach((node, index) => {
    const link = { id: `tfxbank_c${index}`, from: { nodeId: node.id }, to: { nodeId: chain[index + 1].id } };
    if (node.type === 'SubMenu') link.from.sourceId = node.options[0].id;
    flow.connections.push(link);
  });
}

const transitionNode = (id, shortEffect) => {
  const effect = EFFECTS[shortEffect];
  const node = { id, type: 'Transition', position: { x: 300, y: 90 }, effect, ...TFX_NODE_PARAMS };
  // A palette fade-out needs a colour; the legacy and fill effects use their defaults (as in test719).
  if (shortEffect === 'palette_fade_out') Object.assign(node, { fadeColor: { r: 0, g: 0, b: 0 }, framesPerStep: 2 });
  return node;
};

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

function buildA(def) {
  const project = readJson(FIXTURE_PATHS.introTest);
  const flow = mainFlow(project);
  const node = flow.nodes.find(item => item.id === 'gf_intro_transition_node');
  if (!node) throw new Error('bitmap_intro_test lost its gf_intro_transition_node');
  if (def.effect) {
    // Only the effect and the test719 parameters change; x/y and the id stay as in the fixture.
    const next = transitionNode(node.id, def.effect);
    delete next.position;
    for (const key of Object.keys(node)) if (!['id', 'type', 'x', 'y'].includes(key)) delete node[key];
    Object.assign(node, next);
    if (def.effect === 'pattern') Object.assign(node, { patternId: 'checker', blockSize: 8 });
  }
  return project;
}

function buildNuts(def, { music, presentation }) {
  const project = readJson(FIXTURE_PATHS.nutsTorchoff);
  if (def.scc) {
    // Swap the PT3 track for the versioned SCC integration track and point the existing Music node at it.
    const scc = readJson(FIXTURE_PATHS.sccIntegration).assets.find(asset => asset.type === 'track');
    if (!scc) throw new Error('scc_mideas_integration.json has no track asset');
    project.assets = project.assets.filter(asset => asset.type !== 'track');
    project.assets.push(scc);
    nodeOfType(mainFlow(project), 'Music').trackAssetId = scc.id;
  }
  const flow = mainFlow(project);
  const start = nodeOfType(flow, 'Start');
  const world = nodeOfType(flow, 'WorldLink');
  const end = nodeOfType(flow, 'End');
  const musicNode = nodeOfType(flow, 'Music');
  const chain = [start];
  if (presentation) {
    const source = readJson(FIXTURE_PATHS.introTest).assets.find(asset => asset.type === 'msx2presentation');
    if (!source) throw new Error('bitmap_intro_test has no msx2presentation asset');
    project.assets.push(source);
    chain.push({ id: 'tfxbank_pres', type: 'Screen5Presentation', position: { x: 150, y: 90 }, presentationAssetId: source.id, waitForKey: false, waitFrames: 20 });
  }
  if (music) chain.push(musicNode);
  const effectNode = transitionNode('tfxbank_trans', def.effect);
  if (def.group === 'D') {
    chain.push(world, effectNode, end);
  } else {
    chain.push(effectNode);
    if (presentation) {
      chain.push({
        id: 'tfxbank_menu', type: 'SubMenu', position: { x: 600, y: 90 }, title: 'MENU',
        options: [{ id: 'opt_start', text: 'START GAME' }, { id: 'opt_other', text: 'OPTIONS' }],
      });
    }
    chain.push(world, end);
  }
  setChain(flow, chain);
  if (!music) project.assets = project.assets.filter(asset => asset.type !== 'track');
  return project;
}

function buildTest719(def) {
  const project = readJson(FIXTURE_PATHS.test719);
  const flowAsset = project.assets.find(asset => asset.id === TEST719_FLOW_ID);
  if (!flowAsset?.data) throw new Error(`test719 has no flow asset ${TEST719_FLOW_ID}`);
  const flow = flowAsset.data;
  const transition = nodeOfType(flow, 'Transition');
  if (def.variant === 'bridged') {
    const music = nodeOfType(flow, 'Music');
    const intro = nodeOfType(flow, 'Intro');
    flow.nodes = flow.nodes.filter(node => node.id !== transition.id);
    flow.connections = flow.connections.filter(connection => connection.from.nodeId !== transition.id && connection.to.nodeId !== transition.id);
    flow.connections.push({ id: 'tfxbank_bridge', from: { nodeId: music.id }, to: { nodeId: intro.id } });
  } else if (def.variant !== 'diagonal') {
    // `diagonal` is the node exactly as shipped; every other effect changes ONLY the effect field.
    transition.effect = EFFECTS[def.variant];
  }
  return project;
}

/**
 * Builds a case in memory. Returns { project, name, config } ready for
 * generator.generateModularASM(name, project.assets, config).
 */
export function buildCase(id) {
  const def = findCase(id);
  let project;
  switch (def.group) {
    case 'A': project = buildA(def); break;
    case 'B': project = buildNuts(def, { music: true, presentation: true }); break;
    case 'C': project = buildNuts(def, { music: true, presentation: false }); break;
    case 'D': project = buildNuts(def, { music: false, presentation: false }); break;
    case 'T719': project = buildTest719(def); break;
    default: throw new Error(`no builder for group ${def.group}`);
  }
  const walked = walkFlow(mainFlow(project));
  if (JSON.stringify(walked) !== JSON.stringify(def.chain)) {
    throw new Error(`${id}: the GameFlow walks ${JSON.stringify(walked)} but the case promises ${JSON.stringify(def.chain)}`);
  }
  const config = {
    generateUnified: true,
    romMode: def.romMode,
    targetFormat: 'konami',
    autoMegaROM: def.romMode === 'megarom',
    screenMode: project.screenMode || project.currentScreenMode || 'SCREEN 4 (Graphics II)',
    targetGraphicsBackend: project.targetGraphicsBackend || undefined,
  };
  return { def, project, name: def.group === 'T719' ? 'test719' : id, config };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  if (args.includes('--list')) {
    for (const item of CASES) console.log(`${item.id.padEnd(22)} ${item.romMode.padEnd(9)} ${item.chain.join(' > ')}\n${' '.repeat(23)}${item.blurb}`);
  } else if (args.includes('--selftest')) {
    const all = args.includes('--all');
    let bad = 0;
    for (const item of CASES) {
      if (item.kind === 'test719' && !all) continue;
      try {
        const built = buildCase(item.id);
        console.log(`ok   ${item.id.padEnd(22)} ${built.def.chain.join(' > ')}`);
      } catch (error) {
        bad++;
        console.log(`FAIL ${item.id}: ${error.message}`);
      }
    }
    console.log(bad ? `\nRESULT FAIL (${bad})` : '\nRESULT PASS');
    process.exit(bad ? 1 : 0);
  } else {
    console.log('usage: build_tfx_bank_parity_fixtures.mjs --list | --selftest [--all]');
  }
}
