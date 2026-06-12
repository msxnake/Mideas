import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MSXColorValue, Msx2EntityKind, Msx2PlayerEntry, Msx2ProjectProfile, Msx2Screen4EntityInstance, Msx2Screen4Layers, Msx2Screen4LineAttribute, Msx2Screen4Runtime, Msx2Screen4Tile, Msx2Screen4TileBehaviorKind, Msx2Screen4TileHitbox, ProjectAsset, Screen5PaletteSlot } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { AssetPickerModal } from '../modals/AssetPickerModal';
import {
  analyzeTileColorLimits,
  ensureLineAttributes,
  isValidPixelSlot,
  SCREEN4_PIXELS_PER_COLOR_SEGMENT,
} from '../../utils/msx2Screen4TileConstraints';
import {
  DEFAULT_MSX2_ENTITY_CREATE_PRESETS,
  MSX2_COMPONENT_FIELD_EDITORS,
  MSX2_COMPONENT_REPERTOIRE,
  MSX2_ENTITY_KIND_OPTIONS,
  MSX2_ENTITY_MOVEMENT_OPTIONS,
  MSX2_ENTITY_REPERTOIRE,
  Msx2ComponentDefinition,
  Msx2ComponentFieldEditorConfig,
  Msx2ComponentFieldEditorKind,
  Msx2ComponentId,
  Msx2EntityCreatePreset,
} from './msx2EntityCatalog';
import { normalizeMsx2ShooterRuntimeConfig, MSX2_SHOOTER_IRQ_PROFILES_60HZ, buildMsx2Shooter60HzFrameBudgetSummary, validateMsx2Shooter60HzBudget, resolveMsx2ShooterScrollRowRoutine } from '../../utils/msx2ShooterRuntime';
import {
  MSX2_TILE_BEHAVIOR_COLORS,
  MSX2_TILE_BEHAVIOR_DESCRIPTIONS,
  MSX2_TILE_BEHAVIOR_KINDS,
  MSX2_TILE_BEHAVIOR_LABELS,
  Msx2Screen4TileBehaviorFilter,
  countMsx2TilesByBehavior,
  filterMsx2TilesByBehavior,
  getMsx2TileBehaviorKind,
  normalizeMsx2TileHitbox,
} from '../../utils/msx2Screen4TileBehavior';
import { getMsx2LockedRuntimeMode, getMsx2LockedRuntimeModeLabel, filterMsx2EntityMovementOptionsForProfile, isMsx2ComponentAllowedForProfile, Msx2LockedRuntimeMode } from '../../utils/msx2ProjectProfiles';
import { Msx2Shooter60HzFrameBudgetView } from './Msx2Shooter60HzFrameBudgetView';
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  EraserIcon,
  PaintBrushIcon,
  PencilIcon,
  SwapHorizIcon,
  SwapVertIcon,
  ViewfinderCircleIcon,
} from '../icons/MsxIcons';

export type Msx2Screen4EditMode = 'visual' | 'collision' | 'effects' | 'behavior' | 'entities' | 'playerEntries' | 'tile';
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

interface Msx2TileIconToolButtonProps {
  title: string;
  ariaLabel: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

const Msx2TileIconToolButton: React.FC<Msx2TileIconToolButtonProps> = ({
  title,
  ariaLabel,
  onClick,
  active = false,
  disabled = false,
  children,
  className = '',
}) => (
  <button
    type="button"
    title={title}
    aria-label={ariaLabel}
    aria-pressed={active}
    disabled={disabled}
    onClick={onClick}
    className={`h-8 w-8 flex items-center justify-center rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
      active
        ? 'border-msx-accent bg-msx-accent/15 text-msx-accent shadow-[inset_0_0_0_1px_rgba(64,223,255,0.35)]'
        : 'border-msx-border bg-msx-bgcolor text-msx-textsecondary hover:border-msx-highlight/70 hover:text-msx-highlight hover:bg-msx-highlight/5'
    } ${className}`}
  >
    {children}
  </button>
);

const MSX2_TILE_PAINT_TOOLS: ReadonlyArray<{
  tool: Msx2Screen4TilePaintTool;
  label: string;
  title: string;
  icon: React.ReactNode;
}> = [
  { tool: 'pencil', label: 'Lápiz', title: 'Pintar píxeles (clic izq = FG, der = BG)', icon: <PencilIcon className="w-4 h-4" /> },
  { tool: 'erase', label: 'Borrar', title: 'Borrar al color de fondo del segmento', icon: <EraserIcon className="w-4 h-4" /> },
  { tool: 'fill', label: 'Cubeta', title: 'Rellenar área contigua del mismo color', icon: <PaintBrushIcon className="w-4 h-4" /> },
  { tool: 'pick', label: 'Cuentagotas', title: 'Tomar color del píxel bajo el cursor', icon: <ViewfinderCircleIcon className="w-4 h-4" /> },
];

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
  lockedRuntimeMode?: Msx2LockedRuntimeMode | null;
  lockedRuntimeModeHint?: string | null;
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
  lockedRuntimeMode = null,
  lockedRuntimeModeHint = null,
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
    if (lockedRuntimeMode) return;
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
  const runtimeMode = lockedRuntimeMode || (runtime.screenEngine === 'maze'
    ? 'maze'
    : runtime.screenEngine === 'shooter'
      ? runtime.movementMode === 'shooterHorizontal' ? 'shooterHorizontal' : 'shooterVertical'
      : 'platform');
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
        <div className="grid grid-cols-2 gap-2">
          {layerButton('entities', 'Entities')}
          {layerButton('playerEntries', 'Player')}
        </div>
        {(mode === 'visual' || mode === 'tile') && (
          <div className="text-[0.65rem] text-msx-textsecondary leading-snug">
            Cada tile tiene tipo (Fondo, Frente, Peligro, Caja). En Visual, pintar aplica colisión/effects automáticamente según el tipo.
          </div>
        )}
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
            disabled={Boolean(lockedRuntimeMode)}
            title={lockedRuntimeMode ? (lockedRuntimeModeHint || 'Runtime mode is fixed by the MSX2 project game type.') : undefined}
            className={`w-full px-2 py-1 bg-msx-panelbg border border-msx-border rounded ${lockedRuntimeMode ? 'opacity-70 cursor-not-allowed' : ''}`}
            aria-label="MSX2 runtime mode"
          >
            <option value="platform">Player platform</option>
            <option value="maze">Maze</option>
            <option value="shooterVertical">Shooter vertical 60Hz</option>
            <option value="shooterHorizontal">Shooter horizontal</option>
          </select>
          {lockedRuntimeMode && (
            <p className="text-[11px] text-msx-textsecondary leading-snug">
              {lockedRuntimeModeHint || 'Fixed by project game type'}: {getMsx2LockedRuntimeModeLabel(lockedRuntimeMode)}
            </p>
          )}
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
        {(runtimeMode === 'platform' || runtime.screenEngine === 'player') && (
          <div className="space-y-2 rounded border border-msx-border/70 p-2">
            <div className="text-msx-highlight">Platform physics (screen override)</div>
            <p className="text-[11px] text-msx-textsecondary leading-snug">
              Optional per-screen values. Leave empty to use the player entity msx2_jump / msx2_gravity components.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="text-msx-textsecondary">Jump power</span>
                <input
                  type="number"
                  min={256}
                  max={2048}
                  value={runtime.jumpPower ?? ''}
                  placeholder="1024"
                  onChange={event => updateRuntimeArea({
                    jumpPower: event.target.value === '' ? undefined : Math.max(256, Math.min(2048, Number(event.target.value) || 1024)),
                  })}
                  className={numberInputClass}
                  aria-label="MSX2 screen jump power override"
                />
              </label>
              <label className="space-y-1">
                <span className="text-msx-textsecondary">Gravity strength</span>
                <input
                  type="number"
                  min={16}
                  max={128}
                  value={runtime.gravityStrength ?? ''}
                  placeholder="64"
                  onChange={event => updateRuntimeArea({
                    gravityStrength: event.target.value === '' ? undefined : Math.max(16, Math.min(128, Number(event.target.value) || 64)),
                  })}
                  className={numberInputClass}
                  aria-label="MSX2 screen gravity strength override"
                />
              </label>
              <label className="space-y-1 col-span-2">
                <span className="text-msx-textsecondary">Terminal fall speed</span>
                <input
                  type="number"
                  min={256}
                  max={2048}
                  value={runtime.terminalVelocity ?? ''}
                  placeholder="1024"
                  onChange={event => updateRuntimeArea({
                    terminalVelocity: event.target.value === '' ? undefined : Math.max(256, Math.min(2048, Number(event.target.value) || 1024)),
                  })}
                  className={numberInputClass}
                  aria-label="MSX2 screen terminal velocity override"
                />
              </label>
            </div>
          </div>
        )}
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
  tiles: Msx2Screen4Tile[];
  allAssets: ProjectAsset[];
  onUpdateSelectedEntity: (patch: Partial<Msx2Screen4EntityInstance>) => void;
  onUpdateSelectedEntityParams: (patch: Record<string, any>) => void;
  onRemoveSelectedEntity: () => void;
  onSaveEntityAsPreset?: (entity: Msx2Screen4EntityInstance) => void;
  onExportEntityToLibrary?: (entity: Msx2Screen4EntityInstance) => void;
  msx2ProjectProfile?: Msx2ProjectProfile | null;
}

