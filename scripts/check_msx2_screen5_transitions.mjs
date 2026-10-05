#!/usr/bin/env node
/**
 * SCREEN 5 GameFlow transitions + SubMenu layout contract.
 *
 * Builds in-memory variants of two tracked fixtures, runs the real generator,
 * checks the emitted ASM and assembles every variant with glass.jar:
 *
 *   - generic GameFlow walker (test/msx2-gameflow/screen5_gameflow_menu_project.json)
 *     with every advanced transition, the scene fade-in / crossfade hooks and
 *     the new SubMenu cursor / layout options;
 *   - strict-shape presentation flow using an advanced effect (must be handed
 *     to the walker);
 *   - bitmap-room runtime (test/msx2-bitmap-intro/bitmap_intro_test.json): engine
 *     transitions inside the boot intro and in the Game Flow dispatcher;
 *   - TextScroll scrollMode 'smooth' (R#23 + raster split) and 'marquee'
 *     (R#26/R#27 on V9958, HMMM on V9938) in the walker and the bitmap room.
 *
 * The ROMs are written to test/msx2-transitions/out/ so they can be opened in
 * openMSX. The Z80 engine itself is checked pixel-by-pixel by
 * test/msx2-transitions/check_tfx_engine.py (needs `pip install z80`).
 *
 *   node scripts/check_msx2_screen5_transitions.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import * as esbuild from 'esbuild';

const root = process.cwd();
const outDir = path.join(root, 'test', 'msx2-transitions', 'out');
fs.mkdirSync(outDir, { recursive: true });

const checks = [];
const check = (name, ok, detail = '') => {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'ok' : 'FAIL'} - ${name}${detail && !ok ? `: ${detail}` : ''}`);
};

async function loadGenerator() {
  const bundle = await esbuild.build({
    entryPoints: [path.join(root, 'utils/msxGenerator/index.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
    logLevel: 'error',
    external: ['react', 'react-dom', '@xyflow/react', 'jszip', 'axios', 'lucide-react', 'twgl.js'],
  });
  return import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
}

const readFixture = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const flowOf = project => project.assets.find(asset => asset.type === 'msx2gameflow').data;

function generate(generator, name, project, romMode = 'simple32k') {
  const realLog = console.log;
  const realWarn = console.warn;
  console.log = () => {};
  console.warn = () => {};
  try {
    const files = generator.generateModularASM(name, project.assets, {
      generateUnified: true,
      romMode,
      targetFormat: 'konami',
      screenMode: project.screenMode || project.currentScreenMode,
      targetGraphicsBackend: project.targetGraphicsBackend || undefined,
    });
    return (files['unitedFiles.asm'] || files['main.asm'] || '').replace(/\r\n/g, '\n');
  } finally {
    console.log = realLog;
    console.warn = realWarn;
  }
}

function assemble(name, asm) {
  const asmPath = path.join(outDir, `${name}.asm`);
  const romPath = path.join(outDir, `${name}.rom`);
  fs.writeFileSync(asmPath, asm);
  try {
    execFileSync('java', ['-jar', path.join(root, 'server', 'glass.jar'), '-I', path.join(root, 'server'), asmPath, romPath], { stdio: 'pipe' });
    if (!fs.existsSync(romPath)) return { ok: false, detail: 'no ROM written' };
    // MegaROMs come out 8KB-aligned (e.g. 56KB); openMSX only auto-detects the
    // Konami mapper on power-of-two sizes, so pad the demo ROMs with #FF.
    const rom = fs.readFileSync(romPath);
    let size = 1;
    while (size < rom.length) size *= 2;
    if (size !== rom.length) fs.writeFileSync(romPath, Buffer.concat([rom, Buffer.alloc(size - rom.length, 0xff)]));
    return { ok: true, detail: '' };
  } catch (error) {
    return { ok: false, detail: String(error.stdout || '') + String(error.stderr || '') };
  }
}

function expectThrows(fn, pattern) {
  try {
    fn();
    return false;
  } catch (error) {
    return pattern.test(String(error?.message || error));
  }
}

const generator = await loadGenerator();

// ---------------------------------------------------------------------------
// 1. Generic walker: every advanced transition + menu layouts
// ---------------------------------------------------------------------------
{
  const project = readFixture('test/msx2-gameflow/screen5_gameflow_menu_project.json');
  const flow = flowOf(project);
  const node = id => flow.nodes.find(item => item.id === id);
  Object.assign(node('gf_wipe_start'), { effect: 'screen5_wipe', direction: 'diagonal_tr', blockSize: 16, fillColorIndex: 3, framesPerStep: 1 });
  Object.assign(node('gf_fade_start'), { effect: 'palette_fade_out_in', fadeColor: { r: 7, g: 7, b: 7 }, framesPerStep: 2 });
  Object.assign(node('gf_wipe_story'), { effect: 'screen5_blinds', direction: 'center_out_v', blockSize: 16, fillColorIndex: 1 });
  Object.assign(node('gf_wipe_credits'), { effect: 'screen5_pattern', patternId: 'custom', blockSize: 8, customPattern: { size: 4, order: [1, 9, 3, 11, 13, 5, 15, 7, 4, 12, 2, 10, 16, 8, 14, 6] } });
  Object.assign(node('gf_wipe_exit'), { effect: 'screen5_iris', irisShape: 'box', direction: 'edges_in_h', fillColorIndex: 2 });
  // story -> crossfade -> title_back ; credits -> fade in -> title_back
  flow.nodes.push(
    { id: 'gf_xfade_story', type: 'Transition', position: { x: 1000, y: 200 }, effect: 'palette_crossfade', framesPerStep: 3 },
    { id: 'gf_fadein_credits', type: 'Transition', position: { x: 1000, y: 340 }, effect: 'palette_fade_in', fadeColor: { r: 0, g: 0, b: 0 } },
    { id: 'gf_flash_menu', type: 'Transition', position: { x: 300, y: 400 }, effect: 'palette_flash', flashCount: 2 },
  );
  const retarget = (from, to) => { flow.connections.find(connection => connection.from.nodeId === from && !connection.from.sourceId).to.nodeId = to; };
  retarget('gf_scroll_story', 'gf_xfade_story');
  retarget('gf_scroll_credits', 'gf_fadein_credits');
  retarget('gf_title', 'gf_flash_menu');
  flow.connections.push(
    { id: 'c_xfade', from: { nodeId: 'gf_xfade_story' }, to: { nodeId: 'gf_title_back' } },
    { id: 'c_fadein', from: { nodeId: 'gf_fadein_credits' }, to: { nodeId: 'gf_title_back' } },
    { id: 'c_flash', from: { nodeId: 'gf_flash_menu' }, to: { nodeId: 'gf_menu' } },
  );

  for (const [variant, menu] of [
    ['walker_arrow_vertical', { cursorStyle: 'arrow_bar', align: 'left', menuX: 60, menuY: 80, optionSpacing: 16, titleY: 40 }],
    ['walker_arrow_horizontal', { cursorStyle: 'arrow', cursorChar: '*', layout: 'horizontal', menuY: 150 }],
  ]) {
    Object.assign(node('gf_menu'), menu);
    const asm = generate(generator, variant, project);
    check(`${variant}: generic walker backend`, asm.includes('Backend: screen5 (gameflow walker)'));
    check(`${variant}: engine runtime emitted`, asm.includes('gf_tfx_play:') && asm.includes('gf_tfx_pal_lerp:') && asm.includes('gf_tfx_pal_set:'));
    check(`${variant}: fill tables emitted`, (asm.match(/^gf_tfx_table_\d+:/gm) || []).length === 4);
    check(`${variant}: solid palettes emitted`, asm.includes('gf_tfx_solid_777:') && asm.includes('gf_tfx_solid_000:'));
    check(`${variant}: scene hook for fade in / crossfade`, asm.includes('GF_TFX_MODE      EQU') && asm.includes('gf_scene_tfx_gf_title_back:') && asm.includes('gf_scene_keep_gf_title_back:') && asm.includes('ld (GF_TFX_MODE), a      ; no scene fade pending at boot'));
    check(`${variant}: page offset passed to the fill engine`, asm.includes('    ld de, GF_PAGE_Y\n    ld hl, gf_tfx_table_'));
    check(`${variant}: menu cursor glyph drawn`, menu.cursorChar ? asm.includes('"* START GAME') : asm.includes('"> START GAME'));
    if (menu.layout === 'horizontal') {
      check(`${variant}: horizontal menu reads left/right`, /gf_menu_loop_gf_menu:[\s\S]*?cp 7\n    jp z, gf_menu_up_gf_menu[\s\S]*?cp 3\n    jp z, gf_menu_down_gf_menu/.test(asm));
    }
    const rom = assemble(variant, asm);
    check(`${variant}: assembles with glass`, rom.ok, rom.detail.slice(0, 400));
  }

  // Fade in must be followed by a presentation.
  const bad = readFixture('test/msx2-gameflow/screen5_gameflow_menu_project.json');
  Object.assign(flowOf(bad).nodes.find(item => item.id === 'gf_wipe_start'), { effect: 'palette_fade_in' });
  check('walker rejects fade in not followed by a presentation', expectThrows(() => generate(generator, 'bad', bad), /must be followed by a SCREEN 5 Presentation/));

  // Horizontal menu overflow is reported.
  const wide = readFixture('test/msx2-gameflow/screen5_gameflow_menu_project.json');
  Object.assign(flowOf(wide).nodes.find(item => item.id === 'gf_menu'), { layout: 'horizontal', cursorStyle: 'arrow_bar', options: [1, 2, 3, 4, 5, 6].map(n => ({ id: ['opt_start', 'opt_story', 'opt_credits', 'opt_exit', 'x5', 'x6'][n - 1], text: `LONG OPTION ${n}` })) });
  check('walker rejects a horizontal menu wider than the screen', expectThrows(() => generate(generator, 'wide', wide), /horizontal options need/));
}

// ---------------------------------------------------------------------------
// 2. Strict-shape presentation flow + advanced effect -> walker
// ---------------------------------------------------------------------------
{
  const project = readFixture('test/msx2-gameflow/screen5_presentation_flow_project.json');
  const flow = flowOf(project);
  // Start -> Screen5Presentation -> Transition -> End (classic strict shape).
  const transition = { id: 'gf_strict_transition', type: 'Transition', position: { x: 0, y: 0 }, effect: 'screen5_pattern', durationFrames: 10 };
  flow.nodes.push(transition);
  const toEnd = flow.connections.find(connection => connection.to.nodeId === 'msx2_gf_end_intro');
  toEnd.to.nodeId = transition.id;
  flow.connections.push({ id: 'c_strict_end', from: { nodeId: transition.id }, to: { nodeId: 'msx2_gf_end_intro' } });
  {
    Object.assign(transition, { effect: 'fade_to_black' });
    const legacy = generate(generator, 'strict_legacy', project);
    check('strict flow with a legacy effect keeps the presentation backend', legacy.includes('msx2_gameflow_run_transition') && !legacy.includes('gf_tfx_'));
    Object.assign(transition, { effect: 'screen5_pattern', patternId: 'bayer4', fillColorIndex: 0 });
    const asm = generate(generator, 'strict_to_walker', project);
    check('strict flow with advanced effect is handed to the walker', asm.includes('Backend: screen5 (gameflow walker)') && asm.includes('gf_tfx_play:'));
    const rom = assemble('strict_to_walker', asm);
    check('strict flow with advanced effect assembles', rom.ok, rom.detail.slice(0, 400));
    // Legacy effect + override also goes through the engine.
    Object.assign(transition, { effect: 'screen5_vertical_pixel_wipe', blockSize: 8, fillColorIndex: 4 });
    const legacyAsm = generate(generator, 'legacy_override', project);
    check('legacy wipe with parameters uses the engine', legacyAsm.includes('gf_tfx_play:') && !legacyAsm.includes('gf_wipe_vertical:'));
  }
}

// ---------------------------------------------------------------------------
// 3. Bitmap-room runtime: intro chain + dispatcher
// ---------------------------------------------------------------------------
{
  const base = () => readFixture('test/msx2-bitmap-intro/bitmap_intro_test.json');

  // 3a. Single intro scene with a pattern dissolve + palette flash after gameplay.
  {
    const project = base();
    const flow = flowOf(project);
    Object.assign(flow.nodes.find(item => item.id === 'gf_intro_transition_node'), { effect: 'screen5_pattern', patternId: 'checker', blockSize: 8 });
    flow.nodes.push({ id: 'gf_over_flash', type: 'Transition', position: { x: 0, y: 0 }, effect: 'palette_fade_out', fadeColor: { r: 7, g: 0, b: 0 } });
    const worldToEnd = flow.connections.find(connection => connection.to.nodeId === 'msx2_gf_end_1781959084375');
    worldToEnd.to.nodeId = 'gf_over_flash';
    flow.connections.push({ id: 'c_over', from: { nodeId: 'gf_over_flash' }, to: { nodeId: 'msx2_gf_end_1781959084375' } });
    const asm = generate(generator, 'bitmap_intro_pattern', project, 'megarom');
    // MegaROM: the HMMV fill player and its tables live in the transition engine bank (bitmap_tfxb_*, org #8000); only the two
    // trampolines (bitmap_tfx_play, bitmap_tfx_frame_wait) stay resident. The assertions below pin that split AND the pacing:
    // every frame the banked player waits goes through bitmap_tfx_frame_wait, which restores the resident banks and then waits.
    const tfxBankStart = asm.indexOf('BITMAP_TFX_CODE_BANK_PHYS_START:');
    const tfxBankEnd = asm.indexOf('BITMAP_TFX_CODE_BANK_USED_END:');
    const tfxBankText = tfxBankStart >= 0 && tfxBankEnd > tfxBankStart ? asm.slice(tfxBankStart, tfxBankEnd) : '';
    check('bitmap: engine bank holds the fill player and the table', tfxBankText.includes('bitmap_tfxb_play:') && tfxBankText.includes('bitmap_tfxb_hmmv:') && /bitmap_tfx_table_\d+:/.test(tfxBankText) && !/bitmap_tfx_table_\d+:/.test(asm.slice(0, tfxBankStart)));
    check('bitmap: resident play is a trampoline into the bank', asm.includes('bitmap_tfx_play:\n    ld a, BITMAP_TFX_CODE_BANK\n    call mapper_set_bank_p2\n    call bitmap_tfxb_play\n    jp bitmap_room_restore_resident_banks\n'));
    check('bitmap: engine emitted without interrupts', asm.includes('bitmap_tfx_play:') && tfxBankText.includes('bitmap_tfxb_wait_ce:') && !/bitmap_tfxb_wait_ce:[\s\S]{0,400}\bei\b/.test(asm));
    check('bitmap: banked engine paced by bitmap_tfx_frame_wait', tfxBankText.includes('    call bitmap_tfx_frame_wait\n    pop bc\n    djnz bitmap_tfxb_play_wait') && !/call bitmap_(flow_)?wait_vblank/.test(tfxBankText));
    check('bitmap: frame wait restores the banks, waits with bitmap_wait_vblank (no music) and remaps the engine bank', asm.includes('bitmap_tfx_frame_wait:\n    call bitmap_room_restore_resident_banks\n    call bitmap_wait_vblank\nbitmap_tfx_frame_wait_done:\n    ld a, BITMAP_TFX_CODE_BANK\n    jp mapper_set_bank_p2\n'));
    check('bitmap: intro plays the pattern table on page 0', /; Intro scene 0[\s\S]*?ld de, 0\n    ld hl, bitmap_tfx_table_\d+\n    call bitmap_tfx_play/.test(asm));
    check('bitmap: dispatcher fade uses the displayed page and world palette', asm.includes('call bitmap_tfx_world_palette_ptr') && asm.includes('ld a, (bitmap_displayed_page)\n    and 1\n    ld d, a') && asm.includes('    call load_screen5_bitmap_palette\n    jp bitmap_gf_node_'));
    check('bitmap: legacy intro wipe helpers not emitted for engine effects', !asm.includes('bitmap_intro_wipe_vertical:'));
    const flashNode = flowOf(project).nodes.find(item => item.id === 'gf_over_flash');
    Object.assign(flashNode, { effect: 'palette_flash', flashCount: 2, fadeColor: { r: 7, g: 7, b: 7 } });
    const flashAsm = generate(generator, 'bitmap_dispatch_flash', project, 'megarom');
    check('bitmap: dispatcher flash returns to the world palette', /call bitmap_tfx_world_palette_ptr\n    ex de, hl\n    ld hl, bitmap_tfx_solid_777\n    ld a, 1\n    call bitmap_tfx_pal_lerp/.test(flashAsm));
    const flashRom = assemble('bitmap_dispatch_flash', flashAsm);
    check('bitmap: dispatcher flash assembles', flashRom.ok, flashRom.detail.slice(0, 400));
    const rom = assemble('bitmap_intro_pattern', asm);
    check('bitmap: pattern intro + dispatcher fade assembles', rom.ok, rom.detail.slice(0, 400));
    // A plain 32 KB ROM has no banks: the whole engine stays resident exactly as it always was (no engine bank, resident wait).
    const flatAsm = generate(generator, 'bitmap_intro_pattern_flat', project, 'simple32k');
    check('bitmap simple32k: no engine bank, the whole engine stays resident', !flatAsm.includes('BITMAP_TFX_CODE_BANK') && !flatAsm.includes('bitmap_tfxb_') && /^bitmap_tfx_table_\d+:/m.test(flatAsm) && flatAsm.includes('bitmap_tfx_play_wait:'));
    check('bitmap simple32k: resident engine paced by bitmap_wait_vblank', flatAsm.includes('    call bitmap_wait_vblank\n    pop bc\n    djnz bitmap_tfx_play_wait') && !flatAsm.includes('bitmap_tfx_frame_wait'));
    const flatRom = assemble('bitmap_intro_pattern_flat', flatAsm);
    check('bitmap simple32k: pattern intro + dispatcher fade assembles', flatRom.ok, flatRom.detail.slice(0, 400));
  }

  // 3b. Two intro scenes joined by fade out + in, second one closes with an iris.
  {
    const project = base();
    const flow = flowOf(project);
    const presentation = flow.nodes.find(item => item.id === 'gf_intro_presentation_node');
    Object.assign(flow.nodes.find(item => item.id === 'gf_intro_transition_node'), { effect: 'palette_fade_out_in', fadeColor: { r: 0, g: 0, b: 0 }, framesPerStep: 2 });
    flow.nodes.push(
      { ...presentation, id: 'gf_intro_scene2', waitFrames: 30 },
      { id: 'gf_intro_iris', type: 'Transition', position: { x: 0, y: 0 }, effect: 'screen5_iris', irisShape: 'circle', direction: 'edges_in_h' },
    );
    const toWorld = flow.connections.find(connection => connection.from.nodeId === 'gf_intro_transition_node');
    toWorld.to.nodeId = 'gf_intro_scene2';
    flow.connections.push(
      { id: 'c_s2', from: { nodeId: 'gf_intro_scene2' }, to: { nodeId: 'gf_intro_iris' } },
      { id: 'c_iris', from: { nodeId: 'gf_intro_iris' }, to: { nodeId: 'msx2_gf_worldlink_1781959075607' } },
    );
    const asm = generate(generator, 'bitmap_intro_fade_in', project, 'megarom');
    check('bitmap: scene 1 fades in from the solid palette', /; Intro scene 1[\s\S]*?call bitmap_intro_upload_scene1\n    ld hl, bitmap_tfx_solid_000\n    ld de, bitmap_intro_scene1_palette\n    ld a, 2\n    call bitmap_tfx_pal_lerp/.test(asm));
    check('bitmap: scene 0 fades out to the solid palette', /ld hl, bitmap_intro_scene0_palette\n    ld de, bitmap_tfx_solid_000\n    ld a, 2\n    call bitmap_tfx_pal_lerp/.test(asm));
    const rom = assemble('bitmap_intro_fade_in', asm);
    check('bitmap: two-scene fade in intro assembles', rom.ok, rom.detail.slice(0, 400));
  }

  // 3c. Fade in into gameplay is rejected with a clear message.
  {
    const project = base();
    Object.assign(flowOf(project).nodes.find(item => item.id === 'gf_intro_transition_node'), { effect: 'palette_fade_in' });
    check('bitmap: fade in into gameplay is rejected', expectThrows(() => generate(generator, 'bad_bitmap', project, 'megarom'), /fading into gameplay is not supported/));
  }
}

// ---------------------------------------------------------------------------
// 4. TextScroll scroll modes: pixel-smooth vertical + horizontal marquee
// ---------------------------------------------------------------------------
{
  const walker = mode => {
    const project = readFixture('test/msx2-gameflow/screen5_gameflow_menu_project.json');
    for (const id of ['gf_scroll_story', 'gf_scroll_credits']) {
      Object.assign(flowOf(project).nodes.find(item => item.id === id), { scrollMode: mode, scrollStepFrames: 12 });
    }
    return generate(generator, `walker_scroll_${mode}`, project);
  };
  const stepAsm = walker('step');
  check('scroll step: no smooth runtime emitted', !stepAsm.includes('gf_vs_run:') && !stepAsm.includes('gf_vsm_run:'));

  const smoothAsm = walker('smooth');
  check('scroll smooth (walker): runtime + raster split emitted', smoothAsm.includes('gf_vs_run:') && smoothAsm.includes('gf_vs_wait_line:') && !smoothAsm.includes('gf_vsm_run:'));
  check('scroll smooth (walker): split writes R#2 then R#23 through R#17', /gf_vs_frame:[\s\S]*?ld h, #82[\s\S]*?ld l, 23/.test(smoothAsm) && /gf_vs_wait_line:[\s\S]*?out \(#9B\), a[\s\S]*?ld a, #20\n    out \(#99\), a\n    ld a, #91/.test(smoothAsm));
  const smoothRom = assemble('walker_scroll_smooth', smoothAsm);
  check('scroll smooth (walker): assembles', smoothRom.ok, smoothRom.detail.slice(0, 400));

  const marqueeAsm = walker('marquee');
  check('scroll marquee (walker): runtime emitted with VDP detection', marqueeAsm.includes('gf_vsm_run:') && /gf_vsm_run:[\s\S]*?and #1F\n    ld \(GF_VSM_CHIP\), a/i.test(marqueeAsm));
  check('scroll marquee (walker): V9958 path uses R#26/R#27, V9938 path uses HMMM', /ld h, #9A[\s\S]*?ld l, 27/.test(marqueeAsm) && marqueeAsm.includes('gf_vsm_step_v9938:'));
  const marqueeRom = assemble('walker_scroll_marquee', marqueeAsm);
  check('scroll marquee (walker): assembles', marqueeRom.ok, marqueeRom.detail.slice(0, 400));

  const bitmap = mode => {
    const project = readFixture('test/msx2-bitmap-intro/bitmap_intro_test.json');
    const flow = flowOf(project);
    flow.nodes.push({
      id: 'gf_story', type: 'TextScroll', position: { x: 0, y: 0 }, title: 'STORY',
      text: 'YEAR 2087. THE OUTER COLONIES\nLOST CONTACT WITH EARTH.\n\nYOU ARE THE SECOND ATTEMPT.',
      textColorIndex: 15, backgroundColorIndex: 4, scrollStepFrames: 12, waitForKey: false, waitFrames: 30, scrollMode: mode,
    });
    flow.connections.find(connection => connection.from.nodeId === 'gf_intro_transition_node').to.nodeId = 'gf_story';
    flow.connections.push({ id: 'c_story', from: { nodeId: 'gf_story' }, to: { nodeId: 'msx2_gf_worldlink_1781959075607' } });
    return generate(generator, `bitmap_scroll_${mode}`, project, 'megarom');
  };
  for (const mode of ['smooth', 'marquee']) {
    const asm = bitmap(mode);
    const label = mode === 'smooth' ? 'bitmap_vs_run:' : 'bitmap_vsm_run:';
    check(`scroll ${mode} (bitmap): runtime emitted without interrupts`, asm.includes(label) && !/bitmap_vs_wait_line:[\s\S]{0,1200}?\bei\b[\s\S]{0,20}ret/.test(asm));
    const rom = assemble(`bitmap_scroll_${mode}`, asm);
    check(`scroll ${mode} (bitmap): assembles`, rom.ok, rom.detail.slice(0, 400));
  }
}

const failed = checks.filter(item => !item.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed. ROMs in ${path.relative(root, outDir)}`);
if (failed.length) process.exit(1);
