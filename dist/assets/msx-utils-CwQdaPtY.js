var ie=(e=>(e.Score="Score",e.HighScore="HighScore",e.Lives="Lives",e.EnergyBar="EnergyBar",e.ItemDisplay="ItemDisplay",e.SceneName="SceneName",e.MiniMap="MiniMap",e.CoinCounter="CoinCounter",e.BossEnergyBar="BossEnergyBar",e.PhaseIndicator="PhaseIndicator",e.AttackAlert="AttackAlert",e.TextBox="TextBox",e.NumericField="NumericField",e.CustomCounter="CustomCounter",e))(ie||{});const nt={water:{maskValue:1},customGravity:{maskValue:2},icePhysics:{maskValue:4},spriteConceal:{maskValue:8}},Cl={secretZone:{label:"Secret Zone",color:"rgba(255, 209, 102, 0.38)"},wind:{label:"Wind",color:"rgba(91, 192, 235, 0.34)"},water:{label:"Water",color:"rgba(50, 100, 200, 0.4)"},customGravity:{label:"Custom Gravity",color:"rgba(150, 50, 200, 0.4)"},icePhysics:{label:"Ice Physics",color:"rgba(100, 200, 255, 0.4)"},spriteConceal:{label:"Sprite Concealment",color:"rgba(100, 100, 100, 0.4)"}},ut={direction:"right",strength:1},Hi=e=>{switch(e){case"wind":return{...ut};default:return{}}},Il=(e,l)=>{const a=l||{};if(e==="wind"){const t=["left","right","up","down"],o=typeof a.direction=="string"?a.direction:ut.direction,n=t.includes(o)?o:ut.direction,s=typeof a.strength=="number"?a.strength:parseInt(String(a.strength??""),10);return{direction:n,strength:Number.isFinite(s)?Math.max(0,s):ut.strength}}return{}},vl=e=>{if(e.effectType&&e.effectType in Cl)return e.effectType;const l=e.mask??0;return(l&nt.water.maskValue)!==0?"water":(l&nt.customGravity.maskValue)!==0?"customGravity":(l&nt.icePhysics.maskValue)!==0?"icePhysics":(l&nt.spriteConceal.maskValue)!==0?"spriteConceal":"secretZone"};var Rl=(e=>(e.None="None",e.Tile="Tile",e.Sprite="Sprite",e.Screen="Screen",e.Code="Code",e.Attributes="Attributes",e.Sound="Sound",e.Platformer="Platformer",e.WorldMap="WorldMap",e.Track="Track",e.HUD="HUD",e.TileBanks="TileBanks",e.Font="Font",e.HelpDocs="HelpDocs",e.BehaviorEditor="BehaviorEditor",e.ComponentDefinitionEditor="ComponentDefinitionEditor",e.EntityTemplateEditor="EntityTemplateEditor",e.Boss="Boss",e.WorldView="WorldView",e.GameFlow="GameFlow",e.MainMenu="MainMenu",e.PresentationScreen="PresentationScreen",e.StateMachine="StateMachine",e.GlobalVariables="GlobalVariables",e.Palette="Palette",e))(Rl||{});const Vi=[1,3,5,7],Gi=[{id:0,name:"NoSolid (Passable)",isSolid:!1},{id:1,name:"Solid (Wall/Ground)",isSolid:!0},{id:2,name:"Platform (Top-Solid)",isSolid:!0},{id:3,name:"Slope (Solid)",isSolid:!0}],Wi={isBreakable:{bit:0,label:"Breakable"},isMovable:{bit:1,label:"Movable"},causesDamage:{bit:2,label:"Deadly"},isInteractiveSwitch:{bit:3,label:"Interactable"}},Yi="0.267",Ze=[{name:"Transparent",hex:"rgba(0,0,0,0)"},{name:"Black",hex:"#000000"},{name:"Medium Green",hex:"#3EB847"},{name:"Light Green",hex:"#74D07D"},{name:"Dark Blue",hex:"#2F2FC1"},{name:"Light Blue",hex:"#5858FC"},{name:"Dark Red",hex:"#B63125"},{name:"Cyan",hex:"#68D2DA"},{name:"Medium Red",hex:"#FC584A"},{name:"Light Red",hex:"#FF8E81"},{name:"Dark Yellow",hex:"#C0BF3B"},{name:"Light Yellow",hex:"#E7E474"},{name:"Dark Green",hex:"#309337"},{name:"Magenta",hex:"#B640C8"},{name:"Gray",hex:"#999999"},{name:"White",hex:"#FFFFFF"}],ce=[{name:"Transparent (Backdrop)",hex:"rgba(0,0,0,0)",index:0},{name:"Black",hex:"#000000",index:1},{name:"Medium Green",hex:"#21C842",index:2},{name:"Light Green",hex:"#5EDC78",index:3},{name:"Dark Blue",hex:"#5455ED",index:4},{name:"Light Blue",hex:"#7D76FC",index:5},{name:"Dark Red",hex:"#D4524D",index:6},{name:"Cyan",hex:"#42EBF5",index:7},{name:"Medium Red",hex:"#FC5554",index:8},{name:"Light Red",hex:"#FF7978",index:9},{name:"Dark Yellow",hex:"#D4C154",index:10},{name:"Light Yellow",hex:"#E6CE80",index:11},{name:"Dark Green",hex:"#21B03B",index:12},{name:"Magenta",hex:"#C95BBA",index:13},{name:"Gray",hex:"#CCCCCC",index:14},{name:"White",hex:"#FFFFFF",index:15}],Se=[0,36,73,109,146,182,219,255],Ge=e=>e.toString(16).padStart(2,"0").toUpperCase(),Qi=(()=>{const e=[];for(let l=0;l<Se.length;l++)for(let a=0;a<Se.length;a++)for(let t=0;t<Se.length;t++){const o=l<<6|a<<3|t;e.push({index:o,hex:`#${Ge(Se[l])}${Ge(Se[a])}${Ge(Se[t])}`,rLevel:l,gLevel:a,bLevel:t})}return e})(),Nt=e=>{let l=0,a=1/0;return Se.forEach((t,o)=>{const n=Math.abs(t-e);n<a&&(a=n,l=o)}),l},wl=e=>!e||!e.startsWith("#")||e.length!==7?"#000000":e.toUpperCase(),Nl=e=>{const l=wl(e),a=parseInt(l.slice(1,3),16),t=parseInt(l.slice(3,5),16),o=parseInt(l.slice(5,7),16),n=Nt(a),s=Nt(t),r=Nt(o),i=`#${Ge(Se[n])}${Ge(Se[s])}${Ge(Se[r])}`,c=n<<6|s<<3|r;return{hex:i,masterIndex:c}},Xi=Ze.map((e,l)=>{if(l===0)return{slotIndex:0,masterIndex:-1,hex:"rgba(0,0,0,0)"};const a=Nl(e.hex);return{slotIndex:l,masterIndex:a.masterIndex,hex:a.hex}}),Ki=[8,16,24,32],Zi=16,qi=16,Ji=16,Be=32,ft=24,Ke=8,Re=255,es="SCREEN 2 (Graphics I)",ts=["ADC","ADD","AND","BIT","CALL","CCF","CP","CPD","CPDR","CPI","CPIR","CPL","DAA","DEC","DI","DJNZ","EI","EX","EXX","HALT","IM","IN","INC","IND","INDR","INI","INIR","JP","JR","LD","LDD","LDDR","LDI","LDIR","NEG","NOP","OR","OTDR","OTIR","OUT","OUTD","OUTI","POP","PUSH","RES","RET","RETI","RETN","RL","RLA","RLC","RLCA","RLD","RR","RRA","RRC","RRCA","RRD","RST","SBC","SCF","SET","SLA","SLL","SRA","SRL","SUB","XOR"],as=["A","F","B","C","D","E","H","L","AF","BC","DE","HL","IXH","IXL","IYH","IYL","IX","IY","SP","PC","I","R","AF'"],ls=["NZ","Z","NC","C","PO","PE","P","M"],os=[".ORG","ORG","END",".END",".EQU","EQU",".DB","DB",".BYTE","BYTE","DEFB",".DW","DW",".WORD","WORD","DEFW",".DS","DS",".BLOCK","BLOCK","DEFS",".DEFINE","DEFINE",".MACRO","MACRO",".ENDM","ENDM",".IF","IF",".ENDIF","ENDIF",".ELSE","ELSE",".INCLUDE","INCLUDE",".DEFM","DEFM",".ZILOG",".PHASE",".REPT",".ENDR",".SEARCH",".RANDOM",".ROM",".MEGAROM",".BASIC",".CAS",".WAV",".MSXDOS"],ns=[{id:"pac_man_collection",name:"Pac-Man Tile Collection",code:`; Pac-Man Style Tile Collection System for MSX
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
POWER_MODE:         DB 0       ; Power-up mode active flag`}],rs=[],It=8,qe=15,Je=1;var Qa;const is=((Qa=ce.find(e=>e.index===qe))==null?void 0:Qa.hex)||ce[15].hex;var Xa;const ss=((Xa=ce.find(e=>e.index===Je))==null?void 0:Xa.hex)||ce[1].hex,bt=new Map(ce.map(e=>[e.hex,e])),ds=new Map(ce.map(e=>[e.index,e])),cs=ce[1],_s=32,ps=125,hs=6,us=31,ms=15,fs=["A","B","C"],bs=["1","2","3","4","5"],ys=["C-","C#","D-","D#","E-","F-","F#","G-","G#","A-","A#","B-"],Es=32,gs={q:{noteNameIndex:0,baseOctave:5},w:{noteNameIndex:1,baseOctave:5},e:{noteNameIndex:2,baseOctave:5},r:{noteNameIndex:3,baseOctave:5},t:{noteNameIndex:4,baseOctave:5},y:{noteNameIndex:5,baseOctave:5},u:{noteNameIndex:6,baseOctave:5},i:{noteNameIndex:7,baseOctave:5},o:{noteNameIndex:8,baseOctave:5},p:{noteNameIndex:9,baseOctave:5},"[":{noteNameIndex:10,baseOctave:5},"]":{noteNameIndex:11,baseOctave:5},a:{noteNameIndex:0,baseOctave:4},s:{noteNameIndex:1,baseOctave:4},d:{noteNameIndex:2,baseOctave:4},f:{noteNameIndex:3,baseOctave:4},g:{noteNameIndex:4,baseOctave:4},h:{noteNameIndex:5,baseOctave:4},j:{noteNameIndex:6,baseOctave:4},k:{noteNameIndex:7,baseOctave:4},l:{noteNameIndex:8,baseOctave:4},ñ:{noteNameIndex:9,baseOctave:4},";":{noteNameIndex:9,baseOctave:4},"'":{noteNameIndex:10,baseOctave:4},z:{noteNameIndex:0,baseOctave:3},x:{noteNameIndex:1,baseOctave:3},c:{noteNameIndex:2,baseOctave:3},v:{noteNameIndex:3,baseOctave:3},b:{noteNameIndex:4,baseOctave:3},n:{noteNameIndex:5,baseOctave:3},m:{noteNameIndex:6,baseOctave:3},",":{noteNameIndex:7,baseOctave:3},".":{noteNameIndex:8,baseOctave:3},2:{noteNameIndex:1,baseOctave:5},3:{noteNameIndex:3,baseOctave:5},5:{noteNameIndex:6,baseOctave:5},6:{noteNameIndex:8,baseOctave:5},7:{noteNameIndex:10,baseOctave:5}},Ss={min:-2,max:2},As=[{id:1,name:"Piano",volumeEnvelope:[15,14,13,11,9,7,5,3,2,1,0],toneEnvelope:[0],volumeLoop:255,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1},{id:2,name:"Electric Bass",volumeEnvelope:[15,14,13,12,11,10,9,8],toneEnvelope:[0],volumeLoop:3,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:12},{id:3,name:"Lead Vibrato",volumeEnvelope:[0,5,10,15,15,15,14,13,12],toneEnvelope:[0,1,2,1,0,-1,-2,-1],volumeLoop:4,toneLoop:0,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:13},{id:4,name:"Strings Pad",volumeEnvelope:[0,2,4,6,8,10,12,14,15,15,15],toneEnvelope:[0,0,1,1,0,0,-1,-1],volumeLoop:8,toneLoop:0,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:13},{id:5,name:"Kick Drum",volumeEnvelope:[15,13,10,7,4,2,0],toneEnvelope:[12,10,8,6,4,2,0],volumeLoop:255,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:0},{id:6,name:"Snare Drum",volumeEnvelope:[15,12,9,6,3,1,0],toneEnvelope:[0],volumeLoop:255,toneLoop:255,ayToneEnabled:!1,ayNoiseEnabled:!0,ayEnvelopeShape:0},{id:7,name:"Hi-Hat",volumeEnvelope:[12,10,8,6,4,2,0],toneEnvelope:[0],volumeLoop:255,toneLoop:255,ayToneEnabled:!1,ayNoiseEnabled:!0,ayEnvelopeShape:0},{id:8,name:"Arpeggio",volumeEnvelope:[15,15,14,14,13,13,12,12],toneEnvelope:[0,4,7,12,7,4,0],volumeLoop:0,toneLoop:0,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:10},{id:9,name:"Organ",volumeEnvelope:[15,15,15,15,15],toneEnvelope:[0],volumeLoop:0,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:13},{id:10,name:"Bell",volumeEnvelope:[15,14,12,10,8,6,4,3,2,1,0],toneEnvelope:[0,12,0],volumeLoop:255,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:0}],Ts=[{id:"bank_0",name:"Bank 0 - HUD/Fonts",enabled:!0,vramPatternStart:0,vramColorStart:8192,screenZone:{x:0,y:0,width:Be,height:8},charsetRangeStart:0,charsetRangeEnd:255,defaultFgColorIndex:15,defaultBgColorIndex:4,isLocked:!1,assignedTiles:{}},{id:"bank_1",name:"Bank 1 - Game Tileset",enabled:!0,vramPatternStart:2048,vramColorStart:10240,screenZone:{x:0,y:8,width:Be,height:8},charsetRangeStart:0,charsetRangeEnd:255,defaultFgColorIndex:2,defaultBgColorIndex:1,isLocked:!1,assignedTiles:{}},{id:"bank_2",name:"Bank 2 - Background/Status",enabled:!0,vramPatternStart:4096,vramColorStart:12288,screenZone:{x:0,y:16,width:Be,height:8},charsetRangeStart:0,charsetRangeEnd:255,defaultFgColorIndex:11,defaultBgColorIndex:6,isLocked:!1,assignedTiles:{}}],Cs={isEnabled:!0,options:[{id:"start",label:"INICIAR PARTIDA",enabled:!0},{id:"continue",label:"CONTINUAR",enabled:!0},{id:"settings",label:"AJUSTES",enabled:!0},{id:"help",label:"AYUDA",enabled:!1}],keyMapping:{up:"ArrowUp",down:"ArrowDown",left:"ArrowLeft",right:"ArrowRight",fire1:" ",fire2:"m"},settings:{volume:12},continueScreen:{title:"CONTINUAR PARTIDA",prompt:"INTRODUCE TU CODIGO"},introScreen:{text:`EN EL ANO 2084, LA CORPORACION CYBERNETICA DOMINA EL MUNDO...

SOLO UN HEROE PUEDE DETENERLOS.`,backgroundAssetId:null},menuScreenAssetId:null,cursorSpriteAssetId:null,menuColors:{text:ce[15].hex,background:ce[4].hex,highlightText:ce[11].hex,highlightBackground:ce[5].hex,border:ce[15].hex}},Is={enabled:!1,name:"Presentation Screen",sourceFileName:null,sourceImageWidth:0,sourceImageHeight:0,screenMode:"SCREEN 2",paletteMode:"MSX1",conversion:{dither:"none",backgroundColorIndex:4,preferExistingPalette:!1,twoColorsPer8PixelRow:!0,deduplicatePatterns:!0},preview:{paletteIndices:[],uniqueCharsPerBank:[0,0,0],totalUniqueChars:0,warning:null},data:{nameTable:[],patternBank0:[],patternBank1:[],patternBank2:[],colorBank0:[],colorBank1:[],colorBank2:[],patternCountBank0:0,patternCountBank1:0,patternCountBank2:0},compression:{codec:"ZX0",compressNameTable:!0,compressPatterns:!0,compressColors:!0},runtime:{showAtBoot:!1,clearSpritesBeforeShow:!0,waitForKey:!0,waitForFrames:0,romDataGroup:"auto"},updatedAt:null,lastImportError:null},vs="HELP_DOCS_SYSTEM_ASSET",Rs=[{id:"getting_started",title:"Getting Started",articles:[{id:"welcome",title:"Welcome to MSX Retro IDE",content:`
          <h2>Welcome!</h2>
          <p>This IDE is designed to help you create games for the MSX (MSX1/MSX2) platform.</p>
          <p>Key features include:</p>
          <ul>
            <li>Visual Tile Editor with Tile Banks support</li>
            <li>Sprite Editor with animation support</li>
            <li>Screen Map Editor with Effect Zones and HUD config</li>
            <li>Integrated Z80 Code Editor with snippets</li>
            <li>World Map Editor for connecting screens</li>
            <li>GameFlow and State Machine systems for logic</li>
            <li>Entity Component System (ECS)</li>
            <li>PT3 Music Tracker and Sound FX Editors</li>
            <li>Font Editor</li>
          </ul>
          <p>Use the <strong>File Explorer</strong> on the left to manage your assets. Create new assets using the <strong>Toolbar</strong> at the top.</p>
          <p>Select an asset to open its dedicated editor. Properties for the selected asset or element will appear in the <strong>Properties Panel</strong> on the right.</p>
        `,tags:["introduction","overview"]},{id:"toolbar_overview",title:"Toolbar Overview",content:`
          <h2>Toolbar Guide</h2>
          <p>The main toolbar provides quick access to common actions:</p>
          <ul>
            <li><strong>New Project</strong>: Clears current work and sets up a new project structure (main.asm, etc.).</li>
            <li><strong>Load/Save/Save As</strong>: Standard project file operations (saves as .json).</li>
            <li><strong>New Asset</strong>: Dropdown to create State Machines, Tiles, Sprites, Fonts, Screen Maps, World Maps, GameFlows, Tile Banks, Sound FX, Music Tracks, and Code files.</li>
            <li><strong>Undo/Redo</strong>: Reverts or reapplies recent changes.</li>
            <li><strong>System Tools</strong>: Access World View, Component Definitions, and Entity Templates.</li>
            <li><strong>Configure</strong>: Dropdown for IDE settings (Data Output, Autosave, Theme, ASM Compiler, MSX Emulator).</li>
            <li><strong>Help</strong>: Opens this Help & Documentation viewer.</li>
          </ul>
        `,tags:["toolbar","ide","ui"]}]},{id:"sprite_editor",title:"Sprite Editor",articles:[{id:"sprite_basics",title:"Sprite Editor Basics",content:`
          <h2>Sprite Editor Basics</h2>
          <p>The Sprite Editor allows you to create and animate game characters and objects.</p>
          <h3>Key Areas:</h3>
          <ul>
            <li><strong>Left Panel (Tools & Palette)</strong>:
                <ul>
                    <li><strong>Tools</strong>: Switch between Draw and Erase (uses background color).</li>
                    <li><strong>Active Brush</strong>: Select one of the 4 sprite palette colors to draw with.</li>
                    <li><strong>Define Sprite Colors</strong>: Assign MSX colors to the 4 sprite palette slots and the sprite's background color. Click a slot, then pick from the main MSX Palette Panel.</li>
                </ul>
            </li>
            <li><strong>Center Panel (Pixel Grid)</strong>: The main drawing canvas for the current frame.</li>
            <li><strong>Right Panel (Frame Management & Preview)</strong>:
                <ul>
                    <li><strong>Animation Preview</strong>: Shows a small preview of the current frame.</li>
                    <li><strong>Frame Control</strong>: Add, duplicate, delete, or navigate between animation frames.</li>
                    <li><strong>Transform Frame</strong>: Tools to shift, rotate (square sprites), clear, or contract the current frame.</li>
                    <li><strong>Generate Explosion</strong>: A utility to create animated explosion sprite sequences.</li>
                </ul>
            </li>
          </ul>
          <h3>Tips:</h3>
          <ul>
            <li>Sprites use a 4-color palette + 1 background color for transparency/erasing.</li>
            <li>MSX sprites have hardware limitations (e.g., max sprites per line). Keep this in mind for your game design.</li>
            <li>Use the "Export ASM" button to get Z80 assembly data for your sprite.</li>
          </ul>
        `,tags:["sprite","animation","graphics"]}]},{id:"screen_editor",title:"Screen Editor",articles:[{id:"screen_basics",title:"Screen Editor Basics",content:`
          <h2>Screen Editor Basics</h2>
          <p>The Screen Editor is used to design game levels and layouts by placing tiles.</p>
          <h3>Layers:</h3>
          <p>The editor supports multiple layers:</p>
          <ul>
            <li><strong>Background</strong>: The main visual layer for your map.</li>
            <li><strong>Collision</strong>: Defines areas where the player/entities cannot pass. Tiles placed here act as collision markers.</li>
            <li><strong>Effects</strong>: Used to define rectangular zones for gameplay effects (e.g., water, ice, custom gravity, sprite concealment). Edit properties of these zones in the Properties Panel.</li>
            <li><strong>Entities</strong>: Place game entities like player start, enemies, items.</li>
          </ul>
          <h3>Tools & Panels:</h3>
          <ul>
            <li><strong>Tileset Panel (Left)</strong>: Shows available tiles. Click a tile to select it for drawing on Background/Collision layers. Hidden when 'Effects' layer is active.</li>
            <li><strong>Entity Types Panel (Right, when Entity layer active)</strong>: Lists your configured Entity Templates. Select one to place instances on the map.</li>
            <li><strong>Properties Panel (Right)</strong>: Shows properties of the selected map, entity instance, or effect zone.</li>
            <li><strong>Active Area</strong>: Defines the playable portion of the screen map. Areas outside can be used for HUD elements. Editable via input fields in the toolbar.</li>
            <li><strong>Toolbar (Screen Editor)</strong>: Contains layer selectors, zoom, active area inputs, HUD editor button, and export options. When 'Effects' layer is active, a "New Zone" button appears after selecting an area.</li>
          </ul>
          <h3>Effect Zones:</h3>
          <p>On the 'Effects' layer, you can draw alternate tiles and define rectangular trigger zones. Each zone has:</p>
          <ul>
            <li>A name.</li>
            <li>Position (x,y) and Size (width, height) in grid cells.</li>
            <li>An <strong>Effect Type</strong>: the runtime behavior for the zone, such as <code>secretZone</code> or <code>wind</code>.</li>
            <li>Optional per-effect parameters, for example wind direction and strength.</li>
          </ul>
          <h3>SCREEN 2 Specifics:</h3>
          <p>When in SCREEN 2 mode:</p>
          <ul>
            <li>Tiles are typically 8x8 character blocks.</li>
            <li><strong>Tile Banks</strong> become crucial for managing character codes and colors. Assign your 8x8 tiles to banks. The Screen Editor will use these bank assignments to resolve tile placements into character codes for export.</li>
            <li>The editor's base cell dimension is 8x8.</li>
          </ul>
        `,tags:["screenmap","level design","tiles","effect zones"]},{id:"screen_hud",title:"HUD Configuration",content:`
          <h2>HUD Configuration</h2>
          <p>The HUD (Heads-Up Display) mode is available from the Screen Editor toolbar. It allows you to place UI elements like Score, Lives, and text on parts of the screen outside the active gameplay area.</p>
          <h3>Features:</h3>
          <ul>
            <li>Add specific HUD elements (Score, HighScore, Lives, Custom Text, etc.).</li>
            <li>In MSX SCREEN 2, you can import an external screen as a background template for your HUD.</li>
            <li>Assign TileBanks to specific screen sectors to manage character sets appropriately over 3 sectors.</li>
          </ul>
        `,tags:["screenmap","hud","ui"]}]},{id:"ecs_system",title:"Entity Component System (ECS)",articles:[{id:"ecs_intro",title:"Introduction to ECS",content:`
          <h2>Entity Component System (ECS)</h2>
          <p>Mideas uses an ECS architecture to manage game objects. This involves two main concepts:</p>
          <h3>Component Definitions</h3>
          <p>Found under System Tools. Here you define reusable data structures (e.g., Position, Health, Renderable). A component defines properties like byte, word, boolean, or references to other assets.</p>
          <h3>Entity Templates</h3>
          <p>Found under System Tools. An entity template combines multiple components to form a specific type of game object (e.g., Player, Enemy). You assign default values to the components included in the template.</p>
          <h3>Entity Instances</h3>
          <p>Once you have created an Entity Template, you can place instances of it onto a Screen Map using the Screen Editor's Entity layer. Each instance can optionally override the default component values.</p>
        `,tags:["ecs","components","entities","game logic"]}]},{id:"world_and_logic",title:"World & Logic",articles:[{id:"world_map",title:"World Map Editor",content:`
          <h2>World Map Editor</h2>
          <p>The World Map editor allows you to visually connect multiple Screen Maps to form your game's world layout.</p>
          <ul>
            <li><strong>Nodes</strong>: Each node represents a Screen Map instance.</li>
            <li><strong>Connections</strong>: Draw lines between nodes to specify how screens connect (North, South, East, West).</li>
            <li><strong>Start Screen</strong>: Right-click a node to set it as the starting screen of the game.</li>
          </ul>
        `,tags:["world map","levels","graph"]},{id:"state_machine",title:"State Machine Editor",content:`
          <h2>State Machine Editor</h2>
          <p>State Machines define complex behavior for your game entities without writing code manually.</p>
          <ul>
            <li><strong>States</strong>: Represent a behavior phase (e.g., Idle, Walking, Attacking). Each state can execute Z80 logic.</li>
            <li><strong>Transitions</strong>: Define conditions under which an entity moves from one state to another (e.g., If KeyPressed(Right) -> WalkRight).</li>
            <li><strong>Actions</strong>: Assign specific actions when entering, exiting, or running a state.</li>
          </ul>
        `,tags:["state machine","logic","behavior"]},{id:"global_variables",title:"Global Variables",content:`
          <h2>Global Variables</h2>
          <p>Global Variables allow you to define system-wide parameters (like Score, Lives, Goal status) that can be accessed by both GameFlow logic and State Machines.</p>
          <p>You can create variables of different types (boolean, byte, word) and reference them conditionally to branch your game's logic flow.</p>
        `,tags:["variables","logic","state"]}]},{id:"music_and_sound",title:"Music & Sound",articles:[{id:"pt3_tracker",title:"PT3 Music Tracker",content:`
          <h2>PT3 Music Tracker</h2>
          <p>The PT3 Music Tracker allows you to compose music for the MSX PSG (AY-3-8910) or SCC chips.</p>
          <ul>
            <li><strong>Patterns</strong>: Compose repeating blocks of music across 3 channels (PSG) or 5 channels (SCC).</li>
            <li><strong>Instruments</strong>: Define sound properties such as volume/tone envelopes and hardware shapes.</li>
            <li><strong>Ornaments</strong>: Define pitch modulations.</li>
            <li>You can use your PC keyboard as a piano to input notes when the tracker has focus.</li>
          </ul>
        `,tags:["music","tracker","audio","pt3"]},{id:"sound_fx",title:"Sound FX Editor",content:`
          <h2>Sound FX Editor</h2>
          <p>Create sound effects using a step-based sequence for the PSG chip.</p>
          <ul>
            <li>Define sequences of tone and noise periods alongside volume levels.</li>
            <li>Can utilize hardware envelopes for specific effects.</li>
            <li>Useful for jumps, explosions, shots, and other gameplay sounds.</li>
          </ul>
        `,tags:["sound","sfx","audio"]}]},{id:"gameflow",title:"GameFlow System",articles:[{id:"gameflow_intro",title:"Introduction to GameFlow",content:`
          <h2>GameFlow System</h2>
          <p><strong>GameFlow</strong> is the game flow control system in Mideas MSX. It allows you to create your game's logic using a visual system based on <strong>nodes</strong> and <strong>connections</strong>, without writing ASM code.</p>

          <h3>What can you do with GameFlow?</h3>
          <ul>
            <li>Create main and in-game menus</li>
            <li>Add victory, defeat, and credits screens</li>
            <li>Implement conditional logic (if/then/else)</li>
            <li>Display text and dialogues</li>
            <li>Apply visual transition effects</li>
            <li>Control music and sounds</li>
            <li>Manage levels and worlds</li>
            <li>Implement pause and wait systems</li>
          </ul>

          <h3>How does it work?</h3>
          <p>The game starts at the <strong>Start</strong> node and flows from node to node following the <strong>connections</strong> you define. Each node executes a specific action and then proceeds to the next connected node.</p>
          <pre>Start → Menu → WorldLink (Game Loop) → End</pre>

          <h3>Basic Concepts</h3>
          <h4>Nodes</h4>
          <p>A <strong>node</strong> is a unit of game logic. Each node has:</p>
          <ul>
            <li><strong>Type</strong>: Defines what the node does (menu, text, game, etc.)</li>
            <li><strong>Data</strong>: Node-specific configuration</li>
            <li><strong>Connections</strong>: Links to other nodes</li>
          </ul>

          <h4>Connections</h4>
          <p>Connections determine the game flow:</p>
          <ul>
            <li><strong>DEFAULT</strong>: Linear connection (next node)</li>
            <li><strong>THEN/ELSE</strong>: Conditional connections</li>
            <li><strong>OPTION_0 to OPTION_5</strong>: Menu options</li>
          </ul>

          <h4>Global Variables</h4>
          <p>You can use variables to control flow:</p>
          <ul>
            <li><code>score</code>: Player score</li>
            <li><code>lives</code>: Remaining lives</li>
            <li><code>level</code>: Current level</li>
            <li>Custom variables</li>
          </ul>
        `,tags:["gameflow","introduction","nodes"]},{id:"gameflow_nodes_basic",title:"Basic Node Types",content:`
          <h2>Basic Node Types</h2>

          <h3>1. Start (Beginning)</h3>
          <p><strong>Description</strong>: Initial game node. Must always be the first node.</p>
          <p><strong>Properties</strong>: No data, only DEFAULT connection</p>
          <pre>Start → (next node)</pre>

          <h3>2. End (Finish)</h3>
          <p><strong>Description</strong>: Shows an end screen and waits for player input.</p>
          <p><strong>Properties</strong>:</p>
          <ul>
            <li><code>endType</code>: Screen type (0-3)
              <ul>
                <li>0: Victory (VICTORY!)</li>
                <li>1: Defeat (GAME OVER)</li>
                <li>2: Credits (CREDITS)</li>
                <li>3: Custom message</li>
              </ul>
            </li>
            <li><code>message</code>: Custom message (only if endType=3)</li>
          </ul>
          <p><strong>Behavior</strong>: Displays screen, waits for FIRE or ESC, game ends</p>

          <h3>3. Restart</h3>
          <p><strong>Description</strong>: Restarts the game from the beginning.</p>
          <p><strong>Properties</strong>: No data, no connections (restarts directly)</p>
          <p><strong>Behavior</strong>: Jumps to init_rom (complete reset)</p>

          <h3>4. WorldLink (World/Level)</h3>
          <p><strong>Description</strong>: Starts main gameplay. Executes the world's game loop.</p>
          <p><strong>Properties</strong>:</p>
          <ul>
            <li><code>worldId</code>: ID of the world to load</li>
            <li><code>screenId</code>: Initial screen ID</li>
            <li>DEFAULT connection (executed when world ends)</li>
          </ul>
          <p><strong>Behavior</strong>:</p>
          <ul>
            <li>Loads world and entities</li>
            <li>Executes game loop (ECS + State Machines)</li>
            <li>Infinite loop until <code>gameflow_exit_requested = 1</code></li>
            <li>When finished, continues to DEFAULT connection</li>
          </ul>
          <p><strong>How to exit</strong>: Use a component/behavior that sets <code>gameflow_exit_requested = 1</code></p>

          <h3>5. SubMenu (Menu)</h3>
          <p><strong>Description</strong>: Shows an interactive menu with options.</p>
          <p><strong>Properties</strong>:</p>
          <ul>
            <li><code>title</code>: Menu title</li>
            <li><code>options</code>: Array of strings (menu options)</li>
            <li>OPTION_0 to OPTION_N connections (one per option)</li>
          </ul>
          <p><strong>Controls</strong>:</p>
          <ul>
            <li><strong>UP</strong>: Previous option</li>
            <li><strong>DOWN</strong>: Next option</li>
            <li><strong>FIRE</strong>: Select option</li>
          </ul>
          <p><strong>Behavior</strong>: Shows menu, player navigates, continues to node based on selected option</p>

          <h3>6. Text</h3>
          <p><strong>Description</strong>: Shows text in the bottom area of the screen.</p>
          <p><strong>Properties</strong>:</p>
          <ul>
            <li><code>text</code>: Text to display</li>
            <li><code>duration</code>: Duration in frames (60 frames = 1 second)
              <ul>
                <li>If 0: Waits for player input</li>
                <li>If >0: Waits N frames</li>
              </ul>
            </li>
            <li>DEFAULT connection (next node)</li>
          </ul>
          <p><strong>Behavior</strong>: Clears text area, shows centered text, waits duration OR input, continues to next node</p>
        `,tags:["gameflow","nodes","basic"]},{id:"gameflow_nodes_advanced",title:"Advanced Node Types",content:`
          <h2>Advanced Node Types</h2>

          <h3>7. IfThenElse (Conditional)</h3>
          <p><strong>Description</strong>: Evaluates a condition and chooses between two paths.</p>
          <p><strong>Properties</strong>:</p>
          <ul>
            <li><code>variable</code>: Variable to evaluate (e.g., "score", "lives")</li>
            <li><code>value</code>: Value to compare</li>
            <li><code>operator</code>: Comparison operator
              <ul>
                <li>"equals": Variable == Value</li>
                <li>"greater": Variable > Value</li>
                <li>"less": Variable < Value</li>
                <li>"greaterOrEqual": Variable >= Value</li>
                <li>"lessOrEqual": Variable <= Value</li>
              </ul>
            </li>
            <li>THEN and ELSE connections</li>
          </ul>
          <p><strong>Behavior</strong>:</p>
          <ul>
            <li>Reads global variable</li>
            <li>Compares with value using operator</li>
            <li>If TRUE: Continues via THEN</li>
            <li>If FALSE: Continues via ELSE</li>
          </ul>

          <h3>8. Transition</h3>
          <p><strong>Description</strong>: Applies a visual transition effect.</p>
          <p><strong>Properties</strong>:</p>
          <ul>
            <li><code>effectType</code>: Effect type (0-4)
              <ul>
                <li>0: Fade Out (~1.3s)</li>
                <li>1: Fade In (~1.3s)</li>
                <li>2: Flash (~0.5s)</li>
                <li>3: Wipe Down (~0.8s)</li>
                <li>4: Wipe Up (~0.8s)</li>
              </ul>
            </li>
            <li>DEFAULT connection (next node)</li>
          </ul>
          <p><strong>Behavior</strong>: Executes visual effect, automatically continues to next node</p>

          <h3>9. Music</h3>
          <p><strong>Description</strong>: Controls music playback.</p>
          <p><strong>Properties</strong>:</p>
          <ul>
            <li><code>command</code>: Music command (0-3)
              <ul>
                <li>0: Stop</li>
                <li>1: Play</li>
                <li>2: Pause</li>
                <li>3: Resume</li>
              </ul>
            </li>
            <li><code>trackId</code>: Track ID (only for Play)</li>
            <li><code>loop</code>: Loop playback (only for Play)</li>
            <li>DEFAULT connection (next node)</li>
          </ul>
          <p><strong>Behavior</strong>: Executes music command (PSG AY-3-8910), continues immediately, music plays in background</p>

          <h3>10. Group (Nested Flow)</h3>
          <p><strong>Description</strong>: Executes a nested GameFlow sub-flow.</p>
          <p><strong>Properties</strong>:</p>
          <ul>
            <li><code>subFlowStartNode</code>: Start node ID of sub-flow</li>
            <li>DEFAULT connection (next node after sub-flow)</li>
          </ul>
          <p><strong>Behavior</strong>: Saves current state on stack, executes complete sub-flow, restores state and continues</p>
          <p><strong>Use cases</strong>: Cutscenes, complex sub-menus, dialogue sequences, mini-games</p>

          <h3>11. Waypoint (Marker)</h3>
          <p><strong>Description</strong>: Invisible node serving as a reference point.</p>
          <p><strong>Properties</strong>:</p>
          <ul>
            <li><code>name</code>: Waypoint name</li>
            <li>DEFAULT connection (next node)</li>
          </ul>
          <p><strong>Behavior</strong>: Does nothing visible, continues immediately to next node</p>
          <p><strong>Use cases</strong>: Organize flow visually, return/save points, debugging</p>

          <h3>12. Globals (Global Variables)</h3>
          <p><strong>Description</strong>: Modifies global variables.</p>
          <p><strong>Properties</strong>:</p>
          <ul>
            <li><code>variable</code>: Variable name</li>
            <li><code>value</code>: Value to assign</li>
            <li><code>operation</code>: Operation to perform
              <ul>
                <li>"set": Variable = Value</li>
                <li>"add": Variable += Value</li>
                <li>"subtract": Variable -= Value</li>
              </ul>
            </li>
            <li>DEFAULT connection (next node)</li>
          </ul>
          <p><strong>Behavior</strong>: Modifies global variable, continues immediately to next node</p>
        `,tags:["gameflow","nodes","advanced","conditional"]},{id:"gameflow_examples",title:"Practical Examples",content:`
          <h2>Practical Examples</h2>

          <h3>Example 1: Simple Game</h3>
          <pre>
Start
  ↓
SubMenu (Main Menu)
  ├─ OPTION_0 (New Game) → Fade Out → WorldLink (Level 1) → Victory
  ├─ OPTION_1 (Continue) → WorldLink (Level 1)
  └─ OPTION_2 (Quit) → End (Thanks)
          </pre>

          <h3>Example 2: Lives System</h3>
          <pre>
WorldLink (Game)
  ↓ (on death)
IfThenElse (lives == 0?)
  ├─ THEN → Game Over
  └─ ELSE → Globals (lives -= 1) → Flash → Restart Level
          </pre>

          <h3>Example 3: Progressive Levels</h3>
          <pre>
Start
  ↓
Text ("LEVEL 1")
  ↓
WorldLink (Level 1)
  ↓
IfThenElse (score >= 500?)
  ├─ THEN → Text ("LEVEL 2") → WorldLink (Level 2) → Victory
  └─ ELSE → Game Over
          </pre>

          <h3>Example 4: Menu with Music</h3>
          <pre>
Start
  ↓
Music (Play menu theme)
  ↓
SubMenu (Main Menu)
  ├─ New Game → Music (Stop) → Music (Play game theme) → WorldLink
  ├─ Settings → Group (Settings Flow) → Main Menu
  └─ Quit → Music (Stop) → End
          </pre>

          <h3>Tips</h3>
          <ul>
            <li><strong>Clear Flow</strong>: Keep your flow linear and understandable</li>
            <li><strong>Smooth Transitions</strong>: Use transition effects between scenes</li>
            <li><strong>Initialize Variables</strong>: Set initial values at the start</li>
            <li><strong>Complete Connections</strong>: Always define both THEN and ELSE branches</li>
            <li><strong>Music Management</strong>: Stop music before changing tracks</li>
          </ul>
        `,tags:["gameflow","examples","tutorial"]},{id:"gameflow_troubleshooting",title:"Troubleshooting",content:`
          <h2>Common Problems and Solutions</h2>

          <h3>Problem 1: Menu doesn't respond</h3>
          <p><strong>Symptoms</strong>: Menu shows but I can't navigate</p>
          <p><strong>Possible causes</strong>:</p>
          <ul>
            <li>No connections defined for options</li>
            <li>Joystick not connected correctly</li>
          </ul>
          <p><strong>Solution</strong>: Ensure all OPTION_N connections are defined in your SubMenu node</p>

          <h3>Problem 2: WorldLink never ends</h3>
          <p><strong>Symptoms</strong>: Game stuck in infinite loop</p>
          <p><strong>Possible causes</strong>: <code>gameflow_exit_requested</code> is not set to 1</p>
          <p><strong>Solution</strong>: Ensure your code/behavior sets the exit flag when level completes</p>

          <h3>Problem 3: Transitions don't show</h3>
          <p><strong>Symptoms</strong>: Transition effects don't appear</p>
          <p><strong>Possible causes</strong>:</p>
          <ul>
            <li>Incorrect effectType (must be 0-4)</li>
            <li>ASM code not compiled correctly</li>
          </ul>
          <p><strong>Solution</strong>: Verify effectType is within valid range (0-4)</p>

          <h3>Problem 4: Music doesn't play</h3>
          <p><strong>Symptoms</strong>: Music command produces no sound</p>
          <p><strong>Possible causes</strong>:</p>
          <ul>
            <li>Incorrect trackId (track doesn't exist)</li>
            <li>Stop command called before</li>
          </ul>
          <p><strong>Solution</strong>: Verify track exists and Play command is used correctly</p>

          <h3>Problem 5: Variables don't update</h3>
          <p><strong>Symptoms</strong>: Globals doesn't change variable values</p>
          <p><strong>Possible causes</strong>:</p>
          <ul>
            <li>Incorrect variable name</li>
            <li>Wrong operation</li>
          </ul>
          <p><strong>Solution</strong>: Use exact variable name and correct operation ("set", "add", or "subtract")</p>

          <h3>Problem 6: IfThenElse always goes ELSE</h3>
          <p><strong>Symptoms</strong>: Condition never met</p>
          <p><strong>Possible causes</strong>:</p>
          <ul>
            <li>Wrong operator</li>
            <li>Variable not initialized</li>
            <li>Incorrect comparison value</li>
          </ul>
          <p><strong>Solution</strong>: Verify operator and variable initialization</p>
          <p><strong>Valid operators</strong>: "equals", "greater", "less", "greaterOrEqual", "lessOrEqual"</p>

          <h3>Problem 7: Text appears cut off</h3>
          <p><strong>Symptoms</strong>: Text doesn't show completely</p>
          <p><strong>Possible causes</strong>:</p>
          <ul>
            <li>Text too long (max ~30 characters)</li>
            <li>Unsupported characters</li>
          </ul>
          <p><strong>Solution</strong>: Limit text to 30 characters max, use only standard ASCII (A-Z, 0-9, basic punctuation)</p>

          <h3>Problem 8: ROM doesn't compile</h3>
          <p><strong>Symptoms</strong>: glass.jar compilation error</p>
          <p><strong>Possible causes</strong>:</p>
          <ul>
            <li>Nodes without required connections</li>
            <li>Duplicate node IDs</li>
            <li>References to non-existent nodes</li>
          </ul>
          <p><strong>Solution</strong>:</p>
          <ul>
            <li>Verify all nodes have required connections</li>
            <li>Ensure unique IDs for each node</li>
            <li>Verify targets exist in node list</li>
          </ul>
        `,tags:["gameflow","troubleshooting","problems"]}]}],ws=50,mt=[{name:"Goal",asmName:"global_var_goal",constantPrefix:"GOAL_",type:"byte",description:"Current objective status",category:"objective",values:[{label:"Failure",value:0,asmConstant:"GOAL_FAILURE"},{label:"Completed",value:1,asmConstant:"GOAL_COMPLETED"},{label:"Partial",value:2,asmConstant:"GOAL_PARTIAL"}]},{name:"MissionStatus",asmName:"global_var_mission_status",constantPrefix:"MISSION_",type:"byte",description:"Current mission state",category:"objective",values:[{label:"NotStarted",value:0,asmConstant:"MISSION_NOT_STARTED"},{label:"Active",value:1,asmConstant:"MISSION_ACTIVE"},{label:"Completed",value:2,asmConstant:"MISSION_COMPLETED"},{label:"Failed",value:3,asmConstant:"MISSION_FAILED"}]},{name:"LevelCompleted",asmName:"global_var_level_completed",constantPrefix:"BOOL_",type:"byte",description:"Level completion flag",category:"objective",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"BossDefeated",asmName:"global_var_boss_defeated",constantPrefix:"BOOL_",type:"byte",description:"Boss defeated flag",category:"objective",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"AllItemsCollected",asmName:"global_var_all_items_collected",constantPrefix:"BOOL_",type:"byte",description:"All items collected flag",category:"objective",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"Score",asmName:"global_var_score",constantPrefix:"SCORE_",type:"word",description:"Current player score (0-65535)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"HiScore",asmName:"global_var_hi_score",constantPrefix:"HISCORE_",type:"word",description:"High score record (0-65535)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"ComboMultiplier",asmName:"global_var_combo_multiplier",constantPrefix:"COMBO_",type:"byte",description:"Combo multiplier (1x, 2x, 3x...)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"Coins",asmName:"global_var_coins",constantPrefix:"COINS_",type:"byte",description:"Coins collected (0-255)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"Gems",asmName:"global_var_gems",constantPrefix:"GEMS_",type:"byte",description:"Gems collected (0-255)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"Lives",asmName:"global_var_lives",constantPrefix:"LIVES_",type:"byte",description:"Remaining lives (0-255)",category:"player",values:[{label:"Custom Value",value:"number"}]},{name:"Health",asmName:"global_var_health",constantPrefix:"HEALTH_",type:"byte",description:"Current health (0-255)",category:"player",values:[{label:"Custom Value",value:"number"}]},{name:"Energy",asmName:"global_var_energy",constantPrefix:"ENERGY_",type:"byte",description:"Current energy/mana (0-255)",category:"player",values:[{label:"Custom Value",value:"number"}]},{name:"Shield",asmName:"global_var_shield",constantPrefix:"BOOL_",type:"byte",description:"Shield active flag",category:"player",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"HasKey",asmName:"global_var_has_key",constantPrefix:"BOOL_",type:"byte",description:"Has key item",category:"inventory",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"HasSword",asmName:"global_var_has_sword",constantPrefix:"BOOL_",type:"byte",description:"Has sword item",category:"inventory",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"HasMap",asmName:"global_var_has_map",constantPrefix:"BOOL_",type:"byte",description:"Has map item",category:"inventory",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"ItemCount",asmName:"global_var_item_count",constantPrefix:"ITEMS_",type:"byte",description:"Special items collected (0-255)",category:"inventory",values:[{label:"Custom Value",value:"number"}]},{name:"PowerUpActive",asmName:"global_var_powerup_active",constantPrefix:"POWERUP_",type:"byte",description:"Active power-up type",category:"inventory",values:[{label:"None",value:0,asmConstant:"POWERUP_NONE"},{label:"Speed",value:1,asmConstant:"POWERUP_SPEED"},{label:"Jump",value:2,asmConstant:"POWERUP_JUMP"},{label:"Invincible",value:3,asmConstant:"POWERUP_INVINCIBLE"}]},{name:"CurrentWorld",asmName:"global_var_current_world",constantPrefix:"WORLD_",type:"byte",description:"Current world number (1-8)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"CurrentLevel",asmName:"global_var_current_level",constantPrefix:"LEVEL_",type:"byte",description:"Current level number (0-255)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"CheckpointReached",asmName:"global_var_checkpoint",constantPrefix:"CHECKPOINT_",type:"byte",description:"Checkpoint reached (0-255)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"SecretFound",asmName:"global_var_secret_found",constantPrefix:"BOOL_",type:"byte",description:"Secret area found flag",category:"progress",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"DoorsUnlocked",asmName:"global_var_doors_unlocked",constantPrefix:"DOORS_",type:"byte",description:"Doors unlocked bitmask (0-255)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"TimeRemaining",asmName:"global_var_time_remaining",constantPrefix:"TIME_",type:"word",description:"Time remaining in seconds (0-65535)",category:"time",values:[{label:"Custom Value",value:"number"}]},{name:"TimeLimitActive",asmName:"global_var_time_limit_active",constantPrefix:"BOOL_",type:"byte",description:"Time limit active flag",category:"time",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"DayNightCycle",asmName:"global_var_day_night_cycle",constantPrefix:"TIME_",type:"byte",description:"Day/night cycle state (0-23)",category:"time",values:[{label:"Custom Value",value:"number"}]},{name:"DifficultyLevel",asmName:"global_var_difficulty",constantPrefix:"DIFFICULTY_",type:"byte",description:"Game difficulty level",category:"difficulty",values:[{label:"Easy",value:0,asmConstant:"DIFFICULTY_EASY"},{label:"Normal",value:1,asmConstant:"DIFFICULTY_NORMAL"},{label:"Hard",value:2,asmConstant:"DIFFICULTY_HARD"},{label:"Expert",value:3,asmConstant:"DIFFICULTY_EXPERT"}]},{name:"EnemiesDefeated",asmName:"global_var_enemies_defeated",constantPrefix:"ENEMIES_",type:"word",description:"Enemies defeated count (0-65535)",category:"special",values:[{label:"Custom Value",value:"number"}]},{name:"PerfectRun",asmName:"global_var_perfect_run",constantPrefix:"BOOL_",type:"byte",description:"Perfect run (no damage) flag",category:"special",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]}],se=8,Ll=e=>{let l=e.toString(16).toUpperCase();return l.length===1&&(l="0"+l),l},Ns=(e,l,a)=>{var d,_;if(!e.lineAttributes)return`;; ERROR: Tile ${l} is missing line attributes required for SCREEN 2 export.
`;const t=l.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let o=`;; Tile: ${l} (${e.width}x${e.height})
`;o+=`;; Structure: ${e.width/se}x${e.height/se} character blocks (8x8 pixels each)
`,o+=`;; Data format: ${a.toUpperCase()}

`;const n=e.width/se,s=e.height/se,r=p=>a==="hex"?`$${Ll(p)}`:p.toString(10),i=[],c=[];for(let p=0;p<s;p++)for(let h=0;h<n;h++){const u=`;; Character Block (${h}, ${p}) for ${t}`,f=[];for(let T=0;T<se;T++){const g=p*se+T;let A=0;if(e.lineAttributes[g]&&e.lineAttributes[g][h]){const S=e.lineAttributes[g][h].fg;for(let E=0;E<se;E++){const C=h*se+E;e.data[g]&&e.data[g][C]!==void 0&&e.data[g][C]===S&&(A|=1<<7-E)}}f.push(A)}const b=f.map(r).join(",");i.push({comment:`${u} - PATTERN Data (8 bytes):`,dataString:`DB ${b}`});const m=[];for(let T=0;T<se;T++){const g=p*se+T;let A=qe<<4|Je;if(e.lineAttributes[g]&&e.lineAttributes[g][h]){const S=e.lineAttributes[g][h],E=((d=bt.get(S.fg))==null?void 0:d.index)??qe,C=((_=bt.get(S.bg))==null?void 0:_.index)??Je;A=E<<4|C}m.push(A)}const y=m.map(r).join(",");c.push({comment:`${u} - COLOR Attribute Data (8 bytes - FG|BG):`,dataString:`DB ${y}`})}return o+=`;; --- PATTERN DATA ---
`,i.length>0?(o+=`${t}_PATTERN_DATA:
`,i.forEach(p=>{o+=`${p.comment}
`,o+=`    ${p.dataString}
`})):o+=`;; No pattern data generated.
`,o+=`
`,o+=`;; --- COLOR ATTRIBUTE DATA ---
`,c.length>0?(o+=`${t}_COLOR_DATA:
`,c.forEach(p=>{o+=`${p.comment}
`,o+=`    ${p.dataString}
`})):o+=`;; No color attribute data generated.
`,o+=`
;; End of Tile Data for ${t}
`,o},Ls=(e,l,a,t)=>{const o=Math.max(1,e/It);return Array(l).fill(null).map(()=>Array(o).fill(null).map(()=>({fg:a,bg:t})))},yt=(e,l)=>{var s,r,i,c;const a=[],t=e.width/se,o=e.height/se,n=l==="SCREEN 2 (Graphics I)";for(let d=0;d<o;d++)for(let _=0;_<t;_++)for(let p=0;p<se;p++){const h=d*se+p;let u=0,f;n&&e.lineAttributes&&e.lineAttributes[h]&&e.lineAttributes[h][_]&&(f=e.lineAttributes[h][_].fg);for(let b=0;b<se;b++){const m=_*se+b,y=(s=e.data[h])==null?void 0:s[m];if(y!==void 0){let T=!1;n&&f?T=y===f:n||(T=y!==Ze[0].hex&&y!==((c=(i=(r=e.lineAttributes)==null?void 0:r[0])==null?void 0:i[0])==null?void 0:c.bg)),T&&(u|=1<<7-b)}}a.push(u)}return new Uint8Array(a)},Ye=(e,l)=>{var n,s;const a=e.length;if(a===0)return[];const t=((n=e[0])==null?void 0:n.length)||0;if(t===0)return[[]];const o=e.map(r=>[...r]);for(let r=0;r<a;r++)for(let i=0;i<t;i++){const c=Math.floor(i/It),d=(s=l[r])==null?void 0:s[c],_=o[r][i];d&&_!==d.fg&&_!==d.bg&&(o[r][i]=d.fg)}return o},Ds=(e,l,a)=>{if(e.length<2)return e;const o=e.slice(1);return o.push([...e[0]]),a==="SCREEN 2 (Graphics I)"&&l?Ye(o,l):o},xs=(e,l,a)=>{const t=e.length;if(t<2)return e;const o=e.slice(0,t-1);return o.unshift([...e[t-1]]),a==="SCREEN 2 (Graphics I)"&&l?Ye(o,l):o},Ms=(e,l,a)=>{if(e.length===0)return[];const t=e.map(o=>{if(o.length<2)return[...o];const n=o.slice(1);return n.push(o[0]),n});return a==="SCREEN 2 (Graphics I)"&&l?Ye(t,l):t},Ps=(e,l,a)=>{if(e.length===0)return[];const t=e.map(o=>{const n=o.length;if(n<2)return[...o];const s=o.slice(0,n-1);return s.unshift(o[n-1]),s});return a==="SCREEN 2 (Graphics I)"&&l?Ye(t,l):t},ks=(e,l,a)=>{if(e.length===0)return[];const t=e.map(o=>[...o].reverse());return a==="SCREEN 2 (Graphics I)"&&l?Ye(t,l):t},Os=(e,l,a)=>{if(e.length===0)return[];const t=[...e].reverse();return a==="SCREEN 2 (Graphics I)"&&l?Ye(t,l):t},Et=e=>{var o,n,s;if(!e.lineAttributes)return null;const l=[],a=e.width/se,t=e.height/se;for(let r=0;r<t;r++)for(let i=0;i<a;i++)for(let c=0;c<se;c++){const d=r*se+c;let _=qe<<4|Je;const p=(o=e.lineAttributes[d])==null?void 0:o[i];if(p){const h=((n=bt.get(p.fg))==null?void 0:n.index)??qe,u=((s=bt.get(p.bg))==null?void 0:s.index)??Je;_=h<<4|u}l.push(_)}return new Uint8Array(l)},Us=e=>{const l=[];e.frames.forEach(t=>{var o,n,s,r,i;for(let c=0;c<e.spritePalette.length;c++){const d=e.spritePalette[c];if(d===e.backgroundColor)continue;let _=!1;const p=[],h=e.size.width,u=e.size.height;if(h===16&&u===16){for(let f=0;f<8;f++){let b=0;for(let m=0;m<8;m++)((o=t.data[f])==null?void 0:o[m])===d&&(b|=1<<7-m,_=!0);p.push(b)}for(let f=8;f<16;f++){let b=0;for(let m=0;m<8;m++)((n=t.data[f])==null?void 0:n[m])===d&&(b|=1<<7-m,_=!0);p.push(b)}for(let f=0;f<8;f++){let b=0;for(let m=0;m<8;m++)((s=t.data[f])==null?void 0:s[8+m])===d&&(b|=1<<7-m,_=!0);p.push(b)}for(let f=8;f<16;f++){let b=0;for(let m=0;m<8;m++)((r=t.data[f])==null?void 0:r[8+m])===d&&(b|=1<<7-m,_=!0);p.push(b)}}else for(let f=0;f<u;f++)for(let b=0;b<Math.ceil(h/8);b++){let m=0;for(let y=0;y<8;y++){const T=b*8+y;T<h&&((i=t.data[f])==null?void 0:i[T])===d&&(m|=1<<7-y,_=!0)}p.push(m)}_&&l.push(p)}});const a=l.flat();return new Uint8Array(a)},fa=e=>e.map(l=>[...l].reverse()),ba=e=>[...e].reverse(),Dl=/_(left|right|up|down)$/i,Ka=e=>{if(!e)return;const l=e.trim().toLowerCase();if(l==="left"||l==="right"||l==="up"||l==="down")return l},xl=e=>{const l=e.match(Dl);return l?{baseName:e.slice(0,-l[0].length),suffixDirection:Ka(l[1])}:{baseName:e}},Ml=(e,l,a,t)=>({...e,id:`${e.id}__auto_${a}`,name:l,facingDirection:a,frames:e.frames.map((o,n)=>({...o,id:`${o.id||`f${n}`}_${a}_auto`,data:t(o.data)}))}),Lt=(e,l,a,t)=>{if(!l)return;(l===l.toLowerCase()?[l]:[l,l.toLowerCase()]).forEach(n=>{const s=e[n];if(s===void 0){e[n]=a;return}s!==a&&t.push(`Name alias collision for "${n}" between indexes ${s} and ${a}. Keeping first mapping.`)})},tt=e=>{const l=[],a=new Set,t=[],o=new Map,n=(_,p,h)=>{if(!a.has(_))return _;if(!a.has(p))return l.push(`Name "${_}" already exists. Using fallback "${p}" for ${h}.`),p;let u=1,f=`${_}_${u}`;for(;a.has(f);)u+=1,f=`${_}_${u}`;return l.push(`Name "${_}" already exists. Using "${f}" for ${h}.`),f};e.forEach((_,p)=>{const h=_.name||`sprite_${p}`,{baseName:u,suffixDirection:f}=xl(h),b=Ka(_.facingDirection);b&&f&&b!==f&&l.push(`Sprite "${h}" has suffix "${f}" but facing "${b}". Using facing direction.`);const m=b||f,y=f?u:h,T=m?`${y}_${m}`:h,g=n(T,h,`sprite "${h}"`),A=new Set;h!==g&&A.add(h);const E={sprite:{..._,name:g,facingDirection:m||_.facingDirection},baseName:y,direction:m,aliases:A};if(t.push(E),a.add(g),m){const C=o.get(y)||{};C[m]===void 0?(C[m]=t.length-1,o.set(y,C)):l.push(`Duplicate directional sprite for "${y}_${m}". Keeping first occurrence.`)}}),o.forEach((_,p)=>{const h=(u,f,b,m)=>{if(f===void 0||_[u]!==void 0)return;const y=`${p}_${u}`;if(a.has(y)){l.push(`Cannot auto-generate "${y}" because the name already exists.`);return}const T=t[f],A={sprite:Ml(T.sprite,y,u,b),baseName:p,direction:u,aliases:new Set};t.push(A),_[u]=t.length-1,a.add(y),l.push(`Auto-generated "${y}" from "${T.sprite.name}" using ${m}.`)};_.right!==void 0&&_.left===void 0?h("left",_.right,fa,"horizontal mirror"):_.left!==void 0&&_.right===void 0&&h("right",_.left,fa,"horizontal mirror"),_.up!==void 0&&_.down===void 0?h("down",_.up,ba,"vertical mirror"):_.down!==void 0&&_.up===void 0&&h("up",_.down,ba,"vertical mirror")});const s={};t.forEach((_,p)=>{Lt(s,_.sprite.name,p,l),Lt(s,_.sprite.id,p,l)}),t.forEach((_,p)=>{_.aliases.forEach(h=>Lt(s,h,p,l))});const r=t.map((_,p)=>p),i=t.map((_,p)=>p),c=t.map((_,p)=>p),d=t.map((_,p)=>p);return t.forEach((_,p)=>{const h=o.get(_.baseName);h&&(h.left!==void 0&&(r[p]=h.left),h.right!==void 0&&(i[p]=h.right),h.up!==void 0&&(c[p]=h.up),h.down!==void 0&&(d[p]=h.down))}),{sprites:t.map(_=>_.sprite),nameToIndex:s,directionalLookupTables:{left:r,right:i,up:c,down:d},warnings:l}},Pl=e=>{let l=e.toString(16).toUpperCase();return l.length===1&&(l="0"+l),l},kl=(e,l,a,t,o,n,s="hex",r)=>{var h,u,f,b,m;const c=e.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let d=`;; ---- Sprite Frame: ${e} ----
`;d+=`;; Size: ${o}x${n}
`;let _=0;const p=Array.isArray(r)&&r.length>0?r:a.map((y,T)=>T).filter(y=>{const T=a[y];return!!T&&T!==t});for(const y of p){const T=a[y];if(!T||T===t)continue;const g=[];if(o===16&&n===16){for(let A=0;A<8;A++){let S=0;for(let E=0;E<8;E++){const C=E;((h=l[A])==null?void 0:h[C])===T&&(S|=1<<7-E)}g.push(S)}for(let A=8;A<16;A++){let S=0;for(let E=0;E<8;E++){const C=E;((u=l[A])==null?void 0:u[C])===T&&(S|=1<<7-E)}g.push(S)}for(let A=0;A<8;A++){let S=0;for(let E=0;E<8;E++){const C=8+E;((f=l[A])==null?void 0:f[C])===T&&(S|=1<<7-E)}g.push(S)}for(let A=8;A<16;A++){let S=0;for(let E=0;E<8;E++){const C=8+E;((b=l[A])==null?void 0:b[C])===T&&(S|=1<<7-E)}g.push(S)}}else for(let A=0;A<n;A++)for(let S=0;S<Math.ceil(o/8);S++){let E=0;for(let C=0;C<8;C++){const v=S*8+C;v<o&&((m=l[A])==null?void 0:m[v])===T&&(E|=1<<7-C)}g.push(E)}_+=1,d+=`${c}_LAYER${y}: ; Brush Color Index ${y} (Actual Color: ${T})
`,o%8!==0&&(d+=`;; WARNING: Sprite width ${o} is not a multiple of 8. Bitmask generation might be problematic for standard VDP.
`);for(let A=0;A<g.length;A+=16){const E=g.slice(A,A+16).map(C=>s==="hex"?`#${Pl(C)}`:C.toString());d+=`    DB ${E.join(",")}
`}d+=`
`}return _===0&&(d+=`;; NO DRAWABLE LAYERS EXPORTED for ${e} - Palette may match background color.
`),d+=`;; ---- End of Frame: ${e} ----

`,d},Ol=(e,l="hex",a)=>{let t=`;; Sprite: ${e.name}
`;t+=`;; Total Frames: ${e.frames.length}
`,t+=`;; Size: ${e.size.width}x${e.size.height}
`,t+=`;; Background Color (not exported as a layer): ${e.backgroundColor}
`,t+=`;; Drawable Palette (Hex): C0=${e.spritePalette[0]}, C1=${e.spritePalette[1]}, C2=${e.spritePalette[2]}, C3=${e.spritePalette[3]}

`;const o=a!==void 0?`_${a}`:"",n=e.name+o,s=n.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();t+=`SPRITE_${s}_WIDTH     EQU ${e.size.width}
`,t+=`SPRITE_${s}_HEIGHT    EQU ${e.size.height}
`,t+=`SPRITE_${s}_FRAMES    EQU ${e.frames.length}

`;const r=e.spritePalette.map((i,c)=>c).filter(i=>{const c=e.spritePalette[i];return!c||c===e.backgroundColor?!1:e.frames.some(d=>{var _;return(_=d==null?void 0:d.data)==null?void 0:_.some(p=>p==null?void 0:p.some(h=>h===c))})});return e.frames.forEach((i,c)=>{t+=kl(`${n}_F${c}`,i.data,e.spritePalette,e.backgroundColor,e.size.width,e.size.height,l,r)}),t},Dt=16,Za="SCREEN 2 (Graphics I)",Ul="SCREEN 5 (Graphics III)",xe=8,$l={pixelWidth:Be*Dt,pixelHeight:ft*Dt,widthTiles:Be,heightTiles:ft,baseTileSize:Dt},ya={[Za]:{pixelWidth:Be*Ke,pixelHeight:ft*Ke,widthTiles:Be,heightTiles:ft,baseTileSize:Ke},[Ul]:{pixelWidth:256,pixelHeight:212,widthTiles:32,heightTiles:27,baseTileSize:Ke},"SCREEN 0 (Text 40)":{pixelWidth:240,pixelHeight:192,widthTiles:40,heightTiles:24,baseTileSize:xe},"SCREEN 1 (Text 32)":{pixelWidth:256,pixelHeight:192,widthTiles:32,heightTiles:24,baseTileSize:xe},"SCREEN 3 (Multicolor)":{pixelWidth:256,pixelHeight:192,widthTiles:32,heightTiles:24,baseTileSize:xe},"SCREEN 4 (Graphics II)":{pixelWidth:256,pixelHeight:192,widthTiles:32,heightTiles:24,baseTileSize:xe},"SCREEN 6 (Graphics IV)":{pixelWidth:512,pixelHeight:212,widthTiles:64,heightTiles:27,baseTileSize:xe},"SCREEN 7 (Graphics V)":{pixelWidth:512,pixelHeight:212,widthTiles:64,heightTiles:27,baseTileSize:xe},"SCREEN 8 (Graphics VI)":{pixelWidth:256,pixelHeight:212,widthTiles:32,heightTiles:27,baseTileSize:xe}};function $s(e){const l=typeof e=="string"?e.trim():"";return l&&ya[l]?ya[l]:$l}const gt=e=>e===Za,Bl=e=>gt(e)?ce:Ze,Fl=(e,l)=>{const a=Bl(l);if(e===void 0||e<0||e>=a.length)return gt(l)?ce[1].hex:Ze[4].hex;const t=a[e];return(t==null?void 0:t.hex)??(gt(l)?ce[1].hex:Ze[4].hex)},jl=(e,l,a,t)=>{var p;const o=e.layers.background,n=e.activeAreaX??0,s=e.activeAreaY??0,r=e.activeAreaWidth??e.width,i=e.activeAreaHeight??e.height,c=[];let d=0;const _=new Map;for(let h=0;h<i;h++){const u=s+h;for(let f=0;f<r;f++){const b=n+f;if(u>=o.length||b>=((p=o[u])==null?void 0:p.length)){c.push(Re);continue}const m=o[u][b];if(!m||!m.tileId)c.push(Re);else{let y=Re;const T=l.find(g=>g.id===m.tileId);if(t==="SCREEN 2 (Graphics I)"&&a){let g=!1,A={tileId:m.tileId,position:{x:b,y:u},attempts:[],banksReceived:a.length};typeof globalThis.screenUtils_firstTileLogged>"u"&&(console.log("🔍 First tile structure check:",{tileId:m.tileId,position:{x:b,y:u},banksCount:a.length,banks:a.map(S=>({name:S.name,assignedTileIds:Object.keys(S.assignedTiles||{}),hasThisTile:!!(S.assignedTiles&&S.assignedTiles[m.tileId]),assignedTilesType:typeof S.assignedTiles,assignedTilesSample:S.assignedTiles?Object.entries(S.assignedTiles).slice(0,2):[]}))}),globalThis.screenUtils_firstTileLogged=!0);for(const S of a)if((S.enabled??!0)&&S.assignedTiles[m.tileId]){const E=S.assignedTiles[m.tileId],C=m.subTileX||0,v=m.subTileY||0;if(T){const L=E.charCode,x=Math.ceil(T.width/Ke);y=L+v*x+C}else if(Array.isArray(E.fontCharacters)){const L=E.fontCharacters[C];y=(L==null?void 0:L.bankCharCode)??Re}else y=Re;const R=y>=S.charsetRangeStart&&y<=S.charsetRangeEnd;if(A.attempts.push({bankName:S.name,calculated:y,range:`${S.charsetRangeStart}-${S.charsetRangeEnd}`,inRange:R}),R){g=!0;break}else y=Re}else A.attempts.push({bankName:S.name,reason:"Tile not assigned to this bank"});g||(console.warn("⚠️ Tile not found in valid range:",A),y=Re)}else if(t!=="SCREEN 2 (Graphics I)"){const g=`${m.tileId}_${m.subTileX??0}_${m.subTileY??0}`;_.has(g)?y=_.get(g):d>255?y=Re:(_.set(g,d),y=d++)}c.push(y)}}}return new Uint8Array(c)},zl=(e,l,a,t,o,n="hex")=>{const r=e.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let i=`;; MAP: ${e} (${l}x${a} tiles)
`;i+=`;; Total size: ${t.length} bytes

`,o.length>0&&(i+=`;; --- TILE INDEX REFERENCES for ${r} ---
`,i+=o.join(`
`)+`

`),i+=`SCREEN_${r}_WIDTH     EQU ${l}
`,i+=`SCREEN_${r}_HEIGHT    EQU ${a}
`,i+=`SCREEN_${r}_SIZE      EQU ${t.length}

`,i+=`SCREEN_${r}_LAYOUT:
`;for(let c=0;c<t.length;c+=16){const _=t.slice(c,c+16).map(p=>n==="hex"?`#${p.toString(16).padStart(2,"0").toUpperCase()}`:p.toString());i+=`    DB ${_.join(",")}
`}return i},Hl=(e,l,a,t,o="hex")=>{const s=e.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let r=`;; BEHAVIOR MAP: ${e} (${l}x${a} tiles)
`;r+=`;; Total size: ${t.length} bytes (Map IDs 0-255)
`,r+=`;; Data format: ${o.toUpperCase()}

`,r+=`BEHAVIOR_${s}_WIDTH     EQU ${l}
`,r+=`BEHAVIOR_${s}_HEIGHT    EQU ${a}
`,r+=`BEHAVIOR_${s}_SIZE      EQU ${t.length}

`,r+=`BEHAVIOR_${s}_DATA:
`;const i=c=>o==="hex"?`#${c.toString(16).padStart(2,"0").toUpperCase()}`:c.toString(10);for(let c=0;c<t.length;c+=16){const _=t.slice(c,c+16).map(i);r+=`    DB ${_.join(",")}
`}return r+=`
;; End of Behavior Map Data for ${e}
`,r},Bs=(e,l)=>{if(e.width!==l.width||e.height!==l.height||e.data.length!==l.data.length)return!1;for(let a=0;a<e.height;a++){if(e.data[a].length!==l.data[a].length)return!1;for(let t=0;t<e.width;t++)if(e.data[a][t]!==l.data[a][t])return!1}if(e.lineAttributes&&l.lineAttributes){if(e.lineAttributes.length!==l.lineAttributes.length)return!1;for(let a=0;a<e.lineAttributes.length;a++){if(e.lineAttributes[a].length!==l.lineAttributes[a].length)return!1;for(let t=0;t<e.lineAttributes[a].length;t++)if(e.lineAttributes[a][t].fg!==l.lineAttributes[a][t].fg||e.lineAttributes[a][t].bg!==l.lineAttributes[a][t].bg)return!1}}else if(e.lineAttributes!==l.lineAttributes)return!1;return JSON.stringify(e.logicalProperties)===JSON.stringify(l.logicalProperties)};function Fs(e,l,a,t,o,n,s){const{data:r,width:i,height:c,lineAttributes:d}=e;if(!r||c===0||i===0)return"";const _=document.createElement("canvas");_.width=n,_.height=n;const p=_.getContext("2d");if(!p)return"";p.imageSmoothingEnabled=!1;const h=(l??0)*n,u=(a??0)*n;for(let m=0;m<n;m++)for(let y=0;y<n;y++){const T=h+y,g=u+m;if(g>=0&&g<c&&T>=0&&T<i){let A=r[g][T];if(s==="SCREEN 2 (Graphics I)"&&d&&d[g]){const S=Math.floor(T/It),E=d[g][S];E&&A!==E.fg&&A!==E.bg&&(A=E.fg)}p.fillStyle=A,p.fillRect(y,m,1,1)}}if(_.width===t&&_.height===o)return _.toDataURL();const f=document.createElement("canvas");f.width=t,f.height=o;const b=f.getContext("2d");return b?(b.imageSmoothingEnabled=!1,b.drawImage(_,0,0,t,o),f.toDataURL()):_.toDataURL()}function js(e,l,a){var n;if(!e||a===0||l===0)return"";const t=document.createElement("canvas");t.width=l,t.height=a;const o=t.getContext("2d");if(!o)return"";o.imageSmoothingEnabled=!1;for(let s=0;s<a;s++)for(let r=0;r<l;r++){const i=(n=e[s])==null?void 0:n[r];i&&i!=="rgba(0,0,0,0)"&&(o.fillStyle=i,o.fillRect(r,s,1,1))}return t.toDataURL()}const zs=(e,l,a,t,o,n,s)=>{var _,p;const r=gt(t);e.width=l.width*o,e.height=l.height*o;const i=e.getContext("2d");if(!i)return;i.imageSmoothingEnabled=!1;const c=Fl(l.backgroundColor,t);i.fillStyle=c,i.fillRect(0,0,e.width,e.height);const d=l.layers.background;for(let h=0;h<l.height;h++)for(let u=0;u<l.width;u++){const f=(_=d[h])==null?void 0:_[u];if(!(f!=null&&f.tileId))continue;const b=a.find(v=>v.id===f.tileId);if(!b)continue;const{data:m,width:y,height:T,lineAttributes:g}=b;if(!m)continue;const A=f.subTileX??0,S=f.subTileY??0,E=A*o,C=S*o;for(let v=0;v<o;v++)for(let R=0;R<o;R++){const L=E+R,x=C+v;if(x<T&&L<y){let k=(p=m[x])==null?void 0:p[L];if(k===void 0)continue;if(r&&g&&g[x]){const O=Math.floor(L/It),z=g[x][O];z&&k!==z.fg&&k!==z.bg&&(k=z.fg)}i.fillStyle=k,i.fillRect(u*o+R,h*o+v,1,1)}}}};function de(e){const l=typeof e=="string"?e.trim():"";if(!l)return"";const a=mt.find(t=>t.name.toLowerCase()===l.toLowerCase());return a?a.name:l}function ze(e){return`global_var_${de(e).replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`}function He(e){return`${de(e).replace(/[^A-Za-z0-9]/g,"_").toUpperCase()}_`}function Vl(e){const l=e.find(s=>s.type==="globalvariables");if(!l||!l.data)return[...mt];const a=l.data.customVariables||[],t=new Map;mt.forEach(s=>{const r=de(s.name);t.set(r,{...s,name:r})}),a.forEach(s=>{const r=de(s.name);r&&t.set(r,{...s,name:r,asmName:ze(r),constantPrefix:s.constantPrefix||He(r)})});const o=mt.map(s=>de(s.name)),n=[];return o.forEach(s=>{const r=t.get(s);r&&(n.push(r),t.delete(s))}),t.forEach(s=>{n.push(s)}),n}function Hs(e){const l=e.find(o=>o.type==="globalvariables");if(!l||!l.data)return[];const a=l.data.customVariables||[],t=new Map;return a.forEach(o=>{const n=de(o.name);n&&t.set(n,{...o,name:n,asmName:ze(n),constantPrefix:o.constantPrefix||He(n)})}),Array.from(t.values())}function Gl(e){const l=Vl(e);if(l.length===0)return[];const a=[],t=e.filter(b=>b.type==="screenmap");t.forEach(b=>{var y,T;(((T=(y=b.data)==null?void 0:y.layers)==null?void 0:T.entities)||[]).forEach(g=>{var A,S;(S=(A=g.components)==null?void 0:A.Behavior)!=null&&S.behaviorCode&&a.push(g.components.Behavior.behaviorCode)})});const o=e.find(b=>b.type==="gameflow"),n=new Set,s=new Set,r=new Set,i=new Set,c=b=>{if(typeof b!="string")return;const m=de(b);m&&i.add(m)},d=b=>{if(typeof b!="string"||!b.includes("{{"))return;const m=/\{\{\s*([^{}]+?)\s*\}\}/g;for(const y of b.matchAll(m))c(y[1])};if(o!=null&&o.data){const b=o.data;b.nodes&&Array.isArray(b.nodes)&&b.nodes.forEach(m=>{var y;if(m.type==="StateMachine"&&((y=m.data)!=null&&y.customCode)&&a.push(m.data.customCode),m.type==="IfThenElse"&&m.variableName){const T=de(m.variableName);T&&n.add(T)}m.type==="Globals"&&m.variables&&Array.isArray(m.variables)&&m.variables.forEach(T=>{if(T.variableName){const g=de(T.variableName);g&&s.add(g)}})})}e.filter(b=>b.type==="componentdefinition").forEach(b=>{const m=b.data;m.customCode&&a.push(m.customCode)});const p=b=>{if(typeof b!="string")return;const m=de(b);m&&r.add(m)};t.forEach(b=>{var T,g,A,S;(((g=(T=b.data)==null?void 0:T.layers)==null?void 0:g.entities)||[]).forEach(E=>{var C,v,R,L;p((v=(C=E==null?void 0:E.componentOverrides)==null?void 0:C.comp_tile_collector)==null?void 0:v.targetVariable),p((L=(R=E==null?void 0:E.componentOverrides)==null?void 0:R.comp_tile_collector)==null?void 0:L.flagVariable)}),(((S=(A=b.data)==null?void 0:A.hudConfiguration)==null?void 0:S.elements)||[]).forEach(E=>{var v,R,L;const C=String((E==null?void 0:E.type)||"").toLowerCase();C==="score"?i.add(de("Score")):C==="lives"&&i.add(de("Lives")),c((v=E==null?void 0:E.details)==null?void 0:v.variableName),c((R=E==null?void 0:E.details)==null?void 0:R.globalVariableName),c((L=E==null?void 0:E.details)==null?void 0:L.bindingVariable),d(E==null?void 0:E.text),d(E==null?void 0:E.name)})}),e.filter(b=>b.type==="entitytemplate").forEach(b=>{var T,g,A;const m=b.data,y=(T=m==null?void 0:m.components)==null?void 0:T.find(S=>S.definitionId==="comp_tile_collector");p((g=y==null?void 0:y.defaultValues)==null?void 0:g.targetVariable),p((A=y==null?void 0:y.defaultValues)==null?void 0:A.flagVariable)});const u=[],f=new Set;return l.forEach(b=>{const m=de(b.name),y=a.some(E=>new RegExp(`\\b${b.asmName}\\b`,"i").test(E)),T=n.has(m),g=s.has(m),A=r.has(m),S=i.has(m);(y||T||g||A||S)&&!f.has(m)&&(u.push(b),f.add(m))}),s.forEach(b=>{const m=de(b);if(!f.has(m)){const y=ze(m);u.push({name:m,asmName:y,constantPrefix:He(m),type:"8bit",description:"Auto-generated variable from Globals node",values:[{label:"0",value:0}],category:"special"}),f.add(m)}}),n.forEach(b=>{const m=de(b);if(!f.has(m)){const y=ze(m);u.push({name:m,asmName:y,constantPrefix:He(m),type:"8bit",description:"Auto-generated variable from IfThenElse node",values:[{label:"0",value:0}],category:"special"}),f.add(m)}}),r.forEach(b=>{const m=de(b);if(!f.has(m)){const y=ze(m);u.push({name:m,asmName:y,constantPrefix:He(m),type:"8bit",description:"Auto-generated variable from Tile Collector",values:[{label:"0",value:0}],category:"special"}),f.add(m)}}),i.forEach(b=>{const m=de(b);if(!f.has(m)){const y=ze(m);u.push({name:m,asmName:y,constantPrefix:He(m),type:"8bit",description:"Auto-generated variable from HUD binding",values:[{label:"0",value:0}],category:"special"}),f.add(m)}}),u}const F={AND:"AND",OR:"OR",XOR:"XOR",NOT:"NOT",KEY_PRESSED:"KEY_PRESSED",KEY_RELEASED:"KEY_RELEASED",TIME_OUT:"TIME_OUT",CAN_MOVE_DIRECTION:"CAN_MOVE_DIRECTION",HAS_COLLISION:"HAS_COLLISION",PATH_CLEAR:"PATH_CLEAR",ON_WALL_COLLISION:"ON_WALL_COLLISION",HAS_DEADLY_TILE_COLLISION:"HAS_DEADLY_TILE_COLLISION",ANIMATION_COMPLETE:"ANIMATION_COMPLETE",KEY_AND_MOVEMENT:"KEY_AND_MOVEMENT",VARIABLE_COMPARE:"VARIABLE_COMPARE"},w={NONE:"NONE",SET_POSITION:"SET_POSITION",MOVE_BY:"MOVE_BY",SET_VELOCITY:"SET_VELOCITY",APPLY_FORCE:"APPLY_FORCE",CHANGE_SPRITE:"CHANGE_SPRITE",PLAY_ANIMATION:"PLAY_ANIMATION",SET_ANIMATION_SPEED:"SET_ANIMATION_SPEED",TOGGLE_ANIMATION:"TOGGLE_ANIMATION",PLAY_SOUND:"PLAY_SOUND",PLAY_MUSIC:"PLAY_MUSIC",MUTE_MUSIC:"MUTE_MUSIC",STOP_MUSIC:"STOP_MUSIC",SET_VARIABLE:"SET_VARIABLE",INCREMENT_VARIABLE:"INCREMENT_VARIABLE",DECREMENT_VARIABLE:"DECREMENT_VARIABLE",SET_COMPONENT_PROPERTY:"SET_COMPONENT_PROPERTY",WAIT:"WAIT",GOTO_STATE:"GOTO_STATE",DESTROY_ENTITY:"DESTROY_ENTITY",SPAWN_ENTITY:"SPAWN_ENTITY",GET_RANDOM_ENTITY_POSITION:"GET_RANDOM_ENTITY_POSITION",CHANGE_GAME_FLOW_NODE:"CHANGE_GAME_FLOW_NODE",REGENERATE_HUD:"REGENERATE_HUD",CLEAN_SPRITES:"CLEAN_SPRITES",EXIT_CURRENT_WORLD:"EXIT_CURRENT_WORLD",DECREASE_LIVES:"DECREASE_LIVES",INCREASE_LIVES:"INCREASE_LIVES",RESPAWN_PLAYER:"RESPAWN_PLAYER",BREAK_TILE:"BREAK_TILE",REPLACE_TILE:"REPLACE_TILE",RND:"RND",POINT_AT:"POINT_AT",ADD_VARIABLES:"ADD_VARIABLES",SUBTRACT_VARIABLES:"SUBTRACT_VARIABLES",MULTIPLY_VARIABLES:"MULTIPLY_VARIABLES",DIVIDE_VARIABLES:"DIVIDE_VARIABLES",MODULO_VARIABLES:"MODULO_VARIABLES",ASSIGN_VARIABLE:"ASSIGN_VARIABLE",DISABLE_INPUT:"DISABLE_INPUT",ENABLE_INPUT:"ENABLE_INPUT"};function jt(e,l){const a=l.filter(I=>I.type==="componentdefinition").map(I=>I.data),t=l.filter(I=>I.type==="entitytemplate").map(I=>I.data),o=l.filter(I=>I.type==="sprite").map(I=>I.data),n=l.filter(I=>I.type==="sound").map(I=>{var P,$;return{...I.data,id:((P=I.data)==null?void 0:P.id)||I.id,name:(($=I.data)==null?void 0:$.name)||I.name}}),s=[],r={};let i=0;l.filter(I=>I.type==="track").forEach(I=>{const P=I.data;if(!P)return;const $=P.soundChip||"PSG";if($!=="PSG")return;const j={...P,soundChip:$,id:P.id||I.id,name:P.name||I.name};s.push(j),j.playbackBackend==="external-pt3"&&(r[I.id]=i,r[j.id]=i,i++)});const c=l.filter(I=>I.type==="tile").map(I=>I.data),d=l.filter(I=>I.type==="tilebank").map(I=>I.data),_=l.filter(I=>I.type==="screenmap").map(I=>I.data),p=l.filter(I=>I.type==="worldmap").map(I=>I.data),h=l.filter(I=>I.type==="statemachine").map(I=>I.data),u=l.find(I=>I.type==="presentationscreen"),f=u==null?void 0:u.data,b=[],m=new Set,y=(I,P,$)=>{var G,W;if(I!=null&&I.id)return String(I.id);const j=((G=I==null?void 0:I.position)==null?void 0:G.x)??"",q=((W=I==null?void 0:I.position)==null?void 0:W.y)??"",H=(I==null?void 0:I.entityTemplateId)??"",le=(I==null?void 0:I.name)??"";return`${(P==null?void 0:P.id)??`screen_${$}`}|${H}|${le}|${j}|${q}`},T=(I,P,$)=>{if(!I||typeof I!="object")return;const j=y(I,P,$);m.has(j)||(m.add(j),b.push({...I,screenAssetId:I.screenAssetId||(P==null?void 0:P.id),screenIndex:typeof I.screenIndex=="number"?I.screenIndex:$}))};_.forEach((I,P)=>{var $;($=I.layers)!=null&&$.entities&&Array.isArray(I.layers.entities)&&I.layers.entities.forEach(j=>T(j,I,P)),I.entities&&Array.isArray(I.entities)&&I.entities.forEach(j=>T(j,I,P))});const g=l.find(I=>I.type==="gameflow"),A=g==null?void 0:g.data,S=b.length>0,E=a.length>0||S,C=_.length>1,v=o.length>0,R=c.length>0,L=_.length>0,x=a.length>0,k=!!A,O=l.some(I=>I.type==="font"),z=o.some(I=>I.frames.length>1),V=_.some(I=>I.layers.collision.some(P=>P.some($=>$!==null))),N=t.some(I=>I.name.toLowerCase().includes("menu")),M=[];a.forEach(I=>{I.name.toLowerCase().includes("state")&&M.push(I.name.replace(/[^a-zA-Z0-9]/g,"").toUpperCase())});const U=Gl(l);return{projectName:e,components:a,templates:t,sprites:o,sounds:n,tracks:s,trackIndexByAssetId:r,tiles:c,tileBanks:d,screenMaps:_,screens:_,worldmaps:p,entities:b,fonts:l.filter(I=>I.type==="font"),presentationScreen:f,gameFlow:A,stateMachines:h,hasECS:E,hasMultipleScreens:C,hasSprites:v,hasTiles:R,hasScreens:L,hasEntities:S,hasComponents:x,hasGameFlow:k,hasMenus:N,hasFonts:O,hasAnimations:z,hasCollisions:V,hasMenuSystem:N,customStates:M,globalVariables:U}}const Wl=e=>{if(!e.hasECS)return`    ; No ECS system - basic entity updates
    RET`;let l=`    ; ECS-based entity updates
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
    
    ; Update entity based on components`;return e.components.forEach((a,t)=>{l+=`
    ; Update ${a.name} component
    CALL UPDATE_${a.name.toUpperCase().replace(/[^A-Z0-9]/g,"_")}`}),l+=`
    
entity_update_skip:
    POP HL
    LD DE, 16           ; Entity structure size
    ADD HL, DE
    POP BC
    DJNZ entity_update_loop
    RET`,l},Yl=e=>{if(!e.hasSprites)return`    ; No sprites to update
    RET`;let l=`    ; Update sprite animations and positions
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
    
sprite_no_frame_advance:`;return e.hasAnimations&&(l+=`
    ; Update sprite position based on movement component
    INC HL
    INC HL
    INC HL
    LD A, (HL)          ; X position
    INC HL  
    LD B, (HL)          ; Y position
    ; Apply movement logic here
    ; CALL APPLY_SPRITE_MOVEMENT`),l+=`
    
    POP HL
    LD DE, 8            ; Sprite data structure size
    ADD HL, DE
    POP BC
    DJNZ sprite_update_loop
    RET`,l},Ql=e=>e.hasCollisions?`    ; Check player collision with environment
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
    RET`,Xl=e=>{let l=`    ; Read MSX joystick/keyboard input
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
    
input_no_fire1:`;return e.hasMenuSystem&&(l+=`
    ; Check for pause/menu button (Space)
    LD A, 6             ; Row 6
    CALL SNSMAT
    BIT 0, A            ; Space key
    JR NZ, input_no_pause
    LD A, (input_state)
    SET INPUT_BIT_PAUSE, A
    LD (input_state), A
    
input_no_pause:`),l+=`
    RET`,l},Kl=e=>e.hasMenuSystem?`    ; Update menu graphics and cursor
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
    RET`,Zl=e=>{if(e.customStates.length===0)return"; No custom states detected";let l=`; Custom state handlers for project-specific logic
`;return e.customStates.forEach(a=>{l+=`
logic_${a.toLowerCase()}:
    ; Custom logic for ${a} state
    ; TODO: Implement ${a} specific logic
    RET
`}),l},ql=[{marker:"{{ENTITY_UPDATES}}",generator:Wl,description:"Entity update system based on ECS components"},{marker:"{{SPRITE_UPDATES}}",generator:Yl,description:"Sprite animation and movement updates"},{marker:"{{COLLISION_CHECK}}",generator:Ql,description:"Collision detection system"},{marker:"{{INPUT_HANDLING}}",generator:Xl,description:"Input handling with project-specific controls"},{marker:"{{MENU_SYSTEM}}",generator:Kl,description:"Menu system updates and rendering"},{marker:"{{CUSTOM_STATES}}",generator:Zl,description:"Custom state handlers detected from project"}];function Jl(e,l,a,t=ql){const o=jt(l,a);let n=e;return n=n.replace(/{{PROJECT_NAME}}/g,l.toUpperCase()),n=n.replace(/{{PROJECT_NAME_LOWER}}/g,l.toLowerCase()),n=n.replace(/{{GENERATION_DATE}}/g,new Date().toISOString()),t.forEach(s=>{if(n.includes(s.marker)){const r=s.generator(o);n=n.replace(new RegExp(to(s.marker),"g"),r)}}),n}function eo(){return`;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
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
`}function to(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function Vs(e,l){const a=eo(),t=Jl(a,e,l),n=`${e.toLowerCase().replace(/[^a-z0-9]/g,"_")}_dynamic_system.asm`,s=jt(e,l);return{filename:n,content:t,analysis:s}}function Fe(e,l,a){if(!(!a||a.length===0)){e.push(`;   ${l}:`);for(const t of a)e.push(`;     - ${t}`)}}function X(e){const l=[];return l.push("; Register Contract:"),e.purpose&&l.push(`;   Purpose: ${e.purpose}`),Fe(l,"Inputs",e.inputs),Fe(l,"Outputs",e.outputs),Fe(l,"Clobbers",e.clobbers),Fe(l,"Preserved",e.preserved),Fe(l,"Register roles",e.usage),Fe(l,"Notes",e.notes),`${l.join(`
`)}
`}function ao(e={mode:"hybrid"}){const{mode:l,optimizeLevel:a="safe",includeDebug:t=!1}=e;let o=`; ==================================================================
; DIRECT HARDWARE ACCESS ROUTINES
; ==================================================================
; Mode: ${l.toUpperCase()}
; Optimize Level: ${a}
; Debug: ${t?"ENABLED":"DISABLED"}
;
; These routines provide direct hardware access for maximum performance.
; They replace BIOS calls in performance-critical sections.
;
; Performance Gains vs BIOS:
;   FAST_LDIRVM:  ~40% faster (12,288 vs 20,480 cycles for 256 bytes)
;   FAST_WRTVRM:  ~43% faster (40 vs 70 cycles)
;   FAST_WRTVDP:  ~55% faster (25 vs 55 cycles)
;   FAST_GTSTCK:  ~58% faster (50 vs 120 cycles)
;   FAST_GTTRIG:  direct trigger read (joystick button)
;   FAST_SNSMAT:  direct keyboard matrix row read
;
; Compatibility: MSX1, MSX2, MSX2+
; ==================================================================

`;return o+=lo(),o+=no(),o+=ro(),o+=io(),o+=so(),o+=co(),o+=_o(),a==="aggressive"&&(o+=oo(),o+=po()),t&&(o+=ho()),o+=`
; ==================================================================
; END OF DIRECT HARDWARE ROUTINES
; ==================================================================
`,o}function lo(){return`
; ==================================================================
; FAST_LDIRVM - Fast Block Transfer to VRAM
; ==================================================================
${X({purpose:"Block copy from RAM to VRAM using VDP data port auto-increment.",inputs:["HL = source address (RAM)","DE = destination address (VRAM)","BC = byte count"],outputs:["None"],clobbers:["AF","BC","HL"],preserved:["DE"],usage:["A = VDP address bytes and data byte being transferred","HL = RAM read pointer (increments each byte)","DE = only used to program initial VRAM address","BC = countdown loop counter"],notes:["Caller must preserve AF/BC/HL if needed after call."]})}
; Replaces BIOS LDIRVM with direct hardware access
;
; Input:
;   HL = Source address (RAM)
;   DE = Destination address (VRAM)
;   BC = Byte count
;
; Output:
;   None
;
; Destroys:
;   AF, BC, HL
;
; Performance:
;   ~48 cycles/byte vs BIOS ~80+ cycles/byte
;   For 256 bytes: 12,288 cycles vs 20,480+ (40% faster)
;
; Notes:
;   - Auto-increments VRAM address (VDP feature)
;   - Keeps IRQs masked for the whole transfer to avoid VDP port races
;   - Restores previous IRQ enable state on return
;   - Works on all MSX models (TMS9918, V9938, V9958)
; ==================================================================
FAST_LDIRVM:
    ; Disable interrupts during VDP port sequence to prevent ISR races.
    ; Always re-enables on exit (called from main loop where EI is guaranteed).
    ; NOTE: The old LD A,I / PUSH AF / RET PO pattern is unreliable on Z80 —
    ; an interrupt between LD A,I and PUSH AF clears P/V, skipping EI and
    ; leaving interrupts permanently disabled (next HALT locks the system).
    di

    ; Set VRAM write address
    ld a, e
    out (#99), a           ; Write address low byte to VDP
    nop                    ; Real VDPs need a short settle time between control writes
    ld a, d
    or #40                 ; Set bit 6 for write mode
    out (#99), a           ; Write address high byte + write command
    nop                    ; Let the VDP latch the address before the first data write

    ; Copy loop
.ldirvm_loop:
    ld a, (hl)             ; Read byte from RAM (7 cycles)
    out (#98), a           ; Write to VRAM data port (11 cycles)
    inc hl                 ; Next source address (6 cycles)
    dec bc                 ; Decrement counter (6 cycles)
    ld a, b                ; Check if BC = 0 (4 cycles)
    or c                   ; (4 cycles)
    jr nz, .ldirvm_loop    ; Loop if not zero (12/7 cycles)

    ei
    ret

`}function oo(){return`
; ==================================================================
; FAST_LDIRVM_256 - Optimized for exactly 256 bytes
; ==================================================================
${X({purpose:"Fixed-size 256-byte transfer from RAM to VRAM using DJNZ.",inputs:["HL = source address (RAM)","DE = destination address (VRAM)"],outputs:["None"],clobbers:["AF","B","HL"],preserved:["C","DE"],usage:["A = VDP address bytes and transferred byte","B = DJNZ counter (0 means 256 iterations)","HL = RAM read pointer","DE = only used to set initial VRAM address"],notes:["Use only when exactly 256 bytes must be copied."]})}
; Specialized version for 256-byte blocks (common case: sprite patterns)
; Uses DJNZ for faster loop control
;
; Input:
;   HL = Source address (RAM)
;   DE = Destination address (VRAM)
;
; Output:
;   None
;
; Destroys:
;   AF, B, HL
;
; Performance:
;   ~46 cycles/byte (vs 48 for generic version)
;   Total: 11,776 cycles (saves ~500 cycles vs generic)
; ==================================================================
FAST_LDIRVM_256:
    ; Disable interrupts during VDP port sequence (see FAST_LDIRVM note).
    di

    ; Set VRAM write address
    ld a, e
    out (#99), a
    nop
    ld a, d
    or #40
    out (#99), a
    nop

    ; Copy 256 bytes using DJNZ (B=0 means 256)
.ldirvm_256_begin:
    ld b, 0                ; B = 256 (wraps from 0)
.ldirvm_256_loop:
    ld a, (hl)
    out (#98), a
    inc hl
    djnz .ldirvm_256_loop  ; Faster than dec bc + check (13/8 cycles)

    ei
    ret

`}function no(){return`
; ==================================================================
; FAST_WRTVRM - Write Single Byte to VRAM
; ==================================================================
${X({purpose:"Write one byte into VRAM while preserving caller-visible state.",inputs:["A = byte to write","HL = VRAM destination address"],outputs:["None"],clobbers:["None (all registers preserved)"],preserved:["AF","BC","DE","HL"],usage:["A = temporarily saved/restored around VDP address programming","HL = VRAM address source (not modified)"],notes:["Safe helper when the caller cannot tolerate register changes."]})}
; Replaces BIOS WRTVRM
;
; Input:
;   A = Data byte to write
;   HL = VRAM destination address
;
; Output:
;   None
;
; Destroys:
;   None (all registers preserved)
;
; Performance:
;   ~40 cycles vs BIOS ~70 cycles (43% faster)
;
; Notes:
;   - Preserves all registers including AF
;   - VDP write sequence is atomic against ISR VRAM writes
; ==================================================================
FAST_WRTVRM:
    ; Preserve caller-visible state. Disable interrupts during VDP write
    ; (see FAST_LDIRVM note on why LD A,I / RET PO is unsafe).
    push bc
    ld c, a                ; C = input data byte
    push af                ; Save caller AF
    di
    ld a, l
    out (#99), a           ; Address low (11 cycles)
    ld a, h
    or #40                 ; Write mode (7 cycles)
    out (#99), a           ; Address high + command (11 cycles)
    ld a, c
    out (#98), a           ; Write to VRAM (11 cycles)
    ei
    pop af                 ; Restore caller AF
    pop bc
    ret

`}function ro(){return`
; ==================================================================
; FAST_RDVRM - Read Single Byte from VRAM
; ==================================================================
${X({purpose:"Read one byte from VRAM data port.",inputs:["HL = VRAM source address"],outputs:["A = byte read from VRAM"],clobbers:["AF"],preserved:["BC","DE","HL"],usage:["A = VDP addressing command then read result","HL = address source only (unchanged)"],notes:["Callers relying on flags must account for AF clobber."]})}
; Replaces BIOS RDVRM
;
; Input:
;   HL = VRAM source address
;
; Output:
;   A = Byte read from VRAM
;
; Destroys:
;   AF
;
; Performance:
;   Slower than a naive single IN, but correct on TMS9918/MSX1 because
;   VRAM reads require one dummy fetch after setting the address.
;
; Notes:
;   - Useful for collision detection, tile reading
;   - First IN primes the VDP read-ahead buffer; second IN returns the byte
; ==================================================================
FAST_RDVRM:
    ld a, l
    out (#99), a           ; Address low
    ld a, h
    and #3F                ; Clear bit 6 for read mode (bit 7 must be 0)
    out (#99), a           ; Address high + read command
    nop                    ; Let the VDP latch the read address
    in a, (#98)            ; Dummy read: primes the TMS9918 prefetch buffer
    in a, (#98)            ; Actual byte from VRAM[HL]
    ret

`}function io(){return`
; ==================================================================
; FAST_WRTVDP - Write VDP Register
; ==================================================================
${X({purpose:"Write one VDP register value (value first, then register index).",inputs:["B = register value","C = register number"],outputs:["None"],clobbers:["AF"],preserved:["BC","DE","HL"],usage:["A = output staging register for both OUT operations","B/C = preserved input pair for value and register id"],notes:["Order of writes is mandatory for VDP register writes."]})}
; Replaces BIOS WRTVDP
;
; Input:
;   B = Register value
;   C = Register number (0-7 for MSX1, 0-23 for MSX2, 0-46 for MSX2+)
;
; Output:
;   None
;
; Destroys:
;   AF
;
; Performance:
;   ~25 cycles vs BIOS ~55 cycles (55% faster)
;
; Notes:
;   - Used for mode changes, colors, scroll, etc.
;   - Register write order matters: value first, then register number
; ==================================================================
FAST_WRTVDP:
    ld a, b                ; Get register value (4 cycles)
    out (#99), a           ; Write value first (11 cycles)
    ld a, c                ; Get register number (4 cycles)
    or #80                 ; Set bit 7 for register write (7 cycles)
    out (#99), a           ; Write register select (11 cycles)
    ret                    ; (10 cycles)
                           ; Total: ~25 cycles

`}function so(){return`
; ==================================================================
; FAST_GTSTCK - Read Joystick Direction
; ==================================================================
${X({purpose:"Read joystick direction and map PSG bits to MSX GTSTCK direction code.",inputs:["A = joystick port (0 or 1)"],outputs:["A = direction code (0-8)"],clobbers:["AF","HL"],preserved:["BC","DE"],usage:["A = PSG register selection, raw read, and final direction code","HL = lookup table pointer into joystick_direction_table"],notes:["Bits are active-low; routine inverts and masks input nibble."]})}
; Replaces BIOS GTSTCK (which is notoriously slow)
;
; Input:
;   A = Joystick port (0 = port 1, 1 = port 2)
;
; Output:
;   A = Direction code (0-8)
;       0 = Center (no direction)
;       1 = Up
;       2 = Up + Right
;       3 = Right
;       4 = Down + Right
;       5 = Down
;       6 = Down + Left
;       7 = Left
;       8 = Up + Left
;
; Destroys:
;   AF, HL
;
; Performance:
;   ~50 cycles vs BIOS ~120+ cycles (58% faster)
;
; Notes:
;   - Reads from PSG register 14 (port 1) or 15 (port 2)
;   - Joystick bits are active-low (inverted)
;   - Uses lookup table for direction decoding
; ==================================================================
FAST_GTSTCK:
    ; Calculate PSG register: 14 (port 1) or 15 (port 2)
    rrca                   ; A = A / 2 (joystick port becomes 0 or 8)
    and #0F                ; Mask to valid range
    or #0E                 ; Add 14 (base register for joystick)

    ; Make PSG select+read atomic so VBlank music writes cannot
    ; corrupt the selected register mid-access.
    di
    out (#A0), a           ; Write register number to PSG address port
    in a, (#A2)            ; Read value from PSG data port
    ei

    ; Process joystick data
    cpl                    ; Invert bits (joystick is active-low)
    and #0F                ; Mask to 4 direction bits (Up, Down, Left, Right)

    ; Lookup direction code from table
    ld hl, joystick_direction_table
    add a, l               ; Add offset to table base
    ld l, a
    adc a, h               ; Handle carry if table crosses page boundary
    sub l
    ld h, a
    ld a, (hl)             ; Get direction code (0-8)
    ret

; Direction lookup table (16 entries for all 4-bit combinations)
; MSX PSG register 14 joystick bit order:
;   Bit 0 = Up    (0001)
;   Bit 1 = Down  (0010)
;   Bit 2 = Left  (0100)
;   Bit 3 = Right (1000)
; Value: GTSTCK-compatible direction code (0-8)
joystick_direction_table:
    db 0  ; 0000 = Center
    db 1  ; 0001 = Up
    db 5  ; 0010 = Down
    db 0  ; 0011 = Up+Down (invalid)
    db 7  ; 0100 = Left
    db 8  ; 0101 = Up+Left
    db 6  ; 0110 = Down+Left
    db 0  ; 0111 = Invalid
    db 3  ; 1000 = Right
    db 2  ; 1001 = Up+Right
    db 4  ; 1010 = Down+Right
    db 0  ; 1011 = Invalid
    db 0  ; 1100 = Left+Right (invalid)
    db 0  ; 1101 = Invalid
    db 0  ; 1110 = Invalid
    db 0  ; 1111 = All directions (invalid)

`}function co(){return`
; ==================================================================
; FAST_GTTRIG - Read Joystick Trigger
; ==================================================================
${X({purpose:"Read joystick trigger bit directly from PSG register.",inputs:["A = joystick port (0 or 1)"],outputs:["A = #FF if pressed, #00 if released"],clobbers:["AF"],preserved:["BC","DE","HL"],usage:["A = register select, raw PSG read, and normalized return value"],notes:["Trigger is active-low in PSG bit 4."]})}
; Direct hardware replacement for BIOS GTTRIG
;
; Input:
;   A = Joystick port (0 = port 1, 1 = port 2)
;
; Output:
;   A = #FF if pressed, 0 if released
;
; Destroys:
;   AF
;
; Notes:
;   - Reads PSG register 14/15 directly
;   - Trigger bit is active-low
; ==================================================================
FAST_GTTRIG:
    ; Calculate PSG register: 14 (port 1) or 15 (port 2)
    rrca
    and #0F
    or #0E

    ; Make PSG select+read atomic so VBlank music writes cannot
    ; corrupt the selected register mid-access.
    di
    out (#A0), a
    in a, (#A2)
    ei

    ; Trigger bit (bit 4): 0 when pressed, 1 when released
    and #10
    ld a, #00
    ret nz
    ld a, #FF
    ret

`}function _o(){return`
; ==================================================================
; FAST_SNSMAT - Sense Keyboard Matrix Row
; ==================================================================
${X({purpose:"Select keyboard matrix row via PPI and return row state.",inputs:["A = matrix row (0-11)"],outputs:["A = row bits (active-low)"],clobbers:["AF","C"],preserved:["B","DE","HL"],usage:["A = row selector composition and final row read","C = cached low nibble used to build PPI port C output"],notes:["Upper nibble of current PPI port C is preserved."]})}
; Direct hardware replacement for BIOS SNSMAT
;
; Input:
;   A = row (0-11)
;
; Output:
;   A = row bits (active-low, 0=pressed)
;
; Destroys:
;   AF, C
; ==================================================================
FAST_SNSMAT:
    and #0F                 ; Keep valid row bits
    ld c, a
    in a, (#AA)             ; Read current PPI port C
    and #F0                 ; Preserve upper nibble
    or c                    ; Set keyboard row in lower nibble
    out (#AA), a            ; Select row
    in a, (#A9)             ; Read keyboard matrix row
    ret

`}function po(){return`
; ==================================================================
; COPY_SPRITE_PATTERN_UNROLLED - Ultra-fast sprite pattern copy
; ==================================================================
${X({purpose:"Copy fixed 32-byte sprite pattern to VRAM with unrolled writes.",inputs:["HL = source address (32-byte sprite pattern in RAM)","DE = destination VRAM address"],outputs:["None"],clobbers:["AF","HL"],preserved:["BC","DE"],usage:["A = VDP address bytes and each streamed pattern byte","HL = source pointer advanced 32 times","DE = initial VRAM destination programming only"],notes:["Optimized for speed at the cost of ROM size."]})}
; Unrolled loop for copying 32-byte sprite pattern to VRAM
; Use for critical sprite updates (player, bullets, etc.)
;
; Input:
;   HL = Source address (sprite pattern data, 32 bytes)
;   DE = Destination (VRAM sprite pattern table address)
;
; Output:
;   None
;
; Destroys:
;   AF, HL
;
; Performance:
;   ~1,100 cycles (vs ~1,536 with looped version)
;   Saves ~436 cycles per sprite update (28% faster)
;
; Trade-off:
;   Uses ~100 bytes of ROM vs ~20 bytes for loop
; ==================================================================
COPY_SPRITE_PATTERN_UNROLLED:
    ; Set VRAM write address
    ld a, e
    out (#99), a
    ld a, d
    or #40
    out (#99), a

    ; Unrolled copy (32 iterations)
    ; Each iteration: LD A,(HL) + OUT + INC HL = 7+11+6 = 24 cycles
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ret

`}function ho(){return`
; ==================================================================
; DEBUG HELPERS
; ==================================================================

; Print hex byte to screen (for debugging)
DEBUG_PRINT_HEX:
    push af
    push bc
    push hl

    ; Convert high nibble
    ld b, a
    rrca
    rrca
    rrca
    rrca
    and #0F
    call .nibble_to_ascii
    call FAST_WRTVRM

    ; Convert low nibble
    ld a, b
    and #0F
    call .nibble_to_ascii
    inc hl
    call FAST_WRTVRM

    pop hl
    pop bc
    pop af
    ret

.nibble_to_ascii:
    cp 10
    jr c, .is_digit
    add a, 7  ; A-F
.is_digit:
    add a, '0'
    ret

; Cycle counter (uses H.TIMI hook)
DEBUG_START_TIMER:
    ld hl, (#FC9E)  ; H.TIMI counter
    ld (debug_timer_start), hl
    ret

DEBUG_STOP_TIMER:
    ld hl, (#FC9E)
    ld de, (debug_timer_start)
    or a
    sbc hl, de
    ld (debug_timer_result), hl
    ret

debug_timer_start:  dw 0
debug_timer_result: dw 0

`}function uo(e={}){const{hardwareMode:l}=e;let a=`; ==================================================================
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

; File I/O (Disk BIOS) - Not used in cartridge ROMs
; DSKIO   EQU #004A      ; Disk I/O (conflicts with WRTVRM, not available in cartridge)
; DSKCHF  EQU #004D      ; Disk change flag (same address as WRTVRM, not used)

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
FORCLR  EQU #F3E8        ; Foreground color
BAKCLR  EQU #F3E9        ; Background color
BDRCLR  EQU #F3EA        ; Border color
isComputer50HzOr60Hz EQU #F3EB  ; System frequency flag

; ==================================================================
; NOTE: Fast hardware access routines (FAST_LDIRVM, FAST_WRTVRM, etc.)
;       are provided by directHardwareGenerator.ts when hybrid/direct mode
;       is enabled. See directHardwareGenerator.ts for implementations.
; ==================================================================

; ==================================================================
; END OF BIOS DEFINITIONS
; ==================================================================
`;return l&&(l.mode==="direct"||l.mode==="hybrid")?a+`
`+ao(l):a}function mo(e){let l="";if(!e.globalVariables||e.globalVariables.length===0)return l+=`; Goal Variable Values (default)
`,l+=`GOAL_FAILURE            EQU 0    ; Goal = "Failure"
`,l+=`GOAL_COMPLETED          EQU 1    ; Goal = "Completed"
`,l;const a=new Set;return e.globalVariables.forEach(t=>{t.values&&t.values.length>0&&(l+=`
; ${t.name} - ${t.description||"Variable values"}
`,t.values.forEach(o=>{const n=(o.asmConstant||"UNKNOWN").trim(),s=typeof o.value=="number"?o.value:0;a.has(n)||(l+=`${n.padEnd(24)}EQU ${s}    ; ${t.name} = "${o.label}"
`,a.add(n))}))}),l}function fo(e){var a,t;const l=tt(e.sprites||[]).sprites.length;return`; ==================================================================
; MSX SYSTEM CONSTANTS
; File: constants.asm
; Description: MSX hardware constants and project-specific definitions
; ==================================================================

; ==================================================================
; VRAM LAYOUT - SCREEN 2 MODE
; ==================================================================

; Pattern Generator Table (PGT) - 3 Banks
CHRTBL  EQU #0000        ; Pattern table base address (alias)
CHRTBL2 EQU #0000        ; Pattern table base address (Bank 0)
; Bank 1: CHRTBL2 + #800   (#0800)
; Bank 2: CHRTBL2 + #1000  (#1000)

; Color Attribute Table (CAT) - 3 Banks
CLRTBL  EQU #2000        ; Color table base address (alias)
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
${e.tiles.map((o,n)=>`; Tile ${n}: ${o.name} = ${o.width}x${o.height}px (${Math.ceil(o.width/8)}x${Math.ceil(o.height/8)} MSX chars)`).join(`
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

; Input Button Bitmask
INPUT_BTN_FIRE EQU #01   ; Fire/Space button bit in input_btn_curr/input_btn_prev

; Direction flags shared by input/state machine helpers
DIR_ALLOW_UP     EQU #01 ; Bit 0: Allow UP movement
DIR_ALLOW_DOWN   EQU #02 ; Bit 1: Allow DOWN movement
DIR_ALLOW_LEFT   EQU #04 ; Bit 2: Allow LEFT movement
DIR_ALLOW_RIGHT  EQU #08 ; Bit 3: Allow RIGHT movement

; ==================================================================
; TILE BEHAVIOR CONSTANTS (for collision detection)
; ==================================================================

; Tile Behavior encoding matches TileEditor logicalProperties.mapId:
;   bits 7-4 = solidity family
;   bits 3-0 = property flags
TILE_PASSABLE       EQU #00    ; Family 0: passable / no-solid
TILE_SOLID          EQU #10    ; Family 1: solid wall/floor
TILE_PLATFORM       EQU #20    ; Family 2: top-solid platform
TILE_SLOPE          EQU #30    ; Family 3: slope / custom solid family
TILE_BREAKABLE      EQU #01    ; Flag bit 0
TILE_MOVABLE        EQU #02    ; Flag bit 1
TILE_DEADLY         EQU #04    ; Flag bit 2: causesDamage
TILE_INTERACTABLE   EQU #08    ; Flag bit 3: isInteractiveSwitch

; Collision Directions (for platform logic)
COLL_FROM_ABOVE     EQU #01    ; Entity approaching from above
COLL_FROM_BELOW     EQU #02    ; Entity approaching from below
COLL_FROM_LEFT      EQU #04    ; Entity approaching from left
COLL_FROM_RIGHT     EQU #08    ; Entity approaching from right

; Entity Collision Layer Presets (entity_collision_layer / entity_collides_with)
COLLISION_LAYER_PLAYER      EQU #01
COLLISION_LAYER_ENEMY       EQU #02
COLLISION_LAYER_PROJECTILE  EQU #04
COLLISION_LAYER_PLATFORM    EQU #08
COLLISION_LAYER_ITEM        EQU #10

; Entity-Entity Collision Event Flags (entity_entity_collision_flags)
COLLISION_EVENT_ENTITY      EQU #01
COLLISION_EVENT_ENEMY       EQU #02
COLLISION_EVENT_ITEM        EQU #04

; ==================================================================
; MIDEAS GLOBAL VARIABLES - CONSTANTS FOR VALUES
; ==================================================================

${mo(e)}

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
NODE_TYPE_END           EQU 7    ; End node (game over, victory, credits)
NODE_TYPE_IF_THEN_ELSE  EQU 8    ; IfThenElse node (conditional branch)
NODE_TYPE_GLOBALS       EQU 9    ; Globals node (global variable ops)
NODE_TYPE_WAYPOINT      EQU 10   ; Waypoint node (routing marker)
NODE_TYPE_GROUP         EQU 11   ; Group node (nested flow)
NODE_TYPE_MUSIC         EQU 12   ; Music node (audio command)
NODE_TYPE_PRESENTATION_SCREEN EQU 13 ; Presentation Screen node (static tile screen)
NODE_TYPE_UNKNOWN       EQU 255  ; Unknown/unsupported node type
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
TOTAL_SPRITES           EQU ${l}
TOTAL_TILES             EQU ${((a=e.tiles)==null?void 0:a.length)||0}
TOTAL_SCREENS           EQU ${((t=e.screenMaps)==null?void 0:t.length)||0}

; ==================================================================
; END OF CONSTANTS
; ==================================================================
`}function bo(e){const l=Math.max(1,tt(e.sprites||[]).sprites.length);let a=`; ==================================================================
; RAM VARIABLES DEFINITIONS
; File: variables.asm
; Description: Dynamic variable allocation using EQU addresses
; Generated based on project analysis
; ==================================================================

; ==================================================================
; CORE SYSTEM VARIABLES (ALWAYS PRESENT)
; ==================================================================
`,t=49152;a+=`input_state         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Current direction state (0-8)
`,t++,a+=`prev_input_state    EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Previous direction state (0-8)
`,t++,a+=`input_btn_curr      EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Current input buttons bitmask (bit0=fire)
`,t++,a+=`input_btn_prev      EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Previous input buttons bitmask (bit0=fire)
`,t++,a+=`input_fire          EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Fire button state (0=released, 1=pressed)
`,t++,a+=`current_flow_state  EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Current game flow state
`,t++,a+=`prev_flow_state     EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Previous game flow state
`,t++,a+=`gameflow_exit_requested EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Exit flag for WorldLink loop
`,t++,a+=`gameflow_menu_selection EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Current/last submenu selection
`,t++,a+=`gameflow_submenu_data_ptr EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Pointer to active submenu data (16-bit)
`,t+=2,a+=`gameflow_submenu_option_count EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Cached submenu option count
`,t++,a+=`gameflow_submenu_cursor_enabled EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; 1 when submenu uses sprite cursor
`,t++,a+=`gameflow_submenu_cursor_layer_count EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Cursor sprite layer count (1..4)
`,t++,a+=`gameflow_condition_result EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Result of last condition evaluation
`,t++,a+=`transition_delay_var    EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Frames per step for active transition effect
`,t++,a+=`
; ==================================================================
; MIDEAS GLOBAL VARIABLES (DEFAULTS + CUSTOM)
; ==================================================================
`,e.globalVariables&&e.globalVariables.length>0?e.globalVariables.forEach(r=>{const i=String(r.type||"").toLowerCase(),c=i==="16bit"||i==="word",d=c?2:1,_=c?" (16-bit)":" (8-bit)",p=r.description||r.name;a+=`${r.asmName.padEnd(20)} EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; ${p}${_}
`,t+=d}):(a+=`global_var_goal     EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Goal status (0=Failure, 1=Completed)
`,t++),a+=`
; ==================================================================
; SYSTEM VARIABLES
; ==================================================================
`,a+=`ROM_slot            EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Expanded slot for normal page 1 ROM access
`,t++,a+=`slot_primary_normal EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Primary slot register snapshot for BIOS-ROM-ROM-RAM layout
`,t++,a+=`page0_bios_slot     EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Expanded slot for normal BIOS page 0
`,t++,a+=`page2_normal_slot   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Expanded slot for normal page 2 layout
`,t++,a+=`page3_normal_slot   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Expanded slot for normal RAM page 3
`,t++,a+=`mapper_bank_p1_current EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Mapper current bank for page/window 1
`,t++,a+=`mapper_bank_p2_current EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Mapper current bank for page/window 2
`,t++,a+=`mapper_bank_p3_current EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Mapper current bank for page/window 3
`,t++,a+=`mapper_bank_p4_current EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Mapper current bank for page/window 4
`,t++,a+=`mapper_saved_bank    EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Saved mapper bank for push/pop helpers
`,t++,a+=`mapper_saved_bank_p1 EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Saved mapper bank for page/window 1 helpers
`,t++,a+=`mapper_saved_bank_p3 EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Saved mapper bank for page/window 3 helpers
`,t++,a+=`mapper_saved_bank_p4 EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Saved mapper bank for page/window 4 helpers
`,t++,a+=`frame_counter       EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Frame counter (16-bit)
`,t+=2,a+=`
; Profiling counters (16-bit, cumulative)
`,a+=`prof_update_all_entities_calls EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Calls to update_all_entities
`,t+=2,a+=`prof_execute_sm_calls EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Calls to execute_all_state_machines
`,t+=2,a+=`prof_sm_update_calls  EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Calls to SM_Update
`,t+=2,a+=`prof_collision_calls  EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Calls to update_collision_component
`,t+=2,a+=`prof_wall_calls       EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Calls to update_wallcollision_component
`,t+=2,a+=`prof_deadly_calls     EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Calls to update_deadly_tiles_component
`,t+=2,a+=`prof_tile_interaction_calls EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Calls to check_tile_interaction
`,t+=2,a+=`prof_animation_calls  EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Calls to update_animation_component
`,t+=2,a+=`prof_sprite_calls     EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Calls to update_sprite_component
`,t+=2,a+=`prof_music_task_calls EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Calls to task_update_music
`,t+=2,a+=`prof_deadly_behavior_reads EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Deadly helper behavior-map reads
`,t+=2,a+=`page0_transfer_buffer EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary RAM buffer for page0 -> VRAM copies
`,t+=256,a+=`
; ==================================================================
; SCREEN MAP POINTERS (Current active screen)
; ==================================================================
`,a+=`current_screen_layout   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Pointer to current screen layout data (16-bit)
`,t+=2,a+=`current_screen_layout_bank EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Mapper bank for current screen layout data
`,t++,a+=`current_behavior_map    EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Pointer to current behavior map data (16-bit)
`,t+=2,a+=`current_behavior_map_bank EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Mapper bank for current behavior map data
`,t++,a+=`behavior_cache_row     EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Cached behavior row (255=invalid)
`,t++,a+=`behavior_cache_map_l   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Cached behavior map pointer low byte
`,t++,a+=`behavior_cache_map_h   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Cached behavior map pointer high byte
`,t++,a+=`behavior_cache_row_base EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Cached row base address in behavior map (16-bit)
`,t+=2,a+=`RUNTIME_SCREEN_MAP_SIZE EQU 768
`,a+=`MAX_RUNTIME_EFFECT_ZONES EQU 64
`,a+=`runtime_background_layout EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Immutable copy of current background layout (32x24)
`,t+=768,a+=`runtime_screen_layout  EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Mutable copy of current screen layout (32x24)
`,t+=768,a+=`runtime_behavior_map   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Mutable copy of current behavior map (32x24)
`,t+=768,a+=`runtime_effects_layout EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Alternate effects layout copy for secret zones (32x24)
`,t+=768,a+=`runtime_effect_zone_table EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Current screen effect zone table (MAX_RUNTIME_EFFECT_ZONES * 8 bytes)
`,t+=512,a+=`current_effect_zone_count EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Number of effect zones copied into runtime_effect_zone_table
`,t++,a+=`secret_zone_active EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; 1 if hero is currently inside an active secret zone
`,t++,a+=`secret_zone_rect_x EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Active secret zone rect X in cells
`,t++,a+=`secret_zone_rect_y EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Active secret zone rect Y in cells
`,t++,a+=`secret_zone_rect_w EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Active secret zone rect width in cells
`,t++,a+=`secret_zone_rect_h EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Active secret zone rect height in cells
`,t++,a+=`
; ==================================================================
; VIEWPORT/CAMERA VARIABLES (for scroll system)
; ==================================================================
`,a+=`camera_x            EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Camera X position in pixels (16-bit)
`,t+=2,a+=`camera_y            EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Camera Y position in pixels (16-bit)
`,t+=2,a+=`camera_tile_x       EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Camera tile X (column)
`,t++,a+=`camera_tile_y       EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Camera tile Y (row)
`,t++,a+=`world_width_tiles   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; World width in tiles
`,t++,a+=`world_height_tiles  EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; World height in tiles
`,t++,a+=`scroll_dirty_flag   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; 1=viewport changed, needs redraw
`,t++,a+=`hud_dirty_flag      EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; 1=HUD needs redraw, 0=clean
`,t++,a+=`time_second_frame_counter EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; VBlank frames remaining until the next TimeRemaining decrement
`,t++,a+=`time_last_interrupt_counter EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Last interrupt_counter snapshot used by TimeRemaining sync (16-bit)
`,t+=2,a+=`
; ==================================================================
; ANIMATED TILES VARIABLES
; ==================================================================
`,a+=`anim_tile_timer     EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Animation frame timer
`,t++,a+=`anim_tile_frame     EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Current animation frame (0-3)
`,t++,a+=`anim_tile_speed     EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Frames between animation updates
`,t++,a+=`anim_tile_transform_flags EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Runtime flags for transform-mode tile animation (byte0=flags, byte1=opcode scratch)\r
`,t+=2,a+=`anim_tile_row_buffer EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temp buffer (8 bytes) for row transforms
`,t+=8,a+=`
; ==================================================================
; ENTITY SYSTEM VARIABLES (Fixed 32 entities)
; ==================================================================
MAX_ENTITIES        EQU 32
`,a+=`entity_active       EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity active flags (32 bytes, 0=inactive, 1=active)
`,t+=32,a+=`entity_is_player    EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity hero/player flag (32 bytes, 0=no, 1=yes)
`,t+=32,a+=`entity_x_pos        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity X positions (32 bytes)
`,t+=32,a+=`entity_y_pos        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity Y positions (32 bytes)
`,t+=32,a+=`entity_vel_x        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity X velocity (32 bytes)
`,t+=32,a+=`entity_vel_y        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity Y velocity (32 bytes)
`,t+=32,a+=`entity_comp_masks   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity component masks (32 bytes)
`,t+=32,a+=`entity_comp_masks_hi EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity component masks high byte (32 bytes)
`,t+=32,a+=`entity_screen_id    EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity screen ID (32 bytes)
`,t+=32,a+=`entity_job_period   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity job period in frames (32 bytes, 1=100%,2=50%,3=33%,4=25%)
`,t+=32,a+=`entity_job_entry    EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity job entry slot within period window (32 bytes)
`,t+=32,a+=`entity_job_scheduler_active EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; 1 when any entity uses non-default job cadence
`,t++,a+=`entity_dir_mask     EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity direction mask (32 bytes)
`,t+=32,a+=`entity_input_speed  EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity input/cursor speed (32 bytes)
`,t+=32,a+=`entity_health       EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity health (32 bytes)
`,t+=32,a+=`entity_anim_frame   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity animation frame (32 bytes)
`,t+=32,a+=`entity_anim_tick    EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity animation tick counter (32 bytes)
`,t+=32,a+=`entity_anim_speed   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity animation speed (ticks per frame) (32 bytes)
`,t+=32,a+=`entity_anim_flags   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity animation flags (32 bytes)
`,t+=32,a+=`entity_sm_ptr_l     EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity State Pointer Low (32 bytes)
`,t+=32,a+=`entity_sm_ptr_h     EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity State Pointer High (32 bytes)
`,t+=32,a+=`entity_sm_timer_l   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity State Timer Low (32 bytes)
`,t+=32,a+=`entity_sm_timer_h   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity State Timer High (32 bytes)
`,t+=32,a+=`entity_sm_wait_timer EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity State Wait Timer (32 bytes)
`,t+=32,a+=`entity_lifetime     EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity lifetime for auto-destroy (32 bytes, 0=infinite)
`,t+=32,a+=`entity_carried_by   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity carrier ID (32 bytes, 255=not carried)
`,t+=32,a+=`entity_template_token EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity template token (32 bytes, 0=unknown)
`,t+=32,a+=`entity_facing_dir   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Last facing direction (32 bytes, 0=none,1=left,2=right,3=up,4=down)
`,t+=32;for(let r=0;r<8;r++)a+=`entity_sm_var_${r}     EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity Variable ${r} (32 bytes)
`,t+=32;a+=`
; ==================================================================
; SPRITE SYSTEM VARIABLES
; ==================================================================
`,a+=`entity_sprite_asset_index EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity sprite asset index - RAM copy (32 bytes)
`,t+=32,a+=`active_sprite_count EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Number of sprites currently active
`,t++,a+=`sprites_dirty      EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; 1=sprite_attributes changed, needs VRAM sync
`,t++,a+=`sprite_pattern      EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Sprite pattern IDs (32 bytes)
`,t+=32,a+=`sprite_color        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Sprite colors (32 bytes)
`,t+=32,a+=`sprite_layer_colors EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; HW sprite layer color cache - RAM copy (32 bytes, indexed by HW sprite index)
`,t+=32,a+=`sprite_asset_base_pattern_slot_runtime EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Runtime base 16x16 slot per sprite asset (${l} bytes)
`,t+=l,a+=`sprite_placeholder_base_pattern_num EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Runtime placeholder pattern number (base slot * 4)
`,t++,a+=`sprite_attributes   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Interleaved sprite attributes (32 * 4 bytes)
`,t+=128,e.screenMaps.length>0&&(a+=`
; ==================================================================
; SCREEN SYSTEM VARIABLES (${e.screenMaps.length} screens detected)
; ==================================================================
`,a+=`current_screen_id   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Currently displayed screen ID
`,t++,a+=`screen_dirty_flag   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Screen needs redraw flag
`,t++,a+=`screen_transition_cooldown EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Cooldown frames after screen transition
`,t++,a+=`current_world_id    EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Current world ID (for multi-world support)
`,t++,a+=`current_screen_index EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Current screen index within world
`,t++,a+=`current_screen_anim_group_count EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Animated tile groups visible in current screen
`,t++,a+=`current_screen_entity_count EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity instances assigned to current screen
`,t++,a+=`current_screen_sprite_pattern_slots EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Sprite pattern slots needed by current screen
`,t++,a+=`current_screen_summary_flags EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Runtime screen summary flags (music/hud/effects/anim)
`,t++),a+=`
; ==================================================================
; PLAYER SYSTEM VARIABLES (player entity detected)
; ==================================================================
`,a+=`player_x            EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Player X position (16-bit)
`,t+=2,a+=`player_y            EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Player Y position (16-bit)
`,t+=2,a+=`player_runtime_enabled EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; 1=player fast runtime bound to hero entity
`,t++,a+=`player_entity_index EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity index used by player fast runtime (#FF=none)
`,t++,a+=`player_vx_runtime   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Cached player X velocity (signed 8-bit)
`,t++,a+=`player_vy_runtime   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Cached player Y velocity (signed 8-bit)
`,t++,a+=`player_health       EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Player health points
`,t++,a+=`player_score        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Player score (16-bit)
`,t+=2,a+=`gem_count           EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Collectible tile counter (8-bit)
`,t++,a+=`last_gem_char       EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Char code of last collected gem tile (for SM VARIABLE_COMPARE)
`,t++,a+=`
; Persistent collectibles list (survives screen re-entry)
`,a+=`MAX_COLLECTIBLES     EQU 64              ; Max persistent collectible records
`,a+=`collected_count      EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Number of collected tiles recorded (8-bit)
`,t++,a+=`collected_world      EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; World IDs for each collected tile (MAX_COLLECTIBLES bytes)
`,t+=64,a+=`collected_screen     EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Screen IDs for each collected tile (MAX_COLLECTIBLES bytes)
`,t+=64,a+=`collected_idx_l      EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Tile name-table index low byte (MAX_COLLECTIBLES bytes)
`,t+=64,a+=`collected_idx_h      EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Tile name-table index high byte (MAX_COLLECTIBLES bytes)
`,t+=64,a+=`
; Timed bonus tile respawn slots (bonus gem regeneration)
`,a+=`MAX_BONUS_RESPAWNS   EQU 16              ; Max timed bonus tiles waiting to respawn
`,a+=`bonus_respawn_world  EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; World IDs for timed bonus respawns (MAX_BONUS_RESPAWNS bytes)
`,t+=16,a+=`bonus_respawn_screen EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Screen IDs for timed bonus respawns (MAX_BONUS_RESPAWNS bytes)
`,t+=16,a+=`bonus_respawn_idx_l  EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Tile index low byte for timed respawns (MAX_BONUS_RESPAWNS bytes)
`,t+=16,a+=`bonus_respawn_idx_h  EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Tile index high byte for timed respawns (MAX_BONUS_RESPAWNS bytes)
`,t+=16,a+=`bonus_respawn_secs   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Remaining seconds per timed respawn slot (MAX_BONUS_RESPAWNS bytes)
`,t+=16,a+=`bonus_respawn_frames EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Frame countdown (60..1) per timed respawn slot (MAX_BONUS_RESPAWNS bytes)
`,t+=16,a+=`
; ==================================================================
; AUXILIARY VARIABLES 
; ==================================================================
deterministic        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Deterministic mode flag
`,t++,a+=`
; ==================================================================
; TEMPORARY VARIABLES (ALWAYS NEEDED)
; ==================================================================
`,a+=`temp_word_1         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 16-bit storage
`,t+=2,a+=`temp_word_2         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 16-bit storage
`,t+=2,a+=`temp_byte_1         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage
`,t++,a+=`temp_byte_2         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage
`,t++,a+=`temp_byte_3         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,a+=`temp_byte_4         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,a+=`temp_byte_5         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,a+=`temp_byte_6         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,a+=`
; ==================================================================
; SOUND SYSTEM VARIABLES
; ==================================================================
`,a+=`sfx_active          EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; 0=no SFX active, 1=playing
`,t++,a+=`sfx_timer           EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Frames remaining for current SFX
`,t++,a+=`sfx_fadeout         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Reserved fadeout flag/state
`,t++,a+=`temp_byte_7         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,a+=`temp_byte_8         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,a+=`temp_byte_9         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,a+=`temp_byte_10        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,a+=`temp_byte_11        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,a+=`temp_byte_12        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,a+=`temp_byte_13        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,a+=`temp_byte_14        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,a+=`temp_byte_15        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,a+=`temp_byte_16        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,a+=`temp_byte_17        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,a+=`temp_byte_18        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,a+=`temp_byte_19        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,a+=`temp_byte_20        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,a+=`temp_byte_21        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,a+=`temp_byte_22        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,a+=`temp_byte_23        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,a+=`temp_byte_24        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,a+=`temp_byte_25        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,a+=`temp_word_3         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 16-bit storage (64 bytes)
`,t+=64,a+=`temp_word_4         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 16-bit storage (64 bytes)
`,t+=64,a+=`temp_byte_26        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,a+=`temp_byte_27        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,a+=`temp_byte_28        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,t+=32,a+=`tileDead_dbg        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Debug byte: current hero deadly contact
`,t++,a+=`tileDead_latched_dbg EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Debug byte: latched hero deadly contact
`,t++,a+=`tileDead_x_dbg      EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Debug byte: last sampled deadly tile X
`,t++,a+=`tileDead_y_dbg      EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Debug byte: last sampled deadly tile Y
`,t++,a+=`tileDead_value_dbg  EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Debug byte: last raw deadly behavior value
`,t++,a+=`
; Wall collision temporary variables
`,a+=`wall_temp_x         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Cached entity X for wall checks
`,t++,a+=`wall_temp_y         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Cached entity Y for wall checks
`,t++,a+=`wall_hit_left       EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Hitbox left edge cache
`,t++,a+=`wall_hit_top        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Hitbox top edge cache
`,t++,a+=`wall_hit_right      EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Hitbox right edge cache
`,t++,a+=`wall_hit_bottom     EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Hitbox bottom edge cache
`,t++,a+=`wall_hit_w          EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Hitbox width cache (min 1)
`,t++,a+=`wall_hit_h          EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Hitbox height cache (min 1)
`,t++,a+=`wall_probe_left     EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; X probe near hitbox left (adaptive inset)
`,t++,a+=`wall_probe_right    EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; X probe near hitbox right (adaptive inset)
`,t++,a+=`wall_probe_top      EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Y probe near hitbox top (adaptive inset)
`,t++,a+=`wall_probe_bottom   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Y probe near hitbox bottom (adaptive inset)
`,t++,a+=`
; Unified update helpers
`,a+=`active_entity_list  EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Entity indices with non-zero component masks (MAX_ENTITIES bytes)
`,t+=32,a+=`active_entity_count EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Number of entries in active_entity_list
`,t++,a+=`hero_entity_id      EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; First current-screen entity flagged as player (#FF = none)
`,t++,a+=`active_entity_list_dirty EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; 1=rebuild active_entity_list required
`,t++,a+=`input_entity_list   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Active current-screen entities with Input component (MAX_ENTITIES bytes)
`,t+=32,a+=`input_entity_count  EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Number of entries in input_entity_list
`,t++,a+=`render_entity_list  EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Active current-screen entities with Sprite component (MAX_ENTITIES bytes)
`,t+=32,a+=`render_entity_count EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Number of entries in render_entity_list
`,t++,a+=`collision_entity_list EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Active current-screen entities with Collision component (MAX_ENTITIES bytes)
`,t+=32,a+=`collision_entity_count EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Number of entries in collision_entity_list
`,t++,a+=`ground_entity_list  EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Active current-screen entities with Collision or Gravity (MAX_ENTITIES bytes)
`,t+=32,a+=`ground_entity_count EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Number of entries in ground_entity_list
`,t++,a+=`anim_entity_list    EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Active current-screen entities with Animation+Sprite (MAX_ENTITIES bytes)
`,t+=32,a+=`anim_entity_count   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Number of entries in anim_entity_list
`,t++,a+=`
; Entity-entity collision optimized variables
`,a+=`coll_list           EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Active collidable entity indices (MAX_ENTITIES bytes)
`,t+=32,a+=`coll_list_count     EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Number of entities in coll_list
`,t++,a+=`coll_src_left       EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Source AABB left edge (scratch)
`,t++,a+=`coll_src_right      EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Source AABB right edge (scratch)
`,t++,a+=`coll_src_top        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Source AABB top edge (scratch)
`,t++,a+=`coll_src_bottom     EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Source AABB bottom edge (scratch)
`,t++,a+=`
; ==================================================================
; INTERRUPT SYSTEM VARIABLES (dynamically allocated)
; ==================================================================
`,a+=`task_table              EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Task table base (8 slots x 2 bytes = 16 bytes)
`;for(let r=0;r<8;r++)a+=`task_${r}_ptr              EQU #${(t+r*2).toString(16).toUpperCase().padStart(4,"0")}   ; Slot ${r} pointer (2 bytes)
`;t+=16,a+=`interrupt_system_enabled EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; 0=disabled, 1=enabled (1 byte)
`,t++,a+=`old_htimi_hook          EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Original H.TIMI hook (5 bytes)
`,t+=5,a+=`interrupt_counter       EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Frame counter (16-bit)
`,t+=2,a+=`task_exec_time          EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Cycles used by tasks (16-bit, debug)
`,t+=2,a+=`vblank_flag             EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Set to 1 on each VBlank (1 byte)
`,t++,a+=`RAM_INTERRUPT_END       EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; End of interrupt system
`,a+=`
; ==================================================================
; STATE MACHINE SOUND RUNTIME (one active sound asset)
; ==================================================================
`,a+=`sm_sound_active       EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; 0=idle, 1=playing state-machine sound asset
`,t++,a+=`sm_sound_frames_left  EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Frames left for current state-machine sound asset
`,t++,a+=`sm_sound_ptr_l        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Next sound frame pointer low byte
`,t++,a+=`sm_sound_ptr_h        EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Next sound frame pointer high byte
`,t++,a+=`
; ==================================================================
; TRACKER MUSIC RUNTIME
; ==================================================================
`,a+=`music_active         EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; 0=stopped, 1=track active
`,t++,a+=`music_muted          EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; 0=audible, 1=muted/pause
`,t++,a+=`music_loop           EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; 0=no loop, 1=loop enabled
`,t++,a+=`music_track_index    EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Current ROM track index
`,t++,a+=`music_row_frames     EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Frames per tracker row
`,t++,a+=`music_row_countdown  EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Countdown to next row
`,t++,a+=`music_order_pos      EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Current order position
`,t++,a+=`music_pattern_index  EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Current pattern index
`,t++,a+=`music_pattern_row    EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Current row inside pattern
`,t++,a+=`music_pattern_rows   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Cached rows in current pattern
`,t++,a+=`music_track_ptr_l    EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Current track pointer low byte
`,t++,a+=`music_track_ptr_h    EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Current track pointer high byte
`,t++,a+=`music_pattern_ptr_l  EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Current pattern rows pointer low byte
`,t++,a+=`music_pattern_ptr_h  EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; Current pattern rows pointer high byte
`,t++,a+=`music_mixer_shadow   EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; PSG mixer shadow for music runtime
`,t++;const o=[{base:"music_ch_note_base",prefix:"music_ch",suffix:"note",comment:"Current note index (255=silent)"},{base:"music_ch_instrument_base",prefix:"music_ch",suffix:"instrument",comment:"Current instrument id (0=none)"},{base:"music_ch_ornament_base",prefix:"music_ch",suffix:"ornament",comment:"Current ornament id (0=none)"},{base:"music_ch_volume_base",prefix:"music_ch",suffix:"volume",comment:"Current base volume (0-15)"},{base:"music_ch_vol_step_base",prefix:"music_ch",suffix:"vol_step",comment:"Reserved software volume envelope step"},{base:"music_ch_tone_step_base",prefix:"music_ch",suffix:"tone_step",comment:"Reserved software tone envelope step"},{base:"music_ch_noise_step_base",prefix:"music_ch",suffix:"noise_step",comment:"Reserved software noise envelope step"},{base:"music_ch_orn_step_base",prefix:"music_ch",suffix:"orn_step",comment:"Reserved ornament step"}],n=["a","b","c"];for(const r of o){const i=t;a+=`${r.base} EQU #${i.toString(16).toUpperCase().padStart(4,"0")}   ; ${r.comment} (3 bytes)
`,n.forEach((c,d)=>{a+=`${r.prefix}_${c}_${r.suffix} EQU #${(i+d).toString(16).toUpperCase().padStart(4,"0")}   ; Channel ${c.toUpperCase()}
`}),t+=3}if(Array.isArray(e.tracks)&&e.tracks.some(r=>(r==null?void 0:r.playbackBackend)==="external-pt3")){const r=t,i=c=>(r+c).toString(16).toUpperCase().padStart(4,"0");a+=`
; ==================================================================
; PT3 REPLAYER WORKSPACE (~448 bytes)
; Layout matches PT3-ROM-alltables-glass.asm expected labels
; ==================================================================
PT3_SETUP       EQU #${i(0)}   ; PT3 state flags (bit0=loop, bit7=song_ended)
PT3_MODADDR     EQU #${i(1)}   ; Module address pointer (2 bytes)
PT3_CrPsPtr     EQU #${i(3)}   ; Current position pointer
PT3_SAMPTRS     EQU #${i(5)}   ; Sample pointers base
PT3_OrnPtrs     EQU #${i(7)}   ; Ornament pointers base
PT3_PDSP        EQU #${i(9)}   ; Pattern data start pointer
PT3_CSP         EQU #${i(11)}   ; Saved SP (CHREGS SP trick)
PT3_PSP         EQU #${i(13)}   ; PT3 stack pointer save
PT3_PrNote      EQU #${i(15)}   ; Previous note
PT3_PrSlide     EQU #${i(16)}   ; Previous slide (2 bytes)
PT3_AdInPtA     EQU #${i(18)}   ; Channel A inline pointer
PT3_AdInPtB     EQU #${i(20)}   ; Channel B inline pointer
PT3_AdInPtC     EQU #${i(22)}   ; Channel C inline pointer
PT3_LPosPtr     EQU #${i(24)}   ; Loop position pointer
PT3_PatsPtr     EQU #${i(26)}   ; Patterns table pointer
PT3_Delay       EQU #${i(28)}   ; Song speed/delay
PT3_AddToEn     EQU #${i(29)}   ; Add to envelope
PT3_Env_Del     EQU #${i(30)}   ; Envelope delay
PT3_ESldAdd     EQU #${i(31)}   ; Envelope slide add (2 bytes)
PT3_NTL3        EQU #${i(33)}   ; Note table link 3
VARS            EQU #${i(35)}   ; Channel vars base
ChanA           EQU #${i(35)}   ; Channel A data (29 bytes)
ChanB           EQU #${i(64)}   ; Channel B data (29 bytes)
ChanC           EQU #${i(93)}   ; Channel C data (29 bytes)
DelyCnt         EQU #${i(122)}   ; Delay counter
CurESld         EQU #${i(123)}   ; Current envelope slide (2 bytes)
CurEDel         EQU #${i(125)}   ; Current envelope delay
Ns_Base_AddToNs EQU #${i(126)}   ; Noise base + add to noise (combined)
Ns_Base         EQU #${i(126)}   ; Noise base
AddToNs         EQU #${i(127)}   ; Add to noise
NT_             EQU #${i(128)}   ; Note table (192 bytes)
AYREGS          EQU #${i(320)}  ; AY registers mirror (14 bytes)
VT_             EQU #${i(320)}  ; Volume table base (alias for AYREGS)
EnvBase         EQU #${i(334)}  ; Envelope base
VAR0END         EQU #${i(336)}  ; End of fixed workspace
T1_             EQU #${i(336)}  ; Tone tables start (unpacked by PT3_INIT)
T_NEW_1         EQU #${i(336)}  ; Tone table new 1
T_OLD_1         EQU #${i(336)}  ; Tone table old 1
T_OLD_2         EQU #${i(360)}  ; Tone table old 2
T_NEW_3         EQU #${i(384)}  ; Tone table new 3
T_OLD_3         EQU #${i(384)}  ; Tone table old 3
T_OLD_0         EQU #${i(386)}  ; Tone table old 0
T_NEW_0         EQU #${i(386)}  ; Tone table new 0
T_NEW_2         EQU #${i(410)}  ; Tone table new 2 (last, ends at +0x1B2)
    `,t=r+576}return a+=`
; ==================================================================
; ZX0 TEMPORARY RAM BUFFERS
; ==================================================================
; Fixed high-RAM scratch area used by compressed asset loaders and
; plain48k page-0 decompression helpers.
ZX0_SCREEN_BUFFER       EQU #DE00   ; Screen/layout scratch (768 bytes)
ZX0_BEHAVIOR_BUFFER     EQU #E100   ; Behavior map scratch (768 bytes)
ZX0_TILE_PATTERN_BUFFER EQU #E400   ; Tile pattern scratch (1488 bytes)
ZX0_TILE_COLOR_BUFFER   EQU #EA00   ; Tile color scratch (1488 bytes)
ZX0_FONT_PATTERN_BUFFER EQU #F000   ; Font pattern scratch (360 bytes)
; Keep font buffers tightly packed to leave enough headroom below SP=#F380.
; Old layout put FONT_COLOR at #F200, leaving only 24 bytes before the stack.
ZX0_FONT_COLOR_BUFFER   EQU #F168   ; Font color scratch (360 bytes)
`,a+=`
; ==================================================================
; END OF VARIABLES
; ==================================================================
RAM_USAGE_END       EQU #${t.toString(16).toUpperCase().padStart(4,"0")}   ; End of project variables (${t-49152} bytes used)

; ==================================================================
; MEMORY LAYOUT INFO (Reference only - no code generated)
; ==================================================================
; RAM Layout:
;   #C000-#${t.toString(16).toUpperCase().padStart(4,"0")}: Project variables (${t-49152} bytes)
;   #${t.toString(16).toUpperCase().padStart(4,"0")}-#F37F: Free RAM (~${62336-t} bytes available)
;   #F380-#FFFF: MSX System variables (DO NOT TOUCH)
;
; NOTE: Variables are defined using EQU (address labels only).
;       RAM space is used at runtime, NOT reserved in ROM.
;       Do NOT use ORG #C000 in cartridge ROMs!
; ==================================================================
`,a}function yo(e,l){if(!e)return"";let a="";const t=!!(e.tracks&&e.tracks.length>0||e.stateMachines&&e.stateMachines.length>0),o=(l==null?void 0:l.mode)==="interruptTaskManager";return t&&(a+=`    ; Initialize PSG/audio once at boot. WorldLink must not reset music after a Music node.
`,a+=`    call init_sound_system

`),o?(a+=`    ; Register boot-time IRQ tasks defined by the engine execution plan.
`,a+=`    call init_default_tasks_from_plan

`):a+=`    ; GameLoop+HALT mode: keep gameplay/audio ticks in the main GameFlow loops.

`,a}function Eo(e,l,a,t="simple32k"){var i,c,d,_;let o="";if(l!=null&&l.gameFlow){const p=l.gameFlow;o=`
; GameFlow Integration: Using "${p.name}" as execution orchestrator`;const h=p.nodes.find(u=>u.type==="Start");if(h){const u=p.connections.find(f=>{var b;return((b=f.from)==null?void 0:b.nodeId)===h.id||typeof f.from=="string"&&f.from===h.id});if(u){const f=((i=u.to)==null?void 0:i.nodeId)||u.to,b=p.nodes.find(m=>m.id===f);b&&(o+=`
; Flow: Start → ${b.type} (${b.title||b.name||b.id})`)}}}const s=!!((c=l==null?void 0:l.presentationScreen)!=null&&c.enabled&&((d=l.presentationScreen.runtime)!=null&&d.showAtBoot)&&Array.isArray((_=l.presentationScreen.data)==null?void 0:_.nameTable)&&l.presentationScreen.data.nameTable.length===768)?`    ; Optional Presentation Screen configured in project data
    call show_presentation_screen

`:"";return`; ==================================================================
; MSX CARTRIDGE ROM HEADER
; File: header.asm
; Description: Standard MSX cartridge initialization${o}
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

    ; Cold boot path: ensure cartridge page 2 (8000h-BFFFh) is mapped to the cartridge slot.
    ; Required for both simple32k and plain48k: the BIOS only maps page 1 when it finds "AB",
    ; page 2 must be explicitly mapped via SETPAGES32K (reads page-1 slot, applies it to page 2).
    call SETPAGES32K
    jp restart_rom_continue

; Restart entry point for GameFlow Restart node.
; Reinitializes runtime safely without remapping cartridge pages.
restart_rom:
    di
    im 1
    ld sp, #F380

restart_rom_continue:
    ; Capture the normal slot state for optional linear 48K page-0 helpers.
    call init_page0_runtime_state

    ; Initialize mapper runtime state (safe no-op in simple32k mode)
    call mapper_runtime_init

    ; Reset some interrupts to ensure compatibility
    ; with MSX computers with disk controllers
    ld a, #C9
    ld (HKEY), a
    ; NOTE: TIMI (H.TIMI) is now managed by init_interrupt_system

    ; Silence click, init keyboard, clear config
    xor a
    ld (CLIKSW), a
    ld (deterministic), a
    
    ; Change background colors
    ld (BAKCLR), a
    ld (BDRCLR), a
    call CHGCLR

    ; Disable screen while switching modes / initializing VDP
    call DISSCR

    ; Change screen mode to SCREEN 2
    ld a, 2
    call CHGMOD

    ; Configure 16x16 sprites
    ; VDP Register #01: activate sprites, generate interrupts, 16x16 sprites
    ld bc, #E201
    call FAST_WRTVDP
    ; CRITICAL: Update BIOS system variable RG1SAV to match
    ; Without this, DISSCR/ENASCR will overwrite VDP R1 losing 16x16 sprite config
    ld a, #E2
    ld (#F3E0), a       ; RG1SAV = #E2 (preserves 16x16 sprite bit)

    ; Detect 50Hz/60Hz
    call CheckIf60Hz
    ld (isComputer50HzOr60Hz), a ; 0: 50Hz, 1: 60Hz

    ; ====================================================
    ; INTERRUPT SYSTEM INITIALIZATION (Konami-style)
    ; ====================================================
    ; Initialize interrupt task system (hooks H.TIMI)
    call init_interrupt_system
    di

    ; Register default tasks based on project needs
    ${yo(l,a)}
    ei

${l.hasGameFlow?`    ; ====================================================
    ; GAMEFLOW INITIALIZATION
    ; ====================================================
${s}    ; Initialize GameFlow system
    call gameflow_init

    ; Start execution from GameFlow Start node
    ; GameFlow is now the sole orchestrator
    call ENASCR
    jp gameflow_start`:`    ; ====================================================
    ; SIMPLE GAME LOOP (No GameFlow)
    ; ====================================================
    ; Initialize game entities
${s}    call init_game_entities
    call load_game_screen
    call rebuild_used_entity_list
    call ENASCR
    jp main_loop`}

; ==================================================================
; AUXILIARY FUNCTIONS
; ==================================================================

; Helper: Get expanded slot value for ENASLT/CALSLT usage
; Input:  A = slot number (0-3) in lower bits
; Output: A = expanded slot value if needed
GETSLOT:
    and #03             ; Proteccion, nos aseguramos de que el valor esta en 0-3
    ld  c,a             ; c = slot de la pagina
    ld  b,0             ; bc = slot de la pagina
    ld  hl,#fcc1        ; Tabla de slots expandidos
    add hl,bc           ; hl -> variable que indica si este slot esta expandido
    ld  a,(hl)          ; Tomamos el valor
    and #80             ; Si el bit mas alto es cero...
    jr  z,GETSLOT_EXIT  ; ...nos vamos a @@EXIT
    ; --- El slot esta expandido ---
    or  c               ; Slot basico en el lugar adecuado
    ld  c,a             ; Guardamos el valor en c
    inc hl              ; Incrementamos hl una...
    inc hl              ; ...dos...
    inc hl              ; ...tres...
    inc hl              ; ...cuatro veces
    ld  a,(hl)          ; a = valor del registro de subslot del slot donde estamos
    and #0C             ; Nos quedamos con el valor donde esta nuestro cartucho
GETSLOT_EXIT:
    or  c
    ret

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
`}function go(e){var l,a;return(((l=e.tracks)==null?void 0:l.length)||0)>0||(((a=e.stateMachines)==null?void 0:a.length)||0)>0}function So(e,l){return go(e)?!(l!=null&&l.tasks.some(a=>a.responsibility==="audio")):!1}function zt(e,l){return So(e,l)?`    call task_audio_tick
`:""}function ge(e){return e.replace(/[^a-zA-Z0-9]/g,"_")}function Ea(e){return String(e||"").replace(/"/g,"").replace(/\r?\n/g," ").trim()}function ga(e){const l=String(e||"").trim();if(!l||l.toLowerCase().startsWith("rgba(0,0,0,0"))return null;const a=l.replace("#","");if(a.length!==6)return null;const t=parseInt(a.substring(0,2),16),o=parseInt(a.substring(2,4),16),n=parseInt(a.substring(4,6),16);return[t,o,n].some(s=>Number.isNaN(s))?null:{r:t,g:o,b:n}}function qa(e,l=!0){const a=String(e||"").trim();if(!a||a.toLowerCase().startsWith("rgba(0,0,0,0"))return l?0:1;const t=a.toUpperCase(),o=ce.find(i=>i.hex.toUpperCase()===t);if(o)return o.index;const n=ga(a);if(!n)return l?0:1;let s=l?0:1,r=1/0;for(const i of ce){if(!l&&i.index===0)continue;const c=ga(i.hex);if(!c)continue;const d=(n.r-c.r)**2+(n.g-c.g)**2+(n.b-c.b)**2;d<r&&(r=d,s=i.index)}return s}function Sa(e){const l=qa(e,!1);return l===0?1:l}function Ao(e,l){const a=String(l||"").trim();return a?(Array.isArray(e.sprites)?e.sprites:[]).findIndex(o=>String((o==null?void 0:o.id)||"").trim()===a):-1}function Ja(e){var n;const l=(e==null?void 0:e.spritePalette)||[],a=e==null?void 0:e.backgroundColor,t=(e==null?void 0:e.frames)||[];if(!l.length||!t.length)return[];const o=[];for(let s=0;s<l.length;s++){const r=l[s];if(!r||r===a)continue;let i=!1;for(const c of t)if(c!=null&&c.data){for(let d=0;d<(c.data.length||0)&&!i;d++)for(let _=0;_<(((n=c.data[d])==null?void 0:n.length)||0)&&!i;_++)c.data[d][_]===r&&(i=!0);if(i)break}i&&o.push(s)}return o}function To(e){const l=(e==null?void 0:e.spritePalette)||[],a=e==null?void 0:e.backgroundColor,t=Ja(e);if(t.length===0)return{layerOffsets:[0],layerColors:[15]};const o=t.slice(0,4);if(o.length===0)return{layerOffsets:[0],layerColors:[15]};const n=o.slice(),s=o.map(r=>{const i=l[r];return!i||a&&i===a?0:qa(i,!0)});return{layerOffsets:n,layerColors:s}}function Co(e){var t,o,n;const l=((t=e==null?void 0:e.appearance)==null?void 0:t.selectorType)??((o=e==null?void 0:e.appearance)==null?void 0:o.cursorType)??((n=e==null?void 0:e.appearance)==null?void 0:n.cursorMode)??(e==null?void 0:e.selectorType)??(e==null?void 0:e.cursorType)??(e==null?void 0:e.cursorMode),a=String(l||"").trim().toLowerCase();return a==="char"||a==="character"||a==="text"||a==="glyph"?"char":a==="sprite"||a==="image"?"sprite":"auto"}function Io(e){var o;const l=Array.isArray(e==null?void 0:e.options)?e.options:[];if(l.length===0)return 0;const a=(e==null?void 0:e.initialSelection)??(e==null?void 0:e.initialSelectedOption)??((o=e==null?void 0:e.appearance)==null?void 0:o.initialSelection)??0,t=Number(a);return!Number.isFinite(t)||t<0||t>=l.length?0:Math.floor(t)}function el(e){return`NODE_TYPE_${e.replace(/([a-z])([A-Z])/g,"$1_$2").toUpperCase()}`}function vo(e){const l=(e.name||"DEFAULT").toUpperCase().replace(/[^A-Z0-9]/g,"_"),a=e.id?`_${e.id.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";return`load_screen_${l.toLowerCase()}${a.toLowerCase()}`}function Ro(e,l,a,t){return`${`${(e==null?void 0:e.name)||`sprite_${l}`}_${l}`.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase()}_F${a}_LAYER${t}`}function tl(e,l){const a=String(e||"").trim();if(!a)return null;const t=r=>`global_var_${r.replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"").replace(/[^a-z0-9_]/g,"_")}`,o=a.toLowerCase(),n=t(a),s=Array.isArray(l.globalVariables)?l.globalVariables:[];for(const r of s){const i=String((r==null?void 0:r.name)||"").trim(),c=String((r==null?void 0:r.asmName)||"").trim();if(i&&i.toLowerCase()===o||c&&c.toLowerCase()===o||i&&t(i)===n)return r}return null}function $t(e,l){const a=String(e||"").trim();if(!a)return null;const t=r=>`global_var_${r.replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"").replace(/[^a-z0-9_]/g,"_")}`,o=tl(a,l);if(!o)return null;const n=String((o==null?void 0:o.name)||"").trim();return String((o==null?void 0:o.asmName)||"").trim()||t(n||a)}function wo(e){switch(String(e||"==").trim()){case"!=":return 1;case">":return 2;case"<":return 3;case">=":return 4;case"<=":return 5;case"==":default:return 0}}function No(e,l){if(typeof l=="boolean")return l?1:0;const a=Number(l);if(Number.isFinite(a))return Math.trunc(a);const t=String(l??"").trim().toLowerCase(),n=(Array.isArray(e==null?void 0:e.values)?e.values:[]).find(s=>{const r=String((s==null?void 0:s.label)??"").trim().toLowerCase(),i=String((s==null?void 0:s.value)??"").trim().toLowerCase();return r===t||i===t});if(n){if(typeof n.value=="boolean")return n.value?1:0;const s=Number(n.value);if(Number.isFinite(s))return Math.trunc(s)}return 0}function Lo(e){var o,n;const l=(n=(o=e==null?void 0:e.hudConfiguration)==null?void 0:o.importedFrame)==null?void 0:n.cells;if(!Array.isArray(l)||l.length===0)return null;const a=(e.name||"DEFAULT").toUpperCase().replace(/[^A-Z0-9]/g,"_"),t=e.id?`_${e.id.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";return`hud_imported_frame_${a.toLowerCase()}${t.toLowerCase()}_draw`}function Ht(e){const l=Array.isArray(e.screenMaps)?e.screenMaps:[],a=new Set;if(l.forEach(n=>{var i,c,d;const s=Array.isArray((i=n==null?void 0:n.hudConfiguration)==null?void 0:i.elements)&&n.hudConfiguration.elements.length>0,r=Array.isArray((d=(c=n==null?void 0:n.hudConfiguration)==null?void 0:c.importedFrame)==null?void 0:d.cells)&&n.hudConfiguration.importedFrame.cells.length>0;n!=null&&n.id&&(s||r)&&a.add(String(n.id))}),a.size===0)return[];const t=Array.isArray(e.worldmaps)?e.worldmaps:[],o=new Set;return t.length>0?t.forEach(n=>{const s=Array.isArray(n==null?void 0:n.nodes)?n.nodes:[];s.some(i=>a.has(String((i==null?void 0:i.screenAssetId)||"")))&&s.forEach((i,c)=>{i!=null&&i.screenAssetId&&o.add(c)})}):l.forEach((n,s)=>{n!=null&&n.id&&a.has(String(n.id))&&o.add(s)}),Array.from(o).sort((n,s)=>n-s)}function et(e,l,a=!1){if(e.length===0)return"";let t=`    ld a, (current_screen_id)
`;return e.forEach(o=>{t+=`    cp ${o}
`,t+=`    jp z, .${l}_do
`}),t+=`    jp .${l}_skip
`,t+=`.${l}_do:
`,a&&(t+=`    ld a, 1
`,t+=`    ld (hud_dirty_flag), a
`),t+=`    call render_hud
`,t+=`.${l}_skip:
`,t}function Do(e,l){var _,p,h;if(!e.gameFlow)return ko(e,l);const a=e.gameFlow,t=zt(e,l);let o=`; ==================================================================
; GAMEFLOW EXECUTION ENGINE
; File: gameflow.asm
; Description: GameFlow-based game orchestration system
; ==================================================================
;
; GameFlow: ${a.name||"Unnamed"}
; Total Nodes: ${((_=a.nodes)==null?void 0:_.length)||0}
; Total Connections: ${((p=a.connections)==null?void 0:p.length)||0}
; Start Node: ${a.startNodeId||"NONE"}
;
; ARCHITECTURE:
; - GameFlow is the SOLE execution orchestrator
; - Each node generates its own execution code
; - Connections between nodes define the complete flow
; - No hardcoded main_loop outside GameFlow
; ==================================================================

`;o+=`; ==================================================================
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
${a.startNodeId?`    ld hl, gameflow_node_${ge(a.startNodeId)}`:`    ; ERROR: No start node defined!
    ret`}
    jp gameflow_execute_node

`,o+=`; ==================================================================
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
`;const n=Array.from(new Set(((h=a.nodes)==null?void 0:h.map(u=>u.type))||[]));n.forEach(u=>{const f=`gameflow_handle_${u.toLowerCase()}`;o+=`    cp ${el(u)}
    jp z, ${f}
`}),o+=`    
    ; Unknown node type - error
    ret

`,o+=`; ==================================================================
; NODE TYPE HANDLERS
; Each handler receives:
;   DE = node data pointer
;   BC = connection table pointer
; ==================================================================

`,o+=xo(n,e,l),o+=`; ==================================================================
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

    ; OPTIMIZED: Skip this entry using ADD (11 cycles vs 3× INC = 18 cycles)
    ld bc, 3        ; Entry size: 1 byte type + 2 bytes address
    add hl, bc
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

; Shared data pointer for nodes without data
gameflow_no_data:
    db #C9                        ; RET instruction - returns immediately

`;const s=Ht(e),r=s.length>0,i=$t("TimeRemaining",e),c=!!i,d=et(s,"gf_worldloop_hud");return et(s,"gf_worldlink_hud",!0),o+=`; ==================================================================
; GAME LOOP (WorldLink nodes only)
; ==================================================================

; Main game loop - executed by WorldLink nodes
; This loop runs while a world/level is active
gameflow_world_game_loop:
    ; Check exit flag
    ld a, (gameflow_exit_requested)
    or a
    ret nz

    ; Frame sync first: start each tick exactly on V-Blank edge
    halt
${t}    ; Poll input immediately after V-Blank edge so the hero uses
    ; the freshest input state in the same visible frame.
    call task_update_input
    call update_player_fastpath

${c?`    ; Update per-screen countdown timer (60 seconds per stage)
    call update_world_screen_timer
`:""}

    ; Handle world screen edge transitions (Preview parity)
    call check_world_screen_transition

    ; Update all entities
    call update_all_entities

    ; Refresh player deadly-tile state before state machines consume it.
    call refresh_player_deadly_fastpath

    ; Refresh player tile interactions without running bonus respawns twice.
    call refresh_player_tile_interaction_fastpath

    ; Run the player state machine before the generic SM sweep.
    call refresh_player_state_machine_fastpath

    ; Execute all state machines
    call execute_all_state_machines

    ; Update timed PSG sound effects
    call sfx_update

    ; Refresh player animation with the final state of this frame.
    call refresh_player_animation_fastpath

    ; Refresh player sprite once with the final state of this frame.
    call refresh_player_sprite_fastpath

    ; Upload sprites after gameplay so the hero position computed this frame
    ; is what gets shown on screen, instead of the previous frame's SAT.
    call update_sprites_to_vram

    ; Animated transform tiles do VRAM read-modify-write, so defer them until
    ; after hero/entity work to keep player response prioritized.
    call update_animated_tiles

    ; Sprite SAT upload runs once per frame, outside ISR.
${r?`
    ; Render HUD only on screens that define HUD elements
${d}`:""}
    ; Loop
    jp gameflow_world_game_loop

`,c&&i&&(o+=`; ==================================================================
; SCREEN TIMER SUPPORT
; Resets TimeRemaining to 60 on every screen load/transition and
; decrements it once per real second using interrupt_counter deltas.
; ==================================================================

get_world_screen_timer_frames_per_second:
    ld a, (isComputer50HzOr60Hz)
    or a
    ld a, 50
    ret z
    ld a, 60
    ret

reload_world_screen_timer_frames:
    call get_world_screen_timer_frames_per_second
    ld (time_second_frame_counter), a
    ret

snapshot_world_screen_timer_interrupt_counter:
    ld a, (interrupt_counter)
    ld (time_last_interrupt_counter), a
    ld a, (interrupt_counter+1)
    ld (time_last_interrupt_counter+1), a
    ret

reset_world_screen_timer:
    push af
    ld a, 60
    ld (${i}), a
    xor a
    ld (${i}+1), a
    call reload_world_screen_timer_frames
    call snapshot_world_screen_timer_interrupt_counter
${r?`    ld a, 1
    ld (hud_dirty_flag), a
`:""}    pop af
    ret

update_world_screen_timer:
    push af
    push bc
    push de
    push hl

    ld a, (${i})
    ld b, a
    ld a, (${i}+1)
    or b
    jr z, .world_timer_done

    ld hl, (interrupt_counter)
    ld de, (time_last_interrupt_counter)
    or a
    sbc hl, de
    jr z, .world_timer_done

    call snapshot_world_screen_timer_interrupt_counter

    ld a, (time_second_frame_counter)
    or a
    jr nz, .world_timer_countdown_loaded
    call reload_world_screen_timer_frames
    ld a, (time_second_frame_counter)

.world_timer_countdown_loaded:
    ld e, a
    call get_world_screen_timer_frames_per_second
    ld c, a

.world_timer_consume_elapsed_frames:
    ld a, h
    or l
    jr z, .world_timer_store_countdown

    ld a, h
    or a
    jr nz, .world_timer_hit_second_boundary
    ld a, l
    cp e
    jr c, .world_timer_partial_consume

.world_timer_hit_second_boundary:
    ld a, l
    sub e
    ld l, a
    jr nc, .world_timer_no_borrow
    dec h
.world_timer_no_borrow:
    ld a, (${i})
    or a
    jr nz, .world_timer_dec_low
    ld a, (${i}+1)
    or a
    jr z, .world_timer_reached_zero
    dec a
    ld (${i}+1), a
    ld a, 255
    ld (${i}), a
    jr .world_timer_after_decrement

.world_timer_dec_low:
    dec a
    ld (${i}), a

.world_timer_after_decrement:
${r?`    ld a, 1
    ld (hud_dirty_flag), a
`:""}
    ld a, (${i})
    ld b, a
    ld a, (${i}+1)
    or b
    jr z, .world_timer_reached_zero
    ld e, c
    jr .world_timer_consume_elapsed_frames

.world_timer_partial_consume:
    ld a, e
    sub l
    ld e, a
    xor a
    ld h, a
    ld l, a
    jr .world_timer_store_countdown

.world_timer_reached_zero:
    ld e, c

.world_timer_store_countdown:
    ld a, e
    ld (time_second_frame_counter), a

.world_timer_done:
    pop hl
    pop de
    pop bc
    pop af
    ret

`),o+=`; ==================================================================
; NODE DATA STRUCTURES
; Each node has: type byte, data pointer, connection table pointer
; ==================================================================

`,a.nodes&&a.nodes.length>0&&a.nodes.forEach(u=>{o+=Mo(u,a,e)}),o+=`
; ==================================================================
; INITIALIZATION UTILITY FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; init_psg_silence
; Silence all PSG channels
; ------------------------------------------------------------------
init_psg_silence:
    push af
    push bc

    ; Silence channel A
    ld a, #08    ; Volume register channel A
    out (#A0), a
    ld a, 0      ; Volume = 0
    out (#A1), a

    ; Silence channel B
    ld a, #09    ; Volume register channel B
    out (#A0), a
    ld a, 0
    out (#A1), a

    ; Silence channel C
    ld a, #0A    ; Volume register channel C
    out (#A0), a
    ld a, 0
    out (#A1), a

    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; clear_sprite_table
; Clear sprite attribute table in VRAM
; ------------------------------------------------------------------
clear_sprite_table:
    push af
    push bc
    push de
    push hl

    ; Clear sprite attribute table (#1B00-#1B7F, 128 bytes)
    ld hl, #1B00         ; Sprite attribute table base
    ld bc, 128           ; 128 bytes (32 sprites × 4 bytes)
    ld a, #D1            ; Y=209 (off-screen)
.cst_loop:
    push af
    push bc
    push hl
    call WRTVRM          ; Write to VRAM
    pop hl
    pop bc
    pop af
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, .cst_loop

    pop hl
    pop de
    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; clear_vram_areas
; Clear VRAM pattern and color tables
; ------------------------------------------------------------------
clear_vram_areas:
    push af
    push bc
    push de
    push hl

    ; Clear pattern table (#0000-#17FF, 6144 bytes)
    ld hl, #0000
    ld bc, 6144
    ld a, 0
.clear_patterns:
    push af
    push bc
    push hl
    call WRTVRM
    pop hl
    pop bc
    pop af
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, .clear_patterns

    ; Clear color table (#2000-#37FF, 6144 bytes)
    ld hl, #2000
    ld bc, 6144
    ld a, #F0            ; White on black
.clear_colors:
    push af
    push bc
    push hl
    call WRTVRM
    pop hl
    pop bc
    pop af
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, .clear_colors

    pop hl
    pop de
    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; reset_vdp_registers
; Reset VDP registers to Screen 2 defaults
; ------------------------------------------------------------------
reset_vdp_registers:
    push af
    push bc

    ; Already configured in init_rom, this is a no-op for now
    ; Could be extended to reset specific registers if needed

    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; init_all_global_variables
; Initialize all global variables to their default values
; ------------------------------------------------------------------
init_all_global_variables:
`,e.globalVariables&&e.globalVariables.length>0&&(o+=`    ; Initialize global variables
`,e.globalVariables.forEach(u=>{const f=u.name,b=u.asmName||`global_var_${f.replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`,m=String(u.type||"").toLowerCase(),y=u.values&&u.values.length>0?u.values[0].value:0;let T=0;if(typeof y=="boolean")T=y?1:0;else{const g=Number(y);T=Number.isFinite(g)?Math.trunc(g):0}if(m==="word"||m==="16bit"){const g=Math.max(0,Math.min(65535,T));o+=`    ld a, ${g&255}
`,o+=`    ld (${b}), a    ; ${f} low byte = ${g}
`,o+=`    ld a, ${g>>8&255}
`,o+=`    ld (${b}+1), a    ; ${f} high byte = ${g}
`}else{const g=Math.max(0,Math.min(255,T));o+=`    ld a, ${g}
`,o+=`    ld (${b}), a    ; ${f} = ${g}
`}})),o+=`    ret

`,o+=`; ==================================================================
; GAMEFLOW VARIABLES
; ==================================================================

; Runtime GameFlow variables are allocated in variables.asm (RAM EQUs):
; gameflow_exit_requested, gameflow_menu_selection,
; gameflow_submenu_data_ptr, gameflow_submenu_option_count,
; gameflow_submenu_cursor_enabled, gameflow_submenu_cursor_layer_count,
; gameflow_condition_result

; ==================================================================
; COMMON GAMEFLOW UTILITIES
; ==================================================================

; ------------------------------------------------------------------
; Helper: Clear screen area for menus/end screens
; ------------------------------------------------------------------
clear_screen_area:
    ; Clear center area of screen
    ld b, 8                       ; 8 rows
    ld c, 8                       ; Start at row 8

.csa_loop:
    push bc
    ld a, c
    call clear_screen_row
    pop bc
    inc c
    djnz .csa_loop
    ret

; ------------------------------------------------------------------
; Helper: Clear a screen row (fill with empty tile)
; Input: A = Row number (0-23)
; ------------------------------------------------------------------
clear_screen_row:
    push af
    push bc
    push de
    push hl

    ; Calculate row start in name table
    ; Row address = #1800 + (row * 32)
    ld l, a
    ld h, 0
    add hl, hl                    ; * 2
    add hl, hl                    ; * 4
    add hl, hl                    ; * 8
    add hl, hl                    ; * 16
    add hl, hl                    ; * 32

    ; Add base address (name table)
    ld de, #1800                  ; Name table base (Screen 2)
    add hl, de                    ; HL = VRAM address

    ; Clear 32 tiles (one row)
    ex de, hl                     ; DE = VRAM destination
    ld hl, empty_row_data         ; HL = source (32 zeros)
    ld bc, 32                     ; Copy 32 bytes
    call LDIRVM

    pop hl
    pop de
    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; Data: Empty row (32 zero bytes)
; ------------------------------------------------------------------
empty_row_data:
    db 0, 0, 0, 0, 0, 0, 0, 0
    db 0, 0, 0, 0, 0, 0, 0, 0
    db 0, 0, 0, 0, 0, 0, 0, 0
    db 0, 0, 0, 0, 0, 0, 0, 0

; ==================================================================
; END OF GAMEFLOW
; ==================================================================
`,o}function xo(e,l,a){let t="";const o=zt(l,a),n=Ht(l),s=n.length>0,r=et(n,"gf_worldlink_hud",!0);e.forEach(d=>{var _;switch(d){case"Start":t+=`gameflow_handle_start:
    ; Start node - Initialize game state and systems
    ; DE = node data pointer:
    ;   [init_routine_ptr DW][init_routine_bank DB]
    ; BC = connection table

    push bc         ; Save connection table

    ; Execute initialization routine
    ; DE points to start_init_data structure
    ex de, hl
    ld e, (hl)
    inc hl
    ld d, (hl)      ; DE = initialization routine address
    inc hl
    ld b, (hl)      ; B = initialization routine bank
    ld h, d
    ld l, e         ; HL = initialization routine address

    ; Call initialization routine (if not null)
    ld a, h
    or l
    jr z, .skip_init

    ; Mapper-safe far call (auto window from HL address)
    ld a, b
    call mapper_call_hl_auto

.skip_init:
    ; Continue to next node
    pop bc
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z           ; No connection
    jp gameflow_execute_node

`;break;case"WorldLink":t+=`gameflow_handle_worldlink:
    ; WorldLink node - load world and enter game loop
    ; DE = world data pointer:
    ;   [load_world_ptr DW][load_world_bank DB]
    ; BC = connection table (for exit)

    push bc         ; Save connection table

    ; Load the world
    ; DE points to: dw load_world_X, db load_world_bank
    ex de, hl
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld b, (hl)      ; B = load_world_X bank
    ld h, d
    ld l, e         ; HL = load_world_X address

    ; Mapper-safe far call to world load routine
    ld a, h
    or l
    jr z, .after_load
    ld a, b
    call mapper_call_hl_auto

.after_load:
    ; Set game state
    xor a
    ld (gameflow_exit_requested), a
    ld a, FLOW_STATE_GAME
    ld (current_flow_state), a

    ; Sync SAT patterns using the slot table just filled by load_world.
    ; force_update_entity_sprite (called during init_entities) ran before
    ; load_sprite_patterns, so sprite_asset_base_pattern_slot_runtime was
    ; all zeros then.  Calling update_sprite_component here recomputes the
    ; correct slot->pattern mapping for all entities in the render list
    ; so the very first update_sprites_to_vram below writes the right data.
    call update_sprite_component

    ; Update sprites
    call update_sprites_to_vram
${s?`
    ; Bootstrap HUD only on screens that actually use HUD
${r}`:""}
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
    ; End node - stop execution and show end screen
    ; DE = end screen data pointer (screen type, message pointer)
    ; BC = connection table (unused, end stops execution)

    push de

    ; Get end screen type from data
    ld a, (de)                    ; A = screen type (0=victory, 1=defeat, 2=credits, etc.)
    push af                       ; Save screen type
    inc de
    ld a, (de)                    ; Get low byte of message pointer
    ld l, a
    inc de
    ld a, (de)                    ; Get high byte of message pointer
    ld h, a                       ; HL = message pointer (if any)
    pop af                        ; Restore screen type

    ; Display end screen based on type
    call display_end_screen

    pop de

    ; End screen loop - wait for input or timeout
.end_screen_loop:
    halt                          ; Wait V-blank
${o}

    ; Avoid BIOS joystick helpers here because they touch the PSG while
    ; VBlank music is writing it. Use keyboard matrix reads only.
    ld a, 8                       ; SPACE row
    call FAST_SNSMAT
    bit 0, a                      ; SPACE
    jr z, .end_screen_exit

    ; Check for ESC key to exit
    ld a, 7                       ; ESC key row
    call FAST_SNSMAT
    bit 2, a                      ; ESC key
    jr z, .end_screen_exit

    jr .end_screen_loop

.end_screen_exit:
    ret

; ------------------------------------------------------------------
; display_end_screen
; Display end screen based on type
; Input:  A = screen type (0=victory, 1=defeat, 2=credits, 3=custom)
;         HL = message pointer (for custom messages)
; ------------------------------------------------------------------
display_end_screen:
    push af
    push hl

    ; Clear screen first
    call clear_screen_area

    pop hl
    pop af

    ; Dispatch based on screen type
    or a
    jr z, .show_victory           ; 0 = Victory
    dec a
    jr z, .show_defeat            ; 1 = Defeat
    dec a
    jr z, .show_credits           ; 2 = Credits
    jr .show_custom               ; 3+ = Custom message

.show_victory:
    ; Display "VICTORY!" message
    ld hl, str_victory
    ld de, #1800 + (10 * 32) + 12 ; Row 10, col 12
    call print_string_vram
    ret

.show_defeat:
    ; Display "GAME OVER" message
    ld hl, str_game_over
    ld de, #1800 + (10 * 32) + 11 ; Row 10, col 11
    call print_string_vram
    ret

.show_credits:
    ; Display "CREDITS" message
    ld hl, str_credits
    ld de, #1800 + (8 * 32) + 13  ; Row 8, col 13
    call print_string_vram
    ; Add more credits lines here if needed
    ret

.show_custom:
    ; Display custom message from HL
    ld de, #1800 + (10 * 32) + 8  ; Row 10, col 8
    call print_string_vram
    ret

; ------------------------------------------------------------------
; Helper: Print string to VRAM
; Input: HL = string pointer (null-terminated)
;        DE = VRAM destination
; ------------------------------------------------------------------
print_string_vram:
    push bc
    push de
    push hl

.psv_loop:
    ld a, (hl)                    ; Get character
    or a                          ; Check for null terminator
    jr z, .psv_done

    ; Write character to VRAM
    push hl
    push de
    ex de, hl                     ; HL = VRAM address (from DE)
    call FAST_WRTVRM              ; Write A to VRAM at HL (direct port)
    pop de
    pop hl

    inc hl                        ; Next character
    inc de                        ; Next VRAM position
    jr .psv_loop

.psv_done:
    pop hl
    pop de
    pop bc
    ret

; ------------------------------------------------------------------
; End screen message strings
; ------------------------------------------------------------------
str_victory:
    db "VICTORY!", 0

str_game_over:
    db "GAME OVER", 0

str_credits:
    db "CREDITS", 0

`;break;case"Restart":t+=`gameflow_handle_restart:
    ; Restart node - safe runtime reinit entry (no cold page remap).
    jp restart_rom

`;break;case"SubMenu":{const p=Math.max(((_=l.sprites)==null?void 0:_.length)||0,1);let h="",u="",f="";const b=Array.isArray(l.sprites)?l.sprites:[];for(let m=0;m<p;m++){const y=b[m];h+=`    dw SPRITE_${m}_PATTERN
`;const T=y?Ja(y).slice(0,4):[];for(let g=0;g<4;g++){const A=T[g];if(A===void 0){u+=`    dw 0
`,f+=`    db 0
`;continue}const S=Ro(y,m,0,A);u+=`    dw ${S}
`,f+=`    db ((${S} - #4000) / #2000)
`}}t+=`gameflow_handle_submenu:
    ; SubMenu node - interactive navigation
    ; DE points to SubMenu data:
    ;   [bg_color][cursor_sprite_idx][cursor_layer_count]
    ;   [cursor_layer_offsets x4][cursor_colors x4]
    ;   [bg_screen_fn DW][bg_screen_bank DB]
    ;   [option_count][initial_selection][title_ptr][option_ptr_0]...
    push bc
    call show_menu_placeholder
    ld a, (gameflow_menu_selection)
    cp 6
    jr c, .submenu_idx_ok
    ld a, 5                       ; Max supported connection option
.submenu_idx_ok:
    add a, CONNECTION_OPTION_0
    pop bc
    call gameflow_get_connection_by_type
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

; ------------------------------------------------------------------
; show_menu_placeholder
; Runtime GameFlow submenu renderer + input
; Input:  DE = menu data pointer
;   Format: DB bg_color, DB cursor_sprite_idx, DB cursor_layer_count,
;           DB cursor_src_off0..cursor_src_off3,
;           DB cursor_color0..cursor_color3,
;           DW bg_screen_fn, DB bg_screen_bank,
;           DB option_count, DB initial_selection,
;           DW title_ptr, DW option_ptr[n]
; Output: gameflow_menu_selection = selected index (0..5)
; ------------------------------------------------------------------
show_menu_placeholder:
    push bc
    push de
    push hl

    ; Cache menu data pointer
    ld h, d
    ld l, e
    ld (gameflow_submenu_data_ptr), hl

    ; Cache option count (clamped to supported range)
    ; option_count is at offset +14 (+11-12 = bg_screen_fn DW, +13 = bg_screen_bank)
    ld bc, 14
    add hl, bc
    ld a, (hl)
    cp 6
    jr c, .smp_count_ok
    ld a, 6
.smp_count_ok:
    ld (gameflow_submenu_option_count), a

    ; Initialize selected option
    or a
    jr nz, .smp_has_options
    xor a
    ld (gameflow_menu_selection), a
    call submenu_prepare_cursor_sprite
    call render_submenu_screen
    jr .smp_exit

.smp_has_options:
    ld b, a
    inc hl
    ld a, (hl)                    ; initial_selection
    cp b
    jr c, .smp_sel_ok
    xor a
.smp_sel_ok:
    ld (gameflow_menu_selection), a

    call submenu_prepare_cursor_sprite
    call render_submenu_screen

.smp_loop:
    halt
${o}
    ; Defensive refresh: some projects keep background/runtime VRAM writers
    ; active while the submenu is idle, which can trample ASCII font chars.
    ; Re-apply the font after each VBlank before polling menu input.
    call init_font_system
    ld a, 0
    call GTSTCK
    cp 1                          ; Up
    jr nz, .smp_check_down

    ld a, (gameflow_menu_selection)
    or a
    jr z, .smp_wait_neutral
    dec a
    ld (gameflow_menu_selection), a
    call render_submenu_screen
    jr .smp_wait_neutral

.smp_check_down:
    cp 5                          ; Down
    jr nz, .smp_check_fire

    ld a, (gameflow_submenu_option_count)
    dec a                         ; max index
    ld b, a
    ld a, (gameflow_menu_selection)
    cp b
    jr nc, .smp_wait_neutral
    inc a
    ld (gameflow_menu_selection), a
    call render_submenu_screen
    jr .smp_wait_neutral

.smp_check_fire:
    ld a, 0
    call GTTRIG
    or a
    jr z, .smp_loop

.smp_wait_fire_release:
    halt
${o}
    call init_font_system
    ld a, 0
    call GTTRIG
    or a
    jr nz, .smp_wait_fire_release
    jr .smp_exit

.smp_wait_neutral:
.smp_wait_neutral_loop:
    halt
${o}
    call init_font_system
    ld a, 0
    call GTSTCK
    or a
    jr nz, .smp_wait_neutral_loop
    jr .smp_loop

.smp_exit:
    call submenu_hide_cursor_sprite
    ; Ensure no gameplay/menu sprite remains resident after leaving submenu.
    call clear_all_sprites
    call update_sprites_to_vram
    pop hl
    pop de
    pop bc
    ret

; ------------------------------------------------------------------
; render_submenu_screen
; Draw title, options, and selection marker ('>').
; Uses cached pointer/count variables set by show_menu_placeholder.
; ------------------------------------------------------------------
render_submenu_screen:
    push bc
    push de
    push hl

    ; Apply submenu background/border colors from node config.
    ld hl, (gameflow_submenu_data_ptr)
    ld a, (hl)                    ; bg_color
    ld b, a                       ; border = bg
    push af
    call set_screen_colors
    pop af
    call init_char0_color

    ; Load background screen (if configured) or clear solid background.
    ; bg_screen_fn DW is at +11, bg_screen_bank is +13, option_count is +14.
    ld hl, (gameflow_submenu_data_ptr)
    ld bc, 11
    add hl, bc
    ld e, (hl)                    ; E = bg_screen_fn low
    inc hl
    ld d, (hl)                    ; D = bg_screen_fn high
    inc hl
    ld a, (hl)                    ; A = bg_screen_bank
    ld c, a
    ex de, hl                     ; HL = bg_screen_fn (0 if none)
    ld d, c                       ; D = bg_screen_bank
    ld a, h
    or l
    jr z, .rss_clear_screen       ; no bg screen -> solid clear

    ; Mapper-safe call to background screen loader.
    ld a, d
    call mapper_call_hl_auto
    jr .rss_read_count

.rss_clear_screen:
    ; Clear full visible screen (24 rows) with tile 0 (solid background).
    ld a, 0
    ld b, 24
.rss_clear_loop:
    push af
    push bc
    call clear_screen_row
    pop bc
    pop af
    inc a
    djnz .rss_clear_loop

.rss_read_count:
    ; Background loaders may overwrite character patterns/colors used for text.
    ; Restore font before printing title/options in submenu.
    call init_font_system

    ld hl, (gameflow_submenu_data_ptr)
    ld bc, 14                     ; offset to option_count (+11-12 fn, +13 bank)
    add hl, bc
    ld a, (hl)                    ; option_count
    cp 6
    jr c, .rss_count_ok
    ld a, 6
.rss_count_ok:
    ld b, a
    or a
    jr z, .rss_done

    inc hl                        ; skip option_count
    inc hl                        ; skip initial_selection

    ; Print title at row 5, horizontally centered (match PC preview Y=40)
    ld e, (hl)
    inc hl
    ld d, (hl)                    ; DE = title pointer
    inc hl                        ; HL = first option pointer
    push hl
    ex de, hl                     ; HL = title string
    call submenu_compute_center_col
    ld c, a                       ; C = centered col
    ld a, 5                       ; A = row 5 (5*8=40px)
    call submenu_calc_vram_addr   ; DE = VRAM addr
    call print_string_vram
    pop hl

    ; Print options from row 10, spaced 2 rows apart (match PC preview Y=80+idx*12)
    ld c, 0
.rss_option_loop:
    ld a, c
    cp b
    jr nc, .rss_done

    ; Read option string pointer
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    push hl                        ; Save option pointer cursor
    push de                        ; Save option string pointer
    push bc                        ; Save option_count/index
    ex de, hl                      ; HL = option string

    ; Marker at (centered text col - 2)
    ld a, (gameflow_menu_selection)
    cp c
    ld a, ' '
    jr nz, .rss_marker_ready
    ld a, (gameflow_submenu_cursor_enabled)
    or a
    jr nz, .rss_marker_ready      ; sprite cursor active -> keep blank marker
    ld a, '>'
.rss_marker_ready:
    push af
    push bc
    ld a, c
    add a, a                       ; *2 (2 rows per option)
    add a, 10                      ; start at row 10
    ld b, a                        ; B = row for current option
    call submenu_compute_center_col
    sub 2
    jr nc, .rss_marker_col_ok
    xor a
.rss_marker_col_ok:
    ld c, a
    ld a, b
    call submenu_calc_vram_addr
    pop bc
    pop af
    ex de, hl
    call WRTVRM

    pop bc                        ; Restore option_count/index
    pop hl                        ; HL = option string pointer

    ; Option text at centered column
    push bc
    ld a, c
    add a, a                       ; *2 (2 rows per option)
    add a, 10                      ; start at row 10
    ld b, a                        ; B = row for current option
    call submenu_compute_center_col
    ld c, a
    ld a, b
    call submenu_calc_vram_addr
    pop bc
    call print_string_vram

    pop hl                        ; Restore option pointer cursor
    inc c
    jr .rss_option_loop

.rss_done:
    call submenu_update_cursor_sprite
    pop hl
    pop de
    pop bc
    ret

; ------------------------------------------------------------------
; submenu_calc_vram_addr
; Convert row/col to name table VRAM address.
; Input:  A = row (0-23), C = col (0-31)
; Output: DE = VRAM address (#1800 + row*32 + col)
; ------------------------------------------------------------------
submenu_calc_vram_addr:
    push hl
    push bc

    ld l, a
    ld h, 0
    add hl, hl                    ; *2
    add hl, hl                    ; *4
    add hl, hl                    ; *8
    add hl, hl                    ; *16
    add hl, hl                    ; *32
    ld b, 0
    add hl, bc                    ; +col
    ld bc, #1800
    add hl, bc                    ; +name table base
    ex de, hl

    pop bc
    pop hl
    ret

; ------------------------------------------------------------------
; submenu_string_length
; Input: HL = null-terminated string
; Output: A = length in characters (0..255)
; Preserves: HL
; ------------------------------------------------------------------
submenu_string_length:
    push hl
    push bc
    ld c, 0                       ; C = length counter
.ssl_loop:
    ld a, (hl)
    or a                          ; test char for null terminator
    jr z, .ssl_done
    inc c
    inc hl
    jr .ssl_loop
.ssl_done:
    ld a, c                       ; A = string length
    pop bc
    pop hl
    ret

; ------------------------------------------------------------------
; submenu_compute_center_col
; Input: HL = null-terminated string
; Output: A = centered start column (0..31)
; Preserves: HL
; ------------------------------------------------------------------
submenu_compute_center_col:
    push bc
    call submenu_string_length
    cp 32
    jr c, .scc_len_ok
    xor a
    jr .scc_done
.scc_len_ok:
    ld b, a
    ld a, 32
    sub b
    srl a
.scc_done:
    pop bc
    ret

; ------------------------------------------------------------------
; submenu_prepare_cursor_sprite
; Load cursor sprite patterns and initialize cursor state.
; Uses sprite slots SUBMENU_CURSOR_BASE_SPRITE..+3.
; ------------------------------------------------------------------
submenu_prepare_cursor_sprite:
    push bc
    push de
    push hl

    ; Default: no sprite cursor
    xor a
    ld (gameflow_submenu_cursor_enabled), a
    ld (gameflow_submenu_cursor_layer_count), a

    ; Clear SAT buffer once to avoid stale sprite garbage in menus
    call clear_all_sprites

    ld hl, (gameflow_submenu_data_ptr)
    inc hl                        ; +1 cursor_sprite_idx
    ld a, (hl)
    cp #FF
    jr z, .sps_done               ; no sprite cursor configured

    ; Resolve pattern pointer from sprite asset index
    push af                       ; save sprite asset index
    call submenu_get_cursor_pattern_ptr
    jr nc, .sps_pattern_ok
    pop af
    jr .sps_done                  ; invalid index -> fallback to char marker
.sps_pattern_ok:
    push hl                       ; save pattern ptr

    ; Read and clamp layer count (+2)
    ld hl, (gameflow_submenu_data_ptr)
    ld bc, 2
    add hl, bc
    ld a, (hl)
    or a
    jr z, .sps_restore_no_cursor
    cp 5
    jr c, .sps_layer_ok
    ld a, 4
.sps_layer_ok:
    ld (gameflow_submenu_cursor_layer_count), a

    ; Copy each declared cursor layer to its reserved submenu sprite slot.
    ; We resolve exact layer source labels from the sprite/layer tables so
    ; submenu cursors do not depend on frame data being laid out contiguously.
    pop hl                        ; discard compatibility base pointer
    pop af                        ; A = sprite asset index
    call mapper_push_p2
    ld b, a                       ; B = sprite asset index
    ld c, 0                       ; C = compact layer slot (0..3)
.sps_copy_loop:
    ld a, b
    call submenu_get_cursor_layer_source
    jr c, .sps_next_layer

    push bc
    push hl
    call mapper_set_bank_p2
    pop hl

    ld a, c
    add a, SUBMENU_CURSOR_BASE_SPRITE
    add a, a                      ; *2
    add a, a                      ; *4
    add a, a                      ; *8
    add a, a                      ; *16
    add a, a                      ; *32
    ld l, a
    ld h, 0
    ld de, SPRPAT
    add hl, de
    ex de, hl
    ld bc, 32
    call FAST_LDIRVM
    pop bc

.sps_next_layer:
    inc c
    ld a, (gameflow_submenu_cursor_layer_count)
    cp c
    jr nz, .sps_copy_loop
    call mapper_pop_p2

.sps_enable_cursor:

    ld a, 1
    ld (gameflow_submenu_cursor_enabled), a
    jr .sps_done

.sps_restore_no_cursor:
    pop hl
    pop af

.sps_done:
    call submenu_update_cursor_sprite
    pop hl
    pop de
    pop bc
    ret

; ------------------------------------------------------------------
; submenu_update_cursor_sprite
; Draw or hide submenu cursor sprite according to current selection.
; ------------------------------------------------------------------
submenu_update_cursor_sprite:
    push bc
    push de
    push hl

    ld a, (gameflow_submenu_cursor_enabled)
    or a
    jr z, .sus_hide

    ; Compute cursor Y from selected option row (row = 10 + selection*2)
    ; Y = (10 + selection*2) * 8 - 4 to match PC preview placement.
    ld a, (gameflow_menu_selection)
    add a, a                      ; selection * 2
    add a, 10                     ; + 10 (start row)
    add a, a                      ; *2
    add a, a                      ; *4
    add a, a                      ; *8
    sub 4
    jr nc, .sus_y_ok
    xor a
.sus_y_ok:
    ld c, a                       ; C = Y (pixels)

    ; Resolve selected option pointer and centered text start column.
    ; Header layout (bg_screen_fn DW at +11-12, bg_screen_bank at +13):
    ; +18 = first option DW pointer
    ld hl, (gameflow_submenu_data_ptr)
    ld de, 18
    add hl, de
    ld a, (gameflow_menu_selection)
    add a, a                      ; *2 (DW stride)
    ld e, a
    ld d, 0
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ex de, hl                     ; HL = selected option string
    call submenu_compute_center_col

    ; X = (start_col * 8) - 16 (sprite width)
    add a, a                      ; *2
    add a, a                      ; *4
    add a, a                      ; *8
    sub 16
    jr nc, .sus_x_ok
    xor a
.sus_x_ok:
    ld b, a                       ; B = X (pixels)

    ; HL -> first cursor color byte (+7)
    ld hl, (gameflow_submenu_data_ptr)
    ld de, 7
    add hl, de

    ld a, (gameflow_submenu_cursor_layer_count)
    or a
    jr z, .sus_hide

    ld d, SUBMENU_CURSOR_BASE_SPRITE
.sus_draw_loop:
    push af                       ; [1] save remaining layer count
    ld e, (hl)                    ; E = color for this layer
    push hl                       ; [2] save color pointer
    push de                       ; [3] save D=sprite index, E=color
    ld a, d                       ; A = sprite index (for show_sprite param)
    push af                       ; [4] save A=sprite index
    add a, a
    add a, a
    ld d, a                       ; D = pattern = sprite_index * 4
    pop af                        ; [4] restore A=sprite index
    call show_sprite              ; A=index, B=X, C=Y, D=pattern, E=color
    pop de                        ; [3] restore D=sprite index (E=old color, ignore)
    inc d                         ; next sprite slot
    pop hl                        ; [2] restore color pointer
    inc hl                        ; advance to next layer color
    pop af                        ; [1] restore remaining layer count
    dec a
    jr nz, .sus_draw_loop

    ; Hide unused reserved cursor sprite slots
    ld a, (gameflow_submenu_cursor_layer_count)
    ld e, a
    ld a, SUBMENU_CURSOR_MAX_LAYERS
    sub e
    ld b, a                       ; B = remaining to hide
    ld a, SUBMENU_CURSOR_BASE_SPRITE
    add a, e
    ld d, a                       ; D = first unused sprite slot
    jr .sus_hide_remaining_check

.sus_hide_remaining:
    ld a, d
    call hide_sprite
    inc d
    djnz .sus_hide_remaining

.sus_hide_remaining_check:
    ld a, b
    or a
    jr nz, .sus_hide_remaining
    jr .sus_flush

.sus_hide:
    call submenu_hide_cursor_sprite
    jr .sus_done

.sus_flush:
    call update_sprites_to_vram

.sus_done:
    pop hl
    pop de
    pop bc
    ret

; ------------------------------------------------------------------
; submenu_hide_cursor_sprite
; Hide reserved cursor sprite slots.
; ------------------------------------------------------------------
submenu_hide_cursor_sprite:
    push bc
    push de

    ld d, SUBMENU_CURSOR_BASE_SPRITE
    ld b, SUBMENU_CURSOR_MAX_LAYERS
.shc_loop:
    ld a, d
    call hide_sprite
    inc d
    djnz .shc_loop
    call update_sprites_to_vram

    pop de
    pop bc
    ret

; ------------------------------------------------------------------
; submenu_get_cursor_pattern_ptr
; Input: A = sprite asset index
; Output: HL = SPRITE_<index>_PATTERN, CF=1 on invalid index
; ------------------------------------------------------------------
submenu_get_cursor_pattern_ptr:
    cp SUBMENU_CURSOR_PATTERN_COUNT
    jr nc, .sgcpp_invalid
    ld l, a
    ld h, 0
    add hl, hl
    ld de, submenu_cursor_sprite_pattern_table
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ex de, hl
    or a                          ; clear carry
    ret
.sgcpp_invalid:
    scf
    ret

; ------------------------------------------------------------------
; submenu_get_cursor_layer_source
; Input: A = sprite asset index, C = compact layer slot (0..3)
; Output: HL = source label, A = source bank, CF=1 on invalid/missing layer
; ------------------------------------------------------------------
submenu_get_cursor_layer_source:
    cp SUBMENU_CURSOR_PATTERN_COUNT
    jr nc, .sgcls_invalid
    ld b, a
    ld a, c
    cp 4
    jr nc, .sgcls_invalid

    ; Pattern pointer table offset = sprite_index * 8 + layer_slot * 2
    ld l, b
    ld h, 0
    add hl, hl                    ; *2
    add hl, hl                    ; *4
    add hl, hl                    ; *8
    ld a, c
    add a, a                      ; layer_slot * 2
    ld e, a
    ld d, 0
    add hl, de
    ld de, submenu_cursor_sprite_layer_pattern_table
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, d
    or e
    jr z, .sgcls_invalid
    ex de, hl

    ; Bank table offset = sprite_index * 4 + layer_slot
    ld l, b
    ld h, 0
    add hl, hl                    ; *2
    add hl, hl                    ; *4
    ld d, 0
    ld e, c
    add hl, de
    ld de, submenu_cursor_sprite_layer_bank_table
    add hl, de
    ld a, (hl)
    or a                          ; clear carry
    ret

.sgcls_invalid:
    scf
    ret

SUBMENU_CURSOR_BASE_SPRITE EQU 28
SUBMENU_CURSOR_MAX_LAYERS  EQU 4
SUBMENU_CURSOR_PATTERN_COUNT EQU ${p}

submenu_cursor_sprite_pattern_table:
${h}

submenu_cursor_sprite_layer_pattern_table:
${u}

submenu_cursor_sprite_layer_bank_table:
${f}

`;break}case"Text":t+=`gameflow_handle_text:
    ; Text node - show text screen and wait for fire
    ; DE = text data pointer (pre-computed lines table)
    ; BC = connection table

    push bc

    ; Show text screen (full screen with title, message, prompt)
    call show_text_screen

    ; Wait for fire button
    call wait_for_fire

    ; Continue to next node
    pop bc
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

; ------------------------------------------------------------------
; show_text_screen
; Display full text screen with optional background screen asset
; Input: DE = text data pointer
;   Format: DB bgColor, DW screen_load_ptr (0=none), DB screen_load_bank, DB numLines
;           Per line: DB row, DB col, DW string_ptr
; If screen_load_ptr != 0: calls that function to load background screen
; (the load_screen function sets VDP colors and name table from screen asset)
; If screen_load_ptr == 0: sets bgColor, clears screen, renders text on solid bg
; ------------------------------------------------------------------
show_text_screen:
    push bc
    push de
    push hl

    ex de, hl                     ; HL = data pointer

    ; Read bgColor, screen load function pointer, and screen load bank
    ld a, (hl)                    ; A = bgColor
    inc hl
    ld c, (hl)                    ; C = screen_load_ptr low
    inc hl
    ld b, (hl)                    ; B = screen_load_ptr high
    inc hl                        ; BC = load function ptr (0 = no bg screen)
    ld e, (hl)                    ; E = screen_load_bank
    inc hl

    push hl                       ; (1) Save pointer to numLines
    push af                       ; (2) Save bgColor
    push bc                       ; (3) Save function pointer
    push de                       ; (4) Save bank byte (E)

    ; Disable screen before any VRAM write
    call DISSCR

    ; Check if we have a background screen to load
    pop de                        ; (4) Restore bank byte (E)
    pop bc                        ; (3) Restore function pointer
    ld a, b
    or c
    jr z, .sts_no_bg_screen

    ; Has background screen: mapper-safe call to load_screen_X
    ; (load_screen sets VDP colors + writes name table)
    ld h, b
    ld l, c                       ; HL = function address
    ld a, e                       ; A = screen_load_bank
    call mapper_call_hl_auto
    pop af                        ; (2) Discard saved bgColor (screen set its own colors)
    jp .sts_render

.sts_no_bg_screen:
    ; No background screen: set solid color and clear
    pop af                        ; (2) Restore bgColor
    ld b, a                       ; B = border color (same as bg)
    push af
    call set_screen_colors
    pop af
    call init_char0_color

    ; Clear entire screen (24 rows)
    ld a, 0
    ld b, 24
.sts_clear_loop:
    push af
    push bc
    call clear_screen_row
    pop bc
    pop af
    inc a
    djnz .sts_clear_loop

.sts_render:
    ; Background loaders may overwrite character patterns/colors used for text.
    ; Restore font before rendering text lines.
    call init_font_system

    ; Now render each text line
    pop hl                        ; (1) HL = pointer to numLines
    ld a, (hl)                    ; A = numLines
    inc hl                        ; HL = first line entry
    or a
    jp z, .sts_enable             ; No lines? just enable screen

    ld b, a                       ; B = line counter

.sts_line_loop:
    push bc

    ; Read row
    ld a, (hl)                    ; A = row
    inc hl
    ; Read col
    ld c, (hl)                    ; C = col
    inc hl
    ; Read string pointer
    ld e, (hl)
    inc hl
    ld d, (hl)                    ; DE = string pointer
    inc hl

    push hl                       ; Save data pointer

    ; Calculate VRAM address: #1800 + row*32 + col
    push de                       ; Save string pointer
    ld l, a
    ld h, 0
    add hl, hl                    ; * 2
    add hl, hl                    ; * 4
    add hl, hl                    ; * 8
    add hl, hl                    ; * 16
    add hl, hl                    ; * 32
    ld e, c
    ld d, 0
    add hl, de                    ; + col
    ld de, #1800
    add hl, de                    ; + name table base
    ex de, hl                     ; DE = VRAM address
    pop hl                        ; HL = string pointer

    call print_string_vram

    pop hl                        ; Restore data pointer
    pop bc
    djnz .sts_line_loop

.sts_enable:
    call ENASCR

    pop hl
    pop de
    pop bc
    ret

; ------------------------------------------------------------------
; wait_for_fire
; Wait for fire button press and release
; ------------------------------------------------------------------
wait_for_fire:
    push bc

    ; Wait for fire button press
.wait_press:
    halt
${o}
    ld a, 0                       ; Trigger 0 = space bar
    call GTTRIG
    or a
    jr z, .wait_press

    ; Wait for fire button release
.wait_release:
    halt
${o}
    ld a, 0
    call GTTRIG
    or a
    jr nz, .wait_release

    ; Small delay after release
    ld b, 5
.delay_loop:
    halt
    push bc
${o}    pop bc
    djnz .delay_loop

    pop bc
    ret

`;break;case"IfThenElse":t+=`gameflow_handle_ifthenelse:
    ; IfThenElse node - conditional branching
    ; DE = condition data pointer
    ;      dw variable address
    ;      db compare value low
    ;      db compare value high
    ;      db operator
    ;      db variable size (0=byte, 1=word)
    ; BC = connection table
    
    push bc         ; Save connection table
    
    ; Read condition data
    ex de, hl
    ld e, (hl)
    inc hl
    ld d, (hl)      ; DE = variable address
    inc hl
    ld c, (hl)      ; C = compare value low byte
    inc hl
    ld b, (hl)      ; B = compare value high byte
    inc hl
    ld a, (hl)      ; A = operator
    push af
    inc hl
    ld a, (hl)      ; A = variable size (0=byte, 1=word)
    push af
    
    ; Load variable value
    ex de, hl
    pop af
    ld e, (hl)      ; E = current value low byte
    or a
    jr z, .byte_value_loaded
    inc hl
    ld d, (hl)      ; D = current value high byte
    jr .value_loaded

.byte_value_loaded:
    ld d, 0

.value_loaded:
    pop af

    ; Compare DE (current value) against BC (compare value), unsigned.
    cp 0
    jr z, .compare_equals
    cp 1
    jr z, .compare_not_equals
    cp 2
    jr z, .compare_greater_than
    cp 3
    jr z, .compare_less_than
    cp 4
    jr z, .compare_greater_or_equal
    cp 5
    jr z, .compare_less_or_equal
    jr .else_branch

.compare_equals:
    ld a, d
    cp b
    jr nz, .else_branch
    ld a, e
    cp c
    jr z, .then_branch
    jr .else_branch

.compare_not_equals:
    ld a, d
    cp b
    jr nz, .then_branch
    ld a, e
    cp c
    jr nz, .then_branch
    jr .else_branch

.compare_greater_than:
    ld a, d
    cp b
    jr c, .else_branch
    jr nz, .then_branch
    ld a, e
    cp c
    jr z, .else_branch
    jr nc, .then_branch
    jr .else_branch

.compare_less_than:
    ld a, d
    cp b
    jr c, .then_branch
    jr nz, .else_branch
    ld a, e
    cp c
    jr c, .then_branch
    jr .else_branch

.compare_greater_or_equal:
    ld a, d
    cp b
    jr c, .else_branch
    jr nz, .then_branch
    ld a, e
    cp c
    jr c, .else_branch
    jr .then_branch

.compare_less_or_equal:
    ld a, d
    cp b
    jr c, .then_branch
    jr nz, .else_branch
    ld a, e
    cp c
    jr c, .then_branch
    jr z, .then_branch
    jr .else_branch
    
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
    jr z, .gfg_done

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

.gfg_done:
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
    ; Transition node - visual screen wipe/fade effect
    ; DE = transition data pointer (db effect_id)
    ; BC = connection table
    push bc
    call execute_transition_effect
    ; Restore VRAM after transition:
    ; 1. Tile colors (chars 128+) — corrupted by color-table effects (#11 = black)
    call load_colors_to_vram
    ; 2. Font patterns + colors (chars 0-127) — also zeroed by color-table effects.
    ;    init_font_system reloads both pattern bytes and color attributes for all
    ;    font characters.  If no font is used in the project this is a no-op (ret).
    call init_font_system
    pop bc                        ; Restore connection table AFTER VRAM restore
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

; ==================================================================
; execute_transition_effect
; Execute visual screen transition by clearing the Name Table
; in different patterns. All effects write tile 0 (blank/black)
; to Name Table (#1800-#1AFF, 768 bytes = 32x24 tiles).
;
; Input:  DE = Transition data pointer
;         (DE) = effect id: 0=cls, 1=dissolve_pixels, 2=dissolve_chars,
;                           3=vertical_lines, 4=horizontal_lines,
;                           5=spiral, 6=fill_white_squares
; Destroys: AF, BC, DE, HL
; ==================================================================
execute_transition_effect:
    ld a, (de)                    ; A = effect id (0-6)
    inc de
    push af                       ; Save effect id
    ld a, (de)                    ; A = frames per step (from node data)
    ld (transition_delay_var), a  ; Store for trans_wait_frames
    pop af                        ; Restore effect id
    or a
    jp z, .trans_cls
    dec a
    jp z, .trans_dissolve_pixels
    dec a
    jp z, .trans_dissolve_chars
    dec a
    jp z, .trans_vertical_lines
    dec a
    jp z, .trans_horizontal_lines
    dec a
    jp z, .trans_spiral
    dec a
    jp z, .trans_fill_white_squares
    ret                           ; Unknown id - do nothing

; ------------------------------------------------------------------
; EFFECT 0: CLS - Instant clear + hold black for configured duration
; ------------------------------------------------------------------
.trans_cls:
    ld hl, #1800
    ld bc, 768
    xor a                         ; Tile 0 = blank
    call trans_fast_filvrm
    call trans_wait_frames        ; Hold black screen for configured time
    ret

; ------------------------------------------------------------------
; EFFECT 1: DISSOLVE_PIXELS - Column-interleaved dissolve (8 passes)
; Each pass clears cols D, D+8, D+16, D+24 with 1 HALT delay
; ------------------------------------------------------------------
.trans_dissolve_pixels:
    ld d, 0                       ; D = pass counter (0-7)
.tdp_loop:
    ld a, d
    call trans_clear_column       ; col D
    ld a, d
    add a, 8
    call trans_clear_column       ; col D+8
    ld a, d
    add a, 16
    call trans_clear_column       ; col D+16
    ld a, d
    add a, 24
    call trans_clear_column       ; col D+24
    call trans_wait_frames        ; timed delay between passes
    inc d
    ld a, d
    cp 8
    jr c, .tdp_loop
    ret

; ------------------------------------------------------------------
; EFFECT 2: DISSOLVE_CHARS - Pixel-row interleaved dissolve (8 passes)
; Pass D clears pixel rows D, D+8, D+16, ..., D+184 (24 rows per pass)
; Uses color table manipulation for 1-pixel-row granularity (8x finer
; than tile-row approach).
; ------------------------------------------------------------------
.trans_dissolve_chars:
    ld d, 0                       ; D = pass counter (0-7)
.tdc_loop:
    ld b, d                       ; B = starting pixel row for this pass
    ld e, 24                      ; E = 24 pixel rows per pass (192/8)
.tdc_inner:
    ld a, b
    call trans_clear_pixel_row_colors   ; clear pixel row B (color table)
    ; trans_clear_pixel_row_colors preserves BC,DE,HL via push/pop
    ld a, b
    add a, 8                      ; next pixel row in this pass (step +8)
    ld b, a
    dec e
    jr nz, .tdc_inner
    call trans_wait_frames
    inc d
    ld a, d
    cp 8
    jr c, .tdc_loop
    ret

; ------------------------------------------------------------------
; EFFECT 3: VERTICAL_LINES - Left-to-right column wipe (2 cols/frame)
; ------------------------------------------------------------------
.trans_vertical_lines:
    ld c, 0                       ; C = current column
.tvl_loop:
    ld a, c
    call trans_clear_column       ; clear col C
    inc c
    ld a, c
    call trans_clear_column       ; clear col C+1
    inc c
    call trans_wait_frames
    ld a, c
    cp 32
    jr c, .tvl_loop
    ret

; ------------------------------------------------------------------
; EFFECT 4: HORIZONTAL_LINES - Top-to-bottom row wipe (1 row/frame)
; ------------------------------------------------------------------
.trans_horizontal_lines:
    ; Pixel-row resolution: 24 tile-rows x 8 sub-rows = 192 pixel rows
    ; Each step: clear all 8 pixel sub-rows of one tile-row, then wait
    ld c, 0                       ; C = tile row (0-23)
.thl_loop:
    ld a, c
    add a, a
    add a, a
    add a, a                      ; A = tile_row * 8 = first pixel row of tile
    ld e, a                       ; E = first pixel row
    ld b, 8                       ; 8 pixel sub-rows per tile row
.thl_inner:
    ld a, e
    call trans_clear_pixel_row_colors
    inc e
    djnz .thl_inner
    call trans_wait_frames
    inc c
    ld a, c
    cp 24
    jp c, .thl_loop
    ret

; ------------------------------------------------------------------
; EFFECT 5: SPIRAL - Pixel-row resolution via color table manipulation
; Clears pixel rows from outside in (top+bottom simultaneously).
; Works by setting color table bytes to 0x11 (black fg + black bg)
; for all 256 tile patterns at the given pixel sub-row in each bank.
; 96 rings: rows (0,191), (1,190), (2,189), ..., (95,96)
; ------------------------------------------------------------------
.trans_spiral:
    ld b, 0                       ; B = top pixel row (0..95)
    ld c, 191                     ; C = bottom pixel row (191..96)
.tsp_loop:
    ld a, b
    call trans_clear_pixel_row_colors   ; blacken pixel row B (top)
    ld a, c
    call trans_clear_pixel_row_colors   ; blacken pixel row C (bottom)
    call trans_wait_frames
    inc b
    dec c
    ld a, b
    cp c
    jr c, .tsp_loop               ; loop while top < bottom
    ret

; ------------------------------------------------------------------
; EFFECT 6: FILL_WHITE_SQUARES - 4-column stripe wipe (8 cols/frame)
; ------------------------------------------------------------------
.trans_fill_white_squares:
    ld c, 0                       ; C = current column (step 8)
.tws_loop:
    ld a, c
    call trans_clear_column
    ld a, c
    inc a
    call trans_clear_column
    ld a, c
    add a, 2
    call trans_clear_column
    ld a, c
    add a, 3
    call trans_clear_column
    ld a, c
    add a, 4
    call trans_clear_column
    ld a, c
    add a, 5
    call trans_clear_column
    ld a, c
    add a, 6
    call trans_clear_column
    ld a, c
    add a, 7
    call trans_clear_column
    ld a, c
    add a, 8
    ld c, a
    call trans_wait_frames
    ld a, c
    cp 32
    jr c, .tws_loop
    ret

; ==================================================================
; trans_clear_pixel_row_colors
; Blackens a single pixel row (1px tall) by setting the color table
; entry for all 256 tile patterns in the appropriate bank to 0x11
; (fg=black, bg=black).  Works at 1-pixel-row granularity unlike
; trans_clear_row_direct which works at 8-pixel (tile-row) granularity.
;
; Screen 2 color table layout:
;   Bank 0 (#2000): tiles used in name-table rows 0-7   (pixel rows 0-63)
;   Bank 1 (#2800): tiles used in name-table rows 8-15  (pixel rows 64-127)
;   Bank 2 (#3000): tiles used in name-table rows 16-23 (pixel rows 128-191)
; Each tile has 8 color bytes; byte J covers pixel sub-row J of that tile.
; Tile T color byte for sub-row J:  bank_base + T*8 + J
;
; Input:  A = pixel row (0-191)
;         bank    = A >> 6   (0-2)
;         sub_row = A & 7    (0-7)
;         color_base = #2000 + bank * #0800
; Preserves: BC, DE, HL
; ==================================================================
trans_clear_pixel_row_colors:
    push bc
    push de
    push hl
    ; --- Compute sub_row = A & 7 ---
    ld l, a                       ; L = pixel row (save)
    and 7
    ld e, a                       ; E = sub_row (0-7)
    ; --- Compute bank = A >> 6 (0-2) ---
    ld a, l
    srl a
    srl a
    srl a
    srl a
    srl a
    srl a                         ; A = bank (0, 1 or 2)
    ; --- Compute H = #20 + bank*8 (color table high byte) ---
    ; bank=0 -> H=#20, bank=1 -> H=#28, bank=2 -> H=#30
    add a, a                      ; bank * 2
    add a, a                      ; bank * 4
    add a, a                      ; bank * 8
    add a, #20
    ld h, a                       ; H = color table high byte for this bank
    ld l, e                       ; L = sub_row  (offset within tile 0 entry)
    ; HL now = address of tile-0 color byte for this pixel sub-row
    ; --- Write 0x11 (black/black) for all 256 tiles ---
    ; Tile addresses: HL, HL+8, HL+16, ... HL+255*8
    ; (consecutive tiles are 8 bytes apart in the color table)
    ld b, 0                       ; B=0 → djnz executes 256 times
.tpcr_loop:
    ; DI only around the 3 critical VDP port writes.
    ; Keeping DI for the whole loop would leave interrupts disabled for ~6ms
    ; and can cause DI+HALT if trans_wait_frames is reached before EI fires.
    di
    ld a, l
    out (#99), a                  ; VRAM address low
    ld a, h
    or #40
    out (#99), a                  ; VRAM address high + write mode
    ld a, #11                     ; fg=1 (black), bg=1 (black)
    out (#98), a                  ; Write to VRAM color table
    ei                            ; Re-enable: interrupt fires after next instr
    ld a, l                       ; (EI delay instruction) Advance HL += 8
    add a, 8
    ld l, a
    jr nc, .tpcr_nc
    inc h
.tpcr_nc:
    djnz .tpcr_loop
    pop hl
    pop de
    pop bc
    ret

; ==================================================================
; trans_wait_frames
; Wait N V-blank frames where N = transition_delay_var
; Provides timed delay between animation steps
; Preserves: BC, DE, HL
; ==================================================================
trans_wait_frames:
    push bc
    ld a, (transition_delay_var)
    or a
    jr z, .twf_done               ; 0 = no wait (safety)
    ld b, a
.twf_loop:
    halt                          ; Wait for V-blank (~20ms at 50Hz)
    push bc
${o}    pop bc
    djnz .twf_loop
.twf_done:
    pop bc
    ret

; ==================================================================
; trans_clear_column
; Write tile 0 to all 24 rows of a single column in the Name Table
; Input:  A = column (0-31)
; Preserves: BC, DE, HL
; ==================================================================
trans_clear_column:
    push bc
    push de
    push hl
    ld l, a
    ld h, #18                     ; HL = #1800 + column (row 0)
    ld b, 24                      ; 24 rows
    di                            ; Protect VDP address setup from ISR corruption
.tcc_row:
    ld a, l
    out (#99), a                  ; VRAM address low byte
    ld a, h
    or #40
    out (#99), a                  ; VRAM address high + write mode
    xor a
    out (#98), a                  ; Write tile 0
    ld a, l                       ; HL += 32 (advance to next row)
    add a, 32
    ld l, a
    jr nc, .tcc_no_carry
    inc h
.tcc_no_carry:
    djnz .tcc_row
    ei
    pop hl
    pop de
    pop bc
    ret

; ==================================================================
; trans_clear_row_direct
; Write tile 0 to all 32 columns of a single row in the Name Table
; Input:  A = row (0-23)
; Preserves: BC, DE, HL
; ==================================================================
trans_clear_row_direct:
    push bc
    push de
    push hl
    ; HL = #1800 + row * 32
    ld l, a
    ld h, 0
    add hl, hl                    ; *2
    add hl, hl                    ; *4
    add hl, hl                    ; *8
    add hl, hl                    ; *16
    add hl, hl                    ; *32
    ld de, #1800
    add hl, de                    ; HL = name table row start
    di                            ; Protect VDP address+data from ISR corruption
    ld a, l
    out (#99), a                  ; VRAM address low
    ld a, h
    or #40
    out (#99), a                  ; VRAM address high + write mode
    ld b, 32
    xor a                         ; Tile 0
.tcrd_loop:
    out (#98), a
    djnz .tcrd_loop
    ei
    pop hl
    pop de
    pop bc
    ret

; ==================================================================
; trans_fast_filvrm
; Fill VRAM with a constant byte using direct port access
; Input:  HL = VRAM destination address
;         BC = byte count
;         A  = fill value
; Destroys: A, BC, E
; ==================================================================
trans_fast_filvrm:
    ld e, a                       ; Save fill byte
    di                            ; Protect VDP address+data from ISR corruption
    ld a, l
    out (#99), a                  ; VRAM address low
    ld a, h
    or #40
    out (#99), a                  ; VRAM address high + write mode
.tff_loop:
    ld a, e
    out (#98), a                  ; Write byte to VRAM
    dec bc
    ld a, b
    or c
    jr nz, .tff_loop
    ei
    ret

`;break;case"Group":t+=`gameflow_handle_group:
    ; Group node - nested GameFlow execution
    ; DE = group data pointer (nested GameFlow entry point)
    ; BC = connection table

    push bc                       ; Save parent connection table

    ; Get nested GameFlow entry point
    ex de, hl
    ld e, (hl)
    inc hl
    ld d, (hl)                    ; DE = nested GameFlow entry node pointer

    ; Save current GameFlow state (stack-based)
    ; In a full implementation, we'd push current node pointer
    ; For now, we'll just execute the nested flow

    ; Execute nested GameFlow
    ex de, hl                     ; HL = nested entry node
    push hl
    call gameflow_execute_node    ; Execute nested flow
    pop hl

    ; Nested flow complete, return to parent
    pop bc                        ; Restore parent connection table

    ; Follow default connection to continue parent flow
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

`;break;case"Music":t+=`gameflow_handle_music:
    ; Music node - play/stop music
    ; DE = music data (command, track index, loop flag)
    ; BC = connection table

    push bc
    call music_execute_command
    pop bc
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node
`;break;case"PresentationScreen":t+=`gameflow_handle_presentationscreen:
    ; PresentationScreen node - show full-screen presentation image
    ; BC = connection table
    push bc
    call show_presentation_screen
    ; show_presentation_screen overwrites ALL of CHRTBL2 (chars 0-255 x 3 banks).
    ; Game tile patterns live at char 128+ and are now corrupted.
    ; Reload game VRAM (patterns + colors) before entering gameplay.
    call init_game_systems
    pop bc
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node
`;break;default:t+=`gameflow_handle_${d.toLowerCase()}:
    ; ${d} node - not yet implemented
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

`;break}});const i=e.includes("Text")||e.includes("SubMenu"),c=e.includes("End");return i&&!c&&(t+=`; ------------------------------------------------------------------
; Shared helper: Print string to VRAM
; Input: HL = string pointer (null-terminated)
;        DE = VRAM destination
; ------------------------------------------------------------------
print_string_vram:
    push bc
    push de
    push hl

.psv_loop:
    ld a, (hl)                    ; Get character
    or a                          ; Check for null terminator
    jr z, .psv_done

    ; Write character to VRAM
    push hl
    push de
    ex de, hl                     ; HL = VRAM address (from DE)
    call FAST_WRTVRM              ; Write A to VRAM at HL (direct port)
    pop de
    pop hl

    inc hl                        ; Next character
    inc de                        ; Next VRAM position
    jr .psv_loop

.psv_done:
    pop hl
    pop de
    pop bc
    ret

`),t}function Mo(e,l,a){var c,d,_,p,h,u,f,b,m,y,T,g;const t=`gameflow_node_${ge(e.id)}`,o=`${t}_conn`,n=["Start","WorldLink","SubMenu","Text","IfThenElse","Globals","Transition","Music"].includes(e.type)||e.type==="Globals"&&e.variables&&e.variables.length>0,s=n?`${t}_data`:"gameflow_no_data";let r=`; Node: ${e.type} - "${e.title||e.name||e.id}"
${t}:
    db ${el(e.type)}
    dw ${s}
    dw ${o}

`;if(n){switch(r+=`${t}_data:
`,e.type){case"Start":r+=`    dw ${t}_init    ; Initialization routine address
`,r+=`    db ((${t}_init - #4000) / #2000)    ; Initialization routine bank
`;break;case"WorldLink":const A=e.worldAssetId||"default";r+=`    dw load_world_${ge(A)}
`,r+=`    db ((load_world_${ge(A)} - #4000) / #2000)
`;break;case"SubMenu":{const O=ge(e.id),z=(Array.isArray(e.options)?e.options:[]).slice(0,6),V=z.length,N=Io(e),M=V>0?Math.min(N,V-1):0,U=Ea(e.title||e.name||"MENU").toUpperCase(),I=((d=(c=e==null?void 0:e.appearance)==null?void 0:c.colors)==null?void 0:d.background)||"#000000",P=Sa(I),$=Co(e),j=(_=e==null?void 0:e.appearance)==null?void 0:_.cursorSpriteAssetId,q=Ao(a,j),H=q>=0?(p=a.sprites)==null?void 0:p[q]:null,le=$==="char"?!1:q>=0,Z=le?q:255,G=le&&H?To(H):{layerOffsets:[],layerColors:[]},W=G.layerOffsets.slice(0,4),ee=G.layerColors.slice(0,4),te=Math.min(ee.length,4);for(;W.length<4;)W.push(0);for(;ee.length<4;)ee.push(0);const we=(h=e==null?void 0:e.appearance)==null?void 0:h.backgroundScreenAssetId;let ye="0";if(we&&a.screenMaps){const re=a.screenMaps.find(_e=>_e.id===we);if(re){const _e=re.name.toUpperCase().replace(/[^A-Z0-9]/g,"_"),fe=re.id?`_${re.id.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";ye=`load_screen_${_e.toLowerCase()}${fe.toLowerCase()}`}}const Ne=ye==="0"?"0":`((${ye} - #4000) / #2000)`;r+=`    db ${P}    ; Background color (MSX index)
`,r+=`    db ${Z}    ; Cursor sprite asset index (#FF = use text marker)
`,r+=`    db ${te}    ; Cursor sprite layer count (max 4)
`,r+=`    db ${W[0]}, ${W[1]}, ${W[2]}, ${W[3]}    ; Cursor source layer offsets
`,r+=`    db ${ee[0]}, ${ee[1]}, ${ee[2]}, ${ee[3]}    ; Cursor layer colors
`,r+=`    dw ${ye}    ; Background screen load function (0=none)
`,r+=`    db ${Ne}    ; Background screen load bank
`,r+=`    db ${V}    ; Number of options (max 6)
`,r+=`    db ${M}    ; Initial selected option
`,r+=`    dw submenu_${O}_title
`,z.forEach((re,_e)=>{r+=`    dw submenu_${O}_opt${_e}
`}),r+=`
submenu_${O}_title:
`,r+=`    db "${U}", 0
`,z.forEach((re,_e)=>{const fe=Ea((re==null?void 0:re.text)||(re==null?void 0:re.label)||(re==null?void 0:re.name)||(re==null?void 0:re.id)||`OPTION ${_e+1}`).toUpperCase();r+=`submenu_${O}_opt${_e}:
`,r+=`    db "${fe}", 0
`})}break;case"Text":{const O=ge(e.id),z=(e.title||e.name||"").replace(/"/g,"").replace(/\r?\n/g," ").trim().toUpperCase()||"TEXT",V=(e.message||"").replace(/"/g,""),N=((f=(u=e.appearance)==null?void 0:u.colors)==null?void 0:f.background)||"#000000",M=Sa(N),U=28,I=V.split(/\r?\n/),P=[];for(const W of I){const ee=W.split(" ");let te="";for(const we of ee){const ye=we.toUpperCase(),Ne=te?te+" "+ye:ye;Ne.length>U&&te?(P.push(te),te=ye):te=Ne}te.trim()?P.push(te):P.push("")}const $="PRESS FIRE TO CONTINUE",j=[];j.push({row:3,text:z,label:`text_${O}_title`});let q=7,H=0;for(const W of P)W.trim()&&(j.push({row:q,text:W,label:`text_${O}_msg${H}`}),H++),q++;j.push({row:20,text:$,label:`text_${O}_prompt`});const le=(b=e.appearance)==null?void 0:b.backgroundScreenAssetId;let Z="0";if(le&&a.screenMaps){const W=a.screenMaps.find(ee=>ee.id===le);if(W){const ee=W.name.toUpperCase().replace(/[^A-Z0-9]/g,"_"),te=W.id?`_${W.id.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";Z=`load_screen_${ee.toLowerCase()}${te.toLowerCase()}`}}const G=Z==="0"?"0":`((${Z} - #4000) / #2000)`;r+=`    DB ${M}                  ; Background color (MSX index from ${N})
`,r+=`    DW ${Z}            ; Background screen load function (0=none)
`,r+=`    DB ${G}         ; Background screen load bank
`,r+=`    DB ${j.length}                  ; Number of lines
`;for(const W of j){const ee=Math.max(0,Math.floor((32-W.text.length)/2));r+=`    DB ${W.row}, ${ee}              ; Row ${W.row}, Col ${ee}
`,r+=`    DW ${W.label}          ; -> "${W.text}"
`}r+=`
`;for(const W of j)r+=`${W.label}:
`,r+=`    DB "${W.text}", 0
`;break}case"Music":{const O=typeof e.trackAssetId=="string"?e.trackAssetId:"",z=a.trackIndexByAssetId||{},V=a.tracks||[];let N=255,M=255,U=e.loop===!1?0:1,I="";if(e.stop===!0)N=0,U=0;else if(e.autoPlay===!1)I="; WARNING: Music node autoPlay=false -> no-op in ROM";else if(O&&z[O]!==void 0)N=1,M=z[O];else if(O){const P=V.find($=>($==null?void 0:$.id)===O);(P==null?void 0:P.soundChip)==="SCC"?I=`; WARNING: Track "${O}" uses SCC and is ignored in ROM export`:I=`; WARNING: Track "${O}" not found / not exportable as PSG`}else I="; WARNING: Music node has no trackAssetId -> no-op";r+=`    db ${N}, ${M}, ${U}    ; command, track index, loop flag
`,I&&(r+=`    ${I}
`);break}case"IfThenElse":const S=e.variableName||"unknown",E=tl(S,a),C=$t(S,a),v=No(E,e.compareValue),R=wo(e.operator),L=String((E==null?void 0:E.type)||"").toLowerCase(),x=L==="word"||L==="16bit",k=x?Math.max(0,Math.min(65535,v)):Math.max(0,Math.min(255,v));C?r+=`    dw ${C}    ; Variable to check
`:r+=`    dw 0                 ; WARNING: Missing global variable "${S}"
`,r+=`    db ${k&255}   ; Compare value low byte
`,r+=`    db ${k>>8&255}   ; Compare value high byte
`,r+=`    db ${R}   ; Operator (0===, 1=!=, 2=>, 3=<, 4=>=, 5=<=)
`,r+=`    db ${x?1:0}   ; Variable size (0=byte, 1=word)
`;break;case"Globals":if(e.variables&&e.variables.length>0){const O=e.variables.map(V=>{const N=V.variableName||V.name||"unknown",M=$t(N,a),U=V.value||0;return{vName:N,vAsmName:M,vValue:U}}).filter(V=>!!V.vAsmName);r+=`    db ${O.length}    ; Number of assignments
`,O.forEach(V=>{r+=`    dw ${V.vAsmName}
`,r+=`    db ${V.vValue}
`});const z=e.variables.length-O.length;z>0&&(r+=`    ; WARNING: ${z} Globals assignment(s) skipped (undefined global variable)
`),O.length===0&&(r+=`    ; No valid global assignments found
`)}else r+=`    db 0    ; No assignments
`;break;case"Transition":{const O={cls:0,dissolve_pixels:1,dissolve_chars:2,vertical_lines:3,horizontal_lines:4,spiral:5,fill_white_squares:6},z={cls:1,dissolve_pixels:8,dissolve_chars:8,vertical_lines:16,horizontal_lines:24,spiral:96,fill_white_squares:4},V=O[e.effect]??0,N=z[e.effect]??8,M=e.duration??1e3,U=Math.max(1,Math.min(255,Math.round(M/N/20)));r+=`    db ${V}              ; Effect: ${e.effect||"cls"}
`,r+=`    db ${U}              ; Frames per step (duration ${M}ms / ${N} steps / 20ms)
`;break}}r+=`
`}r+=`${o}:
`;const i=((m=l.connections)==null?void 0:m.filter(A=>{var S;return(((S=A.from)==null?void 0:S.nodeId)||A.from)===e.id}))||[];if(e.type==="IfThenElse"){const A=i.find(E=>{var C,v;return((C=E.from)==null?void 0:C.sourceId)==="then"||!((v=E.from)!=null&&v.sourceId)}),S=i.find(E=>{var C;return((C=E.from)==null?void 0:C.sourceId)==="else"});r+=`    db CONNECTION_THEN
`,r+=`    dw ${A?`gameflow_node_${ge(((y=A.to)==null?void 0:y.nodeId)||A.to)}`:"0"}
`,r+=`    db CONNECTION_ELSE
`,r+=`    dw ${S?`gameflow_node_${ge(((T=S.to)==null?void 0:T.nodeId)||S.to)}`:"0"}
`}else if(e.type==="SubMenu")(Array.isArray(e.options)?e.options:[]).slice(0,6).forEach((S,E)=>{var v;const C=i.find(R=>{var L;return((L=R.from)==null?void 0:L.sourceId)===S.id});r+=`    db CONNECTION_OPTION_${E}
`,r+=`    dw ${C?`gameflow_node_${ge(((v=C.to)==null?void 0:v.nodeId)||C.to)}`:"0"}
`});else{const A=i[0];r+=`    db CONNECTION_DEFAULT
`,r+=`    dw ${A?`gameflow_node_${ge(((g=A.to)==null?void 0:g.nodeId)||A.to)}`:"0"}
`}return r+=`    db CONNECTION_END

`,e.type==="Start"&&(r+=Po(e,t,a)),r}function Po(e,l,a){let t=`; ------------------------------------------------------------------
; ${l}_init
; Initialization routine for Start node
; Initializes global variables and MSX systems
; ------------------------------------------------------------------
${l}_init:
`;const o=e.initializeGlobals,n=e.systemConfig;return t+=`    ; === Core Game Systems Initialization (ALWAYS required) ===
`,t+=`    call init_game_systems

`,n&&(t+=`    ; === MSX System Initialization ===
`,n.initPSG&&(t+=`    ; Initialize PSG (silence all channels)
`,t+=`    call init_psg_silence

`),n.clearSprites&&(t+=`    ; Clear sprite attribute table
`,t+=`    call clear_sprite_table

`),n.clearVRAM&&(t+=`    ; Clear VRAM areas
`,t+=`    call clear_vram_areas

`),n.resetVDP&&(t+=`    ; Reset VDP registers to default
`,t+=`    call reset_vdp_registers

`)),o&&o.enabled&&(t+=`    ; === Global Variables Initialization ===
`,o.variables&&o.variables.length>0?o.variables.forEach(s=>{const r=String((s==null?void 0:s.variableName)||"").trim();if(!r)return;const i=Array.isArray(a.globalVariables)?a.globalVariables:[],c=r.toLowerCase(),d=i.find(f=>{const b=String((f==null?void 0:f.name)||"").trim().toLowerCase(),m=String((f==null?void 0:f.asmName)||"").trim().toLowerCase();return b===c||m===c}),_=String((d==null?void 0:d.name)||r),p=String((d==null?void 0:d.asmName)||`global_var_${_.replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`),h=String((d==null?void 0:d.type)||"").toLowerCase();let u=0;if(typeof s.value=="boolean")u=s.value?1:0;else{const f=Number(s.value);u=Number.isFinite(f)?Math.trunc(f):0}if(h==="word"||h==="16bit"){const f=Math.max(0,Math.min(65535,u));t+=`    ld a, ${f&255}
`,t+=`    ld (${p}), a    ; ${_} low byte = ${f}
`,t+=`    ld a, ${f>>8&255}
`,t+=`    ld (${p}+1), a    ; ${_} high byte = ${f}
`}else{const f=Math.max(0,Math.min(255,u));t+=`    ld a, ${f}
`,t+=`    ld (${p}), a    ; ${_} = ${f}
`}}):(t+=`    ; Initialize all global variables to default values
`,t+=`    call init_all_global_variables
`),t+=`
`),n&&n.initialDelayFrames&&n.initialDelayFrames>0&&(t+=`    ; Initial delay
`,t+=`    ld b, ${n.initialDelayFrames}
`,t+=`.delay_loop:
`,t+=`    halt    ; Wait for V-blank
`,t+=`    djnz .delay_loop

`),t+=`    ret

`,t}function ko(e,l){const a=Ht(e),t=a.length>0,o=et(a,"gf_default_start_hud",!0),n=et(a,"gf_default_loop_hud"),s=zt(e,l),r=e.screenMaps&&e.screenMaps.length>0?e.screenMaps[0]:null,i=r?Lo(r):null;return`; ==================================================================
; DEFAULT GAMEFLOW (No GameFlow defined in project)
; ==================================================================

gameflow_init:
    ret

gameflow_start:
    ; Load first available screen/world
${r?`    call ${vo(r)}
`:`    ; No screens available
`}${i?`    ; Draw imported HUD frame once at game start
    call ${i}
`:""}
${t?`    ; Bootstrap HUD only on screens that define HUD elements
${o}`:""}    ret

gameflow_world_game_loop:
    halt                            ; Frame sync at loop start (V-Blank edge)
${s}    ; Poll input immediately after V-Blank so hero movement lands
    ; in the same frame that gets uploaded to SAT.
    call task_update_input
    call update_player_fastpath
    call check_world_screen_transition
    call update_all_entities
    call refresh_player_deadly_fastpath
    call refresh_player_tile_interaction_fastpath
    call refresh_player_state_machine_fastpath
    call execute_all_state_machines
    call refresh_player_animation_fastpath
    call refresh_player_sprite_fastpath
    call update_sprites_to_vram     ; Upload current-frame sprite positions
    call update_animated_tiles      ; Defer tile VRAM work behind hero updates
${t?`    ; Render HUD only on screens that define HUD elements
${n}
`:""}
    jp gameflow_world_game_loop

; gameflow_exit_requested is allocated in variables.asm (RAM EQU)

; ==================================================================
; END OF DEFAULT GAMEFLOW
; ==================================================================
`}const St=16*1024,Oo=32,Uo=24,Aa=16,$o={budgetBytes:St,usedBytes:0,remainingBytes:St,selectedGroups:[],rejectedGroups:[]};function Bo(e){var a;const l=e.presentationScreen;return l!=null&&l.enabled?Array.isArray((a=l.data)==null?void 0:a.nameTable)&&l.data.nameTable.length===Oo*Uo:!1}function Fo(e){const l=e.presentationScreen;return l!=null&&l.data?[l.data.nameTable,l.data.patternBank0,l.data.patternBank1,l.data.patternBank2,l.data.colorBank0,l.data.colorBank1,l.data.colorBank2].reduce((a,t)=>a+(Array.isArray(t)?t.length:0),0):0}function at(e,l="simple32k"){var r;if(l!=="plain48k")return $o;const a={budgetBytes:St,usedBytes:0,remainingBytes:St,selectedGroups:[],rejectedGroups:[]};if(!Bo(e))return a;const o=((r=e.presentationScreen.runtime)==null?void 0:r.romDataGroup)??"auto",n=Fo(e),s={id:"presentationScreen",label:"Presentation Screen",sizeBytes:n,priority:10};return o==="default"?(a.rejectedGroups.push({...s,mode:o,reason:"Asset override keeps this group in the standard ROM area."}),a):(n<=a.remainingBytes?(a.selectedGroups.push({...s,mode:o,reason:o==="page0"?"Forced into page 0 by asset override.":"Auto-packed into page 0 as highest-priority cold data."}),a.usedBytes+=n,a.remainingBytes-=n):a.rejectedGroups.push({...s,mode:o,reason:o==="page0"?`Forced page 0 placement requested, but ${n} bytes exceeds remaining budget.`:`Auto-pack skipped because ${n} bytes exceeds remaining page-0 budget.`}),a)}function Me(e,l,a=[]){let t="";if(a.length>0&&(t+=a.map(o=>`; ${o}`).join(`
`)+`
`),t+=`${e}:
`,!Array.isArray(l)||l.length===0)return t+=`    DB #00
`,t;for(let o=0;o<l.length;o+=Aa){const s=l.slice(o,o+Aa).map(r=>`#${r.toString(16).padStart(2,"0").toUpperCase()}`);t+=`    DB ${s.join(",")}
`}return t}function al(e,l="plain48k"){return at(e,l).selectedGroups.some(a=>a.id==="presentationScreen")}function ll(e,l="simple32k"){return at(e,l).selectedGroups.length>0}function ol(e,l="simple32k"){var t;if(!al(e,l))return!1;const a=(t=e.presentationScreen)==null?void 0:t.compression;return!!(a!=null&&a.compressNameTable||a!=null&&a.compressPatterns||a!=null&&a.compressColors)}function Ta(e){const l=["; Page 0 Budget Planner",`; Budget: ${e.budgetBytes} bytes`,`; Used: ${e.usedBytes} bytes`,`; Remaining: ${e.remainingBytes} bytes`];return e.selectedGroups.length>0?(l.push("; Selected groups:"),l.push(...e.selectedGroups.map(a=>`; - ${a.label}: ${a.sizeBytes} bytes [${a.mode}] ${a.reason}`))):l.push("; Selected groups: none"),e.rejectedGroups.length>0&&(l.push("; Skipped groups:"),l.push(...e.rejectedGroups.map(a=>`; - ${a.label}: ${a.sizeBytes} bytes [${a.mode}] ${a.reason}`))),l.join(`
`)}function jo(e,l="simple32k"){const a=at(e,l);if(a.selectedGroups.length===0)return`; ==================================================================
; PAGE 0 DATA GROUPS
; File: page0.asm
; Description: No cold data groups selected for page 0
; ==================================================================
${Ta(a)}
`;const o=e.presentationScreen;let n=`; ==================================================================
; PAGE 0 DATA GROUPS
; File: page0.asm
; Description: Cold data packed in the 0000h-3FFFh window for linear 48K ROMs
; ==================================================================

${Ta(a)}

; ------------------------------------------------------------------
; Group: Presentation Screen
; Intended use:
; - Copy cold data from page 0 to RAM/VRAM from page 1 helpers
; - Keep BIOS visible during normal execution
; ------------------------------------------------------------------

`;return n+=Me("PRESENTATION_SCREEN_NAMETBL",o.data.nameTable,[`${o.name} - Name table (32x24)`,"Packed into page 0 group for plain48k layout."]),n+=`
`,n+=Me("PRESENTATION_SCREEN_PATTERNS_B0",o.data.patternBank0,[`${o.name} - Pattern bank 0`]),n+=`
`,n+=Me("PRESENTATION_SCREEN_PATTERNS_B1",o.data.patternBank1,[`${o.name} - Pattern bank 1`]),n+=`
`,n+=Me("PRESENTATION_SCREEN_PATTERNS_B2",o.data.patternBank2,[`${o.name} - Pattern bank 2`]),n+=`
`,n+=Me("PRESENTATION_SCREEN_COLORS_B0",o.data.colorBank0,[`${o.name} - Color bank 0`]),n+=`
`,n+=Me("PRESENTATION_SCREEN_COLORS_B1",o.data.colorBank1,[`${o.name} - Color bank 1`]),n+=`
`,n+=Me("PRESENTATION_SCREEN_COLORS_B2",o.data.colorBank2,[`${o.name} - Color bank 2`]),n+=`
`,n}const zo=`; -----------------------------------------------------------------------------
; ZX0 decoder by Einar Saukas & Urusergi
; "Standard" version (68 bytes only)
; -----------------------------------------------------------------------------
; Parameters:
;   HL: source address (compressed data)
;   DE: destination address (decompressing)
; -----------------------------------------------------------------------------

dzx0_standard:
        ld      bc, $ffff               ; preserve default offset 1
        push    bc
        inc     bc
        ld      a, $80
dzx0s_literals:
        call    dzx0s_elias             ; obtain length
        ldir                            ; copy literals
        add     a, a                    ; copy from last offset or new offset?
        jr      c, dzx0s_new_offset
        call    dzx0s_elias             ; obtain length
dzx0s_copy:
        ex      (sp), hl                ; preserve source, restore offset
        push    hl                      ; preserve offset
        add     hl, de                  ; calculate destination - offset
        ldir                            ; copy from offset
        pop     hl                      ; restore offset
        ex      (sp), hl                ; preserve offset, restore source
        add     a, a                    ; copy from literals or new offset?
        jr      nc, dzx0s_literals
dzx0s_new_offset:
        pop     bc                      ; discard last offset
        ld      c, $fe                  ; prepare negative offset
        call    dzx0s_elias_loop        ; obtain offset MSB
        inc     c
        ret     z                       ; check end marker
        ld      b, c
        ld      c, (hl)                 ; obtain offset LSB
        inc     hl
        rr      b                       ; last offset bit becomes first length bit
        rr      c
        push    bc                      ; preserve new offset
        ld      bc, 1                   ; obtain length
        call    nc, dzx0s_elias_backtrack
        inc     bc
        jr      dzx0s_copy
dzx0s_elias:
        inc     c                       ; interlaced Elias gamma coding
dzx0s_elias_loop:
        add     a, a
        jr      nz, dzx0s_elias_skip
        ld      a, (hl)                 ; load another group of 8 bits
        inc     hl
        rla
dzx0s_elias_skip:
        ret     c
dzx0s_elias_backtrack:
        add     a, a
        rl      c
        rl      b
        jr      dzx0s_elias_loop
; -----------------------------------------------------------------------------`;function nl(){return zo}function Ho(e,l,a="simple32k"){var r,i;const t=at(l,a),o=ll(l,a),n=ol(l,a),s=!!(l.screenMaps&&l.screenMaps.length>0||l.presentationScreen||(i=(r=l.gameFlow)==null?void 0:r.nodes)!=null&&i.some(c=>c.type==="PresentationScreen"));return`; ==================================================================
; ${e.toUpperCase()} - MAIN ASSEMBLY FILE
; File: main.asm
; Description: Main file with ordered imports for MSX cartridge
; Generated by Mideas MSX Generator
; ==================================================================

${a==="plain48k"?`; ==================================================================
; LINEAR 48K PAGE 0 SCAFFOLD
; Linear48K Page0 Data: ${o?"Yes":"No"}
; Page0 Used Bytes: ${t.usedBytes}
; Page0 Remaining Bytes: ${t.remainingBytes}
; NOTE:
; - This reserves the 0000h-3FFFh cartridge window in the ROM image.
; - Cold data groups are emitted in page0.asm when enabled.
; ==================================================================

    org #0000
include "page0.asm"
    ds #4000 - $

`:""}
; ==================================================================
; ORDERED INCLUDES - RIGOROUS ORDER MATTERS!
; ==================================================================

; 1. BIOS Functions (must be first)
include "bios.asm"

; 2. Constants (depends on BIOS)
include "constants.asm"

; 3. Variables (depends on constants)
include "variables.asm"

; 3.5. Mapper runtime API
include "mapper.asm"

; 3.6. Interrupt System (Konami-style task system)
include "interrupt.asm"

; 4. ROM Header (depends on variables and interrupt system)
include "header.asm"

${n?`; ZX0 decoder required by page-0 compressed cold data.
${nl()}

`:""}

${l.tiles&&l.tiles.length>0?`; 5. Pattern Data (if tiles exist)
include "patterns.asm"

; 6. Color Data (if tiles exist)
include "colors.asm"
`:""}

${l.sprites&&l.sprites.length>0?`; 7. Sprite Data (if sprites exist)
include "sprites.asm"
`:""}

; 8. Components (game logic)
include "components.asm"

; 9. Entities (game objects)
include "entities.asm"

${l.worldmaps&&l.worldmaps.length>0?`; 10. Worlds (world maps)
include "worlds.asm"
`:""}

${s?`; 11. Screen Maps / Presentation Screen data
include "screens.asm"
`:""}

; 12. Font Data (custom font for Screen 2 text)
include "font.asm"

; 13. HUD System (heads-up display)
include "hud.asm"

; 14. Menus (user interface)
include "menus.asm"

; 14.5 Sound system (PSG sound effects)
include "sound.asm"

; 15. Animated tiles (background frame updates)
include "animtiles.asm"

${l.stateMachines&&l.stateMachines.length>0?`; 16. State Machines (entity AI)
include "statemachine.asm"
`:""}

; 17. GameFlow (game flow state machine)
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

;-----------------------------------------------
; Capture the normal expanded slot used by each page.
init_page0_runtime_state:
    in a, (#A8)
    ld (slot_primary_normal), a
    ld e, a
    ld a, e
    and #03
    call GETSLOT
    ld (page0_bios_slot), a
    ld a, e
    rrca
    rrca
    and #03
    call GETSLOT
    ld (ROM_slot), a
    ld a, e
    rrca
    rrca
    rrca
    rrca
    and #03
    call GETSLOT
    ld (page2_normal_slot), a
    ld a, e
    rlca
    rlca
    and #03
    call GETSLOT
    ld (page3_normal_slot), a
    ret

;-----------------------------------------------
; Map page 0 to the expanded slot passed in A while restoring page 3 afterwards.
; input:
;   a: expanded slot for page 0 target
; output:
;   page 0 remapped
;   page 3 restored to its normal RAM slot
;   interrupts remain disabled on return
page0_map_expanded_slot:
    ld c, a
    ld a, (slot_primary_normal)
    ; Keep pages 1-3 exactly as they were; only replace page 0 primary slot bits.
    and #FC
    ld b, a
    ld a, c
    and #03
    or b
    di
    out (#A8), a

    ld a, c
    and #80
    ret z
    ld a, c
    and #0C
    rrca
    rrca
    ld b, a
    ld a, (ROM_slot)
    and #0C
    or b
    ld b, a
    ld a, (page2_normal_slot)
    and #0C
    rlca
    rlca
    or b
    ld b, a
    ld a, (page3_normal_slot)
    and #0C
    rlca
    rlca
    rlca
    rlca
    or b
    ld (#FFFF), a
    ret

;-----------------------------------------------
; Switch page 0 to the cartridge ROM slot while keeping page 3 in RAM.
page0_map_game_rom:
    ; IRQs must stay disabled while BIOS page 0 is hidden, otherwise IM1 jumps to #0038
    ; inside cartridge data/ZX0 blobs and execution derails.
    di
    ld a, (ROM_slot)
    jp page0_map_expanded_slot

;-----------------------------------------------
; Restore the normal BIOS-ROM-ROM-RAM slot layout after a page-0 copy.
page0_restore_bios_rom:
    ld a, (page0_bios_slot)
    call page0_map_expanded_slot
    ei
    ret

;-----------------------------------------------
; Copy one chunk from page 0 ROM into the RAM transfer buffer.
; input:
;   hl: source in page 0
;   bc: chunk size (1..256)
; output:
;   hl: source advanced by chunk size
page0_copy_chunk_to_buffer:
    call page0_map_game_rom
    ld de, page0_transfer_buffer
    ldir
    jp page0_restore_bios_rom

;-----------------------------------------------
; Decompress ZX0 data stored in page 0 into a RAM destination.
; input:
;   hl: compressed source in page 0
;   de: destination in RAM
page0_decompress_to_ram:
    ; page0_map_game_rom uses E/C/B as scratch while rebuilding slot registers.
    ; Preserve DE so dzx0_standard receives the caller's RAM destination intact.
    push de
    call page0_map_game_rom
    pop de
    call dzx0_standard
    jp page0_restore_bios_rom

;-----------------------------------------------
; Copy cold data from page 0 ROM to VRAM using a RAM buffer.
; input:
;   hl: source in page 0
;   de: destination VRAM
;   bc: byte count
page0_copy_to_vram:
    ld a, b
    or c
    ret z
.page0_copy_loop:
    push bc
    ld a, b
    or a
    jr z, .page0_copy_final_chunk
    ld bc, #0100
    jr .page0_copy_chunk_ready
.page0_copy_final_chunk:
    ; Final chunk keeps the original BC (1..255 bytes).
.page0_copy_chunk_ready:
    push bc
    push de
    call page0_copy_chunk_to_buffer
    pop de
    pop bc
    push hl
    push bc
    ld hl, page0_transfer_buffer
    call FAST_LDIRVM
    pop bc
    pop hl
    ex de, hl
    add hl, bc
    ex de, hl
    pop bc
    ld a, b
    or a
    jr z, .page0_copy_done
    dec b
    ld a, b
    or c
    jp nz, .page0_copy_loop
.page0_copy_done:
    ret

;-----------------------------------------------
; Calls a function from page 1
; input:
; ix: function to call from page 1
call_from_page1:
    ld a,(ROM_slot)
    ld iyh,a    ; slot #
    jp CALSLT


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
${a==="plain48k"?`    ds #C000 - $        ; Pad linear 48K ROM to 49152 bytes

`:""}    end                 ; End of assembly
`}function Vo(e){return e==="ascii8"?{regP1:"#6000",regP2:"#6800",regP3:"#7000",regP4:"#7800",notes:["; ASCII8 register mapping (MSX Wiki ROM mappers):",";   4000-5FFF <- 6000h",";   6000-7FFF <- 6800h",";   8000-9FFF <- 7000h",";   A000-BFFF <- 7800h"]}:e==="ascii16"?{regP1:"#6000",regP2:"#6000",regP3:"#7000",regP4:"#7000",notes:["; ASCII16 register mapping (MSX Wiki ROM mappers):",";   4000-7FFF <- 6000h (P1/P2 share one 16KB register)",";   8000-BFFF <- 7000h (P3/P4 share one 16KB register)"]}:{regP1:"#6000",regP2:"#8000",regP3:"#A000",regP4:"#A000",notes:["; Konami (without SCC) write window references:",";   6000h-7FFFh, 8000h-9FFFh, A000h-BFFFh are switch registers.","; Note: in original Konami cartridges 4000h-5FFFh is typically fixed."]}}function Go(e={}){const l=e.targetFormat||"konami",a=e.romMode||"simple32k",t=e.autoMegaROM??!1,o=a==="megarom"||a==="auto"&&t;if(!o)return`; ==================================================================
; MAPPER RUNTIME API
; File: mapper.asm
; Description: Minimal compatibility stubs for simple32k builds
; Target mapper: ${l}
; ROM mode: ${a} (autoMegaROM=${t?"true":"false"})
; ==================================================================
;
; This build runs without active mapper writes, so bank switching is not active.
; Keep mapper API labels as no-op stubs so generated gameplay code can
; call the same routines without conditional assembly branches.
${a==="plain48k"?`;
; plain48k note:
; The current generator only exposes the toolchain mode and runtime metadata.
; Real page-0 packing for linear 48 KB ROMs is still pending.
`:""}

; ------------------------------------------------------------------
; mapper_runtime_init
; Initializes runtime mirrors only (no hardware mapper writes).
; ------------------------------------------------------------------
mapper_runtime_init:
    xor a
    ld (mapper_bank_p1_current), a
    ld a, 1
    ld (mapper_bank_p2_current), a
    ld a, 2
    ld (mapper_bank_p3_current), a
    ld a, 3
    ld (mapper_bank_p4_current), a
    ret

; ------------------------------------------------------------------
; API: mapper_set_bank_pX
; Input: A = bank number (stored only for compatibility)
; ------------------------------------------------------------------
mapper_set_bank_p1:
    ld (mapper_bank_p1_current), a
    ret

mapper_set_bank_p2:
    ld (mapper_bank_p2_current), a
    ret

mapper_set_bank_p3:
    ld (mapper_bank_p3_current), a
    ret

mapper_set_bank_p4:
    ld (mapper_bank_p4_current), a
    ret

; ------------------------------------------------------------------
; Save/restore helpers (compatibility only).
; ------------------------------------------------------------------
mapper_push_p1:
    ld a, (mapper_bank_p1_current)
    ld (mapper_saved_bank_p1), a
    ret

mapper_pop_p1:
    ld a, (mapper_saved_bank_p1)
    jp mapper_set_bank_p1

mapper_push_p2:
    ld a, (mapper_bank_p2_current)
    ld (mapper_saved_bank), a
    ret

mapper_pop_p2:
    ld a, (mapper_saved_bank)
    jp mapper_set_bank_p2

mapper_push_p3:
    ld a, (mapper_bank_p3_current)
    ld (mapper_saved_bank_p3), a
    ret

mapper_pop_p3:
    ld a, (mapper_saved_bank_p3)
    jp mapper_set_bank_p3

mapper_push_p4:
    ld a, (mapper_bank_p4_current)
    ld (mapper_saved_bank_p4), a
    ret

mapper_pop_p4:
    ld a, (mapper_saved_bank_p4)
    jp mapper_set_bank_p4

; ------------------------------------------------------------------
; Far call helpers (simple32k no-op bank switch).
; ------------------------------------------------------------------
mapper_call_hl_p1:
    ld de, .return_p1
    push de
    jp (hl)
.return_p1:
    ret

mapper_call_hl_p2:
    jp mapper_call_hl_p1

mapper_call_hl_p3:
    jp mapper_call_hl_p1

mapper_call_hl_p4:
    jp mapper_call_hl_p1

mapper_call_hl_auto:
    jp mapper_call_hl_p1
`;const n=Vo(l),s=o?"; Mapper register writes are enabled for this build configuration.":"; Mapper register writes are disabled (simple32k mode).";return`; ==================================================================
; MAPPER RUNTIME API
; File: mapper.asm
; Description: Centralized mapper register writes (no scattered inline writes)
; Target mapper: ${l}
; ROM mode: ${a} (autoMegaROM=${t?"true":"false"})
; ==================================================================

${n.notes.join(`
`)}
${s}

; Mapper registers for active target format
MAPPER_REG_P1       EQU ${n.regP1}
MAPPER_REG_P2       EQU ${n.regP2}
MAPPER_REG_P3       EQU ${n.regP3}
MAPPER_REG_P4       EQU ${n.regP4}

; ------------------------------------------------------------------
; mapper_runtime_init
; Initializes mapper state variables with deterministic defaults.
; ------------------------------------------------------------------
mapper_runtime_init:
    xor a
    ld (mapper_bank_p1_current), a
    ld a, 1
    ld (mapper_bank_p2_current), a
    ld a, 2
    ld (mapper_bank_p3_current), a
    ld a, 3
    ld (mapper_bank_p4_current), a
    ret

; ------------------------------------------------------------------
; API: mapper_set_bank_pX
; Input: A = bank number
; ------------------------------------------------------------------
mapper_set_bank_p1:
    ld (mapper_bank_p1_current), a
${o?"    ld (MAPPER_REG_P1), a":"    ; write disabled in current ROM mode"}
    ret

mapper_set_bank_p2:
    ld (mapper_bank_p2_current), a
${o?"    ld (MAPPER_REG_P2), a":"    ; write disabled in current ROM mode"}
    ret

mapper_set_bank_p3:
    ld (mapper_bank_p3_current), a
${o?"    ld (MAPPER_REG_P3), a":"    ; write disabled in current ROM mode"}
    ret

mapper_set_bank_p4:
    ld (mapper_bank_p4_current), a
${o?"    ld (MAPPER_REG_P4), a":"    ; write disabled in current ROM mode"}
    ret

; ------------------------------------------------------------------
; Helpers for deterministic save/restore around far calls.
; ------------------------------------------------------------------
mapper_push_p1:
    ld a, (mapper_bank_p1_current)
    ld (mapper_saved_bank_p1), a
    ret

mapper_pop_p1:
    ld a, (mapper_saved_bank_p1)
    jp mapper_set_bank_p1

mapper_push_p2:
    ld a, (mapper_bank_p2_current)
    ld (mapper_saved_bank), a
    ret

mapper_pop_p2:
    ld a, (mapper_saved_bank)
    jp mapper_set_bank_p2

mapper_push_p3:
    ld a, (mapper_bank_p3_current)
    ld (mapper_saved_bank_p3), a
    ret

mapper_pop_p3:
    ld a, (mapper_saved_bank_p3)
    jp mapper_set_bank_p3

mapper_push_p4:
    ld a, (mapper_bank_p4_current)
    ld (mapper_saved_bank_p4), a
    ret

mapper_pop_p4:
    ld a, (mapper_saved_bank_p4)
    jp mapper_set_bank_p4

; ------------------------------------------------------------------
; Far call helpers (dynamic target address in HL)
; Input:
;   A = target bank number
;   HL = target routine address in selected page window
; Output:
;   Returns after restoring previous bank.
; ------------------------------------------------------------------
mapper_call_hl_p1:
    push hl
    push af
    call mapper_push_p1
    pop af
    call mapper_set_bank_p1
    pop hl
    ld de, .return_p1
    push de
    jp (hl)
.return_p1:
    call mapper_pop_p1
    ret

mapper_call_hl_p2:
    push hl
    push af
    call mapper_push_p2
    pop af
    call mapper_set_bank_p2
    pop hl
    ld de, .return_p2
    push de
    jp (hl)
.return_p2:
    call mapper_pop_p2
    ret

mapper_call_hl_p3:
    push hl
    push af
    call mapper_push_p3
    pop af
    call mapper_set_bank_p3
    pop hl
    ld de, .return_p3
    push de
    jp (hl)
.return_p3:
    call mapper_pop_p3
    ret

mapper_call_hl_p4:
    push hl
    push af
    call mapper_push_p4
    pop af
    call mapper_set_bank_p4
    pop hl
    ld de, .return_p4
    push de
    jp (hl)
.return_p4:
    call mapper_pop_p4
    ret

; ------------------------------------------------------------------
; mapper_call_hl_auto
; Auto-select mapper window from HL target address range:
;   4000-5FFF -> p1
;   6000-7FFF -> p2
;   8000-9FFF -> p3
;   A000-BFFF -> p4
; Input:
;   A = target bank
;   HL = target routine address
; ------------------------------------------------------------------
mapper_call_hl_auto:
    push af
    ld a, h
    cp #60
    jr c, .use_p1
    cp #80
    jr c, .use_p2
    cp #A0
    jr c, .use_p3
    pop af
    jp mapper_call_hl_p4

.use_p1:
    pop af
    jp mapper_call_hl_p1

.use_p2:
    pop af
    jp mapper_call_hl_p2

.use_p3:
    pop af
    jp mapper_call_hl_p3
`}const At=128,$e=255;function Wo(e){return String(e||"").replace(/[^a-zA-Z0-9]/g,"_").replace(/_+/g,"_").replace(/^_+|_+$/g,"").toLowerCase()||"default"}function Yo(){return{startChar:0,byteCount:0,patternBytes:[],colorBytes:[]}}function Qo(e){var o,n,s,r;const l=(n=(o=e.gameFlow)==null?void 0:o.nodes)==null?void 0:n.some(i=>(i==null?void 0:i.type)==="SubMenu"),a=(s=e.screenMaps)==null?void 0:s.some(i=>{var c,d;return((c=i.layers)==null?void 0:c.text)||((d=i.textElements)==null?void 0:d.length)>0}),t=(r=e.screenMaps)==null?void 0:r.some(i=>{var c;return Array.isArray((c=i==null?void 0:i.hudConfiguration)==null?void 0:c.elements)&&i.hudConfiguration.elements.length>0});return!!(l||a||t)}function Xo(e){return new Map((e.tiles||[]).map((l,a)=>[String((l==null?void 0:l.id)||""),a]))}function Ko(e){if(!e.tiles||e.tiles.length===0)return;const l={};let a=At;for(const o of e.tiles){if(!(o!=null&&o.id))continue;const n=Math.ceil(o.width/8),s=Math.ceil(o.height/8),r=n*s;if(a+r-1>$e){console.warn(`Skipping runtime tile mapping for ${o.name||o.id}: exceeds SCREEN 2 range`);continue}l[o.id]={charCode:a,assignedAt:Date.now()},a+=r}const t={assignedTiles:l,charsetRangeStart:At,charsetRangeEnd:$e,enabled:!0};return[t,t,t]}function Zo(e,l){const a=new Map((l.tiles||[]).map(s=>[String((s==null?void 0:s.id)||""),s])),t=Xo(l),o=Qo(l),n=e!=null&&e.length?e:Ko(l);if(n!=null&&n.length)return[0,1,2].map(s=>{const r=n[s]||n[0]||{},i={},c=Object.entries(r.assignedTiles||{}).filter(([p,h])=>a.has(String(p))||Array.isArray(h==null?void 0:h.fontCharacters)).sort(([p,h],[u,f])=>{const b=Array.isArray(h==null?void 0:h.fontCharacters),m=Array.isArray(f==null?void 0:f.fontCharacters);if(b!==m)return b?-1:1;const y=Number(h==null?void 0:h.charCode),T=Number(f==null?void 0:f.charCode);return Number.isFinite(y)&&Number.isFinite(T)&&y!==T?y-T:(t.get(String(p))??Number.MAX_SAFE_INTEGER)-(t.get(String(u))??Number.MAX_SAFE_INTEGER)});let d=o?At:Math.max(0,Math.min($e,Number(r.charsetRangeStart)||0)),_=!1;for(const[p,h]of c){if(Array.isArray(h==null?void 0:h.fontCharacters)){i[String(p)]={...h},_=!0;continue}const u=a.get(String(p));if(!u)continue;const f=Math.ceil(u.width/8),b=Math.ceil(u.height/8),m=f*b;if(d+m-1>$e){console.warn(`Skipping runtime tile bank assignment for ${u.name||u.id}: exceeds SCREEN 2 range`);continue}i[String(p)]={...h,charCode:d},d+=m}return{...r,assignedTiles:i,charsetRangeStart:_?0:o?At:Math.max(0,Math.min($e,Number(r.charsetRangeStart)||0)),charsetRangeEnd:$e,enabled:r.enabled??!0}})}function qo(e,l){const a=[];for(const[i,c]of Object.entries((e==null?void 0:e.assignedTiles)||{})){const d=l.get(i);if(!d)continue;const _=Number(c==null?void 0:c.charCode);if(!Number.isFinite(_))continue;const p=Array.from(yt(d,"SCREEN 2 (Graphics I)"));if(p.length===0)continue;const h=Et(d),u=h?Array.from(h):new Array(p.length).fill(240),f=Math.ceil(d.width/8)*Math.ceil(d.height/8);if(_<0||_+f>256){console.warn(`Skipping out-of-range tile bank assignment for tile ${d.name} at char ${_}`);continue}a.push({tileId:i,startChar:_,totalChars:f,patternBytes:p,colorBytes:u})}if(a.length===0)return Yo();let t=255,o=0;for(const i of a)t=Math.min(t,i.startChar),o=Math.max(o,i.startChar+i.totalChars-1);const n=(o-t+1)*8,s=new Array(n).fill(0),r=new Array(n).fill(240);for(const i of a){const c=(i.startChar-t)*8;for(let d=0;d<i.patternBytes.length;d++)s[c+d]=i.patternBytes[d],r[c+d]=i.colorBytes[d]??240}return{startChar:t,byteCount:n,patternBytes:s,colorBytes:r}}function Vt(e){return`tilebank_${Wo(e)}`}function rl(e){return`load_${Vt(e)}_patterns_to_vram`}function il(e){return`load_${Vt(e)}_colors_to_vram`}function Gt(e,l){var o;const a=String(l||"").trim(),t=a?(o=(e.tileBanks||[]).find(n=>(n==null?void 0:n.id)===a))==null?void 0:o.banks:void 0;return Zo(t,e)}function Jo(e,l,a,t,o=0,n=0){var h;if(!l||!a)return 0;const s=Gt(e,l),r=Math.max(0,Math.min(2,Math.floor((t||0)/8))),i=(s==null?void 0:s[r])||(s==null?void 0:s[0]),c=(h=i==null?void 0:i.assignedTiles)==null?void 0:h[a];if(Array.isArray(c==null?void 0:c.fontCharacters)){const u=c.fontCharacters[Math.max(0,o)],f=Number(u==null?void 0:u.bankCharCode);return Number.isFinite(f)?f&255:0}const d=(e.tiles||[]).find(u=>(u==null?void 0:u.id)===a);if(!d||typeof(c==null?void 0:c.charCode)!="number")return 0;const _=Math.max(1,Math.ceil(d.width/8)),p=c.charCode+Math.max(0,n)*_+Math.max(0,o);return p<(i.charsetRangeStart??0)||p>(i.charsetRangeEnd??$e)?0:p&255}function sl(e){const l=new Map((e.tiles||[]).map(t=>[t.id,t]));return Array.from(new Set((e.screenMaps||[]).map(t=>String((t==null?void 0:t.tileBankAssetId)||"").trim()).filter(Boolean))).map(t=>{const o=Gt(e,t);return o!=null&&o.length?{tileBankId:t,labelBase:Vt(t),banks:[0,1,2].map(n=>qo(o[n],l))}:null}).filter(t=>t!==null)}function Ae(e){return e!=="simple32k"&&e!=="plain48k"}function en(e,l="simple32k"){var p;if(!e.tiles||e.tiles.length===0)return`; ==================================================================
; PATTERN DATA (EMPTY - NO TILES DETECTED)
; File: patterns.asm
; ==================================================================

; No tiles detected in project - file generated as placeholder
`;const a=Ae(l),t=a?`    call mapper_push_p2
    ld a, PATTERN_DATA_BANK
    call mapper_set_bank_p2
`:"",o=a?`    call mapper_pop_p2
`:"",n=sl(e),s=["CHRTBL2","CHRTBL2 + #800","CHRTBL2 + #1000"],r=h=>{if(h.length===0)return`    db #00
`;let u="";for(let f=0;f<h.length;f+=16){const b=h.slice(f,f+16).map(m=>`#${m.toString(16).padStart(2,"0").toUpperCase()}`);u+=`    db ${b.join(", ")}
`}return u},i=new Map,c=[];let d=0;const _=n.map(h=>{let u=`; ==================================================================
; SCREEN 2 TILEBANK PATTERN DATA (${h.tileBankId})
; ==================================================================

`;return h.banks.forEach((f,b)=>{const m=`${f.startChar}|${f.byteCount}|${f.patternBytes.join(",")}`;let y=i.get(m);y||(y=`tilebank_pattern_data_${d++}`,i.set(m,y),c.push(`${y}:
${r(f.patternBytes)}
`)),f.byteCount>0&&(u+=`${h.labelBase}_load_pattern_bank${b}:
${t}    ld hl, ${y}
    ld de, ${s[b]} + (${f.startChar} * 8)
    ld bc, ${f.byteCount}
    call FAST_LDIRVM
${o}    ret

`)}),u+=`${rl(h.tileBankId)}:
`,h.banks.forEach((f,b)=>{f.byteCount>0&&(u+=`    call ${h.labelBase}_load_pattern_bank${b}
`)}),u+=`    ret

`,u}).join("");return`; ==================================================================
; TILE PATTERN DATA
; File: patterns.asm
; Description: Tile pattern definitions for MSX Screen 2
; ${((p=e.tiles)==null?void 0:p.length)||0} tiles detected
; ==================================================================

PATTERN_DATA_BANK EQU ((tile_pattern_bank0 - #4000) / #2000)

; ==================================================================
; TILE PATTERN BANK 0 (Base patterns)
; ==================================================================
tile_pattern_bank0:
${e.tiles.map((h,u)=>{const f=yt(h,"SCREEN 2 (Graphics I)"),b=Math.ceil(h.width/8),m=Math.ceil(h.height/8),y=b*m;(h.width%8!==0||h.height%8!==0)&&console.warn(`⚠️  Tile ${h.name} size ${h.width}x${h.height} is not multiple of 8px - may cause visual artifacts`);const T=Array.from(f).map(A=>`#${A.toString(16).padStart(2,"0").toUpperCase()}`);let g="";if(y>1){g=`
    ; Character layout: ${b}×${m} grid`;for(let A=0;A<m;A++){g+=`
    ; Row ${A}: `;for(let S=0;S<b;S++){const E=A*b+S;g+=`Char${E} `}}}return`    ; Tile ${u}: ${h.name} (${h.width}x${h.height}px = ${b}×${m} chars = ${y} MSX characters)${g}
    db ${T.join(", ")}
`}).join("")}

; ==================================================================
; PATTERN LOADING FUNCTIONS
; ==================================================================
load_pattern_bank0:
    ; Load pattern bank 0 to VRAM (base patterns)
    ; Fast direct port access (no BIOS overhead)
${t}    ld hl, tile_pattern_bank0
    ld de, CHRTBL2 + (128 * 8)    ; VRAM pattern table bank 0 (start at char 128)
    ld bc, ${e.tiles.reduce((h,u)=>{const f=Math.ceil(u.width/8),b=Math.ceil(u.height/8);return h+f*b*8},0)}    ; Total bytes for all tile characters (16x16 tiles = 4 chars each)
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
${o}    ret

load_pattern_bank1:
    ; Load pattern bank 1: same patterns as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
${t}    ld hl, tile_pattern_bank0     ; Same source as Bank 0
    ld de, CHRTBL2 + #800 + (128 * 8) ; VRAM pattern table bank 1 (+#800 offset + char 128)
    ld bc, ${e.tiles.reduce((h,u)=>{const f=Math.ceil(u.width/8),b=Math.ceil(u.height/8);return h+f*b*8},0)}    ; Total bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
${o}    ret

load_pattern_bank2:
    ; Load pattern bank 2: same patterns as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
${t}    ld hl, tile_pattern_bank0     ; Same source as Bank 0
    ld de, CHRTBL2 + #1000 + (128 * 8) ; VRAM pattern table bank 2 (+#1000 offset + char 128)
    ld bc, ${e.tiles.reduce((h,u)=>{const f=Math.ceil(u.width/8),b=Math.ceil(u.height/8);return h+f*b*8},0)}    ; Total bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
${o}    ret

load_patterns_to_vram:
    ; Load all pattern banks to VRAM (required for SCREEN 2)
    ; This loads the same patterns to all 3 banks (standard MSX Screen 2 setup)
    call load_pattern_bank0
    call load_pattern_bank1
    call load_pattern_bank2
    ret

${_}
${c.join("")}

; ==================================================================
; END OF PATTERN DATA
; ==================================================================
`}function tn(e,l="simple32k"){var p;if(!e.tiles||e.tiles.length===0)return`; ==================================================================
; COLOR DATA (EMPTY - NO TILES DETECTED)
; File: colors.asm
; ==================================================================

; No tiles detected in project - file generated as placeholder
`;const a=Ae(l),t=a?`    call mapper_push_p2
    ld a, COLOR_DATA_BANK
    call mapper_set_bank_p2
`:"",o=a?`    call mapper_pop_p2
`:"",n=sl(e),s=["CLRTBL2","CLRTBL2 + #800","CLRTBL2 + #1000"],r=h=>{if(h.length===0)return`    db #00
`;let u="";for(let f=0;f<h.length;f+=16){const b=h.slice(f,f+16).map(m=>`#${m.toString(16).padStart(2,"0").toUpperCase()}`);u+=`    db ${b.join(", ")}
`}return u},i=new Map,c=[];let d=0;const _=n.map(h=>{let u=`; ==================================================================
; SCREEN 2 TILEBANK COLOR DATA (${h.tileBankId})
; ==================================================================

`;return h.banks.forEach((f,b)=>{const m=`${f.startChar}|${f.byteCount}|${f.colorBytes.join(",")}`;let y=i.get(m);y||(y=`tilebank_color_data_${d++}`,i.set(m,y),c.push(`${y}:
${r(f.colorBytes)}
`)),f.byteCount>0&&(u+=`${h.labelBase}_load_color_bank${b}:
${t}    ld hl, ${y}
    ld de, ${s[b]} + (${f.startChar} * 8)
    ld bc, ${f.byteCount}
    call FAST_LDIRVM
${o}    ret

`)}),u+=`${il(h.tileBankId)}:
`,h.banks.forEach((f,b)=>{f.byteCount>0&&(u+=`    call ${h.labelBase}_load_color_bank${b}
`)}),u+=`    ret

`,u}).join("");return`; ==================================================================
; TILE COLOR DATA
; File: colors.asm
; Description: Tile color definitions for MSX Screen 2
; ${((p=e.tiles)==null?void 0:p.length)||0} tiles detected
; ==================================================================

COLOR_DATA_BANK EQU ((tile_color_bank0 - #4000) / #2000)

; ==================================================================
; TILE COLOR BANK 0 (Base colors)
; ==================================================================
tile_color_bank0:
${e.tiles.map((h,u)=>{const f=Et(h),b=f?Array.from(f).map(m=>`#${m.toString(16).padStart(2,"0").toUpperCase()}`):["#F0","#F0","#F0","#F0","#F0","#F0","#F0","#F0"];return`    ; Tile ${u}: ${h.name} colors (fg/bg pairs)
    db ${b.join(", ")}
`}).join("")}

; ==================================================================
; COLOR LOADING FUNCTIONS
; ==================================================================
load_color_bank0:
    ; Load color bank 0 to VRAM (base colors)
    ; Fast direct port access (no BIOS overhead)
${t}    ld hl, tile_color_bank0
    ld de, CLRTBL2 + (128 * 8)    ; VRAM color table bank 0 (start at char 128)
    ld bc, ${e.tiles.reduce((h,u)=>{const f=Math.ceil(u.width/8),b=Math.ceil(u.height/8);return h+f*b*8},0)}     ; Total color bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
${o}    ret

load_color_bank1:
    ; Load color bank 1: same colors as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
${t}    ld hl, tile_color_bank0       ; Same source as Bank 0
    ld de, CLRTBL2 + #800 + (128 * 8) ; VRAM color table bank 1 (+#800 offset + char 128)
    ld bc, ${e.tiles.reduce((h,u)=>{const f=Math.ceil(u.width/8),b=Math.ceil(u.height/8);return h+f*b*8},0)}     ; Total color bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
${o}    ret

load_color_bank2:
    ; Load color bank 2: same colors as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
${t}    ld hl, tile_color_bank0       ; Same source as Bank 0
    ld de, CLRTBL2 + #1000 + (128 * 8) ; VRAM color table bank 2 (+#1000 offset + char 128)
    ld bc, ${e.tiles.reduce((h,u)=>{const f=Math.ceil(u.width/8),b=Math.ceil(u.height/8);return h+f*b*8},0)}     ; Total color bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
${o}    ret

load_colors_to_vram:
    ; Load all color banks to VRAM (required for SCREEN 2)
    ; This loads the same colors to all 3 banks (standard MSX Screen 2 setup)
    call load_color_bank0
    call load_color_bank1
    call load_color_bank2
    ret

${_}
${c.join("")}

; ==================================================================
; END OF COLOR DATA
; ==================================================================
`}const rt=8192,an=new Set(["header.asm","bios.asm","constants.asm","variables.asm","mapper.asm","interrupt.asm","main.asm","unitedFiles.asm"]);function ln(e){const l=e.trim().toLowerCase();return l?/^\d+$/.test(l)?parseInt(l,10):/^#([0-9a-f]+)$/.test(l)?parseInt(l.slice(1),16):/^0x([0-9a-f]+)$/.test(l)?parseInt(l.slice(2),16):/^([0-9a-f]+)h$/.test(l)?parseInt(l.slice(0,-1),16):null:null}function on(e){let l=0;const a=e.split(/\r?\n/);for(const t of a){const o=t.split(";")[0].trim();if(!o)continue;const n=o.match(/^db\s+(.+)$/i);if(n){l+=n[1].split(",").filter(i=>i.trim().length>0).length;continue}const s=o.match(/^dw\s+(.+)$/i);if(s){l+=s[1].split(",").filter(i=>i.trim().length>0).length*2;continue}const r=o.match(/^ds\s+(.+)$/i);if(r){const i=ln(r[1]);i!==null&&i>0&&(l+=i)}}return l}function nn(e){if(!e)return 0;const l=on(e),a=new TextEncoder().encode(e).length,t=Math.floor(a*.28);return Math.max(l,t)}function rn(e){const l=Object.entries(e).filter(([r,i])=>!!i&&!an.has(r)).map(([r,i])=>({moduleName:r,estimatedBytes:nn(i)})).filter(r=>r.estimatedBytes>0),a=[];let t=0,o=0,n=0;for(const r of l){let i=r.estimatedBytes,c=0;const d=Math.max(1,Math.ceil(r.estimatedBytes/rt));for(;i>0;){const _=rt-o,p=Math.min(i,_);a.push({moduleName:r.moduleName,chunkBytes:p,bankIndex:t,bankOffset:o,segmentIndex:c,totalSegments:d}),i-=p,n+=p,o+=p,c++,o>=rt&&(t++,o=0)}}const s=n===0?0:o===0?t:t+1;return{bankSize:rt,totalEstimatedBytes:n,banksUsed:s,entries:a}}function sn(e){const l=[];if(l.push("; ------------------------------------------------------------------"),l.push("; 8KB BANK PACKER ESTIMATE (diagnostic placement view)"),l.push("; Runtime bank constants are derived from label addresses at assemble time."),l.push(`; Estimated payload bytes: ${e.totalEstimatedBytes}`),l.push(`; Estimated banks used: ${e.banksUsed}`),l.push("; ------------------------------------------------------------------"),e.entries.length===0)return l.push("; No banked payload candidates detected."),l.join(`
`);for(const a of e.entries){const t=a.bankOffset.toString(16).toUpperCase().padStart(4,"0"),o=a.totalSegments>1?` part ${a.segmentIndex+1}/${a.totalSegments}`:"";l.push(`; BANK ${a.bankIndex.toString().padStart(2,"0")} @#${t} : ${a.moduleName}${o} (${a.chunkBytes} bytes)`)}return l.join(`
`)}function dn(e){const l=e.tasks.length>0?e.tasks.map(o=>`; IRQ Task: slot ${o.slot} -> ${o.routineLabel} (${o.responsibility}, every ${o.period} frame${o.period===1?"":"s"})`).join(`
`):"; IRQ Task: none",a=e.mainline.length>0?e.mainline.map(o=>`; Mainline: ${o.phase} -> ${o.routineLabel} (${o.responsibility})`).join(`
`):"; Mainline: none",t=e.diagnostics.warnings.length>0?e.diagnostics.warnings.map(o=>`; Warning: ${o}`).join(`
`):"; Warning: none";return`; Engine Execution Mode: ${e.mode}
${l}
${a}
${t}
`}function cn(e,l,a,t,o={romMode:"simple32k",targetFormat:"konami",autoMegaROM:!1}){var b,m,y,T,g,A,S,E,C,v,R;const n=at(a,o.romMode),s=ll(a,o.romMode),r=(m=(b=a.gameFlow)==null?void 0:b.nodes)==null?void 0:m.some(L=>L.type==="PresentationScreen"),i=(T=(y=a.gameFlow)==null?void 0:y.nodes)==null?void 0:T.some(L=>L.type==="SubMenu"),c=(g=a.screenMaps)==null?void 0:g.some(L=>{var x,k;return((x=L.layers)==null?void 0:x.text)||((k=L.textElements)==null?void 0:k.length)>0}),d=(A=a.screenMaps)==null?void 0:A.some(L=>{var x;return((x=L.hudConfiguration)==null?void 0:x.elements)&&L.hudConfiguration.elements.length>0}),_=i||c||d,p=rn(e),h=sn(p),u=dn(t),f=ol(a,o.romMode);return`; ==================================================================
; ${l.toUpperCase()} - UNIFIED FILE
; File: unitedFiles.asm
; Description: All-in-one file combining all modular files
; Generated by Mideas MSX Modular Generator
;
; OPTIMIZED: Only includes necessary code for this project
; Tiles: ${((S=a.tiles)==null?void 0:S.length)||0}
; Sprites: ${((E=a.sprites)==null?void 0:E.length)||0}
; Screens: ${((C=a.screenMaps)==null?void 0:C.length)||0}
; Entities: ${((v=a.entities)==null?void 0:v.length)||0}
; Menus: ${i?"Yes":"No"}
; HUD: ${d?"Yes":"No"}
; State Machines: ${((R=a.stateMachines)==null?void 0:R.length)||0}
; ROM Mode: ${o.romMode}
; Mapper Target: ${o.targetFormat}
; Auto MegaROM: ${o.autoMegaROM?"Yes":"No"}
${u}; ==================================================================
${o.romMode==="plain48k"?`; Linear48K Page0 Data: ${s?"Yes":"No"}
; Page0 Used Bytes: ${n.usedBytes}
; Page0 Remaining Bytes: ${n.remainingBytes}
; EXPERIMENTAL: linear 48K page-0 data groups currently start with Presentation Screen.
`:""}${h}

${o.romMode==="plain48k"?`; ==================================================================
; LINEAR 48K PAGE 0 SCAFFOLD
; ==================================================================
    org #0000
${e["page0.asm"]}
    ds #4000 - $

`:""}
; CRITICAL: header.asm with ORG #4000 and "AB" signature MUST be first
; for the ROM to work correctly after the optional page-0 scaffold.
${e["header.asm"]}

${f?`; ZX0 decoder required by page-0 compressed cold data.
${nl()}

`:""}

${e["bios.asm"]}

${e["constants.asm"]}

${e["variables.asm"]}

${e["mapper.asm"]}

${e["interrupt.asm"]}

${a.tiles&&a.tiles.length>0?e["patterns.asm"]:`; [patterns.asm skipped - no tiles]
`}

${a.tiles&&a.tiles.length>0?e["colors.asm"]:`; [colors.asm skipped - no tiles]
`}

${e["sprites.asm"]}

${a.screenMaps&&a.screenMaps.length>0||r?e["screens.asm"]:`; [screens.asm skipped - no screens]
`}

${e["components.asm"]}

${a.entities&&a.entities.length>0?e["entities.asm"]:`; [entities.asm skipped - no entities]
`}

${i?e["menus.asm"]:`; [menus.asm skipped - no menus]
`}

${_?e["font.asm"]:`; [font.asm skipped - no text/menus]
init_font_system:
    ret

`}

${d?e["hud.asm"]:`; [hud.asm skipped - no HUD elements]
`}

${e["sound.asm"]}

${e["scroll.asm"]}

${e["animtiles.asm"]}

${e["statemachine.asm"]&&e["statemachine.asm"].trim()!=="; No State Machines"?e["statemachine.asm"]:`; [statemachine.asm skipped - no state machines]
`}

${a.gameFlow?e["gameflow.asm"]:`; [gameflow.asm skipped - no GameFlow]
`}

${e["worlds.asm"]}

; ==================================================================
; GAME SYSTEM FUNCTIONS
; ==================================================================
; NOTE: The main game loop and execution flow are handled exclusively
; by GameFlow (see gameflow.asm section above).
; This section only contains shared initialization and utility functions.
; ==================================================================

;-----------------------------------------------
; Capture the normal expanded slot used by each page.
init_page0_runtime_state:
    in a, (#A8)
    ld (slot_primary_normal), a
    ld e, a
    ld a, e
    and #03
    call GETSLOT
    ld (page0_bios_slot), a
    ld a, e
    rrca
    rrca
    and #03
    call GETSLOT
    ld (ROM_slot), a
    ld a, e
    rrca
    rrca
    rrca
    rrca
    and #03
    call GETSLOT
    ld (page2_normal_slot), a
    ld a, e
    rlca
    rlca
    and #03
    call GETSLOT
    ld (page3_normal_slot), a
    ret

;-----------------------------------------------
; Map page 0 to the expanded slot passed in A while restoring page 3 afterwards.
; input:
;   a: expanded slot for page 0 target
; output:
;   page 0 remapped
;   page 3 restored to its normal RAM slot
;   interrupts remain disabled on return
page0_map_expanded_slot:
    ld c, a
    ld a, (slot_primary_normal)
    ; Keep pages 1-3 exactly as they were; only replace page 0 primary slot bits.
    and #FC
    ld b, a
    ld a, c
    and #03
    or b
    di
    out (#A8), a

    ld a, c
    and #80
    ret z
    ld a, c
    and #0C
    rrca
    rrca
    ld b, a
    ld a, (ROM_slot)
    and #0C
    or b
    ld b, a
    ld a, (page2_normal_slot)
    and #0C
    rlca
    rlca
    or b
    ld b, a
    ld a, (page3_normal_slot)
    and #0C
    rlca
    rlca
    rlca
    rlca
    or b
    ld (#FFFF), a
    ret

;-----------------------------------------------
; Switch page 0 to the cartridge ROM slot while keeping page 3 in RAM.
page0_map_game_rom:
    ; IRQs must stay disabled while BIOS page 0 is hidden, otherwise IM1 jumps to #0038
    ; inside cartridge data/ZX0 blobs and execution derails.
    di
    ld a, (ROM_slot)
    jp page0_map_expanded_slot

;-----------------------------------------------
; Restore the normal BIOS-ROM-ROM-RAM slot layout after a page-0 copy.
page0_restore_bios_rom:
    ld a, (page0_bios_slot)
    call page0_map_expanded_slot
    ei
    ret

;-----------------------------------------------
; Copy one chunk from page 0 ROM into the RAM transfer buffer.
; input:
;   hl: source in page 0
;   bc: chunk size (1..256)
; output:
;   hl: source advanced by chunk size
page0_copy_chunk_to_buffer:
    call page0_map_game_rom
    ld de, page0_transfer_buffer
    ldir
    jp page0_restore_bios_rom

;-----------------------------------------------
; Decompress ZX0 data stored in page 0 into a RAM destination.
; input:
;   hl: compressed source in page 0
;   de: destination in RAM
page0_decompress_to_ram:
    ; page0_map_game_rom uses E/C/B as scratch while rebuilding slot registers.
    ; Preserve DE so dzx0_standard receives the caller's RAM destination intact.
    push de
    call page0_map_game_rom
    pop de
    call dzx0_standard
    jp page0_restore_bios_rom

;-----------------------------------------------
; Copy cold data from page 0 ROM to VRAM using a RAM buffer.
; input:
;   hl: source in page 0
;   de: destination VRAM
;   bc: byte count
page0_copy_to_vram:
    ld a, b
    or c
    ret z
.page0_copy_loop:
    push bc
    ld a, b
    or a
    jr z, .page0_copy_final_chunk
    ld bc, #0100
    jr .page0_copy_chunk_ready
.page0_copy_final_chunk:
    ; Final chunk keeps the original BC (1..255 bytes).
.page0_copy_chunk_ready:
    push bc
    push de
    call page0_copy_chunk_to_buffer
    pop de
    pop bc
    push hl
    push bc
    ld hl, page0_transfer_buffer
    call FAST_LDIRVM
    pop bc
    pop hl
    ex de, hl
    add hl, bc
    ex de, hl
    pop bc
    ld a, b
    or a
    jr z, .page0_copy_done
    dec b
    ld a, b
    or c
    jp nz, .page0_copy_loop
.page0_copy_done:
    ret

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
    ; Initialize animated tile runtime (safe no-op if no animated groups)
    call init_animated_tiles

${a.entities&&a.entities.length>0?`    ; Initialize game entities with real positions from JSON
    call init_entities
`:`    ; No entities to initialize
`}
${a.screenMaps&&a.screenMaps.length>0?`    ; Load the first game screen
    call load_game_screen
    call rebuild_used_entity_list
`:`    ; No screens - skip screen loading
`}
${_?`    ; Initialize font system
    call init_font_system
`:`    ; No text/menus - skip font initialization
`}${d?`    ; HUD dirty flag - will be rendered after screen loading (by GameFlow WorldLink)
    ld a, 1
    ld (hud_dirty_flag), a
`:""}    call ENASCR               ; Re-enable screen after VRAM updates
    ret

; ==================================================================
; SCREEN LOADING STUB (for compatibility)
; ==================================================================
; NOTE: With GameFlow system, screen loading is handled by GameFlow nodes
; via load_world_X -> load_screen_X. This stub exists for backward
; compatibility with init_game_systems references.
load_game_screen:
    ret

${o.romMode==="plain48k"?`    ds #C000 - $        ; Pad linear 48K ROM to 49152 bytes

`:""}    end                 ; End of assembly
`}const Tt={comp_pos:"Position",comp_position:"Position",comp_render:"Sprite",comp_sprite:"Sprite",comp_movement:"Movement",comp_velocity:"Movement",comp_collision:"Collision",comp_wall_collision:"WallCollision",comp_player_input:"Input",comp_input:"Input",comp_ai_behavior:"Behavior",comp_behavior:"Behavior",comp_health:"Health",comp_animation:"Animation",comp_gravity:"Gravity",comp_jump:"Jump",comp_damage:"Damage",comp_deadly_tiles:"DeadlyTiles",comp_statemachine:"StateMachine",comp_cursors:"Cursors",comp_carry:"Carry",comp_collectible:"Collectible",comp_patrol:"Patrol"};function _n(e,l){var s,r,i;const a=(s=l==null?void 0:l.components)==null?void 0:s.find(c=>c.definitionId==="comp_sprite"||c.definitionId==="comp_render");if(!a)return;const t=a.defaultValues||{},o=((r=e.componentOverrides)==null?void 0:r.comp_sprite)||((i=e.componentOverrides)==null?void 0:i.comp_render)||{},n={...t,...o};return n.spriteId||n.spriteAssetId||n.sprite||n.spriteName}function lt(e){var n;const l=new Set,a=new Set,t=[],o=new Map;return console.log("🔍 Analyzing component usage..."),console.log(`📊 Total entities in project: ${((n=e.entities)==null?void 0:n.length)||0}`),e.entities&&e.entities.length>0&&e.entities.forEach(s=>{console.log(`  - Entity: ${s.name} (template: ${s.entityTemplateId})`),t.push(s),s.entityTemplateId&&a.add(s.entityTemplateId)}),console.log(`✅ Active entities: ${t.length}`),console.log(`✅ Used templates: ${Array.from(a).join(", ")}`),t.forEach((s,r)=>{var _;const i=s.name||s.id,c=s.id||s.name||`entity_${r}`,d=(_=e.templates)==null?void 0:_.find(p=>p.id===s.entityTemplateId);d?(console.log(`  📦 Analyzing template "${d.name}" for entity "${i}"`),d.components&&Array.isArray(d.components)&&d.components.forEach(p=>{const h=p.definitionId||p.componentDefinitionId;if(h){const u=Tt[h]||h;console.log(`    - Component: ${h} → ${u}`),l.add(u),o.has(u)||o.set(u,new Set),o.get(u).add(c)}}),s.componentOverrides&&Object.keys(s.componentOverrides).forEach(p=>{const h=Tt[p]||p;console.log(`    - Override: ${p} → ${h}`),l.add(h),o.has(h)||o.set(h,new Set),o.get(h).add(c)})):console.warn(`  ⚠️  Template "${s.entityTemplateId}" not found for entity "${i}"`)}),console.log("📊 Component usage summary:"),console.log(`  - Total used components: ${l.size}`),l.forEach(s=>{const r=o.get(s);console.log(`    • ${s}: ${(r==null?void 0:r.size)||0} entities`)}),{usedComponents:l,usedTemplates:a,activeEntities:t,componentToEntitiesMap:o}}function Ca(e,l,a){var s;let t=0;const o={Position:0,Sprite:1,Movement:2,Collision:3,Input:4,Behavior:5,Health:6,Animation:7,Jump:8,Gravity:9,DeadlyTiles:13};let n=!1;if(l&&l.components&&l.components.forEach(r=>{const i=r.definitionId||r.componentDefinitionId,c=Tt[i];c&&o[c]!==void 0&&(t|=1<<o[c],c==="Sprite"&&(n=!0)),c==="Patrol"&&(t|=1<<o.Movement)}),e.componentOverrides&&Object.keys(e.componentOverrides).forEach(r=>{const i=Tt[r];i&&o[i]!==void 0&&(t|=1<<o[i],i==="Sprite"&&(n=!0))}),t|=1<<o.Position,n)t|=1<<o.Sprite;else{const r=_n(e,l);r&&((s=a.sprites)==null?void 0:s.some(c=>c.id===r||c.name===r))&&(t|=1<<o.Sprite)}return t}const pn=224,hn="hex",Wt=64,Yt=e=>{var n;const l=(e==null?void 0:e.spritePalette)||[],a=e==null?void 0:e.backgroundColor,t=(e==null?void 0:e.frames)||[];if(!l.length||!t.length)return[];const o=[];for(let s=0;s<l.length;s++){const r=l[s];if(!r||r===a)continue;let i=!1;for(const c of t)if(c!=null&&c.data){for(let d=0;d<(c.data.length||0)&&!i;d++)for(let _=0;_<(((n=c.data[d])==null?void 0:n.length)||0)&&!i;_++)c.data[d][_]===r&&(i=!0);if(i)break}i&&o.push(s)}return o},xt=e=>{const l=Yt(e);return l.length>0?l[0]:-1},dl=e=>e.map((l,a)=>{var n;const t=Math.max(1,((n=l==null?void 0:l.frames)==null?void 0:n.length)||1),o=Math.max(1,Yt(l).length);return{index:a,name:(l==null?void 0:l.name)||`sprite_${a}`,frameCount:t,layerCount:o,slotCount:t*o}}),un=(e,l,a)=>{const t=e.slice().sort((o,n)=>n.slotCount-o.slotCount||o.index-n.index).slice(0,12).map(o=>`- Sprite ${o.index} "${o.name}": ${o.frameCount} frame(s) x ${o.layerCount} layer(s) = ${o.slotCount} slots`);return["Runtime sprite-pattern uploads are disabled for gameplay exports.",`${a} needs ${l} sprite pattern slots (including 1 placeholder), but MSX1 SPRPAT only fits ${Wt}.`,"Reduce sprite frames/layers or split the runtime sprite set so it fits entirely in VRAM preload mode.",t.length>0?`Largest sprite consumers:
${t.join(`
`)}`:""].filter(Boolean).join(`
`)},mn=e=>e.toLowerCase().replace(/[^a-z0-9]/g,"_"),fn=(e,l,a)=>{if(typeof e=="number"&&Number.isInteger(e)&&e>=0&&e<a)return e;if(typeof e!="string")return null;const t=e.trim();if(!t)return null;const o=l[t];if(o!==void 0)return o;const n=l[t.toLowerCase()];if(n!==void 0)return n;const s=Number.parseInt(t,10);return Number.isInteger(s)&&s>=0&&s<a?s:null},We=(e,l)=>{var t;const a=(t=e==null?void 0:e.properties)==null?void 0:t.find(o=>l(o));return(a==null?void 0:a.name)||null},bn=(e,l)=>{var o,n,s;const a=(o=l.templates)==null?void 0:o.find(r=>r.id===e.entityTemplateId),t=l.components||[];if(e!=null&&e.componentOverrides)for(const r of Object.keys(e.componentOverrides)){const i=t.find(d=>d.id===r),c=We(i,d=>d.type==="sprite_ref");if(c&&((n=e.componentOverrides[r])!=null&&n[c]))return e.componentOverrides[r][c]}for(const r of(a==null?void 0:a.components)||[]){const i=t.find(d=>d.id===r.definitionId),c=We(i,d=>d.type==="sprite_ref");if(c&&((s=r.defaultValues)!=null&&s[c]))return r.defaultValues[c]}},yn=(e,l)=>{var t;const a=l.components||[];for(const o of(e==null?void 0:e.components)||[]){const n=a.find(r=>r.id===o.definitionId),s=We(n,r=>r.type==="sprite_ref");if(s&&((t=o.defaultValues)!=null&&t[s]))return o.defaultValues[s]}},En=(e,l)=>{var o,n,s;const a=(o=l.templates)==null?void 0:o.find(r=>r.id===e.entityTemplateId),t=l.components||[];if(e!=null&&e.componentOverrides)for(const r of Object.keys(e.componentOverrides)){const i=t.find(d=>d.id===r),c=We(i,d=>d.type==="statemachine_ref"||d.name==="stateMachineAssetId"||d.name==="state_machine");if(c&&((n=e.componentOverrides[r])!=null&&n[c]))return e.componentOverrides[r][c]}for(const r of(a==null?void 0:a.components)||[]){const i=t.find(d=>d.id===r.definitionId),c=We(i,d=>d.type==="statemachine_ref"||d.name==="stateMachineAssetId"||d.name==="state_machine");if(c&&((s=r.defaultValues)!=null&&s[c]))return r.defaultValues[c]}},gn=(e,l)=>{var t;const a=l.components||[];for(const o of(e==null?void 0:e.components)||[]){const n=a.find(r=>r.id===o.definitionId),s=We(n,r=>r.type==="statemachine_ref"||r.name==="stateMachineAssetId"||r.name==="state_machine");if(s&&((t=o.defaultValues)!=null&&t[s]))return o.defaultValues[s]}},Sn=e=>{const l=[];for(const a of(e==null?void 0:e.states)||[])Array.isArray(a==null?void 0:a.onEnter)&&l.push(...a.onEnter),Array.isArray(a==null?void 0:a.onExit)&&l.push(...a.onExit);for(const a of(e==null?void 0:e.transitions)||[])Array.isArray(a==null?void 0:a.actions)&&l.push(...a.actions);return l},cl=e=>{const l=tt(e.sprites||[]),a=dl(l.sprites),t=new Map((e.stateMachines||[]).filter(n=>n==null?void 0:n.id).map(n=>[n.id,n])),o=new Map((e.templates||[]).filter(n=>n==null?void 0:n.id).map(n=>[n.id,n]));return(n,s,r)=>{const i=new Set,c=new Set,d=new Set,_=new Set,p=S=>{const E=fn(S,l.nameToIndex,l.sprites.length);E!==null&&i.add(E)},h=S=>{typeof S=="string"&&S&&c.add(S)},u=S=>{var C,v,R,L,x;if(typeof S!="string"||!S||_.has(S))return;_.add(S);const E=t.get(S);if(E)for(const k of Sn(E))!k||typeof k!="object"||(k.type==="CHANGE_SPRITE"?p(((C=k.params)==null?void 0:C.sprite)??((v=k.params)==null?void 0:v.spriteId)):k.type==="SPAWN_ENTITY"&&h(((R=k.params)==null?void 0:R.templateId)??((L=k.params)==null?void 0:L.entityTemplateId)??((x=k.params)==null?void 0:x.entityId)))},f=S=>{if(d.has(S))return;d.add(S);const E=o.get(S);E&&(p(yn(E,e)),u(gn(E,e)))};for(const S of r)p(bn(S,e)),u(En(S,e)),h(S==null?void 0:S.entityTemplateId);for(;c.size>0;){const S=c.values().next().value;c.delete(S),f(S)}const b=Array.from(i);for(;b.length>0;){const S=b.pop(),E=[l.directionalLookupTables.left[S],l.directionalLookupTables.right[S],l.directionalLookupTables.up[S],l.directionalLookupTables.down[S]];for(const C of E)typeof C=="number"&&C>=0&&C<l.sprites.length&&!i.has(C)&&(i.add(C),b.push(C))}const m=Array.from(i).sort((S,E)=>S-E),y=new Array(Math.max(1,l.sprites.length)).fill(0);let T=0;const g=[];for(const S of m){const E=a[S];E&&(y[S]=T,T+=E.slotCount,g.push(E))}const A=T+1;if(A>Wt)throw new Error(un(g,A,s));return{id:n,label:mn(n),displayName:s,spriteIndexes:m,totalSlotsRequired:A,placeholderSlot:T,baseSlotsBySpriteIndex:y}}},_l=e=>{const l=cl(e),a=e.worldmaps||[];return a.length===0?[l("default","Default runtime sprite set",e.entities||[])]:a.map((t,o)=>{const n=(t==null?void 0:t.id)||`world_${o}`,s=new Set(((t==null?void 0:t.nodes)||[]).map(i=>i==null?void 0:i.screenAssetId).filter(Boolean)),r=(e.entities||[]).filter(i=>s.has(i==null?void 0:i.screenAssetId));return l(n,`World "${(t==null?void 0:t.name)||n}"`,r)})},An=e=>{const l=cl(e);return(Array.isArray(e.screenMaps)?e.screenMaps:[]).map((t,o)=>{const n=String((t==null?void 0:t.id)||`screen_${o}`),s=String((t==null?void 0:t.name)||`Screen ${o}`),r=(e.entities||[]).filter(c=>(c==null?void 0:c.screenAssetId)===n),i=l(n,`Screen "${s}"`,r);return{screenId:n,screenName:s,totalSlotsRequired:i.totalSlotsRequired}})};function Tn(e,l="simple32k"){var O,z,V;const a=e.sprites||[],t=Ae(l),o=tt(a),n=o.sprites,s=o.nameToIndex,r=o.directionalLookupTables,i=_l(e),c=i[0];o.warnings.forEach(N=>{console.warn(`[Sprites Generator] ${N}`)}),console.log("🎨 generateSpritesFile() called:"),console.log(`  - analysis.sprites.length: ${a.length}`),console.log(`  - expandedSprites.length: ${n.length}`),console.log(`  - analysis.entities.length: ${((O=e.entities)==null?void 0:O.length)||0}`),console.log(`  - analysis.templates.length: ${((z=e.templates)==null?void 0:z.length)||0}`);const{activeEntities:d}=lt(e);console.log(`  - activeEntities.length: ${d.length}`);const _=N=>{if(!N||N.startsWith("rgba"))return null;const M=N.replace("#","");return M.length!==6?null:{r:parseInt(M.substring(0,2),16),g:parseInt(M.substring(2,4),16),b:parseInt(M.substring(4,6),16)}},p=N=>{if(!N)return 0;const M=ce.find($=>$.hex.toUpperCase()===N.toUpperCase());if(M)return M.index;const U=_(N);if(!U)return 15;let I=15,P=1/0;for(const $ of ce){if($.index===0)continue;const j=_($.hex);if(!j)continue;const q=(U.r-j.r)**2+(U.g-j.g)**2+(U.b-j.b)**2;q<P&&(P=q,I=$.index)}return I},h=N=>{if(!N)return[15];const M=N.spritePalette||[],U=N.backgroundColor,I=Yt(N);if(I.length===0)return[15];const P=I.map($=>{const j=M[$];return!j||U&&j===U?0:p(j)});return P.length>0?P:[15]},u=(N,M)=>{let U=`${N}:
`;if(M.length===0)return U+=`    db 0
`,U;const I=16;for(let P=0;P<M.length;P+=I){const $=M.slice(P,P+I);U+=`    db ${$.join(", ")}
`}return U},f=N=>{var $,j,q,H,le,Z;console.log(`
🔍 getEntitySpriteInfo for entity: "${N.name}" (template: ${N.entityTemplateId})`),console.log(`   Available sprites: ${n.map(G=>`"${G.name}" (${G.id})`).join(", ")||"NONE"}`);const M=($=e.templates)==null?void 0:$.find(G=>G.id===N.entityTemplateId);if(!M)return console.log("   ❌ Template not found!"),null;console.log(`   Template found: "${M.name}"`),console.log(`   Template components: ${((j=M.components)==null?void 0:j.map(G=>G.definitionId).join(", "))||"NONE"}`);const U=e.components||[];let I;if(N.componentOverrides)for(const G in N.componentOverrides){const W=U.find(te=>te.id===G),ee=(q=W==null?void 0:W.properties)==null?void 0:q.find(te=>te.type==="sprite_ref");if(ee&&((H=N.componentOverrides[G])!=null&&H[ee.name])){I=N.componentOverrides[G][ee.name],console.log(`   ✅ Found spriteAssetId in overrides: "${I}"`);break}}if(!I)for(const G of M.components||[]){const W=U.find(te=>te.id===G.definitionId),ee=(le=W==null?void 0:W.properties)==null?void 0:le.find(te=>te.type==="sprite_ref");if(ee&&((Z=G.defaultValues)!=null&&Z[ee.name])){I=G.defaultValues[ee.name],console.log(`   ✅ Found spriteAssetId in template defaults: "${I}"`);break}}if(console.log(`   Resolved spriteAssetId: "${I||"undefined"}"`),!I)return console.log("   ⚠️ No sprite_ref property found in any component"),n.length>0?(console.log(`   ⚠️ Defaulting to first sprite "${n[0].name}"`),{spriteAssetIndex:0,spriteName:n[0].name,colors:h(n[0])}):null;let P=s[I];if(P===void 0&&(P=s[I.toLowerCase()]),P===void 0){const G=I.toLowerCase();P=n.findIndex(W=>{var ee,te;return((ee=W.name)==null?void 0:ee.toLowerCase().includes(G))||G.includes(((te=W.name)==null?void 0:te.toLowerCase())||"")})}return P!==void 0&&P>=0?(console.log(`   ✅ Found sprite "${n[P].name}" at index ${P}`),{spriteAssetIndex:P,spriteName:n[P].name,colors:h(n[P])}):(console.log(`   ❌ Sprite "${I}" not found in project assets`),{spriteAssetIndex:-1,spriteName:`MISSING_${I}`,colors:[15]})},b=[];let m=0;d.forEach((N,M)=>{const U=f(N);if(!U){b.push({entityIndex:M,spriteName:"PLACEHOLDER",spriteAssetIndex:-1,baseHwSpriteIndex:m,layerCount:1,colors:[15]}),m+=1;return}b.push({entityIndex:M,spriteName:U.spriteName,spriteAssetIndex:U.spriteAssetIndex,baseHwSpriteIndex:m,layerCount:U.colors.length,colors:U.colors}),m+=U.colors.length});const y=dl(n),T=32,E=(((V=e.gameFlow)==null?void 0:V.nodes)||[]).some(N=>{var M;return N.type==="SubMenu"&&((M=N.appearance)==null?void 0:M.cursorSpriteAssetId)})?28+4:Math.max(1,Math.min(m,T)),C=Math.min(E<T?E+1:T,T),v=C*4;let R=`; ==================================================================
; SPRITE DATA
; File: sprites.asm
; Description: Sprite pattern and animation data
; Entities: ${d.length}
; Total Hardware Sprites (Layers): ${T}
; SAT Upload Sprites per frame: ${C}
; Sprite Pattern Preload Mode: STATIC_ALL_FRAMES
; Runtime Sprite Pattern Packs: ${i.length}
; ==================================================================

; ==================================================================
; SPRITE PATTERN DATA
; ==================================================================
`;n.forEach((N,M)=>{const U=`_${M}`,P=(N.name+U).replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase(),$=Ol(N,hn,M),j=xt(N);R+=`
; Sprite Asset ${M}: ${N.name}
${$}`,j>=0?R+=`
; Unified pattern label for sprite ${M}
SPRITE_${M}_PATTERN EQU ${P}_F0_LAYER${j}
SPRITE_${M}_PATTERN_BANK EQU ((SPRITE_${M}_PATTERN - #4000) / #2000)
`:R+=`
; WARNING: No valid pattern layers found for sprite ${M}
SPRITE_${M}_PATTERN:
    db 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0
SPRITE_${M}_PATTERN_BANK EQU ((SPRITE_${M}_PATTERN - #4000) / #2000)
`}),R+=`
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
SPRITE_PLACEHOLDER_PATTERN_BANK EQU ((SPRITE_PLACEHOLDER_PATTERN - #4000) / #2000)

`,n.length===0&&(R+=`; No sprite assets found - using placeholder pattern only 
SPRITE_0_PATTERN EQU SPRITE_PLACEHOLDER_PATTERN
SPRITE_0_PATTERN_BANK EQU ((SPRITE_0_PATTERN - #4000) / #2000)
`),R+=`
; ==================================================================
; SPRITE ANIMATION METADATA TABLES
; ==================================================================

; Table: Sprite Asset Frame Counts
; Format: db frame_count
sprite_asset_frame_count:
`,n.forEach((N,M)=>{var I;const U=((I=N.frames)==null?void 0:I.length)||1;R+=`    db ${U} ; Sprite ${M}: ${N.name}
`}),n.length===0&&(R+=`    db 1 ; Placeholder
`),R+=`SPRITE_ASSET_COUNT EQU ${Math.max(1,n.length)}
`,R+=`SPRITE_PATTERN_PRELOAD_MODE EQU 1
`,R+=`
; Table: Sprite Asset Loop Flags
; Format: db flags (bit 1: 1=loop, 0=once)
sprite_loop_flags:
`,n.forEach((N,M)=>{const I=N.loops!==!1?"2":"0";R+=`    db ${I} ; Sprite ${M}: ${N.name}
`}),n.length===0&&(R+=`    db 2 ; Placeholder (loops by default)
`),R+=`
; Table: Sprite Asset Frame Pointer List Table
; Format: dw SPRITE_<id>_FRAME_PTRS
sprite_asset_frame_ptr_table:
`,n.forEach((N,M)=>{R+=`    dw SPRITE_${M}_FRAME_PTRS
`}),n.length===0&&(R+=`    dw SPRITE_0_FRAME_PTRS
`),n.forEach((N,M)=>{var q;const U=`_${M}`,P=(N.name+U).replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase(),$=xt(N),j=((q=N.frames)==null?void 0:q.length)||1;R+=`
; Sprite ${M}: ${N.name} frame pointers
SPRITE_${M}_FRAME_PTRS:
`;for(let H=0;H<j;H++)$>=0?R+=`    dw ${P}_F${H}_LAYER${$}
`:R+=`    dw SPRITE_PLACEHOLDER_PATTERN
`}),n.length===0&&(R+=`
SPRITE_0_FRAME_PTRS:
    dw SPRITE_PLACEHOLDER_PATTERN
`),R+=`
; ==================================================================
; DIRECTIONAL SPRITE LOOKUP TABLES
; Maps any sprite asset index to its directional variant index.
; If no directional variant exists, table points back to same index.
; ==================================================================
`,R+=u("sprite_dir_left_table",r.left),R+=`
`,R+=u("sprite_dir_right_table",r.right),R+=`
`,R+=u("sprite_dir_up_table",r.up),R+=`
`,R+=u("sprite_dir_down_table",r.down),R+=`
`,R+=` 
; ================================================================== 
; SPRITE CONFIGURATION TABLES 
; ================================================================== 

; Table: Entity Sprite Configuration 
; Format: db base_hw_sprite_index, layer_count 
entity_sprite_config: 
`,b.forEach(N=>{const M=N.baseHwSpriteIndex>=0?N.baseHwSpriteIndex:0;R+=`    db ${M}, ${N.layerCount} ; Entity ${N.entityIndex} (${N.spriteName})
`}),b.length<32&&(R+=`    ds ${(32-b.length)*2}, 0 ; Padding
`),R+=`
; Table: Entity -> Sprite Asset Index (ROM initial values)
; Copied to RAM entity_sprite_asset_index at init
; Format: db sprite_asset_index (#FF = none)
entity_sprite_asset_index_init:
`,b.forEach(N=>{const M=N.spriteAssetIndex>=0?N.spriteAssetIndex:255;R+=`    db #${M.toString(16).toUpperCase().padStart(2,"0")} ; Entity ${N.entityIndex} (${N.spriteName})
`}),b.length<32&&(R+=`    ds ${32-b.length}, #FF ; Padding
`);const L=Math.max(1,...b.map(N=>N.layerCount));R+=`SPRITE_MAX_ENTITY_LAYERS EQU ${L}  ; Max HW sprite layers per entity
`,R+=`
; Table: Hardware Sprite Layer Colors (ROM initial values - copied to RAM at init)
; Format: db color_index
sprite_layer_colors_init:
`;let x=0;b.forEach(N=>{N.layerCount>0&&(R+=`    ; Entity ${N.entityIndex} (${N.spriteName}) layers:
`,N.colors.forEach((M,U)=>{R+=`    db ${M} ; Layer ${U}
`,x+=1}))});const k=T-x;if(k>0&&(R+=`    ds ${k}, 0 ; Padding
`),R+=`
; Table: SM Sprite Layer Colors (for Action_ChangeSprite runtime color update)
; Format: SPRITE_MAX_ENTITY_LAYERS bytes per sprite asset
; Entry[i*SPRITE_MAX_ENTITY_LAYERS + j] = color for HW sprite slot j of sprite i
SM_SpriteLayerColorTable:
`,n.forEach((N,M)=>{const I=[...h(N)];for(;I.length<L;)I.push(0);R+=`    db ${I.join(", ")} ; Sprite ${M}: ${N.name}
`}),n.length===0){const N=Array(L).fill(0);R+=`    db ${N.join(", ")} ; Placeholder
`}return R+=`
; ==================================================================
; SPRITE INITIALIZATION FUNCTIONS
; ==================================================================

init_sprites:
    ; Copy sprite_layer_colors_init (ROM) -> sprite_layer_colors (RAM)
    ld hl, sprite_layer_colors_init
    ld de, sprite_layer_colors
    ld bc, 32
    ldir
    call clear_all_sprites
    ld hl, sprite_asset_base_pattern_slot_runtime
    ld (hl), 0
${Math.max(1,n.length)>1?`    ld de, sprite_asset_base_pattern_slot_runtime+1
    ld bc, ${Math.max(1,n.length)-1}
    ldir
`:""}    xor a
    ld (sprite_placeholder_base_pattern_num), a
${(e.worldmaps||[]).length===0?`    call load_sprite_patterns
`:""}    xor a
    ld (active_sprite_count), a
    ret

load_sprite_patterns:
${c?`    call load_sprite_patterns_${c.label}
    ret
`:`    ret
`}
`,i.forEach(N=>{var U;R+=`
; ------------------------------------------------------------------
; Runtime Sprite Pattern Pack: ${N.displayName}
; Slots required: ${N.totalSlotsRequired}/${Wt}
; ------------------------------------------------------------------
sprite_asset_base_pattern_slot_${N.label}:
`;const M=Math.max(1,n.length);for(let I=0;I<M;I++){const P=((U=n[I])==null?void 0:U.name)||"Placeholder";R+=`    db ${N.baseSlotsBySpriteIndex[I]||0} ; Sprite ${I}: ${P}
`}R+=`
load_sprite_patterns_${N.label}:
    ld hl, sprite_asset_base_pattern_slot_${N.label}
    ld de, sprite_asset_base_pattern_slot_runtime
    ld bc, SPRITE_ASSET_COUNT
    ldir
    ld a, ${N.placeholderSlot*4}
    ld (sprite_placeholder_base_pattern_num), a
${t?`    call mapper_push_p2
`:""}`,N.spriteIndexes.length===0?R+=`    ; No runtime sprites in this pack - placeholder only
`:N.spriteIndexes.forEach(I=>{const P=n[I],$=y[I],j=N.baseSlotsBySpriteIndex[I]||0,H=`${P.name}_${I}`.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase(),le=xt(P);for(let Z=0;Z<$.frameCount;Z++){const G=j+Z*$.layerCount;R+=`    ; Sprite Asset ${I}: ${P.name} frame ${Z} (${$.layerCount} layers)
${t?`    ld a, SPRITE_${I}_PATTERN_BANK
    call mapper_set_bank_p2
`:""}    ld hl, ${H}_F${Z}_LAYER${le}
    ld de, SPRPAT + (${G} * 32)
    ld bc, ${$.layerCount*32}
    call FAST_LDIRVM
`}}),R+=`    ; Placeholder sprite used by missing sprite refs
${t?`    ld a, SPRITE_PLACEHOLDER_PATTERN_BANK
    call mapper_set_bank_p2
`:""}    ld hl, SPRITE_PLACEHOLDER_PATTERN
    ld de, SPRPAT + (${N.placeholderSlot} * 32)
    ld bc, 32
    call FAST_LDIRVM
${t?`    call mapper_pop_p2
`:""}    ret
`}),R+=`
; ==================================================================
; SPRITE MANAGEMENT FUNCTIONS
; ==================================================================

; A = hardware sprite index, B = X, C = Y, D = pattern, E = color
show_sprite:
    ; Safety check: Ensure sprite index < 32
    cp 32
    ret nc

    ; Safety check: Never write Y >= 208 (208 is SAT end marker on MSX)
    push af
    ld a, c
    cp 208
    jr c, .y_ok
    ld c, SPRITE_INVISIBLE
.y_ok:
    pop af

    ; Save pattern (D) and color (E) before calculating address
    push de

    ; Calculate base address for sprite: index * 4
    ld l, a
    ld h, 0
    add hl, hl      ; index * 2
    add hl, hl      ; index * 4
    ; Add base of the attribute table
    ld de, sprite_attributes
    add hl, de      ; HL = &sprite_attributes[index * 4]

    ; Restore pattern and color
    pop de

    ; Write attributes
    ld (hl), c      ; Y
    inc hl
    ld (hl), b      ; X
    inc hl
    ld (hl), d      ; Pattern
    inc hl
    ld (hl), e      ; Color

    ld a, 1
    ld (sprites_dirty), a
    ret

; Clear all sprites (set Y = SPRITE_INVISIBLE)
; OPTIMIZED: Uses faster increment method instead of ADD HL,DE
clear_all_sprites:
    ld hl, sprite_attributes
    ld b, ${T}
    ld a, SPRITE_INVISIBLE
.sprite_clear_loop:
    ld (hl), a      ; Set Y = SPRITE_INVISIBLE
    inc hl          ; Skip to X
    inc hl          ; Skip to Pattern
    inc hl          ; Skip to Color
    inc hl          ; Next sprite (4× INC HL = 24 cycles vs ADD HL,DE = 35 cycles)
    djnz .sprite_clear_loop
    ld a, 1
    ld (sprites_dirty), a
    ret

; Hide specific sprite (A = hardware sprite index)
hide_sprite:
    cp 32
    ret nc
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    ld de, sprite_attributes
    add hl, de
    ld (hl), SPRITE_INVISIBLE
    ld a, 1
    ld (sprites_dirty), a
    ret

; Copy sprite attributes from RAM to VRAM
update_sprites_to_vram:
    ld a, (sprites_dirty)
    or a
    ret z
    xor a
    ld (sprites_dirty), a
    ld hl, sprite_attributes
    ld de, SPRATR
    ld bc, ${v}  ; Upload active sprite range + SAT end marker
    call FAST_LDIRVM
    ret

; ==================================================================
; SPRITE CONSTANTS
; ==================================================================
SPRITE_INVISIBLE    EQU ${pn}

; ==================================================================
; RAM REQUIREMENTS
; ==================================================================
; sprite_attributes: ds ${T*4}
; active_sprite_count: db 0
; sprites_dirty: db 0
`,R}function Cn(e,l,a){const t=i=>`    ld hl, ${i}
    inc (hl)
    jr nz, $+4
    inc hl
    inc (hl)
`;let o=`
; ==================================================================
; UPDATE ALL ENTITIES - Called by GameFlow (OPTIMIZED)
; ==================================================================
; Only calls component systems that are actually used in this project
; Unused systems are NOT called (saves Z80 cycles)
${X({purpose:"Main ECS tick entrypoint for one frame.",inputs:["Entity/component tables in RAM"],outputs:["Components updated in fixed order"],clobbers:["AF","BC","DE","HL"],preserved:["None (callers should save what they need)"],usage:["Registers are scratch across component CALL chain","Contract intentionally conservative to prevent hidden coupling"],notes:["Do not assume any register survives this routine."]})}
update_all_entities:
    ld hl, prof_update_all_entities_calls
    inc (hl)
    jr nz, .prof_update_all_entities_counted
    inc hl
    inc (hl)
.prof_update_all_entities_counted:
    ; Fast path: when all entities use default job cadence (period=1, entry=0),
    ; rebuild the compact list only when entity/screen membership changes.
    ld a, (entity_job_scheduler_active)
    or a
    jp nz, .update_all_entities_rebuild_list
    call ensure_used_entity_list_current
    jp .update_all_entities_list_ready
.update_all_entities_rebuild_list:
    ; Scheduler active: cadence depends on interrupt_counter, so rebuild every frame.
    call rebuild_used_entity_list
.update_all_entities_list_ready:
`;const n=[["Input","update_input_component","1. Input (player control)"],["Shoot","update_shoot_component","2. Shooting"],["Behavior","update_behavior_component","3. Behavior/AI"],["Patrol","update_entities","3b. Patrol/per-entity update"],["StateMachine","update_statemachine_component","3c. State machine logic"],["Jump","update_jump_component","4. Jump impulse"],["Movement","update_movement_component","5. Movement"],["Cursors","update_cursors_component","5b. Cursors movement"],["Gravity","update_gravity_component","6. Gravity"],["TileInteraction","update_slash_component","6b. Additive slash velocity"],["Position","update_position_component","7. Apply velocity"],["Collision","prepare_platform_detection","8a. Clear platform refs"],["Collision","update_collision_component","8b. Collision detection"],["Collision","update_platform_riding","8c. Platform riding"],["WallCollision","update_wallcollision_component","8d. Wall collision"],["SecretZones","update_secret_zone_component","8e. Secret zone runtime"],["DeadlyTiles","update_deadly_tiles_component","8e. Deadly tiles"],["TileInteraction","check_tile_interaction","8f. Tile interaction (gems/collectibles)"],["Health","update_health_component","9. Health/Death"],["Damage","update_damage_component","10. Damage"],["Animation","update_animation_component","11. Animation"],["AutoDestroy","update_auto_destroy_component","12. Auto-destroy"],["Sprite","update_sprite_component","13. Sprite rendering"]];let s=0;const r=new Set;for(const[i,c,d]of n)if(i==="Position"||i==="Sprite"||(i==="SecretZones"?a:e.has(i))){if(l&&c==="update_statemachine_component")continue;if(!r.has(c)){r.add(c);const u={update_collision_component:"prof_collision_calls",update_wallcollision_component:"prof_wall_calls",update_deadly_tiles_component:"prof_deadly_calls",check_tile_interaction:"prof_tile_interaction_calls",update_animation_component:"prof_animation_calls",update_sprite_component:"prof_sprite_calls"}[c];u&&(o+=t(u)),o+=`    call ${c.padEnd(30)} ; ${d}
`,c==="update_shoot_component"&&(o+=`    ; Shooting may spawn entities, rebuild only if marked dirty
`,o+=`    call ensure_used_entity_list_current
`),s++}}return o+=`    call sync_player_runtime_from_entity
`,o+=`    ret
`,o+=`; Total systems called: ${s} (optimized from 16)

`,o+=`
; ------------------------------------------------------------------
; mark_used_entity_list_dirty
; Invalidate compact entity list cache.
; Call this after spawn/despawn or screen-id changes.
; ------------------------------------------------------------------
${X({purpose:"Mark compact active-entity cache as stale.",inputs:["None"],outputs:["active_entity_list_dirty = 1"],clobbers:["HL"],preserved:["AF","BC","DE"],usage:["HL = points to dirty flag byte"]})}
mark_used_entity_list_dirty:
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ret

; ------------------------------------------------------------------
; ensure_used_entity_list_current
; Rebuild compact list only when marked dirty.
; ------------------------------------------------------------------
${X({purpose:"Conditionally rebuild compact active list only when dirty.",inputs:["active_entity_list_dirty flag"],outputs:["active_entity_list rebuilt if needed"],clobbers:["AF"],preserved:["BC","DE","HL (except nested call clobbers when rebuild happens)"],usage:["A = dirty flag test and branch"],notes:["If dirty, downstream rebuild_used_entity_list can clobber many registers."]})}
ensure_used_entity_list_current:
    ld a, (active_entity_list_dirty)
    or a
    ret z
    call rebuild_used_entity_list
    ret

; ------------------------------------------------------------------
; rebuild_used_entity_list
; Build compact list of ACTIVE entity slots that are in use
; for the CURRENT SCREEN only:
; (entity_active != 0 and mask_l|mask_h != 0 and entity_screen_id == current_screen_id)
; Output:
;   active_entity_list[]   = entity indices with components
;   active_entity_count    = number of entries
; ------------------------------------------------------------------
${X({purpose:"Recompute compact list of entities active on current screen.",inputs:["entity_active, entity_comp_masks(_hi), entity_screen_id, current_screen_id"],outputs:["active_entity_list[]","active_entity_count","hero_entity_id updated from first current-screen entity flagged as player","input/render/collision/ground/anim buckets refreshed","active_entity_list_dirty=0"],clobbers:["AF","BC","DE","HL"],preserved:["None"],usage:["B = slots remaining (MAX_ENTITIES..1)","C = entity slot iterator (0..MAX_ENTITIES-1)","DE = index offset (entity id / active list position)","HL = pointer math over component and state arrays","A = predicate checks and counters"]})}
rebuild_used_entity_list:
    xor a
    ld (active_entity_count), a
    ld (input_entity_count), a
    ld (render_entity_count), a
    ld (collision_entity_count), a
    ld (ground_entity_count), a
    ld (anim_entity_count), a
    ld a, #FF
    ld (hero_entity_id), a
    ld b, MAX_ENTITIES
    ld c, 0

.rebuild_loop:
    ld e, c
    ld d, 0
    ld hl, entity_active
    add hl, de
    ld a, (hl)
    or a
    jp z, .next_entity

    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    ld hl, entity_comp_masks_hi
    add hl, de
    or (hl)
    jp z, .next_entity

    ; Keep only entities from currently visible screen
    ld hl, entity_screen_id
    add hl, de
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jp nz, .next_entity

    ; Keep only entities scheduled to run on this frame.
    ; entity_job_should_run_c expects C=entity index.
    push bc
    call entity_job_should_run_c
    pop bc
    or a
    jp z, .next_entity

    ld hl, active_entity_count
    ld a, (hl)
    cp MAX_ENTITIES
    jp nc, .next_entity

    ld e, a
    ld d, 0
    ld hl, active_entity_list
    add hl, de
    ld (hl), c
    ld hl, active_entity_count
    inc (hl)

    ld e, c
    ld d, 0
    ld a, (hero_entity_id)
    cp #FF
    jr nz, .skip_hero_candidate
    ld hl, entity_is_player
    add hl, de
    ld a, (hl)
    or a
    jr z, .skip_hero_candidate
    ld a, c
    ld (hero_entity_id), a
.skip_hero_candidate:

    ; Build hot-path buckets once so gameplay systems avoid repeating
    ; the same component-mask filtering every frame.
    ld e, c
    ld d, 0

    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    jr z, .skip_input_bucket
    ld a, (input_entity_count)
    ld l, a
    ld h, 0
    ld de, input_entity_list
    add hl, de
    ld (hl), c
    ld hl, input_entity_count
    inc (hl)
.skip_input_bucket:

    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_SPRITE
    jr z, .skip_render_bucket
    ld a, (render_entity_count)
    ld l, a
    ld h, 0
    ld de, render_entity_list
    add hl, de
    ld (hl), c
    ld hl, render_entity_count
    inc (hl)
.skip_render_bucket:

    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_COLLISION
    jr z, .skip_collision_bucket
    ld a, (collision_entity_count)
    ld l, a
    ld h, 0
    ld de, collision_entity_list
    add hl, de
    ld (hl), c
    ld hl, collision_entity_count
    inc (hl)
.skip_collision_bucket:

    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_COLLISION
    jr nz, .store_ground_bucket
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #02                       ; COMP_MASK_GRAVITY
    jr z, .skip_ground_bucket
.store_ground_bucket:
    ld a, (ground_entity_count)
    ld l, a
    ld h, 0
    ld de, ground_entity_list
    add hl, de
    ld (hl), c
    ld hl, ground_entity_count
    inc (hl)
.skip_ground_bucket:

    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_ANIMATION | COMP_MASK_SPRITE
    cp COMP_MASK_ANIMATION | COMP_MASK_SPRITE
    jp nz, .next_entity
    ld a, (anim_entity_count)
    ld l, a
    ld h, 0
    ld de, anim_entity_list
    add hl, de
    ld (hl), c
    ld hl, anim_entity_count
    inc (hl)

.next_entity:
    inc c
    dec b
    jp nz, .rebuild_loop

.rebuild_done:
    ld a, (hero_entity_id)
    cp #FF
    jr nz, .rebuild_store_clean
    ld a, (input_entity_count)
    or a
    jr z, .rebuild_store_clean
    ld hl, input_entity_list
    ld a, (hl)
    ld (hero_entity_id), a
.rebuild_store_clean:
    xor a
    ld (active_entity_list_dirty), a
    ret

; ------------------------------------------------------------------
; ensure_player_fast_runtime_bound
; Keep the dedicated player runtime attached to the current hero entity.
; ------------------------------------------------------------------
${X({purpose:"Bind the player fast-path runtime to the current hero entity.",inputs:["active_entity_list_dirty, hero_entity_id, current-screen filtered entity lists"],outputs:["player_runtime_enabled, player_entity_index, player_x/player_y, player_vx_runtime/player_vy_runtime"],clobbers:["AF","BC","DE","HL"],preserved:["None"],notes:["Calls ensure_used_entity_list_current and resolve_runtime_hero_entity."]})}
ensure_player_fast_runtime_bound:
    call ensure_used_entity_list_current
    call resolve_runtime_hero_entity
    cp #FF
    jp nz, .bind_runtime

    xor a
    ld (player_runtime_enabled), a
    ld (player_vx_runtime), a
    ld (player_vy_runtime), a
    ld (player_x), a
    ld (player_x+1), a
    ld (player_y), a
    ld (player_y+1), a
    ld a, #FF
    ld (player_entity_index), a
    ret

.bind_runtime:
    ld (player_entity_index), a
    ld a, 1
    ld (player_runtime_enabled), a
    call sync_player_runtime_from_entity
    ret

; ------------------------------------------------------------------
; sync_player_runtime_from_entity
; Mirror hero ECS coordinates/velocity into player_* runtime vars.
; ------------------------------------------------------------------
${X({purpose:"Copy the current bound hero entity state into player_* runtime variables.",inputs:["player_runtime_enabled, player_entity_index, entity_x_pos/y_pos, entity_vel_x/y"],outputs:["player_x, player_y, player_vx_runtime, player_vy_runtime updated"],clobbers:["AF","BC","DE","HL"],preserved:["None"]})}
sync_player_runtime_from_entity:
    ld a, (player_runtime_enabled)
    or a
    ret z
    ld a, (player_entity_index)
    cp #FF
    ret z
    ld c, a
    ld e, c
    ld d, 0

    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld (player_x), a
    xor a
    ld (player_x+1), a

    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld (player_y), a
    xor a
    ld (player_y+1), a

    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    ld (player_vx_runtime), a

    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)
    ld (player_vy_runtime), a
    ret

; ------------------------------------------------------------------
; update_player_fastpath
; Dedicated hero update path executed before the generic ECS sweeps.
; Mirrors the critical input->jump->gravity->position chain for the
; current player entity without iterating over every active entity.
; ------------------------------------------------------------------
${X({purpose:"Run the critical per-frame player update without ECS list iteration.",inputs:["task_update_input already refreshed input_state/input_btn_*"],outputs:["Hero input/jump/gravity/position resolved into entity tables and player_* mirror"],clobbers:["AF","BC","DE","HL"],preserved:["None"],notes:["Global collision/wall/sprite systems still run later in the frame and may refine the final result."]})}
update_player_fastpath:
    call ensure_player_fast_runtime_bound
    ld a, (player_runtime_enabled)
    or a
    ret z
    ld a, (player_entity_index)
    cp #FF
    ret z
    ld c, a

    ; Require Input component to treat this entity as the player fast-path target.
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    jp z, .player_fast_sync

    ; --------------------------------------------------------------
    ; INPUT
    ; --------------------------------------------------------------
    ld e, c
    ld d, 0
    ld hl, entity_input_disabled
    add hl, de
    ld a, (hl)
    or a
    jp z, .player_fast_input_enabled

    ld hl, entity_vel_x
    add hl, de
    ld (hl), 0
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0
    jp .player_fast_after_input

.player_fast_input_enabled:
    ld hl, entity_dir_mask
    add hl, de
    ld b, (hl)                    ; B = direction mask

    ld hl, entity_input_speed
    add hl, de
    ld a, (hl)
    or a
    jr nz, .player_fast_speed_ok
    ld a, 1
.player_fast_speed_ok:
    ld h, a                       ; H = cardinal speed
    srl a
    jr nz, .player_fast_diag_speed_ok
    ld a, 1
.player_fast_diag_speed_ok:
    ld l, a                       ; L = diagonal speed

    ld a, (input_state)
    ld d, 0                       ; D = vel_x
    ld e, 0                       ; E = vel_y
    cp STICK_UP
    jp z, .player_fast_input_up
    cp STICK_DOWN
    jp z, .player_fast_input_down
    cp STICK_LEFT
    jp z, .player_fast_input_left
    cp STICK_RIGHT
    jp z, .player_fast_input_right
    cp STICK_UPRIGHT
    jp z, .player_fast_input_upright
    cp STICK_UPLEFT
    jp z, .player_fast_input_upleft
    cp STICK_DOWNRIGHT
    jp z, .player_fast_input_downright
    cp STICK_DOWNLEFT
    jp z, .player_fast_input_downleft
    jp .player_fast_apply_velocity

.player_fast_input_up:
    ld a, b
    and DIR_ALLOW_UP
    jp z, .player_fast_apply_velocity
    ld a, h
    neg
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_input_down:
    ld a, b
    and DIR_ALLOW_DOWN
    jp z, .player_fast_apply_velocity
    ld a, h
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_input_left:
    ld a, b
    and DIR_ALLOW_LEFT
    jp z, .player_fast_apply_velocity
    ld a, h
    neg
    ld d, a
    jp .player_fast_apply_velocity

.player_fast_input_right:
    ld a, b
    and DIR_ALLOW_RIGHT
    jp z, .player_fast_apply_velocity
    ld a, h
    ld d, a
    jp .player_fast_apply_velocity

.player_fast_input_upright:
    ld a, b
    and DIR_ALLOW_UP
    jp z, .player_fast_check_right_only
    ld a, b
    and DIR_ALLOW_RIGHT
    jp z, .player_fast_check_up_only
    ld a, l
    ld d, a
    neg
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_check_right_only:
    ld a, b
    and DIR_ALLOW_RIGHT
    jp z, .player_fast_apply_velocity
    ld a, h
    ld d, a
    jp .player_fast_apply_velocity

.player_fast_check_up_only:
    ld a, h
    neg
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_input_upleft:
    ld a, b
    and DIR_ALLOW_UP
    jp z, .player_fast_check_left_only_1
    ld a, b
    and DIR_ALLOW_LEFT
    jp z, .player_fast_check_up_only_1
    ld a, l
    neg
    ld d, a
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_check_left_only_1:
    ld a, b
    and DIR_ALLOW_LEFT
    jp z, .player_fast_apply_velocity
    ld a, h
    neg
    ld d, a
    jp .player_fast_apply_velocity

.player_fast_check_up_only_1:
    ld a, h
    neg
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_input_downright:
    ld a, b
    and DIR_ALLOW_DOWN
    jp z, .player_fast_check_right_only_2
    ld a, b
    and DIR_ALLOW_RIGHT
    jp z, .player_fast_check_down_only_2
    ld a, l
    ld d, a
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_check_right_only_2:
    ld a, b
    and DIR_ALLOW_RIGHT
    jp z, .player_fast_apply_velocity
    ld a, h
    ld d, a
    jp .player_fast_apply_velocity

.player_fast_check_down_only_2:
    ld a, h
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_input_downleft:
    ld a, b
    and DIR_ALLOW_DOWN
    jp z, .player_fast_check_left_only_3
    ld a, b
    and DIR_ALLOW_LEFT
    jp z, .player_fast_check_down_only_3
    ld a, l
    neg
    ld d, a
    neg
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_check_left_only_3:
    ld a, b
    and DIR_ALLOW_LEFT
    jp z, .player_fast_apply_velocity
    ld a, h
    neg
    ld d, a
    jp .player_fast_apply_velocity

.player_fast_check_down_only_3:
    ld a, h
    ld e, a

.player_fast_apply_velocity:
    push de
    ld hl, entity_vel_x
    ld e, c
    ld d, 0
    add hl, de
    pop de
    ld (hl), d

    push de
    ld hl, entity_vel_y
    ld e, c
    ld d, 0
    add hl, de
    pop de
    ld (hl), e

    ; Update entity_facing_dir based on input_state.
    ; Match the generic input system so Player fast-path preserves the
    ; same directional semantics used by ChangeSprite and sprite variants.
    push af
    ld a, (input_state)
    or a
    jr z, .player_fast_facing_done
    cp 2
    jr c, .player_fast_facing_up
    cp 5
    jr c, .player_fast_facing_right
    jr z, .player_fast_facing_down
    ld a, 1                     ; FACING_LEFT
    jr .player_fast_facing_write
.player_fast_facing_right:
    ld a, 2                     ; FACING_RIGHT
    jr .player_fast_facing_write
.player_fast_facing_up:
    ld a, 3                     ; FACING_UP
    jr .player_fast_facing_write
.player_fast_facing_down:
    ld a, 4                     ; FACING_DOWN
.player_fast_facing_write:
    push hl
    push de
    ld e, c
    ld d, 0
    ld hl, entity_facing_dir
    add hl, de
    ld (hl), a
    pop de
    pop hl
.player_fast_facing_done:
    pop af

    ; Sync directional sprite facing for input-driven entities.
    ; Keep the same rule as the generic input system: skip when a
    ; State Machine owns ChangeSprite for this entity.
    push af
    push de
    ld e, c
    ld d, 0
    ld hl, entity_sm_ptr_l
    add hl, de
    ld a, (hl)
    ld hl, entity_sm_ptr_h
    add hl, de
    or (hl)
    pop de
    pop af
    jr nz, .player_fast_skip_patrol_facing
    push de
    ld e, c
    ld d, 0
    call update_entity_patrol_facing
    pop de
.player_fast_skip_patrol_facing:

.player_fast_after_input:
    ; --------------------------------------------------------------
    ; JUMP
    ; --------------------------------------------------------------
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #01
    jp z, .player_fast_after_jump

    ld hl, entity_on_ground
    add hl, de
    bit 0, (hl)
    jr z, .player_fast_jump_check

    ld hl, entity_jump_count
    add hl, de
    ld (hl), 0
    ld hl, entity_jump_bonus
    add hl, de
    ld (hl), 0

.player_fast_jump_check:
    ld a, (input_btn_curr)
    and INPUT_BTN_FIRE
    jp z, .player_fast_after_jump
    ld a, (input_btn_prev)
    and INPUT_BTN_FIRE
    jp nz, .player_fast_after_jump

    ld hl, entity_jump_max
    add hl, de
    ld b, (hl)
    ld hl, entity_jump_bonus
    add hl, de
    ld a, (hl)
    add a, b
    ld b, a

    ld hl, entity_jump_count
    add hl, de
    ld a, (hl)
    cp b
    jr c, .player_fast_do_jump

    ld hl, entity_on_ground
    add hl, de
    bit 0, (hl)
    jp z, .player_fast_after_jump

.player_fast_do_jump:
    ld hl, entity_on_ground
    add hl, de
    bit 0, (hl)
    jr nz, .player_fast_skip_bonus_consume

    ld hl, entity_jump_count
    add hl, de
    ld a, (hl)
    ld hl, entity_jump_max
    add hl, de
    cp (hl)
    jr c, .player_fast_skip_bonus_consume

    ld hl, entity_jump_bonus
    add hl, de
    ld a, (hl)
    or a
    jr z, .player_fast_skip_bonus_consume
    dec (hl)

.player_fast_skip_bonus_consume:
    ld hl, entity_jump_count
    add hl, de
    inc (hl)

    ld hl, entity_on_ground
    add hl, de
    res 0, (hl)

    ld hl, entity_platform_id
    add hl, de
    ld (hl), 255

    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #02
    jp z, .player_fast_after_jump

    ld hl, entity_gravity_vel
    add hl, de
    add hl, de
    ld (hl), #00
    inc hl
    ld (hl), #FC

.player_fast_after_jump:
    ; --------------------------------------------------------------
    ; GRAVITY
    ; --------------------------------------------------------------
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #02
    jp z, .player_fast_after_gravity

    ld hl, entity_on_ground
    add hl, de
    ld a, (hl)
    bit 0, a
    jr nz, .player_fast_gravity_grounded

    ld hl, entity_gravity_vel
    add hl, de
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)

    ld a, e
    add a, #40
    ld e, a
    ld a, d
    adc a, #00
    ld d, a

    ld a, d
    bit 7, a
    jr nz, .player_fast_store_gravity
    cp #04
    jr c, .player_fast_store_gravity
    ld de, #0400

.player_fast_store_gravity:
    dec hl
    ld (hl), e
    inc hl
    ld (hl), d

    push de
    ld hl, entity_vel_y
    ld e, c
    ld d, 0
    add hl, de
    pop de
    ld (hl), d
    jr .player_fast_after_gravity

.player_fast_gravity_grounded:
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de
    ld (hl), 0
    inc hl
    ld (hl), 0

.player_fast_after_gravity:
    ; --------------------------------------------------------------
    ; POSITION
    ; --------------------------------------------------------------
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    ld b, a
    and COMP_MASK_POSITION
    jp z, .player_fast_sync

    ld a, b
    and COMP_MASK_MOVEMENT | COMP_MASK_INPUT
    jp z, .player_fast_sync

    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    add a, b
    ld (hl), a

    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)
    bit 7, a
    jr z, .player_fast_vy_positive
    cp #F0
    jr nc, .player_fast_vy_ready
    ld a, #F0
    jr .player_fast_vy_ready
.player_fast_vy_positive:
    cp #11
    jr c, .player_fast_vy_ready
    ld a, #10
.player_fast_vy_ready:
    ld b, a
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    add a, b
    ld (hl), a

.player_fast_sync:
    call sync_player_runtime_from_entity
    ret
`,o}function In(){return`
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
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a                    ; Loop through used entities only
    ld hl, active_entity_list

position_update_loop:
    ld c, (hl)                 ; C = entity index
    inc hl                     ; Advance list pointer
    push hl                    ; Save list pointer
    ld a, (player_runtime_enabled)
    or a
    jp z, .position_check_mask
    ld a, (player_entity_index)
    cp c
    jp z, .position_skip_fast_player
.position_check_mask:
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)                 ; Get entity component mask
    ld d, a                    ; OPTIMIZED: Save mask in D to avoid redundant memory read
    pop hl                     ; Restore list pointer
    and COMP_MASK_POSITION     ; Check if has position component
    jr z, position_next_entity ; Skip if no position component

    ; Apply velocity to position (if has movement OR input component)
    ld a, d                    ; OPTIMIZED: Reuse saved mask (saves 1 memory read)
    and COMP_MASK_MOVEMENT | COMP_MASK_INPUT
    jr z, position_next_entity ; Skip velocity if no movement/input source

    ; active_entity_list already guarantees current_screen_id membership

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
    ; Y = Y + VelY (defensive clamp to avoid byte-wrap teleports)
    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)                 ; A = VelY (signed)
    ; Clamp vertical delta to [-16..+16] to avoid single-frame wrap jumps
    bit 7, a
    jr z, .pos_vy_positive
    cp #F0                     ; -16
    jr nc, .pos_vy_ready       ; already in [-16..-1]
    ld a, #F0
    jr .pos_vy_ready
.pos_vy_positive:
    cp #11                     ; 17
    jr c, .pos_vy_ready        ; already in [0..16]
    ld a, #10                  ; +16
.pos_vy_ready:
    ld b, a                    ; B = VelY

    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)                 ; A = Y
    add a, b                   ; A = Y + VelY
    ld (hl), a                 ; Store new Y

    pop hl
    pop bc
    jp position_next_entity

.position_skip_fast_player:
    pop hl

position_next_entity:
    dec b
    jp nz, position_update_loop
    ret
`}function vn(e){return`
; ==================================================================
; SPRITE COMPONENT SYSTEM (Based on SpriteEditor rendering)
; ==================================================================

init_sprite_system:
    ; Initialize sprite rendering system
    ; Clear all sprite attributes
    call clear_all_sprites
    ; Copy entity_sprite_asset_index from ROM to RAM (so CHANGE_SPRITE can modify it)
    ld hl, entity_sprite_asset_index_init
    ld de, entity_sprite_asset_index
    ld bc, 32
    ldir
    ret

update_sprite_component:
    ; Update sprite rendering based on entity positions
    ld a, (render_entity_count)
    or a
    ret z
    ld b, a                    ; Loop through renderable entities only
    ld hl, render_entity_list

sprite_update_loop:
    ld c, (hl)                 ; C = entity index
    inc hl                     ; Advance list pointer
    ld e, c
    ld d, 0
    ld a, (player_runtime_enabled)
    or a
    jp z, .sprite_not_fast_player
    ld a, (player_entity_index)
    cp c
    jp z, sprite_next_entity
.sprite_not_fast_player:

    ; render_entity_list already guarantees active + current_screen_id + sprite
    push bc
    push hl

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

.sprite_layers_ready:
    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .sprite_layers_legacy
    push bc
    push hl
    call compute_entity_base_pattern
    ld d, a                    ; D = current pattern number for layer 0
    pop hl
    pop bc
    jr .sprite_layers_mode_ready

.sprite_layers_legacy:
    ld d, 0                    ; Legacy path recomputes pattern from HW slot each layer

.sprite_layers_mode_ready:
    
    ; Loop through layers
    ; H = Remaining Layers
    ; L = Current HW Sprite
    ; B = X Position
    ; C = Y Position
    
sprite_layer_loop:
    push hl                    ; Save counters
    push bc                    ; Save Position
    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .sprite_layer_pattern_legacy
    push de                    ; Preserve current pattern number across lookup/call
    jr .sprite_layer_have_pattern

.sprite_layer_pattern_legacy:
    ld a, l
    sla a
    sla a
    ld d, a                    ; D = Pattern (HW index * 4 for 16x16)
    jr .sprite_layer_have_pattern

.sprite_layer_have_pattern:

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

    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .sprite_layer_after_pattern_restore
    pop de                     ; Restore current pattern number

.sprite_layer_after_pattern_restore:
    pop bc                     ; Restore Position
    pop hl                     ; Restore counters
    
    inc l                      ; Next HW Sprite
    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .sprite_layer_next
    ld a, d
    add a, 4                   ; Next 16x16 pattern
    ld d, a

.sprite_layer_next:
    dec h                      ; Decrement Layer Count
    jr nz, sprite_layer_loop
    
sprite_continue:
    pop hl
    pop bc

sprite_next_entity:
    dec b
    jp nz, sprite_update_loop

    ret

; ==================================================================
; PLAYER SPRITE FASTPATH
; ==================================================================
refresh_player_sprite_fastpath:
    ld a, (player_runtime_enabled)
    or a
    ret z
    ld a, (player_entity_index)
    cp #FF
    ret z
    ld c, a
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_SPRITE
    ret z
    call force_update_entity_sprite
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

.force_sprite_layers_ready:
    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .force_sprite_layers_legacy
    push bc
    push hl
    call compute_entity_base_pattern
    ld d, a                    ; D = current pattern number for layer 0
    pop hl
    pop bc
    jr .force_sprite_layers_mode_ready

.force_sprite_layers_legacy:
    ld d, 0                    ; Legacy path recomputes pattern from HW slot each layer

.force_sprite_layers_mode_ready:

    ; Loop through layers
    ; H = Layer Count
    ; L = HW Sprite Index
    ; B = X, C = Y
force_sprite_layer_loop:
    push hl                    ; Save counters
    push bc                    ; Save Position
    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .force_sprite_pattern_legacy
    push de                    ; Preserve current pattern number across lookup/call
    jr .force_sprite_have_pattern

.force_sprite_pattern_legacy:
    ld a, l
    sla a
    sla a
    ld d, a                    ; D = Pattern (HW index * 4 for 16x16)
    jr .force_sprite_have_pattern

.force_sprite_have_pattern:

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

    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .force_sprite_after_pattern_restore
    pop de                     ; Restore current pattern number

.force_sprite_after_pattern_restore:
    pop bc                     ; Restore Position
    pop hl                     ; Restore counters
    
    inc l
    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .force_sprite_next
    ld a, d
    add a, 4
    ld d, a

.force_sprite_next:
    dec h
    jr nz, force_sprite_layer_loop

force_sprite_done:
    pop hl
    pop de
    pop bc
    ret
`}function Rn(){return`
        ; ==================================================================
        ; MOVEMENT COMPONENT SYSTEM (Based on movement physics)
        ; ==================================================================

        init_movement_system:
            ; Initialize movement / physics system
            ; Clear all entity velocities (32 entries each)
            ld hl, entity_vel_x
            ld de, entity_vel_x + 1
            ld bc, 31
            ld (hl), 0
            ldir

            ld hl, entity_vel_y
            ld de, entity_vel_y + 1
            ld bc, 31
            ld (hl), 0
            ldir
    ret

        update_movement_component:
            ; Update movement / physics for entities
            ld a, (active_entity_count)
            or a
            ret z
            ld b, a                    ; Loop through used entities only
            ld hl, active_entity_list

        movement_update_loop:
            ld c, (hl)                 ; C = entity index
            inc hl                     ; Advance list pointer
            push hl                    ; Save list pointer
            ld e, c
            ld d, 0
            ld hl, entity_comp_masks
            add hl, de
            ld a, (hl)                 ; Get entity component mask
            pop hl                     ; Restore list pointer
            and COMP_MASK_MOVEMENT     ; Check if has movement component
            jr z, movement_next_entity ; Skip if no movement component

            ; No damping/friction: instant stop when input released (Maze of Galious style).
            ; Gravity component overwrites entity_vel_y each frame from gravity_vel accumulator.

        movement_next_entity:
            dec b
            jp nz, movement_update_loop
    ret
    `}function wn(e){const n=Array.from({length:3},(i,c)=>`    srl a                      ; A = X / ${Math.pow(2,c+1)}`).join(`
`),s=Array.from({length:3},(i,c)=>`    srl a                      ; A = Y / ${Math.pow(2,c+1)}`).join(`
`);return`
        ; ==================================================================
; COLLISION COMPONENT SYSTEM(Based on ScreenEditor collision detection)
        ; ==================================================================

            init_collision_system:
    ; Initialize collision detection system
    ; Clear deadly collision flags
    ld hl, entity_deadly_collision
    ld de, entity_deadly_collision + 1
    ld bc, 31                     ; 32 bytes - 1
    ld (hl), 0
    ldir

    ; Clear entity-entity collision flags
    ld hl, entity_entity_collision_flags
    ld de, entity_entity_collision_flags + 1
    ld bc, 31
    ld (hl), 0
    ldir

    ; Initialize last collided entity to "none"
    ld hl, entity_last_collision_entity
    ld de, entity_last_collision_entity + 1
    ld bc, 31
    ld (hl), 255
    ldir

    ; Default collision hitboxes: 16x16 with no offset
    ld hl, entity_collision_hitbox_w
    ld de, entity_collision_hitbox_w + 1
    ld bc, 31
    ld (hl), 16
    ldir

    ld hl, entity_collision_hitbox_h
    ld de, entity_collision_hitbox_h + 1
    ld bc, 31
    ld (hl), 16
    ldir

    ld hl, entity_collision_offset_x
    ld de, entity_collision_offset_x + 1
    ld bc, 31
    ld (hl), 0
    ldir

    ld hl, entity_collision_offset_y
    ld de, entity_collision_offset_y + 1
    ld bc, 31
    ld (hl), 0
    ldir
    ret

    update_collision_component:
    ; Ground detection for entities with Collision or Gravity components
    ; Sets entity_on_ground flag based on Y position
    ld a, (ground_entity_count)
    or a
    ret z
    ld b, a                       ; Loop through ground-probe entities only
    ld hl, ground_entity_list

    collision_update_loop:
    ld c, (hl)                    ; C = entity index
    inc hl                        ; Advance list pointer
    push hl                       ; Save list pointer

    ; Get entity Y position
    push bc
    push hl
    push de

    ; Ground detection is handled exclusively by update_wallcollision_component (tile-based)
    ; Check only platform_id and grace frames for platform-riding entities
    ; Entity is grounded if: on tiles OR on platform OR has grace frames

    ; Check if entity has platform reference
    push hl
    ld hl, entity_platform_id
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = platform_id
    cp 255
    jr nz, .grounded_by_platform  ; Has platform, mark grounded

    ; No platform, check grace frames
    ld hl, entity_platform_grace
    add hl, de
    ld a, (hl)                    ; A = grace frames
    or a
    jr nz, .grounded_by_platform  ; Has grace, mark grounded

    ; No tiles, no platform, no grace - entity is in air
    pop hl
    ld hl, entity_on_ground
    ld e, c
    ld d, 0
    add hl, de
    res 0, (hl)                   ; Mark as in air
    jr .ground_check_done

.grounded_by_platform:
    ; Entity is grounded by platform or grace frames
    pop hl
    ld hl, entity_on_ground
    ld e, c
    ld d, 0
    add hl, de
    set 0, (hl)                   ; Mark as grounded

.ground_check_done:
    ; Deadly contact is updated later by update_deadly_tiles_component.
    ; Keep collision focused on ground/platform state so we do not resample
    ; the behavior map twice per frame for the same entity.
    pop de
    pop hl
    pop bc

    collision_next_entity:
    pop hl                        ; Restore list pointer
    dec b
    jp nz, collision_update_loop

    ; Run lightweight entity-entity collision pass for all collidable entities
    call update_entity_collision_fast
    ret

update_entity_collision_fast:
    ; =============================================================
    ; Optimized entity-entity collision: 2-phase active-list system
    ; Phase 1: Build list of active collidable entities on screen
    ; Phase 2: Check only valid pairs (i < j) with clamped AABB
    ; Runs every 2 frames (latches previous result on skip frames)
    ; =============================================================

    ; Frame skip - every 2 frames
    ld hl, interrupt_counter
    ld a, (hl)
    and 1
    ret nz

    ; === PHASE 1: Build active list from prefiltered collision bucket ===
    ld hl, coll_list              ; HL = write pointer into coll_list
    xor a
    ld (coll_list_count), a       ; count = 0
    ld a, (collision_entity_count)
    or a
    ret z
    ld b, a
    ld de, collision_entity_list

.build_loop:
    ld a, (de)
    ld c, a
    inc de

    ; Clear collision flags for ALL entities with collision component
    push hl                       ; Save list write pointer
    push de
    ld e, c
    ld d, 0

    ; Clear collision flags for this entity (even if wrong screen)
    ld hl, entity_entity_collision_flags
    add hl, de
    ld (hl), 0
    ld hl, entity_last_collision_entity
    add hl, de
    ld (hl), 255

    ; Entity qualifies - add to list (max MAX_ENTITIES)
    ld a, (coll_list_count)
    cp MAX_ENTITIES
    jp nc, .build_skip            ; List full

    ; Restore pointers in reverse push order: DE read cursor first, then HL write cursor.
    ; The previous order wrote into collision_entity_list instead of coll_list.
    pop de
    pop hl
    ld (hl), c                    ; coll_list[count] = entity index
    inc hl                        ; Advance write pointer
    push hl                       ; Save updated write pointer
    push de

    ld a, (coll_list_count)
    inc a
    ld (coll_list_count), a

.build_skip:
    pop de
    pop hl                        ; Restore list write pointer
    djnz .build_loop

.build_done:
    ; === PHASE 2: Check pairs ===
    ; Need at least 2 entities for any pair
    ld a, (coll_list_count)
    cp 2
    ret c                         ; 0 or 1 entities, nothing to check

    ; Outer loop: i = 0 .. count-2
    ld b, 0                       ; B = outer index i

.outer_loop:
    ld a, (coll_list_count)
    dec a                         ; A = count - 1
    cp b
    jp z, .coll_done              ; i == count-1, done
    jp c, .coll_done              ; safety

    ; Get source entity index from coll_list[i]
    push bc                       ; Save B=i
    ld hl, coll_list
    ld e, b
    ld d, 0
    add hl, de
    ld c, (hl)                    ; C = source entity index

    ; Cache source AABB with clamping
    ld e, c
    ld d, 0

    ; source left = x + offset_x
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld hl, entity_collision_offset_x
    add hl, de
    call coll_add_signed_offset_clamped
    ld (coll_src_left), a

    ; source right = left + hitbox_w (clamped)
    ld hl, entity_collision_hitbox_w
    add hl, de
    add a, (hl)
    jp nc, .src_right_ok
    ld a, 255                     ; Clamp on overflow
.src_right_ok:
    ld (coll_src_right), a

    ; source top = y + offset_y
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld hl, entity_collision_offset_y
    add hl, de
    call coll_add_signed_offset_clamped
    ld (coll_src_top), a

    ; source bottom = top + hitbox_h (clamped)
    ld hl, entity_collision_hitbox_h
    add hl, de
    add a, (hl)
    jp nc, .src_bot_ok
    ld a, 255
.src_bot_ok:
    ld (coll_src_bottom), a

    ; Inner loop: j = i+1 .. count-1
    ; Preserve C=source entity index while restoring outer index i.
    pop de                        ; D = outer index i, E = saved scratch
    ld b, d
    push de                       ; Save i again for .inner_done
    ld a, b
    inc a                         ; A = i+1
    ld b, a                       ; B = inner index j (reusing B temporarily)
    push bc                       ; Save B=j, (stack: j, i)

.inner_loop:
    pop bc                        ; Restore B=j
    ld a, (coll_list_count)
    cp b
    jp z, .inner_done             ; j == count, done with inner
    jp c, .inner_done

    ; Get target entity index from coll_list[j]
    push bc                       ; Save B=j
    ld hl, coll_list
    ld e, b
    ld d, 0
    add hl, de
    ld b, (hl)                    ; B = target entity index

    ; --- Mutual layer mask check ---
    ; source.collidesWith & target.layer
    ld e, c
    ld d, 0
    ld hl, entity_collides_with
    add hl, de
    ld a, (hl)                    ; A = source.collidesWith
    ld e, b
    ld hl, entity_collision_layer
    add hl, de
    and (hl)                      ; A = source.collidesWith & target.layer
    jp z, .next_inner

    ; target.collidesWith & source.layer
    ld e, b
    ld d, 0
    ld hl, entity_collides_with
    add hl, de
    ld a, (hl)                    ; A = target.collidesWith
    ld e, c
    ld hl, entity_collision_layer
    add hl, de
    and (hl)                      ; A = target.collidesWith & source.layer
    jp z, .next_inner

    ; --- AABB overlap test (source cached, compute target with clamp) ---
    ; target left = x + offset_x
    ld e, b
    ld d, 0
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld hl, entity_collision_offset_x
    add hl, de
    push bc
    call coll_add_signed_offset_clamped
    pop bc
    ld e, a                       ; E = target_left

    ; source.right < target.left => no overlap
    ; (edge-touch counts as collision contact)
    ld a, (coll_src_right)
    cp e
    jp c, .next_inner

    ; target right = target_left + hitbox_w (clamped)
    push de                       ; Save E=target_left, D free
    ld e, b
    ld d, 0
    ld hl, entity_collision_hitbox_w
    add hl, de
    pop de                        ; Restore E=target_left
    ld a, e                       ; A = target_left
    add a, (hl)                   ; A = target_left + width
    jp nc, .tgt_right_ok
    ld a, 255
.tgt_right_ok:
    ; source.left > target.right => no overlap
    ; (edge-touch counts as collision contact)
    ld d, a                       ; D = target_right
    ld a, (coll_src_left)
    cp d
    jp c, .x_overlap_ok
    jp z, .x_overlap_ok
    jp .next_inner
.x_overlap_ok:

    ; target top = y + offset_y
    ld e, b
    ld d, 0
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld hl, entity_collision_offset_y
    add hl, de
    push bc
    call coll_add_signed_offset_clamped
    pop bc
    ld e, a                       ; E = target_top

    ; source.bottom < target.top => no overlap
    ; (edge-touch counts as collision contact)
    ld a, (coll_src_bottom)
    cp e
    jp c, .next_inner

    ; target bottom = target_top + hitbox_h (clamped)
    push de                       ; Save E=target_top
    ld e, b
    ld d, 0
    ld hl, entity_collision_hitbox_h
    add hl, de
    pop de                        ; Restore E=target_top
    ld a, e                       ; A = target_top
    add a, (hl)                   ; A = target_top + height
    jp nc, .tgt_bot_ok
    ld a, 255
.tgt_bot_ok:
    ; source.top > target.bottom => no overlap
    ; (edge-touch counts as collision contact)
    ld d, a                       ; D = target_bottom
    ld a, (coll_src_top)
    cp d
    jp c, .y_overlap_ok
    jp z, .y_overlap_ok
    jp .next_inner
.y_overlap_ok:

    ; ==========  COLLISION DETECTED between source(C) and target(B) ==========

    ; --- Set flags for SOURCE entity (C) ---
    push bc                       ; Save B=target, C=source
    ld e, c
    ld d, 0

    ; Store target index in source's last_collision_entity
    ld hl, entity_last_collision_entity
    add hl, de
    ld (hl), b

    ; Classify target layer into collision event flags
    push de
    ld e, b
    ld d, 0
    ld hl, entity_collision_layer
    add hl, de
    ld a, (hl)                    ; A = target layer bitmask
    pop de
    call coll_flags_from_layer
    ld hl, entity_entity_collision_flags
    add hl, de
    or (hl)                       ; OR with existing flags (multiple hits)
    ld (hl), a

    ; --- Set flags for TARGET entity (B) --- (bidirectional)
    pop bc                        ; Restore B=target, C=source
    push bc

    ld e, b
    ld d, 0

    ; Store source index in target's last_collision_entity
    ld hl, entity_last_collision_entity
    add hl, de
    ld (hl), c

    ; Classify source layer into collision event flags
    push de
    ld e, c
    ld d, 0
    ld hl, entity_collision_layer
    add hl, de
    ld a, (hl)                    ; A = source layer bitmask
    pop de
    call coll_flags_from_layer
    ld hl, entity_entity_collision_flags
    add hl, de
    or (hl)                       ; OR with existing flags
    ld (hl), a

    pop bc                        ; Restore B=target, C=source

.next_inner:
    ; Advance j
    pop bc                        ; Restore B=j (inner index)
    inc b
    push bc                       ; Save updated j
    jp .inner_loop

.inner_done:
    pop de                        ; Restore D=i (keep C=source untouched)
    ld b, d
    inc b                         ; i++
    jp .outer_loop

.coll_done:
    ret

        ; ==================================================================
; COLLISION HELPER FUNCTIONS(Critical for Gameplay Parity)
        ; ==================================================================

; ------------------------------------------------------------------
; coll_add_signed_offset_clamped
; Input:  A = base coordinate (0..255)
;         HL = pointer to signed offset byte (-128..127, two's complement)
; Output: A = clamped (base + offset), saturated to 0..255
; Clobbers: B
; ------------------------------------------------------------------
coll_add_signed_offset_clamped:
    ld b, (hl)                    ; B = signed offset byte
    add a, b                      ; A = base + offset (wrapped)
    bit 7, b
    jr z, .casc_positive
    ; Negative offset: carry=0 means underflow (wrapped below 0)
    jr c, .casc_done
    xor a                         ; Clamp to 0
    ret
.casc_positive:
    ; Positive offset: carry=1 means overflow (wrapped above 255)
    jr nc, .casc_done
    ld a, 255                     ; Clamp to 255
.casc_done:
    ret

; ------------------------------------------------------------------
; coll_flags_from_layer
; Input:  A = collision layer bitmask of the other entity
; Output: A = collision event flags (entity/enemy/item)
; Clobbers: B, C
; ------------------------------------------------------------------
coll_flags_from_layer:
    ld b, a
    ld c, COLLISION_EVENT_ENTITY

    ld a, b
    and COLLISION_LAYER_ENEMY
    jr z, .cffl_no_enemy
    ld a, c
    or COLLISION_EVENT_ENEMY
    ld c, a
.cffl_no_enemy:
    ld a, b
    and COLLISION_LAYER_ITEM
    jr z, .cffl_done
    ld a, c
    or COLLISION_EVENT_ITEM
    ld c, a
.cffl_done:
    ld a, c
    ret

            check_tile_collision:
    ; Check collision with background tiles
        ; A = X position, B = Y position
        ; Convert pixel position to tile coordinates
    push af
    push bc

        ; DYNAMIC TILE SIZE CONVERSION
        ; TODO: This should be calculated from actual screen map tile sizes
        ; For now, detect most common tile size in project
; MSX Screen 2: behavior map is 32x24 (one entry per 8x8 character cell)
    ; Always divide by 8 to convert pixels to character column/row
    ; Convert X to tile column (divide by 8)

${n}
    ld c, a; C = tile column

        ; Convert Y to tile row (divide by 8)
    ld a, b
${s}
    ld b, a; B = tile row

        ; Check if position is within valid tile map
    ld a, c
    cp 32; Screen width in tiles
    jr nc, no_tile_collision
    ld a, b
    cp 24; Screen height in tiles
    jr nc, no_tile_collision

        ; Get tile at position(simplified - would read from behavior map)
        ; For now, assume all non - zero tiles are solid
        ; This would read from the behavior map generated from screen data
    call get_behavior_tile; Returns A = behavior value
    and #F0               ; Family bits only (0=NoSolid, #10+=Solid)
    jr z, no_tile_collision; 0 = passable (NoSolid family)

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

    push de; Save D=otherX, E=otherIndex
    ld d, 0; Reset D for correct address calculation
    ld hl, entity_y_pos
    add hl, de; HL points to other entity Y
    ld a, (hl); A = other Y
    pop de; Restore D=otherX, E=otherIndex
    ld e, a; E = other Y

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
    ; C = entity index (from collision loop)
    push de
    push hl
    ld e, c
    ld d, 0
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a              ; Stop X movement for this entity
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a              ; Stop Y movement for this entity
    pop hl
    pop de
    ret

    handle_tile_collision:
    ; Handle collision with solid tiles
    ; C = entity index (from collision loop)
    push de
    push hl
    ld e, c
    ld d, 0
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a              ; Stop X movement for this entity
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a              ; Stop Y movement for this entity
    pop hl
    pop de
    ret

    handle_entity_collision:
    ; Handle collision between entities
    ; At entry:
    ;   C = current entity index
    ;   Stack top: DE (E = other entity index), HL, AF, BC
    ; Check for platform riding: if current entity is above other entity and
    ; other entity is a platform (collision_layer & 8), set platform reference

    push bc
    push de
    push hl

    ; Get other entity index from stack (it's at SP+6)
    ld hl, 6
    add hl, sp
    ld a, (hl)              ; A = other entity index (E from pushed DE)
    ld e, a                 ; E = other entity index

    ; Get current entity Y position
    ld hl, entity_y_pos
    ld d, 0
    ld b, c                 ; B = current entity index
    add hl, bc              ; HL = &entity_y_pos[current]
    ld b, (hl)              ; B = current Y

    ; Get other entity Y position
    ld hl, entity_y_pos
    ld d, 0
    add hl, de              ; HL = &entity_y_pos[other]
    ld d, (hl)              ; D = other Y

    ; Check if current entity is above other entity
    ; Current is above if: current_Y + 16 is near other_Y (within 4 pixels)
    ld a, b                 ; A = current Y
    add a, 16               ; A = current Y + height
    sub d                   ; A = (current Y + 16) - other Y
    ; If result is 0-4, current is standing on other
    cp 5
    jr nc, .not_on_platform ; Not standing on platform

    ; Current entity is above other entity
    ; Check if other entity is a platform (collision_layer & COLLISION_LAYER_PLATFORM)
    ld hl, entity_collision_layer
    ld d, 0
    add hl, de              ; HL = &entity_collision_layer[other]
    ld a, (hl)              ; A = other entity collision layer
    and COLLISION_LAYER_PLATFORM
    jr z, .not_on_platform  ; Not a platform

    ; Other entity IS a platform - set platform reference
    ld a, e                 ; A = other entity index
    ld hl, entity_platform_id
    ld d, 0
    ld e, c                 ; E = current entity index
    add hl, de              ; HL = &entity_platform_id[current]
    ld (hl), a              ; Set platform reference

    ; Reset grace frames to 0 (we're on a platform now)
    ld hl, entity_platform_grace
    ld e, c
    add hl, de
    ld (hl), 0

.not_on_platform:
    pop hl
    pop de
    pop bc
    ret

        `}function Nn(e="simple32k"){const l=Ae(e);return`
    ; ------------------------------------------------------------------
    ; get_behavior_tile
    ; ------------------------------------------------------------------
${X({purpose:"Read behavior byte for tile at (B=row, C=column) from the runtime behavior map.",inputs:["B = tile row    (0..23, out-of-range → A=0, passable)","C = tile column (0..31, out-of-range → A=0, passable)","current_behavior_map = 16-bit pointer to active screen behavior map","current_behavior_map_bank = memory bank number (mapper context)"],outputs:["A = behavior byte:","  bits 7-4 (A & #F0): family / solidity class (0x00 = NoSolid, 0x10+ = Solid)","  bits 3-0 (A & #0F): flag bits (e.g. 0x08 = Interactable)"],clobbers:["AF"],preserved:["BC","DE","HL"],notes:["Maintains a single-row cache (behavior_cache_row / behavior_cache_row_base)","so consecutive calls for the same row skip the row*32 multiply.","Mapper push/pop protects P2 bank around the map read (no-op in simple32k mode).","MUST be called with DE = entity index already set (DE is preserved, not used)."]})}
get_behavior_tile:
    ; Bounds check: row must be 0-23, column must be 0-31
    ; NOTE: jp nc (not jr nc) to gbt_oob — gbt_oob is a global label defined after
    ; get_behavior_tile_nb. Using jr would create a local-label scoping conflict in
    ; glass.jar (get_behavior_tile_nb: starts a new scope, so .bt_out_of_bounds would
    ; belong to that scope, not get_behavior_tile's scope).
    ld a, b
    cp 24
    jp nc, gbt_oob                ; Row >= 24: treat as passable
    ld a, c
    cp 32
    jp nc, gbt_oob                ; Column >= 32: treat as passable
get_behavior_tile_nb:
    ; Entry point for callers that guarantee B ∈ 0..23 and C ∈ 0..31.
    ; Saves 36 cycles (4+7+7+4+7+7) by skipping bounds validation.
    ; DO NOT call this unless the probe coordinates are provably in-bounds.
    push hl
    push de

    ; Load cached behavior map pointer (fallback to current_behavior_map)
    ld hl, behavior_cache_map_l
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, d
    or e
    jr nz, .map_ptr_ready

    ld de, (current_behavior_map)
    ld a, e
    ld (behavior_cache_map_l), a
    ld a, d
    ld (behavior_cache_map_h), a
    ld a, #FF
    ld (behavior_cache_row), a

.map_ptr_ready:
    ; Reuse previous row base when checking multiple points on same row
    ld a, b
    ld hl, behavior_cache_row
    cp (hl)
    jr z, .use_cached_row_base

    ; Cache miss: row base = behavior_map + row*32
    ld a, b
    ld l, a
    ld h, 0
    add hl, hl                    ; HL = row * 2
    add hl, hl                    ; HL = row * 4
    add hl, hl                    ; HL = row * 8
    add hl, hl                    ; HL = row * 16
    add hl, hl                    ; HL = row * 32
    add hl, de                    ; HL = row base address

    ld a, b
    ld (behavior_cache_row), a
    ld (behavior_cache_row_base), hl
    jr .row_base_ready

.use_cached_row_base:
    ld hl, (behavior_cache_row_base)

.row_base_ready:
    ld e, c
    ld d, 0
    add hl, de                    ; HL = row base + column
${l?`
    ; Banked ROM build: protect P2 bank around the read in case behavior map is in ROM bank.
    call mapper_push_p2
    ld a, (current_behavior_map_bank)
    call mapper_set_bank_p2
    ld a, (hl)                    ; A = behavior value
    push af
    call mapper_pop_p2
    pop af
`:`
    ; simple32k: behavior map is always resident in RAM (no bank switching needed).
    ; Skip mapper push/pop/set — saves ~169 cycles per call (41% overhead eliminated).
    ld a, (hl)                    ; A = behavior value (direct RAM read)
`}    pop de
    pop hl
    ret
gbt_oob:
    xor a                         ; A = 0 (passable)
    ret
    `}function Ln(){return`
        ; ==================================================================
        ; INPUT COMPONENT SYSTEM (With direction restrictions - Cursors)
        ; ==================================================================

        init_input_system:
            ; Initialize input handling system
            xor a
            ld (input_state), a
            ld (prev_input_state), a
            ld (input_btn_curr), a
            ld (input_btn_prev), a
            ld (input_fire), a

            ; Initialize direction masks for all entities (default: all directions allowed)
            ld hl, entity_dir_mask
            ld de, entity_dir_mask + 1
            ld bc, 31
            ld (hl), #0F               ; Default: 00001111 = all directions enabled
            ldir

            ; Initialize cursor speed for all entities (default: 2 px/frame)
            ld hl, entity_input_speed
            ld de, entity_input_speed + 1
            ld bc, 31
            ld (hl), 2
            ldir

            ; Initialize input disabled flags to 0 (all entities start with input ENABLED)
            ld hl, entity_input_disabled
            ld de, entity_input_disabled + 1
            ld bc, 31
            ld (hl), 0
            ldir
            ret

        update_input_component:
            ; Update input handling for player entities
            ; NOTE: input_state/prev_input_state are polled by interrupt task_update_input

            ; Process input for entities with input component
            ld a, (input_entity_count)
            or a
            ret z
            ld b, a                    ; Loop through input-enabled entities only
            ld hl, input_entity_list

        input_update_loop:
            ld c, (hl)                 ; C = entity index
            inc hl                     ; Advance list pointer
            push hl                    ; Save list pointer
            pop hl                     ; Restore list pointer
            ld a, (player_runtime_enabled)
            or a
            jp z, .input_not_fast_player
            ld a, (player_entity_index)
            cp c
            jp z, input_next_entity
        .input_not_fast_player:

            ; input_entity_list already guarantees active + current_screen_id + input

            ; Check if input is disabled for this entity (DISABLE_INPUT action)
            push hl
            ld e, c
            ld d, 0
            ld hl, entity_input_disabled
            add hl, de
            ld a, (hl)
            pop hl
            or a
            jp z, .input_enabled
            ; Input disabled: zero velocity and skip
            push hl
            ld e, c
            ld d, 0
            ld hl, entity_vel_x
            add hl, de
            ld (hl), 0
            ld hl, entity_vel_y
            add hl, de
            ld (hl), 0
            pop hl
            jp input_next_entity
        .input_enabled:

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

            ; Resolve per-entity input speed once per update.
            ; H = cardinal speed, L = diagonal speed (max(1, speed/2)).
            push af
            ld a, d
            push af
            ld d, 0
            ld hl, entity_input_speed
            add hl, de
            ld a, (hl)
            or a
            jr nz, .input_speed_ok
            ld a, 1
        .input_speed_ok:
            ld h, a
            srl a
            jr nz, .input_diag_speed_ok
            ld a, 1
        .input_diag_speed_ok:
            ld l, a
            pop af
            ld d, a
            pop af

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
            ld a, h
            neg
            ld c, a                    ; Negative Y velocity (up)
            jp input_apply_velocity

        input_move_down:
            ; Check if DOWN is allowed (bit 1)
            ld a, d
            and DIR_ALLOW_DOWN
            jp z, input_apply_velocity ; Not allowed, skip
            ld a, h
            ld c, a                    ; Positive Y velocity (down)
            jp input_apply_velocity

        input_move_left:
            ; Check if LEFT is allowed (bit 2)
            ld a, d
            and DIR_ALLOW_LEFT
            jp z, input_apply_velocity ; Not allowed, skip
            ld a, h
            neg
            ld b, a                    ; Negative X velocity (left)
            jp input_apply_velocity

        input_move_right:
            ; Check if RIGHT is allowed (bit 3)
            ld a, d
            and DIR_ALLOW_RIGHT
            jp z, input_apply_velocity ; Not allowed, skip
            ld a, h
            ld b, a                    ; Positive X velocity (right)
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
            ld a, l                    ; Diagonal movement (slower)
            ld b, a
            neg
            ld c, a
            jp input_apply_velocity
        input_check_right_only:
            ; Only RIGHT allowed
            ld a, d
            and DIR_ALLOW_RIGHT
            jp z, input_apply_velocity
            ld a, h
            ld b, a
            jp input_apply_velocity
        input_check_up_only:
            ; Only UP allowed
            ld a, h
            neg
            ld c, a
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
            ld a, l
            neg
            ld b, a
            ld c, a
            jp input_apply_velocity
        input_check_left_only1:
            ; Only LEFT allowed
            ld a, d
            and DIR_ALLOW_LEFT
            jp z, input_apply_velocity
            ld a, h
            neg
            ld b, a
            jp input_apply_velocity
        input_check_up_only1:
            ; Only UP allowed
            ld a, h
            neg
            ld c, a
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
            ld a, l
            ld b, a
            ld c, a
            jp input_apply_velocity
        input_check_right_only2:
            ; Only RIGHT allowed
            ld a, d
            and DIR_ALLOW_RIGHT
            jp z, input_apply_velocity
            ld a, h
            ld b, a
            jp input_apply_velocity
        input_check_down_only2:
            ; Only DOWN allowed
            ld a, h
            ld c, a
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
            ld a, l
            ld c, a
            neg
            ld b, a
            jp input_apply_velocity
        input_check_left_only3:
            ; Only LEFT allowed
            ld a, d
            and DIR_ALLOW_LEFT
            jp z, input_apply_velocity
            ld a, h
            neg
            ld b, a
            jp input_apply_velocity
        input_check_down_only3:
            ; Only DOWN allowed
            ld a, h
            ld c, a

        input_apply_velocity:
            ; Apply calculated velocity to entity
            ; B = X velocity, C = Y velocity, E = entity index (preserved from earlier)
            ld d, 0
            ld hl, entity_vel_x
            add hl, de
            ld (hl), b                 ; entity_vel_x[entity_index] = X velocity

            ld hl, entity_vel_y
            add hl, de
            ld (hl), c                 ; entity_vel_y[entity_index] = Y velocity

            ; Update entity_facing_dir based on input_state
            ; Only updates for directional inputs (0 = no change, keeps last facing)
            push af
            ld a, (input_state)
            or a
            jr z, .input_facing_done    ; 0 = no direction pressed, keep last facing
            cp 2
            jr c, .input_facing_up      ; 1 = UP only
            cp 5
            jr c, .input_facing_right   ; 2,3,4 = UP+RIGHT, RIGHT, DOWN+RIGHT
            jr z, .input_facing_down    ; 5 = DOWN only
            ; 6,7,8 = DOWN+LEFT, LEFT, UP+LEFT
            ld a, 1                     ; FACING_LEFT = 1
            jr .input_facing_write
.input_facing_right:
            ld a, 2                     ; FACING_RIGHT = 2
            jr .input_facing_write
.input_facing_up:
            ld a, 3                     ; FACING_UP = 3
            jr .input_facing_write
.input_facing_down:
            ld a, 4                     ; FACING_DOWN = 4
.input_facing_write:
            push hl
            push de
            ld hl, entity_facing_dir
            add hl, de                  ; DE = (0, entity_index)
            ld (hl), a
            pop de
            pop hl
.input_facing_done:
            pop af

            ; Sync directional sprite facing for input-driven entities.
            ; Uses sprite_dir_* lookup tables (left/right/up/down variants).
            ; SKIP if entity has a State Machine: SM controls sprite via ChangeSprite.
            ; Calling patrol facing for SM entities overwrites entity_sprite_asset_index
            ; every frame, undoing what ChangeSprite set (walk sprite would revert to idle).
            push af
            ld hl, entity_sm_ptr_l
            add hl, de              ; DE = (0, entity_index)
            ld a, (hl)
            ld hl, entity_sm_ptr_h
            add hl, de
            or (hl)                 ; A != 0 if SM pointer is set
            pop af
            jr nz, .skip_patrol_facing
            call update_entity_patrol_facing
.skip_patrol_facing:

            pop hl
            pop bc

        input_next_entity:
            dec b
            jp nz, input_update_loop
            ret
    `}function Dn(){return`
    ; ==================================================================
        ; BEHAVIOR COMPONENT SYSTEM(Based on BehaviorEditor logic)
    ; ==================================================================

        init_behavior_system:
; Initialize AI / behavior system
            ret

update_behavior_component:
; Update AI / behavior logic for entities
            ld a, (active_entity_count)
            or a
            ret z
            ld b, a                    ; Loop through used entities only
            ld hl, active_entity_list

behavior_update_loop:
            ld c, (hl)                 ; C = entity index
            inc hl                     ; Advance list pointer
            push hl                    ; Save list pointer
            ld e, c
            ld d, 0
            ld hl, entity_comp_masks
            add hl, de
            ld a, (hl)                 ; Get entity component mask
            pop hl                     ; Restore list pointer
            and COMP_MASK_BEHAVIOR; Check if has behavior component
            jr z, behavior_next_entity; Skip if no behavior component

    ; Execute behavior scripts / AI logic
    ; TODO: State machines, pathfinding, decision trees

behavior_next_entity:
            dec b
            jp nz, behavior_update_loop
            ret
    `}function xn(){return`
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
            ld a, (active_entity_count)
            or a
            ret z
            ld b, a                    ; Loop through used entities only
            ld hl, active_entity_list

gravity_update_loop:
            ld c, (hl)                 ; C = entity index
            inc hl                     ; Advance list pointer
            push hl                    ; Save list pointer
            ld a, (player_runtime_enabled)
            or a
            jp z, .gravity_check_mask
            ld a, (player_entity_index)
            cp c
            jp z, .gravity_skip_fast_player
        .gravity_check_mask:
            ld e, c
            ld d, 0
            ld hl, entity_comp_masks_hi
            add hl, de
            ld a, (hl)                 ; Get entity component mask high byte
            pop hl                     ; Restore list pointer
            and #02; Check COMP_MASK_GRAVITY(#0200) => bit 1 in high byte
            jr z, gravity_next_entity; Skip if no gravity component

    ; active_entity_list already guarantees current_screen_id membership

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
    ; Skip cap if velocity is negative (entity is moving UP / jumping)
            ld a, d
            bit 7, a; Check sign bit - negative means going up
            jr nz, gravity_store_vel; Skip cap for upward velocity
            cp #04; Check if >= 1024 (unsigned, only for positive/downward)
            jr c, gravity_store_vel; If < 1024, continue
            ld de, #0400; Cap at terminal velocity

gravity_store_vel:
; Store updated gravity velocity
            dec hl
            ld (hl), e
            inc hl
            ld (hl), d

    ; Set entity_vel_y to gravity integer part
    ; Position component will apply vel_y to Y position
    ; Wall collision can then detect vertical movement and snap back
            push de                ; Save gravity velocity (D=integer part)
            ld hl, entity_vel_y
            ld e, c                ; E = entity index
            ld d, 0
            add hl, de             ; HL = &entity_vel_y[entity]
            pop de                 ; Restore gravity velocity
            ld (hl), d             ; vel_y = gravity velocity integer part

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
            jp gravity_next_entity

        .gravity_skip_fast_player:
            pop hl

gravity_next_entity:
            dec b
            jp nz, gravity_update_loop
    ret
    `}function Mn(){return`
    ; ==================================================================
    ; HEALTH COMPONENT SYSTEM
    ; ==================================================================
    ; Manages entity health/lives (current, max)
    ; Detects death when current <= 0
    ; Provides DECREASE_LIVES and INCREASE_LIVES functionality
    ; ==================================================================

init_health_system:
    ; Initialize health for all entities with Health component
    ; Default: current = 3, max = 3 (configurable per entity)
    ld b, 32                      ; Loop all entities
    ld hl, entity_comp_masks_hi   ; Check high byte for Health bit
    ld c, 0                       ; Entity index

.init_loop:
    ld a, (hl)
    and #04                       ; COMP_MASK_HEALTH (bit 2 in high byte = #0400)
    jr z, .init_next_entity       ; Skip if no health component

    ; Initialize current health (default: 3)
    push bc
    push hl
    ld hl, entity_health_current
    ld e, c
    ld d, 0
    add hl, de
    ld (hl), 3                    ; Default current = 3

    ; Initialize max health (default: 3)
    ld hl, entity_health_max
    add hl, de
    ld (hl), 3                    ; Default max = 3
    pop hl
    pop bc

.init_next_entity:
    inc hl
    inc c
    djnz .init_loop
    ret

update_health_component:
    ; Check for death (current <= 0) and mark entities as dead
    ; Entity death is detected by state machine via HEALTH_LESS_THAN condition
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a                       ; Loop used entities only
    ld hl, active_entity_list

.health_update_loop:
    ld c, (hl)                    ; C = entity index
    inc hl                        ; Advance list pointer
    push hl                       ; Save list pointer
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    pop hl                        ; Restore list pointer
    and #04                       ; COMP_MASK_HEALTH
    jr z, .health_next_entity

    ; Check current health
    push bc
    push hl
    ld hl, entity_health_current
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = current health

    ; Check if dead (current <= 0)
    or a                          ; Set flags
    jr nz, .health_alive          ; If != 0, entity is alive

    ; Entity is dead (current = 0)
    ; Could trigger death state here, but state machine handles it
    ; via HEALTH_LESS_THAN or HEALTH_EQUALS conditions

.health_alive:
    pop hl
    pop bc

.health_next_entity:
    dec b
    jp nz, .health_update_loop
    ret

; ==================================================================
; HEALTH HELPER FUNCTIONS (called by State Machine actions)
; ==================================================================

decrease_entity_lives:
    ; Decrease lives for entity in register C by amount in register A
    ; Input: C = entity index, A = amount to decrease
    ; Output: Updated entity_health_current
    ; Destroys: AF, DE, HL
    push bc
    ld b, a                       ; Save amount in B
    ld hl, entity_health_current
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = current health
    sub b                         ; Subtract amount
    jr nc, .store_health          ; If no carry (result >= 0), store
    xor a                         ; Clamp to 0 if negative
.store_health:
    ld (hl), a                    ; Store new health
    pop bc
    ret

increase_entity_lives:
    ; Increase lives for entity in register C by amount in register A
    ; Input: C = entity index, A = amount to increase
    ; Output: Updated entity_health_current (clamped to max)
    ; Destroys: AF, DE, HL
    push bc
    ld b, a                       ; Save amount in B

    ; Get current health
    ld hl, entity_health_current
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = current health

    ; Add amount
    add a, b
    ld b, a                       ; Save result in B

    ; Get max health
    ld hl, entity_health_max
    add hl, de
    ld a, (hl)                    ; A = max health

    ; Clamp to max
    cp b                          ; Compare max with result
    jr nc, .store_result          ; If max >= result, use result
    ld b, a                       ; Otherwise clamp to max

.store_result:
    ld hl, entity_health_current
    add hl, de
    ld (hl), b                    ; Store clamped health
    pop bc
    ret
    `}function Pn(){return`
    ; ==================================================================
    ; DAMAGE COMPONENT SYSTEM
    ; ==================================================================
    ; Manages damage dealing and invincibility frames
    ;
    ; Components:
    ; - entity_invincibility_frames: Countdown timer for invulnerability (32 bytes)
    ; - entity_damage_amount: How much damage this entity deals (32 bytes)
    ;
    ; Invincibility frames prevent damage for ~1 second after being hit

init_damage_system:
    ; Initialize invincibility frames to 0 for all entities
    ld hl, entity_invincibility_frames
    ld de, entity_invincibility_frames + 1
    ld bc, 31                     ; 32 bytes - 1
    ld (hl), 0
    ldir

    ; Initialize damage amounts (default: 1 damage per entity)
    ld hl, entity_damage_amount
    ld de, entity_damage_amount + 1
    ld bc, 31
    ld (hl), 1
    ldir
    ret

update_damage_component:
    ; Update invincibility frames for all entities with Damage component
    ; Decrements invincibility_frames counter each frame
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a                       ; Loop used entities only
    ld hl, active_entity_list

.damage_update_loop:
    ld c, (hl)                    ; C = entity index
    inc hl                        ; Advance list pointer
    push hl                       ; Save list pointer
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    pop hl                        ; Restore list pointer
    and #08                       ; COMP_MASK_DAMAGE (bit 3 in high byte = #0800)
    jr z, .damage_next_entity     ; Skip if no damage component

    ; Decrement invincibility frames if > 0
    push bc
    push hl

    ld hl, entity_invincibility_frames
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = current invincibility frames
    or a                          ; Check if 0
    jr z, .damage_frames_done     ; Already 0, skip

    dec a                         ; Decrement
    ld (hl), a                    ; Store back

.damage_frames_done:
    pop hl
    pop bc

.damage_next_entity:
    dec b
    jp nz, .damage_update_loop
    ret

; ==================================================================
; DAMAGE HELPER FUNCTIONS
; ==================================================================

apply_damage_to_entity:
    ; Apply damage to entity and set invincibility frames
    ; Input: C = entity index, A = damage amount
    ; Destroys: AF, DE, HL
    push bc
    ld b, a                       ; B = damage amount

    ; Check if entity has invincibility frames active
    ld hl, entity_invincibility_frames
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    or a
    jr nz, .damage_blocked        ; Still invincible, block damage

    ; Apply damage using decrease_entity_lives
    ld a, b                       ; A = damage amount
    call decrease_entity_lives    ; C still holds entity index

    ; Set invincibility frames (60 frames = 1 second @ 60 FPS)
    ld hl, entity_invincibility_frames
    ld e, c
    ld d, 0
    add hl, de
    ld (hl), 60                   ; 1 second of invincibility

.damage_blocked:
    pop bc
    ret

check_entity_invincible:
    ; Check if entity is currently invincible
    ; Input: C = entity index
    ; Output: A = 1 if invincible, 0 if vulnerable
    ; Destroys: DE, HL
    ld hl, entity_invincibility_frames
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    or a                          ; Sets Z flag if 0
    ret z                         ; Return 0 if vulnerable

    ld a, 1                       ; Return 1 if invincible
    ret
    `}function kn(){return`
    ; ==================================================================
    ; SHOOT COMPONENT SYSTEM
    ; ==================================================================
    ; Manages shooting/projectile spawning with cooldown
    ;
    ; Components:
    ; - entity_shoot_cooldown: Frames until can shoot again (32 bytes)
    ; - entity_shoot_sprite_id: Sprite ID for projectile (32 bytes)
    ; - entity_shoot_speed: Projectile velocity (32 bytes)
    ;
    ; Fire button detection integrated with input system

init_shoot_system:
    ; Initialize cooldowns to 0 (can shoot immediately)
    ld hl, entity_shoot_cooldown
    ld de, entity_shoot_cooldown + 1
    ld bc, 31                     ; 32 bytes - 1
    ld (hl), 0
    ldir

    ; Initialize default projectile speed (3 pixels/frame)
    ld hl, entity_shoot_speed
    ld de, entity_shoot_speed + 1
    ld bc, 31
    ld (hl), 3
    ldir

    ; Initialize sprite IDs to 0 (will be set by template data)
    ld hl, entity_shoot_sprite_id
    ld de, entity_shoot_sprite_id + 1
    ld bc, 31
    ld (hl), 0
    ldir
    ret

update_shoot_component:
    ; Update shooting for all entities with Shoot component
    ; Decrements cooldown and spawns projectile if fire pressed
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a                       ; Loop used entities only
    ld hl, active_entity_list

.shoot_update_loop:
    ld c, (hl)                    ; C = entity index
    inc hl                        ; Advance list pointer
    push hl                       ; Save list pointer
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    pop hl                        ; Restore list pointer
    and #10                       ; COMP_MASK_SHOOT (bit 4 in high byte = #1000)
    jr z, .shoot_next_entity      ; Skip if no shoot component

    ; Decrement cooldown if > 0
    push bc
    push hl

    ld hl, entity_shoot_cooldown
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = current cooldown
    or a                          ; Check if 0
    jr z, .usc_check_fire         ; Cooldown expired, check fire button

    ; Decrement cooldown
    dec a
    ld (hl), a
    jr .shoot_done                ; Still cooling down, skip

.usc_check_fire:
    ; Check if fire button is pressed
    ld a, (input_fire)
    or a
    jr z, .shoot_done             ; Fire not pressed, skip

    ; Fire button pressed - spawn projectile
    call .spawn_projectile
    jr .shoot_done

.spawn_projectile:
    ; Spawn projectile entity
    ; Input: C = shooter entity index
    ; Destroys: AF, DE, HL
    push bc
    push de

    ; Find free entity slot
    ld hl, entity_comp_masks
    ld b, 32                      ; Check up to 32 entities
    ld d, 0                       ; Free slot index

.find_free_slot:
    ld a, (hl)                    ; Check low byte of mask
    or a
    jr z, .check_high_byte        ; Low byte is 0, check high byte

.next_free_slot:
    inc hl                        ; Next entity
    inc d                         ; Increment slot index
    djnz .find_free_slot          ; Loop for all entities

    ; No free slot found - abort spawn
    pop de
    pop bc
    ret

.check_high_byte:
    push hl
    ld hl, entity_comp_masks_hi
    ld e, d
    add hl, de
    ld a, (hl)                    ; Check high byte
    pop hl
    or a
    jr nz, .next_free_slot        ; High byte not zero, keep searching

.found_free_slot:
    ; D = Free entity index for projectile
    ; C = Shooter entity index
    pop de                        ; Discard saved DE
    push bc                       ; Save shooter index
    push de                       ; Save for later

    ; Get shooter position
    ld hl, entity_x_pos
    ld e, c
    ld b, 0
    ld c, b
    add hl, bc
    ld a, (hl)                    ; A = shooter X
    add a, 8                      ; Offset to center (8 pixels)
    ld b, a                       ; B = projectile X

    ld hl, entity_y_pos
    add hl, bc
    ld a, (hl)                    ; A = shooter Y
    add a, 8                      ; Offset to center
    ld c, a                       ; C = projectile Y

    ; Set projectile position
    ld hl, entity_x_pos
    ld e, d
    push de
    ld d, 0
    add hl, de
    ld (hl), b                    ; Set projectile X

    ld hl, entity_y_pos
    add hl, de
    ld (hl), c                    ; Set projectile Y

    ; Activate projectile with Position + Sprite + Movement
    ld hl, entity_comp_masks
    add hl, de
    ld (hl), #07                  ; POSITION | SPRITE | MOVEMENT (low byte)

    ld hl, entity_comp_masks_hi
    add hl, de
    ld (hl), 0                    ; High byte = 0

    ; Set projectile velocity based on shooter's facing direction
    ; Determine direction from shooter's current velocity
    pop de                        ; DE = projectile index
    pop bc                        ; BC = shooter index
    push bc
    push de

    ; Get shooter's velocity X to determine facing direction
    ld hl, entity_vel_x
    ld e, c                       ; Shooter index
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = shooter's vel_x

    ; Check if shooter is moving left (negative velocity)
    bit 7, a                      ; Check sign bit
    jr z, .shoot_facing_right     ; vel_x >= 0, facing right

.shoot_facing_left:
    ; Shooter facing left - projectile velocity should be negative
    ld hl, entity_shoot_speed
    ld e, c                       ; Shooter index
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = shoot speed (positive)
    neg                           ; Negate to make it negative

    pop de                        ; DE = projectile index
    ld hl, entity_vel_x
    push de
    add hl, de
    ld (hl), a                    ; Set velocity X = -speed
    jr .shoot_vel_set

.shoot_facing_right:
    ; Shooter facing right - projectile velocity is positive
    ld hl, entity_shoot_speed
    ld e, c                       ; Shooter index
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = shoot speed (positive)

    pop de                        ; DE = projectile index
    ld hl, entity_vel_x
    push de
    add hl, de
    ld (hl), a                    ; Set velocity X = speed

.shoot_vel_set:

    ld hl, entity_vel_y
    pop de
    add hl, de
    ld (hl), 0                    ; Set velocity Y = 0 (horizontal)

    ; Set collision layer for player bullet (layer 4)
    ld hl, entity_collision_layer
    add hl, de
    ld (hl), 4                    ; Player bullet layer

    ; Set collides with mask (collides with enemies = layer 2)
    ld hl, entity_collides_with
    add hl, de
    ld (hl), 2                    ; Collides with enemies

    ; Set cooldown (15 frames @ 60fps ≈ 250ms)
    pop bc                        ; BC = shooter index
    ld hl, entity_shoot_cooldown
    ld e, c
    ld d, 0
    add hl, de
    ld (hl), 15

    pop de
    pop bc
    ret

.shoot_done:
    pop hl
    pop bc

.shoot_next_entity:
    dec b
    jp nz, .shoot_update_loop
    ret
    `}function On(){return`
    ; ==================================================================
    ; PLATFORM RIDING SYSTEM
    ; ==================================================================
    ; Detects when entities are standing on platforms and transfers velocity
    ;
    ; Platform detection: Entity A is on platform B if:
    ; - A's bottom edge is at or near B's top edge
    ; - A has horizontal overlap with B
    ; - B has collision_layer bit 3 set (platform layer = 8)
    ;
    ; Grace frames: 6 frames tolerance when leaving platform

init_platform_riding_system:
    ; Initialize platform IDs to 255 (no platform)
    ld hl, entity_platform_id
    ld de, entity_platform_id + 1
    ld bc, 31
    ld (hl), 255
    ldir

    ; Initialize grace frames to 0
    ld hl, entity_platform_grace
    ld de, entity_platform_grace + 1
    ld bc, 31
    ld (hl), 0
    ldir
    ret

prepare_platform_detection:
    ; PHASE 1 - Called BEFORE collision detection
    ; Clear platform references from previous frame
    ; Entities that were on platforms get grace frames
    ; Collision detection will reset platform_id if still in contact

    ld a, (active_entity_count)
    or a
    ret z
    ld b, a

    ld hl, active_entity_list
.platform_clear_loop:
    ld e, (hl)              ; E = entity index
    ld d, 0                 ; DE = entity index (16-bit offset)
    inc hl
    push hl
    push bc

    ; Check entity_platform_id[entity]
    ld hl, entity_platform_id
    add hl, de
    ld a, (hl)              ; A = platform_id
    cp 255                  ; Check if on a platform
    jr z, .platform_skip_clear ; Already no platform, skip

    ; Entity was on a platform last frame
    ; Set grace frames to 6 (coyote time for leaving platform)
    push hl                 ; Save entity_platform_id pointer
    ld hl, entity_platform_grace
    add hl, de
    ld a, 6
    ld (hl), a              ; Set grace frames
    pop hl                  ; Restore entity_platform_id pointer

    ; Clear platform reference (collision will reset if still touching)
    ld (hl), 255

.platform_skip_clear:
    pop bc
    pop hl
    djnz .platform_clear_loop
    ret

update_platform_riding:
    ; PHASE 2 - Called AFTER collision detection
    ; Decrement grace frames for entities not on platforms
    ; (Entities on platforms have grace=0, set by handle_entity_collision)

    ld a, (active_entity_count)
    or a
    ret z
    ld b, a

    ld hl, active_entity_list
.grace_loop:
    ld e, (hl)              ; E = entity index
    ld d, 0                 ; DE = entity index (16-bit offset)
    inc hl
    push hl
    push bc

    ; Check if entity has platform reference
    ld hl, entity_platform_id
    add hl, de
    ld a, (hl)              ; A = platform_id
    cp 255
    jr nz, .grace_skip      ; Has platform, skip grace decrement

    ; No platform - decrement grace frames if > 0
    ld hl, entity_platform_grace
    add hl, de
    ld a, (hl)              ; A = grace frames
    or a
    jr z, .grace_skip       ; Already 0, skip

    dec a                   ; Decrement grace
    ld (hl), a

.grace_skip:
    pop bc
    pop hl
    djnz .grace_loop
    ret
    `}function Un(){return`
    ; ==================================================================
        ; ANIMATION COMPONENT SYSTEM
    ; ==================================================================

        init_animation_system:
            ; Initialize animation component data
            ; Clear frames
            ld hl, entity_anim_frame
            ld de, entity_anim_frame+1
            ld bc, 31
            ld (hl), 0
            ldir

            ; Clear ticks
            ld hl, entity_anim_tick
            ld de, entity_anim_tick+1
            ld bc, 31
            ld (hl), 0
            ldir

            ; Default speed = ANIM_DEFAULT_SPEED
            ld hl, entity_anim_speed
            ld de, entity_anim_speed+1
            ld bc, 31
            ld (hl), ANIM_DEFAULT_SPEED
            ldir

            ; Default flags = playing + loop (loop cleared/set per-sprite by Action_ChangeSprite)
            ld hl, entity_anim_flags
            ld de, entity_anim_flags+1
            ld bc, 31
            ld (hl), ANIM_FLAG_PLAYING | ANIM_FLAG_LOOP
            ldir
            ret

        compute_entity_base_pattern:
            ; Input: DE = entity index
            ; Output: A = base pattern number for this entity's current frame
            ; Clobbers: AF, BC, HL
            ld a, SPRITE_PATTERN_PRELOAD_MODE
            or a
            jr z, .legacy_hw_pattern

            ld hl, entity_sprite_asset_index
            add hl, de
            ld a, (hl)
            cp #FF
            jr z, .placeholder_pattern
            cp SPRITE_ASSET_COUNT
            jr nc, .placeholder_pattern

            ld c, a
            ld b, 0
            ld hl, sprite_asset_base_pattern_slot_runtime
            add hl, bc
            ld a, (hl)                 ; A = base 16x16 pattern slot for this asset
            push af                    ; Save base slot before HL is reused

            ld hl, entity_anim_frame
            add hl, de
            ld c, (hl)                 ; C = current animation frame

            ld hl, entity_sprite_config
            add hl, de
            add hl, de
            inc hl
            ld b, (hl)                 ; B = entity layer count (frame stride)

            pop af                     ; A = base slot (restored)
            ld l, a                    ; L = base slot (ready for stride loop)
            ld a, c
            or a
            jr z, .slot_to_pattern

        .frame_stride_loop:
            ld a, l
            add a, b
            ld l, a
            dec c
            jr nz, .frame_stride_loop

        .slot_to_pattern:
            ld a, l
            add a, a
            add a, a
            ret

        .placeholder_pattern:
            ld a, (sprite_placeholder_base_pattern_num)
            ret

        .legacy_hw_pattern:
            ld hl, entity_sprite_config
            add hl, de
            add hl, de
            ld a, (hl)
            add a, a
            add a, a
            ret

        update_animation_component:
            ; Update animations for entities
            ; - Advances entity_anim_frame using entity_anim_tick/entity_anim_speed
            ; - In preload mode, sprite rendering picks the frame directly from SAT pattern indices
            ; - In fallback mode, copies the selected frame's patterns to VRAM for this entity
            ld a, (anim_entity_count)
            or a
            ret z
            ld b, a                    ; Loop animated render entities only
            ld hl, anim_entity_list

        .anim_loop:
            ld c, (hl)                 ; C = entity index
            inc hl                     ; Advance list pointer
            push hl                    ; Save list pointer
            ld e, c
            ld d, 0
            pop hl                     ; Restore list pointer
            ld a, (player_runtime_enabled)
            or a
            jp z, .anim_not_fast_player
            ld a, (player_entity_index)
            cp c
            jp z, .anim_next_entity
        .anim_not_fast_player:

            ; anim_entity_list already guarantees active + current_screen_id + animation + sprite

            push bc
            push hl

            ; Check flags (playing?)
            ld e, c
            ld d, 0
            ld hl, entity_anim_flags
            add hl, de
            ld a, (hl)
            bit 0, a
            jp z, anim_done_entity

            ; Only animate when moving?
            bit 2, a
            jr z, .tick

            ; vel_x != 0 || vel_y != 0
            ld hl, entity_vel_x
            add hl, de
            ld a, (hl)
            ld hl, entity_vel_y
            add hl, de
            or (hl)
            jp z, anim_done_entity

        .tick:
            ; ChangeSprite defers the frame sync to the next animation pass
            ; so sprite changes happen from the regular frame pipeline instead
            ; of mid-frame inside the state-machine action path.
            ld hl, entity_anim_flags
            add hl, de
            bit 4, (hl)
            jr z, .anim_tick_advance
            res 4, (hl)
            ld hl, entity_sprite_asset_index
            add hl, de
            ld a, (hl)
            cp #FF
            jp z, anim_done_entity
            cp SPRITE_ASSET_COUNT
            jp nc, anim_done_entity
            ld b, a                    ; B = sprite asset index for forced upload
            ld hl, entity_anim_frame
            add hl, de
            ld a, (hl)
            jp .anim_upload_frame

        .anim_tick_advance:
            ; tick++
            ld hl, entity_anim_tick
            add hl, de
            inc (hl)

            ; if tick < speed -> done
            ld a, (hl)
            ld hl, entity_anim_speed
            add hl, de
            cp (hl)
            jp c, anim_done_entity

            ; tick = 0
            ld hl, entity_anim_tick
            add hl, de
            ld (hl), 0

            ; Sprite asset index for this entity (#FF = none)
            ld hl, entity_sprite_asset_index
            add hl, de
            ld a, (hl)
            cp #FF
            jp z, anim_done_entity
            cp SPRITE_ASSET_COUNT
            jp nc, anim_done_entity
            ld b, a                    ; B = sprite asset index

            ; frameCount = sprite_asset_frame_count[B]
            ld hl, sprite_asset_frame_count
            ld e, b
            ld d, 0
            add hl, de
            ld a, (hl)                 ; A = frameCount
            cp 2
            jp c, anim_done_entity     ; 0/1 frames -> no animation
            push af                    ; Save frameCount on stack

            ; Advance frame (entity_anim_frame++)
            ld e, c
            ld d, 0
            ld hl, entity_anim_frame
            add hl, de
            ld a, (hl)                 ; A = current frame
            inc a                      ; A = next frame
            pop de                     ; D = frameCount (was pushed as A)
            push de                    ; Keep frameCount on stack for .clamp_last
            cp d                       ; Compare frame with frameCount
            jr c, .store_frame

            ; Overflow: loop?
            ld e, c
            ld d, 0
            ld hl, entity_anim_flags
            add hl, de
            bit 1, (hl)                ; loop flag
            jr z, .clamp_last
            xor a                      ; frame = 0
            jr .store_frame

        .clamp_last:
            pop de                     ; D = frameCount
            push de                    ; Keep balanced
            ld a, d
            dec a                      ; frame = frameCount-1
            push af                    ; Preserve clamped frame index

            ; Mark one-shot completion and stop playback for non-loop anim.
            ; State machine condition ANIMATION_COMPLETE consumes this flag.
            ld e, c
            ld d, 0
            ld hl, entity_anim_flags
            add hl, de
            set 3, (hl)                ; ANIM_FLAG_COMPLETED
            res 0, (hl)                ; clear ANIM_FLAG_PLAYING
            pop af

        .store_frame:
            pop de                     ; Clean stack (discard frameCount)
            ld e, c
            ld d, 0
            ld hl, entity_anim_frame
            add hl, de
            ld (hl), a                 ; store new frame index

        .anim_upload_frame:
            push af                    ; Preserve frame index
            ld a, SPRITE_PATTERN_PRELOAD_MODE
            or a
            jr z, .anim_upload_frame_fallback
            pop af
            jp anim_done_entity

        .anim_upload_frame_fallback:
            pop af

            ; Get pointer to this sprite asset's frame pointer list
            ld l, b
            ld h, 0
            add hl, hl                 ; index * 2
            ld de, sprite_asset_frame_ptr_table
            add hl, de
            ld e, (hl)
            inc hl
            ld d, (hl)
            ex de, hl                  ; HL = frame pointer list base

            ; HL = &frame_ptrs[frame]
            ld e, a
            ld d, 0
            add hl, de
            add hl, de                 ; + frame*2
            ld e, (hl)
            inc hl
            ld d, (hl)
            ex de, hl                  ; HL = source pattern data

            ; Get entity sprite config (base HW sprite + layer count)
            push hl                    ; save source
            ld e, c
            ld d, 0
            ld hl, entity_sprite_config
            add hl, de
            add hl, de                 ; entityIndex * 2
            ld a, (hl)                 ; base HW sprite
            inc hl
            ld c, (hl)                 ; layer count
            ld d, a                    ; D = base HW sprite (save)
            pop hl                     ; restore source

            ld a, c
            or a
            jp z, anim_done_entity     ; no layers for this entity

            ; BC = layerCount * 32
            ld a, c
            ld b, 0
            ld c, a
            sla c
            rl b
            sla c
            rl b
            sla c
            rl b
            sla c
            rl b
            sla c
            rl b

            ; DE = SPRPAT + baseHwSprite*32
            push hl                    ; save source
            ld a, d
            ld l, a
            ld h, 0
            add hl, hl
            add hl, hl
            add hl, hl
            add hl, hl
            add hl, hl                 ; HL = base * 32
            ld de, SPRPAT
            add hl, de
            ex de, hl                  ; DE = VRAM destination
            pop hl                     ; restore source

            call FAST_LDIRVM           ; copy pattern data to VRAM

anim_done_entity:
            pop hl
            pop bc

        .anim_next_entity:
            dec b
            jp nz, .anim_loop
    ret

refresh_player_animation_fastpath:
    ld a, (player_runtime_enabled)
    or a
    ret z
    ld a, (player_entity_index)
    cp #FF
    ret z
    ld c, a
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_ANIMATION | COMP_MASK_SPRITE
    cp COMP_MASK_ANIMATION | COMP_MASK_SPRITE
    ret nz

    ld a, (player_runtime_enabled)
    push af
    ld a, (anim_entity_count)
    push af
    ld a, (anim_entity_list)
    push af

    xor a
    ld (player_runtime_enabled), a
    ld a, c
    ld (anim_entity_list), a
    ld a, 1
    ld (anim_entity_count), a
    call update_animation_component

    pop af
    ld (anim_entity_list), a
    pop af
    ld (anim_entity_count), a
    pop af
    ld (player_runtime_enabled), a
    ret
    `}function $n(){return`
    ; ==================================================================
        ; JUMP COMPONENT SYSTEM
    ; ==================================================================

        init_jump_system:
            ; Initialize jump system
            ; Clear jump velocities (32 words = 64 bytes)
            ld hl, entity_jump_vel_y
            ld de, entity_jump_vel_y+1
            ld bc, 63
            ld (hl), 0
            ldir

            ; Clear jump counters
            ld hl, entity_jump_count
            ld de, entity_jump_count+1
            ld bc, 31
            ld (hl), 0
            ldir

            ; Clear temporary extra-jump charges granted by bonus pickups
            ld hl, entity_jump_bonus
            ld de, entity_jump_bonus+1
            ld bc, 31
            ld (hl), 0
            ldir

            ; Initialize configured max jumps (default: single jump)
            ld hl, entity_jump_max
            ld de, entity_jump_max+1
            ld bc, 31
            ld (hl), 1
            ldir

            ; Clear on-ground flags
            ld hl, entity_on_ground
            ld de, entity_on_ground+1
            ld bc, 31
            ld (hl), 0
            ldir
            ret

        update_jump_component:
            ; Update jump logic for entities
            ; Fire button edge triggers jump for entities with Jump+Input
            ; Uses: entity_jump_count, entity_jump_max, entity_jump_bonus, entity_on_ground, entity_gravity_vel
            ; Uses global input_btn_curr/input_btn_prev edge detection

            ld a, (active_entity_count)
            or a
            ret z
            ld b, a                       ; Loop used entities only
            ld hl, active_entity_list

        jump_update_loop:
            ld c, (hl)                    ; C = entity index
            inc hl                        ; Advance list pointer
            push hl                       ; Save list pointer
            ld a, (player_runtime_enabled)
            or a
            jp z, .jump_check_mask
            ld a, (player_entity_index)
            cp c
            jp z, .jump_skip_fast_player
        .jump_check_mask:
            ld e, c
            ld d, 0
            ld hl, entity_comp_masks_hi
            add hl, de
            ld a, (hl)
            pop hl                        ; Restore list pointer
            and #01                       ; Jump bit (COMP_MASK_JUMP=#0100 -> high byte bit0)
            jp z, jump_next_entity

            ; Require Input component
            push hl
            ld hl, entity_comp_masks
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            and COMP_MASK_INPUT
            pop hl
            jp z, jump_next_entity

            push bc
            push hl

            ; Ground detection is now handled by update_collision_component
            ; Just reset jump count if grounded
            ld e, c
            ld d, 0
            ld hl, entity_on_ground
            add hl, de
            bit 0, (hl)                   ; Check if on ground
            jr z, .jump_check             ; Not grounded, skip reset

            ; Entity is grounded - reset jump count
            ld hl, entity_jump_count
            add hl, de
            ld (hl), 0

            ; Landing also clears any unused extra-jump bonus.
            ld hl, entity_jump_bonus
            add hl, de
            ld (hl), 0

        .jump_check:
            ; --- Jump trigger edge (fire pressed now, not pressed previous frame) ---
            ld a, (input_btn_curr)
            and INPUT_BTN_FIRE
            jp z, jump_done_entity        ; not pressed
            ld a, (input_btn_prev)
            and INPUT_BTN_FIRE
            jp nz, jump_done_entity       ; already held last frame

            ; Check jump count < configured max OR grounded
            ld hl, entity_jump_count
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            ld hl, entity_jump_max
            ld e, c
            ld d, 0
            add hl, de
            ld b, (hl)
            ld hl, entity_jump_bonus
            add hl, de
            ld d, (hl)
            ld a, b
            add a, d
            ld b, a
            ld hl, entity_jump_count
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            cp b
            jr c, .do_jump

            ld hl, entity_on_ground
            add hl, de
            bit 0, (hl)
            jp z, jump_done_entity

        .do_jump:
            ; Consume one bonus jump only when performing an airborne jump
            ; beyond the entity's base maxJumps.
            ld hl, entity_on_ground
            add hl, de
            bit 0, (hl)
            jr nz, .skip_bonus_consume

            ld hl, entity_jump_count
            add hl, de
            ld a, (hl)
            ld hl, entity_jump_max
            add hl, de
            cp (hl)
            jr c, .skip_bonus_consume

            ld hl, entity_jump_bonus
            add hl, de
            ld a, (hl)
            or a
            jr z, .skip_bonus_consume
            dec (hl)

        .skip_bonus_consume:
            ; jump_count++
            ld hl, entity_jump_count
            add hl, de
            inc (hl)

            ; clear grounded
            ld hl, entity_on_ground
            add hl, de
            res 0, (hl)

            ; clear platform reference (prevent infinite jumps)
            ld hl, entity_platform_id
            add hl, de
            ld (hl), 255

            ; If entity has Gravity, set gravity velocity to negative jump impulse
            ; Jump impulse: -1024 (8.8 fixed) => #FC00 (~4 tiles height with gravity #40)
            ld hl, entity_comp_masks_hi
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            and #02                       ; Gravity bit (COMP_MASK_GRAVITY=#0200 -> high byte bit1)
            jp z, jump_done_entity

            ld hl, entity_gravity_vel
            ld e, c
            ld d, 0
            add hl, de
            add hl, de                    ; word index
            ld (hl), #00                  ; low byte
            inc hl
            ld (hl), #FC                  ; high byte (negative)

jump_done_entity:
            pop hl
            pop bc
            jp jump_next_entity

        .jump_skip_fast_player:
            pop hl

        jump_next_entity:
            dec b
            jp nz, jump_update_loop
    ret
    `}function Bn(){return`
    ; ==================================================================
    ; AUTO-DESTROY COMPONENT SYSTEM
    ; ==================================================================
    ; Entities with AUTO_DESTROY component have a lifetime counter
    ; When lifetime reaches 0, entity is automatically destroyed
    ; Useful for: projectiles and other temporary effects.

init_auto_destroy_system:
    ; Initialize all lifetimes to 0 (infinite by default)
    ld hl, entity_lifetime
    ld de, entity_lifetime+1
    ld bc, 31
    ld (hl), 0
    ldir
    ret

update_auto_destroy_component:
    ; Update lifetime counters and destroy entities when expired
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a                       ; Loop used entities only
    ld hl, active_entity_list

    auto_destroy_loop:
        ld c, (hl)                    ; C = entity index
        inc hl                        ; Advance list pointer
        push hl                       ; Save list pointer
        ld e, c
        ld d, 0
        ld hl, entity_comp_masks_hi
        add hl, de
        ld a, (hl)
        pop hl                        ; Restore list pointer
        and #04                       ; AUTO_DESTROY bit (COMP_MASK_AUTO_DESTROY=#0400 -> high byte bit2)
        jr z, auto_destroy_next

        ; Entity has auto-destroy component
        push bc
        push hl

        ; Get lifetime for this entity
        ld e, c                       ; Entity index
        ld d, 0
        ld hl, entity_lifetime
        add hl, de
        ld a, (hl)                    ; A = lifetime

        ; Check if lifetime is 0 (infinite) or > 0
        or a
        jr z, auto_destroy_done       ; 0 = infinite lifetime, skip

        ; Decrement lifetime
        dec a
        ld (hl), a                    ; Store decremented value

        ; Check if lifetime reached 0
        or a
        jr nz, auto_destroy_done      ; Still alive

        ; Lifetime expired - destroy entity
        ; Clear component masks (deactivates entity)
        ld hl, entity_comp_masks
        ld e, c
        ld d, 0
        add hl, de
        ld (hl), 0                    ; Clear low byte

        ld hl, entity_comp_masks_hi
        add hl, de
        ld (hl), 0                    ; Clear high byte
        ld hl, active_entity_list_dirty
        ld (hl), 1

        ; Move entity off-screen
        ld hl, entity_x_pos
        add hl, de
        ld (hl), 255                  ; X = off-screen

        ld hl, entity_y_pos
        add hl, de
        ld (hl), 212                  ; Y = below screen (192 + 20)

auto_destroy_done:
        pop hl
        pop bc

auto_destroy_next:
        dec b
        jp nz, auto_destroy_loop
        ret
    `}function Fn(){return`
    ; ==================================================================
    ; CURSORS COMPONENT SYSTEM
    ; ==================================================================
    ; NOTE:
    ; This system is intentionally disabled in runtime gameplay.
    ; Directional movement is already handled by update_input_component.
    ; Keeping cursor movement here causes double movement/jitter.

init_cursors_system:
    ; No initialization needed
    ret

; ------------------------------------------------------------------
; update_cursors_component
; Disabled no-op (reserved for future menu-only cursor implementation)
; ------------------------------------------------------------------
update_cursors_component:
    ret
    `}function jn(){return`
    ; ==================================================================
    ; CARRY COMPONENT SYSTEM
    ; ==================================================================
    ; Allows entities to "carry" other entities
    ; Carried entities follow the carrier's position with offset
    ; Variables: entity_carried_by (ID of carrier, 255=none)

init_carry_system:
    ; Initialize all entities as not carried
    ld hl, entity_carried_by
    ld de, entity_carried_by+1
    ld bc, 31
    ld (hl), 255                  ; 255 = not carried
    ldir
    ret

; ------------------------------------------------------------------
; update_carry_component
; Update positions of carried entities to follow carrier
; ------------------------------------------------------------------
update_carry_component:
    ld c, 0                       ; Entity index

.carry_loop:
    ld a, c
    cp MAX_ENTITIES
    ret z

    ; Check if this entity is being carried
    ld hl, entity_carried_by
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = carrier ID
    cp 255
    jr z, .carry_next             ; Not being carried

    ; Entity is being carried - get carrier position
    ld b, a                       ; B = carrier ID
    push bc

    ; Get carrier X position
    ld e, b
    ld d, 0
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)                    ; A = carrier X

    ; Set carried entity X position (same as carrier)
    pop bc
    push bc
    ld e, c
    ld d, 0
    ld hl, entity_x_pos
    add hl, de
    ld (hl), a

    ; Get carrier Y position
    pop bc
    push bc
    ld e, b
    ld d, 0
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)                    ; A = carrier Y
    sub 16                        ; Offset: carried item above carrier

    ; Set carried entity Y position
    pop bc
    ld e, c
    ld d, 0
    ld hl, entity_y_pos
    add hl, de
    ld (hl), a

.carry_next:
    inc c
    jr .carry_loop
    `}function zn(e="simple32k"){return`
    ; ==================================================================
    ; WALL COLLISION COMPONENT SYSTEM
    ; ==================================================================
    ; Prevents entities from moving through walls
    ; Uses per-entity hitbox (offset + width/height)
    ; Snaps entity position to wall edge AND zeros velocity

init_wallcollision_system:
    ret

; ------------------------------------------------------------------
; wall_behavior_is_full_blocker
; Input:  A = behavior byte or family bits
; Output: Z = passable / top-solid platform, NZ = full blocker
; Clobbers: AF
; Notes:
;   - familyId 2 (#20) is treated as one-way/top-solid, so it must not
;     block horizontal motion or upward motion.
; ------------------------------------------------------------------
wall_behavior_is_full_blocker:
    and #F0
    ret z
    cp #20
    ret z
    or a
    ret

; ------------------------------------------------------------------
; wall_down_behavior_blocks
; Input:
;   - A  = behavior byte or family bits from get_behavior_tile
;   - B  = tile row of the floor probe
;   - DE = entity index
; Output:
;   - Z  = passable
;   - NZ = blocks downward movement / supports standing
; Clobbers: AF, C, HL
; Preserved: B, DE
; Notes:
;   - familyId 2 (#20) is top-solid: it only blocks when the entity was
;     already above the tile before this frame's vertical movement.
;   - update_position_component already applied vel_y before WallCollision,
;     so previous_bottom = wall_hit_bottom - entity_vel_y.
; ------------------------------------------------------------------
wall_down_behavior_blocks:
    and #F0
    ret z
    cp #20
    jr z, .platform_check
    or a
    ret

.platform_check:
    push bc
    push hl
    ld a, b
    add a, a
    add a, a
    add a, a                      ; A = tileTop = row * 8
    add a, 2
    ld c, a                       ; C = tileTop + tolerance
    ld a, (wall_hit_bottom)
    ld hl, entity_vel_y
    add hl, de
    sub (hl)                      ; previous_bottom = current_bottom - vel_y
    cp c
    pop hl
    pop bc
    jr c, .platform_blocks
    jr z, .platform_blocks
    xor a
    ret

.platform_blocks:
    ld a, 1
    ret

; ------------------------------------------------------------------
; update_wallcollision_component
; ------------------------------------------------------------------
; Check wall collisions and prevent movement through solid tiles.
; Uses behavior map (current_behavior_map) for collision detection.
; Entity position is cached in wall_temp_x/y and converted to hitbox bounds.
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Iterate all entity slots; for each active entity with
;            WallCollision eligibility, probe solid tiles in movement
;            direction(s) and snap position + zero velocity on hit.
;   Inputs:
;     - entity_active[]         : 1 = entity exists
;     - active_entity_list[] / active_entity_count : compact active list already current
;     - entity_comp_masks[]     : low byte component bitmask
;     - entity_comp_masks_hi[]  : high byte (COMP_MASK_GRAVITY at bit 1)
;     - entity_collides_with[]  : must include COLLISION_LAYER_PLATFORM (#08)
;     - entity_x_pos/y_pos[]    : world position
;     - entity_vel_x/vel_y[]    : signed 8-bit velocity (negative = left/up)
;     - entity_gravity_vel[]    : 16-bit signed gravity accumulator (word)
;     - entity_collision_offset_x/y[]: signed offset from origin to hitbox corner
;     - entity_collision_hitbox_w/h[]: hitbox size (minimum 1 if zero)
;     - current_behavior_map    : pointer to active screen behavior map
;   Outputs:
;     - entity_x_pos/y_pos[]    : snapped on collision
;     - entity_vel_x/vel_y[]    : zeroed on collision axis
;     - entity_gravity_vel[]    : zeroed on vertical collision
;     - entity_on_ground[]      : bit 0 set=floor, cleared at loop start
;     - entity_wall_collision_flags[]: bits 0=UP,1=DOWN,2=LEFT,3=RIGHT
;   Clobbers: AF, BC, DE, HL
;   Preserved: (none — uses scratch RAM wall_temp_x/y, wall_hit_*, wall_probe_*)
;   Notes:
;     - Opt-B: loop uses active_entity_list (entities guaranteed active + on screen).
;       Eliminates ~29 wasted iterations vs 0..MAX_ENTITIES scan (3 entities active).
;     - Caller must refresh active_entity_list earlier in the frame.
;     - Opt-C: wall_build_hitbox_cache is skipped on DOWN snap when new Y == current Y
;       (entity already on floor). Saves ~200 cycles/entity/frame when standing still.
;     - wall_build_hitbox_cache is called once at entity entry, and after each snap
;       where the position actually changes.
;     - Gravity floor check (.check_wall_y_gravity) runs even when vel_y=0
;       so entity_on_ground stays accurate when entity is standing still.
; ------------------------------------------------------------------
update_wallcollision_component:
    ; update_all_entities refreshed active_entity_list before entering the
    ; component chain, so we can consume it directly here.
    ld a, (collision_entity_count)
    or a
    ret z                         ; no active entities → done
    ld b, a                       ; B = entity count (loop counter for djnz)
    ld hl, collision_entity_list

.wall_loop:
    ; ---- Load next entity index from compact list ----
    ld e, (hl)                    ; E = entity index
    ld d, 0                       ; DE = entity index (word)
    push hl                       ; save list pointer (clobbered by hl arithmetic below)
    push bc                       ; save loop counter

    ; --- Filter A: entity must have Collision component ---
    ; (entity_active and entity_screen_id are implicit via active_entity_list)
    ; Hitbox data lives in Collision arrays; no Collision = no valid hitbox.
    ; Opt-D: read comp_masks into B (B is free — loop counter saved on stack above).
    ; B holds comp_masks for Filter C reuse, eliminating a second memory read.
    ld hl, entity_comp_masks
    add hl, de
    ld b, (hl)                    ; B = comp_masks[E] (safe: loop ctr on stack)
    ld a, b
    and COMP_MASK_COLLISION       ; low byte, bit 3
    jp z, .wall_next

    ; --- Filter B: entity must collide with the Platform layer ---
    ; entity_collides_with is a bitmask; COLLISION_LAYER_PLATFORM (#08) = map tiles.
    ld hl, entity_collides_with
    add hl, de
    ld a, (hl)
    and COLLISION_LAYER_PLATFORM
    jp z, .wall_next

    ; --- Filter C: entity must be moveable (Input or Movement component) ---
    ; Static entities (platforms, decorations) have no velocity to correct.
    ; Opt-D: reuse comp_masks from B — no extra ld hl/add hl,de/ld a,(hl) needed (saves 28 cycles/entity).
    ld a, b
    and COMP_MASK_MOVEMENT | COMP_MASK_INPUT
    jp z, .wall_next

    ; ---- Entity passed all filters — cache its position ----
    ; wall_temp_x/y are scratch RAM used by wall_build_hitbox_cache and
    ; the snap routines to avoid repeated indexed array lookups.
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld (wall_temp_x), a          ; scratch X = entity_x_pos[E]
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld (wall_temp_y), a          ; scratch Y = entity_y_pos[E]

    ; Clear on_ground flag - will be re-set by .wall_down_blocked if floor found
    ; This ensures entity correctly detects walking off platform edges
    ld hl, entity_wall_collision_flags
    add hl, de                        ; DE still = entity index from above
    ld (hl), 0                        ; Clear directional wall flags

    ld hl, entity_on_ground
    add hl, de                        ; DE still = entity index from above
    res 0, (hl)

    ; Build initial hitbox cache for this entity.
    call wall_build_hitbox_cache

    ; ---- CHECK HORIZONTAL VELOCITY ----
    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    or a
    jp z, .check_wall_y           ; No X velocity, check Y

    bit 7, a
    jp z, .wall_check_right

.wall_check_left:
    ; Moving left - probe one pixel before hitbox left edge
    ld a, (wall_hit_left)
    or a
    jp z, .check_wall_y           ; already at left boundary
    sub 1
    srl a
    srl a
    srl a                         ; Column = (left-1) / 8
    ld c, a

    ; Check point 1: adaptive top probe (safe for small hitboxes)
    ld a, (wall_probe_top)
    srl a
    srl a
    srl a
    ld b, a                       ; Row = top / 8
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jp nz, .wall_left_blocked

    ; Check point 2: adaptive bottom probe (safe for small hitboxes)
    ; probe_bottom = hitbox_bottom - inset ≤ 191 → row ≤ 23, col = (left-1)/8 ≤ 31 → NB safe
    ld a, (wall_probe_bottom)
    srl a
    srl a
    srl a
    ld b, a                       ; Row = bottom / 8
    call get_behavior_tile_nb
    call wall_behavior_is_full_blocker
    jp z, .check_wall_y           ; Both passable

.wall_left_blocked:
    ; ---------------------------------------------------------------
    ; Snap formula (LEFT wall):
    ;   C = tile column that blocked us (from (left-1)/8 probe)
    ;   new_hitbox_left = (C + 1) * 8   → first pixel right of the wall
    ;   entity_x = new_hitbox_left - collision_offset_x
    ;              (wall_sub_signed_offset_clamped reverses the offset)
    ; After snap: vel_x = 0, entity_wall_collision_flags bit 2 (LEFT) set.
    ; ---------------------------------------------------------------
    ld a, c
    inc a
    add a, a
    add a, a
    add a, a                      ; A = (C+1)*8 = new hitbox left pixel
    push af                       ; save new hitbox left
    ld hl, entity_collision_offset_x
    add hl, de
    pop af
    call wall_sub_signed_offset_clamped ; A = entity_x = new_left - offset_x
    ld (wall_temp_x), a           ; update position cache
    push af
    ld hl, entity_x_pos
    add hl, de
    pop af
    ld (hl), a                    ; write snapped entity X to RAM
    call wall_build_hitbox_cache  ; recalculate hitbox after position change

    ; Cancel leftward velocity and flag the collision
    ld hl, entity_vel_x
    add hl, de
    ld (hl), 0
    ld hl, entity_wall_collision_flags
    add hl, de
    set 2, (hl)                       ; bit 2 = LEFT wall collision
    jp .check_wall_y

.wall_check_right:
    ; Moving right - probe one pixel after hitbox right edge
    ld a, (wall_hit_right)
    inc a
    jp z, .check_wall_y           ; overflow (right==255), skip
    srl a
    srl a
    srl a                         ; Column = (X+16) / 8
    ld c, a

    ; Check point 1: adaptive top probe (safe for small hitboxes)
    ld a, (wall_probe_top)
    srl a
    srl a
    srl a
    ld b, a                       ; Row = top / 8
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jp nz, .wall_right_blocked

    ; Check point 2: adaptive bottom probe (safe for small hitboxes)
    ; probe_bottom ≤ 191 → row ≤ 23, col = (right+1)/8 ≤ 31 → NB safe
    ld a, (wall_probe_bottom)
    srl a
    srl a
    srl a
    ld b, a                       ; Row = bottom / 8
    call get_behavior_tile_nb
    call wall_behavior_is_full_blocker
    jp z, .check_wall_y           ; Both passable

.wall_right_blocked:
    ; ---------------------------------------------------------------
    ; Snap formula (RIGHT wall):
    ;   C = tile column that blocked us (from (right+1)/8 probe)
    ;   wall_left_of_tile = C * 8           → left pixel of blocking tile
    ;   new_hitbox_left   = C*8 - hitbox_w  → push entity left so right edge
    ;                                         just touches the tile's left side
    ;   If underflow (hitbox_w > C*8): clamp new_hitbox_left to 0.
    ;   entity_x = new_hitbox_left - collision_offset_x
    ; After snap: vel_x = 0, entity_wall_collision_flags bit 3 (RIGHT) set.
    ; ---------------------------------------------------------------
    ld a, c
    add a, a
    add a, a
    add a, a                      ; A = C * 8 = left pixel of blocking tile
    ld b, a                       ; B = C*8
    ld a, (wall_hit_w)
    ld c, a                       ; C = hitbox width
    ld a, b
    sub c                         ; A = C*8 - hitbox_w = new hitbox left
    jr nc, .wall_right_left_ok
    xor a                         ; underflow: clamp to 0
.wall_right_left_ok:
    push af                       ; save new hitbox left
    ld hl, entity_collision_offset_x
    add hl, de
    pop af
    call wall_sub_signed_offset_clamped ; A = entity_x = new_left - offset_x
    ld (wall_temp_x), a           ; update position cache
    push af
    ld hl, entity_x_pos
    add hl, de
    pop af
    ld (hl), a                    ; write snapped entity X to RAM
    call wall_build_hitbox_cache  ; recalculate hitbox after position change

    ; Cancel rightward velocity and flag the collision
    ld hl, entity_vel_x
    add hl, de
    ld (hl), 0
    ld hl, entity_wall_collision_flags
    add hl, de
    set 3, (hl)                       ; bit 3 = RIGHT wall collision

.check_wall_y:
    ; ---- CHECK VERTICAL VELOCITY ----
    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)
    or a
    jp z, .check_wall_y_gravity   ; vel_y=0, but check floor for gravity entities

    bit 7, a
    jp z, .wall_check_down

.wall_check_up:
    ; Moving up - probe one pixel above hitbox top edge
    ld a, (wall_hit_top)
    or a
    jp z, .wall_up_top_edge       ; top=0, clamp + stop upward velocity
    sub 1
    srl a
    srl a
    srl a
    ld b, a                       ; Row = (top-1) / 8

    ; Check point 1: adaptive left probe (safe for small hitboxes)
    ; NOTE: uses get_behavior_tile (with bounds) — entity_y can wrap off-screen,
    ; making B = (top-1)/8 > 23 (e.g. top=252 → row=31). Bounds check returns 0.
    ld a, (wall_probe_left)
    srl a
    srl a
    srl a
    ld c, a                       ; Column = left / 8
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jp nz, .wall_up_blocked

    ; Check point 2: adaptive right probe (safe for small hitboxes)
    ld a, (wall_probe_right)
    srl a
    srl a
    srl a
    ld c, a                       ; Column = right / 8
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jp z, .wall_next              ; Both passable

.wall_up_top_edge:
    ; ---------------------------------------------------------------
    ; Screen top boundary clamp (wall_hit_top == 0, no tile above row 0).
    ; This path is entered when wall_hit_left == 0 (entity already at top
    ; screen boundary) or when the UP probe is at row -1 (invalid).
    ; Sanity guard: only snap if entity_y < 24 (i.e. truly near the top).
    ; If entity_y >= 24, the "top=0" probe is a false positive — just
    ; cancel velocity via .wall_up_cancel_only without moving entity.
    ; new_hitbox_top = 0, entity_y = 0 - offset_y (clamped).
    ; ---------------------------------------------------------------
    ld a, (wall_temp_y)
    cp 24
    jp nc, .wall_up_cancel_only
    xor a
    push af                       ; keep new hitbox top
    ld hl, entity_collision_offset_y
    add hl, de
    pop af
    call wall_sub_signed_offset_clamped
    ld (wall_temp_y), a
    push af
    ld hl, entity_y_pos
    add hl, de
    pop af
    ld (hl), a                    ; Clamp entity Y to top boundary
    call wall_build_hitbox_cache  ; Refresh hitbox cache after snap

    ; Zero Y velocity
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0

    ; Also zero gravity_vel to stop upward momentum at top edge
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de                        ; word index
    ld (hl), 0
    inc hl
    ld (hl), 0
    ld hl, entity_wall_collision_flags
    add hl, de
    set 0, (hl)                       ; UP wall collision
    jp .wall_next

.wall_up_blocked:
    ; ---------------------------------------------------------------
    ; Snap formula (UP / ceiling):
    ;   B = tile row that blocked us (from (top-1)/8 probe)
    ;   new_hitbox_top = (B + 1) * 8  → first pixel below the ceiling tile
    ;   Safety guard: if new_top < current wall_hit_top, the snap would
    ;   push us further into the ceiling (sub-pixel rounding artefact).
    ;   In that case, fall through to .wall_up_cancel_only to just
    ;   cancel velocity without moving the entity.
    ;   entity_y = new_hitbox_top - collision_offset_y
    ; After snap: vel_y = 0, gravity_vel = 0, wall_collision_flags bit 0 (UP) set.
    ; ---------------------------------------------------------------
    ld a, b
    inc a
    add a, a
    add a, a
    add a, a                      ; A = (B+1)*8 = new hitbox top pixel
    ; Guard: new_top must be >= current hitbox top (no upward nudge)
    ld c, a
    ld hl, wall_hit_top
    ld a, c
    cp (hl)                       ; new_top < current_top? → carry set
    jp c, .wall_up_cancel_only    ; invalid snap: only cancel momentum
    ld a, c
    push af                       ; save new hitbox top
    ld hl, entity_collision_offset_y
    add hl, de
    pop af
    call wall_sub_signed_offset_clamped ; A = entity_y = new_top - offset_y
    ld (wall_temp_y), a           ; update position cache
    push af
    ld hl, entity_y_pos
    add hl, de
    pop af
    ld (hl), a                    ; write snapped entity Y to RAM
    call wall_build_hitbox_cache  ; recalculate hitbox after position change

    ; Cancel upward velocity and gravity accumulator
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0

    ; gravity_vel is 16-bit (word array): DE*2 offset
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de                        ; word index (2 bytes per entity)
    ld (hl), 0
    inc hl
    ld (hl), 0
    ld hl, entity_wall_collision_flags
    add hl, de
    set 0, (hl)                       ; bit 0 = UP wall collision
    jp .wall_next

.wall_up_cancel_only:
    ; ---------------------------------------------------------------
    ; Defensive path: snap would move entity upward (invalid) or
    ; entity is far from the screen top boundary.
    ; Keep current Y position, but cancel upward momentum this frame.
    ; ---------------------------------------------------------------
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0

    ld hl, entity_gravity_vel
    add hl, de
    add hl, de                        ; word index
    ld (hl), 0
    inc hl
    ld (hl), 0
    ld hl, entity_wall_collision_flags
    add hl, de
    set 0, (hl)                       ; UP wall collision
    jp .wall_next

.wall_check_down:
    ; Moving down - probe one pixel below hitbox bottom edge
    ld a, (wall_hit_bottom)
    inc a
    jp z, .wall_next              ; overflow (bottom==255), skip
    srl a
    srl a
    srl a
    ld b, a                       ; Row = (bottom+1) / 8

    ; Check point 1: adaptive left probe (safe for small hitboxes)
    ld a, (wall_probe_left)
    srl a
    srl a
    srl a
    ld c, a                       ; Column = left / 8
    call get_behavior_tile
    call wall_down_behavior_blocks
    jp nz, .wall_down_blocked

    ; Check point 2: adaptive right probe (safe for small hitboxes)
    ld a, (wall_probe_right)
    srl a
    srl a
    srl a
    ld c, a                       ; Column = right / 8
    call get_behavior_tile
    call wall_down_behavior_blocks
    jp z, .wall_next              ; Both passable

.wall_down_blocked:
    ; ---------------------------------------------------------------
    ; Snap formula (DOWN / floor):
    ;   B = tile row that blocked us (from (bottom+1)/8 probe)
    ;   floor_top_pixel  = B * 8          → top pixel of the floor tile
    ;   new_hitbox_top   = B*8 - hitbox_h → push entity up so bottom edge
    ;                                       just sits on the floor surface
    ;   If underflow (hitbox_h > B*8): clamp new_hitbox_top to 0.
    ;   entity_y = new_hitbox_top - collision_offset_y
    ; After snap: vel_y = 0, gravity_vel = 0, entity_on_ground bit 0 set,
    ;             entity_wall_collision_flags bit 1 (DOWN) set.
    ; Note: jp .wall_next skips .check_wall_y_gravity intentionally —
    ;       floor already detected; no redundant gravity probe needed.
    ; ---------------------------------------------------------------
    ld a, b
    add a, a
    add a, a
    add a, a                      ; A = B*8 = top pixel of floor tile
    ld b, a                       ; B = floor_top_pixel
    ld a, (wall_hit_h)
    ld c, a                       ; C = hitbox height
    ld a, b
    sub c                         ; A = B*8 - hitbox_h = new hitbox top
    jr nc, .wall_down_top_ok
    xor a                         ; underflow: clamp to 0
.wall_down_top_ok:
    push af                       ; save new hitbox top
    ld hl, entity_collision_offset_y
    add hl, de
    pop af
    call wall_sub_signed_offset_clamped ; A = entity_y = new_top - offset_y
    ld (wall_temp_y), a           ; update position cache
    push af
    ld hl, entity_y_pos
    add hl, de
    pop af
    ; Opt-C: skip rebuild if new Y == current Y (entity already on floor).
    ; Saves ~200 cycles/frame for standing-still entities (most common state).
    ; Falls through to normal snap path on actual position change (e.g. landing).
    cp (hl)
    jp z, .wall_down_at_floor     ; position unchanged → hitbox still valid
    ld (hl), a                    ; write snapped entity Y to RAM
    call wall_build_hitbox_cache  ; recalculate hitbox after position change
.wall_down_at_floor:
    ; Cancel downward velocity and gravity accumulator (landing)
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0

    ; gravity_vel is 16-bit (word array): DE*2 offset
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de                        ; word index (2 bytes per entity)
    ld (hl), 0
    inc hl
    ld (hl), 0

    ; Mark entity as on-ground and flag DOWN wall collision
    ld hl, entity_on_ground
    add hl, de
    set 0, (hl)                       ; bit 0 = standing on solid floor
    ld hl, entity_wall_collision_flags
    add hl, de
    set 1, (hl)                       ; bit 1 = DOWN wall collision
    jp .wall_next                     ; floor handled; skip gravity floor check

.check_wall_y_gravity:
    ; ---------------------------------------------------------------
    ; vel_y == 0, but gravity entities still need a floor probe every
    ; frame to keep entity_on_ground accurate (e.g. entity walks off
    ; a platform edge — vel_y is 0 at that instant but the flag must
    ; be cleared promptly so the gravity system can accelerate it).
    ; Only enter .wall_check_down if entity has COMP_MASK_GRAVITY
    ; (stored in entity_comp_masks_hi bit 1).
    ; Non-gravity entities: skip vertical check entirely.
    ; ---------------------------------------------------------------
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #02                       ; COMP_MASK_GRAVITY high byte bit 1
    jp nz, .wall_check_down       ; gravity entity → check floor
    ; No gravity component → no vertical wall check needed
.wall_next:
    ; Opt-B: restore list pointer and count, advance to next entity.
    ; NOTE: djnz range is ±127 bytes — wall_loop body is too large.
    ; Use dec b / jp nz instead (jp supports any distance).
    pop bc
    pop hl
    inc hl                        ; next entry in active_entity_list
    dec b
    jp nz, .wall_loop
    ret

; ------------------------------------------------------------------
; wall_build_hitbox_cache
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Compute and cache hitbox AABB and adaptive probe coordinates
;            from entity position (wall_temp_x/y) plus collision offsets/sizes.
;   Inputs:
;     - DE                        = entity index (used to index per-entity arrays)
;     - wall_temp_x               = cached entity X origin (set before calling)
;     - wall_temp_y               = cached entity Y origin (set before calling)
;     - entity_collision_hitbox_w[DE]: hitbox width  (0 treated as 1)
;     - entity_collision_hitbox_h[DE]: hitbox height (0 treated as 1)
;     - entity_collision_offset_x[DE]: signed X offset from entity origin to hitbox left
;     - entity_collision_offset_y[DE]: signed Y offset from entity origin to hitbox top
;   Outputs:
;     - wall_hit_left   = hitbox left  pixel (entity_x + offset_x, clamped 0..255)
;     - wall_hit_top    = hitbox top   pixel (entity_y + offset_y, clamped 0..255)
;     - wall_hit_right  = left + (w-1), clamped 0..255
;     - wall_hit_bottom = top  + (h-1), clamped 0..255
;     - wall_hit_w      = effective width  (>= 1)
;     - wall_hit_h      = effective height (>= 1)
;     - wall_probe_left / wall_probe_right : X probes (inset up to 2px from sides)
;     - wall_probe_top  / wall_probe_bottom: Y probes (inset up to 2px from top/bottom)
;   Clobbers: AF, BC, HL
;   Preserved: DE (entity index is never modified)
;   Notes:
;     - Adaptive inset: min(2, floor((right-left)/2)) and min(2, floor((bottom-top)/2)).
;       Prevents corner-only probes for entities smaller than 4 pixels on an axis.
;     - Call wall_add_signed_offset_clamped for offset application.
;     - Called once at entity loop entry; called again after every position snap.
; ------------------------------------------------------------------
wall_build_hitbox_cache:
    ; Width (minimum 1)
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld a, (hl)
    or a
    jr nz, .wbhc_w_ok
    ld a, 1
.wbhc_w_ok:
    ld (wall_hit_w), a

    ; Height (minimum 1)
    ld hl, entity_collision_hitbox_h
    add hl, de
    ld a, (hl)
    or a
    jr nz, .wbhc_h_ok
    ld a, 1
.wbhc_h_ok:
    ld (wall_hit_h), a

    ; left = entity_x + offset_x (signed, clamped)
    ld a, (wall_temp_x)
    ld hl, entity_collision_offset_x
    add hl, de
    call wall_add_signed_offset_clamped
    ld (wall_hit_left), a

    ; top = entity_y + offset_y (signed, clamped)
    ld a, (wall_temp_y)
    ld hl, entity_collision_offset_y
    add hl, de
    call wall_add_signed_offset_clamped
    ld (wall_hit_top), a

    ; right = left + (w-1), clamped
    ld a, (wall_hit_w)
    dec a
    ld b, a
    ld a, (wall_hit_left)
    add a, b
    jr nc, .wbhc_right_ok
    ld a, 255
.wbhc_right_ok:
    ld (wall_hit_right), a

    ; bottom = top + (h-1), clamped
    ld a, (wall_hit_h)
    dec a
    ld b, a
    ld a, (wall_hit_top)
    add a, b
    jr nc, .wbhc_bottom_ok
    ld a, 255
.wbhc_bottom_ok:
    ld (wall_hit_bottom), a

    ; ---- Adaptive X probes: inset = min(2, floor((right-left)/2)) ----
    ; Purpose: avoid probing the exact corner pixels for small sprites.
    ; For a 16px-wide entity: inset = min(2, 8) = 2.
    ;   probe_left  = left  + 2  (2px inside left edge)
    ;   probe_right = right - 2  (2px inside right edge)
    ; For a 4px-wide entity: inset = min(2, 2) = 2 (probes overlap at center).
    ; For a 2px-wide entity: inset = min(2, 1) = 1.
    ld a, (wall_hit_left)
    ld c, a                       ; C = left pixel
    ld a, (wall_hit_right)
    sub c                         ; A = width span (right - left)
    srl a                         ; A = span / 2
    cp 3                          ; is span/2 < 3 (i.e. inset < 2)?
    jr c, .wbhc_inset_x_ready    ; yes: use as-is
    ld a, 2                       ; no: cap inset at 2
.wbhc_inset_x_ready:
    ld b, a                       ; B = inset value
    ld a, c
    add a, b
    ld (wall_probe_left), a       ; probe_left  = left  + inset
    ld a, (wall_hit_right)
    sub b
    ld (wall_probe_right), a      ; probe_right = right - inset

    ; ---- Adaptive Y probes: inset = min(2, floor((bottom-top)/2)) ----
    ; Same logic on Y axis.
    ;   probe_top    = top    + inset
    ;   probe_bottom = bottom - inset
    ld a, (wall_hit_top)
    ld c, a                       ; C = top pixel
    ld a, (wall_hit_bottom)
    sub c                         ; A = height span (bottom - top)
    srl a                         ; A = span / 2
    cp 3
    jr c, .wbhc_inset_y_ready
    ld a, 2
.wbhc_inset_y_ready:
    ld b, a                       ; B = inset value
    ld a, c
    add a, b
    ld (wall_probe_top), a        ; probe_top    = top    + inset
    ld a, (wall_hit_bottom)
    sub b
    ld (wall_probe_bottom), a     ; probe_bottom = bottom - inset
    ret

; ------------------------------------------------------------------
; wall_add_signed_offset_clamped
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Add a signed 8-bit offset to a pixel coordinate, clamping result to 0..255.
;            Used to apply entity_collision_offset_x/y to entity origin (entity→hitbox).
;   Inputs:
;     - A  = base pixel coordinate (unsigned, 0..255)
;     - HL = pointer to signed offset byte (-128..127)
;   Outputs:
;     - A  = clamp(base + offset, 0, 255)
;   Clobbers: AF, B
;   Preserved: C, DE, HL
;   Notes:
;     - Negative offset: carry=0 after add → underflow → A clamped to 0.
;     - Positive offset: carry=1 after add → overflow → A clamped to 255.
;     - B is used to hold the offset byte; caller must save B if needed.
; ------------------------------------------------------------------
wall_add_signed_offset_clamped:
    ld b, (hl)                    ; B = signed offset
    add a, b
    bit 7, b
    jr z, .wasc_positive
    ; Negative offset: carry=0 means underflow
    jr c, .wasc_done
    xor a
    ret
.wasc_positive:
    ; Positive offset: carry=1 means overflow
    jr nc, .wasc_done
    ld a, 255
.wasc_done:
    ret

; ------------------------------------------------------------------
; wall_sub_signed_offset_clamped
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Subtract a signed 8-bit offset from a hitbox coordinate, clamping to 0..255.
;            Used to convert hitbox left/top back to entity origin after a snap.
;            Inverse of wall_add_signed_offset_clamped.
;   Inputs:
;     - A  = hitbox pixel coordinate (left or top, unsigned 0..255)
;     - HL = pointer to signed collision offset byte (-128..127)
;            (same pointer passed to wall_add_signed_offset_clamped when building)
;   Outputs:
;     - A  = clamp(hitbox - offset, 0, 255)
;            i.e. the entity origin coordinate that produces the snapped hitbox edge
;   Clobbers: AF, B, C
;   Preserved: DE, HL
;   Notes:
;     - If offset is negative: hitbox - offset = hitbox + abs(offset).
;       Overflow (carry clear after add) → A clamped to 255.
;     - If offset is positive: hitbox - offset computed directly.
;       Underflow (carry clear after sub) → A clamped to 0.
;     - B holds the raw offset byte; C holds the original hitbox coordinate.
; ------------------------------------------------------------------
wall_sub_signed_offset_clamped:
    ld c, a
    ld b, (hl)                    ; B = signed offset
    bit 7, b
    jr z, .wssc_positive
    ; offset < 0 -> hitbox - offset = hitbox + abs(offset)
    ld a, b
    neg
    add a, c
    jr nc, .wssc_done
    ld a, 255
    ret
.wssc_positive:
    ld a, c
    sub b
    jr nc, .wssc_done
    xor a
.wssc_done:
    ret
    `}function Hn(e){const l={};return(e||[]).forEach((a,t)=>{const o=typeof(a==null?void 0:a.id)=="string"?a.id:"",n=typeof(a==null?void 0:a.name)=="string"?a.name:"";o&&(l[o]=t,l[o.toLowerCase()]=t),n&&(l[n]=t,l[n.toLowerCase()]=t)}),l}function it(e,l){if(typeof e=="number"&&Number.isFinite(e))return Math.max(0,Math.min(255,e|0));if(typeof e=="string"){const a=e.trim();if(!a)return null;const t=l[a];if(t!==void 0)return t;const o=l[a.toLowerCase()];if(o!==void 0)return o;const n=parseInt(a,10);if(!isNaN(n))return Math.max(0,Math.min(255,n))}return null}function st(e){const l=Number(e);return!Number.isFinite(l)||l<=0?0:Math.max(0,Math.min(65535,Math.round(l)))}function Ia(e){if(typeof e=="boolean")return e?1:0;const l=Number(e);return Number.isFinite(l)?Math.max(0,Math.min(65535,Math.round(l))):1}function dt(e){const l=Number(e);return!Number.isFinite(l)||l<=0?0:Math.max(0,Math.min(255,Math.round(l)))}function Vn(e){const l={};if(!e||e.length===0)return l;let a=128;return e.forEach(t=>{if(!t||!t.id)return;l[t.id]=a,t.name&&(l[String(t.name)]=a,l[String(t.name).toLowerCase()]=a);const o=Math.max(1,Math.ceil((Number(t.width)||8)/8)),n=Math.max(1,Math.ceil((Number(t.height)||8)/8));a+=o*n}),l}function je(e,l){if(typeof e=="string"&&l){if(l[e]!==void 0)return l[e];const t=e.toLowerCase();if(l[t]!==void 0)return l[t]}const a=parseInt(String(e??""),10);return Number.isNaN(a)?0:Math.max(0,Math.min(255,a|0))}function Gn(e){const l={},a=Array.isArray(e.globalVariables)?e.globalVariables:[];for(const t of a){const o=typeof(t==null?void 0:t.name)=="string"?t.name.trim():"",n=typeof(t==null?void 0:t.asmName)=="string"?t.asmName.trim():"";if(!o||!n)continue;const s=String((t==null?void 0:t.type)||"").toLowerCase(),r=s==="word"||s==="16bit";l[o]={asmName:n,isWord:r},l[o.toLowerCase()]={asmName:n,isWord:r},l[n]={asmName:n,isWord:r},l[n.toLowerCase()]={asmName:n,isWord:r}}return l}function ct(e,l){if(typeof e!="string")return null;const a=e.trim();return a&&(l[a]||l[a.toLowerCase()])||null}function va(e){return!e||e.isEnabled===!1||e.isEnabled==="false"?null:{collectionSoundId:e.collectionSoundId,replacementTileId:e.replacementTileId,targetVariable:e.targetVariable??e.scoreVariable??e.scoreVariableName,incrementAmount:e.incrementAmount??e.scoreAmount??e.collectionValue??0,flagVariable:e.flagVariable??e.eventVariable??e.modifiedFlagVariable,flagValue:e.flagValue??e.eventValue??1,bonusTileId:e.bonusTileId,bonusReplacementTileId:e.bonusReplacementTileId,bonusSoundId:e.bonusSoundId,bonusIsPersistent:e.bonusIsPersistent,bonusEntityEffect:e.bonusEntityEffect,bonusEffectAmount:e.bonusEffectAmount,bonusSlashStrength:e.bonusSlashStrength,bonusRespawnSeconds:e.bonusRespawnSeconds}}function Wn(e){var s,r;const l=Hn(e.sounds),a=Gn(e),t=Vn(e.tiles),o=Array.isArray(e.entities)?e.entities:[];for(const i of o){const c=va((s=i==null?void 0:i.componentOverrides)==null?void 0:s.comp_tile_collector);if(!c)continue;const d=it(c.collectionSoundId,l),_=je(c.replacementTileId??0,t),p=ct(c.targetVariable,a),h=st(c.incrementAmount),u=ct(c.flagVariable,a),f=Ia(c.flagValue),b=c.bonusTileId?je(c.bonusTileId,t):null,m=je(c.bonusReplacementTileId??0,t),y=it(c.bonusSoundId,l),T=c.bonusIsPersistent===!0||c.bonusIsPersistent==="true",g=typeof c.bonusEntityEffect=="string"?c.bonusEntityEffect.trim().toLowerCase():"none",A=st(c.bonusEffectAmount),S=dt(c.bonusSlashStrength??8),E=dt(c.bonusRespawnSeconds);if(d!==null||_!==0||p&&h>0||u!==null||b!==null||y!==null||g!=="none"&&A>0||b!==null&&E>0)return{soundAssetIndex:d,replacementTileChar:_,targetVariable:p,incrementAmount:h,flagVariable:u,flagValue:f,bonusTileChar:b,bonusReplacementTileChar:m,bonusSoundAssetIndex:y,bonusIsPersistent:T,bonusEntityEffect:g,bonusEffectAmount:A,bonusSlashStrength:S,bonusRespawnSeconds:E}}const n=Array.isArray(e.templates)?e.templates:[];for(const i of n){const c=(r=i==null?void 0:i.components)==null?void 0:r.find(v=>v.definitionId==="comp_tile_collector");if(!c)continue;const d=va(c.defaultValues||{});if(!d)continue;const _=it(d.collectionSoundId,l),p=je(d.replacementTileId??0,t),h=ct(d.targetVariable,a),u=st(d.incrementAmount),f=ct(d.flagVariable,a),b=Ia(d.flagValue),m=d.bonusTileId?je(d.bonusTileId,t):null,y=je(d.bonusReplacementTileId??0,t),T=it(d.bonusSoundId,l),g=d.bonusIsPersistent===!0||d.bonusIsPersistent==="true",A=typeof d.bonusEntityEffect=="string"?d.bonusEntityEffect.trim().toLowerCase():"none",S=st(d.bonusEffectAmount),E=dt(d.bonusSlashStrength??8),C=dt(d.bonusRespawnSeconds);if(_!==null||p!==0||h&&u>0||f!==null||m!==null||T!==null||A!=="none"&&S>0||m!==null&&C>0)return{soundAssetIndex:_,replacementTileChar:p,targetVariable:h,incrementAmount:u,flagVariable:f,flagValue:b,bonusTileChar:m,bonusReplacementTileChar:y,bonusSoundAssetIndex:T,bonusIsPersistent:g,bonusEntityEffect:A,bonusEffectAmount:S,bonusSlashStrength:E,bonusRespawnSeconds:C}}return{soundAssetIndex:null,replacementTileChar:0,targetVariable:null,incrementAmount:0,flagVariable:null,flagValue:1,bonusTileChar:null,bonusReplacementTileChar:0,bonusSoundAssetIndex:null,bonusIsPersistent:!1,bonusEntityEffect:"none",bonusEffectAmount:0,bonusSlashStrength:8,bonusRespawnSeconds:0}}function Ra(){return`
; ------------------------------------------------------------------
; wall_build_hitbox_cache
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Compute and cache hitbox AABB and adaptive probe coordinates
;            from entity position (wall_temp_x/y) plus collision offsets/sizes.
;   Inputs:
;     - DE                        = entity index (used to index per-entity arrays)
;     - wall_temp_x               = cached entity X origin (set before calling)
;     - wall_temp_y               = cached entity Y origin (set before calling)
;     - entity_collision_hitbox_w[DE]: hitbox width  (0 treated as 1)
;     - entity_collision_hitbox_h[DE]: hitbox height (0 treated as 1)
;     - entity_collision_offset_x[DE]: signed X offset from entity origin to hitbox left
;     - entity_collision_offset_y[DE]: signed Y offset from entity origin to hitbox top
;   Outputs:
;     - wall_hit_left   = hitbox left  pixel (entity_x + offset_x, clamped 0..255)
;     - wall_hit_top    = hitbox top   pixel (entity_y + offset_y, clamped 0..255)
;     - wall_hit_right  = left + (w-1), clamped 0..255
;     - wall_hit_bottom = top  + (h-1), clamped 0..255
;     - wall_hit_w      = effective width  (>= 1)
;     - wall_hit_h      = effective height (>= 1)
;     - wall_probe_left / wall_probe_right : X probes (inset up to 2px from sides)
;     - wall_probe_top  / wall_probe_bottom: Y probes (inset up to 2px from top/bottom)
;   Clobbers: AF, BC, HL
;   Preserved: DE (entity index is never modified)
;   Notes:
;     - Adaptive inset: min(2, floor((right-left)/2)) and min(2, floor((bottom-top)/2)).
;       Prevents corner-only probes for entities smaller than 4 pixels on an axis.
;     - Call wall_add_signed_offset_clamped for offset application.
;     - Called once at entity loop entry; called again after every position snap.
; ------------------------------------------------------------------
wall_build_hitbox_cache:
    ; Width (minimum 1)
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld a, (hl)
    or a
    jr nz, .wbhc_w_ok
    ld a, 1
.wbhc_w_ok:
    ld (wall_hit_w), a

    ; Height (minimum 1)
    ld hl, entity_collision_hitbox_h
    add hl, de
    ld a, (hl)
    or a
    jr nz, .wbhc_h_ok
    ld a, 1
.wbhc_h_ok:
    ld (wall_hit_h), a

    ; left = entity_x + offset_x (signed, clamped)
    ld a, (wall_temp_x)
    ld hl, entity_collision_offset_x
    add hl, de
    call wall_add_signed_offset_clamped
    ld (wall_hit_left), a

    ; top = entity_y + offset_y (signed, clamped)
    ld a, (wall_temp_y)
    ld hl, entity_collision_offset_y
    add hl, de
    call wall_add_signed_offset_clamped
    ld (wall_hit_top), a

    ; right = left + (w-1), clamped
    ld a, (wall_hit_w)
    dec a
    ld b, a
    ld a, (wall_hit_left)
    add a, b
    jr nc, .wbhc_right_ok
    ld a, 255
.wbhc_right_ok:
    ld (wall_hit_right), a

    ; bottom = top + (h-1), clamped
    ld a, (wall_hit_h)
    dec a
    ld b, a
    ld a, (wall_hit_top)
    add a, b
    jr nc, .wbhc_bottom_ok
    ld a, 255
.wbhc_bottom_ok:
    ld (wall_hit_bottom), a

    ; ---- Adaptive X probes: inset = min(2, floor((right-left)/2)) ----
    ; Purpose: avoid probing the exact corner pixels for small sprites.
    ; For a 16px-wide entity: inset = min(2, 8) = 2.
    ;   probe_left  = left  + 2  (2px inside left edge)
    ;   probe_right = right - 2  (2px inside right edge)
    ; For a 4px-wide entity: inset = min(2, 2) = 2 (probes overlap at center).
    ; For a 2px-wide entity: inset = min(2, 1) = 1.
    ld a, (wall_hit_left)
    ld c, a                       ; C = left pixel
    ld a, (wall_hit_right)
    sub c                         ; A = width span (right - left)
    srl a                         ; A = span / 2
    cp 3                          ; is span/2 < 3 (i.e. inset < 2)?
    jr c, .wbhc_inset_x_ready     ; yes: use as-is
    ld a, 2                       ; no: cap inset at 2
.wbhc_inset_x_ready:
    ld b, a                       ; B = inset value
    ld a, c
    add a, b
    ld (wall_probe_left), a       ; probe_left  = left  + inset
    ld a, (wall_hit_right)
    sub b
    ld (wall_probe_right), a      ; probe_right = right - inset

    ; ---- Adaptive Y probes: inset = min(2, floor((bottom-top)/2)) ----
    ; Same logic on Y axis.
    ;   probe_top    = top    + inset
    ;   probe_bottom = bottom - inset
    ld a, (wall_hit_top)
    ld c, a                       ; C = top pixel
    ld a, (wall_hit_bottom)
    sub c                         ; A = height span (bottom - top)
    srl a                         ; A = span / 2
    cp 3
    jr c, .wbhc_inset_y_ready
    ld a, 2
.wbhc_inset_y_ready:
    ld b, a                       ; B = inset value
    ld a, c
    add a, b
    ld (wall_probe_top), a        ; probe_top    = top    + inset
    ld a, (wall_hit_bottom)
    sub b
    ld (wall_probe_bottom), a     ; probe_bottom = bottom - inset
    ret

; ------------------------------------------------------------------
; wall_add_signed_offset_clamped
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Add a signed 8-bit offset to a pixel coordinate, clamping result to 0..255.
;            Used to apply entity_collision_offset_x/y to entity origin (entity→hitbox).
;   Inputs:
;     - A  = base pixel coordinate (unsigned, 0..255)
;     - HL = pointer to signed offset byte (-128..127)
;   Outputs:
;     - A  = clamp(base + offset, 0, 255)
;   Clobbers: AF, B
;   Preserved: C, DE, HL
;   Notes:
;     - Negative offset: carry=0 after add → underflow → A clamped to 0.
;     - Positive offset: carry=1 after add → overflow → A clamped to 255.
;     - B is used to hold the offset byte; caller must save B if needed.
; ------------------------------------------------------------------
wall_add_signed_offset_clamped:
    ld b, (hl)                    ; B = signed offset
    add a, b
    bit 7, b
    jr z, .wasc_positive
    ; Negative offset: carry=0 means underflow
    jr c, .wasc_done
    xor a
    ret
.wasc_positive:
    ; Positive offset: carry=1 means overflow
    jr nc, .wasc_done
    ld a, 255
.wasc_done:
    ret

; ------------------------------------------------------------------
; wall_sub_signed_offset_clamped
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Subtract a signed 8-bit offset from a hitbox coordinate, clamping to 0..255.
;            Used to convert hitbox left/top back to entity origin after a snap.
;            Inverse of wall_add_signed_offset_clamped.
;   Inputs:
;     - A  = hitbox pixel coordinate (left or top, unsigned 0..255)
;     - HL = pointer to signed collision offset byte (-128..127)
;            (same pointer passed to wall_add_signed_offset_clamped when building)
;   Outputs:
;     - A  = clamp(hitbox - offset, 0, 255)
;            i.e. the entity origin coordinate that produces the snapped hitbox edge
;   Clobbers: AF, B, C
;   Preserved: DE, HL
;   Notes:
;     - If offset is negative: hitbox - offset = hitbox + abs(offset).
;       Overflow (carry clear after add) → A clamped to 255.
;     - If offset is positive: hitbox - offset computed directly.
;       Underflow (carry clear after sub) → A clamped to 0.
;     - B holds the raw offset byte; C holds the original hitbox coordinate.
; ------------------------------------------------------------------
wall_sub_signed_offset_clamped:
    ld c, a
    ld b, (hl)                    ; B = signed offset
    bit 7, b
    jr z, .wssc_positive
    ; offset < 0 -> hitbox - offset = hitbox + abs(offset)
    ld a, b
    neg
    add a, c
    jr nc, .wssc_done
    ld a, 255
    ret
.wssc_positive:
    ld a, c
    sub b
    jr nc, .wssc_done
    xor a
.wssc_done:
    ret
`}function Yn(){return`
; ------------------------------------------------------------------
; DEADLY TILES COMPONENT SYSTEM
; Purpose:
;   Scan active entities that carry COMP_MASK_DEADLY_TILES and update
;   entity_flag_deadly_tile bit 0 when their hitbox overlaps a deadly
;   behavior-map tile (TILE_DEADLY = #04).
; Notes:
;   - Uses the same hitbox sampling strategy as Preview/runtime helpers.
;   - Entities without the component have the flag forcibly cleared.
; ------------------------------------------------------------------
  init_deadly_tiles_system:
    xor a
    ld (tileDead), a
    ld (tileDeadLatched), a
    ld (tileDeadX), a
    ld (tileDeadY), a
    ld (tileDeadValue), a

    ld hl, entity_flag_deadly_tile
    ld de, entity_flag_deadly_tile + 1
    ld bc, 31
    ld (hl), 0
    ldir

    ; Seed default hitboxes so marker-only entities still have a stable
    ; 16x16 probe area even when comp_collision is absent.
    ld hl, entity_collision_hitbox_w
    ld de, entity_collision_hitbox_w + 1
    ld bc, 31
    ld (hl), 16
    ldir

    ld hl, entity_collision_hitbox_h
    ld de, entity_collision_hitbox_h + 1
    ld bc, 31
    ld (hl), 16
    ldir

    ld hl, entity_collision_offset_x
    ld de, entity_collision_offset_x + 1
    ld bc, 31
    ld (hl), 0
    ldir

    ld hl, entity_collision_offset_y
    ld de, entity_collision_offset_y + 1
    ld bc, 31
    ld (hl), 0
    ldir
    ret

  deadly_tiles_runtime_tile_is_deadly_nb:
      ; Shared deadly probe helper. Mirrors the late-frame path used by
      ; check_tile_interaction so DeadlyTiles and Tile Collector keep parity.
      push hl
      push de

      ld hl, prof_deadly_behavior_reads
      inc (hl)
      jr nz, .dttid_prof_counted
      inc hl
      inc (hl)
.dttid_prof_counted:

      ld a, c
      ld (tileDeadX), a
      ld a, b
      ld (tileDeadY), a
  
      ld a, b
      cp 24
      jr nc, .dttid_out_of_bounds
    ld a, c
    cp 32
    jr nc, .dttid_out_of_bounds

    ld h, 0
    ld l, b                        ; HL = tileY
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                     ; HL = tileY * 32
    ld e, c
    ld d, 0
    add hl, de                     ; HL = idx
      ld de, runtime_behavior_map
      add hl, de                     ; HL = &runtime_behavior_map[idx]
      ld a, (hl)
      ld (tileDeadValue), a
      and TILE_DEADLY
      jr .dttid_done
  
  .dttid_out_of_bounds:
      ld a, #FF
      ld (tileDeadValue), a
      xor a
  
  .dttid_done:
      pop de
      pop hl
    ret

update_entity_deadly_flag_runtime:
    ; Preserve the caller's entity index before building the hitbox cache.
    ; wall_build_hitbox_cache may clobber BC, and deadly flag writes must
    ; still target the original entity slot on every exit path.
    push bc

    ld e, c
    ld d, 0

    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld (wall_temp_x), a

    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld (wall_temp_y), a

    call wall_build_hitbox_cache

    ; Deadly tiles use a single sample point at the entity center.
    ; This avoids early kills when the hitbox edges approach a deadly tile.
    ; Center row = top + floor(height / 2)
    ld a, (wall_hit_h)
    srl a
    ld c, a
    ld a, (wall_hit_top)
    add a, c
    srl a
    srl a
    srl a
    ld b, a

    ; Center column = left + floor(width / 2)
    ld a, (wall_hit_w)
    srl a
    ld c, a
    ld a, (wall_hit_left)
    add a, c
    srl a
    srl a
    srl a
    ld c, a
    call deadly_tiles_runtime_tile_is_deadly_nb
    or a
    jp nz, .det_found
    jp .det_clear

  .det_found:
      pop bc
      ld hl, entity_flag_deadly_tile
      ld e, c
      ld d, 0
      add hl, de
      set 0, (hl)
      ld a, c
      or a
      ret nz
      ld a, 1
      ld (tileDead), a
      ld (tileDeadLatched), a
      ret
  
  .det_clear:
      pop bc
      ld hl, entity_flag_deadly_tile
      ld e, c
      ld d, 0
      add hl, de
      res 0, (hl)
      ld a, c
      or a
      ret nz
      xor a
      ld (tileDead), a
      ret

update_deadly_tiles_component:
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a
    ld hl, active_entity_list

.deadly_tiles_loop:
    ld c, (hl)
    inc hl
    push hl
    ld a, (player_runtime_enabled)
    or a
    jp z, .deadly_not_fast_player
    ld a, (player_entity_index)
    cp c
    jp z, .deadly_skip_fast_player
.deadly_not_fast_player:
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    pop hl
    and #20                       ; COMP_MASK_DEADLY_TILES (#2000) => high byte bit 5
    jr nz, .deadly_tiles_update

      push bc
      ld hl, entity_flag_deadly_tile
      ld e, c
      ld d, 0
      add hl, de
      res 0, (hl)
      ld a, c
      or a
      jr nz, .deadly_tiles_skip_debug_clear
      xor a
      ld (tileDead), a
.deadly_tiles_skip_debug_clear:
      pop bc
      jr .deadly_tiles_next

.deadly_tiles_update:
    push bc
    call update_entity_deadly_flag_runtime
    pop bc
    jr .deadly_tiles_next

.deadly_skip_fast_player:
    pop hl

.deadly_tiles_next:
    dec b
    jp nz, .deadly_tiles_loop
    ret

refresh_player_deadly_fastpath:
    ld a, (player_runtime_enabled)
    or a
    ret z
    ld a, (player_entity_index)
    cp #FF
    ret z
    ld c, a
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #20
    jr nz, .player_deadly_update
    ld hl, entity_flag_deadly_tile
    add hl, de
    res 0, (hl)
    ret
.player_deadly_update:
    call update_entity_deadly_flag_runtime
    ret
`}function Qn(e,l,a=!1){const t=e.soundAssetIndex,o=e.replacementTileChar,n=Math.max(1,Math.min(32,e.bonusSlashStrength||8)),s=Math.max(1,n-1),r=Math.max(1,n-2);`${(256-n&255).toString(16).toUpperCase().padStart(2,"0")}`,`${(256-s&255).toString(16).toUpperCase().padStart(2,"0")}`,`${(256-r&255).toString(16).toUpperCase().padStart(2,"0")}`;const i=t!==null&&l?`    ; Tile Collector UI-configured collection sound.
    ; Preserve DE because it still carries the tile index for persistence.
    push de
    ld a, ${t}
    call SM_PlaySoundAsset
    pop de
`:t!==null?`    ; collectionSoundId is configured in the Tile Collector UI,
    ; but this build has no state-machine sound asset runtime.
    ; Stay silent instead of forcing the wrong built-in beep.
`:`    ; No collectionSoundId configured in the Tile Collector UI.
`,c=e.bonusSoundAssetIndex!==null&&l?`    ; Tile Collector bonus pickup sound.
    push de
    ld a, ${e.bonusSoundAssetIndex}
    call SM_PlaySoundAsset
    pop de
`:e.bonusSoundAssetIndex!==null?`    ; bonusSoundId is configured, but this build has no state-machine sound asset runtime.
`:`    ; No bonusSoundId configured.
`,d=S=>(S==null?void 0:S.asmName)==="global_var_score"?`    ; Keep HUD Score text in sync with the updated global variable.
    push de
    call force_render_hud
    pop de
`:(S==null?void 0:S.asmName)==="global_var_lives"?`    ; Keep HUD Lives text in sync with the updated global variable.
    push de
    ld a, (${S.asmName})
    call update_hud_lives
    call force_render_hud
    pop de
`:"",_=d(e.targetVariable),p=e.targetVariable&&e.incrementAmount>0?e.targetVariable.isWord?`    ; Tile Collector configured variable increment (16-bit).
    ld hl, ${e.targetVariable.asmName}
    ld a, (hl)
    add a, ${e.incrementAmount&255}
    ld (hl), a
    inc hl
    ld a, (hl)
    adc a, ${e.incrementAmount>>8&255}
    ld (hl), a
${_}
`:`    ; Tile Collector configured variable increment (8-bit).
    ld hl, ${e.targetVariable.asmName}
    ld a, (hl)
    add a, ${Math.min(255,e.incrementAmount)}
    ld (hl), a
${_}
`:`    ; No targetVariable/incrementAmount configured in the Tile Collector UI.
`,h=e.flagVariable?e.flagVariable.isWord?`    ; Tile Collector pickup flag assignment (16-bit).
    ld hl, ${e.flagVariable.asmName}
    ld a, ${e.flagValue&255}
    ld (hl), a
    inc hl
    ld a, ${e.flagValue>>8&255}
    ld (hl), a
${d(e.flagVariable)}
`:`    ; Tile Collector pickup flag assignment (8-bit).
    ld hl, ${e.flagVariable.asmName}
    ld a, ${Math.min(255,e.flagValue)}
    ld (hl), a
${d(e.flagVariable)}
`:`    ; No flagVariable configured in the Tile Collector UI.
`,u=n*8,f=256-u&255,b=e.bonusEntityEffect==="grant_extra_jump"&&e.bonusEffectAmount>0?`    ; Bonus tile effect: 8px-per-frame slash in current movement direction.
    ; Covers ${n} tiles (${u}px). Checks solid tiles each step.
    push de
    ld e, c
    ld d, 0
    ld hl, entity_on_ground
    add hl, de
    res 0, (hl)

    ld hl, entity_platform_id
    add hl, de
    ld (hl), 255

    ; --- Set slash_vel_x = sign(vel_x) * ${u} ---
    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    or a
    jp z, .ti_slash_x_zero
    bit 7, a
    jp nz, .ti_slash_x_neg
    ld a, ${u}          ; +${u} (moving right)
    jp .ti_slash_x_set
.ti_slash_x_neg:
    ld a, #${f.toString(16).toUpperCase().padStart(2,"0")}          ; -${u} (moving left)
.ti_slash_x_set:
    ld hl, entity_slash_vel_x
    add hl, de
    ld (hl), a
    jp .ti_slash_x_done
.ti_slash_x_zero:
    ld hl, entity_slash_vel_x
    add hl, de
    ld (hl), 0
.ti_slash_x_done:

    ; --- Set slash_vel_y = sign(vel_y) * ${u} ---
    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)
    or a
    jp z, .ti_slash_y_zero
    bit 7, a
    jp nz, .ti_slash_y_neg
    ld a, ${u}          ; +${u} (moving down)
    jp .ti_slash_y_set
.ti_slash_y_neg:
    ld a, #${f.toString(16).toUpperCase().padStart(2,"0")}          ; -${u} (moving up)
.ti_slash_y_set:
    ld hl, entity_slash_vel_y
    add hl, de
    ld (hl), a
    jp .ti_slash_y_done
.ti_slash_y_zero:
    ld hl, entity_slash_vel_y
    add hl, de
    ld (hl), 0
.ti_slash_y_done:

    ; Zero gravity so it doesn't fight the vertical slash
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de
    ld (hl), 0
    inc hl
    ld (hl), 0

.ti_bonus_done:
    pop de
`:`    ; No supported bonus entity effect configured.
`,m=e.bonusTileChar!==null?`    ld a, b
    cp ${e.bonusTileChar}
    jp z, .ti_collect_bonus
`:"",y=e.bonusIsPersistent?`    ; Bonus tile configured as persistent: record it like a normal collectible.
    jp .ti_record_persistent
`:`    ; Bonus tile is visit-local only: do not persist across screen reloads.
    jp .ti_next
`,T=e.bonusTileChar!==null&&e.bonusRespawnSeconds>0,g=T?`    ; Timed bonus respawn enabled: queue tile restoration and skip persistence.
    call record_bonus_respawn_slot
    jp .ti_next
`:y;return`
; ==================================================================
; TILE INTERACTION SYSTEM
; ==================================================================
; Checks if any entity with COMP_INPUT overlaps a tile marked as
; Interactable (mapId & #08 != 0) in the runtime behavior map.
; When found: removes tile from screen and increments gem_count.
; ------------------------------------------------------------------
; Called once per frame from update_all_entities.
; ------------------------------------------------------------------

init_tile_interaction_system:
    ld hl, entity_slash_vel_x
    ld de, entity_slash_vel_x+1
    ld bc, 31
    ld (hl), 0
    ldir
    ld hl, entity_slash_vel_y
    ld de, entity_slash_vel_y+1
    ld bc, 31
    ld (hl), 0
    ldir
    ret

; ------------------------------------------------------------------
; update_slash_component
; Tile-by-tile slash: moves entity exactly 8px per frame, checking
; for solid tiles before each step.  Covers the remaining distance
; stored in entity_slash_vel_x/y (decayed by 8 each frame).
; ------------------------------------------------------------------
update_slash_component:
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a
    ld hl, active_entity_list

.slash_loop:
    ld c, (hl)
    inc hl
    push hl                    ; Save list pointer
    ld e, c
    ld d, 0

    ; Check if entity has any slash velocity (X or Y)
    ld hl, entity_slash_vel_x
    add hl, de
    ld a, (hl)
    ld hl, entity_slash_vel_y
    add hl, de
    or (hl)
    jp z, .slash_next          ; both zero → skip

    push bc

    ; --- Build hitbox for tile checks (reuse wall_hit_* scratch) ---
    ; hitbox_left = entity_x + collision_offset_x
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld hl, entity_collision_offset_x
    add hl, de
    add a, (hl)
    ld (wall_hit_left), a

    ; hitbox_right = left + w - 1
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld a, (hl)
    or a
    jp nz, .sl_w_ok
    ld a, 1
.sl_w_ok:
    ld c, a
    ld a, (wall_hit_left)
    add a, c
    dec a
    ld (wall_hit_right), a

    ; hitbox_top = entity_y + collision_offset_y
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld hl, entity_collision_offset_y
    add hl, de
    add a, (hl)
    ld (wall_hit_top), a

    ; hitbox_bottom = top + h - 1
    ld hl, entity_collision_hitbox_h
    add hl, de
    ld a, (hl)
    or a
    jp nz, .sl_h_ok
    ld a, 1
.sl_h_ok:
    ld c, a
    ld a, (wall_hit_top)
    add a, c
    dec a
    ld (wall_hit_bottom), a

    ; ============ PROCESS X SLASH ============
    ld hl, entity_slash_vel_x
    add hl, de
    ld a, (hl)
    or a
    jp z, .slash_x_done
    bit 7, a
    jp nz, .slash_x_left

.slash_x_right:
    ; Check tile at column (hitbox_right + 8) / 8
    ld a, (wall_hit_right)
    add a, 8
    jp c, .slash_x_stop        ; overflow → screen edge
    srl a
    srl a
    srl a
    ld c, a                    ; C = probe column
    ; Probe top row
    ld a, (wall_hit_top)
    srl a
    srl a
    srl a
    ld b, a
    push bc
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    pop bc
    jp nz, .slash_x_stop
    ; Probe bottom row
    ld a, (wall_hit_bottom)
    srl a
    srl a
    srl a
    ld b, a
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jp nz, .slash_x_stop

    ; Passable → override vel_x = +8, decay slash_vel_x by 8
    ld hl, entity_vel_x
    add hl, de
    ld (hl), 8
    ld hl, entity_slash_vel_x
    add hl, de
    ld a, (hl)
    sub 8
    jp nc, .slash_x_store
    xor a
.slash_x_store:
    ld (hl), a
    jp .slash_x_done

.slash_x_left:
    ; Check tile at column (hitbox_left - 8) / 8
    ld a, (wall_hit_left)
    cp 8
    jp c, .slash_x_stop        ; < 8 → screen edge
    sub 8
    srl a
    srl a
    srl a
    ld c, a                    ; C = probe column
    ; Probe top row
    ld a, (wall_hit_top)
    srl a
    srl a
    srl a
    ld b, a
    push bc
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    pop bc
    jp nz, .slash_x_stop
    ; Probe bottom row
    ld a, (wall_hit_bottom)
    srl a
    srl a
    srl a
    ld b, a
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jp nz, .slash_x_stop

    ; Passable → override vel_x = -8, decay slash_vel_x by 8 toward 0
    ld hl, entity_vel_x
    add hl, de
    ld (hl), #F8               ; -8
    ld hl, entity_slash_vel_x
    add hl, de
    ld a, (hl)
    add a, 8                   ; negative + 8 → toward zero
    bit 7, a
    jp nz, .slash_x_store_l
    xor a                      ; crossed zero → clamp
.slash_x_store_l:
    ld (hl), a
    jp .slash_x_done

.slash_x_stop:
    ; Hit solid tile or screen edge → kill X slash and X velocity
    ld hl, entity_slash_vel_x
    add hl, de
    ld (hl), 0
    ld hl, entity_vel_x
    add hl, de
    ld (hl), 0

.slash_x_done:

    ; ============ PROCESS Y SLASH ============
    ld hl, entity_slash_vel_y
    add hl, de
    ld a, (hl)
    or a
    jp z, .slash_y_done
    bit 7, a
    jp nz, .slash_y_up

.slash_y_down:
    ; Check tile at row (hitbox_bottom + 8) / 8
    ld a, (wall_hit_bottom)
    add a, 8
    cp 192
    jp nc, .slash_y_stop       ; off-screen bottom
    srl a
    srl a
    srl a
    ld b, a                    ; B = probe row
    ; Probe left column
    ld a, (wall_hit_left)
    srl a
    srl a
    srl a
    ld c, a
    push bc
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    pop bc
    jp nz, .slash_y_stop
    ; Probe right column
    ld a, (wall_hit_right)
    srl a
    srl a
    srl a
    ld c, a
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jp nz, .slash_y_stop

    ; Passable → override vel_y = +8, decay slash_vel_y by 8
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 8
    ld hl, entity_slash_vel_y
    add hl, de
    ld a, (hl)
    sub 8
    jp nc, .slash_y_store
    xor a
.slash_y_store:
    ld (hl), a
    jp .slash_y_done

.slash_y_up:
    ; Check tile at row (hitbox_top - 8) / 8
    ld a, (wall_hit_top)
    cp 8
    jp c, .slash_y_stop        ; < 8 → screen edge
    sub 8
    srl a
    srl a
    srl a
    ld b, a                    ; B = probe row
    ; Probe left column
    ld a, (wall_hit_left)
    srl a
    srl a
    srl a
    ld c, a
    push bc
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    pop bc
    jp nz, .slash_y_stop
    ; Probe right column
    ld a, (wall_hit_right)
    srl a
    srl a
    srl a
    ld c, a
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jp nz, .slash_y_stop

    ; Passable → override vel_y = -8, decay slash_vel_y by 8 toward 0
    ld hl, entity_vel_y
    add hl, de
    ld (hl), #F8               ; -8
    ld hl, entity_slash_vel_y
    add hl, de
    ld a, (hl)
    add a, 8                   ; negative + 8 → toward zero
    bit 7, a
    jp nz, .slash_y_store_u
    xor a
.slash_y_store_u:
    ld (hl), a
    jp .slash_y_done

.slash_y_stop:
    ; Hit solid tile or screen edge → kill Y slash and Y velocity
    ld hl, entity_slash_vel_y
    add hl, de
    ld (hl), 0
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0

.slash_y_done:
    pop bc

.slash_next:
    pop hl
    dec b
    jp nz, .slash_loop
    ret

${T?`
record_bonus_respawn_slot:
    ld a, d
    push af
    ld a, e
    push af
    ld b, MAX_BONUS_RESPAWNS
    ld c, 0
.rbr_loop:
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_secs
    add hl, de
    ld a, (hl)
    or a
    jp z, .rbr_store
    inc c
    dec b
    jp nz, .rbr_loop
    pop af
    pop af
    ret
.rbr_store:
    ld (hl), ${e.bonusRespawnSeconds}
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_frames
    add hl, de
    ld (hl), 60
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_world
    add hl, de
    ld a, (current_world_id)
    ld (hl), a
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_screen
    add hl, de
    ld a, (current_screen_id)
    ld (hl), a
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_idx_l
    add hl, de
    pop af
    ld (hl), a
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_idx_h
    add hl, de
    pop af
    ld (hl), a
    ret

update_bonus_respawns:
    ld b, MAX_BONUS_RESPAWNS
    ld c, 0
.ubr_loop:
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_secs
    add hl, de
    ld a, (hl)
    or a
    jp z, .ubr_next
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_frames
    add hl, de
    ld a, (hl)
    dec a
    ld (hl), a
    jp nz, .ubr_next
    ld (hl), 60
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_secs
    add hl, de
    ld a, (hl)
    dec a
    ld (hl), a
    jp nz, .ubr_next
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_world
    add hl, de
    ld a, (current_world_id)
    cp (hl)
    jp nz, .ubr_clear_slot
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_screen
    add hl, de
    ld a, (current_screen_id)
    cp (hl)
    jp nz, .ubr_clear_slot
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_idx_l
    add hl, de
    ld a, (hl)
    push af
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_idx_h
    add hl, de
    ld a, (hl)
    ld d, a
    pop af
    ld e, a
    push bc
    ld hl, NAMETBL
    add hl, de
    ld a, ${e.bonusTileChar}
    call FAST_WRTVRM
    pop bc
    ld hl, runtime_behavior_map
    add hl, de
    ld (hl), #08
.ubr_clear_slot:
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_secs
    add hl, de
    ld (hl), 0
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_frames
    add hl, de
    ld (hl), 0
.ubr_next:
    inc c
    dec b
    jp nz, .ubr_loop
    ret
`:`
record_bonus_respawn_slot:
    ret

update_bonus_respawns:
    ret
`}

; ------------------------------------------------------------------
; check_tile_interaction
; Purpose:
;   Scan active input-driven entities against the interactable tile map,
;   collect matching tiles, update counters, optional target variable, sound,
;   persistent collected-tile state, and late-frame deadly-tile contact.
; Input:
;   None (reads active_entity_list / active_entity_count and runtime maps)
; Output:
;   None
; Clobbers:
;   AF, BC, DE, HL
; Preserves:
;   IX, IY, SP
; Stack:
;   Uses balanced push/pop pairs for list pointer, loop counter/entity index,
;   and temporary tile index saves on all exit paths.
; Notes:
;   - Returns immediately if active_entity_count = 0
;   - Relies on FAST_WRTVRM preserving all registers
;   - DE must survive the optional HUD/sound hooks until persistence logic runs
; ------------------------------------------------------------------
check_tile_interaction:
    call scan_tile_interaction_entities
    call update_bonus_respawns
    ret

scan_tile_interaction_entities:
    ld a, (input_entity_count)
    or a
    ret z                         ; No active entities

    ld hl, input_entity_list
    ld b, a                        ; B = entity count

.ti_loop:
    ld c, (hl)                     ; C = entity index
    ld a, (player_runtime_enabled)
    or a
    jp z, .ti_process_entity
    ld a, (player_entity_index)
    cp c
    jp z, .ti_skip_fast_player
.ti_process_entity:
    push hl                        ; Save list pointer
    push bc                        ; Save count(B) + entity(C)

    ; Check COMP_MASK_INPUT (bit 4, value #10 in low mask byte)
    ld e, c
    ld d, 0                        ; DE = entity index
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    jp z, .ti_next                 ; No input component → skip

    ; Deadly state is produced earlier by update_deadly_tiles_component.
    ; Tile interaction only consumes entity_flag_deadly_tile.

    ; Get center X
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    add a, 8                       ; center X = x + 8
    push af                        ; Save centerX

    ; Get center Y
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    add a, 8                       ; center Y = y + 8
    ld e, a                        ; E = centerY

    pop af                         ; A = centerX
    ld d, a                        ; D = centerX, E = centerY

    ; Convert pixel → tile coords (div 8 via 3x rrca + and #1F)
    ld a, d
    rrca
    rrca
    rrca
    and #1F
    ld d, a                        ; D = tileX (0-31)

    ld a, e
    rrca
    rrca
    rrca
    and #1F
    ld e, a                        ; E = tileY (0-23)

    ; Compute idx = tileY * 32 + tileX
    ld h, 0
    ld l, e                        ; HL = tileY
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                     ; HL = tileY * 32
    ld b, 0
    ld c, d                        ; BC = tileX
    add hl, bc                     ; HL = idx

    push hl                        ; Save idx

    ; Check runtime_behavior_map[idx]
    ld de, runtime_behavior_map
    add hl, de                     ; HL = &runtime_behavior_map[idx]
    ld a, (hl)
    and #08                        ; INTERACTABLE flag (bit 3)
    jp z, .ti_no_collect

    ; *** COLLECT! ***
    ; Stack at this point: [idx (as HL), BC_saved, list_ptr]
    ; HL = &runtime_behavior_map[idx]

    ; 1. Clear behavior map entry FIRST while HL is still correct
    ld (hl), 0                     ; Prevents double-collect next frame

    ; Recover tile index in DE and restore entity index in C for optional bonus effects.
    pop de                         ; DE = idx. Stack: [BC_saved, list_ptr]
    pop bc                         ; B = loop count, C = entity index. Stack: [list_ptr]
    push bc                        ; Restore loop state for .ti_next

    ; 0. Read char code from VRAM Name Table BEFORE clearing VRAM.
    ;    Stored in last_gem_char so SM can identify WHICH tile was collected
    ;    via VARIABLE_COMPARE last_gem_char == <charCode>.
    push de                        ; Preserve DE = idx across VRAM read setup
    ld hl, NAMETBL
    add hl, de                     ; HL = NAMETBL + idx (VRAM address to read)
    ; MSX1 direct VRAM read (port #99 = address register, port #98 = data)
    ld a, l
    out (#99), a                   ; Set VRAM address low byte
    ld a, h
    and #3F                        ; Bits 7,6 = 0 → read mode
    out (#99), a                   ; Set VRAM address high byte
    nop                            ; Short delay for VDP address latch
    nop
    in a, (#98)                    ; A = char code from VRAM data port
    ld (last_gem_char), a          ; Store for SM: VARIABLE_COMPARE last_gem_char
    ld b, a                        ; Preserve collected char code for bonus-tile compare
    pop de                         ; Restore DE = idx

${m}

    jp .ti_collect_normal

.ti_collect_normal:
    ; 2. Replace tile in VRAM Name Table (#1800 + idx)
    ld hl, NAMETBL
    add hl, de                     ; HL = NAMETBL + idx
    ld a, ${o}   ; Replacement tile char (0 = empty)
    call FAST_WRTVRM

    ; 3. Increment gem_count
    ld hl, gem_count
    inc (hl)

${p}
${h}

${i}

    ; 4. Record in persistent collected list (survives screen re-entry via apply_collected_tiles)
    ;    FAST_WRTVRM preserves all registers, so DE = idx is still valid here.
.ti_record_persistent:
    ld a, (collected_count)
    cp MAX_COLLECTIBLES
    jp nc, .ti_next                ; List full - skip recording
    ld c, a                        ; C = index = old collected_count
    ld b, 0                        ; BC = (0, index)
    ; Store world+screen ID of the collected tile
    ld hl, collected_world
    add hl, bc
    ld a, (current_world_id)
    ld (hl), a
    ld hl, collected_screen
    add hl, bc
    ld a, (current_screen_id)
    ld (hl), a
    ; Store tile name-table index (DE = idx, preserved by FAST_WRTVRM)
    ld hl, collected_idx_l
    add hl, bc
    ld (hl), e                     ; E = idx low byte
    ld hl, collected_idx_h
    add hl, bc
    ld (hl), d                     ; D = idx high byte
    ; Increment collected_count
    ld hl, collected_count
    inc (hl)

    jp .ti_next

.ti_collect_bonus:
    ; Bonus tile path: independent from normal collectible gem logic.
    ld hl, NAMETBL
    add hl, de                     ; HL = NAMETBL + idx
    ld a, ${e.bonusReplacementTileChar}
    call FAST_WRTVRM

${b}

${c}

${g}

.ti_no_collect:
    pop hl                         ; Balance idx push

.ti_next:
    pop bc                         ; Restore B=count, C=entity
    pop hl                         ; Restore list pointer
    inc hl                         ; Advance to next entity
    dec b
    jp nz, .ti_loop                ; djnz replaced with jp nz (loop body > 127 bytes)
    ret

.ti_skip_fast_player:
    inc hl
    dec b
    jp nz, .ti_loop
    ret

refresh_player_tile_interaction_fastpath:
    ld a, (player_runtime_enabled)
    or a
    ret z
    ld a, (player_entity_index)
    cp #FF
    ret z
    ld c, a
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    ret z

    ld a, (player_runtime_enabled)
    push af
    ld a, (input_entity_count)
    push af
    ld a, (input_entity_list)
    push af

    xor a
    ld (player_runtime_enabled), a
    ld a, c
    ld (input_entity_list), a
    ld a, 1
    ld (input_entity_count), a
    call scan_tile_interaction_entities

    pop af
    ld (input_entity_list), a
    pop af
    ld (input_entity_count), a
    pop af
    ld (player_runtime_enabled), a
    ret
`}function Xn(){return`
; ------------------------------------------------------------------
; apply_collected_tiles
; Re-clears tiles that were previously collected on the current world/screen.
; Called after every screen load so collected tiles do not respawn.
; Input:  current_world_id and current_screen_id must already be set.
; Output: None
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
apply_collected_tiles:
    ld a, (collected_count)
    or a
    ret z                          ; Nothing collected yet - return early

    ld b, a                        ; B = djnz counter (total collected entries)
    ld c, 0                        ; C = loop index
.apply_ct_loop:
    ; DE = (0, index) used for all three table lookups.
    ; add hl, de does NOT modify DE, so we can reuse it for all 3 tables.
    ld d, 0
    ld e, c                        ; DE = (0, current index)

    ; Check if this entry belongs to current world
    ld hl, collected_world
    add hl, de                     ; HL = &collected_world[index]
    ld a, (current_world_id)       ; A = world currently loaded
    cp (hl)                        ; Compare with stored world ID
    jr nz, .apply_ct_skip          ; Different world - skip

    ; Check if this entry belongs to current screen
    ld hl, collected_screen
    add hl, de                     ; HL = &collected_screen[index]
    ld a, (current_screen_id)      ; A = screen currently loaded
    cp (hl)                        ; Compare with stored screen ID
    jr nz, .apply_ct_skip          ; Different screen - skip

    ; Entry matches current screen: re-clear this tile
    push bc                        ; Save B=count, C=index across FAST_WRTVRM

    ; Build tile index: D = idx_h, E = idx_l
    ; (DE is still (0, index) because add hl, de never modifies DE)
    ld hl, collected_idx_l
    add hl, de                     ; HL = &collected_idx_l[index]
    ld a, (hl)
    push af                        ; Save idx_l on stack

    ld hl, collected_idx_h
    add hl, de                     ; HL = &collected_idx_h[index], DE still (0, index)
    ld a, (hl)
    ld d, a                        ; D = idx_h

    pop af                         ; A = idx_l
    ld e, a                        ; E = idx_l
    ; DE = tile index (D=high, E=low)

    ; Re-clear runtime_behavior_map[idx]
    push de                        ; Save idx
    ld hl, runtime_behavior_map
    add hl, de
    ld (hl), 0
    pop de                         ; Restore idx

    ; Re-clear VRAM Name Table (NAMETBL + idx)
    ld hl, NAMETBL
    add hl, de
    xor a                          ; A = 0 (empty tile char)
    call FAST_WRTVRM               ; Preserves all registers

    pop bc                         ; Restore B=count, C=index

.apply_ct_skip:
    inc c
    djnz .apply_ct_loop
    ret
`}function Kn(){return`
    ; ==================================================================
    ; COLLECTIBLE COMPONENT SYSTEM
    ; ==================================================================
    ; Items that can be collected when player touches them
    ; Increments score/counters and deactivates item

init_collectible_system:
    ret

; ------------------------------------------------------------------
; update_collectible_component
; Check collisions between collectibles and player
; When collected: deactivate item, increment score
; ------------------------------------------------------------------
update_collectible_component:
    call resolve_runtime_hero_entity
    cp #FF
    ret z
    ld c, 0                       ; Entity index

.collect_loop:
    ld a, c
    cp MAX_ENTITIES
    ret z

    ; Check if entity is active
    ld hl, entity_active
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    or a
    jr z, .collect_next

    ; TODO: Check if entity has COLLECTIBLE component mask

    ; Check collision against resolved hero entity
    ; Get collectible position
    ld hl, entity_x_pos
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = collectible X

    ; Get player X position
    ld hl, entity_x_pos
    ld a, (hero_entity_id)
    ld e, a
    ld d, 0
    add hl, de
    ld b, (hl)                    ; B = player X

    ; Check X distance
    sub b                         ; A = collectible_x - player_x
    ; Check if within range (-16 to +16)
    cp 240                        ; Negative check (< -16)
    jr c, .collect_next
    cp 16                         ; Positive check (> +16)
    jr nc, .collect_next

    ; X is close, check Y
    ld hl, entity_y_pos
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = collectible Y

    ld hl, entity_y_pos
    ld a, (hero_entity_id)
    ld e, a
    ld d, 0
    add hl, de
    ld b, (hl)                    ; B = player Y

    sub b                         ; A = collectible_y - player_y
    cp 240
    jr c, .collect_next
    cp 16
    jr nc, .collect_next

    ; Collision detected - collect item!
    push bc

    ; Deactivate collectible (set entity_active[c] = 0)
    ld hl, entity_active
    ld e, c
    ld d, 0
    add hl, de
    ld (hl), 0                    ; Deactivate entity
    ld hl, active_entity_list_dirty
    ld (hl), 1

    ; TODO: Increment score or item counter
    ; ld hl, player_score
    ; inc (hl)

    ; Built-in collection sound (coin)
    ld a, 4
    call play_sound_effect

    pop bc

.collect_next:
    inc c
    jr .collect_loop
    `}function Zn(){return` 
    ; ================================================================== 
        ; ENTITY MANAGEMENT FUNCTIONS(Based on EntityTemplate system) 
    ; ================================================================== 

        ; Create entity with components(A = entity ID, B = mask low byte, C = mask high byte) 
        create_entity:
    ; Guard invalid indices to avoid RAM table corruption.
            cp MAX_ENTITIES
            ret nc
; Set component mask for entity
            ld hl, entity_comp_masks
            ld e, a; Entity index
            ld d, 0
            add hl, de; HL points to entity mask
            ld (hl), b; Set component mask low byte

            ld hl, entity_comp_masks_hi
            add hl, de
            ld (hl), c; Set component mask high byte

    ; Mark entity as active
            ld hl, entity_active
            add hl, de
            ld (hl), 1                    ; entity_active[entity] = 1
            ld hl, active_entity_list_dirty
            ld (hl), 1

    ; Default job scheduler profile for newly created entities
    ; period=1 (100%), entry=0
            ld hl, entity_job_period
            add hl, de
            ld (hl), 1
            ld hl, entity_job_entry
            add hl, de
            ld (hl), 0

    ; Initialize component data based on mask
            bit 0, b; Check COMP_MASK_POSITION (low byte)
            call nz, init_entity_position

            bit 1, b; Check COMP_MASK_SPRITE (low byte)
            call nz, init_entity_sprite

    ret 

    ; ------------------------------------------------------------------
    ; entity_job_set
    ; Set/update job scheduler profile for one entity.
    ; Input:  A = entity index (0..31)
    ;         B = period in frames (0 treated as 1)
    ;         C = entry slot (wrapped to 0..period-1)
    ; Output: entity_job_period/entry updated for that entity
    ; Destroys: AF, DE, HL
    ; ------------------------------------------------------------------
entity_job_set:
            cp MAX_ENTITIES
            ret nc
            ld e, a
            ld d, 0

            ld a, b
            or a
            jr nz, entity_job_set_period_ok
            ld a, 1
entity_job_set_period_ok:
            ld b, a

            ld a, c
entity_job_set_entry_wrap:
            cp b
            jr c, entity_job_set_entry_ok
            sub b
            jr entity_job_set_entry_wrap
entity_job_set_entry_ok:
            ld c, a

            ld hl, entity_job_period
            add hl, de
            ld a, b
            ld (hl), a

            ld hl, entity_job_entry
            add hl, de
            ld a, c
            ld (hl), a
            ld a, b
            cp 1
            jr nz, entity_job_set_enable_scheduler
            ld a, c
            or a
            ret z
entity_job_set_enable_scheduler:
            ld a, 1
            ld (entity_job_scheduler_active), a
            ret

    ; ------------------------------------------------------------------
    ; entity_job_should_run_c
    ; Evaluate per-entity cadence gate for current frame.
    ; Input:  C = entity index (0..31)
    ; Output: A = 1 when entity should run this frame, 0 otherwise
    ; Destroys: AF, BC, DE, HL
    ; Notes:
    ;   - Fast path for power-of-two periods using bitmask modulo.
    ;   - Fallback path uses 16-bit frame modulo with fixed 16-iteration cost.
    ; ------------------------------------------------------------------
entity_job_should_run_c:
            ld a, c
            cp MAX_ENTITIES
            jr c, .entity_job_run_idx_ok
            xor a
            ret
.entity_job_run_idx_ok:
            push bc
            push de
            push hl

            ld e, c
            ld d, 0

            ld hl, entity_job_period
            add hl, de
            ld a, (hl)
            or a
            jr nz, entity_job_run_period_ok
            ld a, 1
entity_job_run_period_ok:
            cp 1
            jr z, entity_job_run_active
            ld b, a

            ld hl, entity_job_entry
            add hl, de
            ld a, (hl)
            ld e, a

            ; Fast modulo for power-of-two period:
            ; if (period & (period - 1)) == 0 then use AND mask.
            ld a, b
            dec a
            ld d, a                    ; D = period - 1
            ld a, d
            and b
            jr nz, entity_job_run_fallback_mod

            ld a, e
            and d
            ld e, a
            ld a, (interrupt_counter)
            and d
            cp e
            jr nz, entity_job_run_inactive
            jr entity_job_run_active

entity_job_run_fallback_mod:
            ld a, e
entity_job_run_entry_mod:
            cp b
            jr c, entity_job_run_entry_ready
            sub b
            jr entity_job_run_entry_mod
entity_job_run_entry_ready:
            ld e, a

            ; 16-bit frame modulo: (interrupt_counter % period) in A
            ; Uses shift/subtract division with fixed 16 iterations.
            ld hl, (interrupt_counter)
            xor a
            ld d, 16
entity_job_run_frame_mod16:
            add hl, hl
            adc a, a
            cp b
            jr c, entity_job_run_frame_mod16_no_sub
            sub b
entity_job_run_frame_mod16_no_sub:
            dec d
            jr nz, entity_job_run_frame_mod16

            cp e
            jr nz, entity_job_run_inactive
entity_job_run_active:
            ld a, 1
            jr entity_job_run_done
entity_job_run_inactive:
            xor a
entity_job_run_done:
            pop hl
            pop de
            pop bc
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
    `}function qn(e){const l=e.usedComponents;let a=`init_components: 
; Initialize component systems(OPTIMIZED - only used components) 
    ; Used: ${Array.from(l).join(", ")} 
 
; Initialize current screen ID(multi - screen support) 
        ld a, 0; Start at screen 0 
        ld (current_screen_id), a 
        ld (current_world_id), a
        ld (current_screen_index), a
        ld (screen_transition_cooldown), a
        ld hl, active_entity_list_dirty
        ld (hl), 1

    ; Reset collectible persistence state on new game / restart.
    ; Cartridge RAM is not guaranteed to be zeroed.
        ld hl, gem_count
        ld de, gem_count + 1
        ld bc, 354                 ; bytes to clear - 1 (gem_count..bonus_respawn_frames)
        xor a
        ld (hl), a
        ldir

    ; Clear all component masks 
        ld hl, entity_comp_masks 
        ld de, entity_comp_masks + 1 
        ld bc, 31 
        ld (hl), 0 
        ldir 

    ; Clear all component masks (high byte)
        ld hl, entity_comp_masks_hi
        ld de, entity_comp_masks_hi + 1
        ld bc, 31
        ld (hl), 0
        ldir 

    ; Initialize entity job scheduler defaults
    ; period=1 (100%), entry=0 for every entity slot
        ld hl, entity_job_period
        ld de, entity_job_period + 1
        ld bc, 31
        ld (hl), 1
        ldir

        ld hl, entity_job_entry
        ld de, entity_job_entry + 1
        ld bc, 31
        ld (hl), 0
        ldir
        xor a
        ld (entity_job_scheduler_active), a
 
    `;return a+=`    ; Initialize position system (always)
    call init_position_system
    `,l.has("Sprite")&&(a+=`    ; Initialize sprite system
    call init_sprite_system
    `),l.has("Movement")&&(a+=`    ; Initialize movement system
    call init_movement_system
    `),l.has("Collision")&&(a+=`    ; Initialize collision system
    call init_collision_system
    `),l.has("Input")&&(a+=`    ; Initialize input system
    call init_input_system
    `),l.has("Behavior")&&(a+=`    ; Initialize behavior system
    call init_behavior_system
    `),l.has("Health")&&(a+=`    ; Initialize health system
    call init_health_system
    `),(l.has("Animation")||l.has("Sprite"))&&(a+=`    ; Initialize animation state defaults (also needed by sprite rendering frame selection)
    call init_animation_system
    `),l.has("Jump")&&(a+=`    ; Initialize jump system
    call init_jump_system
    `),l.has("Gravity")&&(a+=`    ; Initialize gravity system
    call init_gravity_system
    `),a+=`    ; Initialize auto-destroy system
    call init_auto_destroy_system
    `,l.has("Cursors")&&(a+=`    ; Initialize cursors system (stub)
    call init_cursors_system
    `),l.has("StateMachine")&&(a+=`    ; Initialize state machine system (stub)
    call init_statemachine_system
    `),l.has("Carry")&&(a+=`    ; Initialize carry system (stub)
    call init_carry_system
    `),l.has("Damage")&&(a+=`    ; Initialize damage system
    call init_damage_system
    `),l.has("Shoot")&&(a+=`    ; Initialize shoot system
    call init_shoot_system
    `),a+=`    ; Initialize platform riding system
    call init_platform_riding_system
    `,l.has("WallCollision")&&(a+=`    ; Initialize wall collision system (stub)
    call init_wallcollision_system
    `),l.has("DeadlyTiles")&&(a+=`    ; Initialize deadly tile detection system
    call init_deadly_tiles_system
    `),l.has("Collectible")&&(a+=`    ; Initialize collectible system (stub)
    call init_collectible_system
    `),l.has("TileInteraction")&&(a+=`    ; Initialize tile interaction system
    call init_tile_interaction_system
    `),a+=`
    ret
    `,a}function pl(e,l="simple32k"){var b;const a=Ae(l);if(!e.entities||e.entities.length===0)return`; ==================================================================
; GAME COMPONENT SYSTEMS(SKIPPED - NO ENTITIES DETECTED)
    ; File: components.asm
        ; ==================================================================

; No entities detected in project - ECS system not needed
    ; This saves ~650 lines of unused component management code

; Constants required by state machine action handlers
ANIM_FLAG_PLAYING            EQU #01
ANIM_FLAG_LOOP               EQU #02
ANIM_FLAG_ONLY_WHEN_MOVING   EQU #04
ANIM_FLAG_COMPLETED          EQU #08
ANIM_FLAG_FORCE_UPLOAD       EQU #10
ANIM_DEFAULT_SPEED           EQU 8

COMP_POSITION   EQU 0
COMP_SPRITE     EQU 1
COMP_MOVEMENT   EQU 2
COMP_COLLISION  EQU 3
COMP_INPUT      EQU 4
COMP_BEHAVIOR   EQU 5
COMP_HEALTH     EQU 6
COMP_ANIMATION  EQU 7
COMP_JUMP       EQU 8
COMP_GRAVITY    EQU 9
COMP_DEADLY_TILES EQU 13

COMP_MASK_POSITION   EQU #0001
COMP_MASK_SPRITE     EQU #0002
COMP_MASK_MOVEMENT   EQU #0004
COMP_MASK_COLLISION  EQU #0008
COMP_MASK_INPUT      EQU #0010
COMP_MASK_BEHAVIOR   EQU #0020
COMP_MASK_HEALTH     EQU #0040
COMP_MASK_ANIMATION  EQU #0080
COMP_MASK_JUMP       EQU #0100
COMP_MASK_GRAVITY    EQU #0200
COMP_MASK_DEADLY_TILES EQU #2000
COMP_MASK_AUTO_DESTROY EQU #0400

    ; Minimal stub functions for compatibility
init_components:
    ret
init_entities:
    ret
update_all_entities:
    ret
update_player_fastpath:
    ret
execute_all_state_machines:
    ret
refresh_player_deadly_fastpath:
    ret
refresh_player_tile_interaction_fastpath:
    ret
refresh_player_state_machine_fastpath:
    ret
refresh_player_animation_fastpath:
    ret
refresh_player_sprite_fastpath:
    ret
create_entity:
    ret
entity_job_set:
    ret
entity_job_should_run_c:
    ld a, 1
    ret
force_update_entity_sprite:
    ret

mark_used_entity_list_dirty:
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ret

ensure_used_entity_list_current:
    call rebuild_used_entity_list
    ret

rebuild_used_entity_list:
    xor a
    ld (active_entity_count), a
    ld (input_entity_count), a
    ld (render_entity_count), a
    ld (collision_entity_count), a
    ld (ground_entity_count), a
    ld (anim_entity_count), a
    ld (coll_list_count), a
    ld (active_entity_list_dirty), a
    ld a, #FF
    ld (hero_entity_id), a
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
update_behavior_component:
    ret
update_health_component:
    ret
update_animation_component:
    ret
update_jump_component:
    ret
update_gravity_component:
    ret
update_slash_component:
    ret
update_auto_destroy_component:
    ret
update_cursors_component:
    ret
update_statemachine_component:
    ret
update_carry_component:
    ret
update_damage_component:
    ret
update_shoot_component:
    ret
update_wallcollision_component:
    ret
update_deadly_tiles_component:
    ret
update_collectible_component:
    ret
check_tile_interaction:
    ret
apply_collected_tiles:
    ret

init_position_system:
    ret
init_sprite_system:
    ret
init_movement_system:
    ret
init_collision_system:
    ret
init_input_system:
    ret
init_behavior_system:
    ret
init_health_system:
    ret
init_animation_system:
    ret
init_jump_system:
    ret
init_gravity_system:
    ret
init_auto_destroy_system:
    ret
init_cursors_system:
    ret
init_statemachine_system:
    ret
init_carry_system:
    ret
init_damage_system:
    ret
init_shoot_system:
    ret
init_platform_riding_system:
    ret
init_wallcollision_system:
    ret
init_deadly_tiles_system:
    ret
init_collectible_system:
    ret
init_tile_interaction_system:
    ret
init_entity_position:
    ret
init_entity_sprite:
    ret

    ; Component Data Structure EQUs (referenced by state machine actions)
entity_jump_vel_y   EQU temp_word_3
entity_slash_vel_x  EQU temp_byte_3
entity_slash_vel_y  EQU temp_byte_28
entity_jump_count   EQU temp_byte_4
entity_jump_max     EQU temp_byte_25
entity_jump_bonus   EQU temp_byte_27
entity_on_ground    EQU temp_byte_5
entity_gravity_vel  EQU temp_word_4
entity_health_current EQU temp_byte_6
entity_health_max     EQU temp_byte_7
entity_flag_deadly_tile EQU temp_byte_8
entity_deadly_collision EQU temp_byte_8
tileDead EQU tileDead_dbg
tileDeadLatched EQU tileDead_latched_dbg
tileDeadX EQU tileDead_x_dbg
tileDeadY EQU tileDead_y_dbg
tileDeadValue EQU tileDead_value_dbg
entity_invincibility_frames EQU temp_byte_9
entity_damage_amount        EQU temp_byte_10
entity_shoot_cooldown   EQU temp_byte_11
entity_shoot_sprite_id  EQU temp_byte_12
entity_shoot_speed      EQU temp_byte_13
entity_collision_layer  EQU temp_byte_14
entity_collides_with    EQU temp_byte_15
entity_platform_id      EQU temp_byte_16
entity_platform_grace   EQU temp_byte_17
entity_wall_collision_flags EQU temp_byte_18
entity_collision_hitbox_w EQU temp_byte_19
entity_collision_hitbox_h EQU temp_byte_20
entity_collision_offset_x EQU temp_byte_21
entity_collision_offset_y EQU temp_byte_22
entity_entity_collision_flags EQU temp_byte_23
entity_last_collision_entity EQU temp_byte_24

    ; ==================================================================
; END OF COMPONENTS(MINIMAL VERSION)
    ; ==================================================================
        `;const t=lt(e),o=t.usedComponents,n=Array.isArray(e.tiles)&&e.tiles.some(m=>{var y;return((((y=m.logicalProperties)==null?void 0:y.mapId)??0)&8)!==0}),s=Wn(e),r=Array.isArray(e.stateMachines)&&e.stateMachines.length>0;n&&o.has("Input")&&o.add("TileInteraction");const i=(m,y)=>{if(!m||typeof m!="object")return!1;const T=String(m.type||"").toUpperCase();if(y.has(T))return!0;const g=Array.isArray(m.conditions)?m.conditions:[];for(const A of g)if(i(A,y))return!0;return!1},c=Array.isArray(e.stateMachines)?e.stateMachines:[],d=new Set(["HAS_COLLISION","HAS_DEADLY_TILE_COLLISION"]);c.some(m=>(Array.isArray(m==null?void 0:m.transitions)?m.transitions:[]).some(T=>i(T==null?void 0:T.conditions,d)))&&!o.has("Collision")&&(console.log("  - Forcing Collision system: required by state machine conditions"),o.add("Collision")),console.log("🎯 Generating optimized components.asm..."),console.log(`  - Active entities: ${t.activeEntities.length} `),console.log(`  - Used components: ${Array.from(o).join(", ")} `),console.log(`  - Filtered out: ${8-o.size} unused components`);let p=`; ==================================================================
; GAME COMPONENT SYSTEMS - MSX ECS ENGINE
    ; File: components.asm
        ; Description: Component systems based on Mideas React.js architecture
    ; Implements Position, Sprite, Movement, Collision, Input, and Behavior systems
    ; ==================================================================
;
; INTELLIGENT FILTERING ACTIVE:
;   Active entities: ${t.activeEntities.length}
;   Used components: ${Array.from(o).join(", ")}
;   Filtered out: ${8-o.size} unused component systems
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
COMP_DEADLY_TILES EQU 13; Deadly behavior-map tile detection marker

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
COMP_MASK_AUTO_DESTROY EQU #0400; Binary: 0000010000000000
COMP_MASK_DEADLY_TILES EQU #2000; Binary: 0010000000000000

; ==================================================================
; ANIMATION FLAGS (entity_anim_flags)
; ==================================================================
ANIM_FLAG_PLAYING            EQU #01
ANIM_FLAG_LOOP               EQU #02
ANIM_FLAG_ONLY_WHEN_MOVING   EQU #04
ANIM_FLAG_COMPLETED          EQU #08
ANIM_FLAG_FORCE_UPLOAD       EQU #10
ANIM_DEFAULT_SPEED           EQU 8

    ; ==================================================================
; COMPONENT DATA STRUCTURES(Entity - Component arrays)
    ; ==================================================================

; NOTE: Core entity variables are now defined in variables.asm
    ; (entity_x_pos, entity_y_pos, entity_vel_x, entity_vel_y, entity_comp_masks, etc.)

    ; Jump Component Data(Fixed - Point 8.8 for smooth physics)
    ; Using temporary storage for optional components to save RAM
entity_jump_vel_y   EQU temp_word_3; Y velocity for jumping(signed word, 32 words = 64 bytes)
entity_slash_vel_x  EQU temp_byte_3; Additive horizontal slash velocity from bonus tiles (32 bytes)
entity_slash_vel_y  EQU temp_byte_28; Additive vertical slash velocity from bonus tiles (32 bytes)
entity_jump_count   EQU temp_byte_4; Current jump count(0 = grounded, 1 = first jump, etc.)(32 bytes)
entity_jump_max     EQU temp_byte_25; Configured max jumps for this entity (32 bytes)
entity_jump_bonus   EQU temp_byte_27; Temporary extra jumps granted by bonus tiles (32 bytes)
entity_on_ground    EQU temp_byte_5; Ground contact flag(bit 0 = on ground)(32 bytes)

    ; Gravity Component Data
entity_gravity_vel  EQU temp_word_4; Accumulated gravity velocity(signed word, 64 bytes)

    ; Health Component Data
entity_health_current EQU temp_byte_6 ; Current health/lives (32 bytes)
entity_health_max     EQU temp_byte_7 ; Maximum health/lives (32 bytes)

; Deadly Tile Collision Data
entity_flag_deadly_tile EQU temp_byte_8 ; Flag: bit 0 = touching deadly tile (32 bytes)
entity_deadly_collision EQU temp_byte_8 ; Backward-compatible alias
tileDead EQU tileDead_dbg ; Debug byte: mirrors hero deadly contact (entity 0)
tileDeadLatched EQU tileDead_latched_dbg ; Debug byte: latched hero deadly detection
tileDeadX EQU tileDead_x_dbg ; Debug byte: last sampled tile X
tileDeadY EQU tileDead_y_dbg ; Debug byte: last sampled tile Y
tileDeadValue EQU tileDead_value_dbg ; Debug byte: raw behavior byte read

    ; Damage Component Data
entity_invincibility_frames EQU temp_byte_9  ; Countdown timer for invulnerability (32 bytes)
entity_damage_amount        EQU temp_byte_10 ; Damage dealt by this entity (32 bytes)

    ; Shoot Component Data
entity_shoot_cooldown   EQU temp_byte_11 ; Cooldown frames until can shoot (32 bytes)
entity_shoot_sprite_id  EQU temp_byte_12 ; Projectile sprite ID (32 bytes)
entity_shoot_speed      EQU temp_byte_13 ; Projectile velocity (32 bytes)

    ; Collision Layer Data (for projectile and advanced collision)
entity_collision_layer  EQU temp_byte_14 ; Which layer this entity is on (32 bytes)
entity_collides_with    EQU temp_byte_15 ; Bitmask of layers this entity collides with (32 bytes)

    ; Platform Riding Data
entity_platform_id      EQU temp_byte_16 ; ID of platform underneath (255 = none) (32 bytes)
entity_platform_grace   EQU temp_byte_17 ; Grace frames for platform (32 bytes)
entity_wall_collision_flags EQU temp_byte_18 ; Directional wall collision bits (32 bytes)
entity_collision_hitbox_w EQU temp_byte_19 ; Entity collision hitbox width (32 bytes)
entity_collision_hitbox_h EQU temp_byte_20 ; Entity collision hitbox height (32 bytes)
entity_collision_offset_x EQU temp_byte_21 ; Entity collision hitbox X offset (32 bytes)
entity_collision_offset_y EQU temp_byte_22 ; Entity collision hitbox Y offset (32 bytes)
entity_entity_collision_flags EQU temp_byte_23 ; bit0 entity(any), bit1 enemy, bit2 item (32 bytes)
entity_last_collision_entity EQU temp_byte_24 ; Last collided entity index (255=none) (32 bytes)

    ; Input Disable Flag
entity_input_disabled EQU temp_byte_26 ; 0=enabled, 1=disabled (32 bytes)


    ; ==================================================================
; CORE ECS SYSTEM FUNCTIONS
    ; ==================================================================

        ${qn(t)}
`;p+=In();const h=e.sprites&&e.sprites.length>0;o.has("Sprite")||h?p+=vn():p+=`
    ; Sprite system filtered out(not used)
init_sprite_system:
    ret

update_sprite_component:
    ret

force_update_entity_sprite:
    ret
    `,o.has("Movement")?p+=Rn():p+=`
    ; Movement system filtered out(not used)
init_movement_system:
    ret

update_movement_component:
    ret
    `,o.has("Collision")?p+=wn():p+=`
    ; Collision system filtered out(not used)
init_collision_system:
    ret

update_collision_component:
    ret
    `,(o.has("Collision")||o.has("WallCollision"))&&(p+=Nn(l));const u=o.has("DeadlyTiles")||n&&o.has("Input");!o.has("WallCollision")&&(o.has("Collision")||u)&&(p+=Ra()),o.has("Input")?p+=Ln():p+=`
    ; Input system filtered out(not used)
init_input_system:
    ret

update_input_component:
    ret
    `,o.has("Behavior")?p+=Dn():p+=`
    ; Behavior system filtered out(not used)
init_behavior_system:
    ret

update_behavior_component:
    ret
    `,o.has("Health")?p+=Mn():p+=`
    ; Health system filtered out(not used)
init_health_system:
    ret

update_health_component:
    ret
    `,o.has("Animation")?p+=Un():p+=`
    ; Animation system filtered out(not used)
init_animation_system:
    ret

update_animation_component:
    ret
    `,o.has("Jump")?p+=$n():p+=`
    ; Jump system filtered out(not used)
init_jump_system:
    ret

update_jump_component:
    ret
    `,o.has("Gravity")?p+=xn():p+=`
    ; Gravity system filtered out(not used)
init_gravity_system:
    ret

update_gravity_component:
    ret
    `,p+=Bn(),o.has("Cursors")?p+=Fn():p+=`
    ; Cursors system filtered out(not used)
init_cursors_system:
    ret

update_cursors_component:
    ret
    `,o.has("StateMachine")?p+=`
    ; StateMachine system (integrates with stateMachineGenerator.ts)
    ; Note: The actual SM_Update runtime is in statemachine.asm
    ; This component iterates entities and calls SM_Update for each one

init_statemachine_system:
    ; No initialization needed - state machines are initialized
    ; when entity templates are loaded
    ret

; ------------------------------------------------------------------
; update_statemachine_component
; Update all entities with StateMachine component
; Calls SM_Update (from statemachine.asm) for each entity
; ------------------------------------------------------------------
update_statemachine_component:
    ld c, 0                       ; C = entity index

.sm_comp_loop:
    ld a, c
    cp MAX_ENTITIES
    ret z                         ; Done with all entities

    ; Check if entity is active
    ld hl, entity_active
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    or a
    jr z, .sm_comp_next           ; Entity not active, skip

    ; Check if entity has StateMachine component (bit in component mask)
    ; Note: StateMachine component mask bit should be defined in constants
    ; For now, we assume all active entities may have state machines
    ; In production, check entity_component_mask

    ; Get state machine pointer to verify it exists
    push bc
    ld b, 0                       ; BC = entity index
    ld hl, entity_sm_ptr_l
    add hl, bc
    ld e, (hl)                    ; E = ptr_low

    ld hl, entity_sm_ptr_h
    ld b, 0                       ; BC = entity index again
    add hl, bc
    ld d, (hl)                    ; D = ptr_high

    ; Check if pointer is null (DE = 0)
    ld a, d
    or e
    pop bc
    jr z, .sm_comp_next           ; No state machine, skip

    ; Call SM_Update with entity index in A
    ld a, c
    call SM_Update

.sm_comp_next:
    inc c
    jr .sm_comp_loop
    `:p+=`
    ; StateMachine system filtered out(not used)
init_statemachine_system:
    ret

update_statemachine_component:
    ret
    `,o.has("Carry")?p+=jn():p+=`
    ; Carry system filtered out(not used)
init_carry_system:
    ret

update_carry_component:
    ret
    `,o.has("Damage")?p+=Pn():p+=`
    ; Damage system filtered out(not used)
init_damage_system:
    ret

update_damage_component:
    ret
    `,o.has("Shoot")?p+=kn():p+=`
    ; Shoot system filtered out(not used)
init_shoot_system:
    ret

update_shoot_component:
    ret
    `,p+=On(),o.has("WallCollision")?p+=zn(l):p+=`
    ; WallCollision system filtered out(not used)
init_wallcollision_system:
    ret

update_wallcollision_component:
    ret
    `,o.has("DeadlyTiles")?p+=Yn():p+=`
    ; DeadlyTiles system filtered out(not used)
init_deadly_tiles_system:
    ret

update_deadly_tiles_component:
    ret
    `,o.has("Collectible")?p+=Kn():p+=`
    ; Collectible system filtered out(not used)
init_collectible_system:
    ret

update_collectible_component:
    ret
    `,n&&o.has("Input")?(p+=Qn(s,r,o.has("WallCollision")),p+=Xn(),console.log("  - Tile Interaction system: ENABLED (interactable tiles detected)")):p+=`
    ; Tile interaction system filtered out(no interactable tiles or no input)
init_tile_interaction_system:
    ret

update_slash_component:
    ret

check_tile_interaction:
    ret

; Stub: apply_collected_tiles (no interactable tiles in project)
apply_collected_tiles:
    ret
    `,p+=Zn();const f=!!((b=e.screenMaps)!=null&&b.some(m=>Array.isArray(m==null?void 0:m.effectZones)&&m.effectZones.some(y=>String((y==null?void 0:y.effectType)||"").length===0||(y==null?void 0:y.effectType)==="secretZone"||((y==null?void 0:y.mask)??0)===0)));if(p+=Cn(o,!!e.hasGameFlow,f),o.has("StateMachine")&&Array.isArray(e.stateMachines)&&e.stateMachines.length>0?p+=`
; ==================================================================
; EXECUTE ALL STATE MACHINES - Called by GameFlow
; ==================================================================
; This function executes the state machine for each entity that has one
execute_all_state_machines:
    ld hl, prof_execute_sm_calls
    inc (hl)
    jr nz, .prof_execute_sm_counted
    inc hl
    inc (hl)
.prof_execute_sm_counted:
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a                       ; Loop through used entities only
    ld hl, active_entity_list
    
.sm_loop:
    ld a, (hl)                    ; A = entity index
    inc hl                        ; Advance list pointer
    push hl                       ; Save list pointer
    ld c, a
    ld a, (player_runtime_enabled)
    or a
    jr z, .sm_entity_ready
    ld a, (player_entity_index)
    cp c
    jr z, .skip_entity
.sm_entity_ready:
    ld a, c

    ; active_entity_list already guarantees active + current_screen_id
    ld e, a                       ; DE = entity index
    ld d, 0

    ; Check if this entity has a state machine assigned
    ld hl, entity_sm_ptr_l
    add hl, de
    ld c, (hl)                    ; C = SM ptr low
    
    ld hl, entity_sm_ptr_h
    add hl, de
    ld a, (hl)                    ; A = SM ptr high
    
    ; Check if SM pointer is non-zero
    or c
    jr z, .skip_entity            ; No SM assigned, skip

    ; Entity has a state machine - execute it
    ld a, e
    push bc                       ; Preserve loop counter (B) across call
    call SM_Update                ; Execute state machine (A = entity index)
    pop bc
    
.skip_entity:
    pop hl                        ; Restore list pointer
    djnz .sm_loop                 ; Loop for all used entities
    
    ret

refresh_player_state_machine_fastpath:
    ld a, (player_runtime_enabled)
    or a
    ret z
    ld a, (player_entity_index)
    cp #FF
    ret z

    ld e, a
    ld d, 0
    ld hl, entity_sm_ptr_l
    add hl, de
    ld c, (hl)
    ld hl, entity_sm_ptr_h
    add hl, de
    ld a, (hl)
    or c
    ret z

    ld a, e
    call SM_Update
    ret

`:p+=`
; ==================================================================
; EXECUTE ALL STATE MACHINES - Called by GameFlow
; ==================================================================
; No state machines are present in this build.
execute_all_state_machines:
    ret

refresh_player_state_machine_fastpath:
    ret

`,p+=`
; ==================================================================
; TILE COLLISION SYSTEM
; ==================================================================
; Provides functions for checking collision with background tiles
; Uses behavior maps generated from screen collision layers
; ==================================================================

; ------------------------------------------------------------------
; get_tile_at_position
; Convert pixel coordinates to tile coordinates and get tile ID
; Input:  D = X position (pixels), E = Y position (pixels)
; Output: A = Tile ID at that position, Z flag set if out of bounds
; Destroys: BC, HL
; ------------------------------------------------------------------
get_tile_at_position:
    ; Convert X pixel to tile column (divide by 8 - MSX Screen 2 character cell)
    ; Screen layout is ALWAYS 32x24 grid of 8x8 cells regardless of project tile size
    ld a, d
    srl a
    srl a
    srl a                         ; A = X / 8 = tile column
    ld b, a                       ; B = tile column

    ; Convert Y pixel to tile row (divide by 8 - MSX Screen 2 character cell)
    ld a, e
    srl a
    srl a
    srl a                         ; A = Y / 8 = tile row
    ld c, a                       ; C = tile row

    ; Check bounds (assume 32x24 tile screen for now)
    ld a, b
    cp 32
    jr nc, .out_of_bounds
    ld a, c
    cp 24
    jr nc, .out_of_bounds

    ; Calculate tile index: index = row * 32 + column (16-bit to avoid overflow)
    ld l, c
    ld h, 0                       ; HL = row (16-bit)
    add hl, hl                    ; HL = row * 2
    add hl, hl                    ; HL = row * 4
    add hl, hl                    ; HL = row * 8
    add hl, hl                    ; HL = row * 16
    add hl, hl                    ; HL = row * 32
    ld e, b
    ld d, 0
    add hl, de                    ; HL = row * 32 + column

    ; Read actual tile from current screen layout
    ld de, (current_screen_layout) ; DE = pointer to screen layout data
    add hl, de                    ; HL = pointer to tile at position
${a?`    call mapper_push_p2
    ld a, (current_screen_layout_bank)
    call mapper_set_bank_p2
`:""}    ld a, (hl)                    ; A = tile ID from screen map
${a?`    push af
    call mapper_pop_p2
    pop af
`:""}
    or a                          ; Set flags based on tile ID
    ret                           ; Z flag set if tile == 0 (empty)

.out_of_bounds:
    xor a                         ; A = 0
    ret                           ; Z flag set (out of bounds)

; ------------------------------------------------------------------
; get_tile_behavior
; Get behavior/collision type of a tile
; Input:  A = Tile ID (character code from screen map)
; Output: A = Behavior flags (TILE_SOLID, TILE_PLATFORM, etc.)
; Destroys: HL
; ------------------------------------------------------------------
get_tile_behavior:
    ; Tile ID 0 is always passable (empty tile)
    or a
    jr z, .passable

    ; Look up tile behavior from tile_behavior_table
    ; The table is indexed by tile ID
    ld l, a
    ld h, 0
    ld de, tile_behavior_table
    add hl, de                    ; HL = &tile_behavior_table[tile_id]
    ld a, (hl)                    ; A = behavior flags
    ret

.passable:
    ld a, TILE_PASSABLE
    ret

; ------------------------------------------------------------------
; Tile Behavior Table
; Maps character IDs (0-255) to behavior flags
; NOTE: Wall collision uses behavior map directly (get_behavior_tile).
; This table is used by check_collision_at_point and deadly tile checks.
; Character 0 = empty (passable). Characters >= 128 = project tiles (solid).
; ------------------------------------------------------------------
tile_behavior_table:
    ; Index 0-127: Default passable (background, empty space)
    db TILE_PASSABLE              ; 0: Empty tile
    ${Array(127).fill(0).map((m,y)=>`db TILE_PASSABLE              ; ${y+1}: Passable`).join(`
    `)}

    ; Index 128-255: Project tile characters (solid by default)
    ; MSX Screen 2 assigns character IDs >= 128 to project tiles
    ${Array(128).fill(0).map((m,y)=>`db TILE_SOLID                 ; ${128+y}: Solid`).join(`
    `)}

; ------------------------------------------------------------------
; check_collision_at_point
; Check if there's a solid tile at given pixel coordinates
; Input:  D = X position, E = Y position
; Output: Z flag set if passable, cleared if solid
;         A = Behavior flags of tile at that position
; Destroys: BC, HL
; ------------------------------------------------------------------
check_collision_at_point:
    call get_tile_at_position
    ret z                         ; Out of bounds = passable
    call get_tile_behavior
    and TILE_SOLID | TILE_PLATFORM
    ret                           ; Z if passable, NZ if solid

; ------------------------------------------------------------------
; check_collision_box
; Check collision for entity bounding box (16x16)
; Input:  D = X position (top-left), E = Y position (top-left)
; Output: Z flag set if no collision, cleared if collision detected
;         A = Behavior flags of colliding tile
; Destroys: BC, HL
; ------------------------------------------------------------------
check_collision_box:
    ; Check 4 corners of 16x16 box:
    ; Top-left (X, Y)
    push de
    call check_collision_at_point
    jr nz, .collision_found

    ; Top-right (X+15, Y)
    pop de
    push de
    ld a, d
    add a, 15
    ld d, a
    call check_collision_at_point
    jr nz, .collision_found

    ; Bottom-left (X, Y+15)
    pop de
    push de
    ld a, e
    add a, 15
    ld e, a
    call check_collision_at_point
    jr nz, .collision_found

    ; Bottom-right (X+15, Y+15)
    pop de
    push de
    ld a, d
    add a, 15
    ld d, a
    ld a, e
    add a, 15
    ld e, a
    call check_collision_at_point
    jr nz, .collision_found

    ; No collision
    pop de
    xor a                         ; Z flag set
    ret

.collision_found:
    pop de
    or a                          ; Clear Z flag
    ret

; ------------------------------------------------------------------
; div_a_by_c
; Divide A by C (unsigned 8-bit division)
; Input:  A = dividend, C = divisor
; Output: A = quotient
; Destroys: B
; ------------------------------------------------------------------
div_a_by_c:
    ld b, 0                       ; B = quotient
.tile_div_loop:
    sub c
    jr c, .tile_div_done
    inc b
    jr .tile_div_loop
.tile_div_done:
    ld a, b
    ret

`,f?p+=`
; ------------------------------------------------------------------
; update_secret_zone_component
; Hero-only secret zone runtime.
; Uses hero_entity_id resolved from templates flagged with isPlayer.
; ------------------------------------------------------------------
${X({purpose:"Detect player entry/exit on secret zones and swap visible tiles.",inputs:["hero_entity_id + entity_is_player/current-screen filtering","entity_x_pos[hero], entity_y_pos[hero] as hero top-left position","runtime_effect_zone_table/current_effect_zone_count","runtime_background_layout, runtime_effects_layout, runtime_screen_layout"],outputs:["runtime_screen_layout updated when entering/leaving a secret zone","VRAM Name Table updated for affected rectangle","secret_zone_active + secret_zone_rect_* state refreshed"],clobbers:["AF","BC","DE","HL","IX"],preserved:["None"],notes:["Only secret zones are handled in this v1 runtime.","First matching zone wins when zones overlap."]})}
update_secret_zone_component:
    call resolve_runtime_hero_entity
    cp #FF
    jp z, .secret_no_match
    ld e, a
    ld d, 0

    ld hl, entity_active
    add hl, de
    ld a, (hl)
    or a
    jp z, .secret_no_match

    ld a, (current_effect_zone_count)
    or a
    jp z, .secret_no_match

    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    add a, 8
    srl a
    srl a
    srl a
    ld b, a                       ; B = hero center X in cells

    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    add a, 8
    srl a
    srl a
    srl a
    ld c, a                       ; C = hero center Y in cells

    ld a, (current_effect_zone_count)
    ld d, a                       ; D = remaining zone count
    ld ix, runtime_effect_zone_table

.secret_scan_loop:
    ld a, d
    or a
    jp z, .secret_no_match

    ld a, b                       ; hero center X
    cp (ix+0)                     ; zone.x
    jp c, .secret_next_entry
    sub (ix+0)
    ld e, a                       ; E = deltaX

    ld a, c                       ; hero center Y
    cp (ix+1)                     ; zone.y
    jp c, .secret_next_entry
    sub (ix+1)
    ld h, a                       ; H = deltaY

    ld a, (ix+2)                  ; zone.width
    cp e                          ; width > deltaX?
    jp z, .secret_next_entry
    jp c, .secret_next_entry

    ld a, (ix+3)                  ; zone.height
    cp h                          ; height > deltaY?
    jp z, .secret_next_entry
    jp c, .secret_next_entry

    ld a, (ix+4)
    cp EFFECT_TYPE_SECRET_ZONE
    jp nz, .secret_next_entry

    ld a, (secret_zone_active)
    or a
    jp z, .secret_activate_new

    ld a, (secret_zone_rect_x)
    cp (ix+0)
    jp nz, .secret_switch_zone
    ld a, (secret_zone_rect_y)
    cp (ix+1)
    jp nz, .secret_switch_zone
    ld a, (secret_zone_rect_w)
    cp (ix+2)
    jp nz, .secret_switch_zone
    ld a, (secret_zone_rect_h)
    cp (ix+3)
    jp nz, .secret_switch_zone
    ret

.secret_switch_zone:
    call secret_zone_restore_current_rect

.secret_activate_new:
    ld a, (ix+0)
    ld (secret_zone_rect_x), a
    ld a, (ix+1)
    ld (secret_zone_rect_y), a
    ld a, (ix+2)
    ld (secret_zone_rect_w), a
    ld a, (ix+3)
    ld (secret_zone_rect_h), a
    ld a, 1
    ld (secret_zone_active), a
    call secret_zone_apply_current_rect
    ret

.secret_next_entry:
    push de
    push bc
    ld bc, EFFECT_ZONE_ENTRY_SIZE
    add ix, bc
    pop bc
    pop de
    dec d                         ; decrement zone counter (NOT hero Y)
    jp .secret_scan_loop

.secret_no_match:
    ld a, (secret_zone_active)
    or a
    ret z
    call secret_zone_restore_current_rect
    call secret_zone_clear_state
    ret

; ------------------------------------------------------------------
; resolve_runtime_hero_entity
; Preferred order:
;   1) hero_entity_id if valid
;   2) first input entity of current screen
;   3) entity 0 if still active (legacy compatibility)
; Output: A = entity index, or #FF when unavailable
; Clobbers: AF, HL
; ------------------------------------------------------------------
resolve_runtime_hero_entity:
    ld a, (hero_entity_id)
    cp #FF
    ret nz
    ld a, (input_entity_count)
    or a
    jr z, .resolve_legacy_entity0
    ld hl, input_entity_list
    ld a, (hl)
    ld (hero_entity_id), a
    ret

.resolve_legacy_entity0:
    ld a, (entity_active)
    or a
    jr z, .resolve_none
    xor a
    ld (hero_entity_id), a
    ret

.resolve_none:
    ld a, #FF
    ret

; ------------------------------------------------------------------
; secret_zone_apply_current_rect
; Copy active rect from runtime_effects_layout to runtime_screen_layout and VRAM.
; ------------------------------------------------------------------
secret_zone_apply_current_rect:
    call secret_zone_compute_offset
    push hl
    ld de, runtime_effects_layout
    add hl, de
    ex de, hl
    pop hl
    push de
    ld de, runtime_screen_layout
    add hl, de
    ex de, hl
    pop hl
    ld a, (secret_zone_rect_w)
    ld c, a
    ld a, (secret_zone_rect_h)
    call copy_layout_rect_ram_to_ram

    call secret_zone_compute_offset
    push hl
    ld de, runtime_screen_layout
    add hl, de
    pop de
    push hl
    ld hl, NAMETBL
    add hl, de
    ex de, hl
    pop hl
    ld a, (secret_zone_rect_w)
    ld c, a
    ld a, (secret_zone_rect_h)
    call copy_layout_rect_to_vram
    ret

; ------------------------------------------------------------------
; secret_zone_restore_current_rect
; Restore active rect from runtime_background_layout into runtime_screen_layout and VRAM.
; ------------------------------------------------------------------
secret_zone_restore_current_rect:
    call secret_zone_compute_offset
    push hl
    ld de, runtime_background_layout
    add hl, de
    ex de, hl
    pop hl
    push de
    ld de, runtime_screen_layout
    add hl, de
    ex de, hl
    pop hl
    ld a, (secret_zone_rect_w)
    ld c, a
    ld a, (secret_zone_rect_h)
    call copy_layout_rect_ram_to_ram

    call secret_zone_compute_offset
    push hl
    ld de, runtime_screen_layout
    add hl, de
    pop de
    push hl
    ld hl, NAMETBL
    add hl, de
    ex de, hl
    pop hl
    ld a, (secret_zone_rect_w)
    ld c, a
    ld a, (secret_zone_rect_h)
    call copy_layout_rect_to_vram
    ret

; ------------------------------------------------------------------
; secret_zone_clear_state
; ------------------------------------------------------------------
secret_zone_clear_state:
    xor a
    ld (secret_zone_active), a
    ld (secret_zone_rect_x), a
    ld (secret_zone_rect_y), a
    ld (secret_zone_rect_w), a
    ld (secret_zone_rect_h), a
    ret

; ------------------------------------------------------------------
; secret_zone_compute_offset
; Output: HL = row*32 + col for current secret rect origin
; Clobbers: AF, DE, HL
; ------------------------------------------------------------------
secret_zone_compute_offset:
    ld a, (secret_zone_rect_y)
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld a, (secret_zone_rect_x)
    ld e, a
    ld d, 0
    add hl, de
    ret

`:p+=`
update_secret_zone_component:
    ret

`,o.has("WallCollision")){const m=Ra(),y=p.indexOf(m),T=p.lastIndexOf(m);y!==-1&&T!==-1&&y!==T&&(p=p.slice(0,y)+p.slice(y+m.length))}return p+=`
    ; ==================================================================
; END OF COMPONENT SYSTEMS
    ; ==================================================================
        `,p}function Jn(e){var T,g,A,S;const l=(E,C)=>{if(typeof E=="boolean")return E;if(typeof E=="number")return E!==0;if(typeof E=="string"){const v=E.trim().toLowerCase();if(v==="true")return!0;if(v==="false")return!1;const R=parseInt(v,10);if(!Number.isNaN(R))return R!==0}return C},a=(E,C)=>{const v=typeof E=="number"?E:parseInt(String(E??""),10);return Number.isNaN(v)?C:Math.max(0,Math.min(255,v|0))},t=(E,C)=>{const v=typeof E=="number"?E:parseInt(String(E??""),10);return Number.isNaN(v)?C&255:v<0?256+Math.max(-128,Math.min(-1,v|0))&255:Math.max(0,Math.min(255,v|0))},o=E=>{const C=typeof E=="number"?E:parseInt(String(E??""),10);return Number.isNaN(C)?1:C>=1&&C<=4?C|0:C===100?1:C===50?2:C===33?3:C===25?4:1},n=(E,C)=>{const v=Math.max(1,C|0),R=typeof E=="number"?E:parseInt(String(E??""),10);return((Number.isNaN(R)?0:R|0)%v+v)%v},s=E=>(E&255).toString(16).toUpperCase().padStart(2,"0"),r=E=>{const C=(E==null?void 0:E.screenAssetId)||(E==null?void 0:E.screenId)||(E==null?void 0:E.screenMapId);if(C){const x=e.worldmaps||[];for(const k of x){const z=((k==null?void 0:k.nodes)||[]).findIndex(V=>(V==null?void 0:V.screenAssetId)===C);if(z>=0)return z}}if(typeof(E==null?void 0:E.screenIndex)=="number"&&E.screenIndex>=0)return E.screenIndex;let v=0,R=null;if(e.screenMaps&&e.screenMaps.forEach((x,k)=>{var z;(((z=x==null?void 0:x.layers)==null?void 0:z.entities)||[]).some(V=>V.id===E.id)&&(v=k,R=x.id||null)}),!R)return v;const L=e.worldmaps||[];for(const x of L){const O=((x==null?void 0:x.nodes)||[]).findIndex(z=>(z==null?void 0:z.screenAssetId)===R);if(O>=0)return O}return v},i=E=>{const C={};if(!E||E.length===0)return C;let v=1;return E.forEach(R=>{!R||!R.id||C[R.id]===void 0&&(C[R.id]=v,R.name&&(C[String(R.name)]=v,C[String(R.name).toLowerCase()]=v),v<255&&(v+=1))}),C},d=lt(e).activeEntities,_=2,p=16,h=i(e.templates),u=Array.isArray(e.templates)&&e.templates.some(E=>l(E==null?void 0:E.isPlayer,!1)),f=E=>String(E??"entity").toUpperCase().replace(/[^A-Z0-9]/g,"_").replace(/^_+|_+$/g,"")||"ENTITY",b=new Map,m=d.map((E,C)=>{const v=f((E==null?void 0:E.name)||`ENTITY_${C}`),R=(b.get(v)||0)+1;return b.set(v,R),R===1?v:`${v}_${R}`});console.log("🎯 Generating optimized entities.asm..."),console.log(`  - Total entity templates in JSON: ${((T=e.templates)==null?void 0:T.length)||0}`),console.log(`  - Actually instantiated entities: ${d.length}`),console.log(`  - Filtered out: ${(((g=e.templates)==null?void 0:g.length)||0)-d.length} unused templates`);let y=`; ==================================================================
; GAME ENTITIES
; File: entities.asm
; Description: Game entity definitions and behavior
; ==================================================================
;
; INTELLIGENT FILTERING ACTIVE:
;   Entity templates in project: ${((A=e.templates)==null?void 0:A.length)||0}
;   Actually instantiated: ${d.length}
;   Filtered out: ${(((S=e.templates)==null?void 0:S.length)||0)-d.length} unused templates
;
; ==================================================================

`;if(d.length>0){y+=`; ==================================================================
; ENTITY DEFINITIONS
; ==================================================================

`,d.forEach((C,v)=>{var k;const R=m[v],L=(k=e.templates)==null?void 0:k.find(O=>O.id===C.entityTemplateId),x=Ca(C,L,e);y+=`; Entity: ${C.name} (instance from template: ${C.entityTemplateId})
ENTITY_${R}_ID EQU ${v}
ENTITY_${R}_COMP_MASK EQU #${x.toString(16).toUpperCase().padStart(2,"0")}  ; Component mask: ${x.toString(2).padStart(8,"0")}b
`,C.entityTemplateId&&(y+=`; Template: ${C.entityTemplateId}
`),C.position&&(y+=`ENTITY_${R}_X EQU ${C.position.x}
ENTITY_${R}_Y EQU ${C.position.y}
`),y+=`
`}),y+=`; ==================================================================
; ENTITY MANAGEMENT FUNCTIONS
; ==================================================================

init_entities:
    ; Initialize all active game entities (${d.length} entities)

    ; Ensure sprite system is reset whenever entities are initialized
    call init_sprites
    call init_player_fast_runtime

    ; CRITICAL: Clear ALL entity component masks to prevent ghost entities
    ; RAM may contain random data - entities 0..N will be set by create_entity
    ld hl, entity_comp_masks
    ld de, entity_comp_masks+1
    ld bc, 31                  ; Clear 32 bytes (32-1 for LDIR)
    ld (hl), 0
    ldir

    ld hl, entity_comp_masks_hi
    ld de, entity_comp_masks_hi+1
    ld bc, 31
    ld (hl), 0
    ldir

    ; Clear entity screen IDs to prevent ghost entities on restart
    ld hl, entity_screen_id
    ld de, entity_screen_id+1
    ld bc, 31
    ld (hl), 0
    ldir

    ; Clear entity player-role flags
    ld hl, entity_is_player
    ld de, entity_is_player+1
    ld bc, 31
    ld (hl), 0
    ldir

    ; Clear entity template tokens
    ld hl, entity_template_token
    ld de, entity_template_token+1
    ld bc, 31
    ld (hl), 0
    ldir

    ; Clear facing-direction cache so first-frame ChangeSprite does not
    ; redirect through stale RAM garbage from a previous run/screen.
    ld hl, entity_facing_dir
    ld de, entity_facing_dir+1
    ld bc, 31
    ld (hl), 0
    ldir
    
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

    ld hl, entity_sm_wait_timer
    ld de, entity_sm_wait_timer+1
    ld bc, 31
    ld (hl), 0
    ldir
    
`,d.length>0?d.forEach((C,v)=>{const R=m[v];y+=`    call init_${R.toLowerCase()}
`}):y+=`    ; No entities to initialize
`,y+=`    call init_player_from_hero_entity
    ret

update_entities:
    ; Update all active entities (${d.length} entities)
`,d.length>0?d.forEach((C,v)=>{const R=m[v];y+=`    ; Skip entity update if entity belongs to another screen
    ld hl, entity_screen_id + ${v}
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_update_${v}
    ; Run per-entity update
    call update_${R.toLowerCase()}
.skip_update_${v}:
`}):y+=`    ; No entities to update
`,y+=`    ret

`;let E=!1;d.forEach((C,v)=>{var Jt,ea,ta,aa,la,oa,na,ra,ia,sa,da,ca,_a,pa,ha,ua;const R=m[v],L=(Jt=e.templates)==null?void 0:Jt.find(Y=>Y.id===C.entityTemplateId),x=Ca(C,L,e),k=(x&_)!==0,O=(x&p)!==0,z=!!((ea=L==null?void 0:L.components)!=null&&ea.some(Y=>(Y==null?void 0:Y.definitionId)==="comp_player_input"||(Y==null?void 0:Y.definitionId)==="comp_input")),V=u?l(L==null?void 0:L.isPlayer,!1):z,N=o((C==null?void 0:C.jobRate)??(C==null?void 0:C.jobPeriod)),M=n(C==null?void 0:C.jobEntry,N);k&&O&&(E=!0);const U=((ta=C.position)==null?void 0:ta.x)||100,I=((aa=C.position)==null?void 0:aa.y)||100,P=8,$=8,j=U*P,q=I*$,H=Math.min(j,240),le=Math.min(q,191);(j!==H||q!==le)&&console.warn(`Entity ${C.name} position clamped: (${j},${q}) → (${H},${le})`);const Z=[];x&1&&Z.push("Position"),x&2&&Z.push("Sprite"),x&4&&Z.push("Movement"),x&8&&Z.push("Collision"),x&16&&Z.push("Input"),x&32&&Z.push("Behavior"),x&64&&Z.push("Health"),x&128&&Z.push("Animation"),x&256&&Z.push("Jump"),x&512&&Z.push("Gravity"),x&8192&&Z.push("DeadlyTiles");let G=15,W=2;if(x&16){const Y=L==null?void 0:L.components.find(oe=>oe.definitionId==="comp_cursors"||oe.definitionId==="comp_input"||oe.definitionId==="comp_player_input");if(Y){const oe=Y.defaultValues||{},pe=((la=C.componentOverrides)==null?void 0:la.comp_cursors)||{},J={...oe,...pe};W=Math.max(1,a(J.speed??2,2)),G=0,J.allowUp!==!1&&(G|=1),J.allowDown!==!1&&(G|=2),J.allowLeft!==!1&&(G|=4),J.allowRight!==!1&&(G|=8)}}let ee=1;if(x&256){const Y=(oa=L==null?void 0:L.components)==null?void 0:oa.find(oe=>oe.definitionId==="comp_jump");if(Y){const oe=Y.defaultValues||{},pe=((na=C.componentOverrides)==null?void 0:na.comp_jump)||{},J={...oe,...pe};ee=Math.max(1,a(J.maxJumps??1,1))}}const te=[];G&1&&te.push("UP"),G&2&&te.push("DOWN"),G&4&&te.push("LEFT"),G&8&&te.push("RIGHT");const we=te.length===4?"All directions":te.join("+");let ye="";if(x&128){const Y=(ra=L==null?void 0:L.components)==null?void 0:ra.find(ot=>ot.definitionId==="comp_animation"||ot.definitionName==="Animation"),oe=(Y==null?void 0:Y.defaultValues)||(Y==null?void 0:Y.values)||{},pe=((ia=C.componentOverrides)==null?void 0:ia.comp_animation)||{},J={...oe,...pe},he=a(J.currentFrameIndex??J.currentFrame??0,0),be=Math.max(1,a(J.animationSpeed??6,6)),me=l(J.loops,!0),ve=l(J.isPlaying,!0),Qe=l(J.animateOnlyWhenMoving,!1),wt=(ve?1:0)|(me?2:0)|(Qe?4:0);ye=`
    ; Initialize Animation component
    ld hl, entity_anim_frame
    add hl, de
    ld (hl), #${he.toString(16).toUpperCase().padStart(2,"0")}           ; currentFrameIndex

    ld hl, entity_anim_tick
    add hl, de
    ld (hl), 0                ; tick counter

    ld hl, entity_anim_speed
    add hl, de
    ld (hl), #${be.toString(16).toUpperCase().padStart(2,"0")}           ; animationSpeed

    ld hl, entity_anim_flags
    add hl, de
    ld (hl), #${wt.toString(16).toUpperCase().padStart(2,"0")}           ; flags (playing/loop/onlyWhenMoving)
`}let Ne="",re=!1,_e=0,fe=0,Le=0,De=0,Ce=0,Ie=0;const Xt=(sa=L==null?void 0:L.components)==null?void 0:sa.find(Y=>Y.definitionId==="comp_patrol");if(Xt){re=!0;const Y=Xt.defaultValues||{},oe=((da=C.componentOverrides)==null?void 0:da.comp_patrol)||{},pe={...Y,...oe};_e=Math.max(0,Math.min(255,Number(pe.waypoint1_x)||0)),fe=Math.max(0,Math.min(191,Number(pe.waypoint1_y)||0)),Le=Math.max(0,Math.min(255,Number(pe.waypoint2_x??_e))),De=Math.max(0,Math.min(191,Number(pe.waypoint2_y??fe)));const J=Le-_e,he=De-fe,be=Math.sqrt(J*J+he*he),me=Number(pe.speed)||1;be>0&&(Ce=Math.round(J/be*me),Ie=Math.round(he/be*me),J!==0&&Ce===0&&(Ce=J>0?1:-1),he!==0&&Ie===0&&(Ie=he>0?1:-1));const ve=Ce>=0?Ce:256+Ce,Qe=Ie>=0?Ie:256+Ie;Ne=`
    ; === Patrol Component Init ===
    ; Waypoints: (${_e}, ${fe}) -> (${Le}, ${De})
    ; Override position with waypoint1
    ld hl, entity_x_pos
    add hl, de
    ld (hl), ${_e}         ; Start X = waypoint1_x

    ld hl, entity_y_pos
    add hl, de
    ld (hl), ${fe}         ; Start Y = waypoint1_y

    ; Set patrol velocity
    ld hl, entity_vel_x
    add hl, de
    ld (hl), ${ve}           ; VelX = ${Ce>=0?"+":""}${Ce}

    ld hl, entity_vel_y
    add hl, de
    ld (hl), ${Qe}           ; VelY = ${Ie>=0?"+":""}${Ie}
`}let Kt="";if(x&8){const Y=(ca=L==null?void 0:L.components)==null?void 0:ca.find(ma=>ma.definitionId==="comp_collision"||ma.definitionName==="Collision"),oe=(Y==null?void 0:Y.defaultValues)||{},pe=((_a=C.componentOverrides)==null?void 0:_a.comp_collision)||{},J={...oe,...pe},he=a(J.hitboxWidth,16),be=a(J.hitboxHeight,16),me=t(J.offsetX,0),ve=t(J.offsetY,0),Qe=me>=128?me-256:me,wt=ve>=128?ve-256:ve,ot=a(J.collisionLayer,1),Tl=a(J.collidesWith,255);Kt=`
    ; Initialize Collision component (hitbox + layer masks)
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld (hl), #${s(he)}      ; hitboxWidth

    ld hl, entity_collision_hitbox_h
    add hl, de
    ld (hl), #${s(be)}      ; hitboxHeight

    ld hl, entity_collision_offset_x
    add hl, de
    ld (hl), #${s(me)}      ; offsetX (${Qe})

    ld hl, entity_collision_offset_y
    add hl, de
    ld (hl), #${s(ve)}      ; offsetY (${wt})

    ld hl, entity_collision_layer
    add hl, de
    ld (hl), #${s(ot)}      ; collisionLayer

    ld hl, entity_collides_with
    add hl, de
    ld (hl), #${s(Tl)}      ; collidesWith
`}let Zt="";const vt=(pa=C.componentOverrides)==null?void 0:pa.comp_statemachine,Rt=(ha=L==null?void 0:L.components)==null?void 0:ha.find(Y=>Y.definitionId==="comp_statemachine"),qt=(vt==null?void 0:vt.stateMachineAssetId)||((ua=Rt==null?void 0:Rt.defaultValues)==null?void 0:ua.stateMachineAssetId);if(qt&&e.stateMachines){const Y=e.stateMachines.find(oe=>oe.id===qt);if(Y&&Y.states&&Y.states.length>0){let oe=Y.states[0];if(Y.initialStateId){const he=Y.states.find(be=>be.id===Y.initialStateId);he&&(oe=he)}const J=`SM_${Y.name.replace(/[^a-zA-Z0-9]/g,"_")}_${oe.id.replace(/[^a-zA-Z0-9]/g,"_")}`;Zt=`
    ; Initialize State Machine pointer to initial state (${Y.name})
    ld hl, ${J}          ; HL = initial state address
    ld a, l
    ld (entity_sm_ptr_l + ${v}), a   ; SM ptr low byte
    ld a, h
    ld (entity_sm_ptr_h + ${v}), a   ; SM ptr high byte

    ; Fire OnEnter of initial state immediately.
    ; Normally OnEnter fires via SM_ChangeState, but the first state is set
    ; directly (no transition). Without this call, ChangeSprite / other
    ; OnEnter actions never run and entity_sprite_asset_index stays at 0.
    ; State data layout: [ID:1][OnEnter ptr:2][OnExit ptr:2][Transitions ptr:2]
    ld hl, ${J} + 1      ; HL = &OnEnter Actions Ptr field
    ld e, (hl)
    inc hl
    ld d, (hl)                    ; DE = OnEnter Actions Ptr (0 if none)
    ld a, ${v}                ; A = entity index
    call SM_ExecuteActions        ; safe: SM_ExecuteActions returns immediately if DE=0
`}}let D="";if(re){k&&(E=!0);const Y=Math.min(_e,Le),oe=Math.max(_e,Le),pe=Math.min(fe,De),J=Math.max(fe,De),he=_e!==Le,be=fe!==De,me=be?`.patrol_check_y_${v}`:`.patrol_end_${v}`;D=`update_${R.toLowerCase()}:
`,D+=`    ; Update ${C.name} - Patrol bounce
`,D+=`    ; Waypoints: (${_e}, ${fe}) -> (${Le}, ${De})
`,D+=`    ld e, ${v}             ; Entity index
`,D+=`    ld d, 0
`,he&&(D+=`
    ; --- X axis bounce ---
`,D+=`    ld hl, entity_vel_x
`,D+=`    add hl, de
`,D+=`    ld a, (hl)
`,D+=`    or a
`,D+=`    jp z, ${me}
`,D+=`    bit 7, a
`,D+=`    jp nz, .patrol_chk_min_x_${v}
`,D+=`
    ; Moving right: x >= ${oe}?
`,D+=`    ld hl, entity_x_pos
`,D+=`    add hl, de
`,D+=`    ld a, (hl)
`,D+=`    cp ${oe}
`,D+=`    jp c, ${me}
`,D+=`    ; Bounce: negate vel_x
`,D+=`    ld hl, entity_vel_x
`,D+=`    add hl, de
`,D+=`    ld a, (hl)
`,D+=`    neg
`,D+=`    ld (hl), a
`,D+=`    jp ${me}
`,D+=`
.patrol_chk_min_x_${v}:
`,D+=`    ; Moving left: x <= ${Y}?
`,D+=`    ld hl, entity_x_pos
`,D+=`    add hl, de
`,D+=`    ld a, (hl)
`,D+=`    cp ${Y+1}
`,D+=`    jp nc, ${me}
`,D+=`    ; Bounce: negate vel_x
`,D+=`    ld hl, entity_vel_x
`,D+=`    add hl, de
`,D+=`    ld a, (hl)
`,D+=`    neg
`,D+=`    ld (hl), a
`),be&&(he&&(D+=`
.patrol_check_y_${v}:
`),D+=`
    ; --- Y axis bounce ---
`,D+=`    ld hl, entity_vel_y
`,D+=`    add hl, de
`,D+=`    ld a, (hl)
`,D+=`    or a
`,D+=`    jp z, .patrol_end_${v}
`,D+=`    bit 7, a
`,D+=`    jp nz, .patrol_chk_min_y_${v}
`,D+=`
    ; Moving down: y >= ${J}?
`,D+=`    ld hl, entity_y_pos
`,D+=`    add hl, de
`,D+=`    ld a, (hl)
`,D+=`    cp ${J}
`,D+=`    jp c, .patrol_end_${v}
`,D+=`    ; Bounce: negate vel_y
`,D+=`    ld hl, entity_vel_y
`,D+=`    add hl, de
`,D+=`    ld a, (hl)
`,D+=`    neg
`,D+=`    ld (hl), a
`,D+=`    jp .patrol_end_${v}
`,D+=`
.patrol_chk_min_y_${v}:
`,D+=`    ; Moving up: y <= ${pe}?
`,D+=`    ld hl, entity_y_pos
`,D+=`    add hl, de
`,D+=`    ld a, (hl)
`,D+=`    cp ${pe+1}
`,D+=`    jp nc, .patrol_end_${v}
`,D+=`    ; Bounce: negate vel_y
`,D+=`    ld hl, entity_vel_y
`,D+=`    add hl, de
`,D+=`    ld a, (hl)
`,D+=`    neg
`,D+=`    ld (hl), a
`),D+=`
.patrol_end_${v}:
`,k&&(D+=`    ; Sync sprite facing with current patrol velocity
`,D+=`    call update_entity_patrol_facing
`),D+=`    ret
`}else D=`update_${R.toLowerCase()}:
`,D+=`    ; Update ${C.name} logic with real behavior
`,D+=`    ; Check if entity has input component (player entities)
`,D+=`    ld a, ${v}
`,D+=`    ld hl, entity_comp_masks
`,D+=`    ld e, a
`,D+=`    ld d, 0
`,D+=`    add hl, de
`,D+=`    ld a, (hl)
`,D+=`    and COMP_MASK_INPUT
`,D+=`    ret z                      ; Skip if no input component

`,D+=`    ; This is a player entity - update based on input
`,D+=`    ; Input velocity is already calculated in UPDATE_INPUT_COMPONENT
`,D+=`    ; Position update happens in UPDATE_POSITION_COMPONENT
`,D+=`    ret
`;const Sl=r(C),Al=h[C.entityTemplateId]??0;y+=`init_${R.toLowerCase()}:
    ; Initialize ${C.name} at real position from JSON
    ; JSON position: (${U}, ${I}) tiles = (${H}, ${le}) pixels
    ; Template: ${C.entityTemplateId}
    ; Components: ${Z.join(", ")}
    ; Direction mask: #${G.toString(16).toUpperCase().padStart(2,"0")} (${G.toString(2).padStart(4,"0")}b) = ${we}

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ; Mask is 16-bit: B=low byte, C=high byte
    ld a, ${v}             ; Entity ID
    ld b, #${(x&255).toString(16).toUpperCase().padStart(2,"0")}              ; Mask low byte
    ld c, #${(x>>8&255).toString(16).toUpperCase().padStart(2,"0")}              ; Mask high byte
    call create_entity         ; Create with actual components from template

    ; Configure per-entity job cadence
    ; period: ${N} frame(s), entry: ${M}
    ld a, ${v}
    ld b, ${N}
    ld c, ${M}
    call entity_job_set

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, ${v}             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), ${H}         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), ${le}         ; Set real Y position from JSON

    ; Set entity screen ID (for multi-screen support)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), ${Sl}                 ; Screen ID (world node index / fallback screen index)

    ld hl, entity_is_player
    add hl, de
    ld (hl), ${V?1:0}                 ; Player/hero marker from template

    ; Template token for state-machine template-aware actions
    ld hl, entity_template_token
    add hl, de
    ld (hl), ${Al}

${k&&O?`    ; Deterministic spawn facing: right.
    ; This keeps the first SM ChangeSprite aligned with the same default
    ; world-facing direction used by Preview/runtime web.
    ld hl, entity_facing_dir
    add hl, de
    ld (hl), 2

`:""}
${ye}
${Ne}
${Kt}
${k?`    ; Set sprite pattern and color (renderable entity)
    ld hl, sprite_pattern
    add hl, de
    ld (hl), ${v*4}          ; Use entity index * 4 for 16x16 sprites

    ld hl, sprite_color
    add hl, de
    ld (hl), ${v%14+2}                ; Distinct color for debugging
`:`    ; Anchor/reference entity - no sprite allocation needed
`}

    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #${G.toString(16).toUpperCase().padStart(2,"0")}            ; Direction restrictions: ${we}

    ; Set input speed for Cursors component (if entity has Input component)
    ld hl, entity_input_speed
    add hl, de
    ld (hl), ${W}            ; Cursor speed (px/frame)

${x&256?`    ; Set Jump component configuration
    ld hl, entity_jump_max
    add hl, de
    ld (hl), ${ee}            ; Maximum jumps before touching ground

`:""}
${k?`    ; Force update sprite attributes only if entity is in current screen
    ld hl, entity_screen_id + ${v}
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_force_show_${v}

    ; Force update sprite attributes (using correct multi-layer config)
    ld c, ${v}             ; Entity Index
    call force_update_entity_sprite
.skip_force_show_${v}:

`:`    ; No sprite to show for this entity
`}
${Zt}
    ret

${D}
`}),E&&(y+=`
; ------------------------------------------------------------------
; update_entity_patrol_facing
; Input: DE = entity index
; Updates entity_sprite_asset_index using directional lookup tables.
; ------------------------------------------------------------------
update_entity_patrol_facing:
    push af
    push bc
    push hl

    ; Guard invalid DE index coming from callers.
    ld a, d
    or a
    jp nz, .patrol_facing_done
    ld a, e
    cp MAX_ENTITIES
    jp nc, .patrol_facing_done

    ; Read base sprite asset index from ROM init table.
    ; This keeps patrol facing within the entity's directional family
    ; and avoids getting stuck in an unrelated 1-layer sprite asset.
    ld hl, entity_sprite_asset_index_init
    add hl, de
    ld a, (hl)
    cp #FF
    jp z, .patrol_facing_done
    cp SPRITE_ASSET_COUNT
    jp nc, .patrol_facing_done
    ld c, a
    ld b, 0

    ; Prefer horizontal facing when vel_x != 0
    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    or a
    jr z, .check_vertical
    bit 7, a
    jr nz, .use_left
    ld hl, sprite_dir_right_table
    jr .apply_lookup

.use_left:
    ld hl, sprite_dir_left_table
    jr .apply_lookup

.check_vertical:
    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)
    or a
    jr z, .patrol_facing_done
    bit 7, a
    jr nz, .use_up
    ld hl, sprite_dir_down_table
    jr .apply_lookup

.use_up:
    ld hl, sprite_dir_up_table

.apply_lookup:
    add hl, bc
    ld a, (hl)

    ld hl, entity_sprite_asset_index
    add hl, de
    cp (hl)
    jr z, .patrol_facing_done
    ld (hl), a

    ; Reset animation progression when directional variant changes.
    ; Without this, switching to a variant with fewer frames can leave
    ; entity_anim_frame out of range until the next animation wrap.
    ld hl, entity_anim_frame
    add hl, de
    ld (hl), 0

    ld hl, entity_anim_tick
    add hl, de
    ld (hl), 0

.patrol_facing_done:
    pop hl
    pop bc
    pop af
    ret

`),y+=`; ------------------------------------------------------------------
; init_player_fast_runtime
; Reset the dedicated player fast-path runtime mirror.
; ------------------------------------------------------------------
init_player_fast_runtime:
    xor a
    ld (player_runtime_enabled), a
    ld (player_vx_runtime), a
    ld (player_vy_runtime), a
    ld (player_x), a
    ld (player_x+1), a
    ld (player_y), a
    ld (player_y+1), a
    ld a, #FF
    ld (player_entity_index), a
    ret

; ------------------------------------------------------------------
; init_player_from_hero_entity
; Seed player fast-path runtime from current hero_entity_id when available.
; Safe to call before hero_entity_id has been resolved.
; ------------------------------------------------------------------
init_player_from_hero_entity:
    ld a, (hero_entity_id)
    cp #FF
    ret z
    ld (player_entity_index), a
    ld c, a
    ld a, 1
    ld (player_runtime_enabled), a

    ld e, c
    ld d, 0

    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld (player_x), a
    xor a
    ld (player_x+1), a

    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld (player_y), a
    xor a
    ld (player_y+1), a

    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    ld (player_vx_runtime), a

    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)
    ld (player_vy_runtime), a
    ret
`}else y+=`; ==================================================================
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

`;return y+=`; ==================================================================
; END OF ENTITIES
; ==================================================================
`,y}const wa="SCREEN 2 (Graphics I)";function Ee(e,l,a=0,t=255){return Number.isFinite(e)?e<a?a:e>t?t:Math.floor(e):l}function Mt(e){return String(e||"").trim().toLowerCase()}function er(e){const l=String(e||"").trim();if(!l)return null;const a=l.match(/^(.*?)(?:[_\-\s](?:f|frame))(\d+)$/i);if(!a)return null;const t=String(a[1]||"").trim(),o=parseInt(a[2],10);return!t||Number.isNaN(o)?null:{groupId:t,frameOrder:o}}const hl={rotate_left:1,rotate_right:2,shift_left:3,shift_right:4,shift_up:5,shift_down:6,swap_top_bottom:7};function tr(e){return String(e||"").trim().toLowerCase()==="transform"?"transform":"frames"}function ul(e){const l=String(e||"").trim().toLowerCase();return l&&Object.prototype.hasOwnProperty.call(hl,l)?l:null}function ar(e){const l=(e==null?void 0:e.animation)??(e==null?void 0:e.animatedTile)??(e==null?void 0:e.tileAnimation)??null;if((typeof(l==null?void 0:l.enabled)=="boolean"?l.enabled:typeof(e==null?void 0:e.isAnimated)=="boolean"?e.isAnimated:void 0)===!1||l===!1)return{enabled:!1,mode:"frames",groupId:null,frameOrder:null,speed:null,baseTileId:null,transformEffect:null,transformIncludeColors:!0,transformCheckpoints:null};const t=(e==null?void 0:e.animationGroup)??(l==null?void 0:l.groupId)??(l==null?void 0:l.group)??(l==null?void 0:l.name)??(l==null?void 0:l.id)??null,o=typeof t=="string"&&t.trim()?t.trim():null,n=(e==null?void 0:e.animationFrameIndex)??(e==null?void 0:e.frameIndex)??(l==null?void 0:l.frameIndex)??(l==null?void 0:l.frame)??null,s=Number.isFinite(Number(n))?Ee(Number(n),0):null,r=(e==null?void 0:e.animationSpeed)??(e==null?void 0:e.animationSpeedFrames)??(l==null?void 0:l.speed)??(l==null?void 0:l.speedFrames)??(l==null?void 0:l.ticksPerFrame)??null,i=Number.isFinite(Number(r))?Ee(Number(r),8,1,255):null,c=(e==null?void 0:e.animationBaseTileId)??(l==null?void 0:l.baseTileId)??(l==null?void 0:l.targetTileId)??null,d=typeof c=="string"&&c.trim()?c.trim():null,_=(l==null?void 0:l.transform)??null,p=ul((e==null?void 0:e.animationTransformEffect)??(l==null?void 0:l.transformEffect)??(_==null?void 0:_.effect)??(l==null?void 0:l.effect)),h=(e==null?void 0:e.animationMode)??(l==null?void 0:l.mode)??(l==null?void 0:l.animationMode)??(p?"transform":null),u=tr(h),f=p||(u==="transform"?"rotate_left":null),b=(e==null?void 0:e.animationTransformIncludeColors)??(l==null?void 0:l.animationTransformIncludeColors)??(_==null?void 0:_.includeColors),m=typeof b=="boolean"?b:!0,y=(e==null?void 0:e.animationTransformCheckpoints)??(l==null?void 0:l.animationTransformCheckpoints)??(_==null?void 0:_.checkpoints),T=Number.isFinite(Number(y))?Ee(Number(y),8,1,255):null;return{enabled:!0,mode:u,groupId:o,frameOrder:s,speed:i,baseTileId:d,transformEffect:f,transformIncludeColors:m,transformCheckpoints:T}}function lr(e){const l=new Map,a=Array.isArray(e.tiles)?e.tiles:[];let t=128;return a.forEach((o,n)=>{if(!(o!=null&&o.id))return;const s=Math.max(1,Math.ceil((o.width||8)/8)),r=Math.max(1,Math.ceil((o.height||8)/8)),i=s*r;l.set(o.id,{charCode:t,charsPerTile:i,tileIndex:n}),t+=i}),l}function or(e){return`#${Ee(e,0).toString(16).toUpperCase().padStart(2,"0")}`}function Na(e,l){return String(e||"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"")||l}function nr(e,l=16){if(!e.length)return"    db #00";const a=[];for(let t=0;t<e.length;t+=l){const o=e.slice(t,t+l).map(or).join(", ");a.push(`    db ${o}`)}return a.join(`
`)}function rr(e,l,a){const t=e.slice(),o=Math.max(0,a|0);for(let n=0;n<t.length;n++){let s=t[n]&255;for(let r=0;r<o;r++)switch(l){case 1:s=(s<<1|s>>7)&255;break;case 2:s=(s>>1|(s&1)<<7)&255;break;case 3:s=s<<1&255;break;case 4:s=s>>1&255;break}t[n]=s}return t}function La(e,l,a){const t=e.slice();if(l===7)return(a&1)===0?t:[t[7],t[1],t[2],t[3],t[4],t[5],t[6],t[0]];const o=a%8;return o===0?t:l===5?t.slice(o).concat(t.slice(0,o)):l===6?t.slice(8-o).concat(t.slice(0,8-o)):t}function ir(e,l,a,t,o,n){const s=[];for(let r=0;r<n;r++){const i=[];for(let c=0;c<a;c++){const d=c*8,_=e.slice(d,d+8),p=l.slice(d,d+8),h=t<=4?rr(_,t,r):La(_,t,r),u=t>=5&&o?La(p,t,r):p;i.push(...h,...u)}s.push({tileName:`transform_step_${r}`,bytes:i})}return s}function ml(e){var i,c;const l=Array.isArray(e.tiles)?e.tiles:[];if(!l.length)return{frameGroups:[],transformGroups:[]};const a=lr(e),t=new Map;l.forEach(d=>{d!=null&&d.id&&t.set(d.id,d)});const o=new Map,n=[],s=[];l.forEach((d,_)=>{const p=String((d==null?void 0:d.id)||"").trim();if(!p)return;const h=a.get(p);if(!h)return;const u=ar(d);if(!u.enabled)return;const f=er((d==null?void 0:d.name)||""),b=(u.groupId||(f==null?void 0:f.groupId)||(d==null?void 0:d.name)||p||"").trim();if(u.mode==="transform"){const A=ul(u.transformEffect);if(!A)return;const E=(u.baseTileId&&a.has(u.baseTileId)?u.baseTileId:null)||p,C=a.get(E);if(!C)return;const v=C.charCode,R=C.charsPerTile;if(v<0||v+R-1>255)return;const L=hl[A];if(!L)return;const x=u.transformIncludeColors?1:0,k=`anim_transform_${n.length}_${Na(b,`t${n.length}`)}`,O=t.get(E);if(!O)return;const z=R*8,V=Array.from(yt(O,wa)||[]);if(V.length!==z)return;const N=Et(O),M=241,U=N?Array.from(N).slice(0,z):new Array(z).fill(M);for(;U.length<z;)U.push(M);const I=Ee(u.transformCheckpoints??8,8,1,255);n.push({label:k,groupId:b,speed:Ee(u.speed??8,8,1,255),targetTileId:E,targetCharCode:v,charsPerTile:R,operationCode:L,flags:x}),s.push({label:k,groupId:b,speed:Ee(u.speed??8,8,1,255),targetTileId:E,targetCharCode:v,charsPerTile:R,frameCount:I,bytesPerFrame:R*16,frames:ir(V,U,R,L,u.transformIncludeColors,I)});return}if(!b)return;let m=u.frameOrder;m===null&&f&&(!u.groupId||Mt(u.groupId)===Mt(f.groupId))&&(m=f.frameOrder),m===null&&(m=h.tileIndex);const y=Ee(u.speed??8,8,1,255),T=Mt(b),g=o.get(T)||[];g.push({tile:d,tileIndex:_,tileId:p,groupId:b,frameOrder:m,speed:y,baseTileId:u.baseTileId}),o.set(T,g)});const r=[];for(const d of o.values()){if(d.length<2)continue;const _=[...d].sort((E,C)=>E.frameOrder!==C.frameOrder?E.frameOrder-C.frameOrder:E.tileIndex-C.tileIndex),h=((i=_.find(E=>!!E.baseTileId&&a.has(E.baseTileId)))==null?void 0:i.baseTileId)||null||_[0].tileId,u=a.get(h);if(!u)continue;const f=_.filter(E=>{const C=a.get(E.tileId);return!!C&&C.charsPerTile===u.charsPerTile});if(f.length<2)continue;const b=u.charCode,m=u.charsPerTile;if(b<0||b+m-1>255)continue;const y=[],T=m*8;let g=f[0].speed;for(const E of f){const C=Array.from(yt(E.tile,wa)||[]);if(C.length!==T)continue;const v=Et(E.tile),R=241,L=v?Array.from(v).slice(0,T):new Array(T).fill(R);for(;L.length<T;)L.push(R);const x=[];for(let k=0;k<m;k++){const O=k*8;x.push(...C.slice(O,O+8)),x.push(...L.slice(O,O+8))}y.push({tileName:String(((c=E.tile)==null?void 0:c.name)||E.tileId),bytes:x}),g=Math.min(g,E.speed)}if(y.length<2)continue;const A=f[0].groupId,S=`anim_group_${r.length}_${Na(A,`g${r.length}`)}`;r.push({label:S,groupId:A,speed:Ee(g,8,1,255),targetTileId:h,targetCharCode:b,charsPerTile:m,frameCount:Ee(y.length,y.length,2,255),bytesPerFrame:m*16,frames:y})}return{frameGroups:[...r,...s],transformGroups:n}}function sr(e){const{frameGroups:l}=ml(e);return l.map(a=>({groupId:a.groupId,targetTileId:a.targetTileId,targetCharCode:a.targetCharCode,charsPerTile:a.charsPerTile,speed:a.speed,frameCount:a.frameCount}))}function dr(e,l="simple32k"){var m,y;const{frameGroups:a,transformGroups:t}=ml(e),o=a.length>0,n=t.length>0,s=Ee(((m=a[0])==null?void 0:m.speed)??((y=t[0])==null?void 0:y.speed)??8,8,1,255),r=Math.max(1,a.length+t.length),i=o?a.map(T=>`    db ${T.targetCharCode}, ${T.charsPerTile}, ${T.frameCount}, ${T.speed}, ${T.bytesPerFrame}    ; ${T.groupId} -> tile ${T.targetTileId}
    dw ${T.label}`).join(`
`):"    ; No animated tile groups detected in project data",c="    ; Transform groups are precomputed as frame data in anim_tile_table",d=o?a.map(T=>{const g=T.frames.slice(0,T.frameCount).map((A,S)=>`    ; Frame ${S}: ${A.tileName}
${nr(A.bytes)}`).join(`
`);return`${T.label}:
    ; Group "${T.groupId}" targetChar=${T.targetCharCode} chars=${T.charsPerTile}
${g}
`}).join(`
`):`anim_group_empty_data:
    db #00
`,_=Ae(l),b=[o?`${_?`    call mapper_push_p2
    ld a, ANIM_TILE_DATA_BANK
    call mapper_set_bank_p2
`:""}
    ld hl, anim_tile_table

.anim_vram_loop:
    ld a, (hl)                      ; A = target char code
    cp 255
    jr z, .anim_vram_done

    push af                         ; Save target char code
    inc hl
    ld a, (hl)                      ; A = chars per tile
    push af
    inc hl
    ld b, (hl)                      ; B = frame count
    inc hl
    inc hl                          ; Skip speed byte (reserved)
    ld c, (hl)                      ; C = bytes per frame
    inc hl
    ld e, (hl)                      ; DE = data pointer
    inc hl
    ld d, (hl)
    inc hl                          ; HL = next table entry
    push hl
    ex de, hl                       ; HL = data pointer

    ; frame = global_frame % frame_count
    ; Fast path for power-of-two frame counts: frame & (count-1)
    ld a, b
    dec a
    ld d, a
    and b
    jr nz, .anim_mod_slow
    ld a, (anim_tile_frame)
    and d
    jr .anim_mod_done
.anim_mod_slow:
    ld a, (anim_tile_frame)
.anim_mod_loop:
    cp b
    jr c, .anim_mod_done
    sub b
    jr .anim_mod_loop
.anim_mod_done:

    ; DE = frame offset (frame * bytes_per_frame)
    ld b, a
    ld d, 0
    ld e, 0
.anim_mul_loop:
    ld a, b
    or a
    jr z, .anim_mul_done
    ld a, e
    add a, c
    ld e, a
    ld a, d
    adc a, 0
    ld d, a
    dec b
    jr .anim_mul_loop
.anim_mul_done:
    add hl, de                      ; HL = frame data pointer

    pop de                          ; DE = next table entry pointer
    pop af
    ld b, a                         ; B = chars per tile
    pop af
    ld c, a                         ; C = target char code
    push de

.anim_char_loop:
    ld a, b
    or a
    jr z, .anim_char_done

    push bc
    push hl
    ld a, c
    call anim_upload_char_frame
    pop hl
    pop bc

    ld de, 16
    add hl, de                      ; Next char frame chunk
    inc c                           ; Next target char code
    dec b
    jr .anim_char_loop

.anim_char_done:
    pop de
    ex de, hl                       ; HL = next table entry
    jr .anim_vram_loop

.anim_vram_done:
${_?"    call mapper_pop_p2":""}`:"",""].filter(Boolean).join(`
`);return`; ==================================================================
; ANIMATED TILES SYSTEM
; File: animtiles.asm
; Description: Background tile animation for water, lava, fire, etc.
; ==================================================================

; Auto-detected animated groups:
;   frame groups: ${a.length}
;   transform groups: ${t.length}

; ==================================================================
; ANIMATED TILES CONSTANTS
; ==================================================================

; Animation speeds (in frames)
ANIM_SPEED_SLOW         EQU 15      ; ~250ms (water)
ANIM_SPEED_MEDIUM       EQU 8       ; ~133ms (lava)
ANIM_SPEED_FAST         EQU 4       ; ~66ms (fire)

; Maximum animated tiles
MAX_ANIM_TILES          EQU ${r}
ANIM_TILE_ENTRY_SIZE    EQU 7       ; char, chars, frames, speed, bytesPerFrame, ptr(2)
ANIM_TRANS_ENTRY_SIZE   EQU 4       ; char, chars, opCode, flags
ANIM_TILE_DATA_BANK     EQU ((anim_tile_table - #4000) / #2000)

; ==================================================================
; ANIMATED TILES INITIALIZATION
; ==================================================================

init_animated_tiles:
    ; Initialize animation variables
    xor a
    ld (anim_tile_timer), a
    ld (anim_tile_frame), a

    ; Set default global animation speed
    ld a, ${s}
    ld (anim_tile_speed), a

    ; Upload initial animation frame state immediately
    call update_animated_tiles_vram

    ret

; ==================================================================
; ANIMATED TILES UPDATE FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; update_animated_tiles
; Update animation frame and redraw animated tiles if needed
; Call this every frame from main loop
; ------------------------------------------------------------------
update_animated_tiles:
${e.screenMaps&&e.screenMaps.length>0?`    ; Skip animation work on screens with no animated tile groups
    ld a, (current_screen_anim_group_count)
    or a
    ret z

`:""}    ; Increment timer
    ld a, (anim_tile_timer)
    inc a
    ld (anim_tile_timer), a

    ; Check if it's time to advance frame
    ld b, a
    ld a, (anim_tile_speed)
    or a
    jr nz, .anim_speed_ok
    ld a, 1
    ld (anim_tile_speed), a
.anim_speed_ok:
    cp b
    ret nc                          ; Not yet time to update (timer < speed)

    ; Reset timer
    xor a
    ld (anim_tile_timer), a

    ; Advance global animation counter
    ld a, (anim_tile_frame)
    inc a
    ld (anim_tile_frame), a

    ; Update all animated tiles in VRAM
    call update_animated_tiles_vram

    ret

; ------------------------------------------------------------------
; update_animated_tiles_vram
; Update pattern data in VRAM for all animated tiles
; This updates the actual tile patterns based on current frame
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
update_animated_tiles_vram:
    ; Protect VDP port sequence from ISR VRAM writes.
    ; Always re-enables on exit (see FAST_LDIRVM note on LD A,I bug).
    di
${b}
    ei
    ret

; ------------------------------------------------------------------
; set_animation_speed
; Set global animation speed for all animated tiles
; Input:  A = Speed (frames between updates)
; ------------------------------------------------------------------
set_animation_speed:
    or a
    jr nz, .anim_speed_store
    ld a, 1
.anim_speed_store:
    ld (anim_tile_speed), a
    ret

; ------------------------------------------------------------------
; anim_copy_8_bytes
; Copy 8 bytes from CPU memory to VRAM
; Input: DE = source pointer, HL = VRAM destination
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
anim_copy_8_bytes:
    ld b, 8
.anim_copy_loop:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_copy_loop

    ret

; ==================================================================
; anim_upload_char_frame
; Upload one animated char (pattern + color) to all 3 Screen 2 banks
; Input: A = target char code, HL = source frame chunk (16 bytes)
; Source layout: 8 pattern bytes + 8 color bytes
; Destroys: AF, BC, DE, HL
; ==================================================================
anim_upload_char_frame:
    push af
    push bc
    push de
    push hl

    ; BC = target char offset (charCode * 8)
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    ld b, h
    ld c, l

    pop hl
    ex de, hl                      ; DE = source pattern pointer

    ; Pattern bank 0
    push de
    ld hl, CHRTBL2
    add hl, bc
    push bc
    call anim_copy_8_bytes
    pop bc
    pop de

    ; Pattern bank 1
    push de
    ld hl, CHRTBL2 + #800
    add hl, bc
    push bc
    call anim_copy_8_bytes
    pop bc
    pop de

    ; Pattern bank 2
    ld hl, CHRTBL2 + #1000
    add hl, bc
    push bc
    call anim_copy_8_bytes
    pop bc

    ; DE now points to color bytes (source + 8)
    ; Color bank 0
    push de
    ld hl, CLRTBL2
    add hl, bc
    push bc
    call anim_copy_8_bytes
    pop bc
    pop de

    ; Color bank 1
    push de
    ld hl, CLRTBL2 + #800
    add hl, bc
    push bc
    call anim_copy_8_bytes
    pop bc
    pop de

    ; Color bank 2
    ld hl, CLRTBL2 + #1000
    add hl, bc
    push bc
    call anim_copy_8_bytes
    pop bc

    pop de
    pop bc
    pop af
    ret

; ==================================================================
; TRANSFORM MODE ROUTINES (Z80 runtime bit/row transforms)
; ==================================================================

; ------------------------------------------------------------------
; Routine: update_animated_transform_tiles_vram
; Purpose:
;   Applies Z80 transform operations directly on tile bytes in VRAM.
; Input:
;   None
; Output:
;   None
; Modifies:
;   AF, BC, DE, HL
; Preserves:
;   IX, IY, SP
; Flags:
;   Not preserved
; Stack:
;   Uses PUSH/POP HL, BC and DE internally
; ------------------------------------------------------------------
update_animated_transform_tiles_vram:
${n?`    ld hl, anim_transform_table

.anim_transform_loop:
    ld a, (hl)                      ; A = target char code
    cp 255
    ret z

    ld c, a                         ; C = first char code
    inc hl
    ld b, (hl)                      ; B = chars per tile
    inc hl
    ld d, (hl)                      ; D = operation code
    inc hl
    ld a, (hl)                      ; A = flags
    ld (anim_tile_transform_flags), a
    inc hl                          ; HL = next table entry
    push hl

.anim_transform_char_loop:
    ld a, b
    or a
    jr z, .anim_transform_next

    push bc
    push de
    ld a, c
    call anim_transform_char_frame
    pop de
    pop bc

    inc c
    dec b
    jr .anim_transform_char_loop

.anim_transform_next:
    pop hl
    jr .anim_transform_loop`:"    ret"}

; ------------------------------------------------------------------
; Routine: anim_transform_char_frame
; Purpose:
;   Transform one character pattern in all SCREEN 2 banks.
; Input:
;   A = character code
;   D = transform operation code
;   (anim_tile_transform_flags).bit0 = transform color rows too
; Output:
;   None
; Modifies:
;   AF, BC, DE, HL
; Preserves:
;   IX, IY, SP
; Flags:
;   Not preserved
; Stack:
;   Pushes/pops BC, DE and HL
; ------------------------------------------------------------------
anim_transform_char_frame:
    push bc
    push de
    push hl

    ; BC = charCode * 8 (row offset in pattern/color tables)
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    ld b, h
    ld c, l

    ; Save opcode D to scratch RAM so anim_transform_vram_block can reload it
    ; after DE is reused internally as a pointer.
    ld a, d
    ld (anim_tile_transform_flags + 1), a

    ; Pattern banks: read bank 0 once and mirror the transformed result to all 3
    ; SCREEN 2 banks to keep animation phase identical across thirds.
    ld hl, CHRTBL2
    add hl, bc
    call anim_transform_vram_block

    ; anim_transform_vram_block reuses DE internally, so reload the opcode
    ; from scratch RAM before deciding whether color rows also need a transform.
    ld a, (anim_tile_transform_flags + 1)
    cp 5
    jr c, .anim_transform_char_done

    ld a, (anim_tile_transform_flags)
    and 1
    jr z, .anim_transform_char_done

    ; Color banks: same approach, read bank 0 and mirror to all 3 banks.
    ld a, (anim_tile_transform_flags + 1)
    ld d, a
    ld hl, CLRTBL2
    add hl, bc
    call anim_transform_vram_block

.anim_transform_char_done:
    pop hl
    pop de
    pop bc
    ret

; ------------------------------------------------------------------
; Routine: anim_transform_vram_block
; Purpose:
;   Apply transform to one 8-byte VRAM block (one char rows table).
; Input:
;   HL = VRAM base address for row 0 (8 consecutive bytes)
;   D  = operation code:
;        1 rotate_left  (RLCA)
;        2 rotate_right (RRCA)
;        3 shift_left   (SLA)
;        4 shift_right  (SRL)
;        5 shift_up rows
;        6 shift_down rows
;        7 swap top/bottom row
; Output:
;   None
; Modifies:
;   AF, BC, DE, HL
; Preserves:
;   IX, IY, SP
; Flags:
;   Not preserved
; Stack:
;   Uses stack while reading row bytes
; ------------------------------------------------------------------
anim_transform_vram_block:
    ; HL = VRAM base address for bank 0. The routine captures the source rows
    ; from bank 0, transforms them in RAM, then writes the same result to the
    ; three SCREEN 2 banks. This prevents per-bank phase drift.
    ld a, d
    cp 5
    jr nc, .anim_transform_vertical

    ; Step 1: Read bank 0 into the RAM buffer.
    push hl
    ld de, anim_tile_row_buffer
    ld b, 8
.anim_read_horiz_loop:
    push hl
    call FAST_RDVRM                 ; A = row byte from VRAM[HL]
    pop hl
    ld (de), a
    inc de
    inc hl
    djnz .anim_read_horiz_loop
    pop hl

    ; Step 2: Transform the buffered bytes in RAM.
    ld de, anim_tile_row_buffer
    ld b, 8
    ld a, (anim_tile_transform_flags + 1)
    ld c, a
.anim_apply_horiz_loop:
    ld a, (de)
    push de
    push bc
    ld b, a
    ld a, c
    cp 1
    jr nz, .anim_not_rl3
    ld a, b
    rlca
    jr .anim_store_h
.anim_not_rl3:
    cp 2
    jr nz, .anim_not_rr3
    ld a, b
    rrca
    jr .anim_store_h
.anim_not_rr3:
    cp 3
    jr nz, .anim_not_sla3
    ld a, b
    sla a
    jr .anim_store_h
.anim_not_sla3:
    ld a, b
    srl a
.anim_store_h:
    pop bc
    pop de
    ld (de), a
    inc de
    djnz .anim_apply_horiz_loop

    ; Step 3: Mirror the transformed buffer to the 3 pattern/color banks.
    push hl
    ld de, anim_tile_row_buffer
    ld b, 8
.anim_write_bank0_loop:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_bank0_loop
    pop hl

    push hl
    ld de, #0800
    add hl, de
    ld de, anim_tile_row_buffer
    ld b, 8
.anim_write_bank1_loop:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_bank1_loop
    pop hl

    ld de, #1000
    add hl, de
    ld de, anim_tile_row_buffer
    ld b, 8
.anim_write_bank2_loop:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_bank2_loop
    ret

.anim_transform_vertical:
    ; Step 1: Read bank 0 into the RAM buffer.
    push de
    ld de, anim_tile_row_buffer
    ld b, 8
.anim_read_rows_loop:
    push hl
    call FAST_RDVRM                 ; A = row byte
    pop hl
    ld (de), a
    inc de
    inc hl
    djnz .anim_read_rows_loop
    pop de

    ; Restore HL to the start of bank 0 and reload the opcode scratch byte.
    ld de, #FFF8
    add hl, de

    ld a, (anim_tile_transform_flags + 1)
    cp 5
    jr nz, .anim_not_shift_up

    ; shift_up: row0<-row1 ... row6<-row7 row7<-row0(original)
    push hl
    ld de, anim_tile_row_buffer + 1
    ld b, 7
.anim_write_up_b0:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_up_b0
    ld a, (anim_tile_row_buffer)
    call FAST_WRTVRM
    pop hl

    push hl
    ld de, #0800
    add hl, de
    ld de, anim_tile_row_buffer + 1
    ld b, 7
.anim_write_up_b1:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_up_b1
    ld a, (anim_tile_row_buffer)
    call FAST_WRTVRM
    pop hl

    ld de, #1000
    add hl, de
    ld de, anim_tile_row_buffer + 1
    ld b, 7
.anim_write_up_b2:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_up_b2
    ld a, (anim_tile_row_buffer)
    call FAST_WRTVRM
    ret

.anim_not_shift_up:
    cp 6
    jr nz, .anim_not_shift_down

    ; shift_down: row0<-row7(original) row1<-row0 ... row7<-row6
    push hl
    ld a, (anim_tile_row_buffer + 7)
    call FAST_WRTVRM
    inc hl
    ld de, anim_tile_row_buffer
    ld b, 7
.anim_write_dn_b0:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_dn_b0
    pop hl

    push hl
    ld de, #0800
    add hl, de
    ld a, (anim_tile_row_buffer + 7)
    call FAST_WRTVRM
    inc hl
    ld de, anim_tile_row_buffer
    ld b, 7
.anim_write_dn_b1:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_dn_b1
    pop hl

    ld de, #1000
    add hl, de
    ld a, (anim_tile_row_buffer + 7)
    call FAST_WRTVRM
    inc hl
    ld de, anim_tile_row_buffer
    ld b, 7
.anim_write_dn_b2:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_dn_b2
    ret

.anim_not_shift_down:
    ; swap_top_bottom: row0<->row7, middle rows unchanged
    push hl
    ld a, (anim_tile_row_buffer + 7)
    call FAST_WRTVRM
    inc hl
    ld de, anim_tile_row_buffer + 1
    ld b, 6
.anim_write_sw_mid_b0:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_sw_mid_b0
    ld a, (anim_tile_row_buffer)
    call FAST_WRTVRM
    pop hl

    push hl
    ld de, #0800
    add hl, de
    ld a, (anim_tile_row_buffer + 7)
    call FAST_WRTVRM
    inc hl
    ld de, anim_tile_row_buffer + 1
    ld b, 6
.anim_write_sw_mid_b1:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_sw_mid_b1
    ld a, (anim_tile_row_buffer)
    call FAST_WRTVRM
    pop hl

    ld de, #1000
    add hl, de
    ld a, (anim_tile_row_buffer + 7)
    call FAST_WRTVRM
    inc hl
    ld de, anim_tile_row_buffer + 1
    ld b, 6
.anim_write_sw_mid_b2:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_sw_mid_b2
    ld a, (anim_tile_row_buffer)
    call FAST_WRTVRM
    ret

; ==================================================================
; ANIMATED TILE DEFINITIONS (AUTO-GENERATED)
; ==================================================================

; ------------------------------------------------------------------
; Animated tile mapping table
; Format:
;   db targetCharCode, charsPerTile, numFrames, speed, bytesPerFrame
;   dw frameDataPointer
; ------------------------------------------------------------------
anim_tile_table:
${i}
    db 255                          ; End marker

; ------------------------------------------------------------------
; Transform tile mapping table
; Format:
;   db targetCharCode, charsPerTile, opCode, flags
; flags:
;   bit0 = apply vertical transform on color rows
; ------------------------------------------------------------------
anim_transform_table:
${c}
    db 255                          ; End marker

; ==================================================================
; ANIMATION FRAME DATA
; ==================================================================
${d}

; ------------------------------------------------------------------
; register_animated_tile
; Runtime registration is not supported in this generator version.
; Input:  A = Tile ID to animate
;         B = Number of frames (2-4)
;         C = Animation speed
; Output: A = 0 if failed (table full), 1 if success
; Destroys: AF, DE, HL
; ------------------------------------------------------------------
register_animated_tile:
    xor a                           ; Not supported (static generated table)
    ret

; ------------------------------------------------------------------
; get_tile_animation_frame
; Get current animation frame for a tile
; Input:  A = target char code
; Output: A = Current frame index (mod numFrames), or 0 if not animated
; Destroys: BC, DE, HL
; ------------------------------------------------------------------
get_tile_animation_frame:
    ld c, a                         ; C = char code to search
    ld hl, anim_tile_table

.anim_search_loop:
    ld a, (hl)
    cp 255
    jr z, .anim_not_found
    cp c
    jr z, .anim_found_tile

    ld de, ANIM_TILE_ENTRY_SIZE
    add hl, de
    jr .anim_search_loop

.anim_found_tile:
    inc hl
    inc hl
    ld b, (hl)                      ; B = numFrames
    ld a, (anim_tile_frame)
.anim_found_mod:
    cp b
    jr c, .anim_found_done
    sub b
    jr .anim_found_mod
.anim_found_done:
    ret

.anim_not_found:
    xor a
    ret

; ==================================================================
; END OF ANIMATED TILES SYSTEM
; ==================================================================
`}const Oe=32,Ue=24,Da=16,cr=64,ke={secretZone:0,wind:1,water:2,customGravity:3,icePhysics:4,spriteConceal:5},Ve={left:0,right:1,up:2,down:3};function Pe(e,l=0){return Number.isFinite(e)?Math.max(0,Math.min(255,e))&255:l&255}function _r(e,l){return Gt(l,e.tileBankAssetId)}function xa(e,l,a,t){const o={...e,activeAreaX:0,activeAreaY:0,activeAreaWidth:Oe,activeAreaHeight:Ue,layers:{...e.layers,background:e.layers[l]}};return Array.from(jl(o,a.tiles||[],t,"SCREEN 2 (Graphics I)"))}function Te(e,l,a=[]){let t=`${e}:
`;for(const o of a)t+=`    ; ${o}
`;if(l.length===0)return t+=`    DB #00
`,t;for(let o=0;o<l.length;o+=Da){const s=l.slice(o,o+Da).map(r=>`#${r.toString(16).padStart(2,"0").toUpperCase()}`);t+=`    DB ${s.join(",")}
`}return t}function pr(e){var a;const l=e.presentationScreen;return l!=null&&l.enabled?Array.isArray((a=l.data)==null?void 0:a.nameTable)&&l.data.nameTable.length===Oe*Ue:!1}function Ma(e,l,a){if(!pr(e))return`show_presentation_screen:
    ret

`;const o=e.presentationScreen,n=Ae(a),s=a==="plain48k"&&al(e,a),r=Math.max(o.data.patternBank0.length,o.data.patternBank1.length,o.data.patternBank2.length),i=Math.max(o.data.colorBank0.length,o.data.colorBank1.length,o.data.colorBank2.length),c=o.data.nameTable.length;let d=`; ==================================================================
; PRESENTATION SCREEN DATA
; ==================================================================

; Presentation Screen runtime config
; PRESENTATION_SCREEN_COMPRESS_NAMETBL: ${o.compression.compressNameTable?1:0}
; PRESENTATION_SCREEN_COMPRESS_PATTERNS: ${o.compression.compressPatterns?1:0}
; PRESENTATION_SCREEN_COMPRESS_COLORS: ${o.compression.compressColors?1:0}
${s?`; PRESENTATION_SCREEN_ROM_DATA_GROUP: page0
`:`PRESENTATION_SCREEN_NAMETBL_BANK EQU ((PRESENTATION_SCREEN_NAMETBL - #4000) / #2000)
PRESENTATION_SCREEN_PATTERNS_B0_BANK EQU ((PRESENTATION_SCREEN_PATTERNS_B0 - #4000) / #2000)
PRESENTATION_SCREEN_PATTERNS_B1_BANK EQU ((PRESENTATION_SCREEN_PATTERNS_B1 - #4000) / #2000)
PRESENTATION_SCREEN_PATTERNS_B2_BANK EQU ((PRESENTATION_SCREEN_PATTERNS_B2 - #4000) / #2000)
PRESENTATION_SCREEN_COLORS_B0_BANK EQU ((PRESENTATION_SCREEN_COLORS_B0 - #4000) / #2000)
PRESENTATION_SCREEN_COLORS_B1_BANK EQU ((PRESENTATION_SCREEN_COLORS_B1 - #4000) / #2000)
PRESENTATION_SCREEN_COLORS_B2_BANK EQU ((PRESENTATION_SCREEN_COLORS_B2 - #4000) / #2000)
`}PRESENTATION_SCREEN_NAMETBL_SIZE EQU ${c}
PRESENTATION_SCREEN_PATTERN_B0_SIZE EQU ${o.data.patternBank0.length}
PRESENTATION_SCREEN_PATTERN_B1_SIZE EQU ${o.data.patternBank1.length}
PRESENTATION_SCREEN_PATTERN_B2_SIZE EQU ${o.data.patternBank2.length}
PRESENTATION_SCREEN_COLOR_B0_SIZE EQU ${o.data.colorBank0.length}
PRESENTATION_SCREEN_COLOR_B1_SIZE EQU ${o.data.colorBank1.length}
PRESENTATION_SCREEN_COLOR_B2_SIZE EQU ${o.data.colorBank2.length}
PRESENTATION_SCREEN_MAX_PATTERN_SIZE EQU ${r}
PRESENTATION_SCREEN_MAX_COLOR_SIZE EQU ${i}

`;return s?d+=`; Data labels are emitted in page0.asm for linear 48K builds.
`:(d+=Te("PRESENTATION_SCREEN_NAMETBL",o.data.nameTable,[`${o.name} - Name table (32x24)`]),d+=`
`,d+=Te("PRESENTATION_SCREEN_PATTERNS_B0",o.data.patternBank0,[`${o.name} - Pattern bank 0`]),d+=`
`,d+=Te("PRESENTATION_SCREEN_PATTERNS_B1",o.data.patternBank1,[`${o.name} - Pattern bank 1`]),d+=`
`,d+=Te("PRESENTATION_SCREEN_PATTERNS_B2",o.data.patternBank2,[`${o.name} - Pattern bank 2`]),d+=`
`,d+=Te("PRESENTATION_SCREEN_COLORS_B0",o.data.colorBank0,[`${o.name} - Color bank 0`]),d+=`
`,d+=Te("PRESENTATION_SCREEN_COLORS_B1",o.data.colorBank1,[`${o.name} - Color bank 1`]),d+=`
`,d+=Te("PRESENTATION_SCREEN_COLORS_B2",o.data.colorBank2,[`${o.name} - Color bank 2`])),d+=`
${X({purpose:"Wait a configurable number of frames after showing the presentation screen.",inputs:["B = frame count"],outputs:["None"],clobbers:["AF","B"],preserved:["BC","DE","HL","IX","IY"]})}presentation_wait_frames:
    push bc
    ld a, b
    or a
    jr z, .pwf_done
.pwf_loop:
    halt
    djnz .pwf_loop
.pwf_done:
    pop bc
    ret

${X({purpose:"Wait for trigger/space press and release after showing the presentation screen.",inputs:["None"],outputs:["None"],clobbers:["AF"],preserved:["BC","DE","HL","IX","IY"]})}presentation_wait_for_fire:
.pwff_wait_press:
    halt
    ld a, 0
    call GTTRIG
    or a
    jr z, .pwff_wait_press
.pwff_wait_release:
    halt
    ld a, 0
    call GTTRIG
    or a
    jr nz, .pwff_wait_release
    ret

${X({purpose:"Show the imported fullscreen presentation image in SCREEN 2.",inputs:["None"],outputs:["None"],clobbers:["AF","BC","DE","HL"],preserved:["IX","IY"],notes:["Loads pattern/color banks 0..2 and the 32x24 name table.","Optional wait/key behavior comes from Presentation Screen config."]})}show_presentation_screen:
    call DISSCR
    ld a, 2
    call CHGMOD
`,o.runtime.clearSpritesBeforeShow&&l&&(d+=`    call clear_all_sprites
    call update_sprites_to_vram
`),d+=s?`    ; Page 0 data is ZX0-compressed: decompress to RAM first, then upload to VRAM.
    ld hl, PRESENTATION_SCREEN_PATTERNS_B0
    ld de, ZX0_TILE_PATTERN_BUFFER
    call page0_decompress_to_ram
    ld hl, ZX0_TILE_PATTERN_BUFFER
    ld de, CHRTBL2
    ld bc, PRESENTATION_SCREEN_PATTERN_B0_SIZE
    call FAST_LDIRVM

    ld hl, PRESENTATION_SCREEN_PATTERNS_B1
    ld de, ZX0_TILE_PATTERN_BUFFER
    call page0_decompress_to_ram
    ld hl, ZX0_TILE_PATTERN_BUFFER
    ld de, CHRTBL2 + #800
    ld bc, PRESENTATION_SCREEN_PATTERN_B1_SIZE
    call FAST_LDIRVM

    ld hl, PRESENTATION_SCREEN_PATTERNS_B2
    ld de, ZX0_TILE_PATTERN_BUFFER
    call page0_decompress_to_ram
    ld hl, ZX0_TILE_PATTERN_BUFFER
    ld de, CHRTBL2 + #1000
    ld bc, PRESENTATION_SCREEN_PATTERN_B2_SIZE
    call FAST_LDIRVM

    ld hl, PRESENTATION_SCREEN_COLORS_B0
    ld de, ZX0_TILE_COLOR_BUFFER
    call page0_decompress_to_ram
    ld hl, ZX0_TILE_COLOR_BUFFER
    ld de, CLRTBL2
    ld bc, PRESENTATION_SCREEN_COLOR_B0_SIZE
    call FAST_LDIRVM

    ld hl, PRESENTATION_SCREEN_COLORS_B1
    ld de, ZX0_TILE_COLOR_BUFFER
    call page0_decompress_to_ram
    ld hl, ZX0_TILE_COLOR_BUFFER
    ld de, CLRTBL2 + #800
    ld bc, PRESENTATION_SCREEN_COLOR_B1_SIZE
    call FAST_LDIRVM

    ld hl, PRESENTATION_SCREEN_COLORS_B2
    ld de, ZX0_TILE_COLOR_BUFFER
    call page0_decompress_to_ram
    ld hl, ZX0_TILE_COLOR_BUFFER
    ld de, CLRTBL2 + #1000
    ld bc, PRESENTATION_SCREEN_COLOR_B2_SIZE
    call FAST_LDIRVM

    ld hl, PRESENTATION_SCREEN_NAMETBL
    ld de, ZX0_SCREEN_BUFFER
    call page0_decompress_to_ram
    ld hl, ZX0_SCREEN_BUFFER
    ld de, NAMETBL
    ld bc, PRESENTATION_SCREEN_NAMETBL_SIZE
    call FAST_LDIRVM

    call ENASCR
`:n?`    call mapper_push_p2
    ld a, PRESENTATION_SCREEN_PATTERNS_B0_BANK
    call mapper_set_bank_p2
    ld hl, PRESENTATION_SCREEN_PATTERNS_B0
    ld de, CHRTBL2
    ld bc, PRESENTATION_SCREEN_PATTERN_B0_SIZE
    call FAST_LDIRVM
    call mapper_pop_p2

    call mapper_push_p2
    ld a, PRESENTATION_SCREEN_PATTERNS_B1_BANK
    call mapper_set_bank_p2
    ld hl, PRESENTATION_SCREEN_PATTERNS_B1
    ld de, CHRTBL2 + #800
    ld bc, PRESENTATION_SCREEN_PATTERN_B1_SIZE
    call FAST_LDIRVM
    call mapper_pop_p2

    call mapper_push_p2
    ld a, PRESENTATION_SCREEN_PATTERNS_B2_BANK
    call mapper_set_bank_p2
    ld hl, PRESENTATION_SCREEN_PATTERNS_B2
    ld de, CHRTBL2 + #1000
    ld bc, PRESENTATION_SCREEN_PATTERN_B2_SIZE
    call FAST_LDIRVM
    call mapper_pop_p2

    call mapper_push_p2
    ld a, PRESENTATION_SCREEN_COLORS_B0_BANK
    call mapper_set_bank_p2
    ld hl, PRESENTATION_SCREEN_COLORS_B0
    ld de, CLRTBL2
    ld bc, PRESENTATION_SCREEN_COLOR_B0_SIZE
    call FAST_LDIRVM
    call mapper_pop_p2

    call mapper_push_p2
    ld a, PRESENTATION_SCREEN_COLORS_B1_BANK
    call mapper_set_bank_p2
    ld hl, PRESENTATION_SCREEN_COLORS_B1
    ld de, CLRTBL2 + #800
    ld bc, PRESENTATION_SCREEN_COLOR_B1_SIZE
    call FAST_LDIRVM
    call mapper_pop_p2

    call mapper_push_p2
    ld a, PRESENTATION_SCREEN_COLORS_B2_BANK
    call mapper_set_bank_p2
    ld hl, PRESENTATION_SCREEN_COLORS_B2
    ld de, CLRTBL2 + #1000
    ld bc, PRESENTATION_SCREEN_COLOR_B2_SIZE
    call FAST_LDIRVM
    call mapper_pop_p2

    call mapper_push_p2
    ld a, PRESENTATION_SCREEN_NAMETBL_BANK
    call mapper_set_bank_p2
    ld hl, PRESENTATION_SCREEN_NAMETBL
    ld de, NAMETBL
    ld bc, PRESENTATION_SCREEN_NAMETBL_SIZE
    call FAST_LDIRVM
    call mapper_pop_p2

    call ENASCR
`:`    ld hl, PRESENTATION_SCREEN_PATTERNS_B0
    ld de, CHRTBL2
    ld bc, PRESENTATION_SCREEN_PATTERN_B0_SIZE
    call FAST_LDIRVM

    ld hl, PRESENTATION_SCREEN_PATTERNS_B1
    ld de, CHRTBL2 + #800
    ld bc, PRESENTATION_SCREEN_PATTERN_B1_SIZE
    call FAST_LDIRVM

    ld hl, PRESENTATION_SCREEN_PATTERNS_B2
    ld de, CHRTBL2 + #1000
    ld bc, PRESENTATION_SCREEN_PATTERN_B2_SIZE
    call FAST_LDIRVM

    ld hl, PRESENTATION_SCREEN_COLORS_B0
    ld de, CLRTBL2
    ld bc, PRESENTATION_SCREEN_COLOR_B0_SIZE
    call FAST_LDIRVM

    ld hl, PRESENTATION_SCREEN_COLORS_B1
    ld de, CLRTBL2 + #800
    ld bc, PRESENTATION_SCREEN_COLOR_B1_SIZE
    call FAST_LDIRVM

    ld hl, PRESENTATION_SCREEN_COLORS_B2
    ld de, CLRTBL2 + #1000
    ld bc, PRESENTATION_SCREEN_COLOR_B2_SIZE
    call FAST_LDIRVM

    ld hl, PRESENTATION_SCREEN_NAMETBL
    ld de, NAMETBL
    ld bc, PRESENTATION_SCREEN_NAMETBL_SIZE
    call FAST_LDIRVM

    call ENASCR
`,o.runtime.waitForFrames>0&&(d+=`    ld b, ${Math.max(0,Math.min(255,o.runtime.waitForFrames))}
    call presentation_wait_frames
`),o.runtime.waitForKey&&(d+=`    call presentation_wait_for_fire
`),d+=`    ret

`,d}function hr(e){const l=e.effectZones||[],a=[];return l.forEach(t=>{var i,c,d,_;const o=vl(t),n=Il(o,t.params);let s=0,r=0;if(o==="wind"){const p=typeof n.direction=="string"?n.direction:"right";s=Ve[p]??Ve.right,r=Pe(typeof n.strength=="number"?n.strength:parseInt(String(n.strength??"0"),10),1)}a.push(Pe((i=t.rect)==null?void 0:i.x),Pe((c=t.rect)==null?void 0:c.y),Pe((d=t.rect)==null?void 0:d.width),Pe((_=t.rect)==null?void 0:_.height),ke[o],Pe(s),Pe(r),0)}),a}function ur(e){const l=new Map;for(const a of e.entities||[]){const t=String((a==null?void 0:a.screenAssetId)||"").trim();t&&l.set(t,(l.get(t)||0)+1)}return l}function mr(e){const l=new Map;for(const a of e.worldmaps||[]){const t=String((a==null?void 0:a.id)||"").trim();if(t)for(const o of(a==null?void 0:a.nodes)||[]){const n=String((o==null?void 0:o.screenAssetId)||"").trim();if(!n)continue;const s=l.get(n)||new Set;s.add(t),l.set(n,s)}}return l}function fl(e,l){const a=String(e||"").trim();return a?(l.trackIndexByAssetId||{})[a]!==void 0?!0:(l.tracks||[]).some(o=>String((o==null?void 0:o.id)||"").trim()!==a?!1:((o==null?void 0:o.soundChip)||"PSG")==="PSG"):!1}function fr(e){var l;return(((l=e.gameFlow)==null?void 0:l.nodes)||[]).some(a=>(a==null?void 0:a.type)!=="Music"||(a==null?void 0:a.stop)===!0||(a==null?void 0:a.autoPlay)===!1?!1:fl(String((a==null?void 0:a.trackAssetId)||""),e))}function br(e){var c,d;const l=new Map,a=e.gameFlow,t=Array.isArray(a==null?void 0:a.nodes)?a.nodes:[];if(t.length===0)return l;const o=new Map;for(const _ of t){const p=String((_==null?void 0:_.id)||"").trim();p&&o.set(p,_)}const n=new Map;for(const _ of Array.isArray(a==null?void 0:a.connections)?a.connections:[]){const p=String(((c=_==null?void 0:_.from)==null?void 0:c.nodeId)||"").trim(),h=String(((d=_==null?void 0:_.to)==null?void 0:d.nodeId)||"").trim();if(!p||!h)continue;const u=n.get(p)||[];u.push(h),n.set(p,u)}const s=String((a==null?void 0:a.startNodeId)||"").trim();if(!s||!o.has(s))return l;const r=[{nodeId:s,musicActive:0}],i=new Set;for(;r.length>0;){const _=r.shift(),p=`${_.nodeId}|${_.musicActive}`;if(i.has(p))continue;i.add(p);const h=o.get(_.nodeId);if(!h)continue;let u=_.musicActive;if(h.type==="Music"&&(h.stop===!0?u=0:h.autoPlay===!1?u=_.musicActive:fl(String(h.trackAssetId||""),e)&&(u=1)),h.type==="WorldLink"){const f=String(h.worldAssetId||"").trim();if(f){const b=l.get(f)||0;l.set(f,b|u)}}for(const f of n.get(_.nodeId)||[])r.push({nodeId:f,musicActive:u})}return l}function yr(e,l,a){if(a.length===0)return 0;const t=new Set([...e,...l]);let o=0;for(const n of a){let s=!1;for(let r=n.targetCharCode;r<n.targetCharCode+n.charsPerTile;r++)if(t.has(r)){s=!0;break}s&&o++}return o}function Er(e,l="simple32k"){const a=Ae(l),t=!!e.sprites&&e.sprites.length>0,o=sr(e),n=ur(e),s=new Map(An(e).map(p=>[p.screenId,p.totalSlotsRequired])),r=mr(e),i=br(e),c=fr(e)?1:0;if(!e.screenMaps||e.screenMaps.length===0)return`; ==================================================================
; SCREEN MAPS (SKIPPED - NO SCREENS DETECTED)
; File: screens.asm
; ==================================================================

; No screens detected in project - screen system not needed
; This saves ~160 lines of unused screen data

; NOTE: load_game_screen is now generated by gameFlowGenerator.ts
; This prevents symbol redefinition errors

load_screen_default:
    ret

${Ma(e,t,l)}
; ==================================================================
; END OF SCREENS (MINIMAL VERSION)
; ==================================================================
`;const d=e.screenMaps.map((p,h)=>{var O,z,V;const u=p.name.toUpperCase().replace(/[^A-Z0-9]/g,"_"),f=`${p.name}_${h}`,b=_r(p,e),m=xa(p,"background",e,b),y=xa(p,"effects",e,b),T=y.some(N=>N!==0),g=hr(p),A=(p.effectZones||[]).length,S=String(p.id||`screen_${h}`),E=yr(m,y,o),C=n.get(S)||0,v=s.get(S)||1,R=!!((O=p.hudConfiguration)!=null&&O.elements&&p.hudConfiguration.elements.length>0||(V=(z=p.hudConfiguration)==null?void 0:z.importedFrame)!=null&&V.cells&&p.hudConfiguration.importedFrame.cells.length>0),L=r.get(S),x=L&&L.size>0?Array.from(L).some(N=>(i.get(N)||0)!==0)?1:0:c,k=(x?1:0)|(R?2:0)|(T||A>0?4:0)|(E>0?8:0);return{screen:p,screenId:S,index:h,screenName:u,screenNameWithIndex:f,backgroundLayoutBytes:m,effectsLayoutBytes:y,hasEffectsLayoutData:T,effectZoneBytes:g,effectZoneCount:A,animatedGroupCount:E,entityCount:C,spritePatternSlots:v,musicInGame:x,summaryFlags:k}});let _=`; ==================================================================
; SCREEN MAPS
; File: screens.asm
; Description: Screen layout and map data
; ==================================================================

`;return e.screenMaps&&e.screenMaps.length>0?(_+=`; ==================================================================
; SCREEN MAP CONSTANTS
; ==================================================================

`,_+=`EFFECT_ZONE_ENTRY_SIZE EQU 8
EFFECT_TYPE_SECRET_ZONE EQU ${ke.secretZone}
EFFECT_TYPE_WIND EQU ${ke.wind}
EFFECT_TYPE_WATER EQU ${ke.water}
EFFECT_TYPE_CUSTOM_GRAVITY EQU ${ke.customGravity}
EFFECT_TYPE_ICE_PHYSICS EQU ${ke.icePhysics}
EFFECT_TYPE_SPRITE_CONCEAL EQU ${ke.spriteConceal}
EFFECT_WIND_DIR_LEFT EQU ${Ve.left}
EFFECT_WIND_DIR_RIGHT EQU ${Ve.right}
EFFECT_WIND_DIR_UP EQU ${Ve.up}
EFFECT_WIND_DIR_DOWN EQU ${Ve.down}
SCREEN_RUNTIME_SUMMARY_ENTRY_SIZE EQU 4
SCREEN_RUNTIME_SUMMARY_OFFS_ANIM_GROUPS EQU 0
SCREEN_RUNTIME_SUMMARY_OFFS_ENTITY_COUNT EQU 1
SCREEN_RUNTIME_SUMMARY_OFFS_SPRITE_PATTERN_SLOTS EQU 2
SCREEN_RUNTIME_SUMMARY_OFFS_FLAGS EQU 3
SCREEN_RUNTIME_SUMMARY_FLAG_MUSIC_IN_GAME EQU #01
SCREEN_RUNTIME_SUMMARY_FLAG_HAS_HUD EQU #02
SCREEN_RUNTIME_SUMMARY_FLAG_HAS_EFFECTS EQU #04
SCREEN_RUNTIME_SUMMARY_FLAG_HAS_ANIM_TILES EQU #08

`,d.forEach(p=>{const{screenName:h,index:u,hasEffectsLayoutData:f,effectZoneCount:b,animatedGroupCount:m,entityCount:y,spritePatternSlots:T,musicInGame:g,summaryFlags:A}=p;_+=`SCREEN_${h}_${u}_ID EQU ${u}
SCREEN_${h}_${u}_LAYOUT_BANK EQU ((SCREEN_${h}_${u}_LAYOUT - #4000) / #2000)
BEHAVIOR_${h}_${u}_DATA_BANK EQU ((BEHAVIOR_${h}_${u}_DATA - #4000) / #2000)
SCREEN_${h}_${u}_EFFECTS_LAYOUT_BANK EQU ((SCREEN_${h}_${u}_EFFECTS_LAYOUT - #4000) / #2000)
SCREEN_${h}_${u}_EFFECTS_LAYOUT_PRESENT EQU ${f?1:0}
SCREEN_${h}_${u}_EFFECTS_LAYOUT_SIZE EQU ${Oe*Ue}
SCREEN_${h}_${u}_EFFECT_ZONE_TABLE_BANK EQU ((SCREEN_${h}_${u}_EFFECT_ZONE_TABLE - #4000) / #2000)
SCREEN_${h}_${u}_EFFECT_ZONE_COUNT EQU ${b}
SCREEN_${h}_${u}_EFFECT_ZONE_TABLE_SIZE EQU ${b*8}
SCREEN_${h}_${u}_ANIM_GROUP_COUNT EQU ${m}
SCREEN_${h}_${u}_ENTITY_COUNT EQU ${y}
SCREEN_${h}_${u}_SPRITE_PATTERN_SLOTS EQU ${T}
SCREEN_${h}_${u}_MUSIC_IN_GAME EQU ${g}
SCREEN_${h}_${u}_SUMMARY_FLAGS EQU #${A.toString(16).toUpperCase().padStart(2,"0")}
`}),_+=`
; ==================================================================
; SCREEN RUNTIME SUMMARY TABLE
; anim_groups: animated tile groups visible in this screen
; entity_count: entity instances assigned to this screen
; sprite_pattern_slots: SPRPAT slots needed by this screen's entity runtime set
; flags bit0=music_in_game, bit1=has_hud, bit2=has_effects, bit3=has_anim_tiles
; ==================================================================

screen_runtime_summary_table:
`,d.forEach(p=>{const{screen:h,index:u,animatedGroupCount:f,entityCount:b,spritePatternSlots:m,summaryFlags:y}=p;_+=`    db ${f}, ${b}, ${m}, #${y.toString(16).toUpperCase().padStart(2,"0")}    ; Screen ${u}: ${h.name}
`}),_+=`
; ==================================================================
; SCREEN MAP DATA
; ==================================================================

`,d.forEach(p=>{var S,E,C;const{screen:h,index:u,screenName:f,screenNameWithIndex:b,backgroundLayoutBytes:m,effectsLayoutBytes:y,hasEffectsLayoutData:T,effectZoneBytes:g,effectZoneCount:A}=p;if(h.layers&&h.layers.background){const v=[];v.push("; Generated using exact Screen Editor layout export logic"),v.push("; Byte values represent actual character codes in VRAM");const R=zl(b,Oe,Ue,m,v,"hex");if(_+=R,_+=`
`,_+=Te(`SCREEN_${f}_${u}_EFFECTS_LAYOUT`,y,T?[`Alternate Effects layer for ${h.name}`,"Same 32x24 char layout as background; used by secretZone runtime"]:[`No alternate Effects tiles exported for ${h.name}`,"Runtime should treat this layer as empty"]),_+=`
`,_+=Te(`SCREEN_${f}_${u}_EFFECT_ZONE_TABLE`,g,A>0?[`Effect zones for ${h.name}`,"Entry format: x, y, width, height, effectType, param0, param1, reserved"]:[`No effect zones exported for ${h.name}`]),_+=`
`,h.layers.collision&&e.tiles){const L=h.layers.collision,x=[],k=L.length,O=((S=L[0])==null?void 0:S.length)??0;for(let V=0;V<Ue;V++)for(let N=0;N<Oe;N++){const M=k>0?Math.min(k-1,Math.floor(V*k/Ue)):0,U=O>0?Math.min(O-1,Math.floor(N*O/Oe)):0,I=(E=L[M])==null?void 0:E[U];if(I!=null&&I.tileId){const P=(C=e.tiles)==null?void 0:C.find(j=>j.id===I.tileId),$=P==null?void 0:P.logicalProperties;if($){const j=$.familyId??($.isSolid?1:0);let q=0;$.isBreakable&&(q|=1),$.isMovable&&(q|=2),$.causesDamage&&(q|=4),$.isInteractiveSwitch&&(q|=8),x.push(j<<4|q)}else x.push(0)}else x.push(0)}const z=Hl(b,Oe,Ue,x,"hex");_+=`
${z}`}}else{const v=e.screenMaps.indexOf(h),R=h.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");_+=`SCREEN_${R}_${v}_LAYOUT:
    ; Screen data for ${h.name}
    ; TODO: Add actual screen map data
    db 0, 0, 0, 0, 0, 0, 0, 0

`}_+=`
`}),_+=Ma(e,t,l),_+=`; ==================================================================
; SCREEN LOADING FUNCTIONS
; ==================================================================

; Color shift lookup table (0-15 shifted to high nibble)
; OPTIMIZED: Table lookup is faster than 4× RLCA (11 cycles vs 16 cycles)
color_shift_table:
    db #00, #10, #20, #30, #40, #50, #60, #70
    db #80, #90, #A0, #B0, #C0, #D0, #E0, #F0

; Helper function to set VDP background and border colors
; Input: A = background color (0-15), B = border color (0-15)
set_screen_colors:
    push af
    push bc
    push hl

    ; Set VDP Register 7: [Background Color (4-7) | Border Color (0-3)]

    ; OPTIMIZED: Use lookup table instead of 4× RLCA
    ; Process Background Color (in A) -> High Nibble
    and #0F                    ; Ensure 0-15 range
    ld hl, color_shift_table
    add a, l                   ; Add offset to table base
    ld l, a
    adc a, h                   ; Handle carry
    sub l
    ld h, a
    ld a, (hl)                 ; A = background color << 4
    ld c, a                    ; Save shifted background in C

    ; Process Border Color (in B) -> Low Nibble
    ld a, b                    ; Get border color
    and #0F                    ; Ensure 0-15 range

    ; Combine
    or c                       ; Combine: background << 4 | border

    ld b, a                    ; Value for VDP R#7
    ld c, 7                    ; VDP Register 7
    call FAST_WRTVDP           ; BIOS call to write VDP register

    pop hl
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
    call FAST_WRTVRM                ; Write to VRAM
    inc hl
    dec c
    jr nz, init_char0_bank0_loop
    
    ; Bank 1: CLRTBL2 + #800 + (0 * 8)
    ld hl, CLRTBL2 + #800
    ld c, 8
init_char0_bank1_loop:
    ld a, b
    call FAST_WRTVRM
    inc hl
    dec c
    jr nz, init_char0_bank1_loop
    
    ; Bank 2: CLRTBL2 + #1000 + (0 * 8)
    ld hl, CLRTBL2 + #1000
    ld c, 8
init_char0_bank2_loop:
    ld a, b
    call FAST_WRTVRM
    inc hl
    dec c
    jr nz, init_char0_bank2_loop
    
    ; Also clear pattern for character 0 (all zeros = blank)
    ; Bank 0: CHRTBL2 + (0 * 8)
    ld hl, CHRTBL2
    ld c, 8
    xor a                      ; A = 0 (blank pattern)
init_char0_pattern_bank0_loop:
    call FAST_WRTVRM
    inc hl
    dec c
    jr nz, init_char0_pattern_bank0_loop
    
    ; Bank 1: CHRTBL2 + #800 + (0 * 8)
    ld hl, CHRTBL2 + #800
    ld c, 8
    xor a
init_char0_pattern_bank1_loop:
    call FAST_WRTVRM
    inc hl
    dec c
    jr nz, init_char0_pattern_bank1_loop
    
    ; Bank 2: CHRTBL2 + #1000 + (0 * 8)
    ld hl, CHRTBL2 + #1000
    ld c, 8
    xor a
init_char0_pattern_bank2_loop:
    call FAST_WRTVRM
    inc hl
    dec c
    jr nz, init_char0_pattern_bank2_loop
    
    pop hl
    pop de
    pop bc
    pop af
    ret

; Helper: Copy rectangular area from screen layout (RAM) to Name Table (VRAM)
; Input: HL = source in RAM
;        DE = destination in VRAM
;        A  = number of rows
;        C  = bytes per row (width)
copy_layout_rect_to_vram:
    or a
    ret z
    ld b, a
    ld a, c
    or a
    ret z
    ld a, b

.copy_rect_row_loop:
    push af
    push bc
    push hl
    push de
    ld b, 0
    call FAST_LDIRVM
    pop de
    pop hl
    pop bc
    pop af

    dec a
    ret z
    ; HL/DE were restored by push/pop, so advance a full row (32 bytes)
    push bc
    ld bc, 32
    add hl, bc
    ex de, hl
    add hl, bc
    ex de, hl
    pop bc
    jr .copy_rect_row_loop

; Helper: Copy rectangular area between 32-byte rows in RAM
; Input: HL = source in RAM
;        DE = destination in RAM
;        A  = number of rows
;        C  = bytes per row (width)
copy_layout_rect_ram_to_ram:
    or a
    ret z
    ld b, a
    ld a, c
    or a
    ret z
    ld a, b

.copy_rect_ram_row_loop:
    push af
    push bc
    push hl
    push de
    ld b, 0
    ldir
    pop de
    pop hl
    pop bc
    pop af

    dec a
    ret z
    ; HL/DE were restored by push/pop, so advance a full row (32 bytes)
    push bc
    ld bc, 32
    add hl, bc
    ex de, hl
    add hl, bc
    ex de, hl
    pop bc
    jr .copy_rect_ram_row_loop

load_screen:

    ; Load screen (A = screen ID)
    ; TODO: Implement screen loading logic
    ret

`,e.screenMaps.forEach((p,h)=>{var j,q;const u=p.name.toUpperCase().replace(/[^A-Z0-9]/g,"_"),f=p.backgroundColor!==void 0?p.backgroundColor:1,b=p.borderColor!==void 0?p.borderColor:1,m=p.id?`_${p.id.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"",y=d[h],T=(y==null?void 0:y.animatedGroupCount)||0,g=(y==null?void 0:y.entityCount)||0,A=(y==null?void 0:y.spritePatternSlots)||1,S=p.tileBankAssetId?`    call ${rl(p.tileBankAssetId)}
    call ${il(p.tileBankAssetId)}
`:"",E=p.activeAreaX??0,C=p.activeAreaY??0,v=p.activeAreaWidth??p.width??32,R=p.activeAreaHeight??p.height??24,L=Math.max(0,Math.min(31,E)),x=Math.max(0,Math.min(23,C)),k=Math.max(0,Math.min(32-L,v)),O=Math.max(0,Math.min(24-x,R)),V=(L>0||x>0||k<32||O<24)&&k>0&&O>0,N=x*32+L,M=k*O,U=Math.min((p.effectZones||[]).length,cr),I=(((q=(j=p.hudConfiguration)==null?void 0:j.importedFrame)==null?void 0:q.cells)||[]).filter(H=>typeof(H==null?void 0:H.x)=="number"&&typeof(H==null?void 0:H.y)=="number"&&typeof(H==null?void 0:H.charCode)=="number"&&H.x>=0&&H.x<32&&H.y>=0&&H.y<24).map(H=>({x:H.x|0,y:H.y|0,charCode:(()=>{var Z,G;const le=Jo(e,(G=(Z=p.hudConfiguration)==null?void 0:Z.importedFrame)==null?void 0:G.sourceTileBankAssetId,H.tileId,H.y|0,H.subTileX|0,H.subTileY|0);return le>0?le&255:H.charCode&255})()})),P=I.length>0,$=`hud_imported_frame_${u.toLowerCase()}${m.toLowerCase()}`;P&&(_+=`${$}_data:
    ; Imported HUD frame snapshot for ${p.name} (${I.length} cells)
`,I.forEach(H=>{const le=H.y*32+H.x,Z=le&255,G=le>>8&255,W=H.charCode&255;_+=`    DB #${Z.toString(16).padStart(2,"0").toUpperCase()},#${G.toString(16).padStart(2,"0").toUpperCase()},#${W.toString(16).padStart(2,"0").toUpperCase()}
`}),_+=`
${$}_draw:
    ; Draw imported HUD frame chars into Name Table
    ld hl, ${$}_data
    ld bc, ${I.length}

${$}_draw_loop:
    ld a, b
    or c
    ret z

    ld e, (hl)                ; DE = Name Table offset
    inc hl
    ld d, (hl)
    inc hl
    ld a, (hl)                ; A = char code
    inc hl

    push hl
    ld h, d
    ld l, e
    ld de, NAMETBL
    add hl, de                ; HL = VRAM address
    call FAST_WRTVRM
    pop hl

    dec bc
    jr ${$}_draw_loop

`),V?(_+=`load_screen_${u.toLowerCase()}${m.toLowerCase()}:
    ; Load ${p.name} screen (fast direct port access)
    ; Active Area: X=${L}, Y=${x}, W=${k}, H=${O}
    ; Preserve HUD/non-active area: only overwrite active game area
    ; Set VDP colors FIRST (before loading screen data)
    ld a, ${f}           ; Background color
    ld b, ${b}       ; Border color
    call set_screen_colors
    ; Initialize character 0 (empty cells) with background color
    ld a, ${f}           ; Background color for char 0
    call init_char0_color
${S}`,t&&(_+=`    ; Clear hardware sprites on screen switch to avoid visual carry-over
    call clear_all_sprites
    call update_sprites_to_vram
`),k===32?_+=a?`    ; Load active game area (contiguous rows)
    call mapper_push_p2
    ld a, SCREEN_${u}_${h}_LAYOUT_BANK
    call mapper_set_bank_p2
    ; Preserve HUD / non-active VRAM area: overwrite only gameplay rows
    ld hl, SCREEN_${u}_${h}_LAYOUT + ${N}
    ld de, NAMETBL + ${N}
    ld bc, ${M}
    call FAST_LDIRVM
    call mapper_pop_p2
`:`    ; Load active game area (contiguous rows)
    ; Preserve HUD / non-active VRAM area: overwrite only gameplay rows
    ld hl, SCREEN_${u}_${h}_LAYOUT + ${N}
    ld de, NAMETBL + ${N}
    ld bc, ${M}
    call FAST_LDIRVM
`:_+=a?`    ; Load active game area (rectangular copy by rows)
    call mapper_push_p2
    ld a, SCREEN_${u}_${h}_LAYOUT_BANK
    call mapper_set_bank_p2
    ; Preserve HUD / non-active VRAM area: overwrite only gameplay rectangle
    ld hl, SCREEN_${u}_${h}_LAYOUT + ${N}
    ld de, NAMETBL + ${N}
    ld a, ${O}
    ld c, ${k}
    call copy_layout_rect_to_vram
    call mapper_pop_p2
`:`    ; Load active game area (rectangular copy by rows)
    ; Preserve HUD / non-active VRAM area: overwrite only gameplay rectangle
    ld hl, SCREEN_${u}_${h}_LAYOUT + ${N}
    ld de, NAMETBL + ${N}
    ld a, ${O}
    ld c, ${k}
    call copy_layout_rect_to_vram
`,_+=a?`    ; Build mutable runtime screen/effects/behavior maps in RAM
    call mapper_push_p2
    ld a, SCREEN_${u}_${h}_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, SCREEN_${u}_${h}_LAYOUT
    ld de, runtime_background_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    ld hl, SCREEN_${u}_${h}_LAYOUT
    ld de, runtime_screen_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    call mapper_push_p2
    ld a, SCREEN_${u}_${h}_EFFECTS_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, SCREEN_${u}_${h}_EFFECTS_LAYOUT
    ld de, runtime_effects_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    call mapper_push_p2
    ld a, BEHAVIOR_${u}_${h}_DATA_BANK
    call mapper_set_bank_p2
    ld hl, BEHAVIOR_${u}_${h}_DATA
    ld de, runtime_behavior_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    ld a, ${U}
    ld (current_effect_zone_count), a
    or a
    jr z, .load_${u.toLowerCase()}${m.toLowerCase()}_zones_done
    call mapper_push_p2
    ld a, SCREEN_${u}_${h}_EFFECT_ZONE_TABLE_BANK
    call mapper_set_bank_p2
    ld hl, SCREEN_${u}_${h}_EFFECT_ZONE_TABLE
    ld de, runtime_effect_zone_table
    ld bc, ${U*8}
    ldir
    call mapper_pop_p2
`:`    ; Build mutable runtime screen/effects/behavior maps in RAM
    ld hl, SCREEN_${u}_${h}_LAYOUT
    ld de, runtime_background_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    ld hl, SCREEN_${u}_${h}_LAYOUT
    ld de, runtime_screen_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir

    ld hl, SCREEN_${u}_${h}_EFFECTS_LAYOUT
    ld de, runtime_effects_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir

    ld hl, BEHAVIOR_${u}_${h}_DATA
    ld de, runtime_behavior_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir

    ld a, ${U}
    ld (current_effect_zone_count), a
    or a
    jr z, .load_${u.toLowerCase()}${m.toLowerCase()}_zones_done
    ld hl, SCREEN_${u}_${h}_EFFECT_ZONE_TABLE
    ld de, runtime_effect_zone_table
    ld bc, ${U*8}
    ldir
`,_+=`.load_${u.toLowerCase()}${m.toLowerCase()}_zones_done:
    ld a, ${T}
    ld (current_screen_anim_group_count), a
    ld a, ${g}
    ld (current_screen_entity_count), a
    ld a, ${A}
    ld (current_screen_sprite_pattern_slots), a
    ld a, SCREEN_${u}_${h}_SUMMARY_FLAGS
    ld (current_screen_summary_flags), a
${T>0?`    call update_animated_tiles_vram
`:""}`,P&&(_+=`    ; Imported HUD frame is drawn on world/game start only
`),_+=`    ; Initialize collision system pointers for this screen
    ld hl, runtime_screen_layout
    ld (current_screen_layout), hl
    ld a, #FF
    ld (current_screen_layout_bank), a
    ld hl, runtime_behavior_map
    ld (current_behavior_map), hl
    ld a, #FF
    ld (current_behavior_map_bank), a
    ld a, l
    ld (behavior_cache_map_l), a
    ld a, h
    ld (behavior_cache_map_h), a
    ld a, #FF
    ld (behavior_cache_row), a
    xor a
    ld (secret_zone_active), a
    ld (secret_zone_rect_x), a
    ld (secret_zone_rect_y), a
    ld (secret_zone_rect_w), a
    ld (secret_zone_rect_h), a
    ret

`):(_+=`load_screen_${u.toLowerCase()}${m.toLowerCase()}:
    ; Load ${p.name} screen (fast direct port access)
    ; Set VDP colors FIRST (before loading screen data)
    ld a, ${f}           ; Background color
    ld b, ${b}       ; Border color
    call set_screen_colors
    ; Initialize character 0 (empty cells) with background color
    ld a, ${f}           ; Background color for char 0
    call init_char0_color
${S}`,t&&(_+=`    ; Clear hardware sprites on screen switch to avoid visual carry-over
    call clear_all_sprites
    call update_sprites_to_vram
`),_+=a?`    ; Now load screen layout (full 32x24)
    call mapper_push_p2
    ld a, SCREEN_${u}_${h}_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, SCREEN_${u}_${h}_LAYOUT
    ld de, NAMETBL
    ld bc, SCREEN_${u}_${h}_SIZE
    call FAST_LDIRVM           ; Fast VRAM write (direct port access)
    call mapper_pop_p2
`:`    ; Now load screen layout (full 32x24)
    ld hl, SCREEN_${u}_${h}_LAYOUT
    ld de, NAMETBL
    ld bc, SCREEN_${u}_${h}_SIZE
    call FAST_LDIRVM           ; Fast VRAM write (direct port access)
`,_+=a?`    ; Build mutable runtime screen/effects/behavior maps in RAM
    call mapper_push_p2
    ld a, SCREEN_${u}_${h}_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, SCREEN_${u}_${h}_LAYOUT
    ld de, runtime_background_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    ld hl, SCREEN_${u}_${h}_LAYOUT
    ld de, runtime_screen_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    call mapper_push_p2
    ld a, SCREEN_${u}_${h}_EFFECTS_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, SCREEN_${u}_${h}_EFFECTS_LAYOUT
    ld de, runtime_effects_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    call mapper_push_p2
    ld a, BEHAVIOR_${u}_${h}_DATA_BANK
    call mapper_set_bank_p2
    ld hl, BEHAVIOR_${u}_${h}_DATA
    ld de, runtime_behavior_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    ld a, ${U}
    ld (current_effect_zone_count), a
    or a
    jr z, .load_${u.toLowerCase()}${m.toLowerCase()}_zones_done
    call mapper_push_p2
    ld a, SCREEN_${u}_${h}_EFFECT_ZONE_TABLE_BANK
    call mapper_set_bank_p2
    ld hl, SCREEN_${u}_${h}_EFFECT_ZONE_TABLE
    ld de, runtime_effect_zone_table
    ld bc, ${U*8}
    ldir
    call mapper_pop_p2
`:`    ; Build mutable runtime screen/effects/behavior maps in RAM
    ld hl, SCREEN_${u}_${h}_LAYOUT
    ld de, runtime_background_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    ld hl, SCREEN_${u}_${h}_LAYOUT
    ld de, runtime_screen_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir

    ld hl, SCREEN_${u}_${h}_EFFECTS_LAYOUT
    ld de, runtime_effects_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir

    ld hl, BEHAVIOR_${u}_${h}_DATA
    ld de, runtime_behavior_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir

    ld a, ${U}
    ld (current_effect_zone_count), a
    or a
    jr z, .load_${u.toLowerCase()}${m.toLowerCase()}_zones_done
    ld hl, SCREEN_${u}_${h}_EFFECT_ZONE_TABLE
    ld de, runtime_effect_zone_table
    ld bc, ${U*8}
    ldir
`,_+=`.load_${u.toLowerCase()}${m.toLowerCase()}_zones_done:
    ld a, ${T}
    ld (current_screen_anim_group_count), a
    ld a, ${g}
    ld (current_screen_entity_count), a
    ld a, ${A}
    ld (current_screen_sprite_pattern_slots), a
    ld a, SCREEN_${u}_${h}_SUMMARY_FLAGS
    ld (current_screen_summary_flags), a
${T>0?`    call update_animated_tiles_vram
`:""}`,P&&(_+=`    ; Imported HUD frame is drawn on world/game start only
`),_+=`    ; Initialize collision system pointers for this screen
    ld hl, runtime_screen_layout
    ld (current_screen_layout), hl
    ld a, #FF
    ld (current_screen_layout_bank), a
    ld hl, runtime_behavior_map
    ld (current_behavior_map), hl
    ld a, #FF
    ld (current_behavior_map_bank), a
    ld a, l
    ld (behavior_cache_map_l), a
    ld a, h
    ld (behavior_cache_map_h), a
    ld a, #FF
    ld (behavior_cache_row), a
    xor a
    ld (secret_zone_active), a
    ld (secret_zone_rect_x), a
    ld (secret_zone_rect_y), a
    ld (secret_zone_rect_w), a
    ld (secret_zone_rect_h), a
    ret

`)})):_+=`; ==================================================================
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
    ; Load game screen (fast direct port access)
    ld hl, SCREEN_GAME_DATA
    ld de, NAMETBL
    ld bc, 768
    call FAST_LDIRVM           ; Fast VRAM write (direct port access)
    ret
`,_+=`
; ==================================================================
; END OF SCREENS
; ==================================================================
`,_}function gr(e,l="simple32k"){var b,m,y,T;const a=(m=(b=e.gameFlow)==null?void 0:b.nodes)==null?void 0:m.some(g=>g.type==="SubMenu"),t=(y=e.screenMaps)==null?void 0:y.some(g=>{var A,S;return((A=g.layers)==null?void 0:A.text)||((S=g.textElements)==null?void 0:S.length)>0}),o=(T=e.screenMaps)==null?void 0:T.some(g=>{var A;return((A=g.hudConfiguration)==null?void 0:A.elements)&&g.hudConfiguration.elements.length>0});if(!a&&!t&&!o)return`; ==================================================================
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
`;const n=new Map,s=new Map,r=[{code:32,pattern:[0,0,0,0,0,0,0,0]},{code:43,pattern:[0,16,16,124,16,16,0,0]},{code:45,pattern:[0,0,0,126,0,0,0,0]},{code:62,pattern:[0,48,24,12,24,48,0,0]},{code:124,pattern:[24,24,24,24,24,24,24,24]}];if(r.forEach(g=>{n.set(g.code,g.pattern),s.set(g.code,[240,240,240,240,240,240,240,240])}),e.fonts&&e.fonts.length>0){const g=e.fonts[0],A=g.data.fontData||{},S=g.data.fontColorAttributes||{},E=C=>{if(C.startsWith("rgba(0,0,0,0)"))return 0;const v=C.toUpperCase();return{"RGBA(0,0,0,0)":0,"#000000":1,"#21C842":2,"#5EDC78":3,"#5455ED":4,"#7D76FC":5,"#D4524D":6,"#42EBF5":7,"#FC5554":8,"#FF7978":9,"#D4C154":10,"#E6CE80":11,"#21B03B":12,"#C95BBA":13,"#CCCCCC":14,"#FFFFFF":15}[v]??15};Object.keys(A).forEach(C=>{const v=parseInt(C,10),R=A[v];if(Array.isArray(R)&&R.length===8)if(n.set(v,R),S[v]&&Array.isArray(S[v])){const L=S[v],x=[];for(let k=0;k<8;k++)if(L[k]&&typeof L[k]=="object"){const O=L[k].fg,z=L[k].bg,V=E(O),N=E(z);x.push(V<<4|N)}else x.push(240);s.set(v,x)}else s.set(v,[240,240,240,240,240,240,240,240])})}else{for(let g=48;g<=57;g++)n.set(g,[62,127,115,115,115,127,62,0]);for(let g=65;g<=90;g++)n.set(g,[62,127,99,127,127,99,99,0]);r.forEach(g=>n.set(g.code,g.pattern))}let i=`FONT_PATTERN_DATA:
`,c=`FONT_COLOR_DATA:
`,d=`FONT_CHAR_INDEX:
    DB `;const _=Array.from(n.keys()).filter(g=>g<128).sort((g,A)=>g-A);_.forEach((g,A)=>{const S=n.get(g),E=s.get(g)||[240,240,240,240,240,240,240,240];i+=`    ; Char ${g} ('${String.fromCharCode(g)}')
`,i+=`    DB ${S.map(C=>"#"+C.toString(16).padStart(2,"0").toUpperCase()).join(", ")}
`,c+=`    ; Char ${g}
`,c+=`    DB ${E.map(C=>"#"+C.toString(16).padStart(2,"0").toUpperCase()).join(", ")}
`,d+=`${g}${A<_.length-1?", ":""}`}),d+=`
FONT_CHAR_COUNT EQU ${_.length}
`;const p=Ae(l),h=p?`    call mapper_push_p2
    ld a, FONT_PATTERN_DATA_BANK
    call mapper_set_bank_p2
`:"",u=p?`    call mapper_push_p2
    ld a, FONT_COLOR_DATA_BANK
    call mapper_set_bank_p2
`:"",f=p?`    call mapper_pop_p2
`:"";return`; ==================================================================
; MSX FONT DATA FOR SCREEN 2 TEXT
; File: font.asm
; Description: Font pattern data generated from project assets
; ==================================================================

FONT_PATTERN_DATA_BANK EQU ((FONT_PATTERN_DATA - #4000) / #2000)
FONT_COLOR_DATA_BANK   EQU ((FONT_COLOR_DATA - #4000) / #2000)

; ==================================================================
; FONT PATTERN DATA
; ==================================================================

${i}

; Character index table (for quick lookup)
${d}

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
${h}    ld ix, FONT_CHAR_INDEX        ; Pointer to ASCII codes
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
    call FAST_LDIRVM              ; Copy from HL(RAM) to DE(VRAM)

    ; Advance source pointer
    ld bc, 8
    add iy, bc                    ; IY += 8

    pop de                        ; Restore bank base
    pop bc                        ; Restore loop counter
    djnz .load_loop
${f}    ret

; ==================================================================
; FONT COLOR ATTRIBUTES
; ==================================================================

${c}

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
${u}    ld ix, FONT_CHAR_INDEX        ; Pointer to ASCII codes
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
    call FAST_LDIRVM              ; Copy from HL(RAM) to DE(VRAM)

    ; Advance source pointer
    ld bc, 8
    add iy, bc                    ; IY += 8

    pop de                        ; Restore bank base
    pop bc                        ; Restore loop counter
    djnz .load_colors_loop
${f}    ret

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
    ; FAST_WRTVRM signature: A = data, HL = VRAM address
    ; A already has character, HL already has VRAM address
    push hl                        ; Save string pointer
    push de                        ; Save VRAM position
    ex de, hl                      ; Swap: DE = string ptr, HL = VRAM address for FAST_WRTVRM
    call FAST_WRTVRM               ; Write character to VRAM (fast)
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
`}function Pa(e,l){return(Array.isArray(e.globalVariables)?e.globalVariables:[]).some(t=>String((t==null?void 0:t.asmName)||"").trim().toLowerCase()===l.toLowerCase())}function Sr(e,l){const a=Array.isArray(e.globalVariables)?e.globalVariables:[],t=de(l||"").trim().toLowerCase();return t&&a.find(o=>{const n=de(String((o==null?void 0:o.name)||"")).trim().toLowerCase(),s=String((o==null?void 0:o.asmName)||"").trim().toLowerCase();return n===t||s===t})||null}function Ar(e,l,a){var g,A,S;if(e.type===ie.Score||e.type===ie.Lives)return null;const t=String(e.text||e.name||""),o=e.details||{},n=[o.variableName,o.globalVariableName,o.bindingVariable].find(E=>typeof E=="string"&&E.trim().length>0),s=t.match(/\{\{\s*([^{}]+?)\s*\}\}/),r=(g=s==null?void 0:s[1])==null?void 0:g.trim(),i=n||r;if(!i)return null;const c=Sr(a,i);if(!(c!=null&&c.asmName))return null;const d=["word","16bit"].includes(String(c.type||"").toLowerCase()),_=Number(o.digits),p=Number.isFinite(_)&&_>0,h=d?5:3,u=/\d+(?!.*\d)/.exec(t);let f=p?Math.floor(_):h,b=t.length,m=t;s&&typeof s.index=="number"?(b=s.index,m=`${t.slice(0,b)}${"0".repeat(f)}${t.slice(b+s[0].length)}`):u&&typeof u.index=="number"?(b=u.index,p||(f=Math.max(1,u[0].length)),m=`${t.slice(0,b)}${"0".repeat(f)}${t.slice(b+u[0].length)}`):m=`${t}${"0".repeat(f)}`;const y=Math.floor((((A=e.position)==null?void 0:A.x)||0)/8)+b,T=Math.floor((((S=e.position)==null?void 0:S.y)||0)/8);return{index:l,asmName:String(c.asmName),digits:f,fieldOffset:b,isWord:d,staticText:m,vramAddress:6144+T*32+y}}function Qt(e,l){return e.map((a,t)=>Ar(a,t,l)).filter(a=>a!==null)}function Tr(e){var n,s,r;const l=[],a=new Map;if(console.log(`🎯 [HUD Generator] Total screens: ${((n=e.screenMaps)==null?void 0:n.length)||0}`),(s=e.screenMaps)==null||s.forEach(i=>{var _;const c=!!i.hudConfiguration,d=((_=i.hudConfiguration)==null?void 0:_.elements)||[];console.log(`  📺 Screen "${i.name}" (${i.id}): hudConfiguration=${c}, elements=${d.length}`),d.length>0&&(d.forEach((p,h)=>console.log(`    📝 Element[${h}]: type=${p.type}, name="${p.name}", text="${p.text||""}" pos=(${p.position.x},${p.position.y}) visible=${p.visible}`)),l.push(...d),a.set(i.id,d))}),console.log(`🎯 [HUD Generator] Total HUD elements found: ${l.length}`),l.length===0)return`; ==================================================================
; HUD SYSTEM (EMPTY - No HUD elements defined)
; ==================================================================
render_hud:
    ret
force_render_hud:
    ret
update_hud_score:
    ret
update_hud_lives:
    ret
`;let t=`; ==================================================================
; HUD SYSTEM - Screen 2 Text Rendering
; ==================================================================
; Total HUD Elements: ${l.length}
; Screens with HUD: ${a.size}
;
; HUD Elements use TileBank fonts to render text in Screen 2 mode
; Each element can be positioned anywhere on screen (256x192 pixels)
; ==================================================================

`;t+=Cr(l,e);let o=0;return(r=e.screenMaps)==null||r.forEach(i=>{const c=i.activeAreaY??0;c>o&&(o=c)}),t+=Ir(),t+=vr(l,o,e),t+=Rr(l,e),t}function Cr(e,l){let a=`; ------------------------------------------------------------------
; HUD DATA STRUCTURES
; ------------------------------------------------------------------

`;const t=Qt(e,l),o=new Map(t.map(n=>[n.index,n]));return a+=`HUD_ELEMENT_COUNT   EQU ${e.length}

`,a+=`; HUD Element Data Table
`,a+=`; Format: [Type:1][X:1][Y:1][Width:1][Height:1][Flags:1][TextPtr:2][Visible:1]
`,a+=`hud_element_data:
`,e.forEach((n,s)=>{var m;const r=wr(n.type),i=n.position.x,c=n.position.y,d=n.visible?1:0,_=`hud_text_${s}`;let p=0,h=1,u=0;const f=n.details||{};(f.border||f.borderColor||f.overallBorderColor)&&(u|=1);const b=((m=o.get(s))==null?void 0:m.staticText)||n.text||n.name||"";b?p=b.length:f.width?p=Math.ceil(f.width/8):p=10,a+=`    DB ${r}, ${i}, ${c}    ; Element ${s}: ${n.type} at (${i},${c})
`,a+=`    DB ${p}, ${h}, ${u} ; W, H, Flags
`,a+=`    DW ${_}             ; Text pointer
`,a+=`    DB ${d}                ; Visible
`}),a+=`
`,a+=`; HUD Text Strings
`,e.forEach((n,s)=>{var c;const r=((c=o.get(s))==null?void 0:c.staticText)||n.text||n.name||"",i=`hud_text_${s}`;a+=`${i}:
`,a+=`    DB "${r}", 0
`}),a+=`
`,a}function Ir(e){return`; ------------------------------------------------------------------
; imprimir_marco
; Draw HUD frame borders (called once per screen load)
; ------------------------------------------------------------------
imprimir_marco:
    push af
    push bc
    push de
    push hl
    push ix

    ld b, HUD_ELEMENT_COUNT
    ld ix, hud_element_data

.marco_loop:
    push bc                     ; Save counter

    ; Check visible flag first (offset 8)
    ld a, (ix+8)                ; A = Visible
    or a
    jr z, .skip_marco           ; Skip if not visible

    ; Read element fields
    ld d, (ix+1)                ; D = X position (pixels)
    ld e, (ix+2)                ; E = Y position (pixels)
    ld b, (ix+3)                ; B = Width (tiles)
    ld c, (ix+4)                ; C = Height (tiles)
    ld a, (ix+5)                ; A = Flags

    ; Check if border flag is set (bit 0)
    bit 0, a
    jr z, .skip_marco           ; Skip if no border

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

.skip_marco:
    ; Move to next element
    ld bc, 9                    ; Size of each element entry
    add ix, bc                  ; IX points to next element

    pop bc                      ; Restore counter
    djnz .marco_loop

    pop ix
    pop hl
    pop de
    pop bc
    pop af
    ret

`}function vr(e,l,a){const o=e.findIndex(d=>d.type===ie.Score),n=e.findIndex(d=>d.type===ie.Lives),s=Qt(e,a),r=Pa(a,"global_var_score"),i=Pa(a,"global_var_lives");return`; ------------------------------------------------------------------
; render_hud
; Main HUD rendering function
; Only redraws when hud_dirty_flag is set
; Input:
;   None
; Output:
;   None
; Clobbers:
;   None visible to caller
; Preserves:
;   AF, BC, DE, HL, IX
; Notes:
;   - Returns immediately if hud_dirty_flag = 0
;   - Re-applies dynamic numeric fields (Score/Lives/custom bindings) after redrawing static text
; ------------------------------------------------------------------
render_hud:
    ld a, (hud_dirty_flag)
    or a
    ret z                       ; Skip if HUD hasn't changed
    xor a
    ld (hud_dirty_flag), a      ; Clear flag after rendering
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
    pop bc                      ; BC = Width, Height (tiles)
    ; Re-push in same order as original (BC bottom, DE top)
    push bc                     ; Save Width, Height (bottom)
    push de                     ; Save X, Y (top)

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
${`${o>=0&&r?`
    ; Re-apply dynamic Score digits after redrawing static HUD text.
    ld a, (global_var_score)
    ld l, a
    ld a, (global_var_score+1)
    ld h, a
    call update_hud_score
`:o>=0?`
    ; Score HUD present but global_var_score is not allocated in this project.
`:""}${n>=0&&i?`
    ; Re-apply dynamic Lives digit after redrawing static HUD text.
    ld a, (global_var_lives)
    call update_hud_lives
`:n>=0?`
    ; Lives HUD present but global_var_lives is not allocated in this project.
`:""}${s.map(d=>`
    ; Re-apply HUD-bound numeric field ${d.index} from ${d.asmName}.
${d.isWord?`    ld a, (${d.asmName})
    ld l, a
    ld a, (${d.asmName}+1)
    ld h, a`:`    ld a, (${d.asmName})
    ld l, a
    ld h, 0`}
    call update_hud_dynamic_${d.index}
`).join("")}`}

    pop ix
    pop hl
    pop de
    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; force_render_hud
; Force a HUD redraw on this frame, preserving caller-visible registers
; Input:
;   None
; Output:
;   None
; Clobbers:
;   None visible to caller
; Preserves:
;   AF, BC, DE, HL, IX
; Notes:
;   - Sets hud_dirty_flag = 1 and then calls render_hud
; ------------------------------------------------------------------
force_render_hud:
    push af
    ld a, 1
    ld (hud_dirty_flag), a
    call render_hud
    pop af
    ret

`}function Rr(e,l){const a=e.findIndex(g=>g.type===ie.Score),t=e.findIndex(g=>g.type===ie.Lives),o=a>=0?e[a]:null,n=t>=0?e[t]:null,s=a>=0?`hud_text_${a}`:null,r=t>=0?`hud_text_${t}`:null,i=Qt(e,l),c=(g,A)=>{const S=g||"",E=/\d+(?!.*\d)/.exec(S);return!E||typeof E.index!="number"?{offset:S.length,digits:A}:{offset:E.index,digits:Math.max(1,E[0].length)}},d=(o==null?void 0:o.text)||(o==null?void 0:o.name)||"",_=(n==null?void 0:n.text)||(n==null?void 0:n.name)||"",p=c(d,5),h=c(_,1),u=(g,A)=>{var C,v;if(!g)return null;const S=Math.floor((((C=g.position)==null?void 0:C.x)||0)/8)+A;return 6144+Math.floor((((v=g.position)==null?void 0:v.y)||0)/8)*32+S},f=u(o,p.offset),b=u(n,h.offset),m=(g,A=!1)=>{const S=Math.max(1,g),E=Math.min(S,5),C=Math.max(0,S-E),v=[1e4,1e3,100,10],R=v.slice(v.length-Math.max(0,E-1)),L=Array.from({length:C},(k,O)=>`    ; Leading digit ${O}: forced zero (${A?"Score":"16-bit value"} max 65535)
    ld a, '0'
    push hl
    ld h, d
    ld l, e
    call FAST_WRTVRM
    pop hl
    inc de
`).join(""),x=R.map((k,O)=>`    ; Runtime digit ${O}: / ${k}
    ld bc, ${k}
    call hud_div16
    add a, '0'
    push hl
    ld h, d
    ld l, e
    call FAST_WRTVRM
    pop hl
    inc de
`).join("");return`${L}${x}    ; Final digit: ones (remainder)
    ld a, l
    add a, '0'
    push hl
    ld h, d
    ld l, e
    call FAST_WRTVRM
    pop hl
`},y=m(p.digits,!0),T=i.map(g=>`; ------------------------------------------------------------------
; update_hud_dynamic_${g.index}
; Update HUD-bound numeric field ${g.index} from HL value
; Input: HL = Current value (16-bit binary, 0-65535)
; Output:
;   None
; Clobbers:
;   None visible to caller
; Preserves:
;   AF, BC, DE, HL
; Notes:
;   - Writes only the numeric digits in VRAM; the static label is not touched
; ------------------------------------------------------------------
update_hud_dynamic_${g.index}:
    push af
    push bc
    push de
    push hl

    ld de, #${g.vramAddress.toString(16).toUpperCase()}

${m(g.digits)}    pop hl
    pop de
    pop bc
    pop af
    ret

`).join("");return`; ------------------------------------------------------------------
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

    cp 32                       ; Check if >= 32 (printable ASCII)
    jr nc, .valid_char
    ld a, 32                    ; Replace control chars with space
.valid_char:
    push de
    call FAST_WRTVRM
    pop de
    inc de
    inc hl
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
    cp 32
    ret nc
    ld a, 32
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
    ld l, e
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld e, d
    ld d, 0
    add hl, de
    ld de, #1800
    add hl, de
    push hl
    push bc
    ld a, 43
    call FAST_WRTVRM
    inc hl
    ld a, b
    sub 2
    jr z, .skip_top_edge
    jr c, .skip_top_edge
    ld b, a
.top_edge_loop:
    ld a, 45
    call FAST_WRTVRM
    inc hl
    djnz .top_edge_loop
.skip_top_edge:
    ld a, 43
    call FAST_WRTVRM
    pop bc
    pop hl
    ld de, 32
    add hl, de
    ld a, c
    sub 2
    jr z, .bottom_row
    jr c, .bottom_row
    ld c, a
.middle_row_loop:
    push hl
    push bc
    ld a, 124
    call FAST_WRTVRM
    ld a, b
    dec a
    ld e, a
    ld d, 0
    add hl, de
    ld a, 124
    call FAST_WRTVRM
    pop bc
    pop hl
    ld de, 32
    add hl, de
    dec c
    jr nz, .middle_row_loop
.bottom_row:
    ld a, 43
    call FAST_WRTVRM
    inc hl
    ld a, b
    sub 2
    jr z, .skip_bottom_edge
    jr c, .skip_bottom_edge
    ld b, a
.bottom_edge_loop:
    ld a, 45
    call FAST_WRTVRM
    inc hl
    djnz .bottom_edge_loop
.skip_bottom_edge:
    ld a, 43
    call FAST_WRTVRM
    pop hl
    pop de
    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; update_hud_score
; Update score HUD element with current score value
; Input: HL = Score value (16-bit binary, 0-65535)
; Output:
;   None
; Clobbers:
;   None visible to caller
; Preserves:
;   AF, BC, DE, HL
; ------------------------------------------------------------------
update_hud_score:
${s?`    push af
    push bc
    push de
    push hl

    ld de, #${(f||0).toString(16).toUpperCase()}

${y}    pop hl
    pop de
    pop bc
    pop af`:"    ; No Score element defined in HUD"}
    ret

; Helper: HL = HL / BC, A = quotient, HL = remainder
hud_div16:
    xor a
.hud_div16_loop:
    or a
    sbc hl, bc
    jr c, .hud_div16_done
    inc a
    jr .hud_div16_loop
.hud_div16_done:
    add hl, bc
    ret

; ------------------------------------------------------------------
; update_hud_lives
; Update lives HUD element
; Input: A = Number of lives (0-9)
; Output:
;   None
; Clobbers:
;   None visible to caller
; Preserves:
;   AF, HL
; ------------------------------------------------------------------
update_hud_lives:
${r?`    push af
    push hl
    add a, '0'
    ld hl, #${(b||0).toString(16).toUpperCase()}
    call FAST_WRTVRM
    pop hl
    pop af`:"    ; No Lives element defined in HUD"}
    ret

${T}`}function wr(e){return{[ie.Score]:1,[ie.HighScore]:2,[ie.Lives]:3,[ie.EnergyBar]:4,[ie.ItemDisplay]:5,[ie.SceneName]:6,[ie.MiniMap]:7,[ie.CoinCounter]:8,[ie.BossEnergyBar]:9,[ie.PhaseIndicator]:10,[ie.AttackAlert]:11,[ie.TextBox]:12,[ie.NumericField]:13,[ie.CustomCounter]:14}[e]||0}function _t(e){return e.toLowerCase().replace(/[^a-z0-9]/g,"_")}function pt(e){return e.toUpperCase().replace(/[^A-Z0-9]/g,"_")}function Nr(e,l){return(Array.isArray(e.globalVariables)?e.globalVariables:[]).some(t=>String((t==null?void 0:t.asmName)||"").trim().toLowerCase()===l.toLowerCase())}function ka(e){switch(String(e??"").trim().toLowerCase()){case"north":case"up":return"north";case"south":case"down":return"south";case"east":case"right":return"east";case"west":case"left":return"west";default:return null}}function ht(e,l){const a=l==="from"?"fromNodeId":"toNodeId",t=e==null?void 0:e[a];if(typeof t=="string"&&t.length>0)return t;const o=e==null?void 0:e[l];return typeof o=="string"&&o.length>0?o:o&&typeof o.nodeId=="string"&&o.nodeId.length>0?o.nodeId:null}function Oa(e,l){const a=l==="from"?"fromDirection":"toDirection",t=e==null?void 0:e[a],o=ka(t);if(o)return o;const n=e==null?void 0:e[l];return ka(n==null?void 0:n.direction)}function Pt(e,l){var n,s;const a=(n=l.screens)==null?void 0:n.find(r=>r.id===e),t=((s=a==null?void 0:a.name)==null?void 0:s.toUpperCase().replace(/[^A-Z0-9]/g,"_"))||"UNKNOWN",o=e?`_${e.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";return`load_screen_${t.toLowerCase()}${o.toLowerCase()}`}function Ua(e,l){var g;const a=(g=l.screens)==null?void 0:g.find(A=>A.id===e),t=Math.max(1,(a==null?void 0:a.width)??32),o=Math.max(1,(a==null?void 0:a.height)??24),n=Math.max(0,Math.min(t-1,(a==null?void 0:a.activeAreaX)??0)),s=Math.max(0,Math.min(o-1,(a==null?void 0:a.activeAreaY)??0)),r=Math.max(1,Math.min(t-n,(a==null?void 0:a.activeAreaWidth)??t)),i=Math.max(1,Math.min(o-s,(a==null?void 0:a.activeAreaHeight)??o)),c=n*8,d=s*8,_=c+r*8,p=d+i*8,h=2,u=16,f=16,b=c+h,m=Math.max(b,_-u-h),y=d+h,T=Math.max(y,p-f-h);return{leftPx:c,topPx:d,rightPx:_,bottomPx:p,westExitX:c+h,eastExitX:Math.max(c,_-u),northExitY:d+h,southExitY:Math.max(d,p-f),enterWestX:b,enterEastX:m,enterNorthY:y,enterSouthY:T}}function Lr(e,l){var s,r,i,c;const a=(s=l.screens)==null?void 0:s.find(d=>d.id===e),t=(i=(r=a==null?void 0:a.hudConfiguration)==null?void 0:r.importedFrame)==null?void 0:i.cells;if(!Array.isArray(t)||t.length===0)return null;const o=((c=a==null?void 0:a.name)==null?void 0:c.toUpperCase().replace(/[^A-Z0-9]/g,"_"))||"UNKNOWN",n=e?`_${e.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";return`hud_imported_frame_${o.toLowerCase()}${n.toLowerCase()}_draw`}function Dr(e,l){const a=Array.isArray(e==null?void 0:e.nodes)?e.nodes:[];if(a.length===0)return null;const t=[],o=e==null?void 0:e.startScreenNodeId,n=a.find(s=>(s==null?void 0:s.id)===o);n&&t.push(n),a.forEach(s=>{(!n||(s==null?void 0:s.id)!==n.id)&&t.push(s)});for(const s of t){const r=s==null?void 0:s.screenAssetId;if(!r)continue;const i=Lr(r,l);if(i)return i}return null}function xr(e,l,a,t,o,n,s){const r=`check_transition_${e}_s${l}_skip_${a}`,i=`check_transition_${e}_s${l}_apply_${a}`;let c="",d="";return a==="east"?(c=`    ; East exit: X near right edge and rightward input
    ld a, (input_state)
    cp STICK_RIGHT
    jr z, .dir_ok_${r}
    cp STICK_UPRIGHT
    jr z, .dir_ok_${r}
    cp STICK_DOWNRIGHT
    jp nz, ${r}
.dir_ok_${r}:
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp ${n.eastExitX}
    jp c, ${r}
`,d=`    ; Enter from west edge
    ld hl, entity_x_pos
    add hl, de
    ld (hl), ${s.enterWestX}
`):a==="west"?(c=`    ; West exit: X near left edge and leftward input
    ld a, (input_state)
    cp STICK_LEFT
    jr z, .dir_ok_${r}
    cp STICK_UPLEFT
    jr z, .dir_ok_${r}
    cp STICK_DOWNLEFT
    jp nz, ${r}
.dir_ok_${r}:
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp ${n.westExitX}
    jp nc, ${r}
`,d=`    ; Enter from east edge of target active area
    ld hl, entity_x_pos
    add hl, de
    ld (hl), ${s.enterEastX}
`):a==="south"?(c=`    ; South exit: Y near bottom edge
    ; No input-direction gate: supports gravity/platform-driven movement
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    cp ${n.southExitY}
    jp c, ${r}
`,d=`    ; Enter from north edge
    ld hl, entity_y_pos
    add hl, de
    ld (hl), ${s.enterNorthY}
`):(c=`    ; North exit: Y near top edge
    ; No input-direction gate: supports velocity-driven movement
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    cp ${n.northExitY}
    jp nc, ${r}
`,d=`    ; Enter from south edge of target active area
    ld hl, entity_y_pos
    add hl, de
    ld (hl), ${s.enterSouthY}
`),`${c}${i}:
    push de
    ld a, ((${o} - #4000) / #2000)
    ld hl, ${o}
    call mapper_call_hl_auto
    pop de
    ld a, ${t}
    ld (current_screen_index), a
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ld hl, entity_screen_id
    add hl, de
    ld (hl), a
${d}    ; Reset player velocity after transition
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a

    ; Debounce immediate re-trigger
    ld a, 8
    ld (screen_transition_cooldown), a
    call rebuild_used_entity_list  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state for new screen
    ret

${r}:
`}function Mr(e){var s;const l=e.worldmaps||[],a=new Map(_l(e).map(r=>[r.id,r])),t=!!((s=e.screenMaps)!=null&&s.some(r=>{var i;return Array.isArray((i=r==null?void 0:r.hudConfiguration)==null?void 0:i.elements)&&r.hudConfiguration.elements.length>0})),o=Nr(e,"global_var_time_remaining");if(l.length===0)return`; ==================================================================
; WORLD MAPS (SKIPPED - NO WORLDS DETECTED)
; File: worlds.asm
; ==================================================================

; No worlds detected in project - world system not needed

; Minimal stub functions for compatibility
load_world_default:
    ret

check_world_screen_transition:
    ret

; ==================================================================
; END OF WORLDS (MINIMAL VERSION)
; ==================================================================
`;let n=`; ==================================================================
; WORLD MAPS
; File: worlds.asm
; Description: World map structures and screen loading functions
; Generated by Mideas MSX Generator
; ==================================================================

`;return n+=`; ==================================================================
; WORLD MAP CONSTANTS
; ==================================================================

`,l.forEach((r,i)=>{var _;const c=pt(r.name||`world_${i}`),d=r.id||`world_${i}`;if(n+=`; World: ${r.name||"Unnamed"} (${d})
WORLD_${c}_ID EQU ${i}
WORLD_${c}_SCREEN_COUNT EQU ${((_=r.nodes)==null?void 0:_.length)||0}
`,r.nodes&&r.nodes.length>0){const p=new Map;r.nodes.forEach((h,u)=>{const f=pt(h.name||`screen_${u}`),b=p.get(f)||0,m=b===0?f:`${f}_${b+1}`;p.set(f,b+1),n+=`WORLD_${c}_SCREEN_${m}_ID EQU ${u}
`})}n+=`
`}),n+=`; ==================================================================
; WORLD LOADING FUNCTIONS
; ==================================================================

`,l.forEach(r=>{const i=r.id||"unknown",c=r.startScreenNodeId,d=r.nodes||[];if(n+=`; ------------------------------------------------------------------
; Load World: ${r.name||"Unnamed"}
; World ID: ${i}
; Screens: ${d.length}
; Start Screen Node: ${c||"none"}
; ------------------------------------------------------------------
load_world_${_t(i)}:
`,d.length===0){n+=`    ; No screens in this world
    ret

`;return}const _=d.find(m=>m.id===c)||d[0],p=Math.max(0,d.findIndex(m=>m.id===_.id)),h=_.screenAssetId;if(!h){n+=`    ; No valid start screen found
    ret

`;return}const u=Pt(h,e),f=Dr(r,e),b=a.get(i);n+=`    ; Load runtime sprite patterns for this world
${b?`    call load_sprite_patterns_${b.label}
`:""}    ; Load start screen: ${_.name||"unknown"} (${h})
    ld a, ((${u} - #4000) / #2000)
    ld hl, ${u}
    call mapper_call_hl_auto

`,f&&(n+=`    ; Draw imported HUD frame once at world start
    call ${f}

`),t&&(n+=`    ; Draw HUD frame once at world start
    call imprimir_marco

`),n+=`    ; Initialize world state
    ld a, WORLD_${pt(r.name||"unnamed")}_ID
    ld (current_world_id), a

    ld a, ${p}
    ld (current_screen_index), a
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1

    xor a
    ld (screen_transition_cooldown), a

${o?`    call reset_world_screen_timer
`:""}    call rebuild_used_entity_list  ; Precompute room entity buckets before gameplay resumes
    call apply_collected_tiles     ; Re-apply persistent collection state for this screen
    ret

`}),n+=`; ==================================================================
; SCREEN TRANSITION FUNCTIONS
; ==================================================================

`,l.forEach(r=>{const i=r.id||"unknown",c=r.nodes||[],d=r.connections||[];if(d.length===0){n+=`; World ${r.name||"Unnamed"} has no screen connections

`;return}n+=`; ------------------------------------------------------------------
; World: ${r.name||"Unnamed"}
; Connections: ${d.length}
; ------------------------------------------------------------------

`,d.forEach((_,p)=>{const h=ht(_,"from"),u=ht(_,"to");if(!h||!u){n+=`; Invalid connection ${p}: missing endpoint IDs

`;return}const f=c.find(g=>g.id===h),b=c.find(g=>g.id===u);if(!f||!b){n+=`; Invalid connection ${p}: missing nodes

`;return}const m=b.screenAssetId,y=c.findIndex(g=>g.id===b.id),T=Pt(m,e);n+=`; Transition: ${f.name||"screen"} -> ${b.name||"screen"}
transition_${_t(i)}_${p}:
    ld a, ((${T} - #4000) / #2000)
    ld hl, ${T}
    call mapper_call_hl_auto

    ld a, ${y}
    ld (current_screen_index), a
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
${o?`    call reset_world_screen_timer
`:""}    call rebuild_used_entity_list  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state
    ret

`})}),n+=`; ==================================================================
; SCREEN EDGE TRANSITION RUNTIME
; ==================================================================
; Checks controllable entity exits and transitions world screen.
; Prevents X/Y byte wrap from keeping player in same screen.
; ==================================================================

check_world_screen_transition:
    ; Debounce to prevent immediate re-trigger after crossing
    ld a, (screen_transition_cooldown)
    or a
    jr z, .find_player_start
    dec a
    ld (screen_transition_cooldown), a
    ret

    ; Find first controllable entity from active list (already filtered by screen)
    ; This avoids scanning all 32 entity slots every frame.
.find_player_start:
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a
    ld hl, active_entity_list
.find_player_loop:
    ; E = entity index from compact active list
    ld e, (hl)
    inc hl
    ld d, 0

    ; Check Input component mask
    push hl
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    pop hl
    jr nz, .player_found

.find_player_next:
    djnz .find_player_loop
    ret                        ; No controllable entity found

.player_found:
    ld d, 0                    ; DE = player entity index

.dispatch_world:
    ld a, (current_world_id)
`,l.forEach((r,i)=>{const c=pt(r.name||`world_${i}`),d=r.id||`world_${i}`,_=`check_transition_world_${_t(d)}`;n+=`    cp WORLD_${c}_ID
    jp z, ${_}
`}),n+=`    ret

`,l.forEach((r,i)=>{const c=r.id||`world_${i}`,d=_t(c),_=r.nodes||[],p=r.connections||[];if(n+=`check_transition_world_${d}:
`,_.length===0||p.length===0){n+=`    ret

`;return}const h=new Map;_.forEach((f,b)=>h.set(f.id,b));const u=new Map;_.forEach((f,b)=>u.set(b,{})),p.forEach(f=>{const b=ht(f,"from"),m=ht(f,"to"),y=Oa(f,"from"),T=Oa(f,"to");if(!b||!m)return;const g=h.get(b),A=h.get(m);if(!(g===void 0||A===void 0)){if(y){const S=u.get(g);S&&S[y]===void 0&&(S[y]=A)}if(T){const S=u.get(A);S&&S[T]===void 0&&(S[T]=g)}}}),n+=`    ld a, (current_screen_index)
`,_.forEach((f,b)=>{const m=`check_transition_${d}_screen_${b}`;n+=`    cp ${b}
    jp z, ${m}
`}),n+=`    ret

`,_.forEach((f,b)=>{const m=u.get(b)||{},y=`check_transition_${d}_screen_${b}`;n+=`${y}:
`;const T=["east","west","south","north"];let g=!1;T.forEach(A=>{const S=m[A];if(S===void 0)return;const E=_[S];if(!(E!=null&&E.screenAssetId))return;const C=Pt(E.screenAssetId,e),v=Ua(f.screenAssetId,e),R=Ua(E.screenAssetId,e);n+=xr(d,b,A,S,C,v,R),g=!0}),n+=`    ret

`})}),n+=`; ==================================================================
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
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    call rebuild_used_entity_list
    ret

; ==================================================================
; END OF WORLDS
; ==================================================================
`,n}function $a(e){e=e.replace("#","");const l=parseInt(e.substring(0,2),16),a=parseInt(e.substring(2,4),16),t=parseInt(e.substring(4,6),16);if(l<50&&a<50&&t<50)return 1;if(l>200&&a>200&&t>200)return 15;if(l>200&&a<100&&t<100)return 8;if(l<100&&a>200&&t<100)return 3;if(l<100&&a<100&&t>200)return 5;if(l>200&&a>200&&t<100)return 10;if(l>150&&a<100&&t>150)return 13;if(l<100&&a>150&&t>150)return 7;const o=(l+a+t)/3;return o<64?1:o<128?14:15}function Pr(e){const l=e.gameFlow&&e.gameFlow.nodes&&e.gameFlow.nodes.some(t=>t.type==="SubMenu");if(!l)return`; ==================================================================
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

`;return l?(a+=`; ==================================================================
; MENU CONSTANTS
; ==================================================================

`,e.gameFlow.nodes.filter(n=>n.type==="SubMenu").forEach((n,s)=>{const r=(n.title||n.id).toUpperCase().replace(/[^A-Z0-9]/g,"_");a+=`MENU_${r}_ID EQU ${s}
`}),a+=`
; ==================================================================
; MENU FUNCTIONS
; ==================================================================

`,e.gameFlow.nodes.filter(n=>n.type==="SubMenu").forEach(n=>{var _,p,h,u;(n.title||n.id).toUpperCase().replace(/[^A-Z0-9]/g,"_");const s=n.id.replace(/[^a-zA-Z0-9]/g,"_"),r=((p=(_=n.appearance)==null?void 0:_.colors)==null?void 0:p.background)||"#000000",i=((u=(h=n.appearance)==null?void 0:h.colors)==null?void 0:u.border)||"#FFFFFF",c=$a(r),d=$a(i);a+=`show_menu_${s}:
    ; Display ${n.title||n.id} menu
    ; Set background color using VDP
    ld b, ${c*16+d} ; Background (high) | Border (low)
    ld c, 7                     ; VDP Register 7
    call FAST_WRTVDP

    ; Set system color variables
    ld a, ${d}
    ld (BDRCLR), a

    ld a, ${c}
    ld (BAKCLR), a

    ld a, 15                    ; Default text color (White)
    ld (FORCLR), a

    ; Clear screen with background color
    call CLS

    ; Display menu title
    ld hl, menu_${s}_title
    ld de, NAMETBL + (5 * 32) + 10
    call print_string_screen2

    ; Display menu options
    ; TODO: Add option rendering logic here

    ret

menu_${s}_title:
    db "${(n.title||"Menu").replace(/"/g,'\\"')}", 0

handle_menu_${s}:
    ; Handle ${n.title||n.id} menu input
    call GTSTCK
    ; TODO: Implement input handling
    ret

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
    call CLS

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

    ; FAST_WRTVRM expects: A = data, HL = VRAM address
    push hl         ; Save string pointer
    push de         ; Save VRAM address
    pop hl          ; HL = VRAM address (for FAST_WRTVRM)
    call FAST_WRTVRM ; Write character to VRAM (fast)
    pop hl          ; Restore string pointer

    inc hl          ; Next character in string
    inc de          ; Next VRAM position
    jp print_loop

`,a+=`; ==================================================================
; END OF MENUS
; ==================================================================
`,a}const Ba={[w.NONE]:0,[w.SET_POSITION]:1,[w.MOVE_BY]:2,[w.SET_VELOCITY]:3,[w.APPLY_FORCE]:4,[w.CHANGE_SPRITE]:5,[w.PLAY_ANIMATION]:6,[w.SET_ANIMATION_SPEED]:7,[w.TOGGLE_ANIMATION]:8,[w.PLAY_SOUND]:9,[w.PLAY_MUSIC]:10,[w.MUTE_MUSIC]:11,[w.STOP_MUSIC]:12,[w.SET_VARIABLE]:13,[w.INCREMENT_VARIABLE]:14,[w.DECREMENT_VARIABLE]:15,[w.SET_COMPONENT_PROPERTY]:16,[w.WAIT]:17,[w.GOTO_STATE]:18,[w.DESTROY_ENTITY]:19,[w.SPAWN_ENTITY]:20,[w.GET_RANDOM_ENTITY_POSITION]:21,[w.CHANGE_GAME_FLOW_NODE]:22,[w.REGENERATE_HUD]:23,[w.DECREASE_LIVES]:24,[w.INCREASE_LIVES]:25,[w.RESPAWN_PLAYER]:26,[w.BREAK_TILE]:27,[w.REPLACE_TILE]:28,[w.RND]:29,[w.POINT_AT]:30,[w.ADD_VARIABLES]:31,[w.SUBTRACT_VARIABLES]:32,[w.MULTIPLY_VARIABLES]:33,[w.DIVIDE_VARIABLES]:34,[w.MODULO_VARIABLES]:35,[w.ASSIGN_VARIABLE]:36,[w.DISABLE_INPUT]:37,[w.ENABLE_INPUT]:38,[w.CLEAN_SPRITES]:39,[w.EXIT_CURRENT_WORLD]:40,END:255},kr={[F.AND]:1,[F.OR]:2,[F.NOT]:3,[F.KEY_PRESSED]:4,[F.KEY_RELEASED]:5,[F.TIME_OUT]:6,[F.CAN_MOVE_DIRECTION]:7,[F.HAS_COLLISION]:8,[F.PATH_CLEAR]:9,[F.ON_WALL_COLLISION]:10,[F.HAS_DEADLY_TILE_COLLISION]:11,[F.ANIMATION_COMPLETE]:12,[F.KEY_AND_MOVEMENT]:13,[F.VARIABLE_COMPARE]:14,[F.XOR]:15},Or={x:0,y:1,vx:2,vy:3,isOnGround:4,health:5,gem_count:6,last_gem_char:7},Fa={"==":0,"!=":1,">":2,"<":3,">=":4,"<=":5},ja={up:1,arrowup:1,down:5,arrowdown:5,left:7,arrowleft:7,right:3,arrowright:3,fire:9,space:9},kt={up:1,down:5,left:7,right:3},za={any:0,up:1,down:5,left:7,right:3},Ha={any:0,wall:1,enemy:2,item:3,entity:4},Va={up:0,down:1,left:2,right:3,"up-right":4,"up-left":5,"down-right":6,"down-left":7},bl={comp_pos:1,position:1,comp_physics:2,physics:2,comp_render:3,render:3,comp_animation:4,animation:4,comp_health:5,health:5,comp_cursors:6,cursors:6},Ur={x:1,y:2,vx:3,velocityx:3,vy:4,velocityy:4,sprite:5,spriteassetid:5,isvisible:6,frame:7,currentframeindex:7,animationspeed:8,speed:8,isplaying:9,current:10,max:11,inputspeed:12,cursorspeed:12};function $r(e){const l={...Or};return e&&e.length>0&&e.forEach((a,t)=>{const o=8+t;l[a.name]=o,a.asmName&&(l[a.asmName]=o)}),l}function Br(e){const l={};if(!e||e.length===0)return l;let a=128;return e.forEach(t=>{if(!t||!t.id)return;l[t.id]=a,t.name&&(l[String(t.name)]=a,l[String(t.name).toLowerCase()]=a);const o=Math.max(1,Math.ceil((Number(t.width)||8)/8)),n=Math.max(1,Math.ceil((Number(t.height)||8)/8));a+=o*n}),l}function yl(e){if(typeof e=="string"){const l=e.toLowerCase(),a=bl[l];if(a!==void 0)return a}return parseInt(K(e),10)||0}function Fr(e,l){if(typeof e=="string"){const a=yl(l),t=e.toLowerCase();if(t==="speed"&&a===bl.comp_cursors)return 12;const o=Ur[t];if(o!==void 0)return o}return parseInt(K(e),10)||0}function jr(e,l){if(typeof e=="string"&&l){if(l[e]!==void 0)return l[e];const t=e.toLowerCase();if(l[t]!==void 0)return l[t]}const a=parseInt(K(e),10);return Number.isNaN(a)?0:a}function El(e){const l={};if(!e||e.length===0)return l;let a=1;return e.forEach(t=>{!t||!t.id||l[t.id]===void 0&&(l[t.id]=a,t.name&&(l[String(t.name)]=a,l[String(t.name).toLowerCase()]=a),a<255&&(a+=1))}),l}function zr(e,l,a){const t=a||El(e);let o=0;Object.values(t).forEach(d=>{d>o&&(o=d)});const n=new Array(o+1).fill(0),s=new Array(o+1).fill(6),r=new Array(o+1).fill(1),i=new Array(o+1).fill(1),c=(d,_)=>{const p=Number(d);return Number.isFinite(p)?Math.max(0,Math.min(255,p|0)):_};return e==null||e.forEach(d=>{if(!(d!=null&&d.id))return;const _=t[d.id];if(!_)return;const p=Array.isArray(d.components)?d.components:[],h=p.find(S=>(S==null?void 0:S.definitionId)==="comp_render"),u=(h==null?void 0:h.defaultValues)||{},f=u.spriteAssetId??u.sprite??u.spriteId;if(typeof f=="string"&&l){const S=l[f],E=l[f.toLowerCase()];S!==void 0?n[_]=S&255:E!==void 0&&(n[_]=E&255)}const b=p.find(S=>(S==null?void 0:S.definitionId)==="comp_animation"),m=(b==null?void 0:b.defaultValues)||{};s[_]=c(m.animationSpeed??m.speed??6,6);const y=p.find(S=>(S==null?void 0:S.definitionId)==="comp_health"),T=(y==null?void 0:y.defaultValues)||{},g=c(T.current??1,1),A=c(T.max??g,g);r[_]=g,i[_]=A>=g?A:g}),{maxToken:o,spriteByToken:n,animSpeedByToken:s,healthCurByToken:r,healthMaxByToken:i}}const Hr=`
    ; ------------------------------------------------------------------
    ; SM_Update
    ; Main State Machine Update Routine
    ; Input: A = Entity Index
    ; ------------------------------------------------------------------
SM_Update:
    ld hl, prof_sm_update_calls
    inc (hl)
    jr nz, .sm_prof_counted
    inc hl
    inc (hl)
.sm_prof_counted:
    push af
    push bc
    push de
    push hl
    
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
    ld de, 5
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ; DE = Transitions List Ptr
    ld a, c             ; A = Entity Index (kept in C)
    
    call SM_CheckTransitions

    ; If Carry set, transition happened, stop update
    jp c, sm_update_done

    ; 4. Execute OnUpdate Actions (Optional)

sm_update_done:
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

    ; Condition False: Skip Transition Tail and continue to next transition
    ; Transition tail layout after condition payload:
    ;   [0-1] Target State Ptr
    ;   [2-3] Actions Ptr
    ld de, 4
    add hl, de
    
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
    ld c, a         ; Save entity index before null check overwrites A
    ld a, d
    or e
    ret z           ; Null pointer

    ex de, hl       ; HL = Action List

    ld b, c         ; B = Entity Index (restored from C)

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
    `,Vr=`
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
    DW Action_RegenerateHud; 23
    DW Action_DecLives; 24
    DW Action_IncLives; 25
    DW Action_Respawn; 26
    DW Action_BreakTile; 27
    DW Action_ReplaceTile; 28
    DW Action_Rnd; 29
    DW Action_PointAt; 30
    DW Action_AddVars; 31
    DW Action_SubVars; 32
    DW Action_MulVars; 33
    DW Action_DivVars; 34
    DW Action_ModVars; 35
    DW Action_AssignVar; 36
    DW Action_DisableInput; 37
    DW Action_EnableInput; 38
    DW Action_CleanSprites; 39
    DW Action_ExitCurrentWorld; 40

    ; ------------------------------------------------------------------
; ACTION HANDLERS IMPLEMENTATION
    ; ------------------------------------------------------------------

Action_Nop:
    ret

Action_SetPosition:
; Params: X(1 byte), Y(1 byte)
; Sets entity position (teleport)
    ld e, (hl)          ; E = X
    inc hl
    ld d, (hl)          ; D = Y
    inc hl

    push hl             ; Save Params Ptr

    ld c, b             ; C = Entity Index
    ld b, 0             ; BC = Entity Index

    ld hl, entity_x_pos
    add hl, bc
    ld (hl), e          ; Set X

    ld hl, entity_y_pos
    add hl, bc
    ld (hl), d          ; Set Y

    pop hl              ; Restore Params Ptr
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


; Table: SM Facing Direction to Sprite Lookup Table Pointer
; Maps entity_facing_dir (1=left,2=right,3=up,4=down) to directional sprite tables.
; Usage: dec facing (→ 0-3), index into this table to get the DW sprite_dir_*_table ptr.
SM_FacingDirTablePtrs:
    DW sprite_dir_left_table    ; facing 1 (LEFT)  → dec → 0
    DW sprite_dir_right_table   ; facing 2 (RIGHT) → dec → 1
    DW sprite_dir_up_table      ; facing 3 (UP)    → dec → 2
    DW sprite_dir_down_table    ; facing 4 (DOWN)  → dec → 3

; ==================================================================
; Action_ChangeSprite
; ------------------------------------------------------------------
; Cambia el sprite activo de una entidad. Realiza 5 operaciones:
;   1. Redirect direccional: si entity_facing_dir != 0, sustituye el
;      sprite pedido por su variante direccional (left/right/up/down)
;      usando SM_FacingDirTablePtrs.
;   2. Commit: escribe el sprite final en entity_sprite_asset_index.
;   3. Reset de animación: pone entity_anim_frame y entity_anim_tick a 0.
;   4. Flags de animación: activa PLAYING, aplica el flag de LOOP del
;      sprite, borra ONLY_WHEN_MOVING y marca FORCE_UPLOAD para que el
;      próximo update_animation_component sincronice el frame actual
;      fuera del path de cambio de sprite.
;   5. Colores de capas: actualiza sprite_layer_colors (tabla RAM) con
;      los colores del nuevo sprite desde SM_SpriteLayerColorTable.
;
; Input:
;   HL  = puntero al parámetro (sprite asset ID, 1 byte)
;   B   = entity index (convención SM_ExecuteActions)
;
; Output:
;   HL  = puntero al byte siguiente a los parámetros (para el caller)
;
; Destruye: AF, BC, DE, HL (todos restaurados al salir salvo HL=next param)
;
; Stack al entrar (top → bottom):
;   [llamada desde SM_ExecuteActions]
; Stack al salir: igual que al entrar.
;
; Tablas ROM usadas:
;   SM_FacingDirTablePtrs      — punteros a las 4 tablas de redirect
;   sprite_loop_flags          — 1 byte/sprite: 0x02=loop, 0x00=one-shot
;   SM_SpritePatternPtrTable   — puntero al frame 0 de cada sprite
;   SM_SpriteLayerColorTable   — colores por sprite (SPRITE_MAX_ENTITY_LAYERS bytes/sprite)
;
; Variables RAM usadas:
;   entity_facing_dir          — dirección actual de la entidad (0-4)
;   entity_sprite_asset_index  — índice del sprite activo de la entidad
;   entity_anim_frame          — frame actual de la animación
;   entity_anim_tick           — contador de ticks entre frames
;   entity_anim_flags          — flags de animación (ver bits más abajo)
;   entity_sprite_config       — base HW sprite + layer count (2 bytes/entidad)
;   sprite_layer_colors        — colores actuales por slot HW sprite (RAM)
;
; Bits de entity_anim_flags:
;   bit 0 = ANIM_FLAG_PLAYING       (1 = animando)
;   bit 1 = ANIM_FLAG_LOOP          (1 = bucle infinito, 0 = one-shot)
;   bit 2 = ANIM_FLAG_ONLY_WHEN_MOVING (1 = solo anima si vel != 0)
;   bit 3 = ANIM_FLAG_COMPLETED     (1 = one-shot llegó al último frame)
;   bit 4 = ANIM_FLAG_FORCE_UPLOAD  (1 = sincronizar frame actual en el próximo update_animation_component)
;
; NOTA: el bloque de redirect direccional usa B como registro temporal
; para guardar el sprite ID. Al salir del bloque, B queda corrupto.
; Se restaura explícitamente con "ld b, 0" antes de los add hl, bc.
; ==================================================================
Action_ChangeSprite:
    ld a, (hl)              ; A = Sprite Asset ID pedido por la SM
    inc hl                  ; HL apunta al byte siguiente al parámetro
    push hl                 ; [stack] guarda puntero de parámetros para el ret final

    push af                 ; [stack] guarda Sprite Asset ID (se necesita tras setup)

    ; ------------------------------------------------------------------
    ; Setup: convertir B (entity index) a BC = (0, entity_index)
    ; Convención de SM_ExecuteActions: B = entity index al entrar.
    ; ------------------------------------------------------------------
    ld c, b                 ; C = entity index
    ld b, 0                 ; B = 0  →  BC = (0, entity_index)

    ; Pre-calcular HL = &entity_sprite_asset_index[entity]
    ; Se usará tras el bloque de redirect para escribir el sprite final.
    ld hl, entity_sprite_asset_index
    add hl, bc              ; HL = &entity_sprite_asset_index[entity]

    pop af                  ; A = Sprite Asset ID (recuperado del stack)

    ; ------------------------------------------------------------------
    ; BLOQUE 1: Redirect direccional
    ; Si entity_facing_dir[entity] != 0, reemplaza el sprite pedido por
    ; su variante para la dirección actual.
    ;   facing 0 = sin dirección → usar sprite tal cual
    ;   facing 1 = izquierda  → SM_FacingDirTablePtrs[0] → sprite_dir_left_table
    ;   facing 2 = derecha     → SM_FacingDirTablePtrs[1] → sprite_dir_right_table
    ;   facing 3 = arriba      → SM_FacingDirTablePtrs[2] → sprite_dir_up_table
    ;   facing 4 = abajo       → SM_FacingDirTablePtrs[3] → sprite_dir_down_table
    ;
    ; Las tablas de dirección son arrays de 1 byte por sprite asset:
    ;   dir_table[originalSprite] = spriteVariante
    ; Si no existe variante, la tabla devuelve el mismo ID original.
    ;
    ; IMPORTANTE: este bloque usa B como temporal para guardar el sprite ID.
    ; Al salir, B queda con el sprite ID (no con 0). Se corrige después.
    ; ------------------------------------------------------------------
    push hl                 ; [stack] guarda &entity_sprite_asset_index[entity]

    ld h, 0
    ld l, c                 ; HL = entity index
    ld de, entity_facing_dir
    add hl, de              ; HL = &entity_facing_dir[entity]
    ld e, (hl)              ; E = facing dir (0=none, 1=left, 2=right, 3=up, 4=down)

    ld b, a                 ; B = sprite ID original  [B QUEDA CORRUPTO hasta ld b,0 abajo]
    ld a, e                 ; A = facing dir
    or a
    jr z, .acs_dir_done     ; facing = 0 → no hay redirect, usar sprite original
    cp 5
    jr nc, .acs_dir_done    ; facing inválido → ignorar redirect y usar sprite original

    ; Convertir facing (1-4) a índice de tabla (0-3): dec a
    dec a                   ; A = índice en SM_FacingDirTablePtrs (0=left, 1=right, 2=up, 3=down)
    ld hl, SM_FacingDirTablePtrs
    ld d, 0
    ld e, a
    add hl, de
    add hl, de              ; HL = &SM_FacingDirTablePtrs[facing_index * 2]  (tabla de punteros, DW)
    ld e, (hl)
    inc hl
    ld d, (hl)              ; DE = puntero a la tabla de sprites para esta dirección

    ; Leer el sprite redirigido: dir_table[originalSprite]
    ld l, b                 ; L = sprite ID original
    ld h, 0
    add hl, de              ; HL = &dir_table[originalSprite]
    ld b, (hl)              ; B = sprite ID redirigido (puede ser el mismo si no hay variante)

.acs_dir_done:
    ; A = sprite ID final (original o redirigido)
    ld a, b                 ; A = sprite ID (posiblemente redirigido)
    pop hl                  ; HL = &entity_sprite_asset_index[entity]  [recuperado del stack]

    ; ------------------------------------------------------------------
    ; BLOQUE 2: Commit del sprite y reset de estado de animación
    ; ------------------------------------------------------------------

    ; D guardará el sprite ID para uso posterior (color update, loop flags).
    ; No usar A directamente porque las instrucciones siguientes lo machan.
    ld d, a                 ; D = Sprite Asset ID final (preservado para los bloques 3-5)
    ld (hl), a              ; entity_sprite_asset_index[entity] = sprite ID final

    ; RESTAURAR B=0: el bloque de redirect dejó B=sprite_ID.
    ; Todos los "add hl, bc" siguientes necesitan BC = (0, entity_index).
    ld b, 0                 ; B = 0  →  BC = (0, entity_index)  [BUG FIX: corrupto por redirect]

    ; Reiniciar frame al principio del nuevo sprite
    ld hl, entity_anim_frame
    add hl, bc              ; HL = &entity_anim_frame[entity]
    ld (hl), 0              ; entity_anim_frame[entity] = 0  (empieza desde frame 0)

    ; Reiniciar contador de ticks para que el primer avance de frame
    ; ocurra tras entity_anim_speed ticks completos, no de inmediato.
    ld hl, entity_anim_tick
    add hl, bc              ; HL = &entity_anim_tick[entity]
    ld (hl), 0              ; entity_anim_tick[entity] = 0

    ; ------------------------------------------------------------------
    ; BLOQUE 3: Leer el flag de loop del nuevo sprite
    ; sprite_loop_flags[spriteId] = 0x02 si loop, 0x00 si one-shot
    ; El valor se guarda en E para aplicarlo a entity_anim_flags.
    ; D se restaura al sprite ID tras poner D=0 para el add hl,de.
    ; ------------------------------------------------------------------
    ld hl, sprite_loop_flags
    ld a, d                 ; A = Sprite Asset ID (salvar antes de poner D=0)
    ld e, a                 ; E = Sprite Asset ID
    ld d, 0
    add hl, de              ; HL = &sprite_loop_flags[spriteId]
    ld e, (hl)              ; E = loop flag (0x02=loop, 0x00=one-shot)
    ld d, a                 ; D = Sprite Asset ID  (restaurado para el upload)

    ; ------------------------------------------------------------------
    ; BLOQUE 4: Actualizar entity_anim_flags
    ;
    ; Cambios aplicados:
    ;   - bit 3 (COMPLETED)       → 0  (el one-shot anterior ya no importa)
    ;   - bit 0 (PLAYING)         → 1  (arrancar animación)
    ;   - bit 1 (LOOP)            → según sprite_loop_flags del nuevo sprite
    ;   - bit 2 (ONLY_WHEN_MOVING)→ 0  SIEMPRE, para cualquier sprite
    ;   - bit 4 (FORCE_UPLOAD)    → 1  pedir sincronización del frame actual
    ;                                 en el próximo update_animation_component
    ;
    ; Razón de limpiar ONLY_WHEN_MOVING siempre:
    ;   Cuando el SM llama ChangeSprite, lo hace porque quiere mostrar ese
    ;   sprite ahora. La animación debe avanzar siempre que PLAYING=1,
    ;   sin importar la velocidad. La lógica de "anima solo si se mueve"
    ;   es solo relevante para el sprite inicial de la entidad (config del
    ;   editor). Una vez en la SM, el estado controla qué sprite se muestra.
    ;   Si se dejara ONLY_WHEN_MOVING=1 para sprites loop, la animación walk
    ;   no avanzaría: la fricción del movement component puede dejar vel_x=0
    ;   antes de que llegue el turno de animation (step 11 > step 5).
    ; ------------------------------------------------------------------
    ld hl, entity_anim_flags
    add hl, bc              ; HL = &entity_anim_flags[entity]
    ld a, (hl)              ; A = flags actuales

    res 3, a                ; bit 3 = 0: borrar ANIM_FLAG_COMPLETED
    or ANIM_FLAG_PLAYING    ; bit 0 = 1: activar ANIM_FLAG_PLAYING
    and #FD                 ; bit 1 = 0: limpiar ANIM_FLAG_LOOP antes de aplicar el nuevo
    or e                    ; bit 1 = nuevo loop flag (E=0x02 o 0x00 según el sprite)
    and #FB                 ; bit 2 = 0: borrar ANIM_FLAG_ONLY_WHEN_MOVING (siempre)
    and #EF                 ; bit 4 = 0: limpiar FORCE_UPLOAD previo
    or ANIM_FLAG_FORCE_UPLOAD
    ld (hl), a              ; entity_anim_flags[entity] = flags actualizados

    ; ------------------------------------------------------------------
    ; BLOQUE 5: Actualizar tabla de colores de capas en RAM
    ;
    ; sprite_layer_colors es una tabla RAM indexada por slot HW sprite.
    ; SM_SpriteLayerColorTable es una tabla ROM de SPRITE_MAX_ENTITY_LAYERS
    ; bytes por sprite, con el color de cada capa del sprite.
    ;
    ; Se copian los colores del nuevo sprite a los slots HW de la entidad
    ; para que render_sprites use los colores correctos en el próximo frame.
    ;
    ; Registros a la entrada:
    ;   D = sprite asset ID
    ;   C = entity index
    ;   B = 0
    ; ------------------------------------------------------------------

    ; Validar rango (mismo guard que en el upload)
    ld a, d
    cp SM_SpriteAssetCount
    jp nc, .acs_skip_color_update  ; fuera de rango → saltar

    push de                 ; [stack] guarda D=spriteId, E=loopFlag

    ; Obtener el base HW sprite de la entidad: entity_sprite_config[entity * 2]
    ld h, 0
    ld l, c                 ; HL = entity index
    add hl, hl              ; HL = entity index * 2
    ld de, entity_sprite_config
    add hl, de              ; HL = &entity_sprite_config[entity * 2]
    ld c, (hl)              ; C = base HW sprite index (slot de partida en la OAM)

    pop de                  ; DE: D=spriteId, E=loopFlag  [recuperado del stack]

    ; Calcular HL = SM_SpriteLayerColorTable + spriteId * SPRITE_MAX_ENTITY_LAYERS
    ; mediante suma repetida (SPRITE_MAX_ENTITY_LAYERS es pequeño, típicamente 2-4)
    ld l, d                 ; L = sprite asset ID
    ld h, 0                 ; HL = sprite asset ID
    ld e, l
    ld d, h                 ; DE = sprite asset ID (multiplicando)
    ld hl, 0
    ld b, SPRITE_MAX_ENTITY_LAYERS
.acs_mul_max_layers:
    add hl, de              ; acumulador += sprite_ID
    djnz .acs_mul_max_layers ; repetir SPRITE_MAX_ENTITY_LAYERS veces → HL = spriteId * maxLayers
    ld de, SM_SpriteLayerColorTable
    add hl, de              ; HL = &SM_SpriteLayerColorTable[spriteId * maxLayers]

    ; Copiar SPRITE_MAX_ENTITY_LAYERS colores desde la tabla ROM a sprite_layer_colors[hw..]
    ; C = slot HW actual (se incrementa en cada iteración)
    ; HL = fuente en ROM (se incrementa con inc hl)
    ld b, SPRITE_MAX_ENTITY_LAYERS  ; B = contador de capas
.acs_color_update_loop:
    ld a, (hl)              ; A = color de esta capa en la tabla ROM
    inc hl                  ; avanzar al siguiente color en la tabla ROM
    push hl                 ; [stack] preservar HL (fuente ROM) durante el write
    push bc                 ; [stack] preservar B (contador) y C (slot HW)

    ld h, 0
    ld l, c                 ; HL = slot HW actual (índice en sprite_layer_colors)
    ld de, sprite_layer_colors
    add hl, de              ; HL = &sprite_layer_colors[hw_slot]
    ld (hl), a              ; sprite_layer_colors[hw_slot] = color del nuevo sprite

    pop bc                  ; [stack] restaurar B=contador, C=slot HW
    pop hl                  ; [stack] restaurar HL=fuente ROM
    inc c                   ; avanzar al siguiente slot HW
    djnz .acs_color_update_loop

.acs_skip_color_update:

    ; ------------------------------------------------------------------
    ; Epilogue: restaurar puntero de parámetros y retornar al dispatcher
    ; ------------------------------------------------------------------
    pop hl                  ; HL = puntero al byte tras los parámetros  [del push inicial]
    ret

Action_PlayAnimation:
    ; Params: Animation Name (1 byte - ignored in MSX, animations are frame-based)
    ; Starts/restarts animation playback from frame 0
    inc hl                  ; Skip animationName param (not used in MSX)

    push hl                 ; Save Params Ptr

    ; BC = Entity Index
    ld c, b
    ld b, 0

    ; Set PLAYING flag in entity_anim_flags
    ld hl, entity_anim_flags
    add hl, bc
    ld a, (hl)
    or ANIM_FLAG_PLAYING    ; Set bit 0 (PLAYING)
    and #F7                 ; Clear bit 3 (ANIM_FLAG_COMPLETED)
    ld (hl), a

    ; Reset animation to frame 0
    ld hl, entity_anim_frame
    add hl, bc
    ld (hl), 0

    ; Reset tick counter
    ld hl, entity_anim_tick
    add hl, bc
    ld (hl), 0

    ; We also need to get the sprite loop status and apply it!
    ; Get current sprite asset ID for this entity
    ld hl, entity_sprite_asset_index
    add hl, bc
    ld e, (hl)
    ld d, 0
    
    ; Read loop flag from sprite_loop_flags
    ld hl, sprite_loop_flags
    add hl, de
    ld e, (hl)              ; E = loop flag bit (0x02 or 0x00)
    
    ; Apply it to entity_anim_flags
    ld hl, entity_anim_flags
    add hl, bc
    ld a, (hl)
    and #FD                 ; Clear ANIM_FLAG_LOOP
    or e                    ; Set new loop status
    ld (hl), a

    pop hl                  ; Restore Params Ptr
    ret

Action_SetAnimSpeed:
    ; Params: Speed (1 byte) - frames to wait between animation frames
    ld a, (hl)              ; A = Speed
    inc hl

    push hl                 ; Save Params Ptr

    ; BC = Entity Index
    ld c, b
    ld b, 0

    ; Set entity_anim_speed
    ld hl, entity_anim_speed
    add hl, bc
    ld (hl), a              ; entity_anim_speed[entity] = speed

    pop hl                  ; Restore Params Ptr
    ret

Action_ToggleAnim:
    ; Params: Playing (1 byte) - 0 = pause, non-zero = play
    ld a, (hl)              ; A = Playing flag
    inc hl

    push hl                 ; Save Params Ptr
    push af                 ; Save Playing flag

    ; BC = Entity Index
    ld c, b
    ld b, 0

    ; Get current flags
    ld hl, entity_anim_flags
    add hl, bc
    ld a, (hl)

    pop de                  ; D = Playing flag (was in A)
    ld e, a                 ; E = Current flags

    ; Check if we should play or pause
    ld a, d
    or a
    jr z, .pause_anim

.play_anim:
    ; Set PLAYING flag (bit 0)
    ld a, e
    or ANIM_FLAG_PLAYING
    and #F7                 ; Clear bit 3 (ANIM_FLAG_COMPLETED)
    ld (hl), a
    jr .done_toggle

.pause_anim:
    ; Clear PLAYING flag (bit 0)
    ld a, e
    and #FE                 ; AND with 11111110 to clear bit 0 (PLAYING flag)
    ld (hl), a

.done_toggle:
    pop hl                  ; Restore Params Ptr
    ret

Action_PlaySound:
; Params: Sound Asset Index (1 byte)
    ld a, (hl)
    inc hl

    push hl
    ; PLAY_SOUND now uses the real exported sound asset stream.
    ; This keeps multi-step sounds audible and guarantees auto-silence.
    call SM_PlaySoundAsset
    pop hl
    ret

Action_PlayMusic:
; Params: Music Track Index(1 byte), Loop Flag(1 byte)
    ld a, (hl)
    inc hl
    ld b, (hl)
    inc hl

    push hl
    call music_play_track
    pop hl
    ret

Action_MuteMusic:
; No params
    push hl
    call music_mute
    pop hl
    ret

Action_StopMusic:
; No params
    push hl
    call music_stop
    pop hl
    ret

Action_SetVariable:
; Params: VarID(1 byte), Value(1 byte)
; Supports both entity variables (ID 0-5) and global variables (ID 6+)
    ld a, (hl)              ; A = VarID
    inc hl
    ld c, (hl)              ; C = Value
    inc hl

    push hl                 ; Save Params Ptr
    push bc                 ; Save Value and Entity Index

    ; Check if VarID < 6 (entity variable)
    cp 6
    jr c, .entity_variable

.global_variable:
    ; VarID >= 6: Global variable
    ; Calculate table offset: (VarID - 6) * 2
    sub 6                   ; A = VarID - 6
    ld l, a
    ld h, 0
    add hl, hl              ; HL = (VarID - 6) * 2

    ; Get address from SM_GlobalVarTable
    ld de, SM_GlobalVarTable
    add hl, de              ; HL = &SM_GlobalVarTable[VarID - 6]

    ; Read address from table (16-bit)
    ld e, (hl)
    inc hl
    ld d, (hl)              ; DE = address of global variable

    ; Store value
    pop bc                  ; Restore Value in C
    ld a, c
    ld (de), a              ; Store value in global variable

    pop hl                  ; Restore Params Ptr
    ret

.entity_variable:
    ; VarID 0-5: Entity variables (x, y, vx, vy, isOnGround, health)
    ; Map VarID to entity variable address
    push af                 ; Save VarID
    ld c, b                 ; C = Entity Index
    ld b, 0                 ; BC = Entity Index
    pop af                  ; A = VarID

    ; Dispatch based on VarID
    or a
    jr z, .set_x
    dec a
    jr z, .set_y
    dec a
    jr z, .set_vx
    dec a
    jr z, .set_vy
    dec a
    jr z, .set_on_ground
    ; VarID 5 = health

.set_health:
    ld hl, entity_health_current
    add hl, bc
    pop bc                  ; C = Value
    ld (hl), c
    pop hl
    ret

.set_x:
    ld hl, entity_x_pos
    add hl, bc
    pop bc
    ld (hl), c
    pop hl
    ret

.set_y:
    ld hl, entity_y_pos
    add hl, bc
    pop bc
    ld (hl), c
    pop hl
    ret

.set_vx:
    ld hl, entity_vel_x
    add hl, bc
    pop bc
    ld (hl), c
    pop hl
    ret

.set_vy:
    ld hl, entity_vel_y
    add hl, bc
    pop bc
    ld (hl), c
    pop hl
    ret

.set_on_ground:
    ld hl, entity_on_ground
    add hl, bc
    pop bc                  ; C = Value
    ld a, c
    or a
    jr z, .clear_ground
    set 0, (hl)             ; Set bit 0
    pop hl
    ret
.clear_ground:
    res 0, (hl)             ; Clear bit 0
    pop hl
    ret

Action_IncVariable:
; Params: VarID(1 byte), Amount(1 byte)
; Supports both entity variables (ID 0-5) and global variables (ID 6+)
    ld a, (hl)              ; A = VarID
    inc hl
    ld c, (hl)              ; C = Amount
    inc hl

    push hl                 ; Save Params Ptr

    ; Check if VarID < 6 (entity variable)
    cp 6
    jr nc, .inc_global

.inc_entity:
    ; Entity variable increment (simplified: only supports x, y positions for now)
    push bc                 ; Save Amount and Entity Index
    ld e, b                 ; E = Entity Index
    ld d, 0                 ; DE = Entity Index

    ; Map VarID to address (0=x, 1=y, 2=vx, 3=vy, 5=health)
    or a
    jr z, .inc_entity_x
    dec a
    jr z, .inc_entity_y
    dec a
    jr z, .inc_entity_vx
    dec a
    jr z, .inc_entity_vy
    dec a
    jr z, .inc_entity_on_ground
    jr .inc_entity_health   ; Default to health

.inc_entity_x:
    ld hl, entity_x_pos
    jr .do_inc_entity
.inc_entity_y:
    ld hl, entity_y_pos
    jr .do_inc_entity
.inc_entity_vx:
    ld hl, entity_vel_x
    jr .do_inc_entity
.inc_entity_vy:
    ld hl, entity_vel_y
    jr .do_inc_entity
.inc_entity_on_ground:
    ld hl, entity_on_ground
    jr .do_inc_entity
.inc_entity_health:
    ld hl, entity_health_current

.do_inc_entity:
    add hl, de              ; HL = address of entity variable
    pop bc                  ; C = Amount
    ld a, (hl)
    add a, c
    ld (hl), a
    pop hl                  ; Restore Params Ptr
    ret

.inc_global:
    ; VarID >= 6: Global variable
    sub 6                   ; A = VarID - 6
    ld l, a
    ld h, 0
    add hl, hl              ; HL = (VarID - 6) * 2

    ld de, SM_GlobalVarTable
    add hl, de              ; HL = &SM_GlobalVarTable[VarID - 6]

    ; Read address from table
    ld e, (hl)
    inc hl
    ld d, (hl)              ; DE = address of global variable

    ; Increment value
    ld a, (de)              ; Get current value
    add a, c                ; Add amount
    ld (de), a              ; Store new value

    pop hl                  ; Restore Params Ptr
    ret

Action_DecVariable:
; Params: VarID(1 byte), Amount(1 byte)
; Supports both entity variables (ID 0-5) and global variables (ID 6+)
    ld a, (hl)              ; A = VarID
    inc hl
    ld c, (hl)              ; C = Amount
    inc hl

    push hl                 ; Save Params Ptr

    ; Check if VarID < 6 (entity variable)
    cp 6
    jr nc, .dec_global

.dec_entity:
    push bc                 ; Save Amount and Entity Index
    ld e, b                 ; E = Entity Index
    ld d, 0                 ; DE = Entity Index

    ; Map VarID to address
    or a
    jr z, .dec_entity_x
    dec a
    jr z, .dec_entity_y
    dec a
    jr z, .dec_entity_vx
    dec a
    jr z, .dec_entity_vy
    dec a
    jr z, .dec_entity_on_ground
    jr .dec_entity_health

.dec_entity_x:
    ld hl, entity_x_pos
    jr .do_dec_entity
.dec_entity_y:
    ld hl, entity_y_pos
    jr .do_dec_entity
.dec_entity_vx:
    ld hl, entity_vel_x
    jr .do_dec_entity
.dec_entity_vy:
    ld hl, entity_vel_y
    jr .do_dec_entity
.dec_entity_on_ground:
    ld hl, entity_on_ground
    jr .do_dec_entity
.dec_entity_health:
    ld hl, entity_health_current

.do_dec_entity:
    add hl, de              ; HL = address of entity variable
    pop bc                  ; C = Amount
    ld a, (hl)
    sub c                   ; Subtract amount
    ld (hl), a
    pop hl                  ; Restore Params Ptr
    ret

.dec_global:
    ; VarID >= 6: Global variable
    sub 6                   ; A = VarID - 6
    ld l, a
    ld h, 0
    add hl, hl              ; HL = (VarID - 6) * 2

    ld de, SM_GlobalVarTable
    add hl, de              ; HL = &SM_GlobalVarTable[VarID - 6]

    ; Read address from table
    ld e, (hl)
    inc hl
    ld d, (hl)              ; DE = address of global variable

    ; Decrement value
    ld a, (de)              ; Get current value
    sub c                   ; Subtract amount
    ld (de), a              ; Store new value

    pop hl                  ; Restore Params Ptr
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
; Params: ComponentID(1 byte), PropertyID(1 byte), Value(1 byte)
; Supports a compact set of common runtime fields.
; Property IDs:
;   1=x, 2=y, 3=vx, 4=vy, 5=sprite, 6=isVisible, 7=frame,
;   8=animSpeed, 9=isPlaying, 10=healthCurrent, 11=healthMax,
;   12=inputSpeed.
    ld d, (hl)              ; D = ComponentID
    inc hl
    ld e, (hl)              ; E = PropertyID
    inc hl
    ld c, (hl)              ; C = Value
    inc hl

    push hl                 ; Save Params Ptr

    ; Guard invalid target entity index.
    ld a, b
    cp MAX_ENTITIES
    jp nc, .scp_done

    ld a, e                 ; A = PropertyID
    cp 1
    jp z, .scp_set_x
    cp 2
    jp z, .scp_set_y
    cp 3
    jp z, .scp_set_vx
    cp 4
    jp z, .scp_set_vy
    cp 5
    jp z, .scp_set_sprite
    cp 6
    jp z, .scp_set_visible
    cp 7
    jp z, .scp_set_frame
    cp 8
    jp z, .scp_set_anim_speed
    cp 9
    jp z, .scp_set_anim_playing
    cp 10
    jp z, .scp_set_health_current
    cp 11
    jp z, .scp_set_health_max
    cp 12
    jp z, .scp_set_input_speed

    ; Fallback by component when PropertyID is unknown.
    ld a, d                 ; A = ComponentID
    cp 1
    jp z, .scp_set_x
    cp 2
    jp z, .scp_set_vx
    cp 3
    jp z, .scp_set_sprite
    cp 4
    jp z, .scp_set_anim_playing
    cp 5
    jp z, .scp_set_health_current
    cp 6
    jp z, .scp_set_input_speed
    jp .scp_done

.scp_set_x:
    ld l, b
    ld h, 0
    ld de, entity_x_pos
    add hl, de
    ld (hl), c
    jp .scp_done

.scp_set_y:
    ld l, b
    ld h, 0
    ld de, entity_y_pos
    add hl, de
    ld (hl), c
    jp .scp_done

.scp_set_vx:
    ld l, b
    ld h, 0
    ld de, entity_vel_x
    add hl, de
    ld (hl), c
    jp .scp_done

.scp_set_vy:
    ld l, b
    ld h, 0
    ld de, entity_vel_y
    add hl, de
    ld (hl), c
    jp .scp_done

.scp_set_sprite:
    ld a, c
    cp SM_SpriteAssetCount
    jr c, .scp_set_sprite_ok
    ld c, #FF
.scp_set_sprite_ok:
    ld l, b
    ld h, 0
    ld de, entity_sprite_asset_index
    add hl, de
    ld (hl), c
    ; Reset animation progression when sprite changes.
    ld l, b
    ld h, 0
    ld de, entity_anim_frame
    add hl, de
    ld (hl), 0
    ld l, b
    ld h, 0
    ld de, entity_anim_tick
    add hl, de
    ld (hl), 0
    jp .scp_done

.scp_set_visible:
    ld l, b
    ld h, 0
    ld de, entity_active
    add hl, de
    ld a, c
    or a
    jp z, .scp_hide
    ld (hl), 1
    jp .scp_done
.scp_hide:
    ld (hl), 0
    jp .scp_done

.scp_set_frame:
    ld l, b
    ld h, 0
    ld de, entity_anim_frame
    add hl, de
    ld (hl), c
    jp .scp_done

.scp_set_anim_speed:
    ld l, b
    ld h, 0
    ld de, entity_anim_speed
    add hl, de
    ld (hl), c
    jp .scp_done

.scp_set_anim_playing:
    ld l, b
    ld h, 0
    ld de, entity_anim_flags
    add hl, de
    ld a, c
    or a
    jp z, .scp_pause_anim
    ld a, (hl)
    or ANIM_FLAG_PLAYING
    and #F7                 ; Clear completed flag when forcing play
    ld (hl), a
    jp .scp_done
.scp_pause_anim:
    ld a, (hl)
    and #FE
    ld (hl), a
    jp .scp_done

.scp_set_health_current:
    ld l, b
    ld h, 0
    ld de, entity_health_current
    add hl, de
    ld (hl), c
    jp .scp_done

.scp_set_health_max:
    ld l, b
    ld h, 0
    ld de, entity_health_max
    add hl, de
    ld (hl), c
    jp .scp_done

.scp_set_input_speed:
    ld l, b
    ld h, 0
    ld de, entity_input_speed
    add hl, de
    ld a, c
    or a
    jr nz, .scp_input_speed_ok
    ld a, 1                 ; Cursor speed 0 would freeze the entity
.scp_input_speed_ok:
    ld (hl), a

.scp_done:
    pop hl
    ret

Action_DestroyEntity:
; Params: Target (1 byte) - 0=self, 1=other
; Destroys entity by clearing its component mask
    ld a, (hl)          ; A = target (0=self, 1=other)
    inc hl

    push hl             ; Save Params Ptr

    or a                ; Check if target == 0 (self)
    jr z, .destroy_self

.destroy_other:
    ; Destroy the last entity collided with by this source entity
    ld hl, entity_last_collision_entity
    ld e, b
    ld d, 0
    add hl, de
    ld a, (hl)          ; A = last collided entity index (255 = none)
    cp 255
    jr z, .destroy_done ; No collision target latched
    ld c, a             ; C = target entity index
    jr .destroy_apply

.destroy_self:
    ld c, b             ; C = self entity index

.destroy_apply:
    ld b, 0             ; BC = target entity index

    ; Clear component mask (deactivates entity)
    ld hl, entity_comp_masks
    add hl, bc
    ld (hl), 0          ; Clear low byte

    ld hl, entity_comp_masks_hi
    add hl, bc
    ld (hl), 0          ; Clear high byte

    ; Mark entity as inactive
    ld hl, entity_active
    add hl, bc
    ld (hl), 0

    ; Clear position to move off-screen
    ld hl, entity_x_pos
    add hl, bc
    ld (hl), 255        ; X = off-screen

    ld hl, entity_y_pos
    add hl, bc
    ld (hl), 212        ; Y = below screen (192 + 20)

.destroy_done:
    pop hl              ; Restore Params Ptr
    ret

Action_SpawnEntity:
; Params: TemplateID(1 byte), X(1 byte), Y(1 byte)
; Spawns a new entity at specified position
    ld d, (hl)          ; D = Template ID
    inc hl
    ld e, (hl)          ; E = X position
    inc hl
    ld c, (hl)          ; C = Y position
    inc hl

    push hl             ; Save Params Ptr
    push bc             ; Save Y position and entity index
    push de             ; Save Template ID and X position

    ; Find free entity slot (mask == 0)
    ld hl, entity_comp_masks
    ld b, 32            ; Check up to 32 entities
    ld c, 0             ; Entity index

.find_slot:
    ld a, (hl)          ; Check low byte
    or a
    jr z, .check_high   ; Low byte is 0, check high byte

.next_slot:
    inc hl              ; Next entity
    inc c               ; Increment index
    djnz .find_slot     ; Loop for all entities

    ; No free slot found
    pop de
    pop bc
    pop hl
    ret

.check_high:
    push hl
    ld hl, entity_comp_masks_hi
    ld a, c
    add a, l
    ld l, a
    ld a, 0
    adc a, h
    ld h, a
    ld a, (hl)          ; Check high byte
    pop hl
    or a
    jr nz, .next_slot   ; High byte not zero, keep searching

.found_slot:
    ; C = Free entity index
    ; Stack: X/TemplateID, Y/B, Params Ptr
    pop de              ; DE = Template ID (D) / X (E)
    pop hl              ; HL = Y (H) / saved B (L)
    ld a, h             ; A = Y position

    ; Set entity position
    push hl
    push de
    push bc

    ld h, 0
    ld l, c             ; HL = Entity index
    ld bc, entity_x_pos
    add hl, bc
    ld (hl), e          ; Set X

    ld h, 0
    ld l, c             ; HL = Entity index (C preserved)
    ld de, entity_y_pos
    add hl, de
    ld (hl), a          ; Set Y

    ; Activate entity with basic mask (Position + Sprite)
    ld h, 0
    ld l, c             ; HL = Entity index
    ld de, entity_comp_masks
    add hl, de
    ld (hl), #03        ; COMP_MASK_POSITION | COMP_MASK_SPRITE (low byte)

    ld h, 0
    ld l, c
    ld de, entity_comp_masks_hi
    add hl, de
    ld (hl), 0          ; High byte = 0

    ; Store template token for template-aware runtime queries
    ld h, 0
    ld l, c
    ld de, entity_template_token
    add hl, de
    ld (hl), d

    ; Apply template profile defaults (sprite/anim/health)
    ld a, d                 ; A = template token
    call SM_ApplyTemplateDefaultsToEntity

    pop bc
    pop de
    pop hl
    pop hl              ; Restore Params Ptr
    ret

Action_GetRandomPos:
; Params: TemplateToken(1 byte, 0=any), TargetVarX(1 byte), TargetVarY(1 byte)
    ld c, (hl)              ; C = template token filter
    inc hl
    ld d, (hl)              ; D = TargetVarX ID
    inc hl
    ld e, (hl)              ; E = TargetVarY ID
    inc hl

    push hl                 ; Save params ptr
    push de                 ; Save target var IDs

    ld a, c
    call SM_RandomActiveEntityByTemplate
    jr c, .grp_has_entity

    ; No active entity found: write 0,0
    pop de
    push de
    ld c, 0
    ld a, d
    call SM_WriteVar
    pop de
    ld c, 0
    ld a, e
    call SM_WriteVar
    pop hl
    ret

.grp_has_entity:
    ld b, a                 ; B = random entity index

    ; Read random entity X and write to target variable X
    ld a, 0                 ; VarID 0 = entity x
    call SM_ReadVar         ; A = x
    pop de                  ; DE = target var IDs
    push de
    ld c, a
    ld a, d                 ; TargetVarX
    call SM_WriteVar

    ; Read random entity Y and write to target variable Y
    ld a, 1                 ; VarID 1 = entity y
    call SM_ReadVar         ; A = y
    pop de
    ld c, a
    ld a, e                 ; TargetVarY
    call SM_WriteVar

    pop hl
    ret

Action_ChangeGameFlow:
; Params: NodeID(1 byte), 255 = START
; Minimal runtime bridge: update flow state registers.
    ld a, (hl)
    inc hl
    push hl
    push af
    ld a, (current_flow_state)
    ld (prev_flow_state), a
    pop af
    cp 255
    jr nz, .cgf_store
    xor a
.cgf_store:
    ld (current_flow_state), a
    pop hl
    ret

Action_RegenerateHud:
; No params - force a HUD redraw, preserving the caller-visible state
    call force_render_hud
    ret

Action_DecLives:
; Params: Amount(1 byte)
; Decrease entity health/lives with clamp to 0
    ld a, (hl)              ; A = amount
    inc hl
    or a
    jr nz, .dec_lives_have_amount
    ld a, 1                 ; Default amount
.dec_lives_have_amount:
    ld c, a                 ; C = amount

    ; Compute entity_health_current[entity] -= amount, clamp at 0
    ld e, b                 ; DE = entity index
    ld d, 0
    ld hl, entity_health_current
    add hl, de
    ld a, (hl)              ; A = current health
    sub c
    jr nc, .dec_lives_store
    xor a
.dec_lives_store:
    ld (hl), a
    ld (global_var_lives), a   ; Keep FSM global "Lives" in sync with entity health
    ret

Action_IncLives:
; Params: Amount(1 byte)
; Increase entity health/lives with clamp to entity_health_max
    ld a, (hl)              ; A = amount
    inc hl
    or a
    jr nz, .inc_lives_have_amount
    ld a, 1                 ; Default amount
.inc_lives_have_amount:
    ld c, a                 ; C = amount

    ; DE = entity index
    ld e, b
    ld d, 0

    ; result = current + amount
    ld hl, entity_health_current
    add hl, de
    ld a, (hl)              ; A = current
    add a, c
    ld c, a                 ; C = tentative result

    ; compare with max
    ld hl, entity_health_max
    add hl, de
    ld a, (hl)              ; A = max
    cp c
    jr nc, .inc_lives_store_result
    ld c, a                 ; clamp to max

.inc_lives_store_result:
    ld hl, entity_health_current
    add hl, de
    ld (hl), c
    ld a, c
    ld (global_var_lives), a   ; Keep FSM global "Lives" in sync with entity health
    ret

Action_Respawn:
; Params: X(1 byte), Y(1 byte)
; 255 means "keep current coordinate"
; Also clears velocity/wait timer and re-activates entity.
    ld d, (hl)              ; D = respawn X
    inc hl
    ld e, (hl)              ; E = respawn Y
    inc hl

    push hl                 ; Save params ptr
    push de                 ; Save X/Y

    ; BC = entity index
    ld c, b
    ld b, 0

    pop de                  ; Restore X/Y

    ; Optional X update
    ld a, d
    cp 255
    jr z, .respawn_skip_x
    ld hl, entity_x_pos
    add hl, bc
    ld (hl), a

.respawn_skip_x:
    ; Optional Y update
    ld a, e
    cp 255
    jr z, .respawn_skip_y
    ld hl, entity_y_pos
    add hl, bc
    ld (hl), a

.respawn_skip_y:
    ; Reset velocity
    ld hl, entity_vel_x
    add hl, bc
    ld (hl), 0
    ld hl, entity_vel_y
    add hl, bc
    ld (hl), 0

    ; Clear wait timer so FSM resumes immediately
    ld hl, entity_sm_wait_timer
    add hl, bc
    ld (hl), 0

    ; Ensure entity is active
    ld hl, entity_active
    add hl, bc
    ld (hl), 1

    ; If entity was fully destroyed, restore minimal Position+Sprite mask
    ld hl, entity_comp_masks
    add hl, bc
    ld a, (hl)
    ld d, a
    ld hl, entity_comp_masks_hi
    add hl, bc
    ld a, (hl)
    or d
    jr nz, .respawn_done

    ld hl, entity_comp_masks
    add hl, bc
    ld (hl), #03            ; COMP_MASK_POSITION | COMP_MASK_SPRITE
    ld hl, entity_comp_masks_hi
    add hl, bc
    ld (hl), 0

.respawn_done:
    pop hl
    ret

Action_BreakTile:
; Params: TileID(1 byte), Direction(1 byte)
; BREAK_TILE is serialized as TileID=0.
    ld a, (hl)              ; A = replacement tile ID (0 for break)
    inc hl
    ld c, (hl)              ; C = direction (0..7)
    inc hl
    push hl
    call SM_WriteTileRelativeToEntity
    pop hl
    ret

Action_ReplaceTile:
; Params: TileID(1 byte), Direction(1 byte)
    ld a, (hl)              ; A = replacement tile ID
    inc hl
    ld c, (hl)              ; C = direction (0..7)
    inc hl
    push hl
    call SM_WriteTileRelativeToEntity
    pop hl
    ret

Action_Rnd:
; Params: VarID(1 byte), DataType(1 byte)
    ld a, (hl)              ; A = VarID
    inc hl
    inc hl                  ; Skip DataType for now (numeric random)

    push hl                 ; Save params ptr
    push af                 ; Save VarID

    call SM_RandomByte      ; A = pseudorandom 0..255
    ld c, a                 ; C = value

    pop af                  ; Restore VarID
    call SM_WriteVar        ; Write random value to var

    pop hl                  ; Restore params ptr
    ret

Action_PointAt:
; Params: X1, Y1, X2, Y2, Speed (5 bytes)
    ld d, (hl)              ; D = x1
    inc hl
    ld e, (hl)              ; E = y1
    inc hl
    ld c, (hl)              ; C = x2
    inc hl
    ld a, (hl)              ; A = y2
    inc hl
    ld l, (hl)              ; L = speed
    inc hl

    push hl                 ; Save params ptr
    ld h, a                 ; H = y2

    ; Compute VX using sign(dx) * speed
    ld a, c
    sub d                   ; A = dx = x2 - x1
    ld d, 0                 ; Default VX = 0
    jr z, .pointat_vx_done
    bit 7, a
    jr z, .pointat_vx_pos
    ld a, l
    cpl
    inc a
    ld d, a
    jr .pointat_vx_done
.pointat_vx_pos:
    ld d, l

.pointat_vx_done:
    ; Compute VY using sign(dy) * speed
    ld a, h
    sub e                   ; A = dy = y2 - y1
    ld e, 0                 ; Default VY = 0
    jr z, .pointat_vy_done
    bit 7, a
    jr z, .pointat_vy_pos
    ld a, l
    cpl
    inc a
    ld e, a
    jr .pointat_vy_done
.pointat_vy_pos:
    ld e, l

.pointat_vy_done:
    ; Store velocity in current entity
    ld c, b
    ld b, 0
    ld hl, entity_vel_x
    add hl, bc
    ld a, d
    ld (hl), a
    ld hl, entity_vel_y
    add hl, bc
    ld a, e
    ld (hl), a

    pop hl
    ret

; ------------------------------------------------------------------
; STATE MACHINE AUDIO HELPERS (self-contained, no sound.asm dependency)
; ------------------------------------------------------------------
SM_MusicState:
    db 0                    ; 0=stopped, 1=playing, 2=muted
SM_MusicTrack:
    db 0
SM_RandSeed:
    db #5A
SM_TemplateFilterToken:
    db 0

SM_SilencePSG:
    xor a
    ld e, a
    ld a, 8                 ; Volume A
    call WRTPSG
    xor a
    ld e, a
    ld a, 9                 ; Volume B
    call WRTPSG
    xor a
    ld e, a
    ld a, 10                ; Volume C
    call WRTPSG
    ld a, #3F               ; Disable all tone/noise
    ld e, a
    ld a, 7                 ; Mixer register
    call WRTPSG
    ret

SM_ApplySoundFrame:
    ; Input: HL = pointer to 11-byte pre-expanded sound frame
    ; Output: HL = pointer to next frame
    ld e, (hl)
    ld a, 0
    call WRTPSG
    inc hl
    ld e, (hl)
    ld a, 1
    call WRTPSG
    inc hl
    ld e, (hl)
    ld a, 8
    call WRTPSG
    inc hl

    ld e, (hl)
    ld a, 2
    call WRTPSG
    inc hl
    ld e, (hl)
    ld a, 3
    call WRTPSG
    inc hl
    ld e, (hl)
    ld a, 9
    call WRTPSG
    inc hl

    ld e, (hl)
    ld a, 4
    call WRTPSG
    inc hl
    ld e, (hl)
    ld a, 5
    call WRTPSG
    inc hl
    ld e, (hl)
    ld a, 10
    call WRTPSG
    inc hl

    ld e, (hl)
    ld a, 6
    call WRTPSG
    inc hl
    ld e, (hl)
    ld a, 7
    call WRTPSG
    inc hl
    ret

SM_PlaySoundAsset:
    ; Input: A = sound asset index (0..SM_SoundAssetCount-1)
    ; Destroys: AF, BC, DE, HL
    cp SM_SoundAssetCount
    jr c, .play_valid_sound
    call SM_SilencePSG
    xor a
    ld (sfx_active), a
    ld (sm_sound_active), a
    ld (sm_sound_frames_left), a
    ret

.play_valid_sound:

    ; Stop any previous state-machine sound before starting a new one.
    push af
    call SM_SilencePSG
    xor a
    ld (sfx_active), a
    pop af

    ld l, a
    ld h, 0
    add hl, hl
    ld de, SM_SoundPtrTable
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ex de, hl

    ld a, (hl)
    or a
    jr z, .empty_sound
    ld (sm_sound_frames_left), a
    inc hl
    ld e, (hl)
    inc hl
    ld d, (hl)
    ex de, hl

    call SM_ApplySoundFrame

    ld a, l
    ld (sm_sound_ptr_l), a
    ld a, h
    ld (sm_sound_ptr_h), a
    ld a, 1
    ld (sm_sound_active), a
    ret

.empty_sound:
    xor a
    ld (sm_sound_active), a
    ld (sm_sound_frames_left), a
    ret

SM_UpdateSound:
    ; Advances one frame of the active PLAY_SOUND asset.
    ; The current frame is emitted immediately on SM_PlaySoundAsset, so
    ; frames_left includes the frame already sounding.
    ld a, (sm_sound_active)
    or a
    ret z

    ld a, (sm_sound_frames_left)
    or a
    jr z, .stop_sound

    dec a
    ld (sm_sound_frames_left), a
    jr z, .stop_sound

    ld a, (sm_sound_ptr_l)
    ld l, a
    ld a, (sm_sound_ptr_h)
    ld h, a
    call SM_ApplySoundFrame
    ld a, l
    ld (sm_sound_ptr_l), a
    ld a, h
    ld (sm_sound_ptr_h), a
    ret

.stop_sound:
    call SM_SilencePSG
    xor a
    ld (sm_sound_active), a
    ret

SM_PlaySfx_Beep:
    ld a, 0                 ; Tone A low
    ld e, #1C               ; NOTE_A4 low (284)
    call WRTPSG
    ld a, 1                 ; Tone A high
    ld e, #01
    call WRTPSG
    ld a, 8                 ; Volume A
    ld e, 12
    call WRTPSG
    ld a, 7                 ; Mixer
    ld e, #3E               ; Tone A on
    call WRTPSG
    ret

SM_PlaySfx_Jump:
    ld a, 0
    ld e, #DD               ; NOTE_C4 low (477)
    call WRTPSG
    ld a, 1
    ld e, #01
    call WRTPSG
    ld a, 8
    ld e, 10
    call WRTPSG
    ld a, 7
    ld e, #3E
    call WRTPSG
    ret

SM_PlaySfx_Shoot:
    ld a, 0
    ld e, #64               ; Tone A low (period 100)
    call WRTPSG
    ld a, 1
    ld e, 0
    call WRTPSG
    ld a, 6                 ; Noise period
    ld e, 5
    call WRTPSG
    ld a, 8                 ; Volume A
    ld e, 8
    call WRTPSG
    ld a, 7
    ld e, #36               ; Tone A + Noise A on
    call WRTPSG
    ret

SM_PlaySfx_Explosion:
    ld a, 6
    ld e, 10
    call WRTPSG
    ld a, 8
    ld e, 15
    call WRTPSG
    ld a, 7
    ld e, #39               ; Noise A only
    call WRTPSG
    ret

SM_PlaySfx_Coin:
    ld a, 2                 ; Tone B low
    ld e, #7B               ; NOTE_E4 low (379)
    call WRTPSG
    ld a, 3                 ; Tone B high
    ld e, #01
    call WRTPSG
    ld a, 9                 ; Volume B
    ld e, 10
    call WRTPSG
    ld a, 7
    ld e, #3D               ; Tone B on
    call WRTPSG
    ret

SM_PlaySfx_Damage:
    ld a, 6                 ; Noise period
    ld e, 3
    call WRTPSG
    ld a, 10                ; Volume C
    ld e, 12
    call WRTPSG
    ld a, 7
    ld e, #1F               ; Noise C on
    call WRTPSG
    ret

SM_RandomByte:
    ; Lightweight local PRNG for state machine actions.
    ld hl, SM_RandSeed
    ld a, (hl)
    add a, 37
    xor #A7
    ld (hl), a
    ret

SM_RandomActiveEntity:
    ; Picks a random-ish active entity slot.
    ; Output: A = entity index, Carry set if found
    ;         A = 0, Carry clear if none found
    call SM_RandomByte
    and 31                  ; MAX_ENTITIES-1 (32 slots)
    ld c, a                 ; C = candidate index
    ld b, 32                ; Probe all slots at most once

.srae_loop:
    ld e, c
    ld d, 0

    ; Must be active
    ld hl, entity_active
    add hl, de
    ld a, (hl)
    or a
    jr z, .srae_next

    ; Must have non-zero component mask
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    ld hl, entity_comp_masks_hi
    add hl, de
    or (hl)
    jr z, .srae_next

    ; Found
    ld a, c
    scf
    ret

.srae_next:
    inc c
    ld a, c
    and 31
    ld c, a
    djnz .srae_loop

    xor a
    or a                    ; Clear carry
    ret

SM_RandomActiveEntityByTemplate:
    ; Input: A = template token filter (0 = any)
    or a
    jp z, SM_RandomActiveEntity
    ld (SM_TemplateFilterToken), a

    call SM_RandomByte
    and 31
    ld c, a                 ; C = candidate index
    ld b, 32

.sraet_loop:
    ld e, c
    ld d, 0

    ; Must be active
    ld hl, entity_active
    add hl, de
    ld a, (hl)
    or a
    jr z, .sraet_next

    ; Must have non-zero component mask
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    ld hl, entity_comp_masks_hi
    add hl, de
    or (hl)
    jr z, .sraet_next

    ; Must match template token
    ld hl, entity_template_token
    add hl, de
    ld a, (SM_TemplateFilterToken)
    cp (hl)
    jr nz, .sraet_next

    ld a, c
    scf
    ret

.sraet_next:
    inc c
    ld a, c
    and 31
    ld c, a
    djnz .sraet_loop

    xor a
    or a                    ; Clear carry
    ret

SM_ApplyTemplateDefaultsToEntity:
    ; Input: A = template token, C = entity index
    ; Applies sprite/animation/health defaults from template profile tables.
    or a
    ret z
    cp SM_TemplateProfileCount + 1
    ret nc
    ld (SM_TemplateFilterToken), a

    ; Sprite index
    ld a, (SM_TemplateFilterToken)
    ld e, a
    ld d, 0
    ld hl, SM_TemplateSpriteTable
    add hl, de
    ld a, (hl)
    ld l, c
    ld h, 0
    ld de, entity_sprite_asset_index
    add hl, de
    ld (hl), a

    ; Animation speed
    ld a, (SM_TemplateFilterToken)
    ld e, a
    ld d, 0
    ld hl, SM_TemplateAnimSpeedTable
    add hl, de
    ld a, (hl)
    ld l, c
    ld h, 0
    ld de, entity_anim_speed
    add hl, de
    ld (hl), a

    ; Reset animation counters and force playing-loop state
    ld l, c
    ld h, 0
    ld de, entity_anim_frame
    add hl, de
    ld (hl), 0
    ld l, c
    ld h, 0
    ld de, entity_anim_tick
    add hl, de
    ld (hl), 0
    ld l, c
    ld h, 0
    ld de, entity_anim_flags
    add hl, de
    ld (hl), ANIM_FLAG_PLAYING | ANIM_FLAG_LOOP

    ; Health current
    ld a, (SM_TemplateFilterToken)
    ld e, a
    ld d, 0
    ld hl, SM_TemplateHealthCurrentTable
    add hl, de
    ld a, (hl)
    ld l, c
    ld h, 0
    ld de, entity_health_current
    add hl, de
    ld (hl), a

    ; Health max
    ld a, (SM_TemplateFilterToken)
    ld e, a
    ld d, 0
    ld hl, SM_TemplateHealthMaxTable
    add hl, de
    ld a, (hl)
    ld l, c
    ld h, 0
    ld de, entity_health_max
    add hl, de
    ld (hl), a
    ret

SM_WriteTileRelativeToEntity:
    ; Input: A = tile char ID, B = entity index, C = direction (0..7)
    ; Writes directly to VRAM Name Table at target cell.
    push af                 ; Save tile ID
    push bc                 ; Save direction + entity index

    ; Read entity center in pixels (approx center for 16x16 sprites)
    ld e, b
    ld d, 0
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    add a, 8
    ld b, a                 ; B = center X pixel

    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    add a, 8
    ld c, a                 ; C = center Y pixel

    ; Convert to tile coordinates (8x8 grid)
    ld a, b
    srl a
    srl a
    srl a
    ld b, a                 ; B = tile X
    ld a, c
    srl a
    srl a
    srl a
    ld c, a                 ; C = tile Y

    ; Restore direction in A (from pushed BC high byte via stack)
    pop de                  ; D = old B(entity), E = old C(direction)
    ld a, e                 ; A = direction

    ; Apply direction offset with bounds checks
    or a
    jr z, .swt_up
    cp 1
    jr z, .swt_down
    cp 2
    jr z, .swt_left
    cp 3
    jr z, .swt_right
    cp 4
    jr z, .swt_up_right
    cp 5
    jr z, .swt_up_left
    cp 6
    jr z, .swt_down_right
    cp 7
    jr z, .swt_down_left
    jp .swt_out

.swt_up:
    ld a, c
    or a
    jp z, .swt_out
    dec c
    jr .swt_apply

.swt_down:
    ld a, c
    cp 23
    jp nc, .swt_out
    inc c
    jr .swt_apply

.swt_left:
    ld a, b
    or a
    jp z, .swt_out
    dec b
    jr .swt_apply

.swt_right:
    ld a, b
    cp 31
    jp nc, .swt_out
    inc b
    jr .swt_apply

.swt_up_right:
    ld a, c
    or a
    jp z, .swt_out
    ld a, b
    cp 31
    jp nc, .swt_out
    dec c
    inc b
    jr .swt_apply

.swt_up_left:
    ld a, c
    or a
    jp z, .swt_out
    ld a, b
    or a
    jp z, .swt_out
    dec c
    dec b
    jr .swt_apply

.swt_down_right:
    ld a, c
    cp 23
    jp nc, .swt_out
    ld a, b
    cp 31
    jp nc, .swt_out
    inc c
    inc b
    jr .swt_apply

.swt_down_left:
    ld a, c
    cp 23
    jp nc, .swt_out
    ld a, b
    or a
    jp z, .swt_out
    inc c
    dec b

.swt_apply:
    ; HL = tile offset = (tileY * 32) + tileX
    ld l, c
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl              ; *32
    ld e, b
    ld d, 0
    add hl, de

    pop af                  ; A = tile char ID
    ld b, a                 ; Preserve tile ID in B

    ; Update mutable screen layout map
    push hl                 ; Save tile offset
    ld de, (current_screen_layout)
    add hl, de
    call mapper_push_p2
    ld a, (current_screen_layout_bank)
    call mapper_set_bank_p2
    ld a, b
    ld (hl), a
    call mapper_pop_p2
    pop hl

    ; Update mutable behavior map (0 = passable, 1 = solid)
    push hl
    ld de, (current_behavior_map)
    add hl, de
    call mapper_push_p2
    ld a, (current_behavior_map_bank)
    call mapper_set_bank_p2
    ld a, b
    or a
    jr z, .store_behavior_passable
    ld a, 1
.store_behavior_passable:
    ld (hl), a
    call mapper_pop_p2
    pop hl

    ; Invalidate cached behavior row after map mutation
    ld a, #FF
    ld (behavior_cache_row), a

    ; Write tile character to VRAM Name Table
    ld de, NAMETBL
    add hl, de
    ld a, b
    call WRTVRM
    ret

.swt_out:
    pop af
    ret

; ==================================================================
; HELPER: Read Variable Value
; Input: A = VarID, B = Entity Index
; Output: A = Variable Value
; Destroys: DE, HL
; ==================================================================
SM_ReadVar:
    cp 6
    jr nc, .read_global

    ; Entity variable (0-5) - use jump table for speed
    push bc
    ld e, b
    ld d, 0                 ; DE = Entity Index

    ; Jump table dispatch
    ld l, a
    ld h, 0
    add hl, hl              ; HL = VarID * 2
    ld bc, .read_entity_var_table
    add hl, bc
    ld c, (hl)
    inc hl
    ld b, (hl)
    push bc
    ret                     ; Jump to handler

.read_entity_var_table:
    DW .read_x              ; 0
    DW .read_y              ; 1
    DW .read_vx             ; 2
    DW .read_vy             ; 3
    DW .read_on_ground      ; 4
    DW .read_health         ; 5

.read_x:
    ld hl, entity_x_pos
    jr .do_read_entity
.read_y:
    ld hl, entity_y_pos
    jr .do_read_entity
.read_vx:
    ld hl, entity_vel_x
    jr .do_read_entity
.read_vy:
    ld hl, entity_vel_y
    jr .do_read_entity
.read_on_ground:
    ld hl, entity_on_ground
    add hl, de
    ld a, (hl)
    and #01
    pop bc
    ret
.read_health:
    ld hl, entity_health_current
    ; Fall through to do_read_entity

.do_read_entity:
    add hl, de
    ld a, (hl)
    pop bc
    ret

.read_global:
    ; Global variable (6+)
    sub 6
    ld l, a
    ld h, 0
    add hl, hl              ; HL = (VarID - 6) * 2

    push de
    ld de, SM_GlobalVarTable
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)              ; DE = address
    ld a, (de)              ; A = value
    pop de
    ret

; ==================================================================
; HELPER: Write Variable Value
; Input: A = VarID, C = Value, B = Entity Index
; Destroys: DE, HL
; ==================================================================
SM_WriteVar:
    cp 6
    jr nc, .write_global

    ; Entity variable (0-5) - use jump table for speed
    push bc
    ld e, b
    ld d, 0                 ; DE = Entity Index

    ; Jump table dispatch
    ld l, a
    ld h, 0
    add hl, hl              ; HL = VarID * 2
    ld bc, .write_entity_var_table
    add hl, bc
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld bc, .do_write
    push bc
    jp (hl)                 ; Jump to handler

.write_entity_var_table:
    DW .write_x             ; 0
    DW .write_y             ; 1
    DW .write_vx            ; 2
    DW .write_vy            ; 3
    DW .write_on_ground     ; 4
    DW .write_health        ; 5

.write_x:
    ld hl, entity_x_pos
    jr .do_write_entity
.write_y:
    ld hl, entity_y_pos
    jr .do_write_entity
.write_vx:
    ld hl, entity_vel_x
    jr .do_write_entity
.write_vy:
    ld hl, entity_vel_y
    jr .do_write_entity
.write_on_ground:
    ld hl, entity_on_ground
    jr .do_write_entity
.write_health:
    ld hl, entity_health_current
    ; Fall through to do_write_entity

.do_write_entity:
    add hl, de
    ld (hl), c
.do_write:
    pop bc
    ret

.write_global:
    sub 6
    ld l, a
    ld h, 0
    add hl, hl

    push de
    ld de, SM_GlobalVarTable
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, c
    ld (de), a
    pop de
    ret

; ==================================================================
; MATHEMATICAL OPERATIONS
; ==================================================================

Action_AddVars:
; Params: DestVarID, Src1VarID, Src2VarID (3 bytes)
; DestVar = Src1 + Src2
    ld c, (hl)              ; C = DestVarID
    inc hl
    ld d, (hl)              ; D = Src1VarID
    inc hl
    ld e, (hl)              ; E = Src2VarID
    inc hl

    push hl                 ; Save params ptr
    push bc                 ; Save DestVarID

    ; Read Src1
    ld a, d
    call SM_ReadVar         ; A = Src1 value
    ld d, a                 ; D = Src1 value

    ; Read Src2
    ld a, e
    call SM_ReadVar         ; A = Src2 value

    ; Add
    add a, d                ; A = Src1 + Src2
    ld c, a                 ; C = result

    ; Write to Dest
    pop de                  ; E = DestVarID
    ld a, e
    call SM_WriteVar

    pop hl
    ret

Action_SubVars:
; Params: DestVarID, Src1VarID, Src2VarID (3 bytes)
; DestVar = Src1 - Src2
    ld c, (hl)              ; C = DestVarID
    inc hl
    ld d, (hl)              ; D = Src1VarID
    inc hl
    ld e, (hl)              ; E = Src2VarID
    inc hl

    push hl
    push bc

    ; Read Src1
    ld a, d
    call SM_ReadVar
    ld d, a

    ; Read Src2
    ld a, e
    call SM_ReadVar

    ; Subtract
    ld e, a                 ; E = Src2
    ld a, d                 ; A = Src1
    sub e                   ; A = Src1 - Src2
    ld c, a

    ; Write to Dest
    pop de
    ld a, e
    call SM_WriteVar

    pop hl
    ret

Action_MulVars:
; Params: DestVarID, Src1VarID, Src2VarID (3 bytes)
; DestVar = Src1 * Src2 (8-bit multiplication, optimized for powers of 2)
    ld c, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld e, (hl)
    inc hl

    push hl
    push bc

    ; Read Src1 (multiplicand)
    ld a, d
    call SM_ReadVar
    ld d, a

    ; Read Src2 (multiplier)
    ld a, e
    call SM_ReadVar
    ld e, a

    ; Optimize for special cases
    or a
    jr z, .mul_by_zero      ; multiplier == 0
    cp 1
    jr z, .mul_by_one       ; multiplier == 1

    ; Check if multiplier is power of 2 (2,4,8,16,32,64,128)
    ld b, a                 ; B = multiplier

    ; Test for power of 2: (B & (B-1)) == 0
    ld a, b
    dec a
    and b
    jr nz, .mul_slow        ; Not power of 2, use slow method

    ; Count shifts needed (find which power of 2)
    ld a, d                 ; A = multiplicand

    ; Power of 2 detected - use shifts
    ld a, d                 ; A = multiplicand
    ld c, b                 ; C = multiplier

.mul_shift_loop:
    cp 1
    jr z, .mul_done
    srl c                   ; Shift multiplier right
    jr nc, .mul_shift_loop  ; If bit was 0, continue
    sla a                   ; Shift result left (multiply by 2)
    jr .mul_shift_loop

.mul_slow:
    ; Standard multiplication by repeated addition
    ld a, 0
    ld c, e                 ; C = multiplier

.mul_loop:
    add a, d
    dec c
    jr nz, .mul_loop
    jr .mul_done

.mul_by_zero:
    ld a, 0
    jr .mul_done

.mul_by_one:
    ld a, d                 ; result = multiplicand

.mul_done:
    ld c, a                 ; C = result

    ; Write to Dest
    pop de
    ld a, e
    call SM_WriteVar

    pop hl
    ret

Action_DivVars:
; Params: DestVarID, Src1VarID, Src2VarID (3 bytes)
; DestVar = Src1 / Src2 (integer division, optimized for powers of 2)
    ld c, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld e, (hl)
    inc hl

    push hl
    push bc

    ; Read Src1 (dividend)
    ld a, d
    call SM_ReadVar
    ld d, a

    ; Read Src2 (divisor)
    ld a, e
    call SM_ReadVar
    ld e, a

    ; Optimize for special cases
    or a
    jr z, .div_by_zero      ; divisor == 0
    cp 1
    jr z, .div_by_one       ; divisor == 1

    ; Check if divisor is power of 2 (2,4,8,16,32,64,128)
    ld b, a                 ; B = divisor

    ; Test for power of 2: (B & (B-1)) == 0
    ld a, b
    dec a
    and b
    jr nz, .div_slow        ; Not power of 2, use slow method

    ; Power of 2 detected - use shifts
    ld a, d                 ; A = dividend
    ld c, b                 ; C = divisor

.div_shift_loop:
    srl c                   ; Shift divisor right
    jr z, .div_done         ; If divisor became 0, done
    srl a                   ; Shift dividend right (divide by 2)
    jr .div_shift_loop

.div_slow:
    ; Standard division by repeated subtraction
    ld c, e                 ; C = divisor
    ld a, d                 ; A = dividend
    ld d, 0                 ; D = quotient

.div_loop:
    cp c
    jr c, .div_done_slow    ; If A < divisor, done
    sub c                   ; A -= divisor
    inc d                   ; quotient++
    jr .div_loop

.div_done_slow:
    ld a, d                 ; A = quotient
    jr .div_done

.div_by_zero:
    ld a, 0                 ; Division by zero = 0
    jr .div_done

.div_by_one:
    ld a, d                 ; result = dividend

.div_done:
    ld c, a                 ; C = result

    ; Write to Dest
    pop de
    ld a, e
    call SM_WriteVar

    pop hl
    ret

Action_ModVars:
; Params: DestVarID, Src1VarID, Src2VarID (3 bytes)
; DestVar = Src1 % Src2 (modulo/remainder, optimized for powers of 2)
    ld c, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld e, (hl)
    inc hl

    push hl
    push bc

    ; Read Src1 (dividend)
    ld a, d
    call SM_ReadVar
    ld d, a

    ; Read Src2 (divisor/modulo)
    ld a, e
    call SM_ReadVar
    ld e, a

    ; Optimize for special cases
    or a
    jr z, .mod_by_zero      ; modulo == 0
    cp 1
    jr z, .mod_by_one       ; modulo == 1 (always 0)

    ; Check if modulo is power of 2 (2,4,8,16,32,64,128)
    ld b, a                 ; B = modulo

    ; Test for power of 2: (B & (B-1)) == 0
    ld a, b
    dec a
    and b
    jr nz, .mod_slow        ; Not power of 2, use slow method

    ; Power of 2 detected - use AND mask
    ; x % (2^n) = x & (2^n - 1)
    ld a, b
    dec a                   ; A = modulo - 1 (mask)
    ld c, a
    ld a, d                 ; A = dividend
    and c                   ; A = dividend & (modulo - 1)
    jr .mod_done

.mod_slow:
    ; Standard modulo by repeated subtraction
    ld c, e                 ; C = modulo
    ld a, d                 ; A = dividend

.mod_loop:
    cp c
    jr c, .mod_done         ; If A < modulo, A is the remainder
    sub c
    jr .mod_loop

.mod_by_zero:
    ld a, 0                 ; Modulo by zero = 0
    jr .mod_done

.mod_by_one:
    ld a, 0                 ; x % 1 = 0 always

.mod_done:
    ld c, a                 ; C = result

    ; Write to Dest
    pop de
    ld a, e
    call SM_WriteVar

    pop hl
    ret


Action_AssignVar:
; Params: DestVarID, SrcVarID (2 bytes)
; DestVar = SrcVar
    ld c, (hl)              ; C = DestVarID
    inc hl
    ld d, (hl)              ; D = SrcVarID
    inc hl

    push hl                 ; Save params ptr
    push bc                 ; Save DestVarID (in C) and entity index (in B)

    ; Read source variable value
    ld a, d
    call SM_ReadVar         ; A = source value
    ld c, a                 ; C = value to write

    ; Write to destination variable
    pop de                  ; E = DestVarID
    ld a, e
    call SM_WriteVar

    pop hl
    ret

Action_DisableInput:
; No params - sets entity_input_disabled[entity] = 1
    push hl
    ld c, b
    ld b, 0
    ld hl, entity_input_disabled
    add hl, bc
    ld (hl), 1             ; Disable input for this entity
    pop hl
    ret

Action_EnableInput:
; No params - sets entity_input_disabled[entity] = 0
    push hl
    ld c, b
    ld b, 0
    ld hl, entity_input_disabled
    add hl, bc
    ld (hl), 0             ; Enable input for this entity

    ; Restore "only animate when moving" behavior after temporary disable.
    ; This prevents idle loop animation after death/recover transitions.
    ld hl, entity_anim_flags
    add hl, bc
    set 2, (hl)            ; ANIM_FLAG_ONLY_WHEN_MOVING
    pop hl
    ret

Action_CleanSprites:
; No params - clear sprite attribute table to hide hardware sprites until next render
    call clear_sprite_table
    ret

Action_ExitCurrentWorld:
; No params - request WorldLink loop exit so GameFlow continues by default connection
    ld a, 1
    ld (gameflow_exit_requested), a
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
    DW Condition_Xor            ; 15

    ; ------------------------------------------------------------------
    ; CONDITION HANDLERS IMPLEMENTATION
    ; ------------------------------------------------------------------

Condition_Nop:
    ld a, 1                 ; Always true
    ret

Condition_And:
    ; AND compound condition
    ; Data format: DB subcondition_count, then N subconditions inline
    ; Evaluates all subconditions; returns true only if ALL are true
    ; Input: B = Entity Index, HL = Params (points to count byte)
    ; Output: A = 1 (all true) or 0 (any false), HL = past all subcondition data
    ld c, (hl)              ; C = subcondition count
    inc hl
    ld d, 1                 ; D = result accumulator (1 = all true so far)

.and_loop:
    ld a, c
    or a
    jr z, .and_done         ; No more subconditions

    push bc                 ; Save count (C) and entity index (implicitly)
    push de                 ; Save result accumulator (D)

    ld a, b                 ; A = Entity Index
    call SM_EvaluateCondition ; A = subcondition result, HL advanced

    pop de                  ; Restore result accumulator
    and d                   ; Combine: D = D AND result
    ld d, a

    pop bc                  ; Restore count and entity index
    dec c
    jr .and_loop

.and_done:
    ld a, d                 ; A = AND result
    ret

Condition_Or:
    ; OR compound condition
    ; Data format: DB subcondition_count, then N subconditions inline
    ; Evaluates all subconditions; returns true if ANY is true
    ; Input: B = Entity Index, HL = Params (points to count byte)
    ; Output: A = 1 (any true) or 0 (all false), HL = past all subcondition data
    ld c, (hl)              ; C = subcondition count
    inc hl
    ld d, 0                 ; D = result accumulator (0 = all false so far)

.or_loop:
    ld a, c
    or a
    jr z, .or_done          ; No more subconditions

    push bc                 ; Save count (C) and entity index
    push de                 ; Save result accumulator (D)

    ld a, b                 ; A = Entity Index
    call SM_EvaluateCondition ; A = subcondition result, HL advanced

    pop de                  ; Restore result accumulator
    or d                    ; Combine: D = D OR result
    ld d, a

    pop bc                  ; Restore count and entity index
    dec c
    jr .or_loop

.or_done:
    ld a, d                 ; A = OR result
    ret

Condition_Xor:
    ; XOR compound condition
    ; Data format: DB subcondition_count, then N subconditions inline
    ; Returns true if an odd number of subconditions are true.
    ; Input: B = Entity Index, HL = Params (points to count byte)
    ; Output: A = 1 (odd true count) or 0 (even true count), HL advanced
    ld c, (hl)              ; C = subcondition count
    inc hl
    xor a
    ld d, a                 ; D = XOR accumulator (0 = even)

.xor_loop:
    ld a, c
    or a
    jr z, .xor_done

    push bc                 ; Save count/entity index
    push de                 ; Save accumulator

    ld a, b                 ; A = Entity Index
    call SM_EvaluateCondition ; A = subcondition result, HL advanced
    and 1

    pop de                  ; Restore accumulator in D
    xor d                   ; Toggle parity if result is 1
    and 1
    ld d, a

    pop bc
    dec c
    jr .xor_loop

.xor_done:
    ld a, d
    ret

Condition_Not:
    ; NOT compound condition
    ; Data format: DB 1 (always 1 subcondition), then 1 subcondition inline
    ; Evaluates the single subcondition and inverts the result
    ; Input: B = Entity Index, HL = Params (points to count byte)
    ; Output: A = inverted result, HL = past subcondition data
    inc hl                  ; Skip count byte (always 1)

    ld a, b                 ; A = Entity Index
    call SM_EvaluateCondition ; A = subcondition result, HL advanced

    ; Invert: 0 -> 1, non-zero -> 0
    or a
    jr z, .not_was_false
    xor a                   ; Was true -> return false
    ret
.not_was_false:
    ld a, 1                 ; Was false -> return true
    ret

; ------------------------------------------------------------------
; HELPER: Match directional key against one input direction value
; Input: D = Desired key (1/3/5/7), A = direction (0-8), B = entity index
; Output: A = 1 if active, 0 if inactive
; Note: diagonal inputs only match a cardinal if entity_dir_mask[B] permits
;       that direction. Entities without Input default to #0F (all allowed).
; ------------------------------------------------------------------
SM_MatchDirection:
    ld e, a
    cp d
    jp z, .smd_match_yes    ; exact match always passes

    ld a, d
    cp 1                    ; UP
    jp nz, .smd_not_up
    ld a, e
    cp 2                    ; UP+RIGHT
    jr z, .smd_check_up
    cp 8                    ; UP+LEFT
    jp nz, .smd_match_no
.smd_check_up:
    push hl
    push de
    ld hl, entity_dir_mask
    ld d, 0
    ld e, b
    add hl, de
    ld a, (hl)
    pop de
    pop hl
    and DIR_ALLOW_UP
    jp nz, .smd_match_yes
    jp .smd_match_no

.smd_not_up:
    cp 5                    ; DOWN
    jp nz, .smd_not_down
    ld a, e
    cp 4                    ; DOWN+RIGHT
    jr z, .smd_check_down
    cp 6                    ; DOWN+LEFT
    jp nz, .smd_match_no
.smd_check_down:
    push hl
    push de
    ld hl, entity_dir_mask
    ld d, 0
    ld e, b
    add hl, de
    ld a, (hl)
    pop de
    pop hl
    and DIR_ALLOW_DOWN
    jp nz, .smd_match_yes
    jp .smd_match_no

.smd_not_down:
    cp 7                    ; LEFT
    jp nz, .smd_not_left
    ld a, e
    cp 6                    ; DOWN+LEFT
    jr z, .smd_check_left
    cp 8                    ; UP+LEFT
    jp nz, .smd_match_no
.smd_check_left:
    push hl
    push de
    ld hl, entity_dir_mask
    ld d, 0
    ld e, b
    add hl, de
    ld a, (hl)
    pop de
    pop hl
    and DIR_ALLOW_LEFT
    jp nz, .smd_match_yes
    jp .smd_match_no

.smd_not_left:
    cp 3                    ; RIGHT
    jp nz, .smd_match_no
    ld a, e
    cp 2                    ; UP+RIGHT
    jr z, .smd_check_right
    cp 4                    ; DOWN+RIGHT
    jp nz, .smd_match_no
.smd_check_right:
    push hl
    push de
    ld hl, entity_dir_mask
    ld d, 0
    ld e, b
    add hl, de
    ld a, (hl)
    pop de
    pop hl
    and DIR_ALLOW_RIGHT
    jp nz, .smd_match_yes

.smd_match_no:
    xor a
    ret

.smd_match_yes:
    ld a, 1
    ret

; ------------------------------------------------------------------
; HELPER: Deduce movement direction from entity velocity
; Input: B = Entity Index
; Output: A = direction key id (1/3/5/7) or 0 if idle
; ------------------------------------------------------------------
SM_DeduceDirectionFromVelocity:
    push de
    push hl

    ld e, b
    ld d, 0

    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    or a
    jr z, .sddv_check_y
    bit 7, a
    jr z, .sddv_right
    ld a, 7
    jr .sddv_done

.sddv_right:
    ld a, 3
    jr .sddv_done

.sddv_check_y:
    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)
    or a
    jr z, .sddv_idle
    bit 7, a
    jr z, .sddv_down
    ld a, 1
    jr .sddv_done

.sddv_down:
    ld a, 5
    jr .sddv_done

.sddv_idle:
    xor a

.sddv_done:
    pop hl
    pop de
    ret

; ------------------------------------------------------------------
; HELPER: Check if an entity can move one pixel in a direction
; Input: B = Entity Index, A = direction key id (1/3/5/7)
; Output: A = 1 if path is clear, 0 if blocked
; ------------------------------------------------------------------
SM_TestMoveDirection:
    push bc
    push de
    push hl

    ld c, a                 ; C = direction

    ; Unknown/neutral direction -> treat as clear
    cp 1
    jr z, .smtmd_load_pos
    cp 3
    jr z, .smtmd_load_pos
    cp 5
    jr z, .smtmd_load_pos
    cp 7
    jr z, .smtmd_load_pos
    ld a, 1
    jr .smtmd_done

.smtmd_load_pos:
    ld e, b
    ld d, 0

    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)              ; A = X (keep DE as entity index)

    ld hl, entity_y_pos
    add hl, de
    ld e, (hl)              ; E = Y
    ld d, a                 ; D = X

    ld a, c
    cp 1
    jr nz, .smtmd_not_up
    dec e
    jr .smtmd_check

.smtmd_not_up:
    cp 5
    jr nz, .smtmd_not_down
    inc e
    jr .smtmd_check

.smtmd_not_down:
    cp 7
    jr nz, .smtmd_not_left
    dec d
    jr .smtmd_check

.smtmd_not_left:
    inc d                   ; RIGHT (3)

.smtmd_check:
    call check_collision_box
    jr z, .smtmd_clear
    xor a
    jr .smtmd_done

.smtmd_clear:
    ld a, 1

.smtmd_done:
    pop hl
    pop de
    pop bc
    ret

Condition_KeyPressed:
    ; Check if input is disabled for this entity
    push hl
    ld c, b
    ld b, 0
    ld hl, entity_input_disabled
    add hl, bc
    ld a, (hl)
    pop hl
    ld b, c             ; Restore B = entity index
    or a
    jr z, .sm_input_enabled
    xor a               ; A = 0 (key not pressed, input disabled)
    inc hl              ; Skip keyId param
    ret
.sm_input_enabled:
    ; Edge keydown: active now and inactive previous frame
    ; Params: Key ID (1=Up, 5=Down, 7=Left, 3=Right, 9=Fire)
    ld d, (hl)
    inc hl

    ld a, d
    cp 9
    jr z, .ckp_fire

    ; Directional edge: current active, previous inactive
    ld a, (input_state)
    call SM_MatchDirection
    or a
    jr z, .ckp_not_pressed

    ld a, (prev_input_state)
    call SM_MatchDirection
    or a
    jr nz, .ckp_not_pressed

    ld a, 1
    ret

.ckp_fire:
    ld a, (input_btn_curr)
    and INPUT_BTN_FIRE
    jr z, .ckp_not_pressed
    ld a, (input_btn_prev)
    and INPUT_BTN_FIRE
    jr nz, .ckp_not_pressed
    ld a, 1
    ret

.ckp_not_pressed:
    xor a
    ret

Condition_KeyReleased:
    ; Edge keyup: inactive now and active previous frame
    ; Params: Key ID (1=Up, 5=Down, 7=Left, 3=Right, 9=Fire)
    ld d, (hl)
    inc hl

    ld a, d
    cp 9
    jr z, .ckr_fire

    ; Directional edge: current inactive, previous active
    ld a, (input_state)
    call SM_MatchDirection
    or a
    jr nz, .ckr_not_released

    ld a, (prev_input_state)
    call SM_MatchDirection
    or a
    jr z, .ckr_not_released

    ld a, 1
    ret

.ckr_fire:
    ld a, (input_btn_curr)
    and INPUT_BTN_FIRE
    jr nz, .ckr_not_released
    ld a, (input_btn_prev)
    and INPUT_BTN_FIRE
    jr z, .ckr_not_released
    ld a, 1
    ret

.ckr_not_released:
    xor a
    ret

Condition_TimeOut:
    ; Params: Duration (1 byte) - frames to wait
    ; Returns: A=1 if entity state timer >= duration, else A=0
    ld a, (hl)              ; A = Duration threshold
    inc hl

    push hl                 ; Save Params Ptr
    push af                 ; Save Duration

    ; BC = Entity Index
    ld c, b
    ld b, 0

    ; Read entity state timer (16-bit: entity_sm_timer_h:entity_sm_timer_l)
    ld hl, entity_sm_timer_l
    add hl, bc
    ld e, (hl)              ; E = Timer Low

    ld hl, entity_sm_timer_h
    add hl, bc
    ld d, (hl)              ; D = Timer High

    ; Compare timer (DE) with duration (stored in stack)
    pop af                  ; A = Duration threshold
    ld b, a                 ; B = Duration

    ; Since duration is 8-bit, compare low byte first
    ; If timer_low >= duration, return true
    ld a, e                 ; A = Timer Low
    cp b
    jr nc, .timeout_true    ; Timer Low >= Duration -> true

    ; If timer_high > 0, definitely >= duration (since duration is 8-bit max 255)
    ld a, d
    or a
    jr nz, .timeout_true

    ; Timer < Duration
.timeout_false:
    xor a                   ; A = 0 (false)
    pop hl
    ret

.timeout_true:
    ld a, 1                 ; A = 1 (true)
    pop hl
    ret

Condition_CanMove:
    ; Params: direction key id (1/3/5/7)
    ld a, (hl)
    inc hl
    call SM_TestMoveDirection
    ret

Condition_HasCollision:
    ; Params: collisionType (0=any, 1=wall, 2=enemy, 3=item, 4=entity)
    ld a, (hl)
    inc hl
    ld c, a                 ; C = collision type

    push hl
    ld e, b
    ld d, 0

    ; Read wall collision flags without clobbering DE index
    ld hl, entity_wall_collision_flags
    add hl, de
    ld a, (hl)              ; A = wall flags

    ; Read entity-entity collision flags using same DE index
    ld hl, entity_entity_collision_flags
    add hl, de
    ld e, (hl)
    ld d, a                 ; D = wall flags
    pop hl

    ld a, c
    or a
    jr z, .chc_any
    cp 1
    jr z, .chc_wall
    cp 2
    jr z, .chc_enemy
    cp 3
    jr z, .chc_item
    cp 4
    jr z, .chc_entity

.chc_none:
    xor a
    ret

.chc_any:
    ld a, d
    or e
    jr z, .chc_none
    ld a, 1
    ret

.chc_wall:
    ld a, d
    or a
    jr z, .chc_none
    ld a, 1
    ret

.chc_enemy:
    ld a, e
    and COLLISION_EVENT_ENEMY
    jr z, .chc_none
    ld a, 1
    ret

.chc_item:
    ld a, e
    and COLLISION_EVENT_ITEM
    jr z, .chc_none
    ld a, 1
    ret

.chc_entity:
    ld a, e
    and COLLISION_EVENT_ENTITY
    jr z, .chc_none
    ld a, 1
    ret

Condition_PathClear:
    ; Params: direction key id (1/3/5/7), 0 = deduce from velocity
    ld a, (hl)
    inc hl
    or a
    jr nz, .cpc_have_direction
    call SM_DeduceDirectionFromVelocity
    or a
    jr z, .cpc_idle

.cpc_have_direction:
    call SM_TestMoveDirection
    ret

.cpc_idle:
    ld a, 1                 ; Idle has clear path by definition
    ret

Condition_OnWallCollision:
    ; Params: direction key id (0=any, 1=up, 5=down, 7=left, 3=right)
    ld a, (hl)
    inc hl
    ld c, a

    push hl
    ld hl, entity_wall_collision_flags
    ld e, b
    ld d, 0
    add hl, de
    ld a, (hl)
    ld e, a                 ; E = flags
    pop hl

    ld a, c
    or a
    jr z, .cowc_any
    cp 1
    jr z, .cowc_up
    cp 5
    jr z, .cowc_down
    cp 7
    jr z, .cowc_left
    cp 3
    jr z, .cowc_right
    xor a
    ret

.cowc_any:
    ld a, e
    or a
    jr z, .cowc_no
    ld a, 1
    ret

.cowc_up:
    ld a, e
    and #01
    jr z, .cowc_no
    ld a, 1
    ret

.cowc_down:
    ld a, e
    and #02
    jr z, .cowc_no
    ld a, 1
    ret

.cowc_left:
    ld a, e
    and #04
    jr z, .cowc_no
    ld a, 1
    ret

.cowc_right:
    ld a, e
    and #08
    jr z, .cowc_no
    ld a, 1
    ret

.cowc_no:
    xor a
    ret

Condition_DeadlyTile:
    ; Check if entity is touching deadly tile
    ; Input: B = Entity Index, HL = Params Ptr (no params)
    ; Output: A = 1 (touching deadly tile) or 0 (safe)
    ; Destroys: DE, HL
    push hl
    ld hl, entity_flag_deadly_tile
    ld e, b
    ld d, 0
    add hl, de
    ld a, (hl)
    and #01                       ; Check bit 0
    pop hl
    ret                           ; A = 1 if deadly, 0 if safe

Condition_AnimComplete:
    ; One-shot event latched by update_animation_component when
    ; a non-loop animation reaches its final frame.
    ; Consume-on-read semantics prevents repeated transitions.
    push hl
    ld hl, entity_anim_flags
    ld e, b
    ld d, 0
    add hl, de
    bit 3, (hl)                    ; ANIM_FLAG_COMPLETED
    jr z, .anim_complete_false
    res 3, (hl)                    ; consume event
    ld a, 1
    pop hl
    ret

.anim_complete_false:
    xor a
    pop hl
    ret

Condition_KeyAndMove:
    ; Params: keyId, directionId (0 means derive from key/velocity)
    ld d, (hl)              ; keyId
    inc hl
    ld c, (hl)              ; directionId
    inc hl

    ; First: key active (level check)
    ld a, d
    cp 9
    jr z, .ckam_fire
    ld a, (input_state)
    call SM_MatchDirection
    or a
    jr z, .ckam_false
    jr .ckam_check_move

.ckam_fire:
    ld a, (input_btn_curr)
    and INPUT_BTN_FIRE
    jr z, .ckam_false

.ckam_check_move:
    ld a, c
    or a
    jr nz, .ckam_have_dir

    ld a, d
    cp 9
    jr z, .ckam_from_velocity
    ld a, d
    jr .ckam_have_dir

.ckam_from_velocity:
    call SM_DeduceDirectionFromVelocity
    or a
    jr z, .ckam_false

.ckam_have_dir:
    call SM_TestMoveDirection
    ret

.ckam_false:
    xor a
    ret

Condition_VariableCompare:
    ; Params: VarID (1 byte), Operator (1 byte), Value (1 byte)
    ; Input: B = Entity Index, HL = Params Ptr
    ; Output: A = 1 (true) or 0 (false), HL = Updated Ptr
    ; Supports entity variables (ID 0-5) and global variables (ID 6+)

    ld a, (hl)              ; A = Variable ID
    inc hl
    ld c, (hl)              ; C = Operator ID
    inc hl
    ld d, (hl)              ; D = Compare Value
    inc hl

    push hl                 ; Save updated params ptr
    push bc                 ; Save Operator and Entity Index
    push de                 ; Save Compare Value

    ; Check if VarID < 6 (entity variable) or >= 6 (global variable)
    cp 6
    jr nc, .get_global_var

    ; Entity variables (ID 0-5)
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
    cp 4                    ; Check if isOnGround
    jr z, .get_on_ground
    ; cp 5: health (fall through)

.get_health:
    ld hl, entity_health_current
    add hl, bc
    ld e, (hl)
    jr .do_compare

.get_global_var:
    ; VarID >= 6: Global variable
    ; Get address from SM_GlobalVarTable
    sub 6                   ; A = VarID - 6
    ld l, a
    ld h, 0
    add hl, hl              ; HL = (VarID - 6) * 2

    push de                 ; Save Compare Value
    ld de, SM_GlobalVarTable
    add hl, de              ; HL = &SM_GlobalVarTable[VarID - 6]

    ; Read address from table
    ld e, (hl)
    inc hl
    ld d, (hl)              ; DE = address of global variable

    ; Read value. Restore compare-value pair first, then copy the
    ; global byte into E so the compare sees the actual variable value.
    ld a, (de)              ; A = global variable value
    pop de                  ; Restore Compare Value to D
    ld e, a                 ; E = variable value
    jr .do_compare

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
    jr .do_compare

.get_on_ground:
    ld hl, entity_on_ground
    add hl, bc
    ld a, (hl)
    and #01                 ; Extract bit 0
    ld e, a                 ; E = 1 if on ground, 0 if in air
    jr .do_compare

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
    `;function Gr(e){const l=new Set,a=new Set;function t(n){if(n)for(const s of n)s!=null&&s.type&&l.add(s.type)}function o(n){if(n&&(n.type&&a.add(n.type),Array.isArray(n.conditions)))for(const s of n.conditions)o(s)}for(const n of e){for(const s of n.states??[])t(s.onEnter),t(s.onExit);for(const s of n.transitions??[])t(s.actions),o(s.conditions)}return{usedActions:l,usedConditions:a}}function B(e,l,a){const t=`
${l}:`,o=`
${a}:`,n=e.indexOf(t);if(n<0)return e;const s=e.indexOf(o,n);return s<0?e:e.slice(0,n)+`
; [${l} stripped - not used]
`+e.slice(s)}function Wr(e,l){const a=`
${l}:`,t=e.indexOf(a);return t<0?e:e.slice(0,t)+`
; [${l} stripped - not used]
`}function Q(e,l){return e.replace(new RegExp(`DW ${l}\\s*(;[^\\n]*)`),`DW Action_Nop $1 [${l} stripped]`)}function ue(e,l){return e.replace(new RegExp(`DW ${l}\\s*(;[^\\n]*)`),`DW Condition_Nop $1 [${l} stripped]`)}function Yr(e,l,a){const t=(...i)=>i.some(c=>l.has(c)),o=(...i)=>i.some(c=>a.has(c));return t(w.SET_POSITION)||(e=B(e,"Action_SetPosition","Action_MoveBy"),e=Q(e,"Action_SetPosition")),t(w.MOVE_BY)||(e=B(e,"Action_MoveBy","Action_SetVelocity"),e=Q(e,"Action_MoveBy")),t(w.SET_VELOCITY)||(e=B(e,"Action_SetVelocity","Action_ApplyForce"),e=Q(e,"Action_SetVelocity")),t(w.APPLY_FORCE)||(e=B(e,"Action_ApplyForce","SM_FacingDirTablePtrs"),e=Q(e,"Action_ApplyForce")),t(w.CHANGE_SPRITE)||(e=B(e,"SM_FacingDirTablePtrs","Action_PlayAnimation"),e=Q(e,"Action_ChangeSprite")),t(w.PLAY_ANIMATION)||(e=B(e,"Action_PlayAnimation","Action_SetAnimSpeed"),e=Q(e,"Action_PlayAnimation")),t(w.SET_ANIMATION_SPEED)||(e=B(e,"Action_SetAnimSpeed","Action_ToggleAnim"),e=Q(e,"Action_SetAnimSpeed")),t(w.TOGGLE_ANIMATION)||(e=B(e,"Action_ToggleAnim","Action_PlaySound"),e=Q(e,"Action_ToggleAnim")),t(w.PLAY_SOUND)||(e=B(e,"Action_PlaySound","Action_PlayMusic"),e=Q(e,"Action_PlaySound")),t(w.PLAY_MUSIC)||(e=B(e,"Action_PlayMusic","Action_MuteMusic"),e=Q(e,"Action_PlayMusic")),t(w.MUTE_MUSIC)||(e=B(e,"Action_MuteMusic","Action_StopMusic"),e=Q(e,"Action_MuteMusic")),t(w.STOP_MUSIC)||(e=B(e,"Action_StopMusic","Action_SetVariable"),e=Q(e,"Action_StopMusic")),t(w.SET_VARIABLE)||(e=B(e,"Action_SetVariable","Action_IncVariable"),e=Q(e,"Action_SetVariable")),t(w.INCREMENT_VARIABLE)||(e=B(e,"Action_IncVariable","Action_DecVariable"),e=Q(e,"Action_IncVariable")),t(w.DECREMENT_VARIABLE)||(e=B(e,"Action_DecVariable","Action_Wait"),e=Q(e,"Action_DecVariable")),t(w.WAIT)||(e=B(e,"Action_Wait","Action_GotoState"),e=Q(e,"Action_Wait")),t(w.GOTO_STATE)||(e=B(e,"Action_GotoState","Action_SetCompProp"),e=Q(e,"Action_GotoState")),t(w.SET_COMPONENT_PROPERTY)||(e=B(e,"Action_SetCompProp","Action_DestroyEntity"),e=Q(e,"Action_SetCompProp")),t(w.DESTROY_ENTITY)||(e=B(e,"Action_DestroyEntity","Action_SpawnEntity"),e=Q(e,"Action_DestroyEntity")),t(w.SPAWN_ENTITY,w.GET_RANDOM_ENTITY_POSITION)||(e=B(e,"Action_SpawnEntity","Action_ChangeGameFlow"),e=Q(e,"Action_SpawnEntity"),e=Q(e,"Action_GetRandomPos")),t(w.CHANGE_GAME_FLOW_NODE)||(e=B(e,"Action_ChangeGameFlow","Action_RegenerateHud"),e=Q(e,"Action_ChangeGameFlow")),t(w.REGENERATE_HUD)||(e=B(e,"Action_RegenerateHud","Action_DecLives"),e=Q(e,"Action_RegenerateHud")),t(w.DECREASE_LIVES,w.INCREASE_LIVES,w.RESPAWN_PLAYER)||(e=B(e,"Action_DecLives","Action_BreakTile"),e=Q(e,"Action_DecLives"),e=Q(e,"Action_IncLives"),e=Q(e,"Action_Respawn")),t(w.BREAK_TILE)||(e=B(e,"Action_BreakTile","Action_ReplaceTile"),e=Q(e,"Action_BreakTile")),t(w.REPLACE_TILE)||(e=B(e,"Action_ReplaceTile","Action_Rnd"),e=Q(e,"Action_ReplaceTile")),t(w.RND)||(e=B(e,"Action_Rnd","Action_PointAt"),e=Q(e,"Action_Rnd")),t(w.POINT_AT)||(e=B(e,"Action_PointAt","SM_MusicState"),e=Q(e,"Action_PointAt")),t(w.PLAY_SOUND)||(e=B(e,"SM_PlaySoundAsset","SM_UpdateSound"),e=B(e,"SM_PlaySfx_Beep","SM_RandomByte")),t(w.RND,w.SPAWN_ENTITY,w.GET_RANDOM_ENTITY_POSITION)||(e=B(e,"SM_RandomByte","SM_WriteTileRelativeToEntity")),t(w.BREAK_TILE,w.REPLACE_TILE)||(e=B(e,"SM_WriteTileRelativeToEntity","SM_ReadVar")),t(w.SET_VARIABLE,w.INCREMENT_VARIABLE,w.DECREMENT_VARIABLE,w.SET_COMPONENT_PROPERTY,w.ADD_VARIABLES,w.SUBTRACT_VARIABLES,w.MULTIPLY_VARIABLES,w.DIVIDE_VARIABLES,w.MODULO_VARIABLES,w.ASSIGN_VARIABLE)||(e=B(e,"SM_ReadVar","Action_AddVars")),t(w.ADD_VARIABLES)||(e=B(e,"Action_AddVars","Action_SubVars"),e=Q(e,"Action_AddVars")),t(w.SUBTRACT_VARIABLES)||(e=B(e,"Action_SubVars","Action_MulVars"),e=Q(e,"Action_SubVars")),t(w.MULTIPLY_VARIABLES)||(e=B(e,"Action_MulVars","Action_DivVars"),e=Q(e,"Action_MulVars")),t(w.DIVIDE_VARIABLES)||(e=B(e,"Action_DivVars","Action_ModVars"),e=Q(e,"Action_DivVars")),t(w.MODULO_VARIABLES)||(e=B(e,"Action_ModVars","Action_AssignVar"),e=Q(e,"Action_ModVars")),t(w.ASSIGN_VARIABLE)||(e=B(e,"Action_AssignVar","Action_DisableInput"),e=Q(e,"Action_AssignVar")),t(w.DISABLE_INPUT)||(e=B(e,"Action_DisableInput","Action_EnableInput"),e=Q(e,"Action_DisableInput")),t(w.ENABLE_INPUT)||(e=B(e,"Action_EnableInput","Action_CleanSprites"),e=Q(e,"Action_EnableInput")),t(w.CLEAN_SPRITES)||(e=B(e,"Action_CleanSprites","Action_ExitCurrentWorld"),e=Q(e,"Action_CleanSprites")),t(w.EXIT_CURRENT_WORLD)||(e=B(e,"Action_ExitCurrentWorld","SM_ConditionTable"),e=Q(e,"Action_ExitCurrentWorld")),o(F.AND)||(e=B(e,"Condition_And","Condition_Or"),e=ue(e,"Condition_And")),o(F.OR)||(e=B(e,"Condition_Or","Condition_Xor"),e=ue(e,"Condition_Or")),o(F.XOR)||(e=B(e,"Condition_Xor","Condition_Not"),e=ue(e,"Condition_Xor")),o(F.NOT)||(e=B(e,"Condition_Not","SM_MatchDirection"),e=ue(e,"Condition_Not")),o(F.KEY_PRESSED,F.KEY_RELEASED,F.CAN_MOVE_DIRECTION,F.KEY_AND_MOVEMENT)||(e=B(e,"SM_MatchDirection","SM_DeduceDirectionFromVelocity")),o(F.CAN_MOVE_DIRECTION,F.KEY_AND_MOVEMENT)||(e=B(e,"SM_DeduceDirectionFromVelocity","SM_TestMoveDirection")),o(F.CAN_MOVE_DIRECTION,F.PATH_CLEAR)||(e=B(e,"SM_TestMoveDirection","Condition_KeyPressed")),o(F.KEY_PRESSED)||(e=B(e,"Condition_KeyPressed","Condition_KeyReleased"),e=ue(e,"Condition_KeyPressed")),o(F.KEY_RELEASED)||(e=B(e,"Condition_KeyReleased","Condition_TimeOut"),e=ue(e,"Condition_KeyReleased")),o(F.TIME_OUT)||(e=B(e,"Condition_TimeOut","Condition_CanMove"),e=ue(e,"Condition_TimeOut")),o(F.CAN_MOVE_DIRECTION)||(e=B(e,"Condition_CanMove","Condition_HasCollision"),e=ue(e,"Condition_CanMove")),o(F.HAS_COLLISION)||(e=B(e,"Condition_HasCollision","Condition_PathClear"),e=ue(e,"Condition_HasCollision")),o(F.PATH_CLEAR)||(e=B(e,"Condition_PathClear","Condition_OnWallCollision"),e=ue(e,"Condition_PathClear")),o(F.ON_WALL_COLLISION)||(e=B(e,"Condition_OnWallCollision","Condition_DeadlyTile"),e=ue(e,"Condition_OnWallCollision")),o(F.HAS_DEADLY_TILE_COLLISION)||(e=B(e,"Condition_DeadlyTile","Condition_AnimComplete"),e=ue(e,"Condition_DeadlyTile")),o(F.ANIMATION_COMPLETE)||(e=B(e,"Condition_AnimComplete","Condition_KeyAndMove"),e=ue(e,"Condition_AnimComplete")),o(F.KEY_AND_MOVEMENT)||(e=B(e,"Condition_KeyAndMove","Condition_VariableCompare"),e=ue(e,"Condition_KeyAndMove")),o(F.VARIABLE_COMPARE)||(e=Wr(e,"Condition_VariableCompare"),e=ue(e,"Condition_VariableCompare")),e}function gl(e){const l=Number(e);return Number.isFinite(l)?Math.max(0,Math.min(255,Math.round(l))):0}function Qr(e){return Math.max(0,Math.min(15,gl(e)))}function Xr(e){const l=Number(e);return Number.isFinite(l)?Math.max(0,Math.min(4095,Math.round(l))):0}function Kr(e){const l=Number(e);return!Number.isFinite(l)||l<=0?1:Math.max(1,Math.round(l*60/1e3))}function Zr(e){const l={};return(e||[]).forEach((a,t)=>{const o=typeof(a==null?void 0:a.id)=="string"?a.id:"",n=typeof(a==null?void 0:a.name)=="string"?a.name:"";o&&(l[o]=t,l[o.toLowerCase()]=t),n&&(l[n]=t,l[n.toLowerCase()]=t)}),l}function qr(e){const l=Array.isArray(e)?e:[];let a=`SM_SoundFrameSize EQU 11
`;return a+=`SM_SoundAssetCount EQU ${l.length}
`,a+=`SM_SoundPtrTable:
`,l.length===0?(a+=`    DW 0
`,a):(l.forEach((t,o)=>{a+=`    DW SM_SoundAsset_${o}
`}),a+=`
`,l.forEach((t,o)=>{const n=Array.isArray(t==null?void 0:t.channels)?t.channels:[],s=[0,1,2].map(d=>{const _=n[d],p=Array.isArray(_==null?void 0:_.steps)?_.steps:[],h=[];for(const u of p){const f=Kr(u==null?void 0:u.durationMs);for(let b=0;b<f;b++)h.push(u||{})}return h}),r=Math.max(s[0].length,s[1].length,s[2].length),i=Math.min(255,r),c=Math.max(0,Math.min(31,gl(t==null?void 0:t.noisePeriod)));if(a+=`SM_SoundAsset_${o}:
`,a+=`    DB ${i}
`,a+=`    DW SM_SoundAsset_${o}_Frames
`,a+=`
`,a+=`SM_SoundAsset_${o}_Frames:
`,i===0){a+=`    ; Empty sound asset: silent
`;return}for(let d=0;d<i;d++){let _=63;const p=[];for(let h=0;h<3;h++){const u=s[h][d],f=Xr(u==null?void 0:u.tonePeriod),b=f&255,m=f>>8&15,y=u?Qr(u.volume):0,T=!!(u!=null&&u.toneEnabled),g=!!(u!=null&&u.noiseEnabled);T&&(_&=~(1<<h)),g&&(_&=~(1<<h+3)),p.push(b,m,y)}p.push(c,_&63),a+=`    DB ${p.join(", ")}
`}a+=`
`}),a.trimEnd())}function Jr(e,l,a,t,o,n,s,r="simple32k"){let i=Hr+`
`+Vr+`

`;const c=Ae(r),d=Array.isArray(a)&&a.length>0,_=Array.isArray(l)&&l.some(g=>String((g==null?void 0:g.asmName)||"").trim()==="global_var_lives");if(i=i.replace(/Action_CleanSprites:[\s\S]*?Action_ExitCurrentWorld:/,d?`Action_CleanSprites:
; No params - clear sprite RAM buffer and flush it to VRAM immediately
    push hl
    call clear_all_sprites
    call update_sprites_to_vram
    pop hl
    ret

Action_ExitCurrentWorld:`:`Action_CleanSprites:
; No params - fallback when no sprite system is generated
    push hl
    call clear_sprite_table
    pop hl
    ret

Action_ExitCurrentWorld:`),e.length>0){const{usedActions:g,usedConditions:A}=Gr(e);i=Yr(i,g,A)}_||(i=i.replace(/[ \t]*ld \(global_var_lives\), a\s*; Keep FSM global "Lives" in sync with entity health\r?\n/g,"")),c||(i=i.replace(`    ; Update mutable screen layout map
    push hl                 ; Save tile offset
    ld de, (current_screen_layout)
    add hl, de
    call mapper_push_p2
    ld a, (current_screen_layout_bank)
    call mapper_set_bank_p2
    ld a, b
    ld (hl), a
    call mapper_pop_p2
    pop hl

    ; Update mutable behavior map (0 = passable, 1 = solid)
    push hl
    ld de, (current_behavior_map)
    add hl, de
    call mapper_push_p2
    ld a, (current_behavior_map_bank)
    call mapper_set_bank_p2
    ld a, b
    or a
    jr z, .store_behavior_passable
    ld a, 1
.store_behavior_passable:
    ld (hl), a
    call mapper_pop_p2
    pop hl
`,`    ; Update mutable screen layout map
    push hl                 ; Save tile offset
    ld de, (current_screen_layout)
    add hl, de
    ld a, b
    ld (hl), a
    pop hl

    ; Update mutable behavior map (0 = passable, 1 = solid)
    push hl
    ld de, (current_behavior_map)
    add hl, de
    ld a, b
    or a
    jr z, .store_behavior_passable
    ld a, 1
.store_behavior_passable:
    ld (hl), a
    pop hl
`));const p=tt(a||[]),h=p.nameToIndex;p.warnings.forEach(g=>{console.warn(`[State Machine Generator] ${g}`)}),i+=`; ==================================================================
`,i+=`; GLOBAL VARIABLES TABLE
`,i+=`; ==================================================================
`,i+=`; Maps variable IDs (6+) to their RAM addresses
`,i+=`; ID 6 = gem_count, ID 7 = last_gem_char, ID 8+ = user globals
`,i+=`SM_GlobalVarTable:
`,i+=`    DW gem_count            ; ID 6: gem_count
`,i+=`    DW last_gem_char        ; ID 7: last_gem_char (char of last collected tile)
`,l&&l.length>0&&l.forEach((g,A)=>{const S=8+A;i+=`    DW ${g.asmName}            ; ID ${S}: ${g.name}
`}),i+=`
`,i+=`; ==================================================================
`,i+=`; STATE MACHINE DATA
`,i+=`; ==================================================================

`;const u=$r(l),f=Br(t),b=El(o),m=Zr(n),y=zr(o,h,b),T=(g,A)=>{const S=A.map(E=>Math.max(0,Math.min(255,E|0)));return`${g}:
    DB ${S.join(", ")}
`};i+=`; ==================================================================
`,i+=`; TEMPLATE PROFILE TABLES
`,i+=`; ==================================================================
`,i+=`SM_TemplateProfileCount EQU ${y.maxToken}
`,i+=T("SM_TemplateSpriteTable",y.spriteByToken),i+=T("SM_TemplateAnimSpeedTable",y.animSpeedByToken),i+=T("SM_TemplateHealthCurrentTable",y.healthCurByToken),i+=T("SM_TemplateHealthMaxTable",y.healthMaxByToken),i+=`
`,i+=`; ==================================================================
`,i+=`; STATE MACHINE SPRITE RUNTIME TABLES
`,i+=`; NOTE: frame bank is derived from the frame pointer at runtime.
`,i+=`; This keeps ChangeSprite compatible with post-export ZX0 label remaps.
`,i+=`; ==================================================================
`,i+=`SM_SpriteAssetCount EQU ${p.sprites.length}
`,i+=`SM_SpritePatternPtrTable:
`,p.sprites.length>0?p.sprites.forEach((g,A)=>{i+=`    DW SPRITE_${A}_PATTERN
`}):i+=`    ; Empty table (no sprites)
`,i+=`
`,i+=`; ==================================================================
`,i+=`; STATE MACHINE SOUND ASSET TABLES
`,i+=`; PLAY_SOUND exports a one-shot 60Hz frame stream per sound asset.
`,i+=`; Channel loops are flattened to a single pass to avoid stuck PSG.
`,i+=`; Hardware envelopes are not emitted yet in this state-machine path.
`,i+=`; ==================================================================
`,i+=qr(n),i+=`
`;for(const g of e)i+=ei(g,u,h,f,b,m,s);return i}function ei(e,l,a,t,o,n,s){let r=`; State Machine: ${e.name} (${e.id}) 
`;const i=e.name.replace(/[^a-zA-Z0-9]/g,"_"),c=d=>{if(!d)return!1;const _=d.trim().toLowerCase();return _==="any"||_==="__any_state__"||_==="any state (*)"};for(const d of e.states){const _=`SM_${i}_${d.id.replace(/[^a-zA-Z0-9]/g,"_")}`,p=`${_}_OnEnter`,h=`${_}_OnExit`,u=`${_}_Transitions`;r+=`${_}: 
`,r+=`    DB 0; ID(unused) 
`,r+=`    DW ${d.onEnter&&d.onEnter.length>0?p:0} 
`,r+=`    DW ${d.onExit&&d.onExit.length>0?h:0} 
`;const f=e.transitions.filter(b=>b.fromStateId===d.id?!0:c(b.fromStateId)?b.toStateId!==d.id:!1);if(r+=`    DW ${f.length>0?u:0} 
`,d.onEnter&&d.onEnter.length>0){r+=`${p}: 
`;for(const b of d.onEnter)r+=Ot(b,e.name,l,a,t,o,n,s);r+=`    DB 0xFF; END
`}if(d.onExit&&d.onExit.length>0){r+=`${h}: 
`;for(const b of d.onExit)r+=Ot(b,e.name,l,a,t,o,n,s);r+=`    DB 0xFF; END
`}if(f.length>0){r+=`${u}: 
`,r+=`    DB ${f.length}; Count
`;const b=[];f.forEach((m,y)=>{const g=c(m.fromStateId)&&c(m.toStateId)?"0":`SM_${i}_${m.toStateId.replace(/[^a-zA-Z0-9]/g,"_")}`,A=m.actions&&m.actions.length>0?`${u}_Actions_${y}`:"0";if(m.conditions?r+=Bt(m.conditions,l):r+=`    DB 0; Empty Condition(Always True) 
`,r+=`    DW ${g} 
`,r+=`    DW ${A} 
`,A!=="0"){let S=`${A}: 
`;for(const E of m.actions||[])S+=Ot(E,e.name,l,a,t,o,n,s);S+=`    DB 0xFF; END
`,b.push(S)}}),b.length>0&&(r+=`
`,r+=b.join(""))}r+=`
`}return r}function K(e){if(typeof e=="number")return e.toString();if(typeof e=="boolean")return e?"1":"0";if(typeof e=="string"){if(e==="true")return"1";if(e==="false")return"0";const l=parseInt(e,10);return isNaN(l)?"0":l.toString()}return"0"}function ti(e,l){if(typeof e=="string"){const a=l==null?void 0:l[e];if(a!==void 0)return a;const t=parseInt(e,10);return!isNaN(t)&&t>=0&&t<=254?t:255}return typeof e=="number"&&e>=0&&e<=254?e:255}function Ot(e,l="",a,t,o,n,s,r){var d;const i=Ba[e.type];if(i===void 0)return`; Unknown Action: ${e.type} 
`;let c=`    DB ${i}; ${e.type} 
`;switch(e.type){case w.NONE:break;case w.SET_POSITION:case w.MOVE_BY:case w.SET_VELOCITY:case w.APPLY_FORCE:c+=`    DB ${K(e.params.x)}, ${K(e.params.y)} 
`;break;case w.CHANGE_SPRITE:{const _=e.params.sprite||e.params.spriteId||"";let p=0;if(t&&typeof _=="string"){const h=t[_],u=t[_.toLowerCase()];h!==void 0?p=h:u!==void 0?p=u:p=K(_)==="0"?0:parseInt(K(_),10)||0}else p=K(_)==="0"?0:parseInt(K(_),10)||0;c+=`    DB ${p}; sprite: ${_} 
`;break}case w.PLAY_ANIMATION:c+=`    DB ${K(e.params.animationName)} 
`;break;case w.SET_ANIMATION_SPEED:c+=`    DB ${K(e.params.speed)} 
`;break;case w.TOGGLE_ANIMATION:c+=`    DB ${K(e.params.playing)} 
`;break;case w.PLAY_SOUND:{const _=e.params.soundId??e.params.sound??e.params.soundAssetId??0;let p=255;if(typeof _=="string"){const h=s==null?void 0:s[_],u=s==null?void 0:s[_.toLowerCase()];h!==void 0?p=h:u!==void 0&&(p=u)}else{const h=parseInt(K(_),10);isNaN(h)||(p=h)}c+=`    DB ${p}        ; sound: ${_}
`;break}case w.PLAY_MUSIC:{const _=e.params.trackId??e.params.musicId??e.params.music??0,p=e.params.loop??!0,h=ti(_,r),u=h===255&&_!==0&&_!=="0"?`        ; WARNING: unresolved/non-PSG track ${_}`:"";c+=`    DB ${h}, ${K(p)}        ; track: ${_}${u}
`;break}case w.SET_VARIABLE:case w.INCREMENT_VARIABLE:case w.DECREMENT_VARIABLE:{const _=e.params.variable||e.params.variableName||e.params.name,p=(a==null?void 0:a[_])??0,h=e.params.value??e.params.amount??0;c+=`    DB ${p}, ${K(h)}        ; ${_} (ID ${p})
`;break}case w.WAIT:c+=`    DB ${K(e.params.duration)} 
`;break;case w.GOTO_STATE:if(l&&e.params.stateId){const _=`SM_${l.replace(/[^a-zA-Z0-9]/g,"_")}_${e.params.stateId.replace(/[^a-zA-Z0-9]/g,"_")} `;c+=`    DW ${_} 
`}else c+=`    DW 0; Invalid GOTO target
`;break;case w.SPAWN_ENTITY:{const _=e.params.templateId??e.params.entityTemplateId??e.params.entityId??0,p=typeof _=="string"?(n==null?void 0:n[_])??(n==null?void 0:n[_.toLowerCase()])??0:parseInt(K(_),10)||0,h=e.params.x??0,u=e.params.y??0;c+=`    DB ${p}, ${K(h)}, ${K(u)}        ; template=${_}=>${p}
`;break}case w.DESTROY_ENTITY:{const _=((d=e.params)==null?void 0:d.target)||"self";c+=`    DB ${_==="other"?1:0}          ; Target: ${_}
`;break}case w.GET_RANDOM_ENTITY_POSITION:{const _=e.params.templateId??e.params.entityTemplateId??0,p=typeof _=="string"?(n==null?void 0:n[_])??(n==null?void 0:n[_.toLowerCase()])??0:parseInt(K(_),10)||0,h=e.params.targetVariableX??e.params.variableX,u=e.params.targetVariableY??e.params.variableY,f=(a==null?void 0:a[h])??0,b=(a==null?void 0:a[u])??0;c+=`    DB ${p}, ${f}, ${b}        ; template=${_}, x->${h}(${f}), y->${u}(${b})
`;break}case w.SET_COMPONENT_PROPERTY:{const _=e.params.componentId??e.params.component??e.params.compId??0,p=e.params.propertyName??e.params.prop??e.params.name??0,h=e.params.value??0,u=yl(_),f=Fr(p,_);let b=K(h);if(f===5&&typeof h=="string"&&t){const m=t[h],y=t[h.toLowerCase()];m!==void 0?b=String(m):y!==void 0&&(b=String(y))}c+=`    DB ${u}, ${f}, ${b}        ; comp=${_}=>${u}, prop=${p}=>${f}, value=${h}
`;break}case w.CHANGE_GAME_FLOW_NODE:{const _=e.params.nodeId??e.params.targetNodeId??0,p=typeof _=="string"&&_.toUpperCase()==="START"?255:K(_);c+=`    DB ${p}        ; node=${_}
`;break}case w.REGENERATE_HUD:case w.CLEAN_SPRITES:case w.EXIT_CURRENT_WORLD:break;case w.BREAK_TILE:{const _=String(e.params.direction||"up").toLowerCase(),p=Va[_]??0;c+=`    DB 0, ${p}        ; BREAK_TILE dir=${_}
`;break}case w.REPLACE_TILE:{const _=String(e.params.direction||"up").toLowerCase(),p=Va[_]??0,h=e.params.replacementTileId??e.params.tileId??0,u=jr(h,o);c+=`    DB ${u}, ${p}        ; REPLACE_TILE tile=${h}=>${u}, dir=${_}
`;break}case w.RND:{const _=e.params.variable??e.params.variableName??e.params.targetVariable??e.params.name,p=(a==null?void 0:a[_])??K(e.params.varId??0),h=K(e.params.dataType??e.params.type??0);c+=`    DB ${p}, ${h}        ; RND var=${_??e.params.varId??0}, type=${e.params.dataType??e.params.type??0}
`;break}case w.POINT_AT:{const _=K(e.params.x1??0),p=K(e.params.y1??0),h=K(e.params.x2??0),u=K(e.params.y2??0),f=K(e.params.speed??1);c+=`    DB ${_}, ${p}, ${h}, ${u}, ${f}
`;break}case w.DECREASE_LIVES:case w.INCREASE_LIVES:{const _=e.params.amount??1;c+=`    DB ${K(_)} 
`;break}case w.RESPAWN_PLAYER:{const _=e.params.x??255,p=e.params.y??255;c+=`    DB ${K(_)}, ${K(p)} 
`;break}case w.ADD_VARIABLES:case w.SUBTRACT_VARIABLES:case w.MULTIPLY_VARIABLES:case w.DIVIDE_VARIABLES:case w.MODULO_VARIABLES:{const _=e.params.destination||e.params.dest||e.params.result,p=e.params.source1||e.params.src1||e.params.operand1,h=e.params.source2||e.params.src2||e.params.operand2,u=(a==null?void 0:a[_])??0,f=(a==null?void 0:a[p])??0,b=(a==null?void 0:a[h])??0,m=e.type===w.ADD_VARIABLES?"ADD":e.type===w.SUBTRACT_VARIABLES?"SUB":e.type===w.MULTIPLY_VARIABLES?"MUL":e.type===w.DIVIDE_VARIABLES?"DIV":"MOD";c+=`    DB ${u}, ${f}, ${b}        ; ${_} = ${p} ${m} ${h}
`;break}case w.ASSIGN_VARIABLE:{const _=e.params.targetVariable||e.params.destination||e.params.dest||e.params.result,p=(a==null?void 0:a[_])??0;if((e.params.sourceType||(e.params.sourceVariable?"variable":"constant"))!=="variable"){const b=e.params.sourceValue??e.params.value??0;c=`    DB ${Ba[w.SET_VARIABLE]}; ${w.SET_VARIABLE} (from ${w.ASSIGN_VARIABLE})
`,c+=`    DB ${p}, ${K(b)}        ; ${_} = ${b}
`;break}const u=e.params.sourceVariable||e.params.source||e.params.src||e.params.operand||e.params.source1,f=(a==null?void 0:a[u])??0;c+=`    DB ${p}, ${f}        ; ${_} = ${u}
`;break}default:c+=`    ; Params not implemented for ${e.type}
`;break}return c}function Bt(e,l){var o,n,s,r,i,c,d,_,p,h,u,f,b,m,y,T,g;const a=kr[e.type];if(!a)return console.warn(`[State Machine Generator] Unknown condition "${e.type}". Falling back to NOP condition.`),`    DB 0; FALLBACK NOP for unknown condition ${e.type}
`;let t=`    DB ${a}; ${e.type} 
`;switch(e.type){case F.KEY_PRESSED:case F.KEY_RELEASED:{const A=(n=(o=e.params)==null?void 0:o.key)==null?void 0:n.toLowerCase(),S=ja[A]??0;t+=`    DB ${S}          ; Key: ${A||"unknown"}
`;break}case F.TIME_OUT:t+=`    DB ${K((s=e.params)==null?void 0:s.duration)} 
`;break;case F.CAN_MOVE_DIRECTION:{const A=String(((r=e.params)==null?void 0:r.direction)||"").toLowerCase(),S=kt[A]??0;A&&S===0&&console.warn(`[State Machine Generator] Unknown direction "${A}" in CAN_MOVE_DIRECTION. Using 0 (no direction).`),t+=`    DB ${S}          ; Direction: ${A||"none"}
`;break}case F.ON_WALL_COLLISION:{const A=String(((i=e.params)==null?void 0:i.direction)||"any").toLowerCase(),S=za[A]??0;A in za||console.warn(`[State Machine Generator] Unknown direction "${A}" in ON_WALL_COLLISION. Using any.`),t+=`    DB ${S}          ; Wall direction: ${A}
`;break}case F.HAS_COLLISION:{const A=String(((c=e.params)==null?void 0:c.collisionType)||"any").toLowerCase();let S=Ha[A];S===void 0&&(console.warn(`[State Machine Generator] Unknown collisionType "${A}" in HAS_COLLISION. Using any.`),S=Ha.any),t+=`    DB ${S}          ; collisionType: ${A}
`;break}case F.PATH_CLEAR:{const A=String(((d=e.params)==null?void 0:d.direction)||"").toLowerCase(),S=kt[A]??0;A&&S===0&&console.warn(`[State Machine Generator] Unknown direction "${A}" in PATH_CLEAR. Using auto-deduce (0).`),t+=`    DB ${S}          ; Direction (0=auto): ${A||"auto"}
`;break}case F.ANIMATION_COMPLETE:break;case F.KEY_AND_MOVEMENT:{const A=String(((_=e.params)==null?void 0:_.key)||"").toLowerCase(),S=ja[A]??0,E=String(((p=e.params)==null?void 0:p.direction)||"").toLowerCase();let C=kt[E]??0;!E&&S!==9&&(C=S),E&&C===0&&console.warn(`[State Machine Generator] Unknown direction "${E}" in KEY_AND_MOVEMENT. Using 0.`),t+=`    DB ${S}, ${C}          ; key=${A||"unknown"}, dir=${E||"auto"}
`;break}case F.AND:case F.OR:case F.XOR:if(e.conditions){t+=`    DB ${e.conditions.length} 
`;for(const A of e.conditions)t+=Bt(A,l)}else t+=`    DB 0
`;break;case F.NOT:e.conditions&&e.conditions.length>0?(t+=`    DB 1 
`,t+=Bt(e.conditions[0],l)):(t+=`    DB 1 
`,t+=`    DB 0; Fallback NOP subcondition for NOT
`);break;case F.VARIABLE_COMPARE:{const A=((h=e.params)==null?void 0:h.variable)||"x",S=l==null?void 0:l[A];if(S===void 0)console.warn(`[State Machine Generator] Unknown variable "${A}" in VARIABLE_COMPARE. Using x (ID 0) as fallback.`),t+=`    DB 0, ${Fa[((u=e.params)==null?void 0:u.operator)||"=="]||0}, ${K(((f=e.params)==null?void 0:f.value)||0)}; FALLBACK: unknown var "${A}" -> x ${((b=e.params)==null?void 0:b.operator)||"=="} ${((m=e.params)==null?void 0:m.value)||0}
`;else{const E=Fa[((y=e.params)==null?void 0:y.operator)||"=="]||0,C=((T=e.params)==null?void 0:T.value)||0;t+=`    DB ${S}, ${E}, ${K(C)}; ${A} (ID ${S}) ${((g=e.params)==null?void 0:g.operator)||"=="} ${C}
`}break}}return t}function ai(e,l={},a){console.log("ÐYZî [INTERRUPT GENERATOR] Generating interrupt.asm...");let t="";return t+=`; ==================================================================
`,t+=`; INTERRUPT TASK SYSTEM - File: interrupt.asm
`,t+=`; Konami-style technique: Hook H.TIMI for 50/60Hz task execution
`,t+=`; ==================================================================

`,t+=li(),t+=oi(),t+=ni(),t+=ri(),t+=ii(),t+=si(a),(a==null?void 0:a.mode)==="interruptTaskManager"?(t+=ci(),t+=di(a)):t+=pi(e),l.interruptDrivenComponents&&(t+=`
; ==================================================================
`,t+=`; COMPONENT SYSTEMS (INLINED)
`,t+=`; Generated inside interrupt.asm because interruptDrivenComponents=true
`,t+=`; ==================================================================

`,t+=pl(e,l.romMode||"simple32k"),t+=`
; ==================================================================
`,t+=`; END OF INLINED COMPONENT SYSTEMS
`,t+=`; ==================================================================

`),console.log(`ƒo. [INTERRUPT GENERATOR] Generated interrupt.asm (${t.length} chars)`),t}function li(){return`; ==================================================================
; INTERRUPT SYSTEM MEMORY LAYOUT
; Variables are defined in variables.asm (dynamically allocated)
; This avoids RAM overlap with entity system arrays
; ==================================================================
; Slots: task_table (8 slots x 2 bytes), task_0_ptr..task_7_ptr
; State: interrupt_system_enabled, old_htimi_hook, interrupt_counter,
;        task_exec_time, vblank_flag
; ==================================================================

`}function oi(){return`; ==================================================================
; INIT_INTERRUPT_SYSTEM - Install H.TIMI hook
; ==================================================================
${X({purpose:"Install JP hook on H.TIMI and initialize interrupt task state.",inputs:["None"],outputs:["None"],clobbers:["AF","BC","DE","HL"],preserved:["None"],usage:["HL/DE/BC = block copy parameters for hook backup and task table clear","A = enable flag and zeroing value"],notes:["Runs with DI/EI, so caller must not assume interrupt state is unchanged."]})}
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
    ld bc, 15                   ; 8 slots Ç- 2 bytes = 16 bytes - 1
    ld (hl), 0
    ldir                        ; Clear all task pointers

    ; --- STEP 4: Initialize counters ---
    xor a
    ld (interrupt_counter), a
    ld (interrupt_counter+1), a
    ld (vblank_flag), a

    ; --- STEP 5: Mark system as enabled ---
    ld a, 1
    ld (interrupt_system_enabled), a

    ei                          ; Re-enable interrupts
    ret

`}function ni(){return`; ==================================================================
; STOP_INTERRUPT_SYSTEM - Restore original H.TIMI hook
; ==================================================================
${X({purpose:"Restore original H.TIMI bytes and mark system disabled.",inputs:["None"],outputs:["None"],clobbers:["AF","BC","DE","HL"],preserved:["None"],usage:["HL/DE/BC = LDIR source/destination/count for hook restore","A = zero flag write to interrupt_system_enabled"],notes:["Runs with DI/EI for atomic hook restoration."]})}
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

`}function ri(){return`; ==================================================================
; INTERRUPT_DISPATCHER - Main ISR (60Hz/50Hz)
; ==================================================================
${X({purpose:"Dispatch enabled interrupt tasks each VBlank and chain BIOS hook.",inputs:["Triggered by H.TIMI hook"],outputs:["interrupt_counter incremented","vblank_flag refreshed"],clobbers:["AF","BC","DE","HL","IX","IY (all restored before exit)"],preserved:["DE","IX","IY"],usage:["HL = walks task_table and holds task pointer","B = task slot loop counter","C = temporary low byte for pointer reconstruction","A = enabled checks and pointer validation"],notes:["Dispatcher saves/restores DE/IX/IY defensively, reducing coupling with task internals."]})}
; This routine executes on each V-Blank
; CRITICAL: Minimal CPU cycles, maximum efficiency
; Overhead: ~80 cycles base + ~40 cycles per active task
; ==================================================================
interrupt_dispatcher:
    ; --- STEP 1: Save caller-visible registers used by BIOS/user code ---
    push af                     ; 11 cycles
    push hl                     ; 11 cycles
    push bc                     ; 11 cycles
    push de                     ; 11 cycles
    push ix                     ; 15 cycles
    push iy                     ; 15 cycles
    ; Total: 74 cycles fixed prologue overhead

    ; --- STEP 2: Check if system is enabled ---
    ld a, (interrupt_system_enabled)
    or a
    jr z, .exit                 ; If disabled, exit quickly

    ; --- STEP 3: Increment frame counter ---
    ld hl, (interrupt_counter)
    inc hl
    ld (interrupt_counter), hl

    ; --- STEP 3.5: Update VBlank flag (reads VDP status) ---
    call update_vblank_flag

    ; --- STEP 4: Walk through task table (DI ensures no nested interrupts) ---
    di                          ; Disable interrupts for task execution
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
    pop iy                      ; 14 cycles
    pop ix                      ; 14 cycles
    pop de                      ; 10 cycles
    pop bc                      ; 10 cycles
    pop hl                      ; 10 cycles
    pop af                      ; 10 cycles

    ; --- STEP 6: Return from interrupt ---
    ; For H.TIMI we should chain to the original hook (best compatibility)
    ; and let the BIOS interrupt handler manage EI/RETI.
    jp old_htimi_hook

; Helper for indirect call
.call_task:
    jp (hl)                     ; Jump to task (task will RET back here)

`}function ii(){return`; ==================================================================
; TASK MANAGEMENT FUNCTIONS
; ==================================================================

; ==================================================================
; NOTE: wait_vblank function removed - use HALT directly in game loop
; HALT is more efficient (no call/ret overhead)
; ==================================================================

; ==================================================================
; UPDATE_VBLANK_FLAG - For interrupt dispatcher use only
; ==================================================================
${X({purpose:"Read VDP status register and latch VBlank state in RAM flag.",inputs:["None"],outputs:["vblank_flag = 0/1"],clobbers:["AF (internally saved/restored)"],preserved:["AF, BC, DE, HL"],usage:["A = VDP status read and boolean conversion"]})}
; Updates vblank_flag only if we're actually in VBlank
; Called from interrupt_dispatcher
; Inputs: None
; Outputs: None
; Modifies: AF
; ==================================================================
update_vblank_flag:
    push af
    in a, (#99)                 ; Read VDP status register
    bit 7, a                    ; Are we in VBlank?
    jr z, .not_in_vblank
    ld a, 1
    ld (vblank_flag), a
    jr .uvf_done
.not_in_vblank:
    xor a
    ld (vblank_flag), a
.uvf_done:
    pop af
    ret

; ==================================================================
; ENABLE_TASK - Activate a task in the system
; ==================================================================
${X({purpose:"Store routine pointer into task_table slot.",inputs:["A = task slot (0-7)","HL = task routine address"],outputs:["task_table[slot] = HL"],clobbers:["AF","BC","DE","HL"],preserved:["None"],usage:["A = slot validation and offset math","DE = holds routine address while HL is repurposed as slot pointer","BC = task_table base address","HL = slot address calculation / pointer write"]})}
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
${X({purpose:"Clear routine pointer in selected task slot.",inputs:["A = task slot (0-7)"],outputs:["task_table[slot] = 0"],clobbers:["AF","DE","HL"],preserved:["BC"],usage:["A = slot validation and zero value for clearing","HL = destination slot pointer","DE = computed slot offset"]})}
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
${X({purpose:"Expose current 16-bit interrupt frame counter.",inputs:["None"],outputs:["HL = interrupt_counter"],clobbers:["HL"],preserved:["AF","BC","DE"],usage:["HL = loaded return value"]})}
; Inputs: None
; Outputs: HL = frame count (16-bit)
; Modifies: HL
; ==================================================================
get_frame_count:
    ld hl, (interrupt_counter)
    ret

`}function si(e){const l=(e==null?void 0:e.mode)==="interruptTaskManager"?e.tasks.filter(t=>t.enabledAtBoot):[];let a=`; ==================================================================
`;return a+=`; INIT_DEFAULT_TASKS_FROM_PLAN - Register engine-selected IRQ tasks
`,a+=`; ==================================================================
`,a+=X({purpose:"Enable the IRQ task set selected by the engine execution plan.",inputs:["None"],outputs:["task_table updated for all enabled-at-boot tasks"],clobbers:["AF","HL"],preserved:["BC","DE"],usage:["A = task slot","HL = task routine address"],notes:["Calls enable_task once per enabled task."]}),a+=`init_default_tasks_from_plan:
`,l.length===0?(a+=`    ret

`,a):(l.forEach(t=>{a+=`    ld a, ${t.slot}
`,a+=`    ld hl, ${t.routineLabel}
`,a+=`    call enable_task
`}),a+=`    ret

`,a)}function di(e){const l=e.tasks.some(t=>t.routineLabel==="task_frame_counter");let a=`; ==================================================================
`;return a+=`; ENGINE EXECUTION PLAN TASKS
`,a+=`; ==================================================================

`,e.tasks.length===0?a+=`; No IRQ tasks selected by engine execution plan.

`:(e.tasks.forEach(t=>{a+=`; Slot ${t.slot}: ${t.id} -> ${t.routineLabel} (period=${t.period})
`}),a+=`
`),l&&(a+=_i()),a+=`; ==================================================================
`,a+=`; USER CUSTOM TASK SLOTS (5-7)
`,a+=`; ==================================================================
`,a+=`; These slots are reserved for user-defined tasks
`,a+=`; Enable them dynamically using:
`,a+=`;   LD A, 5                    ; Slot 5
`,a+=`;   LD HL, my_custom_task
`,a+=`;   CALL enable_task
`,a+=`; ==================================================================

`,a}function ci(){let e=`; ==================================================================
`;return e+=`; SHARED MAINLINE TASK WRAPPERS
`,e+=`; ==================================================================
`,e+=`; These wrappers stay available in interruptTaskManager mode because
`,e+=`; the HALT-driven GameFlow loops still call them directly.
`,e+=`; ==================================================================

`,e+=`; ==================================================================
`,e+=`; TASK_UPDATE_INPUT - Joystick/Cursor polling wrapper
`,e+=`; ==================================================================
`,e+=X({purpose:"Poll joystick + keyboard fallback and update input state buffers.",inputs:["Reads hardware via FAST_GTSTCK / FAST_GTTRIG / FAST_SNSMAT"],outputs:["input_state, prev_input_state, input_btn_curr, input_btn_prev, input_fire"],clobbers:["AF","BC","DE"],preserved:["AF","BC","DE (by push/pop wrapper)","HL"],usage:["A = hardware reads and final scalar writes","B = direction accumulator","D = button bitmask and keyboard direction flags","E = temporary keyboard row bits"],notes:["Wrapper preserves caller-visible regs despite internal mutation."]}),e+=`task_update_input:
`,e+=`    push af
`,e+=`    push bc
`,e+=`    push de

`,e+=`    ; Save previous state
`,e+=`    ld a, (input_state)
`,e+=`    ld (prev_input_state), a
`,e+=`    ld a, (input_btn_curr)
`,e+=`    ld (input_btn_prev), a

`,e+=`    ; Read joystick direction first (priority source, direct hardware)
`,e+=`    xor a                       ; Joystick 0
`,e+=`    call FAST_GTSTCK            ; Direct hardware read
`,e+=`    ld b, a                     ; B = joystick direction
`,e+=`    or a
`,e+=`    jr nz, .dir_ready

`,e+=`    ; Fallback to keyboard cursor keys (row 8, direct matrix read)
`,e+=`    ld a, 8
`,e+=`    call FAST_SNSMAT            ; Active low bits
`,e+=`    ld e, a
`,e+=`    xor a
`,e+=`    ld d, a                     ; D = direction flags: 0=none
`,e+=`    bit 5, e                    ; Up
`,e+=`    jr nz, .kbd_no_up
`,e+=`    set 0, d
`,e+=`.kbd_no_up:
`,e+=`    bit 6, e                    ; Down
`,e+=`    jr nz, .kbd_no_down
`,e+=`    set 1, d
`,e+=`.kbd_no_down:
`,e+=`    bit 4, e                    ; Left
`,e+=`    jr nz, .kbd_no_left
`,e+=`    set 2, d
`,e+=`.kbd_no_left:
`,e+=`    bit 7, e                    ; Right
`,e+=`    jr nz, .kbd_no_right
`,e+=`    set 3, d
`,e+=`.kbd_no_right:
`,e+=`    xor a
`,e+=`    bit 0, d
`,e+=`    jr z, .kbd_check_down
`,e+=`    bit 3, d
`,e+=`    jr nz, .kbd_upright
`,e+=`    bit 2, d
`,e+=`    jr nz, .kbd_upleft
`,e+=`    ld a, STICK_UP
`,e+=`    jr .kbd_done
`,e+=`.kbd_upright:
`,e+=`    ld a, STICK_UPRIGHT
`,e+=`    jr .kbd_done
`,e+=`.kbd_upleft:
`,e+=`    ld a, STICK_UPLEFT
`,e+=`    jr .kbd_done
`,e+=`.kbd_check_down:
`,e+=`    bit 1, d
`,e+=`    jr z, .kbd_check_lr
`,e+=`    bit 3, d
`,e+=`    jr nz, .kbd_downright
`,e+=`    bit 2, d
`,e+=`    jr nz, .kbd_downleft
`,e+=`    ld a, STICK_DOWN
`,e+=`    jr .kbd_done
`,e+=`.kbd_downright:
`,e+=`    ld a, STICK_DOWNRIGHT
`,e+=`    jr .kbd_done
`,e+=`.kbd_downleft:
`,e+=`    ld a, STICK_DOWNLEFT
`,e+=`    jr .kbd_done
`,e+=`.kbd_check_lr:
`,e+=`    bit 2, d
`,e+=`    jr z, .kbd_check_right
`,e+=`    ld a, STICK_LEFT
`,e+=`    jr .kbd_done
`,e+=`.kbd_check_right:
`,e+=`    bit 3, d
`,e+=`    jr z, .kbd_done
`,e+=`    ld a, STICK_RIGHT
`,e+=`.kbd_done:
`,e+=`    ld b, a
`,e+=`.dir_ready:
`,e+=`    ; Normalize diagonals to cardinal directions for runtime stability
`,e+=`    ; UP+RIGHT/DOWN+RIGHT -> RIGHT, UP+LEFT/DOWN+LEFT -> LEFT
`,e+=`    ld a, b
`,e+=`    cp STICK_UPRIGHT
`,e+=`    jr z, .dir_norm_right
`,e+=`    cp STICK_DOWNRIGHT
`,e+=`    jr z, .dir_norm_right
`,e+=`    cp STICK_UPLEFT
`,e+=`    jr z, .dir_norm_left
`,e+=`    cp STICK_DOWNLEFT
`,e+=`    jr z, .dir_norm_left
`,e+=`    jr .dir_norm_done
`,e+=`.dir_norm_right:
`,e+=`    ld a, STICK_RIGHT
`,e+=`    jr .dir_norm_store
`,e+=`.dir_norm_left:
`,e+=`    ld a, STICK_LEFT
`,e+=`.dir_norm_store:
`,e+=`    ld b, a
`,e+=`.dir_norm_done:
`,e+=`    xor a                       ; Joystick 0
`,e+=`    call FAST_GTTRIG            ; A = #FF if pressed, 0 if not
`,e+=`    ld d, 0                     ; D = button bitmask
`,e+=`    or a
`,e+=`    jr z, .no_fire              ; Jump if NOT pressed (A=0)
`,e+=`    ld d, INPUT_BTN_FIRE
`,e+=`    ld a, 1                     ; Fire pressed
`,e+=`    ld (input_fire), a
`,e+=`    jr .fire_done
`,e+=`.no_fire:
`,e+=`    ; Keyboard fallback for fire (SPACE, row 8 bit 0, active low)
`,e+=`    ld a, 8
`,e+=`    call FAST_SNSMAT
`,e+=`    bit 0, a
`,e+=`    jr nz, .fire_released
`,e+=`    ld d, INPUT_BTN_FIRE
`,e+=`    ld a, 1
`,e+=`    ld (input_fire), a
`,e+=`    jr .fire_done
`,e+=`.fire_released:
`,e+=`    xor a                       ; Fire not pressed
`,e+=`    ld (input_fire), a
`,e+=`.fire_done:
`,e+=`    ld a, b
`,e+=`    ld (input_state), a
`,e+=`    ld a, d
`,e+=`    ld (input_btn_curr), a

`,e+=`    pop de
`,e+=`    pop bc
`,e+=`    pop af
`,e+=`    ret

`,e}function _i(){let e=`; ==================================================================
`;return e+=`; TASK_FRAME_COUNTER - Custom timing/animations
`,e+=`; ==================================================================
`,e+=`; Placeholder for user-defined frame-based timing
`,e+=`; interrupt_counter is already incremented in dispatcher
`,e+=`; ==================================================================
`,e+=X({purpose:"Optional per-frame timing hook for lightweight counters/animations.",inputs:["None"],outputs:["None"],clobbers:["None"],preserved:["AF","BC","DE","HL"],usage:["No registers modified in the default implementation"]}),e+=`task_frame_counter:
`,e+=`    ; Placeholder - counter is already incremented in dispatcher
`,e+=`    ; Add custom timing logic here if needed
`,e+=`    ret

`,e}function pi(e){let l="";if(l+=`; ==================================================================
`,l+=`; DEFAULT INTERRUPT TASKS (60Hz Execution)
`,l+=`; ==================================================================

`,l+=`; ==================================================================
`,l+=`; TASK_UPDATE_INPUT - Joystick/Cursor polling at 60Hz
`,l+=`; ==================================================================
`,l+=`; This task guarantees responsive input (no missed button presses)
`,l+=`; Compatible with update_input_component existing function
`,l+=`; ==================================================================
`,l+=X({purpose:"Poll joystick + keyboard fallback and update input state buffers.",inputs:["Reads hardware via FAST_GTSTCK / FAST_GTTRIG / FAST_SNSMAT"],outputs:["input_state, prev_input_state, input_btn_curr, input_btn_prev, input_fire"],clobbers:["AF","BC","DE"],preserved:["AF","BC","DE (by push/pop wrapper)","HL"],usage:["A = hardware reads and final scalar writes","B = direction accumulator","D = button bitmask and keyboard direction flags","E = temporary keyboard row bits"],notes:["Wrapper preserves caller-visible regs despite internal mutation."]}),l+=`task_update_input:
`,l+=`    push af
`,l+=`    push bc
`,l+=`    push de

`,l+=`    ; Save previous state
`,l+=`    ld a, (input_state)
`,l+=`    ld (prev_input_state), a
`,l+=`    ld a, (input_btn_curr)
`,l+=`    ld (input_btn_prev), a

`,l+=`    ; Read joystick direction first (priority source, direct hardware)
`,l+=`    xor a                       ; Joystick 0
`,l+=`    call FAST_GTSTCK            ; Direct hardware read
`,l+=`    ld b, a                     ; B = joystick direction
`,l+=`    or a
`,l+=`    jr nz, .dir_ready

`,l+=`    ; Fallback to keyboard cursor keys (row 8, direct matrix read)
`,l+=`    ld a, 8
`,l+=`    call FAST_SNSMAT            ; Active low bits
`,l+=`    ld e, a
`,l+=`    xor a
`,l+=`    ld d, a                     ; D = direction flags: 0=none
`,l+=`    bit 5, e                    ; Up
`,l+=`    jr nz, .kbd_no_up
`,l+=`    set 0, d
`,l+=`.kbd_no_up:
`,l+=`    bit 6, e                    ; Down
`,l+=`    jr nz, .kbd_no_down
`,l+=`    set 1, d
`,l+=`.kbd_no_down:
`,l+=`    bit 4, e                    ; Left
`,l+=`    jr nz, .kbd_no_left
`,l+=`    set 2, d
`,l+=`.kbd_no_left:
`,l+=`    bit 7, e                    ; Right
`,l+=`    jr nz, .kbd_no_right
`,l+=`    set 3, d
`,l+=`.kbd_no_right:
`,l+=`    xor a
`,l+=`    bit 0, d
`,l+=`    jr z, .kbd_check_down
`,l+=`    bit 3, d
`,l+=`    jr nz, .kbd_upright
`,l+=`    bit 2, d
`,l+=`    jr nz, .kbd_upleft
`,l+=`    ld a, STICK_UP
`,l+=`    jr .kbd_done
`,l+=`.kbd_upright:
`,l+=`    ld a, STICK_UPRIGHT
`,l+=`    jr .kbd_done
`,l+=`.kbd_upleft:
`,l+=`    ld a, STICK_UPLEFT
`,l+=`    jr .kbd_done
`,l+=`.kbd_check_down:
`,l+=`    bit 1, d
`,l+=`    jr z, .kbd_check_lr
`,l+=`    bit 3, d
`,l+=`    jr nz, .kbd_downright
`,l+=`    bit 2, d
`,l+=`    jr nz, .kbd_downleft
`,l+=`    ld a, STICK_DOWN
`,l+=`    jr .kbd_done
`,l+=`.kbd_downright:
`,l+=`    ld a, STICK_DOWNRIGHT
`,l+=`    jr .kbd_done
`,l+=`.kbd_downleft:
`,l+=`    ld a, STICK_DOWNLEFT
`,l+=`    jr .kbd_done
`,l+=`.kbd_check_lr:
`,l+=`    bit 2, d
`,l+=`    jr z, .kbd_check_right
`,l+=`    ld a, STICK_LEFT
`,l+=`    jr .kbd_done
`,l+=`.kbd_check_right:
`,l+=`    bit 3, d
`,l+=`    jr z, .kbd_done
`,l+=`    ld a, STICK_RIGHT
`,l+=`.kbd_done:
`,l+=`    ld b, a
`,l+=`.dir_ready:
`,l+=`    ; Normalize diagonals to cardinal directions for runtime stability
`,l+=`    ; UP+RIGHT/DOWN+RIGHT -> RIGHT, UP+LEFT/DOWN+LEFT -> LEFT
`,l+=`    ld a, b
`,l+=`    cp STICK_UPRIGHT
`,l+=`    jr z, .dir_norm_right
`,l+=`    cp STICK_DOWNRIGHT
`,l+=`    jr z, .dir_norm_right
`,l+=`    cp STICK_UPLEFT
`,l+=`    jr z, .dir_norm_left
`,l+=`    cp STICK_DOWNLEFT
`,l+=`    jr z, .dir_norm_left
`,l+=`    jr .dir_norm_done
`,l+=`.dir_norm_right:
`,l+=`    ld a, STICK_RIGHT
`,l+=`    jr .dir_norm_store
`,l+=`.dir_norm_left:
`,l+=`    ld a, STICK_LEFT
`,l+=`.dir_norm_store:
`,l+=`    ld b, a
`,l+=`.dir_norm_done:
`,l+=`    xor a                       ; Joystick 0
`,l+=`    call FAST_GTTRIG            ; A = #FF if pressed, 0 if not
`,l+=`    ld d, 0                     ; D = button bitmask
`,l+=`    or a
`,l+=`    jr z, .no_fire              ; Jump if NOT pressed (A=0)
`,l+=`    ld d, INPUT_BTN_FIRE
`,l+=`    ld a, 1                     ; Fire pressed
`,l+=`    ld (input_fire), a
`,l+=`    jr .fire_done
`,l+=`.no_fire:
`,l+=`    ; Keyboard fallback for fire (SPACE, row 8 bit 0, active low)
`,l+=`    ld a, 8
`,l+=`    call FAST_SNSMAT
`,l+=`    bit 0, a
`,l+=`    jr nz, .fire_released
`,l+=`    ld d, INPUT_BTN_FIRE
`,l+=`    ld a, 1
`,l+=`    ld (input_fire), a
`,l+=`    jr .fire_done
`,l+=`.fire_released:
`,l+=`    xor a                       ; Fire not pressed
`,l+=`    ld (input_fire), a
`,l+=`.fire_done:
`,l+=`    ld a, b
`,l+=`    ld (input_state), a
`,l+=`    ld a, d
`,l+=`    ld (input_btn_curr), a

`,l+=`    pop de
`,l+=`    pop bc
`,l+=`    pop af
`,l+=`    ret

`,e.hasEntities){const t=lt(e).usedComponents,o=t.has("Jump"),n=t.has("Movement")||t.has("Cursors"),s=t.has("Gravity");o||n||s?(l+=`; ==================================================================
`,l+=`; TASK_UPDATE_PHYSICS - Apply vx, vy -> X, Y (OPTIMIZED)
`,l+=`; ==================================================================
`,l+=`; Only calls physics systems that are actually used in this project
`,l+=`; ==================================================================
`,l+=X({purpose:"Run selected physics component systems in deterministic order.",inputs:["Entity/component RAM tables"],outputs:["Entity motion state updated"],clobbers:["AF","BC","DE","HL"],preserved:["AF","BC","DE","HL (by push/pop wrapper)"],usage:["Registers are scratch during component calls; wrapper restores caller context."]}),l+=`task_update_physics:
`,l+=`    push af
`,l+=`    push bc
`,l+=`    push de
`,l+=`    push hl

`,l+=`    ; Keep system loops in sync with current component masks
`,l+=`    call rebuild_used_entity_list
`,o&&(l+=`    call update_jump_component      ; Jump impulse
`),n&&(l+=`    call update_movement_component  ; Movement/velocity
`),s&&(l+=`    call update_gravity_component   ; Gravity acceleration
`),l+=`    call update_position_component  ; Apply velocity to position

`,l+=`    pop hl
`,l+=`    pop de
`,l+=`    pop bc
`,l+=`    pop af
`,l+=`    ret

`):(l+=`; Task 1 (Physics): Minimal - only position update (no Jump/Movement/Gravity used)
`,l+=`task_update_physics:
`,l+=`    call rebuild_used_entity_list  ; Keep compact entity list updated
`,l+=`    call update_position_component  ; Just apply any existing velocities
`,l+=`    ret

`)}else l+=`; Task 1 (Physics): Not generated (no entities detected)

`;return e.hasCollisions?(l+=`; ==================================================================
`,l+=`; TASK_UPDATE_COLLISION - Collision detection
`,l+=`; ==================================================================
`,l+=`; Detects collisions using collision layers (bitmask system)
`,l+=`; AABB collision for 16x16 sprites
`,l+=`; ==================================================================
`,l+=X({purpose:"Interrupt task wrapper for collision system (placeholder).",inputs:["Entity collision data"],outputs:["Collision flags/tables (when implemented)"],clobbers:["AF","BC","DE","HL"],preserved:["AF","BC","DE","HL (by push/pop wrapper)"]}),l+=`task_update_collision:
`,l+=`    push af
`,l+=`    push bc
`,l+=`    push de
`,l+=`    push hl

`,l+=`    ; TODO: Implement collision detection
`,l+=`    ; Loop over entities with COMP_MASK_COLLISION
`,l+=`    ; Check: collisionLayer & collidesWith for each pair
`,l+=`    ; AABB test: |X1-X2| < 16 && |Y1-Y2| < 16

`,l+=`    pop hl
`,l+=`    pop de
`,l+=`    pop bc
`,l+=`    pop af
`,l+=`    ret

`):l+=`; Task 2 (Collision): Not generated (no collision detection needed)

`,e.hasSprites?(l+=`; ==================================================================
`,l+=`; TASK_UPDATE_SPRITES - Update sprites to VRAM
`,l+=`; ==================================================================
`,l+=`; WARNING: This task is HEAVY (~800 cycles)
`,l+=`; Consider executing every N frames instead of every frame
`,l+=`; ==================================================================
`,l+=X({purpose:"Interrupt-safe wrapper for sprite SAT upload routine.",inputs:["Sprite component buffers"],outputs:["VRAM sprite attribute/pattern tables updated"],clobbers:["AF","BC","DE","HL"],preserved:["AF","BC","DE","HL (by push/pop wrapper)"]}),l+=`task_update_sprites:
`,l+=`    push af
`,l+=`    push bc
`,l+=`    push de
`,l+=`    push hl

`,l+=`    ; Call existing sprite update function
`,l+=`    call update_sprites_to_vram

`,l+=`    pop hl
`,l+=`    pop de
`,l+=`    pop bc
`,l+=`    pop af
`,l+=`    ret

`):l+=`; Task 3 (Sprites): Not generated (no sprites in project)

`,e.tracks&&e.tracks.length>0||e.stateMachines&&e.stateMachines.length>0?(l+=`; ==================================================================
`,l+=`; TASK_UPDATE_MUSIC - Fixed-rate audio tick
`,l+=`; ==================================================================
`,l+=`; Keeps tracker and state-machine audio tied to H.TIMI instead of variable-cost loops
`,l+=`; ==================================================================
`,l+=X({purpose:"Interrupt-safe wrapper for tracker/state-machine audio tick.",inputs:["Music engine RAM state and state-machine sound cursors"],outputs:["PSG state advanced once per VBlank"],clobbers:["AF","BC","DE","HL"],preserved:["AF","BC","DE","HL (by push/pop wrapper)"]}),l+=`task_update_music:
`,l+=`    push af
`,l+=`    push bc
`,l+=`    push de
`,l+=`    push hl

`,l+=`    ld hl, prof_music_task_calls
`,l+=`    inc (hl)
`,l+=`    jr nz, .music_prof_counted
`,l+=`    inc hl
`,l+=`    inc (hl)
`,l+=`.music_prof_counted:
`,l+=`    call music_update
`,e.stateMachines&&e.stateMachines.length>0&&(l+=`    call SM_UpdateSound
`),l+=`
`,l+=`    pop hl
`,l+=`    pop de
`,l+=`    pop bc
`,l+=`    pop af
`,l+=`    ret

`):l+=`; TASK_UPDATE_MUSIC: Not generated (no tracker/state-machine audio in project)

`,l+=`; ==================================================================
`,l+=`; TASK_FRAME_COUNTER - Custom timing/animations
`,l+=`; ==================================================================
`,l+=`; Placeholder for user-defined frame-based timing
`,l+=`; Example: Increment animation timers, etc.
`,l+=`; ==================================================================
`,l+=X({purpose:"Reserved slot for user timing logic.",inputs:["None"],outputs:["None by default"],clobbers:["None by default"],preserved:["All (default empty implementation)"]}),l+=`task_frame_counter:
`,l+=`    ; Placeholder - counter is already incremented in dispatcher
`,l+=`    ; Add custom timing logic here if needed
`,l+=`    ret

`,l+=`; ==================================================================
`,l+=`; USER CUSTOM TASK SLOTS (5-7)
`,l+=`; ==================================================================
`,l+=`; These slots are reserved for user-defined tasks
`,l+=`; Enable them dynamically using:
`,l+=`;   LD A, 5                    ; Slot 5
`,l+=`;   LD HL, my_custom_task
`,l+=`;   CALL enable_task
`,l+=`; ==================================================================

`,l}const Ut=255,hi=254,ui=["A","B","C"];function mi(e,l){const a=Si(e),t=a.length>0?[]:gi(e),o=a.length>0?Mi(a):Pi(t);return`; ==================================================================
; PSG SOUND SYSTEM
; File: sound.asm
; Description: AY-3-8910 PSG control and sound effects
; Engine Audio Tick: ${(l==null?void 0:l.tasks.some(s=>s.responsibility==="audio"))??!1?"IRQ task_manager":"GameFlow/game loop"}
; ==================================================================

; ==================================================================
; PSG REGISTER ADDRESSES
; ==================================================================

; Tone Generators (Channels A, B, C)
PSG_TONE_A_LO       EQU 0        ; Channel A period low byte
PSG_TONE_A_HI       EQU 1        ; Channel A period high byte (4 bits)
PSG_TONE_B_LO       EQU 2        ; Channel B period low byte
PSG_TONE_B_HI       EQU 3        ; Channel B period high byte (4 bits)
PSG_TONE_C_LO       EQU 4        ; Channel C period low byte
PSG_TONE_C_HI       EQU 5        ; Channel C period high byte (4 bits)

; Noise Generator
PSG_NOISE_PERIOD    EQU 6        ; Noise period (5 bits)

; Mixer Control
PSG_MIXER           EQU 7        ; Mixer/Enable register
; Bit 0: Channel A tone enable (0=on, 1=off)
; Bit 1: Channel B tone enable
; Bit 2: Channel C tone enable
; Bit 3: Channel A noise enable (0=on, 1=off)
; Bit 4: Channel B noise enable
; Bit 5: Channel C noise enable

; Volume Control
PSG_VOL_A           EQU 8        ; Channel A volume (4 bits) + envelope flag (bit 4)
PSG_VOL_B           EQU 9        ; Channel B volume
PSG_VOL_C           EQU 10       ; Channel C volume

; Envelope Generator
PSG_ENV_LO          EQU 11       ; Envelope period low byte
PSG_ENV_HI          EQU 12       ; Envelope period high byte
PSG_ENV_SHAPE       EQU 13       ; Envelope shape (4 bits)

; ==================================================================
; PSG TONE PERIODS (Musical notes, octave 4, 3.579545 MHz clock)
; ==================================================================

; Note frequencies for octave 4 (middle C = C4)
NOTE_C4         EQU 477      ; C  - 261.63 Hz
NOTE_CS4        EQU 450      ; C# - 277.18 Hz
NOTE_D4         EQU 425      ; D  - 293.66 Hz
NOTE_DS4        EQU 401      ; D# - 311.13 Hz
NOTE_E4         EQU 379      ; E  - 329.63 Hz
NOTE_F4         EQU 357      ; F  - 349.23 Hz
NOTE_FS4        EQU 337      ; F# - 369.99 Hz
NOTE_G4         EQU 318      ; G  - 392.00 Hz
NOTE_GS4        EQU 300      ; G# - 415.30 Hz
NOTE_A4         EQU 284      ; A  - 440.00 Hz
NOTE_AS4        EQU 268      ; A# - 466.16 Hz
NOTE_B4         EQU 253      ; B  - 493.88 Hz
NOTE_C5         EQU 238      ; C5 - 523.25 Hz

; Octave multipliers: Divide period by 2 for +1 octave, multiply by 2 for -1 octave

; ==================================================================
; SOUND EFFECT DURATIONS (in frames, 60Hz)
; ==================================================================

SFX_SHORT           EQU 5        ; ~83ms
SFX_MEDIUM          EQU 15       ; ~250ms
SFX_LONG            EQU 30       ; ~500ms

; ==================================================================
; SOUND SYSTEM INITIALIZATION
; ==================================================================

init_sound_system:
    ; Initialize PSG via BIOS
    call GICINI

    ; Clear runtime sound state so power-on RAM garbage cannot make
    ; sfx_update / SM_UpdateSound drive the PSG for a few random frames.
    xor a
    ld (sfx_active), a
    ld (sfx_timer), a
    ld (sfx_fadeout), a
    ld (sm_sound_active), a
    ld (sm_sound_frames_left), a
    ld (sm_sound_ptr_l), a
    ld (sm_sound_ptr_h), a
    call music_init_system

    ; Silence all channels
    call sfx_silence_all

    ret

; ------------------------------------------------------------------
; task_audio_tick
; Shared audio tick wrapper for IRQ task_manager or HALT game loops.
; Preserves caller-visible registers on every exit path.
; ------------------------------------------------------------------
task_audio_tick:
    push af
    push bc
    push de
    push hl

    call music_update
${e.stateMachines&&e.stateMachines.length>0?`    call SM_UpdateSound
`:""}

    pop hl
    pop de
    pop bc
    pop af
    ret

; ==================================================================
; PSG LOW-LEVEL CONTROL FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; psg_write
; Write to PSG register via BIOS
; Input:  A = Register number (0-13)
;         E = Value to write
; Destroys: AF, E
; ------------------------------------------------------------------
psg_write:
    call WRTPSG
    ret

; ------------------------------------------------------------------
; psg_set_tone
; Set tone period for a channel
; Input:  A = Channel (0=A, 1=B, 2=C)
;         HL = Tone period (12-bit value)
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
psg_set_tone:
    ; Calculate register numbers (A*2 for low, A*2+1 for high)
    add a, a                     ; A = channel * 2
    ld c, a                      ; C = low register number
    inc a
    ld b, a                      ; B = high register number

    ; Write low byte
    ld a, c
    ld e, l
    call WRTPSG

    ; Write high byte (only lower 4 bits)
    ld a, b
    ld e, h
    ld a, e
    and #0F
    ld e, a
    ld a, b
    call WRTPSG

    ret

; ------------------------------------------------------------------
; psg_set_volume
; Set volume for a channel
; Input:  A = Channel (0=A, 1=B, 2=C)
;         B = Volume (0-15) or #10 to enable PSG hardware envelope
; Destroys: AF, E
; ------------------------------------------------------------------
psg_set_volume:
    add a, PSG_VOL_A             ; A = PSG_VOL_x register
    ld e, b                      ; E = volume value
    call WRTPSG
    ret

; ------------------------------------------------------------------
; psg_set_noise
; Set noise generator period
; Input:  A = Noise period (0-31)
; Destroys: AF, E
; ------------------------------------------------------------------
psg_set_noise:
    ld e, a
    ld a, PSG_NOISE_PERIOD
    call WRTPSG
    ret

; ------------------------------------------------------------------
; psg_set_mixer
; Set mixer control (enable/disable tone and noise)
; Input:  A = Mixer value
;         Bits 0-2: Tone off (0=on, 1=off) for channels A,B,C
;         Bits 3-5: Noise off (0=on, 1=off) for channels A,B,C
; Destroys: AF, E
; ------------------------------------------------------------------
psg_set_mixer:
    ld e, a
    ld a, PSG_MIXER
    call WRTPSG
    ret

; ------------------------------------------------------------------
; psg_set_envelope
; Program the global PSG hardware envelope generator
; Input:  HL = Envelope period
;         B = Envelope shape (0-15)
; Destroys: AF, E
; ------------------------------------------------------------------
psg_set_envelope:
    ld a, PSG_ENV_LO
    ld e, l
    call WRTPSG
    ld a, PSG_ENV_HI
    ld e, h
    call WRTPSG
    ld a, b
    and #0F
    ld e, a
    ld a, PSG_ENV_SHAPE
    call WRTPSG
    ret

; ==================================================================
; HIGH-LEVEL SOUND EFFECTS
; ==================================================================

; ------------------------------------------------------------------
; sfx_silence_all
; Silence all PSG channels
; ------------------------------------------------------------------
sfx_silence_all:
    ; Set all volumes to 0
    xor a                        ; A = channel A
    ld b, 0                      ; B = volume 0
    call psg_set_volume

    ld a, 1                      ; A = channel B
    ld b, 0
    call psg_set_volume

    ld a, 2                      ; A = channel C
    ld b, 0
    call psg_set_volume

    ; Disable all tone and noise
    ld a, #3F                    ; All tone and noise off
    call psg_set_mixer

    ret

; ------------------------------------------------------------------
; sfx_beep
; Simple beep sound
; ------------------------------------------------------------------
sfx_beep:
    ; Channel A: 440Hz (A4)
    xor a                        ; A = channel A
    ld hl, NOTE_A4
    call psg_set_tone

    ; Volume 12
    xor a
    ld b, 12
    call psg_set_volume

    ; Enable tone A only
    ld a, #3E                    ; Tone A on, others off
    call psg_set_mixer

    ret

; ------------------------------------------------------------------
; sfx_jump
; Jump sound effect (rising pitch)
; ------------------------------------------------------------------
sfx_jump:
    ; Channel A: Start at C4, quick rise
    xor a
    ld hl, NOTE_C4
    call psg_set_tone

    ; Volume 10
    xor a
    ld b, 10
    call psg_set_volume

    ; Enable tone A
    ld a, #3E
    call psg_set_mixer

    ; TODO: Add pitch sweep for realistic jump sound
    ret

; ------------------------------------------------------------------
; sfx_shoot
; Shooting sound (noise + low tone)
; ------------------------------------------------------------------
sfx_shoot:
    ; Channel A: Low tone
    xor a
    ld hl, 100                   ; Low period = high pitch
    call psg_set_tone

    ; Volume 8
    xor a
    ld b, 8
    call psg_set_volume

    ; Noise generator at period 5
    ld a, 5
    call psg_set_noise

    ; Enable tone A + noise A
    ld a, #36                    ; Tone A + Noise A on
    call psg_set_mixer

    ret

; ------------------------------------------------------------------
; sfx_explosion
; Explosion sound (noise-heavy)
; ------------------------------------------------------------------
sfx_explosion:
    ; Noise generator at period 10
    ld a, 10
    call psg_set_noise

    ; Channel A: Volume 15 (max) with noise
    xor a
    ld b, 15
    call psg_set_volume

    ; Enable noise A only (no tone)
    ld a, #39                    ; Noise A on, tone off
    call psg_set_mixer

    ret

; ------------------------------------------------------------------
; sfx_coin
; Coin/pickup sound (quick ascending notes)
; ------------------------------------------------------------------
sfx_coin:
    ; Channel B: E4 note
    ld a, 1                      ; Channel B
    ld hl, NOTE_E4
    call psg_set_tone

    ; Volume 10
    ld a, 1
    ld b, 10
    call psg_set_volume

    ; Enable tone B
    ld a, #3D                    ; Tone B on, others off
    call psg_set_mixer

    ; TODO: Quick ascend to G4 for classic coin sound
    ret

; ------------------------------------------------------------------
; sfx_damage
; Damage/hit sound (harsh noise)
; ------------------------------------------------------------------
sfx_damage:
    ; Short noise burst
    ld a, 3                      ; Harsh noise period
    call psg_set_noise

    ; Channel C: Volume 12
    ld a, 2                      ; Channel C
    ld b, 12
    call psg_set_volume

    ; Enable noise C only
    ld a, #1F                    ; Noise C on
    call psg_set_mixer

    ret

; ==================================================================
; SOUND EFFECT PLAYBACK SYSTEM
; ==================================================================
; This section provides a simple sound effect manager that can
; play effects with automatic duration and fadeout

; Runtime state lives in variables.asm:
;   sfx_active, sfx_timer, sfx_fadeout

; ------------------------------------------------------------------
; play_sound_effect
; Play one of the built-in sound effects by ID
; Input:  A = sound ID
;         0=beep, 1=jump, 2=shoot, 3=explosion, 4=coin, 5=damage
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
play_sound_effect:
    ld a, (music_active)
    or a
    ret nz
    cp 1
    jp z, play_sound_effect_jump
    cp 2
    jp z, play_sound_effect_shoot
    cp 3
    jp z, play_sound_effect_explosion
    cp 4
    jp z, play_sound_effect_coin
    cp 5
    jp z, play_sound_effect_damage

play_sound_effect_beep:
    ld hl, sfx_beep
    ld b, SFX_SHORT
    call sfx_play
    ret

play_sound_effect_jump:
    ld hl, sfx_jump
    ld b, SFX_SHORT
    call sfx_play
    ret

play_sound_effect_shoot:
    ld hl, sfx_shoot
    ld b, SFX_SHORT
    call sfx_play
    ret

play_sound_effect_explosion:
    ld hl, sfx_explosion
    ld b, SFX_MEDIUM
    call sfx_play
    ret

play_sound_effect_coin:
    ld hl, sfx_coin
    ld b, SFX_SHORT
    call sfx_play
    ret

play_sound_effect_damage:
    ld hl, sfx_damage
    ld b, SFX_SHORT
    call sfx_play
    ret

; ------------------------------------------------------------------
; sfx_play
; Play a sound effect with duration
; Input:  HL = Sound effect function address
;         B = Duration in frames
; ------------------------------------------------------------------
sfx_play:
    ld a, (music_active)
    or a
    ret nz
    ; Call the sound effect function
    push bc
    push hl
    ld de, .return_address
    push de
    jp (hl)                      ; Indirect call
.return_address:
    pop hl
    pop bc

    ; Set timer
    ld a, b
    ld (sfx_timer), a

    ; Mark as active
    ld a, 1
    ld (sfx_active), a

    ret

; ------------------------------------------------------------------
; sfx_update
; Update sound effect system (call every frame)
; Handles automatic fadeout and silence
; ------------------------------------------------------------------
sfx_update:
    ld a, (music_active)
    or a
    ret nz
    ; Check if sound is active
    ld a, (sfx_active)
    or a
    ret z                        ; No active sound

    ; Decrement timer
    ld a, (sfx_timer)
    or a
    jr z, .silence_now

    dec a
    ld (sfx_timer), a

    ; Check if entering fadeout zone (last 5 frames)
    cp 5
    ret nc                       ; Still in main sound

    ; TODO: Implement volume fadeout here
    ret

.silence_now:
    call sfx_silence_all
    xor a
    ld (sfx_active), a
    ret

${o}

; ==================================================================
; END OF PSG SOUND SYSTEM
; ==================================================================
`}function ae(e,l=0,a=255){const t=Number.isFinite(e)?Math.round(e):l;return Math.max(l,Math.min(a,t))}function Ct(e,l=0,a=65535){const t=Number.isFinite(e)?Math.round(e):l;return Math.max(l,Math.min(a,t))}function ne(e){return`#${ae(e).toString(16).toUpperCase().padStart(2,"0")}`}function Ft(e){return`#${Ct(e).toString(16).toUpperCase().padStart(4,"0")}`}function Ga(e){const l=Ct(e??1,1,65535);return Ct(Math.round(l*210),1,65535)}function fi(e){const l=e.replace(/[^a-zA-Z0-9_]/g,"_").replace(/_+/g,"_");return l.length>0?l:"track"}function bi(e){const l=Ct(e.bpm||125,1,999),a=ae(e.speed||6,1,31);return Math.max(1,Math.round(150*a/l))}function yi(e){if(e===null||e==="---")return Ut;if(e==="===")return hi;const l=e.toUpperCase().match(/^([A-G](?:#|-))([0-7])$/);if(!l)return Ut;const a=l[1],t=parseInt(l[2],10),n={"C-":0,"C#":1,"D-":2,"D#":3,"E-":4,"F-":5,"F#":6,"G-":7,"G#":8,"A-":9,"A#":10,"B-":11}[a];return n===void 0?Ut:ae(t*12+n,0,95)}function Ei(e){return!!e&&!Array.isArray(e.waveform)}function gi(e){return(Array.isArray(e.tracks)?e.tracks:[]).filter(a=>((a==null?void 0:a.soundChip)||"PSG")==="PSG"&&(a==null?void 0:a.playbackBackend)!=="external-pt3").map(a=>({...a,soundChip:(a==null?void 0:a.soundChip)||"PSG"}))}function Si(e){return(Array.isArray(e.tracks)?e.tracks:[]).filter(a=>(a==null?void 0:a.playbackBackend)==="external-pt3")}function Ai(e){const l=new Map;for(const a of e.instruments||[])Ei(a)&&typeof a.id=="number"&&l.set(ae(a.id,1,31),a);return l}function Ti(e){const l=new Map;for(const a of e.ornaments||[])!a||typeof a.id!="number"||l.set(ae(a.id,1,15),a);return l}function Ci(e,l){const a=e==null?void 0:e[l];return{note:(a==null?void 0:a.note)??null,instrument:(a==null?void 0:a.instrument)??null,ornament:(a==null?void 0:a.ornament)??null,volume:(a==null?void 0:a.volume)??null}}function Ii(e,l,a,t){if(e==null)return 255;if(e===0)return 0;const o=ae(e,1,31);return o!==e&&a.push(`${t}: instrument ${e} clamped to ${o}`),l.has(o)||a.push(`${t}: instrument ${o} not found`),o}function vi(e,l,a,t){if(e==null)return 255;if(e===0)return 0;const o=ae(e,1,15);return o!==e&&a.push(`${t}: ornament ${e} clamped to ${o}`),l.has(o)||a.push(`${t}: ornament ${o} not found`),o}function Ri(e,l,a){if(e==null)return 255;const t=ae(e,0,15);return t!==e&&l.push(`${a}: volume ${e} clamped to ${t}`),t}function Xe(e,l){const a=[`${e}:`];if(l.length===0)return a.push("    DB #00"),a.join(`
`);for(let t=0;t<l.length;t+=16)a.push(`    DB ${l.slice(t,t+16).map(o=>ne(o)).join(",")}`);return a.join(`
`)}function wi(e,l){const a=[`${e}:`];if(l.length===0)return a.push("    DW #0000"),a.join(`
`);for(let t=0;t<l.length;t+=8)a.push(`    DW ${l.slice(t,t+8).map(o=>Ft(o)).join(",")}`);return a.join(`
`)}function Wa(e){return e.map(l=>ae(l&255))}function Ni(e){const l=e.some(a=>ae(a,0,127)>15);return e.map(a=>{const t=ae(a,0,127);if(!l)return ae(t,0,15);const o=ae(Math.round(t/127*15),0,15);return t>0&&o===0?1:o})}function Li(e){return e.map(l=>ae(l,0,31))}function Di(){const e=17897725e-1,l=16.351597831287414,a=[];for(let t=0;t<96;t++){const o=l*Math.pow(2,t/12);a.push(Math.max(1,Math.round(e/(16*o))))}return wi("music_note_period_table",a)}function xi(e,l){const a=`music_track_${l}_${fi(e.name||`track_${l}`)}`,t=Ai(e),o=Ti(e),n=[],s=Array.isArray(e.order)&&e.order.length>0?e.order:[0],r=ae(e.restartPosition??0,0,Math.max(0,s.length-1)),i=Array.isArray(e.patterns)&&e.patterns.length>0?e.patterns:[{id:`${a}_fallback`,name:"Fallback",numRows:1,rows:[]}],c=[];c.push("; ------------------------------------------------------------------"),c.push(`; Tracker Song ${l}: ${e.name}`),c.push("; ------------------------------------------------------------------"),c.push(`${a}_data:`),c.push(`    DB ${ne(bi(e))}`),c.push(`    DB ${ne(s.length)}`),c.push(`    DB ${ne(r)}`),c.push("    DB #01"),c.push(`    DB ${ne(i.length)}`),c.push(`    DW ${a}_order_table`),c.push(`    DW ${a}_pattern_table`),c.push(`    DW ${a}_instrument_ptr_table`),c.push(`    DW ${a}_ornament_ptr_table`),c.push(`    DW ${Ft(Ga(e.ayHardwareEnvelopePeriod))}`),c.push(`    DB ${ne(ae(e.ayNoisePeriod??16,0,31))}`),c.push(""),c.push(Xe(`${a}_order_table`,s.map(d=>ae(d,0,Math.max(0,i.length-1))))),c.push(""),c.push(`${a}_pattern_table:`),i.forEach((d,_)=>{var p;c.push(`    DW ${a}_pattern_${_}_rows`),c.push(`    DB ${ne(ae((d==null?void 0:d.numRows)||((p=d==null?void 0:d.rows)==null?void 0:p.length)||1,1,255))}`)}),c.push(""),c.push(`${a}_instrument_ptr_table:`);for(let d=0;d<=31;d++)c.push(`    DW ${d>0&&t.has(d)?`${a}_inst_${d}`:"0"}`);c.push(""),c.push(`${a}_ornament_ptr_table:`);for(let d=0;d<=15;d++)c.push(`    DW ${d>0&&o.has(d)?`${a}_orn_${d}`:"0"}`);return c.push(""),i.forEach((d,_)=>{var h,u;const p=ae((d==null?void 0:d.numRows)||((h=d==null?void 0:d.rows)==null?void 0:h.length)||1,1,255);c.push(`${a}_pattern_${_}_rows:`);for(let f=0;f<p;f++){const b=((u=d==null?void 0:d.rows)==null?void 0:u[f])||{},m=[];ui.forEach(y=>{const T=Ci(b,y),g=`${e.name}/pattern${_}/row${f}/${y}`;m.push(yi(T.note)),m.push(Ii(T.instrument,t,n,g)),m.push(vi(T.ornament,o,n,g)),m.push(Ri(T.volume,n,g))}),c.push(`    DB ${m.map(y=>ne(y)).join(",")}`)}c.push("")}),Array.from(t.entries()).sort((d,_)=>d[0]-_[0]).forEach(([d,_])=>{const p=Ni(_.volumeEnvelope||[]),h=Wa(_.toneEnvelope||[]),u=Li(_.noiseEnvelope||[]),f=(_.ayToneEnabled===!1?0:1)<<0|(_.ayNoiseEnabled?1:0)<<1|(typeof _.ayEnvelopeShape=="number"?1:0)<<2,b=p.length>0&&typeof _.volumeLoop=="number"?_.volumeLoop===255?255:ae(_.volumeLoop,0,p.length-1):255,m=h.length>0&&typeof _.toneLoop=="number"?_.toneLoop===255?255:ae(_.toneLoop,0,h.length-1):255,y=u.length>0&&typeof _.noiseLoop=="number"?_.noiseLoop===255?255:ae(_.noiseLoop,0,u.length-1):255,T=p.length>0?p[0]:15;c.push(`${a}_inst_${d}:`),c.push(`    DB ${ne(f)}`),c.push(`    DB ${ne(T)}`),c.push(`    DB ${ne(ae(_.ayEnvelopeShape??0,0,15))}`),c.push(`    DB ${ne(ae(_.noiseBaseFrequency??e.ayNoisePeriod??16,0,31))}`),c.push(`    DW ${Ft(Ga(_.hardwareEnvelopePeriod??e.ayHardwareEnvelopePeriod))}`),c.push(`    DW ${p.length>0?`${a}_inst_${d}_vol_env`:"0"}`),c.push(`    DB ${ne(p.length)}`),c.push(`    DB ${ne(b)}`),c.push(`    DW ${h.length>0?`${a}_inst_${d}_tone_env`:"0"}`),c.push(`    DB ${ne(h.length)}`),c.push(`    DB ${ne(m)}`),c.push(`    DW ${u.length>0?`${a}_inst_${d}_noise_env`:"0"}`),c.push(`    DB ${ne(u.length)}`),c.push(`    DB ${ne(y)}`),p.length>0&&c.push(Xe(`${a}_inst_${d}_vol_env`,p)),h.length>0&&c.push(Xe(`${a}_inst_${d}_tone_env`,h)),u.length>0&&c.push(Xe(`${a}_inst_${d}_noise_env`,u)),c.push("")}),Array.from(o.entries()).sort((d,_)=>d[0]-_[0]).forEach(([d,_])=>{const p=Wa(_.data||[]),h=p.length>0&&typeof _.loopPosition=="number"?ae(_.loopPosition,0,p.length-1):255;c.push(`${a}_orn_${d}:`),c.push(`    DW ${p.length>0?`${a}_orn_${d}_data`:"0"}`),c.push(`    DB ${ne(p.length)}`),c.push(`    DB ${ne(h)}`),p.length>0&&c.push(Xe(`${a}_orn_${d}_data`,p)),c.push("")}),n.length>0&&c.splice(3,0,...n.map(d=>`; WARNING: ${d}`)),{labelBase:a,asm:c.join(`
`)}}function Mi(e){const l=["; ==================================================================","; PT3 MUSIC BACKEND","; Uses the PT3 replayer for AY-3-8910 music playback.","; PT3_SETUP, ChanA, AYREGS, etc. are defined in variables.asm.","; ==================================================================","","; ------------------------------------------------------------------","; music_init_system","; Reset PT3 music state. Call once at startup.","; Destroys: AF","; ------------------------------------------------------------------","music_init_system:","    xor a","    ld (music_active), a","    ld (music_muted), a","    ld (music_loop), a","    ld (music_track_index), a","    ld (PT3_SETUP), a","    ret","","; ------------------------------------------------------------------","; music_silence_channels","; Silence all AY channels via BIOS WRTPSG.","; Destroys: AF, E","; ------------------------------------------------------------------","music_silence_channels:","    xor a","    ld b, a","    call psg_set_volume     ; Channel A vol=0","    ld a, 1","    ld b, 0","    call psg_set_volume     ; Channel B vol=0","    ld a, 2","    ld b, 0","    call psg_set_volume     ; Channel C vol=0","    ld a, PSG_MIXER","    ld e, #3F","    call WRTPSG             ; All tones+noise off","    ret","","; ------------------------------------------------------------------","; music_stop","; Stop music and silence channels.","; Destroys: AF","; ------------------------------------------------------------------","music_stop:","    push af","    xor a","    ld (music_active), a","    ld (PT3_SETUP), a","    call music_silence_channels","    pop af","    ret","","; ------------------------------------------------------------------","; music_mute","; Mute music (keep track position).","; Destroys: AF","; ------------------------------------------------------------------","music_mute:","    ld a, (music_active)","    or a","    ret z","    ld a, 1","    ld (music_muted), a","    call music_silence_channels","    ret","","; ------------------------------------------------------------------","; music_resume","; Resume muted music.","; Destroys: AF","; ------------------------------------------------------------------","music_resume:","    ld a, (music_active)","    or a","    ret z","    xor a","    ld (music_muted), a","    ret","","; ------------------------------------------------------------------","; music_execute_command","; Dispatch a music command from Game Flow nodes.","; Input:  DE -> [command, trackIndex, loopFlag]",";         0=stop, 1=play, 2=mute, 3=resume, #FF=no-op","; Destroys: AF, BC (play path), DE (play path), HL","; ------------------------------------------------------------------","music_execute_command:","    ld a, (de)","    cp #FF","    ret z","    or a","    jp z, music_stop","    cp 1","    jp z, .pt3_exec_play","    cp 2","    jp z, music_mute","    cp 3","    jp z, music_resume","    ret",".pt3_exec_play:","    inc de","    ld a, (de)","    ld c, a","    inc de","    ld a, (de)","    ld b, a","    ld a, c","    call music_play_track","    ret","","; ------------------------------------------------------------------","; music_play_track","; Start playing a PT3 track.","; Input:  A = track index (0-based)",";         B = loop flag (0=no loop, 1=loop)","; Destroys: AF, BC, DE, HL, IX, IY","; ------------------------------------------------------------------","music_play_track:","    ld (music_track_index), a","    ld a, b","    and 1","    ld (music_loop), a","    ld a, (music_track_index)","    add a, a               ; *2 (DW entries)","    ld e, a","    ld d, 0","    ld hl, music_pt3_track_table","    add hl, de","    ld e, (hl)","    inc hl","    ld d, (hl)","    ld h, d","    ld l, e                ; HL = adjusted module address","    xor a","    ld (music_muted), a","    ld (PT3_SETUP), a      ; Clear end-of-song flag","    di                     ; Disable interrupts while initialising PT3","    push ix","    push iy","    call PT3_INIT","    pop iy","    pop ix","    ld a, 1","    ld (music_active), a   ; Enable playback AFTER PT3 is fully initialised","    ei","    ret","","; ------------------------------------------------------------------","; music_update","; Update PT3 playback. Called every frame from the main loop or ISR.","; Checks end-of-song flag, handles loop/stop, runs PT3_PLAY+PT3_ROUT.","; Destroys: AF, HL, DE (saves/restores IX/IY around PT3 calls)","; ------------------------------------------------------------------","music_update:","    ld a, (music_active)","    or a","    ret z","    ld a, (music_muted)","    or a","    ret nz","    ; Check if song ended (CHECKLP sets bit7 of PT3_SETUP)","    ld a, (PT3_SETUP)","    bit 7, a","    jr z, .pt3_upd_play","    ; Song ended - loop or stop?","    ld a, (music_loop)","    or a","    jr z, .pt3_upd_stop","    ; Loop: reinitialise from same track","    ld a, (music_track_index)","    add a, a","    ld e, a","    ld d, 0","    ld hl, music_pt3_track_table","    add hl, de","    ld e, (hl)","    inc hl","    ld d, (hl)","    ld h, d","    ld l, e","    push ix","    push iy","    call PT3_INIT","    pop iy","    pop ix","    ret",".pt3_upd_stop:","    xor a","    ld (music_active), a","    ret",".pt3_upd_play:","    push ix","    push iy","    call PT3_PLAY","    call PT3_ROUT","    pop iy","    pop ix","    ret","","; ------------------------------------------------------------------","; PT3 REPLAYER (included from server root)","; ------------------------------------------------------------------",'    include "../PT3-ROM-alltables-glass.asm"',"","; ------------------------------------------------------------------","; PT3 TRACK TABLE","; ------------------------------------------------------------------","music_pt3_track_count:",`    DB ${ne(e.length)}`,"","music_pt3_track_table:"];return e.length===0?l.push("    DW 0  ; no tracks"):e.forEach((a,t)=>{const o=`pt3_track_${t}_data`,n=a.name||`track ${t}`;a.externalPt3HasHeader?l.push(`    DW ${o}         ; ${n} (full file)`):l.push(`    DW ${o} - 99    ; ${n} (.99 stripped)`)}),e.length>0&&(l.push(""),e.forEach((a,t)=>{const o=`pt3_track_${t}_data`,n=a.name||`Track ${t}`;l.push(`; --- PT3 Track ${t}: ${n} ---`),l.push(`${o}:`);const s=a.externalPt3Data||[];if(s.length===0)l.push("    DB 0  ; empty track");else for(let r=0;r<s.length;r+=16){const i=s.slice(r,r+16);l.push(`    DB ${i.map(c=>ne(c)).join(",")}`)}l.push("")})),l.join(`
`)}function Pi(e){const l=e.map((t,o)=>xi(t,o)),a=["; ==================================================================","; TRACKER MUSIC RUNTIME (Phase 1)","; Phase 1 plays row data and loop state in ROM; descriptor tables are","; serialized now for compatibility and future expansion.","; ==================================================================","","MUSIC_TRACK_ORDER_TABLE     EQU 5","MUSIC_TRACK_PATTERN_TABLE   EQU 7","MUSIC_TRACK_INSTRUMENT_TABLE EQU 9","MUSIC_TRACK_NOISE_DEFAULT   EQU 15","","; ------------------------------------------------------------------","; music_init_system","; Reset tracker runtime RAM and default PSG mixer shadow.","; Input:  None","; Output: music_active=0, music_muted=0, music_mixer_shadow=#3F","; Destroys: AF","; ------------------------------------------------------------------","music_init_system:","    xor a","    ld (music_active), a","    ld (music_muted), a","    ld (music_loop), a","    ld (music_track_index), a","    ld (music_row_frames), a","    ld (music_row_countdown), a","    ld (music_order_pos), a","    ld (music_pattern_index), a","    ld (music_pattern_row), a","    ld (music_pattern_rows), a","    ld (music_track_ptr_l), a","    ld (music_track_ptr_h), a","    ld (music_pattern_ptr_l), a","    ld (music_pattern_ptr_h), a","    ld a, #3F","    ld (music_mixer_shadow), a","    call music_reset_channel_state","    ret","","music_reset_channel_state:","    ld a, #FF","    ld (music_ch_a_note), a","    ld (music_ch_b_note), a","    ld (music_ch_c_note), a","    xor a","    ld (music_ch_a_instrument), a","    ld (music_ch_b_instrument), a","    ld (music_ch_c_instrument), a","    ld (music_ch_a_ornament), a","    ld (music_ch_b_ornament), a","    ld (music_ch_c_ornament), a","    ld (music_ch_a_vol_step), a","    ld (music_ch_b_vol_step), a","    ld (music_ch_c_vol_step), a","    ld (music_ch_a_tone_step), a","    ld (music_ch_b_tone_step), a","    ld (music_ch_c_tone_step), a","    ld (music_ch_a_noise_step), a","    ld (music_ch_b_noise_step), a","    ld (music_ch_c_noise_step), a","    ld (music_ch_a_orn_step), a","    ld (music_ch_b_orn_step), a","    ld (music_ch_c_orn_step), a","    ld a, #0F","    ld (music_ch_a_volume), a","    ld (music_ch_b_volume), a","    ld (music_ch_c_volume), a","    ret","","music_silence_channels:","    xor a","    ld b, 0","    call psg_set_volume","    ld a, 1","    ld b, 0","    call psg_set_volume","    ld a, 2","    ld b, 0","    call psg_set_volume","    ld a, #3F","    call psg_set_mixer","    ret","","music_stop:","    push af","    call music_init_system","    call music_silence_channels","    pop af","    ret","","music_mute:","    ld a, (music_active)","    or a","    ret z","    ld a, 1","    ld (music_muted), a","    call music_silence_channels","    ret","","music_resume:","    ld a, (music_active)","    or a","    ret z","    xor a","    ld (music_muted), a","    call music_update_channel_effects","    ret","","; ------------------------------------------------------------------","; music_execute_command","; Dispatch a compact music command stream used by Game Flow nodes.","; Input:  DE -> [command, trackIndex, loopFlag]",";         command: 0=stop, 1=play, 2=mute, 3=resume, #FF=no-op","; Output: Selected command executed, DE may advance while parsing","; Destroys: AF, BC (play path), DE (play path), HL (via callees)","; ------------------------------------------------------------------","music_execute_command:","    ld a, (de)","    cp #FF","    ret z","    or a","    jp z, music_stop","    cp 1","    jp z, .play_track","    cp 2","    jp z, music_mute","    cp 3","    jp z, music_resume","    ret",".play_track:","    inc de","    ld a, (de)","    ld c, a","    inc de","    ld a, (de)","    ld b, a","    ld a, c","    call music_play_track","    ret","","music_load_track_pointer_from_index:","    add a, a","    ld e, a","    ld d, 0","    ld hl, music_track_ptr_table","    add hl, de","    ld e, (hl)","    inc hl","    ld d, (hl)","    ld a, e","    ld (music_track_ptr_l), a","    ld a, d","    ld (music_track_ptr_h), a","    ret","","music_get_track_ptr:","    ld a, (music_track_ptr_l)","    ld l, a","    ld a, (music_track_ptr_h)","    ld h, a","    ret","","music_get_track_header_ptr:","    ld e, a","    ld d, 0","    call music_get_track_ptr","    add hl, de","    ret","","music_read_track_byte:","    call music_get_track_header_ptr","    ld a, (hl)","    ret","","music_read_track_word:","    call music_get_track_header_ptr","    ld e, (hl)","    inc hl","    ld d, (hl)","    ld h, d","    ld l, e","    ret","","music_get_instrument_ptr:","    or a","    jr z, .no_instrument","    add a, a","    ld e, a","    ld d, 0","    ld a, MUSIC_TRACK_INSTRUMENT_TABLE","    call music_read_track_word","    add hl, de","    ld e, (hl)","    inc hl","    ld d, (hl)","    ld h, d","    ld l, e","    ret",".no_instrument:","    ld hl, 0","    ret","","; ------------------------------------------------------------------","; music_get_channel_instrument_ptr","; Resolve current channel instrument pointer from the cached channel id.","; Input:  C = channel index (0=A, 1=B, 2=C)","; Output: HL = instrument descriptor or 0 when none is active","; Destroys: AF, DE, HL","; ------------------------------------------------------------------","music_get_channel_instrument_ptr:","    ld hl, music_ch_instrument_base","    call music_load_channel_byte","    call music_get_instrument_ptr","    ret","","; ------------------------------------------------------------------","; music_channel_uses_hardware_env","; Check if the active instrument routes channel volume through PSG ENV.","; Input:  C = channel index (0=A, 1=B, 2=C)","; Output: A = 1 when PSG hardware envelope is enabled, else 0","; Destroys: AF, DE, HL","; ------------------------------------------------------------------","music_channel_uses_hardware_env:","    push hl","    call music_get_channel_instrument_ptr","    ld a, h","    or l","    jr z, music_channel_uses_hardware_env_no_hw_env","    ld a, (hl)","    and #04","    jr z, music_channel_uses_hardware_env_no_hw_env","    ld a, 1","    pop hl","    ret","music_channel_uses_hardware_env_no_hw_env:","    xor a","    pop hl","    ret","","; ------------------------------------------------------------------","; music_trigger_channel_attack","; Hook kept for compatibility. The preview-style hardware envelope is","; emulated in software per channel, so new-note state is already reset","; by music_apply_channel_cell before this helper is called.","; Input:  C = channel index (0=A, 1=B, 2=C)","; Output: None","; Destroys: None","; ------------------------------------------------------------------","music_trigger_channel_attack:","    ret","","; ------------------------------------------------------------------","; music_resolve_channel_volume","; Resolve per-frame channel volume.","; Current Phase 1 behavior:","; - emulates AY hardware envelope shapes in software when ayEnvelopeShape is set","; - falls back to music_ch_volume_base when no envelope data exists","; - applies a simple software volumeEnvelope when present","; Input:  C = channel index (0=A, 1=B, 2=C)","; Output: B = PSG volume 0-15","; Destroys: AF, DE, HL","; ------------------------------------------------------------------","music_resolve_channel_volume:","    push af","    push de","    push hl","    ld hl, music_ch_instrument_base","    call music_load_channel_byte","    or a","    jp z, .fallback_base","    call music_get_instrument_ptr","    ld a, h","    or l","    jp z, .fallback_base","    ld a, (hl)","    and #04","    jp nz, .hardware_env",".check_software_env:","    push hl","    ld de, 8","    add hl, de","    ld b, (hl)","    pop hl","    ld a, b","    or a","    jp z, .fallback_base","    push hl","    ld de, 6","    add hl, de","    ld e, (hl)","    inc hl","    ld d, (hl)","    pop hl","    push hl","    ld hl, music_ch_vol_step_base","    call music_load_channel_byte","    cp b","    jr c, .step_ok_restore","    pop hl","    push de","    push hl","    ld de, 9","    add hl, de","    ld a, (hl)","    pop hl","    pop de","    cp b","    jr c, .step_ok","    ld a, b","    push af","    ld hl, music_ch_vol_step_base","    call music_store_channel_byte","    pop af","    ld hl, music_ch_note_base","    ld a, #FF","    call music_store_channel_byte","    xor a","    ld b, a","    jp .mrcv_done",".step_ok_restore:","    pop hl",".step_ok:","    push af","    inc a","    cp b","    jr c, .next_step_ok","    push de","    push hl","    ld de, 9","    add hl, de","    ld a, (hl)","    pop hl","    pop de","    cp b","    jr c, .next_step_ok","    ld a, b",".next_step_ok:","    push de","    ld hl, music_ch_vol_step_base","    call music_store_channel_byte","    pop de","    pop af","    ld l, a","    ld h, 0","    add hl, de","    ld a, (hl)","    cp 16","    jr c, .env_volume_ok","    ld a, 15",".env_volume_ok:","    ld b, a","    jp .mrcv_done",".hardware_env:","    ld hl, music_ch_tone_step_base","    call music_load_channel_byte","    inc a","    cp 2","    jr c, .hw_store_counter","    xor a","    push af","    ld hl, music_ch_tone_step_base","    call music_store_channel_byte","    pop af","    ld hl, music_ch_vol_step_base","    call music_load_channel_byte","    cp 15","    jr nc, .hw_phase_ready","    inc a","    push af","    ld hl, music_ch_vol_step_base","    call music_store_channel_byte","    pop af","    jr .hw_phase_ready",".hw_store_counter:","    push af","    ld hl, music_ch_tone_step_base","    call music_store_channel_byte","    pop af","    ld hl, music_ch_vol_step_base","    call music_load_channel_byte",".hw_phase_ready:","    push af","    call music_get_channel_instrument_ptr","    ld a, h","    or l","    pop af","    jr z, .hw_decay","    push af","    inc hl","    inc hl","    ld a, (hl)","    and #04","    pop af","    jr z, .hw_decay","    ld b, a","    jp .mrcv_done",".hw_decay:","    ld e, a","    ld a, 15","    sub e","    ld b, a","    jp .mrcv_done",".fallback_base:","    ld hl, music_ch_volume_base","    call music_load_channel_byte","    ld b, a",".mrcv_done:","    pop hl","    pop de","    pop af","    ret","","; ------------------------------------------------------------------","; music_resolve_channel_noise","; Resolve per-frame channel noise period, including the PT3-inspired","; software noise macro appended to the instrument descriptor.","; Input:  C = channel index (0=A, 1=B, 2=C)","; Output: A = PSG noise period 0-31","; Destroys: AF, DE, HL","; Preserves: Stack balance restored before return","; ------------------------------------------------------------------","music_resolve_channel_noise:","    push de","    push hl","    ld hl, music_ch_instrument_base","    call music_load_channel_byte","    or a","    jp z, .mrcn_track_default","    call music_get_instrument_ptr","    ld a, h","    or l","    jp z, .mrcn_track_default","    push hl","    ld de, 16","    add hl, de","    ld b, (hl)","    pop hl","    ld a, b","    or a","    jp z, .mrcn_static_noise","    push hl","    ld hl, music_ch_noise_step_base","    call music_load_channel_byte","    cp b","    jr c, .mrcn_step_ok","    ld a, b","    dec a",".mrcn_step_ok:","    push af","    pop af","    pop hl","    push af","    inc a","    cp b","    jr c, .mrcn_store_next","    push de","    ld de, 17","    add hl, de","    ld a, (hl)","    pop de","    cp b","    jr c, .mrcn_store_next","    ld a, b","    dec a",".mrcn_store_next:","    push hl","    push af","    ld hl, music_ch_noise_step_base","    call music_store_channel_byte","    pop af","    pop hl","    ld de, 14","    add hl, de","    ld e, (hl)","    inc hl","    ld d, (hl)","    pop af","    ld l, a","    ld h, 0","    add hl, de","    ld a, (hl)","    and #1F","    jp .mrcn_done",".mrcn_static_noise:","    push de","    ld de, 3","    add hl, de","    ld a, (hl)","    pop de","    and #1F","    jp .mrcn_done",".mrcn_track_default:","    ld a, MUSIC_TRACK_NOISE_DEFAULT","    call music_read_track_byte","    and #1F",".mrcn_done:","    pop hl","    pop de","    ret","","; ------------------------------------------------------------------","; music_play_track","; Start a serialized PSG tracker song from ROM.","; Input:  A = track index in music_track_ptr_table",";         B bit 0 = loop enabled flag","; Output: music_active=1 and first row applied immediately","; Destroys: AF, BC, DE, HL","; Preserves: Stack balance restored on all exits","; ------------------------------------------------------------------","music_play_track:","    push bc","    push de","    push hl","    ld hl, music_track_count","    cp (hl)","    jp nc, .mpt_done","    ld (music_track_index), a","    call music_load_track_pointer_from_index","    ld a, b","    and 1","    ld (music_loop), a","    xor a","    ld (music_muted), a","    ld (music_order_pos), a","    ld (music_pattern_index), a","    ld (music_pattern_row), a","    ld a, 1","    ld (music_active), a","    call music_reset_channel_state","    call music_apply_row",".mpt_done:","    pop hl","    pop de","    pop bc","    ret","","music_store_channel_byte:","    push de","    ld e, c","    ld d, 0","    add hl, de","    ld (hl), a","    pop de","    ret","","music_load_channel_byte:","    push de","    ld e, c","    ld d, 0","    add hl, de","    ld a, (hl)","    pop de","    ret","","music_apply_channel_cell:","    ld c, a","    ld d, 0","    ld a, (hl)","    inc hl","    cp #FF","    jp z, .note_done","    cp #FE","    jp nz, .store_note","    ld a, #FF","    jr .store_note",".store_note:","    cp #FF","    jr z, .store_note_value","    ld d, 1",".store_note_value:","    push hl","    ld hl, music_ch_note_base","    call music_store_channel_byte","    xor a","    ld hl, music_ch_vol_step_base","    call music_store_channel_byte","    ld hl, music_ch_tone_step_base","    call music_store_channel_byte","    ld hl, music_ch_noise_step_base","    call music_store_channel_byte","    ld hl, music_ch_orn_step_base","    call music_store_channel_byte","    pop hl",".note_done:","    ld a, (hl)","    inc hl","    cp #FF","    jp z, .instrument_done","    push hl","    ld hl, music_ch_instrument_base","    call music_store_channel_byte","    pop hl",".instrument_done:","    ld a, (hl)","    inc hl","    cp #FF","    jp z, .ornament_done","    push hl","    ld hl, music_ch_ornament_base","    call music_store_channel_byte","    pop hl",".ornament_done:","    ld a, (hl)","    inc hl","    cp #FF","    jr z, .maybe_trigger_attack","    push hl","    ld hl, music_ch_volume_base","    call music_store_channel_byte","    pop hl",".maybe_trigger_attack:","    ld a, d","    or a","    ret z","    push hl","    call music_trigger_channel_attack","    pop hl","    ret","","; ------------------------------------------------------------------","; music_apply_row","; Decode current order/pattern row and cache channel state for A/B/C.","; Input:  Runtime variables select track/order/pattern position","; Output: Channel note/instrument/volume caches updated",";         Row countdown reloaded and PSG refreshed once","; Destroys: AF, BC, DE, HL","; ------------------------------------------------------------------","music_apply_row:","    ld a, MUSIC_TRACK_ORDER_TABLE","    call music_read_track_word","    ld a, (music_order_pos)","    ld e, a","    ld d, 0","    add hl, de","    ld a, (hl)","    ld (music_pattern_index), a","    ld a, MUSIC_TRACK_PATTERN_TABLE","    call music_read_track_word","    ld a, (music_pattern_index)","    ld e, a","    ld d, 0","    add hl, de","    add hl, de","    add hl, de","    ld e, (hl)","    inc hl","    ld d, (hl)","    inc hl","    ld a, (hl)","    ld (music_pattern_rows), a","    ld a, e","    ld (music_pattern_ptr_l), a","    ld a, d","    ld (music_pattern_ptr_h), a","    ld h, d","    ld l, e","    ld a, (music_pattern_row)","    or a","    jp z, .row_ptr_ready","    ld b, a",".row_offset_loop:","    ld de, 12","    add hl, de","    djnz .row_offset_loop",".row_ptr_ready:","    xor a","    call music_apply_channel_cell","    ld a, 1","    call music_apply_channel_cell","    ld a, 2","    call music_apply_channel_cell","    ld a, (music_pattern_row)","    inc a","    ld d, a","    ld a, (music_pattern_rows)","    cp d","    jp z, .advance_order","    jp c, .advance_order","    ld a, d","    ld (music_pattern_row), a","    jp .row_done",".advance_order:","    xor a","    ld (music_pattern_row), a","    ld a, (music_order_pos)","    inc a","    ld d, a","    ld a, 1","    call music_read_track_byte","    cp d","    jp z, .end_of_order","    jp c, .end_of_order","    ld a, d","    ld (music_order_pos), a","    jp .row_done",".end_of_order:","    ld a, (music_loop)","    or a","    jp z, music_stop","    ld a, 2","    call music_read_track_byte","    ld (music_order_pos), a",".row_done:","    xor a","    call music_read_track_byte","    ld (music_row_frames), a","    ld (music_row_countdown), a","    call music_update_channel_effects","    ret","","; ------------------------------------------------------------------","; music_update","; Advance the tracker once per game frame.","; Input:  None","; Output: Current channel PSG state refreshed; next row applied when due","; Destroys: AF, BC, DE, HL","; ------------------------------------------------------------------","music_update:","    ld a, (music_active)","    or a","    ret z","    ld a, (music_muted)","    or a","    ret nz","    call music_update_channel_effects","    ld a, (music_row_countdown)","    or a","    jp z, music_apply_row","    dec a","    ld (music_row_countdown), a","    ret nz","    call music_apply_row","    ret","","; ------------------------------------------------------------------","; music_update_channel_effects","; Rebuild mixer bits and push current cached channel state to PSG.","; Input:  music_ch_* caches already populated","; Output: PSG tone/volume registers updated for channels A/B/C",";         music_mixer_shadow rewritten with current enable bits","; Destroys: AF, BC, DE, HL","; ------------------------------------------------------------------","music_update_channel_effects:","    ld a, #3F","    ld (music_mixer_shadow), a","    ld c, 0","    call music_update_one_channel","    ld c, 1","    call music_update_one_channel","    ld c, 2","    call music_update_one_channel","    ld a, (music_mixer_shadow)","    call psg_set_mixer","    ret","","; ------------------------------------------------------------------","; music_update_one_channel","; Apply one cached channel to PSG and update the mixer shadow bits.","; Input:  C = channel index (0=A, 1=B, 2=C)","; Output: Channel PSG tone/volume updated or silenced",";         music_mixer_shadow updated for that channel","; Destroys: AF, BC, DE, HL","; Preserves: Stack balance restored before return","; ------------------------------------------------------------------","music_update_one_channel:","    push bc","    push de","    push hl","    ld hl, music_ch_note_base","    call music_load_channel_byte","    cp #FF","    jp z, .silent_channel","    add a, a","    ld e, a","    ld d, 0","    ld hl, music_note_period_table","    add hl, de","    ld e, (hl)","    inc hl","    ld d, (hl)","    ld h, d","    ld l, e","    ld a, c","    push bc","    call psg_set_tone","    pop bc","    call music_resolve_channel_volume","    ld a, c","    push bc","    call psg_set_volume","    pop bc","    ld d, 1","    ld e, 0","    call music_get_channel_instrument_ptr","    ld a, h","    or l","    jr z, .apply_mixer_bits","    ld a, (hl)","    and #01","    ld d, a","    ld a, (hl)","    and #02","    srl a","    ld e, a","    ld a, e","    or a","    jr z, .apply_mixer_bits","    push de","    call music_resolve_channel_noise","    call psg_set_noise","    pop de",".apply_mixer_bits:","    ld a, (music_mixer_shadow)","    ld b, a","    ld a, c","    cp 1","    jp z, .enable_b","    cp 2","    jp z, .enable_c","    ld a, b","    bit 0, d","    jr z, .a_tone_off","    and #3E","    jr .a_noise_gate",".a_tone_off:","    or #01",".a_noise_gate:","    bit 0, e","    jr z, .a_noise_off","    and #37","    jp .store_mixer",".a_noise_off:","    or #08","    jp .store_mixer",".enable_b:","    ld a, b","    bit 0, d","    jr z, .b_tone_off","    and #3D","    jr .b_noise_gate",".b_tone_off:","    or #02",".b_noise_gate:","    bit 0, e","    jr z, .b_noise_off","    and #2F","    jp .store_mixer",".b_noise_off:","    or #10","    jp .store_mixer",".enable_c:","    ld a, b","    bit 0, d","    jr z, .c_tone_off","    and #3B","    jr .c_noise_gate",".c_tone_off:","    or #04",".c_noise_gate:","    bit 0, e","    jr z, .c_noise_off","    and #1F","    jp .store_mixer",".c_noise_off:","    or #20","    jp .store_mixer",".silent_channel:","    ld b, 0","    ld a, c","    push bc","    call psg_set_volume","    pop bc","    ld a, (music_mixer_shadow)","    ld b, a","    ld a, c","    cp 1","    jp z, .disable_b","    cp 2","    jp z, .disable_c","    ld a, b","    or #09","    jp .store_mixer",".disable_b:","    ld a, b","    or #12","    jp .store_mixer",".disable_c:","    ld a, b","    or #24",".store_mixer:","    ld (music_mixer_shadow), a","    pop hl","    pop de","    pop bc","    ret","",Di(),"","music_track_count:",`    DB ${ne(l.length)}`,"","music_track_ptr_table:"];return l.length===0?a.push("    DW 0"):l.forEach(t=>{a.push(`    DW ${t.labelBase}_data`)}),l.length>0&&(a.push(""),l.forEach(t=>{a.push(t.asm)})),a.join(`
`)}function ki(e){var t,o,n,s;const l=((o=(t=e.tiles)==null?void 0:t[0])==null?void 0:o.width)||8,a=((s=(n=e.tiles)==null?void 0:n[0])==null?void 0:s.height)||8;return`; ==================================================================
; SCROLL SYSTEM
; File: scroll.asm
; Description: Viewport management and screen scrolling for large worlds
; ==================================================================

; ==================================================================
; SCROLL SYSTEM CONSTANTS
; ==================================================================

SCREEN_WIDTH_TILES      EQU 32      ; MSX Screen 2 width in tiles
SCREEN_HEIGHT_TILES     EQU 24      ; MSX Screen 2 height in tiles
SCREEN_WIDTH_PIXELS     EQU 256     ; MSX Screen 2 width in pixels
SCREEN_HEIGHT_PIXELS    EQU 192     ; MSX Screen 2 height in pixels

; Note: NAMETBL (#1800) is already defined in constants.asm

; ==================================================================
; SCROLL SYSTEM INITIALIZATION
; ==================================================================

init_scroll_system:
    ; Initialize camera to (0, 0)
    xor a
    ld (camera_x), a
    ld (camera_x + 1), a
    ld (camera_y), a
    ld (camera_y + 1), a
    ld (camera_tile_x), a
    ld (camera_tile_y), a

    ; Set world dimensions (will be updated by level loader)
    ld a, SCREEN_WIDTH_TILES
    ld (world_width_tiles), a
    ld a, SCREEN_HEIGHT_TILES
    ld (world_height_tiles), a

    ; Clear dirty flag
    xor a
    ld (scroll_dirty_flag), a

    ret

; ==================================================================
; CAMERA CONTROL FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; set_camera_position
; Set camera position in pixels (with bounds checking)
; Input:  HL = X position (pixels), DE = Y position (pixels)
; Destroys: AF, BC
; ------------------------------------------------------------------
set_camera_position:
    ; Bounds check X
    push hl
    push de

    ; Calculate max X = (world_width_tiles - SCREEN_WIDTH_TILES) * TILE_WIDTH
    ld a, (world_width_tiles)
    sub SCREEN_WIDTH_TILES
    jr c, .scroll_x_in_bounds   ; World smaller than screen

    ; A = tiles to scroll, multiply by tile width
    ld b, a
    ld a, ${l}
    call multiply_a_by_b        ; HL = max X

    ; Compare camera X with max X
    pop de
    pop bc                      ; BC = requested X
    push bc
    push de

    ; If requested X > max X, clamp to max X
    ld a, b
    cp h
    jr c, .scroll_x_clamped
    jr nz, .scroll_x_in_bounds
    ld a, c
    cp l
    jr c, .scroll_x_clamped
    jr .scroll_x_in_bounds

.scroll_x_clamped:
    ld b, h
    ld c, l
    jr .scroll_x_done

.scroll_x_in_bounds:
    pop de
    pop bc
    push bc
    push de

.scroll_x_done:
    ; Store camera X
    ld a, c
    ld (camera_x), a
    ld a, b
    ld (camera_x + 1), a

    ; Calculate camera_tile_x = camera_x / TILE_WIDTH
    ${l===8?`
    ; Tile width is 8, shift right 3 times
    ld a, c
    srl b
    rra
    srl b
    rra
    srl b
    rra`:l===16?`
    ; Tile width is 16, shift right 4 times
    ld a, c
    srl b
    rra
    srl b
    rra
    srl b
    rra
    srl b
    rra`:`
    ; Tile width is ${l}, divide
    ld a, c
    ld c, ${l}
    call div_a_by_c`}
    ld (camera_tile_x), a

    ; Bounds check Y
    pop de                      ; DE = requested Y
    pop bc

    ; Calculate max Y = (world_height_tiles - SCREEN_HEIGHT_TILES) * TILE_HEIGHT
    ld a, (world_height_tiles)
    sub SCREEN_HEIGHT_TILES
    jr c, .scroll_y_in_bounds   ; World smaller than screen

    ld b, a
    ld a, ${a}
    call multiply_a_by_b        ; HL = max Y

    ; If requested Y > max Y, clamp to max Y
    ld a, d
    cp h
    jr c, .scroll_y_clamped
    jr nz, .scroll_y_in_bounds
    ld a, e
    cp l
    jr c, .scroll_y_clamped
    jr .scroll_y_in_bounds

.scroll_y_clamped:
    ld d, h
    ld e, l

.scroll_y_in_bounds:
    ; Store camera Y
    ld a, e
    ld (camera_y), a
    ld a, d
    ld (camera_y + 1), a

    ; Calculate camera_tile_y = camera_y / TILE_HEIGHT
    ${a===8?`
    ; Tile height is 8, shift right 3 times
    ld a, e
    srl d
    rra
    srl d
    rra
    srl d
    rra`:a===16?`
    ; Tile height is 16, shift right 4 times
    ld a, e
    srl d
    rra
    srl d
    rra
    srl d
    rra
    srl d
    rra`:`
    ; Tile height is ${a}, divide
    ld a, e
    ld c, ${a}
    call div_a_by_c`}
    ld (camera_tile_y), a

    ; Mark viewport as dirty (needs redraw)
    ld a, 1
    ld (scroll_dirty_flag), a

    ret

; ------------------------------------------------------------------
; move_camera
; Move camera by delta (relative movement)
; Input:  B = delta X (signed), C = delta Y (signed)
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
move_camera:
    ; Get current camera position
    ld a, (camera_x)
    ld l, a
    ld a, (camera_x + 1)
    ld h, a                     ; HL = camera X

    ld a, (camera_y)
    ld e, a
    ld a, (camera_y + 1)
    ld d, a                     ; DE = camera Y

    ; Add delta X (signed 8-bit)
    ld a, b
    or a
    jp p, .move_positive_x      ; Positive delta

    ; Negative delta
    cpl
    inc a                       ; A = abs(delta)
    ld b, a
    ld a, l
    sub b
    ld l, a
    ld a, h
    sbc a, 0
    ld h, a
    jr .move_x_done

.move_positive_x:
    ld a, l
    add a, b
    ld l, a
    ld a, h
    adc a, 0
    ld h, a

.move_x_done:
    ; Add delta Y (signed 8-bit)
    ld a, c
    or a
    jp p, .move_positive_y

    ; Negative delta
    cpl
    inc a
    ld c, a
    ld a, e
    sub c
    ld e, a
    ld a, d
    sbc a, 0
    ld d, a
    jr .move_y_done

.move_positive_y:
    ld a, e
    add a, c
    ld e, a
    ld a, d
    adc a, 0
    ld d, a

.move_y_done:
    ; Set new camera position (with bounds checking)
    call set_camera_position
    ret

; ------------------------------------------------------------------
; center_camera_on_entity
; Center viewport on an entity (e.g. player)
; Input:  A = Entity index
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
center_camera_on_entity:
    ; Get entity position
    ld c, a
    ld b, 0
    ld hl, entity_x_pos
    add hl, bc
    ld a, (hl)                  ; A = entity X

    ld hl, entity_y_pos
    add hl, bc
    ld e, (hl)                  ; E = entity Y

    ; Calculate camera position to center entity
    ; camera_x = entity_x - (SCREEN_WIDTH / 2)
    sub 128                     ; Center horizontally
    ld l, a
    ld h, 0                     ; HL = camera X

    ; camera_y = entity_y - (SCREEN_HEIGHT / 2)
    ld a, e
    sub 96                      ; Center vertically
    ld e, a
    ld d, 0                     ; DE = camera Y

    ; Set camera position
    call set_camera_position
    ret

; ==================================================================
; VIEWPORT RENDERING
; ==================================================================

; ------------------------------------------------------------------
; update_scroll
; Update viewport if dirty flag is set
; Redraws visible tiles based on camera position
; ------------------------------------------------------------------
update_scroll:
    ; Check if viewport changed
    ld a, (scroll_dirty_flag)
    or a
    ret z                       ; Not dirty, nothing to do

    ; TODO: Implement efficient partial screen redraw
    ; For now: redraw entire visible area (simple but slow)
    call redraw_viewport

    ; Clear dirty flag
    xor a
    ld (scroll_dirty_flag), a
    ret

; ------------------------------------------------------------------
; redraw_viewport
; Redraw all visible tiles based on camera position
; This is the simple (slow) version that redraws everything
; ------------------------------------------------------------------
redraw_viewport:
    ; TODO: Implement full viewport redraw
    ; For each visible tile (32x24):
    ;   1. Calculate world tile coords (camera_tile + screen offset)
    ;   2. Read tile ID from world map
    ;   3. Write tile ID to Name Table

    ; Placeholder: Just return for now
    ret

; ==================================================================
; UTILITY FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; multiply_a_by_b
; Multiply A by B (unsigned 8-bit)
; Input:  A = multiplicand, B = multiplier
; Output: HL = result (16-bit)
; Destroys: AF, BC
; ------------------------------------------------------------------
multiply_a_by_b:
    ld hl, 0
    ld c, a
.scroll_mul_loop:
    ld a, b
    or a
    ret z
    add hl, bc
    dec b
    jr .scroll_mul_loop

; ==================================================================
; END OF SCROLL SYSTEM
; ==================================================================
`}function Ya(e,l,a){var s,r;const t=[],o=a.some(i=>i.responsibility==="audio"),n=(((s=e.tracks)==null?void 0:s.length)||0)>0||(((r=e.stateMachines)==null?void 0:r.length)||0)>0;return!o&&n&&t.push({id:"audio_tick_fallback",responsibility:"audio",routineLabel:"task_audio_tick",phase:"postHalt",notes:["Fallback path when IRQ audio task is disabled."]}),t.push({id:"sprite_upload",responsibility:"sprites",routineLabel:"update_sprites_to_vram",phase:"postHalt"},{id:"screen_flow",responsibility:"screenFlow",routineLabel:"check_world_screen_transition",phase:"preUpdate"},{id:"entities",responsibility:"entities",routineLabel:"update_all_entities",phase:"postUpdate"},{id:"state_machines",responsibility:"stateMachines",routineLabel:"execute_all_state_machines",phase:"postUpdate"},{id:"animated_tiles",responsibility:"animation",routineLabel:"update_animated_tiles",phase:"postUpdate"},{id:"sfx",responsibility:"sfx",routineLabel:"sfx_update",phase:"postUpdate"},{id:"hud",responsibility:"hud",routineLabel:"render_hud",phase:"render"}),t}function Oi(e,l){var r,i;const a=[],t=l.interruptConfig??{},o=t.enableAudioTask??!0,n=t.enableFrameCounterTask??!0,s=(((r=e.tracks)==null?void 0:r.length)||0)>0||(((i=e.stateMachines)==null?void 0:i.length)||0)>0;return o&&s&&a.push({id:"audio_tick",responsibility:"audio",routineLabel:"task_audio_tick",slot:0,period:1,enabledAtBoot:!0,irqSafe:!0,estimatedCycles:0,notes:["Tracker/PT3 music and state-machine sound tick."]}),n&&a.push({id:"frame_counter",responsibility:"timer",routineLabel:"task_frame_counter",slot:1,period:1,enabledAtBoot:!0,irqSafe:!0,estimatedCycles:0,notes:["Minimal periodic timing hook."]}),a}function Ui(e,l){const a=l.executionMode??"interruptTaskManager";if(a==="gameLoopHalt")return{mode:a,tasks:[],mainline:Ya(e,l,[]),diagnostics:{warnings:[],errors:[],estimatedIrqCycles:0,estimatedMainlineHotspots:["entities","stateMachines","hud"]}};const t=Oi(e,l);return{mode:a,tasks:t,mainline:Ya(e,l,t),diagnostics:{warnings:[],errors:[],estimatedIrqCycles:t.reduce((o,n)=>o+(n.estimatedCycles??0),0),estimatedMainlineHotspots:["entities","stateMachines","hud"]}}}const $i=new Set(["sprites","hud","entities","stateMachines"]);function Bi(e,l){var i;const a=[...e.diagnostics.errors],t=[...e.diagnostics.warnings];((i=l.tiles)==null?void 0:i.some(c=>{var d;return((d=c.logicalProperties)==null?void 0:d.causesDamage)===!0}))&&(lt(l).usedComponents.has("Health")||a.push('Tiles with "Deadly" (causesDamage) exist but no entity has the Health component. Add the Health component to the hero/player entity so deadly tiles can cause damage.'));const n=new Map;for(const c of e.tasks){const d=n.get(c.slot);d?a.push(`IRQ slot duplicated: ${c.slot} (${d}, ${c.id})`):n.set(c.slot,c.id),$i.has(c.responsibility)&&a.push(`Responsibility not allowed in IRQ for v1: ${c.responsibility}`)}const s=e.tasks.some(c=>c.responsibility==="audio"),r=e.mainline.some(c=>c.responsibility==="audio");return s&&r&&a.push("Audio responsibility duplicated between IRQ and mainline"),e.mode==="interruptTaskManager"&&e.tasks.length===0&&t.push("interruptTaskManager selected without active IRQ tasks"),{...e,diagnostics:{...e.diagnostics,warnings:t,errors:a}}}function Fi(e){return e.executionMode?e.executionMode:"interruptTaskManager"}function ji(e,l){const a={...l,executionMode:Fi(l)},t=Bi(Ui(e,a),e);if(t.diagnostics.errors.length>0)throw new Error(`Execution plan validation failed:
${t.diagnostics.errors.join(`
`)}`);return t}function zi(e,l,a={}){var p;if(console.log("🔧 Generating modular ASM files..."),!e)throw console.error("❌ projectName is required"),new Error("projectName is required");if(!l)throw console.error("❌ assets is undefined or null"),new Error("assets array is required");if(!Array.isArray(l))throw console.error("❌ assets is not an array"),new Error("assets must be an array");console.log(`📊 Project: ${e}, Assets: ${l.length}, Config:`,a);let t;try{t=jt(e,l),console.log(`🔍 Analysis complete: ${t.sprites.length} sprites, ${t.tiles.length} tiles`)}catch(h){console.error("❌ Error analyzing project:",h),t={hasSprites:!1,hasTiles:!1,hasScreens:!1,hasEntities:!1,hasComponents:!1,hasGameFlow:!1,hasMenus:!1,hasFonts:!1,hasECS:!1,hasMultipleScreens:!1,hasAnimations:!1,hasCollisions:!1,hasMenuSystem:!1,components:[],templates:[],entities:[],sprites:[],sounds:[],tracks:[],trackIndexByAssetId:{},tiles:[],tileBanks:[],screens:[],screenMaps:[],projectName:e,customStates:[],stateMachines:[],globalVariables:[]},console.log("🔄 Using fallback empty analysis")}const o=a.interruptDrivenComponents??!0,n=a.hardwareMode||"hybrid",s=a.optimizeLevel||"safe",r=a.targetFormat||"konami",i=a.romMode||"simple32k",c=a.autoMegaROM??!1,d=ji(t,a);console.log("📝 [MSX GENERATOR] Generating all ASM files..."),console.log(`🔧 Hardware Mode: ${n.toUpperCase()}, Optimize: ${s}`),console.log(`[MSX GENERATOR] ROM config: mode=${i}, mapper=${r}, autoMegaROM=${c}`);const _={"page0.asm":jo(t,i),"bios.asm":uo({hardwareMode:{mode:n,optimizeLevel:s}}),"constants.asm":fo(t),"variables.asm":bo(t),"mapper.asm":Go({targetFormat:r,romMode:i,autoMegaROM:c}),"interrupt.asm":ai(t,{interruptDrivenComponents:o,romMode:i},d),"header.asm":Eo(e,t,d,i),"patterns.asm":en(t,i),"colors.asm":tn(t,i),"components.asm":o?`; Components are generated inside interrupt.asm (interruptDrivenComponents=true)
`:pl(t,i),"entities.asm":Jn(t),"worlds.asm":Mr(t),"screens.asm":Er(t,i),"sprites.asm":Tn(t,i),"font.asm":gr(t,i),"hud.asm":Tr(t),"menus.asm":Pr(t),"sound.asm":mi(t,d),"scroll.asm":ki(t),"animtiles.asm":dr(t,i),"statemachine.asm":t.stateMachines&&t.stateMachines.length>0?Jr(t.stateMachines,t.globalVariables,t.sprites,t.tiles,t.templates,t.sounds,t.trackIndexByAssetId,i):`; No State Machines
`,"gameflow.asm":Do(t,d),"main.asm":Ho(e,t,i),"unitedFiles.asm":""};return a.generateUnified&&(_["unitedFiles.asm"]=cn(_,e,t,d,{romMode:i,targetFormat:r,autoMegaROM:c})),console.log("✅ Modular ASM files generated successfully!"),console.log(`📊 Generated ${Object.keys(_).filter(h=>_[h]).length} files`),console.log("📋 [DEBUG] Files generated:",Object.keys(_)),console.log("🎯 [DEBUG] interrupt.asm length:",((p=_["interrupt.asm"])==null?void 0:p.length)||"MISSING!"),_}const Gs=Object.freeze(Object.defineProperty({__proto__:null,generateModularASM:zi},Symbol.toStringTag,{value:"Module"}));export{ps as $,Ke as A,ba as B,zl as C,Xi as D,Ki as E,Hl as F,Fs as G,ie as H,cs as I,Cl as J,Il as K,Hi as L,Qi as M,vl as N,ds as O,Wi as P,Fl as Q,gt as R,It as S,$s as T,Bs as U,jl as V,Rl as W,fs as X,_s as Y,as as Z,hs as _,ls as a,ys as a0,gs as a1,us as a2,ms as a3,Es as a4,bs as a5,Ss as a6,Be as a7,ft as a8,rs as a9,zs as aa,qi as ab,Zi as ac,mt as ad,He as ae,ze as af,de as ag,Is as ah,Vl as ai,Hs as aj,Cs as ak,F as al,w as am,Yi as an,Vs as ao,vs as ap,es as aq,Ts as ar,ns as as,Rs as at,As as au,Ji as av,ws as aw,Gs as ax,ts as b,os as c,Ze as d,Ls as e,is as f,Ns as g,ss as h,yt as i,Et as j,ce as k,Vi as l,Gi as m,bt as n,xs as o,Ms as p,Ps as q,ks as r,Ds as s,Os as t,qe as u,Je as v,Ol as w,Us as x,js as y,fa as z};
