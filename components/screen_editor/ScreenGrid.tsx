
import React, { useEffect, useState, useRef } from 'react';
import { ScreenMap, Tile, Point, MSX1ColorValue, HUDElement, HUDElementType, TileBank, MSXFont, MSXFontColorAttributes, Sprite, ProjectAsset, ScreenEditorTool, ScreenSelectionRect, EntityTemplate, EffectZone, EffectZoneFlagKey, ComponentDefinition } from '../../types';
import { MSX1_PALETTE_IDX_MAP, MSX1_DEFAULT_COLOR, MSX_SCREEN5_PALETTE, EFFECT_ZONE_FLAGS } from '../../constants';
import { renderMSX1TextToDataURL, getTextDimensionsMSX1, DEFAULT_MSX_FONT } from '../utils/msxFontRenderer';
import { createTileDataURL, createSpriteDataURL } from '../utils/screenUtils';

type LayerName = keyof ScreenMap['layers'] | 'entities' | 'effects';

export interface ScreenGridProps {
  mapData: ScreenMap;
  activeLayer: LayerName;
  tileset: Tile[];
  sprites: ProjectAsset[]; 
  onTilePlace: (point: Point) => void;
  onEntityPlace: (point: Point) => void;
  onEntitySelect: (entityId: string) => void;
  onEffectZoneSelect: (zoneId: string | null) => void; 
  onTileContextMenu: (event: React.MouseEvent, tileId: string) => void;
  gridPixelSize: number;
  baseCellPixelWidth: number;
  baseCellPixelHeight: number;
  currentScreenMode: string;
  hudElements?: HUDElement[];
  editorBaseTileDim: number;
  tileBanks?: TileBank[];
  msxFont: MSXFont;
  msxFontColorAttributes: MSXFontColorAttributes;
  selectedEntityInstanceId: string | null;
  effectZones: EffectZone[]; 
  selectedEffectZoneId: string | null; 
  currentScreenTool: ScreenEditorTool;
  selectionRect: ScreenSelectionRect | null;
  onSelectionChange: (rect: ScreenSelectionRect | null) => void;
  componentDefinitions: ComponentDefinition[]; 
  entityTemplates: EntityTemplate[]; 
  waypointPickerState: { isPicking: boolean; };
  onWaypointPicked: (point: Point) => void;
}

