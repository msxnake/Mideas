/**
 * @fileoverview Screens Generator - Screen layout and map data
 * Generates screens.asm with screen maps and loading functions
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';
import { buildScreenCharBehaviorTable, buildScreenInteractionMaps, encodeBehaviorByteFromLogicalProperties, generateScreenLayoutASMCode, generateBehaviorMapASMCode, generateScreenMapLayoutBytes, resolveScreenBehaviorSource } from '../../../components/utils/screenUtils';
import { DEFAULT_TILE_BANK_DEFINITIONS, EDITOR_BASE_TILE_DIM_S2, EMPTY_CELL_CHAR_CODE } from '../../../constants';
import { Boss, BossInstance, ScreenMap, TileBank, normalizeEffectZoneParams, resolveEffectZoneType } from '../../../types';
import { buildRegisterContractComment } from './registerContract';
import { collectAnimatedTileGroupSummaries } from './animatedTilesGenerator';
import { buildScreenSpritePatternUsageSummaries } from './spritesGenerator';
import {
  buildReferencedScreen2TileBanks,
  getScreen2TileBankIdLabel,
  getScreen2TileBankColorLoaderLabel,
  getScreen2TileBankPatternLoaderLabel,
  resolveRuntimeScreen2TileBankCharCode,
  resolveRuntimeScreen2TileBankDefinitions,
} from '../utils/screen2TileBanks';
import { presentationScreenUsesPage0Group } from './page0Generator';
import { usesMapperBanking } from './romModeUtils';
import { buildResourceIdLabelFromAsmLabel } from '../utils/megaromResourceArtifacts';
import { buildScreenBlockMapFromBytes } from '../../screenOptimization/blockMapBuilder';
import {
  buildMapperBankEqu,
  buildMapperWindowedAddress,
  getMapperWindowConfig,
  type MapperTargetFormat,
} from './mapperWindowUtils';

const SCREEN_WIDTH = 32;
const SCREEN_HEIGHT = 24;
const ASM_BYTES_PER_LINE = 16;
const MAX_RUNTIME_EFFECT_ZONES = 64;
const SCREEN_ENGINE_PLAYER = 0;
const SCREEN_ENGINE_FAKE_PLAYER = 1;

function sanitizeLabel(value: string, fallback: string): string {
  const cleaned = String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^([0-9])/, '_$1')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
  return cleaned || fallback;
}

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

function getScreenEngineValue(screen: ScreenMap): number {
  const configuredEngine = String((screen as any).screenEngine || '').trim();
  if (configuredEngine === 'fakePlayer') return SCREEN_ENGINE_FAKE_PLAYER;
  if (configuredEngine === 'player') return SCREEN_ENGINE_PLAYER;
  return (screen as any).screenKind === 'playable' ? SCREEN_ENGINE_PLAYER : SCREEN_ENGINE_FAKE_PLAYER;
}

function resolveTileBankDefinitions(screen: ScreenMap, analysis: ProjectAnalysis): TileBank['banks'] | undefined {
  return resolveRuntimeScreen2TileBankDefinitions(analysis, screen.tileBankAssetId);
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

function buildBehaviorMapDataFromCollisionLayer(screen: ScreenMap, analysis: ProjectAnalysis): number[] {
  const collisionLayer = screen.layers.collision || [];
  const behaviorMapData: number[] = [];
  const collisionRows = collisionLayer.length;
  const collisionCols = collisionLayer[0]?.length ?? 0;
  const tileById = new Map((analysis.tiles || []).map((tile: any) => [tile.id, tile]));

  for (let row = 0; row < SCREEN_HEIGHT; row++) {
    for (let col = 0; col < SCREEN_WIDTH; col++) {
      const srcRow = collisionRows > 0
        ? Math.min(collisionRows - 1, Math.floor((row * collisionRows) / SCREEN_HEIGHT))
        : 0;
      const srcCol = collisionCols > 0
        ? Math.min(collisionCols - 1, Math.floor((col * collisionCols) / SCREEN_WIDTH))
        : 0;
      const tileId = collisionLayer[srcRow]?.[srcCol]?.tileId;
      behaviorMapData.push(encodeBehaviorByteFromLogicalProperties(tileId ? tileById.get(tileId)?.logicalProperties : undefined));
    }
  }

  return behaviorMapData;
}

function buildBehaviorGenerationArtifacts(
  screen: ScreenMap,
  analysis: ProjectAnalysis,
  tileBankDefinitions: TileBank['banks'] | undefined,
  backgroundLayoutBytes: number[]
): {
  behaviorSource: 'collisionLayer' | 'backgroundChars';
  behaviorMapData: number[] | null;
  charBehaviorTable: number[] | null;
} {
  const behaviorSource = resolveScreenBehaviorSource(screen);
  if (behaviorSource === 'backgroundChars') {
    const charBehaviorTable = buildScreenCharBehaviorTable(
      {
        ...screen,
        activeAreaX: 0,
        activeAreaY: 0,
        activeAreaWidth: SCREEN_WIDTH,
        activeAreaHeight: SCREEN_HEIGHT,
      },
      analysis.tiles || [],
      tileBankDefinitions,
      'SCREEN 2 (Graphics I)'
    );

    return {
      behaviorSource,
      behaviorMapData: backgroundLayoutBytes.map(value => charBehaviorTable[value & 0xff] ?? 0),
      charBehaviorTable,
    };
  }

  return {
    behaviorSource,
    behaviorMapData: buildBehaviorMapDataFromCollisionLayer(screen, analysis),
    charBehaviorTable: null,
  };
}

function buildInteractionTargetIdMap(analysis: ProjectAnalysis): Map<string, number> {
  const targetIdByKey = new Map<string, number>();
  const globalVariables = Array.isArray((analysis as any).globalVariables)
    ? (analysis as any).globalVariables
    : [];
  let nextId = 1;

  for (const variable of globalVariables) {
    const name = typeof variable?.name === 'string' ? variable.name.trim() : '';
    const asmName = typeof variable?.asmName === 'string' ? variable.asmName.trim() : '';
    if (!asmName) continue;

    const existingId = targetIdByKey.get(asmName) ?? targetIdByKey.get(asmName.toLowerCase());
    const targetId = existingId ?? nextId++;

    targetIdByKey.set(asmName, targetId);
    targetIdByKey.set(asmName.toLowerCase(), targetId);
    if (name) {
      targetIdByKey.set(name, targetId);
      targetIdByKey.set(name.toLowerCase(), targetId);
    }
  }

  return targetIdByKey;
}

function buildInteractionGenerationArtifacts(
  screen: ScreenMap,
  analysis: ProjectAnalysis,
  interactionTargetIdMap: Map<string, number>
): {
  interactionTypeMap: number[];
  interactionValueMap: number[];
  interactionTargetMap: number[];
} {
  const interactionMaps = buildScreenInteractionMaps(screen, analysis.tiles || []);
  return {
    interactionTypeMap: interactionMaps.typeMap,
    interactionValueMap: interactionMaps.valueMap,
    interactionTargetMap: interactionMaps.targetMap.map((targetRef) => {
      if (typeof targetRef !== 'string') return 0;
      const trimmed = targetRef.trim();
      if (!trimmed) return 0;
      return interactionTargetIdMap.get(trimmed) ?? interactionTargetIdMap.get(trimmed.toLowerCase()) ?? 0;
    }),
  };
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

function generateBackgroundBlockDataSection(
  screenName: string,
  index: number,
  displayName: string,
  blockMap: NonNullable<ReturnType<typeof buildScreenBlockMapFromBytes>>
): string {
  const labelBase = `SCREEN_${screenName}_${index}`;
  let asm = '';
  asm += generateRawByteBlock(
    `${labelBase}_BLOCK_CATALOG`,
    blockMap.catalogFlatBytes,
    [
      `${displayName} - background block catalog (${blockMap.blockWidth}x${blockMap.blockHeight})`,
      `${blockMap.catalog.length} unique blocks, ${blockMap.catalogLengthBytes} bytes total`,
    ]
  );
  asm += `\n`;
  asm += generateRawByteBlock(
    `${labelBase}_BLOCK_MAP`,
    blockMap.mapIndices,
    [
      `${displayName} - background block index map (${blockMap.mapWidth}x${blockMap.mapHeight})`,
      `${blockMap.optimizedLengthBytes} bytes optimized vs ${blockMap.sourceLengthBytes} raw (${blockMap.savingsBytes} byte delta)`,
    ]
  );
  asm += `\n`;
  return asm;
}

function hasPresentationScreenData(analysis: ProjectAnalysis): boolean {
  const config = analysis.presentationScreen;
  if (!config?.enabled) return false;
  return Array.isArray(config.data?.nameTable) && config.data.nameTable.length === (SCREEN_WIDTH * SCREEN_HEIGHT);
}

function hasUsableImportedHudFrameSnapshot(screen: any): boolean {
  const cells = screen?.hudConfiguration?.importedFrame?.cells;
  if (!Array.isArray(cells) || cells.length === 0) {
    return false;
  }

  return cells.some((cell: any) => {
    if (cell?.tileId) return true;
    const charCode = Number(cell?.charCode);
    return Number.isFinite(charCode) && charCode > 0;
  });
}

function buildResourceId(label: string): string {
  return buildResourceIdLabelFromAsmLabel(label);
}

function buildBossLabelMap(analysis: ProjectAnalysis): Map<string, string> {
  const labels = new Map<string, string>();
  ((analysis.bosses || []) as Boss[]).forEach((boss, index) => {
    const label = `boss_${index}_${sanitizeLabel(boss.name, 'boss')}`;
    if (boss.id) {
      labels.set(boss.id, label);
    }
  });
  return labels;
}

function buildBossByIdMap(analysis: ProjectAnalysis): Map<string, Boss> {
  const bosses = new Map<string, Boss>();
  ((analysis.bosses || []) as Boss[]).forEach((boss) => {
    if (boss.id) bosses.set(boss.id, boss);
  });
  return bosses;
}

function resolveBossPlacementForExport(screen: ScreenMap, instance: BossInstance, boss: Boss): { xChar: number; yChar: number } {
  const bossName = boss.name || instance.bossAssetId;
  if (!boss.linkedScreenId || boss.linkedScreenId !== screen.id) {
    throw new Error(`Boss "${bossName}" is placed on screen "${screen.name}" but its Behavior screen is not set to this screen.`);
  }

  const hasBehaviorX = Number.isFinite(boss.behaviorPreviewStartXChar);
  const hasBehaviorY = Number.isFinite(boss.behaviorPreviewStartYChar);
  if (!hasBehaviorX && !hasBehaviorY) {
    throw new Error(`Boss "${bossName}" is placed on screen "${screen.name}" but Behavior start X/Y is not defined.`);
  }

  // Migration tolerance: early Behavior saves could persist only one axis. Use the
  // old screen placement for the missing axis while keeping Behavior authoritative.
  return {
    xChar: hasBehaviorX ? boss.behaviorPreviewStartXChar as number : instance.xChar,
    yChar: hasBehaviorY ? boss.behaviorPreviewStartYChar as number : instance.yChar,
  };
}

function buildBossPlacementRows(screen: ScreenMap, bossLabelById: Map<string, string>, bossById: Map<string, Boss>): string[] {
  const rows: string[] = [];
  const instances = (screen.bossInstances || []) as BossInstance[];

  instances.forEach((instance) => {
    const bossLabel = bossLabelById.get(instance.bossAssetId);
    if (!bossLabel) {
      return;
    }
    const boss = bossById.get(instance.bossAssetId);
    if (!boss) {
      return;
    }
    const placement = resolveBossPlacementForExport(screen, instance, boss);
    const flags = instance.enabled === false ? 0 : 1;
    const updateInterval = Math.max(1, Math.min(8, Math.floor(Number(boss.runtimeUpdateIntervalFrames) || 1)));
    const health = Math.max(1, Math.min(65535, Math.floor(Number(boss.totalHealth) || 1)));
    rows.push(`    dw ${bossLabel}_phase_table, ${bossLabel}_attack_table`);
    rows.push(`    db ${clampByte(placement.xChar)}, ${clampByte(placement.yChar)}, ${clampByte(instance.initialPhaseIndex)}, ${flags}, ${updateInterval}, ${health & 0xff}, ${(health >> 8) & 0xff}    ; xChar,yChar,initialPhase,flags,updateEveryNFrames,healthLo,healthHi`);
  });

  return rows;
}

function generateBossPlacementTable(
  screenName: string,
  index: number,
  screen: ScreenMap,
  bossLabelById: Map<string, string>,
  bossById: Map<string, Boss>
): string {
  const rows = buildBossPlacementRows(screen, bossLabelById, bossById);
  let asm = `SCREEN_${screenName}_${index}_BOSS_TABLE:\n`;
  if (rows.length === 0) {
    asm += `    db 0    ; No boss placements\n`;
  } else {
    asm += `    ; Entry format: dw phaseTable, dw attackTable, db xChar, yChar, initialPhase, flags(bit0=enabled), updateEveryNFrames, healthLo, healthHi\n`;
    asm += `${rows.join('\n')}\n`;
  }
  return asm;
}

function generatePresentationScreenSection(
  analysis: ProjectAnalysis,
  hasSpriteAssets: boolean,
  romMode: string,
  targetFormat: MapperTargetFormat
): string {
  if (!hasPresentationScreenData(analysis)) {
    // Stub so GameFlow PresentationScreen nodes can always call show_presentation_screen
    return `show_presentation_screen:
    ret

`;
  }

  const presentationScreen = analysis.presentationScreen!;
  const config = presentationScreen;
  const usesMapper = usesMapperBanking(romMode);
  const mapperWindow = getMapperWindowConfig(romMode, targetFormat);
  const useResourceManager = romMode === 'megarom';
  const usePage0DataGroup = romMode === 'plain48k' && presentationScreenUsesPage0Group(analysis, romMode);
  const useBank4DataGroup = romMode === 'megarom';
  // For bank4 data, labels are assembled at org #C000+ and accessed via P2 window.
  // Universal formula: (LABEL & #1FFF) | #8000 — works for any bank number.
  const hlExpr = (label: string) => useBank4DataGroup ? buildMapperWindowedAddress(label, mapperWindow) : label;
  const patternSize = Math.max(
    config.data.patternBank0.length,
    config.data.patternBank1.length,
    config.data.patternBank2.length
  );
  const colorSize = Math.max(
    config.data.colorBank0.length,
    config.data.colorBank1.length,
    config.data.colorBank2.length
  );
  const nameSize = config.data.nameTable.length;
  const presentationNameTableResourceId = buildResourceId('PRESENTATION_SCREEN_NAMETBL');
  const presentationPatternsB0ResourceId = buildResourceId('PRESENTATION_SCREEN_PATTERNS_B0');
  const presentationPatternsB1ResourceId = buildResourceId('PRESENTATION_SCREEN_PATTERNS_B1');
  const presentationPatternsB2ResourceId = buildResourceId('PRESENTATION_SCREEN_PATTERNS_B2');
  const presentationColorsB0ResourceId = buildResourceId('PRESENTATION_SCREEN_COLORS_B0');
  const presentationColorsB1ResourceId = buildResourceId('PRESENTATION_SCREEN_COLORS_B1');
  const presentationColorsB2ResourceId = buildResourceId('PRESENTATION_SCREEN_COLORS_B2');
  const emitPage0PresentationTransfer = (
    label: string,
    ramBuffer: string,
    vramDestination: string,
    sizeSymbol: string,
    compressed: boolean
  ) => compressed
    ? `    ld hl, ${label}
    ld de, ${ramBuffer}
    call page0_decompress_to_ram
    ld hl, ${ramBuffer}
    ld de, ${vramDestination}
    ld bc, ${sizeSymbol}
    call FAST_LDIRVM
`
    : `    ld hl, ${label}
    ld de, ${vramDestination}
    ld bc, ${sizeSymbol}
    call page0_copy_to_vram
`;

  let code = `; ==================================================================
; PRESENTATION SCREEN DATA
; ==================================================================

; Presentation Screen runtime config
; PRESENTATION_SCREEN_COMPRESS_NAMETBL: ${config.compression.compressNameTable ? 1 : 0}
; PRESENTATION_SCREEN_COMPRESS_PATTERNS: ${config.compression.compressPatterns ? 1 : 0}
; PRESENTATION_SCREEN_COMPRESS_COLORS: ${config.compression.compressColors ? 1 : 0}
${usePage0DataGroup ? '; PRESENTATION_SCREEN_ROM_DATA_GROUP: page0\n'
    : useBank4DataGroup ? `; PRESENTATION_SCREEN_ROM_DATA_GROUP: bank4
PRESENTATION_SCREEN_NAMETBL_BANK EQU ${buildMapperBankEqu('PRESENTATION_SCREEN_NAMETBL', mapperWindow)}
PRESENTATION_SCREEN_PATTERNS_B0_BANK EQU ${buildMapperBankEqu('PRESENTATION_SCREEN_PATTERNS_B0', mapperWindow)}
PRESENTATION_SCREEN_PATTERNS_B1_BANK EQU ${buildMapperBankEqu('PRESENTATION_SCREEN_PATTERNS_B1', mapperWindow)}
PRESENTATION_SCREEN_PATTERNS_B2_BANK EQU ${buildMapperBankEqu('PRESENTATION_SCREEN_PATTERNS_B2', mapperWindow)}
PRESENTATION_SCREEN_COLORS_B0_BANK EQU ${buildMapperBankEqu('PRESENTATION_SCREEN_COLORS_B0', mapperWindow)}
PRESENTATION_SCREEN_COLORS_B1_BANK EQU ${buildMapperBankEqu('PRESENTATION_SCREEN_COLORS_B1', mapperWindow)}
PRESENTATION_SCREEN_COLORS_B2_BANK EQU ${buildMapperBankEqu('PRESENTATION_SCREEN_COLORS_B2', mapperWindow)}
`
    : `PRESENTATION_SCREEN_NAMETBL_BANK EQU ${buildMapperBankEqu('PRESENTATION_SCREEN_NAMETBL', mapperWindow)}
PRESENTATION_SCREEN_PATTERNS_B0_BANK EQU ${buildMapperBankEqu('PRESENTATION_SCREEN_PATTERNS_B0', mapperWindow)}
PRESENTATION_SCREEN_PATTERNS_B1_BANK EQU ${buildMapperBankEqu('PRESENTATION_SCREEN_PATTERNS_B1', mapperWindow)}
PRESENTATION_SCREEN_PATTERNS_B2_BANK EQU ${buildMapperBankEqu('PRESENTATION_SCREEN_PATTERNS_B2', mapperWindow)}
PRESENTATION_SCREEN_COLORS_B0_BANK EQU ${buildMapperBankEqu('PRESENTATION_SCREEN_COLORS_B0', mapperWindow)}
PRESENTATION_SCREEN_COLORS_B1_BANK EQU ${buildMapperBankEqu('PRESENTATION_SCREEN_COLORS_B1', mapperWindow)}
PRESENTATION_SCREEN_COLORS_B2_BANK EQU ${buildMapperBankEqu('PRESENTATION_SCREEN_COLORS_B2', mapperWindow)}
`}PRESENTATION_SCREEN_NAMETBL_SIZE EQU ${nameSize}
PRESENTATION_SCREEN_PATTERN_B0_SIZE EQU ${config.data.patternBank0.length}
PRESENTATION_SCREEN_PATTERN_B1_SIZE EQU ${config.data.patternBank1.length}
PRESENTATION_SCREEN_PATTERN_B2_SIZE EQU ${config.data.patternBank2.length}
PRESENTATION_SCREEN_COLOR_B0_SIZE EQU ${config.data.colorBank0.length}
PRESENTATION_SCREEN_COLOR_B1_SIZE EQU ${config.data.colorBank1.length}
PRESENTATION_SCREEN_COLOR_B2_SIZE EQU ${config.data.colorBank2.length}
PRESENTATION_SCREEN_MAX_PATTERN_SIZE EQU ${patternSize}
PRESENTATION_SCREEN_MAX_COLOR_SIZE EQU ${colorSize}

`;

  if (usePage0DataGroup) {
    code += `; Data labels are emitted in page0.asm for linear 48K builds.\n`;
  } else if (useBank4DataGroup) {
    code += `; Data labels are emitted in bank4 section (org #C000) for megarom builds.\n`;
  } else {
    code += generateRawByteBlock('PRESENTATION_SCREEN_NAMETBL', config.data.nameTable, [
      `${config.name} - Name table (32x24)`,
    ]);
    code += '\n';
    code += generateRawByteBlock('PRESENTATION_SCREEN_PATTERNS_B0', config.data.patternBank0, [
      `${config.name} - Pattern bank 0`,
    ]);
    code += '\n';
    code += generateRawByteBlock('PRESENTATION_SCREEN_PATTERNS_B1', config.data.patternBank1, [
      `${config.name} - Pattern bank 1`,
    ]);
    code += '\n';
    code += generateRawByteBlock('PRESENTATION_SCREEN_PATTERNS_B2', config.data.patternBank2, [
      `${config.name} - Pattern bank 2`,
    ]);
    code += '\n';
    code += generateRawByteBlock('PRESENTATION_SCREEN_COLORS_B0', config.data.colorBank0, [
      `${config.name} - Color bank 0`,
    ]);
    code += '\n';
    code += generateRawByteBlock('PRESENTATION_SCREEN_COLORS_B1', config.data.colorBank1, [
      `${config.name} - Color bank 1`,
    ]);
    code += '\n';
    code += generateRawByteBlock('PRESENTATION_SCREEN_COLORS_B2', config.data.colorBank2, [
      `${config.name} - Color bank 2`,
    ]);
  }
  code += `\n${buildRegisterContractComment({
    purpose: 'Wait a configurable number of frames after showing the presentation screen.',
    inputs: ['B = frame count'],
    outputs: ['None'],
    clobbers: ['AF', 'B'],
    preserved: ['BC', 'DE', 'HL', 'IX', 'IY'],
  })}presentation_wait_frames:
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

${buildRegisterContractComment({
    purpose: 'Wait for SPACE press and release after showing the presentation screen.',
    inputs: ['None'],
    outputs: ['None'],
    clobbers: ['AF'],
    preserved: ['BC', 'DE', 'HL', 'IX', 'IY'],
  })}presentation_wait_for_fire:
.pwff_wait_press:
    halt
    call presentation_read_fire_direct
    or a
    jr z, .pwff_wait_press
.pwff_wait_release:
    halt
    call presentation_read_fire_direct
    or a
    jr nz, .pwff_wait_release
    ret

${buildRegisterContractComment({
    purpose: 'Read SPACE directly for presentation-screen waits without depending on runtime input tasks.',
    inputs: ['None'],
    outputs: ['A = 1 if SPACE pressed, A = 0 otherwise'],
    clobbers: ['AF'],
    preserved: ['BC', 'DE', 'HL', 'IX', 'IY'],
    notes: ['Uses keyboard matrix row 8 bit 0 (SPACE, active low).']
  })}presentation_read_fire_direct:
    ld a, 8
    call FAST_SNSMAT
    bit 0, a
    jr z, .prfd_pressed
    xor a
    ret
.prfd_pressed:
    ld a, 1
    ret

${buildRegisterContractComment({
    purpose: 'Show the imported fullscreen presentation image in SCREEN 2.',
    inputs: ['None'],
    outputs: ['None'],
    clobbers: ['AF', 'BC', 'DE', 'HL'],
    preserved: ['IX', 'IY'],
    notes: ['Loads pattern/color banks 0..2 and the 32x24 name table.', 'Optional wait/key behavior comes from Presentation Screen config.']
  })}show_presentation_screen:
    call DISSCR
    ld a, 2
    call CHGMOD
    ; Fullscreen presentation replaces shared gameplay/font tables in VRAM.
${useResourceManager
    ? `    call resource_invalidate_gameplay_vram_cache`
    : `    xor a
    ld (vram_cache_tile_patterns_ready), a
    ld (vram_cache_tile_colors_ready), a
    ld (vram_cache_font_ready), a
    ld a, #FF
    ld (current_screen2_tilebank_id), a`}
`;

  if (config.runtime.clearSpritesBeforeShow && hasSpriteAssets) {
    code += `    call clear_all_sprites
    call update_sprites_to_vram
`;
  }

  code += usePage0DataGroup
    ? `    ; Page 0 presentation data may mix raw and ZX0-compressed blocks.
${emitPage0PresentationTransfer(
      'PRESENTATION_SCREEN_PATTERNS_B0',
      'ZX0_TILE_PATTERN_BUFFER',
      'CHRTBL2',
      'PRESENTATION_SCREEN_PATTERN_B0_SIZE',
      config.compression.compressPatterns
    )}
${emitPage0PresentationTransfer(
      'PRESENTATION_SCREEN_PATTERNS_B1',
      'ZX0_TILE_PATTERN_BUFFER',
      'CHRTBL2 + #800',
      'PRESENTATION_SCREEN_PATTERN_B1_SIZE',
      config.compression.compressPatterns
    )}
${emitPage0PresentationTransfer(
      'PRESENTATION_SCREEN_PATTERNS_B2',
      'ZX0_TILE_PATTERN_BUFFER',
      'CHRTBL2 + #1000',
      'PRESENTATION_SCREEN_PATTERN_B2_SIZE',
      config.compression.compressPatterns
    )}
${emitPage0PresentationTransfer(
      'PRESENTATION_SCREEN_COLORS_B0',
      'ZX0_TILE_COLOR_BUFFER',
      'CLRTBL2',
      'PRESENTATION_SCREEN_COLOR_B0_SIZE',
      config.compression.compressColors
    )}
${emitPage0PresentationTransfer(
      'PRESENTATION_SCREEN_COLORS_B1',
      'ZX0_TILE_COLOR_BUFFER',
      'CLRTBL2 + #800',
      'PRESENTATION_SCREEN_COLOR_B1_SIZE',
      config.compression.compressColors
    )}
${emitPage0PresentationTransfer(
      'PRESENTATION_SCREEN_COLORS_B2',
      'ZX0_TILE_COLOR_BUFFER',
      'CLRTBL2 + #1000',
      'PRESENTATION_SCREEN_COLOR_B2_SIZE',
      config.compression.compressColors
    )}
${emitPage0PresentationTransfer(
      'PRESENTATION_SCREEN_NAMETBL',
      'ZX0_SCREEN_BUFFER',
      'NAMETBL',
      'PRESENTATION_SCREEN_NAMETBL_SIZE',
      config.compression.compressNameTable
    )}
`
    : !usesMapper
    ? `    ld hl, PRESENTATION_SCREEN_PATTERNS_B0
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
`
    : useResourceManager
    ? `    ld a, ${presentationPatternsB0ResourceId}
    ld de, CHRTBL2
    call resource_load_to_vram_by_id

    ld a, ${presentationPatternsB1ResourceId}
    ld de, CHRTBL2 + #800
    call resource_load_to_vram_by_id

    ld a, ${presentationPatternsB2ResourceId}
    ld de, CHRTBL2 + #1000
    call resource_load_to_vram_by_id

    ld a, ${presentationColorsB0ResourceId}
    ld de, CLRTBL2
    call resource_load_to_vram_by_id

    ld a, ${presentationColorsB1ResourceId}
    ld de, CLRTBL2 + #800
    call resource_load_to_vram_by_id

    ld a, ${presentationColorsB2ResourceId}
    ld de, CLRTBL2 + #1000
    call resource_load_to_vram_by_id

    ld a, ${presentationNameTableResourceId}
    ld de, NAMETBL
    call resource_load_to_vram_by_id

    call ENASCR
`
    : `    call mapper_push_${mapperWindow.dataWindowPage}
    ld a, PRESENTATION_SCREEN_PATTERNS_B0_BANK
    call mapper_set_bank_${mapperWindow.dataWindowPage}
    ld hl, ${hlExpr('PRESENTATION_SCREEN_PATTERNS_B0')}
    ld de, CHRTBL2
    ld bc, PRESENTATION_SCREEN_PATTERN_B0_SIZE
    call FAST_LDIRVM
    call mapper_pop_${mapperWindow.dataWindowPage}

    call mapper_push_${mapperWindow.dataWindowPage}
    ld a, PRESENTATION_SCREEN_PATTERNS_B1_BANK
    call mapper_set_bank_${mapperWindow.dataWindowPage}
    ld hl, ${hlExpr('PRESENTATION_SCREEN_PATTERNS_B1')}
    ld de, CHRTBL2 + #800
    ld bc, PRESENTATION_SCREEN_PATTERN_B1_SIZE
    call FAST_LDIRVM
    call mapper_pop_${mapperWindow.dataWindowPage}

    call mapper_push_${mapperWindow.dataWindowPage}
    ld a, PRESENTATION_SCREEN_PATTERNS_B2_BANK
    call mapper_set_bank_${mapperWindow.dataWindowPage}
    ld hl, ${hlExpr('PRESENTATION_SCREEN_PATTERNS_B2')}
    ld de, CHRTBL2 + #1000
    ld bc, PRESENTATION_SCREEN_PATTERN_B2_SIZE
    call FAST_LDIRVM
    call mapper_pop_${mapperWindow.dataWindowPage}

    call mapper_push_${mapperWindow.dataWindowPage}
    ld a, PRESENTATION_SCREEN_COLORS_B0_BANK
    call mapper_set_bank_${mapperWindow.dataWindowPage}
    ld hl, ${hlExpr('PRESENTATION_SCREEN_COLORS_B0')}
    ld de, CLRTBL2
    ld bc, PRESENTATION_SCREEN_COLOR_B0_SIZE
    call FAST_LDIRVM
    call mapper_pop_${mapperWindow.dataWindowPage}

    call mapper_push_${mapperWindow.dataWindowPage}
    ld a, PRESENTATION_SCREEN_COLORS_B1_BANK
    call mapper_set_bank_${mapperWindow.dataWindowPage}
    ld hl, ${hlExpr('PRESENTATION_SCREEN_COLORS_B1')}
    ld de, CLRTBL2 + #800
    ld bc, PRESENTATION_SCREEN_COLOR_B1_SIZE
    call FAST_LDIRVM
    call mapper_pop_${mapperWindow.dataWindowPage}

    call mapper_push_${mapperWindow.dataWindowPage}
    ld a, PRESENTATION_SCREEN_COLORS_B2_BANK
    call mapper_set_bank_${mapperWindow.dataWindowPage}
    ld hl, ${hlExpr('PRESENTATION_SCREEN_COLORS_B2')}
    ld de, CLRTBL2 + #1000
    ld bc, PRESENTATION_SCREEN_COLOR_B2_SIZE
    call FAST_LDIRVM
    call mapper_pop_${mapperWindow.dataWindowPage}

    call mapper_push_${mapperWindow.dataWindowPage}
    ld a, PRESENTATION_SCREEN_NAMETBL_BANK
    call mapper_set_bank_${mapperWindow.dataWindowPage}
    ld hl, ${hlExpr('PRESENTATION_SCREEN_NAMETBL')}
    ld de, NAMETBL
    ld bc, PRESENTATION_SCREEN_NAMETBL_SIZE
    call FAST_LDIRVM
    call mapper_pop_${mapperWindow.dataWindowPage}

    call ENASCR
`;

  if (config.runtime.waitForFrames > 0) {
    code += `    ld b, ${Math.max(0, Math.min(255, config.runtime.waitForFrames))}
    call presentation_wait_frames
`;
  }

  if (config.runtime.waitForKey) {
    code += `    call presentation_wait_for_fire
`;
  }

  code += `    ret

`;

  return code;
}

/**
 * Returns only the DB byte blocks for presentation screen data, for bank4 placement.
 * Used by unifiedGenerator when romMode === 'megarom' to emit data after org #C000.
 */
