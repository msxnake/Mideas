import {
  ComponentDefinition,
  EntityInstance,
  EntityTemplate,
  GameFlowGraph,
  GameFlowNode,
  GlobalVariablesAsset,
  LineColorAttribute,
  MSXFont,
  MSXFontColorAttributes,
  PixelData,
  ProjectAsset,
  ScreenMap,
  Sprite,
  TileBank,
  WorldMapGraph,
} from '../types';
import { MSX1_PALETTE_MAP } from '../constants';
import { buildScreenBlockMapFromBytes } from './screenOptimization/blockMapBuilder';

export interface IntermediateGameJsonV1 {
  schema: 'mideas.intermediate_game.v1';
  exportedAt: string;
  project: {
    name: string | null;
    screenMode: string;
  };
  initialization: {
    entryGameFlowAssetId: string | null;
    entry: {
      gameFlowAssetId: string | null;
      startNodeId: string | null;
      firstNodeId: string | null;
    };
    derivedMenu:
      | null
      | {
          kind: 'GameFlowSubMenu';
          gameFlowAssetId: string;
          nodeId: string;
          title: string;
          options: any[];
          appearance?: any;
          referencedAssetIds: string[];
        };
    globalVariables: Array<{ assetId: string; data: GlobalVariablesAsset }>;
  };
  structure: {
    gameFlows: Array<IntermediateGameFlow>;
    worldMaps: Array<IntermediateWorldMap>;
  };
  catalog: {
    assetsById: Record<string, { id: string; type: ProjectAsset['type']; name: string; data?: ProjectAsset['data'] }>;
    componentDefinitionsById: Record<string, ComponentDefinition>;
    entityTemplatesById: Record<string, EntityTemplate>;
    tileBanks: TileBank[];
    msxFont: {
      encoding: 'msx1-font-patterns-hex-v1';
      charCount: 256;
      bytesPerChar: 8;
      hex: string;
      lengthBytes: number;
    };
    msxFontColorAttributes: {
      encoding: 'msx1-font-colors-hex-v1';
      charCount: 256;
      bytesPerChar: 8;
      hex: string;
      lengthBytes: number;
    };
  };
  diagnostics: {
    missingAssetIds: string[];
    warnings: string[];
  };
}

type EncodedMsx1NibbleHex = {
  encoding: 'msx1-idx-nibble-hex-v1';
  width: number;
  height: number;
  /** 2 pixels per byte, high nibble then low nibble. */
  hex: string;
  lengthBytes: number;
};

function normalizeHexColor(input: string): string | null {
  if (!input) return null;
  if (input.startsWith('#')) return input.toUpperCase();
  return null;
}

function colorToMsx1Index(color: string, warnings: string[], context: string): number {
  if (!color) return 0;
  const lower = color.toLowerCase();
  if (lower.startsWith('rgba(') && lower.endsWith(',0)')) {
    return 0;
  }
  const hex = normalizeHexColor(color);
  if (hex) {
    const entry = MSX1_PALETTE_MAP.get(hex as any);
    if (entry) return entry.index & 0x0f;
  }
  const entry = MSX1_PALETTE_MAP.get(color as any);
  if (entry) return entry.index & 0x0f;

  warnings.push(`Unmapped MSX1 color "${color}" in ${context} (encoded as 0).`);
  return 0;
}

function encodePixelDataToMsx1NibbleHex(pixelData: PixelData, warnings: string[], context: string): EncodedMsx1NibbleHex {
  const height = pixelData.length;
  const width = height > 0 ? (pixelData[0]?.length ?? 0) : 0;
  const totalPixels = width * height;
  const outBytes = new Uint8Array(Math.ceil(totalPixels / 2));
  let outIndex = 0;
  let isHighNibble = true;
  let currentByte = 0;

  for (let y = 0; y < height; y++) {
    const row = pixelData[y] || [];
    for (let x = 0; x < width; x++) {
      const color = row[x] as any as string;
      const idx = colorToMsx1Index(color, warnings, context) & 0x0f;
      if (isHighNibble) {
        currentByte = (idx << 4) & 0xf0;
        isHighNibble = false;
      } else {
        currentByte |= idx & 0x0f;
        outBytes[outIndex++] = currentByte;
        currentByte = 0;
        isHighNibble = true;
      }
    }
  }
  if (!isHighNibble) {
    outBytes[outIndex++] = currentByte;
  }

  return {
    encoding: 'msx1-idx-nibble-hex-v1',
    width,
    height,
    hex: toHex(outBytes),
    lengthBytes: outBytes.length,
  };
}

type EncodedMsx1LineAttrsHex = {
  encoding: 'msx1-lineattrs-hex-v1';
  /** Number of 8-pixel segments per row (tileWidth/8). */
  widthSegments: number;
  height: number;
  /** One byte per segment: (fg<<4)|bg using MSX1 palette indices 0–15. */
  hex: string;
  lengthBytes: number;
};

