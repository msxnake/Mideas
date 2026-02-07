const Ua=[16,24,32];var M=(t=>(t.Score="Score",t.HighScore="HighScore",t.Lives="Lives",t.EnergyBar="EnergyBar",t.ItemDisplay="ItemDisplay",t.SceneName="SceneName",t.MiniMap="MiniMap",t.CoinCounter="CoinCounter",t.BossEnergyBar="BossEnergyBar",t.PhaseIndicator="PhaseIndicator",t.AttackAlert="AttackAlert",t.TextBox="TextBox",t.NumericField="NumericField",t.CustomCounter="CustomCounter",t))(M||{});const ke={water:{bit:0,label:"Water Effect",maskValue:1,color:"rgba(50, 100, 200, 0.4)"},customGravity:{bit:1,label:"Custom Gravity",maskValue:2,color:"rgba(150, 50, 200, 0.4)"},icePhysics:{bit:2,label:"Ice Physics",maskValue:4,color:"rgba(100, 200, 255, 0.4)"},spriteConceal:{bit:3,label:"Sprite Concealment",maskValue:8,color:"rgba(100, 100, 100, 0.4)"}};var Ue=(t=>(t.None="None",t.Tile="Tile",t.Sprite="Sprite",t.Screen="Screen",t.Code="Code",t.Attributes="Attributes",t.Sound="Sound",t.Platformer="Platformer",t.WorldMap="WorldMap",t.Track="Track",t.HUD="HUD",t.TileBanks="TileBanks",t.Font="Font",t.HelpDocs="HelpDocs",t.BehaviorEditor="BehaviorEditor",t.ComponentDefinitionEditor="ComponentDefinitionEditor",t.EntityTemplateEditor="EntityTemplateEditor",t.Boss="Boss",t.WorldView="WorldView",t.GameFlow="GameFlow",t.MainMenu="MainMenu",t.StateMachine="StateMachine",t.GlobalVariables="GlobalVariables",t.Palette="Palette",t))(Ue||{});const Fa=[1,3,5,7],Ba=[{id:0,name:"NoSolid (Passable)",isSolid:!1},{id:1,name:"Solid (Wall/Ground)",isSolid:!0},{id:2,name:"Platform (Top-Solid)",isSolid:!0},{id:3,name:"Slope (Solid)",isSolid:!0}],Ha={isBreakable:{bit:0,label:"Breakable"},isMovable:{bit:1,label:"Movable"},causesDamage:{bit:2,label:"Deadly"},isInteractiveSwitch:{bit:3,label:"Interactable"}},Va="0.266",X=[{name:"Transparent",hex:"rgba(0,0,0,0)"},{name:"Black",hex:"#000000"},{name:"Medium Green",hex:"#3EB847"},{name:"Light Green",hex:"#74D07D"},{name:"Dark Blue",hex:"#2F2FC1"},{name:"Light Blue",hex:"#5858FC"},{name:"Dark Red",hex:"#B63125"},{name:"Cyan",hex:"#68D2DA"},{name:"Medium Red",hex:"#FC584A"},{name:"Light Red",hex:"#FF8E81"},{name:"Dark Yellow",hex:"#C0BF3B"},{name:"Light Yellow",hex:"#E7E474"},{name:"Dark Green",hex:"#309337"},{name:"Magenta",hex:"#B640C8"},{name:"Gray",hex:"#999999"},{name:"White",hex:"#FFFFFF"}],P=[{name:"Transparent (Backdrop)",hex:"rgba(0,0,0,0)",index:0},{name:"Black",hex:"#000000",index:1},{name:"Medium Green",hex:"#21C842",index:2},{name:"Light Green",hex:"#5EDC78",index:3},{name:"Dark Blue",hex:"#5455ED",index:4},{name:"Light Blue",hex:"#7D76FC",index:5},{name:"Dark Red",hex:"#D4524D",index:6},{name:"Cyan",hex:"#42EBF5",index:7},{name:"Medium Red",hex:"#FC5554",index:8},{name:"Light Red",hex:"#FF7978",index:9},{name:"Dark Yellow",hex:"#D4C154",index:10},{name:"Light Yellow",hex:"#E6CE80",index:11},{name:"Dark Green",hex:"#21B03B",index:12},{name:"Magenta",hex:"#C95BBA",index:13},{name:"Gray",hex:"#CCCCCC",index:14},{name:"White",hex:"#FFFFFF",index:15}],F=[0,36,73,109,146,182,219,255],W=t=>t.toString(16).padStart(2,"0").toUpperCase(),$a=(()=>{const t=[];for(let a=0;a<F.length;a++)for(let e=0;e<F.length;e++)for(let l=0;l<F.length;l++){const o=a<<6|e<<3|l;t.push({index:o,hex:`#${W(F[a])}${W(F[e])}${W(F[l])}`,rLevel:a,gLevel:e,bLevel:l})}return t})(),ie=t=>{let a=0,e=1/0;return F.forEach((l,o)=>{const r=Math.abs(l-t);r<e&&(e=r,a=o)}),a},Fe=t=>!t||!t.startsWith("#")||t.length!==7?"#000000":t.toUpperCase(),Be=t=>{const a=Fe(t),e=parseInt(a.slice(1,3),16),l=parseInt(a.slice(3,5),16),o=parseInt(a.slice(5,7),16),r=ie(e),n=ie(l),s=ie(o),p=`#${W(F[r])}${W(F[n])}${W(F[s])}`,d=r<<6|n<<3|s;return{hex:p,masterIndex:d}},Ga=X.map((t,a)=>{if(a===0)return{slotIndex:0,masterIndex:-1,hex:"rgba(0,0,0,0)"};const e=Be(t.hex);return{slotIndex:a,masterIndex:e.masterIndex,hex:e.hex}}),ja=[8,16,24,32],za=16,Wa=16,Ya=16,G=32,ee=24,z=8,j=255,Qa="SCREEN 2 (Graphics I)",Xa=["ADC","ADD","AND","BIT","CALL","CCF","CP","CPD","CPDR","CPI","CPIR","CPL","DAA","DEC","DI","DJNZ","EI","EX","EXX","HALT","IM","IN","INC","IND","INDR","INI","INIR","JP","JR","LD","LDD","LDDR","LDI","LDIR","NEG","NOP","OR","OTDR","OTIR","OUT","OUTD","OUTI","POP","PUSH","RES","RET","RETI","RETN","RL","RLA","RLC","RLCA","RLD","RR","RRA","RRC","RRCA","RRD","RST","SBC","SCF","SET","SLA","SLL","SRA","SRL","SUB","XOR"],Ka=["A","F","B","C","D","E","H","L","AF","BC","DE","HL","IXH","IXL","IYH","IYL","IX","IY","SP","PC","I","R","AF'"],Za=["NZ","Z","NC","C","PO","PE","P","M"],Ja=[".ORG","ORG","END",".END",".EQU","EQU",".DB","DB",".BYTE","BYTE","DEFB",".DW","DW",".WORD","WORD","DEFW",".DS","DS",".BLOCK","BLOCK","DEFS",".DEFINE","DEFINE",".MACRO","MACRO",".ENDM","ENDM",".IF","IF",".ENDIF","ENDIF",".ELSE","ELSE",".INCLUDE","INCLUDE",".DEFM","DEFM",".ZILOG",".PHASE",".REPT",".ENDR",".SEARCH",".RANDOM",".ROM",".MEGAROM",".BASIC",".CAS",".WAV",".MSXDOS"],qa=[{id:"pac_man_collection",name:"Pac-Man Tile Collection",code:`; Pac-Man Style Tile Collection System for MSX
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
POWER_MODE:         DB 0       ; Power-up mode active flag`}],el=[],oe=8,K=15,Z=1;var Ie;const tl=((Ie=P.find(t=>t.index===K))==null?void 0:Ie.hex)||P[15].hex;var Ce;const al=((Ce=P.find(t=>t.index===Z))==null?void 0:Ce.hex)||P[1].hex,te=new Map(P.map(t=>[t.hex,t])),ll=new Map(P.map(t=>[t.index,t])),ol=P[1],nl=32,il=125,rl=6,sl=31,dl=15,cl=["A","B","C"],pl=["1","2","3","4","5"],_l=["C-","C#","D-","D#","E-","F-","F#","G-","G#","A-","A#","B-"],hl=[0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,7,7,6,6,5,5,4,4,3,3,2,2,1,1,0,0],ul=32,ml={q:{noteNameIndex:0,baseOctave:5},w:{noteNameIndex:1,baseOctave:5},e:{noteNameIndex:2,baseOctave:5},r:{noteNameIndex:3,baseOctave:5},t:{noteNameIndex:4,baseOctave:5},y:{noteNameIndex:5,baseOctave:5},u:{noteNameIndex:6,baseOctave:5},i:{noteNameIndex:7,baseOctave:5},o:{noteNameIndex:8,baseOctave:5},p:{noteNameIndex:9,baseOctave:5},"[":{noteNameIndex:10,baseOctave:5},"]":{noteNameIndex:11,baseOctave:5},a:{noteNameIndex:0,baseOctave:4},s:{noteNameIndex:1,baseOctave:4},d:{noteNameIndex:2,baseOctave:4},f:{noteNameIndex:3,baseOctave:4},g:{noteNameIndex:4,baseOctave:4},h:{noteNameIndex:5,baseOctave:4},j:{noteNameIndex:6,baseOctave:4},k:{noteNameIndex:7,baseOctave:4},l:{noteNameIndex:8,baseOctave:4},ñ:{noteNameIndex:9,baseOctave:4},";":{noteNameIndex:9,baseOctave:4},"'":{noteNameIndex:10,baseOctave:4},z:{noteNameIndex:0,baseOctave:3},x:{noteNameIndex:1,baseOctave:3},c:{noteNameIndex:2,baseOctave:3},v:{noteNameIndex:3,baseOctave:3},b:{noteNameIndex:4,baseOctave:3},n:{noteNameIndex:5,baseOctave:3},m:{noteNameIndex:6,baseOctave:3},",":{noteNameIndex:7,baseOctave:3},".":{noteNameIndex:8,baseOctave:3},2:{noteNameIndex:1,baseOctave:5},3:{noteNameIndex:3,baseOctave:5},5:{noteNameIndex:6,baseOctave:5},6:{noteNameIndex:8,baseOctave:5},7:{noteNameIndex:10,baseOctave:5}},El={min:-2,max:2},fl=[{id:1,name:"Piano",volumeEnvelope:[15,14,13,11,9,7,5,3,2,1,0],toneEnvelope:[0],volumeLoop:255,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:0},{id:2,name:"Electric Bass",volumeEnvelope:[15,14,13,12,11,10,9,8],toneEnvelope:[0],volumeLoop:3,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:12},{id:3,name:"Lead Vibrato",volumeEnvelope:[0,5,10,15,15,15,14,13,12],toneEnvelope:[0,1,2,1,0,-1,-2,-1],volumeLoop:4,toneLoop:0,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:13},{id:4,name:"Strings Pad",volumeEnvelope:[0,2,4,6,8,10,12,14,15,15,15],toneEnvelope:[0,0,1,1,0,0,-1,-1],volumeLoop:8,toneLoop:0,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:13},{id:5,name:"Kick Drum",volumeEnvelope:[15,13,10,7,4,2,0],toneEnvelope:[12,10,8,6,4,2,0],volumeLoop:255,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:0},{id:6,name:"Snare Drum",volumeEnvelope:[15,12,9,6,3,1,0],toneEnvelope:[0],volumeLoop:255,toneLoop:255,ayToneEnabled:!1,ayNoiseEnabled:!0,ayEnvelopeShape:0},{id:7,name:"Hi-Hat",volumeEnvelope:[12,10,8,6,4,2,0],toneEnvelope:[0],volumeLoop:255,toneLoop:255,ayToneEnabled:!1,ayNoiseEnabled:!0,ayEnvelopeShape:0},{id:8,name:"Arpeggio",volumeEnvelope:[15,15,14,14,13,13,12,12],toneEnvelope:[0,4,7,12,7,4,0],volumeLoop:0,toneLoop:0,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:10},{id:9,name:"Organ",volumeEnvelope:[15,15,15,15,15],toneEnvelope:[0],volumeLoop:0,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:13},{id:10,name:"Bell",volumeEnvelope:[15,14,12,10,8,6,4,3,2,1,0],toneEnvelope:[0,12,0],volumeLoop:255,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:0}],He=[{id:"bank_0",name:"Bank 0 - HUD/Fonts",enabled:!0,vramPatternStart:0,vramColorStart:8192,screenZone:{x:0,y:0,width:G,height:8},charsetRangeStart:0,charsetRangeEnd:255,defaultFgColorIndex:15,defaultBgColorIndex:4,isLocked:!1,assignedTiles:{}},{id:"bank_1",name:"Bank 1 - Game Tileset",enabled:!0,vramPatternStart:2048,vramColorStart:10240,screenZone:{x:0,y:8,width:G,height:8},charsetRangeStart:0,charsetRangeEnd:255,defaultFgColorIndex:2,defaultBgColorIndex:1,isLocked:!1,assignedTiles:{}},{id:"bank_2",name:"Bank 2 - Background/Status",enabled:!0,vramPatternStart:4096,vramColorStart:12288,screenZone:{x:0,y:16,width:G,height:8},charsetRangeStart:0,charsetRangeEnd:255,defaultFgColorIndex:11,defaultBgColorIndex:6,isLocked:!1,assignedTiles:{}}],bl={isEnabled:!0,options:[{id:"start",label:"INICIAR PARTIDA",enabled:!0},{id:"continue",label:"CONTINUAR",enabled:!0},{id:"settings",label:"AJUSTES",enabled:!0},{id:"help",label:"AYUDA",enabled:!1}],keyMapping:{up:"ArrowUp",down:"ArrowDown",left:"ArrowLeft",right:"ArrowRight",fire1:" ",fire2:"m"},settings:{volume:12},continueScreen:{title:"CONTINUAR PARTIDA",prompt:"INTRODUCE TU CODIGO"},introScreen:{text:`EN EL ANO 2084, LA CORPORACION CYBERNETICA DOMINA EL MUNDO...

SOLO UN HEROE PUEDE DETENERLOS.`,backgroundAssetId:null},menuScreenAssetId:null,cursorSpriteAssetId:null,menuColors:{text:P[15].hex,background:P[4].hex,highlightText:P[11].hex,highlightBackground:P[5].hex,border:P[15].hex}},yl=ke,gl="HELP_DOCS_SYSTEM_ASSET",Sl=[{id:"getting_started",title:"Getting Started",articles:[{id:"welcome",title:"Welcome to MSX Retro IDE",content:`
          <h2>Welcome!</h2>
          <p>This IDE is designed to help you create games for the MSX (MSX1/MSX2) platform.</p>
          <p>Key features include:</p>
          <ul>
            <li>Visual Tile Editor</li>
            <li>Sprite Editor with animation support</li>
            <li>Screen Map Editor with Effect Zones</li>
            <li>Integrated Z80 Code Editor with snippets</li>
            <li>PT3 Music Tracker</li>
            <li>Font Editor</li>
            <li>And more!</li>
          </ul>
          <p>Use the <strong>File Explorer</strong> on the left to manage your assets. Create new assets using the <strong>Toolbar</strong> at the top.</p>
          <p>Select an asset to open its dedicated editor. Properties for the selected asset or element will appear in the <strong>Properties Panel</strong> on the right.</p>
        `,tags:["introduction","overview"]},{id:"toolbar_overview",title:"Toolbar Overview",content:`
          <h2>Toolbar Guide</h2>
          <p>The main toolbar provides quick access to common actions:</p>
          <ul>
            <li><strong>New Project</strong>: Clears current work and sets up a new project structure (main.asm, etc.).</li>
            <li><strong>Load/Save/Save As</strong>: Standard project file operations (saves as .json).</li>
            <li><strong>New Asset</strong>: Dropdown to create Tiles, Sprites, Screen Maps, Code files, etc.</li>
            <li><strong>Undo/Redo</strong>: Reverts or reapplies recent changes.</li>
            <li><strong>Tile Banks/Font Editor</strong>: Opens specialized editors for Screen 2 graphics management and MSX1 font editing.</li>
            <li><strong>Compile (Mock)</strong>: Placeholder for future compilation integration.</li>
            <li><strong>Debug/Run (Mock)</strong>: Placeholders for debugging and emulator launching.</li>
            <li><strong>Configure</strong>: Dropdown for IDE settings (Data Output, Autosave, Theme, etc.).</li>
            <li><strong>Tutorials</strong>: Opens this Help & Documentation viewer.</li>
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
            <li><strong>Entity Types Panel (Right, when Entity layer active)</strong>: Lists mock entity types. Select one to place instances on the map.</li>
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
        `,tags:["screenmap","level design","tiles","effect zones"]}]},{id:"gameflow",title:"GameFlow System",articles:[{id:"gameflow_intro",title:"Introduction to GameFlow",content:`
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
        `,tags:["gameflow","troubleshooting","problems"]}]}],Al=50,re=[{name:"Goal",asmName:"global_var_goal",constantPrefix:"GOAL_",type:"byte",description:"Current objective status",category:"objective",values:[{label:"Failure",value:0,asmConstant:"GOAL_FAILURE"},{label:"Completed",value:1,asmConstant:"GOAL_COMPLETED"},{label:"Partial",value:2,asmConstant:"GOAL_PARTIAL"}]},{name:"MissionStatus",asmName:"global_var_mission_status",constantPrefix:"MISSION_",type:"byte",description:"Current mission state",category:"objective",values:[{label:"NotStarted",value:0,asmConstant:"MISSION_NOT_STARTED"},{label:"Active",value:1,asmConstant:"MISSION_ACTIVE"},{label:"Completed",value:2,asmConstant:"MISSION_COMPLETED"},{label:"Failed",value:3,asmConstant:"MISSION_FAILED"}]},{name:"LevelCompleted",asmName:"global_var_level_completed",constantPrefix:"BOOL_",type:"byte",description:"Level completion flag",category:"objective",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"BossDefeated",asmName:"global_var_boss_defeated",constantPrefix:"BOOL_",type:"byte",description:"Boss defeated flag",category:"objective",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"AllItemsCollected",asmName:"global_var_all_items_collected",constantPrefix:"BOOL_",type:"byte",description:"All items collected flag",category:"objective",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"Score",asmName:"global_var_score",constantPrefix:"SCORE_",type:"word",description:"Current player score (0-65535)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"HiScore",asmName:"global_var_hi_score",constantPrefix:"HISCORE_",type:"word",description:"High score record (0-65535)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"ComboMultiplier",asmName:"global_var_combo_multiplier",constantPrefix:"COMBO_",type:"byte",description:"Combo multiplier (1x, 2x, 3x...)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"Coins",asmName:"global_var_coins",constantPrefix:"COINS_",type:"byte",description:"Coins collected (0-255)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"Gems",asmName:"global_var_gems",constantPrefix:"GEMS_",type:"byte",description:"Gems collected (0-255)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"Lives",asmName:"global_var_lives",constantPrefix:"LIVES_",type:"byte",description:"Remaining lives (0-255)",category:"player",values:[{label:"Custom Value",value:"number"}]},{name:"Health",asmName:"global_var_health",constantPrefix:"HEALTH_",type:"byte",description:"Current health (0-255)",category:"player",values:[{label:"Custom Value",value:"number"}]},{name:"Energy",asmName:"global_var_energy",constantPrefix:"ENERGY_",type:"byte",description:"Current energy/mana (0-255)",category:"player",values:[{label:"Custom Value",value:"number"}]},{name:"Shield",asmName:"global_var_shield",constantPrefix:"BOOL_",type:"byte",description:"Shield active flag",category:"player",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"HasKey",asmName:"global_var_has_key",constantPrefix:"BOOL_",type:"byte",description:"Has key item",category:"inventory",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"HasSword",asmName:"global_var_has_sword",constantPrefix:"BOOL_",type:"byte",description:"Has sword item",category:"inventory",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"HasMap",asmName:"global_var_has_map",constantPrefix:"BOOL_",type:"byte",description:"Has map item",category:"inventory",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"ItemCount",asmName:"global_var_item_count",constantPrefix:"ITEMS_",type:"byte",description:"Special items collected (0-255)",category:"inventory",values:[{label:"Custom Value",value:"number"}]},{name:"PowerUpActive",asmName:"global_var_powerup_active",constantPrefix:"POWERUP_",type:"byte",description:"Active power-up type",category:"inventory",values:[{label:"None",value:0,asmConstant:"POWERUP_NONE"},{label:"Speed",value:1,asmConstant:"POWERUP_SPEED"},{label:"Jump",value:2,asmConstant:"POWERUP_JUMP"},{label:"Invincible",value:3,asmConstant:"POWERUP_INVINCIBLE"}]},{name:"CurrentWorld",asmName:"global_var_current_world",constantPrefix:"WORLD_",type:"byte",description:"Current world number (1-8)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"CurrentLevel",asmName:"global_var_current_level",constantPrefix:"LEVEL_",type:"byte",description:"Current level number (0-255)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"CheckpointReached",asmName:"global_var_checkpoint",constantPrefix:"CHECKPOINT_",type:"byte",description:"Checkpoint reached (0-255)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"SecretFound",asmName:"global_var_secret_found",constantPrefix:"BOOL_",type:"byte",description:"Secret area found flag",category:"progress",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"DoorsUnlocked",asmName:"global_var_doors_unlocked",constantPrefix:"DOORS_",type:"byte",description:"Doors unlocked bitmask (0-255)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"TimeRemaining",asmName:"global_var_time_remaining",constantPrefix:"TIME_",type:"word",description:"Time remaining in seconds (0-65535)",category:"time",values:[{label:"Custom Value",value:"number"}]},{name:"TimeLimitActive",asmName:"global_var_time_limit_active",constantPrefix:"BOOL_",type:"byte",description:"Time limit active flag",category:"time",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"DayNightCycle",asmName:"global_var_day_night_cycle",constantPrefix:"TIME_",type:"byte",description:"Day/night cycle state (0-23)",category:"time",values:[{label:"Custom Value",value:"number"}]},{name:"DifficultyLevel",asmName:"global_var_difficulty",constantPrefix:"DIFFICULTY_",type:"byte",description:"Game difficulty level",category:"difficulty",values:[{label:"Easy",value:0,asmConstant:"DIFFICULTY_EASY"},{label:"Normal",value:1,asmConstant:"DIFFICULTY_NORMAL"},{label:"Hard",value:2,asmConstant:"DIFFICULTY_HARD"},{label:"Expert",value:3,asmConstant:"DIFFICULTY_EXPERT"}]},{name:"EnemiesDefeated",asmName:"global_var_enemies_defeated",constantPrefix:"ENEMIES_",type:"word",description:"Enemies defeated count (0-65535)",category:"special",values:[{label:"Custom Value",value:"number"}]},{name:"PerfectRun",asmName:"global_var_perfect_run",constantPrefix:"BOOL_",type:"byte",description:"Perfect run (no damage) flag",category:"special",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]}],O=8,Ve=t=>{let a=t.toString(16).toUpperCase();return a.length===1&&(a="0"+a),a},Tl=(t,a,e)=>{var h,c;if(!t.lineAttributes)return`;; ERROR: Tile ${a} is missing line attributes required for SCREEN 2 export.
`;const l=a.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let o=`;; Tile: ${a} (${t.width}x${t.height})
`;o+=`;; Structure: ${t.width/O}x${t.height/O} character blocks (8x8 pixels each)
`,o+=`;; Data format: ${e.toUpperCase()}

`;const r=t.width/O,n=t.height/O,s=m=>e==="hex"?`$${Ve(m)}`:m.toString(10),p=[],d=[];for(let m=0;m<n;m++)for(let g=0;g<r;g++){const S=`;; Character Block (${g}, ${m}) for ${l}`,i=[];for(let f=0;f<O;f++){const b=m*O+f;let A=0;if(t.lineAttributes[b]&&t.lineAttributes[b][g]){const T=t.lineAttributes[b][g].fg;for(let C=0;C<O;C++){const R=g*O+C;t.data[b]&&t.data[b][R]!==void 0&&t.data[b][R]===T&&(A|=1<<7-C)}}i.push(A)}const _=i.map(s).join(",");p.push({comment:`${S} - PATTERN Data (8 bytes):`,dataString:`DB ${_}`});const u=[];for(let f=0;f<O;f++){const b=m*O+f;let A=K<<4|Z;if(t.lineAttributes[b]&&t.lineAttributes[b][g]){const T=t.lineAttributes[b][g],C=((h=te.get(T.fg))==null?void 0:h.index)??K,R=((c=te.get(T.bg))==null?void 0:c.index)??Z;A=C<<4|R}u.push(A)}const E=u.map(s).join(",");d.push({comment:`${S} - COLOR Attribute Data (8 bytes - FG|BG):`,dataString:`DB ${E}`})}return o+=`;; --- PATTERN DATA ---
`,p.length>0?(o+=`${l}_PATTERN_DATA:
`,p.forEach(m=>{o+=`${m.comment}
`,o+=`    ${m.dataString}
`})):o+=`;; No pattern data generated.
`,o+=`
`,o+=`;; --- COLOR ATTRIBUTE DATA ---
`,d.length>0?(o+=`${l}_COLOR_DATA:
`,d.forEach(m=>{o+=`${m.comment}
`,o+=`    ${m.dataString}
`})):o+=`;; No color attribute data generated.
`,o+=`
;; End of Tile Data for ${l}
`,o},Il=(t,a,e,l)=>{const o=Math.max(1,t/oe);return Array(a).fill(null).map(()=>Array(o).fill(null).map(()=>({fg:e,bg:l})))},$e=(t,a)=>{var n,s,p,d;const e=[],l=t.width/O,o=t.height/O,r=a==="SCREEN 2 (Graphics I)";for(let h=0;h<o;h++)for(let c=0;c<l;c++)for(let m=0;m<O;m++){const g=h*O+m;let S=0,i;r&&t.lineAttributes&&t.lineAttributes[g]&&t.lineAttributes[g][c]&&(i=t.lineAttributes[g][c].fg);for(let _=0;_<O;_++){const u=c*O+_,E=(n=t.data[g])==null?void 0:n[u];if(E!==void 0){let f=!1;r&&i?f=E===i:r||(f=E!==X[0].hex&&E!==((d=(p=(s=t.lineAttributes)==null?void 0:s[0])==null?void 0:p[0])==null?void 0:d.bg)),f&&(S|=1<<7-_)}}e.push(S)}return new Uint8Array(e)},Y=(t,a)=>{var r,n;const e=t.length;if(e===0)return[];const l=((r=t[0])==null?void 0:r.length)||0;if(l===0)return[[]];const o=t.map(s=>[...s]);for(let s=0;s<e;s++)for(let p=0;p<l;p++){const d=Math.floor(p/oe),h=(n=a[s])==null?void 0:n[d],c=o[s][p];h&&c!==h.fg&&c!==h.bg&&(o[s][p]=h.fg)}return o},Cl=(t,a,e)=>{if(t.length<2)return t;const o=t.slice(1);return o.push([...t[0]]),e==="SCREEN 2 (Graphics I)"&&a?Y(o,a):o},Dl=(t,a,e)=>{const l=t.length;if(l<2)return t;const o=t.slice(0,l-1);return o.unshift([...t[l-1]]),e==="SCREEN 2 (Graphics I)"&&a?Y(o,a):o},Ll=(t,a,e)=>{if(t.length===0)return[];const l=t.map(o=>{if(o.length<2)return[...o];const r=o.slice(1);return r.push(o[0]),r});return e==="SCREEN 2 (Graphics I)"&&a?Y(l,a):l},Rl=(t,a,e)=>{if(t.length===0)return[];const l=t.map(o=>{const r=o.length;if(r<2)return[...o];const n=o.slice(0,r-1);return n.unshift(o[r-1]),n});return e==="SCREEN 2 (Graphics I)"&&a?Y(l,a):l},Nl=(t,a,e)=>{if(t.length===0)return[];const l=t.map(o=>[...o].reverse());return e==="SCREEN 2 (Graphics I)"&&a?Y(l,a):l},vl=(t,a,e)=>{if(t.length===0)return[];const l=[...t].reverse();return e==="SCREEN 2 (Graphics I)"&&a?Y(l,a):l},Ge=t=>{var o,r,n;if(!t.lineAttributes)return null;const a=[],e=t.width/O,l=t.height/O;for(let s=0;s<l;s++)for(let p=0;p<e;p++)for(let d=0;d<O;d++){const h=s*O+d;let c=K<<4|Z;const m=(o=t.lineAttributes[h])==null?void 0:o[p];if(m){const g=((r=te.get(m.fg))==null?void 0:r.index)??K,S=((n=te.get(m.bg))==null?void 0:n.index)??Z;c=g<<4|S}a.push(c)}return new Uint8Array(a)},Ol=t=>{const a=[];t.frames.forEach(l=>{var o,r,n,s,p;for(let d=0;d<t.spritePalette.length;d++){const h=t.spritePalette[d];if(h===t.backgroundColor)continue;let c=!1;const m=[],g=t.size.width,S=t.size.height;if(g===16&&S===16){for(let i=0;i<8;i++){let _=0;for(let u=0;u<8;u++)((o=l.data[i])==null?void 0:o[u])===h&&(_|=1<<7-u,c=!0);m.push(_)}for(let i=8;i<16;i++){let _=0;for(let u=0;u<8;u++)((r=l.data[i])==null?void 0:r[u])===h&&(_|=1<<7-u,c=!0);m.push(_)}for(let i=0;i<8;i++){let _=0;for(let u=0;u<8;u++)((n=l.data[i])==null?void 0:n[8+u])===h&&(_|=1<<7-u,c=!0);m.push(_)}for(let i=8;i<16;i++){let _=0;for(let u=0;u<8;u++)((s=l.data[i])==null?void 0:s[8+u])===h&&(_|=1<<7-u,c=!0);m.push(_)}}else for(let i=0;i<S;i++)for(let _=0;_<Math.ceil(g/8);_++){let u=0;for(let E=0;E<8;E++){const f=_*8+E;f<g&&((p=l.data[i])==null?void 0:p[f])===h&&(u|=1<<7-E,c=!0)}m.push(u)}c&&a.push(m)}});const e=a.flat();return new Uint8Array(e)},wl=t=>t.map(a=>[...a].reverse()),Pl=t=>[...t].reverse(),je=t=>{let a=t.toString(16).toUpperCase();return a.length===1&&(a="0"+a),a},ze=(t,a,e,l,o,r,n="hex")=>{var c,m,g,S,i;const p=t.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let d=`;; ---- Sprite Frame: ${t} ----
`;d+=`;; Size: ${o}x${r}
`;let h=0;for(let _=0;_<e.length;_++){const u=e[_];if(u===l)continue;const E=[];if(o===16&&r===16){for(let f=0;f<8;f++){let b=0;for(let A=0;A<8;A++){const T=A;((c=a[f])==null?void 0:c[T])===u&&(b|=1<<7-A)}E.push(b)}for(let f=8;f<16;f++){let b=0;for(let A=0;A<8;A++){const T=A;((m=a[f])==null?void 0:m[T])===u&&(b|=1<<7-A)}E.push(b)}for(let f=0;f<8;f++){let b=0;for(let A=0;A<8;A++){const T=8+A;((g=a[f])==null?void 0:g[T])===u&&(b|=1<<7-A)}E.push(b)}for(let f=8;f<16;f++){let b=0;for(let A=0;A<8;A++){const T=8+A;((S=a[f])==null?void 0:S[T])===u&&(b|=1<<7-A)}E.push(b)}}else for(let f=0;f<r;f++)for(let b=0;b<Math.ceil(o/8);b++){let A=0;for(let T=0;T<8;T++){const C=b*8+T;C<o&&((i=a[f])==null?void 0:i[C])===u&&(A|=1<<7-T)}E.push(A)}if(!E.every(f=>f===0)){h+=1,d+=`${p}_LAYER${_}: ; Brush Color Index ${_} (Actual Color: ${u})
`,o%8!==0&&(d+=`;; WARNING: Sprite width ${o} is not a multiple of 8. Bitmask generation might be problematic for standard VDP.
`);for(let f=0;f<E.length;f+=16){const A=E.slice(f,f+16).map(T=>n==="hex"?`#${je(T)}`:T.toString());d+=`    DB ${A.join(",")}
`}d+=`
`}}return h===0&&(d+=`;; NO DRAWABLE LAYERS EXPORTED for ${t} - Palette may match background color.
`),d+=`;; ---- End of Frame: ${t} ----

`,d},be=(t,a="hex",e)=>{let l=`;; Sprite: ${t.name}
`;l+=`;; Total Frames: ${t.frames.length}
`,l+=`;; Size: ${t.size.width}x${t.size.height}
`,l+=`;; Background Color (not exported as a layer): ${t.backgroundColor}
`,l+=`;; Drawable Palette (Hex): C0=${t.spritePalette[0]}, C1=${t.spritePalette[1]}, C2=${t.spritePalette[2]}, C3=${t.spritePalette[3]}

`;const o=e!==void 0?`_${e}`:"",r=t.name+o,n=r.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();return l+=`SPRITE_${n}_WIDTH     EQU ${t.size.width}
`,l+=`SPRITE_${n}_HEIGHT    EQU ${t.size.height}
`,l+=`SPRITE_${n}_FRAMES    EQU ${t.frames.length}

`,t.frames.forEach((s,p)=>{l+=ze(`${r}_F${p}`,s.data,t.spritePalette,t.backgroundColor,t.size.width,t.size.height,a)}),l},se=16,De="SCREEN 2 (Graphics I)",We="SCREEN 5 (Graphics III)",$=8,Ye={pixelWidth:G*se,pixelHeight:ee*se,widthTiles:G,heightTiles:ee,baseTileSize:se},ye={[De]:{pixelWidth:G*z,pixelHeight:ee*z,widthTiles:G,heightTiles:ee,baseTileSize:z},[We]:{pixelWidth:256,pixelHeight:212,widthTiles:32,heightTiles:27,baseTileSize:z},"SCREEN 0 (Text 40)":{pixelWidth:240,pixelHeight:192,widthTiles:40,heightTiles:24,baseTileSize:$},"SCREEN 1 (Text 32)":{pixelWidth:256,pixelHeight:192,widthTiles:32,heightTiles:24,baseTileSize:$},"SCREEN 3 (Multicolor)":{pixelWidth:256,pixelHeight:192,widthTiles:32,heightTiles:24,baseTileSize:$},"SCREEN 4 (Graphics II)":{pixelWidth:256,pixelHeight:192,widthTiles:32,heightTiles:24,baseTileSize:$},"SCREEN 6 (Graphics IV)":{pixelWidth:512,pixelHeight:212,widthTiles:64,heightTiles:27,baseTileSize:$},"SCREEN 7 (Graphics V)":{pixelWidth:512,pixelHeight:212,widthTiles:64,heightTiles:27,baseTileSize:$},"SCREEN 8 (Graphics VI)":{pixelWidth:256,pixelHeight:212,widthTiles:32,heightTiles:27,baseTileSize:$}};function Ml(t){const a=typeof t=="string"?t.trim():"";return a&&ye[a]?ye[a]:Ye}const ae=t=>t===De,Qe=t=>ae(t)?P:X,Xe=(t,a)=>{const e=Qe(a);if(t===void 0||t<0||t>=e.length)return ae(a)?P[1].hex:X[4].hex;const l=e[t];return(l==null?void 0:l.hex)??(ae(a)?P[1].hex:X[4].hex)},xl=(t,a,e,l)=>{var m;const o=t.layers.background,r=t.activeAreaX??0,n=t.activeAreaY??0,s=t.activeAreaWidth??t.width,p=t.activeAreaHeight??t.height,d=[];let h=0;const c=new Map;for(let g=0;g<p;g++){const S=n+g;for(let i=0;i<s;i++){const _=r+i;if(S>=o.length||_>=((m=o[S])==null?void 0:m.length)){d.push(j);continue}const u=o[S][_];if(!u||!u.tileId)d.push(j);else{let E=j;const f=a.find(b=>b.id===u.tileId);if(l==="SCREEN 2 (Graphics I)"&&e&&f){let b=!1,A={tileId:u.tileId,position:{x:_,y:S},attempts:[],banksReceived:e.length};typeof globalThis.screenUtils_firstTileLogged>"u"&&(console.log("🔍 First tile structure check:",{tileId:u.tileId,position:{x:_,y:S},banksCount:e.length,banks:e.map(T=>({name:T.name,assignedTileIds:Object.keys(T.assignedTiles||{}),hasThisTile:!!(T.assignedTiles&&T.assignedTiles[u.tileId]),assignedTilesType:typeof T.assignedTiles,assignedTilesSample:T.assignedTiles?Object.entries(T.assignedTiles).slice(0,2):[]}))}),globalThis.screenUtils_firstTileLogged=!0);for(const T of e)if((T.enabled??!0)&&T.assignedTiles[u.tileId]){const C=T.assignedTiles[u.tileId].charCode,R=Math.ceil(f.width/z),L=u.subTileX||0,y=u.subTileY||0;E=C+y*R+L;const D=E>=T.charsetRangeStart&&E<=T.charsetRangeEnd;if(A.attempts.push({bankName:T.name,baseCharCode:C,calculated:E,range:`${T.charsetRangeStart}-${T.charsetRangeEnd}`,inRange:D}),D){b=!0;break}else E=j}else A.attempts.push({bankName:T.name,reason:"Tile not assigned to this bank"});b||(console.warn("⚠️ Tile not found in valid range:",A),E=j)}else if(l!=="SCREEN 2 (Graphics I)"){const b=`${u.tileId}_${u.subTileX??0}_${u.subTileY??0}`;c.has(b)?E=c.get(b):h>255?E=j:(c.set(b,h),E=h++)}d.push(E)}}}return new Uint8Array(d)},Ke=(t,a,e,l,o,r="hex")=>{const s=t.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let p=`;; MAP: ${t} (${a}x${e} tiles)
`;p+=`;; Total size: ${l.length} bytes

`,o.length>0&&(p+=`;; --- TILE INDEX REFERENCES for ${s} ---
`,p+=o.join(`
`)+`

`),p+=`SCREEN_${s}_WIDTH     EQU ${a}
`,p+=`SCREEN_${s}_HEIGHT    EQU ${e}
`,p+=`SCREEN_${s}_SIZE      EQU ${l.length}

`,p+=`SCREEN_${s}_LAYOUT:
`;for(let d=0;d<l.length;d+=16){const c=l.slice(d,d+16).map(m=>r==="hex"?`#${m.toString(16).padStart(2,"0").toUpperCase()}`:m.toString());p+=`    DB ${c.join(",")}
`}return p},Ze=(t,a,e,l,o="hex")=>{const n=t.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let s=`;; BEHAVIOR MAP: ${t} (${a}x${e} tiles)
`;s+=`;; Total size: ${l.length} bytes (Map IDs 0-255)
`,s+=`;; Data format: ${o.toUpperCase()}

`,s+=`BEHAVIOR_${n}_WIDTH     EQU ${a}
`,s+=`BEHAVIOR_${n}_HEIGHT    EQU ${e}
`,s+=`BEHAVIOR_${n}_SIZE      EQU ${l.length}

`,s+=`BEHAVIOR_${n}_DATA:
`;const p=d=>o==="hex"?`#${d.toString(16).padStart(2,"0").toUpperCase()}`:d.toString(10);for(let d=0;d<l.length;d+=16){const c=l.slice(d,d+16).map(p);s+=`    DB ${c.join(",")}
`}return s+=`
;; End of Behavior Map Data for ${t}
`,s},kl=(t,a)=>{if(t.width!==a.width||t.height!==a.height||t.data.length!==a.data.length)return!1;for(let e=0;e<t.height;e++){if(t.data[e].length!==a.data[e].length)return!1;for(let l=0;l<t.width;l++)if(t.data[e][l]!==a.data[e][l])return!1}if(t.lineAttributes&&a.lineAttributes){if(t.lineAttributes.length!==a.lineAttributes.length)return!1;for(let e=0;e<t.lineAttributes.length;e++){if(t.lineAttributes[e].length!==a.lineAttributes[e].length)return!1;for(let l=0;l<t.lineAttributes[e].length;l++)if(t.lineAttributes[e][l].fg!==a.lineAttributes[e][l].fg||t.lineAttributes[e][l].bg!==a.lineAttributes[e][l].bg)return!1}}else if(t.lineAttributes!==a.lineAttributes)return!1;return JSON.stringify(t.logicalProperties)===JSON.stringify(a.logicalProperties)};function Ul(t,a,e,l,o,r,n){const{data:s,width:p,height:d,lineAttributes:h}=t;if(!s||d===0||p===0)return"";const c=document.createElement("canvas");c.width=r,c.height=r;const m=c.getContext("2d");if(!m)return"";m.imageSmoothingEnabled=!1;const g=(a??0)*r,S=(e??0)*r;for(let u=0;u<r;u++)for(let E=0;E<r;E++){const f=g+E,b=S+u;if(b>=0&&b<d&&f>=0&&f<p){let A=s[b][f];if(n==="SCREEN 2 (Graphics I)"&&h&&h[b]){const T=Math.floor(f/oe),C=h[b][T];C&&A!==C.fg&&A!==C.bg&&(A=C.fg)}m.fillStyle=A,m.fillRect(E,u,1,1)}}if(c.width===l&&c.height===o)return c.toDataURL();const i=document.createElement("canvas");i.width=l,i.height=o;const _=i.getContext("2d");return _?(_.imageSmoothingEnabled=!1,_.drawImage(c,0,0,l,o),i.toDataURL()):c.toDataURL()}function Fl(t,a,e){var r;if(!t||e===0||a===0)return"";const l=document.createElement("canvas");l.width=a,l.height=e;const o=l.getContext("2d");if(!o)return"";o.imageSmoothingEnabled=!1;for(let n=0;n<e;n++)for(let s=0;s<a;s++){const p=(r=t[n])==null?void 0:r[s];p&&p!=="rgba(0,0,0,0)"&&(o.fillStyle=p,o.fillRect(s,n,1,1))}return l.toDataURL()}const Bl=(t,a,e,l,o,r,n)=>{var c,m;const s=ae(l);t.width=a.width*o,t.height=a.height*o;const p=t.getContext("2d");if(!p)return;p.imageSmoothingEnabled=!1;const d=Xe(a.backgroundColor,l);p.fillStyle=d,p.fillRect(0,0,t.width,t.height);const h=a.layers.background;for(let g=0;g<a.height;g++)for(let S=0;S<a.width;S++){const i=(c=h[g])==null?void 0:c[S];if(!(i!=null&&i.tileId))continue;const _=e.find(L=>L.id===i.tileId);if(!_)continue;const{data:u,width:E,height:f,lineAttributes:b}=_;if(!u)continue;const A=i.subTileX??0,T=i.subTileY??0,C=A*o,R=T*o;for(let L=0;L<o;L++)for(let y=0;y<o;y++){const D=C+y,N=R+L;if(N<f&&D<E){let w=(m=u[N])==null?void 0:m[D];if(w===void 0)continue;if(s&&b&&b[N]){const J=Math.floor(D/oe),V=b[N][J];V&&w!==V.fg&&w!==V.bg&&(w=V.fg)}p.fillStyle=w,p.fillRect(S*o+y,g*o+L,1,1)}}}};function Je(t){const a=t.find(n=>n.type==="globalvariables");if(!a||!a.data)return[...re];const e=a.data.customVariables||[],l=new Map;re.forEach(n=>{l.set(n.name,n)}),e.forEach(n=>{l.set(n.name,n)});const o=re.map(n=>n.name),r=[];return o.forEach(n=>{const s=l.get(n);s&&(r.push(s),l.delete(n))}),l.forEach(n=>{r.push(n)}),r}function Hl(t){const a=t.find(l=>l.type==="globalvariables");return!a||!a.data?[]:a.data.customVariables||[]}function qe(t){const a=Je(t);if(a.length===0)return[];const e=[];t.filter(h=>h.type==="screenmap").forEach(h=>{var m,g;(((g=(m=h.data)==null?void 0:m.layers)==null?void 0:g.entities)||[]).forEach(S=>{var i,_;(_=(i=S.components)==null?void 0:i.Behavior)!=null&&_.behaviorCode&&e.push(S.components.Behavior.behaviorCode)})});const o=t.find(h=>h.type==="gameflow"),r=new Set,n=new Set;if(o!=null&&o.data){const h=o.data;h.nodes&&Array.isArray(h.nodes)&&h.nodes.forEach(c=>{var m;c.type==="StateMachine"&&((m=c.data)!=null&&m.customCode)&&e.push(c.data.customCode),c.type==="IfThenElse"&&c.variableName&&r.add(c.variableName),c.type==="Globals"&&c.variables&&Array.isArray(c.variables)&&c.variables.forEach(g=>{g.variableName&&n.add(g.variableName)})})}t.filter(h=>h.type==="componentdefinition").forEach(h=>{const c=h.data;c.customCode&&e.push(c.customCode)});const p=[],d=new Set;return a.forEach(h=>{const c=e.some(S=>new RegExp(`\\b${h.asmName}\\b`,"i").test(S)),m=r.has(h.name),g=n.has(h.name);(c||m||g)&&!d.has(h.name)&&(p.push(h),d.add(h.name))}),n.forEach(h=>{if(!d.has(h)){const c=`global_var_${h.replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`;p.push({name:h,asmName:c,type:"8bit",defaultValue:0,description:"Auto-generated variable from Globals node",category:"custom"}),d.add(h)}}),r.forEach(h=>{if(!d.has(h)){const c=`global_var_${h.replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`;p.push({name:h,asmName:c,type:"8bit",defaultValue:0,description:"Auto-generated variable from IfThenElse node",category:"custom"}),d.add(h)}}),p}const v={AND:"AND",OR:"OR",XOR:"XOR",NOT:"NOT",KEY_PRESSED:"KEY_PRESSED",KEY_RELEASED:"KEY_RELEASED",TIME_OUT:"TIME_OUT",CAN_MOVE_DIRECTION:"CAN_MOVE_DIRECTION",HAS_COLLISION:"HAS_COLLISION",PATH_CLEAR:"PATH_CLEAR",ON_WALL_COLLISION:"ON_WALL_COLLISION",HAS_DEADLY_TILE_COLLISION:"HAS_DEADLY_TILE_COLLISION",ANIMATION_COMPLETE:"ANIMATION_COMPLETE",KEY_AND_MOVEMENT:"KEY_AND_MOVEMENT",VARIABLE_COMPARE:"VARIABLE_COMPARE"},I={SET_POSITION:"SET_POSITION",MOVE_BY:"MOVE_BY",SET_VELOCITY:"SET_VELOCITY",APPLY_FORCE:"APPLY_FORCE",CHANGE_SPRITE:"CHANGE_SPRITE",PLAY_ANIMATION:"PLAY_ANIMATION",SET_ANIMATION_SPEED:"SET_ANIMATION_SPEED",TOGGLE_ANIMATION:"TOGGLE_ANIMATION",PLAY_SOUND:"PLAY_SOUND",PLAY_MUSIC:"PLAY_MUSIC",MUTE_MUSIC:"MUTE_MUSIC",STOP_MUSIC:"STOP_MUSIC",SET_VARIABLE:"SET_VARIABLE",INCREMENT_VARIABLE:"INCREMENT_VARIABLE",DECREMENT_VARIABLE:"DECREMENT_VARIABLE",SET_COMPONENT_PROPERTY:"SET_COMPONENT_PROPERTY",WAIT:"WAIT",GOTO_STATE:"GOTO_STATE",DESTROY_ENTITY:"DESTROY_ENTITY",SPAWN_ENTITY:"SPAWN_ENTITY",GET_RANDOM_ENTITY_POSITION:"GET_RANDOM_ENTITY_POSITION",CHANGE_GAME_FLOW_NODE:"CHANGE_GAME_FLOW_NODE",DECREASE_LIVES:"DECREASE_LIVES",INCREASE_LIVES:"INCREASE_LIVES",RESPAWN_PLAYER:"RESPAWN_PLAYER",BREAK_TILE:"BREAK_TILE",REPLACE_TILE:"REPLACE_TILE",RND:"RND",POINT_AT:"POINT_AT",ADD_VARIABLES:"ADD_VARIABLES",SUBTRACT_VARIABLES:"SUBTRACT_VARIABLES",MULTIPLY_VARIABLES:"MULTIPLY_VARIABLES",DIVIDE_VARIABLES:"DIVIDE_VARIABLES",MODULO_VARIABLES:"MODULO_VARIABLES",ASSIGN_VARIABLE:"ASSIGN_VARIABLE"};function _e(t,a){const e=a.filter(y=>y.type==="componentdefinition").map(y=>y.data),l=a.filter(y=>y.type==="entitytemplate").map(y=>y.data),o=a.filter(y=>y.type==="sprite").map(y=>y.data),r=a.filter(y=>y.type==="tile").map(y=>y.data),n=a.filter(y=>y.type==="screenmap").map(y=>y.data),s=a.filter(y=>y.type==="worldmap").map(y=>y.data),p=a.filter(y=>y.type==="statemachine").map(y=>y.data),d=[];n.forEach(y=>{var D;(D=y.layers)!=null&&D.entities&&Array.isArray(y.layers.entities)&&d.push(...y.layers.entities),y.entities&&Array.isArray(y.entities)&&d.push(...y.entities)});const h=a.find(y=>y.type==="gameflow"),c=h==null?void 0:h.data,m=d.length>0,g=e.length>0||m,S=n.length>1,i=o.length>0,_=r.length>0,u=n.length>0,E=e.length>0,f=!!c,b=a.some(y=>y.type==="font"),A=o.some(y=>y.frames.length>1),T=n.some(y=>y.layers.collision.some(D=>D.some(N=>N!==null))),C=l.some(y=>y.name.toLowerCase().includes("menu")),R=[];e.forEach(y=>{y.name.toLowerCase().includes("state")&&R.push(y.name.replace(/[^a-zA-Z0-9]/g,"").toUpperCase())});const L=qe(a);return{projectName:t,components:e,templates:l,sprites:o,tiles:r,screenMaps:n,screens:n,worldmaps:s,entities:d,fonts:a.filter(y=>y.type==="font"),gameFlow:c,stateMachines:p,hasECS:g,hasMultipleScreens:S,hasSprites:i,hasTiles:_,hasScreens:u,hasEntities:m,hasComponents:E,hasGameFlow:f,hasMenus:C,hasFonts:b,hasAnimations:A,hasCollisions:T,hasMenuSystem:C,customStates:R,globalVariables:L}}const et=t=>{if(!t.hasECS)return`    ; No ECS system - basic entity updates
    RET`;let a=`    ; ECS-based entity updates
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
    
    ; Update entity based on components`;return t.components.forEach((e,l)=>{a+=`
    ; Update ${e.name} component
    CALL UPDATE_${e.name.toUpperCase().replace(/[^A-Z0-9]/g,"_")}`}),a+=`
    
entity_update_skip:
    POP HL
    LD DE, 16           ; Entity structure size
    ADD HL, DE
    POP BC
    DJNZ entity_update_loop
    RET`,a},tt=t=>{if(!t.hasSprites)return`    ; No sprites to update
    RET`;let a=`    ; Update sprite animations and positions
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
    
sprite_no_frame_advance:`;return t.hasAnimations&&(a+=`
    ; Update sprite position based on movement component
    INC HL
    INC HL
    INC HL
    LD A, (HL)          ; X position
    INC HL  
    LD B, (HL)          ; Y position
    ; Apply movement logic here
    ; CALL APPLY_SPRITE_MOVEMENT`),a+=`
    
    POP HL
    LD DE, 8            ; Sprite data structure size
    ADD HL, DE
    POP BC
    DJNZ sprite_update_loop
    RET`,a},at=t=>t.hasCollisions?`    ; Check player collision with environment
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
    RET`,lt=t=>{let a=`    ; Read MSX joystick/keyboard input
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
    
input_no_fire1:`;return t.hasMenuSystem&&(a+=`
    ; Check for pause/menu button (Space)
    LD A, 6             ; Row 6
    CALL SNSMAT
    BIT 0, A            ; Space key
    JR NZ, input_no_pause
    LD A, (input_state)
    SET INPUT_BIT_PAUSE, A
    LD (input_state), A
    
input_no_pause:`),a+=`
    RET`,a},ot=t=>t.hasMenuSystem?`    ; Update menu graphics and cursor
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
    RET`,nt=t=>{if(t.customStates.length===0)return"; No custom states detected";let a=`; Custom state handlers for project-specific logic
`;return t.customStates.forEach(e=>{a+=`
logic_${e.toLowerCase()}:
    ; Custom logic for ${e} state
    ; TODO: Implement ${e} specific logic
    RET
`}),a},it=[{marker:"{{ENTITY_UPDATES}}",generator:et,description:"Entity update system based on ECS components"},{marker:"{{SPRITE_UPDATES}}",generator:tt,description:"Sprite animation and movement updates"},{marker:"{{COLLISION_CHECK}}",generator:at,description:"Collision detection system"},{marker:"{{INPUT_HANDLING}}",generator:lt,description:"Input handling with project-specific controls"},{marker:"{{MENU_SYSTEM}}",generator:ot,description:"Menu system updates and rendering"},{marker:"{{CUSTOM_STATES}}",generator:nt,description:"Custom state handlers detected from project"}];function rt(t,a,e,l=it){const o=_e(a,e);let r=t;return r=r.replace(/{{PROJECT_NAME}}/g,a.toUpperCase()),r=r.replace(/{{PROJECT_NAME_LOWER}}/g,a.toLowerCase()),r=r.replace(/{{GENERATION_DATE}}/g,new Date().toISOString()),l.forEach(n=>{if(r.includes(n.marker)){const s=n.generator(o);r=r.replace(new RegExp(dt(n.marker),"g"),s)}}),r}function st(){return`;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
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
`}function dt(t){return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function Vl(t,a){const e=st(),l=rt(e,t,a),r=`${t.toLowerCase().replace(/[^a-z0-9]/g,"_")}_dynamic_system.asm`,n=_e(t,a);return{filename:r,content:l,analysis:n}}function ct(t={mode:"hybrid"}){const{mode:a,optimizeLevel:e="safe",includeDebug:l=!1}=t;let o=`; ==================================================================
; DIRECT HARDWARE ACCESS ROUTINES
; ==================================================================
; Mode: ${a.toUpperCase()}
; Optimize Level: ${e}
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
;
; Compatibility: MSX1, MSX2, MSX2+
; ==================================================================

`;return o+=pt(),o+=ht(),o+=ut(),o+=mt(),o+=Et(),e==="aggressive"&&(o+=_t(),o+=ft()),l&&(o+=bt()),o+=`
; ==================================================================
; END OF DIRECT HARDWARE ROUTINES
; ==================================================================
`,o}function pt(){return`
; ==================================================================
; FAST_LDIRVM - Fast Block Transfer to VRAM
; ==================================================================
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
;   - Safe to use with interrupts enabled
;   - Works on all MSX models (TMS9918, V9938, V9958)
; ==================================================================
FAST_LDIRVM:
    ; Set VRAM write address
    ld a, e
    out (#99), a           ; Write address low byte to VDP
    ld a, d
    or #40                 ; Set bit 6 for write mode
    out (#99), a           ; Write address high byte + write command

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

`}function _t(){return`
; ==================================================================
; FAST_LDIRVM_256 - Optimized for exactly 256 bytes
; ==================================================================
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
    ; Set VRAM write address
    ld a, e
    out (#99), a
    ld a, d
    or #40
    out (#99), a

    ; Copy 256 bytes using DJNZ (B=0 means 256)
    ld b, 0                ; B = 256 (wraps from 0)
.ldirvm_256_loop:
    ld a, (hl)
    out (#98), a
    inc hl
    djnz .ldirvm_256_loop  ; Faster than dec bc + check (13/8 cycles)
    ret

`}function ht(){return`
; ==================================================================
; FAST_WRTVRM - Write Single Byte to VRAM
; ==================================================================
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

`}function ut(){return`
; ==================================================================
; FAST_RDVRM - Read Single Byte from VRAM
; ==================================================================
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
    in a, (#98)            ; Read from VRAM data port
    ret

`}function mt(){return`
; ==================================================================
; FAST_WRTVDP - Write VDP Register
; ==================================================================
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

`}function Et(){return`
; ==================================================================
; FAST_GTSTCK - Read Joystick Direction
; ==================================================================
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
; Index: UDLR bits (Up, Down, Left, Right)
; Value: Direction code (0-8)
joystick_direction_table:
    db 0  ; 0000 = ---- = Center
    db 1  ; 0001 = ---R = Invalid (Right only handled below)
    db 7  ; 0010 = --L- = Left
    db 0  ; 0011 = --LR = Invalid (Left + Right)
    db 5  ; 0100 = -D-- = Down
    db 4  ; 0101 = -D-R = Down + Right
    db 6  ; 0110 = -DL- = Down + Left
    db 0  ; 0111 = -DLR = Invalid
    db 1  ; 1000 = U--- = Up
    db 2  ; 1001 = U--R = Up + Right
    db 8  ; 1010 = U-L- = Up + Left
    db 0  ; 1011 = U-LR = Invalid
    db 0  ; 1100 = UD-- = Invalid (Up + Down)
    db 0  ; 1101 = UD-R = Invalid
    db 0  ; 1110 = UDL- = Invalid
    db 0  ; 1111 = UDLR = Invalid

; NOTE: Entry 0001 (Right only) is placed at index 1, not 3
; This is correct per MSX joystick bit mapping:
;   Bit 0 = Up    (0001)
;   Bit 1 = Down  (0010)
;   Bit 2 = Left  (0100)
;   Bit 3 = Right (1000)

; Corrected table (actual MSX bit order):
joystick_direction_table_v2:
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

`}function ft(){return`
; ==================================================================
; COPY_SPRITE_PATTERN_UNROLLED - Ultra-fast sprite pattern copy
; ==================================================================
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

`}function bt(){return`
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

`}function yt(t={}){const{hardwareMode:a}=t;let e=`; ==================================================================
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
; NOTE: Fast hardware access routines (FAST_LDIRVM, FAST_WRTVRM, etc.)
;       are provided by directHardwareGenerator.ts when hybrid/direct mode
;       is enabled. See directHardwareGenerator.ts for implementations.
; ==================================================================

; ==================================================================
; END OF BIOS DEFINITIONS
; ==================================================================
`;return a&&(a.mode==="direct"||a.mode==="hybrid")?e+`
`+ct(a):e}function gt(t){let a="";if(!t.globalVariables||t.globalVariables.length===0)return a+=`; Goal Variable Values (default)
`,a+=`GOAL_FAILURE            EQU 0    ; Goal = "Failure"
`,a+=`GOAL_COMPLETED          EQU 1    ; Goal = "Completed"
`,a;const e=new Set;return t.globalVariables.forEach(l=>{l.values&&l.values.length>0&&(a+=`
; ${l.name} - ${l.description||"Variable values"}
`,l.values.forEach(o=>{const r=(o.asmConstant||"UNKNOWN").trim(),n=typeof o.value=="number"?o.value:0;e.has(r)||(a+=`${r.padEnd(24)}EQU ${n}    ; ${l.name} = "${o.label}"
`,e.add(r))}))}),a}function St(t){var a,e,l;return`; ==================================================================
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
${t.tiles.map((o,r)=>`; Tile ${r}: ${o.name} = ${o.width}x${o.height}px (${Math.ceil(o.width/8)}x${Math.ceil(o.height/8)} MSX chars)`).join(`
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

; ==================================================================
; MIDEAS GLOBAL VARIABLES - CONSTANTS FOR VALUES
; ==================================================================

${gt(t)}

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
TOTAL_SPRITES           EQU ${((a=t.sprites)==null?void 0:a.length)||0}
TOTAL_TILES             EQU ${((e=t.tiles)==null?void 0:e.length)||0}
TOTAL_SCREENS           EQU ${((l=t.screenMaps)==null?void 0:l.length)||0}

; ==================================================================
; END OF CONSTANTS
; ==================================================================
`}function At(t){let a=`; ==================================================================
; RAM VARIABLES DEFINITIONS
; File: variables.asm
; Description: Dynamic variable allocation using EQU addresses
; Generated based on project analysis
; ==================================================================

; ==================================================================
; CORE SYSTEM VARIABLES (ALWAYS PRESENT)
; ==================================================================
`,e=49152;a+=`input_state         EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Current joystick/keyboard state
`,e++,a+=`prev_input_state    EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Previous input state
`,e++,a+=`input_fire          EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Fire button state (0=released, 1=pressed)
`,e++,a+=`current_flow_state  EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Current game flow state
`,e++,a+=`prev_flow_state     EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Previous game flow state
`,e++,a+=`
; ==================================================================
; MIDEAS GLOBAL VARIABLES (DEFAULTS + CUSTOM)
; ==================================================================
`,t.globalVariables&&t.globalVariables.length>0?t.globalVariables.forEach(l=>{const o=l.type==="16bit"?2:1,r=l.type==="16bit"?" (16-bit)":" (8-bit)",n=l.description||l.name;a+=`${l.asmName.padEnd(20)} EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; ${n}${r}
`,e+=o}):(a+=`global_var_goal     EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Goal status (0=Failure, 1=Completed)
`,e++),a+=`
; ==================================================================
; SYSTEM VARIABLES
; ==================================================================
`,a+=`ROM_slot            EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; ROM slot number (for SETPAGES32K)
`,e++,a+=`frame_counter       EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Frame counter (16-bit)
`,e+=2,a+=`
; ==================================================================
; SCREEN MAP POINTERS (Current active screen)
; ==================================================================
`,a+=`current_screen_layout   EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Pointer to current screen layout data (16-bit)
`,e+=2,a+=`current_behavior_map    EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Pointer to current behavior map data (16-bit)
`,e+=2,a+=`
; ==================================================================
; VIEWPORT/CAMERA VARIABLES (for scroll system)
; ==================================================================
`,a+=`camera_x            EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Camera X position in pixels (16-bit)
`,e+=2,a+=`camera_y            EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Camera Y position in pixels (16-bit)
`,e+=2,a+=`camera_tile_x       EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Camera tile X (column)
`,e++,a+=`camera_tile_y       EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Camera tile Y (row)
`,e++,a+=`world_width_tiles   EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; World width in tiles
`,e++,a+=`world_height_tiles  EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; World height in tiles
`,e++,a+=`scroll_dirty_flag   EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; 1=viewport changed, needs redraw
`,e++,a+=`
; ==================================================================
; ANIMATED TILES VARIABLES
; ==================================================================
`,a+=`anim_tile_timer     EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Animation frame timer
`,e++,a+=`anim_tile_frame     EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Current animation frame (0-3)
`,e++,a+=`anim_tile_speed     EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Frames between animation updates
`,e++,a+=`
; ==================================================================
; PARTICLE SYSTEM VARIABLES
; ==================================================================
`,a+=`particle_pool       EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Particle pool (8 particles * 8 bytes = 64 bytes)
`,e+=64,a+=`
; ==================================================================
; ENTITY SYSTEM VARIABLES (Fixed 32 entities)
; ==================================================================
MAX_ENTITIES        EQU 32
`,a+=`entity_active       EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Entity active flags (32 bytes, 0=inactive, 1=active)
`,e+=32,a+=`entity_x_pos        EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Entity X positions (32 bytes)
`,e+=32,a+=`entity_y_pos        EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Entity Y positions (32 bytes)
`,e+=32,a+=`entity_vel_x        EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Entity X velocity (32 bytes)
`,e+=32,a+=`entity_vel_y        EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Entity Y velocity (32 bytes)
`,e+=32,a+=`entity_comp_masks   EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Entity component masks (32 bytes)
`,e+=32,a+=`entity_comp_masks_hi EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Entity component masks high byte (32 bytes)
`,e+=32,a+=`entity_screen_id    EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Entity screen ID (32 bytes)
`,e+=32,a+=`entity_dir_mask     EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Entity direction mask (32 bytes)
`,e+=32,a+=`entity_health       EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Entity health (32 bytes)
`,e+=32,a+=`entity_anim_frame   EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Entity animation frame (32 bytes)
`,e+=32,a+=`entity_anim_tick    EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Entity animation tick counter (32 bytes)
`,e+=32,a+=`entity_anim_speed   EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Entity animation speed (ticks per frame) (32 bytes)
`,e+=32,a+=`entity_anim_flags   EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Entity animation flags (32 bytes)
`,e+=32,a+=`entity_sm_ptr_l     EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Entity State Pointer Low (32 bytes)
`,e+=32,a+=`entity_sm_ptr_h     EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Entity State Pointer High (32 bytes)
`,e+=32,a+=`entity_sm_timer_l   EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Entity State Timer Low (32 bytes)
`,e+=32,a+=`entity_sm_timer_h   EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Entity State Timer High (32 bytes)
`,e+=32,a+=`entity_sm_wait_timer EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Entity State Wait Timer (32 bytes)
`,e+=32,a+=`entity_lifetime     EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Entity lifetime for auto-destroy (32 bytes, 0=infinite)
`,e+=32,a+=`entity_carried_by   EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Entity carrier ID (32 bytes, 255=not carried)
`,e+=32;for(let l=0;l<8;l++)a+=`entity_sm_var_${l}     EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Entity Variable ${l} (32 bytes)
`,e+=32;return a+=`
; ==================================================================
; SPRITE SYSTEM VARIABLES
; ==================================================================
`,a+=`active_sprite_count EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Number of sprites currently active
`,e++,a+=`sprite_pattern      EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Sprite pattern IDs (32 bytes)
`,e+=32,a+=`sprite_color        EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Sprite colors (32 bytes)
`,e+=32,a+=`sprite_attributes   EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Interleaved sprite attributes (32 * 4 bytes)
`,e+=128,t.screenMaps.length>0&&(a+=`
; ==================================================================
; SCREEN SYSTEM VARIABLES (${t.screenMaps.length} screens detected)
; ==================================================================
`,a+=`current_screen_id   EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Currently displayed screen ID
`,e++,a+=`screen_dirty_flag   EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Screen needs redraw flag
`,e++,a+=`current_world_id    EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Current world ID (for multi-world support)
`,e++,a+=`current_screen_index EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Current screen index within world
`,e++),a+=`
; ==================================================================
; PLAYER SYSTEM VARIABLES (player entity detected)
; ==================================================================
`,a+=`player_x            EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Player X position (16-bit)
`,e+=2,a+=`player_y            EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Player Y position (16-bit)
`,e+=2,a+=`player_health       EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Player health points
`,e++,a+=`player_score        EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Player score (16-bit)
`,e+=2,a+=`
; ==================================================================
; AUXILIARY VARIABLES 
; ==================================================================
deterministic        EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Deterministic mode flag
`,e++,a+=`
; ==================================================================
; TEMPORARY VARIABLES (ALWAYS NEEDED)
; ==================================================================
`,a+=`temp_word_1         EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 16-bit storage
`,e+=2,a+=`temp_word_2         EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 16-bit storage
`,e+=2,a+=`temp_byte_1         EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage
`,e++,a+=`temp_byte_2         EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage
`,e++,a+=`temp_byte_3         EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,e+=32,a+=`temp_byte_4         EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,e+=32,a+=`temp_byte_5         EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,e+=32,a+=`temp_byte_6         EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,e+=32,a+=`temp_byte_7         EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,e+=32,a+=`temp_byte_8         EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,e+=32,a+=`temp_byte_9         EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,e+=32,a+=`temp_byte_10        EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,e+=32,a+=`temp_byte_11        EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,e+=32,a+=`temp_byte_12        EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,e+=32,a+=`temp_byte_13        EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,e+=32,a+=`temp_byte_14        EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,e+=32,a+=`temp_byte_15        EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,e+=32,a+=`temp_byte_16        EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,e+=32,a+=`temp_byte_17        EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 8-bit storage (32 bytes)
`,e+=32,a+=`temp_word_3         EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 16-bit storage (64 bytes)
`,e+=64,a+=`temp_word_4         EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 16-bit storage (64 bytes)
`,e+=64,a+=`
; ==================================================================
; END OF VARIABLES
; ==================================================================
RAM_USAGE_END       EQU #${e.toString(16).toUpperCase().padStart(4,"0")}   ; End of project variables (${e-49152} bytes used)

; ==================================================================
; MEMORY LAYOUT INFO (Reference only - no code generated)
; ==================================================================
; RAM Layout:
;   #C000-#${e.toString(16).toUpperCase().padStart(4,"0")}: Project variables (${e-49152} bytes)
;   #${e.toString(16).toUpperCase().padStart(4,"0")}-#F37F: Free RAM (~${62336-e} bytes available)
;   #F380-#FFFF: MSX System variables (DO NOT TOUCH)
;
; NOTE: Variables are defined using EQU (address labels only).
;       RAM space is used at runtime, NOT reserved in ROM.
;       Do NOT use ORG #C000 in cartridge ROMs!
; ==================================================================
`,a}function Tt(t){if(!t)return"";let a="";return a+=`    ld a, 0
`,a+=`    ld hl, task_update_input
`,a+=`    call enable_task

`,a}function It(t,a){var l;let e="";if(a!=null&&a.gameFlow){const o=a.gameFlow;e=`
; GameFlow Integration: Using "${o.name}" as execution orchestrator`;const r=o.nodes.find(n=>n.type==="Start");if(r){const n=o.connections.find(s=>{var p;return((p=s.from)==null?void 0:p.nodeId)===r.id||typeof s.from=="string"&&s.from===r.id});if(n){const s=((l=n.to)==null?void 0:l.nodeId)||n.to,p=o.nodes.find(d=>d.id===s);p&&(e+=`
; Flow: Start → ${p.type} (${p.title||p.name||p.id})`)}}}return`; ==================================================================
; MSX CARTRIDGE ROM HEADER
; File: header.asm
; Description: Standard MSX cartridge initialization${e}
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

    call SETPAGES32K

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
    ${Tt(a)}
    ei

${a.hasGameFlow?`    ; ====================================================
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
`}function H(t){return t.replace(/[^a-zA-Z0-9]/g,"_")}function Le(t){return`NODE_TYPE_${t.replace(/([a-z])([A-Z])/g,"$1_$2").toUpperCase()}`}function Ct(t){const a=(t.name||"DEFAULT").toUpperCase().replace(/[^A-Z0-9]/g,"_"),e=t.id?`_${t.id.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";return`load_screen_${a.toLowerCase()}${e.toLowerCase()}`}function Dt(t){var o,r,n;if(!t.gameFlow)return vt(t);const a=t.gameFlow;let e=`; ==================================================================
; GAMEFLOW EXECUTION ENGINE
; File: gameflow.asm
; Description: GameFlow-based game orchestration system
; ==================================================================
;
; GameFlow: ${a.name||"Unnamed"}
; Total Nodes: ${((o=a.nodes)==null?void 0:o.length)||0}
; Total Connections: ${((r=a.connections)==null?void 0:r.length)||0}
; Start Node: ${a.startNodeId||"NONE"}
;
; ARCHITECTURE:
; - GameFlow is the SOLE execution orchestrator
; - Each node generates its own execution code
; - Connections between nodes define the complete flow
; - No hardcoded main_loop outside GameFlow
; ==================================================================

`;e+=`; ==================================================================
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
${a.startNodeId?`    ld hl, gameflow_node_${H(a.startNodeId)}`:`    ; ERROR: No start node defined!
    ret`}
    jp gameflow_execute_node

`,e+=`; ==================================================================
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
`;const l=Array.from(new Set(((n=a.nodes)==null?void 0:n.map(s=>s.type))||[]));return l.forEach(s=>{const p=`gameflow_handle_${s.toLowerCase()}`;e+=`    cp ${Le(s)}
    jp z, ${p}
`}),e+=`    
    ; Unknown node type - error
    ret

`,e+=`; ==================================================================
; NODE TYPE HANDLERS
; Each handler receives:
;   DE = node data pointer
;   BC = connection table pointer
; ==================================================================

`,e+=Lt(l),e+=`; ==================================================================
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

`,e+=`; ==================================================================
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
    
    ; Wait for V-Blank (from H.TIMI hook)
    call wait_vblank
    
    ; Loop
    jp gameflow_world_game_loop

`,e+=`; ==================================================================
; NODE DATA STRUCTURES
; Each node has: type byte, data pointer, connection table pointer
; ==================================================================

`,a.nodes&&a.nodes.length>0&&a.nodes.forEach(s=>{e+=Rt(s,a)}),e+=`
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
`,t.globalVariables&&t.globalVariables.length>0&&(e+=`    ; Initialize global variables
`,t.globalVariables.forEach(s=>{const p=s.name,d=s.asmName||`global_var_${p.replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`,h=s.values&&s.values.length>0?s.values[0].value:0;e+=`    ld a, ${typeof h=="boolean"?h?1:0:h}
`,e+=`    ld (${d}), a    ; ${p} = ${h}
`})),e+=`    ret

`,e+=`; ==================================================================
; GAMEFLOW VARIABLES
; ==================================================================

gameflow_exit_requested:    db 0    ; Flag to exit current game loop
gameflow_menu_selection:    db 0    ; Last menu selection
gameflow_condition_result:  db 0    ; Result of last condition evaluation

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
`,e}function Lt(t,a){let e="";return t.forEach(l=>{switch(l){case"Start":e+=`gameflow_handle_start:
    ; Start node - Initialize game state and systems
    ; DE = node data pointer (initialization config)
    ; BC = connection table

    push bc         ; Save connection table

    ; Execute initialization routine
    ; DE points to start_init_data structure
    ex de, hl
    ld e, (hl)
    inc hl
    ld d, (hl)      ; DE = initialization routine address

    ; Call initialization routine (if not null)
    ld a, d
    or e
    jr z, .skip_init

    ; Call the initialization routine
    push de
    ex de, hl
    ld de, .after_init
    push de
    jp (hl)         ; Indirect call, returns to .after_init

.after_init:
    pop de

.skip_init:
    ; Continue to next node
    pop bc
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z           ; No connection
    jp gameflow_execute_node

`;break;case"WorldLink":e+=`gameflow_handle_worldlink:
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
    ld de, .after_load
    push de
    jp (hl)          ; Indirect call, returns to .after_load
    
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

`;break;case"End":e+=`gameflow_handle_end:
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
    push af                       ; Save character
    ex de, hl                     ; HL = VRAM address (from DE)
    pop af                        ; Restore character to A
    call WRTVRM                   ; Write A to VRAM at HL
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

`;break;case"Restart":e+=`gameflow_handle_restart:
    ; Restart node - reset game
    jp init_rom

`;break;case"SubMenu":e+=`gameflow_handle_submenu:
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

; ------------------------------------------------------------------
; show_menu_placeholder
; Display menu and get user selection
; Input:  DE = menu data pointer (options count, option strings)
; Output: gameflow_menu_selection = selected index (0-based)
; ------------------------------------------------------------------
show_menu_placeholder:
    push bc
    push de
    push hl

    ; Get number of options
    ld a, (de)
    inc de
    ld b, a                       ; B = option count
    push bc

    ; Clear menu area
    call clear_screen_area

    ; Display menu title (if present)
    ld hl, str_menu_title
    ld de, #1800 + (6 * 32) + 10  ; Row 6, col 10
    call print_string_vram

    ; Display menu options
    pop bc
    push bc
    ld c, 0                       ; C = current option index
    ld de, #1800 + (8 * 32) + 8   ; Start at row 8, col 8

.display_options:
    push bc
    push de

    ; Display option text (placeholder: "Option N")
    ld hl, str_option
    call print_string_vram

    ; Display option number
    ld a, c
    add a, '0'                    ; Convert to ASCII
    ld (de), a                    ; Write to VRAM

    pop de
    ld a, e
    add a, 32                     ; Next row
    ld e, a
    ld a, d
    adc a, 0
    ld d, a

    pop bc
    inc c
    djnz .display_options

    pop bc                        ; B = option count
    xor a
    ld (gameflow_menu_selection), a ; Start at option 0

    ; Menu input loop
.menu_loop:
    halt                          ; Wait V-blank

    ; Check UP key
    call GTSTCK
    cp 1                          ; Up
    jr nz, .smp_check_down

    ld a, (gameflow_menu_selection)
    or a
    jr z, .menu_loop              ; Already at top
    dec a
    ld (gameflow_menu_selection), a

    ; Wait for key release
    ld c, 10
.smp_wait_up:
    halt
    dec c
    jr nz, .smp_wait_up
    jr .menu_loop

.smp_check_down:
    cp 5                          ; Down
    jr nz, .smp_check_fire

    ld a, (gameflow_menu_selection)
    inc a
    cp b                          ; Compare with option count
    jr nc, .menu_loop             ; Already at bottom
    ld (gameflow_menu_selection), a

    ; Wait for key release
    ld c, 10
.smp_wait_down:
    halt
    dec c
    jr nz, .smp_wait_down
    jr .menu_loop

.smp_check_fire:
    call GTTRIG
    or a
    jr z, .menu_loop              ; No fire, continue loop

    ; Fire pressed - exit with selection
    pop hl
    pop de
    pop bc
    ret

str_menu_title:
    db "MENU", 0

str_option:
    db "Option ", 0

`;break;case"Text":e+=`gameflow_handle_text:
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

; ------------------------------------------------------------------
; show_text_placeholder
; Display text message on screen
; Input: DE = text data pointer (text string, duration)
; ------------------------------------------------------------------
show_text_placeholder:
    push bc
    push de
    push hl

    ; Get text string pointer
    ex de, hl
    ld e, (hl)
    inc hl
    ld d, (hl)                    ; DE = text string pointer
    inc hl
    ld a, (hl)                    ; A = display duration (frames, 0=wait for input)
    push af

    ; Clear text area (rows 18-20 for text box)
    ld b, 3
    ld c, 18

.clear_text_area:
    push bc
    ld a, c
    call clear_screen_row
    pop bc
    inc c
    djnz .clear_text_area

    ; Display text in text box area
    ex de, hl                     ; HL = text string
    ld de, #1800 + (19 * 32) + 2  ; Row 19, col 2 (centered)
    call print_string_vram

    pop af                        ; A = duration
    or a
    jr z, .wait_input             ; 0 = wait for input

    ; Wait for specified duration
    ld b, a
.duration_wait:
    halt
    djnz .duration_wait
    jr .text_done

.wait_input:
    ; Wait for fire button
    call wait_for_fire

.text_done:
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
    call GTTRIG
    or a
    jr z, .wait_press

    ; Wait for fire button release
.wait_release:
    halt
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

`;break;case"IfThenElse":e+=`gameflow_handle_ifthenelse:
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

`;break;case"Globals":e+=`gameflow_handle_globals:
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

`;break;case"Waypoint":e+=`gameflow_handle_waypoint:
    ; Waypoint node - passthrough routing node
    ; Simply follow default connection
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

`;break;case"Transition":e+=`gameflow_handle_transition:
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

; ------------------------------------------------------------------
; execute_transition_effect
; Execute visual transition effect
; Input:  DE = Transition data pointer (effect type + parameters)
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
execute_transition_effect:
    ; Get transition effect type from data
    ld a, (de)                    ; A = effect type
    inc de                        ; DE now points to parameters

    ; Dispatch to effect handler
    or a
    jr z, .trans_fade_out         ; 0 = Fade out
    dec a
    jr z, .trans_fade_in          ; 1 = Fade in
    dec a
    jr z, .trans_flash            ; 2 = Flash
    dec a
    jr z, .trans_wipe_down        ; 3 = Wipe down
    dec a
    jr z, .trans_wipe_up          ; 4 = Wipe up
    ret                           ; Unknown effect, do nothing

; ------------------------------------------------------------------
; Fade Out Effect (darken screen gradually)
; ------------------------------------------------------------------
.trans_fade_out:
    push de

    ; MSX Screen 2 fade: Modify color table to darken colors
    ; We'll do a simple version: set all colors to black in steps
    ld b, 4                       ; 4 fade steps

.fade_out_loop:
    push bc

    ; Darken one step (reduce brightness in color table)
    ; For simplicity, we'll just wait and then blank screen
    ld b, 20                      ; Wait frames
.fade_out_wait:
    halt                          ; Wait for V-blank
    djnz .fade_out_wait

    pop bc
    djnz .fade_out_loop

    ; Final step: blank screen
    call blank_screen

    pop de
    ret

; ------------------------------------------------------------------
; Fade In Effect (brighten screen gradually)
; ------------------------------------------------------------------
.trans_fade_in:
    push de

    ; Restore screen from black
    call restore_screen_colors

    ld b, 4                       ; 4 fade steps

.fade_in_loop:
    push bc

    ld b, 20                      ; Wait frames
.fade_in_wait:
    halt
    djnz .fade_in_wait

    pop bc
    djnz .fade_in_loop

    pop de
    ret

; ------------------------------------------------------------------
; Flash Effect (quick screen flash)
; ------------------------------------------------------------------
.trans_flash:
    push de

    ld b, 3                       ; Flash 3 times

.flash_loop:
    push bc

    ; Flash white
    ld a, 7                       ; VDP R#7 - Text color (affects border/backdrop)
    ld b, a
    ld c, #F0                     ; White on white
    call WRTVDP

    ld b, 5
.flash_white_wait:
    halt
    djnz .flash_white_wait

    ; Flash black
    ld a, 7
    ld b, a
    ld c, 0                       ; Black
    call WRTVDP

    ld b, 5
.flash_black_wait:
    halt
    djnz .flash_black_wait

    pop bc
    djnz .flash_loop

    ; Restore normal backdrop color
    ld a, 7
    ld b, a
    ld c, 0
    call WRTVDP

    pop de
    ret

; ------------------------------------------------------------------
; Wipe Down Effect (curtain wipe top to bottom)
; ------------------------------------------------------------------
.trans_wipe_down:
    push de

    ; Clear screen line by line from top to bottom
    ld b, 24                      ; 24 rows
    ld c, 0                       ; Start row

.wipe_down_loop:
    push bc

    ; Clear row C (fill with pattern 0)
    ld a, c
    call clear_screen_row

    ; Wait a bit
    ld b, 2
.wipe_down_wait:
    halt
    djnz .wipe_down_wait

    pop bc
    inc c                         ; Next row
    djnz .wipe_down_loop

    pop de
    ret

; ------------------------------------------------------------------
; Wipe Up Effect (curtain wipe bottom to top)
; ------------------------------------------------------------------
.trans_wipe_up:
    push de

    ; Clear screen line by line from bottom to top
    ld b, 24                      ; 24 rows
    ld c, 23                      ; Start row (bottom)

.wipe_up_loop:
    push bc

    ; Clear row C
    ld a, c
    call clear_screen_row

    ; Wait a bit
    ld b, 2
.wipe_up_wait:
    halt
    djnz .wipe_up_wait

    pop bc
    dec c                         ; Previous row
    djnz .wipe_up_loop

    pop de
    ret

; ------------------------------------------------------------------
; Helper: Blank entire screen (set all colors to black)
; ------------------------------------------------------------------
blank_screen:
    ; Set VDP backdrop color to black
    ld a, 7                       ; VDP R#7
    ld b, a
    ld c, 0                       ; Black backdrop
    call WRTVDP

    ; Optionally: Set all sprite colors to 0 (transparent)
    ; For now, just backdrop is enough
    ret

; ------------------------------------------------------------------
; Helper: Restore screen colors
; ------------------------------------------------------------------
restore_screen_colors:
    ; Restore normal backdrop color
    ld a, 7                       ; VDP R#7
    ld b, a
    ld c, #04                     ; Dark blue backdrop (MSX default)
    call WRTVDP
    ret

`;break;case"Group":e+=`gameflow_handle_group:
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

`;break;case"Music":e+=`gameflow_handle_music:
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

; ------------------------------------------------------------------
; execute_music_command
; Execute music playback command
; Input: DE = music data (command, track ID, loop flag)
; Commands: 0=stop, 1=play, 2=pause, 3=resume
; ------------------------------------------------------------------
execute_music_command:
    push af
    push bc
    push de
    push hl

    ; Get music command
    ld a, (de)
    inc de
    ld b, a                       ; B = command

    ; Get track ID
    ld a, (de)
    inc de
    ld c, a                       ; C = track ID

    ; Get loop flag
    ld a, (de)
    ld (music_loop_flag), a

    ; Dispatch based on command
    ld a, b
    or a
    jr z, .music_stop             ; 0 = Stop
    dec a
    jr z, .music_play             ; 1 = Play
    dec a
    jr z, .music_pause            ; 2 = Pause
    dec a
    jr z, .music_resume           ; 3 = Resume
    jr .music_done

.music_stop:
    ; Stop all music - silence PSG
    call psg_silence_all
    xor a
    ld (music_playing), a
    jr .music_done

.music_play:
    ; Play track C
    ld a, c
    ld (music_current_track), a
    call psg_init_track
    ld a, 1
    ld (music_playing), a
    jr .music_done

.music_pause:
    ; Pause current track
    call psg_silence_all
    xor a
    ld (music_playing), a
    jr .music_done

.music_resume:
    ; Resume current track
    ld a, (music_current_track)
    call psg_init_track
    ld a, 1
    ld (music_playing), a

.music_done:
    pop hl
    pop de
    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; PSG Helper Functions
; ------------------------------------------------------------------

; Silence all PSG channels
psg_silence_all:
    push af
    push bc

    ; Set volume to 0 for all 3 channels
    ld a, #88                     ; Channel A volume
    out (#A0), a
    ld a, 0
    out (#A1), a

    ld a, #89                     ; Channel B volume
    out (#A0), a
    ld a, 0
    out (#A1), a

    ld a, #8A                     ; Channel C volume
    out (#A0), a
    ld a, 0
    out (#A1), a

    pop bc
    pop af
    ret

; Initialize PSG track
psg_init_track:
    push af
    push bc
    push hl

    ; A = track ID
    ; For now, simple beep on channel A
    ; Full implementation would load track data from music table

    ; Set channel A frequency (440 Hz = A4 note)
    ld a, #00                     ; Fine tune register
    out (#A0), a
    ld a, #FE                     ; Frequency low byte
    out (#A1), a

    ld a, #01                     ; Coarse tune register
    out (#A0), a
    ld a, #01                     ; Frequency high byte
    out (#A1), a

    ; Set channel A volume
    ld a, #08                     ; Volume register
    out (#A0), a
    ld a, #0F                     ; Max volume
    out (#A1), a

    ; Enable tone on channel A
    ld a, #07                     ; Mixer register
    out (#A0), a
    ld a, #3E                     ; Enable tone A, disable noise
    out (#A1), a

    pop hl
    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; Music system variables (should be in variables section)
; ------------------------------------------------------------------
music_playing:
    db 0                          ; 0=stopped, 1=playing

music_current_track:
    db 0                          ; Current track ID

music_loop_flag:
    db 0                          ; 0=no loop, 1=loop

`;break;default:e+=`gameflow_handle_${l.toLowerCase()}:
    ; ${l} node - not yet implemented
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

`;break}}),e}function Rt(t,a,e){var d,h,c,m,g,S;const l=`gameflow_node_${H(t.id)}`,o=`${l}_conn`,r=["Start","WorldLink","SubMenu","Text","IfThenElse","Globals"].includes(t.type)||t.type==="Globals"&&t.variables&&t.variables.length>0,n=r?`${l}_data`:"gameflow_no_data";let s=`; Node: ${t.type} - "${t.title||t.name||t.id}"
${l}:
    db ${Le(t.type)}
    dw ${n}
    dw ${o}

`;if(r){switch(s+=`${l}_data:
`,t.type){case"Start":s+=`    dw ${l}_init    ; Initialization routine address
`;break;case"WorldLink":const i=t.worldAssetId||"default";s+=`    dw load_world_${H(i)}
`;break;case"SubMenu":s+=`    db ${((d=t.options)==null?void 0:d.length)||0}    ; Number of options
`;break;case"Text":s+=`    dw text_${H(t.id)}    ; Text content pointer
`;break;case"IfThenElse":const u=`global_var_${(t.variableName||"unknown").replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`,E=t.compareValue||0;s+=`    dw ${u}    ; Variable to check
`,s+=`    db ${E}   ; Compare value
`,s+=`    db 0                 ; Operator (0=equals)
`;break;case"Globals":t.variables&&t.variables.length>0?(s+=`    db ${t.variables.length}    ; Number of assignments
`,t.variables.forEach(f=>{const A=`global_var_${(f.variableName||f.name||"unknown").replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`,T=f.value||0;s+=`    dw ${A}
`,s+=`    db ${T}
`})):s+=`    db 0    ; No assignments
`;break}s+=`
`}s+=`${o}:
`;const p=((h=a.connections)==null?void 0:h.filter(i=>{var _;return(((_=i.from)==null?void 0:_.nodeId)||i.from)===t.id}))||[];if(t.type==="IfThenElse"){const i=p.find(u=>{var E,f;return((E=u.from)==null?void 0:E.sourceId)==="then"||!((f=u.from)!=null&&f.sourceId)}),_=p.find(u=>{var E;return((E=u.from)==null?void 0:E.sourceId)==="else"});s+=`    db CONNECTION_THEN
`,s+=`    dw ${i?`gameflow_node_${H(((c=i.to)==null?void 0:c.nodeId)||i.to)}`:"0"}
`,s+=`    db CONNECTION_ELSE
`,s+=`    dw ${_?`gameflow_node_${H(((m=_.to)==null?void 0:m.nodeId)||_.to)}`:"0"}
`}else if(t.type==="SubMenu")(g=t.options)==null||g.forEach((i,_)=>{var E;const u=p.find(f=>{var b;return((b=f.from)==null?void 0:b.sourceId)===i.id});s+=`    db CONNECTION_OPTION_${_}
`,s+=`    dw ${u?`gameflow_node_${H(((E=u.to)==null?void 0:E.nodeId)||u.to)}`:"0"}
`});else{const i=p[0];s+=`    db CONNECTION_DEFAULT
`,s+=`    dw ${i?`gameflow_node_${H(((S=i.to)==null?void 0:S.nodeId)||i.to)}`:"0"}
`}return s+=`    db CONNECTION_END

`,t.type==="Start"&&(s+=Nt(t,l)),s}function Nt(t,a,e){let l=`; ------------------------------------------------------------------
; ${a}_init
; Initialization routine for Start node
; Initializes global variables and MSX systems
; ------------------------------------------------------------------
${a}_init:
`;const o=t.initializeGlobals,r=t.systemConfig;return r&&(l+=`    ; === MSX System Initialization ===
`,r.initPSG&&(l+=`    ; Initialize PSG (silence all channels)
`,l+=`    call init_psg_silence

`),r.clearSprites&&(l+=`    ; Clear sprite attribute table
`,l+=`    call clear_sprite_table

`),r.clearVRAM&&(l+=`    ; Clear VRAM areas
`,l+=`    call clear_vram_areas

`),r.resetVDP&&(l+=`    ; Reset VDP registers to default
`,l+=`    call reset_vdp_registers

`)),o&&o.enabled&&(l+=`    ; === Global Variables Initialization ===
`,o.variables&&o.variables.length>0?o.variables.forEach(n=>{const s=n.variableName,p=`global_var_${s.replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`,d=typeof n.value=="boolean"?n.value?1:0:n.value;l+=`    ld a, ${d}
`,l+=`    ld (${p}), a    ; ${s} = ${n.value}
`}):(l+=`    ; Initialize all global variables to default values
`,l+=`    call init_all_global_variables
`),l+=`
`),r&&r.initialDelayFrames&&r.initialDelayFrames>0&&(l+=`    ; Initial delay
`,l+=`    ld b, ${r.initialDelayFrames}
`,l+=`.delay_loop:
`,l+=`    halt    ; Wait for V-blank
`,l+=`    djnz .delay_loop

`),l+=`    ret

`,l}function vt(t){return`; ==================================================================
; DEFAULT GAMEFLOW (No GameFlow defined in project)
; ==================================================================

gameflow_init:
    ret

gameflow_start:
    ; Load first available screen/world
${t.screenMaps&&t.screenMaps.length>0?`    call ${Ct(t.screenMaps[0])}`:"    ; No screens available"}
    ret

gameflow_world_game_loop:
    call update_all_entities
    call execute_all_state_machines
    call update_sprites_to_vram
    call wait_vblank
    jp gameflow_world_game_loop

gameflow_exit_requested:    db 0

; ==================================================================
; END OF DEFAULT GAMEFLOW
; ==================================================================
`}function Ot(t,a){return`; ==================================================================
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

${a.tiles&&a.tiles.length>0?`; 5. Pattern Data (if tiles exist)
include "patterns.asm"

; 6. Color Data (if tiles exist)
include "colors.asm"
`:""}

${a.sprites&&a.sprites.length>0?`; 7. Sprite Data (if sprites exist)
include "sprites.asm"
`:""}

; 8. Components (game logic)
include "components.asm"

; 9. Entities (game objects)
include "entities.asm"

${a.worldmaps&&a.worldmaps.length>0?`; 10. Worlds (world maps)
include "worlds.asm"
`:""}

${a.screenMaps&&a.screenMaps.length>0?`; 11. Screen Maps (if screens exist)
include "screens.asm"
`:""}

; 12. Font Data (custom font for Screen 2 text)
include "font.asm"

; 13. HUD System (heads-up display)
include "hud.asm"

; 14. Menus (user interface)
include "menus.asm"

${a.stateMachines&&a.stateMachines.length>0?`; 15. State Machines (entity AI)
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
`}function wt(t){var a;return!t.tiles||t.tiles.length===0?`; ==================================================================
; PATTERN DATA (EMPTY - NO TILES DETECTED)
; File: patterns.asm
; ==================================================================

; No tiles detected in project - file generated as placeholder
`:`; ==================================================================
; TILE PATTERN DATA
; File: patterns.asm
; Description: Tile pattern definitions for MSX Screen 2
; ${((a=t.tiles)==null?void 0:a.length)||0} tiles detected
; ==================================================================

; ==================================================================
; TILE PATTERN BANK 0 (Base patterns)
; ==================================================================
tile_pattern_bank0:
${t.tiles.map((e,l)=>{const o=$e(e,"SCREEN 2 (Graphics I)"),r=Math.ceil(e.width/8),n=Math.ceil(e.height/8),s=r*n;(e.width%8!==0||e.height%8!==0)&&console.warn(`⚠️  Tile ${e.name} size ${e.width}x${e.height} is not multiple of 8px - may cause visual artifacts`);const p=Array.from(o).map(h=>`#${h.toString(16).padStart(2,"0").toUpperCase()}`);let d="";if(s>1){d=`
    ; Character layout: ${r}×${n} grid`;for(let h=0;h<n;h++){d+=`
    ; Row ${h}: `;for(let c=0;c<r;c++){const m=h*r+c;d+=`Char${m} `}}}return`    ; Tile ${l}: ${e.name} (${e.width}x${e.height}px = ${r}×${n} chars = ${s} MSX characters)${d}
    db ${p.join(", ")}
`}).join("")}

; ==================================================================
; PATTERN LOADING FUNCTIONS
; ==================================================================
load_pattern_bank0:
    ; Load pattern bank 0 to VRAM (base patterns)
    ; Fast direct port access (no BIOS overhead)
    ld hl, tile_pattern_bank0
    ld de, CHRTBL2 + (128 * 8)    ; VRAM pattern table bank 0 (start at char 128)
    ld bc, ${t.tiles.reduce((e,l)=>{const o=Math.ceil(l.width/8),r=Math.ceil(l.height/8);return e+o*r*8},0)}    ; Total bytes for all tile characters (16x16 tiles = 4 chars each)
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
    ret

load_pattern_bank1:
    ; Load pattern bank 1: same patterns as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
    ld hl, tile_pattern_bank0     ; Same source as Bank 0
    ld de, CHRTBL2 + #800 + (128 * 8) ; VRAM pattern table bank 1 (+#800 offset + char 128)
    ld bc, ${t.tiles.reduce((e,l)=>{const o=Math.ceil(l.width/8),r=Math.ceil(l.height/8);return e+o*r*8},0)}    ; Total bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
    ret

load_pattern_bank2:
    ; Load pattern bank 2: same patterns as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
    ld hl, tile_pattern_bank0     ; Same source as Bank 0
    ld de, CHRTBL2 + #1000 + (128 * 8) ; VRAM pattern table bank 2 (+#1000 offset + char 128)
    ld bc, ${t.tiles.reduce((e,l)=>{const o=Math.ceil(l.width/8),r=Math.ceil(l.height/8);return e+o*r*8},0)}    ; Total bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
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
`}function Pt(t){var a;return!t.tiles||t.tiles.length===0?`; ==================================================================
; COLOR DATA (EMPTY - NO TILES DETECTED)
; File: colors.asm
; ==================================================================

; No tiles detected in project - file generated as placeholder
`:`; ==================================================================
; TILE COLOR DATA
; File: colors.asm
; Description: Tile color definitions for MSX Screen 2
; ${((a=t.tiles)==null?void 0:a.length)||0} tiles detected
; ==================================================================

; ==================================================================
; TILE COLOR BANK 0 (Base colors)
; ==================================================================
tile_color_bank0:
${t.tiles.map((e,l)=>{const o=Ge(e),r=o?Array.from(o).map(n=>`#${n.toString(16).padStart(2,"0").toUpperCase()}`):["#F0","#F0","#F0","#F0","#F0","#F0","#F0","#F0"];return`    ; Tile ${l}: ${e.name} colors (fg/bg pairs)
    db ${r.join(", ")}
`}).join("")}

; ==================================================================
; COLOR LOADING FUNCTIONS
; ==================================================================
load_color_bank0:
    ; Load color bank 0 to VRAM (base colors)
    ; Fast direct port access (no BIOS overhead)
    ld hl, tile_color_bank0
    ld de, CLRTBL2 + (128 * 8)    ; VRAM color table bank 0 (start at char 128)
    ld bc, ${t.tiles.reduce((e,l)=>{const o=Math.ceil(l.width/8),r=Math.ceil(l.height/8);return e+o*r*8},0)}     ; Total color bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
    ret

load_color_bank1:
    ; Load color bank 1: same colors as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
    ld hl, tile_color_bank0       ; Same source as Bank 0
    ld de, CLRTBL2 + #800 + (128 * 8) ; VRAM color table bank 1 (+#800 offset + char 128)
    ld bc, ${t.tiles.reduce((e,l)=>{const o=Math.ceil(l.width/8),r=Math.ceil(l.height/8);return e+o*r*8},0)}     ; Total color bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
    ret

load_color_bank2:
    ; Load color bank 2: same colors as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
    ld hl, tile_color_bank0       ; Same source as Bank 0
    ld de, CLRTBL2 + #1000 + (128 * 8) ; VRAM color table bank 2 (+#1000 offset + char 128)
    ld bc, ${t.tiles.reduce((e,l)=>{const o=Math.ceil(l.width/8),r=Math.ceil(l.height/8);return e+o*r*8},0)}     ; Total color bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
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
`}function Mt(t,a,e){var s,p,d,h,c,m,g,S,i,_;const l=(p=(s=e.gameFlow)==null?void 0:s.nodes)==null?void 0:p.some(u=>u.type==="SubMenu"),o=(d=e.screenMaps)==null?void 0:d.some(u=>{var E,f;return((E=u.layers)==null?void 0:E.text)||((f=u.textElements)==null?void 0:f.length)>0}),r=(h=e.screenMaps)==null?void 0:h.some(u=>{var E;return((E=u.hudConfiguration)==null?void 0:E.elements)&&u.hudConfiguration.elements.length>0}),n=l||o||r;return`; ==================================================================
; ${a.toUpperCase()} - UNIFIED FILE
; File: unitedFiles.asm
; Description: All-in-one file combining all modular files
; Generated by Mideas MSX Modular Generator
;
; OPTIMIZED: Only includes necessary code for this project
; Tiles: ${((c=e.tiles)==null?void 0:c.length)||0}
; Sprites: ${((m=e.sprites)==null?void 0:m.length)||0}
; Screens: ${((g=e.screenMaps)==null?void 0:g.length)||0}
; Entities: ${((S=e.entities)==null?void 0:S.length)||0}
; Menus: ${l?"Yes":"No"}
; HUD: ${r?"Yes":"No"}
; State Machines: ${((i=e.stateMachines)==null?void 0:i.length)||0}
; ==================================================================

; CRITICAL: header.asm with ORG #4000 and "AB" signature MUST be first
; for the ROM to work correctly. EQUs can go after ORG.
${t["header.asm"]}

${t["bios.asm"]}

${t["constants.asm"]}

${t["variables.asm"]}

${t["interrupt.asm"]}

${e.tiles&&e.tiles.length>0?t["patterns.asm"]:`; [patterns.asm skipped - no tiles]
`}

${e.tiles&&e.tiles.length>0?t["colors.asm"]:`; [colors.asm skipped - no tiles]
`}

${e.sprites&&e.sprites.length>0?t["sprites.asm"]:`; [sprites.asm skipped - no sprites]
`}

${e.screenMaps&&e.screenMaps.length>0?t["screens.asm"]:`; [screens.asm skipped - no screens]
`}

${e.entities&&e.entities.length>0?t["components.asm"]:`; [components.asm skipped - no entities]
`}

${e.entities&&e.entities.length>0?t["entities.asm"]:`; [entities.asm skipped - no entities]
`}

${l?t["menus.asm"]:`; [menus.asm skipped - no menus]
`}

${n?t["font.asm"]:`; [font.asm skipped - no text/menus]
`}

${r?t["hud.asm"]:`; [hud.asm skipped - no HUD elements]
`}

${t["sound.asm"]}

${t["scroll.asm"]}

${t["animtiles.asm"]}

${t["particles.asm"]}

${t["statemachine.asm"]&&t["statemachine.asm"].trim()!=="; No State Machines"?t["statemachine.asm"]:`; [statemachine.asm skipped - no state machines]
`}

${e.gameFlow?t["gameflow.asm"]:`; [gameflow.asm skipped - no GameFlow]
`}

${((_=e.worldmaps)==null?void 0:_.length)>0?t["worlds.asm"]:`; [worlds.asm skipped - no WorldMaps]
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
${e.hasEntities||e.hasSprites?`    ; Task 0: Input polling (always enabled for responsive controls)
    ld a, 0
    ld hl, task_update_input
    call enable_task
`:""}
${e.hasEntities?`    ; Task 1: Physics update (project has entities with movement)
    ld a, 1
    ld hl, task_update_physics
    call enable_task
`:""}
${e.hasCollisions?`    ; Task 2: Collision detection (project has collision system)
    ld a, 2
    ld hl, task_update_collision
    call enable_task
`:""}
    ; Task 3: Sprites - NOT auto-registered (heavy task, enable manually when needed)

    ; Initialize Game Flow system
    xor a
    ld (current_flow_state), a
    ld (prev_flow_state), a

${(()=>{var u;if(e.gameFlow&&e.gameFlow.nodes&&e.gameFlow.connections){const E=e.gameFlow.nodes.find(f=>f.type==="Start");if(E){const f=e.gameFlow.connections.find(b=>{var T;return(typeof b.from=="string"?b.from:(T=b.from)==null?void 0:T.nodeId)===E.id});if(f){const b=typeof f.to=="string"?f.to:(u=f.to)==null?void 0:u.nodeId,A=e.gameFlow.nodes.find(T=>T.id===b);if(A){const T=A.type;return T==="WorldLink"?`    ; GameFlow: Start → WorldLink detected
    ; Go directly to GAME state (no main menu)
    ld a, FLOW_STATE_GAME
    ld (current_flow_state), a`:T==="SubMenu"?`    ; GameFlow: Start → SubMenu detected
    ; Start with menu interface
    ld a, FLOW_STATE_MAIN_MENU
    ld (current_flow_state), a`:`    ; GameFlow: Start → ${T} detected
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
${e.entities&&e.entities.length>0?`    ; Initialize component systems (entities detected)
    call init_components
`:`    ; No entities - skipping component system initialization
`}
${e.tiles&&e.tiles.length>0?`    ; Load pattern and color data (tiles detected)
    call load_pattern_bank0
    call load_pattern_bank1
    call load_pattern_bank2
    call load_color_bank0
    call load_color_bank1
    call load_color_bank2
`:`    ; No tiles detected - skipping pattern/color loading
`}
${e.entities&&e.entities.length>0?`    ; Initialize game entities with real positions from JSON
    call init_entities
`:`    ; No entities to initialize
`}
    ; Initialize sound system
    call GICINI               ; Initialize PSG

   

${e.screenMaps&&e.screenMaps.length>0?`    ; Load the first game screen
    call load_game_screen
`:`    ; No screens - skip screen loading
`}
${n?`    ; Initialize font system
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

${e.entities&&e.entities.length>0?`    ; Update input first (needed by entities)
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
    ; Main gameplay logic - update all entity components (OPTIMIZED)
${e.entities&&e.entities.length>0?`    call update_all_entities        ; All component systems (optimized - only calls used systems)

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
${e.tiles&&e.tiles.length>0?`    call load_patterns_to_vram       ; Reload tile patterns
    call load_colors_to_vram         ; Reload tile colors`:"    ; [No tiles in project - pattern loading skipped]"}
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
${e.entities&&e.entities.length>0?`    call init_entities
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
${l?`    ; Menu system detected - render menu
    call render_menu_system
`:`    ; No menu system - check if we should auto-start game
    ; Avoid re-initialization by checking if this is first frame
    ld a, (prev_flow_state)
    cp FLOW_STATE_MAIN_MENU
    jr nz, .rmm_skip_init       ; Already changed state, skip init

    ; First frame in menu state - start game
    ld a, FLOW_STATE_GAME
    ld (current_flow_state), a
    call init_game_entities
    call load_game_screen
.rmm_skip_init:
`}    ret

render_game:
    ; Render game frame with optimized sprite updates
    ; Only update sprites that have moved (optimization)

    ; Update sprite positions in VRAM only when needed
    ; This is much more efficient than reloading entire screen
    call update_sprites_to_vram

${r?`    ; Render HUD elements
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
${n?`
string_pause:     db "PAUSED", 0
string_game_over: db "GAME OVER", 0
`:"; No strings needed"}

    end                 ; End of assembly
`}const le={comp_pos:"Position",comp_position:"Position",comp_render:"Sprite",comp_sprite:"Sprite",comp_movement:"Movement",comp_velocity:"Movement",comp_collision:"Collision",comp_wall_collision:"WallCollision",comp_player_input:"Input",comp_input:"Input",comp_ai_behavior:"Behavior",comp_behavior:"Behavior",comp_health:"Health",comp_animation:"Animation",comp_gravity:"Gravity",comp_jump:"Jump",comp_damage:"Damage",comp_statemachine:"StateMachine",comp_cursors:"Cursors",comp_carry:"Carry",comp_collectible:"Collectible"};function xt(t,a){var n,s,p;const e=(n=a==null?void 0:a.components)==null?void 0:n.find(d=>d.definitionId==="comp_sprite"||d.definitionId==="comp_render");if(!e)return;const l=e.defaultValues||{},o=((s=t.componentOverrides)==null?void 0:s.comp_sprite)||((p=t.componentOverrides)==null?void 0:p.comp_render)||{},r={...l,...o};return r.spriteId||r.spriteAssetId||r.sprite||r.spriteName}function ne(t){var r;const a=new Set,e=new Set,l=[],o=new Map;return console.log("🔍 Analyzing component usage..."),console.log(`📊 Total entities in project: ${((r=t.entities)==null?void 0:r.length)||0}`),t.entities&&t.entities.length>0&&t.entities.forEach(n=>{console.log(`  - Entity: ${n.name} (template: ${n.entityTemplateId})`),l.push(n),n.entityTemplateId&&e.add(n.entityTemplateId)}),console.log(`✅ Active entities: ${l.length}`),console.log(`✅ Used templates: ${Array.from(e).join(", ")}`),l.forEach(n=>{var d;const s=n.name||n.id,p=(d=t.templates)==null?void 0:d.find(h=>h.id===n.entityTemplateId);p?(console.log(`  📦 Analyzing template "${p.name}" for entity "${s}"`),p.components&&Array.isArray(p.components)&&p.components.forEach(h=>{const c=h.definitionId||h.componentDefinitionId;if(c){const m=le[c]||c;console.log(`    - Component: ${c} → ${m}`),a.add(m),o.has(m)||o.set(m,new Set),o.get(m).add(s)}}),n.componentOverrides&&Object.keys(n.componentOverrides).forEach(h=>{const c=le[h]||h;console.log(`    - Override: ${h} → ${c}`),a.add(c),o.has(c)||o.set(c,new Set),o.get(c).add(s)})):console.warn(`  ⚠️  Template "${n.entityTemplateId}" not found for entity "${s}"`)}),console.log("📊 Component usage summary:"),console.log(`  - Total used components: ${a.size}`),a.forEach(n=>{const s=o.get(n);console.log(`    • ${n}: ${(s==null?void 0:s.size)||0} entities`)}),{usedComponents:a,usedTemplates:e,activeEntities:l,componentToEntitiesMap:o}}function ge(t,a,e){var n;let l=0;const o={Position:0,Sprite:1,Movement:2,Collision:3,Input:4,Behavior:5,Health:6,Animation:7,Jump:8,Gravity:9};let r=!1;if(a&&a.components&&a.components.forEach(s=>{const p=s.definitionId||s.componentDefinitionId,d=le[p];d&&o[d]!==void 0&&(l|=1<<o[d],d==="Sprite"&&(r=!0))}),t.componentOverrides&&Object.keys(t.componentOverrides).forEach(s=>{const p=le[s];p&&o[p]!==void 0&&(l|=1<<o[p],p==="Sprite"&&(r=!0))}),l|=1<<o.Position,r)l|=1<<o.Sprite;else{const s=xt(t,a);s&&((n=e.sprites)==null?void 0:n.some(d=>d.id===s||d.name===s))&&(l|=1<<o.Sprite)}return l}const kt=224,Se="hex",Ut=t=>t.map(a=>[...a].reverse()),Ae=t=>{var o,r;const a=t.spritePalette||[],e=t.backgroundColor,l=(o=t.frames)==null?void 0:o[0];if(!(l!=null&&l.data))return-1;for(let n=0;n<a.length;n++){const s=a[n];if(s!==e){for(let p=0;p<(l.data.length||0);p++)for(let d=0;d<(((r=l.data[p])==null?void 0:r.length)||0);d++)if(l.data[p][d]===s)return n}}return-1};function Ft(t){var g,S;const a=t.sprites||[];console.log("🎨 generateSpritesFile() called:"),console.log(`  - analysis.sprites.length: ${a.length}`),console.log(`  - analysis.entities.length: ${((g=t.entities)==null?void 0:g.length)||0}`),console.log(`  - analysis.templates.length: ${((S=t.templates)==null?void 0:S.length)||0}`);const{activeEntities:e}=ne(t);console.log(`  - activeEntities.length: ${e.length}`);const l=i=>{if(!i)return 0;const _=P.find(u=>u.hex.toUpperCase()===i.toUpperCase());return _?_.index:15},o=i=>{if(!i)return[15];const _=i.spritePalette||[],u=i.backgroundColor,E=[],f=new Set;for(const b of _){if(!b||u&&b===u)continue;const A=l(b);f.has(A)||(f.add(A),E.push(A))}return E.length>0?E:[15]},r=i=>{var b,A,T,C,R,L;console.log(`
🔍 getEntitySpriteInfo for entity: "${i.name}" (template: ${i.entityTemplateId})`),console.log(`   Available sprites: ${a.map(y=>`"${y.name}" (${y.id})`).join(", ")||"NONE"}`);const _=(b=t.templates)==null?void 0:b.find(y=>y.id===i.entityTemplateId);if(!_)return console.log("   ❌ Template not found!"),null;console.log(`   Template found: "${_.name}"`),console.log(`   Template components: ${((A=_.components)==null?void 0:A.map(y=>y.definitionId).join(", "))||"NONE"}`);const u=t.components||[];let E;if(i.componentOverrides)for(const y in i.componentOverrides){const D=u.find(w=>w.id===y),N=(T=D==null?void 0:D.properties)==null?void 0:T.find(w=>w.type==="sprite_ref");if(N&&((C=i.componentOverrides[y])!=null&&C[N.name])){E=i.componentOverrides[y][N.name],console.log(`   ✅ Found spriteAssetId in overrides: "${E}"`);break}}if(!E)for(const y of _.components||[]){const D=u.find(w=>w.id===y.definitionId),N=(R=D==null?void 0:D.properties)==null?void 0:R.find(w=>w.type==="sprite_ref");if(N&&((L=y.defaultValues)!=null&&L[N.name])){E=y.defaultValues[N.name],console.log(`   ✅ Found spriteAssetId in template defaults: "${E}"`);break}}if(console.log(`   Resolved spriteAssetId: "${E||"undefined"}"`),!E)return console.log("   ⚠️ No sprite_ref property found in any component"),a.length>0?(console.log(`   ⚠️ Defaulting to first sprite "${a[0].name}"`),{spriteAssetIndex:0,spriteName:a[0].name,colors:o(a[0])}):null;let f=a.findIndex(y=>y.id===E);if(f<0&&(f=a.findIndex(y=>y.name===E)),f<0){const y=E.toLowerCase();f=a.findIndex(D=>{var N,w;return((N=D.name)==null?void 0:N.toLowerCase().includes(y))||y.includes(((w=D.name)==null?void 0:w.toLowerCase())||"")})}return f>=0?(console.log(`   ✅ Found sprite "${a[f].name}" at index ${f}`),{spriteAssetIndex:f,spriteName:a[f].name,colors:o(a[f])}):(console.log(`   ❌ Sprite "${E}" not found in project assets`),{spriteAssetIndex:-1,spriteName:`MISSING_${E}`,colors:[15]})},n=[];let s=0;e.forEach((i,_)=>{const u=r(i);if(!u){n.push({entityIndex:_,spriteName:"PLACEHOLDER",spriteAssetIndex:-1,baseHwSpriteIndex:s,layerCount:1,colors:[15]}),s+=1;return}n.push({entityIndex:_,spriteName:u.spriteName,spriteAssetIndex:u.spriteAssetIndex,baseHwSpriteIndex:s,layerCount:u.colors.length,colors:u.colors}),s+=u.colors.length});const p=32;let d=`; ==================================================================
; SPRITE DATA
; File: sprites.asm
; Description: Sprite pattern and animation data
; Entities: ${e.length}
; Total Hardware Sprites (Layers): ${p}
; ==================================================================

; ==================================================================
; SPRITE PATTERN DATA
; ==================================================================
`;a.forEach((i,_)=>{const u=`_${_}`,f=(i.name+u).replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase(),b=be(i,Se,_),A=Ae(i);d+=`
; Sprite Asset ${_}: ${i.name}
${b}`,A>=0?d+=`
; Unified pattern label for sprite ${_}
SPRITE_${_}_PATTERN EQU ${f}_F0_LAYER${A}
`:d+=`
; WARNING: No valid pattern layers found for sprite ${_}
SPRITE_${_}_PATTERN:
    db 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0
`;const T=i.facingDirection;if(T==="left"||T==="right"){d+=`
; Auto-generated mirrored version for ${i.name} (facing: ${T})
`;const C={...i,name:`${i.name}_MIRRORED`,frames:i.frames.map(N=>({...N,data:Ut(N.data)}))},R=be(C,Se,_),L=`_${_}`,D=(C.name+L).replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();d+=R,A>=0&&(d+=`
; Unified pattern label for mirrored sprite ${_}
SPRITE_${_}_PATTERN_MIRRORED EQU ${D}_F0_LAYER${A}
`)}}),d+=`
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

`,a.length===0&&(d+=`; No sprite assets found - using placeholder pattern only 
SPRITE_0_PATTERN EQU SPRITE_PLACEHOLDER_PATTERN
`),d+=`
; ==================================================================
; SPRITE ANIMATION METADATA TABLES
; ==================================================================

; Table: Sprite Asset Frame Counts
; Format: db frame_count
sprite_asset_frame_count:
`,a.forEach((i,_)=>{var E;const u=((E=i.frames)==null?void 0:E.length)||1;d+=`    db ${u} ; Sprite ${_}: ${i.name}
`}),a.length===0&&(d+=`    db 1 ; Placeholder
`),d+=`
; Table: Sprite Asset Frame Pointer List Table
; Format: dw SPRITE_<id>_FRAME_PTRS
sprite_asset_frame_ptr_table:
`,a.forEach((i,_)=>{d+=`    dw SPRITE_${_}_FRAME_PTRS
`}),a.length===0&&(d+=`    dw SPRITE_0_FRAME_PTRS
`),a.forEach((i,_)=>{var T;const u=`_${_}`,f=(i.name+u).replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase(),b=Ae(i),A=((T=i.frames)==null?void 0:T.length)||1;d+=`
; Sprite ${_}: ${i.name} frame pointers
SPRITE_${_}_FRAME_PTRS:
`;for(let C=0;C<A;C++)b>=0?d+=`    dw ${f}_F${C}_LAYER${b}
`:d+=`    dw SPRITE_PLACEHOLDER_PATTERN
`}),a.length===0&&(d+=`
SPRITE_0_FRAME_PTRS:
    dw SPRITE_PLACEHOLDER_PATTERN
`),d+=` 
; ================================================================== 
; SPRITE CONFIGURATION TABLES 
; ================================================================== 

; Table: Entity Sprite Configuration 
; Format: db base_hw_sprite_index, layer_count 
entity_sprite_config: 
`,n.forEach(i=>{const _=i.baseHwSpriteIndex>=0?i.baseHwSpriteIndex:0;d+=`    db ${_}, ${i.layerCount} ; Entity ${i.entityIndex} (${i.spriteName})
`}),n.length<32&&(d+=`    ds ${(32-n.length)*2}, 0 ; Padding
`),d+=`
; Table: Entity -> Sprite Asset Index
; Format: db sprite_asset_index (#FF = none)
entity_sprite_asset_index:
`,n.forEach(i=>{const _=i.spriteAssetIndex>=0?i.spriteAssetIndex:255;d+=`    db #${_.toString(16).toUpperCase().padStart(2,"0")} ; Entity ${i.entityIndex} (${i.spriteName})
`}),n.length<32&&(d+=`    ds ${32-n.length}, #FF ; Padding
`),d+=` 
; Table: Hardware Sprite Layer Colors 
; Format: db color_index 
sprite_layer_colors: 
`;let h=0;n.forEach(i=>{i.layerCount>0&&(d+=`    ; Entity ${i.entityIndex} (${i.spriteName}) layers:
`,i.colors.forEach((_,u)=>{d+=`    db ${_} ; Layer ${u}
`,h+=1}))});const c=p-h;c>0&&(d+=`    ds ${c}, 0 ; Padding
`),d+=`
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
`;let m=!1;if(n.forEach(i=>{if(i.layerCount===0)return;const _=i.spriteAssetIndex<0?"SPRITE_PLACEHOLDER_PATTERN":`SPRITE_${i.spriteAssetIndex}_PATTERN`;d+=`    ; Entity ${i.entityIndex}: ${i.spriteName} (${i.layerCount} layers)
    ; Base HW Sprite: ${i.baseHwSpriteIndex}
    ld hl, ${_}
    ld de, SPRPAT + (${i.baseHwSpriteIndex} * 32)
    ld bc, ${i.layerCount*32} ; Load ${i.layerCount} layers (32 bytes each)
    call FAST_LDIRVM
`,m=!0}),!m)if(a.length===0)d+=`    ; No sprites to load
`;else{d+=`    ; No active entities detected, load all sprite assets sequentially
`;let i=0;a.forEach((_,u)=>{var A;const E=o(_).length||1,f=((A=_.frames)==null?void 0:A.length)||1,b=E*f*32;d+=`    ; Sprite Asset ${u}: ${_.name} (${f} frames, ${E} layers)
    ld hl, SPRITE_${u}_PATTERN
    ld de, SPRPAT + (${i} * 32)
    ld bc, ${b}
    call FAST_LDIRVM
`,i+=E*f})}return d+=`    ret

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
; OPTIMIZED: Uses faster increment method instead of ADD HL,DE
clear_all_sprites:
    ld hl, sprite_attributes
    ld b, ${p}
    ld a, SPRITE_INVISIBLE
.sprite_clear_loop:
    ld (hl), a      ; Set Y = SPRITE_INVISIBLE
    inc hl          ; Skip to X
    inc hl          ; Skip to Pattern
    inc hl          ; Skip to Color
    inc hl          ; Next sprite (4× INC HL = 24 cycles vs ADD HL,DE = 35 cycles)
    djnz .sprite_clear_loop
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
    call FAST_LDIRVM
    ret

; ==================================================================
; SPRITE CONSTANTS
; ==================================================================
SPRITE_INVISIBLE    EQU ${kt}

; ==================================================================
; RAM REQUIREMENTS
; ==================================================================
; sprite_attributes: ds ${p*4}
; active_sprite_count: db 0
`,d}function Bt(t){let a=`
; ==================================================================
; UPDATE ALL ENTITIES - Called by GameFlow (OPTIMIZED)
; ==================================================================
; Only calls component systems that are actually used in this project
; Unused systems are NOT called (saves Z80 cycles)
update_all_entities:
`;const e=[["Input","update_input_component","1. Input (player control)"],["Shoot","update_shoot_component","2. Shooting"],["Behavior","update_behavior_component","3. Behavior/AI"],["Jump","update_jump_component","4. Jump impulse"],["Movement","update_movement_component","5. Movement"],["Cursors","update_cursors_component","5b. Cursors movement"],["Gravity","update_gravity_component","6. Gravity"],["Position","update_position_component","7. Apply velocity"],["Collision","prepare_platform_detection","8a. Clear platform refs"],["Collision","update_collision_component","8b. Collision detection"],["Collision","update_platform_riding","8c. Platform riding"],["WallCollision","update_wall_collision_component","8d. Wall collision"],["Health","update_health_component","9. Health/Death"],["Damage","update_damage_component","10. Damage"],["Animation","update_animation_component","11. Animation"],["AutoDestroy","update_auto_destroy_component","12. Auto-destroy"],["Sprite","update_sprite_component","13. Sprite rendering"]];let l=0;const o=new Set;for(const[r,n,s]of e)(r==="Position"||r==="Sprite"||t.has(r))&&(o.has(n)||(o.add(n),a+=`    call ${n.padEnd(30)} ; ${s}
`,l++));return a+=`    ret
`,a+=`; Total systems called: ${l} (optimized from 15)

`,a}function Ht(){return`
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
    ld d, a                    ; OPTIMIZED: Save mask in D to avoid redundant memory read
    and COMP_MASK_POSITION     ; Check if has position component
    jr z, position_next_entity ; Skip if no position component

    ; Apply velocity to position (if has movement component)
    ld a, d                    ; OPTIMIZED: Reuse saved mask (saves 1 memory read)
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
`}function Vt(t){return`
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
`}function $t(){return`
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
    `}function Gt(t){const a=t.tiles&&t.tiles.length>0?t.tiles[0].width:16,e=t.tiles&&t.tiles.length>0?t.tiles[0].height:16,l=Math.floor(256/a),o=Math.floor(192/e),r=Number.isInteger(Math.log2(a))?Math.log2(a):4,n=Number.isInteger(Math.log2(e))?Math.log2(e):4,s=Array.from({length:r},(h,c)=>`    srl a; A = X / ${Math.pow(2,c+1)} `).join(`
`),p=Array.from({length:n},(h,c)=>`    srl a; A = Y / ${Math.pow(2,c+1)} `).join(`
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
    ret

    update_collision_component:
    ; Ground detection for entities with Collision or Gravity components
    ; Sets entity_on_ground flag based on Y position
    ld b, 32                      ; Loop through all entities
    ld hl, entity_comp_masks_hi   ; Check high byte for Gravity component
    ld de, entity_comp_masks      ; Low byte for Collision component
    ld c, 0                       ; Entity index

    collision_update_loop:
    ; Check if entity has Collision OR Gravity component
    ld a, (de)                    ; Get low byte (Collision is bit 3)
    and COMP_MASK_COLLISION
    jr nz, .has_collision_comp    ; Has Collision component

    ld a, (hl)                    ; Get high byte (Gravity is bit 1)
    and #02                       ; COMP_MASK_GRAVITY high byte
    jp z, collision_next_entity   ; Skip if no collision or gravity (JP for long jump)

.has_collision_comp:
    ; Get entity Y position
    push bc
    push hl
    push de

    ld hl, entity_y_pos
    ld e, c                       ; Entity index
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = Y position

    ; Ground detection: check if Y >= GROUND_LEVEL (176 for 16x16 sprites on 192px screen)
    ; GROUND_LEVEL = 192 - 16 = 176
    cp 176
    jr c, .not_on_ground          ; Y < 176, entity is in air

.on_ground:
    ; Clamp Y to ground level
    ld (hl), 176

    ; Set entity_on_ground flag (bit 0)
    ld hl, entity_on_ground
    ld e, c
    ld d, 0
    add hl, de
    set 0, (hl)                   ; Mark as on ground
    jr .ground_check_done

.not_on_ground:
    ; Not on ground tiles, but check platform_id and grace frames
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
    ld d, (hl)                    ; D = X position

    ld hl, entity_y_pos
    ld e, c
    ld d, 0
    add hl, de
    ld e, (hl)                    ; E = Y position

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
    inc hl                        ; Next entity high mask
    inc de                        ; Next entity low mask
    inc c                         ; Next entity index
    dec b                         ; Decrement loop counter
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
${t.tiles&&t.tiles.length>0?`; Project tile analysis: ${t.tiles.map(h=>`${h.width}x${h.height}`).join(", ")}
    ; Using first tile as reference: ${a}x${e}
    ; Convert X to tile column(divide by ${a})`:`; No tiles detected - using default 16x16
        ; Convert X to tile column(divide by 16)`}

${s}
    ld c, a; C = tile column

        ; Convert Y to tile row(divide by ${e})
    ld a, b
${p}
    ld b, a; B = tile row

        ; Check if position is within valid tile map
    ld a, c
    cp ${l}; Screen width in tiles
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
    ; Check if other entity is a platform (collision_layer & 8)
    ld hl, entity_collision_layer
    ld d, 0
    add hl, de              ; HL = &entity_collision_layer[other]
    ld a, (hl)              ; A = other entity collision layer
    and 8                   ; Check bit 3 (platform layer)
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

    get_behavior_tile:
    ; Get behavior value for tile at(B, C)
        ; Returns A = behavior value(0 = passable, 1 = solid, etc.)
        ; This would read from the behavior map data
        ; For now, return 0(all passable)
    ld a, 0
    ret
        `}function jt(){return`
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
            ; NOTE: input_state/prev_input_state are polled by interrupt task_update_input

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
    `}function zt(){return`
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
    `}function Wt(){return`
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
            ld hl, entity_comp_masks_hi; Check component masks (high byte)
            ld c, 0; Entity index

gravity_update_loop:
            ld a, (hl); Get entity component mask high byte
            and #02; Check COMP_MASK_GRAVITY(#0200) => bit 1 in high byte
            jr z, gravity_next_entity; Skip if no gravity component

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
            inc hl; Next entity mask (high byte)
            inc c; Next entity index
            dec b; Decrement loop counter
            jp nz, gravity_update_loop
    ret
    `}function Yt(){return`
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
    ld b, 32                      ; Loop all entities
    ld hl, entity_comp_masks_hi   ; Check for Health component
    ld c, 0                       ; Entity index

.health_update_loop:
    ld a, (hl)
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
    inc hl
    inc c
    djnz .health_update_loop
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
    `}function Qt(){return`
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
    ld b, 32                      ; Loop through all entities
    ld hl, entity_comp_masks_hi   ; Check high byte for Damage component
    ld c, 0                       ; Entity index

.damage_update_loop:
    ld a, (hl)
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
    inc hl                        ; Next entity high mask
    inc c                         ; Next entity index
    djnz .damage_update_loop
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
    `}function Xt(){return`
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
    ld b, 32                      ; Loop through all entities
    ld hl, entity_comp_masks_hi   ; Check high byte for Shoot component
    ld c, 0                       ; Entity index

.shoot_update_loop:
    ld a, (hl)
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
    inc hl                        ; Next entity high mask
    inc c                         ; Next entity index
    djnz .shoot_update_loop
    ret
    `}function Kt(){return`
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
    `}function Zt(){return`
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

            ; Default flags = playing + loop
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
            ld b, 32
            ld c, 0
            ld hl, entity_comp_masks

        .anim_loop:
            ld a, (hl)
            and COMP_MASK_ANIMATION
            jp z, .anim_next_entity

            ld a, (hl)
            and COMP_MASK_SPRITE
            jp z, .anim_next_entity

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
            ld l, a                    ; L = frameCount

            ; Advance frame (entity_anim_frame++)
            ld e, c
            ld d, 0
            ld hl, entity_anim_frame
            add hl, de
            ld a, (hl)
            inc a
            cp l
            jr c, .store_frame

            ; Overflow: loop?
            ld hl, entity_anim_flags
            add hl, de
            bit 1, (hl)                ; loop flag
            jr z, .clamp_last
            xor a                      ; frame = 0
            jr .store_frame

        .clamp_last:
            ld a, l
            dec a                      ; frame = frameCount-1

        .store_frame:
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
            inc hl
            inc c
            dec b
            jp nz, .anim_loop
    ret
    `}function Jt(){return`
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
            ; Uses: entity_jump_count, entity_on_ground, entity_gravity_vel
            ; Tracks per-entity fire edge in entity_on_ground bit 7 (latch)

            ld b, 32                      ; Loop all entities
            ld hl, entity_comp_masks_hi    ; High byte masks (Jump/Gravity)
            ld c, 0                       ; Entity index

        jump_update_loop:
            ld a, (hl)
            and #01                       ; Jump bit (COMP_MASK_JUMP=#0100 -> high byte bit0)
            jr z, jump_next_entity

            ; Require Input component
            push hl
            ld hl, entity_comp_masks
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            and COMP_MASK_INPUT
            pop hl
            jr z, jump_next_entity

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

        .jump_check:
            ; --- Jump trigger edge (fire pressed now, not pressed previous frame) ---
            ld a, (input_state)
            and #80
            jr z, jump_done_entity        ; not pressed
            ld a, (prev_input_state)
            and #80
            jr nz, jump_done_entity       ; already held last frame

            ; Check jump count < 2 OR grounded
            ld hl, entity_jump_count
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            cp 2
            jr c, .do_jump

            ld hl, entity_on_ground
            add hl, de
            bit 0, (hl)
            jr z, jump_done_entity

        .do_jump:
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
            ; Jump impulse default: -300 (8.8 fixed) => #FED4
            pop hl                        ; restore hl pointer to high mask for this entity
            push hl
            ld a, (hl)
            and #02                       ; Gravity bit (COMP_MASK_GRAVITY=#0200 -> high byte bit1)
            jr z, jump_done_entity

            ld hl, entity_gravity_vel
            ld e, c
            ld d, 0
            add hl, de
            add hl, de                    ; word index
            ld (hl), #D4                  ; low byte
            inc hl
            ld (hl), #FE                  ; high byte (negative)

jump_done_entity:
            pop hl
            pop bc

        jump_next_entity:
            inc hl                        ; Next entity high mask
            inc c                         ; Next entity index
            dec b
            jp nz, jump_update_loop
    ret
    `}function qt(){return`
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
    ld b, 32                      ; Loop all entities
    ld hl, entity_comp_masks_hi    ; High byte masks
        ld c, 0                       ; Entity index

    auto_destroy_loop:
        ld a, (hl)
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
        inc hl                        ; Next entity high mask
        inc c                         ; Next entity index
        dec b
        jp nz, auto_destroy_loop
        ret
    `}function ea(){return`
    ; ==================================================================
    ; CURSORS COMPONENT SYSTEM
    ; ==================================================================
    ; Handles menu cursor navigation (up/down/left/right)
    ; Entities with CURSORS component can be used as menu cursors
    ; Variables needed: entity_cursor_min, entity_cursor_max, entity_cursor_wrap

init_cursors_system:
    ; No initialization needed
    ret

; ------------------------------------------------------------------
; update_cursors_component
; Update cursor position based on joystick input
; For each cursor entity:
; - Read joystick input
; - Move cursor position based on input
; - Clamp or wrap cursor to min/max values
; ------------------------------------------------------------------
update_cursors_component:
    ld c, 0                       ; Entity index

.cursor_loop:
    ld a, c
    cp MAX_ENTITIES
    ret z                         ; Done

    ; Check if entity is active
    ld hl, entity_active
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    or a
    jr z, .cursor_next

    ; TODO: Check if entity has CURSORS component mask
    ; For now, we assume cursor entities are designated by type

    ; Read joystick/keyboard input for cursor control
    call GTSTCK                   ; A = stick direction (0-8)
    or a
    jr z, .cursor_next            ; No input

    ; Process input
    cp 1                          ; Up
    jr z, .cursor_up
    cp 2                          ; Up-Right
    jr z, .cursor_up
    cp 5                          ; Down
    jr z, .cursor_down
    cp 6                          ; Down-Left
    jr z, .cursor_down
    cp 3                          ; Right
    jr z, .cursor_right
    cp 7                          ; Left
    jr z, .cursor_left
    jr .cursor_next

.cursor_up:
    ; Move cursor up (decrease Y position)
    ld hl, entity_y_pos
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    sub 8                         ; Move up by 8 pixels
    ld (hl), a
    jr .cursor_next

.cursor_down:
    ; Move cursor down (increase Y position)
    ld hl, entity_y_pos
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    add a, 8                      ; Move down by 8 pixels
    ld (hl), a
    jr .cursor_next

.cursor_left:
    ; Move cursor left (decrease X position)
    ld hl, entity_x_pos
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    sub 8                         ; Move left by 8 pixels
    ld (hl), a
    jr .cursor_next

.cursor_right:
    ; Move cursor right (increase X position)
    ld hl, entity_x_pos
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    add a, 8                      ; Move right by 8 pixels
    ld (hl), a

.cursor_next:
    inc c
    jr .cursor_loop
    `}function ta(){return`
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
    `}function aa(){return`
    ; ==================================================================
    ; WALL COLLISION COMPONENT SYSTEM
    ; ==================================================================
    ; Prevents entities from moving through walls
    ; Checks tiles in movement direction and stops/slides entity

init_wallcollision_system:
    ret

; ------------------------------------------------------------------
; update_wallcollision_component
; Check wall collisions and prevent movement through solid tiles
; ------------------------------------------------------------------
update_wallcollision_component:
    ld c, 0                       ; Entity index

.wall_loop:
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
    jr z, .wall_next

    ; Get entity velocity X
    ld hl, entity_vel_x
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    or a
    jr z, .check_wall_y           ; No X velocity, check Y

    ; Check if moving right (positive velocity)
    bit 7, a
    jr z, .wall_check_right

.wall_check_left:
    ; Moving left - check left tile
    push bc
    ld e, c
    ld d, 0
    ld hl, entity_x_pos
    add hl, de
    ld d, (hl)                    ; D = X position
    ld a, d
    sub 8                         ; Check tile to the left

    ld hl, entity_y_pos
    ld e, c
    push de
    ld d, 0
    add hl, de
    ld e, (hl)                    ; E = Y position
    pop de

    ld d, a                       ; D = X - 8
    call get_tile_at_position     ; A = tile ID
    call get_tile_behavior        ; A = behavior
    bit 0, a                      ; TILE_SOLID?
    jr z, .wall_left_ok

    ; Wall detected - stop horizontal movement
    pop bc
    ld hl, entity_vel_x
    ld e, c
    ld d, 0
    add hl, de
    ld (hl), 0
    jr .check_wall_y

.wall_left_ok:
    pop bc
    jr .check_wall_y

.wall_check_right:
    ; Moving right - check right tile
    push bc
    ld e, c
    ld d, 0
    ld hl, entity_x_pos
    add hl, de
    ld d, (hl)
    ld a, d
    add a, 16                     ; Check tile to the right

    ld hl, entity_y_pos
    ld e, c
    push de
    ld d, 0
    add hl, de
    ld e, (hl)
    pop de

    ld d, a                       ; D = X + 16
    call get_tile_at_position
    call get_tile_behavior
    bit 0, a
    jr z, .wall_right_ok

    pop bc
    ld hl, entity_vel_x
    ld e, c
    ld d, 0
    add hl, de
    ld (hl), 0
    jr .check_wall_y

.wall_right_ok:
    pop bc

.check_wall_y:
    ; Check vertical walls (ceiling/floor)
    ; Similar logic for Y velocity
    ; Skipped for brevity - would follow same pattern

.wall_next:
    inc c
    jr .wall_loop
    `}function la(){return`
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

    ; TODO: Increment score or item counter
    ; ld hl, player_score
    ; inc (hl)

    ; TODO: Play collection sound

    pop bc

.collect_next:
    inc c
    jr .collect_loop
    `}function oa(){return` 
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
 
    ; Initialize component data based on mask 
            bit 0, b; Check COMP_MASK_POSITION (low byte)
            call nz, init_entity_position 
 
            bit 1, b; Check COMP_MASK_SPRITE (low byte)
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
    `}function na(t){const a=t.usedComponents;let e=`init_components: 
; Initialize component systems(OPTIMIZED - only used components) 
    ; Used: ${Array.from(a).join(", ")} 
 
; Initialize current screen ID(multi - screen support) 
        ld a, 0; Start at screen 0 
        ld (current_screen_id), a 
 
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
 
    `;return e+=`    ; Initialize position system (always)
    call init_position_system
    `,a.has("Sprite")&&(e+=`    ; Initialize sprite system
    call init_sprite_system
    `),a.has("Movement")&&(e+=`    ; Initialize movement system
    call init_movement_system
    `),a.has("Collision")&&(e+=`    ; Initialize collision system
    call init_collision_system
    `),a.has("Input")&&(e+=`    ; Initialize input system
    call init_input_system
    `),a.has("Behavior")&&(e+=`    ; Initialize behavior system
    call init_behavior_system
    `),a.has("Health")&&(e+=`    ; Initialize health system
    call init_health_system
    `),a.has("Animation")&&(e+=`    ; Initialize animation system
    call init_animation_system
    `),a.has("Jump")&&(e+=`    ; Initialize jump system
    call init_jump_system
    `),a.has("Gravity")&&(e+=`    ; Initialize gravity system
    call init_gravity_system
    `),e+=`    ; Initialize auto-destroy system
    call init_auto_destroy_system
    `,a.has("Cursors")&&(e+=`    ; Initialize cursors system (stub)
    call init_cursors_system
    `),a.has("StateMachine")&&(e+=`    ; Initialize state machine system (stub)
    call init_statemachine_system
    `),a.has("Carry")&&(e+=`    ; Initialize carry system (stub)
    call init_carry_system
    `),a.has("Damage")&&(e+=`    ; Initialize damage system
    call init_damage_system
    `),a.has("Shoot")&&(e+=`    ; Initialize shoot system
    call init_shoot_system
    `),e+=`    ; Initialize platform riding system
    call init_platform_riding_system
    `,a.has("WallCollision")&&(e+=`    ; Initialize wall collision system (stub)
    call init_wallcollision_system
    `),a.has("Collectible")&&(e+=`    ; Initialize collectible system (stub)
    call init_collectible_system
    `),e+=`
    ret
    `,e}function Re(t){var r,n,s,p,d,h,c,m,g,S,i,_;if(!t.entities||t.entities.length===0)return`; ==================================================================
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
        `;const a=ne(t),e=a.usedComponents;console.log("🎯 Generating optimized components.asm..."),console.log(`  - Active entities: ${a.activeEntities.length} `),console.log(`  - Used components: ${Array.from(e).join(", ")} `),console.log(`  - Filtered out: ${8-e.size} unused components`);let l=`; ==================================================================
; GAME COMPONENT SYSTEMS - MSX ECS ENGINE
    ; File: components.asm
        ; Description: Component systems based on Mideas React.js architecture
    ; Implements Position, Sprite, Movement, Collision, Input, and Behavior systems
    ; ==================================================================
;
; INTELLIGENT FILTERING ACTIVE:
;   Active entities: ${a.activeEntities.length}
;   Used components: ${Array.from(e).join(", ")}
;   Filtered out: ${8-e.size} unused component systems
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
ANIM_DEFAULT_SPEED           EQU 8

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


    ; ==================================================================
; CORE ECS SYSTEM FUNCTIONS
    ; ==================================================================

        ${na(a)}
`;l+=Ht();const o=t.sprites&&t.sprites.length>0;return e.has("Sprite")||o?l+=Vt():l+=`
    ; Sprite system filtered out(not used)
init_sprite_system:
    ret

update_sprite_component:
    ret

force_update_entity_sprite:
    ret
    `,e.has("Movement")?l+=$t():l+=`
    ; Movement system filtered out(not used)
init_movement_system:
    ret

update_movement_component:
    ret
    `,e.has("Collision")?l+=Gt(t):l+=`
    ; Collision system filtered out(not used)
init_collision_system:
    ret

update_collision_component:
    ret
    `,e.has("Input")?l+=jt():l+=`
    ; Input system filtered out(not used)
init_input_system:
    ret

update_input_component:
    ret
    `,e.has("Behavior")?l+=zt():l+=`
    ; Behavior system filtered out(not used)
init_behavior_system:
    ret

update_behavior_component:
    ret
    `,e.has("Health")?l+=Yt():l+=`
    ; Health system filtered out(not used)
init_health_system:
    ret

update_health_component:
    ret
    `,e.has("Animation")?l+=Zt():l+=`
    ; Animation system filtered out(not used)
init_animation_system:
    ret

update_animation_component:
    ret
    `,e.has("Jump")?l+=Jt():l+=`
    ; Jump system filtered out(not used)
init_jump_system:
    ret

update_jump_component:
    ret
    `,e.has("Gravity")?l+=Wt():l+=`
    ; Gravity system filtered out(not used)
init_gravity_system:
    ret

update_gravity_component:
    ret
    `,l+=qt(),e.has("Cursors")?l+=ea():l+=`
    ; Cursors system filtered out(not used)
init_cursors_system:
    ret

update_cursors_component:
    ret
    `,e.has("StateMachine")?l+=`
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
    `:l+=`
    ; StateMachine system filtered out(not used)
init_statemachine_system:
    ret

update_statemachine_component:
    ret
    `,e.has("Carry")?l+=ta():l+=`
    ; Carry system filtered out(not used)
init_carry_system:
    ret

update_carry_component:
    ret
    `,e.has("Damage")?l+=Qt():l+=`
    ; Damage system filtered out(not used)
init_damage_system:
    ret

update_damage_component:
    ret
    `,e.has("Shoot")?l+=Xt():l+=`
    ; Shoot system filtered out(not used)
init_shoot_system:
    ret

update_shoot_component:
    ret
    `,l+=Kt(),e.has("WallCollision")?l+=aa():l+=`
    ; WallCollision system filtered out(not used)
init_wallcollision_system:
    ret

update_wallcollision_component:
    ret
    `,e.has("Collectible")?l+=la():l+=`
    ; Collectible system filtered out(not used)
init_collectible_system:
    ret

update_collectible_component:
    ret
    `,l+=oa(),l+=Bt(e),l+=`
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

`,l+=`
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
    ; Convert X pixel to tile column (divide by TILE_WIDTH)
    ld a, d
    ${t.tiles&&((r=t.tiles[0])==null?void 0:r.width)===8?`
    ; Tile width is 8 pixels - simple shift
    srl a
    srl a
    srl a`:t.tiles&&((n=t.tiles[0])==null?void 0:n.width)===16?`
    ; Tile width is 16 pixels - shift right 4 times
    srl a
    srl a
    srl a
    srl a`:`
    ; Tile width is ${((p=(s=t.tiles)==null?void 0:s[0])==null?void 0:p.width)||8} pixels - divide
    ld c, ${((h=(d=t.tiles)==null?void 0:d[0])==null?void 0:h.width)||8}
    call div_a_by_c`}
    ld b, a                       ; B = tile column

    ; Convert Y pixel to tile row (divide by TILE_HEIGHT)
    ld a, e
    ${t.tiles&&((c=t.tiles[0])==null?void 0:c.height)===8?`
    ; Tile height is 8 pixels - simple shift
    srl a
    srl a
    srl a`:t.tiles&&((m=t.tiles[0])==null?void 0:m.height)===16?`
    ; Tile height is 16 pixels - shift right 4 times
    srl a
    srl a
    srl a
    srl a`:`
    ; Tile height is ${((S=(g=t.tiles)==null?void 0:g[0])==null?void 0:S.height)||8} pixels - divide
    ld c, ${((_=(i=t.tiles)==null?void 0:i[0])==null?void 0:_.height)||8}
    call div_a_by_c`}
    ld c, a                       ; C = tile row

    ; Check bounds (assume 32x24 tile screen for now)
    ld a, b
    cp 32
    jr nc, .out_of_bounds
    ld a, c
    cp 24
    jr nc, .out_of_bounds

    ; Calculate tile index: index = row * 32 + column
    ld a, c
    add a, a                      ; A = row * 2
    add a, a                      ; A = row * 4
    add a, a                      ; A = row * 8
    add a, a                      ; A = row * 16
    add a, a                      ; A = row * 32
    add a, b                      ; A = row * 32 + column

    ; Read actual tile from current screen layout
    ld e, a
    ld d, 0                       ; DE = tile index
    ld hl, (current_screen_layout) ; HL = pointer to screen layout data
    add hl, de                    ; HL = pointer to tile at position
    ld a, (hl)                    ; A = tile ID from screen map

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
; Maps tile IDs (0-255) to behavior flags
; This table is generated based on project tile definitions
; ------------------------------------------------------------------
tile_behavior_table:
    ; Index 0-127: Default behaviors (can be customized per project)
    db TILE_PASSABLE              ; 0: Empty tile
    ${Array(127).fill(0).map((u,E)=>`db TILE_PASSABLE              ; ${E+1}: Passable`).join(`
    `)}

    ; Index 128-255: Project-specific tiles
    ; These are assigned based on analysis.tiles order and their properties
    ; For now, default all to SOLID (will be refined in future)
    ${Array(128).fill(0).map((u,E)=>`db TILE_SOLID                 ; ${128+E}: Solid tile`).join(`
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

`,l+=`
    ; ==================================================================
; END OF COMPONENT SYSTEMS
    ; ==================================================================
        `,l}function ia(t){var s,p,d,h;const a=(c,m)=>{if(typeof c=="boolean")return c;if(typeof c=="number")return c!==0;if(typeof c=="string"){const g=c.trim().toLowerCase();if(g==="true")return!0;if(g==="false")return!1;const S=parseInt(g,10);if(!Number.isNaN(S))return S!==0}return m},e=(c,m)=>{const g=typeof c=="number"?c:parseInt(String(c??""),10);return Number.isNaN(g)?m:Math.max(0,Math.min(255,g|0))},o=ne(t).activeEntities,r=2;console.log("🎯 Generating optimized entities.asm..."),console.log(`  - Total entity templates in JSON: ${((s=t.templates)==null?void 0:s.length)||0}`),console.log(`  - Actually instantiated entities: ${o.length}`),console.log(`  - Filtered out: ${(((p=t.templates)==null?void 0:p.length)||0)-o.length} unused templates`);let n=`; ==================================================================
; GAME ENTITIES
; File: entities.asm
; Description: Game entity definitions and behavior
; ==================================================================
;
; INTELLIGENT FILTERING ACTIVE:
;   Entity templates in project: ${((d=t.templates)==null?void 0:d.length)||0}
;   Actually instantiated: ${o.length}
;   Filtered out: ${(((h=t.templates)==null?void 0:h.length)||0)-o.length} unused templates
;
; ==================================================================

`;return o.length>0?(n+=`; ==================================================================
; ENTITY DEFINITIONS
; ==================================================================

`,o.forEach((c,m)=>{var _;const g=c.name.toUpperCase().replace(/[^A-Z0-9]/g,"_"),S=(_=t.templates)==null?void 0:_.find(u=>u.id===c.entityTemplateId),i=ge(c,S,t);n+=`; Entity: ${c.name} (instance from template: ${c.entityTemplateId})
ENTITY_${g}_ID EQU ${m}
ENTITY_${g}_COMP_MASK EQU #${i.toString(16).toUpperCase().padStart(2,"0")}  ; Component mask: ${i.toString(2).padStart(8,"0")}b
`,c.entityTemplateId&&(n+=`ENTITY_${g}_TEMPLATE EQU "${c.entityTemplateId}"
`),c.position&&(n+=`ENTITY_${g}_X EQU ${c.position.x}
ENTITY_${g}_Y EQU ${c.position.y}
`),n+=`
`}),n+=`; ==================================================================
; ENTITY MANAGEMENT FUNCTIONS
; ==================================================================

init_entities:
    ; Initialize all active game entities (${o.length} entities)
    
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
    
`,o.length>0?o.forEach(c=>{const m=c.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");n+=`    call init_${m.toLowerCase()}
`}):n+=`    ; No entities to initialize
`,n+=`    ret

update_entities:
    ; Update all active entities (${o.length} entities)
`,o.length>0?o.forEach(c=>{const m=c.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");n+=`    call update_${m.toLowerCase()}
`}):n+=`    ; No entities to update
`,n+=`    ret

`,o.forEach((c,m)=>{var J,V,he,ue,me,Ee;const g=c.name.toUpperCase().replace(/[^A-Z0-9]/g,"_"),S=(J=t.templates)==null?void 0:J.find(k=>k.id===c.entityTemplateId),i=ge(c,S,t),_=(i&r)!==0,u=((V=c.position)==null?void 0:V.x)||100,E=((he=c.position)==null?void 0:he.y)||100,f=8,b=8,A=u*f,T=E*b,C=Math.min(A,240),R=Math.min(T,191);(A!==C||T!==R)&&console.warn(`Entity ${c.name} position clamped: (${A},${T}) → (${C},${R})`);const L=[];i&1&&L.push("Position"),i&2&&L.push("Sprite"),i&4&&L.push("Movement"),i&8&&L.push("Collision"),i&16&&L.push("Input"),i&32&&L.push("Behavior"),i&64&&L.push("Health"),i&128&&L.push("Animation"),i&256&&L.push("Jump"),i&512&&L.push("Gravity");let y=15;if(i&16){const k=S==null?void 0:S.components.find(B=>B.definitionId==="comp_cursors"||B.definitionId==="comp_input"||B.definitionId==="comp_player_input");if(k){const B=k.defaultValues||{},Q=((ue=c.componentOverrides)==null?void 0:ue.comp_cursors)||{},U={...B,...Q};y=0,U.allowUp!==!1&&(y|=1),U.allowDown!==!1&&(y|=2),U.allowLeft!==!1&&(y|=4),U.allowRight!==!1&&(y|=8)}}const D=[];y&1&&D.push("UP"),y&2&&D.push("DOWN"),y&4&&D.push("LEFT"),y&8&&D.push("RIGHT");const N=D.length===4?"All directions":D.join("+");let w="";if(i&128){const k=(me=S==null?void 0:S.components)==null?void 0:me.find(fe=>fe.definitionId==="comp_animation"||fe.definitionName==="Animation"),B=(k==null?void 0:k.defaultValues)||(k==null?void 0:k.values)||{},Q=((Ee=c.componentOverrides)==null?void 0:Ee.comp_animation)||{},U={...B,...Q},ve=e(U.currentFrameIndex??U.currentFrame??0,0),Oe=Math.max(1,e(U.animationSpeed??6,6)),we=a(U.loops,!0),Pe=a(U.isPlaying,!0),Me=a(U.animateOnlyWhenMoving,!1),xe=(Pe?1:0)|(we?2:0)|(Me?4:0);w=`
    ; Initialize Animation component
    ld hl, entity_anim_frame
    add hl, de
    ld (hl), #${ve.toString(16).toUpperCase().padStart(2,"0")}           ; currentFrameIndex

    ld hl, entity_anim_tick
    add hl, de
    ld (hl), 0                ; tick counter

    ld hl, entity_anim_speed
    add hl, de
    ld (hl), #${Oe.toString(16).toUpperCase().padStart(2,"0")}           ; animationSpeed

    ld hl, entity_anim_flags
    add hl, de
    ld (hl), #${xe.toString(16).toUpperCase().padStart(2,"0")}           ; flags (playing/loop/onlyWhenMoving)
`}n+=`init_${g.toLowerCase()}:
    ; Initialize ${c.name} at real position from JSON
    ; JSON position: (${u}, ${E}) tiles = (${C}, ${R}) pixels
    ; Template: ${c.entityTemplateId}
    ; Components: ${L.join(", ")}
    ; Direction mask: #${y.toString(16).toUpperCase().padStart(2,"0")} (${y.toString(2).padStart(4,"0")}b) = ${N}

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ; Mask is 16-bit: B=low byte, C=high byte
    ld a, ${m}             ; Entity ID
    ld b, #${(i&255).toString(16).toUpperCase().padStart(2,"0")}              ; Mask low byte
    ld c, #${(i>>8&255).toString(16).toUpperCase().padStart(2,"0")}              ; Mask high byte
    call create_entity         ; Create with actual components from template

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, ${m}             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), ${C}         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), ${R}         ; Set real Y position from JSON

    ; Set entity screen ID (for multi-screen support)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), ${(()=>{let k=0;return t.screenMaps&&t.screenMaps.forEach((B,Q)=>{B.layers.entities.some(U=>U.id===c.id)&&(k=Q)}),k})()}                 ; Screen ID (calculated from project data)

${w}
${_?`    ; Set sprite pattern and color (renderable entity)
    ld hl, sprite_pattern
    add hl, de
    ld (hl), ${m*4}          ; Use entity index * 4 for 16x16 sprites

    ld hl, sprite_color
    add hl, de
    ld (hl), ${m%14+2}                ; Distinct color for debugging
`:`    ; Anchor/reference entity - no sprite allocation needed
`}

    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #${y.toString(16).toUpperCase().padStart(2,"0")}            ; Direction restrictions: ${N}

${_?`    ; Force update sprite attributes immediately

    ; Force update sprite attributes (using correct multi-layer config)
    ld c, ${m}             ; Entity Index
    call force_update_entity_sprite


`:`    ; No sprite to show for this entity
`}
    ret

update_${g.toLowerCase()}:
    ; Update ${c.name} logic with real behavior
    ; Check if entity has input component (player entities)
    ld a, ${m}
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

`,n+=`; ==================================================================
; END OF ENTITIES
; ==================================================================
`,n}function ra(t){if(!t.screenMaps||t.screenMaps.length===0)return`; ==================================================================
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

`,t.screenMaps.forEach((e,l)=>{const o=e.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");a+=`SCREEN_${o}_${l}_ID EQU ${l}
`}),a+=`
; ==================================================================
; SCREEN MAP DATA
; ==================================================================

`,t.screenMaps.forEach(e=>{var l,o;if(e.layers&&e.layers.background){const r=[];if(t.tiles&&t.tiles.length>0){const i={...He[1],assignedTiles:{},charsetRangeStart:128,charsetRangeEnd:255,enabled:!0};let _=128;t.tiles.forEach(E=>{if(E&&E.id){const f=Math.ceil(E.width/8),b=Math.ceil(E.height/8);i.assignedTiles[E.id]={charCode:_,assignedAt:Date.now()},_+=f*b}});const u={id:"global_auto_bank",name:"Global Auto Bank",banks:[i,i,i]};r.push(u),console.log(`✅ Created GLOBAL tile bank with ${Object.keys(i.assignedTiles).length} assigned tiles`)}const n=[];e.activeAreaX,e.activeAreaY,e.activeAreaWidth??e.width,e.activeAreaHeight??e.height;const s=32,p=24;for(let S=0;S<p;S++)for(let i=0;i<s;i++){const _=(l=e.layers.background[S])==null?void 0:l[i];if(!_||!_.tileId)n.push(0);else{let u=0;const E=(o=t.tiles)==null?void 0:o.find(b=>b.id===_.tileId),f=r.length>0?r[0].banks:void 0;if(f&&E){let b=!1;for(const A of f)if((A.enabled??!0)&&A.assignedTiles[_.tileId]){const T=A.assignedTiles[_.tileId].charCode,C=Math.ceil(E.width/z),R=_.subTileX||0,L=_.subTileY||0;if(u=T+L*C+R,u>=A.charsetRangeStart&&u<=A.charsetRangeEnd){b=!0;break}else u=0}b||(u=0)}else u=0;n.push(u)}}const d=n.filter(S=>S!==255).length,h=new Set(n);console.log(`📊 Generated ${n.length} bytes: ${d} non-FF (${(d/n.length*100).toFixed(1)}%)`),console.log(`🎯 Unique byte values: [${Array.from(h).sort((S,i)=>S-i).join(", ")}]`);const c=[];c.push('; Generated using exact Screen Editor "Download ASM" logic'),c.push("; Byte values represent actual character codes in VRAM");const m=`${e.name}_${t.screenMaps.indexOf(e)}`,g=Ke(m,s,p,n,c,"hex");if(a+=g,e.layers.collision&&t.tiles){const S=e.layers.collision,i=[];S.forEach(u=>{u.forEach(E=>{var f;if(E.tileId){const b=t.tiles.find(T=>T.id===E.tileId),A=((f=b==null?void 0:b.logicalProperties)==null?void 0:f.mapId)||0;i.push(A)}else i.push(0)})});const _=Ze(m,e.width,e.height,i,"hex");a+=`
${_}`}}else{const r=t.screenMaps.indexOf(e),n=e.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");a+=`SCREEN_${n}_${r}_LAYOUT:
    ; Screen data for ${e.name}
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

load_screen:

    ; Load screen (A = screen ID)
    ; TODO: Implement screen loading logic
    ret

`,t.screenMaps.forEach((e,l)=>{const o=e.name.toUpperCase().replace(/[^A-Z0-9]/g,"_"),r=e.backgroundColor!==void 0?e.backgroundColor:1,n=e.borderColor!==void 0?e.borderColor:1,s=e.id?`_${e.id.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";a+=`load_screen_${o.toLowerCase()}${s.toLowerCase()}:
    ; Load ${e.name} screen (fast direct port access)
    ; Set VDP colors FIRST (before loading screen data)
    ld a, ${r}           ; Background color
    ld b, ${n}       ; Border color
    call set_screen_colors
    ; Initialize character 0 (empty cells) with background color
    ld a, ${r}           ; Background color for char 0
    call init_char0_color
    ; Now load screen layout
    ld hl, SCREEN_${o}_${l}_LAYOUT
    ld de, NAMETBL
    ld bc, SCREEN_${o}_${l}_SIZE
    call FAST_LDIRVM           ; Fast VRAM write (direct port access)
    ret

`})):a+=`; ==================================================================
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
`,a}function sa(t){var c,m,g,S;const a=(m=(c=t.gameFlow)==null?void 0:c.nodes)==null?void 0:m.some(i=>i.type==="SubMenu"),e=(g=t.screenMaps)==null?void 0:g.some(i=>{var _,u;return((_=i.layers)==null?void 0:_.text)||((u=i.textElements)==null?void 0:u.length)>0}),l=(S=t.screenMaps)==null?void 0:S.some(i=>{var _;return((_=i.hudConfiguration)==null?void 0:_.elements)&&i.hudConfiguration.elements.length>0});if(!a&&!e&&!l)return`; ==================================================================
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
`;const o=new Map,r=new Map,n=[{code:32,pattern:[0,0,0,0,0,0,0,0]},{code:43,pattern:[0,16,16,124,16,16,0,0]},{code:45,pattern:[0,0,0,126,0,0,0,0]},{code:124,pattern:[24,24,24,24,24,24,24,24]}];if(n.forEach(i=>{o.set(i.code,i.pattern),r.set(i.code,[240,240,240,240,240,240,240,240])}),t.fonts&&t.fonts.length>0){const i=t.fonts[0],_=i.data.fontData||{},u=i.data.fontColorAttributes||{},E=f=>{if(f.startsWith("rgba(0,0,0,0)"))return 0;const b=f.toUpperCase();return{"RGBA(0,0,0,0)":0,"#000000":1,"#21C842":2,"#5EDC78":3,"#5455ED":4,"#7D76FC":5,"#D4524D":6,"#42EBF5":7,"#FC5554":8,"#FF7978":9,"#D4C154":10,"#E6CE80":11,"#21B03B":12,"#C95BBA":13,"#CCCCCC":14,"#FFFFFF":15}[b]??15};Object.keys(_).forEach(f=>{const b=parseInt(f,10),A=_[b];if(Array.isArray(A)&&A.length===8)if(o.set(b,A),u[b]&&Array.isArray(u[b])){const T=u[b],C=[];for(let R=0;R<8;R++)if(T[R]&&typeof T[R]=="object"){const L=T[R].fg,y=T[R].bg,D=E(L),N=E(y);C.push(D<<4|N)}else C.push(240);r.set(b,C)}else r.set(b,[240,240,240,240,240,240,240,240])})}else{for(let i=48;i<=57;i++)o.set(i,[62,127,115,115,115,127,62,0]);for(let i=65;i<=90;i++)o.set(i,[62,127,99,127,127,99,99,0]);n.forEach(i=>o.set(i.code,i.pattern))}let s=`FONT_PATTERN_DATA:
`,p=`FONT_COLOR_DATA:
`,d=`FONT_CHAR_INDEX:
    DB `;const h=Array.from(o.keys()).filter(i=>i<128).sort((i,_)=>i-_);return h.forEach((i,_)=>{const u=o.get(i),E=r.get(i)||[240,240,240,240,240,240,240,240];s+=`    ; Char ${i} ('${String.fromCharCode(i)}')
`,s+=`    DB ${u.map(f=>"#"+f.toString(16).padStart(2,"0").toUpperCase()).join(", ")}
`,p+=`    ; Char ${i}
`,p+=`    DB ${E.map(f=>"#"+f.toString(16).padStart(2,"0").toUpperCase()).join(", ")}
`,d+=`${i}${_<h.length-1?", ":""}`}),d+=`
FONT_CHAR_COUNT EQU ${h.length}
`,`; ==================================================================
; MSX FONT DATA FOR SCREEN 2 TEXT
; File: font.asm
; Description: Font pattern data generated from project assets
; ==================================================================

; ==================================================================
; FONT PATTERN DATA
; ==================================================================

${s}

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
    call FAST_LDIRVM              ; Copy from HL(RAM) to DE(VRAM)

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
`}function da(t){var o;const a=[],e=new Map;if((o=t.screenMaps)==null||o.forEach(r=>{var s;const n=((s=r.hudConfiguration)==null?void 0:s.elements)||[];n.length>0&&(a.push(...n),e.set(r.id,n))}),a.length===0)return`; ==================================================================
; HUD SYSTEM (EMPTY - No HUD elements defined)
; ==================================================================
render_hud:
    ret
`;let l=`; ==================================================================
; HUD SYSTEM - Screen 2 Text Rendering
; ==================================================================
; Total HUD Elements: ${a.length}
; Screens with HUD: ${e.size}
;
; HUD Elements use TileBank fonts to render text in Screen 2 mode
; Each element can be positioned anywhere on screen (256x192 pixels)
; ==================================================================

`;return l+=ca(a),l+=pa(),l+=_a(),l}function ca(t){let a=`; ------------------------------------------------------------------
; HUD DATA STRUCTURES
; ------------------------------------------------------------------

`;return a+=`HUD_ELEMENT_COUNT   EQU ${t.length}

`,a+=`; HUD Element Data Table
`,a+=`; Format: [Type:1][X:1][Y:1][Width:1][Height:1][Flags:1][TextPtr:2][Visible:1]
`,a+=`hud_element_data:
`,t.forEach((e,l)=>{const o=ha(e.type),r=e.position.x,n=e.position.y,s=e.visible?1:0,p=`hud_text_${l}`;let d=0,h=1,c=0;const m=e.details||{};(m.border||m.borderColor||m.overallBorderColor)&&(c|=1),e.text?d=e.text.length:m.width?d=Math.ceil(m.width/8):d=10,a+=`    DB ${o}, ${r}, ${n}    ; Element ${l}: ${e.type} at (${r},${n})
`,a+=`    DB ${d}, ${h}, ${c} ; W, H, Flags
`,a+=`    DW ${p}             ; Text pointer
`,a+=`    DB ${s}                ; Visible
`}),a+=`
`,a+=`; HUD Text Strings
`,t.forEach((e,l)=>{const o=e.text||e.name||"",r=`hud_text_${l}`;a+=`${r}:
`,a+=`    DB "${o}", 0
`}),a+=`
`,a}function pa(t){return`; ------------------------------------------------------------------
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

`}function _a(){return`; ------------------------------------------------------------------
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

`}function ha(t){return{[M.Score]:1,[M.HighScore]:2,[M.Lives]:3,[M.EnergyBar]:4,[M.ItemDisplay]:5,[M.SceneName]:6,[M.MiniMap]:7,[M.CoinCounter]:8,[M.BossEnergyBar]:9,[M.PhaseIndicator]:10,[M.AttackAlert]:11,[M.TextBox]:12,[M.NumericField]:13,[M.CustomCounter]:14}[t]||0}function de(t){return t.toLowerCase().replace(/[^a-z0-9]/g,"_")}function ce(t){return t.toUpperCase().replace(/[^A-Z0-9]/g,"_")}function ua(t){const a=t.worldmaps||[];if(a.length===0)return`; ==================================================================
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
`;let e=`; ==================================================================
; WORLD MAPS
; File: worlds.asm
; Description: World map structures and screen loading functions
; Generated by Mideas MSX Generator
; ==================================================================

`;return e+=`; ==================================================================
; WORLD MAP CONSTANTS
; ==================================================================

`,a.forEach((l,o)=>{var s;const r=ce(l.name||`world_${o}`),n=l.id||`world_${o}`;e+=`; World: ${l.name||"Unnamed"} (${n})
WORLD_${r}_ID EQU ${o}
WORLD_${r}_SCREEN_COUNT EQU ${((s=l.nodes)==null?void 0:s.length)||0}
`,l.nodes&&l.nodes.length>0&&l.nodes.forEach((p,d)=>{const h=ce(p.name||`screen_${d}`);e+=`WORLD_${r}_SCREEN_${h}_ID EQU ${d}
`}),e+=`
`}),e+=`; ==================================================================
; WORLD LOADING FUNCTIONS
; ==================================================================

`,a.forEach(l=>{var m,g;de(l.name||"unnamed");const o=l.id||"unknown",r=l.startScreenNodeId,n=l.nodes||[];if(e+=`; ------------------------------------------------------------------
; Load World: ${l.name||"Unnamed"}
; World ID: ${o}
; Screens: ${n.length}
; Start Screen Node: ${r||"none"}
; ------------------------------------------------------------------
load_world_${de(o)}:
`,n.length===0){e+=`    ; No screens in this world
    ret

`;return}const p=(n.find(S=>S.id===r)||n[0]).screenAssetId;if(!p){e+=`    ; No valid start screen found
    ret

`;return}const d=(m=t.screens)==null?void 0:m.find(S=>S.id===p),h=((g=d==null?void 0:d.name)==null?void 0:g.toUpperCase().replace(/[^A-Z0-9]/g,"_"))||"UNKNOWN",c=p?`_${p.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";e+=`    ; Load start screen: ${(d==null?void 0:d.name)||"unknown"} (${p})
    call load_screen_${h.toLowerCase()}${c.toLowerCase()}

    ; Initialize world state
    ld a, WORLD_${ce(l.name||"unnamed")}_ID
    ld (current_world_id), a

    ld a, ${n.findIndex(S=>S.id===r)}
    ld (current_screen_index), a

    ret

`}),e+=`; ==================================================================
; SCREEN TRANSITION FUNCTIONS
; ==================================================================

`,a.forEach(l=>{const o=l.id||"unknown",r=l.nodes||[],n=l.connections||[];if(n.length===0){e+=`; World ${l.name||"Unnamed"} has no screen connections

`;return}e+=`; ------------------------------------------------------------------
; World: ${l.name||"Unnamed"}
; Connections: ${n.length}
; ------------------------------------------------------------------

`,n.forEach((s,p)=>{var i,_;const d=r.find(u=>u.id===s.from||s.fromNodeId),h=r.find(u=>u.id===s.to||s.toNodeId);if(!d||!h){e+=`; Invalid connection ${p}: missing nodes

`;return}d.screenAssetId;const c=h.screenAssetId,m=(i=t.screens)==null?void 0:i.find(u=>u.id===c),g=((_=m==null?void 0:m.name)==null?void 0:_.toUpperCase().replace(/[^A-Z0-9]/g,"_"))||"UNKNOWN",S=c?`_${c.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";e+=`; Transition: ${d.name||"screen"} -> ${h.name||"screen"}
transition_${de(o)}_${p}:
    call load_screen_${g.toLowerCase()}${S.toLowerCase()}
    ret

`})}),e+=`; ==================================================================
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
`,e}function q(t){t=t.replace("#","");const a=parseInt(t.substring(0,2),16),e=parseInt(t.substring(2,4),16),l=parseInt(t.substring(4,6),16);if(a<50&&e<50&&l<50)return 1;if(a>200&&e>200&&l>200)return 15;if(a>200&&e<100&&l<100)return 8;if(a<100&&e>200&&l<100)return 3;if(a<100&&e<100&&l>200)return 5;if(a>200&&e>200&&l<100)return 10;if(a>150&&e<100&&l>150)return 13;if(a<100&&e>150&&l>150)return 7;const o=(a+e+l)/3;return o<64?1:o<128?14:15}function ma(t){const a=t.gameFlow&&t.gameFlow.nodes&&t.gameFlow.nodes.some(l=>l.type==="SubMenu");if(!a)return`; ==================================================================
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
`;let e=`; ==================================================================
; GAME MENUS
; File: menus.asm
; Description: Menu systems and user interface with custom font support
; ==================================================================

`;return a?(e+=`; ==================================================================
; MENU CONSTANTS
; ==================================================================

`,t.gameFlow.nodes.filter(n=>n.type==="SubMenu").forEach((n,s)=>{const p=(n.title||n.id).toUpperCase().replace(/[^A-Z0-9]/g,"_");e+=`MENU_${p}_ID EQU ${s}
`}),e+=`
; ==================================================================
; MENU FUNCTIONS
; ==================================================================

`,t.gameFlow.nodes.filter(n=>n.type==="SubMenu").forEach(n=>{var m,g,S,i;(n.title||n.id).toUpperCase().replace(/[^A-Z0-9]/g,"_");const s=n.id.replace(/[^a-zA-Z0-9]/g,"_"),p=((g=(m=n.appearance)==null?void 0:m.colors)==null?void 0:g.background)||"#000000",d=((i=(S=n.appearance)==null?void 0:S.colors)==null?void 0:i.border)||"#FFFFFF",h=q(p),c=q(d);e+=`show_menu_${s}:
    ; Display ${n.title||n.id} menu
    ; Set background color using VDP
    ld b, ${h*16+c} ; Background (high) | Border (low)
    ld c, 7                     ; VDP Register 7
    call FAST_WRTVDP

    ; Set system color variables
    ld a, ${c}
    ld (BDRCLR), a

    ld a, ${h}
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
    db "${(n.title||"Menu").replace(/"/g,'\\"')}", 0

handle_menu_${s}:
    ; Handle ${n.title||n.id} menu input
    call GTSTCK
    ; TODO: Implement input handling
    ret

`}),t.gameFlow.nodes.filter(n=>n.type==="Text").forEach(n=>{var m,g,S,i;const s=n.id.replace(/[^a-zA-Z0-9]/g,"_"),p=((g=(m=n.appearance)==null?void 0:m.colors)==null?void 0:g.background)||"#000000",d=((i=(S=n.appearance)==null?void 0:S.colors)==null?void 0:i.border)||"#FFFFFF",h=q(p),c=q(d);e+=`show_text_${s}:
    ; Display ${n.title||n.id} text
    ; Set background color using VDP
    ld b, ${h*16+c} ; Background (high) | Border (low)
    ld c, 7                     ; VDP Register 7
    call FAST_WRTVDP

    ; Set system color variables
    ld a, ${c}
    ld (BDRCLR), a

    ld a, ${h}
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
    db "${(n.title||"Text").replace(/"/g,'\\"')}", 0

text_${s}_message:
    db "${(n.message||"").replace(/"/g,'\\"')}", 0

`})):e+=`; ==================================================================
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

    ; FAST_WRTVRM expects: A = data, HL = VRAM address
    push hl         ; Save string pointer
    push de         ; Save VRAM address
    pop hl          ; HL = VRAM address (for FAST_WRTVRM)
    call FAST_WRTVRM ; Write character to VRAM (fast)
    pop hl          ; Restore string pointer

    inc hl          ; Next character in string
    inc de          ; Next VRAM position
    jp print_loop

`,e+=`; ==================================================================
; END OF MENUS
; ==================================================================
`,e}const Ea={[I.SET_POSITION]:1,[I.MOVE_BY]:2,[I.SET_VELOCITY]:3,[I.APPLY_FORCE]:4,[I.CHANGE_SPRITE]:5,[I.PLAY_ANIMATION]:6,[I.SET_ANIMATION_SPEED]:7,[I.TOGGLE_ANIMATION]:8,[I.PLAY_SOUND]:9,[I.PLAY_MUSIC]:10,[I.MUTE_MUSIC]:11,[I.STOP_MUSIC]:12,[I.SET_VARIABLE]:13,[I.INCREMENT_VARIABLE]:14,[I.DECREMENT_VARIABLE]:15,[I.SET_COMPONENT_PROPERTY]:16,[I.WAIT]:17,[I.GOTO_STATE]:18,[I.DESTROY_ENTITY]:19,[I.SPAWN_ENTITY]:20,[I.GET_RANDOM_ENTITY_POSITION]:21,[I.CHANGE_GAME_FLOW_NODE]:22,[I.DECREASE_LIVES]:23,[I.INCREASE_LIVES]:24,[I.RESPAWN_PLAYER]:25,[I.BREAK_TILE]:26,[I.REPLACE_TILE]:27,[I.RND]:28,[I.POINT_AT]:29,[I.ADD_VARIABLES]:30,[I.SUBTRACT_VARIABLES]:31,[I.MULTIPLY_VARIABLES]:32,[I.DIVIDE_VARIABLES]:33,[I.MODULO_VARIABLES]:34,[I.ASSIGN_VARIABLE]:35,END:255},fa={[v.AND]:1,[v.OR]:2,[v.NOT]:3,[v.KEY_PRESSED]:4,[v.KEY_RELEASED]:5,[v.TIME_OUT]:6,[v.CAN_MOVE_DIRECTION]:7,[v.HAS_COLLISION]:8,[v.PATH_CLEAR]:9,[v.ON_WALL_COLLISION]:10,[v.HAS_DEADLY_TILE_COLLISION]:11,[v.ANIMATION_COMPLETE]:12,[v.KEY_AND_MOVEMENT]:13,[v.VARIABLE_COMPARE]:14},ba={x:0,y:1,vx:2,vy:3,isOnGround:4,health:5},Te={"==":0,"!=":1,">":2,"<":3,">=":4,"<=":5},ya={up:1,down:5,left:7,right:3,fire:9};function ga(t){const a={...ba};return t&&t.length>0&&t.forEach((e,l)=>{const o=6+l;a[e.name]=o,e.asmName&&(a[e.asmName]=o)}),a}const Sa=`
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
    `,Aa=`
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


Action_ChangeSprite:
    ; Params: Sprite Asset ID (1 byte)
    ; Changes the sprite asset used by this entity
    ; Also resets animation frame to 0
    ld a, (hl)              ; A = Sprite Asset ID
    inc hl

    push hl                 ; Save Params Ptr
    push af                 ; Save Sprite Asset ID

    ; BC = Entity Index
    ld c, b
    ld b, 0

    ; Set entity_sprite_asset_index
    ld hl, entity_sprite_asset_index
    add hl, bc
    pop af                  ; Restore Sprite Asset ID
    ld (hl), a              ; entity_sprite_asset_index[entity] = spriteId

    ; Reset animation frame to 0 (start from first frame of new sprite)
    ld hl, entity_anim_frame
    add hl, bc
    ld (hl), 0              ; entity_anim_frame[entity] = 0

    ; Reset animation tick to 0
    ld hl, entity_anim_tick
    add hl, bc
    ld (hl), 0              ; entity_anim_tick[entity] = 0

    pop hl                  ; Restore Params Ptr
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
    ld (hl), a

    ; Reset animation to frame 0
    ld hl, entity_anim_frame
    add hl, bc
    ld (hl), 0

    ; Reset tick counter
    ld hl, entity_anim_tick
    add hl, bc
    ld (hl), 0

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
; Params: Target (1 byte) - 0=self, 1=other
; Destroys entity by clearing its component mask
    ld a, (hl)          ; A = target (0=self, 1=other)
    inc hl

    push hl             ; Save Params Ptr

    or a                ; Check if target == 0 (self)
    jr z, .destroy_self

.destroy_other:
    ; TODO: Destroy entity we last collided with
    ; Requires entity_last_collision variable to be implemented
    ; For now, do nothing
    pop hl
    ret

.destroy_self:
    ld c, b             ; C = Entity Index
    ld b, 0             ; BC = Entity Index

    ; Clear component mask (deactivates entity)
    ld hl, entity_comp_masks
    add hl, bc
    ld (hl), 0          ; Clear low byte

    ld hl, entity_comp_masks_hi
    add hl, bc
    ld (hl), 0          ; Clear high byte

    ; Clear position to move off-screen
    ld hl, entity_x_pos
    add hl, bc
    ld (hl), 255        ; X = off-screen

    ld hl, entity_y_pos
    add hl, bc
    ld (hl), 212        ; Y = below screen (192 + 20)

    pop hl              ; Restore Params Ptr
    ret

Action_SpawnEntity:
; Params: TemplateID(1 byte), X(1 byte), Y(1 byte)
; Spawns a new entity at specified position
; TODO: Full template-based spawning with component copying
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

    ; TODO: Copy template data (velocity, sprite pattern, etc.)
    ; For now, entity is spawned with basic components only

    pop bc
    pop de
    pop hl
    pop hl              ; Restore Params Ptr
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
    ; Check if specified key/direction is currently pressed
    ; Input: B = Entity Index, HL = Params Ptr
    ; Params: Key ID (1 byte) - 1=Up, 5=Down, 7=Left, 3=Right, 9=Fire
    ; Output: A = 1 (pressed) or 0 (not pressed), HL = Updated Ptr
    ; Destroys: AF, DE

    ld a, (hl)              ; A = Key ID
    inc hl                  ; Move past param

    cp 9                    ; Check if fire button
    jr z, .ckp_fire

    ; For directional keys, check if direction is active
    ld d, a                 ; D = Desired key ID
    ld a, (input_state)     ; A = Current direction (0-8)

    ; Simple direction check: match exact direction or diagonals
    cp d                    ; Check exact match
    jr z, .ckp_pressed

    ; Check for diagonal combinations
    ; If desired key is UP (1), also check UP+RIGHT (2) and UP+LEFT (8)
    ld a, d
    cp 1                    ; Desired = UP?
    jr nz, .ckp_down
    ld a, (input_state)
    cp 2                    ; UP+RIGHT?
    jr z, .ckp_pressed
    cp 8                    ; UP+LEFT?
    jr z, .ckp_pressed
    jr .ckp_not_pressed

.ckp_down:
    ld a, d
    cp 5                    ; Desired = DOWN?
    jr nz, .ckp_left
    ld a, (input_state)
    cp 4                    ; DOWN+RIGHT?
    jr z, .ckp_pressed
    cp 6                    ; DOWN+LEFT?
    jr z, .ckp_pressed
    jr .ckp_not_pressed

.ckp_left:
    ld a, d
    cp 7                    ; Desired = LEFT?
    jr nz, .ckp_right
    ld a, (input_state)
    cp 6                    ; DOWN+LEFT?
    jr z, .ckp_pressed
    cp 8                    ; UP+LEFT?
    jr z, .ckp_pressed
    jr .ckp_not_pressed

.ckp_right:
    ld a, d
    cp 3                    ; Desired = RIGHT?
    jr nz, .ckp_not_pressed
    ld a, (input_state)
    cp 2                    ; UP+RIGHT?
    jr z, .ckp_pressed
    cp 4                    ; DOWN+RIGHT?
    jr z, .ckp_pressed
    jr .ckp_not_pressed

.ckp_fire:
    ; Fire button check - TODO: Requires input_fire flag or GTTRIG check
    ; For now, return false (fire not implemented yet)
    ld a, 0
    ret

.ckp_pressed:
    ld a, 1
    ret

.ckp_not_pressed:
    ld a, 0
    ret

Condition_KeyReleased:
    ; TODO: Implement key release check
    inc hl                  ; Skip key param
    ld a, 1
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
    `;function Ta(t,a){let e=Sa+`
`+Aa+`

`;e+=`; ==================================================================
`,e+=`; GLOBAL VARIABLES TABLE
`,e+=`; ==================================================================
`,a&&a.length>0?(e+=`; Maps variable IDs (6+) to their RAM addresses
`,e+=`SM_GlobalVarTable:
`,a.forEach((o,r)=>{const n=6+r;e+=`    DW ${o.asmName}            ; ID ${n}: ${o.name}
`}),e+=`
`):(e+=`; No global variables defined
`,e+=`SM_GlobalVarTable:
`,e+=`    ; Empty table (no global variables)

`),e+=`; ==================================================================
`,e+=`; STATE MACHINE DATA
`,e+=`; ==================================================================

`;const l=ga(a);for(const o of t)e+=Ia(o,l);return e}function Ia(t,a){let e=`; State Machine: ${t.name} (${t.id}) 
`;const l=t.name.replace(/[^a-zA-Z0-9]/g,"_"),o=r=>{if(!r)return!1;const n=r.trim().toLowerCase();return n==="any"||n==="__any_state__"||n==="any state (*)"};for(const r of t.states){const n=`SM_${l}_${r.id.replace(/[^a-zA-Z0-9]/g,"_")}`,s=`${n}_OnEnter`,p=`${n}_OnExit`,d=`${n}_Transitions`;e+=`${n}: 
`,e+=`    DB 0; ID(unused) 
`,e+=`    DW ${r.onEnter&&r.onEnter.length>0?s:0} 
`,e+=`    DW ${r.onExit&&r.onExit.length>0?p:0} 
`;const h=t.transitions.filter(c=>c.fromStateId===r.id||o(c.fromStateId));if(e+=`    DW ${h.length>0?d:0} 
`,r.onEnter&&r.onEnter.length>0){e+=`${s}: 
`;for(const c of r.onEnter)e+=pe(c,t.name,a);e+=`    DB 0xFF; END
`}if(r.onExit&&r.onExit.length>0){e+=`${p}: 
`;for(const c of r.onExit)e+=pe(c,t.name,a);e+=`    DB 0xFF; END
`}h.length>0&&(e+=`${d}: 
`,e+=`    DB ${h.length}; Count
`,h.forEach((c,m)=>{const S=o(c.fromStateId)&&o(c.toStateId)?"0":`SM_${l}_${c.toStateId.replace(/[^a-zA-Z0-9]/g,"_")}`,i=c.actions&&c.actions.length>0?`${d}_Actions_${m}`:"0";if(c.conditions?e+=Ne(c.conditions,a):e+=`    DB 0; Empty Condition(Always True) 
`,e+=`    DW ${S} 
`,e+=`    DW ${i} 
`,i!=="0"){e+=`${i}: 
`;for(const _ of c.actions||[])e+=pe(_,t.name,a);e+=`    DB 0xFF; END
`}})),e+=`
`}return e}function x(t){if(typeof t=="number")return t.toString();if(typeof t=="boolean")return t?"1":"0";if(typeof t=="string"){if(t==="true")return"1";if(t==="false")return"0";const a=parseInt(t,10);return isNaN(a)?"0":a.toString()}return"0"}function pe(t,a="",e){var r;const l=Ea[t.type];if(!l)return`; Unknown Action: ${t.type} 
`;let o=`    DB ${l}; ${t.type} 
`;switch(t.type){case I.SET_POSITION:case I.MOVE_BY:case I.SET_VELOCITY:case I.APPLY_FORCE:o+=`    DB ${x(t.params.x)}, ${x(t.params.y)} 
`;break;case I.CHANGE_SPRITE:o+=`    DB ${x(t.params.spriteId)} 
`;break;case I.PLAY_ANIMATION:o+=`    DB ${x(t.params.animationName)} 
`;break;case I.SET_ANIMATION_SPEED:o+=`    DB ${x(t.params.speed)} 
`;break;case I.TOGGLE_ANIMATION:o+=`    DB ${x(t.params.playing)} 
`;break;case I.PLAY_SOUND:o+=`    DB ${x(t.params.soundId)} 
`;break;case I.SET_VARIABLE:case I.INCREMENT_VARIABLE:case I.DECREMENT_VARIABLE:{const n=t.params.variable||t.params.variableName||t.params.name,s=(e==null?void 0:e[n])??0,p=t.params.value??t.params.amount??0;o+=`    DB ${s}, ${x(p)}        ; ${n} (ID ${s})
`;break}case I.WAIT:o+=`    DB ${x(t.params.duration)} 
`;break;case I.GOTO_STATE:if(a&&t.params.stateId){const n=`SM_${a.replace(/[^a-zA-Z0-9]/g,"_")}_${t.params.stateId.replace(/[^a-zA-Z0-9]/g,"_")} `;o+=`    DW ${n} 
`}else o+=`    DW 0; Invalid GOTO target
`;break;case I.SPAWN_ENTITY:o+=`    DB ${x(t.params.entityId)}, ${x(t.params.x)}, ${x(t.params.y)} 
`;break;case I.DESTROY_ENTITY:{const n=((r=t.params)==null?void 0:r.target)||"self";o+=`    DB ${n==="other"?1:0}          ; Target: ${n}
`;break}case I.ADD_VARIABLES:case I.SUBTRACT_VARIABLES:case I.MULTIPLY_VARIABLES:case I.DIVIDE_VARIABLES:case I.MODULO_VARIABLES:{const n=t.params.destination||t.params.dest||t.params.result,s=t.params.source1||t.params.src1||t.params.operand1,p=t.params.source2||t.params.src2||t.params.operand2,d=(e==null?void 0:e[n])??0,h=(e==null?void 0:e[s])??0,c=(e==null?void 0:e[p])??0,m=t.type===I.ADD_VARIABLES?"ADD":t.type===I.SUBTRACT_VARIABLES?"SUB":t.type===I.MULTIPLY_VARIABLES?"MUL":t.type===I.DIVIDE_VARIABLES?"DIV":"MOD";o+=`    DB ${d}, ${h}, ${c}        ; ${n} = ${s} ${m} ${p}
`;break}default:o+=`    ; Params not implemented for ${t.type}
`;break}return o}function Ne(t,a){var o,r,n,s,p,d,h,c,m,g,S;const e=fa[t.type];if(!e)return`; Unknown Condition: ${t.type} 
`;let l=`    DB ${e}; ${t.type} 
`;switch(t.type){case v.KEY_PRESSED:case v.KEY_RELEASED:{const i=(r=(o=t.params)==null?void 0:o.key)==null?void 0:r.toLowerCase(),_=ya[i]??0;l+=`    DB ${_}          ; Key: ${i||"unknown"}
`;break}case v.TIME_OUT:l+=`    DB ${x((n=t.params)==null?void 0:n.duration)} 
`;break;case v.AND:case v.OR:if(t.conditions){l+=`    DB ${t.conditions.length} 
`;for(const i of t.conditions)l+=Ne(i,a)}else l+=`    DB 0
`;break;case v.VARIABLE_COMPARE:{const i=((s=t.params)==null?void 0:s.variable)||"x",_=a==null?void 0:a[i];if(_===void 0)console.warn(`[State Machine Generator] Unknown variable "${i}" in VARIABLE_COMPARE. Using x (ID 0) as fallback.`),l+=`    DB 0, ${Te[((p=t.params)==null?void 0:p.operator)||"=="]||0}, ${x(((d=t.params)==null?void 0:d.value)||0)}; FALLBACK: unknown var "${i}" -> x ${((h=t.params)==null?void 0:h.operator)||"=="} ${((c=t.params)==null?void 0:c.value)||0}
`;else{const u=Te[((m=t.params)==null?void 0:m.operator)||"=="]||0,E=((g=t.params)==null?void 0:g.value)||0;l+=`    DB ${_}, ${u}, ${x(E)}; ${i} (ID ${_}) ${((S=t.params)==null?void 0:S.operator)||"=="} ${E}
`}break}}return l}function Ca(t,a={}){console.log("ÐYZî [INTERRUPT GENERATOR] Generating interrupt.asm...");let e="";return e+=`; ==================================================================
`,e+=`; INTERRUPT TASK SYSTEM - File: interrupt.asm
`,e+=`; Konami-style technique: Hook H.TIMI for 50/60Hz task execution
`,e+=`; ==================================================================

`,e+=Da(),e+=La(),e+=Ra(),e+=Na(),e+=va(),e+=Oa(t),a.interruptDrivenComponents&&(e+=`
; ==================================================================
`,e+=`; COMPONENT SYSTEMS (INLINED)
`,e+=`; Generated inside interrupt.asm because interruptDrivenComponents=true
`,e+=`; ==================================================================

`,e+=Re(t),e+=`
; ==================================================================
`,e+=`; END OF INLINED COMPONENT SYSTEMS
`,e+=`; ==================================================================

`),console.log(`ƒo. [INTERRUPT GENERATOR] Generated interrupt.asm (${e.length} chars)`),e}function Da(){return`; ==================================================================
; INTERRUPT SYSTEM MEMORY LAYOUT
; Location: C090h-C0B0h (32 bytes)
; ==================================================================

; Task table: 8 slots Ç- 2 bytes (addresses) = 16 bytes
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
vblank_flag              EQU #C0AA   ; Set to 1 on each VBlank (1 byte)

; End marker
RAM_INTERRUPT_END        EQU #C0B0   ; End of interrupt system memory (32 bytes total)

`}function La(){return`; ==================================================================
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

`}function Ra(){return`; ==================================================================
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

`}function Na(){return`; ==================================================================
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

`}function va(){return`; ==================================================================
; TASK MANAGEMENT FUNCTIONS
; ==================================================================

; ==================================================================
; WAIT_VBLANK - Wait for VBlank synchronization with VDP
; ==================================================================
; Direct VDP reading method - works even with interrupts disabled
; Safe and compatible with all MSX models
; Inputs: None
; Outputs: None
; Modifies: AF, BC
; ==================================================================
wait_vblank:
    push af
    push bc

    ; Wait for any active VBlank to finish
    ; (prevents double synchronization)
.no_vblank:
    in a, (#99)                 ; Read VDP status register
    bit 7, a                    ; Test bit 7 (VBlank flag)
    jr nz, .no_vblank           ; If active, wait

    ; Wait for VBlank to start
.wait_start:
    in a, (#99)                 ; Read VDP status register
    bit 7, a                    ; Test bit 7 (VBlank flag)
    jr z, .wait_start           ; Jump if not active

    ; VBlank has started
    ; Read register again to clear the flag
    in a, (#99)

    pop bc
    pop af
    ret

; ==================================================================
; UPDATE_VBLANK_FLAG - For interrupt dispatcher use only
; ==================================================================
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

`}function Oa(t){let a="";if(a+=`; ==================================================================
`,a+=`; DEFAULT INTERRUPT TASKS (60Hz Execution)
`,a+=`; ==================================================================

`,a+=`; ==================================================================
`,a+=`; TASK_UPDATE_INPUT - Joystick/Cursor polling at 60Hz
`,a+=`; ==================================================================
`,a+=`; This task guarantees responsive input (no missed button presses)
`,a+=`; Compatible with update_input_component existing function
`,a+=`; ==================================================================
`,a+=`task_update_input:
`,a+=`    push af
`,a+=`    push de

`,a+=`    ; Save previous state
`,a+=`    ld a, (input_state)
`,a+=`    ld (prev_input_state), a

`,a+=`    ; Read joystick 0 (cursors)
`,a+=`    xor a                       ; Joystick 0
`,a+=`    call GTSTCK                 ; BIOS call: A = direction
`,a+=`    ld b, a                     ; B = direction
`,a+=`    xor a                       ; Joystick 0
`,a+=`    call GTTRIG                 ; A = trigger status (0 = pressed)
`,a+=`    or a
`,a+=`    jr nz, .no_fire
`,a+=`    set 7, b                    ; Fire -> bit 7
`,a+=`    ld a, 1                     ; Fire pressed
`,a+=`    ld (input_fire), a
`,a+=`    jr .fire_done
`,a+=`.no_fire:
`,a+=`    xor a                       ; Fire not pressed
`,a+=`    ld (input_fire), a
`,a+=`.fire_done:
`,a+=`    ld a, b
`,a+=`    ld (input_state), a

`,a+=`    pop de
`,a+=`    pop af
`,a+=`    ret

`,t.hasEntities){const l=ne(t).usedComponents,o=l.has("Jump"),r=l.has("Movement")||l.has("Cursors"),n=l.has("Gravity");o||r||n?(a+=`; ==================================================================
`,a+=`; TASK_UPDATE_PHYSICS - Apply vx, vy -> X, Y (OPTIMIZED)
`,a+=`; ==================================================================
`,a+=`; Only calls physics systems that are actually used in this project
`,a+=`; ==================================================================
`,a+=`task_update_physics:
`,a+=`    push af
`,a+=`    push bc
`,a+=`    push de
`,a+=`    push hl

`,o&&(a+=`    call update_jump_component      ; Jump impulse
`),r&&(a+=`    call update_movement_component  ; Movement/velocity
`),n&&(a+=`    call update_gravity_component   ; Gravity acceleration
`),a+=`    call update_position_component  ; Apply velocity to position

`,a+=`    pop hl
`,a+=`    pop de
`,a+=`    pop bc
`,a+=`    pop af
`,a+=`    ret

`):(a+=`; Task 1 (Physics): Minimal - only position update (no Jump/Movement/Gravity used)
`,a+=`task_update_physics:
`,a+=`    call update_position_component  ; Just apply any existing velocities
`,a+=`    ret

`)}else a+=`; Task 1 (Physics): Not generated (no entities detected)

`;return t.hasCollisions?(a+=`; ==================================================================
`,a+=`; TASK_UPDATE_COLLISION - Collision detection
`,a+=`; ==================================================================
`,a+=`; Detects collisions using collision layers (bitmask system)
`,a+=`; AABB collision for 16x16 sprites
`,a+=`; ==================================================================
`,a+=`task_update_collision:
`,a+=`    push af
`,a+=`    push bc
`,a+=`    push de
`,a+=`    push hl

`,a+=`    ; TODO: Implement collision detection
`,a+=`    ; Loop over entities with COMP_MASK_COLLISION
`,a+=`    ; Check: collisionLayer & collidesWith for each pair
`,a+=`    ; AABB test: |X1-X2| < 16 && |Y1-Y2| < 16

`,a+=`    pop hl
`,a+=`    pop de
`,a+=`    pop bc
`,a+=`    pop af
`,a+=`    ret

`):a+=`; Task 2 (Collision): Not generated (no collision detection needed)

`,t.hasSprites?(a+=`; ==================================================================
`,a+=`; TASK_UPDATE_SPRITES - Update sprites to VRAM
`,a+=`; ==================================================================
`,a+=`; WARNING: This task is HEAVY (~800 cycles)
`,a+=`; Consider executing every N frames instead of every frame
`,a+=`; ==================================================================
`,a+=`task_update_sprites:
`,a+=`    push af
`,a+=`    push bc
`,a+=`    push de
`,a+=`    push hl

`,a+=`    ; Call existing sprite update function
`,a+=`    call update_sprites_to_vram

`,a+=`    pop hl
`,a+=`    pop de
`,a+=`    pop bc
`,a+=`    pop af
`,a+=`    ret

`):a+=`; Task 3 (Sprites): Not generated (no sprites in project)

`,a+=`; ==================================================================
`,a+=`; TASK_FRAME_COUNTER - Custom timing/animations
`,a+=`; ==================================================================
`,a+=`; Placeholder for user-defined frame-based timing
`,a+=`; Example: Increment animation timers, etc.
`,a+=`; ==================================================================
`,a+=`task_frame_counter:
`,a+=`    ; Placeholder - counter is already incremented in dispatcher
`,a+=`    ; Add custom timing logic here if needed
`,a+=`    ret

`,a+=`; ==================================================================
`,a+=`; USER CUSTOM TASK SLOTS (5-7)
`,a+=`; ==================================================================
`,a+=`; These slots are reserved for user-defined tasks
`,a+=`; Enable them dynamically using:
`,a+=`;   LD A, 5                    ; Slot 5
`,a+=`;   LD HL, my_custom_task
`,a+=`;   CALL enable_task
`,a+=`; ==================================================================

`,a}function wa(t){return`; ==================================================================
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
;         B = Volume (0-15, 0=silent, 15=max)
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

; Sound effect state
sfx_active:         db 0         ; 0=no sfx, 1=playing
sfx_timer:          db 0         ; Frames remaining
sfx_fadeout:        db 0         ; Fadeout flag

; ------------------------------------------------------------------
; sfx_play
; Play a sound effect with duration
; Input:  HL = Sound effect function address
;         B = Duration in frames
; ------------------------------------------------------------------
sfx_play:
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

; ==================================================================
; END OF PSG SOUND SYSTEM
; ==================================================================
`}function Pa(t){var l,o,r,n;const a=((o=(l=t.tiles)==null?void 0:l[0])==null?void 0:o.width)||8,e=((n=(r=t.tiles)==null?void 0:r[0])==null?void 0:n.height)||8;return`; ==================================================================
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
    ld a, ${a}
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
    ${a===8?`
    ; Tile width is 8, shift right 3 times
    ld a, c
    srl b
    rra
    srl b
    rra
    srl b
    rra`:a===16?`
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
    ; Tile width is ${a}, divide
    ld a, c
    ld c, ${a}
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
    ld a, ${e}
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
    ${e===8?`
    ; Tile height is 8, shift right 3 times
    ld a, e
    srl d
    rra
    srl d
    rra
    srl d
    rra`:e===16?`
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
    ; Tile height is ${e}, divide
    ld a, e
    ld c, ${e}
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
`}function Ma(t){var a,e,l,o;return(e=(a=t.tiles)==null?void 0:a[0])!=null&&e.width,(o=(l=t.tiles)==null?void 0:l[0])!=null&&o.height,`; ==================================================================
; ANIMATED TILES SYSTEM
; File: animtiles.asm
; Description: Background tile animation for water, lava, fire, etc.
; ==================================================================

; ==================================================================
; ANIMATED TILES CONSTANTS
; ==================================================================

; Animation speeds (in frames)
ANIM_SPEED_SLOW         EQU 15      ; ~250ms (water)
ANIM_SPEED_MEDIUM       EQU 8       ; ~133ms (lava)
ANIM_SPEED_FAST         EQU 4       ; ~66ms (fire)

; Maximum animated tiles
MAX_ANIM_TILES          EQU 8       ; Support up to 8 animated tiles

; ==================================================================
; ANIMATED TILES INITIALIZATION
; ==================================================================

init_animated_tiles:
    ; Initialize animation variables
    xor a
    ld (anim_tile_timer), a
    ld (anim_tile_frame), a

    ; Set default animation speed (medium)
    ld a, ANIM_SPEED_MEDIUM
    ld (anim_tile_speed), a

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
    cp b
    ret nz                          ; Not yet time to update

    ; Reset timer
    xor a
    ld (anim_tile_timer), a

    ; Advance to next animation frame
    ld a, (anim_tile_frame)
    inc a
    and #03                         ; Wrap at 4 frames (0-3)
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
    ld hl, anim_tile_table          ; HL = animation table pointer
    ld a, (anim_tile_frame)         ; A = current global frame

.anim_vram_loop:
    ld c, (hl)                      ; C = tile ID
    ld a, c
    cp 255
    ret z                           ; End of table, done

    inc hl
    ld b, (hl)                      ; B = number of frames (unused for now)
    inc hl
    inc hl                          ; Skip speed byte

    ; Now update this tile in VRAM
    push hl                         ; Save table pointer

    ; Get current animation frame
    ld a, (anim_tile_frame)
    ld b, a                         ; B = current frame
    ld a, c                         ; A = tile ID

    ; Calculate which animation pattern index
    ; We need to know which pattern set this tile uses
    ; For simplicity: tile 240 = pattern 0, tile 241 = pattern 1, etc.
    sub 240                         ; A = pattern index (0, 1, 2, ...)
    ld c, a                         ; C = pattern index

    ; Calculate source address
    ; Source = anim_patterns_data + (pattern_index * 32) + (frame * 8)
    ld l, c
    ld h, 0
    add hl, hl                      ; * 2
    add hl, hl                      ; * 4
    add hl, hl                      ; * 8
    add hl, hl                      ; * 16
    add hl, hl                      ; * 32 (4 frames * 8 bytes)

    ; Add frame offset
    ld a, b                         ; A = frame
    add a, a                        ; * 2
    add a, a                        ; * 4
    add a, a                        ; * 8
    ld e, a
    ld d, 0
    add hl, de

    ; Add base address
    ld de, anim_patterns_data
    add hl, de                      ; HL = source pattern address

    ; Calculate VRAM destination
    ; For Screen 2: CHRTBL + (tile_id * 8)
    ld a, c
    add a, 240                      ; Convert back to tile ID
    ld e, a
    ld d, 0
    ex de, hl                       ; DE = source, HL = tile_id
    add hl, hl                      ; * 2
    add hl, hl                      ; * 4
    add hl, hl                      ; * 8
    ld bc, CHRTBL
    add hl, bc                      ; HL = VRAM address

    ex de, hl                       ; DE = VRAM, HL = source

    ; Copy 8 bytes to VRAM
    push bc
    ld bc, 8
    call LDIRVM
    pop bc

    pop hl                          ; Restore table pointer
    jr .anim_vram_loop              ; Next tile

    ret

; ------------------------------------------------------------------
; set_animation_speed
; Set global animation speed for all animated tiles
; Input:  A = Speed (frames between updates)
; ------------------------------------------------------------------
set_animation_speed:
    ld (anim_tile_speed), a
    ret

; ------------------------------------------------------------------
; animate_tile_pattern
; Update a specific tile pattern in VRAM with animation frame
; Input:  A = Tile ID
;         B = Animation frame (0-3)
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
animate_tile_pattern:
    push af
    push bc

    ; Calculate pattern address in VRAM
    ; For Screen 2: Pattern = CHRTBL2 + (tile_id * 8)
    ld l, a
    ld h, 0
    add hl, hl                      ; * 2
    add hl, hl                      ; * 4
    add hl, hl                      ; * 8
    ld de, #0000                    ; CHRTBL2 base
    add hl, de                      ; HL = VRAM pattern address

    ; Calculate source pattern address
    ; Source = anim_patterns + (tile_id * 32) + (frame * 8)
    pop bc                          ; B = frame
    pop af                          ; A = tile_id

    push hl                         ; Save VRAM address

    ; tile_id * 32 (4 frames * 8 bytes)
    ld l, a
    ld h, 0
    add hl, hl                      ; * 2
    add hl, hl                      ; * 4
    add hl, hl                      ; * 8
    add hl, hl                      ; * 16
    add hl, hl                      ; * 32

    ; + (frame * 8)
    ld a, b
    add a, a                        ; * 2
    add a, a                        ; * 4
    add a, a                        ; * 8
    ld e, a
    ld d, 0
    add hl, de

    ; Add base address of animation patterns
    ld de, anim_patterns_data
    add hl, de                      ; HL = source address

    ; Copy 8 bytes to VRAM
    pop de                          ; DE = VRAM address
    ld bc, 8
    call LDIRVM

    ret

; ==================================================================
; ANIMATED TILE DEFINITIONS
; ==================================================================
; Define which tiles are animated and their pattern data

; Example: Water animation (4 frames)
; Each frame is 8 bytes (one tile pattern)

anim_patterns_data:
    ; Tile 0: Water (example - 4 frames)
    ; Frame 0
    db #00, #00, #42, #24, #00, #00, #84, #48
    ; Frame 1
    db #00, #42, #24, #00, #00, #84, #48, #00
    ; Frame 2
    db #42, #24, #00, #00, #84, #48, #00, #00
    ; Frame 3
    db #24, #00, #00, #84, #48, #00, #00, #42

    ; Tile 1: Lava (example - 4 frames)
    ; Frame 0
    db #FF, #AA, #55, #AA, #FF, #AA, #55, #AA
    ; Frame 1
    db #AA, #55, #AA, #FF, #AA, #55, #AA, #FF
    ; Frame 2
    db #55, #AA, #FF, #AA, #55, #AA, #FF, #AA
    ; Frame 3
    db #AA, #FF, #AA, #55, #AA, #FF, #AA, #55

    ; Tile 2: Fire (example - 4 frames)
    ; Frame 0
    db #18, #3C, #7E, #FF, #E7, #C3, #81, #00
    ; Frame 1
    db #3C, #7E, #FF, #E7, #C3, #81, #00, #18
    ; Frame 2
    db #7E, #FF, #E7, #C3, #81, #00, #18, #3C
    ; Frame 3
    db #FF, #E7, #C3, #81, #00, #18, #3C, #7E

    ; Add more animated tile patterns here...

; ------------------------------------------------------------------
; Animated tile mapping table
; Maps tile IDs to animation data
; Format: db tile_id, num_frames, speed
; ------------------------------------------------------------------
anim_tile_table:
    ; Tile ID, Frames, Speed
    db 240, 4, ANIM_SPEED_SLOW      ; Water tile (ID 240)
    db 241, 4, ANIM_SPEED_MEDIUM    ; Lava tile (ID 241)
    db 242, 4, ANIM_SPEED_FAST      ; Fire tile (ID 242)
    db 255                          ; End marker

; ==================================================================
; ADVANCED ANIMATION FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; register_animated_tile
; Register a tile ID as animated (adds to runtime table)
; Input:  A = Tile ID to animate
;         B = Number of frames (2-4)
;         C = Animation speed
; Output: A = 0 if failed (table full), 1 if success
; Destroys: AF, DE, HL
; ------------------------------------------------------------------
register_animated_tile:
    push bc
    push af                         ; Save tile ID

    ; Find end of anim_tile_table (marked by 255)
    ld hl, anim_tile_table
.anim_reg_find_end:
    ld a, (hl)
    cp 255
    jr z, .anim_reg_found_end       ; Found end marker

    ; Skip to next entry (3 bytes: id, frames, speed)
    inc hl
    inc hl
    inc hl
    jr .anim_reg_find_end

.anim_reg_found_end:
    ; Check if we have space (need 4 bytes: new entry + end marker)
    ; For safety, we'll assume the table has space
    ; In production, add bounds checking

    ; Write new entry
    pop af                          ; A = tile ID
    ld (hl), a
    inc hl

    pop bc                          ; B = frames, C = speed
    ld (hl), b                      ; Store frames
    inc hl
    ld (hl), c                      ; Store speed
    inc hl

    ; Write new end marker
    ld (hl), 255

    ld a, 1                         ; Success
    ret

; ------------------------------------------------------------------
; get_tile_animation_frame
; Get current animation frame for a tile
; Input:  A = Tile ID
; Output: A = Current frame (0-3), or 0 if not animated
;         Zero flag set if not animated
; Destroys: BC, HL
; ------------------------------------------------------------------
get_tile_animation_frame:
    ld c, a                         ; C = tile ID to search
    ld hl, anim_tile_table

.anim_search_loop:
    ld a, (hl)                      ; A = tile_id from table
    cp 255
    jr z, .anim_not_found           ; End of table

    ; Check if this is our tile
    cp c
    jr z, .anim_found_tile          ; Found it!

    ; Skip to next entry (3 bytes)
    inc hl
    inc hl
    inc hl
    jr .anim_search_loop

.anim_found_tile:
    ; Found the tile, get its current frame
    ; For now, we use the global frame
    ; In a more advanced system, each tile could have its own frame counter
    ld a, (anim_tile_frame)         ; A = current global frame

    ; We could add per-tile frame support here:
    ; 1. Store per-tile frame counters in RAM
    ; 2. Use tile index to look up specific frame
    ; For now, all tiles share the same frame counter

    or a                            ; Clear zero flag (tile found)
    ret

.anim_not_found:
    xor a                           ; Return 0 if not animated
    ret                             ; Zero flag is set

; ==================================================================
; UTILITY: Copy to VRAM (if not using BIOS)
; ==================================================================
; Note: We use LDIRVM from BIOS, defined in bios.asm

; ==================================================================
; END OF ANIMATED TILES SYSTEM
; ==================================================================
`}function xa(t){var a,e,l,o;return(e=(a=t.tiles)==null?void 0:a[0])!=null&&e.width,(o=(l=t.tiles)==null?void 0:l[0])!=null&&o.height,`; ==================================================================
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
`}function ka(t,a,e={}){var p;if(console.log("🔧 Generating modular ASM files..."),!t)throw console.error("❌ projectName is required"),new Error("projectName is required");if(!a)throw console.error("❌ assets is undefined or null"),new Error("assets array is required");if(!Array.isArray(a))throw console.error("❌ assets is not an array"),new Error("assets must be an array");console.log(`📊 Project: ${t}, Assets: ${a.length}, Config:`,e);let l;try{l=_e(t,a),console.log(`🔍 Analysis complete: ${l.sprites.length} sprites, ${l.tiles.length} tiles`)}catch(d){console.error("❌ Error analyzing project:",d),l={hasSprites:!1,hasTiles:!1,hasScreens:!1,hasEntities:!1,hasComponents:!1,hasGameFlow:!1,hasMenus:!1,hasFonts:!1,hasECS:!1,hasMultipleScreens:!1,hasAnimations:!1,hasCollisions:!1,hasMenuSystem:!1,components:[],templates:[],entities:[],sprites:[],tiles:[],screens:[],screenMaps:[],projectName:t,customStates:[],stateMachines:[],globalVariables:[]},console.log("🔄 Using fallback empty analysis")}const o=e.interruptDrivenComponents??!0,r=e.hardwareMode||"hybrid",n=e.optimizeLevel||"safe";console.log("📝 [MSX GENERATOR] Generating all ASM files..."),console.log(`🔧 Hardware Mode: ${r.toUpperCase()}, Optimize: ${n}`);const s={"bios.asm":yt({hardwareMode:{mode:r,optimizeLevel:n}}),"constants.asm":St(l),"variables.asm":At(l),"interrupt.asm":Ca(l,{interruptDrivenComponents:o}),"header.asm":It(t,l),"patterns.asm":wt(l),"colors.asm":Pt(l),"components.asm":o?`; Components are generated inside interrupt.asm (interruptDrivenComponents=true)
`:Re(l),"entities.asm":ia(l),"worlds.asm":ua(l),"screens.asm":ra(l),"sprites.asm":Ft(l),"font.asm":sa(l),"hud.asm":da(l),"menus.asm":ma(l),"sound.asm":wa(),"scroll.asm":Pa(l),"animtiles.asm":Ma(l),"particles.asm":xa(l),"statemachine.asm":l.stateMachines?Ta(l.stateMachines,l.globalVariables):`; No State Machines
`,"gameflow.asm":Dt(l),"main.asm":Ot(t,l),"unitedFiles.asm":""};return e.generateUnified&&(s["unitedFiles.asm"]=Mt(s,t,l)),console.log("✅ Modular ASM files generated successfully!"),console.log(`📊 Generated ${Object.keys(s).filter(d=>s[d]).length} files`),console.log("📋 [DEBUG] Files generated:",Object.keys(s)),console.log("🎯 [DEBUG] interrupt.asm length:",((p=s["interrupt.asm"])==null?void 0:p.length)||"MISSING!"),s}const $l=Object.freeze(Object.defineProperty({__proto__:null,generateModularASM:ka},Symbol.toStringTag,{value:"Module"}));export{ml as $,wl as A,z as B,Pl as C,Ga as D,ja as E,Ke as F,Ze as G,M as H,ol as I,ll as J,Xe as K,Ul as L,$a as M,yl as N,ae as O,Ha as P,Ml as Q,kl as R,oe as S,xl as T,Ue as U,cl as V,nl as W,rl as X,il as Y,Ka as Z,_l as _,Za as a,hl as a0,sl as a1,dl as a2,ul as a3,pl as a4,El as a5,G as a6,ee as a7,el as a8,Bl as a9,Wa as aa,za as ab,re as ac,Hl as ad,bl as ae,Je as af,v as ag,I as ah,Va as ai,_e as aj,Vl as ak,gl as al,Qa as am,He as an,qa as ao,Sl as ap,fl as aq,Ya as ar,Al as as,$l as at,Xa as b,Ja as c,X as d,Il as e,tl as f,Tl as g,al as h,$e as i,Ge as j,P as k,Fa as l,Ba as m,te as n,Dl as o,Ll as p,Rl as q,Nl as r,Cl as s,vl as t,K as u,Z as v,be as w,Ol as x,Ua as y,Fl as z};
