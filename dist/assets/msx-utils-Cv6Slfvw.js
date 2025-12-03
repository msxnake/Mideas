const Qt=[16,24,32];var $=(e=>(e.Score="Score",e.HighScore="HighScore",e.Lives="Lives",e.EnergyBar="EnergyBar",e.ItemDisplay="ItemDisplay",e.SceneName="SceneName",e.MiniMap="MiniMap",e.CoinCounter="CoinCounter",e.BossEnergyBar="BossEnergyBar",e.PhaseIndicator="PhaseIndicator",e.AttackAlert="AttackAlert",e.TextBox="TextBox",e.NumericField="NumericField",e.CustomCounter="CustomCounter",e))($||{});const Le={water:{bit:0,label:"Water Effect",maskValue:1,color:"rgba(50, 100, 200, 0.4)"},customGravity:{bit:1,label:"Custom Gravity",maskValue:2,color:"rgba(150, 50, 200, 0.4)"},icePhysics:{bit:2,label:"Ice Physics",maskValue:4,color:"rgba(100, 200, 255, 0.4)"},spriteConceal:{bit:3,label:"Sprite Concealment",maskValue:8,color:"rgba(100, 100, 100, 0.4)"}};var De=(e=>(e.None="None",e.Tile="Tile",e.Sprite="Sprite",e.Screen="Screen",e.Code="Code",e.Attributes="Attributes",e.Sound="Sound",e.Platformer="Platformer",e.WorldMap="WorldMap",e.Track="Track",e.HUD="HUD",e.TileBanks="TileBanks",e.Font="Font",e.HelpDocs="HelpDocs",e.BehaviorEditor="BehaviorEditor",e.ComponentDefinitionEditor="ComponentDefinitionEditor",e.EntityTemplateEditor="EntityTemplateEditor",e.Boss="Boss",e.WorldView="WorldView",e.GameFlow="GameFlow",e.MainMenu="MainMenu",e.StateMachine="StateMachine",e.GlobalVariables="GlobalVariables",e.Palette="Palette",e))(De||{});const Xt=[1,3,5,7],Kt=[{id:0,name:"NoSolid (Passable)",isSolid:!1},{id:1,name:"Solid (Wall/Ground)",isSolid:!0},{id:2,name:"Platform (Top-Solid)",isSolid:!0},{id:3,name:"Slope (Solid)",isSolid:!0}],Zt={isBreakable:{bit:0,label:"Breakable"},isMovable:{bit:1,label:"Movable"},causesDamage:{bit:2,label:"Deadly"},isInteractiveSwitch:{bit:3,label:"Interactable"}},Jt="0.266",q=[{name:"Transparent",hex:"rgba(0,0,0,0)"},{name:"Black",hex:"#000000"},{name:"Medium Green",hex:"#3EB847"},{name:"Light Green",hex:"#74D07D"},{name:"Dark Blue",hex:"#2F2FC1"},{name:"Light Blue",hex:"#5858FC"},{name:"Dark Red",hex:"#B63125"},{name:"Cyan",hex:"#68D2DA"},{name:"Medium Red",hex:"#FC584A"},{name:"Light Red",hex:"#FF8E81"},{name:"Dark Yellow",hex:"#C0BF3B"},{name:"Light Yellow",hex:"#E7E474"},{name:"Dark Green",hex:"#309337"},{name:"Magenta",hex:"#B640C8"},{name:"Gray",hex:"#999999"},{name:"White",hex:"#FFFFFF"}],k=[{name:"Transparent (Backdrop)",hex:"rgba(0,0,0,0)",index:0},{name:"Black",hex:"#000000",index:1},{name:"Medium Green",hex:"#21C842",index:2},{name:"Light Green",hex:"#5EDC78",index:3},{name:"Dark Blue",hex:"#5455ED",index:4},{name:"Light Blue",hex:"#7D76FC",index:5},{name:"Dark Red",hex:"#D4524D",index:6},{name:"Cyan",hex:"#42EBF5",index:7},{name:"Medium Red",hex:"#FC5554",index:8},{name:"Light Red",hex:"#FF7978",index:9},{name:"Dark Yellow",hex:"#D4C154",index:10},{name:"Light Yellow",hex:"#E6CE80",index:11},{name:"Dark Green",hex:"#21B03B",index:12},{name:"Magenta",hex:"#C95BBA",index:13},{name:"Gray",hex:"#CCCCCC",index:14},{name:"White",hex:"#FFFFFF",index:15}],G=[0,36,73,109,146,182,219,255],Q=e=>e.toString(16).padStart(2,"0").toUpperCase(),qt=(()=>{const e=[];for(let n=0;n<G.length;n++)for(let t=0;t<G.length;t++)for(let a=0;a<G.length;a++){const o=n<<6|t<<3|a;e.push({index:o,hex:`#${Q(G[n])}${Q(G[t])}${Q(G[a])}`,rLevel:n,gLevel:t,bLevel:a})}return e})(),de=e=>{let n=0,t=1/0;return G.forEach((a,o)=>{const i=Math.abs(a-e);i<t&&(t=i,n=o)}),n},Re=e=>!e||!e.startsWith("#")||e.length!==7?"#000000":e.toUpperCase(),Oe=e=>{const n=Re(e),t=parseInt(n.slice(1,3),16),a=parseInt(n.slice(3,5),16),o=parseInt(n.slice(5,7),16),i=de(t),r=de(a),s=de(o),l=`#${Q(G[i])}${Q(G[r])}${Q(G[s])}`,d=i<<6|r<<3|s;return{hex:l,masterIndex:d}},en=q.map((e,n)=>{if(n===0)return{slotIndex:0,masterIndex:-1,hex:"rgba(0,0,0,0)"};const t=Oe(e.hex);return{slotIndex:n,masterIndex:t.masterIndex,hex:t.hex}}),tn=[8,16,24,32],nn=16,an=16,on=16,j=32,oe=24,W=8,z=255,rn="SCREEN 2 (Graphics I)",ln=["ADC","ADD","AND","BIT","CALL","CCF","CP","CPD","CPDR","CPI","CPIR","CPL","DAA","DEC","DI","DJNZ","EI","EX","EXX","HALT","IM","IN","INC","IND","INDR","INI","INIR","JP","JR","LD","LDD","LDDR","LDI","LDIR","NEG","NOP","OR","OTDR","OTIR","OUT","OUTD","OUTI","POP","PUSH","RES","RET","RETI","RETN","RL","RLA","RLC","RLCA","RLD","RR","RRA","RRC","RRCA","RRD","RST","SBC","SCF","SET","SLA","SLL","SRA","SRL","SUB","XOR"],sn=["A","F","B","C","D","E","H","L","AF","BC","DE","HL","IXH","IXL","IYH","IYL","IX","IY","SP","PC","I","R","AF'"],dn=["NZ","Z","NC","C","PO","PE","P","M"],cn=[".ORG","ORG","END",".END",".EQU","EQU",".DB","DB",".BYTE","BYTE","DEFB",".DW","DW",".WORD","WORD","DEFW",".DS","DS",".BLOCK","BLOCK","DEFS",".DEFINE","DEFINE",".MACRO","MACRO",".ENDM","ENDM",".IF","IF",".ENDIF","ENDIF",".ELSE","ELSE",".INCLUDE","INCLUDE",".DEFM","DEFM",".ZILOG",".PHASE",".REPT",".ENDR",".SEARCH",".RANDOM",".ROM",".MEGAROM",".BASIC",".CAS",".WAV",".MSXDOS"],_n=[{id:"pac_man_collection",name:"Pac-Man Tile Collection",code:`; Pac-Man Style Tile Collection System for MSX
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
POWER_MODE:         DB 0       ; Power-up mode active flag`}],pn=[],se=8,ee=15,te=1;var fe;const mn=((fe=k.find(e=>e.index===ee))==null?void 0:fe.hex)||k[15].hex;var ge;const un=((ge=k.find(e=>e.index===te))==null?void 0:ge.hex)||k[1].hex,ie=new Map(k.map(e=>[e.hex,e])),hn=new Map(k.map(e=>[e.index,e])),En=k[1],Tn=32,Sn=125,An=6,In=31,fn=15,gn=["A","B","C"],Cn=["1","2","3","4","5"],yn=["C-","C#","D-","D#","E-","F-","F#","G-","G#","A-","A#","B-"],bn=[0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,7,7,6,6,5,5,4,4,3,3,2,2,1,1,0,0],Nn=32,Ln={q:{noteNameIndex:0,baseOctave:5},w:{noteNameIndex:1,baseOctave:5},e:{noteNameIndex:2,baseOctave:5},r:{noteNameIndex:3,baseOctave:5},t:{noteNameIndex:4,baseOctave:5},y:{noteNameIndex:5,baseOctave:5},u:{noteNameIndex:6,baseOctave:5},i:{noteNameIndex:7,baseOctave:5},o:{noteNameIndex:8,baseOctave:5},p:{noteNameIndex:9,baseOctave:5},"[":{noteNameIndex:10,baseOctave:5},"]":{noteNameIndex:11,baseOctave:5},a:{noteNameIndex:0,baseOctave:4},s:{noteNameIndex:1,baseOctave:4},d:{noteNameIndex:2,baseOctave:4},f:{noteNameIndex:3,baseOctave:4},g:{noteNameIndex:4,baseOctave:4},h:{noteNameIndex:5,baseOctave:4},j:{noteNameIndex:6,baseOctave:4},k:{noteNameIndex:7,baseOctave:4},l:{noteNameIndex:8,baseOctave:4},ñ:{noteNameIndex:9,baseOctave:4},";":{noteNameIndex:9,baseOctave:4},"'":{noteNameIndex:10,baseOctave:4},z:{noteNameIndex:0,baseOctave:3},x:{noteNameIndex:1,baseOctave:3},c:{noteNameIndex:2,baseOctave:3},v:{noteNameIndex:3,baseOctave:3},b:{noteNameIndex:4,baseOctave:3},n:{noteNameIndex:5,baseOctave:3},m:{noteNameIndex:6,baseOctave:3},",":{noteNameIndex:7,baseOctave:3},".":{noteNameIndex:8,baseOctave:3},2:{noteNameIndex:1,baseOctave:5},3:{noteNameIndex:3,baseOctave:5},5:{noteNameIndex:6,baseOctave:5},6:{noteNameIndex:8,baseOctave:5},7:{noteNameIndex:10,baseOctave:5}},Dn={min:-2,max:2},Rn=[{id:1,name:"Piano",volumeEnvelope:[15,14,13,11,9,7,5,3,2,1,0],toneEnvelope:[0],volumeLoop:255,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:0},{id:2,name:"Electric Bass",volumeEnvelope:[15,14,13,12,11,10,9,8],toneEnvelope:[0],volumeLoop:3,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:12},{id:3,name:"Lead Vibrato",volumeEnvelope:[0,5,10,15,15,15,14,13,12],toneEnvelope:[0,1,2,1,0,-1,-2,-1],volumeLoop:4,toneLoop:0,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:13},{id:4,name:"Strings Pad",volumeEnvelope:[0,2,4,6,8,10,12,14,15,15,15],toneEnvelope:[0,0,1,1,0,0,-1,-1],volumeLoop:8,toneLoop:0,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:13},{id:5,name:"Kick Drum",volumeEnvelope:[15,13,10,7,4,2,0],toneEnvelope:[12,10,8,6,4,2,0],volumeLoop:255,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:0},{id:6,name:"Snare Drum",volumeEnvelope:[15,12,9,6,3,1,0],toneEnvelope:[0],volumeLoop:255,toneLoop:255,ayToneEnabled:!1,ayNoiseEnabled:!0,ayEnvelopeShape:0},{id:7,name:"Hi-Hat",volumeEnvelope:[12,10,8,6,4,2,0],toneEnvelope:[0],volumeLoop:255,toneLoop:255,ayToneEnabled:!1,ayNoiseEnabled:!0,ayEnvelopeShape:0},{id:8,name:"Arpeggio",volumeEnvelope:[15,15,14,14,13,13,12,12],toneEnvelope:[0,4,7,12,7,4,0],volumeLoop:0,toneLoop:0,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:10},{id:9,name:"Organ",volumeEnvelope:[15,15,15,15,15],toneEnvelope:[0],volumeLoop:0,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:13},{id:10,name:"Bell",volumeEnvelope:[15,14,12,10,8,6,4,3,2,1,0],toneEnvelope:[0,12,0],volumeLoop:255,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:0}],Me=[{id:"bank_0",name:"Bank 0 - HUD/Fonts",enabled:!0,vramPatternStart:0,vramColorStart:8192,screenZone:{x:0,y:0,width:j,height:8},charsetRangeStart:0,charsetRangeEnd:255,defaultFgColorIndex:15,defaultBgColorIndex:4,isLocked:!1,assignedTiles:{}},{id:"bank_1",name:"Bank 1 - Game Tileset",enabled:!0,vramPatternStart:2048,vramColorStart:10240,screenZone:{x:0,y:8,width:j,height:8},charsetRangeStart:0,charsetRangeEnd:255,defaultFgColorIndex:2,defaultBgColorIndex:1,isLocked:!1,assignedTiles:{}},{id:"bank_2",name:"Bank 2 - Background/Status",enabled:!0,vramPatternStart:4096,vramColorStart:12288,screenZone:{x:0,y:16,width:j,height:8},charsetRangeStart:0,charsetRangeEnd:255,defaultFgColorIndex:11,defaultBgColorIndex:6,isLocked:!1,assignedTiles:{}}],On={isEnabled:!0,options:[{id:"start",label:"INICIAR PARTIDA",enabled:!0},{id:"continue",label:"CONTINUAR",enabled:!0},{id:"settings",label:"AJUSTES",enabled:!0},{id:"help",label:"AYUDA",enabled:!1}],keyMapping:{up:"ArrowUp",down:"ArrowDown",left:"ArrowLeft",right:"ArrowRight",fire1:" ",fire2:"m"},settings:{volume:12},continueScreen:{title:"CONTINUAR PARTIDA",prompt:"INTRODUCE TU CODIGO"},introScreen:{text:`EN EL ANO 2084, LA CORPORACION CYBERNETICA DOMINA EL MUNDO...

SOLO UN HEROE PUEDE DETENERLOS.`,backgroundAssetId:null},menuScreenAssetId:null,cursorSpriteAssetId:null,menuColors:{text:k[15].hex,background:k[4].hex,highlightText:k[11].hex,highlightBackground:k[5].hex,border:k[15].hex}},Mn=Le,Pn="HELP_DOCS_SYSTEM_ASSET",vn=50,ce=[{name:"Goal",asmName:"global_var_goal",constantPrefix:"GOAL_",type:"byte",description:"Current objective status",category:"objective",values:[{label:"Failure",value:0,asmConstant:"GOAL_FAILURE"},{label:"Completed",value:1,asmConstant:"GOAL_COMPLETED"},{label:"Partial",value:2,asmConstant:"GOAL_PARTIAL"}]},{name:"MissionStatus",asmName:"global_var_mission_status",constantPrefix:"MISSION_",type:"byte",description:"Current mission state",category:"objective",values:[{label:"NotStarted",value:0,asmConstant:"MISSION_NOT_STARTED"},{label:"Active",value:1,asmConstant:"MISSION_ACTIVE"},{label:"Completed",value:2,asmConstant:"MISSION_COMPLETED"},{label:"Failed",value:3,asmConstant:"MISSION_FAILED"}]},{name:"LevelCompleted",asmName:"global_var_level_completed",constantPrefix:"BOOL_",type:"byte",description:"Level completion flag",category:"objective",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"BossDefeated",asmName:"global_var_boss_defeated",constantPrefix:"BOOL_",type:"byte",description:"Boss defeated flag",category:"objective",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"AllItemsCollected",asmName:"global_var_all_items_collected",constantPrefix:"BOOL_",type:"byte",description:"All items collected flag",category:"objective",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"Score",asmName:"global_var_score",constantPrefix:"SCORE_",type:"word",description:"Current player score (0-65535)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"HiScore",asmName:"global_var_hi_score",constantPrefix:"HISCORE_",type:"word",description:"High score record (0-65535)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"ComboMultiplier",asmName:"global_var_combo_multiplier",constantPrefix:"COMBO_",type:"byte",description:"Combo multiplier (1x, 2x, 3x...)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"Coins",asmName:"global_var_coins",constantPrefix:"COINS_",type:"byte",description:"Coins collected (0-255)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"Gems",asmName:"global_var_gems",constantPrefix:"GEMS_",type:"byte",description:"Gems collected (0-255)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"Lives",asmName:"global_var_lives",constantPrefix:"LIVES_",type:"byte",description:"Remaining lives (0-255)",category:"player",values:[{label:"Custom Value",value:"number"}]},{name:"Health",asmName:"global_var_health",constantPrefix:"HEALTH_",type:"byte",description:"Current health (0-255)",category:"player",values:[{label:"Custom Value",value:"number"}]},{name:"Energy",asmName:"global_var_energy",constantPrefix:"ENERGY_",type:"byte",description:"Current energy/mana (0-255)",category:"player",values:[{label:"Custom Value",value:"number"}]},{name:"Shield",asmName:"global_var_shield",constantPrefix:"BOOL_",type:"byte",description:"Shield active flag",category:"player",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"HasKey",asmName:"global_var_has_key",constantPrefix:"BOOL_",type:"byte",description:"Has key item",category:"inventory",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"HasSword",asmName:"global_var_has_sword",constantPrefix:"BOOL_",type:"byte",description:"Has sword item",category:"inventory",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"HasMap",asmName:"global_var_has_map",constantPrefix:"BOOL_",type:"byte",description:"Has map item",category:"inventory",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"ItemCount",asmName:"global_var_item_count",constantPrefix:"ITEMS_",type:"byte",description:"Special items collected (0-255)",category:"inventory",values:[{label:"Custom Value",value:"number"}]},{name:"PowerUpActive",asmName:"global_var_powerup_active",constantPrefix:"POWERUP_",type:"byte",description:"Active power-up type",category:"inventory",values:[{label:"None",value:0,asmConstant:"POWERUP_NONE"},{label:"Speed",value:1,asmConstant:"POWERUP_SPEED"},{label:"Jump",value:2,asmConstant:"POWERUP_JUMP"},{label:"Invincible",value:3,asmConstant:"POWERUP_INVINCIBLE"}]},{name:"CurrentWorld",asmName:"global_var_current_world",constantPrefix:"WORLD_",type:"byte",description:"Current world number (1-8)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"CurrentLevel",asmName:"global_var_current_level",constantPrefix:"LEVEL_",type:"byte",description:"Current level number (0-255)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"CheckpointReached",asmName:"global_var_checkpoint",constantPrefix:"CHECKPOINT_",type:"byte",description:"Checkpoint reached (0-255)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"SecretFound",asmName:"global_var_secret_found",constantPrefix:"BOOL_",type:"byte",description:"Secret area found flag",category:"progress",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"DoorsUnlocked",asmName:"global_var_doors_unlocked",constantPrefix:"DOORS_",type:"byte",description:"Doors unlocked bitmask (0-255)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"TimeRemaining",asmName:"global_var_time_remaining",constantPrefix:"TIME_",type:"word",description:"Time remaining in seconds (0-65535)",category:"time",values:[{label:"Custom Value",value:"number"}]},{name:"TimeLimitActive",asmName:"global_var_time_limit_active",constantPrefix:"BOOL_",type:"byte",description:"Time limit active flag",category:"time",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"DayNightCycle",asmName:"global_var_day_night_cycle",constantPrefix:"TIME_",type:"byte",description:"Day/night cycle state (0-23)",category:"time",values:[{label:"Custom Value",value:"number"}]},{name:"DifficultyLevel",asmName:"global_var_difficulty",constantPrefix:"DIFFICULTY_",type:"byte",description:"Game difficulty level",category:"difficulty",values:[{label:"Easy",value:0,asmConstant:"DIFFICULTY_EASY"},{label:"Normal",value:1,asmConstant:"DIFFICULTY_NORMAL"},{label:"Hard",value:2,asmConstant:"DIFFICULTY_HARD"},{label:"Expert",value:3,asmConstant:"DIFFICULTY_EXPERT"}]},{name:"EnemiesDefeated",asmName:"global_var_enemies_defeated",constantPrefix:"ENEMIES_",type:"word",description:"Enemies defeated count (0-65535)",category:"special",values:[{label:"Custom Value",value:"number"}]},{name:"PerfectRun",asmName:"global_var_perfect_run",constantPrefix:"BOOL_",type:"byte",description:"Perfect run (no damage) flag",category:"special",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]}],F=8,Pe=e=>{let n=e.toString(16).toUpperCase();return n.length===1&&(n="0"+n),n},Un=(e,n,t)=>{var c,_;if(!e.lineAttributes)return`;; ERROR: Tile ${n} is missing line attributes required for SCREEN 2 export.
`;const a=n.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let o=`;; Tile: ${n} (${e.width}x${e.height})
`;o+=`;; Structure: ${e.width/F}x${e.height/F} character blocks (8x8 pixels each)
`,o+=`;; Data format: ${t.toUpperCase()}

`;const i=e.width/F,r=e.height/F,s=p=>t==="hex"?`$${Pe(p)}`:p.toString(10),l=[],d=[];for(let p=0;p<r;p++)for(let u=0;u<i;u++){const E=`;; Character Block (${u}, ${p}) for ${a}`,g=[];for(let S=0;S<F;S++){const m=p*F+S;let b=0;if(e.lineAttributes[m]&&e.lineAttributes[m][u]){const T=e.lineAttributes[m][u].fg;for(let f=0;f<F;f++){const y=u*F+f;e.data[m]&&e.data[m][y]!==void 0&&e.data[m][y]===T&&(b|=1<<7-f)}}g.push(b)}const N=g.map(s).join(",");l.push({comment:`${E} - PATTERN Data (8 bytes):`,dataString:`DB ${N}`});const A=[];for(let S=0;S<F;S++){const m=p*F+S;let b=ee<<4|te;if(e.lineAttributes[m]&&e.lineAttributes[m][u]){const T=e.lineAttributes[m][u],f=((c=ie.get(T.fg))==null?void 0:c.index)??ee,y=((_=ie.get(T.bg))==null?void 0:_.index)??te;b=f<<4|y}A.push(b)}const C=A.map(s).join(",");d.push({comment:`${E} - COLOR Attribute Data (8 bytes - FG|BG):`,dataString:`DB ${C}`})}return o+=`;; --- PATTERN DATA ---
`,l.length>0?(o+=`${a}_PATTERN_DATA:
`,l.forEach(p=>{o+=`${p.comment}
`,o+=`    ${p.dataString}
`})):o+=`;; No pattern data generated.
`,o+=`
`,o+=`;; --- COLOR ATTRIBUTE DATA ---
`,d.length>0?(o+=`${a}_COLOR_DATA:
`,d.forEach(p=>{o+=`${p.comment}
`,o+=`    ${p.dataString}
`})):o+=`;; No color attribute data generated.
`,o+=`
;; End of Tile Data for ${a}
`,o},Fn=(e,n,t,a)=>{const o=Math.max(1,e/se);return Array(n).fill(null).map(()=>Array(o).fill(null).map(()=>({fg:t,bg:a})))},ve=(e,n)=>{var r,s,l,d;const t=[],a=e.width/F,o=e.height/F,i=n==="SCREEN 2 (Graphics I)";for(let c=0;c<o;c++)for(let _=0;_<a;_++)for(let p=0;p<F;p++){const u=c*F+p;let E=0,g;i&&e.lineAttributes&&e.lineAttributes[u]&&e.lineAttributes[u][_]&&(g=e.lineAttributes[u][_].fg);for(let N=0;N<F;N++){const A=_*F+N,C=(r=e.data[u])==null?void 0:r[A];if(C!==void 0){let S=!1;i&&g?S=C===g:i||(S=C!==q[0].hex&&C!==((d=(l=(s=e.lineAttributes)==null?void 0:s[0])==null?void 0:l[0])==null?void 0:d.bg)),S&&(E|=1<<7-N)}}t.push(E)}return new Uint8Array(t)},X=(e,n)=>{var i,r;const t=e.length;if(t===0)return[];const a=((i=e[0])==null?void 0:i.length)||0;if(a===0)return[[]];const o=e.map(s=>[...s]);for(let s=0;s<t;s++)for(let l=0;l<a;l++){const d=Math.floor(l/se),c=(r=n[s])==null?void 0:r[d],_=o[s][l];c&&_!==c.fg&&_!==c.bg&&(o[s][l]=c.fg)}return o},xn=(e,n,t)=>{if(e.length<2)return e;const o=e.slice(1);return o.push([...e[0]]),t==="SCREEN 2 (Graphics I)"&&n?X(o,n):o},wn=(e,n,t)=>{const a=e.length;if(a<2)return e;const o=e.slice(0,a-1);return o.unshift([...e[a-1]]),t==="SCREEN 2 (Graphics I)"&&n?X(o,n):o},$n=(e,n,t)=>{if(e.length===0)return[];const a=e.map(o=>{if(o.length<2)return[...o];const i=o.slice(1);return i.push(o[0]),i});return t==="SCREEN 2 (Graphics I)"&&n?X(a,n):a},kn=(e,n,t)=>{if(e.length===0)return[];const a=e.map(o=>{const i=o.length;if(i<2)return[...o];const r=o.slice(0,i-1);return r.unshift(o[i-1]),r});return t==="SCREEN 2 (Graphics I)"&&n?X(a,n):a},Bn=(e,n,t)=>{if(e.length===0)return[];const a=e.map(o=>[...o].reverse());return t==="SCREEN 2 (Graphics I)"&&n?X(a,n):a},Gn=(e,n,t)=>{if(e.length===0)return[];const a=[...e].reverse();return t==="SCREEN 2 (Graphics I)"&&n?X(a,n):a},Ue=e=>{var o,i,r;if(!e.lineAttributes)return null;const n=[],t=e.width/F,a=e.height/F;for(let s=0;s<a;s++)for(let l=0;l<t;l++)for(let d=0;d<F;d++){const c=s*F+d;let _=ee<<4|te;const p=(o=e.lineAttributes[c])==null?void 0:o[l];if(p){const u=((i=ie.get(p.fg))==null?void 0:i.index)??ee,E=((r=ie.get(p.bg))==null?void 0:r.index)??te;_=u<<4|E}n.push(_)}return new Uint8Array(n)},Hn=e=>{const n=[];e.frames.forEach(a=>{var o;for(let i=0;i<e.spritePalette.length;i++){const r=e.spritePalette[i];if(r===e.backgroundColor)continue;let s=!1;const l=[];for(let d=0;d<e.size.height;d++)for(let c=0;c<Math.ceil(e.size.width/8);c++){let _=0;for(let p=0;p<8;p++){const u=c*8+p;u<e.size.width&&((o=a.data[d])==null?void 0:o[u])===r&&(_|=1<<7-p,s=!0)}l.push(_)}s&&n.push(l)}});const t=n.flat();return new Uint8Array(t)},Vn=e=>e.map(n=>[...n].reverse()),jn=e=>[...e].reverse(),Fe=e=>{let n=e.toString(16).toUpperCase();return n.length===1&&(n="0"+n),n},xe=(e,n,t,a,o,i,r="hex")=>{var _,p;const l=e.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let d=`;; ---- Sprite Frame: ${e} ----
`;d+=`;; Size: ${o}x${i}
`;let c=0;for(let u=0;u<t.length;u++){const E=t[u];let g=!1;if(E!==a)for(let A=0;A<i;A++){for(let C=0;C<o;C++)if(((_=n[A])==null?void 0:_[C])===E){g=!0;break}if(g)break}if(!g){d+=`;; Layer ${u} (Color: ${E}) - SKIPPED (color not used or is background)
`;continue}c++,d+=`${l}_LAYER${u}: ; Brush Color Index ${u} (Actual Color: ${E})
`;const N=[];o%8!==0&&(d+=`;; WARNING: Sprite width ${o} is not a multiple of 8. Bitmask generation might be problematic for standard VDP.
`);for(let A=0;A<i;A++)for(let C=0;C<Math.ceil(o/8);C++){let S=0;for(let m=0;m<8;m++){const b=C*8+m;b<o&&((p=n[A])==null?void 0:p[b])===E&&(S|=1<<7-m)}N.push(S)}for(let A=0;A<N.length;A+=16){const S=N.slice(A,A+16).map(m=>r==="hex"?`#${Fe(m)}`:m.toString());d+=`    DB ${S.join(",")}
`}d+=`
`}return c===0&&(d+=`;; NO ACTIVE LAYERS EXPORTED for ${e} - Frame might be empty or only contain the background color.
`),d+=`;; ---- End of Frame: ${e} ----

`,d},we=(e,n="hex",t)=>{let a=`;; Sprite: ${e.name}
`;a+=`;; Total Frames: ${e.frames.length}
`,a+=`;; Size: ${e.size.width}x${e.size.height}
`,a+=`;; Background Color (not exported as a layer): ${e.backgroundColor}
`,a+=`;; Drawable Palette (Hex): C0=${e.spritePalette[0]}, C1=${e.spritePalette[1]}, C2=${e.spritePalette[2]}, C3=${e.spritePalette[3]}

`;const o=t!==void 0?`_${t}`:"",i=e.name+o,r=i.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();return a+=`SPRITE_${r}_WIDTH     EQU ${e.size.width}
`,a+=`SPRITE_${r}_HEIGHT    EQU ${e.size.height}
`,a+=`SPRITE_${r}_FRAMES    EQU ${e.frames.length}

`,e.frames.forEach((s,l)=>{a+=xe(`${i}_F${l}`,s.data,e.spritePalette,e.backgroundColor,e.size.width,e.size.height,n)}),a},_e=16,Ce="SCREEN 2 (Graphics I)",$e="SCREEN 5 (Graphics III)",V=8,ke={pixelWidth:j*_e,pixelHeight:oe*_e,widthTiles:j,heightTiles:oe,baseTileSize:_e},he={[Ce]:{pixelWidth:j*W,pixelHeight:oe*W,widthTiles:j,heightTiles:oe,baseTileSize:W},[$e]:{pixelWidth:256,pixelHeight:212,widthTiles:32,heightTiles:27,baseTileSize:W},"SCREEN 0 (Text 40)":{pixelWidth:240,pixelHeight:192,widthTiles:40,heightTiles:24,baseTileSize:V},"SCREEN 1 (Text 32)":{pixelWidth:256,pixelHeight:192,widthTiles:32,heightTiles:24,baseTileSize:V},"SCREEN 3 (Multicolor)":{pixelWidth:256,pixelHeight:192,widthTiles:32,heightTiles:24,baseTileSize:V},"SCREEN 4 (Graphics II)":{pixelWidth:256,pixelHeight:192,widthTiles:32,heightTiles:24,baseTileSize:V},"SCREEN 6 (Graphics IV)":{pixelWidth:512,pixelHeight:212,widthTiles:64,heightTiles:27,baseTileSize:V},"SCREEN 7 (Graphics V)":{pixelWidth:512,pixelHeight:212,widthTiles:64,heightTiles:27,baseTileSize:V},"SCREEN 8 (Graphics VI)":{pixelWidth:256,pixelHeight:212,widthTiles:32,heightTiles:27,baseTileSize:V}};function Yn(e){const n=typeof e=="string"?e.trim():"";return n&&he[n]?he[n]:ke}const re=e=>e===Ce,Be=e=>re(e)?k:q,Ge=(e,n)=>{const t=Be(n);if(e===void 0||e<0||e>=t.length)return re(n)?k[1].hex:q[4].hex;const a=t[e];return(a==null?void 0:a.hex)??(re(n)?k[1].hex:q[4].hex)},zn=(e,n,t,a)=>{var p;const o=e.layers.background,i=e.activeAreaX??0,r=e.activeAreaY??0,s=e.activeAreaWidth??e.width,l=e.activeAreaHeight??e.height,d=[];let c=0;const _=new Map;for(let u=0;u<l;u++){const E=r+u;for(let g=0;g<s;g++){const N=i+g;if(E>=o.length||N>=((p=o[E])==null?void 0:p.length)){d.push(z);continue}const A=o[E][N];if(!A||!A.tileId)d.push(z);else{let C=z;const S=n.find(m=>m.id===A.tileId);if(a==="SCREEN 2 (Graphics I)"&&t&&S){let m=!1,b={tileId:A.tileId,position:{x:N,y:E},attempts:[],banksReceived:t.length};typeof globalThis.screenUtils_firstTileLogged>"u"&&(console.log("🔍 First tile structure check:",{tileId:A.tileId,position:{x:N,y:E},banksCount:t.length,banks:t.map(T=>({name:T.name,assignedTileIds:Object.keys(T.assignedTiles||{}),hasThisTile:!!(T.assignedTiles&&T.assignedTiles[A.tileId]),assignedTilesType:typeof T.assignedTiles,assignedTilesSample:T.assignedTiles?Object.entries(T.assignedTiles).slice(0,2):[]}))}),globalThis.screenUtils_firstTileLogged=!0);for(const T of t)if((T.enabled??!0)&&T.assignedTiles[A.tileId]){const f=T.assignedTiles[A.tileId].charCode,y=Math.ceil(S.width/W),L=A.subTileX||0,h=A.subTileY||0;C=f+h*y+L;const D=C>=T.charsetRangeStart&&C<=T.charsetRangeEnd;if(b.attempts.push({bankName:T.name,baseCharCode:f,calculated:C,range:`${T.charsetRangeStart}-${T.charsetRangeEnd}`,inRange:D}),D){m=!0;break}else C=z}else b.attempts.push({bankName:T.name,reason:"Tile not assigned to this bank"});m||(console.warn("⚠️ Tile not found in valid range:",b),C=z)}else if(a!=="SCREEN 2 (Graphics I)"){const m=`${A.tileId}_${A.subTileX??0}_${A.subTileY??0}`;_.has(m)?C=_.get(m):c>255?C=z:(_.set(m,c),C=c++)}d.push(C)}}}return new Uint8Array(d)},He=(e,n,t,a,o,i="hex")=>{const s=e.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let l=`;; MAP: ${e} (${n}x${t} tiles)
`;l+=`;; Total size: ${a.length} bytes

`,o.length>0&&(l+=`;; --- TILE INDEX REFERENCES for ${s} ---
`,l+=o.join(`
`)+`

`),l+=`SCREEN_${s}_WIDTH     EQU ${n}
`,l+=`SCREEN_${s}_HEIGHT    EQU ${t}
`,l+=`SCREEN_${s}_SIZE      EQU ${a.length}

`,l+=`SCREEN_${s}_LAYOUT:
`;for(let d=0;d<a.length;d+=16){const _=a.slice(d,d+16).map(p=>i==="hex"?`#${p.toString(16).padStart(2,"0").toUpperCase()}`:p.toString());l+=`    DB ${_.join(",")}
`}return l},Ve=(e,n,t,a,o="hex")=>{const r=e.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let s=`;; BEHAVIOR MAP: ${e} (${n}x${t} tiles)
`;s+=`;; Total size: ${a.length} bytes (Map IDs 0-255)
`,s+=`;; Data format: ${o.toUpperCase()}

`,s+=`BEHAVIOR_${r}_WIDTH     EQU ${n}
`,s+=`BEHAVIOR_${r}_HEIGHT    EQU ${t}
`,s+=`BEHAVIOR_${r}_SIZE      EQU ${a.length}

`,s+=`BEHAVIOR_${r}_DATA:
`;const l=d=>o==="hex"?`#${d.toString(16).padStart(2,"0").toUpperCase()}`:d.toString(10);for(let d=0;d<a.length;d+=16){const _=a.slice(d,d+16).map(l);s+=`    DB ${_.join(",")}
`}return s+=`
;; End of Behavior Map Data for ${e}
`,s},Wn=(e,n)=>{if(e.width!==n.width||e.height!==n.height||e.data.length!==n.data.length)return!1;for(let t=0;t<e.height;t++){if(e.data[t].length!==n.data[t].length)return!1;for(let a=0;a<e.width;a++)if(e.data[t][a]!==n.data[t][a])return!1}if(e.lineAttributes&&n.lineAttributes){if(e.lineAttributes.length!==n.lineAttributes.length)return!1;for(let t=0;t<e.lineAttributes.length;t++){if(e.lineAttributes[t].length!==n.lineAttributes[t].length)return!1;for(let a=0;a<e.lineAttributes[t].length;a++)if(e.lineAttributes[t][a].fg!==n.lineAttributes[t][a].fg||e.lineAttributes[t][a].bg!==n.lineAttributes[t][a].bg)return!1}}else if(e.lineAttributes!==n.lineAttributes)return!1;return JSON.stringify(e.logicalProperties)===JSON.stringify(n.logicalProperties)};function Qn(e,n,t,a,o,i,r){const{data:s,width:l,height:d,lineAttributes:c}=e;if(!s||d===0||l===0)return"";const _=document.createElement("canvas");_.width=i,_.height=i;const p=_.getContext("2d");if(!p)return"";p.imageSmoothingEnabled=!1;const u=(n??0)*i,E=(t??0)*i;for(let A=0;A<i;A++)for(let C=0;C<i;C++){const S=u+C,m=E+A;if(m>=0&&m<d&&S>=0&&S<l){let b=s[m][S];if(r==="SCREEN 2 (Graphics I)"&&c&&c[m]){const T=Math.floor(S/se),f=c[m][T];f&&b!==f.fg&&b!==f.bg&&(b=f.fg)}p.fillStyle=b,p.fillRect(C,A,1,1)}}if(_.width===a&&_.height===o)return _.toDataURL();const g=document.createElement("canvas");g.width=a,g.height=o;const N=g.getContext("2d");return N?(N.imageSmoothingEnabled=!1,N.drawImage(_,0,0,a,o),g.toDataURL()):_.toDataURL()}function Xn(e,n,t){var i;if(!e||t===0||n===0)return"";const a=document.createElement("canvas");a.width=n,a.height=t;const o=a.getContext("2d");if(!o)return"";o.imageSmoothingEnabled=!1;for(let r=0;r<t;r++)for(let s=0;s<n;s++){const l=(i=e[r])==null?void 0:i[s];l&&l!=="rgba(0,0,0,0)"&&(o.fillStyle=l,o.fillRect(s,r,1,1))}return a.toDataURL()}const Kn=(e,n,t,a,o,i,r)=>{var _,p;const s=re(a);e.width=n.width*o,e.height=n.height*o;const l=e.getContext("2d");if(!l)return;l.imageSmoothingEnabled=!1;const d=Ge(n.backgroundColor,a);l.fillStyle=d,l.fillRect(0,0,e.width,e.height);const c=n.layers.background;for(let u=0;u<n.height;u++)for(let E=0;E<n.width;E++){const g=(_=c[u])==null?void 0:_[E];if(!(g!=null&&g.tileId))continue;const N=t.find(L=>L.id===g.tileId);if(!N)continue;const{data:A,width:C,height:S,lineAttributes:m}=N;if(!A)continue;const b=g.subTileX??0,T=g.subTileY??0,f=b*o,y=T*o;for(let L=0;L<o;L++)for(let h=0;h<o;h++){const D=f+h,M=y+L;if(M<S&&D<C){let P=(p=A[M])==null?void 0:p[D];if(P===void 0)continue;if(s&&m&&m[M]){const x=Math.floor(D/se),B=m[M][x];B&&P!==B.fg&&P!==B.bg&&(P=B.fg)}l.fillStyle=P,l.fillRect(E*o+h,u*o+L,1,1)}}}};function je(e){const n=e.find(r=>r.type==="globalvariables");if(!n||!n.data)return[...ce];const t=n.data.customVariables||[],a=new Map;ce.forEach(r=>{a.set(r.name,r)}),t.forEach(r=>{a.set(r.name,r)});const o=ce.map(r=>r.name),i=[];return o.forEach(r=>{const s=a.get(r);s&&(i.push(s),a.delete(r))}),a.forEach(r=>{i.push(r)}),i}function Zn(e){const n=e.find(a=>a.type==="globalvariables");return!n||!n.data?[]:n.data.customVariables||[]}function Ye(e){const n=je(e);if(n.length===0)return[];const t=[];e.filter(c=>c.type==="screenmap").forEach(c=>{var p,u;(((u=(p=c.data)==null?void 0:p.layers)==null?void 0:u.entities)||[]).forEach(E=>{var g,N;(N=(g=E.components)==null?void 0:g.Behavior)!=null&&N.behaviorCode&&t.push(E.components.Behavior.behaviorCode)})});const o=e.find(c=>c.type==="gameflow"),i=new Set,r=new Set;if(o!=null&&o.data){const c=o.data;c.nodes&&Array.isArray(c.nodes)&&c.nodes.forEach(_=>{var p;_.type==="StateMachine"&&((p=_.data)!=null&&p.customCode)&&t.push(_.data.customCode),_.type==="IfThenElse"&&_.variableName&&i.add(_.variableName),_.type==="Globals"&&_.variables&&Array.isArray(_.variables)&&_.variables.forEach(u=>{u.variableName&&r.add(u.variableName)})})}e.filter(c=>c.type==="componentdefinition").forEach(c=>{const _=c.data;_.customCode&&t.push(_.customCode)});const l=[],d=new Set;return n.forEach(c=>{const _=t.some(E=>new RegExp(`\\b${c.asmName}\\b`,"i").test(E)),p=i.has(c.name),u=r.has(c.name);(_||p||u)&&!d.has(c.name)&&(l.push(c),d.add(c.name))}),r.forEach(c=>{if(!d.has(c)){const _=`global_var_${c.replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`;l.push({name:c,asmName:_,type:"8bit",defaultValue:0,description:"Auto-generated variable from Globals node",category:"custom"}),d.add(c)}}),i.forEach(c=>{if(!d.has(c)){const _=`global_var_${c.replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`;l.push({name:c,asmName:_,type:"8bit",defaultValue:0,description:"Auto-generated variable from IfThenElse node",category:"custom"}),d.add(c)}}),l}const U={AND:"AND",OR:"OR",XOR:"XOR",NOT:"NOT",KEY_PRESSED:"KEY_PRESSED",KEY_RELEASED:"KEY_RELEASED",TIME_OUT:"TIME_OUT",CAN_MOVE_DIRECTION:"CAN_MOVE_DIRECTION",HAS_COLLISION:"HAS_COLLISION",PATH_CLEAR:"PATH_CLEAR",ON_WALL_COLLISION:"ON_WALL_COLLISION",HAS_DEADLY_TILE_COLLISION:"HAS_DEADLY_TILE_COLLISION",ANIMATION_COMPLETE:"ANIMATION_COMPLETE",KEY_AND_MOVEMENT:"KEY_AND_MOVEMENT",VARIABLE_COMPARE:"VARIABLE_COMPARE"},I={SET_POSITION:"SET_POSITION",MOVE_BY:"MOVE_BY",SET_VELOCITY:"SET_VELOCITY",APPLY_FORCE:"APPLY_FORCE",CHANGE_SPRITE:"CHANGE_SPRITE",PLAY_ANIMATION:"PLAY_ANIMATION",SET_ANIMATION_SPEED:"SET_ANIMATION_SPEED",TOGGLE_ANIMATION:"TOGGLE_ANIMATION",PLAY_SOUND:"PLAY_SOUND",PLAY_MUSIC:"PLAY_MUSIC",MUTE_MUSIC:"MUTE_MUSIC",STOP_MUSIC:"STOP_MUSIC",SET_VARIABLE:"SET_VARIABLE",INCREMENT_VARIABLE:"INCREMENT_VARIABLE",DECREMENT_VARIABLE:"DECREMENT_VARIABLE",SET_COMPONENT_PROPERTY:"SET_COMPONENT_PROPERTY",WAIT:"WAIT",GOTO_STATE:"GOTO_STATE",DESTROY_ENTITY:"DESTROY_ENTITY",SPAWN_ENTITY:"SPAWN_ENTITY",GET_RANDOM_ENTITY_POSITION:"GET_RANDOM_ENTITY_POSITION",CHANGE_GAME_FLOW_NODE:"CHANGE_GAME_FLOW_NODE",DECREASE_LIVES:"DECREASE_LIVES",INCREASE_LIVES:"INCREASE_LIVES",RESPAWN_PLAYER:"RESPAWN_PLAYER",BREAK_TILE:"BREAK_TILE",REPLACE_TILE:"REPLACE_TILE",RND:"RND",POINT_AT:"POINT_AT",ADD_VARIABLES:"ADD_VARIABLES",SUBTRACT_VARIABLES:"SUBTRACT_VARIABLES",MULTIPLY_VARIABLES:"MULTIPLY_VARIABLES",DIVIDE_VARIABLES:"DIVIDE_VARIABLES",MODULO_VARIABLES:"MODULO_VARIABLES",ASSIGN_VARIABLE:"ASSIGN_VARIABLE"};function me(e,n){const t=n.filter(h=>h.type==="componentdefinition").map(h=>h.data),a=n.filter(h=>h.type==="entitytemplate").map(h=>h.data),o=n.filter(h=>h.type==="sprite").map(h=>h.data),i=n.filter(h=>h.type==="tile").map(h=>h.data),r=n.filter(h=>h.type==="screenmap").map(h=>h.data),s=n.filter(h=>h.type==="worldmap").map(h=>h.data),l=n.filter(h=>h.type==="statemachine").map(h=>h.data),d=[];r.forEach(h=>{var D;(D=h.layers)!=null&&D.entities&&Array.isArray(h.layers.entities)&&d.push(...h.layers.entities),h.entities&&Array.isArray(h.entities)&&d.push(...h.entities)});const c=n.find(h=>h.type==="gameflow"),_=c==null?void 0:c.data,p=d.length>0,u=t.length>0||p,E=r.length>1,g=o.length>0,N=i.length>0,A=r.length>0,C=t.length>0,S=!!_,m=n.some(h=>h.type==="font"),b=o.some(h=>h.frames.length>1),T=r.some(h=>h.layers.collision.some(D=>D.some(M=>M!==null))),f=a.some(h=>h.name.toLowerCase().includes("menu")),y=[];t.forEach(h=>{h.name.toLowerCase().includes("state")&&y.push(h.name.replace(/[^a-zA-Z0-9]/g,"").toUpperCase())});const L=Ye(n);return{projectName:e,components:t,templates:a,sprites:o,tiles:i,screenMaps:r,screens:r,worldmaps:s,entities:d,gameFlow:_,stateMachines:l,hasECS:u,hasMultipleScreens:E,hasSprites:g,hasTiles:N,hasScreens:A,hasEntities:p,hasComponents:C,hasGameFlow:S,hasMenus:f,hasFonts:m,hasAnimations:b,hasCollisions:T,hasMenuSystem:f,customStates:y,globalVariables:L}}const ze=e=>{if(!e.hasECS)return`    ; No ECS system - basic entity updates
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
    RET`,n},We=e=>{if(!e.hasSprites)return`    ; No sprites to update
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
    RET`,n},Qe=e=>e.hasCollisions?`    ; Check player collision with environment
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
    RET`,Xe=e=>{let n=`    ; Read MSX joystick/keyboard input
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
    RET`,n},Ke=e=>e.hasMenuSystem?`    ; Update menu graphics and cursor
    LD A, (menu_cursor_position)
    LD B, A
    
    ; Flash cursor
    LD A, (state_timer)
    AND 15              ; Flash every 16 frames
    JR NZ, menu_cursor_visible
    
    ; Hide cursor
    LD A, 32            ; Space character
    JR menu_draw_cursor
    
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
    RET`,Ze=e=>{if(e.customStates.length===0)return"; No custom states detected";let n=`; Custom state handlers for project-specific logic
`;return e.customStates.forEach(t=>{n+=`
logic_${t.toLowerCase()}:
    ; Custom logic for ${t} state
    ; TODO: Implement ${t} specific logic
    RET
`}),n},Je=[{marker:"{{ENTITY_UPDATES}}",generator:ze,description:"Entity update system based on ECS components"},{marker:"{{SPRITE_UPDATES}}",generator:We,description:"Sprite animation and movement updates"},{marker:"{{COLLISION_CHECK}}",generator:Qe,description:"Collision detection system"},{marker:"{{INPUT_HANDLING}}",generator:Xe,description:"Input handling with project-specific controls"},{marker:"{{MENU_SYSTEM}}",generator:Ke,description:"Menu system updates and rendering"},{marker:"{{CUSTOM_STATES}}",generator:Ze,description:"Custom state handlers detected from project"}];function qe(e,n,t,a=Je){const o=me(n,t);let i=e;return i=i.replace(/{{PROJECT_NAME}}/g,n.toUpperCase()),i=i.replace(/{{PROJECT_NAME_LOWER}}/g,n.toLowerCase()),i=i.replace(/{{GENERATION_DATE}}/g,new Date().toISOString()),a.forEach(r=>{if(i.includes(r.marker)){const s=r.generator(o);i=i.replace(new RegExp(tt(r.marker),"g"),s)}}),i}function et(){return`;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
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
`}function tt(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function Jn(e,n){const t=et(),a=qe(t,e,n),i=`${e.toLowerCase().replace(/[^a-z0-9]/g,"_")}_dynamic_system.asm`,r=me(e,n);return{filename:i,content:a,analysis:r}}function nt(){return`; ==================================================================
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
`}function at(e){let n="";if(!e.globalVariables||e.globalVariables.length===0)return n+=`; Goal Variable Values (default)
`,n+=`GOAL_FAILURE            EQU 0    ; Goal = "Failure"
`,n+=`GOAL_COMPLETED          EQU 1    ; Goal = "Completed"
`,n;const t=new Set;return e.globalVariables.forEach(a=>{a.values&&a.values.length>0&&(n+=`
; ${a.name} - ${a.description||"Variable values"}
`,a.values.forEach(o=>{const i=(o.asmConstant||"UNKNOWN").trim(),r=typeof o.value=="number"?o.value:0;t.has(i)||(n+=`${i.padEnd(24)}EQU ${r}    ; ${a.name} = "${o.label}"
`,t.add(i))}))}),n}function ot(e){var n,t,a;return`; ==================================================================
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

${at(e)}

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
`}function it(e){let n=`; ==================================================================
; RAM VARIABLES DEFINITIONS
; File: variables.asm
; Description: Dynamic variable allocation using EQU addresses
; Generated based on project analysis
; ==================================================================

; ==================================================================
; CORE SYSTEM VARIABLES (ALWAYS PRESENT)
; ==================================================================
`,t=49152;n+=`input_state         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Current joystick/keyboard state
`,t++,n+=`prev_input_state    EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Previous input state
`,t++,n+=`current_flow_state  EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Current game flow state
`,t++,n+=`prev_flow_state     EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Previous game flow state
`,t++,n+=`
; ==================================================================
; MIDEAS GLOBAL VARIABLES (DEFAULTS + CUSTOM)
; ==================================================================
`,e.globalVariables&&e.globalVariables.length>0?e.globalVariables.forEach(a=>{const o=a.type==="16bit"?2:1,i=a.type==="16bit"?" (16-bit)":" (8-bit)",r=a.description||a.name;n+=`${a.asmName.padEnd(20)} EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; ${r}${i}
`,t+=o}):(n+=`global_var_goal     EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Goal status (0=Failure, 1=Completed)
`,t++),n+=`
; ==================================================================
; FRAME COUNTER
; ==================================================================
`,n+=`frame_counter       EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Frame counter (16-bit)
`,t+=2,n+=`
; ==================================================================
; ENTITY SYSTEM VARIABLES (Fixed 32 entities)
; ==================================================================
MAX_ENTITIES        EQU 32
`,n+=`entity_x_pos        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity X positions (32 bytes)
`,t+=32,n+=`entity_y_pos        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity Y positions (32 bytes)
`,t+=32,n+=`entity_vel_x        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity X velocity (32 bytes)
`,t+=32,n+=`entity_vel_y        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity Y velocity (32 bytes)
`,t+=32,n+=`entity_comp_masks   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity component masks (32 bytes)
`,t+=32,n+=`entity_screen_id    EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity screen ID (32 bytes)
`,t+=32,n+=`entity_dir_mask     EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity direction mask (32 bytes)
`,t+=32,n+=`entity_health       EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity health (32 bytes)
`,t+=32,n+=`entity_anim_frame   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity animation frame (32 bytes)
`,t+=32,n+=`entity_sm_ptr_l     EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity State Pointer Low (32 bytes)
`,t+=32,n+=`entity_sm_ptr_h     EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity State Pointer High (32 bytes)
`,t+=32,n+=`entity_sm_timer_l   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity State Timer Low (32 bytes)
`,t+=32,n+=`entity_sm_timer_h   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity State Timer High (32 bytes)
`,t+=32,n+=`entity_sm_wait_timer EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity State Wait Timer (32 bytes)
`,t+=32;for(let a=0;a<8;a++)n+=`entity_sm_var_${a}     EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity Variable ${a} (32 bytes)
`,t+=32;return n+=`
; ==================================================================
; SPRITE SYSTEM VARIABLES
; ==================================================================
`,n+=`active_sprite_count EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Number of sprites currently active
`,t++,n+=`sprite_pattern      EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Sprite pattern IDs (32 bytes)
`,t+=32,n+=`sprite_color        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Sprite colors (32 bytes)
`,t+=32,n+=`sprite_attributes   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Interleaved sprite attributes (32 * 4 bytes)
`,t+=128,e.screenMaps.length>0&&(n+=`
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
`,n}function K(e){return e.toLowerCase()}function rt(e,n){var t;if(!e)return`
    ; No connected node - fallback to generic main program
    jp main_program`;switch(e.type){case"WorldLink":const a=e.worldAssetId,o=(t=n.screenMaps)==null?void 0:t.find(s=>s.id===a);return`
    ; GameFlow: Start → WorldLink (${(o==null?void 0:o.name)||"World"})
    ; Initialize game world directly from GameFlow
    
    ; CRITICAL: Load graphics data into VRAM FIRST
    call load_patterns_to_vram    ; Load tile graphics (Pattern Table)
    call load_colors_to_vram      ; Load tile colors (Color Table)
    
    ; Then initialize game systems
    call init_sprites
    call init_components
    call init_entities
    call ${K("load_world_"+a)}

    ; CRITICAL: Set game flow state and update sprites to VRAM
    ld a, FLOW_STATE_GAME
    ld (current_flow_state), a
    call update_sprites_to_vram   ; Copy sprite attributes to VRAM
    
    jp main_loop  ; Jump to main game loop`;case"SubMenu":const i=e;return`
    ; GameFlow: Start → SubMenu ("${i.title||"Menu"}")
    ; Show main menu from GameFlow
    call init_font_system
    call ${K("show_menu_"+i.id)}
    jp menu_loop  ; Jump to menu loop`;case"Text":const r=e;return`
    ; GameFlow: Start → Text ("${r.title||"Text"}")
    ; Show intro text from GameFlow
    call init_font_system
    call ${K("show_text_"+r.id)}
    jp main_program`;case"Transition":return`
    ; GameFlow: Start → Transition (${e.effect||"default"})
    ; Show transition effect from GameFlow
    call init_sprites
    call ${K("transition_effect_"+e.id)}
    jp main_program`;case"Group":return`
    ; GameFlow: Start → Group (nested GameFlow)
    ; Load nested GameFlow: ${e.gameFlowAssetId||"Unknown"}
    call ${K("init_gameflow_"+(e.gameFlowAssetId||"default"))}
    jp main_program`;default:return`
    ; GameFlow: Start → ${e.type} (not yet supported in ASM generator)
    ; Fallback to generic main program
    jp main_program`}}function lt(e,n){var o;let t="",a=`
    ; Jump to main program
    jp main_program`;if(n!=null&&n.gameFlow){const i=n.gameFlow;t=`
; GameFlow Integration: Using "${i.name}" as initialization flow`;const r=i.nodes.find(s=>s.type==="Start");if(r){const s=i.connections.find(l=>{var d;return((d=l.from)==null?void 0:d.nodeId)===r.id||typeof l.from=="string"&&l.from===r.id});if(s){const l=((o=s.to)==null?void 0:o.nodeId)||s.to,d=i.nodes.find(c=>c.id===l);d&&(t+=`
; Flow: Start → ${d.type} (${d.title||d.name||d.id})`,a=rt(d,n))}}}return`; ==================================================================
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
`}function Z(e){return e.toLowerCase()}function ye(e,n){var a,o;let t=`
; GameFlow: ${e.name||"Unknown"}
; Nodes: ${((a=e.nodes)==null?void 0:a.length)||0}
; Connections: ${((o=e.connections)==null?void 0:o.length)||0}

`;return e.nodes&&e.nodes.length>0&&e.nodes.forEach(i=>{var s,l,d,c,_,p,u,E,g,N;const r=`gameflow_node_${i.id.replace(/[^a-zA-Z0-9]/g,"_")}`;switch(i.type){case"Start":const A=(s=e.connections)==null?void 0:s.find(R=>{var O;return((O=R.from)==null?void 0:O.nodeId)===i.id||R.from===i.id});if(A){const O=`gameflow_node_${(((l=A.to)==null?void 0:l.nodeId)||A.to).replace(/[^a-zA-Z0-9]/g,"_")}`;t+=`
${r}:
    ; Start Node - transition to first connected node
    ld hl, ${O}
    jp execute_gameflow_node
`}else t+=`
${r}:
    ; Start Node - no connections, fallback to main program
    ret
`;break;case"WorldLink":const C=i.worldAssetId;t+=`
${r}:
    ; WorldLink Node - Load world: ${C||"Unknown"}
    call init_sprites
    call init_components
    call init_entities
    call ${Z("load_world_"+(C||"default"))}
    ; CRITICAL: Set game flow state and update sprites to VRAM
    ld a, FLOW_STATE_GAME
    ld (current_flow_state), a
    call update_sprites_to_vram   ; Copy sprite attributes to VRAM

    jp main_loop
`;break;case"SubMenu":t+=`
${r}:
    ; SubMenu Node - "${i.title||"Menu"}"
    call init_font_system
    call ${Z("show_menu_"+i.id)}
    ; Wait for menu selection and transition to next node
    ret
`;break;case"Text":t+=`
${r}:
    ; Text Node - "${i.title||"Text"}"
    call init_font_system
    call ${Z("show_text_"+i.id)}
    ; Wait for user input, then transition to next node
    ret
`;break;case"Transition":t+=`
${r}:
    ; Transition Node - Effect: ${i.effect||"default"}
    call ${Z("transition_effect_"+i.id)}
    ret
`;break;case"Group":t+=`
${r}:
    ; Group Node - Nested GameFlow
    ; Load GameFlow: ${i.gameFlowAssetId||"Unknown"}
    call ${Z("init_gameflow_"+(i.gameFlowAssetId||"default"))}
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
`;break;case"Waypoint":const S=(d=e.connections)==null?void 0:d.find(R=>{var O;return((O=R.from)==null?void 0:O.nodeId)===i.id||R.from===i.id});if(S){const O=`gameflow_node_${(((c=S.to)==null?void 0:c.nodeId)||S.to).replace(/[^a-zA-Z0-9]/g,"_")}`;t+=`
${r}:
    ; Waypoint - route to next node
    ld hl, ${O}
    jp execute_gameflow_node
`}break;case"IfThenElse":const m=(_=e.connections)==null?void 0:_.find(R=>{var O,v,Y;return(((O=R.from)==null?void 0:O.nodeId)===i.id||R.from===i.id)&&(((v=R.from)==null?void 0:v.sourceId)==="then"||!((Y=R.from)!=null&&Y.sourceId))}),b=(p=e.connections)==null?void 0:p.find(R=>{var O,v;return(((O=R.from)==null?void 0:O.nodeId)===i.id||R.from===i.id)&&((v=R.from)==null?void 0:v.sourceId)==="else"}),T=m?((u=m.to)==null?void 0:u.nodeId)||m.to:null,f=b?((E=b.to)==null?void 0:E.nodeId)||b.to:null,y=T?`gameflow_node_${T.replace(/[^a-zA-Z0-9]/g,"_")}`:null,L=f?`gameflow_node_${f.replace(/[^a-zA-Z0-9]/g,"_")}`:null,h=`global_var_${(i.variableName||"Goal").replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`;let D="";const M=i.compareValue||"Completed";if(!isNaN(Number(M)))D=M;else{const R=M.toUpperCase().replace(/\s+/g,"_"),O=(i.variableName||"Goal").toUpperCase().replace(/([A-Z])/g,"_$1").replace(/^_/,"");M==="True"||M==="False"?D=`BOOL_${R}`:D=`${O}_${R}`}const P=i.operator||"==";t+=`
${r}:
    ; IfThenElse Node - Compare ${i.variableName||"Goal"} ${P} ${i.compareValue||"Completed"}
    ld a, (${h})     ; Load global variable ${i.variableName||"Goal"}
    cp ${D}        ; Compare with ${i.compareValue||"Completed"}
`,P==="=="?(y&&(t+=`    jp z, ${y}       ; If equal, jump to THEN branch
`),L?t+=`    jp ${L}          ; Otherwise, jump to ELSE branch
`:t+=`    ret                      ; No ELSE branch, return
`):P==="!="?(y&&(t+=`    jp nz, ${y}      ; If not equal, jump to THEN branch
`),L?t+=`    jp ${L}          ; Otherwise, jump to ELSE branch
`:t+=`    ret                      ; No ELSE branch, return
`):P===">"?(L&&(t+=`    jp c, ${L}       ; If A < value (carry set), ELSE
`),y&&(t+=`    jp z, ${L||"if_then_else_skip"}       ; If A == value (zero set), ELSE
`,t+=`    jp ${y}          ; Otherwise A > value, THEN
`)):P==="<"?(y&&(t+=`    jp c, ${y}       ; If A < value (carry set), THEN
`),L&&(t+=`    jp ${L}          ; Otherwise, ELSE
`)):P===">="?(L&&(t+=`    jp c, ${L}       ; If A < value (carry set), ELSE
`),y&&(t+=`    jp ${y}          ; Otherwise A >= value, THEN
`)):P==="<="&&(y&&(t+=`    jp z, ${y}       ; If A == value, THEN
`,t+=`    jp c, ${y}       ; If A < value, THEN
`),L&&(t+=`    jp ${L}          ; Otherwise A > value, ELSE
`)),!y&&!L&&(t+=`    ret                      ; No connections, return
`),t+=`if_then_else_skip:
    ret
`;break;case"Globals":const x=(g=e.connections)==null?void 0:g.find(R=>{var O;return((O=R.from)==null?void 0:O.nodeId)===i.id||R.from===i.id}),B=[];if(i.variables&&Array.isArray(i.variables)&&i.variables.forEach(R=>{var ue;const O=R.variableName||"unknown",v=R.value!==void 0?R.value:0,Y=`global_var_${O.replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`;if(!((ue=n.globalVariables)==null?void 0:ue.some(ne=>ne.asmName===Y||ne.name===O))){console.warn(`Globals node: Variable "${O}" (${Y}) not defined in analysis.globalVariables, skipping`);return}let H="";if(typeof v=="boolean")H=v?"1":"0";else if(v==="true"||v==="True")H="1";else if(v==="false"||v==="False")H="0";else if(typeof v=="number")H=String(v);else if(typeof v=="string"&&!isNaN(Number(v))&&v.trim()!=="")H=v;else if(typeof v=="string"){const ne=v.toUpperCase().replace(/\s+/g,"_");H=`${O.toUpperCase().replace(/([A-Z])/g,"_$1").replace(/^_/,"")}_${ne}`}else H="0";B.push({varName:O,asmVarName:Y,valueExpression:H,originalValue:v})}),t+=`
${r}:
    ; Globals Node - Set global variables
`,B.length>0?B.forEach(R=>{t+=`    ld a, ${R.valueExpression}         ; Set ${R.varName} = ${R.originalValue}
`,t+=`    ld (${R.asmVarName}), a
`}):t+=`    ; No valid global variables to set (all skipped or undefined)
`,x){const O=`gameflow_node_${(((N=x.to)==null?void 0:N.nodeId)||x.to).replace(/[^a-zA-Z0-9]/g,"_")}`;t+=`    jp ${O}          ; Continue to next node
`}else t+=`    ret                      ; No connections, return
`;break;default:t+=`
${r}:
    ; ${i.type} Node (not yet implemented)
    ; Node ID: ${i.id}
    ret
`}}),t+=`
; End of GameFlow State Machine
`,t}function Ee(e){return e.toLowerCase()}function st(e,n){var t,a,o,i,r,s;return`; ==================================================================
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
    call init_components
    call init_entities       ; Initialize entities (positions, screens, etc.)
    call init_sprites
    ret

update_current_state:
    ; Update game logic based on current state
    call update_input_component
    call update_behavior_component  ; AI/Logic
    call update_statemachine_component  ; State Machine updates (NEW!)
    call update_movement_component
    call update_position_component
    call update_collision_component
    call update_health_component    ; Health/Death checks
    call update_animation_component ; Sprite animations
    call update_sprite_component    ; Render sprites
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
${n.gameFlow.nodes&&n.gameFlow.nodes.length>0?n.gameFlow.nodes.map((l,d)=>{var c;return`    ; Node ${d}: ${l.id} (${l.type||"unknown"}) ${(c=l.data)!=null&&c.worldMapId?`-> World: ${l.data.worldMapId}`:""}`}).join(`
`):"    ; No nodes in GameFlow"}

    ; Execute first GameFlow transition (matches Play mode behavior)
    call execute_gameflow_start`:`    ; No GameFlow detected - load first available screen
${n.screenMaps&&n.screenMaps.length>0?`    ; Load first screen: ${((a=n.screenMaps[0])==null?void 0:a.name)||"default"}
    call ${Ee("load_screen_"+(((i=(o=n.screenMaps[0])==null?void 0:o.name)==null?void 0:i.replace(/[^a-zA-Z0-9]/g,"_"))||"DEFAULT"))}`:"    ; No screens detected - load default pattern"}`}
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
    call ${Ee("load_screen_"+(((s=(r=n.screenMaps[0])==null?void 0:r.name)==null?void 0:s.replace(/[^a-zA-Z0-9]/g,"_"))||"DEFAULT"))}`:`
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

${n.gameFlow?ye(n.gameFlow,n):`
; No GameFlow detected - using default screen loading
`}

; ==================================================================
; END OF MAIN PROGRAM
; ==================================================================
    end                 ; End of assembly
`}function dt(e){var n;return!e.tiles||e.tiles.length===0?`; ==================================================================
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
${e.tiles.map((t,a)=>{const o=ve(t,"SCREEN 2 (Graphics I)"),i=Math.ceil(t.width/8),r=Math.ceil(t.height/8),s=i*r;(t.width%8!==0||t.height%8!==0)&&console.warn(`⚠️  Tile ${t.name} size ${t.width}x${t.height} is not multiple of 8px - may cause visual artifacts`);const l=Array.from(o).map(c=>`#${c.toString(16).padStart(2,"0").toUpperCase()}`);let d="";if(s>1){d=`
    ; Character layout: ${i}×${r} grid`;for(let c=0;c<r;c++){d+=`
    ; Row ${c}: `;for(let _=0;_<i;_++){const p=c*i+_;d+=`Char${p} `}}}return`    ; Tile ${a}: ${t.name} (${t.width}x${t.height}px = ${i}×${r} chars = ${s} MSX characters)${d}
    db ${l.join(", ")}
`}).join("")}

; ==================================================================
; PATTERN LOADING FUNCTIONS
; ==================================================================
load_pattern_bank0:
    ; Load pattern bank 0 to VRAM (base patterns)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_pattern_bank0
    ld de, CHRTBL2 + (128 * 8)    ; VRAM pattern table bank 0 (start at char 128)
    ld bc, ${e.tiles.reduce((t,a)=>{const o=Math.ceil(a.width/8),i=Math.ceil(a.height/8);return t+o*i*8},0)}    ; Total bytes for all tile characters (16x16 tiles = 4 chars each)
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_pattern_bank1:
    ; Load pattern bank 1: same patterns as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_pattern_bank0     ; Same source as Bank 0
    ld de, CHRTBL2 + #800 + (128 * 8) ; VRAM pattern table bank 1 (+#800 offset + char 128)
    ld bc, ${e.tiles.reduce((t,a)=>{const o=Math.ceil(a.width/8),i=Math.ceil(a.height/8);return t+o*i*8},0)}    ; Total bytes for all tile characters
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_pattern_bank2:
    ; Load pattern bank 2: same patterns as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_pattern_bank0     ; Same source as Bank 0
    ld de, CHRTBL2 + #1000 + (128 * 8) ; VRAM pattern table bank 2 (+#1000 offset + char 128)
    ld bc, ${e.tiles.reduce((t,a)=>{const o=Math.ceil(a.width/8),i=Math.ceil(a.height/8);return t+o*i*8},0)}    ; Total bytes for all tile characters
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_patterns_to_vram:
    ; Load all pattern banks to VRAM (required for SCREEN 2)
    ; This loads the same patterns to all 3 banks (standard MSX Screen 2 setup)
    call load_pattern_bank0
    call load_pattern_bank1
    call load_pattern_bank2
    ret

; ==================================================================
; END OF PATTERN DATA
; ==================================================================
`}function ct(e){var n;return!e.tiles||e.tiles.length===0?`; ==================================================================
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
${e.tiles.map((t,a)=>{const o=Ue(t),i=o?Array.from(o).map(r=>`#${r.toString(16).padStart(2,"0").toUpperCase()}`):["#F0","#F0","#F0","#F0","#F0","#F0","#F0","#F0"];return`    ; Tile ${a}: ${t.name} colors (fg/bg pairs)
    db ${i.join(", ")}
`}).join("")}

; ==================================================================
; COLOR LOADING FUNCTIONS
; ==================================================================
load_color_bank0:
    ; Load color bank 0 to VRAM (base colors)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_color_bank0
    ld de, CLRTBL2 + (128 * 8)    ; VRAM color table bank 0 (start at char 128)
    ld bc, ${e.tiles.reduce((t,a)=>{const o=Math.ceil(a.width/8),i=Math.ceil(a.height/8);return t+o*i*8},0)}     ; Total color bytes for all tile characters
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_color_bank1:
    ; Load color bank 1: same colors as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_color_bank0       ; Same source as Bank 0
    ld de, CLRTBL2 + #800 + (128 * 8) ; VRAM color table bank 1 (+#800 offset + char 128)
    ld bc, ${e.tiles.reduce((t,a)=>{const o=Math.ceil(a.width/8),i=Math.ceil(a.height/8);return t+o*i*8},0)}     ; Total color bytes for all tile characters
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_color_bank2:
    ; Load color bank 2: same colors as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_color_bank0       ; Same source as Bank 0
    ld de, CLRTBL2 + #1000 + (128 * 8) ; VRAM color table bank 2 (+#1000 offset + char 128)
    ld bc, ${e.tiles.reduce((t,a)=>{const o=Math.ceil(a.width/8),i=Math.ceil(a.height/8);return t+o*i*8},0)}     ; Total color bytes for all tile characters
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_colors_to_vram:
    ; Load all color banks to VRAM (required for SCREEN 2)
    ; This loads the same colors to all 3 banks (standard MSX Screen 2 setup)
    call load_color_bank0
    call load_color_bank1
    call load_color_bank2
    ret

; ==================================================================
; END OF COLOR DATA
; ==================================================================
`}function Te(e){return e.toLowerCase()}function _t(e,n,t){var s,l,d,c,_,p,u,E,g,N,A,C,S,m,b;const a=(l=(s=t.gameFlow)==null?void 0:s.nodes)==null?void 0:l.some(T=>T.type==="SubMenu"),o=(d=t.screenMaps)==null?void 0:d.some(T=>{var f,y;return((f=T.layers)==null?void 0:f.text)||((y=T.textElements)==null?void 0:y.length)>0}),i=(c=t.screenMaps)==null?void 0:c.some(T=>{var f;return((f=T.hudConfiguration)==null?void 0:f.elements)&&T.hudConfiguration.elements.length>0}),r=a||o||i;return`; ==================================================================
; ${n.toUpperCase()} - UNIFIED FILE
; File: unitedFiles.asm
; Description: All-in-one file combining all modular files
; Generated by Mideas MSX Modular Generator
;
; OPTIMIZED: Only includes necessary code for this project
; Tiles: ${((_=t.tiles)==null?void 0:_.length)||0}
; Sprites: ${((p=t.sprites)==null?void 0:p.length)||0}
; Screens: ${((u=t.screenMaps)==null?void 0:u.length)||0}
; Entities: ${((E=t.entities)==null?void 0:E.length)||0}
; Menus: ${a?"Yes":"No"}
; HUD: ${i?"Yes":"No"}
; State Machines: ${((g=t.stateMachines)==null?void 0:g.length)||0}
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

${r?e["font.asm"]:`; [font.asm skipped - no text/menus]
`}

${i?e["hud.asm"]:`; [hud.asm skipped - no HUD elements]
`}

${t.stateMachines&&t.stateMachines.length>0?e["statemachine.asm"]:`; [statemachine.asm skipped - no state machines]
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
${r?`    ; Initialize font system
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
    ; Nodes: ${((N=t.gameFlow.nodes)==null?void 0:N.length)||0} total
${t.gameFlow.nodes&&t.gameFlow.nodes.length>0?t.gameFlow.nodes.map((T,f)=>{var y;return`    ; Node ${f}: ${T.id} (${T.type||"unknown"}) ${(y=T.data)!=null&&y.worldMapId?`-> World: ${T.data.worldMapId}`:""}`}).join(`
`):"    ; No nodes in GameFlow"}

    ; Execute first GameFlow transition (matches Play mode behavior)
    call execute_gameflow_start`:`    ; No GameFlow detected - load first available screen
${t.screenMaps&&t.screenMaps.length>0?`    ; Load first screen: ${((A=t.screenMaps[0])==null?void 0:A.name)||"default"}
    call ${Te("load_screen_"+(((S=(C=t.screenMaps[0])==null?void 0:C.name)==null?void 0:S.replace(/[^a-zA-Z0-9]/g,"_"))||"DEFAULT"))}`:"    ; No screens detected - load default pattern"}`}
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
    call ${Te("load_screen_"+(((b=(m=t.screenMaps[0])==null?void 0:m.name)==null?void 0:b.replace(/[^a-zA-Z0-9]/g,"_"))||"DEFAULT"))}`:`
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

${t.gameFlow?ye(t.gameFlow,t):`
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
    ; Render main menu
${a?`    ; Menu system detected - render menu
    call render_menu_system
`:`    ; No menu system - auto-start game
    ld a, FLOW_STATE_GAME
    ld (current_flow_state), a
    call init_game_entities
    call load_game_screen
`}    ret

render_game:
    ; Render game frame with optimized sprite updates
    ; Only update sprites that have moved (optimization)

    ; Update sprite positions in VRAM only when needed
    ; This is much more efficient than reloading entire screen
    call update_sprites_to_vram

${i?`    ; Render HUD elements
    call render_hud
`:`    ; No HUD elements
`}    ret

render_pause:
    ; Render pause screen
${r?`    ; Show PAUSE text
    ld hl, 12 + (10 * 32)      ; Center of screen (approx)
    ld de, string_pause
    call OUTDO
`:`    ; No text - just freeze
`}    ret

render_game_over:
    ; Render game over screen
${r?`    ; Show GAME OVER text
    ld hl, 10 + (10 * 32)      ; Center of screen (approx)
    ld de, string_game_over
    call OUTDO
`:`    ; No text - just wait
`}    
    ; Return to menu after delay (handled in update)
    ret

render_credits:
    ; Pure game - no credits needed
    call return_to_menu
    ret

; ==================================================================
; STRINGS
; ==================================================================
${r?`
string_pause:     db "PAUSED", 0
string_game_over: db "GAME OVER", 0
`:"; No strings needed"}

    end                 ; End of assembly
`}const Se=209,pt="hex";function mt(e){const n=e.sprites||[],t=n.length;if(t===0)return`; ==================================================================
; SPRITE DATA (EMPTY - NO SPRITES DETECTED)
; File: sprites.asm
; ==================================================================

; No sprites detected in project - placeholder file generated.

; ==================================================================
; SPRITE CONSTANTS
; ==================================================================
SPRITE_INVISIBLE    EQU ${Se}

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
; ${t} sprites detected
; ==================================================================

; ==================================================================
; SPRITE PATTERN DATA
; ==================================================================
`;n.forEach((o,i)=>{const r=`_${i}`,l=(o.name+r).replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase(),d=we(o,pt,i);let c=-1;for(let _=0;_<4;_++)if(d.includes(`${l}_F0_LAYER${_}:`)){c=_;break}a+=`
; Sprite ${i}: ${o.name}
${d}`,c>=0?a+=`
; Unified pattern label for sprite ${i}
SPRITE_${i}_PATTERN EQU ${l}_F0_LAYER${c}
`:a+=`
; WARNING: No valid pattern layers found for sprite ${i}: ${o.name}
SPRITE_${i}_PATTERN:
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
`;for(let o=0;o<t;o++){const i=n[o].name;a+=`    ; Load sprite ${o}: ${i}
    ld hl, SPRITE_${o}_PATTERN
    ld de, SPRPAT + (${o} * 32)
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
    ld b, ${t}
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
    ld bc, ${t*4}  ; 4 bytes per sprite
    call LDIRVM
    ret

; ==================================================================
; SPRITE CONSTANTS
; ==================================================================
SPRITE_INVISIBLE    EQU ${Se}
`,n.forEach((o,i)=>{const r=o.name.toUpperCase().replace(/[^A-Z0-9_]/g,"_")+`_${i}`;a+=`SPRITE_ID_${r}    EQU ${i}      ; ${o.name}
`}),a+=`
; ==================================================================
; RAM REQUIREMENTS (define this in your main RAM section)
; ==================================================================
; sprite_attributes: ds ${t*4}  ; Interleaved buffer: Y, X, Pattern, Color
; active_sprite_count: db 0
;
; Total: ${t*4+1} bytes of RAM

; ==================================================================
; END OF SPRITE DATA
; ==================================================================
`,a}const le={comp_pos:"Position",comp_position:"Position",comp_render:"Sprite",comp_sprite:"Sprite",comp_movement:"Movement",comp_velocity:"Movement",comp_collision:"Collision",comp_player_input:"Input",comp_input:"Input",comp_ai_behavior:"Behavior",comp_behavior:"Behavior",comp_health:"Health",comp_animation:"Animation",comp_gravity:"Gravity",comp_jump:"Jump",comp_damage:"Damage",comp_statemachine:"StateMachine",comp_cursors:"Cursors"};function be(e){var i;const n=new Set,t=new Set,a=[],o=new Map;return console.log("🔍 Analyzing component usage..."),console.log(`📊 Total entities in project: ${((i=e.entities)==null?void 0:i.length)||0}`),e.entities&&e.entities.length>0&&e.entities.forEach(r=>{console.log(`  - Entity: ${r.name} (template: ${r.entityTemplateId})`),a.push(r),r.entityTemplateId&&t.add(r.entityTemplateId)}),console.log(`✅ Active entities: ${a.length}`),console.log(`✅ Used templates: ${Array.from(t).join(", ")}`),a.forEach(r=>{var d;const s=r.name||r.id,l=(d=e.templates)==null?void 0:d.find(c=>c.id===r.entityTemplateId);l?(console.log(`  📦 Analyzing template "${l.name}" for entity "${s}"`),l.components&&Array.isArray(l.components)&&l.components.forEach(c=>{const _=c.definitionId||c.componentDefinitionId;if(_){const p=le[_]||_;console.log(`    - Component: ${_} → ${p}`),n.add(p),o.has(p)||o.set(p,new Set),o.get(p).add(s)}}),r.componentOverrides&&Object.keys(r.componentOverrides).forEach(c=>{const _=le[c]||c;console.log(`    - Override: ${c} → ${_}`),n.add(_),o.has(_)||o.set(_,new Set),o.get(_).add(s)})):console.warn(`  ⚠️  Template "${r.entityTemplateId}" not found for entity "${s}"`)}),console.log("📊 Component usage summary:"),console.log(`  - Total used components: ${n.size}`),n.forEach(r=>{const s=o.get(r);console.log(`    • ${r}: ${(s==null?void 0:s.size)||0} entities`)}),{usedComponents:n,usedTemplates:t,activeEntities:a,componentToEntitiesMap:o}}function Ae(e,n,t){let a=0;const o={Position:0,Sprite:1,Movement:2,Collision:3,Input:4,Behavior:5,Health:6,Animation:7,Jump:8,Gravity:9};return n&&n.components&&n.components.forEach(i=>{const r=i.definitionId||i.componentDefinitionId,s=le[r];s&&o[s]!==void 0&&(a|=1<<o[s])}),e.componentOverrides&&Object.keys(e.componentOverrides).forEach(i=>{const r=le[i];r&&o[r]!==void 0&&(a|=1<<o[r])}),a}function ut(){return`
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
    ; Update positions based on velocities (Movement -> Position)
    ld b, 32                   ; Loop through all entities
    ld hl, entity_comp_masks   ; Check component masks
    ld c, 0                    ; Entity index

position_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_POSITION     ; Check if has position component
    jr z, position_next_entity ; Skip if no position component

    ; Apply velocity to position (if has movement component)
    ld a, (hl)
    and COMP_MASK_MOVEMENT
    jr z, position_next_entity ; Skip velocity if no movement

    push bc
    push hl

    ; Update X Position
    ; X = X + VelX
    ld hl, entity_vel_x
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                 ; A = VelX
    ld b, a                    ; B = VelX

    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)                 ; A = X
    add a, b                   ; A = X + VelX
    ld (hl), a                 ; Store new X

    ; Update Y Position
    ; Y = Y + VelY
    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)                 ; A = VelY
    ld b, a                    ; B = VelY

    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)                 ; A = Y
    add a, b                   ; A = Y + VelY
    ld (hl), a                 ; Store new Y

    pop hl
    pop bc

position_next_entity:
    inc hl                     ; Next entity mask
    inc c                      ; Next entity index
    djnz position_update_loop
    ret
`}function ht(e){return`
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
`}function Et(){return`
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
    ld c, 0                    ; Entity index

movement_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_MOVEMENT     ; Check if has movement component
    jr z, movement_next_entity ; Skip if no movement component

    ; Apply physics/movement logic here
    push bc
    push hl

    ; 1. Apply Gravity (if applicable - TODO: check Gravity component)
    ; For now, just simple friction/damping if no input

    ; 2. Friction / Damping
    ; If velocity is non-zero, reduce it slightly (simple approach)
    ; This prevents infinite sliding
    
    ; X Velocity Damping
    ld hl, entity_vel_x
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    or a
    jr z, movement_check_y_vel
    
    ; If positive, dec; if negative, inc (move towards 0)
    bit 7, a                   ; Check sign
    jr nz, movement_vel_x_neg
    dec (hl)                   ; Positive -> decrease
    jr movement_check_y_vel
movement_vel_x_neg:
    inc (hl)                   ; Negative -> increase

movement_check_y_vel:
    ; Y Velocity Damping
    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)
    or a
    jr z, movement_physics_done

    bit 7, a
    jr nz, movement_vel_y_neg
    dec (hl)
    jr movement_physics_done
movement_vel_y_neg:
    inc (hl)

movement_physics_done:
    pop hl
    pop bc

movement_next_entity:
    inc hl                     ; Next entity mask
    inc c                      ; Next entity index
    djnz movement_update_loop
    ret
`}function Tt(e){const n=e.tiles&&e.tiles.length>0?e.tiles[0].width:16,t=e.tiles&&e.tiles.length>0?e.tiles[0].height:16,a=Math.floor(256/n),o=Math.floor(192/t),i=Number.isInteger(Math.log2(n))?Math.log2(n):4,r=Number.isInteger(Math.log2(t))?Math.log2(t):4,s=Array.from({length:i},(c,_)=>`    srl a                      ; A = X / ${Math.pow(2,_+1)}`).join(`
`),l=Array.from({length:r},(c,_)=>`    srl a                      ; A = Y / ${Math.pow(2,_+1)}`).join(`
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
${e.tiles&&e.tiles.length>0?`; Project tile analysis: ${e.tiles.map(c=>`${c.width}x${c.height}`).join(", ")}
    ; Using first tile as reference: ${n}x${t}
    ; Convert X to tile column (divide by ${n})`:`; No tiles detected - using default 16x16
    ; Convert X to tile column (divide by 16)`}

${s}
    ld c, a                    ; C = tile column

    ; Convert Y to tile row (divide by ${t})
    ld a, b
${l}
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
`}function St(){return`
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
`}function At(){return`
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
`}function It(){return`
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
`}function ft(){return`
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
`}function gt(){return`
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
`}function Ct(){return`
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
`}function yt(){return`
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
`}function bt(e){const n=e.usedComponents;let t=`init_components:
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
`,t}function Nt(e){if(!e.entities||e.entities.length===0)return`; ==================================================================
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
`;const n=be(e),t=n.usedComponents;console.log("🎯 Generating optimized components.asm..."),console.log(`  - Active entities: ${n.activeEntities.length}`),console.log(`  - Used components: ${Array.from(t).join(", ")}`),console.log(`  - Filtered out: ${8-t.size} unused components`);let a=`; ==================================================================
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

; NOTE: Core entity variables are now defined in variables.asm
; (entity_x_pos, entity_y_pos, entity_vel_x, entity_vel_y, entity_comp_masks, etc.)

; Jump Component Data (Fixed-Point 8.8 for smooth physics)
; Using temporary storage for optional components to save RAM
entity_jump_vel_y   EQU temp_word_3       ; Y velocity for jumping (signed word, 32 words = 64 bytes)
entity_jump_count   EQU temp_byte_4       ; Current jump count (0=grounded, 1=first jump, etc.) (32 bytes)
entity_on_ground    EQU temp_byte_5       ; Ground contact flag (bit 0 = on ground) (32 bytes)

; Gravity Component Data
entity_gravity_vel  EQU temp_word_4       ; Accumulated gravity velocity (signed word, 64 bytes)


; ==================================================================
; CORE ECS SYSTEM FUNCTIONS
; ==================================================================

${bt(n)}
`;return t.has("Position")?a+=ut():a+=`
; Position system filtered out (not used)
init_position_system:
    ret

update_position_component:
    ret
`,t.has("Sprite")?a+=ht():a+=`
; Sprite system filtered out (not used)
init_sprite_system:
    ret

update_sprite_component:
    ret
`,t.has("Movement")?a+=Et():a+=`
; Movement system filtered out (not used)
init_movement_system:
    ret

update_movement_component:
    ret
`,t.has("Collision")?a+=Tt(e):a+=`
; Collision system filtered out (not used)
init_collision_system:
    ret

update_collision_component:
    ret
`,t.has("Input")?a+=St():a+=`
; Input system filtered out (not used)
init_input_system:
    ret

update_input_component:
    ret
`,t.has("Behavior")?a+=At():a+=`
; Behavior system filtered out (not used)
init_behavior_system:
    ret

update_behavior_component:
    ret
`,t.has("Health")?a+=It():a+=`
; Health system filtered out (not used)
init_health_system:
    ret

update_health_component:
    ret
`,t.has("Animation")?a+=ft():a+=`
; Animation system filtered out (not used)
init_animation_system:
    ret

update_animation_component:
    ret
`,t.has("Jump")?a+=gt():a+=`
; Jump system filtered out (not used)
init_jump_system:
    ret

update_jump_component:
    ret
`,t.has("Gravity")?a+=Ct():a+=`
; Gravity system filtered out (not used)
init_gravity_system:
    ret

update_gravity_component:
    ret
`,a+=yt(),a+=`
; ==================================================================
; END OF COMPONENT SYSTEMS
; ==================================================================
`,a}function Lt(e){var o,i,r,s;const t=be(e).activeEntities;console.log("🎯 Generating optimized entities.asm..."),console.log(`  - Total entity templates in JSON: ${((o=e.templates)==null?void 0:o.length)||0}`),console.log(`  - Actually instantiated entities: ${t.length}`),console.log(`  - Filtered out: ${(((i=e.templates)==null?void 0:i.length)||0)-t.length} unused templates`);let a=`; ==================================================================
; GAME ENTITIES
; File: entities.asm
; Description: Game entity definitions and behavior
; ==================================================================
;
; INTELLIGENT FILTERING ACTIVE:
;   Entity templates in project: ${((r=e.templates)==null?void 0:r.length)||0}
;   Actually instantiated: ${t.length}
;   Filtered out: ${(((s=e.templates)==null?void 0:s.length)||0)-t.length} unused templates
;
; ==================================================================

`;return t.length>0?(a+=`; ==================================================================
; ENTITY DEFINITIONS
; ==================================================================

`,t.forEach((l,d)=>{var u;const c=l.name.toUpperCase().replace(/[^A-Z0-9]/g,"_"),_=(u=e.templates)==null?void 0:u.find(E=>E.id===l.entityTemplateId),p=Ae(l,_);a+=`; Entity: ${l.name} (instance from template: ${l.entityTemplateId})
ENTITY_${c}_ID EQU ${d}
ENTITY_${c}_COMP_MASK EQU #${p.toString(16).toUpperCase().padStart(2,"0")}  ; Component mask: ${p.toString(2).padStart(8,"0")}b
`,l.entityTemplateId&&(a+=`ENTITY_${c}_TEMPLATE EQU "${l.entityTemplateId}"
`),l.position&&(a+=`ENTITY_${c}_X EQU ${l.position.x}
ENTITY_${c}_Y EQU ${l.position.y}
`),a+=`
`}),a+=`; ==================================================================
; ENTITY MANAGEMENT FUNCTIONS
; ==================================================================

init_entities:
    ; Initialize all active game entities (${t.length} entities)
    
    ; CRITICAL: Clear entity screen IDs to prevent ghost entities on restart
    ; This ensures all entities start with screen ID 0, even if they were
    ; moved to different screens in a previous game session
    ld hl, entity_screen_id
    ld de, entity_screen_id+1
    ld bc, 31                  ; Clear 32 entities (32-1 for LDIR)
    ld (hl), 0                 ; Set first byte to 0
    ldir                       ; Copy to rest of array
    
    ; Initialize State Machine variables (Clear to 0)
    ld hl, entity_sm_ptr_l
    ld de, entity_sm_ptr_l+1
    ld bc, 31
    ld (hl), 0
    ldir

    ld hl, entity_sm_ptr_h
    ld de, entity_sm_ptr_h+1
    ld bc, 31
    ld (hl), 0
    ldir

    ld hl, entity_sm_timer_l
    ld de, entity_sm_timer_l+1
    ld bc, 31
    ld (hl), 0
    ldir

    ld hl, entity_sm_timer_h
    ld de, entity_sm_timer_h+1
    ld bc, 31
    ld (hl), 0
    ldir
    
`,t.length>0?t.forEach(l=>{const d=l.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");a+=`    call init_${d.toLowerCase()}
`}):a+=`    ; No entities to initialize
`,a+=`    ret

update_entities:
    ; Update all active entities (${t.length} entities)
`,t.length>0?t.forEach(l=>{const d=l.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");a+=`    call update_${d.toLowerCase()}
`}):a+=`    ; No entities to update
`,a+=`    ret

`,t.forEach((l,d)=>{var f,y,L,h;const c=l.name.toUpperCase().replace(/[^A-Z0-9]/g,"_"),_=(f=e.templates)==null?void 0:f.find(D=>D.id===l.entityTemplateId),p=Ae(l,_),u=((y=l.position)==null?void 0:y.x)||100,E=((L=l.position)==null?void 0:L.y)||100,g=16,N=16,A=u*g,C=E*N,S=[];p&1&&S.push("Position"),p&2&&S.push("Sprite"),p&4&&S.push("Movement"),p&8&&S.push("Collision"),p&16&&S.push("Input"),p&32&&S.push("Behavior"),p&64&&S.push("Health"),p&128&&S.push("Animation");let m=15;if(p&16){const D=_==null?void 0:_.components.find(M=>M.definitionId==="comp_cursors"||M.definitionId==="comp_input"||M.definitionId==="comp_player_input");if(D){const M=D.defaultValues||{},P=((h=l.componentOverrides)==null?void 0:h.comp_cursors)||{},x={...M,...P};m=0,x.allowUp!==!1&&(m|=1),x.allowDown!==!1&&(m|=2),x.allowLeft!==!1&&(m|=4),x.allowRight!==!1&&(m|=8)}}const b=[];m&1&&b.push("UP"),m&2&&b.push("DOWN"),m&4&&b.push("LEFT"),m&8&&b.push("RIGHT");const T=b.length===4?"All directions":b.join("+");a+=`init_${c.toLowerCase()}:
    ; Initialize ${l.name} at real position from JSON
    ; JSON position: (${u}, ${E}) tiles = (${A}, ${C}) pixels
    ; Template: ${l.entityTemplateId}
    ; Components: ${S.join(", ")}
    ; Direction mask: #${m.toString(16).toUpperCase().padStart(2,"0")} (${m.toString(2).padStart(4,"0")}b) = ${T}

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ld a, ${d}             ; Entity ID
    ld b, #${p.toString(16).toUpperCase().padStart(2,"0")}              ; Component mask (${p.toString(2).padStart(8,"0")}b)
    call create_entity         ; Create with actual components from template

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, ${d}             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), ${A}         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), ${C}         ; Set real Y position from JSON

    ; Set entity screen ID (for multi-screen support)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), ${(()=>{let D=0;return e.screenMaps&&e.screenMaps.forEach((M,P)=>{M.layers.entities.some(x=>x.id===l.id)&&(D=P)}),D})()}                 ; Screen ID (calculated from project data)

    ; Set sprite pattern and color
    ld hl, sprite_pattern
    add hl, de
    ld (hl), ${d*4}          ; Use entity index * 4 for 16x16 sprites

    ld hl, sprite_color
    add hl, de
    ld (hl), 15                ; White color

    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #${m.toString(16).toUpperCase().padStart(2,"0")}            ; Direction restrictions: ${T}

    ; Make sprite visible immediately (only if on screen 0 or current screen)
    ; For safety, we'll let the update loop handle visibility based on screen ID
    ; but we can initialize it here if it's on screen 0
    ld a, ${(()=>{let D=0;return e.screenMaps&&e.screenMaps.forEach((M,P)=>{M.layers.entities.some(x=>x.id===l.id)&&(D=P)}),D})()}
    or a                       ; Check if screen 0
    jr nz, .skip_show_${d} ; Skip if not screen 0

    ld a, ${d}             ; Sprite number
    ld b, ${A}            ; X position
    ld c, ${C}            ; Y position
    ld d, ${d*4}             ; Pattern (index * 4 for 16x16)
    ld e, 15                   ; Color
    call show_sprite

.skip_show_${d}:
    ret

update_${c.toLowerCase()}:
    ; Update ${l.name} logic with real behavior
    ; Check if entity has input component (player entities)
    ld a, ${d}
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
`,a}function Dt(e){if(!e.screenMaps||e.screenMaps.length===0)return`; ==================================================================
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

`,e.screenMaps.forEach(a=>{var o,i;if(a.layers&&a.layers.background){const r=[];if(e.tiles&&e.tiles.length>0){const m={...Me[1],assignedTiles:{},charsetRangeStart:128,charsetRangeEnd:255,enabled:!0};let b=128;e.tiles.forEach(f=>{if(f&&f.id){const y=Math.ceil(f.width/8),L=Math.ceil(f.height/8);m.assignedTiles[f.id]={charCode:b,assignedAt:Date.now()},b+=y*L}});const T={id:"global_auto_bank",name:"Global Auto Bank",banks:[m,m,m]};r.push(T),console.log(`✅ Created GLOBAL tile bank with ${Object.keys(m.assignedTiles).length} assigned tiles`)}const s=[],l=a.activeAreaX??0,d=a.activeAreaY??0,c=a.activeAreaWidth??a.width,_=a.activeAreaHeight??a.height,p=32,u=24;for(let S=0;S<u;S++)for(let m=0;m<p;m++){if(!(m>=l&&m<l+c&&S>=d&&S<d+_)){s.push(0);continue}const T=(o=a.layers.background[S])==null?void 0:o[m];if(!T||!T.tileId)s.push(0);else{let f=0;const y=(i=e.tiles)==null?void 0:i.find(h=>h.id===T.tileId),L=r.length>0?r[0].banks:void 0;if(L&&y){let h=!1;for(const D of L)if((D.enabled??!0)&&D.assignedTiles[T.tileId]){const M=D.assignedTiles[T.tileId].charCode,P=Math.ceil(y.width/W),x=T.subTileX||0,B=T.subTileY||0;if(f=M+B*P+x,f>=D.charsetRangeStart&&f<=D.charsetRangeEnd){h=!0;break}else f=0}h||(f=0)}else f=0;s.push(f)}}const E=s.filter(S=>S!==255).length,g=new Set(s);console.log(`📊 Generated ${s.length} bytes: ${E} non-FF (${(E/s.length*100).toFixed(1)}%)`),console.log(`🎯 Unique byte values: [${Array.from(g).sort((S,m)=>S-m).join(", ")}]`);const N=[];N.push('; Generated using exact Screen Editor "Download ASM" logic'),N.push("; Byte values represent actual character codes in VRAM");const A=`${a.name}_${e.screenMaps.indexOf(a)}`,C=He(A,p,u,s,N,"hex");if(n+=C,a.layers.collision&&e.tiles){const S=a.layers.collision,m=[];S.forEach(T=>{T.forEach(f=>{var y;if(f.tileId){const L=e.tiles.find(D=>D.id===f.tileId),h=((y=L==null?void 0:L.logicalProperties)==null?void 0:y.mapId)||0;m.push(h)}else m.push(0)})});const b=Ve(A,a.width,a.height,m,"hex");n+=`
${b}`}}else{const r=e.screenMaps.indexOf(a),s=a.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");n+=`SCREEN_${s}_${r}_LAYOUT:
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
    
    ; Set VDP Register 7: [Background Color (4-7) | Border Color (0-3)]
    
    ; Process Background Color (in A) -> High Nibble
    and #0F                    ; Ensure 0-15 range
    rlca                       ; Shift to bits 4-7
    rlca
    rlca
    rlca
    ld c, a                    ; Save shifted background in C
    
    ; Process Border Color (in B) -> Low Nibble
    ld a, b                    ; Get border color
    and #0F                    ; Ensure 0-15 range
    
    ; Combine
    or c                       ; Combine: background << 4 | border
    
    ld b, a                    ; Value for VDP R#7
    ld c, 7                    ; VDP Register 7
    call WRTVDP                ; BIOS call to write VDP register
    
    pop bc
    pop af
    ret

; Helper function to initialize character 0 (empty cell) with background color
; Input: A = background color (0-15)
; This ensures empty cells show the correct background color instead of BIOS default (blue)
init_char0_color:
    push af
    push bc
    push de
    push hl
    
    ; Calculate color byte: (bg_color << 4) | bg_color
    ; This makes both foreground and background the same color
    and #0F                    ; Ensure 0-15 range
    ld b, a                    ; Save in B
    rlca                       ; Shift to high nibble
    rlca
    rlca
    rlca
    or b                       ; Combine: bg_color in both nibbles
    ld b, a                    ; B = color byte to write
    
    ; Write color to character 0 in all 3 banks (8 bytes each)
    ; Bank 0: CLRTBL2 + (0 * 8)
    ld hl, CLRTBL2
    ld c, 8                    ; 8 bytes per character
init_char0_bank0_loop:
    ld a, b                    ; Get color byte
    call WRTVRM                ; Write to VRAM
    inc hl
    dec c
    jr nz, init_char0_bank0_loop
    
    ; Bank 1: CLRTBL2 + #800 + (0 * 8)
    ld hl, CLRTBL2 + #800
    ld c, 8
init_char0_bank1_loop:
    ld a, b
    call WRTVRM
    inc hl
    dec c
    jr nz, init_char0_bank1_loop
    
    ; Bank 2: CLRTBL2 + #1000 + (0 * 8)
    ld hl, CLRTBL2 + #1000
    ld c, 8
init_char0_bank2_loop:
    ld a, b
    call WRTVRM
    inc hl
    dec c
    jr nz, init_char0_bank2_loop
    
    ; Also clear pattern for character 0 (all zeros = blank)
    ; Bank 0: CHRTBL2 + (0 * 8)
    ld hl, CHRTBL2
    ld c, 8
    xor a                      ; A = 0 (blank pattern)
init_char0_pattern_bank0_loop:
    call WRTVRM
    inc hl
    dec c
    jr nz, init_char0_pattern_bank0_loop
    
    ; Bank 1: CHRTBL2 + #800 + (0 * 8)
    ld hl, CHRTBL2 + #800
    ld c, 8
    xor a
init_char0_pattern_bank1_loop:
    call WRTVRM
    inc hl
    dec c
    jr nz, init_char0_pattern_bank1_loop
    
    ; Bank 2: CHRTBL2 + #1000 + (0 * 8)
    ld hl, CHRTBL2 + #1000
    ld c, 8
    xor a
init_char0_pattern_bank2_loop:
    call WRTVRM
    inc hl
    dec c
    jr nz, init_char0_pattern_bank2_loop
    
    pop hl
    pop de
    pop bc
    pop af
    ret

load_screen:

    ; Load screen (A = screen ID)
    ; TODO: Implement screen loading logic
    ret

`,e.screenMaps.forEach((a,o)=>{const i=a.name.toUpperCase().replace(/[^A-Z0-9]/g,"_"),r=a.backgroundColor!==void 0?a.backgroundColor:1,s=a.borderColor!==void 0?a.borderColor:1;n+=`load_screen_${i.toLowerCase()}:
    ; Load ${a.name} screen (BIOS LDIRVM handles timing)
    ; Set VDP colors FIRST (before loading screen data)
    ld a, ${r}           ; Background color
    ld b, ${s}       ; Border color
    call set_screen_colors
    ; Initialize character 0 (empty cells) with background color
    ld a, ${r}           ; Background color for char 0
    call init_char0_color
    ; Now load screen layout
    ld hl, SCREEN_${i}_${o}_LAYOUT
    ld de, NAMETBL
    ld bc, SCREEN_${i}_${o}_SIZE
    call LDIRVM                ; BIOS handles safe VRAM access
    ret

`});const t=e.worldmaps||[];t.length>0&&(n+=`; ==================================================================
; WORLDMAP LOADING FUNCTIONS (for GameFlow WorldLink nodes)
; ==================================================================

`,t.forEach(a=>{var l;const o=a.id,i=a.startScreenNodeId,r=(l=a.nodes)==null?void 0:l.find(d=>d.id===i),s=r==null?void 0:r.screenAssetId;if(s){const d=e.screenMaps.findIndex(_=>_.id===s),c=e.screenMaps[d];if(c){const _=c.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");n+=`load_world_${o.toLowerCase().replace(/[^a-z0-9]/g,"_")}:
    ; Load worldmap: ${a.name}
    ; Starting screen: ${c.name}
    call load_screen_${_.toLowerCase()}
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
`;return n+=`
; ==================================================================
; END OF SCREENS
; ==================================================================
`,n}function Rt(e){var a,o,i;const n=(o=(a=e.gameFlow)==null?void 0:a.nodes)==null?void 0:o.some(r=>r.type==="SubMenu"),t=(i=e.screenMaps)==null?void 0:i.some(r=>{var s,l;return((s=r.layers)==null?void 0:s.text)||((l=r.textElements)==null?void 0:l.length)>0});return!n&&!t?`; ==================================================================
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
`}function Ot(e){var o;const n=[],t=new Map;if((o=e.screenMaps)==null||o.forEach(i=>{var s;const r=((s=i.hudConfiguration)==null?void 0:s.elements)||[];r.length>0&&(n.push(...r),t.set(i.id,r))}),n.length===0)return`; ==================================================================
; HUD SYSTEM (EMPTY - No HUD elements defined)
; ==================================================================
render_hud:
    ret
`;let a=`; ==================================================================
; HUD SYSTEM - Screen 2 Text Rendering
; ==================================================================
; Total HUD Elements: ${n.length}
; Screens with HUD: ${t.size}
;
; HUD Elements use TileBank fonts to render text in Screen 2 mode
; Each element can be positioned anywhere on screen (256x192 pixels)
; ==================================================================

`;return a+=Mt(n),a+=Pt(),a+=vt(),a}function Mt(e){let n=`; ------------------------------------------------------------------
; HUD DATA STRUCTURES
; ------------------------------------------------------------------

`;return n+=`HUD_ELEMENT_COUNT   EQU ${e.length}

`,n+=`; HUD Element Data Table
`,n+=`; Format: [Type:1][X:1][Y:1][TextPtr:2][Visible:1]
`,n+=`hud_element_data:
`,e.forEach((t,a)=>{const o=Ut(t.type),i=t.position.x,r=t.position.y,s=t.visible?1:0,l=`hud_text_${a}`;n+=`    DB ${o}, ${i}, ${r}    ; Element ${a}: ${t.type} at (${i},${r})
`,n+=`    DW ${l}             ; Text pointer
`,n+=`    DB ${s}                ; Visible
`}),n+=`
`,n+=`; HUD Text Strings
`,e.forEach((t,a)=>{const o=t.text||t.name||"",i=`hud_text_${a}`;n+=`${i}:
`,n+=`    DB "${o}", 0
`}),n+=`
`,n}function Pt(e){return`; ------------------------------------------------------------------
; render_hud
; Main HUD rendering function
; Called once per frame to update all HUD elements
; ------------------------------------------------------------------
render_hud:
    push af
    push bc
    push de
    push hl

    ld b, HUD_ELEMENT_COUNT
    ld hl, hud_element_data

.render_loop:
    push bc                     ; Save counter
    push hl                     ; Save data pointer

    ; Read element data
    ld a, (hl)                  ; A = Type
    inc hl
    ld d, (hl)                  ; D = X position
    inc hl
    ld e, (hl)                  ; E = Y position
    inc hl
    ld c, (hl)                  ; BC = Text pointer (low)
    inc hl
    ld b, (hl)
    inc hl
    ld a, (hl)                  ; A = Visible flag
    inc hl

    ; Check if visible
    or a
    jr z, .skip_element

    ; Calculate VRAM address from X,Y pixel coordinates
    ; Screen 2 Name Table = #1800 + (Y/8)*32 + (X/8)
    push bc                     ; Save text pointer

    ; Y/8 = row
    ld a, e                     ; A = Y
    srl a
    srl a
    srl a                       ; A = Y/8 (row)

    ; row * 32
    ld l, a
    ld h, 0
    add hl, hl                  ; * 2
    add hl, hl                  ; * 4
    add hl, hl                  ; * 8
    add hl, hl                  ; * 16
    add hl, hl                  ; * 32

    ; Add X/8
    ld a, d                     ; A = X
    srl a
    srl a
    srl a                       ; A = X/8 (column)
    ld e, a
    ld d, 0
    add hl, de

    ; Add Name Table base
    ld de, #1800
    add hl, de                  ; HL = VRAM address

    pop de                      ; DE = Text pointer

    ; Render text string at HL (VRAM) from DE (string)
    call hud_print_string

.skip_element:
    pop hl                      ; Restore data pointer
    ld de, 6                    ; Size of each element entry
    add hl, de                  ; Move to next element

    pop bc                      ; Restore counter
    djnz .render_loop

    pop hl
    pop de
    pop bc
    pop af
    ret

`}function vt(){return`; ------------------------------------------------------------------
; hud_print_string
; Print a null-terminated string to Screen 2 Name Table
; Input: HL = VRAM address, DE = String pointer (RAM)
; ------------------------------------------------------------------
hud_print_string:
    push af
    push bc
    push de
    push hl

.print_loop:
    ld a, (de)                  ; Get character from string
    or a                        ; Check for null terminator
    jr z, .print_done

    ; Convert ASCII to tile index (A-Z, 0-9, space, punctuation)
    call hud_ascii_to_tile

    ; Write tile to VRAM Name Table
    push de
    push hl
    ex de, hl                   ; Swap: HL = VRAM address, DE = string ptr
    call WRTVRM                 ; Write A to VRAM at HL
    ex de, hl                   ; Swap back: HL = VRAM, DE = string ptr
    pop hl
    pop de

    ; Move to next character
    inc de                      ; Next char in string
    inc hl                      ; Next VRAM position

    jr .print_loop

.print_done:
    pop hl
    pop de
    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; hud_ascii_to_tile
; Convert ASCII character to tile index for font rendering
; Input: A = ASCII character
; Output: A = Tile index
; ------------------------------------------------------------------
hud_ascii_to_tile:
    ; Space (32) -> tile 0
    cp 32
    jr nz, .not_space
    ld a, 0
    ret

.not_space:
    ; Numbers '0'-'9' (48-57) -> tiles 1-10
    cp '0'
    jr c, .not_number
    cp '9'+1
    jr nc, .not_number
    sub '0'
    inc a                       ; Offset by 1 (tile 0 = space)
    ret

.not_number:
    ; Letters 'A'-'Z' (65-90) -> tiles 11-36
    cp 'A'
    jr c, .not_upper
    cp 'Z'+1
    jr nc, .not_upper
    sub 'A'
    add a, 11                   ; Offset by 11 (0=space, 1-10=numbers)
    ret

.not_upper:
    ; Letters 'a'-'z' (97-122) -> tiles 11-36 (same as uppercase)
    cp 'a'
    jr c, .punctuation
    cp 'z'+1
    jr nc, .punctuation
    sub 'a'
    add a, 11
    ret

.punctuation:
    ; Punctuation: ':' -> tile 37, '-' -> tile 38, '.' -> tile 39
    cp ':'
    jr nz, .not_colon
    ld a, 37
    ret

.not_colon:
    cp '-'
    jr nz, .not_dash
    ld a, 38
    ret

.not_dash:
    cp '.'
    jr nz, .not_dot
    ld a, 39
    ret

.not_dot:
    ; Default: space
    ld a, 0
    ret

; ------------------------------------------------------------------
; update_hud_score
; Update score HUD element with current score value
; Input: HL = Score value (16-bit BCD)
; ------------------------------------------------------------------
update_hud_score:
    ; TODO: Implement score update
    ; Convert 16-bit BCD to ASCII digits and update text
    ret

; ------------------------------------------------------------------
; update_hud_lives
; Update lives HUD element
; Input: A = Number of lives
; ------------------------------------------------------------------
update_hud_lives:
    ; TODO: Implement lives counter update
    ret

`}function Ut(e){return{[$.Score]:1,[$.HighScore]:2,[$.Lives]:3,[$.EnergyBar]:4,[$.ItemDisplay]:5,[$.SceneName]:6,[$.MiniMap]:7,[$.CoinCounter]:8,[$.BossEnergyBar]:9,[$.PhaseIndicator]:10,[$.AttackAlert]:11,[$.TextBox]:12,[$.NumericField]:13,[$.CustomCounter]:14}[e]||0}function J(e){return e.toLowerCase().replace(/[^a-z0-9]/g,"_")}function pe(e){return e.toUpperCase().replace(/[^A-Z0-9]/g,"_")}function Ft(e){const n=e.worldmaps||[];if(n.length===0)return`; ==================================================================
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

`,n.forEach((a,o)=>{var s,l,d;const i=pe(a.name||`world_${o}`),r=a.id||`world_${o}`;t+=`; World: ${a.name||"Unnamed"} (${r})
WORLD_${i}_ID EQU ${o}
WORLD_${i}_SCREEN_COUNT EQU ${((l=(s=a.data)==null?void 0:s.nodes)==null?void 0:l.length)||0}
`,(d=a.data)!=null&&d.nodes&&a.data.nodes.length>0&&a.data.nodes.forEach((c,_)=>{const p=pe(c.name||`screen_${_}`);t+=`WORLD_${i}_SCREEN_${p}_ID EQU ${_}
`}),t+=`
`}),t+=`; ==================================================================
; WORLD LOADING FUNCTIONS
; ==================================================================

`,n.forEach(a=>{var _,p,u;J(a.name||"unnamed");const o=a.id||"unknown",i=(_=a.data)==null?void 0:_.startScreenNodeId,r=((p=a.data)==null?void 0:p.nodes)||[];if(t+=`; ------------------------------------------------------------------
; Load World: ${a.name||"Unnamed"}
; World ID: ${o}
; Screens: ${r.length}
; Start Screen Node: ${i||"none"}
; ------------------------------------------------------------------
load_world_${J(o)}:
`,r.length===0){t+=`    ; No screens in this world
    ret

`;return}const l=(r.find(E=>E.id===i)||r[0]).screenAssetId;if(!l){t+=`    ; No valid start screen found
    ret

`;return}const d=(u=e.screens)==null?void 0:u.find(E=>E.id===l),c=(d==null?void 0:d.name)||"unknown";t+=`    ; Load start screen: ${c} (${l})
    call ${J("load_screen_"+l)}

    ; Initialize world state
    ld a, WORLD_${pe(a.name||"unnamed")}_ID
    ld (current_world_id), a

    ld a, ${r.findIndex(E=>E.id===i)}
    ld (current_screen_index), a

    ret

`}),t+=`; ==================================================================
; SCREEN TRANSITION FUNCTIONS
; ==================================================================

`,n.forEach(a=>{var s,l;const o=a.id||"unknown",i=((s=a.data)==null?void 0:s.nodes)||[],r=((l=a.data)==null?void 0:l.connections)||[];if(r.length===0){t+=`; World ${a.name||"Unnamed"} has no screen connections

`;return}t+=`; ------------------------------------------------------------------
; World: ${a.name||"Unnamed"}
; Connections: ${r.length}
; ------------------------------------------------------------------

`,r.forEach((d,c)=>{const _=i.find(E=>E.id===d.from||d.fromNodeId),p=i.find(E=>E.id===d.to||d.toNodeId);if(!_||!p){t+=`; Invalid connection ${c}: missing nodes

`;return}_.screenAssetId;const u=p.screenAssetId;t+=`; Transition: ${_.name||"screen"} -> ${p.name||"screen"}
transition_${J(o)}_${c}:
    call ${J("load_screen_"+u)}
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
`,t}function ae(e){e=e.replace("#","");const n=parseInt(e.substring(0,2),16),t=parseInt(e.substring(2,4),16),a=parseInt(e.substring(4,6),16);if(n<50&&t<50&&a<50)return 1;if(n>200&&t>200&&a>200)return 15;if(n>200&&t<100&&a<100)return 8;if(n<100&&t>200&&a<100)return 3;if(n<100&&t<100&&a>200)return 5;if(n>200&&t>200&&a<100)return 10;if(n>150&&t<100&&a>150)return 13;if(n<100&&t>150&&a>150)return 7;const o=(n+t+a)/3;return o<64?1:o<128?14:15}function xt(e){const n=e.gameFlow&&e.gameFlow.nodes&&e.gameFlow.nodes.some(a=>a.type==="SubMenu");if(!n)return`; ==================================================================
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

`,e.gameFlow.nodes.filter(r=>r.type==="SubMenu").forEach((r,s)=>{const l=(r.title||r.id).toUpperCase().replace(/[^A-Z0-9]/g,"_");t+=`MENU_${l}_ID EQU ${s}
`}),t+=`
; ==================================================================
; MENU FUNCTIONS
; ==================================================================

`,e.gameFlow.nodes.filter(r=>r.type==="SubMenu").forEach(r=>{var p,u,E,g;(r.title||r.id).toUpperCase().replace(/[^A-Z0-9]/g,"_");const s=r.id.replace(/[^a-zA-Z0-9]/g,"_"),l=((u=(p=r.appearance)==null?void 0:p.colors)==null?void 0:u.background)||"#000000",d=((g=(E=r.appearance)==null?void 0:E.colors)==null?void 0:g.border)||"#FFFFFF",c=ae(l),_=ae(d);t+=`show_menu_${s}:
    ; Display ${r.title||r.id} menu
    ; Set background color using VDP
    ld b, ${c*16+_} ; Background (high) | Border (low)
    ld c, 7                     ; VDP Register 7
    call WRTVDP

    ; Set system color variables
    ld a, ${_}
    ld (BDRCLR), a

    ld a, ${c}
    ld (BAKCLR), a

    ld a, 15                    ; Default text color (White)
    ld (FORCLR), a

    ; Clear screen with background color
    call cls

    ; Display menu title
    ld hl, menu_${s}_title
    ld de, NAMETBL + (5 * 32) + 10
    call print_string_screen2

    ; Display menu options
    ; TODO: Add option rendering logic here

    ret

menu_${s}_title:
    db "${(r.title||"Menu").replace(/"/g,'\\"')}", 0

handle_menu_${s}:
    ; Handle ${r.title||r.id} menu input
    call GTSTCK
    ; TODO: Implement input handling
    ret

`}),e.gameFlow.nodes.filter(r=>r.type==="Text").forEach(r=>{var p,u,E,g;const s=r.id.replace(/[^a-zA-Z0-9]/g,"_"),l=((u=(p=r.appearance)==null?void 0:p.colors)==null?void 0:u.background)||"#000000",d=((g=(E=r.appearance)==null?void 0:E.colors)==null?void 0:g.border)||"#FFFFFF",c=ae(l),_=ae(d);t+=`show_text_${s}:
    ; Display ${r.title||r.id} text
    ; Set background color using VDP
    ld b, ${c*16+_} ; Background (high) | Border (low)
    ld c, 7                     ; VDP Register 7
    call WRTVDP

    ; Set system color variables
    ld a, ${_}
    ld (BDRCLR), a

    ld a, ${c}
    ld (BAKCLR), a

    ld a, 15                    ; Default text color (White)
    ld (FORCLR), a

    ; Clear screen with background color
    call cls

    ; Display text title
    ld hl, text_${s}_title
    ld de, NAMETBL + (3 * 32) + 10
    call print_string_screen2

    ; Display text message
    ld hl, text_${s}_message
    ld de, NAMETBL + (6 * 32) + 5
    call print_string_screen2

    ; Wait for user input
    call wait_for_fire
    ret

text_${s}_title:
    db "${(r.title||"Text").replace(/"/g,'\\"')}", 0

text_${s}_message:
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
`,t}const wt={[I.SET_POSITION]:1,[I.MOVE_BY]:2,[I.SET_VELOCITY]:3,[I.APPLY_FORCE]:4,[I.CHANGE_SPRITE]:5,[I.PLAY_ANIMATION]:6,[I.SET_ANIMATION_SPEED]:7,[I.TOGGLE_ANIMATION]:8,[I.PLAY_SOUND]:9,[I.PLAY_MUSIC]:10,[I.MUTE_MUSIC]:11,[I.STOP_MUSIC]:12,[I.SET_VARIABLE]:13,[I.INCREMENT_VARIABLE]:14,[I.DECREMENT_VARIABLE]:15,[I.SET_COMPONENT_PROPERTY]:16,[I.WAIT]:17,[I.GOTO_STATE]:18,[I.DESTROY_ENTITY]:19,[I.SPAWN_ENTITY]:20,[I.GET_RANDOM_ENTITY_POSITION]:21,[I.CHANGE_GAME_FLOW_NODE]:22,[I.DECREASE_LIVES]:23,[I.INCREASE_LIVES]:24,[I.RESPAWN_PLAYER]:25,[I.BREAK_TILE]:26,[I.REPLACE_TILE]:27,[I.RND]:28,[I.POINT_AT]:29,[I.ADD_VARIABLES]:30,[I.SUBTRACT_VARIABLES]:31,[I.MULTIPLY_VARIABLES]:32,[I.DIVIDE_VARIABLES]:33,[I.MODULO_VARIABLES]:34,[I.ASSIGN_VARIABLE]:35,END:255},$t={[U.AND]:1,[U.OR]:2,[U.NOT]:3,[U.KEY_PRESSED]:4,[U.KEY_RELEASED]:5,[U.TIME_OUT]:6,[U.CAN_MOVE_DIRECTION]:7,[U.HAS_COLLISION]:8,[U.PATH_CLEAR]:9,[U.ON_WALL_COLLISION]:10,[U.HAS_DEADLY_TILE_COLLISION]:11,[U.ANIMATION_COMPLETE]:12,[U.KEY_AND_MOVEMENT]:13,[U.VARIABLE_COMPARE]:14},kt={x:0,y:1,vx:2,vy:3},Bt={"==":0,"!=":1,">":2,"<":3,">=":4,"<=":5},Gt=`
    ; ------------------------------------------------------------------
    ; SM_Update
    ; Main State Machine Update Routine
    ; Input: A = Entity Index
    ; ------------------------------------------------------------------
SM_Update:
    push af
    push bc
    push de
    push hl
    push ix
    
    ld c, a             ; C = Entity Index
    ld b, 0             ; BC = Entity Index
    
    ; 0. Check Wait Timer
    ld hl, entity_sm_wait_timer
    add hl, bc
    ld a, (hl)
    or a
    jr z, .sm_update_continue

    ; Timer Active, Decrement
    dec a
    ld (hl), a
    jp sm_update_done   ; Skip update

.sm_update_continue:
    ; BC is still Entity Index.
    
    ; 1. Increment Timer
    ld hl, entity_sm_timer_l
    add hl, bc
    inc (hl)
    jr nz, sm_timer_no_overflow
    
    ld hl, entity_sm_timer_h
    add hl, bc
    inc (hl)
sm_timer_no_overflow:

    ; 2. Get Current State Pointer
    ld hl, entity_sm_ptr_l
    add hl, bc
    ld e, (hl)          ; E = Ptr Low
    
    ld hl, entity_sm_ptr_h
    add hl, bc
    ld d, (hl)          ; D = Ptr High

    ; Check if pointer is null(0)
    ld a, d
    or e
    jp z, sm_update_done

    ; DE points to State Data:
    ; [0] = ID(Debug / Unused)
    ; [1-2] = OnEnter Actions Ptr
    ; [3-4] = OnExit Actions Ptr
    ; [5-6] = Transitions List Ptr
    
    ex de, hl           ; HL = State Data Ptr

    ; 3. Check Transitions
    push hl             ; Save State Data Ptr
    ld bc, 5
    add hl, bc
    ld e, (hl)
    inc hl
    ld d, (hl)
    ; DE = Transitions List Ptr

    ; Restore State Data Ptr
    pop hl

    ; Get Entity Index from stack
    ; Stack: IX, HL, DE, BC, AF (pushed at start)
    ; SP + 0=IX, SP + 2=HL, SP + 4=DE, SP + 6=BC, SP + 8=AF
    ; A is at SP + 9
    ld ix, 0
    add ix, sp
    ld a, (ix + 9)      ; A = Entity Index
    
    call SM_CheckTransitions

    ; If Carry set, transition happened, stop update
    jp c, sm_update_done

    ; 4. Execute OnUpdate Actions (Optional)

sm_update_done:
    pop ix
    pop hl
    pop de
    pop bc
    pop af
    ret

    ; ------------------------------------------------------------------
; SM_CheckTransitions
    ; Checks all transitions for the current state
; Input: DE = Pointer to Transitions List
    ; A = Entity Index
    ; Output: Carry Set if transition occurred
        ; ------------------------------------------------------------------
            SM_CheckTransitions:
    ld b, a; Save Entity Index in B
    
    ld a, d
    or e
    ret z; Null pointer, no transitions
    
    ex de, hl; HL = Transitions List

    ; Read Count
    ld c, (hl); C = Count
    inc hl

    ; If count is 0, return
    ld a, c
    or a
    ret z

    ; B = Entity Index
    ; C = Count
    ; HL = Transitions List Ptr

SM_CheckTransitions_Loop:
    push bc; Save Loop Counter(C) and Entity Index(B)

    ; Structure of Transition Entry:
;[0] = Condition Type
    ;[1...] = Params(Variable length)
    ;[Next] = Target State Ptr(Low)
    ;[Next + 1] = Target State Ptr(High)
    
    ld a, b; A = Entity Index
    call SM_EvaluateCondition
    ; HL now points to Target State Ptr(or next param if we were parsing)
; Result in A(1 = True, 0 = False)
    
    or a
    jr nz, SM_TransitionTriggered

    ; Condition False: Skip Target State Ptr and continue to next transition
    inc hl
    inc hl
    
    pop bc; Restore counters
    dec c; Decrement loop counter
    jr nz, SM_CheckTransitions_Loop
    
    or a            ; Clear carry(no transition)
    ret

SM_TransitionTriggered:
    pop bc; Restore counters(B = Entity Index)

    ; HL points to Target State Ptr
    ld e, (hl)
    inc hl
    ld d, (hl)
    ; DE = Target State Address

    ; Perform State Change
    ld a, b; A = Entity Index
    call SM_ChangeState

    scf             ; Set carry(transition occurred)
    ret

    ; ------------------------------------------------------------------
; SM_ChangeState
    ; Changes the entity's state to DE
    ; Input: DE = New State Address
    ; A = Entity Index
    ; ------------------------------------------------------------------
        SM_ChangeState:
    push de; Save New State
    push af; Save Entity Index

    ; 1. Execute OnExit of Old State
    ; Get Old State Ptr
    ld c, a
    ld b, 0
    ld hl, entity_sm_ptr_l
    add hl, bc
    ld e, (hl)
    ld hl, entity_sm_ptr_h
    add hl, bc
    ld d, (hl)
    ; DE = Old State Ptr
    
    ex de, hl; HL = Old State Ptr
    ld bc, 3
    add hl, bc
    ld e, (hl)
    inc hl
    ld d, (hl)
    ; DE = OnExit Actions Ptr
    
    pop af; Restore Entity Index
    push af; Keep it saved
    
    call SM_ExecuteActions

    ; 2. Set New State
    pop af; Restore Entity Index
    pop de; Restore New State
    
    push af; Save Entity Index again
    push de; Save New State again
    
    ld c, a
    ld b, 0
    
    ld hl, entity_sm_ptr_l
    add hl, bc
    ld (hl), e
    
    ld hl, entity_sm_ptr_h
    add hl, bc
    ld (hl), d

    ; 3. Reset Timer
    ld hl, entity_sm_timer_l
    add hl, bc
    ld (hl), 0
    
    ld hl, entity_sm_timer_h
    add hl, bc
    ld (hl), 0

    ; 4. Execute OnEnter of New State
    pop hl; HL = New State Base
    pop af; A = Entity Index
    
    push hl; Save New State Base(needed ?) No.
    
    inc hl; Skip ID
    ld e, (hl)
    inc hl
    ld d, (hl)
    ; DE = OnEnter Actions Ptr
    
    pop hl; Clean stack(wait, I pushed HL above)
    
    call SM_ExecuteActions

    ret

    ; ------------------------------------------------------------------
; SM_ExecuteActions
    ; Executes a list of actions
    ; Input: DE = Pointer to Action List
    ; A = Entity Index
    ; ------------------------------------------------------------------
        SM_ExecuteActions:
    ld a, d
    or e
    ret z; Null pointer
    
    ex de, hl; HL = Action List

    ; We need Entity Index.It was passed in A ?
    ; Wait, SM_ChangeState called us.
    ; In SM_ChangeState:
;   pop af(Entity Index)
    ;   call SM_ExecuteActions
    ; So A has Entity Index.
    
    ld b, a; B = Entity Index

SM_ExecuteActions_Loop:
    ld a, (hl); Get Action ID
    inc hl
    
    cp 0xFF; END
    ret z
    
    push hl; Save Action List Ptr
    push bc; Save Entity Index

    ; Dispatch Action
    ; Input: A = Action ID
    ; HL = Params Ptr
    ; B = Entity Index

    ; We need to pass Entity Index in A to Dispatch ?
    ; Or B ?
    ; Let's use A for Action ID.
    ; Let's use B for Entity Index.
    
    ld c, a; C = Action ID
    ld a, b; A = Entity Index(swap for dispatch if needed)
    ; Actually, let's keep Entity Index in B.
    ld a, c; A = Action ID
    
    call SM_Dispatch
    ; Output: HL = Updated Params Ptr

    ; Restore Entity Index
    pop bc; B = Entity Index

    ; Restore Action List Ptr ?
    ; No, HL was updated by Dispatch to point to next action.
    ; So we discard the old HL.
    pop de; Pop old HL into DE(discard)
    
    jp SM_ExecuteActions_Loop

    ; ------------------------------------------------------------------
; SM_EvaluateCondition
    ; Evaluates a condition at HL
    ; Input: HL = Pointer to Condition Data
    ; A = Entity Index
    ; Output: A = 1(True), 0(False)
        ; HL = Updated Pointer(after params)
    ; ------------------------------------------------------------------
        SM_EvaluateCondition:
    ld b, a             ; B = Entity Index
    ld a, (hl)          ; Get Condition ID
    inc hl

    ; Dispatch to condition handler
    push hl             ; Save Params Ptr
    
    ; Calculate Table Address
    ld l, a
    ld h, 0
    add hl, hl          ; * 2 (word addresses)
    ld de, SM_ConditionTable
    add hl, de
    
    ; Get Handler Address
    ld e, (hl)
    inc hl
    ld d, (hl)
    ; DE = Handler Address
    
    ; Restore Params Ptr to HL
    pop hl
    
    ; Jump to Handler (B = Entity Index, HL = Params)
    push de
    ret
    `,Ht=`
    ; ------------------------------------------------------------------
; SM_Dispatch
    ; Dispatches to the handler for Action A
    ; Input: A = Action ID
    ; HL = Pointer to Params
    ; B = Entity Index
    ; Output: HL = Updated Pointer(after params)
    ; ------------------------------------------------------------------
        SM_Dispatch:
; 1. Save Params Ptr
    push hl

    ; 2. Calculate Table Address
    ld l, a
    ld h, 0
    add hl, hl
    ld de, SM_ActionTable
    add hl, de

    ; 3. Get Handler Address
    ld e, (hl)
    inc hl
    ld d, (hl)
    ; DE = Handler Address

    ; 4. Restore Params Ptr to HL
    pop hl

    ; 5. Jump to Handler
    push de
    ret

SM_ActionTable:
    DW Action_Nop; 0
    DW Action_SetPosition; 1
    DW Action_MoveBy; 2
    DW Action_SetVelocity; 3
    DW Action_ApplyForce; 4
    DW Action_ChangeSprite; 5
    DW Action_PlayAnimation; 6
    DW Action_SetAnimSpeed; 7
    DW Action_ToggleAnim; 8
    DW Action_PlaySound; 9
    DW Action_PlayMusic; 10
    DW Action_MuteMusic; 11
    DW Action_StopMusic; 12
    DW Action_SetVariable; 13
    DW Action_IncVariable; 14
    DW Action_DecVariable; 15
    DW Action_SetCompProp; 16
    DW Action_Wait; 17
    DW Action_GotoState; 18
    DW Action_DestroyEntity; 19
    DW Action_SpawnEntity; 20
    DW Action_GetRandomPos; 21
    DW Action_ChangeGameFlow; 22
    DW Action_DecLives; 23
    DW Action_IncLives; 24
    DW Action_Respawn; 25
    DW Action_BreakTile; 26
    DW Action_ReplaceTile; 27
    DW Action_Rnd; 28
    DW Action_PointAt; 29
    DW Action_AddVars; 30
    DW Action_SubVars; 31
    DW Action_MulVars; 32
    DW Action_DivVars; 33
    DW Action_ModVars; 34
    DW Action_AssignVar; 35

    ; ------------------------------------------------------------------
; ACTION HANDLERS IMPLEMENTATION
    ; ------------------------------------------------------------------

Action_Nop:
    ret

Action_SetPosition:
; Params: X(1 byte), Y(1 byte)
    ld e, (hl); E = X
    inc hl
    ld d, (hl); D = Y
    inc hl
    
    push hl; Save Params Ptr
    
    ld c, b; C = Entity Index
    ld b, 0; BC = Entity Index
    
    ld hl, entity_x_pos
    add hl, bc
    ld (hl), e          ; Set X
    
    ld hl, entity_y_pos
    add hl, bc
    inc hl
    ld d, (hl); D = VY
    inc hl
    
    push hl; Save Params Ptr
    
    ld c, b; C = Entity Index
    ld b, 0; BC = Entity Index
    
    ld hl, entity_vel_x
    add hl, bc
    ld (hl), e          ; Set VX
    
    ld hl, entity_vel_y
    add hl, bc
    ld (hl), d          ; Set VY
    
    pop hl          ; Restore Params Ptr
    ret

Action_MoveBy:
; Params: DX(1 byte signed), DY(1 byte signed)
    ld e, (hl)          ; E = DX
    inc hl
    ld d, (hl)          ; D = DY
    inc hl
    
    push hl             ; Save Params Ptr
    
    ld c, b             ; C = Entity Index
    ld b, 0             ; BC = Entity Index
    
    ; Add DX to X position
    ld hl, entity_x_pos
    add hl, bc
    ld a, (hl)
    add a, e
    ld (hl), a
    
    ; Add DY to Y position
    ld hl, entity_y_pos
    add hl, bc
    ld a, (hl)
    add a, d
    ld (hl), a
    
    pop hl              ; Restore Params Ptr
    ret

Action_SetVelocity:
; Params: VX(1 byte), VY(1 byte)
    ld e, (hl)          ; E = VX
    inc hl
    ld d, (hl)          ; D = VY
    inc hl
    
    push hl             ; Save Params Ptr
    
    ld c, b             ; C = Entity Index
    ld b, 0             ; BC = Entity Index
    
    ld hl, entity_vel_x
    add hl, bc
    ld (hl), e          ; Set VX
    
    ld hl, entity_vel_y
    add hl, bc
    ld (hl), d          ; Set VY
    
    pop hl              ; Restore Params Ptr
    ret

Action_ApplyForce:
; Params: FX(1 byte), FY(1 byte)
    ld e, (hl); E = FX
    inc hl
    ld d, (hl); D = FY
    inc hl
    
    push hl; Save Params Ptr
    
    ld c, b; C = Entity Index
    ld b, 0; BC = Entity Index

    ; Add to VX
    ld hl, entity_vel_x
    add hl, bc
    ld a, (hl)
    add a, e
    ld (hl), a

    ; Add to VY
    ld hl, entity_vel_y
    add hl, bc
    ld a, (hl)
    add a, d
    ld (hl), a
    
    pop hl          ; Restore Params Ptr
    ret


Action_ChangeSprite:
; Params: Sprite ID(1 byte)
    ld e, (hl); E = Sprite ID
    inc hl
    
    push hl; Save Params Ptr
    
    ld c, b; C = Entity Index
    ld b, 0; BC = Entity Index
    
    ld hl, sprite_pattern
    add hl, bc
    ld (hl), e          ; Set Sprite Pattern
    
    pop hl          ; Restore Params Ptr
    ret

Action_PlayAnimation:
; Params: Animation Name(1 byte - ID ?)
    ; TODO: Implement Animation System
    inc hl
    ret

Action_SetAnimSpeed:
; Params: Speed(1 byte)
    inc hl
    ret

Action_ToggleAnim:
; Params: Playing(1 byte)
    inc hl
    ret

Action_PlaySound:
; Params: Sound ID(1 byte)
    ld a, (hl)
    inc hl
    ; TODO: Call Sound Driver
    ; call AFX_PLAY
    ret

Action_PlayMusic:
; Params: Music ID(1 byte)
    ld a, (hl)
    inc hl
    ; TODO: Call Music Driver
    ; call PT3_INIT
    ret

Action_MuteMusic:
; No params
    ; call PT3_MUTE
    ret

Action_StopMusic:
; No params
    ; call PT3_STOP
    ret

Action_SetVariable:
; Params: VarID(1 byte), Value(1 byte)
    ld a, (hl); A = VarID
    inc hl
    ld c, (hl); C = Value
    inc hl
    
    push hl; Save Params Ptr

    ; Calculate Address: entity_sm_var_0 + (VarID * 32) + EntityIndex
    ld l, a
    ld h, 0
    add hl, hl; * 2
    add hl, hl; * 4
    add hl, hl; * 8
    add hl, hl; * 16
    add hl, hl; * 32
    
    ld de, entity_sm_var_0
    add hl, de
    
    ld e, b; E = Entity Index
    ld d, 0
    add hl, de

    ld (hl), c          ; Store Value
    
    pop hl          ; Restore Params Ptr
    ret

Action_IncVariable:
; Params: VarID(1 byte), Amount(1 byte)
    ld a, (hl); A = VarID
    inc hl
    ld c, (hl); C = Amount
    inc hl
    
    push hl; Save Params Ptr

    ; Calculate Address
    ld l, a
    ld h, 0
    add hl, hl; * 32
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    
    ld de, entity_sm_var_0
    add hl, de
    
    ld e, b; E = Entity Index
    ld d, 0
    add hl, de
    
    ld a, (hl)          ; Get current value
    add a, c            ; Add amount
    ld (hl), a          ; Store new value
    
    pop hl
    ret

Action_DecVariable:
; Params: VarID(1 byte), Amount(1 byte)
    ld a, (hl); A = VarID
    inc hl
    ld c, (hl); C = Amount
    inc hl
    
    push hl; Save Params Ptr

    ; Calculate Address
    ld l, a
    ld h, 0
    add hl, hl; * 32
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    
    ld de, entity_sm_var_0
    add hl, de
    
    ld e, b; E = Entity Index
    ld d, 0
    add hl, de
    
    ld a, (hl)          ; Get current value
    sub c               ; Subtract amount
    ld (hl), a          ; Store new value
    
    pop hl
    ret

Action_Wait:
; Params: Duration(1 byte)
    ld a, (hl)          ; A = Duration
    inc hl
    
    push hl             ; Save Params Ptr
    
    ld c, b             ; C = Entity Index
    ld b, 0             ; BC = Entity Index
    
    ld hl, entity_sm_wait_timer
    add hl, bc
    ld (hl), a          ; Set wait timer
    
    pop hl              ; Restore Params Ptr
    ret

Action_GotoState:
; Params: StatePtr Low(1 byte), StatePtr High(1 byte)
    ld e, (hl)          ; E = State Ptr Low
    inc hl
    ld d, (hl)          ; D = State Ptr High
    inc hl
    
    push hl             ; Save Params Ptr
    
    ld a, b             ; A = Entity Index
    call SM_ChangeState
    
    pop hl              ; Restore Params Ptr
    ret

Action_SetCompProp:
    inc hl
    inc hl
    ld d, (hl)
    inc hl
    
    push hl; Save Params Ptr
    
    ld a, b; A = Entity Index
    call SM_ChangeState
    
    pop hl          ; Restore Params Ptr
    ret

Action_DestroyEntity:
; Params: None
    push hl; Save Params Ptr
    
    ld c, b; C = Entity Index
    ld b, 0; BC = Entity Index
    
    ld hl, entity_comp_masks
    add hl, bc
    ld (hl), 0          ; Clear mask(deactivate)
    
    pop hl          ; Restore Params Ptr
    ret

Action_SpawnEntity:
; Params: EntityID(1 byte), X(1 byte), Y(1 byte)
    inc hl
    inc hl
    inc hl
    ret

Action_GetRandomPos:
    ret

Action_ChangeGameFlow:
    inc hl
    ret

Action_DecLives:
    ret

Action_IncLives:
    ret

Action_Respawn:
    ret

Action_BreakTile:
    inc hl
    inc hl
    ret

Action_ReplaceTile:
; Params: TileID(1 byte), Direction(1 byte)
    inc hl
    inc hl
    ret

Action_Rnd:
; Params: VarID(1 byte), DataType(1 byte)
    inc hl
    inc hl
    ret

Action_PointAt:
; Params: X1, Y1, X2, Y2, Speed (5 bytes)
    inc hl
    inc hl
    inc hl
    inc hl
    inc hl
    ret

Action_AddVars:
; Params: DestVar, Src1, Src2 (3 bytes)
    inc hl
    inc hl
    inc hl
    ret

Action_SubVars:
; Params: DestVar, Src1, Src2 (3 bytes)
    inc hl
    inc hl
    inc hl
    ret

Action_MulVars:
; Params: DestVar, Src1, Src2 (3 bytes)
    inc hl
    inc hl
    inc hl
    ret

Action_DivVars:
; Params: DestVar, Src1, Src2 (3 bytes)
    inc hl
    inc hl
    inc hl
    ret

Action_ModVars:
; Params: DestVar, Src1, Src2 (3 bytes)
    inc hl
    inc hl
    inc hl
    ret


Action_AssignVar:
    inc hl
    inc hl
    ret

    ; ------------------------------------------------------------------
    ; CONDITION DISPATCH TABLE
    ; ------------------------------------------------------------------

SM_ConditionTable:
    DW Condition_Nop            ; 0
    DW Condition_And            ; 1
    DW Condition_Or             ; 2
    DW Condition_Not            ; 3
    DW Condition_KeyPressed     ; 4
    DW Condition_KeyReleased    ; 5
    DW Condition_TimeOut        ; 6
    DW Condition_CanMove        ; 7
    DW Condition_HasCollision   ; 8
    DW Condition_PathClear      ; 9
    DW Condition_OnWallCollision; 10
    DW Condition_DeadlyTile     ; 11
    DW Condition_AnimComplete   ; 12
    DW Condition_KeyAndMove     ; 13
    DW Condition_VariableCompare; 14

    ; ------------------------------------------------------------------
    ; CONDITION HANDLERS IMPLEMENTATION
    ; ------------------------------------------------------------------

Condition_Nop:
    ld a, 1                 ; Always true
    ret

Condition_And:
    ; TODO: Implement AND logic
    ld a, 1
    ret

Condition_Or:
    ; TODO: Implement OR logic
    ld a, 1
    ret

Condition_Not:
    ; TODO: Implement NOT logic
    ld a, 1
    ret

Condition_KeyPressed:
    ; TODO: Implement key press check
    inc hl                  ; Skip key param
    ld a, 1
    ret

Condition_KeyReleased:
    ; TODO: Implement key release check
    inc hl                  ; Skip key param
    ld a, 1
    ret

Condition_TimeOut:
    ; TODO: Implement timeout check
    ld a, 1
    ret

Condition_CanMove:
    ; TODO: Implement movement check
    inc hl                  ; Skip direction param
    ld a, 1
    ret

Condition_HasCollision:
    ; TODO: Implement collision check
    ld a, 1
    ret

Condition_PathClear:
    ; TODO: Implement path clear check
    ld a, 1
    ret

Condition_OnWallCollision:
    ; TODO: Implement wall collision check
    inc hl                  ; Skip direction param
    ld a, 1
    ret

Condition_DeadlyTile:
    ; TODO: Implement deadly tile check
    ld a, 1
    ret

Condition_AnimComplete:
    ; TODO: Implement animation complete check
    ld a, 1
    ret

Condition_KeyAndMove:
    ; TODO: Implement key and movement check
    ld a, 1
    ret

Condition_VariableCompare:
    ; Params: VarID (1 byte), Operator (1 byte), Value (1 byte)
    ; Input: B = Entity Index, HL = Params Ptr
    ; Output: A = 1 (true) or 0 (false), HL = Updated Ptr
    
    ld a, (hl)              ; A = Variable ID
    inc hl
    ld c, (hl)              ; C = Operator ID
    inc hl
    ld d, (hl)              ; D = Compare Value
    inc hl
    
    push hl                 ; Save updated params ptr
    push bc                 ; Save Operator and Entity Index
    push de                 ; Save Compare Value
    
    ; Get variable value based on Variable ID
    ; A = Variable ID (0=x, 1=y, 2=vx, 3=vy)
    ; B = Entity Index
    
    ld c, b                 ; C = Entity Index
    ld b, 0                 ; BC = Entity Index
    
    cp 0                    ; Check if x
    jr z, .get_x
    cp 1                    ; Check if y
    jr z, .get_y
    cp 2                    ; Check if vx
    jr z, .get_vx
    cp 3                    ; Check if vy
    jr z, .get_vy
    
    ; Invalid variable ID, return false
    pop de
    pop bc
    pop hl
    ld a, 0
    ret

.get_x:
    ld hl, entity_x_pos
    add hl, bc
    ld e, (hl)              ; E = entity x position
    jr .do_compare

.get_y:
    ld hl, entity_y_pos
    add hl, bc
    ld e, (hl)              ; E = entity y position
    jr .do_compare

.get_vx:
    ld hl, entity_vel_x
    add hl, bc
    ld e, (hl)              ; E = entity x velocity
    jr .do_compare

.get_vy:
    ld hl, entity_vel_y
    add hl, bc
    ld e, (hl)              ; E = entity y velocity
    ; Fall through to .do_compare

.do_compare:
    ; E = Variable Value
    ; Stack: Compare Value (D), Operator (C in saved BC), Entity Index
    pop hl                  ; HL = Compare Value (D in H)
    ld d, h                 ; D = Compare Value
    pop bc                  ; C = Operator ID, B = Entity Index (restore)
    pop hl                  ; HL = Updated Params Ptr
    
    ; Now: E = Variable Value, D = Compare Value, C = Operator
    ; Perform comparison based on operator
    ld a, c                 ; A = Operator ID
    
    cp 0                    ; == operator
    jr z, .op_equals
    cp 1                    ; != operator
    jr z, .op_not_equals
    cp 2                    ; > operator
    jr z, .op_greater
    cp 3                    ; < operator
    jr z, .op_less
    cp 4                    ; >= operator
    jr z, .op_greater_equal
    cp 5                    ; <= operator
    jr z, .op_less_equal
    
    ; Invalid operator, return false
    ld a, 0
    ret

.op_equals:
    ld a, e                 ; A = Variable Value
    cp d                    ; Compare with D
    jr z, .return_true
    jr .return_false

.op_not_equals:
    ld a, e
    cp d
    jr nz, .return_true
    jr .return_false

.op_greater:
    ld a, e
    cp d
    jr z, .return_false     ; If equal, not greater
    jr nc, .return_true     ; If no carry, E >= D, so E > D (since not equal)
    jr .return_false

.op_less:
    ld a, e
    cp d
    jr c, .return_true      ; If carry, E < D
    jr .return_false

.op_greater_equal:
    ld a, e
    cp d
    jr nc, .return_true     ; If no carry, E >= D
    jr .return_false

.op_less_equal:
    ld a, e
    cp d
    jr z, .return_true      ; If equal
    jr c, .return_true      ; If carry, E < D
    jr .return_false

.return_true:
    ld a, 1
    ret

.return_false:
    ld a, 0
    ret
    `;function Vt(e){let n=Gt+`
`+Ht+`

`;n+=`; ==================================================================
`,n+=`; STATE MACHINE DATA
`,n+=`; ==================================================================

`;for(const t of e)n+=jt(t);return n}function jt(e){let n=`; State Machine: ${e.name} (${e.id}) 
`;const t=e.name.replace(/[^a-zA-Z0-9]/g,"_");for(const a of e.states){const o=`SM_${t}_${a.id.replace(/[^a-zA-Z0-9]/g,"_")}`,i=`${o}_OnEnter`,r=`${o}_OnExit`,s=`${o}_Transitions`;n+=`${o}: 
`,n+=`    DB 0; ID(unused) 
`,n+=`    DW ${a.onEnter&&a.onEnter.length>0?i:0} 
`,n+=`    DW ${a.onExit&&a.onExit.length>0?r:0} 
`;const l=e.transitions.filter(d=>d.fromStateId===a.id);if(n+=`    DW ${l.length>0?s:0} 
`,a.onEnter&&a.onEnter.length>0){n+=`${i}: 
`;for(const d of a.onEnter)n+=Ie(d,e.name);n+=`    DB 0xFF; END
`}if(a.onExit&&a.onExit.length>0){n+=`${r}: 
`;for(const d of a.onExit)n+=Ie(d,e.name);n+=`    DB 0xFF; END
`}if(l.length>0){n+=`${s}: 
`,n+=`    DB ${l.length}; Count
`;for(const d of l){const c=`SM_${t}_${d.toStateId.replace(/[^a-zA-Z0-9]/g,"_")}`;d.conditions?n+=Ne(d.conditions):n+=`    DB 0; Empty Condition(Always True) 
`,n+=`    DW ${c} 
`}}n+=`
`}return n}function w(e){if(typeof e=="number")return e.toString();if(typeof e=="boolean")return e?"1":"0";if(typeof e=="string"){if(e==="true")return"1";if(e==="false")return"0";const n=parseInt(e,10);return isNaN(n)?"0":n.toString()}return"0"}function Ie(e,n=""){const t=wt[e.type];if(!t)return`; Unknown Action: ${e.type} 
`;let a=`    DB ${t}; ${e.type} 
`;switch(e.type){case I.SET_POSITION:case I.MOVE_BY:case I.SET_VELOCITY:case I.APPLY_FORCE:a+=`    DB ${w(e.params.x)}, ${w(e.params.y)} 
`;break;case I.CHANGE_SPRITE:a+=`    DB ${w(e.params.spriteId)} 
`;break;case I.PLAY_ANIMATION:a+=`    DB ${w(e.params.animationName)} 
`;break;case I.SET_ANIMATION_SPEED:a+=`    DB ${w(e.params.speed)} 
`;break;case I.TOGGLE_ANIMATION:a+=`    DB ${w(e.params.playing)} 
`;break;case I.PLAY_SOUND:a+=`    DB ${w(e.params.soundId)} 
`;break;case I.SET_VARIABLE:case I.INCREMENT_VARIABLE:case I.DECREMENT_VARIABLE:a+=`    DB ${w(e.params.variableId)}, ${w(e.params.value)} 
`;break;case I.WAIT:a+=`    DB ${w(e.params.duration)} 
`;break;case I.GOTO_STATE:if(n&&e.params.stateId){const o=`SM_${n.replace(/[^a-zA-Z0-9]/g,"_")}_${e.params.stateId.replace(/[^a-zA-Z0-9]/g,"_")} `;a+=`    DW ${o} 
`}else a+=`    DW 0; Invalid GOTO target
`;break;case I.SPAWN_ENTITY:a+=`    DB ${w(e.params.entityId)}, ${w(e.params.x)}, ${w(e.params.y)} 
`;break;case I.DESTROY_ENTITY:a+=`    DB 0
`;break;default:a+=`    ; Params not implemented for ${e.type}
`;break}return a}function Ne(e){var a,o,i,r,s,l,d;const n=$t[e.type];if(!n)return`; Unknown Condition: ${e.type} 
`;let t=`    DB ${n}; ${e.type} 
`;switch(e.type){case U.KEY_PRESSED:case U.KEY_RELEASED:t+=`    DB ${w((a=e.params)==null?void 0:a.key)}; Key Code
`;break;case U.TIME_OUT:t+=`    DB ${w((o=e.params)==null?void 0:o.duration)} 
`;break;case U.AND:case U.OR:if(e.conditions){t+=`    DB ${e.conditions.length} 
`;for(const u of e.conditions)t+=Ne(u)}else t+=`    DB 0
`;break;case U.VARIABLE_COMPARE:const c=kt[((i=e.params)==null?void 0:i.variable)||"x"]||0,_=Bt[((r=e.params)==null?void 0:r.operator)||"=="]||0,p=((s=e.params)==null?void 0:s.value)||0;t+=`    DB ${c}, ${_}, ${w(p)}; ${(l=e.params)==null?void 0:l.variable} ${(d=e.params)==null?void 0:d.operator} ${p}
`;break}return t}function Yt(e,n,t={}){if(console.log("🔧 Generating modular ASM files..."),!e)throw console.error("❌ projectName is required"),new Error("projectName is required");if(!n)throw console.error("❌ assets is undefined or null"),new Error("assets array is required");if(!Array.isArray(n))throw console.error("❌ assets is not an array"),new Error("assets must be an array");console.log(`📊 Project: ${e}, Assets: ${n.length}, Config:`,t);let a;try{a=me(e,n),console.log(`🔍 Analysis complete: ${a.sprites.length} sprites, ${a.tiles.length} tiles`)}catch(i){console.error("❌ Error analyzing project:",i),a={hasSprites:!1,hasTiles:!1,hasScreens:!1,hasEntities:!1,hasComponents:!1,hasGameFlow:!1,hasMenus:!1,hasFonts:!1,hasECS:!1,hasMultipleScreens:!1,hasAnimations:!1,hasCollisions:!1,hasMenuSystem:!1,components:[],templates:[],entities:[],sprites:[],tiles:[],screens:[],screenMaps:[],projectName:e,customStates:[],stateMachines:[],globalVariables:[]},console.log("🔄 Using fallback empty analysis")}const o={"bios.asm":nt(),"constants.asm":ot(a),"variables.asm":it(a),"header.asm":lt(e,a),"patterns.asm":dt(a),"colors.asm":ct(a),"components.asm":Nt(a),"entities.asm":Lt(a),"worlds.asm":Ft(a),"screens.asm":Dt(a),"sprites.asm":mt(a),"font.asm":Rt(a),"hud.asm":Ot(a),"menus.asm":xt(a),"statemachine.asm":a.stateMachines?Vt(a.stateMachines):`; No State Machines
`,"gameflow.asm":"","main.asm":st(e,a),"unitedFiles.asm":""};return t.generateUnified&&(o["unitedFiles.asm"]=_t(o,e,a)),console.log("✅ Modular ASM files generated successfully!"),console.log(`📊 Generated ${Object.keys(o).filter(i=>o[i]).length} files`),o}const qn=Object.freeze(Object.defineProperty({__proto__:null,generateModularASM:Yt},Symbol.toStringTag,{value:"Module"}));export{Ln as $,Vn as A,W as B,jn as C,en as D,tn as E,He as F,Ve as G,$ as H,En as I,hn as J,Ge as K,Qn as L,qt as M,Mn as N,re as O,Zt as P,Yn as Q,Wn as R,se as S,zn as T,De as U,gn as V,Tn as W,An as X,Sn as Y,sn as Z,yn as _,dn as a,bn as a0,In as a1,fn as a2,Nn as a3,Cn as a4,Dn as a5,j as a6,oe as a7,pn as a8,Kn as a9,an as aa,nn as ab,ce as ac,Zn as ad,On as ae,je as af,U as ag,I as ah,Jt as ai,me as aj,Jn as ak,Pn as al,rn as am,Me as an,_n as ao,Rn as ap,on as aq,vn as ar,qn as as,ln as b,cn as c,q as d,Fn as e,mn as f,Un as g,un as h,ve as i,Ue as j,k,Xt as l,Kt as m,ie as n,wn as o,$n as p,kn as q,Bn as r,xn as s,Gn as t,ee as u,te as v,we as w,Hn as x,Qt as y,Xn as z};
