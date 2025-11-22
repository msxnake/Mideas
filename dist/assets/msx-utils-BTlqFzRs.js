const St=[16,24,32];var me=(e=>(e.Score="Score",e.HighScore="HighScore",e.Lives="Lives",e.EnergyBar="EnergyBar",e.ItemDisplay="ItemDisplay",e.SceneName="SceneName",e.MiniMap="MiniMap",e.CoinCounter="CoinCounter",e.BossEnergyBar="BossEnergyBar",e.PhaseIndicator="PhaseIndicator",e.AttackAlert="AttackAlert",e.TextBox="TextBox",e.NumericField="NumericField",e.CustomCounter="CustomCounter",e))(me||{});const ue={water:{bit:0,label:"Water Effect",maskValue:1,color:"rgba(50, 100, 200, 0.4)"},customGravity:{bit:1,label:"Custom Gravity",maskValue:2,color:"rgba(150, 50, 200, 0.4)"},icePhysics:{bit:2,label:"Ice Physics",maskValue:4,color:"rgba(100, 200, 255, 0.4)"},spriteConceal:{bit:3,label:"Sprite Concealment",maskValue:8,color:"rgba(100, 100, 100, 0.4)"}};var Ee=(e=>(e.None="None",e.Tile="Tile",e.Sprite="Sprite",e.Screen="Screen",e.Code="Code",e.Attributes="Attributes",e.Sound="Sound",e.Platformer="Platformer",e.WorldMap="WorldMap",e.Track="Track",e.HUD="HUD",e.TileBanks="TileBanks",e.Font="Font",e.HelpDocs="HelpDocs",e.BehaviorEditor="BehaviorEditor",e.ComponentDefinitionEditor="ComponentDefinitionEditor",e.EntityTemplateEditor="EntityTemplateEditor",e.Boss="Boss",e.WorldView="WorldView",e.GameFlow="GameFlow",e.MainMenu="MainMenu",e.StateMachine="StateMachine",e.GlobalVariables="GlobalVariables",e.Palette="Palette",e))(Ee||{});const At=[1,3,5,7],Ct=[{id:0,name:"NoSolid (Passable)",isSolid:!1},{id:1,name:"Solid (Wall/Ground)",isSolid:!0},{id:2,name:"Platform (Top-Solid)",isSolid:!0},{id:3,name:"Slope (Solid)",isSolid:!0}],It={isBreakable:{bit:0,label:"Breakable"},isMovable:{bit:1,label:"Movable"},causesDamage:{bit:2,label:"Deadly"},isInteractiveSwitch:{bit:3,label:"Interactable"}},Nt="0.266",z=[{name:"Transparent",hex:"rgba(0,0,0,0)"},{name:"Black",hex:"#000000"},{name:"Medium Green",hex:"#3EB847"},{name:"Light Green",hex:"#74D07D"},{name:"Dark Blue",hex:"#2F2FC1"},{name:"Light Blue",hex:"#5858FC"},{name:"Dark Red",hex:"#B63125"},{name:"Cyan",hex:"#68D2DA"},{name:"Medium Red",hex:"#FC584A"},{name:"Light Red",hex:"#FF8E81"},{name:"Dark Yellow",hex:"#C0BF3B"},{name:"Light Yellow",hex:"#E7E474"},{name:"Dark Green",hex:"#309337"},{name:"Magenta",hex:"#B640C8"},{name:"Gray",hex:"#999999"},{name:"White",hex:"#FFFFFF"}],M=[{name:"Transparent (Backdrop)",hex:"rgba(0,0,0,0)",index:0},{name:"Black",hex:"#000000",index:1},{name:"Medium Green",hex:"#21C842",index:2},{name:"Light Green",hex:"#5EDC78",index:3},{name:"Dark Blue",hex:"#5455ED",index:4},{name:"Light Blue",hex:"#7D76FC",index:5},{name:"Dark Red",hex:"#D4524D",index:6},{name:"Cyan",hex:"#42EBF5",index:7},{name:"Medium Red",hex:"#FC5554",index:8},{name:"Light Red",hex:"#FF7978",index:9},{name:"Dark Yellow",hex:"#D4C154",index:10},{name:"Light Yellow",hex:"#E6CE80",index:11},{name:"Dark Green",hex:"#21B03B",index:12},{name:"Magenta",hex:"#C95BBA",index:13},{name:"Gray",hex:"#CCCCCC",index:14},{name:"White",hex:"#FFFFFF",index:15}],U=[0,36,73,109,146,182,219,255],$=e=>e.toString(16).padStart(2,"0").toUpperCase(),Lt=(()=>{const e=[];for(let n=0;n<U.length;n++)for(let t=0;t<U.length;t++)for(let a=0;a<U.length;a++){const o=n<<6|t<<3|a;e.push({index:o,hex:`#${$(U[n])}${$(U[t])}${$(U[a])}`,rLevel:n,gLevel:t,bLevel:a})}return e})(),q=e=>{let n=0,t=1/0;return U.forEach((a,o)=>{const i=Math.abs(a-e);i<t&&(t=i,n=o)}),n},he=e=>!e||!e.startsWith("#")||e.length!==7?"#000000":e.toUpperCase(),Te=e=>{const n=he(e),t=parseInt(n.slice(1,3),16),a=parseInt(n.slice(3,5),16),o=parseInt(n.slice(5,7),16),i=q(t),r=q(a),c=q(o),s=`#${$(U[i])}${$(U[r])}${$(U[c])}`,l=i<<6|r<<3|c;return{hex:s,masterIndex:l}},yt=z.map((e,n)=>{if(n===0)return{slotIndex:0,masterIndex:-1,hex:"rgba(0,0,0,0)"};const t=Te(e.hex);return{slotIndex:n,masterIndex:t.masterIndex,hex:t.hex}}),bt=[8,16,24,32],Rt=16,Dt=16,Ot=16,x=32,W=24,j=8,w=255,Mt="SCREEN 2 (Graphics I)",Ft=["ADC","ADD","AND","BIT","CALL","CCF","CP","CPD","CPDR","CPI","CPIR","CPL","DAA","DEC","DI","DJNZ","EI","EX","EXX","HALT","IM","IN","INC","IND","INDR","INI","INIR","JP","JR","LD","LDD","LDDR","LDI","LDIR","NEG","NOP","OR","OTDR","OTIR","OUT","OUTD","OUTI","POP","PUSH","RES","RET","RETI","RETN","RL","RLA","RLC","RLCA","RLD","RR","RRA","RRC","RRCA","RRD","RST","SBC","SCF","SET","SLA","SLL","SRA","SRL","SUB","XOR"],Ut=["A","F","B","C","D","E","H","L","AF","BC","DE","HL","IXH","IXL","IYH","IYL","IX","IY","SP","PC","I","R","AF'"],vt=["NZ","Z","NC","C","PO","PE","P","M"],Pt=[".ORG","ORG","END",".END",".EQU","EQU",".DB","DB",".BYTE","BYTE","DEFB",".DW","DW",".WORD","WORD","DEFW",".DS","DS",".BLOCK","BLOCK","DEFS",".DEFINE","DEFINE",".MACRO","MACRO",".ENDM","ENDM",".IF","IF",".ENDIF","ENDIF",".ELSE","ELSE",".INCLUDE","INCLUDE",".DEFM","DEFM",".ZILOG",".PHASE",".REPT",".ENDR",".SEARCH",".RANDOM",".ROM",".MEGAROM",".BASIC",".CAS",".WAV",".MSXDOS"],xt=[{id:"pac_man_collection",name:"Pac-Man Tile Collection",code:`; Pac-Man Style Tile Collection System for MSX
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
POWER_MODE:         DB 0       ; Power-up mode active flag`}],wt=[],J=8,V=15,Y=1;var se;const $t=((se=M.find(e=>e.index===V))==null?void 0:se.hex)||M[15].hex;var ce;const kt=((ce=M.find(e=>e.index===Y))==null?void 0:ce.hex)||M[1].hex,X=new Map(M.map(e=>[e.hex,e])),Bt=new Map(M.map(e=>[e.index,e])),Gt=M[1],Ht=32,jt=125,zt=6,Vt=31,Yt=15,Qt=["A","B","C"],Wt=["1","2","3","4","5"],Xt=["C-","C#","D-","D#","E-","F-","F#","G-","G#","A-","A#","B-"],Kt=[0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,7,7,6,6,5,5,4,4,3,3,2,2,1,1,0,0],Zt=32,Jt={q:{noteNameIndex:0,baseOctave:5},w:{noteNameIndex:1,baseOctave:5},e:{noteNameIndex:2,baseOctave:5},r:{noteNameIndex:3,baseOctave:5},t:{noteNameIndex:4,baseOctave:5},y:{noteNameIndex:5,baseOctave:5},u:{noteNameIndex:6,baseOctave:5},i:{noteNameIndex:7,baseOctave:5},o:{noteNameIndex:8,baseOctave:5},p:{noteNameIndex:9,baseOctave:5},"[":{noteNameIndex:10,baseOctave:5},"]":{noteNameIndex:11,baseOctave:5},a:{noteNameIndex:0,baseOctave:4},s:{noteNameIndex:1,baseOctave:4},d:{noteNameIndex:2,baseOctave:4},f:{noteNameIndex:3,baseOctave:4},g:{noteNameIndex:4,baseOctave:4},h:{noteNameIndex:5,baseOctave:4},j:{noteNameIndex:6,baseOctave:4},k:{noteNameIndex:7,baseOctave:4},l:{noteNameIndex:8,baseOctave:4},ñ:{noteNameIndex:9,baseOctave:4},";":{noteNameIndex:9,baseOctave:4},"'":{noteNameIndex:10,baseOctave:4},z:{noteNameIndex:0,baseOctave:3},x:{noteNameIndex:1,baseOctave:3},c:{noteNameIndex:2,baseOctave:3},v:{noteNameIndex:3,baseOctave:3},b:{noteNameIndex:4,baseOctave:3},n:{noteNameIndex:5,baseOctave:3},m:{noteNameIndex:6,baseOctave:3},",":{noteNameIndex:7,baseOctave:3},".":{noteNameIndex:8,baseOctave:3},2:{noteNameIndex:1,baseOctave:5},3:{noteNameIndex:3,baseOctave:5},5:{noteNameIndex:6,baseOctave:5},6:{noteNameIndex:8,baseOctave:5},7:{noteNameIndex:10,baseOctave:5}},qt={min:-2,max:2},fe=[{id:"bank_0",name:"Bank 0 - HUD/Fonts",enabled:!0,vramPatternStart:0,vramColorStart:8192,screenZone:{x:0,y:0,width:x,height:8},charsetRangeStart:0,charsetRangeEnd:255,defaultFgColorIndex:15,defaultBgColorIndex:4,isLocked:!1,assignedTiles:{}},{id:"bank_1",name:"Bank 1 - Game Tileset",enabled:!0,vramPatternStart:2048,vramColorStart:10240,screenZone:{x:0,y:8,width:x,height:8},charsetRangeStart:0,charsetRangeEnd:255,defaultFgColorIndex:2,defaultBgColorIndex:1,isLocked:!1,assignedTiles:{}},{id:"bank_2",name:"Bank 2 - Background/Status",enabled:!0,vramPatternStart:4096,vramColorStart:12288,screenZone:{x:0,y:16,width:x,height:8},charsetRangeStart:0,charsetRangeEnd:255,defaultFgColorIndex:11,defaultBgColorIndex:6,isLocked:!1,assignedTiles:{}}],en={isEnabled:!0,options:[{id:"start",label:"INICIAR PARTIDA",enabled:!0},{id:"continue",label:"CONTINUAR",enabled:!0},{id:"settings",label:"AJUSTES",enabled:!0},{id:"help",label:"AYUDA",enabled:!1}],keyMapping:{up:"ArrowUp",down:"ArrowDown",left:"ArrowLeft",right:"ArrowRight",fire1:" ",fire2:"m"},settings:{volume:12},continueScreen:{title:"CONTINUAR PARTIDA",prompt:"INTRODUCE TU CODIGO"},introScreen:{text:`EN EL ANO 2084, LA CORPORACION CYBERNETICA DOMINA EL MUNDO...

SOLO UN HEROE PUEDE DETENERLOS.`,backgroundAssetId:null},menuScreenAssetId:null,cursorSpriteAssetId:null,menuColors:{text:M[15].hex,background:M[4].hex,highlightText:M[11].hex,highlightBackground:M[5].hex,border:M[15].hex}},tn=ue,nn="HELP_DOCS_SYSTEM_ASSET",an=50,ee=[{name:"Goal",asmName:"global_var_goal",constantPrefix:"GOAL_",type:"byte",description:"Current objective status",category:"objective",values:[{label:"Failure",value:0,asmConstant:"GOAL_FAILURE"},{label:"Completed",value:1,asmConstant:"GOAL_COMPLETED"},{label:"Partial",value:2,asmConstant:"GOAL_PARTIAL"}]},{name:"MissionStatus",asmName:"global_var_mission_status",constantPrefix:"MISSION_",type:"byte",description:"Current mission state",category:"objective",values:[{label:"NotStarted",value:0,asmConstant:"MISSION_NOT_STARTED"},{label:"Active",value:1,asmConstant:"MISSION_ACTIVE"},{label:"Completed",value:2,asmConstant:"MISSION_COMPLETED"},{label:"Failed",value:3,asmConstant:"MISSION_FAILED"}]},{name:"LevelCompleted",asmName:"global_var_level_completed",constantPrefix:"BOOL_",type:"byte",description:"Level completion flag",category:"objective",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"BossDefeated",asmName:"global_var_boss_defeated",constantPrefix:"BOOL_",type:"byte",description:"Boss defeated flag",category:"objective",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"AllItemsCollected",asmName:"global_var_all_items_collected",constantPrefix:"BOOL_",type:"byte",description:"All items collected flag",category:"objective",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"Score",asmName:"global_var_score",constantPrefix:"SCORE_",type:"word",description:"Current player score (0-65535)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"HiScore",asmName:"global_var_hi_score",constantPrefix:"HISCORE_",type:"word",description:"High score record (0-65535)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"ComboMultiplier",asmName:"global_var_combo_multiplier",constantPrefix:"COMBO_",type:"byte",description:"Combo multiplier (1x, 2x, 3x...)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"Coins",asmName:"global_var_coins",constantPrefix:"COINS_",type:"byte",description:"Coins collected (0-255)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"Gems",asmName:"global_var_gems",constantPrefix:"GEMS_",type:"byte",description:"Gems collected (0-255)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"Lives",asmName:"global_var_lives",constantPrefix:"LIVES_",type:"byte",description:"Remaining lives (0-255)",category:"player",values:[{label:"Custom Value",value:"number"}]},{name:"Health",asmName:"global_var_health",constantPrefix:"HEALTH_",type:"byte",description:"Current health (0-255)",category:"player",values:[{label:"Custom Value",value:"number"}]},{name:"Energy",asmName:"global_var_energy",constantPrefix:"ENERGY_",type:"byte",description:"Current energy/mana (0-255)",category:"player",values:[{label:"Custom Value",value:"number"}]},{name:"Shield",asmName:"global_var_shield",constantPrefix:"BOOL_",type:"byte",description:"Shield active flag",category:"player",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"HasKey",asmName:"global_var_has_key",constantPrefix:"BOOL_",type:"byte",description:"Has key item",category:"inventory",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"HasSword",asmName:"global_var_has_sword",constantPrefix:"BOOL_",type:"byte",description:"Has sword item",category:"inventory",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"HasMap",asmName:"global_var_has_map",constantPrefix:"BOOL_",type:"byte",description:"Has map item",category:"inventory",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"ItemCount",asmName:"global_var_item_count",constantPrefix:"ITEMS_",type:"byte",description:"Special items collected (0-255)",category:"inventory",values:[{label:"Custom Value",value:"number"}]},{name:"PowerUpActive",asmName:"global_var_powerup_active",constantPrefix:"POWERUP_",type:"byte",description:"Active power-up type",category:"inventory",values:[{label:"None",value:0,asmConstant:"POWERUP_NONE"},{label:"Speed",value:1,asmConstant:"POWERUP_SPEED"},{label:"Jump",value:2,asmConstant:"POWERUP_JUMP"},{label:"Invincible",value:3,asmConstant:"POWERUP_INVINCIBLE"}]},{name:"CurrentWorld",asmName:"global_var_current_world",constantPrefix:"WORLD_",type:"byte",description:"Current world number (1-8)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"CurrentLevel",asmName:"global_var_current_level",constantPrefix:"LEVEL_",type:"byte",description:"Current level number (0-255)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"CheckpointReached",asmName:"global_var_checkpoint",constantPrefix:"CHECKPOINT_",type:"byte",description:"Checkpoint reached (0-255)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"SecretFound",asmName:"global_var_secret_found",constantPrefix:"BOOL_",type:"byte",description:"Secret area found flag",category:"progress",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"DoorsUnlocked",asmName:"global_var_doors_unlocked",constantPrefix:"DOORS_",type:"byte",description:"Doors unlocked bitmask (0-255)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"TimeRemaining",asmName:"global_var_time_remaining",constantPrefix:"TIME_",type:"word",description:"Time remaining in seconds (0-65535)",category:"time",values:[{label:"Custom Value",value:"number"}]},{name:"TimeLimitActive",asmName:"global_var_time_limit_active",constantPrefix:"BOOL_",type:"byte",description:"Time limit active flag",category:"time",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"DayNightCycle",asmName:"global_var_day_night_cycle",constantPrefix:"TIME_",type:"byte",description:"Day/night cycle state (0-23)",category:"time",values:[{label:"Custom Value",value:"number"}]},{name:"DifficultyLevel",asmName:"global_var_difficulty",constantPrefix:"DIFFICULTY_",type:"byte",description:"Game difficulty level",category:"difficulty",values:[{label:"Easy",value:0,asmConstant:"DIFFICULTY_EASY"},{label:"Normal",value:1,asmConstant:"DIFFICULTY_NORMAL"},{label:"Hard",value:2,asmConstant:"DIFFICULTY_HARD"},{label:"Expert",value:3,asmConstant:"DIFFICULTY_EXPERT"}]},{name:"EnemiesDefeated",asmName:"global_var_enemies_defeated",constantPrefix:"ENEMIES_",type:"word",description:"Enemies defeated count (0-65535)",category:"special",values:[{label:"Custom Value",value:"number"}]},{name:"PerfectRun",asmName:"global_var_perfect_run",constantPrefix:"BOOL_",type:"byte",description:"Perfect run (no damage) flag",category:"special",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]}],O=8,ge=e=>{let n=e.toString(16).toUpperCase();return n.length===1&&(n="0"+n),n},on=(e,n,t)=>{var _,m;if(!e.lineAttributes)return`;; ERROR: Tile ${n} is missing line attributes required for SCREEN 2 export.
`;const a=n.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let o=`;; Tile: ${n} (${e.width}x${e.height})
`;o+=`;; Structure: ${e.width/O}x${e.height/O} character blocks (8x8 pixels each)
`,o+=`;; Data format: ${t.toUpperCase()}

`;const i=e.width/O,r=e.height/O,c=p=>t==="hex"?`$${ge(p)}`:p.toString(10),s=[],l=[];for(let p=0;p<r;p++)for(let u=0;u<i;u++){const E=`;; Character Block (${u}, ${p}) for ${a}`,S=[];for(let g=0;g<O;g++){const d=p*O+g;let f=0;if(e.lineAttributes[d]&&e.lineAttributes[d][u]){const h=e.lineAttributes[d][u].fg;for(let C=0;C<O;C++){const L=u*O+C;e.data[d]&&e.data[d][L]!==void 0&&e.data[d][L]===h&&(f|=1<<7-C)}}S.push(f)}const I=S.map(c).join(",");s.push({comment:`${E} - PATTERN Data (8 bytes):`,dataString:`DB ${I}`});const T=[];for(let g=0;g<O;g++){const d=p*O+g;let f=V<<4|Y;if(e.lineAttributes[d]&&e.lineAttributes[d][u]){const h=e.lineAttributes[d][u],C=((_=X.get(h.fg))==null?void 0:_.index)??V,L=((m=X.get(h.bg))==null?void 0:m.index)??Y;f=C<<4|L}T.push(f)}const A=T.map(c).join(",");l.push({comment:`${E} - COLOR Attribute Data (8 bytes - FG|BG):`,dataString:`DB ${A}`})}return o+=`;; --- PATTERN DATA ---
`,s.length>0?(o+=`${a}_PATTERN_DATA:
`,s.forEach(p=>{o+=`${p.comment}
`,o+=`    ${p.dataString}
`})):o+=`;; No pattern data generated.
`,o+=`
`,o+=`;; --- COLOR ATTRIBUTE DATA ---
`,l.length>0?(o+=`${a}_COLOR_DATA:
`,l.forEach(p=>{o+=`${p.comment}
`,o+=`    ${p.dataString}
`})):o+=`;; No color attribute data generated.
`,o+=`
;; End of Tile Data for ${a}
`,o},rn=(e,n,t,a)=>{const o=Math.max(1,e/J);return Array(n).fill(null).map(()=>Array(o).fill(null).map(()=>({fg:t,bg:a})))},Se=(e,n)=>{var r,c,s,l;const t=[],a=e.width/O,o=e.height/O,i=n==="SCREEN 2 (Graphics I)";for(let _=0;_<o;_++)for(let m=0;m<a;m++)for(let p=0;p<O;p++){const u=_*O+p;let E=0,S;i&&e.lineAttributes&&e.lineAttributes[u]&&e.lineAttributes[u][m]&&(S=e.lineAttributes[u][m].fg);for(let I=0;I<O;I++){const T=m*O+I,A=(r=e.data[u])==null?void 0:r[T];if(A!==void 0){let g=!1;i&&S?g=A===S:i||(g=A!==z[0].hex&&A!==((l=(s=(c=e.lineAttributes)==null?void 0:c[0])==null?void 0:s[0])==null?void 0:l.bg)),g&&(E|=1<<7-I)}}t.push(E)}return new Uint8Array(t)},k=(e,n)=>{var i,r;const t=e.length;if(t===0)return[];const a=((i=e[0])==null?void 0:i.length)||0;if(a===0)return[[]];const o=e.map(c=>[...c]);for(let c=0;c<t;c++)for(let s=0;s<a;s++){const l=Math.floor(s/J),_=(r=n[c])==null?void 0:r[l],m=o[c][s];_&&m!==_.fg&&m!==_.bg&&(o[c][s]=_.fg)}return o},ln=(e,n,t)=>{if(e.length<2)return e;const o=e.slice(1);return o.push([...e[0]]),t==="SCREEN 2 (Graphics I)"&&n?k(o,n):o},sn=(e,n,t)=>{const a=e.length;if(a<2)return e;const o=e.slice(0,a-1);return o.unshift([...e[a-1]]),t==="SCREEN 2 (Graphics I)"&&n?k(o,n):o},cn=(e,n,t)=>{if(e.length===0)return[];const a=e.map(o=>{if(o.length<2)return[...o];const i=o.slice(1);return i.push(o[0]),i});return t==="SCREEN 2 (Graphics I)"&&n?k(a,n):a},dn=(e,n,t)=>{if(e.length===0)return[];const a=e.map(o=>{const i=o.length;if(i<2)return[...o];const r=o.slice(0,i-1);return r.unshift(o[i-1]),r});return t==="SCREEN 2 (Graphics I)"&&n?k(a,n):a},_n=(e,n,t)=>{if(e.length===0)return[];const a=e.map(o=>[...o].reverse());return t==="SCREEN 2 (Graphics I)"&&n?k(a,n):a},pn=(e,n,t)=>{if(e.length===0)return[];const a=[...e].reverse();return t==="SCREEN 2 (Graphics I)"&&n?k(a,n):a},Ae=e=>{var o,i,r;if(!e.lineAttributes)return null;const n=[],t=e.width/O,a=e.height/O;for(let c=0;c<a;c++)for(let s=0;s<t;s++)for(let l=0;l<O;l++){const _=c*O+l;let m=V<<4|Y;const p=(o=e.lineAttributes[_])==null?void 0:o[s];if(p){const u=((i=X.get(p.fg))==null?void 0:i.index)??V,E=((r=X.get(p.bg))==null?void 0:r.index)??Y;m=u<<4|E}n.push(m)}return new Uint8Array(n)},mn=e=>{const n=[];e.frames.forEach(a=>{var o;for(let i=0;i<e.spritePalette.length;i++){const r=e.spritePalette[i];if(r===e.backgroundColor)continue;let c=!1;const s=[];for(let l=0;l<e.size.height;l++)for(let _=0;_<Math.ceil(e.size.width/8);_++){let m=0;for(let p=0;p<8;p++){const u=_*8+p;u<e.size.width&&((o=a.data[l])==null?void 0:o[u])===r&&(m|=1<<7-p,c=!0)}s.push(m)}c&&n.push(s)}});const t=n.flat();return new Uint8Array(t)},un=e=>e.map(n=>[...n].reverse()),En=e=>[...e].reverse(),Ce=e=>{let n=e.toString(16).toUpperCase();return n.length===1&&(n="0"+n),n},Ie=(e,n,t,a,o,i,r="hex")=>{var m,p;const s=e.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let l=`;; ---- Sprite Frame: ${e} ----
`;l+=`;; Size: ${o}x${i}
`;let _=0;for(let u=0;u<t.length;u++){const E=t[u];let S=!1;if(E!==a)for(let T=0;T<i;T++){for(let A=0;A<o;A++)if(((m=n[T])==null?void 0:m[A])===E){S=!0;break}if(S)break}if(!S){l+=`;; Layer ${u} (Color: ${E}) - SKIPPED (color not used or is background)
`;continue}_++,l+=`${s}_LAYER${u}: ; Brush Color Index ${u} (Actual Color: ${E})
`;const I=[];o%8!==0&&(l+=`;; WARNING: Sprite width ${o} is not a multiple of 8. Bitmask generation might be problematic for standard VDP.
`);for(let T=0;T<i;T++)for(let A=0;A<Math.ceil(o/8);A++){let g=0;for(let d=0;d<8;d++){const f=A*8+d;f<o&&((p=n[T])==null?void 0:p[f])===E&&(g|=1<<7-d)}I.push(g)}for(let T=0;T<I.length;T+=16){const g=I.slice(T,T+16).map(d=>r==="hex"?`#${Ce(d)}`:d.toString());l+=`    DB ${g.join(",")}
`}l+=`
`}return _===0&&(l+=`;; NO ACTIVE LAYERS EXPORTED for ${e} - Frame might be empty or only contain the background color.
`),l+=`;; ---- End of Frame: ${e} ----

`,l},hn=(e,n="hex")=>{let t=`;; Sprite: ${e.name}
`;t+=`;; Total Frames: ${e.frames.length}
`,t+=`;; Size: ${e.size.width}x${e.size.height}
`,t+=`;; Background Color (not exported as a layer): ${e.backgroundColor}
`,t+=`;; Drawable Palette (Hex): C0=${e.spritePalette[0]}, C1=${e.spritePalette[1]}, C2=${e.spritePalette[2]}, C3=${e.spritePalette[3]}

`;const a=e.name.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();return t+=`SPRITE_${a}_WIDTH     EQU ${e.size.width}
`,t+=`SPRITE_${a}_HEIGHT    EQU ${e.size.height}
`,t+=`SPRITE_${a}_FRAMES    EQU ${e.frames.length}

`,e.frames.forEach((o,i)=>{t+=Ie(`${e.name}_F${i}`,o.data,e.spritePalette,e.backgroundColor,e.size.width,e.size.height,n)}),t},te=16,de="SCREEN 2 (Graphics I)",Ne="SCREEN 5 (Graphics III)",P=8,Le={pixelWidth:x*te,pixelHeight:W*te,widthTiles:x,heightTiles:W,baseTileSize:te},oe={[de]:{pixelWidth:x*j,pixelHeight:W*j,widthTiles:x,heightTiles:W,baseTileSize:j},[Ne]:{pixelWidth:256,pixelHeight:212,widthTiles:32,heightTiles:27,baseTileSize:j},"SCREEN 0 (Text 40)":{pixelWidth:240,pixelHeight:192,widthTiles:40,heightTiles:24,baseTileSize:P},"SCREEN 1 (Text 32)":{pixelWidth:256,pixelHeight:192,widthTiles:32,heightTiles:24,baseTileSize:P},"SCREEN 3 (Multicolor)":{pixelWidth:256,pixelHeight:192,widthTiles:32,heightTiles:24,baseTileSize:P},"SCREEN 4 (Graphics II)":{pixelWidth:256,pixelHeight:192,widthTiles:32,heightTiles:24,baseTileSize:P},"SCREEN 6 (Graphics IV)":{pixelWidth:512,pixelHeight:212,widthTiles:64,heightTiles:27,baseTileSize:P},"SCREEN 7 (Graphics V)":{pixelWidth:512,pixelHeight:212,widthTiles:64,heightTiles:27,baseTileSize:P},"SCREEN 8 (Graphics VI)":{pixelWidth:256,pixelHeight:212,widthTiles:32,heightTiles:27,baseTileSize:P}};function Tn(e){const n=typeof e=="string"?e.trim():"";return n&&oe[n]?oe[n]:Le}const K=e=>e===de,ye=e=>K(e)?M:z,be=(e,n)=>{const t=ye(n);if(e===void 0||e<0||e>=t.length)return K(n)?M[1].hex:z[4].hex;const a=t[e];return(a==null?void 0:a.hex)??(K(n)?M[1].hex:z[4].hex)},Re=(e,n,t,a)=>{var p;const o=e.layers.background,i=e.activeAreaX??0,r=e.activeAreaY??0,c=e.activeAreaWidth??e.width,s=e.activeAreaHeight??e.height,l=[];let _=0;const m=new Map;for(let u=0;u<s;u++){const E=r+u;for(let S=0;S<c;S++){const I=i+S;if(E>=o.length||I>=((p=o[E])==null?void 0:p.length)){l.push(w);continue}const T=o[E][I];if(!T||!T.tileId)l.push(w);else{let A=w;const g=n.find(d=>d.id===T.tileId);if(a==="SCREEN 2 (Graphics I)"&&t&&g){let d=!1,f={tileId:T.tileId,position:{x:I,y:E},attempts:[],banksReceived:t.length};typeof globalThis.screenUtils_firstTileLogged>"u"&&(console.log("🔍 First tile structure check:",{tileId:T.tileId,position:{x:I,y:E},banksCount:t.length,banks:t.map(h=>({name:h.name,assignedTileIds:Object.keys(h.assignedTiles||{}),hasThisTile:!!(h.assignedTiles&&h.assignedTiles[T.tileId]),assignedTilesType:typeof h.assignedTiles,assignedTilesSample:h.assignedTiles?Object.entries(h.assignedTiles).slice(0,2):[]}))}),globalThis.screenUtils_firstTileLogged=!0);for(const h of t)if((h.enabled??!0)&&h.assignedTiles[T.tileId]){const C=h.assignedTiles[T.tileId].charCode,L=Math.ceil(g.width/j),y=T.subTileX||0,R=T.subTileY||0;A=C+R*L+y;const D=A>=h.charsetRangeStart&&A<=h.charsetRangeEnd;if(f.attempts.push({bankName:h.name,baseCharCode:C,calculated:A,range:`${h.charsetRangeStart}-${h.charsetRangeEnd}`,inRange:D}),D){d=!0;break}else A=w}else f.attempts.push({bankName:h.name,reason:"Tile not assigned to this bank"});d||(console.warn("⚠️ Tile not found in valid range:",f),A=w)}else if(a!=="SCREEN 2 (Graphics I)"){const d=`${T.tileId}_${T.subTileX??0}_${T.subTileY??0}`;m.has(d)?A=m.get(d):_>255?A=w:(m.set(d,_),A=_++)}l.push(A)}}}return new Uint8Array(l)},De=(e,n,t,a,o,i="hex")=>{const c=e.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let s=`;; MAP: ${e} (${n}x${t} tiles)
`;s+=`;; Total size: ${a.length} bytes

`,o.length>0&&(s+=`;; --- TILE INDEX REFERENCES for ${c} ---
`,s+=o.join(`
`)+`

`),s+=`SCREEN_${c}_WIDTH     EQU ${n}
`,s+=`SCREEN_${c}_HEIGHT    EQU ${t}
`,s+=`SCREEN_${c}_SIZE      EQU ${a.length}

`,s+=`SCREEN_${c}_LAYOUT:
`;for(let l=0;l<a.length;l+=16){const m=a.slice(l,l+16).map(p=>i==="hex"?`#${p.toString(16).padStart(2,"0").toUpperCase()}`:p.toString());s+=`    DB ${m.join(",")}
`}return s},Oe=(e,n,t,a,o="hex")=>{const r=e.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let c=`;; BEHAVIOR MAP: ${e} (${n}x${t} tiles)
`;c+=`;; Total size: ${a.length} bytes (Map IDs 0-255)
`,c+=`;; Data format: ${o.toUpperCase()}

`,c+=`BEHAVIOR_${r}_WIDTH     EQU ${n}
`,c+=`BEHAVIOR_${r}_HEIGHT    EQU ${t}
`,c+=`BEHAVIOR_${r}_SIZE      EQU ${a.length}

`,c+=`BEHAVIOR_${r}_DATA:
`;const s=l=>o==="hex"?`#${l.toString(16).padStart(2,"0").toUpperCase()}`:l.toString(10);for(let l=0;l<a.length;l+=16){const m=a.slice(l,l+16).map(s);c+=`    DB ${m.join(",")}
`}return c+=`
;; End of Behavior Map Data for ${e}
`,c},fn=(e,n)=>{var o,i;const t=[],a=e.layers.collision;for(let r=0;r<(e.activeAreaHeight??e.height);r++){const c=(e.activeAreaY??0)+r;for(let s=0;s<(e.activeAreaWidth??e.width);s++){const l=(e.activeAreaX??0)+s,_=(o=a[c])==null?void 0:o[l];if(_!=null&&_.tileId){const m=n.find(p=>p.id===_.tileId);t.push(((i=m==null?void 0:m.logicalProperties)==null?void 0:i.mapId)??0)}else t.push(0)}}return t},gn=(e,n)=>{if(e.width!==n.width||e.height!==n.height||e.data.length!==n.data.length)return!1;for(let t=0;t<e.height;t++){if(e.data[t].length!==n.data[t].length)return!1;for(let a=0;a<e.width;a++)if(e.data[t][a]!==n.data[t][a])return!1}if(e.lineAttributes&&n.lineAttributes){if(e.lineAttributes.length!==n.lineAttributes.length)return!1;for(let t=0;t<e.lineAttributes.length;t++){if(e.lineAttributes[t].length!==n.lineAttributes[t].length)return!1;for(let a=0;a<e.lineAttributes[t].length;a++)if(e.lineAttributes[t][a].fg!==n.lineAttributes[t][a].fg||e.lineAttributes[t][a].bg!==n.lineAttributes[t][a].bg)return!1}}else if(e.lineAttributes!==n.lineAttributes)return!1;return JSON.stringify(e.logicalProperties)===JSON.stringify(n.logicalProperties)};function Sn(e,n,t,a,o,i,r){const{data:c,width:s,height:l,lineAttributes:_}=e;if(!c||l===0||s===0)return"";const m=document.createElement("canvas");m.width=i,m.height=i;const p=m.getContext("2d");if(!p)return"";p.imageSmoothingEnabled=!1;const u=(n??0)*i,E=(t??0)*i;for(let T=0;T<i;T++)for(let A=0;A<i;A++){const g=u+A,d=E+T;if(d>=0&&d<l&&g>=0&&g<s){let f=c[d][g];if(r==="SCREEN 2 (Graphics I)"&&_&&_[d]){const h=Math.floor(g/J),C=_[d][h];C&&f!==C.fg&&f!==C.bg&&(f=C.fg)}p.fillStyle=f,p.fillRect(A,T,1,1)}}if(m.width===a&&m.height===o)return m.toDataURL();const S=document.createElement("canvas");S.width=a,S.height=o;const I=S.getContext("2d");return I?(I.imageSmoothingEnabled=!1,I.drawImage(m,0,0,a,o),S.toDataURL()):m.toDataURL()}function An(e,n,t){var i;if(!e||t===0||n===0)return"";const a=document.createElement("canvas");a.width=n,a.height=t;const o=a.getContext("2d");if(!o)return"";o.imageSmoothingEnabled=!1;for(let r=0;r<t;r++)for(let c=0;c<n;c++){const s=(i=e[r])==null?void 0:i[c];s&&s!=="rgba(0,0,0,0)"&&(o.fillStyle=s,o.fillRect(c,r,1,1))}return a.toDataURL()}const Cn=(e,n,t,a,o,i,r)=>{var m,p;const c=K(a);e.width=n.width*o,e.height=n.height*o;const s=e.getContext("2d");if(!s)return;s.imageSmoothingEnabled=!1;const l=be(n.backgroundColor,a);s.fillStyle=l,s.fillRect(0,0,e.width,e.height);const _=n.layers.background;for(let u=0;u<n.height;u++)for(let E=0;E<n.width;E++){const S=(m=_[u])==null?void 0:m[E];if(!(S!=null&&S.tileId))continue;const I=t.find(y=>y.id===S.tileId);if(!I)continue;const{data:T,width:A,height:g,lineAttributes:d}=I;if(!T)continue;const f=S.subTileX??0,h=S.subTileY??0,C=f*o,L=h*o;for(let y=0;y<o;y++)for(let R=0;R<o;R++){const D=C+R,N=L+y;if(N<g&&D<A){let b=(p=T[N])==null?void 0:p[D];if(b===void 0)continue;if(c&&d&&d[N]){const F=Math.floor(D/J),v=d[N][F];v&&b!==v.fg&&b!==v.bg&&(b=v.fg)}s.fillStyle=b,s.fillRect(E*o+R,u*o+y,1,1)}}}};function Me(e){const n=e.find(r=>r.type==="globalvariables");if(!n||!n.data)return[...ee];const t=n.data.customVariables||[],a=new Map;ee.forEach(r=>{a.set(r.name,r)}),t.forEach(r=>{a.set(r.name,r)});const o=ee.map(r=>r.name),i=[];return o.forEach(r=>{const c=a.get(r);c&&(i.push(c),a.delete(r))}),a.forEach(r=>{i.push(r)}),i}function In(e){const n=e.find(a=>a.type==="globalvariables");return!n||!n.data?[]:n.data.customVariables||[]}function Fe(e){const n=Me(e);if(n.length===0)return[];const t=[];e.filter(l=>l.type==="screenmap").forEach(l=>{var m,p;(((p=(m=l.data)==null?void 0:m.layers)==null?void 0:p.entities)||[]).forEach(u=>{var E,S;(S=(E=u.components)==null?void 0:E.Behavior)!=null&&S.behaviorCode&&t.push(u.components.Behavior.behaviorCode)})});const o=e.find(l=>l.type==="gameflow"),i=new Set;if(o!=null&&o.data){const l=o.data;l.nodes&&Array.isArray(l.nodes)&&l.nodes.forEach(_=>{var m,p;_.type==="StateMachine"&&((m=_.data)!=null&&m.customCode)&&t.push(_.data.customCode),_.type==="IfThenElse"&&((p=_.data)!=null&&p.variableName)&&i.add(_.data.variableName)})}e.filter(l=>l.type==="componentdefinition").forEach(l=>{const _=l.data;_.customCode&&t.push(_.customCode)});const c=[],s=new Set;return n.forEach(l=>{const _=t.some(p=>new RegExp(`\\b${l.asmName}\\b`,"i").test(p)),m=i.has(l.name);(_||m)&&!s.has(l.name)&&(c.push(l),s.add(l.name))}),c}function ae(e,n){const t=n.filter(d=>d.type==="componentdefinition").map(d=>d.data),a=n.filter(d=>d.type==="entitytemplate").map(d=>d.data),o=n.filter(d=>d.type==="sprite").map(d=>d.data),i=n.filter(d=>d.type==="tile").map(d=>d.data),r=n.filter(d=>d.type==="screenmap").map(d=>d.data),c=n.filter(d=>d.type==="worldmap").map(d=>d.data),s=[];r.forEach(d=>{var f;(f=d.layers)!=null&&f.entities&&Array.isArray(d.layers.entities)&&s.push(...d.layers.entities),d.entities&&Array.isArray(d.entities)&&s.push(...d.entities)});const l=n.find(d=>d.type==="gameflow"),_=l==null?void 0:l.data,m=s.length>0,p=t.length>0||m,u=r.length>1,E=o.length>0,S=o.some(d=>d.frames.length>1),I=r.some(d=>d.layers.collision.some(f=>f.some(h=>h!==null))),T=a.some(d=>d.name.toLowerCase().includes("menu")),A=[];t.forEach(d=>{d.name.toLowerCase().includes("state")&&A.push(d.name.replace(/[^a-zA-Z0-9]/g,"").toUpperCase())});const g=Fe(n);return{projectName:e,components:t,templates:a,sprites:o,tiles:i,screenMaps:r,worldmaps:c,entities:s,gameFlow:_,hasECS:p,hasMultipleScreens:u,hasSprites:E,hasAnimations:S,hasCollisions:I,hasMenuSystem:T,customStates:A,globalVariables:g}}const Ue=e=>{if(!e.hasECS)return`    ; No ECS system - basic entity updates
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
    RET`,n},ve=e=>{if(!e.hasSprites)return`    ; No sprites to update
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
    RET`,n},Pe=e=>e.hasCollisions?`    ; Check player collision with environment
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
    RET`,xe=e=>{let n=`    ; Read MSX joystick/keyboard input
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
    RET`,n},we=e=>e.hasMenuSystem?`    ; Update menu graphics and cursor
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
    RET`,$e=e=>{if(e.customStates.length===0)return"; No custom states detected";let n=`; Custom state handlers for project-specific logic
`;return e.customStates.forEach(t=>{n+=`
logic_${t.toLowerCase()}:
    ; Custom logic for ${t} state
    ; TODO: Implement ${t} specific logic
    RET
`}),n},ke=[{marker:"{{ENTITY_UPDATES}}",generator:Ue,description:"Entity update system based on ECS components"},{marker:"{{SPRITE_UPDATES}}",generator:ve,description:"Sprite animation and movement updates"},{marker:"{{COLLISION_CHECK}}",generator:Pe,description:"Collision detection system"},{marker:"{{INPUT_HANDLING}}",generator:xe,description:"Input handling with project-specific controls"},{marker:"{{MENU_SYSTEM}}",generator:we,description:"Menu system updates and rendering"},{marker:"{{CUSTOM_STATES}}",generator:$e,description:"Custom state handlers detected from project"}];function Be(e,n,t,a=ke){const o=ae(n,t);let i=e;return i=i.replace(/{{PROJECT_NAME}}/g,n.toUpperCase()),i=i.replace(/{{PROJECT_NAME_LOWER}}/g,n.toLowerCase()),i=i.replace(/{{GENERATION_DATE}}/g,new Date().toISOString()),a.forEach(r=>{if(i.includes(r.marker)){const c=r.generator(o);i=i.replace(new RegExp(He(r.marker),"g"),c)}}),i}function Ge(){return`;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
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
`}function He(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function Nn(e,n){const t=Ge(),a=Be(t,e,n),i=`${e.toLowerCase().replace(/[^a-z0-9]/g,"_")}_dynamic_system.asm`,r=ae(e,n);return{filename:i,content:a,analysis:r}}function je(){return`; ==================================================================
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
; END OF BIOS DEFINITIONS
; ==================================================================
`}function ze(e){let n="";if(!e.globalVariables||e.globalVariables.length===0)return n+=`; Goal Variable Values (default)
`,n+=`GOAL_FAILURE            EQU 0    ; Goal = "Failure"
`,n+=`GOAL_COMPLETED          EQU 1    ; Goal = "Completed"
`,n;const t=new Set;return e.globalVariables.forEach(a=>{a.values&&a.values.length>0&&(n+=`
; ${a.name} - ${a.description||"Variable values"}
`,a.values.forEach(o=>{const i=(o.asmConstant||"UNKNOWN").trim(),r=typeof o.value=="number"?o.value:0;t.has(i)||(n+=`${i.padEnd(24)}EQU ${r}    ; ${a.name} = "${o.label}"
`,t.add(i))}))}),n}function Ve(e){var n,t,a;return`; ==================================================================
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
; MIDEAS GLOBAL VARIABLES - CONSTANTS FOR VALUES
; ==================================================================

${ze(e)}

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
`}function Ye(e){var a;let n=`; ==================================================================
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
`,t++,n+=`
; ==================================================================
; MIDEAS GLOBAL VARIABLES (DEFAULTS + CUSTOM)
; ==================================================================
`,e.globalVariables&&e.globalVariables.length>0?e.globalVariables.forEach(o=>{const i=o.type==="16bit"?2:1,r=o.type==="16bit"?" (16-bit)":" (8-bit)",c=o.description||o.name;n+=`${o.asmName.padEnd(20)} EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; ${c}${r}
`,t+=i}):(n+=`global_var_goal     EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Goal status (0=Failure, 1=Completed)
`,t++),n+=`
; ==================================================================
; FRAME COUNTER
; ==================================================================
`,n+=`frame_counter       EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Frame counter (16-bit)
`,t+=2,e.sprites.length>0){n+=`
; ==================================================================
; SPRITE SYSTEM VARIABLES (${e.sprites.length} sprites detected)
; ==================================================================
`,n+=`active_sprite_count EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Number of sprites currently active
`,t++;const o=((a=e.sprites)==null?void 0:a.length)||1;n+=`sprite_x_pos        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Sprite X positions (${o} bytes)
`,t+=o,n+=`sprite_y_pos        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Sprite Y positions (${o} bytes)
`,t+=o,n+=`sprite_pattern      EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Sprite pattern IDs (${o} bytes)
`,t+=o,n+=`sprite_color        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Sprite colors (${o} bytes)
`,t+=o,n+=`sprite_attributes   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Interleaved sprite attributes (${o*4} bytes)
`,t+=o*4}return e.screenMaps.length>0&&(n+=`
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
`,t++,n+=`temp_byte_3         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,n+=`temp_byte_4         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,n+=`temp_byte_5         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,n+=`temp_byte_6         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,n+=`temp_byte_7         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,n+=`temp_word_3         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 16-bit storage (64 bytes)
`,t+=64,n+=`temp_word_4         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 16-bit storage (64 bytes)
`,t+=64,n+=`
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
`,n}function B(e){return e.toLowerCase()}function Qe(e,n){var t;if(!e)return`
    ; No connected node - fallback to generic main program
    jp main_program`;switch(e.type){case"WorldLink":const a=e.worldAssetId,o=(t=n.screenMaps)==null?void 0:t.find(c=>c.id===a);return`
    ; GameFlow: Start → WorldLink (${(o==null?void 0:o.name)||"World"})
    ; Initialize game world directly from GameFlow
    call init_sprites
    call init_components
    call init_entities
    call ${B("load_world_"+a)}

    ; CRITICAL: Set game flow state and update sprites to VRAM
    ld a, FLOW_STATE_GAME
    ld (current_flow_state), a
    call update_sprites_to_vram   ; Copy sprite attributes to VRAM

    jp main_loop  ; Jump to main game loop`;case"SubMenu":const i=e;return`
    ; GameFlow: Start → SubMenu ("${i.title||"Menu"}")
    ; Show main menu from GameFlow
    call init_font_system
    call ${B("show_menu_"+i.id)}
    jp menu_loop  ; Jump to menu loop`;case"Text":const r=e;return`
    ; GameFlow: Start → Text ("${r.title||"Text"}")
    ; Show intro text from GameFlow
    call init_font_system
    call ${B("show_text_"+r.id)}
    jp main_program`;case"Transition":return`
    ; GameFlow: Start → Transition (${e.effect||"default"})
    ; Show transition effect from GameFlow
    call init_sprites
    call ${B("transition_effect_"+e.id)}
    jp main_program`;case"Group":return`
    ; GameFlow: Start → Group (nested GameFlow)
    ; Load nested GameFlow: ${e.gameFlowAssetId||"Unknown"}
    call ${B("init_gameflow_"+(e.gameFlowAssetId||"default"))}
    jp main_program`;default:return`
    ; GameFlow: Start → ${e.type} (not yet supported in ASM generator)
    ; Fallback to generic main program
    jp main_program`}}function We(e,n){var o;let t="",a=`
    ; Jump to main program
    jp main_program`;if(n!=null&&n.gameFlow){const i=n.gameFlow;t=`
; GameFlow Integration: Using "${i.name}" as initialization flow`;const r=i.nodes.find(c=>c.type==="Start");if(r){const c=i.connections.find(s=>{var l;return((l=s.from)==null?void 0:l.nodeId)===r.id||typeof s.from=="string"&&s.from===r.id});if(c){const s=((o=c.to)==null?void 0:o.nodeId)||c.to,l=i.nodes.find(_=>_.id===s);l&&(t+=`
; Flow: Start → ${l.type} (${l.title||l.name||l.id})`,a=Qe(l,n))}}}return`; ==================================================================
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

    ; NOTE: Background/border colors are now set by each load_screen_X function
    ; This allows each screen to have its own colors via ScreenMap.backgroundColor/borderColor

    ld a,2      ; Change screen mode
    call CHGMOD

    ;; 16x16 sprites:
    ld bc,#e201  ;; write #e2 in VDP register #01 (activate sprites, generate interrupts, 16x16 sprites with no magnification)
    call WRTVDP

    ;call check_if_60hz
    ;ld (isComputer50HzOr60Hz),a

    ;init random seed
    ;call random_seed_update

${a}

; ==================================================================
; END OF HEADER
; ==================================================================
`}function G(e){return e.toLowerCase()}function _e(e,n){var a,o;let t=`
; GameFlow: ${e.name||"Unknown"}
; Nodes: ${((a=e.nodes)==null?void 0:a.length)||0}
; Connections: ${((o=e.connections)==null?void 0:o.length)||0}

`;return e.nodes&&e.nodes.length>0&&e.nodes.forEach(i=>{var c,s,l,_,m,p,u,E;const r=`gameflow_node_${i.id.replace(/[^a-zA-Z0-9]/g,"_")}`;switch(i.type){case"Start":const S=(c=e.connections)==null?void 0:c.find(N=>{var b;return((b=N.from)==null?void 0:b.nodeId)===i.id||N.from===i.id});if(S){const b=`gameflow_node_${(((s=S.to)==null?void 0:s.nodeId)||S.to).replace(/[^a-zA-Z0-9]/g,"_")}`;t+=`
${r}:
    ; Start Node - transition to first connected node
    ld hl, ${b}
    jp execute_gameflow_node
`}else t+=`
${r}:
    ; Start Node - no connections, fallback to main program
    ret
`;break;case"WorldLink":const I=i.worldAssetId;t+=`
${r}:
    ; WorldLink Node - Load world: ${I||"Unknown"}
    call init_sprites
    call init_components
    call init_entities
    call ${G("load_world_"+(I||"default"))}
    ; CRITICAL: Set game flow state and update sprites to VRAM
    ld a, FLOW_STATE_GAME
    ld (current_flow_state), a
    call update_sprites_to_vram   ; Copy sprite attributes to VRAM

    jp main_loop
`;break;case"SubMenu":t+=`
${r}:
    ; SubMenu Node - "${i.title||"Menu"}"
    call init_font_system
    call ${G("show_menu_"+i.id)}
    ; Wait for menu selection and transition to next node
    ret
`;break;case"Text":t+=`
${r}:
    ; Text Node - "${i.title||"Text"}"
    call init_font_system
    call ${G("show_text_"+i.id)}
    ; Wait for user input, then transition to next node
    ret
`;break;case"Transition":t+=`
${r}:
    ; Transition Node - Effect: ${i.effect||"default"}
    call ${G("transition_effect_"+i.id)}
    ret
`;break;case"Group":t+=`
${r}:
    ; Group Node - Nested GameFlow
    ; Load GameFlow: ${i.gameFlowAssetId||"Unknown"}
    call ${G("init_gameflow_"+(i.gameFlowAssetId||"default"))}
    ret
`;break;case"End":t+=`
${r}:
    ; End Node - ${i.endType||"Game Over"}
    call show_end_screen
    ; Halt or return to main menu
    ret
`;break;case"Restart":t+=`
${r}:
    ; Restart Node
    jp init_rom  ; Restart entire game
`;break;case"Waypoint":const T=(l=e.connections)==null?void 0:l.find(N=>{var b;return((b=N.from)==null?void 0:b.nodeId)===i.id||N.from===i.id});if(T){const b=`gameflow_node_${(((_=T.to)==null?void 0:_.nodeId)||T.to).replace(/[^a-zA-Z0-9]/g,"_")}`;t+=`
${r}:
    ; Waypoint - route to next node
    ld hl, ${b}
    jp execute_gameflow_node
`}break;case"IfThenElse":const A=(m=e.connections)==null?void 0:m.find(N=>{var b,F,v;return(((b=N.from)==null?void 0:b.nodeId)===i.id||N.from===i.id)&&(((F=N.from)==null?void 0:F.sourceId)==="then"||!((v=N.from)!=null&&v.sourceId))}),g=(p=e.connections)==null?void 0:p.find(N=>{var b,F;return(((b=N.from)==null?void 0:b.nodeId)===i.id||N.from===i.id)&&((F=N.from)==null?void 0:F.sourceId)==="else"}),d=A?((u=A.to)==null?void 0:u.nodeId)||A.to:null,f=g?((E=g.to)==null?void 0:E.nodeId)||g.to:null,h=d?`gameflow_node_${d.replace(/[^a-zA-Z0-9]/g,"_")}`:null,C=f?`gameflow_node_${f.replace(/[^a-zA-Z0-9]/g,"_")}`:null,L=`global_var_${(i.variableName||"Goal").replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`;let y="";const R=i.compareValue||"Completed";if(!isNaN(Number(R)))y=R;else{const N=R.toUpperCase().replace(/\s+/g,"_"),b=(i.variableName||"Goal").toUpperCase().replace(/([A-Z])/g,"_$1").replace(/^_/,"");R==="True"||R==="False"?y=`BOOL_${N}`:y=`${b}_${N}`}const D=i.operator||"==";t+=`
${r}:
    ; IfThenElse Node - Compare ${i.variableName||"Goal"} ${D} ${i.compareValue||"Completed"}
    ld a, (${L})     ; Load global variable ${i.variableName||"Goal"}
    cp ${y}        ; Compare with ${i.compareValue||"Completed"}
`,D==="=="?(h&&(t+=`    jp z, ${h}       ; If equal, jump to THEN branch
`),C?t+=`    jp ${C}          ; Otherwise, jump to ELSE branch
`:t+=`    ret                      ; No ELSE branch, return
`):D==="!="?(h&&(t+=`    jp nz, ${h}      ; If not equal, jump to THEN branch
`),C?t+=`    jp ${C}          ; Otherwise, jump to ELSE branch
`:t+=`    ret                      ; No ELSE branch, return
`):D===">"?(C&&(t+=`    jp c, ${C}       ; If A < value (carry set), ELSE
`),h&&(t+=`    jp z, ${C||"if_then_else_skip"}       ; If A == value (zero set), ELSE
`,t+=`    jp ${h}          ; Otherwise A > value, THEN
`)):D==="<"?(h&&(t+=`    jp c, ${h}       ; If A < value (carry set), THEN
`),C&&(t+=`    jp ${C}          ; Otherwise, ELSE
`)):D===">="?(C&&(t+=`    jp c, ${C}       ; If A < value (carry set), ELSE
`),h&&(t+=`    jp ${h}          ; Otherwise A >= value, THEN
`)):D==="<="&&(h&&(t+=`    jp z, ${h}       ; If A == value, THEN
`,t+=`    jp c, ${h}       ; If A < value, THEN
`),C&&(t+=`    jp ${C}          ; Otherwise A > value, ELSE
`)),!h&&!C&&(t+=`    ret                      ; No connections, return
`),t+=`if_then_else_skip:
    ret
`;break;default:t+=`
${r}:
    ; ${i.type} Node (not yet implemented)
    ; Node ID: ${i.id}
    ret
`}}),t+=`
; End of GameFlow State Machine
`,t}function ie(e){return e.toLowerCase()}function Xe(e,n){var t,a,o,i,r,c;return`; ==================================================================
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
${n.gameFlow.nodes&&n.gameFlow.nodes.length>0?n.gameFlow.nodes.map((s,l)=>{var _;return`    ; Node ${l}: ${s.id} (${s.type||"unknown"}) ${(_=s.data)!=null&&_.worldMapId?`-> World: ${s.data.worldMapId}`:""}`}).join(`
`):"    ; No nodes in GameFlow"}

    ; Execute first GameFlow transition (matches Play mode behavior)
    call execute_gameflow_start`:`    ; No GameFlow detected - load first available screen
${n.screenMaps&&n.screenMaps.length>0?`    ; Load first screen: ${((a=n.screenMaps[0])==null?void 0:a.name)||"default"}
    call ${ie("load_screen_"+(((i=(o=n.screenMaps[0])==null?void 0:o.name)==null?void 0:i.replace(/[^a-zA-Z0-9]/g,"_"))||"DEFAULT"))}`:"    ; No screens detected - load default pattern"}`}
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
    ; World link node - execution handled by GameFlow state machine
    ; Each WorldLink node has its own implementation in gameflow.asm
    ; This stub should never be called directly
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
    call ${ie("load_screen_"+(((c=(r=n.screenMaps[0])==null?void 0:r.name)==null?void 0:c.replace(/[^a-zA-Z0-9]/g,"_"))||"DEFAULT"))}`:`
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

show_end_screen:
    ; Show end screen (Game Over, Victory, etc)
    ; Implementation needs end screen rendering
    ret

; ==================================================================
; GAMEFLOW NODE DATA STRUCTURES (Generated State Machine)
; ==================================================================

${n.gameFlow?_e(n.gameFlow):`
; No GameFlow detected - using default screen loading
`}

; ==================================================================
; END OF MAIN PROGRAM
; ==================================================================
    end                 ; End of assembly
`}function Ke(e){var n;return!e.tiles||e.tiles.length===0?`; ==================================================================
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
${e.tiles.map((t,a)=>{const o=Se(t,"SCREEN 2 (Graphics I)"),i=Math.ceil(t.width/8),r=Math.ceil(t.height/8),c=i*r;(t.width%8!==0||t.height%8!==0)&&console.warn(`⚠️  Tile ${t.name} size ${t.width}x${t.height} is not multiple of 8px - may cause visual artifacts`);const s=Array.from(o).map(_=>`#${_.toString(16).padStart(2,"0").toUpperCase()}`);let l="";if(c>1){l=`
    ; Character layout: ${i}×${r} grid`;for(let _=0;_<r;_++){l+=`
    ; Row ${_}: `;for(let m=0;m<i;m++){const p=_*i+m;l+=`Char${p} `}}}return`    ; Tile ${a}: ${t.name} (${t.width}x${t.height}px = ${i}×${r} chars = ${c} MSX characters)${l}
    db ${s.join(", ")}
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
`}function Ze(e){var n;return!e.tiles||e.tiles.length===0?`; ==================================================================
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
${e.tiles.map((t,a)=>{const o=Ae(t),i=o?Array.from(o).map(r=>`#${r.toString(16).padStart(2,"0").toUpperCase()}`):["#F0","#F0","#F0","#F0","#F0","#F0","#F0","#F0"];return`    ; Tile ${a}: ${t.name} colors (fg/bg pairs)
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
`}function re(e){return e.toLowerCase()}function Je(e,n,t){var r,c,s,l,_,m,p,u,E,S,I,T,A;const a=(c=(r=t.gameFlow)==null?void 0:r.nodes)==null?void 0:c.some(g=>g.type==="SubMenu"),o=(s=t.screenMaps)==null?void 0:s.some(g=>{var d,f;return((d=g.layers)==null?void 0:d.text)||((f=g.textElements)==null?void 0:f.length)>0}),i=a||o;return`; ==================================================================
; ${n.toUpperCase()} - UNIFIED FILE
; File: unitedFiles.asm
; Description: All-in-one file combining all modular files
; Generated by Mideas MSX Modular Generator
;
; OPTIMIZED: Only includes necessary code for this project
; Tiles: ${((l=t.tiles)==null?void 0:l.length)||0}
; Sprites: ${((_=t.sprites)==null?void 0:_.length)||0}
; Screens: ${((m=t.screenMaps)==null?void 0:m.length)||0}
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
${t.gameFlow.nodes&&t.gameFlow.nodes.length>0?t.gameFlow.nodes.map((g,d)=>{var f;return`    ; Node ${d}: ${g.id} (${g.type||"unknown"}) ${(f=g.data)!=null&&f.worldMapId?`-> World: ${g.data.worldMapId}`:""}`}).join(`
`):"    ; No nodes in GameFlow"}

    ; Execute first GameFlow transition (matches Play mode behavior)
    call execute_gameflow_start`:`    ; No GameFlow detected - load first available screen
${t.screenMaps&&t.screenMaps.length>0?`    ; Load first screen: ${((E=t.screenMaps[0])==null?void 0:E.name)||"default"}
    call ${re("load_screen_"+(((I=(S=t.screenMaps[0])==null?void 0:S.name)==null?void 0:I.replace(/[^a-zA-Z0-9]/g,"_"))||"DEFAULT"))}`:"    ; No screens detected - load default pattern"}`}
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
    ; World link node - execution handled by GameFlow state machine
    ; Each WorldLink node has its own implementation in gameflow.asm
    ; This stub should never be called directly
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
    call ${re("load_screen_"+(((A=(T=t.screenMaps[0])==null?void 0:T.name)==null?void 0:A.replace(/[^a-zA-Z0-9]/g,"_"))||"DEFAULT"))}`:`
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

show_end_screen:
    ; Show end screen (Game Over, Victory, etc)
    ; Implementation needs end screen rendering
    ret

; ==================================================================
; GAMEFLOW NODE DATA STRUCTURES (Generated State Machine)
; ==================================================================

${t.gameFlow?_e(t.gameFlow):`
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
`}function qe(e,n){let a=`${e.name.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase()}_F0_LAYER0:
`;return a+=`    db 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
`,a+=`    db 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
`,a+=`    db 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
`,a+=`    db 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
`,a}function et(e){var o;const n=((o=e.sprites)==null?void 0:o.length)??0,t=209;if(n===0)return`; ==================================================================
; SPRITE DATA (EMPTY - NO SPRITES DETECTED)
; File: sprites.asm
; ==================================================================

; No sprites detected in project - placeholder file generated.

; ==================================================================
; SPRITE CONSTANTS
; ==================================================================
SPRITE_INVISIBLE    EQU ${t}

; ==================================================================
; SPRITE UTILITY FUNCTIONS
; ==================================================================

clear_all_sprites:
    ret     ; No sprites to clear

hide_sprite:
    ret     ; No sprites to hide

update_sprites_to_vram:
    ret     ; No sprite attributes to update

; ==================================================================
; END OF SPRITE DATA
; ==================================================================
`;let a=`; ==================================================================
; SPRITE DATA
; File: sprites.asm
; Description: Sprite pattern and animation data
; ${n} sprites detected
; ==================================================================

; ==================================================================
; SPRITE PATTERN DATA
; ==================================================================
`;e.sprites.forEach((i,r)=>{const c=i.name.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase(),s=qe(i);let l=-1;for(let _=0;_<4;_++)if(s.includes(`${c}_F0_LAYER${_}:`)){l=_;break}a+=`
; Sprite ${r}: ${i.name}
${s}`,l>=0?a+=`
; Unified pattern label for sprite ${r}
SPRITE_${r}_PATTERN EQU ${c}_F0_LAYER${l}
`:a+=`
; WARNING: No valid pattern layers found for sprite ${r}: ${i.name}
SPRITE_${r}_PATTERN:
    db 0, 0, 0, 0, 0, 0, 0, 0  ; Placeholder pattern (8 bytes)
    db 0, 0, 0, 0, 0, 0, 0, 0
    db 0, 0, 0, 0, 0, 0, 0, 0
    db 0, 0, 0, 0, 0, 0, 0, 0  ; Total 32 bytes for 16x16 sprite
`}),a+=`
; ==================================================================
; SPRITE INITIALIZATION FUNCTIONS
; ==================================================================

init_sprites:
    call clear_all_sprites
    call load_sprite_patterns
    xor a
    ld (active_sprite_count), a
    ret

load_sprite_patterns:
`;for(let i=0;i<n;i++){const r=e.sprites[i].name;a+=`    ; Load sprite ${i}: ${r}
    ld hl, SPRITE_${i}_PATTERN
    ld de, SPRPAT + (${i} * 32)
    ld bc, 32
    call LDIRVM
`}return a+=`    ret

; ==================================================================
; SPRITE MANAGEMENT FUNCTIONS
; ==================================================================

; A = sprite index, B = X, C = Y, D = pattern, E = color
show_sprite:


    ; Calculate base address for sprite: index * 4
    ld l, a
    ld h, 0
    add hl, hl      ; index * 2
    add hl, hl      ; index * 4

    ; Add base of the attribute table
    ld de, sprite_attributes
    add hl, de      ; HL = &sprite_attributes[index * 4]

    ; Write attributes
    ld (hl), c      ; Y
    inc hl
    ld (hl), b      ; X
    inc hl
    ld (hl), d      ; Pattern
    inc hl
    ld (hl), e      ; Color

 
    ret

; Clear all sprites (set Y = SPRITE_INVISIBLE)
clear_all_sprites:
    ld hl, sprite_attributes
    ld b, ${n}
.clear_loop:
    ld (hl), SPRITE_INVISIBLE
    ld de, 4
    add hl, de
    djnz .clear_loop
    ret

; Hide specific sprite (A = sprite index)
hide_sprite:
    ; Calculate address: sprite_attributes + (index * 4)
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    ld de, sprite_attributes
    add hl, de
    ld (hl), SPRITE_INVISIBLE
    ret

; Copy sprite attributes from RAM to VRAM
update_sprites_to_vram:
    ld hl, sprite_attributes
    ld de, SPRATR
    ld bc, ${n*4}  ; 4 bytes per sprite
    call LDIRVM
    ret

; ==================================================================
; SPRITE CONSTANTS
; ==================================================================
SPRITE_INVISIBLE    EQU ${t}
`,e.sprites.forEach((i,r)=>{const c=i.name.toUpperCase().replace(/[^A-Z0-9_]/g,"_");a+=`SPRITE_ID_${c}    EQU ${r}      ; ${i.name}
`}),a+=`
; ==================================================================
; RAM REQUIREMENTS (define this in your main RAM section)
; ==================================================================
; sprite_attributes: ds ${n*4}  ; Interleaved buffer: Y, X, Pattern, Color
; active_sprite_count: db 0
;
; Total: ${n*4+1} bytes of RAM

; ==================================================================
; END OF SPRITE DATA
; ==================================================================
`,a}const Z={comp_pos:"Position",comp_position:"Position",comp_render:"Sprite",comp_sprite:"Sprite",comp_movement:"Movement",comp_velocity:"Movement",comp_collision:"Collision",comp_player_input:"Input",comp_input:"Input",comp_ai_behavior:"Behavior",comp_behavior:"Behavior",comp_health:"Health",comp_animation:"Animation",comp_gravity:"Gravity",comp_jump:"Jump",comp_damage:"Damage",comp_statemachine:"StateMachine",comp_cursors:"Cursors"};function pe(e){var i;const n=new Set,t=new Set,a=[],o=new Map;return console.log("🔍 Analyzing component usage..."),console.log(`📊 Total entities in project: ${((i=e.entities)==null?void 0:i.length)||0}`),e.entities&&e.entities.length>0&&e.entities.forEach(r=>{console.log(`  - Entity: ${r.name} (template: ${r.entityTemplateId})`),a.push(r),r.entityTemplateId&&t.add(r.entityTemplateId)}),console.log(`✅ Active entities: ${a.length}`),console.log(`✅ Used templates: ${Array.from(t).join(", ")}`),a.forEach(r=>{var l;const c=r.name||r.id,s=(l=e.templates)==null?void 0:l.find(_=>_.id===r.entityTemplateId);s?(console.log(`  📦 Analyzing template "${s.name}" for entity "${c}"`),s.components&&Array.isArray(s.components)&&s.components.forEach(_=>{const m=_.definitionId||_.componentDefinitionId;if(m){const p=Z[m]||m;console.log(`    - Component: ${m} → ${p}`),n.add(p),o.has(p)||o.set(p,new Set),o.get(p).add(c)}}),r.componentOverrides&&Object.keys(r.componentOverrides).forEach(_=>{const m=Z[_]||_;console.log(`    - Override: ${_} → ${m}`),n.add(m),o.has(m)||o.set(m,new Set),o.get(m).add(c)})):console.warn(`  ⚠️  Template "${r.entityTemplateId}" not found for entity "${c}"`)}),console.log("📊 Component usage summary:"),console.log(`  - Total used components: ${n.size}`),n.forEach(r=>{const c=o.get(r);console.log(`    • ${r}: ${(c==null?void 0:c.size)||0} entities`)}),{usedComponents:n,usedTemplates:t,activeEntities:a,componentToEntitiesMap:o}}function le(e,n,t){let a=0;const o={Position:0,Sprite:1,Movement:2,Collision:3,Input:4,Behavior:5,Health:6,Animation:7,Jump:8,Gravity:9};return n&&n.components&&n.components.forEach(i=>{const r=i.definitionId||i.componentDefinitionId,c=Z[r];c&&o[c]!==void 0&&(a|=1<<o[c])}),e.componentOverrides&&Object.keys(e.componentOverrides).forEach(i=>{const r=Z[i];r&&o[r]!==void 0&&(a|=1<<o[r])}),a}function tt(){return`
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
`}function nt(e){return`
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

    ; Check if entity is in current screen (multi-screen support)
    push bc
    push hl

    ; Check entity screen ID
    ld hl, entity_screen_id
    ld e, c                    ; Entity index
    ld d, 0
    add hl, de                 ; HL points to entity screen ID
    ld a, (hl)                 ; A = entity screen ID

    ; Compare with current screen ID
    ld hl, current_screen_id
    cp (hl)                    ; Compare entity screen with current screen
    jr nz, sprite_hide         ; If different screen, hide sprite

    ; Entity is in current screen - render normally
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
    jr sprite_continue

sprite_hide:
    ; Entity is in different screen - hide sprite (Y = 208+)
    ld a, c                    ; Sprite number = entity index
    ld b, 0                    ; X = 0 (doesn't matter when hidden)
    ld c, 208                  ; Y = 208 (off-screen, hides sprite)
    ld d, 0                    ; Pattern 0
    ld e, 0                    ; Color 0
    call show_sprite

sprite_continue:
    pop hl
    pop bc

sprite_next_entity:
    inc hl                     ; Next entity
    inc c                      ; Next entity index
    djnz sprite_update_loop

    ; Update all sprites to VRAM
    call update_sprites_to_vram
    ret
`}function at(){return`
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
`}function ot(e){const n=e.tiles&&e.tiles.length>0?e.tiles[0].width:16,t=e.tiles&&e.tiles.length>0?e.tiles[0].height:16,a=Math.floor(256/n),o=Math.floor(192/t),i=Number.isInteger(Math.log2(n))?Math.log2(n):4,r=Number.isInteger(Math.log2(t))?Math.log2(t):4,c=Array.from({length:i},(_,m)=>`    srl a                      ; A = X / ${Math.pow(2,m+1)}`).join(`
`),s=Array.from({length:r},(_,m)=>`    srl a                      ; A = Y / ${Math.pow(2,m+1)}`).join(`
`);return`
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
${e.tiles&&e.tiles.length>0?`; Project tile analysis: ${e.tiles.map(_=>`${_.width}x${_.height}`).join(", ")}
    ; Using first tile as reference: ${n}x${t}
    ; Convert X to tile column (divide by ${n})`:`; No tiles detected - using default 16x16
    ; Convert X to tile column (divide by 16)`}

${c}
    ld c, a                    ; C = tile column

    ; Convert Y to tile row (divide by ${t})
    ld a, b
${s}
    ld b, a                    ; B = tile row

    ; Check if position is within valid tile map
    ld a, c
    cp ${a}                      ; Screen width in tiles
    jr nc, no_tile_collision
    ld a, b
    cp ${o}                      ; Screen height in tiles
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
`}function it(){return`
; ==================================================================
; INPUT COMPONENT SYSTEM (With direction restrictions - Cursors)
; ==================================================================

; Direction flags for Cursors component
DIR_ALLOW_UP     EQU #01  ; Bit 0: Allow UP movement
DIR_ALLOW_DOWN   EQU #02  ; Bit 1: Allow DOWN movement
DIR_ALLOW_LEFT   EQU #04  ; Bit 2: Allow LEFT movement
DIR_ALLOW_RIGHT  EQU #08  ; Bit 3: Allow RIGHT movement

init_input_system:
    ; Initialize input handling system
    xor a
    ld (input_state), a
    ld (prev_input_state), a

    ; Initialize direction masks for all entities (default: all directions allowed)
    ld hl, entity_dir_mask
    ld de, entity_dir_mask+1
    ld bc, 31
    ld (hl), #0F               ; Default: 00001111 = all directions enabled
    ldir
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

    ; Get direction mask for this entity
    ld hl, entity_dir_mask
    ld e, c
    ld d, 0
    add hl, de
    ld d, (hl)                 ; D = direction mask (allowUp/Down/Left/Right)

    ; Convert joystick input to velocity
    ld a, (input_state)
    ld b, 0                    ; Default X velocity
    ld c, 0                    ; Default Y velocity

    ; Check directional input with direction restrictions
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
    ; Check if UP is allowed (bit 0)
    ld a, d
    and DIR_ALLOW_UP
    jr z, input_apply_velocity ; Not allowed, skip
    ld c, -2                   ; Negative Y velocity (up)
    jr input_apply_velocity

input_move_down:
    ; Check if DOWN is allowed (bit 1)
    ld a, d
    and DIR_ALLOW_DOWN
    jr z, input_apply_velocity ; Not allowed, skip
    ld c, 2                    ; Positive Y velocity (down)
    jr input_apply_velocity

input_move_left:
    ; Check if LEFT is allowed (bit 2)
    ld a, d
    and DIR_ALLOW_LEFT
    jr z, input_apply_velocity ; Not allowed, skip
    ld b, -2                   ; Negative X velocity (left)
    jr input_apply_velocity

input_move_right:
    ; Check if RIGHT is allowed (bit 3)
    ld a, d
    and DIR_ALLOW_RIGHT
    jr z, input_apply_velocity ; Not allowed, skip
    ld b, 2                    ; Positive X velocity (right)
    jr input_apply_velocity

input_move_upright:
    ; Check if both UP and RIGHT are allowed
    ld a, d
    and DIR_ALLOW_UP
    jr z, input_check_right_only ; UP not allowed
    ld a, d
    and DIR_ALLOW_RIGHT
    jr z, input_check_up_only  ; RIGHT not allowed
    ; Both allowed - diagonal
    ld b, 1                    ; Diagonal movement (slower)
    ld c, -1
    jr input_apply_velocity
input_check_right_only:
    ; Only RIGHT allowed
    ld a, d
    and DIR_ALLOW_RIGHT
    jr z, input_apply_velocity
    ld b, 2
    jr input_apply_velocity
input_check_up_only:
    ; Only UP allowed
    ld c, -2
    jr input_apply_velocity

input_move_upleft:
    ; Check if both UP and LEFT are allowed
    ld a, d
    and DIR_ALLOW_UP
    jr z, input_check_left_only1 ; UP not allowed
    ld a, d
    and DIR_ALLOW_LEFT
    jr z, input_check_up_only1 ; LEFT not allowed
    ; Both allowed - diagonal
    ld b, -1
    ld c, -1
    jr input_apply_velocity
input_check_left_only1:
    ; Only LEFT allowed
    ld a, d
    and DIR_ALLOW_LEFT
    jr z, input_apply_velocity
    ld b, -2
    jr input_apply_velocity
input_check_up_only1:
    ; Only UP allowed
    ld c, -2
    jr input_apply_velocity

input_move_downright:
    ; Check if both DOWN and RIGHT are allowed
    ld a, d
    and DIR_ALLOW_DOWN
    jr z, input_check_right_only2 ; DOWN not allowed
    ld a, d
    and DIR_ALLOW_RIGHT
    jr z, input_check_down_only2 ; RIGHT not allowed
    ; Both allowed - diagonal
    ld b, 1
    ld c, 1
    jr input_apply_velocity
input_check_right_only2:
    ; Only RIGHT allowed
    ld a, d
    and DIR_ALLOW_RIGHT
    jr z, input_apply_velocity
    ld b, 2
    jr input_apply_velocity
input_check_down_only2:
    ; Only DOWN allowed
    ld c, 2
    jr input_apply_velocity

input_move_downleft:
    ; Check if both DOWN and LEFT are allowed
    ld a, d
    and DIR_ALLOW_DOWN
    jr z, input_check_left_only3 ; DOWN not allowed
    ld a, d
    and DIR_ALLOW_LEFT
    jr z, input_check_down_only3 ; LEFT not allowed
    ; Both allowed - diagonal
    ld b, -1
    ld c, 1
    jr input_apply_velocity
input_check_left_only3:
    ; Only LEFT allowed
    ld a, d
    and DIR_ALLOW_LEFT
    jr z, input_apply_velocity
    ld b, -2
    jr input_apply_velocity
input_check_down_only3:
    ; Only DOWN allowed
    ld c, 2

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
`}function rt(){return`
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
`}function lt(){return`
; ==================================================================
; HEALTH COMPONENT SYSTEM
; ==================================================================

init_health_system:
    ; Initialize health system
    ; Set default health values
    ld hl, entity_health
    ld de, entity_health+1
    ld bc, 31
    ld (hl), 100               ; Default health = 100
    ldir
    ret

update_health_component:
    ; Update health states (damage, healing, death)
    ld b, 32                   ; Loop through all entities
    ld hl, entity_comp_masks   ; Check component masks
    ld ix, entity_health       ; Health data

health_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_HEALTH       ; Check if has health component
    jr z, health_next_entity   ; Skip if no health component

    ; Check if entity is dead
    ld a, (ix+0)               ; Get health value
    or a                       ; Check if 0
    jr z, health_entity_dead   ; Handle death

    ; Entity is alive - continue
    jr health_next_entity

health_entity_dead:
    ; Handle entity death
    ; TODO: Trigger death animation, remove entity, etc.

health_next_entity:
    inc hl                     ; Next entity
    inc ix                     ; Next health value
    djnz health_update_loop
    ret
`}function st(){return`
; ==================================================================
; ANIMATION COMPONENT SYSTEM
; ==================================================================

init_animation_system:
    ; Initialize animation system
    ; Clear animation frames
    ld hl, entity_anim_frame
    ld de, entity_anim_frame+1
    ld bc, 31
    ld (hl), 0
    ldir
    ret

update_animation_component:
    ; Update sprite animations
    ld b, 32                   ; Loop through all entities
    ld hl, entity_comp_masks   ; Check component masks
    ld ix, entity_anim_frame   ; Animation frame data

anim_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_ANIMATION    ; Check if has animation component
    jr z, anim_next_entity     ; Skip if no animation component

    ; Advance animation frame
    ld a, (ix+0)               ; Get current frame
    inc a                      ; Next frame
    cp 4                       ; Check if >= max frames (TODO: make dynamic)
    jr c, anim_store_frame     ; If < max, store it
    xor a                      ; Reset to frame 0

anim_store_frame:
    ld (ix+0), a               ; Store new frame

anim_next_entity:
    inc hl                     ; Next entity
    inc ix                     ; Next animation data
    djnz anim_update_loop
    ret
`}function ct(){return`
; ==================================================================
; JUMP COMPONENT SYSTEM (Platform physics with multi-jump support)
; ==================================================================

init_jump_system:
    ; Initialize jump system
    ; Clear jump velocities
    ld hl, entity_jump_vel_y
    ld de, entity_jump_vel_y+1
    ld bc, 63                  ; 64 bytes - 1 (32 words)
    ld (hl), 0
    ldir

    ; Clear jump counters
    ld hl, entity_jump_count
    ld de, entity_jump_count+1
    ld bc, 31
    ld (hl), 0
    ldir

    ; Clear ground flags
    ld hl, entity_on_ground
    ld de, entity_on_ground+1
    ld bc, 31
    ld (hl), 0
    ldir
    ret

update_jump_component:
    ; Update jump physics for entities
    ; Handles jump initiation, velocity application, and multi-jump logic
    ld b, 32                   ; Loop through all entities
    ld hl, entity_comp_masks   ; Check component masks
    ld c, 0                    ; Entity index

jump_update_loop:
    ld a, (hl)                 ; Get entity component mask (low byte)
    and #00                    ; Check low byte
    ld e, a                    ; Store low byte
    inc hl
    ld a, (hl)                 ; Get high byte
    and #01                    ; Check COMP_MASK_JUMP high byte (#0100)
    jr z, jump_next_entity     ; Skip if no jump component
    dec hl                     ; Restore HL

    ; Entity has jump component - check for jump input
    push bc
    push hl

    ; Check if fire button pressed (jump trigger)
    ld a, (input_state)
    bit 4, a                   ; Bit 4 = fire button
    jr z, jump_no_input        ; No jump input

    ; Jump button pressed - check if can jump
    ld hl, entity_on_ground
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                 ; Get ground flag
    bit 0, a                   ; Check if on ground
    jr nz, jump_execute        ; Can jump if grounded

    ; Not grounded - check jump count for multi-jump
    ld hl, entity_jump_count
    add hl, de
    ld a, (hl)                 ; Get current jump count
    cp 2                       ; Check if < maxJumps (TODO: make dynamic)
    jr nc, jump_no_input       ; Already used all jumps

jump_execute:
    ; Execute jump - apply jump power
    ld hl, entity_jump_vel_y
    ld e, c
    ld d, 0
    add hl, de
    add hl, de                 ; HL points to jump_vel_y (word)

    ; Set jump velocity (negative = upward)
    ; jumpPower from component defaults: 256-384 (word value)
    ld (hl), #00               ; Low byte = 0
    inc hl
    ld (hl), #FE               ; High byte = -2 (signed, ~512 in fixed-point)

    ; Increment jump counter
    ld hl, entity_jump_count
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    inc a
    ld (hl), a

    ; Clear ground flag
    ld hl, entity_on_ground
    add hl, de
    ld (hl), 0

jump_no_input:
    ; Apply jump velocity to entity Y position
    ld hl, entity_jump_vel_y
    ld e, c
    ld d, 0
    add hl, de
    add hl, de                 ; HL points to jump velocity (word)

    ld e, (hl)                 ; Load jump velocity low
    inc hl
    ld d, (hl)                 ; Load jump velocity high

    ; Add velocity to Y position
    ld hl, entity_y_pos
    ld a, c
    ld l, a
    ld h, 0
    add hl, de
    ld a, (hl)                 ; Current Y
    add a, d                   ; Add velocity high byte (integer part)
    ld (hl), a                 ; Store new Y

    pop hl
    pop bc

jump_next_entity:
    inc hl                     ; Next entity mask (skip 2 bytes for 16-bit)
    inc hl
    inc c                      ; Next entity index
    djnz jump_update_loop
    ret
`}function dt(){return`
; ==================================================================
; GRAVITY COMPONENT SYSTEM (Constant downward acceleration)
; ==================================================================

init_gravity_system:
    ; Initialize gravity system
    ; Clear gravity velocities
    ld hl, entity_gravity_vel
    ld de, entity_gravity_vel+1
    ld bc, 63                  ; 64 bytes - 1 (32 words)
    ld (hl), 0
    ldir
    ret

update_gravity_component:
    ; Apply gravity acceleration to entities
    ld b, 32                   ; Loop through all entities
    ld hl, entity_comp_masks   ; Check component masks
    ld c, 0                    ; Entity index

gravity_update_loop:
    ld a, (hl)                 ; Get entity component mask (low byte)
    inc hl
    ld a, (hl)                 ; Get high byte
    and #02                    ; Check COMP_MASK_GRAVITY (#0200)
    jr z, gravity_next_entity  ; Skip if no gravity component
    dec hl                     ; Restore HL

    ; Entity has gravity - apply acceleration
    push bc
    push hl

    ; Check if entity is grounded
    ld hl, entity_on_ground
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    bit 0, a                   ; Check ground flag
    jr nz, gravity_grounded    ; Skip gravity if on ground

    ; Apply gravity acceleration
    ld hl, entity_gravity_vel
    ld e, c
    ld d, 0
    add hl, de
    add hl, de                 ; HL points to gravity velocity (word)

    ld e, (hl)                 ; Load current gravity velocity
    inc hl
    ld d, (hl)

    ; Add gravity strength (64 in fixed-point = ~0.25 pixels/frame acceleration)
    ld a, e
    add a, #40                 ; Add 64 to low byte
    ld e, a
    ld a, d
    adc a, #00                 ; Add carry to high byte
    ld d, a

    ; Check terminal velocity (1024 = max fall speed)
    ld a, d
    cp #04                     ; Check if >= 1024
    jr c, gravity_store_vel    ; If < 1024, continue
    ld de, #0400               ; Cap at terminal velocity

gravity_store_vel:
    ; Store updated gravity velocity
    dec hl
    ld (hl), e
    inc hl
    ld (hl), d

    ; Apply gravity velocity to Y position
    ld hl, entity_y_pos
    ld a, c
    ld l, a
    ld h, 0
    add hl, de
    ld a, (hl)                 ; Current Y
    add a, d                   ; Add velocity high byte (integer part)
    ld (hl), a                 ; Store new Y

    jr gravity_done

gravity_grounded:
    ; Entity is grounded - reset gravity velocity
    ld hl, entity_gravity_vel
    ld e, c
    ld d, 0
    add hl, de
    add hl, de
    ld (hl), 0                 ; Clear velocity low
    inc hl
    ld (hl), 0                 ; Clear velocity high

gravity_done:
    pop hl
    pop bc

gravity_next_entity:
    inc hl                     ; Next entity mask (2 bytes)
    inc hl
    inc c                      ; Next entity index
    djnz gravity_update_loop
    ret
`}function _t(){return`
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
`}function pt(e){const n=e.usedComponents;let t=`init_components:
    ; Initialize component systems (OPTIMIZED - only used components)
    ; Used: ${Array.from(n).join(", ")}

    ; Initialize current screen ID (multi-screen support)
    ld a, 0                    ; Start at screen 0
    ld (current_screen_id), a

    ; Clear all component masks
    ld hl, entity_comp_masks
    ld de, entity_comp_masks+1
    ld bc, 31
    ld (hl), 0
    ldir

`;return n.has("Position")&&(t+=`    ; Initialize position system
    call init_position_system
`),n.has("Sprite")&&(t+=`    ; Initialize sprite system
    call init_sprite_system
`),n.has("Movement")&&(t+=`    ; Initialize movement system
    call init_movement_system
`),n.has("Collision")&&(t+=`    ; Initialize collision system
    call init_collision_system
`),n.has("Input")&&(t+=`    ; Initialize input system
    call init_input_system
`),n.has("Behavior")&&(t+=`    ; Initialize behavior system
    call init_behavior_system
`),n.has("Health")&&(t+=`    ; Initialize health system
    call init_health_system
`),n.has("Animation")&&(t+=`    ; Initialize animation system
    call init_animation_system
`),n.has("Jump")&&(t+=`    ; Initialize jump system
    call init_jump_system
`),n.has("Gravity")&&(t+=`    ; Initialize gravity system
    call init_gravity_system
`),t+=`
    ret
`,t}function mt(e){if(!e.entities||e.entities.length===0)return`; ==================================================================
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
`;const n=pe(e),t=n.usedComponents;console.log("🎯 Generating optimized components.asm..."),console.log(`  - Active entities: ${n.activeEntities.length}`),console.log(`  - Used components: ${Array.from(t).join(", ")}`),console.log(`  - Filtered out: ${8-t.size} unused components`);let a=`; ==================================================================
; GAME COMPONENT SYSTEMS - MSX ECS ENGINE
; File: components.asm
; Description: Component systems based on Mideas React.js architecture
; Implements Position, Sprite, Movement, Collision, Input, and Behavior systems
; ==================================================================
;
; INTELLIGENT FILTERING ACTIVE:
;   Active entities: ${n.activeEntities.length}
;   Used components: ${Array.from(t).join(", ")}
;   Filtered out: ${8-t.size} unused component systems
;
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
COMP_JUMP       EQU 8    ; Jump behavior component (platformer physics)
COMP_GRAVITY    EQU 9    ; Gravity physics component

; Component flags for entity filtering (16-bit masks for 10+ components)
COMP_MASK_POSITION   EQU #0001  ; Binary: 0000000000000001
COMP_MASK_SPRITE     EQU #0002  ; Binary: 0000000000000010
COMP_MASK_MOVEMENT   EQU #0004  ; Binary: 0000000000000100
COMP_MASK_COLLISION  EQU #0008  ; Binary: 0000000000001000
COMP_MASK_INPUT      EQU #0010  ; Binary: 0000000000010000
COMP_MASK_BEHAVIOR   EQU #0020  ; Binary: 0000000000100000
COMP_MASK_HEALTH     EQU #0040  ; Binary: 0000000001000000
COMP_MASK_ANIMATION  EQU #0080  ; Binary: 0000000010000000
COMP_MASK_JUMP       EQU #0100  ; Binary: 0000000100000000
COMP_MASK_GRAVITY    EQU #0200  ; Binary: 0000001000000000

; ==================================================================
; COMPONENT DATA STRUCTURES (Entity-Component arrays)
; ==================================================================

; Position Component Data (32 entities max)
entity_x_pos        EQU sprite_x_pos      ; Reuse sprite positions
entity_y_pos        EQU sprite_y_pos      ; (32 bytes each)

; Movement Component Data
entity_vel_x        EQU temp_word_1       ; X velocity storage (signed 8-bit)
entity_vel_y        EQU temp_word_2       ; Y velocity storage (signed 8-bit)

; Component masks for each entity (which components are active) - 16-bit for 10+ components
entity_comp_masks   EQU temp_byte_1       ; Component flags per entity (32 words = 64 bytes)

; Animation Component Data
entity_anim_frame   EQU temp_byte_2       ; Current animation frame (32 bytes)

; Health Component Data
entity_health       EQU temp_byte_3       ; Health value per entity (32 bytes)

; Jump Component Data (Fixed-Point 8.8 for smooth physics)
entity_jump_vel_y   EQU temp_word_3       ; Y velocity for jumping (signed word, 32 words = 64 bytes)
entity_jump_count   EQU temp_byte_4       ; Current jump count (0=grounded, 1=first jump, etc.) (32 bytes)
entity_on_ground    EQU temp_byte_5       ; Ground contact flag (bit 0 = on ground) (32 bytes)

; Gravity Component Data
entity_gravity_vel  EQU temp_word_4       ; Accumulated gravity velocity (signed word, 64 bytes)

; Input/Cursors Component Data (Direction restrictions)
entity_dir_mask     EQU temp_byte_6       ; Direction allowed mask per entity (32 bytes)
                                          ; Bit 0=UP, Bit 1=DOWN, Bit 2=LEFT, Bit 3=RIGHT

; Multi-Screen Component Data (Screen tracking for entities)
entity_screen_id    EQU temp_byte_7       ; Screen ID where entity is located (32 bytes)

; ==================================================================
; CORE ECS SYSTEM FUNCTIONS
; ==================================================================

${pt(n)}
`;return t.has("Position")?a+=tt():a+=`
; Position system filtered out (not used)
init_position_system:
    ret

update_position_component:
    ret
`,t.has("Sprite")?a+=nt():a+=`
; Sprite system filtered out (not used)
init_sprite_system:
    ret

update_sprite_component:
    ret
`,t.has("Movement")?a+=at():a+=`
; Movement system filtered out (not used)
init_movement_system:
    ret

update_movement_component:
    ret
`,t.has("Collision")?a+=ot(e):a+=`
; Collision system filtered out (not used)
init_collision_system:
    ret

update_collision_component:
    ret
`,t.has("Input")?a+=it():a+=`
; Input system filtered out (not used)
init_input_system:
    ret

update_input_component:
    ret
`,t.has("Behavior")?a+=rt():a+=`
; Behavior system filtered out (not used)
init_behavior_system:
    ret

update_behavior_component:
    ret
`,t.has("Health")?a+=lt():a+=`
; Health system filtered out (not used)
init_health_system:
    ret

update_health_component:
    ret
`,t.has("Animation")?a+=st():a+=`
; Animation system filtered out (not used)
init_animation_system:
    ret

update_animation_component:
    ret
`,t.has("Jump")?a+=ct():a+=`
; Jump system filtered out (not used)
init_jump_system:
    ret

update_jump_component:
    ret
`,t.has("Gravity")?a+=dt():a+=`
; Gravity system filtered out (not used)
init_gravity_system:
    ret

update_gravity_component:
    ret
`,a+=_t(),a+=`
; ==================================================================
; END OF COMPONENT SYSTEMS
; ==================================================================
`,a}function ut(e){var o,i,r,c;const t=pe(e).activeEntities;console.log("🎯 Generating optimized entities.asm..."),console.log(`  - Total entity templates in JSON: ${((o=e.templates)==null?void 0:o.length)||0}`),console.log(`  - Actually instantiated entities: ${t.length}`),console.log(`  - Filtered out: ${(((i=e.templates)==null?void 0:i.length)||0)-t.length} unused templates`);let a=`; ==================================================================
; GAME ENTITIES
; File: entities.asm
; Description: Game entity definitions and behavior
; ==================================================================
;
; INTELLIGENT FILTERING ACTIVE:
;   Entity templates in project: ${((r=e.templates)==null?void 0:r.length)||0}
;   Actually instantiated: ${t.length}
;   Filtered out: ${(((c=e.templates)==null?void 0:c.length)||0)-t.length} unused templates
;
; ==================================================================

`;return t.length>0?(a+=`; ==================================================================
; ENTITY DEFINITIONS
; ==================================================================

`,t.forEach((s,l)=>{var u;const _=s.name.toUpperCase().replace(/[^A-Z0-9]/g,"_"),m=(u=e.templates)==null?void 0:u.find(E=>E.id===s.entityTemplateId),p=le(s,m);a+=`; Entity: ${s.name} (instance from template: ${s.entityTemplateId})
ENTITY_${_}_ID EQU ${l}
ENTITY_${_}_COMP_MASK EQU #${p.toString(16).toUpperCase().padStart(2,"0")}  ; Component mask: ${p.toString(2).padStart(8,"0")}b
`,s.entityTemplateId&&(a+=`ENTITY_${_}_TEMPLATE EQU "${s.entityTemplateId}"
`),s.position&&(a+=`ENTITY_${_}_X EQU ${s.position.x}
ENTITY_${_}_Y EQU ${s.position.y}
`),a+=`
`}),a+=`; ==================================================================
; ENTITY MANAGEMENT FUNCTIONS
; ==================================================================

init_entities:
    ; Initialize all active game entities (${t.length} entities)
`,t.length>0?t.forEach(s=>{const l=s.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");a+=`    call init_${l.toLowerCase()}
`}):a+=`    ; No entities to initialize
`,a+=`    ret

update_entities:
    ; Update all active entities (${t.length} entities)
`,t.length>0?t.forEach(s=>{const l=s.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");a+=`    call update_${l.toLowerCase()}
`}):a+=`    ; No entities to update
`,a+=`    ret

`,t.forEach((s,l)=>{var C,L,y,R;const _=s.name.toUpperCase().replace(/[^A-Z0-9]/g,"_"),m=(C=e.templates)==null?void 0:C.find(D=>D.id===s.entityTemplateId),p=le(s,m),u=((L=s.position)==null?void 0:L.x)||100,E=((y=s.position)==null?void 0:y.y)||100,S=16,I=16,T=u*S,A=E*I,g=[];p&1&&g.push("Position"),p&2&&g.push("Sprite"),p&4&&g.push("Movement"),p&8&&g.push("Collision"),p&16&&g.push("Input"),p&32&&g.push("Behavior"),p&64&&g.push("Health"),p&128&&g.push("Animation");let d=15;if(p&16){const D=m==null?void 0:m.components.find(N=>N.definitionId==="comp_cursors"||N.definitionId==="comp_input"||N.definitionId==="comp_player_input");if(D){const N=D.defaultValues||{},b=((R=s.componentOverrides)==null?void 0:R.comp_cursors)||{},F={...N,...b};d=0,F.allowUp!==!1&&(d|=1),F.allowDown!==!1&&(d|=2),F.allowLeft!==!1&&(d|=4),F.allowRight!==!1&&(d|=8)}}const f=[];d&1&&f.push("UP"),d&2&&f.push("DOWN"),d&4&&f.push("LEFT"),d&8&&f.push("RIGHT");const h=f.length===4?"All directions":f.join("+");a+=`init_${_.toLowerCase()}:
    ; Initialize ${s.name} at real position from JSON
    ; JSON position: (${u}, ${E}) tiles = (${T}, ${A}) pixels
    ; Template: ${s.entityTemplateId}
    ; Components: ${g.join(", ")}
    ; Direction mask: #${d.toString(16).toUpperCase().padStart(2,"0")} (${d.toString(2).padStart(4,"0")}b) = ${h}

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ld a, ${l}             ; Entity ID
    ld b, #${p.toString(16).toUpperCase().padStart(2,"0")}              ; Component mask (${p.toString(2).padStart(8,"0")}b)
    call create_entity         ; Create with actual components from template

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, ${l}             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), ${T}         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), ${A}         ; Set real Y position from JSON

    ; Set entity screen ID (for multi-screen support)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), 0                 ; Screen ID 0 (default to first screen)

    ; Set sprite pattern and color
    ld hl, sprite_pattern
    add hl, de
    ld (hl), ${l}          ; Use entity index as sprite pattern

    ld hl, sprite_color
    add hl, de
    ld (hl), 15                ; White color

    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #${d.toString(16).toUpperCase().padStart(2,"0")}            ; Direction restrictions: ${h}

    ; Make sprite visible immediately
    ld a, ${l}             ; Sprite number
    ld b, ${T}            ; X position
    ld c, ${A}            ; Y position
    ld d, ${l}             ; Pattern
    ld e, 15                   ; Color
    call show_sprite
    ret

update_${_.toLowerCase()}:
    ; Update ${s.name} logic with real behavior
    ; Check if entity has input component (player entities)
    ld a, ${l}
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

`})):a+=`; ==================================================================
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

`,a+=`; ==================================================================
; END OF ENTITIES
; ==================================================================
`,a}function Et(e){if(!e.screenMaps||e.screenMaps.length===0)return`; ==================================================================
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

`,e.screenMaps.forEach(a=>{var o,i,r,c,s;if(a.layers&&a.layers.background){const l=new Set(a.layers.background.flat().map(d=>d.tileId).filter(Boolean)),_=[];if(console.log(`🔍 Screen ${a.name}: Found ${l.size} unique tiles`),console.log("Unique tile IDs:",Array.from(l)),console.log("Available tiles in analysis:",(o=e.tiles)==null?void 0:o.map(d=>`${d.name} (${d.id})`)),l.size>0){const d={...fe[1],assignedTiles:{},charsetRangeStart:0,charsetRangeEnd:255};let f=0;Array.from(l).forEach(h=>{var C;if(h){const L=(C=e.tiles)==null?void 0:C.find(y=>y.id===h);if(L){const y=Math.ceil(L.width/8),R=Math.ceil(L.height/8);d.assignedTiles[h]={charCode:f,assignedAt:Date.now()},console.log(`📌 Assigned tile ${L.name} (${h}) to charCode ${f} (${y}x${R} chars)`),f+=y*R}else console.log(`❌ Tile asset not found for ID: ${h}`)}}),_.push(d),console.log(`✅ Created tile bank with ${Object.keys(d.assignedTiles).length} assigned tiles`)}const m=Re(a,e.tiles||[],_.length>0?_:void 0,"SCREEN 2 (Graphics I)"),p=Array.from(m),u=p.filter(d=>d!==255).length,E=new Set(p);console.log(`📊 Generated ${p.length} bytes: ${u} non-FF (${(u/p.length*100).toFixed(1)}%)`),console.log(`🎯 Unique byte values: [${Array.from(E).sort((d,f)=>d-f).join(", ")}]`),u===0&&(console.log("❌ All bytes are #FF - debugging tile bank assignment..."),console.log("Tile bank enabled:",(i=_[0])==null?void 0:i.enabled),console.log("Tile bank assigned tiles:",Object.keys(((r=_[0])==null?void 0:r.assignedTiles)||{})),console.log("Charset range:",(c=_[0])==null?void 0:c.charsetRangeStart,"-",(s=_[0])==null?void 0:s.charsetRangeEnd)),new Set(p.filter(d=>d!==255&&d!==0)),new Set(a.layers.background.flat().map(d=>d.tileId).filter(Boolean));const S=[];S.push('; Generated using exact Screen Editor "Download ASM" logic'),S.push("; Byte values represent actual character codes in VRAM");const I=new Map,T=a.layers.background;for(let d=0;d<T.length;d++)for(let f=0;f<T[d].length;f++){const h=T[d][f];if(h!=null&&h.tileId){const C=d*(a.activeAreaWidth??a.width)+f;if(C<p.length){const L=p[C];L!==255&&L!==0&&I.set(h.tileId,L)}}}const A=`${a.name}_${e.screenMaps.indexOf(a)}`,g=De(A,a.width,a.height,p,S,"hex");if(n+=g,a.layers.collision&&e.tiles){const d=a.layers.collision,f=[];d.forEach(C=>{C.forEach(L=>{var y;if(L.tileId){const R=e.tiles.find(N=>N.id===L.tileId),D=((y=R==null?void 0:R.logicalProperties)==null?void 0:y.mapId)||0;f.push(D)}else f.push(0)})});const h=Oe(A,a.width,a.height,f,"hex");n+=`
${h}`}}else{const l=e.screenMaps.indexOf(a),_=a.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");n+=`SCREEN_${_}_${l}_LAYOUT:
    ; Screen data for ${a.name}
    ; TODO: Add actual screen map data
    db 0, 0, 0, 0, 0, 0, 0, 0

`}n+=`
`}),n+=`; ==================================================================
; SCREEN LOADING FUNCTIONS
; ==================================================================

; Helper function to set VDP background and border colors
; Input: A = background color (0-15), B = border color (0-15)
set_screen_colors:
    push af
    push bc
    ; Set background color (VDP Register 7, bits 0-3)
    ld a, b                    ; Border color in B
    and #0F                    ; Ensure 0-15 range
    rlca                       ; Shift to bits 4-7
    rlca
    rlca
    rlca
    ld b, a                    ; Save shifted border in B
    pop af                     ; Get background color
    and #0F                    ; Ensure 0-15 range
    or b                       ; Combine: border << 4 | background
    ld b, a                    ; Value for VDP R#7
    ld c, 7                    ; VDP Register 7
    call WRTVDP                ; BIOS call to write VDP register
    pop af
    ret

load_screen:
    ; Load screen (A = screen ID)
    ; TODO: Implement screen loading logic
    ret

`,e.screenMaps.forEach((a,o)=>{const i=a.name.toUpperCase().replace(/[^A-Z0-9]/g,"_"),r=a.backgroundColor!==void 0?a.backgroundColor:1,c=a.borderColor!==void 0?a.borderColor:1;n+=`load_screen_${i.toLowerCase()}:
    ; Load ${a.name} screen (BIOS LDIRVM handles timing)
    ; Set VDP colors for this screen
    ld a, ${r}           ; Background color
    ld b, ${c}       ; Border color
    call set_screen_colors
    ; Load screen layout
    ld hl, SCREEN_${i}_${o}_LAYOUT
    ld de, NAMETBL
    ld bc, SCREEN_${i}_${o}_SIZE
    call LDIRVM                ; BIOS handles safe VRAM access
    ret

`});const t=e.worldmaps||[];t.length>0&&(n+=`; ==================================================================
; WORLDMAP LOADING FUNCTIONS (for GameFlow WorldLink nodes)
; ==================================================================

`,t.forEach(a=>{var s;const o=a.id,i=a.startScreenNodeId,r=(s=a.nodes)==null?void 0:s.find(l=>l.id===i),c=r==null?void 0:r.screenAssetId;if(c){const l=e.screenMaps.findIndex(m=>m.id===c),_=e.screenMaps[l];if(_){const m=_.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");n+=`load_world_${o.toLowerCase().replace(/[^a-z0-9]/g,"_")}:
    ; Load worldmap: ${a.name}
    ; Starting screen: ${_.name}
    call load_screen_${m.toLowerCase()}
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
    db 0, 1, 2, 3, 4, 5, 6, 7
    db 8, 9, 10, 11, 12, 13, 14, 15
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
`,n}function ht(e){var a,o,i;const n=(o=(a=e.gameFlow)==null?void 0:a.nodes)==null?void 0:o.some(r=>r.type==="SubMenu"),t=(i=e.screenMaps)==null?void 0:i.some(r=>{var c,s;return((c=r.layers)==null?void 0:c.text)||((s=r.textElements)==null?void 0:s.length)>0});return!n&&!t?`; ==================================================================
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
`}function H(e){return e.toLowerCase().replace(/[^a-z0-9]/g,"_")}function ne(e){return e.toUpperCase().replace(/[^A-Z0-9]/g,"_")}function Tt(e){const n=e.worldmaps||[];if(n.length===0)return`; ==================================================================
; WORLD MAPS (SKIPPED - NO WORLDS DETECTED)
; File: worlds.asm
; ==================================================================

; No worlds detected in project - world system not needed

; Minimal stub functions for compatibility
load_world_default:
    ret

; ==================================================================
; END OF WORLDS (MINIMAL VERSION)
; ==================================================================
`;let t=`; ==================================================================
; WORLD MAPS
; File: worlds.asm
; Description: World map structures and screen loading functions
; Generated by Mideas MSX Generator
; ==================================================================

`;return t+=`; ==================================================================
; WORLD MAP CONSTANTS
; ==================================================================

`,n.forEach((a,o)=>{var c,s,l;const i=ne(a.name||`world_${o}`),r=a.id||`world_${o}`;t+=`; World: ${a.name||"Unnamed"} (${r})
WORLD_${i}_ID EQU ${o}
WORLD_${i}_SCREEN_COUNT EQU ${((s=(c=a.data)==null?void 0:c.nodes)==null?void 0:s.length)||0}
`,(l=a.data)!=null&&l.nodes&&a.data.nodes.length>0&&a.data.nodes.forEach((_,m)=>{const p=ne(_.name||`screen_${m}`);t+=`WORLD_${i}_SCREEN_${p}_ID EQU ${m}
`}),t+=`
`}),t+=`; ==================================================================
; WORLD LOADING FUNCTIONS
; ==================================================================

`,n.forEach(a=>{var m,p,u;H(a.name||"unnamed");const o=a.id||"unknown",i=(m=a.data)==null?void 0:m.startScreenNodeId,r=((p=a.data)==null?void 0:p.nodes)||[];if(t+=`; ------------------------------------------------------------------
; Load World: ${a.name||"Unnamed"}
; World ID: ${o}
; Screens: ${r.length}
; Start Screen Node: ${i||"none"}
; ------------------------------------------------------------------
load_world_${H(o)}:
`,r.length===0){t+=`    ; No screens in this world
    ret

`;return}const s=(r.find(E=>E.id===i)||r[0]).screenAssetId;if(!s){t+=`    ; No valid start screen found
    ret

`;return}const l=(u=e.screens)==null?void 0:u.find(E=>E.id===s),_=(l==null?void 0:l.name)||"unknown";t+=`    ; Load start screen: ${_} (${s})
    call ${H("load_screen_"+s)}

    ; Initialize world state
    ld a, WORLD_${ne(a.name||"unnamed")}_ID
    ld (current_world_id), a

    ld a, ${r.findIndex(E=>E.id===i)}
    ld (current_screen_index), a

    ret

`}),t+=`; ==================================================================
; SCREEN TRANSITION FUNCTIONS
; ==================================================================

`,n.forEach(a=>{var c,s;const o=a.id||"unknown",i=((c=a.data)==null?void 0:c.nodes)||[],r=((s=a.data)==null?void 0:s.connections)||[];if(r.length===0){t+=`; World ${a.name||"Unnamed"} has no screen connections

`;return}t+=`; ------------------------------------------------------------------
; World: ${a.name||"Unnamed"}
; Connections: ${r.length}
; ------------------------------------------------------------------

`,r.forEach((l,_)=>{const m=i.find(E=>E.id===l.from||l.fromNodeId),p=i.find(E=>E.id===l.to||l.toNodeId);if(!m||!p){t+=`; Invalid connection ${_}: missing nodes

`;return}m.screenAssetId;const u=p.screenAssetId;t+=`; Transition: ${m.name||"screen"} -> ${p.name||"screen"}
transition_${H(o)}_${_}:
    call ${H("load_screen_"+u)}
    ret

`})}),t+=`; ==================================================================
; WORLD HELPER FUNCTIONS
; ==================================================================

; Get current world ID
; Output: A = current world ID
get_current_world_id:
    ld a, (current_world_id)
    ret

; Get current screen index
; Output: A = current screen index in world
get_current_screen_index:
    ld a, (current_screen_index)
    ret

; Set current screen
; Input: A = screen index
set_current_screen:
    ld (current_screen_index), a
    ret

; ==================================================================
; END OF WORLDS
; ==================================================================
`,t}function Q(e){e=e.replace("#","");const n=parseInt(e.substring(0,2),16),t=parseInt(e.substring(2,4),16),a=parseInt(e.substring(4,6),16);if(n<50&&t<50&&a<50)return 1;if(n>200&&t>200&&a>200)return 15;if(n>200&&t<100&&a<100)return 8;if(n<100&&t>200&&a<100)return 3;if(n<100&&t<100&&a>200)return 5;if(n>200&&t>200&&a<100)return 10;if(n>150&&t<100&&a>150)return 13;if(n<100&&t>150&&a>150)return 7;const o=(n+t+a)/3;return o<64?1:o<128?14:15}function ft(e){const n=e.gameFlow&&e.gameFlow.nodes&&e.gameFlow.nodes.some(a=>a.type==="SubMenu");if(!n)return`; ==================================================================
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

`,e.gameFlow.nodes.filter(r=>r.type==="SubMenu").forEach((r,c)=>{const s=(r.title||r.id).toUpperCase().replace(/[^A-Z0-9]/g,"_");t+=`MENU_${s}_ID EQU ${c}
`}),t+=`
; ==================================================================
; MENU FUNCTIONS
; ==================================================================

`,e.gameFlow.nodes.filter(r=>r.type==="SubMenu").forEach(r=>{var p,u,E,S;(r.title||r.id).toUpperCase().replace(/[^A-Z0-9]/g,"_");const c=r.id.replace(/[^a-zA-Z0-9]/g,"_"),s=((u=(p=r.appearance)==null?void 0:p.colors)==null?void 0:u.background)||"#000000",l=((S=(E=r.appearance)==null?void 0:E.colors)==null?void 0:S.border)||"#FFFFFF",_=Q(s),m=Q(l);t+=`show_menu_${c}:
    ; Display ${r.title||r.id} menu
    ; Set background color using VDP
    ld a, 7                     ; VDP Register 7 (text/background color)
    ld b, ${_*16}    ; Background color in high nibble
    call WRTVDP

    ; Set border color
    ld a, ${m}
    ld (FORCLR), a
    ld (BAKCLR), a
    ld (BDRCLR), a

    ; Clear screen with background color
    call cls

    ; Display menu title
    ld hl, menu_${c}_title
    ld de, NAMETBL + (5 * 32) + 10
    call print_string_screen2

    ; Display menu options
    ; TODO: Add option rendering logic here

    ret

menu_${c}_title:
    db "${(r.title||"Menu").replace(/"/g,'\\"')}", 0

