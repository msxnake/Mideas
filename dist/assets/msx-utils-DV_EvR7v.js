const Yt=[16,24,32];var U=(e=>(e.Score="Score",e.HighScore="HighScore",e.Lives="Lives",e.EnergyBar="EnergyBar",e.ItemDisplay="ItemDisplay",e.SceneName="SceneName",e.MiniMap="MiniMap",e.CoinCounter="CoinCounter",e.BossEnergyBar="BossEnergyBar",e.PhaseIndicator="PhaseIndicator",e.AttackAlert="AttackAlert",e.TextBox="TextBox",e.NumericField="NumericField",e.CustomCounter="CustomCounter",e))(U||{});const Ae={water:{bit:0,label:"Water Effect",maskValue:1,color:"rgba(50, 100, 200, 0.4)"},customGravity:{bit:1,label:"Custom Gravity",maskValue:2,color:"rgba(150, 50, 200, 0.4)"},icePhysics:{bit:2,label:"Ice Physics",maskValue:4,color:"rgba(100, 200, 255, 0.4)"},spriteConceal:{bit:3,label:"Sprite Concealment",maskValue:8,color:"rgba(100, 100, 100, 0.4)"}};var ge=(e=>(e.None="None",e.Tile="Tile",e.Sprite="Sprite",e.Screen="Screen",e.Code="Code",e.Attributes="Attributes",e.Sound="Sound",e.Platformer="Platformer",e.WorldMap="WorldMap",e.Track="Track",e.HUD="HUD",e.TileBanks="TileBanks",e.Font="Font",e.HelpDocs="HelpDocs",e.BehaviorEditor="BehaviorEditor",e.ComponentDefinitionEditor="ComponentDefinitionEditor",e.EntityTemplateEditor="EntityTemplateEditor",e.Boss="Boss",e.WorldView="WorldView",e.GameFlow="GameFlow",e.MainMenu="MainMenu",e.StateMachine="StateMachine",e.GlobalVariables="GlobalVariables",e.Palette="Palette",e))(ge||{});const Wt=[1,3,5,7],zt=[{id:0,name:"NoSolid (Passable)",isSolid:!1},{id:1,name:"Solid (Wall/Ground)",isSolid:!0},{id:2,name:"Platform (Top-Solid)",isSolid:!0},{id:3,name:"Slope (Solid)",isSolid:!0}],jt={isBreakable:{bit:0,label:"Breakable"},isMovable:{bit:1,label:"Movable"},causesDamage:{bit:2,label:"Deadly"},isInteractiveSwitch:{bit:3,label:"Interactable"}},Xt="0.266",j=[{name:"Transparent",hex:"rgba(0,0,0,0)"},{name:"Black",hex:"#000000"},{name:"Medium Green",hex:"#3EB847"},{name:"Light Green",hex:"#74D07D"},{name:"Dark Blue",hex:"#2F2FC1"},{name:"Light Blue",hex:"#5858FC"},{name:"Dark Red",hex:"#B63125"},{name:"Cyan",hex:"#68D2DA"},{name:"Medium Red",hex:"#FC584A"},{name:"Light Red",hex:"#FF8E81"},{name:"Dark Yellow",hex:"#C0BF3B"},{name:"Light Yellow",hex:"#E7E474"},{name:"Dark Green",hex:"#309337"},{name:"Magenta",hex:"#B640C8"},{name:"Gray",hex:"#999999"},{name:"White",hex:"#FFFFFF"}],x=[{name:"Transparent (Backdrop)",hex:"rgba(0,0,0,0)",index:0},{name:"Black",hex:"#000000",index:1},{name:"Medium Green",hex:"#21C842",index:2},{name:"Light Green",hex:"#5EDC78",index:3},{name:"Dark Blue",hex:"#5455ED",index:4},{name:"Light Blue",hex:"#7D76FC",index:5},{name:"Dark Red",hex:"#D4524D",index:6},{name:"Cyan",hex:"#42EBF5",index:7},{name:"Medium Red",hex:"#FC5554",index:8},{name:"Light Red",hex:"#FF7978",index:9},{name:"Dark Yellow",hex:"#D4C154",index:10},{name:"Light Yellow",hex:"#E6CE80",index:11},{name:"Dark Green",hex:"#21B03B",index:12},{name:"Magenta",hex:"#C95BBA",index:13},{name:"Gray",hex:"#CCCCCC",index:14},{name:"White",hex:"#FFFFFF",index:15}],k=[0,36,73,109,146,182,219,255],W=e=>e.toString(16).padStart(2,"0").toUpperCase(),Qt=(()=>{const e=[];for(let n=0;n<k.length;n++)for(let t=0;t<k.length;t++)for(let a=0;a<k.length;a++){const o=n<<6|t<<3|a;e.push({index:o,hex:`#${W(k[n])}${W(k[t])}${W(k[a])}`,rLevel:n,gLevel:t,bLevel:a})}return e})(),oe=e=>{let n=0,t=1/0;return k.forEach((a,o)=>{const l=Math.abs(a-e);l<t&&(t=l,n=o)}),n},Ie=e=>!e||!e.startsWith("#")||e.length!==7?"#000000":e.toUpperCase(),Ce=e=>{const n=Ie(e),t=parseInt(n.slice(1,3),16),a=parseInt(n.slice(3,5),16),o=parseInt(n.slice(5,7),16),l=oe(t),i=oe(a),d=oe(o),p=`#${W(k[l])}${W(k[i])}${W(k[d])}`,s=l<<6|i<<3|d;return{hex:p,masterIndex:s}},Kt=j.map((e,n)=>{if(n===0)return{slotIndex:0,masterIndex:-1,hex:"rgba(0,0,0,0)"};const t=Ce(e.hex);return{slotIndex:n,masterIndex:t.masterIndex,hex:t.hex}}),Zt=[8,16,24,32],Jt=16,qt=16,en=16,H=32,J=24,Y=8,G=255,tn="SCREEN 2 (Graphics I)",nn=["ADC","ADD","AND","BIT","CALL","CCF","CP","CPD","CPDR","CPI","CPIR","CPL","DAA","DEC","DI","DJNZ","EI","EX","EXX","HALT","IM","IN","INC","IND","INDR","INI","INIR","JP","JR","LD","LDD","LDDR","LDI","LDIR","NEG","NOP","OR","OTDR","OTIR","OUT","OUTD","OUTI","POP","PUSH","RES","RET","RETI","RETN","RL","RLA","RLC","RLCA","RLD","RR","RRA","RRC","RRCA","RRD","RST","SBC","SCF","SET","SLA","SLL","SRA","SRL","SUB","XOR"],an=["A","F","B","C","D","E","H","L","AF","BC","DE","HL","IXH","IXL","IYH","IYL","IX","IY","SP","PC","I","R","AF'"],on=["NZ","Z","NC","C","PO","PE","P","M"],ln=[".ORG","ORG","END",".END",".EQU","EQU",".DB","DB",".BYTE","BYTE","DEFB",".DW","DW",".WORD","WORD","DEFW",".DS","DS",".BLOCK","BLOCK","DEFS",".DEFINE","DEFINE",".MACRO","MACRO",".ENDM","ENDM",".IF","IF",".ENDIF","ENDIF",".ELSE","ELSE",".INCLUDE","INCLUDE",".DEFM","DEFM",".ZILOG",".PHASE",".REPT",".ENDR",".SEARCH",".RANDOM",".ROM",".MEGAROM",".BASIC",".CAS",".WAV",".MSXDOS"],rn=[{id:"pac_man_collection",name:"Pac-Man Tile Collection",code:`; Pac-Man Style Tile Collection System for MSX
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
POWER_MODE:         DB 0       ; Power-up mode active flag`}],sn=[],ne=8,X=15,Q=1;var ue;const dn=((ue=x.find(e=>e.index===X))==null?void 0:ue.hex)||x[15].hex;var Ee;const cn=((Ee=x.find(e=>e.index===Q))==null?void 0:Ee.hex)||x[1].hex,q=new Map(x.map(e=>[e.hex,e])),pn=new Map(x.map(e=>[e.index,e])),_n=x[1],hn=32,mn=125,un=6,En=31,Tn=15,Sn=["A","B","C"],fn=["1","2","3","4","5"],An=["C-","C#","D-","D#","E-","F-","F#","G-","G#","A-","A#","B-"],gn=[0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,7,7,6,6,5,5,4,4,3,3,2,2,1,1,0,0],In=32,Cn={q:{noteNameIndex:0,baseOctave:5},w:{noteNameIndex:1,baseOctave:5},e:{noteNameIndex:2,baseOctave:5},r:{noteNameIndex:3,baseOctave:5},t:{noteNameIndex:4,baseOctave:5},y:{noteNameIndex:5,baseOctave:5},u:{noteNameIndex:6,baseOctave:5},i:{noteNameIndex:7,baseOctave:5},o:{noteNameIndex:8,baseOctave:5},p:{noteNameIndex:9,baseOctave:5},"[":{noteNameIndex:10,baseOctave:5},"]":{noteNameIndex:11,baseOctave:5},a:{noteNameIndex:0,baseOctave:4},s:{noteNameIndex:1,baseOctave:4},d:{noteNameIndex:2,baseOctave:4},f:{noteNameIndex:3,baseOctave:4},g:{noteNameIndex:4,baseOctave:4},h:{noteNameIndex:5,baseOctave:4},j:{noteNameIndex:6,baseOctave:4},k:{noteNameIndex:7,baseOctave:4},l:{noteNameIndex:8,baseOctave:4},ñ:{noteNameIndex:9,baseOctave:4},";":{noteNameIndex:9,baseOctave:4},"'":{noteNameIndex:10,baseOctave:4},z:{noteNameIndex:0,baseOctave:3},x:{noteNameIndex:1,baseOctave:3},c:{noteNameIndex:2,baseOctave:3},v:{noteNameIndex:3,baseOctave:3},b:{noteNameIndex:4,baseOctave:3},n:{noteNameIndex:5,baseOctave:3},m:{noteNameIndex:6,baseOctave:3},",":{noteNameIndex:7,baseOctave:3},".":{noteNameIndex:8,baseOctave:3},2:{noteNameIndex:1,baseOctave:5},3:{noteNameIndex:3,baseOctave:5},5:{noteNameIndex:6,baseOctave:5},6:{noteNameIndex:8,baseOctave:5},7:{noteNameIndex:10,baseOctave:5}},bn={min:-2,max:2},yn=[{id:1,name:"Piano",volumeEnvelope:[15,14,13,11,9,7,5,3,2,1,0],toneEnvelope:[0],volumeLoop:255,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:0},{id:2,name:"Electric Bass",volumeEnvelope:[15,14,13,12,11,10,9,8],toneEnvelope:[0],volumeLoop:3,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:12},{id:3,name:"Lead Vibrato",volumeEnvelope:[0,5,10,15,15,15,14,13,12],toneEnvelope:[0,1,2,1,0,-1,-2,-1],volumeLoop:4,toneLoop:0,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:13},{id:4,name:"Strings Pad",volumeEnvelope:[0,2,4,6,8,10,12,14,15,15,15],toneEnvelope:[0,0,1,1,0,0,-1,-1],volumeLoop:8,toneLoop:0,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:13},{id:5,name:"Kick Drum",volumeEnvelope:[15,13,10,7,4,2,0],toneEnvelope:[12,10,8,6,4,2,0],volumeLoop:255,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:0},{id:6,name:"Snare Drum",volumeEnvelope:[15,12,9,6,3,1,0],toneEnvelope:[0],volumeLoop:255,toneLoop:255,ayToneEnabled:!1,ayNoiseEnabled:!0,ayEnvelopeShape:0},{id:7,name:"Hi-Hat",volumeEnvelope:[12,10,8,6,4,2,0],toneEnvelope:[0],volumeLoop:255,toneLoop:255,ayToneEnabled:!1,ayNoiseEnabled:!0,ayEnvelopeShape:0},{id:8,name:"Arpeggio",volumeEnvelope:[15,15,14,14,13,13,12,12],toneEnvelope:[0,4,7,12,7,4,0],volumeLoop:0,toneLoop:0,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:10},{id:9,name:"Organ",volumeEnvelope:[15,15,15,15,15],toneEnvelope:[0],volumeLoop:0,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:13},{id:10,name:"Bell",volumeEnvelope:[15,14,12,10,8,6,4,3,2,1,0],toneEnvelope:[0,12,0],volumeLoop:255,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:0}],be=[{id:"bank_0",name:"Bank 0 - HUD/Fonts",enabled:!0,vramPatternStart:0,vramColorStart:8192,screenZone:{x:0,y:0,width:H,height:8},charsetRangeStart:0,charsetRangeEnd:255,defaultFgColorIndex:15,defaultBgColorIndex:4,isLocked:!1,assignedTiles:{}},{id:"bank_1",name:"Bank 1 - Game Tileset",enabled:!0,vramPatternStart:2048,vramColorStart:10240,screenZone:{x:0,y:8,width:H,height:8},charsetRangeStart:0,charsetRangeEnd:255,defaultFgColorIndex:2,defaultBgColorIndex:1,isLocked:!1,assignedTiles:{}},{id:"bank_2",name:"Bank 2 - Background/Status",enabled:!0,vramPatternStart:4096,vramColorStart:12288,screenZone:{x:0,y:16,width:H,height:8},charsetRangeStart:0,charsetRangeEnd:255,defaultFgColorIndex:11,defaultBgColorIndex:6,isLocked:!1,assignedTiles:{}}],Ln={isEnabled:!0,options:[{id:"start",label:"INICIAR PARTIDA",enabled:!0},{id:"continue",label:"CONTINUAR",enabled:!0},{id:"settings",label:"AJUSTES",enabled:!0},{id:"help",label:"AYUDA",enabled:!1}],keyMapping:{up:"ArrowUp",down:"ArrowDown",left:"ArrowLeft",right:"ArrowRight",fire1:" ",fire2:"m"},settings:{volume:12},continueScreen:{title:"CONTINUAR PARTIDA",prompt:"INTRODUCE TU CODIGO"},introScreen:{text:`EN EL ANO 2084, LA CORPORACION CYBERNETICA DOMINA EL MUNDO...

SOLO UN HEROE PUEDE DETENERLOS.`,backgroundAssetId:null},menuScreenAssetId:null,cursorSpriteAssetId:null,menuColors:{text:x[15].hex,background:x[4].hex,highlightText:x[11].hex,highlightBackground:x[5].hex,border:x[15].hex}},Nn=Ae,Dn="HELP_DOCS_SYSTEM_ASSET",Rn=50,ie=[{name:"Goal",asmName:"global_var_goal",constantPrefix:"GOAL_",type:"byte",description:"Current objective status",category:"objective",values:[{label:"Failure",value:0,asmConstant:"GOAL_FAILURE"},{label:"Completed",value:1,asmConstant:"GOAL_COMPLETED"},{label:"Partial",value:2,asmConstant:"GOAL_PARTIAL"}]},{name:"MissionStatus",asmName:"global_var_mission_status",constantPrefix:"MISSION_",type:"byte",description:"Current mission state",category:"objective",values:[{label:"NotStarted",value:0,asmConstant:"MISSION_NOT_STARTED"},{label:"Active",value:1,asmConstant:"MISSION_ACTIVE"},{label:"Completed",value:2,asmConstant:"MISSION_COMPLETED"},{label:"Failed",value:3,asmConstant:"MISSION_FAILED"}]},{name:"LevelCompleted",asmName:"global_var_level_completed",constantPrefix:"BOOL_",type:"byte",description:"Level completion flag",category:"objective",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"BossDefeated",asmName:"global_var_boss_defeated",constantPrefix:"BOOL_",type:"byte",description:"Boss defeated flag",category:"objective",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"AllItemsCollected",asmName:"global_var_all_items_collected",constantPrefix:"BOOL_",type:"byte",description:"All items collected flag",category:"objective",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"Score",asmName:"global_var_score",constantPrefix:"SCORE_",type:"word",description:"Current player score (0-65535)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"HiScore",asmName:"global_var_hi_score",constantPrefix:"HISCORE_",type:"word",description:"High score record (0-65535)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"ComboMultiplier",asmName:"global_var_combo_multiplier",constantPrefix:"COMBO_",type:"byte",description:"Combo multiplier (1x, 2x, 3x...)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"Coins",asmName:"global_var_coins",constantPrefix:"COINS_",type:"byte",description:"Coins collected (0-255)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"Gems",asmName:"global_var_gems",constantPrefix:"GEMS_",type:"byte",description:"Gems collected (0-255)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"Lives",asmName:"global_var_lives",constantPrefix:"LIVES_",type:"byte",description:"Remaining lives (0-255)",category:"player",values:[{label:"Custom Value",value:"number"}]},{name:"Health",asmName:"global_var_health",constantPrefix:"HEALTH_",type:"byte",description:"Current health (0-255)",category:"player",values:[{label:"Custom Value",value:"number"}]},{name:"Energy",asmName:"global_var_energy",constantPrefix:"ENERGY_",type:"byte",description:"Current energy/mana (0-255)",category:"player",values:[{label:"Custom Value",value:"number"}]},{name:"Shield",asmName:"global_var_shield",constantPrefix:"BOOL_",type:"byte",description:"Shield active flag",category:"player",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"HasKey",asmName:"global_var_has_key",constantPrefix:"BOOL_",type:"byte",description:"Has key item",category:"inventory",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"HasSword",asmName:"global_var_has_sword",constantPrefix:"BOOL_",type:"byte",description:"Has sword item",category:"inventory",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"HasMap",asmName:"global_var_has_map",constantPrefix:"BOOL_",type:"byte",description:"Has map item",category:"inventory",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"ItemCount",asmName:"global_var_item_count",constantPrefix:"ITEMS_",type:"byte",description:"Special items collected (0-255)",category:"inventory",values:[{label:"Custom Value",value:"number"}]},{name:"PowerUpActive",asmName:"global_var_powerup_active",constantPrefix:"POWERUP_",type:"byte",description:"Active power-up type",category:"inventory",values:[{label:"None",value:0,asmConstant:"POWERUP_NONE"},{label:"Speed",value:1,asmConstant:"POWERUP_SPEED"},{label:"Jump",value:2,asmConstant:"POWERUP_JUMP"},{label:"Invincible",value:3,asmConstant:"POWERUP_INVINCIBLE"}]},{name:"CurrentWorld",asmName:"global_var_current_world",constantPrefix:"WORLD_",type:"byte",description:"Current world number (1-8)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"CurrentLevel",asmName:"global_var_current_level",constantPrefix:"LEVEL_",type:"byte",description:"Current level number (0-255)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"CheckpointReached",asmName:"global_var_checkpoint",constantPrefix:"CHECKPOINT_",type:"byte",description:"Checkpoint reached (0-255)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"SecretFound",asmName:"global_var_secret_found",constantPrefix:"BOOL_",type:"byte",description:"Secret area found flag",category:"progress",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"DoorsUnlocked",asmName:"global_var_doors_unlocked",constantPrefix:"DOORS_",type:"byte",description:"Doors unlocked bitmask (0-255)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"TimeRemaining",asmName:"global_var_time_remaining",constantPrefix:"TIME_",type:"word",description:"Time remaining in seconds (0-65535)",category:"time",values:[{label:"Custom Value",value:"number"}]},{name:"TimeLimitActive",asmName:"global_var_time_limit_active",constantPrefix:"BOOL_",type:"byte",description:"Time limit active flag",category:"time",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"DayNightCycle",asmName:"global_var_day_night_cycle",constantPrefix:"TIME_",type:"byte",description:"Day/night cycle state (0-23)",category:"time",values:[{label:"Custom Value",value:"number"}]},{name:"DifficultyLevel",asmName:"global_var_difficulty",constantPrefix:"DIFFICULTY_",type:"byte",description:"Game difficulty level",category:"difficulty",values:[{label:"Easy",value:0,asmConstant:"DIFFICULTY_EASY"},{label:"Normal",value:1,asmConstant:"DIFFICULTY_NORMAL"},{label:"Hard",value:2,asmConstant:"DIFFICULTY_HARD"},{label:"Expert",value:3,asmConstant:"DIFFICULTY_EXPERT"}]},{name:"EnemiesDefeated",asmName:"global_var_enemies_defeated",constantPrefix:"ENEMIES_",type:"word",description:"Enemies defeated count (0-65535)",category:"special",values:[{label:"Custom Value",value:"number"}]},{name:"PerfectRun",asmName:"global_var_perfect_run",constantPrefix:"BOOL_",type:"byte",description:"Perfect run (no damage) flag",category:"special",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]}],M=8,ye=e=>{let n=e.toString(16).toUpperCase();return n.length===1&&(n="0"+n),n},On=(e,n,t)=>{var c,_;if(!e.lineAttributes)return`;; ERROR: Tile ${n} is missing line attributes required for SCREEN 2 export.
`;const a=n.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let o=`;; Tile: ${n} (${e.width}x${e.height})
`;o+=`;; Structure: ${e.width/M}x${e.height/M} character blocks (8x8 pixels each)
`,o+=`;; Data format: ${t.toUpperCase()}

`;const l=e.width/M,i=e.height/M,d=u=>t==="hex"?`$${ye(u)}`:u.toString(10),p=[],s=[];for(let u=0;u<i;u++)for(let S=0;S<l;S++){const T=`;; Character Block (${S}, ${u}) for ${a}`,r=[];for(let f=0;f<M;f++){const g=u*M+f;let I=0;if(e.lineAttributes[g]&&e.lineAttributes[g][S]){const C=e.lineAttributes[g][S].fg;for(let b=0;b<M;b++){const y=S*M+b;e.data[g]&&e.data[g][y]!==void 0&&e.data[g][y]===C&&(I|=1<<7-b)}}r.push(I)}const m=r.map(d).join(",");p.push({comment:`${T} - PATTERN Data (8 bytes):`,dataString:`DB ${m}`});const h=[];for(let f=0;f<M;f++){const g=u*M+f;let I=X<<4|Q;if(e.lineAttributes[g]&&e.lineAttributes[g][S]){const C=e.lineAttributes[g][S],b=((c=q.get(C.fg))==null?void 0:c.index)??X,y=((_=q.get(C.bg))==null?void 0:_.index)??Q;I=b<<4|y}h.push(I)}const E=h.map(d).join(",");s.push({comment:`${T} - COLOR Attribute Data (8 bytes - FG|BG):`,dataString:`DB ${E}`})}return o+=`;; --- PATTERN DATA ---
`,p.length>0?(o+=`${a}_PATTERN_DATA:
`,p.forEach(u=>{o+=`${u.comment}
`,o+=`    ${u.dataString}
`})):o+=`;; No pattern data generated.
`,o+=`
`,o+=`;; --- COLOR ATTRIBUTE DATA ---
`,s.length>0?(o+=`${a}_COLOR_DATA:
`,s.forEach(u=>{o+=`${u.comment}
`,o+=`    ${u.dataString}
`})):o+=`;; No color attribute data generated.
`,o+=`
;; End of Tile Data for ${a}
`,o},Mn=(e,n,t,a)=>{const o=Math.max(1,e/ne);return Array(n).fill(null).map(()=>Array(o).fill(null).map(()=>({fg:t,bg:a})))},Le=(e,n)=>{var i,d,p,s;const t=[],a=e.width/M,o=e.height/M,l=n==="SCREEN 2 (Graphics I)";for(let c=0;c<o;c++)for(let _=0;_<a;_++)for(let u=0;u<M;u++){const S=c*M+u;let T=0,r;l&&e.lineAttributes&&e.lineAttributes[S]&&e.lineAttributes[S][_]&&(r=e.lineAttributes[S][_].fg);for(let m=0;m<M;m++){const h=_*M+m,E=(i=e.data[S])==null?void 0:i[h];if(E!==void 0){let f=!1;l&&r?f=E===r:l||(f=E!==j[0].hex&&E!==((s=(p=(d=e.lineAttributes)==null?void 0:d[0])==null?void 0:p[0])==null?void 0:s.bg)),f&&(T|=1<<7-m)}}t.push(T)}return new Uint8Array(t)},z=(e,n)=>{var l,i;const t=e.length;if(t===0)return[];const a=((l=e[0])==null?void 0:l.length)||0;if(a===0)return[[]];const o=e.map(d=>[...d]);for(let d=0;d<t;d++)for(let p=0;p<a;p++){const s=Math.floor(p/ne),c=(i=n[d])==null?void 0:i[s],_=o[d][p];c&&_!==c.fg&&_!==c.bg&&(o[d][p]=c.fg)}return o},vn=(e,n,t)=>{if(e.length<2)return e;const o=e.slice(1);return o.push([...e[0]]),t==="SCREEN 2 (Graphics I)"&&n?z(o,n):o},Pn=(e,n,t)=>{const a=e.length;if(a<2)return e;const o=e.slice(0,a-1);return o.unshift([...e[a-1]]),t==="SCREEN 2 (Graphics I)"&&n?z(o,n):o},xn=(e,n,t)=>{if(e.length===0)return[];const a=e.map(o=>{if(o.length<2)return[...o];const l=o.slice(1);return l.push(o[0]),l});return t==="SCREEN 2 (Graphics I)"&&n?z(a,n):a},Un=(e,n,t)=>{if(e.length===0)return[];const a=e.map(o=>{const l=o.length;if(l<2)return[...o];const i=o.slice(0,l-1);return i.unshift(o[l-1]),i});return t==="SCREEN 2 (Graphics I)"&&n?z(a,n):a},wn=(e,n,t)=>{if(e.length===0)return[];const a=e.map(o=>[...o].reverse());return t==="SCREEN 2 (Graphics I)"&&n?z(a,n):a},kn=(e,n,t)=>{if(e.length===0)return[];const a=[...e].reverse();return t==="SCREEN 2 (Graphics I)"&&n?z(a,n):a},Ne=e=>{var o,l,i;if(!e.lineAttributes)return null;const n=[],t=e.width/M,a=e.height/M;for(let d=0;d<a;d++)for(let p=0;p<t;p++)for(let s=0;s<M;s++){const c=d*M+s;let _=X<<4|Q;const u=(o=e.lineAttributes[c])==null?void 0:o[p];if(u){const S=((l=q.get(u.fg))==null?void 0:l.index)??X,T=((i=q.get(u.bg))==null?void 0:i.index)??Q;_=S<<4|T}n.push(_)}return new Uint8Array(n)},Bn=e=>{const n=[];e.frames.forEach(a=>{var o,l,i,d,p;for(let s=0;s<e.spritePalette.length;s++){const c=e.spritePalette[s];if(c===e.backgroundColor)continue;let _=!1;const u=[],S=e.size.width,T=e.size.height;if(S===16&&T===16){for(let r=0;r<8;r++){let m=0;for(let h=0;h<8;h++)((o=a.data[r])==null?void 0:o[h])===c&&(m|=1<<7-h,_=!0);u.push(m)}for(let r=8;r<16;r++){let m=0;for(let h=0;h<8;h++)((l=a.data[r])==null?void 0:l[h])===c&&(m|=1<<7-h,_=!0);u.push(m)}for(let r=0;r<8;r++){let m=0;for(let h=0;h<8;h++)((i=a.data[r])==null?void 0:i[8+h])===c&&(m|=1<<7-h,_=!0);u.push(m)}for(let r=8;r<16;r++){let m=0;for(let h=0;h<8;h++)((d=a.data[r])==null?void 0:d[8+h])===c&&(m|=1<<7-h,_=!0);u.push(m)}}else for(let r=0;r<T;r++)for(let m=0;m<Math.ceil(S/8);m++){let h=0;for(let E=0;E<8;E++){const f=m*8+E;f<S&&((p=a.data[r])==null?void 0:p[f])===c&&(h|=1<<7-E,_=!0)}u.push(h)}_&&n.push(u)}});const t=n.flat();return new Uint8Array(t)},$n=e=>e.map(n=>[...n].reverse()),Fn=e=>[...e].reverse(),De=e=>{let n=e.toString(16).toUpperCase();return n.length===1&&(n="0"+n),n},Re=(e,n,t,a,o,l,i="hex")=>{var _,u,S,T,r,m;const p=e.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let s=`;; ---- Sprite Frame: ${e} ----
`;s+=`;; Size: ${o}x${l}
`;let c=0;for(let h=0;h<t.length;h++){const E=t[h];let f=!1;if(E!==a)for(let I=0;I<l;I++){for(let C=0;C<o;C++)if(((_=n[I])==null?void 0:_[C])===E){f=!0;break}if(f)break}if(!f){s+=`;; Layer ${h} (Color: ${E}) - SKIPPED (color not used or is background)
`;continue}c++,s+=`${p}_LAYER${h}: ; Brush Color Index ${h} (Actual Color: ${E})
`;const g=[];if(o%8!==0&&(s+=`;; WARNING: Sprite width ${o} is not a multiple of 8. Bitmask generation might be problematic for standard VDP.
`),o===16&&l===16){for(let I=0;I<8;I++){let C=0;for(let b=0;b<8;b++){const y=b;((u=n[I])==null?void 0:u[y])===E&&(C|=1<<7-b)}g.push(C)}for(let I=8;I<16;I++){let C=0;for(let b=0;b<8;b++){const y=b;((S=n[I])==null?void 0:S[y])===E&&(C|=1<<7-b)}g.push(C)}for(let I=0;I<8;I++){let C=0;for(let b=0;b<8;b++){const y=8+b;((T=n[I])==null?void 0:T[y])===E&&(C|=1<<7-b)}g.push(C)}for(let I=8;I<16;I++){let C=0;for(let b=0;b<8;b++){const y=8+b;((r=n[I])==null?void 0:r[y])===E&&(C|=1<<7-b)}g.push(C)}}else for(let I=0;I<l;I++)for(let C=0;C<Math.ceil(o/8);C++){let b=0;for(let y=0;y<8;y++){const N=C*8+y;N<o&&((m=n[I])==null?void 0:m[N])===E&&(b|=1<<7-y)}g.push(b)}for(let I=0;I<g.length;I+=16){const b=g.slice(I,I+16).map(y=>i==="hex"?`#${De(y)}`:y.toString());s+=`    DB ${b.join(",")}
`}s+=`
`}return c===0&&(s+=`;; NO ACTIVE LAYERS EXPORTED for ${e} - Frame might be empty or only contain the background color.
`),s+=`;; ---- End of Frame: ${e} ----

`,s},Oe=(e,n="hex",t)=>{let a=`;; Sprite: ${e.name}
`;a+=`;; Total Frames: ${e.frames.length}
`,a+=`;; Size: ${e.size.width}x${e.size.height}
`,a+=`;; Background Color (not exported as a layer): ${e.backgroundColor}
`,a+=`;; Drawable Palette (Hex): C0=${e.spritePalette[0]}, C1=${e.spritePalette[1]}, C2=${e.spritePalette[2]}, C3=${e.spritePalette[3]}

`;const o=t!==void 0?`_${t}`:"",l=e.name+o,i=l.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();return a+=`SPRITE_${i}_WIDTH     EQU ${e.size.width}
`,a+=`SPRITE_${i}_HEIGHT    EQU ${e.size.height}
`,a+=`SPRITE_${i}_FRAMES    EQU ${e.frames.length}

`,e.frames.forEach((d,p)=>{a+=Re(`${l}_F${p}`,d.data,e.spritePalette,e.backgroundColor,e.size.width,e.size.height,n)}),a},le=16,Te="SCREEN 2 (Graphics I)",Me="SCREEN 5 (Graphics III)",F=8,ve={pixelWidth:H*le,pixelHeight:J*le,widthTiles:H,heightTiles:J,baseTileSize:le},_e={[Te]:{pixelWidth:H*Y,pixelHeight:J*Y,widthTiles:H,heightTiles:J,baseTileSize:Y},[Me]:{pixelWidth:256,pixelHeight:212,widthTiles:32,heightTiles:27,baseTileSize:Y},"SCREEN 0 (Text 40)":{pixelWidth:240,pixelHeight:192,widthTiles:40,heightTiles:24,baseTileSize:F},"SCREEN 1 (Text 32)":{pixelWidth:256,pixelHeight:192,widthTiles:32,heightTiles:24,baseTileSize:F},"SCREEN 3 (Multicolor)":{pixelWidth:256,pixelHeight:192,widthTiles:32,heightTiles:24,baseTileSize:F},"SCREEN 4 (Graphics II)":{pixelWidth:256,pixelHeight:192,widthTiles:32,heightTiles:24,baseTileSize:F},"SCREEN 6 (Graphics IV)":{pixelWidth:512,pixelHeight:212,widthTiles:64,heightTiles:27,baseTileSize:F},"SCREEN 7 (Graphics V)":{pixelWidth:512,pixelHeight:212,widthTiles:64,heightTiles:27,baseTileSize:F},"SCREEN 8 (Graphics VI)":{pixelWidth:256,pixelHeight:212,widthTiles:32,heightTiles:27,baseTileSize:F}};function Hn(e){const n=typeof e=="string"?e.trim():"";return n&&_e[n]?_e[n]:ve}const ee=e=>e===Te,Pe=e=>ee(e)?x:j,xe=(e,n)=>{const t=Pe(n);if(e===void 0||e<0||e>=t.length)return ee(n)?x[1].hex:j[4].hex;const a=t[e];return(a==null?void 0:a.hex)??(ee(n)?x[1].hex:j[4].hex)},Vn=(e,n,t,a)=>{var u;const o=e.layers.background,l=e.activeAreaX??0,i=e.activeAreaY??0,d=e.activeAreaWidth??e.width,p=e.activeAreaHeight??e.height,s=[];let c=0;const _=new Map;for(let S=0;S<p;S++){const T=i+S;for(let r=0;r<d;r++){const m=l+r;if(T>=o.length||m>=((u=o[T])==null?void 0:u.length)){s.push(G);continue}const h=o[T][m];if(!h||!h.tileId)s.push(G);else{let E=G;const f=n.find(g=>g.id===h.tileId);if(a==="SCREEN 2 (Graphics I)"&&t&&f){let g=!1,I={tileId:h.tileId,position:{x:m,y:T},attempts:[],banksReceived:t.length};typeof globalThis.screenUtils_firstTileLogged>"u"&&(console.log("🔍 First tile structure check:",{tileId:h.tileId,position:{x:m,y:T},banksCount:t.length,banks:t.map(C=>({name:C.name,assignedTileIds:Object.keys(C.assignedTiles||{}),hasThisTile:!!(C.assignedTiles&&C.assignedTiles[h.tileId]),assignedTilesType:typeof C.assignedTiles,assignedTilesSample:C.assignedTiles?Object.entries(C.assignedTiles).slice(0,2):[]}))}),globalThis.screenUtils_firstTileLogged=!0);for(const C of t)if((C.enabled??!0)&&C.assignedTiles[h.tileId]){const b=C.assignedTiles[h.tileId].charCode,y=Math.ceil(f.width/Y),N=h.subTileX||0,A=h.subTileY||0;E=b+A*y+N;const D=E>=C.charsetRangeStart&&E<=C.charsetRangeEnd;if(I.attempts.push({bankName:C.name,baseCharCode:b,calculated:E,range:`${C.charsetRangeStart}-${C.charsetRangeEnd}`,inRange:D}),D){g=!0;break}else E=G}else I.attempts.push({bankName:C.name,reason:"Tile not assigned to this bank"});g||(console.warn("⚠️ Tile not found in valid range:",I),E=G)}else if(a!=="SCREEN 2 (Graphics I)"){const g=`${h.tileId}_${h.subTileX??0}_${h.subTileY??0}`;_.has(g)?E=_.get(g):c>255?E=G:(_.set(g,c),E=c++)}s.push(E)}}}return new Uint8Array(s)},Ue=(e,n,t,a,o,l="hex")=>{const d=e.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let p=`;; MAP: ${e} (${n}x${t} tiles)
`;p+=`;; Total size: ${a.length} bytes

`,o.length>0&&(p+=`;; --- TILE INDEX REFERENCES for ${d} ---
`,p+=o.join(`
`)+`

`),p+=`SCREEN_${d}_WIDTH     EQU ${n}
`,p+=`SCREEN_${d}_HEIGHT    EQU ${t}
`,p+=`SCREEN_${d}_SIZE      EQU ${a.length}

`,p+=`SCREEN_${d}_LAYOUT:
`;for(let s=0;s<a.length;s+=16){const _=a.slice(s,s+16).map(u=>l==="hex"?`#${u.toString(16).padStart(2,"0").toUpperCase()}`:u.toString());p+=`    DB ${_.join(",")}
`}return p},we=(e,n,t,a,o="hex")=>{const i=e.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let d=`;; BEHAVIOR MAP: ${e} (${n}x${t} tiles)
`;d+=`;; Total size: ${a.length} bytes (Map IDs 0-255)
`,d+=`;; Data format: ${o.toUpperCase()}

`,d+=`BEHAVIOR_${i}_WIDTH     EQU ${n}
`,d+=`BEHAVIOR_${i}_HEIGHT    EQU ${t}
`,d+=`BEHAVIOR_${i}_SIZE      EQU ${a.length}

`,d+=`BEHAVIOR_${i}_DATA:
`;const p=s=>o==="hex"?`#${s.toString(16).padStart(2,"0").toUpperCase()}`:s.toString(10);for(let s=0;s<a.length;s+=16){const _=a.slice(s,s+16).map(p);d+=`    DB ${_.join(",")}
`}return d+=`
;; End of Behavior Map Data for ${e}
`,d},Gn=(e,n)=>{if(e.width!==n.width||e.height!==n.height||e.data.length!==n.data.length)return!1;for(let t=0;t<e.height;t++){if(e.data[t].length!==n.data[t].length)return!1;for(let a=0;a<e.width;a++)if(e.data[t][a]!==n.data[t][a])return!1}if(e.lineAttributes&&n.lineAttributes){if(e.lineAttributes.length!==n.lineAttributes.length)return!1;for(let t=0;t<e.lineAttributes.length;t++){if(e.lineAttributes[t].length!==n.lineAttributes[t].length)return!1;for(let a=0;a<e.lineAttributes[t].length;a++)if(e.lineAttributes[t][a].fg!==n.lineAttributes[t][a].fg||e.lineAttributes[t][a].bg!==n.lineAttributes[t][a].bg)return!1}}else if(e.lineAttributes!==n.lineAttributes)return!1;return JSON.stringify(e.logicalProperties)===JSON.stringify(n.logicalProperties)};function Yn(e,n,t,a,o,l,i){const{data:d,width:p,height:s,lineAttributes:c}=e;if(!d||s===0||p===0)return"";const _=document.createElement("canvas");_.width=l,_.height=l;const u=_.getContext("2d");if(!u)return"";u.imageSmoothingEnabled=!1;const S=(n??0)*l,T=(t??0)*l;for(let h=0;h<l;h++)for(let E=0;E<l;E++){const f=S+E,g=T+h;if(g>=0&&g<s&&f>=0&&f<p){let I=d[g][f];if(i==="SCREEN 2 (Graphics I)"&&c&&c[g]){const C=Math.floor(f/ne),b=c[g][C];b&&I!==b.fg&&I!==b.bg&&(I=b.fg)}u.fillStyle=I,u.fillRect(E,h,1,1)}}if(_.width===a&&_.height===o)return _.toDataURL();const r=document.createElement("canvas");r.width=a,r.height=o;const m=r.getContext("2d");return m?(m.imageSmoothingEnabled=!1,m.drawImage(_,0,0,a,o),r.toDataURL()):_.toDataURL()}function Wn(e,n,t){var l;if(!e||t===0||n===0)return"";const a=document.createElement("canvas");a.width=n,a.height=t;const o=a.getContext("2d");if(!o)return"";o.imageSmoothingEnabled=!1;for(let i=0;i<t;i++)for(let d=0;d<n;d++){const p=(l=e[i])==null?void 0:l[d];p&&p!=="rgba(0,0,0,0)"&&(o.fillStyle=p,o.fillRect(d,i,1,1))}return a.toDataURL()}const zn=(e,n,t,a,o,l,i)=>{var _,u;const d=ee(a);e.width=n.width*o,e.height=n.height*o;const p=e.getContext("2d");if(!p)return;p.imageSmoothingEnabled=!1;const s=xe(n.backgroundColor,a);p.fillStyle=s,p.fillRect(0,0,e.width,e.height);const c=n.layers.background;for(let S=0;S<n.height;S++)for(let T=0;T<n.width;T++){const r=(_=c[S])==null?void 0:_[T];if(!(r!=null&&r.tileId))continue;const m=t.find(N=>N.id===r.tileId);if(!m)continue;const{data:h,width:E,height:f,lineAttributes:g}=m;if(!h)continue;const I=r.subTileX??0,C=r.subTileY??0,b=I*o,y=C*o;for(let N=0;N<o;N++)for(let A=0;A<o;A++){const D=b+A,R=y+N;if(R<f&&D<E){let v=(u=h[R])==null?void 0:u[D];if(v===void 0)continue;if(d&&g&&g[R]){const K=Math.floor(D/ne),w=g[R][K];w&&v!==w.fg&&v!==w.bg&&(v=w.fg)}p.fillStyle=v,p.fillRect(T*o+A,S*o+N,1,1)}}}};function ke(e){const n=e.find(i=>i.type==="globalvariables");if(!n||!n.data)return[...ie];const t=n.data.customVariables||[],a=new Map;ie.forEach(i=>{a.set(i.name,i)}),t.forEach(i=>{a.set(i.name,i)});const o=ie.map(i=>i.name),l=[];return o.forEach(i=>{const d=a.get(i);d&&(l.push(d),a.delete(i))}),a.forEach(i=>{l.push(i)}),l}function jn(e){const n=e.find(a=>a.type==="globalvariables");return!n||!n.data?[]:n.data.customVariables||[]}function Be(e){const n=ke(e);if(n.length===0)return[];const t=[];e.filter(c=>c.type==="screenmap").forEach(c=>{var u,S;(((S=(u=c.data)==null?void 0:u.layers)==null?void 0:S.entities)||[]).forEach(T=>{var r,m;(m=(r=T.components)==null?void 0:r.Behavior)!=null&&m.behaviorCode&&t.push(T.components.Behavior.behaviorCode)})});const o=e.find(c=>c.type==="gameflow"),l=new Set,i=new Set;if(o!=null&&o.data){const c=o.data;c.nodes&&Array.isArray(c.nodes)&&c.nodes.forEach(_=>{var u;_.type==="StateMachine"&&((u=_.data)!=null&&u.customCode)&&t.push(_.data.customCode),_.type==="IfThenElse"&&_.variableName&&l.add(_.variableName),_.type==="Globals"&&_.variables&&Array.isArray(_.variables)&&_.variables.forEach(S=>{S.variableName&&i.add(S.variableName)})})}e.filter(c=>c.type==="componentdefinition").forEach(c=>{const _=c.data;_.customCode&&t.push(_.customCode)});const p=[],s=new Set;return n.forEach(c=>{const _=t.some(T=>new RegExp(`\\b${c.asmName}\\b`,"i").test(T)),u=l.has(c.name),S=i.has(c.name);(_||u||S)&&!s.has(c.name)&&(p.push(c),s.add(c.name))}),i.forEach(c=>{if(!s.has(c)){const _=`global_var_${c.replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`;p.push({name:c,asmName:_,type:"8bit",defaultValue:0,description:"Auto-generated variable from Globals node",category:"custom"}),s.add(c)}}),l.forEach(c=>{if(!s.has(c)){const _=`global_var_${c.replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`;p.push({name:c,asmName:_,type:"8bit",defaultValue:0,description:"Auto-generated variable from IfThenElse node",category:"custom"}),s.add(c)}}),p}const O={AND:"AND",OR:"OR",XOR:"XOR",NOT:"NOT",KEY_PRESSED:"KEY_PRESSED",KEY_RELEASED:"KEY_RELEASED",TIME_OUT:"TIME_OUT",CAN_MOVE_DIRECTION:"CAN_MOVE_DIRECTION",HAS_COLLISION:"HAS_COLLISION",PATH_CLEAR:"PATH_CLEAR",ON_WALL_COLLISION:"ON_WALL_COLLISION",HAS_DEADLY_TILE_COLLISION:"HAS_DEADLY_TILE_COLLISION",ANIMATION_COMPLETE:"ANIMATION_COMPLETE",KEY_AND_MOVEMENT:"KEY_AND_MOVEMENT",VARIABLE_COMPARE:"VARIABLE_COMPARE"},L={SET_POSITION:"SET_POSITION",MOVE_BY:"MOVE_BY",SET_VELOCITY:"SET_VELOCITY",APPLY_FORCE:"APPLY_FORCE",CHANGE_SPRITE:"CHANGE_SPRITE",PLAY_ANIMATION:"PLAY_ANIMATION",SET_ANIMATION_SPEED:"SET_ANIMATION_SPEED",TOGGLE_ANIMATION:"TOGGLE_ANIMATION",PLAY_SOUND:"PLAY_SOUND",PLAY_MUSIC:"PLAY_MUSIC",MUTE_MUSIC:"MUTE_MUSIC",STOP_MUSIC:"STOP_MUSIC",SET_VARIABLE:"SET_VARIABLE",INCREMENT_VARIABLE:"INCREMENT_VARIABLE",DECREMENT_VARIABLE:"DECREMENT_VARIABLE",SET_COMPONENT_PROPERTY:"SET_COMPONENT_PROPERTY",WAIT:"WAIT",GOTO_STATE:"GOTO_STATE",DESTROY_ENTITY:"DESTROY_ENTITY",SPAWN_ENTITY:"SPAWN_ENTITY",GET_RANDOM_ENTITY_POSITION:"GET_RANDOM_ENTITY_POSITION",CHANGE_GAME_FLOW_NODE:"CHANGE_GAME_FLOW_NODE",DECREASE_LIVES:"DECREASE_LIVES",INCREASE_LIVES:"INCREASE_LIVES",RESPAWN_PLAYER:"RESPAWN_PLAYER",BREAK_TILE:"BREAK_TILE",REPLACE_TILE:"REPLACE_TILE",RND:"RND",POINT_AT:"POINT_AT",ADD_VARIABLES:"ADD_VARIABLES",SUBTRACT_VARIABLES:"SUBTRACT_VARIABLES",MULTIPLY_VARIABLES:"MULTIPLY_VARIABLES",DIVIDE_VARIABLES:"DIVIDE_VARIABLES",MODULO_VARIABLES:"MODULO_VARIABLES",ASSIGN_VARIABLE:"ASSIGN_VARIABLE"};function ce(e,n){const t=n.filter(A=>A.type==="componentdefinition").map(A=>A.data),a=n.filter(A=>A.type==="entitytemplate").map(A=>A.data),o=n.filter(A=>A.type==="sprite").map(A=>A.data),l=n.filter(A=>A.type==="tile").map(A=>A.data),i=n.filter(A=>A.type==="screenmap").map(A=>A.data),d=n.filter(A=>A.type==="worldmap").map(A=>A.data),p=n.filter(A=>A.type==="statemachine").map(A=>A.data),s=[];i.forEach(A=>{var D;(D=A.layers)!=null&&D.entities&&Array.isArray(A.layers.entities)&&s.push(...A.layers.entities),A.entities&&Array.isArray(A.entities)&&s.push(...A.entities)});const c=n.find(A=>A.type==="gameflow"),_=c==null?void 0:c.data,u=s.length>0,S=t.length>0||u,T=i.length>1,r=o.length>0,m=l.length>0,h=i.length>0,E=t.length>0,f=!!_,g=n.some(A=>A.type==="font"),I=o.some(A=>A.frames.length>1),C=i.some(A=>A.layers.collision.some(D=>D.some(R=>R!==null))),b=a.some(A=>A.name.toLowerCase().includes("menu")),y=[];t.forEach(A=>{A.name.toLowerCase().includes("state")&&y.push(A.name.replace(/[^a-zA-Z0-9]/g,"").toUpperCase())});const N=Be(n);return{projectName:e,components:t,templates:a,sprites:o,tiles:l,screenMaps:i,screens:i,worldmaps:d,entities:s,fonts:n.filter(A=>A.type==="font"),gameFlow:_,stateMachines:p,hasECS:S,hasMultipleScreens:T,hasSprites:r,hasTiles:m,hasScreens:h,hasEntities:u,hasComponents:E,hasGameFlow:f,hasMenus:b,hasFonts:g,hasAnimations:I,hasCollisions:C,hasMenuSystem:b,customStates:y,globalVariables:N}}const $e=e=>{if(!e.hasECS)return`    ; No ECS system - basic entity updates
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
    RET`,n},Fe=e=>{if(!e.hasSprites)return`    ; No sprites to update
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
    RET`,n},He=e=>e.hasCollisions?`    ; Check player collision with environment
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
    RET`,Ve=e=>{let n=`    ; Read MSX joystick/keyboard input
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
    RET`,n},Ge=e=>e.hasMenuSystem?`    ; Update menu graphics and cursor
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
    RET`,Ye=e=>{if(e.customStates.length===0)return"; No custom states detected";let n=`; Custom state handlers for project-specific logic
`;return e.customStates.forEach(t=>{n+=`
logic_${t.toLowerCase()}:
    ; Custom logic for ${t} state
    ; TODO: Implement ${t} specific logic
    RET
`}),n},We=[{marker:"{{ENTITY_UPDATES}}",generator:$e,description:"Entity update system based on ECS components"},{marker:"{{SPRITE_UPDATES}}",generator:Fe,description:"Sprite animation and movement updates"},{marker:"{{COLLISION_CHECK}}",generator:He,description:"Collision detection system"},{marker:"{{INPUT_HANDLING}}",generator:Ve,description:"Input handling with project-specific controls"},{marker:"{{MENU_SYSTEM}}",generator:Ge,description:"Menu system updates and rendering"},{marker:"{{CUSTOM_STATES}}",generator:Ye,description:"Custom state handlers detected from project"}];function ze(e,n,t,a=We){const o=ce(n,t);let l=e;return l=l.replace(/{{PROJECT_NAME}}/g,n.toUpperCase()),l=l.replace(/{{PROJECT_NAME_LOWER}}/g,n.toLowerCase()),l=l.replace(/{{GENERATION_DATE}}/g,new Date().toISOString()),a.forEach(i=>{if(l.includes(i.marker)){const d=i.generator(o);l=l.replace(new RegExp(Xe(i.marker),"g"),d)}}),l}function je(){return`;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
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
`}function Xe(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function Xn(e,n){const t=je(),a=ze(t,e,n),l=`${e.toLowerCase().replace(/[^a-z0-9]/g,"_")}_dynamic_system.asm`,i=ce(e,n);return{filename:l,content:a,analysis:i}}function Qe(){return`; ==================================================================
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
INIGRP  EQU #0072        ; Initialize graphics routines

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
`}function Ke(e){let n="";if(!e.globalVariables||e.globalVariables.length===0)return n+=`; Goal Variable Values (default)
`,n+=`GOAL_FAILURE            EQU 0    ; Goal = "Failure"
`,n+=`GOAL_COMPLETED          EQU 1    ; Goal = "Completed"
`,n;const t=new Set;return e.globalVariables.forEach(a=>{a.values&&a.values.length>0&&(n+=`
; ${a.name} - ${a.description||"Variable values"}
`,a.values.forEach(o=>{const l=(o.asmConstant||"UNKNOWN").trim(),i=typeof o.value=="number"?o.value:0;t.has(l)||(n+=`${l.padEnd(24)}EQU ${i}    ; ${a.name} = "${o.label}"
`,t.add(l))}))}),n}function Ze(e){var n,t,a;return`; ==================================================================
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
${e.tiles.map((o,l)=>`; Tile ${l}: ${o.name} = ${o.width}x${o.height}px (${Math.ceil(o.width/8)}x${Math.ceil(o.height/8)} MSX chars)`).join(`
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

${Ke(e)}

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
`}function Je(e){let n=`; ==================================================================
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
`,e.globalVariables&&e.globalVariables.length>0?e.globalVariables.forEach(a=>{const o=a.type==="16bit"?2:1,l=a.type==="16bit"?" (16-bit)":" (8-bit)",i=a.description||a.name;n+=`${a.asmName.padEnd(20)} EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; ${i}${l}
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
`,t++,n+=`current_world_id    EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Current world ID (for multi-world support)
`,t++,n+=`current_screen_index EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Current screen index within world
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
; AUXILIARY VARIABLES 
; ==================================================================
deterministic        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Deterministic mode flag
`,t++,n+=`
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
`,n}function qe(e,n){var a;let t="";if(n!=null&&n.gameFlow){const o=n.gameFlow;t=`
; GameFlow Integration: Using "${o.name}" as execution orchestrator`;const l=o.nodes.find(i=>i.type==="Start");if(l){const i=o.connections.find(d=>{var p;return((p=d.from)==null?void 0:p.nodeId)===l.id||typeof d.from=="string"&&d.from===l.id});if(i){const d=((a=i.to)==null?void 0:a.nodeId)||i.to,p=o.nodes.find(s=>s.id===d);p&&(t+=`
; Flow: Start → ${p.type} (${p.title||p.name||p.id})`)}}}return`; ==================================================================
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
    di
    im 1
    
    ; Initialize stack
    ld sp, #F380
    
    ; Reset some interrupts to ensure compatibility
    ; with MSX computers with disk controllers
    ld a, #C9
    ld (HKEY), a
    ld (TIMI), a
    ei

    call SETPAGES32K

    ; Silence click, init keyboard, clear config
    xor a
    ld (CLIKSW), a
    ld (deterministic), a
    
    ; Change background colors
    ld (BAKCLR), a
    ld (BDRCLR), a
    call CHGCLR

    ; Change screen mode to SCREEN 2
    ld a, 2
    call CHGMOD

    ; Configure 16x16 sprites
    ; VDP Register #01: activate sprites, generate interrupts, 16x16 sprites
    ld bc, #E201
    call WRTVDP

    ; Detect 50Hz/60Hz
    call CheckIf60Hz
    ld (isComputer50HzOr60Hz), a ; 0: 50Hz, 1: 60Hz

    ; ====================================================
    ; GAMEFLOW INITIALIZATION
    ; ====================================================
    ; Initialize GameFlow system
    call gameflow_init
    
    ; Start execution from GameFlow Start node
    ; GameFlow is now the sole orchestrator
    jp gameflow_start

; ==================================================================
; END OF HEADER
; ==================================================================
`}function B(e){return e.replace(/[^a-zA-Z0-9]/g,"_")}function Se(e){return`NODE_TYPE_${e.replace(/([a-z])([A-Z])/g,"$1_$2").toUpperCase()}`}function et(e){const n=(e.name||"DEFAULT").toUpperCase().replace(/[^A-Z0-9]/g,"_"),t=e.id?`_${e.id.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";return`load_screen_${n.toLowerCase()}${t.toLowerCase()}`}function tt(e){var o,l,i;if(!e.gameFlow)return ot(e);const n=e.gameFlow;let t=`; ==================================================================
; GAMEFLOW EXECUTION ENGINE
; File: gameflow.asm
; Description: GameFlow-based game orchestration system
; ==================================================================
;
; GameFlow: ${n.name||"Unnamed"}
; Total Nodes: ${((o=n.nodes)==null?void 0:o.length)||0}
; Total Connections: ${((l=n.connections)==null?void 0:l.length)||0}
; Start Node: ${n.startNodeId||"NONE"}
;
; ARCHITECTURE:
; - GameFlow is the SOLE execution orchestrator
; - Each node generates its own execution code
; - Connections between nodes define the complete flow
; - No hardcoded main_loop outside GameFlow
; ==================================================================

`;t+=`; ==================================================================
; GAMEFLOW INITIALIZATION
; ==================================================================

gameflow_init:
    ; Initialize GameFlow system
    ; Reset state
    xor a
    ld (gameflow_exit_requested), a
    ld (current_flow_state), a
    ret

; Main entry point - called from init_rom
; This is where the game STARTS
gameflow_start:
    ; Load the Start node
${n.startNodeId?`    ld hl, gameflow_node_${B(n.startNodeId)}`:`    ; ERROR: No start node defined!
    ret`}
    jp gameflow_execute_node

`,t+=`; ==================================================================
; CORE EXECUTION ENGINE
; ==================================================================

; Execute a GameFlow node
; Input: HL = address of node structure
; 
; Node Structure:
;   +0: Node type (byte)
;   +1-2: Data pointer (word) - node-specific data
;   +3-4: Connection table pointer (word)
;
gameflow_execute_node:
    ; Read node type
    ld a, (hl)
    inc hl
    
    ; Save data pointer and connection table pointer for handlers
    ld e, (hl)
    inc hl
    ld d, (hl)      ; DE = data pointer
    inc hl
    ld c, (hl)
    inc hl
    ld b, (hl)      ; BC = connection table pointer
    
    ; DE = node data, BC = connection table
    ; Dispatch based on node type
`;const a=Array.from(new Set(((i=n.nodes)==null?void 0:i.map(d=>d.type))||[]));return a.forEach(d=>{const p=`gameflow_handle_${d.toLowerCase()}`;t+=`    cp ${Se(d)}
    jp z, ${p}
`}),t+=`    
    ; Unknown node type - error
    ret

`,t+=`; ==================================================================
; NODE TYPE HANDLERS
; Each handler receives:
;   DE = node data pointer
;   BC = connection table pointer
; ==================================================================

`,t+=nt(a),t+=`; ==================================================================
; CONNECTION UTILITIES
; ==================================================================

; Get next node from connection table (for simple single-connection nodes)
; Input: BC = connection table pointer
; Output: HL = next node address (or 0 if none)
gameflow_get_default_connection:
    ; Connection table format:
    ;   db CONNECTION_TYPE
    ;   dw NODE_ADDRESS
    ;   db CONNECTION_END
    
    ld h, b
    ld l, c
    ld a, (hl)
    cp CONNECTION_END
    jr z, .no_connection
    
    inc hl
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a         ; HL = next node address
    ret

.no_connection:
    ld hl, 0
    ret

; Get connection by type
; Input: BC = connection table pointer, A = connection type to find
; Output: HL = next node address (or 0 if not found)
gameflow_get_connection_by_type:
    ld d, a         ; Save connection type
    ld h, b
    ld l, c

.search_loop:
    ld a, (hl)
    cp CONNECTION_END
    jr z, .not_found
    
    cp d
    jr z, .found
    
    ; Skip this entry (type + address)
    inc hl
    inc hl
    inc hl
    jr .search_loop

.found:
    inc hl
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ret

.not_found:
    ld hl, 0
    ret

; Connection type constants
CONNECTION_DEFAULT      EQU 0
CONNECTION_THEN         EQU 1
CONNECTION_ELSE         EQU 2
CONNECTION_OPTION_0     EQU 10
CONNECTION_OPTION_1     EQU 11
CONNECTION_OPTION_2     EQU 12
CONNECTION_OPTION_3     EQU 13
CONNECTION_OPTION_4     EQU 14
CONNECTION_OPTION_5     EQU 15
CONNECTION_END          EQU 255

`,t+=`; ==================================================================
; GAME LOOP (WorldLink nodes only)
; ==================================================================

; Main game loop - executed by WorldLink nodes
; This loop runs while a world/level is active
gameflow_world_game_loop:
    ; Check exit flag
    ld a, (gameflow_exit_requested)
    or a
    ret nz

    ; Update all entities
    call update_all_entities
    
    ; Execute all state machines
    call execute_all_state_machines
    
    ; Update sprites to VRAM
    call update_sprites_to_vram
    
    ; Wait for V-Blank
    halt
    
    ; Loop
    jp gameflow_world_game_loop

`,t+=`; ==================================================================
; NODE DATA STRUCTURES
; Each node has: type byte, data pointer, connection table pointer
; ==================================================================

`,n.nodes&&n.nodes.length>0&&n.nodes.forEach(d=>{t+=at(d,n)}),t+=`
; ==================================================================
; GAMEFLOW VARIABLES
; ==================================================================

gameflow_exit_requested:    db 0    ; Flag to exit current game loop
gameflow_menu_selection:    db 0    ; Last menu selection
gameflow_condition_result:  db 0    ; Result of last condition evaluation

; ==================================================================
; END OF GAMEFLOW
; ==================================================================
`,t}function nt(e,n){let t="";return e.forEach(a=>{switch(a){case"Start":t+=`gameflow_handle_start:
    ; Start node - simply transition to next node
    ; BC = connection table
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z           ; No connection
    jp gameflow_execute_node

`;break;case"WorldLink":t+=`gameflow_handle_worldlink:
    ; WorldLink node - load world and enter game loop
    ; DE = world data pointer (contains load_world_X routine address)
    ; BC = connection table (for exit)
    
    push bc         ; Save connection table
    
    ; Load the world
    ; DE points to: dw load_world_X
    ex de, hl
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a         ; HL = load_world_X address
    
    ; Call the load routine
    push hl
    ret             ; Tricky: call via push+ret
    
.after_load:
    ; Set game state
    ld a, FLOW_STATE_GAME
    ld (current_flow_state), a
    
    ; Update sprites
    call update_sprites_to_vram
    
    ; Enter game loop
    call gameflow_world_game_loop
    
    ; Exited loop - continue to next node
    pop bc          ; Restore connection table
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

`;break;case"End":t+=`gameflow_handle_end:
    ; End node - stop execution
    ; TODO: Show end screen based on node data
    ret

`;break;case"Restart":t+=`gameflow_handle_restart:
    ; Restart node - reset game
    jp init_rom

`;break;case"SubMenu":t+=`gameflow_handle_submenu:
    ; SubMenu node - show menu and follow selected option
    ; DE = menu data pointer
    ; BC = connection table
    
    push bc         ; Save connection table
    
    ; Show menu (implementation in menusGenerator.ts)
    ; For now, placeholder
    call show_menu_placeholder
    
    ; Get selection (0-based index)
    ld a, (gameflow_menu_selection)
    
    ; Calculate connection type (CONNECTION_OPTION_0 + index)
    add a, CONNECTION_OPTION_0
    
    pop bc          ; Restore connection table
    call gameflow_get_connection_by_type
    
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

show_menu_placeholder:
    ; TODO: Implement via menusGenerator.ts
    xor a
    ld (gameflow_menu_selection), a
    ret

`;break;case"Text":t+=`gameflow_handle_text:
    ; Text node - show text and wait for input
    ; DE = text data pointer
    ; BC = connection table
    
    push bc
    
    ; Show text (placeholder)
    call show_text_placeholder
    
    ; Wait for fire button
    call wait_for_fire
    
    ; Continue to next node
    pop bc
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

show_text_placeholder:
    ; TODO: Implement text display
    ret

wait_for_fire:
    ; TODO: Implement input waiting
    ret

`;break;case"IfThenElse":t+=`gameflow_handle_ifthenelse:
    ; IfThenElse node - conditional branching
    ; DE = condition data pointer (variable address, compare value, operator)
    ; BC = connection table
    
    push bc         ; Save connection table
    
    ; Read condition data
    ex de, hl
    ld e, (hl)
    inc hl
    ld d, (hl)      ; DE = variable address
    inc hl
    ld a, (hl)      ; A = compare value
    inc hl
    ld c, (hl)      ; C = operator
    
    ; Load variable value
    ex de, hl
    ld b, (hl)      ; B = current value
    
    ; Compare based on operator
    ; For now, only == (operator 0)
    cp b
    jr z, .then_branch
    
.else_branch:
    pop bc
    ld a, CONNECTION_ELSE
    call gameflow_get_connection_by_type
    ld a, h
    or l
    ret z
    jp gameflow_execute_node
    
.then_branch:
    pop bc
    ld a, CONNECTION_THEN
    call gameflow_get_connection_by_type
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

`;break;case"Globals":t+=`gameflow_handle_globals:
    ; Globals node - set global variables
    ; DE = globals data pointer (list of variable assignments)
    ; BC = connection table
    
    push bc
    
    ; Execute global variable assignments
    ; Data format: count, [var_addr, value]*count
    ex de, hl
    ld b, (hl)      ; B = count
    inc hl
    
.assign_loop:
    ld a, b
    or a
    jr z, .done
    
    ; Read var address
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    
    ; Read value
    ld a, (hl)
    inc hl
    
    ; Assign
    ex de, hl
    ld (hl), a
    ex de, hl
    
    djnz .assign_loop
    
.done:
    pop bc
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

`;break;case"Waypoint":t+=`gameflow_handle_waypoint:
    ; Waypoint node - passthrough routing node
    ; Simply follow default connection
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

`;break;case"Transition":t+=`gameflow_handle_transition:
    ; Transition node - visual transition effect
    ; DE = transition data (effect type)
    ; BC = connection table
    
    push bc
    
    ; Execute transition effect (placeholder)
    call execute_transition_effect
    
    pop bc
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

execute_transition_effect:
    ; TODO: Implement transition effects
    ret

`;break;case"Group":t+=`gameflow_handle_group:
    ; Group node - nested GameFlow (placeholder)
    ; TODO: Implement nested GameFlow execution
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

`;break;case"Music":t+=`gameflow_handle_music:
    ; Music node - play/stop music
    ; DE = music data (track ID, flags)
    ; BC = connection table
    
    push bc
    
    ; Execute music command (placeholder)
    call execute_music_command
    
    pop bc
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

execute_music_command:
    ; TODO: Implement music control
    ret

`;break;default:t+=`gameflow_handle_${a.toLowerCase()}:
    ; ${a} node - not yet implemented
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

`;break}}),t}function at(e,n,t){var p,s,c,_,u,S;const a=`gameflow_node_${B(e.id)}`,o=`${a}_data`,l=`${a}_conn`;let i=`; Node: ${e.type} - "${e.title||e.name||e.id}"
${a}:
    db ${Se(e.type)}
    dw ${o}
    dw ${l}

`;switch(i+=`${o}:
`,e.type){case"WorldLink":const T=e.worldAssetId||"default";i+=`    dw load_world_${B(T)}
`;break;case"SubMenu":i+=`    db ${((p=e.options)==null?void 0:p.length)||0}    ; Number of options
`;break;case"Text":i+=`    dw text_${B(e.id)}    ; Text content pointer
`;break;case"IfThenElse":const m=`global_var_${(e.variableName||"unknown").replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`,h=e.compareValue||0;i+=`    dw ${m}    ; Variable to check
`,i+=`    db ${h}   ; Compare value
`,i+=`    db 0                 ; Operator (0=equals)
`;break;case"Globals":e.variables&&e.variables.length>0?(i+=`    db ${e.variables.length}    ; Number of assignments
`,e.variables.forEach(E=>{const g=`global_var_${(E.variableName||E.name||"unknown").replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`,I=E.value||0;i+=`    dw ${g}
`,i+=`    db ${I}
`})):i+=`    db 0    ; No assignments
`;break;default:i+=`    ; No additional data
`;break}i+=`
`,i+=`${l}:
`;const d=((s=n.connections)==null?void 0:s.filter(T=>{var r;return(((r=T.from)==null?void 0:r.nodeId)||T.from)===e.id}))||[];if(e.type==="IfThenElse"){const T=d.find(m=>{var h,E;return((h=m.from)==null?void 0:h.sourceId)==="then"||!((E=m.from)!=null&&E.sourceId)}),r=d.find(m=>{var h;return((h=m.from)==null?void 0:h.sourceId)==="else"});i+=`    db CONNECTION_THEN
`,i+=`    dw ${T?`gameflow_node_${B(((c=T.to)==null?void 0:c.nodeId)||T.to)}`:"0"}
`,i+=`    db CONNECTION_ELSE
`,i+=`    dw ${r?`gameflow_node_${B(((_=r.to)==null?void 0:_.nodeId)||r.to)}`:"0"}
`}else if(e.type==="SubMenu")(u=e.options)==null||u.forEach((T,r)=>{var h;const m=d.find(E=>{var f;return((f=E.from)==null?void 0:f.sourceId)===T.id});i+=`    db CONNECTION_OPTION_${r}
`,i+=`    dw ${m?`gameflow_node_${B(((h=m.to)==null?void 0:h.nodeId)||m.to)}`:"0"}
`});else{const T=d[0];i+=`    db CONNECTION_DEFAULT
`,i+=`    dw ${T?`gameflow_node_${B(((S=T.to)==null?void 0:S.nodeId)||T.to)}`:"0"}
`}return i+=`    db CONNECTION_END

`,i}function ot(e){return`; ==================================================================
; DEFAULT GAMEFLOW (No GameFlow defined in project)
; ==================================================================

gameflow_init:
    ret

gameflow_start:
    ; Load first available screen/world
${e.screenMaps&&e.screenMaps.length>0?`    call ${et(e.screenMaps[0])}`:"    ; No screens available"}
    ret

gameflow_world_game_loop:
    call update_all_entities
    call execute_all_state_machines
    call update_sprites_to_vram
    halt
    jp gameflow_world_game_loop

gameflow_exit_requested:    db 0

; ==================================================================
; END OF DEFAULT GAMEFLOW
; ==================================================================
`}function it(e,n){return`; ==================================================================
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

; 8. Components (game logic)
include "components.asm"

; 9. Entities (game objects)
include "entities.asm"

${n.worldmaps&&n.worldmaps.length>0?`; 10. Worlds (world maps)
include "worlds.asm"
`:""}

${n.screenMaps&&n.screenMaps.length>0?`; 11. Screen Maps (if screens exist)
include "screens.asm"
`:""}

; 12. Font Data (custom font for Screen 2 text)
include "font.asm"

; 13. HUD System (heads-up display)
include "hud.asm"

; 14. Menus (user interface)
include "menus.asm"

${n.stateMachines&&n.stateMachines.length>0?`; 15. State Machines (entity AI)
include "statemachine.asm"
`:""}

; 16. GameFlow (game flow state machine)
include "gameflow.asm"

; ==================================================================
; MAIN PROGRAM - UTILITY FUNCTIONS ONLY
; ==================================================================
;
; NOTE: The main game loop and execution flow are now handled
; exclusively by GameFlow (see gameflow.asm).
;
; This section only contains utility functions used throughout
; the game code.
; ==================================================================

; Helper: Call function from page 1 (for ROM paging)
GETSLOT:    
    and #03             ; Proteccion, nos aseguramos de que el valor esta en 0-3
    ld  c,a             ; c = slot de la pagina
    ld  b,0             ; bc = slot de la pagina
    ld  hl,#fcc1        ; Tabla de slots expandidos
    add hl,bc           ; hl -> variable que indica si este slot esta expandido
    ld  a,(hl)          ; Tomamos el valor
    and #80             ; Si el bit mas alto es cero...
    jr  z,GETSLOT_EXIT            ; ...nos vamos a @@EXIT
    ; --- El slot esta expandido ---
    or  c               ; Slot basico en el lugar adecuado
    ld  c,a             ; Guardamos el valor en c
    inc hl              ; Incrementamos hl una...
    inc hl              ; ...dos...
    inc hl              ; ...tres...
    inc hl              ; ...cuatro veces
    ld  a,(hl)              ; a = valor del registro de subslot del slot donde estamos
    and #0C             ; Nos quedamos con el valor donde esta nuestro cartucho
GETSLOT_EXIT:     
    or  c               ; Slot extendido/basico en su lugar
    ret                 ; Volvemos

;-----------------------------------------------
; From: http://www.z80st.es/downloads/code/
; SETPAGES32K:  BIOS-ROM-YY-ZZ   -> BIOS-ROM-ROM-ZZ (SITUA PAGINA 2)
SETPAGES32K:    ; --- Posiciona las paginas de un megarom o un 32K ---
    ld  a,RET_OPCODE        ; Codigo de RET
    ld  (SETPAGES32K_NOPRET),a            ; Modificamos la siguiente instruccion si estamos en RAM
SETPAGES32K_NOPRET:   
    nop                     ; No hacemos nada si no estamos en RAM
    ; --- Si llegamos aqui no estamos en RAM, hay que posicionar la pagina ---
    call RSLREG             ; Leemos el contenido del registro de seleccion de slots
    rrca                    ; Rotamos a la derecha...
    rrca                    ; ...dos veces
    call GETSLOT            ; Obtenemos el slot de la pagina 1 ($4000-$BFFF)
    ld (ROM_slot),a         ; santi: I added this to the routine, so we can easily call methods later from page 1
    ld  h,#80               ; Seleccionamos pagina 2 ($8000-$BFFF)
    jp  ENASLT              ; Posicionamos la pagina 2 y volvemos


;-----------------------------------------------
; Calls a function from page 1
; input:
; ix: function to call from page 1
call_from_page1:
    ld a,(ROM_slot)
    ld iyh,a    ; slot #
    jp CALSLT


;-----------------------------------------------
; source: https://www.msx.org/forum/development/msx-development/how-0?page=0
; returns 1 in a and clears z flag if vdp is 60Hz
; size: 27 bytes
CheckIf60Hz:
    di
    in      a,(#99)
    nop
    nop
    nop
vdpSync:
    in      a,(#99)
    and     #80
    jr      z,vdpSync
    
    ld      hl,#900
vdpLoop:
    dec     hl
    ld      a,h
    or      l
    jr      nz,vdpLoop
    
    in      a,(#99)
    rlca
    and     1
    ei
    ret


;-----------------------------------------------
; Source: http://wikiti.brandonw.net/index.php?title=Z80_Routines:Math:Random
;-----> Generate a random number
; ouput a=answer 0<=a<=255
; all registers are preserved except: af
; random:
;     push    hl
;     push    de
;         ld      hl,(randData)
;         ld      a,r
;         ld      d,a
;         ld      e,(hl)
;         add     hl,de
;         add     a,l
;         xor     h
;         ld      (randData),hl
;     pop     de
;     pop     hl
;     ret


; Source: http://wikiti.brandonw.net/index.php?title=Z80_Routines:Math:Random
; 16-bit xorshift pseudorandom number generator by John Metcalf
; 20 bytes, 86 cycles (excluding ret)
; returns   a = pseudorandom number
; generates 16-bit pseudorandom numbers with a period of 65535
; using the xorshift method:
; hl ^= hl << 7
; hl ^= hl >> 9
; hl ^= hl << 8
; some alternative shift triplets which also perform well are:
; 6, 7, 13; 7, 9, 13; 9, 7, 13.

random:
    push hl
        ld hl,(randData)
        ld a,h
        rra
        ld a,l
        rra
        xor h
        ld h,a
        ld a,l
        rra
        ld a,h
        rra
        xor l
        ld l,a
        xor h
        ld h,a
        ld (randData),hl
    pop hl
    ret


; only modifies af, and hl
randomSeedUpdate:
    ld hl,randSeedIndex
    ld a,(hl)
    inc (hl)
    and #01
    jr z,randomSeedUpdate2
    ld a,r
    xor #66
    ld (randData),a
    ret
randomSeedUpdate2:
    ld a,r
    xor #66
    ld (randData+1),a
    ret


;-----------------------------------------------
; Divide "hl" by "d", output is:
; - division result in "hl"
; - remainder in "a"
; Code borrowed from: //sgate.emt.bme.hu/patai/publications/z80guide/part4.html
Div8:                            ; this routine performs the operation HL=HL/D
    push bc
    xor a                          ; clearing the upper 8 bits of AHL
    ld b,16                        ; the length of the dividend (16 bits)
Div8Loop:
    add hl,hl                      ; advancing a bit
    rla
    cp d                           ; checking if the divisor divides the digits chosen (in A)
    jp c,Div8NextBit               ; if not, advancing without subtraction
    sub d                          ; subtracting the divisor
    inc l                          ; and setting the next digit of the quotient
Div8NextBit:
    djnz Div8Loop
    pop bc
    ret    


;-----------------------------------------------
; waits a given number of "halts"
; b - number of halts
wait_b_halts:
    halt
    djnz wait_b_halts
    ret


;-----------------------------------------------
; hl: memory to clear
; bc: bytes to clear-1
clear_memory:
    xor a
clear_memory_a:
    ld d,h
    ld e,l
    inc de
    ld (hl),a
    ldir
    ret

; ==================================================================
; END OF MAIN PROGRAM
; ==================================================================
    end                 ; End of assembly
`}function lt(e){var n;return!e.tiles||e.tiles.length===0?`; ==================================================================
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
${e.tiles.map((t,a)=>{const o=Le(t,"SCREEN 2 (Graphics I)"),l=Math.ceil(t.width/8),i=Math.ceil(t.height/8),d=l*i;(t.width%8!==0||t.height%8!==0)&&console.warn(`⚠️  Tile ${t.name} size ${t.width}x${t.height} is not multiple of 8px - may cause visual artifacts`);const p=Array.from(o).map(c=>`#${c.toString(16).padStart(2,"0").toUpperCase()}`);let s="";if(d>1){s=`
    ; Character layout: ${l}×${i} grid`;for(let c=0;c<i;c++){s+=`
    ; Row ${c}: `;for(let _=0;_<l;_++){const u=c*l+_;s+=`Char${u} `}}}return`    ; Tile ${a}: ${t.name} (${t.width}x${t.height}px = ${l}×${i} chars = ${d} MSX characters)${s}
    db ${p.join(", ")}
`}).join("")}

; ==================================================================
; PATTERN LOADING FUNCTIONS
; ==================================================================
load_pattern_bank0:
    ; Load pattern bank 0 to VRAM (base patterns)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_pattern_bank0
    ld de, CHRTBL2 + (128 * 8)    ; VRAM pattern table bank 0 (start at char 128)
    ld bc, ${e.tiles.reduce((t,a)=>{const o=Math.ceil(a.width/8),l=Math.ceil(a.height/8);return t+o*l*8},0)}    ; Total bytes for all tile characters (16x16 tiles = 4 chars each)
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_pattern_bank1:
    ; Load pattern bank 1: same patterns as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_pattern_bank0     ; Same source as Bank 0
    ld de, CHRTBL2 + #800 + (128 * 8) ; VRAM pattern table bank 1 (+#800 offset + char 128)
    ld bc, ${e.tiles.reduce((t,a)=>{const o=Math.ceil(a.width/8),l=Math.ceil(a.height/8);return t+o*l*8},0)}    ; Total bytes for all tile characters
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_pattern_bank2:
    ; Load pattern bank 2: same patterns as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_pattern_bank0     ; Same source as Bank 0
    ld de, CHRTBL2 + #1000 + (128 * 8) ; VRAM pattern table bank 2 (+#1000 offset + char 128)
    ld bc, ${e.tiles.reduce((t,a)=>{const o=Math.ceil(a.width/8),l=Math.ceil(a.height/8);return t+o*l*8},0)}    ; Total bytes for all tile characters
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
`}function rt(e){var n;return!e.tiles||e.tiles.length===0?`; ==================================================================
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
${e.tiles.map((t,a)=>{const o=Ne(t),l=o?Array.from(o).map(i=>`#${i.toString(16).padStart(2,"0").toUpperCase()}`):["#F0","#F0","#F0","#F0","#F0","#F0","#F0","#F0"];return`    ; Tile ${a}: ${t.name} colors (fg/bg pairs)
    db ${l.join(", ")}
`}).join("")}

; ==================================================================
; COLOR LOADING FUNCTIONS
; ==================================================================
load_color_bank0:
    ; Load color bank 0 to VRAM (base colors)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_color_bank0
    ld de, CLRTBL2 + (128 * 8)    ; VRAM color table bank 0 (start at char 128)
    ld bc, ${e.tiles.reduce((t,a)=>{const o=Math.ceil(a.width/8),l=Math.ceil(a.height/8);return t+o*l*8},0)}     ; Total color bytes for all tile characters
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_color_bank1:
    ; Load color bank 1: same colors as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_color_bank0       ; Same source as Bank 0
    ld de, CLRTBL2 + #800 + (128 * 8) ; VRAM color table bank 1 (+#800 offset + char 128)
    ld bc, ${e.tiles.reduce((t,a)=>{const o=Math.ceil(a.width/8),l=Math.ceil(a.height/8);return t+o*l*8},0)}     ; Total color bytes for all tile characters
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_color_bank2:
    ; Load color bank 2: same colors as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_color_bank0       ; Same source as Bank 0
    ld de, CLRTBL2 + #1000 + (128 * 8) ; VRAM color table bank 2 (+#1000 offset + char 128)
    ld bc, ${e.tiles.reduce((t,a)=>{const o=Math.ceil(a.width/8),l=Math.ceil(a.height/8);return t+o*l*8},0)}     ; Total color bytes for all tile characters
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
`}function st(e,n,t){var d,p,s,c,_,u,S,T,r,m;const a=(p=(d=t.gameFlow)==null?void 0:d.nodes)==null?void 0:p.some(h=>h.type==="SubMenu"),o=(s=t.screenMaps)==null?void 0:s.some(h=>{var E,f;return((E=h.layers)==null?void 0:E.text)||((f=h.textElements)==null?void 0:f.length)>0}),l=(c=t.screenMaps)==null?void 0:c.some(h=>{var E;return((E=h.hudConfiguration)==null?void 0:E.elements)&&h.hudConfiguration.elements.length>0}),i=a||o||l;return`; ==================================================================
; ${n.toUpperCase()} - UNIFIED FILE
; File: unitedFiles.asm
; Description: All-in-one file combining all modular files
; Generated by Mideas MSX Modular Generator
;
; OPTIMIZED: Only includes necessary code for this project
; Tiles: ${((_=t.tiles)==null?void 0:_.length)||0}
; Sprites: ${((u=t.sprites)==null?void 0:u.length)||0}
; Screens: ${((S=t.screenMaps)==null?void 0:S.length)||0}
; Entities: ${((T=t.entities)==null?void 0:T.length)||0}
; Menus: ${a?"Yes":"No"}
; HUD: ${l?"Yes":"No"}
; State Machines: ${((r=t.stateMachines)==null?void 0:r.length)||0}
; ==================================================================

; CRITICAL: bios.asm and constants.asm must come BEFORE header.asm
; because header.asm uses WRTVDP (defined in bios.asm) and constants
${e["bios.asm"]}

${e["constants.asm"]}

${e["variables.asm"]}

${e["header.asm"]}

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

${l?e["hud.asm"]:`; [hud.asm skipped - no HUD elements]
`}

${t.stateMachines&&t.stateMachines.length>0?e["statemachine.asm"]:`; [statemachine.asm skipped - no state machines]
`}

${t.gameFlow?e["gameflow.asm"]:`; [gameflow.asm skipped - no GameFlow]
`}

${((m=t.worldmaps)==null?void 0:m.length)>0?e["worlds.asm"]:`; [worlds.asm skipped - no WorldMaps]
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

${(()=>{var h;if(t.gameFlow&&t.gameFlow.nodes&&t.gameFlow.connections){const E=t.gameFlow.nodes.find(f=>f.type==="Start");if(E){const f=t.gameFlow.connections.find(g=>{var C;return(typeof g.from=="string"?g.from:(C=g.from)==null?void 0:C.nodeId)===E.id});if(f){const g=typeof f.to=="string"?f.to:(h=f.to)==null?void 0:h.nodeId,I=t.gameFlow.nodes.find(C=>C.id===g);if(I){const C=I.type;return C==="WorldLink"?`    ; GameFlow: Start → WorldLink detected
    ; Go directly to GAME state (no main menu)
    ld a, FLOW_STATE_GAME
    ld (current_flow_state), a`:C==="SubMenu"?`    ; GameFlow: Start → SubMenu detected
    ; Start with menu interface
    ld a, FLOW_STATE_MAIN_MENU
    ld (current_flow_state), a`:`    ; GameFlow: Start → ${C} detected
    ; Go directly to GAME state
    ld a, FLOW_STATE_GAME
    ld (current_flow_state), a`}}}}return`    ; GameFlow initial state: default to GAME (pure game, no menu)
    ld a, FLOW_STATE_GAME
    ld (current_flow_state), a`})()}


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
    call DISSCR               ; Disable screen while loading VRAM assets
${t.entities&&t.entities.length>0?`    ; Initialize component systems (entities detected)
    call init_components
`:`    ; No entities - skipping component system initialization
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
    call ENASCR               ; Re-enable screen after VRAM updates
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

    ; Re-initialize graphics for SCREEN 2 (CLS doesn't work properly in SCREEN 2)
    call DISSCR                     ; Hide screen while reloading VRAM assets
    call clear_all_sprites           ; Clear sprite attributes
    call load_patterns_to_vram       ; Reload tile patterns
    call load_colors_to_vram         ; Reload tile colors
    call load_game_screen
    call ENASCR                     ; Show screen again after reload
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

; ==================================================================
; NOTE: GameFlow functions are defined in gameflow.asm:
; - load_game_screen
; - execute_gameflow_start
; - execute_gameflow_node
; - execute_start_node
; - execute_worldlink_node (and handlers for other node types)
; - find_next_gameflow_node
; These are included above via the gameflow.asm file.
; ==================================================================


; ==================================================================
; GAMEFLOW EXECUTION (Generated by gameflow.asm)
; ==================================================================
; All GameFlow execution functions are defined in gameflow.asm:
; - execute_gameflow_node
; - execute_start_node
; - execute_worldlink_node (and handlers for other node types)
; - find_next_gameflow_node
; These are included above via the gameflow.asm file.

; ==================================================================
; NOTE: The following functions are defined in gameflow.asm:
; - load_default_screen
; - show_no_content_message
; - show_end_screen
; ==================================================================

; ==================================================================
; UI OVERLAY FUNCTIONS (unique to main loop)
; ==================================================================



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
`:`    ; No menu system - check if we should auto-start game
    ; Avoid re-initialization by checking if this is first frame
    ld a, (prev_flow_state)
    cp FLOW_STATE_MAIN_MENU
    jr nz, .skip_init          ; Already changed state, skip init
    
    ; First frame in menu state - start game
    ld a, FLOW_STATE_GAME
    ld (current_flow_state), a
    call init_game_entities
    call load_game_screen
.skip_init:
`}    ret

render_game:
    ; Render game frame with optimized sprite updates
    ; Only update sprites that have moved (optimization)

    ; Update sprite positions in VRAM only when needed
    ; This is much more efficient than reloading entire screen
    call update_sprites_to_vram

${l?`    ; Render HUD elements
    call render_hud
`:`    ; No HUD elements
`}    ret

render_pause:
    ; Render pause screen
    ; NOTE: OUTDO corrupts SCREEN 2 graphics!
    ; TODO: Use custom font rendering for SCREEN 2
    ret

render_game_over:
    ; Render game over screen
    ; NOTE: OUTDO corrupts SCREEN 2 graphics!
    ; TODO: Use custom font rendering for SCREEN 2
    ; Return to menu after delay (handled in update)
    ret

render_credits:
    ; Pure game - no credits needed
    call return_to_menu
    ret

; ==================================================================
; STRINGS
; ==================================================================
${i?`
string_pause:     db "PAUSED", 0
string_game_over: db "GAME OVER", 0
`:"; No strings needed"}

    end                 ; End of assembly
`}const te={comp_pos:"Position",comp_position:"Position",comp_render:"Sprite",comp_sprite:"Sprite",comp_movement:"Movement",comp_velocity:"Movement",comp_collision:"Collision",comp_wall_collision:"WallCollision",comp_player_input:"Input",comp_input:"Input",comp_ai_behavior:"Behavior",comp_behavior:"Behavior",comp_health:"Health",comp_animation:"Animation",comp_gravity:"Gravity",comp_jump:"Jump",comp_damage:"Damage",comp_statemachine:"StateMachine",comp_cursors:"Cursors",comp_carry:"Carry",comp_collectible:"Collectible"};function dt(e,n){var i,d,p;const t=(i=n==null?void 0:n.components)==null?void 0:i.find(s=>s.definitionId==="comp_sprite"||s.definitionId==="comp_render");if(!t)return;const a=t.defaultValues||{},o=((d=e.componentOverrides)==null?void 0:d.comp_sprite)||((p=e.componentOverrides)==null?void 0:p.comp_render)||{},l={...a,...o};return l.spriteId||l.spriteAssetId||l.sprite||l.spriteName}function pe(e){var l;const n=new Set,t=new Set,a=[],o=new Map;return console.log("🔍 Analyzing component usage..."),console.log(`📊 Total entities in project: ${((l=e.entities)==null?void 0:l.length)||0}`),e.entities&&e.entities.length>0&&e.entities.forEach(i=>{console.log(`  - Entity: ${i.name} (template: ${i.entityTemplateId})`),a.push(i),i.entityTemplateId&&t.add(i.entityTemplateId)}),console.log(`✅ Active entities: ${a.length}`),console.log(`✅ Used templates: ${Array.from(t).join(", ")}`),a.forEach(i=>{var s;const d=i.name||i.id,p=(s=e.templates)==null?void 0:s.find(c=>c.id===i.entityTemplateId);p?(console.log(`  📦 Analyzing template "${p.name}" for entity "${d}"`),p.components&&Array.isArray(p.components)&&p.components.forEach(c=>{const _=c.definitionId||c.componentDefinitionId;if(_){const u=te[_]||_;console.log(`    - Component: ${_} → ${u}`),n.add(u),o.has(u)||o.set(u,new Set),o.get(u).add(d)}}),i.componentOverrides&&Object.keys(i.componentOverrides).forEach(c=>{const _=te[c]||c;console.log(`    - Override: ${c} → ${_}`),n.add(_),o.has(_)||o.set(_,new Set),o.get(_).add(d)})):console.warn(`  ⚠️  Template "${i.entityTemplateId}" not found for entity "${d}"`)}),console.log("📊 Component usage summary:"),console.log(`  - Total used components: ${n.size}`),n.forEach(i=>{const d=o.get(i);console.log(`    • ${i}: ${(d==null?void 0:d.size)||0} entities`)}),{usedComponents:n,usedTemplates:t,activeEntities:a,componentToEntitiesMap:o}}function he(e,n,t){var i;let a=0;const o={Position:0,Sprite:1,Movement:2,Collision:3,Input:4,Behavior:5,Health:6,Animation:7,Jump:8,Gravity:9};let l=!1;if(n&&n.components&&n.components.forEach(d=>{const p=d.definitionId||d.componentDefinitionId,s=te[p];s&&o[s]!==void 0&&(a|=1<<o[s],s==="Sprite"&&(l=!0))}),e.componentOverrides&&Object.keys(e.componentOverrides).forEach(d=>{const p=te[d];p&&o[p]!==void 0&&(a|=1<<o[p],p==="Sprite"&&(l=!0))}),a|=1<<o.Position,l)a|=1<<o.Sprite;else{const d=dt(e,n);d&&((i=t.sprites)==null?void 0:i.some(s=>s.id===d||s.name===d))&&(a|=1<<o.Sprite)}return a}const ct=224,pt="hex";function _t(e){var S,T;const n=e.sprites||[];console.log("🎨 generateSpritesFile() called:"),console.log(`  - analysis.sprites.length: ${n.length}`),console.log(`  - analysis.entities.length: ${((S=e.entities)==null?void 0:S.length)||0}`),console.log(`  - analysis.templates.length: ${((T=e.templates)==null?void 0:T.length)||0}`);const{activeEntities:t}=pe(e);console.log(`  - activeEntities.length: ${t.length}`);const a=r=>{if(!r)return 0;const m=x.find(h=>h.hex.toUpperCase()===r.toUpperCase());return m?m.index:15},o=r=>{if(!r||!r.frames||r.frames.length===0)return[15];const m=new Set,h=r.frames[0].data;return h&&h.forEach(E=>{E.forEach(f=>{const g=a(f);g!==0&&m.add(g)})}),m.size===0?[15]:Array.from(m).sort((E,f)=>E-f)},l=r=>{var g,I,C,b,y,N;console.log(`
🔍 getEntitySpriteInfo for entity: "${r.name}" (template: ${r.entityTemplateId})`),console.log(`   Available sprites: ${n.map(A=>`"${A.name}" (${A.id})`).join(", ")||"NONE"}`);const m=(g=e.templates)==null?void 0:g.find(A=>A.id===r.entityTemplateId);if(!m)return console.log("   ❌ Template not found!"),null;console.log(`   Template found: "${m.name}"`),console.log(`   Template components: ${((I=m.components)==null?void 0:I.map(A=>A.definitionId).join(", "))||"NONE"}`);const h=e.components||[];let E;if(r.componentOverrides)for(const A in r.componentOverrides){const D=h.find(v=>v.id===A),R=(C=D==null?void 0:D.properties)==null?void 0:C.find(v=>v.type==="sprite_ref");if(R&&((b=r.componentOverrides[A])!=null&&b[R.name])){E=r.componentOverrides[A][R.name],console.log(`   ✅ Found spriteAssetId in overrides: "${E}"`);break}}if(!E)for(const A of m.components||[]){const D=h.find(v=>v.id===A.definitionId),R=(y=D==null?void 0:D.properties)==null?void 0:y.find(v=>v.type==="sprite_ref");if(R&&((N=A.defaultValues)!=null&&N[R.name])){E=A.defaultValues[R.name],console.log(`   ✅ Found spriteAssetId in template defaults: "${E}"`);break}}if(console.log(`   Resolved spriteAssetId: "${E||"undefined"}"`),!E)return console.log("   ⚠️ No sprite_ref property found in any component"),n.length>0?(console.log(`   ⚠️ Defaulting to first sprite "${n[0].name}"`),{spriteAssetIndex:0,spriteName:n[0].name,colors:o(n[0])}):null;let f=n.findIndex(A=>A.id===E);if(f<0&&(f=n.findIndex(A=>A.name===E)),f<0){const A=E.toLowerCase();f=n.findIndex(D=>{var R,v;return((R=D.name)==null?void 0:R.toLowerCase().includes(A))||A.includes(((v=D.name)==null?void 0:v.toLowerCase())||"")})}return f>=0?(console.log(`   ✅ Found sprite "${n[f].name}" at index ${f}`),{spriteAssetIndex:f,spriteName:n[f].name,colors:o(n[f])}):(console.log(`   ❌ Sprite "${E}" not found in project assets`),{spriteAssetIndex:-1,spriteName:`MISSING_${E}`,colors:[15]})},i=[];let d=0;t.forEach((r,m)=>{const h=l(r);if(!h){i.push({entityIndex:m,spriteName:"PLACEHOLDER",spriteAssetIndex:-1,baseHwSpriteIndex:d,layerCount:1,colors:[15]}),d+=1;return}i.push({entityIndex:m,spriteName:h.spriteName,spriteAssetIndex:h.spriteAssetIndex,baseHwSpriteIndex:d,layerCount:h.colors.length,colors:h.colors}),d+=h.colors.length});const p=32;let s=`; ==================================================================
; SPRITE DATA
; File: sprites.asm
; Description: Sprite pattern and animation data
; Entities: ${t.length}
; Total Hardware Sprites (Layers): ${p}
; ==================================================================

; ==================================================================
; SPRITE PATTERN DATA
; ==================================================================
`;n.forEach((r,m)=>{const h=`_${m}`,f=(r.name+h).replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase(),g=Oe(r,pt,m);let I=-1;for(let C=0;C<4;C++)if(g.includes(`${f}_F0_LAYER${C}:`)){I=C;break}s+=`
; Sprite Asset ${m}: ${r.name}
${g}`,I>=0?s+=`
; Unified pattern label for sprite ${m}
SPRITE_${m}_PATTERN EQU ${f}_F0_LAYER${I}
`:s+=`
; WARNING: No valid pattern layers found for sprite ${m}
SPRITE_${m}_PATTERN:
    db 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0
`}),s+=`
; ==================================================================
; PLACEHOLDER SPRITE PATTERN (for entities with missing sprite assets)
; ==================================================================
; 16x16 white square sprite (solid fill)
SPRITE_PLACEHOLDER_PATTERN:
    ; Top half (8x8)
    db #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF
    ; Bottom half (8x8)
    db #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF
    ; Right half top (8x8)
    db #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF
    ; Right half bottom (8x8)
    db #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF

`,n.length===0&&(s+=`; No sprite assets found - using placeholder pattern only
SPRITE_0_PATTERN EQU SPRITE_PLACEHOLDER_PATTERN
`),s+=`
; ==================================================================
; SPRITE CONFIGURATION TABLES
; ==================================================================

; Table: Entity Sprite Configuration
; Format: db base_hw_sprite_index, layer_count
entity_sprite_config:
`,i.forEach(r=>{const m=r.baseHwSpriteIndex>=0?r.baseHwSpriteIndex:0;s+=`    db ${m}, ${r.layerCount} ; Entity ${r.entityIndex} (${r.spriteName})
`}),i.length<32&&(s+=`    ds ${(32-i.length)*2}, 0 ; Padding
`),s+=`
; Table: Hardware Sprite Layer Colors
; Format: db color_index
sprite_layer_colors:
`;let c=0;i.forEach(r=>{r.layerCount>0&&(s+=`    ; Entity ${r.entityIndex} (${r.spriteName}) layers:
`,r.colors.forEach((m,h)=>{s+=`    db ${m} ; Layer ${h}
`,c+=1}))});const _=p-c;_>0&&(s+=`    ds ${_}, 0 ; Padding
`),s+=`
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
    ; Load patterns for all active entities
`;let u=!1;if(i.forEach(r=>{if(r.layerCount===0)return;const m=r.spriteAssetIndex<0?"SPRITE_PLACEHOLDER_PATTERN":`SPRITE_${r.spriteAssetIndex}_PATTERN`;s+=`    ; Entity ${r.entityIndex}: ${r.spriteName} (${r.layerCount} layers)
    ; Base HW Sprite: ${r.baseHwSpriteIndex}
    ld hl, ${m}
    ld de, SPRPAT + (${r.baseHwSpriteIndex} * 32)
    ld bc, ${r.layerCount*32} ; Load ${r.layerCount} layers (32 bytes each)
    call LDIRVM
`,u=!0}),!u)if(n.length===0)s+=`    ; No sprites to load
`;else{s+=`    ; No active entities detected, load all sprite assets sequentially
`;let r=0;n.forEach((m,h)=>{var I;const E=o(m).length||1,f=((I=m.frames)==null?void 0:I.length)||1,g=E*f*32;s+=`    ; Sprite Asset ${h}: ${m.name} (${f} frames, ${E} layers)
    ld hl, SPRITE_${h}_PATTERN
    ld de, SPRPAT + (${r} * 32)
    ld bc, ${g}
    call LDIRVM
`,r+=E*f})}return s+=`    ret

; ==================================================================
; SPRITE MANAGEMENT FUNCTIONS
; ==================================================================

; A = hardware sprite index, B = X, C = Y, D = pattern, E = color
show_sprite:
    ; Safety check: Ensure sprite index < 32
    cp 32
    ret nc

    ; Safety check: If Y=209 (invisible), force it to visible (e.g. 100)
    push af
    ld a, c
    cp 209
    jr nz, .y_ok
    ld c, 100       ; Force visible Y
.y_ok:
    pop af

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
    ld b, ${p+4} ; Clear a bit more for safety
.clear_loop:
    ld (hl), SPRITE_INVISIBLE
    ld de, 4
    add hl, de
    djnz .clear_loop
    ret

; Hide specific sprite (A = hardware sprite index)
hide_sprite:
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
    ld bc, ${p*4}  ; 4 bytes per sprite
    call LDIRVM
    ret

; ==================================================================
; SPRITE CONSTANTS
; ==================================================================
SPRITE_INVISIBLE    EQU ${ct}

; ==================================================================
; RAM REQUIREMENTS
; ==================================================================
; sprite_attributes: ds ${p*4}
; active_sprite_count: db 0
`,s}function ht(){return`
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
`}function mt(e){return`
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
    jp z, sprite_next_entity   ; Skip if no sprite component (jp because distance > 127 bytes)

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
    ; E already contains entity index (from line 129)
    ; D = 0 (from line 130)
    
    ; Get entity position (X, Y)
    ld hl, entity_x_pos
    add hl, de                 ; HL points to entity X
    ld b, (hl)                 ; B = X position

    ld hl, entity_y_pos
    add hl, de                 ; HL points to entity Y
    ld c, (hl)                 ; C = Y position

    ; Get sprite configuration (Base HW Sprite + Layer Count)
    ; E still contains entity index, D = 0
    ld hl, entity_sprite_config
    add hl, de
    add hl, de                 ; Index * 2 (2 bytes per entry)
    
    ld a, (hl)                 ; Base HW Sprite
    inc hl
    ld h, (hl)                 ; Layer Count
    ld l, a                    ; L = Base HW Sprite (Current HW Sprite)
    ld a, h
    or a
    jp z, sprite_continue      ; No layers -> skip rendering
    
    ; Loop through layers
    ; H = Remaining Layers
    ; L = Current HW Sprite
    ; B = X Position
    ; C = Y Position
    
sprite_layer_loop:
    push hl                    ; Save counters
    push bc                    ; Save Position
    
    ; Calculate Pattern: Pattern = HW Sprite Index (0-31)
    ld a, l
    ld d, a                    ; D = Pattern (direct index, not *4)
    
    ; Get Color from sprite_layer_colors table
    ; Table is indexed by HW Sprite Index (L)
    push de
    ld de, sprite_layer_colors
    ld a, l
    add a, e
    ld e, a
    ld a, 0
    adc a, d
    ld d, a                    ; DE = &sprite_layer_colors[hwSprite]
    ld a, (de)                 ; A = Color
    pop de                     ; Restore D (Pattern)
    ld e, a                    ; E = Color
    
    ; Call show_sprite (A=HW Sprite, B=X, C=Y, D=Pattern, E=Color)
    ld a, l                    ; A = HW Sprite
    call show_sprite
    
    pop bc                     ; Restore Position
    pop hl                     ; Restore counters
    
    inc l                      ; Next HW Sprite
    dec h                      ; Decrement Layer Count
    jr nz, sprite_layer_loop
    
    jr sprite_continue

sprite_hide:
    ; Entity is in different screen - hide sprite (Y = 208+)
    ; We must hide ALL layers for this entity
    ; E contains Entity Index (from line 129)
    ; D = 0 (from line 130)
    
    ld hl, entity_sprite_config
    add hl, de
    add hl, de
    
    ld a, (hl)                 ; Base HW Sprite
    inc hl
    ld b, (hl)                 ; Layer Count
    ld a, b
    or a
    jr z, sprite_continue      ; Nothing to hide for anchor entities
    
sprite_hide_loop:
    push bc
    push af
    call hide_sprite           ; A = HW Sprite
    pop af
    pop bc
    
    inc a                      ; Next HW Sprite
    djnz sprite_hide_loop

sprite_continue:
    pop hl
    pop bc

sprite_next_entity:
    inc hl                     ; Next entity
    inc c                      ; Next entity index
    dec b                      ; Decrement loop counter
    jp nz, sprite_update_loop  ; Jump if not zero (djnz replacement for long jumps)

    ; Update all sprites to VRAM
    call update_sprites_to_vram
    ret

; ==================================================================
; HELPER: Force update a single entity's sprite (used by init_entities)
; Input: C = Entity Index
; ==================================================================
force_update_entity_sprite:
    push bc
    push de
    push hl
    
    ; Get X/Y from memory
    ld hl, entity_x_pos
    ld e, c
    ld d, 0
    add hl, de
    ld b, (hl)                 ; B = X
    
    ld hl, entity_y_pos
    add hl, de
    ld c, (hl)                 ; C = Y
    
    ; E still has Entity Index, D = 0
    ; B = X, C = Y
    
    ; Get Config
    ld hl, entity_sprite_config
    add hl, de
    add hl, de                 ; Index * 2
    
    ld a, (hl)                 ; Base HW Sprite
    inc hl
    ld h, (hl)                 ; Layer Count
    ld l, a                    ; L = Base HW Sprite
    ld a, h
    or a
    jr z, force_sprite_done    ; Skip if no layers for this entity

    ; Loop through layers
    ; H = Layer Count
    ; L = HW Sprite Index
    ; B = X, C = Y
force_sprite_layer_loop:
    push hl                    ; Save counters
    push bc                    ; Save Position
    
    ; Calculate Pattern: Pattern = HW Sprite Index (0-31)
    ld a, l
    ld d, a                    ; D = Pattern (direct index, not *4)
    
    ; Get Color
    push de
    ld de, sprite_layer_colors
    ld a, l
    add a, e
    ld e, a
    ld a, 0
    adc a, d
    ld d, a
    ld a, (de)
    pop de                     ; Restore D
    ld e, a                    ; E = Color
    
    ; Call show_sprite
    ld a, l                    ; A = HW Sprite
    call show_sprite
    
    pop bc                     ; Restore Position
    pop hl                     ; Restore counters
    
    inc l
    dec h
    jr nz, force_sprite_layer_loop

force_sprite_done:
    pop hl
    pop de
    pop bc
    ret
`}function ut(){return`
        ; ==================================================================
        ; MOVEMENT COMPONENT SYSTEM (Based on movement physics)
        ; ==================================================================

        init_movement_system:
            ; Initialize movement / physics system
            ; Clear velocities
            ld a, 0
            ld (entity_vel_x), a
            ld (entity_vel_y), a
    ret

        update_movement_component:
            ; Update movement / physics for entities
            ld b, 32                   ; Loop through all entities
            ld hl, entity_comp_masks   ; Check component masks
            ld c, 0                    ; Entity index

        movement_update_loop:
            ld a, (hl)                 ; Get entity component mask
            and COMP_MASK_MOVEMENT     ; Check if has movement component
            jr z, movement_next_entity ; Skip if no movement component

            ; Apply physics / movement logic here
            push bc
            push hl

            ; 1. Apply Gravity (if applicable - TODO: check Gravity component)
            ; For now, just simple friction / damping if no input

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
            dec b                      ; Decrement loop counter
            jp nz, movement_update_loop
    ret
    `}function Et(e){const n=e.tiles&&e.tiles.length>0?e.tiles[0].width:16,t=e.tiles&&e.tiles.length>0?e.tiles[0].height:16,a=Math.floor(256/n),o=Math.floor(192/t),l=Number.isInteger(Math.log2(n))?Math.log2(n):4,i=Number.isInteger(Math.log2(t))?Math.log2(t):4,d=Array.from({length:l},(c,_)=>`    srl a; A = X / ${Math.pow(2,_+1)} `).join(`
`),p=Array.from({length:i},(c,_)=>`    srl a; A = Y / ${Math.pow(2,_+1)} `).join(`
`);return`
        ; ==================================================================
; COLLISION COMPONENT SYSTEM(Based on ScreenEditor collision detection)
        ; ==================================================================

            init_collision_system:
    ; Initialize collision detection system
    ret

    update_collision_component:
    ; Check collisions between entities and environment
    ld b, 32; Loop through all entities
    ld hl, entity_comp_masks; Check component masks
    ld c, 0; Entity index

    collision_update_loop:
    ld a, (hl); Get entity component mask
    and COMP_MASK_COLLISION; Check if has collision component
    jr z, collision_next_entity; Skip if no collision component

        ; Perform collision detection for this entity
    push bc
    push hl

        ; Get entity position
    ld hl, entity_x_pos
    ld e, c; Entity index
    ld d, 0
    add hl, de; HL points to entity X
    ld a, (hl); A = X position

    ld hl, entity_y_pos
    add hl, de; HL points to entity Y
    ld b, (hl); B = Y position

        ; Check screen boundaries(256x192 with 16x16 sprites)
    ; Left boundary
    cp 0
    jr z, collision_boundary_hit

        ; Right boundary(256 - 16 = 240)
    cp 240
    jr nc, collision_boundary_hit

        ; Top boundary
    ld a, b
    cp 0
    jr z, collision_boundary_hit

        ; Bottom boundary(192 - 16 = 176)
    cp 176
    jr nc, collision_boundary_hit

        ; Check tile collision(if screen maps exist)
    call check_tile_collision

        ; Check entity - to - entity collision
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
    dec b                      ; Decrement loop counter
    jp nz, collision_update_loop
    ret

        ; ==================================================================
; COLLISION HELPER FUNCTIONS(Critical for Gameplay Parity)
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
    ; Convert X to tile column(divide by ${n})`:`; No tiles detected - using default 16x16
        ; Convert X to tile column(divide by 16)`}

${d}
    ld c, a; C = tile column

        ; Convert Y to tile row(divide by ${t})
    ld a, b
${p}
    ld b, a; B = tile row

        ; Check if position is within valid tile map
    ld a, c
    cp ${a}; Screen width in tiles
    jr nc, no_tile_collision
    ld a, b
    cp ${o}; Screen height in tiles
    jr nc, no_tile_collision

        ; Get tile at position(simplified - would read from behavior map)
        ; For now, assume all non - zero tiles are solid
        ; This would read from the behavior map generated from screen data
    call get_behavior_tile; Returns A = behavior value
    or a
    jr z, no_tile_collision; 0 = passable

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
    ld e, 0; Other entity index

    entity_collision_loop:
    ld a, e
    cp c; Skip self
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
    add hl, de; HL points to other entity X
    ld d, (hl); D = other X

    ld hl, entity_y_pos
    add hl, de; HL points to other entity Y
    ld e, (hl); E = other Y

        ; Check if entities overlap(16x16 sprites)
            ; Current entity: A = X, B = Y
                ; Other entity: D = X, E = Y

                    ; X overlap check: | X1 - X2 | <16
    ld h, a; H = current X
    ld a, d; A = other X
    sub h; A = other X - current X
    jr nc, x_diff_positive; Jump if positive
    neg; Make positive
    x_diff_positive:
    cp 16; Check if <16
    jr nc, no_entity_collision; No X overlap

        ; Y overlap check: | Y1 - Y2 | <16
    ld a, e; A = other Y
    sub b; A = other Y - current Y
    jr nc, y_diff_positive; Jump if positive
    neg; Make positive
    y_diff_positive:
    cp 16; Check if <16
    jr nc, no_entity_collision; No Y overlap

        ; Collision detected!
    call handle_entity_collision

    no_entity_collision:
    pop de
    pop hl

    next_entity_collision:
    inc hl; Next entity mask
    inc e; Next entity index
    ld a, e
    cp 32; Check all 32 entities
    jr nz, entity_collision_loop

    pop af
    pop bc
    ret

    handle_boundary_collision:
    ; Handle collision with screen boundaries
        ; Stop movement in the collision direction
    ld a, 0
    ld (entity_vel_x), a; Stop X movement
    ld (entity_vel_y), a; Stop Y movement
    ret

    handle_tile_collision:
    ; Handle collision with solid tiles
        ; Prevent movement into the tile
    ld a, 0
    ld (entity_vel_x), a; Stop X movement
    ld (entity_vel_y), a; Stop Y movement
    ret

    handle_entity_collision:
    ; Handle collision between entities
        ; Implementation depends on game logic(damage, bouncing, etc.)
    ret

    get_behavior_tile:
    ; Get behavior value for tile at(B, C)
        ; Returns A = behavior value(0 = passable, 1 = solid, etc.)
        ; This would read from the behavior map data
        ; For now, return 0(all passable)
    ld a, 0
    ret
        `}function Tt(){return`
        ; ==================================================================
        ; INPUT COMPONENT SYSTEM (With direction restrictions - Cursors)
        ; ==================================================================

; Direction flags for Cursors component
DIR_ALLOW_UP     EQU #01 ; Bit 0: Allow UP movement
DIR_ALLOW_DOWN   EQU #02 ; Bit 1: Allow DOWN movement
DIR_ALLOW_LEFT   EQU #04 ; Bit 2: Allow LEFT movement
DIR_ALLOW_RIGHT  EQU #08 ; Bit 3: Allow RIGHT movement

        init_input_system:
            ; Initialize input handling system
            xor a
            ld (input_state), a
            ld (prev_input_state), a

            ; Initialize direction masks for all entities (default: all directions allowed)
            ld hl, entity_dir_mask
            ld de, entity_dir_mask + 1
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
            jp z, input_next_entity    ; Skip if no input component

            ; Apply input to entity movement (real implementation)
            push bc
            push hl

            ; Get direction mask for this entity
            ld hl, entity_dir_mask
            ld e, c
            ld d, 0
            add hl, de
            ld d, (hl)                 ; D = direction mask (allowUp / Down / Left / Right)

            ; Convert joystick input to velocity
            ld a, (input_state)
            ld b, 0                    ; Default X velocity
            ld c, 0                    ; Default Y velocity

            ; Check directional input with direction restrictions
            cp STICK_UP
            jp z, input_move_up
            cp STICK_DOWN
            jp z, input_move_down
            cp STICK_LEFT
            jp z, input_move_left
            cp STICK_RIGHT
            jp z, input_move_right
            cp STICK_UPRIGHT
            jp z, input_move_upright
            cp STICK_UPLEFT
            jp z, input_move_upleft
            cp STICK_DOWNRIGHT
            jp z, input_move_downright
            cp STICK_DOWNLEFT
            jp z, input_move_downleft
            jp input_apply_velocity

        input_move_up:
            ; Check if UP is allowed (bit 0)
            ld a, d
            and DIR_ALLOW_UP
            jp z, input_apply_velocity ; Not allowed, skip
            ld c, -2                   ; Negative Y velocity (up)
            jp input_apply_velocity

        input_move_down:
            ; Check if DOWN is allowed (bit 1)
            ld a, d
            and DIR_ALLOW_DOWN
            jp z, input_apply_velocity ; Not allowed, skip
            ld c, 2                    ; Positive Y velocity (down)
            jp input_apply_velocity

        input_move_left:
            ; Check if LEFT is allowed (bit 2)
            ld a, d
            and DIR_ALLOW_LEFT
            jp z, input_apply_velocity ; Not allowed, skip
            ld b, -2                   ; Negative X velocity (left)
            jp input_apply_velocity

        input_move_right:
            ; Check if RIGHT is allowed (bit 3)
            ld a, d
            and DIR_ALLOW_RIGHT
            jp z, input_apply_velocity ; Not allowed, skip
            ld b, 2                    ; Positive X velocity (right)
            jp input_apply_velocity

        input_move_upright:
            ; Check if both UP and RIGHT are allowed
            ld a, d
            and DIR_ALLOW_UP
            jp z, input_check_right_only ; UP not allowed
            ld a, d
            and DIR_ALLOW_RIGHT
            jp z, input_check_up_only  ; RIGHT not allowed
            ; Both allowed - diagonal
            ld b, 1                    ; Diagonal movement (slower)
            ld c, -1
            jp input_apply_velocity
        input_check_right_only:
            ; Only RIGHT allowed
            ld a, d
            and DIR_ALLOW_RIGHT
            jp z, input_apply_velocity
            ld b, 2
            jp input_apply_velocity
        input_check_up_only:
            ; Only UP allowed
            ld c, -2
            jp input_apply_velocity

        input_move_upleft:
            ; Check if both UP and LEFT are allowed
            ld a, d
            and DIR_ALLOW_UP
            jp z, input_check_left_only1 ; UP not allowed
            ld a, d
            and DIR_ALLOW_LEFT
            jp z, input_check_up_only1 ; LEFT not allowed
            ; Both allowed - diagonal
            ld b, -1
            ld c, -1
            jp input_apply_velocity
        input_check_left_only1:
            ; Only LEFT allowed
            ld a, d
            and DIR_ALLOW_LEFT
            jp z, input_apply_velocity
            ld b, -2
            jp input_apply_velocity
        input_check_up_only1:
            ; Only UP allowed
            ld c, -2
            jp input_apply_velocity

        input_move_downright:
            ; Check if both DOWN and RIGHT are allowed
            ld a, d
            and DIR_ALLOW_DOWN
            jp z, input_check_right_only2 ; DOWN not allowed
            ld a, d
            and DIR_ALLOW_RIGHT
            jp z, input_check_down_only2 ; RIGHT not allowed
            ; Both allowed - diagonal
            ld b, 1
            ld c, 1
            jp input_apply_velocity
        input_check_right_only2:
            ; Only RIGHT allowed
            ld a, d
            and DIR_ALLOW_RIGHT
            jp z, input_apply_velocity
            ld b, 2
            jp input_apply_velocity
        input_check_down_only2:
            ; Only DOWN allowed
            ld c, 2
            jp input_apply_velocity

        input_move_downleft:
            ; Check if both DOWN and LEFT are allowed
            ld a, d
            and DIR_ALLOW_DOWN
            jp z, input_check_left_only3 ; DOWN not allowed
            ld a, d
            and DIR_ALLOW_LEFT
            jp z, input_check_down_only3 ; LEFT not allowed
            ; Both allowed - diagonal
            ld b, -1
            ld c, 1
            jp input_apply_velocity
        input_check_left_only3:
            ; Only LEFT allowed
            ld a, d
            and DIR_ALLOW_LEFT
            jp z, input_apply_velocity
            ld b, -2
            jp input_apply_velocity
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
            dec b                      ; Decrement loop counter
            jp nz, input_update_loop
            ret
    `}function St(){return`
    ; ==================================================================
        ; BEHAVIOR COMPONENT SYSTEM(Based on BehaviorEditor logic)
    ; ==================================================================

        init_behavior_system:
; Initialize AI / behavior system
            ret

update_behavior_component:
; Update AI / behavior logic for entities
            ld b, 32                   ; Loop through all entities
            ld hl, entity_comp_masks; Check component masks

behavior_update_loop:
            ld a, (hl); Get entity component mask
            and COMP_MASK_BEHAVIOR; Check if has behavior component
            jr z, behavior_next_entity; Skip if no behavior component

    ; Execute behavior scripts / AI logic
    ; TODO: State machines, pathfinding, decision trees

behavior_next_entity:
            inc hl; Next entity
            dec b; Decrement loop counter
            jp nz, behavior_update_loop
            ret
    `}function ft(){return`
    ; ==================================================================
        ; GRAVITY COMPONENT SYSTEM(Constant downward acceleration)
    ; ==================================================================

        init_gravity_system:
; Initialize gravity system
    ; Clear gravity velocities
            ld hl, entity_gravity_vel
            ld de, entity_gravity_vel + 1
            ld bc, 63; 64 bytes - 1(32 words)
            ld (hl), 0
            ldir
            ret

update_gravity_component:
; Apply gravity acceleration to entities
            ld b, 32; Loop through all entities
            ld hl, entity_comp_masks; Check component masks
            ld c, 0; Entity index

gravity_update_loop:
            ld a, (hl); Get entity component mask(low byte)
            inc hl
            ld a, (hl); Get high byte
            and #02; Check COMP_MASK_GRAVITY(#0200)
            jr z, gravity_next_entity; Skip if no gravity component
            dec hl; Restore HL

    ; Entity has gravity - apply acceleration
            push bc
            push hl

    ; Check if entity is grounded
            ld hl, entity_on_ground
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            bit 0, a; Check ground flag
            jr nz, gravity_grounded; Skip gravity if on ground

    ; Apply gravity acceleration
            ld hl, entity_gravity_vel
            ld e, c
            ld d, 0
            add hl, de
            add hl, de; HL points to gravity velocity(word)

            ld e, (hl); Load current gravity velocity
            inc hl
            ld d, (hl)

    ; Add gravity strength(64 in fixed - point = ~0.25 pixels / frame acceleration)
            ld a, e
            add a, #40; Add 64 to low byte
            ld e, a
            ld a, d
            adc a, #00; Add carry to high byte
            ld d, a

    ; Check terminal velocity(1024 = max fall speed)
            ld a, d
            cp #04; Check if >= 1024
            jr c, gravity_store_vel; If < 1024, continue
            ld de, #0400; Cap at terminal velocity

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
            ld a, (hl); Current Y
            add a, d; Add velocity high byte(integer part)
            ld (hl), a; Store new Y

            jr gravity_done

gravity_grounded:
; Entity is grounded - reset gravity velocity
            ld hl, entity_gravity_vel
            ld e, c
            ld d, 0
            add hl, de
            add hl, de
            ld (hl), 0; Clear velocity low
            inc hl
            ld (hl), 0; Clear velocity high

gravity_done:
            pop hl
            pop bc

gravity_next_entity:
            inc hl; Next entity mask(2 bytes)
            inc hl
            inc c; Next entity index
            dec b; Decrement loop counter
            jp nz, gravity_update_loop
    ret
    `}function At(){return`
    ; ==================================================================
        ; HEALTH COMPONENT SYSTEM
    ; ==================================================================

        init_health_system:
            ; Initialize health system
            ret

        update_health_component:
            ; Update health for entities
            ; TODO: Implement health management
    ret
    `}function gt(){return`
    ; ==================================================================
        ; ANIMATION COMPONENT SYSTEM
    ; ==================================================================

        init_animation_system:
            ; Initialize animation system
            ret

        update_animation_component:
            ; Update animations for entities
            ; TODO: Implement animation frame updates
    ret
    `}function It(){return`
    ; ==================================================================
        ; JUMP COMPONENT SYSTEM
    ; ==================================================================

        init_jump_system:
            ; Initialize jump system
            ret

        update_jump_component:
            ; Update jump logic for entities
            ; TODO: Implement jump mechanics
    ret
    `}function Ct(){return`
    ; ==================================================================
        ; ENTITY MANAGEMENT FUNCTIONS(Based on EntityTemplate system)
    ; ==================================================================

        ; Create entity with components(A = entity ID, B = component mask)
        create_entity:
; Set component mask for entity
            ld hl, entity_comp_masks
            ld e, a; Entity index
            ld d, 0
            add hl, de; HL points to entity mask
            ld (hl), b; Set component mask

    ; Initialize component data based on mask
            bit 0, b; Check COMP_MASK_POSITION
            call nz, init_entity_position

            bit 1, b; Check COMP_MASK_SPRITE
            call nz, init_entity_sprite

    ; TODO: Initialize other components based on mask bits

    ret

    ; Initialize position component for entity(A = entity ID)
        init_entity_position:
            ld hl, entity_x_pos
            ld e, a
            ld d, 0
            add hl, de
            ld (hl), 100; Default X position

            ld hl, entity_y_pos
            add hl, de
            ld (hl), 100; Default Y position
    ret

    ; Initialize sprite component for entity(A = entity ID)
        init_entity_sprite:
    ; Set sprite as visible with default pattern
            ld hl, sprite_pattern
            ld e, a
            ld d, 0
            add hl, de
            ld (hl), 0; Pattern 0

            ld hl, sprite_color
            add hl, de
            ld (hl), 15; White color
    ret
    `}function bt(e){const n=e.usedComponents;let t=`init_components:
; Initialize component systems(OPTIMIZED - only used components)
    ; Used: ${Array.from(n).join(", ")}

; Initialize current screen ID(multi - screen support)
        ld a, 0; Start at screen 0
        ld (current_screen_id), a

    ; Clear all component masks
        ld hl, entity_comp_masks
        ld de, entity_comp_masks + 1
        ld bc, 31
        ld (hl), 0
        ldir

    `;return t+=`    ; Initialize position system (always)
    call init_position_system
    `,n.has("Sprite")&&(t+=`    ; Initialize sprite system
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
    `),n.has("Cursors")&&(t+=`    ; Initialize cursors system (stub)
    call init_cursors_system
    `),n.has("StateMachine")&&(t+=`    ; Initialize state machine system (stub)
    call init_statemachine_system
    `),n.has("Carry")&&(t+=`    ; Initialize carry system (stub)
    call init_carry_system
    `),n.has("Damage")&&(t+=`    ; Initialize damage system (stub)
    call init_damage_system
    `),n.has("WallCollision")&&(t+=`    ; Initialize wall collision system (stub)
    call init_wallcollision_system
    `),n.has("Collectible")&&(t+=`    ; Initialize collectible system (stub)
    call init_collectible_system
    `),t+=`
    ret
    `,t}function yt(e){if(!e.entities||e.entities.length===0)return`; ==================================================================
; GAME COMPONENT SYSTEMS(SKIPPED - NO ENTITIES DETECTED)
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
; END OF COMPONENTS(MINIMAL VERSION)
    ; ==================================================================
        `;const n=pe(e),t=n.usedComponents;console.log("🎯 Generating optimized components.asm..."),console.log(`  - Active entities: ${n.activeEntities.length} `),console.log(`  - Used components: ${Array.from(t).join(", ")} `),console.log(`  - Filtered out: ${8-t.size} unused components`);let a=`; ==================================================================
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
; COMPONENT TYPE CONSTANTS(Based on ComponentDefinition analysis)
    ; ==================================================================

; Core Components(always present)
COMP_POSITION   EQU 0; Position component(x, y coordinates)
COMP_SPRITE     EQU 1; Sprite rendering component
COMP_MOVEMENT   EQU 2; Movement / velocity component
COMP_COLLISION  EQU 3; Collision detection component
COMP_INPUT      EQU 4; Input handling component
COMP_BEHAVIOR   EQU 5; AI / Logic behavior component
COMP_HEALTH     EQU 6; Health / damage component
COMP_ANIMATION  EQU 7; Animation state component
COMP_JUMP       EQU 8; Jump behavior component(platformer physics)
COMP_GRAVITY    EQU 9; Gravity physics component

    ; Component flags for entity filtering(16 - bit masks for 10 + components)
COMP_MASK_POSITION   EQU #0001; Binary: 0000000000000001
COMP_MASK_SPRITE     EQU #0002; Binary: 0000000000000010
COMP_MASK_MOVEMENT   EQU #0004; Binary: 0000000000000100
COMP_MASK_COLLISION  EQU #0008; Binary: 0000000000001000
COMP_MASK_INPUT      EQU #0010; Binary: 0000000000010000
COMP_MASK_BEHAVIOR   EQU #0020; Binary: 0000000000100000
COMP_MASK_HEALTH     EQU #0040; Binary: 0000000001000000
COMP_MASK_ANIMATION  EQU #0080; Binary: 0000000010000000
COMP_MASK_JUMP       EQU #0100; Binary: 0000000100000000
COMP_MASK_GRAVITY    EQU #0200; Binary: 0000001000000000

    ; ==================================================================
; COMPONENT DATA STRUCTURES(Entity - Component arrays)
    ; ==================================================================

; NOTE: Core entity variables are now defined in variables.asm
    ; (entity_x_pos, entity_y_pos, entity_vel_x, entity_vel_y, entity_comp_masks, etc.)

    ; Jump Component Data(Fixed - Point 8.8 for smooth physics)
    ; Using temporary storage for optional components to save RAM
entity_jump_vel_y   EQU temp_word_3; Y velocity for jumping(signed word, 32 words = 64 bytes)
entity_jump_count   EQU temp_byte_4; Current jump count(0 = grounded, 1 = first jump, etc.)(32 bytes)
entity_on_ground    EQU temp_byte_5; Ground contact flag(bit 0 = on ground)(32 bytes)

    ; Gravity Component Data
entity_gravity_vel  EQU temp_word_4; Accumulated gravity velocity(signed word, 64 bytes)


    ; ==================================================================
; CORE ECS SYSTEM FUNCTIONS
    ; ==================================================================

        ${bt(n)}
`;a+=ht();const o=e.sprites&&e.sprites.length>0;return t.has("Sprite")||o?a+=mt():a+=`
    ; Sprite system filtered out(not used)
init_sprite_system:
    ret

update_sprite_component:
    ret

force_update_entity_sprite:
    ret
    `,t.has("Movement")?a+=ut():a+=`
    ; Movement system filtered out(not used)
init_movement_system:
    ret

update_movement_component:
    ret
    `,t.has("Collision")?a+=Et(e):a+=`
    ; Collision system filtered out(not used)
init_collision_system:
    ret

update_collision_component:
    ret
    `,t.has("Input")?a+=Tt():a+=`
    ; Input system filtered out(not used)
init_input_system:
    ret

update_input_component:
    ret
    `,t.has("Behavior")?a+=St():a+=`
    ; Behavior system filtered out(not used)
init_behavior_system:
    ret

update_behavior_component:
    ret
    `,t.has("Health")?a+=At():a+=`
    ; Health system filtered out(not used)
init_health_system:
    ret

update_health_component:
    ret
    `,t.has("Animation")?a+=gt():a+=`
    ; Animation system filtered out(not used)
init_animation_system:
    ret

update_animation_component:
    ret
    `,t.has("Jump")?a+=It():a+=`
    ; Jump system filtered out(not used)
init_jump_system:
    ret

update_jump_component:
    ret
    `,t.has("Gravity")?a+=ft():a+=`
    ; Gravity system filtered out(not used)
init_gravity_system:
    ret

update_gravity_component:
    ret
    `,t.has("Cursors")?a+=`
    ; Cursors system (stub - TODO: implement)
init_cursors_system:
    ret

update_cursors_component:
    ret
    `:a+=`
    ; Cursors system filtered out(not used)
init_cursors_system:
    ret

update_cursors_component:
    ret
    `,t.has("StateMachine")?a+=`
    ; StateMachine system (stub - TODO: implement)
init_statemachine_system:
    ret

update_statemachine_component:
    ret
    `:a+=`
    ; StateMachine system filtered out(not used)
init_statemachine_system:
    ret

update_statemachine_component:
    ret
    `,t.has("Carry")?a+=`
    ; Carry system (stub - TODO: implement)
init_carry_system:
    ret

update_carry_component:
    ret
    `:a+=`
    ; Carry system filtered out(not used)
init_carry_system:
    ret

update_carry_component:
    ret
    `,t.has("Damage")?a+=`
    ; Damage system (stub - TODO: implement)
init_damage_system:
    ret

update_damage_component:
    ret
    `:a+=`
    ; Damage system filtered out(not used)
init_damage_system:
    ret

update_damage_component:
    ret
    `,t.has("WallCollision")?a+=`
    ; WallCollision system (stub - TODO: implement)
init_wallcollision_system:
    ret

update_wallcollision_component:
    ret
    `:a+=`
    ; WallCollision system filtered out(not used)
init_wallcollision_system:
    ret

update_wallcollision_component:
    ret
    `,t.has("Collectible")?a+=`
    ; Collectible system (stub - TODO: implement)
init_collectible_system:
    ret

update_collectible_component:
    ret
    `:a+=`
    ; Collectible system filtered out(not used)
init_collectible_system:
    ret

update_collectible_component:
    ret
    `,a+=Ct(),a+=`
; ==================================================================
; UPDATE ALL ENTITIES - Called by GameFlow
; ==================================================================
; This function updates all active entities by calling each
; component update system in the correct order
update_all_entities:
    ; Update all entity components in proper order
    call update_input_component        ; 1. Input (player control)
    call update_behavior_component     ; 2. Behavior/AI
    call update_movement_component     ; 3. Movement/Physics
    call update_gravity_component      ; 4. Gravity
    call update_position_component     ; 5. Position (apply velocities)
    call update_collision_component    ; 6. Collision detection
    call update_health_component       ; 7. Health/Death
    call update_animation_component    ; 8. Animation
    call update_sprite_component       ; 9. Sprite rendering
    ret

`,a+=`
; ==================================================================
; EXECUTE ALL STATE MACHINES - Called by GameFlow
; ==================================================================
; This function executes the state machine for each entity that has one
execute_all_state_machines:
    ld b, 32                      ; Loop through all 32 entities
    xor a                         ; A = 0 (entity index counter)
    
.sm_loop:
    push af                       ; Save entity index
    push bc                       ; Save loop counter
    
    ; Check if this entity has a state machine assigned
    ld c, a                       ; C = entity index
    ld b, 0                       ; BC = entity index
    ld hl, entity_sm_ptr_l
    add hl, bc
    ld e, (hl)                    ; E = SM ptr low
    
    ld hl, entity_sm_ptr_h
    add hl, bc
    ld d, (hl)                    ; D = SM ptr high
    
    ; Check if SM pointer is non-zero
    ld a, d
    or e
    jr z, .skip_entity            ; No SM assigned, skip
    
    ; Entity has a state machine - execute it
    pop bc                        ; Restore loop counter
    pop af                        ; Restore entity index
    push af                       ; Save again for continuation
    push bc                       ; Save again for continuation
    
    call SM_Update                ; Execute state machine (A = entity index)
    
.skip_entity:
    pop bc                        ; Restore loop counter
    pop af                        ; Restore entity index
    
    inc a                         ; Next entity
    djnz .sm_loop                 ; Loop for all entities
    
    ret

`,a+=`
    ; ==================================================================
; END OF COMPONENT SYSTEMS
    ; ==================================================================
        `,a}function Lt(e){var l,i,d,p;const t=pe(e).activeEntities,a=2;console.log("🎯 Generating optimized entities.asm..."),console.log(`  - Total entity templates in JSON: ${((l=e.templates)==null?void 0:l.length)||0}`),console.log(`  - Actually instantiated entities: ${t.length}`),console.log(`  - Filtered out: ${(((i=e.templates)==null?void 0:i.length)||0)-t.length} unused templates`);let o=`; ==================================================================
; GAME ENTITIES
; File: entities.asm
; Description: Game entity definitions and behavior
; ==================================================================
;
; INTELLIGENT FILTERING ACTIVE:
;   Entity templates in project: ${((d=e.templates)==null?void 0:d.length)||0}
;   Actually instantiated: ${t.length}
;   Filtered out: ${(((p=e.templates)==null?void 0:p.length)||0)-t.length} unused templates
;
; ==================================================================

`;return t.length>0?(o+=`; ==================================================================
; ENTITY DEFINITIONS
; ==================================================================

`,t.forEach((s,c)=>{var T;const _=s.name.toUpperCase().replace(/[^A-Z0-9]/g,"_"),u=(T=e.templates)==null?void 0:T.find(r=>r.id===s.entityTemplateId),S=he(s,u,e);o+=`; Entity: ${s.name} (instance from template: ${s.entityTemplateId})
ENTITY_${_}_ID EQU ${c}
ENTITY_${_}_COMP_MASK EQU #${S.toString(16).toUpperCase().padStart(2,"0")}  ; Component mask: ${S.toString(2).padStart(8,"0")}b
`,s.entityTemplateId&&(o+=`ENTITY_${_}_TEMPLATE EQU "${s.entityTemplateId}"
`),s.position&&(o+=`ENTITY_${_}_X EQU ${s.position.x}
ENTITY_${_}_Y EQU ${s.position.y}
`),o+=`
`}),o+=`; ==================================================================
; ENTITY MANAGEMENT FUNCTIONS
; ==================================================================

init_entities:
    ; Initialize all active game entities (${t.length} entities)
    
    ; Ensure sprite system is reset whenever entities are initialized
    call init_sprites
    
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
    
`,t.length>0?t.forEach(s=>{const c=s.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");o+=`    call init_${c.toLowerCase()}
`}):o+=`    ; No entities to initialize
`,o+=`    ret

update_entities:
    ; Update all active entities (${t.length} entities)
`,t.length>0?t.forEach(s=>{const c=s.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");o+=`    call update_${c.toLowerCase()}
`}):o+=`    ; No entities to update
`,o+=`    ret

`,t.forEach((s,c)=>{var D,R,v,K;const _=s.name.toUpperCase().replace(/[^A-Z0-9]/g,"_"),u=(D=e.templates)==null?void 0:D.find(w=>w.id===s.entityTemplateId),S=he(s,u,e),T=(S&a)!==0,r=((R=s.position)==null?void 0:R.x)||100,m=((v=s.position)==null?void 0:v.y)||100,h=8,E=8,f=r*h,g=m*E,I=Math.min(f,240),C=Math.min(g,191);(f!==I||g!==C)&&console.warn(`Entity ${s.name} position clamped: (${f},${g}) → (${I},${C})`);const b=[];S&1&&b.push("Position"),S&2&&b.push("Sprite"),S&4&&b.push("Movement"),S&8&&b.push("Collision"),S&16&&b.push("Input"),S&32&&b.push("Behavior"),S&64&&b.push("Health"),S&128&&b.push("Animation");let y=15;if(S&16){const w=u==null?void 0:u.components.find($=>$.definitionId==="comp_cursors"||$.definitionId==="comp_input"||$.definitionId==="comp_player_input");if(w){const $=w.defaultValues||{},ae=((K=s.componentOverrides)==null?void 0:K.comp_cursors)||{},V={...$,...ae};y=0,V.allowUp!==!1&&(y|=1),V.allowDown!==!1&&(y|=2),V.allowLeft!==!1&&(y|=4),V.allowRight!==!1&&(y|=8)}}const N=[];y&1&&N.push("UP"),y&2&&N.push("DOWN"),y&4&&N.push("LEFT"),y&8&&N.push("RIGHT");const A=N.length===4?"All directions":N.join("+");o+=`init_${_.toLowerCase()}:
    ; Initialize ${s.name} at real position from JSON
    ; JSON position: (${r}, ${m}) tiles = (${I}, ${C}) pixels
    ; Template: ${s.entityTemplateId}
    ; Components: ${b.join(", ")}
    ; Direction mask: #${y.toString(16).toUpperCase().padStart(2,"0")} (${y.toString(2).padStart(4,"0")}b) = ${A}

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ld a, ${c}             ; Entity ID
    ld b, #${S.toString(16).toUpperCase().padStart(2,"0")}              ; Component mask (${S.toString(2).padStart(8,"0")}b)
    call create_entity         ; Create with actual components from template

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, ${c}             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), ${I}         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), ${C}         ; Set real Y position from JSON

    ; Set entity screen ID (for multi-screen support)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), ${(()=>{let w=0;return e.screenMaps&&e.screenMaps.forEach(($,ae)=>{$.layers.entities.some(V=>V.id===s.id)&&(w=ae)}),w})()}                 ; Screen ID (calculated from project data)

${T?`    ; Set sprite pattern and color (renderable entity)
    ld hl, sprite_pattern
    add hl, de
    ld (hl), ${c*4}          ; Use entity index * 4 for 16x16 sprites

    ld hl, sprite_color
    add hl, de
    ld (hl), ${c%14+2}                ; Distinct color for debugging
`:`    ; Anchor/reference entity - no sprite allocation needed
`}

    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #${y.toString(16).toUpperCase().padStart(2,"0")}            ; Direction restrictions: ${A}

${T?`    ; Force update sprite attributes immediately

    ; Force update sprite attributes (using correct multi-layer config)
    ld c, ${c}             ; Entity Index
    call force_update_entity_sprite


`:`    ; No sprite to show for this entity
`}
    ret

update_${_.toLowerCase()}:
    ; Update ${s.name} logic with real behavior
    ; Check if entity has input component (player entities)
    ld a, ${c}
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

`})):o+=`; ==================================================================
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

`,o+=`; ==================================================================
; END OF ENTITIES
; ==================================================================
`,o}function Nt(e){if(!e.screenMaps||e.screenMaps.length===0)return`; ==================================================================
; SCREEN MAPS (SKIPPED - NO SCREENS DETECTED)
; File: screens.asm
; ==================================================================

; No screens detected in project - screen system not needed
; This saves ~160 lines of unused screen data

; NOTE: load_game_screen is now generated by gameFlowGenerator.ts
; This prevents symbol redefinition errors

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

`;return e.screenMaps&&e.screenMaps.length>0?(n+=`; ==================================================================
; SCREEN MAP CONSTANTS
; ==================================================================

`,e.screenMaps.forEach((t,a)=>{const o=t.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");n+=`SCREEN_${o}_${a}_ID EQU ${a}
`}),n+=`
; ==================================================================
; SCREEN MAP DATA
; ==================================================================

`,e.screenMaps.forEach(t=>{var a,o;if(t.layers&&t.layers.background){const l=[];if(e.tiles&&e.tiles.length>0){const r={...be[1],assignedTiles:{},charsetRangeStart:128,charsetRangeEnd:255,enabled:!0};let m=128;e.tiles.forEach(E=>{if(E&&E.id){const f=Math.ceil(E.width/8),g=Math.ceil(E.height/8);r.assignedTiles[E.id]={charCode:m,assignedAt:Date.now()},m+=f*g}});const h={id:"global_auto_bank",name:"Global Auto Bank",banks:[r,r,r]};l.push(h),console.log(`✅ Created GLOBAL tile bank with ${Object.keys(r.assignedTiles).length} assigned tiles`)}const i=[];t.activeAreaX,t.activeAreaY,t.activeAreaWidth??t.width,t.activeAreaHeight??t.height;const d=32,p=24;for(let T=0;T<p;T++)for(let r=0;r<d;r++){const m=(a=t.layers.background[T])==null?void 0:a[r];if(!m||!m.tileId)i.push(0);else{let h=0;const E=(o=e.tiles)==null?void 0:o.find(g=>g.id===m.tileId),f=l.length>0?l[0].banks:void 0;if(f&&E){let g=!1;for(const I of f)if((I.enabled??!0)&&I.assignedTiles[m.tileId]){const C=I.assignedTiles[m.tileId].charCode,b=Math.ceil(E.width/Y),y=m.subTileX||0,N=m.subTileY||0;if(h=C+N*b+y,h>=I.charsetRangeStart&&h<=I.charsetRangeEnd){g=!0;break}else h=0}g||(h=0)}else h=0;i.push(h)}}const s=i.filter(T=>T!==255).length,c=new Set(i);console.log(`📊 Generated ${i.length} bytes: ${s} non-FF (${(s/i.length*100).toFixed(1)}%)`),console.log(`🎯 Unique byte values: [${Array.from(c).sort((T,r)=>T-r).join(", ")}]`);const _=[];_.push('; Generated using exact Screen Editor "Download ASM" logic'),_.push("; Byte values represent actual character codes in VRAM");const u=`${t.name}_${e.screenMaps.indexOf(t)}`,S=Ue(u,d,p,i,_,"hex");if(n+=S,t.layers.collision&&e.tiles){const T=t.layers.collision,r=[];T.forEach(h=>{h.forEach(E=>{var f;if(E.tileId){const g=e.tiles.find(C=>C.id===E.tileId),I=((f=g==null?void 0:g.logicalProperties)==null?void 0:f.mapId)||0;r.push(I)}else r.push(0)})});const m=we(u,t.width,t.height,r,"hex");n+=`
${m}`}}else{const l=e.screenMaps.indexOf(t),i=t.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");n+=`SCREEN_${i}_${l}_LAYOUT:
    ; Screen data for ${t.name}
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

`,e.screenMaps.forEach((t,a)=>{const o=t.name.toUpperCase().replace(/[^A-Z0-9]/g,"_"),l=t.backgroundColor!==void 0?t.backgroundColor:1,i=t.borderColor!==void 0?t.borderColor:1,d=t.id?`_${t.id.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";n+=`load_screen_${o.toLowerCase()}${d.toLowerCase()}:
    ; Load ${t.name} screen (BIOS LDIRVM handles timing)
    ; Set VDP colors FIRST (before loading screen data)
    ld a, ${l}           ; Background color
    ld b, ${i}       ; Border color
    call set_screen_colors
    ; Initialize character 0 (empty cells) with background color
    ld a, ${l}           ; Background color for char 0
    call init_char0_color
    ; Now load screen layout
    ld hl, SCREEN_${o}_${a}_LAYOUT
    ld de, NAMETBL
    ld bc, SCREEN_${o}_${a}_SIZE
    call LDIRVM                ; BIOS handles safe VRAM access
    ret

`})):n+=`; ==================================================================
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
`,n+=`
; ==================================================================
; END OF SCREENS
; ==================================================================
`,n}function Dt(e){var _,u,S,T;const n=(u=(_=e.gameFlow)==null?void 0:_.nodes)==null?void 0:u.some(r=>r.type==="SubMenu"),t=(S=e.screenMaps)==null?void 0:S.some(r=>{var m,h;return((m=r.layers)==null?void 0:m.text)||((h=r.textElements)==null?void 0:h.length)>0}),a=(T=e.screenMaps)==null?void 0:T.some(r=>{var m;return((m=r.hudConfiguration)==null?void 0:m.elements)&&r.hudConfiguration.elements.length>0});if(!n&&!t&&!a)return`; ==================================================================
; MSX FONT DATA (SKIPPED - NO TEXT/MENUS/HUD DETECTED)
; File: font.asm
; ==================================================================

; No text, menus, or HUD detected in project - font system not needed
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
`;const o=new Map,l=new Map,i=[{code:32,pattern:[0,0,0,0,0,0,0,0]},{code:43,pattern:[0,16,16,124,16,16,0,0]},{code:45,pattern:[0,0,0,126,0,0,0,0]},{code:124,pattern:[24,24,24,24,24,24,24,24]}];if(i.forEach(r=>{o.set(r.code,r.pattern),l.set(r.code,[240,240,240,240,240,240,240,240])}),e.fonts&&e.fonts.length>0){const r=e.fonts[0],m=r.data.fontData||{},h=r.data.fontColorAttributes||{},E=f=>{if(f.startsWith("rgba(0,0,0,0)"))return 0;const g=f.toUpperCase();return{"RGBA(0,0,0,0)":0,"#000000":1,"#21C842":2,"#5EDC78":3,"#5455ED":4,"#7D76FC":5,"#D4524D":6,"#42EBF5":7,"#FC5554":8,"#FF7978":9,"#D4C154":10,"#E6CE80":11,"#21B03B":12,"#C95BBA":13,"#CCCCCC":14,"#FFFFFF":15}[g]??15};Object.keys(m).forEach(f=>{const g=parseInt(f,10),I=m[g];if(Array.isArray(I)&&I.length===8)if(o.set(g,I),h[g]&&Array.isArray(h[g])){const C=h[g],b=[];for(let y=0;y<8;y++)if(C[y]&&typeof C[y]=="object"){const N=C[y].fg,A=C[y].bg,D=E(N),R=E(A);b.push(D<<4|R)}else b.push(240);l.set(g,b)}else l.set(g,[240,240,240,240,240,240,240,240])})}else{for(let r=48;r<=57;r++)o.set(r,[62,127,115,115,115,127,62,0]);for(let r=65;r<=90;r++)o.set(r,[62,127,99,127,127,99,99,0]);i.forEach(r=>o.set(r.code,r.pattern))}let d=`FONT_PATTERN_DATA:
`,p=`FONT_COLOR_DATA:
`,s=`FONT_CHAR_INDEX:
    DB `;const c=Array.from(o.keys()).filter(r=>r<128).sort((r,m)=>r-m);return c.forEach((r,m)=>{const h=o.get(r),E=l.get(r)||[240,240,240,240,240,240,240,240];d+=`    ; Char ${r} ('${String.fromCharCode(r)}')
`,d+=`    DB ${h.map(f=>"#"+f.toString(16).padStart(2,"0").toUpperCase()).join(", ")}
`,p+=`    ; Char ${r}
`,p+=`    DB ${E.map(f=>"#"+f.toString(16).padStart(2,"0").toUpperCase()).join(", ")}
`,s+=`${r}${m<c.length-1?", ":""}`}),s+=`
FONT_CHAR_COUNT EQU ${c.length}
`,`; ==================================================================
; MSX FONT DATA FOR SCREEN 2 TEXT
; File: font.asm
; Description: Font pattern data generated from project assets
; ==================================================================

; ==================================================================
; FONT PATTERN DATA
; ==================================================================

${d}

; Character index table (for quick lookup)
${s}

; ==================================================================
; FONT LOADING FUNCTIONS
; ==================================================================

load_custom_font:
    ; Load custom font patterns to VRAM Pattern Generator Table
    ; Uses FONT_CHAR_INDEX to map specific characters to their correct VRAM addresses
    ld de, CHRTBL2                ; Bank 0 Base
    call load_font_patterns_to_bank
    ret

load_font_bank0:
    ld de, CHRTBL2                ; Bank 0 Base
    call load_font_patterns_to_bank
    ret

load_font_bank1:
    ld de, CHRTBL2 + #800         ; Bank 1 Base
    call load_font_patterns_to_bank
    ret

load_font_bank2:
    ld de, CHRTBL2 + #1000        ; Bank 2 Base
    call load_font_patterns_to_bank
    ret

load_all_font_banks:
    call load_font_bank0
    call load_font_bank1
    call load_font_bank2
    ret

; Helper: Load font patterns to a specific bank
; Input: DE = Bank Base Address
load_font_patterns_to_bank:
    ld ix, FONT_CHAR_INDEX        ; Pointer to ASCII codes
    ld iy, FONT_PATTERN_DATA      ; Pointer to pattern data
    ld b, FONT_CHAR_COUNT         ; Number of characters to load

.load_loop:
    push bc                       ; Save loop counter
    push de                       ; Save bank base address

    ; Get ASCII code
    ld a, (ix)                    ; A = ASCII code
    inc ix                        ; Next index

    ; Calculate VRAM offset: Base + (ASCII * 8)
    ld l, a
    ld h, 0
    add hl, hl                    ; * 2
    add hl, hl                    ; * 4
    add hl, hl                    ; * 8
    add hl, de                    ; Add Base Address
    ex de, hl                     ; DE = VRAM Destination

    ; Prepare source pointer (IY is in RAM, so use HL)
    push iy
    pop hl                        ; HL = Source Pattern (IY)

    ; Copy 8 bytes
    ld bc, 8
    call LDIRVM                   ; Copy from HL(RAM) to DE(VRAM)

    ; Advance source pointer
    ld bc, 8
    add iy, bc                    ; IY += 8

    pop de                        ; Restore bank base
    pop bc                        ; Restore loop counter
    djnz .load_loop
    ret

; ==================================================================
; FONT COLOR ATTRIBUTES
; ==================================================================

${p}

load_font_colors:
    ld de, CLRTBL2                ; Bank 0 Base
    call load_font_colors_to_bank
    ret

load_font_colors_all_banks:
    ld de, CLRTBL2                ; Bank 0 Base
    call load_font_colors_to_bank

    ld de, CLRTBL2 + #800         ; Bank 1 Base
    call load_font_colors_to_bank

    ld de, CLRTBL2 + #1000        ; Bank 2 Base
    call load_font_colors_to_bank
    ret

; Helper: Load font colors to a specific bank
; Input: DE = Bank Base Address
load_font_colors_to_bank:
    ld ix, FONT_CHAR_INDEX        ; Pointer to ASCII codes
    ld iy, FONT_COLOR_DATA        ; Pointer to color data
    ld b, FONT_CHAR_COUNT         ; Number of characters to load

.load_colors_loop:
    push bc                       ; Save loop counter
    push de                       ; Save bank base address

    ; Get ASCII code
    ld a, (ix)                    ; A = ASCII code
    inc ix                        ; Next index

    ; Calculate VRAM offset: Base + (ASCII * 8)
    ld l, a
    ld h, 0
    add hl, hl                    ; * 2
    add hl, hl                    ; * 4
    add hl, hl                    ; * 8
    add hl, de                    ; Add Base Address
    ex de, hl                     ; DE = VRAM Destination

    ; Prepare source pointer
    push iy
    pop hl                        ; HL = Source Color (IY)

    ; Copy 8 bytes
    ld bc, 8
    call LDIRVM                   ; Copy from HL(RAM) to DE(VRAM)

    ; Advance source pointer
    ld bc, 8
    add iy, bc                    ; IY += 8

    pop de                        ; Restore bank base
    pop bc                        ; Restore loop counter
    djnz .load_colors_loop
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
    ; WRTVRM signature: A = data, HL = VRAM address
    ; A already has character, HL already has VRAM address
    push hl                        ; Save string pointer
    push de                        ; Save VRAM position
    ex de, hl                      ; Swap: DE = string ptr, HL = VRAM address for WRTVRM
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
`}function Rt(e){var o;const n=[],t=new Map;if((o=e.screenMaps)==null||o.forEach(l=>{var d;const i=((d=l.hudConfiguration)==null?void 0:d.elements)||[];i.length>0&&(n.push(...i),t.set(l.id,i))}),n.length===0)return`; ==================================================================
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

`;return a+=Ot(n),a+=Mt(),a+=vt(),a}function Ot(e){let n=`; ------------------------------------------------------------------
; HUD DATA STRUCTURES
; ------------------------------------------------------------------

`;return n+=`HUD_ELEMENT_COUNT   EQU ${e.length}

`,n+=`; HUD Element Data Table
`,n+=`; Format: [Type:1][X:1][Y:1][Width:1][Height:1][Flags:1][TextPtr:2][Visible:1]
`,n+=`hud_element_data:
`,e.forEach((t,a)=>{const o=Pt(t.type),l=t.position.x,i=t.position.y,d=t.visible?1:0,p=`hud_text_${a}`;let s=0,c=1,_=0;const u=t.details||{};(u.border||u.borderColor||u.overallBorderColor)&&(_|=1),t.text?s=t.text.length:u.width?s=Math.ceil(u.width/8):s=10,n+=`    DB ${o}, ${l}, ${i}    ; Element ${a}: ${t.type} at (${l},${i})
`,n+=`    DB ${s}, ${c}, ${_} ; W, H, Flags
`,n+=`    DW ${p}             ; Text pointer
`,n+=`    DB ${d}                ; Visible
`}),n+=`
`,n+=`; HUD Text Strings
`,e.forEach((t,a)=>{const o=t.text||t.name||"",l=`hud_text_${a}`;n+=`${l}:
`,n+=`    DB "${o}", 0
`}),n+=`
`,n}function Mt(e){return`; ------------------------------------------------------------------
; render_hud
; Main HUD rendering function
; Called once per frame to update all HUD elements
; ------------------------------------------------------------------
render_hud:
    push af
    push bc
    push de
    push hl
    push ix

    ld b, HUD_ELEMENT_COUNT
    ld ix, hud_element_data

.render_loop:
    push bc                     ; Save counter

    ; Check visible flag first (offset 8)
    ld a, (ix+8)                ; A = Visible
    or a
    jr z, .skip_element         ; Skip if not visible

    ; Read element fields
    ld d, (ix+1)                ; D = X position (pixels)
    ld e, (ix+2)                ; E = Y position (pixels)
    ld b, (ix+3)                ; B = Width (tiles)
    ld c, (ix+4)                ; C = Height (tiles)
    ld a, (ix+5)                ; A = Flags

    ; Save values we'll need later
    push bc                     ; Save Width, Height
    push de                     ; Save X, Y

    ; ---------------------------------------------------------
    ; 1. Draw Frame (if enabled)
    ; ---------------------------------------------------------
    bit 0, a                    ; Check Bit 0 (Border)
    jr z, .no_border

    ; Convert X,Y pixels to Tile coordinates
    ; TileX = X/8, TileY = Y/8
    ld a, d
    srl a
    srl a
    srl a
    ld d, a                     ; D = Tile X
    
    ld a, e
    srl a
    srl a
    srl a
    ld e, a                     ; E = Tile Y
    
    ; Adjust for padding: Frame is 1 tile larger on all sides
    dec d                       ; Frame X = Content X - 1
    dec e                       ; Frame Y = Content Y - 1
    
    ; Frame Width = Content Width + 2
    inc b
    inc b                       ; Width += 2
    
    inc c
    inc c                       ; Height += 2
    
    call hud_draw_frame
    
    ; Restore original X, Y, Width, Height for text rendering
    pop de                      ; DE = X, Y (pixels)
    pop bc                      ; BC = Width, Height (tiles, not used for text but we pop for stack balance)
    push de                     ; Save X, Y again
    push bc                     ; Save Width, Height again (for stack cleanup)

.no_border:
    ; ---------------------------------------------------------
    ; 2. Draw Text
    ; ---------------------------------------------------------
    pop de                      ; DE = X, Y (pixels)
    pop bc                      ; BC = Width, Height (discard, not needed)

    ; Calculate VRAM address from X,Y pixel coordinates
    ; Screen 2 Name Table = #1800 + (Y/8)*32 + (X/8)
    
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

    ; Get Text Pointer
    ld e, (ix+6)                ; TextPtr Low
    ld d, (ix+7)                ; TextPtr High
    ; DE = Text Pointer

    ; Render text string at HL (VRAM) from DE (string)
    call hud_print_string

.skip_element:
    ; Move to next element
    ld bc, 9                    ; Size of each element entry
    add ix, bc                  ; IX points to next element

    pop bc                      ; Restore counter
    djnz .render_loop

    pop ix
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
    call hud_ascii_to_tile      ; A = tile/char code

    ; Write tile to VRAM Name Table
    ; WRTVRM signature: A = data, HL = VRAM address
    ; A already has character, HL already has VRAM address
    push de                     ; Save string pointer
    call WRTVRM                 ; Write A to VRAM at HL
    pop de                      ; Restore string pointer

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
; Output: A = Tile index (ASCII code for direct mapping)
; ------------------------------------------------------------------
hud_ascii_to_tile:
    ; SIMPLIFIED: Just return the ASCII code directly
    ; Font patterns are loaded at their ASCII positions
    
    ; Validate range (printable ASCII 32-126)
    cp 32
    ret nc              ; If >= 32, it's valid - return as-is
    
    ; Below 32 (control characters) - default to space
    ld a, 32            ; Space character
    ret

; ------------------------------------------------------------------
; hud_draw_frame
; Draw a rectangular frame using font characters
; Input: D = Tile X, E = Tile Y, B = Width (tiles), C = Height (tiles)
; Uses characters: 43 (+), 45 (-), 124 (|)
; ------------------------------------------------------------------
hud_draw_frame:
    push af
    push bc
    push de
    push hl
    
    ; Calculate VRAM Start Address
    ; Addr = #1800 + (E * 32) + D
    ld l, e
    ld h, 0
    add hl, hl          ; * 2
    add hl, hl          ; * 4
    add hl, hl          ; * 8
    add hl, hl          ; * 16
    add hl, hl          ; * 32
    
    ld e, d
    ld d, 0
    add hl, de
    ld de, #1800
    add hl, de          ; HL = Top-Left Corner VRAM Address
    
    ; Draw Top Row
    push hl             ; Save Start Address
    push bc             ; Save Dimensions
    
    ; Top-Left Corner
    ld a, 43            ; '+'
    call WRTVRM
    inc hl
    
    ; Top Edge
    ld a, b
    sub 2               ; Width - 2 corners
    jr z, .skip_top_edge ; Skip if exactly 2 wide (no edge)
    jr c, .skip_top_edge ; Skip if < 2 wide
    ld b, a
.top_edge_loop:
    ld a, 45            ; '-'
    call WRTVRM
    inc hl
    djnz .top_edge_loop
.skip_top_edge:
    
    ; Top-Right Corner
    ld a, 43            ; '+'
    call WRTVRM
    
    pop bc              ; Restore Dimensions
    pop hl              ; Restore Start Address
    
    ; Move to next row
    ld de, 32
    add hl, de
    
    ; Draw Middle Rows (Vertical Edges)
    ld a, c
    sub 2               ; Height - 2 rows
    jr z, .bottom_row   ; Skip if height is small
    jr c, .bottom_row   ; Skip if height is < 2
    ld c, a             ; C = Middle Rows count
    
.middle_row_loop:
    push hl             ; Save Row Start
    push bc             ; Save Counters
    
    ; Left Edge
    ld a, 124           ; '|'
    call WRTVRM
    
    ; Skip Middle (Content Area)
    ld a, b
    dec a               ; Width - 1
    ; Ensure we don't add negative offset if width is 0 (unlikely here but safe)
    ; Actually Width must be at least 2 to have corners, so Width-1 >= 1.
    ld e, a
    ld d, 0
    add hl, de
    
    ; Right Edge
    ld a, 124           ; '|'
    call WRTVRM
    
    pop bc              ; Restore Counters
    pop hl              ; Restore Row Start
    
    ld de, 32
    add hl, de          ; Next Row
    dec c
    jr nz, .middle_row_loop
    
.bottom_row:
    ; Draw Bottom Row
    ; Bottom-Left Corner
    ld a, 43            ; '+'
    call WRTVRM
    inc hl
    
    ; Bottom Edge
    ld a, b
    sub 2               ; Width - 2 corners
    jr z, .skip_bottom_edge
    jr c, .skip_bottom_edge
    ld b, a
.bottom_edge_loop:
    ld a, 45            ; '-'
    call WRTVRM
    inc hl
    djnz .bottom_edge_loop
.skip_bottom_edge:
    
    ; Bottom-Right Corner
    ld a, 43            ; '+'
    call WRTVRM
    
    pop hl
    pop de
    pop bc
    pop af
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

`}function Pt(e){return{[U.Score]:1,[U.HighScore]:2,[U.Lives]:3,[U.EnergyBar]:4,[U.ItemDisplay]:5,[U.SceneName]:6,[U.MiniMap]:7,[U.CoinCounter]:8,[U.BossEnergyBar]:9,[U.PhaseIndicator]:10,[U.AttackAlert]:11,[U.TextBox]:12,[U.NumericField]:13,[U.CustomCounter]:14}[e]||0}function re(e){return e.toLowerCase().replace(/[^a-z0-9]/g,"_")}function se(e){return e.toUpperCase().replace(/[^A-Z0-9]/g,"_")}function xt(e){const n=e.worldmaps||[];if(n.length===0)return`; ==================================================================
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

`,n.forEach((a,o)=>{var d;const l=se(a.name||`world_${o}`),i=a.id||`world_${o}`;t+=`; World: ${a.name||"Unnamed"} (${i})
WORLD_${l}_ID EQU ${o}
WORLD_${l}_SCREEN_COUNT EQU ${((d=a.nodes)==null?void 0:d.length)||0}
`,a.nodes&&a.nodes.length>0&&a.nodes.forEach((p,s)=>{const c=se(p.name||`screen_${s}`);t+=`WORLD_${l}_SCREEN_${c}_ID EQU ${s}
`}),t+=`
`}),t+=`; ==================================================================
; WORLD LOADING FUNCTIONS
; ==================================================================

`,n.forEach(a=>{var u,S;re(a.name||"unnamed");const o=a.id||"unknown",l=a.startScreenNodeId,i=a.nodes||[];if(t+=`; ------------------------------------------------------------------
; Load World: ${a.name||"Unnamed"}
; World ID: ${o}
; Screens: ${i.length}
; Start Screen Node: ${l||"none"}
; ------------------------------------------------------------------
load_world_${re(o)}:
`,i.length===0){t+=`    ; No screens in this world
    ret

`;return}const p=(i.find(T=>T.id===l)||i[0]).screenAssetId;if(!p){t+=`    ; No valid start screen found
    ret

`;return}const s=(u=e.screens)==null?void 0:u.find(T=>T.id===p),c=((S=s==null?void 0:s.name)==null?void 0:S.toUpperCase().replace(/[^A-Z0-9]/g,"_"))||"UNKNOWN",_=p?`_${p.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";t+=`    ; Load start screen: ${(s==null?void 0:s.name)||"unknown"} (${p})
    call load_screen_${c.toLowerCase()}${_.toLowerCase()}

    ; Initialize world state
    ld a, WORLD_${se(a.name||"unnamed")}_ID
    ld (current_world_id), a

    ld a, ${i.findIndex(T=>T.id===l)}
    ld (current_screen_index), a

    ret

`}),t+=`; ==================================================================
; SCREEN TRANSITION FUNCTIONS
; ==================================================================

`,n.forEach(a=>{const o=a.id||"unknown",l=a.nodes||[],i=a.connections||[];if(i.length===0){t+=`; World ${a.name||"Unnamed"} has no screen connections

`;return}t+=`; ------------------------------------------------------------------
; World: ${a.name||"Unnamed"}
; Connections: ${i.length}
; ------------------------------------------------------------------

`,i.forEach((d,p)=>{var r,m;const s=l.find(h=>h.id===d.from||d.fromNodeId),c=l.find(h=>h.id===d.to||d.toNodeId);if(!s||!c){t+=`; Invalid connection ${p}: missing nodes

`;return}s.screenAssetId;const _=c.screenAssetId,u=(r=e.screens)==null?void 0:r.find(h=>h.id===_),S=((m=u==null?void 0:u.name)==null?void 0:m.toUpperCase().replace(/[^A-Z0-9]/g,"_"))||"UNKNOWN",T=_?`_${_.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";t+=`; Transition: ${s.name||"screen"} -> ${c.name||"screen"}
transition_${re(o)}_${p}:
    call load_screen_${S.toLowerCase()}${T.toLowerCase()}
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
`,t}function Z(e){e=e.replace("#","");const n=parseInt(e.substring(0,2),16),t=parseInt(e.substring(2,4),16),a=parseInt(e.substring(4,6),16);if(n<50&&t<50&&a<50)return 1;if(n>200&&t>200&&a>200)return 15;if(n>200&&t<100&&a<100)return 8;if(n<100&&t>200&&a<100)return 3;if(n<100&&t<100&&a>200)return 5;if(n>200&&t>200&&a<100)return 10;if(n>150&&t<100&&a>150)return 13;if(n<100&&t>150&&a>150)return 7;const o=(n+t+a)/3;return o<64?1:o<128?14:15}function Ut(e){const n=e.gameFlow&&e.gameFlow.nodes&&e.gameFlow.nodes.some(a=>a.type==="SubMenu");if(!n)return`; ==================================================================
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

`,e.gameFlow.nodes.filter(i=>i.type==="SubMenu").forEach((i,d)=>{const p=(i.title||i.id).toUpperCase().replace(/[^A-Z0-9]/g,"_");t+=`MENU_${p}_ID EQU ${d}
`}),t+=`
; ==================================================================
; MENU FUNCTIONS
; ==================================================================

`,e.gameFlow.nodes.filter(i=>i.type==="SubMenu").forEach(i=>{var u,S,T,r;(i.title||i.id).toUpperCase().replace(/[^A-Z0-9]/g,"_");const d=i.id.replace(/[^a-zA-Z0-9]/g,"_"),p=((S=(u=i.appearance)==null?void 0:u.colors)==null?void 0:S.background)||"#000000",s=((r=(T=i.appearance)==null?void 0:T.colors)==null?void 0:r.border)||"#FFFFFF",c=Z(p),_=Z(s);t+=`show_menu_${d}:
    ; Display ${i.title||i.id} menu
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
    ld hl, menu_${d}_title
    ld de, NAMETBL + (5 * 32) + 10
    call print_string_screen2

    ; Display menu options
    ; TODO: Add option rendering logic here

    ret

menu_${d}_title:
    db "${(i.title||"Menu").replace(/"/g,'\\"')}", 0

handle_menu_${d}:
    ; Handle ${i.title||i.id} menu input
    call GTSTCK
    ; TODO: Implement input handling
    ret

`}),e.gameFlow.nodes.filter(i=>i.type==="Text").forEach(i=>{var u,S,T,r;const d=i.id.replace(/[^a-zA-Z0-9]/g,"_"),p=((S=(u=i.appearance)==null?void 0:u.colors)==null?void 0:S.background)||"#000000",s=((r=(T=i.appearance)==null?void 0:T.colors)==null?void 0:r.border)||"#FFFFFF",c=Z(p),_=Z(s);t+=`show_text_${d}:
    ; Display ${i.title||i.id} text
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
    ld hl, text_${d}_title
    ld de, NAMETBL + (3 * 32) + 10
    call print_string_screen2

    ; Display text message
    ld hl, text_${d}_message
    ld de, NAMETBL + (6 * 32) + 5
    call print_string_screen2

    ; Wait for user input
    call wait_for_fire
    ret

text_${d}_title:
    db "${(i.title||"Text").replace(/"/g,'\\"')}", 0

text_${d}_message:
    db "${(i.message||"").replace(/"/g,'\\"')}", 0

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
`,t}const wt={[L.SET_POSITION]:1,[L.MOVE_BY]:2,[L.SET_VELOCITY]:3,[L.APPLY_FORCE]:4,[L.CHANGE_SPRITE]:5,[L.PLAY_ANIMATION]:6,[L.SET_ANIMATION_SPEED]:7,[L.TOGGLE_ANIMATION]:8,[L.PLAY_SOUND]:9,[L.PLAY_MUSIC]:10,[L.MUTE_MUSIC]:11,[L.STOP_MUSIC]:12,[L.SET_VARIABLE]:13,[L.INCREMENT_VARIABLE]:14,[L.DECREMENT_VARIABLE]:15,[L.SET_COMPONENT_PROPERTY]:16,[L.WAIT]:17,[L.GOTO_STATE]:18,[L.DESTROY_ENTITY]:19,[L.SPAWN_ENTITY]:20,[L.GET_RANDOM_ENTITY_POSITION]:21,[L.CHANGE_GAME_FLOW_NODE]:22,[L.DECREASE_LIVES]:23,[L.INCREASE_LIVES]:24,[L.RESPAWN_PLAYER]:25,[L.BREAK_TILE]:26,[L.REPLACE_TILE]:27,[L.RND]:28,[L.POINT_AT]:29,[L.ADD_VARIABLES]:30,[L.SUBTRACT_VARIABLES]:31,[L.MULTIPLY_VARIABLES]:32,[L.DIVIDE_VARIABLES]:33,[L.MODULO_VARIABLES]:34,[L.ASSIGN_VARIABLE]:35,END:255},kt={[O.AND]:1,[O.OR]:2,[O.NOT]:3,[O.KEY_PRESSED]:4,[O.KEY_RELEASED]:5,[O.TIME_OUT]:6,[O.CAN_MOVE_DIRECTION]:7,[O.HAS_COLLISION]:8,[O.PATH_CLEAR]:9,[O.ON_WALL_COLLISION]:10,[O.HAS_DEADLY_TILE_COLLISION]:11,[O.ANIMATION_COMPLETE]:12,[O.KEY_AND_MOVEMENT]:13,[O.VARIABLE_COMPARE]:14},Bt={x:0,y:1,vx:2,vy:3},me={"==":0,"!=":1,">":2,"<":3,">=":4,"<=":5},$t=`
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
    ;[Next + 2] = Actions Ptr(Low)
    ;[Next + 3] = Actions Ptr(High)
    
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
    inc hl
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ; HL = Actions Ptr (0 if none)

    ; Execute transition actions if present
    ld a, h
    or l
    jr z, .skip_transition_actions
    push de            ; Save target state
    ld a, b            ; Entity Index
    ex de, hl          ; DE = Actions Ptr
    call SM_ExecuteActions
    ex de, hl          ; HL = Actions Ptr (unused)
    pop de             ; Restore target state

.skip_transition_actions:

    ; Special case: Target State = 0 -> don't change state (Any->Any)
    ld a, d
    or e
    jr z, .no_state_change

    ; Perform State Change
    ld a, b; A = Entity Index
    call SM_ChangeState

    scf             ; Set carry(transition occurred)
    ret

.no_state_change:
    scf             ; Transition occurred (actions already executed)
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
    `,Ft=`
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
    `;function Ht(e){let n=$t+`
`+Ft+`

`;n+=`; ==================================================================
`,n+=`; STATE MACHINE DATA
`,n+=`; ==================================================================

`;for(const t of e)n+=Vt(t);return n}function Vt(e){let n=`; State Machine: ${e.name} (${e.id}) 
`;const t=e.name.replace(/[^a-zA-Z0-9]/g,"_"),a=o=>{if(!o)return!1;const l=o.trim().toLowerCase();return l==="any"||l==="__any_state__"||l==="any state (*)"};for(const o of e.states){const l=`SM_${t}_${o.id.replace(/[^a-zA-Z0-9]/g,"_")}`,i=`${l}_OnEnter`,d=`${l}_OnExit`,p=`${l}_Transitions`;n+=`${l}: 
`,n+=`    DB 0; ID(unused) 
`,n+=`    DW ${o.onEnter&&o.onEnter.length>0?i:0} 
`,n+=`    DW ${o.onExit&&o.onExit.length>0?d:0} 
`;const s=e.transitions.filter(c=>c.fromStateId===o.id||a(c.fromStateId));if(n+=`    DW ${s.length>0?p:0} 
`,o.onEnter&&o.onEnter.length>0){n+=`${i}: 
`;for(const c of o.onEnter)n+=de(c,e.name);n+=`    DB 0xFF; END
`}if(o.onExit&&o.onExit.length>0){n+=`${d}: 
`;for(const c of o.onExit)n+=de(c,e.name);n+=`    DB 0xFF; END
`}s.length>0&&(n+=`${p}: 
`,n+=`    DB ${s.length}; Count
`,s.forEach((c,_)=>{const S=a(c.fromStateId)&&a(c.toStateId)?"0":`SM_${t}_${c.toStateId.replace(/[^a-zA-Z0-9]/g,"_")}`,T=c.actions&&c.actions.length>0?`${p}_Actions_${_}`:"0";if(c.conditions?n+=fe(c.conditions):n+=`    DB 0; Empty Condition(Always True) 
`,n+=`    DW ${S} 
`,n+=`    DW ${T} 
`,T!=="0"){n+=`${T}: 
`;for(const r of c.actions||[])n+=de(r,e.name);n+=`    DB 0xFF; END
`}})),n+=`
`}return n}function P(e){if(typeof e=="number")return e.toString();if(typeof e=="boolean")return e?"1":"0";if(typeof e=="string"){if(e==="true")return"1";if(e==="false")return"0";const n=parseInt(e,10);return isNaN(n)?"0":n.toString()}return"0"}function de(e,n=""){const t=wt[e.type];if(!t)return`; Unknown Action: ${e.type} 
`;let a=`    DB ${t}; ${e.type} 
`;switch(e.type){case L.SET_POSITION:case L.MOVE_BY:case L.SET_VELOCITY:case L.APPLY_FORCE:a+=`    DB ${P(e.params.x)}, ${P(e.params.y)} 
`;break;case L.CHANGE_SPRITE:a+=`    DB ${P(e.params.spriteId)} 
`;break;case L.PLAY_ANIMATION:a+=`    DB ${P(e.params.animationName)} 
`;break;case L.SET_ANIMATION_SPEED:a+=`    DB ${P(e.params.speed)} 
`;break;case L.TOGGLE_ANIMATION:a+=`    DB ${P(e.params.playing)} 
`;break;case L.PLAY_SOUND:a+=`    DB ${P(e.params.soundId)} 
`;break;case L.SET_VARIABLE:case L.INCREMENT_VARIABLE:case L.DECREMENT_VARIABLE:a+=`    DB ${P(e.params.variableId)}, ${P(e.params.value)} 
`;break;case L.WAIT:a+=`    DB ${P(e.params.duration)} 
`;break;case L.GOTO_STATE:if(n&&e.params.stateId){const o=`SM_${n.replace(/[^a-zA-Z0-9]/g,"_")}_${e.params.stateId.replace(/[^a-zA-Z0-9]/g,"_")} `;a+=`    DW ${o} 
`}else a+=`    DW 0; Invalid GOTO target
`;break;case L.SPAWN_ENTITY:a+=`    DB ${P(e.params.entityId)}, ${P(e.params.x)}, ${P(e.params.y)} 
`;break;case L.DESTROY_ENTITY:a+=`    DB 0
`;break;default:a+=`    ; Params not implemented for ${e.type}
`;break}return a}function fe(e){var a,o,l,i,d,p,s,c,_,u;const n=kt[e.type];if(!n)return`; Unknown Condition: ${e.type} 
`;let t=`    DB ${n}; ${e.type} 
`;switch(e.type){case O.KEY_PRESSED:case O.KEY_RELEASED:t+=`    DB ${P((a=e.params)==null?void 0:a.key)}; Key Code
`;break;case O.TIME_OUT:t+=`    DB ${P((o=e.params)==null?void 0:o.duration)} 
`;break;case O.AND:case O.OR:if(e.conditions){t+=`    DB ${e.conditions.length} 
`;for(const S of e.conditions)t+=fe(S)}else t+=`    DB 0
`;break;case O.VARIABLE_COMPARE:{const S=((l=e.params)==null?void 0:l.variable)||"x",T=Bt[S];if(T===void 0)console.warn(`[State Machine Generator] Unknown variable "${S}" in VARIABLE_COMPARE. Using x (ID 0) as fallback.`),t+=`    DB 0, ${me[((i=e.params)==null?void 0:i.operator)||"=="]||0}, ${P(((d=e.params)==null?void 0:d.value)||0)}; FALLBACK: unknown var "${S}" -> x ${((p=e.params)==null?void 0:p.operator)||"=="} ${((s=e.params)==null?void 0:s.value)||0}
`;else{const r=me[((c=e.params)==null?void 0:c.operator)||"=="]||0,m=((_=e.params)==null?void 0:_.value)||0;t+=`    DB ${T}, ${r}, ${P(m)}; ${S} ${((u=e.params)==null?void 0:u.operator)||"=="} ${m}
`}break}}return t}function Gt(e,n,t={}){if(console.log("🔧 Generating modular ASM files..."),!e)throw console.error("❌ projectName is required"),new Error("projectName is required");if(!n)throw console.error("❌ assets is undefined or null"),new Error("assets array is required");if(!Array.isArray(n))throw console.error("❌ assets is not an array"),new Error("assets must be an array");console.log(`📊 Project: ${e}, Assets: ${n.length}, Config:`,t);let a;try{a=ce(e,n),console.log(`🔍 Analysis complete: ${a.sprites.length} sprites, ${a.tiles.length} tiles`)}catch(l){console.error("❌ Error analyzing project:",l),a={hasSprites:!1,hasTiles:!1,hasScreens:!1,hasEntities:!1,hasComponents:!1,hasGameFlow:!1,hasMenus:!1,hasFonts:!1,hasECS:!1,hasMultipleScreens:!1,hasAnimations:!1,hasCollisions:!1,hasMenuSystem:!1,components:[],templates:[],entities:[],sprites:[],tiles:[],screens:[],screenMaps:[],projectName:e,customStates:[],stateMachines:[],globalVariables:[]},console.log("🔄 Using fallback empty analysis")}const o={"bios.asm":Qe(),"constants.asm":Ze(a),"variables.asm":Je(a),"header.asm":qe(e,a),"patterns.asm":lt(a),"colors.asm":rt(a),"components.asm":yt(a),"entities.asm":Lt(a),"worlds.asm":xt(a),"screens.asm":Nt(a),"sprites.asm":_t(a),"font.asm":Dt(a),"hud.asm":Rt(a),"menus.asm":Ut(a),"statemachine.asm":a.stateMachines?Ht(a.stateMachines):`; No State Machines
`,"gameflow.asm":tt(a),"main.asm":it(e,a),"unitedFiles.asm":""};return t.generateUnified&&(o["unitedFiles.asm"]=st(o,e,a)),console.log("✅ Modular ASM files generated successfully!"),console.log(`📊 Generated ${Object.keys(o).filter(l=>o[l]).length} files`),o}const Qn=Object.freeze(Object.defineProperty({__proto__:null,generateModularASM:Gt},Symbol.toStringTag,{value:"Module"}));export{Cn as $,$n as A,Y as B,Fn as C,Kt as D,Zt as E,Ue as F,we as G,U as H,_n as I,pn as J,xe as K,Yn as L,Qt as M,Nn as N,ee as O,jt as P,Hn as Q,Gn as R,ne as S,Vn as T,ge as U,Sn as V,hn as W,un as X,mn as Y,an as Z,An as _,on as a,gn as a0,En as a1,Tn as a2,In as a3,fn as a4,bn as a5,H as a6,J as a7,sn as a8,zn as a9,qt as aa,Jt as ab,ie as ac,jn as ad,Ln as ae,ke as af,O as ag,L as ah,Xt as ai,ce as aj,Xn as ak,Dn as al,tn as am,be as an,rn as ao,yn as ap,en as aq,Rn as ar,Qn as as,nn as b,ln as c,j as d,Mn as e,dn as f,On as g,cn as h,Le as i,Ne as j,x as k,Wt as l,zt as m,q as n,Pn as o,xn as p,Un as q,wn as r,vn as s,kn as t,X as u,Q as v,Oe as w,Bn as x,Yt as y,Wn as z};