const summarizeMsx2Component = (values: Record<string, any> | undefined): string => {
  if (!values) return '';
  return Object.entries(values)
    .filter(([, value]) => value !== '' && value !== undefined && value !== false)
    .slice(0, 4)
    .map(([key, value]) => `${key}:${String(value)}`)
    .join(' ');
};

const formatMsx2FieldLabel = (key: string): string =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, char => char.toUpperCase())
    .replace(/Id$/i, ' ID')
    .trim();

const inferMsx2FieldKind = (
  key: string,
  defaultValue: unknown,
  currentValue: unknown,
  config?: Msx2ComponentFieldEditorConfig
): Msx2ComponentFieldEditorKind => {
  if (config?.kind) return config.kind;
  if (config?.options?.length) return 'select';
  if (typeof defaultValue === 'boolean' || typeof currentValue === 'boolean') return 'boolean';
  if (typeof defaultValue === 'number' || (typeof currentValue === 'number' && Number.isFinite(currentValue))) return 'number';
  if (key === 'tileIndex') return 'tileIndex';
  return 'string';
};

const parseMsx2Boolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
};

const getMsx2ComponentFieldKeys = (
  componentDef: Msx2ComponentDefinition,
  values: Record<string, any> | undefined
): string[] => {
  const keys = new Set([
    ...Object.keys(componentDef.defaults || {}),
    ...Object.keys(values || {}),
  ]);
  return Array.from(keys);
};

const getMsx2RenderSpriteName = (assets: ProjectAsset[], spriteAssetId: string): string => {
  if (!spriteAssetId) return 'None (uses box tile)';
  return assets.find(asset => asset.type === 'msx2sprite' && asset.id === spriteAssetId)?.name || spriteAssetId;
};

interface Msx2ComponentFieldsEditorProps {
  componentId: Msx2ComponentId;
  componentDef: Msx2ComponentDefinition;
  values: Record<string, any> | undefined;
  tiles: Msx2Screen4Tile[];
  allAssets?: ProjectAsset[];
  inputClassName: string;
  onPatchField: (fieldKey: string, nextValue: unknown, paramKey?: string, extraComponentPatch?: Record<string, any>) => void;
}

