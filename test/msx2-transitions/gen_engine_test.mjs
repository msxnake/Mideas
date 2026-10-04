// Emits test/msx2-transitions/out/engine_test.asm: the SCREEN 5 transition engine
// plus one entry per case of engine_cases.json. Used by check_tfx_engine.py.
//   node test/msx2-transitions/gen_engine_test.mjs di|ei
import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const root = path.resolve(here, '..', '..');
const source = `
import { generateScreen5TfxRuntime, Screen5TfxDataPool, emitScreen5TfxCall } from './utils/msxGenerator/generators/msx2/screen5TransitionEngine';
import { resolveScreen5TransitionSpec, buildScreen5FillPlan } from './utils/msx2TransitionPatterns';
export { generateScreen5TfxRuntime, Screen5TfxDataPool, emitScreen5TfxCall, resolveScreen5TransitionSpec, buildScreen5FillPlan };
`;
const bundle = await esbuild.build({ stdin: { contents: source, resolveDir: root, loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', write: false, logLevel: 'error' });
const lib = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);

const interrupts = process.argv[2] === 'ei';
const cases = JSON.parse(fs.readFileSync(path.join(here, 'engine_cases.json'), 'utf8'));
const pool = new lib.Screen5TfxDataPool('tt');
const entries = [];
const expected = [];
cases.forEach((c, i) => {
  const spec = lib.resolveScreen5TransitionSpec(c.node);
  const call = lib.emitScreen5TfxCall(c.node, { prefix: 'tt', pool, loadPageOffsetAsm: `    ld de, ${c.yoff || 0}`, loadCurrentPaletteAsm: '    ld hl, pal_from', nextScenePaletteLabel: 'pal_to' });
  entries.push(`case_${i}:\n${call}    ret\n`);
  expected.push({ spec, plan: spec.kind === 'fill' ? lib.buildScreen5FillPlan(spec) : null });
});
const asm = `    org #8000
jump_table:
${cases.map((_c, i) => `    dw case_${i}`).join('\n')}
${entries.join('\n')}
${lib.generateScreen5TfxRuntime({ prefix: 'tt', interrupts, frameWaitAsm: '    out (#FE), a', fill: true, palette: true })}
pal_from:
    db #70,#00, #07,#00, #00,#07, #77,#07, #34,#05, #11,#01, #60,#03, #05,#02, #70,#07, #22,#02, #43,#01, #00,#00, #16,#04, #52,#06, #25,#03, #77,#00
pal_to:
    db #00,#07, #70,#00, #07,#07, #00,#00, #43,#02, #66,#06, #01,#01, #20,#05, #07,#00, #55,#05, #34,#06, #77,#07, #61,#02, #25,#01, #52,#04, #00,#07
${pool.emitData()}
`;
const out = path.join(here, 'out');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'engine_test.asm'), asm);
fs.writeFileSync(path.join(out, 'engine_expected.json'), JSON.stringify(expected));