export const ScreenGrid: React.FC<ScreenGridProps> = ({
  mapData, activeLayer, tileset, sprites, onTilePlace, onEntityPlace, onEntitySelect, onEffectZoneSelect, onTileContextMenu,
  gridPixelSize, baseCellPixelWidth, baseCellPixelHeight, currentScreenMode,
  hudElements, editorBaseTileDim, tileBanks, msxFont, msxFontColorAttributes,
  selectedEntityInstanceId, effectZones, selectedEffectZoneId,
  currentScreenTool, selectionRect, onSelectionChange,
  componentDefinitions, entityTemplates, waypointPickerState, onWaypointPicked
}) => {
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startSelectionPoint, setStartSelectionPoint] = useState<Point | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const { layers, width: screenWidth, height: screenHeight, activeAreaX = 0, activeAreaY = 0, activeAreaWidth = screenWidth, activeAreaHeight = screenHeight } = mapData;
  const mapEntityTemplates = entityTemplates; 


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
    if (currentScreenTool === 'select' && activeLayer !== 'effects' && activeLayer !== 'entities') {
        setStartSelectionPoint(point);
        onSelectionChange({ x: point.x, y: point.y, width: 1, height: 1 });
    } else if (activeLayer === 'effects') {
        const clickedEffectZone = effectZones.find(zone => 
            point.x >= zone.rect.x && point.x < zone.rect.x + zone.rect.width &&
            point.y >= zone.rect.y && point.y < zone.rect.y + zone.rect.height
        );
        if (clickedEffectZone) {
            onEffectZoneSelect(clickedEffectZone.id);
        } else {
            onEffectZoneSelect(null);
        }
    } else if (currentScreenTool === 'draw' || currentScreenTool === 'erase') {
        if (activeLayer === 'entities') {
            onEntityPlace(point); // Place new entity if "Entities" layer is active and click is on empty space
        } else { // Background or Collision layer
            onTilePlace(point);
        }
    } else if (currentScreenTool === 'placeEntity' && activeLayer === 'entities') {
        onEntityPlace(point);
    }
  };
  
  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isMouseDown || !startSelectionPoint || currentScreenTool !== 'select' || activeLayer === 'effects' || activeLayer === 'entities') return;
    const currentPoint = getGridCoordinatesFromMouseEvent(event);
    if (!currentPoint) return;

    const newRectX = Math.min(startSelectionPoint.x, currentPoint.x);
    const newRectY = Math.min(startSelectionPoint.y, currentPoint.y);
    const newRectWidth = Math.abs(startSelectionPoint.x - currentPoint.x) + 1;
    const newRectHeight = Math.abs(startSelectionPoint.y - currentPoint.y) + 1;
    onSelectionChange({ x: newRectX, y: newRectY, width: newRectWidth, height: newRectHeight });
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    if (currentScreenTool === 'select' && activeLayer !== 'effects' && activeLayer !== 'entities') {
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

  const layerDataToRender = (activeLayer === 'background' || activeLayer === 'collision' || activeLayer === 'effects') && activeLayer !== 'effects' 
    ? layers[activeLayer as 'background' | 'collision' | 'effects'] 
    : layers.background; 

  if (!layerDataToRender || layerDataToRender.length === 0) {
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
        
        const textImageSrc = renderMSX1TextToDataURL(textToRender, fontToUse, msxFontColorAttributes, 1, charSpacing);
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
  } else if (currentScreenTool === 'select' || activeLayer === 'effects') { 
    cursorStyle = 'cell';
  }

  return (
    <div
      ref={gridRef}
      className="grid bg-msx-black border border-msx-border shadow-inner relative"
      style={{
        gridTemplateColumns: `repeat(${screenWidth}, ${gridPixelSize}px)`,
        gridTemplateRows: `repeat(${screenHeight}, ${gridPixelSize}px)`,
        width: screenWidth * gridPixelSize,
        height: screenHeight * gridPixelSize,
        imageRendering: 'pixelated',
        cursor: cursorStyle,
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
      {/* Render base layer (background or collision) */}
      {activeLayer !== 'effects' && layerDataToRender.map((row, y) =>
        row.map((screenTile, x) => {
          const fullTileAsset = tileset.find(t => t.id === screenTile.tileId);
          const isCellActive = x >= activeAreaX && x < activeAreaX + activeAreaWidth &&
                               y >= activeAreaY && y < activeAreaY + activeAreaHeight;
          return (
            <div
              key={`${x}-${y}`}
              className={`hover:outline hover:outline-1 hover:outline-msx-highlight relative
                ${(activeLayer === 'collision' && fullTileAsset) ? 'bg-msx-danger/30' : ''}
              `}
              style={{
                width: `${gridPixelSize}px`,
                height: `${gridPixelSize}px`,
                backgroundColor: (!fullTileAsset && activeLayer !== 'entities' && currentScreenTool !== 'select') ? emptyTileBgColor : undefined,
              }}
              title={fullTileAsset ? `Tile: ${fullTileAsset.name} (Part ${screenTile.subTileX ?? 0},${screenTile.subTileY ?? 0}) @ (${x},${y})` : `Empty @ (${x},${y})`}
            >
              {fullTileAsset && fullTileAsset.data && (
                <img
                  src={createTileDataURL(
                    fullTileAsset,
                    screenTile.subTileX,
                    screenTile.subTileY,
                    gridPixelSize,
                    gridPixelSize,
                    baseCellPixelWidth,
                    currentScreenMode
                  )}
                  alt={fullTileAsset.name}
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
      {/* Render Effect Zones if 'effects' layer is active */}
      {activeLayer === 'effects' && effectZones.map(zone => {
        const isSelected = zone.id === selectedEffectZoneId;
        let zoneDisplayColor = 'rgba(200, 200, 200, 0.3)'; 
        if (zone.mask > 0) {
            for (const flagKey in EFFECT_ZONE_FLAGS) {
                const flag = EFFECT_ZONE_FLAGS[flagKey as EffectZoneFlagKey];
                if (flag && (zone.mask & flag.maskValue) !== 0) {
                    zoneDisplayColor = flag.color;
                    break; 
                }
            }
        }

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
                    cursor: 'pointer',
                }}
                onClick={(e) => { e.stopPropagation(); onEffectZoneSelect(zone.id); }}
                title={`Effect Zone: ${zone.name}\nMask: 0b${zone.mask.toString(2).padStart(8,'0')} (${zone.mask})`}
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
      {currentScreenMode === "SCREEN 2 (Graphics I)" && tileBanks && tileBanks.map((bank, index) => {
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
            title={`Tile Bank Zone: ${bank.name}`}
            aria-hidden="true"
          >
             <span className="absolute -top-4 left-0 text-[0.6rem] px-1 rounded-t-sm pointer-events-none opacity-80" style={{backgroundColor: zoneColor, color: '#FFF'}}>
                {bank.name}
            </span>
          </div>
        );
      })}
       {selectionRect && (activeLayer !== 'effects') && (
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
    </div>
  );
};