function encodeLineAttributesToMsx1Hex(lineAttributes: LineColorAttribute[][], warnings: string[], context: string): EncodedMsx1LineAttrsHex {
  const height = lineAttributes.length;
  const widthSegments = height > 0 ? (lineAttributes[0]?.length ?? 0) : 0;
  const out = new Uint8Array(height * widthSegments);
  let i = 0;
  for (let y = 0; y < height; y++) {
    const row = lineAttributes[y] || [];
    for (let s = 0; s < widthSegments; s++) {
      const seg = row[s] || ({ fg: '#000000', bg: '#000000' } as any);
      const fg = colorToMsx1Index(seg.fg as any, warnings, `${context}.lineAttributes[y=${y}].fg`) & 0x0f;
      const bg = colorToMsx1Index(seg.bg as any, warnings, `${context}.lineAttributes[y=${y}].bg`) & 0x0f;
      out[i++] = ((fg << 4) | bg) & 0xff;
    }
  }
  return {
    encoding: 'msx1-lineattrs-hex-v1',
    widthSegments,
    height,
    hex: toHex(out),
    lengthBytes: out.length,
  };
}

function encodeMsxFontToHex(msxFont: MSXFont): IntermediateGameJsonV1['catalog']['msxFont'] {
  const out = new Uint8Array(256 * 8);
  let i = 0;
  for (let code = 0; code < 256; code++) {
    const pattern = (msxFont as any)[code] as number[] | undefined;
    for (let row = 0; row < 8; row++) {
      const v = pattern?.[row] ?? 0;
      out[i++] = v & 0xff;
    }
  }
  return {
    encoding: 'msx1-font-patterns-hex-v1',
    charCount: 256,
    bytesPerChar: 8,
    hex: toHex(out),
    lengthBytes: out.length,
  };
}

function encodeMsxFontColorsToHex(msxFontColorAttributes: MSXFontColorAttributes, warnings: string[]): IntermediateGameJsonV1['catalog']['msxFontColorAttributes'] {
  const out = new Uint8Array(256 * 8);
  let i = 0;
  for (let code = 0; code < 256; code++) {
    const rows = (msxFontColorAttributes as any)[code] as Array<{ fg: string; bg: string }> | undefined;
    for (let row = 0; row < 8; row++) {
      const fgColor = rows?.[row]?.fg ?? '#FFFFFF';
      const bgColor = rows?.[row]?.bg ?? '#000000';
      const fg = colorToMsx1Index(fgColor, warnings, `msxFontColorAttributes[${code}][${row}].fg`) & 0x0f;
      const bg = colorToMsx1Index(bgColor, warnings, `msxFontColorAttributes[${code}][${row}].bg`) & 0x0f;
      out[i++] = ((fg << 4) | bg) & 0xff;
    }
  }
  return {
    encoding: 'msx1-font-colors-hex-v1',
    charCount: 256,
    bytesPerChar: 8,
    hex: toHex(out),
    lengthBytes: out.length,
  };
}

export interface IntermediateGameFlow {
  assetId: string;
  name: string;
  startNodeId: string;
  nodes: IntermediateGameFlowNode[];
  connections: GameFlowGraph['connections'];
}

export interface IntermediateGameFlowNode {
  id: string;
  type: GameFlowNode['type'];
  position: { x: number; y: number };
  data: Record<string, any>;
  referencedAssetIds: string[];
}

export interface IntermediateWorldMap {
  assetId: string;
  name: string;
  startScreenNodeId: string | null;
  nodes: WorldMapGraph['nodes'];
  connections: WorldMapGraph['connections'];
  screens: Array<IntermediateWorldMapScreen>;
}

export interface IntermediateWorldMapScreen {
  worldNodeId: string;
  screenAssetId: string;
  screen: IntermediateScreen;
}

