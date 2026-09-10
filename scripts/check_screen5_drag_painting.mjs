import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { chromium } from 'playwright';

const seed = JSON.parse(readFileSync('test/msx2-boss/fixture_boss_dark_room.json', 'utf8')).assets.find(a=>a.type==='msx2bitmaproom').data;
const room = {...seed, id:'stroke-room', height:192, entities:[], playerEntries:[],
  atlas:{width:256,height:128,pixels:Array.from({length:128},(_,y)=>Array.from({length:256},(_,x)=>(x+y)%16)), entries:[
    {id:'tile-a',name:'Drag tile A',sx:0,sy:0,w:16,h:16,collisionFlags:16,destructible:true,crumbling:true,behaviorCode:7,collisionShape:3},
    {id:'tile-b',name:'Drag tile B',sx:16,sy:0,w:16,h:16,collisionFlags:32,behaviorCode:2,collisionShape:12},
  ]}, composition:{source:'authored',commands:[]}, tileGrid:Array.from({length:12},()=>Array(16).fill(0)),
};
const old = process.env.SCREEN5_STROKE_BASELINE === '1';
const bundle = await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
  import React from 'react';
  import {createRoot} from 'react-dom/client';
  import {flushSync} from 'react-dom';
  import {Msx2BitmapScreenEditor} from './components/editors/Msx2BitmapScreenEditor';
  import {useHistoryHandlers} from './handlers/useHistoryHandlers';
  const seed=${JSON.stringify(room)};
  function Harness(){
    const [assets,setAssets]=React.useState(()=>Array.from({length:80},(_,i)=>({id:i?'room-'+i:seed.id,name:'Room '+i,type:'msx2bitmaproom',data:structuredClone({...seed,id:i?'room-'+i:seed.id})})));
    const h=useHistoryHandlers({setAssets,setStatusBarMessage:()=>{}});
    window.assets=assets;window.room=assets[0].data;window.historyState=h.history;
    window.undo=()=>flushSync(h.handleUndo);window.redo=()=>flushSync(h.handleRedo);
    window.rawUpdate=updater=>flushSync(()=>h.setAssetsWithHistory(updater));
    window.reset=(patch={})=>flushSync(()=>{setAssets(prev=>prev.map((a,i)=>i?a:{...a,data:structuredClone({...seed,...patch})}));h.clearAllHistory();window.updates=0;});
    const update=patch=>{window.updates++;h.setAssetsWithHistory(prev=>prev.map((a,i)=>i?a:{...a,data:{...a.data,...patch}}));};
    return <Msx2BitmapScreenEditor room={assets[0].data} allAssets={assets} onUpdate={update}/>;
  }
  window.updates=0;createRoot(document.getElementById('root')).render(<Harness/>);
