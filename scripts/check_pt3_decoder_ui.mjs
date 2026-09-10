import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
try {
  const page=await browser.newPage();
  await page.goto('http://localhost:3000');
  const result=await page.evaluate(async()=>{
    const {loadCowbell}=await import('/components/utils/cowbellPt3Player.ts');
    const {createBlankPT3Song,commitTrackerTake}=await import('/components/utils/pt3Recording.ts');
    const cowbell=await loadCowbell();
    let decoder;
    const original=cowbell.Common.AYGenerator;
    // Capture the decoder passed by the original ZXPT3 adapter. No audio is
    // generated in this reference path; production still uses the Worker.
    cowbell.Common.AYGenerator=function(_url,_context,decode){decoder=decode;return {channelCount:2,load(){},cleanup(){}};};
    try {new (new cowbell.Player.ZXPT3({commandFrequency:50})).Track('unused').open();}
    finally {cowbell.Common.AYGenerator=original;}
    const song={id:'test',...createBlankPT3Song()};
    const patch=commitTrackerTake(song,new Map([['0:0:A',{note:'C-4',instrument:11,volume:15}],['0:4:A',{note:'==='}]]));
    const fixtures=[new Uint8Array(patch.externalPt3Data),new Uint8Array(await (await fetch('/samples/pt3/kuvo-forgotten-puppet.pt3')).arrayBuffer())];
    const worker=new Worker('/audio/pt3-decode-worker.js');
    const checked=[];
    try {
      for (let id=0;id<fixtures.length;id++) {
        const bytes=fixtures[id];
        const actual=await new Promise((resolve,reject)=>{
          const timeout=setTimeout(()=>reject(new Error('decoder timeout')),30000);
          worker.onmessage=({data})=>{clearTimeout(timeout);data.error?reject(new Error(data.error)):resolve(new Uint8Array(data.log));};
          worker.onerror=event=>{clearTimeout(timeout);reject(new Error(event.message));};
          worker.postMessage({id,bytes:bytes.buffer});
        });
        let reference;
        decoder(bytes,data=>{reference=Uint8Array.from(data.ayRegisterLog.flat(),value=>Number(value));});
        if(actual.length!==reference.length) throw new Error(`frame count differs for fixture ${id}`);
        for(let index=0;index<actual.length;index++) {
          if(actual[index]!==reference[index]) throw new Error(`register differs at ${index} for fixture ${id}`);
        }
        checked.push({fixture:id,frames:actual.length/15});
      }
    } finally {worker.terminate();}
    return checked;
  });
  assert.equal(result.length,2);
  console.log(JSON.stringify({pass:true,description:'Worker register logs equal original Cowbell decoder for authored and imported PT3',result}));
} finally {await browser.close();}