export interface IntermediateScreen {
  id: string;
  name: string;
  screenKind?: ScreenMap['screenKind'];
  screenEngine: NonNullable<ScreenMap['screenEngine']>;
  runtime: {
    runsPlayerEngine: boolean;
    runsFakePlayerEngine: boolean;
  };
  width: number;
  height: number;
  layers: {
    encoding: 'screen2-idx-hex-v1';
    width: number;
    height: number;
    bytesPerRow: number;
    emptyValue: 0;
    tileTable: Array<{ index: number; tileId: string; subTileX?: number; subTileY?: number }>;
    background: { hex: string; lengthBytes: number };
    backgroundBlocks?: {
      encoding: 'screen2-blockmap-idx-hex-v1';
      mode: 'blocks2x2' | 'blocks4x4';
      blockWidth: number;
      blockHeight: number;
      mapWidth: number;
      mapHeight: number;
      emptyValue: 0;
      catalogEntryCount: number;
      catalogBytesPerEntry: number;
      catalog: { hex: string; lengthBytes: number };
      map: { hex: string; lengthBytes: number; bytesPerRow: number };
      sourceLengthBytes: number;
      optimizedLengthBytes: number;
      savingsBytes: number;
    };
    collision: { hex: string; lengthBytes: number };
    effects: { hex: string; lengthBytes: number };
  };
  blockOptimization?: ScreenMap['blockOptimization'];
  effectZones?: ScreenMap['effectZones'];
  activeAreaX?: ScreenMap['activeAreaX'];
  activeAreaY?: ScreenMap['activeAreaY'];
  activeAreaWidth?: ScreenMap['activeAreaWidth'];
  activeAreaHeight?: ScreenMap['activeAreaHeight'];
  hudConfiguration?: ScreenMap['hudConfiguration'];
  screenSectors?: ScreenMap['screenSectors'];
  tileBankAssetId?: ScreenMap['tileBankAssetId'];
  backgroundColor?: ScreenMap['backgroundColor'];
  borderColor?: ScreenMap['borderColor'];
  tileIdsUsed: string[];
  spriteIdsUsed: string[];
  /** Optional (can be omitted in compact exports). */
  entities?: Array<IntermediateEntityInstance>;
  entitiesPacked: {
    encoding: 'screen2-entities-hex-v1';
    bytesPerEntity: 3;
    entryCount: number;
    emptyValue: 0;
    entityTemplateTable: Array<{ index: number; entityTemplateId: string; name?: string }>;
    hex: string;
    lengthBytes: number;
  };
}

export interface IntermediateEntityInstance {
  id: string;
  name: string;
  position: EntityInstance['position'];
  entityTemplateId: string;
  entityTemplateName: string | null;
  jobRate?: number;
  jobEntry?: number;
  components: Array<{
    definitionId: string;
    definitionName: string | null;
    values: Record<string, any>;
  }>;
  spriteIdsUsed: string[];
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values)).sort();
}

function collectTileIdsFromLayers(layers: ScreenMap['layers']): string[] {
  const ids: string[] = [];
  for (const layerName of ['background', 'collision', 'effects'] as const) {
    const layer = layers[layerName];
    for (const row of layer) {
      for (const cell of row) {
        if (cell?.tileId) ids.push(cell.tileId);
      }
    }
  }
  return uniqueStrings(ids);
}

function toHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0').toUpperCase();
  }
  return out;
}

type TileCellKey = string;

function normalizeCellKey(cell: { tileId: string | null; subTileX?: number; subTileY?: number }): TileCellKey | null {
  if (!cell.tileId) return null;
  const subTileX = cell.subTileX ?? 0;
  const subTileY = cell.subTileY ?? 0;
  return `${cell.tileId}|${subTileX}|${subTileY}`;
}

function parseCellKey(key: TileCellKey): { tileId: string; subTileX: number; subTileY: number } {
  const [tileId, x, y] = key.split('|');
  return { tileId, subTileX: Number(x || 0), subTileY: Number(y || 0) };
}

function buildScreen2TileTable(screen: ScreenMap): { table: IntermediateScreen['layers']['tileTable']; keyToIndex: Map<TileCellKey, number> } {
  const keysByTileId = new Map<string, Set<TileCellKey>>();
  const addCell = (cell: any) => {
    const key = normalizeCellKey(cell || { tileId: null });
    if (!key) return;
    const tileId = cell.tileId as string;
    if (!keysByTileId.has(tileId)) keysByTileId.set(tileId, new Set());
    keysByTileId.get(tileId)!.add(key);
  };

  for (const layerName of ['background', 'collision', 'effects'] as const) {
    const layer = screen.layers[layerName];
    for (const row of layer) for (const cell of row) addCell(cell);
  }

  const table: IntermediateScreen['layers']['tileTable'] = [];
  const keyToIndex = new Map<TileCellKey, number>();

  const sortedTileIds = Array.from(keysByTileId.keys()).sort();
  let index = 1; // 0 is reserved for emptyValue
  for (const tileId of sortedTileIds) {
    const keys = Array.from(keysByTileId.get(tileId) ?? []);
    keys.sort((a, b) => {
      const pa = parseCellKey(a);
      const pb = parseCellKey(b);
      if (pa.subTileY !== pb.subTileY) return pa.subTileY - pb.subTileY;
      return pa.subTileX - pb.subTileX;
    });
    for (const key of keys) {
      if (index > 255) {
        break;
      }
      const parsed = parseCellKey(key);
      table.push({
        index,
        tileId: parsed.tileId,
        ...(parsed.subTileX !== 0 ? { subTileX: parsed.subTileX } : {}),
        ...(parsed.subTileY !== 0 ? { subTileY: parsed.subTileY } : {}),
      });
      keyToIndex.set(key, index);
      index++;
    }
    if (index > 255) break;
  }

  return { table, keyToIndex };
}

