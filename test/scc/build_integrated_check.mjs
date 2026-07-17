import fs from 'fs';
import { buildSccIntegratedMusicBlock, collectSccTracks, buildSccMusicRam } from '../ts_build_scc/utils/msxGenerator/generators/sccSoundGenerator.js';

const wave = []; for (let i=0;i<32;i++){const t=i<16?i:31-i; wave.push(Math.round((t-7.5)*16));}
const cell=(n=null,i=null,v=null,o=null)=>({note:n,instrument:i,ornament:o,volume:v});
const empty=()=>({1:cell(),2:cell(),3:cell(),4:cell(),5:cell()});
const rows=[]; for(let r=0;r<16;r++){const row=empty();
  if(r%4===0) row['1']=cell('C-4',1,15);
  if(r%4===0) row['2']=cell('E-4',1,12,1);   // ornament (arp)
  rows.push(row);}
const song={id:'i',name:'integrated',soundChip:'SCC',bpm:150,speed:6,globalVolume:15,
  patterns:[{id:'p',name:'p',numRows:16,rows}],order:[0],lengthInPatterns:1,restartPosition:0,currentPatternIndexInOrder:0,
  instruments:[{id:1,name:'w',waveform:wave,volume:15,volumeEnvelope:[15,12,10,8],volumeLoop:255,vibratoDepth:3,vibratoSpeed:20,vibratoDelay:2}],
  ornaments:[{id:1,name:'maj',data:[0,4,7],loopPosition:0}]};
const tracks=collectSccTracks({tracks:[song]});
const block=buildSccIntegratedMusicBlock(tracks);
const ram=buildSccMusicRam(0xC010);
// Minimal boot wrapper providing the externs the integrated block expects.
const asm=`ENASLT EQU #0024
RSLREG EQU #0138
EXPTBL EQU #FCC1
music_active   EQU #C000
music_muted    EQU #C001
music_loop     EQU #C002
music_track_index EQU #C003
mapper_bank_p2_current EQU #C004
${ram.asm}
    org #4000
    db "AB"
    dw INIT
    ds 12,0
INIT:
    di
    ld sp,#F380
    call enable_page2_cart
    ld a,2
    ld (mapper_bank_p2_current),a
    call music_init_system
    xor a
    ld b,1
    call music_play_track
    ei
loop:
    halt
    call music_update
    jp loop
enable_page2_cart:
    call RSLREG
    rrca
    rrca
    and #03
    ld c,a
    ld b,0
    ld hl,EXPTBL
    add hl,bc
    ld a,(hl)
    and #80
    or c
    ld c,a
    inc hl
    inc hl
    inc hl
    inc hl
    ld a,(hl)
    and #0C
    or c
    ld h,#80
    call ENASLT
    ret
mapper_set_bank_p2:
    ld (mapper_bank_p2_current),a
    ld (#9000),a
    ret
${block.asm}
    ds #C000-$,#FF
`;
fs.writeFileSync(new URL('./scc_integrated_check.asm',import.meta.url),asm);
console.log(JSON.stringify({warnings:block.warnings,waveformCount:block.waveformCount,trackCount:block.trackCount}));