const Msx2ComponentFieldsEditor: React.FC<Msx2ComponentFieldsEditorProps> = ({
  componentId,
  componentDef,
  values,
  tiles,
  allAssets = [],
  inputClassName,
  onPatchField,
}) => {
  const fieldConfigs = MSX2_COMPONENT_FIELD_EDITORS[componentId] || {};
  const fieldKeys = getMsx2ComponentFieldKeys(componentDef, values);
  const [spritePickerField, setSpritePickerField] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-2 gap-2">
      {fieldKeys.map(fieldKey => {
        const config = fieldConfigs[fieldKey];
        if (config?.hidden) return null;

        const defaultValue = componentDef.defaults?.[fieldKey];
        const currentValue = values?.[fieldKey] ?? defaultValue;
        const kind = inferMsx2FieldKind(fieldKey, defaultValue, currentValue, config);
        const label = config?.label || formatMsx2FieldLabel(fieldKey);
        const ariaLabel = config?.ariaLabel || `${componentDef.label} ${label}`;

        if (kind === 'boolean') {
          return (
            <label key={fieldKey} className="col-span-2 flex items-center gap-2 rounded border border-msx-border px-2 py-1 text-msx-textprimary">
              <input
                type="checkbox"
                checked={parseMsx2Boolean(currentValue, parseMsx2Boolean(defaultValue, false))}
                onChange={event => onPatchField(fieldKey, event.target.checked, config?.paramKey)}
                aria-label={ariaLabel}
              />
              <span className="text-msx-textsecondary">{label}</span>
            </label>
          );
        }

        if (kind === 'select') {
          const options = config?.options || (typeof defaultValue === 'string' ? [String(defaultValue)] : []);
          return (
            <label key={fieldKey} className="space-y-1">
              <span className="text-msx-textsecondary">{label}</span>
              <select
                value={String(currentValue ?? defaultValue ?? options[0] ?? '')}
                onChange={event => onPatchField(fieldKey, event.target.value, config?.paramKey)}
                className={inputClassName}
                aria-label={ariaLabel}
              >
                {options.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          );
        }

        if (kind === 'tileIndex') {
          const tileIndex = Math.max(0, Math.min(Math.max(tiles.length - 1, 0), Number(currentValue) || 0));
          return (
            <label key={fieldKey} className="col-span-2 space-y-1">
              <span className="text-msx-textsecondary">{label}</span>
              <select
                value={tileIndex}
                onChange={event => {
                  const nextIndex = Math.max(0, Math.min(tiles.length - 1, Number(event.target.value) || 0));
                  const tile = tiles[nextIndex];
                  onPatchField(
                    fieldKey,
                    nextIndex,
                    config?.paramKey,
                    tile?.id ? { tileId: tile.id } : undefined
                  );
                }}
                className={inputClassName}
                aria-label={ariaLabel}
              >
                {tiles.map((tile, index) => (
                  <option key={tile.id || `tile_${index}`} value={index}>
                    {tile.name?.trim() || `Tile ${index}`}
                  </option>
                ))}
              </select>
            </label>
          );
        }

        if (kind === 'msx2SpriteAsset') {
          const spriteAssetId = String(currentValue ?? defaultValue ?? '').trim();
          return (
            <label key={fieldKey} className="col-span-2 space-y-1">
              <span className="text-msx-textsecondary">{label}</span>
              <div className="flex items-center gap-1">
                <span
                  className="min-w-0 flex-1 truncate rounded border border-msx-border bg-msx-panelbg px-2 py-1"
                  title={spriteAssetId || 'None (uses box tile)'}
                >
                  {getMsx2RenderSpriteName(allAssets, spriteAssetId)}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSpritePickerField(fieldKey)}
                  aria-label={ariaLabel}
                >
                  ...
                </Button>
                {spriteAssetId && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onPatchField(fieldKey, '', undefined)}
                    aria-label={`Clear ${label}`}
                  >
                    ×
                  </Button>
                )}
              </div>
            </label>
          );
        }

        if (kind === 'number') {
          const numericValue = Number(currentValue);
          const resolvedValue = Number.isFinite(numericValue) ? numericValue : Number(defaultValue) || 0;
          const min = config?.min;
          const max = config?.max;
          return (
            <label key={fieldKey} className="space-y-1">
              <span className="text-msx-textsecondary">{label}</span>
              <input
                type="number"
                min={min}
                max={max}
                value={resolvedValue}
                onChange={event => {
                  let nextValue = Number(event.target.value);
                  if (!Number.isFinite(nextValue)) nextValue = Number(defaultValue) || 0;
                  if (min !== undefined) nextValue = Math.max(min, nextValue);
                  if (max !== undefined) nextValue = Math.min(max, nextValue);
                  onPatchField(fieldKey, nextValue, config?.paramKey);
                }}
                className={inputClassName}
                aria-label={ariaLabel}
              />
            </label>
          );
        }

        return (
          <label key={fieldKey} className="col-span-2 space-y-1">
            <span className="text-msx-textsecondary">{label}</span>
            <input
              type="text"
              value={String(currentValue ?? defaultValue ?? '')}
              onChange={event => onPatchField(fieldKey, event.target.value, config?.paramKey)}
              className={inputClassName}
              aria-label={ariaLabel}
            />
          </label>
        );
      })}
      {spritePickerField && (
        <AssetPickerModal
          isOpen={Boolean(spritePickerField)}
          onClose={() => setSpritePickerField(null)}
          onSelectAsset={(assetId) => {
            if (spritePickerField) {
              onPatchField(spritePickerField, assetId || '');
            }
            setSpritePickerField(null);
          }}
          assetTypeToPick="msx2sprite"
          allAssets={allAssets}
          currentSelectedId={String(values?.[spritePickerField] ?? '').trim() || null}
        />
      )}
    </div>
  );
};

const getMsx2RenderSpriteId = (entity: Msx2Screen4EntityInstance | null): string =>
  String(entity?.components?.msx2_hardware_sprite?.msx2SpriteAssetId || entity?.spriteAssetId || '');