function encodeScreen2LayerToIndices({
  layer,
  width,
  height,
  keyToIndex,
  warnings,
  screenName,
  layerName,
}: {
  layer: ScreenMap['layers']['background'];
  width: number;
  height: number;
  keyToIndex: Map<TileCellKey, number>;
  warnings: string[];
  screenName: string;
  layerName: 'background' | 'collision' | 'effects';
}): Uint8Array {
  const out = new Uint8Array(width * height);
  let i = 0;
  for (let y = 0; y < height; y++) {
    const row = layer[y] || [];
    for (let x = 0; x < width; x++) {
      const cell = row[x] || { tileId: null };
      const key = normalizeCellKey(cell);
      if (!key) {
        out[i++] = 0;
        continue;
      }
      const idx = keyToIndex.get(key);
      if (idx === undefined) {
        warnings.push(`Screen "${screenName}" layer "${layerName}" references unmapped tile cell "${key}" (encoded as 0).`);
        out[i++] = 0;
        continue;
      }
      out[i++] = idx & 0xff;
    }
  }
  return out;
}

function collectSpriteIdsFromUnknownValues(value: unknown, spriteIdSet: Set<string>, found: Set<string>) {
  if (typeof value === 'string') {
    if (spriteIdSet.has(value)) found.add(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const v of value) collectSpriteIdsFromUnknownValues(v, spriteIdSet, found);
    return;
  }
  if (value && typeof value === 'object') {
    for (const v of Object.values(value as Record<string, unknown>)) {
      collectSpriteIdsFromUnknownValues(v, spriteIdSet, found);
    }
  }
}

function buildIntermediateEntityInstance({
  instance,
  entityTemplatesById,
  componentDefinitionsById,
  spriteIdSet,
  warnings,
}: {
  instance: EntityInstance;
  entityTemplatesById: Record<string, EntityTemplate>;
  componentDefinitionsById: Record<string, ComponentDefinition>;
  spriteIdSet: Set<string>;
  warnings: string[];
}): IntermediateEntityInstance {
  const template = entityTemplatesById[instance.entityTemplateId];
  const components: IntermediateEntityInstance['components'] = [];
  const spriteIdsFound = new Set<string>();

  if (!template) {
    warnings.push(`EntityInstance "${instance.name}" references missing EntityTemplate id="${instance.entityTemplateId}".`);
  }

  for (const templateComponent of template?.components ?? []) {
    const definitionId = templateComponent.definitionId;
    const definition = componentDefinitionsById[definitionId];
    const overrides = instance.componentOverrides?.[definitionId] || {};
    const values = { ...(templateComponent.defaultValues || {}), ...(overrides || {}) };
    components.push({
      definitionId,
      definitionName: definition?.name ?? null,
      values,
    });

    collectSpriteIdsFromUnknownValues(values, spriteIdSet, spriteIdsFound);
  }

  return {
    id: instance.id,
    name: instance.name,
    position: instance.position,
    entityTemplateId: instance.entityTemplateId,
    entityTemplateName: template?.name ?? null,
    jobRate: instance.jobRate ?? 100,
    jobEntry: instance.jobEntry ?? 0,
    components,
    spriteIdsUsed: uniqueStrings(Array.from(spriteIdsFound)),
  };
}

function referencedAssetIdsFromNode(node: GameFlowNode): string[] {
  const ids: string[] = [];
  switch (node.type) {
    case 'WorldLink':
      if (node.worldAssetId) ids.push(node.worldAssetId);
      break;
    case 'Music':
      if (node.trackAssetId) ids.push(node.trackAssetId);
      break;
    case 'Group':
      if (node.gameFlowAssetId) ids.push(node.gameFlowAssetId);
      break;
    case 'Globals':
      if (node.globalVariablesAssetId) ids.push(node.globalVariablesAssetId);
      break;
    case 'SubMenu': {
      const bg = node.appearance?.backgroundScreenAssetId;
      const cursor = node.appearance?.cursorSpriteAssetId;
      const font = node.appearance?.fontAssetId;
      if (bg) ids.push(bg);
      if (cursor) ids.push(cursor);
      if (font) ids.push(font);
      break;
    }
    case 'Text': {
      const bg = node.appearance?.backgroundScreenAssetId;
      const font = node.appearance?.fontAssetId;
      if (bg) ids.push(bg);
      if (font) ids.push(font);
      break;
    }
    default:
      break;
  }
  return uniqueStrings(ids);
}

function buildIntermediateGameFlow(graphAsset: ProjectAsset & { data: GameFlowGraph }): IntermediateGameFlow {
  const graph = graphAsset.data;
  const nodes: IntermediateGameFlowNode[] = graph.nodes.map(node => {
    const referencedAssetIds = referencedAssetIdsFromNode(node);
    const { id, position, type, ...data } = node as any;
    return { id, position, type, data, referencedAssetIds };
  });

  return {
    assetId: graphAsset.id,
    name: graphAsset.name,
    startNodeId: graph.startNodeId,
    nodes,
    connections: graph.connections,
  };
}

