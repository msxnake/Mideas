
import React, { useState, useCallback, useEffect } from 'react';
import { ScreenMap, Tile, Point, MSXColorValue, ScreenLayerData, ScreenTile, MSX1ColorValue, HUDConfiguration, HUDElement, HUDElementType, TileBank, MSXFont, DataFormat, MSXFontColorAttributes, EntityInstance, MockEntityType, ProjectAsset, Sprite, SpriteFrame, LayoutASMExportData, BehaviorMapASMExportData, PletterExportData, SuperRLEExportData, CopiedScreenData, ScreenEditorTool, ScreenSelectionRect, EntityTemplate, CopiedLayerData, EffectZone, ScreenEditorLayerName, ComponentDefinition, ContextMenuItem, OptimizedRLEExportData } from '../../types';
import { Panel } from '../common/Panel';
import { DEFAULT_SCREEN_WIDTH_TILES, DEFAULT_SCREEN_HEIGHT_TILES, MSX_SCREEN5_PALETTE, MSX1_PALETTE, SCREEN2_PIXELS_PER_COLOR_SEGMENT, MSX1_PALETTE_IDX_MAP, MSX1_DEFAULT_COLOR, DEFAULT_TILE_BANKS_CONFIG, EDITOR_BASE_TILE_DIM_S2 as CONST_EDITOR_BASE_TILE_DIM_S2, EMPTY_CELL_CHAR_CODE as CONST_EMPTY_CELL_CHAR_CODE_EDITOR } from '../../constants';
import { ExportLayoutASMModal } from '../modals/ExportLayoutASMModal';
import { ExportBehaviorMapASMModal } from '../modals/ExportBehaviorMapASMModal';
import { ExportPletterModal } from '../modals/ExportPletterModal';
import { ExportSuperRLEModal } from '../modals/ExportSuperRLEModal';
import { ExportOptimizedRLEModal } from '../modals/ExportOptimizedRLEModal'; // New Import
import { HUDEditorModal } from './HUDEditorModal';
import { generateSuperRLEData, deepCompareTiles, generateScreenMapLayoutBytes, generateOptimizedRLEData } from '../utils/screenUtils'; // New Import
import { ConfirmationModal } from '../modals/ConfirmationModal';
import { PencilIcon, TilesetIcon } from '../icons/MsxIcons';


// Import new sub-components
import { ScreenGrid } from '../screen_editor/ScreenGrid';
import { ScreenEditorToolbar } from '../screen_editor/ScreenEditorToolbar';
import { ScreenTilesetPanel } from '../screen_editor/ScreenTilesetPanel';
import { ScreenEditorStatusBar } from '../screen_editor/ScreenEditorStatusBar';
import { ScreenSelectionToolsPanel } from '../screen_editor/ScreenSelectionToolsPanel'; 


const SCREEN_EDITOR_BASE_TILE_DIM_OTHER = 16;

interface ScreenEditorProps {
  screenMap: ScreenMap;
  onUpdate: (data: Partial<ScreenMap>, newAssetsToCreate?: ProjectAsset[]) => void;
  tileset: Tile[];
  sprites: ProjectAsset[];
  selectedTileId: string | null;
  setSelectedTileId: (id: string | null) => void;
  currentEntityTypeToPlace: EntityTemplate | null; 
  currentScreenMode: string;
  tileBanks?: TileBank[];
  msx1FontData: MSXFont;
  msxFontColorAttributes: MSXFontColorAttributes;
  dataOutputFormat: DataFormat;
  selectedEntityInstanceId: string | null;
  onSelectEntityInstance: (id: string | null) => void;
  selectedEffectZoneId: string | null; 
  onSelectEffectZone: (id: string | null) => void; 
  copiedScreenBuffer: CopiedScreenData | null;
  setCopiedScreenBuffer: (buffer: CopiedScreenData | null) => void;
  allProjectAssets: ProjectAsset[];
  copiedLayerBuffer: CopiedLayerData | null; 
  setCopiedLayerBuffer: (buffer: CopiedLayerData | null) => void; 
  setStatusBarMessage: (message: string) => void; 
  onActiveLayerChange?: (layer: ScreenEditorLayerName) => void;
  componentDefinitions: ComponentDefinition[];
  entityTemplates: EntityTemplate[];
  onShowMapFile: () => void;
  onNavigateToAsset: (assetId: string) => void;
  onShowContextMenu: (position: { x: number; y: number }, items: ContextMenuItem[]) => void;
  waypointPickerState: { isPicking: boolean; waypointPrefix: 'waypoint1' | 'waypoint2'; };
  onWaypointPicked: (point: Point) => void;
}


