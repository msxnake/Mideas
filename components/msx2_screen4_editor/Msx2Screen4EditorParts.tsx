import React, { useEffect, useRef, useState } from 'react';
import { MSXColorValue, Msx2EntityKind, Msx2Screen4EntityInstance, Msx2Screen4Layers, Msx2Screen4Runtime, Msx2Screen4Tile, ProjectAsset, Screen5PaletteSlot } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { AssetPickerModal } from '../modals/AssetPickerModal';
import {
  DEFAULT_MSX2_ENTITY_CREATE_PRESETS,
  MSX2_COMPONENT_REPERTOIRE,
  MSX2_ENTITY_KIND_OPTIONS,
  MSX2_ENTITY_MOVEMENT_OPTIONS,
  MSX2_ENTITY_REPERTOIRE,
  Msx2EntityCreatePreset,
} from './msx2EntityCatalog';
import { normalizeMsx2ShooterRuntimeConfig, MSX2_SHOOTER_IRQ_PROFILES_60HZ, buildMsx2Shooter60HzFrameBudgetSummary, validateMsx2Shooter60HzBudget, resolveMsx2ShooterScrollRowRoutine } from '../../utils/msx2ShooterRuntime';
import { Msx2Shooter60HzFrameBudgetView } from './Msx2Shooter60HzFrameBudgetView';

export type Msx2Screen4EditMode = 'visual' | 'collision' | 'effects' | 'behavior' | 'entities' | 'tile';
export type Msx2Screen4TilePaintTool = 'pencil' | 'erase' | 'fill' | 'pick';
export type Msx2Screen4CompositionOverlay = 'off' | 'reuse2x2' | 'reuse4x4' | 'copy8x8' | 'props16x16' | 'hudBands';

export const SCREEN_WIDTH = 256;
export const SCREEN_HEIGHT = 192;
export const TILE_SIZE = 16;
export const MAP_WIDTH = 16;
export const MAP_HEIGHT = 12;
export const MAP_PIXEL_WIDTH = MAP_WIDTH * TILE_SIZE;
export const MAP_PIXEL_HEIGHT = MAP_HEIGHT * TILE_SIZE;
export const TRANSPARENT_HEX = 'rgba(0,0,0,0)';

const getTilePixelWidth = (tile: Msx2Screen4Tile | undefined): number =>
  Math.max(8, Math.min(32, Number(tile?.width ?? tile?.pixels?.[0]?.length ?? TILE_SIZE) || TILE_SIZE));

const getTilePixelHeight = (tile: Msx2Screen4Tile | undefined): number =>
  Math.max(8, Math.min(32, Number(tile?.height ?? tile?.pixels?.length ?? TILE_SIZE) || TILE_SIZE));

export interface Msx2Screen4CellAction {
  x: number;
  y: number;
  button: number;
}

export interface Msx2Screen4SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export {
  DEFAULT_MSX2_ENTITY_CREATE_PRESETS,
  MSX2_ENTITY_KIND_OPTIONS,
  MSX2_ENTITY_MOVEMENT_OPTIONS,
  MSX2_ENTITY_REPERTOIRE,
  type Msx2EntityCreatePreset,
};

interface Msx2Screen4ToolbarProps {
  screenName: string;
  onScreenNameChange: (name: string) => void;
  mode: Msx2Screen4EditMode;
  onModeChange: (mode: Msx2Screen4EditMode) => void;
  selectedEffectCode: number;
  onSelectedEffectCodeChange: (code: number) => void;
  selectedBehaviorCode: number;
  onSelectedBehaviorCodeChange: (code: number) => void;
  showGrid: boolean;
  onShowGridChange: (showGrid: boolean) => void;
  showRuntimeOverlays: boolean;
  onShowRuntimeOverlaysChange: (showRuntimeOverlays: boolean) => void;
  compositionOverlay: Msx2Screen4CompositionOverlay;
  onCompositionOverlayChange: (overlay: Msx2Screen4CompositionOverlay) => void;
  runtime: Msx2Screen4Runtime;
  onRuntimeChange: (runtime: Msx2Screen4Runtime) => void;
  canCopyLayer: boolean;
  canPasteLayer: boolean;
  onCopyLayer: () => void;
  onPasteLayer: () => void;
}

