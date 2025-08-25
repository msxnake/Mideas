
import React, { useState, useEffect, useRef } from 'react';
import { 
    ProjectAsset, Sprite, Tile, ScreenMap, PixelData, MSX1ColorValue, LineColorAttribute, 
    EditorType, EntityInstance, BehaviorScript, TileBank, SpriteFrame,
    ComponentDefinition, EntityTemplate, EffectZone, EffectZoneFlagKey, ScreenEditorLayerName, ComponentPropertyDefinition, GameFlowNode, GameFlowSubMenuNode, GameFlowEndNode
} from '../../types';
import { Panel } from '../common/Panel';
import { SCREEN2_PIXELS_PER_COLOR_SEGMENT, MSX1_PALETTE_MAP, MSX1_PALETTE_IDX_MAP, EDITOR_BASE_TILE_DIM_S2, EFFECT_ZONE_FLAGS } from '../../constants'; 
import { Button } from '../common/Button'; 
import { TrashIcon, ViewfinderCircleIcon } from '../icons/MsxIcons'; 
import { AssetPickerModal } from '../modals/AssetPickerModal';


interface PixelGridPreviewProps { 
  data: PixelData; 
  className?: string;
  fixedCellSize?: number; 
}

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


interface PropertiesPanelProps {
  asset: ProjectAsset | undefined;
  entityInstance?: EntityInstance | undefined; 
  effectZone?: EffectZone | undefined; 
  gameFlowNode?: GameFlowNode | undefined;
  onUpdateEntityInstance?: (id: string, data: Partial<EntityInstance>) => void; 
  onUpdateEffectZone?: (id: string, data: Partial<EffectZone>) => void; 
  onUpdateGameFlowNode?: (id: string, data: Partial<GameFlowNode>) => void;
  onDeleteEntityInstance?: (id: string) => void;
  onDeleteEffectZone?: (id: string) => void; 
  spriteForPreview?: Sprite; 
  allAssets: ProjectAsset[];
  componentDefinitions: ComponentDefinition[]; 
  entityTemplates: EntityTemplate[];       
  currentScreenMode: string;
  activeEditorType?: EditorType; 
  screenEditorActiveLayer?: ScreenEditorLayerName; 
  msxFontName?: string; 
  msxFontStats?: { defined: number, editableTotal: number, editableDefined: number }; 
  screenEditorSelectedTileId?: string | null;
  tilesetForScreenEditor?: Tile[];
  tileBanksForScreenEditor?: TileBank[];
  waypointPickerState: { isPicking: boolean; };
  onSetWaypointPickerState: (state: { isPicking: boolean; entityInstanceId: string | null; componentDefId: string | null; waypointPrefix: 'waypoint1' | 'waypoint2'; }) => void;
}


