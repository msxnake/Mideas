
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    ProjectAsset, Sprite, Tile, ScreenMap, PixelData, MSX1ColorValue, MSXColorValue, LineColorAttribute, Msx2Sprite, Msx2Bitmap, Msx2Screen4TileScreen, Msx2Screen4BitmapRoom, Msx2HudFontAsset, Msx2Screen5PresentationConfig, Msx2GameFlowGraph, PaletteAsset,
    EditorType, EntityInstance, BehaviorScript, TileBank, SpriteFrame,
    ComponentDefinition, EntityTemplate, EffectZone, ScreenEditorLayerName, ComponentPropertyDefinition, GameFlowNode, GameFlowSubMenuNode, GameFlowControlsNode, GameFlowEndNode, GameFlowStartNode, EFFECT_ZONE_TYPE_CONFIG, EffectType, WindEffectDirection, normalizeEffectZoneParams, resolveEffectZoneType, DialogueAsset, ScreenBlockExportMode, ScreenTile, TileStamp
} from '../../types';
import { Panel } from '../common/Panel';
import { SCREEN2_PIXELS_PER_COLOR_SEGMENT, MSX1_PALETTE_MAP, MSX1_PALETTE_IDX_MAP, EDITOR_BASE_TILE_DIM_S2 } from '../../constants';
import { Button } from '../common/Button';
import { CaretDownIcon, CaretRightIcon, CollapseAllIcon, TrashIcon, ViewfinderCircleIcon } from '../icons/MsxIcons';
import { AssetPickerModal } from '../modals/AssetPickerModal';
import { normalizeMsx2ShooterRuntimeConfig, buildMsx2Shooter60HzFrameBudgetSummary, resolveMsx2ShooterScrollRowRoutine } from '../../utils/msx2ShooterRuntime';
import { StartNodeEditor } from '../editors/StartNodeEditor';
import { GameFlowGlobalInitializationEditor } from '../editors/GameFlowGlobalInitializationEditor';
import { autoEventStringUsesDialogue, parseAutoEventString } from '../../utils/autoEventString';
import { resolveTileAssignmentCharCode } from '../../utils/tileBankOptimization';
import { BEHAVIOR_DIRECTION_OPTIONS, BEHAVIOR_TYPE_OPTIONS, isBehaviorComponentProperty } from '../../utils/behaviorComponentOptions';
import { generateScreenMapLayoutBytes } from '../utils/screenUtils';
import { buildScreenBlockMapFromBytes, buildSharedScreenBlockMaps } from '../../utils/screenOptimization/blockMapBuilder';
import { getScreenModeMetrics } from '../../utils/screenModeConfig';
import { ScreenBlockCatalogPanel } from '../screen_editor/ScreenBlockCatalogPanel';

const CHILD_LINK_COMPONENT_ID = 'comp_child_link';
const ENTITY_JOB_RATE_OPTIONS = [100, 50, 33, 25] as const;

const clampSpriteLayerYOffset = (value: unknown): number => {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(-16, Math.min(16, Math.trunc(numeric)));
};

const getSpriteFrameLayerPlane = (
  frame: SpriteFrame | undefined,
  paletteIndex: number,
  layerColor: MSXColorValue,
  width: number,
  height: number
): boolean[][] => {
  const storedPlane = frame?.msx1LayerData?.[paletteIndex];
  if (storedPlane) {
    return Array(height).fill(null).map((_, y) =>
      Array(width).fill(false).map((__, x) => !!storedPlane[y]?.[x])
    );
  }

  return Array(height).fill(null).map((_, y) =>
    Array(width).fill(false).map((__, x) => frame?.data?.[y]?.[x] === layerColor)
  );
};

const frameUsesSpritePaletteLayer = (
  frame: SpriteFrame,
  paletteIndex: number,
  layerColor: MSXColorValue
): boolean =>
  !!frame.msx1LayerData?.[paletteIndex]?.some(row => row.some(Boolean)) ||
  frame.data?.some(row => row?.some(pixel => pixel === layerColor));

const composeSpriteFramePreview = (sprite: Sprite, frame: SpriteFrame): PixelData => {
  const drawableLayerIndexes = sprite.spritePalette
    .map((color, index) => ({ color, index }))
    .filter(({ color }) => color && color !== sprite.backgroundColor)
    .filter(({ color, index }) => frameUsesSpritePaletteLayer(frame, index, color))
    .map(({ index }) => index);

  if (drawableLayerIndexes.length === 0) {
    return frame.data;
  }

  const offsets = drawableLayerIndexes.map(index => clampSpriteLayerYOffset(sprite.msx1LayerOffsets?.[index]?.offsetY ?? 0));
  const minOffsetY = Math.min(0, ...offsets);
  const maxOffsetY = Math.max(0, ...offsets);
  const composedHeight = sprite.size.height + maxOffsetY - minOffsetY;
  const composedData: PixelData = Array(composedHeight)
    .fill(null)
    .map(() => Array(sprite.size.width).fill(sprite.backgroundColor));

  for (const paletteIndex of drawableLayerIndexes) {
    const color = sprite.spritePalette[paletteIndex];
    if (!color || color === sprite.backgroundColor) continue;
    const plane = getSpriteFrameLayerPlane(frame, paletteIndex, color, sprite.size.width, sprite.size.height);
    const offsetY = clampSpriteLayerYOffset(sprite.msx1LayerOffsets?.[paletteIndex]?.offsetY ?? 0);
    for (let y = 0; y < sprite.size.height; y++) {
      for (let x = 0; x < sprite.size.width; x++) {
        if (!plane[y]?.[x]) continue;
        const targetY = y + offsetY - minOffsetY;
        if (targetY >= 0 && targetY < composedHeight) {
          composedData[targetY][x] = color;
        }
      }
    }
  }

  return composedData;
};

const getJobPeriodFromRate = (rate: number): number => {
  switch (rate) {
    case 50:
      return 2;
    case 33:
      return 3;
    case 25:
      return 4;
    case 100:
    default:
      return 1;
  }
};

const normalizeEntityJobRate = (value: any): number => {
  const raw = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
  if (raw === 1) return 100;
  if (raw === 2) return 50;
  if (raw === 3) return 33;
  if (raw === 4) return 25;
  if (ENTITY_JOB_RATE_OPTIONS.includes(raw as any)) return raw;
  return 100;
};

const normalizeEntityJobEntry = (value: any, period: number): number => {
  const safePeriod = Math.max(1, period | 0);
  const raw = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
  const entry = Number.isNaN(raw) ? 0 : (raw | 0);
  const wrapped = ((entry % safePeriod) + safePeriod) % safePeriod;
  return wrapped;
};

const TILEBANK_MARK_COLORS = [
  '#00dcb4',
  '#ffcc33',
  '#5b6cff',
  '#ff5f7a',
  '#7bd857',
  '#c56cff',
  '#29b6f6',
  '#ff8f3d',
] as const;

function getTileBankMarkColor(tileBankAssetId: string): string {
  if (!tileBankAssetId) return '#7f8a99';
  let hash = 0;
  for (let i = 0; i < tileBankAssetId.length; i++) {
    hash = ((hash * 31) + tileBankAssetId.charCodeAt(i)) >>> 0;
  }
  return TILEBANK_MARK_COLORS[hash % TILEBANK_MARK_COLORS.length];
}

function resolveScreenTileBankDefinitions(
  screenMap: ScreenMap,
  allAssets: ProjectAsset[],
  fallbackTileBanks?: TileBank[]
): TileBank['banks'] | undefined {
  const tileBankAssetId = screenMap.tileBankAssetId || '';
  if (tileBankAssetId) {
    const asset = allAssets.find(candidate =>
      candidate.type === 'tilebank' &&
      (candidate.id === tileBankAssetId || (candidate.data as TileBank | undefined)?.id === tileBankAssetId)
    );
    const tileBank = asset?.data as TileBank | undefined;
    if (tileBank?.banks?.length) {
      return tileBank.banks;
    }
  }

  if (fallbackTileBanks?.length === 1) {
    return fallbackTileBanks[0].banks;
  }

  return undefined;
}


/**
 * Props for the {@link PixelGridPreview} component.
 * @internal
 */
interface PixelGridPreviewProps { 
  /** The pixel data to render. */
  data: PixelData; 
  /** Optional CSS class name for the grid container. */
  className?: string;
  /** Optional fixed size for each pixel cell. If not provided, it's calculated automatically. */
  fixedCellSize?: number; 
}

/**
 * A component to display a small preview of pixel data.
 * @internal
 */
const PixelGridPreview: React.FC<PixelGridPreviewProps> = ({ data, className, fixedCellSize }) => {
  if (!data || data.length === 0 || !data[0] || data[0].length === 0) return null;
  const rows = data.length;
  const cols = data[0].length;
  
  let cellSize = fixedCellSize ?? 0;
  if (!fixedCellSize) {
    const maxDim = Math.max(rows, cols);
    const idealPreviewSize = 64; 
    cellSize = Math.max(1, Math.floor(idealPreviewSize / maxDim));
  }


  return (
    <div 
      className={`grid ${className}`} 
      style={{ 
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        width: cols * cellSize,
        height: rows * cellSize,
        imageRendering: 'pixelated',
        border: '1px solid var(--msx-border)'
      }}
    >
      {data.flat().map((color, index) => (
        <div key={index} style={{ backgroundColor: color }} />
      ))}
    </div>
  );
};

/**
 * A component to display a preview of SCREEN 2 line color attributes.
 * @internal
 */