export const Msx2Screen4Toolbar: React.FC<Msx2Screen4ToolbarProps> = ({
  screenName,
  onScreenNameChange,
  mode,
  onModeChange,
  selectedEffectCode,
  onSelectedEffectCodeChange,
  selectedBehaviorCode,
  onSelectedBehaviorCodeChange,
  showGrid,
  onShowGridChange,
  showRuntimeOverlays,
  onShowRuntimeOverlaysChange,
  compositionOverlay,
  onCompositionOverlayChange,
  runtime,
  onRuntimeChange,
  canCopyLayer,
  canPasteLayer,
  onCopyLayer,
  onPasteLayer,
}) => {
  const numberInputClass = 'w-full px-2 py-1 bg-msx-panelbg border border-msx-border rounded';
  const updateRuntimeArea = (patch: Partial<Msx2Screen4Runtime>) => {
    const next = { ...runtime, ...patch };
    const x = Math.max(0, Math.min(MAP_WIDTH - 1, Number(next.activeAreaX) || 0));
    const y = Math.max(0, Math.min(MAP_HEIGHT - 1, Number(next.activeAreaY) || 0));
    const width = Math.max(1, Math.min(MAP_WIDTH - x, Number(next.activeAreaWidth) || MAP_WIDTH - x));
    const height = Math.max(1, Math.min(MAP_HEIGHT - y, Number(next.activeAreaHeight) || MAP_HEIGHT - y));
    onRuntimeChange({ ...next, activeAreaX: x, activeAreaY: y, activeAreaWidth: width, activeAreaHeight: height });
  };
  const setRuntimeMode = (mode: string) => {
    if (mode === 'maze') {
      updateRuntimeArea({ screenKind: 'playable', screenEngine: 'maze', movementMode: 'maze', movementModel: 'maze' });
      return;
    }
    if (mode === 'shooterHorizontal' || mode === 'shooterVertical') {
      updateRuntimeArea({
        screenKind: 'playable',
        screenEngine: 'shooter',
        movementMode: mode,
        movementModel: mode,
        initialAir: 0,
        disableAirTimer: true,
        airTimer: false,
        shooter: normalizeMsx2ShooterRuntimeConfig({
          ...runtime.shooter,
          direction: mode === 'shooterHorizontal' ? 'horizontal' : 'vertical',
          scrollMode: mode === 'shooterHorizontal' ? 'none' : 'tileVertical',
        }),
      });
      return;
    }
    updateRuntimeArea({ screenKind: 'playable', screenEngine: 'player', movementMode: 'platform', movementModel: 'platform' });
  };
  const updateShooterConfig = (patch: Partial<NonNullable<Msx2Screen4Runtime['shooter']>>) => {
    updateRuntimeArea({
      screenEngine: 'shooter',
      movementMode: runtime.movementMode === 'shooterHorizontal' ? 'shooterHorizontal' : 'shooterVertical',
      movementModel: runtime.movementMode === 'shooterHorizontal' ? 'shooterHorizontal' : 'shooterVertical',
      shooter: normalizeMsx2ShooterRuntimeConfig({ ...(runtime.shooter || {}), ...patch }),
    });
  };
  const updateShooterBudget = (patch: Partial<NonNullable<Msx2Screen4Runtime['shooter']>['budget']>) => {
    updateShooterConfig({
      budget: {
        ...normalizeMsx2ShooterRuntimeConfig(runtime.shooter).budget,
        ...patch,
      },
    });
  };
  const runtimeMode = runtime.screenEngine === 'maze'
    ? 'maze'
    : runtime.screenEngine === 'shooter'
      ? runtime.movementMode === 'shooterHorizontal' ? 'shooterHorizontal' : 'shooterVertical'
      : 'platform';
  const shooterConfig = normalizeMsx2ShooterRuntimeConfig(runtime.shooter);
  const activeIrqProfile = MSX2_SHOOTER_IRQ_PROFILES_60HZ.find(profile => profile.id === shooterConfig.budget.activeIrqProfile);
  const shooterValidation = validateMsx2Shooter60HzBudget(shooterConfig);
  const shooterFrameBudget = runtime.screenEngine === 'shooter'
    ? buildMsx2Shooter60HzFrameBudgetSummary(shooterConfig, {
      scrollRowRoutine: resolveMsx2ShooterScrollRowRoutine(shooterConfig, {
        movementMode: runtime.movementMode || runtime.movementModel,
      }),
    })
    : null;
  const layerButton = (layer: Msx2Screen4EditMode, label: string) => (
    <Button size="sm" variant={mode === layer ? 'primary' : 'secondary'} onClick={() => onModeChange(layer)}>
      {label}
    </Button>
  );

  return (
    <Panel title="MSX2 Screen" collapsible>
      <div className="p-2 space-y-2 text-xs">
        <input
          value={screenName}
          onChange={event => onScreenNameChange(event.target.value)}
          className="w-full px-2 py-1 bg-msx-panelbg border border-msx-border rounded"
          aria-label="MSX2 screen name"
        />
        <div className="grid grid-cols-2 gap-2">
          {layerButton('visual', 'Visual')}
          {layerButton('tile', 'Tile')}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {layerButton('collision', 'Collision')}
          {layerButton('effects', 'Effects')}
          {layerButton('behavior', 'Behavior')}
        </div>
        <div className="grid grid-cols-1 gap-2">
          {layerButton('entities', 'Entities')}
        </div>
        {mode === 'effects' && (
          <div className="space-y-1">
            <div className="text-msx-textsecondary">Effect code</div>
            <select
              value={selectedEffectCode}
              onChange={event => onSelectedEffectCodeChange(Number(event.target.value))}
              className="w-full px-2 py-1 bg-msx-panelbg border border-msx-border rounded"
              aria-label="MSX2 effect code"
            >
              <option value={1}>1 Hazard</option>
              <option value={2}>2 Exit</option>
              <option value={3}>3 Collectible</option>
            </select>
          </div>
        )}
        {mode === 'behavior' && (
          <div className="space-y-1">
            <div className="text-msx-textsecondary">Behavior code</div>
            <select
              value={selectedBehaviorCode}
              onChange={event => onSelectedBehaviorCodeChange(Number(event.target.value))}
              className="w-full px-2 py-1 bg-msx-panelbg border border-msx-border rounded"
              aria-label="MSX2 behavior code"
            >
              <option value={1}>1 Ladder</option>
              <option value={2}>2 Conveyor right</option>
              <option value={3}>3 Conveyor left</option>
              <option value={4}>4 Rope</option>
            </select>
          </div>
        )}
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showGrid} onChange={event => onShowGridChange(event.target.checked)} />
          Tile grid
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showRuntimeOverlays} onChange={event => onShowRuntimeOverlaysChange(event.target.checked)} />
          Runtime overlays
        </label>
        <label className="block space-y-1">
          <span className="text-msx-textsecondary">MSX2 overlay</span>
          <select
            value={compositionOverlay}
            onChange={event => onCompositionOverlayChange(event.target.value as Msx2Screen4CompositionOverlay)}
            className="w-full px-2 py-1 bg-msx-panelbg border border-msx-border rounded"
            aria-label="MSX2 composition overlay"
          >
            <option value="off">Off</option>
            <option value="reuse2x2">2x2 reuse</option>
            <option value="reuse4x4">4x4 reuse</option>
            <option value="copy8x8">8x8 copy grid</option>
            <option value="props16x16">16x16 candidate props</option>
            <option value="hudBands">HUD/static bands</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="secondary" onClick={onCopyLayer} disabled={!canCopyLayer}>Copy Layer</Button>
          <Button size="sm" variant="secondary" onClick={onPasteLayer} disabled={!canPasteLayer}>Paste Layer</Button>
        </div>
        <div className="text-msx-textsecondary">
          16x12 visual anchors. Tiles are projected to SCREEN 4 pattern/color/name tables at 256x192.
        </div>
        <div className="text-msx-textsecondary">
          Runtime: {runtime.screenKind} / {runtime.screenEngine}
        </div>
        <label className="block space-y-1">
          <span className="text-msx-textsecondary">Runtime mode</span>
          <select
            value={runtimeMode}
            onChange={event => setRuntimeMode(event.target.value)}
            className="w-full px-2 py-1 bg-msx-panelbg border border-msx-border rounded"
            aria-label="MSX2 runtime mode"
          >
            <option value="platform">Player platform</option>
            <option value="maze">Maze</option>
            <option value="shooterVertical">Shooter vertical 60Hz</option>
            <option value="shooterHorizontal">Shooter horizontal</option>
          </select>
        </label>
        {runtime.screenEngine === 'shooter' && (
          <div className="space-y-2 rounded border border-msx-border/70 p-2">
            <div className="text-msx-highlight">Shooter 60Hz budget</div>
            <div className="grid grid-cols-2 gap-2">
              <label className="block space-y-1">
                <span className="text-msx-textsecondary">Scroll</span>
                <select
                  value={shooterConfig.scrollMode}
                  onChange={event => updateShooterConfig({ scrollMode: event.target.value as any })}
                  className={numberInputClass}
                  aria-label="MSX2 shooter scroll mode"
                >
                  <option value="none">None</option>
                  <option value="tileVertical">Tile vertical</option>
                  <option value="spaceLoop">Space loop</option>
                  <option value="bossStatic">Boss static</option>
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-msx-textsecondary">IRQ profile</span>
                <select
                  value={shooterConfig.budget.activeIrqProfile}
                  onChange={event => updateShooterBudget({ activeIrqProfile: event.target.value as any })}
                  className={numberInputClass}
                  aria-label="MSX2 shooter IRQ profile"
                >
                  {MSX2_SHOOTER_IRQ_PROFILES_60HZ.map(profile => (
                    <option key={profile.id} value={profile.id}>{profile.id}</option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-msx-textsecondary">Enemies</span>
                <input type="number" min={1} max={12} value={shooterConfig.budget.maxEnemies} onChange={event => updateShooterBudget({ maxEnemies: Number(event.target.value) || 1 })} className={numberInputClass} aria-label="MSX2 shooter max enemies" />
              </label>
              <label className="block space-y-1">
                <span className="text-msx-textsecondary">Enemy shots</span>
                <input type="number" min={1} max={20} value={shooterConfig.budget.maxEnemyShots} onChange={event => updateShooterBudget({ maxEnemyShots: Number(event.target.value) || 1 })} className={numberInputClass} aria-label="MSX2 shooter max enemy shots" />
              </label>
            </div>
            <Msx2Shooter60HzFrameBudgetView
              frameBudget={shooterFrameBudget}
              validation={shooterValidation}
            />
            <div className="text-msx-textsecondary">
              IRQ tasks: {activeIrqProfile?.tasks.join(', ') || 'unknown'}
            </div>
          </div>
        )}
        <label className="block space-y-1">
          <span className="text-msx-textsecondary">Required collectibles</span>
          <input
            type="number"
            min={0}
            max={255}
            value={runtime.requiredCollectibles ?? 0}
            onChange={event => updateRuntimeArea({
              ...runtime,
              requiredCollectibles: Math.max(0, Math.min(255, Number(event.target.value) || 0)),
            })}
            className={numberInputClass}
            aria-label="MSX2 required collectibles"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-msx-textsecondary">Initial air</span>
          <input
            type="number"
            min={1}
            max={255}
            value={runtime.initialAir ?? 255}
            onChange={event => updateRuntimeArea({
              ...runtime,
              initialAir: Math.max(1, Math.min(255, Number(event.target.value) || 255)),
            })}
            className={numberInputClass}
            aria-label="MSX2 initial air"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block space-y-1">
            <span className="text-msx-textsecondary">Active X</span>
            <input type="number" min={0} max={MAP_WIDTH - 1} value={runtime.activeAreaX} onChange={event => updateRuntimeArea({ activeAreaX: Math.max(0, Math.min(MAP_WIDTH - 1, Number(event.target.value) || 0)) })} className={numberInputClass} aria-label="MSX2 active area X" />
          </label>
          <label className="block space-y-1">
            <span className="text-msx-textsecondary">Active Y</span>
            <input type="number" min={0} max={MAP_HEIGHT - 1} value={runtime.activeAreaY} onChange={event => updateRuntimeArea({ activeAreaY: Math.max(0, Math.min(MAP_HEIGHT - 1, Number(event.target.value) || 0)) })} className={numberInputClass} aria-label="MSX2 active area Y" />
          </label>
          <label className="block space-y-1">
            <span className="text-msx-textsecondary">Active W</span>
            <input type="number" min={1} max={MAP_WIDTH - runtime.activeAreaX} value={runtime.activeAreaWidth} onChange={event => updateRuntimeArea({ activeAreaWidth: Math.max(1, Math.min(MAP_WIDTH - runtime.activeAreaX, Number(event.target.value) || MAP_WIDTH - runtime.activeAreaX)) })} className={numberInputClass} aria-label="MSX2 active area width" />
          </label>
          <label className="block space-y-1">
            <span className="text-msx-textsecondary">Active H</span>
            <input type="number" min={1} max={MAP_HEIGHT - runtime.activeAreaY} value={runtime.activeAreaHeight} onChange={event => updateRuntimeArea({ activeAreaHeight: Math.max(1, Math.min(MAP_HEIGHT - runtime.activeAreaY, Number(event.target.value) || MAP_HEIGHT - runtime.activeAreaY)) })} className={numberInputClass} aria-label="MSX2 active area height" />
          </label>
        </div>
      </div>
    </Panel>
  );
};

interface Msx2Screen4SelectionPanelProps {
  selectionMode: boolean;
  onSelectionModeChange: (selectionMode: boolean) => void;
  selectionRect: Msx2Screen4SelectionRect | null;
  canEditSelection: boolean;
  canCopySelection: boolean;
  canPasteSelection: boolean;
  onClearSelectionRect: () => void;
  onFillSelection: () => void;
  onClearSelection: () => void;
  onCopySelection: () => void;
  onPasteSelection: () => void;
}

export const Msx2Screen4SelectionPanel: React.FC<Msx2Screen4SelectionPanelProps> = ({
  selectionMode,
  onSelectionModeChange,
  selectionRect,
  canEditSelection,
  canCopySelection,
  canPasteSelection,
  onClearSelectionRect,
  onFillSelection,
  onClearSelection,
  onCopySelection,
  onPasteSelection,
}) => (
  <Panel title="MSX2 Selection Tools" collapsible>
    <div className="p-2 space-y-2 text-xs">
      <Button
        size="sm"
        variant={selectionMode ? 'primary' : 'secondary'}
        onClick={() => onSelectionModeChange(!selectionMode)}
        className="w-full"
      >
        MSX2 Select Area
      </Button>
      <div className="text-msx-textsecondary">
        MSX2 Selection: {selectionRect ? `${selectionRect.width}x${selectionRect.height} @ ${selectionRect.x},${selectionRect.y}` : 'None'}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" variant="secondary" onClick={onFillSelection} disabled={!canEditSelection}>MSX2 Fill</Button>
        <Button size="sm" variant="danger" onClick={onClearSelection} disabled={!canEditSelection}>MSX2 Clear</Button>
        <Button size="sm" variant="secondary" onClick={onCopySelection} disabled={!canCopySelection}>MSX2 Copy Sel.</Button>
        <Button size="sm" variant="secondary" onClick={onPasteSelection} disabled={!canPasteSelection}>MSX2 Paste Sel.</Button>
      </div>
      <Button size="sm" variant="ghost" onClick={onClearSelectionRect} disabled={!selectionRect} className="w-full">
        MSX2 Unselect Area
      </Button>
    </div>
  </Panel>
);

interface Msx2Screen4EntityPanelProps {
  mode: Msx2Screen4EditMode;
  selectedEntity: Msx2Screen4EntityInstance | null;
  allAssets: ProjectAsset[];
  onUpdateSelectedEntity: (patch: Partial<Msx2Screen4EntityInstance>) => void;
  onUpdateSelectedEntityParams: (patch: Record<string, any>) => void;
  onRemoveSelectedEntity: () => void;
}

const summarizeMsx2Component = (values: Record<string, any> | undefined): string => {
  if (!values) return '';
  return Object.entries(values)
    .filter(([, value]) => value !== '' && value !== undefined && value !== false)
    .slice(0, 4)
    .map(([key, value]) => `${key}:${String(value)}`)
    .join(' ');
};

const getMsx2RenderSpriteId = (entity: Msx2Screen4EntityInstance | null): string =>
  String(entity?.components?.msx2_hardware_sprite?.msx2SpriteAssetId || entity?.spriteAssetId || '');

const getMsx2RenderSpriteName = (assets: ProjectAsset[], spriteAssetId: string): string => {
  if (!spriteAssetId) return 'None';
  return assets.find(asset => asset.type === 'msx2sprite' && asset.id === spriteAssetId)?.name || spriteAssetId;
};

export const Msx2Screen4EntityPanel: React.FC<Msx2Screen4EntityPanelProps> = ({
  mode,
  selectedEntity,
  allAssets,
  onUpdateSelectedEntity,
  onUpdateSelectedEntityParams,
  onRemoveSelectedEntity,
}) => {
  const [isRenderPickerOpen, setIsRenderPickerOpen] = useState(false);
  if (mode !== 'entities') return null;
  const numberInputClass = 'w-full px-2 py-1 bg-msx-panelbg border border-msx-border rounded';
  const renderSpriteAssetId = getMsx2RenderSpriteId(selectedEntity);
  const patchSelectedComponent = (
    componentId: string,
    componentPatch: Record<string, any>,
    paramsPatch?: Record<string, any>
  ) => {
    if (!selectedEntity) return;
    const patch: Partial<Msx2Screen4EntityInstance> = {
      components: {
        ...(selectedEntity.components || {}),
        [componentId]: {
          ...(selectedEntity.components?.[componentId] || {}),
          ...componentPatch,
        },
      },
    };
    if (paramsPatch) {
      patch.params = {
        ...(selectedEntity.params || {}),
        ...paramsPatch,
      };
    }
    onUpdateSelectedEntity(patch);
  };

  return (
    <Panel title="Entity Properties" collapsible>
      <div className="p-2 space-y-2 text-xs">
        {selectedEntity ? (
          <>
            <input
              value={selectedEntity.name}
              onChange={event => onUpdateSelectedEntity({ name: event.target.value })}
              className={numberInputClass}
              aria-label="Entity name"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedEntity.kind}
                onChange={event => onUpdateSelectedEntity({ kind: event.target.value as Msx2EntityKind })}
                className={numberInputClass}
                aria-label="Entity kind"
              >
                {MSX2_ENTITY_KIND_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <select
                value={selectedEntity.params?.movement || 'static'}
                onChange={event => {
                  const movement = event.target.value;
                  if (movement === 'static') {
                    onUpdateSelectedEntity({
                      components: {
                        ...(selectedEntity.components || {}),
                        msx2_movement: {
                          ...(selectedEntity.components?.msx2_movement || {}),
                          mode: 'static',
                          speed: 0,
                        },
                      },
                      params: { runtime: 'MSX2', engine: 'static', movement: 'static' },
                    });
                    return;
                  }
                  if (movement === 'ghostMaze') {
                    onUpdateSelectedEntityParams({
                      runtime: 'MSX2',
                      engine: 'ghostMaze',
                      movement,
                      initialDirection: selectedEntity.params?.initialDirection || 'right',
                      speed: Math.max(1, Math.min(15, Number(selectedEntity.params?.speed) || 2)),
                    });
                    return;
                  }
                  onUpdateSelectedEntityParams({
                    runtime: 'MSX2',
                    engine: movement,
                    movement,
                    direction: Number(selectedEntity.params?.direction) || 1,
                    ...(movement === 'ballBounce'
                      ? {
                        minX: selectedEntity.params?.minX ?? 8,
                        maxX: selectedEntity.params?.maxX ?? 232,
                        minY: selectedEntity.params?.minY ?? 16,
                        maxY: selectedEntity.params?.maxY ?? 176,
                        boundsUnit: 'px',
                      }
                      : {
                        minX: selectedEntity.params?.minX ?? selectedEntity.position.x,
                        maxX: selectedEntity.params?.maxX ?? Math.min(MAP_WIDTH - 1, selectedEntity.position.x + 4),
                        minY: selectedEntity.params?.minY ?? selectedEntity.position.y,
                        maxY: selectedEntity.params?.maxY ?? Math.min(MAP_HEIGHT - 1, selectedEntity.position.y + 4),
                        boundsUnit: 'tile',
                      }),
                  });
                }}
                className={numberInputClass}
                aria-label="Entity movement"
              >
                {MSX2_ENTITY_MOVEMENT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <label className="block space-y-1">
              <span className="text-msx-textsecondary">Render</span>
              <div className="flex items-center gap-1">
                <span
                  className="min-w-0 flex-1 truncate rounded border border-msx-border bg-msx-panelbg px-2 py-1"
                  title={renderSpriteAssetId || 'None'}
                >
                  {getMsx2RenderSpriteName(allAssets, renderSpriteAssetId)}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsRenderPickerOpen(true)}
                  aria-label="Choose MSX2 render sprite"
                >
                  ...
                </Button>
              </div>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="text-msx-textsecondary">Tile X</span>
                <input
                  type="number"
                  min={0}
                  max={MAP_WIDTH - 1}
                  value={selectedEntity.position.x}
                  onChange={event => onUpdateSelectedEntity({
                    position: { ...selectedEntity.position, x: Math.max(0, Math.min(MAP_WIDTH - 1, Number(event.target.value) || 0)) },
                  })}
                  className={numberInputClass}
                  aria-label="Entity tile X"
                />
              </label>
              <label className="space-y-1">
                <span className="text-msx-textsecondary">Tile Y</span>
                <input
                  type="number"
                  min={0}
                  max={MAP_HEIGHT - 1}
                  value={selectedEntity.position.y}
                  onChange={event => onUpdateSelectedEntity({
                    position: { ...selectedEntity.position, y: Math.max(0, Math.min(MAP_HEIGHT - 1, Number(event.target.value) || 0)) },
                  })}
                  className={numberInputClass}
                  aria-label="Entity tile Y"
                />
              </label>
            </div>
            <div className="rounded border border-msx-border/60 p-2">
              <div className="mb-1 text-msx-textsecondary">MSX2 Components</div>
              <div className="space-y-1">
                {MSX2_COMPONENT_REPERTOIRE
                  .filter(component => selectedEntity.components?.[component.id])
                  .map(component => (
                    <div key={component.id} className="flex items-center justify-between gap-2 text-[0.65rem]">
                      <span className="text-msx-cyan">{component.label}</span>
                      <span className="truncate text-msx-textsecondary" title={JSON.stringify(selectedEntity.components?.[component.id] || {})}>
                        {summarizeMsx2Component(selectedEntity.components?.[component.id]) || component.id}
                      </span>
                    </div>
                  ))}
                {!selectedEntity.components && (
                  <div className="text-[0.65rem] text-msx-textsecondary">Legacy MSX2 entity params only.</div>
                )}
              </div>
            </div>
            {selectedEntity.components?.msx2_attack_pattern && (
              <div className="rounded border border-msx-border/60 p-2 space-y-2">
                <div className="text-msx-textsecondary">Attack Pattern</div>
                <label className="block space-y-1">
                  <span className="text-msx-textsecondary">Pattern</span>
                  <select
                    value={String(selectedEntity.components.msx2_attack_pattern.pattern || selectedEntity.params?.attackPattern || 'circle')}
                    onChange={event => patchSelectedComponent('msx2_attack_pattern', { pattern: event.target.value }, { attackPattern: event.target.value })}
                    className={numberInputClass}
                    aria-label="Galaxian attack pattern"
                  >
                    <option value="circle">Circle</option>
                    <option value="zigzag">Zig Zag</option>
                    <option value="diagonal">Diagonal</option>
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1">
                    <span className="text-msx-textsecondary">Trigger Frames</span>
                    <input
                      type="number"
                      min={1}
                      max={240}
                      value={Math.max(1, Math.min(240, Number(selectedEntity.components.msx2_attack_pattern.triggerFrames) || 120))}
                      onChange={event => patchSelectedComponent('msx2_attack_pattern', { triggerFrames: Math.max(1, Math.min(240, Number(event.target.value) || 120)) }, { triggerFrames: Math.max(1, Math.min(240, Number(event.target.value) || 120)) })}
                      className={numberInputClass}
                      aria-label="Galaxian attack trigger frames"
                    />
                  </label>
                  <label className="flex items-center gap-2 self-end rounded border border-msx-border px-2 py-1 text-msx-textprimary">
                    <input
                      type="checkbox"
                      checked={selectedEntity.components.msx2_attack_pattern.fireDuringDive === true || String(selectedEntity.components.msx2_attack_pattern.fireDuringDive).toLowerCase() === 'true'}
                      onChange={event => patchSelectedComponent('msx2_attack_pattern', { fireDuringDive: event.target.checked })}
                    />
                    <span>Fire Dive</span>
                  </label>
                </div>
              </div>
            )}
            {selectedEntity.components?.msx2_attack_wave && (
              <div className="rounded border border-msx-border/60 p-2 space-y-2">
                <div className="text-msx-textsecondary">Attack Wave</div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1">
                    <span className="text-msx-textsecondary">Interval</span>
                    <input
                      type="number"
                      min={1}
                      max={255}
                      value={Math.max(1, Math.min(255, Number(selectedEntity.components.msx2_attack_wave.intervalFrames) || 180))}
                      onChange={event => patchSelectedComponent('msx2_attack_wave', { intervalFrames: Math.max(1, Math.min(255, Number(event.target.value) || 180)) }, { attackIntervalFrames: Math.max(1, Math.min(255, Number(event.target.value) || 180)) })}
                      className={numberInputClass}
                      aria-label="Galaxian attack wave interval frames"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-msx-textsecondary">Seed</span>
                    <input
                      type="number"
                      min={1}
                      max={255}
                      value={Math.max(1, Math.min(255, Number(selectedEntity.components.msx2_attack_wave.randomSeed) || 73))}
                      onChange={event => patchSelectedComponent('msx2_attack_wave', { randomSeed: Math.max(1, Math.min(255, Number(event.target.value) || 73)) }, { randomSeed: Math.max(1, Math.min(255, Number(event.target.value) || 73)) })}
                      className={numberInputClass}
                      aria-label="Galaxian attack wave random seed"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-msx-textsecondary">Min Attackers</span>
                    <input
                      type="number"
                      min={1}
                      max={3}
                      value={Math.max(1, Math.min(3, Number(selectedEntity.components.msx2_attack_wave.minAttackers) || 1))}
                      onChange={event => patchSelectedComponent('msx2_attack_wave', { minAttackers: Math.max(1, Math.min(3, Number(event.target.value) || 1)) }, { minAttackers: Math.max(1, Math.min(3, Number(event.target.value) || 1)) })}
                      className={numberInputClass}
                      aria-label="Galaxian attack wave minimum attackers"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-msx-textsecondary">Max Attackers</span>
                    <input
                      type="number"
                      min={1}
                      max={3}
                      value={Math.max(1, Math.min(3, Number(selectedEntity.components.msx2_attack_wave.maxAttackers) || 3))}
                      onChange={event => patchSelectedComponent('msx2_attack_wave', { maxAttackers: Math.max(1, Math.min(3, Number(event.target.value) || 3)) }, { maxAttackers: Math.max(1, Math.min(3, Number(event.target.value) || 3)) })}
                      className={numberInputClass}
                      aria-label="Galaxian attack wave maximum attackers"
                    />
                  </label>
                </div>
              </div>
            )}
            {selectedEntity.params?.movement === 'ghostMaze' && (
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="text-msx-textsecondary">Start Dir</span>
                  <select
                    value={selectedEntity.params?.initialDirection || 'right'}
                    onChange={event => onUpdateSelectedEntityParams({ initialDirection: event.target.value })}
                    className={numberInputClass}
                    aria-label="Ghost start direction"
                  >
                    <option value="right">Right</option>
                    <option value="left">Left</option>
                    <option value="up">Up</option>
                    <option value="down">Down</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-msx-textsecondary">Speed</span>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={Math.max(1, Math.min(15, Number(selectedEntity.params?.speed) || 2))}
                    onChange={event => onUpdateSelectedEntityParams({ speed: Math.max(1, Math.min(15, Number(event.target.value) || 2)) })}
                    className={numberInputClass}
                    aria-label="Ghost movement speed"
                  />
                </label>
              </div>
            )}
            {selectedEntity.params?.movement === 'ballBounce' && (
              <div className="rounded border border-msx-border/60 p-2 space-y-2">
                <div className="text-msx-textsecondary">Ball Bounds (px)</div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1">
                    <span className="text-msx-textsecondary">Min X</span>
                    <input
                      type="number"
                      min={0}
                      max={MAP_PIXEL_WIDTH - 1}
                      value={selectedEntity.params?.minX ?? selectedEntity.components?.msx2_movement?.minX ?? 8}
                      onChange={event => onUpdateSelectedEntityParams({ minX: Math.max(0, Math.min(MAP_PIXEL_WIDTH - 1, Number(event.target.value) || 0)), boundsUnit: 'px' })}
                      className={numberInputClass}
                      aria-label="Ball minimum X in pixels"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-msx-textsecondary">Max X</span>
                    <input
                      type="number"
                      min={0}
                      max={MAP_PIXEL_WIDTH - 1}
                      value={selectedEntity.params?.maxX ?? selectedEntity.components?.msx2_movement?.maxX ?? 232}
                      onChange={event => onUpdateSelectedEntityParams({ maxX: Math.max(0, Math.min(MAP_PIXEL_WIDTH - 1, Number(event.target.value) || 0)), boundsUnit: 'px' })}
                      className={numberInputClass}
                      aria-label="Ball maximum X in pixels"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-msx-textsecondary">Min Y</span>
                    <input
                      type="number"
                      min={0}
                      max={MAP_PIXEL_HEIGHT - 1}
                      value={selectedEntity.params?.minY ?? selectedEntity.components?.msx2_movement?.minY ?? 16}
                      onChange={event => onUpdateSelectedEntityParams({ minY: Math.max(0, Math.min(MAP_PIXEL_HEIGHT - 1, Number(event.target.value) || 0)), boundsUnit: 'px' })}
                      className={numberInputClass}
                      aria-label="Ball minimum Y in pixels"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-msx-textsecondary">Max Y</span>
                    <input
                      type="number"
                      min={0}
                      max={MAP_PIXEL_HEIGHT - 1}
                      value={selectedEntity.params?.maxY ?? selectedEntity.components?.msx2_movement?.maxY ?? 176}
                      onChange={event => onUpdateSelectedEntityParams({ maxY: Math.max(0, Math.min(MAP_PIXEL_HEIGHT - 1, Number(event.target.value) || 0)), boundsUnit: 'px' })}
                      className={numberInputClass}
                      aria-label="Ball maximum Y in pixels"
                    />
                  </label>
                </div>
              </div>
            )}
            {selectedEntity.params?.movement && selectedEntity.params.movement !== 'static' && selectedEntity.params.movement !== 'ghostMaze' && selectedEntity.params.movement !== 'ballBounce' && (
              <>
                {selectedEntity.params.movement === 'patrolX' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="space-y-1">
                      <span className="text-msx-textsecondary">Min X</span>
                      <input type="number" min={0} max={MAP_WIDTH - 1} value={selectedEntity.params?.minX ?? selectedEntity.position.x} onChange={event => onUpdateSelectedEntityParams({ minX: Math.max(0, Math.min(MAP_WIDTH - 1, Number(event.target.value) || 0)) })} className={numberInputClass} aria-label="Patrol min X" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-msx-textsecondary">Max X</span>
                      <input type="number" min={0} max={MAP_WIDTH - 1} value={selectedEntity.params?.maxX ?? selectedEntity.position.x} onChange={event => onUpdateSelectedEntityParams({ maxX: Math.max(0, Math.min(MAP_WIDTH - 1, Number(event.target.value) || 0)) })} className={numberInputClass} aria-label="Patrol max X" />
                    </label>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="space-y-1">
                      <span className="text-msx-textsecondary">Min Y</span>
                      <input type="number" min={0} max={MAP_HEIGHT - 1} value={selectedEntity.params?.minY ?? selectedEntity.position.y} onChange={event => onUpdateSelectedEntityParams({ minY: Math.max(0, Math.min(MAP_HEIGHT - 1, Number(event.target.value) || 0)) })} className={numberInputClass} aria-label="Patrol min Y" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-msx-textsecondary">Max Y</span>
                      <input type="number" min={0} max={MAP_HEIGHT - 1} value={selectedEntity.params?.maxY ?? selectedEntity.position.y} onChange={event => onUpdateSelectedEntityParams({ maxY: Math.max(0, Math.min(MAP_HEIGHT - 1, Number(event.target.value) || 0)) })} className={numberInputClass} aria-label="Patrol max Y" />
                    </label>
                  </div>
                )}
                <select
                  value={Number(selectedEntity.params?.direction) < 0 ? -1 : 1}
                  onChange={event => onUpdateSelectedEntityParams({ direction: Number(event.target.value) })}
                  className={numberInputClass}
                  aria-label="Patrol direction"
                >
                  <option value={1}>Positive</option>
                  <option value={-1}>Negative</option>
                </select>
              </>
            )}
            <Button size="sm" variant="danger" onClick={onRemoveSelectedEntity}>Delete Entity</Button>
            {isRenderPickerOpen && (
              <AssetPickerModal
                isOpen={isRenderPickerOpen}
                onClose={() => setIsRenderPickerOpen(false)}
                onSelectAsset={(assetId) => {
                  onUpdateSelectedEntity({
                    spriteAssetId: assetId || undefined,
                    components: {
                      ...(selectedEntity.components || {}),
                      msx2_hardware_sprite: {
                        ...(selectedEntity.components?.msx2_hardware_sprite || {}),
                        msx2SpriteAssetId: assetId,
                        visible: assetId ? selectedEntity.components?.msx2_hardware_sprite?.visible ?? true : false,
                      },
                    },
                  });
                  setIsRenderPickerOpen(false);
                }}
                assetTypeToPick="msx2sprite"
                allAssets={allAssets}
                currentSelectedId={renderSpriteAssetId || null}
              />
            )}
          </>
        ) : (
          <div className="text-msx-textsecondary">No entity selected.</div>
        )}
      </div>
    </Panel>
  );
};

