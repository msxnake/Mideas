import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { cpus } from 'node:os';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const out = resolve(process.env.PERF_OUTPUT_DIR || 'test/perf-screen5');
mkdirSync(out, { recursive: true });
execFileSync('rustc', ['scripts/perf/screen5_kernel.rs', '--crate-type', 'cdylib', '--target', 'wasm32-unknown-unknown', '-C', 'opt-level=3', '-C', 'panic=abort', '-C', 'strip=symbols', '-o', `${out}/screen5_kernel.wasm`]);
const editorPath = 'components/editors/Msx2BitmapScreenEditor.tsx';
const baseRef = '1f7c3cacb84eb70f5ac4ad8a5bc6d4fe24cebdac';
const baseline = execFileSync('git', ['show', `${baseRef}:${editorPath}`], { encoding: 'utf8' });
const current = readFileSync(editorPath, 'utf8');
const fixture = JSON.parse(readFileSync('test/msx2-boss/fixture_boss_dark_room.json', 'utf8'));
const seed = fixture.assets.find(a => a.type === 'msx2bitmaproom').data;
const makeRoom = entries => ({ ...seed, id: 'perf-room', height: 192, entities: [], playerEntries: [],
  atlas: { width: 256, height: 128,
    pixels: Array.from({ length: 128 }, (_, y) => Array.from({ length: 256 }, (_, x) => (x + y) % 16)),
    entries: Array.from({ length: entries }, (_, i) => ({ id: `tile-${i}`, name: `Tile ${i}`, sx: (i % 16) * 16, sy: (Math.floor(i / 16) % 8) * 16, w: 16, h: 16 })),
  },
  composition: { source: 'authored', commands: Array.from({ length: 192 }, (_, i) => ({ op: 'copy', atlasEntryId: `tile-${i % entries}`, dx: (i % 16) * 16, dy: Math.floor(i / 16) * 16, w: 16, h: 16 })) },
});

