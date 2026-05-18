import { ProjectAnalysis } from '../../asmTemplateGenerator';
import { generateTileColorBytes, generateTilePatternBytes } from '../../../components/utils/tileUtils';
import { TileBank } from '../../../types';
import {
  getTileAssignmentCharCodes,
  getTileCharDimensions,
  getTileCharPatternColorBytes,
  resolveTileAssignmentCharCode,
} from '../../../utils/tileBankOptimization';

export interface Screen2TileBankPayload {
  startChar: number;
  byteCount: number;
  patternBytes: number[];
  colorBytes: number[];
}

export interface Screen2TileBankRuntime {
  tileBankId: string;
  labelBase: string;
  banks: Screen2TileBankPayload[];
}

const RUNTIME_SCREEN2_FONT_RESERVED_START = 128;
// Chars 254 and 255 are runtime sentinels. Loading boss/tile patterns into them
// makes transition cells or empty cells render as that pattern across the screen.
const RUNTIME_SCREEN2_CHAR_MAX = 253;

function sanitizeAsmFragment(value: string): string {
  return String(value || '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase() || 'default';
}

function sanitizeAsmFragmentUpper(value: string): string {
  return sanitizeAsmFragment(value).toUpperCase();
}

function buildEmptyPayload(): Screen2TileBankPayload {
  return {
    startChar: 0,
    byteCount: 0,
    patternBytes: [],
    colorBytes: [],
  };
}

function projectUsesFontCharRange(analysis: ProjectAnalysis): boolean {
  const hasMenus = analysis.gameFlow?.nodes?.some((node: any) => node?.type === 'SubMenu');
  const hasText = analysis.screenMaps?.some((screen: any) =>
    (screen.layers as any)?.text || (screen as any).textElements?.length > 0
  );
  const hasHudText = analysis.screenMaps?.some((screen: any) =>
    Array.isArray(screen?.hudConfiguration?.elements) && screen.hudConfiguration.elements.length > 0
  );

  return !!(hasMenus || hasText || hasHudText);
}

function buildTileOrderIndex(analysis: ProjectAnalysis): Map<string, number> {
  return new Map((analysis.tiles || []).map((tile: any, index: number) => [String(tile?.id || ''), index]));
}

function collectBossAllBankTileIds(analysis: ProjectAnalysis, tileBankId: string): Set<string> {
  const tileIds = new Set<string>();
  const addMatrix = (matrix: unknown) => {
    if (!Array.isArray(matrix)) return;
    matrix.forEach((row) => {
      if (!Array.isArray(row)) return;
      row.forEach((tileId) => {
        if (tileId) tileIds.add(String(tileId));
      });
    });
  };

  // Bosses are drawn dynamically over the Name Table and may move across
  // SCREEN 2's three vertical pattern/color banks, so their tile chars must be
  // materialized in every runtime bank that can display the boss footprint.
  (analysis.bosses || []).forEach((boss: any) => {
    (boss?.phases || []).forEach((phase: any) => {
      if (String(phase?.tileBankId || '') !== tileBankId) return;
      addMatrix(phase.tileMatrix);
      (phase.forms || []).forEach((form: any) => addMatrix(form?.tileMatrix));
      (boss?.attacks || []).forEach((attack: any) => {
        if (attack?.laserTileAssetId) tileIds.add(String(attack.laserTileAssetId));
        if (attack?.blockTileAssetId) tileIds.add(String(attack.blockTileAssetId));
      });
    });
  });

  return tileIds;
}

function buildTileRefMap(analysis: ProjectAnalysis): Map<string, string> {
  const refs = new Map<string, string>();
  (analysis.tiles || []).forEach((tile: any) => {
    const id = String(tile?.id || '').trim();
    if (!id) return;
    [tile?.id, tile?.name, tile?.data?.id, tile?.data?.name].forEach((ref) => {
      if (typeof ref !== 'string' || !ref.trim()) return;
      refs.set(ref, id);
      refs.set(ref.trim().toLowerCase(), id);
    });
  });
  return refs;
}

function collectDroppedBoxTileIds(analysis: ProjectAnalysis): Set<string> {
  const tileIds = new Set<string>();
  const tileRefMap = buildTileRefMap(analysis);
  const templates = Array.isArray((analysis as any).templates) ? (analysis as any).templates : [];
  const templateById = new Map<string, any>(templates.map((template: any) => [String(template?.id || ''), template]));
  const entities = Array.isArray((analysis as any).entities) ? (analysis as any).entities : [];

  entities.forEach((entity: any) => {
    const template = templateById.get(String(entity?.entityTemplateId || ''));
    const boxComponent = Array.isArray(template?.components)
      ? template.components.find((component: any) =>
          (component?.definitionId || component?.componentDefinitionId) === 'comp_box'
        )
      : undefined;
    const boxOverrides = entity?.componentOverrides?.comp_box || {};
    const values = { ...(boxComponent?.defaultValues || {}), ...boxOverrides };
    const rawRef = String(
      values.droppedTileAssetId || values.dropTileAssetId || values.tileAssetId || values.tileId || ''
    ).trim();
    if (!rawRef) return;
    const tileId = tileRefMap.get(rawRef) || tileRefMap.get(rawRef.toLowerCase());
    if (tileId) tileIds.add(tileId);
  });

  return tileIds;
}

function collectReferenceAssignments(
  sourceBanks: TileBank['banks'],
  tileIds: Set<string>
): Map<string, any> {
  const assignments = new Map<string, any>();
  if (!sourceBanks?.length || tileIds.size === 0) return assignments;

  sourceBanks.forEach((bank) => {
    Object.entries((bank as any)?.assignedTiles || {}).forEach(([tileId, assignment]) => {
      if (!tileIds.has(String(tileId)) || Array.isArray((assignment as any)?.fontCharacters)) return;
      if (!assignments.has(String(tileId))) {
        assignments.set(String(tileId), assignment);
      }
    });
  });

  return assignments;
}

function buildFallbackRuntimeBankDefinitions(analysis: ProjectAnalysis): TileBank['banks'] | undefined {
  if (!analysis.tiles || analysis.tiles.length === 0) {
    return undefined;
  }

  const assignedTiles: Record<string, { charCode: number; assignedAt: number }> = {};
  let nextCharCode = RUNTIME_SCREEN2_FONT_RESERVED_START;

  for (const tileAsset of analysis.tiles) {
    if (!tileAsset?.id) continue;
    const charsWide = Math.ceil(tileAsset.width / 8);
    const charsHigh = Math.ceil(tileAsset.height / 8);
    const charsPerTile = charsWide * charsHigh;
    if ((nextCharCode + charsPerTile - 1) > RUNTIME_SCREEN2_CHAR_MAX) {
      console.warn(`Skipping runtime tile mapping for ${tileAsset.name || tileAsset.id}: exceeds SCREEN 2 range`);
      continue;
    }

    assignedTiles[tileAsset.id] = {
      charCode: nextCharCode,
      assignedAt: Date.now(),
    };
    nextCharCode += charsPerTile;
  }

  const runtimeBank = {
    assignedTiles,
    charsetRangeStart: RUNTIME_SCREEN2_FONT_RESERVED_START,
    charsetRangeEnd: RUNTIME_SCREEN2_CHAR_MAX,
    enabled: true,
  } as any;

  return [runtimeBank, runtimeBank, runtimeBank];
}

function normalizeRuntimeBankDefinitions(
  rawBanks: TileBank['banks'] | undefined,
  analysis: ProjectAnalysis,
  tileBankId?: string | null
): TileBank['banks'] | undefined {
  const tileById = new Map((analysis.tiles || []).map((tile: any) => [String(tile?.id || ''), tile]));
  const tileOrderIndex = buildTileOrderIndex(analysis);
  const reserveFontRange = projectUsesFontCharRange(analysis);
  const sourceBanks = rawBanks?.length ? rawBanks : buildFallbackRuntimeBankDefinitions(analysis);

  if (!sourceBanks?.length) {
    return undefined;
  }

  const allBankBossTileIds = collectBossAllBankTileIds(analysis, String(tileBankId || ''));
  const droppedBoxTileIds = collectDroppedBoxTileIds(analysis);
  const allBankRuntimeTileIds = new Set([
    ...Array.from(allBankBossTileIds),
    ...Array.from(droppedBoxTileIds),
  ]);
  const runtimeReferenceAssignments = collectReferenceAssignments(sourceBanks, allBankRuntimeTileIds);

  return [0, 1, 2].map((bankIndex) => {
    const sourceBank = (sourceBanks[bankIndex] || sourceBanks[0] || {}) as any;
    const mergedAssignedTiles = {
      ...(sourceBank.assignedTiles || {}),
    };
    runtimeReferenceAssignments.forEach((assignment, tileId) => {
      if (!mergedAssignedTiles[tileId]) {
        mergedAssignedTiles[tileId] = assignment;
      }
    });
    allBankRuntimeTileIds.forEach((tileId) => {
      if (!mergedAssignedTiles[tileId] && tileById.has(tileId)) {
        mergedAssignedTiles[tileId] = { charCode: Number.NaN };
      }
    });
    const assignedTiles: Record<string, any> = {};
    const entryList = Object.entries(mergedAssignedTiles)
      .filter(([tileId, assignment]) =>
        tileById.has(String(tileId)) || Array.isArray((assignment as any)?.fontCharacters)
      )
      .sort(([tileIdA, assignmentA], [tileIdB, assignmentB]) => {
        const isFontA = Array.isArray((assignmentA as any)?.fontCharacters);
        const isFontB = Array.isArray((assignmentB as any)?.fontCharacters);
        if (isFontA !== isFontB) {
          return isFontA ? -1 : 1;
        }

        const charCodeA = Number((assignmentA as any)?.charCode);
        const charCodeB = Number((assignmentB as any)?.charCode);
        if (Number.isFinite(charCodeA) && Number.isFinite(charCodeB) && charCodeA !== charCodeB) {
          return charCodeA - charCodeB;
        }
        return (tileOrderIndex.get(String(tileIdA)) ?? Number.MAX_SAFE_INTEGER)
          - (tileOrderIndex.get(String(tileIdB)) ?? Number.MAX_SAFE_INTEGER);
      });

    let nextCharCode = reserveFontRange
      ? RUNTIME_SCREEN2_FONT_RESERVED_START
      : Math.max(0, Math.min(RUNTIME_SCREEN2_CHAR_MAX, Number(sourceBank.charsetRangeStart) || 0));
    let hasFontAssignments = false;

    for (const [tileId, assignment] of entryList) {
      if (Array.isArray((assignment as any)?.fontCharacters)) {
        assignedTiles[String(tileId)] = {
          ...(assignment as any),
        };
        hasFontAssignments = true;
        continue;
      }

      const tile = tileById.get(String(tileId));
      if (!tile) continue;

      if (Array.isArray((assignment as any)?.charMap)) {
        const charCodes = getTileAssignmentCharCodes(assignment as any, tile);
        const outOfRange = charCodes.some(code => code > RUNTIME_SCREEN2_CHAR_MAX);
        if (outOfRange) {
          console.warn(`Skipping runtime tile bank assignment for ${tile.name || tile.id}: optimized char map exceeds SCREEN 2 range`);
          continue;
        }
        assignedTiles[String(tileId)] = {
          ...(assignment as any),
          charCode: Number((assignment as any).charCode) || charCodes[0] || 0,
        };
        continue;
      }

      const charsWide = Math.ceil(tile.width / 8);
      const charsHigh = Math.ceil(tile.height / 8);
      const charsPerTile = charsWide * charsHigh;

      if ((nextCharCode + charsPerTile - 1) > RUNTIME_SCREEN2_CHAR_MAX) {
        console.warn(`Skipping runtime tile bank assignment for ${tile.name || tile.id}: exceeds SCREEN 2 range`);
        continue;
      }

      assignedTiles[String(tileId)] = {
        ...(assignment as any),
        charCode: nextCharCode,
      };
      nextCharCode += charsPerTile;
    }

    const hasLowTileAssignments = Object.entries(assignedTiles).some(([tileId, assignment]) => {
      if (Array.isArray((assignment as any)?.fontCharacters)) return false;
      const tile = tileById.get(String(tileId));
      return getTileAssignmentCharCodes(assignment as any, tile).some(code => code < RUNTIME_SCREEN2_FONT_RESERVED_START);
    });

    return {
      ...sourceBank,
      assignedTiles,
      charsetRangeStart: hasFontAssignments
        ? 0
        : hasLowTileAssignments
          ? 0
          : reserveFontRange
          ? RUNTIME_SCREEN2_FONT_RESERVED_START
          : Math.max(0, Math.min(RUNTIME_SCREEN2_CHAR_MAX, Number(sourceBank.charsetRangeStart) || 0)),
      charsetRangeEnd: RUNTIME_SCREEN2_CHAR_MAX,
      enabled: sourceBank.enabled ?? true,
    } as any;
  });
}

function buildBankPayload(bankDef: any, tileById: Map<string, any>): Screen2TileBankPayload {
  const placements: Array<{
    tileId: string;
    startChar: number;
    totalChars: number;
    patternBytes: number[];
    colorBytes: number[];
  }> = [];
  const optimizedPlacements: Array<{
    tileId: string;
    charCode: number;
    patternBytes: number[];
    colorBytes: number[];
  }> = [];

  for (const [tileId, assignment] of Object.entries(bankDef?.assignedTiles || {})) {
    const tile = tileById.get(tileId);
    if (!tile) continue;

    const startChar = Number((assignment as any)?.charCode);
    if (!Number.isFinite(startChar)) continue;

    const patternBytes = Array.from(generateTilePatternBytes(tile, 'SCREEN 2 (Graphics I)'));
    if (patternBytes.length === 0) continue;

    const colorData = generateTileColorBytes(tile);
    const colorBytes = colorData
      ? Array.from(colorData)
      : new Array(patternBytes.length).fill(0xF0);
    const { totalChars } = getTileCharDimensions(tile);

    if (Array.isArray((assignment as any)?.charMap)) {
      const writtenCodes = new Set<number>();
      for (let charIndex = 0; charIndex < totalChars; charIndex++) {
        const charCode = Number((assignment as any).charMap[charIndex]);
        if (!Number.isFinite(charCode) || writtenCodes.has(charCode)) continue;
        if (charCode < 0 || charCode > RUNTIME_SCREEN2_CHAR_MAX) {
          console.warn(`Skipping out-of-range optimized tile char for tile ${tile.name} at char ${charCode}`);
          continue;
        }
        const charBytes = getTileCharPatternColorBytes(tile, charIndex);
        optimizedPlacements.push({
          tileId,
          charCode,
          patternBytes: charBytes.patternBytes,
          colorBytes: charBytes.colorBytes,
        });
        writtenCodes.add(charCode);
      }
      continue;
    }

    if (startChar < 0 || startChar + totalChars - 1 > RUNTIME_SCREEN2_CHAR_MAX) {
      console.warn(`Skipping out-of-range tile bank assignment for tile ${tile.name} at char ${startChar}`);
      continue;
    }

    placements.push({
      tileId,
      startChar,
      totalChars,
      patternBytes,
      colorBytes,
    });
  }

  if (placements.length === 0 && optimizedPlacements.length === 0) {
    return buildEmptyPayload();
  }

  let minChar = 255;
  let maxChar = 0;
  for (const placement of placements) {
    minChar = Math.min(minChar, placement.startChar);
    maxChar = Math.max(maxChar, placement.startChar + placement.totalChars - 1);
  }
  for (const placement of optimizedPlacements) {
    minChar = Math.min(minChar, placement.charCode);
    maxChar = Math.max(maxChar, placement.charCode);
  }

  const byteCount = ((maxChar - minChar) + 1) * 8;
  const patternBytes = new Array(byteCount).fill(0);
  const colorBytes = new Array(byteCount).fill(0xF0);

  for (const placement of placements) {
    const offset = (placement.startChar - minChar) * 8;
    for (let i = 0; i < placement.patternBytes.length; i++) {
      patternBytes[offset + i] = placement.patternBytes[i];
      colorBytes[offset + i] = placement.colorBytes[i] ?? 0xF0;
    }
  }
  for (const placement of optimizedPlacements) {
    const offset = (placement.charCode - minChar) * 8;
    for (let i = 0; i < 8; i++) {
      patternBytes[offset + i] = placement.patternBytes[i] ?? 0;
      colorBytes[offset + i] = placement.colorBytes[i] ?? 0xF0;
    }
  }

  return {
    startChar: minChar,
    byteCount,
    patternBytes,
    colorBytes,
  };
}

export function getScreen2TileBankLabelBase(tileBankId: string): string {
  return `tilebank_${sanitizeAsmFragment(tileBankId)}`;
}

export function getScreen2TileBankIdLabel(tileBankId: string): string {
  return `SCREEN2_TILEBANK_${sanitizeAsmFragmentUpper(tileBankId)}_ID`;
}

export function getScreen2TileBankPatternLoaderLabel(tileBankId: string): string {
  return `load_${getScreen2TileBankLabelBase(tileBankId)}_patterns_to_vram`;
}

export function getScreen2TileBankColorLoaderLabel(tileBankId: string): string {
  return `load_${getScreen2TileBankLabelBase(tileBankId)}_colors_to_vram`;
}

export function resolveRuntimeScreen2TileBankDefinitions(
  analysis: ProjectAnalysis,
  tileBankId?: string | null
): TileBank['banks'] | undefined {
  const normalizedTileBankId = String(tileBankId || '').trim();
  const rawBanks = normalizedTileBankId
    ? (analysis.tileBanks || []).find((candidate: any) => candidate?.id === normalizedTileBankId)?.banks
    : undefined;

  return normalizeRuntimeBankDefinitions(rawBanks, analysis, normalizedTileBankId);
}

export function resolveRuntimeScreen2TileBankCharCode(
  analysis: ProjectAnalysis,
  tileBankId: string | undefined | null,
  tileId: string | undefined | null,
  row: number,
  subTileX = 0,
  subTileY = 0
): number {
  if (!tileBankId || !tileId) {
    return 0;
  }

  const banks = resolveRuntimeScreen2TileBankDefinitions(analysis, tileBankId);
  const bankIndex = Math.max(0, Math.min(2, Math.floor((row || 0) / 8)));
  const bank = (banks?.[bankIndex] || banks?.[0]) as any;
  const assignment = bank?.assignedTiles?.[tileId];
  if (Array.isArray(assignment?.fontCharacters)) {
    const fontChar = assignment.fontCharacters[Math.max(0, subTileX)];
    const bankCharCode = Number(fontChar?.bankCharCode);
    if (!Number.isFinite(bankCharCode)) {
      return 0;
    }
    return bankCharCode & 0xFF;
  }

  const tile = (analysis.tiles || []).find((candidate: any) => candidate?.id === tileId);

  if (!tile || typeof assignment?.charCode !== 'number') {
    return 0;
  }

  const charCode = resolveTileAssignmentCharCode(
    assignment,
    tile,
    Math.max(0, subTileX),
    Math.max(0, subTileY)
  ) ?? 0;
  if (charCode < (bank.charsetRangeStart ?? 0) || charCode > (bank.charsetRangeEnd ?? RUNTIME_SCREEN2_CHAR_MAX)) {
    return 0;
  }

  return charCode & 0xFF;
}

export function buildReferencedScreen2TileBanks(analysis: ProjectAnalysis): Screen2TileBankRuntime[] {
  const tileById = new Map((analysis.tiles || []).map((tile: any) => [tile.id, tile]));
  const portraitById = new Map((analysis.portraits || []).map((portrait: any) => [String(portrait?.id || ''), portrait]));
  const collectDialogueGraphicTileBankIds = (graphic: any): string[] => {
    if (!graphic || graphic.enabled !== true) return [];
    const explicitTileBankId = String(graphic.tileBankAssetId || '').trim();
    const portraitAssetId = String(graphic.portraitAssetId || '').trim();
    const portraitTileBankId = portraitAssetId
      ? String((portraitById.get(portraitAssetId) as any)?.tileBankAssetId || '').trim()
      : '';
    return [explicitTileBankId, portraitTileBankId].filter(Boolean);
  };

  const dialogueGraphicTileBankIds = (analysis.dialogues || []).flatMap((dialogue: any) => [
    ...collectDialogueGraphicTileBankIds(dialogue?.box?.graphic),
    ...((dialogue?.lines || []) as any[]).flatMap(line => collectDialogueGraphicTileBankIds(line?.graphic)),
  ]);

  const referencedTileBankIds = Array.from(new Set([
    ...(analysis.screenMaps || [])
      .map((screen: any) => String(screen?.tileBankAssetId || '').trim())
      .filter(Boolean),
    ...dialogueGraphicTileBankIds,
  ]));

  return referencedTileBankIds
    .map((tileBankId) => {
      const runtimeBanks = resolveRuntimeScreen2TileBankDefinitions(analysis, tileBankId);
      if (!runtimeBanks?.length) {
        return null;
      }

      return {
        tileBankId,
        labelBase: getScreen2TileBankLabelBase(tileBankId),
        banks: [0, 1, 2].map((index) => buildBankPayload(runtimeBanks[index], tileById)),
      } satisfies Screen2TileBankRuntime;
    })
    .filter((runtime): runtime is Screen2TileBankRuntime => runtime !== null);
}