handle_menu_${c}:
    ; Handle ${r.title||r.id} menu input
    call GTSTCK
    ; TODO: Implement input handling
    ret

`}),e.gameFlow.nodes.filter(r=>r.type==="Text").forEach(r=>{var p,u,E,S;const c=r.id.replace(/[^a-zA-Z0-9]/g,"_"),s=((u=(p=r.appearance)==null?void 0:p.colors)==null?void 0:u.background)||"#000000",l=((S=(E=r.appearance)==null?void 0:E.colors)==null?void 0:S.border)||"#FFFFFF",_=Q(s),m=Q(l);t+=`show_text_${c}:
    ; Display ${r.title||r.id} text
    ; Set background color using VDP
    ld a, 7                     ; VDP Register 7 (text/background color)
    ld b, ${_*16}    ; Background color in high nibble
    call WRTVDP

    ; Set border color
    ld a, ${m}
    ld (FORCLR), a
    ld (BAKCLR), a
    ld (BDRCLR), a

    ; Clear screen with background color
    call cls

    ; Display text title
    ld hl, text_${c}_title
    ld de, NAMETBL + (3 * 32) + 10
    call print_string_screen2

    ; Display text message
    ld hl, text_${c}_message
    ld de, NAMETBL + (6 * 32) + 5
    call print_string_screen2

    ; Wait for user input
    call wait_for_fire
    ret

