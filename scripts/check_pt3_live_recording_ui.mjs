import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({headless:true, args:['--autoplay-policy=no-user-gesture-required']});
const page = await browser.newPage({viewport:{width:1600,height:1000}});
const errors=[];
page.on('pageerror', e=>errors.push(e.message));
try {
  await page.addInitScript(()=>{
    window.testMonitorPeak=0;
    const callback=Object.getOwnPropertyDescriptor(ScriptProcessorNode.prototype,'onaudioprocess');
    const create=AudioContext.prototype.createScriptProcessor;
    AudioContext.prototype.createScriptProcessor=function(...args){
      const node=create.apply(this,args);
      Object.defineProperty(node,'onaudioprocess',{set(render){
        callback.set.call(node,render ? function(event){
          render.call(this,event);
          for(const value of event.outputBuffer.getChannelData(0)) {
            window.testMonitorPeak=Math.max(window.testMonitorPeak,Math.abs(value));
          }
        } : null);
      }});
      return node;
    };
    const Original=window.AudioWorkletNode;
    window.AudioWorkletNode=class extends Original {
      constructor(...args){
        super(...args);
        if(args[1]==='mideas-pt3') this.port.addEventListener('message',({data})=>{
          if(data.type==='position') window.testTransportPosition=data;
          if(data.type==='scopes') window.testTransportScopes=data.scopes;
        });
      }
    };
    const port={id:'test',name:'MPK mini simulated',state:'connected',type:'input',onmidimessage:null};
    window.testMidi=port;
    Object.defineProperty(navigator,'requestMIDIAccess',{value:async()=>({inputs:new Map([['test',port]]),onstatechange:null})});
  });
  await page.goto('http://localhost:3000');
  await page.evaluate(async()=>{
    const {default: React} = await import('/node_modules/.vite/deps/react.js');
    const {default: {createRoot}} = await import('/node_modules/.vite/deps/react-dom_client.js');
    const {TrackerComposer}=await import('/components/editors/TrackerComposer.tsx');
    const {createBlankPT3Song,commitTrackerTake}=await import('/components/utils/pt3Recording.ts');
    const host=document.createElement('div'); host.style='position:fixed;inset:0;z-index:99999;background:black';document.body.append(host);
    function Harness(){
      const [song,setSong]=React.useState(()=>{
        const base={id:'test',...createBlankPT3Song()};
        base.patterns=base.patterns.map(pattern=>({...pattern,numRows:16,rows:pattern.rows.slice(0,16)}));
        base.patterns[0].rows[0].B={...base.patterns[0].rows[0].B,note:'C-3',instrument:11,volume:10};
        return {...base,...commitTrackerTake(base,new Map())};
      });
      window.testSong=song;
      return React.createElement(TrackerComposer,{songData:song,onUpdate:update=>setSong(previous=>({...previous,...(typeof update==='function'?update(previous):update)}))});
    }
    createRoot(host).render(React.createElement(Harness));
  });
  await page.getByLabel('Enable MIDI',{exact:true}).check();
  await page.waitForFunction(()=>typeof window.testMidi.onmidimessage==='function');
  await page.getByRole('button',{name:'Only play',exact:true}).click();
  const beforeOnlyPlay=await page.evaluate(()=>JSON.stringify(window.testSong));
  for (const playing of [false,true]) {
    if(playing) {
      await page.getByRole('button',{name:'Play Song',exact:true}).click();
      await page.getByRole('button',{name:'Stop',exact:true}).waitFor();
    }
    await page.evaluate(()=>{
      window.testMonitorPeak=0;
      window.testMidi.onmidimessage({data:new Uint8Array([0x90,69,100])});
    });
    await page.waitForTimeout(300);
    assert(await page.evaluate(()=>window.testMonitorPeak>0.001),'Only play produces immediate audio');
    await page.evaluate(()=>window.testMidi.onmidimessage({data:new Uint8Array([0x80,69,0])}));
    if(playing) await page.getByRole('button',{name:'Stop',exact:true}).click();
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(()=>JSON.stringify(window.testSong)),beforeOnlyPlay,'Only play leaves the entire song unchanged, including note-off');
  }
  await page.getByRole('button',{name:'Only play',exact:true}).click();
  await page.getByRole('button',{name:'Armar REC',exact:false}).click();
  await page.getByLabel('Cuantización MIDI',{exact:true}).selectOption('2');
  await page.getByRole('button',{name:'Solo este patrón',exact:true}).click();
  await page.getByRole('button',{name:'Play Song',exact:true}).click();
  await page.getByRole('button',{name:'Stop',exact:true}).waitFor();
  await page.waitForTimeout(350);
  await page.evaluate(()=>window.testMidi.onmidimessage({data:new Uint8Array([0x90,60,100])}));
  await page.waitForTimeout(400);
  assert(await page.evaluate(()=>window.testMonitorPeak>0.001),'MIDI monitoring sounds immediately during playback');
  await page.evaluate(()=>window.testMidi.onmidimessage({data:new Uint8Array([0x90,64,90])}));
  await page.waitForTimeout(100);
  await page.evaluate(()=>window.testMidi.onmidimessage({data:new Uint8Array([0x80,60,0])}));
  await page.waitForTimeout(250);
  await page.evaluate(()=>window.testMidi.onmidimessage({data:new Uint8Array([0x90,64,0])}));
  assert.equal(await page.getByRole('button',{name:'Stop',exact:true}).count(),1,'notes do not stop player');
  await page.waitForFunction(()=>window.testTransportPosition?.iteration>=1 && window.testTransportPosition?.revision>0);
  await page.waitForFunction(()=>window.testTransportScopes?.[0].some(value=>Math.abs(value)>0.001));
  assert.equal(await page.getByRole('button',{name:'Stop',exact:true}).count(),1,'recorded channel sounds on the next loop without stopping');
  await page.getByRole('button',{name:'Stop',exact:true}).click();
  await page.waitForTimeout(300);
  const result=await page.evaluate(async()=>{
    const {parsePT3File}=await import('/components/utils/pt3Parser.ts');
    const s=window.testSong;
    const decoded=parsePT3File(new Uint8Array(s.externalPt3Data).buffer);
    return {notes:decoded.patterns[0].rows.flatMap((row,i)=>row.A.note?[{row:i,note:row.A.note,instrument:row.A.instrument}]:[]),backend:s.playbackBackend, backing:decoded.patterns[0].rows[0].B};
  });
  assert.equal(result.backend,'external-pt3');
  assert.equal(result.notes.length,3);
  assert.equal(result.notes[0].note,'C-4');
  assert(result.notes[0].instrument>0);
  assert.equal(result.notes[1].note,'E-4');
  assert.equal(result.notes[1].instrument,null);
  assert.equal(result.notes[2].note,'===');
  assert(result.notes.every(note=>note.row%2===0));
  assert.equal(result.backing.note,'C-3'); assert.equal(result.backing.instrument,11);
  await page.getByRole('button',{name:'New',exact:true}).click();
  await page.waitForFunction(()=>window.testSong.patterns.length===2);
  const arrangement=await page.evaluate(async()=>{
    const {parsePT3File}=await import('/components/utils/pt3Parser.ts');
    const s=window.testSong;
    return {backend:s.playbackBackend, order:parsePT3File(new Uint8Array(s.externalPt3Data).buffer).order};
  });
  assert.equal(arrangement.backend,'external-pt3');
  assert.deepEqual(arrangement.order,[0,1]);
  await page.evaluate(()=>{
    window.testMonitorPeak=0;
    window.testMidi.onmidimessage({data:new Uint8Array([0x90,67,100])});
  });
  await page.waitForTimeout(300);
  assert(await page.evaluate(()=>window.testMonitorPeak>0.001),'MIDI monitoring sounds while entering notes with transport stopped');
  await page.evaluate(()=>window.testMidi.onmidimessage({data:new Uint8Array([0x80,67,0])}));
  await page.waitForTimeout(150);
  await page.evaluate(()=>{window.testMonitorPeak=0;});
  await page.waitForTimeout(150);
  assert(await page.evaluate(()=>window.testMonitorPeak<0.000001),'MIDI release silences monitoring (allow filter decay)');
  assert(await page.evaluate(async()=>{
    const {parsePT3File}=await import('/components/utils/pt3Parser.ts');
    return parsePT3File(new Uint8Array(window.testSong.externalPt3Data).buffer)
      .patterns.some(pattern=>pattern.rows.some(row=>row.A.note==='G-4'));
  }),'monitored step-entry note is also saved in the PT3');
  for (const [sensitivity,note,expectedVolume] of [['1',72,8],['3',74,12]]) {
    await page.getByRole('slider',{name:'Sensibilidad MIDI',exact:true}).fill(sensitivity);
    await page.evaluate(note=>window.testMidi.onmidimessage({data:new Uint8Array([0x90,note,64])}),note);
    await page.waitForTimeout(150);
    await page.evaluate(note=>window.testMidi.onmidimessage({data:new Uint8Array([0x80,note,0])}),note);
    const volume=await page.evaluate(async note=>{
      const {parsePT3File}=await import('/components/utils/pt3Parser.ts');
      const name=note===72?'C-5':'D-5';
      return parsePT3File(new Uint8Array(window.testSong.externalPt3Data).buffer)
        .patterns.flatMap(pattern=>pattern.rows).find(row=>row.A.note===name)?.A.volume;
    },note);
    assert.equal(volume,expectedVolume,'sensitivity changes the recorded PT3 volume for the same key pressure');
    assert.equal(await page.evaluate(()=>localStorage.getItem('mideas.tracker.midi.velocitySensitivity')),sensitivity);
  }
  assert.deepEqual(errors,[]);
  await page.screenshot({path:'server/temp/pt3-midi-ui.png'});
  console.log(JSON.stringify({pass:true,result,errors}));
} finally {await browser.close();}