function buildIntermediateScreen({
  screen,
  entityTemplatesById,
  componentDefinitionsById,
  spriteIdSet,
  warnings,
  includeHumanEntities,
}: {
  screen: ScreenMap;
  entityTemplatesById: Record<string, EntityTemplate>;
  componentDefinitionsById: Record<string, ComponentDefinition>;
  spriteIdSet: Set<string>;
  warnings: string[];
  includeHumanEntities: boolean;
}): IntermediateScreen {
  const tileIdsUsed = collectTileIdsFromLayers(screen.layers);
  const entities = (screen.layers.entities || []).map(instance =>
    buildIntermediateEntityInstance({ instance, entityTemplatesById, componentDefinitionsById, spriteIdSet, warnings })
  );

  const spriteIdsUsed = uniqueStrings([
    ...entities.flatMap(e => e.spriteIdsUsed),
  ]);

  if (screen.width !== 32 || screen.height !== 24) {
    warnings.push(`Screen "${screen.name}" is ${screen.width}x${screen.height}; SCREEN 2 expected 32x24 for 768-byte layers.`);
  }

  const { table: tileTable, keyToIndex } = buildScreen2TileTable(screen);
  if (tileTable.length >= 255) {
    warnings.push(`Screen "${screen.name}" uses more than 255 distinct tile cells (tileId+subTile); some will be encoded as 0.`);
  }

  const width = screen.width;
  const height = screen.height;
  const backgroundBytes = encodeScreen2LayerToIndices({ layer: screen.layers.background, width, height, keyToIndex, warnings, screenName: screen.name, layerName: 'background' });
  const collisionBytes = encodeScreen2LayerToIndices({ layer: screen.layers.collision, width, height, keyToIndex, warnings, screenName: screen.name, layerName: 'collision' });
  const effectsBytes = encodeScreen2LayerToIndices({ layer: screen.layers.effects, width, height, keyToIndex, warnings, screenName: screen.name, layerName: 'effects' });
  const backgroundBlockMap = buildScreenBlockMapFromBytes({
    bytes: backgroundBytes,
    width,
    height,
    mode: screen.blockOptimization?.backgroundMode,
  });

  if (screen.blockOptimization?.backgroundMode && screen.blockOptimization.backgroundMode !== 'raw' && !backgroundBlockMap) {
    warnings.push(`Screen "${screen.name}" background block optimization "${screen.blockOptimization.backgroundMode}" could not be built; raw background export was preserved.`);
  }

  const buildEntityTemplateTable = () => {
    const used = new Set<string>();
    for (const e of screen.layers?.entities ?? []) {
      if (e?.entityTemplateId) used.add(e.entityTemplateId);
    }
    const sorted = Array.from(used).sort();
    const entityTemplateTable: Array<{ index: number; entityTemplateId: string; name?: string }> = [];
    const templateIdToIndex = new Map<string, number>();
    let idx = 1; // 0 reserved for emptyValue
    for (const templateId of sorted) {
      if (idx > 255) break;
      entityTemplateTable.push({
        index: idx,
        entityTemplateId: templateId,
        ...(entityTemplatesById[templateId]?.name ? { name: entityTemplatesById[templateId].name } : {})
      });
      templateIdToIndex.set(templateId, idx);
      idx++;
    }
    return { entityTemplateTable, templateIdToIndex };
  };

  const { entityTemplateTable, templateIdToIndex } = buildEntityTemplateTable();
  if (entityTemplateTable.length >= 255) {
    warnings.push(`Screen "${screen.name}" uses more than 255 entityTemplateIds; some entities will be encoded as 0.`);
  }

  const sortedInstances = [...(screen.layers?.entities ?? [])].sort((a, b) => {
    if (a.position.y !== b.position.y) return a.position.y - b.position.y;
    if (a.position.x !== b.position.x) return a.position.x - b.position.x;
    if (a.entityTemplateId !== b.entityTemplateId) return a.entityTemplateId.localeCompare(b.entityTemplateId);
    return a.id.localeCompare(b.id);
  });

  const entityBytesPerEntity = 3 as const;
  const entityBytes = new Uint8Array(sortedInstances.length * entityBytesPerEntity);
  let ei = 0;
  for (const inst of sortedInstances) {
    const tIdx = templateIdToIndex.get(inst.entityTemplateId) ?? 0;
    if (tIdx === 0) {
      warnings.push(`Screen "${screen.name}" entity "${inst.name}" references unmapped EntityTemplate "${inst.entityTemplateId}" (encoded as 0).`);
    }
    entityBytes[ei++] = tIdx & 0xff;
    entityBytes[ei++] = (inst.position?.x ?? 0) & 0xff;
    entityBytes[ei++] = (inst.position?.y ?? 0) & 0xff;
  }

  const screenEngine = screen.screenEngine ?? ((screen.screenKind ?? 'playable') === 'playable' ? 'player' : 'fakePlayer');

  return {
    id: screen.id,
    name: screen.name,
    screenKind: screen.screenKind,
    screenEngine,
    runtime: {
      runsPlayerEngine: screenEngine === 'player',
      runsFakePlayerEngine: screenEngine === 'fakePlayer',
    },
    width: screen.width,
    height: screen.height,
    layers: {
      encoding: 'screen2-idx-hex-v1',
      width: screen.width,
      height: screen.height,
      bytesPerRow: screen.width,
      emptyValue: 0,
      tileTable,
      background: { hex: toHex(backgroundBytes), lengthBytes: backgroundBytes.length },
      ...(backgroundBlockMap ? {
        backgroundBlocks: {
          encoding: 'screen2-blockmap-idx-hex-v1' as const,
          mode: backgroundBlockMap.mode,
          blockWidth: backgroundBlockMap.blockWidth,
          blockHeight: backgroundBlockMap.blockHeight,
          mapWidth: backgroundBlockMap.mapWidth,
          mapHeight: backgroundBlockMap.mapHeight,
          emptyValue: 0 as const,
          catalogEntryCount: backgroundBlockMap.catalog.length,
          catalogBytesPerEntry: backgroundBlockMap.blockWidth * backgroundBlockMap.blockHeight,
          catalog: {
            hex: toHex(Uint8Array.from(backgroundBlockMap.catalogFlatBytes)),
            lengthBytes: backgroundBlockMap.catalogLengthBytes,
          },
          map: {
            hex: toHex(Uint8Array.from(backgroundBlockMap.mapIndices)),
            lengthBytes: backgroundBlockMap.mapLengthBytes,
            bytesPerRow: backgroundBlockMap.mapWidth,
          },
          sourceLengthBytes: backgroundBlockMap.sourceLengthBytes,
          optimizedLengthBytes: backgroundBlockMap.optimizedLengthBytes,
          savingsBytes: backgroundBlockMap.savingsBytes,
        }
      } : {}),
      collision: { hex: toHex(collisionBytes), lengthBytes: collisionBytes.length },
      effects: { hex: toHex(effectsBytes), lengthBytes: effectsBytes.length },
    },
    blockOptimization: screen.blockOptimization,
    effectZones: screen.effectZones,
    activeAreaX: screen.activeAreaX,
    activeAreaY: screen.activeAreaY,
    activeAreaWidth: screen.activeAreaWidth,
    activeAreaHeight: screen.activeAreaHeight,
    hudConfiguration: screen.hudConfiguration,
    screenSectors: screen.screenSectors,
    tileBankAssetId: screen.tileBankAssetId,
    backgroundColor: screen.backgroundColor,
    borderColor: screen.borderColor,
    tileIdsUsed,
    spriteIdsUsed,
    ...(includeHumanEntities ? { entities } : {}),
    entitiesPacked: {
      encoding: 'screen2-entities-hex-v1',
      bytesPerEntity: entityBytesPerEntity,
      entryCount: sortedInstances.length,
      emptyValue: 0,
      entityTemplateTable,
      hex: toHex(entityBytes),
      lengthBytes: entityBytes.length,
    },
  };
}