export const ScreenEditor: React.FC<ScreenEditorProps> = ({
    screenMap, onUpdate, tileset, sprites, selectedTileId, setSelectedTileId, currentEntityTypeToPlace,
    currentScreenMode, tileBanks, msx1FontData, msxFontColorAttributes, dataOutputFormat,
    selectedEntityInstanceId, onSelectEntityInstance, selectedEffectZoneId, onSelectEffectZone,
    copiedScreenBuffer, setCopiedScreenBuffer, allProjectAssets,
    copiedLayerBuffer, setCopiedLayerBuffer, setStatusBarMessage,
    onActiveLayerChange, componentDefinitions, entityTemplates, onShowMapFile,
    onNavigateToAsset, onShowContextMenu, waypointPickerState, onWaypointPicked
}) => {
  const [activeLayer, setActiveLayerInternal] = useState<ScreenEditorLayerName>('background');
  const [zoom, setZoom] = useState(16);
  const [lastClickedCell, setLastClickedCell] = useState<Point | null>(null);

  const EDITOR_BASE_TILE_DIM = currentScreenMode === "SCREEN 2 (Graphics I)" ? CONST_EDITOR_BASE_TILE_DIM_S2 : SCREEN_EDITOR_BASE_TILE_DIM_OTHER;

  const [isExportLayoutModalOpen, setIsExportLayoutModalOpen] = useState(false);
  const [layoutASMExportData, setLayoutASMExportData] = useState<LayoutASMExportData | null>(null);
  
  const [isExportBehaviorMapModalOpen, setIsExportBehaviorMapModalOpen] = useState(false);
  const [behaviorMapASMExportData, setBehaviorMapASMExportData] = useState<BehaviorMapASMExportData | null>(null);

  const [isExportPletterModalOpen, setIsExportPletterModalOpen] = useState(false);
  const [pletterExportData, setPletterExportData] = useState<PletterExportData | null>(null);

  const [isExportSuperRLEModalOpen, setIsExportSuperRLEModalOpen] = useState(false);
  const [superRLEExportData, setSuperRLEExportData] = useState<SuperRLEExportData | null>(null);
  
  const [isExportOptimizedRLEModalOpen, setIsExportOptimizedRLEModalOpen] = useState(false);
  const [optimizedRLEExportData, setOptimizedRLEExportData] = useState<OptimizedRLEExportData | null>(null);

  const [isHudEditorModalOpen, setIsHudEditorModalOpen] = useState(false);

  const [localActiveX, setLocalActiveX] = useState<string>((screenMap.activeAreaX ?? 0).toString());
  const [localActiveY, setLocalActiveY] = useState<string>((screenMap.activeAreaY ?? 0).toString());
  const [localActiveW, setLocalActiveW] = useState<string>((screenMap.activeAreaWidth ?? screenMap.width).toString());
  const [localActiveH, setLocalActiveH] = useState<string>((screenMap.activeAreaHeight ?? screenMap.height).toString());
  
  const [isPasteConfirmModalOpen, setIsPasteConfirmModalOpen] = useState(false);
  
  const [currentScreenTool, setCurrentScreenTool] = useState<ScreenEditorTool>('draw');
  const [selectionRect, setSelectionRect] = useState<ScreenSelectionRect | null>(null);

  const setActiveLayer = (newLayer: ScreenEditorLayerName) => {
    setActiveLayerInternal(newLayer);
    onActiveLayerChange?.(newLayer); // Call the callback prop
  };


  useEffect(() => {
    setLocalActiveX((screenMap.activeAreaX ?? 0).toString());
    setLocalActiveY((screenMap.activeAreaY ?? 0).toString());
    setLocalActiveW((screenMap.activeAreaWidth ?? screenMap.width).toString());
    setLocalActiveH((screenMap.activeAreaHeight ?? screenMap.height).toString());
  }, [screenMap.activeAreaX, screenMap.activeAreaY, screenMap.activeAreaWidth, screenMap.activeAreaHeight, screenMap.width, screenMap.height]);


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

  const handleEntityPlace = useCallback((point: Point) => {
    if (!currentEntityTypeToPlace) {
      return;
    }
    const newEntityInstance: EntityInstance = {
        id: `entity_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
        entityTemplateId: currentEntityTypeToPlace.id, 
        name: `${currentEntityTypeToPlace.name} ${screenMap.layers.entities.filter(e => e.entityTemplateId === currentEntityTypeToPlace.id).length + 1}`, 
        position: { x: point.x, y: point.y }, 
        componentOverrides: {}, 
    };
    const updatedEntities = [...screenMap.layers.entities, newEntityInstance];
    onUpdate({ layers: { ...screenMap.layers, entities: updatedEntities } });
  }, [currentEntityTypeToPlace, screenMap.layers, onUpdate]);

  const handleAddNewEffectZone = () => {
    const newZone: EffectZone = {
        id: `efz_${Date.now()}_${Math.random().toString(36).substring(2,5)}`,
        name: `Effect Zone ${ (screenMap.effectZones?.length || 0) + 1}`,
        rect: { x: lastClickedCell?.x ?? 0, y: lastClickedCell?.y ?? 0, width: 4, height: 4},
        mask: 0,
        description: ""
    };
    const updatedEffectZones = [...(screenMap.effectZones || []), newZone];
    onUpdate({ effectZones: updatedEffectZones });
    onSelectEffectZone(newZone.id);
    setStatusBarMessage(`Added new effect zone: ${newZone.name}`);
  };


  const handleTilePlace = useCallback((point: Point) => {
    setLastClickedCell(point);
    if (activeLayer === 'entities' || activeLayer === 'effects' || currentScreenTool === 'select') return; 

    const newLayers = { ...screenMap.layers };
    const layerToUpdateKey = activeLayer as Exclude<ScreenEditorLayerName, 'entities' | 'effects'>; // Ensure it's a valid layer key for tile data
    const layerToUpdate = newLayers[layerToUpdateKey]; 
    const currentLayerData = layerToUpdate.map(row => [...row]);
    let changed = false;

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
  }, [screenMap.layers, activeLayer, onUpdate, selectedTileId, tileset, EDITOR_BASE_TILE_DIM, setLastClickedCell, currentScreenTool]);

  const handleClearSelection = () => {
    if (!selectionRect || activeLayer === 'entities' || activeLayer === 'effects') return;
    const layerToUpdateKey = activeLayer as Exclude<ScreenEditorLayerName, 'entities' | 'effects'>;
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

  const handleFillSelection = () => {
    if (!selectionRect || activeLayer === 'entities' || activeLayer === 'effects' || !selectedTileId) return;
    const layerToUpdateKey = activeLayer as Exclude<ScreenEditorLayerName, 'entities' | 'effects'>;
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
    if (!selectionRect || activeLayer === 'entities' || activeLayer === 'effects' || !selectedTileId) return;
    const layerToUpdateKey = activeLayer as Exclude<ScreenEditorLayerName, 'entities' | 'effects'>;
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
    const layoutBytes = generateScreenMapLayoutBytes(screenMap, tileset, tileBanks, currentScreenMode);
    const comments: string[] = [];
    if (currentScreenMode !== "SCREEN 2 (Graphics I)") {
        const tempMap = new Map<number, {name: string, tileId: string, subX: number, subY: number}>();
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
        mapWidth: screenMap.activeAreaWidth ?? screenMap.width,
        mapHeight: screenMap.activeAreaHeight ?? screenMap.height,
        mapIndices: Array.from(layoutBytes),
        referenceComments: comments,
        dataFormat: dataOutputFormat
    });
    setIsExportLayoutModalOpen(true);
  };
  
  const prepareAndOpenOptimizedRLEExportModal = () => {
    const uncompressedLayoutBytes = Array.from(generateScreenMapLayoutBytes(screenMap, tileset, tileBanks, currentScreenMode));
    const compressedPackets = generateOptimizedRLEData(uncompressedLayoutBytes);
    
    const decompressorAsm = `; Your game should include one of these routines.
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
`;

    setOptimizedRLEExportData({
        mapName: screenMap.name,
        mapWidth: screenMap.activeAreaWidth ?? screenMap.width,
        mapHeight: screenMap.activeAreaHeight ?? screenMap.height,
        originalSize: uncompressedLayoutBytes.length,
        compressedSize: compressedPackets.length,
        optimizedRLEPackets: compressedPackets,
        decompressorAsm: decompressorAsm,
        compressionMethodName: 'OptimizedRLE'
    });
    setIsExportOptimizedRLEModalOpen(true);
  };

  const prepareAndOpenPletterExportModal = () => {
    const result = generateSuperRLEData(screenMap.layers.background, tileset, EDITOR_BASE_TILE_DIM, tileBanks, 'pletter');
    if ('error' in result) {
        alert(`Pletter Export Error: ${result.error}`);
        return;
    }
    setPletterExportData({
        mapName: screenMap.name,
        mapWidth: result.mapWidth,
        mapHeight: result.mapHeight,
        pletterDataBytes: result.superRLEDataBytes, 
        tilePartReferences: result.tilePartReferences || [],
    });
    setIsExportPletterModalOpen(true);
  };

  const prepareAndOpenSuperRLEExportModal = () => {
    const result = generateSuperRLEData(screenMap.layers.background, tileset, EDITOR_BASE_TILE_DIM, tileBanks, 'superRLE');
    if ('error' in result) {
        alert(`SuperRLE Export Error: ${result.error}`);
        return;
    }
    setSuperRLEExportData({
        mapName: screenMap.name,
        mapWidth: result.mapWidth,
        mapHeight: result.mapHeight,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        superRLEDataBytes: result.superRLEDataBytes,
        tilePartReferences: result.tilePartReferences,
        compressionMethodName: 'SuperRLE'
    });
    setIsExportSuperRLEModalOpen(true);
  };

  const handleExportBehaviorMapASM = () => {
    const behaviorMapData: number[] = [];
    const activeCollisionLayer = screenMap.layers.collision; 

    for (let r = 0; r < (screenMap.activeAreaHeight ?? screenMap.height); r++) {
        const mapY = (screenMap.activeAreaY ?? 0) + r;
        for (let c = 0; c < (screenMap.activeAreaWidth ?? screenMap.width); c++) {
            const mapX = (screenMap.activeAreaX ?? 0) + c;
            const screenTile = activeCollisionLayer[mapY]?.[mapX];
            if (screenTile?.tileId) {
                const tileAsset = tileset.find(t => t.id === screenTile.tileId);
                behaviorMapData.push(tileAsset?.logicalProperties?.mapId ?? 0);
            } else {
                behaviorMapData.push(0); 
            }
        }
    }
    setBehaviorMapASMExportData({
        mapName: screenMap.name,
        mapWidth: screenMap.activeAreaWidth ?? screenMap.width,
        mapHeight: screenMap.activeAreaHeight ?? screenMap.height,
        behaviorMapData,
        dataFormat: dataOutputFormat
    });
    setIsExportBehaviorMapModalOpen(true);
  };

  const handleUpdateHudConfiguration = (newHudConfig: HUDConfiguration) => { onUpdate({ hudConfiguration: newHudConfig }); };
  const openHudEditor = () => { if (!screenMap.hudConfiguration) { onUpdate({ hudConfiguration: { elements: [] } }); } setIsHudEditorModalOpen(true); };
  const isHudAreaDefined = (screenMap.activeAreaX ?? 0) > 0 || (screenMap.activeAreaY ?? 0) > 0 || (screenMap.activeAreaWidth ?? screenMap.width) < screenMap.width || (screenMap.activeAreaHeight ?? screenMap.height) < screenMap.height;
  const layerNamesForToolbar: ScreenEditorLayerName[] = ['background', 'collision', 'effects', 'entities'];
  const baseCellPixelWidth = EDITOR_BASE_TILE_DIM;
  const baseCellPixelHeight = EDITOR_BASE_TILE_DIM;

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
                const trulyNewTile = { ...bufferedTile, id: `pasted_tile_${Date.now()}_${Math.random().toString(36).substr(2,5)}`};
                
                const oldId = bufferedTile.id;
                const newId = trulyNewTile.id;
                (['background', 'collision', 'effects'] as const).forEach(layerName => {
                    updatedScreenMapData.layers![layerName] = updatedScreenMapData.layers![layerName].map(row => 
                        row.map(cell => cell.tileId === oldId ? {...cell, tileId: newId} : cell)
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
    if (activeLayer === 'effects' && tool !== 'defineEffectZone') {
        // If on effects layer, default tool is select-like or define.
        // If user clicks 'draw' or 'erase' from tileset panel, switch to background layer.
        if (tool === 'draw' || tool === 'erase') setActiveLayer('background');
    }
  };

  const handleLayerChange = (layer: ScreenEditorLayerName) => {
    setActiveLayer(layer);
    onSelectEntityInstance(null); // Deselect entity when layer changes
    onSelectEffectZone(null);   // Deselect effect zone when layer changes
    
    if (layer === 'entities') {
        handleSetScreenTool('placeEntity');
    } else if (layer === 'effects') {
        // For 'effects' layer, we don't have a dedicated "define zone" tool in phase 1
        // Set to 'select' conceptually, actual creation is via button, selection is via grid click.
        handleSetScreenTool('select'); // Using 'select' for now to show selection rectangle if needed.
    } else { // background, collision
        if(currentScreenTool === 'placeEntity' || currentScreenTool === 'defineEffectZone') {
             handleSetScreenTool('draw');
        }
    }
  };

  const handleCopyActiveLayer = useCallback(() => {
    if (activeLayer === 'entities' || activeLayer === 'effects') {
      setStatusBarMessage("Cannot copy the 'entities' or 'effects' (zone) layer this way.");
      return;
    }
    const sourceLayerName = activeLayer as Exclude<ScreenEditorLayerName, 'entities' | 'effects'>;
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
    if (activeLayer === 'entities' || activeLayer === 'effects') {
      setStatusBarMessage("Cannot paste into 'entities' or 'effects' (zone) layer this way.");
      return;
    }

    const targetLayerName = activeLayer as Exclude<ScreenEditorLayerName, 'entities' | 'effects'>;
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

  return (
    <Panel title={`Screen Editor: ${screenMap.name} ${currentScreenMode === "SCREEN 2 (Graphics I)" ? `(Base ${EDITOR_BASE_TILE_DIM}x${EDITOR_BASE_TILE_DIM})` : `(Base ${EDITOR_BASE_TILE_DIM}x${EDITOR_BASE_TILE_DIM})`}`} className="flex-grow flex flex-col bg-msx-bgcolor overflow-hidden">
      <ScreenEditorToolbar
        activeLayer={activeLayer}
        onLayerChange={handleLayerChange}
        layerNames={layerNamesForToolbar}
        zoom={zoom}
        onZoomChange={setZoom}
        activeAreaX={localActiveX}
        activeAreaY={localActiveY}
        activeAreaWidth={localActiveW}
        activeAreaHeight={localActiveH}
        onActiveAreaChange={handleActiveAreaInputChange}
        maxActiveAreaX={screenMap.width - 1}
        maxActiveAreaY={screenMap.height - 1}
        maxActiveAreaWidth={screenMap.width - (parseInt(localActiveX,10) || 0)}
        maxActiveAreaHeight={screenMap.height - (parseInt(localActiveY,10) || 0)}
        onOpenHudEditor={openHudEditor}
        isHudAreaDefined={isHudAreaDefined}
        onExportLayout={prepareAndOpenLayoutExportModal}
        onExportBehavior={handleExportBehaviorMapASM}
        onExportPletter={prepareAndOpenPletterExportModal}
        onExportSuperRLE={prepareAndOpenSuperRLEExportModal}
        onExportOptimizedRLE={prepareAndOpenOptimizedRLEExportModal}
        onCopyLayer={handleCopyActiveLayer}
        onPasteLayer={handlePasteLayer}
        isCopyLayerDisabled={activeLayer === 'entities' || activeLayer === 'effects'}
        isPasteLayerDisabled={!copiedLayerBuffer || activeLayer === 'entities' || activeLayer === 'effects'}
        onAddNewEffectZone={handleAddNewEffectZone}
        onShowMapFile={onShowMapFile}
      />

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
        />
        <div className="flex-grow p-2 overflow-auto flex items-center justify-center relative">
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
            tileBanks={currentScreenMode === "SCREEN 2 (Graphics I)" ? tileBanks : undefined}
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
          />
        </div>
        <ScreenSelectionToolsPanel
            currentScreenTool={currentScreenTool}
            onSetScreenTool={handleSetScreenTool}
            selectionRect={selectionRect}
            onClearSelection={handleClearSelection}
            onUnselect={handleUnselect}
            selectedTileId={selectedTileId}
            editorBaseTileDim={EDITOR_BASE_TILE_DIM}
            tileset={tileset}
            activeLayerIsEditable={activeLayer !== 'entities' && activeLayer !== 'effects'}
            onFillSelection={handleFillSelection}
            onZigZagFillSelection={handleZigZagFillSelection}
            onCopyScreen={handleCopyScreen}
            onPasteScreen={handlePasteScreen}
            isPasteDisabled={!copiedScreenBuffer}
        />
      </div>
      <ScreenEditorStatusBar
        activeLayer={activeLayer}
        selectedTileId={selectedTileId}
        currentEntityTypeToPlace={currentEntityTypeToPlace as MockEntityType | null}
        selectedEffectZoneName={screenMap.effectZones?.find(ez => ez.id === selectedEffectZoneId)?.name}
        tileset={tileset}
        screenMap={screenMap}
        lastClickedCell={lastClickedCell}
      />
       {isExportLayoutModalOpen && layoutASMExportData && ( <ExportLayoutASMModal isOpen={isExportLayoutModalOpen} onClose={() => setIsExportLayoutModalOpen(false)} {...layoutASMExportData} /> )}
      {isExportBehaviorMapModalOpen && behaviorMapASMExportData && ( <ExportBehaviorMapASMModal isOpen={isExportBehaviorMapModalOpen} onClose={() => setIsExportBehaviorMapModalOpen(false)} {...behaviorMapASMExportData} /> )}
      {isExportPletterModalOpen && pletterExportData && ( <ExportPletterModal isOpen={isExportPletterModalOpen} onClose={() => setIsExportPletterModalOpen(false)} {...pletterExportData} /> )}
      {isExportSuperRLEModalOpen && superRLEExportData && ( <ExportSuperRLEModal isOpen={isExportSuperRLEModalOpen} onClose={() => setIsExportSuperRLEModalOpen(false)} {...superRLEExportData} /> )}
      {isExportOptimizedRLEModalOpen && optimizedRLEExportData && ( <ExportOptimizedRLEModal isOpen={isExportOptimizedRLEModalOpen} onClose={() => setIsExportOptimizedRLEModalOpen(false)} {...optimizedRLEExportData} /> )}
      {isHudEditorModalOpen && screenMap && ( 
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
          /> 
      )}
      {isPasteConfirmModalOpen && (
        <ConfirmationModal
          isOpen={isPasteConfirmModalOpen}
          title="Paste Grid Data?"
          message={<>Are you sure you want to overwrite the current screen '<strong>{screenMap.name}</strong>' with the copied data? This action cannot be undone.</>}
          onConfirm={confirmPasteScreen}
          onCancel={() => setIsPasteConfirmModalOpen(false)}
          confirmText="Paste & Overwrite"
          confirmButtonVariant="danger"
        />
      )}
    </Panel>
  );
};
