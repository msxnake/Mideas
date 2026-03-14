/**
 * @fileoverview Screens Generator - Screen layout and map data
 * Generates screens.asm with screen maps and loading functions
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';
import { generateScreenLayoutASMCode, generateBehaviorMapASMCode, generateScreenMapLayoutBytes } from '../../../components/utils/screenUtils';
import { DEFAULT_TILE_BANK_DEFINITIONS, EDITOR_BASE_TILE_DIM_S2, EMPTY_CELL_CHAR_CODE } from '../../../constants';
import { ScreenMap, TileBank, normalizeEffectZoneParams, resolveEffectZoneType } from '../../../types';

const SCREEN_WIDTH = 32;
const SCREEN_HEIGHT = 24;
const ASM_BYTES_PER_LINE = 16;
const MAX_RUNTIME_EFFECT_ZONES = 64;

const EFFECT_TYPE_IDS = {
  secretZone: 0,
  wind: 1,
  water: 2,
  customGravity: 3,
  icePhysics: 4,
  spriteConceal: 5,
} as const;

const WIND_DIRECTION_IDS = {
  left: 0,
  right: 1,
  up: 2,
  down: 3,
} as const;

function clampByte(value: number | undefined, fallback = 0): number {
  if (!Number.isFinite(value)) return fallback & 0xff;
  return Math.max(0, Math.min(255, value as number)) & 0xff;
}

function resolveTileBankDefinitions(screen: ScreenMap, analysis: ProjectAnalysis): TileBank['banks'] | undefined {
  const screenTileBank = analysis.tileBanks?.find(tileBank => tileBank.id === screen.tileBankAssetId);
  if (screenTileBank?.banks?.length) {
    return screenTileBank.banks;
  }

  if (!analysis.tiles || analysis.tiles.length === 0) {
    return undefined;
  }

  const baseDef = DEFAULT_TILE_BANK_DEFINITIONS[1] as any;
  const globalBankDef: any = {
    ...baseDef,
    assignedTiles: {},
    charsetRangeStart: 128,
    charsetRangeEnd: 255,
    enabled: true,
  };

  let nextCharCode = 128;
  analysis.tiles.forEach((tileAsset) => {
    if (!tileAsset?.id) return;
    const charsWide = Math.ceil(tileAsset.width / 8);
    const charsHigh = Math.ceil(tileAsset.height / 8);
    globalBankDef.assignedTiles[tileAsset.id] = {
      charCode: nextCharCode,
      assignedAt: Date.now(),
    };
    nextCharCode += charsWide * charsHigh;
  });

  return [globalBankDef, globalBankDef, globalBankDef];
}

function buildLayerLayoutBytes(
  screen: ScreenMap,
  layerName: 'background' | 'effects',
  analysis: ProjectAnalysis,
  tileBankDefinitions: TileBank['banks'] | undefined
): number[] {
  const exportScreen: ScreenMap = {
    ...screen,
    activeAreaX: 0,
    activeAreaY: 0,
    activeAreaWidth: SCREEN_WIDTH,
    activeAreaHeight: SCREEN_HEIGHT,
    layers: {
      ...screen.layers,
      background: screen.layers[layerName],
    },
  };

  return Array.from(
    generateScreenMapLayoutBytes(
      exportScreen,
      analysis.tiles || [],
      tileBankDefinitions,
      'SCREEN 2 (Graphics I)'
    )
  );
}

function generateRawByteBlock(label: string, bytes: number[], comments: string[] = []): string {
  let asm = `${label}:\n`;
  for (const comment of comments) {
    asm += `    ; ${comment}\n`;
  }
  if (bytes.length === 0) {
    asm += `    DB #00\n`;
    return asm;
  }
  for (let i = 0; i < bytes.length; i += ASM_BYTES_PER_LINE) {
    const chunk = bytes.slice(i, i + ASM_BYTES_PER_LINE);
    const formatted = chunk.map(value => `#${value.toString(16).padStart(2, '0').toUpperCase()}`);
    asm += `    DB ${formatted.join(',')}\n`;
  }
  return asm;
}

function buildEffectZoneBytes(screen: ScreenMap): number[] {
  const zones = screen.effectZones || [];
  const bytes: number[] = [];

  zones.forEach((zone) => {
    const effectType = resolveEffectZoneType(zone);
    const params = normalizeEffectZoneParams(effectType, zone.params);
    let param0 = 0;
    let param1 = 0;

    if (effectType === 'wind') {
      const direction = typeof params.direction === 'string' ? params.direction : 'right';
      param0 = WIND_DIRECTION_IDS[direction as keyof typeof WIND_DIRECTION_IDS] ?? WIND_DIRECTION_IDS.right;
      param1 = clampByte(typeof params.strength === 'number' ? params.strength : parseInt(String(params.strength ?? '0'), 10), 1);
    }

    bytes.push(
      clampByte(zone.rect?.x),
      clampByte(zone.rect?.y),
      clampByte(zone.rect?.width),
      clampByte(zone.rect?.height),
      EFFECT_TYPE_IDS[effectType],
      clampByte(param0),
      clampByte(param1),
      0
    );
  });

  return bytes;
}

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
  const hasSpriteAssets = !!analysis.sprites && analysis.sprites.length > 0;
  // Skip screen system if no screens in project
  if (!analysis.screenMaps || analysis.screenMaps.length === 0) {
    return `; ==================================================================
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
`;
  }

  const screenExports = analysis.screenMaps.map((screen, index) => {
    const screenName = screen.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const screenNameWithIndex = `${screen.name}_${index}`;
    const tileBankDefinitions = resolveTileBankDefinitions(screen, analysis);
    const backgroundLayoutBytes = buildLayerLayoutBytes(screen, 'background', analysis, tileBankDefinitions);
    const effectsLayoutBytes = buildLayerLayoutBytes(screen, 'effects', analysis, tileBankDefinitions);
    const hasEffectsLayoutData = effectsLayoutBytes.some(value => value !== 0);
    const effectZoneBytes = buildEffectZoneBytes(screen);
    const effectZoneCount = (screen.effectZones || []).length;

    return {
      screen,
      index,
      screenName,
      screenNameWithIndex,
      backgroundLayoutBytes,
      effectsLayoutBytes,
      hasEffectsLayoutData,
      effectZoneBytes,
      effectZoneCount,
    };
  });


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

    code += `EFFECT_ZONE_ENTRY_SIZE EQU 8
EFFECT_TYPE_SECRET_ZONE EQU ${EFFECT_TYPE_IDS.secretZone}
EFFECT_TYPE_WIND EQU ${EFFECT_TYPE_IDS.wind}
EFFECT_TYPE_WATER EQU ${EFFECT_TYPE_IDS.water}
EFFECT_TYPE_CUSTOM_GRAVITY EQU ${EFFECT_TYPE_IDS.customGravity}
EFFECT_TYPE_ICE_PHYSICS EQU ${EFFECT_TYPE_IDS.icePhysics}
EFFECT_TYPE_SPRITE_CONCEAL EQU ${EFFECT_TYPE_IDS.spriteConceal}
EFFECT_WIND_DIR_LEFT EQU ${WIND_DIRECTION_IDS.left}
EFFECT_WIND_DIR_RIGHT EQU ${WIND_DIRECTION_IDS.right}
EFFECT_WIND_DIR_UP EQU ${WIND_DIRECTION_IDS.up}
EFFECT_WIND_DIR_DOWN EQU ${WIND_DIRECTION_IDS.down}

`;

    screenExports.forEach((screenExport) => {
      const { screenName, index, hasEffectsLayoutData, effectZoneCount } = screenExport;
      code += `SCREEN_${screenName}_${index}_ID EQU ${index}
SCREEN_${screenName}_${index}_LAYOUT_BANK EQU ((SCREEN_${screenName}_${index}_LAYOUT - #4000) / #2000)
BEHAVIOR_${screenName}_${index}_DATA_BANK EQU ((BEHAVIOR_${screenName}_${index}_DATA - #4000) / #2000)
SCREEN_${screenName}_${index}_EFFECTS_LAYOUT_BANK EQU ((SCREEN_${screenName}_${index}_EFFECTS_LAYOUT - #4000) / #2000)
SCREEN_${screenName}_${index}_EFFECTS_LAYOUT_PRESENT EQU ${hasEffectsLayoutData ? 1 : 0}
SCREEN_${screenName}_${index}_EFFECTS_LAYOUT_SIZE EQU ${SCREEN_WIDTH * SCREEN_HEIGHT}
SCREEN_${screenName}_${index}_EFFECT_ZONE_TABLE_BANK EQU ((SCREEN_${screenName}_${index}_EFFECT_ZONE_TABLE - #4000) / #2000)
SCREEN_${screenName}_${index}_EFFECT_ZONE_COUNT EQU ${effectZoneCount}
SCREEN_${screenName}_${index}_EFFECT_ZONE_TABLE_SIZE EQU ${effectZoneCount * 8}
`;
    });

    code += `
; ==================================================================
; SCREEN MAP DATA
; ==================================================================

`;

    screenExports.forEach((screenExport) => {
      const { screen, index, screenName, screenNameWithIndex, backgroundLayoutBytes, effectsLayoutBytes, hasEffectsLayoutData, effectZoneBytes, effectZoneCount } = screenExport;
      if (screen.layers && screen.layers.background) {
        const referenceComments: string[] = [];
        referenceComments.push(`; Generated using exact Screen Editor layout export logic`);
        referenceComments.push(`; Byte values represent actual character codes in VRAM`);

        const asmCode = generateScreenLayoutASMCode(
          screenNameWithIndex,
          SCREEN_WIDTH,
          SCREEN_HEIGHT,
          backgroundLayoutBytes,
          referenceComments,
          'hex'
        );

        code += asmCode;
        code += `\n`;
        code += generateRawByteBlock(
          `SCREEN_${screenName}_${index}_EFFECTS_LAYOUT`,
          effectsLayoutBytes,
          hasEffectsLayoutData
            ? [
                `Alternate Effects layer for ${screen.name}`,
                `Same 32x24 char layout as background; used by secretZone runtime`,
              ]
            : [
                `No alternate Effects tiles exported for ${screen.name}`,
                `Runtime should treat this layer as empty`,
              ]
        );
        code += `\n`;
        code += generateRawByteBlock(
          `SCREEN_${screenName}_${index}_EFFECT_ZONE_TABLE`,
          effectZoneBytes,
          effectZoneCount > 0
            ? [
                `Effect zones for ${screen.name}`,
                `Entry format: x, y, width, height, effectType, param0, param1, reserved`,
              ]
            : [
                `No effect zones exported for ${screen.name}`,
              ]
        );
        code += `\n`;

        if (false) {
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

            // CRITICAL FIX: Do NOT clip tiles outside active area.
            // The active area is logical (for player movement/camera), but graphics
            // should be rendered for the entire 32x24 screen if they exist.
            // if (!isActiveArea) {
            //   mapIndices.push(0);
            //   continue;
            // }

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

        }
        // Also generate collision/behavior map if available
        if (screen.layers.collision && analysis.tiles) {
          const collisionLayer = screen.layers.collision;
          const behaviorMapData: number[] = [];

          // CRITICAL: Behavior map must ALWAYS be 32x24 (one entry per 8x8 MSX char cell).
          // The collision layer may use larger logical tiles (e.g. 16x12 for 16x16 tiles).
          // We expand each collision tile to cover its corresponding 8x8 char cells.
          const collisionRows = collisionLayer.length;
          const collisionCols = collisionLayer[0]?.length ?? 0;

          for (let r = 0; r < SCREEN_HEIGHT; r++) {
            for (let c = 0; c < SCREEN_WIDTH; c++) {
              // Use proportional mapping instead of rounded scale factors.
              // This keeps runtime_behavior_map aligned even when the logical
              // collision grid does not divide 32x24 exactly.
              const srcRow = collisionRows > 0
                ? Math.min(collisionRows - 1, Math.floor((r * collisionRows) / SCREEN_HEIGHT))
                : 0;
              const srcCol = collisionCols > 0
                ? Math.min(collisionCols - 1, Math.floor((c * collisionCols) / SCREEN_WIDTH))
                : 0;
              const tile = collisionLayer[srcRow]?.[srcCol];
              if (tile?.tileId) {
                const tileAsset = analysis.tiles?.find((t: any) => t.id === tile.tileId);
                // Compute behavior byte from boolean flags directly (not mapId).
                // Play mode reads causesDamage/isSolid booleans; mapId may be desynchronized.
                const lp = tileAsset?.logicalProperties;
                if (lp) {
                  const familyId = lp.familyId ?? (lp.isSolid ? 1 : 0);
                  let flagBits = 0;
                  if (lp.isBreakable) flagBits |= 0x01;
                  if (lp.isMovable)   flagBits |= 0x02;
                  if (lp.causesDamage) flagBits |= 0x04;
                  if (lp.isInteractiveSwitch) flagBits |= 0x08;
                  behaviorMapData.push((familyId << 4) | flagBits);
                } else {
                  behaviorMapData.push(0);
                }
              } else {
                behaviorMapData.push(0);
              }
            }
          }

          // Generate behavior map ASM
          const behaviorASM = generateBehaviorMapASMCode(
            screenNameWithIndex,
            SCREEN_WIDTH,
            SCREEN_HEIGHT,
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

`;

    analysis.screenMaps.forEach((screen, index) => {
      const screenName = screen.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
      const bgColor = screen.backgroundColor !== undefined ? screen.backgroundColor : 1; // Default to black
      const borderColor = screen.borderColor !== undefined ? screen.borderColor : 1; // Default to black
      // Use screen ID suffix to make function name unique (handles same name in different worlds)
      const screenIdSuffix = screen.id ? `_${screen.id.replace(/[^a-zA-Z0-9]/g, '_').slice(-12)}` : '';

      const rawActiveAreaX = screen.activeAreaX ?? 0;
      const rawActiveAreaY = screen.activeAreaY ?? 0;
      const rawActiveAreaWidth = screen.activeAreaWidth ?? screen.width ?? 32;
      const rawActiveAreaHeight = screen.activeAreaHeight ?? screen.height ?? 24;

      // Clamp Active Area to valid Screen 2 bounds (32x24)
      const activeAreaX = Math.max(0, Math.min(31, rawActiveAreaX));
      const activeAreaY = Math.max(0, Math.min(23, rawActiveAreaY));
      const activeAreaWidth = Math.max(0, Math.min(32 - activeAreaX, rawActiveAreaWidth));
      const activeAreaHeight = Math.max(0, Math.min(24 - activeAreaY, rawActiveAreaHeight));

      const hasHudFrameArea = activeAreaX > 0 || activeAreaY > 0 || activeAreaWidth < 32 || activeAreaHeight < 24;
      const shouldPreserveHudArea = hasHudFrameArea && activeAreaWidth > 0 && activeAreaHeight > 0;

      const activeAreaOffset = (activeAreaY * 32) + activeAreaX;
      const activeAreaBytes = activeAreaWidth * activeAreaHeight;
      const runtimeEffectZoneCount = Math.min((screen.effectZones || []).length, MAX_RUNTIME_EFFECT_ZONES);

      const importedHudFrameCells = (screen.hudConfiguration?.importedFrame?.cells || [])
        .filter((cell: any) =>
          typeof cell?.x === 'number' &&
          typeof cell?.y === 'number' &&
          typeof cell?.charCode === 'number' &&
          cell.x >= 0 && cell.x < 32 &&
          cell.y >= 0 && cell.y < 24
        )
        .map((cell: any) => ({
          x: cell.x | 0,
          y: cell.y | 0,
          charCode: cell.charCode & 0xFF
        }));

      const hasImportedHudFrame = importedHudFrameCells.length > 0;
      const importedHudFrameLabelBase = `hud_imported_frame_${screenName.toLowerCase()}${screenIdSuffix.toLowerCase()}`;

      if (hasImportedHudFrame) {
        code += `${importedHudFrameLabelBase}_data:
    ; Imported HUD frame snapshot for ${screen.name} (${importedHudFrameCells.length} cells)
`;

        importedHudFrameCells.forEach((cell: { x: number; y: number; charCode: number }) => {
          const offset = (cell.y * 32) + cell.x;
          const low = offset & 0xFF;
          const high = (offset >> 8) & 0xFF;
          const charCode = cell.charCode & 0xFF;
          code += `    DB #${low.toString(16).padStart(2, '0').toUpperCase()},#${high.toString(16).padStart(2, '0').toUpperCase()},#${charCode.toString(16).padStart(2, '0').toUpperCase()}
`;
        });

        code += `
${importedHudFrameLabelBase}_draw:
    ; Draw imported HUD frame chars into Name Table
    ld hl, ${importedHudFrameLabelBase}_data
    ld bc, ${importedHudFrameCells.length}

${importedHudFrameLabelBase}_draw_loop:
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
    jr ${importedHudFrameLabelBase}_draw_loop

`;
      }

      if (shouldPreserveHudArea) {
        code += `load_screen_${screenName.toLowerCase()}${screenIdSuffix.toLowerCase()}:
    ; Load ${screen.name} screen (fast direct port access)
    ; Active Area: X=${activeAreaX}, Y=${activeAreaY}, W=${activeAreaWidth}, H=${activeAreaHeight}
    ; Preserve HUD/non-active area: only overwrite active game area
    ; Set VDP colors FIRST (before loading screen data)
    ld a, ${bgColor}           ; Background color
    ld b, ${borderColor}       ; Border color
    call set_screen_colors
    ; Initialize character 0 (empty cells) with background color
    ld a, ${bgColor}           ; Background color for char 0
    call init_char0_color
`;
        if (hasSpriteAssets) {
          code += `    ; Clear hardware sprites on screen switch to avoid visual carry-over
    call clear_all_sprites
    call update_sprites_to_vram
`;
        }

        if (activeAreaWidth === 32) {
          code += `    ; Load active game area (contiguous rows)
    call mapper_push_p2
    ld a, SCREEN_${screenName}_${index}_LAYOUT_BANK
    call mapper_set_bank_p2
    ; Preserve HUD / non-active VRAM area: overwrite only gameplay rows
    ld hl, SCREEN_${screenName}_${index}_LAYOUT + ${activeAreaOffset}
    ld de, NAMETBL + ${activeAreaOffset}
    ld bc, ${activeAreaBytes}
    call FAST_LDIRVM
    call mapper_pop_p2
`;
        } else {
          code += `    ; Load active game area (rectangular copy by rows)
    call mapper_push_p2
    ld a, SCREEN_${screenName}_${index}_LAYOUT_BANK
    call mapper_set_bank_p2
    ; Preserve HUD / non-active VRAM area: overwrite only gameplay rectangle
    ld hl, SCREEN_${screenName}_${index}_LAYOUT + ${activeAreaOffset}
    ld de, NAMETBL + ${activeAreaOffset}
    ld a, ${activeAreaHeight}
    ld c, ${activeAreaWidth}
    call copy_layout_rect_to_vram
    call mapper_pop_p2
`;
        }

        code += `    ; Build mutable runtime screen/effects/behavior maps in RAM
    call mapper_push_p2
    ld a, SCREEN_${screenName}_${index}_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, SCREEN_${screenName}_${index}_LAYOUT
    ld de, runtime_background_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    ld hl, SCREEN_${screenName}_${index}_LAYOUT
    ld de, runtime_screen_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    call mapper_push_p2
    ld a, SCREEN_${screenName}_${index}_EFFECTS_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, SCREEN_${screenName}_${index}_EFFECTS_LAYOUT
    ld de, runtime_effects_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    call mapper_push_p2
    ld a, BEHAVIOR_${screenName}_${index}_DATA_BANK
    call mapper_set_bank_p2
    ld hl, BEHAVIOR_${screenName}_${index}_DATA
    ld de, runtime_behavior_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    ld a, ${runtimeEffectZoneCount}
    ld (current_effect_zone_count), a
    or a
    jr z, .load_${screenName.toLowerCase()}${screenIdSuffix.toLowerCase()}_zones_done
    call mapper_push_p2
    ld a, SCREEN_${screenName}_${index}_EFFECT_ZONE_TABLE_BANK
    call mapper_set_bank_p2
    ld hl, SCREEN_${screenName}_${index}_EFFECT_ZONE_TABLE
    ld de, runtime_effect_zone_table
    ld bc, ${runtimeEffectZoneCount * 8}
    ldir
    call mapper_pop_p2
.load_${screenName.toLowerCase()}${screenIdSuffix.toLowerCase()}_zones_done:
`;

        if (hasImportedHudFrame) {
          code += `    ; Imported HUD frame is drawn on world/game start only
`;
        }

        code += `    ; Initialize collision system pointers for this screen
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

`;
      } else {
        code += `load_screen_${screenName.toLowerCase()}${screenIdSuffix.toLowerCase()}:
    ; Load ${screen.name} screen (fast direct port access)
    ; Set VDP colors FIRST (before loading screen data)
    ld a, ${bgColor}           ; Background color
    ld b, ${borderColor}       ; Border color
    call set_screen_colors
    ; Initialize character 0 (empty cells) with background color
    ld a, ${bgColor}           ; Background color for char 0
    call init_char0_color
`;
        if (hasSpriteAssets) {
          code += `    ; Clear hardware sprites on screen switch to avoid visual carry-over
    call clear_all_sprites
    call update_sprites_to_vram
`;
        }
        code += `    ; Now load screen layout (full 32x24)
    call mapper_push_p2
    ld a, SCREEN_${screenName}_${index}_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, SCREEN_${screenName}_${index}_LAYOUT
    ld de, NAMETBL
    ld bc, SCREEN_${screenName}_${index}_SIZE
    call FAST_LDIRVM           ; Fast VRAM write (direct port access)
    call mapper_pop_p2
`;
        code += `    ; Build mutable runtime screen/effects/behavior maps in RAM
    call mapper_push_p2
    ld a, SCREEN_${screenName}_${index}_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, SCREEN_${screenName}_${index}_LAYOUT
    ld de, runtime_background_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    ld hl, SCREEN_${screenName}_${index}_LAYOUT
    ld de, runtime_screen_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    call mapper_push_p2
    ld a, SCREEN_${screenName}_${index}_EFFECTS_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, SCREEN_${screenName}_${index}_EFFECTS_LAYOUT
    ld de, runtime_effects_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    call mapper_push_p2
    ld a, BEHAVIOR_${screenName}_${index}_DATA_BANK
    call mapper_set_bank_p2
    ld hl, BEHAVIOR_${screenName}_${index}_DATA
    ld de, runtime_behavior_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    ld a, ${runtimeEffectZoneCount}
    ld (current_effect_zone_count), a
    or a
    jr z, .load_${screenName.toLowerCase()}${screenIdSuffix.toLowerCase()}_zones_done
    call mapper_push_p2
    ld a, SCREEN_${screenName}_${index}_EFFECT_ZONE_TABLE_BANK
    call mapper_set_bank_p2
    ld hl, SCREEN_${screenName}_${index}_EFFECT_ZONE_TABLE
    ld de, runtime_effect_zone_table
    ld bc, ${runtimeEffectZoneCount * 8}
    ldir
    call mapper_pop_p2
.load_${screenName.toLowerCase()}${screenIdSuffix.toLowerCase()}_zones_done:
`;
        if (hasImportedHudFrame) {
          code += `    ; Imported HUD frame is drawn on world/game start only
`;
        }
        code += `    ; Initialize collision system pointers for this screen
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

`;
      }
    });

    // NOTE: Worldmap loading functions are now generated by worldGenerator.ts
    // This prevents duplication of load_world_X labels

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
    ; Load game screen (fast direct port access)
    ld hl, SCREEN_GAME_DATA
    ld de, NAMETBL
    ld bc, 768
    call FAST_LDIRVM           ; Fast VRAM write (direct port access)
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
