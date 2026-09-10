import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const browser = await chromium.launch({headless:true});
try {
  const page=await browser.newPage();
  const results=await page.evaluate(()=>{
    const palette=Array.from({length:16},(_,i)=>`#${((i*0x123457)&0xffffff).toString(16).padStart(6,'0')}`);
    const rgba=palette.map(hex=>[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16),255]);
    const summary=values=>{const a=values.sort((a,b)=>a-b);return {p50:a[Math.floor(a.length*.5)],p95:a[Math.ceil(a.length*.95)-1]};};
    const results=[];
    for(const height of [192,212]){
      const pixels=Array.from({length:192},(_,y)=>Array.from({length:256},(_,x)=>(x+y)%16));
      const canvas=document.createElement('canvas');canvas.width=256;canvas.height=height;
      const ctx=canvas.getContext('2d');
      const fill=()=>{for(let y=0;y<height;y++)for(let x=0;x<256;x++){const s=pixels[y]?.[x]??0;ctx.fillStyle=palette[s===0?3:s];ctx.fillRect(x,y,1,1);}};
      const image=()=>{const data=ctx.createImageData(256,height);for(let y=0;y<height;y++)for(let x=0;x<256;x++){const s=pixels[y]?.[x]??0,c=rgba[s===0?3:s],i=(y*256+x)*4;data.data[i]=c[0];data.data[i+1]=c[1];data.data[i+2]=c[2];data.data[i+3]=255;}ctx.putImageData(data,0,0);};
      fill();const before=ctx.getImageData(0,0,256,height).data.slice();
      image();const after=ctx.getImageData(0,0,256,height).data;
      if(!before.every((v,i)=>v===after[i]))throw Error('Raster parity failed');
      for(const [name,fn]of [['fillRect',fill],['ImageData',image]]){
        const times=[];
        for(let i=0;i<65;i++){const t=performance.now();fn();if(i>=5)times.push(performance.now()-t);}
        results.push({height,name,ms:summary(times),parity:true});
      }
    }
    return results;
  });
  mkdirSync('test/perf-screen5',{recursive:true});
  writeFileSync('test/perf-screen5/raster.json',JSON.stringify({browser:browser.version(),samples:60,results},null,2)+'\n');
  console.log(JSON.stringify(results));
}finally{await browser.close();}