export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
  asset, entityInstance, effectZone, gameFlowNode,
  onUpdateEntityInstance, onUpdateEffectZone, onUpdateGameFlowNode,
  onDeleteEntityInstance, onDeleteEffectZone,
  spriteForPreview, allAssets,
  componentDefinitions, entityTemplates, 
  currentScreenMode, activeEditorType, screenEditorActiveLayer, 
  msxFontName, msxFontStats,
  screenEditorSelectedTileId, tilesetForScreenEditor, tileBanksForScreenEditor,
  waypointPickerState, onSetWaypointPickerState
}) => {
  const [currentFrame, setCurrentFrame] = useState(0); 
  const [animationSpeedMs, setAnimationSpeedMs] = useState<number>(200); 
  const animationIntervalRef = useRef<number | null>(null);

  const [localEntityName, setLocalEntityName] = useState(entityInstance?.name || "");
  const [localEntityPosX, setLocalEntityPosX] = useState(entityInstance?.position.x.toString() || "0");
  const [localEntityPosY, setLocalEntityPosY] = useState(entityInstance?.position.y.toString() || "0");
  const [localComponentOverrides, setLocalComponentOverrides] = useState<Record<string, Record<string, any>>>(entityInstance?.componentOverrides || {});

  const [localEffectZoneName, setLocalEffectZoneName] = useState(effectZone?.name || "");
  const [localEffectZoneRect, setLocalEffectZoneRect] = useState(effectZone?.rect || { x: 0, y: 0, width: 4, height: 4 });
  const [localEffectZoneMask, setLocalEffectZoneMask] = useState(effectZone?.mask || 0);
  const [localEffectZoneDesc, setLocalEffectZoneDesc] = useState(effectZone?.description || "");
  
  const [assetPickerState, setAssetPickerState] = useState<{
    isOpen: boolean;
    assetTypeToPick: ProjectAsset['type'] | null;
    onSelect: ((assetId: string) => void) | null;
    currentValue: string | null;
  }>({ isOpen: false, assetTypeToPick: null, onSelect: null, currentValue: null });


  useEffect(() => {
    if (entityInstance) {
      setLocalEntityName(entityInstance.name);
      setLocalEntityPosX(entityInstance.position.x.toString());
      setLocalEntityPosY(entityInstance.position.y.toString());
      setLocalComponentOverrides(JSON.parse(JSON.stringify(entityInstance.componentOverrides || {})));
    } else {
      setLocalEntityName(""); setLocalEntityPosX("0"); setLocalEntityPosY("0"); setLocalComponentOverrides({});
    }
  }, [entityInstance]);
  
  useEffect(() => {
    if (effectZone) {
      setLocalEffectZoneName(effectZone.name);
      setLocalEffectZoneRect({ ...effectZone.rect });
      setLocalEffectZoneMask(effectZone.mask);
      setLocalEffectZoneDesc(effectZone.description || "");
    } else {
      setLocalEffectZoneName(""); setLocalEffectZoneRect({ x: 0, y: 0, width: 4, height: 4 }); setLocalEffectZoneMask(0); setLocalEffectZoneDesc("");
    }
  }, [effectZone]);

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

  const handleDeleteEntityClick = () => { if (entityInstance && onDeleteEntityInstance) { onDeleteEntityInstance(entityInstance.id); }};

  const handleEffectZoneNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!effectZone || !onUpdateEffectZone) return;
    setLocalEffectZoneName(e.target.value);
    onUpdateEffectZone(effectZone.id, { name: e.target.value });
  };
  const handleEffectZoneRectChange = (field: keyof EffectZone['rect'], value: string) => {
    if (!effectZone || !onUpdateEffectZone) return;
    const numValue = parseInt(value, 10) || 0;
    const newRect = { ...localEffectZoneRect, [field]: numValue };
    setLocalEffectZoneRect(newRect);
    onUpdateEffectZone(effectZone.id, { rect: newRect });
  };
  const handleEffectZoneMaskToggle = (flagKey: EffectZoneFlagKey) => {
    if (!effectZone || !onUpdateEffectZone) return;
    const flag = EFFECT_ZONE_FLAGS[flagKey];
    const newMask = localEffectZoneMask ^ flag.maskValue;
    setLocalEffectZoneMask(newMask);
    onUpdateEffectZone(effectZone.id, { mask: newMask });
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
            const bank = tileBanksForScreenEditor.find(b => (b.enabled ?? true) && b.assignedTiles[selectedTileAsset.id]);
            if (bank) {
                const baseCharCode = bank.assignedTiles[selectedTileAsset.id].charCode;
                const numCharsX = Math.ceil(selectedTileAsset.width / EDITOR_BASE_TILE_DIM_S2);
                const numCharsY = Math.ceil(selectedTileAsset.height / EDITOR_BASE_TILE_DIM_S2);
                const codes = [];
                for (let y = 0; y < numCharsY; y++) {
                    for (let x = 0; x < numCharsX; x++) {
                        codes.push(baseCharCode + (y * numCharsX) + x);
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

  const renderAssetProperties = (): React.ReactNode => { 
    if (!asset) return <p className="text-msx-textsecondary">No asset selected.</p>;
    switch (asset.type) {
      case 'tile': const tile = asset.data as Tile; return ( <div className="space-y-1"> <div><strong className="text-msx-highlight">Name:</strong> {tile.name}</div> <div><strong className="text-msx-highlight">Size:</strong> {tile.width}x{tile.height} px</div> <div><strong className="text-msx-highlight">MapID:</strong> {tile.logicalProperties.mapId} (Family: {tile.logicalProperties.familyId}, Inst: {tile.logicalProperties.instanceId})</div> {tile.lineAttributes && currentScreenMode === "SCREEN 2 (Graphics I)" && <LineAttributesPreview lineAttributes={tile.lineAttributes} tileWidth={tile.width} tileHeight={tile.height} />} <PixelGridPreview data={tile.data} className="mt-1" /> </div> );
      case 'sprite': const sprite = asset.data as Sprite; return ( <div className="space-y-1"> <div><strong className="text-msx-highlight">Name:</strong> {sprite.name}</div> <div><strong className="text-msx-highlight">Size:</strong> {sprite.size.width}x{sprite.size.height} px</div> <div><strong className="text-msx-highlight">Frames:</strong> {sprite.frames.length}</div> {sprite.frames[currentFrame] && <PixelGridPreview data={sprite.frames[currentFrame].data} className="mt-1"/>} <label className="text-xs">Anim Speed (ms): <input type="number" value={animationSpeedMs} onChange={e => setAnimationSpeedMs(parseInt(e.target.value))} min="50" max="2000" step="50" className="w-16 p-0.5 bg-msx-bgcolor border-msx-border rounded"/></label> </div> );
      case 'screenmap': const map = asset.data as ScreenMap; return ( <div className="space-y-1"> <div><strong className="text-msx-highlight">Name:</strong> {map.name}</div> <div><strong className="text-msx-highlight">Size:</strong> {map.width}x{map.height} cells</div> <div><strong className="text-msx-highlight">Entities:</strong> {map.layers.entities.length}</div> <div><strong className="text-msx-highlight">Effect Zones:</strong> {map.effectZones?.length || 0}</div> </div> );
      case 'code': case 'behavior': const codeData = typeof asset.data === 'string' ? asset.data : (asset.data as BehaviorScript)?.code; return ( <div className="space-y-1"> <div><strong className="text-msx-highlight">Name:</strong> {asset.name}</div> <div className="text-xs text-msx-textsecondary truncate" title={codeData}>Content: {codeData?.substring(0, 50)}...</div> </div> );
      default: return <p className="text-msx-textsecondary">Properties for {asset.type} not yet implemented.</p>;
    }
  };
  
  const renderEntityInstanceProperties = (): React.ReactNode => {
    if (!entityInstance || !onUpdateEntityInstance) return null;
    const template = entityTemplates.find(t => t.id === entityInstance.entityTemplateId);
    if (!template) return <p className="text-red-500">Error: Entity template not found!</p>;
  
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
        <p className="text-xs text-msx-textsecondary">Based on Template: <strong className="text-msx-cyan">{template.name}</strong></p>
        
        <div className="max-h-72 overflow-y-auto pr-1 space-y-2 border-t border-msx-border/30 pt-2 mt-2">
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
                <div key={componentDef.id} className="p-1.5 border border-msx-border/50 rounded bg-msx-bgcolor/30">
                  <h5 className="text-xs text-msx-highlight mb-1">{componentDef.name}</h5>
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
                </div>
              );
            }


            return (
                <div key={componentDef.id} className="p-1.5 border border-msx-border/50 rounded bg-msx-bgcolor/30">
                <h5 className="text-xs text-msx-highlight mb-1">{componentDef.name}</h5>
                {componentDef.properties.map(propDef => {
                    const overrideValue = localComponentOverrides[componentDef.id]?.[propDef.name];
                    const templateDefaultValue = templateComponent.defaultValues[propDef.name];
                    const definitionDefaultValue = propDef.defaultValue;
                    const currentValue = overrideValue !== undefined ? overrideValue : (templateDefaultValue !== undefined ? templateDefaultValue : definitionDefaultValue);
                    
                    const inputId = `override-${entityInstance.id}-${componentDef.id}-${propDef.name}`;
                    const isRefType = propDef.type.endsWith('_ref');

                    return (
                        <div key={propDef.name} className="mb-1">
                            <label htmlFor={inputId} className="block text-[0.65rem] text-msx-textsecondary mb-0.5">
                                {propDef.name} ({propDef.type}): <span className="italic">(Def: {String(definitionDefaultValue)})</span>
                            </label>
                            {isRefType ? (
                                <div className="flex items-center space-x-1">
                                    <span className="p-1 text-xs bg-msx-bgcolor border border-msx-border/30 rounded flex-grow truncate" title={currentValue || "None"}>
                                        {allAssets.find(a => a.id === currentValue)?.name || "None"}
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
                </div>
            );
            })}
        </div>
        <Button onClick={handleDeleteEntityClick} variant="danger" size="sm" icon={<TrashIcon />} className="w-full mt-2">Delete Entity Instance</Button>
      </div>
    );
  };

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
            <input id="ezW" type="number" value={localEffectZoneRect.width} min="1" onChange={e => handleEffectZoneRectChange('width', e.target.value)} className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded" />
          </div>
          <div>
            <label htmlFor="ezH" className="block text-xs text-msx-textsecondary mb-0.5">Height (cells):</label>
            <input id="ezH" type="number" value={localEffectZoneRect.height} min="1" onChange={e => handleEffectZoneRectChange('height', e.target.value)} className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-msx-textsecondary mb-1">Effect Mask (0b{localEffectZoneMask.toString(2).padStart(8, '0')} = {localEffectZoneMask}):</label>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {Object.entries(EFFECT_ZONE_FLAGS).map(([key, flag]) => (
              <label key={key} className="flex items-center space-x-1.5 cursor-pointer p-0.5 hover:bg-msx-border rounded">
                <input
                  type="checkbox"
                  checked={(localEffectZoneMask & flag.maskValue) !== 0}
                  onChange={() => handleEffectZoneMaskToggle(key as EffectZoneFlagKey)}
                  className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent"
                />
                <span className="text-msx-textsecondary truncate" title={flag.label}>{flag.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="ezDesc" className="block text-xs text-msx-textsecondary mb-0.5">Description:</label>
          <textarea id="ezDesc" value={localEffectZoneDesc} onChange={handleEffectZoneDescChange} rows={2} className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded" />
        </div>
        <Button onClick={handleDeleteEffectZoneClick} variant="danger" size="sm" icon={<TrashIcon />} className="w-full mt-2">Delete Effect Zone</Button>
      </div>
    );
  };

  const compDefExists = (id: string, template: EntityTemplate) => template.components.some(c => c.definitionId === id);
  
  let panelTitle = "Properties";
  if (gameFlowNode && activeEditorType === EditorType.GameFlow) panelTitle = "Game Flow Node Properties";
  else if (entityInstance && activeEditorType === EditorType.Screen && screenEditorActiveLayer === 'entities') panelTitle = "Entity Instance Properties";
  else if (effectZone && activeEditorType === EditorType.Screen && screenEditorActiveLayer === 'effects') panelTitle = "Effect Zone Properties";
  else if (asset && activeEditorType !== EditorType.BehaviorEditor && activeEditorType !== EditorType.Font && activeEditorType !== EditorType.HelpDocs && activeEditorType !== EditorType.ComponentDefinitionEditor && activeEditorType !== EditorType.EntityTemplateEditor) panelTitle = "Asset Properties";

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
                <div key={option.id} className="flex items-center space-x-1">
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
              ))}
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="mt-2 w-full"
              onClick={() => {
                const newOption = { id: `opt_${Date.now()}`, text: 'New Option' };
                onUpdateGameFlowNode(node.id, { options: [...node.options, newOption] });
              }}
            >
              Add Option
            </Button>
          </div>
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
    return <p className="text-msx-textsecondary">Selected node type: {gameFlowNode.type}</p>;
  };

  return (
    <>
    <Panel title={panelTitle} className="text-xs">
      <div className="space-y-1 p-2">
        {gameFlowNode && activeEditorType === EditorType.GameFlow
          ? renderGameFlowNodeProperties()
          : entityInstance && activeEditorType === EditorType.Screen && screenEditorActiveLayer === 'entities'
            ? renderEntityInstanceProperties()
            : effectZone && activeEditorType === EditorType.Screen && screenEditorActiveLayer === 'effects'
              ? renderEffectZoneProperties()
              : (asset && (activeEditorType === EditorType.Tile || activeEditorType === EditorType.Sprite || activeEditorType === EditorType.Screen || activeEditorType === EditorType.Code || activeEditorType === EditorType.BehaviorEditor || activeEditorType === EditorType.ComponentDefinitionEditor || activeEditorType === EditorType.EntityTemplateEditor ))
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
          allAssets={allAssets}
          currentSelectedId={assetPickerState.currentValue}
      />
    )}
    </>
  );
};
