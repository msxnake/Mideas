
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { ScreenMap, Tile, Point, MSX1ColorValue, HUDElement, HUDElementType, TileBank, MSXFont, MSXFontColorAttributes, Sprite, ProjectAsset, ScreenEditorTool, ScreenSelectionRect, EntityTemplate, EffectZone, ComponentDefinition, TileStamp, EFFECT_ZONE_TYPE_CONFIG, MSXFontAsset, resolveEffectZoneType } from '../../types';
import { MSX1_PALETTE_IDX_MAP, MSX1_DEFAULT_COLOR, MSX_SCREEN5_PALETTE, MSX1_PALETTE } from '../../constants';
import { getBackgroundColorHex } from '../../utils/screenModeConfig';
import { renderMSX1TextToDataURL, getTextDimensionsMSX1, DEFAULT_MSX_FONT, renderUnifiedTextToDataURL } from '../utils/msxFontRenderer';
import { createTileDataURL, createSpriteDataURL } from '../utils/screenUtils';

/**
 * Represents the name of a layer in the screen editor.
 * @category ScreenEditor
 */
type LayerName = keyof ScreenMap['layers'] | 'entities' | 'effects';

export interface ScreenGridOptimizationOverlayBlock {
  x: number;
  y: number;
  width: number;
  height: number;
  catalogIndex: number;
  usageCount: number;
  isRepeated: boolean;
}

export interface ScreenGridOptimizationOverlay {
  mode: 'blocks2x2' | 'blocks4x4';
  blocks: ScreenGridOptimizationOverlayBlock[];
}

/**
 * Props for the {@link ScreenGrid} component.
 * @category ScreenEditor
 */
export interface ScreenGridProps {
  /** The screen map data to render. */
  mapData: ScreenMap;
  /** The currently active layer being edited. */
  activeLayer: LayerName;
  /** The tileset used for rendering tiles. */
  tileset: Tile[];
  /** A list of all sprite assets in the project. */
  sprites: ProjectAsset[];
  /** All project assets for unified font rendering. */
  allAssets: ProjectAsset[]; 
  /** Callback function when a tile is placed or erased. */
  onTilePlace: (point: Point) => void;
  /** Callback function when an entity is placed. */
  onEntityPlace: (point: Point) => void;
  /** Callback function when an entity is selected. */
  onEntitySelect: (entityId: string) => void;
  /** Callback function when an effect zone is selected. */
  onEffectZoneSelect: (zoneId: string | null) => void; 
  /** Callback function for context menu events on tiles. */
  onTileContextMenu: (event: React.MouseEvent, tileId: string) => void;
  /** The size of each grid cell in pixels. */
  gridPixelSize: number;
  /** The base width of a cell in pixels (for scaling). */
  baseCellPixelWidth: number;
  /** The base height of a cell in pixels (for scaling). */
  baseCellPixelHeight: number;
  /** The current screen mode (e.g., 'screen2'). */
  currentScreenMode: string;
  /** An array of HUD elements to display. */
  hudElements?: HUDElement[];
  /** The base dimension of a tile in the editor. */
  editorBaseTileDim: number;
  /** An array of tile banks for the current screen. */
  tileBanks?: TileBank[];
  /** The MSX font data. */
  msxFont: MSXFont;
  /** The color attributes for the MSX font. */
  msxFontColorAttributes: MSXFontColorAttributes;
  /** The ID of the currently selected entity instance. */
  selectedEntityInstanceId: string | null;
  /** An array of effect zones for the current screen. */
  effectZones: EffectZone[]; 
  /** The ID of the currently selected effect zone. */
  selectedEffectZoneId: string | null; 
  /** The currently active tool in the editor. */
  currentScreenTool: ScreenEditorTool;
  /** The current selection rectangle, or null if no selection. */
  selectionRect: ScreenSelectionRect | null;
  /** Callback function when the selection rectangle changes. */
  onSelectionChange: (rect: ScreenSelectionRect | null) => void;
  /** A list of all component definitions in the project. */
  componentDefinitions: ComponentDefinition[]; 
  /** A list of all entity templates in the project. */
  entityTemplates: EntityTemplate[]; 
  /** The state of the waypoint picker. */
  waypointPickerState: { isPicking: boolean; };
  /** Callback function when a waypoint is picked. */
  onWaypointPicked: (point: Point) => void;
  /** Whether to show the sector grid lines (for MSX Screen 2). */
  showSectorLines: boolean;
  /** The currently selected stamp for placement. */
  selectedStamp?: TileStamp | null;
  /** Optional preview overlay showing repeated vs unique optimized blocks. */
  optimizationOverlay?: ScreenGridOptimizationOverlay | null;
}

