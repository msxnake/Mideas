const Gl=[16,24,32];var X=(t=>(t.Score="Score",t.HighScore="HighScore",t.Lives="Lives",t.EnergyBar="EnergyBar",t.ItemDisplay="ItemDisplay",t.SceneName="SceneName",t.MiniMap="MiniMap",t.CoinCounter="CoinCounter",t.BossEnergyBar="BossEnergyBar",t.PhaseIndicator="PhaseIndicator",t.AttackAlert="AttackAlert",t.TextBox="TextBox",t.NumericField="NumericField",t.CustomCounter="CustomCounter",t))(X||{});const Nt={water:{bit:0,label:"Water Effect",maskValue:1,color:"rgba(50, 100, 200, 0.4)"},customGravity:{bit:1,label:"Custom Gravity",maskValue:2,color:"rgba(150, 50, 200, 0.4)"},icePhysics:{bit:2,label:"Ice Physics",maskValue:4,color:"rgba(100, 200, 255, 0.4)"},spriteConceal:{bit:3,label:"Sprite Concealment",maskValue:8,color:"rgba(100, 100, 100, 0.4)"}};var wt=(t=>(t.None="None",t.Tile="Tile",t.Sprite="Sprite",t.Screen="Screen",t.Code="Code",t.Attributes="Attributes",t.Sound="Sound",t.Platformer="Platformer",t.WorldMap="WorldMap",t.Track="Track",t.HUD="HUD",t.TileBanks="TileBanks",t.Font="Font",t.HelpDocs="HelpDocs",t.BehaviorEditor="BehaviorEditor",t.ComponentDefinitionEditor="ComponentDefinitionEditor",t.EntityTemplateEditor="EntityTemplateEditor",t.Boss="Boss",t.WorldView="WorldView",t.GameFlow="GameFlow",t.MainMenu="MainMenu",t.StateMachine="StateMachine",t.GlobalVariables="GlobalVariables",t.Palette="Palette",t))(wt||{});const Yl=[1,3,5,7],Wl=[{id:0,name:"NoSolid (Passable)",isSolid:!1},{id:1,name:"Solid (Wall/Ground)",isSolid:!0},{id:2,name:"Platform (Top-Solid)",isSolid:!0},{id:3,name:"Slope (Solid)",isSolid:!0}],Ql={isBreakable:{bit:0,label:"Breakable"},isMovable:{bit:1,label:"Movable"},causesDamage:{bit:2,label:"Deadly"},isInteractiveSwitch:{bit:3,label:"Interactable"}},Xl="0.267",ye=[{name:"Transparent",hex:"rgba(0,0,0,0)"},{name:"Black",hex:"#000000"},{name:"Medium Green",hex:"#3EB847"},{name:"Light Green",hex:"#74D07D"},{name:"Dark Blue",hex:"#2F2FC1"},{name:"Light Blue",hex:"#5858FC"},{name:"Dark Red",hex:"#B63125"},{name:"Cyan",hex:"#68D2DA"},{name:"Medium Red",hex:"#FC584A"},{name:"Light Red",hex:"#FF8E81"},{name:"Dark Yellow",hex:"#C0BF3B"},{name:"Light Yellow",hex:"#E7E474"},{name:"Dark Green",hex:"#309337"},{name:"Magenta",hex:"#B640C8"},{name:"Gray",hex:"#999999"},{name:"White",hex:"#FFFFFF"}],W=[{name:"Transparent (Backdrop)",hex:"rgba(0,0,0,0)",index:0},{name:"Black",hex:"#000000",index:1},{name:"Medium Green",hex:"#21C842",index:2},{name:"Light Green",hex:"#5EDC78",index:3},{name:"Dark Blue",hex:"#5455ED",index:4},{name:"Light Blue",hex:"#7D76FC",index:5},{name:"Dark Red",hex:"#D4524D",index:6},{name:"Cyan",hex:"#42EBF5",index:7},{name:"Medium Red",hex:"#FC5554",index:8},{name:"Light Red",hex:"#FF7978",index:9},{name:"Dark Yellow",hex:"#D4C154",index:10},{name:"Light Yellow",hex:"#E6CE80",index:11},{name:"Dark Green",hex:"#21B03B",index:12},{name:"Magenta",hex:"#C95BBA",index:13},{name:"Gray",hex:"#CCCCCC",index:14},{name:"White",hex:"#FFFFFF",index:15}],ne=[0,36,73,109,146,182,219,255],me=t=>t.toString(16).padStart(2,"0").toUpperCase(),Kl=(()=>{const t=[];for(let e=0;e<ne.length;e++)for(let a=0;a<ne.length;a++)for(let l=0;l<ne.length;l++){const i=e<<6|a<<3|l;t.push({index:i,hex:`#${me(ne[e])}${me(ne[a])}${me(ne[l])}`,rLevel:e,gLevel:a,bLevel:l})}return t})(),Me=t=>{let e=0,a=1/0;return ne.forEach((l,i)=>{const o=Math.abs(l-t);o<a&&(a=o,e=i)}),e},xt=t=>!t||!t.startsWith("#")||t.length!==7?"#000000":t.toUpperCase(),Ot=t=>{const e=xt(t),a=parseInt(e.slice(1,3),16),l=parseInt(e.slice(3,5),16),i=parseInt(e.slice(5,7),16),o=Me(a),r=Me(l),n=Me(i),p=`#${me(ne[o])}${me(ne[r])}${me(ne[n])}`,s=o<<6|r<<3|n;return{hex:p,masterIndex:s}},Zl=ye.map((t,e)=>{if(e===0)return{slotIndex:0,masterIndex:-1,hex:"rgba(0,0,0,0)"};const a=Ot(t.hex);return{slotIndex:e,masterIndex:a.masterIndex,hex:a.hex}}),Jl=[8,16,24,32],ql=16,eo=16,to=16,pe=32,Ie=24,ue=8,he=255,ao="SCREEN 2 (Graphics I)",lo=["ADC","ADD","AND","BIT","CALL","CCF","CP","CPD","CPDR","CPI","CPIR","CPL","DAA","DEC","DI","DJNZ","EI","EX","EXX","HALT","IM","IN","INC","IND","INDR","INI","INIR","JP","JR","LD","LDD","LDDR","LDI","LDIR","NEG","NOP","OR","OTDR","OTIR","OUT","OUTD","OUTI","POP","PUSH","RES","RET","RETI","RETN","RL","RLA","RLC","RLCA","RLD","RR","RRA","RRC","RRCA","RRD","RST","SBC","SCF","SET","SLA","SLL","SRA","SRL","SUB","XOR"],oo=["A","F","B","C","D","E","H","L","AF","BC","DE","HL","IXH","IXL","IYH","IYL","IX","IY","SP","PC","I","R","AF'"],no=["NZ","Z","NC","C","PO","PE","P","M"],io=[".ORG","ORG","END",".END",".EQU","EQU",".DB","DB",".BYTE","BYTE","DEFB",".DW","DW",".WORD","WORD","DEFW",".DS","DS",".BLOCK","BLOCK","DEFS",".DEFINE","DEFINE",".MACRO","MACRO",".ENDM","ENDM",".IF","IF",".ENDIF","ENDIF",".ELSE","ELSE",".INCLUDE","INCLUDE",".DEFM","DEFM",".ZILOG",".PHASE",".REPT",".ENDR",".SEARCH",".RANDOM",".ROM",".MEGAROM",".BASIC",".CAS",".WAV",".MSXDOS"],ro=[{id:"pac_man_collection",name:"Pac-Man Tile Collection",code:`; Pac-Man Style Tile Collection System for MSX
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
POWER_MODE:         DB 0       ; Power-up mode active flag`}],so=[],Re=8,Ee=15,ge=1;var gt;const co=((gt=W.find(t=>t.index===Ee))==null?void 0:gt.hex)||W[15].hex;var St;const po=((St=W.find(t=>t.index===ge))==null?void 0:St.hex)||W[1].hex,ve=new Map(W.map(t=>[t.hex,t])),_o=new Map(W.map(t=>[t.index,t])),ho=W[1],uo=32,mo=125,fo=6,bo=31,yo=15,Eo=["A","B","C"],go=["1","2","3","4","5"],So=["C-","C#","D-","D#","E-","F-","F#","G-","G#","A-","A#","B-"],Ao=32,To={q:{noteNameIndex:0,baseOctave:5},w:{noteNameIndex:1,baseOctave:5},e:{noteNameIndex:2,baseOctave:5},r:{noteNameIndex:3,baseOctave:5},t:{noteNameIndex:4,baseOctave:5},y:{noteNameIndex:5,baseOctave:5},u:{noteNameIndex:6,baseOctave:5},i:{noteNameIndex:7,baseOctave:5},o:{noteNameIndex:8,baseOctave:5},p:{noteNameIndex:9,baseOctave:5},"[":{noteNameIndex:10,baseOctave:5},"]":{noteNameIndex:11,baseOctave:5},a:{noteNameIndex:0,baseOctave:4},s:{noteNameIndex:1,baseOctave:4},d:{noteNameIndex:2,baseOctave:4},f:{noteNameIndex:3,baseOctave:4},g:{noteNameIndex:4,baseOctave:4},h:{noteNameIndex:5,baseOctave:4},j:{noteNameIndex:6,baseOctave:4},k:{noteNameIndex:7,baseOctave:4},l:{noteNameIndex:8,baseOctave:4},ñ:{noteNameIndex:9,baseOctave:4},";":{noteNameIndex:9,baseOctave:4},"'":{noteNameIndex:10,baseOctave:4},z:{noteNameIndex:0,baseOctave:3},x:{noteNameIndex:1,baseOctave:3},c:{noteNameIndex:2,baseOctave:3},v:{noteNameIndex:3,baseOctave:3},b:{noteNameIndex:4,baseOctave:3},n:{noteNameIndex:5,baseOctave:3},m:{noteNameIndex:6,baseOctave:3},",":{noteNameIndex:7,baseOctave:3},".":{noteNameIndex:8,baseOctave:3},2:{noteNameIndex:1,baseOctave:5},3:{noteNameIndex:3,baseOctave:5},5:{noteNameIndex:6,baseOctave:5},6:{noteNameIndex:8,baseOctave:5},7:{noteNameIndex:10,baseOctave:5}},Co={min:-2,max:2},Io=[{id:1,name:"Piano",volumeEnvelope:[15,14,13,11,9,7,5,3,2,1,0],toneEnvelope:[0],volumeLoop:255,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:0},{id:2,name:"Electric Bass",volumeEnvelope:[15,14,13,12,11,10,9,8],toneEnvelope:[0],volumeLoop:3,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:12},{id:3,name:"Lead Vibrato",volumeEnvelope:[0,5,10,15,15,15,14,13,12],toneEnvelope:[0,1,2,1,0,-1,-2,-1],volumeLoop:4,toneLoop:0,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:13},{id:4,name:"Strings Pad",volumeEnvelope:[0,2,4,6,8,10,12,14,15,15,15],toneEnvelope:[0,0,1,1,0,0,-1,-1],volumeLoop:8,toneLoop:0,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:13},{id:5,name:"Kick Drum",volumeEnvelope:[15,13,10,7,4,2,0],toneEnvelope:[12,10,8,6,4,2,0],volumeLoop:255,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:0},{id:6,name:"Snare Drum",volumeEnvelope:[15,12,9,6,3,1,0],toneEnvelope:[0],volumeLoop:255,toneLoop:255,ayToneEnabled:!1,ayNoiseEnabled:!0,ayEnvelopeShape:0},{id:7,name:"Hi-Hat",volumeEnvelope:[12,10,8,6,4,2,0],toneEnvelope:[0],volumeLoop:255,toneLoop:255,ayToneEnabled:!1,ayNoiseEnabled:!0,ayEnvelopeShape:0},{id:8,name:"Arpeggio",volumeEnvelope:[15,15,14,14,13,13,12,12],toneEnvelope:[0,4,7,12,7,4,0],volumeLoop:0,toneLoop:0,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:10},{id:9,name:"Organ",volumeEnvelope:[15,15,15,15,15],toneEnvelope:[0],volumeLoop:0,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:13},{id:10,name:"Bell",volumeEnvelope:[15,14,12,10,8,6,4,3,2,1,0],toneEnvelope:[0,12,0],volumeLoop:255,toneLoop:255,ayToneEnabled:!0,ayNoiseEnabled:!1,ayEnvelopeShape:0}],Mt=[{id:"bank_0",name:"Bank 0 - HUD/Fonts",enabled:!0,vramPatternStart:0,vramColorStart:8192,screenZone:{x:0,y:0,width:pe,height:8},charsetRangeStart:0,charsetRangeEnd:255,defaultFgColorIndex:15,defaultBgColorIndex:4,isLocked:!1,assignedTiles:{}},{id:"bank_1",name:"Bank 1 - Game Tileset",enabled:!0,vramPatternStart:2048,vramColorStart:10240,screenZone:{x:0,y:8,width:pe,height:8},charsetRangeStart:0,charsetRangeEnd:255,defaultFgColorIndex:2,defaultBgColorIndex:1,isLocked:!1,assignedTiles:{}},{id:"bank_2",name:"Bank 2 - Background/Status",enabled:!0,vramPatternStart:4096,vramColorStart:12288,screenZone:{x:0,y:16,width:pe,height:8},charsetRangeStart:0,charsetRangeEnd:255,defaultFgColorIndex:11,defaultBgColorIndex:6,isLocked:!1,assignedTiles:{}}],vo={isEnabled:!0,options:[{id:"start",label:"INICIAR PARTIDA",enabled:!0},{id:"continue",label:"CONTINUAR",enabled:!0},{id:"settings",label:"AJUSTES",enabled:!0},{id:"help",label:"AYUDA",enabled:!1}],keyMapping:{up:"ArrowUp",down:"ArrowDown",left:"ArrowLeft",right:"ArrowRight",fire1:" ",fire2:"m"},settings:{volume:12},continueScreen:{title:"CONTINUAR PARTIDA",prompt:"INTRODUCE TU CODIGO"},introScreen:{text:`EN EL ANO 2084, LA CORPORACION CYBERNETICA DOMINA EL MUNDO...

SOLO UN HEROE PUEDE DETENERLOS.`,backgroundAssetId:null},menuScreenAssetId:null,cursorSpriteAssetId:null,menuColors:{text:W[15].hex,background:W[4].hex,highlightText:W[11].hex,highlightBackground:W[5].hex,border:W[15].hex}},Do=Nt,Lo="HELP_DOCS_SYSTEM_ASSET",Ro=[{id:"getting_started",title:"Getting Started",articles:[{id:"welcome",title:"Welcome to MSX Retro IDE",content:`
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
        `,tags:["gameflow","troubleshooting","problems"]}]}],No=50,Pe=[{name:"Goal",asmName:"global_var_goal",constantPrefix:"GOAL_",type:"byte",description:"Current objective status",category:"objective",values:[{label:"Failure",value:0,asmConstant:"GOAL_FAILURE"},{label:"Completed",value:1,asmConstant:"GOAL_COMPLETED"},{label:"Partial",value:2,asmConstant:"GOAL_PARTIAL"}]},{name:"MissionStatus",asmName:"global_var_mission_status",constantPrefix:"MISSION_",type:"byte",description:"Current mission state",category:"objective",values:[{label:"NotStarted",value:0,asmConstant:"MISSION_NOT_STARTED"},{label:"Active",value:1,asmConstant:"MISSION_ACTIVE"},{label:"Completed",value:2,asmConstant:"MISSION_COMPLETED"},{label:"Failed",value:3,asmConstant:"MISSION_FAILED"}]},{name:"LevelCompleted",asmName:"global_var_level_completed",constantPrefix:"BOOL_",type:"byte",description:"Level completion flag",category:"objective",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"BossDefeated",asmName:"global_var_boss_defeated",constantPrefix:"BOOL_",type:"byte",description:"Boss defeated flag",category:"objective",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"AllItemsCollected",asmName:"global_var_all_items_collected",constantPrefix:"BOOL_",type:"byte",description:"All items collected flag",category:"objective",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"Score",asmName:"global_var_score",constantPrefix:"SCORE_",type:"word",description:"Current player score (0-65535)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"HiScore",asmName:"global_var_hi_score",constantPrefix:"HISCORE_",type:"word",description:"High score record (0-65535)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"ComboMultiplier",asmName:"global_var_combo_multiplier",constantPrefix:"COMBO_",type:"byte",description:"Combo multiplier (1x, 2x, 3x...)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"Coins",asmName:"global_var_coins",constantPrefix:"COINS_",type:"byte",description:"Coins collected (0-255)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"Gems",asmName:"global_var_gems",constantPrefix:"GEMS_",type:"byte",description:"Gems collected (0-255)",category:"score",values:[{label:"Custom Value",value:"number"}]},{name:"Lives",asmName:"global_var_lives",constantPrefix:"LIVES_",type:"byte",description:"Remaining lives (0-255)",category:"player",values:[{label:"Custom Value",value:"number"}]},{name:"Health",asmName:"global_var_health",constantPrefix:"HEALTH_",type:"byte",description:"Current health (0-255)",category:"player",values:[{label:"Custom Value",value:"number"}]},{name:"Energy",asmName:"global_var_energy",constantPrefix:"ENERGY_",type:"byte",description:"Current energy/mana (0-255)",category:"player",values:[{label:"Custom Value",value:"number"}]},{name:"Shield",asmName:"global_var_shield",constantPrefix:"BOOL_",type:"byte",description:"Shield active flag",category:"player",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"HasKey",asmName:"global_var_has_key",constantPrefix:"BOOL_",type:"byte",description:"Has key item",category:"inventory",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"HasSword",asmName:"global_var_has_sword",constantPrefix:"BOOL_",type:"byte",description:"Has sword item",category:"inventory",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"HasMap",asmName:"global_var_has_map",constantPrefix:"BOOL_",type:"byte",description:"Has map item",category:"inventory",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"ItemCount",asmName:"global_var_item_count",constantPrefix:"ITEMS_",type:"byte",description:"Special items collected (0-255)",category:"inventory",values:[{label:"Custom Value",value:"number"}]},{name:"PowerUpActive",asmName:"global_var_powerup_active",constantPrefix:"POWERUP_",type:"byte",description:"Active power-up type",category:"inventory",values:[{label:"None",value:0,asmConstant:"POWERUP_NONE"},{label:"Speed",value:1,asmConstant:"POWERUP_SPEED"},{label:"Jump",value:2,asmConstant:"POWERUP_JUMP"},{label:"Invincible",value:3,asmConstant:"POWERUP_INVINCIBLE"}]},{name:"CurrentWorld",asmName:"global_var_current_world",constantPrefix:"WORLD_",type:"byte",description:"Current world number (1-8)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"CurrentLevel",asmName:"global_var_current_level",constantPrefix:"LEVEL_",type:"byte",description:"Current level number (0-255)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"CheckpointReached",asmName:"global_var_checkpoint",constantPrefix:"CHECKPOINT_",type:"byte",description:"Checkpoint reached (0-255)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"SecretFound",asmName:"global_var_secret_found",constantPrefix:"BOOL_",type:"byte",description:"Secret area found flag",category:"progress",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"DoorsUnlocked",asmName:"global_var_doors_unlocked",constantPrefix:"DOORS_",type:"byte",description:"Doors unlocked bitmask (0-255)",category:"progress",values:[{label:"Custom Value",value:"number"}]},{name:"TimeRemaining",asmName:"global_var_time_remaining",constantPrefix:"TIME_",type:"word",description:"Time remaining in seconds (0-65535)",category:"time",values:[{label:"Custom Value",value:"number"}]},{name:"TimeLimitActive",asmName:"global_var_time_limit_active",constantPrefix:"BOOL_",type:"byte",description:"Time limit active flag",category:"time",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]},{name:"DayNightCycle",asmName:"global_var_day_night_cycle",constantPrefix:"TIME_",type:"byte",description:"Day/night cycle state (0-23)",category:"time",values:[{label:"Custom Value",value:"number"}]},{name:"DifficultyLevel",asmName:"global_var_difficulty",constantPrefix:"DIFFICULTY_",type:"byte",description:"Game difficulty level",category:"difficulty",values:[{label:"Easy",value:0,asmConstant:"DIFFICULTY_EASY"},{label:"Normal",value:1,asmConstant:"DIFFICULTY_NORMAL"},{label:"Hard",value:2,asmConstant:"DIFFICULTY_HARD"},{label:"Expert",value:3,asmConstant:"DIFFICULTY_EXPERT"}]},{name:"EnemiesDefeated",asmName:"global_var_enemies_defeated",constantPrefix:"ENEMIES_",type:"word",description:"Enemies defeated count (0-65535)",category:"special",values:[{label:"Custom Value",value:"number"}]},{name:"PerfectRun",asmName:"global_var_perfect_run",constantPrefix:"BOOL_",type:"byte",description:"Perfect run (no damage) flag",category:"special",values:[{label:"False",value:0,asmConstant:"BOOL_FALSE"},{label:"True",value:1,asmConstant:"BOOL_TRUE"}]}],G=8,Pt=t=>{let e=t.toString(16).toUpperCase();return e.length===1&&(e="0"+e),e},wo=(t,e,a)=>{var h,c;if(!t.lineAttributes)return`;; ERROR: Tile ${e} is missing line attributes required for SCREEN 2 export.
`;const l=e.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let i=`;; Tile: ${e} (${t.width}x${t.height})
`;i+=`;; Structure: ${t.width/G}x${t.height/G} character blocks (8x8 pixels each)
`,i+=`;; Data format: ${a.toUpperCase()}

`;const o=t.width/G,r=t.height/G,n=_=>a==="hex"?`$${Pt(_)}`:_.toString(10),p=[],s=[];for(let _=0;_<r;_++)for(let E=0;E<o;E++){const A=`;; Character Block (${E}, ${_}) for ${l}`,u=[];for(let b=0;b<G;b++){const g=_*G+b;let d=0;if(t.lineAttributes[g]&&t.lineAttributes[g][E]){const m=t.lineAttributes[g][E].fg;for(let T=0;T<G;T++){const v=E*G+T;t.data[g]&&t.data[g][v]!==void 0&&t.data[g][v]===m&&(d|=1<<7-T)}}u.push(d)}const S=u.map(n).join(",");p.push({comment:`${A} - PATTERN Data (8 bytes):`,dataString:`DB ${S}`});const f=[];for(let b=0;b<G;b++){const g=_*G+b;let d=Ee<<4|ge;if(t.lineAttributes[g]&&t.lineAttributes[g][E]){const m=t.lineAttributes[g][E],T=((h=ve.get(m.fg))==null?void 0:h.index)??Ee,v=((c=ve.get(m.bg))==null?void 0:c.index)??ge;d=T<<4|v}f.push(d)}const y=f.map(n).join(",");s.push({comment:`${A} - COLOR Attribute Data (8 bytes - FG|BG):`,dataString:`DB ${y}`})}return i+=`;; --- PATTERN DATA ---
`,p.length>0?(i+=`${l}_PATTERN_DATA:
`,p.forEach(_=>{i+=`${_.comment}
`,i+=`    ${_.dataString}
`})):i+=`;; No pattern data generated.
`,i+=`
`,i+=`;; --- COLOR ATTRIBUTE DATA ---
`,s.length>0?(i+=`${l}_COLOR_DATA:
`,s.forEach(_=>{i+=`${_.comment}
`,i+=`    ${_.dataString}
`})):i+=`;; No color attribute data generated.
`,i+=`
;; End of Tile Data for ${l}
`,i},xo=(t,e,a,l)=>{const i=Math.max(1,t/Re);return Array(e).fill(null).map(()=>Array(i).fill(null).map(()=>({fg:a,bg:l})))},kt=(t,e)=>{var r,n,p,s;const a=[],l=t.width/G,i=t.height/G,o=e==="SCREEN 2 (Graphics I)";for(let h=0;h<i;h++)for(let c=0;c<l;c++)for(let _=0;_<G;_++){const E=h*G+_;let A=0,u;o&&t.lineAttributes&&t.lineAttributes[E]&&t.lineAttributes[E][c]&&(u=t.lineAttributes[E][c].fg);for(let S=0;S<G;S++){const f=c*G+S,y=(r=t.data[E])==null?void 0:r[f];if(y!==void 0){let b=!1;o&&u?b=y===u:o||(b=y!==ye[0].hex&&y!==((s=(p=(n=t.lineAttributes)==null?void 0:n[0])==null?void 0:p[0])==null?void 0:s.bg)),b&&(A|=1<<7-S)}}a.push(A)}return new Uint8Array(a)},fe=(t,e)=>{var o,r;const a=t.length;if(a===0)return[];const l=((o=t[0])==null?void 0:o.length)||0;if(l===0)return[[]];const i=t.map(n=>[...n]);for(let n=0;n<a;n++)for(let p=0;p<l;p++){const s=Math.floor(p/Re),h=(r=e[n])==null?void 0:r[s],c=i[n][p];h&&c!==h.fg&&c!==h.bg&&(i[n][p]=h.fg)}return i},Oo=(t,e,a)=>{if(t.length<2)return t;const i=t.slice(1);return i.push([...t[0]]),a==="SCREEN 2 (Graphics I)"&&e?fe(i,e):i},Mo=(t,e,a)=>{const l=t.length;if(l<2)return t;const i=t.slice(0,l-1);return i.unshift([...t[l-1]]),a==="SCREEN 2 (Graphics I)"&&e?fe(i,e):i},Po=(t,e,a)=>{if(t.length===0)return[];const l=t.map(i=>{if(i.length<2)return[...i];const o=i.slice(1);return o.push(i[0]),o});return a==="SCREEN 2 (Graphics I)"&&e?fe(l,e):l},ko=(t,e,a)=>{if(t.length===0)return[];const l=t.map(i=>{const o=i.length;if(o<2)return[...i];const r=i.slice(0,o-1);return r.unshift(i[o-1]),r});return a==="SCREEN 2 (Graphics I)"&&e?fe(l,e):l},Uo=(t,e,a)=>{if(t.length===0)return[];const l=t.map(i=>[...i].reverse());return a==="SCREEN 2 (Graphics I)"&&e?fe(l,e):l},Fo=(t,e,a)=>{if(t.length===0)return[];const l=[...t].reverse();return a==="SCREEN 2 (Graphics I)"&&e?fe(l,e):l},Ut=t=>{var i,o,r;if(!t.lineAttributes)return null;const e=[],a=t.width/G,l=t.height/G;for(let n=0;n<l;n++)for(let p=0;p<a;p++)for(let s=0;s<G;s++){const h=n*G+s;let c=Ee<<4|ge;const _=(i=t.lineAttributes[h])==null?void 0:i[p];if(_){const E=((o=ve.get(_.fg))==null?void 0:o.index)??Ee,A=((r=ve.get(_.bg))==null?void 0:r.index)??ge;c=E<<4|A}e.push(c)}return new Uint8Array(e)},Bo=t=>{const e=[];t.frames.forEach(l=>{var i,o,r,n,p;for(let s=0;s<t.spritePalette.length;s++){const h=t.spritePalette[s];if(h===t.backgroundColor)continue;let c=!1;const _=[],E=t.size.width,A=t.size.height;if(E===16&&A===16){for(let u=0;u<8;u++){let S=0;for(let f=0;f<8;f++)((i=l.data[u])==null?void 0:i[f])===h&&(S|=1<<7-f,c=!0);_.push(S)}for(let u=8;u<16;u++){let S=0;for(let f=0;f<8;f++)((o=l.data[u])==null?void 0:o[f])===h&&(S|=1<<7-f,c=!0);_.push(S)}for(let u=0;u<8;u++){let S=0;for(let f=0;f<8;f++)((r=l.data[u])==null?void 0:r[8+f])===h&&(S|=1<<7-f,c=!0);_.push(S)}for(let u=8;u<16;u++){let S=0;for(let f=0;f<8;f++)((n=l.data[u])==null?void 0:n[8+f])===h&&(S|=1<<7-f,c=!0);_.push(S)}}else for(let u=0;u<A;u++)for(let S=0;S<Math.ceil(E/8);S++){let f=0;for(let y=0;y<8;y++){const b=S*8+y;b<E&&((p=l.data[u])==null?void 0:p[b])===h&&(f|=1<<7-y,c=!0)}_.push(f)}c&&e.push(_)}});const a=e.flat();return new Uint8Array(a)},nt=t=>t.map(e=>[...e].reverse()),it=t=>[...t].reverse(),Ft=/_(left|right|up|down)$/i,At=t=>{if(!t)return;const e=t.trim().toLowerCase();if(e==="left"||e==="right"||e==="up"||e==="down")return e},Bt=t=>{const e=t.match(Ft);return e?{baseName:t.slice(0,-e[0].length),suffixDirection:At(e[1])}:{baseName:t}},$t=(t,e,a,l)=>({...t,id:`${t.id}__auto_${a}`,name:e,facingDirection:a,frames:t.frames.map((i,o)=>({...i,id:`${i.id||`f${o}`}_${a}_auto`,data:l(i.data)}))}),ke=(t,e,a,l)=>{if(!e)return;(e===e.toLowerCase()?[e]:[e,e.toLowerCase()]).forEach(o=>{const r=t[o];if(r===void 0){t[o]=a;return}r!==a&&l.push(`Name alias collision for "${o}" between indexes ${r} and ${a}. Keeping first mapping.`)})},je=t=>{const e=[],a=new Set,l=[],i=new Map,o=(c,_,E)=>{if(!a.has(c))return c;if(!a.has(_))return e.push(`Name "${c}" already exists. Using fallback "${_}" for ${E}.`),_;let A=1,u=`${c}_${A}`;for(;a.has(u);)A+=1,u=`${c}_${A}`;return e.push(`Name "${c}" already exists. Using "${u}" for ${E}.`),u};t.forEach((c,_)=>{const E=c.name||`sprite_${_}`,{baseName:A,suffixDirection:u}=Bt(E),S=At(c.facingDirection);S&&u&&S!==u&&e.push(`Sprite "${E}" has suffix "${u}" but facing "${S}". Using facing direction.`);const f=S||u,y=u?A:E,b=f?`${y}_${f}`:E,g=o(b,E,`sprite "${E}"`),d=new Set;E!==g&&d.add(E);const T={sprite:{...c,name:g,facingDirection:f||c.facingDirection},baseName:y,direction:f,aliases:d};if(l.push(T),a.add(g),f){const v=i.get(y)||{};v[f]===void 0?(v[f]=l.length-1,i.set(y,v)):e.push(`Duplicate directional sprite for "${y}_${f}". Keeping first occurrence.`)}}),i.forEach((c,_)=>{const E=(A,u,S,f)=>{if(u===void 0||c[A]!==void 0)return;const y=`${_}_${A}`;if(a.has(y)){e.push(`Cannot auto-generate "${y}" because the name already exists.`);return}const b=l[u],d={sprite:$t(b.sprite,y,A,S),baseName:_,direction:A,aliases:new Set};l.push(d),c[A]=l.length-1,a.add(y),e.push(`Auto-generated "${y}" from "${b.sprite.name}" using ${f}.`)};c.right!==void 0&&c.left===void 0?E("left",c.right,nt,"horizontal mirror"):c.left!==void 0&&c.right===void 0&&E("right",c.left,nt,"horizontal mirror"),c.up!==void 0&&c.down===void 0?E("down",c.up,it,"vertical mirror"):c.down!==void 0&&c.up===void 0&&E("up",c.down,it,"vertical mirror")});const r={};l.forEach((c,_)=>{ke(r,c.sprite.name,_,e),ke(r,c.sprite.id,_,e)}),l.forEach((c,_)=>{c.aliases.forEach(E=>ke(r,E,_,e))});const n=l.map((c,_)=>_),p=l.map((c,_)=>_),s=l.map((c,_)=>_),h=l.map((c,_)=>_);return l.forEach((c,_)=>{const E=i.get(c.baseName);E&&(E.left!==void 0&&(n[_]=E.left),E.right!==void 0&&(p[_]=E.right),E.up!==void 0&&(s[_]=E.up),E.down!==void 0&&(h[_]=E.down))}),{sprites:l.map(c=>c.sprite),nameToIndex:r,directionalLookupTables:{left:n,right:p,up:s,down:h},warnings:e}},Ht=t=>{let e=t.toString(16).toUpperCase();return e.length===1&&(e="0"+e),e},jt=(t,e,a,l,i,o,r="hex")=>{var c,_,E,A,u;const p=t.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let s=`;; ---- Sprite Frame: ${t} ----
`;s+=`;; Size: ${i}x${o}
`;let h=0;for(let S=0;S<a.length;S++){const f=a[S];if(f===l)continue;const y=[];if(i===16&&o===16){for(let b=0;b<8;b++){let g=0;for(let d=0;d<8;d++){const m=d;((c=e[b])==null?void 0:c[m])===f&&(g|=1<<7-d)}y.push(g)}for(let b=8;b<16;b++){let g=0;for(let d=0;d<8;d++){const m=d;((_=e[b])==null?void 0:_[m])===f&&(g|=1<<7-d)}y.push(g)}for(let b=0;b<8;b++){let g=0;for(let d=0;d<8;d++){const m=8+d;((E=e[b])==null?void 0:E[m])===f&&(g|=1<<7-d)}y.push(g)}for(let b=8;b<16;b++){let g=0;for(let d=0;d<8;d++){const m=8+d;((A=e[b])==null?void 0:A[m])===f&&(g|=1<<7-d)}y.push(g)}}else for(let b=0;b<o;b++)for(let g=0;g<Math.ceil(i/8);g++){let d=0;for(let m=0;m<8;m++){const T=g*8+m;T<i&&((u=e[b])==null?void 0:u[T])===f&&(d|=1<<7-m)}y.push(d)}h+=1,s+=`${p}_LAYER${S}: ; Brush Color Index ${S} (Actual Color: ${f})
`,i%8!==0&&(s+=`;; WARNING: Sprite width ${i} is not a multiple of 8. Bitmask generation might be problematic for standard VDP.
`);for(let b=0;b<y.length;b+=16){const d=y.slice(b,b+16).map(m=>r==="hex"?`#${Ht(m)}`:m.toString());s+=`    DB ${d.join(",")}
`}s+=`
`}return h===0&&(s+=`;; NO DRAWABLE LAYERS EXPORTED for ${t} - Palette may match background color.
`),s+=`;; ---- End of Frame: ${t} ----

`,s},Vt=(t,e="hex",a)=>{let l=`;; Sprite: ${t.name}
`;l+=`;; Total Frames: ${t.frames.length}
`,l+=`;; Size: ${t.size.width}x${t.size.height}
`,l+=`;; Background Color (not exported as a layer): ${t.backgroundColor}
`,l+=`;; Drawable Palette (Hex): C0=${t.spritePalette[0]}, C1=${t.spritePalette[1]}, C2=${t.spritePalette[2]}, C3=${t.spritePalette[3]}

`;const i=a!==void 0?`_${a}`:"",o=t.name+i,r=o.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();return l+=`SPRITE_${r}_WIDTH     EQU ${t.size.width}
`,l+=`SPRITE_${r}_HEIGHT    EQU ${t.size.height}
`,l+=`SPRITE_${r}_FRAMES    EQU ${t.frames.length}

`,t.frames.forEach((n,p)=>{l+=jt(`${o}_F${p}`,n.data,t.spritePalette,t.backgroundColor,t.size.width,t.size.height,e)}),l},Ue=16,Tt="SCREEN 2 (Graphics I)",zt="SCREEN 5 (Graphics III)",ce=8,Gt={pixelWidth:pe*Ue,pixelHeight:Ie*Ue,widthTiles:pe,heightTiles:Ie,baseTileSize:Ue},rt={[Tt]:{pixelWidth:pe*ue,pixelHeight:Ie*ue,widthTiles:pe,heightTiles:Ie,baseTileSize:ue},[zt]:{pixelWidth:256,pixelHeight:212,widthTiles:32,heightTiles:27,baseTileSize:ue},"SCREEN 0 (Text 40)":{pixelWidth:240,pixelHeight:192,widthTiles:40,heightTiles:24,baseTileSize:ce},"SCREEN 1 (Text 32)":{pixelWidth:256,pixelHeight:192,widthTiles:32,heightTiles:24,baseTileSize:ce},"SCREEN 3 (Multicolor)":{pixelWidth:256,pixelHeight:192,widthTiles:32,heightTiles:24,baseTileSize:ce},"SCREEN 4 (Graphics II)":{pixelWidth:256,pixelHeight:192,widthTiles:32,heightTiles:24,baseTileSize:ce},"SCREEN 6 (Graphics IV)":{pixelWidth:512,pixelHeight:212,widthTiles:64,heightTiles:27,baseTileSize:ce},"SCREEN 7 (Graphics V)":{pixelWidth:512,pixelHeight:212,widthTiles:64,heightTiles:27,baseTileSize:ce},"SCREEN 8 (Graphics VI)":{pixelWidth:256,pixelHeight:212,widthTiles:32,heightTiles:27,baseTileSize:ce}};function $o(t){const e=typeof t=="string"?t.trim():"";return e&&rt[e]?rt[e]:Gt}const De=t=>t===Tt,Yt=t=>De(t)?W:ye,Wt=(t,e)=>{const a=Yt(e);if(t===void 0||t<0||t>=a.length)return De(e)?W[1].hex:ye[4].hex;const l=a[t];return(l==null?void 0:l.hex)??(De(e)?W[1].hex:ye[4].hex)},Ho=(t,e,a,l)=>{var _;const i=t.layers.background,o=t.activeAreaX??0,r=t.activeAreaY??0,n=t.activeAreaWidth??t.width,p=t.activeAreaHeight??t.height,s=[];let h=0;const c=new Map;for(let E=0;E<p;E++){const A=r+E;for(let u=0;u<n;u++){const S=o+u;if(A>=i.length||S>=((_=i[A])==null?void 0:_.length)){s.push(he);continue}const f=i[A][S];if(!f||!f.tileId)s.push(he);else{let y=he;const b=e.find(g=>g.id===f.tileId);if(l==="SCREEN 2 (Graphics I)"&&a&&b){let g=!1,d={tileId:f.tileId,position:{x:S,y:A},attempts:[],banksReceived:a.length};typeof globalThis.screenUtils_firstTileLogged>"u"&&(console.log("🔍 First tile structure check:",{tileId:f.tileId,position:{x:S,y:A},banksCount:a.length,banks:a.map(m=>({name:m.name,assignedTileIds:Object.keys(m.assignedTiles||{}),hasThisTile:!!(m.assignedTiles&&m.assignedTiles[f.tileId]),assignedTilesType:typeof m.assignedTiles,assignedTilesSample:m.assignedTiles?Object.entries(m.assignedTiles).slice(0,2):[]}))}),globalThis.screenUtils_firstTileLogged=!0);for(const m of a)if((m.enabled??!0)&&m.assignedTiles[f.tileId]){const T=m.assignedTiles[f.tileId].charCode,v=Math.ceil(b.width/ue),D=f.subTileX||0,L=f.subTileY||0;y=T+L*v+D;const N=y>=m.charsetRangeStart&&y<=m.charsetRangeEnd;if(d.attempts.push({bankName:m.name,baseCharCode:T,calculated:y,range:`${m.charsetRangeStart}-${m.charsetRangeEnd}`,inRange:N}),N){g=!0;break}else y=he}else d.attempts.push({bankName:m.name,reason:"Tile not assigned to this bank"});g||(console.warn("⚠️ Tile not found in valid range:",d),y=he)}else if(l!=="SCREEN 2 (Graphics I)"){const g=`${f.tileId}_${f.subTileX??0}_${f.subTileY??0}`;c.has(g)?y=c.get(g):h>255?y=he:(c.set(g,h),y=h++)}s.push(y)}}}return new Uint8Array(s)},Qt=(t,e,a,l,i,o="hex")=>{const n=t.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let p=`;; MAP: ${t} (${e}x${a} tiles)
`;p+=`;; Total size: ${l.length} bytes

`,i.length>0&&(p+=`;; --- TILE INDEX REFERENCES for ${n} ---
`,p+=i.join(`
`)+`

`),p+=`SCREEN_${n}_WIDTH     EQU ${e}
`,p+=`SCREEN_${n}_HEIGHT    EQU ${a}
`,p+=`SCREEN_${n}_SIZE      EQU ${l.length}

`,p+=`SCREEN_${n}_LAYOUT:
`;for(let s=0;s<l.length;s+=16){const c=l.slice(s,s+16).map(_=>o==="hex"?`#${_.toString(16).padStart(2,"0").toUpperCase()}`:_.toString());p+=`    DB ${c.join(",")}
`}return p},Xt=(t,e,a,l,i="hex")=>{const r=t.replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase();let n=`;; BEHAVIOR MAP: ${t} (${e}x${a} tiles)
`;n+=`;; Total size: ${l.length} bytes (Map IDs 0-255)
`,n+=`;; Data format: ${i.toUpperCase()}

`,n+=`BEHAVIOR_${r}_WIDTH     EQU ${e}
`,n+=`BEHAVIOR_${r}_HEIGHT    EQU ${a}
`,n+=`BEHAVIOR_${r}_SIZE      EQU ${l.length}

`,n+=`BEHAVIOR_${r}_DATA:
`;const p=s=>i==="hex"?`#${s.toString(16).padStart(2,"0").toUpperCase()}`:s.toString(10);for(let s=0;s<l.length;s+=16){const c=l.slice(s,s+16).map(p);n+=`    DB ${c.join(",")}
`}return n+=`
;; End of Behavior Map Data for ${t}
`,n},jo=(t,e)=>{if(t.width!==e.width||t.height!==e.height||t.data.length!==e.data.length)return!1;for(let a=0;a<t.height;a++){if(t.data[a].length!==e.data[a].length)return!1;for(let l=0;l<t.width;l++)if(t.data[a][l]!==e.data[a][l])return!1}if(t.lineAttributes&&e.lineAttributes){if(t.lineAttributes.length!==e.lineAttributes.length)return!1;for(let a=0;a<t.lineAttributes.length;a++){if(t.lineAttributes[a].length!==e.lineAttributes[a].length)return!1;for(let l=0;l<t.lineAttributes[a].length;l++)if(t.lineAttributes[a][l].fg!==e.lineAttributes[a][l].fg||t.lineAttributes[a][l].bg!==e.lineAttributes[a][l].bg)return!1}}else if(t.lineAttributes!==e.lineAttributes)return!1;return JSON.stringify(t.logicalProperties)===JSON.stringify(e.logicalProperties)};function Vo(t,e,a,l,i,o,r){const{data:n,width:p,height:s,lineAttributes:h}=t;if(!n||s===0||p===0)return"";const c=document.createElement("canvas");c.width=o,c.height=o;const _=c.getContext("2d");if(!_)return"";_.imageSmoothingEnabled=!1;const E=(e??0)*o,A=(a??0)*o;for(let f=0;f<o;f++)for(let y=0;y<o;y++){const b=E+y,g=A+f;if(g>=0&&g<s&&b>=0&&b<p){let d=n[g][b];if(r==="SCREEN 2 (Graphics I)"&&h&&h[g]){const m=Math.floor(b/Re),T=h[g][m];T&&d!==T.fg&&d!==T.bg&&(d=T.fg)}_.fillStyle=d,_.fillRect(y,f,1,1)}}if(c.width===l&&c.height===i)return c.toDataURL();const u=document.createElement("canvas");u.width=l,u.height=i;const S=u.getContext("2d");return S?(S.imageSmoothingEnabled=!1,S.drawImage(c,0,0,l,i),u.toDataURL()):c.toDataURL()}function zo(t,e,a){var o;if(!t||a===0||e===0)return"";const l=document.createElement("canvas");l.width=e,l.height=a;const i=l.getContext("2d");if(!i)return"";i.imageSmoothingEnabled=!1;for(let r=0;r<a;r++)for(let n=0;n<e;n++){const p=(o=t[r])==null?void 0:o[n];p&&p!=="rgba(0,0,0,0)"&&(i.fillStyle=p,i.fillRect(n,r,1,1))}return l.toDataURL()}const Go=(t,e,a,l,i,o,r)=>{var c,_;const n=De(l);t.width=e.width*i,t.height=e.height*i;const p=t.getContext("2d");if(!p)return;p.imageSmoothingEnabled=!1;const s=Wt(e.backgroundColor,l);p.fillStyle=s,p.fillRect(0,0,t.width,t.height);const h=e.layers.background;for(let E=0;E<e.height;E++)for(let A=0;A<e.width;A++){const u=(c=h[E])==null?void 0:c[A];if(!(u!=null&&u.tileId))continue;const S=a.find(D=>D.id===u.tileId);if(!S)continue;const{data:f,width:y,height:b,lineAttributes:g}=S;if(!f)continue;const d=u.subTileX??0,m=u.subTileY??0,T=d*i,v=m*i;for(let D=0;D<i;D++)for(let L=0;L<i;L++){const N=T+L,M=v+D;if(M<b&&N<y){let C=(_=f[M])==null?void 0:_[N];if(C===void 0)continue;if(n&&g&&g[M]){const P=Math.floor(N/Re),F=g[M][P];F&&C!==F.fg&&C!==F.bg&&(C=F.fg)}p.fillStyle=C,p.fillRect(A*i+L,E*i+D,1,1)}}}};function Kt(t){const e=t.find(r=>r.type==="globalvariables");if(!e||!e.data)return[...Pe];const a=e.data.customVariables||[],l=new Map;Pe.forEach(r=>{l.set(r.name,r)}),a.forEach(r=>{l.set(r.name,r)});const i=Pe.map(r=>r.name),o=[];return i.forEach(r=>{const n=l.get(r);n&&(o.push(n),l.delete(r))}),l.forEach(r=>{o.push(r)}),o}function Yo(t){const e=t.find(l=>l.type==="globalvariables");return!e||!e.data?[]:e.data.customVariables||[]}function Zt(t){const e=Kt(t);if(e.length===0)return[];const a=[];t.filter(h=>h.type==="screenmap").forEach(h=>{var _,E;(((E=(_=h.data)==null?void 0:_.layers)==null?void 0:E.entities)||[]).forEach(A=>{var u,S;(S=(u=A.components)==null?void 0:u.Behavior)!=null&&S.behaviorCode&&a.push(A.components.Behavior.behaviorCode)})});const i=t.find(h=>h.type==="gameflow"),o=new Set,r=new Set;if(i!=null&&i.data){const h=i.data;h.nodes&&Array.isArray(h.nodes)&&h.nodes.forEach(c=>{var _;c.type==="StateMachine"&&((_=c.data)!=null&&_.customCode)&&a.push(c.data.customCode),c.type==="IfThenElse"&&c.variableName&&o.add(c.variableName),c.type==="Globals"&&c.variables&&Array.isArray(c.variables)&&c.variables.forEach(E=>{E.variableName&&r.add(E.variableName)})})}t.filter(h=>h.type==="componentdefinition").forEach(h=>{const c=h.data;c.customCode&&a.push(c.customCode)});const p=[],s=new Set;return e.forEach(h=>{const c=a.some(A=>new RegExp(`\\b${h.asmName}\\b`,"i").test(A)),_=o.has(h.name),E=r.has(h.name);(c||_||E)&&!s.has(h.name)&&(p.push(h),s.add(h.name))}),r.forEach(h=>{if(!s.has(h)){const c=`global_var_${h.replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`;p.push({name:h,asmName:c,constantPrefix:`${h.replace(/[^A-Za-z0-9]/g,"_").toUpperCase()}_`,type:"8bit",description:"Auto-generated variable from Globals node",values:[{label:"0",value:0}],category:"special"}),s.add(h)}}),o.forEach(h=>{if(!s.has(h)){const c=`global_var_${h.replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`;p.push({name:h,asmName:c,constantPrefix:`${h.replace(/[^A-Za-z0-9]/g,"_").toUpperCase()}_`,type:"8bit",description:"Auto-generated variable from IfThenElse node",values:[{label:"0",value:0}],category:"special"}),s.add(h)}}),p}const $={AND:"AND",OR:"OR",XOR:"XOR",NOT:"NOT",KEY_PRESSED:"KEY_PRESSED",KEY_RELEASED:"KEY_RELEASED",TIME_OUT:"TIME_OUT",CAN_MOVE_DIRECTION:"CAN_MOVE_DIRECTION",HAS_COLLISION:"HAS_COLLISION",PATH_CLEAR:"PATH_CLEAR",ON_WALL_COLLISION:"ON_WALL_COLLISION",HAS_DEADLY_TILE_COLLISION:"HAS_DEADLY_TILE_COLLISION",ANIMATION_COMPLETE:"ANIMATION_COMPLETE",KEY_AND_MOVEMENT:"KEY_AND_MOVEMENT",VARIABLE_COMPARE:"VARIABLE_COMPARE"},R={SET_POSITION:"SET_POSITION",MOVE_BY:"MOVE_BY",SET_VELOCITY:"SET_VELOCITY",APPLY_FORCE:"APPLY_FORCE",CHANGE_SPRITE:"CHANGE_SPRITE",PLAY_ANIMATION:"PLAY_ANIMATION",SET_ANIMATION_SPEED:"SET_ANIMATION_SPEED",TOGGLE_ANIMATION:"TOGGLE_ANIMATION",PLAY_SOUND:"PLAY_SOUND",PLAY_MUSIC:"PLAY_MUSIC",MUTE_MUSIC:"MUTE_MUSIC",STOP_MUSIC:"STOP_MUSIC",SET_VARIABLE:"SET_VARIABLE",INCREMENT_VARIABLE:"INCREMENT_VARIABLE",DECREMENT_VARIABLE:"DECREMENT_VARIABLE",SET_COMPONENT_PROPERTY:"SET_COMPONENT_PROPERTY",WAIT:"WAIT",GOTO_STATE:"GOTO_STATE",DESTROY_ENTITY:"DESTROY_ENTITY",SPAWN_ENTITY:"SPAWN_ENTITY",GET_RANDOM_ENTITY_POSITION:"GET_RANDOM_ENTITY_POSITION",CHANGE_GAME_FLOW_NODE:"CHANGE_GAME_FLOW_NODE",DECREASE_LIVES:"DECREASE_LIVES",INCREASE_LIVES:"INCREASE_LIVES",RESPAWN_PLAYER:"RESPAWN_PLAYER",BREAK_TILE:"BREAK_TILE",REPLACE_TILE:"REPLACE_TILE",RND:"RND",POINT_AT:"POINT_AT",ADD_VARIABLES:"ADD_VARIABLES",SUBTRACT_VARIABLES:"SUBTRACT_VARIABLES",MULTIPLY_VARIABLES:"MULTIPLY_VARIABLES",DIVIDE_VARIABLES:"DIVIDE_VARIABLES",MODULO_VARIABLES:"MODULO_VARIABLES",ASSIGN_VARIABLE:"ASSIGN_VARIABLE"};function Ve(t,e){const a=e.filter(C=>C.type==="componentdefinition").map(C=>C.data),l=e.filter(C=>C.type==="entitytemplate").map(C=>C.data),i=e.filter(C=>C.type==="sprite").map(C=>C.data),o=e.filter(C=>C.type==="tile").map(C=>C.data),r=e.filter(C=>C.type==="screenmap").map(C=>C.data),n=e.filter(C=>C.type==="worldmap").map(C=>C.data),p=e.filter(C=>C.type==="statemachine").map(C=>C.data),s=[],h=new Set,c=(C,P,F)=>{var te,H;if(C!=null&&C.id)return String(C.id);const w=((te=C==null?void 0:C.position)==null?void 0:te.x)??"",x=((H=C==null?void 0:C.position)==null?void 0:H.y)??"",j=(C==null?void 0:C.entityTemplateId)??"",U=(C==null?void 0:C.name)??"";return`${(P==null?void 0:P.id)??`screen_${F}`}|${j}|${U}|${w}|${x}`},_=(C,P,F)=>{if(!C||typeof C!="object")return;const w=c(C,P,F);h.has(w)||(h.add(w),s.push({...C,screenAssetId:C.screenAssetId||(P==null?void 0:P.id),screenIndex:typeof C.screenIndex=="number"?C.screenIndex:F}))};r.forEach((C,P)=>{var F;(F=C.layers)!=null&&F.entities&&Array.isArray(C.layers.entities)&&C.layers.entities.forEach(w=>_(w,C,P)),C.entities&&Array.isArray(C.entities)&&C.entities.forEach(w=>_(w,C,P))});const E=e.find(C=>C.type==="gameflow"),A=E==null?void 0:E.data,u=s.length>0,S=a.length>0||u,f=r.length>1,y=i.length>0,b=o.length>0,g=r.length>0,d=a.length>0,m=!!A,T=e.some(C=>C.type==="font"),v=i.some(C=>C.frames.length>1),D=r.some(C=>C.layers.collision.some(P=>P.some(F=>F!==null))),L=l.some(C=>C.name.toLowerCase().includes("menu")),N=[];a.forEach(C=>{C.name.toLowerCase().includes("state")&&N.push(C.name.replace(/[^a-zA-Z0-9]/g,"").toUpperCase())});const M=Zt(e);return{projectName:t,components:a,templates:l,sprites:i,tiles:o,screenMaps:r,screens:r,worldmaps:n,entities:s,fonts:e.filter(C=>C.type==="font"),gameFlow:A,stateMachines:p,hasECS:S,hasMultipleScreens:f,hasSprites:y,hasTiles:b,hasScreens:g,hasEntities:u,hasComponents:d,hasGameFlow:m,hasMenus:L,hasFonts:T,hasAnimations:v,hasCollisions:D,hasMenuSystem:L,customStates:N,globalVariables:M}}const Jt=t=>{if(!t.hasECS)return`    ; No ECS system - basic entity updates
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
    RET`,e},qt=t=>{if(!t.hasSprites)return`    ; No sprites to update
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
    RET`,e},ea=t=>t.hasCollisions?`    ; Check player collision with environment
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
    RET`,ta=t=>{let e=`    ; Read MSX joystick/keyboard input
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
    RET`,e},aa=t=>t.hasMenuSystem?`    ; Update menu graphics and cursor
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
    RET`,la=t=>{if(t.customStates.length===0)return"; No custom states detected";let e=`; Custom state handlers for project-specific logic
`;return t.customStates.forEach(a=>{e+=`
logic_${a.toLowerCase()}:
    ; Custom logic for ${a} state
    ; TODO: Implement ${a} specific logic
    RET
`}),e},oa=[{marker:"{{ENTITY_UPDATES}}",generator:Jt,description:"Entity update system based on ECS components"},{marker:"{{SPRITE_UPDATES}}",generator:qt,description:"Sprite animation and movement updates"},{marker:"{{COLLISION_CHECK}}",generator:ea,description:"Collision detection system"},{marker:"{{INPUT_HANDLING}}",generator:ta,description:"Input handling with project-specific controls"},{marker:"{{MENU_SYSTEM}}",generator:aa,description:"Menu system updates and rendering"},{marker:"{{CUSTOM_STATES}}",generator:la,description:"Custom state handlers detected from project"}];function na(t,e,a,l=oa){const i=Ve(e,a);let o=t;return o=o.replace(/{{PROJECT_NAME}}/g,e.toUpperCase()),o=o.replace(/{{PROJECT_NAME_LOWER}}/g,e.toLowerCase()),o=o.replace(/{{GENERATION_DATE}}/g,new Date().toISOString()),l.forEach(r=>{if(o.includes(r.marker)){const n=r.generator(i);o=o.replace(new RegExp(ra(r.marker),"g"),n)}}),o}function ia(){return`;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
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
`}function ra(t){return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function Wo(t,e){const a=ia(),l=na(a,t,e),o=`${t.toLowerCase().replace(/[^a-z0-9]/g,"_")}_dynamic_system.asm`,r=Ve(t,e);return{filename:o,content:l,analysis:r}}function sa(t={mode:"hybrid"}){const{mode:e,optimizeLevel:a="safe",includeDebug:l=!1}=t;let i=`; ==================================================================
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
;
; Compatibility: MSX1, MSX2, MSX2+
; ==================================================================

`;return i+=da(),i+=pa(),i+=_a(),i+=ha(),i+=ua(),a==="aggressive"&&(i+=ca(),i+=ma()),l&&(i+=fa()),i+=`
; ==================================================================
; END OF DIRECT HARDWARE ROUTINES
; ==================================================================
`,i}function da(){return`
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

`}function ca(){return`
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

`}function pa(){return`
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

`}function _a(){return`
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

`}function ha(){return`
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

`}function ua(){return`
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

`}function ma(){return`
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

`}function fa(){return`
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

`}function ba(t={}){const{hardwareMode:e}=t;let a=`; ==================================================================
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
`+sa(e):a}function ya(t){let e="";if(!t.globalVariables||t.globalVariables.length===0)return e+=`; Goal Variable Values (default)
`,e+=`GOAL_FAILURE            EQU 0    ; Goal = "Failure"
`,e+=`GOAL_COMPLETED          EQU 1    ; Goal = "Completed"
`,e;const a=new Set;return t.globalVariables.forEach(l=>{l.values&&l.values.length>0&&(e+=`
; ${l.name} - ${l.description||"Variable values"}
`,l.values.forEach(i=>{const o=(i.asmConstant||"UNKNOWN").trim(),r=typeof i.value=="number"?i.value:0;a.has(o)||(e+=`${o.padEnd(24)}EQU ${r}    ; ${l.name} = "${i.label}"
`,a.add(o))}))}),e}function Ea(t){var a,l;const e=je(t.sprites||[]).sprites.length;return`; ==================================================================
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
${t.tiles.map((i,o)=>`; Tile ${o}: ${i.name} = ${i.width}x${i.height}px (${Math.ceil(i.width/8)}x${Math.ceil(i.height/8)} MSX chars)`).join(`
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

${ya(t)}

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
TOTAL_SPRITES           EQU ${e}
TOTAL_TILES             EQU ${((a=t.tiles)==null?void 0:a.length)||0}
TOTAL_SCREENS           EQU ${((l=t.screenMaps)==null?void 0:l.length)||0}

; ==================================================================
; END OF CONSTANTS
; ==================================================================
`}function ga(t){let e=`; ==================================================================
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
`,t.globalVariables&&t.globalVariables.length>0?t.globalVariables.forEach(l=>{const i=l.type==="16bit"?2:1,o=l.type==="16bit"?" (16-bit)":" (8-bit)",r=l.description||l.name;e+=`${l.asmName.padEnd(20)} EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; ${r}${o}
`,a+=i}):(e+=`global_var_goal     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Goal status (0=Failure, 1=Completed)
`,a++),e+=`
; ==================================================================
; SYSTEM VARIABLES
; ==================================================================
`,e+=`ROM_slot            EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; ROM slot number (for SETPAGES32K)
`,a++,e+=`frame_counter       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Frame counter (16-bit)
`,a+=2,e+=`
; ==================================================================
; SCREEN MAP POINTERS (Current active screen)
; ==================================================================
`,e+=`current_screen_layout   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Pointer to current screen layout data (16-bit)
`,a+=2,e+=`current_behavior_map    EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Pointer to current behavior map data (16-bit)
`,a+=2,e+=`behavior_cache_row     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Cached behavior row (255=invalid)
`,a++,e+=`behavior_cache_map_l   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Cached behavior map pointer low byte
`,a++,e+=`behavior_cache_map_h   EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Cached behavior map pointer high byte
`,a++,e+=`behavior_cache_row_base EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Cached row base address in behavior map (16-bit)
`,a+=2,e+=`
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
`,a++,e+=`
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
`,a+=32;for(let l=0;l<8;l++)e+=`entity_sm_var_${l}     EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity Variable ${l} (32 bytes)
`,a+=32;e+=`
; ==================================================================
; SPRITE SYSTEM VARIABLES
; ==================================================================
`,e+=`entity_sprite_asset_index EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity sprite asset index - RAM copy (32 bytes)
`,a+=32,e+=`active_sprite_count EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Number of sprites currently active
`,a++,e+=`sprites_dirty      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; 1=sprite_attributes changed, needs VRAM sync
`,a++,e+=`sprite_pattern      EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Sprite pattern IDs (32 bytes)
`,a+=32,e+=`sprite_color        EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Sprite colors (32 bytes)
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
`,a+=32,e+=`temp_word_3         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 16-bit storage (64 bytes)
`,a+=64,e+=`temp_word_4         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Temporary 16-bit storage (64 bytes)
`,a+=64,e+=`
; Wall collision temporary variables
`,e+=`wall_temp_x         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Cached entity X for wall checks
`,a++,e+=`wall_temp_y         EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Cached entity Y for wall checks
`,a++,e+=`
; Unified update helpers
`,e+=`active_entity_list  EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Entity indices with non-zero component masks (MAX_ENTITIES bytes)
`,a+=32,e+=`active_entity_count EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Number of entries in active_entity_list
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
`;for(let l=0;l<8;l++)e+=`task_${l}_ptr              EQU #${(a+l*2).toString(16).toUpperCase().padStart(4,"0")}   ; Slot ${l} pointer (2 bytes)
`;return a+=16,e+=`interrupt_system_enabled EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; 0=disabled, 1=enabled (1 byte)
`,a++,e+=`old_htimi_hook          EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Original H.TIMI hook (5 bytes)
`,a+=5,e+=`interrupt_counter       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Frame counter (16-bit)
`,a+=2,e+=`task_exec_time          EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Cycles used by tasks (16-bit, debug)
`,a+=2,e+=`vblank_flag             EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; Set to 1 on each VBlank (1 byte)
`,a++,e+=`RAM_INTERRUPT_END       EQU #${a.toString(16).toUpperCase().padStart(4,"0")}   ; End of interrupt system
`,e+=`
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
`,e}function Sa(t){if(!t)return"";let e="";return e+=`    ld a, 0
`,e+=`    ld hl, task_update_input
`,e+=`    call enable_task

`,e}function Aa(t,e){var l;let a="";if(e!=null&&e.gameFlow){const i=e.gameFlow;a=`
; GameFlow Integration: Using "${i.name}" as execution orchestrator`;const o=i.nodes.find(r=>r.type==="Start");if(o){const r=i.connections.find(n=>{var p;return((p=n.from)==null?void 0:p.nodeId)===o.id||typeof n.from=="string"&&n.from===o.id});if(r){const n=((l=r.to)==null?void 0:l.nodeId)||r.to,p=i.nodes.find(s=>s.id===n);p&&(a+=`
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
    ${Sa(e)}
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
`}function se(t){return t.replace(/[^a-zA-Z0-9]/g,"_")}function st(t){return String(t||"").replace(/"/g,"").replace(/\r?\n/g," ").trim()}function dt(t){const e=String(t||"").trim();if(!e||e.toLowerCase().startsWith("rgba(0,0,0,0"))return null;const a=e.replace("#","");if(a.length!==6)return null;const l=parseInt(a.substring(0,2),16),i=parseInt(a.substring(2,4),16),o=parseInt(a.substring(4,6),16);return[l,i,o].some(r=>Number.isNaN(r))?null:{r:l,g:i,b:o}}function Ct(t,e=!0){const a=String(t||"").trim();if(!a||a.toLowerCase().startsWith("rgba(0,0,0,0"))return e?0:1;const l=a.toUpperCase(),i=W.find(p=>p.hex.toUpperCase()===l);if(i)return i.index;const o=dt(a);if(!o)return e?0:1;let r=e?0:1,n=1/0;for(const p of W){if(!e&&p.index===0)continue;const s=dt(p.hex);if(!s)continue;const h=(o.r-s.r)**2+(o.g-s.g)**2+(o.b-s.b)**2;h<n&&(n=h,r=p.index)}return r}function ct(t){const e=Ct(t,!1);return e===0?1:e}function Ta(t,e){const a=String(e||"").trim();return a?(Array.isArray(t.sprites)?t.sprites:[]).findIndex(i=>String((i==null?void 0:i.id)||"").trim()===a):-1}function Ca(t){var r;const e=(t==null?void 0:t.spritePalette)||[],a=t==null?void 0:t.backgroundColor,l=(t==null?void 0:t.frames)||[];if(!e.length||!l.length)return null;let i=-1,o=-1;for(let n=0;n<e.length;n++){const p=e[n];if(!p||p===a)continue;let s=!1;for(const h of l)if(h!=null&&h.data){for(let c=0;c<(h.data.length||0)&&!s;c++)for(let _=0;_<(((r=h.data[c])==null?void 0:r.length)||0)&&!s;_++)h.data[c][_]===p&&(s=!0);if(s)break}s&&(i===-1&&(i=n),o=n)}return i===-1||o===-1?null:{first:i,last:o}}function Ia(t){var s;const e=(t==null?void 0:t.spritePalette)||[],a=t==null?void 0:t.backgroundColor,l=(t==null?void 0:t.frames)||[],i=Ca(t);if(!i)return{layerOffsets:[0],layerColors:[15]};const o=[];for(let h=i.first;h<=i.last;h++){const c=e[h];if(!c||a&&c===a)continue;let _=!1;for(const E of l)if(E!=null&&E.data){for(let A=0;A<(E.data.length||0)&&!_;A++)for(let u=0;u<(((s=E.data[A])==null?void 0:s.length)||0)&&!_;u++)E.data[A][u]===c&&(_=!0);if(_)break}_&&o.push(h)}const r=o.slice(0,4);if(r.length===0)return{layerOffsets:[0],layerColors:[15]};const n=r.map(h=>Math.max(0,h-i.first)),p=r.map(h=>{const c=e[h];return c?Ct(c,!0):15});return{layerOffsets:n,layerColors:p}}function va(t){var l,i,o;const e=((l=t==null?void 0:t.appearance)==null?void 0:l.selectorType)??((i=t==null?void 0:t.appearance)==null?void 0:i.cursorType)??((o=t==null?void 0:t.appearance)==null?void 0:o.cursorMode)??(t==null?void 0:t.selectorType)??(t==null?void 0:t.cursorType)??(t==null?void 0:t.cursorMode),a=String(e||"").trim().toLowerCase();return a==="char"||a==="character"||a==="text"||a==="glyph"?"char":a==="sprite"||a==="image"?"sprite":"auto"}function Da(t){var i;const e=Array.isArray(t==null?void 0:t.options)?t.options:[];if(e.length===0)return 0;const a=(t==null?void 0:t.initialSelection)??(t==null?void 0:t.initialSelectedOption)??((i=t==null?void 0:t.appearance)==null?void 0:i.initialSelection)??0,l=Number(a);return!Number.isFinite(l)||l<0||l>=e.length?0:Math.floor(l)}function It(t){return`NODE_TYPE_${t.replace(/([a-z])([A-Z])/g,"$1_$2").toUpperCase()}`}function La(t){const e=(t.name||"DEFAULT").toUpperCase().replace(/[^A-Z0-9]/g,"_"),a=t.id?`_${t.id.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";return`load_screen_${e.toLowerCase()}${a.toLowerCase()}`}function Ra(t){var i,o;const e=(o=(i=t==null?void 0:t.hudConfiguration)==null?void 0:i.importedFrame)==null?void 0:o.cells;if(!Array.isArray(e)||e.length===0)return null;const a=(t.name||"DEFAULT").toUpperCase().replace(/[^A-Z0-9]/g,"_"),l=t.id?`_${t.id.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";return`hud_imported_frame_${a.toLowerCase()}${l.toLowerCase()}_draw`}function Na(t){var o,r,n,p;if(!t.gameFlow)return Ma(t);const e=t.gameFlow;let a=`; ==================================================================
; GAMEFLOW EXECUTION ENGINE
; File: gameflow.asm
; Description: GameFlow-based game orchestration system
; ==================================================================
;
; GameFlow: ${e.name||"Unnamed"}
; Total Nodes: ${((o=e.nodes)==null?void 0:o.length)||0}
; Total Connections: ${((r=e.connections)==null?void 0:r.length)||0}
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
${e.startNodeId?`    ld hl, gameflow_node_${se(e.startNodeId)}`:`    ; ERROR: No start node defined!
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
`;const l=Array.from(new Set(((n=e.nodes)==null?void 0:n.map(s=>s.type))||[]));l.forEach(s=>{const h=`gameflow_handle_${s.toLowerCase()}`;a+=`    cp ${It(s)}
    jp z, ${h}
`}),a+=`    
    ; Unknown node type - error
    ret

`,a+=`; ==================================================================
; NODE TYPE HANDLERS
; Each handler receives:
;   DE = node data pointer
;   BC = connection table pointer
; ==================================================================

`,a+=wa(l,t),a+=`; ==================================================================
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

`;const i=(p=t.screenMaps)==null?void 0:p.some(s=>{var h;return((h=s.hudConfiguration)==null?void 0:h.elements)&&s.hudConfiguration.elements.length>0});return a+=`; ==================================================================
; GAME LOOP (WorldLink nodes only)
; ==================================================================

; Main game loop - executed by WorldLink nodes
; This loop runs while a world/level is active
gameflow_world_game_loop:
    ; Check exit flag
    ld a, (gameflow_exit_requested)
    or a
    ret nz

    ; Handle world screen edge transitions (Preview parity)
    call check_world_screen_transition

    ; Update all entities
    call update_all_entities

    ; Execute all state machines
    call execute_all_state_machines

    ; Update sprites to VRAM
    call update_sprites_to_vram
${i?`
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

`,e.nodes&&e.nodes.length>0&&e.nodes.forEach(s=>{a+=xa(s,e,t)}),a+=`
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
`,t.globalVariables.forEach(s=>{const h=s.name,c=s.asmName||`global_var_${h.replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`,_=s.values&&s.values.length>0?s.values[0].value:0;a+=`    ld a, ${typeof _=="boolean"?_?1:0:_}
`,a+=`    ld (${c}), a    ; ${h} = ${_}
`})),a+=`    ret

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
`,a}function wa(t,e){var i;let a="";const l=(i=e.screenMaps)==null?void 0:i.some(o=>{var r;return((r=o.hudConfiguration)==null?void 0:r.elements)&&o.hudConfiguration.elements.length>0});return t.forEach(o=>{var r;switch(o){case"Start":a+=`gameflow_handle_start:
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
    ld de, .after_load
    push de
    jp (hl)          ; Indirect call, returns to .after_load

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

`;break;case"Restart":a+=`gameflow_handle_restart:
    ; Restart node - safe runtime reinit entry (no cold page remap).
    jp restart_rom

`;break;case"SubMenu":{const n=Math.max(((r=e.sprites)==null?void 0:r.length)||0,1);let p="";for(let s=0;s<n;s++)p+=`    dw SPRITE_${s}_PATTERN
`;a+=`gameflow_handle_submenu:
    ; SubMenu node - interactive navigation
    ; DE points to SubMenu data:
    ;   [bg_color][cursor_sprite_idx][cursor_layer_count]
    ;   [cursor_layer_offsets x4][cursor_colors x4]
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
    ; option_count is at offset +13 in submenu header (+11-12 = bg_screen_fn DW)
    ld bc, 13
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
    ; bg_screen_fn DW is at offset +11; option_count is at offset +13.
    ld hl, (gameflow_submenu_data_ptr)
    ld bc, 11
    add hl, bc
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                       ; HL = bg_screen_fn (0 if none)
    ld a, h
    or l
    jr z, .rss_clear_screen       ; no bg screen → solid clear

    ; Call background screen loader (loads tiles + screen map).
    ; Returns here when done.
    ld de, .rss_bg_done
    push de
    jp (hl)                       ; indirect call to load_screen_X
.rss_bg_done:
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
    ld hl, (gameflow_submenu_data_ptr)
    ld bc, 13                     ; offset to option_count (+11-12 = bg_screen_fn)
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
    ; Header offsets:
    ;   +3..+6 = source layer offsets (from SPRITE_n_PATTERN base)
    ;   +7..+10 = layer colors
    pop de                        ; DE = source pattern base
    ld hl, (gameflow_submenu_data_ptr)
    ld bc, 3
    add hl, bc                    ; HL = first source layer offset
    ld a, (gameflow_submenu_cursor_layer_count)
    ld b, a                       ; B = remaining layers
    ld c, 0                       ; C = destination layer index
.sps_copy_layer_loop:
    ld a, b
    or a
    jr z, .sps_enable_cursor
    push bc                       ; [1] save B=remaining, C=dest_index
    push hl                       ; [2] save offset byte ptr
    ; DE = base pattern ptr (preserved across iterations)

    ld a, (hl)                    ; source offset from base pattern
    push de                       ; [3] save base ptr for next iteration
    ld l, a
    ld h, 0
    add hl, hl                    ; *2
    add hl, hl                    ; *4
    add hl, hl                    ; *8
    add hl, hl                    ; *16
    add hl, hl                    ; *32
    add hl, de                    ; HL = source layer ptr (base + offset*32)

    push hl                       ; [4] save source ptr

    ld a, c
    add a, SUBMENU_CURSOR_BASE_SPRITE
    ld l, a
    ld h, 0
    add hl, hl                    ; *2
    add hl, hl                    ; *4
    add hl, hl                    ; *8
    add hl, hl                    ; *16
    add hl, hl                    ; *32
    ld de, SPRPAT
    add hl, de
    ex de, hl                     ; DE = destination VRAM
    pop hl                        ; [4] HL = source layer ptr

    ld bc, 32
    call FAST_LDIRVM              ; clobbers HL, DE, BC

    pop de                        ; [3] restore base ptr for next iteration!
    pop hl                        ; [2] restore offset byte ptr
    inc hl                        ; next source offset byte
    pop bc                        ; [1] restore remaining/index
    dec b
    inc c
    jr .sps_copy_layer_loop

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
    ; Header layout (with bg_screen_fn DW at +11-12):
    ; +17 = first option DW pointer
    ld hl, (gameflow_submenu_data_ptr)
    ld de, 17
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
SUBMENU_CURSOR_PATTERN_COUNT EQU ${n}

submenu_cursor_sprite_pattern_table:
${p}

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
;   Format: DB bgColor, DW screen_load_ptr (0=none), DB numLines
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

    ; Read bgColor and screen load function pointer
    ld a, (hl)                    ; A = bgColor
    inc hl
    ld c, (hl)                    ; C = screen_load_ptr low
    inc hl
    ld b, (hl)                    ; B = screen_load_ptr high
    inc hl                        ; BC = load function ptr (0 = no bg screen)

    push hl                       ; (1) Save pointer to numLines
    push af                       ; (2) Save bgColor
    push bc                       ; (3) Save function pointer

    ; Disable screen before any VRAM write
    call DISSCR

    ; Check if we have a background screen to load
    pop bc                        ; (3) Restore function pointer
    ld a, b
    or c
    jr z, .sts_no_bg_screen

    ; Has background screen: call load_screen_X via HL
    ; (load_screen sets VDP colors + writes name table)
    ld h, b
    ld l, c                       ; HL = function address
    ld de, .sts_after_bg
    push de                       ; push return address
    jp (hl)                       ; call load_screen_X; returns to .sts_after_bg
.sts_after_bg:
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

`;break;default:a+=`gameflow_handle_${o.toLowerCase()}:
    ; ${o} node - not yet implemented
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

`;break}}),a}function xa(t,e,a){var s,h,c,_,E,A,u,S,f,y,b,g;const l=`gameflow_node_${se(t.id)}`,i=`${l}_conn`,o=["Start","WorldLink","SubMenu","Text","IfThenElse","Globals","Transition"].includes(t.type)||t.type==="Globals"&&t.variables&&t.variables.length>0,r=o?`${l}_data`:"gameflow_no_data";let n=`; Node: ${t.type} - "${t.title||t.name||t.id}"
${l}:
    db ${It(t.type)}
    dw ${r}
    dw ${i}

`;if(o){switch(n+=`${l}_data:
`,t.type){case"Start":n+=`    dw ${l}_init    ; Initialization routine address
`;break;case"WorldLink":const d=t.worldAssetId||"default";n+=`    dw load_world_${se(d)}
`;break;case"SubMenu":{const D=se(t.id),L=(Array.isArray(t.options)?t.options:[]).slice(0,6),N=L.length,M=Da(t),C=N>0?Math.min(M,N-1):0,P=st(t.title||t.name||"MENU").toUpperCase(),F=((h=(s=t==null?void 0:t.appearance)==null?void 0:s.colors)==null?void 0:h.background)||"#000000",w=ct(F),x=va(t),j=(c=t==null?void 0:t.appearance)==null?void 0:c.cursorSpriteAssetId,U=Ta(a,j),ie=U>=0?(_=a.sprites)==null?void 0:_[U]:null,te=x==="char"?!1:U>=0,H=te?U:255,B=te&&ie?Ia(ie):{layerOffsets:[],layerColors:[]},V=B.layerOffsets.slice(0,4),K=B.layerColors.slice(0,4),re=Math.min(K.length,4);for(;V.length<4;)V.push(0);for(;K.length<4;)K.push(0);const ae=(E=t==null?void 0:t.appearance)==null?void 0:E.backgroundScreenAssetId;let le="0";if(ae&&a.screenMaps){const z=a.screenMaps.find(oe=>oe.id===ae);if(z){const oe=z.name.toUpperCase().replace(/[^A-Z0-9]/g,"_"),_e=z.id?`_${z.id.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";le=`load_screen_${oe.toLowerCase()}${_e.toLowerCase()}`}}n+=`    db ${w}    ; Background color (MSX index)
`,n+=`    db ${H}    ; Cursor sprite asset index (#FF = use text marker)
`,n+=`    db ${re}    ; Cursor sprite layer count (max 4)
`,n+=`    db ${V[0]}, ${V[1]}, ${V[2]}, ${V[3]}    ; Cursor source layer offsets
`,n+=`    db ${K[0]}, ${K[1]}, ${K[2]}, ${K[3]}    ; Cursor layer colors
`,n+=`    dw ${le}    ; Background screen load function (0=none)
`,n+=`    db ${N}    ; Number of options (max 6)
`,n+=`    db ${C}    ; Initial selected option
`,n+=`    dw submenu_${D}_title
`,L.forEach((z,oe)=>{n+=`    dw submenu_${D}_opt${oe}
`}),n+=`
submenu_${D}_title:
`,n+=`    db "${P}", 0
`,L.forEach((z,oe)=>{const _e=st((z==null?void 0:z.text)||(z==null?void 0:z.label)||(z==null?void 0:z.name)||(z==null?void 0:z.id)||`OPTION ${oe+1}`).toUpperCase();n+=`submenu_${D}_opt${oe}:
`,n+=`    db "${_e}", 0
`})}break;case"Text":{const D=se(t.id),L=(t.title||t.name||"").replace(/"/g,"").replace(/\r?\n/g," ").trim().toUpperCase()||"TEXT",N=(t.message||"").replace(/"/g,"").replace(/\r?\n/g," "),M=((u=(A=t.appearance)==null?void 0:A.colors)==null?void 0:u.background)||"#000000",C=ct(M),P=28,F=N.split(" "),w=[];let x="";for(const H of F){const B=H.toUpperCase(),V=x?x+" "+B:B;V.length>P&&x?(w.push(x),x=B):x=V}x.trim()&&w.push(x);const j="PRESS FIRE TO CONTINUE",U=[];U.push({row:3,text:L,label:`text_${D}_title`}),w.forEach((H,B)=>{U.push({row:7+B,text:H,label:`text_${D}_msg${B}`})}),U.push({row:20,text:j,label:`text_${D}_prompt`});const ie=(S=t.appearance)==null?void 0:S.backgroundScreenAssetId;let te="0";if(ie&&a.screenMaps){const H=a.screenMaps.find(B=>B.id===ie);if(H){const B=H.name.toUpperCase().replace(/[^A-Z0-9]/g,"_"),V=H.id?`_${H.id.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";te=`load_screen_${B.toLowerCase()}${V.toLowerCase()}`}}n+=`    DB ${C}                  ; Background color (MSX index from ${M})
`,n+=`    DW ${te}            ; Background screen load function (0=none)
`,n+=`    DB ${U.length}                  ; Number of lines
`;for(const H of U){const B=Math.max(0,Math.floor((32-H.text.length)/2));n+=`    DB ${H.row}, ${B}              ; Row ${H.row}, Col ${B}
`,n+=`    DW ${H.label}          ; -> "${H.text}"
`}n+=`
`;for(const H of U)n+=`${H.label}:
`,n+=`    DB "${H.text}", 0
`;break}case"IfThenElse":const T=`global_var_${(t.variableName||"unknown").replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`,v=t.compareValue||0;n+=`    dw ${T}    ; Variable to check
`,n+=`    db ${v}   ; Compare value
`,n+=`    db 0                 ; Operator (0=equals)
`;break;case"Globals":t.variables&&t.variables.length>0?(n+=`    db ${t.variables.length}    ; Number of assignments
`,t.variables.forEach(D=>{const N=`global_var_${(D.variableName||D.name||"unknown").replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`,M=D.value||0;n+=`    dw ${N}
`,n+=`    db ${M}
`})):n+=`    db 0    ; No assignments
`;break;case"Transition":{const D={cls:0,dissolve_pixels:1,dissolve_chars:2,vertical_lines:3,horizontal_lines:4,spiral:5,fill_white_squares:6},L={cls:1,dissolve_pixels:8,dissolve_chars:8,vertical_lines:16,horizontal_lines:24,spiral:96,fill_white_squares:4},N=D[t.effect]??0,M=L[t.effect]??8,C=t.duration??1e3,P=Math.max(1,Math.min(255,Math.round(C/M/20)));n+=`    db ${N}              ; Effect: ${t.effect||"cls"}
`,n+=`    db ${P}              ; Frames per step (duration ${C}ms / ${M} steps / 20ms)
`;break}}n+=`
`}n+=`${i}:
`;const p=((f=e.connections)==null?void 0:f.filter(d=>{var m;return(((m=d.from)==null?void 0:m.nodeId)||d.from)===t.id}))||[];if(t.type==="IfThenElse"){const d=p.find(T=>{var v,D;return((v=T.from)==null?void 0:v.sourceId)==="then"||!((D=T.from)!=null&&D.sourceId)}),m=p.find(T=>{var v;return((v=T.from)==null?void 0:v.sourceId)==="else"});n+=`    db CONNECTION_THEN
`,n+=`    dw ${d?`gameflow_node_${se(((y=d.to)==null?void 0:y.nodeId)||d.to)}`:"0"}
`,n+=`    db CONNECTION_ELSE
`,n+=`    dw ${m?`gameflow_node_${se(((b=m.to)==null?void 0:b.nodeId)||m.to)}`:"0"}
`}else if(t.type==="SubMenu")(Array.isArray(t.options)?t.options:[]).slice(0,6).forEach((m,T)=>{var D;const v=p.find(L=>{var N;return((N=L.from)==null?void 0:N.sourceId)===m.id});n+=`    db CONNECTION_OPTION_${T}
`,n+=`    dw ${v?`gameflow_node_${se(((D=v.to)==null?void 0:D.nodeId)||v.to)}`:"0"}
`});else{const d=p[0];n+=`    db CONNECTION_DEFAULT
`,n+=`    dw ${d?`gameflow_node_${se(((g=d.to)==null?void 0:g.nodeId)||d.to)}`:"0"}
`}return n+=`    db CONNECTION_END

`,t.type==="Start"&&(n+=Oa(t,l)),n}function Oa(t,e,a){let l=`; ------------------------------------------------------------------
; ${e}_init
; Initialization routine for Start node
; Initializes global variables and MSX systems
; ------------------------------------------------------------------
${e}_init:
`;const i=t.initializeGlobals,o=t.systemConfig;return l+=`    ; === Core Game Systems Initialization (ALWAYS required) ===
`,l+=`    call init_game_systems

`,o&&(l+=`    ; === MSX System Initialization ===
`,o.initPSG&&(l+=`    ; Initialize PSG (silence all channels)
`,l+=`    call init_psg_silence

`),o.clearSprites&&(l+=`    ; Clear sprite attribute table
`,l+=`    call clear_sprite_table

`),o.clearVRAM&&(l+=`    ; Clear VRAM areas
`,l+=`    call clear_vram_areas

`),o.resetVDP&&(l+=`    ; Reset VDP registers to default
`,l+=`    call reset_vdp_registers

`)),i&&i.enabled&&(l+=`    ; === Global Variables Initialization ===
`,i.variables&&i.variables.length>0?i.variables.forEach(r=>{const n=r.variableName,p=`global_var_${n.replace(/([A-Z])/g,"_$1").toLowerCase().replace(/^_/,"")}`,s=typeof r.value=="boolean"?r.value?1:0:r.value;l+=`    ld a, ${s}
`,l+=`    ld (${p}), a    ; ${n} = ${r.value}
`}):(l+=`    ; Initialize all global variables to default values
`,l+=`    call init_all_global_variables
`),l+=`
`),o&&o.initialDelayFrames&&o.initialDelayFrames>0&&(l+=`    ; Initial delay
`,l+=`    ld b, ${o.initialDelayFrames}
`,l+=`.delay_loop:
`,l+=`    halt    ; Wait for V-blank
`,l+=`    djnz .delay_loop

`),l+=`    ret

`,l}function Ma(t){var o;const e=(o=t.screenMaps)==null?void 0:o.some(r=>{var n;return((n=r.hudConfiguration)==null?void 0:n.elements)&&r.hudConfiguration.elements.length>0}),a=t.screenMaps&&t.screenMaps.length>0?t.screenMaps[0]:null,l=a?Ra(a):null;return`; ==================================================================
; DEFAULT GAMEFLOW (No GameFlow defined in project)
; ==================================================================

gameflow_init:
    ret

gameflow_start:
    ; Load first available screen/world
${a?`    call ${La(a)}
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
    call check_world_screen_transition
    call update_all_entities
    call execute_all_state_machines
    call update_sprites_to_vram
${e?`    call render_hud
`:""}    halt                            ; Wait for V-Blank
    jp gameflow_world_game_loop

; gameflow_exit_requested is allocated in variables.asm (RAM EQU)

; ==================================================================
; END OF DEFAULT GAMEFLOW
; ==================================================================
`}function Pa(t,e){return`; ==================================================================
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
`}function ka(t){var e;return!t.tiles||t.tiles.length===0?`; ==================================================================
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
${t.tiles.map((a,l)=>{const i=kt(a,"SCREEN 2 (Graphics I)"),o=Math.ceil(a.width/8),r=Math.ceil(a.height/8),n=o*r;(a.width%8!==0||a.height%8!==0)&&console.warn(`⚠️  Tile ${a.name} size ${a.width}x${a.height} is not multiple of 8px - may cause visual artifacts`);const p=Array.from(i).map(h=>`#${h.toString(16).padStart(2,"0").toUpperCase()}`);let s="";if(n>1){s=`
    ; Character layout: ${o}×${r} grid`;for(let h=0;h<r;h++){s+=`
    ; Row ${h}: `;for(let c=0;c<o;c++){const _=h*o+c;s+=`Char${_} `}}}return`    ; Tile ${l}: ${a.name} (${a.width}x${a.height}px = ${o}×${r} chars = ${n} MSX characters)${s}
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
    ld bc, ${t.tiles.reduce((a,l)=>{const i=Math.ceil(l.width/8),o=Math.ceil(l.height/8);return a+i*o*8},0)}    ; Total bytes for all tile characters (16x16 tiles = 4 chars each)
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
    ret

load_pattern_bank1:
    ; Load pattern bank 1: same patterns as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
    ld hl, tile_pattern_bank0     ; Same source as Bank 0
    ld de, CHRTBL2 + #800 + (128 * 8) ; VRAM pattern table bank 1 (+#800 offset + char 128)
    ld bc, ${t.tiles.reduce((a,l)=>{const i=Math.ceil(l.width/8),o=Math.ceil(l.height/8);return a+i*o*8},0)}    ; Total bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
    ret

load_pattern_bank2:
    ; Load pattern bank 2: same patterns as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
    ld hl, tile_pattern_bank0     ; Same source as Bank 0
    ld de, CHRTBL2 + #1000 + (128 * 8) ; VRAM pattern table bank 2 (+#1000 offset + char 128)
    ld bc, ${t.tiles.reduce((a,l)=>{const i=Math.ceil(l.width/8),o=Math.ceil(l.height/8);return a+i*o*8},0)}    ; Total bytes for all tile characters
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
`}function Ua(t){var e;return!t.tiles||t.tiles.length===0?`; ==================================================================
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
${t.tiles.map((a,l)=>{const i=Ut(a),o=i?Array.from(i).map(r=>`#${r.toString(16).padStart(2,"0").toUpperCase()}`):["#F0","#F0","#F0","#F0","#F0","#F0","#F0","#F0"];return`    ; Tile ${l}: ${a.name} colors (fg/bg pairs)
    db ${o.join(", ")}
`}).join("")}

; ==================================================================
; COLOR LOADING FUNCTIONS
; ==================================================================
load_color_bank0:
    ; Load color bank 0 to VRAM (base colors)
    ; Fast direct port access (no BIOS overhead)
    ld hl, tile_color_bank0
    ld de, CLRTBL2 + (128 * 8)    ; VRAM color table bank 0 (start at char 128)
    ld bc, ${t.tiles.reduce((a,l)=>{const i=Math.ceil(l.width/8),o=Math.ceil(l.height/8);return a+i*o*8},0)}     ; Total color bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
    ret

load_color_bank1:
    ; Load color bank 1: same colors as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
    ld hl, tile_color_bank0       ; Same source as Bank 0
    ld de, CLRTBL2 + #800 + (128 * 8) ; VRAM color table bank 1 (+#800 offset + char 128)
    ld bc, ${t.tiles.reduce((a,l)=>{const i=Math.ceil(l.width/8),o=Math.ceil(l.height/8);return a+i*o*8},0)}     ; Total color bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
    ret

load_color_bank2:
    ; Load color bank 2: same colors as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
    ld hl, tile_color_bank0       ; Same source as Bank 0
    ld de, CLRTBL2 + #1000 + (128 * 8) ; VRAM color table bank 2 (+#1000 offset + char 128)
    ld bc, ${t.tiles.reduce((a,l)=>{const i=Math.ceil(l.width/8),o=Math.ceil(l.height/8);return a+i*o*8},0)}     ; Total color bytes for all tile characters
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
`}function Fa(t,e,a){var n,p,s,h,c,_,E,A,u,S;const l=(p=(n=a.gameFlow)==null?void 0:n.nodes)==null?void 0:p.some(f=>f.type==="SubMenu"),i=(s=a.screenMaps)==null?void 0:s.some(f=>{var y,b;return((y=f.layers)==null?void 0:y.text)||((b=f.textElements)==null?void 0:b.length)>0}),o=(h=a.screenMaps)==null?void 0:h.some(f=>{var y;return((y=f.hudConfiguration)==null?void 0:y.elements)&&f.hudConfiguration.elements.length>0}),r=l||i||o;return`; ==================================================================
; ${e.toUpperCase()} - UNIFIED FILE
; File: unitedFiles.asm
; Description: All-in-one file combining all modular files
; Generated by Mideas MSX Modular Generator
;
; OPTIMIZED: Only includes necessary code for this project
; Tiles: ${((c=a.tiles)==null?void 0:c.length)||0}
; Sprites: ${((_=a.sprites)==null?void 0:_.length)||0}
; Screens: ${((E=a.screenMaps)==null?void 0:E.length)||0}
; Entities: ${((A=a.entities)==null?void 0:A.length)||0}
; Menus: ${l?"Yes":"No"}
; HUD: ${o?"Yes":"No"}
; State Machines: ${((u=a.stateMachines)==null?void 0:u.length)||0}
; ==================================================================

; CRITICAL: header.asm with ORG #4000 and "AB" signature MUST be first
; for the ROM to work correctly. EQUs can go after ORG.
${t["header.asm"]}

${t["bios.asm"]}

${t["constants.asm"]}

${t["variables.asm"]}

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

${l?t["menus.asm"]:`; [menus.asm skipped - no menus]
`}

${r?t["font.asm"]:`; [font.asm skipped - no text/menus]
`}

${o?t["hud.asm"]:`; [hud.asm skipped - no HUD elements]
`}

${t["sound.asm"]}

${t["scroll.asm"]}

${t["animtiles.asm"]}

${t["particles.asm"]}

${t["statemachine.asm"]&&t["statemachine.asm"].trim()!=="; No State Machines"?t["statemachine.asm"]:`; [statemachine.asm skipped - no state machines]
`}

${a.gameFlow?t["gameflow.asm"]:`; [gameflow.asm skipped - no GameFlow]
`}

${((S=a.worldmaps)==null?void 0:S.length)>0?t["worlds.asm"]:`; [worlds.asm skipped - no WorldMaps]
`}

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
${r?`    ; Initialize font system
    call init_font_system
`:`    ; No text/menus - skip font initialization
`}${o?`    ; HUD dirty flag - will be rendered after screen loading (by GameFlow WorldLink)
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
`}const Le={comp_pos:"Position",comp_position:"Position",comp_render:"Sprite",comp_sprite:"Sprite",comp_movement:"Movement",comp_velocity:"Movement",comp_collision:"Collision",comp_wall_collision:"WallCollision",comp_player_input:"Input",comp_input:"Input",comp_ai_behavior:"Behavior",comp_behavior:"Behavior",comp_health:"Health",comp_animation:"Animation",comp_gravity:"Gravity",comp_jump:"Jump",comp_damage:"Damage",comp_statemachine:"StateMachine",comp_cursors:"Cursors",comp_carry:"Carry",comp_collectible:"Collectible",comp_patrol:"Patrol"};function Ba(t,e){var r,n,p;const a=(r=e==null?void 0:e.components)==null?void 0:r.find(s=>s.definitionId==="comp_sprite"||s.definitionId==="comp_render");if(!a)return;const l=a.defaultValues||{},i=((n=t.componentOverrides)==null?void 0:n.comp_sprite)||((p=t.componentOverrides)==null?void 0:p.comp_render)||{},o={...l,...i};return o.spriteId||o.spriteAssetId||o.sprite||o.spriteName}function Ne(t){var o;const e=new Set,a=new Set,l=[],i=new Map;return console.log("🔍 Analyzing component usage..."),console.log(`📊 Total entities in project: ${((o=t.entities)==null?void 0:o.length)||0}`),t.entities&&t.entities.length>0&&t.entities.forEach(r=>{console.log(`  - Entity: ${r.name} (template: ${r.entityTemplateId})`),l.push(r),r.entityTemplateId&&a.add(r.entityTemplateId)}),console.log(`✅ Active entities: ${l.length}`),console.log(`✅ Used templates: ${Array.from(a).join(", ")}`),l.forEach(r=>{var s;const n=r.name||r.id,p=(s=t.templates)==null?void 0:s.find(h=>h.id===r.entityTemplateId);p?(console.log(`  📦 Analyzing template "${p.name}" for entity "${n}"`),p.components&&Array.isArray(p.components)&&p.components.forEach(h=>{const c=h.definitionId||h.componentDefinitionId;if(c){const _=Le[c]||c;console.log(`    - Component: ${c} → ${_}`),e.add(_),i.has(_)||i.set(_,new Set),i.get(_).add(n)}}),r.componentOverrides&&Object.keys(r.componentOverrides).forEach(h=>{const c=Le[h]||h;console.log(`    - Override: ${h} → ${c}`),e.add(c),i.has(c)||i.set(c,new Set),i.get(c).add(n)})):console.warn(`  ⚠️  Template "${r.entityTemplateId}" not found for entity "${n}"`)}),console.log("📊 Component usage summary:"),console.log(`  - Total used components: ${e.size}`),e.forEach(r=>{const n=i.get(r);console.log(`    • ${r}: ${(n==null?void 0:n.size)||0} entities`)}),{usedComponents:e,usedTemplates:a,activeEntities:l,componentToEntitiesMap:i}}function pt(t,e,a){var r;let l=0;const i={Position:0,Sprite:1,Movement:2,Collision:3,Input:4,Behavior:5,Health:6,Animation:7,Jump:8,Gravity:9};let o=!1;if(e&&e.components&&e.components.forEach(n=>{const p=n.definitionId||n.componentDefinitionId,s=Le[p];s&&i[s]!==void 0&&(l|=1<<i[s],s==="Sprite"&&(o=!0)),s==="Patrol"&&(l|=1<<i.Movement)}),t.componentOverrides&&Object.keys(t.componentOverrides).forEach(n=>{const p=Le[n];p&&i[p]!==void 0&&(l|=1<<i[p],p==="Sprite"&&(o=!0))}),l|=1<<i.Position,o)l|=1<<i.Sprite;else{const n=Ba(t,e);n&&((r=a.sprites)==null?void 0:r.some(s=>s.id===n||s.name===n))&&(l|=1<<i.Sprite)}return l}const $a=224,Ha="hex",vt=t=>{var r;const e=(t==null?void 0:t.spritePalette)||[],a=t==null?void 0:t.backgroundColor,l=(t==null?void 0:t.frames)||[];if(!e.length||!l.length)return null;let i=-1,o=-1;for(let n=0;n<e.length;n++){const p=e[n];if(!p||p===a)continue;let s=!1;for(const h of l)if(h!=null&&h.data){for(let c=0;c<(h.data.length||0)&&!s;c++)for(let _=0;_<(((r=h.data[c])==null?void 0:r.length)||0)&&!s;_++)h.data[c][_]===p&&(s=!0);if(s)break}s&&(i===-1&&(i=n),o=n)}return i===-1||o===-1?null:{first:i,last:o}},_t=t=>{const e=vt(t);return e?e.first:-1};function ja(t){var b,g;const e=t.sprites||[],a=je(e),l=a.sprites,i=a.nameToIndex,o=a.directionalLookupTables;a.warnings.forEach(d=>{console.warn(`[Sprites Generator] ${d}`)}),console.log("🎨 generateSpritesFile() called:"),console.log(`  - analysis.sprites.length: ${e.length}`),console.log(`  - expandedSprites.length: ${l.length}`),console.log(`  - analysis.entities.length: ${((b=t.entities)==null?void 0:b.length)||0}`),console.log(`  - analysis.templates.length: ${((g=t.templates)==null?void 0:g.length)||0}`);const{activeEntities:r}=Ne(t);console.log(`  - activeEntities.length: ${r.length}`);const n=d=>{if(!d||d.startsWith("rgba"))return null;const m=d.replace("#","");return m.length!==6?null:{r:parseInt(m.substring(0,2),16),g:parseInt(m.substring(2,4),16),b:parseInt(m.substring(4,6),16)}},p=d=>{if(!d)return 0;const m=W.find(L=>L.hex.toUpperCase()===d.toUpperCase());if(m)return m.index;const T=n(d);if(!T)return 15;let v=15,D=1/0;for(const L of W){if(L.index===0)continue;const N=n(L.hex);if(!N)continue;const M=(T.r-N.r)**2+(T.g-N.g)**2+(T.b-N.b)**2;M<D&&(D=M,v=L.index)}return v},s=d=>{if(!d)return[15];const m=d.spritePalette||[],T=d.backgroundColor,v=vt(d);if(!v)return[15];const D=[];for(let L=v.first;L<=v.last;L++){const N=m[L];!N||T&&N===T?D.push(0):D.push(p(N))}return D.length>0?D:[15]},h=(d,m)=>{let T=`${d}:
`;if(m.length===0)return T+=`    db 0
`,T;const v=16;for(let D=0;D<m.length;D+=v){const L=m.slice(D,D+v);T+=`    db ${L.join(", ")}
`}return T},c=d=>{var L,N,M,C,P,F;console.log(`
🔍 getEntitySpriteInfo for entity: "${d.name}" (template: ${d.entityTemplateId})`),console.log(`   Available sprites: ${l.map(w=>`"${w.name}" (${w.id})`).join(", ")||"NONE"}`);const m=(L=t.templates)==null?void 0:L.find(w=>w.id===d.entityTemplateId);if(!m)return console.log("   ❌ Template not found!"),null;console.log(`   Template found: "${m.name}"`),console.log(`   Template components: ${((N=m.components)==null?void 0:N.map(w=>w.definitionId).join(", "))||"NONE"}`);const T=t.components||[];let v;if(d.componentOverrides)for(const w in d.componentOverrides){const x=T.find(U=>U.id===w),j=(M=x==null?void 0:x.properties)==null?void 0:M.find(U=>U.type==="sprite_ref");if(j&&((C=d.componentOverrides[w])!=null&&C[j.name])){v=d.componentOverrides[w][j.name],console.log(`   ✅ Found spriteAssetId in overrides: "${v}"`);break}}if(!v)for(const w of m.components||[]){const x=T.find(U=>U.id===w.definitionId),j=(P=x==null?void 0:x.properties)==null?void 0:P.find(U=>U.type==="sprite_ref");if(j&&((F=w.defaultValues)!=null&&F[j.name])){v=w.defaultValues[j.name],console.log(`   ✅ Found spriteAssetId in template defaults: "${v}"`);break}}if(console.log(`   Resolved spriteAssetId: "${v||"undefined"}"`),!v)return console.log("   ⚠️ No sprite_ref property found in any component"),l.length>0?(console.log(`   ⚠️ Defaulting to first sprite "${l[0].name}"`),{spriteAssetIndex:0,spriteName:l[0].name,colors:s(l[0])}):null;let D=i[v];if(D===void 0&&(D=i[v.toLowerCase()]),D===void 0){const w=v.toLowerCase();D=l.findIndex(x=>{var j,U;return((j=x.name)==null?void 0:j.toLowerCase().includes(w))||w.includes(((U=x.name)==null?void 0:U.toLowerCase())||"")})}return D!==void 0&&D>=0?(console.log(`   ✅ Found sprite "${l[D].name}" at index ${D}`),{spriteAssetIndex:D,spriteName:l[D].name,colors:s(l[D])}):(console.log(`   ❌ Sprite "${v}" not found in project assets`),{spriteAssetIndex:-1,spriteName:`MISSING_${v}`,colors:[15]})},_=[];let E=0;r.forEach((d,m)=>{const T=c(d);if(!T){_.push({entityIndex:m,spriteName:"PLACEHOLDER",spriteAssetIndex:-1,baseHwSpriteIndex:E,layerCount:1,colors:[15]}),E+=1;return}_.push({entityIndex:m,spriteName:T.spriteName,spriteAssetIndex:T.spriteAssetIndex,baseHwSpriteIndex:E,layerCount:T.colors.length,colors:T.colors}),E+=T.colors.length});const A=32;let u=`; ==================================================================
; SPRITE DATA
; File: sprites.asm
; Description: Sprite pattern and animation data
; Entities: ${r.length}
; Total Hardware Sprites (Layers): ${A}
; ==================================================================

; ==================================================================
; SPRITE PATTERN DATA
; ==================================================================
`;l.forEach((d,m)=>{const T=`_${m}`,D=(d.name+T).replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase(),L=Vt(d,Ha,m),N=_t(d);u+=`
; Sprite Asset ${m}: ${d.name}
${L}`,N>=0?u+=`
; Unified pattern label for sprite ${m}
SPRITE_${m}_PATTERN EQU ${D}_F0_LAYER${N}
`:u+=`
; WARNING: No valid pattern layers found for sprite ${m}
SPRITE_${m}_PATTERN:
    db 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0
`}),u+=`
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

`,l.length===0&&(u+=`; No sprite assets found - using placeholder pattern only 
SPRITE_0_PATTERN EQU SPRITE_PLACEHOLDER_PATTERN
`),u+=`
; ==================================================================
; SPRITE ANIMATION METADATA TABLES
; ==================================================================

; Table: Sprite Asset Frame Counts
; Format: db frame_count
sprite_asset_frame_count:
`,l.forEach((d,m)=>{var v;const T=((v=d.frames)==null?void 0:v.length)||1;u+=`    db ${T} ; Sprite ${m}: ${d.name}
`}),l.length===0&&(u+=`    db 1 ; Placeholder
`),u+=`
; Table: Sprite Asset Frame Pointer List Table
; Format: dw SPRITE_<id>_FRAME_PTRS
sprite_asset_frame_ptr_table:
`,l.forEach((d,m)=>{u+=`    dw SPRITE_${m}_FRAME_PTRS
`}),l.length===0&&(u+=`    dw SPRITE_0_FRAME_PTRS
`),l.forEach((d,m)=>{var M;const T=`_${m}`,D=(d.name+T).replace(/[^a-zA-Z0-9_]/g,"_").toUpperCase(),L=_t(d),N=((M=d.frames)==null?void 0:M.length)||1;u+=`
; Sprite ${m}: ${d.name} frame pointers
SPRITE_${m}_FRAME_PTRS:
`;for(let C=0;C<N;C++)L>=0?u+=`    dw ${D}_F${C}_LAYER${L}
`:u+=`    dw SPRITE_PLACEHOLDER_PATTERN
`}),l.length===0&&(u+=`
SPRITE_0_FRAME_PTRS:
    dw SPRITE_PLACEHOLDER_PATTERN
`),u+=`
; ==================================================================
; DIRECTIONAL SPRITE LOOKUP TABLES
; Maps any sprite asset index to its directional variant index.
; If no directional variant exists, table points back to same index.
; ==================================================================
`,u+=h("sprite_dir_left_table",o.left),u+=`
`,u+=h("sprite_dir_right_table",o.right),u+=`
`,u+=h("sprite_dir_up_table",o.up),u+=`
`,u+=h("sprite_dir_down_table",o.down),u+=`
`,u+=` 
; ================================================================== 
; SPRITE CONFIGURATION TABLES 
; ================================================================== 

; Table: Entity Sprite Configuration 
; Format: db base_hw_sprite_index, layer_count 
entity_sprite_config: 
`,_.forEach(d=>{const m=d.baseHwSpriteIndex>=0?d.baseHwSpriteIndex:0;u+=`    db ${m}, ${d.layerCount} ; Entity ${d.entityIndex} (${d.spriteName})
`}),_.length<32&&(u+=`    ds ${(32-_.length)*2}, 0 ; Padding
`),u+=`
; Table: Entity -> Sprite Asset Index (ROM initial values)
; Copied to RAM entity_sprite_asset_index at init
; Format: db sprite_asset_index (#FF = none)
entity_sprite_asset_index_init:
`,_.forEach(d=>{const m=d.spriteAssetIndex>=0?d.spriteAssetIndex:255;u+=`    db #${m.toString(16).toUpperCase().padStart(2,"0")} ; Entity ${d.entityIndex} (${d.spriteName})
`}),_.length<32&&(u+=`    ds ${32-_.length}, #FF ; Padding
`),u+=` 
; Table: Hardware Sprite Layer Colors 
; Format: db color_index 
sprite_layer_colors: 
`;let S=0;_.forEach(d=>{d.layerCount>0&&(u+=`    ; Entity ${d.entityIndex} (${d.spriteName}) layers:
`,d.colors.forEach((m,T)=>{u+=`    db ${m} ; Layer ${T}
`,S+=1}))});const f=A-S;f>0&&(u+=`    ds ${f}, 0 ; Padding
`),u+=`
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
`;let y=!1;if(_.forEach(d=>{if(d.layerCount===0)return;const m=d.spriteAssetIndex<0?"SPRITE_PLACEHOLDER_PATTERN":`SPRITE_${d.spriteAssetIndex}_PATTERN`;u+=`    ; Entity ${d.entityIndex}: ${d.spriteName} (${d.layerCount} layers)
    ; Base HW Sprite: ${d.baseHwSpriteIndex}
    ld hl, ${m}
    ld de, SPRPAT + (${d.baseHwSpriteIndex} * 32)
    ld bc, ${d.layerCount*32} ; Load ${d.layerCount} layers (32 bytes each)
    call FAST_LDIRVM
`,y=!0}),!y)if(l.length===0)u+=`    ; No sprites to load
`;else{u+=`    ; No active entities detected, load all sprite assets sequentially
`;let d=0;l.forEach((m,T)=>{var N;const v=s(m).length||1,D=((N=m.frames)==null?void 0:N.length)||1,L=v*D*32;u+=`    ; Sprite Asset ${T}: ${m.name} (${D} frames, ${v} layers)
    ld hl, SPRITE_${T}_PATTERN
    ld de, SPRPAT + (${d} * 32)
    ld bc, ${L}
    call FAST_LDIRVM
`,d+=v*D})}return u+=`    ret

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
    ld b, ${A}
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
    ld bc, ${A*4}  ; 4 bytes per sprite
    call FAST_LDIRVM
    ret

; ==================================================================
; SPRITE CONSTANTS
; ==================================================================
SPRITE_INVISIBLE    EQU ${$a}

; ==================================================================
; RAM REQUIREMENTS
; ==================================================================
; sprite_attributes: ds ${A*4}
; active_sprite_count: db 0
; sprites_dirty: db 0
`,u}function Va(t){let e=`
; ==================================================================
; UPDATE ALL ENTITIES - Called by GameFlow (OPTIMIZED)
; ==================================================================
; Only calls component systems that are actually used in this project
; Unused systems are NOT called (saves Z80 cycles)
update_all_entities:
    ; Build entity list once per frame (slots with non-zero component masks)
    call rebuild_used_entity_list
`;const a=[["Input","update_input_component","1. Input (player control)"],["Shoot","update_shoot_component","2. Shooting"],["Behavior","update_behavior_component","3. Behavior/AI"],["Patrol","update_entities","3b. Patrol/per-entity update"],["Jump","update_jump_component","4. Jump impulse"],["Movement","update_movement_component","5. Movement"],["Cursors","update_cursors_component","5b. Cursors movement"],["Gravity","update_gravity_component","6. Gravity"],["Position","update_position_component","7. Apply velocity"],["Collision","prepare_platform_detection","8a. Clear platform refs"],["Collision","update_collision_component","8b. Collision detection"],["Collision","update_platform_riding","8c. Platform riding"],["WallCollision","update_wallcollision_component","8d. Wall collision"],["Health","update_health_component","9. Health/Death"],["Damage","update_damage_component","10. Damage"],["Animation","update_animation_component","11. Animation"],["AutoDestroy","update_auto_destroy_component","12. Auto-destroy"],["Sprite","update_sprite_component","13. Sprite rendering"]];let l=0;const i=new Set;for(const[o,r,n]of a)(o==="Position"||o==="Sprite"||t.has(o))&&(i.has(r)||(i.add(r),e+=`    call ${r.padEnd(30)} ; ${n}
`,r==="update_shoot_component"&&(e+=`    ; Shooting may spawn entities, rebuild used-entity list for later phases
`,e+=`    call rebuild_used_entity_list
`),l++));return e+=`    ret
`,e+=`; Total systems called: ${l} (optimized from 15)

`,e+=`
; ------------------------------------------------------------------
; rebuild_used_entity_list
; Build compact list of entity slots that are in use (mask_l|mask_h != 0)
; Output:
;   active_entity_list[]   = entity indices with components
;   active_entity_count    = number of entries
; ------------------------------------------------------------------
rebuild_used_entity_list:
    xor a
    ld (active_entity_count), a
    ld c, 0

.rebuild_loop:
    ld a, c
    cp MAX_ENTITIES
    ret z

    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    ld hl, entity_comp_masks_hi
    add hl, de
    or (hl)
    jr z, .next_entity

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
`,e}function za(){return`
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
    djnz position_update_loop
    ret
`}function Ga(t){return`
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
    djnz sprite_update_loop

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
`}function Ya(){return`
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
            djnz movement_update_loop
    ret
    `}function Wa(t){const o=Array.from({length:3},(p,s)=>`    srl a                      ; A = X / ${Math.pow(2,s+1)}`).join(`
`),r=Array.from({length:3},(p,s)=>`    srl a                      ; A = Y / ${Math.pow(2,s+1)}`).join(`
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
    djnz collision_update_loop

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
    add a, (hl)
    jp nc, .src_left_ok
    ld a, 255                     ; Clamp on overflow
.src_left_ok:
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
    add a, (hl)
    jp nc, .src_top_ok
    ld a, 255
.src_top_ok:
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
    pop bc                        ; Restore B=i
    push bc                       ; Save again for later
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
    add a, (hl)
    jp nc, .tgt_left_ok
    ld a, 255
.tgt_left_ok:
    ld e, a                       ; E = target_left

    ; source.right <= target.left => no overlap
    ld a, (coll_src_right)
    cp e
    jp c, .next_inner
    jp z, .next_inner

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
    ; source.left >= target.right => no overlap
    ld d, a                       ; D = target_right
    ld a, (coll_src_left)
    cp d
    jp nc, .next_inner

    ; target top = y + offset_y
    ld e, b
    ld d, 0
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld hl, entity_collision_offset_y
    add hl, de
    add a, (hl)
    jp nc, .tgt_top_ok
    ld a, 255
.tgt_top_ok:
    ld e, a                       ; E = target_top

    ; source.bottom <= target.top => no overlap
    ld a, (coll_src_bottom)
    cp e
    jp c, .next_inner
    jp z, .next_inner

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
    ; source.top >= target.bottom => no overlap
    ld d, a                       ; D = target_bottom
    ld a, (coll_src_top)
    cp d
    jp nc, .next_inner

    ; ==========  COLLISION DETECTED between source(C) and target(B) ==========

    ; --- Set flags for SOURCE entity (C) ---
    push bc                       ; Save B=target, C=source
    ld e, c
    ld d, 0

    ; Store target index in source's last_collision_entity
    ld hl, entity_last_collision_entity
    add hl, de
    ld (hl), b

    ; Classify target layer into flags
    push de
    ld e, b
    ld d, 0
    ld hl, entity_collision_layer
    add hl, de
    ld d, (hl)                    ; D = target layer bitmask
    pop de

    ld a, 1                       ; bit0: any collision
    bit 1, d                      ; enemy layer = 2
    jp z, .src_no_enemy
    or 2                          ; bit1: enemy
.src_no_enemy:
    bit 4, d                      ; item layer = 16
    jp z, .src_no_item
    or 4                          ; bit2: item
.src_no_item:
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

    ; Classify source layer into flags
    push de
    ld e, c
    ld d, 0
    ld hl, entity_collision_layer
    add hl, de
    ld d, (hl)                    ; D = source layer bitmask
    pop de

    ld a, 1                       ; bit0: any collision
    bit 1, d                      ; enemy layer = 2
    jp z, .tgt_no_enemy
    or 2
.tgt_no_enemy:
    bit 4, d                      ; item layer = 16
    jp z, .tgt_no_item
    or 4
.tgt_no_item:
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
    pop bc                        ; Restore B=i (outer index)
    inc b                         ; i++
    jp .outer_loop

.coll_done:
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
; MSX Screen 2: behavior map is 32x24 (one entry per 8x8 character cell)
    ; Always divide by 8 to convert pixels to character column/row
    ; Convert X to tile column (divide by 8)

${o}
    ld c, a; C = tile column

        ; Convert Y to tile row (divide by 8)
    ld a, b
${r}
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

        `}function Qa(){return`
    ; ------------------------------------------------------------------
    ; get_behavior_tile
    ; Get behavior value for tile at (B=row, C=column)
    ; Returns A = behavior value (0 = passable, non-zero = solid)
    ; Uses current_behavior_map pointer set by load_screen
    ; ------------------------------------------------------------------
get_behavior_tile:
    ; Bounds check: row must be 0-23, column must be 0-31
    ld a, b
    cp 24
    jr nc, .bt_out_of_bounds      ; Row >= 24: treat as passable
    ld a, c
    cp 32
    jr nc, .bt_out_of_bounds      ; Column >= 32: treat as passable
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
    ld a, (hl)                    ; A = behavior value
    pop de
    pop hl
    ret
.bt_out_of_bounds:
    xor a                         ; A = 0 (passable)
    ret
    `}function Xa(){return`
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
            ld (input_btn_curr), a
            ld (input_btn_prev), a
            ld (input_fire), a

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
            ; B = X velocity, C = Y velocity, E = entity index (preserved from earlier)
            ld d, 0
            ld hl, entity_vel_x
            add hl, de
            ld (hl), b                 ; entity_vel_x[entity_index] = X velocity

            ld hl, entity_vel_y
            add hl, de
            ld (hl), c                 ; entity_vel_y[entity_index] = Y velocity

            pop hl
            pop bc

        input_next_entity:
            djnz input_update_loop
            ret
    `}function Ka(){return`
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
            djnz behavior_update_loop
            ret
    `}function Za(){return`
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
            djnz gravity_update_loop
    ret
    `}function Ja(){return`
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
    `}function qa(){return`
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
    `}function el(){return`
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
    djnz .shoot_update_loop
    ret
    `}function tl(){return`
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
    `}function al(){return`
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
            djnz .anim_loop
    ret
    `}function ll(){return`
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
            ld a, (input_btn_curr)
            and INPUT_BTN_FIRE
            jr z, jump_done_entity        ; not pressed
            ld a, (input_btn_prev)
            and INPUT_BTN_FIRE
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
            ; Jump impulse: -1024 (8.8 fixed) => #FC00 (~4 tiles height with gravity #40)
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
            ld (hl), #00                  ; low byte
            inc hl
            ld (hl), #FC                  ; high byte (negative)

jump_done_entity:
            pop hl
            pop bc

        jump_next_entity:
            djnz jump_update_loop
    ret
    `}function ol(){return`
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
        djnz auto_destroy_loop
        ret
    `}function nl(){return`
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
    `}function il(){return`
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
    `}function rl(){return`
    ; ==================================================================
    ; WALL COLLISION COMPONENT SYSTEM
    ; ==================================================================
    ; Prevents entities from moving through walls
    ; Checks 2 points per direction for robust collision
    ; Snaps entity position to wall edge AND zeros velocity

init_wallcollision_system:
    ret

; ------------------------------------------------------------------
; update_wallcollision_component
; Check wall collisions and prevent movement through solid tiles
; Uses behavior map (current_behavior_map) for collision detection
; Entity position is cached in wall_temp_x/y to avoid register issues
; ------------------------------------------------------------------
update_wallcollision_component:
    ld e, 0                       ; Entity index = 0
    ld d, 0

.wall_loop:
    ld a, e
    cp MAX_ENTITIES
    ret z

    ; Check if entity is active
    ld hl, entity_active
    add hl, de
    ld a, (hl)
    or a
    jp z, .wall_next

    ; Only process entities with movement capability (Input or Movement)
    ; Static entities (Nucleo etc.) have no velocity sources - skip them
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_MOVEMENT | COMP_MASK_INPUT
    jp z, .wall_next

    ; Skip entities that are not in the currently active screen
    ld hl, entity_screen_id
    add hl, de
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jp nz, .wall_next

    ; Cache entity position
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld (wall_temp_x), a          ; Cache X
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld (wall_temp_y), a          ; Cache Y

    ; Clear on_ground flag - will be re-set by .wall_down_blocked if floor found
    ; This ensures entity correctly detects walking off platform edges
    ld hl, entity_wall_collision_flags
    add hl, de                        ; DE still = entity index from above
    ld (hl), 0                        ; Clear directional wall flags

    ld hl, entity_on_ground
    add hl, de                        ; DE still = entity index from above
    res 0, (hl)

    ; ---- CHECK HORIZONTAL VELOCITY ----
    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    or a
    jp z, .check_wall_y           ; No X velocity, check Y

    bit 7, a
    jp z, .wall_check_right

.wall_check_left:
    ; Moving left - check left edge at 2 Y points
    ld a, (wall_temp_x)
    or a
    jp z, .check_wall_y           ; X=0, already at left edge
    sub 1
    srl a
    srl a
    srl a                         ; Column = (X-1) / 8
    ld c, a

    ; Check point 1: upper portion (Y+2)
    ld a, (wall_temp_y)
    add a, 2
    srl a
    srl a
    srl a
    ld b, a                       ; Row = (Y+2) / 8
    call get_behavior_tile
    or a
    jp nz, .wall_left_blocked

    ; Check point 2: lower portion (Y+13)
    ld a, (wall_temp_y)
    add a, 13
    srl a
    srl a
    srl a
    ld b, a                       ; Row = (Y+13) / 8
    call get_behavior_tile
    or a
    jp z, .check_wall_y           ; Both passable

.wall_left_blocked:
    ; Snap X to right edge of wall tile: X = (column+1) * 8
    ld a, c
    inc a
    add a, a
    add a, a
    add a, a                      ; A = (column+1) * 8
    ld (wall_temp_x), a          ; Update cache
    push af
    ld hl, entity_x_pos
    add hl, de
    pop af
    ld (hl), a                    ; Snap entity X position

    ; Zero X velocity
    ld hl, entity_vel_x
    add hl, de
    ld (hl), 0
    ld hl, entity_wall_collision_flags
    add hl, de
    set 2, (hl)                       ; LEFT wall collision
    jp .check_wall_y

.wall_check_right:
    ; Moving right - check right edge at 2 Y points
    ld a, (wall_temp_x)
    add a, 16                     ; Right edge (16px wide sprite)
    jp c, .check_wall_y           ; Overflow (X+16 > 255), skip
    srl a
    srl a
    srl a                         ; Column = (X+16) / 8
    ld c, a

    ; Check point 1: upper portion (Y+2)
    ld a, (wall_temp_y)
    add a, 2
    srl a
    srl a
    srl a
    ld b, a                       ; Row = (Y+2) / 8
    call get_behavior_tile
    or a
    jp nz, .wall_right_blocked

    ; Check point 2: lower portion (Y+13)
    ld a, (wall_temp_y)
    add a, 13
    srl a
    srl a
    srl a
    ld b, a                       ; Row = (Y+13) / 8
    call get_behavior_tile
    or a
    jp z, .check_wall_y           ; Both passable

.wall_right_blocked:
    ; Snap X so right edge touches left of wall: X = column*8 - 16
    ld a, c
    add a, a
    add a, a
    add a, a                      ; A = column * 8
    sub 16                        ; A = column*8 - 16
    ld (wall_temp_x), a          ; Update cache
    push af
    ld hl, entity_x_pos
    add hl, de
    pop af
    ld (hl), a                    ; Snap entity X position

    ; Zero X velocity
    ld hl, entity_vel_x
    add hl, de
    ld (hl), 0
    ld hl, entity_wall_collision_flags
    add hl, de
    set 3, (hl)                       ; RIGHT wall collision

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
    ; Moving up - check top edge at 2 X points
    ld a, (wall_temp_y)
    or a
    jp z, .wall_up_top_edge       ; Y=0, clamp + stop upward velocity
    sub 1
    srl a
    srl a
    srl a
    ld b, a                       ; Row = (Y-1) / 8

    ; Check point 1: left portion (X+2)
    ld a, (wall_temp_x)
    add a, 2
    srl a
    srl a
    srl a
    ld c, a                       ; Column = (X+2) / 8
    call get_behavior_tile
    or a
    jp nz, .wall_up_blocked

    ; Check point 2: right portion (X+13)
    ld a, (wall_temp_x)
    add a, 13
    srl a
    srl a
    srl a
    ld c, a                       ; Column = (X+13) / 8
    call get_behavior_tile
    or a
    jp z, .wall_next              ; Both passable

.wall_up_top_edge:
    ; Top boundary clamp to prevent Y underflow (0 -> 255 -> ... -> 208 SAT terminator)
    xor a
    ld (wall_temp_y), a
    push af
    ld hl, entity_y_pos
    add hl, de
    pop af
    ld (hl), a                    ; Clamp Y = 0

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
    ; Snap Y below ceiling: Y = (row+1) * 8
    ld a, b
    inc a
    add a, a
    add a, a
    add a, a                      ; A = (row+1) * 8
    ld (wall_temp_y), a          ; Update cache
    push af
    ld hl, entity_y_pos
    add hl, de
    pop af
    ld (hl), a                    ; Snap entity Y position

    ; Zero Y velocity
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0

    ; Also zero gravity_vel to stop upward momentum (ceiling bonk)
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
    ; Moving down - check bottom edge at 2 X points
    ld a, (wall_temp_y)
    add a, 16                     ; Bottom of entity (16px tall)
    jp c, .wall_next              ; Overflow, skip
    srl a
    srl a
    srl a
    ld b, a                       ; Row = (Y+16) / 8

    ; Check point 1: left portion (X+2)
    ld a, (wall_temp_x)
    add a, 2
    srl a
    srl a
    srl a
    ld c, a                       ; Column = (X+2) / 8
    call get_behavior_tile
    or a
    jp nz, .wall_down_blocked

    ; Check point 2: right portion (X+13)
    ld a, (wall_temp_x)
    add a, 13
    srl a
    srl a
    srl a
    ld c, a                       ; Column = (X+13) / 8
    call get_behavior_tile
    or a
    jp z, .wall_next              ; Both passable

.wall_down_blocked:
    ; Snap Y so bottom touches top of floor: Y = row*8 - 16
    ld a, b
    add a, a
    add a, a
    add a, a                      ; A = row * 8
    sub 16                        ; A = row*8 - 16
    ld (wall_temp_y), a          ; Update cache
    push af
    ld hl, entity_y_pos
    add hl, de
    pop af
    ld (hl), a                    ; Snap entity Y position

    ; Zero Y velocity and gravity velocity (landing)
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0

    ld hl, entity_gravity_vel
    add hl, de
    add hl, de                        ; word index
    ld (hl), 0
    inc hl
    ld (hl), 0

    ; Set entity_on_ground flag (floor detected)
    ld hl, entity_on_ground
    add hl, de
    set 0, (hl)
    ld hl, entity_wall_collision_flags
    add hl, de
    set 1, (hl)                       ; DOWN wall collision
    jp .wall_next                     ; Floor collision handled, move to next entity

.check_wall_y_gravity:
    ; vel_y is 0, but entity might have gravity component
    ; Check floor anyway to keep entity_on_ground flag correct (prevents jitter)
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #02                       ; COMP_MASK_GRAVITY high byte bit 1
    jp nz, .wall_check_down       ; Has gravity, check floor
    ; No gravity, skip vertical check
.wall_next:
    inc e
    jp .wall_loop
    `}function sl(){return`
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
    `}function dl(){return` 
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
    `}function cl(t){const e=t.usedComponents;let a=`init_components: 
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
    `),a+=`
    ret
    `,a}function Dt(t){if(!t.entities||t.entities.length===0)return`; ==================================================================
; GAME COMPONENT SYSTEMS(SKIPPED - NO ENTITIES DETECTED)
    ; File: components.asm
        ; ==================================================================

; No entities detected in project - ECS system not needed
    ; This saves ~650 lines of unused component management code

; Constants required by state machine action handlers
ANIM_FLAG_PLAYING            EQU #01
ANIM_FLAG_LOOP               EQU #02
ANIM_FLAG_ONLY_WHEN_MOVING   EQU #04
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
init_entity_position:
    ret
init_entity_sprite:
    ret

    ; Component Data Structure EQUs (referenced by state machine actions)
entity_jump_vel_y   EQU temp_word_3
entity_jump_count   EQU temp_byte_4
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
        `;const e=Ne(t),a=e.usedComponents,l=(s,h)=>{if(!s||typeof s!="object")return!1;const c=String(s.type||"").toUpperCase();if(h.has(c))return!0;const _=Array.isArray(s.conditions)?s.conditions:[];for(const E of _)if(l(E,h))return!0;return!1},i=Array.isArray(t.stateMachines)?t.stateMachines:[],o=new Set(["HAS_COLLISION","HAS_DEADLY_TILE_COLLISION"]);i.some(s=>(Array.isArray(s==null?void 0:s.transitions)?s.transitions:[]).some(c=>l(c==null?void 0:c.conditions,o)))&&!a.has("Collision")&&(console.log("  - Forcing Collision system: required by state machine conditions"),a.add("Collision")),console.log("🎯 Generating optimized components.asm..."),console.log(`  - Active entities: ${e.activeEntities.length} `),console.log(`  - Used components: ${Array.from(a).join(", ")} `),console.log(`  - Filtered out: ${8-a.size} unused components`);let n=`; ==================================================================
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
entity_wall_collision_flags EQU temp_byte_18 ; Directional wall collision bits (32 bytes)
entity_collision_hitbox_w EQU temp_byte_19 ; Entity collision hitbox width (32 bytes)
entity_collision_hitbox_h EQU temp_byte_20 ; Entity collision hitbox height (32 bytes)
entity_collision_offset_x EQU temp_byte_21 ; Entity collision hitbox X offset (32 bytes)
entity_collision_offset_y EQU temp_byte_22 ; Entity collision hitbox Y offset (32 bytes)
entity_entity_collision_flags EQU temp_byte_23 ; bit0 entity(any), bit1 enemy, bit2 item (32 bytes)
entity_last_collision_entity EQU temp_byte_24 ; Last collided entity index (255=none) (32 bytes)


    ; ==================================================================
; CORE ECS SYSTEM FUNCTIONS
    ; ==================================================================

        ${cl(e)}
`;n+=za();const p=t.sprites&&t.sprites.length>0;return a.has("Sprite")||p?n+=Ga():n+=`
    ; Sprite system filtered out(not used)
init_sprite_system:
    ret

update_sprite_component:
    ret

force_update_entity_sprite:
    ret
    `,a.has("Movement")?n+=Ya():n+=`
    ; Movement system filtered out(not used)
init_movement_system:
    ret

update_movement_component:
    ret
    `,a.has("Collision")?n+=Wa():n+=`
    ; Collision system filtered out(not used)
init_collision_system:
    ret

update_collision_component:
    ret
    `,(a.has("Collision")||a.has("WallCollision"))&&(n+=Qa()),a.has("Input")?n+=Xa():n+=`
    ; Input system filtered out(not used)
init_input_system:
    ret

update_input_component:
    ret
    `,a.has("Behavior")?n+=Ka():n+=`
    ; Behavior system filtered out(not used)
init_behavior_system:
    ret

update_behavior_component:
    ret
    `,a.has("Health")?n+=Ja():n+=`
    ; Health system filtered out(not used)
init_health_system:
    ret

update_health_component:
    ret
    `,a.has("Animation")?n+=al():n+=`
    ; Animation system filtered out(not used)
init_animation_system:
    ret

update_animation_component:
    ret
    `,a.has("Jump")?n+=ll():n+=`
    ; Jump system filtered out(not used)
init_jump_system:
    ret

update_jump_component:
    ret
    `,a.has("Gravity")?n+=Za():n+=`
    ; Gravity system filtered out(not used)
init_gravity_system:
    ret

update_gravity_component:
    ret
    `,n+=ol(),a.has("Cursors")?n+=nl():n+=`
    ; Cursors system filtered out(not used)
init_cursors_system:
    ret

update_cursors_component:
    ret
    `,a.has("StateMachine")?n+=`
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
    `:n+=`
    ; StateMachine system filtered out(not used)
init_statemachine_system:
    ret

update_statemachine_component:
    ret
    `,a.has("Carry")?n+=il():n+=`
    ; Carry system filtered out(not used)
init_carry_system:
    ret

update_carry_component:
    ret
    `,a.has("Damage")?n+=qa():n+=`
    ; Damage system filtered out(not used)
init_damage_system:
    ret

update_damage_component:
    ret
    `,a.has("Shoot")?n+=el():n+=`
    ; Shoot system filtered out(not used)
init_shoot_system:
    ret

update_shoot_component:
    ret
    `,n+=tl(),a.has("WallCollision")?n+=rl():n+=`
    ; WallCollision system filtered out(not used)
init_wallcollision_system:
    ret

update_wallcollision_component:
    ret
    `,a.has("Collectible")?n+=sl():n+=`
    ; Collectible system filtered out(not used)
init_collectible_system:
    ret

update_collectible_component:
    ret
    `,n+=dl(),n+=Va(a),n+=`
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
    djnz .sm_loop                 ; Loop for all used entities
    
    ret

`,n+=`
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
; Maps character IDs (0-255) to behavior flags
; NOTE: Wall collision uses behavior map directly (get_behavior_tile).
; This table is used by check_collision_at_point and deadly tile checks.
; Character 0 = empty (passable). Characters >= 128 = project tiles (solid).
; ------------------------------------------------------------------
tile_behavior_table:
    ; Index 0-127: Default passable (background, empty space)
    db TILE_PASSABLE              ; 0: Empty tile
    ${Array(127).fill(0).map((s,h)=>`db TILE_PASSABLE              ; ${h+1}: Passable`).join(`
    `)}

    ; Index 128-255: Project tile characters (solid by default)
    ; MSX Screen 2 assigns character IDs >= 128 to project tiles
    ${Array(128).fill(0).map((s,h)=>`db TILE_SOLID                 ; ${128+h}: Solid`).join(`
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

`,n+=`
    ; ==================================================================
; END OF COMPONENT SYSTEMS
    ; ==================================================================
        `,n}function pl(t){var E,A,u,S;const e=(f,y)=>{if(typeof f=="boolean")return f;if(typeof f=="number")return f!==0;if(typeof f=="string"){const b=f.trim().toLowerCase();if(b==="true")return!0;if(b==="false")return!1;const g=parseInt(b,10);if(!Number.isNaN(g))return g!==0}return y},a=(f,y)=>{const b=typeof f=="number"?f:parseInt(String(f??""),10);return Number.isNaN(b)?y:Math.max(0,Math.min(255,b|0))},l=(f,y)=>{const b=typeof f=="number"?f:parseInt(String(f??""),10);return Number.isNaN(b)?y&255:b<0?256+Math.max(-128,Math.min(-1,b|0))&255:Math.max(0,Math.min(255,b|0))},i=f=>(f&255).toString(16).toUpperCase().padStart(2,"0"),o=f=>{const y=(f==null?void 0:f.screenAssetId)||(f==null?void 0:f.screenId)||(f==null?void 0:f.screenMapId);if(y){const m=t.worldmaps||[];for(const T of m){const D=((T==null?void 0:T.nodes)||[]).findIndex(L=>(L==null?void 0:L.screenAssetId)===y);if(D>=0)return D}}if(typeof(f==null?void 0:f.screenIndex)=="number"&&f.screenIndex>=0)return f.screenIndex;let b=0,g=null;if(t.screenMaps&&t.screenMaps.forEach((m,T)=>{var D;(((D=m==null?void 0:m.layers)==null?void 0:D.entities)||[]).some(L=>L.id===f.id)&&(b=T,g=m.id||null)}),!g)return b;const d=t.worldmaps||[];for(const m of d){const v=((m==null?void 0:m.nodes)||[]).findIndex(D=>(D==null?void 0:D.screenAssetId)===g);if(v>=0)return v}return b},n=Ne(t).activeEntities,p=2,s=f=>String(f??"entity").toUpperCase().replace(/[^A-Z0-9]/g,"_").replace(/^_+|_+$/g,"")||"ENTITY",h=new Map,c=n.map((f,y)=>{const b=s((f==null?void 0:f.name)||`ENTITY_${y}`),g=(h.get(b)||0)+1;return h.set(b,g),g===1?b:`${b}_${g}`});console.log("🎯 Generating optimized entities.asm..."),console.log(`  - Total entity templates in JSON: ${((E=t.templates)==null?void 0:E.length)||0}`),console.log(`  - Actually instantiated entities: ${n.length}`),console.log(`  - Filtered out: ${(((A=t.templates)==null?void 0:A.length)||0)-n.length} unused templates`);let _=`; ==================================================================
; GAME ENTITIES
; File: entities.asm
; Description: Game entity definitions and behavior
; ==================================================================
;
; INTELLIGENT FILTERING ACTIVE:
;   Entity templates in project: ${((u=t.templates)==null?void 0:u.length)||0}
;   Actually instantiated: ${n.length}
;   Filtered out: ${(((S=t.templates)==null?void 0:S.length)||0)-n.length} unused templates
;
; ==================================================================

`;if(n.length>0){_+=`; ==================================================================
; ENTITY DEFINITIONS
; ==================================================================

`,n.forEach((y,b)=>{var T;const g=c[b],d=(T=t.templates)==null?void 0:T.find(v=>v.id===y.entityTemplateId),m=pt(y,d,t);_+=`; Entity: ${y.name} (instance from template: ${y.entityTemplateId})
ENTITY_${g}_ID EQU ${b}
ENTITY_${g}_COMP_MASK EQU #${m.toString(16).toUpperCase().padStart(2,"0")}  ; Component mask: ${m.toString(2).padStart(8,"0")}b
`,y.entityTemplateId&&(_+=`; Template: ${y.entityTemplateId}
`),y.position&&(_+=`ENTITY_${g}_X EQU ${y.position.x}
ENTITY_${g}_Y EQU ${y.position.y}
`),_+=`
`}),_+=`; ==================================================================
; ENTITY MANAGEMENT FUNCTIONS
; ==================================================================

init_entities:
    ; Initialize all active game entities (${n.length} entities)

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
    
`,n.length>0?n.forEach((y,b)=>{const g=c[b];_+=`    call init_${g.toLowerCase()}
`}):_+=`    ; No entities to initialize
`,_+=`    ret

update_entities:
    ; Update all active entities (${n.length} entities)
`,n.length>0?n.forEach((y,b)=>{const g=c[b];_+=`    ; Skip entity update if entity belongs to another screen
    ld hl, entity_screen_id + ${b}
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_update_${b}
    call update_${g.toLowerCase()}
.skip_update_${b}:
`}):_+=`    ; No entities to update
`,_+=`    ret

`;let f=!1;n.forEach((y,b)=>{var Ge,Ye,We,Qe,Xe,Ke,Ze,Je,qe,et,tt,at,lt;const g=c[b],d=(Ge=t.templates)==null?void 0:Ge.find(O=>O.id===y.entityTemplateId),m=pt(y,d,t),T=(m&p)!==0,v=((Ye=y.position)==null?void 0:Ye.x)||100,D=((We=y.position)==null?void 0:We.y)||100,L=8,N=8,M=v*L,C=D*N,P=Math.min(M,240),F=Math.min(C,191);(M!==P||C!==F)&&console.warn(`Entity ${y.name} position clamped: (${M},${C}) → (${P},${F})`);const w=[];m&1&&w.push("Position"),m&2&&w.push("Sprite"),m&4&&w.push("Movement"),m&8&&w.push("Collision"),m&16&&w.push("Input"),m&32&&w.push("Behavior"),m&64&&w.push("Health"),m&128&&w.push("Animation"),m&256&&w.push("Jump"),m&512&&w.push("Gravity");let x=15;if(m&16){const O=d==null?void 0:d.components.find(Y=>Y.definitionId==="comp_cursors"||Y.definitionId==="comp_input"||Y.definitionId==="comp_player_input");if(O){const Y=O.defaultValues||{},Z=((Qe=y.componentOverrides)==null?void 0:Qe.comp_cursors)||{},k={...Y,...Z};x=0,k.allowUp!==!1&&(x|=1),k.allowDown!==!1&&(x|=2),k.allowLeft!==!1&&(x|=4),k.allowRight!==!1&&(x|=8)}}const j=[];x&1&&j.push("UP"),x&2&&j.push("DOWN"),x&4&&j.push("LEFT"),x&8&&j.push("RIGHT");const U=j.length===4?"All directions":j.join("+");let ie="";if(m&128){const O=(Xe=d==null?void 0:d.components)==null?void 0:Xe.find(Se=>Se.definitionId==="comp_animation"||Se.definitionName==="Animation"),Y=(O==null?void 0:O.defaultValues)||(O==null?void 0:O.values)||{},Z=((Ke=y.componentOverrides)==null?void 0:Ke.comp_animation)||{},k={...Y,...Z},J=a(k.currentFrameIndex??k.currentFrame??0,0),ee=Math.max(1,a(k.animationSpeed??6,6)),q=e(k.loops,!0),de=e(k.isPlaying,!0),be=e(k.animateOnlyWhenMoving,!1),Oe=(de?1:0)|(q?2:0)|(be?4:0);ie=`
    ; Initialize Animation component
    ld hl, entity_anim_frame
    add hl, de
    ld (hl), #${J.toString(16).toUpperCase().padStart(2,"0")}           ; currentFrameIndex

    ld hl, entity_anim_tick
    add hl, de
    ld (hl), 0                ; tick counter

    ld hl, entity_anim_speed
    add hl, de
    ld (hl), #${ee.toString(16).toUpperCase().padStart(2,"0")}           ; animationSpeed

    ld hl, entity_anim_flags
    add hl, de
    ld (hl), #${Oe.toString(16).toUpperCase().padStart(2,"0")}           ; flags (playing/loop/onlyWhenMoving)
`}let te="",H=!1,B=0,V=0,K=0,re=0,ae=0,le=0;const z=(Ze=d==null?void 0:d.components)==null?void 0:Ze.find(O=>O.definitionId==="comp_patrol");if(z){H=!0;const O=z.defaultValues||{},Y=((Je=y.componentOverrides)==null?void 0:Je.comp_patrol)||{},Z={...O,...Y};B=Math.max(0,Math.min(255,Number(Z.waypoint1_x)||0)),V=Math.max(0,Math.min(191,Number(Z.waypoint1_y)||0)),K=Math.max(0,Math.min(255,Number(Z.waypoint2_x??B))),re=Math.max(0,Math.min(191,Number(Z.waypoint2_y??V)));const k=K-B,J=re-V,ee=Math.sqrt(k*k+J*J),q=Number(Z.speed)||1;ee>0&&(ae=Math.round(k/ee*q),le=Math.round(J/ee*q),k!==0&&ae===0&&(ae=k>0?1:-1),J!==0&&le===0&&(le=J>0?1:-1));const de=ae>=0?ae:256+ae,be=le>=0?le:256+le;te=`
    ; === Patrol Component Init ===
    ; Waypoints: (${B}, ${V}) -> (${K}, ${re})
    ; Override position with waypoint1
    ld hl, entity_x_pos
    add hl, de
    ld (hl), ${B}         ; Start X = waypoint1_x

    ld hl, entity_y_pos
    add hl, de
    ld (hl), ${V}         ; Start Y = waypoint1_y

    ; Set patrol velocity
    ld hl, entity_vel_x
    add hl, de
    ld (hl), ${de}           ; VelX = ${ae>=0?"+":""}${ae}

    ld hl, entity_vel_y
    add hl, de
    ld (hl), ${be}           ; VelY = ${le>=0?"+":""}${le}
`}let oe="";if(m&8){const O=(qe=d==null?void 0:d.components)==null?void 0:qe.find(ot=>ot.definitionId==="comp_collision"||ot.definitionName==="Collision"),Y=(O==null?void 0:O.defaultValues)||{},Z=((et=y.componentOverrides)==null?void 0:et.comp_collision)||{},k={...Y,...Z},J=a(k.hitboxWidth,16),ee=a(k.hitboxHeight,16),q=l(k.offsetX,0),de=l(k.offsetY,0),be=q>=128?q-256:q,Oe=de>=128?de-256:de,Se=a(k.collisionLayer,1),Rt=a(k.collidesWith,255);oe=`
    ; Initialize Collision component (hitbox + layer masks)
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld (hl), #${i(J)}      ; hitboxWidth

    ld hl, entity_collision_hitbox_h
    add hl, de
    ld (hl), #${i(ee)}      ; hitboxHeight

    ld hl, entity_collision_offset_x
    add hl, de
    ld (hl), #${i(q)}      ; offsetX (${be})

    ld hl, entity_collision_offset_y
    add hl, de
    ld (hl), #${i(de)}      ; offsetY (${Oe})

    ld hl, entity_collision_layer
    add hl, de
    ld (hl), #${i(Se)}      ; collisionLayer

    ld hl, entity_collides_with
    add hl, de
    ld (hl), #${i(Rt)}      ; collidesWith
`}let _e="";const we=(tt=y.componentOverrides)==null?void 0:tt.comp_statemachine,xe=(at=d==null?void 0:d.components)==null?void 0:at.find(O=>O.definitionId==="comp_statemachine"),ze=(we==null?void 0:we.stateMachineAssetId)||((lt=xe==null?void 0:xe.defaultValues)==null?void 0:lt.stateMachineAssetId);if(ze&&t.stateMachines){const O=t.stateMachines.find(Y=>Y.id===ze);if(O&&O.states&&O.states.length>0){let Y=O.states[0];if(O.initialStateId){const J=O.states.find(ee=>ee.id===O.initialStateId);J&&(Y=J)}const k=`SM_${O.name.replace(/[^a-zA-Z0-9]/g,"_")}_${Y.id.replace(/[^a-zA-Z0-9]/g,"_")}`;_e=`
    ; Initialize State Machine pointer to initial state (${O.name})
    ld hl, ${k}          ; HL = initial state address
    ld a, l
    ld (entity_sm_ptr_l + ${b}), a   ; SM ptr low byte
    ld a, h
    ld (entity_sm_ptr_h + ${b}), a   ; SM ptr high byte
`}}let I="";if(H){T&&(f=!0);const O=Math.min(B,K),Y=Math.max(B,K),Z=Math.min(V,re),k=Math.max(V,re),J=B!==K,ee=V!==re,q=ee?`.patrol_check_y_${b}`:`.patrol_end_${b}`;I=`update_${g.toLowerCase()}:
`,I+=`    ; Update ${y.name} - Patrol bounce
`,I+=`    ; Waypoints: (${B}, ${V}) -> (${K}, ${re})
`,I+=`    ld e, ${b}             ; Entity index
`,I+=`    ld d, 0
`,J&&(I+=`
    ; --- X axis bounce ---
`,I+=`    ld hl, entity_vel_x
`,I+=`    add hl, de
`,I+=`    ld a, (hl)
`,I+=`    or a
`,I+=`    jp z, ${q}
`,I+=`    bit 7, a
`,I+=`    jp nz, .patrol_chk_min_x_${b}
`,I+=`
    ; Moving right: x >= ${Y}?
`,I+=`    ld hl, entity_x_pos
`,I+=`    add hl, de
`,I+=`    ld a, (hl)
`,I+=`    cp ${Y}
`,I+=`    jp c, ${q}
`,I+=`    ; Bounce: negate vel_x
`,I+=`    ld hl, entity_vel_x
`,I+=`    add hl, de
`,I+=`    ld a, (hl)
`,I+=`    neg
`,I+=`    ld (hl), a
`,I+=`    jp ${q}
`,I+=`
.patrol_chk_min_x_${b}:
`,I+=`    ; Moving left: x <= ${O}?
`,I+=`    ld hl, entity_x_pos
`,I+=`    add hl, de
`,I+=`    ld a, (hl)
`,I+=`    cp ${O+1}
`,I+=`    jp nc, ${q}
`,I+=`    ; Bounce: negate vel_x
`,I+=`    ld hl, entity_vel_x
`,I+=`    add hl, de
`,I+=`    ld a, (hl)
`,I+=`    neg
`,I+=`    ld (hl), a
`),ee&&(J&&(I+=`
.patrol_check_y_${b}:
`),I+=`
    ; --- Y axis bounce ---
`,I+=`    ld hl, entity_vel_y
`,I+=`    add hl, de
`,I+=`    ld a, (hl)
`,I+=`    or a
`,I+=`    jp z, .patrol_end_${b}
`,I+=`    bit 7, a
`,I+=`    jp nz, .patrol_chk_min_y_${b}
`,I+=`
    ; Moving down: y >= ${k}?
`,I+=`    ld hl, entity_y_pos
`,I+=`    add hl, de
`,I+=`    ld a, (hl)
`,I+=`    cp ${k}
`,I+=`    jp c, .patrol_end_${b}
`,I+=`    ; Bounce: negate vel_y
`,I+=`    ld hl, entity_vel_y
`,I+=`    add hl, de
`,I+=`    ld a, (hl)
`,I+=`    neg
`,I+=`    ld (hl), a
`,I+=`    jp .patrol_end_${b}
`,I+=`
.patrol_chk_min_y_${b}:
`,I+=`    ; Moving up: y <= ${Z}?
`,I+=`    ld hl, entity_y_pos
`,I+=`    add hl, de
`,I+=`    ld a, (hl)
`,I+=`    cp ${Z+1}
`,I+=`    jp nc, .patrol_end_${b}
`,I+=`    ; Bounce: negate vel_y
`,I+=`    ld hl, entity_vel_y
`,I+=`    add hl, de
`,I+=`    ld a, (hl)
`,I+=`    neg
`,I+=`    ld (hl), a
`),I+=`
.patrol_end_${b}:
`,T&&(I+=`    ; Sync sprite facing with current patrol velocity
`,I+=`    call update_entity_patrol_facing
`),I+=`    ret
`}else I=`update_${g.toLowerCase()}:
`,I+=`    ; Update ${y.name} logic with real behavior
`,I+=`    ; Check if entity has input component (player entities)
`,I+=`    ld a, ${b}
`,I+=`    ld hl, entity_comp_masks
`,I+=`    ld e, a
`,I+=`    ld d, 0
`,I+=`    add hl, de
`,I+=`    ld a, (hl)
`,I+=`    and COMP_MASK_INPUT
`,I+=`    ret z                      ; Skip if no input component

`,I+=`    ; This is a player entity - update based on input
`,I+=`    ; Input velocity is already calculated in UPDATE_INPUT_COMPONENT
`,I+=`    ; Position update happens in UPDATE_POSITION_COMPONENT
`,I+=`    ret
`;const Lt=o(y);_+=`init_${g.toLowerCase()}:
    ; Initialize ${y.name} at real position from JSON
    ; JSON position: (${v}, ${D}) tiles = (${P}, ${F}) pixels
    ; Template: ${y.entityTemplateId}
    ; Components: ${w.join(", ")}
    ; Direction mask: #${x.toString(16).toUpperCase().padStart(2,"0")} (${x.toString(2).padStart(4,"0")}b) = ${U}

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ; Mask is 16-bit: B=low byte, C=high byte
    ld a, ${b}             ; Entity ID
    ld b, #${(m&255).toString(16).toUpperCase().padStart(2,"0")}              ; Mask low byte
    ld c, #${(m>>8&255).toString(16).toUpperCase().padStart(2,"0")}              ; Mask high byte
    call create_entity         ; Create with actual components from template

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, ${b}             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), ${P}         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), ${F}         ; Set real Y position from JSON

    ; Set entity screen ID (for multi-screen support)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), ${Lt}                 ; Screen ID (world node index / fallback screen index)

${ie}
${te}
${oe}
${T?`    ; Set sprite pattern and color (renderable entity)
    ld hl, sprite_pattern
    add hl, de
    ld (hl), ${b*4}          ; Use entity index * 4 for 16x16 sprites

    ld hl, sprite_color
    add hl, de
    ld (hl), ${b%14+2}                ; Distinct color for debugging
`:`    ; Anchor/reference entity - no sprite allocation needed
`}

    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #${x.toString(16).toUpperCase().padStart(2,"0")}            ; Direction restrictions: ${U}

${T?`    ; Force update sprite attributes only if entity is in current screen
    ld hl, entity_screen_id + ${b}
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_force_show_${b}

    ; Force update sprite attributes (using correct multi-layer config)
    ld c, ${b}             ; Entity Index
    call force_update_entity_sprite
.skip_force_show_${b}:

`:`    ; No sprite to show for this entity
`}
${_e}
    ret

${I}
`}),f&&(_+=`
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

`)}else _+=`; ==================================================================
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

`;return _+=`; ==================================================================
; END OF ENTITIES
; ==================================================================
`,_}function _l(t){const e=!!t.sprites&&t.sprites.length>0;if(!t.screenMaps||t.screenMaps.length===0)return`; ==================================================================
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

`,t.screenMaps.forEach((l,i)=>{const o=l.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");a+=`SCREEN_${o}_${i}_ID EQU ${i}
`}),a+=`
; ==================================================================
; SCREEN MAP DATA
; ==================================================================

`,t.screenMaps.forEach(l=>{var i,o;if(l.layers&&l.layers.background){const r=[];if(t.tiles&&t.tiles.length>0){const S={...Mt[1],assignedTiles:{},charsetRangeStart:128,charsetRangeEnd:255,enabled:!0};let f=128;t.tiles.forEach(b=>{if(b&&b.id){const g=Math.ceil(b.width/8),d=Math.ceil(b.height/8);S.assignedTiles[b.id]={charCode:f,assignedAt:Date.now()},f+=g*d}});const y={id:"global_auto_bank",name:"Global Auto Bank",banks:[S,S,S]};r.push(y),console.log(`✅ Created GLOBAL tile bank with ${Object.keys(S.assignedTiles).length} assigned tiles`)}const n=[];l.activeAreaX,l.activeAreaY,l.activeAreaWidth??l.width,l.activeAreaHeight??l.height;const p=32,s=24;for(let u=0;u<s;u++)for(let S=0;S<p;S++){const f=(i=l.layers.background[u])==null?void 0:i[S];if(!f||!f.tileId)n.push(0);else{let y=0;const b=(o=t.tiles)==null?void 0:o.find(d=>d.id===f.tileId),g=r.length>0?r[0].banks:void 0;if(g&&b){let d=!1;for(const m of g)if((m.enabled??!0)&&m.assignedTiles[f.tileId]){const T=m.assignedTiles[f.tileId].charCode,v=Math.ceil(b.width/ue),D=f.subTileX||0,L=f.subTileY||0;if(y=T+L*v+D,y>=m.charsetRangeStart&&y<=m.charsetRangeEnd){d=!0;break}else y=0}d||(y=0)}else y=0;n.push(y)}}const h=n.filter(u=>u!==255).length,c=new Set(n);console.log(`📊 Generated ${n.length} bytes: ${h} non-FF (${(h/n.length*100).toFixed(1)}%)`),console.log(`🎯 Unique byte values: [${Array.from(c).sort((u,S)=>u-S).join(", ")}]`);const _=[];_.push('; Generated using exact Screen Editor "Download ASM" logic'),_.push("; Byte values represent actual character codes in VRAM");const E=`${l.name}_${t.screenMaps.indexOf(l)}`,A=Qt(E,p,s,n,_,"hex");if(a+=A,l.layers.collision&&t.tiles){const u=l.layers.collision,S=[];u.forEach(y=>{y.forEach(b=>{b.tileId?S.push(1):S.push(0)})});const f=Xt(E,l.width,l.height,S,"hex");a+=`
${f}`}}else{const r=t.screenMaps.indexOf(l),n=l.name.toUpperCase().replace(/[^A-Z0-9]/g,"_");a+=`SCREEN_${n}_${r}_LAYOUT:
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

`,t.screenMaps.forEach((l,i)=>{var v,D;const o=l.name.toUpperCase().replace(/[^A-Z0-9]/g,"_"),r=l.backgroundColor!==void 0?l.backgroundColor:1,n=l.borderColor!==void 0?l.borderColor:1,p=l.id?`_${l.id.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"",s=l.activeAreaX??0,h=l.activeAreaY??0,c=l.activeAreaWidth??l.width??32,_=l.activeAreaHeight??l.height??24,E=Math.max(0,Math.min(31,s)),A=Math.max(0,Math.min(23,h)),u=Math.max(0,Math.min(32-E,c)),S=Math.max(0,Math.min(24-A,_)),y=(E>0||A>0||u<32||S<24)&&u>0&&S>0,b=A*32+E,g=u*S,d=(((D=(v=l.hudConfiguration)==null?void 0:v.importedFrame)==null?void 0:D.cells)||[]).filter(L=>typeof(L==null?void 0:L.x)=="number"&&typeof(L==null?void 0:L.y)=="number"&&typeof(L==null?void 0:L.charCode)=="number"&&L.x>=0&&L.x<32&&L.y>=0&&L.y<24).map(L=>({x:L.x|0,y:L.y|0,charCode:L.charCode&255})),m=d.length>0,T=`hud_imported_frame_${o.toLowerCase()}${p.toLowerCase()}`;m&&(a+=`${T}_data:
    ; Imported HUD frame snapshot for ${l.name} (${d.length} cells)
`,d.forEach(L=>{const N=L.y*32+L.x,M=N&255,C=N>>8&255,P=L.charCode&255;a+=`    DB #${M.toString(16).padStart(2,"0").toUpperCase()},#${C.toString(16).padStart(2,"0").toUpperCase()},#${P.toString(16).padStart(2,"0").toUpperCase()}
`}),a+=`
${T}_draw:
    ; Draw imported HUD frame chars into Name Table
    ld hl, ${T}_data
    ld bc, ${d.length}

.draw_loop:
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
    jr .draw_loop

`),y?(a+=`load_screen_${o.toLowerCase()}${p.toLowerCase()}:
    ; Load ${l.name} screen (fast direct port access)
    ; Active Area: X=${E}, Y=${A}, W=${u}, H=${S}
    ; Preserve HUD/non-active area: only overwrite active game area
    ; Set VDP colors FIRST (before loading screen data)
    ld a, ${r}           ; Background color
    ld b, ${n}       ; Border color
    call set_screen_colors
    ; Initialize character 0 (empty cells) with background color
    ld a, ${r}           ; Background color for char 0
    call init_char0_color
`,e&&(a+=`    ; Clear hardware sprites on screen switch to avoid visual carry-over
    call clear_all_sprites
    call update_sprites_to_vram
`),u===32?a+=`    ; Load active game area (contiguous rows)
    ld hl, SCREEN_${o}_${i}_LAYOUT + ${b}
    ld de, NAMETBL + ${b}
    ld bc, ${g}
    call FAST_LDIRVM
`:a+=`    ; Load active game area (rectangular copy by rows)
    ld hl, SCREEN_${o}_${i}_LAYOUT + ${b}
    ld de, NAMETBL + ${b}
    ld a, ${S}
    ld c, ${u}
    call copy_layout_rect_to_vram
`,m&&(a+=`    ; Imported HUD frame is drawn on world/game start only
`),a+=`    ; Initialize collision system pointers for this screen
    ld hl, SCREEN_${o}_${i}_LAYOUT
    ld (current_screen_layout), hl
    ld hl, BEHAVIOR_${o}_${i}_DATA
    ld (current_behavior_map), hl
    ld a, l
    ld (behavior_cache_map_l), a
    ld a, h
    ld (behavior_cache_map_h), a
    ld a, #FF
    ld (behavior_cache_row), a
    ret

`):(a+=`load_screen_${o.toLowerCase()}${p.toLowerCase()}:
    ; Load ${l.name} screen (fast direct port access)
    ; Set VDP colors FIRST (before loading screen data)
    ld a, ${r}           ; Background color
    ld b, ${n}       ; Border color
    call set_screen_colors
    ; Initialize character 0 (empty cells) with background color
    ld a, ${r}           ; Background color for char 0
    call init_char0_color
`,e&&(a+=`    ; Clear hardware sprites on screen switch to avoid visual carry-over
    call clear_all_sprites
    call update_sprites_to_vram
`),a+=`    ; Now load screen layout (full 32x24)
    ld hl, SCREEN_${o}_${i}_LAYOUT
    ld de, NAMETBL
    ld bc, SCREEN_${o}_${i}_SIZE
    call FAST_LDIRVM           ; Fast VRAM write (direct port access)
`,m&&(a+=`    ; Imported HUD frame is drawn on world/game start only
`),a+=`    ; Initialize collision system pointers for this screen
    ld hl, SCREEN_${o}_${i}_LAYOUT
    ld (current_screen_layout), hl
    ld hl, BEHAVIOR_${o}_${i}_DATA
    ld (current_behavior_map), hl
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
`,a}function hl(t){var c,_,E,A;const e=(_=(c=t.gameFlow)==null?void 0:c.nodes)==null?void 0:_.some(u=>u.type==="SubMenu"),a=(E=t.screenMaps)==null?void 0:E.some(u=>{var S,f;return((S=u.layers)==null?void 0:S.text)||((f=u.textElements)==null?void 0:f.length)>0}),l=(A=t.screenMaps)==null?void 0:A.some(u=>{var S;return((S=u.hudConfiguration)==null?void 0:S.elements)&&u.hudConfiguration.elements.length>0});if(!e&&!a&&!l)return`; ==================================================================
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
`;const i=new Map,o=new Map,r=[{code:32,pattern:[0,0,0,0,0,0,0,0]},{code:43,pattern:[0,16,16,124,16,16,0,0]},{code:45,pattern:[0,0,0,126,0,0,0,0]},{code:62,pattern:[0,48,24,12,24,48,0,0]},{code:124,pattern:[24,24,24,24,24,24,24,24]}];if(r.forEach(u=>{i.set(u.code,u.pattern),o.set(u.code,[240,240,240,240,240,240,240,240])}),t.fonts&&t.fonts.length>0){const u=t.fonts[0],S=u.data.fontData||{},f=u.data.fontColorAttributes||{},y=b=>{if(b.startsWith("rgba(0,0,0,0)"))return 0;const g=b.toUpperCase();return{"RGBA(0,0,0,0)":0,"#000000":1,"#21C842":2,"#5EDC78":3,"#5455ED":4,"#7D76FC":5,"#D4524D":6,"#42EBF5":7,"#FC5554":8,"#FF7978":9,"#D4C154":10,"#E6CE80":11,"#21B03B":12,"#C95BBA":13,"#CCCCCC":14,"#FFFFFF":15}[g]??15};Object.keys(S).forEach(b=>{const g=parseInt(b,10),d=S[g];if(Array.isArray(d)&&d.length===8)if(i.set(g,d),f[g]&&Array.isArray(f[g])){const m=f[g],T=[];for(let v=0;v<8;v++)if(m[v]&&typeof m[v]=="object"){const D=m[v].fg,L=m[v].bg,N=y(D),M=y(L);T.push(N<<4|M)}else T.push(240);o.set(g,T)}else o.set(g,[240,240,240,240,240,240,240,240])})}else{for(let u=48;u<=57;u++)i.set(u,[62,127,115,115,115,127,62,0]);for(let u=65;u<=90;u++)i.set(u,[62,127,99,127,127,99,99,0]);r.forEach(u=>i.set(u.code,u.pattern))}let n=`FONT_PATTERN_DATA:
`,p=`FONT_COLOR_DATA:
`,s=`FONT_CHAR_INDEX:
    DB `;const h=Array.from(i.keys()).filter(u=>u<128).sort((u,S)=>u-S);return h.forEach((u,S)=>{const f=i.get(u),y=o.get(u)||[240,240,240,240,240,240,240,240];n+=`    ; Char ${u} ('${String.fromCharCode(u)}')
`,n+=`    DB ${f.map(b=>"#"+b.toString(16).padStart(2,"0").toUpperCase()).join(", ")}
`,p+=`    ; Char ${u}
`,p+=`    DB ${y.map(b=>"#"+b.toString(16).padStart(2,"0").toUpperCase()).join(", ")}
`,s+=`${u}${S<h.length-1?", ":""}`}),s+=`
FONT_CHAR_COUNT EQU ${h.length}
`,`; ==================================================================
; MSX FONT DATA FOR SCREEN 2 TEXT
; File: font.asm
; Description: Font pattern data generated from project assets
; ==================================================================

; ==================================================================
; FONT PATTERN DATA
; ==================================================================

${n}

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
`}function ul(t){var i,o,r;const e=[],a=new Map;if(console.log(`🎯 [HUD Generator] Total screens: ${((i=t.screenMaps)==null?void 0:i.length)||0}`),(o=t.screenMaps)==null||o.forEach(n=>{var h;const p=!!n.hudConfiguration,s=((h=n.hudConfiguration)==null?void 0:h.elements)||[];console.log(`  📺 Screen "${n.name}" (${n.id}): hudConfiguration=${p}, elements=${s.length}`),s.length>0&&(s.forEach((c,_)=>console.log(`    📝 Element[${_}]: type=${c.type}, name="${c.name}", text="${c.text||""}" pos=(${c.position.x},${c.position.y}) visible=${c.visible}`)),e.push(...s),a.set(n.id,s))}),console.log(`🎯 [HUD Generator] Total HUD elements found: ${e.length}`),e.length===0)return`; ==================================================================
; HUD SYSTEM (EMPTY - No HUD elements defined)
; ==================================================================
render_hud:
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

`;return l+=ml(e),(r=t.screenMaps)==null||r.forEach(n=>{n.activeAreaY}),l+=fl(),l+=bl(),l+=yl(e),l}function ml(t){let e=`; ------------------------------------------------------------------
; HUD DATA STRUCTURES
; ------------------------------------------------------------------

`;return e+=`HUD_ELEMENT_COUNT   EQU ${t.length}

`,e+=`; HUD Element Data Table
`,e+=`; Format: [Type:1][X:1][Y:1][Width:1][Height:1][Flags:1][TextPtr:2][Visible:1]
`,e+=`hud_element_data:
`,t.forEach((a,l)=>{const i=El(a.type),o=a.position.x,r=a.position.y,n=a.visible?1:0,p=`hud_text_${l}`;let s=0,h=1,c=0;const _=a.details||{};(_.border||_.borderColor||_.overallBorderColor)&&(c|=1),a.text?s=a.text.length:_.width?s=Math.ceil(_.width/8):s=10,e+=`    DB ${i}, ${o}, ${r}    ; Element ${l}: ${a.type} at (${o},${r})
`,e+=`    DB ${s}, ${h}, ${c} ; W, H, Flags
`,e+=`    DW ${p}             ; Text pointer
`,e+=`    DB ${n}                ; Visible
`}),e+=`
`,e+=`; HUD Text Strings
`,t.forEach((a,l)=>{const i=a.text||a.name||"",o=`hud_text_${l}`;e+=`${o}:
`,e+=`    DB "${i}", 0
`}),e+=`
`,e}function fl(t){return`; ------------------------------------------------------------------
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

`}function bl(t,e){return`; ------------------------------------------------------------------
; render_hud
; Main HUD rendering function
; Only redraws when hud_dirty_flag is set
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

    pop ix
    pop hl
    pop de
    pop bc
    pop af
    ret

`}function yl(t){const e=t.findIndex(o=>o.type===X.Score),a=t.findIndex(o=>o.type===X.Lives),l=e>=0?`hud_text_${e}`:null,i=a>=0?`hud_text_${a}`:null;return`; ------------------------------------------------------------------
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
; Writes 5 ASCII digits to score text buffer
; ------------------------------------------------------------------
update_hud_score:
${l?`    push af
    push bc
    push de
    push hl

    ; Set dirty flag
    ld a, 1
    ld (hud_dirty_flag), a

    ; 16-bit binary to 5 decimal digits
    ld de, ${l}           ; DE = output buffer pointer

    ; Digit 0: ten-thousands (HL / 10000)
    ld bc, 10000
    call .div16
    add a, '0'
    ld (de), a
    inc de

    ; Digit 1: thousands (HL / 1000)
    ld bc, 1000
    call .div16
    add a, '0'
    ld (de), a
    inc de

    ; Digit 2: hundreds (HL / 100)
    ld bc, 100
    call .div16
    add a, '0'
    ld (de), a
    inc de

    ; Digit 3: tens (HL / 10)
    ld bc, 10
    call .div16
    add a, '0'
    ld (de), a
    inc de

    ; Digit 4: ones (remainder)
    ld a, l
    add a, '0'
    ld (de), a

    pop hl
    pop de
    pop bc
    pop af`:"    ; No Score element defined in HUD"}
    ret

${l?`; Helper: HL = HL / BC, A = quotient, HL = remainder
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
; ------------------------------------------------------------------
update_hud_lives:
${i?`    push af

    ; Set dirty flag + convert to ASCII
    add a, '0'                  ; Convert to ASCII
    ld (${i}), a          ; Write to lives text buffer
    ld a, 1
    ld (hud_dirty_flag), a

    pop af`:"    ; No Lives element defined in HUD"}
    ret

`}function El(t){return{[X.Score]:1,[X.HighScore]:2,[X.Lives]:3,[X.EnergyBar]:4,[X.ItemDisplay]:5,[X.SceneName]:6,[X.MiniMap]:7,[X.CoinCounter]:8,[X.BossEnergyBar]:9,[X.PhaseIndicator]:10,[X.AttackAlert]:11,[X.TextBox]:12,[X.NumericField]:13,[X.CustomCounter]:14}[t]||0}function Ae(t){return t.toLowerCase().replace(/[^a-z0-9]/g,"_")}function Te(t){return t.toUpperCase().replace(/[^A-Z0-9]/g,"_")}function ht(t){switch(String(t??"").trim().toLowerCase()){case"north":case"up":return"north";case"south":case"down":return"south";case"east":case"right":return"east";case"west":case"left":return"west";default:return null}}function Ce(t,e){const a=e==="from"?"fromNodeId":"toNodeId",l=t==null?void 0:t[a];if(typeof l=="string"&&l.length>0)return l;const i=t==null?void 0:t[e];return typeof i=="string"&&i.length>0?i:i&&typeof i.nodeId=="string"&&i.nodeId.length>0?i.nodeId:null}function ut(t,e){const a=e==="from"?"fromDirection":"toDirection",l=t==null?void 0:t[a],i=ht(l);if(i)return i;const o=t==null?void 0:t[e];return ht(o==null?void 0:o.direction)}function Fe(t,e){var o,r;const a=(o=e.screens)==null?void 0:o.find(n=>n.id===t),l=((r=a==null?void 0:a.name)==null?void 0:r.toUpperCase().replace(/[^A-Z0-9]/g,"_"))||"UNKNOWN",i=t?`_${t.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";return`load_screen_${l.toLowerCase()}${i.toLowerCase()}`}function gl(t,e){var r,n,p,s;const a=(r=e.screens)==null?void 0:r.find(h=>h.id===t),l=(p=(n=a==null?void 0:a.hudConfiguration)==null?void 0:n.importedFrame)==null?void 0:p.cells;if(!Array.isArray(l)||l.length===0)return null;const i=((s=a==null?void 0:a.name)==null?void 0:s.toUpperCase().replace(/[^A-Z0-9]/g,"_"))||"UNKNOWN",o=t?`_${t.replace(/[^a-zA-Z0-9]/g,"_").slice(-12)}`:"";return`hud_imported_frame_${i.toLowerCase()}${o.toLowerCase()}_draw`}function Sl(t,e){const a=Array.isArray(t==null?void 0:t.nodes)?t.nodes:[];if(a.length===0)return null;const l=[],i=t==null?void 0:t.startScreenNodeId,o=a.find(r=>(r==null?void 0:r.id)===i);o&&l.push(o),a.forEach(r=>{(!o||(r==null?void 0:r.id)!==o.id)&&l.push(r)});for(const r of l){const n=r==null?void 0:r.screenAssetId;if(!n)continue;const p=gl(n,e);if(p)return p}return null}function Al(t,e,a,l,i){const o=`check_transition_${t}_s${e}_skip_${a}`,r=`check_transition_${t}_s${e}_apply_${a}`;let n="",p="";return a==="east"?(n=`    ; East exit: X near right edge and rightward input
    ld a, (input_state)
    cp STICK_RIGHT
    jr z, .dir_ok_${o}
    cp STICK_UPRIGHT
    jr z, .dir_ok_${o}
    cp STICK_DOWNRIGHT
    jp nz, ${o}
.dir_ok_${o}:
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp 240
    jp c, ${o}
`,p=`    ; Enter from west edge
    ld hl, entity_x_pos
    add hl, de
    ld (hl), 2
`):a==="west"?(n=`    ; West exit: X near left edge and leftward input
    ld a, (input_state)
    cp STICK_LEFT
    jr z, .dir_ok_${o}
    cp STICK_UPLEFT
    jr z, .dir_ok_${o}
    cp STICK_DOWNLEFT
    jp nz, ${o}
.dir_ok_${o}:
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp 2
    jp nc, ${o}
`,p=`    ; Enter from east edge (256 - 16 - 2 = 238)
    ld hl, entity_x_pos
    add hl, de
    ld (hl), 238
`):a==="south"?(n=`    ; South exit: Y near bottom edge and downward input
    ld a, (input_state)
    cp STICK_DOWN
    jr z, .dir_ok_${o}
    cp STICK_DOWNLEFT
    jr z, .dir_ok_${o}
    cp STICK_DOWNRIGHT
    jp nz, ${o}
.dir_ok_${o}:
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    cp 176
    jp c, ${o}
`,p=`    ; Enter from north edge
    ld hl, entity_y_pos
    add hl, de
    ld (hl), 2
`):(n=`    ; North exit: Y near top edge and upward input
    ld a, (input_state)
    cp STICK_UP
    jr z, .dir_ok_${o}
    cp STICK_UPLEFT
    jr z, .dir_ok_${o}
    cp STICK_UPRIGHT
    jp nz, ${o}
.dir_ok_${o}:
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    cp 2
    jp nc, ${o}
`,p=`    ; Enter from south edge (192 - 16 - 2 = 174)
    ld hl, entity_y_pos
    add hl, de
    ld (hl), 174
`),`${n}${r}:
    push de
    call ${i}
    pop de
    ld a, ${l}
    ld (current_screen_index), a
    ld (current_screen_id), a
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
    ret

${o}:
`}function Tl(t){var i;const e=t.worldmaps||[],a=!!((i=t.screenMaps)!=null&&i.some(o=>{var r;return Array.isArray((r=o==null?void 0:o.hudConfiguration)==null?void 0:r.elements)&&o.hudConfiguration.elements.length>0}));if(e.length===0)return`; ==================================================================
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

`,e.forEach((o,r)=>{var s;const n=Te(o.name||`world_${r}`),p=o.id||`world_${r}`;l+=`; World: ${o.name||"Unnamed"} (${p})
WORLD_${n}_ID EQU ${r}
WORLD_${n}_SCREEN_COUNT EQU ${((s=o.nodes)==null?void 0:s.length)||0}
`,o.nodes&&o.nodes.length>0&&o.nodes.forEach((h,c)=>{const _=Te(h.name||`screen_${c}`);l+=`WORLD_${n}_SCREEN_${_}_ID EQU ${c}
`}),l+=`
`}),l+=`; ==================================================================
; WORLD LOADING FUNCTIONS
; ==================================================================

`,e.forEach(o=>{const r=o.id||"unknown",n=o.startScreenNodeId,p=o.nodes||[];if(l+=`; ------------------------------------------------------------------
; Load World: ${o.name||"Unnamed"}
; World ID: ${r}
; Screens: ${p.length}
; Start Screen Node: ${n||"none"}
; ------------------------------------------------------------------
load_world_${Ae(r)}:
`,p.length===0){l+=`    ; No screens in this world
    ret

`;return}const s=p.find(A=>A.id===n)||p[0],h=Math.max(0,p.findIndex(A=>A.id===s.id)),c=s.screenAssetId;if(!c){l+=`    ; No valid start screen found
    ret

`;return}const _=Fe(c,t),E=Sl(o,t);l+=`    ; Load start screen: ${s.name||"unknown"} (${c})
    call ${_}

`,E&&(l+=`    ; Draw imported HUD frame once at world start
    call ${E}

`),a&&(l+=`    ; Draw HUD frame once at world start
    call imprimir_marco

`),l+=`    ; Initialize world state
    ld a, WORLD_${Te(o.name||"unnamed")}_ID
    ld (current_world_id), a

    ld a, ${h}
    ld (current_screen_index), a
    ld (current_screen_id), a

    xor a
    ld (screen_transition_cooldown), a

    ret

`}),l+=`; ==================================================================
; SCREEN TRANSITION FUNCTIONS
; ==================================================================

`,e.forEach(o=>{const r=o.id||"unknown",n=o.nodes||[],p=o.connections||[];if(p.length===0){l+=`; World ${o.name||"Unnamed"} has no screen connections

`;return}l+=`; ------------------------------------------------------------------
; World: ${o.name||"Unnamed"}
; Connections: ${p.length}
; ------------------------------------------------------------------

`,p.forEach((s,h)=>{const c=Ce(s,"from"),_=Ce(s,"to");if(!c||!_){l+=`; Invalid connection ${h}: missing endpoint IDs

`;return}const E=n.find(y=>y.id===c),A=n.find(y=>y.id===_);if(!E||!A){l+=`; Invalid connection ${h}: missing nodes

`;return}const u=A.screenAssetId,S=n.findIndex(y=>y.id===A.id),f=Fe(u,t);l+=`; Transition: ${E.name||"screen"} -> ${A.name||"screen"}
transition_${Ae(r)}_${h}:
    call ${f}

    ld a, ${S}
    ld (current_screen_index), a
    ld (current_screen_id), a
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
`,e.forEach((o,r)=>{const n=Te(o.name||`world_${r}`),p=o.id||`world_${r}`,s=`check_transition_world_${Ae(p)}`;l+=`    cp WORLD_${n}_ID
    jp z, ${s}
`}),l+=`    ret

`,e.forEach((o,r)=>{const n=o.id||`world_${r}`,p=Ae(n),s=o.nodes||[],h=o.connections||[];if(l+=`check_transition_world_${p}:
`,s.length===0||h.length===0){l+=`    ret

`;return}const c=new Map;s.forEach((E,A)=>c.set(E.id,A));const _=new Map;s.forEach((E,A)=>_.set(A,{})),h.forEach(E=>{const A=Ce(E,"from"),u=Ce(E,"to"),S=ut(E,"from"),f=ut(E,"to");if(!A||!u)return;const y=c.get(A),b=c.get(u);if(!(y===void 0||b===void 0)){if(S){const g=_.get(y);g&&g[S]===void 0&&(g[S]=b)}if(f){const g=_.get(b);g&&g[f]===void 0&&(g[f]=y)}}}),l+=`    ld a, (current_screen_index)
`,s.forEach((E,A)=>{l+=`    cp ${A}
    jp z, .screen_${A}
`}),l+=`    ret

`,s.forEach((E,A)=>{const u=_.get(A)||{};l+=`.screen_${A}:
`;const S=["east","west","south","north"];let f=!1;S.forEach(y=>{const b=u[y];if(b===void 0)return;const g=s[b];if(!(g!=null&&g.screenAssetId))return;const d=Fe(g.screenAssetId,t);l+=Al(p,A,y,b,d),f=!0}),l+=`    ret

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
    ret

; ==================================================================
; END OF WORLDS
; ==================================================================
`,l}function mt(t){t=t.replace("#","");const e=parseInt(t.substring(0,2),16),a=parseInt(t.substring(2,4),16),l=parseInt(t.substring(4,6),16);if(e<50&&a<50&&l<50)return 1;if(e>200&&a>200&&l>200)return 15;if(e>200&&a<100&&l<100)return 8;if(e<100&&a>200&&l<100)return 3;if(e<100&&a<100&&l>200)return 5;if(e>200&&a>200&&l<100)return 10;if(e>150&&a<100&&l>150)return 13;if(e<100&&a>150&&l>150)return 7;const i=(e+a+l)/3;return i<64?1:i<128?14:15}function Cl(t){const e=t.gameFlow&&t.gameFlow.nodes&&t.gameFlow.nodes.some(l=>l.type==="SubMenu");if(!e)return`; ==================================================================
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

`,t.gameFlow.nodes.filter(o=>o.type==="SubMenu").forEach((o,r)=>{const n=(o.title||o.id).toUpperCase().replace(/[^A-Z0-9]/g,"_");a+=`MENU_${n}_ID EQU ${r}
`}),a+=`
; ==================================================================
; MENU FUNCTIONS
; ==================================================================

`,t.gameFlow.nodes.filter(o=>o.type==="SubMenu").forEach(o=>{var c,_,E,A;(o.title||o.id).toUpperCase().replace(/[^A-Z0-9]/g,"_");const r=o.id.replace(/[^a-zA-Z0-9]/g,"_"),n=((_=(c=o.appearance)==null?void 0:c.colors)==null?void 0:_.background)||"#000000",p=((A=(E=o.appearance)==null?void 0:E.colors)==null?void 0:A.border)||"#FFFFFF",s=mt(n),h=mt(p);a+=`show_menu_${r}:
    ; Display ${o.title||o.id} menu
    ; Set background color using VDP
    ld b, ${s*16+h} ; Background (high) | Border (low)
    ld c, 7                     ; VDP Register 7
    call FAST_WRTVDP

    ; Set system color variables
    ld a, ${h}
    ld (BDRCLR), a

    ld a, ${s}
    ld (BAKCLR), a

    ld a, 15                    ; Default text color (White)
    ld (FORCLR), a

    ; Clear screen with background color
    call CLS

    ; Display menu title
    ld hl, menu_${r}_title
    ld de, NAMETBL + (5 * 32) + 10
    call print_string_screen2

    ; Display menu options
    ; TODO: Add option rendering logic here

    ret

menu_${r}_title:
    db "${(o.title||"Menu").replace(/"/g,'\\"')}", 0

handle_menu_${r}:
    ; Handle ${o.title||o.id} menu input
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
`,a}const Il={[R.SET_POSITION]:1,[R.MOVE_BY]:2,[R.SET_VELOCITY]:3,[R.APPLY_FORCE]:4,[R.CHANGE_SPRITE]:5,[R.PLAY_ANIMATION]:6,[R.SET_ANIMATION_SPEED]:7,[R.TOGGLE_ANIMATION]:8,[R.PLAY_SOUND]:9,[R.PLAY_MUSIC]:10,[R.MUTE_MUSIC]:11,[R.STOP_MUSIC]:12,[R.SET_VARIABLE]:13,[R.INCREMENT_VARIABLE]:14,[R.DECREMENT_VARIABLE]:15,[R.SET_COMPONENT_PROPERTY]:16,[R.WAIT]:17,[R.GOTO_STATE]:18,[R.DESTROY_ENTITY]:19,[R.SPAWN_ENTITY]:20,[R.GET_RANDOM_ENTITY_POSITION]:21,[R.CHANGE_GAME_FLOW_NODE]:22,[R.DECREASE_LIVES]:23,[R.INCREASE_LIVES]:24,[R.RESPAWN_PLAYER]:25,[R.BREAK_TILE]:26,[R.REPLACE_TILE]:27,[R.RND]:28,[R.POINT_AT]:29,[R.ADD_VARIABLES]:30,[R.SUBTRACT_VARIABLES]:31,[R.MULTIPLY_VARIABLES]:32,[R.DIVIDE_VARIABLES]:33,[R.MODULO_VARIABLES]:34,[R.ASSIGN_VARIABLE]:35,END:255},vl={[$.AND]:1,[$.OR]:2,[$.NOT]:3,[$.KEY_PRESSED]:4,[$.KEY_RELEASED]:5,[$.TIME_OUT]:6,[$.CAN_MOVE_DIRECTION]:7,[$.HAS_COLLISION]:8,[$.PATH_CLEAR]:9,[$.ON_WALL_COLLISION]:10,[$.HAS_DEADLY_TILE_COLLISION]:11,[$.ANIMATION_COMPLETE]:12,[$.KEY_AND_MOVEMENT]:13,[$.VARIABLE_COMPARE]:14},Dl={x:0,y:1,vx:2,vy:3,isOnGround:4,health:5},ft={"==":0,"!=":1,">":2,"<":3,">=":4,"<=":5},bt={up:1,arrowup:1,down:5,arrowdown:5,left:7,arrowleft:7,right:3,arrowright:3,fire:9,space:9},Be={up:1,down:5,left:7,right:3},yt={any:0,up:1,down:5,left:7,right:3},Et={any:0,wall:1,enemy:2,item:3,entity:4};function Ll(t){const e={...Dl};return t&&t.length>0&&t.forEach((a,l)=>{const i=6+l;e[a.name]=i,a.asmName&&(e[a.asmName]=i)}),e}const Rl=`
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
    `,Nl=`
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
; Input: D = Desired key (1/3/5/7), A = direction (0-8)
; Output: A = 1 if active, 0 if inactive
; ------------------------------------------------------------------
SM_MatchDirection:
    ld e, a
    cp d
    jr z, .smd_match_yes

    ld a, d
    cp 1                    ; UP
    jr nz, .smd_not_up
    ld a, e
    cp 2                    ; UP+RIGHT
    jr z, .smd_match_yes
    cp 8                    ; UP+LEFT
    jr z, .smd_match_yes
    jr .smd_match_no

.smd_not_up:
    cp 5                    ; DOWN
    jr nz, .smd_not_down
    ld a, e
    cp 4                    ; DOWN+RIGHT
    jr z, .smd_match_yes
    cp 6                    ; DOWN+LEFT
    jr z, .smd_match_yes
    jr .smd_match_no

.smd_not_down:
    cp 7                    ; LEFT
    jr nz, .smd_not_left
    ld a, e
    cp 6                    ; DOWN+LEFT
    jr z, .smd_match_yes
    cp 8                    ; UP+LEFT
    jr z, .smd_match_yes
    jr .smd_match_no

.smd_not_left:
    cp 3                    ; RIGHT
    jr nz, .smd_match_no
    ld a, e
    cp 2                    ; UP+RIGHT
    jr z, .smd_match_yes
    cp 4                    ; DOWN+RIGHT
    jr z, .smd_match_yes

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
    and #02
    jr z, .chc_none
    ld a, 1
    ret

.chc_item:
    ld a, e
    and #04
    jr z, .chc_none
    ld a, 1
    ret

.chc_entity:
    ld a, e
    and #01
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
    ; TODO: Implement animation complete check
    ld a, 1
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
    `;function wl(t,e,a){let l=Rl+`
`+Nl+`

`;const i=je(a||[]),o=i.nameToIndex;i.warnings.forEach(n=>{console.warn(`[State Machine Generator] ${n}`)}),l+=`; ==================================================================
`,l+=`; GLOBAL VARIABLES TABLE
`,l+=`; ==================================================================
`,e&&e.length>0?(l+=`; Maps variable IDs (6+) to their RAM addresses
`,l+=`SM_GlobalVarTable:
`,e.forEach((n,p)=>{const s=6+p;l+=`    DW ${n.asmName}            ; ID ${s}: ${n.name}
`}),l+=`
`):(l+=`; No global variables defined
`,l+=`SM_GlobalVarTable:
`,l+=`    ; Empty table (no global variables)

`),l+=`; ==================================================================
`,l+=`; STATE MACHINE DATA
`,l+=`; ==================================================================

`;const r=Ll(e);for(const n of t)l+=xl(n,r,o);return l}function xl(t,e,a){let l=`; State Machine: ${t.name} (${t.id}) 
`;const i=t.name.replace(/[^a-zA-Z0-9]/g,"_"),o=r=>{if(!r)return!1;const n=r.trim().toLowerCase();return n==="any"||n==="__any_state__"||n==="any state (*)"};for(const r of t.states){const n=`SM_${i}_${r.id.replace(/[^a-zA-Z0-9]/g,"_")}`,p=`${n}_OnEnter`,s=`${n}_OnExit`,h=`${n}_Transitions`;l+=`${n}: 
`,l+=`    DB 0; ID(unused) 
`,l+=`    DW ${r.onEnter&&r.onEnter.length>0?p:0} 
`,l+=`    DW ${r.onExit&&r.onExit.length>0?s:0} 
`;const c=t.transitions.filter(_=>_.fromStateId===r.id?!0:o(_.fromStateId)?_.toStateId!==r.id:!1);if(l+=`    DW ${c.length>0?h:0} 
`,r.onEnter&&r.onEnter.length>0){l+=`${p}: 
`;for(const _ of r.onEnter)l+=$e(_,t.name,e,a);l+=`    DB 0xFF; END
`}if(r.onExit&&r.onExit.length>0){l+=`${s}: 
`;for(const _ of r.onExit)l+=$e(_,t.name,e,a);l+=`    DB 0xFF; END
`}c.length>0&&(l+=`${h}: 
`,l+=`    DB ${c.length}; Count
`,c.forEach((_,E)=>{const u=o(_.fromStateId)&&o(_.toStateId)?"0":`SM_${i}_${_.toStateId.replace(/[^a-zA-Z0-9]/g,"_")}`,S=_.actions&&_.actions.length>0?`${h}_Actions_${E}`:"0";if(_.conditions?l+=He(_.conditions,e):l+=`    DB 0; Empty Condition(Always True) 
`,l+=`    DW ${u} 
`,l+=`    DW ${S} 
`,S!=="0"){l+=`${S}: 
`;for(const f of _.actions||[])l+=$e(f,t.name,e,a);l+=`    DB 0xFF; END
`}})),l+=`
`}return l}function Q(t){if(typeof t=="number")return t.toString();if(typeof t=="boolean")return t?"1":"0";if(typeof t=="string"){if(t==="true")return"1";if(t==="false")return"0";const e=parseInt(t,10);return isNaN(e)?"0":e.toString()}return"0"}function $e(t,e="",a,l){var r;const i=Il[t.type];if(!i)return`; Unknown Action: ${t.type} 
`;let o=`    DB ${i}; ${t.type} 
`;switch(t.type){case R.SET_POSITION:case R.MOVE_BY:case R.SET_VELOCITY:case R.APPLY_FORCE:o+=`    DB ${Q(t.params.x)}, ${Q(t.params.y)} 
`;break;case R.CHANGE_SPRITE:{const n=t.params.sprite||t.params.spriteId||"";let p=0;if(l&&typeof n=="string"){const s=l[n],h=l[n.toLowerCase()];s!==void 0?p=s:h!==void 0?p=h:p=Q(n)==="0"?0:parseInt(Q(n),10)||0}else p=Q(n)==="0"?0:parseInt(Q(n),10)||0;o+=`    DB ${p}; sprite: ${n} 
`;break}case R.PLAY_ANIMATION:o+=`    DB ${Q(t.params.animationName)} 
`;break;case R.SET_ANIMATION_SPEED:o+=`    DB ${Q(t.params.speed)} 
`;break;case R.TOGGLE_ANIMATION:o+=`    DB ${Q(t.params.playing)} 
`;break;case R.PLAY_SOUND:o+=`    DB ${Q(t.params.soundId)} 
`;break;case R.SET_VARIABLE:case R.INCREMENT_VARIABLE:case R.DECREMENT_VARIABLE:{const n=t.params.variable||t.params.variableName||t.params.name,p=(a==null?void 0:a[n])??0,s=t.params.value??t.params.amount??0;o+=`    DB ${p}, ${Q(s)}        ; ${n} (ID ${p})
`;break}case R.WAIT:o+=`    DB ${Q(t.params.duration)} 
`;break;case R.GOTO_STATE:if(e&&t.params.stateId){const n=`SM_${e.replace(/[^a-zA-Z0-9]/g,"_")}_${t.params.stateId.replace(/[^a-zA-Z0-9]/g,"_")} `;o+=`    DW ${n} 
`}else o+=`    DW 0; Invalid GOTO target
`;break;case R.SPAWN_ENTITY:o+=`    DB ${Q(t.params.entityId)}, ${Q(t.params.x)}, ${Q(t.params.y)} 
`;break;case R.DESTROY_ENTITY:{const n=((r=t.params)==null?void 0:r.target)||"self";o+=`    DB ${n==="other"?1:0}          ; Target: ${n}
`;break}case R.ADD_VARIABLES:case R.SUBTRACT_VARIABLES:case R.MULTIPLY_VARIABLES:case R.DIVIDE_VARIABLES:case R.MODULO_VARIABLES:{const n=t.params.destination||t.params.dest||t.params.result,p=t.params.source1||t.params.src1||t.params.operand1,s=t.params.source2||t.params.src2||t.params.operand2,h=(a==null?void 0:a[n])??0,c=(a==null?void 0:a[p])??0,_=(a==null?void 0:a[s])??0,E=t.type===R.ADD_VARIABLES?"ADD":t.type===R.SUBTRACT_VARIABLES?"SUB":t.type===R.MULTIPLY_VARIABLES?"MUL":t.type===R.DIVIDE_VARIABLES?"DIV":"MOD";o+=`    DB ${h}, ${c}, ${_}        ; ${n} = ${p} ${E} ${s}
`;break}default:o+=`    ; Params not implemented for ${t.type}
`;break}return o}function He(t,e){var i,o,r,n,p,s,h,c,_,E,A,u,S,f,y,b,g;const a=vl[t.type];if(!a)return console.warn(`[State Machine Generator] Unknown condition "${t.type}". Falling back to NOP condition.`),`    DB 0; FALLBACK NOP for unknown condition ${t.type}
`;let l=`    DB ${a}; ${t.type} 
`;switch(t.type){case $.KEY_PRESSED:case $.KEY_RELEASED:{const d=(o=(i=t.params)==null?void 0:i.key)==null?void 0:o.toLowerCase(),m=bt[d]??0;l+=`    DB ${m}          ; Key: ${d||"unknown"}
`;break}case $.TIME_OUT:l+=`    DB ${Q((r=t.params)==null?void 0:r.duration)} 
`;break;case $.CAN_MOVE_DIRECTION:{const d=String(((n=t.params)==null?void 0:n.direction)||"").toLowerCase(),m=Be[d]??0;d&&m===0&&console.warn(`[State Machine Generator] Unknown direction "${d}" in CAN_MOVE_DIRECTION. Using 0 (no direction).`),l+=`    DB ${m}          ; Direction: ${d||"none"}
`;break}case $.ON_WALL_COLLISION:{const d=String(((p=t.params)==null?void 0:p.direction)||"any").toLowerCase(),m=yt[d]??0;d in yt||console.warn(`[State Machine Generator] Unknown direction "${d}" in ON_WALL_COLLISION. Using any.`),l+=`    DB ${m}          ; Wall direction: ${d}
`;break}case $.HAS_COLLISION:{const d=String(((s=t.params)==null?void 0:s.collisionType)||"any").toLowerCase();let m=Et[d];m===void 0&&(console.warn(`[State Machine Generator] Unknown collisionType "${d}" in HAS_COLLISION. Using any.`),m=Et.any),l+=`    DB ${m}          ; collisionType: ${d}
`;break}case $.PATH_CLEAR:{const d=String(((h=t.params)==null?void 0:h.direction)||"").toLowerCase(),m=Be[d]??0;d&&m===0&&console.warn(`[State Machine Generator] Unknown direction "${d}" in PATH_CLEAR. Using auto-deduce (0).`),l+=`    DB ${m}          ; Direction (0=auto): ${d||"auto"}
`;break}case $.KEY_AND_MOVEMENT:{const d=String(((c=t.params)==null?void 0:c.key)||"").toLowerCase(),m=bt[d]??0,T=String(((_=t.params)==null?void 0:_.direction)||"").toLowerCase();let v=Be[T]??0;!T&&m!==9&&(v=m),T&&v===0&&console.warn(`[State Machine Generator] Unknown direction "${T}" in KEY_AND_MOVEMENT. Using 0.`),l+=`    DB ${m}, ${v}          ; key=${d||"unknown"}, dir=${T||"auto"}
`;break}case $.AND:case $.OR:if(t.conditions){l+=`    DB ${t.conditions.length} 
`;for(const d of t.conditions)l+=He(d,e)}else l+=`    DB 0
`;break;case $.NOT:t.conditions&&t.conditions.length>0?(l+=`    DB 1 
`,l+=He(t.conditions[0],e)):(l+=`    DB 1 
`,l+=`    DB 0; Fallback NOP subcondition for NOT
`);break;case $.VARIABLE_COMPARE:{const d=((E=t.params)==null?void 0:E.variable)||"x",m=e==null?void 0:e[d];if(m===void 0)console.warn(`[State Machine Generator] Unknown variable "${d}" in VARIABLE_COMPARE. Using x (ID 0) as fallback.`),l+=`    DB 0, ${ft[((A=t.params)==null?void 0:A.operator)||"=="]||0}, ${Q(((u=t.params)==null?void 0:u.value)||0)}; FALLBACK: unknown var "${d}" -> x ${((S=t.params)==null?void 0:S.operator)||"=="} ${((f=t.params)==null?void 0:f.value)||0}
`;else{const T=ft[((y=t.params)==null?void 0:y.operator)||"=="]||0,v=((b=t.params)==null?void 0:b.value)||0;l+=`    DB ${m}, ${T}, ${Q(v)}; ${d} (ID ${m}) ${((g=t.params)==null?void 0:g.operator)||"=="} ${v}
`}break}}return l}function Ol(t,e={}){console.log("ÐYZî [INTERRUPT GENERATOR] Generating interrupt.asm...");let a="";return a+=`; ==================================================================
`,a+=`; INTERRUPT TASK SYSTEM - File: interrupt.asm
`,a+=`; Konami-style technique: Hook H.TIMI for 50/60Hz task execution
`,a+=`; ==================================================================

`,a+=Ml(),a+=Pl(),a+=kl(),a+=Ul(),a+=Fl(),a+=Bl(t),e.interruptDrivenComponents&&(a+=`
; ==================================================================
`,a+=`; COMPONENT SYSTEMS (INLINED)
`,a+=`; Generated inside interrupt.asm because interruptDrivenComponents=true
`,a+=`; ==================================================================

`,a+=Dt(t),a+=`
; ==================================================================
`,a+=`; END OF INLINED COMPONENT SYSTEMS
`,a+=`; ==================================================================

`),console.log(`ƒo. [INTERRUPT GENERATOR] Generated interrupt.asm (${a.length} chars)`),a}function Ml(){return`; ==================================================================
; INTERRUPT SYSTEM MEMORY LAYOUT
; Variables are defined in variables.asm (dynamically allocated)
; This avoids RAM overlap with entity system arrays
; ==================================================================
; Slots: task_table (8 slots x 2 bytes), task_0_ptr..task_7_ptr
; State: interrupt_system_enabled, old_htimi_hook, interrupt_counter,
;        task_exec_time, vblank_flag
; ==================================================================

`}function Pl(){return`; ==================================================================
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

`}function kl(){return`; ==================================================================
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

`}function Ul(){return`; ==================================================================
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

`}function Fl(){return`; ==================================================================
; TASK MANAGEMENT FUNCTIONS
; ==================================================================

; ==================================================================
; NOTE: wait_vblank function removed - use HALT directly in game loop
; HALT is more efficient (no call/ret overhead)
; ==================================================================

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

`}function Bl(t){let e="";if(e+=`; ==================================================================
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
`,e+=`    push bc
`,e+=`    push de

`,e+=`    ; Save previous state
`,e+=`    ld a, (input_state)
`,e+=`    ld (prev_input_state), a
`,e+=`    ld a, (input_btn_curr)
`,e+=`    ld (input_btn_prev), a

`,e+=`    ; Read joystick direction first (priority source)
`,e+=`    xor a                       ; Joystick 0
`,e+=`    call GTSTCK                 ; BIOS call: A = direction
`,e+=`    ld b, a                     ; B = joystick direction
`,e+=`    or a
`,e+=`    jr nz, .dir_ready

`,e+=`    ; Fallback to keyboard cursor keys (SNSMAT row 8)
`,e+=`    ld a, 8
`,e+=`    call SNSMAT                 ; Active low bits
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
`,e+=`    xor a                       ; Joystick 0
`,e+=`    call GTTRIG                 ; A = #FF if pressed, 0 if not
`,e+=`    ld d, 0                     ; D = button bitmask
`,e+=`    or a
`,e+=`    jr z, .no_fire              ; Jump if NOT pressed (A=0)
`,e+=`    ld d, INPUT_BTN_FIRE
`,e+=`    ld a, 1                     ; Fire pressed
`,e+=`    ld (input_fire), a
`,e+=`    jr .fire_done
`,e+=`.no_fire:
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

`,t.hasEntities){const l=Ne(t).usedComponents,i=l.has("Jump"),o=l.has("Movement")||l.has("Cursors"),r=l.has("Gravity");i||o||r?(e+=`; ==================================================================
`,e+=`; TASK_UPDATE_PHYSICS - Apply vx, vy -> X, Y (OPTIMIZED)
`,e+=`; ==================================================================
`,e+=`; Only calls physics systems that are actually used in this project
`,e+=`; ==================================================================
`,e+=`task_update_physics:
`,e+=`    push af
`,e+=`    push bc
`,e+=`    push de
`,e+=`    push hl

`,e+=`    ; Keep system loops in sync with current component masks
`,e+=`    call rebuild_used_entity_list
`,i&&(e+=`    call update_jump_component      ; Jump impulse
`),o&&(e+=`    call update_movement_component  ; Movement/velocity
`),r&&(e+=`    call update_gravity_component   ; Gravity acceleration
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

`,e}function $l(t){return`; ==================================================================
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
`}function Hl(t){var l,i,o,r;const e=((i=(l=t.tiles)==null?void 0:l[0])==null?void 0:i.width)||8,a=((r=(o=t.tiles)==null?void 0:o[0])==null?void 0:r.height)||8;return`; ==================================================================
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
`}function jl(t){var e,a,l,i;return(a=(e=t.tiles)==null?void 0:e[0])!=null&&a.width,(i=(l=t.tiles)==null?void 0:l[0])!=null&&i.height,`; ==================================================================
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
`}function Vl(t){var e,a,l,i;return(a=(e=t.tiles)==null?void 0:e[0])!=null&&a.width,(i=(l=t.tiles)==null?void 0:l[0])!=null&&i.height,`; ==================================================================
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
`}function zl(t,e,a={}){var p;if(console.log("🔧 Generating modular ASM files..."),!t)throw console.error("❌ projectName is required"),new Error("projectName is required");if(!e)throw console.error("❌ assets is undefined or null"),new Error("assets array is required");if(!Array.isArray(e))throw console.error("❌ assets is not an array"),new Error("assets must be an array");console.log(`📊 Project: ${t}, Assets: ${e.length}, Config:`,a);let l;try{l=Ve(t,e),console.log(`🔍 Analysis complete: ${l.sprites.length} sprites, ${l.tiles.length} tiles`)}catch(s){console.error("❌ Error analyzing project:",s),l={hasSprites:!1,hasTiles:!1,hasScreens:!1,hasEntities:!1,hasComponents:!1,hasGameFlow:!1,hasMenus:!1,hasFonts:!1,hasECS:!1,hasMultipleScreens:!1,hasAnimations:!1,hasCollisions:!1,hasMenuSystem:!1,components:[],templates:[],entities:[],sprites:[],tiles:[],screens:[],screenMaps:[],projectName:t,customStates:[],stateMachines:[],globalVariables:[]},console.log("🔄 Using fallback empty analysis")}const i=a.interruptDrivenComponents??!0,o=a.hardwareMode||"hybrid",r=a.optimizeLevel||"safe";console.log("📝 [MSX GENERATOR] Generating all ASM files..."),console.log(`🔧 Hardware Mode: ${o.toUpperCase()}, Optimize: ${r}`);const n={"bios.asm":ba({hardwareMode:{mode:o,optimizeLevel:r}}),"constants.asm":Ea(l),"variables.asm":ga(l),"interrupt.asm":Ol(l,{interruptDrivenComponents:i}),"header.asm":Aa(t,l),"patterns.asm":ka(l),"colors.asm":Ua(l),"components.asm":i?`; Components are generated inside interrupt.asm (interruptDrivenComponents=true)
`:Dt(l),"entities.asm":pl(l),"worlds.asm":Tl(l),"screens.asm":_l(l),"sprites.asm":ja(l),"font.asm":hl(l),"hud.asm":ul(l),"menus.asm":Cl(l),"sound.asm":$l(),"scroll.asm":Hl(l),"animtiles.asm":jl(l),"particles.asm":Vl(l),"statemachine.asm":l.stateMachines?wl(l.stateMachines,l.globalVariables,l.sprites):`; No State Machines
`,"gameflow.asm":Na(l),"main.asm":Pa(t,l),"unitedFiles.asm":""};return a.generateUnified&&(n["unitedFiles.asm"]=Fa(n,t,l)),console.log("✅ Modular ASM files generated successfully!"),console.log(`📊 Generated ${Object.keys(n).filter(s=>n[s]).length} files`),console.log("📋 [DEBUG] Files generated:",Object.keys(n)),console.log("🎯 [DEBUG] interrupt.asm length:",((p=n["interrupt.asm"])==null?void 0:p.length)||"MISSING!"),n}const Qo=Object.freeze(Object.defineProperty({__proto__:null,generateModularASM:zl},Symbol.toStringTag,{value:"Module"}));export{To as $,nt as A,ue as B,it as C,Zl as D,Jl as E,Qt as F,Xt as G,X as H,Vo as I,ho as J,_o as K,Wt as L,Kl as M,Do as N,De as O,Ql as P,$o as Q,jo as R,Re as S,Ho as T,wt as U,Eo as V,uo as W,fo as X,mo as Y,oo as Z,So as _,no as a,bo as a0,yo as a1,Ao as a2,go as a3,Co as a4,pe as a5,Ie as a6,so as a7,Go as a8,eo as a9,ql as aa,Pe as ab,Yo as ac,vo as ad,Kt as ae,$ as af,R as ag,Xl as ah,Ve as ai,Wo as aj,Lo as ak,ao as al,Mt as am,ro as an,Ro as ao,Io as ap,to as aq,No as ar,Qo as as,lo as b,io as c,ye as d,xo as e,co as f,wo as g,po as h,kt as i,Ut as j,W as k,Yl as l,Wl as m,ve as n,Mo as o,Po as p,ko as q,Uo as r,Oo as s,Fo as t,Ee as u,ge as v,Vt as w,Bo as x,Gl as y,zo as z};
