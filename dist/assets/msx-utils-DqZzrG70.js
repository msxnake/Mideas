var le=(e=>(e.Score="Score",e.HighScore="HighScore",e.Lives="Lives",e.EnergyBar="EnergyBar",e.ItemDisplay="ItemDisplay",e.SceneName="SceneName",e.MiniMap="MiniMap",e.CoinCounter="CoinCounter",e.BossEnergyBar="BossEnergyBar",e.PhaseIndicator="PhaseIndicator",e.AttackAlert="AttackAlert",e.TextBox="TextBox",e.NumericField="NumericField",e.CustomCounter="CustomCounter",e))(le||{});const Xe={water:{maskValue:1},customGravity:{maskValue:2},icePhysics:{maskValue:4},spriteConceal:{maskValue:8}},Ya={secretZone:{label:"Secret Zone",color:"rgba(255, 209, 102, 0.38)"},wind:{label:"Wind",color:"rgba(91, 192, 235, 0.34)"},water:{label:"Water",color:"rgba(50, 100, 200, 0.4)"},customGravity:{label:"Custom Gravity",color:"rgba(150, 50, 200, 0.4)"},icePhysics:{label:"Ice Physics",color:"rgba(100, 200, 255, 0.4)"},spriteConceal:{label:"Sprite Concealment",color:"rgba(100, 100, 100, 0.4)"}},lt={direction:"right",strength:1},kr=e=>{switch(e){case"wind":return{...lt};default:return{}}},Qa=(e,t)=>{const a=t||{};if(e==="wind"){const l=["left","right","up","down"],o=typeof a.direction=="string"?a.direction:lt.direction,n=l.includes(o)?o:lt.direction,i=typeof a.strength=="number"?a.strength:parseInt(String(a.strength??""),10);return{direction:n,strength:Number.isFinite(i)?Math.max(0,i):lt.strength}}return{}},Xa=e=>{if(e.effectType&&e.effectType in Ya)return e.effectType;const t=e.mask??0;return(t&Xe.water.maskValue)!==0?"water":(t&Xe.customGravity.maskValue)!==0?"customGravity":(t&Xe.icePhysics.maskValue)!==0?"icePhysics":(t&Xe.spriteConceal.maskValue)!==0?"spriteConceal":"secretZone"};var Ka=(e=>(e.None="None",e.Tile="Tile",e.Sprite="Sprite",e.Screen="Screen",e.Code="Code",e.Attributes="Attributes",e.Sound="Sound",e.Platformer="Platformer",e.WorldMap="WorldMap",e.Track="Track",e.HUD="HUD",e.TileBanks="TileBanks",e.Font="Font",e.HelpDocs="HelpDocs",e.BehaviorEditor="BehaviorEditor",e.ComponentDefinitionEditor="ComponentDefinitionEditor",e.EntityTemplateEditor="EntityTemplateEditor",e.Boss="Boss",e.WorldView="WorldView",e.GameFlow="GameFlow",e.MainMenu="MainMenu",e.StateMachine="StateMachine",e.GlobalVariables="GlobalVariables",e.Palette="Palette",e))(Ka||{});const Pr=[1,3,5,7],Or=[{id:0,name:"NoSolid (Passable)",isSolid:!1},{id:1,name:"Solid (Wall/Ground)",isSolid:!0},{id:2,name:"Platform (Top-Solid)",isSolid:!0},{id:3,name:"Slope (Solid)",isSolid:!0}],Ur={isBreakable:{bit:0,label:"Breakable"},isMovable:{bit:1,label:"Movable"},causesDamage:{bit:2,label:"Deadly"},isInteractiveSwitch:{bit:3,label:"Interactable"}},$r="0.267",He=[{name:"Transparent",hex:"rgba(0,0,0,0)"},{name:"Black",hex:"#000000"},{name:"Medium Green",hex:"#3EB847"},{name:"Light Green",hex:"#74D07D"},{name:"Dark Blue",hex:"#2F2FC1"},{name:"Light Blue",hex:"#5858FC"},{name:"Dark Red",hex:"#B63125"},{name:"Cyan",hex:"#68D2DA"},{name:"Medium Red",hex:"#FC584A"},{name:"Light Red",hex:"#FF8E81"},{name:"Dark Yellow",hex:"#C0BF3B"},{name:"Light Yellow",hex:"#E7E474"},{name:"Dark Green",hex:"#309337"},{name:"Magenta",hex:"#B640C8"},{name:"Gray",hex:"#999999"},{name:"White",hex:"#FFFFFF"}],oe=[{name:"Transparent (Backdrop)",hex:"rgba(0,0,0,0)",index:0},{name:"Black",hex:"#000000",index:1},{name:"Medium Green",hex:"#21C842",index:2},{name:"Light Green",hex:"#5EDC78",index:3},{name:"Dark Blue",hex:"#5455ED",index:4},{name:"Light Blue",hex:"#7D76FC",index:5},{name:"Dark Red",hex:"#D4524D",index:6},{name:"Cyan",hex:"#42EBF5",index:7},{name:"Medium Red",hex:"#FC5554",index:8},{name:"Light Red",hex:"#FF7978",index:9},{name:"Dark Yellow",hex:"#D4C154",index:10},{name:"Light Yellow",hex:"#E6CE80",index:11},{name:"Dark Green",hex:"#21B03B",index:12},{name:"Magenta",hex:"#C95BBA",index:13},{name:"Gray",hex:"#CCCCCC",index:14},{name:"White",hex:"#FFFFFF",index:15}],be=[0,36,73,109,146,182,219,255],Pe=e=>e.toString(16).padStart(2,"0").toUpperCase(),Fr=(()=>{const e=[];for(let t=0;t<be.length;t++)for(let a=0;a<be.length;a++)for(let l=0;l<be.length;l++){const o=t<<6|a<<3|l;e.push({index:o,hex:`#${Pe(be[t])}${Pe(be[a])}${Pe(be[l])}`,rLevel:t,gLevel:a,bLevel:l})}return e})(),ut=e=>{let t=0,a=1/0;return be.forEach((l,o)=>{const n=Math.abs(l-e);n<a&&(a=n,t=o)}),t},Za=e=>!e||!e.startsWith("#")||e.length!==7?"#000000":e.toUpperCase(),qa=e=>{const t=Za(e),a=parseInt(t.slice(1,3),16),l=parseInt(t.slice(3,5),16),o=parseInt(t.slice(5,7),16),n=ut(a),i=ut(l),r=ut(o),_=`#${Pe(be[n])}${Pe(be[i])}${Pe(be[r])}`,d=n<<6|i<<3|r;return{hex:_,masterIndex:d}},Br=He.map((e,t)=>{if(t===0)return{slotIndex:0,masterIndex:-1,hex:"rgba(0,0,0,0)"};const a=qa(e.hex);return{slotIndex:t,masterIndex:a.masterIndex,hex:a.hex}}),jr=[8,16,24,32],Hr=16,zr=16,Vr=16,De=32,nt=24,Fe=8,Ae=255,Gr="SCREEN 2 (Graphics I)",Wr=["ADC","ADD","AND","BIT","CALL","CCF","CP","CPD","CPDR","CPI","CPIR","CPL","DAA","DEC","DI","DJNZ","EI","EX","EXX","HALT","IM","IN","INC","IND","INDR","INI","INIR","JP","JR","LD","LDD","LDDR","LDI","LDIR","NEG","NOP","OR","OTDR","OTIR","OUT","OUTD","OUTI","POP","PUSH","RES","RET","RETI","RETN","RL","RLA","RLC","RLCA","RLD","RR","RRA","RRC","RRCA","RRD","RST","SBC","SCF","SET","SLA","SLL","SRA","SRL","SUB","XOR"],Yr=["A","F","B","C","D","E","H","L","AF","BC","DE","HL","IXH","IXL","IYH","IYL","IX","IY","SP","PC","I","R","AF'"],Qr=["NZ","Z","NC","C","PO","PE","P","M"],Xr=[".ORG","ORG","END",".END",".EQU","EQU",".DB","DB",".BYTE","BYTE","DEFB",".DW","DW",".WORD","WORD","DEFW",".DS","DS",".BLOCK","BLOCK","DEFS",".DEFINE","DEFINE",".MACRO","MACRO",".ENDM","ENDM",".IF","IF",".ENDIF","ENDIF",".ELSE","ELSE",".INCLUDE","INCLUDE",".DEFM","DEFM",".ZILOG",".PHASE",".REPT",".ENDR",".SEARCH",".RANDOM",".ROM",".MEGAROM",".BASIC",".CAS",".WAV",".MSXDOS"],Kr=[{id:"pac_man_collection",name:"Pac-Man Tile Collection",code:`; Pac-Man Style Tile Collection System for MSX
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
POWER_MODE:         DB 0       ; Power-up mode active flag`}],Zr=[],ct=8,ze=15,Ve=1;var xa;const qr=((xa=oe.find(e=>e.index===ze))==null?void 0:xa.hex)||oe[15].hex;var Ma;const Jr=((Ma=oe.find(e=>e.index===Ve))==null?void 0:Ma.hex)||oe[1].hex,rt=new Map(oe.map(e=>[e.hex,e])),ei=new Map(oe.map(e=>[e.index,e])),ti=oe[1],ai=32,li=125,oi=6,ni=31,ri=15,ii=["A","B","C"],si=["1","2","3","4","5"],di=["C-","C#","D-","D#","E-","F-","F#","G-","G#","A-","A#","B-"],ci=32,_i={q:{noteNameIndex:0,baseOctave:5},w:{noteNameIndex:1,baseOctave:5},e:{noteNameIndex:2,baseOctave:5},r:{noteNameIndex:3,baseOctave:5},t:{noteNameIndex:4,baseOctave:5},y:{noteNameIndex:5,baseOctave:5},u:{noteNameIndex:6,baseOctave:5},i:{noteNameIndex:7,baseOctave:5},o:{noteNameIndex:8,baseOctave:5},p:{noteNameIndex:9,baseOctave:5},"[":{noteNameIndex:10,baseOctave:5},"]":{noteNameIndex:11,baseOctave:5},a:{noteNameIndex:0,baseOctave:4},s:{noteNameIndex:1,baseOctave:4},d:{noteNameIndex:2,baseOctave:4},f:{noteNameIndex:3,baseOctave:4},g:{noteNameIndex:4,baseOctave:4},h:{noteNameIndex:5,baseOctave:4},j:{noteNameIndex:6,baseOctave:4},k:{noteNameIndex:7,baseOctave:4},l:{noteNameIndex:8,baseOctave:4},ñ:{noteNameIndex:9,baseOctave:4},";":{noteNameIndex:9,baseOctave:4},"'":{noteNameIndex:10,baseOctave:4},z:{noteNameIndex:0,baseOctave:3},x:{noteNameIndex:1,baseOctave:3},c:{noteNameIndex:2,baseOctave:3},v:{noteNameIndex:3,baseOctave:3},b:{noteNameIndex:4,baseOctave:3},n:{noteNameIndex:5,baseOctave:3},m:{noteNameIndex:6,baseOctave:3},",":{noteNameIndex:7,baseOctave:3},".":{noteNameIndex:8,baseOctave:3},2:{noteNameIndex:1,baseOctave:5},3:{noteNameIndex:3,baseOctave:5},5:{noteNameIndex:6,baseOctave:5},6:{noteNameIndex:8,baseOctave:5},7:{noteNameIndex:10,baseOctave:5}},pi={min:-2,max:2},hi=[{id:1,name:"Piano",volumeEnvelope:[15,14,13,11,9,7,5,3,2,1,0],toneEnvelope:[0],volumeLoop:255,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1},{id:2,name:"Electric Bass",volumeEnvelope:[15,14,13,12,11,10,9,8],toneEnvelope:[0],volumeLoop:3,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:12},{id:3,name:"Lead Vibrato",volumeEnvelope:[0,5,10,15,15,15,14,13,12],toneEnvelope:[0,1,2,1,0,-1,-2,-1],volumeLoop:4,toneLoop:0,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:13},{id:4,name:"Strings Pad",volumeEnvelope:[0,2,4,6,8,10,12,14,15,15,15],toneEnvelope:[0,0,1,1,0,0,-1,-1],volumeLoop:8,toneLoop:0,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:13},{id:5,name:"Kick Drum",volumeEnvelope:[15,13,10,7,4,2,0],toneEnvelope:[12,10,8,6,4,2,0],volumeLoop:255,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:0},{id:6,name:"Snare Drum",volumeEnvelope:[15,12,9,6,3,1,0],toneEnvelope:[0],volumeLoop:255,toneLoop:255,ayToneEnabled:!1,ayNoiseEnabled:!0,ayEnvelopeShape:0},{id:7,name:"Hi-Hat",volumeEnvelope:[12,10,8,6,4,2,0],toneEnvelope:[0],volumeLoop:255,toneLoop:255,ayToneEnabled:!1,ayNoiseEnabled:!0,ayEnvelopeShape:0},{id:8,name:"Arpeggio",volumeEnvelope:[15,15,14,14,13,13,12,12],toneEnvelope:[0,4,7,12,7,4,0],volumeLoop:0,toneLoop:0,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:10},{id:9,name:"Organ",volumeEnvelope:[15,15,15,15,15],toneEnvelope:[0],volumeLoop:0,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:13},{id:10,name:"Bell",volumeEnvelope:[15,14,12,10,8,6,4,3,2,1,0],toneEnvelope:[0,12,0],volumeLoop:255,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:0}],Ja=[{id:"bank_0",name:"Bank 0 - HUD/Fonts",enabled:!0,vramPatternStart:0,vramColorStart:8192,screenZone:{x:0,y:0,width:De,height:8},charsetRangeStart:0,charsetRangeEnd:255,defaultFgColorIndex:15,defaultBgColorIndex:4,isLocked:!1,assignedTiles:{}},{id:"bank_1",name:"Bank 1 - Game Tileset",enabled:!0,vramPatternStart:2048,vramColorStart:10240,screenZone:{x:0,y:8,width:De,height:8},charsetRangeStart:0,charsetRangeEnd:255,defaultFgColorIndex:2,defaultBgColorIndex:1,isLocked:!1,assignedTiles:{}},{id:"bank_2",name:"Bank 2 - Background/Status",enabled:!0,vramPatternStart:4096,vramColorStart:12288,screenZone:{x:0,y:16,width:De,height:8},charsetRangeStart:0,charsetRangeEnd:255,defaultFgColorIndex:11,defaultBgColorIndex:6,isLocked:!1,assignedTiles:{}}],ui={isEnabled:!0,options:[{id:"start",label:"INICIAR PARTIDA",enabled:!0},{id:"continue",label:"CONTINUAR",enabled:!0},{id:"settings",label:"AJUSTES",enabled:!0},{id:"help",label:"AYUDA",enabled:!1}],keyMapping:{up:"ArrowUp",down:"ArrowDown",left:"ArrowLeft",right:"ArrowRight",fire1:" ",fire2:"m"},settings:{volume:12},continueScreen:{title:"CONTINUAR PARTIDA",prompt:"INTRODUCE TU CODIGO"},introScreen:{text:`EN EL ANO 2084, LA CORPORACION CYBERNETICA DOMINA EL MUNDO...

SOLO UN HEROE PUEDE DETENERLOS.`,backgroundAssetId:null},menuScreenAssetId:null,cursorSpriteAssetId:null,menuColors:{text:oe[15].hex,background:oe[4].hex,highlightText:oe[11].hex,highlightBackground:oe[5].hex,border:oe[15].hex}},mi="HELP_DOCS_SYSTEM_ASSET",bi=[{id:"getting_started",title:"Getting Started",articles:[{id:"welcome",title:"Welcome to MSX Retro IDE",content:`
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
        `,tags:["gameflow","troubleshooting","problems"]}]}],fi=50,ot=[{name:"Goal",asmName:"global_var_goal",constantPrefix:"GOAL_",type:"byte",description:"Current objective status",category:"objective",values:[{label:"Failure",value:0,asmConstant:"GOAL_FAILURE"},{label:"Completed",value:1,asmConstant:"GOAL_COMPLETED"},{label:"Partial",value:2,asmConstant:"GOAL_PARTIAL"}]},{name:"MissionStatus",asmName:"global_var_mission_status",constantPrefix:"MISSION_",type:"byte",description:"Current mission state",category:"objective",values:[{label:"NotStarted",value:0,asmConstant:"MISSION_NOT_STARTED"},{label:"Active",value:1,asmConstant:"MISSION_ACTIVE"},{label:"Completed",value:2,asmConstant:"MISSION_COMPLETED"},{label:"Failed",value:3,asmConstant:"MISSION_FAILED"}]},{name:"LevelCompleted",asmName:"global_var_level_completed",constantPrefix:"BOOL_",type:"byte",description:"Level completion flag",category:"objective",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"BossDefeated",asmName:"global_var_boss_defeated",constantPrefix:"BOOL_",type:"byte",description:"Boss defeated flag",category:"objective",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"AllItemsCollected",asmName:"global_var_all_items_collected",constantPrefix:"BOOL_",type:"byte",description:"All items collected flag",category:"objective",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"Score",asmName:"global_var_score",constantPrefix:"SCORE_",type:"word",description:"Current player score (0-65535)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"HiScore",asmName:"global_var_hi_score",constantPrefix:"HISCORE_",type:"word",description:"High score record (0-65535)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"ComboMultiplier",asmName:"global_var_combo_multiplier",constantPrefix:"COMBO_",type:"byte",description:"Combo multiplier (1x, 2x, 3x...)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"Coins",asmName:"global_var_coins",constantPrefix:"COINS_",type:"byte",description:"Coins collected (0-255)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"Gems",asmName:"global_var_gems",constantPrefix:"GEMS_",type:"byte",description:"Gems collected (0-255)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"Lives",asmName:"global_var_lives",constantPrefix:"LIVES_",type:"byte",description:"Remaining lives (0-255)",category:"player",values:[{label:"Custom Value",value:"number"}]},{name:"Health",asmName:"global_var_health",constantPrefix:"HEALTH_",type:"byte",description:"Current health (0-255)",category:"player",values:[{label:"Custom Value",value:"number"}]},{name:"Energy",asmName:"global_var_energy",constantPrefix:"ENERGY_",type:"byte",description:"Current energy/mana (0-255)",category:"player",values:[{label:"Custom Value",value:"number"}]},{name:"Shield",asmName:"global_var_shield",constantPrefix:"BOOL_",type:"byte",description:"Shield active flag",category:"player",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"HasKey",asmName:"global_var_has_key",constantPrefix:"BOOL_",type:"byte",description:"Has key item",category:"inventory",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"HasSword",asmName:"global_var_has_sword",constantPrefix:"BOOL_",type:"byte",description:"Has sword item",category:"inventory",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"HasMap",asmName:"global_var_has_map",constantPrefix:"BOOL_",type:"byte",description:"Has map item",category:"inventory",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"ItemCount",asmName:"global_var_item_count",constantPrefix:"ITEMS_",type:"byte",description:"Special items collected (0-255)",category:"inventory",values:[{label:"Custom Value",value:"number"}]},{name:"PowerUpActive",asmName:"global_var_powerup_active",constantPrefix:"POWERUP_",type:"byte",description:"Active power-up type",category:"inventory",values:[{label:"None",value:0,asmConstant:"POWERUP_NONE"},{label:"Speed",value:1,asmConstant:"POWERUP_SPEED"},{label:"Jump",value:2,asmConstant:"POWERUP_JUMP"},{label:"Invincible",value:3,asmConstant:"POWERUP_INVINCIBLE"}]},{name:"CurrentWorld",asmName:"global_var_current_world",constantPrefix:"WORLD_",type:"byte",description:"Current world number (1-8)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"CurrentLevel",asmName:"global_var_current_level",constantPrefix:"LEVEL_",type:"byte",description:"Current level number (0-255)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"CheckpointReached",asmName:"global_var_checkpoint",constantPrefix:"CHECKPOINT_",type:"byte",description:"Checkpoint reached (0-255)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"SecretFound",asmName:"global_var_secret_found",constantPrefix:"BOOL_",type:"byte",description:"Secret area found flag",category:"progress",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"DoorsUnlocked",asmName:"global_var_doors_unlocked",constantPrefix:"DOORS_",type:"byte",description:"Doors unlocked bitmask (0-255)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"TimeRemaining",asmName:"global_var_time_remaining",constantPrefix:"TIME_",type:"word",description:"Time remaining in seconds (0-65535)",category:"time",values:[{label:"Custom Value",value:"number"}]},{name:"TimeLimitActive",asmName:"global_var_time_limit_active",constantPrefix:"BOOL_",type:"byte",description:"Time limit active flag",category:"time",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"DayNightCycle",asmName:"global_var_day_night_cycle",constantPrefix:"TIME_",type:"byte",description:"Day/night cycle state (0-23)",category:"time",values:[{label:"Custom Value",value:"number"}]},{name:"DifficultyLevel",asmName:"global_var_difficulty",constantPrefix:"DIFFICULTY_",type:"byte",description:"Game difficulty level",category:"difficulty",values:[{label:"Easy",value:0,asmConstant:"DIFFICULTY_EASY"},{label:"Normal",value:1,asmConstant:"DIFFICULTY_NORMAL"},{label:"Hard",value:2,asmConstant:"DIFFICULTY_HARD"},{label:"Expert",value:3,asmConstant:"DIFFICULTY_EXPERT"}]},{name:"EnemiesDefeated",asmName:"global_var_enemies_defeated",constantPrefix:"ENEMIES_",type:"word",description:"Enemies defeated count (0-65535)",category:"special",values:[{label:"Custom Value",value:"number"}]},{name:"PerfectRun",asmName:"global_var_perfect_run",constantPrefix:"BOOL_",type:"byte",description:"Perfect run (no damage) flag",category:"special",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]}],ae=8,el=e=>{let t=e.toString(16).toUpperCase();return t.length===1&&(t="0"+t),t},yi=(e,t,a)=>{var c,s;if(!e.lineAttributes)return`;; ERROR: Tile ${t} is missing line attributes required for SCREEN 2 export.
`;const l=t.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let o=`;; Tile: ${t} (${e.width}x${e.height})
`;o+=`;; Structure: ${e.width/ae}x${e.height/ae} character blocks (8x8 pixels each)
`,o+=`;; Data format: ${a.toUpperCase()}

`;const n=e.width/ae,i=e.height/ae,r=p=>a==="hex"?`$${el(p)}`:p.toString(10),_=[],d=[];for(let p=0;p<i;p++)for(let m=0;m<n;m++){const u=`;; Character Block (${m}, ${p}) for ${l}`,h=[];for(let w=0;w<ae;w++){const v=p*ae+w;let f=0;if(e.lineAttributes[v]&&e.lineAttributes[v][m]){const A=e.lineAttributes[v][m].fg;for(let g=0;g<ae;g++){const S=m*ae+g;e.data[v]&&e.data[v][S]!==void 0&&e.data[v][S]===A&&(f|=1<<7-g)}}h.push(f)}const y=h.map(r).join(",");_.push({comment:`${u} - PATTERN Data (8 bytes):`,dataString:`DB ${y}`});const b=[];for(let w=0;w<ae;w++){const v=p*ae+w;let f=ze<<4|Ve;if(e.lineAttributes[v]&&e.lineAttributes[v][m]){const A=e.lineAttributes[v][m],g=((c=rt.get(A.fg))==null?void 0:c.index)??ze,S=((s=rt.get(A.bg))==null?void 0:s.index)??Ve;f=g<<4|S}b.push(f)}const E=b.map(r).join(",");d.push({comment:`${u} - COLOR Attribute Data (8 bytes - FG|BG):`,dataString:`DB ${E}`})}return o+=`;; --- PATTERN DATA ---
`,_.length>0?(o+=`${l}_PATTERN_DATA:
`,_.forEach(p=>{o+=`${p.comment}
`,o+=`    ${p.dataString}
`})):o+=`;; No pattern data generated.
`,o+=`
`,o+=`;; --- COLOR ATTRIBUTE DATA ---
`,d.length>0?(o+=`${l}_COLOR_DATA:
`,d.forEach(p=>{o+=`${p.comment}
`,o+=`    ${p.dataString}
`})):o+=`;; No color attribute data generated.
`,o+=`
;; End of Tile Data for ${l}
`,o},Ei=(e,t,a,l)=>{const o=Math.max(1,e/ct);return Array(t).fill(null).map(()=>Array(o).fill(null).map(()=>({fg:a,bg:l})))},At=(e,t)=>{var i,r,_,d;const a=[],l=e.width/ae,o=e.height/ae,n=t==="SCREEN 2 (Graphics I)";for(let c=0;c<o;c++)for(let s=0;s<l;s++)for(let p=0;p<ae;p++){const m=c*ae+p;let u=0,h;n&&e.lineAttributes&&e.lineAttributes[m]&&e.lineAttributes[m][s]&&(h=e.lineAttributes[m][s].fg);for(let y=0;y<ae;y++){const b=s*ae+y,E=(i=e.data[m])==null?void 0:i[b];if(E!==void 0){let w=!1;n&&h?w=E===h:n||(w=E!==He[0].hex&&E!==((d=(_=(r=e.lineAttributes)==null?void 0:r[0])==null?void 0:_[0])==null?void 0:d.bg)),w&&(u|=1<<7-y)}}a.push(u)}return new Uint8Array(a)},Oe=(e,t)=>{var n,i;const a=e.length;if(a===0)return[];const l=((n=e[0])==null?void 0:n.length)||0;if(l===0)return[[]];const o=e.map(r=>[...r]);for(let r=0;r<a;r++)for(let _=0;_<l;_++){const d=Math.floor(_/ct),c=(i=t[r])==null?void 0:i[d],s=o[r][_];c&&s!==c.fg&&s!==c.bg&&(o[r][_]=c.fg)}return o},gi=(e,t,a)=>{if(e.length<2)return e;const o=e.slice(1);return o.push([...e[0]]),a==="SCREEN 2 (Graphics I)"&&t?Oe(o,t):o},Si=(e,t,a)=>{const l=e.length;if(l<2)return e;const o=e.slice(0,l-1);return o.unshift([...e[l-1]]),a==="SCREEN 2 (Graphics I)"&&t?Oe(o,t):o},Ai=(e,t,a)=>{if(e.length===0)return[];const l=e.map(o=>{if(o.length<2)return[...o];const n=o.slice(1);return n.push(o[0]),n});return a==="SCREEN 2 (Graphics I)"&&t?Oe(l,t):l},Ti=(e,t,a)=>{if(e.length===0)return[];const l=e.map(o=>{const n=o.length;if(n<2)return[...o];const i=o.slice(0,n-1);return i.unshift(o[n-1]),i});return a==="SCREEN 2 (Graphics I)"&&t?Oe(l,t):l},Ci=(e,t,a)=>{if(e.length===0)return[];const l=e.map(o=>[...o].reverse());return a==="SCREEN 2 (Graphics I)"&&t?Oe(l,t):l},Ii=(e,t,a)=>{if(e.length===0)return[];const l=[...e].reverse();return a==="SCREEN 2 (Graphics I)"&&t?Oe(l,t):l},Tt=e=>{var o,n,i;if(!e.lineAttributes)return null;const t=[],a=e.width/ae,l=e.height/ae;for(let r=0;r<l;r++)for(let _=0;_<a;_++)for(let d=0;d<ae;d++){const c=r*ae+d;let s=ze<<4|Ve;const p=(o=e.lineAttributes[c])==null?void 0:o[_];if(p){const m=((n=rt.get(p.fg))==null?void 0:n.index)??ze,u=((i=rt.get(p.bg))==null?void 0:i.index)??Ve;s=m<<4|u}t.push(s)}return new Uint8Array(t)},vi=e=>{const t=[];e.frames.forEach(l=>{var o,n,i,r,_;for(let d=0;d<e.spritePalette.length;d++){const c=e.spritePalette[d];if(c===e.backgroundColor)continue;let s=!1;const p=[],m=e.size.width,u=e.size.height;if(m===16&&u===16){for(let h=0;h<8;h++){let y=0;for(let b=0;b<8;b++)((o=l.data[h])==null?void 0:o[b])===c&&(y|=1<<7-b,s=!0);p.push(y)}for(let h=8;h<16;h++){let y=0;for(let b=0;b<8;b++)((n=l.data[h])==null?void 0:n[b])===c&&(y|=1<<7-b,s=!0);p.push(y)}for(let h=0;h<8;h++){let y=0;for(let b=0;b<8;b++)((i=l.data[h])==null?void 0:i[8+b])===c&&(y|=1<<7-b,s=!0);p.push(y)}for(let h=8;h<16;h++){let y=0;for(let b=0;b<8;b++)((r=l.data[h])==null?void 0:r[8+b])===c&&(y|=1<<7-b,s=!0);p.push(y)}}else for(let h=0;h<u;h++)for(let y=0;y<Math.ceil(m/8);y++){let b=0;for(let E=0;E<8;E++){const w=y*8+E;w<m&&((_=l.data[h])==null?void 0:_[w])===c&&(b|=1<<7-E,s=!0)}p.push(b)}s&&t.push(p)}});const a=t.flat();return new Uint8Array(a)},ea=e=>e.map(t=>[...t].reverse()),ta=e=>[...e].reverse(),tl=/_(left|right|up|down)$/i,ka=e=>{if(!e)return;const t=e.trim().toLowerCase();if(t==="left"||t==="right"||t==="up"||t==="down")return t},al=e=>{const t=e.match(tl);return t?{baseName:e.slice(0,-t[0].length),suffixDirection:ka(t[1])}:{baseName:e}},ll=(e,t,a,l)=>({...e,id:`${e.id}__auto_${a}`,name:t,facingDirection:a,frames:e.frames.map((o,n)=>({...o,id:`${o.id||`f${n}`}_${a}_auto`,data:l(o.data)}))}),mt=(e,t,a,l)=>{if(!t)return;(t===t.toLowerCase()?[t]:[t,t.toLowerCase()]).forEach(n=>{const i=e[n];if(i===void 0){e[n]=a;return}i!==a&&l.push(`Name alias collision for "${n}" between indexes ${i} and ${a}. Keeping first mapping.`)})},vt=e=>{const t=[],a=new Set,l=[],o=new Map,n=(s,p,m)=>{if(!a.has(s))return s;if(!a.has(p))return t.push(`Name "${s}" already exists. Using fallback "${p}" for ${m}.`),p;let u=1,h=`${s}_${u}`;for(;a.has(h);)u+=1,h=`${s}_${u}`;return t.push(`Name "${s}" already exists. Using "${h}" for ${m}.`),h};e.forEach((s,p)=>{const m=s.name||`sprite_${p}`,{baseName:u,suffixDirection:h}=al(m),y=ka(s.facingDirection);y&&h&&y!==h&&t.push(`Sprite "${m}" has suffix "${h}" but facing "${y}". Using facing direction.`);const b=y||h,E=h?u:m,w=b?`${E}_${b}`:m,v=n(w,m,`sprite "${m}"`),f=new Set;m!==v&&f.add(m);const g={sprite:{...s,name:v,facingDirection:b||s.facingDirection},baseName:E,direction:b,aliases:f};if(l.push(g),a.add(v),b){const S=o.get(E)||{};S[b]===void 0?(S[b]=l.length-1,o.set(E,S)):t.push(`Duplicate directional sprite for "${E}_${b}". Keeping first occurrence.`)}}),o.forEach((s,p)=>{const m=(u,h,y,b)=>{if(h===void 0||s[u]!==void 0)return;const E=`${p}_${u}`;if(a.has(E)){t.push(`Cannot auto-generate "${E}" because the name already exists.`);return}const w=l[h],f={sprite:ll(w.sprite,E,u,y),baseName:p,direction:u,aliases:new Set};l.push(f),s[u]=l.length-1,a.add(E),t.push(`Auto-generated "${E}" from "${w.sprite.name}" using ${b}.`)};s.right!==void 0&&s.left===void 0?m("left",s.right,ea,"horizontal mirror"):s.left!==void 0&&s.right===void 0&&m("right",s.left,ea,"horizontal mirror"),s.up!==void 0&&s.down===void 0?m("down",s.up,ta,"vertical mirror"):s.down!==void 0&&s.up===void 0&&m("up",s.down,ta,"vertical mirror")});const i={};l.forEach((s,p)=>{mt(i,s.sprite.name,p,t),mt(i,s.sprite.id,p,t)}),l.forEach((s,p)=>{s.aliases.forEach(m=>mt(i,m,p,t))});const r=l.map((s,p)=>p),_=l.map((s,p)=>p),d=l.map((s,p)=>p),c=l.map((s,p)=>p);return l.forEach((s,p)=>{const m=o.get(s.baseName);m&&(m.left!==void 0&&(r[p]=m.left),m.right!==void 0&&(_[p]=m.right),m.up!==void 0&&(d[p]=m.up),m.down!==void 0&&(c[p]=m.down))}),{sprites:l.map(s=>s.sprite),nameToIndex:i,directionalLookupTables:{left:r,right:_,up:d,down:c},warnings:t}},ol=e=>{let t=e.toString(16).toUpperCase();return t.length===1&&(t="0"+t),t},nl=(e,t,a,l,o,n,i="hex",r)=>{var m,u,h,y,b;const d=e.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let c=`;; ---- Sprite Frame: ${e} ----
`;c+=`;; Size: ${o}x${n}
`;let s=0;const p=Array.isArray(r)&&r.length>0?r:a.map((E,w)=>w).filter(E=>{const w=a[E];return!!w&&w!==l});for(const E of p){const w=a[E];if(!w||w===l)continue;const v=[];if(o===16&&n===16){for(let f=0;f<8;f++){let A=0;for(let g=0;g<8;g++){const S=g;((m=t[f])==null?void 0:m[S])===w&&(A|=1<<7-g)}v.push(A)}for(let f=8;f<16;f++){let A=0;for(let g=0;g<8;g++){const S=g;((u=t[f])==null?void 0:u[S])===w&&(A|=1<<7-g)}v.push(A)}for(let f=0;f<8;f++){let A=0;for(let g=0;g<8;g++){const S=8+g;((h=t[f])==null?void 0:h[S])===w&&(A|=1<<7-g)}v.push(A)}for(let f=8;f<16;f++){let A=0;for(let g=0;g<8;g++){const S=8+g;((y=t[f])==null?void 0:y[S])===w&&(A|=1<<7-g)}v.push(A)}}else for(let f=0;f<n;f++)for(let A=0;A<Math.ceil(o/8);A++){let g=0;for(let S=0;S<8;S++){const C=A*8+S;C<o&&((b=t[f])==null?void 0:b[C])===w&&(g|=1<<7-S)}v.push(g)}s+=1,c+=`${d}_LAYER${E}: ; Brush Color Index ${E} (Actual Color: ${w})
`,o%8!==0&&(c+=`;; WARNING: Sprite width ${o} is not a multiple of 8. Bitmask generation might be problematic for standard VDP.
`);for(let f=0;f<v.length;f+=16){const g=v.slice(f,f+16).map(S=>i==="hex"?`#${ol(S)}`:S.toString());c+=`    DB ${g.join(",")}
`}c+=`
`}return s===0&&(c+=`;; NO DRAWABLE LAYERS EXPORTED for ${e} - Palette may match background color.
`),c+=`;; ---- End of Frame: ${e} ----

`,c},rl=(e,t="hex",a)=>{let l=`;; Sprite: ${e.name}
`;l+=`;; Total Frames: ${e.frames.length}
`,l+=`;; Size: ${e.size.width}x${e.size.height}
`,l+=`;; Background Color (not exported as a layer): ${e.backgroundColor}
`,l+=`;; Drawable Palette (Hex): C0=${e.spritePalette[0]}, C1=${e.spritePalette[1]}, C2=${e.spritePalette[2]}, C3=${e.spritePalette[3]}

`;const o=a!==void 0?`_${a}`:"",n=e.name+o,i=n.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();l+=`SPRITE_${i}_WIDTH     EQU ${e.size.width}
`,l+=`SPRITE_${i}_HEIGHT    EQU ${e.size.height}
`,l+=`SPRITE_${i}_FRAMES    EQU ${e.frames.length}

`;const r=e.spritePalette.map((_,d)=>d).filter(_=>{const d=e.spritePalette[_];return!d||d===e.backgroundColor?!1:e.frames.some(c=>{var s;return(s=c==null?void 0:c.data)==null?void 0:s.some(p=>p==null?void 0:p.some(m=>m===d))})});return e.frames.forEach((_,d)=>{l+=nl(`${n}_F${d}`,_.data,e.spritePalette,e.backgroundColor,e.size.width,e.size.height,t,r)}),l},bt=16,Pa="SCREEN 2 (Graphics I)",il="SCREEN 5 (Graphics III)",Ie=8,sl={pixelWidth:De*bt,pixelHeight:nt*bt,widthTiles:De,heightTiles:nt,baseTileSize:bt},aa={[Pa]:{pixelWidth:De*Fe,pixelHeight:nt*Fe,widthTiles:De,heightTiles:nt,baseTileSize:Fe},[il]:{pixelWidth:256,pixelHeight:212,widthTiles:32,heightTiles:27,baseTileSize:Fe},"SCREEN 0 (Text 40)":{pixelWidth:240,pixelHeight:192,widthTiles:40,heightTiles:24,baseTileSize:Ie},"SCREEN 1 (Text 32)":{pixelWidth:256,pixelHeight:192,widthTiles:32,heightTiles:24,baseTileSize:Ie},"SCREEN 3 (Multicolor)":{pixelWidth:256,pixelHeight:192,widthTiles:32,heightTiles:24,baseTileSize:Ie},"SCREEN 4 (Graphics II)":{pixelWidth:256,pixelHeight:192,widthTiles:32,heightTiles:24,baseTileSize:Ie},"SCREEN 6 (Graphics IV)":{pixelWidth:512,pixelHeight:212,widthTiles:64,heightTiles:27,baseTileSize:Ie},"SCREEN 7 (Graphics V)":{pixelWidth:512,pixelHeight:212,widthTiles:64,heightTiles:27,baseTileSize:Ie},"SCREEN 8 (Graphics VI)":{pixelWidth:256,pixelHeight:212,widthTiles:32,heightTiles:27,baseTileSize:Ie}};function wi(e){const t=typeof e=="string"?e.trim():"";return t&&aa[t]?aa[t]:sl}const it=e=>e===Pa,dl=e=>it(e)?oe:He,cl=(e,t)=>{const a=dl(t);if(e===void 0||e<0||e>=a.length)return it(t)?oe[1].hex:He[4].hex;const l=a[e];return(l==null?void 0:l.hex)??(it(t)?oe[1].hex:He[4].hex)},_l=(e,t,a,l)=>{var p;const o=e.layers.background,n=e.activeAreaX??0,i=e.activeAreaY??0,r=e.activeAreaWidth??e.width,_=e.activeAreaHeight??e.height,d=[];let c=0;const s=new Map;for(let m=0;m<_;m++){const u=i+m;for(let h=0;h<r;h++){const y=n+h;if(u>=o.length||y>=((p=o[u])==null?void 0:p.length)){d.push(Ae);continue}const b=o[u][y];if(!b||!b.tileId)d.push(Ae);else{let E=Ae;const w=t.find(v=>v.id===b.tileId);if(l==="SCREEN 2 (Graphics I)"&&a){let v=!1,f={tileId:b.tileId,position:{x:y,y:u},attempts:[],banksReceived:a.length};typeof globalThis.screenUtils_firstTileLogged>"u"&&(console.log("🔍 First tile structure check:",{tileId:b.tileId,position:{x:y,y:u},banksCount:a.length,banks:a.map(A=>({name:A.name,assignedTileIds:Object.keys(A.assignedTiles||{}),hasThisTile:!!(A.assignedTiles&&A.assignedTiles[b.tileId]),assignedTilesType:typeof A.assignedTiles,assignedTilesSample:A.assignedTiles?Object.entries(A.assignedTiles).slice(0,2):[]}))}),globalThis.screenUtils_firstTileLogged=!0);for(const A of a)if((A.enabled??!0)&&A.assignedTiles[b.tileId]){const g=A.assignedTiles[b.tileId],S=b.subTileX||0,C=b.subTileY||0;if(w){const M=g.charCode,L=Math.ceil(w.width/Fe);E=M+C*L+S}else if(Array.isArray(g.fontCharacters)){const M=g.fontCharacters[S];E=(M==null?void 0:M.bankCharCode)??Ae}else E=Ae;const x=E>=A.charsetRangeStart&&E<=A.charsetRangeEnd;if(f.attempts.push({bankName:A.name,calculated:E,range:`${A.charsetRangeStart}-${A.charsetRangeEnd}`,inRange:x}),x){v=!0;break}else E=Ae}else f.attempts.push({bankName:A.name,reason:"Tile not assigned to this bank"});v||(console.warn("⚠️ Tile not found in valid range:",f),E=Ae)}else if(l!=="SCREEN 2 (Graphics I)"){const v=`${b.tileId}_${b.subTileX??0}_${b.subTileY??0}`;s.has(v)?E=s.get(v):c>255?E=Ae:(s.set(v,c),E=c++)}d.push(E)}}}return new Uint8Array(d)},pl=(e,t,a,l,o,n="hex")=>{const r=e.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let _=`;; MAP: ${e} (${t}x${a} tiles)
`;_+=`;; Total size: ${l.length} bytes

`,o.length>0&&(_+=`;; --- TILE INDEX REFERENCES for ${r} ---
`,_+=o.join(`
`)+`

`),_+=`SCREEN_${r}_WIDTH     EQU ${t}
`,_+=`SCREEN_${r}_HEIGHT    EQU ${a}
`,_+=`SCREEN_${r}_SIZE      EQU ${l.length}

`,_+=`SCREEN_${r}_LAYOUT:
`;for(let d=0;d<l.length;d+=16){const s=l.slice(d,d+16).map(p=>n==="hex"?`#${p.toString(16).padStart(2,"0").toUpperCase()}`:p.toString());_+=`    DB ${s.join(",")}
`}return _},hl=(e,t,a,l,o="hex")=>{const i=e.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let r=`;; BEHAVIOR MAP: ${e} (${t}x${a} tiles)
`;r+=`;; Total size: ${l.length} bytes (Map IDs 0-255)
`,r+=`;; Data format: ${o.toUpperCase()}

`,r+=`BEHAVIOR_${i}_WIDTH     EQU ${t}
`,r+=`BEHAVIOR_${i}_HEIGHT    EQU ${a}
`,r+=`BEHAVIOR_${i}_SIZE      EQU ${l.length}

`,r+=`BEHAVIOR_${i}_DATA:
`;const _=d=>o==="hex"?`#${d.toString(16).padStart(2,"0").toUpperCase()}`:d.toString(10);for(let d=0;d<l.length;d+=16){const s=l.slice(d,d+16).map(_);r+=`    DB ${s.join(",")}
`}return r+=`
;; End of Behavior Map Data for ${e}
`,r},Di=(e,t)=>{if(e.width!==t.width||e.height!==t.height||e.data.length!==t.data.length)return!1;for(let a=0;a<e.height;a++){if(e.data[a].length!==t.data[a].length)return!1;for(let l=0;l<e.width;l++)if(e.data[a][l]!==t.data[a][l])return!1}if(e.lineAttributes&&t.lineAttributes){if(e.lineAttributes.length!==t.lineAttributes.length)return!1;for(let a=0;a<e.lineAttributes.length;a++){if(e.lineAttributes[a].length!==t.lineAttributes[a].length)return!1;for(let l=0;l<e.lineAttributes[a].length;l++)if(e.lineAttributes[a][l].fg!==t.lineAttributes[a][l].fg||e.lineAttributes[a][l].bg!==t.lineAttributes[a][l].bg)return!1}}else if(e.lineAttributes!==t.lineAttributes)return!1;return JSON.stringify(e.logicalProperties)===JSON.stringify(t.logicalProperties)};function Ri(e,t,a,l,o,n,i){const{data:r,width:_,height:d,lineAttributes:c}=e;if(!r||d===0||_===0)return"";const s=document.createElement("canvas");s.width=n,s.height=n;const p=s.getContext("2d");if(!p)return"";p.imageSmoothingEnabled=!1;const m=(t??0)*n,u=(a??0)*n;for(let b=0;b<n;b++)for(let E=0;E<n;E++){const w=m+E,v=u+b;if(v>=0&&v<d&&w>=0&&w<_){let f=r[v][w];if(i==="SCREEN 2 (Graphics I)"&&c&&c[v]){const A=Math.floor(w/ct),g=c[v][A];g&&f!==g.fg&&f!==g.bg&&(f=g.fg)}p.fillStyle=f,p.fillRect(E,b,1,1)}}if(s.width===l&&s.height===o)return s.toDataURL();const h=document.createElement("canvas");h.width=l,h.height=o;const y=h.getContext("2d");return y?(y.imageSmoothingEnabled=!1,y.drawImage(s,0,0,l,o),h.toDataURL()):s.toDataURL()}function Li(e,t,a){var n;if(!e||a===0||t===0)return"";const l=document.createElement("canvas");l.width=t,l.height=a;const o=l.getContext("2d");if(!o)return"";o.imageSmoothingEnabled=!1;for(let i=0;i<a;i++)for(let r=0;r<t;r++){const _=(n=e[i])==null?void 0:n[r];_&&_!=="rgba(0,0,0,0)"&&(o.fillStyle=_,o.fillRect(r,i,1,1))}return l.toDataURL()}const Ni=(e,t,a,l,o,n,i)=>{var s,p;const r=it(l);e.width=t.width*o,e.height=t.height*o;const _=e.getContext("2d");if(!_)return;_.imageSmoothingEnabled=!1;const d=cl(t.backgroundColor,l);_.fillStyle=d,_.fillRect(0,0,e.width,e.height);const c=t.layers.background;for(let m=0;m<t.height;m++)for(let u=0;u<t.width;u++){const h=(s=c[m])==null?void 0:s[u];if(!(h!=null&&h.tileId))continue;const y=a.find(C=>C.id===h.tileId);if(!y)continue;const{data:b,width:E,height:w,lineAttributes:v}=y;if(!b)continue;const f=h.subTileX??0,A=h.subTileY??0,g=f*o,S=A*o;for(let C=0;C<o;C++)for(let x=0;x<o;x++){const M=g+x,L=S+C;if(L<w&&M<E){let D=(p=b[L])==null?void 0:p[M];if(D===void 0)continue;if(r&&v&&v[L]){const R=Math.floor(M/ct),k=v[L][R];k&&D!==k.fg&&D!==k.bg&&(D=k.fg)}_.fillStyle=D,_.fillRect(u*o+x,m*o+C,1,1)}}}};function ce(e){const t=typeof e=="string"?e.trim():"";if(!t)return"";const a=ot.find(l=>l.name.toLowerCase()===t.toLowerCase());return a?a.name:t}function Be(e){return`global_var_${ce(e).replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`}function je(e){return`${ce(e).replace(/[^A-Za-z0-9]/g,"_").toUpperCase()}_`}function ul(e){const t=e.find(i=>i.type==="globalvariables");if(!t||!t.data)return[...ot];const a=t.data.customVariables||[],l=new Map;ot.forEach(i=>{const r=ce(i.name);l.set(r,{...i,name:r})}),a.forEach(i=>{const r=ce(i.name);r&&l.set(r,{...i,name:r,asmName:Be(r),constantPrefix:i.constantPrefix||je(r)})});const o=ot.map(i=>ce(i.name)),n=[];return o.forEach(i=>{const r=l.get(i);r&&(n.push(r),l.delete(i))}),l.forEach(i=>{n.push(i)}),n}function xi(e){const t=e.find(o=>o.type==="globalvariables");if(!t||!t.data)return[];const a=t.data.customVariables||[],l=new Map;return a.forEach(o=>{const n=ce(o.name);n&&l.set(n,{...o,name:n,asmName:Be(n),constantPrefix:o.constantPrefix||je(n)})}),Array.from(l.values())}function ml(e){const t=ul(e);if(t.length===0)return[];const a=[],l=e.filter(u=>u.type==="screenmap");l.forEach(u=>{var y,b;(((b=(y=u.data)==null?void 0:y.layers)==null?void 0:b.entities)||[]).forEach(E=>{var w,v;(v=(w=E.components)==null?void 0:w.Behavior)!=null&&v.behaviorCode&&a.push(E.components.Behavior.behaviorCode)})});const o=e.find(u=>u.type==="gameflow"),n=new Set,i=new Set,r=new Set,_=new Set;if(o!=null&&o.data){const u=o.data;u.nodes&&Array.isArray(u.nodes)&&u.nodes.forEach(h=>{var y;if(h.type==="StateMachine"&&((y=h.data)!=null&&y.customCode)&&a.push(h.data.customCode),h.type==="IfThenElse"&&h.variableName){const b=ce(h.variableName);b&&n.add(b)}h.type==="Globals"&&h.variables&&Array.isArray(h.variables)&&h.variables.forEach(b=>{if(b.variableName){const E=ce(b.variableName);E&&i.add(E)}})})}e.filter(u=>u.type==="componentdefinition").forEach(u=>{const h=u.data;h.customCode&&a.push(h.customCode)});const c=u=>{if(typeof u!="string")return;const h=ce(u);h&&r.add(h)};l.forEach(u=>{var b,E,w,v;(((E=(b=u.data)==null?void 0:b.layers)==null?void 0:E.entities)||[]).forEach(f=>{var A,g;c((g=(A=f==null?void 0:f.componentOverrides)==null?void 0:A.comp_tile_collector)==null?void 0:g.targetVariable)}),(((v=(w=u.data)==null?void 0:w.hudConfiguration)==null?void 0:v.elements)||[]).forEach(f=>{const A=String((f==null?void 0:f.type)||"").toLowerCase();A==="score"?_.add(ce("Score")):A==="lives"&&_.add(ce("Lives"))})}),e.filter(u=>u.type==="entitytemplate").forEach(u=>{var b,E;const h=u.data,y=(b=h==null?void 0:h.components)==null?void 0:b.find(w=>w.definitionId==="comp_tile_collector");c((E=y==null?void 0:y.defaultValues)==null?void 0:E.targetVariable)});const p=[],m=new Set;return t.forEach(u=>{const h=ce(u.name),y=a.some(f=>new RegExp(`\\b${u.asmName}\\b`,"i").test(f)),b=n.has(h),E=i.has(h),w=r.has(h),v=_.has(h);(y||b||E||w||v)&&!m.has(h)&&(p.push(u),m.add(h))}),i.forEach(u=>{const h=ce(u);if(!m.has(h)){const y=Be(h);p.push({name:h,asmName:y,constantPrefix:je(h),type:"8bit",description:"Auto-generated variable from Globals node",values:[{label:"0",value:0}],category:"special"}),m.add(h)}}),n.forEach(u=>{const h=ce(u);if(!m.has(h)){const y=Be(h);p.push({name:h,asmName:y,constantPrefix:je(h),type:"8bit",description:"Auto-generated variable from IfThenElse node",values:[{label:"0",value:0}],category:"special"}),m.add(h)}}),r.forEach(u=>{const h=ce(u);if(!m.has(h)){const y=Be(h);p.push({name:h,asmName:y,constantPrefix:je(h),type:"8bit",description:"Auto-generated variable from Tile Collector",values:[{label:"0",value:0}],category:"special"}),m.add(h)}}),p}const F={AND:"AND",OR:"OR",XOR:"XOR",NOT:"NOT",KEY_PRESSED:"KEY_PRESSED",KEY_RELEASED:"KEY_RELEASED",TIME_OUT:"TIME_OUT",CAN_MOVE_DIRECTION:"CAN_MOVE_DIRECTION",HAS_COLLISION:"HAS_COLLISION",PATH_CLEAR:"PATH_CLEAR",ON_WALL_COLLISION:"ON_WALL_COLLISION",HAS_DEADLY_TILE_COLLISION:"HAS_DEADLY_TILE_COLLISION",ANIMATION_COMPLETE:"ANIMATION_COMPLETE",KEY_AND_MOVEMENT:"KEY_AND_MOVEMENT",VARIABLE_COMPARE:"VARIABLE_COMPARE"},I={NONE:"NONE",SET_POSITION:"SET_POSITION",MOVE_BY:"MOVE_BY",SET_VELOCITY:"SET_VELOCITY",APPLY_FORCE:"APPLY_FORCE",CHANGE_SPRITE:"CHANGE_SPRITE",PLAY_ANIMATION:"PLAY_ANIMATION",SET_ANIMATION_SPEED:"SET_ANIMATION_SPEED",TOGGLE_ANIMATION:"TOGGLE_ANIMATION",PLAY_SOUND:"PLAY_SOUND",PLAY_MUSIC:"PLAY_MUSIC",MUTE_MUSIC:"MUTE_MUSIC",STOP_MUSIC:"STOP_MUSIC",SET_VARIABLE:"SET_VARIABLE",INCREMENT_VARIABLE:"INCREMENT_VARIABLE",DECREMENT_VARIABLE:"DECREMENT_VARIABLE",SET_COMPONENT_PROPERTY:"SET_COMPONENT_PROPERTY",WAIT:"WAIT",GOTO_STATE:"GOTO_STATE",DESTROY_ENTITY:"DESTROY_ENTITY",SPAWN_ENTITY:"SPAWN_ENTITY",GET_RANDOM_ENTITY_POSITION:"GET_RANDOM_ENTITY_POSITION",CHANGE_GAME_FLOW_NODE:"CHANGE_GAME_FLOW_NODE",REGENERATE_HUD:"REGENERATE_HUD",CLEAN_SPRITES:"CLEAN_SPRITES",EXIT_CURRENT_WORLD:"EXIT_CURRENT_WORLD",DECREASE_LIVES:"DECREASE_LIVES",INCREASE_LIVES:"INCREASE_LIVES",RESPAWN_PLAYER:"RESPAWN_PLAYER",BREAK_TILE:"BREAK_TILE",REPLACE_TILE:"REPLACE_TILE",RND:"RND",POINT_AT:"POINT_AT",ADD_VARIABLES:"ADD_VARIABLES",SUBTRACT_VARIABLES:"SUBTRACT_VARIABLES",MULTIPLY_VARIABLES:"MULTIPLY_VARIABLES",DIVIDE_VARIABLES:"DIVIDE_VARIABLES",MODULO_VARIABLES:"MODULO_VARIABLES",ASSIGN_VARIABLE:"ASSIGN_VARIABLE",DISABLE_INPUT:"DISABLE_INPUT",ENABLE_INPUT:"ENABLE_INPUT"};function wt(e,t){const a=t.filter(T=>T.type==="componentdefinition").map(T=>T.data),l=t.filter(T=>T.type==="entitytemplate").map(T=>T.data),o=t.filter(T=>T.type==="sprite").map(T=>T.data),n=t.filter(T=>T.type==="sound").map(T=>{var $,U;return{...T.data,id:(($=T.data)==null?void 0:$.id)||T.id,name:((U=T.data)==null?void 0:U.name)||T.name}}),i=[],r={};t.filter(T=>T.type==="track").forEach(T=>{const $=T.data;if(!$)return;const U=$.soundChip||"PSG";if(U!=="PSG")return;const G={...$,soundChip:U,id:$.id||T.id,name:$.name||T.name},J=i.length;i.push(G),r[T.id]=J,r[G.id]=J});const _=t.filter(T=>T.type==="tile").map(T=>T.data),d=t.filter(T=>T.type==="tilebank").map(T=>T.data),c=t.filter(T=>T.type==="screenmap").map(T=>T.data),s=t.filter(T=>T.type==="worldmap").map(T=>T.data),p=t.filter(T=>T.type==="statemachine").map(T=>T.data),m=[],u=new Set,h=(T,$,U)=>{var W,te;if(T!=null&&T.id)return String(T.id);const G=((W=T==null?void 0:T.position)==null?void 0:W.x)??"",J=((te=T==null?void 0:T.position)==null?void 0:te.y)??"",ue=(T==null?void 0:T.entityTemplateId)??"",Q=(T==null?void 0:T.name)??"";return`${($==null?void 0:$.id)??`screen_${U}`}|${ue}|${Q}|${G}|${J}`},y=(T,$,U)=>{if(!T||typeof T!="object")return;const G=h(T,$,U);u.has(G)||(u.add(G),m.push({...T,screenAssetId:T.screenAssetId||($==null?void 0:$.id),screenIndex:typeof T.screenIndex=="number"?T.screenIndex:U}))};c.forEach((T,$)=>{var U;(U=T.layers)!=null&&U.entities&&Array.isArray(T.layers.entities)&&T.layers.entities.forEach(G=>y(G,T,$)),T.entities&&Array.isArray(T.entities)&&T.entities.forEach(G=>y(G,T,$))});const b=t.find(T=>T.type==="gameflow"),E=b==null?void 0:b.data,w=m.length>0,v=a.length>0||w,f=c.length>1,A=o.length>0,g=_.length>0,S=c.length>0,C=a.length>0,x=!!E,M=t.some(T=>T.type==="font"),L=o.some(T=>T.frames.length>1),D=c.some(T=>T.layers.collision.some($=>$.some(U=>U!==null))),R=l.some(T=>T.name.toLowerCase().includes("menu")),k=[];a.forEach(T=>{T.name.toLowerCase().includes("state")&&k.push(T.name.replace(/[^a-zA-Z0-9]/g,"").toUpperCase())});const P=ml(t);return{projectName:e,components:a,templates:l,sprites:o,sounds:n,tracks:i,trackIndexByAssetId:r,tiles:_,tileBanks:d,screenMaps:c,screens:c,worldmaps:s,entities:m,fonts:t.filter(T=>T.type==="font"),gameFlow:E,stateMachines:p,hasECS:v,hasMultipleScreens:f,hasSprites:A,hasTiles:g,hasScreens:S,hasEntities:w,hasComponents:C,hasGameFlow:x,hasMenus:R,hasFonts:M,hasAnimations:L,hasCollisions:D,hasMenuSystem:R,customStates:k,globalVariables:P}}const bl=e=>{if(!e.hasECS)return`    ; No ECS system - basic entity updates
    RET`;let t=`    ; ECS-based entity updates
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
    
    ; Update entity based on components`;return e.components.forEach((a,l)=>{t+=`
    ; Update ${a.name} component
    CALL UPDATE_${a.name.toUpperCase().replace(/[^A-Z0-9]/g,"_")}`}),t+=`
    
entity_update_skip:
    POP HL
    LD DE, 16           ; Entity structure size
    ADD HL, DE
    POP BC
    DJNZ entity_update_loop
    RET`,t},fl=e=>{if(!e.hasSprites)return`    ; No sprites to update
    RET`;let t=`    ; Update sprite animations and positions
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
    
sprite_no_frame_advance:`;return e.hasAnimations&&(t+=`
    ; Update sprite position based on movement component
    INC HL
    INC HL
    INC HL
    LD A, (HL)          ; X position
    INC HL  
    LD B, (HL)          ; Y position
    ; Apply movement logic here
    ; CALL APPLY_SPRITE_MOVEMENT`),t+=`
    
    POP HL
    LD DE, 8            ; Sprite data structure size
    ADD HL, DE
    POP BC
    DJNZ sprite_update_loop
    RET`,t},yl=e=>e.hasCollisions?`    ; Check player collision with environment
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
    RET`,El=e=>{let t=`    ; Read MSX joystick/keyboard input
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
    
input_no_fire1:`;return e.hasMenuSystem&&(t+=`
    ; Check for pause/menu button (Space)
    LD A, 6             ; Row 6
    CALL SNSMAT
    BIT 0, A            ; Space key
    JR NZ, input_no_pause
    LD A, (input_state)
    SET INPUT_BIT_PAUSE, A
    LD (input_state), A
    
input_no_pause:`),t+=`
    RET`,t},gl=e=>e.hasMenuSystem?`    ; Update menu graphics and cursor
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
    RET`,Sl=e=>{if(e.customStates.length===0)return"; No custom states detected";let t=`; Custom state handlers for project-specific logic
`;return e.customStates.forEach(a=>{t+=`
logic_${a.toLowerCase()}:
    ; Custom logic for ${a} state
    ; TODO: Implement ${a} specific logic
    RET
`}),t},Al=[{marker:"{{ENTITY_UPDATES}}",generator:bl,description:"Entity update system based on ECS components"},{marker:"{{SPRITE_UPDATES}}",generator:fl,description:"Sprite animation and movement updates"},{marker:"{{COLLISION_CHECK}}",generator:yl,description:"Collision detection system"},{marker:"{{INPUT_HANDLING}}",generator:El,description:"Input handling with project-specific controls"},{marker:"{{MENU_SYSTEM}}",generator:gl,description:"Menu system updates and rendering"},{marker:"{{CUSTOM_STATES}}",generator:Sl,description:"Custom state handlers detected from project"}];function Tl(e,t,a,l=Al){const o=wt(t,a);let n=e;return n=n.replace(/{{PROJECT_NAME}}/g,t.toUpperCase()),n=n.replace(/{{PROJECT_NAME_LOWER}}/g,t.toLowerCase()),n=n.replace(/{{GENERATION_DATE}}/g,new Date().toISOString()),l.forEach(i=>{if(n.includes(i.marker)){const r=i.generator(o);n=n.replace(new RegExp(Il(i.marker),"g"),r)}}),n}function Cl(){return`;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
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
`}function Il(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function Mi(e,t){const a=Cl(),l=Tl(a,e,t),n=`${e.toLowerCase().replace(/[^a-z0-9]/g,"_")}_dynamic_system.asm`,i=wt(e,t);return{filename:n,content:l,analysis:i}}function Le(e,t,a){if(!(!a||a.length===0)){e.push(`;   ${t}:`);for(const l of a)e.push(`;     - ${l}`)}}function Y(e){const t=[];return t.push("; Register Contract:"),e.purpose&&t.push(`;   Purpose: ${e.purpose}`),Le(t,"Inputs",e.inputs),Le(t,"Outputs",e.outputs),Le(t,"Clobbers",e.clobbers),Le(t,"Preserved",e.preserved),Le(t,"Register roles",e.usage),Le(t,"Notes",e.notes),`${t.join(`
`)}
`}function vl(e={mode:"hybrid"}){const{mode:t,optimizeLevel:a="safe",includeDebug:l=!1}=e;let o=`; ==================================================================
; DIRECT HARDWARE ACCESS ROUTINES
; ==================================================================
; Mode: ${t.toUpperCase()}
; Optimize Level: ${a}
; Debug: ${l?"ENABLED":"DISABLED"}
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

`;return o+=wl(),o+=Rl(),o+=Ll(),o+=Nl(),o+=xl(),o+=Ml(),o+=kl(),a==="aggressive"&&(o+=Dl(),o+=Pl()),l&&(o+=Ol()),o+=`
; ==================================================================
; END OF DIRECT HARDWARE ROUTINES
; ==================================================================
`,o}function wl(){return`
; ==================================================================
; FAST_LDIRVM - Fast Block Transfer to VRAM
; ==================================================================
${Y({purpose:"Block copy from RAM to VRAM using VDP data port auto-increment.",inputs:["HL = source address (RAM)","DE = destination address (VRAM)","BC = byte count"],outputs:["None"],clobbers:["AF","BC","HL"],preserved:["DE"],usage:["A = VDP address bytes and data byte being transferred","HL = RAM read pointer (increments each byte)","DE = only used to program initial VRAM address","BC = countdown loop counter"],notes:["Caller must preserve AF/BC/HL if needed after call."]})}
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
    ; Preserve previous IRQ state (LD A,I copies IFF2 into P/V)
    ld a, i
    push af
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

    ; Restore previous IRQ state
    pop af
    ret po                 ; P/V=0 => IRQs were disabled on entry
    ei
    ret

`}function Dl(){return`
; ==================================================================
; FAST_LDIRVM_256 - Optimized for exactly 256 bytes
; ==================================================================
${Y({purpose:"Fixed-size 256-byte transfer from RAM to VRAM using DJNZ.",inputs:["HL = source address (RAM)","DE = destination address (VRAM)"],outputs:["None"],clobbers:["AF","B","HL"],preserved:["C","DE"],usage:["A = VDP address bytes and transferred byte","B = DJNZ counter (0 means 256 iterations)","HL = RAM read pointer","DE = only used to set initial VRAM address"],notes:["Use only when exactly 256 bytes must be copied."]})}
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
    ; Preserve previous IRQ state (LD A,I copies IFF2 into P/V)
    ld a, i
    push af
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

    ; Restore previous IRQ state
    pop af
    ret po                 ; P/V=0 => IRQs were disabled on entry
    ei
    ret

`}function Rl(){return`
; ==================================================================
; FAST_WRTVRM - Write Single Byte to VRAM
; ==================================================================
${Y({purpose:"Write one byte into VRAM while preserving caller-visible state.",inputs:["A = byte to write","HL = VRAM destination address"],outputs:["None"],clobbers:["None (all registers preserved)"],preserved:["AF","BC","DE","HL"],usage:["A = temporarily saved/restored around VDP address programming","HL = VRAM address source (not modified)"],notes:["Safe helper when the caller cannot tolerate register changes."]})}
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
    ; Preserve caller-visible state and previous IRQ status.
    push bc
    ld c, a                ; C = input data byte
    push af                ; Save caller AF
    ld a, i
    push af                ; Save previous IFF2 in P/V
    di
    ld a, l
    out (#99), a           ; Address low (11 cycles)
    ld a, h
    or #40                 ; Write mode (7 cycles)
    out (#99), a           ; Address high + command (11 cycles)
    ld a, c
    out (#98), a           ; Write to VRAM (11 cycles)

    ; Restore previous IRQ state.
    pop af
    jp po, .fwv_no_ei      ; P/V=0 => IRQs were disabled on entry
    ei
.fwv_no_ei:
    pop af                 ; Restore caller AF
    pop bc
    ret

`}function Ll(){return`
; ==================================================================
; FAST_RDVRM - Read Single Byte from VRAM
; ==================================================================
${Y({purpose:"Read one byte from VRAM data port.",inputs:["HL = VRAM source address"],outputs:["A = byte read from VRAM"],clobbers:["AF"],preserved:["BC","DE","HL"],usage:["A = VDP addressing command then read result","HL = address source only (unchanged)"],notes:["Callers relying on flags must account for AF clobber."]})}
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

`}function Nl(){return`
; ==================================================================
; FAST_WRTVDP - Write VDP Register
; ==================================================================
${Y({purpose:"Write one VDP register value (value first, then register index).",inputs:["B = register value","C = register number"],outputs:["None"],clobbers:["AF"],preserved:["BC","DE","HL"],usage:["A = output staging register for both OUT operations","B/C = preserved input pair for value and register id"],notes:["Order of writes is mandatory for VDP register writes."]})}
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

`}function xl(){return`
; ==================================================================
; FAST_GTSTCK - Read Joystick Direction
; ==================================================================
${Y({purpose:"Read joystick direction and map PSG bits to MSX GTSTCK direction code.",inputs:["A = joystick port (0 or 1)"],outputs:["A = direction code (0-8)"],clobbers:["AF","HL"],preserved:["BC","DE"],usage:["A = PSG register selection, raw read, and final direction code","HL = lookup table pointer into joystick_direction_table"],notes:["Bits are active-low; routine inverts and masks input nibble."]})}
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

`}function Ml(){return`
; ==================================================================
; FAST_GTTRIG - Read Joystick Trigger
; ==================================================================
${Y({purpose:"Read joystick trigger bit directly from PSG register.",inputs:["A = joystick port (0 or 1)"],outputs:["A = #FF if pressed, #00 if released"],clobbers:["AF"],preserved:["BC","DE","HL"],usage:["A = register select, raw PSG read, and normalized return value"],notes:["Trigger is active-low in PSG bit 4."]})}
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

`}function kl(){return`
; ==================================================================
; FAST_SNSMAT - Sense Keyboard Matrix Row
; ==================================================================
${Y({purpose:"Select keyboard matrix row via PPI and return row state.",inputs:["A = matrix row (0-11)"],outputs:["A = row bits (active-low)"],clobbers:["AF","C"],preserved:["B","DE","HL"],usage:["A = row selector composition and final row read","C = cached low nibble used to build PPI port C output"],notes:["Upper nibble of current PPI port C is preserved."]})}
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

`}function Pl(){return`
; ==================================================================
; COPY_SPRITE_PATTERN_UNROLLED - Ultra-fast sprite pattern copy
; ==================================================================
${Y({purpose:"Copy fixed 32-byte sprite pattern to VRAM with unrolled writes.",inputs:["HL = source address (32-byte sprite pattern in RAM)","DE = destination VRAM address"],outputs:["None"],clobbers:["AF","HL"],preserved:["BC","DE"],usage:["A = VDP address bytes and each streamed pattern byte","HL = source pointer advanced 32 times","DE = initial VRAM destination programming only"],notes:["Optimized for speed at the cost of ROM size."]})}
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

`}function Ol(){return`
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

`}function Ul(e={}){const{hardwareMode:t}=e;let a=`; ==================================================================
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
`;return t&&(t.mode==="direct"||t.mode==="hybrid")?a+`
`+vl(t):a}function $l(e){let t="";if(!e.globalVariables||e.globalVariables.length===0)return t+=`; Goal Variable Values (default)
`,t+=`GOAL_FAILURE            EQU 0    ; Goal = "Failure"
`,t+=`GOAL_COMPLETED          EQU 1    ; Goal = "Completed"
`,t;const a=new Set;return e.globalVariables.forEach(l=>{l.values&&l.values.length>0&&(t+=`
; ${l.name} - ${l.description||"Variable values"}
`,l.values.forEach(o=>{const n=(o.asmConstant||"UNKNOWN").trim(),i=typeof o.value=="number"?o.value:0;a.has(n)||(t+=`${n.padEnd(24)}EQU ${i}    ; ${l.name} = "${o.label}"
`,a.add(n))}))}),t}function Fl(e){var a,l;const t=vt(e.sprites||[]).sprites.length;return`; ==================================================================
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

${$l(e)}

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
TOTAL_SPRITES           EQU ${t}
TOTAL_TILES             EQU ${((a=e.tiles)==null?void 0:a.length)||0}
TOTAL_SCREENS           EQU ${((l=e.screenMaps)==null?void 0:l.length)||0}

; ==================================================================
; END OF CONSTANTS
; ==================================================================
`}function Bl(e){let t=`; ==================================================================
; RAM VARIABLES DEFINITIONS
; File: variables.asm
; Description: Dynamic variable allocation using EQU addresses
; Generated based on project analysis
; ==================================================================

; ==================================================================
; CORE SYSTEM VARIABLES (ALWAYS PRESENT)
; ==================================================================
`,a=49152;t+=`input_state         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current direction state (0-8)
`,a++,t+=`prev_input_state    EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Previous direction state (0-8)
`,a++,t+=`input_btn_curr      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current input buttons bitmask (bit0=fire)
`,a++,t+=`input_btn_prev      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Previous input buttons bitmask (bit0=fire)
`,a++,t+=`input_fire          EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Fire button state (0=released, 1=pressed)
`,a++,t+=`current_flow_state  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current game flow state
`,a++,t+=`prev_flow_state     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Previous game flow state
`,a++,t+=`gameflow_exit_requested EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Exit flag for WorldLink loop
`,a++,t+=`gameflow_menu_selection EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current/last submenu selection
`,a++,t+=`gameflow_submenu_data_ptr EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Pointer to active submenu data (16-bit)
`,a+=2,t+=`gameflow_submenu_option_count EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Cached submenu option count
`,a++,t+=`gameflow_submenu_cursor_enabled EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; 1 when submenu uses sprite cursor
`,a++,t+=`gameflow_submenu_cursor_layer_count EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Cursor sprite layer count (1..4)
`,a++,t+=`gameflow_condition_result EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Result of last condition evaluation
`,a++,t+=`transition_delay_var    EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Frames per step for active transition effect
`,a++,t+=`
; ==================================================================
; MIDEAS GLOBAL VARIABLES (DEFAULTS + CUSTOM)
; ==================================================================
`,e.globalVariables&&e.globalVariables.length>0?e.globalVariables.forEach(i=>{const r=String(i.type||"").toLowerCase(),_=r==="16bit"||r==="word",d=_?2:1,c=_?" (16-bit)":" (8-bit)",s=i.description||i.name;t+=`${i.asmName.padEnd(20)} EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; ${s}${c}
`,a+=d}):(t+=`global_var_goal     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Goal status (0=Failure, 1=Completed)
`,a++),t+=`
; ==================================================================
; SYSTEM VARIABLES
; ==================================================================
`,t+=`ROM_slot            EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; ROM slot number (for SETPAGES32K)
`,a++,t+=`mapper_bank_p1_current EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Mapper current bank for page/window 1
`,a++,t+=`mapper_bank_p2_current EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Mapper current bank for page/window 2
`,a++,t+=`mapper_bank_p3_current EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Mapper current bank for page/window 3
`,a++,t+=`mapper_bank_p4_current EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Mapper current bank for page/window 4
`,a++,t+=`mapper_saved_bank    EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Saved mapper bank for push/pop helpers
`,a++,t+=`mapper_saved_bank_p1 EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Saved mapper bank for page/window 1 helpers
`,a++,t+=`mapper_saved_bank_p3 EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Saved mapper bank for page/window 3 helpers
`,a++,t+=`mapper_saved_bank_p4 EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Saved mapper bank for page/window 4 helpers
`,a++,t+=`frame_counter       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Frame counter (16-bit)
`,a+=2,t+=`
; Profiling counters (16-bit, cumulative)
`,t+=`prof_update_all_entities_calls EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Calls to update_all_entities
`,a+=2,t+=`prof_execute_sm_calls EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Calls to execute_all_state_machines
`,a+=2,t+=`prof_sm_update_calls  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Calls to SM_Update
`,a+=2,t+=`prof_collision_calls  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Calls to update_collision_component
`,a+=2,t+=`prof_wall_calls       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Calls to update_wallcollision_component
`,a+=2,t+=`prof_deadly_calls     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Calls to update_deadly_tiles_component
`,a+=2,t+=`prof_tile_interaction_calls EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Calls to check_tile_interaction
`,a+=2,t+=`prof_animation_calls  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Calls to update_animation_component
`,a+=2,t+=`prof_sprite_calls     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Calls to update_sprite_component
`,a+=2,t+=`prof_music_task_calls EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Calls to task_update_music
`,a+=2,t+=`prof_deadly_behavior_reads EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Deadly helper behavior-map reads
`,a+=2,t+=`
; ==================================================================
; SCREEN MAP POINTERS (Current active screen)
; ==================================================================
`,t+=`current_screen_layout   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Pointer to current screen layout data (16-bit)
`,a+=2,t+=`current_screen_layout_bank EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Mapper bank for current screen layout data
`,a++,t+=`current_behavior_map    EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Pointer to current behavior map data (16-bit)
`,a+=2,t+=`current_behavior_map_bank EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Mapper bank for current behavior map data
`,a++,t+=`behavior_cache_row     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Cached behavior row (255=invalid)
`,a++,t+=`behavior_cache_map_l   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Cached behavior map pointer low byte
`,a++,t+=`behavior_cache_map_h   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Cached behavior map pointer high byte
`,a++,t+=`behavior_cache_row_base EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Cached row base address in behavior map (16-bit)
`,a+=2,t+=`RUNTIME_SCREEN_MAP_SIZE EQU 768
`,t+=`MAX_RUNTIME_EFFECT_ZONES EQU 64
`,t+=`runtime_background_layout EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Immutable copy of current background layout (32x24)
`,a+=768,t+=`runtime_screen_layout  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Mutable copy of current screen layout (32x24)
`,a+=768,t+=`runtime_behavior_map   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Mutable copy of current behavior map (32x24)
`,a+=768,t+=`runtime_effects_layout EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Alternate effects layout copy for secret zones (32x24)
`,a+=768,t+=`runtime_effect_zone_table EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current screen effect zone table (MAX_RUNTIME_EFFECT_ZONES * 8 bytes)
`,a+=512,t+=`current_effect_zone_count EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Number of effect zones copied into runtime_effect_zone_table
`,a++,t+=`secret_zone_active EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; 1 if hero is currently inside an active secret zone
`,a++,t+=`secret_zone_rect_x EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Active secret zone rect X in cells
`,a++,t+=`secret_zone_rect_y EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Active secret zone rect Y in cells
`,a++,t+=`secret_zone_rect_w EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Active secret zone rect width in cells
`,a++,t+=`secret_zone_rect_h EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Active secret zone rect height in cells
`,a++,t+=`
; ==================================================================
; VIEWPORT/CAMERA VARIABLES (for scroll system)
; ==================================================================
`,t+=`camera_x            EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Camera X position in pixels (16-bit)
`,a+=2,t+=`camera_y            EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Camera Y position in pixels (16-bit)
`,a+=2,t+=`camera_tile_x       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Camera tile X (column)
`,a++,t+=`camera_tile_y       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Camera tile Y (row)
`,a++,t+=`world_width_tiles   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; World width in tiles
`,a++,t+=`world_height_tiles  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; World height in tiles
`,a++,t+=`scroll_dirty_flag   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; 1=viewport changed, needs redraw
`,a++,t+=`hud_dirty_flag      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; 1=HUD needs redraw, 0=clean
`,a++,t+=`
; ==================================================================
; ANIMATED TILES VARIABLES
; ==================================================================
`,t+=`anim_tile_timer     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Animation frame timer
`,a++,t+=`anim_tile_frame     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current animation frame (0-3)
`,a++,t+=`anim_tile_speed     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Frames between animation updates
`,a++,t+=`anim_tile_transform_flags EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Runtime flags for transform-mode tile animation (byte0=flags, byte1=opcode scratch)\r
`,a+=2,t+=`anim_tile_row_buffer EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temp buffer (8 bytes) for row transforms
`,a+=8,t+=`
; ==================================================================
; ENTITY SYSTEM VARIABLES (Fixed 32 entities)
; ==================================================================
MAX_ENTITIES        EQU 32
`,t+=`entity_active       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity active flags (32 bytes, 0=inactive, 1=active)
`,a+=32,t+=`entity_is_player    EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity hero/player flag (32 bytes, 0=no, 1=yes)
`,a+=32,t+=`entity_x_pos        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity X positions (32 bytes)
`,a+=32,t+=`entity_y_pos        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity Y positions (32 bytes)
`,a+=32,t+=`entity_vel_x        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity X velocity (32 bytes)
`,a+=32,t+=`entity_vel_y        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity Y velocity (32 bytes)
`,a+=32,t+=`entity_comp_masks   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity component masks (32 bytes)
`,a+=32,t+=`entity_comp_masks_hi EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity component masks high byte (32 bytes)
`,a+=32,t+=`entity_screen_id    EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity screen ID (32 bytes)
`,a+=32,t+=`entity_job_period   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity job period in frames (32 bytes, 1=100%,2=50%,3=33%,4=25%)
`,a+=32,t+=`entity_job_entry    EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity job entry slot within period window (32 bytes)
`,a+=32,t+=`entity_job_scheduler_active EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; 1 when any entity uses non-default job cadence
`,a++,t+=`entity_dir_mask     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity direction mask (32 bytes)
`,a+=32,t+=`entity_input_speed  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity input/cursor speed (32 bytes)
`,a+=32,t+=`entity_health       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity health (32 bytes)
`,a+=32,t+=`entity_anim_frame   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity animation frame (32 bytes)
`,a+=32,t+=`entity_anim_tick    EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity animation tick counter (32 bytes)
`,a+=32,t+=`entity_anim_speed   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity animation speed (ticks per frame) (32 bytes)
`,a+=32,t+=`entity_anim_flags   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity animation flags (32 bytes)
`,a+=32,t+=`entity_sm_ptr_l     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity State Pointer Low (32 bytes)
`,a+=32,t+=`entity_sm_ptr_h     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity State Pointer High (32 bytes)
`,a+=32,t+=`entity_sm_timer_l   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity State Timer Low (32 bytes)
`,a+=32,t+=`entity_sm_timer_h   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity State Timer High (32 bytes)
`,a+=32,t+=`entity_sm_wait_timer EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity State Wait Timer (32 bytes)
`,a+=32,t+=`entity_lifetime     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity lifetime for auto-destroy (32 bytes, 0=infinite)
`,a+=32,t+=`entity_carried_by   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity carrier ID (32 bytes, 255=not carried)
`,a+=32,t+=`entity_template_token EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity template token (32 bytes, 0=unknown)
`,a+=32,t+=`entity_facing_dir   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Last facing direction (32 bytes, 0=none,1=left,2=right,3=up,4=down)
`,a+=32;for(let i=0;i<8;i++)t+=`entity_sm_var_${i}     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity Variable ${i} (32 bytes)
`,a+=32;t+=`
; ==================================================================
; SPRITE SYSTEM VARIABLES
; ==================================================================
`,t+=`entity_sprite_asset_index EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity sprite asset index - RAM copy (32 bytes)
`,a+=32,t+=`active_sprite_count EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Number of sprites currently active
`,a++,t+=`sprites_dirty      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; 1=sprite_attributes changed, needs VRAM sync
`,a++,t+=`sprite_pattern      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Sprite pattern IDs (32 bytes)
`,a+=32,t+=`sprite_color        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Sprite colors (32 bytes)
`,a+=32,t+=`sprite_layer_colors EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; HW sprite layer color cache - RAM copy (32 bytes, indexed by HW sprite index)
`,a+=32,t+=`sprite_attributes   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Interleaved sprite attributes (32 * 4 bytes)
`,a+=128,e.screenMaps.length>0&&(t+=`
; ==================================================================
; SCREEN SYSTEM VARIABLES (${e.screenMaps.length} screens detected)
; ==================================================================
`,t+=`current_screen_id   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Currently displayed screen ID
`,a++,t+=`screen_dirty_flag   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Screen needs redraw flag
`,a++,t+=`screen_transition_cooldown EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Cooldown frames after screen transition
`,a++,t+=`current_world_id    EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current world ID (for multi-world support)
`,a++,t+=`current_screen_index EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current screen index within world
`,a++),t+=`
; ==================================================================
; PLAYER SYSTEM VARIABLES (player entity detected)
; ==================================================================
`,t+=`player_x            EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Player X position (16-bit)
`,a+=2,t+=`player_y            EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Player Y position (16-bit)
`,a+=2,t+=`player_health       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Player health points
`,a++,t+=`player_score        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Player score (16-bit)
`,a+=2,t+=`gem_count           EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Collectible tile counter (8-bit)
`,a++,t+=`last_gem_char       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Char code of last collected gem tile (for SM VARIABLE_COMPARE)
`,a++,t+=`
; Persistent collectibles list (survives screen re-entry)
`,t+=`MAX_COLLECTIBLES     EQU 64              ; Max persistent collectible records
`,t+=`collected_count      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Number of collected tiles recorded (8-bit)
`,a++,t+=`collected_world      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; World IDs for each collected tile (MAX_COLLECTIBLES bytes)
`,a+=64,t+=`collected_screen     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Screen IDs for each collected tile (MAX_COLLECTIBLES bytes)
`,a+=64,t+=`collected_idx_l      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Tile name-table index low byte (MAX_COLLECTIBLES bytes)
`,a+=64,t+=`collected_idx_h      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Tile name-table index high byte (MAX_COLLECTIBLES bytes)
`,a+=64,t+=`
; Timed bonus tile respawn slots (bonus gem regeneration)
`,t+=`MAX_BONUS_RESPAWNS   EQU 16              ; Max timed bonus tiles waiting to respawn
`,t+=`bonus_respawn_world  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; World IDs for timed bonus respawns (MAX_BONUS_RESPAWNS bytes)
`,a+=16,t+=`bonus_respawn_screen EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Screen IDs for timed bonus respawns (MAX_BONUS_RESPAWNS bytes)
`,a+=16,t+=`bonus_respawn_idx_l  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Tile index low byte for timed respawns (MAX_BONUS_RESPAWNS bytes)
`,a+=16,t+=`bonus_respawn_idx_h  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Tile index high byte for timed respawns (MAX_BONUS_RESPAWNS bytes)
`,a+=16,t+=`bonus_respawn_secs   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Remaining seconds per timed respawn slot (MAX_BONUS_RESPAWNS bytes)
`,a+=16,t+=`bonus_respawn_frames EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Frame countdown (60..1) per timed respawn slot (MAX_BONUS_RESPAWNS bytes)
`,a+=16,t+=`
; ==================================================================
; AUXILIARY VARIABLES 
; ==================================================================
deterministic        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Deterministic mode flag
`,a++,t+=`
; ==================================================================
; TEMPORARY VARIABLES (ALWAYS NEEDED)
; ==================================================================
`,t+=`temp_word_1         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 16-bit storage
`,a+=2,t+=`temp_word_2         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 16-bit storage
`,a+=2,t+=`temp_byte_1         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage
`,a++,t+=`temp_byte_2         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage
`,a++,t+=`temp_byte_3         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,t+=`temp_byte_4         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,t+=`temp_byte_5         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,t+=`temp_byte_6         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,t+=`
; ==================================================================
; SOUND SYSTEM VARIABLES
; ==================================================================
`,t+=`sfx_active          EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; 0=no SFX active, 1=playing
`,a++,t+=`sfx_timer           EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Frames remaining for current SFX
`,a++,t+=`sfx_fadeout         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Reserved fadeout flag/state
`,a++,t+=`temp_byte_7         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,t+=`temp_byte_8         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,t+=`temp_byte_9         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,t+=`temp_byte_10        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,t+=`temp_byte_11        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,t+=`temp_byte_12        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,t+=`temp_byte_13        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,t+=`temp_byte_14        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,t+=`temp_byte_15        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,t+=`temp_byte_16        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,t+=`temp_byte_17        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,t+=`temp_byte_18        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,t+=`temp_byte_19        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,t+=`temp_byte_20        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,t+=`temp_byte_21        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,t+=`temp_byte_22        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,t+=`temp_byte_23        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,t+=`temp_byte_24        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,t+=`temp_byte_25        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,t+=`temp_word_3         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 16-bit storage (64 bytes)
`,a+=64,t+=`temp_word_4         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 16-bit storage (64 bytes)
`,a+=64,t+=`temp_byte_26        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,t+=`temp_byte_27        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,t+=`tileDead_dbg        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Debug byte: current hero deadly contact
`,a++,t+=`tileDead_latched_dbg EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Debug byte: latched hero deadly contact
`,a++,t+=`tileDead_x_dbg      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Debug byte: last sampled deadly tile X
`,a++,t+=`tileDead_y_dbg      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Debug byte: last sampled deadly tile Y
`,a++,t+=`tileDead_value_dbg  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Debug byte: last raw deadly behavior value
`,a++,t+=`
; Wall collision temporary variables
`,t+=`wall_temp_x         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Cached entity X for wall checks
`,a++,t+=`wall_temp_y         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Cached entity Y for wall checks
`,a++,t+=`wall_hit_left       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Hitbox left edge cache
`,a++,t+=`wall_hit_top        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Hitbox top edge cache
`,a++,t+=`wall_hit_right      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Hitbox right edge cache
`,a++,t+=`wall_hit_bottom     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Hitbox bottom edge cache
`,a++,t+=`wall_hit_w          EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Hitbox width cache (min 1)
`,a++,t+=`wall_hit_h          EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Hitbox height cache (min 1)
`,a++,t+=`wall_probe_left     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; X probe near hitbox left (adaptive inset)
`,a++,t+=`wall_probe_right    EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; X probe near hitbox right (adaptive inset)
`,a++,t+=`wall_probe_top      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Y probe near hitbox top (adaptive inset)
`,a++,t+=`wall_probe_bottom   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Y probe near hitbox bottom (adaptive inset)
`,a++,t+=`
; Unified update helpers
`,t+=`active_entity_list  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity indices with non-zero component masks (MAX_ENTITIES bytes)
`,a+=32,t+=`active_entity_count EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Number of entries in active_entity_list
`,a++,t+=`hero_entity_id      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; First current-screen entity flagged as player (#FF = none)
`,a++,t+=`active_entity_list_dirty EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; 1=rebuild active_entity_list required
`,a++,t+=`input_entity_list   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Active current-screen entities with Input component (MAX_ENTITIES bytes)
`,a+=32,t+=`input_entity_count  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Number of entries in input_entity_list
`,a++,t+=`render_entity_list  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Active current-screen entities with Sprite component (MAX_ENTITIES bytes)
`,a+=32,t+=`render_entity_count EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Number of entries in render_entity_list
`,a++,t+=`collision_entity_list EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Active current-screen entities with Collision component (MAX_ENTITIES bytes)
`,a+=32,t+=`collision_entity_count EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Number of entries in collision_entity_list
`,a++,t+=`ground_entity_list  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Active current-screen entities with Collision or Gravity (MAX_ENTITIES bytes)
`,a+=32,t+=`ground_entity_count EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Number of entries in ground_entity_list
`,a++,t+=`anim_entity_list    EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Active current-screen entities with Animation+Sprite (MAX_ENTITIES bytes)
`,a+=32,t+=`anim_entity_count   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Number of entries in anim_entity_list
`,a++,t+=`
; Entity-entity collision optimized variables
`,t+=`coll_list           EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Active collidable entity indices (MAX_ENTITIES bytes)
`,a+=32,t+=`coll_list_count     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Number of entities in coll_list
`,a++,t+=`coll_src_left       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Source AABB left edge (scratch)
`,a++,t+=`coll_src_right      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Source AABB right edge (scratch)
`,a++,t+=`coll_src_top        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Source AABB top edge (scratch)
`,a++,t+=`coll_src_bottom     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Source AABB bottom edge (scratch)
`,a++,t+=`
; ==================================================================
; INTERRUPT SYSTEM VARIABLES (dynamically allocated)
; ==================================================================
`,t+=`task_table              EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Task table base (8 slots x 2 bytes = 16 bytes)
`;for(let i=0;i<8;i++)t+=`task_${i}_ptr              EQU #${(a+i*2).toString(16).toUpperCase().padStart(4,"0")}   ; Slot ${i} pointer (2 bytes)
`;a+=16,t+=`interrupt_system_enabled EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; 0=disabled, 1=enabled (1 byte)
`,a++,t+=`old_htimi_hook          EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Original H.TIMI hook (5 bytes)
`,a+=5,t+=`interrupt_counter       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Frame counter (16-bit)
`,a+=2,t+=`task_exec_time          EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Cycles used by tasks (16-bit, debug)
`,a+=2,t+=`vblank_flag             EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Set to 1 on each VBlank (1 byte)
`,a++,t+=`RAM_INTERRUPT_END       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; End of interrupt system
`,t+=`
; ==================================================================
; STATE MACHINE SOUND RUNTIME (one active sound asset)
; ==================================================================
`,t+=`sm_sound_active       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; 0=idle, 1=playing state-machine sound asset
`,a++,t+=`sm_sound_frames_left  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Frames left for current state-machine sound asset
`,a++,t+=`sm_sound_ptr_l        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Next sound frame pointer low byte
`,a++,t+=`sm_sound_ptr_h        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Next sound frame pointer high byte
`,a++,t+=`
; ==================================================================
; TRACKER MUSIC RUNTIME
; ==================================================================
`,t+=`music_active         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; 0=stopped, 1=track active
`,a++,t+=`music_muted          EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; 0=audible, 1=muted/pause
`,a++,t+=`music_loop           EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; 0=no loop, 1=loop enabled
`,a++,t+=`music_track_index    EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current ROM track index
`,a++,t+=`music_row_frames     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Frames per tracker row
`,a++,t+=`music_row_countdown  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Countdown to next row
`,a++,t+=`music_order_pos      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current order position
`,a++,t+=`music_pattern_index  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current pattern index
`,a++,t+=`music_pattern_row    EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current row inside pattern
`,a++,t+=`music_pattern_rows   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Cached rows in current pattern
`,a++,t+=`music_track_ptr_l    EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current track pointer low byte
`,a++,t+=`music_track_ptr_h    EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current track pointer high byte
`,a++,t+=`music_pattern_ptr_l  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current pattern rows pointer low byte
`,a++,t+=`music_pattern_ptr_h  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current pattern rows pointer high byte
`,a++,t+=`music_mixer_shadow   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; PSG mixer shadow for music runtime
`,a++;const l=[{base:"music_ch_note_base",prefix:"music_ch",suffix:"note",comment:"Current note index (255=silent)"},{base:"music_ch_instrument_base",prefix:"music_ch",suffix:"instrument",comment:"Current instrument id (0=none)"},{base:"music_ch_ornament_base",prefix:"music_ch",suffix:"ornament",comment:"Current ornament id (0=none)"},{base:"music_ch_volume_base",prefix:"music_ch",suffix:"volume",comment:"Current base volume (0-15)"},{base:"music_ch_vol_step_base",prefix:"music_ch",suffix:"vol_step",comment:"Reserved software volume envelope step"},{base:"music_ch_tone_step_base",prefix:"music_ch",suffix:"tone_step",comment:"Reserved software tone envelope step"},{base:"music_ch_noise_step_base",prefix:"music_ch",suffix:"noise_step",comment:"Reserved software noise envelope step"},{base:"music_ch_orn_step_base",prefix:"music_ch",suffix:"orn_step",comment:"Reserved ornament step"}],o=["a","b","c"];for(const i of l){const r=a;t+=`${i.base} EQU #${r.toString(16).toUpperCase().padStart(4,"0")}   ; ${i.comment} (3 bytes)
`,o.forEach((_,d)=>{t+=`${i.prefix}_${_}_${i.suffix} EQU #${(r+d).toString(16).toUpperCase().padStart(4,"0")}   ; Channel ${_.toUpperCase()}
`}),a+=3}if(Array.isArray(e.tracks)&&e.tracks.some(i=>(i==null?void 0:i.playbackBackend)==="external-pt3")){const i=a,r=_=>(i+_).toString(16).toUpperCase().padStart(4,"0");t+=`
; ==================================================================
; PT3 REPLAYER WORKSPACE (~448 bytes)
; Layout matches PT3-ROM-alltables-glass.asm expected labels
; ==================================================================
PT3_SETUP       EQU #${r(0)}   ; PT3 state flags (bit0=loop, bit7=song_ended)
PT3_MODADDR     EQU #${r(1)}   ; Module address pointer (2 bytes)
PT3_CrPsPtr     EQU #${r(3)}   ; Current position pointer
PT3_SAMPTRS     EQU #${r(5)}   ; Sample pointers base
PT3_OrnPtrs     EQU #${r(7)}   ; Ornament pointers base
PT3_PDSP        EQU #${r(9)}   ; Pattern data start pointer
PT3_CSP         EQU #${r(11)}   ; Saved SP (CHREGS SP trick)
PT3_PSP         EQU #${r(13)}   ; PT3 stack pointer save
PT3_PrNote      EQU #${r(15)}   ; Previous note
PT3_PrSlide     EQU #${r(16)}   ; Previous slide (2 bytes)
PT3_AdInPtA     EQU #${r(18)}   ; Channel A inline pointer
PT3_AdInPtB     EQU #${r(20)}   ; Channel B inline pointer
PT3_AdInPtC     EQU #${r(22)}   ; Channel C inline pointer
PT3_LPosPtr     EQU #${r(24)}   ; Loop position pointer
PT3_PatsPtr     EQU #${r(26)}   ; Patterns table pointer
PT3_Delay       EQU #${r(28)}   ; Song speed/delay
PT3_AddToEn     EQU #${r(29)}   ; Add to envelope
PT3_Env_Del     EQU #${r(30)}   ; Envelope delay
PT3_ESldAdd     EQU #${r(31)}   ; Envelope slide add (2 bytes)
PT3_NTL3        EQU #${r(33)}   ; Note table link 3
VARS            EQU #${r(35)}   ; Channel vars base
ChanA           EQU #${r(35)}   ; Channel A data (29 bytes)
ChanB           EQU #${r(64)}   ; Channel B data (29 bytes)
ChanC           EQU #${r(93)}   ; Channel C data (29 bytes)
DelyCnt         EQU #${r(122)}   ; Delay counter
CurESld         EQU #${r(123)}   ; Current envelope slide (2 bytes)
CurEDel         EQU #${r(125)}   ; Current envelope delay
Ns_Base_AddToNs EQU #${r(126)}   ; Noise base + add to noise (combined)
Ns_Base         EQU #${r(126)}   ; Noise base
AddToNs         EQU #${r(127)}   ; Add to noise
NT_             EQU #${r(128)}   ; Note table (192 bytes)
AYREGS          EQU #${r(320)}  ; AY registers mirror (14 bytes)
VT_             EQU #${r(320)}  ; Volume table base (alias for AYREGS)
EnvBase         EQU #${r(334)}  ; Envelope base
VAR0END         EQU #${r(336)}  ; End of fixed workspace
T1_             EQU #${r(336)}  ; Tone tables start (unpacked by PT3_INIT)
T_NEW_1         EQU #${r(336)}  ; Tone table new 1
T_OLD_1         EQU #${r(336)}  ; Tone table old 1
T_OLD_2         EQU #${r(360)}  ; Tone table old 2
T_NEW_3         EQU #${r(384)}  ; Tone table new 3
T_OLD_3         EQU #${r(384)}  ; Tone table old 3
T_OLD_0         EQU #${r(386)}  ; Tone table old 0
T_NEW_0         EQU #${r(386)}  ; Tone table new 0
T_NEW_2         EQU #${r(410)}  ; Tone table new 2 (last, ends at +0x1B2)
`,a=i+576}return t+=`
; ==================================================================
; END OF VARIABLES
; ==================================================================
RAM_USAGE_END       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; End of project variables (${a-49152} bytes used)

; ==================================================================
; MEMORY LAYOUT INFO (Reference only - no code generated)
; ==================================================================
; RAM Layout:
;   #C000-#${a.toString(16).toUpperCase().padStart(4,"0")}: Project variables (${a-49152} bytes)
;   #${a.toString(16).toUpperCase().padStart(4,"0")}-#F37F: Free RAM (~${62336-a} bytes available)
;   #F380-#FFFF: MSX System variables (DO NOT TOUCH)
;
; NOTE: Variables are defined using EQU (address labels only).
;       RAM space is used at runtime, NOT reserved in ROM.
;       Do NOT use ORG #C000 in cartridge ROMs!
; ==================================================================
`,t}function jl(e,t){if(!e)return"";let a="";const l=!!(e.tracks&&e.tracks.length>0||e.stateMachines&&e.stateMachines.length>0),o=(t==null?void 0:t.mode)==="interruptTaskManager";return l&&(a+=`    ; Initialize PSG/audio once at boot. WorldLink must not reset music after a Music node.
`,a+=`    call init_sound_system

`),o?(a+=`    ; Register boot-time IRQ tasks defined by the engine execution plan.
`,a+=`    call init_default_tasks_from_plan

`):a+=`    ; GameLoop+HALT mode: keep gameplay/audio ticks in the main GameFlow loops.

`,a}function Hl(e,t,a){var o;let l="";if(t!=null&&t.gameFlow){const n=t.gameFlow;l=`
; GameFlow Integration: Using "${n.name}" as execution orchestrator`;const i=n.nodes.find(r=>r.type==="Start");if(i){const r=n.connections.find(_=>{var d;return((d=_.from)==null?void 0:d.nodeId)===i.id||typeof _.from=="string"&&_.from===i.id});if(r){const _=((o=r.to)==null?void 0:o.nodeId)||r.to,d=n.nodes.find(c=>c.id===_);d&&(l+=`
; Flow: Start → ${d.type} (${d.title||d.name||d.id})`)}}}return`; ==================================================================
; MSX CARTRIDGE ROM HEADER
; File: header.asm
; Description: Standard MSX cartridge initialization${l}
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

    ; Cold boot path: ensure cartridge pages are mapped.
    call SETPAGES32K
    jp restart_rom_continue

; Restart entry point for GameFlow Restart node.
; Reinitializes runtime safely without remapping cartridge pages.
restart_rom:
    di
    im 1
    ld sp, #F380

restart_rom_continue:
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
    ${jl(t,a)}
    ei

${t.hasGameFlow?`    ; ====================================================
    ; GAMEFLOW INITIALIZATION
    ; ====================================================
    ; Initialize GameFlow system
    call gameflow_init

    ; Start execution from GameFlow Start node
    ; GameFlow is now the sole orchestrator
    call ENASCR
    jp gameflow_start`:`    ; ====================================================
    ; SIMPLE GAME LOOP (No GameFlow)
    ; ====================================================
    ; Initialize game entities
    call init_game_entities
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
`}function zl(e){var t,a;return(((t=e.tracks)==null?void 0:t.length)||0)>0||(((a=e.stateMachines)==null?void 0:a.length)||0)>0}function Vl(e,t){return zl(e)?!(t!=null&&t.tasks.some(a=>a.responsibility==="audio")):!1}function Dt(e,t){return Vl(e,t)?`    call task_audio_tick
`:""}function me(e){return e.replace(/[^a-zA-Z0-9]/g,"_")}function la(e){return String(e||"").replace(/"/g,"").replace(/\r?\n/g," ").trim()}function oa(e){const t=String(e||"").trim();if(!t||t.toLowerCase().startsWith("rgba(0,0,0,0"))return null;const a=t.replace("#","");if(a.length!==6)return null;const l=parseInt(a.substring(0,2),16),o=parseInt(a.substring(2,4),16),n=parseInt(a.substring(4,6),16);return[l,o,n].some(i=>Number.isNaN(i))?null:{r:l,g:o,b:n}}function Oa(e,t=!0){const a=String(e||"").trim();if(!a||a.toLowerCase().startsWith("rgba(0,0,0,0"))return t?0:1;const l=a.toUpperCase(),o=oe.find(_=>_.hex.toUpperCase()===l);if(o)return o.index;const n=oa(a);if(!n)return t?0:1;let i=t?0:1,r=1/0;for(const _ of oe){if(!t&&_.index===0)continue;const d=oa(_.hex);if(!d)continue;const c=(n.r-d.r)**2+(n.g-d.g)**2+(n.b-d.b)**2;c<r&&(r=c,i=_.index)}return i}function na(e){const t=Oa(e,!1);return t===0?1:t}function Gl(e,t){const a=String(t||"").trim();return a?(Array.isArray(e.sprites)?e.sprites:[]).findIndex(o=>String((o==null?void 0:o.id)||"").trim()===a):-1}function Wl(e){var n;const t=(e==null?void 0:e.spritePalette)||[],a=e==null?void 0:e.backgroundColor,l=(e==null?void 0:e.frames)||[];if(!t.length||!l.length)return[];const o=[];for(let i=0;i<t.length;i++){const r=t[i];if(!r||r===a)continue;let _=!1;for(const d of l)if(d!=null&&d.data){for(let c=0;c<(d.data.length||0)&&!_;c++)for(let s=0;s<(((n=d.data[c])==null?void 0:n.length)||0)&&!_;s++)d.data[c][s]===r&&(_=!0);if(_)break}_&&o.push(i)}return o}function Yl(e){const t=(e==null?void 0:e.spritePalette)||[],a=e==null?void 0:e.backgroundColor,l=Wl(e);if(l.length===0)return{layerOffsets:[0],layerColors:[15]};const o=l.slice(0,4);if(o.length===0)return{layerOffsets:[0],layerColors:[15]};const n=o.map((r,_)=>_),i=o.map(r=>{const _=t[r];return!_||a&&_===a?0:Oa(_,!0)});return{layerOffsets:n,layerColors:i}}function Ql(e){var l,o,n;const t=((l=e==null?void 0:e.appearance)==null?void 0:l.selectorType)??((o=e==null?void 0:e.appearance)==null?void 0:o.cursorType)??((n=e==null?void 0:e.appearance)==null?void 0:n.cursorMode)??(e==null?void 0:e.selectorType)??(e==null?void 0:e.cursorType)??(e==null?void 0:e.cursorMode),a=String(t||"").trim().toLowerCase();return a==="char"||a==="character"||a==="text"||a==="glyph"?"char":a==="sprite"||a==="image"?"sprite":"auto"}function Xl(e){var o;const t=Array.isArray(e==null?void 0:e.options)?e.options:[];if(t.length===0)return 0;const a=(e==null?void 0:e.initialSelection)??(e==null?void 0:e.initialSelectedOption)??((o=e==null?void 0:e.appearance)==null?void 0:o.initialSelection)??0,l=Number(a);return!Number.isFinite(l)||l<0||l>=t.length?0:Math.floor(l)}function Ua(e){return`NODE_TYPE_${e.replace(/([a-z])([A-Z])/g,"$1_$2").toUpperCase()}`}function Kl(e){const t=(e.name||"DEFAULT").toUpperCase().replace(/[^A-Z0-9]/g,"_"),a=e.id?`_${e.id.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";return`load_screen_${t.toLowerCase()}${a.toLowerCase()}`}function ra(e,t){const a=String(e||"").trim();if(!a)return null;const l=r=>`global_var_${r.replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"").replace(/[^a-z0-9_]/g,"_")}`,o=a.toLowerCase(),n=l(a),i=Array.isArray(t.globalVariables)?t.globalVariables:[];for(const r of i){const _=String((r==null?void 0:r.name)||"").trim(),d=String((r==null?void 0:r.asmName)||"").trim();if(_&&_.toLowerCase()===o)return d||l(_);if(d&&d.toLowerCase()===o)return d;if(_&&l(_)===n)return d||l(_)}return null}function Zl(e){var o,n;const t=(n=(o=e==null?void 0:e.hudConfiguration)==null?void 0:o.importedFrame)==null?void 0:n.cells;if(!Array.isArray(t)||t.length===0)return null;const a=(e.name||"DEFAULT").toUpperCase().replace(/[^A-Z0-9]/g,"_"),l=e.id?`_${e.id.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";return`hud_imported_frame_${a.toLowerCase()}${l.toLowerCase()}_draw`}function Rt(e){const t=Array.isArray(e.screenMaps)?e.screenMaps:[],a=new Set;if(t.forEach(n=>{var r;Array.isArray((r=n==null?void 0:n.hudConfiguration)==null?void 0:r.elements)&&n.hudConfiguration.elements.length>0&&(n!=null&&n.id)&&a.add(String(n.id))}),a.size===0)return[];const l=Array.isArray(e.worldmaps)?e.worldmaps:[],o=new Set;return l.length>0?l.forEach(n=>{(Array.isArray(n==null?void 0:n.nodes)?n.nodes:[]).forEach((r,_)=>{const d=String((r==null?void 0:r.screenAssetId)||"");a.has(d)&&o.add(_)})}):t.forEach((n,i)=>{n!=null&&n.id&&a.has(String(n.id))&&o.add(i)}),Array.from(o).sort((n,i)=>n-i)}function Ge(e,t,a=!1){if(e.length===0)return"";let l=`    ld a, (current_screen_id)
`;return e.forEach(o=>{l+=`    cp ${o}
`,l+=`    jp z, .${t}_do
`}),l+=`    jp .${t}_skip
`,l+=`.${t}_do:
`,a&&(l+=`    ld a, 1
`,l+=`    ld (hud_dirty_flag), a
`),l+=`    call render_hud
`,l+=`.${t}_skip:
`,l}function ql(e,t){var d,c,s;if(!e.gameFlow)return ao(e,t);const a=e.gameFlow,l=Dt(e,t);let o=`; ==================================================================
; GAMEFLOW EXECUTION ENGINE
; File: gameflow.asm
; Description: GameFlow-based game orchestration system
; ==================================================================
;
; GameFlow: ${a.name||"Unnamed"}
; Total Nodes: ${((d=a.nodes)==null?void 0:d.length)||0}
; Total Connections: ${((c=a.connections)==null?void 0:c.length)||0}
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
${a.startNodeId?`    ld hl, gameflow_node_${me(a.startNodeId)}`:`    ; ERROR: No start node defined!
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
`;const n=Array.from(new Set(((s=a.nodes)==null?void 0:s.map(p=>p.type))||[]));n.forEach(p=>{const m=`gameflow_handle_${p.toLowerCase()}`;o+=`    cp ${Ua(p)}
    jp z, ${m}
`}),o+=`    
    ; Unknown node type - error
    ret

`,o+=`; ==================================================================
; NODE TYPE HANDLERS
; Each handler receives:
;   DE = node data pointer
;   BC = connection table pointer
; ==================================================================

`,o+=Jl(n,e,t),o+=`; ==================================================================
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

`;const i=Rt(e),r=i.length>0,_=Ge(i,"gf_worldloop_hud");return Ge(i,"gf_worldlink_hud",!0),o+=`; ==================================================================
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
${l}    ; Upload sprites right after V-Blank edge (60/50 Hz frame-paced)
    call update_sprites_to_vram

    ; Animated transform tiles do VRAM read-modify-write, so update them
    ; near the V-Blank edge before the expensive gameplay work.
    call update_animated_tiles

    ; Poll input in main loop (avoids BIOS-in-ISR compatibility issues)
    call task_update_input

    ; Handle world screen edge transitions (Preview parity)
    call check_world_screen_transition

    ; Update all entities
    call update_all_entities

    ; Execute all state machines
    call execute_all_state_machines

    ; Update timed PSG sound effects
    call sfx_update

    ; Sprite SAT upload runs once per frame, outside ISR (done at frame start).
${r?`
    ; Render HUD only on screens that define HUD elements
${_}`:""}
    ; Loop
    jp gameflow_world_game_loop

`,o+=`; ==================================================================
; NODE DATA STRUCTURES
; Each node has: type byte, data pointer, connection table pointer
; ==================================================================

`,a.nodes&&a.nodes.length>0&&a.nodes.forEach(p=>{o+=eo(p,a,e)}),o+=`
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
`,e.globalVariables.forEach(p=>{const m=p.name,u=p.asmName||`global_var_${m.replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`,h=String(p.type||"").toLowerCase(),y=p.values&&p.values.length>0?p.values[0].value:0;let b=0;if(typeof y=="boolean")b=y?1:0;else{const E=Number(y);b=Number.isFinite(E)?Math.trunc(E):0}if(h==="word"||h==="16bit"){const E=Math.max(0,Math.min(65535,b));o+=`    ld a, ${E&255}
`,o+=`    ld (${u}), a    ; ${m} low byte = ${E}
`,o+=`    ld a, ${E>>8&255}
`,o+=`    ld (${u}+1), a    ; ${m} high byte = ${E}
`}else{const E=Math.max(0,Math.min(255,b));o+=`    ld a, ${E}
`,o+=`    ld (${u}), a    ; ${m} = ${E}
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
`,o}function Jl(e,t,a){let l="";const o=Dt(t,a),n=Rt(t),i=n.length>0,r=Ge(n,"gf_worldlink_hud",!0);e.forEach(c=>{var s;switch(c){case"Start":l+=`gameflow_handle_start:
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

`;break;case"WorldLink":l+=`gameflow_handle_worldlink:
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

    ; Update sprites
    call update_sprites_to_vram
${i?`
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

`;break;case"End":l+=`gameflow_handle_end:
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

`;break;case"Restart":l+=`gameflow_handle_restart:
    ; Restart node - safe runtime reinit entry (no cold page remap).
    jp restart_rom

`;break;case"SubMenu":{const p=Math.max(((s=t.sprites)==null?void 0:s.length)||0,1);let m="";for(let u=0;u<p;u++)m+=`    dw SPRITE_${u}_PATTERN
`;l+=`gameflow_handle_submenu:
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
    ld a, 0
    call GTTRIG
    or a
    jr nz, .smp_wait_fire_release
    jr .smp_exit

.smp_wait_neutral:
.smp_wait_neutral_loop:
    halt
${o}
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
    call submenu_get_cursor_pattern_ptr
    jr c, .sps_done               ; invalid index -> fallback to char marker
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

    ; Copy selected source layers to reserved cursor slots.
    ; Header offsets +3..+6 are kept for format compatibility, but sprite
    ; export is compact (layer0..layerN-1), so we upload a contiguous block:
    ; bytes = layer_count * 32.
    ; In ZX0-compressed exports, server-side preprocessing rewrites this
    ; FAST_LDIRVM call to COPY_SPRITE_SRC_TO_VRAM.
    pop hl                        ; HL = source pattern base
    ld a, (gameflow_submenu_cursor_layer_count)
    add a, a                      ; *2
    add a, a                      ; *4
    add a, a                      ; *8
    add a, a                      ; *16
    add a, a                      ; *32
    ld c, a
    ld b, 0
    ld de, SPRPAT + (SUBMENU_CURSOR_BASE_SPRITE * 32)
    call FAST_LDIRVM

.sps_enable_cursor:

    ld a, 1
    ld (gameflow_submenu_cursor_enabled), a
    jr .sps_done

.sps_restore_no_cursor:
    pop hl

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

SUBMENU_CURSOR_BASE_SPRITE EQU 28
SUBMENU_CURSOR_MAX_LAYERS  EQU 4
SUBMENU_CURSOR_PATTERN_COUNT EQU ${p}

submenu_cursor_sprite_pattern_table:
${m}

`;break}case"Text":l+=`gameflow_handle_text:
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

`;break;case"IfThenElse":l+=`gameflow_handle_ifthenelse:
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

`;break;case"Globals":l+=`gameflow_handle_globals:
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

`;break;case"Waypoint":l+=`gameflow_handle_waypoint:
    ; Waypoint node - passthrough routing node
    ; Simply follow default connection
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

`;break;case"Transition":l+=`gameflow_handle_transition:
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

`;break;case"Group":l+=`gameflow_handle_group:
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

`;break;case"Music":l+=`gameflow_handle_music:
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
`;break;default:l+=`gameflow_handle_${c.toLowerCase()}:
    ; ${c} node - not yet implemented
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

`;break}});const _=e.includes("Text")||e.includes("SubMenu"),d=e.includes("End");return _&&!d&&(l+=`; ------------------------------------------------------------------
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

`),l}function eo(e,t,a){var d,c,s,p,m,u,h,y,b,E,w,v;const l=`gameflow_node_${me(e.id)}`,o=`${l}_conn`,n=["Start","WorldLink","SubMenu","Text","IfThenElse","Globals","Transition","Music"].includes(e.type)||e.type==="Globals"&&e.variables&&e.variables.length>0,i=n?`${l}_data`:"gameflow_no_data";let r=`; Node: ${e.type} - "${e.title||e.name||e.id}"
${l}:
    db ${Ua(e.type)}
    dw ${i}
    dw ${o}

`;if(n){switch(r+=`${l}_data:
`,e.type){case"Start":r+=`    dw ${l}_init    ; Initialization routine address
`,r+=`    db ((${l}_init - #4000) / #2000)    ; Initialization routine bank
`;break;case"WorldLink":const f=e.worldAssetId||"default";r+=`    dw load_world_${me(f)}
`,r+=`    db ((load_world_${me(f)} - #4000) / #2000)
`;break;case"SubMenu":{const C=me(e.id),x=(Array.isArray(e.options)?e.options:[]).slice(0,6),M=x.length,L=Xl(e),D=M>0?Math.min(L,M-1):0,R=la(e.title||e.name||"MENU").toUpperCase(),k=((c=(d=e==null?void 0:e.appearance)==null?void 0:d.colors)==null?void 0:c.background)||"#000000",P=na(k),T=Ql(e),$=(s=e==null?void 0:e.appearance)==null?void 0:s.cursorSpriteAssetId,U=Gl(a,$),G=U>=0?(p=a.sprites)==null?void 0:p[U]:null,J=T==="char"?!1:U>=0,ue=J?U:255,Q=J&&G?Yl(G):{layerOffsets:[],layerColors:[]},j=Q.layerOffsets.slice(0,4),W=Q.layerColors.slice(0,4),te=Math.min(W.length,4);for(;j.length<4;)j.push(0);for(;W.length<4;)W.push(0);const X=(m=e==null?void 0:e.appearance)==null?void 0:m.backgroundScreenAssetId;let ne="0";if(X&&a.screenMaps){const ee=a.screenMaps.find(ie=>ie.id===X);if(ee){const ie=ee.name.toUpperCase().replace(/[^A-Z0-9]/g,"_"),Re=ee.id?`_${ee.id.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";ne=`load_screen_${ie.toLowerCase()}${Re.toLowerCase()}`}}const Ye=ne==="0"?"0":`((${ne} - #4000) / #2000)`;r+=`    db ${P}    ; Background color (MSX index)
`,r+=`    db ${ue}    ; Cursor sprite asset index (#FF = use text marker)
`,r+=`    db ${te}    ; Cursor sprite layer count (max 4)
`,r+=`    db ${j[0]}, ${j[1]}, ${j[2]}, ${j[3]}    ; Cursor source layer offsets
`,r+=`    db ${W[0]}, ${W[1]}, ${W[2]}, ${W[3]}    ; Cursor layer colors
`,r+=`    dw ${ne}    ; Background screen load function (0=none)
`,r+=`    db ${Ye}    ; Background screen load bank
`,r+=`    db ${M}    ; Number of options (max 6)
`,r+=`    db ${D}    ; Initial selected option
`,r+=`    dw submenu_${C}_title
`,x.forEach((ee,ie)=>{r+=`    dw submenu_${C}_opt${ie}
`}),r+=`
submenu_${C}_title:
`,r+=`    db "${R}", 0
`,x.forEach((ee,ie)=>{const Re=la((ee==null?void 0:ee.text)||(ee==null?void 0:ee.label)||(ee==null?void 0:ee.name)||(ee==null?void 0:ee.id)||`OPTION ${ie+1}`).toUpperCase();r+=`submenu_${C}_opt${ie}:
`,r+=`    db "${Re}", 0
`})}break;case"Text":{const C=me(e.id),x=(e.title||e.name||"").replace(/"/g,"").replace(/\r?\n/g," ").trim().toUpperCase()||"TEXT",M=(e.message||"").replace(/"/g,"").replace(/\r?\n/g," "),L=((h=(u=e.appearance)==null?void 0:u.colors)==null?void 0:h.background)||"#000000",D=na(L),R=28,k=M.split(" "),P=[];let T="";for(const Q of k){const j=Q.toUpperCase(),W=T?T+" "+j:j;W.length>R&&T?(P.push(T),T=j):T=W}T.trim()&&P.push(T);const $="PRESS FIRE TO CONTINUE",U=[];U.push({row:3,text:x,label:`text_${C}_title`}),P.forEach((Q,j)=>{U.push({row:7+j,text:Q,label:`text_${C}_msg${j}`})}),U.push({row:20,text:$,label:`text_${C}_prompt`});const G=(y=e.appearance)==null?void 0:y.backgroundScreenAssetId;let J="0";if(G&&a.screenMaps){const Q=a.screenMaps.find(j=>j.id===G);if(Q){const j=Q.name.toUpperCase().replace(/[^A-Z0-9]/g,"_"),W=Q.id?`_${Q.id.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";J=`load_screen_${j.toLowerCase()}${W.toLowerCase()}`}}const ue=J==="0"?"0":`((${J} - #4000) / #2000)`;r+=`    DB ${D}                  ; Background color (MSX index from ${L})
`,r+=`    DW ${J}            ; Background screen load function (0=none)
`,r+=`    DB ${ue}         ; Background screen load bank
`,r+=`    DB ${U.length}                  ; Number of lines
`;for(const Q of U){const j=Math.max(0,Math.floor((32-Q.text.length)/2));r+=`    DB ${Q.row}, ${j}              ; Row ${Q.row}, Col ${j}
`,r+=`    DW ${Q.label}          ; -> "${Q.text}"
`}r+=`
`;for(const Q of U)r+=`${Q.label}:
`,r+=`    DB "${Q.text}", 0
`;break}case"Music":{const C=typeof e.trackAssetId=="string"?e.trackAssetId:"",x=a.trackIndexByAssetId||{},M=a.tracks||[];let L=255,D=255,R=e.loop===!1?0:1,k="";if(e.stop===!0)L=0,R=0;else if(e.autoPlay===!1)k="; WARNING: Music node autoPlay=false -> no-op in ROM";else if(C&&x[C]!==void 0)L=1,D=x[C];else if(C){const P=M.find(T=>(T==null?void 0:T.id)===C);(P==null?void 0:P.soundChip)==="SCC"?k=`; WARNING: Track "${C}" uses SCC and is ignored in ROM export`:k=`; WARNING: Track "${C}" not found / not exportable as PSG`}else k="; WARNING: Music node has no trackAssetId -> no-op";r+=`    db ${L}, ${D}, ${R}    ; command, track index, loop flag
`,k&&(r+=`    ${k}
`);break}case"IfThenElse":const A=e.variableName||"unknown",g=ra(A,a),S=e.compareValue||0;g?r+=`    dw ${g}    ; Variable to check
`:r+=`    dw 0                 ; WARNING: Missing global variable "${A}"
`,r+=`    db ${S}   ; Compare value
`,r+=`    db 0                 ; Operator (0=equals)
`;break;case"Globals":if(e.variables&&e.variables.length>0){const C=e.variables.map(M=>{const L=M.variableName||M.name||"unknown",D=ra(L,a),R=M.value||0;return{vName:L,vAsmName:D,vValue:R}}).filter(M=>!!M.vAsmName);r+=`    db ${C.length}    ; Number of assignments
`,C.forEach(M=>{r+=`    dw ${M.vAsmName}
`,r+=`    db ${M.vValue}
`});const x=e.variables.length-C.length;x>0&&(r+=`    ; WARNING: ${x} Globals assignment(s) skipped (undefined global variable)
`),C.length===0&&(r+=`    ; No valid global assignments found
`)}else r+=`    db 0    ; No assignments
`;break;case"Transition":{const C={cls:0,dissolve_pixels:1,dissolve_chars:2,vertical_lines:3,horizontal_lines:4,spiral:5,fill_white_squares:6},x={cls:1,dissolve_pixels:8,dissolve_chars:8,vertical_lines:16,horizontal_lines:24,spiral:96,fill_white_squares:4},M=C[e.effect]??0,L=x[e.effect]??8,D=e.duration??1e3,R=Math.max(1,Math.min(255,Math.round(D/L/20)));r+=`    db ${M}              ; Effect: ${e.effect||"cls"}
`,r+=`    db ${R}              ; Frames per step (duration ${D}ms / ${L} steps / 20ms)
`;break}}r+=`
`}r+=`${o}:
`;const _=((b=t.connections)==null?void 0:b.filter(f=>{var A;return(((A=f.from)==null?void 0:A.nodeId)||f.from)===e.id}))||[];if(e.type==="IfThenElse"){const f=_.find(g=>{var S,C;return((S=g.from)==null?void 0:S.sourceId)==="then"||!((C=g.from)!=null&&C.sourceId)}),A=_.find(g=>{var S;return((S=g.from)==null?void 0:S.sourceId)==="else"});r+=`    db CONNECTION_THEN
`,r+=`    dw ${f?`gameflow_node_${me(((E=f.to)==null?void 0:E.nodeId)||f.to)}`:"0"}
`,r+=`    db CONNECTION_ELSE
`,r+=`    dw ${A?`gameflow_node_${me(((w=A.to)==null?void 0:w.nodeId)||A.to)}`:"0"}
`}else if(e.type==="SubMenu")(Array.isArray(e.options)?e.options:[]).slice(0,6).forEach((A,g)=>{var C;const S=_.find(x=>{var M;return((M=x.from)==null?void 0:M.sourceId)===A.id});r+=`    db CONNECTION_OPTION_${g}
`,r+=`    dw ${S?`gameflow_node_${me(((C=S.to)==null?void 0:C.nodeId)||S.to)}`:"0"}
`});else{const f=_[0];r+=`    db CONNECTION_DEFAULT
`,r+=`    dw ${f?`gameflow_node_${me(((v=f.to)==null?void 0:v.nodeId)||f.to)}`:"0"}
`}return r+=`    db CONNECTION_END

`,e.type==="Start"&&(r+=to(e,l,a)),r}function to(e,t,a){let l=`; ------------------------------------------------------------------
; ${t}_init
; Initialization routine for Start node
; Initializes global variables and MSX systems
; ------------------------------------------------------------------
${t}_init:
`;const o=e.initializeGlobals,n=e.systemConfig;return l+=`    ; === Core Game Systems Initialization (ALWAYS required) ===
`,l+=`    call init_game_systems

`,n&&(l+=`    ; === MSX System Initialization ===
`,n.initPSG&&(l+=`    ; Initialize PSG (silence all channels)
`,l+=`    call init_psg_silence

`),n.clearSprites&&(l+=`    ; Clear sprite attribute table
`,l+=`    call clear_sprite_table

`),n.clearVRAM&&(l+=`    ; Clear VRAM areas
`,l+=`    call clear_vram_areas

`),n.resetVDP&&(l+=`    ; Reset VDP registers to default
`,l+=`    call reset_vdp_registers

`)),o&&o.enabled&&(l+=`    ; === Global Variables Initialization ===
`,o.variables&&o.variables.length>0?o.variables.forEach(i=>{const r=String((i==null?void 0:i.variableName)||"").trim();if(!r)return;const _=Array.isArray(a.globalVariables)?a.globalVariables:[],d=r.toLowerCase(),c=_.find(h=>{const y=String((h==null?void 0:h.name)||"").trim().toLowerCase(),b=String((h==null?void 0:h.asmName)||"").trim().toLowerCase();return y===d||b===d}),s=String((c==null?void 0:c.name)||r),p=String((c==null?void 0:c.asmName)||`global_var_${s.replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`),m=String((c==null?void 0:c.type)||"").toLowerCase();let u=0;if(typeof i.value=="boolean")u=i.value?1:0;else{const h=Number(i.value);u=Number.isFinite(h)?Math.trunc(h):0}if(m==="word"||m==="16bit"){const h=Math.max(0,Math.min(65535,u));l+=`    ld a, ${h&255}
`,l+=`    ld (${p}), a    ; ${s} low byte = ${h}
`,l+=`    ld a, ${h>>8&255}
`,l+=`    ld (${p}+1), a    ; ${s} high byte = ${h}
`}else{const h=Math.max(0,Math.min(255,u));l+=`    ld a, ${h}
`,l+=`    ld (${p}), a    ; ${s} = ${h}
`}}):(l+=`    ; Initialize all global variables to default values
`,l+=`    call init_all_global_variables
`),l+=`
`),n&&n.initialDelayFrames&&n.initialDelayFrames>0&&(l+=`    ; Initial delay
`,l+=`    ld b, ${n.initialDelayFrames}
`,l+=`.delay_loop:
`,l+=`    halt    ; Wait for V-blank
`,l+=`    djnz .delay_loop

`),l+=`    ret

`,l}function ao(e,t){const a=Rt(e),l=a.length>0,o=Ge(a,"gf_default_start_hud",!0),n=Ge(a,"gf_default_loop_hud"),i=Dt(e,t),r=e.screenMaps&&e.screenMaps.length>0?e.screenMaps[0]:null,_=r?Zl(r):null;return`; ==================================================================
; DEFAULT GAMEFLOW (No GameFlow defined in project)
; ==================================================================

gameflow_init:
    ret

gameflow_start:
    ; Load first available screen/world
${r?`    call ${Kl(r)}
`:`    ; No screens available
`}${_?`    ; Draw imported HUD frame once at game start
    call ${_}
`:""}
${l?`    ; Bootstrap HUD only on screens that define HUD elements
${o}`:""}    ret

gameflow_world_game_loop:
    halt                            ; Frame sync at loop start (V-Blank edge)
${i}    call update_sprites_to_vram     ; Frame-paced SAT upload (outside ISR)
    ; Animated transform tiles do VRAM read-modify-write, so update them
    ; near the V-Blank edge before the expensive gameplay work.
    call update_animated_tiles
    ; Poll input in main loop (avoids BIOS-in-ISR compatibility issues)
    call task_update_input
    call check_world_screen_transition
    call update_all_entities
    call execute_all_state_machines
${l?`    ; Render HUD only on screens that define HUD elements
${n}
`:""}
    jp gameflow_world_game_loop

; gameflow_exit_requested is allocated in variables.asm (RAM EQU)

; ==================================================================
; END OF DEFAULT GAMEFLOW
; ==================================================================
`}function lo(e,t){return`; ==================================================================
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

; 3.5. Mapper runtime API
include "mapper.asm"

; 3.6. Interrupt System (Konami-style task system)
include "interrupt.asm"

; 4. ROM Header (depends on variables and interrupt system)
include "header.asm"

${t.tiles&&t.tiles.length>0?`; 5. Pattern Data (if tiles exist)
include "patterns.asm"

; 6. Color Data (if tiles exist)
include "colors.asm"
`:""}

${t.sprites&&t.sprites.length>0?`; 7. Sprite Data (if sprites exist)
include "sprites.asm"
`:""}

; 8. Components (game logic)
include "components.asm"

; 9. Entities (game objects)
include "entities.asm"

${t.worldmaps&&t.worldmaps.length>0?`; 10. Worlds (world maps)
include "worlds.asm"
`:""}

${t.screenMaps&&t.screenMaps.length>0?`; 11. Screen Maps (if screens exist)
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

${t.stateMachines&&t.stateMachines.length>0?`; 16. State Machines (entity AI)
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
    end                 ; End of assembly
`}function oo(e){return e==="ascii8"?{regP1:"#6000",regP2:"#6800",regP3:"#7000",regP4:"#7800",notes:["; ASCII8 register mapping (MSX Wiki ROM mappers):",";   4000-5FFF <- 6000h",";   6000-7FFF <- 6800h",";   8000-9FFF <- 7000h",";   A000-BFFF <- 7800h"]}:e==="ascii16"?{regP1:"#6000",regP2:"#6000",regP3:"#7000",regP4:"#7000",notes:["; ASCII16 register mapping (MSX Wiki ROM mappers):",";   4000-7FFF <- 6000h (P1/P2 share one 16KB register)",";   8000-BFFF <- 7000h (P3/P4 share one 16KB register)"]}:{regP1:"#6000",regP2:"#8000",regP3:"#A000",regP4:"#A000",notes:["; Konami (without SCC) write window references:",";   6000h-7FFFh, 8000h-9FFFh, A000h-BFFFh are switch registers.","; Note: in original Konami cartridges 4000h-5FFFh is typically fixed."]}}function no(e={}){const t=e.targetFormat||"konami",a=e.romMode||"simple32k",l=e.autoMegaROM??!1,o=a==="megarom"||a==="auto"&&l;if(!o)return`; ==================================================================
; MAPPER RUNTIME API
; File: mapper.asm
; Description: Minimal compatibility stubs for simple32k builds
; Target mapper: ${t}
; ROM mode: ${a} (autoMegaROM=${l?"true":"false"})
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
`;const n=oo(t),i=o?"; Mapper register writes are enabled for this build configuration.":"; Mapper register writes are disabled (simple32k mode).";return`; ==================================================================
; MAPPER RUNTIME API
; File: mapper.asm
; Description: Centralized mapper register writes (no scattered inline writes)
; Target mapper: ${t}
; ROM mode: ${a} (autoMegaROM=${l?"true":"false"})
; ==================================================================

${n.notes.join(`
`)}
${i}

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
`}function ro(e){var t;return!e.tiles||e.tiles.length===0?`; ==================================================================
; PATTERN DATA (EMPTY - NO TILES DETECTED)
; File: patterns.asm
; ==================================================================

; No tiles detected in project - file generated as placeholder
`:`; ==================================================================
; TILE PATTERN DATA
; File: patterns.asm
; Description: Tile pattern definitions for MSX Screen 2
; ${((t=e.tiles)==null?void 0:t.length)||0} tiles detected
; ==================================================================

PATTERN_DATA_BANK EQU ((tile_pattern_bank0 - #4000) / #2000)

; ==================================================================
; TILE PATTERN BANK 0 (Base patterns)
; ==================================================================
tile_pattern_bank0:
${e.tiles.map((a,l)=>{const o=At(a,"SCREEN 2 (Graphics I)"),n=Math.ceil(a.width/8),i=Math.ceil(a.height/8),r=n*i;(a.width%8!==0||a.height%8!==0)&&console.warn(`⚠️  Tile ${a.name} size ${a.width}x${a.height} is not multiple of 8px - may cause visual artifacts`);const _=Array.from(o).map(c=>`#${c.toString(16).padStart(2,"0").toUpperCase()}`);let d="";if(r>1){d=`
    ; Character layout: ${n}×${i} grid`;for(let c=0;c<i;c++){d+=`
    ; Row ${c}: `;for(let s=0;s<n;s++){const p=c*n+s;d+=`Char${p} `}}}return`    ; Tile ${l}: ${a.name} (${a.width}x${a.height}px = ${n}×${i} chars = ${r} MSX characters)${d}
    db ${_.join(", ")}
`}).join("")}

; ==================================================================
; PATTERN LOADING FUNCTIONS
; ==================================================================
load_pattern_bank0:
    ; Load pattern bank 0 to VRAM (base patterns)
    ; Fast direct port access (no BIOS overhead)
    call mapper_push_p2
    ld a, PATTERN_DATA_BANK
    call mapper_set_bank_p2
    ld hl, tile_pattern_bank0
    ld de, CHRTBL2 + (128 * 8)    ; VRAM pattern table bank 0 (start at char 128)
    ld bc, ${e.tiles.reduce((a,l)=>{const o=Math.ceil(l.width/8),n=Math.ceil(l.height/8);return a+o*n*8},0)}    ; Total bytes for all tile characters (16x16 tiles = 4 chars each)
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
    call mapper_pop_p2
    ret

load_pattern_bank1:
    ; Load pattern bank 1: same patterns as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
    call mapper_push_p2
    ld a, PATTERN_DATA_BANK
    call mapper_set_bank_p2
    ld hl, tile_pattern_bank0     ; Same source as Bank 0
    ld de, CHRTBL2 + #800 + (128 * 8) ; VRAM pattern table bank 1 (+#800 offset + char 128)
    ld bc, ${e.tiles.reduce((a,l)=>{const o=Math.ceil(l.width/8),n=Math.ceil(l.height/8);return a+o*n*8},0)}    ; Total bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
    call mapper_pop_p2
    ret

load_pattern_bank2:
    ; Load pattern bank 2: same patterns as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
    call mapper_push_p2
    ld a, PATTERN_DATA_BANK
    call mapper_set_bank_p2
    ld hl, tile_pattern_bank0     ; Same source as Bank 0
    ld de, CHRTBL2 + #1000 + (128 * 8) ; VRAM pattern table bank 2 (+#1000 offset + char 128)
    ld bc, ${e.tiles.reduce((a,l)=>{const o=Math.ceil(l.width/8),n=Math.ceil(l.height/8);return a+o*n*8},0)}    ; Total bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
    call mapper_pop_p2
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
`}function io(e){var t;return!e.tiles||e.tiles.length===0?`; ==================================================================
; COLOR DATA (EMPTY - NO TILES DETECTED)
; File: colors.asm
; ==================================================================

; No tiles detected in project - file generated as placeholder
`:`; ==================================================================
; TILE COLOR DATA
; File: colors.asm
; Description: Tile color definitions for MSX Screen 2
; ${((t=e.tiles)==null?void 0:t.length)||0} tiles detected
; ==================================================================

COLOR_DATA_BANK EQU ((tile_color_bank0 - #4000) / #2000)

; ==================================================================
; TILE COLOR BANK 0 (Base colors)
; ==================================================================
tile_color_bank0:
${e.tiles.map((a,l)=>{const o=Tt(a),n=o?Array.from(o).map(i=>`#${i.toString(16).padStart(2,"0").toUpperCase()}`):["#F0","#F0","#F0","#F0","#F0","#F0","#F0","#F0"];return`    ; Tile ${l}: ${a.name} colors (fg/bg pairs)
    db ${n.join(", ")}
`}).join("")}

; ==================================================================
; COLOR LOADING FUNCTIONS
; ==================================================================
load_color_bank0:
    ; Load color bank 0 to VRAM (base colors)
    ; Fast direct port access (no BIOS overhead)
    call mapper_push_p2
    ld a, COLOR_DATA_BANK
    call mapper_set_bank_p2
    ld hl, tile_color_bank0
    ld de, CLRTBL2 + (128 * 8)    ; VRAM color table bank 0 (start at char 128)
    ld bc, ${e.tiles.reduce((a,l)=>{const o=Math.ceil(l.width/8),n=Math.ceil(l.height/8);return a+o*n*8},0)}     ; Total color bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
    call mapper_pop_p2
    ret

load_color_bank1:
    ; Load color bank 1: same colors as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
    call mapper_push_p2
    ld a, COLOR_DATA_BANK
    call mapper_set_bank_p2
    ld hl, tile_color_bank0       ; Same source as Bank 0
    ld de, CLRTBL2 + #800 + (128 * 8) ; VRAM color table bank 1 (+#800 offset + char 128)
    ld bc, ${e.tiles.reduce((a,l)=>{const o=Math.ceil(l.width/8),n=Math.ceil(l.height/8);return a+o*n*8},0)}     ; Total color bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
    call mapper_pop_p2
    ret

load_color_bank2:
    ; Load color bank 2: same colors as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
    call mapper_push_p2
    ld a, COLOR_DATA_BANK
    call mapper_set_bank_p2
    ld hl, tile_color_bank0       ; Same source as Bank 0
    ld de, CLRTBL2 + #1000 + (128 * 8) ; VRAM color table bank 2 (+#1000 offset + char 128)
    ld bc, ${e.tiles.reduce((a,l)=>{const o=Math.ceil(l.width/8),n=Math.ceil(l.height/8);return a+o*n*8},0)}     ; Total color bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
    call mapper_pop_p2
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
`}const Ke=8192,so=new Set(["header.asm","bios.asm","constants.asm","variables.asm","mapper.asm","interrupt.asm","main.asm","unitedFiles.asm"]);function co(e){const t=e.trim().toLowerCase();return t?/^\d+$/.test(t)?parseInt(t,10):/^#([0-9a-f]+)$/.test(t)?parseInt(t.slice(1),16):/^0x([0-9a-f]+)$/.test(t)?parseInt(t.slice(2),16):/^([0-9a-f]+)h$/.test(t)?parseInt(t.slice(0,-1),16):null:null}function _o(e){let t=0;const a=e.split(/\r?\n/);for(const l of a){const o=l.split(";")[0].trim();if(!o)continue;const n=o.match(/^db\s+(.+)$/i);if(n){t+=n[1].split(",").filter(_=>_.trim().length>0).length;continue}const i=o.match(/^dw\s+(.+)$/i);if(i){t+=i[1].split(",").filter(_=>_.trim().length>0).length*2;continue}const r=o.match(/^ds\s+(.+)$/i);if(r){const _=co(r[1]);_!==null&&_>0&&(t+=_)}}return t}function po(e){if(!e)return 0;const t=_o(e),a=new TextEncoder().encode(e).length,l=Math.floor(a*.28);return Math.max(t,l)}function ho(e){const t=Object.entries(e).filter(([r,_])=>!!_&&!so.has(r)).map(([r,_])=>({moduleName:r,estimatedBytes:po(_)})).filter(r=>r.estimatedBytes>0),a=[];let l=0,o=0,n=0;for(const r of t){let _=r.estimatedBytes,d=0;const c=Math.max(1,Math.ceil(r.estimatedBytes/Ke));for(;_>0;){const s=Ke-o,p=Math.min(_,s);a.push({moduleName:r.moduleName,chunkBytes:p,bankIndex:l,bankOffset:o,segmentIndex:d,totalSegments:c}),_-=p,n+=p,o+=p,d++,o>=Ke&&(l++,o=0)}}const i=n===0?0:o===0?l:l+1;return{bankSize:Ke,totalEstimatedBytes:n,banksUsed:i,entries:a}}function uo(e){const t=[];if(t.push("; ------------------------------------------------------------------"),t.push("; 8KB BANK PACKER ESTIMATE (diagnostic placement view)"),t.push("; Runtime bank constants are derived from label addresses at assemble time."),t.push(`; Estimated payload bytes: ${e.totalEstimatedBytes}`),t.push(`; Estimated banks used: ${e.banksUsed}`),t.push("; ------------------------------------------------------------------"),e.entries.length===0)return t.push("; No banked payload candidates detected."),t.join(`
`);for(const a of e.entries){const l=a.bankOffset.toString(16).toUpperCase().padStart(4,"0"),o=a.totalSegments>1?` part ${a.segmentIndex+1}/${a.totalSegments}`:"";t.push(`; BANK ${a.bankIndex.toString().padStart(2,"0")} @#${l} : ${a.moduleName}${o} (${a.chunkBytes} bytes)`)}return t.join(`
`)}function mo(e){const t=e.tasks.length>0?e.tasks.map(o=>`; IRQ Task: slot ${o.slot} -> ${o.routineLabel} (${o.responsibility}, every ${o.period} frame${o.period===1?"":"s"})`).join(`
`):"; IRQ Task: none",a=e.mainline.length>0?e.mainline.map(o=>`; Mainline: ${o.phase} -> ${o.routineLabel} (${o.responsibility})`).join(`
`):"; Mainline: none",l=e.diagnostics.warnings.length>0?e.diagnostics.warnings.map(o=>`; Warning: ${o}`).join(`
`):"; Warning: none";return`; Engine Execution Mode: ${e.mode}
${t}
${a}
${l}
`}function bo(e,t,a,l,o={romMode:"simple32k",targetFormat:"konami",autoMegaROM:!1}){var p,m,u,h,y,b,E,w,v;const n=(m=(p=a.gameFlow)==null?void 0:p.nodes)==null?void 0:m.some(f=>f.type==="SubMenu"),i=(u=a.screenMaps)==null?void 0:u.some(f=>{var A,g;return((A=f.layers)==null?void 0:A.text)||((g=f.textElements)==null?void 0:g.length)>0}),r=(h=a.screenMaps)==null?void 0:h.some(f=>{var A;return((A=f.hudConfiguration)==null?void 0:A.elements)&&f.hudConfiguration.elements.length>0}),_=n||i||r,d=ho(e),c=uo(d),s=mo(l);return`; ==================================================================
; ${t.toUpperCase()} - UNIFIED FILE
; File: unitedFiles.asm
; Description: All-in-one file combining all modular files
; Generated by Mideas MSX Modular Generator
;
; OPTIMIZED: Only includes necessary code for this project
; Tiles: ${((y=a.tiles)==null?void 0:y.length)||0}
; Sprites: ${((b=a.sprites)==null?void 0:b.length)||0}
; Screens: ${((E=a.screenMaps)==null?void 0:E.length)||0}
; Entities: ${((w=a.entities)==null?void 0:w.length)||0}
; Menus: ${n?"Yes":"No"}
; HUD: ${r?"Yes":"No"}
; State Machines: ${((v=a.stateMachines)==null?void 0:v.length)||0}
; ROM Mode: ${o.romMode}
; Mapper Target: ${o.targetFormat}
; Auto MegaROM: ${o.autoMegaROM?"Yes":"No"}
${s}; ==================================================================
${o.romMode==="plain48k"?`; EXPERIMENTAL: plain48k plumbing is enabled, but page-0 asset packing is not implemented yet.
`:""}${c}

; CRITICAL: header.asm with ORG #4000 and "AB" signature MUST be first
; for the ROM to work correctly. EQUs can go after ORG.
${e["header.asm"]}

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

${a.screenMaps&&a.screenMaps.length>0?e["screens.asm"]:`; [screens.asm skipped - no screens]
`}

${e["components.asm"]}

${a.entities&&a.entities.length>0?e["entities.asm"]:`; [entities.asm skipped - no entities]
`}

${n?e["menus.asm"]:`; [menus.asm skipped - no menus]
`}

${_?e["font.asm"]:`; [font.asm skipped - no text/menus]
init_font_system:
    ret

`}

${r?e["hud.asm"]:`; [hud.asm skipped - no HUD elements]
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
`}${r?`    ; HUD dirty flag - will be rendered after screen loading (by GameFlow WorldLink)
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

    end                 ; End of assembly
`}const st={comp_pos:"Position",comp_position:"Position",comp_render:"Sprite",comp_sprite:"Sprite",comp_movement:"Movement",comp_velocity:"Movement",comp_collision:"Collision",comp_wall_collision:"WallCollision",comp_player_input:"Input",comp_input:"Input",comp_ai_behavior:"Behavior",comp_behavior:"Behavior",comp_health:"Health",comp_animation:"Animation",comp_gravity:"Gravity",comp_jump:"Jump",comp_damage:"Damage",comp_deadly_tiles:"DeadlyTiles",comp_statemachine:"StateMachine",comp_cursors:"Cursors",comp_carry:"Carry",comp_collectible:"Collectible",comp_patrol:"Patrol"};function fo(e,t){var i,r,_;const a=(i=t==null?void 0:t.components)==null?void 0:i.find(d=>d.definitionId==="comp_sprite"||d.definitionId==="comp_render");if(!a)return;const l=a.defaultValues||{},o=((r=e.componentOverrides)==null?void 0:r.comp_sprite)||((_=e.componentOverrides)==null?void 0:_.comp_render)||{},n={...l,...o};return n.spriteId||n.spriteAssetId||n.sprite||n.spriteName}function We(e){var n;const t=new Set,a=new Set,l=[],o=new Map;return console.log("🔍 Analyzing component usage..."),console.log(`📊 Total entities in project: ${((n=e.entities)==null?void 0:n.length)||0}`),e.entities&&e.entities.length>0&&e.entities.forEach(i=>{console.log(`  - Entity: ${i.name} (template: ${i.entityTemplateId})`),l.push(i),i.entityTemplateId&&a.add(i.entityTemplateId)}),console.log(`✅ Active entities: ${l.length}`),console.log(`✅ Used templates: ${Array.from(a).join(", ")}`),l.forEach((i,r)=>{var s;const _=i.name||i.id,d=i.id||i.name||`entity_${r}`,c=(s=e.templates)==null?void 0:s.find(p=>p.id===i.entityTemplateId);c?(console.log(`  📦 Analyzing template "${c.name}" for entity "${_}"`),c.components&&Array.isArray(c.components)&&c.components.forEach(p=>{const m=p.definitionId||p.componentDefinitionId;if(m){const u=st[m]||m;console.log(`    - Component: ${m} → ${u}`),t.add(u),o.has(u)||o.set(u,new Set),o.get(u).add(d)}}),i.componentOverrides&&Object.keys(i.componentOverrides).forEach(p=>{const m=st[p]||p;console.log(`    - Override: ${p} → ${m}`),t.add(m),o.has(m)||o.set(m,new Set),o.get(m).add(d)})):console.warn(`  ⚠️  Template "${i.entityTemplateId}" not found for entity "${_}"`)}),console.log("📊 Component usage summary:"),console.log(`  - Total used components: ${t.size}`),t.forEach(i=>{const r=o.get(i);console.log(`    • ${i}: ${(r==null?void 0:r.size)||0} entities`)}),{usedComponents:t,usedTemplates:a,activeEntities:l,componentToEntitiesMap:o}}function ia(e,t,a){var i;let l=0;const o={Position:0,Sprite:1,Movement:2,Collision:3,Input:4,Behavior:5,Health:6,Animation:7,Jump:8,Gravity:9,DeadlyTiles:13};let n=!1;if(t&&t.components&&t.components.forEach(r=>{const _=r.definitionId||r.componentDefinitionId,d=st[_];d&&o[d]!==void 0&&(l|=1<<o[d],d==="Sprite"&&(n=!0)),d==="Patrol"&&(l|=1<<o.Movement)}),e.componentOverrides&&Object.keys(e.componentOverrides).forEach(r=>{const _=st[r];_&&o[_]!==void 0&&(l|=1<<o[_],_==="Sprite"&&(n=!0))}),l|=1<<o.Position,n)l|=1<<o.Sprite;else{const r=fo(e,t);r&&((i=a.sprites)==null?void 0:i.some(d=>d.id===r||d.name===r))&&(l|=1<<o.Sprite)}return l}const yo=224,Eo="hex",$a=e=>{var n;const t=(e==null?void 0:e.spritePalette)||[],a=e==null?void 0:e.backgroundColor,l=(e==null?void 0:e.frames)||[];if(!t.length||!l.length)return[];const o=[];for(let i=0;i<t.length;i++){const r=t[i];if(!r||r===a)continue;let _=!1;for(const d of l)if(d!=null&&d.data){for(let c=0;c<(d.data.length||0)&&!_;c++)for(let s=0;s<(((n=d.data[c])==null?void 0:n.length)||0)&&!_;s++)d.data[c][s]===r&&(_=!0);if(_)break}_&&o.push(i)}return o},sa=e=>{const t=$a(e);return t.length>0?t[0]:-1};function go(e){var x,M,L;const t=e.sprites||[],a=vt(t),l=a.sprites,o=a.nameToIndex,n=a.directionalLookupTables;a.warnings.forEach(D=>{console.warn(`[Sprites Generator] ${D}`)}),console.log("🎨 generateSpritesFile() called:"),console.log(`  - analysis.sprites.length: ${t.length}`),console.log(`  - expandedSprites.length: ${l.length}`),console.log(`  - analysis.entities.length: ${((x=e.entities)==null?void 0:x.length)||0}`),console.log(`  - analysis.templates.length: ${((M=e.templates)==null?void 0:M.length)||0}`);const{activeEntities:i}=We(e);console.log(`  - activeEntities.length: ${i.length}`);const r=D=>{if(!D||D.startsWith("rgba"))return null;const R=D.replace("#","");return R.length!==6?null:{r:parseInt(R.substring(0,2),16),g:parseInt(R.substring(2,4),16),b:parseInt(R.substring(4,6),16)}},_=D=>{if(!D)return 0;const R=oe.find($=>$.hex.toUpperCase()===D.toUpperCase());if(R)return R.index;const k=r(D);if(!k)return 15;let P=15,T=1/0;for(const $ of oe){if($.index===0)continue;const U=r($.hex);if(!U)continue;const G=(k.r-U.r)**2+(k.g-U.g)**2+(k.b-U.b)**2;G<T&&(T=G,P=$.index)}return P},d=D=>{if(!D)return[15];const R=D.spritePalette||[],k=D.backgroundColor,P=$a(D);if(P.length===0)return[15];const T=P.map($=>{const U=R[$];return!U||k&&U===k?0:_(U)});return T.length>0?T:[15]},c=(D,R)=>{let k=`${D}:
`;if(R.length===0)return k+=`    db 0
`,k;const P=16;for(let T=0;T<R.length;T+=P){const $=R.slice(T,T+P);k+=`    db ${$.join(", ")}
`}return k},s=D=>{var $,U,G,J,ue,Q;console.log(`
🔍 getEntitySpriteInfo for entity: "${D.name}" (template: ${D.entityTemplateId})`),console.log(`   Available sprites: ${l.map(j=>`"${j.name}" (${j.id})`).join(", ")||"NONE"}`);const R=($=e.templates)==null?void 0:$.find(j=>j.id===D.entityTemplateId);if(!R)return console.log("   ❌ Template not found!"),null;console.log(`   Template found: "${R.name}"`),console.log(`   Template components: ${((U=R.components)==null?void 0:U.map(j=>j.definitionId).join(", "))||"NONE"}`);const k=e.components||[];let P;if(D.componentOverrides)for(const j in D.componentOverrides){const W=k.find(X=>X.id===j),te=(G=W==null?void 0:W.properties)==null?void 0:G.find(X=>X.type==="sprite_ref");if(te&&((J=D.componentOverrides[j])!=null&&J[te.name])){P=D.componentOverrides[j][te.name],console.log(`   ✅ Found spriteAssetId in overrides: "${P}"`);break}}if(!P)for(const j of R.components||[]){const W=k.find(X=>X.id===j.definitionId),te=(ue=W==null?void 0:W.properties)==null?void 0:ue.find(X=>X.type==="sprite_ref");if(te&&((Q=j.defaultValues)!=null&&Q[te.name])){P=j.defaultValues[te.name],console.log(`   ✅ Found spriteAssetId in template defaults: "${P}"`);break}}if(console.log(`   Resolved spriteAssetId: "${P||"undefined"}"`),!P)return console.log("   ⚠️ No sprite_ref property found in any component"),l.length>0?(console.log(`   ⚠️ Defaulting to first sprite "${l[0].name}"`),{spriteAssetIndex:0,spriteName:l[0].name,colors:d(l[0])}):null;let T=o[P];if(T===void 0&&(T=o[P.toLowerCase()]),T===void 0){const j=P.toLowerCase();T=l.findIndex(W=>{var te,X;return((te=W.name)==null?void 0:te.toLowerCase().includes(j))||j.includes(((X=W.name)==null?void 0:X.toLowerCase())||"")})}return T!==void 0&&T>=0?(console.log(`   ✅ Found sprite "${l[T].name}" at index ${T}`),{spriteAssetIndex:T,spriteName:l[T].name,colors:d(l[T])}):(console.log(`   ❌ Sprite "${P}" not found in project assets`),{spriteAssetIndex:-1,spriteName:`MISSING_${P}`,colors:[15]})},p=[];let m=0;i.forEach((D,R)=>{const k=s(D);if(!k){p.push({entityIndex:R,spriteName:"PLACEHOLDER",spriteAssetIndex:-1,baseHwSpriteIndex:m,layerCount:1,colors:[15]}),m+=1;return}p.push({entityIndex:R,spriteName:k.spriteName,spriteAssetIndex:k.spriteAssetIndex,baseHwSpriteIndex:m,layerCount:k.colors.length,colors:k.colors}),m+=k.colors.length});const u=32,E=(((L=e.gameFlow)==null?void 0:L.nodes)||[]).some(D=>{var R;return D.type==="SubMenu"&&((R=D.appearance)==null?void 0:R.cursorSpriteAssetId)})?28+4:Math.max(1,Math.min(m,u)),w=Math.min(E<u?E+1:u,u),v=w*4;let f=`; ==================================================================
; SPRITE DATA
; File: sprites.asm
; Description: Sprite pattern and animation data
; Entities: ${i.length}
; Total Hardware Sprites (Layers): ${u}
; SAT Upload Sprites per frame: ${w}
; ==================================================================

; ==================================================================
; SPRITE PATTERN DATA
; ==================================================================
`;l.forEach((D,R)=>{const k=`_${R}`,T=(D.name+k).replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase(),$=rl(D,Eo,R),U=sa(D);f+=`
; Sprite Asset ${R}: ${D.name}
${$}`,U>=0?f+=`
; Unified pattern label for sprite ${R}
SPRITE_${R}_PATTERN EQU ${T}_F0_LAYER${U}
SPRITE_${R}_PATTERN_BANK EQU ((SPRITE_${R}_PATTERN - #4000) / #2000)
`:f+=`
; WARNING: No valid pattern layers found for sprite ${R}
SPRITE_${R}_PATTERN:
    db 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0
SPRITE_${R}_PATTERN_BANK EQU ((SPRITE_${R}_PATTERN - #4000) / #2000)
`}),f+=`
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

`,l.length===0&&(f+=`; No sprite assets found - using placeholder pattern only 
SPRITE_0_PATTERN EQU SPRITE_PLACEHOLDER_PATTERN
SPRITE_0_PATTERN_BANK EQU ((SPRITE_0_PATTERN - #4000) / #2000)
`),f+=`
; ==================================================================
; SPRITE ANIMATION METADATA TABLES
; ==================================================================

; Table: Sprite Asset Frame Counts
; Format: db frame_count
sprite_asset_frame_count:
`,l.forEach((D,R)=>{var P;const k=((P=D.frames)==null?void 0:P.length)||1;f+=`    db ${k} ; Sprite ${R}: ${D.name}
`}),l.length===0&&(f+=`    db 1 ; Placeholder
`),f+=`SPRITE_ASSET_COUNT EQU ${Math.max(1,l.length)}
`,f+=`
; Table: Sprite Asset Loop Flags
; Format: db flags (bit 1: 1=loop, 0=once)
sprite_loop_flags:
`,l.forEach((D,R)=>{const P=D.loops!==!1?"2":"0";f+=`    db ${P} ; Sprite ${R}: ${D.name}
`}),l.length===0&&(f+=`    db 2 ; Placeholder (loops by default)
`),f+=`
; Table: Sprite Asset Frame Pointer List Table
; Format: dw SPRITE_<id>_FRAME_PTRS
sprite_asset_frame_ptr_table:
`,l.forEach((D,R)=>{f+=`    dw SPRITE_${R}_FRAME_PTRS
`}),l.length===0&&(f+=`    dw SPRITE_0_FRAME_PTRS
`),l.forEach((D,R)=>{var G;const k=`_${R}`,T=(D.name+k).replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase(),$=sa(D),U=((G=D.frames)==null?void 0:G.length)||1;f+=`
; Sprite ${R}: ${D.name} frame pointers
SPRITE_${R}_FRAME_PTRS:
`;for(let J=0;J<U;J++)$>=0?f+=`    dw ${T}_F${J}_LAYER${$}
`:f+=`    dw SPRITE_PLACEHOLDER_PATTERN
`}),l.length===0&&(f+=`
SPRITE_0_FRAME_PTRS:
    dw SPRITE_PLACEHOLDER_PATTERN
`),f+=`
; ==================================================================
; DIRECTIONAL SPRITE LOOKUP TABLES
; Maps any sprite asset index to its directional variant index.
; If no directional variant exists, table points back to same index.
; ==================================================================
`,f+=c("sprite_dir_left_table",n.left),f+=`
`,f+=c("sprite_dir_right_table",n.right),f+=`
`,f+=c("sprite_dir_up_table",n.up),f+=`
`,f+=c("sprite_dir_down_table",n.down),f+=`
`,f+=` 
; ================================================================== 
; SPRITE CONFIGURATION TABLES 
; ================================================================== 

; Table: Entity Sprite Configuration 
; Format: db base_hw_sprite_index, layer_count 
entity_sprite_config: 
`,p.forEach(D=>{const R=D.baseHwSpriteIndex>=0?D.baseHwSpriteIndex:0;f+=`    db ${R}, ${D.layerCount} ; Entity ${D.entityIndex} (${D.spriteName})
`}),p.length<32&&(f+=`    ds ${(32-p.length)*2}, 0 ; Padding
`),f+=`
; Table: Entity -> Sprite Asset Index (ROM initial values)
; Copied to RAM entity_sprite_asset_index at init
; Format: db sprite_asset_index (#FF = none)
entity_sprite_asset_index_init:
`,p.forEach(D=>{const R=D.spriteAssetIndex>=0?D.spriteAssetIndex:255;f+=`    db #${R.toString(16).toUpperCase().padStart(2,"0")} ; Entity ${D.entityIndex} (${D.spriteName})
`}),p.length<32&&(f+=`    ds ${32-p.length}, #FF ; Padding
`);const A=Math.max(1,...p.map(D=>D.layerCount));f+=`SPRITE_MAX_ENTITY_LAYERS EQU ${A}  ; Max HW sprite layers per entity
`,f+=`
; Table: Hardware Sprite Layer Colors (ROM initial values - copied to RAM at init)
; Format: db color_index
sprite_layer_colors_init:
`;let g=0;p.forEach(D=>{D.layerCount>0&&(f+=`    ; Entity ${D.entityIndex} (${D.spriteName}) layers:
`,D.colors.forEach((R,k)=>{f+=`    db ${R} ; Layer ${k}
`,g+=1}))});const S=u-g;if(S>0&&(f+=`    ds ${S}, 0 ; Padding
`),f+=`
; Table: SM Sprite Layer Colors (for Action_ChangeSprite runtime color update)
; Format: SPRITE_MAX_ENTITY_LAYERS bytes per sprite asset
; Entry[i*SPRITE_MAX_ENTITY_LAYERS + j] = color for HW sprite slot j of sprite i
SM_SpriteLayerColorTable:
`,l.forEach((D,R)=>{const P=[...d(D)];for(;P.length<A;)P.push(0);f+=`    db ${P.join(", ")} ; Sprite ${R}: ${D.name}
`}),l.length===0){const D=Array(A).fill(0);f+=`    db ${D.join(", ")} ; Placeholder
`}f+=`
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
    call load_sprite_patterns
    xor a
    ld (active_sprite_count), a
    ret

load_sprite_patterns:
    ; Load patterns for all active entities
    call mapper_push_p2
`;let C=!1;if(p.forEach(D=>{if(D.layerCount===0)return;const R=D.spriteAssetIndex<0?"SPRITE_PLACEHOLDER_PATTERN":`SPRITE_${D.spriteAssetIndex}_PATTERN`;f+=`    ; Entity ${D.entityIndex}: ${D.spriteName} (${D.layerCount} layers)
    ; Base HW Sprite: ${D.baseHwSpriteIndex}
    ld a, ${R}_BANK
    call mapper_set_bank_p2
    ld hl, ${R}
    ld de, SPRPAT + (${D.baseHwSpriteIndex} * 32)
    ld bc, ${D.layerCount*32} ; Load ${D.layerCount} layers (32 bytes each)
    call FAST_LDIRVM
`,C=!0}),!C)if(l.length===0)f+=`    ; No sprites to load
`;else{f+=`    ; No active entities detected, load all sprite assets sequentially
`;let D=0;l.forEach((R,k)=>{var U;const P=d(R).length||1,T=((U=R.frames)==null?void 0:U.length)||1,$=P*T*32;f+=`    ; Sprite Asset ${k}: ${R.name} (${T} frames, ${P} layers)
    ld a, SPRITE_${k}_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, SPRITE_${k}_PATTERN
    ld de, SPRPAT + (${D} * 32)
    ld bc, ${$}
    call FAST_LDIRVM
`,D+=P*T})}return f+=`    call mapper_pop_p2
    ret

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
    ld b, ${u}
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
SPRITE_INVISIBLE    EQU ${yo}

; ==================================================================
; RAM REQUIREMENTS
; ==================================================================
; sprite_attributes: ds ${u*4}
; active_sprite_count: db 0
; sprites_dirty: db 0
`,f}function So(e,t,a){const l=_=>`    ld hl, ${_}
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
${Y({purpose:"Main ECS tick entrypoint for one frame.",inputs:["Entity/component tables in RAM"],outputs:["Components updated in fixed order"],clobbers:["AF","BC","DE","HL"],preserved:["None (callers should save what they need)"],usage:["Registers are scratch across component CALL chain","Contract intentionally conservative to prevent hidden coupling"],notes:["Do not assume any register survives this routine."]})}
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
`;const n=[["Input","update_input_component","1. Input (player control)"],["Shoot","update_shoot_component","2. Shooting"],["Behavior","update_behavior_component","3. Behavior/AI"],["Patrol","update_entities","3b. Patrol/per-entity update"],["StateMachine","update_statemachine_component","3c. State machine logic"],["Jump","update_jump_component","4. Jump impulse"],["Movement","update_movement_component","5. Movement"],["Cursors","update_cursors_component","5b. Cursors movement"],["Gravity","update_gravity_component","6. Gravity"],["TileInteraction","update_slash_component","6b. Additive slash velocity"],["Position","update_position_component","7. Apply velocity"],["Collision","prepare_platform_detection","8a. Clear platform refs"],["Collision","update_collision_component","8b. Collision detection"],["Collision","update_platform_riding","8c. Platform riding"],["WallCollision","update_wallcollision_component","8d. Wall collision"],["SecretZones","update_secret_zone_component","8e. Secret zone runtime"],["DeadlyTiles","update_deadly_tiles_component","8e. Deadly tiles"],["TileInteraction","check_tile_interaction","8f. Tile interaction (gems/collectibles)"],["Health","update_health_component","9. Health/Death"],["Damage","update_damage_component","10. Damage"],["Animation","update_animation_component","11. Animation"],["AutoDestroy","update_auto_destroy_component","12. Auto-destroy"],["Sprite","update_sprite_component","13. Sprite rendering"]];let i=0;const r=new Set;for(const[_,d,c]of n)if(_==="Position"||_==="Sprite"||(_==="SecretZones"?a:e.has(_))){if(t&&d==="update_statemachine_component")continue;if(!r.has(d)){r.add(d);const u={update_collision_component:"prof_collision_calls",update_wallcollision_component:"prof_wall_calls",update_deadly_tiles_component:"prof_deadly_calls",check_tile_interaction:"prof_tile_interaction_calls",update_animation_component:"prof_animation_calls",update_sprite_component:"prof_sprite_calls"}[d];u&&(o+=l(u)),o+=`    call ${d.padEnd(30)} ; ${c}
`,d==="update_shoot_component"&&(o+=`    ; Shooting may spawn entities, rebuild only if marked dirty
`,o+=`    call ensure_used_entity_list_current
`),i++}}return o+=`    ret
`,o+=`; Total systems called: ${i} (optimized from 16)

`,o+=`
; ------------------------------------------------------------------
; mark_used_entity_list_dirty
; Invalidate compact entity list cache.
; Call this after spawn/despawn or screen-id changes.
; ------------------------------------------------------------------
${Y({purpose:"Mark compact active-entity cache as stale.",inputs:["None"],outputs:["active_entity_list_dirty = 1"],clobbers:["HL"],preserved:["AF","BC","DE"],usage:["HL = points to dirty flag byte"]})}
mark_used_entity_list_dirty:
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ret

; ------------------------------------------------------------------
; ensure_used_entity_list_current
; Rebuild compact list only when marked dirty.
; ------------------------------------------------------------------
${Y({purpose:"Conditionally rebuild compact active list only when dirty.",inputs:["active_entity_list_dirty flag"],outputs:["active_entity_list rebuilt if needed"],clobbers:["AF"],preserved:["BC","DE","HL (except nested call clobbers when rebuild happens)"],usage:["A = dirty flag test and branch"],notes:["If dirty, downstream rebuild_used_entity_list can clobber many registers."]})}
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
${Y({purpose:"Recompute compact list of entities active on current screen.",inputs:["entity_active, entity_comp_masks(_hi), entity_screen_id, current_screen_id"],outputs:["active_entity_list[]","active_entity_count","hero_entity_id updated from first current-screen entity flagged as player","input/render/collision/ground/anim buckets refreshed","active_entity_list_dirty=0"],clobbers:["AF","BC","DE","HL"],preserved:["None"],usage:["B = slots remaining (MAX_ENTITIES..1)","C = entity slot iterator (0..MAX_ENTITIES-1)","DE = index offset (entity id / active list position)","HL = pointer math over component and state arrays","A = predicate checks and counters"]})}
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
`,o}function Ao(){return`
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

position_next_entity:
    dec b
    jp nz, position_update_loop
    ret
`}function To(e){return`
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
    push hl                    ; Save list pointer
    ld e, c
    ld d, 0
    pop hl                     ; Restore list pointer

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
    
    ; Loop through layers
    ; H = Remaining Layers
    ; L = Current HW Sprite
    ; B = X Position
    ; C = Y Position
    
sprite_layer_loop:
    push hl                    ; Save counters
    push bc                    ; Save Position

    ; Calculate Pattern: Pattern = HW Sprite Index * 4 (for 16x16 sprites)
    ld a, l
    sla a                      ; * 2
    sla a                      ; * 4
    ld d, a                    ; D = Pattern (HW index * 4 for 16x16)

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
    
sprite_continue:
    pop hl
    pop bc

sprite_next_entity:
    dec b
    jp nz, sprite_update_loop

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

    ; Calculate Pattern: Pattern = HW Sprite Index * 4 (for 16x16 sprites)
    ld a, l
    sla a                      ; * 2
    sla a                      ; * 4
    ld d, a                    ; D = Pattern (HW index * 4 for 16x16)

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
`}function Co(){return`
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
            dec b
            jp nz, movement_update_loop
    ret
    `}function Io(e){const n=Array.from({length:3},(_,d)=>`    srl a                      ; A = X / ${Math.pow(2,d+1)}`).join(`
`),i=Array.from({length:3},(_,d)=>`    srl a                      ; A = Y / ${Math.pow(2,d+1)}`).join(`
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
${i}
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

        `}function vo(e="simple32k"){return`
    ; ------------------------------------------------------------------
    ; get_behavior_tile
    ; ------------------------------------------------------------------
${Y({purpose:"Read behavior byte for tile at (B=row, C=column) from the runtime behavior map.",inputs:["B = tile row    (0..23, out-of-range → A=0, passable)","C = tile column (0..31, out-of-range → A=0, passable)","current_behavior_map = 16-bit pointer to active screen behavior map","current_behavior_map_bank = memory bank number (mapper context)"],outputs:["A = behavior byte:","  bits 7-4 (A & #F0): family / solidity class (0x00 = NoSolid, 0x10+ = Solid)","  bits 3-0 (A & #0F): flag bits (e.g. 0x08 = Interactable)"],clobbers:["AF"],preserved:["BC","DE","HL"],notes:["Maintains a single-row cache (behavior_cache_row / behavior_cache_row_base)","so consecutive calls for the same row skip the row*32 multiply.","Mapper push/pop protects P2 bank around the map read (no-op in simple32k mode).","MUST be called with DE = entity index already set (DE is preserved, not used)."]})}
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
${e==="simple32k"?`
    ; simple32k: behavior map is always resident in RAM (no bank switching needed).
    ; Skip mapper push/pop/set — saves ~169 cycles per call (41% overhead eliminated).
    ld a, (hl)                    ; A = behavior value (direct RAM read)
`:`
    ; megarom: protect P2 bank around the read in case behavior map is in ROM bank.
    call mapper_push_p2
    ld a, (current_behavior_map_bank)
    call mapper_set_bank_p2
    ld a, (hl)                    ; A = behavior value
    push af
    call mapper_pop_p2
    pop af
`}    pop de
    pop hl
    ret
gbt_oob:
    xor a                         ; A = 0 (passable)
    ret
    `}function wo(){return`
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
    `}function Do(){return`
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
    `}function Ro(){return`
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

gravity_next_entity:
            dec b
            jp nz, gravity_update_loop
    ret
    `}function Lo(){return`
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
    `}function No(){return`
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
    `}function xo(){return`
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
    `}function Mo(){return`
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

    ld b, 32
    ld hl, entity_platform_id
    ld de, entity_platform_grace
    ld c, 0

.platform_clear_loop:
    ld a, (hl)              ; A = platform_id
    cp 255                  ; Check if on a platform
    jr z, .platform_skip_clear ; Already no platform, skip

    ; Entity was on a platform last frame
    ; Set grace frames to 6 (coyote time for leaving platform)
    push hl
    ld a, 6
    ld (de), a              ; Set grace frames
    pop hl

    ; Clear platform reference (collision will reset if still touching)
    ld (hl), 255

.platform_skip_clear:
    inc hl                  ; Next platform_id
    inc de                  ; Next grace counter
    inc c
    djnz .platform_clear_loop
    ret

update_platform_riding:
    ; PHASE 2 - Called AFTER collision detection
    ; Decrement grace frames for entities not on platforms
    ; (Entities on platforms have grace=0, set by handle_entity_collision)

    ld b, 32
    ld hl, entity_platform_grace
    ld de, entity_platform_id
    ld c, 0

.grace_loop:
    ; Check if entity has platform reference
    ld a, (de)              ; A = platform_id
    cp 255
    jr nz, .grace_next      ; Has platform, skip grace decrement

    ; No platform - decrement grace frames if > 0
    ld a, (hl)              ; A = grace frames
    or a
    jr z, .grace_next       ; Already 0, skip

    dec a                   ; Decrement grace
    ld (hl), a

.grace_next:
    inc hl                  ; Next grace counter
    inc de                  ; Next platform_id
    inc c
    djnz .grace_loop
    ret
    `}function ko(){return`
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

        update_animation_component:
            ; Update animations for entities
            ; - Advances entity_anim_frame using entity_anim_tick/entity_anim_speed
            ; - Copies the selected frame's patterns to VRAM for this entity
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
    `}function Po(){return`
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

        jump_next_entity:
            dec b
            jp nz, jump_update_loop
    ret
    `}function Oo(){return`
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
    `}function Uo(){return`
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
    `}function $o(){return`
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
    `}function Fo(e="simple32k"){return`
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
    `}function Bo(e){const t={};return(e||[]).forEach((a,l)=>{const o=typeof(a==null?void 0:a.id)=="string"?a.id:"",n=typeof(a==null?void 0:a.name)=="string"?a.name:"";o&&(t[o]=l,t[o.toLowerCase()]=l),n&&(t[n]=l,t[n.toLowerCase()]=l)}),t}function Ze(e,t){if(typeof e=="number"&&Number.isFinite(e))return Math.max(0,Math.min(255,e|0));if(typeof e=="string"){const a=e.trim();if(!a)return null;const l=t[a];if(l!==void 0)return l;const o=t[a.toLowerCase()];if(o!==void 0)return o;const n=parseInt(a,10);if(!isNaN(n))return Math.max(0,Math.min(255,n))}return null}function qe(e){const t=Number(e);return!Number.isFinite(t)||t<=0?0:Math.max(0,Math.min(65535,Math.round(t)))}function Je(e){const t=Number(e);return!Number.isFinite(t)||t<=0?0:Math.max(0,Math.min(255,Math.round(t)))}function jo(e){const t={};if(!e||e.length===0)return t;let a=128;return e.forEach(l=>{if(!l||!l.id)return;t[l.id]=a,l.name&&(t[String(l.name)]=a,t[String(l.name).toLowerCase()]=a);const o=Math.max(1,Math.ceil((Number(l.width)||8)/8)),n=Math.max(1,Math.ceil((Number(l.height)||8)/8));a+=o*n}),t}function Ne(e,t){if(typeof e=="string"&&t){if(t[e]!==void 0)return t[e];const l=e.toLowerCase();if(t[l]!==void 0)return t[l]}const a=parseInt(String(e??""),10);return Number.isNaN(a)?0:Math.max(0,Math.min(255,a|0))}function Ho(e){const t={},a=Array.isArray(e.globalVariables)?e.globalVariables:[];for(const l of a){const o=typeof(l==null?void 0:l.name)=="string"?l.name.trim():"",n=typeof(l==null?void 0:l.asmName)=="string"?l.asmName.trim():"";if(!o||!n)continue;const i=String((l==null?void 0:l.type)||"").toLowerCase(),r=i==="word"||i==="16bit";t[o]={asmName:n,isWord:r},t[o.toLowerCase()]={asmName:n,isWord:r},t[n]={asmName:n,isWord:r},t[n.toLowerCase()]={asmName:n,isWord:r}}return t}function da(e,t){if(typeof e!="string")return null;const a=e.trim();return a&&(t[a]||t[a.toLowerCase()])||null}function ca(e){return!e||e.isEnabled===!1||e.isEnabled==="false"?null:{collectionSoundId:e.collectionSoundId,replacementTileId:e.replacementTileId,targetVariable:e.targetVariable??e.scoreVariable??e.scoreVariableName,incrementAmount:e.incrementAmount??e.scoreAmount??e.collectionValue??0,bonusTileId:e.bonusTileId,bonusReplacementTileId:e.bonusReplacementTileId,bonusSoundId:e.bonusSoundId,bonusIsPersistent:e.bonusIsPersistent,bonusEntityEffect:e.bonusEntityEffect,bonusEffectAmount:e.bonusEffectAmount,bonusSlashStrength:e.bonusSlashStrength,bonusRespawnSeconds:e.bonusRespawnSeconds}}function zo(e){var i,r;const t=Bo(e.sounds),a=Ho(e),l=jo(e.tiles),o=Array.isArray(e.entities)?e.entities:[];for(const _ of o){const d=ca((i=_==null?void 0:_.componentOverrides)==null?void 0:i.comp_tile_collector);if(!d)continue;const c=Ze(d.collectionSoundId,t),s=Ne(d.replacementTileId??0,l),p=da(d.targetVariable,a),m=qe(d.incrementAmount),u=d.bonusTileId?Ne(d.bonusTileId,l):null,h=Ne(d.bonusReplacementTileId??0,l),y=Ze(d.bonusSoundId,t),b=d.bonusIsPersistent===!0||d.bonusIsPersistent==="true",E=typeof d.bonusEntityEffect=="string"?d.bonusEntityEffect.trim().toLowerCase():"none",w=qe(d.bonusEffectAmount),v=Je(d.bonusSlashStrength??8),f=Je(d.bonusRespawnSeconds);if(c!==null||s!==0||p&&m>0||u!==null||y!==null||E!=="none"&&w>0||u!==null&&f>0)return{soundAssetIndex:c,replacementTileChar:s,targetVariable:p,incrementAmount:m,bonusTileChar:u,bonusReplacementTileChar:h,bonusSoundAssetIndex:y,bonusIsPersistent:b,bonusEntityEffect:E,bonusEffectAmount:w,bonusSlashStrength:v,bonusRespawnSeconds:f}}const n=Array.isArray(e.templates)?e.templates:[];for(const _ of n){const d=(r=_==null?void 0:_.components)==null?void 0:r.find(g=>g.definitionId==="comp_tile_collector");if(!d)continue;const c=ca(d.defaultValues||{});if(!c)continue;const s=Ze(c.collectionSoundId,t),p=Ne(c.replacementTileId??0,l),m=da(c.targetVariable,a),u=qe(c.incrementAmount),h=c.bonusTileId?Ne(c.bonusTileId,l):null,y=Ne(c.bonusReplacementTileId??0,l),b=Ze(c.bonusSoundId,t),E=c.bonusIsPersistent===!0||c.bonusIsPersistent==="true",w=typeof c.bonusEntityEffect=="string"?c.bonusEntityEffect.trim().toLowerCase():"none",v=qe(c.bonusEffectAmount),f=Je(c.bonusSlashStrength??8),A=Je(c.bonusRespawnSeconds);if(s!==null||p!==0||m&&u>0||h!==null||b!==null||w!=="none"&&v>0||h!==null&&A>0)return{soundAssetIndex:s,replacementTileChar:p,targetVariable:m,incrementAmount:u,bonusTileChar:h,bonusReplacementTileChar:y,bonusSoundAssetIndex:b,bonusIsPersistent:E,bonusEntityEffect:w,bonusEffectAmount:v,bonusSlashStrength:f,bonusRespawnSeconds:A}}return{soundAssetIndex:null,replacementTileChar:0,targetVariable:null,incrementAmount:0,bonusTileChar:null,bonusReplacementTileChar:0,bonusSoundAssetIndex:null,bonusIsPersistent:!1,bonusEntityEffect:"none",bonusEffectAmount:0,bonusSlashStrength:8,bonusRespawnSeconds:0}}function _a(){return`
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
`}function Vo(){return`
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

.deadly_tiles_next:
    dec b
    jp nz, .deadly_tiles_loop
    ret
`}function Go(e,t){var v,f;const a=e.soundAssetIndex,l=e.replacementTileChar,o=Math.max(1,Math.min(32,e.bonusSlashStrength||8)),n=Math.max(1,o-1),i=Math.max(1,o-2),r=`#${(256-o&255).toString(16).toUpperCase().padStart(2,"0")}`,_=`#${(256-n&255).toString(16).toUpperCase().padStart(2,"0")}`,d=`#${(256-i&255).toString(16).toUpperCase().padStart(2,"0")}`,c=a!==null&&t?`    ; Tile Collector UI-configured collection sound.
    ; Preserve DE because it still carries the tile index for persistence.
    push de
    ld a, ${a}
    call SM_PlaySoundAsset
    pop de
`:a!==null?`    ; collectionSoundId is configured in the Tile Collector UI,
    ; but this build has no state-machine sound asset runtime.
    ; Stay silent instead of forcing the wrong built-in beep.
`:`    ; No collectionSoundId configured in the Tile Collector UI.
`,s=e.bonusSoundAssetIndex!==null&&t?`    ; Tile Collector bonus pickup sound.
    push de
    ld a, ${e.bonusSoundAssetIndex}
    call SM_PlaySoundAsset
    pop de
`:e.bonusSoundAssetIndex!==null?`    ; bonusSoundId is configured, but this build has no state-machine sound asset runtime.
`:`    ; No bonusSoundId configured.
`,p=((v=e.targetVariable)==null?void 0:v.asmName)==="global_var_score"?`    ; Keep HUD Score text in sync with the updated global variable.
    push de
    call force_render_hud
    pop de
`:((f=e.targetVariable)==null?void 0:f.asmName)==="global_var_lives"?`    ; Keep HUD Lives text in sync with the updated global variable.
    push de
    ld a, (${e.targetVariable.asmName})
    call update_hud_lives
    call force_render_hud
    pop de
`:"",m=e.targetVariable&&e.incrementAmount>0?e.targetVariable.isWord?`    ; Tile Collector configured variable increment (16-bit).
    ld hl, ${e.targetVariable.asmName}
    ld a, (hl)
    add a, ${e.incrementAmount&255}
    ld (hl), a
    inc hl
    ld a, (hl)
    adc a, ${e.incrementAmount>>8&255}
    ld (hl), a
${p}
`:`    ; Tile Collector configured variable increment (8-bit).
    ld hl, ${e.targetVariable.asmName}
    ld a, (hl)
    add a, ${Math.min(255,e.incrementAmount)}
    ld (hl), a
${p}
`:`    ; No targetVariable/incrementAmount configured in the Tile Collector UI.
`,u=e.bonusEntityEffect==="grant_extra_jump"&&e.bonusEffectAmount>0?`    ; Bonus tile effect: arm an additive slash for the collecting entity.
    ; Horizontal motion is applied by update_slash_component on subsequent frames.
    push de
    ld e, c
    ld d, 0
    ld hl, entity_on_ground
    add hl, de
    res 0, (hl)

    ld hl, entity_platform_id
    add hl, de
    ld (hl), 255

    ld hl, entity_slash_vel_x
    add hl, de
    ld (hl), 0

    ld hl, entity_dir_mask
    add hl, de
    ld b, (hl)                     ; B = direction permissions for this entity

    ld a, (input_state)
    or a
    jp z, .ti_bonus_no_input
    cp STICK_RIGHT
    jp z, .ti_bonus_right
    cp STICK_UPRIGHT
    jp z, .ti_bonus_input_upright
    cp STICK_DOWNRIGHT
    jp z, .ti_bonus_downright
    cp STICK_LEFT
    jp z, .ti_bonus_left
    cp STICK_UPLEFT
    jp z, .ti_bonus_input_upleft
    cp STICK_DOWNLEFT
    jp z, .ti_bonus_downleft
    cp STICK_DOWN
    jp z, .ti_bonus_down
    cp STICK_UP
    jp z, .ti_bonus_input_up
    jp .ti_bonus_facing_default

.ti_bonus_no_input:
    ; No directional cursor held: never infer horizontal slash from facing.
    ; If UP is allowed, use the neutral upward pop; otherwise consume the
    ; bonus tile without any forced movement.
    ld a, b
    and DIR_ALLOW_UP
    jp nz, .ti_bonus_up
    jp .ti_bonus_done

.ti_bonus_input_upright:
    ld a, b
    and DIR_ALLOW_UP
    jp z, .ti_bonus_right
    jp .ti_bonus_upright

.ti_bonus_input_upleft:
    ld a, b
    and DIR_ALLOW_UP
    jp z, .ti_bonus_left
    jp .ti_bonus_upleft

.ti_bonus_input_up:
    ld a, b
    and DIR_ALLOW_UP
    jp nz, .ti_bonus_up
    jp .ti_bonus_facing_default

.ti_bonus_facing_default:
    ld hl, entity_facing_dir
    add hl, de
    ld a, (hl)
    cp 1
    jp z, .ti_bonus_left
    cp 2
    jp z, .ti_bonus_right
    jp .ti_bonus_right

.ti_bonus_right:
    ld hl, entity_slash_vel_x
    add hl, de
    ld (hl), ${o}
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de
    ld (hl), 0
    inc hl
    ld (hl), #FF
    jp .ti_bonus_done

.ti_bonus_upright:
    ld hl, entity_slash_vel_x
    add hl, de
    ld (hl), ${n}
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de
    ld (hl), 0
    inc hl
    ld (hl), #FD
    jp .ti_bonus_done

.ti_bonus_downright:
    ld hl, entity_slash_vel_x
    add hl, de
    ld (hl), ${i}
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de
    ld (hl), 0
    inc hl
    ld (hl), #01
    jp .ti_bonus_done

.ti_bonus_left:
    ld hl, entity_slash_vel_x
    add hl, de
    ld (hl), ${r}
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de
    ld (hl), 0
    inc hl
    ld (hl), #FF
    jp .ti_bonus_done

.ti_bonus_upleft:
    ld hl, entity_slash_vel_x
    add hl, de
    ld (hl), ${_}
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de
    ld (hl), 0
    inc hl
    ld (hl), #FD
    jp .ti_bonus_done

.ti_bonus_downleft:
    ld hl, entity_slash_vel_x
    add hl, de
    ld (hl), ${d}
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de
    ld (hl), 0
    inc hl
    ld (hl), #01
    jp .ti_bonus_done

.ti_bonus_down:
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de
    ld (hl), 0
    inc hl
    ld (hl), #02
    jp .ti_bonus_done

.ti_bonus_up:
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de
    ld (hl), 0
    inc hl
    ld (hl), #FC

.ti_bonus_done:
    pop de
`:`    ; No supported bonus entity effect configured.
`,h=e.bonusTileChar!==null?`    ld a, b
    cp ${e.bonusTileChar}
    jp z, .ti_collect_bonus
`:"",y=e.bonusIsPersistent?`    ; Bonus tile configured as persistent: record it like a normal collectible.
    jp .ti_record_persistent
`:`    ; Bonus tile is visit-local only: do not persist across screen reloads.
    jp .ti_next
`,b=e.bonusTileChar!==null&&e.bonusRespawnSeconds>0,E=b?`    ; Timed bonus respawn enabled: queue tile restoration and skip persistence.
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
    ret

; ------------------------------------------------------------------
; update_slash_component
; Add the temporary slash horizontal velocity on top of normal movement
; and damp it over subsequent frames.
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
    ; active_entity_list already guarantees current_screen_id membership

    ld hl, entity_slash_vel_x
    add hl, de
    ld a, (hl)
    or a
    jp z, .slash_next

    push bc

    ld b, a                    ; B = additive slash X velocity
    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    add a, b
    ld (hl), a

    ; Dampen toward zero: +n -> +(n-2), -n -> -(n-2)
    ld hl, entity_slash_vel_x
    add hl, de
    ld a, (hl)
    bit 7, a
    jp z, .slash_decay_positive

    add a, 2
    bit 7, a
    jp nz, .slash_store_decay
    xor a
    jp .slash_store_decay

.slash_decay_positive:
    sub 2
    jp nc, .slash_store_decay
    xor a

.slash_store_decay:
    ld (hl), a

    pop bc

.slash_next:
    pop hl
    dec b
    jp nz, .slash_loop
    ret

${b?`
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
    ld a, (input_entity_count)
    or a
    jp z, .ti_respawn_only         ; No active entities

    ld hl, input_entity_list
    ld b, a                        ; B = entity count

.ti_loop:
    ld c, (hl)                     ; C = entity index
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

${h}

    jp .ti_collect_normal

.ti_collect_normal:
    ; 2. Replace tile in VRAM Name Table (#1800 + idx)
    ld hl, NAMETBL
    add hl, de                     ; HL = NAMETBL + idx
    ld a, ${l}   ; Replacement tile char (0 = empty)
    call FAST_WRTVRM

    ; 3. Increment gem_count
    ld hl, gem_count
    inc (hl)

${m}

${c}

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

${u}

${s}

${E}

.ti_no_collect:
    pop hl                         ; Balance idx push

.ti_next:
    pop bc                         ; Restore B=count, C=entity
    pop hl                         ; Restore list pointer
    inc hl                         ; Advance to next entity
    dec b
    jp nz, .ti_loop                ; djnz replaced with jp nz (loop body > 127 bytes)
    call update_bonus_respawns
    ret

.ti_respawn_only:
    call update_bonus_respawns
    ret
`}function Wo(){return`
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
`}function Yo(){return`
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
    `}function Qo(){return` 
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
    `}function Xo(e){const t=e.usedComponents;let a=`init_components: 
; Initialize component systems(OPTIMIZED - only used components) 
    ; Used: ${Array.from(t).join(", ")} 
 
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
    `,t.has("Sprite")&&(a+=`    ; Initialize sprite system
    call init_sprite_system
    `),t.has("Movement")&&(a+=`    ; Initialize movement system
    call init_movement_system
    `),t.has("Collision")&&(a+=`    ; Initialize collision system
    call init_collision_system
    `),t.has("Input")&&(a+=`    ; Initialize input system
    call init_input_system
    `),t.has("Behavior")&&(a+=`    ; Initialize behavior system
    call init_behavior_system
    `),t.has("Health")&&(a+=`    ; Initialize health system
    call init_health_system
    `),t.has("Animation")&&(a+=`    ; Initialize animation system
    call init_animation_system
    `),t.has("Jump")&&(a+=`    ; Initialize jump system
    call init_jump_system
    `),t.has("Gravity")&&(a+=`    ; Initialize gravity system
    call init_gravity_system
    `),a+=`    ; Initialize auto-destroy system
    call init_auto_destroy_system
    `,t.has("Cursors")&&(a+=`    ; Initialize cursors system (stub)
    call init_cursors_system
    `),t.has("StateMachine")&&(a+=`    ; Initialize state machine system (stub)
    call init_statemachine_system
    `),t.has("Carry")&&(a+=`    ; Initialize carry system (stub)
    call init_carry_system
    `),t.has("Damage")&&(a+=`    ; Initialize damage system
    call init_damage_system
    `),t.has("Shoot")&&(a+=`    ; Initialize shoot system
    call init_shoot_system
    `),a+=`    ; Initialize platform riding system
    call init_platform_riding_system
    `,t.has("WallCollision")&&(a+=`    ; Initialize wall collision system (stub)
    call init_wallcollision_system
    `),t.has("DeadlyTiles")&&(a+=`    ; Initialize deadly tile detection system
    call init_deadly_tiles_system
    `),t.has("Collectible")&&(a+=`    ; Initialize collectible system (stub)
    call init_collectible_system
    `),t.has("TileInteraction")&&(a+=`    ; Initialize tile interaction system
    call init_tile_interaction_system
    `),a+=`
    ret
    `,a}function Fa(e,t="simple32k"){var h;if(!e.entities||e.entities.length===0)return`; ==================================================================
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
execute_all_state_machines:
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
        `;const a=We(e),l=a.usedComponents,o=Array.isArray(e.tiles)&&e.tiles.some(y=>{var b;return((((b=y.logicalProperties)==null?void 0:b.mapId)??0)&8)!==0}),n=zo(e),i=Array.isArray(e.stateMachines)&&e.stateMachines.length>0;o&&l.has("Input")&&l.add("TileInteraction");const r=(y,b)=>{if(!y||typeof y!="object")return!1;const E=String(y.type||"").toUpperCase();if(b.has(E))return!0;const w=Array.isArray(y.conditions)?y.conditions:[];for(const v of w)if(r(v,b))return!0;return!1},_=Array.isArray(e.stateMachines)?e.stateMachines:[],d=new Set(["HAS_COLLISION","HAS_DEADLY_TILE_COLLISION"]);_.some(y=>(Array.isArray(y==null?void 0:y.transitions)?y.transitions:[]).some(E=>r(E==null?void 0:E.conditions,d)))&&!l.has("Collision")&&(console.log("  - Forcing Collision system: required by state machine conditions"),l.add("Collision")),console.log("🎯 Generating optimized components.asm..."),console.log(`  - Active entities: ${a.activeEntities.length} `),console.log(`  - Used components: ${Array.from(l).join(", ")} `),console.log(`  - Filtered out: ${8-l.size} unused components`);let s=`; ==================================================================
; GAME COMPONENT SYSTEMS - MSX ECS ENGINE
    ; File: components.asm
        ; Description: Component systems based on Mideas React.js architecture
    ; Implements Position, Sprite, Movement, Collision, Input, and Behavior systems
    ; ==================================================================
;
; INTELLIGENT FILTERING ACTIVE:
;   Active entities: ${a.activeEntities.length}
;   Used components: ${Array.from(l).join(", ")}
;   Filtered out: ${8-l.size} unused component systems
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

        ${Xo(a)}
`;s+=Ao();const p=e.sprites&&e.sprites.length>0;l.has("Sprite")||p?s+=To():s+=`
    ; Sprite system filtered out(not used)
init_sprite_system:
    ret

update_sprite_component:
    ret

force_update_entity_sprite:
    ret
    `,l.has("Movement")?s+=Co():s+=`
    ; Movement system filtered out(not used)
init_movement_system:
    ret

update_movement_component:
    ret
    `,l.has("Collision")?s+=Io():s+=`
    ; Collision system filtered out(not used)
init_collision_system:
    ret

update_collision_component:
    ret
    `,(l.has("Collision")||l.has("WallCollision"))&&(s+=vo(t));const m=l.has("DeadlyTiles")||o&&l.has("Input");!l.has("WallCollision")&&(l.has("Collision")||m)&&(s+=_a()),l.has("Input")?s+=wo():s+=`
    ; Input system filtered out(not used)
init_input_system:
    ret

update_input_component:
    ret
    `,l.has("Behavior")?s+=Do():s+=`
    ; Behavior system filtered out(not used)
init_behavior_system:
    ret

update_behavior_component:
    ret
    `,l.has("Health")?s+=Lo():s+=`
    ; Health system filtered out(not used)
init_health_system:
    ret

update_health_component:
    ret
    `,l.has("Animation")?s+=ko():s+=`
    ; Animation system filtered out(not used)
init_animation_system:
    ret

update_animation_component:
    ret
    `,l.has("Jump")?s+=Po():s+=`
    ; Jump system filtered out(not used)
init_jump_system:
    ret

update_jump_component:
    ret
    `,l.has("Gravity")?s+=Ro():s+=`
    ; Gravity system filtered out(not used)
init_gravity_system:
    ret

update_gravity_component:
    ret
    `,s+=Oo(),l.has("Cursors")?s+=Uo():s+=`
    ; Cursors system filtered out(not used)
init_cursors_system:
    ret

update_cursors_component:
    ret
    `,l.has("StateMachine")?s+=`
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
    `:s+=`
    ; StateMachine system filtered out(not used)
init_statemachine_system:
    ret

update_statemachine_component:
    ret
    `,l.has("Carry")?s+=$o():s+=`
    ; Carry system filtered out(not used)
init_carry_system:
    ret

update_carry_component:
    ret
    `,l.has("Damage")?s+=No():s+=`
    ; Damage system filtered out(not used)
init_damage_system:
    ret

update_damage_component:
    ret
    `,l.has("Shoot")?s+=xo():s+=`
    ; Shoot system filtered out(not used)
init_shoot_system:
    ret

update_shoot_component:
    ret
    `,s+=Mo(),l.has("WallCollision")?s+=Fo(t):s+=`
    ; WallCollision system filtered out(not used)
init_wallcollision_system:
    ret

update_wallcollision_component:
    ret
    `,l.has("DeadlyTiles")?s+=Vo():s+=`
    ; DeadlyTiles system filtered out(not used)
init_deadly_tiles_system:
    ret

update_deadly_tiles_component:
    ret
    `,l.has("Collectible")?s+=Yo():s+=`
    ; Collectible system filtered out(not used)
init_collectible_system:
    ret

update_collectible_component:
    ret
    `,o&&l.has("Input")?(s+=Go(n,i),s+=Wo(),console.log("  - Tile Interaction system: ENABLED (interactable tiles detected)")):s+=`
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
    `,s+=Qo();const u=!!((h=e.screenMaps)!=null&&h.some(y=>Array.isArray(y==null?void 0:y.effectZones)&&y.effectZones.some(b=>String((b==null?void 0:b.effectType)||"").length===0||(b==null?void 0:b.effectType)==="secretZone"||((b==null?void 0:b.mask)??0)===0)));if(s+=So(l,!!e.hasGameFlow,u),l.has("StateMachine")&&Array.isArray(e.stateMachines)&&e.stateMachines.length>0?s+=`
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

`:s+=`
; ==================================================================
; EXECUTE ALL STATE MACHINES - Called by GameFlow
; ==================================================================
; No state machines are present in this build.
execute_all_state_machines:
    ret

`,s+=`
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
    call mapper_push_p2
    ld a, (current_screen_layout_bank)
    call mapper_set_bank_p2
    ld a, (hl)                    ; A = tile ID from screen map
    push af
    call mapper_pop_p2
    pop af

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
    ${Array(127).fill(0).map((y,b)=>`db TILE_PASSABLE              ; ${b+1}: Passable`).join(`
    `)}

    ; Index 128-255: Project tile characters (solid by default)
    ; MSX Screen 2 assigns character IDs >= 128 to project tiles
    ${Array(128).fill(0).map((y,b)=>`db TILE_SOLID                 ; ${128+b}: Solid`).join(`
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

`,u?s+=`
; ------------------------------------------------------------------
; update_secret_zone_component
; Hero-only secret zone runtime.
; Uses hero_entity_id resolved from templates flagged with isPlayer.
; ------------------------------------------------------------------
${Y({purpose:"Detect player entry/exit on secret zones and swap visible tiles.",inputs:["hero_entity_id + entity_is_player/current-screen filtering","entity_x_pos[hero], entity_y_pos[hero] as hero top-left position","runtime_effect_zone_table/current_effect_zone_count","runtime_background_layout, runtime_effects_layout, runtime_screen_layout"],outputs:["runtime_screen_layout updated when entering/leaving a secret zone","VRAM Name Table updated for affected rectangle","secret_zone_active + secret_zone_rect_* state refreshed"],clobbers:["AF","BC","DE","HL","IX"],preserved:["None"],notes:["Only secret zones are handled in this v1 runtime.","First matching zone wins when zones overlap."]})}
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

`:s+=`
update_secret_zone_component:
    ret

`,l.has("WallCollision")){const y=_a(),b=s.indexOf(y),E=s.lastIndexOf(y);b!==-1&&E!==-1&&b!==E&&(s=s.slice(0,b)+s.slice(b+y.length))}return s+=`
    ; ==================================================================
; END OF COMPONENT SYSTEMS
    ; ==================================================================
        `,s}function Ko(e){var w,v,f,A;const t=(g,S)=>{if(typeof g=="boolean")return g;if(typeof g=="number")return g!==0;if(typeof g=="string"){const C=g.trim().toLowerCase();if(C==="true")return!0;if(C==="false")return!1;const x=parseInt(C,10);if(!Number.isNaN(x))return x!==0}return S},a=(g,S)=>{const C=typeof g=="number"?g:parseInt(String(g??""),10);return Number.isNaN(C)?S:Math.max(0,Math.min(255,C|0))},l=(g,S)=>{const C=typeof g=="number"?g:parseInt(String(g??""),10);return Number.isNaN(C)?S&255:C<0?256+Math.max(-128,Math.min(-1,C|0))&255:Math.max(0,Math.min(255,C|0))},o=g=>{const S=typeof g=="number"?g:parseInt(String(g??""),10);return Number.isNaN(S)?1:S>=1&&S<=4?S|0:S===100?1:S===50?2:S===33?3:S===25?4:1},n=(g,S)=>{const C=Math.max(1,S|0),x=typeof g=="number"?g:parseInt(String(g??""),10);return((Number.isNaN(x)?0:x|0)%C+C)%C},i=g=>(g&255).toString(16).toUpperCase().padStart(2,"0"),r=g=>{const S=(g==null?void 0:g.screenAssetId)||(g==null?void 0:g.screenId)||(g==null?void 0:g.screenMapId);if(S){const L=e.worldmaps||[];for(const D of L){const k=((D==null?void 0:D.nodes)||[]).findIndex(P=>(P==null?void 0:P.screenAssetId)===S);if(k>=0)return k}}if(typeof(g==null?void 0:g.screenIndex)=="number"&&g.screenIndex>=0)return g.screenIndex;let C=0,x=null;if(e.screenMaps&&e.screenMaps.forEach((L,D)=>{var k;(((k=L==null?void 0:L.layers)==null?void 0:k.entities)||[]).some(P=>P.id===g.id)&&(C=D,x=L.id||null)}),!x)return C;const M=e.worldmaps||[];for(const L of M){const R=((L==null?void 0:L.nodes)||[]).findIndex(k=>(k==null?void 0:k.screenAssetId)===x);if(R>=0)return R}return C},_=g=>{const S={};if(!g||g.length===0)return S;let C=1;return g.forEach(x=>{!x||!x.id||S[x.id]===void 0&&(S[x.id]=C,x.name&&(S[String(x.name)]=C,S[String(x.name).toLowerCase()]=C),C<255&&(C+=1))}),S},c=We(e).activeEntities,s=2,p=16,m=_(e.templates),u=Array.isArray(e.templates)&&e.templates.some(g=>t(g==null?void 0:g.isPlayer,!1)),h=g=>String(g??"entity").toUpperCase().replace(/[^A-Z0-9]/g,"_").replace(/^_+|_+$/g,"")||"ENTITY",y=new Map,b=c.map((g,S)=>{const C=h((g==null?void 0:g.name)||`ENTITY_${S}`),x=(y.get(C)||0)+1;return y.set(C,x),x===1?C:`${C}_${x}`});console.log("🎯 Generating optimized entities.asm..."),console.log(`  - Total entity templates in JSON: ${((w=e.templates)==null?void 0:w.length)||0}`),console.log(`  - Actually instantiated entities: ${c.length}`),console.log(`  - Filtered out: ${(((v=e.templates)==null?void 0:v.length)||0)-c.length} unused templates`);let E=`; ==================================================================
; GAME ENTITIES
; File: entities.asm
; Description: Game entity definitions and behavior
; ==================================================================
;
; INTELLIGENT FILTERING ACTIVE:
;   Entity templates in project: ${((f=e.templates)==null?void 0:f.length)||0}
;   Actually instantiated: ${c.length}
;   Filtered out: ${(((A=e.templates)==null?void 0:A.length)||0)-c.length} unused templates
;
; ==================================================================

`;if(c.length>0){E+=`; ==================================================================
; ENTITY DEFINITIONS
; ==================================================================

`,c.forEach((S,C)=>{var D;const x=b[C],M=(D=e.templates)==null?void 0:D.find(R=>R.id===S.entityTemplateId),L=ia(S,M,e);E+=`; Entity: ${S.name} (instance from template: ${S.entityTemplateId})
ENTITY_${x}_ID EQU ${C}
ENTITY_${x}_COMP_MASK EQU #${L.toString(16).toUpperCase().padStart(2,"0")}  ; Component mask: ${L.toString(2).padStart(8,"0")}b
`,S.entityTemplateId&&(E+=`; Template: ${S.entityTemplateId}
`),S.position&&(E+=`ENTITY_${x}_X EQU ${S.position.x}
ENTITY_${x}_Y EQU ${S.position.y}
`),E+=`
`}),E+=`; ==================================================================
; ENTITY MANAGEMENT FUNCTIONS
; ==================================================================

init_entities:
    ; Initialize all active game entities (${c.length} entities)

    ; Ensure sprite system is reset whenever entities are initialized
    call init_sprites

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
    
`,c.length>0?c.forEach((S,C)=>{const x=b[C];E+=`    call init_${x.toLowerCase()}
`}):E+=`    ; No entities to initialize
`,E+=`    ret

update_entities:
    ; Update all active entities (${c.length} entities)
`,c.length>0?c.forEach((S,C)=>{const x=b[C];E+=`    ; Skip entity update if entity belongs to another screen
    ld hl, entity_screen_id + ${C}
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_update_${C}
    ; Run per-entity update
    call update_${x.toLowerCase()}
.skip_update_${C}:
`}):E+=`    ; No entities to update
`,E+=`    ret

`;let g=!1;c.forEach((S,C)=>{var Ut,$t,Ft,Bt,jt,Ht,zt,Vt,Gt,Wt,Yt,Qt,Xt,Kt,Zt,qt;const x=b[C],M=(Ut=e.templates)==null?void 0:Ut.find(B=>B.id===S.entityTemplateId),L=ia(S,M,e),D=(L&s)!==0,R=(L&p)!==0,k=!!(($t=M==null?void 0:M.components)!=null&&$t.some(B=>(B==null?void 0:B.definitionId)==="comp_player_input"||(B==null?void 0:B.definitionId)==="comp_input")),P=u?t(M==null?void 0:M.isPlayer,!1):k,T=o((S==null?void 0:S.jobRate)??(S==null?void 0:S.jobPeriod)),$=n(S==null?void 0:S.jobEntry,T);D&&R&&(g=!0);const U=((Ft=S.position)==null?void 0:Ft.x)||100,G=((Bt=S.position)==null?void 0:Bt.y)||100,J=8,ue=8,Q=U*J,j=G*ue,W=Math.min(Q,240),te=Math.min(j,191);(Q!==W||j!==te)&&console.warn(`Entity ${S.name} position clamped: (${Q},${j}) → (${W},${te})`);const X=[];L&1&&X.push("Position"),L&2&&X.push("Sprite"),L&4&&X.push("Movement"),L&8&&X.push("Collision"),L&16&&X.push("Input"),L&32&&X.push("Behavior"),L&64&&X.push("Health"),L&128&&X.push("Animation"),L&256&&X.push("Jump"),L&512&&X.push("Gravity"),L&8192&&X.push("DeadlyTiles");let ne=15,Ye=2;if(L&16){const B=M==null?void 0:M.components.find(Z=>Z.definitionId==="comp_cursors"||Z.definitionId==="comp_input"||Z.definitionId==="comp_player_input");if(B){const Z=B.defaultValues||{},re=((jt=S.componentOverrides)==null?void 0:jt.comp_cursors)||{},V={...Z,...re};Ye=Math.max(1,a(V.speed??2,2)),ne=0,V.allowUp!==!1&&(ne|=1),V.allowDown!==!1&&(ne|=2),V.allowLeft!==!1&&(ne|=4),V.allowRight!==!1&&(ne|=8)}}let ee=1;if(L&256){const B=(Ht=M==null?void 0:M.components)==null?void 0:Ht.find(Z=>Z.definitionId==="comp_jump");if(B){const Z=B.defaultValues||{},re=((zt=S.componentOverrides)==null?void 0:zt.comp_jump)||{},V={...Z,...re};ee=Math.max(1,a(V.maxJumps??1,1))}}const ie=[];ne&1&&ie.push("UP"),ne&2&&ie.push("DOWN"),ne&4&&ie.push("LEFT"),ne&8&&ie.push("RIGHT");const Re=ie.length===4?"All directions":ie.join("+");let Lt="";if(L&128){const B=(Vt=M==null?void 0:M.components)==null?void 0:Vt.find(Qe=>Qe.definitionId==="comp_animation"||Qe.definitionName==="Animation"),Z=(B==null?void 0:B.defaultValues)||(B==null?void 0:B.values)||{},re=((Gt=S.componentOverrides)==null?void 0:Gt.comp_animation)||{},V={...Z,...re},se=a(V.currentFrameIndex??V.currentFrame??0,0),pe=Math.max(1,a(V.animationSpeed??6,6)),_e=t(V.loops,!0),Se=t(V.isPlaying,!0),Ue=t(V.animateOnlyWhenMoving,!1),ht=(Se?1:0)|(_e?2:0)|(Ue?4:0);Lt=`
    ; Initialize Animation component
    ld hl, entity_anim_frame
    add hl, de
    ld (hl), #${se.toString(16).toUpperCase().padStart(2,"0")}           ; currentFrameIndex

    ld hl, entity_anim_tick
    add hl, de
    ld (hl), 0                ; tick counter

    ld hl, entity_anim_speed
    add hl, de
    ld (hl), #${pe.toString(16).toUpperCase().padStart(2,"0")}           ; animationSpeed

    ld hl, entity_anim_flags
    add hl, de
    ld (hl), #${ht.toString(16).toUpperCase().padStart(2,"0")}           ; flags (playing/loop/onlyWhenMoving)
`}let Nt="",xt=!1,fe=0,ye=0,Te=0,Ce=0,Ee=0,ge=0;const Mt=(Wt=M==null?void 0:M.components)==null?void 0:Wt.find(B=>B.definitionId==="comp_patrol");if(Mt){xt=!0;const B=Mt.defaultValues||{},Z=((Yt=S.componentOverrides)==null?void 0:Yt.comp_patrol)||{},re={...B,...Z};fe=Math.max(0,Math.min(255,Number(re.waypoint1_x)||0)),ye=Math.max(0,Math.min(191,Number(re.waypoint1_y)||0)),Te=Math.max(0,Math.min(255,Number(re.waypoint2_x??fe))),Ce=Math.max(0,Math.min(191,Number(re.waypoint2_y??ye)));const V=Te-fe,se=Ce-ye,pe=Math.sqrt(V*V+se*se),_e=Number(re.speed)||1;pe>0&&(Ee=Math.round(V/pe*_e),ge=Math.round(se/pe*_e),V!==0&&Ee===0&&(Ee=V>0?1:-1),se!==0&&ge===0&&(ge=se>0?1:-1));const Se=Ee>=0?Ee:256+Ee,Ue=ge>=0?ge:256+ge;Nt=`
    ; === Patrol Component Init ===
    ; Waypoints: (${fe}, ${ye}) -> (${Te}, ${Ce})
    ; Override position with waypoint1
    ld hl, entity_x_pos
    add hl, de
    ld (hl), ${fe}         ; Start X = waypoint1_x

    ld hl, entity_y_pos
    add hl, de
    ld (hl), ${ye}         ; Start Y = waypoint1_y

    ; Set patrol velocity
    ld hl, entity_vel_x
    add hl, de
    ld (hl), ${Se}           ; VelX = ${Ee>=0?"+":""}${Ee}

    ld hl, entity_vel_y
    add hl, de
    ld (hl), ${Ue}           ; VelY = ${ge>=0?"+":""}${ge}
`}let kt="";if(L&8){const B=(Qt=M==null?void 0:M.components)==null?void 0:Qt.find(Jt=>Jt.definitionId==="comp_collision"||Jt.definitionName==="Collision"),Z=(B==null?void 0:B.defaultValues)||{},re=((Xt=S.componentOverrides)==null?void 0:Xt.comp_collision)||{},V={...Z,...re},se=a(V.hitboxWidth,16),pe=a(V.hitboxHeight,16),_e=l(V.offsetX,0),Se=l(V.offsetY,0),Ue=_e>=128?_e-256:_e,ht=Se>=128?Se-256:Se,Qe=a(V.collisionLayer,1),Wa=a(V.collidesWith,255);kt=`
    ; Initialize Collision component (hitbox + layer masks)
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld (hl), #${i(se)}      ; hitboxWidth

    ld hl, entity_collision_hitbox_h
    add hl, de
    ld (hl), #${i(pe)}      ; hitboxHeight

    ld hl, entity_collision_offset_x
    add hl, de
    ld (hl), #${i(_e)}      ; offsetX (${Ue})

    ld hl, entity_collision_offset_y
    add hl, de
    ld (hl), #${i(Se)}      ; offsetY (${ht})

    ld hl, entity_collision_layer
    add hl, de
    ld (hl), #${i(Qe)}      ; collisionLayer

    ld hl, entity_collides_with
    add hl, de
    ld (hl), #${i(Wa)}      ; collidesWith
`}let Pt="";const _t=(Kt=S.componentOverrides)==null?void 0:Kt.comp_statemachine,pt=(Zt=M==null?void 0:M.components)==null?void 0:Zt.find(B=>B.definitionId==="comp_statemachine"),Ot=(_t==null?void 0:_t.stateMachineAssetId)||((qt=pt==null?void 0:pt.defaultValues)==null?void 0:qt.stateMachineAssetId);if(Ot&&e.stateMachines){const B=e.stateMachines.find(Z=>Z.id===Ot);if(B&&B.states&&B.states.length>0){let Z=B.states[0];if(B.initialStateId){const se=B.states.find(pe=>pe.id===B.initialStateId);se&&(Z=se)}const V=`SM_${B.name.replace(/[^a-zA-Z0-9]/g,"_")}_${Z.id.replace(/[^a-zA-Z0-9]/g,"_")}`;Pt=`
    ; Initialize State Machine pointer to initial state (${B.name})
    ld hl, ${V}          ; HL = initial state address
    ld a, l
    ld (entity_sm_ptr_l + ${C}), a   ; SM ptr low byte
    ld a, h
    ld (entity_sm_ptr_h + ${C}), a   ; SM ptr high byte

    ; Fire OnEnter of initial state immediately.
    ; Normally OnEnter fires via SM_ChangeState, but the first state is set
    ; directly (no transition). Without this call, ChangeSprite / other
    ; OnEnter actions never run and entity_sprite_asset_index stays at 0.
    ; State data layout: [ID:1][OnEnter ptr:2][OnExit ptr:2][Transitions ptr:2]
    ld hl, ${V} + 1      ; HL = &OnEnter Actions Ptr field
    ld e, (hl)
    inc hl
    ld d, (hl)                    ; DE = OnEnter Actions Ptr (0 if none)
    ld a, ${C}                ; A = entity index
    call SM_ExecuteActions        ; safe: SM_ExecuteActions returns immediately if DE=0
`}}let N="";if(xt){D&&(g=!0);const B=Math.min(fe,Te),Z=Math.max(fe,Te),re=Math.min(ye,Ce),V=Math.max(ye,Ce),se=fe!==Te,pe=ye!==Ce,_e=pe?`.patrol_check_y_${C}`:`.patrol_end_${C}`;N=`update_${x.toLowerCase()}:
`,N+=`    ; Update ${S.name} - Patrol bounce
`,N+=`    ; Waypoints: (${fe}, ${ye}) -> (${Te}, ${Ce})
`,N+=`    ld e, ${C}             ; Entity index
`,N+=`    ld d, 0
`,se&&(N+=`
    ; --- X axis bounce ---
`,N+=`    ld hl, entity_vel_x
`,N+=`    add hl, de
`,N+=`    ld a, (hl)
`,N+=`    or a
`,N+=`    jp z, ${_e}
`,N+=`    bit 7, a
`,N+=`    jp nz, .patrol_chk_min_x_${C}
`,N+=`
    ; Moving right: x >= ${Z}?
`,N+=`    ld hl, entity_x_pos
`,N+=`    add hl, de
`,N+=`    ld a, (hl)
`,N+=`    cp ${Z}
`,N+=`    jp c, ${_e}
`,N+=`    ; Bounce: negate vel_x
`,N+=`    ld hl, entity_vel_x
`,N+=`    add hl, de
`,N+=`    ld a, (hl)
`,N+=`    neg
`,N+=`    ld (hl), a
`,N+=`    jp ${_e}
`,N+=`
.patrol_chk_min_x_${C}:
`,N+=`    ; Moving left: x <= ${B}?
`,N+=`    ld hl, entity_x_pos
`,N+=`    add hl, de
`,N+=`    ld a, (hl)
`,N+=`    cp ${B+1}
`,N+=`    jp nc, ${_e}
`,N+=`    ; Bounce: negate vel_x
`,N+=`    ld hl, entity_vel_x
`,N+=`    add hl, de
`,N+=`    ld a, (hl)
`,N+=`    neg
`,N+=`    ld (hl), a
`),pe&&(se&&(N+=`
.patrol_check_y_${C}:
`),N+=`
    ; --- Y axis bounce ---
`,N+=`    ld hl, entity_vel_y
`,N+=`    add hl, de
`,N+=`    ld a, (hl)
`,N+=`    or a
`,N+=`    jp z, .patrol_end_${C}
`,N+=`    bit 7, a
`,N+=`    jp nz, .patrol_chk_min_y_${C}
`,N+=`
    ; Moving down: y >= ${V}?
`,N+=`    ld hl, entity_y_pos
`,N+=`    add hl, de
`,N+=`    ld a, (hl)
`,N+=`    cp ${V}
`,N+=`    jp c, .patrol_end_${C}
`,N+=`    ; Bounce: negate vel_y
`,N+=`    ld hl, entity_vel_y
`,N+=`    add hl, de
`,N+=`    ld a, (hl)
`,N+=`    neg
`,N+=`    ld (hl), a
`,N+=`    jp .patrol_end_${C}
`,N+=`
.patrol_chk_min_y_${C}:
`,N+=`    ; Moving up: y <= ${re}?
`,N+=`    ld hl, entity_y_pos
`,N+=`    add hl, de
`,N+=`    ld a, (hl)
`,N+=`    cp ${re+1}
`,N+=`    jp nc, .patrol_end_${C}
`,N+=`    ; Bounce: negate vel_y
`,N+=`    ld hl, entity_vel_y
`,N+=`    add hl, de
`,N+=`    ld a, (hl)
`,N+=`    neg
`,N+=`    ld (hl), a
`),N+=`
.patrol_end_${C}:
`,D&&(N+=`    ; Sync sprite facing with current patrol velocity
`,N+=`    call update_entity_patrol_facing
`),N+=`    ret
`}else N=`update_${x.toLowerCase()}:
`,N+=`    ; Update ${S.name} logic with real behavior
`,N+=`    ; Check if entity has input component (player entities)
`,N+=`    ld a, ${C}
`,N+=`    ld hl, entity_comp_masks
`,N+=`    ld e, a
`,N+=`    ld d, 0
`,N+=`    add hl, de
`,N+=`    ld a, (hl)
`,N+=`    and COMP_MASK_INPUT
`,N+=`    ret z                      ; Skip if no input component

`,N+=`    ; This is a player entity - update based on input
`,N+=`    ; Input velocity is already calculated in UPDATE_INPUT_COMPONENT
`,N+=`    ; Position update happens in UPDATE_POSITION_COMPONENT
`,N+=`    ret
`;const Va=r(S),Ga=m[S.entityTemplateId]??0;E+=`init_${x.toLowerCase()}:
    ; Initialize ${S.name} at real position from JSON
    ; JSON position: (${U}, ${G}) tiles = (${W}, ${te}) pixels
    ; Template: ${S.entityTemplateId}
    ; Components: ${X.join(", ")}
    ; Direction mask: #${ne.toString(16).toUpperCase().padStart(2,"0")} (${ne.toString(2).padStart(4,"0")}b) = ${Re}

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ; Mask is 16-bit: B=low byte, C=high byte
    ld a, ${C}             ; Entity ID
    ld b, #${(L&255).toString(16).toUpperCase().padStart(2,"0")}              ; Mask low byte
    ld c, #${(L>>8&255).toString(16).toUpperCase().padStart(2,"0")}              ; Mask high byte
    call create_entity         ; Create with actual components from template

    ; Configure per-entity job cadence
    ; period: ${T} frame(s), entry: ${$}
    ld a, ${C}
    ld b, ${T}
    ld c, ${$}
    call entity_job_set

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, ${C}             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), ${W}         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), ${te}         ; Set real Y position from JSON

    ; Set entity screen ID (for multi-screen support)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), ${Va}                 ; Screen ID (world node index / fallback screen index)

    ld hl, entity_is_player
    add hl, de
    ld (hl), ${P?1:0}                 ; Player/hero marker from template

    ; Template token for state-machine template-aware actions
    ld hl, entity_template_token
    add hl, de
    ld (hl), ${Ga}

${D&&R?`    ; Deterministic spawn facing: right.
    ; This keeps the first SM ChangeSprite aligned with the same default
    ; world-facing direction used by Preview/runtime web.
    ld hl, entity_facing_dir
    add hl, de
    ld (hl), 2

`:""}
${Lt}
${Nt}
${kt}
${D?`    ; Set sprite pattern and color (renderable entity)
    ld hl, sprite_pattern
    add hl, de
    ld (hl), ${C*4}          ; Use entity index * 4 for 16x16 sprites

    ld hl, sprite_color
    add hl, de
    ld (hl), ${C%14+2}                ; Distinct color for debugging
`:`    ; Anchor/reference entity - no sprite allocation needed
`}

    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #${ne.toString(16).toUpperCase().padStart(2,"0")}            ; Direction restrictions: ${Re}

    ; Set input speed for Cursors component (if entity has Input component)
    ld hl, entity_input_speed
    add hl, de
    ld (hl), ${Ye}            ; Cursor speed (px/frame)

${L&256?`    ; Set Jump component configuration
    ld hl, entity_jump_max
    add hl, de
    ld (hl), ${ee}            ; Maximum jumps before touching ground

`:""}
${D?`    ; Force update sprite attributes only if entity is in current screen
    ld hl, entity_screen_id + ${C}
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_force_show_${C}

    ; Force update sprite attributes (using correct multi-layer config)
    ld c, ${C}             ; Entity Index
    call force_update_entity_sprite
.skip_force_show_${C}:

`:`    ; No sprite to show for this entity
`}
${Pt}
    ret

${N}
`}),g&&(E+=`
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
    ld (hl), a

.patrol_facing_done:
    pop hl
    pop bc
    pop af
    ret

`)}else E+=`; ==================================================================
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

`;return E+=`; ==================================================================
; END OF ENTITIES
; ==================================================================
`,E}const xe=32,Me=24,pa=16,Zo=64,we={secretZone:0,wind:1,water:2,customGravity:3,icePhysics:4,spriteConceal:5},ke={left:0,right:1,up:2,down:3};function ve(e,t=0){return Number.isFinite(e)?Math.max(0,Math.min(255,e))&255:t&255}function qo(e,t){var i,r;const a=(i=t.tileBanks)==null?void 0:i.find(_=>_.id===e.tileBankAssetId);if((r=a==null?void 0:a.banks)!=null&&r.length)return a.banks;if(!t.tiles||t.tiles.length===0)return;const o={...Ja[1],assignedTiles:{},charsetRangeStart:128,charsetRangeEnd:255,enabled:!0};let n=128;return t.tiles.forEach(_=>{if(!(_!=null&&_.id))return;const d=Math.ceil(_.width/8),c=Math.ceil(_.height/8);o.assignedTiles[_.id]={charCode:n,assignedAt:Date.now()},n+=d*c}),[o,o,o]}function ha(e,t,a,l){const o={...e,activeAreaX:0,activeAreaY:0,activeAreaWidth:xe,activeAreaHeight:Me,layers:{...e.layers,background:e.layers[t]}};return Array.from(_l(o,a.tiles||[],l,"SCREEN 2 (Graphics I)"))}function ua(e,t,a=[]){let l=`${e}:
`;for(const o of a)l+=`    ; ${o}
`;if(t.length===0)return l+=`    DB #00
`,l;for(let o=0;o<t.length;o+=pa){const i=t.slice(o,o+pa).map(r=>`#${r.toString(16).padStart(2,"0").toUpperCase()}`);l+=`    DB ${i.join(",")}
`}return l}function Jo(e){const t=e.effectZones||[],a=[];return t.forEach(l=>{var _,d,c,s;const o=Xa(l),n=Qa(o,l.params);let i=0,r=0;if(o==="wind"){const p=typeof n.direction=="string"?n.direction:"right";i=ke[p]??ke.right,r=ve(typeof n.strength=="number"?n.strength:parseInt(String(n.strength??"0"),10),1)}a.push(ve((_=l.rect)==null?void 0:_.x),ve((d=l.rect)==null?void 0:d.y),ve((c=l.rect)==null?void 0:c.width),ve((s=l.rect)==null?void 0:s.height),we[o],ve(i),ve(r),0)}),a}function en(e){const t=!!e.sprites&&e.sprites.length>0;if(!e.screenMaps||e.screenMaps.length===0)return`; ==================================================================
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
`;const a=e.screenMaps.map((o,n)=>{const i=o.name.toUpperCase().replace(/[^A-Z0-9]/g,"_"),r=`${o.name}_${n}`,_=qo(o,e),d=ha(o,"background",e,_),c=ha(o,"effects",e,_),s=c.some(u=>u!==0),p=Jo(o),m=(o.effectZones||[]).length;return{screen:o,index:n,screenName:i,screenNameWithIndex:r,backgroundLayoutBytes:d,effectsLayoutBytes:c,hasEffectsLayoutData:s,effectZoneBytes:p,effectZoneCount:m}});let l=`; ==================================================================
; SCREEN MAPS
; File: screens.asm
; Description: Screen layout and map data
; ==================================================================

`;return e.screenMaps&&e.screenMaps.length>0?(l+=`; ==================================================================
; SCREEN MAP CONSTANTS
; ==================================================================

`,l+=`EFFECT_ZONE_ENTRY_SIZE EQU 8
EFFECT_TYPE_SECRET_ZONE EQU ${we.secretZone}
EFFECT_TYPE_WIND EQU ${we.wind}
EFFECT_TYPE_WATER EQU ${we.water}
EFFECT_TYPE_CUSTOM_GRAVITY EQU ${we.customGravity}
EFFECT_TYPE_ICE_PHYSICS EQU ${we.icePhysics}
EFFECT_TYPE_SPRITE_CONCEAL EQU ${we.spriteConceal}
EFFECT_WIND_DIR_LEFT EQU ${ke.left}
EFFECT_WIND_DIR_RIGHT EQU ${ke.right}
EFFECT_WIND_DIR_UP EQU ${ke.up}
EFFECT_WIND_DIR_DOWN EQU ${ke.down}

`,a.forEach(o=>{const{screenName:n,index:i,hasEffectsLayoutData:r,effectZoneCount:_}=o;l+=`SCREEN_${n}_${i}_ID EQU ${i}
SCREEN_${n}_${i}_LAYOUT_BANK EQU ((SCREEN_${n}_${i}_LAYOUT - #4000) / #2000)
BEHAVIOR_${n}_${i}_DATA_BANK EQU ((BEHAVIOR_${n}_${i}_DATA - #4000) / #2000)
SCREEN_${n}_${i}_EFFECTS_LAYOUT_BANK EQU ((SCREEN_${n}_${i}_EFFECTS_LAYOUT - #4000) / #2000)
SCREEN_${n}_${i}_EFFECTS_LAYOUT_PRESENT EQU ${r?1:0}
SCREEN_${n}_${i}_EFFECTS_LAYOUT_SIZE EQU ${xe*Me}
SCREEN_${n}_${i}_EFFECT_ZONE_TABLE_BANK EQU ((SCREEN_${n}_${i}_EFFECT_ZONE_TABLE - #4000) / #2000)
SCREEN_${n}_${i}_EFFECT_ZONE_COUNT EQU ${_}
SCREEN_${n}_${i}_EFFECT_ZONE_TABLE_SIZE EQU ${_*8}
`}),l+=`
; ==================================================================
; SCREEN MAP DATA
; ==================================================================

`,a.forEach(o=>{var u,h,y;const{screen:n,index:i,screenName:r,screenNameWithIndex:_,backgroundLayoutBytes:d,effectsLayoutBytes:c,hasEffectsLayoutData:s,effectZoneBytes:p,effectZoneCount:m}=o;if(n.layers&&n.layers.background){const b=[];b.push("; Generated using exact Screen Editor layout export logic"),b.push("; Byte values represent actual character codes in VRAM");const E=pl(_,xe,Me,d,b,"hex");if(l+=E,l+=`
`,l+=ua(`SCREEN_${r}_${i}_EFFECTS_LAYOUT`,c,s?[`Alternate Effects layer for ${n.name}`,"Same 32x24 char layout as background; used by secretZone runtime"]:[`No alternate Effects tiles exported for ${n.name}`,"Runtime should treat this layer as empty"]),l+=`
`,l+=ua(`SCREEN_${r}_${i}_EFFECT_ZONE_TABLE`,p,m>0?[`Effect zones for ${n.name}`,"Entry format: x, y, width, height, effectType, param0, param1, reserved"]:[`No effect zones exported for ${n.name}`]),l+=`
`,n.layers.collision&&e.tiles){const w=n.layers.collision,v=[],f=w.length,A=((u=w[0])==null?void 0:u.length)??0;for(let S=0;S<Me;S++)for(let C=0;C<xe;C++){const x=f>0?Math.min(f-1,Math.floor(S*f/Me)):0,M=A>0?Math.min(A-1,Math.floor(C*A/xe)):0,L=(h=w[x])==null?void 0:h[M];if(L!=null&&L.tileId){const D=(y=e.tiles)==null?void 0:y.find(k=>k.id===L.tileId),R=D==null?void 0:D.logicalProperties;if(R){const k=R.familyId??(R.isSolid?1:0);let P=0;R.isBreakable&&(P|=1),R.isMovable&&(P|=2),R.causesDamage&&(P|=4),R.isInteractiveSwitch&&(P|=8),v.push(k<<4|P)}else v.push(0)}else v.push(0)}const g=hl(_,xe,Me,v,"hex");l+=`
${g}`}}else{const b=e.screenMaps.indexOf(n),E=n.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");l+=`SCREEN_${E}_${b}_LAYOUT:
    ; Screen data for ${n.name}
    ; TODO: Add actual screen map data
    db 0, 0, 0, 0, 0, 0, 0, 0

`}l+=`
`}),l+=`; ==================================================================
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

`,e.screenMaps.forEach((o,n)=>{var x,M;const i=o.name.toUpperCase().replace(/[^A-Z0-9]/g,"_"),r=o.backgroundColor!==void 0?o.backgroundColor:1,_=o.borderColor!==void 0?o.borderColor:1,d=o.id?`_${o.id.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"",c=o.activeAreaX??0,s=o.activeAreaY??0,p=o.activeAreaWidth??o.width??32,m=o.activeAreaHeight??o.height??24,u=Math.max(0,Math.min(31,c)),h=Math.max(0,Math.min(23,s)),y=Math.max(0,Math.min(32-u,p)),b=Math.max(0,Math.min(24-h,m)),w=(u>0||h>0||y<32||b<24)&&y>0&&b>0,v=h*32+u,f=y*b,A=Math.min((o.effectZones||[]).length,Zo),g=(((M=(x=o.hudConfiguration)==null?void 0:x.importedFrame)==null?void 0:M.cells)||[]).filter(L=>typeof(L==null?void 0:L.x)=="number"&&typeof(L==null?void 0:L.y)=="number"&&typeof(L==null?void 0:L.charCode)=="number"&&L.x>=0&&L.x<32&&L.y>=0&&L.y<24).map(L=>({x:L.x|0,y:L.y|0,charCode:L.charCode&255})),S=g.length>0,C=`hud_imported_frame_${i.toLowerCase()}${d.toLowerCase()}`;S&&(l+=`${C}_data:
    ; Imported HUD frame snapshot for ${o.name} (${g.length} cells)
`,g.forEach(L=>{const D=L.y*32+L.x,R=D&255,k=D>>8&255,P=L.charCode&255;l+=`    DB #${R.toString(16).padStart(2,"0").toUpperCase()},#${k.toString(16).padStart(2,"0").toUpperCase()},#${P.toString(16).padStart(2,"0").toUpperCase()}
`}),l+=`
${C}_draw:
    ; Draw imported HUD frame chars into Name Table
    ld hl, ${C}_data
    ld bc, ${g.length}

${C}_draw_loop:
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
    jr ${C}_draw_loop

`),w?(l+=`load_screen_${i.toLowerCase()}${d.toLowerCase()}:
    ; Load ${o.name} screen (fast direct port access)
    ; Active Area: X=${u}, Y=${h}, W=${y}, H=${b}
    ; Preserve HUD/non-active area: only overwrite active game area
    ; Set VDP colors FIRST (before loading screen data)
    ld a, ${r}           ; Background color
    ld b, ${_}       ; Border color
    call set_screen_colors
    ; Initialize character 0 (empty cells) with background color
    ld a, ${r}           ; Background color for char 0
    call init_char0_color
`,t&&(l+=`    ; Clear hardware sprites on screen switch to avoid visual carry-over
    call clear_all_sprites
    call update_sprites_to_vram
`),y===32?l+=`    ; Load active game area (contiguous rows)
    call mapper_push_p2
    ld a, SCREEN_${i}_${n}_LAYOUT_BANK
    call mapper_set_bank_p2
    ; Preserve HUD / non-active VRAM area: overwrite only gameplay rows
    ld hl, SCREEN_${i}_${n}_LAYOUT + ${v}
    ld de, NAMETBL + ${v}
    ld bc, ${f}
    call FAST_LDIRVM
    call mapper_pop_p2
`:l+=`    ; Load active game area (rectangular copy by rows)
    call mapper_push_p2
    ld a, SCREEN_${i}_${n}_LAYOUT_BANK
    call mapper_set_bank_p2
    ; Preserve HUD / non-active VRAM area: overwrite only gameplay rectangle
    ld hl, SCREEN_${i}_${n}_LAYOUT + ${v}
    ld de, NAMETBL + ${v}
    ld a, ${b}
    ld c, ${y}
    call copy_layout_rect_to_vram
    call mapper_pop_p2
`,l+=`    ; Build mutable runtime screen/effects/behavior maps in RAM
    call mapper_push_p2
    ld a, SCREEN_${i}_${n}_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, SCREEN_${i}_${n}_LAYOUT
    ld de, runtime_background_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    ld hl, SCREEN_${i}_${n}_LAYOUT
    ld de, runtime_screen_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    call mapper_push_p2
    ld a, SCREEN_${i}_${n}_EFFECTS_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, SCREEN_${i}_${n}_EFFECTS_LAYOUT
    ld de, runtime_effects_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    call mapper_push_p2
    ld a, BEHAVIOR_${i}_${n}_DATA_BANK
    call mapper_set_bank_p2
    ld hl, BEHAVIOR_${i}_${n}_DATA
    ld de, runtime_behavior_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    ld a, ${A}
    ld (current_effect_zone_count), a
    or a
    jr z, .load_${i.toLowerCase()}${d.toLowerCase()}_zones_done
    call mapper_push_p2
    ld a, SCREEN_${i}_${n}_EFFECT_ZONE_TABLE_BANK
    call mapper_set_bank_p2
    ld hl, SCREEN_${i}_${n}_EFFECT_ZONE_TABLE
    ld de, runtime_effect_zone_table
    ld bc, ${A*8}
    ldir
    call mapper_pop_p2
.load_${i.toLowerCase()}${d.toLowerCase()}_zones_done:
`,S&&(l+=`    ; Imported HUD frame is drawn on world/game start only
`),l+=`    ; Initialize collision system pointers for this screen
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

`):(l+=`load_screen_${i.toLowerCase()}${d.toLowerCase()}:
    ; Load ${o.name} screen (fast direct port access)
    ; Set VDP colors FIRST (before loading screen data)
    ld a, ${r}           ; Background color
    ld b, ${_}       ; Border color
    call set_screen_colors
    ; Initialize character 0 (empty cells) with background color
    ld a, ${r}           ; Background color for char 0
    call init_char0_color
`,t&&(l+=`    ; Clear hardware sprites on screen switch to avoid visual carry-over
    call clear_all_sprites
    call update_sprites_to_vram
`),l+=`    ; Now load screen layout (full 32x24)
    call mapper_push_p2
    ld a, SCREEN_${i}_${n}_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, SCREEN_${i}_${n}_LAYOUT
    ld de, NAMETBL
    ld bc, SCREEN_${i}_${n}_SIZE
    call FAST_LDIRVM           ; Fast VRAM write (direct port access)
    call mapper_pop_p2
`,l+=`    ; Build mutable runtime screen/effects/behavior maps in RAM
    call mapper_push_p2
    ld a, SCREEN_${i}_${n}_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, SCREEN_${i}_${n}_LAYOUT
    ld de, runtime_background_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    ld hl, SCREEN_${i}_${n}_LAYOUT
    ld de, runtime_screen_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    call mapper_push_p2
    ld a, SCREEN_${i}_${n}_EFFECTS_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, SCREEN_${i}_${n}_EFFECTS_LAYOUT
    ld de, runtime_effects_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    call mapper_push_p2
    ld a, BEHAVIOR_${i}_${n}_DATA_BANK
    call mapper_set_bank_p2
    ld hl, BEHAVIOR_${i}_${n}_DATA
    ld de, runtime_behavior_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    ld a, ${A}
    ld (current_effect_zone_count), a
    or a
    jr z, .load_${i.toLowerCase()}${d.toLowerCase()}_zones_done
    call mapper_push_p2
    ld a, SCREEN_${i}_${n}_EFFECT_ZONE_TABLE_BANK
    call mapper_set_bank_p2
    ld hl, SCREEN_${i}_${n}_EFFECT_ZONE_TABLE
    ld de, runtime_effect_zone_table
    ld bc, ${A*8}
    ldir
    call mapper_pop_p2
.load_${i.toLowerCase()}${d.toLowerCase()}_zones_done:
`,S&&(l+=`    ; Imported HUD frame is drawn on world/game start only
`),l+=`    ; Initialize collision system pointers for this screen
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

`)})):l+=`; ==================================================================
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
`,l+=`
; ==================================================================
; END OF SCREENS
; ==================================================================
`,l}function tn(e){var s,p,m,u;const t=(p=(s=e.gameFlow)==null?void 0:s.nodes)==null?void 0:p.some(h=>h.type==="SubMenu"),a=(m=e.screenMaps)==null?void 0:m.some(h=>{var y,b;return((y=h.layers)==null?void 0:y.text)||((b=h.textElements)==null?void 0:b.length)>0}),l=(u=e.screenMaps)==null?void 0:u.some(h=>{var y;return((y=h.hudConfiguration)==null?void 0:y.elements)&&h.hudConfiguration.elements.length>0});if(!t&&!a&&!l)return`; ==================================================================
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
`;const o=new Map,n=new Map,i=[{code:32,pattern:[0,0,0,0,0,0,0,0]},{code:43,pattern:[0,16,16,124,16,16,0,0]},{code:45,pattern:[0,0,0,126,0,0,0,0]},{code:62,pattern:[0,48,24,12,24,48,0,0]},{code:124,pattern:[24,24,24,24,24,24,24,24]}];if(i.forEach(h=>{o.set(h.code,h.pattern),n.set(h.code,[240,240,240,240,240,240,240,240])}),e.fonts&&e.fonts.length>0){const h=e.fonts[0],y=h.data.fontData||{},b=h.data.fontColorAttributes||{},E=w=>{if(w.startsWith("rgba(0,0,0,0)"))return 0;const v=w.toUpperCase();return{"RGBA(0,0,0,0)":0,"#000000":1,"#21C842":2,"#5EDC78":3,"#5455ED":4,"#7D76FC":5,"#D4524D":6,"#42EBF5":7,"#FC5554":8,"#FF7978":9,"#D4C154":10,"#E6CE80":11,"#21B03B":12,"#C95BBA":13,"#CCCCCC":14,"#FFFFFF":15}[v]??15};Object.keys(y).forEach(w=>{const v=parseInt(w,10),f=y[v];if(Array.isArray(f)&&f.length===8)if(o.set(v,f),b[v]&&Array.isArray(b[v])){const A=b[v],g=[];for(let S=0;S<8;S++)if(A[S]&&typeof A[S]=="object"){const C=A[S].fg,x=A[S].bg,M=E(C),L=E(x);g.push(M<<4|L)}else g.push(240);n.set(v,g)}else n.set(v,[240,240,240,240,240,240,240,240])})}else{for(let h=48;h<=57;h++)o.set(h,[62,127,115,115,115,127,62,0]);for(let h=65;h<=90;h++)o.set(h,[62,127,99,127,127,99,99,0]);i.forEach(h=>o.set(h.code,h.pattern))}let r=`FONT_PATTERN_DATA:
`,_=`FONT_COLOR_DATA:
`,d=`FONT_CHAR_INDEX:
    DB `;const c=Array.from(o.keys()).filter(h=>h<128).sort((h,y)=>h-y);return c.forEach((h,y)=>{const b=o.get(h),E=n.get(h)||[240,240,240,240,240,240,240,240];r+=`    ; Char ${h} ('${String.fromCharCode(h)}')
`,r+=`    DB ${b.map(w=>"#"+w.toString(16).padStart(2,"0").toUpperCase()).join(", ")}
`,_+=`    ; Char ${h}
`,_+=`    DB ${E.map(w=>"#"+w.toString(16).padStart(2,"0").toUpperCase()).join(", ")}
`,d+=`${h}${y<c.length-1?", ":""}`}),d+=`
FONT_CHAR_COUNT EQU ${c.length}
`,`; ==================================================================
; MSX FONT DATA FOR SCREEN 2 TEXT
; File: font.asm
; Description: Font pattern data generated from project assets
; ==================================================================

FONT_PATTERN_DATA_BANK EQU ((FONT_PATTERN_DATA - #4000) / #2000)
FONT_COLOR_DATA_BANK   EQU ((FONT_COLOR_DATA - #4000) / #2000)

; ==================================================================
; FONT PATTERN DATA
; ==================================================================

${r}

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
    call mapper_push_p2
    ld a, FONT_PATTERN_DATA_BANK
    call mapper_set_bank_p2
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
    call FAST_LDIRVM              ; Copy from HL(RAM) to DE(VRAM)

    ; Advance source pointer
    ld bc, 8
    add iy, bc                    ; IY += 8

    pop de                        ; Restore bank base
    pop bc                        ; Restore loop counter
    djnz .load_loop
    call mapper_pop_p2
    ret

; ==================================================================
; FONT COLOR ATTRIBUTES
; ==================================================================

${_}

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
    call mapper_push_p2
    ld a, FONT_COLOR_DATA_BANK
    call mapper_set_bank_p2
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
    call FAST_LDIRVM              ; Copy from HL(RAM) to DE(VRAM)

    ; Advance source pointer
    ld bc, 8
    add iy, bc                    ; IY += 8

    pop de                        ; Restore bank base
    pop bc                        ; Restore loop counter
    djnz .load_colors_loop
    call mapper_pop_p2
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
`}function ma(e,t){return(Array.isArray(e.globalVariables)?e.globalVariables:[]).some(l=>String((l==null?void 0:l.asmName)||"").trim().toLowerCase()===t.toLowerCase())}function an(e){var n,i,r;const t=[],a=new Map;if(console.log(`🎯 [HUD Generator] Total screens: ${((n=e.screenMaps)==null?void 0:n.length)||0}`),(i=e.screenMaps)==null||i.forEach(_=>{var s;const d=!!_.hudConfiguration,c=((s=_.hudConfiguration)==null?void 0:s.elements)||[];console.log(`  📺 Screen "${_.name}" (${_.id}): hudConfiguration=${d}, elements=${c.length}`),c.length>0&&(c.forEach((p,m)=>console.log(`    📝 Element[${m}]: type=${p.type}, name="${p.name}", text="${p.text||""}" pos=(${p.position.x},${p.position.y}) visible=${p.visible}`)),t.push(...c),a.set(_.id,c))}),console.log(`🎯 [HUD Generator] Total HUD elements found: ${t.length}`),t.length===0)return`; ==================================================================
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
`;let l=`; ==================================================================
; HUD SYSTEM - Screen 2 Text Rendering
; ==================================================================
; Total HUD Elements: ${t.length}
; Screens with HUD: ${a.size}
;
; HUD Elements use TileBank fonts to render text in Screen 2 mode
; Each element can be positioned anywhere on screen (256x192 pixels)
; ==================================================================

`;l+=ln(t);let o=0;return(r=e.screenMaps)==null||r.forEach(_=>{const d=_.activeAreaY??0;d>o&&(o=d)}),l+=on(),l+=nn(t,o,e),l+=rn(t),l}function ln(e){let t=`; ------------------------------------------------------------------
; HUD DATA STRUCTURES
; ------------------------------------------------------------------

`;return t+=`HUD_ELEMENT_COUNT   EQU ${e.length}

`,t+=`; HUD Element Data Table
`,t+=`; Format: [Type:1][X:1][Y:1][Width:1][Height:1][Flags:1][TextPtr:2][Visible:1]
`,t+=`hud_element_data:
`,e.forEach((a,l)=>{const o=sn(a.type),n=a.position.x,i=a.position.y,r=a.visible?1:0,_=`hud_text_${l}`;let d=0,c=1,s=0;const p=a.details||{};(p.border||p.borderColor||p.overallBorderColor)&&(s|=1),a.text?d=a.text.length:p.width?d=Math.ceil(p.width/8):d=10,t+=`    DB ${o}, ${n}, ${i}    ; Element ${l}: ${a.type} at (${n},${i})
`,t+=`    DB ${d}, ${c}, ${s} ; W, H, Flags
`,t+=`    DW ${_}             ; Text pointer
`,t+=`    DB ${r}                ; Visible
`}),t+=`
`,t+=`; HUD Text Strings
`,e.forEach((a,l)=>{const o=a.text||a.name||"",n=`hud_text_${l}`;t+=`${n}:
`,t+=`    DB "${o}", 0
`}),t+=`
`,t}function on(e){return`; ------------------------------------------------------------------
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

`}function nn(e,t,a){const o=e.findIndex(d=>d.type===le.Score),n=e.findIndex(d=>d.type===le.Lives),i=ma(a,"global_var_score"),r=ma(a,"global_var_lives");return`; ------------------------------------------------------------------
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
;   - Re-applies dynamic numeric fields (Score/Lives) after redrawing static text
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
${`${o>=0&&i?`
    ; Re-apply dynamic Score digits after redrawing static HUD text.
    ld a, (global_var_score)
    ld l, a
    ld a, (global_var_score+1)
    ld h, a
    call update_hud_score
`:o>=0?`
    ; Score HUD present but global_var_score is not allocated in this project.
`:""}${n>=0&&r?`
    ; Re-apply dynamic Lives digit after redrawing static HUD text.
    ld a, (global_var_lives)
    call update_hud_lives
`:n>=0?`
    ; Lives HUD present but global_var_lives is not allocated in this project.
`:""}`}

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

`}function rn(e){const t=e.findIndex(f=>f.type===le.Score),a=e.findIndex(f=>f.type===le.Lives),l=t>=0?e[t]:null,o=a>=0?e[a]:null,n=t>=0?`hud_text_${t}`:null,i=a>=0?`hud_text_${a}`:null,r=(f,A)=>{const g=f||"",S=/\d+(?!.*\d)/.exec(g);return!S||typeof S.index!="number"?{offset:g.length,digits:A}:{offset:S.index,digits:Math.max(1,S[0].length)}},_=(l==null?void 0:l.text)||(l==null?void 0:l.name)||"",d=(o==null?void 0:o.text)||(o==null?void 0:o.name)||"",c=r(_,5),s=r(d,1),p=(f,A)=>{var C,x;if(!f)return null;const g=Math.floor((((C=f.position)==null?void 0:C.x)||0)/8)+A;return 6144+Math.floor((((x=f.position)==null?void 0:x.y)||0)/8)*32+g},m=p(l,c.offset),u=p(o,s.offset),h=Math.min(c.digits,5),y=Math.max(0,c.digits-h),b=[1e4,1e3,100,10],E=b.slice(b.length-Math.max(0,h-1)),w=Array.from({length:y},(f,A)=>`    ; Leading digit ${A}: forced zero (Score is 16-bit max 65535)
    ld a, '0'
    push hl
    ld h, d
    ld l, e
    call FAST_WRTVRM
    pop hl
    inc de
`).join(""),v=E.map((f,A)=>`    ; Runtime digit ${A}: / ${f}
    ld bc, ${f}
    call .div16
    add a, '0'
    push hl
    ld h, d
    ld l, e
    call FAST_WRTVRM
    pop hl
    inc de
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

    ; OPTIMIZED: Inline ASCII validation (saves CALL/RET overhead = 27 cycles)
    cp 32                       ; Check if >= 32 (printable ASCII)
    jr nc, .valid_char          ; If valid, skip to write
    ld a, 32                    ; Replace control chars with space
.valid_char:

    ; Write tile to VRAM Name Table
    ; WRTVRM signature: A = data, HL = VRAM address
    ; A already has character, HL already has VRAM address
    push de                     ; Save string pointer
    call FAST_WRTVRM            ; Write A to VRAM at HL
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
    call FAST_WRTVRM
    inc hl
    
    ; Top Edge
    ld a, b
    sub 2               ; Width - 2 corners
    jr z, .skip_top_edge ; Skip if exactly 2 wide (no edge)
    jr c, .skip_top_edge ; Skip if < 2 wide
    ld b, a
.top_edge_loop:
    ld a, 45            ; '-'
    call FAST_WRTVRM
    inc hl
    djnz .top_edge_loop
.skip_top_edge:
    
    ; Top-Right Corner
    ld a, 43            ; '+'
    call FAST_WRTVRM
    
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
    call FAST_WRTVRM
    
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
    call FAST_WRTVRM
    
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
    call FAST_WRTVRM
    inc hl
    
    ; Bottom Edge
    ld a, b
    sub 2               ; Width - 2 corners
    jr z, .skip_bottom_edge
    jr c, .skip_bottom_edge
    ld b, a
.bottom_edge_loop:
    ld a, 45            ; '-'
    call FAST_WRTVRM
    inc hl
    djnz .bottom_edge_loop
.skip_bottom_edge:
    
    ; Bottom-Right Corner
    ld a, 43            ; '+'
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
; Writes score digits directly into the HUD numeric field in VRAM
; Output:
;   None
; Clobbers:
;   None visible to caller
; Preserves:
;   AF, BC, DE, HL
; Notes:
;   - Uses BC internally for decimal divisors
;   - Uses DE internally as VRAM cursor for the numeric field
;   - Writes only the numeric digits; the static "SCORE: " label is not touched
; ------------------------------------------------------------------
update_hud_score:
${n?`    push af
    push bc
    push de
    push hl

    ; Direct VRAM update of the numeric HUD field.
    ; Static label ("SCORE: ") stays in ROM; only digits are rewritten.
    ld de, #${(m||0).toString(16).toUpperCase()}

${w}${v}    ; Final digit: ones (remainder)
    ld a, l
    add a, '0'
    push hl
    ld h, d
    ld l, e
    call FAST_WRTVRM
    pop hl

    pop hl
    pop de
    pop bc
    pop af`:"    ; No Score element defined in HUD"}
    ret

${n?`; Helper: HL = HL / BC, A = quotient, HL = remainder
.div16:
    xor a                       ; Quotient = 0
.div16_loop:
    or a                        ; Clear carry
    sbc hl, bc                  ; HL -= BC
    jr c, .div16_done           ; If underflow, done
    inc a                       ; Quotient++
    jr .div16_loop
.div16_done:
    add hl, bc                  ; Restore remainder
    ret
`:""}
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
; Notes:
;   - Writes only the numeric digit in VRAM; the static label is not touched
; ------------------------------------------------------------------
update_hud_lives:
${i?`    push af
    push hl

    ; Direct VRAM update of the Lives numeric field.
    add a, '0'                  ; Convert to ASCII
    ld hl, #${(u||0).toString(16).toUpperCase()}
    call FAST_WRTVRM

    pop hl
    pop af`:"    ; No Lives element defined in HUD"}
    ret

`}function sn(e){return{[le.Score]:1,[le.HighScore]:2,[le.Lives]:3,[le.EnergyBar]:4,[le.ItemDisplay]:5,[le.SceneName]:6,[le.MiniMap]:7,[le.CoinCounter]:8,[le.BossEnergyBar]:9,[le.PhaseIndicator]:10,[le.AttackAlert]:11,[le.TextBox]:12,[le.NumericField]:13,[le.CustomCounter]:14}[e]||0}function et(e){return e.toLowerCase().replace(/[^a-z0-9]/g,"_")}function tt(e){return e.toUpperCase().replace(/[^A-Z0-9]/g,"_")}function ba(e){switch(String(e??"").trim().toLowerCase()){case"north":case"up":return"north";case"south":case"down":return"south";case"east":case"right":return"east";case"west":case"left":return"west";default:return null}}function at(e,t){const a=t==="from"?"fromNodeId":"toNodeId",l=e==null?void 0:e[a];if(typeof l=="string"&&l.length>0)return l;const o=e==null?void 0:e[t];return typeof o=="string"&&o.length>0?o:o&&typeof o.nodeId=="string"&&o.nodeId.length>0?o.nodeId:null}function fa(e,t){const a=t==="from"?"fromDirection":"toDirection",l=e==null?void 0:e[a],o=ba(l);if(o)return o;const n=e==null?void 0:e[t];return ba(n==null?void 0:n.direction)}function ft(e,t){var n,i;const a=(n=t.screens)==null?void 0:n.find(r=>r.id===e),l=((i=a==null?void 0:a.name)==null?void 0:i.toUpperCase().replace(/[^A-Z0-9]/g,"_"))||"UNKNOWN",o=e?`_${e.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";return`load_screen_${l.toLowerCase()}${o.toLowerCase()}`}function ya(e,t){var v;const a=(v=t.screens)==null?void 0:v.find(f=>f.id===e),l=Math.max(1,(a==null?void 0:a.width)??32),o=Math.max(1,(a==null?void 0:a.height)??24),n=Math.max(0,Math.min(l-1,(a==null?void 0:a.activeAreaX)??0)),i=Math.max(0,Math.min(o-1,(a==null?void 0:a.activeAreaY)??0)),r=Math.max(1,Math.min(l-n,(a==null?void 0:a.activeAreaWidth)??l)),_=Math.max(1,Math.min(o-i,(a==null?void 0:a.activeAreaHeight)??o)),d=n*8,c=i*8,s=d+r*8,p=c+_*8,m=2,u=16,h=16,y=d+m,b=Math.max(y,s-u-m),E=c+m,w=Math.max(E,p-h-m);return{leftPx:d,topPx:c,rightPx:s,bottomPx:p,westExitX:d+m,eastExitX:Math.max(d,s-u),northExitY:c+m,southExitY:Math.max(c,p-h),enterWestX:y,enterEastX:b,enterNorthY:E,enterSouthY:w}}function dn(e,t){var i,r,_,d;const a=(i=t.screens)==null?void 0:i.find(c=>c.id===e),l=(_=(r=a==null?void 0:a.hudConfiguration)==null?void 0:r.importedFrame)==null?void 0:_.cells;if(!Array.isArray(l)||l.length===0)return null;const o=((d=a==null?void 0:a.name)==null?void 0:d.toUpperCase().replace(/[^A-Z0-9]/g,"_"))||"UNKNOWN",n=e?`_${e.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";return`hud_imported_frame_${o.toLowerCase()}${n.toLowerCase()}_draw`}function cn(e,t){const a=Array.isArray(e==null?void 0:e.nodes)?e.nodes:[];if(a.length===0)return null;const l=[],o=e==null?void 0:e.startScreenNodeId,n=a.find(i=>(i==null?void 0:i.id)===o);n&&l.push(n),a.forEach(i=>{(!n||(i==null?void 0:i.id)!==n.id)&&l.push(i)});for(const i of l){const r=i==null?void 0:i.screenAssetId;if(!r)continue;const _=dn(r,t);if(_)return _}return null}function _n(e,t,a,l,o,n,i){const r=`check_transition_${e}_s${t}_skip_${a}`,_=`check_transition_${e}_s${t}_apply_${a}`;let d="",c="";return a==="east"?(d=`    ; East exit: X near right edge and rightward input
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
`,c=`    ; Enter from west edge
    ld hl, entity_x_pos
    add hl, de
    ld (hl), ${i.enterWestX}
`):a==="west"?(d=`    ; West exit: X near left edge and leftward input
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
`,c=`    ; Enter from east edge of target active area
    ld hl, entity_x_pos
    add hl, de
    ld (hl), ${i.enterEastX}
`):a==="south"?(d=`    ; South exit: Y near bottom edge
    ; No input-direction gate: supports gravity/platform-driven movement
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    cp ${n.southExitY}
    jp c, ${r}
`,c=`    ; Enter from north edge
    ld hl, entity_y_pos
    add hl, de
    ld (hl), ${i.enterNorthY}
`):(d=`    ; North exit: Y near top edge
    ; No input-direction gate: supports velocity-driven movement
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    cp ${n.northExitY}
    jp nc, ${r}
`,c=`    ; Enter from south edge of target active area
    ld hl, entity_y_pos
    add hl, de
    ld (hl), ${i.enterSouthY}
`),`${d}${_}:
    push de
    ld a, ((${o} - #4000) / #2000)
    ld hl, ${o}
    call mapper_call_hl_auto
    pop de
    ld a, ${l}
    ld (current_screen_index), a
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ld hl, entity_screen_id
    add hl, de
    ld (hl), a
${c}    ; Reset player velocity after transition
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
`}function pn(e){var o;const t=e.worldmaps||[],a=!!((o=e.screenMaps)!=null&&o.some(n=>{var i;return Array.isArray((i=n==null?void 0:n.hudConfiguration)==null?void 0:i.elements)&&n.hudConfiguration.elements.length>0}));if(t.length===0)return`; ==================================================================
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
`;let l=`; ==================================================================
; WORLD MAPS
; File: worlds.asm
; Description: World map structures and screen loading functions
; Generated by Mideas MSX Generator
; ==================================================================

`;return l+=`; ==================================================================
; WORLD MAP CONSTANTS
; ==================================================================

`,t.forEach((n,i)=>{var d;const r=tt(n.name||`world_${i}`),_=n.id||`world_${i}`;if(l+=`; World: ${n.name||"Unnamed"} (${_})
WORLD_${r}_ID EQU ${i}
WORLD_${r}_SCREEN_COUNT EQU ${((d=n.nodes)==null?void 0:d.length)||0}
`,n.nodes&&n.nodes.length>0){const c=new Map;n.nodes.forEach((s,p)=>{const m=tt(s.name||`screen_${p}`),u=c.get(m)||0,h=u===0?m:`${m}_${u+1}`;c.set(m,u+1),l+=`WORLD_${r}_SCREEN_${h}_ID EQU ${p}
`})}l+=`
`}),l+=`; ==================================================================
; WORLD LOADING FUNCTIONS
; ==================================================================

`,t.forEach(n=>{const i=n.id||"unknown",r=n.startScreenNodeId,_=n.nodes||[];if(l+=`; ------------------------------------------------------------------
; Load World: ${n.name||"Unnamed"}
; World ID: ${i}
; Screens: ${_.length}
; Start Screen Node: ${r||"none"}
; ------------------------------------------------------------------
load_world_${et(i)}:
`,_.length===0){l+=`    ; No screens in this world
    ret

`;return}const d=_.find(u=>u.id===r)||_[0],c=Math.max(0,_.findIndex(u=>u.id===d.id)),s=d.screenAssetId;if(!s){l+=`    ; No valid start screen found
    ret

`;return}const p=ft(s,e),m=cn(n,e);l+=`    ; Load start screen: ${d.name||"unknown"} (${s})
    ld a, ((${p} - #4000) / #2000)
    ld hl, ${p}
    call mapper_call_hl_auto

`,m&&(l+=`    ; Draw imported HUD frame once at world start
    call ${m}

`),a&&(l+=`    ; Draw HUD frame once at world start
    call imprimir_marco

`),l+=`    ; Initialize world state
    ld a, WORLD_${tt(n.name||"unnamed")}_ID
    ld (current_world_id), a

    ld a, ${c}
    ld (current_screen_index), a
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1

    xor a
    ld (screen_transition_cooldown), a

    call rebuild_used_entity_list  ; Precompute room entity buckets before gameplay resumes
    call apply_collected_tiles     ; Re-apply persistent collection state for this screen
    ret

`}),l+=`; ==================================================================
; SCREEN TRANSITION FUNCTIONS
; ==================================================================

`,t.forEach(n=>{const i=n.id||"unknown",r=n.nodes||[],_=n.connections||[];if(_.length===0){l+=`; World ${n.name||"Unnamed"} has no screen connections

`;return}l+=`; ------------------------------------------------------------------
; World: ${n.name||"Unnamed"}
; Connections: ${_.length}
; ------------------------------------------------------------------

`,_.forEach((d,c)=>{const s=at(d,"from"),p=at(d,"to");if(!s||!p){l+=`; Invalid connection ${c}: missing endpoint IDs

`;return}const m=r.find(E=>E.id===s),u=r.find(E=>E.id===p);if(!m||!u){l+=`; Invalid connection ${c}: missing nodes

`;return}const h=u.screenAssetId,y=r.findIndex(E=>E.id===u.id),b=ft(h,e);l+=`; Transition: ${m.name||"screen"} -> ${u.name||"screen"}
transition_${et(i)}_${c}:
    ld a, ((${b} - #4000) / #2000)
    ld hl, ${b}
    call mapper_call_hl_auto

    ld a, ${y}
    ld (current_screen_index), a
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    call rebuild_used_entity_list  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state
    ret

`})}),l+=`; ==================================================================
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
`,t.forEach((n,i)=>{const r=tt(n.name||`world_${i}`),_=n.id||`world_${i}`,d=`check_transition_world_${et(_)}`;l+=`    cp WORLD_${r}_ID
    jp z, ${d}
`}),l+=`    ret

`,t.forEach((n,i)=>{const r=n.id||`world_${i}`,_=et(r),d=n.nodes||[],c=n.connections||[];if(l+=`check_transition_world_${_}:
`,d.length===0||c.length===0){l+=`    ret

`;return}const s=new Map;d.forEach((m,u)=>s.set(m.id,u));const p=new Map;d.forEach((m,u)=>p.set(u,{})),c.forEach(m=>{const u=at(m,"from"),h=at(m,"to"),y=fa(m,"from"),b=fa(m,"to");if(!u||!h)return;const E=s.get(u),w=s.get(h);if(!(E===void 0||w===void 0)){if(y){const v=p.get(E);v&&v[y]===void 0&&(v[y]=w)}if(b){const v=p.get(w);v&&v[b]===void 0&&(v[b]=E)}}}),l+=`    ld a, (current_screen_index)
`,d.forEach((m,u)=>{const h=`check_transition_${_}_screen_${u}`;l+=`    cp ${u}
    jp z, ${h}
`}),l+=`    ret

`,d.forEach((m,u)=>{const h=p.get(u)||{},y=`check_transition_${_}_screen_${u}`;l+=`${y}:
`;const b=["east","west","south","north"];let E=!1;b.forEach(w=>{const v=h[w];if(v===void 0)return;const f=d[v];if(!(f!=null&&f.screenAssetId))return;const A=ft(f.screenAssetId,e),g=ya(m.screenAssetId,e),S=ya(f.screenAssetId,e);l+=_n(_,u,w,v,A,g,S),E=!0}),l+=`    ret

`})}),l+=`; ==================================================================
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
`,l}function Ea(e){e=e.replace("#","");const t=parseInt(e.substring(0,2),16),a=parseInt(e.substring(2,4),16),l=parseInt(e.substring(4,6),16);if(t<50&&a<50&&l<50)return 1;if(t>200&&a>200&&l>200)return 15;if(t>200&&a<100&&l<100)return 8;if(t<100&&a>200&&l<100)return 3;if(t<100&&a<100&&l>200)return 5;if(t>200&&a>200&&l<100)return 10;if(t>150&&a<100&&l>150)return 13;if(t<100&&a>150&&l>150)return 7;const o=(t+a+l)/3;return o<64?1:o<128?14:15}function hn(e){const t=e.gameFlow&&e.gameFlow.nodes&&e.gameFlow.nodes.some(l=>l.type==="SubMenu");if(!t)return`; ==================================================================
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

`;return t?(a+=`; ==================================================================
; MENU CONSTANTS
; ==================================================================

`,e.gameFlow.nodes.filter(n=>n.type==="SubMenu").forEach((n,i)=>{const r=(n.title||n.id).toUpperCase().replace(/[^A-Z0-9]/g,"_");a+=`MENU_${r}_ID EQU ${i}
`}),a+=`
; ==================================================================
; MENU FUNCTIONS
; ==================================================================

`,e.gameFlow.nodes.filter(n=>n.type==="SubMenu").forEach(n=>{var s,p,m,u;(n.title||n.id).toUpperCase().replace(/[^A-Z0-9]/g,"_");const i=n.id.replace(/[^a-zA-Z0-9]/g,"_"),r=((p=(s=n.appearance)==null?void 0:s.colors)==null?void 0:p.background)||"#000000",_=((u=(m=n.appearance)==null?void 0:m.colors)==null?void 0:u.border)||"#FFFFFF",d=Ea(r),c=Ea(_);a+=`show_menu_${i}:
    ; Display ${n.title||n.id} menu
    ; Set background color using VDP
    ld b, ${d*16+c} ; Background (high) | Border (low)
    ld c, 7                     ; VDP Register 7
    call FAST_WRTVDP

    ; Set system color variables
    ld a, ${c}
    ld (BDRCLR), a

    ld a, ${d}
    ld (BAKCLR), a

    ld a, 15                    ; Default text color (White)
    ld (FORCLR), a

    ; Clear screen with background color
    call CLS

    ; Display menu title
    ld hl, menu_${i}_title
    ld de, NAMETBL + (5 * 32) + 10
    call print_string_screen2

    ; Display menu options
    ; TODO: Add option rendering logic here

    ret

menu_${i}_title:
    db "${(n.title||"Menu").replace(/"/g,'\\"')}", 0

handle_menu_${i}:
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
`,a}const ga={[I.NONE]:0,[I.SET_POSITION]:1,[I.MOVE_BY]:2,[I.SET_VELOCITY]:3,[I.APPLY_FORCE]:4,[I.CHANGE_SPRITE]:5,[I.PLAY_ANIMATION]:6,[I.SET_ANIMATION_SPEED]:7,[I.TOGGLE_ANIMATION]:8,[I.PLAY_SOUND]:9,[I.PLAY_MUSIC]:10,[I.MUTE_MUSIC]:11,[I.STOP_MUSIC]:12,[I.SET_VARIABLE]:13,[I.INCREMENT_VARIABLE]:14,[I.DECREMENT_VARIABLE]:15,[I.SET_COMPONENT_PROPERTY]:16,[I.WAIT]:17,[I.GOTO_STATE]:18,[I.DESTROY_ENTITY]:19,[I.SPAWN_ENTITY]:20,[I.GET_RANDOM_ENTITY_POSITION]:21,[I.CHANGE_GAME_FLOW_NODE]:22,[I.REGENERATE_HUD]:23,[I.DECREASE_LIVES]:24,[I.INCREASE_LIVES]:25,[I.RESPAWN_PLAYER]:26,[I.BREAK_TILE]:27,[I.REPLACE_TILE]:28,[I.RND]:29,[I.POINT_AT]:30,[I.ADD_VARIABLES]:31,[I.SUBTRACT_VARIABLES]:32,[I.MULTIPLY_VARIABLES]:33,[I.DIVIDE_VARIABLES]:34,[I.MODULO_VARIABLES]:35,[I.ASSIGN_VARIABLE]:36,[I.DISABLE_INPUT]:37,[I.ENABLE_INPUT]:38,[I.CLEAN_SPRITES]:39,[I.EXIT_CURRENT_WORLD]:40,END:255},un={[F.AND]:1,[F.OR]:2,[F.NOT]:3,[F.KEY_PRESSED]:4,[F.KEY_RELEASED]:5,[F.TIME_OUT]:6,[F.CAN_MOVE_DIRECTION]:7,[F.HAS_COLLISION]:8,[F.PATH_CLEAR]:9,[F.ON_WALL_COLLISION]:10,[F.HAS_DEADLY_TILE_COLLISION]:11,[F.ANIMATION_COMPLETE]:12,[F.KEY_AND_MOVEMENT]:13,[F.VARIABLE_COMPARE]:14,[F.XOR]:15},mn={x:0,y:1,vx:2,vy:3,isOnGround:4,health:5,gem_count:6,last_gem_char:7},Sa={"==":0,"!=":1,">":2,"<":3,">=":4,"<=":5},Aa={up:1,arrowup:1,down:5,arrowdown:5,left:7,arrowleft:7,right:3,arrowright:3,fire:9,space:9},yt={up:1,down:5,left:7,right:3},Ta={any:0,up:1,down:5,left:7,right:3},Ca={any:0,wall:1,enemy:2,item:3,entity:4},Ia={up:0,down:1,left:2,right:3,"up-right":4,"up-left":5,"down-right":6,"down-left":7},bn={comp_pos:1,position:1,comp_physics:2,physics:2,comp_render:3,render:3,comp_animation:4,animation:4,comp_health:5,health:5},fn={x:1,y:2,vx:3,velocityx:3,vy:4,velocityy:4,sprite:5,spriteassetid:5,isvisible:6,frame:7,currentframeindex:7,animationspeed:8,speed:8,isplaying:9,current:10,max:11};function yn(e){const t={...mn};return e&&e.length>0&&e.forEach((a,l)=>{const o=8+l;t[a.name]=o,a.asmName&&(t[a.asmName]=o)}),t}function En(e){const t={};if(!e||e.length===0)return t;let a=128;return e.forEach(l=>{if(!l||!l.id)return;t[l.id]=a,l.name&&(t[String(l.name)]=a,t[String(l.name).toLowerCase()]=a);const o=Math.max(1,Math.ceil((Number(l.width)||8)/8)),n=Math.max(1,Math.ceil((Number(l.height)||8)/8));a+=o*n}),t}function gn(e){if(typeof e=="string"){const t=e.toLowerCase(),a=bn[t];if(a!==void 0)return a}return parseInt(z(e),10)||0}function Sn(e){if(typeof e=="string"){const t=e.toLowerCase(),a=fn[t];if(a!==void 0)return a}return parseInt(z(e),10)||0}function An(e,t){if(typeof e=="string"&&t){if(t[e]!==void 0)return t[e];const l=e.toLowerCase();if(t[l]!==void 0)return t[l]}const a=parseInt(z(e),10);return Number.isNaN(a)?0:a}function Ba(e){const t={};if(!e||e.length===0)return t;let a=1;return e.forEach(l=>{!l||!l.id||t[l.id]===void 0&&(t[l.id]=a,l.name&&(t[String(l.name)]=a,t[String(l.name).toLowerCase()]=a),a<255&&(a+=1))}),t}function Tn(e,t,a){const l=a||Ba(e);let o=0;Object.values(l).forEach(c=>{c>o&&(o=c)});const n=new Array(o+1).fill(0),i=new Array(o+1).fill(6),r=new Array(o+1).fill(1),_=new Array(o+1).fill(1),d=(c,s)=>{const p=Number(c);return Number.isFinite(p)?Math.max(0,Math.min(255,p|0)):s};return e==null||e.forEach(c=>{if(!(c!=null&&c.id))return;const s=l[c.id];if(!s)return;const p=Array.isArray(c.components)?c.components:[],m=p.find(A=>(A==null?void 0:A.definitionId)==="comp_render"),u=(m==null?void 0:m.defaultValues)||{},h=u.spriteAssetId??u.sprite??u.spriteId;if(typeof h=="string"&&t){const A=t[h],g=t[h.toLowerCase()];A!==void 0?n[s]=A&255:g!==void 0&&(n[s]=g&255)}const y=p.find(A=>(A==null?void 0:A.definitionId)==="comp_animation"),b=(y==null?void 0:y.defaultValues)||{};i[s]=d(b.animationSpeed??b.speed??6,6);const E=p.find(A=>(A==null?void 0:A.definitionId)==="comp_health"),w=(E==null?void 0:E.defaultValues)||{},v=d(w.current??1,1),f=d(w.max??v,v);r[s]=v,_[s]=f>=v?f:v}),{maxToken:o,spriteByToken:n,animSpeedByToken:i,healthCurByToken:r,healthMaxByToken:_}}const Cn=`
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
    `,In=`
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
;      sprite, y para sprites one-shot borra ONLY_WHEN_MOVING para que
;      la animación avance aunque la entidad esté quieta.
;   5. Upload inmediato: copia el frame 0 del nuevo sprite a VRAM en
;      el mismo frame para que el cambio sea visible sin esperar al
;      siguiente ciclo de update_animation_component.
;   6. Colores de capas: actualiza sprite_layer_colors (tabla RAM) con
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

    ; D guardará el sprite ID para uso posterior (VRAM upload, loop flags).
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
    ld (hl), a              ; entity_anim_flags[entity] = flags actualizados

    ; ------------------------------------------------------------------
    ; BLOQUE 5: Upload inmediato del frame 0 a VRAM
    ;
    ; update_animation_component no se ejecuta hasta el próximo frame.
    ; Para que el sprite nuevo se vea en el frame actual, copiamos el
    ; frame 0 directamente a VRAM ahora.
    ;
    ; Stack a la entrada de este bloque (top → bottom):
    ;   HL = &entity_anim_flags[entity]  ← push hl
    ;   BC = (0, entity_index)           ← push bc
    ;   DE = (spriteId, loopFlag)        ← push de
    ;
    ; Al salir (.acs_upload_done) se recuperan los tres en orden inverso.
    ; ------------------------------------------------------------------
    push hl                 ; [stack] guarda ptr entity_anim_flags (descartado al salir)
    push bc                 ; [stack] BC = (0, entity_index)
    push de                 ; [stack] DE = (D=spriteId, E=loopFlag)

    ; Validar que el sprite ID esté dentro del rango conocido
    ld a, d                 ; A = sprite asset ID
    cp SM_SpriteAssetCount  ; ¿fuera de rango?
    jr nc, .acs_upload_done ; sí → saltar el upload (evitar acceso fuera de tabla)

    ; Obtener puntero al frame 0: SM_SpritePatternPtrTable[spriteId * 2]
    ; El banco ROM se deriva del propio puntero, no de una tabla separada.
    ; Esto evita desincronizaciones cuando el export comprimido remapea
    ; labels de sprite a blobs ZX0 en un postproceso posterior.
    ld e, a
    ld d, 0                 ; DE = sprite asset index

    ld hl, SM_SpritePatternPtrTable
    add hl, de
    add hl, de              ; HL = &SM_SpritePatternPtrTable[spriteId * 2]
    ld e, (hl)
    inc hl
    ld d, (hl)
    ex de, hl               ; HL = puntero al frame 0 (datos de patrón en ROM)
    push hl                 ; [stack] guarda puntero al frame 0

    ; Mapear el banco ROM que contiene los datos del frame 0.
    ; Bank = ((framePtr - #4000) / #2000), derivado en runtime desde HL.
    ld a, h
    sub #40
    srl a
    srl a
    srl a
    srl a
    srl a
    call mapper_push_p2     ; salva el banco actual de P2 en la pila del mapper
    call mapper_set_bank_p2 ; mapea el banco del frame 0 en la ventana P2 (#8000-#BFFF)

    ; Leer configuración HW del sprite: entity_sprite_config[entity * 2]
    ;   byte 0: base HW sprite index (slot en la OAM, 0-31)
    ;   byte 1: layer count (número de capas HW del sprite, típicamente 1-2)
    ld e, c                 ; E = entity index (C preservado de antes)
    ld d, 0
    ld hl, entity_sprite_config
    add hl, de
    add hl, de              ; HL = &entity_sprite_config[entity * 2]
    ld a, (hl)              ; A = base HW sprite index
    inc hl
    ld c, (hl)              ; C = layer count
    ld d, a                 ; D = base HW sprite index

    ; Si layer count = 0, no hay sprite HW asignado → saltar upload
    ld a, c
    or a
    jr z, .acs_upload_pop_source

    ; Calcular BC = layerCount * 32  (bytes totales de patrón a copiar)
    ; Cada capa HW ocupa 32 bytes de patrón (sprite 16x16 = 2 tiles * 16 bytes, comprimido como 32)
    ld a, c
    ld b, 0
    ld c, a                 ; C = layer count
    sla c
    rl b                    ; × 2
    sla c
    rl b                    ; × 4
    sla c
    rl b                    ; × 8
    sla c
    rl b                    ; × 16
    sla c
    rl b                    ; × 32  →  BC = layerCount * 32

    ; Calcular DE = SPRPAT + baseHwSprite * 32  (destino en VRAM)
    ld a, d                 ; A = base HW sprite index
    ld l, a
    ld h, 0
    add hl, hl              ; × 2
    add hl, hl              ; × 4
    add hl, hl              ; × 8
    add hl, hl              ; × 16
    add hl, hl              ; × 32  →  HL = base * 32
    ld de, SPRPAT
    add hl, de              ; HL = SPRPAT + base * 32  (dirección VRAM del slot HW)
    ex de, hl               ; DE = destino VRAM, HL libre para fuente

    pop hl                  ; HL = puntero al frame 0 en ROM  [recuperado del stack]
    call FAST_LDIRVM        ; copia BC bytes desde HL (ROM/RAM) a DE (VRAM)
    jr .acs_upload_restore_bank

.acs_upload_pop_source:
    pop hl                  ; descarta el puntero al frame 0 (layer count = 0, nada que copiar)

.acs_upload_restore_bank:
    call mapper_pop_p2      ; restaura el banco ROM que estaba antes en P2

.acs_upload_done:
    pop de                  ; DE: D = sprite asset ID, E = loop flag  [recuperado del stack]
    pop bc                  ; BC = (0, entity_index)                  [recuperado del stack]
    pop hl                  ; descarta ptr entity_anim_flags           [recuperado del stack]

    ; ------------------------------------------------------------------
    ; BLOQUE 6: Actualizar tabla de colores de capas en RAM
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
;   8=animSpeed, 9=isPlaying, 10=healthCurrent, 11=healthMax.
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
    `;function vn(e){const t=new Set,a=new Set;function l(n){if(n)for(const i of n)i!=null&&i.type&&t.add(i.type)}function o(n){if(n&&(n.type&&a.add(n.type),Array.isArray(n.conditions)))for(const i of n.conditions)o(i)}for(const n of e){for(const i of n.states??[])l(i.onEnter),l(i.onExit);for(const i of n.transitions??[])l(i.actions),o(i.conditions)}return{usedActions:t,usedConditions:a}}function O(e,t,a){const l=`
${t}:`,o=`
${a}:`,n=e.indexOf(l);if(n<0)return e;const i=e.indexOf(o,n);return i<0?e:e.slice(0,n)+`
; [${t} stripped - not used]
`+e.slice(i)}function wn(e,t){const a=`
${t}:`,l=e.indexOf(a);return l<0?e:e.slice(0,l)+`
; [${t} stripped - not used]
`}function H(e,t){return e.replace(new RegExp(`DW ${t}\\s*(;[^\\n]*)`),`DW Action_Nop $1 [${t} stripped]`)}function de(e,t){return e.replace(new RegExp(`DW ${t}\\s*(;[^\\n]*)`),`DW Condition_Nop $1 [${t} stripped]`)}function Dn(e,t,a){const l=(..._)=>_.some(d=>t.has(d)),o=(..._)=>_.some(d=>a.has(d));return l(I.SET_POSITION)||(e=O(e,"Action_SetPosition","Action_MoveBy"),e=H(e,"Action_SetPosition")),l(I.MOVE_BY)||(e=O(e,"Action_MoveBy","Action_SetVelocity"),e=H(e,"Action_MoveBy")),l(I.SET_VELOCITY)||(e=O(e,"Action_SetVelocity","Action_ApplyForce"),e=H(e,"Action_SetVelocity")),l(I.APPLY_FORCE)||(e=O(e,"Action_ApplyForce","SM_FacingDirTablePtrs"),e=H(e,"Action_ApplyForce")),l(I.CHANGE_SPRITE)||(e=O(e,"SM_FacingDirTablePtrs","Action_PlayAnimation"),e=H(e,"Action_ChangeSprite")),l(I.PLAY_ANIMATION)||(e=O(e,"Action_PlayAnimation","Action_SetAnimSpeed"),e=H(e,"Action_PlayAnimation")),l(I.SET_ANIMATION_SPEED)||(e=O(e,"Action_SetAnimSpeed","Action_ToggleAnim"),e=H(e,"Action_SetAnimSpeed")),l(I.TOGGLE_ANIMATION)||(e=O(e,"Action_ToggleAnim","Action_PlaySound"),e=H(e,"Action_ToggleAnim")),l(I.PLAY_SOUND)||(e=O(e,"Action_PlaySound","Action_PlayMusic"),e=H(e,"Action_PlaySound")),l(I.PLAY_MUSIC)||(e=O(e,"Action_PlayMusic","Action_MuteMusic"),e=H(e,"Action_PlayMusic")),l(I.MUTE_MUSIC)||(e=O(e,"Action_MuteMusic","Action_StopMusic"),e=H(e,"Action_MuteMusic")),l(I.STOP_MUSIC)||(e=O(e,"Action_StopMusic","Action_SetVariable"),e=H(e,"Action_StopMusic")),l(I.SET_VARIABLE)||(e=O(e,"Action_SetVariable","Action_IncVariable"),e=H(e,"Action_SetVariable")),l(I.INCREMENT_VARIABLE)||(e=O(e,"Action_IncVariable","Action_DecVariable"),e=H(e,"Action_IncVariable")),l(I.DECREMENT_VARIABLE)||(e=O(e,"Action_DecVariable","Action_Wait"),e=H(e,"Action_DecVariable")),l(I.WAIT)||(e=O(e,"Action_Wait","Action_GotoState"),e=H(e,"Action_Wait")),l(I.GOTO_STATE)||(e=O(e,"Action_GotoState","Action_SetCompProp"),e=H(e,"Action_GotoState")),l(I.SET_COMPONENT_PROPERTY)||(e=O(e,"Action_SetCompProp","Action_DestroyEntity"),e=H(e,"Action_SetCompProp")),l(I.DESTROY_ENTITY)||(e=O(e,"Action_DestroyEntity","Action_SpawnEntity"),e=H(e,"Action_DestroyEntity")),l(I.SPAWN_ENTITY,I.GET_RANDOM_ENTITY_POSITION)||(e=O(e,"Action_SpawnEntity","Action_ChangeGameFlow"),e=H(e,"Action_SpawnEntity"),e=H(e,"Action_GetRandomPos")),l(I.CHANGE_GAME_FLOW_NODE)||(e=O(e,"Action_ChangeGameFlow","Action_RegenerateHud"),e=H(e,"Action_ChangeGameFlow")),l(I.REGENERATE_HUD)||(e=O(e,"Action_RegenerateHud","Action_DecLives"),e=H(e,"Action_RegenerateHud")),l(I.DECREASE_LIVES,I.INCREASE_LIVES,I.RESPAWN_PLAYER)||(e=O(e,"Action_DecLives","Action_BreakTile"),e=H(e,"Action_DecLives"),e=H(e,"Action_IncLives"),e=H(e,"Action_Respawn")),l(I.BREAK_TILE)||(e=O(e,"Action_BreakTile","Action_ReplaceTile"),e=H(e,"Action_BreakTile")),l(I.REPLACE_TILE)||(e=O(e,"Action_ReplaceTile","Action_Rnd"),e=H(e,"Action_ReplaceTile")),l(I.RND)||(e=O(e,"Action_Rnd","Action_PointAt"),e=H(e,"Action_Rnd")),l(I.POINT_AT)||(e=O(e,"Action_PointAt","SM_MusicState"),e=H(e,"Action_PointAt")),l(I.PLAY_SOUND)||(e=O(e,"SM_PlaySoundAsset","SM_UpdateSound"),e=O(e,"SM_PlaySfx_Beep","SM_RandomByte")),l(I.RND,I.SPAWN_ENTITY,I.GET_RANDOM_ENTITY_POSITION)||(e=O(e,"SM_RandomByte","SM_WriteTileRelativeToEntity")),l(I.BREAK_TILE,I.REPLACE_TILE)||(e=O(e,"SM_WriteTileRelativeToEntity","SM_ReadVar")),l(I.SET_VARIABLE,I.INCREMENT_VARIABLE,I.DECREMENT_VARIABLE,I.SET_COMPONENT_PROPERTY,I.ADD_VARIABLES,I.SUBTRACT_VARIABLES,I.MULTIPLY_VARIABLES,I.DIVIDE_VARIABLES,I.MODULO_VARIABLES,I.ASSIGN_VARIABLE)||(e=O(e,"SM_ReadVar","Action_AddVars")),l(I.ADD_VARIABLES)||(e=O(e,"Action_AddVars","Action_SubVars"),e=H(e,"Action_AddVars")),l(I.SUBTRACT_VARIABLES)||(e=O(e,"Action_SubVars","Action_MulVars"),e=H(e,"Action_SubVars")),l(I.MULTIPLY_VARIABLES)||(e=O(e,"Action_MulVars","Action_DivVars"),e=H(e,"Action_MulVars")),l(I.DIVIDE_VARIABLES)||(e=O(e,"Action_DivVars","Action_ModVars"),e=H(e,"Action_DivVars")),l(I.MODULO_VARIABLES)||(e=O(e,"Action_ModVars","Action_AssignVar"),e=H(e,"Action_ModVars")),l(I.ASSIGN_VARIABLE)||(e=O(e,"Action_AssignVar","Action_DisableInput"),e=H(e,"Action_AssignVar")),l(I.DISABLE_INPUT)||(e=O(e,"Action_DisableInput","Action_EnableInput"),e=H(e,"Action_DisableInput")),l(I.ENABLE_INPUT)||(e=O(e,"Action_EnableInput","Action_CleanSprites"),e=H(e,"Action_EnableInput")),l(I.CLEAN_SPRITES)||(e=O(e,"Action_CleanSprites","Action_ExitCurrentWorld"),e=H(e,"Action_CleanSprites")),l(I.EXIT_CURRENT_WORLD)||(e=O(e,"Action_ExitCurrentWorld","SM_ConditionTable"),e=H(e,"Action_ExitCurrentWorld")),o(F.AND)||(e=O(e,"Condition_And","Condition_Or"),e=de(e,"Condition_And")),o(F.OR)||(e=O(e,"Condition_Or","Condition_Xor"),e=de(e,"Condition_Or")),o(F.XOR)||(e=O(e,"Condition_Xor","Condition_Not"),e=de(e,"Condition_Xor")),o(F.NOT)||(e=O(e,"Condition_Not","SM_MatchDirection"),e=de(e,"Condition_Not")),o(F.KEY_PRESSED,F.KEY_RELEASED,F.CAN_MOVE_DIRECTION,F.KEY_AND_MOVEMENT)||(e=O(e,"SM_MatchDirection","SM_DeduceDirectionFromVelocity")),o(F.CAN_MOVE_DIRECTION,F.KEY_AND_MOVEMENT)||(e=O(e,"SM_DeduceDirectionFromVelocity","SM_TestMoveDirection")),o(F.CAN_MOVE_DIRECTION,F.PATH_CLEAR)||(e=O(e,"SM_TestMoveDirection","Condition_KeyPressed")),o(F.KEY_PRESSED)||(e=O(e,"Condition_KeyPressed","Condition_KeyReleased"),e=de(e,"Condition_KeyPressed")),o(F.KEY_RELEASED)||(e=O(e,"Condition_KeyReleased","Condition_TimeOut"),e=de(e,"Condition_KeyReleased")),o(F.TIME_OUT)||(e=O(e,"Condition_TimeOut","Condition_CanMove"),e=de(e,"Condition_TimeOut")),o(F.CAN_MOVE_DIRECTION)||(e=O(e,"Condition_CanMove","Condition_HasCollision"),e=de(e,"Condition_CanMove")),o(F.HAS_COLLISION)||(e=O(e,"Condition_HasCollision","Condition_PathClear"),e=de(e,"Condition_HasCollision")),o(F.PATH_CLEAR)||(e=O(e,"Condition_PathClear","Condition_OnWallCollision"),e=de(e,"Condition_PathClear")),o(F.ON_WALL_COLLISION)||(e=O(e,"Condition_OnWallCollision","Condition_DeadlyTile"),e=de(e,"Condition_OnWallCollision")),o(F.HAS_DEADLY_TILE_COLLISION)||(e=O(e,"Condition_DeadlyTile","Condition_AnimComplete"),e=de(e,"Condition_DeadlyTile")),o(F.ANIMATION_COMPLETE)||(e=O(e,"Condition_AnimComplete","Condition_KeyAndMove"),e=de(e,"Condition_AnimComplete")),o(F.KEY_AND_MOVEMENT)||(e=O(e,"Condition_KeyAndMove","Condition_VariableCompare"),e=de(e,"Condition_KeyAndMove")),o(F.VARIABLE_COMPARE)||(e=wn(e,"Condition_VariableCompare"),e=de(e,"Condition_VariableCompare")),e}function ja(e){const t=Number(e);return Number.isFinite(t)?Math.max(0,Math.min(255,Math.round(t))):0}function Rn(e){return Math.max(0,Math.min(15,ja(e)))}function Ln(e){const t=Number(e);return Number.isFinite(t)?Math.max(0,Math.min(4095,Math.round(t))):0}function Nn(e){const t=Number(e);return!Number.isFinite(t)||t<=0?1:Math.max(1,Math.round(t*60/1e3))}function xn(e){const t={};return(e||[]).forEach((a,l)=>{const o=typeof(a==null?void 0:a.id)=="string"?a.id:"",n=typeof(a==null?void 0:a.name)=="string"?a.name:"";o&&(t[o]=l,t[o.toLowerCase()]=l),n&&(t[n]=l,t[n.toLowerCase()]=l)}),t}function Mn(e){const t=Array.isArray(e)?e:[];let a=`SM_SoundFrameSize EQU 11
`;return a+=`SM_SoundAssetCount EQU ${t.length}
`,a+=`SM_SoundPtrTable:
`,t.length===0?(a+=`    DW 0
`,a):(t.forEach((l,o)=>{a+=`    DW SM_SoundAsset_${o}
`}),a+=`
`,t.forEach((l,o)=>{const n=Array.isArray(l==null?void 0:l.channels)?l.channels:[],i=[0,1,2].map(c=>{const s=n[c],p=Array.isArray(s==null?void 0:s.steps)?s.steps:[],m=[];for(const u of p){const h=Nn(u==null?void 0:u.durationMs);for(let y=0;y<h;y++)m.push(u||{})}return m}),r=Math.max(i[0].length,i[1].length,i[2].length),_=Math.min(255,r),d=Math.max(0,Math.min(31,ja(l==null?void 0:l.noisePeriod)));if(a+=`SM_SoundAsset_${o}:
`,a+=`    DB ${_}
`,a+=`    DW SM_SoundAsset_${o}_Frames
`,a+=`
`,a+=`SM_SoundAsset_${o}_Frames:
`,_===0){a+=`    ; Empty sound asset: silent
`;return}for(let c=0;c<_;c++){let s=63;const p=[];for(let m=0;m<3;m++){const u=i[m][c],h=Ln(u==null?void 0:u.tonePeriod),y=h&255,b=h>>8&15,E=u?Rn(u.volume):0,w=!!(u!=null&&u.toneEnabled),v=!!(u!=null&&u.noiseEnabled);w&&(s&=~(1<<m)),v&&(s&=~(1<<m+3)),p.push(y,b,E)}p.push(d,s&63),a+=`    DB ${p.join(", ")}
`}a+=`
`}),a.trimEnd())}function kn(e,t,a,l,o,n,i){let r=Cn+`
`+In+`

`;const _=Array.isArray(a)&&a.length>0,d=Array.isArray(t)&&t.some(E=>String((E==null?void 0:E.asmName)||"").trim()==="global_var_lives");if(r=r.replace(/Action_CleanSprites:[\s\S]*?Action_ExitCurrentWorld:/,_?`Action_CleanSprites:
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

Action_ExitCurrentWorld:`),e.length>0){const{usedActions:E,usedConditions:w}=vn(e);r=Dn(r,E,w)}d||(r=r.replace(/[ \t]*ld \(global_var_lives\), a\s*; Keep FSM global "Lives" in sync with entity health\r?\n/g,""));const c=vt(a||[]),s=c.nameToIndex;c.warnings.forEach(E=>{console.warn(`[State Machine Generator] ${E}`)}),r+=`; ==================================================================
`,r+=`; GLOBAL VARIABLES TABLE
`,r+=`; ==================================================================
`,r+=`; Maps variable IDs (6+) to their RAM addresses
`,r+=`; ID 6 = gem_count, ID 7 = last_gem_char, ID 8+ = user globals
`,r+=`SM_GlobalVarTable:
`,r+=`    DW gem_count            ; ID 6: gem_count
`,r+=`    DW last_gem_char        ; ID 7: last_gem_char (char of last collected tile)
`,t&&t.length>0&&t.forEach((E,w)=>{const v=8+w;r+=`    DW ${E.asmName}            ; ID ${v}: ${E.name}
`}),r+=`
`,r+=`; ==================================================================
`,r+=`; STATE MACHINE DATA
`,r+=`; ==================================================================

`;const p=yn(t),m=En(l),u=Ba(o),h=xn(n),y=Tn(o,s,u),b=(E,w)=>{const v=w.map(f=>Math.max(0,Math.min(255,f|0)));return`${E}:
    DB ${v.join(", ")}
`};r+=`; ==================================================================
`,r+=`; TEMPLATE PROFILE TABLES
`,r+=`; ==================================================================
`,r+=`SM_TemplateProfileCount EQU ${y.maxToken}
`,r+=b("SM_TemplateSpriteTable",y.spriteByToken),r+=b("SM_TemplateAnimSpeedTable",y.animSpeedByToken),r+=b("SM_TemplateHealthCurrentTable",y.healthCurByToken),r+=b("SM_TemplateHealthMaxTable",y.healthMaxByToken),r+=`
`,r+=`; ==================================================================
`,r+=`; STATE MACHINE SPRITE RUNTIME TABLES
`,r+=`; NOTE: frame bank is derived from the frame pointer at runtime.
`,r+=`; This keeps ChangeSprite compatible with post-export ZX0 label remaps.
`,r+=`; ==================================================================
`,r+=`SM_SpriteAssetCount EQU ${c.sprites.length}
`,r+=`SM_SpritePatternPtrTable:
`,c.sprites.length>0?c.sprites.forEach((E,w)=>{r+=`    DW SPRITE_${w}_PATTERN
`}):r+=`    ; Empty table (no sprites)
`,r+=`
`,r+=`; ==================================================================
`,r+=`; STATE MACHINE SOUND ASSET TABLES
`,r+=`; PLAY_SOUND exports a one-shot 60Hz frame stream per sound asset.
`,r+=`; Channel loops are flattened to a single pass to avoid stuck PSG.
`,r+=`; Hardware envelopes are not emitted yet in this state-machine path.
`,r+=`; ==================================================================
`,r+=Mn(n),r+=`
`;for(const E of e)r+=Pn(E,p,s,m,u,h,i);return r}function Pn(e,t,a,l,o,n,i){let r=`; State Machine: ${e.name} (${e.id}) 
`;const _=e.name.replace(/[^a-zA-Z0-9]/g,"_"),d=c=>{if(!c)return!1;const s=c.trim().toLowerCase();return s==="any"||s==="__any_state__"||s==="any state (*)"};for(const c of e.states){const s=`SM_${_}_${c.id.replace(/[^a-zA-Z0-9]/g,"_")}`,p=`${s}_OnEnter`,m=`${s}_OnExit`,u=`${s}_Transitions`;r+=`${s}: 
`,r+=`    DB 0; ID(unused) 
`,r+=`    DW ${c.onEnter&&c.onEnter.length>0?p:0} 
`,r+=`    DW ${c.onExit&&c.onExit.length>0?m:0} 
`;const h=e.transitions.filter(y=>y.fromStateId===c.id?!0:d(y.fromStateId)?y.toStateId!==c.id:!1);if(r+=`    DW ${h.length>0?u:0} 
`,c.onEnter&&c.onEnter.length>0){r+=`${p}: 
`;for(const y of c.onEnter)r+=Et(y,e.name,t,a,l,o,n,i);r+=`    DB 0xFF; END
`}if(c.onExit&&c.onExit.length>0){r+=`${m}: 
`;for(const y of c.onExit)r+=Et(y,e.name,t,a,l,o,n,i);r+=`    DB 0xFF; END
`}if(h.length>0){r+=`${u}: 
`,r+=`    DB ${h.length}; Count
`;const y=[];h.forEach((b,E)=>{const v=d(b.fromStateId)&&d(b.toStateId)?"0":`SM_${_}_${b.toStateId.replace(/[^a-zA-Z0-9]/g,"_")}`,f=b.actions&&b.actions.length>0?`${u}_Actions_${E}`:"0";if(b.conditions?r+=Ct(b.conditions,t):r+=`    DB 0; Empty Condition(Always True) 
`,r+=`    DW ${v} 
`,r+=`    DW ${f} 
`,f!=="0"){let A=`${f}: 
`;for(const g of b.actions||[])A+=Et(g,e.name,t,a,l,o,n,i);A+=`    DB 0xFF; END
`,y.push(A)}}),y.length>0&&(r+=`
`,r+=y.join(""))}r+=`
`}return r}function z(e){if(typeof e=="number")return e.toString();if(typeof e=="boolean")return e?"1":"0";if(typeof e=="string"){if(e==="true")return"1";if(e==="false")return"0";const t=parseInt(e,10);return isNaN(t)?"0":t.toString()}return"0"}function On(e,t){if(typeof e=="string"){const a=t==null?void 0:t[e];if(a!==void 0)return a;const l=parseInt(e,10);return!isNaN(l)&&l>=0&&l<=254?l:255}return typeof e=="number"&&e>=0&&e<=254?e:255}function Et(e,t="",a,l,o,n,i,r){var c;const _=ga[e.type];if(_===void 0)return`; Unknown Action: ${e.type} 
`;let d=`    DB ${_}; ${e.type} 
`;switch(e.type){case I.NONE:break;case I.SET_POSITION:case I.MOVE_BY:case I.SET_VELOCITY:case I.APPLY_FORCE:d+=`    DB ${z(e.params.x)}, ${z(e.params.y)} 
`;break;case I.CHANGE_SPRITE:{const s=e.params.sprite||e.params.spriteId||"";let p=0;if(l&&typeof s=="string"){const m=l[s],u=l[s.toLowerCase()];m!==void 0?p=m:u!==void 0?p=u:p=z(s)==="0"?0:parseInt(z(s),10)||0}else p=z(s)==="0"?0:parseInt(z(s),10)||0;d+=`    DB ${p}; sprite: ${s} 
`;break}case I.PLAY_ANIMATION:d+=`    DB ${z(e.params.animationName)} 
`;break;case I.SET_ANIMATION_SPEED:d+=`    DB ${z(e.params.speed)} 
`;break;case I.TOGGLE_ANIMATION:d+=`    DB ${z(e.params.playing)} 
`;break;case I.PLAY_SOUND:{const s=e.params.soundId??e.params.sound??e.params.soundAssetId??0;let p=255;if(typeof s=="string"){const m=i==null?void 0:i[s],u=i==null?void 0:i[s.toLowerCase()];m!==void 0?p=m:u!==void 0&&(p=u)}else{const m=parseInt(z(s),10);isNaN(m)||(p=m)}d+=`    DB ${p}        ; sound: ${s}
`;break}case I.PLAY_MUSIC:{const s=e.params.trackId??e.params.musicId??e.params.music??0,p=e.params.loop??!0,m=On(s,r),u=m===255&&s!==0&&s!=="0"?`        ; WARNING: unresolved/non-PSG track ${s}`:"";d+=`    DB ${m}, ${z(p)}        ; track: ${s}${u}
`;break}case I.SET_VARIABLE:case I.INCREMENT_VARIABLE:case I.DECREMENT_VARIABLE:{const s=e.params.variable||e.params.variableName||e.params.name,p=(a==null?void 0:a[s])??0,m=e.params.value??e.params.amount??0;d+=`    DB ${p}, ${z(m)}        ; ${s} (ID ${p})
`;break}case I.WAIT:d+=`    DB ${z(e.params.duration)} 
`;break;case I.GOTO_STATE:if(t&&e.params.stateId){const s=`SM_${t.replace(/[^a-zA-Z0-9]/g,"_")}_${e.params.stateId.replace(/[^a-zA-Z0-9]/g,"_")} `;d+=`    DW ${s} 
`}else d+=`    DW 0; Invalid GOTO target
`;break;case I.SPAWN_ENTITY:{const s=e.params.templateId??e.params.entityTemplateId??e.params.entityId??0,p=typeof s=="string"?(n==null?void 0:n[s])??(n==null?void 0:n[s.toLowerCase()])??0:parseInt(z(s),10)||0,m=e.params.x??0,u=e.params.y??0;d+=`    DB ${p}, ${z(m)}, ${z(u)}        ; template=${s}=>${p}
`;break}case I.DESTROY_ENTITY:{const s=((c=e.params)==null?void 0:c.target)||"self";d+=`    DB ${s==="other"?1:0}          ; Target: ${s}
`;break}case I.GET_RANDOM_ENTITY_POSITION:{const s=e.params.templateId??e.params.entityTemplateId??0,p=typeof s=="string"?(n==null?void 0:n[s])??(n==null?void 0:n[s.toLowerCase()])??0:parseInt(z(s),10)||0,m=e.params.targetVariableX??e.params.variableX,u=e.params.targetVariableY??e.params.variableY,h=(a==null?void 0:a[m])??0,y=(a==null?void 0:a[u])??0;d+=`    DB ${p}, ${h}, ${y}        ; template=${s}, x->${m}(${h}), y->${u}(${y})
`;break}case I.SET_COMPONENT_PROPERTY:{const s=e.params.componentId??e.params.component??e.params.compId??0,p=e.params.propertyName??e.params.prop??e.params.name??0,m=e.params.value??0,u=gn(s),h=Sn(p);let y=z(m);if(h===5&&typeof m=="string"&&l){const b=l[m],E=l[m.toLowerCase()];b!==void 0?y=String(b):E!==void 0&&(y=String(E))}d+=`    DB ${u}, ${h}, ${y}        ; comp=${s}=>${u}, prop=${p}=>${h}, value=${m}
`;break}case I.CHANGE_GAME_FLOW_NODE:{const s=e.params.nodeId??e.params.targetNodeId??0,p=typeof s=="string"&&s.toUpperCase()==="START"?255:z(s);d+=`    DB ${p}        ; node=${s}
`;break}case I.REGENERATE_HUD:case I.CLEAN_SPRITES:case I.EXIT_CURRENT_WORLD:break;case I.BREAK_TILE:{const s=String(e.params.direction||"up").toLowerCase(),p=Ia[s]??0;d+=`    DB 0, ${p}        ; BREAK_TILE dir=${s}
`;break}case I.REPLACE_TILE:{const s=String(e.params.direction||"up").toLowerCase(),p=Ia[s]??0,m=e.params.replacementTileId??e.params.tileId??0,u=An(m,o);d+=`    DB ${u}, ${p}        ; REPLACE_TILE tile=${m}=>${u}, dir=${s}
`;break}case I.RND:{const s=e.params.variable??e.params.variableName??e.params.targetVariable??e.params.name,p=(a==null?void 0:a[s])??z(e.params.varId??0),m=z(e.params.dataType??e.params.type??0);d+=`    DB ${p}, ${m}        ; RND var=${s??e.params.varId??0}, type=${e.params.dataType??e.params.type??0}
`;break}case I.POINT_AT:{const s=z(e.params.x1??0),p=z(e.params.y1??0),m=z(e.params.x2??0),u=z(e.params.y2??0),h=z(e.params.speed??1);d+=`    DB ${s}, ${p}, ${m}, ${u}, ${h}
`;break}case I.DECREASE_LIVES:case I.INCREASE_LIVES:{const s=e.params.amount??1;d+=`    DB ${z(s)} 
`;break}case I.RESPAWN_PLAYER:{const s=e.params.x??255,p=e.params.y??255;d+=`    DB ${z(s)}, ${z(p)} 
`;break}case I.ADD_VARIABLES:case I.SUBTRACT_VARIABLES:case I.MULTIPLY_VARIABLES:case I.DIVIDE_VARIABLES:case I.MODULO_VARIABLES:{const s=e.params.destination||e.params.dest||e.params.result,p=e.params.source1||e.params.src1||e.params.operand1,m=e.params.source2||e.params.src2||e.params.operand2,u=(a==null?void 0:a[s])??0,h=(a==null?void 0:a[p])??0,y=(a==null?void 0:a[m])??0,b=e.type===I.ADD_VARIABLES?"ADD":e.type===I.SUBTRACT_VARIABLES?"SUB":e.type===I.MULTIPLY_VARIABLES?"MUL":e.type===I.DIVIDE_VARIABLES?"DIV":"MOD";d+=`    DB ${u}, ${h}, ${y}        ; ${s} = ${p} ${b} ${m}
`;break}case I.ASSIGN_VARIABLE:{const s=e.params.targetVariable||e.params.destination||e.params.dest||e.params.result,p=(a==null?void 0:a[s])??0;if((e.params.sourceType||(e.params.sourceVariable?"variable":"constant"))!=="variable"){const y=e.params.sourceValue??e.params.value??0;d=`    DB ${ga[I.SET_VARIABLE]}; ${I.SET_VARIABLE} (from ${I.ASSIGN_VARIABLE})
`,d+=`    DB ${p}, ${z(y)}        ; ${s} = ${y}
`;break}const u=e.params.sourceVariable||e.params.source||e.params.src||e.params.operand||e.params.source1,h=(a==null?void 0:a[u])??0;d+=`    DB ${p}, ${h}        ; ${s} = ${u}
`;break}default:d+=`    ; Params not implemented for ${e.type}
`;break}return d}function Ct(e,t){var o,n,i,r,_,d,c,s,p,m,u,h,y,b,E,w,v;const a=un[e.type];if(!a)return console.warn(`[State Machine Generator] Unknown condition "${e.type}". Falling back to NOP condition.`),`    DB 0; FALLBACK NOP for unknown condition ${e.type}
`;let l=`    DB ${a}; ${e.type} 
`;switch(e.type){case F.KEY_PRESSED:case F.KEY_RELEASED:{const f=(n=(o=e.params)==null?void 0:o.key)==null?void 0:n.toLowerCase(),A=Aa[f]??0;l+=`    DB ${A}          ; Key: ${f||"unknown"}
`;break}case F.TIME_OUT:l+=`    DB ${z((i=e.params)==null?void 0:i.duration)} 
`;break;case F.CAN_MOVE_DIRECTION:{const f=String(((r=e.params)==null?void 0:r.direction)||"").toLowerCase(),A=yt[f]??0;f&&A===0&&console.warn(`[State Machine Generator] Unknown direction "${f}" in CAN_MOVE_DIRECTION. Using 0 (no direction).`),l+=`    DB ${A}          ; Direction: ${f||"none"}
`;break}case F.ON_WALL_COLLISION:{const f=String(((_=e.params)==null?void 0:_.direction)||"any").toLowerCase(),A=Ta[f]??0;f in Ta||console.warn(`[State Machine Generator] Unknown direction "${f}" in ON_WALL_COLLISION. Using any.`),l+=`    DB ${A}          ; Wall direction: ${f}
`;break}case F.HAS_COLLISION:{const f=String(((d=e.params)==null?void 0:d.collisionType)||"any").toLowerCase();let A=Ca[f];A===void 0&&(console.warn(`[State Machine Generator] Unknown collisionType "${f}" in HAS_COLLISION. Using any.`),A=Ca.any),l+=`    DB ${A}          ; collisionType: ${f}
`;break}case F.PATH_CLEAR:{const f=String(((c=e.params)==null?void 0:c.direction)||"").toLowerCase(),A=yt[f]??0;f&&A===0&&console.warn(`[State Machine Generator] Unknown direction "${f}" in PATH_CLEAR. Using auto-deduce (0).`),l+=`    DB ${A}          ; Direction (0=auto): ${f||"auto"}
`;break}case F.ANIMATION_COMPLETE:break;case F.KEY_AND_MOVEMENT:{const f=String(((s=e.params)==null?void 0:s.key)||"").toLowerCase(),A=Aa[f]??0,g=String(((p=e.params)==null?void 0:p.direction)||"").toLowerCase();let S=yt[g]??0;!g&&A!==9&&(S=A),g&&S===0&&console.warn(`[State Machine Generator] Unknown direction "${g}" in KEY_AND_MOVEMENT. Using 0.`),l+=`    DB ${A}, ${S}          ; key=${f||"unknown"}, dir=${g||"auto"}
`;break}case F.AND:case F.OR:case F.XOR:if(e.conditions){l+=`    DB ${e.conditions.length} 
`;for(const f of e.conditions)l+=Ct(f,t)}else l+=`    DB 0
`;break;case F.NOT:e.conditions&&e.conditions.length>0?(l+=`    DB 1 
`,l+=Ct(e.conditions[0],t)):(l+=`    DB 1 
`,l+=`    DB 0; Fallback NOP subcondition for NOT
`);break;case F.VARIABLE_COMPARE:{const f=((m=e.params)==null?void 0:m.variable)||"x",A=t==null?void 0:t[f];if(A===void 0)console.warn(`[State Machine Generator] Unknown variable "${f}" in VARIABLE_COMPARE. Using x (ID 0) as fallback.`),l+=`    DB 0, ${Sa[((u=e.params)==null?void 0:u.operator)||"=="]||0}, ${z(((h=e.params)==null?void 0:h.value)||0)}; FALLBACK: unknown var "${f}" -> x ${((y=e.params)==null?void 0:y.operator)||"=="} ${((b=e.params)==null?void 0:b.value)||0}
`;else{const g=Sa[((E=e.params)==null?void 0:E.operator)||"=="]||0,S=((w=e.params)==null?void 0:w.value)||0;l+=`    DB ${A}, ${g}, ${z(S)}; ${f} (ID ${A}) ${((v=e.params)==null?void 0:v.operator)||"=="} ${S}
`}break}}return l}function Un(e,t={},a){console.log("ÐYZî [INTERRUPT GENERATOR] Generating interrupt.asm...");let l="";return l+=`; ==================================================================
`,l+=`; INTERRUPT TASK SYSTEM - File: interrupt.asm
`,l+=`; Konami-style technique: Hook H.TIMI for 50/60Hz task execution
`,l+=`; ==================================================================

`,l+=$n(),l+=Fn(),l+=Bn(),l+=jn(),l+=Hn(),l+=zn(a),(a==null?void 0:a.mode)==="interruptTaskManager"?(l+=Gn(),l+=Vn(a)):l+=Yn(e),t.interruptDrivenComponents&&(l+=`
; ==================================================================
`,l+=`; COMPONENT SYSTEMS (INLINED)
`,l+=`; Generated inside interrupt.asm because interruptDrivenComponents=true
`,l+=`; ==================================================================

`,l+=Fa(e,t.romMode||"simple32k"),l+=`
; ==================================================================
`,l+=`; END OF INLINED COMPONENT SYSTEMS
`,l+=`; ==================================================================

`),console.log(`ƒo. [INTERRUPT GENERATOR] Generated interrupt.asm (${l.length} chars)`),l}function $n(){return`; ==================================================================
; INTERRUPT SYSTEM MEMORY LAYOUT
; Variables are defined in variables.asm (dynamically allocated)
; This avoids RAM overlap with entity system arrays
; ==================================================================
; Slots: task_table (8 slots x 2 bytes), task_0_ptr..task_7_ptr
; State: interrupt_system_enabled, old_htimi_hook, interrupt_counter,
;        task_exec_time, vblank_flag
; ==================================================================

`}function Fn(){return`; ==================================================================
; INIT_INTERRUPT_SYSTEM - Install H.TIMI hook
; ==================================================================
${Y({purpose:"Install JP hook on H.TIMI and initialize interrupt task state.",inputs:["None"],outputs:["None"],clobbers:["AF","BC","DE","HL"],preserved:["None"],usage:["HL/DE/BC = block copy parameters for hook backup and task table clear","A = enable flag and zeroing value"],notes:["Runs with DI/EI, so caller must not assume interrupt state is unchanged."]})}
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

`}function Bn(){return`; ==================================================================
; STOP_INTERRUPT_SYSTEM - Restore original H.TIMI hook
; ==================================================================
${Y({purpose:"Restore original H.TIMI bytes and mark system disabled.",inputs:["None"],outputs:["None"],clobbers:["AF","BC","DE","HL"],preserved:["None"],usage:["HL/DE/BC = LDIR source/destination/count for hook restore","A = zero flag write to interrupt_system_enabled"],notes:["Runs with DI/EI for atomic hook restoration."]})}
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

`}function jn(){return`; ==================================================================
; INTERRUPT_DISPATCHER - Main ISR (60Hz/50Hz)
; ==================================================================
${Y({purpose:"Dispatch enabled interrupt tasks each VBlank and chain BIOS hook.",inputs:["Triggered by H.TIMI hook"],outputs:["interrupt_counter incremented","vblank_flag refreshed"],clobbers:["AF","BC","DE","HL","IX","IY (all restored before exit)"],preserved:["DE","IX","IY"],usage:["HL = walks task_table and holds task pointer","B = task slot loop counter","C = temporary low byte for pointer reconstruction","A = enabled checks and pointer validation"],notes:["Dispatcher saves/restores DE/IX/IY defensively, reducing coupling with task internals."]})}
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

`}function Hn(){return`; ==================================================================
; TASK MANAGEMENT FUNCTIONS
; ==================================================================

; ==================================================================
; NOTE: wait_vblank function removed - use HALT directly in game loop
; HALT is more efficient (no call/ret overhead)
; ==================================================================

; ==================================================================
; UPDATE_VBLANK_FLAG - For interrupt dispatcher use only
; ==================================================================
${Y({purpose:"Read VDP status register and latch VBlank state in RAM flag.",inputs:["None"],outputs:["vblank_flag = 0/1"],clobbers:["AF (internally saved/restored)"],preserved:["AF, BC, DE, HL"],usage:["A = VDP status read and boolean conversion"]})}
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
${Y({purpose:"Store routine pointer into task_table slot.",inputs:["A = task slot (0-7)","HL = task routine address"],outputs:["task_table[slot] = HL"],clobbers:["AF","BC","DE","HL"],preserved:["None"],usage:["A = slot validation and offset math","DE = holds routine address while HL is repurposed as slot pointer","BC = task_table base address","HL = slot address calculation / pointer write"]})}
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
${Y({purpose:"Clear routine pointer in selected task slot.",inputs:["A = task slot (0-7)"],outputs:["task_table[slot] = 0"],clobbers:["AF","DE","HL"],preserved:["BC"],usage:["A = slot validation and zero value for clearing","HL = destination slot pointer","DE = computed slot offset"]})}
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
${Y({purpose:"Expose current 16-bit interrupt frame counter.",inputs:["None"],outputs:["HL = interrupt_counter"],clobbers:["HL"],preserved:["AF","BC","DE"],usage:["HL = loaded return value"]})}
; Inputs: None
; Outputs: HL = frame count (16-bit)
; Modifies: HL
; ==================================================================
get_frame_count:
    ld hl, (interrupt_counter)
    ret

`}function zn(e){const t=(e==null?void 0:e.mode)==="interruptTaskManager"?e.tasks.filter(l=>l.enabledAtBoot):[];let a=`; ==================================================================
`;return a+=`; INIT_DEFAULT_TASKS_FROM_PLAN - Register engine-selected IRQ tasks
`,a+=`; ==================================================================
`,a+=Y({purpose:"Enable the IRQ task set selected by the engine execution plan.",inputs:["None"],outputs:["task_table updated for all enabled-at-boot tasks"],clobbers:["AF","HL"],preserved:["BC","DE"],usage:["A = task slot","HL = task routine address"],notes:["Calls enable_task once per enabled task."]}),a+=`init_default_tasks_from_plan:
`,t.length===0?(a+=`    ret

`,a):(t.forEach(l=>{a+=`    ld a, ${l.slot}
`,a+=`    ld hl, ${l.routineLabel}
`,a+=`    call enable_task
`}),a+=`    ret

`,a)}function Vn(e){const t=e.tasks.some(l=>l.routineLabel==="task_frame_counter");let a=`; ==================================================================
`;return a+=`; ENGINE EXECUTION PLAN TASKS
`,a+=`; ==================================================================

`,e.tasks.length===0?a+=`; No IRQ tasks selected by engine execution plan.

`:(e.tasks.forEach(l=>{a+=`; Slot ${l.slot}: ${l.id} -> ${l.routineLabel} (period=${l.period})
`}),a+=`
`),t&&(a+=Wn()),a+=`; ==================================================================
`,a+=`; USER CUSTOM TASK SLOTS (5-7)
`,a+=`; ==================================================================
`,a+=`; These slots are reserved for user-defined tasks
`,a+=`; Enable them dynamically using:
`,a+=`;   LD A, 5                    ; Slot 5
`,a+=`;   LD HL, my_custom_task
`,a+=`;   CALL enable_task
`,a+=`; ==================================================================

`,a}function Gn(){let e=`; ==================================================================
`;return e+=`; SHARED MAINLINE TASK WRAPPERS
`,e+=`; ==================================================================
`,e+=`; These wrappers stay available in interruptTaskManager mode because
`,e+=`; the HALT-driven GameFlow loops still call them directly.
`,e+=`; ==================================================================

`,e+=`; ==================================================================
`,e+=`; TASK_UPDATE_INPUT - Joystick/Cursor polling wrapper
`,e+=`; ==================================================================
`,e+=Y({purpose:"Poll joystick + keyboard fallback and update input state buffers.",inputs:["Reads hardware via FAST_GTSTCK / FAST_GTTRIG / FAST_SNSMAT"],outputs:["input_state, prev_input_state, input_btn_curr, input_btn_prev, input_fire"],clobbers:["AF","BC","DE"],preserved:["AF","BC","DE (by push/pop wrapper)","HL"],usage:["A = hardware reads and final scalar writes","B = direction accumulator","D = button bitmask and keyboard direction flags","E = temporary keyboard row bits"],notes:["Wrapper preserves caller-visible regs despite internal mutation."]}),e+=`task_update_input:
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

`,e}function Wn(){let e=`; ==================================================================
`;return e+=`; TASK_FRAME_COUNTER - Custom timing/animations
`,e+=`; ==================================================================
`,e+=`; Placeholder for user-defined frame-based timing
`,e+=`; interrupt_counter is already incremented in dispatcher
`,e+=`; ==================================================================
`,e+=Y({purpose:"Optional per-frame timing hook for lightweight counters/animations.",inputs:["None"],outputs:["None"],clobbers:["None"],preserved:["AF","BC","DE","HL"],usage:["No registers modified in the default implementation"]}),e+=`task_frame_counter:
`,e+=`    ; Placeholder - counter is already incremented in dispatcher
`,e+=`    ; Add custom timing logic here if needed
`,e+=`    ret

`,e}function Yn(e){let t="";if(t+=`; ==================================================================
`,t+=`; DEFAULT INTERRUPT TASKS (60Hz Execution)
`,t+=`; ==================================================================

`,t+=`; ==================================================================
`,t+=`; TASK_UPDATE_INPUT - Joystick/Cursor polling at 60Hz
`,t+=`; ==================================================================
`,t+=`; This task guarantees responsive input (no missed button presses)
`,t+=`; Compatible with update_input_component existing function
`,t+=`; ==================================================================
`,t+=Y({purpose:"Poll joystick + keyboard fallback and update input state buffers.",inputs:["Reads hardware via FAST_GTSTCK / FAST_GTTRIG / FAST_SNSMAT"],outputs:["input_state, prev_input_state, input_btn_curr, input_btn_prev, input_fire"],clobbers:["AF","BC","DE"],preserved:["AF","BC","DE (by push/pop wrapper)","HL"],usage:["A = hardware reads and final scalar writes","B = direction accumulator","D = button bitmask and keyboard direction flags","E = temporary keyboard row bits"],notes:["Wrapper preserves caller-visible regs despite internal mutation."]}),t+=`task_update_input:
`,t+=`    push af
`,t+=`    push bc
`,t+=`    push de

`,t+=`    ; Save previous state
`,t+=`    ld a, (input_state)
`,t+=`    ld (prev_input_state), a
`,t+=`    ld a, (input_btn_curr)
`,t+=`    ld (input_btn_prev), a

`,t+=`    ; Read joystick direction first (priority source, direct hardware)
`,t+=`    xor a                       ; Joystick 0
`,t+=`    call FAST_GTSTCK            ; Direct hardware read
`,t+=`    ld b, a                     ; B = joystick direction
`,t+=`    or a
`,t+=`    jr nz, .dir_ready

`,t+=`    ; Fallback to keyboard cursor keys (row 8, direct matrix read)
`,t+=`    ld a, 8
`,t+=`    call FAST_SNSMAT            ; Active low bits
`,t+=`    ld e, a
`,t+=`    xor a
`,t+=`    ld d, a                     ; D = direction flags: 0=none
`,t+=`    bit 5, e                    ; Up
`,t+=`    jr nz, .kbd_no_up
`,t+=`    set 0, d
`,t+=`.kbd_no_up:
`,t+=`    bit 6, e                    ; Down
`,t+=`    jr nz, .kbd_no_down
`,t+=`    set 1, d
`,t+=`.kbd_no_down:
`,t+=`    bit 4, e                    ; Left
`,t+=`    jr nz, .kbd_no_left
`,t+=`    set 2, d
`,t+=`.kbd_no_left:
`,t+=`    bit 7, e                    ; Right
`,t+=`    jr nz, .kbd_no_right
`,t+=`    set 3, d
`,t+=`.kbd_no_right:
`,t+=`    xor a
`,t+=`    bit 0, d
`,t+=`    jr z, .kbd_check_down
`,t+=`    bit 3, d
`,t+=`    jr nz, .kbd_upright
`,t+=`    bit 2, d
`,t+=`    jr nz, .kbd_upleft
`,t+=`    ld a, STICK_UP
`,t+=`    jr .kbd_done
`,t+=`.kbd_upright:
`,t+=`    ld a, STICK_UPRIGHT
`,t+=`    jr .kbd_done
`,t+=`.kbd_upleft:
`,t+=`    ld a, STICK_UPLEFT
`,t+=`    jr .kbd_done
`,t+=`.kbd_check_down:
`,t+=`    bit 1, d
`,t+=`    jr z, .kbd_check_lr
`,t+=`    bit 3, d
`,t+=`    jr nz, .kbd_downright
`,t+=`    bit 2, d
`,t+=`    jr nz, .kbd_downleft
`,t+=`    ld a, STICK_DOWN
`,t+=`    jr .kbd_done
`,t+=`.kbd_downright:
`,t+=`    ld a, STICK_DOWNRIGHT
`,t+=`    jr .kbd_done
`,t+=`.kbd_downleft:
`,t+=`    ld a, STICK_DOWNLEFT
`,t+=`    jr .kbd_done
`,t+=`.kbd_check_lr:
`,t+=`    bit 2, d
`,t+=`    jr z, .kbd_check_right
`,t+=`    ld a, STICK_LEFT
`,t+=`    jr .kbd_done
`,t+=`.kbd_check_right:
`,t+=`    bit 3, d
`,t+=`    jr z, .kbd_done
`,t+=`    ld a, STICK_RIGHT
`,t+=`.kbd_done:
`,t+=`    ld b, a
`,t+=`.dir_ready:
`,t+=`    ; Normalize diagonals to cardinal directions for runtime stability
`,t+=`    ; UP+RIGHT/DOWN+RIGHT -> RIGHT, UP+LEFT/DOWN+LEFT -> LEFT
`,t+=`    ld a, b
`,t+=`    cp STICK_UPRIGHT
`,t+=`    jr z, .dir_norm_right
`,t+=`    cp STICK_DOWNRIGHT
`,t+=`    jr z, .dir_norm_right
`,t+=`    cp STICK_UPLEFT
`,t+=`    jr z, .dir_norm_left
`,t+=`    cp STICK_DOWNLEFT
`,t+=`    jr z, .dir_norm_left
`,t+=`    jr .dir_norm_done
`,t+=`.dir_norm_right:
`,t+=`    ld a, STICK_RIGHT
`,t+=`    jr .dir_norm_store
`,t+=`.dir_norm_left:
`,t+=`    ld a, STICK_LEFT
`,t+=`.dir_norm_store:
`,t+=`    ld b, a
`,t+=`.dir_norm_done:
`,t+=`    xor a                       ; Joystick 0
`,t+=`    call FAST_GTTRIG            ; A = #FF if pressed, 0 if not
`,t+=`    ld d, 0                     ; D = button bitmask
`,t+=`    or a
`,t+=`    jr z, .no_fire              ; Jump if NOT pressed (A=0)
`,t+=`    ld d, INPUT_BTN_FIRE
`,t+=`    ld a, 1                     ; Fire pressed
`,t+=`    ld (input_fire), a
`,t+=`    jr .fire_done
`,t+=`.no_fire:
`,t+=`    ; Keyboard fallback for fire (SPACE, row 8 bit 0, active low)
`,t+=`    ld a, 8
`,t+=`    call FAST_SNSMAT
`,t+=`    bit 0, a
`,t+=`    jr nz, .fire_released
`,t+=`    ld d, INPUT_BTN_FIRE
`,t+=`    ld a, 1
`,t+=`    ld (input_fire), a
`,t+=`    jr .fire_done
`,t+=`.fire_released:
`,t+=`    xor a                       ; Fire not pressed
`,t+=`    ld (input_fire), a
`,t+=`.fire_done:
`,t+=`    ld a, b
`,t+=`    ld (input_state), a
`,t+=`    ld a, d
`,t+=`    ld (input_btn_curr), a

`,t+=`    pop de
`,t+=`    pop bc
`,t+=`    pop af
`,t+=`    ret

`,e.hasEntities){const l=We(e).usedComponents,o=l.has("Jump"),n=l.has("Movement")||l.has("Cursors"),i=l.has("Gravity");o||n||i?(t+=`; ==================================================================
`,t+=`; TASK_UPDATE_PHYSICS - Apply vx, vy -> X, Y (OPTIMIZED)
`,t+=`; ==================================================================
`,t+=`; Only calls physics systems that are actually used in this project
`,t+=`; ==================================================================
`,t+=Y({purpose:"Run selected physics component systems in deterministic order.",inputs:["Entity/component RAM tables"],outputs:["Entity motion state updated"],clobbers:["AF","BC","DE","HL"],preserved:["AF","BC","DE","HL (by push/pop wrapper)"],usage:["Registers are scratch during component calls; wrapper restores caller context."]}),t+=`task_update_physics:
`,t+=`    push af
`,t+=`    push bc
`,t+=`    push de
`,t+=`    push hl

`,t+=`    ; Keep system loops in sync with current component masks
`,t+=`    call rebuild_used_entity_list
`,o&&(t+=`    call update_jump_component      ; Jump impulse
`),n&&(t+=`    call update_movement_component  ; Movement/velocity
`),i&&(t+=`    call update_gravity_component   ; Gravity acceleration
`),t+=`    call update_position_component  ; Apply velocity to position

`,t+=`    pop hl
`,t+=`    pop de
`,t+=`    pop bc
`,t+=`    pop af
`,t+=`    ret

`):(t+=`; Task 1 (Physics): Minimal - only position update (no Jump/Movement/Gravity used)
`,t+=`task_update_physics:
`,t+=`    call rebuild_used_entity_list  ; Keep compact entity list updated
`,t+=`    call update_position_component  ; Just apply any existing velocities
`,t+=`    ret

`)}else t+=`; Task 1 (Physics): Not generated (no entities detected)

`;return e.hasCollisions?(t+=`; ==================================================================
`,t+=`; TASK_UPDATE_COLLISION - Collision detection
`,t+=`; ==================================================================
`,t+=`; Detects collisions using collision layers (bitmask system)
`,t+=`; AABB collision for 16x16 sprites
`,t+=`; ==================================================================
`,t+=Y({purpose:"Interrupt task wrapper for collision system (placeholder).",inputs:["Entity collision data"],outputs:["Collision flags/tables (when implemented)"],clobbers:["AF","BC","DE","HL"],preserved:["AF","BC","DE","HL (by push/pop wrapper)"]}),t+=`task_update_collision:
`,t+=`    push af
`,t+=`    push bc
`,t+=`    push de
`,t+=`    push hl

`,t+=`    ; TODO: Implement collision detection
`,t+=`    ; Loop over entities with COMP_MASK_COLLISION
`,t+=`    ; Check: collisionLayer & collidesWith for each pair
`,t+=`    ; AABB test: |X1-X2| < 16 && |Y1-Y2| < 16

`,t+=`    pop hl
`,t+=`    pop de
`,t+=`    pop bc
`,t+=`    pop af
`,t+=`    ret

`):t+=`; Task 2 (Collision): Not generated (no collision detection needed)

`,e.hasSprites?(t+=`; ==================================================================
`,t+=`; TASK_UPDATE_SPRITES - Update sprites to VRAM
`,t+=`; ==================================================================
`,t+=`; WARNING: This task is HEAVY (~800 cycles)
`,t+=`; Consider executing every N frames instead of every frame
`,t+=`; ==================================================================
`,t+=Y({purpose:"Interrupt-safe wrapper for sprite SAT upload routine.",inputs:["Sprite component buffers"],outputs:["VRAM sprite attribute/pattern tables updated"],clobbers:["AF","BC","DE","HL"],preserved:["AF","BC","DE","HL (by push/pop wrapper)"]}),t+=`task_update_sprites:
`,t+=`    push af
`,t+=`    push bc
`,t+=`    push de
`,t+=`    push hl

`,t+=`    ; Call existing sprite update function
`,t+=`    call update_sprites_to_vram

`,t+=`    pop hl
`,t+=`    pop de
`,t+=`    pop bc
`,t+=`    pop af
`,t+=`    ret

`):t+=`; Task 3 (Sprites): Not generated (no sprites in project)

`,e.tracks&&e.tracks.length>0||e.stateMachines&&e.stateMachines.length>0?(t+=`; ==================================================================
`,t+=`; TASK_UPDATE_MUSIC - Fixed-rate audio tick
`,t+=`; ==================================================================
`,t+=`; Keeps tracker and state-machine audio tied to H.TIMI instead of variable-cost loops
`,t+=`; ==================================================================
`,t+=Y({purpose:"Interrupt-safe wrapper for tracker/state-machine audio tick.",inputs:["Music engine RAM state and state-machine sound cursors"],outputs:["PSG state advanced once per VBlank"],clobbers:["AF","BC","DE","HL"],preserved:["AF","BC","DE","HL (by push/pop wrapper)"]}),t+=`task_update_music:
`,t+=`    push af
`,t+=`    push bc
`,t+=`    push de
`,t+=`    push hl

`,t+=`    ld hl, prof_music_task_calls
`,t+=`    inc (hl)
`,t+=`    jr nz, .music_prof_counted
`,t+=`    inc hl
`,t+=`    inc (hl)
`,t+=`.music_prof_counted:
`,t+=`    call music_update
`,e.stateMachines&&e.stateMachines.length>0&&(t+=`    call SM_UpdateSound
`),t+=`
`,t+=`    pop hl
`,t+=`    pop de
`,t+=`    pop bc
`,t+=`    pop af
`,t+=`    ret

`):t+=`; TASK_UPDATE_MUSIC: Not generated (no tracker/state-machine audio in project)

`,t+=`; ==================================================================
`,t+=`; TASK_FRAME_COUNTER - Custom timing/animations
`,t+=`; ==================================================================
`,t+=`; Placeholder for user-defined frame-based timing
`,t+=`; Example: Increment animation timers, etc.
`,t+=`; ==================================================================
`,t+=Y({purpose:"Reserved slot for user timing logic.",inputs:["None"],outputs:["None by default"],clobbers:["None by default"],preserved:["All (default empty implementation)"]}),t+=`task_frame_counter:
`,t+=`    ; Placeholder - counter is already incremented in dispatcher
`,t+=`    ; Add custom timing logic here if needed
`,t+=`    ret

`,t+=`; ==================================================================
`,t+=`; USER CUSTOM TASK SLOTS (5-7)
`,t+=`; ==================================================================
`,t+=`; These slots are reserved for user-defined tasks
`,t+=`; Enable them dynamically using:
`,t+=`;   LD A, 5                    ; Slot 5
`,t+=`;   LD HL, my_custom_task
`,t+=`;   CALL enable_task
`,t+=`; ==================================================================

`,t}const gt=255,Qn=254,Xn=["A","B","C"];function Kn(e,t){const a=ar(e),l=a.length>0?[]:tr(e),o=a.length>0?ur(a):mr(l);return`; ==================================================================
; PSG SOUND SYSTEM
; File: sound.asm
; Description: AY-3-8910 PSG control and sound effects
; Engine Audio Tick: ${(t==null?void 0:t.tasks.some(i=>i.responsibility==="audio"))??!1?"IRQ task_manager":"GameFlow/game loop"}
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
`}function K(e,t=0,a=255){const l=Number.isFinite(e)?Math.round(e):t;return Math.max(t,Math.min(a,l))}function dt(e,t=0,a=65535){const l=Number.isFinite(e)?Math.round(e):t;return Math.max(t,Math.min(a,l))}function q(e){return`#${K(e).toString(16).toUpperCase().padStart(2,"0")}`}function It(e){return`#${dt(e).toString(16).toUpperCase().padStart(4,"0")}`}function va(e){const t=dt(e??1,1,65535);return dt(Math.round(t*210),1,65535)}function Zn(e){const t=e.replace(/[^a-zA-Z0-9_]/g,"_").replace(/_+/g,"_");return t.length>0?t:"track"}function qn(e){const t=dt(e.bpm||125,1,999),a=K(e.speed||6,1,31);return Math.max(1,Math.round(150*a/t))}function Jn(e){if(e===null||e==="---")return gt;if(e==="===")return Qn;const t=e.toUpperCase().match(/^([A-G](?:#|-))([0-7])$/);if(!t)return gt;const a=t[1],l=parseInt(t[2],10),n={"C-":0,"C#":1,"D-":2,"D#":3,"E-":4,"F-":5,"F#":6,"G-":7,"G#":8,"A-":9,"A#":10,"B-":11}[a];return n===void 0?gt:K(l*12+n,0,95)}function er(e){return!!e&&!Array.isArray(e.waveform)}function tr(e){return(Array.isArray(e.tracks)?e.tracks:[]).filter(a=>((a==null?void 0:a.soundChip)||"PSG")==="PSG"&&(a==null?void 0:a.playbackBackend)!=="external-pt3").map(a=>({...a,soundChip:(a==null?void 0:a.soundChip)||"PSG"}))}function ar(e){return(Array.isArray(e.tracks)?e.tracks:[]).filter(a=>(a==null?void 0:a.playbackBackend)==="external-pt3")}function lr(e){const t=new Map;for(const a of e.instruments||[])er(a)&&typeof a.id=="number"&&t.set(K(a.id,1,31),a);return t}function or(e){const t=new Map;for(const a of e.ornaments||[])!a||typeof a.id!="number"||t.set(K(a.id,1,15),a);return t}function nr(e,t){const a=e==null?void 0:e[t];return{note:(a==null?void 0:a.note)??null,instrument:(a==null?void 0:a.instrument)??null,ornament:(a==null?void 0:a.ornament)??null,volume:(a==null?void 0:a.volume)??null}}function rr(e,t,a,l){if(e==null)return 255;if(e===0)return 0;const o=K(e,1,31);return o!==e&&a.push(`${l}: instrument ${e} clamped to ${o}`),t.has(o)||a.push(`${l}: instrument ${o} not found`),o}function ir(e,t,a,l){if(e==null)return 255;if(e===0)return 0;const o=K(e,1,15);return o!==e&&a.push(`${l}: ornament ${e} clamped to ${o}`),t.has(o)||a.push(`${l}: ornament ${o} not found`),o}function sr(e,t,a){if(e==null)return 255;const l=K(e,0,15);return l!==e&&t.push(`${a}: volume ${e} clamped to ${l}`),l}function $e(e,t){const a=[`${e}:`];if(t.length===0)return a.push("    DB #00"),a.join(`
`);for(let l=0;l<t.length;l+=16)a.push(`    DB ${t.slice(l,l+16).map(o=>q(o)).join(",")}`);return a.join(`
`)}function dr(e,t){const a=[`${e}:`];if(t.length===0)return a.push("    DW #0000"),a.join(`
`);for(let l=0;l<t.length;l+=8)a.push(`    DW ${t.slice(l,l+8).map(o=>It(o)).join(",")}`);return a.join(`
`)}function wa(e){return e.map(t=>K(t&255))}function cr(e){const t=e.some(a=>K(a,0,127)>15);return e.map(a=>{const l=K(a,0,127);if(!t)return K(l,0,15);const o=K(Math.round(l/127*15),0,15);return l>0&&o===0?1:o})}function _r(e){return e.map(t=>K(t,0,31))}function pr(){const e=17897725e-1,t=16.351597831287414,a=[];for(let l=0;l<96;l++){const o=t*Math.pow(2,l/12);a.push(Math.max(1,Math.round(e/(16*o))))}return dr("music_note_period_table",a)}function hr(e,t){const a=`music_track_${t}_${Zn(e.name||`track_${t}`)}`,l=lr(e),o=or(e),n=[],i=Array.isArray(e.order)&&e.order.length>0?e.order:[0],r=K(e.restartPosition??0,0,Math.max(0,i.length-1)),_=Array.isArray(e.patterns)&&e.patterns.length>0?e.patterns:[{id:`${a}_fallback`,name:"Fallback",numRows:1,rows:[]}],d=[];d.push("; ------------------------------------------------------------------"),d.push(`; Tracker Song ${t}: ${e.name}`),d.push("; ------------------------------------------------------------------"),d.push(`${a}_data:`),d.push(`    DB ${q(qn(e))}`),d.push(`    DB ${q(i.length)}`),d.push(`    DB ${q(r)}`),d.push("    DB #01"),d.push(`    DB ${q(_.length)}`),d.push(`    DW ${a}_order_table`),d.push(`    DW ${a}_pattern_table`),d.push(`    DW ${a}_instrument_ptr_table`),d.push(`    DW ${a}_ornament_ptr_table`),d.push(`    DW ${It(va(e.ayHardwareEnvelopePeriod))}`),d.push(`    DB ${q(K(e.ayNoisePeriod??16,0,31))}`),d.push(""),d.push($e(`${a}_order_table`,i.map(c=>K(c,0,Math.max(0,_.length-1))))),d.push(""),d.push(`${a}_pattern_table:`),_.forEach((c,s)=>{var p;d.push(`    DW ${a}_pattern_${s}_rows`),d.push(`    DB ${q(K((c==null?void 0:c.numRows)||((p=c==null?void 0:c.rows)==null?void 0:p.length)||1,1,255))}`)}),d.push(""),d.push(`${a}_instrument_ptr_table:`);for(let c=0;c<=31;c++)d.push(`    DW ${c>0&&l.has(c)?`${a}_inst_${c}`:"0"}`);d.push(""),d.push(`${a}_ornament_ptr_table:`);for(let c=0;c<=15;c++)d.push(`    DW ${c>0&&o.has(c)?`${a}_orn_${c}`:"0"}`);return d.push(""),_.forEach((c,s)=>{var m,u;const p=K((c==null?void 0:c.numRows)||((m=c==null?void 0:c.rows)==null?void 0:m.length)||1,1,255);d.push(`${a}_pattern_${s}_rows:`);for(let h=0;h<p;h++){const y=((u=c==null?void 0:c.rows)==null?void 0:u[h])||{},b=[];Xn.forEach(E=>{const w=nr(y,E),v=`${e.name}/pattern${s}/row${h}/${E}`;b.push(Jn(w.note)),b.push(rr(w.instrument,l,n,v)),b.push(ir(w.ornament,o,n,v)),b.push(sr(w.volume,n,v))}),d.push(`    DB ${b.map(E=>q(E)).join(",")}`)}d.push("")}),Array.from(l.entries()).sort((c,s)=>c[0]-s[0]).forEach(([c,s])=>{const p=cr(s.volumeEnvelope||[]),m=wa(s.toneEnvelope||[]),u=_r(s.noiseEnvelope||[]),h=(s.ayToneEnabled===!1?0:1)<<0|(s.ayNoiseEnabled?1:0)<<1|(typeof s.ayEnvelopeShape=="number"?1:0)<<2,y=p.length>0&&typeof s.volumeLoop=="number"?s.volumeLoop===255?255:K(s.volumeLoop,0,p.length-1):255,b=m.length>0&&typeof s.toneLoop=="number"?s.toneLoop===255?255:K(s.toneLoop,0,m.length-1):255,E=u.length>0&&typeof s.noiseLoop=="number"?s.noiseLoop===255?255:K(s.noiseLoop,0,u.length-1):255,w=p.length>0?p[0]:15;d.push(`${a}_inst_${c}:`),d.push(`    DB ${q(h)}`),d.push(`    DB ${q(w)}`),d.push(`    DB ${q(K(s.ayEnvelopeShape??0,0,15))}`),d.push(`    DB ${q(K(s.noiseBaseFrequency??e.ayNoisePeriod??16,0,31))}`),d.push(`    DW ${It(va(s.hardwareEnvelopePeriod??e.ayHardwareEnvelopePeriod))}`),d.push(`    DW ${p.length>0?`${a}_inst_${c}_vol_env`:"0"}`),d.push(`    DB ${q(p.length)}`),d.push(`    DB ${q(y)}`),d.push(`    DW ${m.length>0?`${a}_inst_${c}_tone_env`:"0"}`),d.push(`    DB ${q(m.length)}`),d.push(`    DB ${q(b)}`),d.push(`    DW ${u.length>0?`${a}_inst_${c}_noise_env`:"0"}`),d.push(`    DB ${q(u.length)}`),d.push(`    DB ${q(E)}`),p.length>0&&d.push($e(`${a}_inst_${c}_vol_env`,p)),m.length>0&&d.push($e(`${a}_inst_${c}_tone_env`,m)),u.length>0&&d.push($e(`${a}_inst_${c}_noise_env`,u)),d.push("")}),Array.from(o.entries()).sort((c,s)=>c[0]-s[0]).forEach(([c,s])=>{const p=wa(s.data||[]),m=p.length>0&&typeof s.loopPosition=="number"?K(s.loopPosition,0,p.length-1):255;d.push(`${a}_orn_${c}:`),d.push(`    DW ${p.length>0?`${a}_orn_${c}_data`:"0"}`),d.push(`    DB ${q(p.length)}`),d.push(`    DB ${q(m)}`),p.length>0&&d.push($e(`${a}_orn_${c}_data`,p)),d.push("")}),n.length>0&&d.splice(3,0,...n.map(c=>`; WARNING: ${c}`)),{labelBase:a,asm:d.join(`
`)}}function ur(e){const t=["; ==================================================================","; PT3 MUSIC BACKEND","; Uses the PT3 replayer for AY-3-8910 music playback.","; PT3_SETUP, ChanA, AYREGS, etc. are defined in variables.asm.","; ==================================================================","","; ------------------------------------------------------------------","; music_init_system","; Reset PT3 music state. Call once at startup.","; Destroys: AF","; ------------------------------------------------------------------","music_init_system:","    xor a","    ld (music_active), a","    ld (music_muted), a","    ld (music_loop), a","    ld (music_track_index), a","    ld (PT3_SETUP), a","    ret","","; ------------------------------------------------------------------","; music_silence_channels","; Silence all AY channels via BIOS WRTPSG.","; Destroys: AF, E","; ------------------------------------------------------------------","music_silence_channels:","    xor a","    ld b, a","    call psg_set_volume     ; Channel A vol=0","    ld a, 1","    ld b, 0","    call psg_set_volume     ; Channel B vol=0","    ld a, 2","    ld b, 0","    call psg_set_volume     ; Channel C vol=0","    ld a, PSG_MIXER","    ld e, #3F","    call WRTPSG             ; All tones+noise off","    ret","","; ------------------------------------------------------------------","; music_stop","; Stop music and silence channels.","; Destroys: AF","; ------------------------------------------------------------------","music_stop:","    push af","    xor a","    ld (music_active), a","    ld (PT3_SETUP), a","    call music_silence_channels","    pop af","    ret","","; ------------------------------------------------------------------","; music_mute","; Mute music (keep track position).","; Destroys: AF","; ------------------------------------------------------------------","music_mute:","    ld a, (music_active)","    or a","    ret z","    ld a, 1","    ld (music_muted), a","    call music_silence_channels","    ret","","; ------------------------------------------------------------------","; music_resume","; Resume muted music.","; Destroys: AF","; ------------------------------------------------------------------","music_resume:","    ld a, (music_active)","    or a","    ret z","    xor a","    ld (music_muted), a","    ret","","; ------------------------------------------------------------------","; music_execute_command","; Dispatch a music command from Game Flow nodes.","; Input:  DE -> [command, trackIndex, loopFlag]",";         0=stop, 1=play, 2=mute, 3=resume, #FF=no-op","; Destroys: AF, BC (play path), DE (play path), HL","; ------------------------------------------------------------------","music_execute_command:","    ld a, (de)","    cp #FF","    ret z","    or a","    jp z, music_stop","    cp 1","    jp z, .pt3_exec_play","    cp 2","    jp z, music_mute","    cp 3","    jp z, music_resume","    ret",".pt3_exec_play:","    inc de","    ld a, (de)","    ld c, a","    inc de","    ld a, (de)","    ld b, a","    ld a, c","    call music_play_track","    ret","","; ------------------------------------------------------------------","; music_play_track","; Start playing a PT3 track.","; Input:  A = track index (0-based)",";         B = loop flag (0=no loop, 1=loop)","; Destroys: AF, BC, DE, HL, IX, IY","; ------------------------------------------------------------------","music_play_track:","    ld (music_track_index), a","    ld a, b","    and 1","    ld (music_loop), a","    ld a, (music_track_index)","    add a, a               ; *2 (DW entries)","    ld e, a","    ld d, 0","    ld hl, music_pt3_track_table","    add hl, de","    ld e, (hl)","    inc hl","    ld d, (hl)","    ld h, d","    ld l, e                ; HL = adjusted module address","    xor a","    ld (music_muted), a","    ld (PT3_SETUP), a      ; Clear end-of-song flag","    di                     ; Disable interrupts while initialising PT3","    push ix","    push iy","    call PT3_INIT","    pop iy","    pop ix","    ld a, 1","    ld (music_active), a   ; Enable playback AFTER PT3 is fully initialised","    ei","    ret","","; ------------------------------------------------------------------","; music_update","; Update PT3 playback. Called every frame from the main loop or ISR.","; Checks end-of-song flag, handles loop/stop, runs PT3_PLAY+PT3_ROUT.","; Destroys: AF, HL, DE (saves/restores IX/IY around PT3 calls)","; ------------------------------------------------------------------","music_update:","    ld a, (music_active)","    or a","    ret z","    ld a, (music_muted)","    or a","    ret nz","    ; Check if song ended (CHECKLP sets bit7 of PT3_SETUP)","    ld a, (PT3_SETUP)","    bit 7, a","    jr z, .pt3_upd_play","    ; Song ended - loop or stop?","    ld a, (music_loop)","    or a","    jr z, .pt3_upd_stop","    ; Loop: reinitialise from same track","    ld a, (music_track_index)","    add a, a","    ld e, a","    ld d, 0","    ld hl, music_pt3_track_table","    add hl, de","    ld e, (hl)","    inc hl","    ld d, (hl)","    ld h, d","    ld l, e","    di","    push ix","    push iy","    call PT3_INIT","    pop iy","    pop ix","    ei","    ret",".pt3_upd_stop:","    xor a","    ld (music_active), a","    ret",".pt3_upd_play:","    di","    push ix","    push iy","    call PT3_PLAY","    call PT3_ROUT","    pop iy","    pop ix","    ei","    ret","","; ------------------------------------------------------------------","; PT3 REPLAYER (included from server root)","; ------------------------------------------------------------------",'    include "../PT3-ROM-alltables-glass.asm"',"","; ------------------------------------------------------------------","; PT3 TRACK TABLE","; ------------------------------------------------------------------","music_pt3_track_count:",`    DB ${q(e.length)}`,"","music_pt3_track_table:"];return e.length===0?t.push("    DW 0  ; no tracks"):e.forEach((a,l)=>{const o=`pt3_track_${l}_data`,n=a.name||`track ${l}`;a.externalPt3HasHeader?t.push(`    DW ${o}         ; ${n} (full file)`):t.push(`    DW ${o} - 99    ; ${n} (.99 stripped)`)}),e.length>0&&(t.push(""),e.forEach((a,l)=>{const o=`pt3_track_${l}_data`,n=a.name||`Track ${l}`;t.push(`; --- PT3 Track ${l}: ${n} ---`),t.push(`${o}:`);const i=a.externalPt3Data||[];if(i.length===0)t.push("    DB 0  ; empty track");else for(let r=0;r<i.length;r+=16){const _=i.slice(r,r+16);t.push(`    DB ${_.map(d=>q(d)).join(",")}`)}t.push("")})),t.join(`
`)}function mr(e){const t=e.map((l,o)=>hr(l,o)),a=["; ==================================================================","; TRACKER MUSIC RUNTIME (Phase 1)","; Phase 1 plays row data and loop state in ROM; descriptor tables are","; serialized now for compatibility and future expansion.","; ==================================================================","","MUSIC_TRACK_ORDER_TABLE     EQU 5","MUSIC_TRACK_PATTERN_TABLE   EQU 7","MUSIC_TRACK_INSTRUMENT_TABLE EQU 9","MUSIC_TRACK_NOISE_DEFAULT   EQU 15","","; ------------------------------------------------------------------","; music_init_system","; Reset tracker runtime RAM and default PSG mixer shadow.","; Input:  None","; Output: music_active=0, music_muted=0, music_mixer_shadow=#3F","; Destroys: AF","; ------------------------------------------------------------------","music_init_system:","    xor a","    ld (music_active), a","    ld (music_muted), a","    ld (music_loop), a","    ld (music_track_index), a","    ld (music_row_frames), a","    ld (music_row_countdown), a","    ld (music_order_pos), a","    ld (music_pattern_index), a","    ld (music_pattern_row), a","    ld (music_pattern_rows), a","    ld (music_track_ptr_l), a","    ld (music_track_ptr_h), a","    ld (music_pattern_ptr_l), a","    ld (music_pattern_ptr_h), a","    ld a, #3F","    ld (music_mixer_shadow), a","    call music_reset_channel_state","    ret","","music_reset_channel_state:","    ld a, #FF","    ld (music_ch_a_note), a","    ld (music_ch_b_note), a","    ld (music_ch_c_note), a","    xor a","    ld (music_ch_a_instrument), a","    ld (music_ch_b_instrument), a","    ld (music_ch_c_instrument), a","    ld (music_ch_a_ornament), a","    ld (music_ch_b_ornament), a","    ld (music_ch_c_ornament), a","    ld (music_ch_a_vol_step), a","    ld (music_ch_b_vol_step), a","    ld (music_ch_c_vol_step), a","    ld (music_ch_a_tone_step), a","    ld (music_ch_b_tone_step), a","    ld (music_ch_c_tone_step), a","    ld (music_ch_a_noise_step), a","    ld (music_ch_b_noise_step), a","    ld (music_ch_c_noise_step), a","    ld (music_ch_a_orn_step), a","    ld (music_ch_b_orn_step), a","    ld (music_ch_c_orn_step), a","    ld a, #0F","    ld (music_ch_a_volume), a","    ld (music_ch_b_volume), a","    ld (music_ch_c_volume), a","    ret","","music_silence_channels:","    xor a","    ld b, 0","    call psg_set_volume","    ld a, 1","    ld b, 0","    call psg_set_volume","    ld a, 2","    ld b, 0","    call psg_set_volume","    ld a, #3F","    call psg_set_mixer","    ret","","music_stop:","    push af","    call music_init_system","    call music_silence_channels","    pop af","    ret","","music_mute:","    ld a, (music_active)","    or a","    ret z","    ld a, 1","    ld (music_muted), a","    call music_silence_channels","    ret","","music_resume:","    ld a, (music_active)","    or a","    ret z","    xor a","    ld (music_muted), a","    call music_update_channel_effects","    ret","","; ------------------------------------------------------------------","; music_execute_command","; Dispatch a compact music command stream used by Game Flow nodes.","; Input:  DE -> [command, trackIndex, loopFlag]",";         command: 0=stop, 1=play, 2=mute, 3=resume, #FF=no-op","; Output: Selected command executed, DE may advance while parsing","; Destroys: AF, BC (play path), DE (play path), HL (via callees)","; ------------------------------------------------------------------","music_execute_command:","    ld a, (de)","    cp #FF","    ret z","    or a","    jp z, music_stop","    cp 1","    jp z, .play_track","    cp 2","    jp z, music_mute","    cp 3","    jp z, music_resume","    ret",".play_track:","    inc de","    ld a, (de)","    ld c, a","    inc de","    ld a, (de)","    ld b, a","    ld a, c","    call music_play_track","    ret","","music_load_track_pointer_from_index:","    add a, a","    ld e, a","    ld d, 0","    ld hl, music_track_ptr_table","    add hl, de","    ld e, (hl)","    inc hl","    ld d, (hl)","    ld a, e","    ld (music_track_ptr_l), a","    ld a, d","    ld (music_track_ptr_h), a","    ret","","music_get_track_ptr:","    ld a, (music_track_ptr_l)","    ld l, a","    ld a, (music_track_ptr_h)","    ld h, a","    ret","","music_get_track_header_ptr:","    ld e, a","    ld d, 0","    call music_get_track_ptr","    add hl, de","    ret","","music_read_track_byte:","    call music_get_track_header_ptr","    ld a, (hl)","    ret","","music_read_track_word:","    call music_get_track_header_ptr","    ld e, (hl)","    inc hl","    ld d, (hl)","    ld h, d","    ld l, e","    ret","","music_get_instrument_ptr:","    or a","    jr z, .no_instrument","    add a, a","    ld e, a","    ld d, 0","    ld a, MUSIC_TRACK_INSTRUMENT_TABLE","    call music_read_track_word","    add hl, de","    ld e, (hl)","    inc hl","    ld d, (hl)","    ld h, d","    ld l, e","    ret",".no_instrument:","    ld hl, 0","    ret","","; ------------------------------------------------------------------","; music_get_channel_instrument_ptr","; Resolve current channel instrument pointer from the cached channel id.","; Input:  C = channel index (0=A, 1=B, 2=C)","; Output: HL = instrument descriptor or 0 when none is active","; Destroys: AF, DE, HL","; ------------------------------------------------------------------","music_get_channel_instrument_ptr:","    ld hl, music_ch_instrument_base","    call music_load_channel_byte","    call music_get_instrument_ptr","    ret","","; ------------------------------------------------------------------","; music_channel_uses_hardware_env","; Check if the active instrument routes channel volume through PSG ENV.","; Input:  C = channel index (0=A, 1=B, 2=C)","; Output: A = 1 when PSG hardware envelope is enabled, else 0","; Destroys: AF, DE, HL","; ------------------------------------------------------------------","music_channel_uses_hardware_env:","    push hl","    call music_get_channel_instrument_ptr","    ld a, h","    or l","    jr z, music_channel_uses_hardware_env_no_hw_env","    ld a, (hl)","    and #04","    jr z, music_channel_uses_hardware_env_no_hw_env","    ld a, 1","    pop hl","    ret","music_channel_uses_hardware_env_no_hw_env:","    xor a","    pop hl","    ret","","; ------------------------------------------------------------------","; music_trigger_channel_attack","; Hook kept for compatibility. The preview-style hardware envelope is","; emulated in software per channel, so new-note state is already reset","; by music_apply_channel_cell before this helper is called.","; Input:  C = channel index (0=A, 1=B, 2=C)","; Output: None","; Destroys: None","; ------------------------------------------------------------------","music_trigger_channel_attack:","    ret","","; ------------------------------------------------------------------","; music_resolve_channel_volume","; Resolve per-frame channel volume.","; Current Phase 1 behavior:","; - emulates AY hardware envelope shapes in software when ayEnvelopeShape is set","; - falls back to music_ch_volume_base when no envelope data exists","; - applies a simple software volumeEnvelope when present","; Input:  C = channel index (0=A, 1=B, 2=C)","; Output: B = PSG volume 0-15","; Destroys: AF, DE, HL","; ------------------------------------------------------------------","music_resolve_channel_volume:","    push af","    push de","    push hl","    ld hl, music_ch_instrument_base","    call music_load_channel_byte","    or a","    jp z, .fallback_base","    call music_get_instrument_ptr","    ld a, h","    or l","    jp z, .fallback_base","    ld a, (hl)","    and #04","    jp nz, .hardware_env",".check_software_env:","    push hl","    ld de, 8","    add hl, de","    ld b, (hl)","    pop hl","    ld a, b","    or a","    jp z, .fallback_base","    push hl","    ld de, 6","    add hl, de","    ld e, (hl)","    inc hl","    ld d, (hl)","    pop hl","    push hl","    ld hl, music_ch_vol_step_base","    call music_load_channel_byte","    cp b","    jr c, .step_ok_restore","    pop hl","    push de","    push hl","    ld de, 9","    add hl, de","    ld a, (hl)","    pop hl","    pop de","    cp b","    jr c, .step_ok","    ld a, b","    push af","    ld hl, music_ch_vol_step_base","    call music_store_channel_byte","    pop af","    ld hl, music_ch_note_base","    ld a, #FF","    call music_store_channel_byte","    xor a","    ld b, a","    jp .mrcv_done",".step_ok_restore:","    pop hl",".step_ok:","    push af","    inc a","    cp b","    jr c, .next_step_ok","    push de","    push hl","    ld de, 9","    add hl, de","    ld a, (hl)","    pop hl","    pop de","    cp b","    jr c, .next_step_ok","    ld a, b",".next_step_ok:","    push de","    ld hl, music_ch_vol_step_base","    call music_store_channel_byte","    pop de","    pop af","    ld l, a","    ld h, 0","    add hl, de","    ld a, (hl)","    cp 16","    jr c, .env_volume_ok","    ld a, 15",".env_volume_ok:","    ld b, a","    jp .mrcv_done",".hardware_env:","    ld hl, music_ch_tone_step_base","    call music_load_channel_byte","    inc a","    cp 2","    jr c, .hw_store_counter","    xor a","    push af","    ld hl, music_ch_tone_step_base","    call music_store_channel_byte","    pop af","    ld hl, music_ch_vol_step_base","    call music_load_channel_byte","    cp 15","    jr nc, .hw_phase_ready","    inc a","    push af","    ld hl, music_ch_vol_step_base","    call music_store_channel_byte","    pop af","    jr .hw_phase_ready",".hw_store_counter:","    push af","    ld hl, music_ch_tone_step_base","    call music_store_channel_byte","    pop af","    ld hl, music_ch_vol_step_base","    call music_load_channel_byte",".hw_phase_ready:","    push af","    call music_get_channel_instrument_ptr","    ld a, h","    or l","    pop af","    jr z, .hw_decay","    push af","    inc hl","    inc hl","    ld a, (hl)","    and #04","    pop af","    jr z, .hw_decay","    ld b, a","    jp .mrcv_done",".hw_decay:","    ld e, a","    ld a, 15","    sub e","    ld b, a","    jp .mrcv_done",".fallback_base:","    ld hl, music_ch_volume_base","    call music_load_channel_byte","    ld b, a",".mrcv_done:","    pop hl","    pop de","    pop af","    ret","","; ------------------------------------------------------------------","; music_resolve_channel_noise","; Resolve per-frame channel noise period, including the PT3-inspired","; software noise macro appended to the instrument descriptor.","; Input:  C = channel index (0=A, 1=B, 2=C)","; Output: A = PSG noise period 0-31","; Destroys: AF, DE, HL","; Preserves: Stack balance restored before return","; ------------------------------------------------------------------","music_resolve_channel_noise:","    push de","    push hl","    ld hl, music_ch_instrument_base","    call music_load_channel_byte","    or a","    jp z, .mrcn_track_default","    call music_get_instrument_ptr","    ld a, h","    or l","    jp z, .mrcn_track_default","    push hl","    ld de, 16","    add hl, de","    ld b, (hl)","    pop hl","    ld a, b","    or a","    jp z, .mrcn_static_noise","    push hl","    ld hl, music_ch_noise_step_base","    call music_load_channel_byte","    cp b","    jr c, .mrcn_step_ok","    ld a, b","    dec a",".mrcn_step_ok:","    push af","    pop af","    pop hl","    push af","    inc a","    cp b","    jr c, .mrcn_store_next","    push de","    ld de, 17","    add hl, de","    ld a, (hl)","    pop de","    cp b","    jr c, .mrcn_store_next","    ld a, b","    dec a",".mrcn_store_next:","    push hl","    push af","    ld hl, music_ch_noise_step_base","    call music_store_channel_byte","    pop af","    pop hl","    ld de, 14","    add hl, de","    ld e, (hl)","    inc hl","    ld d, (hl)","    pop af","    ld l, a","    ld h, 0","    add hl, de","    ld a, (hl)","    and #1F","    jp .mrcn_done",".mrcn_static_noise:","    push de","    ld de, 3","    add hl, de","    ld a, (hl)","    pop de","    and #1F","    jp .mrcn_done",".mrcn_track_default:","    ld a, MUSIC_TRACK_NOISE_DEFAULT","    call music_read_track_byte","    and #1F",".mrcn_done:","    pop hl","    pop de","    ret","","; ------------------------------------------------------------------","; music_play_track","; Start a serialized PSG tracker song from ROM.","; Input:  A = track index in music_track_ptr_table",";         B bit 0 = loop enabled flag","; Output: music_active=1 and first row applied immediately","; Destroys: AF, BC, DE, HL","; Preserves: Stack balance restored on all exits","; ------------------------------------------------------------------","music_play_track:","    push bc","    push de","    push hl","    ld hl, music_track_count","    cp (hl)","    jp nc, .done","    ld (music_track_index), a","    call music_load_track_pointer_from_index","    ld a, b","    and 1","    ld (music_loop), a","    xor a","    ld (music_muted), a","    ld (music_order_pos), a","    ld (music_pattern_index), a","    ld (music_pattern_row), a","    ld a, 1","    ld (music_active), a","    call music_reset_channel_state","    call music_apply_row",".done:","    pop hl","    pop de","    pop bc","    ret","","music_store_channel_byte:","    push de","    ld e, c","    ld d, 0","    add hl, de","    ld (hl), a","    pop de","    ret","","music_load_channel_byte:","    push de","    ld e, c","    ld d, 0","    add hl, de","    ld a, (hl)","    pop de","    ret","","music_apply_channel_cell:","    ld c, a","    ld d, 0","    ld a, (hl)","    inc hl","    cp #FF","    jp z, .note_done","    cp #FE","    jp nz, .store_note","    ld a, #FF","    jr .store_note",".store_note:","    cp #FF","    jr z, .store_note_value","    ld d, 1",".store_note_value:","    push hl","    ld hl, music_ch_note_base","    call music_store_channel_byte","    xor a","    ld hl, music_ch_vol_step_base","    call music_store_channel_byte","    ld hl, music_ch_tone_step_base","    call music_store_channel_byte","    ld hl, music_ch_noise_step_base","    call music_store_channel_byte","    ld hl, music_ch_orn_step_base","    call music_store_channel_byte","    pop hl",".note_done:","    ld a, (hl)","    inc hl","    cp #FF","    jp z, .instrument_done","    push hl","    ld hl, music_ch_instrument_base","    call music_store_channel_byte","    pop hl",".instrument_done:","    ld a, (hl)","    inc hl","    cp #FF","    jp z, .ornament_done","    push hl","    ld hl, music_ch_ornament_base","    call music_store_channel_byte","    pop hl",".ornament_done:","    ld a, (hl)","    inc hl","    cp #FF","    jr z, .maybe_trigger_attack","    push hl","    ld hl, music_ch_volume_base","    call music_store_channel_byte","    pop hl",".maybe_trigger_attack:","    ld a, d","    or a","    ret z","    push hl","    call music_trigger_channel_attack","    pop hl","    ret","","; ------------------------------------------------------------------","; music_apply_row","; Decode current order/pattern row and cache channel state for A/B/C.","; Input:  Runtime variables select track/order/pattern position","; Output: Channel note/instrument/volume caches updated",";         Row countdown reloaded and PSG refreshed once","; Destroys: AF, BC, DE, HL","; ------------------------------------------------------------------","music_apply_row:","    ld a, MUSIC_TRACK_ORDER_TABLE","    call music_read_track_word","    ld a, (music_order_pos)","    ld e, a","    ld d, 0","    add hl, de","    ld a, (hl)","    ld (music_pattern_index), a","    ld a, MUSIC_TRACK_PATTERN_TABLE","    call music_read_track_word","    ld a, (music_pattern_index)","    ld e, a","    ld d, 0","    add hl, de","    add hl, de","    add hl, de","    ld e, (hl)","    inc hl","    ld d, (hl)","    inc hl","    ld a, (hl)","    ld (music_pattern_rows), a","    ld a, e","    ld (music_pattern_ptr_l), a","    ld a, d","    ld (music_pattern_ptr_h), a","    ld h, d","    ld l, e","    ld a, (music_pattern_row)","    or a","    jp z, .row_ptr_ready","    ld b, a",".row_offset_loop:","    ld de, 12","    add hl, de","    djnz .row_offset_loop",".row_ptr_ready:","    xor a","    call music_apply_channel_cell","    ld a, 1","    call music_apply_channel_cell","    ld a, 2","    call music_apply_channel_cell","    ld a, (music_pattern_row)","    inc a","    ld d, a","    ld a, (music_pattern_rows)","    cp d","    jp z, .advance_order","    jp c, .advance_order","    ld a, d","    ld (music_pattern_row), a","    jp .row_done",".advance_order:","    xor a","    ld (music_pattern_row), a","    ld a, (music_order_pos)","    inc a","    ld d, a","    ld a, 1","    call music_read_track_byte","    cp d","    jp z, .end_of_order","    jp c, .end_of_order","    ld a, d","    ld (music_order_pos), a","    jp .row_done",".end_of_order:","    ld a, (music_loop)","    or a","    jp z, music_stop","    ld a, 2","    call music_read_track_byte","    ld (music_order_pos), a",".row_done:","    xor a","    call music_read_track_byte","    ld (music_row_frames), a","    ld (music_row_countdown), a","    call music_update_channel_effects","    ret","","; ------------------------------------------------------------------","; music_update","; Advance the tracker once per game frame.","; Input:  None","; Output: Current channel PSG state refreshed; next row applied when due","; Destroys: AF, BC, DE, HL","; ------------------------------------------------------------------","music_update:","    ld a, (music_active)","    or a","    ret z","    ld a, (music_muted)","    or a","    ret nz","    call music_update_channel_effects","    ld a, (music_row_countdown)","    or a","    jp z, music_apply_row","    dec a","    ld (music_row_countdown), a","    ret nz","    call music_apply_row","    ret","","; ------------------------------------------------------------------","; music_update_channel_effects","; Rebuild mixer bits and push current cached channel state to PSG.","; Input:  music_ch_* caches already populated","; Output: PSG tone/volume registers updated for channels A/B/C",";         music_mixer_shadow rewritten with current enable bits","; Destroys: AF, BC, DE, HL","; ------------------------------------------------------------------","music_update_channel_effects:","    ld a, #3F","    ld (music_mixer_shadow), a","    ld c, 0","    call music_update_one_channel","    ld c, 1","    call music_update_one_channel","    ld c, 2","    call music_update_one_channel","    ld a, (music_mixer_shadow)","    call psg_set_mixer","    ret","","; ------------------------------------------------------------------","; music_update_one_channel","; Apply one cached channel to PSG and update the mixer shadow bits.","; Input:  C = channel index (0=A, 1=B, 2=C)","; Output: Channel PSG tone/volume updated or silenced",";         music_mixer_shadow updated for that channel","; Destroys: AF, BC, DE, HL","; Preserves: Stack balance restored before return","; ------------------------------------------------------------------","music_update_one_channel:","    push bc","    push de","    push hl","    ld hl, music_ch_note_base","    call music_load_channel_byte","    cp #FF","    jp z, .silent_channel","    add a, a","    ld e, a","    ld d, 0","    ld hl, music_note_period_table","    add hl, de","    ld e, (hl)","    inc hl","    ld d, (hl)","    ld h, d","    ld l, e","    ld a, c","    push bc","    call psg_set_tone","    pop bc","    call music_resolve_channel_volume","    ld a, c","    push bc","    call psg_set_volume","    pop bc","    ld d, 1","    ld e, 0","    call music_get_channel_instrument_ptr","    ld a, h","    or l","    jr z, .apply_mixer_bits","    ld a, (hl)","    and #01","    ld d, a","    ld a, (hl)","    and #02","    srl a","    ld e, a","    ld a, e","    or a","    jr z, .apply_mixer_bits","    push de","    call music_resolve_channel_noise","    call psg_set_noise","    pop de",".apply_mixer_bits:","    ld a, (music_mixer_shadow)","    ld b, a","    ld a, c","    cp 1","    jp z, .enable_b","    cp 2","    jp z, .enable_c","    ld a, b","    bit 0, d","    jr z, .a_tone_off","    and #3E","    jr .a_noise_gate",".a_tone_off:","    or #01",".a_noise_gate:","    bit 0, e","    jr z, .a_noise_off","    and #37","    jp .store_mixer",".a_noise_off:","    or #08","    jp .store_mixer",".enable_b:","    ld a, b","    bit 0, d","    jr z, .b_tone_off","    and #3D","    jr .b_noise_gate",".b_tone_off:","    or #02",".b_noise_gate:","    bit 0, e","    jr z, .b_noise_off","    and #2F","    jp .store_mixer",".b_noise_off:","    or #10","    jp .store_mixer",".enable_c:","    ld a, b","    bit 0, d","    jr z, .c_tone_off","    and #3B","    jr .c_noise_gate",".c_tone_off:","    or #04",".c_noise_gate:","    bit 0, e","    jr z, .c_noise_off","    and #1F","    jp .store_mixer",".c_noise_off:","    or #20","    jp .store_mixer",".silent_channel:","    ld b, 0","    ld a, c","    push bc","    call psg_set_volume","    pop bc","    ld a, (music_mixer_shadow)","    ld b, a","    ld a, c","    cp 1","    jp z, .disable_b","    cp 2","    jp z, .disable_c","    ld a, b","    or #09","    jp .store_mixer",".disable_b:","    ld a, b","    or #12","    jp .store_mixer",".disable_c:","    ld a, b","    or #24",".store_mixer:","    ld (music_mixer_shadow), a","    pop hl","    pop de","    pop bc","    ret","",pr(),"","music_track_count:",`    DB ${q(t.length)}`,"","music_track_ptr_table:"];return t.length===0?a.push("    DW 0"):t.forEach(l=>{a.push(`    DW ${l.labelBase}_data`)}),t.length>0&&(a.push(""),t.forEach(l=>{a.push(l.asm)})),a.join(`
`)}function br(e){var l,o,n,i;const t=((o=(l=e.tiles)==null?void 0:l[0])==null?void 0:o.width)||8,a=((i=(n=e.tiles)==null?void 0:n[0])==null?void 0:i.height)||8;return`; ==================================================================
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
    ld a, ${t}
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
    ${t===8?`
    ; Tile width is 8, shift right 3 times
    ld a, c
    srl b
    rra
    srl b
    rra
    srl b
    rra`:t===16?`
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
    ; Tile width is ${t}, divide
    ld a, c
    ld c, ${t}
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
`}const Da="SCREEN 2 (Graphics I)";function he(e,t,a=0,l=255){return Number.isFinite(e)?e<a?a:e>l?l:Math.floor(e):t}function St(e){return String(e||"").trim().toLowerCase()}function fr(e){const t=String(e||"").trim();if(!t)return null;const a=t.match(/^(.*?)(?:[_\-\s](?:f|frame))(\d+)$/i);if(!a)return null;const l=String(a[1]||"").trim(),o=parseInt(a[2],10);return!l||Number.isNaN(o)?null:{groupId:l,frameOrder:o}}const Ha={rotate_left:1,rotate_right:2,shift_left:3,shift_right:4,shift_up:5,shift_down:6,swap_top_bottom:7};function yr(e){return String(e||"").trim().toLowerCase()==="transform"?"transform":"frames"}function za(e){const t=String(e||"").trim().toLowerCase();return t&&Object.prototype.hasOwnProperty.call(Ha,t)?t:null}function Er(e){const t=(e==null?void 0:e.animation)??(e==null?void 0:e.animatedTile)??(e==null?void 0:e.tileAnimation)??null;if((typeof(t==null?void 0:t.enabled)=="boolean"?t.enabled:typeof(e==null?void 0:e.isAnimated)=="boolean"?e.isAnimated:void 0)===!1||t===!1)return{enabled:!1,mode:"frames",groupId:null,frameOrder:null,speed:null,baseTileId:null,transformEffect:null,transformIncludeColors:!0,transformCheckpoints:null};const l=(e==null?void 0:e.animationGroup)??(t==null?void 0:t.groupId)??(t==null?void 0:t.group)??(t==null?void 0:t.name)??(t==null?void 0:t.id)??null,o=typeof l=="string"&&l.trim()?l.trim():null,n=(e==null?void 0:e.animationFrameIndex)??(e==null?void 0:e.frameIndex)??(t==null?void 0:t.frameIndex)??(t==null?void 0:t.frame)??null,i=Number.isFinite(Number(n))?he(Number(n),0):null,r=(e==null?void 0:e.animationSpeed)??(e==null?void 0:e.animationSpeedFrames)??(t==null?void 0:t.speed)??(t==null?void 0:t.speedFrames)??(t==null?void 0:t.ticksPerFrame)??null,_=Number.isFinite(Number(r))?he(Number(r),8,1,255):null,d=(e==null?void 0:e.animationBaseTileId)??(t==null?void 0:t.baseTileId)??(t==null?void 0:t.targetTileId)??null,c=typeof d=="string"&&d.trim()?d.trim():null,s=(t==null?void 0:t.transform)??null,p=za((e==null?void 0:e.animationTransformEffect)??(t==null?void 0:t.transformEffect)??(s==null?void 0:s.effect)??(t==null?void 0:t.effect)),m=(e==null?void 0:e.animationMode)??(t==null?void 0:t.mode)??(t==null?void 0:t.animationMode)??(p?"transform":null),u=yr(m),h=p||(u==="transform"?"rotate_left":null),y=(e==null?void 0:e.animationTransformIncludeColors)??(t==null?void 0:t.animationTransformIncludeColors)??(s==null?void 0:s.includeColors),b=typeof y=="boolean"?y:!0,E=(e==null?void 0:e.animationTransformCheckpoints)??(t==null?void 0:t.animationTransformCheckpoints)??(s==null?void 0:s.checkpoints),w=Number.isFinite(Number(E))?he(Number(E),8,1,255):null;return{enabled:!0,mode:u,groupId:o,frameOrder:i,speed:_,baseTileId:c,transformEffect:h,transformIncludeColors:b,transformCheckpoints:w}}function gr(e){const t=new Map,a=Array.isArray(e.tiles)?e.tiles:[];let l=128;return a.forEach((o,n)=>{if(!(o!=null&&o.id))return;const i=Math.max(1,Math.ceil((o.width||8)/8)),r=Math.max(1,Math.ceil((o.height||8)/8)),_=i*r;t.set(o.id,{charCode:l,charsPerTile:_,tileIndex:n}),l+=_}),t}function Sr(e){return`#${he(e,0).toString(16).toUpperCase().padStart(2,"0")}`}function Ra(e,t){return String(e||"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"")||t}function Ar(e,t=16){if(!e.length)return"    db #00";const a=[];for(let l=0;l<e.length;l+=t){const o=e.slice(l,l+t).map(Sr).join(", ");a.push(`    db ${o}`)}return a.join(`
`)}function Tr(e,t,a){const l=e.slice(),o=Math.max(0,a|0);for(let n=0;n<l.length;n++){let i=l[n]&255;for(let r=0;r<o;r++)switch(t){case 1:i=(i<<1|i>>7)&255;break;case 2:i=(i>>1|(i&1)<<7)&255;break;case 3:i=i<<1&255;break;case 4:i=i>>1&255;break}l[n]=i}return l}function La(e,t,a){const l=e.slice();if(t===7)return(a&1)===0?l:[l[7],l[1],l[2],l[3],l[4],l[5],l[6],l[0]];const o=a%8;return o===0?l:t===5?l.slice(o).concat(l.slice(0,o)):t===6?l.slice(8-o).concat(l.slice(0,8-o)):l}function Cr(e,t,a,l,o,n){const i=[];for(let r=0;r<n;r++){const _=[];for(let d=0;d<a;d++){const c=d*8,s=e.slice(c,c+8),p=t.slice(c,c+8),m=l<=4?Tr(s,l,r):La(s,l,r),u=l>=5&&o?La(p,l,r):p;_.push(...m,...u)}i.push({tileName:`transform_step_${r}`,bytes:_})}return i}function Ir(e){var _,d;const t=Array.isArray(e.tiles)?e.tiles:[];if(!t.length)return{frameGroups:[],transformGroups:[]};const a=gr(e),l=new Map;t.forEach(c=>{c!=null&&c.id&&l.set(c.id,c)});const o=new Map,n=[],i=[];t.forEach((c,s)=>{const p=String((c==null?void 0:c.id)||"").trim();if(!p)return;const m=a.get(p);if(!m)return;const u=Er(c);if(!u.enabled)return;const h=fr((c==null?void 0:c.name)||""),y=(u.groupId||(h==null?void 0:h.groupId)||(c==null?void 0:c.name)||p||"").trim();if(u.mode==="transform"){const f=za(u.transformEffect);if(!f)return;const g=(u.baseTileId&&a.has(u.baseTileId)?u.baseTileId:null)||p,S=a.get(g);if(!S)return;const C=S.charCode,x=S.charsPerTile;if(C<0||C+x-1>255)return;const M=Ha[f];if(!M)return;const L=u.transformIncludeColors?1:0,D=`anim_transform_${n.length}_${Ra(y,`t${n.length}`)}`,R=l.get(g);if(!R)return;const k=x*8,P=Array.from(At(R,Da)||[]);if(P.length!==k)return;const T=Tt(R),$=241,U=T?Array.from(T).slice(0,k):new Array(k).fill($);for(;U.length<k;)U.push($);const G=he(u.transformCheckpoints??8,8,1,255);n.push({label:D,groupId:y,speed:he(u.speed??8,8,1,255),targetTileId:g,targetCharCode:C,charsPerTile:x,operationCode:M,flags:L}),i.push({label:D,groupId:y,speed:he(u.speed??8,8,1,255),targetTileId:g,targetCharCode:C,charsPerTile:x,frameCount:G,bytesPerFrame:x*16,frames:Cr(P,U,x,M,u.transformIncludeColors,G)});return}if(!y)return;let b=u.frameOrder;b===null&&h&&(!u.groupId||St(u.groupId)===St(h.groupId))&&(b=h.frameOrder),b===null&&(b=m.tileIndex);const E=he(u.speed??8,8,1,255),w=St(y),v=o.get(w)||[];v.push({tile:c,tileIndex:s,tileId:p,groupId:y,frameOrder:b,speed:E,baseTileId:u.baseTileId}),o.set(w,v)});const r=[];for(const c of o.values()){if(c.length<2)continue;const s=[...c].sort((g,S)=>g.frameOrder!==S.frameOrder?g.frameOrder-S.frameOrder:g.tileIndex-S.tileIndex),m=((_=s.find(g=>!!g.baseTileId&&a.has(g.baseTileId)))==null?void 0:_.baseTileId)||null||s[0].tileId,u=a.get(m);if(!u)continue;const h=s.filter(g=>{const S=a.get(g.tileId);return!!S&&S.charsPerTile===u.charsPerTile});if(h.length<2)continue;const y=u.charCode,b=u.charsPerTile;if(y<0||y+b-1>255)continue;const E=[],w=b*8;let v=h[0].speed;for(const g of h){const S=Array.from(At(g.tile,Da)||[]);if(S.length!==w)continue;const C=Tt(g.tile),x=241,M=C?Array.from(C).slice(0,w):new Array(w).fill(x);for(;M.length<w;)M.push(x);const L=[];for(let D=0;D<b;D++){const R=D*8;L.push(...S.slice(R,R+8)),L.push(...M.slice(R,R+8))}E.push({tileName:String(((d=g.tile)==null?void 0:d.name)||g.tileId),bytes:L}),v=Math.min(v,g.speed)}if(E.length<2)continue;const f=h[0].groupId,A=`anim_group_${r.length}_${Ra(f,`g${r.length}`)}`;r.push({label:A,groupId:f,speed:he(v,8,1,255),targetTileId:m,targetCharCode:y,charsPerTile:b,frameCount:he(E.length,E.length,2,255),bytesPerFrame:b*16,frames:E})}return{frameGroups:[...r,...i],transformGroups:n}}function vr(e){var m,u;const{frameGroups:t,transformGroups:a}=Ir(e),l=t.length>0,o=a.length>0,n=he(((m=t[0])==null?void 0:m.speed)??((u=a[0])==null?void 0:u.speed)??8,8,1,255),i=Math.max(1,t.length+a.length),r=l?t.map(h=>`    db ${h.targetCharCode}, ${h.charsPerTile}, ${h.frameCount}, ${h.speed}, ${h.bytesPerFrame}    ; ${h.groupId} -> tile ${h.targetTileId}
    dw ${h.label}`).join(`
`):"    ; No animated tile groups detected in project data",_="    ; Transform groups are precomputed as frame data in anim_tile_table",d=l?t.map(h=>{const y=h.frames.slice(0,h.frameCount).map((b,E)=>`    ; Frame ${E}: ${b.tileName}
${Ar(b.bytes)}`).join(`
`);return`${h.label}:
    ; Group "${h.groupId}" targetChar=${h.targetCharCode} chars=${h.charsPerTile}
${y}
`}).join(`
`):`anim_group_empty_data:
    db #00
`,p=[l?`    call mapper_push_p2
    ld a, ANIM_TILE_DATA_BANK
    call mapper_set_bank_p2

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
    call mapper_pop_p2`:"",""].filter(Boolean).join(`
`);return`; ==================================================================
; ANIMATED TILES SYSTEM
; File: animtiles.asm
; Description: Background tile animation for water, lava, fire, etc.
; ==================================================================

; Auto-detected animated groups:
;   frame groups: ${t.length}
;   transform groups: ${a.length}

; ==================================================================
; ANIMATED TILES CONSTANTS
; ==================================================================

; Animation speeds (in frames)
ANIM_SPEED_SLOW         EQU 15      ; ~250ms (water)
ANIM_SPEED_MEDIUM       EQU 8       ; ~133ms (lava)
ANIM_SPEED_FAST         EQU 4       ; ~66ms (fire)

; Maximum animated tiles
MAX_ANIM_TILES          EQU ${i}
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
    ld a, ${n}
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
    ; Increment timer
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
    ; Protect VDP port sequence from ISR VRAM writes (sprite task, etc.)
    ; Preserve prior interrupt state using LD A,I -> P/V = IFF2
    ld a, i
    push af
    di
${p}
    pop af
    jp po, .anim_vram_irq_done
    ei
.anim_vram_irq_done:
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
${o?`    ld hl, anim_transform_table

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
${r}
    db 255                          ; End marker

; ------------------------------------------------------------------
; Transform tile mapping table
; Format:
;   db targetCharCode, charsPerTile, opCode, flags
; flags:
;   bit0 = apply vertical transform on color rows
; ------------------------------------------------------------------
anim_transform_table:
${_}
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
`}function Na(e,t,a){var i,r;const l=[],o=a.some(_=>_.responsibility==="audio"),n=(((i=e.tracks)==null?void 0:i.length)||0)>0||(((r=e.stateMachines)==null?void 0:r.length)||0)>0;return!o&&n&&l.push({id:"audio_tick_fallback",responsibility:"audio",routineLabel:"task_audio_tick",phase:"postHalt",notes:["Fallback path when IRQ audio task is disabled."]}),l.push({id:"sprite_upload",responsibility:"sprites",routineLabel:"update_sprites_to_vram",phase:"postHalt"},{id:"screen_flow",responsibility:"screenFlow",routineLabel:"check_world_screen_transition",phase:"preUpdate"},{id:"entities",responsibility:"entities",routineLabel:"update_all_entities",phase:"postUpdate"},{id:"state_machines",responsibility:"stateMachines",routineLabel:"execute_all_state_machines",phase:"postUpdate"},{id:"animated_tiles",responsibility:"animation",routineLabel:"update_animated_tiles",phase:"postUpdate"},{id:"sfx",responsibility:"sfx",routineLabel:"sfx_update",phase:"postUpdate"},{id:"hud",responsibility:"hud",routineLabel:"render_hud",phase:"render"}),l}function wr(e,t){var r,_;const a=[],l=t.interruptConfig??{},o=l.enableAudioTask??!0,n=l.enableFrameCounterTask??!0,i=(((r=e.tracks)==null?void 0:r.length)||0)>0||(((_=e.stateMachines)==null?void 0:_.length)||0)>0;return o&&i&&a.push({id:"audio_tick",responsibility:"audio",routineLabel:"task_audio_tick",slot:0,period:1,enabledAtBoot:!0,irqSafe:!0,estimatedCycles:0,notes:["Tracker/PT3 music and state-machine sound tick."]}),n&&a.push({id:"frame_counter",responsibility:"timer",routineLabel:"task_frame_counter",slot:1,period:1,enabledAtBoot:!0,irqSafe:!0,estimatedCycles:0,notes:["Minimal periodic timing hook."]}),a}function Dr(e,t){const a=t.executionMode??"interruptTaskManager";if(a==="gameLoopHalt")return{mode:a,tasks:[],mainline:Na(e,t,[]),diagnostics:{warnings:[],errors:[],estimatedIrqCycles:0,estimatedMainlineHotspots:["entities","stateMachines","hud"]}};const l=wr(e,t);return{mode:a,tasks:l,mainline:Na(e,t,l),diagnostics:{warnings:[],errors:[],estimatedIrqCycles:l.reduce((o,n)=>o+(n.estimatedCycles??0),0),estimatedMainlineHotspots:["entities","stateMachines","hud"]}}}const Rr=new Set(["sprites","hud","entities","stateMachines"]);function Lr(e,t){var _;const a=[...e.diagnostics.errors],l=[...e.diagnostics.warnings];((_=t.tiles)==null?void 0:_.some(d=>{var c;return((c=d.logicalProperties)==null?void 0:c.causesDamage)===!0}))&&(We(t).usedComponents.has("Health")||a.push('Tiles with "Deadly" (causesDamage) exist but no entity has the Health component. Add the Health component to the hero/player entity so deadly tiles can cause damage.'));const n=new Map;for(const d of e.tasks){const c=n.get(d.slot);c?a.push(`IRQ slot duplicated: ${d.slot} (${c}, ${d.id})`):n.set(d.slot,d.id),Rr.has(d.responsibility)&&a.push(`Responsibility not allowed in IRQ for v1: ${d.responsibility}`)}const i=e.tasks.some(d=>d.responsibility==="audio"),r=e.mainline.some(d=>d.responsibility==="audio");return i&&r&&a.push("Audio responsibility duplicated between IRQ and mainline"),e.mode==="interruptTaskManager"&&e.tasks.length===0&&l.push("interruptTaskManager selected without active IRQ tasks"),{...e,diagnostics:{...e.diagnostics,warnings:l,errors:a}}}function Nr(e){return e.executionMode?e.executionMode:"interruptTaskManager"}function xr(e,t){const a={...t,executionMode:Nr(t)},l=Lr(Dr(e,a),e);if(l.diagnostics.errors.length>0)throw new Error(`Execution plan validation failed:
${l.diagnostics.errors.join(`
`)}`);return l}function Mr(e,t,a={}){var p;if(console.log("🔧 Generating modular ASM files..."),!e)throw console.error("❌ projectName is required"),new Error("projectName is required");if(!t)throw console.error("❌ assets is undefined or null"),new Error("assets array is required");if(!Array.isArray(t))throw console.error("❌ assets is not an array"),new Error("assets must be an array");console.log(`📊 Project: ${e}, Assets: ${t.length}, Config:`,a);let l;try{l=wt(e,t),console.log(`🔍 Analysis complete: ${l.sprites.length} sprites, ${l.tiles.length} tiles`)}catch(m){console.error("❌ Error analyzing project:",m),l={hasSprites:!1,hasTiles:!1,hasScreens:!1,hasEntities:!1,hasComponents:!1,hasGameFlow:!1,hasMenus:!1,hasFonts:!1,hasECS:!1,hasMultipleScreens:!1,hasAnimations:!1,hasCollisions:!1,hasMenuSystem:!1,components:[],templates:[],entities:[],sprites:[],sounds:[],tracks:[],trackIndexByAssetId:{},tiles:[],tileBanks:[],screens:[],screenMaps:[],projectName:e,customStates:[],stateMachines:[],globalVariables:[]},console.log("🔄 Using fallback empty analysis")}const o=a.interruptDrivenComponents??!0,n=a.hardwareMode||"hybrid",i=a.optimizeLevel||"safe",r=a.targetFormat||"konami",_=a.romMode||"simple32k",d=a.autoMegaROM??!1,c=xr(l,a);console.log("📝 [MSX GENERATOR] Generating all ASM files..."),console.log(`🔧 Hardware Mode: ${n.toUpperCase()}, Optimize: ${i}`),console.log(`[MSX GENERATOR] ROM config: mode=${_}, mapper=${r}, autoMegaROM=${d}`);const s={"bios.asm":Ul({hardwareMode:{mode:n,optimizeLevel:i}}),"constants.asm":Fl(l),"variables.asm":Bl(l),"mapper.asm":no({targetFormat:r,romMode:_,autoMegaROM:d}),"interrupt.asm":Un(l,{interruptDrivenComponents:o,romMode:_},c),"header.asm":Hl(e,l,c),"patterns.asm":ro(l),"colors.asm":io(l),"components.asm":o?`; Components are generated inside interrupt.asm (interruptDrivenComponents=true)
`:Fa(l,_),"entities.asm":Ko(l),"worlds.asm":pn(l),"screens.asm":en(l),"sprites.asm":go(l),"font.asm":tn(l),"hud.asm":an(l),"menus.asm":hn(l),"sound.asm":Kn(l,c),"scroll.asm":br(l),"animtiles.asm":vr(l),"statemachine.asm":l.stateMachines&&l.stateMachines.length>0?kn(l.stateMachines,l.globalVariables,l.sprites,l.tiles,l.templates,l.sounds,l.trackIndexByAssetId):`; No State Machines
`,"gameflow.asm":ql(l,c),"main.asm":lo(e,l),"unitedFiles.asm":""};return a.generateUnified&&(s["unitedFiles.asm"]=bo(s,e,l,c,{romMode:_,targetFormat:r,autoMegaROM:d})),console.log("✅ Modular ASM files generated successfully!"),console.log(`📊 Generated ${Object.keys(s).filter(m=>s[m]).length} files`),console.log("📋 [DEBUG] Files generated:",Object.keys(s)),console.log("🎯 [DEBUG] interrupt.asm length:",((p=s["interrupt.asm"])==null?void 0:p.length)||"MISSING!"),s}const ki=Object.freeze(Object.defineProperty({__proto__:null,generateModularASM:Mr},Symbol.toStringTag,{value:"Module"}));export{li as $,Fe as A,ta as B,pl as C,Br as D,jr as E,hl as F,Ri as G,le as H,ti as I,Ya as J,Qa as K,kr as L,Fr as M,Xa as N,ei as O,Ur as P,cl as Q,it as R,ct as S,wi as T,Di as U,_l as V,Ka as W,ii as X,ai as Y,Yr as Z,oi as _,Qr as a,di as a0,_i as a1,ni as a2,ri as a3,ci as a4,si as a5,pi as a6,De as a7,nt as a8,Zr as a9,Ni as aa,zr as ab,Hr as ac,ot as ad,je as ae,Be as af,ce as ag,ul as ah,xi as ai,ui as aj,F as ak,I as al,$r as am,wt as an,Mi as ao,mi as ap,Gr as aq,Ja as ar,Kr as as,bi as at,hi as au,Vr as av,fi as aw,ki as ax,Wr as b,Xr as c,He as d,Ei as e,qr as f,yi as g,Jr as h,At as i,Tt as j,oe as k,Pr as l,Or as m,rt as n,Si as o,Ai as p,Ti as q,Ci as r,gi as s,Ii as t,ze as u,Ve as v,rl as w,vi as x,Li as y,ea as z};