text_${c}_title:
    db "${(r.title||"Text").replace(/"/g,'\\"')}", 0

text_${c}_message:
    db "${(r.message||"").replace(/"/g,'\\"')}", 0

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
    db "GAME TITLE", 0

txt_start:
    db "START GAME", 0

txt_exit:
    db "EXIT", 0

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
`,t}function gt(e,n,t={}){if(console.log("🔧 Generating modular ASM files..."),!e)throw console.error("❌ projectName is required"),new Error("projectName is required");if(!n)throw console.error("❌ assets is undefined or null"),new Error("assets array is required");if(!Array.isArray(n))throw console.error("❌ assets is not an array"),new Error("assets must be an array");console.log(`📊 Project: ${e}, Assets: ${n.length}, Config:`,t);let a;try{a=ae(e,n),console.log(`🔍 Analysis complete: ${a.sprites.length} sprites, ${a.tiles.length} tiles`)}catch(i){console.error("❌ Error analyzing project:",i),a={hasSprites:!1,hasTiles:!1,hasScreens:!1,hasEntities:!1,hasComponents:!1,hasGameFlow:!1,hasMenus:!1,hasFonts:!1,components:[],entities:[],sprites:[],tiles:[],screens:[],projectName:e,globalVariables:[]},console.log("🔄 Using fallback empty analysis")}const o={"bios.asm":je(),"constants.asm":Ve(a),"variables.asm":Ye(a),"header.asm":We(e,a),"patterns.asm":Ke(a),"colors.asm":Ze(a),"components.asm":mt(a),"entities.asm":ut(a),"worlds.asm":Tt(a),"screens.asm":Et(a),"sprites.asm":et(a),"font.asm":ht(a),"menus.asm":ft(a),"gameflow.asm":"","main.asm":Xe(e,a),"unitedFiles.asm":""};return t.generateUnified&&(o["unitedFiles.asm"]=Je(o,e,a)),console.log("✅ Modular ASM files generated successfully!"),console.log(`📊 Generated ${Object.keys(o).filter(i=>o[i]).length} files`),o}const Ln=Object.freeze(Object.defineProperty({__proto__:null,generateModularASM:gt},Symbol.toStringTag,{value:"Module"}));export{jt as $,j as A,En as B,un as C,yt as D,bt as E,De as F,Oe as G,me as H,Gt as I,Bt as J,be as K,Sn as L,Lt as M,tn as N,K as O,It as P,Tn as Q,fn as R,J as S,Cn as T,gn as U,Re as V,Ee as W,Qt as X,Ht as Y,Ut as Z,zt as _,vt as a,Xt as a0,Jt as a1,Kt as a2,Vt as a3,Yt as a4,Zt as a5,Wt as a6,qt as a7,x as a8,W as a9,wt as aa,Dt as ab,Rt as ac,ee as ad,In as ae,en as af,Me as ag,Nt as ah,ae as ai,Nn as aj,nn as ak,Mt as al,fe as am,xt as an,Ot as ao,an as ap,Ln as aq,Ft as b,Pt as c,z as d,rn as e,$t as f,on as g,kt as h,Se as i,Ae as j,M as k,At as l,Ct as m,X as n,sn as o,cn as p,dn as q,_n as r,ln as s,pn as t,V as u,Y as v,hn as w,mn as x,St as y,An as z};
