
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ScreenMap, Tile, Point, MSXColorValue, ScreenLayerData, ScreenTile, MSX1ColorValue, HUDConfiguration, HUDElement, HUDElementType, TileBank, TileBankDefinition, MSXFont, DataFormat, MSXFontColorAttributes, EntityInstance, MockEntityType, ProjectAsset, Sprite, SpriteFrame, LayoutASMExportData, BehaviorMapASMExportData, CopiedScreenData, ScreenEditorTool, ScreenSelectionRect, EntityTemplate, CopiedLayerData, EffectZone, ScreenEditorLayerName, ComponentDefinition, ContextMenuItem, TileStamp, ScreenBlockExportMode, ScreenBehaviorSource, ScreenKind, resolveEffectZoneType } from '../../types';
import { Panel } from '../common/Panel';
import { DEFAULT_SCREEN_WIDTH_TILES, DEFAULT_SCREEN_HEIGHT_TILES, MSX_SCREEN5_PALETTE, MSX1_PALETTE, SCREEN2_PIXELS_PER_COLOR_SEGMENT, MSX1_PALETTE_IDX_MAP, MSX1_DEFAULT_COLOR, DEFAULT_TILE_BANK_DEFINITIONS, EDITOR_BASE_TILE_DIM_S2 as CONST_EDITOR_BASE_TILE_DIM_S2, EMPTY_CELL_CHAR_CODE as CONST_EMPTY_CELL_CHAR_CODE_EDITOR } from '../../constants';
import { ExportLayoutASMModal } from '../modals/ExportLayoutASMModal';
import { ExportBehaviorMapASMModal } from '../modals/ExportBehaviorMapASMModal';
import { HUDEditorModal } from './HUDEditorModal';
import { generateSuperRLEData, deepCompareTiles, generateScreenMapLayoutBytes, generateOptimizedRLEData, generateBehaviorMapData, resolveScreenBehaviorSource } from '../utils/screenUtils'; // New Import
import { Button } from '../common/Button';
import { ConfirmationModal } from '../modals/ConfirmationModal';
import { NewEffectZoneModal } from '../modals/NewEffectZoneModal';
import { AddSecretTextModal } from '../modals/AddSecretTextModal';
import { PencilIcon, TilesetIcon } from '../icons/MsxIcons';


// Import new sub-components
import { ScreenGrid, ScreenGridOptimizationOverlay } from '../screen_editor/ScreenGrid';
import { ScreenEditorToolbar } from '../screen_editor/ScreenEditorToolbar';
import { ScreenTilesetPanel } from '../screen_editor/ScreenTilesetPanel';
import { ScreenEditorStatusBar } from '../screen_editor/ScreenEditorStatusBar';
import { ScreenSelectionToolsPanel } from '../screen_editor/ScreenSelectionToolsPanel';
import { ScreenOptimizationPanel } from '../screen_editor/ScreenOptimizationPanel';
import { PatrolPathLayer } from '../screen_editor/PatrolPathLayer';
import { getScreenModeMetrics, isScreen2Mode } from '../../utils/screenModeConfig';
import { buildScreenBlockMapFromBytes } from '../../utils/screenOptimization/blockMapBuilder';

/**
 * Props for the ScreenEditor component.
 */
interface ScreenEditorProps {
  /** The screen map asset data to be edited. */
  screenMap: ScreenMap;
  /** Callback to update the screen map data. Can also create new assets. */
  onUpdate: (data: Partial<ScreenMap>, newAssetsToCreate?: ProjectAsset[]) => void;
  /** The tileset available for the editor. */
  tileset: Tile[];
  /** A list of all sprite assets. */
  sprites: ProjectAsset[];
  /** The ID of the currently selected tile for drawing. */
  selectedTileId: string | null;
  /** Callback to set the selected tile ID. */
  setSelectedTileId: (id: string | null) => void;
  /** The entity template currently selected for placement. */
  currentEntityTypeToPlace: EntityTemplate | null;
  /** The current MSX screen mode. */
  currentScreenMode: string;
  /** The tile banks configuration for SCREEN 2 mode. */
  tileBanks?: TileBank[];
  /** The MSX font data for rendering text elements. */
  msx1FontData: MSXFont;
  /** The font color attributes for SCREEN 2 mode. */
  msxFontColorAttributes: MSXFontColorAttributes;
  /** The data format for exporting to ASM. */
  dataOutputFormat: DataFormat;
  /** The ID of the currently selected entity instance. */
  selectedEntityInstanceId: string | null;
  /** Callback to set the selected entity instance ID. */
  onSelectEntityInstance: (id: string | null) => void;
  /** The ID of the currently selected effect zone. */
  selectedEffectZoneId: string | null;
  /** Callback to set the selected effect zone ID. */
  onSelectEffectZone: (id: string | null) => void;
  /** The copied screen data buffer for paste operations. */
  copiedScreenBuffer: CopiedScreenData | null;
  /** Callback to set the copied screen data buffer. */
  setCopiedScreenBuffer: (buffer: CopiedScreenData | null) => void;
  /** A list of all project assets. */
  allProjectAssets: ProjectAsset[];
  /** The copied layer data buffer for paste operations. */
  copiedLayerBuffer: CopiedLayerData | null;
  /** Callback to set the copied layer data buffer. */
  setCopiedLayerBuffer: (buffer: CopiedLayerData | null) => void;
  /** Callback to set a message in the status bar. */
  setStatusBarMessage: (message: string) => void;
  /** Optional callback when the active layer changes. */
  onActiveLayerChange?: (layer: ScreenEditorLayerName) => void;
  /** The list of all component definitions. */
  componentDefinitions: ComponentDefinition[];
  /** A list of all entity templates. */
  entityTemplates: EntityTemplate[];
  /** Callback to show the generated map file. */
  onShowMapFile: () => void;
  /** Callback to navigate to a different asset editor. */
  onNavigateToAsset: (assetId: string) => void;
  /** Callback to show a context menu. */
  onShowContextMenu: (position: { x: number; y: number }, items: ContextMenuItem[]) => void;
  /** The state of the waypoint picker. */
  waypointPickerState: { isPicking: boolean; waypointPrefix: 'waypoint1' | 'waypoint2'; };
  /** Callback for when a waypoint is picked. */
  onWaypointPicked: (point: Point) => void;
  /** The current zoom level of the editor. */
  zoom: number;
  /** Callback to set the zoom level. */
  setZoom: (zoom: number) => void;
  /** Whether sector grid lines are visible. */
  showSectorLines: boolean;
  /** Callback to toggle sector grid lines visibility. */
  onToggleSectorLines: () => void;
}


/**
 * A comprehensive editor for creating and modifying screen maps.
 * It integrates a grid for tile placement, a tileset panel, tool selection,
 * and layer management for background, collision, and entities.
 */