function buildIntermediateWorldMap({
  worldAsset,
  assetsById,
  entityTemplatesById,
  componentDefinitionsById,
  spriteIdSet,
  warnings,
  includeHumanEntities,
}: {
  worldAsset: ProjectAsset & { data: WorldMapGraph };
  assetsById: Record<string, ProjectAsset>;
  entityTemplatesById: Record<string, EntityTemplate>;
  componentDefinitionsById: Record<string, ComponentDefinition>;
  spriteIdSet: Set<string>;
  warnings: string[];
  includeHumanEntities: boolean;
}): IntermediateWorldMap {
  const world = worldAsset.data;
  const screens: IntermediateWorldMapScreen[] = [];

  for (const node of world.nodes) {
    const screenAsset = assetsById[node.screenAssetId];
    if (!screenAsset || screenAsset.type !== 'screenmap' || !screenAsset.data) {
      warnings.push(`WorldMap "${worldAsset.name}" references missing ScreenMap assetId="${node.screenAssetId}".`);
      continue;
    }

    const screenMap = screenAsset.data as ScreenMap;
    const screen = buildIntermediateScreen({ screen: screenMap, entityTemplatesById, componentDefinitionsById, spriteIdSet, warnings, includeHumanEntities });
    screens.push({
      worldNodeId: node.id,
      screenAssetId: node.screenAssetId,
      screen,
    });
  }

  return {
    assetId: worldAsset.id,
    name: worldAsset.name,
    startScreenNodeId: world.startScreenNodeId ?? null,
    nodes: world.nodes,
    connections: world.connections,
    screens,
  };
}

