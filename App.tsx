
import React, { useState, useCallback, useEffect, useRef } from 'react';
import JSZip from 'jszip'; 
import { 
  EditorType, ProjectAsset, Tile, Sprite, ScreenMap, MSXColorValue, SpriteFrame, PixelData, 
  LineColorAttribute, MSX1ColorValue, WorldMapGraph, PSGSoundData, PSGSoundChannelState, 
  TrackerSongData, HUDConfiguration, TileBank, MSXFont, 
  MSXFontColorAttributes, DataFormat,
  Snippet, ScreenLayerData,
  EntityInstance, MockEntityType, HelpDocSection, BehaviorScript, TileLogicalProperties,
  CopiedScreenData, CopiedLayerData, EffectZone, ScreenEditorLayerName, 
  ComponentDefinition, EntityTemplate, ContextMenuItem,
  Boss, BossPhase, Point, HistoryState, HistoryAction, HistoryActionType, CopiedTileData, WaypointPickerState, MainMenuConfig
} from './types';
import { 
  MSX_SCREEN5_PALETTE, DEFAULT_TILE_WIDTH, DEFAULT_TILE_HEIGHT, 
  DEFAULT_SPRITE_SIZE, DEFAULT_SCREEN_WIDTH_TILES, DEFAULT_SCREEN_HEIGHT_TILES, 
  SCREEN_MODES, DEFAULT_SCREEN_MODE, MSX1_PALETTE,
  DEFAULT_SCREEN2_FG_COLOR, DEFAULT_SCREEN2_BG_COLOR,
  DEFAULT_TILE_BANKS_CONFIG, Z80_SNIPPETS as DEFAULT_Z80_SNIPPETS, Z80_BEHAVIOR_SNIPPETS,
  EDITOR_BASE_TILE_DIM_S2,
  DEFAULT_PT3_ROWS_PER_PATTERN, DEFAULT_PT3_BPM, DEFAULT_PT3_SPEED,
  DEFAULT_HELP_DOCS_DATA, HELP_DOCS_SYSTEM_ASSET_ID, MAX_HISTORY_LENGTH, DEFAULT_MAIN_MENU_CONFIG
} from './constants';
import { DEFAULT_MSX_FONT, EDITABLE_CHAR_CODES_SUBSET } from './components/utils/msxFontRenderer'; 
import { createDefaultLineAttributes, generateTilePatternBytes, generateTileColorBytes } from './components/utils/tileUtils'; 
import { generateScreenMapLayoutBytes, deepCompareTiles } from './components/utils/screenUtils'; 
import { generateSpriteBinaryData } from './components/utils/spriteUtils';
import { generateFontPatternBinaryData, generateFontColorBinaryData } from './components/utils/msxFontUtils'; 
import { generateTemplatesASM } from './components/utils/ecsUtils';
import { createDefaultTrackerPattern as createDefaultPT3Pattern } from './components/utils/trackerUtils';
import { resolveSnippetPlaceholders } from './components/utils/snippetResolver'; 
import { TILE_BANKS_SYSTEM_ASSET_ID, FONT_EDITOR_SYSTEM_ASSET_ID, COMPONENT_DEF_EDITOR_SYSTEM_ASSET_ID, ENTITY_TEMPLATE_EDITOR_SYSTEM_ASSET_ID, WORLD_VIEW_SYSTEM_ASSET_ID, MAIN_MENU_SYSTEM_ASSET_ID } from './components/tools/FileExplorerPanel'; 
import { msxFontJsonString } from './data/msxFontData';
import { AppUI } from './components/AppUI';
import { deepCopy, getFormattedDate, generateAsmFileHeader, generateMainAsmContent } from './utils/projectUtils';
import { DEFAULT_COMPONENT_DEFINITIONS, DEFAULT_ENTITY_TEMPLATES, DEFAULT_MAP_ASM_CONTENT, DEFAULT_CONSTANTS_ASM_CONTENT } from './data/defaults';
import { ThemeProvider } from './contexts/ThemeContext';
import { WindowManagerProvider } from './components/WindowManager/WindowManagerProvider';


const SNIPPETS_STORAGE_KEY = 'msxIdeUserSnippets_v1';
const AUTOSAVE_INTERVAL = 10 * 60 * 1000;

