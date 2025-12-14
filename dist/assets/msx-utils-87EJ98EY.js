const Jt=[16,24,32];var x=(t=>(t.Score="Score",t.HighScore="HighScore",t.Lives="Lives",t.EnergyBar="EnergyBar",t.ItemDisplay="ItemDisplay",t.SceneName="SceneName",t.MiniMap="MiniMap",t.CoinCounter="CoinCounter",t.BossEnergyBar="BossEnergyBar",t.PhaseIndicator="PhaseIndicator",t.AttackAlert="AttackAlert",t.TextBox="TextBox",t.NumericField="NumericField",t.CustomCounter="CustomCounter",t))(x||{});const Ae={water:{bit:0,label:"Water Effect",maskValue:1,color:"rgba(50, 100, 200, 0.4)"},customGravity:{bit:1,label:"Custom Gravity",maskValue:2,color:"rgba(150, 50, 200, 0.4)"},icePhysics:{bit:2,label:"Ice Physics",maskValue:4,color:"rgba(100, 200, 255, 0.4)"},spriteConceal:{bit:3,label:"Sprite Concealment",maskValue:8,color:"rgba(100, 100, 100, 0.4)"}};var ge=(t=>(t.None="None",t.Tile="Tile",t.Sprite="Sprite",t.Screen="Screen",t.Code="Code",t.Attributes="Attributes",t.Sound="Sound",t.Platformer="Platformer",t.WorldMap="WorldMap",t.Track="Track",t.HUD="HUD",t.TileBanks="TileBanks",t.Font="Font",t.HelpDocs="HelpDocs",t.BehaviorEditor="BehaviorEditor",t.ComponentDefinitionEditor="ComponentDefinitionEditor",t.EntityTemplateEditor="EntityTemplateEditor",t.Boss="Boss",t.WorldView="WorldView",t.GameFlow="GameFlow",t.MainMenu="MainMenu",t.StateMachine="StateMachine",t.GlobalVariables="GlobalVariables",t.Palette="Palette",t))(ge||{});const qt=[1,3,5,7],ea=[{id:0,name:"NoSolid (Passable)",isSolid:!1},{id:1,name:"Solid (Wall/Ground)",isSolid:!0},{id:2,name:"Platform (Top-Solid)",isSolid:!0},{id:3,name:"Slope (Solid)",isSolid:!0}],ta={isBreakable:{bit:0,label:"Breakable"},isMovable:{bit:1,label:"Movable"},causesDamage:{bit:2,label:"Deadly"},isInteractiveSwitch:{bit:3,label:"Interactable"}},aa="0.266",j=[{name:"Transparent",hex:"rgba(0,0,0,0)"},{name:"Black",hex:"#000000"},{name:"Medium Green",hex:"#3EB847"},{name:"Light Green",hex:"#74D07D"},{name:"Dark Blue",hex:"#2F2FC1"},{name:"Light Blue",hex:"#5858FC"},{name:"Dark Red",hex:"#B63125"},{name:"Cyan",hex:"#68D2DA"},{name:"Medium Red",hex:"#FC584A"},{name:"Light Red",hex:"#FF8E81"},{name:"Dark Yellow",hex:"#C0BF3B"},{name:"Light Yellow",hex:"#E7E474"},{name:"Dark Green",hex:"#309337"},{name:"Magenta",hex:"#B640C8"},{name:"Gray",hex:"#999999"},{name:"White",hex:"#FFFFFF"}],U=[{name:"Transparent (Backdrop)",hex:"rgba(0,0,0,0)",index:0},{name:"Black",hex:"#000000",index:1},{name:"Medium Green",hex:"#21C842",index:2},{name:"Light Green",hex:"#5EDC78",index:3},{name:"Dark Blue",hex:"#5455ED",index:4},{name:"Light Blue",hex:"#7D76FC",index:5},{name:"Dark Red",hex:"#D4524D",index:6},{name:"Cyan",hex:"#42EBF5",index:7},{name:"Medium Red",hex:"#FC5554",index:8},{name:"Light Red",hex:"#FF7978",index:9},{name:"Dark Yellow",hex:"#D4C154",index:10},{name:"Light Yellow",hex:"#E6CE80",index:11},{name:"Dark Green",hex:"#21B03B",index:12},{name:"Magenta",hex:"#C95BBA",index:13},{name:"Gray",hex:"#CCCCCC",index:14},{name:"White",hex:"#FFFFFF",index:15}],k=[0,36,73,109,146,182,219,255],W=t=>t.toString(16).padStart(2,"0").toUpperCase(),na=(()=>{const t=[];for(let e=0;e<k.length;e++)for(let a=0;a<k.length;a++)for(let n=0;n<k.length;n++){const o=e<<6|a<<3|n;t.push({index:o,hex:`#${W(k[e])}${W(k[a])}${W(k[n])}`,rLevel:e,gLevel:a,bLevel:n})}return t})(),oe=t=>{let e=0,a=1/0;return k.forEach((n,o)=>{const l=Math.abs(n-t);l<a&&(a=l,e=o)}),e},Ie=t=>!t||!t.startsWith("#")||t.length!==7?"#000000":t.toUpperCase(),Ce=t=>{const e=Ie(t),a=parseInt(e.slice(1,3),16),n=parseInt(e.slice(3,5),16),o=parseInt(e.slice(5,7),16),l=oe(a),i=oe(n),d=oe(o),p=`#${W(k[l])}${W(k[i])}${W(k[d])}`,s=l<<6|i<<3|d;return{hex:p,masterIndex:s}},oa=j.map((t,e)=>{if(e===0)return{slotIndex:0,masterIndex:-1,hex:"rgba(0,0,0,0)"};const a=Ce(t.hex);return{slotIndex:e,masterIndex:a.masterIndex,hex:a.hex}}),ia=[8,16,24,32],la=16,ra=16,sa=16,H=32,J=24,Y=8,V=255,da="SCREEN 2 (Graphics I)",ca=["ADC","ADD","AND","BIT","CALL","CCF","CP","CPD","CPDR","CPI","CPIR","CPL","DAA","DEC","DI","DJNZ","EI","EX","EXX","HALT","IM","IN","INC","IND","INDR","INI","INIR","JP","JR","LD","LDD","LDDR","LDI","LDIR","NEG","NOP","OR","OTDR","OTIR","OUT","OUTD","OUTI","POP","PUSH","RES","RET","RETI","RETN","RL","RLA","RLC","RLCA","RLD","RR","RRA","RRC","RRCA","RRD","RST","SBC","SCF","SET","SLA","SLL","SRA","SRL","SUB","XOR"],pa=["A","F","B","C","D","E","H","L","AF","BC","DE","HL","IXH","IXL","IYH","IYL","IX","IY","SP","PC","I","R","AF'"],_a=["NZ","Z","NC","C","PO","PE","P","M"],ua=[".ORG","ORG","END",".END",".EQU","EQU",".DB","DB",".BYTE","BYTE","DEFB",".DW","DW",".WORD","WORD","DEFW",".DS","DS",".BLOCK","BLOCK","DEFS",".DEFINE","DEFINE",".MACRO","MACRO",".ENDM","ENDM",".IF","IF",".ENDIF","ENDIF",".ELSE","ELSE",".INCLUDE","INCLUDE",".DEFM","DEFM",".ZILOG",".PHASE",".REPT",".ENDR",".SEARCH",".RANDOM",".ROM",".MEGAROM",".BASIC",".CAS",".WAV",".MSXDOS"],ha=[{id:"pac_man_collection",name:"Pac-Man Tile Collection",code:`; Pac-Man Style Tile Collection System for MSX
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
POWER_MODE:         DB 0       ; Power-up mode active flag`}],ma=[],ae=8,Q=15,X=1;var me;const Ea=((me=U.find(t=>t.index===Q))==null?void 0:me.hex)||U[15].hex;var Ee;const Ta=((Ee=U.find(t=>t.index===X))==null?void 0:Ee.hex)||U[1].hex,q=new Map(U.map(t=>[t.hex,t])),Sa=new Map(U.map(t=>[t.index,t])),fa=U[1],Aa=32,ga=125,Ia=6,Ca=31,ba=15,ya=["A","B","C"],Na=["1","2","3","4","5"],La=["C-","C#","D-","D#","E-","F-","F#","G-","G#","A-","A#","B-"],Da=[0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,7,7,6,6,5,5,4,4,3,3,2,2,1,1,0,0],Ra=32,Oa={q:{noteNameIndex:0,baseOctave:5},w:{noteNameIndex:1,baseOctave:5},e:{noteNameIndex:2,baseOctave:5},r:{noteNameIndex:3,baseOctave:5},t:{noteNameIndex:4,baseOctave:5},y:{noteNameIndex:5,baseOctave:5},u:{noteNameIndex:6,baseOctave:5},i:{noteNameIndex:7,baseOctave:5},o:{noteNameIndex:8,baseOctave:5},p:{noteNameIndex:9,baseOctave:5},"[":{noteNameIndex:10,baseOctave:5},"]":{noteNameIndex:11,baseOctave:5},a:{noteNameIndex:0,baseOctave:4},s:{noteNameIndex:1,baseOctave:4},d:{noteNameIndex:2,baseOctave:4},f:{noteNameIndex:3,baseOctave:4},g:{noteNameIndex:4,baseOctave:4},h:{noteNameIndex:5,baseOctave:4},j:{noteNameIndex:6,baseOctave:4},k:{noteNameIndex:7,baseOctave:4},l:{noteNameIndex:8,baseOctave:4},ñ:{noteNameIndex:9,baseOctave:4},";":{noteNameIndex:9,baseOctave:4},"'":{noteNameIndex:10,baseOctave:4},z:{noteNameIndex:0,baseOctave:3},x:{noteNameIndex:1,baseOctave:3},c:{noteNameIndex:2,baseOctave:3},v:{noteNameIndex:3,baseOctave:3},b:{noteNameIndex:4,baseOctave:3},n:{noteNameIndex:5,baseOctave:3},m:{noteNameIndex:6,baseOctave:3},",":{noteNameIndex:7,baseOctave:3},".":{noteNameIndex:8,baseOctave:3},2:{noteNameIndex:1,baseOctave:5},3:{noteNameIndex:3,baseOctave:5},5:{noteNameIndex:6,baseOctave:5},6:{noteNameIndex:8,baseOctave:5},7:{noteNameIndex:10,baseOctave:5}},Ma={min:-2,max:2},Pa=[{id:1,name:"Piano",volumeEnvelope:[15,14,13,11,9,7,5,3,2,1,0],toneEnvelope:[0],volumeLoop:255,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:0},{id:2,name:"Electric Bass",volumeEnvelope:[15,14,13,12,11,10,9,8],toneEnvelope:[0],volumeLoop:3,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:12},{id:3,name:"Lead Vibrato",volumeEnvelope:[0,5,10,15,15,15,14,13,12],toneEnvelope:[0,1,2,1,0,-1,-2,-1],volumeLoop:4,toneLoop:0,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:13},{id:4,name:"Strings Pad",volumeEnvelope:[0,2,4,6,8,10,12,14,15,15,15],toneEnvelope:[0,0,1,1,0,0,-1,-1],volumeLoop:8,toneLoop:0,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:13},{id:5,name:"Kick Drum",volumeEnvelope:[15,13,10,7,4,2,0],toneEnvelope:[12,10,8,6,4,2,0],volumeLoop:255,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:0},{id:6,name:"Snare Drum",volumeEnvelope:[15,12,9,6,3,1,0],toneEnvelope:[0],volumeLoop:255,toneLoop:255,ayToneEnabled:!1,ayNoiseEnabled:!0,ayEnvelopeShape:0},{id:7,name:"Hi-Hat",volumeEnvelope:[12,10,8,6,4,2,0],toneEnvelope:[0],volumeLoop:255,toneLoop:255,ayToneEnabled:!1,ayNoiseEnabled:!0,ayEnvelopeShape:0},{id:8,name:"Arpeggio",volumeEnvelope:[15,15,14,14,13,13,12,12],toneEnvelope:[0,4,7,12,7,4,0],volumeLoop:0,toneLoop:0,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:10},{id:9,name:"Organ",volumeEnvelope:[15,15,15,15,15],toneEnvelope:[0],volumeLoop:0,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:13},{id:10,name:"Bell",volumeEnvelope:[15,14,12,10,8,6,4,3,2,1,0],toneEnvelope:[0,12,0],volumeLoop:255,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:0}],be=[{id:"bank_0",name:"Bank 0 - HUD/Fonts",enabled:!0,vramPatternStart:0,vramColorStart:8192,screenZone:{x:0,y:0,width:H,height:8},charsetRangeStart:0,charsetRangeEnd:255,defaultFgColorIndex:15,defaultBgColorIndex:4,isLocked:!1,assignedTiles:{}},{id:"bank_1",name:"Bank 1 - Game Tileset",enabled:!0,vramPatternStart:2048,vramColorStart:10240,screenZone:{x:0,y:8,width:H,height:8},charsetRangeStart:0,charsetRangeEnd:255,defaultFgColorIndex:2,defaultBgColorIndex:1,isLocked:!1,assignedTiles:{}},{id:"bank_2",name:"Bank 2 - Background/Status",enabled:!0,vramPatternStart:4096,vramColorStart:12288,screenZone:{x:0,y:16,width:H,height:8},charsetRangeStart:0,charsetRangeEnd:255,defaultFgColorIndex:11,defaultBgColorIndex:6,isLocked:!1,assignedTiles:{}}],va={isEnabled:!0,options:[{id:"start",label:"INICIAR PARTIDA",enabled:!0},{id:"continue",label:"CONTINUAR",enabled:!0},{id:"settings",label:"AJUSTES",enabled:!0},{id:"help",label:"AYUDA",enabled:!1}],keyMapping:{up:"ArrowUp",down:"ArrowDown",left:"ArrowLeft",right:"ArrowRight",fire1:" ",fire2:"m"},settings:{volume:12},continueScreen:{title:"CONTINUAR PARTIDA",prompt:"INTRODUCE TU CODIGO"},introScreen:{text:`EN EL ANO 2084, LA CORPORACION CYBERNETICA DOMINA EL MUNDO...

SOLO UN HEROE PUEDE DETENERLOS.`,backgroundAssetId:null},menuScreenAssetId:null,cursorSpriteAssetId:null,menuColors:{text:U[15].hex,background:U[4].hex,highlightText:U[11].hex,highlightBackground:U[5].hex,border:U[15].hex}},Ua=Ae,xa="HELP_DOCS_SYSTEM_ASSET",wa=50,ie=[{name:"Goal",asmName:"global_var_goal",constantPrefix:"GOAL_",type:"byte",description:"Current objective status",category:"objective",values:[{label:"Failure",value:0,asmConstant:"GOAL_FAILURE"},{label:"Completed",value:1,asmConstant:"GOAL_COMPLETED"},{label:"Partial",value:2,asmConstant:"GOAL_PARTIAL"}]},{name:"MissionStatus",asmName:"global_var_mission_status",constantPrefix:"MISSION_",type:"byte",description:"Current mission state",category:"objective",values:[{label:"NotStarted",value:0,asmConstant:"MISSION_NOT_STARTED"},{label:"Active",value:1,asmConstant:"MISSION_ACTIVE"},{label:"Completed",value:2,asmConstant:"MISSION_COMPLETED"},{label:"Failed",value:3,asmConstant:"MISSION_FAILED"}]},{name:"LevelCompleted",asmName:"global_var_level_completed",constantPrefix:"BOOL_",type:"byte",description:"Level completion flag",category:"objective",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"BossDefeated",asmName:"global_var_boss_defeated",constantPrefix:"BOOL_",type:"byte",description:"Boss defeated flag",category:"objective",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"AllItemsCollected",asmName:"global_var_all_items_collected",constantPrefix:"BOOL_",type:"byte",description:"All items collected flag",category:"objective",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"Score",asmName:"global_var_score",constantPrefix:"SCORE_",type:"word",description:"Current player score (0-65535)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"HiScore",asmName:"global_var_hi_score",constantPrefix:"HISCORE_",type:"word",description:"High score record (0-65535)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"ComboMultiplier",asmName:"global_var_combo_multiplier",constantPrefix:"COMBO_",type:"byte",description:"Combo multiplier (1x, 2x, 3x...)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"Coins",asmName:"global_var_coins",constantPrefix:"COINS_",type:"byte",description:"Coins collected (0-255)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"Gems",asmName:"global_var_gems",constantPrefix:"GEMS_",type:"byte",description:"Gems collected (0-255)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"Lives",asmName:"global_var_lives",constantPrefix:"LIVES_",type:"byte",description:"Remaining lives (0-255)",category:"player",values:[{label:"Custom Value",value:"number"}]},{name:"Health",asmName:"global_var_health",constantPrefix:"HEALTH_",type:"byte",description:"Current health (0-255)",category:"player",values:[{label:"Custom Value",value:"number"}]},{name:"Energy",asmName:"global_var_energy",constantPrefix:"ENERGY_",type:"byte",description:"Current energy/mana (0-255)",category:"player",values:[{label:"Custom Value",value:"number"}]},{name:"Shield",asmName:"global_var_shield",constantPrefix:"BOOL_",type:"byte",description:"Shield active flag",category:"player",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"HasKey",asmName:"global_var_has_key",constantPrefix:"BOOL_",type:"byte",description:"Has key item",category:"inventory",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"HasSword",asmName:"global_var_has_sword",constantPrefix:"BOOL_",type:"byte",description:"Has sword item",category:"inventory",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"HasMap",asmName:"global_var_has_map",constantPrefix:"BOOL_",type:"byte",description:"Has map item",category:"inventory",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"ItemCount",asmName:"global_var_item_count",constantPrefix:"ITEMS_",type:"byte",description:"Special items collected (0-255)",category:"inventory",values:[{label:"Custom Value",value:"number"}]},{name:"PowerUpActive",asmName:"global_var_powerup_active",constantPrefix:"POWERUP_",type:"byte",description:"Active power-up type",category:"inventory",values:[{label:"None",value:0,asmConstant:"POWERUP_NONE"},{label:"Speed",value:1,asmConstant:"POWERUP_SPEED"},{label:"Jump",value:2,asmConstant:"POWERUP_JUMP"},{label:"Invincible",value:3,asmConstant:"POWERUP_INVINCIBLE"}]},{name:"CurrentWorld",asmName:"global_var_current_world",constantPrefix:"WORLD_",type:"byte",description:"Current world number (1-8)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"CurrentLevel",asmName:"global_var_current_level",constantPrefix:"LEVEL_",type:"byte",description:"Current level number (0-255)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"CheckpointReached",asmName:"global_var_checkpoint",constantPrefix:"CHECKPOINT_",type:"byte",description:"Checkpoint reached (0-255)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"SecretFound",asmName:"global_var_secret_found",constantPrefix:"BOOL_",type:"byte",description:"Secret area found flag",category:"progress",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"DoorsUnlocked",asmName:"global_var_doors_unlocked",constantPrefix:"DOORS_",type:"byte",description:"Doors unlocked bitmask (0-255)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"TimeRemaining",asmName:"global_var_time_remaining",constantPrefix:"TIME_",type:"word",description:"Time remaining in seconds (0-65535)",category:"time",values:[{label:"Custom Value",value:"number"}]},{name:"TimeLimitActive",asmName:"global_var_time_limit_active",constantPrefix:"BOOL_",type:"byte",description:"Time limit active flag",category:"time",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"DayNightCycle",asmName:"global_var_day_night_cycle",constantPrefix:"TIME_",type:"byte",description:"Day/night cycle state (0-23)",category:"time",values:[{label:"Custom Value",value:"number"}]},{name:"DifficultyLevel",asmName:"global_var_difficulty",constantPrefix:"DIFFICULTY_",type:"byte",description:"Game difficulty level",category:"difficulty",values:[{label:"Easy",value:0,asmConstant:"DIFFICULTY_EASY"},{label:"Normal",value:1,asmConstant:"DIFFICULTY_NORMAL"},{label:"Hard",value:2,asmConstant:"DIFFICULTY_HARD"},{label:"Expert",value:3,asmConstant:"DIFFICULTY_EXPERT"}]},{name:"EnemiesDefeated",asmName:"global_var_enemies_defeated",constantPrefix:"ENEMIES_",type:"word",description:"Enemies defeated count (0-65535)",category:"special",values:[{label:"Custom Value",value:"number"}]},{name:"PerfectRun",asmName:"global_var_perfect_run",constantPrefix:"BOOL_",type:"byte",description:"Perfect run (no damage) flag",category:"special",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]}],M=8,ye=t=>{let e=t.toString(16).toUpperCase();return e.length===1&&(e="0"+e),e},ka=(t,e,a)=>{var c,_;if(!t.lineAttributes)return`;; ERROR: Tile ${e} is missing line attributes required for SCREEN 2 export.
`;const n=e.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let o=`;; Tile: ${e} (${t.width}x${t.height})
`;o+=`;; Structure: ${t.width/M}x${t.height/M} character blocks (8x8 pixels each)
`,o+=`;; Data format: ${a.toUpperCase()}

`;const l=t.width/M,i=t.height/M,d=m=>a==="hex"?`$${ye(m)}`:m.toString(10),p=[],s=[];for(let m=0;m<i;m++)for(let S=0;S<l;S++){const T=`;; Character Block (${S}, ${m}) for ${n}`,r=[];for(let f=0;f<M;f++){const g=m*M+f;let I=0;if(t.lineAttributes[g]&&t.lineAttributes[g][S]){const C=t.lineAttributes[g][S].fg;for(let b=0;b<M;b++){const y=S*M+b;t.data[g]&&t.data[g][y]!==void 0&&t.data[g][y]===C&&(I|=1<<7-b)}}r.push(I)}const h=r.map(d).join(",");p.push({comment:`${T} - PATTERN Data (8 bytes):`,dataString:`DB ${h}`});const u=[];for(let f=0;f<M;f++){const g=m*M+f;let I=Q<<4|X;if(t.lineAttributes[g]&&t.lineAttributes[g][S]){const C=t.lineAttributes[g][S],b=((c=q.get(C.fg))==null?void 0:c.index)??Q,y=((_=q.get(C.bg))==null?void 0:_.index)??X;I=b<<4|y}u.push(I)}const E=u.map(d).join(",");s.push({comment:`${T} - COLOR Attribute Data (8 bytes - FG|BG):`,dataString:`DB ${E}`})}return o+=`;; --- PATTERN DATA ---
`,p.length>0?(o+=`${n}_PATTERN_DATA:
`,p.forEach(m=>{o+=`${m.comment}
`,o+=`    ${m.dataString}
`})):o+=`;; No pattern data generated.
`,o+=`
`,o+=`;; --- COLOR ATTRIBUTE DATA ---
`,s.length>0?(o+=`${n}_COLOR_DATA:
`,s.forEach(m=>{o+=`${m.comment}
`,o+=`    ${m.dataString}
`})):o+=`;; No color attribute data generated.
`,o+=`
;; End of Tile Data for ${n}
`,o},Ba=(t,e,a,n)=>{const o=Math.max(1,t/ae);return Array(e).fill(null).map(()=>Array(o).fill(null).map(()=>({fg:a,bg:n})))},Ne=(t,e)=>{var i,d,p,s;const a=[],n=t.width/M,o=t.height/M,l=e==="SCREEN 2 (Graphics I)";for(let c=0;c<o;c++)for(let _=0;_<n;_++)for(let m=0;m<M;m++){const S=c*M+m;let T=0,r;l&&t.lineAttributes&&t.lineAttributes[S]&&t.lineAttributes[S][_]&&(r=t.lineAttributes[S][_].fg);for(let h=0;h<M;h++){const u=_*M+h,E=(i=t.data[S])==null?void 0:i[u];if(E!==void 0){let f=!1;l&&r?f=E===r:l||(f=E!==j[0].hex&&E!==((s=(p=(d=t.lineAttributes)==null?void 0:d[0])==null?void 0:p[0])==null?void 0:s.bg)),f&&(T|=1<<7-h)}}a.push(T)}return new Uint8Array(a)},z=(t,e)=>{var l,i;const a=t.length;if(a===0)return[];const n=((l=t[0])==null?void 0:l.length)||0;if(n===0)return[[]];const o=t.map(d=>[...d]);for(let d=0;d<a;d++)for(let p=0;p<n;p++){const s=Math.floor(p/ae),c=(i=e[d])==null?void 0:i[s],_=o[d][p];c&&_!==c.fg&&_!==c.bg&&(o[d][p]=c.fg)}return o},Fa=(t,e,a)=>{if(t.length<2)return t;const o=t.slice(1);return o.push([...t[0]]),a==="SCREEN 2 (Graphics I)"&&e?z(o,e):o},$a=(t,e,a)=>{const n=t.length;if(n<2)return t;const o=t.slice(0,n-1);return o.unshift([...t[n-1]]),a==="SCREEN 2 (Graphics I)"&&e?z(o,e):o},Ha=(t,e,a)=>{if(t.length===0)return[];const n=t.map(o=>{if(o.length<2)return[...o];const l=o.slice(1);return l.push(o[0]),l});return a==="SCREEN 2 (Graphics I)"&&e?z(n,e):n},Ga=(t,e,a)=>{if(t.length===0)return[];const n=t.map(o=>{const l=o.length;if(l<2)return[...o];const i=o.slice(0,l-1);return i.unshift(o[l-1]),i});return a==="SCREEN 2 (Graphics I)"&&e?z(n,e):n},Va=(t,e,a)=>{if(t.length===0)return[];const n=t.map(o=>[...o].reverse());return a==="SCREEN 2 (Graphics I)"&&e?z(n,e):n},Ya=(t,e,a)=>{if(t.length===0)return[];const n=[...t].reverse();return a==="SCREEN 2 (Graphics I)"&&e?z(n,e):n},Le=t=>{var o,l,i;if(!t.lineAttributes)return null;const e=[],a=t.width/M,n=t.height/M;for(let d=0;d<n;d++)for(let p=0;p<a;p++)for(let s=0;s<M;s++){const c=d*M+s;let _=Q<<4|X;const m=(o=t.lineAttributes[c])==null?void 0:o[p];if(m){const S=((l=q.get(m.fg))==null?void 0:l.index)??Q,T=((i=q.get(m.bg))==null?void 0:i.index)??X;_=S<<4|T}e.push(_)}return new Uint8Array(e)},Wa=t=>{const e=[];t.frames.forEach(n=>{var o,l,i,d,p;for(let s=0;s<t.spritePalette.length;s++){const c=t.spritePalette[s];if(c===t.backgroundColor)continue;let _=!1;const m=[],S=t.size.width,T=t.size.height;if(S===16&&T===16){for(let r=0;r<8;r++){let h=0;for(let u=0;u<8;u++)((o=n.data[r])==null?void 0:o[u])===c&&(h|=1<<7-u,_=!0);m.push(h)}for(let r=8;r<16;r++){let h=0;for(let u=0;u<8;u++)((l=n.data[r])==null?void 0:l[u])===c&&(h|=1<<7-u,_=!0);m.push(h)}for(let r=0;r<8;r++){let h=0;for(let u=0;u<8;u++)((i=n.data[r])==null?void 0:i[8+u])===c&&(h|=1<<7-u,_=!0);m.push(h)}for(let r=8;r<16;r++){let h=0;for(let u=0;u<8;u++)((d=n.data[r])==null?void 0:d[8+u])===c&&(h|=1<<7-u,_=!0);m.push(h)}}else for(let r=0;r<T;r++)for(let h=0;h<Math.ceil(S/8);h++){let u=0;for(let E=0;E<8;E++){const f=h*8+E;f<S&&((p=n.data[r])==null?void 0:p[f])===c&&(u|=1<<7-E,_=!0)}m.push(u)}_&&e.push(m)}});const a=e.flat();return new Uint8Array(a)},za=t=>t.map(e=>[...e].reverse()),ja=t=>[...t].reverse(),De=t=>{let e=t.toString(16).toUpperCase();return e.length===1&&(e="0"+e),e},Re=(t,e,a,n,o,l,i="hex")=>{var _,m,S,T,r,h;const p=t.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let s=`;; ---- Sprite Frame: ${t} ----
`;s+=`;; Size: ${o}x${l}
`;let c=0;for(let u=0;u<a.length;u++){const E=a[u];let f=!1;if(E!==n)for(let I=0;I<l;I++){for(let C=0;C<o;C++)if(((_=e[I])==null?void 0:_[C])===E){f=!0;break}if(f)break}if(!f){s+=`;; Layer ${u} (Color: ${E}) - SKIPPED (color not used or is background)
`;continue}c++,s+=`${p}_LAYER${u}: ; Brush Color Index ${u} (Actual Color: ${E})
`;const g=[];if(o%8!==0&&(s+=`;; WARNING: Sprite width ${o} is not a multiple of 8. Bitmask generation might be problematic for standard VDP.
`),o===16&&l===16){for(let I=0;I<8;I++){let C=0;for(let b=0;b<8;b++){const y=b;((m=e[I])==null?void 0:m[y])===E&&(C|=1<<7-b)}g.push(C)}for(let I=8;I<16;I++){let C=0;for(let b=0;b<8;b++){const y=b;((S=e[I])==null?void 0:S[y])===E&&(C|=1<<7-b)}g.push(C)}for(let I=0;I<8;I++){let C=0;for(let b=0;b<8;b++){const y=8+b;((T=e[I])==null?void 0:T[y])===E&&(C|=1<<7-b)}g.push(C)}for(let I=8;I<16;I++){let C=0;for(let b=0;b<8;b++){const y=8+b;((r=e[I])==null?void 0:r[y])===E&&(C|=1<<7-b)}g.push(C)}}else for(let I=0;I<l;I++)for(let C=0;C<Math.ceil(o/8);C++){let b=0;for(let y=0;y<8;y++){const L=C*8+y;L<o&&((h=e[I])==null?void 0:h[L])===E&&(b|=1<<7-y)}g.push(b)}for(let I=0;I<g.length;I+=16){const b=g.slice(I,I+16).map(y=>i==="hex"?`#${De(y)}`:y.toString());s+=`    DB ${b.join(",")}
`}s+=`
`}return c===0&&(s+=`;; NO ACTIVE LAYERS EXPORTED for ${t} - Frame might be empty or only contain the background color.
`),s+=`;; ---- End of Frame: ${t} ----

`,s},Oe=(t,e="hex",a)=>{let n=`;; Sprite: ${t.name}
`;n+=`;; Total Frames: ${t.frames.length}
`,n+=`;; Size: ${t.size.width}x${t.size.height}
`,n+=`;; Background Color (not exported as a layer): ${t.backgroundColor}
`,n+=`;; Drawable Palette (Hex): C0=${t.spritePalette[0]}, C1=${t.spritePalette[1]}, C2=${t.spritePalette[2]}, C3=${t.spritePalette[3]}

`;const o=a!==void 0?`_${a}`:"",l=t.name+o,i=l.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();return n+=`SPRITE_${i}_WIDTH     EQU ${t.size.width}
`,n+=`SPRITE_${i}_HEIGHT    EQU ${t.size.height}
`,n+=`SPRITE_${i}_FRAMES    EQU ${t.frames.length}

`,t.frames.forEach((d,p)=>{n+=Re(`${l}_F${p}`,d.data,t.spritePalette,t.backgroundColor,t.size.width,t.size.height,e)}),n},le=16,Te="SCREEN 2 (Graphics I)",Me="SCREEN 5 (Graphics III)",$=8,Pe={pixelWidth:H*le,pixelHeight:J*le,widthTiles:H,heightTiles:J,baseTileSize:le},_e={[Te]:{pixelWidth:H*Y,pixelHeight:J*Y,widthTiles:H,heightTiles:J,baseTileSize:Y},[Me]:{pixelWidth:256,pixelHeight:212,widthTiles:32,heightTiles:27,baseTileSize:Y},"SCREEN 0 (Text 40)":{pixelWidth:240,pixelHeight:192,widthTiles:40,heightTiles:24,baseTileSize:$},"SCREEN 1 (Text 32)":{pixelWidth:256,pixelHeight:192,widthTiles:32,heightTiles:24,baseTileSize:$},"SCREEN 3 (Multicolor)":{pixelWidth:256,pixelHeight:192,widthTiles:32,heightTiles:24,baseTileSize:$},"SCREEN 4 (Graphics II)":{pixelWidth:256,pixelHeight:192,widthTiles:32,heightTiles:24,baseTileSize:$},"SCREEN 6 (Graphics IV)":{pixelWidth:512,pixelHeight:212,widthTiles:64,heightTiles:27,baseTileSize:$},"SCREEN 7 (Graphics V)":{pixelWidth:512,pixelHeight:212,widthTiles:64,heightTiles:27,baseTileSize:$},"SCREEN 8 (Graphics VI)":{pixelWidth:256,pixelHeight:212,widthTiles:32,heightTiles:27,baseTileSize:$}};function Qa(t){const e=typeof t=="string"?t.trim():"";return e&&_e[e]?_e[e]:Pe}const ee=t=>t===Te,ve=t=>ee(t)?U:j,Ue=(t,e)=>{const a=ve(e);if(t===void 0||t<0||t>=a.length)return ee(e)?U[1].hex:j[4].hex;const n=a[t];return(n==null?void 0:n.hex)??(ee(e)?U[1].hex:j[4].hex)},Xa=(t,e,a,n)=>{var m;const o=t.layers.background,l=t.activeAreaX??0,i=t.activeAreaY??0,d=t.activeAreaWidth??t.width,p=t.activeAreaHeight??t.height,s=[];let c=0;const _=new Map;for(let S=0;S<p;S++){const T=i+S;for(let r=0;r<d;r++){const h=l+r;if(T>=o.length||h>=((m=o[T])==null?void 0:m.length)){s.push(V);continue}const u=o[T][h];if(!u||!u.tileId)s.push(V);else{let E=V;const f=e.find(g=>g.id===u.tileId);if(n==="SCREEN 2 (Graphics I)"&&a&&f){let g=!1,I={tileId:u.tileId,position:{x:h,y:T},attempts:[],banksReceived:a.length};typeof globalThis.screenUtils_firstTileLogged>"u"&&(console.log("🔍 First tile structure check:",{tileId:u.tileId,position:{x:h,y:T},banksCount:a.length,banks:a.map(C=>({name:C.name,assignedTileIds:Object.keys(C.assignedTiles||{}),hasThisTile:!!(C.assignedTiles&&C.assignedTiles[u.tileId]),assignedTilesType:typeof C.assignedTiles,assignedTilesSample:C.assignedTiles?Object.entries(C.assignedTiles).slice(0,2):[]}))}),globalThis.screenUtils_firstTileLogged=!0);for(const C of a)if((C.enabled??!0)&&C.assignedTiles[u.tileId]){const b=C.assignedTiles[u.tileId].charCode,y=Math.ceil(f.width/Y),L=u.subTileX||0,A=u.subTileY||0;E=b+A*y+L;const D=E>=C.charsetRangeStart&&E<=C.charsetRangeEnd;if(I.attempts.push({bankName:C.name,baseCharCode:b,calculated:E,range:`${C.charsetRangeStart}-${C.charsetRangeEnd}`,inRange:D}),D){g=!0;break}else E=V}else I.attempts.push({bankName:C.name,reason:"Tile not assigned to this bank"});g||(console.warn("⚠️ Tile not found in valid range:",I),E=V)}else if(n!=="SCREEN 2 (Graphics I)"){const g=`${u.tileId}_${u.subTileX??0}_${u.subTileY??0}`;_.has(g)?E=_.get(g):c>255?E=V:(_.set(g,c),E=c++)}s.push(E)}}}return new Uint8Array(s)},xe=(t,e,a,n,o,l="hex")=>{const d=t.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let p=`;; MAP: ${t} (${e}x${a} tiles)
`;p+=`;; Total size: ${n.length} bytes

`,o.length>0&&(p+=`;; --- TILE INDEX REFERENCES for ${d} ---
`,p+=o.join(`
`)+`

`),p+=`SCREEN_${d}_WIDTH     EQU ${e}
`,p+=`SCREEN_${d}_HEIGHT    EQU ${a}
`,p+=`SCREEN_${d}_SIZE      EQU ${n.length}

`,p+=`SCREEN_${d}_LAYOUT:
`;for(let s=0;s<n.length;s+=16){const _=n.slice(s,s+16).map(m=>l==="hex"?`#${m.toString(16).padStart(2,"0").toUpperCase()}`:m.toString());p+=`    DB ${_.join(",")}
`}return p},we=(t,e,a,n,o="hex")=>{const i=t.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let d=`;; BEHAVIOR MAP: ${t} (${e}x${a} tiles)
`;d+=`;; Total size: ${n.length} bytes (Map IDs 0-255)
`,d+=`;; Data format: ${o.toUpperCase()}

`,d+=`BEHAVIOR_${i}_WIDTH     EQU ${e}
`,d+=`BEHAVIOR_${i}_HEIGHT    EQU ${a}
`,d+=`BEHAVIOR_${i}_SIZE      EQU ${n.length}

`,d+=`BEHAVIOR_${i}_DATA:
`;const p=s=>o==="hex"?`#${s.toString(16).padStart(2,"0").toUpperCase()}`:s.toString(10);for(let s=0;s<n.length;s+=16){const _=n.slice(s,s+16).map(p);d+=`    DB ${_.join(",")}
`}return d+=`
;; End of Behavior Map Data for ${t}
`,d},Ka=(t,e)=>{if(t.width!==e.width||t.height!==e.height||t.data.length!==e.data.length)return!1;for(let a=0;a<t.height;a++){if(t.data[a].length!==e.data[a].length)return!1;for(let n=0;n<t.width;n++)if(t.data[a][n]!==e.data[a][n])return!1}if(t.lineAttributes&&e.lineAttributes){if(t.lineAttributes.length!==e.lineAttributes.length)return!1;for(let a=0;a<t.lineAttributes.length;a++){if(t.lineAttributes[a].length!==e.lineAttributes[a].length)return!1;for(let n=0;n<t.lineAttributes[a].length;n++)if(t.lineAttributes[a][n].fg!==e.lineAttributes[a][n].fg||t.lineAttributes[a][n].bg!==e.lineAttributes[a][n].bg)return!1}}else if(t.lineAttributes!==e.lineAttributes)return!1;return JSON.stringify(t.logicalProperties)===JSON.stringify(e.logicalProperties)};function Za(t,e,a,n,o,l,i){const{data:d,width:p,height:s,lineAttributes:c}=t;if(!d||s===0||p===0)return"";const _=document.createElement("canvas");_.width=l,_.height=l;const m=_.getContext("2d");if(!m)return"";m.imageSmoothingEnabled=!1;const S=(e??0)*l,T=(a??0)*l;for(let u=0;u<l;u++)for(let E=0;E<l;E++){const f=S+E,g=T+u;if(g>=0&&g<s&&f>=0&&f<p){let I=d[g][f];if(i==="SCREEN 2 (Graphics I)"&&c&&c[g]){const C=Math.floor(f/ae),b=c[g][C];b&&I!==b.fg&&I!==b.bg&&(I=b.fg)}m.fillStyle=I,m.fillRect(E,u,1,1)}}if(_.width===n&&_.height===o)return _.toDataURL();const r=document.createElement("canvas");r.width=n,r.height=o;const h=r.getContext("2d");return h?(h.imageSmoothingEnabled=!1,h.drawImage(_,0,0,n,o),r.toDataURL()):_.toDataURL()}function Ja(t,e,a){var l;if(!t||a===0||e===0)return"";const n=document.createElement("canvas");n.width=e,n.height=a;const o=n.getContext("2d");if(!o)return"";o.imageSmoothingEnabled=!1;for(let i=0;i<a;i++)for(let d=0;d<e;d++){const p=(l=t[i])==null?void 0:l[d];p&&p!=="rgba(0,0,0,0)"&&(o.fillStyle=p,o.fillRect(d,i,1,1))}return n.toDataURL()}const qa=(t,e,a,n,o,l,i)=>{var _,m;const d=ee(n);t.width=e.width*o,t.height=e.height*o;const p=t.getContext("2d");if(!p)return;p.imageSmoothingEnabled=!1;const s=Ue(e.backgroundColor,n);p.fillStyle=s,p.fillRect(0,0,t.width,t.height);const c=e.layers.background;for(let S=0;S<e.height;S++)for(let T=0;T<e.width;T++){const r=(_=c[S])==null?void 0:_[T];if(!(r!=null&&r.tileId))continue;const h=a.find(L=>L.id===r.tileId);if(!h)continue;const{data:u,width:E,height:f,lineAttributes:g}=h;if(!u)continue;const I=r.subTileX??0,C=r.subTileY??0,b=I*o,y=C*o;for(let L=0;L<o;L++)for(let A=0;A<o;A++){const D=b+A,R=y+L;if(R<f&&D<E){let P=(m=u[R])==null?void 0:m[D];if(P===void 0)continue;if(d&&g&&g[R]){const K=Math.floor(D/ae),w=g[R][K];w&&P!==w.fg&&P!==w.bg&&(P=w.fg)}p.fillStyle=P,p.fillRect(T*o+A,S*o+L,1,1)}}}};function ke(t){const e=t.find(i=>i.type==="globalvariables");if(!e||!e.data)return[...ie];const a=e.data.customVariables||[],n=new Map;ie.forEach(i=>{n.set(i.name,i)}),a.forEach(i=>{n.set(i.name,i)});const o=ie.map(i=>i.name),l=[];return o.forEach(i=>{const d=n.get(i);d&&(l.push(d),n.delete(i))}),n.forEach(i=>{l.push(i)}),l}function en(t){const e=t.find(n=>n.type==="globalvariables");return!e||!e.data?[]:e.data.customVariables||[]}function Be(t){const e=ke(t);if(e.length===0)return[];const a=[];t.filter(c=>c.type==="screenmap").forEach(c=>{var m,S;(((S=(m=c.data)==null?void 0:m.layers)==null?void 0:S.entities)||[]).forEach(T=>{var r,h;(h=(r=T.components)==null?void 0:r.Behavior)!=null&&h.behaviorCode&&a.push(T.components.Behavior.behaviorCode)})});const o=t.find(c=>c.type==="gameflow"),l=new Set,i=new Set;if(o!=null&&o.data){const c=o.data;c.nodes&&Array.isArray(c.nodes)&&c.nodes.forEach(_=>{var m;_.type==="StateMachine"&&((m=_.data)!=null&&m.customCode)&&a.push(_.data.customCode),_.type==="IfThenElse"&&_.variableName&&l.add(_.variableName),_.type==="Globals"&&_.variables&&Array.isArray(_.variables)&&_.variables.forEach(S=>{S.variableName&&i.add(S.variableName)})})}t.filter(c=>c.type==="componentdefinition").forEach(c=>{const _=c.data;_.customCode&&a.push(_.customCode)});const p=[],s=new Set;return e.forEach(c=>{const _=a.some(T=>new RegExp(`\\b${c.asmName}\\b`,"i").test(T)),m=l.has(c.name),S=i.has(c.name);(_||m||S)&&!s.has(c.name)&&(p.push(c),s.add(c.name))}),i.forEach(c=>{if(!s.has(c)){const _=`global_var_${c.replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`;p.push({name:c,asmName:_,type:"8bit",defaultValue:0,description:"Auto-generated variable from Globals node",category:"custom"}),s.add(c)}}),l.forEach(c=>{if(!s.has(c)){const _=`global_var_${c.replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`;p.push({name:c,asmName:_,type:"8bit",defaultValue:0,description:"Auto-generated variable from IfThenElse node",category:"custom"}),s.add(c)}}),p}const O={AND:"AND",OR:"OR",XOR:"XOR",NOT:"NOT",KEY_PRESSED:"KEY_PRESSED",KEY_RELEASED:"KEY_RELEASED",TIME_OUT:"TIME_OUT",CAN_MOVE_DIRECTION:"CAN_MOVE_DIRECTION",HAS_COLLISION:"HAS_COLLISION",PATH_CLEAR:"PATH_CLEAR",ON_WALL_COLLISION:"ON_WALL_COLLISION",HAS_DEADLY_TILE_COLLISION:"HAS_DEADLY_TILE_COLLISION",ANIMATION_COMPLETE:"ANIMATION_COMPLETE",KEY_AND_MOVEMENT:"KEY_AND_MOVEMENT",VARIABLE_COMPARE:"VARIABLE_COMPARE"},N={SET_POSITION:"SET_POSITION",MOVE_BY:"MOVE_BY",SET_VELOCITY:"SET_VELOCITY",APPLY_FORCE:"APPLY_FORCE",CHANGE_SPRITE:"CHANGE_SPRITE",PLAY_ANIMATION:"PLAY_ANIMATION",SET_ANIMATION_SPEED:"SET_ANIMATION_SPEED",TOGGLE_ANIMATION:"TOGGLE_ANIMATION",PLAY_SOUND:"PLAY_SOUND",PLAY_MUSIC:"PLAY_MUSIC",MUTE_MUSIC:"MUTE_MUSIC",STOP_MUSIC:"STOP_MUSIC",SET_VARIABLE:"SET_VARIABLE",INCREMENT_VARIABLE:"INCREMENT_VARIABLE",DECREMENT_VARIABLE:"DECREMENT_VARIABLE",SET_COMPONENT_PROPERTY:"SET_COMPONENT_PROPERTY",WAIT:"WAIT",GOTO_STATE:"GOTO_STATE",DESTROY_ENTITY:"DESTROY_ENTITY",SPAWN_ENTITY:"SPAWN_ENTITY",GET_RANDOM_ENTITY_POSITION:"GET_RANDOM_ENTITY_POSITION",CHANGE_GAME_FLOW_NODE:"CHANGE_GAME_FLOW_NODE",DECREASE_LIVES:"DECREASE_LIVES",INCREASE_LIVES:"INCREASE_LIVES",RESPAWN_PLAYER:"RESPAWN_PLAYER",BREAK_TILE:"BREAK_TILE",REPLACE_TILE:"REPLACE_TILE",RND:"RND",POINT_AT:"POINT_AT",ADD_VARIABLES:"ADD_VARIABLES",SUBTRACT_VARIABLES:"SUBTRACT_VARIABLES",MULTIPLY_VARIABLES:"MULTIPLY_VARIABLES",DIVIDE_VARIABLES:"DIVIDE_VARIABLES",MODULO_VARIABLES:"MODULO_VARIABLES",ASSIGN_VARIABLE:"ASSIGN_VARIABLE"};function ce(t,e){const a=e.filter(A=>A.type==="componentdefinition").map(A=>A.data),n=e.filter(A=>A.type==="entitytemplate").map(A=>A.data),o=e.filter(A=>A.type==="sprite").map(A=>A.data),l=e.filter(A=>A.type==="tile").map(A=>A.data),i=e.filter(A=>A.type==="screenmap").map(A=>A.data),d=e.filter(A=>A.type==="worldmap").map(A=>A.data),p=e.filter(A=>A.type==="statemachine").map(A=>A.data),s=[];i.forEach(A=>{var D;(D=A.layers)!=null&&D.entities&&Array.isArray(A.layers.entities)&&s.push(...A.layers.entities),A.entities&&Array.isArray(A.entities)&&s.push(...A.entities)});const c=e.find(A=>A.type==="gameflow"),_=c==null?void 0:c.data,m=s.length>0,S=a.length>0||m,T=i.length>1,r=o.length>0,h=l.length>0,u=i.length>0,E=a.length>0,f=!!_,g=e.some(A=>A.type==="font"),I=o.some(A=>A.frames.length>1),C=i.some(A=>A.layers.collision.some(D=>D.some(R=>R!==null))),b=n.some(A=>A.name.toLowerCase().includes("menu")),y=[];a.forEach(A=>{A.name.toLowerCase().includes("state")&&y.push(A.name.replace(/[^a-zA-Z0-9]/g,"").toUpperCase())});const L=Be(e);return{projectName:t,components:a,templates:n,sprites:o,tiles:l,screenMaps:i,screens:i,worldmaps:d,entities:s,fonts:e.filter(A=>A.type==="font"),gameFlow:_,stateMachines:p,hasECS:S,hasMultipleScreens:T,hasSprites:r,hasTiles:h,hasScreens:u,hasEntities:m,hasComponents:E,hasGameFlow:f,hasMenus:b,hasFonts:g,hasAnimations:I,hasCollisions:C,hasMenuSystem:b,customStates:y,globalVariables:L}}const Fe=t=>{if(!t.hasECS)return`    ; No ECS system - basic entity updates
    RET`;let e=`    ; ECS-based entity updates
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
    
    ; Update entity based on components`;return t.components.forEach((a,n)=>{e+=`
    ; Update ${a.name} component
    CALL UPDATE_${a.name.toUpperCase().replace(/[^A-Z0-9]/g,"_")}`}),e+=`
    
entity_update_skip:
    POP HL
    LD DE, 16           ; Entity structure size
    ADD HL, DE
    POP BC
    DJNZ entity_update_loop
    RET`,e},$e=t=>{if(!t.hasSprites)return`    ; No sprites to update
    RET`;let e=`    ; Update sprite animations and positions
    LD B, ${t.sprites.length}    ; Number of sprites
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
    
sprite_no_frame_advance:`;return t.hasAnimations&&(e+=`
    ; Update sprite position based on movement component
    INC HL
    INC HL
    INC HL
    LD A, (HL)          ; X position
    INC HL  
    LD B, (HL)          ; Y position
    ; Apply movement logic here
    ; CALL APPLY_SPRITE_MOVEMENT`),e+=`
    
    POP HL
    LD DE, 8            ; Sprite data structure size
    ADD HL, DE
    POP BC
    DJNZ sprite_update_loop
    RET`,e},He=t=>t.hasCollisions?`    ; Check player collision with environment
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
    RET`,Ge=t=>{let e=`    ; Read MSX joystick/keyboard input
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
    
input_no_fire1:`;return t.hasMenuSystem&&(e+=`
    ; Check for pause/menu button (Space)
    LD A, 6             ; Row 6
    CALL SNSMAT
    BIT 0, A            ; Space key
    JR NZ, input_no_pause
    LD A, (input_state)
    SET INPUT_BIT_PAUSE, A
    LD (input_state), A
    
input_no_pause:`),e+=`
    RET`,e},Ve=t=>t.hasMenuSystem?`    ; Update menu graphics and cursor
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
    RET`,Ye=t=>{if(t.customStates.length===0)return"; No custom states detected";let e=`; Custom state handlers for project-specific logic
`;return t.customStates.forEach(a=>{e+=`
logic_${a.toLowerCase()}:
    ; Custom logic for ${a} state
    ; TODO: Implement ${a} specific logic
    RET
`}),e},We=[{marker:"{{ENTITY_UPDATES}}",generator:Fe,description:"Entity update system based on ECS components"},{marker:"{{SPRITE_UPDATES}}",generator:$e,description:"Sprite animation and movement updates"},{marker:"{{COLLISION_CHECK}}",generator:He,description:"Collision detection system"},{marker:"{{INPUT_HANDLING}}",generator:Ge,description:"Input handling with project-specific controls"},{marker:"{{MENU_SYSTEM}}",generator:Ve,description:"Menu system updates and rendering"},{marker:"{{CUSTOM_STATES}}",generator:Ye,description:"Custom state handlers detected from project"}];function ze(t,e,a,n=We){const o=ce(e,a);let l=t;return l=l.replace(/{{PROJECT_NAME}}/g,e.toUpperCase()),l=l.replace(/{{PROJECT_NAME_LOWER}}/g,e.toLowerCase()),l=l.replace(/{{GENERATION_DATE}}/g,new Date().toISOString()),n.forEach(i=>{if(l.includes(i.marker)){const d=i.generator(o);l=l.replace(new RegExp(Qe(i.marker),"g"),d)}}),l}function je(){return`;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
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
`}function Qe(t){return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function tn(t,e){const a=je(),n=ze(a,t,e),l=`${t.toLowerCase().replace(/[^a-z0-9]/g,"_")}_dynamic_system.asm`,i=ce(t,e);return{filename:l,content:n,analysis:i}}function Xe(){return`; ==================================================================
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

; Slot Management
RSLREG  EQU #0138        ; Read slot register
WSLREG  EQU #013B        ; Write slot register
GETSLOT EQU #013B        ; Get current slot
ENASLT  EQU #0024        ; Enable slot (H=page, A=slot)
CALSLT  EQU #001C        ; Call routine in another slot

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
`}function Ke(t){let e="";if(!t.globalVariables||t.globalVariables.length===0)return e+=`; Goal Variable Values (default)
`,e+=`GOAL_FAILURE            EQU 0    ; Goal = "Failure"
`,e+=`GOAL_COMPLETED          EQU 1    ; Goal = "Completed"
`,e;const a=new Set;return t.globalVariables.forEach(n=>{n.values&&n.values.length>0&&(e+=`
; ${n.name} - ${n.description||"Variable values"}
`,n.values.forEach(o=>{const l=(o.asmConstant||"UNKNOWN").trim(),i=typeof o.value=="number"?o.value:0;a.has(l)||(e+=`${l.padEnd(24)}EQU ${i}    ; ${n.name} = "${o.label}"
`,a.add(l))}))}),e}function Ze(t){var e,a,n;return`; ==================================================================
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
${t.tiles&&t.tiles.length>0?`
; Project-specific tile dimensions detected:
${t.tiles.map((o,l)=>`; Tile ${l}: ${o.name} = ${o.width}x${o.height}px (${Math.ceil(o.width/8)}x${Math.ceil(o.height/8)} MSX chars)`).join(`
`)}

; Using primary tile size: ${t.tiles[0].width}x${t.tiles[0].height}px
TILE_WIDTH      EQU ${t.tiles[0].width}    ; Primary tile width in pixels
TILE_HEIGHT     EQU ${t.tiles[0].height}   ; Primary tile height in pixels
SCREEN_TILES_X  EQU ${Math.floor(256/t.tiles[0].width)}    ; Horizontal tiles (256px ÷ ${t.tiles[0].width}px)
SCREEN_TILES_Y  EQU ${Math.floor(192/t.tiles[0].height)}   ; Vertical tiles (192px ÷ ${t.tiles[0].height}px)
MSX_CHARS_PER_TILE_X EQU ${Math.ceil(t.tiles[0].width/8)}  ; MSX characters wide per tile
MSX_CHARS_PER_TILE_Y EQU ${Math.ceil(t.tiles[0].height/8)} ; MSX characters high per tile
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

${Ke(t)}

; ==================================================================
; GAME FLOW STATES (PROJECT-SPECIFIC)
; ==================================================================

; Basic Game Flow States (always available)
FLOW_STATE_MAIN_MENU    EQU 0
FLOW_STATE_GAME         EQU 1
FLOW_STATE_PAUSE        EQU 2
FLOW_STATE_GAME_OVER    EQU 3
FLOW_STATE_CREDITS      EQU 4

; GameFlow Node Types
NODE_TYPE_START         EQU 0    ; Start node (initial entry point)
NODE_TYPE_WORLDLINK     EQU 1    ; World link node (loads world map)
NODE_TYPE_WORLD_LINK    EQU 1    ; Alias with underscore (for compatibility)
NODE_TYPE_SCREEN        EQU 2    ; Screen node (loads specific screen)
NODE_TYPE_MENU          EQU 3    ; Menu node (shows menu interface)
NODE_TYPE_SUBMENU       EQU 3    ; Alias for menu node
NODE_TYPE_SUB_MENU      EQU 3    ; Alias with underscore (for compatibility)
NODE_TYPE_TEXT          EQU 4    ; Text node (displays text)
NODE_TYPE_TRANSITION    EQU 5    ; Transition node
NODE_TYPE_RESTART       EQU 6    ; Restart node (restart game/level)
NODE_TYPE_UNKNOWN       EQU 255  ; Unknown/unsupported node type
${t.gameFlow?`
; Additional Game Flow States detected in project
; (Custom states would be added here if needed)
`:`
; Using default game flow system
`}

; ==================================================================
; PROJECT-SPECIFIC CONSTANTS
; ==================================================================

; Detected Assets
TOTAL_SPRITES           EQU ${((e=t.sprites)==null?void 0:e.length)||0}
TOTAL_TILES             EQU ${((a=t.tiles)==null?void 0:a.length)||0}
TOTAL_SCREENS           EQU ${((n=t.screenMaps)==null?void 0:n.length)||0}

; ==================================================================
; END OF CONSTANTS
; ==================================================================
`}function Je(t){let e=`; ==================================================================
; RAM VARIABLES DEFINITIONS
; File: variables.asm
; Description: Dynamic variable allocation using EQU addresses
; Generated based on project analysis
; ==================================================================

; ==================================================================
; CORE SYSTEM VARIABLES (ALWAYS PRESENT)
; ==================================================================
`,a=49152;e+=`input_state         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current joystick/keyboard state
`,a++,e+=`prev_input_state    EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Previous input state
`,a++,e+=`current_flow_state  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current game flow state
`,a++,e+=`prev_flow_state     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Previous game flow state
`,a++,e+=`
; ==================================================================
; MIDEAS GLOBAL VARIABLES (DEFAULTS + CUSTOM)
; ==================================================================
`,t.globalVariables&&t.globalVariables.length>0?t.globalVariables.forEach(n=>{const o=n.type==="16bit"?2:1,l=n.type==="16bit"?" (16-bit)":" (8-bit)",i=n.description||n.name;e+=`${n.asmName.padEnd(20)} EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; ${i}${l}
`,a+=o}):(e+=`global_var_goal     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Goal status (0=Failure, 1=Completed)
`,a++),e+=`
; ==================================================================
; SYSTEM VARIABLES
; ==================================================================
`,e+=`ROM_slot            EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; ROM slot number (for SETPAGES32K)
`,a++,e+=`frame_counter       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Frame counter (16-bit)
`,a+=2,e+=`
; ==================================================================
; ENTITY SYSTEM VARIABLES (Fixed 32 entities)
; ==================================================================
MAX_ENTITIES        EQU 32
`,e+=`entity_x_pos        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity X positions (32 bytes)
`,a+=32,e+=`entity_y_pos        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity Y positions (32 bytes)
`,a+=32,e+=`entity_vel_x        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity X velocity (32 bytes)
`,a+=32,e+=`entity_vel_y        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity Y velocity (32 bytes)
`,a+=32,e+=`entity_comp_masks   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity component masks (32 bytes)
`,a+=32,e+=`entity_screen_id    EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity screen ID (32 bytes)
`,a+=32,e+=`entity_dir_mask     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity direction mask (32 bytes)
`,a+=32,e+=`entity_health       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity health (32 bytes)
`,a+=32,e+=`entity_anim_frame   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity animation frame (32 bytes)
`,a+=32,e+=`entity_sm_ptr_l     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity State Pointer Low (32 bytes)
`,a+=32,e+=`entity_sm_ptr_h     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity State Pointer High (32 bytes)
`,a+=32,e+=`entity_sm_timer_l   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity State Timer Low (32 bytes)
`,a+=32,e+=`entity_sm_timer_h   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity State Timer High (32 bytes)
`,a+=32,e+=`entity_sm_wait_timer EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity State Wait Timer (32 bytes)
`,a+=32;for(let n=0;n<8;n++)e+=`entity_sm_var_${n}     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity Variable ${n} (32 bytes)
`,a+=32;return e+=`
; ==================================================================
; SPRITE SYSTEM VARIABLES
; ==================================================================
`,e+=`active_sprite_count EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Number of sprites currently active
`,a++,e+=`sprite_pattern      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Sprite pattern IDs (32 bytes)
`,a+=32,e+=`sprite_color        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Sprite colors (32 bytes)
`,a+=32,e+=`sprite_attributes   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Interleaved sprite attributes (32 * 4 bytes)
`,a+=128,t.screenMaps.length>0&&(e+=`
; ==================================================================
; SCREEN SYSTEM VARIABLES (${t.screenMaps.length} screens detected)
; ==================================================================
`,e+=`current_screen_id   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Currently displayed screen ID
`,a++,e+=`screen_dirty_flag   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Screen needs redraw flag
`,a++,e+=`current_world_id    EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current world ID (for multi-world support)
`,a++,e+=`current_screen_index EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current screen index within world
`,a++),e+=`
; ==================================================================
; PLAYER SYSTEM VARIABLES (player entity detected)
; ==================================================================
`,e+=`player_x            EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Player X position (16-bit)
`,a+=2,e+=`player_y            EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Player Y position (16-bit)
`,a+=2,e+=`player_health       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Player health points
`,a++,e+=`player_score        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Player score (16-bit)
`,a+=2,e+=`
; ==================================================================
; AUXILIARY VARIABLES 
; ==================================================================
deterministic        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Deterministic mode flag
`,a++,e+=`
; ==================================================================
; TEMPORARY VARIABLES (ALWAYS NEEDED)
; ==================================================================
`,e+=`temp_word_1         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 16-bit storage
`,a+=2,e+=`temp_word_2         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 16-bit storage
`,a+=2,e+=`temp_byte_1         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage
`,a++,e+=`temp_byte_2         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage
`,a++,e+=`temp_byte_3         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,e+=`temp_byte_4         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,e+=`temp_byte_5         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,e+=`temp_byte_6         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,e+=`temp_byte_7         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,e+=`temp_word_3         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 16-bit storage (64 bytes)
`,a+=64,e+=`temp_word_4         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 16-bit storage (64 bytes)
`,a+=64,e+=`
; ==================================================================
; END OF VARIABLES
; ==================================================================
RAM_USAGE_END       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; End of project variables (${a-49152} bytes used)

; ==================================================================
; MEMORY SAFETY CHECK
; ==================================================================
; RAM Layout:
;   #C000-#${a.toString(16).toUpperCase().padStart(4,"0")}: Project variables (${a-49152} bytes)
;   #${a.toString(16).toUpperCase().padStart(4,"0")}-#F37F: Free RAM (~${62336-a} bytes available)
;   #F380-#FFFF: MSX System variables (DO NOT TOUCH)
; ==================================================================
`,e}function qe(t){if(!t)return"";let e="";return e+=`    ld a, 0
`,e+=`    ld hl, task_update_input
`,e+=`    call enable_task

`,t.hasEntities&&(e+=`    ld a, 1
`,e+=`    ld hl, task_update_physics
`,e+=`    call enable_task

`),t.hasCollisions&&(e+=`    ld a, 2
`,e+=`    ld hl, task_update_collision
`,e+=`    call enable_task

`),e}function et(t,e){var n;let a="";if(e!=null&&e.gameFlow){const o=e.gameFlow;a=`
; GameFlow Integration: Using "${o.name}" as execution orchestrator`;const l=o.nodes.find(i=>i.type==="Start");if(l){const i=o.connections.find(d=>{var p;return((p=d.from)==null?void 0:p.nodeId)===l.id||typeof d.from=="string"&&d.from===l.id});if(i){const d=((n=i.to)==null?void 0:n.nodeId)||i.to,p=o.nodes.find(s=>s.id===d);p&&(a+=`
; Flow: Start → ${p.type} (${p.title||p.name||p.id})`)}}}return`; ==================================================================
; MSX CARTRIDGE ROM HEADER
; File: header.asm
; Description: Standard MSX cartridge initialization${a}
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
    ; NOTE: TIMI (H.TIMI) is now managed by init_interrupt_system
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
    ; INTERRUPT SYSTEM INITIALIZATION (Konami-style)
    ; ====================================================
    ; Initialize interrupt task system (hooks H.TIMI)
    call init_interrupt_system

    ; Register default tasks based on project needs
    ${qe(e)}

    ; ====================================================
    ; GAMEFLOW INITIALIZATION
    ; ====================================================
    ; Initialize GameFlow system
    call gameflow_init
    
    ; Start execution from GameFlow Start node
    ; GameFlow is now the sole orchestrator
    jp gameflow_start

; ==================================================================
; AUXILIARY FUNCTIONS
; ==================================================================

; From: http://www.z80st.es/downloads/code/
; SETPAGES32K:  BIOS-ROM-YY-ZZ   -> BIOS-ROM-ROM-ZZ (SITUA PAGINA 2)
SETPAGES32K:    ; --- Posiciona las paginas de un megarom o un 32K ---
    ld  a, #C9              ; Codigo de RET
    ld  (SETPAGES32K_NOPRET), a   ; Modificamos la siguiente instruccion si estamos en RAM
SETPAGES32K_NOPRET:
    nop                     ; No hacemos nada si no estamos en RAM
    ; --- Si llegamos aqui no estamos en RAM, hay que posicionar la pagina ---
    call RSLREG             ; Leemos el contenido del registro de seleccion de slots
    rrca                    ; Rotamos a la derecha...
    rrca                    ; ...dos veces
    call GETSLOT            ; Obtenemos el slot de la pagina 1 ($4000-$BFFF)
    ld (ROM_slot), a        ; Save slot for later use
    ld  h, #80              ; Seleccionamos pagina 2 ($8000-$BFFF)
    jp  ENASLT              ; Posicionamos la pagina 2 y volvemos

; Source: https://www.msx.org/forum/development/msx-development/how-0?page=0
; Returns 1 in a and clears z flag if vdp is 60Hz
CheckIf60Hz:
    di
    in      a, (#99)
    nop
    nop
    nop
vdpSync:
    in      a, (#99)
    and     #80
    jr      z, vdpSync

    ld      hl, #900
vdpLoop:
    dec     hl
    ld      a, h
    or      l
    jr      nz, vdpLoop

    in      a, (#99)
    rlca
    and     1
    ei
    ret

; ==================================================================
; END OF HEADER
; ==================================================================
`}function B(t){return t.replace(/[^a-zA-Z0-9]/g,"_")}function Se(t){return`NODE_TYPE_${t.replace(/([a-z])([A-Z])/g,"$1_$2").toUpperCase()}`}function tt(t){const e=(t.name||"DEFAULT").toUpperCase().replace(/[^A-Z0-9]/g,"_"),a=t.id?`_${t.id.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";return`load_screen_${e.toLowerCase()}${a.toLowerCase()}`}function at(t){var o,l,i;if(!t.gameFlow)return it(t);const e=t.gameFlow;let a=`; ==================================================================
; GAMEFLOW EXECUTION ENGINE
; File: gameflow.asm
; Description: GameFlow-based game orchestration system
; ==================================================================
;
; GameFlow: ${e.name||"Unnamed"}
; Total Nodes: ${((o=e.nodes)==null?void 0:o.length)||0}
; Total Connections: ${((l=e.connections)==null?void 0:l.length)||0}
; Start Node: ${e.startNodeId||"NONE"}
;
; ARCHITECTURE:
; - GameFlow is the SOLE execution orchestrator
; - Each node generates its own execution code
; - Connections between nodes define the complete flow
; - No hardcoded main_loop outside GameFlow
; ==================================================================

`;a+=`; ==================================================================
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
${e.startNodeId?`    ld hl, gameflow_node_${B(e.startNodeId)}`:`    ; ERROR: No start node defined!
    ret`}
    jp gameflow_execute_node

`,a+=`; ==================================================================
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
`;const n=Array.from(new Set(((i=e.nodes)==null?void 0:i.map(d=>d.type))||[]));return n.forEach(d=>{const p=`gameflow_handle_${d.toLowerCase()}`;a+=`    cp ${Se(d)}
    jp z, ${p}
`}),a+=`    
    ; Unknown node type - error
    ret

`,a+=`; ==================================================================
; NODE TYPE HANDLERS
; Each handler receives:
;   DE = node data pointer
;   BC = connection table pointer
; ==================================================================

`,a+=nt(n),a+=`; ==================================================================
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

`,a+=`; ==================================================================
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

`,a+=`; ==================================================================
; NODE DATA STRUCTURES
; Each node has: type byte, data pointer, connection table pointer
; ==================================================================

`,e.nodes&&e.nodes.length>0&&e.nodes.forEach(d=>{a+=ot(d,e)}),a+=`
; ==================================================================
; GAMEFLOW VARIABLES
; ==================================================================

gameflow_exit_requested:    db 0    ; Flag to exit current game loop
gameflow_menu_selection:    db 0    ; Last menu selection
gameflow_condition_result:  db 0    ; Result of last condition evaluation

; ==================================================================
; END OF GAMEFLOW
; ==================================================================
`,a}function nt(t,e){let a="";return t.forEach(n=>{switch(n){case"Start":a+=`gameflow_handle_start:
    ; Start node - simply transition to next node
    ; BC = connection table
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z           ; No connection
    jp gameflow_execute_node

`;break;case"WorldLink":a+=`gameflow_handle_worldlink:
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

`;break;case"End":a+=`gameflow_handle_end:
    ; End node - stop execution
    ; TODO: Show end screen based on node data
    ret

`;break;case"Restart":a+=`gameflow_handle_restart:
    ; Restart node - reset game
    jp init_rom

`;break;case"SubMenu":a+=`gameflow_handle_submenu:
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

`;break;case"Text":a+=`gameflow_handle_text:
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

`;break;case"IfThenElse":a+=`gameflow_handle_ifthenelse:
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

`;break;case"Globals":a+=`gameflow_handle_globals:
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

`;break;case"Waypoint":a+=`gameflow_handle_waypoint:
    ; Waypoint node - passthrough routing node
    ; Simply follow default connection
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

`;break;case"Transition":a+=`gameflow_handle_transition:
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

`;break;case"Group":a+=`gameflow_handle_group:
    ; Group node - nested GameFlow (placeholder)
    ; TODO: Implement nested GameFlow execution
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

`;break;case"Music":a+=`gameflow_handle_music:
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

`;break;default:a+=`gameflow_handle_${n.toLowerCase()}:
    ; ${n} node - not yet implemented
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

`;break}}),a}function ot(t,e,a){var p,s,c,_,m,S;const n=`gameflow_node_${B(t.id)}`,o=`${n}_data`,l=`${n}_conn`;let i=`; Node: ${t.type} - "${t.title||t.name||t.id}"
${n}:
    db ${Se(t.type)}
    dw ${o}
    dw ${l}

`;switch(i+=`${o}:
`,t.type){case"WorldLink":const T=t.worldAssetId||"default";i+=`    dw load_world_${B(T)}
`;break;case"SubMenu":i+=`    db ${((p=t.options)==null?void 0:p.length)||0}    ; Number of options
`;break;case"Text":i+=`    dw text_${B(t.id)}    ; Text content pointer
`;break;case"IfThenElse":const h=`global_var_${(t.variableName||"unknown").replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`,u=t.compareValue||0;i+=`    dw ${h}    ; Variable to check
`,i+=`    db ${u}   ; Compare value
`,i+=`    db 0                 ; Operator (0=equals)
`;break;case"Globals":t.variables&&t.variables.length>0?(i+=`    db ${t.variables.length}    ; Number of assignments
`,t.variables.forEach(E=>{const g=`global_var_${(E.variableName||E.name||"unknown").replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`,I=E.value||0;i+=`    dw ${g}
`,i+=`    db ${I}
`})):i+=`    db 0    ; No assignments
`;break;default:i+=`    ; No additional data
`;break}i+=`
`,i+=`${l}:
`;const d=((s=e.connections)==null?void 0:s.filter(T=>{var r;return(((r=T.from)==null?void 0:r.nodeId)||T.from)===t.id}))||[];if(t.type==="IfThenElse"){const T=d.find(h=>{var u,E;return((u=h.from)==null?void 0:u.sourceId)==="then"||!((E=h.from)!=null&&E.sourceId)}),r=d.find(h=>{var u;return((u=h.from)==null?void 0:u.sourceId)==="else"});i+=`    db CONNECTION_THEN
`,i+=`    dw ${T?`gameflow_node_${B(((c=T.to)==null?void 0:c.nodeId)||T.to)}`:"0"}
`,i+=`    db CONNECTION_ELSE
`,i+=`    dw ${r?`gameflow_node_${B(((_=r.to)==null?void 0:_.nodeId)||r.to)}`:"0"}
`}else if(t.type==="SubMenu")(m=t.options)==null||m.forEach((T,r)=>{var u;const h=d.find(E=>{var f;return((f=E.from)==null?void 0:f.sourceId)===T.id});i+=`    db CONNECTION_OPTION_${r}
`,i+=`    dw ${h?`gameflow_node_${B(((u=h.to)==null?void 0:u.nodeId)||h.to)}`:"0"}
`});else{const T=d[0];i+=`    db CONNECTION_DEFAULT
`,i+=`    dw ${T?`gameflow_node_${B(((S=T.to)==null?void 0:S.nodeId)||T.to)}`:"0"}
`}return i+=`    db CONNECTION_END

`,i}function it(t){return`; ==================================================================
; DEFAULT GAMEFLOW (No GameFlow defined in project)
; ==================================================================

gameflow_init:
    ret

gameflow_start:
    ; Load first available screen/world
${t.screenMaps&&t.screenMaps.length>0?`    call ${tt(t.screenMaps[0])}`:"    ; No screens available"}
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
`}function lt(t,e){return`; ==================================================================
; ${t.toUpperCase()} - MAIN ASSEMBLY FILE
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

; 3.5. Interrupt System (Konami-style task system)
include "interrupt.asm"

; 4. ROM Header (depends on variables and interrupt system)
include "header.asm"

${e.tiles&&e.tiles.length>0?`; 5. Pattern Data (if tiles exist)
include "patterns.asm"

; 6. Color Data (if tiles exist)
include "colors.asm"
`:""}

${e.sprites&&e.sprites.length>0?`; 7. Sprite Data (if sprites exist)
include "sprites.asm"
`:""}

; 8. Components (game logic)
include "components.asm"

; 9. Entities (game objects)
include "entities.asm"

${e.worldmaps&&e.worldmaps.length>0?`; 10. Worlds (world maps)
include "worlds.asm"
`:""}

${e.screenMaps&&e.screenMaps.length>0?`; 11. Screen Maps (if screens exist)
include "screens.asm"
`:""}

; 12. Font Data (custom font for Screen 2 text)
include "font.asm"

; 13. HUD System (heads-up display)
include "hud.asm"

; 14. Menus (user interface)
include "menus.asm"

${e.stateMachines&&e.stateMachines.length>0?`; 15. State Machines (entity AI)
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
`}function rt(t){var e;return!t.tiles||t.tiles.length===0?`; ==================================================================
; PATTERN DATA (EMPTY - NO TILES DETECTED)
; File: patterns.asm
; ==================================================================

; No tiles detected in project - file generated as placeholder
`:`; ==================================================================
; TILE PATTERN DATA
; File: patterns.asm
; Description: Tile pattern definitions for MSX Screen 2
; ${((e=t.tiles)==null?void 0:e.length)||0} tiles detected
; ==================================================================

; ==================================================================
; TILE PATTERN BANK 0 (Base patterns)
; ==================================================================
tile_pattern_bank0:
${t.tiles.map((a,n)=>{const o=Ne(a,"SCREEN 2 (Graphics I)"),l=Math.ceil(a.width/8),i=Math.ceil(a.height/8),d=l*i;(a.width%8!==0||a.height%8!==0)&&console.warn(`⚠️  Tile ${a.name} size ${a.width}x${a.height} is not multiple of 8px - may cause visual artifacts`);const p=Array.from(o).map(c=>`#${c.toString(16).padStart(2,"0").toUpperCase()}`);let s="";if(d>1){s=`
    ; Character layout: ${l}×${i} grid`;for(let c=0;c<i;c++){s+=`
    ; Row ${c}: `;for(let _=0;_<l;_++){const m=c*l+_;s+=`Char${m} `}}}return`    ; Tile ${n}: ${a.name} (${a.width}x${a.height}px = ${l}×${i} chars = ${d} MSX characters)${s}
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
    ld bc, ${t.tiles.reduce((a,n)=>{const o=Math.ceil(n.width/8),l=Math.ceil(n.height/8);return a+o*l*8},0)}    ; Total bytes for all tile characters (16x16 tiles = 4 chars each)
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_pattern_bank1:
    ; Load pattern bank 1: same patterns as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_pattern_bank0     ; Same source as Bank 0
    ld de, CHRTBL2 + #800 + (128 * 8) ; VRAM pattern table bank 1 (+#800 offset + char 128)
    ld bc, ${t.tiles.reduce((a,n)=>{const o=Math.ceil(n.width/8),l=Math.ceil(n.height/8);return a+o*l*8},0)}    ; Total bytes for all tile characters
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_pattern_bank2:
    ; Load pattern bank 2: same patterns as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_pattern_bank0     ; Same source as Bank 0
    ld de, CHRTBL2 + #1000 + (128 * 8) ; VRAM pattern table bank 2 (+#1000 offset + char 128)
    ld bc, ${t.tiles.reduce((a,n)=>{const o=Math.ceil(n.width/8),l=Math.ceil(n.height/8);return a+o*l*8},0)}    ; Total bytes for all tile characters
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
`}function st(t){var e;return!t.tiles||t.tiles.length===0?`; ==================================================================
; COLOR DATA (EMPTY - NO TILES DETECTED)
; File: colors.asm
; ==================================================================

; No tiles detected in project - file generated as placeholder
`:`; ==================================================================
; TILE COLOR DATA
; File: colors.asm
; Description: Tile color definitions for MSX Screen 2
; ${((e=t.tiles)==null?void 0:e.length)||0} tiles detected
; ==================================================================

; ==================================================================
; TILE COLOR BANK 0 (Base colors)
; ==================================================================
tile_color_bank0:
${t.tiles.map((a,n)=>{const o=Le(a),l=o?Array.from(o).map(i=>`#${i.toString(16).padStart(2,"0").toUpperCase()}`):["#F0","#F0","#F0","#F0","#F0","#F0","#F0","#F0"];return`    ; Tile ${n}: ${a.name} colors (fg/bg pairs)
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
    ld bc, ${t.tiles.reduce((a,n)=>{const o=Math.ceil(n.width/8),l=Math.ceil(n.height/8);return a+o*l*8},0)}     ; Total color bytes for all tile characters
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_color_bank1:
    ; Load color bank 1: same colors as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_color_bank0       ; Same source as Bank 0
    ld de, CLRTBL2 + #800 + (128 * 8) ; VRAM color table bank 1 (+#800 offset + char 128)
    ld bc, ${t.tiles.reduce((a,n)=>{const o=Math.ceil(n.width/8),l=Math.ceil(n.height/8);return a+o*l*8},0)}     ; Total color bytes for all tile characters
    call LDIRVM                   ; BIOS handles safe VRAM access
    ret

load_color_bank2:
    ; Load color bank 2: same colors as bank 0 (MSX Screen 2 standard)
    ; BIOS LDIRVM handles timing automatically
    ld hl, tile_color_bank0       ; Same source as Bank 0
    ld de, CLRTBL2 + #1000 + (128 * 8) ; VRAM color table bank 2 (+#1000 offset + char 128)
    ld bc, ${t.tiles.reduce((a,n)=>{const o=Math.ceil(n.width/8),l=Math.ceil(n.height/8);return a+o*l*8},0)}     ; Total color bytes for all tile characters
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
`}function dt(t,e,a){var d,p,s,c,_,m,S,T,r,h;const n=(p=(d=a.gameFlow)==null?void 0:d.nodes)==null?void 0:p.some(u=>u.type==="SubMenu"),o=(s=a.screenMaps)==null?void 0:s.some(u=>{var E,f;return((E=u.layers)==null?void 0:E.text)||((f=u.textElements)==null?void 0:f.length)>0}),l=(c=a.screenMaps)==null?void 0:c.some(u=>{var E;return((E=u.hudConfiguration)==null?void 0:E.elements)&&u.hudConfiguration.elements.length>0}),i=n||o||l;return`; ==================================================================
; ${e.toUpperCase()} - UNIFIED FILE
; File: unitedFiles.asm
; Description: All-in-one file combining all modular files
; Generated by Mideas MSX Modular Generator
;
; OPTIMIZED: Only includes necessary code for this project
; Tiles: ${((_=a.tiles)==null?void 0:_.length)||0}
; Sprites: ${((m=a.sprites)==null?void 0:m.length)||0}
; Screens: ${((S=a.screenMaps)==null?void 0:S.length)||0}
; Entities: ${((T=a.entities)==null?void 0:T.length)||0}
; Menus: ${n?"Yes":"No"}
; HUD: ${l?"Yes":"No"}
; State Machines: ${((r=a.stateMachines)==null?void 0:r.length)||0}
; ==================================================================

; CRITICAL: bios.asm and constants.asm must come BEFORE header.asm
; because header.asm uses WRTVDP (defined in bios.asm) and constants
${t["bios.asm"]}

${t["constants.asm"]}

${t["variables.asm"]}

${t["header.asm"]}

${t["interrupt.asm"]}

${a.tiles&&a.tiles.length>0?t["patterns.asm"]:`; [patterns.asm skipped - no tiles]
`}

${a.tiles&&a.tiles.length>0?t["colors.asm"]:`; [colors.asm skipped - no tiles]
`}

${a.sprites&&a.sprites.length>0?t["sprites.asm"]:`; [sprites.asm skipped - no sprites]
`}

${a.screenMaps&&a.screenMaps.length>0?t["screens.asm"]:`; [screens.asm skipped - no screens]
`}

${a.entities&&a.entities.length>0?t["components.asm"]:`; [components.asm skipped - no entities]
`}

${a.entities&&a.entities.length>0?t["entities.asm"]:`; [entities.asm skipped - no entities]
`}

${n?t["menus.asm"]:`; [menus.asm skipped - no menus]
`}

${i?t["font.asm"]:`; [font.asm skipped - no text/menus]
`}

${l?t["hud.asm"]:`; [hud.asm skipped - no HUD elements]
`}

${a.stateMachines&&a.stateMachines.length>0?t["statemachine.asm"]:`; [statemachine.asm skipped - no state machines]
`}

${a.gameFlow?t["gameflow.asm"]:`; [gameflow.asm skipped - no GameFlow]
`}

${((h=a.worldmaps)==null?void 0:h.length)>0?t["worlds.asm"]:`; [worlds.asm skipped - no WorldMaps]
`}

; ==================================================================
; MAIN PROGRAM (from main.asm - excluding includes)
; ==================================================================
main_program:
    ; Initialize game systems
    call init_game_systems

    ; Initialize interrupt task system (Konami-style H.TIMI hook)
    call init_interrupt_system

    ; Register default interrupt tasks based on project needs
${a.hasEntities||a.hasSprites?`    ; Task 0: Input polling (always enabled for responsive controls)
    ld a, 0
    ld hl, task_update_input
    call enable_task
`:""}
${a.hasEntities?`    ; Task 1: Physics update (project has entities with movement)
    ld a, 1
    ld hl, task_update_physics
    call enable_task
`:""}
${a.hasCollisions?`    ; Task 2: Collision detection (project has collision system)
    ld a, 2
    ld hl, task_update_collision
    call enable_task
`:""}
    ; Task 3: Sprites - NOT auto-registered (heavy task, enable manually when needed)

    ; Initialize Game Flow system
    xor a
    ld (current_flow_state), a
    ld (prev_flow_state), a

${(()=>{var u;if(a.gameFlow&&a.gameFlow.nodes&&a.gameFlow.connections){const E=a.gameFlow.nodes.find(f=>f.type==="Start");if(E){const f=a.gameFlow.connections.find(g=>{var C;return(typeof g.from=="string"?g.from:(C=g.from)==null?void 0:C.nodeId)===E.id});if(f){const g=typeof f.to=="string"?f.to:(u=f.to)==null?void 0:u.nodeId,I=a.gameFlow.nodes.find(C=>C.id===g);if(I){const C=I.type;return C==="WorldLink"?`    ; GameFlow: Start → WorldLink detected
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
${a.entities&&a.entities.length>0?`    ; Initialize component systems (entities detected)
    call init_components
`:`    ; No entities - skipping component system initialization
`}
${a.tiles&&a.tiles.length>0?`    ; Load pattern and color data (tiles detected)
    call load_pattern_bank0
    call load_pattern_bank1
    call load_pattern_bank2
    call load_color_bank0
    call load_color_bank1
    call load_color_bank2
`:`    ; No tiles detected - skipping pattern/color loading
`}
${a.entities&&a.entities.length>0?`    ; Initialize game entities with real positions from JSON
    call init_entities
`:`    ; No entities to initialize
`}
    ; Initialize sound system
    call GICINI               ; Initialize PSG

   

${a.screenMaps&&a.screenMaps.length>0?`    ; Load the first game screen
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

${a.entities&&a.entities.length>0?`    ; Update input first (needed by entities)
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
${a.entities&&a.entities.length>0?`    call update_input_component     ; Read input
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
${a.entities&&a.entities.length>0?`    call init_entities
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
${n?`    ; Menu system detected - render menu
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
; SCREEN LOADING STUB (for compatibility)
; ==================================================================
; NOTE: With GameFlow system, screen loading is handled by GameFlow nodes
; This stub exists for backward compatibility with existing code references
load_game_screen:
    ; GameFlow handles screen loading via WorldLink/Screen nodes
    ; This is just a compatibility stub
    ret

; ==================================================================
; STRINGS
; ==================================================================
${i?`
string_pause:     db "PAUSED", 0
string_game_over: db "GAME OVER", 0
`:"; No strings needed"}

    end                 ; End of assembly
`}const te={comp_pos:"Position",comp_position:"Position",comp_render:"Sprite",comp_sprite:"Sprite",comp_movement:"Movement",comp_velocity:"Movement",comp_collision:"Collision",comp_wall_collision:"WallCollision",comp_player_input:"Input",comp_input:"Input",comp_ai_behavior:"Behavior",comp_behavior:"Behavior",comp_health:"Health",comp_animation:"Animation",comp_gravity:"Gravity",comp_jump:"Jump",comp_damage:"Damage",comp_statemachine:"StateMachine",comp_cursors:"Cursors",comp_carry:"Carry",comp_collectible:"Collectible"};function ct(t,e){var i,d,p;const a=(i=e==null?void 0:e.components)==null?void 0:i.find(s=>s.definitionId==="comp_sprite"||s.definitionId==="comp_render");if(!a)return;const n=a.defaultValues||{},o=((d=t.componentOverrides)==null?void 0:d.comp_sprite)||((p=t.componentOverrides)==null?void 0:p.comp_render)||{},l={...n,...o};return l.spriteId||l.spriteAssetId||l.sprite||l.spriteName}function pe(t){var l;const e=new Set,a=new Set,n=[],o=new Map;return console.log("🔍 Analyzing component usage..."),console.log(`📊 Total entities in project: ${((l=t.entities)==null?void 0:l.length)||0}`),t.entities&&t.entities.length>0&&t.entities.forEach(i=>{console.log(`  - Entity: ${i.name} (template: ${i.entityTemplateId})`),n.push(i),i.entityTemplateId&&a.add(i.entityTemplateId)}),console.log(`✅ Active entities: ${n.length}`),console.log(`✅ Used templates: ${Array.from(a).join(", ")}`),n.forEach(i=>{var s;const d=i.name||i.id,p=(s=t.templates)==null?void 0:s.find(c=>c.id===i.entityTemplateId);p?(console.log(`  📦 Analyzing template "${p.name}" for entity "${d}"`),p.components&&Array.isArray(p.components)&&p.components.forEach(c=>{const _=c.definitionId||c.componentDefinitionId;if(_){const m=te[_]||_;console.log(`    - Component: ${_} → ${m}`),e.add(m),o.has(m)||o.set(m,new Set),o.get(m).add(d)}}),i.componentOverrides&&Object.keys(i.componentOverrides).forEach(c=>{const _=te[c]||c;console.log(`    - Override: ${c} → ${_}`),e.add(_),o.has(_)||o.set(_,new Set),o.get(_).add(d)})):console.warn(`  ⚠️  Template "${i.entityTemplateId}" not found for entity "${d}"`)}),console.log("📊 Component usage summary:"),console.log(`  - Total used components: ${e.size}`),e.forEach(i=>{const d=o.get(i);console.log(`    • ${i}: ${(d==null?void 0:d.size)||0} entities`)}),{usedComponents:e,usedTemplates:a,activeEntities:n,componentToEntitiesMap:o}}function ue(t,e,a){var i;let n=0;const o={Position:0,Sprite:1,Movement:2,Collision:3,Input:4,Behavior:5,Health:6,Animation:7,Jump:8,Gravity:9};let l=!1;if(e&&e.components&&e.components.forEach(d=>{const p=d.definitionId||d.componentDefinitionId,s=te[p];s&&o[s]!==void 0&&(n|=1<<o[s],s==="Sprite"&&(l=!0))}),t.componentOverrides&&Object.keys(t.componentOverrides).forEach(d=>{const p=te[d];p&&o[p]!==void 0&&(n|=1<<o[p],p==="Sprite"&&(l=!0))}),n|=1<<o.Position,l)n|=1<<o.Sprite;else{const d=ct(t,e);d&&((i=a.sprites)==null?void 0:i.some(s=>s.id===d||s.name===d))&&(n|=1<<o.Sprite)}return n}const pt=224,_t="hex";function ut(t){var S,T;const e=t.sprites||[];console.log("🎨 generateSpritesFile() called:"),console.log(`  - analysis.sprites.length: ${e.length}`),console.log(`  - analysis.entities.length: ${((S=t.entities)==null?void 0:S.length)||0}`),console.log(`  - analysis.templates.length: ${((T=t.templates)==null?void 0:T.length)||0}`);const{activeEntities:a}=pe(t);console.log(`  - activeEntities.length: ${a.length}`);const n=r=>{if(!r)return 0;const h=U.find(u=>u.hex.toUpperCase()===r.toUpperCase());return h?h.index:15},o=r=>{if(!r||!r.frames||r.frames.length===0)return[15];const h=new Set,u=r.frames[0].data;return u&&u.forEach(E=>{E.forEach(f=>{const g=n(f);g!==0&&h.add(g)})}),h.size===0?[15]:Array.from(h).sort((E,f)=>E-f)},l=r=>{var g,I,C,b,y,L;console.log(`
🔍 getEntitySpriteInfo for entity: "${r.name}" (template: ${r.entityTemplateId})`),console.log(`   Available sprites: ${e.map(A=>`"${A.name}" (${A.id})`).join(", ")||"NONE"}`);const h=(g=t.templates)==null?void 0:g.find(A=>A.id===r.entityTemplateId);if(!h)return console.log("   ❌ Template not found!"),null;console.log(`   Template found: "${h.name}"`),console.log(`   Template components: ${((I=h.components)==null?void 0:I.map(A=>A.definitionId).join(", "))||"NONE"}`);const u=t.components||[];let E;if(r.componentOverrides)for(const A in r.componentOverrides){const D=u.find(P=>P.id===A),R=(C=D==null?void 0:D.properties)==null?void 0:C.find(P=>P.type==="sprite_ref");if(R&&((b=r.componentOverrides[A])!=null&&b[R.name])){E=r.componentOverrides[A][R.name],console.log(`   ✅ Found spriteAssetId in overrides: "${E}"`);break}}if(!E)for(const A of h.components||[]){const D=u.find(P=>P.id===A.definitionId),R=(y=D==null?void 0:D.properties)==null?void 0:y.find(P=>P.type==="sprite_ref");if(R&&((L=A.defaultValues)!=null&&L[R.name])){E=A.defaultValues[R.name],console.log(`   ✅ Found spriteAssetId in template defaults: "${E}"`);break}}if(console.log(`   Resolved spriteAssetId: "${E||"undefined"}"`),!E)return console.log("   ⚠️ No sprite_ref property found in any component"),e.length>0?(console.log(`   ⚠️ Defaulting to first sprite "${e[0].name}"`),{spriteAssetIndex:0,spriteName:e[0].name,colors:o(e[0])}):null;let f=e.findIndex(A=>A.id===E);if(f<0&&(f=e.findIndex(A=>A.name===E)),f<0){const A=E.toLowerCase();f=e.findIndex(D=>{var R,P;return((R=D.name)==null?void 0:R.toLowerCase().includes(A))||A.includes(((P=D.name)==null?void 0:P.toLowerCase())||"")})}return f>=0?(console.log(`   ✅ Found sprite "${e[f].name}" at index ${f}`),{spriteAssetIndex:f,spriteName:e[f].name,colors:o(e[f])}):(console.log(`   ❌ Sprite "${E}" not found in project assets`),{spriteAssetIndex:-1,spriteName:`MISSING_${E}`,colors:[15]})},i=[];let d=0;a.forEach((r,h)=>{const u=l(r);if(!u){i.push({entityIndex:h,spriteName:"PLACEHOLDER",spriteAssetIndex:-1,baseHwSpriteIndex:d,layerCount:1,colors:[15]}),d+=1;return}i.push({entityIndex:h,spriteName:u.spriteName,spriteAssetIndex:u.spriteAssetIndex,baseHwSpriteIndex:d,layerCount:u.colors.length,colors:u.colors}),d+=u.colors.length});const p=32;let s=`; ==================================================================
; SPRITE DATA
; File: sprites.asm
; Description: Sprite pattern and animation data
; Entities: ${a.length}
; Total Hardware Sprites (Layers): ${p}
; ==================================================================

; ==================================================================
; SPRITE PATTERN DATA
; ==================================================================
`;e.forEach((r,h)=>{const u=`_${h}`,f=(r.name+u).replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase(),g=Oe(r,_t,h);let I=-1;for(let C=0;C<4;C++)if(g.includes(`${f}_F0_LAYER${C}:`)){I=C;break}s+=`
; Sprite Asset ${h}: ${r.name}
${g}`,I>=0?s+=`
; Unified pattern label for sprite ${h}
SPRITE_${h}_PATTERN EQU ${f}_F0_LAYER${I}
`:s+=`
; WARNING: No valid pattern layers found for sprite ${h}
SPRITE_${h}_PATTERN:
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

`,e.length===0&&(s+=`; No sprite assets found - using placeholder pattern only
SPRITE_0_PATTERN EQU SPRITE_PLACEHOLDER_PATTERN
`),s+=`
; ==================================================================
; SPRITE CONFIGURATION TABLES
; ==================================================================

; Table: Entity Sprite Configuration
; Format: db base_hw_sprite_index, layer_count
entity_sprite_config:
`,i.forEach(r=>{const h=r.baseHwSpriteIndex>=0?r.baseHwSpriteIndex:0;s+=`    db ${h}, ${r.layerCount} ; Entity ${r.entityIndex} (${r.spriteName})
`}),i.length<32&&(s+=`    ds ${(32-i.length)*2}, 0 ; Padding
`),s+=`
; Table: Hardware Sprite Layer Colors
; Format: db color_index
sprite_layer_colors:
`;let c=0;i.forEach(r=>{r.layerCount>0&&(s+=`    ; Entity ${r.entityIndex} (${r.spriteName}) layers:
`,r.colors.forEach((h,u)=>{s+=`    db ${h} ; Layer ${u}
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
`;let m=!1;if(i.forEach(r=>{if(r.layerCount===0)return;const h=r.spriteAssetIndex<0?"SPRITE_PLACEHOLDER_PATTERN":`SPRITE_${r.spriteAssetIndex}_PATTERN`;s+=`    ; Entity ${r.entityIndex}: ${r.spriteName} (${r.layerCount} layers)
    ; Base HW Sprite: ${r.baseHwSpriteIndex}
    ld hl, ${h}
    ld de, SPRPAT + (${r.baseHwSpriteIndex} * 32)
    ld bc, ${r.layerCount*32} ; Load ${r.layerCount} layers (32 bytes each)
    call LDIRVM
`,m=!0}),!m)if(e.length===0)s+=`    ; No sprites to load
`;else{s+=`    ; No active entities detected, load all sprite assets sequentially
`;let r=0;e.forEach((h,u)=>{var I;const E=o(h).length||1,f=((I=h.frames)==null?void 0:I.length)||1,g=E*f*32;s+=`    ; Sprite Asset ${u}: ${h.name} (${f} frames, ${E} layers)
    ld hl, SPRITE_${u}_PATTERN
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
SPRITE_INVISIBLE    EQU ${pt}

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
`}function mt(t){return`
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
`}function Et(){return`
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
    `}function Tt(t){const e=t.tiles&&t.tiles.length>0?t.tiles[0].width:16,a=t.tiles&&t.tiles.length>0?t.tiles[0].height:16,n=Math.floor(256/e),o=Math.floor(192/a),l=Number.isInteger(Math.log2(e))?Math.log2(e):4,i=Number.isInteger(Math.log2(a))?Math.log2(a):4,d=Array.from({length:l},(c,_)=>`    srl a; A = X / ${Math.pow(2,_+1)} `).join(`
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
${t.tiles&&t.tiles.length>0?`; Project tile analysis: ${t.tiles.map(c=>`${c.width}x${c.height}`).join(", ")}
    ; Using first tile as reference: ${e}x${a}
    ; Convert X to tile column(divide by ${e})`:`; No tiles detected - using default 16x16
        ; Convert X to tile column(divide by 16)`}

${d}
    ld c, a; C = tile column

        ; Convert Y to tile row(divide by ${a})
    ld a, b
${p}
    ld b, a; B = tile row

        ; Check if position is within valid tile map
    ld a, c
    cp ${n}; Screen width in tiles
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
        `}function St(){return`
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
    `}function ft(){return`
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
    `}function At(){return`
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
    `}function gt(){return`
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
    `}function It(){return`
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
    `}function Ct(){return`
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
    `}function bt(){return`
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
    `}function yt(t){const e=t.usedComponents;let a=`init_components:
; Initialize component systems(OPTIMIZED - only used components)
    ; Used: ${Array.from(e).join(", ")}

; Initialize current screen ID(multi - screen support)
        ld a, 0; Start at screen 0
        ld (current_screen_id), a

    ; Clear all component masks
        ld hl, entity_comp_masks
        ld de, entity_comp_masks + 1
        ld bc, 31
        ld (hl), 0
        ldir

    `;return a+=`    ; Initialize position system (always)
    call init_position_system
    `,e.has("Sprite")&&(a+=`    ; Initialize sprite system
    call init_sprite_system
    `),e.has("Movement")&&(a+=`    ; Initialize movement system
    call init_movement_system
    `),e.has("Collision")&&(a+=`    ; Initialize collision system
    call init_collision_system
    `),e.has("Input")&&(a+=`    ; Initialize input system
    call init_input_system
    `),e.has("Behavior")&&(a+=`    ; Initialize behavior system
    call init_behavior_system
    `),e.has("Health")&&(a+=`    ; Initialize health system
    call init_health_system
    `),e.has("Animation")&&(a+=`    ; Initialize animation system
    call init_animation_system
    `),e.has("Jump")&&(a+=`    ; Initialize jump system
    call init_jump_system
    `),e.has("Gravity")&&(a+=`    ; Initialize gravity system
    call init_gravity_system
    `),e.has("Cursors")&&(a+=`    ; Initialize cursors system (stub)
    call init_cursors_system
    `),e.has("StateMachine")&&(a+=`    ; Initialize state machine system (stub)
    call init_statemachine_system
    `),e.has("Carry")&&(a+=`    ; Initialize carry system (stub)
    call init_carry_system
    `),e.has("Damage")&&(a+=`    ; Initialize damage system (stub)
    call init_damage_system
    `),e.has("WallCollision")&&(a+=`    ; Initialize wall collision system (stub)
    call init_wallcollision_system
    `),e.has("Collectible")&&(a+=`    ; Initialize collectible system (stub)
    call init_collectible_system
    `),a+=`
    ret
    `,a}function Nt(t){if(!t.entities||t.entities.length===0)return`; ==================================================================
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
        `;const e=pe(t),a=e.usedComponents;console.log("🎯 Generating optimized components.asm..."),console.log(`  - Active entities: ${e.activeEntities.length} `),console.log(`  - Used components: ${Array.from(a).join(", ")} `),console.log(`  - Filtered out: ${8-a.size} unused components`);let n=`; ==================================================================
; GAME COMPONENT SYSTEMS - MSX ECS ENGINE
    ; File: components.asm
        ; Description: Component systems based on Mideas React.js architecture
    ; Implements Position, Sprite, Movement, Collision, Input, and Behavior systems
    ; ==================================================================
;
; INTELLIGENT FILTERING ACTIVE:
;   Active entities: ${e.activeEntities.length}
;   Used components: ${Array.from(a).join(", ")}
;   Filtered out: ${8-a.size} unused component systems
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

        ${yt(e)}
`;n+=ht();const o=t.sprites&&t.sprites.length>0;return a.has("Sprite")||o?n+=mt():n+=`
    ; Sprite system filtered out(not used)
init_sprite_system:
    ret

update_sprite_component:
    ret

force_update_entity_sprite:
    ret
    `,a.has("Movement")?n+=Et():n+=`
    ; Movement system filtered out(not used)
init_movement_system:
    ret

update_movement_component:
    ret
    `,a.has("Collision")?n+=Tt(t):n+=`
    ; Collision system filtered out(not used)
init_collision_system:
    ret

update_collision_component:
    ret
    `,a.has("Input")?n+=St():n+=`
    ; Input system filtered out(not used)
init_input_system:
    ret

update_input_component:
    ret
    `,a.has("Behavior")?n+=ft():n+=`
    ; Behavior system filtered out(not used)
init_behavior_system:
    ret

update_behavior_component:
    ret
    `,a.has("Health")?n+=gt():n+=`
    ; Health system filtered out(not used)
init_health_system:
    ret

update_health_component:
    ret
    `,a.has("Animation")?n+=It():n+=`
    ; Animation system filtered out(not used)
init_animation_system:
    ret

update_animation_component:
    ret
    `,a.has("Jump")?n+=Ct():n+=`
    ; Jump system filtered out(not used)
init_jump_system:
    ret

update_jump_component:
    ret
    `,a.has("Gravity")?n+=At():n+=`
    ; Gravity system filtered out(not used)
init_gravity_system:
    ret

update_gravity_component:
    ret
    `,a.has("Cursors")?n+=`
    ; Cursors system (stub - TODO: implement)
init_cursors_system:
    ret

update_cursors_component:
    ret
    `:n+=`
    ; Cursors system filtered out(not used)
init_cursors_system:
    ret

update_cursors_component:
    ret
    `,a.has("StateMachine")?n+=`
    ; StateMachine system (stub - TODO: implement)
init_statemachine_system:
    ret

update_statemachine_component:
    ret
    `:n+=`
    ; StateMachine system filtered out(not used)
init_statemachine_system:
    ret

update_statemachine_component:
    ret
    `,a.has("Carry")?n+=`
    ; Carry system (stub - TODO: implement)
init_carry_system:
    ret

update_carry_component:
    ret
    `:n+=`
    ; Carry system filtered out(not used)
init_carry_system:
    ret

update_carry_component:
    ret
    `,a.has("Damage")?n+=`
    ; Damage system (stub - TODO: implement)
init_damage_system:
    ret

update_damage_component:
    ret
    `:n+=`
    ; Damage system filtered out(not used)
init_damage_system:
    ret

update_damage_component:
    ret
    `,a.has("WallCollision")?n+=`
    ; WallCollision system (stub - TODO: implement)
init_wallcollision_system:
    ret

update_wallcollision_component:
    ret
    `:n+=`
    ; WallCollision system filtered out(not used)
init_wallcollision_system:
    ret

update_wallcollision_component:
    ret
    `,a.has("Collectible")?n+=`
    ; Collectible system (stub - TODO: implement)
init_collectible_system:
    ret

update_collectible_component:
    ret
    `:n+=`
    ; Collectible system filtered out(not used)
init_collectible_system:
    ret

update_collectible_component:
    ret
    `,n+=bt(),n+=`
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

`,n+=`
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

`,n+=`
    ; ==================================================================
; END OF COMPONENT SYSTEMS
    ; ==================================================================
        `,n}function Lt(t){var l,i,d,p;const a=pe(t).activeEntities,n=2;console.log("🎯 Generating optimized entities.asm..."),console.log(`  - Total entity templates in JSON: ${((l=t.templates)==null?void 0:l.length)||0}`),console.log(`  - Actually instantiated entities: ${a.length}`),console.log(`  - Filtered out: ${(((i=t.templates)==null?void 0:i.length)||0)-a.length} unused templates`);let o=`; ==================================================================
; GAME ENTITIES
; File: entities.asm
; Description: Game entity definitions and behavior
; ==================================================================
;
; INTELLIGENT FILTERING ACTIVE:
;   Entity templates in project: ${((d=t.templates)==null?void 0:d.length)||0}
;   Actually instantiated: ${a.length}
;   Filtered out: ${(((p=t.templates)==null?void 0:p.length)||0)-a.length} unused templates
;
; ==================================================================

`;return a.length>0?(o+=`; ==================================================================
; ENTITY DEFINITIONS
; ==================================================================

`,a.forEach((s,c)=>{var T;const _=s.name.toUpperCase().replace(/[^A-Z0-9]/g,"_"),m=(T=t.templates)==null?void 0:T.find(r=>r.id===s.entityTemplateId),S=ue(s,m,t);o+=`; Entity: ${s.name} (instance from template: ${s.entityTemplateId})
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
    ; Initialize all active game entities (${a.length} entities)
    
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
    
`,a.length>0?a.forEach(s=>{const c=s.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");o+=`    call init_${c.toLowerCase()}
`}):o+=`    ; No entities to initialize
`,o+=`    ret

update_entities:
    ; Update all active entities (${a.length} entities)
`,a.length>0?a.forEach(s=>{const c=s.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");o+=`    call update_${c.toLowerCase()}
`}):o+=`    ; No entities to update
`,o+=`    ret

`,a.forEach((s,c)=>{var D,R,P,K;const _=s.name.toUpperCase().replace(/[^A-Z0-9]/g,"_"),m=(D=t.templates)==null?void 0:D.find(w=>w.id===s.entityTemplateId),S=ue(s,m,t),T=(S&n)!==0,r=((R=s.position)==null?void 0:R.x)||100,h=((P=s.position)==null?void 0:P.y)||100,u=8,E=8,f=r*u,g=h*E,I=Math.min(f,240),C=Math.min(g,191);(f!==I||g!==C)&&console.warn(`Entity ${s.name} position clamped: (${f},${g}) → (${I},${C})`);const b=[];S&1&&b.push("Position"),S&2&&b.push("Sprite"),S&4&&b.push("Movement"),S&8&&b.push("Collision"),S&16&&b.push("Input"),S&32&&b.push("Behavior"),S&64&&b.push("Health"),S&128&&b.push("Animation");let y=15;if(S&16){const w=m==null?void 0:m.components.find(F=>F.definitionId==="comp_cursors"||F.definitionId==="comp_input"||F.definitionId==="comp_player_input");if(w){const F=w.defaultValues||{},ne=((K=s.componentOverrides)==null?void 0:K.comp_cursors)||{},G={...F,...ne};y=0,G.allowUp!==!1&&(y|=1),G.allowDown!==!1&&(y|=2),G.allowLeft!==!1&&(y|=4),G.allowRight!==!1&&(y|=8)}}const L=[];y&1&&L.push("UP"),y&2&&L.push("DOWN"),y&4&&L.push("LEFT"),y&8&&L.push("RIGHT");const A=L.length===4?"All directions":L.join("+");o+=`init_${_.toLowerCase()}:
    ; Initialize ${s.name} at real position from JSON
    ; JSON position: (${r}, ${h}) tiles = (${I}, ${C}) pixels
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
    ld (hl), ${(()=>{let w=0;return t.screenMaps&&t.screenMaps.forEach((F,ne)=>{F.layers.entities.some(G=>G.id===s.id)&&(w=ne)}),w})()}                 ; Screen ID (calculated from project data)

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
${t.sprites&&t.sprites.length>0?`
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
`,o}function Dt(t){if(!t.screenMaps||t.screenMaps.length===0)return`; ==================================================================
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
`;let e=`; ==================================================================
; SCREEN MAPS
; File: screens.asm
; Description: Screen layout and map data
; ==================================================================

`;return t.screenMaps&&t.screenMaps.length>0?(e+=`; ==================================================================
; SCREEN MAP CONSTANTS
; ==================================================================

`,t.screenMaps.forEach((a,n)=>{const o=a.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");e+=`SCREEN_${o}_${n}_ID EQU ${n}
`}),e+=`
; ==================================================================
; SCREEN MAP DATA
; ==================================================================

`,t.screenMaps.forEach(a=>{var n,o;if(a.layers&&a.layers.background){const l=[];if(t.tiles&&t.tiles.length>0){const r={...be[1],assignedTiles:{},charsetRangeStart:128,charsetRangeEnd:255,enabled:!0};let h=128;t.tiles.forEach(E=>{if(E&&E.id){const f=Math.ceil(E.width/8),g=Math.ceil(E.height/8);r.assignedTiles[E.id]={charCode:h,assignedAt:Date.now()},h+=f*g}});const u={id:"global_auto_bank",name:"Global Auto Bank",banks:[r,r,r]};l.push(u),console.log(`✅ Created GLOBAL tile bank with ${Object.keys(r.assignedTiles).length} assigned tiles`)}const i=[];a.activeAreaX,a.activeAreaY,a.activeAreaWidth??a.width,a.activeAreaHeight??a.height;const d=32,p=24;for(let T=0;T<p;T++)for(let r=0;r<d;r++){const h=(n=a.layers.background[T])==null?void 0:n[r];if(!h||!h.tileId)i.push(0);else{let u=0;const E=(o=t.tiles)==null?void 0:o.find(g=>g.id===h.tileId),f=l.length>0?l[0].banks:void 0;if(f&&E){let g=!1;for(const I of f)if((I.enabled??!0)&&I.assignedTiles[h.tileId]){const C=I.assignedTiles[h.tileId].charCode,b=Math.ceil(E.width/Y),y=h.subTileX||0,L=h.subTileY||0;if(u=C+L*b+y,u>=I.charsetRangeStart&&u<=I.charsetRangeEnd){g=!0;break}else u=0}g||(u=0)}else u=0;i.push(u)}}const s=i.filter(T=>T!==255).length,c=new Set(i);console.log(`📊 Generated ${i.length} bytes: ${s} non-FF (${(s/i.length*100).toFixed(1)}%)`),console.log(`🎯 Unique byte values: [${Array.from(c).sort((T,r)=>T-r).join(", ")}]`);const _=[];_.push('; Generated using exact Screen Editor "Download ASM" logic'),_.push("; Byte values represent actual character codes in VRAM");const m=`${a.name}_${t.screenMaps.indexOf(a)}`,S=xe(m,d,p,i,_,"hex");if(e+=S,a.layers.collision&&t.tiles){const T=a.layers.collision,r=[];T.forEach(u=>{u.forEach(E=>{var f;if(E.tileId){const g=t.tiles.find(C=>C.id===E.tileId),I=((f=g==null?void 0:g.logicalProperties)==null?void 0:f.mapId)||0;r.push(I)}else r.push(0)})});const h=we(m,a.width,a.height,r,"hex");e+=`
${h}`}}else{const l=t.screenMaps.indexOf(a),i=a.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");e+=`SCREEN_${i}_${l}_LAYOUT:
    ; Screen data for ${a.name}
    ; TODO: Add actual screen map data
    db 0, 0, 0, 0, 0, 0, 0, 0

`}e+=`
`}),e+=`; ==================================================================
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

`,t.screenMaps.forEach((a,n)=>{const o=a.name.toUpperCase().replace(/[^A-Z0-9]/g,"_"),l=a.backgroundColor!==void 0?a.backgroundColor:1,i=a.borderColor!==void 0?a.borderColor:1,d=a.id?`_${a.id.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";e+=`load_screen_${o.toLowerCase()}${d.toLowerCase()}:
    ; Load ${a.name} screen (BIOS LDIRVM handles timing)
    ; Set VDP colors FIRST (before loading screen data)
    ld a, ${l}           ; Background color
    ld b, ${i}       ; Border color
    call set_screen_colors
    ; Initialize character 0 (empty cells) with background color
    ld a, ${l}           ; Background color for char 0
    call init_char0_color
    ; Now load screen layout
    ld hl, SCREEN_${o}_${n}_LAYOUT
    ld de, NAMETBL
    ld bc, SCREEN_${o}_${n}_SIZE
    call LDIRVM                ; BIOS handles safe VRAM access
    ret

`})):e+=`; ==================================================================
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
`,e+=`
; ==================================================================
; END OF SCREENS
; ==================================================================
`,e}function Rt(t){var _,m,S,T;const e=(m=(_=t.gameFlow)==null?void 0:_.nodes)==null?void 0:m.some(r=>r.type==="SubMenu"),a=(S=t.screenMaps)==null?void 0:S.some(r=>{var h,u;return((h=r.layers)==null?void 0:h.text)||((u=r.textElements)==null?void 0:u.length)>0}),n=(T=t.screenMaps)==null?void 0:T.some(r=>{var h;return((h=r.hudConfiguration)==null?void 0:h.elements)&&r.hudConfiguration.elements.length>0});if(!e&&!a&&!n)return`; ==================================================================
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
`;const o=new Map,l=new Map,i=[{code:32,pattern:[0,0,0,0,0,0,0,0]},{code:43,pattern:[0,16,16,124,16,16,0,0]},{code:45,pattern:[0,0,0,126,0,0,0,0]},{code:124,pattern:[24,24,24,24,24,24,24,24]}];if(i.forEach(r=>{o.set(r.code,r.pattern),l.set(r.code,[240,240,240,240,240,240,240,240])}),t.fonts&&t.fonts.length>0){const r=t.fonts[0],h=r.data.fontData||{},u=r.data.fontColorAttributes||{},E=f=>{if(f.startsWith("rgba(0,0,0,0)"))return 0;const g=f.toUpperCase();return{"RGBA(0,0,0,0)":0,"#000000":1,"#21C842":2,"#5EDC78":3,"#5455ED":4,"#7D76FC":5,"#D4524D":6,"#42EBF5":7,"#FC5554":8,"#FF7978":9,"#D4C154":10,"#E6CE80":11,"#21B03B":12,"#C95BBA":13,"#CCCCCC":14,"#FFFFFF":15}[g]??15};Object.keys(h).forEach(f=>{const g=parseInt(f,10),I=h[g];if(Array.isArray(I)&&I.length===8)if(o.set(g,I),u[g]&&Array.isArray(u[g])){const C=u[g],b=[];for(let y=0;y<8;y++)if(C[y]&&typeof C[y]=="object"){const L=C[y].fg,A=C[y].bg,D=E(L),R=E(A);b.push(D<<4|R)}else b.push(240);l.set(g,b)}else l.set(g,[240,240,240,240,240,240,240,240])})}else{for(let r=48;r<=57;r++)o.set(r,[62,127,115,115,115,127,62,0]);for(let r=65;r<=90;r++)o.set(r,[62,127,99,127,127,99,99,0]);i.forEach(r=>o.set(r.code,r.pattern))}let d=`FONT_PATTERN_DATA:
`,p=`FONT_COLOR_DATA:
`,s=`FONT_CHAR_INDEX:
    DB `;const c=Array.from(o.keys()).filter(r=>r<128).sort((r,h)=>r-h);return c.forEach((r,h)=>{const u=o.get(r),E=l.get(r)||[240,240,240,240,240,240,240,240];d+=`    ; Char ${r} ('${String.fromCharCode(r)}')
`,d+=`    DB ${u.map(f=>"#"+f.toString(16).padStart(2,"0").toUpperCase()).join(", ")}
`,p+=`    ; Char ${r}
`,p+=`    DB ${E.map(f=>"#"+f.toString(16).padStart(2,"0").toUpperCase()).join(", ")}
`,s+=`${r}${h<c.length-1?", ":""}`}),s+=`
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
`}function Ot(t){var o;const e=[],a=new Map;if((o=t.screenMaps)==null||o.forEach(l=>{var d;const i=((d=l.hudConfiguration)==null?void 0:d.elements)||[];i.length>0&&(e.push(...i),a.set(l.id,i))}),e.length===0)return`; ==================================================================
; HUD SYSTEM (EMPTY - No HUD elements defined)
; ==================================================================
render_hud:
    ret
`;let n=`; ==================================================================
; HUD SYSTEM - Screen 2 Text Rendering
; ==================================================================
; Total HUD Elements: ${e.length}
; Screens with HUD: ${a.size}
;
; HUD Elements use TileBank fonts to render text in Screen 2 mode
; Each element can be positioned anywhere on screen (256x192 pixels)
; ==================================================================

`;return n+=Mt(e),n+=Pt(),n+=vt(),n}function Mt(t){let e=`; ------------------------------------------------------------------
; HUD DATA STRUCTURES
; ------------------------------------------------------------------

`;return e+=`HUD_ELEMENT_COUNT   EQU ${t.length}

`,e+=`; HUD Element Data Table
`,e+=`; Format: [Type:1][X:1][Y:1][Width:1][Height:1][Flags:1][TextPtr:2][Visible:1]
`,e+=`hud_element_data:
`,t.forEach((a,n)=>{const o=Ut(a.type),l=a.position.x,i=a.position.y,d=a.visible?1:0,p=`hud_text_${n}`;let s=0,c=1,_=0;const m=a.details||{};(m.border||m.borderColor||m.overallBorderColor)&&(_|=1),a.text?s=a.text.length:m.width?s=Math.ceil(m.width/8):s=10,e+=`    DB ${o}, ${l}, ${i}    ; Element ${n}: ${a.type} at (${l},${i})
`,e+=`    DB ${s}, ${c}, ${_} ; W, H, Flags
`,e+=`    DW ${p}             ; Text pointer
`,e+=`    DB ${d}                ; Visible
`}),e+=`
`,e+=`; HUD Text Strings
`,t.forEach((a,n)=>{const o=a.text||a.name||"",l=`hud_text_${n}`;e+=`${l}:
`,e+=`    DB "${o}", 0
`}),e+=`
`,e}function Pt(t){return`; ------------------------------------------------------------------
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

`}function Ut(t){return{[x.Score]:1,[x.HighScore]:2,[x.Lives]:3,[x.EnergyBar]:4,[x.ItemDisplay]:5,[x.SceneName]:6,[x.MiniMap]:7,[x.CoinCounter]:8,[x.BossEnergyBar]:9,[x.PhaseIndicator]:10,[x.AttackAlert]:11,[x.TextBox]:12,[x.NumericField]:13,[x.CustomCounter]:14}[t]||0}function re(t){return t.toLowerCase().replace(/[^a-z0-9]/g,"_")}function se(t){return t.toUpperCase().replace(/[^A-Z0-9]/g,"_")}function xt(t){const e=t.worldmaps||[];if(e.length===0)return`; ==================================================================
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
`;let a=`; ==================================================================
; WORLD MAPS
; File: worlds.asm
; Description: World map structures and screen loading functions
; Generated by Mideas MSX Generator
; ==================================================================

`;return a+=`; ==================================================================
; WORLD MAP CONSTANTS
; ==================================================================

`,e.forEach((n,o)=>{var d;const l=se(n.name||`world_${o}`),i=n.id||`world_${o}`;a+=`; World: ${n.name||"Unnamed"} (${i})
WORLD_${l}_ID EQU ${o}
WORLD_${l}_SCREEN_COUNT EQU ${((d=n.nodes)==null?void 0:d.length)||0}
`,n.nodes&&n.nodes.length>0&&n.nodes.forEach((p,s)=>{const c=se(p.name||`screen_${s}`);a+=`WORLD_${l}_SCREEN_${c}_ID EQU ${s}
`}),a+=`
`}),a+=`; ==================================================================
; WORLD LOADING FUNCTIONS
; ==================================================================

`,e.forEach(n=>{var m,S;re(n.name||"unnamed");const o=n.id||"unknown",l=n.startScreenNodeId,i=n.nodes||[];if(a+=`; ------------------------------------------------------------------
; Load World: ${n.name||"Unnamed"}
; World ID: ${o}
; Screens: ${i.length}
; Start Screen Node: ${l||"none"}
; ------------------------------------------------------------------
load_world_${re(o)}:
`,i.length===0){a+=`    ; No screens in this world
    ret

`;return}const p=(i.find(T=>T.id===l)||i[0]).screenAssetId;if(!p){a+=`    ; No valid start screen found
    ret

`;return}const s=(m=t.screens)==null?void 0:m.find(T=>T.id===p),c=((S=s==null?void 0:s.name)==null?void 0:S.toUpperCase().replace(/[^A-Z0-9]/g,"_"))||"UNKNOWN",_=p?`_${p.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";a+=`    ; Load start screen: ${(s==null?void 0:s.name)||"unknown"} (${p})
    call load_screen_${c.toLowerCase()}${_.toLowerCase()}

    ; Initialize world state
    ld a, WORLD_${se(n.name||"unnamed")}_ID
    ld (current_world_id), a

    ld a, ${i.findIndex(T=>T.id===l)}
    ld (current_screen_index), a

    ret

`}),a+=`; ==================================================================
; SCREEN TRANSITION FUNCTIONS
; ==================================================================

`,e.forEach(n=>{const o=n.id||"unknown",l=n.nodes||[],i=n.connections||[];if(i.length===0){a+=`; World ${n.name||"Unnamed"} has no screen connections

`;return}a+=`; ------------------------------------------------------------------
; World: ${n.name||"Unnamed"}
; Connections: ${i.length}
; ------------------------------------------------------------------

`,i.forEach((d,p)=>{var r,h;const s=l.find(u=>u.id===d.from||d.fromNodeId),c=l.find(u=>u.id===d.to||d.toNodeId);if(!s||!c){a+=`; Invalid connection ${p}: missing nodes

`;return}s.screenAssetId;const _=c.screenAssetId,m=(r=t.screens)==null?void 0:r.find(u=>u.id===_),S=((h=m==null?void 0:m.name)==null?void 0:h.toUpperCase().replace(/[^A-Z0-9]/g,"_"))||"UNKNOWN",T=_?`_${_.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";a+=`; Transition: ${s.name||"screen"} -> ${c.name||"screen"}
transition_${re(o)}_${p}:
    call load_screen_${S.toLowerCase()}${T.toLowerCase()}
    ret

`})}),a+=`; ==================================================================
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
`,a}function Z(t){t=t.replace("#","");const e=parseInt(t.substring(0,2),16),a=parseInt(t.substring(2,4),16),n=parseInt(t.substring(4,6),16);if(e<50&&a<50&&n<50)return 1;if(e>200&&a>200&&n>200)return 15;if(e>200&&a<100&&n<100)return 8;if(e<100&&a>200&&n<100)return 3;if(e<100&&a<100&&n>200)return 5;if(e>200&&a>200&&n<100)return 10;if(e>150&&a<100&&n>150)return 13;if(e<100&&a>150&&n>150)return 7;const o=(e+a+n)/3;return o<64?1:o<128?14:15}function wt(t){const e=t.gameFlow&&t.gameFlow.nodes&&t.gameFlow.nodes.some(n=>n.type==="SubMenu");if(!e)return`; ==================================================================
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
`;let a=`; ==================================================================
; GAME MENUS
; File: menus.asm
; Description: Menu systems and user interface with custom font support
; ==================================================================

`;return e?(a+=`; ==================================================================
; MENU CONSTANTS
; ==================================================================

`,t.gameFlow.nodes.filter(i=>i.type==="SubMenu").forEach((i,d)=>{const p=(i.title||i.id).toUpperCase().replace(/[^A-Z0-9]/g,"_");a+=`MENU_${p}_ID EQU ${d}
`}),a+=`
; ==================================================================
; MENU FUNCTIONS
; ==================================================================

`,t.gameFlow.nodes.filter(i=>i.type==="SubMenu").forEach(i=>{var m,S,T,r;(i.title||i.id).toUpperCase().replace(/[^A-Z0-9]/g,"_");const d=i.id.replace(/[^a-zA-Z0-9]/g,"_"),p=((S=(m=i.appearance)==null?void 0:m.colors)==null?void 0:S.background)||"#000000",s=((r=(T=i.appearance)==null?void 0:T.colors)==null?void 0:r.border)||"#FFFFFF",c=Z(p),_=Z(s);a+=`show_menu_${d}:
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

`}),t.gameFlow.nodes.filter(i=>i.type==="Text").forEach(i=>{var m,S,T,r;const d=i.id.replace(/[^a-zA-Z0-9]/g,"_"),p=((S=(m=i.appearance)==null?void 0:m.colors)==null?void 0:S.background)||"#000000",s=((r=(T=i.appearance)==null?void 0:T.colors)==null?void 0:r.border)||"#FFFFFF",c=Z(p),_=Z(s);a+=`show_text_${d}:
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

`})):a+=`; ==================================================================
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

`,a+=`; ==================================================================
; END OF MENUS
; ==================================================================
`,a}const kt={[N.SET_POSITION]:1,[N.MOVE_BY]:2,[N.SET_VELOCITY]:3,[N.APPLY_FORCE]:4,[N.CHANGE_SPRITE]:5,[N.PLAY_ANIMATION]:6,[N.SET_ANIMATION_SPEED]:7,[N.TOGGLE_ANIMATION]:8,[N.PLAY_SOUND]:9,[N.PLAY_MUSIC]:10,[N.MUTE_MUSIC]:11,[N.STOP_MUSIC]:12,[N.SET_VARIABLE]:13,[N.INCREMENT_VARIABLE]:14,[N.DECREMENT_VARIABLE]:15,[N.SET_COMPONENT_PROPERTY]:16,[N.WAIT]:17,[N.GOTO_STATE]:18,[N.DESTROY_ENTITY]:19,[N.SPAWN_ENTITY]:20,[N.GET_RANDOM_ENTITY_POSITION]:21,[N.CHANGE_GAME_FLOW_NODE]:22,[N.DECREASE_LIVES]:23,[N.INCREASE_LIVES]:24,[N.RESPAWN_PLAYER]:25,[N.BREAK_TILE]:26,[N.REPLACE_TILE]:27,[N.RND]:28,[N.POINT_AT]:29,[N.ADD_VARIABLES]:30,[N.SUBTRACT_VARIABLES]:31,[N.MULTIPLY_VARIABLES]:32,[N.DIVIDE_VARIABLES]:33,[N.MODULO_VARIABLES]:34,[N.ASSIGN_VARIABLE]:35,END:255},Bt={[O.AND]:1,[O.OR]:2,[O.NOT]:3,[O.KEY_PRESSED]:4,[O.KEY_RELEASED]:5,[O.TIME_OUT]:6,[O.CAN_MOVE_DIRECTION]:7,[O.HAS_COLLISION]:8,[O.PATH_CLEAR]:9,[O.ON_WALL_COLLISION]:10,[O.HAS_DEADLY_TILE_COLLISION]:11,[O.ANIMATION_COMPLETE]:12,[O.KEY_AND_MOVEMENT]:13,[O.VARIABLE_COMPARE]:14},Ft={x:0,y:1,vx:2,vy:3},he={"==":0,"!=":1,">":2,"<":3,">=":4,"<=":5},$t=`
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
    `;function Gt(t){let e=$t+`
`+Ht+`

`;e+=`; ==================================================================
`,e+=`; STATE MACHINE DATA
`,e+=`; ==================================================================

`;for(const a of t)e+=Vt(a);return e}function Vt(t){let e=`; State Machine: ${t.name} (${t.id}) 
`;const a=t.name.replace(/[^a-zA-Z0-9]/g,"_"),n=o=>{if(!o)return!1;const l=o.trim().toLowerCase();return l==="any"||l==="__any_state__"||l==="any state (*)"};for(const o of t.states){const l=`SM_${a}_${o.id.replace(/[^a-zA-Z0-9]/g,"_")}`,i=`${l}_OnEnter`,d=`${l}_OnExit`,p=`${l}_Transitions`;e+=`${l}: 
`,e+=`    DB 0; ID(unused) 
`,e+=`    DW ${o.onEnter&&o.onEnter.length>0?i:0} 
`,e+=`    DW ${o.onExit&&o.onExit.length>0?d:0} 
`;const s=t.transitions.filter(c=>c.fromStateId===o.id||n(c.fromStateId));if(e+=`    DW ${s.length>0?p:0} 
`,o.onEnter&&o.onEnter.length>0){e+=`${i}: 
`;for(const c of o.onEnter)e+=de(c,t.name);e+=`    DB 0xFF; END
`}if(o.onExit&&o.onExit.length>0){e+=`${d}: 
`;for(const c of o.onExit)e+=de(c,t.name);e+=`    DB 0xFF; END
`}s.length>0&&(e+=`${p}: 
`,e+=`    DB ${s.length}; Count
`,s.forEach((c,_)=>{const S=n(c.fromStateId)&&n(c.toStateId)?"0":`SM_${a}_${c.toStateId.replace(/[^a-zA-Z0-9]/g,"_")}`,T=c.actions&&c.actions.length>0?`${p}_Actions_${_}`:"0";if(c.conditions?e+=fe(c.conditions):e+=`    DB 0; Empty Condition(Always True) 
`,e+=`    DW ${S} 
`,e+=`    DW ${T} 
`,T!=="0"){e+=`${T}: 
`;for(const r of c.actions||[])e+=de(r,t.name);e+=`    DB 0xFF; END
`}})),e+=`
`}return e}function v(t){if(typeof t=="number")return t.toString();if(typeof t=="boolean")return t?"1":"0";if(typeof t=="string"){if(t==="true")return"1";if(t==="false")return"0";const e=parseInt(t,10);return isNaN(e)?"0":e.toString()}return"0"}function de(t,e=""){const a=kt[t.type];if(!a)return`; Unknown Action: ${t.type} 
`;let n=`    DB ${a}; ${t.type} 
`;switch(t.type){case N.SET_POSITION:case N.MOVE_BY:case N.SET_VELOCITY:case N.APPLY_FORCE:n+=`    DB ${v(t.params.x)}, ${v(t.params.y)} 
`;break;case N.CHANGE_SPRITE:n+=`    DB ${v(t.params.spriteId)} 
`;break;case N.PLAY_ANIMATION:n+=`    DB ${v(t.params.animationName)} 
`;break;case N.SET_ANIMATION_SPEED:n+=`    DB ${v(t.params.speed)} 
`;break;case N.TOGGLE_ANIMATION:n+=`    DB ${v(t.params.playing)} 
`;break;case N.PLAY_SOUND:n+=`    DB ${v(t.params.soundId)} 
`;break;case N.SET_VARIABLE:case N.INCREMENT_VARIABLE:case N.DECREMENT_VARIABLE:n+=`    DB ${v(t.params.variableId)}, ${v(t.params.value)} 
`;break;case N.WAIT:n+=`    DB ${v(t.params.duration)} 
`;break;case N.GOTO_STATE:if(e&&t.params.stateId){const o=`SM_${e.replace(/[^a-zA-Z0-9]/g,"_")}_${t.params.stateId.replace(/[^a-zA-Z0-9]/g,"_")} `;n+=`    DW ${o} 
`}else n+=`    DW 0; Invalid GOTO target
`;break;case N.SPAWN_ENTITY:n+=`    DB ${v(t.params.entityId)}, ${v(t.params.x)}, ${v(t.params.y)} 
`;break;case N.DESTROY_ENTITY:n+=`    DB 0
`;break;default:n+=`    ; Params not implemented for ${t.type}
`;break}return n}function fe(t){var n,o,l,i,d,p,s,c,_,m;const e=Bt[t.type];if(!e)return`; Unknown Condition: ${t.type} 
`;let a=`    DB ${e}; ${t.type} 
`;switch(t.type){case O.KEY_PRESSED:case O.KEY_RELEASED:a+=`    DB ${v((n=t.params)==null?void 0:n.key)}; Key Code
`;break;case O.TIME_OUT:a+=`    DB ${v((o=t.params)==null?void 0:o.duration)} 
`;break;case O.AND:case O.OR:if(t.conditions){a+=`    DB ${t.conditions.length} 
`;for(const S of t.conditions)a+=fe(S)}else a+=`    DB 0
`;break;case O.VARIABLE_COMPARE:{const S=((l=t.params)==null?void 0:l.variable)||"x",T=Ft[S];if(T===void 0)console.warn(`[State Machine Generator] Unknown variable "${S}" in VARIABLE_COMPARE. Using x (ID 0) as fallback.`),a+=`    DB 0, ${he[((i=t.params)==null?void 0:i.operator)||"=="]||0}, ${v(((d=t.params)==null?void 0:d.value)||0)}; FALLBACK: unknown var "${S}" -> x ${((p=t.params)==null?void 0:p.operator)||"=="} ${((s=t.params)==null?void 0:s.value)||0}
`;else{const r=he[((c=t.params)==null?void 0:c.operator)||"=="]||0,h=((_=t.params)==null?void 0:_.value)||0;a+=`    DB ${T}, ${r}, ${v(h)}; ${S} ${((m=t.params)==null?void 0:m.operator)||"=="} ${h}
`}break}}return a}function Yt(t){console.log("🎯 [INTERRUPT GENERATOR] Generating interrupt.asm...");let e="";return e+=`; ==================================================================
`,e+=`; INTERRUPT TASK SYSTEM - File: interrupt.asm
`,e+=`; Konami-style technique: Hook H.TIMI for 50/60Hz task execution
`,e+=`; ==================================================================

`,e+=Wt(),e+=zt(),e+=jt(),e+=Qt(),e+=Xt(),e+=Kt(t),console.log(`✅ [INTERRUPT GENERATOR] Generated interrupt.asm (${e.length} chars)`),e}function Wt(){return`; ==================================================================
; INTERRUPT SYSTEM MEMORY LAYOUT
; Location: C090h-C0B0h (32 bytes)
; ==================================================================

; Task table: 8 slots × 2 bytes (addresses) = 16 bytes
task_table              EQU #C090   ; Base address of task table
task_0_ptr              EQU #C090   ; Slot 0: Input polling (2 bytes)
task_1_ptr              EQU #C092   ; Slot 1: Physics update (2 bytes)
task_2_ptr              EQU #C094   ; Slot 2: Collision check (2 bytes)
task_3_ptr              EQU #C096   ; Slot 3: Sprite rendering (2 bytes)
task_4_ptr              EQU #C098   ; Slot 4: Frame counter (2 bytes)
task_5_ptr              EQU #C09A   ; Slot 5: User custom slot 1 (2 bytes)
task_6_ptr              EQU #C09C   ; Slot 6: User custom slot 2 (2 bytes)
task_7_ptr              EQU #C09E   ; Slot 7: User custom slot 3 (2 bytes)

; System state variables
interrupt_system_enabled  EQU #C0A0   ; 0=disabled, 1=enabled (1 byte)
old_htimi_hook           EQU #C0A1   ; Original H.TIMI hook (5 bytes: JP nnnn + padding)
interrupt_counter        EQU #C0A6   ; Frame counter (16-bit, C0A6-C0A7)
task_exec_time           EQU #C0A8   ; Cycles used by tasks - debug only (16-bit, C0A8-C0A9)

; End marker
RAM_INTERRUPT_END        EQU #C0B0   ; End of interrupt system memory (32 bytes total)

`}function zt(){return`; ==================================================================
; INIT_INTERRUPT_SYSTEM - Install H.TIMI hook
; ==================================================================
; Inputs: None
; Outputs: None
; Modifies: AF, BC, DE, HL
; ==================================================================
init_interrupt_system:
    di                          ; Disable interrupts during hook install

    ; --- STEP 1: Save original hook ---
    ld hl, #FD9F                ; H.TIMI address
    ld de, old_htimi_hook       ; Our backup location
    ld bc, 5                    ; Save 5 bytes (JP nnnn + padding)
    ldir                        ; Copy original hook to RAM

    ; --- STEP 2: Install our hook ---
    ; Write "JP interrupt_dispatcher" at FD9F
    ld a, #C3                   ; Opcode for JP
    ld (#FD9F), a               ; Write JP opcode
    ld hl, interrupt_dispatcher ; Address of our ISR
    ld (#FDA0), hl              ; Write address (little-endian)

    ; --- STEP 3: Initialize task table to 0 (all disabled) ---
    ld hl, task_table
    ld de, task_table+1
    ld bc, 15                   ; 8 slots × 2 bytes = 16 bytes - 1
    ld (hl), 0
    ldir                        ; Clear all task pointers

    ; --- STEP 4: Initialize counters ---
    xor a
    ld (interrupt_counter), a
    ld (interrupt_counter+1), a

    ; --- STEP 5: Mark system as enabled ---
    ld a, 1
    ld (interrupt_system_enabled), a

    ei                          ; Re-enable interrupts
    ret

`}function jt(){return`; ==================================================================
; STOP_INTERRUPT_SYSTEM - Restore original H.TIMI hook
; ==================================================================
; Inputs: None
; Outputs: None
; Modifies: AF, BC, DE, HL
; ==================================================================
stop_interrupt_system:
    di                          ; Disable interrupts

    ; Restore original hook
    ld hl, old_htimi_hook       ; Our backup
    ld de, #FD9F                ; H.TIMI location
    ld bc, 5                    ; Restore 5 bytes
    ldir

    ; Mark system as disabled
    xor a
    ld (interrupt_system_enabled), a

    ei                          ; Re-enable interrupts
    ret

`}function Qt(){return`; ==================================================================
; INTERRUPT_DISPATCHER - Main ISR (60Hz/50Hz)
; ==================================================================
; This routine executes on each V-Blank
; CRITICAL: Minimal CPU cycles, maximum efficiency
; Overhead: ~80 cycles base + ~40 cycles per active task
; ==================================================================
interrupt_dispatcher:
    ; --- STEP 1: Save MINIMAL registers (only what we use) ---
    push af                     ; 11 cycles
    push hl                     ; 11 cycles
    push bc                     ; 11 cycles
    ; Total: 33 cycles overhead

    ; --- STEP 2: Check if system is enabled ---
    ld a, (interrupt_system_enabled)
    or a
    jr z, .exit                 ; If disabled, exit quickly

    ; --- STEP 3: Increment frame counter ---
    ld hl, (interrupt_counter)
    inc hl
    ld (interrupt_counter), hl

    ; --- STEP 4: Walk through task table ---
    ld hl, task_table           ; HL = pointer to task table
    ld b, 8                     ; 8 slots

.task_loop:
    ; Read task pointer (16-bit address)
    ld a, (hl)                  ; Low byte
    inc hl
    ld c, a
    ld a, (hl)                  ; High byte
    inc hl
    or c                        ; Check if pointer == 0
    jr z, .next_task            ; Skip if disabled (pointer == 0)

    ; Valid pointer: execute task
    dec hl
    dec hl                      ; Back to low byte
    push bc                     ; Save loop counter
    push hl                     ; Save table position

    ; Load task address into HL
    ld c, (hl)                  ; Low byte
    inc hl
    ld h, (hl)                  ; High byte
    ld l, c                     ; HL = task address

    ; Call task using JP (HL) pattern (faster than indirect CALL)
    call .call_task             ; Call the task

    pop hl                      ; Restore table position
    pop bc                      ; Restore loop counter
    inc hl
    inc hl                      ; Advance to next slot
    jr .continue_loop

.next_task:
    ; Nothing to do, HL already points to next slot

.continue_loop:
    djnz .task_loop             ; Loop 8 times

.exit:
    ; --- STEP 5: Restore registers ---
    pop bc                      ; 10 cycles
    pop hl                      ; 10 cycles
    pop af                      ; 10 cycles

    ; --- STEP 6: Return from interrupt ---
    ; NOTE: For H.TIMI we use RET, not RETI
    ; RETI is only needed for IM 2 mode
    ei                          ; Re-enable interrupts
    ret                         ; Return from interrupt

; Helper for indirect call
.call_task:
    jp (hl)                     ; Jump to task (task will RET back here)

`}function Xt(){return`; ==================================================================
; TASK MANAGEMENT FUNCTIONS
; ==================================================================

; ==================================================================
; ENABLE_TASK - Activate a task in the system
; ==================================================================
; Inputs:
;   A = task slot (0-7)
;   HL = address of task routine
; Outputs: None
; Modifies: AF, BC, DE, HL
; ==================================================================
enable_task:
    ; Validate slot (0-7)
    cp 8
    ret nc                      ; Return if slot >= 8

    ; Calculate offset in table: slot * 2
    add a, a                    ; A = slot * 2
    ld e, a
    ld d, 0
    ld bc, task_table
    ex de, hl                   ; HL = offset, DE = task address
    add hl, bc                  ; HL = task_table + offset

    ; Write task address
    ex de, hl                   ; HL = task address, DE = slot location
    ld a, l
    ld (de), a                  ; Write low byte
    inc de
    ld a, h
    ld (de), a                  ; Write high byte

    ret

; ==================================================================
; DISABLE_TASK - Deactivate a task
; ==================================================================
; Inputs:
;   A = task slot (0-7)
; Outputs: None
; Modifies: AF, DE, HL
; ==================================================================
disable_task:
    ; Validate slot
    cp 8
    ret nc

    ; Calculate offset
    add a, a                    ; A = slot * 2
    ld e, a
    ld d, 0
    ld hl, task_table
    add hl, de                  ; HL = task_table + offset

    ; Write 0 (disable)
    xor a
    ld (hl), a                  ; Low byte = 0
    inc hl
    ld (hl), a                  ; High byte = 0

    ret

; ==================================================================
; GET_FRAME_COUNT - Get frame counter value
; ==================================================================
; Inputs: None
; Outputs: HL = frame count (16-bit)
; Modifies: HL
; ==================================================================
get_frame_count:
    ld hl, (interrupt_counter)
    ret

`}function Kt(t){let e="";return e+=`; ==================================================================
`,e+=`; DEFAULT INTERRUPT TASKS (60Hz Execution)
`,e+=`; ==================================================================

`,e+=`; ==================================================================
`,e+=`; TASK_UPDATE_INPUT - Joystick/Cursor polling at 60Hz
`,e+=`; ==================================================================
`,e+=`; This task guarantees responsive input (no missed button presses)
`,e+=`; Compatible with update_input_component existing function
`,e+=`; ==================================================================
`,e+=`task_update_input:
`,e+=`    push af
`,e+=`    push de

`,e+=`    ; Save previous state
`,e+=`    ld a, (input_state)
`,e+=`    ld (prev_input_state), a

`,e+=`    ; Read joystick 0 (cursors)
`,e+=`    xor a                       ; Joystick 0
`,e+=`    call GTSTCK                 ; BIOS call: A = direction
`,e+=`    ld (input_state), a

`,e+=`    ; TODO: Read trigger (button) if needed
`,e+=`    ; call GTTRIG

`,e+=`    pop de
`,e+=`    pop af
`,e+=`    ret

`,t.hasEntities?(e+=`; ==================================================================
`,e+=`; TASK_UPDATE_PHYSICS - Apply vx, vy -> X, Y
`,e+=`; ==================================================================
`,e+=`; Applies velocities to positions for all entities with Movement
`,e+=`; component. Ensures physics runs at fixed 60Hz.
`,e+=`; ==================================================================
`,e+=`task_update_physics:
`,e+=`    push af
`,e+=`    push bc
`,e+=`    push de
`,e+=`    push hl

`,e+=`    ; TODO: Implement full physics update
`,e+=`    ; Loop over entities with COMP_MASK_MOVEMENT
`,e+=`    ; Apply: entity_x_pos[i] += entity_vel_x[i]
`,e+=`    ;        entity_y_pos[i] += entity_vel_y[i]

`,e+=`    pop hl
`,e+=`    pop de
`,e+=`    pop bc
`,e+=`    pop af
`,e+=`    ret

`):e+=`; Task 1 (Physics): Not generated (no movement components detected)

`,t.hasCollisions?(e+=`; ==================================================================
`,e+=`; TASK_UPDATE_COLLISION - Collision detection
`,e+=`; ==================================================================
`,e+=`; Detects collisions using collision layers (bitmask system)
`,e+=`; AABB collision for 16x16 sprites
`,e+=`; ==================================================================
`,e+=`task_update_collision:
`,e+=`    push af
`,e+=`    push bc
`,e+=`    push de
`,e+=`    push hl

`,e+=`    ; TODO: Implement collision detection
`,e+=`    ; Loop over entities with COMP_MASK_COLLISION
`,e+=`    ; Check: collisionLayer & collidesWith for each pair
`,e+=`    ; AABB test: |X1-X2| < 16 && |Y1-Y2| < 16

`,e+=`    pop hl
`,e+=`    pop de
`,e+=`    pop bc
`,e+=`    pop af
`,e+=`    ret

`):e+=`; Task 2 (Collision): Not generated (no collision detection needed)

`,t.hasSprites?(e+=`; ==================================================================
`,e+=`; TASK_UPDATE_SPRITES - Update sprites to VRAM
`,e+=`; ==================================================================
`,e+=`; WARNING: This task is HEAVY (~800 cycles)
`,e+=`; Consider executing every N frames instead of every frame
`,e+=`; ==================================================================
`,e+=`task_update_sprites:
`,e+=`    push af
`,e+=`    push bc
`,e+=`    push de
`,e+=`    push hl

`,e+=`    ; Call existing sprite update function
`,e+=`    call update_sprites_to_vram

`,e+=`    pop hl
`,e+=`    pop de
`,e+=`    pop bc
`,e+=`    pop af
`,e+=`    ret

`):e+=`; Task 3 (Sprites): Not generated (no sprites in project)

`,e+=`; ==================================================================
`,e+=`; TASK_FRAME_COUNTER - Custom timing/animations
`,e+=`; ==================================================================
`,e+=`; Placeholder for user-defined frame-based timing
`,e+=`; Example: Increment animation timers, etc.
`,e+=`; ==================================================================
`,e+=`task_frame_counter:
`,e+=`    ; Placeholder - counter is already incremented in dispatcher
`,e+=`    ; Add custom timing logic here if needed
`,e+=`    ret

`,e+=`; ==================================================================
`,e+=`; USER CUSTOM TASK SLOTS (5-7)
`,e+=`; ==================================================================
`,e+=`; These slots are reserved for user-defined tasks
`,e+=`; Enable them dynamically using:
`,e+=`;   LD A, 5                    ; Slot 5
`,e+=`;   LD HL, my_custom_task
`,e+=`;   CALL enable_task
`,e+=`; ==================================================================

`,e}function Zt(t,e,a={}){var l;if(console.log("🔧 Generating modular ASM files..."),!t)throw console.error("❌ projectName is required"),new Error("projectName is required");if(!e)throw console.error("❌ assets is undefined or null"),new Error("assets array is required");if(!Array.isArray(e))throw console.error("❌ assets is not an array"),new Error("assets must be an array");console.log(`📊 Project: ${t}, Assets: ${e.length}, Config:`,a);let n;try{n=ce(t,e),console.log(`🔍 Analysis complete: ${n.sprites.length} sprites, ${n.tiles.length} tiles`)}catch(i){console.error("❌ Error analyzing project:",i),n={hasSprites:!1,hasTiles:!1,hasScreens:!1,hasEntities:!1,hasComponents:!1,hasGameFlow:!1,hasMenus:!1,hasFonts:!1,hasECS:!1,hasMultipleScreens:!1,hasAnimations:!1,hasCollisions:!1,hasMenuSystem:!1,components:[],templates:[],entities:[],sprites:[],tiles:[],screens:[],screenMaps:[],projectName:t,customStates:[],stateMachines:[],globalVariables:[]},console.log("🔄 Using fallback empty analysis")}console.log("📝 [MSX GENERATOR] Generating all ASM files...");const o={"bios.asm":Xe(),"constants.asm":Ze(n),"variables.asm":Je(n),"interrupt.asm":Yt(n),"header.asm":et(t,n),"patterns.asm":rt(n),"colors.asm":st(n),"components.asm":Nt(n),"entities.asm":Lt(n),"worlds.asm":xt(n),"screens.asm":Dt(n),"sprites.asm":ut(n),"font.asm":Rt(n),"hud.asm":Ot(n),"menus.asm":wt(n),"statemachine.asm":n.stateMachines?Gt(n.stateMachines):`; No State Machines
`,"gameflow.asm":at(n),"main.asm":lt(t,n),"unitedFiles.asm":""};return a.generateUnified&&(o["unitedFiles.asm"]=dt(o,t,n)),console.log("✅ Modular ASM files generated successfully!"),console.log(`📊 Generated ${Object.keys(o).filter(i=>o[i]).length} files`),console.log("📋 [DEBUG] Files generated:",Object.keys(o)),console.log("🎯 [DEBUG] interrupt.asm length:",((l=o["interrupt.asm"])==null?void 0:l.length)||"MISSING!"),o}const an=Object.freeze(Object.defineProperty({__proto__:null,generateModularASM:Zt},Symbol.toStringTag,{value:"Module"}));export{Oa as $,za as A,Y as B,ja as C,oa as D,ia as E,xe as F,we as G,x as H,fa as I,Sa as J,Ue as K,Za as L,na as M,Ua as N,ee as O,ta as P,Qa as Q,Ka as R,ae as S,Xa as T,ge as U,ya as V,Aa as W,Ia as X,ga as Y,pa as Z,La as _,_a as a,Da as a0,Ca as a1,ba as a2,Ra as a3,Na as a4,Ma as a5,H as a6,J as a7,ma as a8,qa as a9,ra as aa,la as ab,ie as ac,en as ad,va as ae,ke as af,O as ag,N as ah,aa as ai,ce as aj,tn as ak,xa as al,da as am,be as an,ha as ao,Pa as ap,sa as aq,wa as ar,an as as,ca as b,ua as c,j as d,Ba as e,Ea as f,ka as g,Ta as h,Ne as i,Le as j,U as k,qt as l,ea as m,q as n,$a as o,Ha as p,Ga as q,Va as r,Fa as s,Ya as t,Q as u,X as v,Oe as w,Wa as x,Jt as y,Ja as z};