export function buildIntermediateGameJsonV1({
  assets,
  currentProjectName,
  currentScreenMode,
  tileBanks,
  componentDefinitions,
  entityTemplates,
  msxFont,
  msxFontColorAttributes,
  includeHumanEntities = false,
}: {
  assets: ProjectAsset[];
  currentProjectName: string | null;
  currentScreenMode: string;
  tileBanks: TileBank[];
  componentDefinitions: ComponentDefinition[];
  entityTemplates: EntityTemplate[];
  msxFont: MSXFont;
  msxFontColorAttributes: MSXFontColorAttributes;
  includeHumanEntities?: boolean;
}): IntermediateGameJsonV1 {
  const exportedAt = new Date().toISOString();

  const warnings: string[] = [];
  const missingAssetIdsSet = new Set<string>();

  const assetsById: Record<string, ProjectAsset> = Object.fromEntries(
    assets.map(a => [a.id, a])
  );

  const catalogAssetsById: IntermediateGameJsonV1['catalog']['assetsById'] = Object.fromEntries(
    assets.map(a => {
      const shouldOmitData = a.type === 'screenmap';
      if (shouldOmitData) return [a.id, { id: a.id, type: a.type, name: a.name, data: undefined }];

      if (a.type === 'font') {
        // Font binary data is provided via `catalog.msxFont` and `catalog.msxFontColorAttributes`.
        // Keeping the full font asset data duplicates that information and inflates the JSON.
        return [a.id, { id: a.id, type: a.type, name: a.name, data: { ref: 'catalog.msxFont' } as any }];
      }

      if (currentScreenMode === "SCREEN 2 (Graphics I)" && a.data) {
        if (a.type === 'tile') {
          const tile = a.data as any;
          if (tile?.data) {
            const encoded = encodePixelDataToMsx1NibbleHex(tile.data as PixelData, warnings, `tile "${a.name}" (${a.id})`);
            const reduced = { ...tile };
            delete reduced.data;
            delete reduced.id;
            delete reduced.name;
            reduced.dataEncoded = encoded;
            if (Array.isArray(tile.lineAttributes)) {
              reduced.lineAttributesEncoded = encodeLineAttributesToMsx1Hex(tile.lineAttributes as LineColorAttribute[][], warnings, `tile "${a.name}" (${a.id})`);
              delete reduced.lineAttributes;
            }
            if (reduced.logicalProperties && typeof reduced.logicalProperties === 'object') {
              const lp: any = reduced.logicalProperties;
              reduced.logicalProperties = {
                mapId: lp.mapId ?? 0,
                familyId: lp.familyId ?? 0,
                instanceId: lp.instanceId ?? 0,
              };
            }
            return [a.id, { id: a.id, type: a.type, name: a.name, data: reduced }];
          }
        }
        if (a.type === 'sprite') {
          const sprite = a.data as any;
          if (Array.isArray(sprite?.frames)) {
            const reduced = { ...sprite };
            delete reduced.id;
            delete reduced.name;
            const framesEncoded = sprite.frames.map((f: any, idx: number) => ({
              id: f.id,
              ...encodePixelDataToMsx1NibbleHex(f.data as PixelData, warnings, `sprite "${a.name}" (${a.id}) frame#${idx}`),
            }));
            delete reduced.frames;
            reduced.framesEncoded = framesEncoded;
            reduced.backgroundColorIndex = colorToMsx1Index(sprite.backgroundColor, warnings, `sprite "${a.name}" (${a.id}) backgroundColor`);
            delete reduced.backgroundColor;
            if (Array.isArray(sprite.spritePalette)) {
              reduced.spritePaletteIndices = sprite.spritePalette.map((c: string, pIdx: number) =>
                colorToMsx1Index(c, warnings, `sprite "${a.name}" (${a.id}) spritePalette[${pIdx}]`)
              );
              delete reduced.spritePalette;
            }
            delete reduced.currentFrameIndex;
            return [a.id, { id: a.id, type: a.type, name: a.name, data: reduced }];
          }
        }
      }

      if (a.data && typeof a.data === 'object') {
        const reduced: any = { ...(a.data as any) };
        delete reduced.id;
        delete reduced.name;
        return [a.id, { id: a.id, type: a.type, name: a.name, data: reduced }];
      }
      return [a.id, { id: a.id, type: a.type, name: a.name, data: a.data }];
    })
  );

  const componentDefinitionsByIdAll: Record<string, ComponentDefinition> = Object.fromEntries(
    componentDefinitions.map(d => [d.id, d])
  );

  const entityTemplatesByIdAll: Record<string, EntityTemplate> = Object.fromEntries(
    entityTemplates.map(t => [t.id, t])
  );

  const spriteIdSet = new Set(
    assets.filter(a => a.type === 'sprite').map(a => (a.data as Sprite | undefined)?.id || a.id)
  );

  const gameFlowAssets = assets.filter(a => a.type === 'gameflow' && a.data) as Array<ProjectAsset & { data: GameFlowGraph }>;
  const worldMapAssets = assets.filter(a => a.type === 'worldmap' && a.data) as Array<ProjectAsset & { data: WorldMapGraph }>;

  const entryGameFlow = gameFlowAssets.find(a => a.name === 'Main') ?? gameFlowAssets[0] ?? null;

  const gameFlows: IntermediateGameFlow[] = gameFlowAssets.map(buildIntermediateGameFlow);
  const worldMaps: IntermediateWorldMap[] = worldMapAssets.map(worldAsset =>
    buildIntermediateWorldMap({ worldAsset, assetsById, entityTemplatesById: entityTemplatesByIdAll, componentDefinitionsById: componentDefinitionsByIdAll, spriteIdSet, warnings, includeHumanEntities })
  );

  const referencedIdsFromGameFlowNodes = gameFlows.flatMap(gf => gf.nodes.flatMap(n => n.referencedAssetIds || []));
  for (const id of referencedIdsFromGameFlowNodes) {
    if (!assetsById[id]) missingAssetIdsSet.add(id);
  }

  const usedEntityTemplateIds = new Set<string>();
  for (const asset of assets) {
    if (asset.type !== 'screenmap' || !asset.data) continue;
    const screen = asset.data as ScreenMap;
    for (const entity of screen.layers?.entities ?? []) {
      if (entity?.entityTemplateId) usedEntityTemplateIds.add(entity.entityTemplateId);
    }
  }

  const usedComponentDefinitionIds = new Set<string>();
  for (const templateId of usedEntityTemplateIds) {
    const tpl = entityTemplatesByIdAll[templateId];
    if (!tpl) continue;
    for (const c of tpl.components ?? []) {
      if (c?.definitionId) usedComponentDefinitionIds.add(c.definitionId);
    }
  }

  const entityTemplatesById: Record<string, EntityTemplate> = Object.fromEntries(
    entityTemplates.filter(t => usedEntityTemplateIds.has(t.id)).map(t => [t.id, t])
  );

  const componentDefinitionsById: Record<string, ComponentDefinition> = Object.fromEntries(
    componentDefinitions.filter(d => usedComponentDefinitionIds.has(d.id)).map(d => [d.id, d])
  );

  for (const templateId of usedEntityTemplateIds) {
    if (!entityTemplatesByIdAll[templateId]) {
      warnings.push(`Used EntityTemplate id="${templateId}" was not found in entityTemplates list.`);
    }
  }
  for (const defId of usedComponentDefinitionIds) {
    if (!componentDefinitionsByIdAll[defId]) {
      warnings.push(`Used ComponentDefinition id="${defId}" was not found in componentDefinitions list.`);
    }
  }

  const globalVariables = assets
    .filter(a => a.type === 'globalvariables' && a.data)
    .map(a => ({ assetId: a.id, data: a.data as GlobalVariablesAsset }));

  const entryGraph = entryGameFlow?.data ?? null;
  const startNodeId = entryGraph?.startNodeId ?? null;
  const startConnections = entryGraph && startNodeId
    ? entryGraph.connections.filter(c => c.from?.nodeId === startNodeId)
    : [];
  const firstNodeId = startConnections[0]?.to?.nodeId ?? null;

  const derivedMenu = (() => {
    if (!entryGameFlow || !entryGraph || !startNodeId || !firstNodeId) return null;
    const firstNode = entryGraph.nodes.find(n => n.id === firstNodeId);
    if (!firstNode || firstNode.type !== 'SubMenu') return null;
    return {
      kind: 'GameFlowSubMenu' as const,
      gameFlowAssetId: entryGameFlow.id,
      nodeId: firstNode.id,
      title: (firstNode as any).title,
      options: (firstNode as any).options,
      appearance: (firstNode as any).appearance,
      referencedAssetIds: referencedAssetIdsFromNode(firstNode),
    };
  })();

  return {
    schema: 'mideas.intermediate_game.v1',
    exportedAt,
    project: {
      name: currentProjectName,
      screenMode: currentScreenMode,
    },
    initialization: {
      entryGameFlowAssetId: entryGameFlow?.id ?? null,
      entry: {
        gameFlowAssetId: entryGameFlow?.id ?? null,
        startNodeId,
        firstNodeId,
      },
      derivedMenu,
      globalVariables,
    },
    structure: {
      gameFlows,
      worldMaps,
    },
    catalog: {
      assetsById: catalogAssetsById,
      componentDefinitionsById,
      entityTemplatesById,
      tileBanks,
      msxFont: encodeMsxFontToHex(msxFont),
      msxFontColorAttributes: encodeMsxFontColorsToHex(msxFontColorAttributes, warnings),
    },
    diagnostics: {
      missingAssetIds: uniqueStrings(Array.from(missingAssetIdsSet)),
      warnings,
    },
  };
}