interface Msx2Screen4EntityPalettePanelProps {
  mode: Msx2Screen4EditMode;
  presets: Msx2EntityCreatePreset[];
  selectedPresetId: string;
  onSelectPresetId: (presetId: string) => void;
}

export const Msx2Screen4EntityPalettePanel: React.FC<Msx2Screen4EntityPalettePanelProps> = ({
  mode,
  presets,
  selectedPresetId,
  onSelectPresetId,
}) => {
  if (mode !== 'entities') return null;

  return (
    <Panel title="Create MSX2 Entity" collapsible>
      <div className="p-2 grid grid-cols-2 gap-2 text-xs">
        {presets.map(preset => (
          <Button
            key={preset.id}
            size="sm"
            variant={preset.id === selectedPresetId ? 'primary' : 'secondary'}
            onClick={() => onSelectPresetId(preset.id)}
            title={preset.description}
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </Panel>
  );
};

interface Msx2Screen4TilesPanelProps {
  tiles: Msx2Screen4Tile[];
  slots: Screen5PaletteSlot[];
  selectedTileIndex: number;
  onSelectTileIndex: (index: number) => void;
  onAddTile: () => void;
  onDuplicateTile: () => void;
  onClearTile: () => void;
}

interface Msx2TilePreviewProps {
  tile: Msx2Screen4Tile;
  slots: Screen5PaletteSlot[];
}

const Msx2TilePreview: React.FC<Msx2TilePreviewProps> = ({ tile, slots }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const width = getTilePixelWidth(tile);
    const height = getTilePixelHeight(tile);
    canvas.width = width;
    canvas.height = height;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#05070b';
    ctx.fillRect(0, 0, width, height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const slot = tile.pixels?.[y]?.[x] ?? 0;
        const hex = slots[slot]?.hex || '#000000';
        ctx.fillStyle = hex === TRANSPARENT_HEX ? '#05070b' : hex;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, [tile, slots]);

  return (
    <canvas
      ref={canvasRef}
      className="h-10 w-10 flex-none rounded border border-msx-border bg-black"
      style={{ imageRendering: 'pixelated' }}
      aria-label={`MSX2 tile ${tile.name} preview`}
    />
  );
};

export const Msx2Screen4TilesPanel: React.FC<Msx2Screen4TilesPanelProps> = ({
  tiles,
  slots,
  selectedTileIndex,
  onSelectTileIndex,
  onAddTile,
  onDuplicateTile,
  onClearTile,
}) => (
  <Panel title="MSX2 Tiles" collapsible>
    <div className="p-2 space-y-2">
      <div className="grid grid-cols-2 gap-1">
        <Button size="sm" variant="secondary" onClick={onAddTile}>Add</Button>
        <Button size="sm" variant="secondary" onClick={onDuplicateTile}>Duplicate</Button>
        <Button size="sm" variant="danger" onClick={onClearTile}>Clear</Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {tiles.map((tile, index) => (
          <button
            key={tile.id}
            type="button"
            className={`min-w-0 text-left px-2 py-1 rounded border text-xs ${index === selectedTileIndex ? 'border-msx-highlight bg-msx-highlight/20' : 'border-msx-border bg-msx-panelbg'}`}
            onClick={() => onSelectTileIndex(index)}
          >
            <span className="flex items-center gap-2">
              <Msx2TilePreview tile={tile} slots={slots} />
              <span className="min-w-0">
                <span className="block truncate">{index}: {tile.name}</span>
                <span className="block text-[10px] text-msx-textsecondary">
                  {getTilePixelWidth(tile)}x{getTilePixelHeight(tile)}
                </span>
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  </Panel>
);

interface Msx2Screen4GridProps {
  map: number[][];
  slots: Screen5PaletteSlot[];
  tiles: Msx2Screen4Tile[];
  showGrid: boolean;
  mode: Msx2Screen4EditMode;
  layers: Msx2Screen4Layers;
  runtime: Msx2Screen4Runtime;
  selectionMode: boolean;
  selectionRect: Msx2Screen4SelectionRect | null;
  selectedEntityId: string | null;
  showRuntimeOverlays: boolean;
  compositionOverlay: Msx2Screen4CompositionOverlay;
  isDrawing: boolean;
  onSetDrawing: (isDrawing: boolean) => void;
  onCellAction: (action: Msx2Screen4CellAction) => void;
  onSelectionChange: (rect: Msx2Screen4SelectionRect | null) => void;
}

export const Msx2Screen4Grid: React.FC<Msx2Screen4GridProps> = ({
  map,
  slots,
  tiles,
  showGrid,
  mode,
  layers,
  runtime,
  selectionMode,
  selectionRect,
  selectedEntityId,
  showRuntimeOverlays,
  compositionOverlay,
  isDrawing,
  onSetDrawing,
  onCellAction,
  onSelectionChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.width = MAP_PIXEL_WIDTH * 2;
    canvas.height = MAP_PIXEL_HEIGHT * 2;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let my = 0; my < MAP_HEIGHT; my++) {
      for (let mx = 0; mx < MAP_WIDTH; mx++) {
        const tile = tiles[map[my][mx]] || tiles[0];
        const tileWidth = getTilePixelWidth(tile);
        const tileHeight = getTilePixelHeight(tile);
        for (let py = 0; py < tileHeight; py++) {
          const drawY = my * TILE_SIZE + py;
          if (drawY >= MAP_PIXEL_HEIGHT) continue;
          for (let px = 0; px < tileWidth; px++) {
            const drawX = mx * TILE_SIZE + px;
            if (drawX >= MAP_PIXEL_WIDTH) continue;
            const slot = tile.pixels[py][px] & 0x0f;
            const hex = slots[slot]?.hex || '#000000';
            ctx.fillStyle = hex === TRANSPARENT_HEX ? '#000000' : hex;
            ctx.fillRect(drawX * 2, drawY * 2, 2, 2);
          }
        }
      }
    }

    if (showGrid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= MAP_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * TILE_SIZE * 2 + 0.5, 0);
        ctx.lineTo(x * TILE_SIZE * 2 + 0.5, MAP_HEIGHT * TILE_SIZE * 2);
        ctx.stroke();
      }
      for (let y = 0; y <= MAP_HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * TILE_SIZE * 2 + 0.5);
      ctx.lineTo(MAP_PIXEL_WIDTH * 2 + 0.5, y * TILE_SIZE * 2 + 0.5);
      ctx.stroke();
    }

    if (SCREEN_HEIGHT < MAP_PIXEL_HEIGHT) {
      const cropY = SCREEN_HEIGHT * 2 + 0.5;
      ctx.strokeStyle = 'rgba(255, 216, 64, 0.85)';
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(0, cropY);
      ctx.lineTo(MAP_PIXEL_WIDTH * 2, cropY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.strokeStyle = 'rgba(64, 223, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(
      runtime.activeAreaX * TILE_SIZE * 2 + 1,
      runtime.activeAreaY * TILE_SIZE * 2 + 1,
      runtime.activeAreaWidth * TILE_SIZE * 2 - 2,
      runtime.activeAreaHeight * TILE_SIZE * 2 - 2
    );
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
    }

    if (compositionOverlay !== 'off') {
      const drawCellStroke = (x: number, y: number, w: number, h: number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(
          x * TILE_SIZE * 2 + 2,
          y * TILE_SIZE * 2 + 2,
          w * TILE_SIZE * 2 - 4,
          h * TILE_SIZE * 2 - 4
        );
        ctx.lineWidth = 1;
      };

      if (compositionOverlay === 'copy8x8') {
        ctx.strokeStyle = 'rgba(64, 223, 255, 0.32)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= MAP_PIXEL_WIDTH; x += 8) {
          ctx.beginPath();
          ctx.moveTo(x * 2 + 0.5, 0);
          ctx.lineTo(x * 2 + 0.5, MAP_PIXEL_HEIGHT * 2);
          ctx.stroke();
        }
        for (let y = 0; y <= MAP_PIXEL_HEIGHT; y += 8) {
          ctx.beginPath();
          ctx.moveTo(0, y * 2 + 0.5);
          ctx.lineTo(MAP_PIXEL_WIDTH * 2, y * 2 + 0.5);
          ctx.stroke();
        }
      }

      if (compositionOverlay === 'hudBands') {
        ctx.fillStyle = 'rgba(255, 216, 64, 0.20)';
        if (runtime.activeAreaY > 0) {
          ctx.fillRect(0, 0, MAP_PIXEL_WIDTH * 2, runtime.activeAreaY * TILE_SIZE * 2);
        }
        const bottomStart = runtime.activeAreaY + runtime.activeAreaHeight;
        if (bottomStart < MAP_HEIGHT) {
          ctx.fillRect(0, bottomStart * TILE_SIZE * 2, MAP_PIXEL_WIDTH * 2, (MAP_HEIGHT - bottomStart) * TILE_SIZE * 2);
        }
        if (runtime.activeAreaX > 0) {
          ctx.fillRect(0, runtime.activeAreaY * TILE_SIZE * 2, runtime.activeAreaX * TILE_SIZE * 2, runtime.activeAreaHeight * TILE_SIZE * 2);
        }
        const rightStart = runtime.activeAreaX + runtime.activeAreaWidth;
        if (rightStart < MAP_WIDTH) {
          ctx.fillRect(rightStart * TILE_SIZE * 2, runtime.activeAreaY * TILE_SIZE * 2, (MAP_WIDTH - rightStart) * TILE_SIZE * 2, runtime.activeAreaHeight * TILE_SIZE * 2);
        }
        ctx.fillStyle = '#FFE050';
        ctx.font = '12px monospace';
        ctx.fillText('HUD/static', 8, 18);
      }

      if (compositionOverlay === 'props16x16') {
        const counts = new Map<number, number>();
        map.flat().forEach(index => counts.set(index, (counts.get(index) || 0) + 1));
        for (let y = 0; y < MAP_HEIGHT; y++) {
          for (let x = 0; x < MAP_WIDTH; x++) {
            const tileIndex = map[y][x] || 0;
            if ((counts.get(tileIndex) || 0) > 1) {
              ctx.fillStyle = 'rgba(80, 220, 255, 0.14)';
              ctx.fillRect(x * TILE_SIZE * 2, y * TILE_SIZE * 2, TILE_SIZE * 2, TILE_SIZE * 2);
              drawCellStroke(x, y, 1, 1, 'rgba(80, 220, 255, 0.72)');
            }
          }
        }
      }

      if (compositionOverlay === 'reuse2x2' || compositionOverlay === 'reuse4x4') {
        const blockSize = compositionOverlay === 'reuse2x2' ? 2 : 4;
        const counts = new Map<string, number>();
        const blockKey = (x: number, y: number) => {
          const values: number[] = [];
          for (let by = 0; by < blockSize; by++) {
            for (let bx = 0; bx < blockSize; bx++) values.push(map[y + by]?.[x + bx] || 0);
          }
          return values.join(',');
        };
        for (let y = 0; y <= MAP_HEIGHT - blockSize; y += blockSize) {
          for (let x = 0; x <= MAP_WIDTH - blockSize; x += blockSize) {
            const key = blockKey(x, y);
            counts.set(key, (counts.get(key) || 0) + 1);
          }
        }
        for (let y = 0; y <= MAP_HEIGHT - blockSize; y += blockSize) {
          for (let x = 0; x <= MAP_WIDTH - blockSize; x += blockSize) {
            const repeated = (counts.get(blockKey(x, y)) || 0) > 1;
            if (!repeated) continue;
            ctx.fillStyle = compositionOverlay === 'reuse2x2' ? 'rgba(116, 208, 125, 0.16)' : 'rgba(255, 142, 129, 0.16)';
            ctx.fillRect(x * TILE_SIZE * 2, y * TILE_SIZE * 2, blockSize * TILE_SIZE * 2, blockSize * TILE_SIZE * 2);
            drawCellStroke(x, y, blockSize, blockSize, compositionOverlay === 'reuse2x2' ? 'rgba(116, 208, 125, 0.74)' : 'rgba(255, 142, 129, 0.74)');
          }
        }
      }
    }

    if (selectionRect) {
      ctx.strokeStyle = 'rgba(255, 232, 80, 0.95)';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 5]);
      ctx.strokeRect(
        selectionRect.x * TILE_SIZE * 2 + 1.5,
        selectionRect.y * TILE_SIZE * 2 + 1.5,
        selectionRect.width * TILE_SIZE * 2 - 3,
        selectionRect.height * TILE_SIZE * 2 - 3
      );
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
    }

    if (showRuntimeOverlays || mode === 'collision' || mode === 'effects' || mode === 'behavior' || mode === 'entities') {
      for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
          const px = x * TILE_SIZE * 2;
          const py = y * TILE_SIZE * 2;
          const collision = layers.collision[y]?.[x] || 0;
          const effect = layers.effects[y]?.[x] || 0;
          const behavior = layers.behavior?.[y]?.[x] || 0;
          if ((showRuntimeOverlays || mode === 'collision') && collision) {
            ctx.fillStyle = 'rgba(255, 64, 64, 0.42)';
            ctx.fillRect(px, py, TILE_SIZE * 2, TILE_SIZE * 2);
          }
          if ((showRuntimeOverlays || mode === 'effects') && effect) {
            ctx.fillStyle = effect === 1 ? 'rgba(255, 80, 80, 0.40)' : effect === 2 ? 'rgba(255, 216, 64, 0.42)' : 'rgba(80, 220, 255, 0.38)';
            ctx.fillRect(px, py, TILE_SIZE * 2, TILE_SIZE * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '18px monospace';
            ctx.fillText(String(effect), px + 8, py + 22);
          }
          if ((showRuntimeOverlays || mode === 'behavior') && behavior) {
            ctx.fillStyle = behavior === 1 ? 'rgba(64, 220, 120, 0.40)' : 'rgba(255, 160, 48, 0.42)';
            ctx.fillRect(px, py, TILE_SIZE * 2, TILE_SIZE * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '18px monospace';
            ctx.fillText(String(behavior), px + 8, py + 22);
          }
        }
      }

      if (showRuntimeOverlays || mode === 'entities') {
        for (const entity of layers.entities) {
          const px = entity.position.x * TILE_SIZE * 2;
          const py = entity.position.y * TILE_SIZE * 2;
          ctx.fillStyle = entity.kind === 'player' ? '#FFFF00' : entity.kind === 'enemy' ? '#FF4040' : entity.kind === 'hazard' ? '#FF40A0' : '#40FF80';
          ctx.fillRect(px + 8, py + 8, TILE_SIZE * 2 - 16, TILE_SIZE * 2 - 16);
          ctx.strokeStyle = entity.id === selectedEntityId ? '#40DFFF' : '#FFFFFF';
          ctx.lineWidth = entity.id === selectedEntityId ? 3 : 1;
          ctx.strokeRect(px + 8.5, py + 8.5, TILE_SIZE * 2 - 17, TILE_SIZE * 2 - 17);
          ctx.lineWidth = 1;
          if (entity.params?.movement === 'patrolX') {
            const minX = Math.max(0, Math.min(MAP_WIDTH - 1, Number(entity.params.minX) || entity.position.x));
            const maxX = Math.max(0, Math.min(MAP_WIDTH - 1, Number(entity.params.maxX) || entity.position.x));
            const yLine = py + TILE_SIZE;
            ctx.strokeStyle = '#40DFFF';
            ctx.beginPath();
            ctx.moveTo(minX * TILE_SIZE * 2 + 8, yLine);
            ctx.lineTo((maxX + 1) * TILE_SIZE * 2 - 8, yLine);
            ctx.stroke();
          }
          if (entity.params?.movement === 'patrolY') {
            const minY = Math.max(0, Math.min(MAP_HEIGHT - 1, Number(entity.params.minY) || entity.position.y));
            const maxY = Math.max(0, Math.min(MAP_HEIGHT - 1, Number(entity.params.maxY) || entity.position.y));
            const xLine = px + TILE_SIZE;
            ctx.strokeStyle = '#40DFFF';
            ctx.beginPath();
            ctx.moveTo(xLine, minY * TILE_SIZE * 2 + 8);
            ctx.lineTo(xLine, (maxY + 1) * TILE_SIZE * 2 - 8);
            ctx.stroke();
          }
          if (entity.params?.movement === 'ghostMaze') {
            const cx = px + TILE_SIZE;
            const cy = py + TILE_SIZE;
            const direction = entity.params?.initialDirection || 'right';
            const endX = direction === 'left' ? cx - 14 : direction === 'right' ? cx + 14 : cx;
            const endY = direction === 'up' ? cy - 14 : direction === 'down' ? cy + 14 : cy;
            ctx.strokeStyle = '#FFFF00';
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            ctx.fillStyle = '#FFFF00';
            ctx.font = '10px monospace';
            ctx.fillText('G', px + 11, py + 21);
          }
        }
      }
    }
  }, [map, slots, tiles, showGrid, mode, layers, runtime, selectionRect, selectedEntityId, showRuntimeOverlays, compositionOverlay]);

  const getCellFromEvent = (event: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * MAP_WIDTH);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * MAP_HEIGHT);
    if (x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT) return null;
    return { x, y };
  };

  const buildSelectionRect = (start: { x: number; y: number }, end: { x: number; y: number }): Msx2Screen4SelectionRect => {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    return {
      x,
      y,
      width: Math.abs(start.x - end.x) + 1,
      height: Math.abs(start.y - end.y) + 1,
    };
  };

  const emitCellAction = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = getCellFromEvent(event);
    if (!cell) return;
    onCellAction({ x: cell.x, y: cell.y, button: event.button });
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = getCellFromEvent(event);
    if (!cell) return;
    onSetDrawing(true);
    if (selectionMode && mode !== 'entities' && mode !== 'tile') {
      selectionStartRef.current = cell;
      onSelectionChange({ x: cell.x, y: cell.y, width: 1, height: 1 });
      return;
    }
    emitCellAction(event);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const cell = getCellFromEvent(event);
    if (!cell) return;
    if (selectionMode && selectionStartRef.current && mode !== 'entities' && mode !== 'tile') {
      onSelectionChange(buildSelectionRect(selectionStartRef.current, cell));
      return;
    }
    if (mode === 'visual' || mode === 'collision' || mode === 'effects' || mode === 'behavior') {
      emitCellAction(event);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className="border border-msx-border bg-black"
      style={{ width: `${MAP_PIXEL_WIDTH * 2}px`, maxWidth: '100%', height: 'auto', aspectRatio: `${MAP_PIXEL_WIDTH} / ${MAP_PIXEL_HEIGHT}` }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onContextMenu={event => event.preventDefault()}
    />
  );
};