async function bundle(old) {
  return (await build({ stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
    import React from 'react';
    import { createRoot, flushSync } from 'react-dom/profiling';
    import { Msx2BitmapScreenEditor, renderComposition } from './${editorPath}';
    import { useHistoryHandlers } from './handlers/useHistoryHandlers';
    window.composeOriginal = renderComposition;
    window.stats = [];
    const noop = () => {};
    function Harness() {
      const [assets, setAssets] = React.useState(window.initialAssets);
      const history = useHistoryHandlers({setAssets, setStatusBarMessage: noop});
      const update = patch => {
        const updater = prev => prev.map((a, i) => i ? a : ({...a, data: {...a.data, ...patch}}));
        if (window.withHistory) history.setAssetsWithHistory(updater); else setAssets(updater);
      };
      window.patchRoom = patch => flushSync(() => update(patch));
      window.room = assets[0].data;
      return <React.Profiler id="editor" onRender={(_id, phase, actual) => window.stats.push({phase, actual})}>
        <Msx2BitmapScreenEditor room={assets[0].data} allAssets={assets} onUpdate={update} />
      </React.Profiler>;
    }
    window.mount = () => createRoot(document.getElementById('root')).render(<Harness />);
  ` }, bundle: true, write: false, format: 'iife', platform: 'browser',
    define: { 'process.env.NODE_ENV': '"production"' }, loader: { '.png': 'dataurl' }, logLevel: 'silent',
    plugins: [{ name: 'instrument', setup(b) {
      b.onLoad({ filter: /Msx2BitmapScreenEditor\.tsx$/ }, () => ({ contents: `${old ? baseline : current}\nexport { renderComposition };`, loader: 'tsx', resolveDir: resolve('components/editors') }));
    } }],
  })).outputFiles[0].text;
}

const browser = await chromium.launch({ headless: true });
const result = process.env.PERF_KERNEL_ONLY ? JSON.parse(readFileSync(`${out}/results.json`, 'utf8')) : { date: new Date().toISOString(), cpu: cpus()[0].model, browser: browser.version(), baseRef, samples: 30, warmup: 5, editor: [], kernels: [] };
async function pageFor(code) {
  const page = await browser.newPage();
  page.on('pageerror', e => { throw e; });
  await page.route('http://perf.test/', route => route.fulfill({ contentType: 'text/html', body: '<div id="root"></div>' }));
  await page.goto('http://perf.test/');
  await page.addScriptTag({ content: code });
  return page;
}
try {
  const codes = [await bundle(true), await bundle(false)];
  for (const old of (process.env.PERF_KERNEL_ONLY ? [] : process.env.PERF_CURRENT_ONLY ? [false] : [true, false])) for (const [rooms, entries] of [[1, 32], [20, 128], [80, 256]]) for (const history of [false, true]) {
    const page = await pageFor(codes[old ? 0 : 1]);
    const room = makeRoom(entries);
    await page.evaluate(({ room, rooms, history }) => {
      window.withHistory = history;
      window.initialAssets = Array.from({ length: rooms }, (_, i) => ({ id: i ? `room-${i}` : room.id, name: `Room ${i}`, type: 'msx2bitmaproom', data: structuredClone({...room, id: i ? `room-${i}` : room.id}) }));
      window.mount();
    }, { room, rooms, history });
    await page.waitForFunction(() => window.patchRoom && document.querySelector('canvas[width="512"]'));
    const measurement = await page.evaluate(async () => {
      const pause = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const summarize = values => { const a = [...values].sort((x,y)=>x-y); return { p50: a[Math.floor(a.length*.5)], p95: a[Math.ceil(a.length*.95)-1], max: a.at(-1) }; };
      await pause();
      const tests = {};
      for (const kind of ['metadata', 'composition']) {
        const wall = [], react = [];
        for (let i = 0; i < 35; i++) {
          const patch = kind === 'metadata' ? { name: `Edit ${i}` } : { composition: { ...window.room.composition, commands: window.room.composition.commands.map((c, n) => n ? c : {...c, atlasEntryId: `tile-${i % 16}`}) } };
          window.stats = [];
          const t = performance.now(); window.patchRoom(patch); const elapsed = performance.now()-t;
          await pause();
          if (i >= 5) { wall.push(elapsed); react.push(window.stats.reduce((a,s)=>a+s.actual,0)); }
        }
        tests[kind] = { synchronousMs: summarize(wall), reactRenderMs: summarize(react) };
      }
      // Cost of precisely the comparison in pushToHistory, isolated from React.
      const before = window.initialAssets;
      const after = before.map((a,i)=>i?a:({...a,data:{...a.data,name:'changed'}}));
      const times=[]; let same;
      for(let i=0;i<35;i++){const t=performance.now();same=JSON.stringify(before)===JSON.stringify(after);if(i>=5)times.push(performance.now()-t);}
      return { tests, serializedBytes: new TextEncoder().encode(JSON.stringify(before)).length, historyComparisonMs: summarize(times), same };
    });
    result.editor.push({ version: old ? 'baseline' : 'cached', rooms, entries, history, ...measurement });
    console.log(JSON.stringify({ version: old ? 'baseline' : 'cached', rooms, entries, history, ...measurement.tests }));
    await page.close();
  }

  const page = await pageFor(codes[1]);
  const room = makeRoom(128);
  const wasm = [...readFileSync(`${out}/screen5_kernel.wasm`)];
  result.kernels = await page.evaluate(async ({room, wasm}) => {
    const summarize = values => {const a=[...values].sort((x,y)=>x-y);return {p50:a[Math.floor(a.length*.5)],p95:a[Math.ceil(a.length*.95)-1],max:a.at(-1)};};
    const atlas=Uint8Array.from(room.atlas.pixels.flat());
    const commands=new Int32Array(room.composition.commands.flatMap(c=>{const e=room.atlas.entries.find(e=>e.id===c.atlasEntryId);return [1,c.dx,c.dy,c.w,c.h,0,e.sx,e.sy]}));
    const original=window.composeOriginal(room,room.atlas.pixels).flat();
    function compose(atlas, commands) {
      const out=new Uint8Array(256*192);
      for(let n=0;n<commands.length;n+=8)for(let y=0;y<commands[n+4];y++){
        const dy=commands[n+2]+y;if(dy<0||dy>=192)continue;
        for(let x=0;x<commands[n+3];x++){
          const dx=commands[n+1]+x;if(dx<0||dx>=256)continue;
          out[dy*256+dx]=commands[n]===0?(commands[n+5]&15):atlas[(commands[n+7]+y)*256+commands[n+6]+x];
        }
      }return out;
    }
    const t0=performance.now();
    const {instance}=await WebAssembly.instantiate(new Uint8Array(wasm));
    const coldMs=performance.now()-t0;
    const ex=instance.exports;
    const aPtr=ex.allocate(atlas.length), cPtr=ex.allocate(commands.byteLength), oPtr=ex.allocate(original.length);
    const runWasm=()=>{
      new Uint8Array(ex.memory.buffer,aPtr,atlas.length).set(atlas);
      new Int32Array(ex.memory.buffer,cPtr,commands.length).set(commands);
      ex.compose(aPtr,cPtr,commands.length/8,oPtr,0);
      return new Uint8Array(ex.memory.buffer,oPtr,original.length).slice();
    };
    const equals = a => a.length===original.length&&a.every((v,i)=>v===original[i]);
    if(!equals(compose(atlas,commands))||!equals(runWasm()))throw Error('Kernel parity failed');
    const source=`const compose=${compose.toString()};let atlas,commands;onmessage=e=>{if(e.data.init){atlas=e.data.atlas;commands=e.data.commands;postMessage('ready');return;}let out;const t=performance.now();for(let i=0;i<e.data.batch;i++)out=compose(atlas,commands);postMessage({out,computeMs:performance.now()-t},[out.buffer]);}`;
    const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
    const worker=new Worker(url);
    const send=(data,transfer=[])=>new Promise(resolve=>{worker.onmessage=e=>resolve(e.data);worker.postMessage(data,transfer)});
    const wt=performance.now();await send({init:true,atlas,commands});const workerColdMs=performance.now()-wt;
    const rows=[];
    for(const batch of [1,64]){
      for(const [name,fn] of [['original-arrays',()=>window.composeOriginal(room,room.atlas.pixels)],['flat-js',()=>compose(atlas,commands)],['rust-wasm-with-copies',runWasm]]){
        const times=[];let sink;
        for(let i=0;i<35;i++){const t=performance.now();for(let b=0;b<batch;b++)sink=fn();if(i>=5)times.push(performance.now()-t);}
        rows.push({name,batch,ms:summarize(times),coldMs:name.includes('wasm')?coldMs:undefined});
      }
      const times=[],compute=[];
      for(let i=0;i<35;i++){const t=performance.now();const r=await send({batch});if(!equals(r.out))throw Error('Worker parity failed');if(i>=5){times.push(performance.now()-t);compute.push(r.computeMs);}}
      rows.push({name:'worker-js-resident-input',batch,ms:summarize(times),computeMs:summarize(compute),coldMs:workerColdMs});
    }
    worker.terminate();URL.revokeObjectURL(url);
    return { rows, parity: true, wasmBytes: wasm.length, notes: 'Worker inputs are resident; Rust includes input and output copies on every room. No Canvas/React in kernel timing. Synthetic full tilemap, 192 copies.' };
  }, {room,wasm});
  await page.close();
  assert.ok(result.kernels.parity);
  writeFileSync(`${out}/results.json`, JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result.kernels,null,2));
} finally { await browser.close(); }