export function getPresentationScreenBank4Data(analysis: ProjectAnalysis): string {
  if (!hasPresentationScreenData(analysis)) return '';
  const config = analysis.presentationScreen!;
  let asm = '';
  asm += generateRawByteBlock('PRESENTATION_SCREEN_NAMETBL', config.data.nameTable, [`${config.name} - Name table (32x24)`]);
  asm += '\n';
  asm += generateRawByteBlock('PRESENTATION_SCREEN_PATTERNS_B0', config.data.patternBank0, [`${config.name} - Pattern bank 0`]);
  asm += '\n';
  asm += generateRawByteBlock('PRESENTATION_SCREEN_PATTERNS_B1', config.data.patternBank1, [`${config.name} - Pattern bank 1`]);
  asm += '\n';
  asm += generateRawByteBlock('PRESENTATION_SCREEN_PATTERNS_B2', config.data.patternBank2, [`${config.name} - Pattern bank 2`]);
  asm += '\n';
  asm += generateRawByteBlock('PRESENTATION_SCREEN_COLORS_B0', config.data.colorBank0, [`${config.name} - Color bank 0`]);
  asm += '\n';
  asm += generateRawByteBlock('PRESENTATION_SCREEN_COLORS_B1', config.data.colorBank1, [`${config.name} - Color bank 1`]);
  asm += '\n';
  asm += generateRawByteBlock('PRESENTATION_SCREEN_COLORS_B2', config.data.colorBank2, [`${config.name} - Color bank 2`]);
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

function buildScreenEntityCountMap(analysis: ProjectAnalysis): Map<string, number> {
  const counts = new Map<string, number>();
  for (const entity of analysis.entities || []) {
    const screenId = String((entity as any)?.screenAssetId || '').trim();
    if (!screenId) continue;
    counts.set(screenId, (counts.get(screenId) || 0) + 1);
  }
  return counts;
}

function buildScreenWorldMembershipMap(analysis: ProjectAnalysis): Map<string, Set<string>> {
  const membership = new Map<string, Set<string>>();
  for (const world of (analysis.worldmaps || []) as any[]) {
    const worldId = String(world?.id || '').trim();
    if (!worldId) continue;
    for (const node of world?.nodes || []) {
      const screenId = String(node?.screenAssetId || '').trim();
      if (!screenId) continue;
      const worlds = membership.get(screenId) || new Set<string>();
      worlds.add(worldId);
      membership.set(screenId, worlds);
    }
  }
  return membership;
}

function isExportableMusicTrack(trackAssetId: string, analysis: ProjectAnalysis): boolean {
  const trimmedId = String(trackAssetId || '').trim();
  if (!trimmedId) return false;

  const trackIndexMap = ((analysis as any).trackIndexByAssetId || {}) as Record<string, number>;
  return trackIndexMap[trimmedId] !== undefined;
}

function hasAnyGameplayMusicConfigured(analysis: ProjectAnalysis): boolean {
  return ((analysis.gameFlow?.nodes || []) as any[]).some((node: any) => {
    if (node?.type !== 'Music') return false;
    if (node?.stop === true) return false;
    if (node?.autoPlay === false) return false;
    return isExportableMusicTrack(String(node?.trackAssetId || ''), analysis);
  });
}

function buildWorldMusicFlagMap(analysis: ProjectAnalysis): Map<string, number> {
  const musicByWorldId = new Map<string, number>();
  const gameFlow = analysis.gameFlow as any;
  const nodes = Array.isArray(gameFlow?.nodes) ? gameFlow.nodes : [];
  if (nodes.length === 0) return musicByWorldId;

  const nodeById = new Map<string, any>();
  for (const node of nodes) {
    const nodeId = String(node?.id || '').trim();
    if (!nodeId) continue;
    nodeById.set(nodeId, node);
  }

  const adjacency = new Map<string, string[]>();
  for (const connection of Array.isArray(gameFlow?.connections) ? gameFlow.connections : []) {
    const fromId = String(connection?.from?.nodeId || '').trim();
    const toId = String(connection?.to?.nodeId || '').trim();
    if (!fromId || !toId) continue;
    const next = adjacency.get(fromId) || [];
    next.push(toId);
    adjacency.set(fromId, next);
  }

  const startNodeId = String(gameFlow?.startNodeId || '').trim();
  if (!startNodeId || !nodeById.has(startNodeId)) {
    return musicByWorldId;
  }

  const queue: Array<{ nodeId: string; musicActive: number }> = [{ nodeId: startNodeId, musicActive: 0 }];
  const seenStates = new Set<string>();

  while (queue.length > 0) {
    const state = queue.shift()!;
    const stateKey = `${state.nodeId}|${state.musicActive}`;
    if (seenStates.has(stateKey)) continue;
    seenStates.add(stateKey);

    const node = nodeById.get(state.nodeId);
    if (!node) continue;

    let nextMusicActive = state.musicActive;
    if (node.type === 'Music') {
      if (node.stop === true) {
        nextMusicActive = 0;
      } else if (node.autoPlay === false) {
        nextMusicActive = state.musicActive;
      } else if (isExportableMusicTrack(String(node.trackAssetId || ''), analysis)) {
        nextMusicActive = 1;
      }
    }

    if (node.type === 'WorldLink') {
      const worldId = String(node.worldAssetId || '').trim();
      if (worldId) {
        const prev = musicByWorldId.get(worldId) || 0;
        musicByWorldId.set(worldId, prev | nextMusicActive);
      }
    }

    for (const nextNodeId of adjacency.get(state.nodeId) || []) {
      queue.push({ nodeId: nextNodeId, musicActive: nextMusicActive });
    }
  }

  return musicByWorldId;
}

export function buildScreenResourcePolicyManifest(analysis: ProjectAnalysis): string {
  const screens = Array.isArray(analysis.screenMaps) ? analysis.screenMaps : [];
  const screenSpriteUsage = new Map(
    buildScreenSpritePatternUsageSummaries(analysis).map((summary) => [summary.screenId, summary.totalSlotsRequired])
  );
  const screenWorldMembership = buildScreenWorldMembershipMap(analysis);
  const interactionTargetIdMap = buildInteractionTargetIdMap(analysis);
  const worldMusicFlags = buildWorldMusicFlagMap(analysis);
  const fallbackGameplayMusic = hasAnyGameplayMusicConfigured(analysis) ? 1 : 0;
  const referencedTileBanks = buildReferencedScreen2TileBanks(analysis);
  const lines: string[] = [];

  lines.push('SCREEN RESOURCE POLICY');
  lines.push('Logical view of resources consumed by screen/world loading paths.');
  lines.push('');
  lines.push('COMMON RESOURCES');

  if ((analysis.tiles || []).length > 0) {
    lines.push(`- patterns: ${buildResourceId('tile_pattern_bank0')} -> load_pattern_bank0/load_pattern_bank1/load_pattern_bank2`);
    lines.push(`- colors: ${buildResourceId('tile_color_bank0')} -> load_color_bank0/load_color_bank1/load_color_bank2`);
  } else {
    lines.push(`- patterns/colors: none`);
  }

  if ((analysis.fonts || []).length > 0) {
    lines.push(`- font patterns: ${buildResourceId('FONT_PATTERN_DATA')}`);
    lines.push(`- font colors: ${buildResourceId('FONT_COLOR_DATA')}`);
  } else {
    lines.push(`- font: none`);
  }

  if (analysis.presentationScreen) {
    lines.push(`- presentation nametable: ${buildResourceId('PRESENTATION_SCREEN_NAMETBL')}`);
    lines.push(`- presentation patterns: ${buildResourceId('PRESENTATION_SCREEN_PATTERNS_B0')}, ${buildResourceId('PRESENTATION_SCREEN_PATTERNS_B1')}, ${buildResourceId('PRESENTATION_SCREEN_PATTERNS_B2')}`);
    lines.push(`- presentation colors: ${buildResourceId('PRESENTATION_SCREEN_COLORS_B0')}, ${buildResourceId('PRESENTATION_SCREEN_COLORS_B1')}, ${buildResourceId('PRESENTATION_SCREEN_COLORS_B2')}`);
  } else {
    lines.push(`- presentation: none`);
  }

  if (referencedTileBanks.length > 0) {
    lines.push(`- tilebank loaders:`);
    referencedTileBanks.forEach((runtime) => {
      lines.push(`  ${runtime.tileBankId}: ${getScreen2TileBankPatternLoaderLabel(runtime.tileBankId)} / ${getScreen2TileBankColorLoaderLabel(runtime.tileBankId)}`);
    });
  }

  lines.push('');

  if (screens.length === 0) {
    lines.push('No screens detected.');
    return lines.join('\n');
  }

  screens.forEach((screen: any, index: number) => {
    const screenId = String(screen?.id || `screen_${index}`);
    const screenName = String(screen?.name || `Screen ${index}`);
    const screenNameAsm = screenName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const worldIds = screenWorldMembership.get(screenId);
    const worldList = worldIds && worldIds.size > 0 ? Array.from(worldIds).join(', ') : 'none';
    const musicInGame = worldIds && worldIds.size > 0
      ? Array.from(worldIds).some((worldId) => (worldMusicFlags.get(worldId) || 0) !== 0) ? 1 : 0
      : fallbackGameplayMusic;
    const spritePatternSlots = screenSpriteUsage.get(screenId) || 1;
    const tileBankId = String(screen?.tileBankAssetId || '').trim() || 'default/base';

    lines.push(`SCREEN ${index.toString().padStart(2, '0')} ${screenName} (${screenId})`);
    lines.push(`- worlds: ${worldList}`);
    lines.push(`- tile_bank: ${tileBankId}`);
    lines.push(`- sprite_pattern_slots: ${spritePatternSlots}`);
    lines.push(`- music_in_game: ${musicInGame}`);
    if (screen?.blockOptimization?.backgroundMode && screen.blockOptimization.backgroundMode !== 'raw') {
      lines.push(`- background_block_catalog: ${buildResourceId(`SCREEN_${screenNameAsm}_${index}_BLOCK_CATALOG`)}`);
      lines.push(`- background_block_map: ${buildResourceId(`SCREEN_${screenNameAsm}_${index}_BLOCK_MAP`)}`);
    } else {
      lines.push(`- layout: ${buildResourceId(`SCREEN_${screenNameAsm}_${index}_LAYOUT`)}`);
    }
    lines.push(`- effects_layout: ${buildResourceId(`SCREEN_${screenNameAsm}_${index}_EFFECTS_LAYOUT`)}`);
    lines.push(`- effect_zone_table: ${buildResourceId(`SCREEN_${screenNameAsm}_${index}_EFFECT_ZONE_TABLE`)}`);
    lines.push(`- interaction_type_map: ${buildResourceId(`SCREEN_${screenNameAsm}_${index}_INTERACTION_TYPE_MAP`)}`);
    lines.push(`- interaction_value_map: ${buildResourceId(`SCREEN_${screenNameAsm}_${index}_INTERACTION_VALUE_MAP`)}`);
    lines.push(`- interaction_target_map: ${buildResourceId(`SCREEN_${screenNameAsm}_${index}_INTERACTION_TARGET_MAP`)}`);
    if (resolveScreenBehaviorSource(screen) === 'backgroundChars') {
      lines.push(`- char_behavior_table: ${buildResourceId(`SCREEN_${screenNameAsm}_${index}_CHAR_BEHAVIOR_TABLE`)}`);
      lines.push(`- behavior: runtime rebuilt from screen layout + char table`);
    } else {
      lines.push(`- behavior: ${buildResourceId(`BEHAVIOR_${screenNameAsm}_${index}_DATA`)}`);
    }
    lines.push('');
  });

  return lines.join('\n').trimEnd();
}

function countAnimatedGroupsInScreen(
  backgroundLayoutBytes: number[],
  effectsLayoutBytes: number[],
  animatedGroups: Array<{ targetCharCode: number; charsPerTile: number }>
): number {
  if (animatedGroups.length === 0) return 0;
  const presentChars = new Set<number>([...backgroundLayoutBytes, ...effectsLayoutBytes]);
  let count = 0;
  for (const group of animatedGroups) {
    let present = false;
    for (let charCode = group.targetCharCode; charCode < group.targetCharCode + group.charsPerTile; charCode++) {
      if (presentChars.has(charCode)) {
        present = true;
        break;
      }
    }
    if (present) count++;
  }
  return count;
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
export function generateScreensFile(
  analysis: ProjectAnalysis,
  romMode: string = 'simple32k',
  dataInBank4: boolean = false,
  targetFormat: MapperTargetFormat = 'konami'
): string {
  const usesMapper = usesMapperBanking(romMode);
  const useResourceManager = romMode === 'megarom';
  const mapperWindow = getMapperWindowConfig(romMode, targetFormat);
  const mapperAddr = (label: string) => usesMapper ? buildMapperWindowedAddress(label, mapperWindow) : label;
  const hasSpriteAssets = !!analysis.sprites && analysis.sprites.length > 0;
  const animatedTileGroups = collectAnimatedTileGroupSummaries(analysis);
  const screenEntityCounts = buildScreenEntityCountMap(analysis);
  const screenSpriteUsage = new Map(
    buildScreenSpritePatternUsageSummaries(analysis).map((summary) => [summary.screenId, summary.totalSlotsRequired])
  );
  const screenWorldMembership = buildScreenWorldMembershipMap(analysis);
  const interactionTargetIdMap = buildInteractionTargetIdMap(analysis);
  const worldMusicFlags = buildWorldMusicFlagMap(analysis);
  const fallbackGameplayMusic = hasAnyGameplayMusicConfigured(analysis) ? 1 : 0;
  const bossLabelById = buildBossLabelMap(analysis);
  const bossById = buildBossByIdMap(analysis);
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

${generatePresentationScreenSection(analysis, hasSpriteAssets, romMode, targetFormat)}
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
    const behaviorArtifacts = buildBehaviorGenerationArtifacts(screen, analysis, tileBankDefinitions, backgroundLayoutBytes);
    const interactionArtifacts = buildInteractionGenerationArtifacts(screen, analysis, interactionTargetIdMap);
    const backgroundBlockMap = buildScreenBlockMapFromBytes({
      bytes: backgroundLayoutBytes,
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      mode: screen.blockOptimization?.backgroundMode,
    });
    const effectsLayoutBytes = buildLayerLayoutBytes(screen, 'effects', analysis, tileBankDefinitions);
    const hasEffectsLayoutData = effectsLayoutBytes.some(value => value !== 0);
    const effectZoneBytes = buildEffectZoneBytes(screen);
    const effectZoneCount = (screen.effectZones || []).length;
    const bossPlacementRows = buildBossPlacementRows(screen, bossLabelById, bossById);
    const bossPlacementCount = bossPlacementRows.length / 2;
    const screenId = String(screen.id || `screen_${index}`);
    const animatedGroupCount = countAnimatedGroupsInScreen(
      backgroundLayoutBytes,
      effectsLayoutBytes,
      animatedTileGroups
    );
    const entityCount = screenEntityCounts.get(screenId) || 0;
    const spritePatternSlots = screenSpriteUsage.get(screenId) || 1;
      const hasHudData = !!(
        (screen.hudConfiguration?.elements && screen.hudConfiguration.elements.length > 0) ||
        hasUsableImportedHudFrameSnapshot(screen)
      );
    const worldIds = screenWorldMembership.get(screenId);
    const musicInGame = worldIds && worldIds.size > 0
      ? Array.from(worldIds).some((worldId) => (worldMusicFlags.get(worldId) || 0) !== 0) ? 1 : 0
      : fallbackGameplayMusic;
    const summaryFlags =
      (musicInGame ? 0x01 : 0) |
      (hasHudData ? 0x02 : 0) |
      ((hasEffectsLayoutData || effectZoneCount > 0) ? 0x04 : 0) |
      (animatedGroupCount > 0 ? 0x08 : 0);

    return {
      screen,
      screenId,
      index,
      screenName,
      screenNameWithIndex,
      backgroundLayoutBytes,
      behaviorSource: behaviorArtifacts.behaviorSource,
      behaviorMapData: behaviorArtifacts.behaviorMapData,
      charBehaviorTable: behaviorArtifacts.charBehaviorTable,
      interactionTypeMap: interactionArtifacts.interactionTypeMap,
      interactionValueMap: interactionArtifacts.interactionValueMap,
      interactionTargetMap: interactionArtifacts.interactionTargetMap,
      backgroundBlockMap,
      effectsLayoutBytes,
      hasEffectsLayoutData,
      effectZoneBytes,
      effectZoneCount,
      bossPlacementCount,
      animatedGroupCount,
      entityCount,
      spritePatternSlots,
      musicInGame,
      summaryFlags,
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
SCREEN_RUNTIME_SUMMARY_ENTRY_SIZE EQU 4
SCREEN_RUNTIME_SUMMARY_OFFS_ANIM_GROUPS EQU 0
SCREEN_RUNTIME_SUMMARY_OFFS_ENTITY_COUNT EQU 1
SCREEN_RUNTIME_SUMMARY_OFFS_SPRITE_PATTERN_SLOTS EQU 2
SCREEN_RUNTIME_SUMMARY_OFFS_FLAGS EQU 3
SCREEN_RUNTIME_SUMMARY_FLAG_MUSIC_IN_GAME EQU #01
SCREEN_RUNTIME_SUMMARY_FLAG_HAS_HUD EQU #02
SCREEN_RUNTIME_SUMMARY_FLAG_HAS_EFFECTS EQU #04
SCREEN_RUNTIME_SUMMARY_FLAG_HAS_ANIM_TILES EQU #08
BOSS_PLACEMENT_ENTRY_SIZE EQU 11
BOSS_PLACEMENT_FLAG_ENABLED EQU #01

`;

    screenExports.forEach((screenExport) => {
      const {
        screenName,
        index,
        hasEffectsLayoutData,
        effectZoneCount,
        bossPlacementCount,
        animatedGroupCount,
        entityCount,
        spritePatternSlots,
        musicInGame,
        summaryFlags,
      } = screenExport;
      code += `SCREEN_${screenName}_${index}_ID EQU ${index}
SCREEN_${screenName}_${index}_LAYOUT_BANK EQU ${screenExport.backgroundBlockMap ? 0 : buildMapperBankEqu(`SCREEN_${screenName}_${index}_LAYOUT`, mapperWindow)}
SCREEN_${screenName}_${index}_BEHAVIOR_SOURCE EQU ${screenExport.behaviorSource === 'backgroundChars' ? 1 : 0}
BEHAVIOR_${screenName}_${index}_DATA_BANK EQU ${screenExport.behaviorSource === 'collisionLayer' ? buildMapperBankEqu(`BEHAVIOR_${screenName}_${index}_DATA`, mapperWindow) : 0}
SCREEN_${screenName}_${index}_CHAR_BEHAVIOR_TABLE_BANK EQU ${screenExport.behaviorSource === 'backgroundChars' ? buildMapperBankEqu(`SCREEN_${screenName}_${index}_CHAR_BEHAVIOR_TABLE`, mapperWindow) : 0}
SCREEN_${screenName}_${index}_CHAR_BEHAVIOR_TABLE_SIZE EQU ${screenExport.behaviorSource === 'backgroundChars' ? 256 : 0}
SCREEN_${screenName}_${index}_INTERACTION_TYPE_MAP_BANK EQU ${buildMapperBankEqu(`SCREEN_${screenName}_${index}_INTERACTION_TYPE_MAP`, mapperWindow)}
SCREEN_${screenName}_${index}_INTERACTION_VALUE_MAP_BANK EQU ${buildMapperBankEqu(`SCREEN_${screenName}_${index}_INTERACTION_VALUE_MAP`, mapperWindow)}
SCREEN_${screenName}_${index}_INTERACTION_TARGET_MAP_BANK EQU ${buildMapperBankEqu(`SCREEN_${screenName}_${index}_INTERACTION_TARGET_MAP`, mapperWindow)}
SCREEN_${screenName}_${index}_EFFECTS_LAYOUT_BANK EQU ${buildMapperBankEqu(`SCREEN_${screenName}_${index}_EFFECTS_LAYOUT`, mapperWindow)}
SCREEN_${screenName}_${index}_EFFECTS_LAYOUT_PRESENT EQU ${hasEffectsLayoutData ? 1 : 0}
SCREEN_${screenName}_${index}_EFFECTS_LAYOUT_SIZE EQU ${SCREEN_WIDTH * SCREEN_HEIGHT}
SCREEN_${screenName}_${index}_EFFECT_ZONE_TABLE_BANK EQU ${buildMapperBankEqu(`SCREEN_${screenName}_${index}_EFFECT_ZONE_TABLE`, mapperWindow)}
SCREEN_${screenName}_${index}_EFFECT_ZONE_COUNT EQU ${effectZoneCount}
SCREEN_${screenName}_${index}_EFFECT_ZONE_TABLE_SIZE EQU ${effectZoneCount * 8}
SCREEN_${screenName}_${index}_BOSS_TABLE_BANK EQU ${buildMapperBankEqu(`SCREEN_${screenName}_${index}_BOSS_TABLE`, mapperWindow)}
SCREEN_${screenName}_${index}_BOSS_COUNT EQU ${bossPlacementCount}
SCREEN_${screenName}_${index}_BOSS_TABLE_SIZE EQU ${bossPlacementCount * 11}
SCREEN_${screenName}_${index}_BLOCK_LAYOUT_PRESENT EQU ${screenExport.backgroundBlockMap ? 1 : 0}
SCREEN_${screenName}_${index}_BLOCK_LAYOUT_MODE EQU ${screenExport.backgroundBlockMap?.blockWidth ?? 0}
SCREEN_${screenName}_${index}_BLOCK_CATALOG_BANK EQU ${screenExport.backgroundBlockMap ? buildMapperBankEqu(`SCREEN_${screenName}_${index}_BLOCK_CATALOG`, mapperWindow) : 0}
SCREEN_${screenName}_${index}_BLOCK_CATALOG_COUNT EQU ${screenExport.backgroundBlockMap?.catalog.length ?? 0}
SCREEN_${screenName}_${index}_BLOCK_CATALOG_SIZE EQU ${screenExport.backgroundBlockMap?.catalogLengthBytes ?? 0}
SCREEN_${screenName}_${index}_BLOCK_MAP_BANK EQU ${screenExport.backgroundBlockMap ? buildMapperBankEqu(`SCREEN_${screenName}_${index}_BLOCK_MAP`, mapperWindow) : 0}
SCREEN_${screenName}_${index}_BLOCK_MAP_WIDTH EQU ${screenExport.backgroundBlockMap?.mapWidth ?? 0}
SCREEN_${screenName}_${index}_BLOCK_MAP_HEIGHT EQU ${screenExport.backgroundBlockMap?.mapHeight ?? 0}
SCREEN_${screenName}_${index}_BLOCK_MAP_SIZE EQU ${screenExport.backgroundBlockMap?.mapLengthBytes ?? 0}
SCREEN_${screenName}_${index}_BLOCK_TOTAL_SIZE EQU ${screenExport.backgroundBlockMap?.optimizedLengthBytes ?? 0}
SCREEN_${screenName}_${index}_ANIM_GROUP_COUNT EQU ${animatedGroupCount}
SCREEN_${screenName}_${index}_ENTITY_COUNT EQU ${entityCount}
SCREEN_${screenName}_${index}_SPRITE_PATTERN_SLOTS EQU ${spritePatternSlots}
SCREEN_${screenName}_${index}_MUSIC_IN_GAME EQU ${musicInGame}
SCREEN_${screenName}_${index}_SUMMARY_FLAGS EQU #${summaryFlags.toString(16).toUpperCase().padStart(2, '0')}
`;
    });

    code += `
; ==================================================================
; SCREEN RUNTIME SUMMARY TABLE
; anim_groups: animated tile groups visible in this screen
; entity_count: entity instances assigned to this screen
; sprite_pattern_slots: SPRPAT slots needed by this screen's entity runtime set
; flags bit0=music_in_game, bit1=has_hud, bit2=has_effects, bit3=has_anim_tiles
; ==================================================================

screen_runtime_summary_table:
`;
    screenExports.forEach((screenExport) => {
      const {
        screen,
        index,
        animatedGroupCount,
        entityCount,
        spritePatternSlots,
        summaryFlags,
      } = screenExport;
      code += `    db ${animatedGroupCount}, ${entityCount}, ${spritePatternSlots}, #${summaryFlags
        .toString(16)
        .toUpperCase()
        .padStart(2, '0')}    ; Screen ${index}: ${screen.name}
`;
    });

    code += `
; ==================================================================
; SCREEN MAP DATA
; ==================================================================

`;

    screenExports.forEach((screenExport) => {
      const { screen, index, screenName, screenNameWithIndex, backgroundLayoutBytes, backgroundBlockMap, effectsLayoutBytes, hasEffectsLayoutData, effectZoneBytes, effectZoneCount } = screenExport;
      if (screen.layers && screen.layers.background) {
        if (dataInBank4) {
          // Data tables are emitted in bank4 section; skip here
          if (backgroundBlockMap) {
            code += `; [SCREEN_${screenName}_${index}_BLOCK_LAYOUT replaces raw SCREEN_${screenName}_${index}_LAYOUT in bank4 section]\n`;
            code += `; [SCREEN_${screenName}_${index}_BLOCK_CATALOG emitted in bank4 section]\n`;
            code += `; [SCREEN_${screenName}_${index}_BLOCK_MAP emitted in bank4 section]\n`;
          } else {
            code += `; [SCREEN_${screenName}_${index}_LAYOUT emitted in bank4 section]\n`;
          }
          code += `; [SCREEN_${screenName}_${index}_EFFECTS_LAYOUT emitted in bank4 section]\n`;
          code += `; [SCREEN_${screenName}_${index}_EFFECT_ZONE_TABLE emitted in bank4 section]\n`;
          code += `; [SCREEN_${screenName}_${index}_BOSS_TABLE emitted in bank4 section]\n`;
          code += `; [SCREEN_${screenName}_${index}_INTERACTION_TYPE_MAP emitted in bank4 section]\n`;
          code += `; [SCREEN_${screenName}_${index}_INTERACTION_VALUE_MAP emitted in bank4 section]\n`;
          code += `; [SCREEN_${screenName}_${index}_INTERACTION_TARGET_MAP emitted in bank4 section]\n`;
          code += screenExport.behaviorSource === 'backgroundChars'
            ? `; [SCREEN_${screenName}_${index}_CHAR_BEHAVIOR_TABLE emitted in bank4 section]\n\n`
            : `; [BEHAVIOR_${screenName}_${index}_DATA emitted in bank4 section]\n\n`;
        } else { // not dataInBank4 - emit all data inline
        if (backgroundBlockMap) {
          code += generateBackgroundBlockDataSection(screenName, index, screen.name, backgroundBlockMap);
        } else {
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
        }
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
        code += generateBossPlacementTable(screenName, index, screen, bossLabelById, bossById);
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
        if (screenExport.behaviorSource === 'backgroundChars' && screenExport.charBehaviorTable) {
          code += `\n${generateRawByteBlock(
            `SCREEN_${screen.name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${analysis.screenMaps.indexOf(screen)}_CHAR_BEHAVIOR_TABLE`,
            screenExport.charBehaviorTable,
            [`${screen.name} - background char -> behavior lookup table`]
          )}`;
        } else if (screenExport.behaviorMapData) {
          const behaviorASM = generateBehaviorMapASMCode(
            screenNameWithIndex,
            SCREEN_WIDTH,
            SCREEN_HEIGHT,
            screenExport.behaviorMapData,
            'hex'
          );

          code += `\n${behaviorASM}`;
        }
        code += `\n${generateRawByteBlock(
          `SCREEN_${screen.name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${analysis.screenMaps.indexOf(screen)}_INTERACTION_TYPE_MAP`,
          screenExport.interactionTypeMap,
          [`${screen.name} - per-cell interaction type map`]
        )}`;
        code += `\n${generateRawByteBlock(
          `SCREEN_${screen.name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${analysis.screenMaps.indexOf(screen)}_INTERACTION_VALUE_MAP`,
          screenExport.interactionValueMap,
          [`${screen.name} - per-cell interaction value map`]
        )}`;
        code += `\n${generateRawByteBlock(
          `SCREEN_${screen.name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${analysis.screenMaps.indexOf(screen)}_INTERACTION_TARGET_MAP`,
          screenExport.interactionTargetMap,
          [`${screen.name} - per-cell interaction target map`]
        )}`;
        } // end else (not dataInBank4)
      } else {
        // Generate placeholder screen data
        const screenIndex = analysis.screenMaps.indexOf(screen);
        const screenName = screen.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
        code += `SCREEN_${screenName}_${screenIndex}_LAYOUT:
    ; Screen data for ${screen.name}
    ; TODO: Add actual screen map data
    db 0, 0, 0, 0, 0, 0, 0, 0

`;
        if (resolveScreenBehaviorSource(screen) === 'backgroundChars') {
          code += generateRawByteBlock(`SCREEN_${screenName}_${screenIndex}_CHAR_BEHAVIOR_TABLE`, Array.from({ length: 256 }, () => 0));
          code += `\n`;
        } else {
          code += `BEHAVIOR_${screenName}_${screenIndex}_DATA:\n    db 0\n\n`;
        }
        code += generateRawByteBlock(`SCREEN_${screenName}_${screenIndex}_INTERACTION_TYPE_MAP`, Array.from({ length: SCREEN_WIDTH * SCREEN_HEIGHT }, () => 0));
        code += `\n`;
        code += generateRawByteBlock(`SCREEN_${screenName}_${screenIndex}_INTERACTION_VALUE_MAP`, Array.from({ length: SCREEN_WIDTH * SCREEN_HEIGHT }, () => 0));
        code += `\n`;
        code += generateRawByteBlock(`SCREEN_${screenName}_${screenIndex}_INTERACTION_TARGET_MAP`, Array.from({ length: SCREEN_WIDTH * SCREEN_HEIGHT }, () => 0));
        code += `\n`;
        code += generateBossPlacementTable(screenName, screenIndex, screen, bossLabelById, bossById);
        code += `\n`;
      }

      code += `\n`;
    });

    code += generatePresentationScreenSection(analysis, hasSpriteAssets, romMode, targetFormat);

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

${buildRegisterContractComment({
    purpose: 'Expand a block-optimized screen background into the linear 32x24 runtime layout buffer.',
    inputs: ['A = block width/mode (2 or 4)', 'HL = block catalog source pointer', 'DE = block index map source pointer'],
    outputs: ['runtime_background_layout rebuilt as a linear 32x24 byte map'],
    clobbers: ['AF', 'BC', 'DE', 'HL'],
    preserved: ['IX', 'IY'],
    notes: ['Uses screen_block_catalog_ptr and screen_block_map_ptr as scratch pointers.', 'Callers should copy runtime_background_layout to runtime_screen_layout after expansion.']
  })}expand_screen_block_layout_to_background:
    ld (screen_block_catalog_ptr), hl
    ld (screen_block_map_ptr), de
    cp 4
    jp z, expand_screen_block_layout_4x4
    cp 2
    jp z, expand_screen_block_layout_2x2
    ret

expand_screen_block_layout_2x2:
    ld de, runtime_background_layout
    ld c, 12
.expand2x2_row_loop:
    ld b, 16
.expand2x2_col_loop:
    push bc
    push de
    ld hl, (screen_block_map_ptr)
    ld a, (hl)
    inc hl
    ld (screen_block_map_ptr), hl
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    ld bc, (screen_block_catalog_ptr)
    add hl, bc
    pop de
    push de
    ld a, (hl)
    ld (de), a
    inc hl
    inc de
    ld a, (hl)
    ld (de), a
    pop de
    push de
    inc hl
    push bc
    ld bc, 32
    ex de, hl
    add hl, bc
    ex de, hl
    pop bc
    ld a, (hl)
    ld (de), a
    inc hl
    inc de
    ld a, (hl)
    ld (de), a
    pop de
    inc de
    inc de
    pop bc
    dec b
    jp nz, .expand2x2_col_loop
    push bc
    ld bc, 32
    ex de, hl
    add hl, bc
    ex de, hl
    pop bc
    dec c
    jp nz, .expand2x2_row_loop
    ret

expand_screen_block_layout_4x4:
    push ix
    push iy
    ld de, runtime_background_layout
    ld c, 6
.expand4x4_row_loop:
    ld b, 8
.expand4x4_col_loop:
    push bc
    ld hl, (screen_block_map_ptr)
    ld a, (hl)
    inc hl
    ld (screen_block_map_ptr), hl
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld bc, (screen_block_catalog_ptr)
    add hl, bc
    push hl
    pop ix                    ; IX = source block base (16 bytes)
    push de
    pop iy                    ; IY = destination block base in runtime_background_layout

    ; Row 0: copy catalog bytes +0..+3 to destination +0..+3
    push bc
    push ix
    pop hl
    push iy
    pop de
    ld bc, 4
    ldir
    pop bc

    ; Row 1: copy catalog bytes +4..+7 to destination +32..+35
    push bc
    push ix
    pop hl
    ld bc, 4
    add hl, bc
    push hl
    push iy
    pop hl
    ld bc, 32
    add hl, bc
    ex de, hl
    pop hl
    ld bc, 4
    ldir
    pop bc

    ; Row 2: copy catalog bytes +8..+11 to destination +64..+67
    push bc
    push ix
    pop hl
    ld bc, 8
    add hl, bc
    push hl
    push iy
    pop hl
    ld bc, 64
    add hl, bc
    ex de, hl
    pop hl
    ld bc, 4
    ldir
    pop bc

    ; Row 3: copy catalog bytes +12..+15 to destination +96..+99
    push bc
    push ix
    pop hl
    ld bc, 12
    add hl, bc
    push hl
    push iy
    pop hl
    ld bc, 96
    add hl, bc
    ex de, hl
    pop hl
    ld bc, 4
    ldir
    pop bc

    ; Advance destination base by one 4-char block horizontally
    push iy
    pop hl
    ld bc, 4
    add hl, bc
    ex de, hl
    pop bc
    dec b
    jp nz, .expand4x4_col_loop
    push bc
    ld bc, 96
    ex de, hl
    add hl, bc
    ex de, hl
    pop bc
    dec c
    jp nz, .expand4x4_row_loop
    pop iy
    pop ix
    ret

${buildRegisterContractComment({
    purpose: 'Rebuild runtime_behavior_map from the current runtime_screen_layout using the per-screen char behavior table.',
    inputs: ['HL = source screen layout pointer (normally runtime_screen_layout)'],
    outputs: ['runtime_behavior_map rebuilt in RAM'],
    clobbers: ['AF', 'BC', 'DE', 'HL'],
    preserved: ['IX', 'IY'],
    notes: ['Uses screen_block_catalog_ptr and screen_block_map_ptr as generic scratch pointers during the rebuild.']
  })}build_runtime_behavior_map_from_screen_layout:
    ld (screen_block_map_ptr), hl
    ld hl, runtime_behavior_map
    ld (screen_block_catalog_ptr), hl
    ld bc, RUNTIME_SCREEN_MAP_SIZE
.build_behavior_loop:
    ld a, b
    or c
    ret z
    ld hl, (screen_block_map_ptr)
    ld a, (hl)
    inc hl
    ld (screen_block_map_ptr), hl
    ld l, a
    ld h, 0
    ld de, runtime_char_behavior_table
    add hl, de
    ld a, (hl)
    ld hl, (screen_block_catalog_ptr)
    ld (hl), a
    inc hl
    ld (screen_block_catalog_ptr), hl
    dec bc
    jr .build_behavior_loop

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
      const screenExport = screenExports[index];
      const animatedGroupCount = screenExport?.animatedGroupCount || 0;
      const entityCount = screenExport?.entityCount || 0;
      const spritePatternSlots = screenExport?.spritePatternSlots || 1;
      const screenEngineValue = getScreenEngineValue(screen);
      const tileBankReadyLabel = `.load_${screenName.toLowerCase()}${screenIdSuffix.toLowerCase()}_tilebank_ready`;
      const tileBankLoadCode = screen.tileBankAssetId
        ? `    ld a, (current_screen2_tilebank_id)
    cp ${getScreen2TileBankIdLabel(screen.tileBankAssetId)}
    jr z, ${tileBankReadyLabel}
    call ${getScreen2TileBankPatternLoaderLabel(screen.tileBankAssetId)}
    call ${getScreen2TileBankColorLoaderLabel(screen.tileBankAssetId)}
    ld a, ${getScreen2TileBankIdLabel(screen.tileBankAssetId)}
    ld (current_screen2_tilebank_id), a
    xor a
    ld (vram_cache_font_ready), a
    call init_font_system
${tileBankReadyLabel}:
`
        : '';

      const rawActiveAreaX = screen.activeAreaX ?? 0;
      const rawActiveAreaY = screen.activeAreaY ?? 0;
      const rawActiveAreaWidth = screen.activeAreaWidth ?? screen.width ?? 32;
      const rawActiveAreaHeight = screen.activeAreaHeight ?? screen.height ?? 24;

      // Clamp Active Area to valid Screen 2 bounds (32x24)
      const activeAreaX = Math.max(0, Math.min(31, rawActiveAreaX));
      const activeAreaY = Math.max(0, Math.min(23, rawActiveAreaY));
      const activeAreaWidth = Math.max(0, Math.min(32 - activeAreaX, rawActiveAreaWidth));
      const activeAreaHeight = Math.max(0, Math.min(24 - activeAreaY, rawActiveAreaHeight));

      const importedHudFrameCells = (hasUsableImportedHudFrameSnapshot(screen)
        ? (screen.hudConfiguration?.importedFrame?.cells || [])
        : [])
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
          charCode: (() => {
            const runtimeCharCode = resolveRuntimeScreen2TileBankCharCode(
              analysis,
              screen.hudConfiguration?.importedFrame?.sourceTileBankAssetId,
              cell.tileId,
              cell.y | 0,
              cell.subTileX | 0,
              cell.subTileY | 0
            );
            if (runtimeCharCode > 0) {
              return runtimeCharCode & 0xFF;
            }
            return (cell.charCode & 0xFF);
          })()
        }));

      const hasHudFrameArea = activeAreaX > 0 || activeAreaY > 0 || activeAreaWidth < 32 || activeAreaHeight < 24;
      // Only preserve the non-active area when a HUD frame snapshot exists to redraw it.
      // A reduced active area by itself is also used for block-mode authoring, and those
      // screens still need the full authored background loaded into VRAM.
      const shouldPreserveHudArea = importedHudFrameCells.length > 0 && hasHudFrameArea && activeAreaWidth > 0 && activeAreaHeight > 0;

      const activeAreaOffset = (activeAreaY * 32) + activeAreaX;
      const activeAreaBytes = activeAreaWidth * activeAreaHeight;
      const runtimeEffectZoneCount = Math.min((screen.effectZones || []).length, MAX_RUNTIME_EFFECT_ZONES);
      const hasBackgroundBlockMap = !!screenExport?.backgroundBlockMap;
      const behaviorSource = screenExport?.behaviorSource ?? 'collisionLayer';
      const layoutResourceId = buildResourceId(`SCREEN_${screenName}_${index}_LAYOUT`);
      const blockCatalogResourceId = buildResourceId(`SCREEN_${screenName}_${index}_BLOCK_CATALOG`);
      const blockMapResourceId = buildResourceId(`SCREEN_${screenName}_${index}_BLOCK_MAP`);
      const effectsLayoutResourceId = buildResourceId(`SCREEN_${screenName}_${index}_EFFECTS_LAYOUT`);
      const behaviorResourceId = buildResourceId(`BEHAVIOR_${screenName}_${index}_DATA`);
      const charBehaviorTableResourceId = buildResourceId(`SCREEN_${screenName}_${index}_CHAR_BEHAVIOR_TABLE`);
      const interactionTypeMapResourceId = buildResourceId(`SCREEN_${screenName}_${index}_INTERACTION_TYPE_MAP`);
      const interactionValueMapResourceId = buildResourceId(`SCREEN_${screenName}_${index}_INTERACTION_VALUE_MAP`);
      const interactionTargetMapResourceId = buildResourceId(`SCREEN_${screenName}_${index}_INTERACTION_TARGET_MAP`);
      const effectZoneTableResourceId = buildResourceId(`SCREEN_${screenName}_${index}_EFFECT_ZONE_TABLE`);
      const bossTablePointer = mapperAddr(`SCREEN_${screenName}_${index}_BOSS_TABLE`);
      const bossDoneLabel = `load_${screenName.toLowerCase()}${screenIdSuffix.toLowerCase()}_boss_done`;
      const bossRuntimeLoadCode = usesMapper ? `    ld a, SCREEN_${screenName}_${index}_BOSS_COUNT
    ld (current_screen_boss_count), a
    or a
    jp z, ${bossDoneLabel}
    call mapper_push_${mapperWindow.dataWindowPage}
    ld a, SCREEN_${screenName}_${index}_BOSS_TABLE_BANK
    call mapper_set_bank_${mapperWindow.dataWindowPage}
    ld hl, ${bossTablePointer}
    ld de, current_screen_boss_entry
    ld bc, BOSS_PLACEMENT_ENTRY_SIZE
    ldir
    call mapper_pop_${mapperWindow.dataWindowPage}
    ld hl, current_screen_boss_entry
    ld (current_screen_boss_table), hl
    ld a, #FF
    ld (current_screen_boss_table_bank), a
${bossDoneLabel}:
` : `    ld a, SCREEN_${screenName}_${index}_BOSS_COUNT
    ld (current_screen_boss_count), a
    or a
    jp z, ${bossDoneLabel}
    ld hl, ${bossTablePointer}
    ld de, current_screen_boss_entry
    ld bc, BOSS_PLACEMENT_ENTRY_SIZE
    ldir
    ld hl, current_screen_boss_entry
    ld (current_screen_boss_table), hl
    ld a, #FF
    ld (current_screen_boss_table_bank), a
${bossDoneLabel}:
`;

      const hasImportedHudFrame = importedHudFrameCells.length > 0;
      const importedHudFrameLabelBase = `hud_imported_frame_${screenName.toLowerCase()}${screenIdSuffix.toLowerCase()}`;
      const zoneDoneLabel = `.load_${screenName.toLowerCase()}${screenIdSuffix.toLowerCase()}_zones_done`;
      const backgroundRuntimeLoadCode = hasBackgroundBlockMap
        ? useResourceManager ? `    ; Load optimized background block data into RAM scratch buffers and expand it
    ld a, ${blockCatalogResourceId}
    ld de, runtime_effects_layout
    call resource_load_to_ram_by_id
    ld a, ${blockMapResourceId}
    ld de, runtime_screen_layout
    call resource_load_to_ram_by_id
    ld hl, runtime_effects_layout
    ld de, runtime_screen_layout
    ld a, SCREEN_${screenName}_${index}_BLOCK_LAYOUT_MODE
    call expand_screen_block_layout_to_background
    ld hl, runtime_background_layout
    ld de, runtime_screen_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
`
        : usesMapper ? `    ; Load optimized background block data into RAM scratch buffers and expand it
    call mapper_push_${mapperWindow.dataWindowPage}
    ld a, SCREEN_${screenName}_${index}_BLOCK_CATALOG_BANK
    call mapper_set_bank_${mapperWindow.dataWindowPage}
    ld hl, ${mapperAddr(`SCREEN_${screenName}_${index}_BLOCK_CATALOG`)}
    ld de, runtime_effects_layout
    ld bc, SCREEN_${screenName}_${index}_BLOCK_CATALOG_SIZE
    ldir
    call mapper_pop_${mapperWindow.dataWindowPage}

    call mapper_push_${mapperWindow.dataWindowPage}
    ld a, SCREEN_${screenName}_${index}_BLOCK_MAP_BANK
    call mapper_set_bank_${mapperWindow.dataWindowPage}
    ld hl, ${mapperAddr(`SCREEN_${screenName}_${index}_BLOCK_MAP`)}
    ld de, runtime_screen_layout
    ld bc, SCREEN_${screenName}_${index}_BLOCK_MAP_SIZE
    ldir
    call mapper_pop_${mapperWindow.dataWindowPage}

    ld hl, runtime_effects_layout
    ld de, runtime_screen_layout
    ld a, SCREEN_${screenName}_${index}_BLOCK_LAYOUT_MODE
    call expand_screen_block_layout_to_background
    ld hl, runtime_background_layout
    ld de, runtime_screen_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
`
        : `    ; Load optimized background block data into RAM scratch buffers and expand it
    ld hl, SCREEN_${screenName}_${index}_BLOCK_CATALOG
    ld de, runtime_effects_layout
    ld bc, SCREEN_${screenName}_${index}_BLOCK_CATALOG_SIZE
    ldir
    ld hl, SCREEN_${screenName}_${index}_BLOCK_MAP
    ld de, runtime_screen_layout
    ld bc, SCREEN_${screenName}_${index}_BLOCK_MAP_SIZE
    ldir
    ld hl, runtime_effects_layout
    ld de, runtime_screen_layout
    ld a, SCREEN_${screenName}_${index}_BLOCK_LAYOUT_MODE
    call expand_screen_block_layout_to_background
    ld hl, runtime_background_layout
    ld de, runtime_screen_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
`
        : useResourceManager ? `    ; Rebuild mutable runtime screen background from RAM cache
    ld a, ${layoutResourceId}
    call resource_load_screen_layout_cached
`
        : usesMapper ? `    ; Build mutable runtime screen background maps in RAM
    call mapper_push_${mapperWindow.dataWindowPage}
    ld a, SCREEN_${screenName}_${index}_LAYOUT_BANK
    call mapper_set_bank_${mapperWindow.dataWindowPage}
    ld hl, ${mapperAddr(`SCREEN_${screenName}_${index}_LAYOUT`)}
    ld de, runtime_background_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    ld hl, ${mapperAddr(`SCREEN_${screenName}_${index}_LAYOUT`)}
    ld de, runtime_screen_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_${mapperWindow.dataWindowPage}
`
        : `    ; Build mutable runtime screen background maps in RAM
    ld hl, ${mapperAddr(`SCREEN_${screenName}_${index}_LAYOUT`)}
    ld de, runtime_background_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    ld hl, SCREEN_${screenName}_${index}_LAYOUT
    ld de, runtime_screen_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
`;
      const effectsBehaviorRuntimeLoadCode = behaviorSource === 'backgroundChars'
        ? useResourceManager ? `    ld a, ${effectsLayoutResourceId}
    call resource_load_effects_layout_cached
    ld a, ${charBehaviorTableResourceId}
    ld de, runtime_char_behavior_table
    call resource_load_to_ram_by_id
    ld a, ${interactionTypeMapResourceId}
    ld de, runtime_interaction_type_map
    call resource_load_to_ram_by_id
    ld a, ${interactionValueMapResourceId}
    ld de, runtime_interaction_value_map
    call resource_load_to_ram_by_id
    ld a, ${interactionTargetMapResourceId}
    ld de, runtime_interaction_target_map
    call resource_load_to_ram_by_id
    ld hl, runtime_screen_layout
    call build_runtime_behavior_map_from_screen_layout
    ld a, ${runtimeEffectZoneCount}
    ld (current_effect_zone_count), a
    or a
    jr z, ${zoneDoneLabel}
    ld a, ${effectZoneTableResourceId}
    call resource_load_effect_zone_table_cached
${zoneDoneLabel}:
`
        : usesMapper ? `    call mapper_push_${mapperWindow.dataWindowPage}
    ld a, SCREEN_${screenName}_${index}_EFFECTS_LAYOUT_BANK
    call mapper_set_bank_${mapperWindow.dataWindowPage}
    ld hl, ${mapperAddr(`SCREEN_${screenName}_${index}_EFFECTS_LAYOUT`)}
    ld de, runtime_effects_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_${mapperWindow.dataWindowPage}

    call mapper_push_${mapperWindow.dataWindowPage}
    ld a, SCREEN_${screenName}_${index}_CHAR_BEHAVIOR_TABLE_BANK
    call mapper_set_bank_${mapperWindow.dataWindowPage}
    ld hl, ${mapperAddr(`SCREEN_${screenName}_${index}_CHAR_BEHAVIOR_TABLE`)}
    ld de, runtime_char_behavior_table
    ld bc, SCREEN_${screenName}_${index}_CHAR_BEHAVIOR_TABLE_SIZE
    ldir
    call mapper_pop_${mapperWindow.dataWindowPage}

    call mapper_push_${mapperWindow.dataWindowPage}
    ld a, SCREEN_${screenName}_${index}_INTERACTION_TYPE_MAP_BANK
    call mapper_set_bank_${mapperWindow.dataWindowPage}
    ld hl, ${mapperAddr(`SCREEN_${screenName}_${index}_INTERACTION_TYPE_MAP`)}
    ld de, runtime_interaction_type_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_${mapperWindow.dataWindowPage}

    call mapper_push_${mapperWindow.dataWindowPage}
    ld a, SCREEN_${screenName}_${index}_INTERACTION_VALUE_MAP_BANK
    call mapper_set_bank_${mapperWindow.dataWindowPage}
    ld hl, ${mapperAddr(`SCREEN_${screenName}_${index}_INTERACTION_VALUE_MAP`)}
    ld de, runtime_interaction_value_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_${mapperWindow.dataWindowPage}

    call mapper_push_${mapperWindow.dataWindowPage}
    ld a, SCREEN_${screenName}_${index}_INTERACTION_TARGET_MAP_BANK
    call mapper_set_bank_${mapperWindow.dataWindowPage}
    ld hl, ${mapperAddr(`SCREEN_${screenName}_${index}_INTERACTION_TARGET_MAP`)}
    ld de, runtime_interaction_target_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_${mapperWindow.dataWindowPage}

    ld hl, runtime_screen_layout
    call build_runtime_behavior_map_from_screen_layout

    ld a, ${runtimeEffectZoneCount}
    ld (current_effect_zone_count), a
    or a
    jr z, ${zoneDoneLabel}
    call mapper_push_${mapperWindow.dataWindowPage}
    ld a, SCREEN_${screenName}_${index}_EFFECT_ZONE_TABLE_BANK
    call mapper_set_bank_${mapperWindow.dataWindowPage}
    ld hl, ${mapperAddr(`SCREEN_${screenName}_${index}_EFFECT_ZONE_TABLE`)}
    ld de, runtime_effect_zone_table
    ld bc, ${runtimeEffectZoneCount * 8}
    ldir
    call mapper_pop_${mapperWindow.dataWindowPage}
${zoneDoneLabel}:
`
        : `    ld hl, SCREEN_${screenName}_${index}_EFFECTS_LAYOUT
    ld de, runtime_effects_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir

    ld hl, SCREEN_${screenName}_${index}_CHAR_BEHAVIOR_TABLE
    ld de, runtime_char_behavior_table
    ld bc, SCREEN_${screenName}_${index}_CHAR_BEHAVIOR_TABLE_SIZE
    ldir

    ld hl, SCREEN_${screenName}_${index}_INTERACTION_TYPE_MAP
    ld de, runtime_interaction_type_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir

    ld hl, SCREEN_${screenName}_${index}_INTERACTION_VALUE_MAP
    ld de, runtime_interaction_value_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir

    ld hl, SCREEN_${screenName}_${index}_INTERACTION_TARGET_MAP
    ld de, runtime_interaction_target_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir

    ld hl, runtime_screen_layout
    call build_runtime_behavior_map_from_screen_layout

    ld a, ${runtimeEffectZoneCount}
    ld (current_effect_zone_count), a
    or a
    jr z, ${zoneDoneLabel}
    ld hl, SCREEN_${screenName}_${index}_EFFECT_ZONE_TABLE
    ld de, runtime_effect_zone_table
    ld bc, ${runtimeEffectZoneCount * 8}
    ldir
${zoneDoneLabel}:
`
        : useResourceManager ? `    ld a, ${effectsLayoutResourceId}
    call resource_load_effects_layout_cached
    ld a, ${behaviorResourceId}
    call resource_load_behavior_map_cached
    ld a, ${interactionTypeMapResourceId}
    ld de, runtime_interaction_type_map
    call resource_load_to_ram_by_id
    ld a, ${interactionValueMapResourceId}
    ld de, runtime_interaction_value_map
    call resource_load_to_ram_by_id
    ld a, ${interactionTargetMapResourceId}
    ld de, runtime_interaction_target_map
    call resource_load_to_ram_by_id
    ld a, ${runtimeEffectZoneCount}
    ld (current_effect_zone_count), a
    or a
    jr z, ${zoneDoneLabel}
    ld a, ${effectZoneTableResourceId}
    call resource_load_effect_zone_table_cached
${zoneDoneLabel}:
`
        : usesMapper ? `    call mapper_push_${mapperWindow.dataWindowPage}
    ld a, SCREEN_${screenName}_${index}_EFFECTS_LAYOUT_BANK
    call mapper_set_bank_${mapperWindow.dataWindowPage}
    ld hl, ${mapperAddr(`SCREEN_${screenName}_${index}_EFFECTS_LAYOUT`)}
    ld de, runtime_effects_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_${mapperWindow.dataWindowPage}

    call mapper_push_${mapperWindow.dataWindowPage}
    ld a, BEHAVIOR_${screenName}_${index}_DATA_BANK
    call mapper_set_bank_${mapperWindow.dataWindowPage}
    ld hl, ${mapperAddr(`BEHAVIOR_${screenName}_${index}_DATA`)}
    ld de, runtime_behavior_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_${mapperWindow.dataWindowPage}

    call mapper_push_${mapperWindow.dataWindowPage}
    ld a, SCREEN_${screenName}_${index}_INTERACTION_TYPE_MAP_BANK
    call mapper_set_bank_${mapperWindow.dataWindowPage}
    ld hl, ${mapperAddr(`SCREEN_${screenName}_${index}_INTERACTION_TYPE_MAP`)}
    ld de, runtime_interaction_type_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_${mapperWindow.dataWindowPage}

    call mapper_push_${mapperWindow.dataWindowPage}
    ld a, SCREEN_${screenName}_${index}_INTERACTION_VALUE_MAP_BANK
    call mapper_set_bank_${mapperWindow.dataWindowPage}
    ld hl, ${mapperAddr(`SCREEN_${screenName}_${index}_INTERACTION_VALUE_MAP`)}
    ld de, runtime_interaction_value_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_${mapperWindow.dataWindowPage}

    call mapper_push_${mapperWindow.dataWindowPage}
    ld a, SCREEN_${screenName}_${index}_INTERACTION_TARGET_MAP_BANK
    call mapper_set_bank_${mapperWindow.dataWindowPage}
    ld hl, ${mapperAddr(`SCREEN_${screenName}_${index}_INTERACTION_TARGET_MAP`)}
    ld de, runtime_interaction_target_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_${mapperWindow.dataWindowPage}

    ld a, ${runtimeEffectZoneCount}
    ld (current_effect_zone_count), a
    or a
    jr z, ${zoneDoneLabel}
    call mapper_push_${mapperWindow.dataWindowPage}
    ld a, SCREEN_${screenName}_${index}_EFFECT_ZONE_TABLE_BANK
    call mapper_set_bank_${mapperWindow.dataWindowPage}
    ld hl, ${mapperAddr(`SCREEN_${screenName}_${index}_EFFECT_ZONE_TABLE`)}
    ld de, runtime_effect_zone_table
    ld bc, ${runtimeEffectZoneCount * 8}
    ldir
    call mapper_pop_${mapperWindow.dataWindowPage}
${zoneDoneLabel}:
`
        : `    ld hl, SCREEN_${screenName}_${index}_EFFECTS_LAYOUT
    ld de, runtime_effects_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir

    ld hl, BEHAVIOR_${screenName}_${index}_DATA
    ld de, runtime_behavior_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir

    ld hl, SCREEN_${screenName}_${index}_INTERACTION_TYPE_MAP
    ld de, runtime_interaction_type_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir

    ld hl, SCREEN_${screenName}_${index}_INTERACTION_VALUE_MAP
    ld de, runtime_interaction_value_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir

    ld hl, SCREEN_${screenName}_${index}_INTERACTION_TARGET_MAP
    ld de, runtime_interaction_target_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir

    ld a, ${runtimeEffectZoneCount}
    ld (current_effect_zone_count), a
    or a
    jr z, ${zoneDoneLabel}
    ld hl, SCREEN_${screenName}_${index}_EFFECT_ZONE_TABLE
    ld de, runtime_effect_zone_table
    ld bc, ${runtimeEffectZoneCount * 8}
    ldir
${zoneDoneLabel}:
`;
      const vramCopyCode = shouldPreserveHudArea
        ? activeAreaWidth === 32 ? `    ; Preserve HUD / non-active VRAM area: overwrite only gameplay rows
    ld hl, runtime_screen_layout + ${activeAreaOffset}
    ld de, NAMETBL + ${activeAreaOffset}
    ld bc, ${activeAreaBytes}
    call FAST_LDIRVM
`
        : `    ; Preserve HUD / non-active VRAM area: overwrite only gameplay rectangle
    ld hl, runtime_screen_layout + ${activeAreaOffset}
    ld de, NAMETBL + ${activeAreaOffset}
    ld a, ${activeAreaHeight}
    ld c, ${activeAreaWidth}
    call copy_layout_rect_to_vram
`
        : `    ; Now load screen layout (full 32x24) from runtime RAM buffer
    ld hl, runtime_screen_layout
    ld de, NAMETBL
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    call FAST_LDIRVM           ; Fast VRAM write (direct port access)
`;

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
    ld a, ${screenEngineValue}
    ld (current_screen_engine), a
    ld a, #FF
    ld (autocontrol_screen_id), a
    ; Set VDP colors FIRST (before loading screen data)
    ld a, ${bgColor}           ; Background color
    ld b, ${borderColor}       ; Border color
    call set_screen_colors
    ; Initialize character 0 (empty cells) with background color
    ld a, ${bgColor}           ; Background color for char 0
    call init_char0_color
${tileBankLoadCode}`;
        if (hasSpriteAssets) {
          code += `    ; Clear hardware sprites on screen switch to avoid visual carry-over
    call clear_all_sprites
    call update_sprites_to_vram
`;
        }
        code += `${backgroundRuntimeLoadCode}${effectsBehaviorRuntimeLoadCode}${vramCopyCode}    ld a, ${animatedGroupCount}
    ld (current_screen_anim_group_count), a
    ld a, ${entityCount}
    ld (current_screen_entity_count), a
    ld a, ${spritePatternSlots}
    ld (current_screen_sprite_pattern_slots), a
    ld a, SCREEN_${screenName}_${index}_SUMMARY_FLAGS
    ld (current_screen_summary_flags), a
${bossRuntimeLoadCode}
${animatedGroupCount > 0 ? `    call update_animated_tiles_vram
` : ``}    call init_screen_boss_from_current_screen
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
    ld hl, entity_button_contact_active
    ld de, entity_button_contact_active + 1
    ld bc, 31
    ld (hl), a
    ldir
    ret

`;
      } else {
        code += `load_screen_${screenName.toLowerCase()}${screenIdSuffix.toLowerCase()}:
    ; Load ${screen.name} screen (fast direct port access)
    ld a, ${screenEngineValue}
    ld (current_screen_engine), a
    ld a, #FF
    ld (autocontrol_screen_id), a
    ; Set VDP colors FIRST (before loading screen data)
    ld a, ${bgColor}           ; Background color
    ld b, ${borderColor}       ; Border color
    call set_screen_colors
    ; Initialize character 0 (empty cells) with background color
    ld a, ${bgColor}           ; Background color for char 0
    call init_char0_color
${tileBankLoadCode}`;
        if (hasSpriteAssets) {
          code += `    ; Clear hardware sprites on screen switch to avoid visual carry-over
    call clear_all_sprites
    call update_sprites_to_vram
`;
        }
        code += `${backgroundRuntimeLoadCode}${effectsBehaviorRuntimeLoadCode}${vramCopyCode}    ld a, ${animatedGroupCount}
    ld (current_screen_anim_group_count), a
    ld a, ${entityCount}
    ld (current_screen_entity_count), a
    ld a, ${spritePatternSlots}
    ld (current_screen_sprite_pattern_slots), a
    ld a, SCREEN_${screenName}_${index}_SUMMARY_FLAGS
    ld (current_screen_summary_flags), a
${bossRuntimeLoadCode}
${animatedGroupCount > 0 ? `    call update_animated_tiles_vram
` : ``}    call init_screen_boss_from_current_screen
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
    ld hl, entity_button_contact_active
    ld de, entity_button_contact_active + 1
    ld bc, 31
    ld (hl), a
    ldir
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

/**
 * Returns only the screen data tables for bank4 placement (megarom mode).
 * Includes SCREEN_X_LAYOUT, SCREEN_X_EFFECTS_LAYOUT, SCREEN_X_EFFECT_ZONE_TABLE,
 * and BEHAVIOR_X_DATA for all screens.
 * No load functions, no EQU constants (those stay in the code section).
 */
export function getScreensBank4Data(analysis: ProjectAnalysis, romMode: string = 'simple32k'): string {
  if (!analysis.screenMaps || analysis.screenMaps.length === 0) {
    return '; [screens bank4 data: no screens]\n';
  }

  const animatedTileGroups = collectAnimatedTileGroupSummaries(analysis);
  const screenEntityCounts = buildScreenEntityCountMap(analysis);
  const screenSpriteUsage = new Map(
    buildScreenSpritePatternUsageSummaries(analysis).map((summary) => [summary.screenId, summary.totalSlotsRequired])
  );
  const screenWorldMembership = buildScreenWorldMembershipMap(analysis);
  const interactionTargetIdMap = buildInteractionTargetIdMap(analysis);
  const worldMusicFlags = buildWorldMusicFlagMap(analysis);
  const fallbackGameplayMusic = hasAnyGameplayMusicConfigured(analysis) ? 1 : 0;
  const bossLabelById = buildBossLabelMap(analysis);
  const bossById = buildBossByIdMap(analysis);

  const screenExports = analysis.screenMaps.map((screen, index) => {
    const screenName = screen.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const screenNameWithIndex = `${screen.name}_${index}`;
    const tileBankDefinitions = resolveTileBankDefinitions(screen, analysis);
    const backgroundLayoutBytes = buildLayerLayoutBytes(screen, 'background', analysis, tileBankDefinitions);
    const behaviorArtifacts = buildBehaviorGenerationArtifacts(screen, analysis, tileBankDefinitions, backgroundLayoutBytes);
    const interactionArtifacts = buildInteractionGenerationArtifacts(screen, analysis, interactionTargetIdMap);
    const backgroundBlockMap = buildScreenBlockMapFromBytes({
      bytes: backgroundLayoutBytes,
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      mode: screen.blockOptimization?.backgroundMode,
    });
    const effectsLayoutBytes = buildLayerLayoutBytes(screen, 'effects', analysis, tileBankDefinitions);
    const hasEffectsLayoutData = effectsLayoutBytes.some(value => value !== 0);
    const effectZoneBytes = buildEffectZoneBytes(screen);
    const effectZoneCount = (screen.effectZones || []).length;
    const screenId = String(screen.id || `screen_${index}`);
    const animatedGroupCount = countAnimatedGroupsInScreen(backgroundLayoutBytes, effectsLayoutBytes, animatedTileGroups);
    const entityCount = screenEntityCounts.get(screenId) || 0;
    const spritePatternSlots = screenSpriteUsage.get(screenId) || 1;
    const hasHudData = !!(
      (screen.hudConfiguration?.elements && screen.hudConfiguration.elements.length > 0) ||
      (screen.hudConfiguration?.importedFrame?.cells && screen.hudConfiguration.importedFrame.cells.length > 0)
    );
    const worldIds = screenWorldMembership.get(screenId);
    const musicInGame = worldIds && worldIds.size > 0
      ? Array.from(worldIds).some((worldId) => (worldMusicFlags.get(worldId) || 0) !== 0) ? 1 : 0
      : fallbackGameplayMusic;
    const summaryFlags =
      (musicInGame ? 0x01 : 0) |
      (hasHudData ? 0x02 : 0) |
      ((hasEffectsLayoutData || effectZoneCount > 0) ? 0x04 : 0) |
      (animatedGroupCount > 0 ? 0x08 : 0);

    return {
      screen,
      screenId,
      index,
      screenName,
      screenNameWithIndex,
      backgroundLayoutBytes,
      behaviorSource: behaviorArtifacts.behaviorSource,
      behaviorMapData: behaviorArtifacts.behaviorMapData,
      charBehaviorTable: behaviorArtifacts.charBehaviorTable,
      interactionTypeMap: interactionArtifacts.interactionTypeMap,
      interactionValueMap: interactionArtifacts.interactionValueMap,
      interactionTargetMap: interactionArtifacts.interactionTargetMap,
      backgroundBlockMap,
      effectsLayoutBytes,
      hasEffectsLayoutData,
      effectZoneBytes,
      effectZoneCount,
      animatedGroupCount,
      entityCount,
      spritePatternSlots,
      musicInGame,
      summaryFlags,
    };
  });

  let asm = `; ==================================================================
; SCREEN DATA TABLES - bank4 section
; ==================================================================

`;

  screenExports.forEach((screenExport) => {
    const { screen, index, screenName, screenNameWithIndex, backgroundLayoutBytes, backgroundBlockMap, effectsLayoutBytes, hasEffectsLayoutData, effectZoneBytes, effectZoneCount } = screenExport;

    if (screen.layers && screen.layers.background) {
      if (backgroundBlockMap) {
        asm += generateBackgroundBlockDataSection(screenName, index, screen.name, backgroundBlockMap);
      } else {
        const asmCode = generateScreenLayoutASMCode(
          screenNameWithIndex,
          SCREEN_WIDTH,
          SCREEN_HEIGHT,
          backgroundLayoutBytes,
          [],
          'hex'
        );
        asm += asmCode;
        asm += `\n`;
      }

      // Effects layout
      asm += generateRawByteBlock(
        `SCREEN_${screenName}_${index}_EFFECTS_LAYOUT`,
        effectsLayoutBytes,
        hasEffectsLayoutData
          ? [`Alternate Effects layer for ${screen.name}`]
          : [`No alternate Effects tiles for ${screen.name}`]
      );
      asm += `\n`;

      // Effect zone table
      asm += generateRawByteBlock(
        `SCREEN_${screenName}_${index}_EFFECT_ZONE_TABLE`,
        effectZoneBytes,
        effectZoneCount > 0
          ? [`Effect zones for ${screen.name}`, `Entry format: x, y, width, height, effectType, param0, param1, reserved`]
          : [`No effect zones for ${screen.name}`]
      );
      asm += `\n`;
      asm += generateBossPlacementTable(screenName, index, screen, bossLabelById, bossById);
      asm += `\n`;

      if (screenExport.behaviorSource === 'backgroundChars' && screenExport.charBehaviorTable) {
        asm += generateRawByteBlock(
          `SCREEN_${screenName}_${index}_CHAR_BEHAVIOR_TABLE`,
          screenExport.charBehaviorTable,
          [`${screen.name} - background char -> behavior lookup table`]
        );
        asm += `\n`;
      } else if (screenExport.behaviorMapData) {
        asm += generateBehaviorMapASMCode(screenNameWithIndex, SCREEN_WIDTH, SCREEN_HEIGHT, screenExport.behaviorMapData, 'hex');
        asm += `\n`;
      } else {
        asm += `BEHAVIOR_${screenName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${index}_DATA:\n    db 0\n\n`;
      }
      asm += generateRawByteBlock(
        `SCREEN_${screenName}_${index}_INTERACTION_TYPE_MAP`,
        screenExport.interactionTypeMap,
        [`${screen.name} - per-cell interaction type map`]
      );
      asm += `\n`;
      asm += generateRawByteBlock(
        `SCREEN_${screenName}_${index}_INTERACTION_VALUE_MAP`,
        screenExport.interactionValueMap,
        [`${screen.name} - per-cell interaction value map`]
      );
      asm += `\n`;
      asm += generateRawByteBlock(
        `SCREEN_${screenName}_${index}_INTERACTION_TARGET_MAP`,
        screenExport.interactionTargetMap,
        [`${screen.name} - per-cell interaction target map`]
      );
      asm += `\n`;
    } else {
      // Placeholder for screens without background layer
      asm += `SCREEN_${screenName}_${index}_LAYOUT:\n    db 0, 0, 0, 0, 0, 0, 0, 0\n\n`;
      asm += `SCREEN_${screenName}_${index}_EFFECTS_LAYOUT:\n    db 0\n\n`;
      asm += `SCREEN_${screenName}_${index}_EFFECT_ZONE_TABLE:\n    db 0\n\n`;
      asm += generateBossPlacementTable(screenName, index, screen, bossLabelById, bossById);
      asm += `\n`;
      if (resolveScreenBehaviorSource(screen) === 'backgroundChars') {
        asm += generateRawByteBlock(`SCREEN_${screenName}_${index}_CHAR_BEHAVIOR_TABLE`, Array.from({ length: 256 }, () => 0));
        asm += `\n`;
      } else {
        asm += `BEHAVIOR_${screenName}_${index}_DATA:\n    db 0\n\n`;
      }
      asm += generateRawByteBlock(`SCREEN_${screenName}_${index}_INTERACTION_TYPE_MAP`, Array.from({ length: SCREEN_WIDTH * SCREEN_HEIGHT }, () => 0));
      asm += `\n`;
      asm += generateRawByteBlock(`SCREEN_${screenName}_${index}_INTERACTION_VALUE_MAP`, Array.from({ length: SCREEN_WIDTH * SCREEN_HEIGHT }, () => 0));
      asm += `\n`;
      asm += generateRawByteBlock(`SCREEN_${screenName}_${index}_INTERACTION_TARGET_MAP`, Array.from({ length: SCREEN_WIDTH * SCREEN_HEIGHT }, () => 0));
      asm += `\n`;
    }
  });

  return asm;
}
