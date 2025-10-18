const ye=[16,24,32];var X=(e=>(e.Score="Score",e.HighScore="HighScore",e.Lives="Lives",e.EnergyBar="EnergyBar",e.ItemDisplay="ItemDisplay",e.SceneName="SceneName",e.MiniMap="MiniMap",e.CoinCounter="CoinCounter",e.BossEnergyBar="BossEnergyBar",e.PhaseIndicator="PhaseIndicator",e.AttackAlert="AttackAlert",e.TextBox="TextBox",e.NumericField="NumericField",e.CustomCounter="CustomCounter",e))(X||{});const W={water:{bit:0,label:"Water Effect",maskValue:1,color:"rgba(50, 100, 200, 0.4)"},customGravity:{bit:1,label:"Custom Gravity",maskValue:2,color:"rgba(150, 50, 200, 0.4)"},icePhysics:{bit:2,label:"Ice Physics",maskValue:4,color:"rgba(100, 200, 255, 0.4)"},spriteConceal:{bit:3,label:"Sprite Concealment",maskValue:8,color:"rgba(100, 100, 100, 0.4)"}};var K=(e=>(e.None="None",e.Tile="Tile",e.Sprite="Sprite",e.Screen="Screen",e.Code="Code",e.Attributes="Attributes",e.Sound="Sound",e.Platformer="Platformer",e.WorldMap="WorldMap",e.Track="Track",e.HUD="HUD",e.TileBanks="TileBanks",e.Font="Font",e.HelpDocs="HelpDocs",e.BehaviorEditor="BehaviorEditor",e.ComponentDefinitionEditor="ComponentDefinitionEditor",e.EntityTemplateEditor="EntityTemplateEditor",e.Boss="Boss",e.WorldView="WorldView",e.GameFlow="GameFlow",e.MainMenu="MainMenu",e.StateMachine="StateMachine",e))(K||{});const we=[1,3,5,7],xe=[{id:0,name:"NoSolid (Passable)",isSolid:!1},{id:1,name:"Solid (Wall/Ground)",isSolid:!0},{id:2,name:"Platform (Top-Solid)",isSolid:!0},{id:3,name:"Slope (Solid)",isSolid:!0}],Be={isBreakable:{bit:0,label:"Breakable"},isMovable:{bit:1,label:"Movable"},causesDamage:{bit:2,label:"Deadly"},isInteractiveSwitch:{bit:3,label:"Interactable"}},$e="0.254",V=[{name:"Transparent",hex:"rgba(0,0,0,0)"},{name:"Black",hex:"#000000"},{name:"Medium Green",hex:"#3EB847"},{name:"Light Green",hex:"#74D07D"},{name:"Dark Blue",hex:"#2F2FC1"},{name:"Light Blue",hex:"#5858FC"},{name:"Dark Red",hex:"#B63125"},{name:"Cyan",hex:"#68D2DA"},{name:"Medium Red",hex:"#FC584A"},{name:"Light Red",hex:"#FF8E81"},{name:"Dark Yellow",hex:"#C0BF3B"},{name:"Light Yellow",hex:"#E7E474"},{name:"Dark Green",hex:"#309337"},{name:"Magenta",hex:"#B640C8"},{name:"Gray",hex:"#999999"},{name:"White",hex:"#FFFFFF"}],R=[{name:"Transparent (Backdrop)",hex:"rgba(0,0,0,0)",index:0},{name:"Black",hex:"#000000",index:1},{name:"Medium Green",hex:"#21C842",index:2},{name:"Light Green",hex:"#5EDC78",index:3},{name:"Dark Blue",hex:"#5455ED",index:4},{name:"Light Blue",hex:"#7D76FC",index:5},{name:"Dark Red",hex:"#D4524D",index:6},{name:"Cyan",hex:"#42EBF5",index:7},{name:"Medium Red",hex:"#FC5554",index:8},{name:"Light Red",hex:"#FF7978",index:9},{name:"Dark Yellow",hex:"#D4C154",index:10},{name:"Light Yellow",hex:"#E6CE80",index:11},{name:"Dark Green",hex:"#21B03B",index:12},{name:"Magenta",hex:"#C95BBA",index:13},{name:"Gray",hex:"#CCCCCC",index:14},{name:"White",hex:"#FFFFFF",index:15}],ke=[8,16,24,32],ve=16,Ge=16,He=16,v=32,Ye=24,Z=8,F=255,ze="SCREEN 2 (Graphics I)",Qe=["ADC","ADD","AND","BIT","CALL","CCF","CP","CPD","CPDR","CPI","CPIR","CPL","DAA","DEC","DI","DJNZ","EI","EX","EXX","HALT","IM","IN","INC","IND","INDR","INI","INIR","JP","JR","LD","LDD","LDDR","LDI","LDIR","NEG","NOP","OR","OTDR","OTIR","OUT","OUTD","OUTI","POP","PUSH","RES","RET","RETI","RETN","RL","RLA","RLC","RLCA","RLD","RR","RRA","RRC","RRCA","RRD","RST","SBC","SCF","SET","SLA","SLL","SRA","SRL","SUB","XOR"],Ve=["A","F","B","C","D","E","H","L","AF","BC","DE","HL","IXH","IXL","IYH","IYL","IX","IY","SP","PC","I","R","AF'"],je=["NZ","Z","NC","C","PO","PE","P","M"],Xe=[".ORG","ORG","END",".END",".EQU","EQU",".DB","DB",".BYTE","BYTE","DEFB",".DW","DW",".WORD","WORD","DEFW",".DS","DS",".BLOCK","BLOCK","DEFS",".DEFINE","DEFINE",".MACRO","MACRO",".ENDM","ENDM",".IF","IF",".ENDIF","ENDIF",".ELSE","ELSE",".INCLUDE","INCLUDE",".DEFM","DEFM",".ZILOG",".PHASE",".REPT",".ENDR",".SEARCH",".RANDOM",".ROM",".MEGAROM",".BASIC",".CAS",".WAV",".MSXDOS"],We=[{id:"pac_man_collection",name:"Pac-Man Tile Collection",description:"Efficient tile-based collection system for MSX (like Pac-Man dots)",code:`; Pac-Man Style Tile Collection System for MSX
; Optimized for MSX hardware limitations
; Uses: DE = Player position, HL = Screen map address

COLLECT_TILES:
    ; Input: DE = Player X,Y position (D=X, E=Y)
    ; Input: HL = Screen map base address
    ; Output: A = Number of items collected
    ; Destroys: BC, DE, HL
    
    push bc
    push de
    push hl
    
    ld a, 0                    ; Initialize collection counter
    ld (COLLECTION_COUNT), a
    
    ; Convert pixel position to tile coordinates
    ld a, d                    ; Player X
    srl a                      ; Divide by 2
    srl a                      ; Divide by 4
    srl a                      ; Divide by 8 (assuming 8x8 tiles)
    ld d, a                    ; D = Tile X
    
    ld a, e                    ; Player Y  
    srl a                      ; Divide by 2
    srl a                      ; Divide by 4
    srl a                      ; Divide by 8
    ld e, a                    ; E = Tile Y
    
    ; Calculate tile address: HL + (Y * MAP_WIDTH) + X
    ld a, e                    ; Y coordinate
    ld b, 0
    ld c, 32                   ; MAP_WIDTH (assuming 32 tiles wide)
    call MULTIPLY_AC           ; A = Y * MAP_WIDTH
    
    add a, d                   ; A = (Y * MAP_WIDTH) + X
    ld c, a
    ld b, 0
    add hl, bc                 ; HL points to tile at player position
    
    ; Check if current tile is collectible
    ld a, (hl)                 ; Load tile ID
    cp DOT_TILE_ID             ; Compare with dot tile
    jr z, COLLECT_DOT
    cp POWERUP_TILE_ID         ; Compare with power-up tile
    jr z, COLLECT_POWERUP
    cp FRUIT_TILE_ID           ; Compare with fruit tile
    jr z, COLLECT_FRUIT
    jr END_COLLECTION          ; Nothing to collect
    
COLLECT_DOT:
    ld a, EMPTY_TILE_ID        ; Replace with empty tile
    ld (hl), a
    ld a, (SCORE)              ; Load current score
    add a, 10                  ; Add 10 points for dot
    ld (SCORE), a
    ld a, (DOT_COUNT)          ; Increment dot counter
    inc a
    ld (DOT_COUNT), a
    call PLAY_DOT_SOUND        ; Play collection sound
    jr INCREMENT_COLLECTION

COLLECT_POWERUP:
    ld a, EMPTY_TILE_ID
    ld (hl), a
    ld a, (SCORE)
    add a, 50                  ; Add 50 points for power-up
    ld (SCORE), a
    ld a, 1
    ld (POWER_MODE), a         ; Activate power mode
    call PLAY_POWERUP_SOUND
    jr INCREMENT_COLLECTION

COLLECT_FRUIT:
    ld a, EMPTY_TILE_ID
    ld (hl), a
    ld a, (SCORE)
    add a, 100                 ; Add 100 points for fruit
    ld (SCORE), a
    ld a, (FRUIT_COUNT)
    inc a
    ld (FRUIT_COUNT), a
    call PLAY_FRUIT_SOUND
    jr INCREMENT_COLLECTION

INCREMENT_COLLECTION:
    ld a, (COLLECTION_COUNT)
    inc a
    ld (COLLECTION_COUNT), a

END_COLLECTION:
    ld a, (COLLECTION_COUNT)   ; Return collection count in A
    
    pop hl
    pop de
    pop bc
    ret

; Helper routine: Multiply A * C, result in A
MULTIPLY_AC:
    ld b, 0
    ld h, b
    ld l, a
    ld d, h
    ld e, l
    add hl, hl                 ; HL = A * 2
    jr nc, MUL_NO_CARRY1
    inc de
MUL_NO_CARRY1:
    add hl, hl                 ; HL = A * 4
    jr nc, MUL_NO_CARRY2
    inc de
MUL_NO_CARRY2:
    add hl, hl                 ; HL = A * 8
    jr nc, MUL_NO_CARRY3
    inc de
MUL_NO_CARRY3:
    add hl, hl                 ; HL = A * 16
    jr nc, MUL_NO_CARRY4
    inc de
MUL_NO_CARRY4:
    add hl, hl                 ; HL = A * 32
    ld a, l
    ret

; Sound effect stubs (implement based on your sound system)
PLAY_DOT_SOUND:
    ; Play dot collection sound
    ret
    
PLAY_POWERUP_SOUND:
    ; Play power-up sound
    ret
    
PLAY_FRUIT_SOUND:
    ; Play fruit collection sound
    ret

; Data section
DOT_TILE_ID:        EQU 1      ; Tile ID for collectible dots
POWERUP_TILE_ID:    EQU 2      ; Tile ID for power-ups
FRUIT_TILE_ID:      EQU 3      ; Tile ID for bonus fruits
EMPTY_TILE_ID:      EQU 0      ; Tile ID for empty space

; Memory variables
COLLECTION_COUNT:   DB 0       ; Items collected this frame
SCORE:              DW 0       ; Player score
DOT_COUNT:          DB 0       ; Total dots collected
FRUIT_COUNT:        DB 0       ; Total fruits collected
POWER_MODE:         DB 0       ; Power-up mode active flag`}],Ke=[],$=8,y=15,w=1;var z;const Ze=((z=R.find(e=>e.index===y))==null?void 0:z.hex)||R[15].hex;var Q;const Je=((Q=R.find(e=>e.index===w))==null?void 0:Q.hex)||R[1].hex,B=new Map(R.map(e=>[e.hex,e])),qe=new Map(R.map(e=>[e.index,e])),et=R[1],tt=32,nt=125,at=6,ot=31,it=15,rt=["A","B","C"],st=["C-","C#","D-","D#","E-","F-","F#","G-","G#","A-","A#","B-"],lt=[0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,7,7,6,6,5,5,4,4,3,3,2,2,1,1,0,0],ct=32,dt={q:{noteNameIndex:0,baseOctave:5},w:{noteNameIndex:1,baseOctave:5},e:{noteNameIndex:2,baseOctave:5},r:{noteNameIndex:3,baseOctave:5},t:{noteNameIndex:4,baseOctave:5},y:{noteNameIndex:5,baseOctave:5},u:{noteNameIndex:6,baseOctave:5},i:{noteNameIndex:7,baseOctave:5},o:{noteNameIndex:8,baseOctave:5},p:{noteNameIndex:9,baseOctave:5},"[":{noteNameIndex:10,baseOctave:5},"]":{noteNameIndex:11,baseOctave:5},a:{noteNameIndex:0,baseOctave:4},s:{noteNameIndex:1,baseOctave:4},d:{noteNameIndex:2,baseOctave:4},f:{noteNameIndex:3,baseOctave:4},g:{noteNameIndex:4,baseOctave:4},h:{noteNameIndex:5,baseOctave:4},j:{noteNameIndex:6,baseOctave:4},k:{noteNameIndex:7,baseOctave:4},l:{noteNameIndex:8,baseOctave:4},ñ:{noteNameIndex:9,baseOctave:4},";":{noteNameIndex:9,baseOctave:4},"'":{noteNameIndex:10,baseOctave:4},z:{noteNameIndex:0,baseOctave:3},x:{noteNameIndex:1,baseOctave:3},c:{noteNameIndex:2,baseOctave:3},v:{noteNameIndex:3,baseOctave:3},b:{noteNameIndex:4,baseOctave:3},n:{noteNameIndex:5,baseOctave:3},m:{noteNameIndex:6,baseOctave:3},",":{noteNameIndex:7,baseOctave:3},".":{noteNameIndex:8,baseOctave:3},2:{noteNameIndex:1,baseOctave:5},3:{noteNameIndex:3,baseOctave:5},5:{noteNameIndex:6,baseOctave:5},6:{noteNameIndex:8,baseOctave:5},7:{noteNameIndex:10,baseOctave:5}},_t={min:-2,max:2},J=[{id:"bank_0",name:"Bank 0 - HUD/Fonts",enabled:!0,vramPatternStart:0,vramColorStart:8192,screenZone:{x:0,y:0,width:v,height:8},charsetRangeStart:0,charsetRangeEnd:255,defaultFgColorIndex:15,defaultBgColorIndex:4,isLocked:!1,assignedTiles:{}},{id:"bank_1",name:"Bank 1 - Game Tileset",enabled:!0,vramPatternStart:2048,vramColorStart:10240,screenZone:{x:0,y:8,width:v,height:8},charsetRangeStart:0,charsetRangeEnd:255,defaultFgColorIndex:2,defaultBgColorIndex:1,isLocked:!1,assignedTiles:{}},{id:"bank_2",name:"Bank 2 - Background/Status",enabled:!0,vramPatternStart:4096,vramColorStart:12288,screenZone:{x:0,y:16,width:v,height:8},charsetRangeStart:0,charsetRangeEnd:255,defaultFgColorIndex:11,defaultBgColorIndex:6,isLocked:!1,assignedTiles:{}}],pt={isEnabled:!0,options:[{id:"start",label:"INICIAR PARTIDA",enabled:!0},{id:"continue",label:"CONTINUAR",enabled:!0},{id:"settings",label:"AJUSTES",enabled:!0},{id:"help",label:"AYUDA",enabled:!1}],keyMapping:{up:"ArrowUp",down:"ArrowDown",left:"ArrowLeft",right:"ArrowRight",fire1:" ",fire2:"m"},settings:{volume:12},continueScreen:{title:"CONTINUAR PARTIDA",prompt:"INTRODUCE TU CODIGO"},introScreen:{text:`EN EL ANO 2084, LA CORPORACION CYBERNETICA DOMINA EL MUNDO...

SOLO UN HEROE PUEDE DETENERLOS.`,backgroundAssetId:null},menuScreenAssetId:null,cursorSpriteAssetId:null,menuColors:{text:R[15].hex,background:R[4].hex,highlightText:R[11].hex,highlightBackground:R[5].hex,border:R[15].hex}},mt=W,Et="HELP_DOCS_SYSTEM_ASSET",ut=50,L=8,q=e=>{let n=e.toString(16).toUpperCase();return n.length===1&&(n="0"+n),n},ht=(e,n,t)=>{var d,E;if(!e.lineAttributes)return`;; ERROR: Tile ${n} is missing line attributes required for SCREEN 2 export.
`;const a=n.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let o=`;; Tile: ${n} (${e.width}x${e.height})
`;o+=`;; Structure: ${e.width/L}x${e.height/L} character blocks (8x8 pixels each)
`,o+=`;; Data format: ${t.toUpperCase()}

`;const i=e.width/L,s=e.height/L,l=p=>t==="hex"?`$${q(p)}`:p.toString(10),c=[],r=[];for(let p=0;p<s;p++)for(let u=0;u<i;u++){const S=`;; Character Block (${u}, ${p}) for ${a}`,A=[];for(let _=0;_<L;_++){const m=p*L+_;let T=0;if(e.lineAttributes[m]&&e.lineAttributes[m][u]){const C=e.lineAttributes[m][u].fg;for(let I=0;I<L;I++){const N=u*L+I;e.data[m]&&e.data[m][N]!==void 0&&e.data[m][N]===C&&(T|=1<<7-I)}}A.push(T)}const g=A.map(l).join(",");c.push({comment:`${S} - PATTERN Data (8 bytes):`,dataString:`DB ${g}`});const h=[];for(let _=0;_<L;_++){const m=p*L+_;let T=y<<4|w;if(e.lineAttributes[m]&&e.lineAttributes[m][u]){const C=e.lineAttributes[m][u],I=((d=B.get(C.fg))==null?void 0:d.index)??y,N=((E=B.get(C.bg))==null?void 0:E.index)??w;T=I<<4|N}h.push(T)}const f=h.map(l).join(",");r.push({comment:`${S} - COLOR Attribute Data (8 bytes - FG|BG):`,dataString:`DB ${f}`})}return o+=`;; --- PATTERN DATA ---
`,c.length>0?(o+=`${a}_PATTERN_DATA:
`,c.forEach(p=>{o+=`${p.comment}
`,o+=`    ${p.dataString}
`})):o+=`;; No pattern data generated.
`,o+=`
`,o+=`;; --- COLOR ATTRIBUTE DATA ---
`,r.length>0?(o+=`${a}_COLOR_DATA:
`,r.forEach(p=>{o+=`${p.comment}
`,o+=`    ${p.dataString}
`})):o+=`;; No color attribute data generated.
`,o+=`
;; End of Tile Data for ${a}
`,o},Tt=(e,n,t,a)=>{const o=Math.max(1,e/$);return Array(n).fill(null).map(()=>Array(o).fill(null).map(()=>({fg:t,bg:a})))},ee=(e,n)=>{var s,l,c,r;const t=[],a=e.width/L,o=e.height/L,i=n==="SCREEN 2 (Graphics I)";for(let d=0;d<o;d++)for(let E=0;E<a;E++)for(let p=0;p<L;p++){const u=d*L+p;let S=0,A;i&&e.lineAttributes&&e.lineAttributes[u]&&e.lineAttributes[u][E]&&(A=e.lineAttributes[u][E].fg);for(let g=0;g<L;g++){const h=E*L+g,f=(s=e.data[u])==null?void 0:s[h];if(f!==void 0){let _=!1;i&&A?_=f===A:i||(_=f!==V[0].hex&&f!==((r=(c=(l=e.lineAttributes)==null?void 0:l[0])==null?void 0:c[0])==null?void 0:r.bg)),_&&(S|=1<<7-g)}}t.push(S)}return new Uint8Array(t)},b=(e,n)=>{var i,s;const t=e.length;if(t===0)return[];const a=((i=e[0])==null?void 0:i.length)||0;if(a===0)return[[]];const o=e.map(l=>[...l]);for(let l=0;l<t;l++)for(let c=0;c<a;c++){const r=Math.floor(c/$),d=(s=n[l])==null?void 0:s[r],E=o[l][c];d&&E!==d.fg&&E!==d.bg&&(o[l][c]=d.fg)}return o},St=(e,n,t)=>{if(e.length<2)return e;const o=e.slice(1);return o.push([...e[0]]),t==="SCREEN 2 (Graphics I)"&&n?b(o,n):o},At=(e,n,t)=>{const a=e.length;if(a<2)return e;const o=e.slice(0,a-1);return o.unshift([...e[a-1]]),t==="SCREEN 2 (Graphics I)"&&n?b(o,n):o},ft=(e,n,t)=>{if(e.length===0)return[];const a=e.map(o=>{if(o.length<2)return[...o];const i=o.slice(1);return i.push(o[0]),i});return t==="SCREEN 2 (Graphics I)"&&n?b(a,n):a},It=(e,n,t)=>{if(e.length===0)return[];const a=e.map(o=>{const i=o.length;if(i<2)return[...o];const s=o.slice(0,i-1);return s.unshift(o[i-1]),s});return t==="SCREEN 2 (Graphics I)"&&n?b(a,n):a},gt=(e,n,t)=>{if(e.length===0)return[];const a=e.map(o=>[...o].reverse());return t==="SCREEN 2 (Graphics I)"&&n?b(a,n):a},Ct=(e,n,t)=>{if(e.length===0)return[];const a=[...e].reverse();return t==="SCREEN 2 (Graphics I)"&&n?b(a,n):a},te=e=>{var o,i,s;if(!e.lineAttributes)return null;const n=[],t=e.width/L,a=e.height/L;for(let l=0;l<a;l++)for(let c=0;c<t;c++)for(let r=0;r<L;r++){const d=l*L+r;let E=y<<4|w;const p=(o=e.lineAttributes[d])==null?void 0:o[c];if(p){const u=((i=B.get(p.fg))==null?void 0:i.index)??y,S=((s=B.get(p.bg))==null?void 0:s.index)??w;E=u<<4|S}n.push(E)}return new Uint8Array(n)},Nt=e=>{const n=[];e.frames.forEach(a=>{var o;for(let i=0;i<e.spritePalette.length;i++){const s=e.spritePalette[i];if(s===e.backgroundColor)continue;let l=!1;const c=[];for(let r=0;r<e.size.height;r++)for(let d=0;d<Math.ceil(e.size.width/8);d++){let E=0;for(let p=0;p<8;p++){const u=d*8+p;u<e.size.width&&((o=a.data[r])==null?void 0:o[u])===s&&(E|=1<<7-p,l=!0)}c.push(E)}l&&n.push(c)}});const t=n.flat();return new Uint8Array(t)},Lt=e=>e.map(n=>[...n].reverse()),Dt=e=>[...e].reverse(),ne=e=>{let n=e.toString(16).toUpperCase();return n.length===1&&(n="0"+n),n},ae=(e,n,t,a,o,i,s="hex")=>{var E,p;const c=e.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let r=`;; ---- Sprite Frame: ${e} ----
`;r+=`;; Size: ${o}x${i}
`;let d=0;for(let u=0;u<t.length;u++){const S=t[u];let A=!1;if(S!==a)for(let h=0;h<i;h++){for(let f=0;f<o;f++)if(((E=n[h])==null?void 0:E[f])===S){A=!0;break}if(A)break}if(!A){r+=`;; Layer ${u} (Color: ${S}) - SKIPPED (color not used or is background)
`;continue}d++,r+=`${c}_LAYER${u}: ; Brush Color Index ${u} (Actual Color: ${S})
`;const g=[];o%8!==0&&(r+=`;; WARNING: Sprite width ${o} is not a multiple of 8. Bitmask generation might be problematic for standard VDP.
`);for(let h=0;h<i;h++)for(let f=0;f<Math.ceil(o/8);f++){let _=0;for(let m=0;m<8;m++){const T=f*8+m;T<o&&((p=n[h])==null?void 0:p[T])===S&&(_|=1<<7-m)}g.push(_)}for(let h=0;h<g.length;h+=16){const _=g.slice(h,h+16).map(m=>s==="hex"?`#${ne(m)}`:m.toString());r+=`    DB ${_.join(",")}
`}r+=`
`}return d===0&&(r+=`;; NO ACTIVE LAYERS EXPORTED for ${e} - Frame might be empty or only contain the background color.
`),r+=`;; ---- End of Frame: ${e} ----

`,r},oe=(e,n="hex")=>{let t=`;; Sprite: ${e.name}
`;t+=`;; Total Frames: ${e.frames.length}
`,t+=`;; Size: ${e.size.width}x${e.size.height}
`,t+=`;; Background Color (not exported as a layer): ${e.backgroundColor}
`,t+=`;; Drawable Palette (Hex): C0=${e.spritePalette[0]}, C1=${e.spritePalette[1]}, C2=${e.spritePalette[2]}, C3=${e.spritePalette[3]}

`;const a=e.name.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();return t+=`SPRITE_${a}_WIDTH     EQU ${e.size.width}
`,t+=`SPRITE_${a}_HEIGHT    EQU ${e.size.height}
`,t+=`SPRITE_${a}_FRAMES    EQU ${e.frames.length}

`,e.frames.forEach((o,i)=>{t+=ae(`${e.name}_F${i}`,o.data,e.spritePalette,e.backgroundColor,e.size.width,e.size.height,n)}),t},ie=(e,n,t,a)=>{var p;const o=e.layers.background,i=e.activeAreaX??0,s=e.activeAreaY??0,l=e.activeAreaWidth??e.width,c=e.activeAreaHeight??e.height,r=[];let d=0;const E=new Map;for(let u=0;u<c;u++){const S=s+u;for(let A=0;A<l;A++){const g=i+A;if(S>=o.length||g>=((p=o[S])==null?void 0:p.length)){r.push(F);continue}const h=o[S][g];if(!h||!h.tileId)r.push(F);else{let f=F;const _=n.find(m=>m.id===h.tileId);if(a==="SCREEN 2 (Graphics I)"&&t&&_){let m=!1;for(const T of t)if((T.enabled??!0)&&T.assignedTiles[h.tileId]){const C=T.assignedTiles[h.tileId].charCode,I=Math.ceil(_.width/Z),N=h.subTileX||0,D=h.subTileY||0;if(f=C+D*I+N,f>=T.charsetRangeStart&&f<=T.charsetRangeEnd){m=!0;break}else f=F}m||(f=F)}else if(a!=="SCREEN 2 (Graphics I)"){const m=`${h.tileId}_${h.subTileX??0}_${h.subTileY??0}`;E.has(m)?f=E.get(m):d>255?f=F:(E.set(m,d),f=d++)}r.push(f)}}}return new Uint8Array(r)},re=(e,n,t,a,o,i="hex")=>{const l=e.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let c=`;; MAP: ${e} (${n}x${t} tiles)
`;c+=`;; Total size: ${a.length} bytes

`,o.length>0&&(c+=`;; --- TILE INDEX REFERENCES for ${l} ---
`,c+=o.join(`
`)+`

`),c+=`SCREEN_${l}_WIDTH     EQU ${n}
`,c+=`SCREEN_${l}_HEIGHT    EQU ${t}
`,c+=`SCREEN_${l}_SIZE      EQU ${a.length}

`,c+=`SCREEN_${l}_LAYOUT:
`;for(let r=0;r<a.length;r+=16){const E=a.slice(r,r+16).map(p=>i==="hex"?`#${p.toString(16).padStart(2,"0").toUpperCase()}`:p.toString());c+=`    DB ${E.join(",")}
`}return c},se=(e,n,t,a,o="hex")=>{const s=e.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let l=`;; BEHAVIOR MAP: ${e} (${n}x${t} tiles)
`;l+=`;; Total size: ${a.length} bytes (Map IDs 0-255)
`,l+=`;; Data format: ${o.toUpperCase()}

`,l+=`BEHAVIOR_${s}_WIDTH     EQU ${n}
`,l+=`BEHAVIOR_${s}_HEIGHT    EQU ${t}
`,l+=`BEHAVIOR_${s}_SIZE      EQU ${a.length}

`,l+=`BEHAVIOR_${s}_DATA:
`;const c=r=>o==="hex"?`#${r.toString(16).padStart(2,"0").toUpperCase()}`:r.toString(10);for(let r=0;r<a.length;r+=16){const E=a.slice(r,r+16).map(c);l+=`    DB ${E.join(",")}
`}return l+=`
;; End of Behavior Map Data for ${e}
`,l},Rt=(e,n)=>{if(e.width!==n.width||e.height!==n.height||e.data.length!==n.data.length)return!1;for(let t=0;t<e.height;t++){if(e.data[t].length!==n.data[t].length)return!1;for(let a=0;a<e.width;a++)if(e.data[t][a]!==n.data[t][a])return!1}if(e.lineAttributes&&n.lineAttributes){if(e.lineAttributes.length!==n.lineAttributes.length)return!1;for(let t=0;t<e.lineAttributes.length;t++){if(e.lineAttributes[t].length!==n.lineAttributes[t].length)return!1;for(let a=0;a<e.lineAttributes[t].length;a++)if(e.lineAttributes[t][a].fg!==n.lineAttributes[t][a].fg||e.lineAttributes[t][a].bg!==n.lineAttributes[t][a].bg)return!1}}else if(e.lineAttributes!==n.lineAttributes)return!1;return JSON.stringify(e.logicalProperties)===JSON.stringify(n.logicalProperties)};function Ot(e,n,t,a,o,i,s){const{data:l,width:c,height:r,lineAttributes:d}=e;if(!l||r===0||c===0)return"";const E=document.createElement("canvas");E.width=i,E.height=i;const p=E.getContext("2d");if(!p)return"";p.imageSmoothingEnabled=!1;const u=(n??0)*i,S=(t??0)*i;for(let h=0;h<i;h++)for(let f=0;f<i;f++){const _=u+f,m=S+h;if(m>=0&&m<r&&_>=0&&_<c){let T=l[m][_];if(s==="SCREEN 2 (Graphics I)"&&d&&d[m]){const C=Math.floor(_/$),I=d[m][C];I&&T!==I.fg&&T!==I.bg&&(T=I.fg)}p.fillStyle=T,p.fillRect(f,h,1,1)}}if(E.width===a&&E.height===o)return E.toDataURL();const A=document.createElement("canvas");A.width=a,A.height=o;const g=A.getContext("2d");return g?(g.imageSmoothingEnabled=!1,g.drawImage(E,0,0,a,o),A.toDataURL()):E.toDataURL()}function Mt(e,n,t){var i;if(!e||t===0||n===0)return"";const a=document.createElement("canvas");a.width=n,a.height=t;const o=a.getContext("2d");if(!o)return"";o.imageSmoothingEnabled=!1;for(let s=0;s<t;s++)for(let l=0;l<n;l++){const c=(i=e[s])==null?void 0:i[l];c&&c!=="rgba(0,0,0,0)"&&(o.fillStyle=c,o.fillRect(l,s,1,1))}return a.toDataURL()}const Ft=(e,n,t,a,o)=>{var r,d;const i=a==="SCREEN 2 (Graphics I)";e.width=n.width*o,e.height=n.height*o;const s=e.getContext("2d");if(!s)return;s.imageSmoothingEnabled=!1;const l=i?R[1].hex:V[4].hex;s.fillStyle=l,s.fillRect(0,0,e.width,e.height);const c=n.layers.background;for(let E=0;E<n.height;E++)for(let p=0;p<n.width;p++){const u=(r=c[E])==null?void 0:r[p];if(!(u!=null&&u.tileId))continue;const S=t.find(I=>I.id===u.tileId);if(!S)continue;const{data:A,width:g,height:h,lineAttributes:f}=S;if(!A)continue;const _=u.subTileX??0,m=u.subTileY??0,T=_*o,C=m*o;for(let I=0;I<o;I++)for(let N=0;N<o;N++){const D=T+N,O=C+I;if(O<h&&D<g){let M=(d=A[O])==null?void 0:d[D];if(M===void 0)continue;if(i&&f&&f[O]){const k=Math.floor(D/$),x=f[O][k];x&&M!==x.fg&&M!==x.bg&&(M=x.fg)}s.fillStyle=M,s.fillRect(p*o+N,E*o+I,1,1)}}}};function Y(e,n){const t=n.filter(_=>_.type==="componentdefinition").map(_=>_.data),a=n.filter(_=>_.type==="entitytemplate").map(_=>_.data),o=n.filter(_=>_.type==="sprite").map(_=>_.data),i=n.filter(_=>_.type==="tile").map(_=>_.data),s=n.filter(_=>_.type==="screenmap").map(_=>_.data),l=n.filter(_=>_.type==="worldmap").map(_=>_.data),c=[];s.forEach(_=>{var m;(m=_.layers)!=null&&m.entities&&Array.isArray(_.layers.entities)&&c.push(..._.layers.entities),_.entities&&Array.isArray(_.entities)&&c.push(..._.entities)});const r=n.find(_=>_.type==="gameflow"),d=r==null?void 0:r.data,E=c.length>0,p=t.length>0||E,u=s.length>1,S=o.length>0,A=o.some(_=>_.frames.length>1),g=s.some(_=>_.layers.collision.some(m=>m.some(T=>T!==null))),h=a.some(_=>_.name.toLowerCase().includes("menu")),f=[];return t.forEach(_=>{_.name.toLowerCase().includes("state")&&f.push(_.name.replace(/[^a-zA-Z0-9]/g,"").toUpperCase())}),{projectName:e,components:t,templates:a,sprites:o,tiles:i,screenMaps:s,worldmaps:l,entities:c,gameFlow:d,hasECS:p,hasMultipleScreens:u,hasSprites:S,hasAnimations:A,hasCollisions:g,hasMenuSystem:h,customStates:f}}const le=e=>{if(!e.hasECS)return`    ; No ECS system - basic entity updates
    RET`;let n=`    ; ECS-based entity updates
    ; Update all active entities with their components
    LD HL, ENTITY_BUFFER
    LD B, MAX_ENTITIES
    
entity_update_loop:
    PUSH BC
    PUSH HL
    
    ; Check if entity is active
    LD A, (HL)
    OR A
    JR Z, entity_update_skip
    
    ; Update entity based on components`;return e.components.forEach((t,a)=>{n+=`
    ; Update ${t.name} component
    CALL UPDATE_${t.name.toUpperCase().replace(/[^A-Z0-9]/g,"_")}`}),n+=`
    
entity_update_skip:
    POP HL
    LD DE, 16           ; Entity structure size
    ADD HL, DE
    POP BC
    DJNZ entity_update_loop
    RET`,n},ce=e=>{if(!e.hasSprites)return`    ; No sprites to update
    RET`;let n=`    ; Update sprite animations and positions
    LD B, ${e.sprites.length}    ; Number of sprites
    LD HL, SPRITE_DATA_TABLE
    
sprite_update_loop:
    PUSH BC
    PUSH HL
    
    ; Update sprite frame animation
    LD A, (HL)          ; Current frame
    INC HL
    LD C, (HL)          ; Max frames
    INC HL
    LD B, (HL)          ; Animation speed counter
    INC B
    LD (HL), B
    
    ; Check if it's time to advance frame
    LD A, B
    CP 4                ; Animation speed (adjust as needed)
    JR C, sprite_no_frame_advance
    
    ; Reset counter and advance frame
    XOR A
    LD (HL), A
    DEC HL
    DEC HL
    LD A, (HL)          ; Current frame
    INC A
    CP C                ; Compare with max frames
    JR C, sprite_frame_ok
    XOR A               ; Reset to frame 0
sprite_frame_ok:
    LD (HL), A
    
sprite_no_frame_advance:`;return e.hasAnimations&&(n+=`
    ; Update sprite position based on movement component
    INC HL
    INC HL
    INC HL
    LD A, (HL)          ; X position
    INC HL  
    LD B, (HL)          ; Y position
    ; Apply movement logic here
    ; CALL APPLY_SPRITE_MOVEMENT`),n+=`
    
    POP HL
    LD DE, 8            ; Sprite data structure size
    ADD HL, DE
    POP BC
    DJNZ sprite_update_loop
    RET`,n},de=e=>e.hasCollisions?`    ; Check player collision with environment
    LD A, (player_x)
    LD B, A
    LD A, (player_y) 
    LD C, A
    
    ; Convert pixel position to tile coordinates
    SRL B
    SRL B
    SRL B               ; B = tile_x = pixel_x / 8
    SRL C
    SRL C  
    SRL C               ; C = tile_y = pixel_y / 8
    
    ; Calculate collision map offset
    LD H, 0
    LD L, C             ; HL = tile_y
    ADD HL, HL          ; HL = tile_y * 2
    ADD HL, HL          ; HL = tile_y * 4
    ADD HL, HL          ; HL = tile_y * 8
    ADD HL, HL          ; HL = tile_y * 16
    ADD HL, HL          ; HL = tile_y * 32 (assuming 32 tiles wide)
    LD D, 0
    LD E, B             ; DE = tile_x
    ADD HL, DE          ; HL = tile_y * 32 + tile_x
    
    ; Add collision map base address
    LD DE, COLLISION_MAP_DATA
    ADD HL, DE
    
    ; Check collision
    LD A, (HL)
    OR A
    RET Z               ; No collision
    
    ; Handle collision
    LD A, STATE_DYING
    LD (current_game_state), A
    RET`:`    ; No collision system needed
    RET`,_e=e=>{let n=`    ; Read MSX joystick/keyboard input
    ; Store previous state
    LD A, (input_state)
    LD (prev_input_state), A
    
    ; Read joystick port 1
    LD A, 1
    CALL GTSTCK         ; Get joystick direction
    LD B, A
    
    ; Read trigger buttons
    LD A, 1
    CALL GTTRIG         ; Get trigger state
    LD C, A
    
    ; Convert to our input format
    XOR A               ; Start with no input
    
    ; Check directions
    LD A, B
    CP 1                ; Up
    JR NZ, input_not_up
    LD A, (input_state)
    SET INPUT_BIT_UP, A
    LD (input_state), A
    JR input_check_down
    
input_not_up:
    CP 5                ; Down  
    JR NZ, input_check_down
    LD A, (input_state)
    SET INPUT_BIT_DOWN, A
    LD (input_state), A
    
input_check_down:
    LD A, B
    CP 7                ; Left
    JR NZ, input_not_left
    LD A, (input_state)
    SET INPUT_BIT_LEFT, A
    LD (input_state), A
    JR input_check_right
    
input_not_left:
    CP 3                ; Right
    JR NZ, input_check_right
    LD A, (input_state)
    SET INPUT_BIT_RIGHT, A
    LD (input_state), A
    
input_check_right:
    ; Check fire buttons
    LD A, C
    BIT 0, A            ; Fire 1
    JR Z, input_no_fire1
    LD A, (input_state)
    SET INPUT_BIT_FIRE1, A
    LD (input_state), A
    
input_no_fire1:`;return e.hasMenuSystem&&(n+=`
    ; Check for pause/menu button (Space)
    LD A, 6             ; Row 6
    CALL SNSMAT
    BIT 0, A            ; Space key
    JR NZ, input_no_pause
    LD A, (input_state)
    SET INPUT_BIT_PAUSE, A
    LD (input_state), A
    
input_no_pause:`),n+=`
    RET`,n},pe=e=>e.hasMenuSystem?`    ; Update menu graphics and cursor
    LD A, (menu_cursor_position)
    LD B, A
    
    ; Flash cursor
    LD A, (state_timer)
    AND 15              ; Flash every 16 frames
    JR NZ, menu_cursor_visible
    
    ; Hide cursor
    LD A, 32            ; Space character
    JR menu_draw_cursor
    
menu_cursor_visible:
    LD A, '>'           ; Cursor character
    
menu_draw_cursor:
    ; Calculate cursor screen position
    LD C, B             ; Cursor position
    SLA C
    SLA C               ; C = position * 4 (spacing)
    LD B, 10            ; Base Y position
    ADD C, B            ; C = final Y position
    
    ; Draw cursor at position
    LD H, 12            ; X position
    LD L, C             ; Y position
    CALL SETCUR
    CALL CHPUT
    
    RET`:`    ; No menu system
    RET`,me=e=>{if(e.customStates.length===0)return"; No custom states detected";let n=`; Custom state handlers for project-specific logic
`;return e.customStates.forEach(t=>{n+=`
logic_${t.toLowerCase()}:
    ; Custom logic for ${t} state
    ; TODO: Implement ${t} specific logic
    RET
`}),n},Ee=[{marker:"{{ENTITY_UPDATES}}",generator:le,description:"Entity update system based on ECS components"},{marker:"{{SPRITE_UPDATES}}",generator:ce,description:"Sprite animation and movement updates"},{marker:"{{COLLISION_CHECK}}",generator:de,description:"Collision detection system"},{marker:"{{INPUT_HANDLING}}",generator:_e,description:"Input handling with project-specific controls"},{marker:"{{MENU_SYSTEM}}",generator:pe,description:"Menu system updates and rendering"},{marker:"{{CUSTOM_STATES}}",generator:me,description:"Custom state handlers detected from project"}];function ue(e,n,t,a=Ee){const o=Y(n,t);let i=e;return i=i.replace(/{{PROJECT_NAME}}/g,n.toUpperCase()),i=i.replace(/{{PROJECT_NAME_LOWER}}/g,n.toLowerCase()),i=i.replace(/{{GENERATION_DATE}}/g,new Date().toISOString()),a.forEach(s=>{if(i.includes(s.marker)){const l=s.generator(o);i=i.replace(new RegExp(Te(s.marker),"g"),l)}}),i}function he(){return`;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Dynamic State Machine System for {{PROJECT_NAME}}
;; Generated by MSX Retro Game IDE on {{GENERATION_DATE}}
;;
;; Implements a V-Blank interrupt hook with dynamic jump table
;; for handling different game states (playing, dying, paused, etc.)
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

INCLUDE "constants.asm"

; State definitions
STATE_PLAYING       EQU 0
STATE_DYING         EQU 1
STATE_CHANGING_ZONE EQU 2
STATE_PAUSED        EQU 3
STATE_MENU          EQU 4
STATE_GAMEOVER      EQU 5
STATE_LOADING       EQU 6
MAX_STATES          EQU 7

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Initialize State Machine System
;; Input: None
;; Output: None
;; Destroys: All registers
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
INIT_STATE_MACHINE:
    DI
    
    ; Save original V-Blank routine
    LD HL, (TIMI)
    LD (original_vblank_routine), HL
    
    ; Set initial game state
    LD A, STATE_MENU
    LD (current_game_state), A
    
    ; Initialize state timer
    XOR A
    LD (state_timer), A
    LD (state_timer+1), A
    
    ; Install our V-Blank interrupt handler
    LD HL, vblank_isr
    LD (TIMI), HL
    
    EI
    RET

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; V-Blank Interrupt Service Routine
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
vblank_isr:
    ; Preserve all registers
    PUSH AF
    PUSH BC
    PUSH DE
    PUSH HL
    PUSH IX
    PUSH IY
    
    ; Call the state machine dispatcher
    CALL GAME_LOGIC_DISPATCHER
    
    ; Increment state timer (16-bit)
    LD HL, state_timer
    INC (HL)
    JR NZ, vblank_skip_high
    INC HL
    INC HL
vblank_skip_high:
    
    ; Restore all registers
    POP IY
    POP IX
    POP HL
    POP DE
    POP BC
    POP AF
    
    EI
    RETI

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Game Logic Dispatcher (Heart of State Machine)
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
GAME_LOGIC_DISPATCHER:
    ; Load current state
    LD A, (current_game_state)
    
    ; Bounds check
    CP MAX_STATES
    JR NC, dispatch_error
    
    ; Calculate jump table index (state * 2 for word addresses)
    LD L, A
    LD H, 0
    ADD HL, HL          ; HL = state * 2
    
    ; Add jump table base address
    LD DE, jump_table
    ADD HL, DE          ; HL now points to correct jump table entry
    
    ; Load routine address and jump to it
    LD E, (HL)
    INC HL
    LD D, (HL)
    
    ; Jump to the state routine
    PUSH DE
    RET                 ; RET pops address from stack and jumps

dispatch_error:
    ; Invalid state - reset to menu
    LD A, STATE_MENU
    LD (current_game_state), A
    RET

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Jump Table - Must match state definitions order!
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
jump_table:
    DEFW logic_playing          ; STATE_PLAYING (0)
    DEFW logic_dying            ; STATE_DYING (1)
    DEFW logic_changing_zone    ; STATE_CHANGING_ZONE (2)
    DEFW logic_paused           ; STATE_PAUSED (3)
    DEFW logic_menu             ; STATE_MENU (4)
    DEFW logic_gameover         ; STATE_GAMEOVER (5)
    DEFW logic_loading          ; STATE_LOADING (6)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; State Logic Routines - DYNAMIC CONTENT
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Playing State Logic - Customized for {{PROJECT_NAME}}
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
logic_playing:
    ; Read input
    CALL READ_INPUT_STATE
    
    ; Update game entities (ECS system)
    CALL UPDATE_GAME_ENTITIES
    
    ; Update sprites and graphics
    CALL UPDATE_SPRITES
    
    ; Check collisions
    CALL CHECK_PLAYER_STATUS
    
    ; Check for pause input
    LD A, (input_state)
    BIT INPUT_BIT_PAUSE, A
    JR Z, playing_no_pause
    
    ; Switch to paused state
    LD A, STATE_PAUSED
    LD (current_game_state), A
    CALL RESET_STATE_TIMER
    RET

playing_no_pause:
    RET

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Menu State Logic
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
logic_menu:
    ; Update menu animation/effects
    CALL UPDATE_MENU_GRAPHICS
    
    ; Handle menu input
    CALL READ_INPUT_STATE
    LD A, (input_state)
    
    ; Check for start game
    BIT INPUT_BIT_FIRE1, A
    JR Z, menu_no_start
    
    ; Check for new button press
    LD A, (prev_input_state)
    BIT INPUT_BIT_FIRE1, A
    JR NZ, menu_no_start
    
    ; Start game
    LD A, STATE_LOADING
    LD (current_game_state), A
    CALL RESET_STATE_TIMER
    RET

menu_no_start:
    ; Check for menu navigation
    LD A, (input_state)
    BIT INPUT_BIT_UP, A
    JR Z, menu_no_up
    CALL MOVE_MENU_CURSOR_UP
    
menu_no_up:
    BIT INPUT_BIT_DOWN, A
    JR Z, menu_no_down
    CALL MOVE_MENU_CURSOR_DOWN
    
menu_no_down:
    RET

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Other standard states (dying, paused, etc.)
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
logic_dying:
    CALL UPDATE_DEATH_ANIMATION
    
    LD A, (state_timer)
    CP 180                      ; 3 seconds at 60fps
    JR C, dying_continue
    
    LD A, (player_lives)
    OR A
    JR Z, dying_game_over
    
    DEC A
    LD (player_lives), A
    LD A, STATE_PLAYING
    LD (current_game_state), A
    CALL RESET_STATE_TIMER
    CALL RESPAWN_PLAYER
    RET

dying_game_over:
    LD A, STATE_GAMEOVER
    LD (current_game_state), A
    CALL RESET_STATE_TIMER
    RET

dying_continue:
    RET

logic_changing_zone:
    ; Zone transition logic
    LD A, (state_timer)
    CP 30
    JR C, zone_fade_out
    CP 90
    JR C, zone_loading
    CP 120
    JR C, zone_fade_in
    
    LD A, STATE_PLAYING
    LD (current_game_state), A
    CALL RESET_STATE_TIMER
    RET

zone_fade_out:
    CALL UPDATE_FADE_OUT
    RET

zone_loading:
    LD A, (state_timer)
    CP 31
    JR NZ, zone_loading_skip
    CALL LOAD_NEW_ZONE_DATA
zone_loading_skip:
    RET

zone_fade_in:
    CALL UPDATE_FADE_IN
    RET

logic_paused:
    CALL DISPLAY_PAUSE_MESSAGE
    
    CALL READ_INPUT_STATE
    LD A, (input_state)
    BIT INPUT_BIT_PAUSE, A
    JR Z, paused_continue
    
    LD A, (prev_input_state)
    BIT INPUT_BIT_PAUSE, A
    JR NZ, paused_continue
    
    LD A, STATE_PLAYING
    LD (current_game_state), A
    CALL RESET_STATE_TIMER
    CALL CLEAR_PAUSE_MESSAGE
    
paused_continue:
    RET

logic_gameover:
    CALL UPDATE_GAMEOVER_SCREEN
    
    CALL READ_INPUT_STATE
    LD A, (input_state)
    BIT INPUT_BIT_FIRE1, A
    JR Z, gameover_continue
    
    LD A, (prev_input_state)
    BIT INPUT_BIT_FIRE1, A
    JR NZ, gameover_continue
    
    LD A, STATE_MENU
    LD (current_game_state), A
    CALL RESET_STATE_TIMER
    CALL RESET_GAME_DATA
    
gameover_continue:
    RET

logic_loading:
    CALL UPDATE_LOADING_SCREEN
    
    LD A, (state_timer)
    CP 120                      ; 2 seconds loading time
    JR C, loading_continue
    
    LD A, STATE_PLAYING
    LD (current_game_state), A
    CALL RESET_STATE_TIMER
    CALL INIT_GAME_LEVEL
    
loading_continue:
    RET

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Dynamic Generated Functions - HOT SPOTS
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Input Handling - Project Specific
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
READ_INPUT_STATE:
{{INPUT_HANDLING}}

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Entity Updates - ECS Based
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
UPDATE_GAME_ENTITIES:
{{ENTITY_UPDATES}}

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Sprite System Updates
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
UPDATE_SPRITES:
{{SPRITE_UPDATES}}

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Collision Detection
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
CHECK_PLAYER_STATUS:
{{COLLISION_CHECK}}

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Menu System
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
UPDATE_MENU_GRAPHICS:
{{MENU_SYSTEM}}

MOVE_MENU_CURSOR_UP:
    LD A, (menu_cursor_position)
    OR A
    RET Z
    DEC A
    LD (menu_cursor_position), A
    RET

MOVE_MENU_CURSOR_DOWN:
    LD A, (menu_cursor_position)
    CP 3                ; Assuming 4 menu items (0-3)
    RET Z
    INC A
    LD (menu_cursor_position), A
    RET

{{CUSTOM_STATES}}

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Helper Functions
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

CHANGE_GAME_STATE:
    LD (current_game_state), A
    CALL RESET_STATE_TIMER
    RET

RESET_STATE_TIMER:
    XOR A
    LD HL, state_timer
    LD (HL), A
    INC HL
    LD (HL), A
    RET

GET_CURRENT_STATE:
    LD A, (current_game_state)
    RET

GET_STATE_TIMER:
    LD HL, (state_timer)
    RET

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Stub Functions (Basic implementations)
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

UPDATE_DEATH_ANIMATION:
    RET

RESPAWN_PLAYER:
    RET

LOAD_NEW_ZONE_DATA:
    RET

UPDATE_FADE_OUT:
    RET

UPDATE_FADE_IN:
    RET

DISPLAY_PAUSE_MESSAGE:
    RET

CLEAR_PAUSE_MESSAGE:
    RET

UPDATE_GAMEOVER_SCREEN:
    RET

UPDATE_LOADING_SCREEN:
    RET

RESET_GAME_DATA:
    RET

INIT_GAME_LEVEL:
    RET

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Input bit definitions
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
INPUT_BIT_UP        EQU 0
INPUT_BIT_DOWN      EQU 1  
INPUT_BIT_LEFT      EQU 2
INPUT_BIT_RIGHT     EQU 3
INPUT_BIT_FIRE1     EQU 4
INPUT_BIT_FIRE2     EQU 5
INPUT_BIT_PAUSE     EQU 6
INPUT_BIT_SELECT    EQU 7

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Data Section
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
current_game_state:
    DB STATE_MENU               ; Current game state

state_timer:
    DW 0                        ; 16-bit frame counter for current state

original_vblank_routine:
    DW 0                        ; Storage for original V-Blank handler

input_state:
    DB 0                        ; Current frame input

prev_input_state:
    DB 0                        ; Previous frame input  

player_lives:
    DB 3                        ; Player life counter

menu_cursor_position:
    DB 0                        ; Menu cursor position

player_x:
    DB 128                      ; Player X position

player_y:
    DB 128                      ; Player Y position

; Entity buffer for ECS system (16 bytes per entity, 32 entities max)
ENTITY_BUFFER:
    DS 512                      ; 32 entities * 16 bytes

; Sprite data buffer
SPRITE_DATA_TABLE:
    DS 64                       ; 8 sprites * 8 bytes each

; Collision map data (will be loaded from project)
COLLISION_MAP_DATA:
    DS 1024                     ; 32x32 collision map
`}function Te(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function bt(e,n){const t=he(),a=ue(t,e,n),i=`${e.toLowerCase().replace(/[^a-z0-9]/g,"_")}_dynamic_system.asm`,s=Y(e,n);return{filename:i,content:a,analysis:s}}function Se(){return`; ==================================================================
; MSX BIOS FUNCTIONS AND ADDRESSES
; File: bios.asm
; Description: Standard MSX BIOS function definitions
; ==================================================================

; ==================================================================
; MAIN BIOS FUNCTIONS
; ==================================================================

; Screen and Display
CHGMOD  EQU #005F        ; Change screen mode (A=mode)
CHGCLR  EQU #0062        ; Change colors
CLS     EQU #00C3        ; Clear screen
POSIT   EQU #00C6        ; Position cursor (H=X, L=Y)
ERAFNK  EQU #00CC        ; Erase function keys
DSPFNK  EQU #00CF        ; Display function keys
DISSCR  EQU #0041        ; Disable screen (prevent flicker)
ENASCR  EQU #0044        ; Enable screen
INITXT  EQU #006C        ; Initialize text mode
INIT32  EQU #006F        ; Initialize screen mode

; Character I/O
CHPUT   EQU #00A2        ; Character output (A=char)
CHGET   EQU #009F        ; Character input
CHSNS   EQU #009C        ; Character sense (check key)
BREAKX  EQU #00B7        ; Check CTRL+STOP
ISCNTC  EQU #00BA        ; Check CTRL+C

; String I/O
OUTDO   EQU #005A        ; String output (HL=string)

; Input Devices
GTSTCK  EQU #00D5        ; Get joystick status (A=port)
GTTRIG  EQU #00D8        ; Get trigger status (A=port)
GTPAD   EQU #00DB        ; Get paddle (A=port)
GTPDL   EQU #00DE        ; Get paddle value
SNSMAT  EQU #0141        ; Sense matrix (A=row)
KILBUF  EQU #0156        ; Kill keyboard buffer

; Sound
GICINI  EQU #0090        ; Initialize PSG
WRTPSG  EQU #0093        ; Write PSG register (A=reg, E=value)
RDPSG   EQU #0096        ; Read PSG register (A=reg)

; Graphics VDP
GRPPRT  EQU #0089        ; Print in graphic mode
SETGRP  EQU #007E        ; Set graphic mode

; Memory Transfer
LDIRVM  EQU #005C        ; Block transfer from CPU to VRAM
LDIRMV  EQU #0059        ; Block transfer from VRAM to CPU
WRTVDP  EQU #0047        ; Write to VDP register
WRTVRM  EQU #004D        ; Write data to VRAM (A=data, HL=address)

; File I/O (Disk BIOS)
DSKIO   EQU #004A        ; Disk I/O
DSKCHF  EQU #004D        ; Disk change flag

; Math
GETYPR  EQU #0053        ; Get type of variable

; ==================================================================
; VDP PORTS AND REGISTERS
; ==================================================================

; VDP Data/Status Ports
VDPDR   EQU #0098        ; VDP Data Register (Port 0)
VDPSR   EQU #0099        ; VDP Status Register (Port 1)

; VDP Registers (use with VDPSR)
VDP_R0  EQU 0            ; Mode register 0
VDP_R1  EQU 1            ; Mode register 1
VDP_R2  EQU 2            ; Name table base address
VDP_R3  EQU 3            ; Color table base address
VDP_R4  EQU 4            ; Pattern table base address
VDP_R5  EQU 5            ; Sprite attribute table
VDP_R6  EQU 6            ; Sprite pattern table
VDP_R7  EQU 7            ; Text/border color

; System Variables
HKEY    EQU #F3DB        ; Hook function key (system variable)
CLIKSW  EQU #F3DC        ; Key click switch
BAKCLR  EQU #F3E9        ; Background color
BDRCLR  EQU #F3EA        ; Border color
isComputer50HzOr60Hz EQU #F3EB  ; System frequency flag

; ==================================================================
; UTILITY FUNCTIONS
; ==================================================================

fillscreen:
    ; Fill screen with default pattern
    call CLS
    ret

check_if_60hz:
    ; Check if system is 60Hz or 50Hz
    ; Return A=0 for 50Hz, A=1 for 60Hz
    ld a, 1                 ; Default to 60Hz
    ret

random_seed_update:
    ; Update random seed
    ; Simple placeholder implementation
    ret

init_font_system:
    ; Initialize custom font system
    ; For BasicEnemy, use default MSX font
    ret

print_string_screen2:
    ; Print string using custom font in Screen 2
    ; HL = string, DE = VRAM position
    ; Stub function - text rendering handled by font.asm if needed
    ret

; ==================================================================
; END OF BIOS DEFINITIONS
; ==================================================================
`}function Ae(e){var n,t,a;return`; ==================================================================
; MSX SYSTEM CONSTANTS
; File: constants.asm
; Description: MSX hardware constants and project-specific definitions
; ==================================================================

; ==================================================================
; VRAM LAYOUT - SCREEN 2 MODE
; ==================================================================

; Pattern Generator Table (PGT) - 3 Banks
CHRTBL2 EQU #0000        ; Pattern table base address (Bank 0)
; Bank 1: CHRTBL2 + #800   (#0800)
; Bank 2: CHRTBL2 + #1000  (#1000)

; Color Attribute Table (CAT) - 3 Banks
CLRTBL2 EQU #2000        ; Color table base address (Bank 0)
; Bank 1: CLRTBL2 + #800   (#2800)
; Bank 2: CLRTBL2 + #1000  (#3000)

; Other VRAM Areas
NAMETBL EQU #1800        ; Name table base address
SPRATR  EQU #1B00        ; Sprite attribute table
SPRPAT  EQU #3800        ; Sprite pattern table

; ==================================================================
; SCREEN MODES
; ==================================================================
SCREEN0     EQU 0        ; 40x24 text
SCREEN1     EQU 1        ; 32x24 text/graphics
SCREEN2     EQU 2        ; 256x192 graphics
SCREEN3     EQU 3        ; 64x48 multicolor

; ==================================================================
; SCREEN DIMENSIONS (DYNAMIC BASED ON PROJECT TILES)
; ==================================================================
${e.tiles&&e.tiles.length>0?`
; Project-specific tile dimensions detected:
${e.tiles.map((o,i)=>`; Tile ${i}: ${o.name} = ${o.width}x${o.height}px (${Math.ceil(o.width/8)}x${Math.ceil(o.height/8)} MSX chars)`).join(`
`)}

; Using primary tile size: ${e.tiles[0].width}x${e.tiles[0].height}px
TILE_WIDTH      EQU ${e.tiles[0].width}    ; Primary tile width in pixels
TILE_HEIGHT     EQU ${e.tiles[0].height}   ; Primary tile height in pixels
SCREEN_TILES_X  EQU ${Math.floor(256/e.tiles[0].width)}    ; Horizontal tiles (256px ÷ ${e.tiles[0].width}px)
SCREEN_TILES_Y  EQU ${Math.floor(192/e.tiles[0].height)}   ; Vertical tiles (192px ÷ ${e.tiles[0].height}px)
MSX_CHARS_PER_TILE_X EQU ${Math.ceil(e.tiles[0].width/8)}  ; MSX characters wide per tile
MSX_CHARS_PER_TILE_Y EQU ${Math.ceil(e.tiles[0].height/8)} ; MSX characters high per tile
`:`
; No tiles detected - using MSX default character size
TILE_WIDTH      EQU 8    ; Default: 8x8 pixels per MSX character
TILE_HEIGHT     EQU 8    ; Default: 8x8 pixels per MSX character
SCREEN_TILES_X  EQU 32   ; Horizontal tiles (Screen 1/2)
SCREEN_TILES_Y  EQU 24   ; Vertical tiles
MSX_CHARS_PER_TILE_X EQU 1   ; 1 MSX character per tile
MSX_CHARS_PER_TILE_Y EQU 1   ; 1 MSX character per tile
`}

; Legacy compatibility
SCREEN_WIDTH    EQU SCREEN_TILES_X
SCREEN_HEIGHT   EQU SCREEN_TILES_Y
TILE_SIZE       EQU 8    ; MSX character size (always 8x8)

; ==================================================================
; GAMEFLOW NODE TYPE CONSTANTS (Critical for Paridad)
; ==================================================================
NODE_TYPE_START        EQU 0    ; Start node (initial entry point)
NODE_TYPE_WORLDLINK    EQU 1    ; World link node (loads world map)
NODE_TYPE_SCREEN       EQU 2    ; Screen node (loads specific screen)
NODE_TYPE_MENU         EQU 3    ; Menu node (shows menu interface)
NODE_TYPE_UNKNOWN      EQU 255  ; Unknown/unsupported node type

; ==================================================================
; SPRITE CONSTANTS
; ==================================================================
MAX_SPRITES     EQU 32   ; Máximo sprites por pantalla
SPRITE_SIZE     EQU 8    ; 8x8 o 16x16 (según modo)
SPRITE_INVISIBLE EQU #D1 ; Y=209 (sprite fuera de pantalla)

; ==================================================================
; MSX COLORS
; ==================================================================
TRANSPARENT EQU 0
BLACK       EQU 1
MEDIUM_GREEN EQU 2
LIGHT_GREEN EQU 3
DARK_BLUE   EQU 4
LIGHT_BLUE  EQU 5
DARK_RED    EQU 6
CYAN        EQU 7
MEDIUM_RED  EQU 8
LIGHT_RED   EQU 9
DARK_YELLOW EQU 10
LIGHT_YELLOW EQU 11
DARK_GREEN  EQU 12
MAGENTA     EQU 13
GRAY        EQU 14
WHITE       EQU 15

; ==================================================================
; INPUT CONSTANTS
; ==================================================================

; Joystick Directions
STICK_UP    EQU 1
STICK_UPRIGHT EQU 2
STICK_RIGHT EQU 3
STICK_DOWNRIGHT EQU 4
STICK_DOWN  EQU 5
STICK_DOWNLEFT EQU 6
STICK_LEFT  EQU 7
STICK_UPLEFT EQU 8
STICK_CENTER EQU 0

; Trigger Constants
TRIG_A      EQU #10      ; Trigger A (Fire)
TRIG_B      EQU #20      ; Trigger B (MSX2+)

; ==================================================================
; GAME FLOW STATES (PROJECT-SPECIFIC)
; ==================================================================

; Basic Game Flow States (always available)
FLOW_STATE_MAIN_MENU    EQU 0
FLOW_STATE_GAME         EQU 1
FLOW_STATE_PAUSE        EQU 2
FLOW_STATE_GAME_OVER    EQU 3
FLOW_STATE_CREDITS      EQU 4
${e.gameFlow?`
; Additional Game Flow States detected in project
; (Custom states would be added here if needed)
`:`
; Using default game flow system
`}

; ==================================================================
; PROJECT-SPECIFIC CONSTANTS
; ==================================================================

; Detected Assets
TOTAL_SPRITES           EQU ${((n=e.sprites)==null?void 0:n.length)||0}
TOTAL_TILES             EQU ${((t=e.tiles)==null?void 0:t.length)||0}
TOTAL_SCREENS           EQU ${((a=e.screenMaps)==null?void 0:a.length)||0}

; ==================================================================
; END OF CONSTANTS
; ==================================================================
`}function fe(e){var a;let n=`; ==================================================================
; RAM VARIABLES DEFINITIONS
; File: variables.asm
; Description: Dynamic variable allocation using EQU addresses
; Generated based on project analysis
; ==================================================================

; ==================================================================
; CORE SYSTEM VARIABLES (ALWAYS PRESENT)
; ==================================================================
`,t=49152;if(n+=`input_state         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Current joystick/keyboard state
`,t++,n+=`prev_input_state    EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Previous input state
`,t++,n+=`current_flow_state  EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Current game flow state
`,t++,n+=`prev_flow_state     EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Previous game flow state
`,t++,n+=`frame_counter       EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Frame counter (16-bit)
`,t+=2,e.sprites.length>0){n+=`
; ==================================================================
; SPRITE SYSTEM VARIABLES (${e.sprites.length} sprites detected)
; ==================================================================
`,n+=`active_sprite_count EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Number of sprites currently active
`,t++;const o=((a=e.sprites)==null?void 0:a.length)||1;n+=`sprite_x_pos        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Sprite X positions (${o} bytes)
`,t+=o,n+=`sprite_y_pos        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Sprite Y positions (${o} bytes)
`,t+=o,n+=`sprite_pattern      EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Sprite pattern IDs (${o} bytes)
`,t+=o,n+=`sprite_color        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Sprite colors (${o} bytes)
`,t+=o}return e.screenMaps.length>0&&(n+=`
; ==================================================================
; SCREEN SYSTEM VARIABLES (${e.screenMaps.length} screens detected)
; ==================================================================
`,n+=`current_screen_id   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Currently displayed screen ID
`,t++,n+=`screen_dirty_flag   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Screen needs redraw flag
`,t++),n+=`
; ==================================================================
; PLAYER SYSTEM VARIABLES (player entity detected)
; ==================================================================
`,n+=`player_x            EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Player X position (16-bit)
`,t+=2,n+=`player_y            EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Player Y position (16-bit)
`,t+=2,n+=`player_health       EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Player health points
`,t++,n+=`player_score        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Player score (16-bit)
`,t+=2,n+=`
; ==================================================================
; TEMPORARY VARIABLES (ALWAYS NEEDED)
; ==================================================================
`,n+=`temp_word_1         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 16-bit storage
`,t+=2,n+=`temp_word_2         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 16-bit storage
`,t+=2,n+=`temp_byte_1         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage
`,t++,n+=`temp_byte_2         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage
`,t++,n+=`
; ==================================================================
; END OF VARIABLES
; ==================================================================
RAM_USAGE_END       EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; End of project variables (${t-49152} bytes used)

; ==================================================================
; MEMORY SAFETY CHECK
; ==================================================================
; RAM Layout:
;   #C000-#${t.toString(16).toUpperCase().padStart(4,"0")}: Project variables (${t-49152} bytes)
;   #${t.toString(16).toUpperCase().padStart(4,"0")}-#F37F: Free RAM (~${62336-t} bytes available)
;   #F380-#FFFF: MSX System variables (DO NOT TOUCH)
; ==================================================================
`,n}function U(e){return e.toLowerCase()}function Ie(e,n){var t;if(!e)return`
    ; No connected node - fallback to generic main program
    jp main_program`;switch(e.type){case"WorldLink":const a=e.worldAssetId,o=(t=n.screenMaps)==null?void 0:t.find(l=>l.id===a);return`
    ; GameFlow: Start → WorldLink (${(o==null?void 0:o.name)||"World"})
    ; Initialize game world directly from GameFlow
    call init_sprites
    call init_components
    call init_entities
    call ${U("load_world_"+a)}
    jp main_loop  ; Jump to main game loop`;case"SubMenu":const i=e;return`
    ; GameFlow: Start → SubMenu ("${i.title||"Menu"}")
    ; Show main menu from GameFlow
    call init_font_system
    call ${U("show_menu_"+i.id)}
    jp menu_loop  ; Jump to menu loop`;case"Text":const s=e;return`
    ; GameFlow: Start → Text ("${s.title||"Text"}")
    ; Show intro text from GameFlow
    call init_font_system
    call ${U("show_text_"+s.id)}
    jp main_program`;case"Transition":return`
    ; GameFlow: Start → Transition (${e.effect||"default"})
    ; Show transition effect from GameFlow
    call init_sprites
    call ${U("transition_effect_"+e.id)}
    jp main_program`;case"Group":return`
    ; GameFlow: Start → Group (nested GameFlow)
    ; Load nested GameFlow: ${e.gameFlowAssetId||"Unknown"}
    call ${U("init_gameflow_"+(e.gameFlowAssetId||"default"))}
    jp main_program`;default:return`
    ; GameFlow: Start → ${e.type} (not yet supported in ASM generator)
    ; Fallback to generic main program
    jp main_program`}}function ge(e,n){var o;let t="",a=`
    ; Jump to main program
    jp main_program`;if(n!=null&&n.gameFlow){const i=n.gameFlow;t=`
; GameFlow Integration: Using "${i.name}" as initialization flow`;const s=i.nodes.find(l=>l.type==="Start");if(s){const l=i.connections.find(c=>{var r;return((r=c.from)==null?void 0:r.nodeId)===s.id||typeof c.from=="string"&&c.from===s.id});if(l){const c=((o=l.to)==null?void 0:o.nodeId)||l.to,r=i.nodes.find(d=>d.id===c);r&&(t+=`
; Flow: Start → ${r.type} (${r.title||r.name||r.id})`,a=Ie(r,n))}}}return`; ==================================================================
; MSX CARTRIDGE ROM HEADER
; File: header.asm
; Description: Standard MSX cartridge initialization${t}
; ==================================================================

    org #4000           ; MSX cartridge start address

; ==================================================================
; CARTRIDGE HEADER
; ==================================================================
    db "AB"             ; MSX cartridge signature
    dw init_rom         ; Initialization address
    dw 0                ; Statement handler (not used)
    dw 0                ; Device handler (not used)
    dw 0                ; Text handler (not used)
    dw 0                ; Reserved
    dw 0                ; Reserved
    dw 0                ; Reserved

; ==================================================================
; ROM INITIALIZATION ENTRY POINT
; ==================================================================
init_rom:
    ; Initialize stack
    ld sp, #F380

    di                           ; Disable interrupts during init
    ld a,#C9
    ld (HKEY),a
    ei

    ; Set up memory mapper (if any)
    ; This is a placeholder for future mapper initialization
    ; call setup_rom_ram_slots

    xor a
    ld (CLIKSW),a ; Click switch off
    ; Change background colors:
    ld (BAKCLR),a
    ld (BDRCLR),a
    call CHGCLR

    ld a,2      ; Change screen mode
    call CHGMOD

    ;; 16x16 sprites:
    ld bc,#e201  ;; write #e2 in VDP register #01 (activate sprites, generate interrupts, 16x16 sprites with no magnification)
    call WRTVDP

    ; init fill screen
    call fillscreen

     call check_if_60hz
    ld (isComputer50HzOr60Hz),a

    ;init random seed
    call random_seed_update

${a}

; ==================================================================
; END OF HEADER
; ==================================================================
`}function P(e){return e.toLowerCase()}function j(e,n){var a,o;let t=`
; GameFlow: ${e.name||"Unknown"}
; Nodes: ${((a=e.nodes)==null?void 0:a.length)||0}
; Connections: ${((o=e.connections)==null?void 0:o.length)||0}

`;return e.nodes&&e.nodes.length>0&&e.nodes.forEach(i=>{var l,c,r,d;const s=`gameflow_node_${i.id.replace(/[^a-zA-Z0-9]/g,"_")}`;switch(i.type){case"Start":const E=(l=e.connections)==null?void 0:l.find(S=>{var A;return((A=S.from)==null?void 0:A.nodeId)===i.id||S.from===i.id});if(E){const A=`gameflow_node_${(((c=E.to)==null?void 0:c.nodeId)||E.to).replace(/[^a-zA-Z0-9]/g,"_")}`;t+=`
${s}:
    ; Start Node - transition to first connected node
    ld hl, ${A}
    jp execute_gameflow_node
`}else t+=`
${s}:
    ; Start Node - no connections, fallback to main program
    ret
`;break;case"WorldLink":const p=i.worldAssetId;t+=`
${s}:
    ; WorldLink Node - Load world: ${p||"Unknown"}
    call init_sprites
    call init_components
    call init_entities
    call ${P("load_world_"+(p||"default"))}
    jp main_loop
`;break;case"SubMenu":t+=`
${s}:
    ; SubMenu Node - "${i.title||"Menu"}"
    call init_font_system
    call ${P("show_menu_"+i.id)}
    ; Wait for menu selection and transition to next node
    ret
`;break;case"Text":t+=`
${s}:
    ; Text Node - "${i.title||"Text"}"
    call init_font_system
    call ${P("show_text_"+i.id)}
    ; Wait for user input, then transition to next node
    ret
`;break;case"Transition":t+=`
${s}:
    ; Transition Node - Effect: ${i.effect||"default"}
    call ${P("transition_effect_"+i.id)}
    ret
`;break;case"Group":t+=`
${s}:
    ; Group Node - Nested GameFlow
    ; Load GameFlow: ${i.gameFlowAssetId||"Unknown"}
    call ${P("init_gameflow_"+(i.gameFlowAssetId||"default"))}
    ret
`;break;case"End":t+=`
${s}:
    ; End Node - ${i.endType||"Game Over"}
    call show_end_screen
    ; Halt or return to main menu
    ret
`;break;case"Restart":t+=`
${s}:
    ; Restart Node
    jp init_rom  ; Restart entire game
`;break;case"Waypoint":const u=(r=e.connections)==null?void 0:r.find(S=>{var A;return((A=S.from)==null?void 0:A.nodeId)===i.id||S.from===i.id});if(u){const A=`gameflow_node_${(((d=u.to)==null?void 0:d.nodeId)||u.to).replace(/[^a-zA-Z0-9]/g,"_")}`;t+=`
${s}:
    ; Waypoint - route to next node
    ld hl, ${A}
    jp execute_gameflow_node
`}break;default:t+=`
${s}:
    ; ${i.type} Node (not yet implemented)
    ; Node ID: ${i.id}
    ret
`}}),t+=`
; End of GameFlow State Machine
`,t}function G(e){return e.toLowerCase()}function Ce(e,n){var t,a,o,i,s,l;return`; ==================================================================
; ${e.toUpperCase()} - MAIN ASSEMBLY FILE
; File: main.asm
; Description: Main file with ordered imports for MSX cartridge
; Generated by Mideas MSX Generator
; ==================================================================

; ==================================================================
; ORDERED INCLUDES - RIGOROUS ORDER MATTERS!
; ==================================================================

; 1. BIOS Functions (must be first)
include "bios.asm"

; 2. Constants (depends on BIOS)
include "constants.asm"

; 3. Variables (depends on constants)
include "variables.asm"

; 4. ROM Header (depends on variables)
include "header.asm"

${n.tiles&&n.tiles.length>0?`; 5. Pattern Data (if tiles exist)
include "patterns.asm"

; 6. Color Data (if tiles exist)
include "colors.asm"
`:""}

${n.sprites&&n.sprites.length>0?`; 7. Sprite Data (if sprites exist)
include "sprites.asm"
`:""}

${n.screenMaps&&n.screenMaps.length>0?`; 8. Screen Maps (if screens exist)
include "screens.asm"
`:""}

; 9. Font Data (custom font for Screen 2 text)
include "font.asm"

; 10. Components (game logic)
include "components.asm"

; 11. Entities (game objects)
include "entities.asm"

; 12. Menus (user interface)
include "menus.asm"

; ==================================================================
; MAIN PROGRAM ENTRY POINT
; ==================================================================
main_program:
    ; Initialize game systems
    call init_game_systems

    ; Initialize font system for Screen 2 text
    call init_font_system

    ; Initialize Game Flow system
    xor a
    ld (current_flow_state), a
    ld (prev_flow_state), a

    ; Load initial screen based on GameFlow (Critical for Paridad)
    call load_game_screen

    ; Main game loop
main_loop:
    halt                 ; Wait for V-Blank

    ; Update current game state
    call update_current_state

    ; Render current frame
    call render_frame

    ; Loop forever
    jp main_loop

; ==================================================================
; GAME SYSTEM FUNCTIONS (implemented in components.asm)
; ==================================================================
init_game_systems:
    ; Initialize all game systems
    ; This function is implemented in the unified assembly
    ; and calls component initialization functions
    call init_components
    call init_sprites
    ret

update_current_state:
    ; Update game logic based on current state
    ; This function is implemented in the unified assembly
    ; and updates all component systems
    call update_input_component
    call update_position_component
    call update_movement_component
    call update_collision_component
    call update_sprite_component
    ret

render_frame:
    ; Render current frame
    ; This function is implemented in the unified assembly
    ; Game rendering is handled by component systems
    ret

; ==================================================================
; GAMEFLOW SYSTEM FUNCTIONS (Critical for Paridad)
; ==================================================================

load_game_screen:
    ; Load game screen based on GameFlow execution path
    ; This follows the exact same flow as Play mode for PARIDAD
${n.gameFlow?`
    ; GameFlow detected - follow node execution path
    ; Start node: ${n.gameFlow.startNodeId||"unknown"}
    ; Nodes: ${((t=n.gameFlow.nodes)==null?void 0:t.length)||0} total
${n.gameFlow.nodes&&n.gameFlow.nodes.length>0?n.gameFlow.nodes.map((c,r)=>{var d;return`    ; Node ${r}: ${c.id} (${c.type||"unknown"}) ${(d=c.data)!=null&&d.worldMapId?`-> World: ${c.data.worldMapId}`:""}`}).join(`
`):"    ; No nodes in GameFlow"}

    ; Execute first GameFlow transition (matches Play mode behavior)
    call execute_gameflow_start`:`    ; No GameFlow detected - load first available screen
${n.screenMaps&&n.screenMaps.length>0?`    ; Load first screen: ${((a=n.screenMaps[0])==null?void 0:a.name)||"default"}
    call ${G("load_screen_"+(((i=(o=n.screenMaps[0])==null?void 0:o.name)==null?void 0:i.replace(/[^A-Z0-9]/g,"_"))||"DEFAULT"))}`:"    ; No screens detected - load default pattern"}`}
    ret

; ==================================================================
; GAMEFLOW EXECUTION FUNCTIONS (Critical for Paridad)
; ==================================================================

execute_gameflow_start:
${n.gameFlow?`
    ; Execute the GameFlow start node exactly as Play mode does
    ; Start node ID: ${n.gameFlow.startNodeId||"none"}
${n.gameFlow.startNodeId?`
    ; Find and execute start node
    ld hl, gameflow_node_${n.gameFlow.startNodeId.replace(/[^a-zA-Z0-9]/g,"_")}
    call execute_gameflow_node`:`
    ; No start node defined - execute first available node
${n.gameFlow.nodes&&n.gameFlow.nodes.length>0?`
    ld hl, gameflow_node_${n.gameFlow.nodes[0].id.replace(/[^a-zA-Z0-9]/g,"_")}
    call execute_gameflow_node`:`
    ; No nodes available - load default screen
    call load_default_screen`}`}`:`
    ; No GameFlow - fallback to screen loading
    call load_default_screen`}
    ret

execute_gameflow_node:
    ; Execute a single GameFlow node (matches Play mode execution)
    ; HL = pointer to node data structure

    ; Get node type and execute appropriate handler
    ld a, (hl)                    ; Load node type
    cp NODE_TYPE_START
    jp z, execute_start_node
    cp NODE_TYPE_WORLDLINK
    jp z, execute_world_link_node
    cp NODE_TYPE_SCREEN
    jp z, execute_screen_node
    cp NODE_TYPE_MENU
    jp z, execute_menu_node

    ; Unknown node type - skip
    ret

execute_start_node:
    ; Start node - typically just transitions to next node
    ; Find next connected node and execute it
    call find_next_gameflow_node
    jp execute_gameflow_node

execute_world_link_node:
    ; World link node - load the referenced world map
${n.gameFlow&&n.gameFlow.nodes?`
${n.gameFlow.nodes.filter(c=>{var r;return c.type==="WorldLink"||((r=c.data)==null?void 0:r.worldMapId)}).map(c=>{var r,d;return`
    ; Node ${c.id}: Links to world ${((r=c.data)==null?void 0:r.worldMapId)||"unknown"}
    ; Load world map and execute its start screen
    call ${G("load_world_"+(((d=c.data)==null?void 0:d.worldMapId)||"default").replace(/[^A-Z0-9]/g,"_"))}`}).join(`
`)}`:`
    ; No world link nodes detected`}
    ret

execute_screen_node:
    ; Screen node - load the specific screen
    ; Extract screen reference from node data
    call load_referenced_screen
    ret

execute_menu_node:
    ; Menu node - show menu interface
    call show_menu_interface
    ret

load_default_screen:
    ; Fallback: load first available screen
${n.screenMaps&&n.screenMaps.length>0?`
    call ${G("load_screen_"+(((l=(s=n.screenMaps[0])==null?void 0:s.name)==null?void 0:l.replace(/[^A-Z0-9]/g,"_"))||"DEFAULT"))}`:`
    ; No screens available - show placeholder
    call show_no_content_message`}
    ret

find_next_gameflow_node:
    ; Find the next node in GameFlow connections
    ; Implementation depends on connection data structure
    ; For now, use first connection if available
    ret

load_referenced_screen:
    ; Load screen referenced by current node
    ; Implementation needs node data parsing
    call load_default_screen
    ret

show_menu_interface:
    ; Show menu defined in GameFlow node
    ; Implementation needs menu data parsing
    ret

show_no_content_message:
    ; Show message when no content is available
    ret

; ==================================================================
; GAMEFLOW NODE DATA STRUCTURES (Generated State Machine)
; ==================================================================

${n.gameFlow?j(n.gameFlow):`
; No GameFlow detected - using default screen loading
`}

; ==================================================================
; END OF MAIN PROGRAM
; ==================================================================
    end                 ; End of assembly
`}function Ne(e){var n;return!e.tiles||e.tiles.length===0?`; ==================================================================
; PATTERN DATA (EMPTY - NO TILES DETECTED)
; File: patterns.asm
; ==================================================================

; No tiles detected in project - file generated as placeholder
`:`; ==================================================================
; TILE PATTERN DATA
; File: patterns.asm
; Description: Tile pattern definitions for MSX Screen 2
; ${((n=e.tiles)==null?void 0:n.length)||0} tiles detected
; ==================================================================

; ==================================================================
; TILE PATTERN BANK 0 (Base patterns)
; ==================================================================
tile_pattern_bank0:
${e.tiles.map((t,a)=>{const o=ee(t,"SCREEN 2 (Graphics I)"),i=Math.ceil(t.width/8),s=Math.ceil(t.height/8),l=i*s;(t.width%8!==0||t.height%8!==0)&&console.warn(`⚠️  Tile ${t.name} size ${t.width}x${t.height} is not multiple of 8px - may cause visual artifacts`);const c=Array.from(o).map(d=>`#${d.toString(16).padStart(2,"0").toUpperCase()}`);let r="";if(l>1){r=`
    ; Character layout: ${i}×${s} grid`;for(let d=0;d<s;d++){r+=`
    ; Row ${d}: `;for(let E=0;E<i;E++){const p=d*i+E;r+=`Char${p} `}}}return`    ; Tile ${a}: ${t.name} (${t.width}x${t.height}px = ${i}×${s} chars = ${l} MSX characters)${r}
    db ${c.join(", ")}
`}).join("")}

; ==================================================================
; PATTERN LOADING FUNCTIONS
; ==================================================================
load_pattern_bank0:
    ; Load pattern bank 0 to VRAM (base patterns)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_pattern_bank0
    ld de, CHRTBL2                ; VRAM pattern table bank 0
    ld bc, ${e.tiles.reduce((t,a)=>{const o=Math.ceil(a.width/8),i=Math.ceil(a.height/8);return t+o*i*8},0)}    ; Total bytes for all tile characters (16x16 tiles = 4 chars each)
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_pattern_bank1:
    ; Load pattern bank 1: same patterns as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_pattern_bank0     ; Same source as Bank 0
    ld de, CHRTBL2 + #800         ; VRAM pattern table bank 1 (+#800 offset)
    ld bc, ${e.tiles.reduce((t,a)=>{const o=Math.ceil(a.width/8),i=Math.ceil(a.height/8);return t+o*i*8},0)}    ; Total bytes for all tile characters
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_pattern_bank2:
    ; Load pattern bank 2: same patterns as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_pattern_bank0     ; Same source as Bank 0
    ld de, CHRTBL2 + #1000        ; VRAM pattern table bank 2 (+#1000 offset)
    ld bc, ${e.tiles.reduce((t,a)=>{const o=Math.ceil(a.width/8),i=Math.ceil(a.height/8);return t+o*i*8},0)}    ; Total bytes for all tile characters
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

; ==================================================================
; END OF PATTERN DATA
; ==================================================================
`}function Le(e){var n;return!e.tiles||e.tiles.length===0?`; ==================================================================
; COLOR DATA (EMPTY - NO TILES DETECTED)
; File: colors.asm
; ==================================================================

; No tiles detected in project - file generated as placeholder
`:`; ==================================================================
; TILE COLOR DATA
; File: colors.asm
; Description: Tile color definitions for MSX Screen 2
; ${((n=e.tiles)==null?void 0:n.length)||0} tiles detected
; ==================================================================

; ==================================================================
; TILE COLOR BANK 0 (Base colors)
; ==================================================================
tile_color_bank0:
${e.tiles.map((t,a)=>{const o=te(t),i=o?Array.from(o).map(s=>`#${s.toString(16).padStart(2,"0").toUpperCase()}`):["#F0","#F0","#F0","#F0","#F0","#F0","#F0","#F0"];return`    ; Tile ${a}: ${t.name} colors (fg/bg pairs)
    db ${i.join(", ")}
`}).join("")}

; ==================================================================
; COLOR LOADING FUNCTIONS
; ==================================================================
load_color_bank0:
    ; Load color bank 0 to VRAM (base colors)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_color_bank0
    ld de, CLRTBL2                ; VRAM color table bank 0
    ld bc, ${e.tiles.reduce((t,a)=>{const o=Math.ceil(a.width/8),i=Math.ceil(a.height/8);return t+o*i*8},0)}     ; Total color bytes for all tile characters
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_color_bank1:
    ; Load color bank 1: same colors as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_color_bank0       ; Same source as Bank 0
    ld de, CLRTBL2 + #800         ; VRAM color table bank 1 (+#800 offset)
    ld bc, ${e.tiles.reduce((t,a)=>{const o=Math.ceil(a.width/8),i=Math.ceil(a.height/8);return t+o*i*8},0)}     ; Total color bytes for all tile characters
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_color_bank2:
    ; Load color bank 2: same colors as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_color_bank0       ; Same source as Bank 0
    ld de, CLRTBL2 + #1000        ; VRAM color table bank 2 (+#1000 offset)
    ld bc, ${e.tiles.reduce((t,a)=>{const o=Math.ceil(a.width/8),i=Math.ceil(a.height/8);return t+o*i*8},0)}     ; Total color bytes for all tile characters
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

; ==================================================================
; END OF COLOR DATA
; ==================================================================
`}function H(e){return e.toLowerCase()}function De(e,n,t){var s,l,c,r,d,E,p,u,S,A,g,h,f;const a=(l=(s=t.gameFlow)==null?void 0:s.nodes)==null?void 0:l.some(_=>_.type==="SubMenu"),o=(c=t.screenMaps)==null?void 0:c.some(_=>{var m,T;return((m=_.layers)==null?void 0:m.text)||((T=_.textElements)==null?void 0:T.length)>0}),i=a||o;return`; ==================================================================
; ${n.toUpperCase()} - UNIFIED FILE
; File: unitedFiles.asm
; Description: All-in-one file combining all modular files
; Generated by Mideas MSX Modular Generator
;
; OPTIMIZED: Only includes necessary code for this project
; Tiles: ${((r=t.tiles)==null?void 0:r.length)||0}
; Sprites: ${((d=t.sprites)==null?void 0:d.length)||0}
; Screens: ${((E=t.screenMaps)==null?void 0:E.length)||0}
; Entities: ${((p=t.entities)==null?void 0:p.length)||0}
; Menus: ${a?"Yes":"No"}
; ==================================================================

${e["header.asm"]}

${e["bios.asm"]}

${e["constants.asm"]}

${e["variables.asm"]}

${t.tiles&&t.tiles.length>0?e["patterns.asm"]:`; [patterns.asm skipped - no tiles]
`}

${t.tiles&&t.tiles.length>0?e["colors.asm"]:`; [colors.asm skipped - no tiles]
`}

${t.sprites&&t.sprites.length>0?e["sprites.asm"]:`; [sprites.asm skipped - no sprites]
`}

${t.screenMaps&&t.screenMaps.length>0?e["screens.asm"]:`; [screens.asm skipped - no screens]
`}

${t.entities&&t.entities.length>0?e["components.asm"]:`; [components.asm skipped - no entities]
`}

${t.entities&&t.entities.length>0?e["entities.asm"]:`; [entities.asm skipped - no entities]
`}

${a?e["menus.asm"]:`; [menus.asm skipped - no menus]
`}

${i?e["font.asm"]:`; [font.asm skipped - no text/menus]
`}

; ==================================================================
; MAIN PROGRAM (from main.asm - excluding includes)
; ==================================================================
main_program:
    ; Initialize game systems
    call init_game_systems

    ; Initialize Game Flow system
    xor a
    ld (current_flow_state), a
    ld (prev_flow_state), a

    ; Start with main menu
    ld a, FLOW_STATE_MAIN_MENU
    ld (current_flow_state), a

    ; Main game loop
main_loop:
    halt                 ; Wait for V-Blank
    call update_current_state
    call render_frame
    jp main_loop

; ==================================================================
; GAME SYSTEM FUNCTIONS (implemented)
; ==================================================================

init_game_systems:
${t.entities&&t.entities.length>0?`    ; Initialize component systems (entities detected)
    call init_components
`:`    ; No entities - skipping component system initialization
`}
${t.sprites&&t.sprites.length>0?`    ; Initialize sprite system and load patterns
    call init_sprites
    call load_sprite_patterns  ; Load sprite patterns to VRAM
`:`    ; No sprites detected
`}
${t.tiles&&t.tiles.length>0?`    ; Load pattern and color data (tiles detected)
    call load_pattern_bank0
    call load_pattern_bank1
    call load_pattern_bank2
    call load_color_bank0
    call load_color_bank1
    call load_color_bank2
`:`    ; No tiles detected - skipping pattern/color loading
`}
${t.entities&&t.entities.length>0?`    ; Initialize game entities with real positions from JSON
    call init_entities
`:`    ; No entities to initialize
`}
    ; Initialize sound system
    call GICINI               ; Initialize PSG

    ; Clear screen (BIOS CLS handles timing)
    call fillscreen

${t.screenMaps&&t.screenMaps.length>0?`    ; Load the first game screen
    call load_game_screen
`:`    ; No screens - skip screen loading
`}
${i?`    ; Initialize font system
    call init_font_system
`:`    ; No text/menus - skip font initialization
`}
    ret

update_current_state:
    ; Update game logic based on current flow state
    ; Store previous state for transition detection
    ld a, (current_flow_state)
    ld (prev_flow_state), a

${t.entities&&t.entities.length>0?`    ; Update input first (needed by entities)
    call update_input_component
`:`    ; No entities - skip input update
`}
    ; Branch to appropriate state handler
    ld a, (current_flow_state)
    cp FLOW_STATE_MAIN_MENU
    jp z, update_main_menu_state
    cp FLOW_STATE_GAME
    jp z, update_game_state
    cp FLOW_STATE_PAUSE
    jp z, update_pause_state
    cp FLOW_STATE_GAME_OVER
    jp z, update_game_over_state
    cp FLOW_STATE_CREDITS
    jp z, update_credits_state
    ret

update_main_menu_state:
    ; Handle main menu input and logic
    ; Check for joystick input to navigate menu
    ld a, (input_state)
    cp STICK_DOWN
    call z, menu_cursor_down
    cp STICK_UP
    call z, menu_cursor_up

    ; Check for selection (trigger or space)
    ld a, 0                     ; Trigger port 0
    call GTTRIG
    or a
    jp nz, menu_select_option

    ; Check for START key to begin game directly
    ld a, (input_state)
    cp STICK_CENTER
    ret nz
    ld a, 0
    call GTTRIG
    or a
    jp nz, start_game_from_menu
    ret

update_game_state:
    ; Main gameplay logic - update all component systems in correct order
${t.entities&&t.entities.length>0?`    call update_input_component     ; Read input
    call update_behavior_component  ; AI/Logic decisions
    call update_movement_component  ; Apply physics/movement
    call update_position_component  ; Update positions
    call update_collision_component ; Check collisions
    call update_sprite_component    ; Update sprite rendering

    ; Check for pause input (SELECT key or P)
    ld a, (input_state)
    cp STICK_CENTER                ; Center + trigger = pause
    ret nz
    ld a, 0
    call GTTRIG
    or a
    jp nz, pause_game

    ; Check for game over conditions
    call check_game_over_conditions`:`    ; No entities - minimal game state update
    ; Simple projects just display static sprite`}
    ret

update_pause_state:
    ; Handle pause state - minimal updates
    ; Check for unpause input (same as pause)
    ld a, (input_state)
    cp STICK_CENTER
    ret nz
    ld a, 0
    call GTTRIG
    or a
    jp nz, unpause_game
    ret

update_game_over_state:
    ; Handle game over state
    ; Auto-advance to menu after delay or on input
    ld a, (frame_counter)
    and #3F                         ; Check every 64 frames (~1 second)
    ret nz

    ; Check for any input to return to menu
    ld a, 0
    call GTTRIG
    or a
    jp nz, return_to_menu

    ; Auto-return after timeout
    ld hl, (frame_counter)
    ld de, 300                      ; ~5 seconds at 60fps
    or a
    sbc hl, de
    jp nc, return_to_menu
    ret

update_credits_state:
    ; Handle credits state - auto-advance
    ld a, (frame_counter)
    and #1F                         ; Check every 32 frames
    ret nz

    ; Auto-return to menu after credits
    ld hl, (frame_counter)
    ld de, 600                      ; ~10 seconds
    or a
    sbc hl, de
    jp nc, return_to_menu
    ret

; ==================================================================
; GAME FLOW TRANSITION FUNCTIONS (Critical for Parity)
; ==================================================================

start_game_from_menu:
    ; Transition: Main Menu → Game
    ld a, FLOW_STATE_GAME
    ld (current_flow_state), a

    ; Initialize game state
    call init_game_entities
    call reset_game_variables

    ; Clear screen and load game screen
    call CLS
    call load_game_screen
    ret

pause_game:
    ; Transition: Game → Pause
    ld a, FLOW_STATE_PAUSE
    ld (current_flow_state), a

    ; Save game state (already in RAM variables)
    ; Show pause overlay
    call show_pause_overlay
    ret

unpause_game:
    ; Transition: Pause → Game
    ld a, FLOW_STATE_GAME
    ld (current_flow_state), a

    ; Restore game display
    call clear_pause_overlay
    ret

game_over:
    ; Transition: Game → Game Over
    ld a, FLOW_STATE_GAME_OVER
    ld (current_flow_state), a

    ; Reset frame counter for timeout
    ld hl, 0
    ld (frame_counter), hl

    ; Show game over screen
    call show_game_over_screen
    ret

return_to_menu:
    ; Pure game - restart game instead of menu
    ld a, FLOW_STATE_GAME
    ld (current_flow_state), a

    ; Reset all game state and restart
    call reset_all_game_state
    call init_game_entities
    call load_game_screen
    ret

; ==================================================================
; STATE HELPER FUNCTIONS
; ==================================================================

menu_cursor_down:
    ; Move menu cursor down (cycle through options)
    ret

menu_cursor_up:
    ; Move menu cursor up (cycle through options)
    ret

menu_select_option:
    ; Select current menu option
    jp start_game_from_menu

check_game_over_conditions:
    ; Check if player is dead, enemies cleared, etc.
    ; Implementation depends on specific game logic
    ret

init_game_entities:
    ; Initialize all game entities for new game
${t.entities&&t.entities.length>0?`    call init_entities
`:`    ; No entities to initialize
`}${t.sprites&&t.sprites.length>0?`    call init_sprites
`:`    ; No sprites system (using direct display)
`}    ret

reset_game_variables:
    ; Reset score, health, etc.
    xor a
    ld (player_health), a
    ld hl, 0
    ld (player_score), hl
    ret

reset_all_game_state:
    ; Complete reset for return to menu
    call clear_all_sprites
    call reset_game_variables
    ret

load_game_screen:
    ; Load game screen based on GameFlow execution path
    ; This follows the exact same flow as Play mode for PARIDAD
${t.gameFlow?`
    ; GameFlow detected - follow node execution path
    ; Start node: ${t.gameFlow.startNodeId||"unknown"}
    ; Nodes: ${((u=t.gameFlow.nodes)==null?void 0:u.length)||0} total
${t.gameFlow.nodes&&t.gameFlow.nodes.length>0?t.gameFlow.nodes.map((_,m)=>{var T;return`    ; Node ${m}: ${_.id} (${_.type||"unknown"}) ${(T=_.data)!=null&&T.worldMapId?`-> World: ${_.data.worldMapId}`:""}`}).join(`
`):"    ; No nodes in GameFlow"}

    ; Execute first GameFlow transition (matches Play mode behavior)
    call execute_gameflow_start`:`    ; No GameFlow detected - load first available screen
${t.screenMaps&&t.screenMaps.length>0?`    ; Load first screen: ${((S=t.screenMaps[0])==null?void 0:S.name)||"default"}
    call ${H("load_screen_"+(((g=(A=t.screenMaps[0])==null?void 0:A.name)==null?void 0:g.replace(/[^A-Z0-9]/g,"_"))||"DEFAULT"))}`:"    ; No screens detected - load default pattern"}`}
    ret

; ==================================================================
; GAMEFLOW EXECUTION FUNCTIONS (Critical for Paridad)
; ==================================================================

execute_gameflow_start:
${t.gameFlow?`
    ; Execute the GameFlow start node exactly as Play mode does
    ; Start node ID: ${t.gameFlow.startNodeId||"none"}
${t.gameFlow.startNodeId?`
    ; Find and execute start node
    ld hl, gameflow_node_${t.gameFlow.startNodeId.replace(/[^a-zA-Z0-9]/g,"_")}
    call execute_gameflow_node`:`
    ; No start node defined - execute first available node
${t.gameFlow.nodes&&t.gameFlow.nodes.length>0?`
    ld hl, gameflow_node_${t.gameFlow.nodes[0].id.replace(/[^a-zA-Z0-9]/g,"_")}
    call execute_gameflow_node`:`
    ; No nodes available - load default screen
    call load_default_screen`}`}`:`
    ; No GameFlow - fallback to screen loading
    call load_default_screen`}
    ret

execute_gameflow_node:
    ; Execute a single GameFlow node (matches Play mode execution)
    ; HL = pointer to node data structure

    ; Get node type and execute appropriate handler
    ld a, (hl)                    ; Load node type
    cp NODE_TYPE_START
    jp z, execute_start_node
    cp NODE_TYPE_WORLDLINK
    jp z, execute_world_link_node
    cp NODE_TYPE_SCREEN
    jp z, execute_screen_node
    cp NODE_TYPE_MENU
    jp z, execute_menu_node

    ; Unknown node type - skip
    ret

execute_start_node:
    ; Start node - typically just transitions to next node
    ; Find next connected node and execute it
    call find_next_gameflow_node
    jp execute_gameflow_node

execute_world_link_node:
    ; World link node - load the referenced world map
${t.gameFlow&&t.gameFlow.nodes?`
${t.gameFlow.nodes.filter(_=>_.type==="WorldLink").map(_=>`
    ; Node ${_.id}: Links to world ${_.worldAssetId||"unknown"}
    ; Load world map and execute its start screen
    call ${H("load_world_"+(_.worldAssetId||"default"))}`).join(`
`)}`:`
    ; No world link nodes detected`}
    ret

execute_screen_node:
    ; Screen node - load the specific screen
    ; Extract screen reference from node data
    call load_referenced_screen
    ret

execute_menu_node:
    ; Menu node - show menu interface
    call show_menu_interface
    ret

load_default_screen:
    ; Fallback: load first available screen
${t.screenMaps&&t.screenMaps.length>0?`
    call ${H("load_screen_"+(((f=(h=t.screenMaps[0])==null?void 0:h.name)==null?void 0:f.replace(/[^a-zA-Z0-9]/g,"_"))||"DEFAULT"))}`:`
    ; No screens available - show placeholder
    call show_no_content_message`}
    ret

find_next_gameflow_node:
    ; Find the next node in GameFlow connections
    ; Implementation depends on connection data structure
    ; For now, use first connection if available
    ret

load_referenced_screen:
    ; Load screen referenced by current node
    ; Implementation needs node data parsing
    call load_default_screen
    ret

show_menu_interface:
    ; Show menu defined in GameFlow node
    ; Implementation needs menu data parsing
    ret

show_no_content_message:
    ; Show message when no content is available
    ret

; ==================================================================
; GAMEFLOW NODE DATA STRUCTURES (Generated State Machine)
; ==================================================================

${t.gameFlow?j(t.gameFlow):`
; No GameFlow detected - using default screen loading
`}

show_pause_overlay:
    ; Pure game - no pause overlay needed
    ret

clear_pause_overlay:
    ; Clear pause overlay by redrawing that area
    ; Simple implementation: reload game screen
    call load_game_screen
    ret

show_game_over_screen:
    ; Pure game - no game over screen needed
    ; Just restart the game automatically
    ret

show_end_screen:
    ; End node - show end screen or credits
    ; Stub implementation
    ret

render_frame:
    ; Render current frame based on flow state
    ; Optimized rendering with V-Blank synchronization

    ; Increment frame counter for timing
    ld hl, (frame_counter)
    inc hl
    ld (frame_counter), hl

    ; Check current flow state and render appropriately
    ld a, (current_flow_state)
    cp FLOW_STATE_MAIN_MENU
    jp z, render_main_menu
    cp FLOW_STATE_GAME
    jp z, render_game
    cp FLOW_STATE_PAUSE
    jp z, render_pause
    cp FLOW_STATE_GAME_OVER
    jp z, render_game_over
    cp FLOW_STATE_CREDITS
    jp z, render_credits

    ; Default: unknown state - just continue
    ret

render_main_menu:
    ; Pure game - no menu, go directly to game
    ld a, FLOW_STATE_GAME
    ld (current_flow_state), a
    call init_game_entities
    call load_game_screen
    ret

render_game:
    ; Render game frame with optimized sprite updates
    ; Only update sprites that have moved (optimization)

    ; Update sprite positions in VRAM only when needed
    ; This is much more efficient than reloading entire screen
    call update_sprites_to_vram

    ; Pure game rendering - no UI text needed
    ; Game state is entirely visual through sprites and background
    ret

render_pause:
    ; Pure game - no pause text needed
    ; Game is paused but visually identical
    ret

render_game_over:
    ; Pure game - return to game after brief pause
    ; No text needed - just restart game
    call return_to_menu
    ret

render_credits:
    ; Pure game - no credits needed
    call return_to_menu
    ret

; Pure game - no text strings needed for ${n.toUpperCase()}
; All communication is through visual gameplay elements

    end                 ; End of assembly
`}function Re(e){var t,a,o,i,s,l,c;if(!e.sprites||e.sprites.length===0)return`; ==================================================================
; SPRITE DATA (EMPTY - NO SPRITES DETECTED)
; File: sprites.asm
; ==================================================================

; No sprites detected in project - file generated as placeholder

; ==================================================================
; SPRITE UTILITY FUNCTIONS (Available for future use)
; ==================================================================

; Clear all sprites (make them invisible)
clear_all_sprites:
    ld hl, sprite_y_pos
    ld de, sprite_y_pos+1
    ld bc, ${Math.max(0,(((t=e.sprites)==null?void 0:t.length)||1)-1)}                     ; ${((a=e.sprites)==null?void 0:a.length)||1} sprites - 1
    ld (hl), SPRITE_INVISIBLE     ; Y=209 (invisible)
    ldir
    ret

; Hide specific sprite (A = sprite number)
hide_sprite:
    ld hl, sprite_y_pos
    ld e, a
    ld d, 0
    add hl, de                    ; HL points to sprite Y position
    ld (hl), SPRITE_INVISIBLE     ; Make invisible
    ret

; ==================================================================
; END OF SPRITE DATA
; ==================================================================
`;let n=`; ==================================================================
; SPRITE DATA
; File: sprites.asm
; Description: Sprite pattern and animation data
; ${((o=e.sprites)==null?void 0:o.length)||0} sprites detected
; ==================================================================

; ==================================================================
; SPRITE PATTERN DATA
; ==================================================================
`;return e.sprites.forEach((r,d)=>{const E=r.name.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase(),p=oe(r,"hex");let u=-1;for(let S=0;S<4;S++){const A=`${E}_F0_LAYER${S}:`;if(p.includes(A)){u=S;break}}n+=`
; Sprite ${d}: ${r.name}
${p}`,u>=0?n+=`
; Unified pattern label for sprite ${d} (for easy reference in loading code)
SPRITE_${d}_PATTERN EQU ${E}_F0_LAYER${u}
`:n+=`
; WARNING: No valid pattern layers found for sprite ${d}: ${r.name}
; Creating placeholder pattern label
SPRITE_${d}_PATTERN:
    DB 0, 0, 0, 0, 0, 0, 0, 0  ; 8 bytes of empty pattern data
`}),n+=`
; ==================================================================
; SPRITE INITIALIZATION FUNCTIONS
; ==================================================================

init_sprites:
    ; Initialize sprite system
    call clear_all_sprites

    ; Load sprite patterns to VRAM
    call load_sprite_patterns

    ; Initialize sprite positions (all invisible by default)
    xor a
    ld (active_sprite_count), a

    ret

load_sprite_patterns:
    ; Load all sprite patterns to VRAM sprite pattern table
`,e.sprites.forEach((r,d)=>{n+=`
    ; Load sprite ${d}: ${r.name} (BIOS LDIRVM handles timing)
    ld hl, SPRITE_${d}_PATTERN
    ld de, SPRPAT + (${d} * 32) ; Each 16x16 sprite = 32 bytes (4 patterns)
    ld bc, 32                       ; 16x16 sprite size
    call LDIRVM                     ; BIOS handles safe VRAM access
`}),n+=`    ret

; ==================================================================
; SPRITE MANAGEMENT FUNCTIONS
; ==================================================================

; Show sprite (A = sprite number, B = X, C = Y, D = pattern, E = color)
show_sprite:
    push bc                       ; Preserve parameters
    push de

    ; Calculate sprite offset (A = sprite number)
    ld l, a                       ; L = sprite number
    ld h, 0                       ; HL = sprite number

    ; Set X position
    push hl
    ld de, sprite_x_pos
    add hl, de                    ; HL points to sprite X position
    ld (hl), b                    ; Set X position
    pop hl

    ; Set Y position
    push hl
    ld de, sprite_y_pos
    add hl, de                    ; HL points to sprite Y position
    ld (hl), c                    ; Set Y position
    pop hl

    ; Set pattern
    push hl
    ld de, sprite_pattern
    add hl, de                    ; HL points to sprite pattern
    pop de                        ; Restore original HL to DE
    push de                       ; Save it again
    ld (hl), d                    ; Set pattern number
    pop hl

    ; Set color
    ld de, sprite_color
    add hl, de                    ; HL points to sprite color
    pop de                        ; Get original DE back
    ld (hl), e                    ; Set color

    pop bc                        ; Restore original parameters
    ret

; Clear all sprites (make them invisible)
clear_all_sprites:
    ld hl, sprite_y_pos
    ld de, sprite_y_pos+1
    ld bc, ${Math.max(0,(((i=e.sprites)==null?void 0:i.length)||1)-1)}                     ; ${((s=e.sprites)==null?void 0:s.length)||1} sprites - 1
    ld (hl), SPRITE_INVISIBLE     ; Y=209 (invisible)
    ldir
    ret

; Hide specific sprite (A = sprite number)
hide_sprite:
    ld hl, sprite_y_pos
    ld e, a
    ld d, 0
    add hl, de                    ; HL points to sprite Y position
    ld (hl), SPRITE_INVISIBLE     ; Make invisible
    ret

; Update sprite positions to VRAM
update_sprites_to_vram:
    ; Copy sprite attributes from RAM to VRAM
    ; BIOS LDIRVM handles timing automatically
    ld hl, sprite_y_pos
    ld de, SPRATR
    ld bc, ${(((l=e.sprites)==null?void 0:l.length)||1)*4}                    ; ${((c=e.sprites)==null?void 0:c.length)||1} sprites * 4 bytes each
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

; ==================================================================
; SPRITE CONSTANTS
; ==================================================================
`,e.sprites.forEach((r,d)=>{const E=r.name.toUpperCase().replace(/[^A-Z0-9_]/g,"_");n+=`SPRITE_ID_${E}    EQU ${d}      ; Sprite: ${r.name}
`}),n+=`
; ==================================================================
; END OF SPRITE DATA
; ==================================================================
`,n}function Oe(e){return!e.entities||e.entities.length===0?`; ==================================================================
; GAME COMPONENT SYSTEMS (SKIPPED - NO ENTITIES DETECTED)
; File: components.asm
; ==================================================================

; No entities detected in project - ECS system not needed
; This saves ~650 lines of unused component management code

; Minimal stub functions for compatibility
init_components:
    ret

update_input_component:
    ret

update_position_component:
    ret

update_movement_component:
    ret

update_collision_component:
    ret

update_sprite_component:
    ret

; ==================================================================
; END OF COMPONENTS (MINIMAL VERSION)
; ==================================================================
`:`; ==================================================================
; GAME COMPONENT SYSTEMS - MSX ECS ENGINE
; File: components.asm
; Description: Component systems based on Mideas React.js architecture
; Implements Position, Sprite, Movement, Collision, Input, and Behavior systems
; ==================================================================

; ==================================================================
; COMPONENT TYPE CONSTANTS (Based on ComponentDefinition analysis)
; ==================================================================

; Core Components (always present)
COMP_POSITION   EQU 0    ; Position component (x, y coordinates)
COMP_SPRITE     EQU 1    ; Sprite rendering component
COMP_MOVEMENT   EQU 2    ; Movement/velocity component
COMP_COLLISION  EQU 3    ; Collision detection component
COMP_INPUT      EQU 4    ; Input handling component
COMP_BEHAVIOR   EQU 5    ; AI/Logic behavior component
COMP_HEALTH     EQU 6    ; Health/damage component
COMP_ANIMATION  EQU 7    ; Animation state component

; Component flags for entity filtering
COMP_MASK_POSITION   EQU #01  ; Binary: 00000001
COMP_MASK_SPRITE     EQU #02  ; Binary: 00000010
COMP_MASK_MOVEMENT   EQU #04  ; Binary: 00000100
COMP_MASK_COLLISION  EQU #08  ; Binary: 00001000
COMP_MASK_INPUT      EQU #10  ; Binary: 00010000
COMP_MASK_BEHAVIOR   EQU #20  ; Binary: 00100000
COMP_MASK_HEALTH     EQU #40  ; Binary: 01000000
COMP_MASK_ANIMATION  EQU #80  ; Binary: 10000000

; ==================================================================
; COMPONENT DATA STRUCTURES (Entity-Component arrays)
; ==================================================================

; Position Component Data (32 entities max)
entity_x_pos        EQU sprite_x_pos      ; Reuse sprite positions
entity_y_pos        EQU sprite_y_pos      ; (32 bytes each)

; Movement Component Data
entity_vel_x        EQU temp_word_1       ; X velocity storage (signed 8-bit)
entity_vel_y        EQU temp_word_2       ; Y velocity storage (signed 8-bit)

; Component masks for each entity (which components are active)
entity_comp_masks   EQU temp_byte_1       ; Component flags per entity (32 bytes)

; Animation Component Data
entity_anim_frame   EQU temp_byte_2       ; Current animation frame (32 bytes)

; ==================================================================
; CORE ECS SYSTEM FUNCTIONS
; ==================================================================

init_components:
    ; Initialize all component systems (based on Mideas initialization)

    ; Clear all component masks
    ld hl, entity_comp_masks
    ld de, entity_comp_masks+1
    ld bc, 31
    ld (hl), 0
    ldir

    ; Initialize position system
    call init_position_system

    ; Initialize sprite system
    call init_sprite_system

    ; Initialize movement system
    call init_movement_system

    ; Initialize collision system
    call init_collision_system

    ; Initialize input system
    call init_input_system

    ; Initialize behavior system
    call init_behavior_system

    ret

; ==================================================================
; POSITION COMPONENT SYSTEM (Based on SpriteEditor position handling)
; ==================================================================

init_position_system:
    ; Initialize position component system
    ; Clear all entity positions
    ld hl, entity_x_pos
    ld de, entity_x_pos+1
    ld bc, 31
    ld (hl), 0
    ldir

    ld hl, entity_y_pos
    ld de, entity_y_pos+1
    ld bc, 31
    ld (hl), 0
    ldir
    ret

update_position_component:
    ; Update positions based on velocities (Movement → Position)
    ld b, 32                   ; Loop through all entities
    ld hl, entity_comp_masks   ; Check component masks

position_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_POSITION     ; Check if has position component
    jr z, position_next_entity ; Skip if no position component

    ; Apply velocity to position (if has movement component)
    ld a, (hl)
    and COMP_MASK_MOVEMENT
    jr z, position_next_entity ; Skip velocity if no movement

    ; TODO: Add velocity to position logic here
    ; entity_x_pos[entity] += entity_vel_x[entity]
    ; entity_y_pos[entity] += entity_vel_y[entity]

position_next_entity:
    inc hl                     ; Next entity
    djnz position_update_loop
    ret

; ==================================================================
; SPRITE COMPONENT SYSTEM (Based on SpriteEditor rendering)
; ==================================================================

init_sprite_system:
    ; Initialize sprite rendering system
    ; Clear all sprite attributes
    call clear_all_sprites
    ret

update_sprite_component:
    ; Update sprite rendering based on entity positions
    ld b, 32                   ; Loop through all entities
    ld hl, entity_comp_masks   ; Check component masks
    ld c, 0                    ; Entity index counter

sprite_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_SPRITE       ; Check if has sprite component
    jr z, sprite_next_entity   ; Skip if no sprite component

    ; Render sprite at entity position
    push bc
    push hl

    ; Get entity position
    ld hl, entity_x_pos
    ld e, c                    ; Entity index
    ld d, 0
    add hl, de                 ; HL points to entity X
    ld b, (hl)                 ; B = X position

    ld hl, entity_y_pos
    add hl, de                 ; HL points to entity Y
    ld c, (hl)                 ; C = Y position

    ; Show sprite (A=sprite#, B=X, C=Y, D=pattern, E=color)
    ld a, e                    ; Sprite number = entity index
    ld d, 0                    ; Pattern 0 (TODO: get from entity data)
    ld e, 15                   ; Color white (TODO: get from entity data)
    call show_sprite

    pop hl
    pop bc

sprite_next_entity:
    inc hl                     ; Next entity
    inc c                      ; Next entity index
    djnz sprite_update_loop

    ; Update all sprites to VRAM
    call update_sprites_to_vram
    ret

; ==================================================================
; MOVEMENT COMPONENT SYSTEM (Based on movement physics)
; ==================================================================

init_movement_system:
    ; Initialize movement/physics system
    ; Clear velocities
    ld a, 0
    ld (entity_vel_x), a
    ld (entity_vel_y), a
    ret

update_movement_component:
    ; Update movement/physics for entities
    ld b, 32                   ; Loop through all entities
    ld hl, entity_comp_masks   ; Check component masks

movement_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_MOVEMENT     ; Check if has movement component
    jr z, movement_next_entity ; Skip if no movement component

    ; Apply physics/movement logic here
    ; TODO: Apply gravity, friction, collision response, etc.

movement_next_entity:
    inc hl                     ; Next entity
    djnz movement_update_loop
    ret

; ==================================================================
; COLLISION COMPONENT SYSTEM (Based on ScreenEditor collision detection)
; ==================================================================

init_collision_system:
    ; Initialize collision detection system
    ret

update_collision_component:
    ; Check collisions between entities and environment
    ld b, 32                   ; Loop through all entities
    ld hl, entity_comp_masks   ; Check component masks
    ld c, 0                    ; Entity index

collision_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_COLLISION    ; Check if has collision component
    jr z, collision_next_entity ; Skip if no collision component

    ; Perform collision detection for this entity
    push bc
    push hl

    ; Get entity position
    ld hl, entity_x_pos
    ld e, c                    ; Entity index
    ld d, 0
    add hl, de                 ; HL points to entity X
    ld a, (hl)                 ; A = X position

    ld hl, entity_y_pos
    add hl, de                 ; HL points to entity Y
    ld b, (hl)                 ; B = Y position

    ; Check screen boundaries (256x192 with 16x16 sprites)
    ; Left boundary
    cp 0
    jr z, collision_boundary_hit

    ; Right boundary (256 - 16 = 240)
    cp 240
    jr nc, collision_boundary_hit

    ; Top boundary
    ld a, b
    cp 0
    jr z, collision_boundary_hit

    ; Bottom boundary (192 - 16 = 176)
    cp 176
    jr nc, collision_boundary_hit

    ; Check tile collision (if screen maps exist)
    call check_tile_collision

    ; Check entity-to-entity collision
    call check_entity_collision

    jr collision_check_complete

collision_boundary_hit:
    ; Handle boundary collision
    call handle_boundary_collision

collision_check_complete:
    pop hl
    pop bc

collision_next_entity:
    inc hl                     ; Next entity
    inc c                      ; Next entity index
    djnz collision_update_loop
    ret

; ==================================================================
; COLLISION HELPER FUNCTIONS (Critical for Gameplay Parity)
; ==================================================================

check_tile_collision:
    ; Check collision with background tiles
    ; A = X position, B = Y position
    ; Convert pixel position to tile coordinates
    push af
    push bc

    ; DYNAMIC TILE SIZE CONVERSION
    ; TODO: This should be calculated from actual screen map tile sizes
    ; For now, detect most common tile size in project
${e.tiles&&e.tiles.length>0?`
    ; Project tile analysis: ${e.tiles.map(t=>`${t.width}x${t.height}`).join(", ")}
    ; Using first tile as reference: ${e.tiles[0].width}x${e.tiles[0].height}
    ; Convert X to tile column (divide by ${e.tiles[0].width})`:`
    ; No tiles detected - using default 16x16
    ; Convert X to tile column (divide by 16)`}

${e.tiles&&e.tiles.length>0&&e.tiles[0].width>=8&&Number.isInteger(Math.log2(e.tiles[0].width))?`
    ; Divide by ${e.tiles[0].width} (${Math.log2(e.tiles[0].width)} shifts)
${Array.from({length:Math.log2(e.tiles[0].width)},(t,a)=>`    srl a                      ; A = X / ${Math.pow(2,a+1)}`).join(`
`)}
`:`
    ; Default 16px tiles (4 shifts)
    srl a                      ; A = X / 2
    srl a                      ; A = X / 4
    srl a                      ; A = X / 8
    srl a                      ; A = X / 16
`}    ld c, a                    ; C = tile column

${e.tiles&&e.tiles.length>0&&e.tiles[0].height>=8&&Number.isInteger(Math.log2(e.tiles[0].height))?`
    ; Convert Y to tile row (divide by ${e.tiles[0].height})
    ld a, b
${Array.from({length:Math.log2(e.tiles[0].height)},(t,a)=>`    srl a                      ; A = Y / ${Math.pow(2,a+1)}`).join(`
`)}
`:`
    ; Default 16px tiles (4 shifts)
    ld a, b
    srl a                      ; A = Y / 2
    srl a                      ; A = Y / 4
    srl a                      ; A = Y / 8
    srl a                      ; A = Y / 16
`}    ld b, a                    ; B = tile row

    ; Check if position is within valid tile map
    ld a, c
    cp ${e.tiles&&e.tiles.length>0?Math.floor(256/e.tiles[0].width):16}                      ; Screen width in tiles
    jr nc, no_tile_collision
    ld a, b
    cp ${e.tiles&&e.tiles.length>0?Math.floor(192/e.tiles[0].height):12}                      ; Screen height in tiles
    jr nc, no_tile_collision

    ; Get tile at position (simplified - would read from behavior map)
    ; For now, assume all non-zero tiles are solid
    ; This would read from the behavior map generated from screen data
    call get_behavior_tile     ; Returns A = behavior value
    or a
    jr z, no_tile_collision    ; 0 = passable

    ; Collision detected - handle it
    call handle_tile_collision

no_tile_collision:
    pop bc
    pop af
    ret

check_entity_collision:
    ; Check collision with other entities
    ; A = current entity X, B = current entity Y, C = current entity index
    push bc
    push af

    ; Loop through all other entities
    ld hl, entity_comp_masks
    ld e, 0                    ; Other entity index

entity_collision_loop:
    ld a, e
    cp c                       ; Skip self
    jr z, next_entity_collision

    ; Check if other entity has collision component
    ld a, (hl)
    and COMP_MASK_COLLISION
    jr z, next_entity_collision

    ; Get other entity position
    push hl
    push de

    ld hl, entity_x_pos
    ld d, 0
    add hl, de                 ; HL points to other entity X
    ld d, (hl)                 ; D = other X

    ld hl, entity_y_pos
    add hl, de                 ; HL points to other entity Y
    ld e, (hl)                 ; E = other Y

    ; Check if entities overlap (16x16 sprites)
    ; Current entity: A = X, B = Y
    ; Other entity: D = X, E = Y

    ; X overlap check: |X1 - X2| < 16
    ld h, a                    ; H = current X
    ld a, d                    ; A = other X
    sub h                      ; A = other X - current X
    jr nc, x_diff_positive     ; Jump if positive
    neg                        ; Make positive
x_diff_positive:
    cp 16                      ; Check if < 16
    jr nc, no_entity_collision ; No X overlap

    ; Y overlap check: |Y1 - Y2| < 16
    ld a, e                    ; A = other Y
    sub b                      ; A = other Y - current Y
    jr nc, y_diff_positive     ; Jump if positive
    neg                        ; Make positive
y_diff_positive:
    cp 16                      ; Check if < 16
    jr nc, no_entity_collision ; No Y overlap

    ; Collision detected!
    call handle_entity_collision

no_entity_collision:
    pop de
    pop hl

next_entity_collision:
    inc hl                     ; Next entity mask
    inc e                      ; Next entity index
    ld a, e
    cp 32                      ; Check all 32 entities
    jr nz, entity_collision_loop

    pop af
    pop bc
    ret

handle_boundary_collision:
    ; Handle collision with screen boundaries
    ; Stop movement in the collision direction
    ld a, 0
    ld (entity_vel_x), a       ; Stop X movement
    ld (entity_vel_y), a       ; Stop Y movement
    ret

handle_tile_collision:
    ; Handle collision with solid tiles
    ; Prevent movement into the tile
    ld a, 0
    ld (entity_vel_x), a       ; Stop X movement
    ld (entity_vel_y), a       ; Stop Y movement
    ret

handle_entity_collision:
    ; Handle collision between entities
    ; Implementation depends on game logic (damage, bouncing, etc.)
    ret

get_behavior_tile:
    ; Get behavior value for tile at (B, C)
    ; Returns A = behavior value (0=passable, 1=solid, etc.)
    ; This would read from the behavior map data
    ; For now, return 0 (all passable)
    ld a, 0
    ret

; ==================================================================
; INPUT COMPONENT SYSTEM (Based on input handling)
; ==================================================================

init_input_system:
    ; Initialize input handling system
    xor a
    ld (input_state), a
    ld (prev_input_state), a
    ret

update_input_component:
    ; Update input handling for player entities
    ; Store previous input state for edge detection
    ld a, (input_state)
    ld (prev_input_state), a

    ; Read current joystick state
    ld a, 0                    ; Joystick port 0
    call GTSTCK                ; Get joystick status (BIOS call)
    ld (input_state), a        ; Store current input state

    ; Process input for entities with input component
    ld b, 32                   ; Loop through all entities
    ld hl, entity_comp_masks   ; Check component masks
    ld c, 0                    ; Entity index

input_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_INPUT        ; Check if has input component
    jr z, input_next_entity    ; Skip if no input component

    ; Apply input to entity movement (real implementation)
    push bc
    push hl

    ; Convert joystick input to velocity
    ld a, (input_state)
    ld b, 0                    ; Default X velocity
    ld c, 0                    ; Default Y velocity

    ; Check directional input
    cp STICK_UP
    jr z, input_move_up
    cp STICK_DOWN
    jr z, input_move_down
    cp STICK_LEFT
    jr z, input_move_left
    cp STICK_RIGHT
    jr z, input_move_right
    cp STICK_UPRIGHT
    jr z, input_move_upright
    cp STICK_UPLEFT
    jr z, input_move_upleft
    cp STICK_DOWNRIGHT
    jr z, input_move_downright
    cp STICK_DOWNLEFT
    jr z, input_move_downleft
    jr input_apply_velocity

input_move_up:
    ld c, -2                   ; Negative Y velocity (up)
    jr input_apply_velocity

input_move_down:
    ld c, 2                    ; Positive Y velocity (down)
    jr input_apply_velocity

input_move_left:
    ld b, -2                   ; Negative X velocity (left)
    jr input_apply_velocity

input_move_right:
    ld b, 2                    ; Positive X velocity (right)
    jr input_apply_velocity

input_move_upright:
    ld b, 1                    ; Diagonal movement (slower)
    ld c, -1
    jr input_apply_velocity

input_move_upleft:
    ld b, -1
    ld c, -1
    jr input_apply_velocity

input_move_downright:
    ld b, 1
    ld c, 1
    jr input_apply_velocity

input_move_downleft:
    ld b, -1
    ld c, 1

input_apply_velocity:
    ; Apply calculated velocity to entity
    ; Store X velocity (entity_vel_x is temp storage for now)
    ld a, b
    ld (entity_vel_x), a       ; Store calculated X velocity

    ; Store Y velocity
    ld a, c
    ld (entity_vel_y), a       ; Store calculated Y velocity

    pop hl
    pop bc

input_next_entity:
    inc hl                     ; Next entity
    inc c                      ; Next entity index
    djnz input_update_loop
    ret

; ==================================================================
; BEHAVIOR COMPONENT SYSTEM (Based on BehaviorEditor logic)
; ==================================================================

init_behavior_system:
    ; Initialize AI/behavior system
    ret

update_behavior_component:
    ; Update AI/behavior logic for entities
    ld b, 32                   ; Loop through all entities
    ld hl, entity_comp_masks   ; Check component masks

behavior_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_BEHAVIOR     ; Check if has behavior component
    jr z, behavior_next_entity ; Skip if no behavior component

    ; Execute behavior scripts/AI logic
    ; TODO: State machines, pathfinding, decision trees

behavior_next_entity:
    inc hl                     ; Next entity
    djnz behavior_update_loop
    ret

; ==================================================================
; ENTITY MANAGEMENT FUNCTIONS (Based on EntityTemplate system)
; ==================================================================

; Create entity with components (A = entity ID, B = component mask)
create_entity:
    ; Set component mask for entity
    ld hl, entity_comp_masks
    ld e, a                    ; Entity index
    ld d, 0
    add hl, de                 ; HL points to entity mask
    ld (hl), b                 ; Set component mask

    ; Initialize component data based on mask
    bit 0, b                   ; Check COMP_MASK_POSITION
    call nz, init_entity_position

    bit 1, b                   ; Check COMP_MASK_SPRITE
    call nz, init_entity_sprite

    ; TODO: Initialize other components based on mask bits

    ret

; Initialize position component for entity (A = entity ID)
init_entity_position:
    ld hl, entity_x_pos
    ld e, a
    ld d, 0
    add hl, de
    ld (hl), 100               ; Default X position

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 100               ; Default Y position
    ret

; Initialize sprite component for entity (A = entity ID)
init_entity_sprite:
    ; Set sprite as visible with default pattern
    ld hl, sprite_pattern
    ld e, a
    ld d, 0
    add hl, de
    ld (hl), 0                 ; Pattern 0

    ld hl, sprite_color
    add hl, de
    ld (hl), 15                ; White color
    ret

; ==================================================================
; END OF COMPONENT SYSTEMS
; ==================================================================
`}function Me(e){let n=`; ==================================================================
; GAME ENTITIES
; File: entities.asm
; Description: Game entity definitions and behavior
; ==================================================================

`;return e.entities&&e.entities.length>0?(n+=`; ==================================================================
; ENTITY DEFINITIONS
; ==================================================================

`,e.entities.forEach((t,a)=>{const o=t.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");n+=`; Entity: ${t.name}
ENTITY_${o}_ID EQU ${a}
`,t.entityTemplateId&&(n+=`ENTITY_${o}_TEMPLATE EQU "${t.entityTemplateId}"
`),t.position&&(n+=`ENTITY_${o}_X EQU ${t.position.x}
ENTITY_${o}_Y EQU ${t.position.y}
`),n+=`
`}),n+=`; ==================================================================
; ENTITY MANAGEMENT FUNCTIONS
; ==================================================================

init_entities:
    ; Initialize all game entities
`,e.entities&&e.entities.length>0?e.entities.forEach(t=>{const a=t.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");n+=`    call init_${a.toLowerCase()}
`}):n+=`    ; No entities to initialize
`,n+=`    ret

update_entities:
    ; Update all entities
`,e.entities&&e.entities.length>0?e.entities.forEach(t=>{const a=t.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");n+=`    call update_${a.toLowerCase()}
`}):n+=`    ; No entities to update
`,n+=`    ret

`,e.entities.forEach((t,a)=>{var E,p;const o=t.name.toUpperCase().replace(/[^A-Z0-9]/g,"_"),i=((E=t.position)==null?void 0:E.x)||100,s=((p=t.position)==null?void 0:p.y)||100,l=16,c=16,r=i*l,d=s*c;n+=`init_${o.toLowerCase()}:
    ; Initialize ${t.name} at real position from JSON
    ; JSON position: (${i}, ${s}) tiles = (${r}, ${d}) pixels

    ; Set entity ID and component mask
    ld a, ${a}             ; Entity ID
    ld b, COMP_MASK_POSITION + COMP_MASK_SPRITE + COMP_MASK_MOVEMENT + COMP_MASK_COLLISION + COMP_MASK_INPUT
    call create_entity         ; Create with all components

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, ${a}             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), ${r}         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), ${d}         ; Set real Y position from JSON

    ; Set sprite pattern and color
    ld hl, sprite_pattern
    add hl, de
    ld (hl), ${a}          ; Use entity index as sprite pattern

    ld hl, sprite_color
    add hl, de
    ld (hl), 15                ; White color

    ; Make sprite visible immediately
    ld a, ${a}             ; Sprite number
    ld b, ${r}            ; X position
    ld c, ${d}            ; Y position
    ld d, ${a}             ; Pattern
    ld e, 15                   ; Color
    call show_sprite
    ret

update_${o.toLowerCase()}:
    ; Update ${t.name} logic with real behavior
    ; Check if entity has input component (player entities)
    ld a, ${a}
    ld hl, entity_comp_masks
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    ret z                      ; Skip if no input component

    ; This is a player entity - update based on input
    ; Input velocity is already calculated in UPDATE_INPUT_COMPONENT
    ; Position update happens in UPDATE_POSITION_COMPONENT
    ret

`})):n+=`; ==================================================================
; DEFAULT ENTITY SYSTEM
; ==================================================================

; Basic entity structure
ENTITY_PLAYER_ID EQU 0
ENTITY_ENEMY_ID  EQU 1

init_entities:
    ; Initialize default entities
    call init_player
    ret

update_entities:
    ; Update all entities
    call update_player
    ret

init_player:
    ; Initialize player entity
${e.sprites&&e.sprites.length>0?`
    ; TEST: Show first sprite in center of screen
    ; Sprite 0, X=128, Y=96 (center), Pattern=0, Color=15 (white)
    ld a, 0           ; Sprite number 0
    ld b, 128         ; X position (center)
    ld c, 96          ; Y position (center)
    ld d, 0           ; Pattern 0 (first sprite)
    ld e, 15          ; Color 15 (white)
    call show_sprite
`:""}
    ret

update_player:
    ; Update player logic
    ret

`,n+=`; ==================================================================
; END OF ENTITIES
; ==================================================================
`,n}function Fe(e){if(!e.screenMaps||e.screenMaps.length===0)return`; ==================================================================
; SCREEN MAPS (SKIPPED - NO SCREENS DETECTED)
; File: screens.asm
; ==================================================================

; No screens detected in project - screen system not needed
; This saves ~160 lines of unused screen data

; Minimal stub functions for compatibility
load_game_screen:
    ret

load_screen_default:
    ret

; ==================================================================
; END OF SCREENS (MINIMAL VERSION)
; ==================================================================
`;let n=`; ==================================================================
; SCREEN MAPS
; File: screens.asm
; Description: Screen layout and map data
; ==================================================================

`;if(e.screenMaps&&e.screenMaps.length>0){n+=`; ==================================================================
; SCREEN MAP CONSTANTS
; ==================================================================

`,e.screenMaps.forEach((a,o)=>{const i=a.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");n+=`SCREEN_${i}_${o}_ID EQU ${o}
`}),n+=`
; ==================================================================
; SCREEN MAP DATA
; ==================================================================

`,e.screenMaps.forEach(a=>{var o,i,s,l,c;if(a.layers&&a.layers.background){const r=new Set(a.layers.background.flat().map(m=>m.tileId).filter(Boolean)),d=[];if(console.log(`🔍 Screen ${a.name}: Found ${r.size} unique tiles`),console.log("Unique tile IDs:",Array.from(r)),console.log("Available tiles in analysis:",(o=e.tiles)==null?void 0:o.map(m=>`${m.name} (${m.id})`)),r.size>0){const m={...J[1],assignedTiles:{},charsetRangeStart:0,charsetRangeEnd:255};let T=0;Array.from(r).forEach(C=>{var I;if(C){const N=(I=e.tiles)==null?void 0:I.find(D=>D.id===C);if(N){const D=Math.ceil(N.width/8),O=Math.ceil(N.height/8);m.assignedTiles[C]={charCode:T,assignedAt:Date.now()},console.log(`📌 Assigned tile ${N.name} (${C}) to charCode ${T} (${D}x${O} chars)`),T+=D*O}else console.log(`❌ Tile asset not found for ID: ${C}`)}}),d.push(m),console.log(`✅ Created tile bank with ${Object.keys(m.assignedTiles).length} assigned tiles`)}const E=ie(a,e.tiles||[],d.length>0?d:void 0,"SCREEN 2 (Graphics I)"),p=Array.from(E),u=p.filter(m=>m!==255).length,S=new Set(p);console.log(`📊 Generated ${p.length} bytes: ${u} non-FF (${(u/p.length*100).toFixed(1)}%)`),console.log(`🎯 Unique byte values: [${Array.from(S).sort((m,T)=>m-T).join(", ")}]`),u===0&&(console.log("❌ All bytes are #FF - debugging tile bank assignment..."),console.log("Tile bank enabled:",(i=d[0])==null?void 0:i.enabled),console.log("Tile bank assigned tiles:",Object.keys(((s=d[0])==null?void 0:s.assignedTiles)||{})),console.log("Charset range:",(l=d[0])==null?void 0:l.charsetRangeStart,"-",(c=d[0])==null?void 0:c.charsetRangeEnd)),new Set(p.filter(m=>m!==255&&m!==0)),new Set(a.layers.background.flat().map(m=>m.tileId).filter(Boolean));const A=[];A.push('; Generated using exact Screen Editor "Download ASM" logic'),A.push("; Byte values represent actual character codes in VRAM");const g=new Map,h=a.layers.background;for(let m=0;m<h.length;m++)for(let T=0;T<h[m].length;T++){const C=h[m][T];if(C!=null&&C.tileId){const I=m*(a.activeAreaWidth??a.width)+T;if(I<p.length){const N=p[I];N!==255&&N!==0&&g.set(C.tileId,N)}}}const f=`${a.name}_${e.screenMaps.indexOf(a)}`,_=re(f,a.width,a.height,p,A,"hex");if(n+=_,a.layers.collision&&e.tiles){const m=a.layers.collision,T=[];m.forEach(I=>{I.forEach(N=>{var D;if(N.tileId){const O=e.tiles.find(k=>k.id===N.tileId),M=((D=O==null?void 0:O.logicalProperties)==null?void 0:D.mapId)||0;T.push(M)}else T.push(0)})});const C=se(f,a.width,a.height,T,"hex");n+=`
${C}`}}else{const r=e.screenMaps.indexOf(a),d=a.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");n+=`SCREEN_${d}_${r}_LAYOUT:
    ; Screen data for ${a.name}
    ; TODO: Add actual screen map data
    DB 0, 0, 0, 0, 0, 0, 0, 0

`}n+=`
`}),n+=`; ==================================================================
; SCREEN LOADING FUNCTIONS
; ==================================================================

load_screen:
    ; Load screen (A = screen ID)
    ; TODO: Implement screen loading logic
    ret

`,e.screenMaps.forEach((a,o)=>{const i=a.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");n+=`load_screen_${i.toLowerCase()}:
    ; Load ${a.name} screen (BIOS LDIRVM handles timing)
    ld hl, SCREEN_${i}_${o}_LAYOUT
    ld de, NAMETBL
    ld bc, SCREEN_${i}_${o}_SIZE
    call LDIRVM                ; BIOS handles safe VRAM access
    ret

`});const t=e.worldmaps||[];t.length>0&&(n+=`; ==================================================================
; WORLDMAP LOADING FUNCTIONS (for GameFlow WorldLink nodes)
; ==================================================================

`,t.forEach(a=>{var c;const o=a.id,i=a.startScreenNodeId,s=(c=a.nodes)==null?void 0:c.find(r=>r.id===i),l=s==null?void 0:s.screenAssetId;if(l){const r=e.screenMaps.findIndex(E=>E.id===l),d=e.screenMaps[r];if(d){const E=d.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");n+=`load_world_${o.toLowerCase().replace(/[^a-z0-9]/g,"_")}:
    ; Load worldmap: ${a.name}
    ; Starting screen: ${d.name}
    call load_screen_${E.toLowerCase()}
    ret

`}else n+=`load_world_${o.toLowerCase().replace(/[^a-z0-9]/g,"_")}:
    ; Worldmap: ${a.name} (screen not found)
    ret

`}else n+=`load_world_${o.toLowerCase().replace(/[^a-z0-9]/g,"_")}:
    ; Worldmap: ${a.name} (no start screen)
    ret

`}))}else n+=`; ==================================================================
; DEFAULT SCREEN SYSTEM
; ==================================================================

SCREEN_GAME_ID   EQU 0
SCREEN_TITLE_ID  EQU 1

SCREEN_GAME_DATA:
    ; Default game screen pattern
    DB 0, 1, 2, 3, 4, 5, 6, 7
    DB 8, 9, 10, 11, 12, 13, 14, 15
    ; TODO: Add more screen data

load_screen:
    ; Load screen (A = screen ID)
    cp SCREEN_GAME_ID
    jp z, load_screen_game
    ret

load_screen_game:
    ; Load game screen (BIOS LDIRVM handles timing)
    ld hl, SCREEN_GAME_DATA
    ld de, NAMETBL
    ld bc, 768
    call LDIRVM                ; BIOS handles safe VRAM access
    ret

`;return n+=`; ==================================================================
; END OF SCREEN MAPS
; ==================================================================
`,n}function be(e){var a,o,i;const n=(o=(a=e.gameFlow)==null?void 0:a.nodes)==null?void 0:o.some(s=>s.type==="SubMenu"),t=(i=e.screenMaps)==null?void 0:i.some(s=>{var l,c;return((l=s.layers)==null?void 0:l.text)||((c=s.textElements)==null?void 0:c.length)>0});return!n&&!t?`; ==================================================================
; MSX FONT DATA (SKIPPED - NO TEXT/MENUS DETECTED)
; File: font.asm
; ==================================================================

; No text or menus detected in project - font system not needed
; This saves ~250 lines of unused font data

; Minimal stub functions for compatibility
init_font_system:
    ret

load_custom_font:
    ret

print_string_screen2:
    ret

; ==================================================================
; END OF FONT (MINIMAL VERSION)
; ==================================================================
`:`; ==================================================================
; MSX FONT DATA FOR SCREEN 2 TEXT
; File: font.asm
; Description: Font pattern data based on Mideas Font Editor
; Character patterns optimized for Screen 2 mode text rendering
; ==================================================================

; ==================================================================
; FONT PATTERN DATA (Based on DEFAULT_MSX_FONT from FontEditor)
; ==================================================================

; Character patterns (8 bytes per character, 8x8 pixels)
; Format: Each byte represents one row of 8 pixels (bit 7 = leftmost pixel)

FONT_PATTERN_DATA:
    ; Character 32: Space
    DB #00, #00, #00, #00, #00, #00, #00, #00

    ; Character 48: '0'
    DB #3E, #7F, #73, #73, #73, #7F, #3E, #00

    ; Character 49: '1'
    DB #18, #38, #18, #18, #18, #18, #7E, #00

    ; Character 50: '2'
    DB #3E, #7F, #03, #3E, #60, #7F, #3E, #00

    ; Character 58: ':'
    DB #00, #36, #36, #00, #36, #36, #00, #00

    ; Character 65: 'A'
    DB #3E, #7F, #63, #7F, #7F, #63, #63, #00

    ; Character 66: 'B'
    DB #7E, #7F, #63, #7E, #63, #7F, #7E, #00

    ; Character 67: 'C'
    DB #3C, #7E, #60, #60, #60, #7E, #3C, #00

    ; Character 68: 'D'
    DB #7C, #7E, #66, #66, #66, #7E, #7C, #00

    ; Character 69: 'E'
    DB #7F, #7F, #60, #7C, #60, #7F, #7F, #00

    ; Character 70: 'F'
    DB #7F, #7F, #60, #7C, #60, #60, #60, #00

    ; Character 71: 'G'
    DB #3C, #7E, #60, #67, #63, #7F, #3E, #00

    ; Character 72: 'H'
    DB #63, #63, #63, #7F, #63, #63, #63, #00

    ; Character 73: 'I'
    DB #7E, #18, #18, #18, #18, #18, #7E, #00

    ; Character 76: 'L'
    DB #60, #60, #60, #60, #60, #7F, #7F, #00

    ; Character 77: 'M'
    DB #63, #77, #7F, #6B, #63, #63, #63, #00

    ; Character 78: 'N'
    DB #63, #73, #7B, #6F, #67, #63, #63, #00

    ; Character 79: 'O'
    DB #3E, #7F, #63, #63, #63, #7F, #3E, #00

    ; Character 80: 'P'
    DB #7E, #7F, #63, #7F, #7E, #60, #60, #00

    ; Character 82: 'R'
    DB #7E, #7F, #63, #7E, #7B, #6F, #63, #00

    ; Character 83: 'S'
    DB #3E, #7F, #60, #3E, #0F, #7F, #3E, #00

    ; Character 84: 'T'
    DB #7F, #7F, #18, #18, #18, #18, #18, #00

    ; Character 85: 'U'
    DB #63, #63, #63, #63, #63, #7F, #3E, #00

    ; Character 63: '?'
    DB #3E, #7F, #63, #18, #18, #00, #18, #00

; Character index table (for quick lookup)
FONT_CHAR_INDEX:
    DB 32, 48, 49, 50, 58, 65, 66, 67, 68, 69, 70, 71, 72, 73, 76, 77, 78, 79, 80, 82, 83, 84, 85, 63
FONT_CHAR_COUNT EQU 24

; ==================================================================
; FONT LOADING FUNCTIONS (Based on Mideas generateFontPatternBinaryData)
; ==================================================================

load_custom_font:
    ; Load custom font patterns to VRAM Pattern Generator Table
    ; This replaces the MSX BIOS font with our custom font for text display
    ; BIOS LDIRVM handles timing automatically

    ; Calculate target address in Pattern Generator Table
    ; Characters 32-127 (printable ASCII) start at pattern #20 (32 decimal)
    ld hl, FONT_PATTERN_DATA
    ld de, CHRTBL2 + (32 * 8)     ; Start at character 32 (space)
    ld bc, FONT_CHAR_COUNT * 8    ; Load all custom characters
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_font_bank0:
    ; Load font to Pattern Generator Bank 0 (characters 0-255)
    ld hl, FONT_PATTERN_DATA
    ld de, CHRTBL2 + (32 * 8)     ; Start at character 32
    ld bc, FONT_CHAR_COUNT * 8
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_font_bank1:
    ; Load font to Pattern Generator Bank 1 (same patterns)
    ld hl, FONT_PATTERN_DATA
    ld de, CHRTBL2 + #800 + (32 * 8)  ; Bank 1 + character 32
    ld bc, FONT_CHAR_COUNT * 8
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_font_bank2:
    ; Load font to Pattern Generator Bank 2 (same patterns)
    ld hl, FONT_PATTERN_DATA
    ld de, CHRTBL2 + #1000 + (32 * 8) ; Bank 2 + character 32
    ld bc, FONT_CHAR_COUNT * 8
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_all_font_banks:
    ; Load custom font to all three Pattern Generator banks
    ; Required for complete Screen 2 text coverage
    call load_font_bank0
    call load_font_bank1
    call load_font_bank2
    ret

; ==================================================================
; FONT COLOR ATTRIBUTES (Based on MSXFontColorAttributes)
; ==================================================================

; Default color attributes for font characters (Screen 2 mode)
; Format: (FG color << 4) | BG color per 8-pixel row
FONT_COLOR_DATA:
    ; Character 32: Space (transparent)
    DB #00, #00, #00, #00, #00, #00, #00, #00

    ; Character 48-85: Standard text (white on black)
    ; Repeat for each character pattern
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; '0'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; '1'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; '2'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; ':'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'A'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'B'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'C'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'D'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'E'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'F'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'G'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'H'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'I'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'L'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'M'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'N'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'O'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'P'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'R'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'S'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'T'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'U'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; '?'

load_font_colors:
    ; Load font color attributes to Color Attribute Table
    ; Based on generateFontColorBinaryData from FontEditor
    ld hl, FONT_COLOR_DATA
    ld de, CLRTBL2 + (32 * 8)     ; Start at character 32
    ld bc, FONT_CHAR_COUNT * 8
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_font_colors_all_banks:
    ; Load font colors to all three Color Attribute banks
    ; Bank 0
    ld hl, FONT_COLOR_DATA
    ld de, CLRTBL2 + (32 * 8)
    ld bc, FONT_CHAR_COUNT * 8
    call LDIRVM

    ; Bank 1
    ld hl, FONT_COLOR_DATA
    ld de, CLRTBL2 + #800 + (32 * 8)
    ld bc, FONT_CHAR_COUNT * 8
    call LDIRVM

    ; Bank 2
    ld hl, FONT_COLOR_DATA
    ld de, CLRTBL2 + #1000 + (32 * 8)
    ld bc, FONT_CHAR_COUNT * 8
    call LDIRVM
    ret

; ==================================================================
; TEXT RENDERING FUNCTIONS (Based on Mideas renderMSX1TextToDataURL)
; ==================================================================

; Print string to Screen 2 name table (text mode compatible)
; HL = string pointer (null-terminated), DE = VRAM position
print_string_screen2:
    push bc
    ld b, 0                        ; Character counter

print_string_loop:
    ld a, (hl)                     ; Get character
    or a                           ; Check for null terminator
    jr z, print_string_end         ; End if null

    ; Write character to VRAM Name Table
    push hl                        ; Save string pointer
    push de                        ; Save VRAM position
    ld hl, de                      ; HL = VRAM address for WRTVRM
    call WRTVRM                    ; Write character to VRAM
    pop de                         ; Restore VRAM position
    pop hl                         ; Restore string pointer

    ; Move to next character
    inc hl                         ; Next character in string
    inc de                         ; Next position in VRAM
    inc b                          ; Count characters
    ld a, b
    cp 32                          ; Limit to screen width
    jr nz, print_string_loop       ; Continue if not at edge

print_string_end:
    pop bc
    ret

; Initialize font system for Screen 2 text rendering
init_font_system:
    ; Load custom font patterns and colors
    call load_all_font_banks       ; Load patterns to all banks
    call load_font_colors_all_banks ; Load colors to all banks
    ret

; ==================================================================
; END OF FONT DATA
; ==================================================================
`}function Ue(e){const n=e.gameFlow&&e.gameFlow.nodes&&e.gameFlow.nodes.some(a=>a.type==="SubMenu");if(!n)return`; ==================================================================
; GAME MENUS (SKIPPED - NO MENUS DETECTED)
; File: menus.asm
; ==================================================================

; No menus detected in project - menu system not needed
; This saves ~620 lines of unused menu management code

; Minimal stub functions for compatibility
init_menus:
    ret

show_main_menu:
    ret

update_menu_state:
    ret

; ==================================================================
; END OF MENUS (MINIMAL VERSION)
; ==================================================================
`;let t=`; ==================================================================
; GAME MENUS
; File: menus.asm
; Description: Menu systems and user interface with custom font support
; ==================================================================

`;return n?(t+=`; ==================================================================
; MENU CONSTANTS
; ==================================================================

`,e.gameFlow.nodes.filter(i=>i.type==="SubMenu").forEach((i,s)=>{const l=(i.title||i.id).toUpperCase().replace(/[^A-Z0-9]/g,"_");t+=`MENU_${l}_ID EQU ${s}
`}),t+=`
; ==================================================================
; MENU FUNCTIONS
; ==================================================================

`,e.gameFlow.nodes.filter(i=>i.type==="SubMenu").forEach(i=>{const s=(i.title||i.id).toUpperCase().replace(/[^A-Z0-9]/g,"_");t+=`show_menu_${s.toLowerCase()}:
    ; Display ${i.title||i.id} menu
    ; TODO: Implement menu display logic
    ret

handle_menu_${s.toLowerCase()}:
    ; Handle ${i.title||i.id} menu input
    ; TODO: Implement menu input handling
    ret

`})):t+=`; ==================================================================
; DEFAULT MENU SYSTEM
; ==================================================================

; Menu constants
MENU_MAIN_ID     EQU 0
MENU_GAME_ID     EQU 1
MENU_PAUSE_ID    EQU 2

; Menu states
MENU_ITEM_START  EQU 0
MENU_ITEM_EXIT   EQU 1

; Current menu variables
current_menu     DS 1
current_item     DS 1

; ==================================================================
; MENU FUNCTIONS
; ==================================================================

init_menus:
    ; Initialize menu system
    ld a, MENU_MAIN_ID
    ld (current_menu), a
    xor a
    ld (current_item), a
    ret

show_main_menu:
    ; Display main menu with custom font
    call cls

    ; Make sure custom font is loaded
    call init_font_system

    ; Print title using custom font
    ld hl, txt_title
    ld de, NAMETBL + (5 * 32) + 10  ; Row 5, column 10
    call print_string_screen2        ; Use custom font print function

    ; Print menu options using custom font
    ld hl, txt_start
    ld de, NAMETBL + (10 * 32) + 12
    call print_string_screen2

    ld hl, txt_exit
    ld de, NAMETBL + (12 * 32) + 12
    call print_string_screen2

    ret

handle_main_menu:
    ; Handle main menu input
    call GTSTCK     ; Get joystick input

    ; Check for up/down movement
    cp 1            ; Up
    jp z, menu_up
    cp 5            ; Down
    jp z, menu_down

    ; Check for selection (space or fire button)
    call GTTRIG
    or a
    jp nz, menu_select

    ret

menu_up:
    ld a, (current_item)
    or a
    jp z, menu_up_end  ; Already at top
    dec a
    ld (current_item), a
menu_up_end:
    ret

menu_down:
    ld a, (current_item)
    cp MENU_ITEM_EXIT
    jp z, menu_down_end  ; Already at bottom
    inc a
    ld (current_item), a
menu_down_end:
    ret

menu_select:
    ld a, (current_item)
    cp MENU_ITEM_START
    jp z, start_game
    cp MENU_ITEM_EXIT
    jp z, exit_game
    ret

start_game:
    ; Start the game
    ld a, MENU_GAME_ID
    ld (current_menu), a
    ret

exit_game:
    ; Exit to BASIC
    rst #00

; ==================================================================
; MENU TEXT DATA
; ==================================================================

txt_title:
    DB "GAME TITLE", 0

txt_start:
    DB "START GAME", 0

txt_exit:
    DB "EXIT", 0

; ==================================================================
; TEXT PRINTING FUNCTION
; ==================================================================

print_string:
    ; Print null-terminated string
    ; HL = source string, DE = VRAM destination
print_loop:
    ld a, (hl)
    or a
    ret z           ; End of string

    ; WRTVRM expects: A = data, HL = VRAM address
    push hl         ; Save string pointer
    push de         ; Save VRAM address
    pop hl          ; HL = VRAM address (for WRTVRM)
    call WRTVRM     ; Write character to VRAM
    pop hl          ; Restore string pointer

    inc hl          ; Next character in string
    inc de          ; Next VRAM position
    jp print_loop

`,t+=`; ==================================================================
; END OF MENUS
; ==================================================================
`,t}function Pe(e,n,t={}){if(console.log("🔧 Generating modular ASM files..."),!e)throw console.error("❌ projectName is required"),new Error("projectName is required");if(!n)throw console.error("❌ assets is undefined or null"),new Error("assets array is required");if(!Array.isArray(n))throw console.error("❌ assets is not an array"),new Error("assets must be an array");console.log(`📊 Project: ${e}, Assets: ${n.length}, Config:`,t);let a;try{a=Y(e,n),console.log(`🔍 Analysis complete: ${a.sprites.length} sprites, ${a.tiles.length} tiles`)}catch(i){console.error("❌ Error analyzing project:",i),a={hasSprites:!1,hasTiles:!1,hasScreens:!1,hasEntities:!1,hasComponents:!1,hasGameFlow:!1,hasMenus:!1,hasFonts:!1,components:[],entities:[],sprites:[],tiles:[],screens:[],projectName:e},console.log("🔄 Using fallback empty analysis")}const o={"bios.asm":Se(),"constants.asm":Ae(a),"variables.asm":fe(a),"header.asm":ge(e,a),"patterns.asm":Ne(a),"colors.asm":Le(a),"components.asm":Oe(a),"entities.asm":Me(a),"screens.asm":Fe(a),"sprites.asm":Re(a),"font.asm":be(a),"menus.asm":Ue(a),"gameflow.asm":"","main.asm":Ce(e,a),"unitedFiles.asm":""};return t.generateUnified&&(o["unitedFiles.asm"]=De(o,e,a)),console.log("✅ Modular ASM files generated successfully!"),console.log(`📊 Generated ${Object.keys(o).filter(i=>o[i]).length} files`),o}const Ut=Object.freeze(Object.defineProperty({__proto__:null,generateModularASM:Pe},Symbol.toStringTag,{value:"Module"}));export{ct as $,Lt as A,re as B,se as C,Ze as D,ke as E,et as F,qe as G,X as H,Ot as I,mt as J,Ft as K,Rt as L,V as M,ie as N,K as O,Be as P,tt as Q,at as R,$ as S,nt as T,st as U,dt as V,rt as W,lt as X,ot as Y,Ve as Z,it as _,je as a,_t as a0,v as a1,Ye as a2,Ke as a3,Ge as a4,ve as a5,pt as a6,$e as a7,Y as a8,bt as a9,Et as aa,ze as ab,J as ac,We as ad,He as ae,ut as af,Ut as ag,Qe as b,Xe as c,Tt as d,Je as e,ee as f,ht as g,te as h,R as i,we as j,xe as k,B as l,At as m,ft as n,It as o,gt as p,Ct as q,y as r,St as s,w as t,oe as u,Nt as v,ye as w,Mt as x,Z as y,Dt as z};