const App: React.FC = () => {
  const [assets, setAssets] = useState<ProjectAsset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState<string | null>(null); 
  const [currentScreenMode, setCurrentScreenMode] = useState<string>(DEFAULT_SCREEN_MODE);
  const [statusBarMessage, setStatusBarMessage] = useState<string>("MSX Retro Game IDE Initialized.");
  const [selectedColor, setSelectedColor] = useState<MSXColorValue>(MSX_SCREEN5_PALETTE[1].hex);
  
  const [screenEditorSelectedTileId, setScreenEditorSelectedTileId] = useState<string | null>(null);
  
  const [componentDefinitions, setComponentDefinitionsState] = useState<ComponentDefinition[]>(DEFAULT_COMPONENT_DEFINITIONS);
  const [entityTemplates, setEntityTemplatesState] = useState<EntityTemplate[]>(DEFAULT_ENTITY_TEMPLATES);
  const [mainMenuConfig, setMainMenuConfigState] = useState<MainMenuConfig>(DEFAULT_MAIN_MENU_CONFIG);
  const [currentEntityTypeToPlace, setCurrentEntityTypeToPlace] = useState<EntityTemplate | null>(null); 
  const [selectedEntityInstanceId, setSelectedEntityInstanceId] = useState<string | null>(null); 
  const [selectedEffectZoneId, setSelectedEffectZoneId] = useState<string | null>(null); 

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [assetToRenameInfo, setAssetToRenameInfo] = useState<{ id: string; currentName: string; type: ProjectAsset['type'] } | null>(null);

  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false); 
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false); 
  const [isCompressDataModalOpen, setIsCompressDataModalOpen] = useState(false);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalProps, setConfirmModalProps] = useState<{
    title: string;
    message: string | React.ReactNode;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    confirmButtonVariant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  } | null>(null);

  const [tileBanks, setTileBanksState] = useState<TileBank[]>(() => { 
    const savedBanks = localStorage.getItem('tileBanksConfig');
    return savedBanks ? JSON.parse(savedBanks) : DEFAULT_TILE_BANKS_CONFIG;
  });
  
  const [msxFont, setMsxFontState] = useState<MSXFont>(() => { 
    try {
      const parsedFont = JSON.parse(msxFontJsonString);
      const fontCharset: MSXFont = {};
      for (const key in parsedFont.charset) {
          fontCharset[Number(key)] = parsedFont.charset[key];
      }
      return fontCharset;
    } catch (e) {
      console.error("Error parsing default MSX Font JSON:", e);
      return DEFAULT_MSX_FONT;
    }
  });
  
  const [msxFontColorAttributes, setMsxFontColorAttributesState] = useState<MSXFontColorAttributes>(() => { 
    try {
        const parsedFont = JSON.parse(msxFontJsonString);
        const fontColors: MSXFontColorAttributes = {};
        if (parsedFont.colorAttributes) {
            for (const key in parsedFont.colorAttributes) {
                fontColors[Number(key)] = parsedFont.colorAttributes[key];
            }
        } else {
            Object.keys(msxFont).forEach(charCodeStr => {
                const charCodeNum = Number(charCodeStr);
                if (!isNaN(charCodeNum)) {
                    fontColors[charCodeNum] = Array(8).fill(null).map(() => ({ fg: DEFAULT_SCREEN2_FG_COLOR, bg: DEFAULT_SCREEN2_BG_COLOR }));
                }
            });
        }
        return fontColors;
    } catch (e) {
        console.error("Error parsing MSX Font Color Attributes:", e);
        const initialColors: MSXFontColorAttributes = {};
        Object.keys(msxFont).forEach(charCodeStr => {
            const charCodeNum = Number(charCodeStr);
            if (!isNaN(charCodeNum)) {
                 initialColors[charCodeNum] = Array(8).fill(null).map(() => ({ fg: DEFAULT_SCREEN2_FG_COLOR, bg: DEFAULT_SCREEN2_BG_COLOR }));
            }
        });
        return initialColors;
    }
  });
  const [currentLoadedFontName, setCurrentLoadedFontName] = useState<string>("Default MSX1 Font");
  const [helpDocsData, setHelpDocsData] = useState<HelpDocSection[]>(DEFAULT_HELP_DOCS_DATA);

  const [dataOutputFormat, setDataOutputFormat] = useState<DataFormat>('hex');
  const [autosaveEnabled, setAutosaveEnabled] = useState<boolean>(true);
  const [snippetsEnabled, setSnippetsEnabled] = useState<boolean>(true);
  const [syntaxHighlightingEnabled, setSyntaxHighlightingEnabled] = useState<boolean>(true);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isSpriteSheetModalOpen, setIsSpriteSheetModalOpen] = useState(false);
  const [isSpriteFramesModalOpen, setIsSpriteFramesModalOpen] = useState(false);
  const [spriteForFramesModal, setSpriteForFramesModal] = useState<ProjectAsset | null>(null);

  const [snippetToInsert, setSnippetToInsert] = useState<{ code: string; timestamp: number } | null>(null);
  
  const [userSnippets, setUserSnippets] = useState<Snippet[]>(() => {
    const savedSnippetsJSON = localStorage.getItem(SNIPPETS_STORAGE_KEY);
    if (savedSnippetsJSON) { try { const parsedSnippets = JSON.parse(savedSnippetsJSON); if (Array.isArray(parsedSnippets) && parsedSnippets.every((s: any) =>s && typeof s.id === 'string' && typeof s.name === 'string' && typeof s.code === 'string' )) { return parsedSnippets as Snippet[]; } else { console.warn('Snippets from localStorage have invalid structure. Falling back to defaults.', parsedSnippets); }} catch (e) { console.error('Failed to parse snippets. Falling back to defaults.', e, savedSnippetsJSON);}}
    
    const allDefaultSnippets = [...DEFAULT_Z80_SNIPPETS, ...Z80_BEHAVIOR_SNIPPETS];
    return allDefaultSnippets.map((s, index) => ({ id: `default_${index}_${s.name.toLowerCase().replace(/\s+/g, '_')}`, name: s.name, code: s.code, }));
  });
  const [isSnippetEditorModalOpen, setIsSnippetEditorModalOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const autosaveFunctionRef = useRef<(() => void) | null>(null);

  const [history, setHistory] = useState<HistoryState>({ undoStack: [], redoStack: [] });

  useEffect(() => {
    const asmFiles = [
      {
        name: "asm/init.asm",
        content: `include "constants.asm"
 MAX_PTR: EQU #FFFF ; Placeholder, to be calculated

;-----------------------------------------------
; PAGE 2:

    org #4000   ; Start in the 2nd slot
 StartOfPage2:

;-----------------------------------------------
    db "AB"     ; ROM signature
    dw Execute  ; start address
BLANK_CHAR_PATTERN: ;aprovechamos valores 0
    db 0,0,0,0,0,0,0,0,0,0,0,0
;-----------------------------------------------

ALL_MAP_TILES_PTR:
 incbin "bin/AllPatterns.BIN"

ALL_MAP_TILES_COL:
 incbin "bin/AllColors.BIN"

PAN1_LAYOUT_DATA:
 incbin "bin/MapLayout.bin"




BLANK_CHAR_COLOR:
    DB #11,#11,#11,#11,#11,#11,#11,#11


;-------------------------------------------------------------------------------
; Set Video Mode
; Configures the VDP registers for Screen 2.
; Register 7 is explicitly set to 00h for a black background.
;-------------------------------------------------------------------------------
 Execute:
    di
    ; init the stack:
    ld sp,#F380
    ; reset some interrupts to make sure it runs in some MSX computers
    ; with disk controllers installed in some interrupt handlers
    ld a,#C9
    ld (HKEY),a
    ld (TIMI),a
    ei

    ;call SETPAGES32K

    ; Silence, init keyboard, and clear config:
    xor a
    ld (CLIKSW),a
    ld (deterministic),a


    ld a,1
    ld hl,$f3e9
    ld [hl],15
    inc hl
    ld [hl],1
    inc hl
    ld [hl],1

    ; Change background colors:
    ld (BAKCLR),a
    ld (BDRCLR),a
    call CHGCLR

    ld a,2      ; Change screen mode
    call CHGMOD


    ;; 16x16 sprites:
    ld bc,#e201  ;; write #e2 in VDP register #01 (activate sprites, generate interrupts, 16x16 sprites with no magnification)
    call WRTVDP

    ;call CheckIf60Hz
    ld (isComputer50HzOr60Hz),a ; 0: 50Hz, 1: 60Hz

    call loadMyScreen
    call redef_spr

 bucle1:
  jp bucle1

redef_spr:
            ;es redefineixen tots els sprites
    ; define sprites
        ld      hl,spr_jack
        ld      de,SPRTBL
        ld      b,160
        call    DoCopy
    ; define sprite
        ld      hl,SPRATR
        ld      de,sprites
        ld      bc,32
        ldir
        ret


;-----------------------------------------------------------
;hl=origen
;de=destino
;b=blokes de 8 bytes

DoCopy:
 ld a,e
 di
 out ($99),a
 ld a,d
 or a,$40

 out ($99),a
 ei
 ld c,$98
 VdpReady:
  ld d,b
  outi
  outi
  outi
  outi
  outi
  outi
  outi
  ld b,d
  outi
  jp nz,VdpReady

  ret

;-------------------------------------------------------------------------------
; loadMyScreen (NEW ROUTINE)
; Loads custom tile patterns and colors into all three VRAM banks,
; and then draws the screen layout.
;-------------------------------------------------------------------------------
 loadMyScreen:


 loadPatternBanks:
        ; --- Load TILE1 Pattern Data into all three PGT banks ---
        LD      HL, ALL_MAP_TILES_PTR ; Source RAM address for TILE1 patterns
        LD DE,CHRTBL2
        LD BC,MAX_PTR       ; 4 characters (0-3) * 8 bytes/char = 32 bytes
        CALL LDIRVM
        ; Load TILE1 patterns into the second PGT bank
        LD    HL, ALL_MAP_TILES_PTR ; Source RAM address for TILE1 patterns
        LD DE,CHRTBL2 + #800 ; Destination VRAM address for PGT bank 1
        LD BC, MAX_PTR       ; 4 characters (0-3) * 8 bytes/char = 32 bytes
        CALL LDIRVM
        ; Load TILE1 patterns into the third PGT bank
        LD    HL, ALL_MAP_TILES_PTR ; Source RAM address for TILE1 patterns
        LD DE,CHRTBL2 + #1000 ; Destination VRAM address for P
        LD BC, MAX_PTR        ; 4 characters (0-3) * 8 bytes/char = 32 bytes
        CALL LDIRVM




 loadColorBanks:
        ; --- Load TILE1 Color Data into all three CAT banks ---
        LD      HL,ALL_MAP_TILES_COL; Source RAM address for TILE1 colors
        LD      DE, CLRTBL2
        LD      BC, MAX_PTR      ; 4 characters * 8 bytes/char = 32 bytes
        CALL    LDIRVM

        ; Load TILE1 colors into the second CAT bank
        LD      HL,ALL_MAP_TILES_COL;Source RAM address for TILE1 colors
        LD      DE, CLRTBL2 + #800 ; Destination VRAM address for CAT
        LD      BC,MAX_PTR    ; 4 characters * 8 bytes/char = 32 bytes
        CALL    LDIRVM
        ; Load TILE1 colors into the third CAT bank
        LD      HL,ALL_MAP_TILES_COL;Source RAM address for TILE1 colors
        LD      DE, CLRTBL2 + #1000 ; Destination VRAM address for
        LD      BC,MAX_PTR     ; 4 characters * 8 bytes/char = 32 bytes
        CALL    LDIRVM

        ; --- Load Blank Character Pattern (character #255) into all three PGT banks ---

 loadBlankCharPatterns:
        LD      HL, BLANK_CHAR_PATTERN ; Source RAM address for blank character pattern
        LD     DE, CHRTBL2 + #0000 + (255 * 8) ; Destination VRAM address for char #255 in PGT bank 0
        LD      BC, 8           ; 8 bytes for one character pattern
        CALL    LDIRVM
        ; Load BLANK_CHAR_PATTERN into the second PGT bank
        LD      HL, BLANK_CHAR_PATTERN ; Source RAM address for blank character pattern
        LD      DE, CHRTBL2 + #800 + (255 * 8)
        ; Destination VRAM address for char #255 in PGT bank 1
        LD      BC, 8           ; 8 bytes for one character pattern
        CALL    LDIRVM
        ; Load BLANK_CHAR_PATTERN into the third PGT bank
        LD      HL, BLANK_CHAR_PATTERN ; Source RAM address for blank character pattern
        LD      DE, CHRTBL2 + #1000 + (255 * 8)
        ; Destination VRAM address for char #255 in PGT bank 2
        LD      BC, 8           ; 8 bytes for one character pattern
        CALL    LDIRVM




 loadBlankCharColors:
        ; --- Load Blank Character Color Data (character #255) into all three CAT banks ---
        LD      HL, BLANK_CHAR_COLOR ; Source RAM address for blank character color
        LD      DE, CLRTBL2 + #0000 + (255 * 8)
        LD      BC, 8           ; 8 bytes for one character color
        CALL    LDIRVM
        ; Load BLANK_CHAR_COLOR into the second CAT bank
        LD      HL, BLANK_CHAR_COLOR ; Source RAM address for blank character color
        LD      DE, CLRTBL2 + #800 + (255 * 8)
        ; Destination VRAM address for char #255 in CAT bank 1
        LD      BC, 8           ; 8 bytes for one character color
        CALL    LDIRVM
        ; Load BLANK_CHAR_COLOR into the third CAT bank
        LD      HL, BLANK_CHAR_COLOR ; Source RAM address for blank character color
        LD      DE, CLRTBL2 + #1000 + (255 * 8)
        ; Destination VRAM address for char #255 in CAT bank 2
        LD      BC, 8           ; 8 bytes for one character color
        CALL    LDIRVM



        ; --- Draw the Screen Layout to the Name Table ---
        CALL    drawScreenLayout
        RET


;-------------------------------------------------------------------------------
; Draw Screen Layout
; Copies the PAN1_LAYOUT_DATA to the VRAM Name Table.
;-------------------------------------------------------------------------------
 drawScreenLayout:
        LD      HL, PAN1_LAYOUT_DATA  ; Source RAM address
        LD      DE, #1800             ; Destination VRAM address (Name Table base)
        LD      BC, 256 * 3               ; Size of the layout data (32 columns * 24 rows)
        CALL    LDIRVM           ; Copy data to VRAM


        RET
`
      },
      {
        name: "asm/constants.asm",
        content: `;; constants.asm
; This file contains shared constants and addresses for the project.

; --- BIOS Calls ---
CHGMOD  EQU     #005F   ; Change screen mode
CHGCLR  EQU     #0062   ; Change screen colors
WRTVDP  EQU     #0047   ; Write to VDP register
LDIRVM  EQU     #005C   ; Block transfer from CPU to VRAM

; --- System Variables ---
BAKCLR  EQU     #F3E9   ; Background color
BDRCLR  EQU     #F3EA   ; Border color
CLIKSW  EQU     #F3DB   ; Key click switch (0=off)
HKEY    EQU     #FD9A   ; Interrupt hook for key press
TIMI    EQU     #FD9F   ; Interrupt hook for VBLANK

; --- Custom Variables (to be defined in your RAM area) ---
deterministic EQU #C000 ; Example RAM address
isComputer50HzOr60Hz EQU #C001 ; Example RAM address

; --- VRAM Addresses for SCREEN 2 ---
CLRTBL2     EQU     #2000   ; Color Attribute Table base
CHRTBL2     EQU     #0000   ; Pattern Generator Table base
PATTBL2     EQU     #1800   ; Name Table (Pattern list) base

SPRTBL EQU #3800
SPRATR EQU #1B00
`
      },
      {
        name: "asm/main_menu.asm",
        content: `;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
;;      MAIN MENU LOGIC ROUTINE
;;
;; This is a self-contained routine to run the main menu.
;; It uses the data and labels defined above.
;;
;; To use:
;; 1. Ensure this code is included in your project.
;; 2. Ensure all asset pointers (MENU_BG_SCREEN_ASSET_PTR, etc.)
;;    are correctly pointing to loaded data in memory.
;; 3. Implement the game-specific routines called by the
;;    Menu_ExecuteAction jump table (e.g., Start_New_Game).
;; 4. Call 'Menu_Init' to start the menu. The routine will
;;    loop until an option is chosen, then it will jump
;;    to the corresponding game routine.
;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

; --- RAM Variables for Menu Logic ---
; These should be defined in a safe RAM area of your game.
MENU_RAM_BASE:      EQU #D000 ; Example base address for menu variables
SelectedOption:     DB 0      ; Index of the currently selected menu item (0-based)
PrevInputState:     DB 0      ; Stores last frame's joystick/keyboard state for debouncing
MenuRedrawFlag:     DB 0      ; 1 if the menu needs to be redrawn

; --- VDP Constants ---
VDP_CMD_REG:        EQU #99
VDP_DATA_REG:       EQU #98
SPRITE_ATTR_TABLE:  EQU #1B00 ; Default Screen 2 Sprite Attribute Table
NAME_TABLE:         EQU #1800 ; Default Screen 2 Name Table

; ==============================================================================
; MENU_INIT: Main entry point to start the menu system
; ==============================================================================
Menu_Init:
    LD A, (MENU_IS_ENABLED)
    OR A
    RET Z ; Return immediately if menu is disabled

    ; --- Initial Setup ---
    XOR A
    LD (SelectedOption), A
    LD (PrevInputState), A
    LD A, 1
    LD (MenuRedrawFlag), A ; Set redraw flag for the first frame

    ; TODO: Add any specific screen mode setup if needed (e.g., call CHGMOD)
    ; For now, it assumes the correct screen mode is already set.

    ; --- Load Cursor Sprite Pattern ---
    LD HL, (MENU_CURSOR_SPRITE_ASSET_PTR)
    LD A, H
    OR L
    CALL NZ, LoadMenuCursorSpritePattern

    ; --- Main Menu Loop ---
Menu_Loop:
    HALT                ; Wait for V-Blank interrupt
    CALL Menu_HandleInput

    LD A, (MenuRedrawFlag)
    OR A
    CALL NZ, Menu_Draw  ; If redraw flag is set, call draw routine

    JP Menu_Loop        ; Loop until an option is selected and executed

; ==============================================================================
; MENU_HANDLE_INPUT: Reads player input and updates menu state
; ==============================================================================
Menu_HandleInput:
    ; Read joystick 1 state
    LD A, 1
    CALL GTSTCK
    LD B, A             ; Store current input in B

    ; Debounce input
    LD A, (PrevInputState)
    XOR B
    AND B               ; A = bits that are newly pressed (were 0, now 1)
    LD C, A             ; C = newly pressed bits
    LD (PrevInputState), B ; Save current state for next frame

    ; --- Check for DOWN press ---
    LD A, C
    AND %00000100       ; Bit 2 = Down
    JP Z, .check_up     ; If not pressed, check Up

    ; Down was pressed: Increment selected option
    LD HL, SelectedOption
    INC (HL)
    LD A, (MENU_OPTIONS_COUNT)
    CP (HL)
    JR NZ, .input_changed ; If not equal, it's a valid new index

    ; If we went past the last option, wrap to 0
    XOR A
    LD (HL), A
    JR .input_changed

.check_up:
    ; --- Check for UP press ---
    LD A, C
    AND %00000001       ; Bit 0 = Up
    JP Z, .check_fire   ; If not pressed, check Fire

    ; Up was pressed: Decrement selected option
    LD HL, SelectedOption
    LD A, (HL)
    OR A
    JR Z, .wrap_to_last ; If current is 0, wrap to last option

    DEC (HL)            ; Decrement if not 0
    JR .input_changed

.wrap_to_last:
    LD A, (MENU_OPTIONS_COUNT)
    DEC A
    LD (HL), A

.input_changed:
    LD A, 1
    LD (MenuRedrawFlag), A ; Set redraw flag because selection changed
    JP .end_input

.check_fire:
    ; --- Check for FIRE press ---
    LD A, C
    AND %00010000       ; Bit 4 = Trigger 1
    RET Z               ; If not pressed, we are done with input handling

    ; Fire was pressed: Execute the action
    CALL Menu_ExecuteAction

.end_input:
    RET

; ==============================================================================
; MENU_DRAW: Renders the entire menu screen
; ==============================================================================
Menu_Draw:
    XOR A
    LD (MenuRedrawFlag), A ; Clear redraw flag

    ; --- Step 1: Draw Background ---
    LD HL, (MENU_BG_SCREEN_ASSET_PTR)
    LD A, H
    OR L
    CALL NZ, DrawMenuBackgroundScreen

    ; If no background screen, you might want to clear the screen area here
    ; (e.g., using a VDP fill command or a custom clear routine).
    ; For this example, we assume either a screen is drawn or the background
    ; is a solid color set by the game elsewhere.

    ; --- Step 2: Draw Menu Options ---
    LD IX, MENU_OPTIONS_TABLE
    LD B, (MENU_OPTIONS_COUNT) ; B = number of options to draw
    LD C, 0                 ; C = current option index counter
    LD E, 10                ; E = Start Y coordinate for text (example)
.draw_option_loop:
    PUSH BC
    PUSH IX

    ; Set text color based on whether this is the selected option
    LD A, (SelectedOption)
    CP C ; Compare current index with selected index
    JR Z, .set_highlight_color

.set_normal_color:
    LD A, (MENU_COLOR_TEXT)
    LD (FORCLR), A ; Set foreground color in BIOS variable
    LD A, (MENU_COLOR_BACKGROUND)
    LD (BAKCLR), A ; Set background color
    JR .color_set

.set_highlight_color:
    LD A, (MENU_COLOR_HIGHLIGHT_TEXT)
    LD (FORCLR), A
    LD A, (MENU_COLOR_HIGHLIGHT_BG)
    LD (BAKCLR), A

.color_set:
    CALL CHGCLR ; Apply colors

    ; Get pointer to option string
    LD L, (IX+0)
    LD H, (IX+1)

    ; Calculate text position (centered horizontally for this example)
    ; This is a simplified centering. A real implementation might calculate string length.
    LD D, 8         ; D = Start X coordinate (example)
    CALL PRNSTR     ; Print the string at (D, E)

    POP IX
    ADD IX, 2       ; Point to next entry in the table (2 bytes for DW)

    POP BC
    INC C           ; Increment option index counter
    LD A, 12
    ADD A, E        ; Move Y down for next option (example: 12 pixels)
    LD E, A

    DJNZ .draw_option_loop

    ; --- Step 3: Position Cursor ---
    CALL Menu_PositionCursor

    RET

; ==============================================================================
; MENU_POSITION_CURSOR: Updates the cursor sprite's Y position
; ==============================================================================
Menu_PositionCursor:
    LD HL, (MENU_CURSOR_SPRITE_ASSET_PTR)
    LD A, H
    OR L
    RET Z ; No cursor sprite defined, nothing to do.

    ; Calculate cursor Y position
    ; Formula: start_y + (selected_index * line_height) + vertical_offset
    LD A, (SelectedOption)
    LD B, 12        ; B = line height (same as in draw loop)
    MUL B           ; A = A * B (selected_index * line_height) -> Result in HL
    LD A, L
    ADD A, 10       ; Add start Y coordinate (10)
    LD E, A         ; E = final Y coordinate for sprite

    ; Update sprite attribute table
    LD HL, SPRITE_ATTR_TABLE
    LD (HL), E      ; Set Y coordinate for sprite 0

    ; Set X coordinate (example: 50 pixels)
    INC HL
    LD (HL), 50

    ; Set pattern index (assuming cursor is first pattern in its asset)
    INC HL
    LD (HL), 0

    ; Set color
    INC HL
    LD A, (MENU_COLOR_HIGHLIGHT_TEXT) ; Use highlight text color for cursor
    LD (HL), A

    RET

; ==============================================================================
; MENU_EXECUTE_ACTION: Jumps to game code based on selected option
; ==============================================================================
Menu_ExecuteAction:
    LD A, (SelectedOption)
    ADD A, A            ; Multiply by 2 for word-sized jump table entries
    LD L, A
    LD H, 0
    LD IX, Menu_ActionJumpTable
    ADD IX, HL          ; IX points to the correct entry in the jump table

    LD L, (IX+0)
    LD H, (IX+1)
    JP (HL)             ; Jump to the routine address

Menu_ActionJumpTable:
    DW Start_New_Game           ; Action for Option 0
    DW Show_Continue_Screen     ; Action for Option 1
    DW Show_Settings_Screen     ; Action for Option 2
    DW Show_Help_Screen         ; Action for Option 3
    ; ... Add more DW entries to match MENU_OPTIONS_COUNT ...

; ------------------------------------------------------------------------------
; --- Game-Specific Routines (STUBS - MUST BE IMPLEMENTED BY THE DEVELOPER) ---
; ------------------------------------------------------------------------------
Start_New_Game:
    ; Your code to start a new game goes here
    ; For example, load level 1, initialize player, etc.
    RET ; Or JP to game loop

Show_Continue_Screen:
    ; Your code to show the password/continue screen
    RET

Show_Settings_Screen:
    ; Your code for the settings/options screen
    RET

Show_Help_Screen:
    ; Your code for the help/instructions screen
    RET

; ------------------------------------------------------------------------------
; --- Helper Subroutines ---
; ------------------------------------------------------------------------------
LoadMenuCursorSpritePattern:
    ; HL = Pointer to sprite data in RAM
    ; This is a placeholder. You need a routine to load sprite
    ; pattern data from RAM (HL) to VRAM sprite pattern table.
    ; For sprite 0, this is typically VRAM address #3800.
    LD DE, #3800 ; Sprite Pattern Generator Table for sprite 0
    ; Assumes cursor is 16x16 = 32 bytes
    LD BC, 32
    CALL LDIRVM
    RET

DrawMenuBackgroundScreen:
    ; HL = Pointer to screen map layout data in RAM
    ; This is a placeholder. You need a routine to load a screen
    ; layout from RAM (HL) to the VRAM name table (#1800).
    LD DE, NAME_TABLE
    LD BC, 32*24 ; Assuming 32x24 screen
    CALL LDIRVM
    RET

; ------------------------------------------------------------------------------
; --- BIOS Calls (Assumed to be defined elsewhere in your project) ---
; ------------------------------------------------------------------------------
;GTSTCK: EQU #00D5
;PRNSTR: EQU #00A2
;CHGCLR: EQU #0062
;FORCLR: EQU #F3E9
;BAKCLR: EQU #F3EA
;LDIRVM: EQU #005C
; ... and others you might need ...
`
      },
      {
        name: "asm/rle_decompress.asm",
        content: `;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
;; RUTINA DE DESCOMPRESIÓN SuperRLE (LITERAL + RLE + PATRONES LZ)
;;
;; Parámetros de Entrada:
;;   - HL: Puntero a la dirección de origen (datos comprimidos).
;;   - DE: Puntero a la dirección de destino (donde se descomprimen los datos).
;;
;; Formato de Compresión:
;;   - Byte de control N:
;;     - N de 1-126: Copia Literal. Copia los siguientes N bytes.
;;     - N = 127: Escape para Copia de Patrón. Los 2 bytes siguientes son
;;                  [CONTEO, DESPLAZAMIENTO]. Copia CONTEO bytes desde la
;;                  dirección (DESTINO_ACTUAL - DESPLAZAMIENTO).
;;     - N de 128-255: Repetición RLE. Repite el siguiente byte (256-N) veces.
;;     - N = 0: Fin de los datos.
;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

DecompressSuperRLE:
.loop
    LD A, (HL)          ; Cargar el byte de control
    INC HL
    OR A                ; ¿Es cero?
    RET Z               ; Sí, fin de los datos, retornar.

    CP 127              ; ¿Es el código de escape para patrón (127)?
    JR Z, .is_pattern   ; Sí, saltar a la lógica de patrones.

    BIT 7, A            ; ¿Está activado el bit 7 (N >= 128)?
    JR NZ, .is_repeat   ; Sí, es una repetición RLE.

.is_literal             ; Rango 1-126 (0x01 - 0x7E)
    LD C, A             ; C = número de bytes a copiar
    LD B, 0             ; BC = número de bytes a copiar
    LDIR                ; Copia BC bytes de (HL) a (DE)
    JR .loop

.is_repeat              ; Rango 128-255 (0x80 - 0xFF)
    LD B, A             ; Guardar valor de control en B
    XOR A               ; A = 0
    SUB B               ; A = 256 - B (número de repeticiones)
    LD B, A             ; B = contador de repeticiones
    LD A, (HL)          ; A = valor a repetir (leído después del byte de control)
    INC HL
.repeat_byte_loop
    LD (DE), A
    INC DE
    DJNZ .repeat_byte_loop
    JR .loop

.is_pattern             ; Control fue 127 (0x7F)
    LD C, (HL)          ; C = CONTEO de bytes a copiar del patrón
    INC HL
    LD A, (HL)          ; A = DESPLAZAMIENTO hacia atrás (offset)
    INC HL

    PUSH HL             ; Guardar puntero de datos comprimidos (origen)
    PUSH BC             ; Guardar contador (C en BC)

    LD H, D             ; HL = DE (puntero de destino actual)
    LD L, E

    LD B, 0             ; BC = desplazamiento (B=0, C=offset_val_A)
    LD C, A

    SBC HL, BC          ; HL = DE - Desplazamiento. HL es ahora el ORIGEN de la copia del patrón.
                        ; El buffer de destino (DE) se usa como fuente para el patrón.

    POP BC              ; Recuperar contador en BC (B=0, C=conteo_original)

    ; Ahora:
    ; HL = origen de la copia (en el buffer de destino ya descomprimido)
    ; DE = destino de la copia (donde se escribirán los bytes del patrón)
    ; BC = contador de bytes a copiar
    LDIR                ; Copia el patrón

    POP HL              ; Restaurar el puntero de datos comprimidos
    JR .loop
`
      },
      {
        name: "asm/screen_decompress.asm",
        content: `; Your game should include one of these routines.
; DecompressRLE is faster but assumes perfect data.
; DecompressRLE_Safe is more robust for development.

; -------------------------------------------------------------------
; DecompressRLE - Fast Version (uses LDIR)
; HL: source address (compressed data, after width/height)
; DE: destination address (VRAM)
; BC: total bytes to decompress (width * height)
; -------------------------------------------------------------------
DecompressRLE:
.main_loop:
    LD A, (HL)      ; Get control byte
    INC HL
    BIT 7, A        ; Check if it's a repeat packet
    JR NZ, .repeat_packet

.literal_packet:    ; Literal packet (bit 7 is 0)
    PUSH BC         ; Save main counter
    LD C, A         ; Low 7 bits are the count
    LD B, 0
    LDIR            ; Copy C bytes from (HL) to (DE)
    POP BC          ; Restore main counter
    JR .check_end

.repeat_packet:     ; Repeat packet (bit 7 is 1)
    AND %01111111   ; Clear bit 7 to get count
    LD C, A         ; C = count
    LD A, (HL)      ; Get byte to repeat
    INC HL
.repeat_loop:
    LD (DE), A
    INC DE
    DEC C
    JR NZ, .repeat_loop
    ; Fall through to check_end

.check_end:
    LD A, B
    OR C
    RET Z           ; Return if BC is zero
    JR .main_loop

; -------------------------------------------------------------------
; DecompressRLE_Safe - Robust version (no LDIR)
; HL: source address (compressed data, after width/height)
; DE: destination address (VRAM)
; BC: total bytes to decompress (width * height)
; -------------------------------------------------------------------
DecompressRLE_Safe:
.main_loop_safe:
    LD A, B
    OR C
    RET Z           ; Return if BC is zero

    LD A, (HL)      ; Get control byte
    INC HL
    BIT 7, A        ; Check if it's a repeat packet
    JR NZ, .repeat_packet_safe

.literal_packet_safe: ; Literal packet (bit 7 is 0)
    LD B, A         ; B = count of literal bytes
.literal_loop_safe:
    LD A, (HL)
    INC HL
    LD (DE), A
    INC DE
    DEC BC          ; Decrement main counter
    DJNZ .literal_loop_safe
    JR .main_loop_safe

.repeat_packet_safe:  ; Repeat packet (bit 7 is 1)
    AND %01111111   ; Clear bit 7 to get count
    LD B, A         ; B = count of repeats
    LD A, (HL)      ; Get byte to repeat
    INC HL
.repeat_loop_safe:
    LD (DE), A
    INC DE
    DEC BC          ; Decrement main counter
    DJNZ .repeat_loop_safe
    JR .main_loop_safe
`
      },
      {
        name: "asm/zx0_decompress.asm",
        content: `; -----------------------------------------------------------------------------
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
; -----------------------------------------------------------------------------`
      },
      {
        name: "asm/pletter_decompress.asm",
        content: `; pletter v0.5c msx unpacker

; call unpack with hl pointing to some pletter5 data, and de pointing to the destination.
; changes all registers

; define lengthindata when the original size is written in the pletter data

;  define LENGTHINDATA

  module pletter

  macro GETBIT
  add a,a
  call z,getbit
  endm

  macro GETBITEXX
  add a,a
  call z,getbitexx
  endm

unpack:

  ifdef LENGTHINDATA
  inc hl
  inc hl
  endif

  ld a,(hl)
  inc hl
  exx
  ld de,0
  add a,a
  inc a
  rl e
  add a,a
  rl e
  add a,a
  rl e
  rl e
  ld hl,modes
  add hl,de
  ld e,(hl)
  ld ixl,e
  inc hl
  ld e,(hl)
  ld ixh,e
  ld e,1
  exx
  ld iy,loop
literal:
  ldi
loop:
  GETBIT
  jr nc,literal
  exx
  ld h,d
  ld l,e
getlen:
  GETBITEXX
  jr nc,.lenok
.lus:
  GETBITEXX
  adc hl,hl
  ret c
  GETBITEXX
  jr nc,.lenok
  GETBITEXX
  adc hl,hl
  ret c
  GETBITEXX
  jp c,.lus
.lenok:
  inc hl
  exx
  ld c,(hl)
  inc hl
  ld b,0
  bit 7,c
  jp z,offsok
  jp ix

mode6:
  GETBIT
  rl b
mode5:
  GETBIT
  rl b
mode4:
  GETBIT
  rl b
mode3:
  GETBIT
  rl b
mode2:
  GETBIT
  rl b
  GETBIT
  jr nc,offsok
  or a
  inc b
  res 7,c
offsok:
  inc bc
  push hl
  exx
  push hl
  exx
  ld l,e
  ld h,d
  sbc hl,bc
  pop bc
  ldir
  pop hl
  jp iy

getbit:
  ld a,(hl)
  inc hl
  rla
  ret

getbitexx:
  exx
  ld a,(hl)
  inc hl
  exx
  rla
  ret

modes:
  word offsok
  word mode2
  word mode3
  word mode4
  word mode5
  word mode6

  endmodule

;eof
`
      },
      {
        name: "asm/rle_decompress_generic.asm",
        content: `; Generic RLE Decompressor from Chibi Akumas
; Source: https://www.chibiakumas.com/z80/multiplatform2.php
;
; Parameters:
;   HL: source address (compressed data)
;   DE: destination address (decompressing)
;
; Format:
;   Header byte:
;     0: End of data.
;     Top bit 1: RLE compressed data. The other 7 bits are the count (1-127). The next byte is the value to repeat.
;     Top bit 0: Linear uncompressed data. The other 7 bits are the count (1-127). The next \`count\` bytes are copied literally.

RLEDECOMPRESS:
 LD A,(HL)
 INC HL
 AND A
 RET Z
 JP M,RLEDECOMPRESS_RLE
RLEDECOMPRESS_LINEAR:
 LD C,A
 LD B,0
 LDIR
 JP RLEDECOMPRESS
RLEDECOMPRESS_RLE:
 AND %01111111
 LD C,A
 LD A,(HL)
 INC HL
RLEDECOMPRESS_RLENEXT:
 LD (DE),A
 INC DE
 DEC C
 JP NZ,RLEDECOMPRESS_RLENEXT
 JP RLEDECOMPRESS
`
      }
    ];

    setAssets(prevAssets => {
      const newAssets = [...prevAssets];
      asmFiles.forEach(file => {
        if (!newAssets.some(asset => asset.name === file.name)) {
          newAssets.push({
            id: `code_${file.name.replace(/\//g, '_').replace('.asm', '')}_${Date.now()}`,
            name: file.name,
            type: 'code',
            data: file.content
          });
        }
      });
      return newAssets;
    });
  }, []);

  const [copiedScreenBuffer, setCopiedScreenBuffer] = useState<CopiedScreenData | null>(null);
  const [copiedTileData, setCopiedTileData] = useState<CopiedTileData | null>(null);
  const [copiedLayerBuffer, setCopiedLayerBuffer] = useState<CopiedLayerData | null>(null); 

  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; position: { x: number; y: number }; items: ContextMenuItem[] } | null>(null);

  const [waypointPickerState, setWaypointPickerState] = useState<WaypointPickerState>({ isPicking: false, entityInstanceId: null, componentDefId: null, waypointPrefix: 'waypoint1' });

  const handleUpdateSpriteOrder = (reorderedSpriteAssets: ProjectAsset[]) => {
    setAssetsWithHistory(prevAssets => {
        const nonSpriteAssets = prevAssets.filter(a => a.type !== 'sprite');
        const firstSpriteIndex = prevAssets.findIndex(a => a.type === 'sprite');
        
        const newAssets = [...nonSpriteAssets];
        if (firstSpriteIndex !== -1) {
            newAssets.splice(firstSpriteIndex, 0, ...reorderedSpriteAssets);
        } else {
            newAssets.push(...reorderedSpriteAssets);
        }
        return newAssets;
    });
    setIsSpriteSheetModalOpen(false);
    setStatusBarMessage(`Sprite order updated.`);
  };

  const handleOpenSpriteFramesModal = (spriteAsset: ProjectAsset) => {
    setSpriteForFramesModal(spriteAsset);
    setIsSpriteFramesModalOpen(true);
  };

  const handleSplitFrames = (spriteAsset: ProjectAsset) => {
    const originalSprite = spriteAsset.data as Sprite;
    if (!originalSprite || originalSprite.frames.length === 0) {
        setStatusBarMessage("No frames to split.");
        return;
    }

    const newAssetsToCreate: ProjectAsset[] = [];
    originalSprite.frames.forEach((frame, index) => {
        const newSpriteId = `sprite_${Date.now()}_${index}`;
        const newSpriteName = `${originalSprite.name}_frame${index}`;

        const newSpriteData: Sprite = {
            id: newSpriteId,
            name: newSpriteName,
            size: { ...originalSprite.size },
            spritePalette: [...originalSprite.spritePalette],
            backgroundColor: originalSprite.backgroundColor,
            frames: [{ ...frame, id: `frame_${Date.now()}` }], // New frame with new ID
            currentFrameIndex: 0,
        };

        const newAsset: ProjectAsset = {
            id: newSpriteId,
            name: newSpriteName,
            type: 'sprite',
            data: newSpriteData,
        };
        newAssetsToCreate.push(newAsset);
    });

    setAssetsWithHistory(prevAssets => [...prevAssets, ...newAssetsToCreate]);
    setStatusBarMessage(`Split ${originalSprite.frames.length} frames from '${originalSprite.name}' into new sprites.`);
    setIsSpriteFramesModalOpen(false);
    setSpriteForFramesModal(null);
  };

  const handleCreateSpriteFromFrame = (sourceSpriteId: string, sourceFrameIndex: number) => {
    const sourceAsset = assets.find(a => a.id === sourceSpriteId && a.type === 'sprite');
    if (!sourceAsset) {
      setStatusBarMessage("Error: Source sprite not found.");
      return;
    }
    const sourceSprite = sourceAsset.data as Sprite;
    const sourceFrame = sourceSprite.frames[sourceFrameIndex];
    if (!sourceFrame) {
      setStatusBarMessage("Error: Source frame not found.");
      return;
    }

    const newSpriteId = `sprite_from_frame_${Date.now()}`;
    const newSpriteName = `${sourceSprite.name}_frame_${sourceFrameIndex}`;

    const newFrame: SpriteFrame = {
      id: `frame_${Date.now()}`,
      data: JSON.parse(JSON.stringify(sourceFrame.data)), // Deep copy
    };

    const newSpriteData: Sprite = {
      id: newSpriteId,
      name: newSpriteName,
      size: { ...sourceSprite.size },
      spritePalette: [...sourceSprite.spritePalette],
      backgroundColor: sourceSprite.backgroundColor,
      frames: [newFrame],
      currentFrameIndex: 0,
    };

    const newAsset: ProjectAsset = {
      id: newSpriteId,
      name: newSpriteName,
      type: 'sprite',
      data: newSpriteData,
    };
    
    setAssetsWithHistory(prevAssets => [...prevAssets, newAsset]);
    setSelectedAssetId(newSpriteId);
    setCurrentEditor(EditorType.Sprite);
    setStatusBarMessage(`Created new sprite '${newSpriteName}' from frame.`);
  };

  const handleWaypointPicked = (point: Point) => {
    if (!waypointPickerState.isPicking || !waypointPickerState.entityInstanceId || !waypointPickerState.componentDefId || !selectedAssetId) {
      setWaypointPickerState({ isPicking: false, entityInstanceId: null, componentDefId: null, waypointPrefix: 'waypoint1' });
      return;
    }
  
    const { entityInstanceId, componentDefId, waypointPrefix } = waypointPickerState;
    
    const activeScreenMapAsset = assets.find(a => a.id === selectedAssetId);
    if (!activeScreenMapAsset || activeScreenMapAsset.type !== 'screenmap') return;
    const activeScreenMap = activeScreenMapAsset.data as ScreenMap;
    
    const entityToUpdate = activeScreenMap.layers.entities.find(e => e.id === entityInstanceId);
    if (!entityToUpdate) return;
    
    const isScreen2 = currentScreenMode === "SCREEN 2 (Graphics I)";
    const EDITOR_BASE_TILE_DIM = isScreen2 ? EDITOR_BASE_TILE_DIM_S2 : 16;
    
    const finalPixelX = point.x * EDITOR_BASE_TILE_DIM;
    const finalPixelY = point.y * EDITOR_BASE_TILE_DIM;
    
    const newOverrides = JSON.parse(JSON.stringify(entityToUpdate.componentOverrides || {}));
    if (!newOverrides[componentDefId]) {
      newOverrides[componentDefId] = {};
    }
    
    newOverrides[componentDefId][`${waypointPrefix}_x`] = finalPixelX;
    newOverrides[componentDefId][`${waypointPrefix}_y`] = finalPixelY;
  
    const updatedEntities = activeScreenMap.layers.entities.map(e => 
      e.id === entityInstanceId ? { ...e, componentOverrides: newOverrides } : e
    );
    
    handleUpdateAsset(selectedAssetId, { layers: { ...activeScreenMap.layers, entities: updatedEntities } });
  
    setWaypointPickerState({ isPicking: false, entityInstanceId: null, componentDefId: null, waypointPrefix: 'waypoint1' });
    setStatusBarMessage(`Waypoint set to pixel coordinates (${finalPixelX}, ${finalPixelY}).`);
  };
  

  const showContextMenu = (position: { x: number; y: number }, items: ContextMenuItem[]) => {
    setContextMenu({ isOpen: true, position, items });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };
  
  useEffect(() => {
    const playTadaSound = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
      if (!audioContext) return;
  
      if (audioContext.state === 'suspended') {
          audioContext.resume().catch(e => console.warn("AudioContext resume failed", e));
      }
      
      const now = audioContext.currentTime;
      const gainNode = audioContext.createGain();
      gainNode.connect(audioContext.destination);
      
      const osc1 = audioContext.createOscillator();
      const osc2 = audioContext.createOscillator();
      
      osc1.type = 'triangle';
      osc2.type = 'triangle';
      
      osc1.frequency.value = 523.25; 
      osc2.frequency.value = 783.99;
  
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.4, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
  
      osc1.connect(gainNode);
      osc2.connect(gainNode);
  
      osc1.start(now);
      osc2.start(now + 0.12);
  
      osc1.stop(now + 1.0);
      osc2.stop(now + 1.0);
  
      setTimeout(() => {
          audioContext.close();
      }, 1500);
    };
  
    try {
        playTadaSound();
    } catch(e) {
        console.error("Could not play init sound:", e);
    }
  
  }, []);
  
  const playAutosaveSound = useCallback(() => {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (!audioContext) return;

        if (audioContext.state === 'suspended') {
            audioContext.resume().catch(e => console.warn("AudioContext resume failed for autosave sound", e));
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01); 
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.1); 

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);

        setTimeout(() => audioContext.close(), 500);
    } catch (e) {
        console.warn("Autosave sound playback failed:", e);
    }
  }, []);
  
  const pushToHistory = useCallback((type: HistoryActionType, before: any, after: any) => {
    if (JSON.stringify(before) === JSON.stringify(after)) {
        return;
    }
    const newAction: HistoryAction = {
        type,
        payload: { before: deepCopy(before), after: deepCopy(after) },
    };
    setHistory(prev => {
        const newUndoStack = [...prev.undoStack, newAction];
        if (newUndoStack.length > MAX_HISTORY_LENGTH) {
            newUndoStack.shift();
        }
        return { undoStack: newUndoStack, redoStack: [] };
    });
  }, []);

  const clearAllHistory = () => {
    setHistory({ undoStack: [], redoStack: [] });
  };

  const setAssetsWithHistory = useCallback((updater: (prev: ProjectAsset[]) => ProjectAsset[]) => {
    setAssets(prevAssets => {
        const newAssets = updater(prevAssets);
        pushToHistory('ASSETS_UPDATE', prevAssets, newAssets);
        return newAssets;
    });
  }, [pushToHistory]);

  const setTileBanks = useCallback((updater: TileBank[] | ((prev: TileBank[]) => TileBank[])) => {
    setTileBanksState(prevBanks => {
        const newBanks = typeof updater === 'function' ? (updater as (prev: TileBank[]) => TileBank[])(prevBanks) : updater;
        pushToHistory('TILE_BANKS_UPDATE', prevBanks, newBanks);
        return newBanks;
    });
  }, [pushToHistory]);

  const setMsxFont = useCallback((updater: MSXFont | ((prev: MSXFont) => MSXFont)) => {
    setMsxFontState(prevFont => {
        const newFont = typeof updater === 'function' ? (updater as (prev: MSXFont) => MSXFont)(prevFont) : updater;
        pushToHistory('FONT_UPDATE', prevFont, newFont);
        return newFont;
    });
  }, [pushToHistory]);

  const setMsxFontColorAttributes = useCallback((updater: MSXFontColorAttributes | ((prev: MSXFontColorAttributes) => MSXFontColorAttributes)) => {
    setMsxFontColorAttributesState(prevAttrs => {
        const newAttrs = typeof updater === 'function' ? (updater as (prev: MSXFontColorAttributes) => MSXFontColorAttributes)(prevAttrs) : updater;
        pushToHistory('FONT_COLOR_UPDATE', prevAttrs, newAttrs);
        return newAttrs;
    });
  }, [pushToHistory]);

  const setComponentDefinitions = useCallback((updater: ComponentDefinition[] | ((prev: ComponentDefinition[]) => ComponentDefinition[])) => {
    setComponentDefinitionsState(prevDefs => {
        const newDefs = typeof updater === 'function' ? (updater as (prev: ComponentDefinition[]) => ComponentDefinition[])(prevDefs) : updater;
        pushToHistory('COMPONENT_DEFINITIONS_UPDATE', prevDefs, newDefs);
        return newDefs;
    });
  }, [pushToHistory]);

  const setEntityTemplates = useCallback((updater: EntityTemplate[] | ((prev: EntityTemplate[]) => EntityTemplate[])) => {
    setEntityTemplatesState(prevTpls => {
        const newTpls = typeof updater === 'function' ? (updater as (prev: EntityTemplate[]) => EntityTemplate[])(prevTpls) : updater;
        pushToHistory('ENTITY_TEMPLATES_UPDATE', prevTpls, newTpls);
        return newTpls;
    });
  }, [pushToHistory]);
  
  const setMainMenuConfig = useCallback((updater: MainMenuConfig | ((prev: MainMenuConfig) => MainMenuConfig)) => {
    setMainMenuConfigState(prevConfig => {
        const newConfig = typeof updater === 'function' ? (updater as (prev: MainMenuConfig) => MainMenuConfig)(prevConfig) : updater;
        pushToHistory('MAIN_MENU_UPDATE', prevConfig, newConfig);
        return newConfig;
    });
  }, [pushToHistory]);

  const handleUpdateAsset = useCallback((assetId: string, updatedData: any, newAssetsToCreate?: ProjectAsset[]) => {
    setAssetsWithHistory(prevAssets => {
      let intermediateAssets = prevAssets;
      if (newAssetsToCreate && newAssetsToCreate.length > 0) {
        intermediateAssets = [...prevAssets, ...newAssetsToCreate];
        
        const newAssetTypes = new Set(newAssetsToCreate.map(a => a.type));
        let message = `Created ${newAssetsToCreate.length} new ${Array.from(newAssetTypes).join('/')} asset(s).`;
        if (newAssetsToCreate.length === 1) message = `Created new ${newAssetsToCreate[0].type} asset: ${newAssetsToCreate[0].name}.`;
        setStatusBarMessage(message);
      }

      const isDataUpdateNeeded = updatedData && (! (typeof updatedData === 'object' && Object.keys(updatedData).length === 0));

      if (!isDataUpdateNeeded) {
        return intermediateAssets;
      }
      
      return intermediateAssets.map(asset => {
        if (asset.id === assetId) {
          let newAssetData: ProjectAsset['data'] = asset.data;
          switch (asset.type) {
            case 'tile': case 'sprite': case 'boss': case 'screenmap': case 'worldmap': case 'sound': case 'track': case 'behavior': case 'componentdefinition': case 'entitytemplate':
              if (asset.data && typeof asset.data === 'object' && typeof updatedData === 'object') {
                newAssetData = { ...asset.data, ...updatedData } as any;
              }
              break;
            case 'code':
              if (typeof updatedData === 'string') { newAssetData = updatedData; }
              break;
            default: break;
          }
          return { ...asset, data: newAssetData };
        }
        return asset;
      });
    });
  }, [setAssetsWithHistory, setStatusBarMessage]);

  useEffect(() => { localStorage.setItem(SNIPPETS_STORAGE_KEY, JSON.stringify(userSnippets));}, [userSnippets]);
  const handleOpenSnippetEditor = (snippet: Snippet | null) => { setEditingSnippet(snippet); setIsSnippetEditorModalOpen(true); };
  const handleSaveSnippet = (snippetToSave: Snippet) => { setUserSnippets(prevSnippets => { const existingIndex = prevSnippets.findIndex(s => s.id === snippetToSave.id); if (existingIndex > -1) { const updatedSnippets = [...prevSnippets]; updatedSnippets[existingIndex] = snippetToSave; return updatedSnippets; } else { return [...prevSnippets, snippetToSave]; }}); setIsSnippetEditorModalOpen(false); setEditingSnippet(null); setStatusBarMessage(`Snippet "${snippetToSave.name}" saved.`);};
  const handleDeleteSnippet = (snippetId: string) => { const snippetToDelete = userSnippets.find(s => s.id === snippetId); if (snippetToDelete) { setConfirmModalProps({ title: "Delete Snippet", message: `Are you sure you want to delete snippet "${snippetToDelete.name}"? This cannot be undone.`, onConfirm: () => { setUserSnippets(prevSnippets => prevSnippets.filter(s => s.id !== snippetId)); setStatusBarMessage(`Snippet "${snippetToDelete.name}" deleted.`); setIsConfirmModalOpen(false);}, confirmText: "Delete", confirmButtonVariant: 'danger'}); setIsConfirmModalOpen(true);}};
  
  const handleSnippetSelected = useCallback((snippet: Snippet) => {
    const resolvedCode = resolveSnippetPlaceholders(snippet.code, {
      assets,
      tileBanks,
    });
    setSnippetToInsert({ code: resolvedCode, timestamp: Date.now() });
  }, [assets, tileBanks]);

  useEffect(() => { const savedConfig = localStorage.getItem('ideConfig'); if (savedConfig) { try { const parsed = JSON.parse(savedConfig); if (parsed.dataOutputFormat) setDataOutputFormat(parsed.dataOutputFormat); if (typeof parsed.autosaveEnabled === 'boolean') setAutosaveEnabled(parsed.autosaveEnabled); if (typeof parsed.snippetsEnabled === 'boolean') setSnippetsEnabled(parsed.snippetsEnabled); if (typeof parsed.syntaxHighlightingEnabled === 'boolean') setSyntaxHighlightingEnabled(parsed.syntaxHighlightingEnabled); } catch (e) { console.error("Failed to load IDE config from localStorage", e); }}}, []);
  const saveIdeConfig = () => { const configToSave = { dataOutputFormat, autosaveEnabled, snippetsEnabled, syntaxHighlightingEnabled }; localStorage.setItem('ideConfig', JSON.stringify(configToSave)); setStatusBarMessage("IDE configuration saved to browser.");};
  const resetIdeConfig = () => { setDataOutputFormat('hex'); setAutosaveEnabled(true); setSnippetsEnabled(true); setSyntaxHighlightingEnabled(true); localStorage.removeItem('ideConfig'); setStatusBarMessage("IDE configuration reset to defaults.");};
  useEffect(() => { localStorage.setItem('tileBanksConfig', JSON.stringify(tileBanks));}, [tileBanks]);
  const handleOpenNewProjectModal = () => setIsNewProjectModalOpen(true);

  const handleConfirmNewProject = (projectNameFromModal: string) => {
    setConfirmModalProps({
      title: "Create New Project?",
      message: ( <> <p>Are you sure you want to create a new project named "{projectNameFromModal}"?</p> <p className="text-msx-warning mt-2">This will clear all current unsaved assets and history.</p> </> ),
      onConfirm: () => {
        setAssets([]);
        setSelectedAssetId(null);
        setCurrentProjectName(projectNameFromModal); 
        setCurrentEditor(EditorType.None);
        setTileBanksState(DEFAULT_TILE_BANKS_CONFIG); 
        setComponentDefinitionsState(DEFAULT_COMPONENT_DEFINITIONS);
        setEntityTemplatesState(DEFAULT_ENTITY_TEMPLATES);
        setMainMenuConfigState(DEFAULT_MAIN_MENU_CONFIG);
        clearAllHistory(); 
        setCopiedScreenBuffer(null); 
        setCopiedTileData(null);
        setCopiedLayerBuffer(null); 
        setSelectedEffectZoneId(null);
        const newProjectFiles = [ "main.asm", "data/graphics.asm", "data/components.asm", "code/behaviors.asm"];
        const formattedDate = getFormattedDate();
        const createdAssets: ProjectAsset[] = [];
        let mainAsmAssetId: string | null = null;
        newProjectFiles.forEach(filename => { const fileContent = filename === "main.asm" ? generateMainAsmContent(projectNameFromModal, formattedDate) : generateAsmFileHeader(projectNameFromModal, formattedDate, filename); const assetId = `code_new_${projectNameFromModal.replace(/\s+/g, '_')}_${filename.replace('.asm', '').replace(/\//g, '_')}_${Date.now()}_${Math.random().toString(36).substring(2,7)}`; const newAsset: ProjectAsset = { id: assetId, name: filename, type: 'code', data: fileContent }; createdAssets.push(newAsset); if (filename === "main.asm") { mainAsmAssetId = assetId; }});
        setAssets(createdAssets);
        if (mainAsmAssetId) { setSelectedAssetId(mainAsmAssetId); setCurrentEditor(EditorType.Code); setStatusBarMessage(`Project "${projectNameFromModal}" created. main.asm opened.`);} else { setStatusBarMessage(`Project "${projectNameFromModal}" created.`);}
        setIsNewProjectModalOpen(false); setIsConfirmModalOpen(false);
      }, confirmText: "Create New", confirmButtonVariant: 'danger'
    });
    setIsConfirmModalOpen(true);
  };

  const handleNewAsset = (type: ProjectAsset['type']) => {
    const id = `${type}_${Date.now()}`;
    let newAssetData: any;
    let defaultName = `New ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    let newEditorType: EditorType = EditorType.None;
    const defaultLogicalProps: TileLogicalProperties = {
      mapId: 0, familyId: 0, instanceId: 0,
      isSolid: false, isBreakable: false, causesDamage: false,
      isMovable: false, isInteractiveSwitch: false,
    };

    switch (type) {
      case 'tile': 
        const tileW = DEFAULT_TILE_WIDTH; 
        const tileH = DEFAULT_TILE_HEIGHT; 
        const initialColor = currentScreenMode === "SCREEN 2 (Graphics I)" ? DEFAULT_SCREEN2_FG_COLOR : MSX_SCREEN5_PALETTE[1].hex; 
        newAssetData = { 
            id, name: defaultName, width: tileW, height: tileH, 
            data: Array(tileH).fill(null).map(() => Array(tileW).fill(initialColor)), 
            ...(currentScreenMode === "SCREEN 2 (Graphics I)" && { lineAttributes: createDefaultLineAttributes(tileW, tileH, DEFAULT_SCREEN2_FG_COLOR, DEFAULT_SCREEN2_BG_COLOR) }),
            logicalProperties: defaultLogicalProps 
        } as Tile; 
        newEditorType = EditorType.Tile; 
        break;
      case 'sprite': newAssetData = { id, name: defaultName, size: { width: DEFAULT_SPRITE_SIZE, height: DEFAULT_SPRITE_SIZE }, spritePalette: [MSX_SCREEN5_PALETTE[1].hex, MSX_SCREEN5_PALETTE[2].hex, MSX_SCREEN5_PALETTE[8].hex, MSX_SCREEN5_PALETTE[15].hex], backgroundColor: MSX_SCREEN5_PALETTE[0].hex, frames: [{ id: `frame_${Date.now()}`, data: Array(DEFAULT_SPRITE_SIZE).fill(null).map(() => Array(DEFAULT_SPRITE_SIZE).fill(MSX_SCREEN5_PALETTE[0].hex)) }], currentFrameIndex: 0, } as Sprite; newEditorType = EditorType.Sprite; break;
      case 'boss': 
        const defaultPhase: BossPhase = {
            id: `phase_initial_${Date.now()}`,
            name: 'Phase 1',
            healthThreshold: 100,
            buildType: 'tile',
            dimensions: { width: 8, height: 8 },
            tileMatrix: Array(8).fill(null).map(() => Array(8).fill(null)),
            collisionMatrix: Array(8).fill(null).map(() => Array(8).fill(false)),
            weakPoints: [],
            attackSequence: [],
        };
        newAssetData = {
            id, name: defaultName,
            totalHealth: 100,
            phases: [defaultPhase],
            attacks: [],
        } as Boss;
        newEditorType = EditorType.Boss;
        break;
      case 'screenmap': const mapW = DEFAULT_SCREEN_WIDTH_TILES; const mapH = DEFAULT_SCREEN_HEIGHT_TILES; const emptyLayer: ScreenLayerData = Array(mapH).fill(null).map(() => Array(mapW).fill({ tileId: null })); newAssetData = { id, name: defaultName, width: mapW, height: mapH, layers: { background: emptyLayer, collision: [...emptyLayer.map(r => r.map(c => ({...c})))], effects: [...emptyLayer.map(r => r.map(c => ({...c})))], entities: [] }, effectZones: [], activeAreaX: 0, activeAreaY: 0, activeAreaWidth: mapW, activeAreaHeight: mapH, hudConfiguration: { elements: [] } } as ScreenMap; newEditorType = EditorType.Screen; break;
      case 'worldmap': newAssetData = { id, name: defaultName, nodes: [], connections: [], startScreenNodeId: null, gridSize: 40, zoomLevel: 1, panOffset: {x:0, y:0} } as WorldMapGraph; newEditorType = EditorType.WorldMap; break;
      case 'sound': const defaultChannelState: PSGSoundChannelState = { id: 'A', steps: [ { id: `step_${Date.now()}`, tonePeriod: 257, volume: 10, toneEnabled: true, noiseEnabled: false, useEnvelope: false, durationMs: 200 } ], loop: false }; newAssetData = { id, name: defaultName, tempoBPM: 120, channels: [defaultChannelState, { ...defaultChannelState, id: 'B', steps: [] }, { ...defaultChannelState, id: 'C', steps: [] }], noisePeriod: 16, envelopePeriod: 256, envelopeShape: 0b1000, masterVolume: 1.0, } as PSGSoundData; newEditorType = EditorType.Sound; break;
      case 'track': const initialPattern = createDefaultPT3Pattern(`initial_${Date.now()}`); newAssetData = { id, name: defaultName, bpm: DEFAULT_PT3_BPM, speed: DEFAULT_PT3_SPEED, globalVolume: 15, patterns: [initialPattern], order: [0], lengthInPatterns: 1, restartPosition: 0, instruments: [], ornaments: [], currentPatternIndexInOrder: 0, currentPatternId: initialPattern.id, } as TrackerSongData; newEditorType = EditorType.Track; break;
      case 'behavior': defaultName = "NewBehaviorScript.asm"; newAssetData = { id, name: defaultName, code: Z80_BEHAVIOR_SNIPPETS[0]?.code || "; New Behavior Script\n\nentity_update:\n    ret\n" } as BehaviorScript; newEditorType = EditorType.BehaviorEditor; break;
      case 'code': const formattedDate = getFormattedDate(); let projectNameForHeader = currentProjectName || "UntitledProject"; defaultName = "NewCodeFile.asm"; newAssetData = generateAsmFileHeader(projectNameForHeader, formattedDate, defaultName); newEditorType = EditorType.Code; break;
      default: setStatusBarMessage(`Asset type ${type} creation not implemented for this flow.`); return;
    }
    const newAsset: ProjectAsset = { id, name: defaultName, type, data: newAssetData };
    setAssetsWithHistory(prev => [...prev, newAsset]);
    setSelectedAssetId(id);
    setCurrentEditor(newEditorType);
    if (type === 'screenmap') setSelectedEffectZoneId(null); 
    setStatusBarMessage(`${defaultName} created.`);
  };

  
  const handleSpriteImported = (newSpriteData: Omit<Sprite, 'id' | 'name'>) => {
    const id = `sprite_imported_${Date.now()}`;
    const name = `Imported Sprite ${assets.filter(a => a.type === 'sprite').length + 1}`;
    const fullSpriteData: Sprite = {
      ...newSpriteData,
      id,
      name,
      currentFrameIndex: newSpriteData.frames.length > 0 ? 0 : -1, 
    };
    const newAsset: ProjectAsset = { id, name, type: 'sprite', data: fullSpriteData };
    setAssetsWithHistory(prev => [...prev, newAsset]);
    setSelectedAssetId(id);
    setCurrentEditor(EditorType.Sprite);
    setStatusBarMessage(`Sprite "${name}" imported successfully.`);
  };


  const memoizedOnRequestRename = useCallback((assetId: string, currentName: string, assetType: ProjectAsset['type']) => { setAssetToRenameInfo({ id: assetId, currentName, type: assetType }); setIsRenameModalOpen(true);}, []);
  
  const handleConfirmRename = useCallback((newName: string) => { 
    if (assetToRenameInfo) { 
      setAssetsWithHistory(prevAssets => prevAssets.map(a => { 
        if (a.id === assetToRenameInfo.id) { 
          const updatedAsset = { ...a, name: newName }; 
          if (updatedAsset.data && typeof updatedAsset.data === 'object') { 
            (updatedAsset.data as any).name = newName; 
          }
          return updatedAsset;
        } 
        return a;
      }));
      setStatusBarMessage(`Asset renamed to ${newName}.`);
    } 
    setIsRenameModalOpen(false); 
    setAssetToRenameInfo(null);
  }, [assetToRenameInfo, setAssetsWithHistory]);

  const handleCancelRename = () => { setIsRenameModalOpen(false); setAssetToRenameInfo(null); setStatusBarMessage("Rename cancelled.");};
  
  const handleDeleteAsset = (assetId: string) => { 
      const assetToDelete = assets.find(a => a.id === assetId); 
      if (assetToDelete) { 
          setConfirmModalProps({ 
              title: "Delete Asset", 
              message: `Are you sure you want to delete asset "${assetToDelete.name}"? This cannot be undone from the history.`, 
              onConfirm: () => { 
                  setAssets(prevAssets => prevAssets.filter(a => a.id !== assetId));
                  if (selectedAssetId === assetId) { 
                      setSelectedAssetId(null); 
                      // setCurrentEditor(EditorType.None);  <- This logic is now handled by window manager
                      setSelectedEffectZoneId(null); 
                  } 
                  setStatusBarMessage(`Asset "${assetToDelete.name}" deleted.`); 
                  setIsConfirmModalOpen(false);
              }, 
              confirmText: "Delete", 
              confirmButtonVariant: "danger"
          }); 
          setIsConfirmModalOpen(true);
      }
  };

  const handleUpdateScreenMode = (mode: string) => { setCurrentScreenMode(mode); setStatusBarMessage(`Screen mode changed to ${mode}.`); if (mode === "SCREEN 2 (Graphics I)") { setSelectedColor(MSX1_PALETTE[15].hex); } else { setSelectedColor(MSX_SCREEN5_PALETTE[1].hex);}};
  
  const handleOpenSaveAsModal = () => { setIsSaveAsModalOpen(true); };

  const handleSaveProject = useCallback((filenameToSave?: string, isManualSaveOperation: boolean = true) => {
    let effectiveFilename = filenameToSave;
    if (!effectiveFilename) { 
      if (currentProjectName) {
        effectiveFilename = `${currentProjectName}.json`;
      } else {
        handleOpenSaveAsModal(); 
        return; 
      }
    }
    const projectData = { 
        assets, currentScreenMode, selectedAssetId, /* currentEditor removed */
        tileBanks, msxFont, msxFontColorAttributes, 
        ideConfiguration: { dataOutputFormat, autosaveEnabled, snippetsEnabled, syntaxHighlightingEnabled }, 
        userSnippets, helpDocsData,
        currentProjectName, 
        componentDefinitions, entityTemplates, 
        mainMenuConfig,
        selectedEntityInstanceId, selectedEffectZoneId, 
    }; 
    const dataStr = JSON.stringify(projectData, null, 2); 
    const blob = new Blob([dataStr], { type: 'application/json' }); 
    const url = URL.createObjectURL(blob); 
    const a = document.createElement('a'); 
    a.href = url; 
    a.download = effectiveFilename; 
    document.body.appendChild(a); 
    a.click(); 
    document.body.removeChild(a); 
    URL.revokeObjectURL(url); 
    if (isManualSaveOperation && !effectiveFilename.includes('autosave')) { 
        setStatusBarMessage(`Project saved to ${effectiveFilename}`);
    }
  }, [assets, currentScreenMode, selectedAssetId, tileBanks, msxFont, msxFontColorAttributes, dataOutputFormat, autosaveEnabled, snippetsEnabled, syntaxHighlightingEnabled, userSnippets, helpDocsData, currentProjectName, componentDefinitions, entityTemplates, mainMenuConfig, selectedEntityInstanceId, selectedEffectZoneId]);
  
  useEffect(() => { autosaveFunctionRef.current = () => { handleSaveProject('msx_ide_project_autosave.json', false); };}, [handleSaveProject]);
  
  useEffect(() => {
    if (!autosaveEnabled) {
      return;
    }
    const performSave = () => {
      setStatusBarMessage("Autosaving project...");
      setIsAutosaving(true);
      if (autosaveFunctionRef.current) {
        autosaveFunctionRef.current();
      }
      setTimeout(() => {
        setIsAutosaving(false);
        setStatusBarMessage("Project autosaved.");
        playAutosaveSound();
      }, 1000);
    };
    const intervalId = setInterval(performSave, AUTOSAVE_INTERVAL);
    return () => {
      clearInterval(intervalId);
    };
  }, [autosaveEnabled, playAutosaveSound]);

  const handleConfirmSaveAsProjectAs = (filenameFromModal: string) => {
    const finalFilename = filenameFromModal.toLowerCase().endsWith('.json') ? filenameFromModal : `${filenameFromModal}.json`;
    handleSaveProject(finalFilename, true); 
    const baseName = finalFilename.slice(0, -5); 
    setCurrentProjectName(baseName);
    setIsSaveAsModalOpen(false);
  };

  const handleLoadProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const projectData = JSON.parse(e.target?.result as string);
          clearAllHistory(); 
          setCopiedScreenBuffer(null); 
          setCopiedTileData(null);
          setCopiedLayerBuffer(null);
          if (projectData.assets) {
            const assetsWithEnsuredEffectZones = projectData.assets.map((asset: ProjectAsset) => {
                if (asset.type === 'screenmap' && asset.data && !(asset.data as ScreenMap).effectZones) {
                    return { ...asset, data: { ...(asset.data as ScreenMap), effectZones: [] } };
                }
                return asset;
            });
            setAssets(assetsWithEnsuredEffectZones);
          }
          if (projectData.currentScreenMode) setCurrentScreenMode(projectData.currentScreenMode);
          if (projectData.selectedAssetId) setSelectedAssetId(projectData.selectedAssetId);
          // if (projectData.currentEditor) setCurrentEditor(projectData.currentEditor); // This is removed
          if (projectData.tileBanks) setTileBanksState(projectData.tileBanks); else setTileBanksState(DEFAULT_TILE_BANKS_CONFIG);
          if (projectData.msxFont) setMsxFontState(projectData.msxFont); else setMsxFontState(DEFAULT_MSX_FONT); 
          if (projectData.msxFontColorAttributes) setMsxFontColorAttributesState(projectData.msxFontColorAttributes); else { const initialColors: MSXFontColorAttributes = {}; Object.keys(projectData.msxFont || msxFont).forEach(charCodeStr => { const charCodeNum = Number(charCodeStr); if (!isNaN(charCodeNum)) { initialColors[charCodeNum] = Array(8).fill(null).map(() => ({ fg: DEFAULT_SCREEN2_FG_COLOR, bg: DEFAULT_SCREEN2_BG_COLOR }));}}); setMsxFontColorAttributesState(initialColors);}
          if (projectData.ideConfiguration) { setDataOutputFormat(projectData.ideConfiguration.dataOutputFormat || 'hex'); setAutosaveEnabled(projectData.ideConfiguration.autosaveEnabled !== undefined ? projectData.ideConfiguration.autosaveEnabled : true); setSnippetsEnabled(projectData.ideConfiguration.snippetsEnabled !== undefined ? projectData.ideConfiguration.snippetsEnabled : true); setSyntaxHighlightingEnabled(projectData.ideConfiguration.syntaxHighlightingEnabled !== undefined ? projectData.ideConfiguration.syntaxHighlightingEnabled : true);}
          if (Array.isArray(projectData.userSnippets)) { setUserSnippets(projectData.userSnippets);}
          if (Array.isArray(projectData.helpDocsData)) { setHelpDocsData(projectData.helpDocsData); } else { setHelpDocsData(DEFAULT_HELP_DOCS_DATA); }
          if (typeof projectData.currentProjectName === 'string') { setCurrentProjectName(projectData.currentProjectName); setStatusBarMessage(`Project "${projectData.currentProjectName}" loaded from ${file.name}.`);} else {setCurrentProjectName(null); setStatusBarMessage(`Project loaded from "${file.name}". (No project name found, use Save As).`);}
          
          if (Array.isArray(projectData.componentDefinitions)) setComponentDefinitionsState(projectData.componentDefinitions); else setComponentDefinitionsState(DEFAULT_COMPONENT_DEFINITIONS);
          if (Array.isArray(projectData.entityTemplates)) setEntityTemplatesState(projectData.entityTemplates); else setEntityTemplatesState(DEFAULT_ENTITY_TEMPLATES);
          if (projectData.mainMenuConfig) setMainMenuConfigState(projectData.mainMenuConfig); else setMainMenuConfigState(DEFAULT_MAIN_MENU_CONFIG);

          setSelectedEntityInstanceId(projectData.selectedEntityInstanceId || null);
          setSelectedEffectZoneId(projectData.selectedEffectZoneId || null);

        } catch (error) { console.error("Error loading project:", error); setStatusBarMessage(`Failed to load project: ${error instanceof Error ? error.message : "Invalid file format"}`);}
      };
      reader.readAsText(file);
    }
  };
  const fileLoadInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleDeleteEntityInstance = (entityIdToDelete: string) => { 
    const activeAsset = assets.find(a => a.id === selectedAssetId);
    if (activeAsset && activeAsset.type === 'screenmap' && activeAsset.data) { 
      const currentScreenMap = activeAsset.data as ScreenMap; 
      const entityName = currentScreenMap.layers.entities.find(e => e.id === entityIdToDelete)?.name || "Unknown Entity"; 
      setConfirmModalProps({ 
        title: "Delete Entity Instance", 
        message: `Are you sure you want to delete entity "${entityName}"? This cannot be undone.`, 
        onConfirm: () => { 
          const updatedEntities = currentScreenMap.layers.entities.filter(e => e.id !== entityIdToDelete); 
          handleUpdateAsset(activeAsset.id, { layers: { ...currentScreenMap.layers, entities: updatedEntities } }); 
          setSelectedEntityInstanceId(null); 
          setStatusBarMessage("Entity instance deleted."); 
          setIsConfirmModalOpen(false);
        }, 
        confirmText: "Delete", 
        confirmButtonVariant: "danger"
      }); 
      setIsConfirmModalOpen(true);
    } else { 
      setStatusBarMessage("No screen map selected to delete entity from.");
    }
  };

  const handleShowMapFile = useCallback(() => {
    const allUniqueTileIdsInBanks = new Set<string>();
    tileBanks.filter(b => b.enabled ?? true).forEach(bank => {
        Object.keys(bank.assignedTiles).forEach(tileId => {
            allUniqueTileIdsInBanks.add(tileId);
        });
    });

    let totalChars = 0;
    allUniqueTileIdsInBanks.forEach(tileId => {
        const tileAsset = assets.find(a => a.id === tileId && a.type === 'tile');
        if (tileAsset?.data) {
            const tile = tileAsset.data as Tile;
            const widthInChars = Math.ceil(tile.width / EDITOR_BASE_TILE_DIM_S2);
            const heightInChars = Math.ceil(tile.height / EDITOR_BASE_TILE_DIM_S2);
            totalChars += widthInChars * heightInChars;
        }
    });
    
    const calculatedMaxPtr = totalChars * 8;
    const finalMapAsmContent = DEFAULT_MAP_ASM_CONTENT.replace('{{CALCULATED_MAX_PTR}}', String(calculatedMaxPtr));

    let mapAsmAsset = assets.find(a => a.name === 'map.asm');
    let constantsAsmAsset = assets.find(a => a.name === 'constants.asm');
    const newAssetsToCreate: ProjectAsset[] = [];
    let mapAsmAssetId: string | null = mapAsmAsset?.id || null;

    if (!mapAsmAsset) {
        const id = `code_map_asm_${Date.now()}`;
        mapAsmAsset = {
            id, name: 'map.asm', type: 'code', data: finalMapAsmContent,
        };
        newAssetsToCreate.push(mapAsmAsset);
        mapAsmAssetId = id;
    } else if (mapAsmAsset.data !== finalMapAsmContent) {
        setAssetsWithHistory(prev => prev.map(a => 
            a.id === mapAsmAsset!.id ? { ...a, data: finalMapAsmContent } : a
        ));
    }

    if (!constantsAsmAsset) {
        const id = `code_constants_asm_${Date.now()}`;
        constantsAsmAsset = {
            id, name: 'constants.asm', type: 'code', data: DEFAULT_CONSTANTS_ASM_CONTENT
        };
        newAssetsToCreate.push(constantsAsmAsset);
    }

    if (newAssetsToCreate.length > 0) {
        setAssetsWithHistory(prev => [...prev, ...newAssetsToCreate]);
        setStatusBarMessage(`Created map assembly files. MAX_PTR = ${calculatedMaxPtr}.`);
    } else {
        setStatusBarMessage(`Updated map.asm with MAX_PTR = ${calculatedMaxPtr}.`);
    }

    // This part needs to be updated to use the new window manager
    // setTimeout(() => {
    //     if (mapAsmAssetId) {
    //       memoizedHandleSelectAsset(mapAsmAssetId, EditorType.Code);
    //     }
    // }, 0);
  }, [assets, tileBanks, setAssetsWithHistory]);

  const handleUndo = useCallback(() => {
    if (history.undoStack.length === 0) {
        setStatusBarMessage("Nothing to undo.");
        return;
    }

    const newUndoStack = [...history.undoStack];
    const actionToUndo = newUndoStack.pop()!;
    const { type, payload } = actionToUndo;

    switch (type) {
        case 'ASSETS_UPDATE': setAssets(payload.before); break;
        case 'TILE_BANKS_UPDATE': setTileBanksState(payload.before); break;
        case 'FONT_UPDATE': setMsxFontState(payload.before); break;
        case 'FONT_COLOR_UPDATE': setMsxFontColorAttributesState(payload.before); break;
        case 'COMPONENT_DEFINITIONS_UPDATE': setComponentDefinitionsState(payload.before); break;
        case 'ENTITY_TEMPLATES_UPDATE': setEntityTemplatesState(payload.before); break;
        case 'MAIN_MENU_UPDATE': setMainMenuConfigState(payload.before); break;
    }
    
    setHistory(prev => ({ undoStack: newUndoStack, redoStack: [...prev.redoStack, actionToUndo] }));
    setStatusBarMessage(`Undo: ${type.replace(/_/g, ' ').toLowerCase()}`);
  }, [history]);

  const handleRedo = useCallback(() => {
    if (history.redoStack.length === 0) {
        setStatusBarMessage("Nothing to redo.");
        return;
    }

    const newRedoStack = [...history.redoStack];
    const actionToRedo = newRedoStack.pop()!;
    const { type, payload } = actionToRedo;

    switch (type) {
        case 'ASSETS_UPDATE': setAssets(payload.after); break;
        case 'TILE_BANKS_UPDATE': setTileBanksState(payload.after); break;
        case 'FONT_UPDATE': setMsxFontState(payload.after); break;
        case 'FONT_COLOR_UPDATE': setMsxFontColorAttributesState(payload.after); break;
        case 'COMPONENT_DEFINITIONS_UPDATE': setComponentDefinitionsState(payload.after); break;
        case 'ENTITY_TEMPLATES_UPDATE': setEntityTemplatesState(payload.after); break;
        case 'MAIN_MENU_UPDATE': setMainMenuConfigState(payload.after); break;
    }

    setHistory(prev => ({ undoStack: [...prev.undoStack, actionToRedo], redoStack: newRedoStack }));
    setStatusBarMessage(`Redo: ${type.replace(/_/g, ' ').toLowerCase()}`);
  }, [history]);

  const handleExportAllCodeFiles = async () => {
    setStatusBarMessage("Exporting all project files (code & binary assets)...");
    const codeAssets = assets.filter(a => a.type === 'code' || a.type === 'behavior'); 
    const tileAssetsAll = assets.filter(a => a.type === 'tile');
    const spriteAssetsAll = assets.filter(a => a.type === 'sprite');
    const screenMapAsset = assets.find(a => a.type === 'screenmap');
  
    if (codeAssets.length === 0 && tileAssetsAll.length === 0 && spriteAssetsAll.length === 0 && !screenMapAsset && Object.keys(msxFont).length === 0) {
      setStatusBarMessage("No files or font data to export.");
      return;
    }
  
    let projectName = currentProjectName || "MSX_Project"; 
    
    const zipFilename = `${projectName}.zip`;
    
    try {
      const zip = new JSZip();
      const projectFolderInZip = zip.folder(projectName);
  
      if (!projectFolderInZip) {
          throw new Error("Could not create project folder in zip.");
      }
      
      codeAssets.forEach(asset => {
        if (typeof asset.data === 'string' || (asset.type === 'behavior' && typeof (asset.data as BehaviorScript).code === 'string') ) {
          const content = asset.type === 'behavior' ? (asset.data as BehaviorScript).code : (asset.data as string);
          projectFolderInZip.file(asset.name, content);
        }
      });

      const binFolderInZip = projectFolderInZip.folder("bin");
      if (!binFolderInZip) {
        throw new Error("Could not create 'bin' folder in zip.");
      }

      if (tileAssetsAll.length > 0) {
        const allPatternsBytesArrays: Uint8Array[] = [];
        tileAssetsAll.forEach(asset => {
            const tile = asset.data as Tile;
            allPatternsBytesArrays.push(generateTilePatternBytes(tile, currentScreenMode));
        });
        if (allPatternsBytesArrays.length > 0) {
            const totalPatternLength = allPatternsBytesArrays.reduce((sum, arr) => sum + arr.length, 0);
            const combinedPatternBytes = new Uint8Array(totalPatternLength);
            let offset = 0;
            allPatternsBytesArrays.forEach(arr => {
                combinedPatternBytes.set(arr, offset);
                offset += arr.length;
            });
            if (combinedPatternBytes.length > 0) {
                 binFolderInZip.file("AllPatterns.BIN", combinedPatternBytes);
            }
        }

        if (currentScreenMode === "SCREEN 2 (Graphics I)") {
            const allColorsBytesArrays: Uint8Array[] = []; 
            tileAssetsAll.forEach(asset => {
                const tile = asset.data as Tile;
                const colorBytes = generateTileColorBytes(tile);
                if (colorBytes) allColorsBytesArrays.push(colorBytes); 
            });
            if (allColorsBytesArrays.length > 0) {
                const totalColorLength = allColorsBytesArrays.reduce((sum, arr) => sum + arr.length, 0); 
                const combinedColorBytes = new Uint8Array(totalColorLength);
                let offset = 0;
                allColorsBytesArrays.forEach(arr => {
                    combinedColorBytes.set(arr, offset);
                    offset += arr.length;
                });
                if (combinedColorBytes.length > 0) {
                    binFolderInZip.file("AllColors.BIN", combinedColorBytes);
                }
            }
        }
      }

      if (screenMapAsset) {
        const screenMapData = screenMapAsset.data as ScreenMap;
        const tileAssetDataForMap = tileAssetsAll.map(ta => ta.data as Tile);
        const banksForMap = currentScreenMode === "SCREEN 2 (Graphics I)" ? tileBanks : undefined;
        const layoutBytes = generateScreenMapLayoutBytes(screenMapData, tileAssetDataForMap, banksForMap, currentScreenMode);
        if (layoutBytes.length > 0) {
          binFolderInZip.file("MapLayout.bin", layoutBytes);
        }
      }
      
      if (spriteAssetsAll.length > 0) {
        const allSpriteDataArrays: Uint8Array[] = [];
        spriteAssetsAll.forEach(asset => {
          const sprite = asset.data as Sprite;
          allSpriteDataArrays.push(generateSpriteBinaryData(sprite));
        });
        if (allSpriteDataArrays.length > 0) {
          const totalSpriteDataLength = allSpriteDataArrays.reduce((sum, arr) => sum + arr.length, 0);
          const combinedSpriteDataBytes = new Uint8Array(totalSpriteDataLength);
          let offset = 0;
          allSpriteDataArrays.forEach(arr => {
            combinedSpriteDataBytes.set(arr, offset);
            offset += arr.length;
          });
          if (combinedSpriteDataBytes.length > 0) {
            binFolderInZip.file("sprites.bin", combinedSpriteDataBytes);
          }
        }
      }

      const fontPatternBytes = generateFontPatternBinaryData(msxFont, true); 
      if (fontPatternBytes.length > 0) {
        binFolderInZip.file("font_patterns.bin", fontPatternBytes);
      }
      if (currentScreenMode === "SCREEN 2 (Graphics I)") {
        const fontColorBytes = generateFontColorBinaryData(msxFontColorAttributes, true); 
        if (fontColorBytes.length > 0) {
          binFolderInZip.file("font_colors.bin", fontColorBytes);
        }
      }
  
      const zipBlob = await zip.generateAsync({ type: "blob" });
      
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = zipFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusBarMessage(`Project '${projectName}' (code & all binary assets) exported to ${zipFilename}.`);
    } catch (error) {
      console.error("Error exporting project files:", error);
      setStatusBarMessage(`Error exporting files: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };
  
  const handleCopyTileData = (tileToCopy: Tile) => {
    setCopiedTileData({
      data: tileToCopy.data.map(row => [...row]),
      lineAttributes: tileToCopy.lineAttributes ? deepCopy(tileToCopy.lineAttributes) : undefined,
      width: tileToCopy.width,
      height: tileToCopy.height,
    });
    setStatusBarMessage(`Tile "${tileToCopy.name}" copied to buffer.`);
  };

  const handleGenerateTemplatesAsm = useCallback(() => {
    const asmFilename = "data/entity_templates.asm";
    const asmCode = generateTemplatesASM(entityTemplates, componentDefinitions, assets);

    const existingAsset = assets.find(a => a.name === asmFilename);

    if (existingAsset) {
        setAssetsWithHistory(prev => prev.map(a => a.id === existingAsset.id ? { ...a, data: asmCode } : a));
        setStatusBarMessage(`Updated ${asmFilename} with latest template data.`);
        // memoizedHandleSelectAsset(existingAsset.id);
    } else {
        const id = `code_tpl_asm_${Date.now()}`;
        const newAsset: ProjectAsset = {
            id,
            name: asmFilename,
            type: 'code',
            data: asmCode
        };
        setAssetsWithHistory(prev => [...prev, newAsset]);
        setStatusBarMessage(`Created ${asmFilename} with template data.`);
        // memoizedHandleSelectAsset(id);
    }
  }, [entityTemplates, componentDefinitions, assets, setAssetsWithHistory]);

  const allPassedProps = {
    assets, setAssets, selectedAssetId, setSelectedAssetId, currentProjectName, setCurrentProjectName, currentScreenMode, setCurrentScreenMode, statusBarMessage, setStatusBarMessage, selectedColor, setSelectedColor, screenEditorSelectedTileId, setScreenEditorSelectedTileId, componentDefinitions, setComponentDefinitions, entityTemplates, setEntityTemplates, currentEntityTypeToPlace, setCurrentEntityTypeToPlace, selectedEntityInstanceId, setSelectedEntityInstanceId, selectedEffectZoneId, setSelectedEffectZoneId, isRenameModalOpen, setIsRenameModalOpen, assetToRenameInfo, setAssetToRenameInfo, isSaveAsModalOpen, setIsSaveAsModalOpen, isNewProjectModalOpen, setIsNewProjectModalOpen, isAboutModalOpen, setIsAboutModalOpen, isCompressDataModalOpen, setIsCompressDataModalOpen, isConfirmModalOpen, setIsConfirmModalOpen, confirmModalProps, setConfirmModalProps, tileBanks, setTileBanks, msxFont, setMsxFont, msxFontColorAttributes, setMsxFontColorAttributes, currentLoadedFontName, setCurrentLoadedFontName, helpDocsData, setHelpDocsData, dataOutputFormat, setDataOutputFormat, autosaveEnabled, setAutosaveEnabled, snippetsEnabled, setSnippetsEnabled, syntaxHighlightingEnabled, setSyntaxHighlightingEnabled, isConfigModalOpen, setIsConfigModalOpen, isSpriteSheetModalOpen, setIsSpriteSheetModalOpen, isSpriteFramesModalOpen, setIsSpriteFramesModalOpen, spriteForFramesModal, setSpriteForFramesModal, snippetToInsert, setSnippetToInsert, userSnippets, setUserSnippets, isSnippetEditorModalOpen, setIsSnippetEditorModalOpen, editingSnippet, setEditingSnippet, isAutosaving, setIsAutosaving, history, setHistory, copiedScreenBuffer, setCopiedScreenBuffer, copiedTileData, setCopiedTileData, copiedLayerBuffer, setCopiedLayerBuffer, contextMenu, setContextMenu, waypointPickerState, setWaypointPickerState, mainMenuConfig, onUpdateMainMenuConfig: setMainMenuConfig, handleUpdateSpriteOrder, handleOpenSpriteFramesModal, handleSplitFrames, handleCreateSpriteFromFrame, handleWaypointPicked, showContextMenu, closeContextMenu, playAutosaveSound, pushToHistory, clearAllHistory, setAssetsWithHistory, handleUpdateAsset, handleOpenSnippetEditor, handleSaveSnippet, handleDeleteSnippet, handleSnippetSelected, saveIdeConfig, resetIdeConfig, handleOpenNewProjectModal, handleConfirmNewProject, handleNewAsset, handleSpriteImported, /* memoizedHandleSelectAsset removed */ memoizedOnRequestRename, handleConfirmRename, handleCancelRename, handleDeleteAsset, handleUpdateScreenMode, handleOpenSaveAsModal, handleSaveProject, handleConfirmSaveAsProjectAs, handleLoadProject, fileLoadInputRef, handleDeleteEntityInstance, handleShowMapFile, handleUndo, handleRedo, handleExportAllCodeFiles, handleCopyTileData, handleGenerateTemplatesAsm,
    isCompressDataModalOpen, setIsCompressDataModalOpen,
  };

  return (
    <ThemeProvider>
      <WindowManagerProvider>
        <AppUI {...allPassedProps} />
      </WindowManagerProvider>
    </ThemeProvider>
  );
};

export default App;
