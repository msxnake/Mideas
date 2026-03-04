const Pn=[16,24,32];var q=(t=>(t.Score="Score",t.HighScore="HighScore",t.Lives="Lives",t.EnergyBar="EnergyBar",t.ItemDisplay="ItemDisplay",t.SceneName="SceneName",t.MiniMap="MiniMap",t.CoinCounter="CoinCounter",t.BossEnergyBar="BossEnergyBar",t.PhaseIndicator="PhaseIndicator",t.AttackAlert="AttackAlert",t.TextBox="TextBox",t.NumericField="NumericField",t.CustomCounter="CustomCounter",t))(q||{});const ya={water:{bit:0,label:"Water Effect",maskValue:1,color:"rgba(50, 100, 200, 0.4)"},customGravity:{bit:1,label:"Custom Gravity",maskValue:2,color:"rgba(150, 50, 200, 0.4)"},icePhysics:{bit:2,label:"Ice Physics",maskValue:4,color:"rgba(100, 200, 255, 0.4)"},spriteConceal:{bit:3,label:"Sprite Concealment",maskValue:8,color:"rgba(100, 100, 100, 0.4)"}};var ga=(t=>(t.None="None",t.Tile="Tile",t.Sprite="Sprite",t.Screen="Screen",t.Code="Code",t.Attributes="Attributes",t.Sound="Sound",t.Platformer="Platformer",t.WorldMap="WorldMap",t.Track="Track",t.HUD="HUD",t.TileBanks="TileBanks",t.Font="Font",t.HelpDocs="HelpDocs",t.BehaviorEditor="BehaviorEditor",t.ComponentDefinitionEditor="ComponentDefinitionEditor",t.EntityTemplateEditor="EntityTemplateEditor",t.Boss="Boss",t.WorldView="WorldView",t.GameFlow="GameFlow",t.MainMenu="MainMenu",t.StateMachine="StateMachine",t.GlobalVariables="GlobalVariables",t.Palette="Palette",t))(ga||{});const kn=[1,3,5,7],On=[{id:0,name:"NoSolid (Passable)",isSolid:!1},{id:1,name:"Solid (Wall/Ground)",isSolid:!0},{id:2,name:"Platform (Top-Solid)",isSolid:!0},{id:3,name:"Slope (Solid)",isSolid:!0}],Un={isBreakable:{bit:0,label:"Breakable"},isMovable:{bit:1,label:"Movable"},causesDamage:{bit:2,label:"Deadly"},isInteractiveSwitch:{bit:3,label:"Interactable"}},Fn="0.267",De=[{name:"Transparent",hex:"rgba(0,0,0,0)"},{name:"Black",hex:"#000000"},{name:"Medium Green",hex:"#3EB847"},{name:"Light Green",hex:"#74D07D"},{name:"Dark Blue",hex:"#2F2FC1"},{name:"Light Blue",hex:"#5858FC"},{name:"Dark Red",hex:"#B63125"},{name:"Cyan",hex:"#68D2DA"},{name:"Medium Red",hex:"#FC584A"},{name:"Light Red",hex:"#FF8E81"},{name:"Dark Yellow",hex:"#C0BF3B"},{name:"Light Yellow",hex:"#E7E474"},{name:"Dark Green",hex:"#309337"},{name:"Magenta",hex:"#B640C8"},{name:"Gray",hex:"#999999"},{name:"White",hex:"#FFFFFF"}],J=[{name:"Transparent (Backdrop)",hex:"rgba(0,0,0,0)",index:0},{name:"Black",hex:"#000000",index:1},{name:"Medium Green",hex:"#21C842",index:2},{name:"Light Green",hex:"#5EDC78",index:3},{name:"Dark Blue",hex:"#5455ED",index:4},{name:"Light Blue",hex:"#7D76FC",index:5},{name:"Dark Red",hex:"#D4524D",index:6},{name:"Cyan",hex:"#42EBF5",index:7},{name:"Medium Red",hex:"#FC5554",index:8},{name:"Light Red",hex:"#FF7978",index:9},{name:"Dark Yellow",hex:"#D4C154",index:10},{name:"Light Yellow",hex:"#E6CE80",index:11},{name:"Dark Green",hex:"#21B03B",index:12},{name:"Magenta",hex:"#C95BBA",index:13},{name:"Gray",hex:"#CCCCCC",index:14},{name:"White",hex:"#FFFFFF",index:15}],ce=[0,36,73,109,146,182,219,255],Te=t=>t.toString(16).padStart(2,"0").toUpperCase(),$n=(()=>{const t=[];for(let e=0;e<ce.length;e++)for(let a=0;a<ce.length;a++)for(let l=0;l<ce.length;l++){const o=e<<6|a<<3|l;t.push({index:o,hex:`#${Te(ce[e])}${Te(ce[a])}${Te(ce[l])}`,rLevel:e,gLevel:a,bLevel:l})}return t})(),Je=t=>{let e=0,a=1/0;return ce.forEach((l,o)=>{const n=Math.abs(l-t);n<a&&(a=n,e=o)}),e},Ea=t=>!t||!t.startsWith("#")||t.length!==7?"#000000":t.toUpperCase(),Sa=t=>{const e=Ea(t),a=parseInt(e.slice(1,3),16),l=parseInt(e.slice(3,5),16),o=parseInt(e.slice(5,7),16),n=Je(a),c=Je(l),r=Je(o),p=`#${Te(ce[n])}${Te(ce[c])}${Te(ce[r])}`,d=n<<6|c<<3|r;return{hex:p,masterIndex:d}},Bn=De.map((t,e)=>{if(e===0)return{slotIndex:0,masterIndex:-1,hex:"rgba(0,0,0,0)"};const a=Sa(t.hex);return{slotIndex:e,masterIndex:a.masterIndex,hex:a.hex}}),jn=[8,16,24,32],Hn=16,zn=16,Vn=16,ye=32,ze=24,Ae=8,ge=255,Gn="SCREEN 2 (Graphics I)",Wn=["ADC","ADD","AND","BIT","CALL","CCF","CP","CPD","CPDR","CPI","CPIR","CPL","DAA","DEC","DI","DJNZ","EI","EX","EXX","HALT","IM","IN","INC","IND","INDR","INI","INIR","JP","JR","LD","LDD","LDDR","LDI","LDIR","NEG","NOP","OR","OTDR","OTIR","OUT","OUTD","OUTI","POP","PUSH","RES","RET","RETI","RETN","RL","RLA","RLC","RLCA","RLD","RR","RRA","RRC","RRCA","RRD","RST","SBC","SCF","SET","SLA","SLL","SRA","SRL","SUB","XOR"],Yn=["A","F","B","C","D","E","H","L","AF","BC","DE","HL","IXH","IXL","IYH","IYL","IX","IY","SP","PC","I","R","AF'"],Qn=["NZ","Z","NC","C","PO","PE","P","M"],Xn=[".ORG","ORG","END",".END",".EQU","EQU",".DB","DB",".BYTE","BYTE","DEFB",".DW","DW",".WORD","WORD","DEFW",".DS","DS",".BLOCK","BLOCK","DEFS",".DEFINE","DEFINE",".MACRO","MACRO",".ENDM","ENDM",".IF","IF",".ENDIF","ENDIF",".ELSE","ELSE",".INCLUDE","INCLUDE",".DEFM","DEFM",".ZILOG",".PHASE",".REPT",".ENDR",".SEARCH",".RANDOM",".ROM",".MEGAROM",".BASIC",".CAS",".WAV",".MSXDOS"],Kn=[{id:"pac_man_collection",name:"Pac-Man Tile Collection",code:`; Pac-Man Style Tile Collection System for MSX
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
POWER_MODE:         DB 0       ; Power-up mode active flag`}],Zn=[],Qe=8,Ne=15,xe=1;var ta;const qn=((ta=J.find(t=>t.index===Ne))==null?void 0:ta.hex)||J[15].hex;var aa;const Jn=((aa=J.find(t=>t.index===xe))==null?void 0:aa.hex)||J[1].hex,Ve=new Map(J.map(t=>[t.hex,t])),er=new Map(J.map(t=>[t.index,t])),tr=J[1],ar=32,lr=125,or=6,nr=31,rr=15,ir=["A","B","C"],sr=["1","2","3","4","5"],dr=["C-","C#","D-","D#","E-","F-","F#","G-","G#","A-","A#","B-"],cr=32,pr={q:{noteNameIndex:0,baseOctave:5},w:{noteNameIndex:1,baseOctave:5},e:{noteNameIndex:2,baseOctave:5},r:{noteNameIndex:3,baseOctave:5},t:{noteNameIndex:4,baseOctave:5},y:{noteNameIndex:5,baseOctave:5},u:{noteNameIndex:6,baseOctave:5},i:{noteNameIndex:7,baseOctave:5},o:{noteNameIndex:8,baseOctave:5},p:{noteNameIndex:9,baseOctave:5},"[":{noteNameIndex:10,baseOctave:5},"]":{noteNameIndex:11,baseOctave:5},a:{noteNameIndex:0,baseOctave:4},s:{noteNameIndex:1,baseOctave:4},d:{noteNameIndex:2,baseOctave:4},f:{noteNameIndex:3,baseOctave:4},g:{noteNameIndex:4,baseOctave:4},h:{noteNameIndex:5,baseOctave:4},j:{noteNameIndex:6,baseOctave:4},k:{noteNameIndex:7,baseOctave:4},l:{noteNameIndex:8,baseOctave:4},ñ:{noteNameIndex:9,baseOctave:4},";":{noteNameIndex:9,baseOctave:4},"'":{noteNameIndex:10,baseOctave:4},z:{noteNameIndex:0,baseOctave:3},x:{noteNameIndex:1,baseOctave:3},c:{noteNameIndex:2,baseOctave:3},v:{noteNameIndex:3,baseOctave:3},b:{noteNameIndex:4,baseOctave:3},n:{noteNameIndex:5,baseOctave:3},m:{noteNameIndex:6,baseOctave:3},",":{noteNameIndex:7,baseOctave:3},".":{noteNameIndex:8,baseOctave:3},2:{noteNameIndex:1,baseOctave:5},3:{noteNameIndex:3,baseOctave:5},5:{noteNameIndex:6,baseOctave:5},6:{noteNameIndex:8,baseOctave:5},7:{noteNameIndex:10,baseOctave:5}},_r={min:-2,max:2},hr=[{id:1,name:"Piano",volumeEnvelope:[15,14,13,11,9,7,5,3,2,1,0],toneEnvelope:[0],volumeLoop:255,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1},{id:2,name:"Electric Bass",volumeEnvelope:[15,14,13,12,11,10,9,8],toneEnvelope:[0],volumeLoop:3,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:12},{id:3,name:"Lead Vibrato",volumeEnvelope:[0,5,10,15,15,15,14,13,12],toneEnvelope:[0,1,2,1,0,-1,-2,-1],volumeLoop:4,toneLoop:0,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:13},{id:4,name:"Strings Pad",volumeEnvelope:[0,2,4,6,8,10,12,14,15,15,15],toneEnvelope:[0,0,1,1,0,0,-1,-1],volumeLoop:8,toneLoop:0,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:13},{id:5,name:"Kick Drum",volumeEnvelope:[15,13,10,7,4,2,0],toneEnvelope:[12,10,8,6,4,2,0],volumeLoop:255,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:0},{id:6,name:"Snare Drum",volumeEnvelope:[15,12,9,6,3,1,0],toneEnvelope:[0],volumeLoop:255,toneLoop:255,ayToneEnabled:!1,ayNoiseEnabled:!0,ayEnvelopeShape:0},{id:7,name:"Hi-Hat",volumeEnvelope:[12,10,8,6,4,2,0],toneEnvelope:[0],volumeLoop:255,toneLoop:255,ayToneEnabled:!1,ayNoiseEnabled:!0,ayEnvelopeShape:0},{id:8,name:"Arpeggio",volumeEnvelope:[15,15,14,14,13,13,12,12],toneEnvelope:[0,4,7,12,7,4,0],volumeLoop:0,toneLoop:0,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:10},{id:9,name:"Organ",volumeEnvelope:[15,15,15,15,15],toneEnvelope:[0],volumeLoop:0,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:13},{id:10,name:"Bell",volumeEnvelope:[15,14,12,10,8,6,4,3,2,1,0],toneEnvelope:[0,12,0],volumeLoop:255,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:0}],Aa=[{id:"bank_0",name:"Bank 0 - HUD/Fonts",enabled:!0,vramPatternStart:0,vramColorStart:8192,screenZone:{x:0,y:0,width:ye,height:8},charsetRangeStart:0,charsetRangeEnd:255,defaultFgColorIndex:15,defaultBgColorIndex:4,isLocked:!1,assignedTiles:{}},{id:"bank_1",name:"Bank 1 - Game Tileset",enabled:!0,vramPatternStart:2048,vramColorStart:10240,screenZone:{x:0,y:8,width:ye,height:8},charsetRangeStart:0,charsetRangeEnd:255,defaultFgColorIndex:2,defaultBgColorIndex:1,isLocked:!1,assignedTiles:{}},{id:"bank_2",name:"Bank 2 - Background/Status",enabled:!0,vramPatternStart:4096,vramColorStart:12288,screenZone:{x:0,y:16,width:ye,height:8},charsetRangeStart:0,charsetRangeEnd:255,defaultFgColorIndex:11,defaultBgColorIndex:6,isLocked:!1,assignedTiles:{}}],ur={isEnabled:!0,options:[{id:"start",label:"INICIAR PARTIDA",enabled:!0},{id:"continue",label:"CONTINUAR",enabled:!0},{id:"settings",label:"AJUSTES",enabled:!0},{id:"help",label:"AYUDA",enabled:!1}],keyMapping:{up:"ArrowUp",down:"ArrowDown",left:"ArrowLeft",right:"ArrowRight",fire1:" ",fire2:"m"},settings:{volume:12},continueScreen:{title:"CONTINUAR PARTIDA",prompt:"INTRODUCE TU CODIGO"},introScreen:{text:`EN EL ANO 2084, LA CORPORACION CYBERNETICA DOMINA EL MUNDO...

SOLO UN HEROE PUEDE DETENERLOS.`,backgroundAssetId:null},menuScreenAssetId:null,cursorSpriteAssetId:null,menuColors:{text:J[15].hex,background:J[4].hex,highlightText:J[11].hex,highlightBackground:J[5].hex,border:J[15].hex}},mr=ya,br="HELP_DOCS_SYSTEM_ASSET",fr=[{id:"getting_started",title:"Getting Started",articles:[{id:"welcome",title:"Welcome to MSX Retro IDE",content:`
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
            <li><strong>Toolbar (Screen Editor)</strong>: Contains layer selectors, zoom, active area inputs, HUD editor button, and export options. When 'Effects' layer is active, an "Add Effect Zone" button appears.</li>
          </ul>
          <h3>Effect Zones:</h3>
          <p>On the 'Effects' layer, you can add rectangular zones. Each zone has:</p>
          <ul>
            <li>A name.</li>
            <li>Position (x,y) and Size (width, height) in grid cells.</li>
            <li>An <strong>Effect Mask</strong>: A byte value where each bit represents a different effect (e.g., bit 0 for water, bit 1 for ice). You can toggle these effects using checkboxes in the Properties Panel.</li>
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
        `,tags:["gameflow","troubleshooting","problems"]}]}],yr=50,He=[{name:"Goal",asmName:"global_var_goal",constantPrefix:"GOAL_",type:"byte",description:"Current objective status",category:"objective",values:[{label:"Failure",value:0,asmConstant:"GOAL_FAILURE"},{label:"Completed",value:1,asmConstant:"GOAL_COMPLETED"},{label:"Partial",value:2,asmConstant:"GOAL_PARTIAL"}]},{name:"MissionStatus",asmName:"global_var_mission_status",constantPrefix:"MISSION_",type:"byte",description:"Current mission state",category:"objective",values:[{label:"NotStarted",value:0,asmConstant:"MISSION_NOT_STARTED"},{label:"Active",value:1,asmConstant:"MISSION_ACTIVE"},{label:"Completed",value:2,asmConstant:"MISSION_COMPLETED"},{label:"Failed",value:3,asmConstant:"MISSION_FAILED"}]},{name:"LevelCompleted",asmName:"global_var_level_completed",constantPrefix:"BOOL_",type:"byte",description:"Level completion flag",category:"objective",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"BossDefeated",asmName:"global_var_boss_defeated",constantPrefix:"BOOL_",type:"byte",description:"Boss defeated flag",category:"objective",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"AllItemsCollected",asmName:"global_var_all_items_collected",constantPrefix:"BOOL_",type:"byte",description:"All items collected flag",category:"objective",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"Score",asmName:"global_var_score",constantPrefix:"SCORE_",type:"word",description:"Current player score (0-65535)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"HiScore",asmName:"global_var_hi_score",constantPrefix:"HISCORE_",type:"word",description:"High score record (0-65535)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"ComboMultiplier",asmName:"global_var_combo_multiplier",constantPrefix:"COMBO_",type:"byte",description:"Combo multiplier (1x, 2x, 3x...)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"Coins",asmName:"global_var_coins",constantPrefix:"COINS_",type:"byte",description:"Coins collected (0-255)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"Gems",asmName:"global_var_gems",constantPrefix:"GEMS_",type:"byte",description:"Gems collected (0-255)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"Lives",asmName:"global_var_lives",constantPrefix:"LIVES_",type:"byte",description:"Remaining lives (0-255)",category:"player",values:[{label:"Custom Value",value:"number"}]},{name:"Health",asmName:"global_var_health",constantPrefix:"HEALTH_",type:"byte",description:"Current health (0-255)",category:"player",values:[{label:"Custom Value",value:"number"}]},{name:"Energy",asmName:"global_var_energy",constantPrefix:"ENERGY_",type:"byte",description:"Current energy/mana (0-255)",category:"player",values:[{label:"Custom Value",value:"number"}]},{name:"Shield",asmName:"global_var_shield",constantPrefix:"BOOL_",type:"byte",description:"Shield active flag",category:"player",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"HasKey",asmName:"global_var_has_key",constantPrefix:"BOOL_",type:"byte",description:"Has key item",category:"inventory",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"HasSword",asmName:"global_var_has_sword",constantPrefix:"BOOL_",type:"byte",description:"Has sword item",category:"inventory",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"HasMap",asmName:"global_var_has_map",constantPrefix:"BOOL_",type:"byte",description:"Has map item",category:"inventory",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"ItemCount",asmName:"global_var_item_count",constantPrefix:"ITEMS_",type:"byte",description:"Special items collected (0-255)",category:"inventory",values:[{label:"Custom Value",value:"number"}]},{name:"PowerUpActive",asmName:"global_var_powerup_active",constantPrefix:"POWERUP_",type:"byte",description:"Active power-up type",category:"inventory",values:[{label:"None",value:0,asmConstant:"POWERUP_NONE"},{label:"Speed",value:1,asmConstant:"POWERUP_SPEED"},{label:"Jump",value:2,asmConstant:"POWERUP_JUMP"},{label:"Invincible",value:3,asmConstant:"POWERUP_INVINCIBLE"}]},{name:"CurrentWorld",asmName:"global_var_current_world",constantPrefix:"WORLD_",type:"byte",description:"Current world number (1-8)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"CurrentLevel",asmName:"global_var_current_level",constantPrefix:"LEVEL_",type:"byte",description:"Current level number (0-255)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"CheckpointReached",asmName:"global_var_checkpoint",constantPrefix:"CHECKPOINT_",type:"byte",description:"Checkpoint reached (0-255)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"SecretFound",asmName:"global_var_secret_found",constantPrefix:"BOOL_",type:"byte",description:"Secret area found flag",category:"progress",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"DoorsUnlocked",asmName:"global_var_doors_unlocked",constantPrefix:"DOORS_",type:"byte",description:"Doors unlocked bitmask (0-255)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"TimeRemaining",asmName:"global_var_time_remaining",constantPrefix:"TIME_",type:"word",description:"Time remaining in seconds (0-65535)",category:"time",values:[{label:"Custom Value",value:"number"}]},{name:"TimeLimitActive",asmName:"global_var_time_limit_active",constantPrefix:"BOOL_",type:"byte",description:"Time limit active flag",category:"time",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"DayNightCycle",asmName:"global_var_day_night_cycle",constantPrefix:"TIME_",type:"byte",description:"Day/night cycle state (0-23)",category:"time",values:[{label:"Custom Value",value:"number"}]},{name:"DifficultyLevel",asmName:"global_var_difficulty",constantPrefix:"DIFFICULTY_",type:"byte",description:"Game difficulty level",category:"difficulty",values:[{label:"Easy",value:0,asmConstant:"DIFFICULTY_EASY"},{label:"Normal",value:1,asmConstant:"DIFFICULTY_NORMAL"},{label:"Hard",value:2,asmConstant:"DIFFICULTY_HARD"},{label:"Expert",value:3,asmConstant:"DIFFICULTY_EXPERT"}]},{name:"EnemiesDefeated",asmName:"global_var_enemies_defeated",constantPrefix:"ENEMIES_",type:"word",description:"Enemies defeated count (0-65535)",category:"special",values:[{label:"Custom Value",value:"number"}]},{name:"PerfectRun",asmName:"global_var_perfect_run",constantPrefix:"BOOL_",type:"byte",description:"Perfect run (no damage) flag",category:"special",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]}],Z=8,Ta=t=>{let e=t.toString(16).toUpperCase();return e.length===1&&(e="0"+e),e},gr=(t,e,a)=>{var u,i;if(!t.lineAttributes)return`;; ERROR: Tile ${e} is missing line attributes required for SCREEN 2 export.
`;const l=e.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let o=`;; Tile: ${e} (${t.width}x${t.height})
`;o+=`;; Structure: ${t.width/Z}x${t.height/Z} character blocks (8x8 pixels each)
`,o+=`;; Data format: ${a.toUpperCase()}

`;const n=t.width/Z,c=t.height/Z,r=h=>a==="hex"?`$${Ta(h)}`:h.toString(10),p=[],d=[];for(let h=0;h<c;h++)for(let b=0;b<n;b++){const m=`;; Character Block (${b}, ${h}) for ${l}`,s=[];for(let T=0;T<Z;T++){const S=h*Z+T;let f=0;if(t.lineAttributes[S]&&t.lineAttributes[S][b]){const _=t.lineAttributes[S][b].fg;for(let E=0;E<Z;E++){const I=b*Z+E;t.data[S]&&t.data[S][I]!==void 0&&t.data[S][I]===_&&(f|=1<<7-E)}}s.push(f)}const y=s.map(r).join(",");p.push({comment:`${m} - PATTERN Data (8 bytes):`,dataString:`DB ${y}`});const g=[];for(let T=0;T<Z;T++){const S=h*Z+T;let f=Ne<<4|xe;if(t.lineAttributes[S]&&t.lineAttributes[S][b]){const _=t.lineAttributes[S][b],E=((u=Ve.get(_.fg))==null?void 0:u.index)??Ne,I=((i=Ve.get(_.bg))==null?void 0:i.index)??xe;f=E<<4|I}g.push(f)}const A=g.map(r).join(",");d.push({comment:`${m} - COLOR Attribute Data (8 bytes - FG|BG):`,dataString:`DB ${A}`})}return o+=`;; --- PATTERN DATA ---
`,p.length>0?(o+=`${l}_PATTERN_DATA:
`,p.forEach(h=>{o+=`${h.comment}
`,o+=`    ${h.dataString}
`})):o+=`;; No pattern data generated.
`,o+=`
`,o+=`;; --- COLOR ATTRIBUTE DATA ---
`,d.length>0?(o+=`${l}_COLOR_DATA:
`,d.forEach(h=>{o+=`${h.comment}
`,o+=`    ${h.dataString}
`})):o+=`;; No color attribute data generated.
`,o+=`
;; End of Tile Data for ${l}
`,o},Er=(t,e,a,l)=>{const o=Math.max(1,t/Qe);return Array(e).fill(null).map(()=>Array(o).fill(null).map(()=>({fg:a,bg:l})))},la=(t,e)=>{var c,r,p,d;const a=[],l=t.width/Z,o=t.height/Z,n=e==="SCREEN 2 (Graphics I)";for(let u=0;u<o;u++)for(let i=0;i<l;i++)for(let h=0;h<Z;h++){const b=u*Z+h;let m=0,s;n&&t.lineAttributes&&t.lineAttributes[b]&&t.lineAttributes[b][i]&&(s=t.lineAttributes[b][i].fg);for(let y=0;y<Z;y++){const g=i*Z+y,A=(c=t.data[b])==null?void 0:c[g];if(A!==void 0){let T=!1;n&&s?T=A===s:n||(T=A!==De[0].hex&&A!==((d=(p=(r=t.lineAttributes)==null?void 0:r[0])==null?void 0:p[0])==null?void 0:d.bg)),T&&(m|=1<<7-y)}}a.push(m)}return new Uint8Array(a)},Ce=(t,e)=>{var n,c;const a=t.length;if(a===0)return[];const l=((n=t[0])==null?void 0:n.length)||0;if(l===0)return[[]];const o=t.map(r=>[...r]);for(let r=0;r<a;r++)for(let p=0;p<l;p++){const d=Math.floor(p/Qe),u=(c=e[r])==null?void 0:c[d],i=o[r][p];u&&i!==u.fg&&i!==u.bg&&(o[r][p]=u.fg)}return o},Sr=(t,e,a)=>{if(t.length<2)return t;const o=t.slice(1);return o.push([...t[0]]),a==="SCREEN 2 (Graphics I)"&&e?Ce(o,e):o},Ar=(t,e,a)=>{const l=t.length;if(l<2)return t;const o=t.slice(0,l-1);return o.unshift([...t[l-1]]),a==="SCREEN 2 (Graphics I)"&&e?Ce(o,e):o},Tr=(t,e,a)=>{if(t.length===0)return[];const l=t.map(o=>{if(o.length<2)return[...o];const n=o.slice(1);return n.push(o[0]),n});return a==="SCREEN 2 (Graphics I)"&&e?Ce(l,e):l},Cr=(t,e,a)=>{if(t.length===0)return[];const l=t.map(o=>{const n=o.length;if(n<2)return[...o];const c=o.slice(0,n-1);return c.unshift(o[n-1]),c});return a==="SCREEN 2 (Graphics I)"&&e?Ce(l,e):l},Ir=(t,e,a)=>{if(t.length===0)return[];const l=t.map(o=>[...o].reverse());return a==="SCREEN 2 (Graphics I)"&&e?Ce(l,e):l},vr=(t,e,a)=>{if(t.length===0)return[];const l=[...t].reverse();return a==="SCREEN 2 (Graphics I)"&&e?Ce(l,e):l},oa=t=>{var o,n,c;if(!t.lineAttributes)return null;const e=[],a=t.width/Z,l=t.height/Z;for(let r=0;r<l;r++)for(let p=0;p<a;p++)for(let d=0;d<Z;d++){const u=r*Z+d;let i=Ne<<4|xe;const h=(o=t.lineAttributes[u])==null?void 0:o[p];if(h){const b=((n=Ve.get(h.fg))==null?void 0:n.index)??Ne,m=((c=Ve.get(h.bg))==null?void 0:c.index)??xe;i=b<<4|m}e.push(i)}return new Uint8Array(e)},wr=t=>{const e=[];t.frames.forEach(l=>{var o,n,c,r,p;for(let d=0;d<t.spritePalette.length;d++){const u=t.spritePalette[d];if(u===t.backgroundColor)continue;let i=!1;const h=[],b=t.size.width,m=t.size.height;if(b===16&&m===16){for(let s=0;s<8;s++){let y=0;for(let g=0;g<8;g++)((o=l.data[s])==null?void 0:o[g])===u&&(y|=1<<7-g,i=!0);h.push(y)}for(let s=8;s<16;s++){let y=0;for(let g=0;g<8;g++)((n=l.data[s])==null?void 0:n[g])===u&&(y|=1<<7-g,i=!0);h.push(y)}for(let s=0;s<8;s++){let y=0;for(let g=0;g<8;g++)((c=l.data[s])==null?void 0:c[8+g])===u&&(y|=1<<7-g,i=!0);h.push(y)}for(let s=8;s<16;s++){let y=0;for(let g=0;g<8;g++)((r=l.data[s])==null?void 0:r[8+g])===u&&(y|=1<<7-g,i=!0);h.push(y)}}else for(let s=0;s<m;s++)for(let y=0;y<Math.ceil(b/8);y++){let g=0;for(let A=0;A<8;A++){const T=y*8+A;T<b&&((p=l.data[s])==null?void 0:p[T])===u&&(g|=1<<7-A,i=!0)}h.push(g)}i&&e.push(h)}});const a=e.flat();return new Uint8Array(a)},Nt=t=>t.map(e=>[...e].reverse()),xt=t=>[...t].reverse(),Ca=/_(left|right|up|down)$/i,na=t=>{if(!t)return;const e=t.trim().toLowerCase();if(e==="left"||e==="right"||e==="up"||e==="down")return e},Ia=t=>{const e=t.match(Ca);return e?{baseName:t.slice(0,-e[0].length),suffixDirection:na(e[1])}:{baseName:t}},va=(t,e,a,l)=>({...t,id:`${t.id}__auto_${a}`,name:e,facingDirection:a,frames:t.frames.map((o,n)=>({...o,id:`${o.id||`f${n}`}_${a}_auto`,data:l(o.data)}))}),et=(t,e,a,l)=>{if(!e)return;(e===e.toLowerCase()?[e]:[e,e.toLowerCase()]).forEach(n=>{const c=t[n];if(c===void 0){t[n]=a;return}c!==a&&l.push(`Name alias collision for "${n}" between indexes ${c} and ${a}. Keeping first mapping.`)})},dt=t=>{const e=[],a=new Set,l=[],o=new Map,n=(i,h,b)=>{if(!a.has(i))return i;if(!a.has(h))return e.push(`Name "${i}" already exists. Using fallback "${h}" for ${b}.`),h;let m=1,s=`${i}_${m}`;for(;a.has(s);)m+=1,s=`${i}_${m}`;return e.push(`Name "${i}" already exists. Using "${s}" for ${b}.`),s};t.forEach((i,h)=>{const b=i.name||`sprite_${h}`,{baseName:m,suffixDirection:s}=Ia(b),y=na(i.facingDirection);y&&s&&y!==s&&e.push(`Sprite "${b}" has suffix "${s}" but facing "${y}". Using facing direction.`);const g=y||s,A=s?m:b,T=g?`${A}_${g}`:b,S=n(T,b,`sprite "${b}"`),f=new Set;b!==S&&f.add(b);const E={sprite:{...i,name:S,facingDirection:g||i.facingDirection},baseName:A,direction:g,aliases:f};if(l.push(E),a.add(S),g){const I=o.get(A)||{};I[g]===void 0?(I[g]=l.length-1,o.set(A,I)):e.push(`Duplicate directional sprite for "${A}_${g}". Keeping first occurrence.`)}}),o.forEach((i,h)=>{const b=(m,s,y,g)=>{if(s===void 0||i[m]!==void 0)return;const A=`${h}_${m}`;if(a.has(A)){e.push(`Cannot auto-generate "${A}" because the name already exists.`);return}const T=l[s],f={sprite:va(T.sprite,A,m,y),baseName:h,direction:m,aliases:new Set};l.push(f),i[m]=l.length-1,a.add(A),e.push(`Auto-generated "${A}" from "${T.sprite.name}" using ${g}.`)};i.right!==void 0&&i.left===void 0?b("left",i.right,Nt,"horizontal mirror"):i.left!==void 0&&i.right===void 0&&b("right",i.left,Nt,"horizontal mirror"),i.up!==void 0&&i.down===void 0?b("down",i.up,xt,"vertical mirror"):i.down!==void 0&&i.up===void 0&&b("up",i.down,xt,"vertical mirror")});const c={};l.forEach((i,h)=>{et(c,i.sprite.name,h,e),et(c,i.sprite.id,h,e)}),l.forEach((i,h)=>{i.aliases.forEach(b=>et(c,b,h,e))});const r=l.map((i,h)=>h),p=l.map((i,h)=>h),d=l.map((i,h)=>h),u=l.map((i,h)=>h);return l.forEach((i,h)=>{const b=o.get(i.baseName);b&&(b.left!==void 0&&(r[h]=b.left),b.right!==void 0&&(p[h]=b.right),b.up!==void 0&&(d[h]=b.up),b.down!==void 0&&(u[h]=b.down))}),{sprites:l.map(i=>i.sprite),nameToIndex:c,directionalLookupTables:{left:r,right:p,up:d,down:u},warnings:e}},wa=t=>{let e=t.toString(16).toUpperCase();return e.length===1&&(e="0"+e),e},La=(t,e,a,l,o,n,c="hex",r)=>{var b,m,s,y,g;const d=t.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let u=`;; ---- Sprite Frame: ${t} ----
`;u+=`;; Size: ${o}x${n}
`;let i=0;const h=Array.isArray(r)&&r.length>0?r:a.map((A,T)=>T).filter(A=>{const T=a[A];return!!T&&T!==l});for(const A of h){const T=a[A];if(!T||T===l)continue;const S=[];if(o===16&&n===16){for(let f=0;f<8;f++){let _=0;for(let E=0;E<8;E++){const I=E;((b=e[f])==null?void 0:b[I])===T&&(_|=1<<7-E)}S.push(_)}for(let f=8;f<16;f++){let _=0;for(let E=0;E<8;E++){const I=E;((m=e[f])==null?void 0:m[I])===T&&(_|=1<<7-E)}S.push(_)}for(let f=0;f<8;f++){let _=0;for(let E=0;E<8;E++){const I=8+E;((s=e[f])==null?void 0:s[I])===T&&(_|=1<<7-E)}S.push(_)}for(let f=8;f<16;f++){let _=0;for(let E=0;E<8;E++){const I=8+E;((y=e[f])==null?void 0:y[I])===T&&(_|=1<<7-E)}S.push(_)}}else for(let f=0;f<n;f++)for(let _=0;_<Math.ceil(o/8);_++){let E=0;for(let I=0;I<8;I++){const C=_*8+I;C<o&&((g=e[f])==null?void 0:g[C])===T&&(E|=1<<7-I)}S.push(E)}i+=1,u+=`${d}_LAYER${A}: ; Brush Color Index ${A} (Actual Color: ${T})
`,o%8!==0&&(u+=`;; WARNING: Sprite width ${o} is not a multiple of 8. Bitmask generation might be problematic for standard VDP.
`);for(let f=0;f<S.length;f+=16){const E=S.slice(f,f+16).map(I=>c==="hex"?`#${wa(I)}`:I.toString());u+=`    DB ${E.join(",")}
`}u+=`
`}return i===0&&(u+=`;; NO DRAWABLE LAYERS EXPORTED for ${t} - Palette may match background color.
`),u+=`;; ---- End of Frame: ${t} ----

`,u},Ra=(t,e="hex",a)=>{let l=`;; Sprite: ${t.name}
`;l+=`;; Total Frames: ${t.frames.length}
`,l+=`;; Size: ${t.size.width}x${t.size.height}
`,l+=`;; Background Color (not exported as a layer): ${t.backgroundColor}
`,l+=`;; Drawable Palette (Hex): C0=${t.spritePalette[0]}, C1=${t.spritePalette[1]}, C2=${t.spritePalette[2]}, C3=${t.spritePalette[3]}

`;const o=a!==void 0?`_${a}`:"",n=t.name+o,c=n.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();l+=`SPRITE_${c}_WIDTH     EQU ${t.size.width}
`,l+=`SPRITE_${c}_HEIGHT    EQU ${t.size.height}
`,l+=`SPRITE_${c}_FRAMES    EQU ${t.frames.length}

`;const r=t.spritePalette.map((p,d)=>d).filter(p=>{const d=t.spritePalette[p];return!d||d===t.backgroundColor?!1:t.frames.some(u=>{var i;return(i=u==null?void 0:u.data)==null?void 0:i.some(h=>h==null?void 0:h.some(b=>b===d))})});return t.frames.forEach((p,d)=>{l+=La(`${n}_F${d}`,p.data,t.spritePalette,t.backgroundColor,t.size.width,t.size.height,e,r)}),l},tt=16,ra="SCREEN 2 (Graphics I)",Da="SCREEN 5 (Graphics III)",fe=8,Na={pixelWidth:ye*tt,pixelHeight:ze*tt,widthTiles:ye,heightTiles:ze,baseTileSize:tt},Mt={[ra]:{pixelWidth:ye*Ae,pixelHeight:ze*Ae,widthTiles:ye,heightTiles:ze,baseTileSize:Ae},[Da]:{pixelWidth:256,pixelHeight:212,widthTiles:32,heightTiles:27,baseTileSize:Ae},"SCREEN 0 (Text 40)":{pixelWidth:240,pixelHeight:192,widthTiles:40,heightTiles:24,baseTileSize:fe},"SCREEN 1 (Text 32)":{pixelWidth:256,pixelHeight:192,widthTiles:32,heightTiles:24,baseTileSize:fe},"SCREEN 3 (Multicolor)":{pixelWidth:256,pixelHeight:192,widthTiles:32,heightTiles:24,baseTileSize:fe},"SCREEN 4 (Graphics II)":{pixelWidth:256,pixelHeight:192,widthTiles:32,heightTiles:24,baseTileSize:fe},"SCREEN 6 (Graphics IV)":{pixelWidth:512,pixelHeight:212,widthTiles:64,heightTiles:27,baseTileSize:fe},"SCREEN 7 (Graphics V)":{pixelWidth:512,pixelHeight:212,widthTiles:64,heightTiles:27,baseTileSize:fe},"SCREEN 8 (Graphics VI)":{pixelWidth:256,pixelHeight:212,widthTiles:32,heightTiles:27,baseTileSize:fe}};function Lr(t){const e=typeof t=="string"?t.trim():"";return e&&Mt[e]?Mt[e]:Na}const Ge=t=>t===ra,xa=t=>Ge(t)?J:De,Ma=(t,e)=>{const a=xa(e);if(t===void 0||t<0||t>=a.length)return Ge(e)?J[1].hex:De[4].hex;const l=a[t];return(l==null?void 0:l.hex)??(Ge(e)?J[1].hex:De[4].hex)},Rr=(t,e,a,l)=>{var h;const o=t.layers.background,n=t.activeAreaX??0,c=t.activeAreaY??0,r=t.activeAreaWidth??t.width,p=t.activeAreaHeight??t.height,d=[];let u=0;const i=new Map;for(let b=0;b<p;b++){const m=c+b;for(let s=0;s<r;s++){const y=n+s;if(m>=o.length||y>=((h=o[m])==null?void 0:h.length)){d.push(ge);continue}const g=o[m][y];if(!g||!g.tileId)d.push(ge);else{let A=ge;const T=e.find(S=>S.id===g.tileId);if(l==="SCREEN 2 (Graphics I)"&&a&&T){let S=!1,f={tileId:g.tileId,position:{x:y,y:m},attempts:[],banksReceived:a.length};typeof globalThis.screenUtils_firstTileLogged>"u"&&(console.log("🔍 First tile structure check:",{tileId:g.tileId,position:{x:y,y:m},banksCount:a.length,banks:a.map(_=>({name:_.name,assignedTileIds:Object.keys(_.assignedTiles||{}),hasThisTile:!!(_.assignedTiles&&_.assignedTiles[g.tileId]),assignedTilesType:typeof _.assignedTiles,assignedTilesSample:_.assignedTiles?Object.entries(_.assignedTiles).slice(0,2):[]}))}),globalThis.screenUtils_firstTileLogged=!0);for(const _ of a)if((_.enabled??!0)&&_.assignedTiles[g.tileId]){const E=_.assignedTiles[g.tileId].charCode,I=Math.ceil(T.width/Ae),C=g.subTileX||0,w=g.subTileY||0;A=E+w*I+C;const D=A>=_.charsetRangeStart&&A<=_.charsetRangeEnd;if(f.attempts.push({bankName:_.name,baseCharCode:E,calculated:A,range:`${_.charsetRangeStart}-${_.charsetRangeEnd}`,inRange:D}),D){S=!0;break}else A=ge}else f.attempts.push({bankName:_.name,reason:"Tile not assigned to this bank"});S||(console.warn("⚠️ Tile not found in valid range:",f),A=ge)}else if(l!=="SCREEN 2 (Graphics I)"){const S=`${g.tileId}_${g.subTileX??0}_${g.subTileY??0}`;i.has(S)?A=i.get(S):u>255?A=ge:(i.set(S,u),A=u++)}d.push(A)}}}return new Uint8Array(d)},Pa=(t,e,a,l,o,n="hex")=>{const r=t.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let p=`;; MAP: ${t} (${e}x${a} tiles)
`;p+=`;; Total size: ${l.length} bytes

`,o.length>0&&(p+=`;; --- TILE INDEX REFERENCES for ${r} ---
`,p+=o.join(`
`)+`

`),p+=`SCREEN_${r}_WIDTH     EQU ${e}
`,p+=`SCREEN_${r}_HEIGHT    EQU ${a}
`,p+=`SCREEN_${r}_SIZE      EQU ${l.length}

`,p+=`SCREEN_${r}_LAYOUT:
`;for(let d=0;d<l.length;d+=16){const i=l.slice(d,d+16).map(h=>n==="hex"?`#${h.toString(16).padStart(2,"0").toUpperCase()}`:h.toString());p+=`    DB ${i.join(",")}
`}return p},ka=(t,e,a,l,o="hex")=>{const c=t.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let r=`;; BEHAVIOR MAP: ${t} (${e}x${a} tiles)
`;r+=`;; Total size: ${l.length} bytes (Map IDs 0-255)
`,r+=`;; Data format: ${o.toUpperCase()}

`,r+=`BEHAVIOR_${c}_WIDTH     EQU ${e}
`,r+=`BEHAVIOR_${c}_HEIGHT    EQU ${a}
`,r+=`BEHAVIOR_${c}_SIZE      EQU ${l.length}

`,r+=`BEHAVIOR_${c}_DATA:
`;const p=d=>o==="hex"?`#${d.toString(16).padStart(2,"0").toUpperCase()}`:d.toString(10);for(let d=0;d<l.length;d+=16){const i=l.slice(d,d+16).map(p);r+=`    DB ${i.join(",")}
`}return r+=`
;; End of Behavior Map Data for ${t}
`,r},Dr=(t,e)=>{if(t.width!==e.width||t.height!==e.height||t.data.length!==e.data.length)return!1;for(let a=0;a<t.height;a++){if(t.data[a].length!==e.data[a].length)return!1;for(let l=0;l<t.width;l++)if(t.data[a][l]!==e.data[a][l])return!1}if(t.lineAttributes&&e.lineAttributes){if(t.lineAttributes.length!==e.lineAttributes.length)return!1;for(let a=0;a<t.lineAttributes.length;a++){if(t.lineAttributes[a].length!==e.lineAttributes[a].length)return!1;for(let l=0;l<t.lineAttributes[a].length;l++)if(t.lineAttributes[a][l].fg!==e.lineAttributes[a][l].fg||t.lineAttributes[a][l].bg!==e.lineAttributes[a][l].bg)return!1}}else if(t.lineAttributes!==e.lineAttributes)return!1;return JSON.stringify(t.logicalProperties)===JSON.stringify(e.logicalProperties)};function Nr(t,e,a,l,o,n,c){const{data:r,width:p,height:d,lineAttributes:u}=t;if(!r||d===0||p===0)return"";const i=document.createElement("canvas");i.width=n,i.height=n;const h=i.getContext("2d");if(!h)return"";h.imageSmoothingEnabled=!1;const b=(e??0)*n,m=(a??0)*n;for(let g=0;g<n;g++)for(let A=0;A<n;A++){const T=b+A,S=m+g;if(S>=0&&S<d&&T>=0&&T<p){let f=r[S][T];if(c==="SCREEN 2 (Graphics I)"&&u&&u[S]){const _=Math.floor(T/Qe),E=u[S][_];E&&f!==E.fg&&f!==E.bg&&(f=E.fg)}h.fillStyle=f,h.fillRect(A,g,1,1)}}if(i.width===l&&i.height===o)return i.toDataURL();const s=document.createElement("canvas");s.width=l,s.height=o;const y=s.getContext("2d");return y?(y.imageSmoothingEnabled=!1,y.drawImage(i,0,0,l,o),s.toDataURL()):i.toDataURL()}function xr(t,e,a){var n;if(!t||a===0||e===0)return"";const l=document.createElement("canvas");l.width=e,l.height=a;const o=l.getContext("2d");if(!o)return"";o.imageSmoothingEnabled=!1;for(let c=0;c<a;c++)for(let r=0;r<e;r++){const p=(n=t[c])==null?void 0:n[r];p&&p!=="rgba(0,0,0,0)"&&(o.fillStyle=p,o.fillRect(r,c,1,1))}return l.toDataURL()}const Mr=(t,e,a,l,o,n,c)=>{var i,h;const r=Ge(l);t.width=e.width*o,t.height=e.height*o;const p=t.getContext("2d");if(!p)return;p.imageSmoothingEnabled=!1;const d=Ma(e.backgroundColor,l);p.fillStyle=d,p.fillRect(0,0,t.width,t.height);const u=e.layers.background;for(let b=0;b<e.height;b++)for(let m=0;m<e.width;m++){const s=(i=u[b])==null?void 0:i[m];if(!(s!=null&&s.tileId))continue;const y=a.find(C=>C.id===s.tileId);if(!y)continue;const{data:g,width:A,height:T,lineAttributes:S}=y;if(!g)continue;const f=s.subTileX??0,_=s.subTileY??0,E=f*o,I=_*o;for(let C=0;C<o;C++)for(let w=0;w<o;w++){const D=E+w,N=I+C;if(N<T&&D<A){let M=(h=g[N])==null?void 0:h[D];if(M===void 0)continue;if(r&&S&&S[N]){const V=Math.floor(D/Qe),Q=S[N][V];Q&&M!==Q.fg&&M!==Q.bg&&(M=Q.fg)}p.fillStyle=M,p.fillRect(m*o+w,b*o+C,1,1)}}}};function oe(t){const e=typeof t=="string"?t.trim():"";if(!e)return"";const a=He.find(l=>l.name.toLowerCase()===e.toLowerCase());return a?a.name:e}function Le(t){return`global_var_${oe(t).replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`}function Re(t){return`${oe(t).replace(/[^A-Za-z0-9]/g,"_").toUpperCase()}_`}function Oa(t){const e=t.find(c=>c.type==="globalvariables");if(!e||!e.data)return[...He];const a=e.data.customVariables||[],l=new Map;He.forEach(c=>{const r=oe(c.name);l.set(r,{...c,name:r})}),a.forEach(c=>{const r=oe(c.name);r&&l.set(r,{...c,name:r,asmName:Le(r),constantPrefix:c.constantPrefix||Re(r)})});const o=He.map(c=>oe(c.name)),n=[];return o.forEach(c=>{const r=l.get(c);r&&(n.push(r),l.delete(c))}),l.forEach(c=>{n.push(c)}),n}function Pr(t){const e=t.find(o=>o.type==="globalvariables");if(!e||!e.data)return[];const a=e.data.customVariables||[],l=new Map;return a.forEach(o=>{const n=oe(o.name);n&&l.set(n,{...o,name:n,asmName:Le(n),constantPrefix:o.constantPrefix||Re(n)})}),Array.from(l.values())}function Ua(t){const e=Oa(t);if(e.length===0)return[];const a=[],l=t.filter(m=>m.type==="screenmap");l.forEach(m=>{var y,g;(((g=(y=m.data)==null?void 0:y.layers)==null?void 0:g.entities)||[]).forEach(A=>{var T,S;(S=(T=A.components)==null?void 0:T.Behavior)!=null&&S.behaviorCode&&a.push(A.components.Behavior.behaviorCode)})});const o=t.find(m=>m.type==="gameflow"),n=new Set,c=new Set,r=new Set,p=new Set;if(o!=null&&o.data){const m=o.data;m.nodes&&Array.isArray(m.nodes)&&m.nodes.forEach(s=>{var y;if(s.type==="StateMachine"&&((y=s.data)!=null&&y.customCode)&&a.push(s.data.customCode),s.type==="IfThenElse"&&s.variableName){const g=oe(s.variableName);g&&n.add(g)}s.type==="Globals"&&s.variables&&Array.isArray(s.variables)&&s.variables.forEach(g=>{if(g.variableName){const A=oe(g.variableName);A&&c.add(A)}})})}t.filter(m=>m.type==="componentdefinition").forEach(m=>{const s=m.data;s.customCode&&a.push(s.customCode)});const u=m=>{if(typeof m!="string")return;const s=oe(m);s&&r.add(s)};l.forEach(m=>{var g,A,T,S;(((A=(g=m.data)==null?void 0:g.layers)==null?void 0:A.entities)||[]).forEach(f=>{var _,E;u((E=(_=f==null?void 0:f.componentOverrides)==null?void 0:_.comp_tile_collector)==null?void 0:E.targetVariable)}),(((S=(T=m.data)==null?void 0:T.hudConfiguration)==null?void 0:S.elements)||[]).forEach(f=>{const _=String((f==null?void 0:f.type)||"").toLowerCase();_==="score"?p.add(oe("Score")):_==="lives"&&p.add(oe("Lives"))})}),t.filter(m=>m.type==="entitytemplate").forEach(m=>{var g,A;const s=m.data,y=(g=s==null?void 0:s.components)==null?void 0:g.find(T=>T.definitionId==="comp_tile_collector");u((A=y==null?void 0:y.defaultValues)==null?void 0:A.targetVariable)});const h=[],b=new Set;return e.forEach(m=>{const s=oe(m.name),y=a.some(f=>new RegExp(`\\b${m.asmName}\\b`,"i").test(f)),g=n.has(s),A=c.has(s),T=r.has(s),S=p.has(s);(y||g||A||T||S)&&!b.has(s)&&(h.push(m),b.add(s))}),c.forEach(m=>{const s=oe(m);if(!b.has(s)){const y=Le(s);h.push({name:s,asmName:y,constantPrefix:Re(s),type:"8bit",description:"Auto-generated variable from Globals node",values:[{label:"0",value:0}],category:"special"}),b.add(s)}}),n.forEach(m=>{const s=oe(m);if(!b.has(s)){const y=Le(s);h.push({name:s,asmName:y,constantPrefix:Re(s),type:"8bit",description:"Auto-generated variable from IfThenElse node",values:[{label:"0",value:0}],category:"special"}),b.add(s)}}),r.forEach(m=>{const s=oe(m);if(!b.has(s)){const y=Le(s);h.push({name:s,asmName:y,constantPrefix:Re(s),type:"8bit",description:"Auto-generated variable from Tile Collector",values:[{label:"0",value:0}],category:"special"}),b.add(s)}}),h}const j={AND:"AND",OR:"OR",XOR:"XOR",NOT:"NOT",KEY_PRESSED:"KEY_PRESSED",KEY_RELEASED:"KEY_RELEASED",TIME_OUT:"TIME_OUT",CAN_MOVE_DIRECTION:"CAN_MOVE_DIRECTION",HAS_COLLISION:"HAS_COLLISION",PATH_CLEAR:"PATH_CLEAR",ON_WALL_COLLISION:"ON_WALL_COLLISION",HAS_DEADLY_TILE_COLLISION:"HAS_DEADLY_TILE_COLLISION",ANIMATION_COMPLETE:"ANIMATION_COMPLETE",KEY_AND_MOVEMENT:"KEY_AND_MOVEMENT",VARIABLE_COMPARE:"VARIABLE_COMPARE"},R={NONE:"NONE",SET_POSITION:"SET_POSITION",MOVE_BY:"MOVE_BY",SET_VELOCITY:"SET_VELOCITY",APPLY_FORCE:"APPLY_FORCE",CHANGE_SPRITE:"CHANGE_SPRITE",PLAY_ANIMATION:"PLAY_ANIMATION",SET_ANIMATION_SPEED:"SET_ANIMATION_SPEED",TOGGLE_ANIMATION:"TOGGLE_ANIMATION",PLAY_SOUND:"PLAY_SOUND",PLAY_MUSIC:"PLAY_MUSIC",MUTE_MUSIC:"MUTE_MUSIC",STOP_MUSIC:"STOP_MUSIC",SET_VARIABLE:"SET_VARIABLE",INCREMENT_VARIABLE:"INCREMENT_VARIABLE",DECREMENT_VARIABLE:"DECREMENT_VARIABLE",SET_COMPONENT_PROPERTY:"SET_COMPONENT_PROPERTY",WAIT:"WAIT",GOTO_STATE:"GOTO_STATE",DESTROY_ENTITY:"DESTROY_ENTITY",SPAWN_ENTITY:"SPAWN_ENTITY",GET_RANDOM_ENTITY_POSITION:"GET_RANDOM_ENTITY_POSITION",CHANGE_GAME_FLOW_NODE:"CHANGE_GAME_FLOW_NODE",DECREASE_LIVES:"DECREASE_LIVES",INCREASE_LIVES:"INCREASE_LIVES",RESPAWN_PLAYER:"RESPAWN_PLAYER",BREAK_TILE:"BREAK_TILE",REPLACE_TILE:"REPLACE_TILE",RND:"RND",POINT_AT:"POINT_AT",ADD_VARIABLES:"ADD_VARIABLES",SUBTRACT_VARIABLES:"SUBTRACT_VARIABLES",MULTIPLY_VARIABLES:"MULTIPLY_VARIABLES",DIVIDE_VARIABLES:"DIVIDE_VARIABLES",MODULO_VARIABLES:"MODULO_VARIABLES",ASSIGN_VARIABLE:"ASSIGN_VARIABLE",DISABLE_INPUT:"DISABLE_INPUT",ENABLE_INPUT:"ENABLE_INPUT"};function ct(t,e){const a=e.filter(v=>v.type==="componentdefinition").map(v=>v.data),l=e.filter(v=>v.type==="entitytemplate").map(v=>v.data),o=e.filter(v=>v.type==="sprite").map(v=>v.data),n=e.filter(v=>v.type==="sound").map(v=>{var x,U;return{...v.data,id:((x=v.data)==null?void 0:x.id)||v.id,name:((U=v.data)==null?void 0:U.name)||v.name}}),c=[],r={};e.filter(v=>v.type==="track").forEach(v=>{const x=v.data;if(!x)return;const U=x.soundChip||"PSG";if(U!=="PSG")return;const P={...x,soundChip:U,id:x.id||v.id,name:x.name||v.name},F=c.length;c.push(P),r[v.id]=F,r[P.id]=F});const p=e.filter(v=>v.type==="tile").map(v=>v.data),d=e.filter(v=>v.type==="screenmap").map(v=>v.data),u=e.filter(v=>v.type==="worldmap").map(v=>v.data),i=e.filter(v=>v.type==="statemachine").map(v=>v.data),h=[],b=new Set,m=(v,x,U)=>{var B,ee;if(v!=null&&v.id)return String(v.id);const P=((B=v==null?void 0:v.position)==null?void 0:B.x)??"",F=((ee=v==null?void 0:v.position)==null?void 0:ee.y)??"",X=(v==null?void 0:v.entityTemplateId)??"",pe=(v==null?void 0:v.name)??"";return`${(x==null?void 0:x.id)??`screen_${U}`}|${X}|${pe}|${P}|${F}`},s=(v,x,U)=>{if(!v||typeof v!="object")return;const P=m(v,x,U);b.has(P)||(b.add(P),h.push({...v,screenAssetId:v.screenAssetId||(x==null?void 0:x.id),screenIndex:typeof v.screenIndex=="number"?v.screenIndex:U}))};d.forEach((v,x)=>{var U;(U=v.layers)!=null&&U.entities&&Array.isArray(v.layers.entities)&&v.layers.entities.forEach(P=>s(P,v,x)),v.entities&&Array.isArray(v.entities)&&v.entities.forEach(P=>s(P,v,x))});const y=e.find(v=>v.type==="gameflow"),g=y==null?void 0:y.data,A=h.length>0,T=a.length>0||A,S=d.length>1,f=o.length>0,_=p.length>0,E=d.length>0,I=a.length>0,C=!!g,w=e.some(v=>v.type==="font"),D=o.some(v=>v.frames.length>1),N=d.some(v=>v.layers.collision.some(x=>x.some(U=>U!==null))),M=l.some(v=>v.name.toLowerCase().includes("menu")),V=[];a.forEach(v=>{v.name.toLowerCase().includes("state")&&V.push(v.name.replace(/[^a-zA-Z0-9]/g,"").toUpperCase())});const Q=Ua(e);return{projectName:t,components:a,templates:l,sprites:o,sounds:n,tracks:c,trackIndexByAssetId:r,tiles:p,screenMaps:d,screens:d,worldmaps:u,entities:h,fonts:e.filter(v=>v.type==="font"),gameFlow:g,stateMachines:i,hasECS:T,hasMultipleScreens:S,hasSprites:f,hasTiles:_,hasScreens:E,hasEntities:A,hasComponents:I,hasGameFlow:C,hasMenus:M,hasFonts:w,hasAnimations:D,hasCollisions:N,hasMenuSystem:M,customStates:V,globalVariables:Q}}const Fa=t=>{if(!t.hasECS)return`    ; No ECS system - basic entity updates
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
    
    ; Update entity based on components`;return t.components.forEach((a,l)=>{e+=`
    ; Update ${a.name} component
    CALL UPDATE_${a.name.toUpperCase().replace(/[^A-Z0-9]/g,"_")}`}),e+=`
    
entity_update_skip:
    POP HL
    LD DE, 16           ; Entity structure size
    ADD HL, DE
    POP BC
    DJNZ entity_update_loop
    RET`,e},$a=t=>{if(!t.hasSprites)return`    ; No sprites to update
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
    RET`,e},Ba=t=>t.hasCollisions?`    ; Check player collision with environment
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
    RET`,ja=t=>{let e=`    ; Read MSX joystick/keyboard input
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
    RET`,e},Ha=t=>t.hasMenuSystem?`    ; Update menu graphics and cursor
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
    RET`,za=t=>{if(t.customStates.length===0)return"; No custom states detected";let e=`; Custom state handlers for project-specific logic
`;return t.customStates.forEach(a=>{e+=`
logic_${a.toLowerCase()}:
    ; Custom logic for ${a} state
    ; TODO: Implement ${a} specific logic
    RET
`}),e},Va=[{marker:"{{ENTITY_UPDATES}}",generator:Fa,description:"Entity update system based on ECS components"},{marker:"{{SPRITE_UPDATES}}",generator:$a,description:"Sprite animation and movement updates"},{marker:"{{COLLISION_CHECK}}",generator:Ba,description:"Collision detection system"},{marker:"{{INPUT_HANDLING}}",generator:ja,description:"Input handling with project-specific controls"},{marker:"{{MENU_SYSTEM}}",generator:Ha,description:"Menu system updates and rendering"},{marker:"{{CUSTOM_STATES}}",generator:za,description:"Custom state handlers detected from project"}];function Ga(t,e,a,l=Va){const o=ct(e,a);let n=t;return n=n.replace(/{{PROJECT_NAME}}/g,e.toUpperCase()),n=n.replace(/{{PROJECT_NAME_LOWER}}/g,e.toLowerCase()),n=n.replace(/{{GENERATION_DATE}}/g,new Date().toISOString()),l.forEach(c=>{if(n.includes(c.marker)){const r=c.generator(o);n=n.replace(new RegExp(Ya(c.marker),"g"),r)}}),n}function Wa(){return`;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
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
`}function Ya(t){return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function kr(t,e){const a=Wa(),l=Ga(a,t,e),n=`${t.toLowerCase().replace(/[^a-z0-9]/g,"_")}_dynamic_system.asm`,c=ct(t,e);return{filename:n,content:l,analysis:c}}function Ee(t,e,a){if(!(!a||a.length===0)){t.push(`;   ${e}:`);for(const l of a)t.push(`;     - ${l}`)}}function z(t){const e=[];return e.push("; Register Contract:"),t.purpose&&e.push(`;   Purpose: ${t.purpose}`),Ee(e,"Inputs",t.inputs),Ee(e,"Outputs",t.outputs),Ee(e,"Clobbers",t.clobbers),Ee(e,"Preserved",t.preserved),Ee(e,"Register roles",t.usage),Ee(e,"Notes",t.notes),`${e.join(`
`)}
`}function Qa(t={mode:"hybrid"}){const{mode:e,optimizeLevel:a="safe",includeDebug:l=!1}=t;let o=`; ==================================================================
; DIRECT HARDWARE ACCESS ROUTINES
; ==================================================================
; Mode: ${e.toUpperCase()}
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

`;return o+=Xa(),o+=Za(),o+=qa(),o+=Ja(),o+=el(),o+=tl(),o+=al(),a==="aggressive"&&(o+=Ka(),o+=ll()),l&&(o+=ol()),o+=`
; ==================================================================
; END OF DIRECT HARDWARE ROUTINES
; ==================================================================
`,o}function Xa(){return`
; ==================================================================
; FAST_LDIRVM - Fast Block Transfer to VRAM
; ==================================================================
${z({purpose:"Block copy from RAM to VRAM using VDP data port auto-increment.",inputs:["HL = source address (RAM)","DE = destination address (VRAM)","BC = byte count"],outputs:["None"],clobbers:["AF","BC","HL"],preserved:["DE"],usage:["A = VDP address bytes and data byte being transferred","HL = RAM read pointer (increments each byte)","DE = only used to program initial VRAM address","BC = countdown loop counter"],notes:["Caller must preserve AF/BC/HL if needed after call."]})}
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
;   - Briefly masks IRQs only while programming the VDP address latch
;   - Restores the previous IRQ enable state before the data loop starts
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

    ; Restore previous IRQ state before the bulk copy loop
    pop af
    jp po, .ldirvm_loop    ; P/V=0 => IRQs were already disabled
    ei

    ; Copy loop
.ldirvm_loop:
    ld a, (hl)             ; Read byte from RAM (7 cycles)
    out (#98), a           ; Write to VRAM data port (11 cycles)
    inc hl                 ; Next source address (6 cycles)
    dec bc                 ; Decrement counter (6 cycles)
    ld a, b                ; Check if BC = 0 (4 cycles)
    or c                   ; (4 cycles)
    jr nz, .ldirvm_loop    ; Loop if not zero (12/7 cycles)
    ret

`}function Ka(){return`
; ==================================================================
; FAST_LDIRVM_256 - Optimized for exactly 256 bytes
; ==================================================================
${z({purpose:"Fixed-size 256-byte transfer from RAM to VRAM using DJNZ.",inputs:["HL = source address (RAM)","DE = destination address (VRAM)"],outputs:["None"],clobbers:["AF","B","HL"],preserved:["C","DE"],usage:["A = VDP address bytes and transferred byte","B = DJNZ counter (0 means 256 iterations)","HL = RAM read pointer","DE = only used to set initial VRAM address"],notes:["Use only when exactly 256 bytes must be copied."]})}
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

    ; Restore previous IRQ state before the bulk copy loop
    pop af
    jp po, .ldirvm_256_begin
    ei

    ; Copy 256 bytes using DJNZ (B=0 means 256)
.ldirvm_256_begin:
    ld b, 0                ; B = 256 (wraps from 0)
.ldirvm_256_loop:
    ld a, (hl)
    out (#98), a
    inc hl
    djnz .ldirvm_256_loop  ; Faster than dec bc + check (13/8 cycles)
    ret

`}function Za(){return`
; ==================================================================
; FAST_WRTVRM - Write Single Byte to VRAM
; ==================================================================
${z({purpose:"Write one byte into VRAM while preserving caller-visible state.",inputs:["A = byte to write","HL = VRAM destination address"],outputs:["None"],clobbers:["None (all registers preserved)"],preserved:["AF","BC","DE","HL"],usage:["A = temporarily saved/restored around VDP address programming","HL = VRAM address source (not modified)"],notes:["Safe helper when the caller cannot tolerate register changes."]})}
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
;   - Safe for HUD updates, tile changes
; ==================================================================
FAST_WRTVRM:
    push af                ; Save data byte (11 cycles)
    ld a, l
    out (#99), a           ; Address low (11 cycles)
    ld a, h
    or #40                 ; Write mode (7 cycles)
    out (#99), a           ; Address high + command (11 cycles)
    pop af                 ; Restore data (10 cycles)
    out (#98), a           ; Write to VRAM (11 cycles)
    ret                    ; (10 cycles)
                           ; Total: ~40 cycles

`}function qa(){return`
; ==================================================================
; FAST_RDVRM - Read Single Byte from VRAM
; ==================================================================
${z({purpose:"Read one byte from VRAM data port.",inputs:["HL = VRAM source address"],outputs:["A = byte read from VRAM"],clobbers:["AF"],preserved:["BC","DE","HL"],usage:["A = VDP addressing command then read result","HL = address source only (unchanged)"],notes:["Callers relying on flags must account for AF clobber."]})}
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
;   ~35 cycles vs BIOS ~65 cycles (46% faster)
;
; Notes:
;   - Useful for collision detection, tile reading
;   - VDP requires small delay after address set before read
; ==================================================================
FAST_RDVRM:
    ld a, l
    out (#99), a           ; Address low
    ld a, h
    and #3F                ; Clear bit 6 for read mode (bit 7 must be 0)
    out (#99), a           ; Address high + read command
    nop                    ; VDP needs time to process address before read
    in a, (#98)            ; Read from VRAM data port
    ret

`}function Ja(){return`
; ==================================================================
; FAST_WRTVDP - Write VDP Register
; ==================================================================
${z({purpose:"Write one VDP register value (value first, then register index).",inputs:["B = register value","C = register number"],outputs:["None"],clobbers:["AF"],preserved:["BC","DE","HL"],usage:["A = output staging register for both OUT operations","B/C = preserved input pair for value and register id"],notes:["Order of writes is mandatory for VDP register writes."]})}
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

`}function el(){return`
; ==================================================================
; FAST_GTSTCK - Read Joystick Direction
; ==================================================================
${z({purpose:"Read joystick direction and map PSG bits to MSX GTSTCK direction code.",inputs:["A = joystick port (0 or 1)"],outputs:["A = direction code (0-8)"],clobbers:["AF","HL"],preserved:["BC","DE"],usage:["A = PSG register selection, raw read, and final direction code","HL = lookup table pointer into joystick_direction_table"],notes:["Bits are active-low; routine inverts and masks input nibble."]})}
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

    ; Select PSG register
    out (#A0), a           ; Write register number to PSG address port
    in a, (#A2)            ; Read value from PSG data port

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

`}function tl(){return`
; ==================================================================
; FAST_GTTRIG - Read Joystick Trigger
; ==================================================================
${z({purpose:"Read joystick trigger bit directly from PSG register.",inputs:["A = joystick port (0 or 1)"],outputs:["A = #FF if pressed, #00 if released"],clobbers:["AF"],preserved:["BC","DE","HL"],usage:["A = register select, raw PSG read, and normalized return value"],notes:["Trigger is active-low in PSG bit 4."]})}
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

    ; Select PSG register and read value
    out (#A0), a
    in a, (#A2)

    ; Trigger bit (bit 4): 0 when pressed, 1 when released
    and #10
    ld a, #00
    ret nz
    ld a, #FF
    ret

`}function al(){return`
; ==================================================================
; FAST_SNSMAT - Sense Keyboard Matrix Row
; ==================================================================
${z({purpose:"Select keyboard matrix row via PPI and return row state.",inputs:["A = matrix row (0-11)"],outputs:["A = row bits (active-low)"],clobbers:["AF","C"],preserved:["B","DE","HL"],usage:["A = row selector composition and final row read","C = cached low nibble used to build PPI port C output"],notes:["Upper nibble of current PPI port C is preserved."]})}
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

`}function ll(){return`
; ==================================================================
; COPY_SPRITE_PATTERN_UNROLLED - Ultra-fast sprite pattern copy
; ==================================================================
${z({purpose:"Copy fixed 32-byte sprite pattern to VRAM with unrolled writes.",inputs:["HL = source address (32-byte sprite pattern in RAM)","DE = destination VRAM address"],outputs:["None"],clobbers:["AF","HL"],preserved:["BC","DE"],usage:["A = VDP address bytes and each streamed pattern byte","HL = source pointer advanced 32 times","DE = initial VRAM destination programming only"],notes:["Optimized for speed at the cost of ROM size."]})}
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

`}function ol(){return`
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

`}function nl(t={}){const{hardwareMode:e}=t;let a=`; ==================================================================
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
`;return e&&(e.mode==="direct"||e.mode==="hybrid")?a+`
`+Qa(e):a}function rl(t){let e="";if(!t.globalVariables||t.globalVariables.length===0)return e+=`; Goal Variable Values (default)
`,e+=`GOAL_FAILURE            EQU 0    ; Goal = "Failure"
`,e+=`GOAL_COMPLETED          EQU 1    ; Goal = "Completed"
`,e;const a=new Set;return t.globalVariables.forEach(l=>{l.values&&l.values.length>0&&(e+=`
; ${l.name} - ${l.description||"Variable values"}
`,l.values.forEach(o=>{const n=(o.asmConstant||"UNKNOWN").trim(),c=typeof o.value=="number"?o.value:0;a.has(n)||(e+=`${n.padEnd(24)}EQU ${c}    ; ${l.name} = "${o.label}"
`,a.add(n))}))}),e}function il(t){var a,l;const e=dt(t.sprites||[]).sprites.length;return`; ==================================================================
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
${t.tiles&&t.tiles.length>0?`
; Project-specific tile dimensions detected:
${t.tiles.map((o,n)=>`; Tile ${n}: ${o.name} = ${o.width}x${o.height}px (${Math.ceil(o.width/8)}x${Math.ceil(o.height/8)} MSX chars)`).join(`
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

; Tile Behavior Types (bitmask)
TILE_PASSABLE       EQU #00    ; No collision (air, background)
TILE_SOLID          EQU #01    ; Solid wall/floor (blocks all movement)
TILE_PLATFORM       EQU #02    ; One-way platform (solid from above only)
TILE_LADDER         EQU #04    ; Climbable (allows vertical movement)
TILE_DEADLY         EQU #08    ; Damages/kills on contact (spikes, lava)
TILE_WATER          EQU #10    ; Water (slows movement, swim logic)
TILE_ICE            EQU #20    ; Slippery surface (reduced friction)
TILE_BREAKABLE      EQU #40    ; Can be destroyed by player
TILE_TRIGGER        EQU #80    ; Activates events on contact

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

${rl(t)}

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
TOTAL_SPRITES           EQU ${e}
TOTAL_TILES             EQU ${((a=t.tiles)==null?void 0:a.length)||0}
TOTAL_SCREENS           EQU ${((l=t.screenMaps)==null?void 0:l.length)||0}

; ==================================================================
; END OF CONSTANTS
; ==================================================================
`}function sl(t){let e=`; ==================================================================
; RAM VARIABLES DEFINITIONS
; File: variables.asm
; Description: Dynamic variable allocation using EQU addresses
; Generated based on project analysis
; ==================================================================

; ==================================================================
; CORE SYSTEM VARIABLES (ALWAYS PRESENT)
; ==================================================================
`,a=49152;e+=`input_state         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current direction state (0-8)
`,a++,e+=`prev_input_state    EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Previous direction state (0-8)
`,a++,e+=`input_btn_curr      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current input buttons bitmask (bit0=fire)
`,a++,e+=`input_btn_prev      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Previous input buttons bitmask (bit0=fire)
`,a++,e+=`input_fire          EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Fire button state (0=released, 1=pressed)
`,a++,e+=`current_flow_state  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current game flow state
`,a++,e+=`prev_flow_state     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Previous game flow state
`,a++,e+=`gameflow_exit_requested EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Exit flag for WorldLink loop
`,a++,e+=`gameflow_menu_selection EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current/last submenu selection
`,a++,e+=`gameflow_submenu_data_ptr EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Pointer to active submenu data (16-bit)
`,a+=2,e+=`gameflow_submenu_option_count EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Cached submenu option count
`,a++,e+=`gameflow_submenu_cursor_enabled EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; 1 when submenu uses sprite cursor
`,a++,e+=`gameflow_submenu_cursor_layer_count EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Cursor sprite layer count (1..4)
`,a++,e+=`gameflow_condition_result EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Result of last condition evaluation
`,a++,e+=`transition_delay_var    EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Frames per step for active transition effect
`,a++,e+=`
; ==================================================================
; MIDEAS GLOBAL VARIABLES (DEFAULTS + CUSTOM)
; ==================================================================
`,t.globalVariables&&t.globalVariables.length>0?t.globalVariables.forEach(n=>{const c=String(n.type||"").toLowerCase(),r=c==="16bit"||c==="word",p=r?2:1,d=r?" (16-bit)":" (8-bit)",u=n.description||n.name;e+=`${n.asmName.padEnd(20)} EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; ${u}${d}
`,a+=p}):(e+=`global_var_goal     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Goal status (0=Failure, 1=Completed)
`,a++),e+=`
; ==================================================================
; SYSTEM VARIABLES
; ==================================================================
`,e+=`ROM_slot            EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; ROM slot number (for SETPAGES32K)
`,a++,e+=`mapper_bank_p1_current EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Mapper current bank for page/window 1
`,a++,e+=`mapper_bank_p2_current EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Mapper current bank for page/window 2
`,a++,e+=`mapper_bank_p3_current EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Mapper current bank for page/window 3
`,a++,e+=`mapper_bank_p4_current EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Mapper current bank for page/window 4
`,a++,e+=`mapper_saved_bank    EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Saved mapper bank for push/pop helpers
`,a++,e+=`mapper_saved_bank_p1 EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Saved mapper bank for page/window 1 helpers
`,a++,e+=`mapper_saved_bank_p3 EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Saved mapper bank for page/window 3 helpers
`,a++,e+=`mapper_saved_bank_p4 EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Saved mapper bank for page/window 4 helpers
`,a++,e+=`frame_counter       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Frame counter (16-bit)
`,a+=2,e+=`
; ==================================================================
; SCREEN MAP POINTERS (Current active screen)
; ==================================================================
`,e+=`current_screen_layout   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Pointer to current screen layout data (16-bit)
`,a+=2,e+=`current_screen_layout_bank EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Mapper bank for current screen layout data
`,a++,e+=`current_behavior_map    EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Pointer to current behavior map data (16-bit)
`,a+=2,e+=`current_behavior_map_bank EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Mapper bank for current behavior map data
`,a++,e+=`behavior_cache_row     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Cached behavior row (255=invalid)
`,a++,e+=`behavior_cache_map_l   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Cached behavior map pointer low byte
`,a++,e+=`behavior_cache_map_h   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Cached behavior map pointer high byte
`,a++,e+=`behavior_cache_row_base EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Cached row base address in behavior map (16-bit)
`,a+=2,e+=`RUNTIME_SCREEN_MAP_SIZE EQU 768
`,e+=`runtime_screen_layout  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Mutable copy of current screen layout (32x24)
`,a+=768,e+=`runtime_behavior_map   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Mutable copy of current behavior map (32x24)
`,a+=768,e+=`
; ==================================================================
; VIEWPORT/CAMERA VARIABLES (for scroll system)
; ==================================================================
`,e+=`camera_x            EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Camera X position in pixels (16-bit)
`,a+=2,e+=`camera_y            EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Camera Y position in pixels (16-bit)
`,a+=2,e+=`camera_tile_x       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Camera tile X (column)
`,a++,e+=`camera_tile_y       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Camera tile Y (row)
`,a++,e+=`world_width_tiles   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; World width in tiles
`,a++,e+=`world_height_tiles  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; World height in tiles
`,a++,e+=`scroll_dirty_flag   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; 1=viewport changed, needs redraw
`,a++,e+=`hud_dirty_flag      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; 1=HUD needs redraw, 0=clean
`,a++,e+=`
; ==================================================================
; ANIMATED TILES VARIABLES
; ==================================================================
`,e+=`anim_tile_timer     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Animation frame timer
`,a++,e+=`anim_tile_frame     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current animation frame (0-3)
`,a++,e+=`anim_tile_speed     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Frames between animation updates
`,a++,e+=`anim_tile_transform_flags EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Runtime flags for transform-mode tile animation (byte0=flags, byte1=opcode scratch)\r
`,a+=2,e+=`anim_tile_row_buffer EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temp buffer (8 bytes) for row transforms
`,a+=8,e+=`
; ==================================================================
; PARTICLE SYSTEM VARIABLES
; ==================================================================
`,e+=`particle_pool       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Particle pool (8 particles * 8 bytes = 64 bytes)
`,a+=64,e+=`
; ==================================================================
; ENTITY SYSTEM VARIABLES (Fixed 32 entities)
; ==================================================================
MAX_ENTITIES        EQU 32
`,e+=`entity_active       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity active flags (32 bytes, 0=inactive, 1=active)
`,a+=32,e+=`entity_x_pos        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity X positions (32 bytes)
`,a+=32,e+=`entity_y_pos        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity Y positions (32 bytes)
`,a+=32,e+=`entity_vel_x        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity X velocity (32 bytes)
`,a+=32,e+=`entity_vel_y        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity Y velocity (32 bytes)
`,a+=32,e+=`entity_comp_masks   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity component masks (32 bytes)
`,a+=32,e+=`entity_comp_masks_hi EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity component masks high byte (32 bytes)
`,a+=32,e+=`entity_screen_id    EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity screen ID (32 bytes)
`,a+=32,e+=`entity_dir_mask     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity direction mask (32 bytes)
`,a+=32,e+=`entity_input_speed  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity input/cursor speed (32 bytes)
`,a+=32,e+=`entity_health       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity health (32 bytes)
`,a+=32,e+=`entity_anim_frame   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity animation frame (32 bytes)
`,a+=32,e+=`entity_anim_tick    EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity animation tick counter (32 bytes)
`,a+=32,e+=`entity_anim_speed   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity animation speed (ticks per frame) (32 bytes)
`,a+=32,e+=`entity_anim_flags   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity animation flags (32 bytes)
`,a+=32,e+=`entity_sm_ptr_l     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity State Pointer Low (32 bytes)
`,a+=32,e+=`entity_sm_ptr_h     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity State Pointer High (32 bytes)
`,a+=32,e+=`entity_sm_timer_l   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity State Timer Low (32 bytes)
`,a+=32,e+=`entity_sm_timer_h   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity State Timer High (32 bytes)
`,a+=32,e+=`entity_sm_wait_timer EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity State Wait Timer (32 bytes)
`,a+=32,e+=`entity_lifetime     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity lifetime for auto-destroy (32 bytes, 0=infinite)
`,a+=32,e+=`entity_carried_by   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity carrier ID (32 bytes, 255=not carried)
`,a+=32,e+=`entity_template_token EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity template token (32 bytes, 0=unknown)
`,a+=32,e+=`entity_facing_dir   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Last facing direction (32 bytes, 0=none,1=left,2=right,3=up,4=down)
`,a+=32;for(let n=0;n<8;n++)e+=`entity_sm_var_${n}     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity Variable ${n} (32 bytes)
`,a+=32;e+=`
; ==================================================================
; SPRITE SYSTEM VARIABLES
; ==================================================================
`,e+=`entity_sprite_asset_index EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity sprite asset index - RAM copy (32 bytes)
`,a+=32,e+=`active_sprite_count EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Number of sprites currently active
`,a++,e+=`sprites_dirty      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; 1=sprite_attributes changed, needs VRAM sync
`,a++,e+=`sprite_pattern      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Sprite pattern IDs (32 bytes)
`,a+=32,e+=`sprite_color        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Sprite colors (32 bytes)
`,a+=32,e+=`sprite_layer_colors EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; HW sprite layer color cache - RAM copy (32 bytes, indexed by HW sprite index)
`,a+=32,e+=`sprite_attributes   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Interleaved sprite attributes (32 * 4 bytes)
`,a+=128,t.screenMaps.length>0&&(e+=`
; ==================================================================
; SCREEN SYSTEM VARIABLES (${t.screenMaps.length} screens detected)
; ==================================================================
`,e+=`current_screen_id   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Currently displayed screen ID
`,a++,e+=`screen_dirty_flag   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Screen needs redraw flag
`,a++,e+=`screen_transition_cooldown EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Cooldown frames after screen transition
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
`,a+=2,e+=`gem_count           EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Collectible tile counter (8-bit)
`,a++,e+=`last_gem_char       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Char code of last collected gem tile (for SM VARIABLE_COMPARE)
`,a++,e+=`
; Persistent collectibles list (survives screen re-entry)
`,e+=`MAX_COLLECTIBLES     EQU 64              ; Max persistent collectible records
`,e+=`collected_count      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Number of collected tiles recorded (8-bit)
`,a++,e+=`collected_world      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; World IDs for each collected tile (MAX_COLLECTIBLES bytes)
`,a+=64,e+=`collected_screen     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Screen IDs for each collected tile (MAX_COLLECTIBLES bytes)
`,a+=64,e+=`collected_idx_l      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Tile name-table index low byte (MAX_COLLECTIBLES bytes)
`,a+=64,e+=`collected_idx_h      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Tile name-table index high byte (MAX_COLLECTIBLES bytes)
`,a+=64,e+=`
; Timed bonus tile respawn slots (bonus gem regeneration)
`,e+=`MAX_BONUS_RESPAWNS   EQU 16              ; Max timed bonus tiles waiting to respawn
`,e+=`bonus_respawn_world  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; World IDs for timed bonus respawns (MAX_BONUS_RESPAWNS bytes)
`,a+=16,e+=`bonus_respawn_screen EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Screen IDs for timed bonus respawns (MAX_BONUS_RESPAWNS bytes)
`,a+=16,e+=`bonus_respawn_idx_l  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Tile index low byte for timed respawns (MAX_BONUS_RESPAWNS bytes)
`,a+=16,e+=`bonus_respawn_idx_h  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Tile index high byte for timed respawns (MAX_BONUS_RESPAWNS bytes)
`,a+=16,e+=`bonus_respawn_secs   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Remaining seconds per timed respawn slot (MAX_BONUS_RESPAWNS bytes)
`,a+=16,e+=`bonus_respawn_frames EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Frame countdown (60..1) per timed respawn slot (MAX_BONUS_RESPAWNS bytes)
`,a+=16,e+=`
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
`,a+=32,e+=`
; ==================================================================
; SOUND SYSTEM VARIABLES
; ==================================================================
`,e+=`sfx_active          EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; 0=no SFX active, 1=playing
`,a++,e+=`sfx_timer           EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Frames remaining for current SFX
`,a++,e+=`sfx_fadeout         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Reserved fadeout flag/state
`,a++,e+=`temp_byte_7         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,e+=`temp_byte_8         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,e+=`temp_byte_9         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,e+=`temp_byte_10        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,e+=`temp_byte_11        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,e+=`temp_byte_12        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,e+=`temp_byte_13        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,e+=`temp_byte_14        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,e+=`temp_byte_15        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,e+=`temp_byte_16        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,e+=`temp_byte_17        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,e+=`temp_byte_18        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,e+=`temp_byte_19        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,e+=`temp_byte_20        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,e+=`temp_byte_21        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,e+=`temp_byte_22        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,e+=`temp_byte_23        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,e+=`temp_byte_24        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,e+=`temp_byte_25        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,e+=`temp_word_3         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 16-bit storage (64 bytes)
`,a+=64,e+=`temp_word_4         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 16-bit storage (64 bytes)
`,a+=64,e+=`temp_byte_26        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,e+=`temp_byte_27        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,a+=32,e+=`
; Wall collision temporary variables
`,e+=`wall_temp_x         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Cached entity X for wall checks
`,a++,e+=`wall_temp_y         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Cached entity Y for wall checks
`,a++,e+=`wall_hit_left       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Hitbox left edge cache
`,a++,e+=`wall_hit_top        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Hitbox top edge cache
`,a++,e+=`wall_hit_right      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Hitbox right edge cache
`,a++,e+=`wall_hit_bottom     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Hitbox bottom edge cache
`,a++,e+=`wall_hit_w          EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Hitbox width cache (min 1)
`,a++,e+=`wall_hit_h          EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Hitbox height cache (min 1)
`,a++,e+=`wall_probe_left     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; X probe near hitbox left (adaptive inset)
`,a++,e+=`wall_probe_right    EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; X probe near hitbox right (adaptive inset)
`,a++,e+=`wall_probe_top      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Y probe near hitbox top (adaptive inset)
`,a++,e+=`wall_probe_bottom   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Y probe near hitbox bottom (adaptive inset)
`,a++,e+=`
; Unified update helpers
`,e+=`active_entity_list  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity indices with non-zero component masks (MAX_ENTITIES bytes)
`,a+=32,e+=`active_entity_count EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Number of entries in active_entity_list
`,a++,e+=`active_entity_list_dirty EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; 1=rebuild active_entity_list required
`,a++,e+=`
; Entity-entity collision optimized variables
`,e+=`coll_list           EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Active collidable entity indices (MAX_ENTITIES bytes)
`,a+=32,e+=`coll_list_count     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Number of entities in coll_list
`,a++,e+=`coll_src_left       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Source AABB left edge (scratch)
`,a++,e+=`coll_src_right      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Source AABB right edge (scratch)
`,a++,e+=`coll_src_top        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Source AABB top edge (scratch)
`,a++,e+=`coll_src_bottom     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Source AABB bottom edge (scratch)
`,a++,e+=`
; ==================================================================
; INTERRUPT SYSTEM VARIABLES (dynamically allocated)
; ==================================================================
`,e+=`task_table              EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Task table base (8 slots x 2 bytes = 16 bytes)
`;for(let n=0;n<8;n++)e+=`task_${n}_ptr              EQU #${(a+n*2).toString(16).toUpperCase().padStart(4,"0")}   ; Slot ${n} pointer (2 bytes)
`;a+=16,e+=`interrupt_system_enabled EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; 0=disabled, 1=enabled (1 byte)
`,a++,e+=`old_htimi_hook          EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Original H.TIMI hook (5 bytes)
`,a+=5,e+=`interrupt_counter       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Frame counter (16-bit)
`,a+=2,e+=`task_exec_time          EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Cycles used by tasks (16-bit, debug)
`,a+=2,e+=`vblank_flag             EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Set to 1 on each VBlank (1 byte)
`,a++,e+=`RAM_INTERRUPT_END       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; End of interrupt system
`,e+=`
; ==================================================================
; STATE MACHINE SOUND RUNTIME (one active sound asset)
; ==================================================================
`,e+=`sm_sound_active       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; 0=idle, 1=playing state-machine sound asset
`,a++,e+=`sm_sound_frames_left  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Frames left for current state-machine sound asset
`,a++,e+=`sm_sound_ptr_l        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Next sound frame pointer low byte
`,a++,e+=`sm_sound_ptr_h        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Next sound frame pointer high byte
`,a++,e+=`
; ==================================================================
; TRACKER MUSIC RUNTIME
; ==================================================================
`,e+=`music_active         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; 0=stopped, 1=track active
`,a++,e+=`music_muted          EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; 0=audible, 1=muted/pause
`,a++,e+=`music_loop           EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; 0=no loop, 1=loop enabled
`,a++,e+=`music_track_index    EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current ROM track index
`,a++,e+=`music_row_frames     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Frames per tracker row
`,a++,e+=`music_row_countdown  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Countdown to next row
`,a++,e+=`music_order_pos      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current order position
`,a++,e+=`music_pattern_index  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current pattern index
`,a++,e+=`music_pattern_row    EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current row inside pattern
`,a++,e+=`music_pattern_rows   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Cached rows in current pattern
`,a++,e+=`music_track_ptr_l    EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current track pointer low byte
`,a++,e+=`music_track_ptr_h    EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current track pointer high byte
`,a++,e+=`music_pattern_ptr_l  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current pattern rows pointer low byte
`,a++,e+=`music_pattern_ptr_h  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Current pattern rows pointer high byte
`,a++,e+=`music_mixer_shadow   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; PSG mixer shadow for music runtime
`,a++;const l=[{base:"music_ch_note_base",prefix:"music_ch",suffix:"note",comment:"Current note index (255=silent)"},{base:"music_ch_instrument_base",prefix:"music_ch",suffix:"instrument",comment:"Current instrument id (0=none)"},{base:"music_ch_ornament_base",prefix:"music_ch",suffix:"ornament",comment:"Current ornament id (0=none)"},{base:"music_ch_volume_base",prefix:"music_ch",suffix:"volume",comment:"Current base volume (0-15)"},{base:"music_ch_vol_step_base",prefix:"music_ch",suffix:"vol_step",comment:"Reserved software volume envelope step"},{base:"music_ch_tone_step_base",prefix:"music_ch",suffix:"tone_step",comment:"Reserved software tone envelope step"},{base:"music_ch_noise_step_base",prefix:"music_ch",suffix:"noise_step",comment:"Reserved software noise envelope step"},{base:"music_ch_orn_step_base",prefix:"music_ch",suffix:"orn_step",comment:"Reserved ornament step"}],o=["a","b","c"];for(const n of l){const c=a;e+=`${n.base} EQU #${c.toString(16).toUpperCase().padStart(4,"0")}   ; ${n.comment} (3 bytes)
`,o.forEach((r,p)=>{e+=`${n.prefix}_${r}_${n.suffix} EQU #${(c+p).toString(16).toUpperCase().padStart(4,"0")}   ; Channel ${r.toUpperCase()}
`}),a+=3}return e+=`
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
`,e}function dl(t){if(!t)return"";let e="";const a=!!(t.tracks&&t.tracks.length>0||t.stateMachines&&t.stateMachines.length>0);return t.hasSprites&&(e+=`    ld a, 1
`,e+=`    ld hl, task_update_sprites
`,e+=`    call enable_task

`),a&&(e+=`    ld a, 4
`,e+=`    ld hl, task_update_music
`,e+=`    call enable_task

`),e}function cl(t,e){var l;let a="";if(e!=null&&e.gameFlow){const o=e.gameFlow;a=`
; GameFlow Integration: Using "${o.name}" as execution orchestrator`;const n=o.nodes.find(c=>c.type==="Start");if(n){const c=o.connections.find(r=>{var p;return((p=r.from)==null?void 0:p.nodeId)===n.id||typeof r.from=="string"&&r.from===n.id});if(c){const r=((l=c.to)==null?void 0:l.nodeId)||c.to,p=o.nodes.find(d=>d.id===r);p&&(a+=`
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
    ${dl(e)}
    ei

${e.hasGameFlow?`    ; ====================================================
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
`}function de(t){return t.replace(/[^a-zA-Z0-9]/g,"_")}function Pt(t){return String(t||"").replace(/"/g,"").replace(/\r?\n/g," ").trim()}function kt(t){const e=String(t||"").trim();if(!e||e.toLowerCase().startsWith("rgba(0,0,0,0"))return null;const a=e.replace("#","");if(a.length!==6)return null;const l=parseInt(a.substring(0,2),16),o=parseInt(a.substring(2,4),16),n=parseInt(a.substring(4,6),16);return[l,o,n].some(c=>Number.isNaN(c))?null:{r:l,g:o,b:n}}function ia(t,e=!0){const a=String(t||"").trim();if(!a||a.toLowerCase().startsWith("rgba(0,0,0,0"))return e?0:1;const l=a.toUpperCase(),o=J.find(p=>p.hex.toUpperCase()===l);if(o)return o.index;const n=kt(a);if(!n)return e?0:1;let c=e?0:1,r=1/0;for(const p of J){if(!e&&p.index===0)continue;const d=kt(p.hex);if(!d)continue;const u=(n.r-d.r)**2+(n.g-d.g)**2+(n.b-d.b)**2;u<r&&(r=u,c=p.index)}return c}function Ot(t){const e=ia(t,!1);return e===0?1:e}function pl(t,e){const a=String(e||"").trim();return a?(Array.isArray(t.sprites)?t.sprites:[]).findIndex(o=>String((o==null?void 0:o.id)||"").trim()===a):-1}function _l(t){var n;const e=(t==null?void 0:t.spritePalette)||[],a=t==null?void 0:t.backgroundColor,l=(t==null?void 0:t.frames)||[];if(!e.length||!l.length)return[];const o=[];for(let c=0;c<e.length;c++){const r=e[c];if(!r||r===a)continue;let p=!1;for(const d of l)if(d!=null&&d.data){for(let u=0;u<(d.data.length||0)&&!p;u++)for(let i=0;i<(((n=d.data[u])==null?void 0:n.length)||0)&&!p;i++)d.data[u][i]===r&&(p=!0);if(p)break}p&&o.push(c)}return o}function hl(t){const e=(t==null?void 0:t.spritePalette)||[],a=t==null?void 0:t.backgroundColor,l=_l(t);if(l.length===0)return{layerOffsets:[0],layerColors:[15]};const o=l.slice(0,4);if(o.length===0)return{layerOffsets:[0],layerColors:[15]};const n=o.map((r,p)=>p),c=o.map(r=>{const p=e[r];return!p||a&&p===a?0:ia(p,!0)});return{layerOffsets:n,layerColors:c}}function ul(t){var l,o,n;const e=((l=t==null?void 0:t.appearance)==null?void 0:l.selectorType)??((o=t==null?void 0:t.appearance)==null?void 0:o.cursorType)??((n=t==null?void 0:t.appearance)==null?void 0:n.cursorMode)??(t==null?void 0:t.selectorType)??(t==null?void 0:t.cursorType)??(t==null?void 0:t.cursorMode),a=String(e||"").trim().toLowerCase();return a==="char"||a==="character"||a==="text"||a==="glyph"?"char":a==="sprite"||a==="image"?"sprite":"auto"}function ml(t){var o;const e=Array.isArray(t==null?void 0:t.options)?t.options:[];if(e.length===0)return 0;const a=(t==null?void 0:t.initialSelection)??(t==null?void 0:t.initialSelectedOption)??((o=t==null?void 0:t.appearance)==null?void 0:o.initialSelection)??0,l=Number(a);return!Number.isFinite(l)||l<0||l>=e.length?0:Math.floor(l)}function sa(t){return`NODE_TYPE_${t.replace(/([a-z])([A-Z])/g,"$1_$2").toUpperCase()}`}function bl(t){const e=(t.name||"DEFAULT").toUpperCase().replace(/[^A-Z0-9]/g,"_"),a=t.id?`_${t.id.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";return`load_screen_${e.toLowerCase()}${a.toLowerCase()}`}function Ut(t,e){const a=String(t||"").trim();if(!a)return null;const l=r=>`global_var_${r.replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"").replace(/[^a-z0-9_]/g,"_")}`,o=a.toLowerCase(),n=l(a),c=Array.isArray(e.globalVariables)?e.globalVariables:[];for(const r of c){const p=String((r==null?void 0:r.name)||"").trim(),d=String((r==null?void 0:r.asmName)||"").trim();if(p&&p.toLowerCase()===o)return d||l(p);if(d&&d.toLowerCase()===o)return d;if(p&&l(p)===n)return d||l(p)}return null}function fl(t){var o,n;const e=(n=(o=t==null?void 0:t.hudConfiguration)==null?void 0:o.importedFrame)==null?void 0:n.cells;if(!Array.isArray(e)||e.length===0)return null;const a=(t.name||"DEFAULT").toUpperCase().replace(/[^A-Z0-9]/g,"_"),l=t.id?`_${t.id.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";return`hud_imported_frame_${a.toLowerCase()}${l.toLowerCase()}_draw`}function yl(t){var n,c,r,p;if(!t.gameFlow)return Al(t);const e=t.gameFlow;let a=`; ==================================================================
; GAMEFLOW EXECUTION ENGINE
; File: gameflow.asm
; Description: GameFlow-based game orchestration system
; ==================================================================
;
; GameFlow: ${e.name||"Unnamed"}
; Total Nodes: ${((n=e.nodes)==null?void 0:n.length)||0}
; Total Connections: ${((c=e.connections)==null?void 0:c.length)||0}
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
${e.startNodeId?`    ld hl, gameflow_node_${de(e.startNodeId)}`:`    ; ERROR: No start node defined!
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
`;const l=Array.from(new Set(((r=e.nodes)==null?void 0:r.map(d=>d.type))||[]));l.forEach(d=>{const u=`gameflow_handle_${d.toLowerCase()}`;a+=`    cp ${sa(d)}
    jp z, ${u}
`}),a+=`    
    ; Unknown node type - error
    ret

`,a+=`; ==================================================================
; NODE TYPE HANDLERS
; Each handler receives:
;   DE = node data pointer
;   BC = connection table pointer
; ==================================================================

`,a+=gl(l,t),a+=`; ==================================================================
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

`;const o=(p=t.screenMaps)==null?void 0:p.some(d=>{var u;return((u=d.hudConfiguration)==null?void 0:u.elements)&&d.hudConfiguration.elements.length>0});return a+=`; ==================================================================
; GAME LOOP (WorldLink nodes only)
; ==================================================================

; Main game loop - executed by WorldLink nodes
; This loop runs while a world/level is active
gameflow_world_game_loop:
    ; Check exit flag
    ld a, (gameflow_exit_requested)
    or a
    ret nz

    ; Poll input in main loop (avoids BIOS-in-ISR compatibility issues)
    call task_update_input

    ; Handle world screen edge transitions (Preview parity)
    call check_world_screen_transition

    ; Update all entities
    call update_all_entities

    ; Execute all state machines
    call execute_all_state_machines

    ; Tracker music runs in VBlank via task_update_music

${t.stateMachines&&t.stateMachines.length>0?`    ; State-machine PLAY_SOUND runs in VBlank via task_update_music
`:""}

    ; Update animated background tiles (water, fire, etc.)
    call update_animated_tiles

    ; Update timed PSG sound effects
    call sfx_update

    ; Sprite SAT upload runs in VBlank via task_update_sprites (interrupt hook)
${o?`
    ; Render HUD elements
    call render_hud
`:""}
    ; Wait for V-Blank
    halt

    ; Loop
    jp gameflow_world_game_loop

`,a+=`; ==================================================================
; NODE DATA STRUCTURES
; Each node has: type byte, data pointer, connection table pointer
; ==================================================================

`,e.nodes&&e.nodes.length>0&&e.nodes.forEach(d=>{a+=El(d,e,t)}),a+=`
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
    push hl
    ld c, a
    call WRTVRM          ; Write to VRAM
    pop hl
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
    push hl
    ld c, a
    call WRTVRM
    pop hl
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
    push hl
    ld c, a
    call WRTVRM
    pop hl
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
`,t.globalVariables&&t.globalVariables.length>0&&(a+=`    ; Initialize global variables
`,t.globalVariables.forEach(d=>{const u=d.name,i=d.asmName||`global_var_${u.replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`,h=String(d.type||"").toLowerCase(),b=d.values&&d.values.length>0?d.values[0].value:0;let m=0;if(typeof b=="boolean")m=b?1:0;else{const s=Number(b);m=Number.isFinite(s)?Math.trunc(s):0}if(h==="word"||h==="16bit"){const s=Math.max(0,Math.min(65535,m));a+=`    ld a, ${s&255}
`,a+=`    ld (${i}), a    ; ${u} low byte = ${s}
`,a+=`    ld a, ${s>>8&255}
`,a+=`    ld (${i}+1), a    ; ${u} high byte = ${s}
`}else{const s=Math.max(0,Math.min(255,m));a+=`    ld a, ${s}
`,a+=`    ld (${i}), a    ; ${u} = ${s}
`}})),a+=`    ret

`,a+=`; ==================================================================
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
`,a}function gl(t,e){var c;let a="";const l=(c=e.screenMaps)==null?void 0:c.some(r=>{var p;return((p=r.hudConfiguration)==null?void 0:p.elements)&&r.hudConfiguration.elements.length>0});t.forEach(r=>{var p;switch(r){case"Start":a+=`gameflow_handle_start:
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

`;break;case"WorldLink":a+=`gameflow_handle_worldlink:
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
    ld a, FLOW_STATE_GAME
    ld (current_flow_state), a

    ; Update sprites
    call update_sprites_to_vram
${l?`
    ; Set HUD dirty flag so it renders on first frame after screen load
    ld a, 1
    ld (hud_dirty_flag), a
    call render_hud
`:""}
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

    ; Check for fire button to exit
    call GTTRIG
    or a
    jr nz, .end_screen_exit

    ; Check for ESC key to exit
    ld a, 7                       ; ESC key row
    call SNSMAT
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

`;break;case"Restart":a+=`gameflow_handle_restart:
    ; Restart node - safe runtime reinit entry (no cold page remap).
    jp restart_rom

`;break;case"SubMenu":{const d=Math.max(((p=e.sprites)==null?void 0:p.length)||0,1);let u="";for(let i=0;i<d;i++)u+=`    dw SPRITE_${i}_PATTERN
`;a+=`gameflow_handle_submenu:
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
    ld a, 0
    call GTTRIG
    or a
    jr nz, .smp_wait_fire_release
    jr .smp_exit

.smp_wait_neutral:
.smp_wait_neutral_loop:
    halt
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
SUBMENU_CURSOR_PATTERN_COUNT EQU ${d}

submenu_cursor_sprite_pattern_table:
${u}

`;break}case"Text":a+=`gameflow_handle_text:
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
    ld a, 0                       ; Trigger 0 = space bar
    call GTTRIG
    or a
    jr z, .wait_press

    ; Wait for fire button release
.wait_release:
    halt
    ld a, 0
    call GTTRIG
    or a
    jr nz, .wait_release

    ; Small delay after release
    ld b, 5
.delay_loop:
    halt
    djnz .delay_loop

    pop bc
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

`;break;case"Group":a+=`gameflow_handle_group:
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

`;break;case"Music":a+=`gameflow_handle_music:
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
`;break;default:a+=`gameflow_handle_${r.toLowerCase()}:
    ; ${r} node - not yet implemented
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

`;break}});const o=t.includes("Text")||t.includes("SubMenu"),n=t.includes("End");return o&&!n&&(a+=`; ------------------------------------------------------------------
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

`),a}function El(t,e,a){var d,u,i,h,b,m,s,y,g,A,T,S;const l=`gameflow_node_${de(t.id)}`,o=`${l}_conn`,n=["Start","WorldLink","SubMenu","Text","IfThenElse","Globals","Transition","Music"].includes(t.type)||t.type==="Globals"&&t.variables&&t.variables.length>0,c=n?`${l}_data`:"gameflow_no_data";let r=`; Node: ${t.type} - "${t.title||t.name||t.id}"
${l}:
    db ${sa(t.type)}
    dw ${c}
    dw ${o}

`;if(n){switch(r+=`${l}_data:
`,t.type){case"Start":r+=`    dw ${l}_init    ; Initialization routine address
`,r+=`    db ((${l}_init - #4000) / #2000)    ; Initialization routine bank
`;break;case"WorldLink":const f=t.worldAssetId||"default";r+=`    dw load_world_${de(f)}
`,r+=`    db ((load_world_${de(f)} - #4000) / #2000)
`;break;case"SubMenu":{const C=de(t.id),w=(Array.isArray(t.options)?t.options:[]).slice(0,6),D=w.length,N=ml(t),M=D>0?Math.min(N,D-1):0,V=Pt(t.title||t.name||"MENU").toUpperCase(),Q=((u=(d=t==null?void 0:t.appearance)==null?void 0:d.colors)==null?void 0:u.background)||"#000000",v=Ot(Q),x=ul(t),U=(i=t==null?void 0:t.appearance)==null?void 0:i.cursorSpriteAssetId,P=pl(a,U),F=P>=0?(h=a.sprites)==null?void 0:h[P]:null,X=x==="char"?!1:P>=0,pe=X?P:255,W=X&&F?hl(F):{layerOffsets:[],layerColors:[]},B=W.layerOffsets.slice(0,4),ee=W.layerColors.slice(0,4),Me=Math.min(ee.length,4);for(;B.length<4;)B.push(0);for(;ee.length<4;)ee.push(0);const Ie=(b=t==null?void 0:t.appearance)==null?void 0:b.backgroundScreenAssetId;let be="0";if(Ie&&a.screenMaps){const H=a.screenMaps.find(ae=>ae.id===Ie);if(H){const ae=H.name.toUpperCase().replace(/[^A-Z0-9]/g,"_"),se=H.id?`_${H.id.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";be=`load_screen_${ae.toLowerCase()}${se.toLowerCase()}`}}const ie=be==="0"?"0":`((${be} - #4000) / #2000)`;r+=`    db ${v}    ; Background color (MSX index)
`,r+=`    db ${pe}    ; Cursor sprite asset index (#FF = use text marker)
`,r+=`    db ${Me}    ; Cursor sprite layer count (max 4)
`,r+=`    db ${B[0]}, ${B[1]}, ${B[2]}, ${B[3]}    ; Cursor source layer offsets
`,r+=`    db ${ee[0]}, ${ee[1]}, ${ee[2]}, ${ee[3]}    ; Cursor layer colors
`,r+=`    dw ${be}    ; Background screen load function (0=none)
`,r+=`    db ${ie}    ; Background screen load bank
`,r+=`    db ${D}    ; Number of options (max 6)
`,r+=`    db ${M}    ; Initial selected option
`,r+=`    dw submenu_${C}_title
`,w.forEach((H,ae)=>{r+=`    dw submenu_${C}_opt${ae}
`}),r+=`
submenu_${C}_title:
`,r+=`    db "${V}", 0
`,w.forEach((H,ae)=>{const se=Pt((H==null?void 0:H.text)||(H==null?void 0:H.label)||(H==null?void 0:H.name)||(H==null?void 0:H.id)||`OPTION ${ae+1}`).toUpperCase();r+=`submenu_${C}_opt${ae}:
`,r+=`    db "${se}", 0
`})}break;case"Text":{const C=de(t.id),w=(t.title||t.name||"").replace(/"/g,"").replace(/\r?\n/g," ").trim().toUpperCase()||"TEXT",D=(t.message||"").replace(/"/g,"").replace(/\r?\n/g," "),N=((s=(m=t.appearance)==null?void 0:m.colors)==null?void 0:s.background)||"#000000",M=Ot(N),V=28,Q=D.split(" "),v=[];let x="";for(const W of Q){const B=W.toUpperCase(),ee=x?x+" "+B:B;ee.length>V&&x?(v.push(x),x=B):x=ee}x.trim()&&v.push(x);const U="PRESS FIRE TO CONTINUE",P=[];P.push({row:3,text:w,label:`text_${C}_title`}),v.forEach((W,B)=>{P.push({row:7+B,text:W,label:`text_${C}_msg${B}`})}),P.push({row:20,text:U,label:`text_${C}_prompt`});const F=(y=t.appearance)==null?void 0:y.backgroundScreenAssetId;let X="0";if(F&&a.screenMaps){const W=a.screenMaps.find(B=>B.id===F);if(W){const B=W.name.toUpperCase().replace(/[^A-Z0-9]/g,"_"),ee=W.id?`_${W.id.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";X=`load_screen_${B.toLowerCase()}${ee.toLowerCase()}`}}const pe=X==="0"?"0":`((${X} - #4000) / #2000)`;r+=`    DB ${M}                  ; Background color (MSX index from ${N})
`,r+=`    DW ${X}            ; Background screen load function (0=none)
`,r+=`    DB ${pe}         ; Background screen load bank
`,r+=`    DB ${P.length}                  ; Number of lines
`;for(const W of P){const B=Math.max(0,Math.floor((32-W.text.length)/2));r+=`    DB ${W.row}, ${B}              ; Row ${W.row}, Col ${B}
`,r+=`    DW ${W.label}          ; -> "${W.text}"
`}r+=`
`;for(const W of P)r+=`${W.label}:
`,r+=`    DB "${W.text}", 0
`;break}case"Music":{const C=typeof t.trackAssetId=="string"?t.trackAssetId:"",w=a.trackIndexByAssetId||{},D=a.tracks||[];let N=255,M=255,V=t.loop===!1?0:1,Q="";if(t.stop===!0)N=0,V=0;else if(t.autoPlay===!1)Q="; WARNING: Music node autoPlay=false -> no-op in ROM";else if(C&&w[C]!==void 0)N=1,M=w[C];else if(C){const v=D.find(x=>(x==null?void 0:x.id)===C);(v==null?void 0:v.soundChip)==="SCC"?Q=`; WARNING: Track "${C}" uses SCC and is ignored in ROM export`:Q=`; WARNING: Track "${C}" not found / not exportable as PSG`}else Q="; WARNING: Music node has no trackAssetId -> no-op";r+=`    db ${N}, ${M}, ${V}    ; command, track index, loop flag
`,Q&&(r+=`    ${Q}
`);break}case"IfThenElse":const _=t.variableName||"unknown",E=Ut(_,a),I=t.compareValue||0;E?r+=`    dw ${E}    ; Variable to check
`:r+=`    dw 0                 ; WARNING: Missing global variable "${_}"
`,r+=`    db ${I}   ; Compare value
`,r+=`    db 0                 ; Operator (0=equals)
`;break;case"Globals":if(t.variables&&t.variables.length>0){const C=t.variables.map(D=>{const N=D.variableName||D.name||"unknown",M=Ut(N,a),V=D.value||0;return{vName:N,vAsmName:M,vValue:V}}).filter(D=>!!D.vAsmName);r+=`    db ${C.length}    ; Number of assignments
`,C.forEach(D=>{r+=`    dw ${D.vAsmName}
`,r+=`    db ${D.vValue}
`});const w=t.variables.length-C.length;w>0&&(r+=`    ; WARNING: ${w} Globals assignment(s) skipped (undefined global variable)
`),C.length===0&&(r+=`    ; No valid global assignments found
`)}else r+=`    db 0    ; No assignments
`;break;case"Transition":{const C={cls:0,dissolve_pixels:1,dissolve_chars:2,vertical_lines:3,horizontal_lines:4,spiral:5,fill_white_squares:6},w={cls:1,dissolve_pixels:8,dissolve_chars:8,vertical_lines:16,horizontal_lines:24,spiral:96,fill_white_squares:4},D=C[t.effect]??0,N=w[t.effect]??8,M=t.duration??1e3,V=Math.max(1,Math.min(255,Math.round(M/N/20)));r+=`    db ${D}              ; Effect: ${t.effect||"cls"}
`,r+=`    db ${V}              ; Frames per step (duration ${M}ms / ${N} steps / 20ms)
`;break}}r+=`
`}r+=`${o}:
`;const p=((g=e.connections)==null?void 0:g.filter(f=>{var _;return(((_=f.from)==null?void 0:_.nodeId)||f.from)===t.id}))||[];if(t.type==="IfThenElse"){const f=p.find(E=>{var I,C;return((I=E.from)==null?void 0:I.sourceId)==="then"||!((C=E.from)!=null&&C.sourceId)}),_=p.find(E=>{var I;return((I=E.from)==null?void 0:I.sourceId)==="else"});r+=`    db CONNECTION_THEN
`,r+=`    dw ${f?`gameflow_node_${de(((A=f.to)==null?void 0:A.nodeId)||f.to)}`:"0"}
`,r+=`    db CONNECTION_ELSE
`,r+=`    dw ${_?`gameflow_node_${de(((T=_.to)==null?void 0:T.nodeId)||_.to)}`:"0"}
`}else if(t.type==="SubMenu")(Array.isArray(t.options)?t.options:[]).slice(0,6).forEach((_,E)=>{var C;const I=p.find(w=>{var D;return((D=w.from)==null?void 0:D.sourceId)===_.id});r+=`    db CONNECTION_OPTION_${E}
`,r+=`    dw ${I?`gameflow_node_${de(((C=I.to)==null?void 0:C.nodeId)||I.to)}`:"0"}
`});else{const f=p[0];r+=`    db CONNECTION_DEFAULT
`,r+=`    dw ${f?`gameflow_node_${de(((S=f.to)==null?void 0:S.nodeId)||f.to)}`:"0"}
`}return r+=`    db CONNECTION_END

`,t.type==="Start"&&(r+=Sl(t,l,a)),r}function Sl(t,e,a){let l=`; ------------------------------------------------------------------
; ${e}_init
; Initialization routine for Start node
; Initializes global variables and MSX systems
; ------------------------------------------------------------------
${e}_init:
`;const o=t.initializeGlobals,n=t.systemConfig;return l+=`    ; === Core Game Systems Initialization (ALWAYS required) ===
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
`,o.variables&&o.variables.length>0?o.variables.forEach(c=>{const r=String((c==null?void 0:c.variableName)||"").trim();if(!r)return;const p=Array.isArray(a.globalVariables)?a.globalVariables:[],d=r.toLowerCase(),u=p.find(s=>{const y=String((s==null?void 0:s.name)||"").trim().toLowerCase(),g=String((s==null?void 0:s.asmName)||"").trim().toLowerCase();return y===d||g===d}),i=String((u==null?void 0:u.name)||r),h=String((u==null?void 0:u.asmName)||`global_var_${i.replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`),b=String((u==null?void 0:u.type)||"").toLowerCase();let m=0;if(typeof c.value=="boolean")m=c.value?1:0;else{const s=Number(c.value);m=Number.isFinite(s)?Math.trunc(s):0}if(b==="word"||b==="16bit"){const s=Math.max(0,Math.min(65535,m));l+=`    ld a, ${s&255}
`,l+=`    ld (${h}), a    ; ${i} low byte = ${s}
`,l+=`    ld a, ${s>>8&255}
`,l+=`    ld (${h}+1), a    ; ${i} high byte = ${s}
`}else{const s=Math.max(0,Math.min(255,m));l+=`    ld a, ${s}
`,l+=`    ld (${h}), a    ; ${i} = ${s}
`}}):(l+=`    ; Initialize all global variables to default values
`,l+=`    call init_all_global_variables
`),l+=`
`),n&&n.initialDelayFrames&&n.initialDelayFrames>0&&(l+=`    ; Initial delay
`,l+=`    ld b, ${n.initialDelayFrames}
`,l+=`.delay_loop:
`,l+=`    halt    ; Wait for V-blank
`,l+=`    djnz .delay_loop

`),l+=`    ret

`,l}function Al(t){var n;const e=(n=t.screenMaps)==null?void 0:n.some(c=>{var r;return((r=c.hudConfiguration)==null?void 0:r.elements)&&c.hudConfiguration.elements.length>0}),a=t.screenMaps&&t.screenMaps.length>0?t.screenMaps[0]:null,l=a?fl(a):null;return`; ==================================================================
; DEFAULT GAMEFLOW (No GameFlow defined in project)
; ==================================================================

gameflow_init:
    ret

gameflow_start:
    ; Load first available screen/world
${a?`    call ${bl(a)}
`:`    ; No screens available
`}${l?`    ; Draw imported HUD frame once at game start
    call ${l}
`:""}
${e?`    ; Set HUD dirty flag after screen load
    ld a, 1
    ld (hud_dirty_flag), a
    call render_hud
`:""}    ret

gameflow_world_game_loop:
    ; Poll input in main loop (avoids BIOS-in-ISR compatibility issues)
    call task_update_input
    call check_world_screen_transition
    call update_all_entities
    call execute_all_state_machines
    ; Tracker music runs in VBlank via task_update_music
${t.stateMachines&&t.stateMachines.length>0?`    ; State-machine PLAY_SOUND runs in VBlank via task_update_music
`:""}    call update_animated_tiles
    ; Sprite SAT upload runs in VBlank via task_update_sprites (interrupt hook)
${e?`    call render_hud
`:""}    halt                            ; Wait for V-Blank
    jp gameflow_world_game_loop

; gameflow_exit_requested is allocated in variables.asm (RAM EQU)

; ==================================================================
; END OF DEFAULT GAMEFLOW
; ==================================================================
`}function Tl(t,e){return`; ==================================================================
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

; 3.5. Mapper runtime API
include "mapper.asm"

; 3.6. Interrupt System (Konami-style task system)
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

; 14.5 Sound system (PSG sound effects)
include "sound.asm"

; 15. Animated tiles (background frame updates)
include "animtiles.asm"

${e.stateMachines&&e.stateMachines.length>0?`; 16. State Machines (entity AI)
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
`}function Cl(t){return t==="ascii8"?{regP1:"#6000",regP2:"#6800",regP3:"#7000",regP4:"#7800",notes:["; ASCII8 register mapping (MSX Wiki ROM mappers):",";   4000-5FFF <- 6000h",";   6000-7FFF <- 6800h",";   8000-9FFF <- 7000h",";   A000-BFFF <- 7800h"]}:t==="ascii16"?{regP1:"#6000",regP2:"#6000",regP3:"#7000",regP4:"#7000",notes:["; ASCII16 register mapping (MSX Wiki ROM mappers):",";   4000-7FFF <- 6000h (P1/P2 share one 16KB register)",";   8000-BFFF <- 7000h (P3/P4 share one 16KB register)"]}:{regP1:"#6000",regP2:"#8000",regP3:"#A000",regP4:"#A000",notes:["; Konami (without SCC) write window references:",";   6000h-7FFFh, 8000h-9FFFh, A000h-BFFFh are switch registers.","; Note: in original Konami cartridges 4000h-5FFFh is typically fixed."]}}function Il(t={}){const e=t.targetFormat||"konami",a=t.romMode||"simple32k",l=t.autoMegaROM??!1,o=a==="megarom"||a==="auto"&&l;if(!o)return`; ==================================================================
; MAPPER RUNTIME API
; File: mapper.asm
; Description: Minimal compatibility stubs for simple32k builds
; Target mapper: ${e}
; ROM mode: ${a} (autoMegaROM=${l?"true":"false"})
; ==================================================================
;
; This build runs in simple32k mode, so bank switching is not active.
; Keep mapper API labels as no-op stubs so generated gameplay code can
; call the same routines without conditional assembly branches.

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
`;const n=Cl(e),c=o?"; Mapper register writes are enabled for this build configuration.":"; Mapper register writes are disabled (simple32k mode).";return`; ==================================================================
; MAPPER RUNTIME API
; File: mapper.asm
; Description: Centralized mapper register writes (no scattered inline writes)
; Target mapper: ${e}
; ROM mode: ${a} (autoMegaROM=${l?"true":"false"})
; ==================================================================

${n.notes.join(`
`)}
${c}

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
`}function vl(t){var e;return!t.tiles||t.tiles.length===0?`; ==================================================================
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

PATTERN_DATA_BANK EQU ((tile_pattern_bank0 - #4000) / #2000)

; ==================================================================
; TILE PATTERN BANK 0 (Base patterns)
; ==================================================================
tile_pattern_bank0:
${t.tiles.map((a,l)=>{const o=la(a,"SCREEN 2 (Graphics I)"),n=Math.ceil(a.width/8),c=Math.ceil(a.height/8),r=n*c;(a.width%8!==0||a.height%8!==0)&&console.warn(`⚠️  Tile ${a.name} size ${a.width}x${a.height} is not multiple of 8px - may cause visual artifacts`);const p=Array.from(o).map(u=>`#${u.toString(16).padStart(2,"0").toUpperCase()}`);let d="";if(r>1){d=`
    ; Character layout: ${n}×${c} grid`;for(let u=0;u<c;u++){d+=`
    ; Row ${u}: `;for(let i=0;i<n;i++){const h=u*n+i;d+=`Char${h} `}}}return`    ; Tile ${l}: ${a.name} (${a.width}x${a.height}px = ${n}×${c} chars = ${r} MSX characters)${d}
    db ${p.join(", ")}
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
    ld bc, ${t.tiles.reduce((a,l)=>{const o=Math.ceil(l.width/8),n=Math.ceil(l.height/8);return a+o*n*8},0)}    ; Total bytes for all tile characters (16x16 tiles = 4 chars each)
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
    ld bc, ${t.tiles.reduce((a,l)=>{const o=Math.ceil(l.width/8),n=Math.ceil(l.height/8);return a+o*n*8},0)}    ; Total bytes for all tile characters
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
    ld bc, ${t.tiles.reduce((a,l)=>{const o=Math.ceil(l.width/8),n=Math.ceil(l.height/8);return a+o*n*8},0)}    ; Total bytes for all tile characters
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
`}function wl(t){var e;return!t.tiles||t.tiles.length===0?`; ==================================================================
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

COLOR_DATA_BANK EQU ((tile_color_bank0 - #4000) / #2000)

; ==================================================================
; TILE COLOR BANK 0 (Base colors)
; ==================================================================
tile_color_bank0:
${t.tiles.map((a,l)=>{const o=oa(a),n=o?Array.from(o).map(c=>`#${c.toString(16).padStart(2,"0").toUpperCase()}`):["#F0","#F0","#F0","#F0","#F0","#F0","#F0","#F0"];return`    ; Tile ${l}: ${a.name} colors (fg/bg pairs)
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
    ld bc, ${t.tiles.reduce((a,l)=>{const o=Math.ceil(l.width/8),n=Math.ceil(l.height/8);return a+o*n*8},0)}     ; Total color bytes for all tile characters
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
    ld bc, ${t.tiles.reduce((a,l)=>{const o=Math.ceil(l.width/8),n=Math.ceil(l.height/8);return a+o*n*8},0)}     ; Total color bytes for all tile characters
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
    ld bc, ${t.tiles.reduce((a,l)=>{const o=Math.ceil(l.width/8),n=Math.ceil(l.height/8);return a+o*n*8},0)}     ; Total color bytes for all tile characters
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
`}const ke=8192,Ll=new Set(["header.asm","bios.asm","constants.asm","variables.asm","mapper.asm","interrupt.asm","main.asm","unitedFiles.asm"]);function Rl(t){const e=t.trim().toLowerCase();return e?/^\d+$/.test(e)?parseInt(e,10):/^#([0-9a-f]+)$/.test(e)?parseInt(e.slice(1),16):/^0x([0-9a-f]+)$/.test(e)?parseInt(e.slice(2),16):/^([0-9a-f]+)h$/.test(e)?parseInt(e.slice(0,-1),16):null:null}function Dl(t){let e=0;const a=t.split(/\r?\n/);for(const l of a){const o=l.split(";")[0].trim();if(!o)continue;const n=o.match(/^db\s+(.+)$/i);if(n){e+=n[1].split(",").filter(p=>p.trim().length>0).length;continue}const c=o.match(/^dw\s+(.+)$/i);if(c){e+=c[1].split(",").filter(p=>p.trim().length>0).length*2;continue}const r=o.match(/^ds\s+(.+)$/i);if(r){const p=Rl(r[1]);p!==null&&p>0&&(e+=p)}}return e}function Nl(t){if(!t)return 0;const e=Dl(t),a=new TextEncoder().encode(t).length,l=Math.floor(a*.28);return Math.max(e,l)}function xl(t){const e=Object.entries(t).filter(([r,p])=>!!p&&!Ll.has(r)).map(([r,p])=>({moduleName:r,estimatedBytes:Nl(p)})).filter(r=>r.estimatedBytes>0),a=[];let l=0,o=0,n=0;for(const r of e){let p=r.estimatedBytes,d=0;const u=Math.max(1,Math.ceil(r.estimatedBytes/ke));for(;p>0;){const i=ke-o,h=Math.min(p,i);a.push({moduleName:r.moduleName,chunkBytes:h,bankIndex:l,bankOffset:o,segmentIndex:d,totalSegments:u}),p-=h,n+=h,o+=h,d++,o>=ke&&(l++,o=0)}}const c=n===0?0:o===0?l:l+1;return{bankSize:ke,totalEstimatedBytes:n,banksUsed:c,entries:a}}function Ml(t){const e=[];if(e.push("; ------------------------------------------------------------------"),e.push("; 8KB BANK PACKER ESTIMATE (diagnostic placement view)"),e.push("; Runtime bank constants are derived from label addresses at assemble time."),e.push(`; Estimated payload bytes: ${t.totalEstimatedBytes}`),e.push(`; Estimated banks used: ${t.banksUsed}`),e.push("; ------------------------------------------------------------------"),t.entries.length===0)return e.push("; No banked payload candidates detected."),e.join(`
`);for(const a of t.entries){const l=a.bankOffset.toString(16).toUpperCase().padStart(4,"0"),o=a.totalSegments>1?` part ${a.segmentIndex+1}/${a.totalSegments}`:"";e.push(`; BANK ${a.bankIndex.toString().padStart(2,"0")} @#${l} : ${a.moduleName}${o} (${a.chunkBytes} bytes)`)}return e.join(`
`)}function Pl(t,e,a,l={romMode:"simple32k",targetFormat:"konami",autoMegaROM:!1}){var u,i,h,b,m,s,y,g,A;const o=(i=(u=a.gameFlow)==null?void 0:u.nodes)==null?void 0:i.some(T=>T.type==="SubMenu"),n=(h=a.screenMaps)==null?void 0:h.some(T=>{var S,f;return((S=T.layers)==null?void 0:S.text)||((f=T.textElements)==null?void 0:f.length)>0}),c=(b=a.screenMaps)==null?void 0:b.some(T=>{var S;return((S=T.hudConfiguration)==null?void 0:S.elements)&&T.hudConfiguration.elements.length>0}),r=o||n||c,p=xl(t),d=Ml(p);return`; ==================================================================
; ${e.toUpperCase()} - UNIFIED FILE
; File: unitedFiles.asm
; Description: All-in-one file combining all modular files
; Generated by Mideas MSX Modular Generator
;
; OPTIMIZED: Only includes necessary code for this project
; Tiles: ${((m=a.tiles)==null?void 0:m.length)||0}
; Sprites: ${((s=a.sprites)==null?void 0:s.length)||0}
; Screens: ${((y=a.screenMaps)==null?void 0:y.length)||0}
; Entities: ${((g=a.entities)==null?void 0:g.length)||0}
; Menus: ${o?"Yes":"No"}
; HUD: ${c?"Yes":"No"}
; State Machines: ${((A=a.stateMachines)==null?void 0:A.length)||0}
; ROM Mode: ${l.romMode}
; Mapper Target: ${l.targetFormat}
; Auto MegaROM: ${l.autoMegaROM?"Yes":"No"}
; ==================================================================
${d}

; CRITICAL: header.asm with ORG #4000 and "AB" signature MUST be first
; for the ROM to work correctly. EQUs can go after ORG.
${t["header.asm"]}

${t["bios.asm"]}

${t["constants.asm"]}

${t["variables.asm"]}

${t["mapper.asm"]}

${t["interrupt.asm"]}

${a.tiles&&a.tiles.length>0?t["patterns.asm"]:`; [patterns.asm skipped - no tiles]
`}

${a.tiles&&a.tiles.length>0?t["colors.asm"]:`; [colors.asm skipped - no tiles]
`}

${t["sprites.asm"]}

${a.screenMaps&&a.screenMaps.length>0?t["screens.asm"]:`; [screens.asm skipped - no screens]
`}

${t["components.asm"]}

${a.entities&&a.entities.length>0?t["entities.asm"]:`; [entities.asm skipped - no entities]
`}

${o?t["menus.asm"]:`; [menus.asm skipped - no menus]
`}

${r?t["font.asm"]:`; [font.asm skipped - no text/menus]
`}

${c?t["hud.asm"]:`; [hud.asm skipped - no HUD elements]
`}

${t["sound.asm"]}

${t["scroll.asm"]}

${t["animtiles.asm"]}

${t["particles.asm"]}

${t["statemachine.asm"]&&t["statemachine.asm"].trim()!=="; No State Machines"?t["statemachine.asm"]:`; [statemachine.asm skipped - no state machines]
`}

${a.gameFlow?t["gameflow.asm"]:`; [gameflow.asm skipped - no GameFlow]
`}

${t["worlds.asm"]}

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
    ; Initialize sound system
    call init_sound_system

${a.screenMaps&&a.screenMaps.length>0?`    ; Load the first game screen
    call load_game_screen
`:`    ; No screens - skip screen loading
`}
${r?`    ; Initialize font system
    call init_font_system
`:`    ; No text/menus - skip font initialization
`}${c?`    ; HUD dirty flag - will be rendered after screen loading (by GameFlow WorldLink)
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
`}const We={comp_pos:"Position",comp_position:"Position",comp_render:"Sprite",comp_sprite:"Sprite",comp_movement:"Movement",comp_velocity:"Movement",comp_collision:"Collision",comp_wall_collision:"WallCollision",comp_player_input:"Input",comp_input:"Input",comp_ai_behavior:"Behavior",comp_behavior:"Behavior",comp_health:"Health",comp_animation:"Animation",comp_gravity:"Gravity",comp_jump:"Jump",comp_damage:"Damage",comp_statemachine:"StateMachine",comp_cursors:"Cursors",comp_carry:"Carry",comp_collectible:"Collectible",comp_patrol:"Patrol"};function kl(t,e){var c,r,p;const a=(c=e==null?void 0:e.components)==null?void 0:c.find(d=>d.definitionId==="comp_sprite"||d.definitionId==="comp_render");if(!a)return;const l=a.defaultValues||{},o=((r=t.componentOverrides)==null?void 0:r.comp_sprite)||((p=t.componentOverrides)==null?void 0:p.comp_render)||{},n={...l,...o};return n.spriteId||n.spriteAssetId||n.sprite||n.spriteName}function Xe(t){var n;const e=new Set,a=new Set,l=[],o=new Map;return console.log("🔍 Analyzing component usage..."),console.log(`📊 Total entities in project: ${((n=t.entities)==null?void 0:n.length)||0}`),t.entities&&t.entities.length>0&&t.entities.forEach(c=>{console.log(`  - Entity: ${c.name} (template: ${c.entityTemplateId})`),l.push(c),c.entityTemplateId&&a.add(c.entityTemplateId)}),console.log(`✅ Active entities: ${l.length}`),console.log(`✅ Used templates: ${Array.from(a).join(", ")}`),l.forEach(c=>{var d;const r=c.name||c.id,p=(d=t.templates)==null?void 0:d.find(u=>u.id===c.entityTemplateId);p?(console.log(`  📦 Analyzing template "${p.name}" for entity "${r}"`),p.components&&Array.isArray(p.components)&&p.components.forEach(u=>{const i=u.definitionId||u.componentDefinitionId;if(i){const h=We[i]||i;console.log(`    - Component: ${i} → ${h}`),e.add(h),o.has(h)||o.set(h,new Set),o.get(h).add(r)}}),c.componentOverrides&&Object.keys(c.componentOverrides).forEach(u=>{const i=We[u]||u;console.log(`    - Override: ${u} → ${i}`),e.add(i),o.has(i)||o.set(i,new Set),o.get(i).add(r)})):console.warn(`  ⚠️  Template "${c.entityTemplateId}" not found for entity "${r}"`)}),console.log("📊 Component usage summary:"),console.log(`  - Total used components: ${e.size}`),e.forEach(c=>{const r=o.get(c);console.log(`    • ${c}: ${(r==null?void 0:r.size)||0} entities`)}),{usedComponents:e,usedTemplates:a,activeEntities:l,componentToEntitiesMap:o}}function Ft(t,e,a){var c;let l=0;const o={Position:0,Sprite:1,Movement:2,Collision:3,Input:4,Behavior:5,Health:6,Animation:7,Jump:8,Gravity:9};let n=!1;if(e&&e.components&&e.components.forEach(r=>{const p=r.definitionId||r.componentDefinitionId,d=We[p];d&&o[d]!==void 0&&(l|=1<<o[d],d==="Sprite"&&(n=!0)),d==="Patrol"&&(l|=1<<o.Movement)}),t.componentOverrides&&Object.keys(t.componentOverrides).forEach(r=>{const p=We[r];p&&o[p]!==void 0&&(l|=1<<o[p],p==="Sprite"&&(n=!0))}),l|=1<<o.Position,n)l|=1<<o.Sprite;else{const r=kl(t,e);r&&((c=a.sprites)==null?void 0:c.some(d=>d.id===r||d.name===r))&&(l|=1<<o.Sprite)}return l}const Ol=224,Ul="hex",da=t=>{var n;const e=(t==null?void 0:t.spritePalette)||[],a=t==null?void 0:t.backgroundColor,l=(t==null?void 0:t.frames)||[];if(!e.length||!l.length)return[];const o=[];for(let c=0;c<e.length;c++){const r=e[c];if(!r||r===a)continue;let p=!1;for(const d of l)if(d!=null&&d.data){for(let u=0;u<(d.data.length||0)&&!p;u++)for(let i=0;i<(((n=d.data[u])==null?void 0:n.length)||0)&&!p;i++)d.data[u][i]===r&&(p=!0);if(p)break}p&&o.push(c)}return o},$t=t=>{const e=da(t);return e.length>0?e[0]:-1};function Fl(t){var S,f;const e=t.sprites||[],a=dt(e),l=a.sprites,o=a.nameToIndex,n=a.directionalLookupTables;a.warnings.forEach(_=>{console.warn(`[Sprites Generator] ${_}`)}),console.log("🎨 generateSpritesFile() called:"),console.log(`  - analysis.sprites.length: ${e.length}`),console.log(`  - expandedSprites.length: ${l.length}`),console.log(`  - analysis.entities.length: ${((S=t.entities)==null?void 0:S.length)||0}`),console.log(`  - analysis.templates.length: ${((f=t.templates)==null?void 0:f.length)||0}`);const{activeEntities:c}=Xe(t);console.log(`  - activeEntities.length: ${c.length}`);const r=_=>{if(!_||_.startsWith("rgba"))return null;const E=_.replace("#","");return E.length!==6?null:{r:parseInt(E.substring(0,2),16),g:parseInt(E.substring(2,4),16),b:parseInt(E.substring(4,6),16)}},p=_=>{if(!_)return 0;const E=J.find(D=>D.hex.toUpperCase()===_.toUpperCase());if(E)return E.index;const I=r(_);if(!I)return 15;let C=15,w=1/0;for(const D of J){if(D.index===0)continue;const N=r(D.hex);if(!N)continue;const M=(I.r-N.r)**2+(I.g-N.g)**2+(I.b-N.b)**2;M<w&&(w=M,C=D.index)}return C},d=_=>{if(!_)return[15];const E=_.spritePalette||[],I=_.backgroundColor,C=da(_);if(C.length===0)return[15];const w=C.map(D=>{const N=E[D];return!N||I&&N===I?0:p(N)});return w.length>0?w:[15]},u=(_,E)=>{let I=`${_}:
`;if(E.length===0)return I+=`    db 0
`,I;const C=16;for(let w=0;w<E.length;w+=C){const D=E.slice(w,w+C);I+=`    db ${D.join(", ")}
`}return I},i=_=>{var D,N,M,V,Q,v;console.log(`
🔍 getEntitySpriteInfo for entity: "${_.name}" (template: ${_.entityTemplateId})`),console.log(`   Available sprites: ${l.map(x=>`"${x.name}" (${x.id})`).join(", ")||"NONE"}`);const E=(D=t.templates)==null?void 0:D.find(x=>x.id===_.entityTemplateId);if(!E)return console.log("   ❌ Template not found!"),null;console.log(`   Template found: "${E.name}"`),console.log(`   Template components: ${((N=E.components)==null?void 0:N.map(x=>x.definitionId).join(", "))||"NONE"}`);const I=t.components||[];let C;if(_.componentOverrides)for(const x in _.componentOverrides){const U=I.find(F=>F.id===x),P=(M=U==null?void 0:U.properties)==null?void 0:M.find(F=>F.type==="sprite_ref");if(P&&((V=_.componentOverrides[x])!=null&&V[P.name])){C=_.componentOverrides[x][P.name],console.log(`   ✅ Found spriteAssetId in overrides: "${C}"`);break}}if(!C)for(const x of E.components||[]){const U=I.find(F=>F.id===x.definitionId),P=(Q=U==null?void 0:U.properties)==null?void 0:Q.find(F=>F.type==="sprite_ref");if(P&&((v=x.defaultValues)!=null&&v[P.name])){C=x.defaultValues[P.name],console.log(`   ✅ Found spriteAssetId in template defaults: "${C}"`);break}}if(console.log(`   Resolved spriteAssetId: "${C||"undefined"}"`),!C)return console.log("   ⚠️ No sprite_ref property found in any component"),l.length>0?(console.log(`   ⚠️ Defaulting to first sprite "${l[0].name}"`),{spriteAssetIndex:0,spriteName:l[0].name,colors:d(l[0])}):null;let w=o[C];if(w===void 0&&(w=o[C.toLowerCase()]),w===void 0){const x=C.toLowerCase();w=l.findIndex(U=>{var P,F;return((P=U.name)==null?void 0:P.toLowerCase().includes(x))||x.includes(((F=U.name)==null?void 0:F.toLowerCase())||"")})}return w!==void 0&&w>=0?(console.log(`   ✅ Found sprite "${l[w].name}" at index ${w}`),{spriteAssetIndex:w,spriteName:l[w].name,colors:d(l[w])}):(console.log(`   ❌ Sprite "${C}" not found in project assets`),{spriteAssetIndex:-1,spriteName:`MISSING_${C}`,colors:[15]})},h=[];let b=0;c.forEach((_,E)=>{const I=i(_);if(!I){h.push({entityIndex:E,spriteName:"PLACEHOLDER",spriteAssetIndex:-1,baseHwSpriteIndex:b,layerCount:1,colors:[15]}),b+=1;return}h.push({entityIndex:E,spriteName:I.spriteName,spriteAssetIndex:I.spriteAssetIndex,baseHwSpriteIndex:b,layerCount:I.colors.length,colors:I.colors}),b+=I.colors.length});const m=32;let s=`; ==================================================================
; SPRITE DATA
; File: sprites.asm
; Description: Sprite pattern and animation data
; Entities: ${c.length}
; Total Hardware Sprites (Layers): ${m}
; ==================================================================

; ==================================================================
; SPRITE PATTERN DATA
; ==================================================================
`;l.forEach((_,E)=>{const I=`_${E}`,w=(_.name+I).replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase(),D=Ra(_,Ul,E),N=$t(_);s+=`
; Sprite Asset ${E}: ${_.name}
${D}`,N>=0?s+=`
; Unified pattern label for sprite ${E}
SPRITE_${E}_PATTERN EQU ${w}_F0_LAYER${N}
SPRITE_${E}_PATTERN_BANK EQU ((SPRITE_${E}_PATTERN - #4000) / #2000)
`:s+=`
; WARNING: No valid pattern layers found for sprite ${E}
SPRITE_${E}_PATTERN:
    db 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0
SPRITE_${E}_PATTERN_BANK EQU ((SPRITE_${E}_PATTERN - #4000) / #2000)
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
SPRITE_PLACEHOLDER_PATTERN_BANK EQU ((SPRITE_PLACEHOLDER_PATTERN - #4000) / #2000)

`,l.length===0&&(s+=`; No sprite assets found - using placeholder pattern only 
SPRITE_0_PATTERN EQU SPRITE_PLACEHOLDER_PATTERN
SPRITE_0_PATTERN_BANK EQU ((SPRITE_0_PATTERN - #4000) / #2000)
`),s+=`
; ==================================================================
; SPRITE ANIMATION METADATA TABLES
; ==================================================================

; Table: Sprite Asset Frame Counts
; Format: db frame_count
sprite_asset_frame_count:
`,l.forEach((_,E)=>{var C;const I=((C=_.frames)==null?void 0:C.length)||1;s+=`    db ${I} ; Sprite ${E}: ${_.name}
`}),l.length===0&&(s+=`    db 1 ; Placeholder
`),s+=`
; Table: Sprite Asset Loop Flags
; Format: db flags (bit 1: 1=loop, 0=once)
sprite_loop_flags:
`,l.forEach((_,E)=>{const C=_.loops!==!1?"2":"0";s+=`    db ${C} ; Sprite ${E}: ${_.name}
`}),l.length===0&&(s+=`    db 2 ; Placeholder (loops by default)
`),s+=`
; Table: Sprite Asset Frame Pointer List Table
; Format: dw SPRITE_<id>_FRAME_PTRS
sprite_asset_frame_ptr_table:
`,l.forEach((_,E)=>{s+=`    dw SPRITE_${E}_FRAME_PTRS
`}),l.length===0&&(s+=`    dw SPRITE_0_FRAME_PTRS
`),l.forEach((_,E)=>{var M;const I=`_${E}`,w=(_.name+I).replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase(),D=$t(_),N=((M=_.frames)==null?void 0:M.length)||1;s+=`
; Sprite ${E}: ${_.name} frame pointers
SPRITE_${E}_FRAME_PTRS:
`;for(let V=0;V<N;V++)D>=0?s+=`    dw ${w}_F${V}_LAYER${D}
`:s+=`    dw SPRITE_PLACEHOLDER_PATTERN
`}),l.length===0&&(s+=`
SPRITE_0_FRAME_PTRS:
    dw SPRITE_PLACEHOLDER_PATTERN
`),s+=`
; ==================================================================
; DIRECTIONAL SPRITE LOOKUP TABLES
; Maps any sprite asset index to its directional variant index.
; If no directional variant exists, table points back to same index.
; ==================================================================
`,s+=u("sprite_dir_left_table",n.left),s+=`
`,s+=u("sprite_dir_right_table",n.right),s+=`
`,s+=u("sprite_dir_up_table",n.up),s+=`
`,s+=u("sprite_dir_down_table",n.down),s+=`
`,s+=` 
; ================================================================== 
; SPRITE CONFIGURATION TABLES 
; ================================================================== 

; Table: Entity Sprite Configuration 
; Format: db base_hw_sprite_index, layer_count 
entity_sprite_config: 
`,h.forEach(_=>{const E=_.baseHwSpriteIndex>=0?_.baseHwSpriteIndex:0;s+=`    db ${E}, ${_.layerCount} ; Entity ${_.entityIndex} (${_.spriteName})
`}),h.length<32&&(s+=`    ds ${(32-h.length)*2}, 0 ; Padding
`),s+=`
; Table: Entity -> Sprite Asset Index (ROM initial values)
; Copied to RAM entity_sprite_asset_index at init
; Format: db sprite_asset_index (#FF = none)
entity_sprite_asset_index_init:
`,h.forEach(_=>{const E=_.spriteAssetIndex>=0?_.spriteAssetIndex:255;s+=`    db #${E.toString(16).toUpperCase().padStart(2,"0")} ; Entity ${_.entityIndex} (${_.spriteName})
`}),h.length<32&&(s+=`    ds ${32-h.length}, #FF ; Padding
`);const y=Math.max(1,...h.map(_=>_.layerCount));s+=`SPRITE_MAX_ENTITY_LAYERS EQU ${y}  ; Max HW sprite layers per entity
`,s+=`
; Table: Hardware Sprite Layer Colors (ROM initial values - copied to RAM at init)
; Format: db color_index
sprite_layer_colors_init:
`;let g=0;h.forEach(_=>{_.layerCount>0&&(s+=`    ; Entity ${_.entityIndex} (${_.spriteName}) layers:
`,_.colors.forEach((E,I)=>{s+=`    db ${E} ; Layer ${I}
`,g+=1}))});const A=m-g;if(A>0&&(s+=`    ds ${A}, 0 ; Padding
`),s+=`
; Table: SM Sprite Layer Colors (for Action_ChangeSprite runtime color update)
; Format: SPRITE_MAX_ENTITY_LAYERS bytes per sprite asset
; Entry[i*SPRITE_MAX_ENTITY_LAYERS + j] = color for HW sprite slot j of sprite i
SM_SpriteLayerColorTable:
`,l.forEach((_,E)=>{const C=[...d(_)];for(;C.length<y;)C.push(0);s+=`    db ${C.join(", ")} ; Sprite ${E}: ${_.name}
`}),l.length===0){const _=Array(y).fill(0);s+=`    db ${_.join(", ")} ; Placeholder
`}s+=`
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
`;let T=!1;if(h.forEach(_=>{if(_.layerCount===0)return;const E=_.spriteAssetIndex<0?"SPRITE_PLACEHOLDER_PATTERN":`SPRITE_${_.spriteAssetIndex}_PATTERN`;s+=`    ; Entity ${_.entityIndex}: ${_.spriteName} (${_.layerCount} layers)
    ; Base HW Sprite: ${_.baseHwSpriteIndex}
    ld a, ${E}_BANK
    call mapper_set_bank_p2
    ld hl, ${E}
    ld de, SPRPAT + (${_.baseHwSpriteIndex} * 32)
    ld bc, ${_.layerCount*32} ; Load ${_.layerCount} layers (32 bytes each)
    call FAST_LDIRVM
`,T=!0}),!T)if(l.length===0)s+=`    ; No sprites to load
`;else{s+=`    ; No active entities detected, load all sprite assets sequentially
`;let _=0;l.forEach((E,I)=>{var N;const C=d(E).length||1,w=((N=E.frames)==null?void 0:N.length)||1,D=C*w*32;s+=`    ; Sprite Asset ${I}: ${E.name} (${w} frames, ${C} layers)
    ld a, SPRITE_${I}_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, SPRITE_${I}_PATTERN
    ld de, SPRPAT + (${_} * 32)
    ld bc, ${D}
    call FAST_LDIRVM
`,_+=C*w})}return s+=`    call mapper_pop_p2
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
    ld b, ${m}
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
    ld bc, ${m*4}  ; 4 bytes per sprite
    call FAST_LDIRVM
    ret

; ==================================================================
; SPRITE CONSTANTS
; ==================================================================
SPRITE_INVISIBLE    EQU ${Ol}

; ==================================================================
; RAM REQUIREMENTS
; ==================================================================
; sprite_attributes: ds ${m*4}
; active_sprite_count: db 0
; sprites_dirty: db 0
`,s}function $l(t,e){let a=`
; ==================================================================
; UPDATE ALL ENTITIES - Called by GameFlow (OPTIMIZED)
; ==================================================================
; Only calls component systems that are actually used in this project
; Unused systems are NOT called (saves Z80 cycles)
${z({purpose:"Main ECS tick entrypoint for one frame.",inputs:["Entity/component tables in RAM"],outputs:["Components updated in fixed order"],clobbers:["AF","BC","DE","HL"],preserved:["None (callers should save what they need)"],usage:["Registers are scratch across component CALL chain","Contract intentionally conservative to prevent hidden coupling"],notes:["Do not assume any register survives this routine."]})}
update_all_entities:
    ; Rebuild entity list only when invalidated (spawn/despawn/screen change)
    call ensure_used_entity_list_current
`;const l=[["Input","update_input_component","1. Input (player control)"],["Shoot","update_shoot_component","2. Shooting"],["Behavior","update_behavior_component","3. Behavior/AI"],["Patrol","update_entities","3b. Patrol/per-entity update"],["StateMachine","update_statemachine_component","3c. State machine logic"],["Jump","update_jump_component","4. Jump impulse"],["Movement","update_movement_component","5. Movement"],["Cursors","update_cursors_component","5b. Cursors movement"],["Gravity","update_gravity_component","6. Gravity"],["TileInteraction","update_slash_component","6b. Additive slash velocity"],["Position","update_position_component","7. Apply velocity"],["Collision","prepare_platform_detection","8a. Clear platform refs"],["Collision","update_collision_component","8b. Collision detection"],["Collision","update_platform_riding","8c. Platform riding"],["WallCollision","update_wallcollision_component","8d. Wall collision"],["TileInteraction","check_tile_interaction","8e. Tile interaction (gems/collectibles)"],["Health","update_health_component","9. Health/Death"],["Damage","update_damage_component","10. Damage"],["Animation","update_animation_component","11. Animation"],["AutoDestroy","update_auto_destroy_component","12. Auto-destroy"],["Sprite","update_sprite_component","13. Sprite rendering"]];let o=0;const n=new Set;for(const[c,r,p]of l)if(c==="Position"||c==="Sprite"||t.has(c)){if(e&&r==="update_statemachine_component")continue;n.has(r)||(n.add(r),a+=`    call ${r.padEnd(30)} ; ${p}
`,r==="update_shoot_component"&&(a+=`    ; Shooting may spawn entities, rebuild only if marked dirty
`,a+=`    call ensure_used_entity_list_current
`),o++)}return a+=`    ret
`,a+=`; Total systems called: ${o} (optimized from 16)

`,a+=`
; ------------------------------------------------------------------
; mark_used_entity_list_dirty
; Invalidate compact entity list cache.
; Call this after spawn/despawn or screen-id changes.
; ------------------------------------------------------------------
${z({purpose:"Mark compact active-entity cache as stale.",inputs:["None"],outputs:["active_entity_list_dirty = 1"],clobbers:["HL"],preserved:["AF","BC","DE"],usage:["HL = points to dirty flag byte"]})}
mark_used_entity_list_dirty:
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ret

; ------------------------------------------------------------------
; ensure_used_entity_list_current
; Rebuild compact list only when marked dirty.
; ------------------------------------------------------------------
${z({purpose:"Conditionally rebuild compact active list only when dirty.",inputs:["active_entity_list_dirty flag"],outputs:["active_entity_list rebuilt if needed"],clobbers:["AF"],preserved:["BC","DE","HL (except nested call clobbers when rebuild happens)"],usage:["A = dirty flag test and branch"],notes:["If dirty, downstream rebuild_used_entity_list can clobber many registers."]})}
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
${z({purpose:"Recompute compact list of entities active on current screen.",inputs:["entity_active, entity_comp_masks(_hi), entity_screen_id, current_screen_id"],outputs:["active_entity_list[]","active_entity_count","active_entity_list_dirty=0"],clobbers:["AF","BC","DE","HL"],preserved:["None"],usage:["C = entity slot iterator","DE = index offset (entity id / active list position)","HL = pointer math over component and state arrays","A = predicate checks and counters"]})}
rebuild_used_entity_list:
    xor a
    ld (active_entity_count), a
    ld c, 0

.rebuild_loop:
    ld a, c
    cp MAX_ENTITIES
    jr z, .rebuild_done

    ld e, c
    ld d, 0
    ld hl, entity_active
    add hl, de
    ld a, (hl)
    or a
    jr z, .next_entity

    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    ld hl, entity_comp_masks_hi
    add hl, de
    or (hl)
    jr z, .next_entity

    ; Keep only entities from currently visible screen
    ld hl, entity_screen_id
    add hl, de
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .next_entity

    ld hl, active_entity_count
    ld a, (hl)
    cp MAX_ENTITIES
    jr nc, .next_entity

    ld e, a
    ld d, 0
    ld hl, active_entity_list
    add hl, de
    ld (hl), c
    ld hl, active_entity_count
    inc (hl)

.next_entity:
    inc c
    jr .rebuild_loop

.rebuild_done:
    xor a
    ld (active_entity_list_dirty), a
    ret
`,a}function Bl(){return`
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

    ; Skip entities that are not in the currently active screen
    ; Preserve HL because it is the entity_comp_masks loop pointer.
    push hl
    ld hl, entity_screen_id
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    pop hl
    jp nz, position_next_entity

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
`}function jl(t){return`
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
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a                    ; Loop through used entities only
    ld hl, active_entity_list

sprite_update_loop:
    ld c, (hl)                 ; C = entity index
    inc hl                     ; Advance list pointer
    push hl                    ; Save list pointer
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)                 ; Get entity component mask
    pop hl                     ; Restore list pointer
    and COMP_MASK_SPRITE       ; Check if has sprite component
    jp z, sprite_next_entity   ; Skip if no sprite component (jp because distance > 127 bytes)

    ; Skip inactive entities (prevents ghost sprite rendering)
    push hl
    ld hl, entity_active
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    pop hl
    or a
    jp z, sprite_next_entity

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
    
    jr sprite_continue

sprite_hide:
    ; Entity is in different screen - hide sprite (Y = 208+)
    ; We must hide ALL layers for this entity
    ; E contains Entity Index (from line 129)
    ; D = 0 (from line 130)

    ld hl, entity_sprite_config
    add hl, de
    add hl, de

    inc hl                     ; Point to Layer Count first
    ld b, (hl)                 ; B = Layer Count
    dec hl                     ; Back to Base HW Sprite
    ld a, b
    or a
    jr z, sprite_continue      ; Nothing to hide for anchor entities
    ld a, (hl)                 ; A = Base HW Sprite (read AFTER zero check)

sprite_hide_loop:
    push bc
    push af
    call hide_sprite           ; A = HW Sprite (correct base index)
    pop af
    pop bc

    inc a                      ; Next HW Sprite
    djnz sprite_hide_loop

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
`}function Hl(){return`
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
    `}function zl(t){const n=Array.from({length:3},(p,d)=>`    srl a                      ; A = X / ${Math.pow(2,d+1)}`).join(`
`),c=Array.from({length:3},(p,d)=>`    srl a                      ; A = Y / ${Math.pow(2,d+1)}`).join(`
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
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a                       ; Loop through used entities only
    ld hl, active_entity_list

    collision_update_loop:
    ld c, (hl)                    ; C = entity index
    inc hl                        ; Advance list pointer
    push hl                       ; Save list pointer

    ; Check if entity has Collision OR Gravity component
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)                    ; Get low byte (Collision is bit 3)
    and COMP_MASK_COLLISION
    jr nz, .has_collision_comp    ; Has Collision component

    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)                    ; Get high byte (Gravity is bit 1)
    and #02                       ; COMP_MASK_GRAVITY high byte
    jp z, collision_next_entity   ; Skip if no collision or gravity (JP for long jump)

.has_collision_comp:
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
    ; Check for deadly tile collision (lava, spikes, etc.)
    ; Get entity position (x, y)
    ld hl, entity_x_pos
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = X position (keep DE as entity index)

    ld hl, entity_y_pos
    add hl, de
    ld e, (hl)                    ; E = Y position
    ld d, a                       ; D = X position

    ; Get tile at entity's feet position (center-bottom)
    push bc
    push de
    ld a, d
    add a, 8                      ; Center X (assuming 16-pixel wide entity)
    ld d, a
    ld a, e
    add a, 15                     ; Bottom Y (assuming 16-pixel tall entity)
    ld e, a
    call get_tile_at_position     ; A = tile ID
    call get_tile_behavior        ; A = behavior flags
    pop de
    pop bc

    ; Check if tile is deadly (bit 3 = TILE_DEADLY)
    bit 3, a
    jr z, .no_deadly_tile         ; Not deadly, safe

    ; Entity is touching deadly area - set flag
    ld hl, entity_deadly_collision
    ld e, c
    ld d, 0
    add hl, de
    set 0, (hl)                   ; Mark as touching deadly tile
    jr .deadly_check_done

.no_deadly_tile:
    ; Clear deadly tile flag
    ld hl, entity_deadly_collision
    ld e, c
    ld d, 0
    add hl, de
    res 0, (hl)                   ; Clear deadly flag

.deadly_check_done:
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

    ; === PHASE 1: Build active list ===
    ld hl, coll_list              ; HL = write pointer into coll_list
    xor a
    ld (coll_list_count), a       ; count = 0
    ld c, 0                       ; C = entity index 0..31

.build_loop:
    ld a, c
    cp 32
    jp z, .build_done

    ; Clear collision flags for ALL entities with collision component
    push hl                       ; Save list write pointer
    ld e, c
    ld d, 0

    ; Check active
    ld hl, entity_active
    add hl, de
    ld a, (hl)
    or a
    jp z, .build_skip

    ; Check collision component
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_COLLISION
    jp z, .build_skip

    ; Clear collision flags for this entity (even if wrong screen)
    ld hl, entity_entity_collision_flags
    add hl, de
    ld (hl), 0
    ld hl, entity_last_collision_entity
    add hl, de
    ld (hl), 255

    ; Check screen match
    ld hl, entity_screen_id
    add hl, de
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jp nz, .build_skip

    ; Entity qualifies - add to list (max MAX_ENTITIES)
    ld a, (coll_list_count)
    cp MAX_ENTITIES
    jp nc, .build_skip            ; List full

    ; Store entity index in coll_list
    pop hl                        ; Restore list write pointer
    ld (hl), c                    ; coll_list[count] = entity index
    inc hl                        ; Advance write pointer
    push hl                       ; Save updated write pointer

    ld a, (coll_list_count)
    inc a
    ld (coll_list_count), a

.build_skip:
    pop hl                        ; Restore list write pointer
    inc c
    jp .build_loop

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
${c}
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

        `}function Vl(t="simple32k"){return`
    ; ------------------------------------------------------------------
    ; get_behavior_tile
    ; ------------------------------------------------------------------
${z({purpose:"Read behavior byte for tile at (B=row, C=column) from the runtime behavior map.",inputs:["B = tile row    (0..23, out-of-range → A=0, passable)","C = tile column (0..31, out-of-range → A=0, passable)","current_behavior_map = 16-bit pointer to active screen behavior map","current_behavior_map_bank = memory bank number (mapper context)"],outputs:["A = behavior byte:","  bits 7-4 (A & #F0): family / solidity class (0x00 = NoSolid, 0x10+ = Solid)","  bits 3-0 (A & #0F): flag bits (e.g. 0x08 = Interactable)"],clobbers:["AF"],preserved:["BC","DE","HL"],notes:["Maintains a single-row cache (behavior_cache_row / behavior_cache_row_base)","so consecutive calls for the same row skip the row*32 multiply.","Mapper push/pop protects P2 bank around the map read (no-op in simple32k mode).","MUST be called with DE = entity index already set (DE is preserved, not used)."]})}
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
${t==="simple32k"?`
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
    `}function Gl(){return`
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
            ld a, (active_entity_count)
            or a
            ret z
            ld b, a                    ; Loop through used entities only
            ld hl, active_entity_list

        input_update_loop:
            ld c, (hl)                 ; C = entity index
            inc hl                     ; Advance list pointer
            push hl                    ; Save list pointer
            ld e, c
            ld d, 0
            ld hl, entity_comp_masks
            add hl, de
            ld a, (hl)                 ; Get entity component mask
            pop hl                     ; Restore list pointer
            and COMP_MASK_INPUT        ; Check if has input component
            jp z, input_next_entity    ; Skip if no input component

            ; Skip entities that are not in the currently active screen
            ; Preserve HL because it is the entity_comp_masks loop pointer.
            push hl
            ld hl, entity_screen_id
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            ld hl, current_screen_id
            cp (hl)
            pop hl
            jp nz, input_next_entity

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
    `}function Wl(){return`
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
    `}function Yl(){return`
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

    ; Skip entities that are not in the currently active screen
    ; Preserve HL because it is the entity_comp_masks_hi loop pointer.
            push hl
            ld hl, entity_screen_id
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            ld hl, current_screen_id
            cp (hl)
            pop hl
            jp nz, gravity_next_entity

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
    `}function Ql(){return`
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
    `}function Xl(){return`
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
    `}function Kl(){return`
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
    `}function Zl(){return`
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
    `}function ql(){return`
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
            ld a, (active_entity_count)
            or a
            ret z
            ld b, a                    ; Loop used entities only
            ld hl, active_entity_list

        .anim_loop:
            ld c, (hl)                 ; C = entity index
            inc hl                     ; Advance list pointer
            push hl                    ; Save list pointer
            ld e, c
            ld d, 0
            ld hl, entity_comp_masks
            add hl, de
            ld a, (hl)
            pop hl                     ; Restore list pointer
            and COMP_MASK_ANIMATION | COMP_MASK_SPRITE
            cp COMP_MASK_ANIMATION | COMP_MASK_SPRITE
            jp nz, .anim_next_entity

            ; Skip inactive entities
            push hl
            ld hl, entity_active
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            pop hl
            or a
            jp z, .anim_next_entity

            ; Skip entities that are not in the currently active screen
            ; Preserve HL because it is the entity_comp_masks loop pointer.
            push hl
            ld hl, entity_screen_id
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            ld hl, current_screen_id
            cp (hl)
            pop hl
            jp nz, .anim_next_entity

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
    `}function Jl(){return`
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
    `}function eo(){return`
    ; ==================================================================
    ; AUTO-DESTROY COMPONENT SYSTEM
    ; ==================================================================
    ; Entities with AUTO_DESTROY component have a lifetime counter
    ; When lifetime reaches 0, entity is automatically destroyed
    ; Useful for: projectiles, particles, temporary effects, etc.

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
    `}function to(){return`
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
    `}function ao(){return`
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
    `}function lo(t="simple32k"){return`
    ; ==================================================================
    ; WALL COLLISION COMPONENT SYSTEM
    ; ==================================================================
    ; Prevents entities from moving through walls
    ; Uses per-entity hitbox (offset + width/height)
    ; Snaps entity position to wall edge AND zeros velocity

init_wallcollision_system:
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
;     - entity_comp_masks[]     : low byte component bitmask
;     - entity_comp_masks_hi[]  : high byte (COMP_MASK_GRAVITY at bit 1)
;     - entity_collides_with[]  : must include COLLISION_LAYER_PLATFORM (#08)
;     - entity_screen_id[]      : entity must be on current_screen_id
;     - entity_x_pos/y_pos[]    : world position
;     - entity_vel_x/vel_y[]    : signed 8-bit velocity (negative = left/up)
;     - entity_gravity_vel[]    : 16-bit signed gravity accumulator (word)
;     - entity_collision_offset_x/y[]: signed offset from origin to hitbox corner
;     - entity_collision_hitbox_w/h[]: hitbox size (minimum 1 if zero)
;     - current_behavior_map    : pointer to active screen behavior map
;     - current_screen_id       : ID of the visible screen
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
;     - Opt-C: wall_build_hitbox_cache is skipped on DOWN snap when new Y == current Y
;       (entity already on floor). Saves ~200 cycles/entity/frame when standing still.
;     - wall_build_hitbox_cache is called once at entity entry, and after each snap
;       where the position actually changes.
;     - Gravity floor check (.check_wall_y_gravity) runs even when vel_y=0
;       so entity_on_ground stays accurate when entity is standing still.
; ------------------------------------------------------------------
update_wallcollision_component:
    ; Opt-B: use compact active_entity_list instead of 0..MAX_ENTITIES scan.
    ; Entities in the list are already guaranteed active and on current_screen_id.
    ; This eliminates ~29 wasted iterations when only 3 entities are active.
    call ensure_used_entity_list_current
    ld a, (active_entity_count)
    or a
    ret z                         ; no active entities → done
    ld b, a                       ; B = entity count (loop counter for djnz)
    ld hl, active_entity_list

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
    and #F0
    jp nz, .wall_left_blocked

    ; Check point 2: adaptive bottom probe (safe for small hitboxes)
    ; probe_bottom = hitbox_bottom - inset ≤ 191 → row ≤ 23, col = (left-1)/8 ≤ 31 → NB safe
    ld a, (wall_probe_bottom)
    srl a
    srl a
    srl a
    ld b, a                       ; Row = bottom / 8
    call get_behavior_tile_nb
    and #F0
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
    and #F0
    jp nz, .wall_right_blocked

    ; Check point 2: adaptive bottom probe (safe for small hitboxes)
    ; probe_bottom ≤ 191 → row ≤ 23, col = (right+1)/8 ≤ 31 → NB safe
    ld a, (wall_probe_bottom)
    srl a
    srl a
    srl a
    ld b, a                       ; Row = bottom / 8
    call get_behavior_tile_nb
    and #F0
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
    and #F0
    jp nz, .wall_up_blocked

    ; Check point 2: adaptive right probe (safe for small hitboxes)
    ld a, (wall_probe_right)
    srl a
    srl a
    srl a
    ld c, a                       ; Column = right / 8
    call get_behavior_tile
    and #F0
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
    and #F0
    jp nz, .wall_down_blocked

    ; Check point 2: adaptive right probe (safe for small hitboxes)
    ld a, (wall_probe_right)
    srl a
    srl a
    srl a
    ld c, a                       ; Column = right / 8
    call get_behavior_tile
    and #F0
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
    `}function oo(t){const e={};return(t||[]).forEach((a,l)=>{const o=typeof(a==null?void 0:a.id)=="string"?a.id:"",n=typeof(a==null?void 0:a.name)=="string"?a.name:"";o&&(e[o]=l,e[o.toLowerCase()]=l),n&&(e[n]=l,e[n.toLowerCase()]=l)}),e}function Oe(t,e){if(typeof t=="number"&&Number.isFinite(t))return Math.max(0,Math.min(255,t|0));if(typeof t=="string"){const a=t.trim();if(!a)return null;const l=e[a];if(l!==void 0)return l;const o=e[a.toLowerCase()];if(o!==void 0)return o;const n=parseInt(a,10);if(!isNaN(n))return Math.max(0,Math.min(255,n))}return null}function Ue(t){const e=Number(t);return!Number.isFinite(e)||e<=0?0:Math.max(0,Math.min(65535,Math.round(e)))}function Fe(t){const e=Number(t);return!Number.isFinite(e)||e<=0?0:Math.max(0,Math.min(255,Math.round(e)))}function no(t){const e={};if(!t||t.length===0)return e;let a=128;return t.forEach(l=>{if(!l||!l.id)return;e[l.id]=a,l.name&&(e[String(l.name)]=a,e[String(l.name).toLowerCase()]=a);const o=Math.max(1,Math.ceil((Number(l.width)||8)/8)),n=Math.max(1,Math.ceil((Number(l.height)||8)/8));a+=o*n}),e}function Se(t,e){if(typeof t=="string"&&e){if(e[t]!==void 0)return e[t];const l=t.toLowerCase();if(e[l]!==void 0)return e[l]}const a=parseInt(String(t??""),10);return Number.isNaN(a)?0:Math.max(0,Math.min(255,a|0))}function ro(t){const e={},a=Array.isArray(t.globalVariables)?t.globalVariables:[];for(const l of a){const o=typeof(l==null?void 0:l.name)=="string"?l.name.trim():"",n=typeof(l==null?void 0:l.asmName)=="string"?l.asmName.trim():"";if(!o||!n)continue;const c=String((l==null?void 0:l.type)||"").toLowerCase(),r=c==="word"||c==="16bit";e[o]={asmName:n,isWord:r},e[o.toLowerCase()]={asmName:n,isWord:r},e[n]={asmName:n,isWord:r},e[n.toLowerCase()]={asmName:n,isWord:r}}return e}function Bt(t,e){if(typeof t!="string")return null;const a=t.trim();return a&&(e[a]||e[a.toLowerCase()])||null}function jt(t){return!t||t.isEnabled===!1||t.isEnabled==="false"?null:{collectionSoundId:t.collectionSoundId,replacementTileId:t.replacementTileId,targetVariable:t.targetVariable??t.scoreVariable??t.scoreVariableName,incrementAmount:t.incrementAmount??t.scoreAmount??t.collectionValue??0,bonusTileId:t.bonusTileId,bonusReplacementTileId:t.bonusReplacementTileId,bonusSoundId:t.bonusSoundId,bonusIsPersistent:t.bonusIsPersistent,bonusEntityEffect:t.bonusEntityEffect,bonusEffectAmount:t.bonusEffectAmount,bonusSlashStrength:t.bonusSlashStrength,bonusRespawnSeconds:t.bonusRespawnSeconds}}function io(t){var c,r;const e=oo(t.sounds),a=ro(t),l=no(t.tiles),o=Array.isArray(t.entities)?t.entities:[];for(const p of o){const d=jt((c=p==null?void 0:p.componentOverrides)==null?void 0:c.comp_tile_collector);if(!d)continue;const u=Oe(d.collectionSoundId,e),i=Se(d.replacementTileId??0,l),h=Bt(d.targetVariable,a),b=Ue(d.incrementAmount),m=d.bonusTileId?Se(d.bonusTileId,l):null,s=Se(d.bonusReplacementTileId??0,l),y=Oe(d.bonusSoundId,e),g=d.bonusIsPersistent===!0||d.bonusIsPersistent==="true",A=typeof d.bonusEntityEffect=="string"?d.bonusEntityEffect.trim().toLowerCase():"none",T=Ue(d.bonusEffectAmount),S=Fe(d.bonusSlashStrength??8),f=Fe(d.bonusRespawnSeconds);if(u!==null||i!==0||h&&b>0||m!==null||y!==null||A!=="none"&&T>0||m!==null&&f>0)return{soundAssetIndex:u,replacementTileChar:i,targetVariable:h,incrementAmount:b,bonusTileChar:m,bonusReplacementTileChar:s,bonusSoundAssetIndex:y,bonusIsPersistent:g,bonusEntityEffect:A,bonusEffectAmount:T,bonusSlashStrength:S,bonusRespawnSeconds:f}}const n=Array.isArray(t.templates)?t.templates:[];for(const p of n){const d=(r=p==null?void 0:p.components)==null?void 0:r.find(E=>E.definitionId==="comp_tile_collector");if(!d)continue;const u=jt(d.defaultValues||{});if(!u)continue;const i=Oe(u.collectionSoundId,e),h=Se(u.replacementTileId??0,l),b=Bt(u.targetVariable,a),m=Ue(u.incrementAmount),s=u.bonusTileId?Se(u.bonusTileId,l):null,y=Se(u.bonusReplacementTileId??0,l),g=Oe(u.bonusSoundId,e),A=u.bonusIsPersistent===!0||u.bonusIsPersistent==="true",T=typeof u.bonusEntityEffect=="string"?u.bonusEntityEffect.trim().toLowerCase():"none",S=Ue(u.bonusEffectAmount),f=Fe(u.bonusSlashStrength??8),_=Fe(u.bonusRespawnSeconds);if(i!==null||h!==0||b&&m>0||s!==null||g!==null||T!=="none"&&S>0||s!==null&&_>0)return{soundAssetIndex:i,replacementTileChar:h,targetVariable:b,incrementAmount:m,bonusTileChar:s,bonusReplacementTileChar:y,bonusSoundAssetIndex:g,bonusIsPersistent:A,bonusEntityEffect:T,bonusEffectAmount:S,bonusSlashStrength:f,bonusRespawnSeconds:_}}return{soundAssetIndex:null,replacementTileChar:0,targetVariable:null,incrementAmount:0,bonusTileChar:null,bonusReplacementTileChar:0,bonusSoundAssetIndex:null,bonusIsPersistent:!1,bonusEntityEffect:"none",bonusEffectAmount:0,bonusSlashStrength:8,bonusRespawnSeconds:0}}function so(t,e){var S,f;const a=t.soundAssetIndex,l=t.replacementTileChar,o=Math.max(1,Math.min(32,t.bonusSlashStrength||8)),n=Math.max(1,o-1),c=Math.max(1,o-2),r=`#${(256-o&255).toString(16).toUpperCase().padStart(2,"0")}`,p=`#${(256-n&255).toString(16).toUpperCase().padStart(2,"0")}`,d=`#${(256-c&255).toString(16).toUpperCase().padStart(2,"0")}`,u=a!==null&&e?`    ; Tile Collector UI-configured collection sound.
    ; Preserve DE because it still carries the tile index for persistence.
    push de
    ld a, ${a}
    call SM_PlaySoundAsset
    pop de
`:a!==null?`    ; collectionSoundId is configured in the Tile Collector UI,
    ; but this build has no state-machine sound asset runtime.
    ; Stay silent instead of forcing the wrong built-in beep.
`:`    ; No collectionSoundId configured in the Tile Collector UI.
`,i=t.bonusSoundAssetIndex!==null&&e?`    ; Tile Collector bonus pickup sound.
    push de
    ld a, ${t.bonusSoundAssetIndex}
    call SM_PlaySoundAsset
    pop de
`:t.bonusSoundAssetIndex!==null?`    ; bonusSoundId is configured, but this build has no state-machine sound asset runtime.
`:`    ; No bonusSoundId configured.
`,h=((S=t.targetVariable)==null?void 0:S.asmName)==="global_var_score"?`    ; Keep HUD Score text in sync with the updated global variable.
    push de
    ld a, (${t.targetVariable.asmName})
    ld l, a
    ld a, (${t.targetVariable.asmName}+1)
    ld h, a
    call update_hud_score
    call force_render_hud
    pop de
`:((f=t.targetVariable)==null?void 0:f.asmName)==="global_var_lives"?`    ; Keep HUD Lives text in sync with the updated global variable.
    push de
    ld a, (${t.targetVariable.asmName})
    call update_hud_lives
    call force_render_hud
    pop de
`:"",b=t.targetVariable&&t.incrementAmount>0?t.targetVariable.isWord?`    ; Tile Collector configured variable increment (16-bit).
    ld hl, ${t.targetVariable.asmName}
    ld a, (hl)
    add a, ${t.incrementAmount&255}
    ld (hl), a
    inc hl
    ld a, (hl)
    adc a, ${t.incrementAmount>>8&255}
    ld (hl), a
${h}
`:`    ; Tile Collector configured variable increment (8-bit).
    ld hl, ${t.targetVariable.asmName}
    ld a, (hl)
    add a, ${Math.min(255,t.incrementAmount)}
    ld (hl), a
${h}
`:`    ; No targetVariable/incrementAmount configured in the Tile Collector UI.
`,m=t.bonusEntityEffect==="grant_extra_jump"&&t.bonusEffectAmount>0?`    ; Bonus tile effect: arm an additive slash for the collecting entity.
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
    ld (hl), ${c}
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
    ld (hl), ${p}
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
`,s=t.bonusTileChar!==null?`    ld a, b
    cp ${t.bonusTileChar}
    jp z, .ti_collect_bonus
`:"",y=t.bonusIsPersistent?`    ; Bonus tile configured as persistent: record it like a normal collectible.
    jp .ti_record_persistent
`:`    ; Bonus tile is visit-local only: do not persist across screen reloads.
    jp .ti_next
`,g=t.bonusTileChar!==null&&t.bonusRespawnSeconds>0,A=g?`    ; Timed bonus respawn enabled: queue tile restoration and skip persistence.
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

    ; Skip entities not on the current screen
    ld e, c
    ld d, 0
    ld hl, entity_screen_id
    add hl, de
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jp nz, .slash_next

    push bc

    ld hl, entity_slash_vel_x
    add hl, de
    ld a, (hl)
    or a
    jp z, .slash_done_entity

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

.slash_done_entity:
    pop bc

.slash_next:
    pop hl
    dec b
    jp nz, .slash_loop
    ret

${g?`
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
    ld (hl), ${t.bonusRespawnSeconds}
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
    ld a, ${t.bonusTileChar}
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
;   and persistent collected-tile state.
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
    ld a, (active_entity_count)
    or a
    jp z, .ti_respawn_only         ; No active entities

    ld hl, active_entity_list
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

${s}

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

${b}

${u}

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
    ld a, ${t.bonusReplacementTileChar}
    call FAST_WRTVRM

${m}

${i}

${A}

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
`}function co(){return`
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
`}function po(){return`
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

    ; Assume entity 0 is player - check collision with player
    ; Get collectible position
    ld hl, entity_x_pos
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = collectible X

    ; Get player X position
    ld hl, entity_x_pos
    ld e, 0                       ; Entity 0 = player
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
    ld e, 0
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
    `}function _o(){return` 
    ; ================================================================== 
        ; ENTITY MANAGEMENT FUNCTIONS(Based on EntityTemplate system) 
    ; ================================================================== 

        ; Create entity with components(A = entity ID, B = mask low byte, C = mask high byte) 
        create_entity:
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

    ; Initialize component data based on mask
            bit 0, b; Check COMP_MASK_POSITION (low byte)
            call nz, init_entity_position

            bit 1, b; Check COMP_MASK_SPRITE (low byte)
            call nz, init_entity_sprite

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
    `}function ho(t){const e=t.usedComponents;let a=`init_components: 
; Initialize component systems(OPTIMIZED - only used components) 
    ; Used: ${Array.from(e).join(", ")} 
 
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
    `),a+=`    ; Initialize auto-destroy system
    call init_auto_destroy_system
    `,e.has("Cursors")&&(a+=`    ; Initialize cursors system (stub)
    call init_cursors_system
    `),e.has("StateMachine")&&(a+=`    ; Initialize state machine system (stub)
    call init_statemachine_system
    `),e.has("Carry")&&(a+=`    ; Initialize carry system (stub)
    call init_carry_system
    `),e.has("Damage")&&(a+=`    ; Initialize damage system
    call init_damage_system
    `),e.has("Shoot")&&(a+=`    ; Initialize shoot system
    call init_shoot_system
    `),a+=`    ; Initialize platform riding system
    call init_platform_riding_system
    `,e.has("WallCollision")&&(a+=`    ; Initialize wall collision system (stub)
    call init_wallcollision_system
    `),e.has("Collectible")&&(a+=`    ; Initialize collectible system (stub)
    call init_collectible_system
    `),e.has("TileInteraction")&&(a+=`    ; Initialize tile interaction system
    call init_tile_interaction_system
    `),a+=`
    ret
    `,a}function ca(t,e="simple32k"){if(!t.entities||t.entities.length===0)return`; ==================================================================
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
entity_deadly_collision EQU temp_byte_8
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
        `;const a=Xe(t),l=a.usedComponents,o=Array.isArray(t.tiles)&&t.tiles.some(b=>{var m;return((((m=b.logicalProperties)==null?void 0:m.mapId)??0)&8)!==0}),n=io(t),c=Array.isArray(t.stateMachines)&&t.stateMachines.length>0;o&&l.has("Input")&&l.add("TileInteraction");const r=(b,m)=>{if(!b||typeof b!="object")return!1;const s=String(b.type||"").toUpperCase();if(m.has(s))return!0;const y=Array.isArray(b.conditions)?b.conditions:[];for(const g of y)if(r(g,m))return!0;return!1},p=Array.isArray(t.stateMachines)?t.stateMachines:[],d=new Set(["HAS_COLLISION","HAS_DEADLY_TILE_COLLISION"]);p.some(b=>(Array.isArray(b==null?void 0:b.transitions)?b.transitions:[]).some(s=>r(s==null?void 0:s.conditions,d)))&&!l.has("Collision")&&(console.log("  - Forcing Collision system: required by state machine conditions"),l.add("Collision")),console.log("🎯 Generating optimized components.asm..."),console.log(`  - Active entities: ${a.activeEntities.length} `),console.log(`  - Used components: ${Array.from(l).join(", ")} `),console.log(`  - Filtered out: ${8-l.size} unused components`);let i=`; ==================================================================
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
entity_deadly_collision EQU temp_byte_8 ; Flag: bit 0 = touching deadly tile (32 bytes)

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

        ${ho(a)}
`;i+=Bl();const h=t.sprites&&t.sprites.length>0;return l.has("Sprite")||h?i+=jl():i+=`
    ; Sprite system filtered out(not used)
init_sprite_system:
    ret

update_sprite_component:
    ret

force_update_entity_sprite:
    ret
    `,l.has("Movement")?i+=Hl():i+=`
    ; Movement system filtered out(not used)
init_movement_system:
    ret

update_movement_component:
    ret
    `,l.has("Collision")?i+=zl():i+=`
    ; Collision system filtered out(not used)
init_collision_system:
    ret

update_collision_component:
    ret
    `,(l.has("Collision")||l.has("WallCollision"))&&(i+=Vl(e)),l.has("Input")?i+=Gl():i+=`
    ; Input system filtered out(not used)
init_input_system:
    ret

update_input_component:
    ret
    `,l.has("Behavior")?i+=Wl():i+=`
    ; Behavior system filtered out(not used)
init_behavior_system:
    ret

update_behavior_component:
    ret
    `,l.has("Health")?i+=Ql():i+=`
    ; Health system filtered out(not used)
init_health_system:
    ret

update_health_component:
    ret
    `,l.has("Animation")?i+=ql():i+=`
    ; Animation system filtered out(not used)
init_animation_system:
    ret

update_animation_component:
    ret
    `,l.has("Jump")?i+=Jl():i+=`
    ; Jump system filtered out(not used)
init_jump_system:
    ret

update_jump_component:
    ret
    `,l.has("Gravity")?i+=Yl():i+=`
    ; Gravity system filtered out(not used)
init_gravity_system:
    ret

update_gravity_component:
    ret
    `,i+=eo(),l.has("Cursors")?i+=to():i+=`
    ; Cursors system filtered out(not used)
init_cursors_system:
    ret

update_cursors_component:
    ret
    `,l.has("StateMachine")?i+=`
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
    `:i+=`
    ; StateMachine system filtered out(not used)
init_statemachine_system:
    ret

update_statemachine_component:
    ret
    `,l.has("Carry")?i+=ao():i+=`
    ; Carry system filtered out(not used)
init_carry_system:
    ret

update_carry_component:
    ret
    `,l.has("Damage")?i+=Xl():i+=`
    ; Damage system filtered out(not used)
init_damage_system:
    ret

update_damage_component:
    ret
    `,l.has("Shoot")?i+=Kl():i+=`
    ; Shoot system filtered out(not used)
init_shoot_system:
    ret

update_shoot_component:
    ret
    `,i+=Zl(),l.has("WallCollision")?i+=lo(e):i+=`
    ; WallCollision system filtered out(not used)
init_wallcollision_system:
    ret

update_wallcollision_component:
    ret
    `,l.has("Collectible")?i+=po():i+=`
    ; Collectible system filtered out(not used)
init_collectible_system:
    ret

update_collectible_component:
    ret
    `,o&&l.has("Input")?(i+=so(n,c),i+=co(),console.log("  - Tile Interaction system: ENABLED (interactable tiles detected)")):i+=`
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
    `,i+=_o(),i+=$l(l,!!t.hasGameFlow),i+=`
; ==================================================================
; EXECUTE ALL STATE MACHINES - Called by GameFlow
; ==================================================================
; This function executes the state machine for each entity that has one
execute_all_state_machines:
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a                       ; Loop through used entities only
    ld hl, active_entity_list
    
.sm_loop:
    ld a, (hl)                    ; A = entity index
    inc hl                        ; Advance list pointer
    push hl                       ; Save list pointer
    push bc                       ; Save loop counter

    ; Skip inactive entities early
    ld c, a                       ; C = entity index
    ld b, 0                       ; BC = entity index
    ld hl, entity_active
    add hl, bc
    ld a, (hl)                    ; A = active flag
    or a
    jr z, .skip_entity            ; Inactive entity, skip

    ; Check if this entity has a state machine assigned
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
    ld a, c
    call SM_Update                ; Execute state machine (A = entity index)
    
.skip_entity:
    pop bc                        ; Restore loop counter
    pop hl                        ; Restore list pointer
    dec b
    jp nz, .sm_loop               ; Loop for all used entities
    
    ret

`,i+=`
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
    ${Array(127).fill(0).map((b,m)=>`db TILE_PASSABLE              ; ${m+1}: Passable`).join(`
    `)}

    ; Index 128-255: Project tile characters (solid by default)
    ; MSX Screen 2 assigns character IDs >= 128 to project tiles
    ${Array(128).fill(0).map((b,m)=>`db TILE_SOLID                 ; ${128+m}: Solid`).join(`
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

`,i+=`
    ; ==================================================================
; END OF COMPONENT SYSTEMS
    ; ==================================================================
        `,i}function uo(t){var y,g,A,T;const e=(S,f)=>{if(typeof S=="boolean")return S;if(typeof S=="number")return S!==0;if(typeof S=="string"){const _=S.trim().toLowerCase();if(_==="true")return!0;if(_==="false")return!1;const E=parseInt(_,10);if(!Number.isNaN(E))return E!==0}return f},a=(S,f)=>{const _=typeof S=="number"?S:parseInt(String(S??""),10);return Number.isNaN(_)?f:Math.max(0,Math.min(255,_|0))},l=(S,f)=>{const _=typeof S=="number"?S:parseInt(String(S??""),10);return Number.isNaN(_)?f&255:_<0?256+Math.max(-128,Math.min(-1,_|0))&255:Math.max(0,Math.min(255,_|0))},o=S=>(S&255).toString(16).toUpperCase().padStart(2,"0"),n=S=>{const f=(S==null?void 0:S.screenAssetId)||(S==null?void 0:S.screenId)||(S==null?void 0:S.screenMapId);if(f){const C=t.worldmaps||[];for(const w of C){const N=((w==null?void 0:w.nodes)||[]).findIndex(M=>(M==null?void 0:M.screenAssetId)===f);if(N>=0)return N}}if(typeof(S==null?void 0:S.screenIndex)=="number"&&S.screenIndex>=0)return S.screenIndex;let _=0,E=null;if(t.screenMaps&&t.screenMaps.forEach((C,w)=>{var N;(((N=C==null?void 0:C.layers)==null?void 0:N.entities)||[]).some(M=>M.id===S.id)&&(_=w,E=C.id||null)}),!E)return _;const I=t.worldmaps||[];for(const C of I){const D=((C==null?void 0:C.nodes)||[]).findIndex(N=>(N==null?void 0:N.screenAssetId)===E);if(D>=0)return D}return _},c=S=>{const f={};if(!S||S.length===0)return f;let _=1;return S.forEach(E=>{!E||!E.id||f[E.id]===void 0&&(f[E.id]=_,E.name&&(f[String(E.name)]=_,f[String(E.name).toLowerCase()]=_),_<255&&(_+=1))}),f},p=Xe(t).activeEntities,d=2,u=16,i=c(t.templates),h=S=>String(S??"entity").toUpperCase().replace(/[^A-Z0-9]/g,"_").replace(/^_+|_+$/g,"")||"ENTITY",b=new Map,m=p.map((S,f)=>{const _=h((S==null?void 0:S.name)||`ENTITY_${f}`),E=(b.get(_)||0)+1;return b.set(_,E),E===1?_:`${_}_${E}`});console.log("🎯 Generating optimized entities.asm..."),console.log(`  - Total entity templates in JSON: ${((y=t.templates)==null?void 0:y.length)||0}`),console.log(`  - Actually instantiated entities: ${p.length}`),console.log(`  - Filtered out: ${(((g=t.templates)==null?void 0:g.length)||0)-p.length} unused templates`);let s=`; ==================================================================
; GAME ENTITIES
; File: entities.asm
; Description: Game entity definitions and behavior
; ==================================================================
;
; INTELLIGENT FILTERING ACTIVE:
;   Entity templates in project: ${((A=t.templates)==null?void 0:A.length)||0}
;   Actually instantiated: ${p.length}
;   Filtered out: ${(((T=t.templates)==null?void 0:T.length)||0)-p.length} unused templates
;
; ==================================================================

`;if(p.length>0){s+=`; ==================================================================
; ENTITY DEFINITIONS
; ==================================================================

`,p.forEach((f,_)=>{var w;const E=m[_],I=(w=t.templates)==null?void 0:w.find(D=>D.id===f.entityTemplateId),C=Ft(f,I,t);s+=`; Entity: ${f.name} (instance from template: ${f.entityTemplateId})
ENTITY_${E}_ID EQU ${_}
ENTITY_${E}_COMP_MASK EQU #${C.toString(16).toUpperCase().padStart(2,"0")}  ; Component mask: ${C.toString(2).padStart(8,"0")}b
`,f.entityTemplateId&&(s+=`; Template: ${f.entityTemplateId}
`),f.position&&(s+=`ENTITY_${E}_X EQU ${f.position.x}
ENTITY_${E}_Y EQU ${f.position.y}
`),s+=`
`}),s+=`; ==================================================================
; ENTITY MANAGEMENT FUNCTIONS
; ==================================================================

init_entities:
    ; Initialize all active game entities (${p.length} entities)

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

    ; Clear entity template tokens
    ld hl, entity_template_token
    ld de, entity_template_token+1
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
    
`,p.length>0?p.forEach((f,_)=>{const E=m[_];s+=`    call init_${E.toLowerCase()}
`}):s+=`    ; No entities to initialize
`,s+=`    ret

update_entities:
    ; Update all active entities (${p.length} entities)
`,p.length>0?p.forEach((f,_)=>{const E=m[_];s+=`    ; Skip entity update if entity belongs to another screen
    ld hl, entity_screen_id + ${_}
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_update_${_}
    call update_${E.toLowerCase()}
.skip_update_${_}:
`}):s+=`    ; No entities to update
`,s+=`    ret

`;let S=!1;p.forEach((f,_)=>{var mt,bt,ft,yt,gt,Et,St,At,Tt,Ct,It,vt,wt,Lt,Rt;const E=m[_],I=(mt=t.templates)==null?void 0:mt.find(k=>k.id===f.entityTemplateId),C=Ft(f,I,t),w=(C&d)!==0,D=(C&u)!==0;w&&D&&(S=!0);const N=((bt=f.position)==null?void 0:bt.x)||100,M=((ft=f.position)==null?void 0:ft.y)||100,V=8,Q=8,v=N*V,x=M*Q,U=Math.min(v,240),P=Math.min(x,191);(v!==U||x!==P)&&console.warn(`Entity ${f.name} position clamped: (${v},${x}) → (${U},${P})`);const F=[];C&1&&F.push("Position"),C&2&&F.push("Sprite"),C&4&&F.push("Movement"),C&8&&F.push("Collision"),C&16&&F.push("Input"),C&32&&F.push("Behavior"),C&64&&F.push("Health"),C&128&&F.push("Animation"),C&256&&F.push("Jump"),C&512&&F.push("Gravity");let X=15,pe=2;if(C&16){const k=I==null?void 0:I.components.find(Y=>Y.definitionId==="comp_cursors"||Y.definitionId==="comp_input"||Y.definitionId==="comp_player_input");if(k){const Y=k.defaultValues||{},te=((yt=f.componentOverrides)==null?void 0:yt.comp_cursors)||{},$={...Y,...te};pe=Math.max(1,a($.speed??2,2)),X=0,$.allowUp!==!1&&(X|=1),$.allowDown!==!1&&(X|=2),$.allowLeft!==!1&&(X|=4),$.allowRight!==!1&&(X|=8)}}let W=1;if(C&256){const k=(gt=I==null?void 0:I.components)==null?void 0:gt.find(Y=>Y.definitionId==="comp_jump");if(k){const Y=k.defaultValues||{},te=((Et=f.componentOverrides)==null?void 0:Et.comp_jump)||{},$={...Y,...te};W=Math.max(1,a($.maxJumps??1,1))}}const B=[];X&1&&B.push("UP"),X&2&&B.push("DOWN"),X&4&&B.push("LEFT"),X&8&&B.push("RIGHT");const ee=B.length===4?"All directions":B.join("+");let Me="";if(C&128){const k=(St=I==null?void 0:I.components)==null?void 0:St.find(Pe=>Pe.definitionId==="comp_animation"||Pe.definitionName==="Animation"),Y=(k==null?void 0:k.defaultValues)||(k==null?void 0:k.values)||{},te=((At=f.componentOverrides)==null?void 0:At.comp_animation)||{},$={...Y,...te},le=a($.currentFrameIndex??$.currentFrame??0,0),re=Math.max(1,a($.animationSpeed??6,6)),ne=e($.loops,!0),ue=e($.isPlaying,!0),ve=e($.animateOnlyWhenMoving,!1),qe=(ue?1:0)|(ne?2:0)|(ve?4:0);Me=`
    ; Initialize Animation component
    ld hl, entity_anim_frame
    add hl, de
    ld (hl), #${le.toString(16).toUpperCase().padStart(2,"0")}           ; currentFrameIndex

    ld hl, entity_anim_tick
    add hl, de
    ld (hl), 0                ; tick counter

    ld hl, entity_anim_speed
    add hl, de
    ld (hl), #${re.toString(16).toUpperCase().padStart(2,"0")}           ; animationSpeed

    ld hl, entity_anim_flags
    add hl, de
    ld (hl), #${qe.toString(16).toUpperCase().padStart(2,"0")}           ; flags (playing/loop/onlyWhenMoving)
`}let Ie="",be=!1,ie=0,H=0,ae=0,se=0,_e=0,he=0;const pt=(Tt=I==null?void 0:I.components)==null?void 0:Tt.find(k=>k.definitionId==="comp_patrol");if(pt){be=!0;const k=pt.defaultValues||{},Y=((Ct=f.componentOverrides)==null?void 0:Ct.comp_patrol)||{},te={...k,...Y};ie=Math.max(0,Math.min(255,Number(te.waypoint1_x)||0)),H=Math.max(0,Math.min(191,Number(te.waypoint1_y)||0)),ae=Math.max(0,Math.min(255,Number(te.waypoint2_x??ie))),se=Math.max(0,Math.min(191,Number(te.waypoint2_y??H)));const $=ae-ie,le=se-H,re=Math.sqrt($*$+le*le),ne=Number(te.speed)||1;re>0&&(_e=Math.round($/re*ne),he=Math.round(le/re*ne),$!==0&&_e===0&&(_e=$>0?1:-1),le!==0&&he===0&&(he=le>0?1:-1));const ue=_e>=0?_e:256+_e,ve=he>=0?he:256+he;Ie=`
    ; === Patrol Component Init ===
    ; Waypoints: (${ie}, ${H}) -> (${ae}, ${se})
    ; Override position with waypoint1
    ld hl, entity_x_pos
    add hl, de
    ld (hl), ${ie}         ; Start X = waypoint1_x

    ld hl, entity_y_pos
    add hl, de
    ld (hl), ${H}         ; Start Y = waypoint1_y

    ; Set patrol velocity
    ld hl, entity_vel_x
    add hl, de
    ld (hl), ${ue}           ; VelX = ${_e>=0?"+":""}${_e}

    ld hl, entity_vel_y
    add hl, de
    ld (hl), ${ve}           ; VelY = ${he>=0?"+":""}${he}
`}let _t="";if(C&8){const k=(It=I==null?void 0:I.components)==null?void 0:It.find(Dt=>Dt.definitionId==="comp_collision"||Dt.definitionName==="Collision"),Y=(k==null?void 0:k.defaultValues)||{},te=((vt=f.componentOverrides)==null?void 0:vt.comp_collision)||{},$={...Y,...te},le=a($.hitboxWidth,16),re=a($.hitboxHeight,16),ne=l($.offsetX,0),ue=l($.offsetY,0),ve=ne>=128?ne-256:ne,qe=ue>=128?ue-256:ue,Pe=a($.collisionLayer,1),fa=a($.collidesWith,255);_t=`
    ; Initialize Collision component (hitbox + layer masks)
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld (hl), #${o(le)}      ; hitboxWidth

    ld hl, entity_collision_hitbox_h
    add hl, de
    ld (hl), #${o(re)}      ; hitboxHeight

    ld hl, entity_collision_offset_x
    add hl, de
    ld (hl), #${o(ne)}      ; offsetX (${ve})

    ld hl, entity_collision_offset_y
    add hl, de
    ld (hl), #${o(ue)}      ; offsetY (${qe})

    ld hl, entity_collision_layer
    add hl, de
    ld (hl), #${o(Pe)}      ; collisionLayer

    ld hl, entity_collides_with
    add hl, de
    ld (hl), #${o(fa)}      ; collidesWith
`}let ht="";const Ke=(wt=f.componentOverrides)==null?void 0:wt.comp_statemachine,Ze=(Lt=I==null?void 0:I.components)==null?void 0:Lt.find(k=>k.definitionId==="comp_statemachine"),ut=(Ke==null?void 0:Ke.stateMachineAssetId)||((Rt=Ze==null?void 0:Ze.defaultValues)==null?void 0:Rt.stateMachineAssetId);if(ut&&t.stateMachines){const k=t.stateMachines.find(Y=>Y.id===ut);if(k&&k.states&&k.states.length>0){let Y=k.states[0];if(k.initialStateId){const le=k.states.find(re=>re.id===k.initialStateId);le&&(Y=le)}const $=`SM_${k.name.replace(/[^a-zA-Z0-9]/g,"_")}_${Y.id.replace(/[^a-zA-Z0-9]/g,"_")}`;ht=`
    ; Initialize State Machine pointer to initial state (${k.name})
    ld hl, ${$}          ; HL = initial state address
    ld a, l
    ld (entity_sm_ptr_l + ${_}), a   ; SM ptr low byte
    ld a, h
    ld (entity_sm_ptr_h + ${_}), a   ; SM ptr high byte

    ; Fire OnEnter of initial state immediately.
    ; Normally OnEnter fires via SM_ChangeState, but the first state is set
    ; directly (no transition). Without this call, ChangeSprite / other
    ; OnEnter actions never run and entity_sprite_asset_index stays at 0.
    ; State data layout: [ID:1][OnEnter ptr:2][OnExit ptr:2][Transitions ptr:2]
    ld hl, ${$} + 1      ; HL = &OnEnter Actions Ptr field
    ld e, (hl)
    inc hl
    ld d, (hl)                    ; DE = OnEnter Actions Ptr (0 if none)
    ld a, ${_}                ; A = entity index
    call SM_ExecuteActions        ; safe: SM_ExecuteActions returns immediately if DE=0
`}}let L="";if(be){w&&(S=!0);const k=Math.min(ie,ae),Y=Math.max(ie,ae),te=Math.min(H,se),$=Math.max(H,se),le=ie!==ae,re=H!==se,ne=re?`.patrol_check_y_${_}`:`.patrol_end_${_}`;L=`update_${E.toLowerCase()}:
`,L+=`    ; Update ${f.name} - Patrol bounce
`,L+=`    ; Waypoints: (${ie}, ${H}) -> (${ae}, ${se})
`,L+=`    ld e, ${_}             ; Entity index
`,L+=`    ld d, 0
`,le&&(L+=`
    ; --- X axis bounce ---
`,L+=`    ld hl, entity_vel_x
`,L+=`    add hl, de
`,L+=`    ld a, (hl)
`,L+=`    or a
`,L+=`    jp z, ${ne}
`,L+=`    bit 7, a
`,L+=`    jp nz, .patrol_chk_min_x_${_}
`,L+=`
    ; Moving right: x >= ${Y}?
`,L+=`    ld hl, entity_x_pos
`,L+=`    add hl, de
`,L+=`    ld a, (hl)
`,L+=`    cp ${Y}
`,L+=`    jp c, ${ne}
`,L+=`    ; Bounce: negate vel_x
`,L+=`    ld hl, entity_vel_x
`,L+=`    add hl, de
`,L+=`    ld a, (hl)
`,L+=`    neg
`,L+=`    ld (hl), a
`,L+=`    jp ${ne}
`,L+=`
.patrol_chk_min_x_${_}:
`,L+=`    ; Moving left: x <= ${k}?
`,L+=`    ld hl, entity_x_pos
`,L+=`    add hl, de
`,L+=`    ld a, (hl)
`,L+=`    cp ${k+1}
`,L+=`    jp nc, ${ne}
`,L+=`    ; Bounce: negate vel_x
`,L+=`    ld hl, entity_vel_x
`,L+=`    add hl, de
`,L+=`    ld a, (hl)
`,L+=`    neg
`,L+=`    ld (hl), a
`),re&&(le&&(L+=`
.patrol_check_y_${_}:
`),L+=`
    ; --- Y axis bounce ---
`,L+=`    ld hl, entity_vel_y
`,L+=`    add hl, de
`,L+=`    ld a, (hl)
`,L+=`    or a
`,L+=`    jp z, .patrol_end_${_}
`,L+=`    bit 7, a
`,L+=`    jp nz, .patrol_chk_min_y_${_}
`,L+=`
    ; Moving down: y >= ${$}?
`,L+=`    ld hl, entity_y_pos
`,L+=`    add hl, de
`,L+=`    ld a, (hl)
`,L+=`    cp ${$}
`,L+=`    jp c, .patrol_end_${_}
`,L+=`    ; Bounce: negate vel_y
`,L+=`    ld hl, entity_vel_y
`,L+=`    add hl, de
`,L+=`    ld a, (hl)
`,L+=`    neg
`,L+=`    ld (hl), a
`,L+=`    jp .patrol_end_${_}
`,L+=`
.patrol_chk_min_y_${_}:
`,L+=`    ; Moving up: y <= ${te}?
`,L+=`    ld hl, entity_y_pos
`,L+=`    add hl, de
`,L+=`    ld a, (hl)
`,L+=`    cp ${te+1}
`,L+=`    jp nc, .patrol_end_${_}
`,L+=`    ; Bounce: negate vel_y
`,L+=`    ld hl, entity_vel_y
`,L+=`    add hl, de
`,L+=`    ld a, (hl)
`,L+=`    neg
`,L+=`    ld (hl), a
`),L+=`
.patrol_end_${_}:
`,w&&(L+=`    ; Sync sprite facing with current patrol velocity
`,L+=`    call update_entity_patrol_facing
`),L+=`    ret
`}else L=`update_${E.toLowerCase()}:
`,L+=`    ; Update ${f.name} logic with real behavior
`,L+=`    ; Check if entity has input component (player entities)
`,L+=`    ld a, ${_}
`,L+=`    ld hl, entity_comp_masks
`,L+=`    ld e, a
`,L+=`    ld d, 0
`,L+=`    add hl, de
`,L+=`    ld a, (hl)
`,L+=`    and COMP_MASK_INPUT
`,L+=`    ret z                      ; Skip if no input component

`,L+=`    ; This is a player entity - update based on input
`,L+=`    ; Input velocity is already calculated in UPDATE_INPUT_COMPONENT
`,L+=`    ; Position update happens in UPDATE_POSITION_COMPONENT
`,L+=`    ret
`;const ma=n(f),ba=i[f.entityTemplateId]??0;s+=`init_${E.toLowerCase()}:
    ; Initialize ${f.name} at real position from JSON
    ; JSON position: (${N}, ${M}) tiles = (${U}, ${P}) pixels
    ; Template: ${f.entityTemplateId}
    ; Components: ${F.join(", ")}
    ; Direction mask: #${X.toString(16).toUpperCase().padStart(2,"0")} (${X.toString(2).padStart(4,"0")}b) = ${ee}

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ; Mask is 16-bit: B=low byte, C=high byte
    ld a, ${_}             ; Entity ID
    ld b, #${(C&255).toString(16).toUpperCase().padStart(2,"0")}              ; Mask low byte
    ld c, #${(C>>8&255).toString(16).toUpperCase().padStart(2,"0")}              ; Mask high byte
    call create_entity         ; Create with actual components from template

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, ${_}             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), ${U}         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), ${P}         ; Set real Y position from JSON

    ; Set entity screen ID (for multi-screen support)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), ${ma}                 ; Screen ID (world node index / fallback screen index)

    ; Template token for state-machine template-aware actions
    ld hl, entity_template_token
    add hl, de
    ld (hl), ${ba}

${Me}
${Ie}
${_t}
${w?`    ; Set sprite pattern and color (renderable entity)
    ld hl, sprite_pattern
    add hl, de
    ld (hl), ${_*4}          ; Use entity index * 4 for 16x16 sprites

    ld hl, sprite_color
    add hl, de
    ld (hl), ${_%14+2}                ; Distinct color for debugging
`:`    ; Anchor/reference entity - no sprite allocation needed
`}

    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #${X.toString(16).toUpperCase().padStart(2,"0")}            ; Direction restrictions: ${ee}

    ; Set input speed for Cursors component (if entity has Input component)
    ld hl, entity_input_speed
    add hl, de
    ld (hl), ${pe}            ; Cursor speed (px/frame)

${C&256?`    ; Set Jump component configuration
    ld hl, entity_jump_max
    add hl, de
    ld (hl), ${W}            ; Maximum jumps before touching ground

`:""}
${w?`    ; Force update sprite attributes only if entity is in current screen
    ld hl, entity_screen_id + ${_}
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_force_show_${_}

    ; Force update sprite attributes (using correct multi-layer config)
    ld c, ${_}             ; Entity Index
    call force_update_entity_sprite
.skip_force_show_${_}:

`:`    ; No sprite to show for this entity
`}
${ht}
    ret

${L}
`}),S&&(s+=`
; ------------------------------------------------------------------
; update_entity_patrol_facing
; Input: DE = entity index
; Updates entity_sprite_asset_index using directional lookup tables.
; ------------------------------------------------------------------
update_entity_patrol_facing:
    push af
    push bc
    push hl

    ; Read base sprite asset index from ROM init table.
    ; This keeps patrol facing within the entity's directional family
    ; and avoids getting stuck in an unrelated 1-layer sprite asset.
    ld hl, entity_sprite_asset_index_init
    add hl, de
    ld a, (hl)
    cp #FF
    jp z, .patrol_facing_done
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

`)}else s+=`; ==================================================================
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

`;return s+=`; ==================================================================
; END OF ENTITIES
; ==================================================================
`,s}function mo(t){const e=!!t.sprites&&t.sprites.length>0;if(!t.screenMaps||t.screenMaps.length===0)return`; ==================================================================
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
`;let a=`; ==================================================================
; SCREEN MAPS
; File: screens.asm
; Description: Screen layout and map data
; ==================================================================

`;return t.screenMaps&&t.screenMaps.length>0?(a+=`; ==================================================================
; SCREEN MAP CONSTANTS
; ==================================================================

`,t.screenMaps.forEach((l,o)=>{const n=l.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");a+=`SCREEN_${n}_${o}_ID EQU ${o}
SCREEN_${n}_${o}_LAYOUT_BANK EQU ((SCREEN_${n}_${o}_LAYOUT - #4000) / #2000)
BEHAVIOR_${n}_${o}_DATA_BANK EQU ((BEHAVIOR_${n}_${o}_DATA - #4000) / #2000)
`}),a+=`
; ==================================================================
; SCREEN MAP DATA
; ==================================================================

`,t.screenMaps.forEach(l=>{var o,n;if(l.layers&&l.layers.background){const c=[];if(t.tiles&&t.tiles.length>0){const y={...Aa[1],assignedTiles:{},charsetRangeStart:128,charsetRangeEnd:255,enabled:!0};let g=128;t.tiles.forEach(T=>{if(T&&T.id){const S=Math.ceil(T.width/8),f=Math.ceil(T.height/8);y.assignedTiles[T.id]={charCode:g,assignedAt:Date.now()},g+=S*f}});const A={id:"global_auto_bank",name:"Global Auto Bank",banks:[y,y,y]};c.push(A),console.log(`✅ Created GLOBAL tile bank with ${Object.keys(y.assignedTiles).length} assigned tiles`)}const r=[];l.activeAreaX,l.activeAreaY,l.activeAreaWidth??l.width,l.activeAreaHeight??l.height;const p=32,d=24;for(let s=0;s<d;s++)for(let y=0;y<p;y++){const g=(o=l.layers.background[s])==null?void 0:o[y];if(!g||!g.tileId)r.push(0);else{let A=0;const T=(n=t.tiles)==null?void 0:n.find(f=>f.id===g.tileId),S=c.length>0?c[0].banks:void 0;if(S&&T){let f=!1;for(const _ of S)if((_.enabled??!0)&&_.assignedTiles[g.tileId]){const E=_.assignedTiles[g.tileId].charCode,I=Math.ceil(T.width/Ae),C=g.subTileX||0,w=g.subTileY||0;if(A=E+w*I+C,A>=_.charsetRangeStart&&A<=_.charsetRangeEnd){f=!0;break}else A=0}f||(A=0)}else A=0;r.push(A)}}const u=r.filter(s=>s!==255).length,i=new Set(r);console.log(`📊 Generated ${r.length} bytes: ${u} non-FF (${(u/r.length*100).toFixed(1)}%)`),console.log(`🎯 Unique byte values: [${Array.from(i).sort((s,y)=>s-y).join(", ")}]`);const h=[];h.push('; Generated using exact Screen Editor "Download ASM" logic'),h.push("; Byte values represent actual character codes in VRAM");const b=`${l.name}_${t.screenMaps.indexOf(l)}`,m=Pa(b,p,d,r,h,"hex");if(a+=m,l.layers.collision&&t.tiles){const s=l.layers.collision,y=[];s.forEach(A=>{A.forEach(T=>{var S,f;if(T.tileId){const _=(S=t.tiles)==null?void 0:S.find(E=>E.id===T.tileId);y.push(((f=_==null?void 0:_.logicalProperties)==null?void 0:f.mapId)??0)}else y.push(0)})});const g=ka(b,l.width,l.height,y,"hex");a+=`
${g}`}}else{const c=t.screenMaps.indexOf(l),r=l.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");a+=`SCREEN_${r}_${c}_LAYOUT:
    ; Screen data for ${l.name}
    ; TODO: Add actual screen map data
    db 0, 0, 0, 0, 0, 0, 0, 0

`}a+=`
`}),a+=`; ==================================================================
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

    ; Advance source and destination to next Name Table row (+32)
    push bc
    ld b, 0
    ld c, 32
    add hl, bc
    ex de, hl
    add hl, bc
    ex de, hl
    pop bc

    dec a
    jr nz, .copy_rect_row_loop
    ret

load_screen:

    ; Load screen (A = screen ID)
    ; TODO: Implement screen loading logic
    ret

`,t.screenMaps.forEach((l,o)=>{var I,C;const n=l.name.toUpperCase().replace(/[^A-Z0-9]/g,"_"),c=l.backgroundColor!==void 0?l.backgroundColor:1,r=l.borderColor!==void 0?l.borderColor:1,p=l.id?`_${l.id.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"",d=l.activeAreaX??0,u=l.activeAreaY??0,i=l.activeAreaWidth??l.width??32,h=l.activeAreaHeight??l.height??24,b=Math.max(0,Math.min(31,d)),m=Math.max(0,Math.min(23,u)),s=Math.max(0,Math.min(32-b,i)),y=Math.max(0,Math.min(24-m,h)),A=(b>0||m>0||s<32||y<24)&&s>0&&y>0,T=m*32+b,S=s*y,f=(((C=(I=l.hudConfiguration)==null?void 0:I.importedFrame)==null?void 0:C.cells)||[]).filter(w=>typeof(w==null?void 0:w.x)=="number"&&typeof(w==null?void 0:w.y)=="number"&&typeof(w==null?void 0:w.charCode)=="number"&&w.x>=0&&w.x<32&&w.y>=0&&w.y<24).map(w=>({x:w.x|0,y:w.y|0,charCode:w.charCode&255})),_=f.length>0,E=`hud_imported_frame_${n.toLowerCase()}${p.toLowerCase()}`;_&&(a+=`${E}_data:
    ; Imported HUD frame snapshot for ${l.name} (${f.length} cells)
`,f.forEach(w=>{const D=w.y*32+w.x,N=D&255,M=D>>8&255,V=w.charCode&255;a+=`    DB #${N.toString(16).padStart(2,"0").toUpperCase()},#${M.toString(16).padStart(2,"0").toUpperCase()},#${V.toString(16).padStart(2,"0").toUpperCase()}
`}),a+=`
${E}_draw:
    ; Draw imported HUD frame chars into Name Table
    ld hl, ${E}_data
    ld bc, ${f.length}

${E}_draw_loop:
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
    jr ${E}_draw_loop

`),A?(a+=`load_screen_${n.toLowerCase()}${p.toLowerCase()}:
    ; Load ${l.name} screen (fast direct port access)
    ; Active Area: X=${b}, Y=${m}, W=${s}, H=${y}
    ; Preserve HUD/non-active area: only overwrite active game area
    ; Set VDP colors FIRST (before loading screen data)
    ld a, ${c}           ; Background color
    ld b, ${r}       ; Border color
    call set_screen_colors
    ; Initialize character 0 (empty cells) with background color
    ld a, ${c}           ; Background color for char 0
    call init_char0_color
`,e&&(a+=`    ; Clear hardware sprites on screen switch to avoid visual carry-over
    call clear_all_sprites
    call update_sprites_to_vram
`),s===32?a+=`    ; Load active game area (contiguous rows)
    call mapper_push_p2
    ld a, SCREEN_${n}_${o}_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, SCREEN_${n}_${o}_LAYOUT + ${T}
    ld de, NAMETBL + ${T}
    ld bc, ${S}
    call FAST_LDIRVM
    call mapper_pop_p2
`:a+=`    ; Load active game area (rectangular copy by rows)
    call mapper_push_p2
    ld a, SCREEN_${n}_${o}_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, SCREEN_${n}_${o}_LAYOUT + ${T}
    ld de, NAMETBL + ${T}
    ld a, ${y}
    ld c, ${s}
    call copy_layout_rect_to_vram
    call mapper_pop_p2
`,a+=`    ; Build mutable runtime screen/behavior maps in RAM
    call mapper_push_p2
    ld a, SCREEN_${n}_${o}_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, SCREEN_${n}_${o}_LAYOUT
    ld de, runtime_screen_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    call mapper_push_p2
    ld a, BEHAVIOR_${n}_${o}_DATA_BANK
    call mapper_set_bank_p2
    ld hl, BEHAVIOR_${n}_${o}_DATA
    ld de, runtime_behavior_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2
`,_&&(a+=`    ; Imported HUD frame is drawn on world/game start only
`),a+=`    ; Initialize collision system pointers for this screen
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
    ret

`):(a+=`load_screen_${n.toLowerCase()}${p.toLowerCase()}:
    ; Load ${l.name} screen (fast direct port access)
    ; Set VDP colors FIRST (before loading screen data)
    ld a, ${c}           ; Background color
    ld b, ${r}       ; Border color
    call set_screen_colors
    ; Initialize character 0 (empty cells) with background color
    ld a, ${c}           ; Background color for char 0
    call init_char0_color
`,e&&(a+=`    ; Clear hardware sprites on screen switch to avoid visual carry-over
    call clear_all_sprites
    call update_sprites_to_vram
`),a+=`    ; Now load screen layout (full 32x24)
    call mapper_push_p2
    ld a, SCREEN_${n}_${o}_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, SCREEN_${n}_${o}_LAYOUT
    ld de, NAMETBL
    ld bc, SCREEN_${n}_${o}_SIZE
    call FAST_LDIRVM           ; Fast VRAM write (direct port access)
    call mapper_pop_p2
`,a+=`    ; Build mutable runtime screen/behavior maps in RAM
    call mapper_push_p2
    ld a, SCREEN_${n}_${o}_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, SCREEN_${n}_${o}_LAYOUT
    ld de, runtime_screen_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    call mapper_push_p2
    ld a, BEHAVIOR_${n}_${o}_DATA_BANK
    call mapper_set_bank_p2
    ld hl, BEHAVIOR_${n}_${o}_DATA
    ld de, runtime_behavior_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2
`,_&&(a+=`    ; Imported HUD frame is drawn on world/game start only
`),a+=`    ; Initialize collision system pointers for this screen
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
    ret

`)})):a+=`; ==================================================================
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
`,a+=`
; ==================================================================
; END OF SCREENS
; ==================================================================
`,a}function bo(t){var i,h,b,m;const e=(h=(i=t.gameFlow)==null?void 0:i.nodes)==null?void 0:h.some(s=>s.type==="SubMenu"),a=(b=t.screenMaps)==null?void 0:b.some(s=>{var y,g;return((y=s.layers)==null?void 0:y.text)||((g=s.textElements)==null?void 0:g.length)>0}),l=(m=t.screenMaps)==null?void 0:m.some(s=>{var y;return((y=s.hudConfiguration)==null?void 0:y.elements)&&s.hudConfiguration.elements.length>0});if(!e&&!a&&!l)return`; ==================================================================
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
`;const o=new Map,n=new Map,c=[{code:32,pattern:[0,0,0,0,0,0,0,0]},{code:43,pattern:[0,16,16,124,16,16,0,0]},{code:45,pattern:[0,0,0,126,0,0,0,0]},{code:62,pattern:[0,48,24,12,24,48,0,0]},{code:124,pattern:[24,24,24,24,24,24,24,24]}];if(c.forEach(s=>{o.set(s.code,s.pattern),n.set(s.code,[240,240,240,240,240,240,240,240])}),t.fonts&&t.fonts.length>0){const s=t.fonts[0],y=s.data.fontData||{},g=s.data.fontColorAttributes||{},A=T=>{if(T.startsWith("rgba(0,0,0,0)"))return 0;const S=T.toUpperCase();return{"RGBA(0,0,0,0)":0,"#000000":1,"#21C842":2,"#5EDC78":3,"#5455ED":4,"#7D76FC":5,"#D4524D":6,"#42EBF5":7,"#FC5554":8,"#FF7978":9,"#D4C154":10,"#E6CE80":11,"#21B03B":12,"#C95BBA":13,"#CCCCCC":14,"#FFFFFF":15}[S]??15};Object.keys(y).forEach(T=>{const S=parseInt(T,10),f=y[S];if(Array.isArray(f)&&f.length===8)if(o.set(S,f),g[S]&&Array.isArray(g[S])){const _=g[S],E=[];for(let I=0;I<8;I++)if(_[I]&&typeof _[I]=="object"){const C=_[I].fg,w=_[I].bg,D=A(C),N=A(w);E.push(D<<4|N)}else E.push(240);n.set(S,E)}else n.set(S,[240,240,240,240,240,240,240,240])})}else{for(let s=48;s<=57;s++)o.set(s,[62,127,115,115,115,127,62,0]);for(let s=65;s<=90;s++)o.set(s,[62,127,99,127,127,99,99,0]);c.forEach(s=>o.set(s.code,s.pattern))}let r=`FONT_PATTERN_DATA:
`,p=`FONT_COLOR_DATA:
`,d=`FONT_CHAR_INDEX:
    DB `;const u=Array.from(o.keys()).filter(s=>s<128).sort((s,y)=>s-y);return u.forEach((s,y)=>{const g=o.get(s),A=n.get(s)||[240,240,240,240,240,240,240,240];r+=`    ; Char ${s} ('${String.fromCharCode(s)}')
`,r+=`    DB ${g.map(T=>"#"+T.toString(16).padStart(2,"0").toUpperCase()).join(", ")}
`,p+=`    ; Char ${s}
`,p+=`    DB ${A.map(T=>"#"+T.toString(16).padStart(2,"0").toUpperCase()).join(", ")}
`,d+=`${s}${y<u.length-1?", ":""}`}),d+=`
FONT_CHAR_COUNT EQU ${u.length}
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
`}function Ht(t,e){return(Array.isArray(t.globalVariables)?t.globalVariables:[]).some(l=>String((l==null?void 0:l.asmName)||"").trim().toLowerCase()===e.toLowerCase())}function fo(t){var n,c,r;const e=[],a=new Map;if(console.log(`🎯 [HUD Generator] Total screens: ${((n=t.screenMaps)==null?void 0:n.length)||0}`),(c=t.screenMaps)==null||c.forEach(p=>{var i;const d=!!p.hudConfiguration,u=((i=p.hudConfiguration)==null?void 0:i.elements)||[];console.log(`  📺 Screen "${p.name}" (${p.id}): hudConfiguration=${d}, elements=${u.length}`),u.length>0&&(u.forEach((h,b)=>console.log(`    📝 Element[${b}]: type=${h.type}, name="${h.name}", text="${h.text||""}" pos=(${h.position.x},${h.position.y}) visible=${h.visible}`)),e.push(...u),a.set(p.id,u))}),console.log(`🎯 [HUD Generator] Total HUD elements found: ${e.length}`),e.length===0)return`; ==================================================================
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
; Total HUD Elements: ${e.length}
; Screens with HUD: ${a.size}
;
; HUD Elements use TileBank fonts to render text in Screen 2 mode
; Each element can be positioned anywhere on screen (256x192 pixels)
; ==================================================================

`;l+=yo(e);let o=0;return(r=t.screenMaps)==null||r.forEach(p=>{const d=p.activeAreaY??0;d>o&&(o=d)}),l+=go(),l+=Eo(e,o,t),l+=So(e),l}function yo(t){let e=`; ------------------------------------------------------------------
; HUD DATA STRUCTURES
; ------------------------------------------------------------------

`;return e+=`HUD_ELEMENT_COUNT   EQU ${t.length}

`,e+=`; HUD Element Data Table
`,e+=`; Format: [Type:1][X:1][Y:1][Width:1][Height:1][Flags:1][TextPtr:2][Visible:1]
`,e+=`hud_element_data:
`,t.forEach((a,l)=>{const o=Ao(a.type),n=a.position.x,c=a.position.y,r=a.visible?1:0,p=`hud_text_${l}`;let d=0,u=1,i=0;const h=a.details||{};(h.border||h.borderColor||h.overallBorderColor)&&(i|=1),a.text?d=a.text.length:h.width?d=Math.ceil(h.width/8):d=10,e+=`    DB ${o}, ${n}, ${c}    ; Element ${l}: ${a.type} at (${n},${c})
`,e+=`    DB ${d}, ${u}, ${i} ; W, H, Flags
`,e+=`    DW ${p}             ; Text pointer
`,e+=`    DB ${r}                ; Visible
`}),e+=`
`,e+=`; HUD Text Strings
`,t.forEach((a,l)=>{const o=a.text||a.name||"",n=`hud_text_${l}`;e+=`${n}:
`,e+=`    DB "${o}", 0
`}),e+=`
`,e}function go(t){return`; ------------------------------------------------------------------
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

`}function Eo(t,e,a){const o=t.findIndex(d=>d.type===q.Score),n=t.findIndex(d=>d.type===q.Lives),c=Ht(a,"global_var_score"),r=Ht(a,"global_var_lives");return`; ------------------------------------------------------------------
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
${`${o>=0&&c?`
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

`}function So(t){const e=t.findIndex(f=>f.type===q.Score),a=t.findIndex(f=>f.type===q.Lives),l=e>=0?t[e]:null,o=a>=0?t[a]:null,n=e>=0?`hud_text_${e}`:null,c=a>=0?`hud_text_${a}`:null,r=(f,_)=>{const E=f||"",I=/\d+(?!.*\d)/.exec(E);return!I||typeof I.index!="number"?{offset:E.length,digits:_}:{offset:I.index,digits:Math.max(1,I[0].length)}},p=(l==null?void 0:l.text)||(l==null?void 0:l.name)||"",d=(o==null?void 0:o.text)||(o==null?void 0:o.name)||"",u=r(p,5),i=r(d,1),h=(f,_)=>{var C,w;if(!f)return null;const E=Math.floor((((C=f.position)==null?void 0:C.x)||0)/8)+_;return 6144+Math.floor((((w=f.position)==null?void 0:w.y)||0)/8)*32+E},b=h(l,u.offset),m=h(o,i.offset),s=Math.min(u.digits,5),y=Math.max(0,u.digits-s),g=[1e4,1e3,100,10],A=g.slice(g.length-Math.max(0,s-1)),T=Array.from({length:y},(f,_)=>`    ; Leading digit ${_}: forced zero (Score is 16-bit max 65535)
    ld a, '0'
    push hl
    ld h, d
    ld l, e
    call FAST_WRTVRM
    pop hl
    inc de
`).join(""),S=A.map((f,_)=>`    ; Runtime digit ${_}: / ${f}
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
    ld de, #${(b||0).toString(16).toUpperCase()}

${T}${S}    ; Final digit: ones (remainder)
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
${c?`    push af
    push hl

    ; Direct VRAM update of the Lives numeric field.
    add a, '0'                  ; Convert to ASCII
    ld hl, #${(m||0).toString(16).toUpperCase()}
    call FAST_WRTVRM

    pop hl
    pop af`:"    ; No Lives element defined in HUD"}
    ret

`}function Ao(t){return{[q.Score]:1,[q.HighScore]:2,[q.Lives]:3,[q.EnergyBar]:4,[q.ItemDisplay]:5,[q.SceneName]:6,[q.MiniMap]:7,[q.CoinCounter]:8,[q.BossEnergyBar]:9,[q.PhaseIndicator]:10,[q.AttackAlert]:11,[q.TextBox]:12,[q.NumericField]:13,[q.CustomCounter]:14}[t]||0}function $e(t){return t.toLowerCase().replace(/[^a-z0-9]/g,"_")}function Be(t){return t.toUpperCase().replace(/[^A-Z0-9]/g,"_")}function zt(t){switch(String(t??"").trim().toLowerCase()){case"north":case"up":return"north";case"south":case"down":return"south";case"east":case"right":return"east";case"west":case"left":return"west";default:return null}}function je(t,e){const a=e==="from"?"fromNodeId":"toNodeId",l=t==null?void 0:t[a];if(typeof l=="string"&&l.length>0)return l;const o=t==null?void 0:t[e];return typeof o=="string"&&o.length>0?o:o&&typeof o.nodeId=="string"&&o.nodeId.length>0?o.nodeId:null}function Vt(t,e){const a=e==="from"?"fromDirection":"toDirection",l=t==null?void 0:t[a],o=zt(l);if(o)return o;const n=t==null?void 0:t[e];return zt(n==null?void 0:n.direction)}function at(t,e){var n,c;const a=(n=e.screens)==null?void 0:n.find(r=>r.id===t),l=((c=a==null?void 0:a.name)==null?void 0:c.toUpperCase().replace(/[^A-Z0-9]/g,"_"))||"UNKNOWN",o=t?`_${t.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";return`load_screen_${l.toLowerCase()}${o.toLowerCase()}`}function To(t,e){var c,r,p,d;const a=(c=e.screens)==null?void 0:c.find(u=>u.id===t),l=(p=(r=a==null?void 0:a.hudConfiguration)==null?void 0:r.importedFrame)==null?void 0:p.cells;if(!Array.isArray(l)||l.length===0)return null;const o=((d=a==null?void 0:a.name)==null?void 0:d.toUpperCase().replace(/[^A-Z0-9]/g,"_"))||"UNKNOWN",n=t?`_${t.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";return`hud_imported_frame_${o.toLowerCase()}${n.toLowerCase()}_draw`}function Co(t,e){const a=Array.isArray(t==null?void 0:t.nodes)?t.nodes:[];if(a.length===0)return null;const l=[],o=t==null?void 0:t.startScreenNodeId,n=a.find(c=>(c==null?void 0:c.id)===o);n&&l.push(n),a.forEach(c=>{(!n||(c==null?void 0:c.id)!==n.id)&&l.push(c)});for(const c of l){const r=c==null?void 0:c.screenAssetId;if(!r)continue;const p=To(r,e);if(p)return p}return null}function Io(t,e,a,l,o){const n=`check_transition_${t}_s${e}_skip_${a}`,c=`check_transition_${t}_s${e}_apply_${a}`;let r="",p="";return a==="east"?(r=`    ; East exit: X near right edge and rightward input
    ld a, (input_state)
    cp STICK_RIGHT
    jr z, .dir_ok_${n}
    cp STICK_UPRIGHT
    jr z, .dir_ok_${n}
    cp STICK_DOWNRIGHT
    jp nz, ${n}
.dir_ok_${n}:
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp 240
    jp c, ${n}
`,p=`    ; Enter from west edge
    ld hl, entity_x_pos
    add hl, de
    ld (hl), 2
`):a==="west"?(r=`    ; West exit: X near left edge and leftward input
    ld a, (input_state)
    cp STICK_LEFT
    jr z, .dir_ok_${n}
    cp STICK_UPLEFT
    jr z, .dir_ok_${n}
    cp STICK_DOWNLEFT
    jp nz, ${n}
.dir_ok_${n}:
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp 2
    jp nc, ${n}
`,p=`    ; Enter from east edge (256 - 16 - 2 = 238)
    ld hl, entity_x_pos
    add hl, de
    ld (hl), 238
`):a==="south"?(r=`    ; South exit: Y near bottom edge
    ; No input-direction gate: supports gravity/platform-driven movement
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    cp 176
    jp c, ${n}
`,p=`    ; Enter from north edge
    ld hl, entity_y_pos
    add hl, de
    ld (hl), 2
`):(r=`    ; North exit: Y near top edge
    ; No input-direction gate: supports velocity-driven movement
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    cp 2
    jp nc, ${n}
`,p=`    ; Enter from south edge (192 - 16 - 2 = 174)
    ld hl, entity_y_pos
    add hl, de
    ld (hl), 174
`),`${r}${c}:
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
${p}    ; Reset player velocity after transition
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
    call apply_collected_tiles     ; Re-apply persistent collection state for new screen
    ret

${n}:
`}function vo(t){var o;const e=t.worldmaps||[],a=!!((o=t.screenMaps)!=null&&o.some(n=>{var c;return Array.isArray((c=n==null?void 0:n.hudConfiguration)==null?void 0:c.elements)&&n.hudConfiguration.elements.length>0}));if(e.length===0)return`; ==================================================================
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

`,e.forEach((n,c)=>{var d;const r=Be(n.name||`world_${c}`),p=n.id||`world_${c}`;if(l+=`; World: ${n.name||"Unnamed"} (${p})
WORLD_${r}_ID EQU ${c}
WORLD_${r}_SCREEN_COUNT EQU ${((d=n.nodes)==null?void 0:d.length)||0}
`,n.nodes&&n.nodes.length>0){const u=new Map;n.nodes.forEach((i,h)=>{const b=Be(i.name||`screen_${h}`),m=u.get(b)||0,s=m===0?b:`${b}_${m+1}`;u.set(b,m+1),l+=`WORLD_${r}_SCREEN_${s}_ID EQU ${h}
`})}l+=`
`}),l+=`; ==================================================================
; WORLD LOADING FUNCTIONS
; ==================================================================

`,e.forEach(n=>{const c=n.id||"unknown",r=n.startScreenNodeId,p=n.nodes||[];if(l+=`; ------------------------------------------------------------------
; Load World: ${n.name||"Unnamed"}
; World ID: ${c}
; Screens: ${p.length}
; Start Screen Node: ${r||"none"}
; ------------------------------------------------------------------
load_world_${$e(c)}:
`,p.length===0){l+=`    ; No screens in this world
    ret

`;return}const d=p.find(m=>m.id===r)||p[0],u=Math.max(0,p.findIndex(m=>m.id===d.id)),i=d.screenAssetId;if(!i){l+=`    ; No valid start screen found
    ret

`;return}const h=at(i,t),b=Co(n,t);l+=`    ; Load start screen: ${d.name||"unknown"} (${i})
    ld a, ((${h} - #4000) / #2000)
    ld hl, ${h}
    call mapper_call_hl_auto

`,b&&(l+=`    ; Draw imported HUD frame once at world start
    call ${b}

`),a&&(l+=`    ; Draw HUD frame once at world start
    call imprimir_marco

`),l+=`    ; Initialize world state
    ld a, WORLD_${Be(n.name||"unnamed")}_ID
    ld (current_world_id), a

    ld a, ${u}
    ld (current_screen_index), a
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1

    xor a
    ld (screen_transition_cooldown), a

    call apply_collected_tiles     ; Re-apply persistent collection state for this screen
    ret

`}),l+=`; ==================================================================
; SCREEN TRANSITION FUNCTIONS
; ==================================================================

`,e.forEach(n=>{const c=n.id||"unknown",r=n.nodes||[],p=n.connections||[];if(p.length===0){l+=`; World ${n.name||"Unnamed"} has no screen connections

`;return}l+=`; ------------------------------------------------------------------
; World: ${n.name||"Unnamed"}
; Connections: ${p.length}
; ------------------------------------------------------------------

`,p.forEach((d,u)=>{const i=je(d,"from"),h=je(d,"to");if(!i||!h){l+=`; Invalid connection ${u}: missing endpoint IDs

`;return}const b=r.find(A=>A.id===i),m=r.find(A=>A.id===h);if(!b||!m){l+=`; Invalid connection ${u}: missing nodes

`;return}const s=m.screenAssetId,y=r.findIndex(A=>A.id===m.id),g=at(s,t);l+=`; Transition: ${b.name||"screen"} -> ${m.name||"screen"}
transition_${$e(c)}_${u}:
    ld a, ((${g} - #4000) / #2000)
    ld hl, ${g}
    call mapper_call_hl_auto

    ld a, ${y}
    ld (current_screen_index), a
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
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

    ; Find first ACTIVE entity with Input component in current screen
.find_player_start:
    ld b, MAX_ENTITIES
    ld e, 0
    ld d, 0
.find_player_loop:
    ; Check entity active flag
    ld hl, entity_active
    add hl, de
    ld a, (hl)
    or a
    jr z, .find_player_next

    ; Check Input component mask
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    jr z, .find_player_next

    ; Check entity belongs to current screen
    ld hl, entity_screen_id
    add hl, de
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr z, .player_found

.find_player_next:
    inc e
    djnz .find_player_loop
    ret                        ; No controllable entity found

.player_found:
    ld d, 0                    ; DE = player entity index

.dispatch_world:
    ld a, (current_world_id)
`,e.forEach((n,c)=>{const r=Be(n.name||`world_${c}`),p=n.id||`world_${c}`,d=`check_transition_world_${$e(p)}`;l+=`    cp WORLD_${r}_ID
    jp z, ${d}
`}),l+=`    ret

`,e.forEach((n,c)=>{const r=n.id||`world_${c}`,p=$e(r),d=n.nodes||[],u=n.connections||[];if(l+=`check_transition_world_${p}:
`,d.length===0||u.length===0){l+=`    ret

`;return}const i=new Map;d.forEach((b,m)=>i.set(b.id,m));const h=new Map;d.forEach((b,m)=>h.set(m,{})),u.forEach(b=>{const m=je(b,"from"),s=je(b,"to"),y=Vt(b,"from"),g=Vt(b,"to");if(!m||!s)return;const A=i.get(m),T=i.get(s);if(!(A===void 0||T===void 0)){if(y){const S=h.get(A);S&&S[y]===void 0&&(S[y]=T)}if(g){const S=h.get(T);S&&S[g]===void 0&&(S[g]=A)}}}),l+=`    ld a, (current_screen_index)
`,d.forEach((b,m)=>{const s=`check_transition_${p}_screen_${m}`;l+=`    cp ${m}
    jp z, ${s}
`}),l+=`    ret

`,d.forEach((b,m)=>{const s=h.get(m)||{},y=`check_transition_${p}_screen_${m}`;l+=`${y}:
`;const g=["east","west","south","north"];let A=!1;g.forEach(T=>{const S=s[T];if(S===void 0)return;const f=d[S];if(!(f!=null&&f.screenAssetId))return;const _=at(f.screenAssetId,t);l+=Io(p,m,T,S,_),A=!0}),l+=`    ret

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
    ret

; ==================================================================
; END OF WORLDS
; ==================================================================
`,l}function Gt(t){t=t.replace("#","");const e=parseInt(t.substring(0,2),16),a=parseInt(t.substring(2,4),16),l=parseInt(t.substring(4,6),16);if(e<50&&a<50&&l<50)return 1;if(e>200&&a>200&&l>200)return 15;if(e>200&&a<100&&l<100)return 8;if(e<100&&a>200&&l<100)return 3;if(e<100&&a<100&&l>200)return 5;if(e>200&&a>200&&l<100)return 10;if(e>150&&a<100&&l>150)return 13;if(e<100&&a>150&&l>150)return 7;const o=(e+a+l)/3;return o<64?1:o<128?14:15}function wo(t){const e=t.gameFlow&&t.gameFlow.nodes&&t.gameFlow.nodes.some(l=>l.type==="SubMenu");if(!e)return`; ==================================================================
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

`,t.gameFlow.nodes.filter(n=>n.type==="SubMenu").forEach((n,c)=>{const r=(n.title||n.id).toUpperCase().replace(/[^A-Z0-9]/g,"_");a+=`MENU_${r}_ID EQU ${c}
`}),a+=`
; ==================================================================
; MENU FUNCTIONS
; ==================================================================

`,t.gameFlow.nodes.filter(n=>n.type==="SubMenu").forEach(n=>{var i,h,b,m;(n.title||n.id).toUpperCase().replace(/[^A-Z0-9]/g,"_");const c=n.id.replace(/[^a-zA-Z0-9]/g,"_"),r=((h=(i=n.appearance)==null?void 0:i.colors)==null?void 0:h.background)||"#000000",p=((m=(b=n.appearance)==null?void 0:b.colors)==null?void 0:m.border)||"#FFFFFF",d=Gt(r),u=Gt(p);a+=`show_menu_${c}:
    ; Display ${n.title||n.id} menu
    ; Set background color using VDP
    ld b, ${d*16+u} ; Background (high) | Border (low)
    ld c, 7                     ; VDP Register 7
    call FAST_WRTVDP

    ; Set system color variables
    ld a, ${u}
    ld (BDRCLR), a

    ld a, ${d}
    ld (BAKCLR), a

    ld a, 15                    ; Default text color (White)
    ld (FORCLR), a

    ; Clear screen with background color
    call CLS

    ; Display menu title
    ld hl, menu_${c}_title
    ld de, NAMETBL + (5 * 32) + 10
    call print_string_screen2

    ; Display menu options
    ; TODO: Add option rendering logic here

    ret

menu_${c}_title:
    db "${(n.title||"Menu").replace(/"/g,'\\"')}", 0

handle_menu_${c}:
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
`,a}const Wt={[R.NONE]:0,[R.SET_POSITION]:1,[R.MOVE_BY]:2,[R.SET_VELOCITY]:3,[R.APPLY_FORCE]:4,[R.CHANGE_SPRITE]:5,[R.PLAY_ANIMATION]:6,[R.SET_ANIMATION_SPEED]:7,[R.TOGGLE_ANIMATION]:8,[R.PLAY_SOUND]:9,[R.PLAY_MUSIC]:10,[R.MUTE_MUSIC]:11,[R.STOP_MUSIC]:12,[R.SET_VARIABLE]:13,[R.INCREMENT_VARIABLE]:14,[R.DECREMENT_VARIABLE]:15,[R.SET_COMPONENT_PROPERTY]:16,[R.WAIT]:17,[R.GOTO_STATE]:18,[R.DESTROY_ENTITY]:19,[R.SPAWN_ENTITY]:20,[R.GET_RANDOM_ENTITY_POSITION]:21,[R.CHANGE_GAME_FLOW_NODE]:22,[R.DECREASE_LIVES]:23,[R.INCREASE_LIVES]:24,[R.RESPAWN_PLAYER]:25,[R.BREAK_TILE]:26,[R.REPLACE_TILE]:27,[R.RND]:28,[R.POINT_AT]:29,[R.ADD_VARIABLES]:30,[R.SUBTRACT_VARIABLES]:31,[R.MULTIPLY_VARIABLES]:32,[R.DIVIDE_VARIABLES]:33,[R.MODULO_VARIABLES]:34,[R.ASSIGN_VARIABLE]:35,[R.DISABLE_INPUT]:36,[R.ENABLE_INPUT]:37,END:255},Lo={[j.AND]:1,[j.OR]:2,[j.NOT]:3,[j.KEY_PRESSED]:4,[j.KEY_RELEASED]:5,[j.TIME_OUT]:6,[j.CAN_MOVE_DIRECTION]:7,[j.HAS_COLLISION]:8,[j.PATH_CLEAR]:9,[j.ON_WALL_COLLISION]:10,[j.HAS_DEADLY_TILE_COLLISION]:11,[j.ANIMATION_COMPLETE]:12,[j.KEY_AND_MOVEMENT]:13,[j.VARIABLE_COMPARE]:14,[j.XOR]:15},Ro={x:0,y:1,vx:2,vy:3,isOnGround:4,health:5,gem_count:6,last_gem_char:7},Yt={"==":0,"!=":1,">":2,"<":3,">=":4,"<=":5},Qt={up:1,arrowup:1,down:5,arrowdown:5,left:7,arrowleft:7,right:3,arrowright:3,fire:9,space:9},lt={up:1,down:5,left:7,right:3},Xt={any:0,up:1,down:5,left:7,right:3},Kt={any:0,wall:1,enemy:2,item:3,entity:4},Zt={up:0,down:1,left:2,right:3,"up-right":4,"up-left":5,"down-right":6,"down-left":7},Do={comp_pos:1,position:1,comp_physics:2,physics:2,comp_render:3,render:3,comp_animation:4,animation:4,comp_health:5,health:5},No={x:1,y:2,vx:3,velocityx:3,vy:4,velocityy:4,sprite:5,spriteassetid:5,isvisible:6,frame:7,currentframeindex:7,animationspeed:8,speed:8,isplaying:9,current:10,max:11};function xo(t){const e={...Ro};return t&&t.length>0&&t.forEach((a,l)=>{const o=8+l;e[a.name]=o,a.asmName&&(e[a.asmName]=o)}),e}function Mo(t){const e={};if(!t||t.length===0)return e;let a=128;return t.forEach(l=>{if(!l||!l.id)return;e[l.id]=a,l.name&&(e[String(l.name)]=a,e[String(l.name).toLowerCase()]=a);const o=Math.max(1,Math.ceil((Number(l.width)||8)/8)),n=Math.max(1,Math.ceil((Number(l.height)||8)/8));a+=o*n}),e}function Po(t){if(typeof t=="string"){const e=t.toLowerCase(),a=Do[e];if(a!==void 0)return a}return parseInt(O(t),10)||0}function ko(t){if(typeof t=="string"){const e=t.toLowerCase(),a=No[e];if(a!==void 0)return a}return parseInt(O(t),10)||0}function Oo(t,e){if(typeof t=="string"&&e){if(e[t]!==void 0)return e[t];const l=t.toLowerCase();if(e[l]!==void 0)return e[l]}const a=parseInt(O(t),10);return Number.isNaN(a)?0:a}function pa(t){const e={};if(!t||t.length===0)return e;let a=1;return t.forEach(l=>{!l||!l.id||e[l.id]===void 0&&(e[l.id]=a,l.name&&(e[String(l.name)]=a,e[String(l.name).toLowerCase()]=a),a<255&&(a+=1))}),e}function Uo(t,e,a){const l=a||pa(t);let o=0;Object.values(l).forEach(u=>{u>o&&(o=u)});const n=new Array(o+1).fill(0),c=new Array(o+1).fill(6),r=new Array(o+1).fill(1),p=new Array(o+1).fill(1),d=(u,i)=>{const h=Number(u);return Number.isFinite(h)?Math.max(0,Math.min(255,h|0)):i};return t==null||t.forEach(u=>{if(!(u!=null&&u.id))return;const i=l[u.id];if(!i)return;const h=Array.isArray(u.components)?u.components:[],b=h.find(_=>(_==null?void 0:_.definitionId)==="comp_render"),m=(b==null?void 0:b.defaultValues)||{},s=m.spriteAssetId??m.sprite??m.spriteId;if(typeof s=="string"&&e){const _=e[s],E=e[s.toLowerCase()];_!==void 0?n[i]=_&255:E!==void 0&&(n[i]=E&255)}const y=h.find(_=>(_==null?void 0:_.definitionId)==="comp_animation"),g=(y==null?void 0:y.defaultValues)||{};c[i]=d(g.animationSpeed??g.speed??6,6);const A=h.find(_=>(_==null?void 0:_.definitionId)==="comp_health"),T=(A==null?void 0:A.defaultValues)||{},S=d(T.current??1,1),f=d(T.max??S,S);r[i]=S,p[i]=f>=S?f:S}),{maxToken:o,spriteByToken:n,animSpeedByToken:c,healthCurByToken:r,healthMaxByToken:p}}const Fo=`
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
    ; Saved A (entity index) is at SP + 9 (SP + 8 is flags)
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

    ; Condition False: Skip Transition Tail and continue to next transition
    ; Transition tail layout after condition payload:
    ;   [0-1] Target State Ptr
    ;   [2-3] Actions Ptr
    inc hl
    inc hl
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
    `,$o=`
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
    DW Action_DisableInput; 36
    DW Action_EnableInput; 37

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
    ld hl, entity_deadly_collision
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

    ; Read value
    ld a, (de)              ; A = global variable value
    ld e, a                 ; E = variable value
    pop de                  ; Restore Compare Value to D
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
    `;function _a(t){const e=Number(t);return Number.isFinite(e)?Math.max(0,Math.min(255,Math.round(e))):0}function Bo(t){return Math.max(0,Math.min(15,_a(t)))}function jo(t){const e=Number(t);return Number.isFinite(e)?Math.max(0,Math.min(4095,Math.round(e))):0}function Ho(t){const e=Number(t);return!Number.isFinite(e)||e<=0?1:Math.max(1,Math.round(e*60/1e3))}function zo(t){const e={};return(t||[]).forEach((a,l)=>{const o=typeof(a==null?void 0:a.id)=="string"?a.id:"",n=typeof(a==null?void 0:a.name)=="string"?a.name:"";o&&(e[o]=l,e[o.toLowerCase()]=l),n&&(e[n]=l,e[n.toLowerCase()]=l)}),e}function Vo(t){const e=Array.isArray(t)?t:[];let a=`SM_SoundFrameSize EQU 11
`;return a+=`SM_SoundAssetCount EQU ${e.length}
`,a+=`SM_SoundPtrTable:
`,e.length===0?(a+=`    DW 0
`,a):(e.forEach((l,o)=>{a+=`    DW SM_SoundAsset_${o}
`}),a+=`
`,e.forEach((l,o)=>{const n=Array.isArray(l==null?void 0:l.channels)?l.channels:[],c=[0,1,2].map(u=>{const i=n[u],h=Array.isArray(i==null?void 0:i.steps)?i.steps:[],b=[];for(const m of h){const s=Ho(m==null?void 0:m.durationMs);for(let y=0;y<s;y++)b.push(m||{})}return b}),r=Math.max(c[0].length,c[1].length,c[2].length),p=Math.min(255,r),d=Math.max(0,Math.min(31,_a(l==null?void 0:l.noisePeriod)));if(a+=`SM_SoundAsset_${o}:
`,a+=`    DB ${p}
`,a+=`    DW SM_SoundAsset_${o}_Frames
`,a+=`
`,a+=`SM_SoundAsset_${o}_Frames:
`,p===0){a+=`    ; Empty sound asset: silent
`;return}for(let u=0;u<p;u++){let i=63;const h=[];for(let b=0;b<3;b++){const m=c[b][u],s=jo(m==null?void 0:m.tonePeriod),y=s&255,g=s>>8&15,A=m?Bo(m.volume):0,T=!!(m!=null&&m.toneEnabled),S=!!(m!=null&&m.noiseEnabled);T&&(i&=~(1<<b)),S&&(i&=~(1<<b+3)),h.push(y,g,A)}h.push(d,i&63),a+=`    DB ${h.join(", ")}
`}a+=`
`}),a.trimEnd())}function Go(t,e,a,l,o,n,c){let r=Fo+`
`+$o+`

`;const p=dt(a||[]),d=p.nameToIndex;p.warnings.forEach(y=>{console.warn(`[State Machine Generator] ${y}`)}),r+=`; ==================================================================
`,r+=`; GLOBAL VARIABLES TABLE
`,r+=`; ==================================================================
`,r+=`; Maps variable IDs (6+) to their RAM addresses
`,r+=`; ID 6 = gem_count, ID 7 = last_gem_char, ID 8+ = user globals
`,r+=`SM_GlobalVarTable:
`,r+=`    DW gem_count            ; ID 6: gem_count
`,r+=`    DW last_gem_char        ; ID 7: last_gem_char (char of last collected tile)
`,e&&e.length>0&&e.forEach((y,g)=>{const A=8+g;r+=`    DW ${y.asmName}            ; ID ${A}: ${y.name}
`}),r+=`
`,r+=`; ==================================================================
`,r+=`; STATE MACHINE DATA
`,r+=`; ==================================================================

`;const u=xo(e),i=Mo(l),h=pa(o),b=zo(n),m=Uo(o,d,h),s=(y,g)=>{const A=g.map(T=>Math.max(0,Math.min(255,T|0)));return`${y}:
    DB ${A.join(", ")}
`};r+=`; ==================================================================
`,r+=`; TEMPLATE PROFILE TABLES
`,r+=`; ==================================================================
`,r+=`SM_TemplateProfileCount EQU ${m.maxToken}
`,r+=s("SM_TemplateSpriteTable",m.spriteByToken),r+=s("SM_TemplateAnimSpeedTable",m.animSpeedByToken),r+=s("SM_TemplateHealthCurrentTable",m.healthCurByToken),r+=s("SM_TemplateHealthMaxTable",m.healthMaxByToken),r+=`
`,r+=`; ==================================================================
`,r+=`; STATE MACHINE SPRITE RUNTIME TABLES
`,r+=`; NOTE: frame bank is derived from the frame pointer at runtime.
`,r+=`; This keeps ChangeSprite compatible with post-export ZX0 label remaps.
`,r+=`; ==================================================================
`,r+=`SM_SpriteAssetCount EQU ${p.sprites.length}
`,r+=`SM_SpritePatternPtrTable:
`,p.sprites.length>0?p.sprites.forEach((y,g)=>{r+=`    DW SPRITE_${g}_PATTERN
`}):r+=`    ; Empty table (no sprites)
`,r+=`
`,r+=`; ==================================================================
`,r+=`; STATE MACHINE SOUND ASSET TABLES
`,r+=`; PLAY_SOUND exports a one-shot 60Hz frame stream per sound asset.
`,r+=`; Channel loops are flattened to a single pass to avoid stuck PSG.
`,r+=`; Hardware envelopes are not emitted yet in this state-machine path.
`,r+=`; ==================================================================
`,r+=Vo(n),r+=`
`;for(const y of t)r+=Wo(y,u,d,i,h,b,c);return r}function Wo(t,e,a,l,o,n,c){let r=`; State Machine: ${t.name} (${t.id}) 
`;const p=t.name.replace(/[^a-zA-Z0-9]/g,"_"),d=u=>{if(!u)return!1;const i=u.trim().toLowerCase();return i==="any"||i==="__any_state__"||i==="any state (*)"};for(const u of t.states){const i=`SM_${p}_${u.id.replace(/[^a-zA-Z0-9]/g,"_")}`,h=`${i}_OnEnter`,b=`${i}_OnExit`,m=`${i}_Transitions`;r+=`${i}: 
`,r+=`    DB 0; ID(unused) 
`,r+=`    DW ${u.onEnter&&u.onEnter.length>0?h:0} 
`,r+=`    DW ${u.onExit&&u.onExit.length>0?b:0} 
`;const s=t.transitions.filter(y=>y.fromStateId===u.id?!0:d(y.fromStateId)?y.toStateId!==u.id:!1);if(r+=`    DW ${s.length>0?m:0} 
`,u.onEnter&&u.onEnter.length>0){r+=`${h}: 
`;for(const y of u.onEnter)r+=ot(y,t.name,e,a,l,o,n,c);r+=`    DB 0xFF; END
`}if(u.onExit&&u.onExit.length>0){r+=`${b}: 
`;for(const y of u.onExit)r+=ot(y,t.name,e,a,l,o,n,c);r+=`    DB 0xFF; END
`}if(s.length>0){r+=`${m}: 
`,r+=`    DB ${s.length}; Count
`;const y=[];s.forEach((g,A)=>{const S=d(g.fromStateId)&&d(g.toStateId)?"0":`SM_${p}_${g.toStateId.replace(/[^a-zA-Z0-9]/g,"_")}`,f=g.actions&&g.actions.length>0?`${m}_Actions_${A}`:"0";if(g.conditions?r+=it(g.conditions,e):r+=`    DB 0; Empty Condition(Always True) 
`,r+=`    DW ${S} 
`,r+=`    DW ${f} 
`,f!=="0"){let _=`${f}: 
`;for(const E of g.actions||[])_+=ot(E,t.name,e,a,l,o,n,c);_+=`    DB 0xFF; END
`,y.push(_)}}),y.length>0&&(r+=`
`,r+=y.join(""))}r+=`
`}return r}function O(t){if(typeof t=="number")return t.toString();if(typeof t=="boolean")return t?"1":"0";if(typeof t=="string"){if(t==="true")return"1";if(t==="false")return"0";const e=parseInt(t,10);return isNaN(e)?"0":e.toString()}return"0"}function Yo(t,e){if(typeof t=="string"){const a=e==null?void 0:e[t];if(a!==void 0)return a;const l=parseInt(t,10);return!isNaN(l)&&l>=0&&l<=254?l:255}return typeof t=="number"&&t>=0&&t<=254?t:255}function ot(t,e="",a,l,o,n,c,r){var u;const p=Wt[t.type];if(p===void 0)return`; Unknown Action: ${t.type} 
`;let d=`    DB ${p}; ${t.type} 
`;switch(t.type){case R.NONE:break;case R.SET_POSITION:case R.MOVE_BY:case R.SET_VELOCITY:case R.APPLY_FORCE:d+=`    DB ${O(t.params.x)}, ${O(t.params.y)} 
`;break;case R.CHANGE_SPRITE:{const i=t.params.sprite||t.params.spriteId||"";let h=0;if(l&&typeof i=="string"){const b=l[i],m=l[i.toLowerCase()];b!==void 0?h=b:m!==void 0?h=m:h=O(i)==="0"?0:parseInt(O(i),10)||0}else h=O(i)==="0"?0:parseInt(O(i),10)||0;d+=`    DB ${h}; sprite: ${i} 
`;break}case R.PLAY_ANIMATION:d+=`    DB ${O(t.params.animationName)} 
`;break;case R.SET_ANIMATION_SPEED:d+=`    DB ${O(t.params.speed)} 
`;break;case R.TOGGLE_ANIMATION:d+=`    DB ${O(t.params.playing)} 
`;break;case R.PLAY_SOUND:{const i=t.params.soundId??t.params.sound??t.params.soundAssetId??0;let h=255;if(typeof i=="string"){const b=c==null?void 0:c[i],m=c==null?void 0:c[i.toLowerCase()];b!==void 0?h=b:m!==void 0&&(h=m)}else{const b=parseInt(O(i),10);isNaN(b)||(h=b)}d+=`    DB ${h}        ; sound: ${i}
`;break}case R.PLAY_MUSIC:{const i=t.params.trackId??t.params.musicId??t.params.music??0,h=t.params.loop??!0,b=Yo(i,r),m=b===255&&i!==0&&i!=="0"?`        ; WARNING: unresolved/non-PSG track ${i}`:"";d+=`    DB ${b}, ${O(h)}        ; track: ${i}${m}
`;break}case R.SET_VARIABLE:case R.INCREMENT_VARIABLE:case R.DECREMENT_VARIABLE:{const i=t.params.variable||t.params.variableName||t.params.name,h=(a==null?void 0:a[i])??0,b=t.params.value??t.params.amount??0;d+=`    DB ${h}, ${O(b)}        ; ${i} (ID ${h})
`;break}case R.WAIT:d+=`    DB ${O(t.params.duration)} 
`;break;case R.GOTO_STATE:if(e&&t.params.stateId){const i=`SM_${e.replace(/[^a-zA-Z0-9]/g,"_")}_${t.params.stateId.replace(/[^a-zA-Z0-9]/g,"_")} `;d+=`    DW ${i} 
`}else d+=`    DW 0; Invalid GOTO target
`;break;case R.SPAWN_ENTITY:{const i=t.params.templateId??t.params.entityTemplateId??t.params.entityId??0,h=typeof i=="string"?(n==null?void 0:n[i])??(n==null?void 0:n[i.toLowerCase()])??0:parseInt(O(i),10)||0,b=t.params.x??0,m=t.params.y??0;d+=`    DB ${h}, ${O(b)}, ${O(m)}        ; template=${i}=>${h}
`;break}case R.DESTROY_ENTITY:{const i=((u=t.params)==null?void 0:u.target)||"self";d+=`    DB ${i==="other"?1:0}          ; Target: ${i}
`;break}case R.GET_RANDOM_ENTITY_POSITION:{const i=t.params.templateId??t.params.entityTemplateId??0,h=typeof i=="string"?(n==null?void 0:n[i])??(n==null?void 0:n[i.toLowerCase()])??0:parseInt(O(i),10)||0,b=t.params.targetVariableX??t.params.variableX,m=t.params.targetVariableY??t.params.variableY,s=(a==null?void 0:a[b])??0,y=(a==null?void 0:a[m])??0;d+=`    DB ${h}, ${s}, ${y}        ; template=${i}, x->${b}(${s}), y->${m}(${y})
`;break}case R.SET_COMPONENT_PROPERTY:{const i=t.params.componentId??t.params.component??t.params.compId??0,h=t.params.propertyName??t.params.prop??t.params.name??0,b=t.params.value??0,m=Po(i),s=ko(h);let y=O(b);if(s===5&&typeof b=="string"&&l){const g=l[b],A=l[b.toLowerCase()];g!==void 0?y=String(g):A!==void 0&&(y=String(A))}d+=`    DB ${m}, ${s}, ${y}        ; comp=${i}=>${m}, prop=${h}=>${s}, value=${b}
`;break}case R.CHANGE_GAME_FLOW_NODE:{const i=t.params.nodeId??t.params.targetNodeId??0,h=typeof i=="string"&&i.toUpperCase()==="START"?255:O(i);d+=`    DB ${h}        ; node=${i}
`;break}case R.BREAK_TILE:{const i=String(t.params.direction||"up").toLowerCase(),h=Zt[i]??0;d+=`    DB 0, ${h}        ; BREAK_TILE dir=${i}
`;break}case R.REPLACE_TILE:{const i=String(t.params.direction||"up").toLowerCase(),h=Zt[i]??0,b=t.params.replacementTileId??t.params.tileId??0,m=Oo(b,o);d+=`    DB ${m}, ${h}        ; REPLACE_TILE tile=${b}=>${m}, dir=${i}
`;break}case R.RND:{const i=t.params.variable??t.params.variableName??t.params.targetVariable??t.params.name,h=(a==null?void 0:a[i])??O(t.params.varId??0),b=O(t.params.dataType??t.params.type??0);d+=`    DB ${h}, ${b}        ; RND var=${i??t.params.varId??0}, type=${t.params.dataType??t.params.type??0}
`;break}case R.POINT_AT:{const i=O(t.params.x1??0),h=O(t.params.y1??0),b=O(t.params.x2??0),m=O(t.params.y2??0),s=O(t.params.speed??1);d+=`    DB ${i}, ${h}, ${b}, ${m}, ${s}
`;break}case R.DECREASE_LIVES:case R.INCREASE_LIVES:{const i=t.params.amount??1;d+=`    DB ${O(i)} 
`;break}case R.RESPAWN_PLAYER:{const i=t.params.x??255,h=t.params.y??255;d+=`    DB ${O(i)}, ${O(h)} 
`;break}case R.ADD_VARIABLES:case R.SUBTRACT_VARIABLES:case R.MULTIPLY_VARIABLES:case R.DIVIDE_VARIABLES:case R.MODULO_VARIABLES:{const i=t.params.destination||t.params.dest||t.params.result,h=t.params.source1||t.params.src1||t.params.operand1,b=t.params.source2||t.params.src2||t.params.operand2,m=(a==null?void 0:a[i])??0,s=(a==null?void 0:a[h])??0,y=(a==null?void 0:a[b])??0,g=t.type===R.ADD_VARIABLES?"ADD":t.type===R.SUBTRACT_VARIABLES?"SUB":t.type===R.MULTIPLY_VARIABLES?"MUL":t.type===R.DIVIDE_VARIABLES?"DIV":"MOD";d+=`    DB ${m}, ${s}, ${y}        ; ${i} = ${h} ${g} ${b}
`;break}case R.ASSIGN_VARIABLE:{const i=t.params.targetVariable||t.params.destination||t.params.dest||t.params.result,h=(a==null?void 0:a[i])??0;if((t.params.sourceType||(t.params.sourceVariable?"variable":"constant"))!=="variable"){const y=t.params.sourceValue??t.params.value??0;d=`    DB ${Wt[R.SET_VARIABLE]}; ${R.SET_VARIABLE} (from ${R.ASSIGN_VARIABLE})
`,d+=`    DB ${h}, ${O(y)}        ; ${i} = ${y}
`;break}const m=t.params.sourceVariable||t.params.source||t.params.src||t.params.operand||t.params.source1,s=(a==null?void 0:a[m])??0;d+=`    DB ${h}, ${s}        ; ${i} = ${m}
`;break}default:d+=`    ; Params not implemented for ${t.type}
`;break}return d}function it(t,e){var o,n,c,r,p,d,u,i,h,b,m,s,y,g,A,T,S;const a=Lo[t.type];if(!a)return console.warn(`[State Machine Generator] Unknown condition "${t.type}". Falling back to NOP condition.`),`    DB 0; FALLBACK NOP for unknown condition ${t.type}
`;let l=`    DB ${a}; ${t.type} 
`;switch(t.type){case j.KEY_PRESSED:case j.KEY_RELEASED:{const f=(n=(o=t.params)==null?void 0:o.key)==null?void 0:n.toLowerCase(),_=Qt[f]??0;l+=`    DB ${_}          ; Key: ${f||"unknown"}
`;break}case j.TIME_OUT:l+=`    DB ${O((c=t.params)==null?void 0:c.duration)} 
`;break;case j.CAN_MOVE_DIRECTION:{const f=String(((r=t.params)==null?void 0:r.direction)||"").toLowerCase(),_=lt[f]??0;f&&_===0&&console.warn(`[State Machine Generator] Unknown direction "${f}" in CAN_MOVE_DIRECTION. Using 0 (no direction).`),l+=`    DB ${_}          ; Direction: ${f||"none"}
`;break}case j.ON_WALL_COLLISION:{const f=String(((p=t.params)==null?void 0:p.direction)||"any").toLowerCase(),_=Xt[f]??0;f in Xt||console.warn(`[State Machine Generator] Unknown direction "${f}" in ON_WALL_COLLISION. Using any.`),l+=`    DB ${_}          ; Wall direction: ${f}
`;break}case j.HAS_COLLISION:{const f=String(((d=t.params)==null?void 0:d.collisionType)||"any").toLowerCase();let _=Kt[f];_===void 0&&(console.warn(`[State Machine Generator] Unknown collisionType "${f}" in HAS_COLLISION. Using any.`),_=Kt.any),l+=`    DB ${_}          ; collisionType: ${f}
`;break}case j.PATH_CLEAR:{const f=String(((u=t.params)==null?void 0:u.direction)||"").toLowerCase(),_=lt[f]??0;f&&_===0&&console.warn(`[State Machine Generator] Unknown direction "${f}" in PATH_CLEAR. Using auto-deduce (0).`),l+=`    DB ${_}          ; Direction (0=auto): ${f||"auto"}
`;break}case j.ANIMATION_COMPLETE:break;case j.KEY_AND_MOVEMENT:{const f=String(((i=t.params)==null?void 0:i.key)||"").toLowerCase(),_=Qt[f]??0,E=String(((h=t.params)==null?void 0:h.direction)||"").toLowerCase();let I=lt[E]??0;!E&&_!==9&&(I=_),E&&I===0&&console.warn(`[State Machine Generator] Unknown direction "${E}" in KEY_AND_MOVEMENT. Using 0.`),l+=`    DB ${_}, ${I}          ; key=${f||"unknown"}, dir=${E||"auto"}
`;break}case j.AND:case j.OR:case j.XOR:if(t.conditions){l+=`    DB ${t.conditions.length} 
`;for(const f of t.conditions)l+=it(f,e)}else l+=`    DB 0
`;break;case j.NOT:t.conditions&&t.conditions.length>0?(l+=`    DB 1 
`,l+=it(t.conditions[0],e)):(l+=`    DB 1 
`,l+=`    DB 0; Fallback NOP subcondition for NOT
`);break;case j.VARIABLE_COMPARE:{const f=((b=t.params)==null?void 0:b.variable)||"x",_=e==null?void 0:e[f];if(_===void 0)console.warn(`[State Machine Generator] Unknown variable "${f}" in VARIABLE_COMPARE. Using x (ID 0) as fallback.`),l+=`    DB 0, ${Yt[((m=t.params)==null?void 0:m.operator)||"=="]||0}, ${O(((s=t.params)==null?void 0:s.value)||0)}; FALLBACK: unknown var "${f}" -> x ${((y=t.params)==null?void 0:y.operator)||"=="} ${((g=t.params)==null?void 0:g.value)||0}
`;else{const E=Yt[((A=t.params)==null?void 0:A.operator)||"=="]||0,I=((T=t.params)==null?void 0:T.value)||0;l+=`    DB ${_}, ${E}, ${O(I)}; ${f} (ID ${_}) ${((S=t.params)==null?void 0:S.operator)||"=="} ${I}
`}break}}return l}function Qo(t,e={}){console.log("ÐYZî [INTERRUPT GENERATOR] Generating interrupt.asm...");let a="";return a+=`; ==================================================================
`,a+=`; INTERRUPT TASK SYSTEM - File: interrupt.asm
`,a+=`; Konami-style technique: Hook H.TIMI for 50/60Hz task execution
`,a+=`; ==================================================================

`,a+=Xo(),a+=Ko(),a+=Zo(),a+=qo(),a+=Jo(),a+=en(t),e.interruptDrivenComponents&&(a+=`
; ==================================================================
`,a+=`; COMPONENT SYSTEMS (INLINED)
`,a+=`; Generated inside interrupt.asm because interruptDrivenComponents=true
`,a+=`; ==================================================================

`,a+=ca(t,e.romMode||"simple32k"),a+=`
; ==================================================================
`,a+=`; END OF INLINED COMPONENT SYSTEMS
`,a+=`; ==================================================================

`),console.log(`ƒo. [INTERRUPT GENERATOR] Generated interrupt.asm (${a.length} chars)`),a}function Xo(){return`; ==================================================================
; INTERRUPT SYSTEM MEMORY LAYOUT
; Variables are defined in variables.asm (dynamically allocated)
; This avoids RAM overlap with entity system arrays
; ==================================================================
; Slots: task_table (8 slots x 2 bytes), task_0_ptr..task_7_ptr
; State: interrupt_system_enabled, old_htimi_hook, interrupt_counter,
;        task_exec_time, vblank_flag
; ==================================================================

`}function Ko(){return`; ==================================================================
; INIT_INTERRUPT_SYSTEM - Install H.TIMI hook
; ==================================================================
${z({purpose:"Install JP hook on H.TIMI and initialize interrupt task state.",inputs:["None"],outputs:["None"],clobbers:["AF","BC","DE","HL"],preserved:["None"],usage:["HL/DE/BC = block copy parameters for hook backup and task table clear","A = enable flag and zeroing value"],notes:["Runs with DI/EI, so caller must not assume interrupt state is unchanged."]})}
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

`}function Zo(){return`; ==================================================================
; STOP_INTERRUPT_SYSTEM - Restore original H.TIMI hook
; ==================================================================
${z({purpose:"Restore original H.TIMI bytes and mark system disabled.",inputs:["None"],outputs:["None"],clobbers:["AF","BC","DE","HL"],preserved:["None"],usage:["HL/DE/BC = LDIR source/destination/count for hook restore","A = zero flag write to interrupt_system_enabled"],notes:["Runs with DI/EI for atomic hook restoration."]})}
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

`}function qo(){return`; ==================================================================
; INTERRUPT_DISPATCHER - Main ISR (60Hz/50Hz)
; ==================================================================
${z({purpose:"Dispatch enabled interrupt tasks each VBlank and chain BIOS hook.",inputs:["Triggered by H.TIMI hook"],outputs:["interrupt_counter incremented","vblank_flag refreshed"],clobbers:["AF","BC","HL (restored before exit)"],preserved:["DE","IX","IY"],usage:["HL = walks task_table and holds task pointer","B = task slot loop counter","C = temporary low byte for pointer reconstruction","A = enabled checks and pointer validation"],notes:["Only AF/BC/HL are pushed; interrupt tasks must preserve anything else they touch."]})}
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

`}function Jo(){return`; ==================================================================
; TASK MANAGEMENT FUNCTIONS
; ==================================================================

; ==================================================================
; NOTE: wait_vblank function removed - use HALT directly in game loop
; HALT is more efficient (no call/ret overhead)
; ==================================================================

; ==================================================================
; UPDATE_VBLANK_FLAG - For interrupt dispatcher use only
; ==================================================================
${z({purpose:"Read VDP status register and latch VBlank state in RAM flag.",inputs:["None"],outputs:["vblank_flag = 0/1"],clobbers:["AF (internally saved/restored)"],preserved:["AF, BC, DE, HL"],usage:["A = VDP status read and boolean conversion"]})}
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
${z({purpose:"Store routine pointer into task_table slot.",inputs:["A = task slot (0-7)","HL = task routine address"],outputs:["task_table[slot] = HL"],clobbers:["AF","BC","DE","HL"],preserved:["None"],usage:["A = slot validation and offset math","DE = holds routine address while HL is repurposed as slot pointer","BC = task_table base address","HL = slot address calculation / pointer write"]})}
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
${z({purpose:"Clear routine pointer in selected task slot.",inputs:["A = task slot (0-7)"],outputs:["task_table[slot] = 0"],clobbers:["AF","DE","HL"],preserved:["BC"],usage:["A = slot validation and zero value for clearing","HL = destination slot pointer","DE = computed slot offset"]})}
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
${z({purpose:"Expose current 16-bit interrupt frame counter.",inputs:["None"],outputs:["HL = interrupt_counter"],clobbers:["HL"],preserved:["AF","BC","DE"],usage:["HL = loaded return value"]})}
; Inputs: None
; Outputs: HL = frame count (16-bit)
; Modifies: HL
; ==================================================================
get_frame_count:
    ld hl, (interrupt_counter)
    ret

`}function en(t){let e="";if(e+=`; ==================================================================
`,e+=`; DEFAULT INTERRUPT TASKS (60Hz Execution)
`,e+=`; ==================================================================

`,e+=`; ==================================================================
`,e+=`; TASK_UPDATE_INPUT - Joystick/Cursor polling at 60Hz
`,e+=`; ==================================================================
`,e+=`; This task guarantees responsive input (no missed button presses)
`,e+=`; Compatible with update_input_component existing function
`,e+=`; ==================================================================
`,e+=z({purpose:"Poll joystick + keyboard fallback and update input state buffers.",inputs:["Reads hardware via FAST_GTSTCK / FAST_GTTRIG / FAST_SNSMAT"],outputs:["input_state, prev_input_state, input_btn_curr, input_btn_prev, input_fire"],clobbers:["AF","BC","DE"],preserved:["AF","BC","DE (by push/pop wrapper)","HL"],usage:["A = hardware reads and final scalar writes","B = direction accumulator","D = button bitmask and keyboard direction flags","E = temporary keyboard row bits"],notes:["Wrapper preserves caller-visible regs despite internal mutation."]}),e+=`task_update_input:
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

`,t.hasEntities){const l=Xe(t).usedComponents,o=l.has("Jump"),n=l.has("Movement")||l.has("Cursors"),c=l.has("Gravity");o||n||c?(e+=`; ==================================================================
`,e+=`; TASK_UPDATE_PHYSICS - Apply vx, vy -> X, Y (OPTIMIZED)
`,e+=`; ==================================================================
`,e+=`; Only calls physics systems that are actually used in this project
`,e+=`; ==================================================================
`,e+=z({purpose:"Run selected physics component systems in deterministic order.",inputs:["Entity/component RAM tables"],outputs:["Entity motion state updated"],clobbers:["AF","BC","DE","HL"],preserved:["AF","BC","DE","HL (by push/pop wrapper)"],usage:["Registers are scratch during component calls; wrapper restores caller context."]}),e+=`task_update_physics:
`,e+=`    push af
`,e+=`    push bc
`,e+=`    push de
`,e+=`    push hl

`,e+=`    ; Keep system loops in sync with current component masks
`,e+=`    call rebuild_used_entity_list
`,o&&(e+=`    call update_jump_component      ; Jump impulse
`),n&&(e+=`    call update_movement_component  ; Movement/velocity
`),c&&(e+=`    call update_gravity_component   ; Gravity acceleration
`),e+=`    call update_position_component  ; Apply velocity to position

`,e+=`    pop hl
`,e+=`    pop de
`,e+=`    pop bc
`,e+=`    pop af
`,e+=`    ret

`):(e+=`; Task 1 (Physics): Minimal - only position update (no Jump/Movement/Gravity used)
`,e+=`task_update_physics:
`,e+=`    call rebuild_used_entity_list  ; Keep compact entity list updated
`,e+=`    call update_position_component  ; Just apply any existing velocities
`,e+=`    ret

`)}else e+=`; Task 1 (Physics): Not generated (no entities detected)

`;return t.hasCollisions?(e+=`; ==================================================================
`,e+=`; TASK_UPDATE_COLLISION - Collision detection
`,e+=`; ==================================================================
`,e+=`; Detects collisions using collision layers (bitmask system)
`,e+=`; AABB collision for 16x16 sprites
`,e+=`; ==================================================================
`,e+=z({purpose:"Interrupt task wrapper for collision system (placeholder).",inputs:["Entity collision data"],outputs:["Collision flags/tables (when implemented)"],clobbers:["AF","BC","DE","HL"],preserved:["AF","BC","DE","HL (by push/pop wrapper)"]}),e+=`task_update_collision:
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
`,e+=z({purpose:"Interrupt-safe wrapper for sprite SAT upload routine.",inputs:["Sprite component buffers"],outputs:["VRAM sprite attribute/pattern tables updated"],clobbers:["AF","BC","DE","HL"],preserved:["AF","BC","DE","HL (by push/pop wrapper)"]}),e+=`task_update_sprites:
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

`,t.tracks&&t.tracks.length>0||t.stateMachines&&t.stateMachines.length>0?(e+=`; ==================================================================
`,e+=`; TASK_UPDATE_MUSIC - Fixed-rate audio tick
`,e+=`; ==================================================================
`,e+=`; Keeps tracker and state-machine audio tied to H.TIMI instead of variable-cost loops
`,e+=`; ==================================================================
`,e+=z({purpose:"Interrupt-safe wrapper for tracker/state-machine audio tick.",inputs:["Music engine RAM state and state-machine sound cursors"],outputs:["PSG state advanced once per VBlank"],clobbers:["AF","BC","DE","HL"],preserved:["AF","BC","DE","HL (by push/pop wrapper)"]}),e+=`task_update_music:
`,e+=`    push af
`,e+=`    push bc
`,e+=`    push de
`,e+=`    push hl

`,t.tracks&&t.tracks.length>0&&(e+=`    call music_update
`),t.stateMachines&&t.stateMachines.length>0&&(e+=`    call SM_UpdateSound
`),e+=`
`,e+=`    pop hl
`,e+=`    pop de
`,e+=`    pop bc
`,e+=`    pop af
`,e+=`    ret

`):e+=`; TASK_UPDATE_MUSIC: Not generated (no tracker/state-machine audio in project)

`,e+=`; ==================================================================
`,e+=`; TASK_FRAME_COUNTER - Custom timing/animations
`,e+=`; ==================================================================
`,e+=`; Placeholder for user-defined frame-based timing
`,e+=`; Example: Increment animation timers, etc.
`,e+=`; ==================================================================
`,e+=z({purpose:"Reserved slot for user timing logic.",inputs:["None"],outputs:["None by default"],clobbers:["None by default"],preserved:["All (default empty implementation)"]}),e+=`task_frame_counter:
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

`,e}const nt=255,tn=254,an=["A","B","C"];function ln(t){const e=dn(t);return`; ==================================================================
; PSG SOUND SYSTEM
; File: sound.asm
; Description: AY-3-8910 PSG control and sound effects
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

${Sn(e)}

; ==================================================================
; END OF PSG SOUND SYSTEM
; ==================================================================
`}function G(t,e=0,a=255){const l=Number.isFinite(t)?Math.round(t):e;return Math.max(e,Math.min(a,l))}function Ye(t,e=0,a=65535){const l=Number.isFinite(t)?Math.round(t):e;return Math.max(e,Math.min(a,l))}function K(t){return`#${G(t).toString(16).toUpperCase().padStart(2,"0")}`}function st(t){return`#${Ye(t).toString(16).toUpperCase().padStart(4,"0")}`}function qt(t){const e=Ye(t??1,1,65535);return Ye(Math.round(e*210),1,65535)}function on(t){const e=t.replace(/[^a-zA-Z0-9_]/g,"_").replace(/_+/g,"_");return e.length>0?e:"track"}function nn(t){const e=Ye(t.bpm||125,1,999),a=G(t.speed||6,1,31);return Math.max(1,Math.round(150*a/e))}function rn(t){if(t===null||t==="---")return nt;if(t==="===")return tn;const e=t.toUpperCase().match(/^([A-G](?:#|-))([0-7])$/);if(!e)return nt;const a=e[1],l=parseInt(e[2],10),n={"C-":0,"C#":1,"D-":2,"D#":3,"E-":4,"F-":5,"F#":6,"G-":7,"G#":8,"A-":9,"A#":10,"B-":11}[a];return n===void 0?nt:G(l*12+n,0,95)}function sn(t){return!!t&&!Array.isArray(t.waveform)}function dn(t){return(Array.isArray(t.tracks)?t.tracks:[]).filter(a=>((a==null?void 0:a.soundChip)||"PSG")==="PSG").map(a=>({...a,soundChip:(a==null?void 0:a.soundChip)||"PSG"}))}function cn(t){const e=new Map;for(const a of t.instruments||[])sn(a)&&typeof a.id=="number"&&e.set(G(a.id,1,31),a);return e}function pn(t){const e=new Map;for(const a of t.ornaments||[])!a||typeof a.id!="number"||e.set(G(a.id,1,15),a);return e}function _n(t,e){const a=t==null?void 0:t[e];return{note:(a==null?void 0:a.note)??null,instrument:(a==null?void 0:a.instrument)??null,ornament:(a==null?void 0:a.ornament)??null,volume:(a==null?void 0:a.volume)??null}}function hn(t,e,a,l){if(t==null)return 255;if(t===0)return 0;const o=G(t,1,31);return o!==t&&a.push(`${l}: instrument ${t} clamped to ${o}`),e.has(o)||a.push(`${l}: instrument ${o} not found`),o}function un(t,e,a,l){if(t==null)return 255;if(t===0)return 0;const o=G(t,1,15);return o!==t&&a.push(`${l}: ornament ${t} clamped to ${o}`),e.has(o)||a.push(`${l}: ornament ${o} not found`),o}function mn(t,e,a){if(t==null)return 255;const l=G(t,0,15);return l!==t&&e.push(`${a}: volume ${t} clamped to ${l}`),l}function we(t,e){const a=[`${t}:`];if(e.length===0)return a.push("    DB #00"),a.join(`
`);for(let l=0;l<e.length;l+=16)a.push(`    DB ${e.slice(l,l+16).map(o=>K(o)).join(",")}`);return a.join(`
`)}function bn(t,e){const a=[`${t}:`];if(e.length===0)return a.push("    DW #0000"),a.join(`
`);for(let l=0;l<e.length;l+=8)a.push(`    DW ${e.slice(l,l+8).map(o=>st(o)).join(",")}`);return a.join(`
`)}function Jt(t){return t.map(e=>G(e&255))}function fn(t){const e=t.some(a=>G(a,0,127)>15);return t.map(a=>{const l=G(a,0,127);if(!e)return G(l,0,15);const o=G(Math.round(l/127*15),0,15);return l>0&&o===0?1:o})}function yn(t){return t.map(e=>G(e,0,31))}function gn(){const t=17897725e-1,e=16.351597831287414,a=[];for(let l=0;l<96;l++){const o=e*Math.pow(2,l/12);a.push(Math.max(1,Math.round(t/(16*o))))}return bn("music_note_period_table",a)}function En(t,e){const a=`music_track_${e}_${on(t.name||`track_${e}`)}`,l=cn(t),o=pn(t),n=[],c=Array.isArray(t.order)&&t.order.length>0?t.order:[0],r=G(t.restartPosition??0,0,Math.max(0,c.length-1)),p=Array.isArray(t.patterns)&&t.patterns.length>0?t.patterns:[{id:`${a}_fallback`,name:"Fallback",numRows:1,rows:[]}],d=[];d.push("; ------------------------------------------------------------------"),d.push(`; Tracker Song ${e}: ${t.name}`),d.push("; ------------------------------------------------------------------"),d.push(`${a}_data:`),d.push(`    DB ${K(nn(t))}`),d.push(`    DB ${K(c.length)}`),d.push(`    DB ${K(r)}`),d.push("    DB #01"),d.push(`    DB ${K(p.length)}`),d.push(`    DW ${a}_order_table`),d.push(`    DW ${a}_pattern_table`),d.push(`    DW ${a}_instrument_ptr_table`),d.push(`    DW ${a}_ornament_ptr_table`),d.push(`    DW ${st(qt(t.ayHardwareEnvelopePeriod))}`),d.push(`    DB ${K(G(t.ayNoisePeriod??16,0,31))}`),d.push(""),d.push(we(`${a}_order_table`,c.map(u=>G(u,0,Math.max(0,p.length-1))))),d.push(""),d.push(`${a}_pattern_table:`),p.forEach((u,i)=>{var h;d.push(`    DW ${a}_pattern_${i}_rows`),d.push(`    DB ${K(G((u==null?void 0:u.numRows)||((h=u==null?void 0:u.rows)==null?void 0:h.length)||1,1,255))}`)}),d.push(""),d.push(`${a}_instrument_ptr_table:`);for(let u=0;u<=31;u++)d.push(`    DW ${u>0&&l.has(u)?`${a}_inst_${u}`:"0"}`);d.push(""),d.push(`${a}_ornament_ptr_table:`);for(let u=0;u<=15;u++)d.push(`    DW ${u>0&&o.has(u)?`${a}_orn_${u}`:"0"}`);return d.push(""),p.forEach((u,i)=>{var b,m;const h=G((u==null?void 0:u.numRows)||((b=u==null?void 0:u.rows)==null?void 0:b.length)||1,1,255);d.push(`${a}_pattern_${i}_rows:`);for(let s=0;s<h;s++){const y=((m=u==null?void 0:u.rows)==null?void 0:m[s])||{},g=[];an.forEach(A=>{const T=_n(y,A),S=`${t.name}/pattern${i}/row${s}/${A}`;g.push(rn(T.note)),g.push(hn(T.instrument,l,n,S)),g.push(un(T.ornament,o,n,S)),g.push(mn(T.volume,n,S))}),d.push(`    DB ${g.map(A=>K(A)).join(",")}`)}d.push("")}),Array.from(l.entries()).sort((u,i)=>u[0]-i[0]).forEach(([u,i])=>{const h=fn(i.volumeEnvelope||[]),b=Jt(i.toneEnvelope||[]),m=yn(i.noiseEnvelope||[]),s=(i.ayToneEnabled===!1?0:1)<<0|(i.ayNoiseEnabled?1:0)<<1|(typeof i.ayEnvelopeShape=="number"?1:0)<<2,y=h.length>0&&typeof i.volumeLoop=="number"?i.volumeLoop===255?255:G(i.volumeLoop,0,h.length-1):255,g=b.length>0&&typeof i.toneLoop=="number"?i.toneLoop===255?255:G(i.toneLoop,0,b.length-1):255,A=m.length>0&&typeof i.noiseLoop=="number"?i.noiseLoop===255?255:G(i.noiseLoop,0,m.length-1):255,T=h.length>0?h[0]:15;d.push(`${a}_inst_${u}:`),d.push(`    DB ${K(s)}`),d.push(`    DB ${K(T)}`),d.push(`    DB ${K(G(i.ayEnvelopeShape??0,0,15))}`),d.push(`    DB ${K(G(i.noiseBaseFrequency??t.ayNoisePeriod??16,0,31))}`),d.push(`    DW ${st(qt(i.hardwareEnvelopePeriod??t.ayHardwareEnvelopePeriod))}`),d.push(`    DW ${h.length>0?`${a}_inst_${u}_vol_env`:"0"}`),d.push(`    DB ${K(h.length)}`),d.push(`    DB ${K(y)}`),d.push(`    DW ${b.length>0?`${a}_inst_${u}_tone_env`:"0"}`),d.push(`    DB ${K(b.length)}`),d.push(`    DB ${K(g)}`),d.push(`    DW ${m.length>0?`${a}_inst_${u}_noise_env`:"0"}`),d.push(`    DB ${K(m.length)}`),d.push(`    DB ${K(A)}`),h.length>0&&d.push(we(`${a}_inst_${u}_vol_env`,h)),b.length>0&&d.push(we(`${a}_inst_${u}_tone_env`,b)),m.length>0&&d.push(we(`${a}_inst_${u}_noise_env`,m)),d.push("")}),Array.from(o.entries()).sort((u,i)=>u[0]-i[0]).forEach(([u,i])=>{const h=Jt(i.data||[]),b=h.length>0&&typeof i.loopPosition=="number"?G(i.loopPosition,0,h.length-1):255;d.push(`${a}_orn_${u}:`),d.push(`    DW ${h.length>0?`${a}_orn_${u}_data`:"0"}`),d.push(`    DB ${K(h.length)}`),d.push(`    DB ${K(b)}`),h.length>0&&d.push(we(`${a}_orn_${u}_data`,h)),d.push("")}),n.length>0&&d.splice(3,0,...n.map(u=>`; WARNING: ${u}`)),{labelBase:a,asm:d.join(`
`)}}function Sn(t){const e=t.map((l,o)=>En(l,o)),a=["; ==================================================================","; TRACKER MUSIC RUNTIME (Phase 1)","; Phase 1 plays row data and loop state in ROM; descriptor tables are","; serialized now for compatibility and future expansion.","; ==================================================================","","MUSIC_TRACK_ORDER_TABLE     EQU 5","MUSIC_TRACK_PATTERN_TABLE   EQU 7","MUSIC_TRACK_INSTRUMENT_TABLE EQU 9","MUSIC_TRACK_NOISE_DEFAULT   EQU 15","","; ------------------------------------------------------------------","; music_init_system","; Reset tracker runtime RAM and default PSG mixer shadow.","; Input:  None","; Output: music_active=0, music_muted=0, music_mixer_shadow=#3F","; Destroys: AF","; ------------------------------------------------------------------","music_init_system:","    xor a","    ld (music_active), a","    ld (music_muted), a","    ld (music_loop), a","    ld (music_track_index), a","    ld (music_row_frames), a","    ld (music_row_countdown), a","    ld (music_order_pos), a","    ld (music_pattern_index), a","    ld (music_pattern_row), a","    ld (music_pattern_rows), a","    ld (music_track_ptr_l), a","    ld (music_track_ptr_h), a","    ld (music_pattern_ptr_l), a","    ld (music_pattern_ptr_h), a","    ld a, #3F","    ld (music_mixer_shadow), a","    call music_reset_channel_state","    ret","","music_reset_channel_state:","    ld a, #FF","    ld (music_ch_a_note), a","    ld (music_ch_b_note), a","    ld (music_ch_c_note), a","    xor a","    ld (music_ch_a_instrument), a","    ld (music_ch_b_instrument), a","    ld (music_ch_c_instrument), a","    ld (music_ch_a_ornament), a","    ld (music_ch_b_ornament), a","    ld (music_ch_c_ornament), a","    ld (music_ch_a_vol_step), a","    ld (music_ch_b_vol_step), a","    ld (music_ch_c_vol_step), a","    ld (music_ch_a_tone_step), a","    ld (music_ch_b_tone_step), a","    ld (music_ch_c_tone_step), a","    ld (music_ch_a_noise_step), a","    ld (music_ch_b_noise_step), a","    ld (music_ch_c_noise_step), a","    ld (music_ch_a_orn_step), a","    ld (music_ch_b_orn_step), a","    ld (music_ch_c_orn_step), a","    ld a, #0F","    ld (music_ch_a_volume), a","    ld (music_ch_b_volume), a","    ld (music_ch_c_volume), a","    ret","","music_silence_channels:","    xor a","    ld b, 0","    call psg_set_volume","    ld a, 1","    ld b, 0","    call psg_set_volume","    ld a, 2","    ld b, 0","    call psg_set_volume","    ld a, #3F","    call psg_set_mixer","    ret","","music_stop:","    push af","    call music_init_system","    call music_silence_channels","    pop af","    ret","","music_mute:","    ld a, (music_active)","    or a","    ret z","    ld a, 1","    ld (music_muted), a","    call music_silence_channels","    ret","","music_resume:","    ld a, (music_active)","    or a","    ret z","    xor a","    ld (music_muted), a","    call music_update_channel_effects","    ret","","; ------------------------------------------------------------------","; music_execute_command","; Dispatch a compact music command stream used by Game Flow nodes.","; Input:  DE -> [command, trackIndex, loopFlag]",";         command: 0=stop, 1=play, 2=mute, 3=resume, #FF=no-op","; Output: Selected command executed, DE may advance while parsing","; Destroys: AF, BC (play path), DE (play path), HL (via callees)","; ------------------------------------------------------------------","music_execute_command:","    ld a, (de)","    cp #FF","    ret z","    or a","    jp z, music_stop","    cp 1","    jp z, .play_track","    cp 2","    jp z, music_mute","    cp 3","    jp z, music_resume","    ret",".play_track:","    inc de","    ld a, (de)","    ld c, a","    inc de","    ld a, (de)","    ld b, a","    ld a, c","    call music_play_track","    ret","","music_load_track_pointer_from_index:","    add a, a","    ld e, a","    ld d, 0","    ld hl, music_track_ptr_table","    add hl, de","    ld e, (hl)","    inc hl","    ld d, (hl)","    ld a, e","    ld (music_track_ptr_l), a","    ld a, d","    ld (music_track_ptr_h), a","    ret","","music_get_track_ptr:","    ld a, (music_track_ptr_l)","    ld l, a","    ld a, (music_track_ptr_h)","    ld h, a","    ret","","music_get_track_header_ptr:","    ld e, a","    ld d, 0","    call music_get_track_ptr","    add hl, de","    ret","","music_read_track_byte:","    call music_get_track_header_ptr","    ld a, (hl)","    ret","","music_read_track_word:","    call music_get_track_header_ptr","    ld e, (hl)","    inc hl","    ld d, (hl)","    ld h, d","    ld l, e","    ret","","music_get_instrument_ptr:","    or a","    jr z, .no_instrument","    add a, a","    ld e, a","    ld d, 0","    ld a, MUSIC_TRACK_INSTRUMENT_TABLE","    call music_read_track_word","    add hl, de","    ld e, (hl)","    inc hl","    ld d, (hl)","    ld h, d","    ld l, e","    ret",".no_instrument:","    ld hl, 0","    ret","","; ------------------------------------------------------------------","; music_get_channel_instrument_ptr","; Resolve current channel instrument pointer from the cached channel id.","; Input:  C = channel index (0=A, 1=B, 2=C)","; Output: HL = instrument descriptor or 0 when none is active","; Destroys: AF, DE, HL","; ------------------------------------------------------------------","music_get_channel_instrument_ptr:","    ld hl, music_ch_instrument_base","    call music_load_channel_byte","    call music_get_instrument_ptr","    ret","","; ------------------------------------------------------------------","; music_channel_uses_hardware_env","; Check if the active instrument routes channel volume through PSG ENV.","; Input:  C = channel index (0=A, 1=B, 2=C)","; Output: A = 1 when PSG hardware envelope is enabled, else 0","; Destroys: AF, DE, HL","; ------------------------------------------------------------------","music_channel_uses_hardware_env:","    push hl","    call music_get_channel_instrument_ptr","    ld a, h","    or l","    jr z, music_channel_uses_hardware_env_no_hw_env","    ld a, (hl)","    and #04","    jr z, music_channel_uses_hardware_env_no_hw_env","    ld a, 1","    pop hl","    ret","music_channel_uses_hardware_env_no_hw_env:","    xor a","    pop hl","    ret","","; ------------------------------------------------------------------","; music_trigger_channel_attack","; Hook kept for compatibility. The preview-style hardware envelope is","; emulated in software per channel, so new-note state is already reset","; by music_apply_channel_cell before this helper is called.","; Input:  C = channel index (0=A, 1=B, 2=C)","; Output: None","; Destroys: None","; ------------------------------------------------------------------","music_trigger_channel_attack:","    ret","","; ------------------------------------------------------------------","; music_resolve_channel_volume","; Resolve per-frame channel volume.","; Current Phase 1 behavior:","; - emulates AY hardware envelope shapes in software when ayEnvelopeShape is set","; - falls back to music_ch_volume_base when no envelope data exists","; - applies a simple software volumeEnvelope when present","; Input:  C = channel index (0=A, 1=B, 2=C)","; Output: B = PSG volume 0-15","; Destroys: AF, DE, HL","; ------------------------------------------------------------------","music_resolve_channel_volume:","    push af","    push de","    push hl","    ld hl, music_ch_instrument_base","    call music_load_channel_byte","    or a","    jp z, .fallback_base","    call music_get_instrument_ptr","    ld a, h","    or l","    jp z, .fallback_base","    ld a, (hl)","    and #04","    jp nz, .hardware_env",".check_software_env:","    push hl","    ld de, 8","    add hl, de","    ld b, (hl)","    pop hl","    ld a, b","    or a","    jp z, .fallback_base","    push hl","    ld de, 6","    add hl, de","    ld e, (hl)","    inc hl","    ld d, (hl)","    pop hl","    ld hl, music_ch_vol_step_base","    call music_load_channel_byte","    cp b","    jr c, .step_ok","    push de","    push hl","    ld de, 9","    add hl, de","    ld a, (hl)","    pop hl","    pop de","    cp b","    jr c, .step_ok","    ld a, b","    push af","    ld hl, music_ch_vol_step_base","    call music_store_channel_byte","    pop af","    ld hl, music_ch_note_base","    ld a, #FF","    call music_store_channel_byte","    xor a","    ld b, a","    jp .mrcv_done",".step_ok:","    push af","    inc a","    cp b","    jr c, .next_step_ok","    push de","    push hl","    ld de, 9","    add hl, de","    ld a, (hl)","    pop hl","    pop de","    cp b","    jr c, .next_step_ok","    ld a, b",".next_step_ok:","    push de","    ld hl, music_ch_vol_step_base","    call music_store_channel_byte","    pop de","    pop af","    ld l, a","    ld h, 0","    add hl, de","    ld a, (hl)","    cp 16","    jr c, .env_volume_ok","    ld a, 15",".env_volume_ok:","    ld b, a","    jp .mrcv_done",".hardware_env:","    ld hl, music_ch_tone_step_base","    call music_load_channel_byte","    inc a","    cp 2","    jr c, .hw_store_counter","    xor a","    push af","    ld hl, music_ch_tone_step_base","    call music_store_channel_byte","    pop af","    ld hl, music_ch_vol_step_base","    call music_load_channel_byte","    cp 15","    jr nc, .hw_phase_ready","    inc a","    push af","    ld hl, music_ch_vol_step_base","    call music_store_channel_byte","    pop af","    jr .hw_phase_ready",".hw_store_counter:","    push af","    ld hl, music_ch_tone_step_base","    call music_store_channel_byte","    pop af","    ld hl, music_ch_vol_step_base","    call music_load_channel_byte",".hw_phase_ready:","    ld e, a","    push hl","    inc hl","    inc hl","    ld a, (hl)","    and #04","    pop hl","    jr z, .hw_decay","    ld b, e","    jp .mrcv_done",".hw_decay:","    ld a, 15","    sub e","    ld b, a","    jp .mrcv_done",".fallback_base:","    ld hl, music_ch_volume_base","    call music_load_channel_byte","    ld b, a",".mrcv_done:","    pop hl","    pop de","    pop af","    ret","","; ------------------------------------------------------------------","; music_resolve_channel_noise","; Resolve per-frame channel noise period, including the PT3-inspired","; software noise macro appended to the instrument descriptor.","; Input:  C = channel index (0=A, 1=B, 2=C)","; Output: A = PSG noise period 0-31","; Destroys: AF, DE, HL","; Preserves: Stack balance restored before return","; ------------------------------------------------------------------","music_resolve_channel_noise:","    push de","    push hl","    ld hl, music_ch_instrument_base","    call music_load_channel_byte","    or a","    jp z, .mrcn_track_default","    call music_get_instrument_ptr","    ld a, h","    or l","    jp z, .mrcn_track_default","    push hl","    ld de, 16","    add hl, de","    ld b, (hl)","    pop hl","    ld a, b","    or a","    jp z, .mrcn_static_noise","    push hl","    ld hl, music_ch_noise_step_base","    call music_load_channel_byte","    cp b","    jr c, .mrcn_step_ok","    ld a, b","    dec a",".mrcn_step_ok:","    push af","    pop af","    pop hl","    push af","    inc a","    cp b","    jr c, .mrcn_store_next","    push de","    ld de, 17","    add hl, de","    ld a, (hl)","    pop de","    cp b","    jr c, .mrcn_store_next","    ld a, b","    dec a",".mrcn_store_next:","    push hl","    push af","    ld hl, music_ch_noise_step_base","    call music_store_channel_byte","    pop af","    pop hl","    ld de, 14","    add hl, de","    ld e, (hl)","    inc hl","    ld d, (hl)","    pop af","    ld l, a","    ld h, 0","    add hl, de","    ld a, (hl)","    and #1F","    jp .mrcn_done",".mrcn_static_noise:","    push de","    ld de, 3","    add hl, de","    ld a, (hl)","    pop de","    and #1F","    jp .mrcn_done",".mrcn_track_default:","    ld a, MUSIC_TRACK_NOISE_DEFAULT","    call music_read_track_byte","    and #1F",".mrcn_done:","    pop hl","    pop de","    ret","","; ------------------------------------------------------------------","; music_play_track","; Start a serialized PSG tracker song from ROM.","; Input:  A = track index in music_track_ptr_table",";         B bit 0 = loop enabled flag","; Output: music_active=1 and first row applied immediately","; Destroys: AF, BC, DE, HL","; Preserves: Stack balance restored on all exits","; ------------------------------------------------------------------","music_play_track:","    push bc","    push de","    push hl","    ld hl, music_track_count","    cp (hl)","    jp nc, .done","    ld (music_track_index), a","    call music_load_track_pointer_from_index","    ld a, b","    and 1","    ld (music_loop), a","    xor a","    ld (music_muted), a","    ld (music_order_pos), a","    ld (music_pattern_index), a","    ld (music_pattern_row), a","    ld a, 1","    ld (music_active), a","    call music_reset_channel_state","    call music_apply_row",".done:","    pop hl","    pop de","    pop bc","    ret","","music_store_channel_byte:","    push de","    ld e, c","    ld d, 0","    add hl, de","    ld (hl), a","    pop de","    ret","","music_load_channel_byte:","    push de","    ld e, c","    ld d, 0","    add hl, de","    ld a, (hl)","    pop de","    ret","","music_apply_channel_cell:","    ld c, a","    ld d, 0","    ld a, (hl)","    inc hl","    cp #FF","    jp z, .note_done","    cp #FE","    jp nz, .store_note","    ld a, #FF","    jr .store_note",".store_note:","    cp #FF","    jr z, .store_note_value","    ld d, 1",".store_note_value:","    push hl","    ld hl, music_ch_note_base","    call music_store_channel_byte","    xor a","    ld hl, music_ch_vol_step_base","    call music_store_channel_byte","    ld hl, music_ch_tone_step_base","    call music_store_channel_byte","    ld hl, music_ch_noise_step_base","    call music_store_channel_byte","    ld hl, music_ch_orn_step_base","    call music_store_channel_byte","    pop hl",".note_done:","    ld a, (hl)","    inc hl","    cp #FF","    jp z, .instrument_done","    push hl","    ld hl, music_ch_instrument_base","    call music_store_channel_byte","    pop hl",".instrument_done:","    ld a, (hl)","    inc hl","    cp #FF","    jp z, .ornament_done","    push hl","    ld hl, music_ch_ornament_base","    call music_store_channel_byte","    pop hl",".ornament_done:","    ld a, (hl)","    inc hl","    cp #FF","    jr z, .maybe_trigger_attack","    push hl","    ld hl, music_ch_volume_base","    call music_store_channel_byte","    pop hl",".maybe_trigger_attack:","    ld a, d","    or a","    ret z","    push hl","    call music_trigger_channel_attack","    pop hl","    ret","","; ------------------------------------------------------------------","; music_apply_row","; Decode current order/pattern row and cache channel state for A/B/C.","; Input:  Runtime variables select track/order/pattern position","; Output: Channel note/instrument/volume caches updated",";         Row countdown reloaded and PSG refreshed once","; Destroys: AF, BC, DE, HL","; ------------------------------------------------------------------","music_apply_row:","    ld a, MUSIC_TRACK_ORDER_TABLE","    call music_read_track_word","    ld a, (music_order_pos)","    ld e, a","    ld d, 0","    add hl, de","    ld a, (hl)","    ld (music_pattern_index), a","    ld a, MUSIC_TRACK_PATTERN_TABLE","    call music_read_track_word","    ld a, (music_pattern_index)","    ld e, a","    ld d, 0","    add hl, de","    add hl, de","    add hl, de","    ld e, (hl)","    inc hl","    ld d, (hl)","    inc hl","    ld a, (hl)","    ld (music_pattern_rows), a","    ld a, e","    ld (music_pattern_ptr_l), a","    ld a, d","    ld (music_pattern_ptr_h), a","    ld h, d","    ld l, e","    ld a, (music_pattern_row)","    or a","    jp z, .row_ptr_ready","    ld b, a",".row_offset_loop:","    ld de, 12","    add hl, de","    djnz .row_offset_loop",".row_ptr_ready:","    xor a","    call music_apply_channel_cell","    ld a, 1","    call music_apply_channel_cell","    ld a, 2","    call music_apply_channel_cell","    ld a, (music_pattern_row)","    inc a","    ld d, a","    ld a, (music_pattern_rows)","    cp d","    jp z, .advance_order","    jp c, .advance_order","    ld a, d","    ld (music_pattern_row), a","    jp .row_done",".advance_order:","    xor a","    ld (music_pattern_row), a","    ld a, (music_order_pos)","    inc a","    ld d, a","    ld a, 1","    call music_read_track_byte","    cp d","    jp z, .end_of_order","    jp c, .end_of_order","    ld a, d","    ld (music_order_pos), a","    jp .row_done",".end_of_order:","    ld a, (music_loop)","    or a","    jp z, music_stop","    ld a, 2","    call music_read_track_byte","    ld (music_order_pos), a",".row_done:","    xor a","    call music_read_track_byte","    ld (music_row_frames), a","    ld (music_row_countdown), a","    call music_update_channel_effects","    ret","","; ------------------------------------------------------------------","; music_update","; Advance the tracker once per game frame.","; Input:  None","; Output: Current channel PSG state refreshed; next row applied when due","; Destroys: AF, BC, DE, HL","; ------------------------------------------------------------------","music_update:","    ld a, (music_active)","    or a","    ret z","    ld a, (music_muted)","    or a","    ret nz","    call music_update_channel_effects","    ld a, (music_row_countdown)","    or a","    jp z, music_apply_row","    dec a","    ld (music_row_countdown), a","    ret nz","    call music_apply_row","    ret","","; ------------------------------------------------------------------","; music_update_channel_effects","; Rebuild mixer bits and push current cached channel state to PSG.","; Input:  music_ch_* caches already populated","; Output: PSG tone/volume registers updated for channels A/B/C",";         music_mixer_shadow rewritten with current enable bits","; Destroys: AF, BC, DE, HL","; ------------------------------------------------------------------","music_update_channel_effects:","    ld a, #3F","    ld (music_mixer_shadow), a","    ld c, 0","    call music_update_one_channel","    ld c, 1","    call music_update_one_channel","    ld c, 2","    call music_update_one_channel","    ld a, (music_mixer_shadow)","    call psg_set_mixer","    ret","","; ------------------------------------------------------------------","; music_update_one_channel","; Apply one cached channel to PSG and update the mixer shadow bits.","; Input:  C = channel index (0=A, 1=B, 2=C)","; Output: Channel PSG tone/volume updated or silenced",";         music_mixer_shadow updated for that channel","; Destroys: AF, BC, DE, HL","; Preserves: Stack balance restored before return","; ------------------------------------------------------------------","music_update_one_channel:","    push bc","    push de","    push hl","    ld hl, music_ch_note_base","    call music_load_channel_byte","    cp #FF","    jp z, .silent_channel","    add a, a","    ld e, a","    ld d, 0","    ld hl, music_note_period_table","    add hl, de","    ld e, (hl)","    inc hl","    ld d, (hl)","    ld h, d","    ld l, e","    ld a, c","    push bc","    call psg_set_tone","    pop bc","    call music_resolve_channel_volume","    ld a, c","    push bc","    call psg_set_volume","    pop bc","    ld d, 1","    ld e, 0","    call music_get_channel_instrument_ptr","    ld a, h","    or l","    jr z, .apply_mixer_bits","    ld a, (hl)","    and #01","    ld d, a","    ld a, (hl)","    and #02","    srl a","    ld e, a","    ld a, e","    or a","    jr z, .apply_mixer_bits","    push de","    call music_resolve_channel_noise","    call psg_set_noise","    pop de",".apply_mixer_bits:","    ld a, (music_mixer_shadow)","    ld b, a","    ld a, c","    cp 1","    jp z, .enable_b","    cp 2","    jp z, .enable_c","    ld a, b","    bit 0, d","    jr z, .a_tone_off","    and #3E","    jr .a_noise_gate",".a_tone_off:","    or #01",".a_noise_gate:","    bit 0, e","    jr z, .a_noise_off","    and #37","    jp .store_mixer",".a_noise_off:","    or #08","    jp .store_mixer",".enable_b:","    ld a, b","    bit 0, d","    jr z, .b_tone_off","    and #3D","    jr .b_noise_gate",".b_tone_off:","    or #02",".b_noise_gate:","    bit 0, e","    jr z, .b_noise_off","    and #2F","    jp .store_mixer",".b_noise_off:","    or #10","    jp .store_mixer",".enable_c:","    ld a, b","    bit 0, d","    jr z, .c_tone_off","    and #3B","    jr .c_noise_gate",".c_tone_off:","    or #04",".c_noise_gate:","    bit 0, e","    jr z, .c_noise_off","    and #1F","    jp .store_mixer",".c_noise_off:","    or #20","    jp .store_mixer",".silent_channel:","    ld b, 0","    ld a, c","    push bc","    call psg_set_volume","    pop bc","    ld a, (music_mixer_shadow)","    ld b, a","    ld a, c","    cp 1","    jp z, .disable_b","    cp 2","    jp z, .disable_c","    ld a, b","    or #09","    jp .store_mixer",".disable_b:","    ld a, b","    or #12","    jp .store_mixer",".disable_c:","    ld a, b","    or #24",".store_mixer:","    ld (music_mixer_shadow), a","    pop hl","    pop de","    pop bc","    ret","",gn(),"","music_track_count:",`    DB ${K(e.length)}`,"","music_track_ptr_table:"];return e.length===0?a.push("    DW 0"):e.forEach(l=>{a.push(`    DW ${l.labelBase}_data`)}),e.length>0&&(a.push(""),e.forEach(l=>{a.push(l.asm)})),a.join(`
`)}function An(t){var l,o,n,c;const e=((o=(l=t.tiles)==null?void 0:l[0])==null?void 0:o.width)||8,a=((c=(n=t.tiles)==null?void 0:n[0])==null?void 0:c.height)||8;return`; ==================================================================
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
    ld a, ${e}
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
    ${e===8?`
    ; Tile width is 8, shift right 3 times
    ld a, c
    srl b
    rra
    srl b
    rra
    srl b
    rra`:e===16?`
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
    ; Tile width is ${e}, divide
    ld a, c
    ld c, ${e}
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
`}const Tn="SCREEN 2 (Graphics I)";function me(t,e,a=0,l=255){return Number.isFinite(t)?t<a?a:t>l?l:Math.floor(t):e}function rt(t){return String(t||"").trim().toLowerCase()}function Cn(t){const e=String(t||"").trim();if(!e)return null;const a=e.match(/^(.*?)(?:[_\-\s](?:f|frame))(\d+)$/i);if(!a)return null;const l=String(a[1]||"").trim(),o=parseInt(a[2],10);return!l||Number.isNaN(o)?null:{groupId:l,frameOrder:o}}const ha={rotate_left:1,rotate_right:2,shift_left:3,shift_right:4,shift_up:5,shift_down:6,swap_top_bottom:7};function In(t){return String(t||"").trim().toLowerCase()==="transform"?"transform":"frames"}function ua(t){const e=String(t||"").trim().toLowerCase();return e&&Object.prototype.hasOwnProperty.call(ha,e)?e:null}function vn(t){const e=(t==null?void 0:t.animation)??(t==null?void 0:t.animatedTile)??(t==null?void 0:t.tileAnimation)??null;if((typeof(e==null?void 0:e.enabled)=="boolean"?e.enabled:typeof(t==null?void 0:t.isAnimated)=="boolean"?t.isAnimated:void 0)===!1||e===!1)return{enabled:!1,mode:"frames",groupId:null,frameOrder:null,speed:null,baseTileId:null,transformEffect:null,transformIncludeColors:!0};const l=(t==null?void 0:t.animationGroup)??(e==null?void 0:e.groupId)??(e==null?void 0:e.group)??(e==null?void 0:e.name)??(e==null?void 0:e.id)??null,o=typeof l=="string"&&l.trim()?l.trim():null,n=(t==null?void 0:t.animationFrameIndex)??(t==null?void 0:t.frameIndex)??(e==null?void 0:e.frameIndex)??(e==null?void 0:e.frame)??null,c=Number.isFinite(Number(n))?me(Number(n),0):null,r=(t==null?void 0:t.animationSpeed)??(t==null?void 0:t.animationSpeedFrames)??(e==null?void 0:e.speed)??(e==null?void 0:e.speedFrames)??(e==null?void 0:e.ticksPerFrame)??null,p=Number.isFinite(Number(r))?me(Number(r),8,1,255):null,d=(t==null?void 0:t.animationBaseTileId)??(e==null?void 0:e.baseTileId)??(e==null?void 0:e.targetTileId)??null,u=typeof d=="string"&&d.trim()?d.trim():null,i=(e==null?void 0:e.transform)??null,h=ua((t==null?void 0:t.animationTransformEffect)??(e==null?void 0:e.transformEffect)??(i==null?void 0:i.effect)??(e==null?void 0:e.effect)),b=(t==null?void 0:t.animationMode)??(e==null?void 0:e.mode)??(e==null?void 0:e.animationMode)??(h?"transform":null),m=In(b),s=h||(m==="transform"?"rotate_left":null),y=(t==null?void 0:t.animationTransformIncludeColors)??(e==null?void 0:e.animationTransformIncludeColors)??(i==null?void 0:i.includeColors);return{enabled:!0,mode:m,groupId:o,frameOrder:c,speed:p,baseTileId:u,transformEffect:s,transformIncludeColors:typeof y=="boolean"?y:!0}}function wn(t){const e=new Map,a=Array.isArray(t.tiles)?t.tiles:[];let l=128;return a.forEach((o,n)=>{if(!(o!=null&&o.id))return;const c=Math.max(1,Math.ceil((o.width||8)/8)),r=Math.max(1,Math.ceil((o.height||8)/8)),p=c*r;e.set(o.id,{charCode:l,charsPerTile:p,tileIndex:n}),l+=p}),e}function Ln(t){return`#${me(t,0).toString(16).toUpperCase().padStart(2,"0")}`}function ea(t,e){return String(t||"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"")||e}function Rn(t,e=16){if(!t.length)return"    db #00";const a=[];for(let l=0;l<t.length;l+=e){const o=t.slice(l,l+e).map(Ln).join(", ");a.push(`    db ${o}`)}return a.join(`
`)}function Dn(t){var c,r;const e=Array.isArray(t.tiles)?t.tiles:[];if(!e.length)return{frameGroups:[],transformGroups:[]};const a=wn(t),l=new Map,o=[];e.forEach((p,d)=>{const u=String((p==null?void 0:p.id)||"").trim();if(!u)return;const i=a.get(u);if(!i)return;const h=vn(p);if(!h.enabled)return;const b=Cn((p==null?void 0:p.name)||""),m=(h.groupId||(b==null?void 0:b.groupId)||(p==null?void 0:p.name)||u||"").trim();if(h.mode==="transform"){const T=ua(h.transformEffect);if(!T)return;const f=(h.baseTileId&&a.has(h.baseTileId)?h.baseTileId:null)||u,_=a.get(f);if(!_)return;const E=_.charCode,I=_.charsPerTile;if(E<0||E+I-1>255)return;const C=ha[T];if(!C)return;const w=h.transformIncludeColors?1:0,D=`anim_transform_${o.length}_${ea(m,`t${o.length}`)}`;o.push({label:D,groupId:m,speed:me(h.speed??8,8,1,255),targetTileId:f,targetCharCode:E,charsPerTile:I,operationCode:C,flags:w});return}if(!m)return;let s=h.frameOrder;s===null&&b&&(!h.groupId||rt(h.groupId)===rt(b.groupId))&&(s=b.frameOrder),s===null&&(s=i.tileIndex);const y=me(h.speed??8,8,1,255),g=rt(m),A=l.get(g)||[];A.push({tile:p,tileIndex:d,tileId:u,groupId:m,frameOrder:s,speed:y,baseTileId:h.baseTileId}),l.set(g,A)});const n=[];for(const p of l.values()){if(p.length<2)continue;const d=[...p].sort((f,_)=>f.frameOrder!==_.frameOrder?f.frameOrder-_.frameOrder:f.tileIndex-_.tileIndex),i=((c=d.find(f=>!!f.baseTileId&&a.has(f.baseTileId)))==null?void 0:c.baseTileId)||null||d[0].tileId,h=a.get(i);if(!h)continue;const b=d.filter(f=>{const _=a.get(f.tileId);return!!_&&_.charsPerTile===h.charsPerTile});if(b.length<2)continue;const m=h.charCode,s=h.charsPerTile;if(m<0||m+s-1>255)continue;const y=[],g=s*8;let A=b[0].speed;for(const f of b){const _=Array.from(la(f.tile,Tn)||[]);if(_.length!==g)continue;const E=oa(f.tile),I=241,C=E?Array.from(E).slice(0,g):new Array(g).fill(I);for(;C.length<g;)C.push(I);const w=[];for(let D=0;D<s;D++){const N=D*8;w.push(..._.slice(N,N+8)),w.push(...C.slice(N,N+8))}y.push({tileName:String(((r=f.tile)==null?void 0:r.name)||f.tileId),bytes:w}),A=Math.min(A,f.speed)}if(y.length<2)continue;const T=b[0].groupId,S=`anim_group_${n.length}_${ea(T,`g${n.length}`)}`;n.push({label:S,groupId:T,speed:me(A,8,1,255),targetTileId:i,targetCharCode:m,charsPerTile:s,frameCount:me(y.length,y.length,2,255),bytesPerFrame:s*16,frames:y})}return{frameGroups:n,transformGroups:o}}function Nn(t){var b,m;const{frameGroups:e,transformGroups:a}=Dn(t),l=e.length>0,o=a.length>0,n=me(((b=e[0])==null?void 0:b.speed)??((m=a[0])==null?void 0:m.speed)??8,8,1,255),c=Math.max(1,e.length+a.length),r=l?e.map(s=>`    db ${s.targetCharCode}, ${s.charsPerTile}, ${s.frameCount}, ${s.speed}, ${s.bytesPerFrame}    ; ${s.groupId} -> tile ${s.targetTileId}
    dw ${s.label}`).join(`
`):"    ; No animated tile groups detected in project data",p=o?a.map(s=>`    db ${s.targetCharCode}, ${s.charsPerTile}, ${s.operationCode}, ${s.flags}    ; ${s.groupId} -> tile ${s.targetTileId}`).join(`
`):"    ; No transform tile groups detected in project data",d=l?e.map(s=>{const y=s.frames.slice(0,s.frameCount).map((g,A)=>`    ; Frame ${A}: ${g.tileName}
${Rn(g.bytes)}`).join(`
`);return`${s.label}:
    ; Group "${s.groupId}" targetChar=${s.targetCharCode} chars=${s.charsPerTile}
${y}
`}).join(`
`):`anim_group_empty_data:
    db #00
`,h=[l?`    call mapper_push_p2
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
    ld a, (anim_tile_frame)
.anim_mod_loop:
    cp b
    jr c, .anim_mod_done
    sub b
    jr .anim_mod_loop
.anim_mod_done:

    ; DE = frame offset (frame * bytes_per_frame)
    ld d, 0
    ld e, 0
.anim_mul_loop:
    or a
    jr z, .anim_mul_done
    push af
    ld a, e
    add a, c
    ld e, a
    ld a, d
    adc a, 0
    ld d, a
    pop af
    dec a
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
    call mapper_pop_p2`:"",o?"    call update_animated_transform_tiles_vram":""].filter(Boolean).join(`
`);return`; ==================================================================
; ANIMATED TILES SYSTEM
; File: animtiles.asm
; Description: Background tile animation for water, lava, fire, etc.
; ==================================================================

; Auto-detected animated groups:
;   frame groups: ${e.length}
;   transform groups: ${a.length}

; ==================================================================
; ANIMATED TILES CONSTANTS
; ==================================================================

; Animation speeds (in frames)
ANIM_SPEED_SLOW         EQU 15      ; ~250ms (water)
ANIM_SPEED_MEDIUM       EQU 8       ; ~133ms (lava)
ANIM_SPEED_FAST         EQU 4       ; ~66ms (fire)

; Maximum animated tiles
MAX_ANIM_TILES          EQU ${c}
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
${h}
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

    ; Pattern bank 0
    push bc
    push de
    ld hl, CHRTBL2
    add hl, bc
    call anim_transform_vram_block
    pop de
    pop bc

    ; Pattern bank 1
    push bc
    push de
    ld hl, CHRTBL2 + #800
    add hl, bc
    call anim_transform_vram_block
    pop de
    pop bc

    ; Pattern bank 2
    push bc
    push de
    ld hl, CHRTBL2 + #1000
    add hl, bc
    call anim_transform_vram_block
    pop de
    pop bc

    ; Color transforms only for vertical row operations (5..7) and if enabled
    ld a, d
    cp 5
    jr c, .anim_transform_char_done

    ld a, (anim_tile_transform_flags)
    and 1
    jr z, .anim_transform_char_done

    ; Color bank 0
    push bc
    push de
    ld hl, CLRTBL2
    add hl, bc
    call anim_transform_vram_block
    pop de
    pop bc

    ; Color bank 1
    push bc
    push de
    ld hl, CLRTBL2 + #800
    add hl, bc
    call anim_transform_vram_block
    pop de
    pop bc

    ; Color bank 2
    push bc
    push de
    ld hl, CLRTBL2 + #1000
    add hl, bc
    call anim_transform_vram_block
    pop de
    pop bc

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
    ld a, d
    cp 5
    jr nc, .anim_transform_vertical

    ; Horizontal bit transforms (operate row by row)
    ld b, 8
.anim_transform_horizontal_loop:
    push hl
    call FAST_RDVRM                 ; A = row byte from VRAM[HL]
    pop hl

    ld e, a
    ld a, d
    cp 1
    jr nz, .anim_not_rl
    ld a, e
    rlca
    jr .anim_write_row
.anim_not_rl:
    cp 2
    jr nz, .anim_not_rr
    ld a, e
    rrca
    jr .anim_write_row
.anim_not_rr:
    cp 3
    jr nz, .anim_not_sla
    ld a, e
    sla a
    jr .anim_write_row
.anim_not_sla:
    ld a, e
    srl a

.anim_write_row:
    call FAST_WRTVRM
    inc hl
    djnz .anim_transform_horizontal_loop
    ret

.anim_transform_vertical:
    push de                        ; Preserve D=operation code (DE reused as pointers)
    ; Read current 8 row bytes into temporary RAM buffer
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

    ; Restore HL to start of block (HL -= 8)
    ld de, #FFF8
    add hl, de
    pop de                         ; Restore original operation code in D

    ld a, d
    cp 5
    jr nz, .anim_not_shift_up

    ; shift_up: row0<-row1 ... row6<-row7 row7<-row0
    ld de, anim_tile_row_buffer + 1
    ld b, 7
.anim_write_up_loop:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_up_loop
    ld a, (anim_tile_row_buffer)
    call FAST_WRTVRM
    ret

.anim_not_shift_up:
    cp 6
    jr nz, .anim_not_shift_down

    ; shift_down: row0<-row7 row1<-row0 ... row7<-row6
    ld a, (anim_tile_row_buffer + 7)
    call FAST_WRTVRM
    inc hl
    ld de, anim_tile_row_buffer
    ld b, 7
.anim_write_down_loop:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_down_loop
    ret

.anim_not_shift_down:
    ; swap_top_bottom: row0<->row7, middle rows unchanged
    ld a, (anim_tile_row_buffer + 7)
    call FAST_WRTVRM
    inc hl
    ld de, anim_tile_row_buffer + 1
    ld b, 6
.anim_write_middle_loop:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_middle_loop
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
${p}
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
`}function xn(t){var e,a,l,o;return(a=(e=t.tiles)==null?void 0:e[0])!=null&&a.width,(o=(l=t.tiles)==null?void 0:l[0])!=null&&o.height,`; ==================================================================
; PARTICLE SYSTEM (VRAM Pattern Redefinition)
; File: particles.asm
; Description: Visual effects using dynamic tile pattern updates
; ==================================================================

; ==================================================================
; PARTICLE SYSTEM CONSTANTS
; ==================================================================

; Maximum active particles
MAX_PARTICLES           EQU 8       ; Support up to 8 simultaneous particles

; Reserved tile IDs for particles (248-255)
PARTICLE_TILE_BASE      EQU 248     ; First tile ID for particles

; Particle types
PARTICLE_NONE           EQU 0       ; Inactive particle slot
PARTICLE_EXPLOSION      EQU 1       ; Explosion (4 frames, expands outward)
PARTICLE_SMOKE          EQU 2       ; Smoke puff (4 frames, rises up)
PARTICLE_SPARK          EQU 3       ; Spark/flash (2 frames, quick)
PARTICLE_DUST           EQU 4       ; Dust cloud (3 frames, fades)
PARTICLE_IMPACT         EQU 5       ; Impact star (3 frames, shrinks)
PARTICLE_DEBRIS         EQU 6       ; Debris chunk (2 frames, falls)
PARTICLE_MUZZLE_FLASH   EQU 7       ; Muzzle flash (2 frames, instant)
PARTICLE_WATER_SPLASH   EQU 8       ; Water splash (4 frames, arcs)

; Particle lifetimes (in frames)
LIFE_EXPLOSION          EQU 16      ; ~267ms
LIFE_SMOKE              EQU 24      ; ~400ms
LIFE_SPARK              EQU 8       ; ~133ms
LIFE_DUST               EQU 12      ; ~200ms
LIFE_IMPACT             EQU 10      ; ~167ms
LIFE_DEBRIS             EQU 20      ; ~333ms
LIFE_MUZZLE_FLASH       EQU 4       ; ~67ms (very quick)
LIFE_WATER_SPLASH       EQU 18      ; ~300ms

; Particle pool structure (8 bytes per particle)
; Offset 0: Type (PARTICLE_*)
; Offset 1: Lifetime remaining (frames)
; Offset 2: X position (screen coords, 0-31 tiles)
; Offset 3: Y position (screen coords, 0-23 tiles)
; Offset 4: Animation frame (0-3)
; Offset 5: Tile ID assigned (248-255)
; Offset 6: Velocity X (signed, -128 to 127)
; Offset 7: Velocity Y (signed, -128 to 127)

PARTICLE_STRUCT_SIZE    EQU 8

; ==================================================================
; PARTICLE SYSTEM INITIALIZATION
; ==================================================================

init_particle_system:
    ; Clear particle pool
    ld hl, particle_pool
    ld de, particle_pool + 1
    ld bc, MAX_PARTICLES * PARTICLE_STRUCT_SIZE - 1
    ld (hl), PARTICLE_NONE
    ldir

    ; Initialize tile ID assignments
    ld a, PARTICLE_TILE_BASE
    ld b, MAX_PARTICLES
    ld hl, particle_pool + 5    ; Offset to tile_id field
.part_init_tile_loop:
    ld (hl), a
    inc a
    ld de, PARTICLE_STRUCT_SIZE
    add hl, de
    djnz .part_init_tile_loop

    ret

; ==================================================================
; PARTICLE SPAWNING FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; spawn_particle
; Create a new particle at given position
; Input:  A = Particle type (PARTICLE_*)
;         B = X position (tile coords, 0-31)
;         C = Y position (tile coords, 0-23)
;         D = Velocity X (optional, signed)
;         E = Velocity Y (optional, signed)
; Output: A = 1 if spawned successfully, 0 if pool full
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
spawn_particle:
    push af                     ; Save particle type
    push bc                     ; Save position
    push de                     ; Save velocity

    ; Find free particle slot
    call find_free_particle
    jr z, .part_spawn_failed    ; Z flag set = no free slots

    ; HL points to free particle structure
    pop de                      ; Restore velocity
    pop bc                      ; Restore position
    pop af                      ; Restore type

    ; Fill particle structure
    ld (hl), a                  ; Offset 0: type
    inc hl

    ; Set lifetime based on type
    push hl
    call get_particle_lifetime  ; A = type -> A = lifetime
    pop hl
    ld (hl), a                  ; Offset 1: lifetime
    inc hl

    ld (hl), b                  ; Offset 2: X position
    inc hl
    ld (hl), c                  ; Offset 3: Y position
    inc hl

    xor a
    ld (hl), a                  ; Offset 4: frame = 0
    inc hl
    inc hl                      ; Skip tile_id (already assigned)

    ld (hl), d                  ; Offset 6: velocity X
    inc hl
    ld (hl), e                  ; Offset 7: velocity Y

    ; Place particle tile on screen immediately
    dec hl
    dec hl
    dec hl
    dec hl
    dec hl
    dec hl                      ; Back to start of structure
    call draw_particle_tile

    ld a, 1                     ; Success
    ret

.part_spawn_failed:
    pop de
    pop bc
    pop af
    xor a                       ; Failed
    ret

; ------------------------------------------------------------------
; find_free_particle
; Find first inactive particle slot
; Output: HL = Address of free particle, Z flag clear
;         Z flag set if no free slots
; ------------------------------------------------------------------
find_free_particle:
    ld hl, particle_pool
    ld b, MAX_PARTICLES
.part_find_loop:
    ld a, (hl)
    cp PARTICLE_NONE
    ret z                       ; Found free slot

    ld de, PARTICLE_STRUCT_SIZE
    add hl, de
    djnz .part_find_loop

    ; No free slot found
    xor a
    or 1                        ; Clear Z flag
    ret

; ------------------------------------------------------------------
; get_particle_lifetime
; Get default lifetime for particle type
; Input:  A = Particle type
; Output: A = Lifetime in frames
; ------------------------------------------------------------------
get_particle_lifetime:
    ld hl, particle_lifetime_table
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
    ret

particle_lifetime_table:
    db 0                        ; PARTICLE_NONE
    db LIFE_EXPLOSION           ; PARTICLE_EXPLOSION
    db LIFE_SMOKE               ; PARTICLE_SMOKE
    db LIFE_SPARK               ; PARTICLE_SPARK
    db LIFE_DUST                ; PARTICLE_DUST
    db LIFE_IMPACT              ; PARTICLE_IMPACT
    db LIFE_DEBRIS              ; PARTICLE_DEBRIS
    db LIFE_MUZZLE_FLASH        ; PARTICLE_MUZZLE_FLASH
    db LIFE_WATER_SPLASH        ; PARTICLE_WATER_SPLASH

; ==================================================================
; PARTICLE UPDATE FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; update_particles
; Update all active particles (call every frame)
; Decrements lifetime, advances animation, applies velocity
; ------------------------------------------------------------------
update_particles:
    ld hl, particle_pool
    ld b, MAX_PARTICLES
.part_update_loop:
    push bc
    push hl

    ; Check if particle is active
    ld a, (hl)
    cp PARTICLE_NONE
    jr z, .part_update_next     ; Skip inactive

    ; Decrement lifetime
    inc hl                      ; Offset 1: lifetime
    ld a, (hl)
    dec a
    ld (hl), a
    jr z, .part_update_kill     ; Lifetime expired

    ; Advance animation frame
    inc hl
    inc hl
    inc hl                      ; Offset 4: frame
    ld a, (hl)
    inc a
    and #03                     ; Wrap at 4 frames
    ld (hl), a

    ; Apply velocity (simple physics)
    inc hl
    inc hl                      ; Offset 6: velocity X
    ld a, (hl)
    or a
    jr z, .part_update_skip_vx

    ; Update X position
    dec hl
    dec hl
    dec hl
    dec hl                      ; Offset 2: X position
    ld b, (hl)
    inc hl
    inc hl
    inc hl
    inc hl
    ld a, (hl)
    add a, b
    dec hl
    dec hl
    dec hl
    dec hl
    ld (hl), a                  ; Store new X
    inc hl
    inc hl
    inc hl
    inc hl

.part_update_skip_vx:
    ; Apply velocity Y
    inc hl                      ; Offset 7: velocity Y
    ld a, (hl)
    or a
    jr z, .part_update_skip_vy

    ; Update Y position
    dec hl
    dec hl
    dec hl
    dec hl
    dec hl                      ; Offset 3: Y position
    ld b, (hl)
    inc hl
    inc hl
    inc hl
    inc hl
    inc hl
    ld a, (hl)
    add a, b
    dec hl
    dec hl
    dec hl
    dec hl
    dec hl
    ld (hl), a                  ; Store new Y
    inc hl
    inc hl
    inc hl
    inc hl
    inc hl

.part_update_skip_vy:
    ; Redraw particle with new frame
    pop hl
    push hl
    call draw_particle_tile

    jr .part_update_next

.part_update_kill:
    ; Clear particle tile from screen
    pop hl
    push hl
    call clear_particle_tile

    ; Mark particle as inactive
    pop hl
    push hl
    ld (hl), PARTICLE_NONE

.part_update_next:
    pop hl
    pop bc
    ld de, PARTICLE_STRUCT_SIZE
    add hl, de
    djnz .part_update_loop

    ret

; ==================================================================
; PARTICLE RENDERING FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; draw_particle_tile
; Draw particle at its position using its tile ID
; Input:  HL = Address of particle structure
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
draw_particle_tile:
    push hl

    ; Get position (offsets 2, 3)
    inc hl
    inc hl
    ld b, (hl)                  ; B = X tile
    inc hl
    ld c, (hl)                  ; C = Y tile

    ; Get tile ID (offset 5)
    inc hl
    inc hl
    ld a, (hl)                  ; A = tile ID

    ; Calculate name table address
    ; NAMETBL + (Y * 32) + X
    push af                     ; Save tile ID
    ld a, c
    add a, a
    add a, a
    add a, a
    add a, a
    add a, a                    ; Y * 32
    add a, b                    ; + X
    ld e, a
    ld d, 0
    ld hl, NAMETBL
    add hl, de                  ; HL = VRAM address

    ; Write tile ID to name table
    pop af                      ; Restore tile ID
    call WRTVRM

    ; Now update pattern in VRAM
    pop hl
    push hl
    call update_particle_pattern

    pop hl
    ret

; ------------------------------------------------------------------
; clear_particle_tile
; Clear particle from screen (set tile to 0)
; Input:  HL = Address of particle structure
; ------------------------------------------------------------------
clear_particle_tile:
    push hl

    ; Get position
    inc hl
    inc hl
    ld b, (hl)                  ; B = X
    inc hl
    ld c, (hl)                  ; C = Y

    ; Calculate name table address
    ld a, c
    add a, a
    add a, a
    add a, a
    add a, a
    add a, a                    ; Y * 32
    add a, b
    ld e, a
    ld d, 0
    ld hl, NAMETBL
    add hl, de

    ; Write 0 (blank tile)
    xor a
    call WRTVRM

    pop hl
    ret

; ------------------------------------------------------------------
; update_particle_pattern
; Redefine particle's pattern in VRAM based on type and frame
; Input:  HL = Address of particle structure
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
update_particle_pattern:
    ; Get type and frame
    ld a, (hl)                  ; Offset 0: type
    ld b, a                     ; B = type
    inc hl
    inc hl
    inc hl
    inc hl
    ld a, (hl)                  ; Offset 4: frame
    ld c, a                     ; C = frame
    dec hl
    dec hl
    inc hl
    ld a, (hl)                  ; Offset 5: tile ID
    ld d, a                     ; D = tile ID

    ; Calculate pattern source address
    ; particle_patterns + (type * 32) + (frame * 8)
    ld a, b                     ; A = type
    add a, a
    add a, a
    add a, a
    add a, a
    add a, a                    ; * 32 (4 frames * 8 bytes)
    ld l, a
    ld h, 0

    ld a, c                     ; A = frame
    add a, a
    add a, a
    add a, a                    ; * 8
    ld e, a
    ld d, 0
    add hl, de

    ld de, particle_patterns
    add hl, de                  ; HL = source pattern address

    ; Calculate VRAM destination
    ; CHRTBL + (tile_id * 8)
    ld a, d                     ; A = tile ID
    ld e, a
    ld d, 0
    ex de, hl                   ; DE = source, HL = tile_id
    add hl, hl
    add hl, hl
    add hl, hl                  ; * 8
    ld bc, CHRTBL
    add hl, bc                  ; HL = VRAM address

    ex de, hl                   ; DE = VRAM, HL = source

    ; Copy 8 bytes to VRAM
    ld bc, 8
    call LDIRVM

    ret

; ==================================================================
; PARTICLE PATTERN DATA
; ==================================================================
; Each particle type has 4 frames, 8 bytes each = 32 bytes total
; Frame progression creates animation effect

particle_patterns:

; ---- PARTICLE_NONE (type 0) - Empty ----
    db #00, #00, #00, #00, #00, #00, #00, #00
    db #00, #00, #00, #00, #00, #00, #00, #00
    db #00, #00, #00, #00, #00, #00, #00, #00
    db #00, #00, #00, #00, #00, #00, #00, #00

; ---- PARTICLE_EXPLOSION (type 1) - Expands outward ----
    ; Frame 0: Small dot
    db #00, #00, #00, #18, #18, #00, #00, #00
    ; Frame 1: Expanding
    db #00, #18, #3C, #7E, #7E, #3C, #18, #00
    ; Frame 2: Large explosion
    db #18, #7E, #FF, #FF, #FF, #FF, #7E, #18
    ; Frame 3: Fading fragments
    db #81, #42, #24, #18, #18, #24, #42, #81

; ---- PARTICLE_SMOKE (type 2) - Puff rising ----
    ; Frame 0: Small puff
    db #00, #00, #3C, #66, #66, #3C, #00, #00
    ; Frame 1: Expanding
    db #00, #7E, #FF, #C3, #C3, #FF, #7E, #00
    ; Frame 2: Large cloud
    db #7E, #FF, #E7, #C3, #C3, #E7, #FF, #7E
    ; Frame 3: Dispersing
    db #66, #E7, #C3, #81, #81, #C3, #E7, #66

; ---- PARTICLE_SPARK (type 3) - Quick flash ----
    ; Frame 0: Bright cross
    db #10, #38, #7C, #FE, #FE, #7C, #38, #10
    ; Frame 1: Fading
    db #00, #10, #38, #7C, #7C, #38, #10, #00
    ; Frame 2: Dimmer
    db #00, #00, #10, #38, #38, #10, #00, #00
    ; Frame 3: Gone
    db #00, #00, #00, #18, #18, #00, #00, #00

; ---- PARTICLE_DUST (type 4) - Dust cloud ----
    ; Frame 0: Small dots
    db #00, #42, #00, #24, #00, #42, #00, #24
    ; Frame 1: Expanding dots
    db #24, #00, #66, #00, #24, #00, #66, #00
    ; Frame 2: Dispersed
    db #00, #81, #00, #42, #00, #81, #00, #42
    ; Frame 3: Fading
    db #42, #00, #24, #00, #42, #00, #24, #00

; ---- PARTICLE_IMPACT (type 5) - Impact star ----
    ; Frame 0: Large star
    db #18, #5A, #7E, #FF, #FF, #7E, #5A, #18
    ; Frame 1: Shrinking
    db #00, #18, #3C, #7E, #7E, #3C, #18, #00
    ; Frame 2: Small star
    db #00, #00, #18, #3C, #3C, #18, #00, #00
    ; Frame 3: Fading
    db #00, #00, #00, #18, #18, #00, #00, #00

; ---- PARTICLE_DEBRIS (type 6) - Falling chunk ----
    ; Frame 0: Solid chunk
    db #00, #3C, #7E, #7E, #7E, #7E, #3C, #00
    ; Frame 1: Tumbling
    db #00, #1E, #3F, #7F, #7F, #3F, #1E, #00
    ; Frame 2: Rotating
    db #00, #78, #FC, #FE, #FE, #FC, #78, #00
    ; Frame 3: Tumbling again
    db #00, #3C, #7E, #7E, #7E, #7E, #3C, #00

; ---- PARTICLE_MUZZLE_FLASH (type 7) - Gun flash ----
    ; Frame 0: Bright burst
    db #7E, #FF, #FF, #FF, #FF, #FF, #FF, #7E
    ; Frame 1: Fading
    db #3C, #7E, #FF, #FF, #FF, #FF, #7E, #3C
    ; Frame 2: Dimmer
    db #18, #3C, #7E, #7E, #7E, #7E, #3C, #18
    ; Frame 3: Gone
    db #00, #18, #3C, #3C, #3C, #3C, #18, #00

; ---- PARTICLE_WATER_SPLASH (type 8) - Water droplets ----
    ; Frame 0: Impact
    db #18, #3C, #7E, #FF, #FF, #7E, #3C, #18
    ; Frame 1: Droplets rising
    db #42, #66, #3C, #18, #18, #3C, #66, #42
    ; Frame 2: Arcing
    db #81, #C3, #24, #00, #00, #24, #C3, #81
    ; Frame 3: Dispersed
    db #00, #81, #42, #00, #00, #42, #81, #00

; ==================================================================
; PARTICLE UTILITY FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; clear_all_particles
; Remove all active particles from screen
; ------------------------------------------------------------------
clear_all_particles:
    ld hl, particle_pool
    ld b, MAX_PARTICLES
.part_clear_loop:
    push bc
    push hl

    ld a, (hl)
    cp PARTICLE_NONE
    jr z, .part_clear_next

    call clear_particle_tile

    pop hl
    push hl
    ld (hl), PARTICLE_NONE

.part_clear_next:
    pop hl
    pop bc
    ld de, PARTICLE_STRUCT_SIZE
    add hl, de
    djnz .part_clear_loop

    ret

; ------------------------------------------------------------------
; Helper: Spawn common particle effects
; ------------------------------------------------------------------

; Spawn explosion at entity position
; Input: B = X tile, C = Y tile
spawn_explosion:
    ld a, PARTICLE_EXPLOSION
    ld d, 0                     ; No X velocity
    ld e, 0                     ; No Y velocity
    call spawn_particle
    ret

; Spawn dust cloud at entity feet
; Input: B = X tile, C = Y tile
spawn_dust:
    ld a, PARTICLE_DUST
    ld d, 0
    ld e, 0
    call spawn_particle
    ret

; Spawn impact effect
; Input: B = X tile, C = Y tile
spawn_impact:
    ld a, PARTICLE_IMPACT
    ld d, 0
    ld e, 0
    call spawn_particle
    ret

; Spawn muzzle flash (shooting effect)
; Input: B = X tile, C = Y tile
spawn_muzzle_flash:
    ld a, PARTICLE_MUZZLE_FLASH
    ld d, 0
    ld e, 0
    call spawn_particle
    ret

; ==================================================================
; END OF PARTICLE SYSTEM
; ==================================================================
; Note: particle_pool variable is defined in variables.asm
`}function Mn(t,e,a={}){var i;if(console.log("🔧 Generating modular ASM files..."),!t)throw console.error("❌ projectName is required"),new Error("projectName is required");if(!e)throw console.error("❌ assets is undefined or null"),new Error("assets array is required");if(!Array.isArray(e))throw console.error("❌ assets is not an array"),new Error("assets must be an array");console.log(`📊 Project: ${t}, Assets: ${e.length}, Config:`,a);let l;try{l=ct(t,e),console.log(`🔍 Analysis complete: ${l.sprites.length} sprites, ${l.tiles.length} tiles`)}catch(h){console.error("❌ Error analyzing project:",h),l={hasSprites:!1,hasTiles:!1,hasScreens:!1,hasEntities:!1,hasComponents:!1,hasGameFlow:!1,hasMenus:!1,hasFonts:!1,hasECS:!1,hasMultipleScreens:!1,hasAnimations:!1,hasCollisions:!1,hasMenuSystem:!1,components:[],templates:[],entities:[],sprites:[],sounds:[],tracks:[],trackIndexByAssetId:{},tiles:[],screens:[],screenMaps:[],projectName:t,customStates:[],stateMachines:[],globalVariables:[]},console.log("🔄 Using fallback empty analysis")}const o=a.interruptDrivenComponents??!0,n=a.hardwareMode||"hybrid",c=a.optimizeLevel||"safe",r=a.targetFormat||"konami",p=a.romMode||"simple32k",d=a.autoMegaROM??!1;console.log("📝 [MSX GENERATOR] Generating all ASM files..."),console.log(`🔧 Hardware Mode: ${n.toUpperCase()}, Optimize: ${c}`),console.log(`[MSX GENERATOR] ROM config: mode=${p}, mapper=${r}, autoMegaROM=${d}`);const u={"bios.asm":nl({hardwareMode:{mode:n,optimizeLevel:c}}),"constants.asm":il(l),"variables.asm":sl(l),"mapper.asm":Il({targetFormat:r,romMode:p,autoMegaROM:d}),"interrupt.asm":Qo(l,{interruptDrivenComponents:o,romMode:p}),"header.asm":cl(t,l),"patterns.asm":vl(l),"colors.asm":wl(l),"components.asm":o?`; Components are generated inside interrupt.asm (interruptDrivenComponents=true)
`:ca(l,p),"entities.asm":uo(l),"worlds.asm":vo(l),"screens.asm":mo(l),"sprites.asm":Fl(l),"font.asm":bo(l),"hud.asm":fo(l),"menus.asm":wo(l),"sound.asm":ln(l),"scroll.asm":An(l),"animtiles.asm":Nn(l),"particles.asm":xn(l),"statemachine.asm":l.stateMachines&&l.stateMachines.length>0?Go(l.stateMachines,l.globalVariables,l.sprites,l.tiles,l.templates,l.sounds,l.trackIndexByAssetId):`; No State Machines
`,"gameflow.asm":yl(l),"main.asm":Tl(t,l),"unitedFiles.asm":""};return a.generateUnified&&(u["unitedFiles.asm"]=Pl(u,t,l,{romMode:p,targetFormat:r,autoMegaROM:d})),console.log("✅ Modular ASM files generated successfully!"),console.log(`📊 Generated ${Object.keys(u).filter(h=>u[h]).length} files`),console.log("📋 [DEBUG] Files generated:",Object.keys(u)),console.log("🎯 [DEBUG] interrupt.asm length:",((i=u["interrupt.asm"])==null?void 0:i.length)||"MISSING!"),u}const Or=Object.freeze(Object.defineProperty({__proto__:null,generateModularASM:Mn},Symbol.toStringTag,{value:"Module"}));export{pr as $,Nt as A,Ae as B,xt as C,Bn as D,jn as E,Pa as F,ka as G,q as H,Nr as I,tr as J,er as K,Ma as L,$n as M,mr as N,Ge as O,Un as P,Lr as Q,Dr as R,Qe as S,Rr as T,ga as U,ir as V,ar as W,or as X,lr as Y,Yn as Z,dr as _,Qn as a,nr as a0,rr as a1,cr as a2,sr as a3,_r as a4,ye as a5,ze as a6,Zn as a7,Mr as a8,zn as a9,Hn as aa,He as ab,Re as ac,Le as ad,oe as ae,Pr as af,ur as ag,Oa as ah,j as ai,R as aj,Fn as ak,ct as al,kr as am,br as an,Gn as ao,Aa as ap,Kn as aq,fr as ar,hr as as,Vn as at,yr as au,Or as av,Wn as b,Xn as c,De as d,Er as e,qn as f,gr as g,Jn as h,la as i,oa as j,J as k,kn as l,On as m,Ve as n,Ar as o,Tr as p,Cr as q,Ir as r,Sr as s,vr as t,Ne as u,xe as v,Ra as w,wr as x,Pn as y,xr as z};