/**
 * The main grid component for the screen editor.
 * It handles rendering of tiles, entities, HUD elements, and user interactions like placing, selecting, and drawing.
 *
 * @param props The component props.
 * @returns A React component.
 * @category ScreenEditor
 */
export const ScreenGrid: React.FC<ScreenGridProps> = ({
  mapData, activeLayer, tileset, sprites, allAssets, onTilePlace, onEntityPlace, onEntitySelect, onEffectZoneSelect, onTileContextMenu,
  gridPixelSize, baseCellPixelWidth, baseCellPixelHeight, currentScreenMode,
  hudElements, editorBaseTileDim, tileBanks, msxFont, msxFontColorAttributes,
  selectedEntityInstanceId, effectZones, selectedEffectZoneId,
  currentScreenTool, selectionRect, onSelectionChange,
  componentDefinitions, entityTemplates, waypointPickerState, onWaypointPicked, showSectorLines, selectedStamp,
  optimizationOverlay
}) => {
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startSelectionPoint, setStartSelectionPoint] = useState<Point | null>(null);
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null); // Track mouse position for stamp preview
  const gridRef = useRef<HTMLDivElement>(null);

  const { layers, width: screenWidth, height: screenHeight, activeAreaX = 0, activeAreaY = 0, activeAreaWidth = screenWidth, activeAreaHeight = screenHeight } = mapData;
  const mapEntityTemplates = entityTemplates; 

  const tileBankDefinitions = useMemo(() => {
    if (currentScreenMode !== "SCREEN 2 (Graphics I)" || !tileBanks) {
      return undefined;
    }
    return tileBanks.flatMap(tb => tb.banks || []);
  }, [tileBanks, currentScreenMode]);


  const getGridCoordinatesFromMouseEvent = (event: React.MouseEvent): Point | null => {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / gridPixelSize);
    const y = Math.floor((event.clientY - rect.top) / gridPixelSize);
    if (x >= 0 && x < screenWidth && y >= 0 && y < screenHeight) {
      return { x, y };
    }
    return null;
  };
  
  /**
   * Handles the mouse down event on the grid.
   * This function determines the action to take based on the current tool and active layer,
   * such as selecting an entity, starting a selection rectangle, or placing a tile/entity.
   * @param event The mouse event.
   */
  const handleMouseDown = (event: React.MouseEvent) => {
    if (event.button !== 0) return; // Only handle left-click for placing/selecting
    const point = getGridCoordinatesFromMouseEvent(event);
    if (!point) return;

    if (waypointPickerState.isPicking) {
      onWaypointPicked(point);
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    

    setIsMouseDown(true);

    // Prioritize entity selection if an entity is clicked, regardless of current tool/layer mode
    const clickedEntity = layers.entities.find(e => {
        const entityTemplate = mapEntityTemplates?.find(et => et.id === e.entityTemplateId);
        let entitySpanXCells = 1;
        let entitySpanYCells = 1;
        
        if (entityTemplate) {
            const renderComponentDef = componentDefinitions.find(cd => cd.id === 'comp_render');
            const spriteIdFromOverride = e.componentOverrides?.["comp_render"]?.spriteAssetId;
            const spriteIdFromTemplate = entityTemplate?.components.find(c => c.definitionId === 'comp_render')?.defaultValues.spriteAssetId;
            const defaultSpriteIdFromDef = renderComponentDef?.properties.find(p => p.name === 'spriteAssetId')?.defaultValue;
            const spriteId = spriteIdFromOverride || spriteIdFromTemplate || defaultSpriteIdFromDef;
            
            const spriteAsset = sprites.find(s => s.id === spriteId && s.type === 'sprite');
            if (spriteAsset?.data) {
                const spriteData = spriteAsset.data as Sprite;
                entitySpanXCells = Math.max(1, Math.ceil(spriteData.size.width / editorBaseTileDim));
                entitySpanYCells = Math.max(1, Math.ceil(spriteData.size.height / editorBaseTileDim));
            }
        }
        
        return (
          point.x >= e.position.x && point.x < e.position.x + entitySpanXCells &&
          point.y >= e.position.y && point.y < e.position.y + entitySpanYCells
        );
    });

    if (clickedEntity) {
        onEntitySelect(clickedEntity.id); 
        return; // Entity selected, primary action done.
    }

    // If no entity was clicked, proceed with other tool/layer logic
    if (currentScreenTool === 'select' && activeLayer !== 'entities') {
        if (activeLayer === 'effects') {
            const clickedEffectZone = effectZones.find(zone =>
                point.x >= zone.rect.x && point.x < zone.rect.x + zone.rect.width &&
                point.y >= zone.rect.y && point.y < zone.rect.y + zone.rect.height
            );
            if (clickedEffectZone) {
                onSelectionChange(null);
                onEffectZoneSelect(clickedEffectZone.id);
                return;
            }
            onEffectZoneSelect(null);
        }
        setStartSelectionPoint(point);
        onSelectionChange({ x: point.x, y: point.y, width: 1, height: 1 });
    } else if (activeLayer === 'effects') {
        onTilePlace(point);
    } else if (currentScreenTool === 'draw' || currentScreenTool === 'erase' || currentScreenTool === 'stamp') {
        if (activeLayer === 'entities') {
            onEntityPlace(point); // Place new entity if "Entities" layer is active and click is on empty space
        } else { // Background or Collision layer
            onTilePlace(point);
        }
    } else if (currentScreenTool === 'placeEntity' && activeLayer === 'entities') {
        onEntityPlace(point);
    }
  };
  
  /**
   * Handles the mouse move event on the grid.
   * This is primarily used to update the selection rectangle when the user is dragging.
   * Also tracks mouse position for stamp preview.
   * @param event The mouse event.
   */
  const handleMouseMove = (event: React.MouseEvent) => {
    const currentPoint = getGridCoordinatesFromMouseEvent(event);

    // Update hover point for stamp preview
    setHoverPoint(currentPoint);

    if (!isMouseDown || !startSelectionPoint || currentScreenTool !== 'select' || activeLayer === 'entities') return;
    if (!currentPoint) return;

    const newRectX = Math.min(startSelectionPoint.x, currentPoint.x);
    const newRectY = Math.min(startSelectionPoint.y, currentPoint.y);
    const newRectWidth = Math.abs(startSelectionPoint.x - currentPoint.x) + 1;
    const newRectHeight = Math.abs(startSelectionPoint.y - currentPoint.y) + 1;
    onSelectionChange({ x: newRectX, y: newRectY, width: newRectWidth, height: newRectHeight });
  };

  /**
   * Handles the mouse up event on the grid.
   * Resets the mouse down state and finalizes the selection.
   */
  const handleMouseUp = () => {
    setIsMouseDown(false);
    if (currentScreenTool === 'select' && activeLayer !== 'entities') {
      setStartSelectionPoint(null); 
    }
  };

  useEffect(() => {
    const upListener = () => {
      if (isMouseDown) {
        handleMouseUp();
      }
    };
    window.addEventListener('mouseup', upListener);
    return () => {
      window.removeEventListener('mouseup', upListener);
    };
  }, [isMouseDown, currentScreenTool, activeLayer]); 

  const layerDataToRender = (activeLayer === 'background' || activeLayer === 'collision' || activeLayer === 'effects')
    ? layers[activeLayer as 'background' | 'collision' | 'effects']
    : layers.background;
  const baseLayerDataToRender = activeLayer === 'collision' ? layers.collision : layers.background;
  const effectOverlayData = activeLayer === 'effects' ? layers.effects : null;
  const selectedEffectZone = effectZones.find(zone => zone.id === selectedEffectZoneId) || null;
  const isEditingSelectedSecretZone = activeLayer === 'effects'
    && currentScreenTool !== 'select'
    && !!selectedEffectZone
    && resolveEffectZoneType(selectedEffectZone) === 'secretZone';

  if (!layerDataToRender || !Array.isArray(layerDataToRender) || layerDataToRender.length === 0) {
    return <div className="text-xs text-red-400">Layer data is empty or invalid.</div>;
  }

  const emptyTileBgColor = currentScreenMode === "SCREEN 2 (Graphics I)" ? (MSX1_PALETTE_IDX_MAP.get(0)?.hex || MSX1_DEFAULT_COLOR.hex) : MSX_SCREEN5_PALETTE[4].hex;

  const isTextBasedHudElement = (elType: HUDElementType) => {
    return [
      HUDElementType.Score, HUDElementType.HighScore, HUDElementType.Lives,
      HUDElementType.SceneName, HUDElementType.CoinCounter, HUDElementType.AttackAlert,
      HUDElementType.TextBox, HUDElementType.NumericField, HUDElementType.CustomCounter
    ].includes(elType);
  };

  const actualPixelScale = gridPixelSize / editorBaseTileDim;
  const renderedHudPlaceholders: React.ReactNode[] = [];

  if (hudElements) {
    hudElements.forEach(hudEl => {
      if (!hudEl.visible) return;
      
      const elBaseX = hudEl.position.x * actualPixelScale;
      const elBaseY = hudEl.position.y * actualPixelScale;
      const details = hudEl.details || {};
      const isMSX1Screen = currentScreenMode === "SCREEN 2 (Graphics I)";

      if (isTextBasedHudElement(hudEl.type) && (hudEl.text || hudEl.name)) {
        const textToRender = hudEl.text || hudEl.name || "TEXT";
        const charSpacing = typeof details.charSpacing === 'number' ? details.charSpacing : 0;
        const fontToUse = msxFont || DEFAULT_MSX_FONT;
        const fontColorAttrs = msxFontColorAttributes || {};

        // Extract custom colors from HUD element details
        const hudTextColor = details.textColor || undefined;
        const hudBackgroundColor = details.textBackgroundColor || undefined;

        const textImageSrc = renderUnifiedTextToDataURL(
          textToRender,
          tileBanks,
          allAssets,
          fontToUse,
          fontColorAttrs,
          1,
          charSpacing,
          hudTextColor,
          hudBackgroundColor
        );
        const dimensions = getTextDimensionsMSX1(textToRender, charSpacing);

        renderedHudPlaceholders.push(
          <img
            key={`preview-hudel-text-${hudEl.id}`}
            src={textImageSrc}
            alt={hudEl.name}
            style={{
              position: 'absolute', left: elBaseX, top: elBaseY,
              width: dimensions.width * actualPixelScale,
              height: dimensions.height * actualPixelScale,
              imageRendering: 'pixelated',
            }}
            title={`${hudEl.name} @ (${hudEl.position.x},${hudEl.position.y}) - Text: ${hudEl.text || ''}. Colors per MSX1 char data.`}
            draggable="false"
          />
        );
      } else if (hudEl.type === HUDElementType.EnergyBar || hudEl.type === HUDElementType.BossEnergyBar) {
          // ... (EnergyBar and ItemDisplay rendering logic remains the same as before) ...
      } else if (hudEl.type === HUDElementType.ItemDisplay) {
          // ...
      } else {
        const placeholderWidth = Math.max(16 * actualPixelScale, (hudEl.name.length * (editorBaseTileDim/2) * 0.6 * actualPixelScale) ); 
        const placeholderHeight = Math.max(8 * actualPixelScale, (editorBaseTileDim/2) * actualPixelScale);
        renderedHudPlaceholders.push(
          <div key={`placeholder-${hudEl.id}`} style={{
            position: 'absolute', left: elBaseX, top: elBaseY,
            width: placeholderWidth, height: placeholderHeight,
            backgroundColor: 'rgba(128, 128, 128, 0.5)', 
            border: '1px dashed rgba(255,255,255,0.5)',
            fontSize: `${Math.max(5, (editorBaseTileDim / 2) * 0.7 * actualPixelScale)}px`, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'
          }} title={`${hudEl.name} (Placeholder)`}>
            {hudEl.name.substring(0,3)}..
          </div>
        );
      }
    });
  }

  const bankZoneDefaultColors = [
    'rgba(255, 0, 0, 0.15)',
    'rgba(0, 255, 0, 0.10)',
    'rgba(0, 0, 255, 0.15)',
  ];

  let cursorStyle = 'crosshair';
  if (waypointPickerState.isPicking) {
    cursorStyle = 'crosshair';
  } else if (activeLayer === 'entities' || currentScreenTool === 'placeEntity') {
    cursorStyle = 'copy';
  } else if (currentScreenTool === 'select') {
    cursorStyle = 'cell';
  }

  // Get background color from screenMap or default to black
  const bgColorIndex = mapData.backgroundColor !== undefined ? mapData.backgroundColor : 1;
  const bgColor = getBackgroundColorHex(bgColorIndex, currentScreenMode);

  const resolveFontTilePreview = (tileId: string | null | undefined, subTileX?: number) => {
    if (!tileId || !tileBanks || currentScreenMode !== "SCREEN 2 (Graphics I)") {
      return null;
    }

    for (const bank of tileBankDefinitions || []) {
      const assignment = bank.assignedTiles?.[tileId];
      if (!assignment || !Array.isArray((assignment as any).fontCharacters)) {
        continue;
      }

      const fontCharacters = (assignment as any).fontCharacters as Array<{ character: string }>;
      const charInfo = fontCharacters[subTileX || 0];
      if (!charInfo) {
        return null;
      }

      const matchingFontAsset = allAssets.find(asset => asset.type === 'font' && tileId.includes(asset.id));
      const fontData = matchingFontAsset ? (matchingFontAsset.data as MSXFontAsset).fontData : msxFont;
      const fontColors = matchingFontAsset ? (matchingFontAsset.data as MSXFontAsset).fontColorAttributes : msxFontColorAttributes;

      return {
        src: renderMSX1TextToDataURL(charInfo.character, fontData, fontColors, 1, 0, undefined, 'transparent'),
        alt: charInfo.character,
      };
    }

    return null;
  };

  return (
    <div
      ref={gridRef}
      className="grid border border-msx-border shadow-inner relative"
      style={{
        gridTemplateColumns: `repeat(${screenWidth}, ${gridPixelSize}px)`,
        gridTemplateRows: `repeat(${screenHeight}, ${gridPixelSize}px)`,
        width: screenWidth * gridPixelSize,
        height: screenHeight * gridPixelSize,
        imageRendering: 'pixelated',
        cursor: cursorStyle,
        backgroundColor: bgColor, // Apply MSX background color
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={(e) => {
        const point = getGridCoordinatesFromMouseEvent(e);
        if (point) {
          const tileId = layerDataToRender[point.y]?.[point.x]?.tileId;
          if (tileId) {
            onTileContextMenu(e, tileId);
          } else {
            e.preventDefault(); // Prevent default even on empty cell
          }
        }
      }}
    >
      {/* Render base tile layer */}
      {baseLayerDataToRender.map((row, y) =>
        row.map((screenTile, x) => {
          const baseTileAsset = tileset.find(t => t.id === screenTile.tileId);
          const effectTile = effectOverlayData?.[y]?.[x];
          const effectTileAsset = effectTile?.tileId ? tileset.find(t => t.id === effectTile.tileId) : undefined;
          const isInsideSelectedSecretZone = isEditingSelectedSecretZone
            && !!selectedEffectZone
            && x >= selectedEffectZone.rect.x
            && x < selectedEffectZone.rect.x + selectedEffectZone.rect.width
            && y >= selectedEffectZone.rect.y
            && y < selectedEffectZone.rect.y + selectedEffectZone.rect.height;
          const displayTile = isInsideSelectedSecretZone
            ? (effectTileAsset || null)
            : (effectTileAsset || baseTileAsset);
          const displaySubTileX = isInsideSelectedSecretZone
            ? effectTile?.subTileX
            : (effectTileAsset ? effectTile?.subTileX : screenTile.subTileX);
          const displaySubTileY = isInsideSelectedSecretZone
            ? effectTile?.subTileY
            : (effectTileAsset ? effectTile?.subTileY : screenTile.subTileY);
          const fontTilePreview = !displayTile
            ? resolveFontTilePreview(
                isInsideSelectedSecretZone ? effectTile?.tileId : (effectTile?.tileId || screenTile.tileId),
                isInsideSelectedSecretZone ? effectTile?.subTileX : (effectTile?.subTileX ?? screenTile.subTileX)
              )
            : null;
          const isCellActive = x >= activeAreaX && x < activeAreaX + activeAreaWidth &&
                               y >= activeAreaY && y < activeAreaY + activeAreaHeight;
          return (
            <div
              key={`${x}-${y}`}
              className={`hover:outline hover:outline-1 hover:outline-msx-highlight relative
                ${(activeLayer === 'collision' && baseTileAsset) ? 'bg-msx-danger/30' : ''}
              `}
              style={{
                width: `${gridPixelSize}px`,
                height: `${gridPixelSize}px`,
                // Background color is inherited from parent grid div
              }}
              title={displayTile ? `Tile: ${displayTile.name} (Part ${displaySubTileX ?? 0},${displaySubTileY ?? 0}) @ (${x},${y})` : `Empty @ (${x},${y})`}
            >
              {displayTile && displayTile.data && (
                <img
                  src={createTileDataURL(
                    displayTile,
                    displaySubTileX,
                    displaySubTileY,
                    gridPixelSize,
                    gridPixelSize,
                    baseCellPixelWidth,
                    currentScreenMode
                  )}
                  alt={displayTile.name}
                  className="w-full h-full object-contain pointer-events-none" 
                  style={{ imageRendering: 'pixelated' }}
                  draggable="false"
                />
              )}
              {!displayTile && fontTilePreview && (
                <img
                  src={fontTilePreview.src}
                  alt={fontTilePreview.alt}
                  className="w-full h-full object-contain pointer-events-none"
                  style={{ imageRendering: 'pixelated' }}
                  draggable="false"
                />
              )}
              {!isCellActive && (activeLayer !== 'entities') && (
                <div
                  className="absolute inset-0 bg-black opacity-60 pointer-events-none"
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })
      )}
      {optimizationOverlay && optimizationOverlay.blocks.map((block) => {
        const showUsageLabel = (block.width * gridPixelSize) >= 24 && (block.height * gridPixelSize) >= 16;
        const borderColor = block.isRepeated ? 'rgba(0, 220, 180, 0.95)' : 'rgba(255, 196, 0, 0.95)';
        const backgroundColor = block.isRepeated ? 'rgba(0, 220, 180, 0.18)' : 'rgba(255, 196, 0, 0.14)';

        return (
          <div
            key={`optimization-overlay-${optimizationOverlay.mode}-${block.x}-${block.y}`}
            className="absolute pointer-events-none"
            style={{
              left: block.x * gridPixelSize,
              top: block.y * gridPixelSize,
              width: block.width * gridPixelSize,
              height: block.height * gridPixelSize,
              border: `1px solid ${borderColor}`,
              backgroundColor,
              boxSizing: 'border-box',
              zIndex: 12,
            }}
            aria-hidden="true"
          >
            {showUsageLabel && (
              <span
                className="absolute left-0 top-0 px-1 text-[0.55rem] leading-4 text-black"
                style={{
                  backgroundColor: borderColor,
                  maxWidth: '100%',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
              >
                {block.isRepeated ? `x${block.usageCount}` : '1x'}
              </span>
            )}
          </div>
        );
      })}
      {/* Render Effect Zones if 'effects' layer is active */}
      {activeLayer === 'effects' && effectZones.map(zone => {
        const isSelected = zone.id === selectedEffectZoneId;
        const effectType = resolveEffectZoneType(zone);
        const zoneDisplayColor = isEditingSelectedSecretZone && isSelected
          ? 'transparent'
          : EFFECT_ZONE_TYPE_CONFIG[effectType].color;
        const zoneCapturesPointer = currentScreenTool === 'select';

        return (
            <div
                key={zone.id}
                className={`absolute border-2 ${isSelected ? 'border-yellow-400 ring-2 ring-yellow-400' : 'border-dashed border-gray-400 hover:border-yellow-300'} box-border`}
                style={{
                    left: zone.rect.x * gridPixelSize,
                    top: zone.rect.y * gridPixelSize,
                    width: zone.rect.width * gridPixelSize,
                    height: zone.rect.height * gridPixelSize,
                    backgroundColor: zoneDisplayColor,
                    zIndex: 15, 
                    cursor: zoneCapturesPointer ? 'pointer' : 'default',
                    pointerEvents: zoneCapturesPointer ? 'auto' : 'none',
                }}
                onClick={(e) => {
                  if (!zoneCapturesPointer) return;
                  e.stopPropagation();
                  onEffectZoneSelect(zone.id);
                }}
                title={`Effect Zone: ${zone.name}\nType: ${EFFECT_ZONE_TYPE_CONFIG[effectType].label}`}
            >
                <span className="absolute top-0 left-0 px-1 py-0.5 text-[0.6rem] bg-black/50 text-white opacity-80 pointer-events-none">
                    {zone.name.substring(0,10)}{zone.name.length > 10 ? '...' : ''}
                </span>
            </div>
        );
      })}

      {/* Render Entities only if 'entities' layer is active */}
      {activeLayer === 'entities' && layers.entities.map(entity => {
        const entityTemplate = mapEntityTemplates?.find(et => et.id === entity.entityTemplateId);
        const renderComponentDef = componentDefinitions.find(cd => cd.id === 'comp_render');
        const spriteIdFromOverride = entity.componentOverrides?.["comp_render"]?.spriteAssetId;
        const spriteIdFromTemplate = entityTemplate?.components.find(c => c.definitionId === 'comp_render')?.defaultValues.spriteAssetId;
        const defaultSpriteIdFromDef = renderComponentDef?.properties.find(p => p.name === 'spriteAssetId')?.defaultValue;
        
        const spriteId = spriteIdFromOverride || spriteIdFromTemplate || defaultSpriteIdFromDef;
        const spriteAsset = sprites.find(s => s.id === spriteId && s.type === 'sprite');

        let displayContent: React.ReactNode = entityTemplate?.icon || 'E';
        let entityWidthPx = gridPixelSize;
        let entityHeightPx = gridPixelSize;

        if (spriteAsset?.data) {
            const spriteData = spriteAsset.data as Sprite;
            if (spriteData.frames.length > 0) {
                const firstFrame = spriteData.frames[0];
                entityWidthPx = spriteData.size.width * (gridPixelSize / editorBaseTileDim);
                entityHeightPx = spriteData.size.height * (gridPixelSize / editorBaseTileDim);
                displayContent = (
                    <img 
                        src={createSpriteDataURL(firstFrame.data, spriteData.size.width, spriteData.size.height)} 
                        alt={entity.name} 
                        className="w-full h-full object-contain pointer-events-none" 
                        style={{imageRendering: 'pixelated'}}
                        draggable="false"
                    />
                );
            }
        }
        
        const isSelected = entity.id === selectedEntityInstanceId;
        return (
          <div
            key={entity.id}
            className={`absolute flex items-center justify-center text-xs text-white/80 hover:ring-1 hover:ring-msx-highlight
                        ${isSelected ? 'bg-msx-accent/50 border-2 border-msx-highlight ring-2 ring-msx-highlight' : 'bg-black/30 border border-msx-textsecondary/50'}
                        `}
            style={{
              left: entity.position.x * gridPixelSize,
              top: entity.position.y * gridPixelSize,
              width: entityWidthPx,
              height: entityHeightPx,
              zIndex: 20,
              cursor: 'pointer',
            }}
            onClick={(e) => { e.stopPropagation(); onEntitySelect(entity.id); }}
            title={`Entity: ${entity.name} (Type: ${entityTemplate?.name || 'Unknown'}) @ (${entity.position.x},${entity.position.y})`}
          >
            {displayContent}
          </div>
        );
      })}
      {renderedHudPlaceholders}
      <div
        className="absolute border border-dashed border-msx-lightyellow pointer-events-none opacity-75"
        style={{
          left: activeAreaX * gridPixelSize,
          top: activeAreaY * gridPixelSize,
          width: activeAreaWidth * gridPixelSize,
          height: activeAreaHeight * gridPixelSize,
          boxSizing: 'border-box'
        }}
        aria-hidden="true"
      />
      {/* MSX Screen 2 Sector Dividers (Horizontal Lines) */}
      {currentScreenMode === "SCREEN 2 (Graphics I)" && showSectorLines && (
        <>
          {/* Sector 0/1 divider at line 8 (Y = 8 tiles) */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: 0,
              top: 8 * gridPixelSize,
              width: screenWidth * gridPixelSize,
              height: '2px',
              backgroundColor: 'rgba(255, 200, 0, 0.7)',
              boxShadow: '0 0 4px rgba(255, 200, 0, 0.8)',
              zIndex: 10
            }}
            title="MSX Screen 2 - Sector 0/1 boundary (Line 8)"
            aria-hidden="true"
          />
          {/* Sector 1/2 divider at line 16 (Y = 16 tiles) */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: 0,
              top: 16 * gridPixelSize,
              width: screenWidth * gridPixelSize,
              height: '2px',
              backgroundColor: 'rgba(255, 200, 0, 0.7)',
              boxShadow: '0 0 4px rgba(255, 200, 0, 0.8)',
              zIndex: 10
            }}
            title="MSX Screen 2 - Sector 1/2 boundary (Line 16)"
            aria-hidden="true"
          />
          {/* Sector Labels */}
          <div
            className="absolute pointer-events-none text-xs font-bold opacity-60"
            style={{
              left: 4,
              top: 2 * gridPixelSize,
              color: '#FFC800',
              textShadow: '0 0 2px black',
              zIndex: 11
            }}
            aria-hidden="true"
          >
            SECTOR 0 (Lines 0-7)
          </div>
          <div
            className="absolute pointer-events-none text-xs font-bold opacity-60"
            style={{
              left: 4,
              top: 10 * gridPixelSize,
              color: '#FFC800',
              textShadow: '0 0 2px black',
              zIndex: 11
            }}
            aria-hidden="true"
          >
            SECTOR 1 (Lines 8-15)
          </div>
          <div
            className="absolute pointer-events-none text-xs font-bold opacity-60"
            style={{
              left: 4,
              top: 18 * gridPixelSize,
              color: '#FFC800',
              textShadow: '0 0 2px black',
              zIndex: 11
            }}
            aria-hidden="true"
          >
            SECTOR 2 (Lines 16-23)
          </div>
        </>
      )}

      {currentScreenMode === "SCREEN 2 (Graphics I)" && tileBankDefinitions && tileBankDefinitions.map((bank, index) => {
        const isBankEffectivelyEnabled = bank.enabled ?? true;
        if (!isBankEffectivelyEnabled) return null;

        const zoneX = bank.screenZone.x * gridPixelSize;
        const zoneY = bank.screenZone.y * gridPixelSize;
        const zoneW = bank.screenZone.width * gridPixelSize;
        const zoneH = bank.screenZone.height * gridPixelSize;
        const zoneColor = bankZoneDefaultColors[index % bankZoneDefaultColors.length];
        return (
          <div
            key={`bankzone-${bank.id}`}
            className="absolute border-2 border-dashed pointer-events-none opacity-50"
            style={{
              left: zoneX, top: zoneY, width: zoneW, height: zoneH,
              borderColor: zoneColor,
              boxSizing: 'border-box',
              zIndex: 5
            }}
            aria-hidden="true"
          >
          </div>
        );
      })}
      {selectionRect && (
        <div
          className="absolute border-2 border-dashed border-yellow-400 pointer-events-none"
          style={{
            left: selectionRect.x * gridPixelSize,
            top: selectionRect.y * gridPixelSize,
            width: selectionRect.width * gridPixelSize,
            height: selectionRect.height * gridPixelSize,
            boxSizing: 'border-box',
            zIndex: 20
          }}
          aria-hidden="true"
        />
      )}

      {/* Stamp Preview Overlay */}
      {currentScreenTool === 'stamp' && selectedStamp && hoverPoint && (activeLayer === 'background' || activeLayer === 'collision') && (
        <div
          className="absolute border-2 border-dashed border-blue-400 pointer-events-none"
          style={{
            left: hoverPoint.x * gridPixelSize,
            top: hoverPoint.y * gridPixelSize,
            width: selectedStamp.width * gridPixelSize,
            height: selectedStamp.height * gridPixelSize,
            backgroundColor: 'rgba(100, 150, 255, 0.2)',
            boxSizing: 'border-box',
            zIndex: 25
          }}
          aria-hidden="true"
        >
          <span className="absolute -top-5 left-0 text-[0.65rem] bg-blue-500/80 text-white px-1 rounded">
            {selectedStamp.name}
          </span>
        </div>
      )}
    </div>
  );
};