interface Msx2Screen4TileEditorPanelProps {
  selectedTileIndex: number;
  selectedTile: Msx2Screen4Tile;
  slots: Screen5PaletteSlot[];
  activeSlot: number;
  paintTool: Msx2Screen4TilePaintTool;
  dimensionOptions: readonly number[];
  isDrawing: boolean;
  onSetDrawing: (isDrawing: boolean) => void;
  onSelectSlot: (slot: number) => void;
  onPaintToolChange: (tool: Msx2Screen4TilePaintTool) => void;
  onPixelAction: (x: number, y: number, button: number) => void;
  onResizeTile: (width: number, height: number) => void;
  onFillTile: () => void;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
  onShiftTile: (dx: number, dy: number) => void;
}

export const Msx2Screen4TileEditorPanel: React.FC<Msx2Screen4TileEditorPanelProps> = ({
  selectedTileIndex,
  selectedTile,
  slots,
  activeSlot,
  paintTool,
  dimensionOptions,
  isDrawing,
  onSetDrawing,
  onSelectSlot,
  onPaintToolChange,
  onPixelAction,
  onResizeTile,
  onFillTile,
  onFlipHorizontal,
  onFlipVertical,
  onShiftTile,
}) => {
  const tileCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = tileCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !selectedTile) return;
    const tileWidth = getTilePixelWidth(selectedTile);
    const tileHeight = getTilePixelHeight(selectedTile);
    const zoom = 16;
    canvas.width = tileWidth * zoom;
    canvas.height = tileHeight * zoom;
    ctx.imageSmoothingEnabled = false;
    for (let y = 0; y < tileHeight; y++) {
      for (let x = 0; x < tileWidth; x++) {
        const hex = slots[selectedTile.pixels?.[y]?.[x] ?? 0]?.hex || '#000';
        ctx.fillStyle = hex === TRANSPARENT_HEX ? '#05070b' : hex;
        ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
      }
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    for (let i = 0; i <= tileWidth; i++) {
      ctx.beginPath();
      ctx.moveTo(i * zoom + 0.5, 0);
      ctx.lineTo(i * zoom + 0.5, tileHeight * zoom);
      ctx.stroke();
    }
    for (let i = 0; i <= tileHeight; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * zoom + 0.5);
      ctx.lineTo(tileWidth * zoom, i * zoom + 0.5);
      ctx.stroke();
    }
  }, [selectedTile, slots]);

  const emitPixelAction = (event: React.MouseEvent<HTMLCanvasElement>, force = false) => {
    if (!force && !isDrawing) return;
    if (!force && (paintTool === 'fill' || paintTool === 'pick')) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const tileWidth = getTilePixelWidth(selectedTile);
    const tileHeight = getTilePixelHeight(selectedTile);
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * tileWidth);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * tileHeight);
    if (x < 0 || y < 0 || x >= tileWidth || y >= tileHeight || !selectedTile) return;
    onPixelAction(x, y, event.button);
  };

  return (
    <Panel title={`MSX2 Edit Tile ${selectedTileIndex}`} collapsible>
      <div className="p-2 space-y-2">
        <div className="flex items-center justify-between text-xs text-msx-textsecondary">
          <span>MSX2 Color slot {activeSlot}</span>
          <span
            className="inline-block w-5 h-5 rounded border border-msx-border"
            style={{ backgroundColor: slots[activeSlot]?.hex === TRANSPARENT_HEX ? '#111827' : slots[activeSlot]?.hex }}
          />
        </div>
        <div className="grid grid-cols-8 gap-1" aria-label="MSX2 tile palette">
          {slots.map(slot => (
            <button
              key={slot.slotIndex}
              type="button"
              className={`h-6 rounded border ${slot.slotIndex === activeSlot ? 'border-msx-highlight ring-1 ring-msx-highlight' : 'border-msx-border'}`}
              style={{ backgroundColor: slot.hex === TRANSPARENT_HEX ? '#111827' : slot.hex }}
              onClick={() => onSelectSlot(slot.slotIndex)}
              title={`Slot ${slot.slotIndex}: ${slot.hex}`}
              aria-label={`MSX2 paint slot ${slot.slotIndex}`}
            />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-1 text-xs" aria-label="MSX2 tile paint tools">
          {([
            ['pencil', 'MSX2 Pencil'],
            ['erase', 'MSX2 Erase'],
            ['fill', 'MSX2 Bucket'],
            ['pick', 'MSX2 Pick'],
          ] as const).map(([tool, label]) => (
            <Button
              key={tool}
              size="sm"
              variant={paintTool === tool ? 'primary' : 'secondary'}
              onClick={() => onPaintToolChange(tool)}
              aria-label={`MSX2 tile tool ${tool}`}
              title={`${label} tool`}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <label className="space-y-1">
            <span className="text-msx-textsecondary">MSX2 Tile W</span>
            <select
              value={getTilePixelWidth(selectedTile)}
              onChange={event => onResizeTile(Number(event.target.value), getTilePixelHeight(selectedTile))}
              className="w-full px-2 py-1 bg-msx-panelbg border border-msx-border rounded"
              aria-label="MSX2 tile width"
            >
              {dimensionOptions.map(size => <option key={size} value={size}>{size}px</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-msx-textsecondary">MSX2 Tile H</span>
            <select
              value={getTilePixelHeight(selectedTile)}
              onChange={event => onResizeTile(getTilePixelWidth(selectedTile), Number(event.target.value))}
              className="w-full px-2 py-1 bg-msx-panelbg border border-msx-border rounded"
              aria-label="MSX2 tile height"
            >
              {dimensionOptions.map(size => <option key={size} value={size}>{size}px</option>)}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-3 gap-1 text-xs">
          <Button size="sm" variant="secondary" onClick={onFillTile} title="MSX2 fill selected tile" aria-label="MSX2 fill tile">MSX2 Fill</Button>
          <Button size="sm" variant="secondary" onClick={onFlipHorizontal} title="MSX2 flip tile horizontally" aria-label="MSX2 flip tile horizontal">MSX2 Flip H</Button>
          <Button size="sm" variant="secondary" onClick={onFlipVertical} title="MSX2 flip tile vertically" aria-label="MSX2 flip tile vertical">MSX2 Flip V</Button>
          <Button size="sm" variant="secondary" onClick={() => onShiftTile(-1, 0)} title="MSX2 shift tile left" aria-label="MSX2 shift tile left">MSX2 Left</Button>
          <Button size="sm" variant="secondary" onClick={() => onShiftTile(0, -1)} title="MSX2 shift tile up" aria-label="MSX2 shift tile up">MSX2 Up</Button>
          <Button size="sm" variant="secondary" onClick={() => onShiftTile(1, 0)} title="MSX2 shift tile right" aria-label="MSX2 shift tile right">MSX2 Right</Button>
          <Button size="sm" variant="secondary" onClick={() => onShiftTile(0, 1)} title="MSX2 shift tile down" aria-label="MSX2 shift tile down">MSX2 Down</Button>
        </div>
        <canvas
          ref={tileCanvasRef}
          className="w-full border border-msx-border bg-black"
          onMouseDown={event => { onSetDrawing(true); emitPixelAction(event, true); }}
          onMouseMove={event => emitPixelAction(event)}
          onContextMenu={event => event.preventDefault()}
        />
      </div>
    </Panel>
  );
};

interface Msx2Screen4ExportModelPanelProps {
  layers: Msx2Screen4Layers;
}

export const Msx2Screen4ExportModelPanel: React.FC<Msx2Screen4ExportModelPanelProps> = ({ layers }) => (
  <Panel title="MSX2 Export Model" collapsible>
    <div className="p-2 text-xs text-msx-textsecondary space-y-1">
      <div>Tile raw size: variable, multiples of 8 px</div>
      <div>Map size: 192 bytes</div>
      <div>Collision layer: 192 bytes</div>
      <div>Effects layer: 192 bytes</div>
      <div>Behavior layer: 192 bytes</div>
      <div>Entities: {layers.entities.length}</div>
      <div>Current backend: emits packed 16x16 tiles or rasterized variable-size tile screens plus runtime layers.</div>
    </div>
  </Panel>
);

interface Msx2Screen4StatusBarProps {
  mode: Msx2Screen4EditMode;
  selectedTileIndex: number;
  selectedEffectCode: number;
  selectedBehaviorCode: number;
  layers: Msx2Screen4Layers;
  runtime: Msx2Screen4Runtime;
  selectionRect: Msx2Screen4SelectionRect | null;
}

export const Msx2Screen4StatusBar: React.FC<Msx2Screen4StatusBarProps> = ({
  mode,
  selectedTileIndex,
  selectedEffectCode,
  selectedBehaviorCode,
  layers,
  runtime,
  selectionRect,
}) => {
  const collectibleCells = layers.effects.flat().filter(value => value === 3).length;

  return (
    <div className="p-2 border-t border-msx-border text-xs text-msx-textsecondary pixel-font">
      Layer: {mode} |
      Tile: {selectedTileIndex} |
      Effect: {selectedEffectCode} |
      Behavior: {selectedBehaviorCode} |
      Entities: {layers.entities.length} |
      Collectibles: {runtime.requiredCollectibles ?? 0}/{collectibleCells} |
      Active Area: X:{runtime.activeAreaX} Y:{runtime.activeAreaY} W:{runtime.activeAreaWidth} H:{runtime.activeAreaHeight} |
      Selection: {selectionRect ? `${selectionRect.x},${selectionRect.y} ${selectionRect.width}x${selectionRect.height}` : 'None'} |
      Size: 16x12 anchors / SCREEN 4 pattern tiles / 256x192 visible
    </div>
  );
};