const LineAttributesPreview: React.FC<{lineAttributes: LineColorAttribute[][]; tileWidth: number; tileHeight: number}> = ({lineAttributes, tileWidth, tileHeight}) => {
  if (!lineAttributes || lineAttributes.length === 0) return null;
  const numSegmentsPerRow = tileWidth / SCREEN2_PIXELS_PER_COLOR_SEGMENT;
  const cellSize = Math.max(2, Math.floor(64 / Math.max(numSegmentsPerRow * 2, tileHeight))); 

  return (
    <div className="space-y-0.5" style={{ imageRendering: 'pixelated', border: '1px solid var(--msx-border)'}}>
      {lineAttributes.map((row, rowIndex) => (
        <div key={rowIndex} className="flex">
          {row.map((segment, segmentIndex) => (
            <React.Fragment key={`${rowIndex}-${segmentIndex}`}>
              <div style={{width: cellSize * SCREEN2_PIXELS_PER_COLOR_SEGMENT / 2, height: cellSize, backgroundColor: segment.fg,}} title={`R${rowIndex}S${segmentIndex} FG: ${MSX1_PALETTE_MAP.get(segment.fg)?.name}`}></div>
              <div style={{width: cellSize * SCREEN2_PIXELS_PER_COLOR_SEGMENT / 2, height: cellSize, backgroundColor: segment.bg}} title={`R${rowIndex}S${segmentIndex} BG: ${MSX1_PALETTE_MAP.get(segment.bg)?.name}`}></div>
            </React.Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Props for the {@link PropertiesPanel} component.
 * @category Tools
 */
interface PropertiesPanelProps {
  /** The currently selected asset, if any. */
  asset: ProjectAsset | undefined;
  /** The currently selected entity instance in the screen editor, if any. */
  entityInstance?: EntityInstance | undefined; 
  /** The currently selected effect zone in the screen editor, if any. */
  effectZone?: EffectZone | undefined; 
  /** The currently selected node in the game flow editor, if any. */
  gameFlowNode?: GameFlowNode | undefined;
  /** Callback to update an entity instance's properties. */
  onUpdateEntityInstance?: (id: string, data: Partial<EntityInstance>) => void; 
  /** Callback to update an effect zone's properties. */
  onUpdateEffectZone?: (id: string, data: Partial<EffectZone>) => void; 
  /** Callback to update a game flow node's properties. */
  onUpdateGameFlowNode?: (id: string, data: Partial<GameFlowNode>) => void;
  /** Callback to delete an entity instance. */
  onDeleteEntityInstance?: (id: string) => void;
  /** Callback to delete an effect zone. */
  onDeleteEffectZone?: (id: string) => void; 
  /** The sprite to use for the animation preview. */
  spriteForPreview?: Sprite; 
  /** A list of all project assets. */
  allAssets: ProjectAsset[];
  /** A list of all component definitions. */
  componentDefinitions: ComponentDefinition[]; 
  /** A list of all entity templates. */
  entityTemplates: EntityTemplate[];       
  /** The current screen mode. */
  currentScreenMode: string;
  /** The type of the currently active editor. */
  activeEditorType?: EditorType; 
  /** The active layer in the screen editor. */
  screenEditorActiveLayer?: ScreenEditorLayerName; 
  /** The name of the current MSX font. */
  msxFontName?: string; 
  /** Statistics about the current MSX font. */
  msxFontStats?: { defined: number, editableTotal: number, editableDefined: number }; 
  /** The ID of the selected tile in the screen editor. */
  screenEditorSelectedTileId?: string | null;
  /** The tileset for the screen editor. */
  tilesetForScreenEditor?: Tile[];
  /** The tile banks for the screen editor. */
  tileBanksForScreenEditor?: TileBank[];
  /** The state of the waypoint picker tool. */
  waypointPickerState: { isPicking: boolean; };
  /** Callback to set the state of the waypoint picker tool. */
  onSetWaypointPickerState: (state: { isPicking: boolean; entityInstanceId: string | null; componentDefId: string | null; waypointPrefix: 'waypoint1' | 'waypoint2'; }) => void;
  /** Callback to update the selected asset's data (used to persist Sprite animation speed, etc.). */
  onUpdateAsset?: (assetId: string, data: any) => void;
  /** Callback to create a project asset without leaving the current editor. */
  onCreateAsset?: (type: ProjectAsset['type'], options?: { select?: boolean }) => ProjectAsset | void;
  /** Callback to select a Screen Editor catalog block as a temporary stamp. */
  onSelectScreenCatalogBlock?: (stamp: TileStamp) => void;
  /** ID of the currently selected catalog block stamp. */
  selectedScreenCatalogBlockId?: string | null;
  /** Optional callback to collapse the whole properties column. */
  onRequestCollapse?: () => void;
}

/**
 * A panel that displays properties for the currently selected item, which could be an asset,
 * an entity instance, an effect zone, or a game flow node. It provides controls for editing these properties.
 *
 * @param props The component props.
 * @returns A React component.
 * @category Tools
 */
export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
  asset, entityInstance, effectZone, gameFlowNode,
  onUpdateEntityInstance, onUpdateEffectZone, onUpdateGameFlowNode,
  onDeleteEntityInstance, onDeleteEffectZone,
  spriteForPreview, allAssets,
  componentDefinitions, entityTemplates, 
  currentScreenMode, activeEditorType, screenEditorActiveLayer, 
  msxFontName, msxFontStats,
  screenEditorSelectedTileId, tilesetForScreenEditor, tileBanksForScreenEditor,
  waypointPickerState, onSetWaypointPickerState,
  onUpdateAsset,
  onCreateAsset,
  onSelectScreenCatalogBlock,
  selectedScreenCatalogBlockId,
  onRequestCollapse
}) => {
  const [currentFrame, setCurrentFrame] = useState(0); 
  const [animationSpeedMs, setAnimationSpeedMs] = useState<number>(asset?.type === 'sprite' ? ((asset.data as Sprite).animationSpeedMs ?? 200) : 200); 
  const animationIntervalRef = useRef<number | null>(null);

  const [localEntityName, setLocalEntityName] = useState(entityInstance?.name || "");
  const [localEntityPosX, setLocalEntityPosX] = useState(entityInstance?.position.x.toString() || "0");
  const [localEntityPosY, setLocalEntityPosY] = useState(entityInstance?.position.y.toString() || "0");
  const [localComponentOverrides, setLocalComponentOverrides] = useState<Record<string, Record<string, any>>>(entityInstance?.componentOverrides || {});
  const [localEntityJobRate, setLocalEntityJobRate] = useState(
    String(normalizeEntityJobRate(entityInstance?.jobRate))
  );
  const [localEntityJobEntry, setLocalEntityJobEntry] = useState(() => {
    const rate = normalizeEntityJobRate(entityInstance?.jobRate);
    return String(normalizeEntityJobEntry(entityInstance?.jobEntry, getJobPeriodFromRate(rate)));
  });
  const [collapsedEntityComponentIds, setCollapsedEntityComponentIds] = useState<Record<string, boolean>>({});

  const [localEffectZoneName, setLocalEffectZoneName] = useState(effectZone?.name || "");
  const [localEffectZoneRect, setLocalEffectZoneRect] = useState(effectZone?.rect || { x: 0, y: 0, width: 4, height: 4 });
  const [localEffectZoneType, setLocalEffectZoneType] = useState<EffectType>(effectZone ? resolveEffectZoneType(effectZone) : 'secretZone');
  const [localEffectZoneParams, setLocalEffectZoneParams] = useState<Record<string, any>>(
    effectZone ? normalizeEffectZoneParams(resolveEffectZoneType(effectZone), effectZone.params) : {}
  );
  const [localEffectZoneDesc, setLocalEffectZoneDesc] = useState(effectZone?.description || "");

  const screenBlockCatalogAnalysis = useMemo(() => {
    if (activeEditorType !== EditorType.Screen || asset?.type !== 'screenmap' || !tilesetForScreenEditor) {
      return null;
    }

    const screenMap = asset.data as ScreenMap;
    const currentScreenAssetId = asset.id;
    const activeAreaX = screenMap.activeAreaX ?? 0;
    const activeAreaY = screenMap.activeAreaY ?? 0;
    const activeAreaWidth = screenMap.activeAreaWidth ?? screenMap.width;
    const activeAreaHeight = screenMap.activeAreaHeight ?? screenMap.height;
    const tileBankDefinitions = resolveScreenTileBankDefinitions(screenMap, allAssets, tileBanksForScreenEditor);
    const layoutBytes = generateScreenMapLayoutBytes(screenMap, tilesetForScreenEditor, tileBankDefinitions, currentScreenMode);
    const currentMode = screenMap.blockOptimization?.backgroundMode || 'raw';
    const currentTileBankId = screenMap.tileBankAssetId || '';

    const screenAssets = allAssets
      .filter(candidate => candidate.type === 'screenmap')
      .map(candidate => ({ asset: candidate, screen: candidate.data as ScreenMap }));
    const catalogScreens = screenAssets
      .map(({ asset: screenAsset, screen }) => {
        const tileBankAssetId = screen.tileBankAssetId || '';
        const tileBankAsset = tileBankAssetId
          ? allAssets.find(candidate => candidate.id === tileBankAssetId && candidate.type === 'tilebank')
          : null;
        return {
          assetId: screenAsset.id,
          screenId: screen.id,
          name: screen.name,
          mode: screen.blockOptimization?.backgroundMode || 'raw',
          tileBankAssetId,
          tileBankName: tileBankAsset?.name || (tileBankAssetId ? tileBankAssetId : 'No TileBank'),
          tileBankColor: getTileBankMarkColor(tileBankAssetId),
          enabled: screen.blockOptimization?.sharedCatalogEnabled === true,
          compatible:
            (screen.blockOptimization?.backgroundMode || 'raw') === currentMode &&
            tileBankAssetId === currentTileBankId &&
            currentMode !== 'raw',
        };
      });

    const buildCatalogPreview = (mode: Extract<ScreenBlockExportMode, 'blocks2x2' | 'blocks4x4'>) => {
      const groupScreens = screenAssets.filter(({ screen }) =>
        screen.blockOptimization?.sharedCatalogEnabled === true &&
        screen.blockOptimization?.backgroundMode === mode &&
        (screen.tileBankAssetId || '') === currentTileBankId
      );
      const useGlobalCatalog = screenMap.blockOptimization?.sharedCatalogEnabled === true && currentMode === mode && groupScreens.length > 0;

      if (useGlobalCatalog) {
        const groupInputs = groupScreens.map(({ asset: screenAsset, screen }, index) => {
          const width = screen.activeAreaWidth ?? screen.width;
          const height = screen.activeAreaHeight ?? screen.height;
          const definitions = resolveScreenTileBankDefinitions(screen, allAssets, tileBanksForScreenEditor);
          return {
            sourceIndex: index,
            assetId: screenAsset.id,
            screen,
            bytes: generateScreenMapLayoutBytes(screen, tilesetForScreenEditor, definitions, currentScreenMode),
            width,
            height,
            mode,
          };
        });
        const built = buildSharedScreenBlockMaps({
          screens: groupInputs.map(input => ({
            index: input.sourceIndex,
            bytes: input.bytes,
            width: input.width,
            height: input.height,
            mode,
          })),
        });
        const currentInput = groupInputs.find(input => input.assetId === currentScreenAssetId);
        const blockMap = currentInput ? built.blockMapsByScreenIndex.get(currentInput.sourceIndex) : null;
        if (!blockMap) return null;

        const usageCountByCatalogIndex = Array.from({ length: blockMap.sharedCatalog.catalog.length }, () => 0);
        built.blockMapsByScreenIndex.forEach(sharedMap => {
          sharedMap.mapIndices.forEach(catalogIndex => {
            usageCountByCatalogIndex[catalogIndex] = (usageCountByCatalogIndex[catalogIndex] ?? 0) + 1;
          });
        });
        const currentUsageCountByCatalogIndex = blockMap.mapIndices.reduce<number[]>(
          (counts, catalogIndex) => {
            counts[catalogIndex] = (counts[catalogIndex] ?? 0) + 1;
            return counts;
          },
          Array.from({ length: blockMap.sharedCatalog.catalog.length }, () => 0)
        );
        const localBlockMaps = groupInputs.map(input => ({
          input,
          blockMap: buildScreenBlockMapFromBytes({
            bytes: input.bytes,
            width: input.width,
            height: input.height,
            mode,
          }),
        }));

        const catalogEntries = blockMap.sharedCatalog.catalog.map((entry) => {
          const signature = entry.bytes.join(',');
          const source = localBlockMaps.find(candidate =>
            candidate.blockMap?.catalog.some(localEntry => localEntry.bytes.join(',') === signature)
          );
          const localEntry = source?.blockMap?.catalog.find(candidate => candidate.bytes.join(',') === signature);
          const firstMapIndex = source && localEntry
            ? source.blockMap!.mapIndices.findIndex(catalogIndex => catalogIndex === localEntry.index)
            : -1;
          const sourceScreen = source?.input.screen || screenMap;
          const sourceActiveX = sourceScreen.activeAreaX ?? 0;
          const sourceActiveY = sourceScreen.activeAreaY ?? 0;
          const sourceMap = source?.blockMap || blockMap;
          const safeMapIndex = firstMapIndex >= 0 ? firstMapIndex : 0;
          const originX = sourceActiveX + ((safeMapIndex % sourceMap.mapWidth) * sourceMap.blockWidth);
          const originY = sourceActiveY + (Math.floor(safeMapIndex / sourceMap.mapWidth) * sourceMap.blockHeight);
          const cells: ScreenTile[] = [];
          for (let localY = 0; localY < blockMap.blockHeight; localY++) {
            for (let localX = 0; localX < blockMap.blockWidth; localX++) {
              const sourceCell = sourceScreen.layers.background[originY + localY]?.[originX + localX];
              cells.push(sourceCell ? { ...sourceCell } : { tileId: null });
            }
          }
          return {
            index: entry.index,
            usageCount: currentUsageCountByCatalogIndex[entry.index] ?? 0,
            globalUsageCount: usageCountByCatalogIndex[entry.index] ?? 0,
            cells,
          };
        });

        return {
          blockWidth: blockMap.blockWidth,
          blockHeight: blockMap.blockHeight,
          uniqueBlockCount: blockMap.sharedCatalog.catalog.length,
          catalogEntries,
        };
      }

      const blockMap = buildScreenBlockMapFromBytes({
        bytes: layoutBytes,
        width: activeAreaWidth,
        height: activeAreaHeight,
        mode,
      });

      if (!blockMap) {
        return null;
      }

      const usageCountByCatalogIndex = blockMap.mapIndices.reduce<number[]>(
        (counts, catalogIndex) => {
          counts[catalogIndex] = (counts[catalogIndex] ?? 0) + 1;
          return counts;
        },
        Array.from({ length: blockMap.catalog.length }, () => 0)
      );
      const firstMapIndexByCatalogIndex = blockMap.mapIndices.reduce<number[]>(
        (firstIndexes, catalogIndex, mapIndex) => {
          if (firstIndexes[catalogIndex] === undefined) {
            firstIndexes[catalogIndex] = mapIndex;
          }
          return firstIndexes;
        },
        []
      );

      const catalogEntries = blockMap.catalog.map((entry) => {
        const firstMapIndex = firstMapIndexByCatalogIndex[entry.index] ?? 0;
        const originX = activeAreaX + ((firstMapIndex % blockMap.mapWidth) * blockMap.blockWidth);
        const originY = activeAreaY + (Math.floor(firstMapIndex / blockMap.mapWidth) * blockMap.blockHeight);
        const cells: ScreenTile[] = [];
        for (let localY = 0; localY < blockMap.blockHeight; localY++) {
          for (let localX = 0; localX < blockMap.blockWidth; localX++) {
            const sourceCell = screenMap.layers.background[originY + localY]?.[originX + localX];
            cells.push(sourceCell ? { ...sourceCell } : { tileId: null });
          }
        }
        return {
          index: entry.index,
          usageCount: usageCountByCatalogIndex[entry.index] ?? 0,
          cells,
        };
      });

      return {
        blockWidth: blockMap.blockWidth,
        blockHeight: blockMap.blockHeight,
        uniqueBlockCount: blockMap.catalog.length,
        catalogEntries,
      };
    };

    return {
      currentMode,
      editorBaseTileDim: getScreenModeMetrics(currentScreenMode).baseTileSize,
      sharedCatalogEnabled: screenMap.blockOptimization?.sharedCatalogEnabled === true,
      catalogScreens,
      blocks2x2: buildCatalogPreview('blocks2x2'),
      blocks4x4: buildCatalogPreview('blocks4x4'),
    };
  }, [activeEditorType, allAssets, asset, currentScreenMode, tileBanksForScreenEditor, tilesetForScreenEditor]);
  
  useEffect(() => {
    if (gameFlowNode) {
      console.log("PropertiesPanel gameFlowNode updated:", gameFlowNode);
    }
  }, [gameFlowNode]);

  const [assetPickerState, setAssetPickerState] = useState<{
    isOpen: boolean;
    assetTypeToPick: ProjectAsset['type'] | null;
    onSelect: ((assetId: string) => void) | null;
    currentValue: string | null;
  }>({ isOpen: false, assetTypeToPick: null, onSelect: null, currentValue: null });

  const handleSharedCatalogToggle = (screenAssetId: string, enabled: boolean) => {
    const targetAsset = allAssets.find(candidate => candidate.id === screenAssetId && candidate.type === 'screenmap');
    const targetScreen = targetAsset?.data as ScreenMap | undefined;
    if (!targetScreen || !onUpdateAsset) return;
    onUpdateAsset(screenAssetId, {
      blockOptimization: {
        ...(targetScreen.blockOptimization || {}),
        sharedCatalogEnabled: enabled,
      },
    });
  };

  const handleSelectScreenCatalogBlock = (
    entry: { index: number; cells: ScreenTile[] },
    blockWidth: number,
    blockHeight: number
  ) => {
    if (!onSelectScreenCatalogBlock || !screenBlockCatalogAnalysis) return;

    const rows: ScreenTile[][] = [];
    for (let y = 0; y < blockHeight; y++) {
      const row: ScreenTile[] = [];
      for (let x = 0; x < blockWidth; x++) {
        const cell = entry.cells[y * blockWidth + x];
        row.push(cell ? { ...cell } : { tileId: null });
      }
      rows.push(row);
    }

    const mode = blockWidth === 4 && blockHeight === 4 ? 'blocks4x4' : 'blocks2x2';
    onSelectScreenCatalogBlock({
      id: `catalog:${mode}:${entry.index}`,
      name: `Catalog #${entry.index} (${blockWidth}x${blockHeight})`,
      width: blockWidth,
      height: blockHeight,
      tiles: rows,
    });
  };

  const assetsWithEntityTemplates = useMemo(() => {
    if (!entityTemplates || entityTemplates.length === 0) {
      return allAssets;
    }

    const existingEntityTemplateIds = new Set(
      allAssets
        .filter(asset => asset.type === 'entitytemplate')
        .map(asset => asset.id)
    );

    const syntheticTemplateAssets = entityTemplates
      .filter(template => template && !existingEntityTemplateIds.has(template.id))
      .map<ProjectAsset>(template => ({
        id: template.id,
        name: template.name || template.id,
        type: 'entitytemplate',
        data: template,
      }));

    return syntheticTemplateAssets.length > 0
      ? [...allAssets, ...syntheticTemplateAssets]
      : allAssets;
  }, [allAssets, entityTemplates]);

  const screenMapFromAsset = useMemo<ScreenMap | null>(() => {
    if (asset?.type === 'screenmap') {
      return asset.data as ScreenMap;
    }
    return null;
  }, [asset]);

  const entityTemplateNameLookup = useMemo(() => {
    const lookup = new Map<string, string>();
    entityTemplates.forEach(template => {
      if (template?.id) {
        lookup.set(template.id, template.name || template.id);
      }
    });
    return lookup;
  }, [entityTemplates]);

  const availableChildLinkParents = useMemo(() => {
    if (!entityInstance || !screenMapFromAsset) return [];
    return screenMapFromAsset.layers.entities
      .filter(instance => instance.id !== entityInstance.id)
      .map(instance => ({
        id: instance.id,
        name: instance.name || instance.id,
        templateId: instance.entityTemplateId,
        templateName: entityTemplateNameLookup.get(instance.entityTemplateId) || instance.entityTemplateId,
      }));
  }, [entityInstance, screenMapFromAsset, entityTemplateNameLookup]);


  useEffect(() => {
    if (entityInstance) {
      setLocalEntityName(entityInstance.name);
      setLocalEntityPosX(entityInstance.position.x.toString());
      setLocalEntityPosY(entityInstance.position.y.toString());
      setLocalComponentOverrides(JSON.parse(JSON.stringify(entityInstance.componentOverrides || {})));
      const normalizedRate = normalizeEntityJobRate(entityInstance.jobRate);
      setLocalEntityJobRate(String(normalizedRate));
      setLocalEntityJobEntry(
        String(normalizeEntityJobEntry(entityInstance.jobEntry, getJobPeriodFromRate(normalizedRate)))
      );
    } else {
      setLocalEntityName(""); setLocalEntityPosX("0"); setLocalEntityPosY("0"); setLocalComponentOverrides({});
      setLocalEntityJobRate("100");
      setLocalEntityJobEntry("0");
    }
  }, [entityInstance]);
  
  useEffect(() => {
    if (effectZone) {
      const resolvedType = resolveEffectZoneType(effectZone);
      setLocalEffectZoneName(effectZone.name);
      setLocalEffectZoneRect({ ...effectZone.rect });
      setLocalEffectZoneType(resolvedType);
      setLocalEffectZoneParams(normalizeEffectZoneParams(resolvedType, effectZone.params));
      setLocalEffectZoneDesc(effectZone.description || "");
    } else {
      setLocalEffectZoneName("");
      setLocalEffectZoneRect({ x: 0, y: 0, width: 4, height: 4 });
      setLocalEffectZoneType('secretZone');
      setLocalEffectZoneParams({});
      setLocalEffectZoneDesc("");
    }
  }, [effectZone]);

  // Keep local preview speed in sync with selected sprite asset
  useEffect(() => {
    if (asset?.type === 'sprite') {
      const s = asset.data as Sprite;
      setAnimationSpeedMs(typeof s.animationSpeedMs === 'number' ? s.animationSpeedMs : 200);
    }
  }, [asset?.id]);

  const openAssetPicker = (
    propertyType: ComponentPropertyDefinition['type'],
    currentValue: string,
    onSelectCallback: (assetId: string) => void
  ) => {
    const assetTypeMap: Record<string, ProjectAsset['type']> = {
        'sprite_ref': 'sprite',
        'sound_ref': 'sound',
        'behavior_script_ref': 'behavior',
        'entity_template_ref': 'entitytemplate',
        'statemachine_ref': 'statemachine',
        'tile_ref': 'tile',
        'dialogue_ref': 'dialogue',
    };
    const assetType = assetTypeMap[propertyType];
    if (!assetType) return;

    setAssetPickerState({
        isOpen: true,
        assetTypeToPick: assetType,
        onSelect: onSelectCallback,
        currentValue: currentValue,
    });
  };


  const handleEntityPropertyChange = (prop: 'name' | `position.x` | `position.y`, value: string) => {
    if (!entityInstance || !onUpdateEntityInstance) return;
    let updatePayload: Partial<EntityInstance> = {};
    if (prop === 'name') { setLocalEntityName(value); updatePayload.name = value; }
    else if (prop === 'position.x') { setLocalEntityPosX(value); const numX = parseInt(value, 10); if (!isNaN(numX)) { updatePayload.position = { ...entityInstance.position, x: numX }; }} 
    else if (prop === 'position.y') { setLocalEntityPosY(value); const numY = parseInt(value, 10); if (!isNaN(numY)) { updatePayload.position = { ...entityInstance.position, y: numY }; }}
    if (Object.keys(updatePayload).length > 0) { onUpdateEntityInstance(entityInstance.id, updatePayload); }
  };

  const handleEntityJobRateChange = (value: string) => {
    if (!entityInstance || !onUpdateEntityInstance) return;
    const normalizedRate = normalizeEntityJobRate(value);
    const period = getJobPeriodFromRate(normalizedRate);
    const normalizedEntry = normalizeEntityJobEntry(localEntityJobEntry, period);
    setLocalEntityJobRate(String(normalizedRate));
    setLocalEntityJobEntry(String(normalizedEntry));
    onUpdateEntityInstance(entityInstance.id, {
      jobRate: normalizedRate,
      jobEntry: normalizedEntry,
    });
  };

  const handleEntityJobEntryChange = (value: string) => {
    if (!entityInstance || !onUpdateEntityInstance) return;
    const normalizedRate = normalizeEntityJobRate(localEntityJobRate);
    const period = getJobPeriodFromRate(normalizedRate);
    const normalizedEntry = normalizeEntityJobEntry(value, period);
    setLocalEntityJobEntry(String(normalizedEntry));
    onUpdateEntityInstance(entityInstance.id, { jobEntry: normalizedEntry });
  };

  const handleComponentOverrideChange = (componentDefId: string, propertyName: string, value: any, propertyType: ComponentPropertyDefinition['type']) => {
    if (!entityInstance || !onUpdateEntityInstance) return;
    
    let processedValue = value;
    if (propertyType === 'byte' || propertyType === 'word') {
        processedValue = parseInt(value, 10);
        if (isNaN(processedValue)) processedValue = 0; // Default to 0 if parse fails
    } else if (propertyType === 'boolean') {
        processedValue = value === 'true' || value === true; // Handle string 'true' from select or actual boolean
    }

    const newOverrides = JSON.parse(JSON.stringify(localComponentOverrides));
    if (!newOverrides[componentDefId]) {
      newOverrides[componentDefId] = {};
    }
    newOverrides[componentDefId][propertyName] = processedValue;
    setLocalComponentOverrides(newOverrides);
    onUpdateEntityInstance(entityInstance.id, { componentOverrides: newOverrides });
  };

  const applyChildLinkOverrides = (componentDefId: string, updates: Record<string, string | null>) => {
    if (!entityInstance || !onUpdateEntityInstance) return;
    const newOverrides = JSON.parse(JSON.stringify(localComponentOverrides));
    if (!newOverrides[componentDefId]) {
      newOverrides[componentDefId] = {};
    }

    Object.entries(updates).forEach(([key, val]) => {
      if (val === null) {
        delete newOverrides[componentDefId][key];
      } else {
        newOverrides[componentDefId][key] = val;
      }
    });

    setLocalComponentOverrides(newOverrides);
    onUpdateEntityInstance(entityInstance.id, { componentOverrides: newOverrides });
  };

  const handleChildLinkParentSelection = (componentDefId: string, parentInstanceId: string) => {
    if (!entityInstance || !onUpdateEntityInstance) return;
    if (!parentInstanceId) {
      applyChildLinkOverrides(componentDefId, {
        parentInstanceId: null,
        parentInstanceName: null,
        parentTemplateId: null,
      });
      return;
    }

    const selectedParent = availableChildLinkParents.find(parent => parent.id === parentInstanceId);
    applyChildLinkOverrides(componentDefId, {
      parentInstanceId,
      parentInstanceName: selectedParent?.name || '',
      parentTemplateId: selectedParent?.templateId || '',
    });
  };

  const handleDeleteEntityClick = () => { if (entityInstance && onDeleteEntityInstance) { onDeleteEntityInstance(entityInstance.id); }};

  const getEntityComponentCollapseKey = (componentDefId: string) =>
    entityInstance ? `${entityInstance.id}:${componentDefId}` : componentDefId;

  const isEntityComponentCollapsed = (componentDefId: string) =>
    !!collapsedEntityComponentIds[getEntityComponentCollapseKey(componentDefId)];

  const setEntityComponentCollapsed = (componentDefId: string, isCollapsed: boolean) => {
    const collapseKey = getEntityComponentCollapseKey(componentDefId);
    setCollapsedEntityComponentIds(prev => ({ ...prev, [collapseKey]: isCollapsed }));
  };

  const collapseEntityComponents = (componentDefIds: string[]) => {
    setCollapsedEntityComponentIds(prev => {
      const next = { ...prev };
      componentDefIds.forEach(componentDefId => {
        next[getEntityComponentCollapseKey(componentDefId)] = true;
      });
      return next;
    });
  };

  const renderEntityComponentPanel = (componentDef: ComponentDefinition, children: React.ReactNode): React.ReactNode => {
    const isCollapsed = isEntityComponentCollapsed(componentDef.id);

    return (
      <div key={componentDef.id} className="p-1.5 border border-msx-border/50 rounded bg-msx-bgcolor/30">
        <div className="flex items-center justify-between gap-2">
          <h5 className="min-w-0 truncate text-xs text-msx-highlight" title={componentDef.name}>
            {componentDef.name}
          </h5>
          <button
            type="button"
            onClick={() => setEntityComponentCollapsed(componentDef.id, !isCollapsed)}
            className="shrink-0 p-0.5 text-msx-textsecondary hover:text-msx-textprimary hover:bg-msx-border rounded"
            title={isCollapsed ? 'Expand component' : 'Collapse component'}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? `Expand ${componentDef.name}` : `Collapse ${componentDef.name}`}
          >
            {isCollapsed ? <CaretRightIcon className="w-3.5 h-3.5" /> : <CaretDownIcon className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className={isCollapsed ? 'hidden' : 'mt-1'}>
          {children}
        </div>
      </div>
    );
  };

  const handleEffectZoneNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!effectZone || !onUpdateEffectZone) return;
    setLocalEffectZoneName(e.target.value);
    onUpdateEffectZone(effectZone.id, { name: e.target.value });
  };
  const handleEffectZoneRectChange = (field: keyof EffectZone['rect'], value: string) => {
    if (!effectZone || !onUpdateEffectZone) return;
    const parsedValue = parseInt(value, 10);
    const numValue = Number.isNaN(parsedValue) ? 0 : parsedValue;
    const newRect = { ...localEffectZoneRect, [field]: numValue };
    setLocalEffectZoneRect(newRect);
    onUpdateEffectZone(effectZone.id, { rect: newRect });
  };
  const handleEffectZoneTypeChange = (value: EffectType) => {
    if (!effectZone || !onUpdateEffectZone) return;
    const normalizedParams = normalizeEffectZoneParams(value, localEffectZoneParams);
    setLocalEffectZoneType(value);
    setLocalEffectZoneParams(normalizedParams);
    onUpdateEffectZone(effectZone.id, { effectType: value, params: normalizedParams });
  };
  const handleWindEffectParamChange = (field: 'direction' | 'strength', value: string) => {
    if (!effectZone || !onUpdateEffectZone) return;
    const nextParams = normalizeEffectZoneParams(localEffectZoneType, {
      ...localEffectZoneParams,
      [field]: field === 'strength' ? parseInt(value, 10) : value,
    });
    setLocalEffectZoneParams(nextParams);
    onUpdateEffectZone(effectZone.id, { params: nextParams });
  };
  const handleEffectZoneDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!effectZone || !onUpdateEffectZone) return;
    setLocalEffectZoneDesc(e.target.value);
    onUpdateEffectZone(effectZone.id, { description: e.target.value });
  };
  const handleDeleteEffectZoneClick = () => { if (effectZone && onDeleteEffectZone) { onDeleteEffectZone(effectZone.id); }};


  useEffect(() => {
    if (spriteForPreview && spriteForPreview.frames.length > 1) {
      if (animationIntervalRef.current) { clearInterval(animationIntervalRef.current); }
      animationIntervalRef.current = window.setInterval(() => { setCurrentFrame(prevFrame => (prevFrame + 1) % spriteForPreview.frames.length); }, animationSpeedMs);
    } else { setCurrentFrame(0); if (animationIntervalRef.current) { clearInterval(animationIntervalRef.current); animationIntervalRef.current = null; }}
    return () => { if (animationIntervalRef.current) { clearInterval(animationIntervalRef.current); }};
  }, [spriteForPreview?.frames.length, animationSpeedMs]); 
  
  useEffect(() => { setCurrentFrame(0); }, [spriteForPreview?.id]);

  let charCodesForDrawingTile: string | React.ReactNode = "";
  if (activeEditorType === EditorType.Screen && screenEditorSelectedTileId && tilesetForScreenEditor) {
    const selectedTileAsset = tilesetForScreenEditor.find(t => t.id === screenEditorSelectedTileId);
    if (selectedTileAsset) {
        if (currentScreenMode === "SCREEN 2 (Graphics I)" && tileBanksForScreenEditor) {
            const allBankDefinitions = tileBanksForScreenEditor.flatMap(tb => tb.banks || []);
            const bank = allBankDefinitions.find(b => (b.enabled ?? true) && b.assignedTiles[selectedTileAsset.id]);
            if (bank) {
                const assignment = bank.assignedTiles[selectedTileAsset.id] as any;
                const numCharsX = Math.ceil(selectedTileAsset.width / EDITOR_BASE_TILE_DIM_S2);
                const numCharsY = Math.ceil(selectedTileAsset.height / EDITOR_BASE_TILE_DIM_S2);
                const codes = [];
                for (let y = 0; y < numCharsY; y++) {
                    for (let x = 0; x < numCharsX; x++) {
                        codes.push(resolveTileAssignmentCharCode(assignment, selectedTileAsset, x, y) ?? 0);
                    }
                }
                charCodesForDrawingTile = codes.join(', ');
            } else {
                charCodesForDrawingTile = <span className="text-msx-danger">None (Not in any bank)</span>;
            }
        } else if (currentScreenMode !== "SCREEN 2 (Graphics I)") {
            charCodesForDrawingTile = "N/A (Non-S2 Mode)";
        }
    }
  }

  /**
   * Renders the properties for the currently selected asset.
   * @returns A React node with the asset's properties.
   */
  const renderAssetProperties = (): React.ReactNode => {
    if (!asset) return <p className="text-msx-textsecondary">No asset selected.</p>;
    switch (asset.type) {
      case 'tile': const tile = asset.data as Tile; return ( <div className="space-y-1"> <div><strong className="text-msx-highlight">Name:</strong> {tile.name}</div> <div><strong className="text-msx-highlight">Size:</strong> {tile.width}x{tile.height} px</div> <div><strong className="text-msx-highlight">MapID:</strong> {tile.logicalProperties.mapId} (Family: {tile.logicalProperties.familyId}, Inst: {tile.logicalProperties.instanceId})</div> {tile.lineAttributes && currentScreenMode === "SCREEN 2 (Graphics I)" && <LineAttributesPreview lineAttributes={tile.lineAttributes} tileWidth={tile.width} tileHeight={tile.height} />} <PixelGridPreview data={tile.data} className="mt-1" /> </div> );
      case 'sprite': {
        const sprite = asset.data as Sprite;
        const currentSpriteFrame = sprite.frames[currentFrame];
        const composedPreviewData = currentSpriteFrame ? composeSpriteFramePreview(sprite, currentSpriteFrame) : null;
        const visibleHeight = composedPreviewData?.length ?? sprite.size.height;
        return (
          <div className="space-y-1">
            <div><strong className="text-msx-highlight">Name:</strong> {sprite.name}</div>
            <div><strong className="text-msx-highlight">Size:</strong> {sprite.size.width}x{sprite.size.height} px</div>
            {visibleHeight !== sprite.size.height && (
              <div><strong className="text-msx-highlight">Visible:</strong> {sprite.size.width}x{visibleHeight} px</div>
            )}
            <div><strong className="text-msx-highlight">Frames:</strong> {sprite.frames.length}</div>
            {composedPreviewData && <PixelGridPreview data={composedPreviewData} className="mt-1"/>}
            <label className="text-xs">Anim Speed (ms):
              <input
                type="number"
                value={isNaN(animationSpeedMs) ? '' : animationSpeedMs}
                onChange={e => {
                  const v = parseInt(e.target.value);
                  setAnimationSpeedMs(v);
                  onUpdateAsset && onUpdateAsset(asset.id, { animationSpeedMs: v });
                }}
                min="50" max="2000" step="50"
                className="w-16 p-0.5 bg-msx-bgcolor border-msx-border rounded"
              />
            </label>
          </div>
        );
      }
      case 'msx2sprite': {
        const sprite = asset.data as Msx2Sprite;
        const frameCount = sprite.frames?.length || 0;
        const currentFrameData = sprite.frames?.[sprite.currentFrameIndex ?? 0]?.data || sprite.frames?.[0]?.data;
        const metaColumns = Math.max(1, Math.ceil(sprite.size.width / 16));
        const metaRows = Math.max(1, Math.ceil(sprite.size.height / 16));
        const metaParts = sprite.superSpriteParts?.length || (metaColumns * metaRows);
        return (
          <div className="space-y-1">
            <div><strong className="text-msx-highlight">Name:</strong> {sprite.name}</div>
            <div><strong className="text-msx-highlight">Mode:</strong> MSX2 hardware sprite</div>
            <div><strong className="text-msx-highlight">Size:</strong> {sprite.size.width}x{sprite.size.height} px</div>
            <div><strong className="text-msx-highlight">MetaSprite:</strong> {sprite.superSpriteLayout || `${metaColumns}x${metaRows}`} / {metaParts} part{metaParts === 1 ? '' : 's'}</div>
            <div><strong className="text-msx-highlight">Frames:</strong> {frameCount}</div>
            <div><strong className="text-msx-highlight">Pattern:</strong> {sprite.hardware.patternIndex}</div>
            <div><strong className="text-msx-highlight">Position:</strong> {sprite.hardware.x},{sprite.hardware.y}</div>
            {currentFrameData && <PixelGridPreview data={currentFrameData} className="mt-1" />}
          </div>
        );
      }
      case 'msx2bitmap': {
        const bitmap = asset.data as Msx2Bitmap;
        return (
          <div className="space-y-1">
            <div><strong className="text-msx-highlight">Name:</strong> {bitmap.name}</div>
            <div><strong className="text-msx-highlight">Mode:</strong> {bitmap.vdpMode}</div>
            <div><strong className="text-msx-highlight">Size:</strong> {bitmap.size.width}x{bitmap.size.height} px</div>
            <div><strong className="text-msx-highlight">Palette slots:</strong> {bitmap.palette?.length || 0}</div>
            <div><strong className="text-msx-highlight">Transparent slot:</strong> {bitmap.transparentSlot ?? 'None'}</div>
          </div>
        );
      }
      case 'msx2screen': {
        const screen = asset.data as Msx2Screen4TileScreen;
        const tileCount = screen.tiles?.length || 0;
        const entityCount = screen.layers?.entities?.length || 0;
        const collisionRows = screen.layers?.collision?.length || screen.collisionMap?.length || 0;
        const shooter = screen.runtime?.screenEngine === 'shooter'
          ? normalizeMsx2ShooterRuntimeConfig(screen.runtime.shooter)
          : null;
        const activeIrqProfile = shooter?.budget.irqProfiles.find(profile => profile.id === shooter.budget.activeIrqProfile);
        const shooterFrameBudget = shooter
          ? buildMsx2Shooter60HzFrameBudgetSummary(shooter, {
            scrollRowRoutine: resolveMsx2ShooterScrollRowRoutine(shooter, {
              movementMode: screen.runtime?.movementMode || screen.runtime?.movementModel,
            }),
          })
          : null;
        return (
          <div className="space-y-1">
            <div><strong className="text-msx-highlight">Name:</strong> {screen.name}</div>
            <div><strong className="text-msx-highlight">Mode:</strong> MSX2 SCREEN 4</div>
            <div><strong className="text-msx-highlight">Screen:</strong> {screen.widthTiles}x{screen.heightTiles} anchors ({screen.widthTiles * screen.tileSize}x{screen.heightTiles * screen.tileSize} px)</div>
            <div><strong className="text-msx-highlight">Tile anchor:</strong> {screen.tileSize} px</div>
            <div><strong className="text-msx-highlight">Tiles:</strong> {tileCount}</div>
            <div><strong className="text-msx-highlight">Entities:</strong> {entityCount}</div>
            <div><strong className="text-msx-highlight">Runtime:</strong> {screen.runtime?.screenKind || 'playable'} / {screen.runtime?.screenEngine || 'player'}</div>
            {shooter && (
              <div><strong className="text-msx-highlight">Shooter:</strong> {shooter.direction} 60Hz / {activeIrqProfile?.id || shooter.budget.activeIrqProfile} / {shooterFrameBudget?.worstCaseHeadroomCycles ?? '?'} cyc headroom</div>
            )}
            <div><strong className="text-msx-highlight">Collision rows:</strong> {collisionRows}</div>
          </div>
        );
      }
      case 'msx2hudfont': {
        const font = asset.data as Msx2HudFontAsset;
        return (
          <div className="space-y-1">
            <div><strong className="text-msx-highlight">Name:</strong> {asset.name}</div>
            <div><strong className="text-msx-highlight">Mode:</strong> {font.vdpMode}</div>
            <div><strong className="text-msx-highlight">Base char:</strong> {font.baseChar}</div>
            <div><strong className="text-msx-highlight">Characters:</strong> {font.characters?.length || 0}</div>
            <div><strong className="text-msx-highlight">Patterns:</strong> {Object.keys(font.patterns || {}).length}</div>
            <div><strong className="text-msx-highlight">Color byte:</strong> #{(font.colorByte ?? 0).toString(16).padStart(2, '0').toUpperCase()}</div>
          </div>
        );
      }
      case 'msx2presentation': {
        const presentation = asset.data as Msx2Screen5PresentationConfig;
        return (
          <div className="space-y-1">
            <div><strong className="text-msx-highlight">Name:</strong> {presentation.name || asset.name}</div>
            <div><strong className="text-msx-highlight">Mode:</strong> {presentation.screenMode}</div>
            <div><strong className="text-msx-highlight">Target:</strong> {presentation.width}x{presentation.height}</div>
            <div><strong className="text-msx-highlight">Source:</strong> {presentation.sourceFileName || 'None'}</div>
            <div><strong className="text-msx-highlight">Fit:</strong> {presentation.fitMode}</div>
            <div><strong className="text-msx-highlight">Compression:</strong> {presentation.compression?.enabled ? presentation.compression.codec : 'none'}</div>
          </div>
        );
      }
      case 'msx2gameflow': {
        const flow = asset.data as Msx2GameFlowGraph;
        return (
          <div className="space-y-1">
            <div><strong className="text-msx-highlight">Name:</strong> {flow.name || asset.name}</div>
            <div><strong className="text-msx-highlight">Target:</strong> {flow.target}</div>
            <div><strong className="text-msx-highlight">Purpose:</strong> {flow.purpose || 'screen5-presentation'}</div>
            <div><strong className="text-msx-highlight">Nodes:</strong> {flow.nodes?.length || 0}</div>
            <div><strong className="text-msx-highlight">Connections:</strong> {flow.connections?.length || 0}</div>
          </div>
        );
      }
      case 'msx2bitmaproom': {
        const room = asset.data as Msx2Screen4BitmapRoom;
        const commandCount = room.composition?.commands?.length || 0;
        const atlasEntries = room.atlas?.entries?.length || 0;
        const collisionRows = room.collision?.length || 0;
        return (
          <div className="space-y-1">
            <div><strong className="text-msx-highlight">Name:</strong> {room.name}</div>
            <div><strong className="text-msx-highlight">Mode:</strong> MSX2 SCREEN 5 bitmap room</div>
            <div><strong className="text-msx-highlight">Screen:</strong> {room.width}x{room.height} px</div>
            <div><strong className="text-msx-highlight">Atlas:</strong> {room.atlas?.width || 0}x{room.atlas?.height || 0} px / {atlasEntries} entries</div>
            <div><strong className="text-msx-highlight">Commands:</strong> {commandCount}</div>
            <div><strong className="text-msx-highlight">Export:</strong> PGT/PNT/CGT, 3 banks</div>
            <div><strong className="text-msx-highlight">Collision rows:</strong> {collisionRows}</div>
          </div>
        );
      }
      case 'palette': {
        const palette = asset.data as PaletteAsset;
        return (
          <div className="space-y-1">
            <div><strong className="text-msx-highlight">Name:</strong> {asset.name}</div>
            <div><strong className="text-msx-highlight">Mode:</strong> MSX2 V9938</div>
            <div><strong className="text-msx-highlight">Slots:</strong> {palette?.slots?.length || 0}</div>
          </div>
        );
      }
      case 'screenmap': {
        const map = asset.data as ScreenMap;
        const screenKind = map.screenKind ?? 'playable';
        const screenEngine = map.screenEngine ?? (screenKind === 'playable' ? 'player' : 'fakePlayer');
        return ( <div className="space-y-1"> <div><strong className="text-msx-highlight">Name:</strong> {map.name}</div> <div><strong className="text-msx-highlight">Type:</strong> {screenKind}</div> <div><strong className="text-msx-highlight">Engine:</strong> {screenEngine}</div> <div><strong className="text-msx-highlight">Size:</strong> {map.width}x{map.height} cells</div> <div><strong className="text-msx-highlight">Entities:</strong> {map.layers.entities.length}</div> <div><strong className="text-msx-highlight">Effect Zones:</strong> {map.effectZones?.length || 0}</div> </div> );
      }
      case 'code': case 'behavior': const codeData = typeof asset.data === 'string' ? asset.data : (asset.data as BehaviorScript)?.code; return ( <div className="space-y-1"> <div><strong className="text-msx-highlight">Name:</strong> {asset.name}</div> <div className="text-xs text-msx-textsecondary truncate" title={codeData}>Content: {codeData?.substring(0, 50)}...</div> </div> );
      case 'dialogue': {
        const dialogue = asset.data as DialogueAsset;
        return (
          <div className="space-y-1">
            <div><strong className="text-msx-highlight">Name:</strong> {asset.name}</div>
            <div><strong className="text-msx-highlight">Lines:</strong> {dialogue?.lines?.length || 0}</div>
            <div><strong className="text-msx-highlight">Box:</strong> {dialogue?.box?.x ?? 0},{dialogue?.box?.y ?? 0} {dialogue?.box?.width ?? 0}x{dialogue?.box?.height ?? 0}</div>
            <div><strong className="text-msx-highlight">Delay:</strong> {dialogue?.exportOptions?.charDelayFrames ?? 0} frames/char</div>
          </div>
        );
      }
      case 'globalvariables':
        const globalVarsData = asset.data as any;
        const customVars = globalVarsData?.customVariables || [];
        return (
          <div className="space-y-2">
            <div><strong className="text-msx-highlight">Name:</strong> {asset.name}</div>
            <div><strong className="text-msx-highlight">Custom Variables:</strong> {customVars.length}</div>
            {customVars.length > 0 && (
              <div className="mt-2">
                <div className="text-xs font-bold text-msx-highlight mb-1">Variables List:</div>
                <div className="space-y-1 max-h-64 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  {customVars.map((variable: any, idx: number) => (
                    <div key={idx} className="p-2 bg-msx-bgcolor-dark rounded text-xs">
                      <div className="font-bold text-msx-textprimary">{variable.name}</div>
                      <div className="text-msx-textsecondary">
                        Type: {variable.type} | Category: {variable.category}
                      </div>
                      {variable.description && (
                        <div className="text-msx-textsecondary italic text-xs mt-1">
                          {variable.description}
                        </div>
                      )}
                      {variable.values && variable.values.length > 0 && (
                        <div className="text-msx-textsecondary text-xs mt-1">
                          Values: {variable.values.map((v: any) => v.label).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {customVars.length === 0 && (
              <div className="text-xs text-msx-textsecondary italic">No custom variables defined yet.</div>
            )}
          </div>
        );
      default: return <p className="text-msx-textsecondary">Properties for {asset.type} not yet implemented.</p>;
    }
  };
  
  /**
   * Renders the properties for the currently selected entity instance.
   * @returns A React node with the entity instance's properties.
   */
  const renderEntityInstanceProperties = (): React.ReactNode => {
    if (!entityInstance || !onUpdateEntityInstance) return null;
    const template = entityTemplates.find(t => t.id === entityInstance.entityTemplateId);

    // Handle orphaned entities (template not found)
    if (!template) {
      return (
        <div className="space-y-3">
          <p className="text-red-500 font-semibold">⚠️ Error: Entity template not found!</p>
          <p className="text-xs text-msx-textsecondary">
            This entity references a template that no longer exists.<br/>
            Template ID: <code className="text-xs">{entityInstance.entityTemplateId}</code>
          </p>
          <Button
            onClick={handleDeleteEntityClick}
            variant="danger"
            size="sm"
            icon={<TrashIcon />}
            className="w-full mt-2"
          >
            Delete Orphaned Entity
          </Button>
        </div>
      );
    }
  
    const handlePickWaypoint = (prefix: 'waypoint1' | 'waypoint2') => {
      if (entityInstance) {
        onSetWaypointPickerState({
          isPicking: true,
          entityInstanceId: entityInstance.id,
          componentDefId: 'comp_patrol',
          waypointPrefix: prefix,
        });
      }
    };

    const currentJobRate = normalizeEntityJobRate(localEntityJobRate);
    const currentJobPeriod = getJobPeriodFromRate(currentJobRate);
    const currentJobEntry = normalizeEntityJobEntry(localEntityJobEntry, currentJobPeriod);
    const jobEntryOptions = Array.from({ length: currentJobPeriod }, (_, index) => index);
    const renderedComponentDefIds = template.components
      .map(templateComponent => templateComponent.definitionId)
      .filter(definitionId => componentDefinitions.some(componentDef => componentDef.id === definitionId));
    const areAllEntityComponentsCollapsed = renderedComponentDefIds.length > 0
      && renderedComponentDefIds.every(componentDefId => isEntityComponentCollapsed(componentDefId));
  
    return (
      <div className="space-y-3">
        {waypointPickerState.isPicking && (
          <div className="p-2 bg-msx-accent/20 text-msx-accent text-xs rounded mb-2 text-center animate-pulse">
            Click on the screen grid...
          </div>
        )}
        <div>
          <label htmlFor="entityName" className="block text-xs text-msx-textsecondary mb-0.5">Instance Name:</label>
          <input id="entityName" type="text" value={localEntityName} onChange={e => handleEntityPropertyChange('name', e.target.value)} className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="entityPosX" className="block text-xs text-msx-textsecondary mb-0.5">Position X (cell):</label>
            <input id="entityPosX" type="number" value={localEntityPosX} onChange={e => handleEntityPropertyChange('position.x', e.target.value)} className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded" />
          </div>
          <div>
            <label htmlFor="entityPosY" className="block text-xs text-msx-textsecondary mb-0.5">Position Y (cell):</label>
            <input id="entityPosY" type="number" value={localEntityPosY} onChange={e => handleEntityPropertyChange('position.y', e.target.value)} className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="entityJobRate" className="block text-xs text-msx-textsecondary mb-0.5">Job:</label>
            <select
              id="entityJobRate"
              value={String(currentJobRate)}
              onChange={e => handleEntityJobRateChange(e.target.value)}
              className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded"
            >
              <option value="100">100%</option>
              <option value="50">50%</option>
              <option value="33">33%</option>
              <option value="25">25%</option>
            </select>
          </div>
          <div>
            <label htmlFor="entityJobEntry" className="block text-xs text-msx-textsecondary mb-0.5">
              Entry (0..{Math.max(0, currentJobPeriod - 1)}):
            </label>
            <select
              id="entityJobEntry"
              value={String(currentJobEntry)}
              onChange={e => handleEntityJobEntryChange(e.target.value)}
              className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded"
            >
              {jobEntryOptions.map(entry => (
                <option key={entry} value={entry}>{entry}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-msx-textsecondary">Based on Template: <strong className="text-msx-cyan">{template.name}</strong></p>

        <div className="flex items-center justify-between gap-2 border-t border-msx-border/30 pt-2 mt-2">
          <span className="text-xs text-msx-textsecondary">
            Components: <strong className="text-msx-textprimary">{renderedComponentDefIds.length}</strong>
          </span>
          <Button
            onClick={() => collapseEntityComponents(renderedComponentDefIds)}
            variant="ghost"
            size="sm"
            icon={<CollapseAllIcon className="w-3.5 h-3.5" />}
            className="px-2 py-0.5"
            title="Collapse all components"
            disabled={renderedComponentDefIds.length === 0 || areAllEntityComponentsCollapsed}
          >
            Collapse all
          </Button>
        </div>
        
        <div className="max-h-72 overflow-y-auto pr-1 space-y-2">
            {template.components.map(templateComponent => {
            const componentDef = componentDefinitions.find(cd => cd.id === templateComponent.definitionId);
            if (!componentDef) return <div key={templateComponent.definitionId} className="text-xs text-red-500">Comp Def {templateComponent.definitionId} missing!</div>;
            
            // Special rendering for comp_patrol
            if (componentDef.id === 'comp_patrol') {
              const patrolProps = {
                waypoint1_x: localComponentOverrides[componentDef.id]?.waypoint1_x ?? templateComponent.defaultValues.waypoint1_x ?? componentDef.properties.find(p=>p.name==='waypoint1_x')?.defaultValue,
                waypoint1_y: localComponentOverrides[componentDef.id]?.waypoint1_y ?? templateComponent.defaultValues.waypoint1_y ?? componentDef.properties.find(p=>p.name==='waypoint1_y')?.defaultValue,
                waypoint2_x: localComponentOverrides[componentDef.id]?.waypoint2_x ?? templateComponent.defaultValues.waypoint2_x ?? componentDef.properties.find(p=>p.name==='waypoint2_x')?.defaultValue,
                waypoint2_y: localComponentOverrides[componentDef.id]?.waypoint2_y ?? templateComponent.defaultValues.waypoint2_y ?? componentDef.properties.find(p=>p.name==='waypoint2_y')?.defaultValue,
              };

              return (
                renderEntityComponentPanel(componentDef, (
                  <>
                   {/* Render other patrol props normally if needed */}
                   <div className="mt-1 p-1.5 border border-dashed border-msx-border/50 rounded text-[0.65rem]">
                      <label className="block text-msx-textsecondary mb-1">Waypoint 1 (X, Y in pixels)</label>
                      <div className="flex items-center gap-1">
                          <input type="number" value={patrolProps.waypoint1_x} onChange={e => handleComponentOverrideChange(componentDef.id, 'waypoint1_x', e.target.value, 'word')} className="w-full p-0.5 bg-msx-bgcolor border-msx-border rounded text-xs"/>
                          <input type="number" value={patrolProps.waypoint1_y} onChange={e => handleComponentOverrideChange(componentDef.id, 'waypoint1_y', e.target.value, 'word')} className="w-full p-0.5 bg-msx-bgcolor border-msx-border rounded text-xs"/>
                          <Button onClick={() => handlePickWaypoint('waypoint1')} size="sm" variant="ghost" className="!p-1" title="Pick Waypoint 1 from map">
                              <ViewfinderCircleIcon className="w-4 h-4 text-msx-accent"/>
                          </Button>
                      </div>
                  </div>
                  <div className="mt-1 p-1.5 border border-dashed border-msx-border/50 rounded text-[0.65rem]">
                      <label className="block text-msx-textsecondary mb-1">Waypoint 2 (X, Y in pixels)</label>
                      <div className="flex items-center gap-1">
                          <input type="number" value={patrolProps.waypoint2_x} onChange={e => handleComponentOverrideChange(componentDef.id, 'waypoint2_x', e.target.value, 'word')} className="w-full p-0.5 bg-msx-bgcolor border-msx-border rounded text-xs"/>
                          <input type="number" value={patrolProps.waypoint2_y} onChange={e => handleComponentOverrideChange(componentDef.id, 'waypoint2_y', e.target.value, 'word')} className="w-full p-0.5 bg-msx-bgcolor border-msx-border rounded text-xs"/>
                          <Button onClick={() => handlePickWaypoint('waypoint2')} size="sm" variant="ghost" className="!p-1" title="Pick Waypoint 2 from map">
                              <ViewfinderCircleIcon className="w-4 h-4 text-msx-accent"/>
                          </Button>
                      </div>
                  </div>
                  </>
                ))
              );
            }

            if (componentDef.id === 'comp_auto_control_script') {
              const getAutoControlValue = (propName: string) =>
                localComponentOverrides[componentDef.id]?.[propName] ??
                templateComponent.defaultValues[propName] ??
                componentDef.properties.find(p => p.name === propName)?.defaultValue ??
                '';
              const enabled = getAutoControlValue('enabled');
              const startsOnScreenLoad = getAutoControlValue('startsOnScreenLoad');
              const loop = getAutoControlValue('loop');
              const dialogueAssetId = String(getAutoControlValue('defaultDialogueAssetId') ?? '');
              const idleSpriteAssetId = String(getAutoControlValue('idleSpriteAssetId') ?? '');
              const walkSpriteAssetId = String(getAutoControlValue('walkSpriteAssetId') ?? '');
              const scriptFormat = String(getAutoControlValue('scriptFormat') || 'commands');
              const eventString = String(getAutoControlValue('eventString') ?? '');
              const commands = String(getAutoControlValue('commands') ?? '');
              const selectedDialogueAsset = assetsWithEntityTemplates.find(asset => asset.id === dialogueAssetId && asset.type === 'dialogue');
              const selectedIdleSpriteAsset = assetsWithEntityTemplates.find(asset => asset.id === idleSpriteAssetId && asset.type === 'sprite');
              const selectedWalkSpriteAsset = assetsWithEntityTemplates.find(asset => asset.id === walkSpriteAssetId && asset.type === 'sprite');
              const selectedDialogue = selectedDialogueAsset?.data as DialogueAsset | undefined;
              const compactParseResult = parseAutoEventString(eventString, selectedDialogue);
              const compactDialogueCommandsUsed = autoEventStringUsesDialogue(eventString);
              const dialogueCommandsUsed = scriptFormat === 'eventString'
                ? compactDialogueCommandsUsed
                : /\b(play_dialog|play_dialogue|open_dialog|open\s+(dialog|dialogue|frame_dialog|frame-dialog)|write_line|write\s+(text|line))\b/i.test(commands);
              const hasDialogueText = selectedDialogue?.lines?.some(line => {
                const text = `${line.speaker?.trim() ? `${line.speaker.trim()}: ` : ''}${line.text || ''}`.trim();
                return text.length > 0;
              }) ?? false;
              const appendCompactEvent = (eventToken: string) => {
                handleComponentOverrideChange(componentDef.id, 'eventString', `${eventString}${eventToken}`, 'string');
              };
              const appendAutoControlCommand = (commandLine: string) => {
                const nextCommands = commands.trimEnd()
                  ? `${commands.trimEnd()}\n${commandLine}`
                  : commandLine;
                handleComponentOverrideChange(componentDef.id, 'commands', nextCommands, 'string');
              };
              const createAndAssignDialogue = () => {
                const created = onCreateAsset?.('dialogue', { select: false });
                if (created?.id) {
                  handleComponentOverrideChange(componentDef.id, 'defaultDialogueAssetId', created.id, 'dialogue_ref');
                }
              };
              const requiredNumericArgCommands = new Set(['write_line']);
              const optionalNumericArgCommands = new Set([
                'move_left',
                'move_right',
                'move_up',
                'move_down',
                'left',
                'right',
                'up',
                'down',
                'dash_left',
                'dash_right',
                'dash_up',
                'dash_down',
                'jump',
                'delay',
                'delay_ms',
                'wait_ms',
                'wait',
                'wait_seconds',
                'delay_seconds',
              ]);
              const noArgCommands = new Set([
                'grab_wall',
                'release_wall',
                'play_dialog',
                'play_dialogue',
                'open_dialog',
                'wait_spc',
                'wait_text',
                'wait_typewriter',
                'clear_dialog',
                'close_dialog',
              ]);
              const commandValidationIssues = commands
                .split(/\r?\n/)
                .map((line, index) => ({ line: line.replace(/[;#].*/, '').trim(), lineNumber: index + 1 }))
                .filter(item => item.line)
                .flatMap(item => {
                  const parts = item.line.split(/[\s,]+/).filter(Boolean);
                  let command = String(parts[0] || '').toLowerCase();
                  let arg = parts[1];
                  const second = String(parts[1] || '').toLowerCase();

                  if ((command === 'move' || command === 'dash') && ['left', 'right', 'up', 'down'].includes(second)) {
                    command = `${command}_${second}`;
                    arg = parts[2];
                  } else if (command === 'wait' && ['spc', 'space'].includes(second)) {
                    command = 'wait_spc';
                    arg = parts[2];
                  } else if (command === 'wait' && ['text', 'typewriter'].includes(second)) {
                    command = 'wait_text';
                    arg = parts[2];
                  } else if (command === 'wait' && ['second', 'seconds'].includes(second)) {
                    command = 'wait_seconds';
                    arg = parts[2];
                  } else if ((command === 'write' || command === 'write_text') && ['text', 'line'].includes(second)) {
                    command = 'write_line';
                    arg = parts[2];
                  } else if (command === 'open' && ['dialog', 'dialogue', 'frame_dialog', 'frame-dialog'].includes(second)) {
                    command = 'open_dialog';
                    arg = parts[2];
                  } else if (command === 'close' && ['dialog', 'dialogue', 'frame_dialog', 'frame-dialog'].includes(second)) {
                    command = 'close_dialog';
                    arg = parts[2];
                  }

                  if (command === 'spc') command = 'wait_spc';
                  if (command === 'clean') command = 'clear_dialog';
                  if (command === 'write_text') command = 'write_line';
                  if (command === 'open_frame_dialog' || command === 'open-frame-dialog') command = 'open_dialog';
                  if (command === 'close_frame_dialog' || command === 'close-frame-dialog') command = 'close_dialog';

                  if (requiredNumericArgCommands.has(command)) {
                    const numericArg = Number(arg);
                    if (!arg || !Number.isFinite(numericArg)) {
                      return [`Line ${item.lineNumber}: ${command} needs a numeric argument.`];
                    }
                    if (command === 'write_line' && selectedDialogue?.lines && (numericArg < 0 || numericArg >= selectedDialogue.lines.length)) {
                      return [`Line ${item.lineNumber}: write_line ${numericArg} is outside the selected Dialogue line range.`];
                    }
                    if (command === 'write_line' && selectedDialogue?.lines?.[numericArg]) {
                      const targetLine = selectedDialogue.lines[numericArg];
                      const targetText = `${targetLine.speaker?.trim() ? `${targetLine.speaker.trim()}: ` : ''}${targetLine.text || ''}`.trim();
                      if (!targetText) {
                        return [`Line ${item.lineNumber}: write_line ${numericArg} targets an empty Dialogue line.`];
                      }
                    }
                    return [];
                  }
                  if (optionalNumericArgCommands.has(command)) {
                    if (arg && !Number.isFinite(Number(arg))) {
                      return [`Line ${item.lineNumber}: ${command} argument must be numeric when provided.`];
                    }
                    return [];
                  }
                  if (noArgCommands.has(command)) {
                    if (arg) {
                      return [`Line ${item.lineNumber}: ${command} does not take an argument.`];
                    }
                    return [];
                  }
                  return [`Line ${item.lineNumber}: unknown command "${command}".`];
                });
              const dialogueCommandNeedsAsset = dialogueCommandsUsed && !dialogueAssetId;
              if (dialogueCommandNeedsAsset) {
                commandValidationIssues.unshift('Script uses dialogue commands but no Default Dialogue is selected.');
              }
              if (dialogueCommandsUsed && dialogueAssetId && !selectedDialogueAsset) {
                commandValidationIssues.unshift('Default Dialogue points to a missing Dialogue asset.');
              }
              if (scriptFormat === 'eventString') {
                commandValidationIssues.unshift(...compactParseResult.issues.map(issue => issue.message));
              }
              if (scriptFormat === 'commands' && /\b(play_dialog|play_dialogue)\b/i.test(commands) && selectedDialogueAsset && !hasDialogueText) {
                commandValidationIssues.unshift('play_dialog uses a Dialogue asset with no text.');
              }
              if (scriptFormat === 'eventString' && compactDialogueCommandsUsed && selectedDialogueAsset && !hasDialogueText) {
                commandValidationIssues.unshift('Compact script uses a Dialogue asset with no text.');
              }

              return (
                renderEntityComponentPanel(componentDef, (
                  <div className="grid grid-cols-1 gap-2">
                    <p className="text-[0.65rem] text-msx-textsecondary">
                      Controls the scripted FakePlayer for tutorial/dialog/cutscene screens. Real Player input and movement are unchanged.
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-[0.65rem] text-msx-textsecondary">
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={enabled === true || enabled === 'true'}
                          onChange={e => handleComponentOverrideChange(componentDef.id, 'enabled', e.target.checked, 'boolean')}
                          className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent"
                        />
                        Enabled
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={startsOnScreenLoad === true || startsOnScreenLoad === 'true'}
                          onChange={e => handleComponentOverrideChange(componentDef.id, 'startsOnScreenLoad', e.target.checked, 'boolean')}
                          className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent"
                        />
                        On load
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={loop === true || loop === 'true'}
                          onChange={e => handleComponentOverrideChange(componentDef.id, 'loop', e.target.checked, 'boolean')}
                          className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent"
                        />
                        Loop
                      </label>
                    </div>

                    <div>
                      <label className="block text-[0.65rem] text-msx-textsecondary mb-0.5">
                        Default Dialogue:
                      </label>
                      <div className="flex items-center space-x-1">
                        <span className="p-1 text-xs bg-msx-bgcolor border border-msx-border/30 rounded flex-grow truncate" title={dialogueAssetId || 'None'}>
                          {selectedDialogueAsset?.name || 'None'}
                        </span>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openAssetPicker('dialogue_ref', dialogueAssetId, (assetId) => handleComponentOverrideChange(componentDef.id, 'defaultDialogueAssetId', assetId, 'dialogue_ref'))}
                        >
                          ...
                        </Button>
                      </div>
                      {!selectedDialogueAsset && onCreateAsset && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="mt-1"
                          onClick={createAndAssignDialogue}
                        >
                          Create and Use Dialogue
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[0.65rem] text-msx-textsecondary mb-0.5">
                          Idle Sprite:
                        </label>
                        <div className="flex items-center space-x-1">
                          <span className="p-1 text-xs bg-msx-bgcolor border border-msx-border/30 rounded flex-grow truncate" title={idleSpriteAssetId || 'Use current sprite'}>
                            {selectedIdleSpriteAsset?.name || 'Current sprite'}
                          </span>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openAssetPicker('sprite_ref', idleSpriteAssetId, (assetId) => handleComponentOverrideChange(componentDef.id, 'idleSpriteAssetId', assetId, 'sprite_ref'))}
                          >
                            ...
                          </Button>
                          {idleSpriteAssetId && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleComponentOverrideChange(componentDef.id, 'idleSpriteAssetId', '', 'sprite_ref')}
                            >
                              Clear
                            </Button>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[0.65rem] text-msx-textsecondary mb-0.5">
                          Walk Sprite:
                        </label>
                        <div className="flex items-center space-x-1">
                          <span className="p-1 text-xs bg-msx-bgcolor border border-msx-border/30 rounded flex-grow truncate" title={walkSpriteAssetId || 'Use current sprite'}>
                            {selectedWalkSpriteAsset?.name || 'Current sprite'}
                          </span>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openAssetPicker('sprite_ref', walkSpriteAssetId, (assetId) => handleComponentOverrideChange(componentDef.id, 'walkSpriteAssetId', assetId, 'sprite_ref'))}
                          >
                            ...
                          </Button>
                          {walkSpriteAssetId && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleComponentOverrideChange(componentDef.id, 'walkSpriteAssetId', '', 'sprite_ref')}
                            >
                              Clear
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[0.65rem] text-msx-textsecondary mb-0.5">
                        Script format:
                      </label>
                      <select
                        value={scriptFormat}
                        onChange={e => handleComponentOverrideChange(componentDef.id, 'scriptFormat', e.target.value, 'string')}
                        className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded"
                      >
                        <option value="commands">Readable commands</option>
                        <option value="eventString">Compact event string</option>
                      </select>
                    </div>

                    {scriptFormat === 'eventString' && (
                      <div>
                        <label className="block text-[0.65rem] text-msx-textsecondary mb-0.5">
                          Compact event string:
                        </label>
                        <input
                          value={eventString}
                          onChange={e => handleComponentOverrideChange(componentDef.id, 'eventString', e.target.value, 'string')}
                          className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded font-mono"
                          spellCheck={false}
                        />
                        <div className="flex flex-wrap gap-1 mt-1">
                          {['x64', 'X64', 'd1000', 'o', 'w1', 's', 'w2', 't', 'k', 'c'].map(eventToken => (
                            <Button
                              key={eventToken}
                              size="sm"
                              variant="ghost"
                              className="text-[0.65rem] px-1.5 py-0.5"
                              onClick={() => appendCompactEvent(eventToken)}
                            >
                              {eventToken}
                            </Button>
                          ))}
                        </div>
                        <p className="text-[0.65rem] text-msx-textsecondary mt-1">
                          Compact: x64 right, X64 left, y16 down, Y16 up, d1000 delay, o open, w1 write first line, s wait SPC, t wait text, k clean, c close.
                        </p>
                      </div>
                    )}

                    {scriptFormat === 'commands' && (
                    <div>
                      <label className="block text-[0.65rem] text-msx-textsecondary mb-0.5">
                        Commands:
                      </label>
                      <textarea
                        value={commands}
                        onChange={e => handleComponentOverrideChange(componentDef.id, 'commands', e.target.value, 'string')}
                        className="w-full min-h-[8rem] p-1 text-xs bg-msx-bgcolor border-msx-border rounded font-mono"
                        spellCheck={false}
                      />
                      <div className="flex flex-wrap gap-1 mt-1">
                        {[
                          'move_right 64',
                          'move right 64',
                          'move_left 64',
                          'jump',
                          'dash_right',
                          'dash right',
                          'grab_wall',
                          'release_wall',
                          'delay 1000',
                          'wait 2',
                          'play_dialog',
                          'open_dialog',
                          'open frame_dialog',
                          'write_line 0',
                          'write text 0',
                          'wait_spc',
                          'wait SPC',
                          'wait_text',
                          'wait text',
                          'clear_dialog',
                          'clean',
                          'close_dialog',
                        ].map(commandLine => (
                          <Button
                            key={commandLine}
                            size="sm"
                            variant="ghost"
                            className="text-[0.65rem] px-1.5 py-0.5"
                            onClick={() => appendAutoControlCommand(commandLine)}
                          >
                            {commandLine}
                          </Button>
                        ))}
                      </div>
                      <p className="text-[0.65rem] text-msx-textsecondary mt-1">
                        Commands: move_right 64 or move right 64, jump, dash_right, grab_wall, delay 1000, wait 2, play_dialog, open frame_dialog, write text 0, wait SPC, wait text, clean, close_dialog.
                      </p>
                      {commandValidationIssues.length > 0 && (
                        <div className="mt-1 p-1.5 border border-yellow-500/50 bg-yellow-950/40 rounded text-[0.65rem] text-yellow-100">
                          <div className="font-semibold text-yellow-300 mb-1">Script validation</div>
                          <ul className="list-disc list-inside space-y-0.5">
                            {commandValidationIssues.map(issue => (
                              <li key={issue}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    )}
                  </div>
                ))
              );
            }


            const isChildLinkComponent = componentDef.id === CHILD_LINK_COMPONENT_ID;
            const childLinkParentInstanceId = isChildLinkComponent
              ? (
                  localComponentOverrides[componentDef.id]?.parentInstanceId ??
                  templateComponent.defaultValues.parentInstanceId ??
                  componentDef.properties.find(p => p.name === 'parentInstanceId')?.defaultValue ??
                  ''
                )
              : '';
            const childLinkParentValue = String(childLinkParentInstanceId ?? '');
            const childLinkParentExists = childLinkParentValue
              ? availableChildLinkParents.some(parent => parent.id === childLinkParentValue)
              : false;

            return (
              renderEntityComponentPanel(componentDef, (
                <>
                {isChildLinkComponent && (
                    <div className="mb-2 p-2 bg-msx-bgcolor/40 border border-dashed border-msx-border/60 rounded">
                        <label className="block text-[0.7rem] text-msx-textsecondary mb-1">
                            Parent entity (auto completa Template/Instance)
                        </label>
                        {availableChildLinkParents.length === 0 ? (
                            <p className="text-[0.7rem] text-msx-textsecondary">
                                No hay otras entidades en esta pantalla para usar como padre.
                            </p>
                        ) : (
                            <div className="flex items-center gap-2">
                                <select
                                    value={childLinkParentValue}
                                    onChange={e => handleChildLinkParentSelection(componentDef.id, e.target.value)}
                                    className="flex-1 p-0.5 text-xs bg-msx-bgcolor border-msx-border rounded"
                                >
                                    <option value="">-- Sin asignar --</option>
                                    {!childLinkParentExists && childLinkParentValue && (
                                        <option value={childLinkParentValue} disabled>
                                            {childLinkParentValue} (fuera de esta pantalla)
                                        </option>
                                    )}
                                    {availableChildLinkParents.map(parent => (
                                        <option key={parent.id} value={parent.id}>
                                            {parent.name} � {parent.templateName}
                                        </option>
                                    ))}
                                </select>
                                {childLinkParentValue && (
                                    <Button
                                        size="xs"
                                        variant="ghost"
                                        className="px-2"
                                        title="Quitar referencia al padre"
                                        onClick={() => handleChildLinkParentSelection(componentDef.id, '')}
                                    >
                                        Limpiar
                                    </Button>
                                )}
                            </div>
                        )}
                        <p className="text-[0.65rem] text-msx-textsecondary mt-1">
                            Al elegir un padre se llenan autom&aacute;ticamente los campos de plantilla, ID y nombre.
                        </p>
                    </div>
                )}
                {componentDef.properties.map(propDef => {
                    const overrideValue = localComponentOverrides[componentDef.id]?.[propDef.name];
                    const templateDefaultValue = templateComponent.defaultValues[propDef.name];
                    const definitionDefaultValue = propDef.defaultValue;
                    const currentValue = overrideValue !== undefined ? overrideValue : (templateDefaultValue !== undefined ? templateDefaultValue : definitionDefaultValue);
                    
                    const inputId = `override-${entityInstance.id}-${componentDef.id}-${propDef.name}`;
                    const isRefType = propDef.type.endsWith('_ref');
                    const isBehaviorType = isBehaviorComponentProperty(componentDef.id, propDef.name, 'behaviorType');
                    const isBehaviorInitialDirection = isBehaviorComponentProperty(componentDef.id, propDef.name, 'initialDirection');

                    // Special handling for StateMachine currentStateId property
                    const isStateMachineCurrentStateProperty = (componentDef.name === 'StateMachineComponent' || componentDef.name === 'StateMachine') 
                        && propDef.name === 'currentStateId';
                    let availableStates: Array<{id: string, name: string}> = [];
                    
                    if (isStateMachineCurrentStateProperty) {
                        // Get the state machine asset ID from the same component
                        const stateMachineAssetIdProp = componentDef.properties.find(p => 
                            p.name === 'stateMachineAssetId' || p.name === 'state_machine' || p.type === 'statemachine_ref');
                        if (stateMachineAssetIdProp) {
                            const stateMachineAssetId = localComponentOverrides[componentDef.id]?.[stateMachineAssetIdProp.name] 
                                || templateComponent.defaultValues[stateMachineAssetIdProp.name] 
                                || stateMachineAssetIdProp.defaultValue;
                            
                            if (stateMachineAssetId && stateMachineAssetId !== "0" && stateMachineAssetId !== "") {
                                const stateMachineAsset = assetsWithEntityTemplates.find(asset => asset.id === stateMachineAssetId && asset.type === 'statemachine');
                                if (stateMachineAsset && stateMachineAsset.data) {
                                    availableStates = (stateMachineAsset.data as any).states || [];
                                    
                                    // Auto-select "Idle" state if no current state is set and "Idle" exists
                                    if (!currentValue || currentValue === "") {
                                        const idleState = availableStates.find(state => 
                                            state.name.toLowerCase() === 'idle' || 
                                            state.name.toLowerCase() === 'initial' ||
                                            state.name.toLowerCase() === 'start'
                                        );
                                        if (idleState) {
                                            // Auto-set the idle state
                                            setTimeout(() => {
                                                handleComponentOverrideChange(componentDef.id, propDef.name, idleState.id, propDef.type);
                                            }, 0);
                                        }
                                    }
                                }
                            }
                        }
                    }

                    return (
                        <div key={propDef.name} className="mb-1">
                            <label htmlFor={inputId} className="block text-[0.65rem] text-msx-textsecondary mb-0.5">
                                {propDef.name} ({propDef.type}): <span className="italic">(Def: {String(definitionDefaultValue)})</span>
                                {isStateMachineCurrentStateProperty && availableStates.length > 0 && (
                                    <span className="text-msx-cyan ml-1">({availableStates.length} states available)</span>
                                )}
                            </label>
                            {isStateMachineCurrentStateProperty && availableStates.length > 0 ? (
                                <select 
                                    id={inputId} 
                                    value={String(currentValue ?? '')} 
                                    onChange={e => handleComponentOverrideChange(componentDef.id, propDef.name, e.target.value, propDef.type)}
                                    className="w-full p-0.5 text-xs bg-msx-bgcolor border-msx-border rounded"
                                >
                                    <option value="">-- Select Initial State --</option>
                                    {availableStates.map(state => (
                                        <option key={state.id} value={state.id}>
                                            {state.name} ({state.id})
                                        </option>
                                    ))}
                                </select>
                            ) : isBehaviorType ? (
                                <select
                                    id={inputId}
                                    value={String(currentValue ?? 'none')}
                                    onChange={e => handleComponentOverrideChange(componentDef.id, propDef.name, e.target.value, propDef.type)}
                                    className="w-full p-0.5 text-xs bg-msx-bgcolor border-msx-border rounded"
                                >
                                    {BEHAVIOR_TYPE_OPTIONS.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            ) : isBehaviorInitialDirection ? (
                                <select
                                    id={inputId}
                                    value={String(currentValue ?? 'right')}
                                    onChange={e => handleComponentOverrideChange(componentDef.id, propDef.name, e.target.value, propDef.type)}
                                    className="w-full p-0.5 text-xs bg-msx-bgcolor border-msx-border rounded"
                                >
                                    {BEHAVIOR_DIRECTION_OPTIONS.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            ) : (componentDef.id === 'comp_shoot' && propDef.name === 'aimMode') ? (
                                <select
                                    id={inputId}
                                    value={String(currentValue ?? 'facing')}
                                    onChange={e => handleComponentOverrideChange(componentDef.id, propDef.name, e.target.value, propDef.type)}
                                    className="w-full p-0.5 text-xs bg-msx-bgcolor border-msx-border rounded"
                                >
                                    <option value="facing">facing (izq/dcha según mirror)</option>
                                    <option value="4dir">4dir (flechas/WASD)</option>
                                </select>
                            ) : isRefType ? (
                                <div className="flex items-center space-x-1">
                                    <span className="p-1 text-xs bg-msx-bgcolor border border-msx-border/30 rounded flex-grow truncate" title={currentValue || "None"}>
                                        {assetsWithEntityTemplates.find(a => a.id === currentValue)?.name || "None"}
                                    </span>
                                    <Button size="sm" variant="secondary" onClick={() => openAssetPicker(propDef.type, currentValue, (assetId) => handleComponentOverrideChange(componentDef.id, propDef.name, assetId, propDef.type))}>...</Button>
                                </div>
                            ) : propDef.type === 'boolean' ? (
                                <label className="flex items-center">
                                    <input type="checkbox" id={inputId} checked={currentValue === true || currentValue === 'true'} onChange={e => handleComponentOverrideChange(componentDef.id, propDef.name, e.target.checked, propDef.type)} className="form-checkbox mr-1 bg-msx-bgcolor border-msx-border text-msx-accent"/>
                                </label>
                            ) : (
                                <input type={propDef.type === 'byte' || propDef.type === 'word' ? 'number' : 'text'} id={inputId} value={String(currentValue ?? '')} onChange={e => handleComponentOverrideChange(componentDef.id, propDef.name, e.target.value, propDef.type)} className="w-full p-0.5 text-xs bg-msx-bgcolor border-msx-border rounded"/>
                            )}
                        </div>
                    );
                })}
                </>
              ))
            );
            })}
        </div>
        <Button onClick={handleDeleteEntityClick} variant="danger" size="sm" icon={<TrashIcon />} className="w-full mt-2">Delete Entity Instance</Button>
      </div>
    );
  };

  /**
   * Renders the properties for the currently selected effect zone.
   * @returns A React node with the effect zone's properties.
   */
  const renderEffectZoneProperties = (): React.ReactNode => {
    if (!effectZone) return null;
    return (
      <div className="space-y-2">
        <div>
          <label htmlFor="ezName" className="block text-xs text-msx-textsecondary mb-0.5">Name:</label>
          <input id="ezName" type="text" value={localEffectZoneName} onChange={handleEffectZoneNameChange} className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="ezX" className="block text-xs text-msx-textsecondary mb-0.5">X (cell):</label>
            <input id="ezX" type="number" value={localEffectZoneRect.x} onChange={e => handleEffectZoneRectChange('x', e.target.value)} className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded" />
          </div>
          <div>
            <label htmlFor="ezY" className="block text-xs text-msx-textsecondary mb-0.5">Y (cell):</label>
            <input id="ezY" type="number" value={localEffectZoneRect.y} onChange={e => handleEffectZoneRectChange('y', e.target.value)} className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded" />
          </div>
          <div>
            <label htmlFor="ezW" className="block text-xs text-msx-textsecondary mb-0.5">Width (cells):</label>
            <input id="ezW" type="number" value={isNaN(localEffectZoneRect.width) ? '' : localEffectZoneRect.width} min="1" onChange={e => handleEffectZoneRectChange('width', e.target.value)} className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded" />
          </div>
          <div>
            <label htmlFor="ezH" className="block text-xs text-msx-textsecondary mb-0.5">Height (cells):</label>
            <input id="ezH" type="number" value={isNaN(localEffectZoneRect.height) ? '' : localEffectZoneRect.height} min="1" onChange={e => handleEffectZoneRectChange('height', e.target.value)} className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded" />
          </div>
        </div>
        <div>
          <label htmlFor="ezType" className="block text-xs text-msx-textsecondary mb-0.5">Type:</label>
          <select
            id="ezType"
            value={localEffectZoneType}
            onChange={e => handleEffectZoneTypeChange(e.target.value as EffectType)}
            className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded"
          >
            {Object.entries(EFFECT_ZONE_TYPE_CONFIG).map(([type, config]) => (
              <option key={type} value={type}>{config.label}</option>
            ))}
          </select>
        </div>
        {localEffectZoneType === 'wind' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="ezWindDirection" className="block text-xs text-msx-textsecondary mb-0.5">Direction:</label>
              <select
                id="ezWindDirection"
                value={String(localEffectZoneParams.direction || 'right')}
                onChange={e => handleWindEffectParamChange('direction', e.target.value as WindEffectDirection)}
                className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded"
              >
                <option value="left">left</option>
                <option value="right">right</option>
                <option value="up">up</option>
                <option value="down">down</option>
              </select>
            </div>
            <div>
              <label htmlFor="ezWindStrength" className="block text-xs text-msx-textsecondary mb-0.5">Strength:</label>
              <input
                id="ezWindStrength"
                type="number"
                min="0"
                value={String(localEffectZoneParams.strength ?? 1)}
                onChange={e => handleWindEffectParamChange('strength', e.target.value)}
                className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded"
              />
            </div>
          </div>
        )}
        <div>
          <label htmlFor="ezDesc" className="block text-xs text-msx-textsecondary mb-0.5">Description:</label>
          <textarea id="ezDesc" value={localEffectZoneDesc} onChange={handleEffectZoneDescChange} rows={2} className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded" />
        </div>
        <Button onClick={handleDeleteEffectZoneClick} variant="danger" size="sm" icon={<TrashIcon />} className="w-full mt-2">Delete Effect Zone</Button>
      </div>
    );
  };

  const compDefExists = (id: string, template: EntityTemplate) => template.components.some(c => c.definitionId === id);

  const renderEditorHelp = (): React.ReactNode => {
    const helpByEditor: Partial<Record<EditorType, { title: string; summary: string; tips: string[] }>> = {
      [EditorType.Msx2Sprite]: {
        title: 'MSX2 Sprite Editor Help',
        summary: 'Author V9938 hardware sprites for SCREEN 4/SCREEN 5 style MSX2 projects. Keep an eye on color-plane diagnostics and metasprite parts.',
        tips: [
          'Use transparent color consistently; hardware sprite export depends on masks and color planes.',
          'Check 3+ color rows and max cell layers before export.',
          'Use facing/mirror preview to keep left and right animation frames coherent.',
        ],
      },
      [EditorType.Msx2Screen]: {
        title: 'MSX2 SCREEN 4 Room Help',
        summary: 'Build tile-based SCREEN 4 rooms with entities, collision, behavior codes, HUD metadata, and export contract previews.',
        tips: [
          'Use the left tool panels for tiles, entities, selection tools, atlas, and export contract.',
          'Keep collision/effect layers aligned with authored tile coordinates.',
          'For menus, use SCREEN 4 rooms plus MSX2 HUD fonts for readable text.',
        ],
      },
      [EditorType.Msx2BitmapRoom]: {
        title: 'MSX2 SCREEN 5 Bitmap Room Help',
        summary: 'Compose bitmap-style SCREEN 5 rooms from atlas commands while preserving the 2-color-per-8-pixel-row constraint.',
        tips: [
          'Use copy/fill/line commands for compact reusable backgrounds.',
          'Watch color-limit diagnostics before exporting.',
          'Prefer repeated atlas pieces over one-off full-screen art when ROM budget matters.',
        ],
      },
      [EditorType.Msx2Bitmap]: {
        title: 'MSX2 Bitmap Editor Help',
        summary: 'Edit MSX2 bitmap pixels and palette slots for imported or hand-authored visual assets.',
        tips: [
          'Keep palette slot 0/1 usage deliberate for background and transparency workflows.',
          'Use contrast controls after PNG import to recover readable silhouettes.',
          'For presentation screens, prefer the dedicated SCREEN 5 presentation importer.',
        ],
      },
      [EditorType.Msx2Player]: {
        title: 'MSX2 Player Help',
        summary: 'Configure MSX2 player definitions used by SCREEN 4 entity presets and runtime movement profiles.',
        tips: [
          'Keep movement mode, sprite reference, and control settings aligned with the target room profile.',
          'Disable air/time for arcade profiles that do not use the HUD timer.',
          'Use SCREEN 4 player components for per-room runtime behavior.',
        ],
      },
      [EditorType.Msx2HudFont]: {
        title: 'MSX2 HUD Font Help',
        summary: 'Prepare SCREEN 4 text glyphs for menus, HUDs, story panels, and GameFlow runtime text.',
        tips: [
          'Keep menu fonts consistent with the visual style of SCREEN 4 menus.',
          'Import TTF or ZX .ch8 only when the glyph size remains readable at 8x8.',
          'Check colorByte defaults so text has enough contrast on menu backgrounds.',
        ],
      },
      [EditorType.Msx2Presentation]: {
        title: 'MSX2 SCREEN 5 Presentation Help',
        summary: 'Manage 256px wide SCREEN 5 4bpp presentation images generated from PNG/JPG/WebP imports.',
        tips: [
          'Use black background and a tuned 16-slot palette for stronger first-screen impact.',
          'Use 192 height for regular display or 212 for taller overscan-style content.',
          'ZX0 compression is expected for ROM-friendly presentation payloads.',
        ],
      },
      [EditorType.Msx2GameFlow]: {
        title: 'MSX2 GameFlow Help',
        summary: 'Wire MSX2 presentation and SCREEN 4 runtime flows without touching the legacy MSX1 GameFlow.',
        tips: [
          'Use SCREEN 5 flow for presentation/intro and SCREEN 4 runtime flow for menus/submenus.',
          'Connect nodes with ports; Ctrl+click a connection to add waypoints.',
          'Use transitions that match the target purpose: SCREEN 5 terminal effects or SCREEN 4 wipes.',
        ],
      },
      [EditorType.Sprite]: {
        title: 'MSX1 Sprite Editor Help',
        summary: 'Edit MSX1 sprite frames, animation timing, and compact previews.',
        tips: [
          'Keep frame dimensions consistent across animation frames.',
          'Use animation speed to validate timing before export.',
          'For MSX2 hardware sprites, use the MSX2 Sprite editor instead.',
        ],
      },
      [EditorType.Tile]: {
        title: 'MSX1 Tile Editor Help',
        summary: 'Author SCREEN 2 tiles with logical IDs, line colors, and reusable patterns.',
        tips: [
          'Assign logical properties when tiles participate in collision or runtime semantics.',
          'For SCREEN 2, line attributes matter as much as bitmap pattern data.',
          'Use tile banks to keep export mapping predictable.',
        ],
      },
      [EditorType.Screen]: {
        title: 'MSX1 Screen Editor Help',
        summary: 'Build SCREEN 2 maps with layers, entities, effect zones, and tile placement tools.',
        tips: [
          'Select entities or effect zones to edit their concrete properties here.',
          'Use catalog blocks when repeating larger chunks across screens.',
          'Keep active area and collision/effect layers aligned with gameplay needs.',
        ],
      },
      [EditorType.GameFlow]: {
        title: 'MSX1 GameFlow Help',
        summary: 'Edit legacy MSX1 flow nodes, presentation screens, menus, text, transitions, and world entry.',
        tips: [
          'Use Preview before Play to validate flow logs.',
          'Use ports and cut mode for graph wiring.',
          'MSX2-only nodes belong in MSX2 GameFlow, not this editor.',
        ],
      },
      [EditorType.WorldMap]: {
        title: 'World Map Help',
        summary: 'Connect screens into a navigable graph and assign directional links.',
        tips: [
          'Keep start screen explicit.',
          'Use links to define spatial transitions.',
          'SCREEN 4 rooms can participate in MSX2 projects.',
        ],
      },
      [EditorType.WorldView]: {
        title: 'World View Help',
        summary: 'Inspect and navigate the authored world layout as a higher-level map.',
        tips: [
          'Use this view to catch missing links or unexpected room ordering.',
          'Open rooms directly when a visual or collision fix is needed.',
        ],
      },
      [EditorType.Code]: {
        title: 'Code Editor Help',
        summary: 'Edit ASM/code assets that feed exports or custom runtime hooks.',
        tips: [
          'Keep labels unique across generated and hand-written code.',
          'Compile after changing shared routines.',
          'Avoid changing generator-owned code in exported files directly.',
        ],
      },
      [EditorType.Track]: {
        title: 'Music Track Help',
        summary: 'Author tracker-style PSG music patterns, instruments, order, and playback metadata.',
        tips: [
          'Keep loop/restart positions explicit.',
          'Use short pattern tests before wiring music into GameFlow.',
        ],
      },
      [EditorType.Sound]: {
        title: 'Sound FX Help',
        summary: 'Create PSG sound effects for gameplay events and menu feedback.',
        tips: [
          'Keep SFX short so they do not mask music channels for long.',
          'Test tone/noise/envelope combinations before export.',
        ],
      },
      [EditorType.Dialogue]: {
        title: 'Dialogue Help',
        summary: 'Configure dialogue lines, text box geometry, and character delay settings.',
        tips: [
          'Keep box dimensions within readable screen regions.',
          'Match text speed to the target preview/runtime flow.',
        ],
      },
      [EditorType.GlobalVariables]: {
        title: 'Global Variables Help',
        summary: 'Define reusable variables for GameFlow branches, runtime counters, flags, and conditions.',
        tips: [
          'Use clear variable names because GameFlow condition nodes reference them directly.',
          'Prefer enumerated values for state machines and menu decisions.',
        ],
      },
      [EditorType.Palette]: {
        title: 'MSX2 Palette Help',
        summary: 'Edit V9938 16-slot palettes used by MSX2 assets and runtime screens.',
        tips: [
          'Keep slot assignments consistent across related assets.',
          'Use high contrast for text and menus.',
        ],
      },
      [EditorType.Font]: {
        title: 'MSX1 Font Help',
        summary: 'Edit global MSX1 font patterns and row color attributes.',
        tips: [
          'Focus on Space, digits, and A-Z for HUD/menu readability.',
          'Use MSX2 HUD Font for SCREEN 4 text workflows.',
        ],
      },
      [EditorType.ComponentDefinitionEditor]: {
        title: 'Component Definition Help',
        summary: 'Define reusable ECS-style components and property schemas for entity templates.',
        tips: [
          'Use stable property names because generators and templates reference them.',
          'Prefer explicit defaults for runtime-sensitive values.',
        ],
      },
      [EditorType.EntityTemplateEditor]: {
        title: 'Entity Template Help',
        summary: 'Combine components into reusable entity templates for screens and generators.',
        tips: [
          'Keep template names descriptive and engine-specific when needed.',
          'Use component defaults to reduce per-instance editing.',
        ],
      },
      [EditorType.StateMachine]: {
        title: 'State Machine Help',
        summary: 'Author state transitions and logic definitions for runtime behavior.',
        tips: [
          'Keep state names short and explicit.',
          'Validate transition coverage before wiring into gameplay.',
        ],
      },
      [EditorType.Boss]: {
        title: 'Boss Editor Help',
        summary: 'Author boss phases, behavior previews, collision parameters, and runtime metadata.',
        tips: [
          'Keep phase transitions explicit and test behavior previews before export.',
          'Use clear hitbox and projectile settings so runtime collision remains predictable.',
        ],
      },
      [EditorType.Portrait]: {
        title: 'Portrait Editor Help',
        summary: 'Prepare character portraits for dialogue, story panels, and presentation-style UI.',
        tips: [
          'Keep palette and contrast consistent with dialogue backgrounds.',
          'Preview at target size so facial details remain readable on MSX output.',
        ],
      },
      [EditorType.PresentationScreen]: {
        title: 'MSX1 Presentation Screen Help',
        summary: 'Edit legacy MSX1 presentation screens without mixing them with MSX2 SCREEN 5 presentations.',
        tips: [
          'Use this for MSX1 intro/title screens.',
          'For MSX2 impact screens, use MSX2 SCREEN 5 Presentation instead.',
        ],
      },
      [EditorType.TileBanks]: {
        title: 'Tile Banks Help',
        summary: 'Manage SCREEN 2 tile-to-character assignments and bank placement for export.',
        tips: [
          'Keep repeated tiles assigned consistently across banks.',
          'Check char codes when a screen renders unexpected patterns.',
        ],
      },
      [EditorType.HUD]: {
        title: 'HUD Editor Help',
        summary: 'Configure gameplay UI elements such as counters, icons, bars, and labels.',
        tips: [
          'Keep HUD regions away from active gameplay space.',
          'For MSX2 SCREEN 4 HUD text, pair this with MSX2 HUD Font assets.',
        ],
      },
      [EditorType.MainMenu]: {
        title: 'Main Menu Help',
        summary: 'Configure top-level menu flow, options, labels, and visual entry points.',
        tips: [
          'Keep option labels short and aligned with the font used by the target runtime.',
          'For MSX2 projects, prefer SCREEN 4 menu GameFlow nodes for runtime menus.',
        ],
      },
      [EditorType.PngMsxChars]: {
        title: 'PNG to MSX Chars Help',
        summary: 'Convert raster input into MSX character/tile data for constrained screen modes.',
        tips: [
          'Start from clean high-contrast images.',
          'Review color reduction before moving output into screens or banks.',
        ],
      },
      [EditorType.BehaviorEditor]: {
        title: 'Behavior Script Help',
        summary: 'Edit behavior ASM snippets or generated behavior scripts used by entities.',
        tips: [
          'Keep register usage explicit in comments when writing hand ASM.',
          'Compile after touching shared behavior routines.',
        ],
      },
      [EditorType.HelpDocs]: {
        title: 'Help Viewer Help',
        summary: 'Read built-in documentation and workflow notes for Mideas editors.',
        tips: [
          'Use the help viewer for longer tutorials.',
          'Use this side panel for short editor-specific reminders.',
        ],
      },
      [EditorType.Attributes]: {
        title: 'Attributes Help',
        summary: 'Inspect or edit color/attribute data used by screen and tile rendering.',
        tips: [
          'Keep attribute choices aligned with the current screen mode.',
          'For SCREEN 2, row color attributes can drive most visual issues.',
        ],
      },
      [EditorType.Platformer]: {
        title: 'Platformer Help',
        summary: 'Configure or inspect platformer-oriented runtime settings and gameplay data.',
        tips: [
          'Validate movement, collision, and spawn data together.',
          'Use screen/effect layers to make runtime behavior explicit.',
        ],
      },
      [EditorType.None]: {
        title: 'Editor Help',
        summary: 'Select or create an asset to open an editor and see contextual guidance here.',
        tips: [
          'Use Project Assets to open an asset.',
          'Use New Asset to create MSX1 or MSX2 resources.',
        ],
      },
    };
    const help = activeEditorType ? helpByEditor[activeEditorType] : undefined;
    if (!help) return null;
    return (
      <div className="mt-3 border-t border-msx-border pt-2 space-y-1">
        <div className="text-xs font-semibold text-msx-highlight">{help.title}</div>
        <p className="text-[0.7rem] text-msx-textsecondary">{help.summary}</p>
        <ul className="list-disc list-inside space-y-0.5 text-[0.68rem] text-msx-textsecondary">
          {help.tips.map(tip => <li key={tip}>{tip}</li>)}
        </ul>
      </div>
    );
  };
  
  const editorHelpContent = renderEditorHelp();
  const hasContextualEditorHelp = !!editorHelpContent;

  let panelTitle = hasContextualEditorHelp ? "Properties / Help" : "Properties";
  if (gameFlowNode && activeEditorType === EditorType.GameFlow) panelTitle = "Game Flow Node Properties / Help";
  else if (entityInstance && activeEditorType === EditorType.Screen && screenEditorActiveLayer === 'entities') panelTitle = "Entity Instance Properties / Help";
  else if (effectZone && activeEditorType === EditorType.Screen) panelTitle = "Effect Zone Properties / Help";
  else if (asset && activeEditorType !== EditorType.BehaviorEditor && activeEditorType !== EditorType.Font && activeEditorType !== EditorType.HelpDocs && activeEditorType !== EditorType.ComponentDefinitionEditor && activeEditorType !== EditorType.EntityTemplateEditor) panelTitle = "Asset Properties / Help";

  /**
   * Renders the properties for the currently selected game flow node.
   * @returns A React node with the game flow node's properties.
   */
  const renderGameFlowNodeProperties = (): React.ReactNode => {
    if (!gameFlowNode || !onUpdateGameFlowNode) return null;
    if (gameFlowNode.type === 'SubMenu') {
      const node = gameFlowNode as GameFlowSubMenuNode;
      return (
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-msx-textsecondary mb-0.5">Title:</label>
            <input
              type="text"
              value={node.title}
              onChange={(e) => onUpdateGameFlowNode(node.id, { title: e.target.value })}
              className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-msx-textsecondary mb-0.5">Options:</label>
            <div className="space-y-1">
              {node.options.map((option, index) => (
                <div key={option.id} className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => {
                        const newOptions = [...node.options];
                        newOptions[index] = { ...option, text: e.target.value };
                        onUpdateGameFlowNode(node.id, { options: newOptions });
                      }}
                      className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded"
                    />
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        const newOptions = node.options.filter(o => o.id !== option.id);
                        onUpdateGameFlowNode(node.id, { options: newOptions });
                      }}
                    >
                      <TrashIcon className="w-3 h-3"/>
                    </Button>
                  </div>
                  {option.type === 'controls' && (
                    <div className="ml-2 pl-2 border-l-2 border-msx-border space-y-1">
                      <div className="text-xs text-msx-textsecondary">Control Options:</div>
                      {['CURSORS', 'JOYSTICK', 'KEYS'].map((ctrl) => (
                        <label key={ctrl} className="flex items-center space-x-1 text-xs">
                          <input
                            type="checkbox"
                            checked={option.controlOptions?.includes(ctrl as any) || false}
                            onChange={(e) => {
                              const newOptions = [...node.options];
                              const currentControls = option.controlOptions || [];
                              newOptions[index] = {
                                ...option,
                                controlOptions: e.target.checked
                                  ? [...currentControls, ctrl as any]
                                  : currentControls.filter(c => c !== ctrl)
                              };
                              onUpdateGameFlowNode(node.id, { options: newOptions });
                            }}
                          />
                          <span>{ctrl}</span>
                        </label>
                      ))}
                      <div className="text-xs text-msx-textsecondary mt-1">Global Variable:</div>
                      <input
                        type="text"
                        value={option.globalVariableName || ''}
                        onChange={(e) => {
                          const newOptions = [...node.options];
                          newOptions[index] = { ...option, globalVariableName: e.target.value };
                          onUpdateGameFlowNode(node.id, { options: newOptions });
                        }}
                        placeholder="e.g. CONTROL_TYPE"
                        className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 flex space-x-1">
              <Button
                size="sm"
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  const newOption = { id: `opt_${Date.now()}`, text: 'New Option', type: 'normal' as const };
                  onUpdateGameFlowNode(node.id, { options: [...node.options, newOption] });
                }}
              >
                Add Option
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="flex-1"
                onClick={() => {
                  const newOption = {
                    id: `ctrl_${Date.now()}`,
                    text: 'CHOOSE',
                    type: 'controls' as 'controls',
                    controlOptions: ['CURSORS', 'JOYSTICK', 'KEYS'] as ('CURSORS' | 'JOYSTICK' | 'KEYS')[],
                    globalVariableName: 'CONTROL_TYPE'
                  };
                  onUpdateGameFlowNode(node.id, { options: [...node.options, newOption] });
                }}
              >
                Add Controls
              </Button>
            </div>
          </div>
        </div>
      );
    }
    if (gameFlowNode.type === 'Controls') {
      const node = gameFlowNode as GameFlowControlsNode;
      const updateControlsNode = (changes: Partial<GameFlowControlsNode>) => {
        onUpdateGameFlowNode(node.id, changes as Partial<GameFlowNode>);
      };
      return (
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-msx-textsecondary mb-0.5">Title:</label>
            <input
              type="text"
              value={node.title}
              onChange={(e) => updateControlsNode({ title: e.target.value })}
              className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-msx-textsecondary mb-0.5">Button 1 key:</label>
            <select
              value={node.keyboardButton1 || 'SPC'}
              onChange={(e) => updateControlsNode({ keyboardButton1: e.target.value as GameFlowControlsNode['keyboardButton1'] })}
              className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded"
            >
              <option value="SPC">SPC</option>
              <option value="CTRL">CTRL</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-msx-textsecondary mb-0.5">Button 2 key:</label>
            <select
              value={node.keyboardButton2 || 'N'}
              onChange={(e) => updateControlsNode({ keyboardButton2: e.target.value as GameFlowControlsNode['keyboardButton2'] })}
              className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded"
            >
              <option value="N">N</option>
              <option value="CTRL">CTRL</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-msx-textsecondary mb-0.5">Jump/Fire text:</label>
            <input
              type="text"
              value={node.jumpActionLabel || 'Salto'}
              maxLength={10}
              onChange={(e) => updateControlsNode({ jumpActionLabel: e.target.value })}
              className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-msx-textsecondary mb-0.5">Jump uses:</label>
            <select
              value={node.jumpActionButton || 'button1'}
              onChange={(e) => updateControlsNode({ jumpActionButton: e.target.value as GameFlowControlsNode['jumpActionButton'] })}
              className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded"
            >
              <option value="button1">Button 1</option>
              <option value="button2">Button 2</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-msx-textsecondary mb-0.5">Action text:</label>
            <input
              type="text"
              value={node.actionLabel || 'Accion'}
              maxLength={10}
              onChange={(e) => updateControlsNode({ actionLabel: e.target.value })}
              className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-msx-textsecondary mb-0.5">Action uses:</label>
            <select
              value={node.actionButton || 'button2'}
              onChange={(e) => updateControlsNode({ actionButton: e.target.value as GameFlowControlsNode['actionButton'] })}
              className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded"
            >
              <option value="button1">Button 1</option>
              <option value="button2">Button 2</option>
            </select>
          </div>
        </div>
      );
    }
    if (gameFlowNode.type === 'Group') {
        const node = gameFlowNode as any; // GameFlowGroupNode
        const gameFlowAssets = assetsWithEntityTemplates.filter(a => a.type === 'gameflow');
        const selectedGameFlow = gameFlowAssets.find(a => a.id === node.gameFlowAssetId);
        return (
            <div className="space-y-2">
                <div>
                    <label className="block text-xs text-msx-textsecondary mb-0.5">Group Name:</label>
                    <input
                        type="text"
                        value={node.name || ''}
                        onChange={(e) => onUpdateGameFlowNode(node.id, { name: e.target.value })}
                        className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded"
                        placeholder="Group name..."
                    />
                </div>
                <div>
                    <label className="block text-xs text-msx-textsecondary mb-0.5">GameFlow Asset:</label>
                    <select
                        value={node.gameFlowAssetId || ''}
                        onChange={(e) => onUpdateGameFlowNode(node.id, { gameFlowAssetId: e.target.value || undefined })}
                        className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded"
                    >
                        <option value="">-- Select GameFlow --</option>
                        {gameFlowAssets.map(gf => (
                            <option key={gf.id} value={gf.id}>{gf.name}</option>
                        ))}
                    </select>
                </div>
                {selectedGameFlow && (
                    <div className="text-xs text-msx-textsecondary p-2 bg-msx-bgcolor-darker rounded">
                        <div>Selected: <span className="text-msx-primary">{selectedGameFlow.name}</span></div>
                    </div>
                )}
            </div>
        );
    }
    if (gameFlowNode.type === 'End') {
        const node = gameFlowNode as GameFlowEndNode;
        return (
            <div className="space-y-2">
                <div>
                    <label className="block text-xs text-msx-textsecondary mb-0.5">End Type:</label>
                    <select
                        value={node.endType}
                        onChange={(e) => onUpdateGameFlowNode(node.id, { endType: e.target.value as 'Victory' | 'GameOver' })}
                        className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded"
                    >
                        <option value="Victory">Victory</option>
                        <option value="GameOver">Game Over</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-msx-textsecondary mb-0.5">Message:</label>
                    <textarea
                        value={node.message}
                        onChange={(e) => onUpdateGameFlowNode(node.id, { message: e.target.value })}
                        className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded"
                        rows={3}
                    />
                </div>
            </div>
        );
    }
    if (gameFlowNode.type === 'IfThenElse') {
        const node = gameFlowNode as any; // GameFlowIfThenElseNode
        return (
            <div className="space-y-2">
                <div className="p-2 bg-msx-bgcolor-darker rounded">
                    <div className="text-xs font-bold text-msx-primary mb-2">Condition</div>
                    <div className="space-y-1">
                        <div>
                            <span className="text-xs text-msx-textsecondary">Variable:</span>
                            <div className="text-sm font-mono text-white">{node.variableName || 'Goal'}</div>
                        </div>
                        <div>
                            <span className="text-xs text-msx-textsecondary">Operator:</span>
                            <div className="text-sm font-mono text-white">{node.operator || '=='}</div>
                        </div>
                        <div>
                            <span className="text-xs text-msx-textsecondary">Compare Value:</span>
                            <div className="text-sm font-mono text-white">{node.compareValue || 'Completed'}</div>
                        </div>
                    </div>
                </div>
                <div className="p-2 bg-msx-bgcolor-darker rounded border-l-2 border-msx-primary">
                    <div className="text-xs font-bold mb-1">Expression:</div>
                    <div className="text-sm font-mono text-msx-primary">
                        IF {node.variableName || 'Goal'} {node.operator || '=='} {node.compareValue || 'Completed'}
                    </div>
                </div>
                <div className="text-xs text-msx-textsecondary italic">
                    💡 Use "Edit Condition" button on node to modify
                </div>
            </div>
        );
    }
    if (gameFlowNode.type === 'Start') {
      const node = gameFlowNode as GameFlowStartNode;
      return (
        <StartNodeEditor
          node={node}
          onNodeChange={(updatedNode: GameFlowStartNode) => {
            // Extract only the changed properties
            const changes: Partial<GameFlowStartNode> = {};
            if (updatedNode.initializeGlobals !== node.initializeGlobals) {
              changes.initializeGlobals = updatedNode.initializeGlobals;
            }
            if (updatedNode.systemConfig !== node.systemConfig) {
              changes.systemConfig = updatedNode.systemConfig;
            }
            if (Object.keys(changes).length > 0) {
              onUpdateGameFlowNode(node.id, changes);
            }
          }}
          allAssets={allAssets}
        />
      );
    }
    if (gameFlowNode.type === 'WorldLink') {
      const node = gameFlowNode as any;
      return (
        <div className="space-y-4 p-4">
          <Panel title="World Entry">
            <p className="text-sm text-msx-textsecondary">
              Configure what happens when this world starts. These values are applied once when the flow enters the world.
            </p>
          </Panel>

          <GameFlowGlobalInitializationEditor
            config={node.initializeGlobals}
            onChange={(initializeGlobals) => onUpdateGameFlowNode(node.id, { initializeGlobals })}
            allAssets={allAssets}
            title="World Entry Globals"
            enabledLabel="Initialize global variables when entering this world"
            disabledHint="If disabled, this world inherits the current global values"
          />
        </div>
      );
    }
    return <p className="text-msx-textsecondary">Selected node type: {gameFlowNode.type}</p>;
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col">
    <Panel
      title={panelTitle}
      className="text-xs flex-1 flex flex-col"
      bodyClassName="flex-1 flex flex-col min-h-0"
      headerButtons={onRequestCollapse ? (
        <button
          type="button"
          onClick={onRequestCollapse}
          title="Hide Asset Properties"
          aria-label="Hide Asset Properties"
          className="px-1 py-0.5 text-xs leading-none text-msx-textsecondary hover:text-msx-textprimary hover:bg-msx-border rounded"
        >
          {'>'}
        </button>
      ) : undefined}
    >
      <div className="space-y-1 p-2 flex-1 overflow-y-auto min-h-0">
          {activeEditorType === EditorType.Screen && screenBlockCatalogAnalysis && tilesetForScreenEditor && (
            <div className="mb-2 space-y-2">
              <div className="rounded border border-msx-border/60 bg-msx-bgcolor/40 p-2 text-xs">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-msx-textprimary">Global catalog screens</div>
                    <div className="text-msx-textsecondary">
                      Same export mode; colors show TileBank groups.
                    </div>
                  </div>
                  <span className={screenBlockCatalogAnalysis.sharedCatalogEnabled ? 'text-msx-cyan' : 'text-msx-textsecondary'}>
                    {screenBlockCatalogAnalysis.sharedCatalogEnabled ? 'On' : 'Off'}
                  </span>
                </div>
                <div className="max-h-36 space-y-1 overflow-auto pr-1">
                  {screenBlockCatalogAnalysis.catalogScreens.map(screenOption => (
                    <label
                      key={screenOption.assetId}
                      className={`flex items-center justify-between gap-2 rounded border px-2 py-1 ${
                        screenOption.compatible
                          ? 'border-msx-border/50 bg-msx-bgcolor-darker/50 text-msx-textprimary'
                          : 'border-msx-border/30 bg-msx-bgcolor/20 text-msx-textsecondary/60'
                      }`}
                      title={`${screenOption.tileBankName} | ${screenOption.compatible ? 'Include in this global catalog group' : 'Different export mode or TileBank'}`}
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span
                          className="h-3 w-3 flex-shrink-0 rounded-sm border border-white/30"
                          style={{ backgroundColor: screenOption.tileBankColor }}
                          aria-hidden="true"
                        />
                        <span className="min-w-0 truncate">{screenOption.name}</span>
                      </span>
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-msx-accent"
                        checked={screenOption.enabled}
                        disabled={!screenOption.compatible || !onUpdateAsset}
                        onChange={event => handleSharedCatalogToggle(screenOption.assetId, event.target.checked)}
                      />
                    </label>
                  ))}
                </div>
              </div>
              <ScreenBlockCatalogPanel
                currentMode={screenBlockCatalogAnalysis.currentMode}
                blocks2x2={screenBlockCatalogAnalysis.blocks2x2}
                blocks4x4={screenBlockCatalogAnalysis.blocks4x4}
                tileset={tilesetForScreenEditor}
                currentScreenMode={currentScreenMode}
                editorBaseTileDim={screenBlockCatalogAnalysis.editorBaseTileDim}
                selectedEntryId={selectedScreenCatalogBlockId?.replace(/^catalog:/, '') ?? null}
                onSelectEntry={handleSelectScreenCatalogBlock}
              />
            </div>
          )}
          <>
            {gameFlowNode && activeEditorType === EditorType.GameFlow
              ? renderGameFlowNodeProperties()
              : entityInstance && activeEditorType === EditorType.Screen && screenEditorActiveLayer === 'entities'
                ? renderEntityInstanceProperties()
              : effectZone && activeEditorType === EditorType.Screen
                ? renderEffectZoneProperties()
              : (asset && (
                  activeEditorType === EditorType.Tile
                  || activeEditorType === EditorType.Sprite
                  || activeEditorType === EditorType.Msx2Sprite
                  || activeEditorType === EditorType.Msx2Bitmap
                  || activeEditorType === EditorType.Msx2Screen
                  || activeEditorType === EditorType.Msx2BitmapRoom
                  || activeEditorType === EditorType.Msx2HudFont
                  || activeEditorType === EditorType.Msx2Presentation
                  || activeEditorType === EditorType.Msx2GameFlow
                  || activeEditorType === EditorType.Palette
                  || activeEditorType === EditorType.Screen
                  || activeEditorType === EditorType.Code
                  || activeEditorType === EditorType.BehaviorEditor
                  || activeEditorType === EditorType.ComponentDefinitionEditor
                  || activeEditorType === EditorType.EntityTemplateEditor
                  || activeEditorType === EditorType.GlobalVariables
                  || activeEditorType === EditorType.Dialogue
                ))
                    ? renderAssetProperties()
                    : (activeEditorType === EditorType.Font
                        ? (
                          <div className="space-y-1">
                            <div><strong className="text-msx-highlight">Font:</strong> {msxFontName || "Default MSX1 Font"}</div>
                            {msxFontStats && (<><div><strong className="text-msx-highlight">Total Defined Chars:</strong> {msxFontStats.defined} / 256</div><div><strong className="text-msx-highlight">Editable Range Defined:</strong> {msxFontStats.editableDefined} / {msxFontStats.editableTotal}</div></>)}
                            <p className="text-[0.65rem] text-msx-textsecondary mt-1">Global MSX1 font used for HUD text rendering. Edit Space, 0-9, A-Z.</p>
                          </div>
                        )
                        : (activeEditorType === EditorType.HelpDocs
                            ? <p className="text-msx-textsecondary">Viewing Help & Documentation.</p>
                            : <p className="text-msx-textsecondary">Select an asset or element.</p>
                          )
                      )
            }
            {editorHelpContent}
          </>
        {activeEditorType === EditorType.Screen && screenEditorSelectedTileId && charCodesForDrawingTile && screenEditorActiveLayer !== 'effects' && screenEditorActiveLayer !== 'entities' && (
          <div className="mt-2 pt-2 border-t border-msx-border">
            <strong className="text-msx-highlight block mb-0.5">Char Codes (Drawing Tile):</strong>
            <div className="text-msx-textsecondary text-[0.7rem] break-all">{charCodesForDrawingTile}</div>
          </div>
        )}
      </div>
    </Panel>
    {assetPickerState.isOpen && (
      <AssetPickerModal
          isOpen={assetPickerState.isOpen}
          onClose={() => setAssetPickerState({ isOpen: false, assetTypeToPick: null, onSelect: null, currentValue: null })}
          onSelectAsset={(assetId) => {
              assetPickerState.onSelect?.(assetId);
              setAssetPickerState({ isOpen: false, assetTypeToPick: null, onSelect: null, currentValue: null });
          }}
          assetTypeToPick={assetPickerState.assetTypeToPick!}
          allAssets={assetsWithEntityTemplates}
          currentSelectedId={assetPickerState.currentValue}
      />
    )}
    </div>
  );
};
