/**
 * @fileoverview Screens Generator - Screen layout and map data
 * Generates screens.asm with screen maps and loading functions
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';
import { generateScreenLayoutASMCode, generateBehaviorMapASMCode, generateScreenMapLayoutBytes } from '../../../components/utils/screenUtils';
import { DEFAULT_TILE_BANK_DEFINITIONS, EDITOR_BASE_TILE_DIM_S2, EMPTY_CELL_CHAR_CODE } from '../../../constants';
import { TileBank } from '../../../types';

/**
 * Generate screens file with screen layout and map data (screens.asm)
 *
 * Uses the EXACT same function as Screen Editor "Download ASM" button to ensure
 * parity between Play mode and generated ROM.
 *
 * @param analysis - Project analysis with screen maps and tiles
 * @returns ASM code string with screen layout data and loading functions
 */
export function generateScreensFile(analysis: ProjectAnalysis): string {
  // Skip screen system if no screens in project
  if (!analysis.screenMaps || analysis.screenMaps.length === 0) {
    return `; ==================================================================
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
`;
  }

  let code = `; ==================================================================
; SCREEN MAPS
; File: screens.asm
; Description: Screen layout and map data
; ==================================================================

`;

  if (analysis.screenMaps && analysis.screenMaps.length > 0) {
    code += `; ==================================================================
; SCREEN MAP CONSTANTS
; ==================================================================

`;

    analysis.screenMaps.forEach((screen, index) => {
      const screenName = screen.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
      code += `SCREEN_${screenName}_${index}_ID EQU ${index}
`;
    });

    code += `
; ==================================================================
; SCREEN MAP DATA
; ==================================================================

`;

    analysis.screenMaps.forEach((screen) => {
      if (screen.layers && screen.layers.background) {
        // Create automatic tile banks with assigned tiles for character mapping
        // CRITICAL: Use GLOBAL mapping based on analysis.tiles order to match patternsGenerator.ts
        const tileBanks: TileBank[] = [];

        if (analysis.tiles && analysis.tiles.length > 0) {
          // Create a bank definition with global mapping
          // We use 'any' cast for DEFAULT_TILE_BANK_DEFINITIONS to avoid strict type issues with the template
          const baseDef = DEFAULT_TILE_BANK_DEFINITIONS[1] as any;

          const globalBankDef: any = {
            ...baseDef,
            assignedTiles: {},
            charsetRangeStart: 128,    // Start at 128 to leave 0-127 for FONT
            charsetRangeEnd: 255,
            enabled: true
          };

          // Assign tiles to characters starting from charCode 128, following analysis.tiles order
          let nextCharCode = 128;

          analysis.tiles.forEach((tileAsset) => {
            if (tileAsset && tileAsset.id) {
              const charsWide = Math.ceil(tileAsset.width / 8);
              const charsHigh = Math.ceil(tileAsset.height / 8);

              globalBankDef.assignedTiles[tileAsset.id] = {
                charCode: nextCharCode,
                assignedAt: Date.now()
              };

              nextCharCode += charsWide * charsHigh;
            }
          });

          // Wrap in a full TileBank object (Screen 2 has 3 banks)
          const globalTileBank: TileBank = {
            id: 'global_auto_bank',
            name: 'Global Auto Bank',
            banks: [globalBankDef, globalBankDef, globalBankDef]
          };

          tileBanks.push(globalTileBank);
          console.log(`✅ Created GLOBAL tile bank with ${Object.keys(globalBankDef.assignedTiles).length} assigned tiles`);
        }

        // Generate FULL 32x24 screen layout (768 bytes) to ensure correct positioning and background
        // This replaces the previous logic that only exported the active area
        const mapIndices: number[] = [];
        const activeX = screen.activeAreaX ?? 0;
        const activeY = screen.activeAreaY ?? 0;
        const activeW = screen.activeAreaWidth ?? screen.width;
        const activeH = screen.activeAreaHeight ?? screen.height;


        // Fixed MSX screen dimensions
        const SCREEN_WIDTH = 32;
        const SCREEN_HEIGHT = 24;

        for (let r = 0; r < SCREEN_HEIGHT; r++) {
          for (let c = 0; c < SCREEN_WIDTH; c++) {
            // Check if current position is within the active area
            const isActiveArea =
              c >= activeX &&
              c < activeX + activeW &&
              r >= activeY &&
              r < activeY + activeH;

            if (!isActiveArea) {
              // Outside active area: use empty tile (black background)
              mapIndices.push(0); // Use 0 for empty/black, not EMPTY_CELL_CHAR_CODE (255) which might be a valid char
              continue;
            }

            // Inside active area: map to screen coordinates
            const screenTile = screen.layers.background[r]?.[c];

            if (!screenTile || !screenTile.tileId) {
              mapIndices.push(0); // Empty tile
            } else {
              let actualCharCodeForCell = 0; // Default to 0 instead of 255
              const tileAsset = analysis.tiles?.find(t => t.id === screenTile.tileId);

              // Logic copied from screenUtils.ts
              const currentScreenMode = 'SCREEN 2 (Graphics I)'; // Hardcoded as we are in the Screen 2 block
              const tileBanksList = tileBanks.length > 0 ? tileBanks[0].banks : undefined;

              if (currentScreenMode === "SCREEN 2 (Graphics I)" && tileBanksList && tileAsset) {
                let foundInBank = false;

                for (const bank of tileBanksList) {
                  // Only process if bank is enabled and tile is assigned
                  if ((bank.enabled ?? true) && bank.assignedTiles[screenTile.tileId]) {
                    const baseCharCode = bank.assignedTiles[screenTile.tileId].charCode;
                    const widthInChars = Math.ceil(tileAsset.width / EDITOR_BASE_TILE_DIM_S2);
                    const subX = screenTile.subTileX || 0;
                    const subY = screenTile.subTileY || 0;
                    actualCharCodeForCell = baseCharCode + (subY * widthInChars) + subX;

                    const inRange = actualCharCodeForCell >= bank.charsetRangeStart && actualCharCodeForCell <= bank.charsetRangeEnd;

                    if (inRange) {
                      foundInBank = true;
                      break;
                    } else {
                      actualCharCodeForCell = 0; // Code out of bank range
                    }
                  }
                }
                if (!foundInBank) {
                  actualCharCodeForCell = 0;
                }
              } else {
                // Fallback for non-Screen 2 (simplified)
                actualCharCodeForCell = 0;
              }
              mapIndices.push(actualCharCodeForCell);
            }
          }
        }

        // Debug the generated bytes
        const nonFFCount = mapIndices.filter(b => b !== 255).length;
        const uniqueBytes = new Set(mapIndices);
        console.log(`📊 Generated ${mapIndices.length} bytes: ${nonFFCount} non-FF (${((nonFFCount / mapIndices.length) * 100).toFixed(1)}%)`);
        console.log(`🎯 Unique byte values: [${Array.from(uniqueBytes).sort((a, b) => a - b).join(', ')}]`);

        // Create a mapping from byte values to tile names for comments
        const referenceComments: string[] = [];
        referenceComments.push(`; Generated using exact Screen Editor "Download ASM" logic`);
        referenceComments.push(`; Byte values represent actual character codes in VRAM`);

        // Use existing ASM generation logic with hex format like Screen Editor
        const screenNameWithIndex = `${screen.name}_${analysis.screenMaps.indexOf(screen)}`;
        const asmCode = generateScreenLayoutASMCode(
          screenNameWithIndex,
          SCREEN_WIDTH,
          SCREEN_HEIGHT,
          mapIndices,
          referenceComments,
          'hex'
        );

        // Add the screen layout data
        code += asmCode;

        // Also generate collision/behavior map if available
        if (screen.layers.collision && analysis.tiles) {
          const collisionLayer = screen.layers.collision;
          const behaviorMapData: number[] = [];

          collisionLayer.forEach(row => {
            row.forEach(tile => {
              if (tile.tileId) {
                // Find the tile asset to get its logical properties
                const tileAsset = analysis.tiles.find(t => t.id === tile.tileId);
                const mapId = tileAsset?.logicalProperties?.mapId || 0;
                behaviorMapData.push(mapId);
              } else {
                behaviorMapData.push(0);
              }
            });
          });

          // Generate behavior map ASM
          const behaviorASM = generateBehaviorMapASMCode(
            screenNameWithIndex,
            screen.width,
            screen.height,
            behaviorMapData,
            'hex'
          );

          code += `\n${behaviorASM}`;
        }
      } else {
        // Generate placeholder screen data
        const screenIndex = analysis.screenMaps.indexOf(screen);
        const screenName = screen.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
        code += `SCREEN_${screenName}_${screenIndex}_LAYOUT:
    ; Screen data for ${screen.name}
    ; TODO: Add actual screen map data
    db 0, 0, 0, 0, 0, 0, 0, 0

`;
      }

      code += `\n`;
    });

    code += `; ==================================================================
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

`;

    analysis.screenMaps.forEach((screen, index) => {
      const screenName = screen.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
      const bgColor = screen.backgroundColor !== undefined ? screen.backgroundColor : 1; // Default to black
      const borderColor = screen.borderColor !== undefined ? screen.borderColor : 1; // Default to black

      code += `load_screen_${screenName.toLowerCase()}:
    ; Load ${screen.name} screen (BIOS LDIRVM handles timing)
    ; Set VDP colors FIRST (before loading screen data)
    ld a, ${bgColor}           ; Background color
    ld b, ${borderColor}       ; Border color
    call set_screen_colors
    ; Initialize character 0 (empty cells) with background color
    ld a, ${bgColor}           ; Background color for char 0
    call init_char0_color
    ; Now load screen layout
    ld hl, SCREEN_${screenName}_${index}_LAYOUT
    ld de, NAMETBL
    ld bc, SCREEN_${screenName}_${index}_SIZE
    call LDIRVM                ; BIOS handles safe VRAM access
    ret

`;
    });

    // Generate worldmap loading functions (for GameFlow WorldLink nodes)
    const worldmaps = (analysis as any).worldmaps || [];
    if (worldmaps.length > 0) {
      code += `; ==================================================================
; WORLDMAP LOADING FUNCTIONS (for GameFlow WorldLink nodes)
; ==================================================================

`;
      worldmaps.forEach((worldmap: any) => {
        const worldmapId = worldmap.id;
        const startScreenNodeId = worldmap.startScreenNodeId;
        const startNode = worldmap.nodes?.find((n: any) => n.id === startScreenNodeId);
        const startScreenAssetId = startNode?.screenAssetId;

        if (startScreenAssetId) {
          const screenIndex = analysis.screenMaps.findIndex(s => s.id === startScreenAssetId);
          const screen = analysis.screenMaps[screenIndex];

          if (screen) {
            const screenName = screen.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
            code += `load_world_${worldmapId.toLowerCase().replace(/[^a-z0-9]/g, '_')}:
    ; Load worldmap: ${worldmap.name}
    ; Starting screen: ${screen.name}
    call load_screen_${screenName.toLowerCase()}
    ret

`;
          } else {
            code += `load_world_${worldmapId.toLowerCase().replace(/[^a-z0-9]/g, '_')}:
    ; Worldmap: ${worldmap.name} (screen not found)
    ret

`;
          }
        } else {
          code += `load_world_${worldmapId.toLowerCase().replace(/[^a-z0-9]/g, '_')}:
    ; Worldmap: ${worldmap.name} (no start screen)
    ret

`;
        }
      });
    }
  } else {
    code += `; ==================================================================
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
`;
  }

  code += `
; ==================================================================
; END OF SCREENS
; ==================================================================
`;

  return code;
}
