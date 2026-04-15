
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    ProjectAsset, Sprite, Tile, ScreenMap, PixelData, MSX1ColorValue, LineColorAttribute,
    EditorType, EntityInstance, BehaviorScript, TileBank, SpriteFrame,
    ComponentDefinition, EntityTemplate, EffectZone, ScreenEditorLayerName, ComponentPropertyDefinition, GameFlowNode, GameFlowSubMenuNode, GameFlowEndNode, GameFlowStartNode, EFFECT_ZONE_TYPE_CONFIG, EffectType, WindEffectDirection, normalizeEffectZoneParams, resolveEffectZoneType
} from '../../types';
import { Panel } from '../common/Panel';
import { SCREEN2_PIXELS_PER_COLOR_SEGMENT, MSX1_PALETTE_MAP, MSX1_PALETTE_IDX_MAP, EDITOR_BASE_TILE_DIM_S2 } from '../../constants';
import { Button } from '../common/Button';
import { TrashIcon, ViewfinderCircleIcon } from '../icons/MsxIcons';
import { AssetPickerModal } from '../modals/AssetPickerModal';
import { StartNodeEditor } from '../editors/StartNodeEditor';
import { GameFlowGlobalInitializationEditor } from '../editors/GameFlowGlobalInitializationEditor';

const CHILD_LINK_COMPONENT_ID = 'comp_child_link';
const ENTITY_JOB_RATE_OPTIONS = [100, 50, 33, 25] as const;

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
  onUpdateAsset
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

  const [localEffectZoneName, setLocalEffectZoneName] = useState(effectZone?.name || "");
  const [localEffectZoneRect, setLocalEffectZoneRect] = useState(effectZone?.rect || { x: 0, y: 0, width: 4, height: 4 });
  const [localEffectZoneType, setLocalEffectZoneType] = useState<EffectType>(effectZone ? resolveEffectZoneType(effectZone) : 'secretZone');
  const [localEffectZoneParams, setLocalEffectZoneParams] = useState<Record<string, any>>(
    effectZone ? normalizeEffectZoneParams(resolveEffectZoneType(effectZone), effectZone.params) : {}
  );
  const [localEffectZoneDesc, setLocalEffectZoneDesc] = useState(effectZone?.description || "");
  
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
        return (
          <div className="space-y-1">
            <div><strong className="text-msx-highlight">Name:</strong> {sprite.name}</div>
            <div><strong className="text-msx-highlight">Size:</strong> {sprite.size.width}x{sprite.size.height} px</div>
            <div><strong className="text-msx-highlight">Frames:</strong> {sprite.frames.length}</div>
            {sprite.frames[currentFrame] && <PixelGridPreview data={sprite.frames[currentFrame].data} className="mt-1"/>}
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
      case 'screenmap': const map = asset.data as ScreenMap; return ( <div className="space-y-1"> <div><strong className="text-msx-highlight">Name:</strong> {map.name}</div> <div><strong className="text-msx-highlight">Size:</strong> {map.width}x{map.height} cells</div> <div><strong className="text-msx-highlight">Entities:</strong> {map.layers.entities.length}</div> <div><strong className="text-msx-highlight">Effect Zones:</strong> {map.effectZones?.length || 0}</div> </div> );
      case 'code': case 'behavior': const codeData = typeof asset.data === 'string' ? asset.data : (asset.data as BehaviorScript)?.code; return ( <div className="space-y-1"> <div><strong className="text-msx-highlight">Name:</strong> {asset.name}</div> <div className="text-xs text-msx-textsecondary truncate" title={codeData}>Content: {codeData?.substring(0, 50)}...</div> </div> );
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
                <div key={componentDef.id} className="p-1.5 border border-msx-border/50 rounded bg-msx-bgcolor/30">
                <h5 className="text-xs text-msx-highlight mb-1">{componentDef.name}</h5>
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
                </div>
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
  
  let panelTitle = "Properties";
  if (gameFlowNode && activeEditorType === EditorType.GameFlow) panelTitle = "Game Flow Node Properties";
  else if (entityInstance && activeEditorType === EditorType.Screen && screenEditorActiveLayer === 'entities') panelTitle = "Entity Instance Properties";
  else if (effectZone && activeEditorType === EditorType.Screen) panelTitle = "Effect Zone Properties";
  else if (asset && activeEditorType !== EditorType.BehaviorEditor && activeEditorType !== EditorType.Font && activeEditorType !== EditorType.HelpDocs && activeEditorType !== EditorType.ComponentDefinitionEditor && activeEditorType !== EditorType.EntityTemplateEditor) panelTitle = "Asset Properties";

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
    >
      <div className="space-y-1 p-2 flex-1 overflow-y-auto min-h-0">
          {gameFlowNode && activeEditorType === EditorType.GameFlow
            ? renderGameFlowNodeProperties()
            : entityInstance && activeEditorType === EditorType.Screen && screenEditorActiveLayer === 'entities'
              ? renderEntityInstanceProperties()
            : effectZone && activeEditorType === EditorType.Screen
              ? renderEffectZoneProperties()
              : (asset && (activeEditorType === EditorType.Tile || activeEditorType === EditorType.Sprite || activeEditorType === EditorType.Screen || activeEditorType === EditorType.Code || activeEditorType === EditorType.BehaviorEditor || activeEditorType === EditorType.ComponentDefinitionEditor || activeEditorType === EditorType.EntityTemplateEditor || activeEditorType === EditorType.GlobalVariables ))
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
          allAssets={assetsWithEntityTemplates}
          currentSelectedId={assetPickerState.currentValue}
      />
    )}
    </div>
  );
};