`},bundle:true,write:false,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'},loader:{'.png':'dataurl'},logLevel:'silent',
plugins:old?[{name:'baseline',setup(b){b.onLoad({filter:/Msx2BitmapScreenEditor\.tsx$/},()=>({contents:execFileSync('git',['show','1f7c3cacb84eb70f5ac4ad8a5bc6d4fe24cebdac:components/editors/Msx2BitmapScreenEditor.tsx'],{encoding:'utf8'}),loader:'tsx',resolveDir:resolve('components/editors')}));}}]:[]});

const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('http://drag.test/',route=>route.fulfill({contentType:'text/html',body:'<div id="root"></div>'}));
  await page.goto('http://drag.test/');await page.addScriptTag({content:bundle.outputFiles[0].text});
  await page.waitForFunction(()=>window.reset&&document.querySelector('canvas[width="512"]'));
  const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const reset=async(patch={})=>{await page.evaluate(p=>window.reset(p),patch);await settle();};
  const read=()=>page.evaluate(()=>({room:window.room,updates:window.updates,undo:window.historyState.undoStack.length}));
  const tool=name=>page.getByRole('button',{name,exact:true}).click();
  // Deliberately dispatch all samples in ONE JS task: no React commit or rAF
  // between moves. This reproduces lost updates as well as skipped mouse cells.
  const stroke=async(points,{end=true}={})=>{
    const ms=await page.evaluate(({points,end})=>{
      const c=document.querySelector('canvas[width="512"]'),r=c.getBoundingClientRect();
      const send=(type,p,buttons)=>c.dispatchEvent(new MouseEvent(type,{bubbles:true,button:0,buttons,clientX:r.left+(p[0]*16+8)*r.width/256,clientY:r.top+(p[1]*16+8)*r.height/192}));
      const t=performance.now();send('mousedown',points[0],1);for(const p of points.slice(1))send('mousemove',p,1);if(end)send('mouseup',points.at(-1),0);return performance.now()-t;
    },{points,end});await settle();return ms;
  };
  await tool('Pincel');await reset();
  const burstMs=await stroke([[0,0],[15,0],[15,11],[0,11]]);
  let state=await read();
  assert.ok(state.room.tileGrid[0].every(v=>v===1),'Sparse fast movement paints the whole top row');
  assert.ok(state.room.tileGrid[11].every(v=>v===1),'Same-task updates preserve the whole bottom row');
  assert.ok(state.room.tileGrid.every(row=>row[15]===1),'Intermediate vertical cells are painted');
  assert.equal(state.updates,4,'One cumulative update per delivered sample, not per interpolated cell');
  assert.equal(state.room.collision[0][8],0x94,'Solid + destructible + crumbling preserved');
  assert.equal(state.room.behavior[0][8],7);assert.equal(state.room.collisionShape[0][8],3);
  assert.equal(state.room.composition.commands.length,42,'Every occupied cell has one copy command');
  const painted=structuredClone(state.room);
  const undoCount=state.undo;
  for(let i=0;i<undoCount;i++){await page.evaluate(()=>window.undo());await settle();}
  assert.ok((await read()).room.tileGrid.flat().every(v=>v===0),'Undo restores the empty grid');
  for(let i=0;i<undoCount;i++){await page.evaluate(()=>window.redo());await settle();}
  assert.deepEqual((await read()).room,painted,'Redo restores tiles and metadata exactly');

  // Native input with sparse samples, at two zoom levels and a throttled CPU.
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  for(const width of [512,768]){
    await reset();
    if(width===768)await page.getByTitle('Zoom in',{exact:true}).click();
    const canvas=page.locator(`canvas[width="${width}"]`);await canvas.scrollIntoViewIfNeeded();
    const rect=await canvas.boundingBox();
    await page.mouse.move(rect.x+8*rect.width/256,rect.y+8*rect.height/192);
    await page.mouse.down();
    await page.mouse.move(rect.x+248*rect.width/256,rect.y+8*rect.height/192,{steps:1});
    await page.mouse.up();await settle();
    assert.ok((await read()).room.tileGrid[0].every(v=>v===1),'Native fast drag paints all cells at zoom '+width/256);
  }
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
  await page.getByTitle('Zoom out',{exact:true}).click();await settle();
  await reset();
  const edgeCanvas=page.locator('canvas[width="512"]');await edgeCanvas.scrollIntoViewIfNeeded();
  const edgeRect=await edgeCanvas.boundingBox();
  await page.mouse.move(edgeRect.x+16,edgeRect.y+48);await page.mouse.down();
  await page.mouse.move(edgeRect.x+edgeRect.width+80,edgeRect.y+48,{steps:1});await page.mouse.up();await settle();
  assert.ok((await read()).room.tileGrid[1].every(v=>v===1),'A fast sweep outside the canvas paints up to its edge');

  await reset();await stroke([[0,0],[11,11]]);
  state=await read();for(let i=0;i<12;i++)assert.equal(state.room.tileGrid[i][i],1,'Diagonal has no missing samples');
  await reset();await stroke(Array.from({length:30},()=>[3,3]));
  assert.equal((await read()).updates,1,'Moving inside the same cell does not repeat history writes');
  await stroke([[3,3],[3,3]]);assert.equal((await read()).updates,1,'Repainting unchanged tile/metadata is a no-op');
  await reset();await stroke([[0,0]],{end:false});
  await page.evaluate(()=>{const c=document.querySelector('canvas[width="512"]'),r=c.getBoundingClientRect();c.dispatchEvent(new MouseEvent('mouseup',{bubbles:true,button:0,buttons:0,clientX:r.left+248*r.width/256,clientY:r.top+8*r.height/192}));});
  await settle();assert.ok((await read()).room.tileGrid[0].every(v=>v===1),'Release position completes a missing final mousemove');

  await reset({tileGrid:Array.from({length:12},()=>Array(16).fill(1)),collision:Array.from({length:12},()=>Array(16).fill(0x94)),behavior:Array.from({length:12},()=>Array(16).fill(7)),collisionShape:Array.from({length:12},()=>Array(16).fill(3))});
  await tool('Borrador');await stroke([[15,4],[0,4]]);state=await read();
  assert.ok(state.room.tileGrid[4].every(v=>v===0));assert.ok(state.room.tileGrid[3].every(v=>v===1));
  assert.ok(state.room.collision[4].every(v=>v===0));assert.ok(state.room.behavior[4].every(v=>v===0));
  assert.ok(state.room.collisionShape[4].every(v=>v===3),'Erase preserves existing shape policy');

  await tool('Pincel');await reset();
  await page.getByTitle('Toggle lock',{exact:true}).nth(0).click();await stroke([[0,0],[15,0]]);
  assert.equal((await read()).updates,0,'Locked visual layer stays untouched');
  await page.getByTitle('Toggle lock',{exact:true}).nth(0).click();
  await tool('Select');await stroke([[0,0],[15,0]]);assert.equal((await read()).updates,0,'Select does not paint');
  await tool('Rellenar');await stroke([[0,0],[15,0]]);assert.ok((await read()).room.tileGrid.flat().every(v=>v===1),'Flood fill remains a click operation');

  await reset();await tool('Pincel');
  await page.getByTitle(/Drag tile A \(16x16\)/).click({modifiers:['Control']});
  await page.getByTitle(/Drag tile B \(16x16\)/).click({modifiers:['Control']});
  await stroke([[0,1],[15,1]]);state=await read();
  assert.ok(state.room.tileGrid[1].every(v=>v===1||v===2),'Random mix covers the entire line');
  const mixed=state.room.tileGrid[1];await stroke([[15,1],[0,1]]);
  assert.deepEqual((await read()).room.tileGrid[1],mixed,'Random mix does not reshuffle already painted cells');
  await page.getByTitle(/Drag tile A \(16x16\)/).click();

  const terrain={id:'terrain-test',name:'Drag terrain',template:'blob16',mapping:Object.fromEntries(Array.from({length:16},(_,i)=>[i,'tile-a']))};
  await reset({autoTerrains:[terrain]});await page.getByTitle(/Terreno "Drag terrain"/).click();
  await stroke([[0,2],[15,2]]);assert.ok((await read()).room.tileGrid[2].every(v=>v===1),'Autotile covers interpolated cells');
  await tool('Borrador');await stroke([[15,2],[0,2]]);assert.ok((await read()).room.tileGrid[2].every(v=>v===0),'Autotile erase covers interpolated cells');

  await reset();await tool('Pincel');await stroke([[1,1]],{end:false});
  await page.evaluate(()=>window.dispatchEvent(new MouseEvent('mouseup',{buttons:0})));
  await page.evaluate(()=>{const c=document.querySelector('canvas[width="512"]'),r=c.getBoundingClientRect();c.dispatchEvent(new MouseEvent('mousemove',{bubbles:true,buttons:1,clientX:r.left+400,clientY:r.top+200}));});
  await settle();assert.equal((await read()).room.tileGrid.flat().filter(Boolean).length,1,'Mouseup outside the canvas terminates painting');

  // History compatibility: cloned equal assets, functional updates, reorder, add,
  // remove, redo invalidation. Unchanged room atlases must not be serialized.
  await reset();await page.evaluate(()=>window.rawUpdate(prev=>prev.map(a=>({...a,data:{...a.data}}))));await settle();
  assert.equal((await read()).undo,0,'Cloned equal assets do not add history');
  await page.evaluate(()=>window.rawUpdate(prev=>[...prev].reverse()));await settle();
  assert.equal((await read()).undo,1,'Reordering assets is undoable');
  await page.evaluate(()=>window.undo());await settle();assert.equal((await read()).room.id,'stroke-room');
  await page.evaluate(()=>window.rawUpdate(prev=>[...prev,{id:'added',name:'Added',type:'code',data:{code:'test'}}]));await settle();
  assert.equal(await page.evaluate(()=>window.historyState.redoStack.length),0,'New action clears redo');
  await page.evaluate(()=>window.rawUpdate(prev=>prev.filter(a=>a.id!=='added')));await settle();
  await page.evaluate(()=>window.undo());await settle();assert.equal(await page.evaluate(()=>window.assets.at(-1).id),'added');
  await page.evaluate(()=>window.redo());await settle();assert.equal(await page.evaluate(()=>window.assets.length),80);
  assert.deepEqual(errors,[]);
  const report={passed:true,rooms:80,burstDispatchMs:burstMs,metricNote:'Dispatch only; excludes React settling/presentation. Throughput is measured separately.',burstSamples:4,paintedCells:42,updates:4,nativeCpuThrottle:4,nativeZooms:[2,3]};
  mkdirSync('test/perf-screen5',{recursive:true});writeFileSync('test/perf-screen5/drag-result.json',JSON.stringify(report,null,2)+'\n');
  console.log('PASS: fast strokes, metadata, erase, locks, fill, mix, terrain, release and history');console.log(JSON.stringify(report));
}finally{await browser.close();}