export const ScreenEditor: React.FC<ScreenEditorProps> = ({
  screenMap, onUpdate, tileset, sprites, selectedTileId, setSelectedTileId, currentEntityTypeToPlace,
  currentScreenMode, tileBanks, msx1FontData, msxFontColorAttributes, dataOutputFormat,
  selectedEntityInstanceId, onSelectEntityInstance, selectedEffectZoneId, onSelectEffectZone,
  copiedScreenBuffer, setCopiedScreenBuffer, allProjectAssets,
  copiedLayerBuffer, setCopiedLayerBuffer, setStatusBarMessage,
  onActiveLayerChange, componentDefinitions, entityTemplates, onShowMapFile,
  onNavigateToAsset, onShowContextMenu, waypointPickerState, onWaypointPicked,
  zoom, setZoom, showSectorLines, onToggleSectorLines
}) => {

  const screenModeMetrics = useMemo(() => getScreenModeMetrics(currentScreenMode), [currentScreenMode]);
  const isScreen2 = isScreen2Mode(currentScreenMode);
  const EDITOR_BASE_TILE_DIM = screenModeMetrics.baseTileSize;

  useEffect(() => {
    const targetWidth = screenModeMetrics.widthTiles;
    const targetHeight = screenModeMetrics.heightTiles;
    const needsResize = screenMap.width !== targetWidth || screenMap.height !== targetHeight;
    if (!needsResize) {
      return;
    }

    const resizeLayer = (layer: ScreenLayerData): ScreenLayerData => {
      const newLayer: ScreenLayerData = [];
      for (let row = 0; row < targetHeight; row++) {
        const sourceRow = layer[row] ?? [];
        const resizedRow: ScreenTile[] = [];
        for (let col = 0; col < targetWidth; col++) {
          const sourceTile = sourceRow[col];
          resizedRow.push(sourceTile ? { ...sourceTile } : { tileId: null });
        }
        newLayer.push(resizedRow);
      }
      return newLayer;
    };

    const clampedActiveWidth = Math.min(screenMap.activeAreaWidth ?? targetWidth, targetWidth);
    const clampedActiveHeight = Math.min(screenMap.activeAreaHeight ?? targetHeight, targetHeight);
    const maxActiveX = Math.max(0, targetWidth - clampedActiveWidth);
    const maxActiveY = Math.max(0, targetHeight - clampedActiveHeight);
    const clampedActiveX = Math.min(screenMap.activeAreaX ?? 0, maxActiveX);
    const clampedActiveY = Math.min(screenMap.activeAreaY ?? 0, maxActiveY);

    onUpdate({
      width: targetWidth,
      height: targetHeight,
      layers: {
        ...screenMap.layers,
        background: resizeLayer(screenMap.layers.background),
        collision: resizeLayer(screenMap.layers.collision),
        effects: resizeLayer(screenMap.layers.effects),
      },
      activeAreaWidth: clampedActiveWidth,
      activeAreaHeight: clampedActiveHeight,
      activeAreaX: clampedActiveX,
      activeAreaY: clampedActiveY,
    });
  }, [
    onUpdate,
    screenMap.activeAreaHeight,
    screenMap.activeAreaWidth,
    screenMap.activeAreaX,
    screenMap.activeAreaY,
    screenMap.height,
    screenMap.layers,
    screenMap.width,
    screenModeMetrics,
  ]);

  // Initialize activeLayer from localStorage if available
  const getInitialActiveLayer = (): ScreenEditorLayerName => {
    try {
      const savedLayer = localStorage.getItem('screenEditorLastActiveLayer');
      if (savedLayer && ['background', 'collision', 'effects', 'entities'].includes(savedLayer)) {
        return savedLayer as ScreenEditorLayerName;
      }
    } catch (error) {
      console.warn('Failed to load last active layer from localStorage:', error);
    }
    return 'background'; // Default fallback
  };

  const getInitialOptimizationOverlayMode = (): 'off' | 'blocks2x2' | 'blocks4x4' => {
    try {
      const savedMode = localStorage.getItem('screenEditorOptimizationOverlayMode');
      if (savedMode === 'off' || savedMode === 'blocks2x2' || savedMode === 'blocks4x4') {
        return savedMode;
      }
    } catch (error) {
      console.warn('Failed to load optimization overlay mode from localStorage:', error);
    }
    return 'off';
  };

  const [activeLayer, setActiveLayerInternal] = useState<ScreenEditorLayerName>(getInitialActiveLayer);
  const [lastClickedCell, setLastClickedCell] = useState<Point | null>(null);

  const [isExportLayoutModalOpen, setIsExportLayoutModalOpen] = useState(false);
  const [layoutASMExportData, setLayoutASMExportData] = useState<LayoutASMExportData | null>(null);

  const [isExportBehaviorMapModalOpen, setIsExportBehaviorMapModalOpen] = useState(false);
  const [behaviorMapASMExportData, setBehaviorMapASMExportData] = useState<BehaviorMapASMExportData | null>(null);


  const [isHudEditorModalOpen, setIsHudEditorModalOpen] = useState(false);

  const [localActiveX, setLocalActiveX] = useState<string>(String(screenMap.activeAreaX ?? 0));
  const [localActiveY, setLocalActiveY] = useState<string>(String(screenMap.activeAreaY ?? 0));
  const [localActiveW, setLocalActiveW] = useState<string>(String(screenMap.activeAreaWidth ?? screenMap.width ?? 0));
  const [localActiveH, setLocalActiveH] = useState<string>(String(screenMap.activeAreaHeight ?? screenMap.height ?? 0));

  const [isPasteConfirmModalOpen, setIsPasteConfirmModalOpen] = useState(false);
  const [isNewEffectZoneModalOpen, setIsNewEffectZoneModalOpen] = useState(false);
  const [isAddSecretTextModalOpen, setIsAddSecretTextModalOpen] = useState(false);

  const [currentScreenTool, setCurrentScreenTool] = useState<ScreenEditorTool>('draw');
  const [selectionRect, setSelectionRect] = useState<ScreenSelectionRect | null>(null);
  const [currentSector, setCurrentSector] = useState<0 | 1 | 2>(0); // Track current MSX Screen 2 sector
  // Stamp tool state
  const [stamps, setStamps] = useState<TileStamp[]>([]);
  const [selectedStampId, setSelectedStampId] = useState<string | null>(null);
  const [optimizationOverlayMode, setOptimizationOverlayMode] = useState<'off' | 'blocks2x2' | 'blocks4x4'>(getInitialOptimizationOverlayMode);

  const screenKind = screenMap.screenKind ?? 'playable';

  const screenKindValidationIssues = useMemo(() => {
    const normalize = (value: string | undefined) => (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const getTemplateForEntity = (entity: EntityInstance) => entityTemplates.find(template => template.id === entity.entityTemplateId);
    const templateHasComponent = (template: EntityTemplate | undefined, fragment: string) => {
      if (!template) return false;
      const normalizedFragment = normalize(fragment);
      return template.components.some(component => {
        const componentDef = componentDefinitions.find(definition => definition.id === component.definitionId);
        return normalize(component.definitionId).includes(normalizedFragment) || normalize(componentDef?.name).includes(normalizedFragment);
      });
    };
    const isFakePlayerTemplate = (template: EntityTemplate | undefined) => {
      if (!template) return false;
      const name = normalize(template.name);
      const id = normalize(template.id);
      return name.includes('fakeplayer') ||
        id.includes('fakeplayer') ||
        templateHasComponent(template, 'autocontrol') ||
        templateHasComponent(template, 'autocontrolscript');
    };
    const isPlayerTemplate = (template: EntityTemplate | undefined) => {
      if (!template || isFakePlayerTemplate(template)) return false;
      const name = normalize(template.name);
      const id = normalize(template.id);
      return template.isPlayer === true ||
        name === 'player' ||
        id === 'player' ||
        id === 'tplplayer' ||
        templateHasComponent(template, 'playerinput') ||
        templateHasComponent(template, 'platformercontrol');
    };

    const playerEntities: string[] = [];
    const fakePlayerEntities: string[] = [];

    screenMap.layers.entities.forEach(entity => {
      const template = getTemplateForEntity(entity);
      if (isFakePlayerTemplate(template)) {
        fakePlayerEntities.push(entity.name || template?.name || entity.id);
      } else if (isPlayerTemplate(template)) {
        playerEntities.push(entity.name || template?.name || entity.id);
      }
    });

    const issues: string[] = [];
    const isNonPlayable = screenKind !== 'playable';

    if (playerEntities.length > 0 && fakePlayerEntities.length > 0) {
      issues.push(`Player and FakePlayer are mixed in this screen: ${[...playerEntities, ...fakePlayerEntities].join(', ')}.`);
    }

    if (screenKind === 'playable' && fakePlayerEntities.length > 0) {
      issues.push(`Playable screens should not contain FakePlayer entities: ${fakePlayerEntities.join(', ')}.`);
    }

    if (isNonPlayable && playerEntities.length > 0) {
      issues.push(`${screenKind} screens should not contain the real Player entity: ${playerEntities.join(', ')}.`);
    }

    if (isNonPlayable && fakePlayerEntities.length === 0) {
      issues.push(`${screenKind} screen has no FakePlayer entity with AutoControlScript.`);
    }

    if (screenKind === 'playable' && playerEntities.length === 0) {
      issues.push('Playable screen has no Player entity.');
    }

    if (playerEntities.length > 1) {
      issues.push(`Multiple Player entities detected: ${playerEntities.join(', ')}.`);
    }

    if (fakePlayerEntities.length > 1) {
      issues.push(`Multiple FakePlayer entities detected: ${fakePlayerEntities.join(', ')}.`);
    }

    return issues;
  }, [componentDefinitions, entityTemplates, screenKind, screenMap.layers.entities]);

  const getNextEntityInstanceName = useCallback((template: EntityTemplate): string => {
    const baseName = (template.name || 'Entity').trim() || 'Entity';
    const escapedBase = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const numberedNameRegex = new RegExp(`^${escapedBase}\\s+(\\d+)$`, 'i');
    let maxNumber = 0;

    const consumeEntities = (entities: EntityInstance[] | undefined) => {
      if (!entities) return;
      entities.forEach(entity => {
        if (entity.entityTemplateId !== template.id) return;
        const rawName = (entity.name || '').trim();
        if (!rawName) return;
        if (rawName.toLowerCase() === baseName.toLowerCase()) {
          maxNumber = Math.max(maxNumber, 1);
          return;
        }
        const match = rawName.match(numberedNameRegex);
        if (!match) return;
        const parsed = parseInt(match[1], 10);
        if (!Number.isNaN(parsed)) {
          maxNumber = Math.max(maxNumber, parsed);
        }
      });
    };

    allProjectAssets.forEach(asset => {
      if (asset.type !== 'screenmap') return;
      const mapData = asset.data as ScreenMap;
      consumeEntities(mapData.layers?.entities);
    });

    // Ensure unsaved entities in the active screen are also considered.
    consumeEntities(screenMap.layers.entities);

    return `${baseName} ${Math.max(1, maxNumber + 1)}`;
  }, [allProjectAssets, screenMap.layers.entities]);

  const setActiveLayer = (newLayer: ScreenEditorLayerName) => {
    setActiveLayerInternal(newLayer);
    onActiveLayerChange?.(newLayer); // Call the callback prop

    // Save to localStorage for persistence
    try {
      localStorage.setItem('screenEditorLastActiveLayer', newLayer);
    } catch (error) {
      console.warn('Failed to save active layer to localStorage:', error);
    }
  };


  useEffect(() => {
    setLocalActiveX((screenMap.activeAreaX ?? 0).toString());
    setLocalActiveY((screenMap.activeAreaY ?? 0).toString());
    setLocalActiveW((screenMap.activeAreaWidth ?? screenMap.width ?? 0).toString());
    setLocalActiveH((screenMap.activeAreaHeight ?? screenMap.height ?? 0).toString());
  }, [screenMap.activeAreaX, screenMap.activeAreaY, screenMap.activeAreaWidth, screenMap.activeAreaHeight, screenMap.width, screenMap.height]);

  // Handle ESC key to deselect stamp
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (selectedStampId) {
          setSelectedStampId(null);
          setCurrentScreenTool('draw');
          setStatusBarMessage('Stamp deselected');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedStampId, setStatusBarMessage]);

  const handleActiveAreaInputChange = (
    prop: 'activeAreaX' | 'activeAreaY' | 'activeAreaWidth' | 'activeAreaHeight',
    value: string
  ) => {
    const setter = {
      activeAreaX: setLocalActiveX, activeAreaY: setLocalActiveY,
      activeAreaWidth: setLocalActiveW, activeAreaHeight: setLocalActiveH,
    }[prop];
    setter(value);
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) && value.trim() !== "") return;
    onUpdate({ [prop]: value.trim() === "" ? (prop.includes("Width") || prop.includes("Height") ? 1 : 0) : numValue });
  };

  const backgroundBlockMode: ScreenBlockExportMode = screenMap.blockOptimization?.backgroundMode ?? 'raw';
  const behaviorSource: ScreenBehaviorSource = resolveScreenBehaviorSource(screenMap);

  const activeAreaBlockAlignment = useMemo(() => {
    if (backgroundBlockMode === 'raw') {
      return {
        blockSize: null,
        isValid: true,
        canSnap: false,
        message: 'Raw mode ignores block alignment.',
        nextX: screenMap.activeAreaX ?? 0,
        nextY: screenMap.activeAreaY ?? 0,
        nextWidth: screenMap.activeAreaWidth ?? screenMap.width,
        nextHeight: screenMap.activeAreaHeight ?? screenMap.height,
      };
    }

    const blockSize = backgroundBlockMode === 'blocks4x4' ? 4 : 2;
    const activeX = screenMap.activeAreaX ?? 0;
    const activeY = screenMap.activeAreaY ?? 0;
    const activeWidth = screenMap.activeAreaWidth ?? screenMap.width;
    const activeHeight = screenMap.activeAreaHeight ?? screenMap.height;
    const isFullWidthHudRowsMode = activeX === 0 && activeWidth === screenMap.width;

    if (isFullWidthHudRowsMode) {
      const topHudRows = activeY;
      const bottomHudRows = Math.max(0, screenMap.height - (activeY + activeHeight));
      const gameplayRowsAligned = activeHeight % blockSize === 0;
      const topHudAligned = topHudRows % blockSize === 0;
      const bottomHudAligned = bottomHudRows % blockSize === 0;
      const isValid = gameplayRowsAligned && topHudAligned && bottomHudAligned;
      const snappedTopHudRows = Math.ceil(topHudRows / blockSize) * blockSize;
      const snappedBottomHudRows = Math.ceil(bottomHudRows / blockSize) * blockSize;
      const nextHeight = screenMap.height - snappedTopHudRows - snappedBottomHudRows;
      const canSnap = !isValid && nextHeight >= blockSize && nextHeight % blockSize === 0;

      if (isValid) {
        return {
          blockSize,
          isValid: true,
          canSnap: false,
          message: `HUD rows aligned for ${blockSize}x${blockSize}: top ${topHudRows}, gameplay ${activeHeight}, bottom ${bottomHudRows}.`,
          nextX: 0,
          nextY: activeY,
          nextWidth: screenMap.width,
          nextHeight: activeHeight,
        };
      }

      if (canSnap) {
        return {
          blockSize,
          isValid: false,
          canSnap: true,
          message: `HUD rows not aligned for ${blockSize}x${blockSize}. Snap to top ${snappedTopHudRows}, gameplay ${nextHeight}, bottom ${snappedBottomHudRows}.`,
          nextX: 0,
          nextY: snappedTopHudRows,
          nextWidth: screenMap.width,
          nextHeight,
        };
      }

      return {
        blockSize,
        isValid: false,
        canSnap: false,
        message: `HUD rows consume too much space for a valid ${blockSize}x${blockSize} gameplay band.`,
        nextX: 0,
        nextY: activeY,
        nextWidth: screenMap.width,
        nextHeight: activeHeight,
      };
    }

    const widthAligned = activeWidth % blockSize === 0;
    const heightAligned = activeHeight % blockSize === 0;
    const originAligned = activeX % blockSize === 0 && activeY % blockSize === 0;
    const nextWidth = Math.floor(activeWidth / blockSize) * blockSize;
    const nextHeight = Math.floor(activeHeight / blockSize) * blockSize;
    const isValid = originAligned && widthAligned && heightAligned;
    const canSnap = !isValid && nextWidth >= blockSize && nextHeight >= blockSize;

    if (isValid) {
      return {
        blockSize,
        isValid: true,
        canSnap: false,
        message: `General area aligned for ${blockSize}x${blockSize}. For HUD rows, prefer full-width gameplay with top/bottom bands.`,
        nextX: activeX,
        nextY: activeY,
        nextWidth: activeWidth,
        nextHeight: activeHeight,
      };
    }

    if (canSnap) {
      return {
        blockSize,
        isValid: false,
        canSnap: true,
        message: `Falls back to raw. Snap gameplay area to ${nextWidth}x${nextHeight}. For HUD rows, prefer full-width gameplay with aligned top/bottom bands.`,
        nextX: activeX,
        nextY: activeY,
        nextWidth,
        nextHeight,
      };
    }

    return {
      blockSize,
      isValid: false,
      canSnap: false,
      message: `Current Active Area is too small for ${blockSize}x${blockSize} block export.`,
      nextX: activeX,
      nextY: activeY,
      nextWidth,
      nextHeight,
    };
  }, [
    backgroundBlockMode,
    screenMap.activeAreaX,
    screenMap.activeAreaY,
    screenMap.activeAreaHeight,
    screenMap.activeAreaWidth,
    screenMap.height,
    screenMap.width,
  ]);

  const handleSnapActiveAreaToBlockMode = useCallback(() => {
    if (backgroundBlockMode === 'raw') {
      setStatusBarMessage('Raw mode does not need Active Area snapping.');
      return;
    }

    if (!activeAreaBlockAlignment.canSnap || !activeAreaBlockAlignment.blockSize) {
      setStatusBarMessage(activeAreaBlockAlignment.message);
      return;
    }

    const nextX = activeAreaBlockAlignment.nextX;
    const nextY = activeAreaBlockAlignment.nextY;
    const nextWidth = activeAreaBlockAlignment.nextWidth;
    const nextHeight = activeAreaBlockAlignment.nextHeight;

    setLocalActiveX(String(nextX));
    setLocalActiveY(String(nextY));
    setLocalActiveW(String(nextWidth));
    setLocalActiveH(String(nextHeight));
    onUpdate({
      activeAreaX: nextX,
      activeAreaY: nextY,
      activeAreaWidth: nextWidth,
      activeAreaHeight: nextHeight,
    });
    setStatusBarMessage(`Active Area snapped to X=${nextX}, Y=${nextY}, W=${nextWidth}, H=${nextHeight} for ${activeAreaBlockAlignment.blockSize}x${activeAreaBlockAlignment.blockSize} mode.`);
  }, [activeAreaBlockAlignment, backgroundBlockMode, onUpdate, setStatusBarMessage]);

  const handleEntityPlace = useCallback((point: Point) => {
    if (!currentEntityTypeToPlace) {
      return;
    }
    const normalizeTemplateName = (value: string | undefined) => (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const templateName = normalizeTemplateName(currentEntityTypeToPlace.name);
    const templateId = normalizeTemplateName(currentEntityTypeToPlace.id);
    const hasAutoControlScript = currentEntityTypeToPlace.components.some(component => component.definitionId === 'comp_auto_control_script');
    const isFakePlayerTemplate = templateName.includes('fakeplayer') || templateId.includes('fakeplayer') || hasAutoControlScript;
    const isPlayerTemplate = !isFakePlayerTemplate && (
      currentEntityTypeToPlace.isPlayer === true ||
      templateName === 'player' ||
      templateId === 'player' ||
      templateId === 'tplplayer' ||
      currentEntityTypeToPlace.components.some(component => component.definitionId === 'comp_player_input')
    );

    if (screenKind === 'playable' && isFakePlayerTemplate) {
      setStatusBarMessage('Warning: FakePlayer is intended for tutorial/dialog/cutscene screens, not playable screens.');
    } else if (screenKind !== 'playable' && isPlayerTemplate) {
      setStatusBarMessage(`Warning: ${screenKind} screens should use FakePlayer/AutoControlScript, not the real Player.`);
    }

    const newEntityInstance: EntityInstance = {
      id: `entity_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      entityTemplateId: currentEntityTypeToPlace.id,
      name: getNextEntityInstanceName(currentEntityTypeToPlace),
      jobRate: 100,
      jobEntry: 0,
      position: { x: point.x, y: point.y },
      componentOverrides: {},
    };
    const updatedEntities = [...screenMap.layers.entities, newEntityInstance];
    onUpdate({ layers: { ...screenMap.layers, entities: updatedEntities } });
  }, [currentEntityTypeToPlace, getNextEntityInstanceName, onUpdate, screenKind, screenMap.layers, setStatusBarMessage]);

  const handleAddFakePlayerEntity = useCallback(() => {
    const fakePlayerTemplate = entityTemplates.find(template => template.id === 'tpl_fake_player' || template.name.toLowerCase().replace(/[^a-z0-9]/g, '') === 'fakeplayer');
    if (!fakePlayerTemplate) {
      setStatusBarMessage('FakePlayer template not found. Load default entity templates first.');
      return;
    }

    const newEntityInstance: EntityInstance = {
      id: `entity_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      entityTemplateId: fakePlayerTemplate.id,
      name: getNextEntityInstanceName(fakePlayerTemplate),
      jobRate: 100,
      jobEntry: 0,
      position: {
        x: Math.max(0, Math.floor(screenMap.width / 2)),
        y: Math.max(0, Math.floor(screenMap.height / 2)),
      },
      componentOverrides: {},
    };

    onUpdate({ layers: { ...screenMap.layers, entities: [...screenMap.layers.entities, newEntityInstance] } });
    onSelectEntityInstance(newEntityInstance.id);
    setActiveLayer('entities');
    handleSetScreenTool('select');
    setStatusBarMessage('FakePlayer added to this non-playable screen.');
  }, [entityTemplates, getNextEntityInstanceName, handleSetScreenTool, onSelectEntityInstance, onUpdate, screenMap.height, screenMap.layers, screenMap.width, setActiveLayer, setStatusBarMessage]);

  const handleAddNewEffectZone = () => {
    if (activeLayer !== 'effects') {
      setActiveLayer('effects');
      setCurrentScreenTool('select');
    }
    if (!selectionRect) {
      setStatusBarMessage('Select a rectangular area in the Effects layer before creating a zone.');
      return;
    }
    setIsNewEffectZoneModalOpen(true);
  };

  const handleCreateEffectZone = (zoneData: {
    name: string;
    effectType: EffectZone['effectType'];
    params: NonNullable<EffectZone['params']>;
    description: string;
  }) => {
    if (!selectionRect) {
      setStatusBarMessage('The selection was cleared before the zone could be created.');
      setIsNewEffectZoneModalOpen(false);
      return;
    }
    const newZone: EffectZone = {
      id: `efz_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      name: zoneData.name,
      rect: { ...selectionRect },
      effectType: zoneData.effectType,
      params: zoneData.params,
      description: zoneData.description,
    };
    const updatedEffectZones = [...(screenMap.effectZones || []), newZone];
    onUpdate({ effectZones: updatedEffectZones });
    onSelectEffectZone(newZone.id);
    setIsNewEffectZoneModalOpen(false);
    setStatusBarMessage(`Added new effect zone: ${newZone.name}`);
  };

  const selectedEffectZone = useMemo(
    () => (screenMap.effectZones || []).find(zone => zone.id === selectedEffectZoneId) || null,
    [screenMap.effectZones, selectedEffectZoneId]
  );

  const isSecretZoneEditingSelectionValid = useCallback(() => {
    if (!selectedEffectZone) {
      setStatusBarMessage('Select a Secret Zone before editing tiles in the Effects layer.');
      return false;
    }
    if (resolveEffectZoneType(selectedEffectZone) !== 'secretZone') {
      setStatusBarMessage('Only Secret Zone uses editable tiles in the Effects layer.');
      return false;
    }
    return true;
  }, [selectedEffectZone, setStatusBarMessage]);

  const isPointInsideSelectedSecretZone = useCallback((x: number, y: number) => {
    if (!selectedEffectZone) return false;
    const { rect } = selectedEffectZone;
    return x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height;
  }, [selectedEffectZone]);

  const currentTileBankAsset = useMemo(() => {
    if (!screenMap.tileBankAssetId) return null;
    const asset = allProjectAssets.find(projectAsset => projectAsset.id === screenMap.tileBankAssetId && projectAsset.type === 'tilebank');
    return asset ? asset.data as TileBank : null;
  }, [allProjectAssets, screenMap.tileBankAssetId]);

  const tileBankDefinitions = useMemo(() => (
    isScreen2 && tileBanks && tileBanks.length > 0
      ? tileBanks.flatMap(tb => tb.banks || [])
      : undefined
  ), [isScreen2, tileBanks]);

  const backgroundOptimizationAnalysis = useMemo(() => {
    const activeAreaX = screenMap.activeAreaX ?? 0;
    const activeAreaY = screenMap.activeAreaY ?? 0;
    const activeAreaWidth = screenMap.activeAreaWidth ?? screenMap.width;
    const activeAreaHeight = screenMap.activeAreaHeight ?? screenMap.height;
    const layoutBytes = generateScreenMapLayoutBytes(screenMap, tileset, tileBankDefinitions, currentScreenMode);
    const buildPreview = (mode: Extract<ScreenBlockExportMode, 'blocks2x2' | 'blocks4x4'>) => {
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

      const overlay: ScreenGridOptimizationOverlay = {
        mode,
        blocks: blockMap.mapIndices.map((catalogIndex, index) => ({
          x: activeAreaX + ((index % blockMap.mapWidth) * blockMap.blockWidth),
          y: activeAreaY + (Math.floor(index / blockMap.mapWidth) * blockMap.blockHeight),
          width: blockMap.blockWidth,
          height: blockMap.blockHeight,
          catalogIndex,
          usageCount: usageCountByCatalogIndex[catalogIndex] ?? 0,
          isRepeated: (usageCountByCatalogIndex[catalogIndex] ?? 0) > 1,
        })),
      };

      return {
        blockWidth: blockMap.blockWidth,
        blockHeight: blockMap.blockHeight,
        uniqueBlockCount: blockMap.catalog.length,
        repeatedBlockCount: blockMap.repeatedBlockCount,
        optimizedLengthBytes: blockMap.optimizedLengthBytes,
        sourceLengthBytes: blockMap.sourceLengthBytes,
        savingsBytes: blockMap.savingsBytes,
        overlay,
      };
    };

    const blocks2x2 = buildPreview('blocks2x2');
    const blocks4x4 = buildPreview('blocks4x4');
    const candidates = [
      { mode: 'raw' as const, optimizedLengthBytes: layoutBytes.length },
      ...(blocks2x2 ? [{ mode: 'blocks2x2' as const, optimizedLengthBytes: blocks2x2.optimizedLengthBytes }] : []),
      ...(blocks4x4 ? [{ mode: 'blocks4x4' as const, optimizedLengthBytes: blocks4x4.optimizedLengthBytes }] : []),
    ];
    const bestCandidate = candidates.reduce((best, current) =>
      current.optimizedLengthBytes < best.optimizedLengthBytes ? current : best
    );

    return {
      rawLengthBytes: layoutBytes.length,
      blocks2x2,
      blocks4x4,
      recommendedMode: bestCandidate.mode,
    };
  }, [currentScreenMode, screenMap, tileBankDefinitions, tileset]);

  const backgroundBlockPreview = useMemo(() => {
    if (backgroundBlockMode === 'blocks2x2') {
      return backgroundOptimizationAnalysis.blocks2x2;
    }
    if (backgroundBlockMode === 'blocks4x4') {
      return backgroundOptimizationAnalysis.blocks4x4;
    }
    return null;
  }, [backgroundBlockMode, backgroundOptimizationAnalysis]);

  const backgroundOptimizationOverlay = useMemo<ScreenGridOptimizationOverlay | null>(() => {
    if (optimizationOverlayMode === 'blocks2x2') {
      return backgroundOptimizationAnalysis.blocks2x2?.overlay ?? null;
    }
    if (optimizationOverlayMode === 'blocks4x4') {
      return backgroundOptimizationAnalysis.blocks4x4?.overlay ?? null;
    }
    return null;
  }, [backgroundOptimizationAnalysis, optimizationOverlayMode]);

  useEffect(() => {
    try {
      localStorage.setItem('screenEditorOptimizationOverlayMode', optimizationOverlayMode);
    } catch (error) {
      console.warn('Failed to save optimization overlay mode to localStorage:', error);
    }
  }, [optimizationOverlayMode]);

  useEffect(() => {
    if (optimizationOverlayMode !== 'off' && !backgroundOptimizationOverlay) {
      setOptimizationOverlayMode('off');
    }
  }, [backgroundOptimizationOverlay, optimizationOverlayMode]);

  const canAddSecretText = useMemo(() => {
    return !!selectedEffectZone
      && resolveEffectZoneType(selectedEffectZone) === 'secretZone'
      && currentScreenMode === "SCREEN 2 (Graphics I)"
      && !!currentTileBankAsset;
  }, [selectedEffectZone, currentScreenMode, currentTileBankAsset]);

  const handleAddSecretText = () => {
    if (!canAddSecretText) {
      setStatusBarMessage('Select a Secret Zone with a valid SCREEN 2 TileBank before adding text.');
      return;
    }
    setIsAddSecretTextModalOpen(true);
  };

  const handleInsertSecretText = (payload: { fontTileId: string; text: string; offsetX: number; offsetY: number }) => {
    if (!selectedEffectZone || !currentTileBankAsset) {
      setStatusBarMessage('No Secret Zone or TileBank available for text insertion.');
      setIsAddSecretTextModalOpen(false);
      return;
    }

    const allAssignments = currentTileBankAsset.banks.flatMap(bank =>
      Object.entries(bank.assignedTiles).map(([tileId, assignment]) => ({ tileId, assignment }))
    );
    const selectedAssignment = allAssignments.find(entry =>
      entry.tileId === payload.fontTileId && Array.isArray((entry.assignment as any).fontCharacters)
    );

    if (!selectedAssignment) {
      setStatusBarMessage('Selected font assignment is no longer available in the TileBank.');
      return;
    }

    const fontCharacters = (selectedAssignment.assignment as any).fontCharacters as Array<{ character: string }>;
    const charIndexByCharacter = new Map<string, number>();
    fontCharacters.forEach((charInfo, index) => {
      if (!charIndexByCharacter.has(charInfo.character)) {
        charIndexByCharacter.set(charInfo.character, index);
      }
    });

    const unsupportedChars = Array.from(new Set(
      payload.text
        .split('')
        .filter(char => char !== ' ')
        .filter(char => !charIndexByCharacter.has(char) && !charIndexByCharacter.has(char.toUpperCase()))
    ));

    if (unsupportedChars.length > 0) {
      setStatusBarMessage(`Unsupported characters for selected font: ${unsupportedChars.join(' ')}`);
      return;
    }

    if (payload.offsetX < 0 || payload.offsetY < 0) {
      setStatusBarMessage('Text offset must be zero or positive.');
      return;
    }

    if (payload.offsetY >= selectedEffectZone.rect.height) {
      setStatusBarMessage('Text Y offset falls outside the selected Secret Zone.');
      return;
    }

    if (payload.offsetX + payload.text.length > selectedEffectZone.rect.width) {
      setStatusBarMessage('Text does not fit inside the selected Secret Zone width.');
      return;
    }

    const absoluteY = selectedEffectZone.rect.y + payload.offsetY;
    const updatedEffectsLayer = screenMap.layers.effects.map(row => row.map(cell => ({ ...cell })));

    payload.text.split('').forEach((char, index) => {
      const absoluteX = selectedEffectZone.rect.x + payload.offsetX + index;
      if (char === ' ') {
        updatedEffectsLayer[absoluteY][absoluteX] = { tileId: null };
        return;
      }

      const charIndex = charIndexByCharacter.get(char) ?? charIndexByCharacter.get(char.toUpperCase()) ?? 0;
      updatedEffectsLayer[absoluteY][absoluteX] = {
        tileId: payload.fontTileId,
        subTileX: charIndex,
        subTileY: 0,
      };
    });

    onUpdate({
      layers: {
        ...screenMap.layers,
        effects: updatedEffectsLayer,
      },
    });
    setIsAddSecretTextModalOpen(false);
    setStatusBarMessage(`Inserted text into ${selectedEffectZone.name}.`);
  };


  // Helper function to get MSX Screen 2 sector from Y coordinate
  const getSectorFromY = (y: number): 0 | 1 | 2 => {
    if (y < 8) return 0;      // Sector 0: Lines 0-7
    if (y < 16) return 1;     // Sector 1: Lines 8-15
    return 2;                 // Sector 2: Lines 16-23
  };

  const handleTilePlace = useCallback((point: Point) => {
    setLastClickedCell(point);

    // Update current sector based on Y position (for SCREEN 2)
    if (isScreen2) {
      const sector = getSectorFromY(point.y);
      setCurrentSector(sector);

      // BLOCK tile placement if no TileBank is selected
      if (!screenMap.tileBankAssetId) {
        setStatusBarMessage(`⚠ Cannot place tiles! Please select a TileBank from the toolbar first.`);
        return;
      }

      setStatusBarMessage(`Sector ${sector} (Lines ${sector * 8}-${sector * 8 + 7}) | Tile position: (${point.x}, ${point.y})`);

      // Validate tile belongs to this sector (if drawing)
      if (selectedTileId && currentScreenTool === 'draw') {
        const tileBankAsset = allProjectAssets.find(asset => asset.id === screenMap.tileBankAssetId && asset.type === 'tilebank');
        if (tileBankAsset) {
          const tileBankData = tileBankAsset.data as TileBank;
          const sectorBank = tileBankData.banks[sector];

          if (sectorBank && !sectorBank.assignedTiles[selectedTileId]) {
            setStatusBarMessage(`⚠ Cannot place tile here! This tile is not assigned to Sector ${sector}. Deselecting tile.`);
            setSelectedTileId(null); // Clear invalid tile selection
            return; // Block placement
          }
        }
      }
    }

    if (activeLayer === 'entities' || currentScreenTool === 'select') return;

    const newLayers = { ...screenMap.layers };
    const layerToUpdateKey = activeLayer as 'background' | 'collision' | 'effects';
    const layerToUpdate = newLayers[layerToUpdateKey];
    const currentLayerData = layerToUpdate.map(row => [...row]);
    let changed = false;

    if (activeLayer === 'effects' && !isSecretZoneEditingSelectionValid()) {
      return;
    }

    // Handle stamp placement
    if (currentScreenTool === 'stamp' && selectedStampId) {
      const selectedStamp = stamps.find(s => s.id === selectedStampId);
      if (selectedStamp) {
        if (activeLayer === 'effects') {
          const stampFitsInZone = selectedStamp.tiles.every((row, dy) =>
            row.every((stampTile, dx) => !stampTile || isPointInsideSelectedSecretZone(point.x + dx, point.y + dy))
          );
          if (!stampFitsInZone) {
            setStatusBarMessage('Stamp must stay inside the selected Secret Zone.');
            return;
          }
        }
        // Place the entire stamp pattern starting at the clicked position
        for (let dy = 0; dy < selectedStamp.height; dy++) {
          for (let dx = 0; dx < selectedStamp.width; dx++) {
            const targetX = point.x + dx;
            const targetY = point.y + dy;
            if (targetY >= 0 && targetY < currentLayerData.length && targetX >= 0 && targetX < currentLayerData[0].length) {
              const stampTile = selectedStamp.tiles[dy][dx];
              if (stampTile) {
                currentLayerData[targetY][targetX] = { ...stampTile };
                changed = true;
              }
            }
          }
        }
        if (changed) {
          newLayers[layerToUpdateKey] = currentLayerData;
          onUpdate({ layers: newLayers });
        }
        return;
      }
    }

    const selectedTileAsset = tileset.find(t => t.id === selectedTileId);

    if (!selectedTileAsset && currentScreenTool === 'erase') {
      const cellToClear = currentLayerData[point.y]?.[point.x];
      if (cellToClear && cellToClear.tileId) {
        const originalTileAsset = tileset.find(t => t.id === cellToClear.tileId);
        if (originalTileAsset) {
          const spanX = Math.ceil(originalTileAsset.width / EDITOR_BASE_TILE_DIM);
          const spanY = Math.ceil(originalTileAsset.height / EDITOR_BASE_TILE_DIM);
          const originMapX = point.x - (cellToClear.subTileX || 0);
          const originMapY = point.y - (cellToClear.subTileY || 0);
          if (activeLayer === 'effects') {
            let clearFitsInZone = true;
            for (let dy = 0; dy < spanY && clearFitsInZone; dy++) {
              for (let dx = 0; dx < spanX; dx++) {
                if (!isPointInsideSelectedSecretZone(originMapX + dx, originMapY + dy)) {
                  clearFitsInZone = false;
                  break;
                }
              }
            }
            if (!clearFitsInZone) {
              setStatusBarMessage('Erase area must stay inside the selected Secret Zone.');
              return;
            }
          }
          for (let dy = 0; dy < spanY; dy++) {
            for (let dx = 0; dx < spanX; dx++) {
              const targetX = originMapX + dx;
              const targetY = originMapY + dy;
              if (targetY >= 0 && targetY < currentLayerData.length && targetX >= 0 && targetX < currentLayerData[0].length) {
                if (currentLayerData[targetY][targetX]?.tileId !== null) {
                  currentLayerData[targetY][targetX] = { tileId: null };
                  changed = true;
                }
              }
            }
          }
        } else {
          if (activeLayer === 'effects' && !isPointInsideSelectedSecretZone(point.x, point.y)) {
            setStatusBarMessage('You can only erase inside the selected Secret Zone.');
            return;
          }
          if (currentLayerData[point.y][point.x]?.tileId !== null) {
            currentLayerData[point.y][point.x] = { tileId: null };
            changed = true;
          }
        }
      }
    } else if (selectedTileAsset && currentScreenTool === 'draw') {
      const tileActualW = selectedTileAsset.width;
      const tileActualH = selectedTileAsset.height;
      const spanX = Math.ceil(tileActualW / EDITOR_BASE_TILE_DIM);
      const spanY = Math.ceil(tileActualH / EDITOR_BASE_TILE_DIM);
      if (activeLayer === 'effects') {
        let drawFitsInZone = true;
        for (let dy = 0; dy < spanY && drawFitsInZone; dy++) {
          for (let dx = 0; dx < spanX; dx++) {
            if (!isPointInsideSelectedSecretZone(point.x + dx, point.y + dy)) {
              drawFitsInZone = false;
              break;
            }
          }
        }
        if (!drawFitsInZone) {
          setStatusBarMessage('Tile placement must stay inside the selected Secret Zone.');
          return;
        }
      }
      for (let dy = 0; dy < spanY; dy++) {
        for (let dx = 0; dx < spanX; dx++) {
          const targetX = point.x + dx;
          const targetY = point.y + dy;
          if (targetY >= 0 && targetY < currentLayerData.length && targetX >= 0 && targetX < currentLayerData[0].length) {
            const currentMapCell = currentLayerData[targetY][targetX];
            const newScreenTile: ScreenTile = {
              tileId: selectedTileAsset.id, subTileX: dx, subTileY: dy,
            };
            if (currentMapCell?.tileId !== newScreenTile.tileId || currentMapCell?.subTileX !== dx || currentMapCell?.subTileY !== dy) {
              currentLayerData[targetY][targetX] = newScreenTile;
              changed = true;
            }
          }
        }
      }
    }
    if (changed) {
      newLayers[layerToUpdateKey] = currentLayerData;
      onUpdate({ layers: newLayers });
    }
  }, [screenMap.layers, screenMap.tileBankAssetId, activeLayer, onUpdate, selectedTileId, tileset, EDITOR_BASE_TILE_DIM, setLastClickedCell, currentScreenTool, currentScreenMode, allProjectAssets, setSelectedTileId, setStatusBarMessage, getSectorFromY, setCurrentSector, stamps, selectedStampId, isSecretZoneEditingSelectionValid, isPointInsideSelectedSecretZone]);

  const handleClearSelection = () => {
    if (!selectionRect || activeLayer === 'entities') return;
    if (activeLayer === 'effects') {
      if (!isSecretZoneEditingSelectionValid()) return;
      for (let y = selectionRect.y; y < selectionRect.y + selectionRect.height; y++) {
        for (let x = selectionRect.x; x < selectionRect.x + selectionRect.width; x++) {
          if (!isPointInsideSelectedSecretZone(x, y)) {
            setStatusBarMessage('Selection must stay inside the selected Secret Zone.');
            return;
          }
        }
      }
    }
    const layerToUpdateKey = activeLayer as 'background' | 'collision' | 'effects';
    const newLayers = { ...screenMap.layers };
    const layerToUpdate = newLayers[layerToUpdateKey].map(row => [...row]);
    let changed = false;
    for (let y = selectionRect.y; y < selectionRect.y + selectionRect.height; y++) {
      for (let x = selectionRect.x; x < selectionRect.x + selectionRect.width; x++) {
        if (y >= 0 && y < screenMap.height && x >= 0 && x < screenMap.width) {
          if (layerToUpdate[y][x]?.tileId !== null) {
            layerToUpdate[y][x] = { tileId: null };
            changed = true;
          }
        }
      }
    }
    if (changed) {
      newLayers[layerToUpdateKey] = layerToUpdate;
      onUpdate({ layers: newLayers });
    }
  };

  const handleUnselect = () => {
    setSelectionRect(null);
    if (currentScreenTool === 'select') {
      setCurrentScreenTool('draw');
    }
  };

  const handleCreateStamp = useCallback(() => {
    if (!selectionRect || activeLayer === 'entities') {
      setStatusBarMessage("Cannot create stamp from the entities layer.");
      return;
    }

    const layerToStampKey = activeLayer as 'background' | 'collision' | 'effects';
    const sourceLayer = screenMap.layers[layerToStampKey];

    // Extract tiles from selection
    const stampTiles: ScreenTile[][] = [];
    for (let y = 0; y < selectionRect.height; y++) {
      const row: ScreenTile[] = [];
      for (let x = 0; x < selectionRect.width; x++) {
        const mapY = selectionRect.y + y;
        const mapX = selectionRect.x + x;
        const tile = sourceLayer[mapY]?.[mapX];
        row.push(tile ? { ...tile } : { tileId: null });
      }
      stampTiles.push(row);
    }

    // Generate unique ID and name
    const stampId = `stamp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const stampName = `Stamp ${stamps.length + 1} (${selectionRect.width}x${selectionRect.height})`;

    const newStamp: TileStamp = {
      id: stampId,
      name: stampName,
      width: selectionRect.width,
      height: selectionRect.height,
      tiles: stampTiles,
    };

    setStamps([...stamps, newStamp]);
    setStatusBarMessage(`Created stamp: ${stampName}`);
  }, [selectionRect, activeLayer, screenMap.layers, stamps, setStatusBarMessage]);

  const handleSelectStamp = useCallback((stampId: string | null) => {
    setSelectedStampId(stampId);
    if (stampId) {
      setCurrentScreenTool('stamp');
    }
  }, []);

  const handleDeleteStamp = useCallback((stampId: string) => {
    setStamps(stamps.filter(s => s.id !== stampId));
    if (selectedStampId === stampId) {
      setSelectedStampId(null);
    }
    setStatusBarMessage('Stamp deleted');
  }, [stamps, selectedStampId, setStatusBarMessage]);

  const handleFillSelection = () => {
    if (!selectionRect || activeLayer === 'entities' || !selectedTileId) return;
    if (activeLayer === 'effects') {
      if (!isSecretZoneEditingSelectionValid()) return;
      for (let y = selectionRect.y; y < selectionRect.y + selectionRect.height; y++) {
        for (let x = selectionRect.x; x < selectionRect.x + selectionRect.width; x++) {
          if (!isPointInsideSelectedSecretZone(x, y)) {
            setStatusBarMessage('Fill selection must stay inside the selected Secret Zone.');
            return;
          }
        }
      }
    }
    const layerToUpdateKey = activeLayer as 'background' | 'collision' | 'effects';
    const selectedTileAsset = tileset.find(t => t.id === selectedTileId);
    if (!selectedTileAsset) return;

    const newLayers = { ...screenMap.layers };
    const layerToUpdate = newLayers[layerToUpdateKey].map(row => [...row]);
    let changed = false;

    const assetSubTilesWide = Math.ceil(selectedTileAsset.width / EDITOR_BASE_TILE_DIM);
    const assetSubTilesHigh = Math.ceil(selectedTileAsset.height / EDITOR_BASE_TILE_DIM);

    for (let yOffset = 0; yOffset < selectionRect.height; yOffset++) {
      for (let xOffset = 0; xOffset < selectionRect.width; xOffset++) {
        const mapY = selectionRect.y + yOffset;
        const mapX = selectionRect.x + xOffset;

        if (mapY >= 0 && mapY < screenMap.height && mapX >= 0 && mapX < screenMap.width) {
          const subTileX = xOffset % assetSubTilesWide;
          const subTileY = yOffset % assetSubTilesHigh;
          const newScreenTile: ScreenTile = {
            tileId: selectedTileAsset.id,
            subTileX: subTileX,
            subTileY: subTileY,
          };
          const currentCell = layerToUpdate[mapY]?.[mapX];
          if (currentCell?.tileId !== newScreenTile.tileId || currentCell?.subTileX !== newScreenTile.subTileX || currentCell?.subTileY !== newScreenTile.subTileY) {
            layerToUpdate[mapY][mapX] = newScreenTile;
            changed = true;
          }
        }
      }
    }
    if (changed) {
      newLayers[layerToUpdateKey] = layerToUpdate;
      onUpdate({ layers: newLayers });
    }
  };

  const handleZigZagFillSelection = () => {
    if (!selectionRect || activeLayer === 'entities' || !selectedTileId) return;
    if (activeLayer === 'effects') {
      if (!isSecretZoneEditingSelectionValid()) return;
      for (let y = selectionRect.y; y < selectionRect.y + selectionRect.height; y++) {
        for (let x = selectionRect.x; x < selectionRect.x + selectionRect.width; x++) {
          if (!isPointInsideSelectedSecretZone(x, y)) {
            setStatusBarMessage('ZigZag fill must stay inside the selected Secret Zone.');
            return;
          }
        }
      }
    }
    const layerToUpdateKey = activeLayer as 'background' | 'collision' | 'effects';
    const selectedTileAsset = tileset.find(t => t.id === selectedTileId);
    if (!selectedTileAsset) return;

    const assetSubTilesWide = Math.ceil(selectedTileAsset.width / EDITOR_BASE_TILE_DIM);
    const assetSubTilesHigh = Math.ceil(selectedTileAsset.height / EDITOR_BASE_TILE_DIM);
    if (assetSubTilesWide < 2 || assetSubTilesHigh < 2) {
      alert("ZigZag Fill (2x2 unit) requires the selected tile to be at least 2x2 base cells in size.");
      return;
    }

    const newLayers = { ...screenMap.layers };
    const layerToUpdate = newLayers[layerToUpdateKey].map(row => [...row]);
    let changed = false;

    const FILL_UNIT_WIDTH_CELLS = 2;
    const FILL_UNIT_HEIGHT_CELLS = 2;

    for (let selY = 0; selY < selectionRect.height; selY++) {
      for (let selX = 0; selX < selectionRect.width; selX++) {
        const mapY = selectionRect.y + selY;
        const mapX = selectionRect.x + selX;

        if (mapY >= 0 && mapY < screenMap.height && mapX >= 0 && mapX < screenMap.width) {
          const unitGridY = Math.floor(selY / FILL_UNIT_HEIGHT_CELLS);
          const isOddUnitRow = unitGridY % 2 !== 0;

          const subTileYInUnit = selY % FILL_UNIT_HEIGHT_CELLS;
          let subTileXInUnit = selX % FILL_UNIT_WIDTH_CELLS;

          if (isOddUnitRow) {
            subTileXInUnit = (FILL_UNIT_WIDTH_CELLS - 1) - subTileXInUnit;
          }

          const finalSubTileX = subTileXInUnit % assetSubTilesWide;
          const finalSubTileY = subTileYInUnit % assetSubTilesHigh;

          const newScreenTile: ScreenTile = {
            tileId: selectedTileAsset.id,
            subTileX: finalSubTileX,
            subTileY: finalSubTileY,
          };
          const currentCell = layerToUpdate[mapY]?.[mapX];
          if (currentCell?.tileId !== newScreenTile.tileId || currentCell?.subTileX !== newScreenTile.subTileX || currentCell?.subTileY !== newScreenTile.subTileY) {
            layerToUpdate[mapY][mapX] = newScreenTile;
            changed = true;
          }
        }
      }
    }
    if (changed) {
      newLayers[layerToUpdateKey] = layerToUpdate;
      onUpdate({ layers: newLayers });
    }
  };

  const prepareAndOpenLayoutExportModal = () => {
    if (isScreen2) {
      // DEBUG: Log TileBank info
      console.log('?? Layout Export Debug:');
      console.log('  - Number of TileBank assets:', tileBanks?.length || 0);
      console.log('  - TileBank assets RAW:', tileBanks);
      if (tileBanks && tileBanks.length > 0) {
        tileBanks.forEach((tb, i) => {
          console.log(`  - TileBank ${i}:`, {
            id: tb.id,
            name: tb.name,
            hasBanksProperty: 'banks' in tb,
            banksValue: tb.banks,
            banksType: typeof tb.banks,
            banksIsArray: Array.isArray(tb.banks),
            allKeys: Object.keys(tb)
          });
        });
      }
      console.log('  - Total banks combined:', tileBankDefinitions?.length || 0);
      console.log('  - currentScreenMode:', currentScreenMode);
      if (tileBankDefinitions) {
        tileBankDefinitions.forEach((bank, i) => {
          console.log(`  - Bank ${i} (${bank.name}):`, {
            enabled: bank.enabled,
            assignedTilesCount: Object.keys(bank.assignedTiles).length,
            assignedTileIds: Object.keys(bank.assignedTiles),
            charsetRange: `${bank.charsetRangeStart}-${bank.charsetRangeEnd}`
          });
        });
      }
    }

    const activeAreaWidth = screenMap.activeAreaWidth ?? screenMap.width;
    const activeAreaHeight = screenMap.activeAreaHeight ?? screenMap.height;
    const layoutBytes = generateScreenMapLayoutBytes(screenMap, tileset, tileBankDefinitions, currentScreenMode);
    const backgroundBlockMap = buildScreenBlockMapFromBytes({
      bytes: layoutBytes,
      width: activeAreaWidth,
      height: activeAreaHeight,
      mode: backgroundBlockMode,
    });
    const comments: string[] = [];
    if (!isScreen2) {
      const tempMap = new Map<number, { name: string, tileId: string, subX: number, subY: number }>();
      const activeLayerData = screenMap.layers.background;
      for (let r = 0; r < (screenMap.activeAreaHeight ?? screenMap.height); r++) {
        for (let c = 0; c < (screenMap.activeAreaWidth ?? screenMap.width); c++) {
          const mapY = (screenMap.activeAreaY ?? 0) + r;
          const mapX = (screenMap.activeAreaX ?? 0) + c;
          const screenTile = activeLayerData[mapY]?.[mapX];
          if (screenTile?.tileId) {
            const tileAsset = tileset.find(t => t.id === screenTile.tileId);
            if (tileAsset) {
            }
          }
        }
      }
    } else if (tileBanks) {
    }

    setLayoutASMExportData({
      mapName: screenMap.name,
      mapWidth: activeAreaWidth,
      mapHeight: activeAreaHeight,
      mapIndices: Array.from(layoutBytes),
      referenceComments: comments,
      dataFormat: dataOutputFormat,
      exportMode: backgroundBlockMap ? backgroundBlockMode : 'raw',
      blockData: backgroundBlockMap ? {
        mode: backgroundBlockMap.mode,
        blockWidth: backgroundBlockMap.blockWidth,
        blockHeight: backgroundBlockMap.blockHeight,
        catalogEntryCount: backgroundBlockMap.catalog.length,
        catalogLengthBytes: backgroundBlockMap.catalogLengthBytes,
        mapLengthBytes: backgroundBlockMap.mapLengthBytes,
        optimizedLengthBytes: backgroundBlockMap.optimizedLengthBytes,
        catalogBytes: [...backgroundBlockMap.catalogFlatBytes],
        mapIndices: [...backgroundBlockMap.mapIndices],
        mapWidth: backgroundBlockMap.mapWidth,
        mapHeight: backgroundBlockMap.mapHeight,
      } : null,
    });
    setIsExportLayoutModalOpen(true);
  };



  const handleExportBehaviorMapASM = () => {
    const behaviorMapData = generateBehaviorMapData(screenMap, tileset, {
      source: behaviorSource,
      tileBanks: tileBankDefinitions,
      currentScreenMode,
    });
    setBehaviorMapASMExportData({
      mapName: screenMap.name,
      mapWidth: screenMap.activeAreaWidth ?? screenMap.width,
      mapHeight: screenMap.activeAreaHeight ?? screenMap.height,
      behaviorMapData,
      dataFormat: dataOutputFormat
    });
    setIsExportBehaviorMapModalOpen(true);
  };

  const handleExportScreenMapJSON = () => {
    const exportData = {
      type: 'screenmap',
      version: '1.0',
      timestamp: new Date().toISOString(),
      screenMapName: screenMap.name || 'Untitled Screen',
      data: screenMap
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${screenMap.name || 'screenmap'}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusBarMessage(`Screen map "${screenMap.name}" exported to JSON.`);
  };

  const handleImportScreenMapJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const importData = JSON.parse(event.target?.result as string);

            if (importData.type !== 'screenmap' || !importData.data) {
              setStatusBarMessage('Invalid screen map file format.');
              return;
            }

            // Validate the imported data structure
            const isValidScreenMap = (data: any): data is ScreenMap => {
              return data &&
                typeof data.name === 'string' &&
                typeof data.width === 'number' &&
                typeof data.height === 'number' &&
                data.layers && typeof data.layers === 'object';
            };

            if (!isValidScreenMap(importData.data)) {
              setStatusBarMessage('Invalid screen map data structure.');
              return;
            }

            // Merge the imported data with current screen map, preserving structure
            const importedScreenMap = importData.data as ScreenMap;

            // Validate layers exist
            if (!importedScreenMap.layers.background || !importedScreenMap.layers.collision) {
              setStatusBarMessage('Screen map missing required layers (background, collision).');
              return;
            }

            // Update the screen map
            onUpdate(importedScreenMap);
            setStatusBarMessage(`Screen map "${importedScreenMap.name}" imported successfully.`);

          } catch (error) {
            setStatusBarMessage('Error reading screen map file. Please ensure it\'s a valid JSON file.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleUpdateHudConfiguration = (newHudConfig: HUDConfiguration) => { onUpdate({ hudConfiguration: newHudConfig }); };
  const openHudEditor = () => { if (!screenMap.hudConfiguration) { onUpdate({ hudConfiguration: { elements: [] } }); } setIsHudEditorModalOpen(true); };
  const isHudAreaDefined = (screenMap.activeAreaX ?? 0) > 0 || (screenMap.activeAreaY ?? 0) > 0 || (screenMap.activeAreaWidth ?? screenMap.width) < screenMap.width || (screenMap.activeAreaHeight ?? screenMap.height) < screenMap.height;
  const layerNamesForToolbar: ScreenEditorLayerName[] = ['background', 'collision', 'effects', 'entities'];
  const baseCellPixelWidth = EDITOR_BASE_TILE_DIM;
  const baseCellPixelHeight = EDITOR_BASE_TILE_DIM;
  const canOfferAddFakePlayer = screenKind !== 'playable' && screenKindValidationIssues.some(issue => issue.includes('no FakePlayer'));

  const handleCopyScreen = useCallback(() => {
    const { layers, effectZones, activeAreaX = 0, activeAreaY = 0, activeAreaWidth = screenMap.width, activeAreaHeight = screenMap.height, hudConfiguration } = screenMap;

    const copiedLayers: CopiedScreenData['layers'] = {
      background: [],
      collision: [],
      effects: [], // Keep this as tile data copy for now, even if effects layer changes
    };
    const referencedTilesSet = new Set<string>();
    const allReferencedTiles: Tile[] = [];

    (['background', 'collision', 'effects'] as const).forEach(layerName => {
      const sourceLayer = layers[layerName];
      const newLayerData: ScreenLayerData = [];
      for (let r = 0; r < activeAreaHeight; r++) {
        const row: ScreenTile[] = [];
        for (let c = 0; c < activeAreaWidth; c++) {
          const mapY = activeAreaY + r;
          const mapX = activeAreaX + c;
          const screenTile = sourceLayer?.[mapY]?.[mapX];
          if (screenTile && screenTile.tileId) {
            row.push({ ...screenTile });
            if (!referencedTilesSet.has(screenTile.tileId)) {
              const tileAsset = tileset.find(t => t.id === screenTile.tileId);
              if (tileAsset) {
                const alreadyAddedTile = allReferencedTiles.find(rt => deepCompareTiles(rt, tileAsset));
                if (!alreadyAddedTile) {
                  allReferencedTiles.push(JSON.parse(JSON.stringify(tileAsset)));
                }
                referencedTilesSet.add(screenTile.tileId);
              }
            }
          } else {
            row.push({ tileId: null });
          }
        }
        newLayerData.push(row);
      }
      copiedLayers[layerName] = newLayerData;
    });

    const copiedData: CopiedScreenData = {
      layers: copiedLayers,
      blockOptimization: screenMap.blockOptimization ? JSON.parse(JSON.stringify(screenMap.blockOptimization)) : undefined,
      behaviorConfig: screenMap.behaviorConfig ? JSON.parse(JSON.stringify(screenMap.behaviorConfig)) : undefined,
      effectZones: effectZones ? JSON.parse(JSON.stringify(effectZones)) : undefined,
      activeAreaX,
      activeAreaY,
      activeAreaWidth,
      activeAreaHeight,
      hudConfiguration: hudConfiguration ? JSON.parse(JSON.stringify(hudConfiguration)) : undefined,
      referencedTiles: allReferencedTiles,
    };
    setCopiedScreenBuffer(copiedData);
  }, [screenMap, tileset, setCopiedScreenBuffer, EDITOR_BASE_TILE_DIM]);

  const confirmPasteScreen = useCallback(() => {
    if (!copiedScreenBuffer) return;

    const updatedScreenMapData: Partial<ScreenMap> = {
      layers: { ...screenMap.layers },
      blockOptimization: copiedScreenBuffer.blockOptimization ? JSON.parse(JSON.stringify(copiedScreenBuffer.blockOptimization)) : undefined,
      behaviorConfig: copiedScreenBuffer.behaviorConfig ? JSON.parse(JSON.stringify(copiedScreenBuffer.behaviorConfig)) : undefined,
      effectZones: copiedScreenBuffer.effectZones ? JSON.parse(JSON.stringify(copiedScreenBuffer.effectZones)) : [],
      hudConfiguration: copiedScreenBuffer.hudConfiguration ? JSON.parse(JSON.stringify(copiedScreenBuffer.hudConfiguration)) : undefined,
    };

    const targetActiveX = screenMap.activeAreaX ?? 0;
    const targetActiveY = screenMap.activeAreaY ?? 0;

    (['background', 'collision', 'effects'] as const).forEach(layerName => {
      const sourceCopiedLayer = copiedScreenBuffer.layers[layerName];
      const targetLayer = updatedScreenMapData.layers![layerName].map(row => [...row]);

      for (let r = 0; r < copiedScreenBuffer.activeAreaHeight; r++) {
        for (let c = 0; c < copiedScreenBuffer.activeAreaWidth; c++) {
          const destY = targetActiveY + r;
          const destX = targetActiveX + c;
          if (destY < screenMap.height && destX < screenMap.width && sourceCopiedLayer[r]?.[c]) {
            targetLayer[destY][destX] = { ...sourceCopiedLayer[r][c] };
          }
        }
      }
      updatedScreenMapData.layers![layerName] = targetLayer;
    });

    const newTilesToCreate: ProjectAsset[] = [];
    copiedScreenBuffer.referencedTiles.forEach(bufferedTile => {
      const existsInProject = allProjectAssets.some(existingAsset =>
        existingAsset.type === 'tile' &&
        (existingAsset.id === bufferedTile.id || deepCompareTiles(existingAsset.data as Tile, bufferedTile))
      );
      if (!existsInProject) {
        let tileToAdd = bufferedTile;
        if (allProjectAssets.some(pa => pa.id === bufferedTile.id)) {
          const trulyNewTile = { ...bufferedTile, id: `pasted_tile_${Date.now()}_${Math.random().toString(36).substr(2, 5)}` };

          const oldId = bufferedTile.id;
          const newId = trulyNewTile.id;
          (['background', 'collision', 'effects'] as const).forEach(layerName => {
            updatedScreenMapData.layers![layerName] = updatedScreenMapData.layers![layerName].map(row =>
              row.map(cell => cell.tileId === oldId ? { ...cell, tileId: newId } : cell)
            );
          });
          tileToAdd = trulyNewTile;
        }

        newTilesToCreate.push({
          id: tileToAdd.id,
          name: tileToAdd.name || `Pasted Tile ${tileToAdd.id.slice(-4)}`,
          type: 'tile',
          data: JSON.parse(JSON.stringify(tileToAdd)),
        });
      }
    });

    onUpdate(updatedScreenMapData, newTilesToCreate);
    setIsPasteConfirmModalOpen(false);
  }, [screenMap, copiedScreenBuffer, onUpdate, allProjectAssets, EDITOR_BASE_TILE_DIM]);

  const handlePasteScreen = () => {
    if (!copiedScreenBuffer) return;
    setIsPasteConfirmModalOpen(true);
  };


  const handleSetScreenTool = (tool: ScreenEditorTool) => {
    setCurrentScreenTool(tool);
    if (tool !== 'select' && selectionRect) {
      setSelectionRect(null);
    }
    if (tool === 'placeEntity' && activeLayer !== 'entities') {
      setActiveLayer('entities');
    } else if (tool !== 'placeEntity' && activeLayer === 'entities') {
      setActiveLayer('background'); // Default back to background if not placing entity
    }
  };

  const handleLayerChange = (layer: ScreenEditorLayerName) => {
    setActiveLayer(layer);
    onSelectEntityInstance(null); // Deselect entity when layer changes
    onSelectEffectZone(null);   // Deselect effect zone when layer changes

    if (layer === 'entities') {
      handleSetScreenTool('placeEntity');
    } else if (layer === 'effects') {
      handleSetScreenTool('select');
    } else { // background, collision
      if (currentScreenTool === 'placeEntity' || currentScreenTool === 'defineEffectZone') {
        handleSetScreenTool('draw');
      }
    }
  };

  const handleCopyActiveLayer = useCallback(() => {
    if (activeLayer === 'entities') {
      setStatusBarMessage("Cannot copy the 'entities' layer this way.");
      return;
    }
    const sourceLayerName = activeLayer as 'background' | 'collision' | 'effects';
    const sourceLayerData = screenMap.layers[sourceLayerName];
    const ax = screenMap.activeAreaX ?? 0;
    const ay = screenMap.activeAreaY ?? 0;
    const aw = screenMap.activeAreaWidth ?? screenMap.width;
    const ah = screenMap.activeAreaHeight ?? screenMap.height;

    const newCopiedData: ScreenLayerData = [];
    for (let r = 0; r < ah; r++) {
      const row: ScreenTile[] = [];
      for (let c = 0; c < aw; c++) {
        const mapY = ay + r;
        const mapX = ax + c;
        if (mapY < screenMap.height && mapX < screenMap.width && sourceLayerData[mapY] && sourceLayerData[mapY][mapX]) {
          row.push({ ...(sourceLayerData[mapY][mapX]) });
        } else {
          row.push({ tileId: null });
        }
      }
      newCopiedData.push(row);
    }
    setCopiedLayerBuffer({ layerName: sourceLayerName, data: newCopiedData });
    setStatusBarMessage(`Layer '${sourceLayerName}' (active area) copied.`);
  }, [activeLayer, screenMap, setCopiedLayerBuffer, setStatusBarMessage]);

  const handlePasteLayer = useCallback(() => {
    if (!copiedLayerBuffer) {
      setStatusBarMessage("Layer buffer is empty. Copy a layer first.");
      return;
    }
    if (activeLayer === 'entities') {
      setStatusBarMessage("Cannot paste into the 'entities' layer this way.");
      return;
    }

    const targetLayerName = activeLayer as 'background' | 'collision' | 'effects';
    const newLayers = { ...screenMap.layers };
    const targetLayerData = newLayers[targetLayerName].map(row => [...row]);

    const ax = screenMap.activeAreaX ?? 0;
    const ay = screenMap.activeAreaY ?? 0;
    const currentActiveWidth = screenMap.activeAreaWidth ?? screenMap.width;
    const currentActiveHeight = screenMap.activeAreaHeight ?? screenMap.height;

    const copiedDataHeight = copiedLayerBuffer.data.length;
    const copiedDataWidth = copiedLayerBuffer.data[0]?.length || 0;

    for (let r = 0; r < copiedDataHeight; r++) {
      for (let c = 0; c < copiedDataWidth; c++) {
        const destY = ay + r;
        const destX = ax + c;
        if (destY < screenMap.height && destX < screenMap.width &&
          r < currentActiveHeight && c < currentActiveWidth) {
          targetLayerData[destY][destX] = { ...(copiedLayerBuffer.data[r]?.[c] || { tileId: null }) };
        }
      }
    }
    newLayers[targetLayerName] = targetLayerData;
    onUpdate({ layers: newLayers });
    setStatusBarMessage(`Pasted '${copiedLayerBuffer.layerName}' data to '${targetLayerName}' layer (active area).`);
  }, [activeLayer, screenMap, copiedLayerBuffer, onUpdate, setStatusBarMessage]);

  const handleTileContextMenu = (event: React.MouseEvent, tileId: string) => {
    event.preventDefault();
    if (!tileId) return;
    const tileName = tileset.find(t => t.id === tileId)?.name || "Tile";

    const menuItems: ContextMenuItem[] = [
      {
        label: `Edit Tile: ${tileName}`,
        icon: <TilesetIcon className="w-4 h-4" />,
        onClick: () => onNavigateToAsset(tileId),
      },
    ];
    onShowContextMenu({ x: event.clientX, y: event.clientY }, menuItems);
  };

  const selectedEntity = screenMap.layers.entities.find(e => e.id === selectedEntityInstanceId) || null;

  const handleSetPatrolPath = (x: number | null, y: number | null) => {
    if (!selectedEntity) return;

    const updatedEntities = screenMap.layers.entities.map(e =>
      e.id === selectedEntity.id ? { ...e, patrolX: x, patrolY: y } : e
    );

    onUpdate({
      layers: {
        ...screenMap.layers,
        entities: updatedEntities,
      },
    });
  };

  const handleTileBankChange = (tileBankId: string) => {
    onUpdate({ tileBankAssetId: tileBankId });
    setStatusBarMessage(`TileBank changed to: ${allProjectAssets.find(a => a.id === tileBankId)?.name || 'Unknown'}`);
  };

  const handleBackgroundColorChange = (colorIndex: number) => {
    onUpdate({ backgroundColor: colorIndex });
    setStatusBarMessage(`Background color changed to: ${colorIndex}`);
  };

  const handleBorderColorChange = (colorIndex: number) => {
    onUpdate({ borderColor: colorIndex });
    setStatusBarMessage(`Border color changed to: ${colorIndex}`);
  };

  const handleScreenKindChange = useCallback((screenKind: ScreenKind) => {
    onUpdate({ screenKind });
    const label = screenKind.charAt(0).toUpperCase() + screenKind.slice(1);
    setStatusBarMessage(`Screen type set to: ${label}.`);
  }, [onUpdate, setStatusBarMessage]);

  const handleBehaviorSourceChange = useCallback((source: ScreenBehaviorSource) => {
    onUpdate({
      behaviorConfig: {
        ...(screenMap.behaviorConfig || {}),
        source,
      },
    });

    setStatusBarMessage(
      source === 'backgroundChars'
        ? 'Behavior source set to background chars. ROM export derives runtime behavior from the background layer.'
        : 'Behavior source set to collision layer.'
    );
  }, [onUpdate, screenMap.behaviorConfig, setStatusBarMessage]);

  const handleBackgroundBlockModeChange = useCallback((mode: ScreenBlockExportMode) => {
    if (mode === 'raw') {
      onUpdate({
        blockOptimization: {
          ...(screenMap.blockOptimization || {}),
          backgroundMode: mode,
        },
      });
      setStatusBarMessage('Background export mode set to raw.');
      return;
    }

    const blockSize = mode === 'blocks4x4' ? 4 : 2;
    const currentActiveX = screenMap.activeAreaX ?? 0;
    const currentActiveY = screenMap.activeAreaY ?? 0;
    const currentActiveHeight = screenMap.activeAreaHeight ?? screenMap.height;
    const topHudRows = currentActiveY;
    const bottomHudRows = Math.max(0, screenMap.height - (currentActiveY + currentActiveHeight));
    const snappedTopHudRows = Math.ceil(topHudRows / blockSize) * blockSize;
    const snappedBottomHudRows = Math.ceil(bottomHudRows / blockSize) * blockSize;
    const nextHeight = screenMap.height - snappedTopHudRows - snappedBottomHudRows;

    if (nextHeight < blockSize || nextHeight % blockSize !== 0) {
      onUpdate({
        blockOptimization: {
          ...(screenMap.blockOptimization || {}),
          backgroundMode: mode,
        },
      });
      setStatusBarMessage(`Background mode set to ${mode}, but current HUD strips do not allow a valid full-width ${blockSize}x${blockSize} gameplay band. Export will fall back to raw until you adjust Active Area.`);
      return;
    }

    setLocalActiveX('0');
    setLocalActiveY(String(snappedTopHudRows));
    setLocalActiveW(String(screenMap.width));
    setLocalActiveH(String(nextHeight));

    onUpdate({
      blockOptimization: {
        ...(screenMap.blockOptimization || {}),
        backgroundMode: mode,
      },
      activeAreaX: 0,
      activeAreaY: snappedTopHudRows,
      activeAreaWidth: screenMap.width,
      activeAreaHeight: nextHeight,
    });

    const sideMarginNote = currentActiveX !== 0 || (screenMap.activeAreaWidth ?? screenMap.width) !== screenMap.width
      ? ' Side HUD margins were cleared; optimized modes now use full-width gameplay plus top/bottom HUD rows.'
      : '';

    setStatusBarMessage(`Background mode set to ${mode}. Active Area normalized to full width with HUD rows top=${snappedTopHudRows}, bottom=${snappedBottomHudRows}.${sideMarginNote}`);
  }, [
    onUpdate,
    screenMap.activeAreaHeight,
    screenMap.activeAreaWidth,
    screenMap.activeAreaX,
    screenMap.activeAreaY,
    screenMap.blockOptimization,
    screenMap.height,
    screenMap.width,
    setStatusBarMessage,
  ]);

  return (
    <Panel title={`Screen Editor: ${screenMap.name} (Base ${EDITOR_BASE_TILE_DIM}x${EDITOR_BASE_TILE_DIM})`} className="flex-grow flex flex-col bg-msx-bgcolor overflow-hidden select-none">
      <ScreenEditorToolbar
        activeLayer={activeLayer}
        onLayerChange={handleLayerChange}
        layerNames={layerNamesForToolbar}
        screenKind={screenKind}
        onScreenKindChange={handleScreenKindChange}
        zoom={zoom}
        onZoomChange={setZoom}
        activeAreaX={localActiveX}
        activeAreaY={localActiveY}
        activeAreaWidth={localActiveW}
        activeAreaHeight={localActiveH}
        onActiveAreaChange={handleActiveAreaInputChange}
        maxActiveAreaX={Math.max(0, (screenMap.width || 0) - 1)}
        maxActiveAreaY={Math.max(0, (screenMap.height || 0) - 1)}
        maxActiveAreaWidth={Math.max(1, (screenMap.width || 0) - (parseInt(localActiveX, 10) || 0))}
        maxActiveAreaHeight={Math.max(1, (screenMap.height || 0) - (parseInt(localActiveY, 10) || 0))}
        onOpenHudEditor={openHudEditor}
        isHudAreaDefined={isHudAreaDefined}
        onExportLayout={prepareAndOpenLayoutExportModal}
        onExportBehavior={handleExportBehaviorMapASM}
        onExportScreenMapJSON={handleExportScreenMapJSON}
        onImportScreenMapJSON={handleImportScreenMapJSON}
        onCopyLayer={handleCopyActiveLayer}
        onPasteLayer={handlePasteLayer}
        isCopyLayerDisabled={activeLayer === 'entities'}
        isPasteLayerDisabled={!copiedLayerBuffer || activeLayer === 'entities'}
        onAddNewEffectZone={handleAddNewEffectZone}
        canAddNewEffectZone={activeLayer === 'effects' && !!selectionRect}
        currentScreenMode={currentScreenMode}
        selectedTileBankId={screenMap.tileBankAssetId}
        onTileBankChange={handleTileBankChange}
        allProjectAssets={allProjectAssets}
        backgroundColor={screenMap.backgroundColor}
        borderColor={screenMap.borderColor}
        onBackgroundColorChange={handleBackgroundColorChange}
        onBorderColorChange={handleBorderColorChange}
        backgroundBlockMode={backgroundBlockMode}
        onBackgroundBlockModeChange={handleBackgroundBlockModeChange}
        behaviorSource={behaviorSource}
        onBehaviorSourceChange={handleBehaviorSourceChange}
        isBackgroundBlockAlignmentValid={activeAreaBlockAlignment.isValid}
        backgroundBlockAlignmentMessage={activeAreaBlockAlignment.message}
        onSnapActiveAreaToBlockMode={handleSnapActiveAreaToBlockMode}
        canSnapActiveAreaToBlockMode={activeAreaBlockAlignment.canSnap}
        backgroundBlockPreview={backgroundBlockPreview}
      />

      {screenKindValidationIssues.length > 0 && (
        <div className="px-3 py-2 border-b border-yellow-500/50 bg-yellow-950/40 text-yellow-100 text-xs">
          <div className="font-semibold text-yellow-300 mb-1">Screen type validation</div>
          <ul className="list-disc list-inside space-y-0.5">
            {screenKindValidationIssues.map(issue => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
          {canOfferAddFakePlayer && (
            <Button
              size="sm"
              variant="secondary"
              className="mt-2"
              onClick={handleAddFakePlayerEntity}
            >
              Add FakePlayer
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-grow overflow-hidden">
        <ScreenTilesetPanel
          activeLayer={activeLayer}
          tileset={tileset}
          selectedTileId={selectedTileId}
          setSelectedTileId={setSelectedTileId}
          currentScreenMode={currentScreenMode}
          editorBaseTileDim={EDITOR_BASE_TILE_DIM}
          currentScreenTool={currentScreenTool}
          onSetScreenTool={handleSetScreenTool}
          effectZones={screenMap.effectZones || []}
          selectedEffectZoneId={selectedEffectZoneId}
          onSelectEffectZone={onSelectEffectZone}
          canAddSecretText={canAddSecretText}
          onAddSecretText={handleAddSecretText}
          selectionRect={selectionRect}
          currentSector={currentSector}
          selectedTileBankId={screenMap.tileBankAssetId}
          allProjectAssets={allProjectAssets}
          showSectorLines={showSectorLines}
          onToggleSectorLines={onToggleSectorLines}
          stamps={stamps}
          selectedStampId={selectedStampId}
          onSelectStamp={handleSelectStamp}
          onDeleteStamp={handleDeleteStamp}
          onTileContextMenu={handleTileContextMenu}
        />

        <div className="flex-grow p-2 overflow-auto flex items-start justify-start relative">
          {waypointPickerState.isPicking && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 pointer-events-none">
              <p className="text-white pixel-font text-lg p-3 bg-msx-accent rounded shadow-lg">
                Click on the grid to set {waypointPickerState.waypointPrefix}...
              </p>
            </div>
          )}
          <ScreenGrid
            mapData={screenMap}
            activeLayer={activeLayer}
            tileset={tileset}
            sprites={sprites}
            allAssets={allProjectAssets}
            onTilePlace={handleTilePlace}
            onEntityPlace={handleEntityPlace}
            onEntitySelect={onSelectEntityInstance}
            onEffectZoneSelect={onSelectEffectZone}
            gridPixelSize={zoom}
            baseCellPixelWidth={baseCellPixelWidth}
            baseCellPixelHeight={baseCellPixelHeight}
            currentScreenMode={currentScreenMode}
            hudElements={screenMap.hudConfiguration?.elements}
            editorBaseTileDim={EDITOR_BASE_TILE_DIM}
            tileBanks={isScreen2 && screenMap.tileBankAssetId ?
              [allProjectAssets.find(asset => asset.id === screenMap.tileBankAssetId && asset.type === 'tilebank')?.data as TileBank].filter(Boolean) :
              undefined}
            msxFont={msx1FontData}
            msxFontColorAttributes={msxFontColorAttributes}
            selectedEntityInstanceId={selectedEntityInstanceId}
            effectZones={screenMap.effectZones || []}
            selectedEffectZoneId={selectedEffectZoneId}
            currentScreenTool={currentScreenTool}
            selectionRect={selectionRect}
            onSelectionChange={setSelectionRect}
            componentDefinitions={componentDefinitions}
            entityTemplates={entityTemplates}
            onTileContextMenu={handleTileContextMenu}
            waypointPickerState={waypointPickerState}
            onWaypointPicked={onWaypointPicked}
            showSectorLines={showSectorLines}
            selectedStamp={selectedStampId ? stamps.find(s => s.id === selectedStampId) : null}
            optimizationOverlay={backgroundOptimizationOverlay}
          />
          <PatrolPathLayer
            selectedEntity={selectedEntity}
            gridZoom={zoom}
            gridCellSize={{ width: baseCellPixelWidth, height: baseCellPixelHeight }}
            gridSize={{ width: screenMap.width, height: screenMap.height }}
            onSetPatrolPath={handleSetPatrolPath}
            currentScreenMode={currentScreenMode}
          />
        </div >
        <div className="w-56 p-2 border-l border-msx-border flex-shrink-0 flex flex-col gap-2 overflow-y-auto">
          <ScreenSelectionToolsPanel
            currentScreenTool={currentScreenTool}
            onSetScreenTool={handleSetScreenTool}
            selectionRect={selectionRect}
            onClearSelection={handleClearSelection}
            onUnselect={handleUnselect}
            selectedTileId={selectedTileId}
            editorBaseTileDim={EDITOR_BASE_TILE_DIM}
            tileset={tileset}
            activeLayerIsEditable={activeLayer !== 'entities'}
            onFillSelection={handleFillSelection}
            onZigZagFillSelection={handleZigZagFillSelection}
            onCopyScreen={handleCopyScreen}
            onPasteScreen={handlePasteScreen}
            isPasteDisabled={!copiedScreenBuffer}
            onCreateStamp={handleCreateStamp}
            className="w-full border-0"
          />
          <ScreenOptimizationPanel
            currentMode={backgroundBlockMode}
            rawLengthBytes={backgroundOptimizationAnalysis.rawLengthBytes}
            blocks2x2={backgroundOptimizationAnalysis.blocks2x2}
            blocks4x4={backgroundOptimizationAnalysis.blocks4x4}
            recommendedMode={backgroundOptimizationAnalysis.recommendedMode}
            overlayMode={optimizationOverlayMode}
            onOverlayModeChange={setOptimizationOverlayMode}
            className="w-full"
          />
        </div>
      </div >
      <ScreenEditorStatusBar
        activeLayer={activeLayer}
        selectedTileId={selectedTileId}
        currentEntityTypeToPlace={currentEntityTypeToPlace as MockEntityType | null}
        selectedEffectZoneName={screenMap.effectZones?.find(ez => ez.id === selectedEffectZoneId)?.name}
        tileset={tileset}
        screenMap={screenMap}
        lastClickedCell={lastClickedCell}
        backgroundBlockMode={backgroundBlockMode}
      />
      {isExportLayoutModalOpen && layoutASMExportData && (<ExportLayoutASMModal isOpen={isExportLayoutModalOpen} onClose={() => setIsExportLayoutModalOpen(false)} {...layoutASMExportData} />)}
      {isExportBehaviorMapModalOpen && behaviorMapASMExportData && (<ExportBehaviorMapASMModal isOpen={isExportBehaviorMapModalOpen} onClose={() => setIsExportBehaviorMapModalOpen(false)} {...behaviorMapASMExportData} />)}
      {
        isHudEditorModalOpen && screenMap && (
          <HUDEditorModal
            isOpen={isHudEditorModalOpen}
            onClose={() => setIsHudEditorModalOpen(false)}
            hudConfiguration={screenMap.hudConfiguration || { elements: [] }}
            onUpdateHUDConfiguration={handleUpdateHudConfiguration}
            currentScreenMode={currentScreenMode}
            screenMapWidth={screenMap.width}
            screenMapHeight={screenMap.height}
            screenMapActiveAreaX={screenMap.activeAreaX ?? 0}
            screenMapActiveAreaY={screenMap.activeAreaY ?? 0}
            screenMapActiveAreaWidth={screenMap.activeAreaWidth ?? screenMap.width}
            screenMapActiveAreaHeight={screenMap.activeAreaHeight ?? screenMap.height}
            baseCellDimension={EDITOR_BASE_TILE_DIM}
            msxFont={msx1FontData}
            msxFontColorAttributes={msxFontColorAttributes}
            tileBanks={tileBanks}
            allAssets={allProjectAssets}
          />
        )
      }
      {
        isPasteConfirmModalOpen && (
          <ConfirmationModal
            isOpen={isPasteConfirmModalOpen}
            title="Paste Grid Data?"
            message={<>Are you sure you want to overwrite the current screen '<strong>{screenMap.name}</strong>' with the copied data? This action cannot be undone.</>}
            onConfirm={confirmPasteScreen}
            onCancel={() => setIsPasteConfirmModalOpen(false)}
            confirmText="Paste & Overwrite"
            confirmButtonVariant="danger"
          />
        )
      }
      <NewEffectZoneModal
        isOpen={isNewEffectZoneModalOpen}
        selectionRect={selectionRect}
        zoneCount={screenMap.effectZones?.length || 0}
        onClose={() => setIsNewEffectZoneModalOpen(false)}
        onConfirm={handleCreateEffectZone}
      />
      <AddSecretTextModal
        isOpen={isAddSecretTextModalOpen}
        effectZone={selectedEffectZone}
        tileBank={currentTileBankAsset}
        allAssets={allProjectAssets}
        onClose={() => setIsAddSecretTextModalOpen(false)}
        onConfirm={handleInsertSecretText}
      />
    </Panel >
  );
};