export const Msx2Screen4EntityPanel: React.FC<Msx2Screen4EntityPanelProps> = ({
  mode,
  selectedEntity,
  tiles,
  allAssets,
  onUpdateSelectedEntity,
  onUpdateSelectedEntityParams,
  onRemoveSelectedEntity,
  onSaveEntityAsPreset,
  onExportEntityToLibrary,
  msx2ProjectProfile = null,
}) => {
  const [isRenderPickerOpen, setIsRenderPickerOpen] = useState(false);
  const lockedRuntimeMode = getMsx2LockedRuntimeMode(msx2ProjectProfile);
  const movementOptions = filterMsx2EntityMovementOptionsForProfile(MSX2_ENTITY_MOVEMENT_OPTIONS, msx2ProjectProfile);
  const assignableComponents = useMemo(
    () => MSX2_COMPONENT_REPERTOIRE.filter(component =>
      isMsx2ComponentAllowedForProfile(component.id, msx2ProjectProfile)
      && !selectedEntity?.components?.[component.id]
    ),
    [msx2ProjectProfile, selectedEntity?.components]
  );
  const lockPlayerMovement = Boolean(selectedEntity?.kind === 'player' && lockedRuntimeMode);
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
  const patchComponentField = (
    componentId: Msx2ComponentId,
    fieldKey: string,
    nextValue: unknown,
    paramKey?: string,
    extraComponentPatch?: Record<string, any>
  ) => {
    if (!selectedEntity) return;
    const componentPatch = {
      [fieldKey]: nextValue,
      ...(extraComponentPatch || {}),
    };
    const paramsPatch = paramKey ? { [paramKey]: nextValue } : undefined;

    if (componentId === 'msx2_transform') {
      const positionPatch: Partial<Msx2Screen4EntityInstance['position']> = { ...selectedEntity.position };
      if (fieldKey === 'tileX') positionPatch.x = Math.max(0, Math.min(MAP_WIDTH - 1, Number(nextValue) || 0));
      if (fieldKey === 'tileY') positionPatch.y = Math.max(0, Math.min(MAP_HEIGHT - 1, Number(nextValue) || 0));
      onUpdateSelectedEntity({
        position: positionPatch,
        components: {
          ...(selectedEntity.components || {}),
          msx2_transform: {
            ...(selectedEntity.components?.msx2_transform || {}),
            ...componentPatch,
            tileX: positionPatch.x,
            tileY: positionPatch.y,
          },
        },
      });
      return;
    }

    patchSelectedComponent(componentId, componentPatch, paramsPatch);
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
                  if (lockPlayerMovement) return;
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
                disabled={lockPlayerMovement}
                title={lockPlayerMovement ? 'Player movement is fixed by the MSX2 project game type.' : undefined}
                className={`${numberInputClass}${lockPlayerMovement ? ' opacity-70 cursor-not-allowed' : ''}`}
                aria-label="Entity movement"
              >
                {lockPlayerMovement && lockedRuntimeMode ? (
                  <option value={selectedEntity.params?.movement || lockedRuntimeMode}>
                    {getMsx2LockedRuntimeModeLabel(lockedRuntimeMode)}
                  </option>
                ) : (
                  movementOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))
                )}
              </select>
            </div>
            <label className="block space-y-1">
              <span className="text-msx-textsecondary">Render (Sprite)</span>
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
                    ...(selectedEntity.components?.msx2_transform ? {
                      components: {
                        ...(selectedEntity.components || {}),
                        msx2_transform: {
                          ...(selectedEntity.components.msx2_transform || {}),
                          tileX: Math.max(0, Math.min(MAP_WIDTH - 1, Number(event.target.value) || 0)),
                        },
                      },
                    } : {}),
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
                    ...(selectedEntity.components?.msx2_transform ? {
                      components: {
                        ...(selectedEntity.components || {}),
                        msx2_transform: {
                          ...(selectedEntity.components.msx2_transform || {}),
                          tileY: Math.max(0, Math.min(MAP_HEIGHT - 1, Number(event.target.value) || 0)),
                        },
                      },
                    } : {}),
                  })}
                  className={numberInputClass}
                  aria-label="Entity tile Y"
                />
              </label>
            </div>
            <div className="rounded border border-msx-border/60 p-2 space-y-2">
              <div className="text-msx-textsecondary">MSX2 Components</div>
              {MSX2_COMPONENT_REPERTOIRE
                .filter(component => selectedEntity.components?.[component.id])
                .map(component => (
                  <details key={component.id} className="rounded border border-msx-border/60 bg-msx-panelbg/40">
                    <summary className="cursor-pointer px-2 py-1 text-msx-cyan">
                      {component.label}
                      <span className="ml-2 text-[0.65rem] text-msx-textsecondary">
                        {summarizeMsx2Component(selectedEntity.components?.[component.id])}
                      </span>
                    </summary>
                    <div className="border-t border-msx-border/60 p-2 space-y-2">
                      {component.description && (
                        <p className="text-[11px] text-msx-textsecondary leading-snug">{component.description}</p>
                      )}
                      <Msx2ComponentFieldsEditor
                        componentId={component.id}
                        componentDef={component}
                        values={selectedEntity.components?.[component.id]}
                        tiles={tiles}
                        allAssets={allAssets}
                        inputClassName={numberInputClass}
                        onPatchField={(fieldKey, nextValue, paramKey, extraComponentPatch) =>
                          patchComponentField(component.id, fieldKey, nextValue, paramKey, extraComponentPatch)
                        }
                      />
                    </div>
                  </details>
                ))}
              {assignableComponents.length > 0 && selectedEntity && (
                <label className="block space-y-1">
                  <span className="text-msx-textsecondary">Add MSX2 component</span>
                  <select
                    value=""
                    onChange={event => {
                      const componentId = event.target.value;
                      if (!componentId || !selectedEntity) return;
                      const definition = MSX2_COMPONENT_REPERTOIRE.find(component => component.id === componentId);
                      onUpdateSelectedEntity({
                        components: {
                          ...(selectedEntity.components || {}),
                          [componentId]: { ...(definition?.defaults || {}) },
                        },
                      });
                    }}
                    className={numberInputClass}
                    aria-label="Add MSX2 component to entity"
                  >
                    <option value="">— Select component —</option>
                    {assignableComponents.map(component => (
                      <option key={component.id} value={component.id}>{component.label}</option>
                    ))}
                  </select>
                </label>
              )}
              {!selectedEntity.components && (
                <div className="text-[0.65rem] text-msx-textsecondary">Legacy MSX2 entity params only.</div>
              )}
            </div>
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
            <div className="flex flex-wrap gap-2">
              {onSaveEntityAsPreset && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onSaveEntityAsPreset(selectedEntity)}
                  title="Save this entity (name, kind, components, params) as a reusable preset in the Create MSX2 Entity palette. Stored as an MSX2 entity template asset in the project JSON."
                >
                  Save as Preset
                </Button>
              )}
              {onExportEntityToLibrary && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onExportEntityToLibrary(selectedEntity)}
                  title="Export this entity to the global MSX2 Entities Library (persists across projects). Reusable from any project via Libraries > Entities."
                >
                  Export to Library
                </Button>
              )}
              <Button size="sm" variant="danger" onClick={onRemoveSelectedEntity}>Delete Entity</Button>
            </div>
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
  onOpenTileStudio?: () => void;
  tileStudioOpen?: boolean;
}

