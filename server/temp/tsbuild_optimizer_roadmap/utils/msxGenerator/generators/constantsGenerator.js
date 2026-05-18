"use strict";
/**
 * @fileoverview Constants Generator - MSX system and project constants
 * Generates constants.asm with hardware constants and project-specific definitions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateConstantsFile = generateConstantsFile;
const spriteUtils_1 = require("../../../components/utils/spriteUtils");
/**
 * Generate constants for GlobalVariables values
 *
 * @param analysis - Project analysis with globalVariables
 * @returns ASM code string with variable value constants
 */
function generateGlobalVariablesConstants(analysis) {
    let code = '';
    if (!analysis.globalVariables || analysis.globalVariables.length === 0) {
        // Fallback: Generate default Goal constants
        code += `; Goal Variable Values (default)\n`;
        code += `GOAL_FAILURE            EQU 0    ; Goal = "Failure"\n`;
        code += `GOAL_COMPLETED          EQU 1    ; Goal = "Completed"\n`;
        return code;
    }
    // Track defined constants to avoid duplicates
    const definedConstants = new Set();
    // Generate constants for each GlobalVariable
    analysis.globalVariables.forEach(variable => {
        if (variable.values && variable.values.length > 0) {
            code += `\n; ${variable.name} - ${variable.description || 'Variable values'}\n`;
            variable.values.forEach(valueEntry => {
                const constantName = (valueEntry.asmConstant || 'UNKNOWN').trim();
                const valueHex = typeof valueEntry.value === 'number'
                    ? valueEntry.value
                    : 0;
                // Only add if not already defined (avoid duplicates like BOOL_FALSE, BOOL_TRUE)
                if (!definedConstants.has(constantName)) {
                    code += `${constantName.padEnd(24)}EQU ${valueHex}    ; ${variable.name} = "${valueEntry.label}"\n`;
                    definedConstants.add(constantName);
                }
            });
        }
    });
    return code;
}
/**
 * Generate MSX constants file (constants.asm)
 *
 * @param analysis - Project analysis with assets and configuration
 * @returns ASM code string with system and project constants
 */
function generateConstantsFile(analysis) {
    const totalSprites = (0, spriteUtils_1.buildMSXDirectionalSpriteCatalog)(analysis.sprites || []).sprites.length;
    return `; ==================================================================
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
${analysis.tiles && analysis.tiles.length > 0 ? `
; Project-specific tile dimensions detected:
${analysis.tiles.map((tile, i) => `; Tile ${i}: ${tile.name} = ${tile.width}x${tile.height}px (${Math.ceil(tile.width / 8)}x${Math.ceil(tile.height / 8)} MSX chars)`).join('\n')}

; Using primary tile size: ${analysis.tiles[0].width}x${analysis.tiles[0].height}px
TILE_WIDTH      EQU ${analysis.tiles[0].width}    ; Primary tile width in pixels
TILE_HEIGHT     EQU ${analysis.tiles[0].height}   ; Primary tile height in pixels
SCREEN_TILES_X  EQU ${Math.floor(256 / analysis.tiles[0].width)}    ; Horizontal tiles (256px ÷ ${analysis.tiles[0].width}px)
SCREEN_TILES_Y  EQU ${Math.floor(192 / analysis.tiles[0].height)}   ; Vertical tiles (192px ÷ ${analysis.tiles[0].height}px)
MSX_CHARS_PER_TILE_X EQU ${Math.ceil(analysis.tiles[0].width / 8)}  ; MSX characters wide per tile
MSX_CHARS_PER_TILE_Y EQU ${Math.ceil(analysis.tiles[0].height / 8)} ; MSX characters high per tile
` : `
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
INPUT_BTN_GRAB EQU #02   ; Grab button bit in input_btn_curr/input_btn_prev

; Runtime control binding modes
CONTROL_KEY_SPC    EQU 0
CONTROL_KEY_CTRL   EQU 1
CONTROL_KEY_N      EQU 0
CONTROL_PHYS_BTN1  EQU 0
CONTROL_PHYS_BTN2  EQU 1

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

${generateGlobalVariablesConstants(analysis)}

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
NODE_TYPE_CONTROLS      EQU 14   ; Controls node (button binding menu)
NODE_TYPE_UNKNOWN       EQU 255  ; Unknown/unsupported node type
${analysis.gameFlow ? `
; Additional Game Flow States detected in project
; (Custom states would be added here if needed)
` : `
; Using default game flow system
`}

; ==================================================================
; PROJECT-SPECIFIC CONSTANTS
; ==================================================================

; Detected Assets
TOTAL_SPRITES           EQU ${totalSprites}
TOTAL_TILES             EQU ${analysis.tiles?.length || 0}
TOTAL_SCREENS           EQU ${analysis.screenMaps?.length || 0}

; ==================================================================
; END OF CONSTANTS
; ==================================================================
`;
}