const Msx2TileBehaviorBadge: React.FC<{ kind: Msx2Screen4TileBehaviorKind }> = ({ kind }) => (
  <span
    className="inline-block rounded px-1 py-0 text-[9px] font-medium text-black"
    style={{ backgroundColor: MSX2_TILE_BEHAVIOR_COLORS[kind] }}
    title={MSX2_TILE_BEHAVIOR_DESCRIPTIONS[kind]}
  >
    {MSX2_TILE_BEHAVIOR_LABELS[kind]}
  </span>
);

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
  onOpenTileStudio,
  tileStudioOpen = false,
}) => {
  const [behaviorFilter, setBehaviorFilter] = useState<Msx2Screen4TileBehaviorFilter>('all');
  const filteredTiles = useMemo(
    () => filterMsx2TilesByBehavior(tiles, behaviorFilter),
    [tiles, behaviorFilter]
  );
  const behaviorCounts = useMemo(() => countMsx2TilesByBehavior(tiles), [tiles]);

  return (
  <Panel
    title="MSX2 Tiles"
    collapsible
    leadingHeaderButtons={onOpenTileStudio ? (
      <button
        type="button"
        onClick={onOpenTileStudio}
        className="w-6 h-6 flex items-center justify-center rounded border border-msx-border bg-msx-bgcolor text-msx-textsecondary hover:text-msx-highlight hover:border-msx-highlight text-[11px]"
        title={tileStudioOpen ? 'Volver al mapa' : 'Abrir estudio de tiles'}
        aria-label={tileStudioOpen ? 'Volver al mapa' : 'Abrir estudio de tiles'}
      >
        {tileStudioOpen ? '↩' : '⛶'}
      </button>
    ) : undefined}
  >
    <div className="p-2 space-y-2">
      <label className="block space-y-1 text-xs">
        <span className="text-msx-textsecondary">Filtrar por comportamiento</span>
        <select
          value={behaviorFilter}
          onChange={event => setBehaviorFilter(event.target.value as Msx2Screen4TileBehaviorFilter)}
          className="w-full px-2 py-1 bg-msx-panelbg border border-msx-border rounded"
          aria-label="MSX2 tile behavior filter"
        >
          <option value="all">Todos ({tiles.length})</option>
          {MSX2_TILE_BEHAVIOR_KINDS.map(kind => (
            <option key={kind} value={kind}>
              {MSX2_TILE_BEHAVIOR_LABELS[kind]} ({behaviorCounts[kind]})
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-1">
        <Button size="sm" variant="secondary" onClick={onAddTile}>Add</Button>
        <Button size="sm" variant="secondary" onClick={onDuplicateTile}>Duplicate</Button>
        <Button size="sm" variant="danger" onClick={onClearTile}>Clear</Button>
      </div>
      {filteredTiles.length === 0 ? (
        <div className="text-xs text-msx-textsecondary">No hay tiles para este filtro.</div>
      ) : (
      <div className="grid grid-cols-2 gap-2">
        {filteredTiles.map(({ tile, index }) => (
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
                <span className="mt-1 block">
                  <Msx2TileBehaviorBadge kind={getMsx2TileBehaviorKind(tile)} />
                </span>
              </span>
            </span>
          </button>
        ))}
      </div>
      )}
    </div>
  </Panel>
  );
};

interface Msx2Screen4GridProps {
  map: number[][];
  slots: Screen5PaletteSlot[];
  tiles: Msx2Screen4Tile[];
  showGrid: boolean;
  mode: Msx2Screen4EditMode;
  layers: Msx2Screen4Layers;
  playerEntries?: Msx2PlayerEntry[];
  runtime: Msx2Screen4Runtime;
  selectionMode: boolean;
  selectionRect: Msx2Screen4SelectionRect | null;
  selectedEntityId: string | null;
  selectedPlayerEntryId?: string | null;
  showRuntimeOverlays: boolean;
  compositionOverlay: Msx2Screen4CompositionOverlay;
  isDrawing: boolean;
  onSetDrawing: (isDrawing: boolean) => void;
  onCellAction: (action: Msx2Screen4CellAction) => void;
  onSelectionChange: (rect: Msx2Screen4SelectionRect | null) => void;
  onSelectPlayerEntry?: (id: string | null) => void;
  onCreatePlayerEntryAt?: (x: number, y: number) => void;
  onMovePlayerEntry?: (id: string, x: number, y: number) => void;
  onRemovePlayerEntry?: (id: string) => void;
}

export const Msx2Screen4Grid: React.FC<Msx2Screen4GridProps> = ({
  map,
  slots,
  tiles,
  showGrid,
  mode,
  layers,
  playerEntries = [],
  runtime,
  selectionMode,
  selectionRect,
  selectedEntityId,
  selectedPlayerEntryId = null,
  showRuntimeOverlays,
  compositionOverlay,
  isDrawing,
  onSetDrawing,
  onCellAction,
  onSelectionChange,
  onSelectPlayerEntry,
  onCreatePlayerEntryAt,
  onMovePlayerEntry,
  onRemovePlayerEntry,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);
  const playerDragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  useEffect(() => {
    const stopPlayerDrag = () => {
      playerDragRef.current = null;
    };
    window.addEventListener('mouseup', stopPlayerDrag);
    return () => window.removeEventListener('mouseup', stopPlayerDrag);
  }, []);

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

    if (showRuntimeOverlays || mode === 'collision' || mode === 'effects' || mode === 'behavior' || mode === 'entities' || mode === 'playerEntries') {
      for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
          const px = x * TILE_SIZE * 2;
          const py = y * TILE_SIZE * 2;
          const collision = layers.collision[y]?.[x] || 0;
          const effect = layers.effects[y]?.[x] || 0;
          const behavior = layers.behavior?.[y]?.[x] || 0;
          const paintedTile = tiles[Math.max(0, Math.min(tiles.length - 1, map[y]?.[x] || 0))];
          const paintedBehavior = getMsx2TileBehaviorKind(paintedTile);
          if ((showRuntimeOverlays || mode === 'collision') && paintedBehavior === 'box') {
            ctx.fillStyle = 'rgba(245, 158, 11, 0.34)';
            ctx.fillRect(px, py, TILE_SIZE * 2, TILE_SIZE * 2);
          } else if ((showRuntimeOverlays || mode === 'collision') && collision) {
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

      if (showRuntimeOverlays || mode === 'playerEntries') {
        for (const entry of playerEntries) {
          const px = Math.round(entry.x) * 2;
          const py = Math.round(entry.y) * 2;
          ctx.fillStyle = '#FFE050';
          ctx.strokeStyle = entry.id === selectedPlayerEntryId ? '#40DFFF' : '#111827';
          ctx.lineWidth = entry.id === selectedPlayerEntryId ? 4 : 2;
          ctx.beginPath();
          ctx.arc(px, py, entry.id === selectedPlayerEntryId ? 11 : 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.lineWidth = 1;
          ctx.fillStyle = '#111827';
          ctx.font = 'bold 12px monospace';
          ctx.fillText('P', px - 4, py + 4);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '10px monospace';
          ctx.fillText(entry.id, px + 12, py + 4);
        }
      }
    }
  }, [map, slots, tiles, showGrid, mode, layers, playerEntries, runtime, selectionRect, selectedEntityId, selectedPlayerEntryId, showRuntimeOverlays, compositionOverlay]);

  const getCellFromEvent = (event: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * MAP_WIDTH);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * MAP_HEIGHT);
    if (x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT) return null;
    return { x, y };
  };

  const getPixelFromEvent = (event: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * MAP_PIXEL_WIDTH);
    const y = Math.round(((event.clientY - rect.top) / rect.height) * MAP_PIXEL_HEIGHT);
    if (x < 0 || y < 0 || x >= MAP_PIXEL_WIDTH || y >= MAP_PIXEL_HEIGHT) return null;
    return { x, y };
  };

  const getPlayerEntryAtPixel = (point: { x: number; y: number }): Msx2PlayerEntry | null => {
    const hitRadius = 14;
    for (let index = playerEntries.length - 1; index >= 0; index--) {
      const entry = playerEntries[index];
      const dx = point.x - Number(entry.x || 0);
      const dy = point.y - Number(entry.y || 0);
      if ((dx * dx) + (dy * dy) <= hitRadius * hitRadius) return entry;
    }
    return null;
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
    if (mode === 'playerEntries') {
      event.preventDefault();
      const pixel = getPixelFromEvent(event);
      if (!pixel) return;
      const hit = getPlayerEntryAtPixel(pixel);
      onSetDrawing(true);
      if (event.button === 2) {
        if (hit) onRemovePlayerEntry?.(hit.id);
        return;
      }
      if (hit) {
        onSelectPlayerEntry?.(hit.id);
        playerDragRef.current = {
          id: hit.id,
          offsetX: Number(hit.x || 0) - pixel.x,
          offsetY: Number(hit.y || 0) - pixel.y,
        };
        return;
      }
      onCreatePlayerEntryAt?.(pixel.x, pixel.y);
      return;
    }

    const cell = getCellFromEvent(event);
    if (!cell) return;
    onSetDrawing(true);
    if (selectionMode && mode !== 'entities' && mode !== 'playerEntries' && mode !== 'tile') {
      selectionStartRef.current = cell;
      onSelectionChange({ x: cell.x, y: cell.y, width: 1, height: 1 });
      return;
    }
    emitCellAction(event);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode === 'playerEntries' && playerDragRef.current) {
      const pixel = getPixelFromEvent(event);
      if (!pixel) return;
      const drag = playerDragRef.current;
      const x = Math.max(0, Math.min(MAP_PIXEL_WIDTH - 1, Math.round(pixel.x + drag.offsetX)));
      const y = Math.max(0, Math.min(MAP_PIXEL_HEIGHT - 1, Math.round(pixel.y + drag.offsetY)));
      onMovePlayerEntry?.(drag.id, x, y);
      return;
    }

    if (!isDrawing) return;
    const cell = getCellFromEvent(event);
    if (!cell) return;
    if (selectionMode && selectionStartRef.current && mode !== 'entities' && mode !== 'playerEntries' && mode !== 'tile') {
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
      className={`border border-msx-border bg-black ${mode === 'playerEntries' ? 'cursor-move' : ''}`}
      style={{ width: `${MAP_PIXEL_WIDTH * 2}px`, maxWidth: '100%', height: 'auto', aspectRatio: `${MAP_PIXEL_WIDTH} / ${MAP_PIXEL_HEIGHT}` }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={() => { playerDragRef.current = null; onSetDrawing(false); }}
      onMouseLeave={() => { if (!playerDragRef.current) onSetDrawing(false); }}
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
  onUpdateLineAttribute: (rowIndex: number, segmentIndex: number, attribute: Msx2Screen4LineAttribute) => void;
  onFillAllLineAttributeFg: () => void;
  onFillAllLineAttributeBg: () => void;
  onCopyLineAttribute: (rowIndex: number, segmentIndex: number) => void;
  onPasteLineAttribute: (rowIndex: number, segmentIndex: number) => void;
  copiedLineAttribute: Msx2Screen4LineAttribute | null;
  onFixInvalidPixels: () => void;
  onUpdateTileMeta: (patch: Partial<Pick<Msx2Screen4Tile, 'name' | 'behaviorKind' | 'hitbox'>>) => void;
  layout?: 'default' | 'controls' | 'canvas';
  canvasZoom?: number;
}

export type { Msx2Screen4TileEditorPanelProps };

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
  onUpdateLineAttribute,
  onFillAllLineAttributeFg,
  onFillAllLineAttributeBg,
  onCopyLineAttribute,
  onPasteLineAttribute,
  copiedLineAttribute,
  onFixInvalidPixels,
  onUpdateTileMeta,
  layout = 'default',
  canvasZoom = 16,
}) => {
  const tileCanvasRef = useRef<HTMLCanvasElement>(null);
  const tileWidth = getTilePixelWidth(selectedTile);
  const tileHeight = getTilePixelHeight(selectedTile);
  const behaviorKind = getMsx2TileBehaviorKind(selectedTile);
  const hitbox = useMemo(
    () => normalizeMsx2TileHitbox(selectedTile, tileWidth, tileHeight),
    [selectedTile, tileWidth, tileHeight]
  );
  const lineAttributes = useMemo(
    () => ensureLineAttributes(selectedTile.pixels, selectedTile.lineAttributes, tileWidth, tileHeight),
    [selectedTile.pixels, selectedTile.lineAttributes, tileWidth, tileHeight]
  );
  const colorLimitDiagnostics = useMemo(
    () => analyzeTileColorLimits(selectedTile.pixels),
    [selectedTile.pixels]
  );
  const numSegmentsPerRow = Math.max(1, tileWidth / SCREEN4_PIXELS_PER_COLOR_SEGMENT);

  useEffect(() => {
    const canvas = tileCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !selectedTile) return;
    const zoom = canvasZoom;
    canvas.width = tileWidth * zoom;
    canvas.height = tileHeight * zoom;
    ctx.imageSmoothingEnabled = false;
    for (let y = 0; y < tileHeight; y++) {
      for (let x = 0; x < tileWidth; x++) {
        const slot = selectedTile.pixels?.[y]?.[x] ?? 0;
        const hex = slots[slot]?.hex || '#000';
        ctx.fillStyle = hex === TRANSPARENT_HEX ? '#05070b' : hex;
        ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
        if (!isValidPixelSlot(x, y, slot, lineAttributes)) {
          ctx.fillStyle = 'rgba(255, 64, 64, 0.45)';
          ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
        }
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
    ctx.strokeStyle = 'rgba(255, 216, 64, 0.55)';
    for (let x = SCREEN4_PIXELS_PER_COLOR_SEGMENT; x < tileWidth; x += SCREEN4_PIXELS_PER_COLOR_SEGMENT) {
      ctx.beginPath();
      ctx.moveTo(x * zoom + 0.5, 0);
      ctx.lineTo(x * zoom + 0.5, tileHeight * zoom);
      ctx.stroke();
    }
    if (hitbox.width > 0 && hitbox.height > 0) {
      ctx.strokeStyle = MSX2_TILE_BEHAVIOR_COLORS[behaviorKind];
      ctx.lineWidth = 2;
      ctx.strokeRect(
        hitbox.offsetX * zoom + 1,
        hitbox.offsetY * zoom + 1,
        hitbox.width * zoom - 2,
        hitbox.height * zoom - 2
      );
      ctx.lineWidth = 1;
    }
  }, [selectedTile, slots, tileWidth, tileHeight, lineAttributes, hitbox, behaviorKind, canvasZoom]);

  const emitPixelAction = (event: React.MouseEvent<HTMLCanvasElement>, force = false) => {
    if (!force && !isDrawing) return;
    if (!force && (paintTool === 'fill' || paintTool === 'pick')) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * tileWidth);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * tileHeight);
    if (x < 0 || y < 0 || x >= tileWidth || y >= tileHeight || !selectedTile) return;
    onPixelAction(x, y, event.button);
  };

  const slotColor = (slot: number) => {
    const hex = slots[slot]?.hex || '#000000';
    return hex === TRANSPARENT_HEX ? '#111827' : hex;
  };

  const handleSetSegmentColor = (rowIndex: number, segmentIndex: number, type: 'fg' | 'bg') => {
    const current = lineAttributes[rowIndex]?.[segmentIndex];
    if (!current) return;
    onUpdateLineAttribute(rowIndex, segmentIndex, { ...current, [type]: activeSlot });
  };

  const handleHitboxChange = (key: keyof Msx2Screen4TileHitbox, rawValue: number) => {
    onUpdateTileMeta({
      hitbox: normalizeMsx2TileHitbox(
        { ...selectedTile, hitbox: { ...hitbox, [key]: rawValue } },
        tileWidth,
        tileHeight
      ),
    });
  };

  const tileCanvas = (
    <canvas
      ref={tileCanvasRef}
      className={`border border-msx-border bg-black cursor-crosshair ${layout === 'canvas' ? 'max-w-full max-h-full' : 'w-full'}`}
      style={layout === 'canvas' ? { imageRendering: 'pixelated' } : undefined}
      title="Left = FG, Right = BG"
      onMouseDown={event => { onSetDrawing(true); emitPixelAction(event, true); }}
      onMouseMove={event => emitPixelAction(event)}
      onMouseUp={() => onSetDrawing(false)}
      onMouseLeave={() => onSetDrawing(false)}
      onContextMenu={event => event.preventDefault()}
    />
  );

  const behaviorSection = (
    <div className="rounded border border-msx-border/70 p-2 space-y-2" aria-label="MSX2 tile behavior">
      <div className="text-xs font-medium text-msx-textsecondary">Comportamiento del tile</div>
      <label className="block space-y-1 text-xs">
        <span className="text-msx-textsecondary">Nombre</span>
        <input
          value={selectedTile.name}
          onChange={event => onUpdateTileMeta({ name: event.target.value })}
          className="w-full px-2 py-1 bg-msx-panelbg border border-msx-border rounded"
          aria-label="MSX2 tile name"
        />
      </label>
      <label className="block space-y-1 text-xs">
        <span className="text-msx-textsecondary">Tipo</span>
        <select
          value={behaviorKind}
          onChange={event => onUpdateTileMeta({ behaviorKind: event.target.value as Msx2Screen4TileBehaviorKind })}
          className="w-full px-2 py-1 bg-msx-panelbg border border-msx-border rounded"
          aria-label="MSX2 tile behavior kind"
        >
          {MSX2_TILE_BEHAVIOR_KINDS.map(kind => (
            <option key={kind} value={kind}>{MSX2_TILE_BEHAVIOR_LABELS[kind]}</option>
          ))}
        </select>
      </label>
      <div className="text-[0.65rem] text-msx-textsecondary">{MSX2_TILE_BEHAVIOR_DESCRIPTIONS[behaviorKind]}</div>
      {behaviorKind !== 'background' && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          {([
            ['offsetX', 'Hitbox X'],
            ['offsetY', 'Hitbox Y'],
            ['width', 'Ancho'],
            ['height', 'Alto'],
          ] as const).map(([key, label]) => (
            <label key={key} className="space-y-1">
              <span className="text-msx-textsecondary">{label}</span>
              <input
                type="number"
                min={0}
                max={key === 'offsetX' || key === 'width' ? tileWidth : tileHeight}
                value={hitbox[key]}
                onChange={event => handleHitboxChange(key, Number(event.target.value))}
                className="w-full px-2 py-1 bg-msx-panelbg border border-msx-border rounded"
                aria-label={`MSX2 tile hitbox ${key}`}
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );

  const paintControls = (
    <>
      <div className="rounded border border-msx-border/70 p-2 space-y-2" aria-label="MSX2 tile paint">
        <div className="text-xs font-medium text-msx-textsecondary">Pintura SCREEN 4</div>
        <div className="text-[0.65rem] text-msx-textsecondary leading-snug">
          Máx. 2 colores por segmento de 8 px. Clic izquierdo = primer plano, derecho = fondo.
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-msx-textsecondary">Color activo · slot {activeSlot}</span>
          <span
            className="inline-block w-6 h-6 rounded border border-msx-border shadow-inner"
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
        <div className="space-y-1" aria-label="MSX2 tile paint tools">
          <div className="text-[0.65rem] text-msx-textsecondary">Herramientas</div>
          <div className="flex gap-1">
            {MSX2_TILE_PAINT_TOOLS.map(({ tool, label, title, icon }) => (
              <Msx2TileIconToolButton
                key={tool}
                title={title}
                ariaLabel={`MSX2 tile tool ${tool}`}
                active={paintTool === tool}
                onClick={() => onPaintToolChange(tool)}
              >
                {icon}
              </Msx2TileIconToolButton>
            ))}
          </div>
          <div className="text-[0.6rem] text-msx-textsecondary">
            {MSX2_TILE_PAINT_TOOLS.find(entry => entry.tool === paintTool)?.label ?? 'Lápiz'}
          </div>
        </div>
      </div>
      <div className="rounded border border-msx-border/70 p-2 space-y-2" aria-label="MSX2 SCREEN 4 line attributes">
        <div className="text-xs text-msx-textsecondary">Line attributes (FG/BG per 8 px segment)</div>
        <div className="flex gap-1">
          <Button size="sm" variant="secondary" onClick={onFillAllLineAttributeFg} title="Set all segment FG slots to active color">
            Fill all FG
          </Button>
          <Button size="sm" variant="secondary" onClick={onFillAllLineAttributeBg} title="Set all segment BG slots to active color">
            Fill all BG
          </Button>
        </div>
        <div className="max-h-40 overflow-auto space-y-1">
          {lineAttributes.map((rowAttrs, rowIndex) => (
            <div key={`line-row-${rowIndex}`} className="flex items-center gap-1 text-[0.65rem]">
              <span className="w-5 text-msx-textsecondary">{rowIndex}</span>
              {rowAttrs.map((attr, segmentIndex) => (
                <div key={`${rowIndex}-${segmentIndex}`} className="flex items-center gap-0.5">
                  <button
                    type="button"
                    className="h-4 w-4 rounded border border-msx-border"
                    style={{ backgroundColor: slotColor(attr.fg) }}
                    onClick={() => handleSetSegmentColor(rowIndex, segmentIndex, 'fg')}
                    title={`Row ${rowIndex} seg ${segmentIndex} FG slot ${attr.fg}`}
                    aria-label={`Row ${rowIndex} segment ${segmentIndex} foreground`}
                  />
                  <button
                    type="button"
                    className="h-4 w-4 rounded border border-msx-border"
                    style={{ backgroundColor: slotColor(attr.bg) }}
                    onClick={() => handleSetSegmentColor(rowIndex, segmentIndex, 'bg')}
                    title={`Row ${rowIndex} seg ${segmentIndex} BG slot ${attr.bg}`}
                    aria-label={`Row ${rowIndex} segment ${segmentIndex} background`}
                  />
                  <Button size="sm" variant="ghost" className="px-1 py-0 text-[0.6rem]" onClick={() => onCopyLineAttribute(rowIndex, segmentIndex)}>C</Button>
                  <Button size="sm" variant="ghost" className="px-1 py-0 text-[0.6rem]" disabled={!copiedLineAttribute} onClick={() => onPasteLineAttribute(rowIndex, segmentIndex)}>P</Button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {colorLimitDiagnostics.length > 0 && (
        <div className="rounded border border-red-500/50 bg-red-950/20 p-2 text-xs space-y-1">
          <div>{colorLimitDiagnostics.length} segment row(s) exceed 2 colors.</div>
          <Button size="sm" variant="secondary" onClick={onFixInvalidPixels} aria-label="Fix invalid SCREEN 4 tile pixels">
            Fix invalid pixels
          </Button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <label className="space-y-1">
          <span className="text-msx-textsecondary">Ancho</span>
          <select
            value={tileWidth}
            onChange={event => onResizeTile(Number(event.target.value), tileHeight)}
            className="w-full px-2 py-1 bg-msx-panelbg border border-msx-border rounded"
            aria-label="MSX2 tile width"
          >
            {dimensionOptions.map(size => <option key={size} value={size}>{size}px</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-msx-textsecondary">Alto</span>
          <select
            value={tileHeight}
            onChange={event => onResizeTile(tileWidth, Number(event.target.value))}
            className="w-full px-2 py-1 bg-msx-panelbg border border-msx-border rounded"
            aria-label="MSX2 tile height"
          >
            {dimensionOptions.map(size => <option key={size} value={size}>{size}px</option>)}
          </select>
        </label>
      </div>
      <div className="rounded border border-msx-border/70 p-2 space-y-2" aria-label="MSX2 tile transforms">
        <div className="text-xs font-medium text-msx-textsecondary">Transformaciones</div>
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1">
            <Msx2TileIconToolButton
              title="Rellenar tile con el color activo"
              ariaLabel="MSX2 fill tile"
              onClick={onFillTile}
            >
              <PaintBrushIcon className="w-4 h-4" />
            </Msx2TileIconToolButton>
            <span className="text-[0.55rem] text-msx-textsecondary">Rellenar</span>
          </div>
          <div className="w-px self-stretch bg-msx-border/80" aria-hidden />
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-1">
              <Msx2TileIconToolButton
                title="Espejo horizontal"
                ariaLabel="MSX2 flip tile horizontal"
                onClick={onFlipHorizontal}
              >
                <SwapHorizIcon className="w-4 h-4" />
              </Msx2TileIconToolButton>
              <Msx2TileIconToolButton
                title="Espejo vertical"
                ariaLabel="MSX2 flip tile vertical"
                onClick={onFlipVertical}
              >
                <SwapVertIcon className="w-4 h-4" />
              </Msx2TileIconToolButton>
            </div>
            <span className="text-[0.55rem] text-msx-textsecondary">Espejo</span>
          </div>
          <div className="w-px self-stretch bg-msx-border/80" aria-hidden />
          <div className="flex flex-col items-center gap-1">
            <div className="grid grid-cols-3 gap-0.5">
              <span aria-hidden />
              <Msx2TileIconToolButton
                title="Desplazar tile hacia arriba"
                ariaLabel="MSX2 shift tile up"
                onClick={() => onShiftTile(0, -1)}
              >
                <ArrowUpIcon className="w-4 h-4" />
              </Msx2TileIconToolButton>
              <span aria-hidden />
              <Msx2TileIconToolButton
                title="Desplazar tile hacia la izquierda"
                ariaLabel="MSX2 shift tile left"
                onClick={() => onShiftTile(-1, 0)}
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </Msx2TileIconToolButton>
              <span className="h-8 w-8 flex items-center justify-center rounded-md border border-dashed border-msx-border/60 text-[0.55rem] text-msx-textsecondary">
                1px
              </span>
              <Msx2TileIconToolButton
                title="Desplazar tile hacia la derecha"
                ariaLabel="MSX2 shift tile right"
                onClick={() => onShiftTile(1, 0)}
              >
                <ArrowRightIcon className="w-4 h-4" />
              </Msx2TileIconToolButton>
              <span aria-hidden />
              <Msx2TileIconToolButton
                title="Desplazar tile hacia abajo"
                ariaLabel="MSX2 shift tile down"
                onClick={() => onShiftTile(0, 1)}
              >
                <ArrowDownIcon className="w-4 h-4" />
              </Msx2TileIconToolButton>
              <span aria-hidden />
            </div>
            <span className="text-[0.55rem] text-msx-textsecondary">Mover</span>
          </div>
        </div>
      </div>
    </>
  );

  if (layout === 'canvas') {
    return (
      <div className="flex flex-col items-center gap-2 w-full h-full justify-center">
        {tileCanvas}
        <div className="text-[0.65rem] text-msx-textsecondary text-center max-w-md">
          Tile {selectedTileIndex}: {tileWidth}x{tileHeight}px — Left = FG, Right = BG. Hitbox outline matches behavior color.
        </div>
      </div>
    );
  }

  const controlsBody = (
    <div className="p-2 space-y-2">
      {behaviorSection}
      {paintControls}
      {layout === 'default' && tileCanvas}
      {layout === 'default' && (
        <div className="text-[0.65rem] text-msx-textsecondary">
          Segments: {numSegmentsPerRow} per row. Invalid pixels shown in red until fixed. Hitbox outline matches tile behavior color.
        </div>
      )}
    </div>
  );

  if (layout === 'controls') {
    return (
      <div className="bg-msx-panelbg border border-msx-border rounded-md shadow-lg flex flex-col h-full">
        <h3 className="font-sans text-sm text-msx-textprimary p-2 border-b border-msx-border">
          Propiedades — Tile {selectedTileIndex}
        </h3>
        <div className="flex-grow overflow-auto">{controlsBody}</div>
      </div>
    );
  }

  return (
    <Panel title={`MSX2 Edit Tile ${selectedTileIndex}`} collapsible>
      {controlsBody}
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
