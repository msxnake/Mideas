import React, { useEffect, useRef } from 'react';
import { MSXColorValue, Msx2EntityKind, Msx2Screen5EntityInstance, Msx2Screen5Layers, Msx2Screen5Runtime, Msx2Screen5Tile, Screen5PaletteSlot } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';

export type Msx2Screen5EditMode = 'visual' | 'collision' | 'effects' | 'behavior' | 'entities' | 'tile';

export const SCREEN_WIDTH = 256;
export const SCREEN_HEIGHT = 212;
export const TILE_SIZE = 16;
export const MAP_WIDTH = 16;
export const MAP_HEIGHT = 14;
export const MAP_PIXEL_WIDTH = MAP_WIDTH * TILE_SIZE;
export const MAP_PIXEL_HEIGHT = MAP_HEIGHT * TILE_SIZE;
export const TRANSPARENT_HEX = 'rgba(0,0,0,0)';

export interface Msx2Screen5CellAction {
  x: number;
  y: number;
  button: number;
}

interface Msx2Screen5ToolbarProps {
  screenName: string;
  onScreenNameChange: (name: string) => void;
  mode: Msx2Screen5EditMode;
  onModeChange: (mode: Msx2Screen5EditMode) => void;
  selectedEffectCode: number;
  onSelectedEffectCodeChange: (code: number) => void;
  selectedBehaviorCode: number;
  onSelectedBehaviorCodeChange: (code: number) => void;
  showGrid: boolean;
  onShowGridChange: (showGrid: boolean) => void;
  showRuntimeOverlays: boolean;
  onShowRuntimeOverlaysChange: (showRuntimeOverlays: boolean) => void;
  runtime: Msx2Screen5Runtime;
  onRuntimeChange: (runtime: Msx2Screen5Runtime) => void;
  canCopyLayer: boolean;
  canPasteLayer: boolean;
  onCopyLayer: () => void;
  onPasteLayer: () => void;
}

export const Msx2Screen5Toolbar: React.FC<Msx2Screen5ToolbarProps> = ({
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
  runtime,
  onRuntimeChange,
  canCopyLayer,
  canPasteLayer,
  onCopyLayer,
  onPasteLayer,
}) => {
  const numberInputClass = 'w-full px-2 py-1 bg-msx-panelbg border border-msx-border rounded';
  const updateRuntimeArea = (patch: Partial<Msx2Screen5Runtime>) => {
    const next = { ...runtime, ...patch };
    const x = Math.max(0, Math.min(MAP_WIDTH - 1, Number(next.activeAreaX) || 0));
    const y = Math.max(0, Math.min(MAP_HEIGHT - 1, Number(next.activeAreaY) || 0));
    const width = Math.max(1, Math.min(MAP_WIDTH - x, Number(next.activeAreaWidth) || MAP_WIDTH - x));
    const height = Math.max(1, Math.min(MAP_HEIGHT - y, Number(next.activeAreaHeight) || MAP_HEIGHT - y));
    onRuntimeChange({ ...next, activeAreaX: x, activeAreaY: y, activeAreaWidth: width, activeAreaHeight: height });
  };
  const layerButton = (layer: Msx2Screen5EditMode, label: string) => (
    <Button size="sm" variant={mode === layer ? 'primary' : 'secondary'} onClick={() => onModeChange(layer)}>
      {label}
    </Button>
  );

  return (
    <Panel title="MSX2 Screen">
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
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="secondary" onClick={onCopyLayer} disabled={!canCopyLayer}>Copy Layer</Button>
          <Button size="sm" variant="secondary" onClick={onPasteLayer} disabled={!canPasteLayer}>Paste Layer</Button>
        </div>
        <div className="text-msx-textsecondary">
          16x14 tiles, 16x16 px. The visible SCREEN 5 crop is marked at 256x212.
        </div>
        <div className="text-msx-textsecondary">
          Runtime: {runtime.screenKind} / {runtime.screenEngine}
        </div>
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

interface Msx2Screen5EntityPanelProps {
  mode: Msx2Screen5EditMode;
  selectedEntity: Msx2Screen5EntityInstance | null;
  onUpdateSelectedEntity: (patch: Partial<Msx2Screen5EntityInstance>) => void;
  onUpdateSelectedEntityParams: (patch: Record<string, any>) => void;
  onRemoveSelectedEntity: () => void;
}

export const Msx2Screen5EntityPanel: React.FC<Msx2Screen5EntityPanelProps> = ({
  mode,
  selectedEntity,
  onUpdateSelectedEntity,
  onUpdateSelectedEntityParams,
  onRemoveSelectedEntity,
}) => {
  if (mode !== 'entities') return null;
  const numberInputClass = 'w-full px-2 py-1 bg-msx-panelbg border border-msx-border rounded';

  return (
    <Panel title="Entity Properties">
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
                <option value="player">Player</option>
                <option value="enemy">Enemy</option>
                <option value="hazard">Hazard</option>
                <option value="collectible">Collectible</option>
                <option value="door">Door</option>
                <option value="custom">Custom</option>
              </select>
              <select
                value={selectedEntity.params?.movement || 'static'}
                onChange={event => {
                  const movement = event.target.value;
                  if (movement === 'static') {
                    onUpdateSelectedEntity({ params: {} });
                    return;
                  }
                  onUpdateSelectedEntityParams({
                    movement,
                    direction: Number(selectedEntity.params?.direction) || 1,
                    minX: selectedEntity.params?.minX ?? selectedEntity.position.x,
                    maxX: selectedEntity.params?.maxX ?? Math.min(MAP_WIDTH - 1, selectedEntity.position.x + 4),
                    minY: selectedEntity.params?.minY ?? selectedEntity.position.y,
                    maxY: selectedEntity.params?.maxY ?? Math.min(MAP_HEIGHT - 1, selectedEntity.position.y + 4),
                  });
                }}
                className={numberInputClass}
                aria-label="Entity movement"
              >
                <option value="static">Static</option>
                <option value="patrolX">Patrol X</option>
                <option value="patrolY">Patrol Y</option>
              </select>
            </div>
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
            {selectedEntity.params?.movement && selectedEntity.params.movement !== 'static' && (
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
          </>
        ) : (
          <div className="text-msx-textsecondary">No entity selected.</div>
        )}
      </div>
    </Panel>
  );
};

interface Msx2Screen5TilesPanelProps {
  tiles: Msx2Screen5Tile[];
  selectedTileIndex: number;
  onSelectTileIndex: (index: number) => void;
  onAddTile: () => void;
  onDuplicateTile: () => void;
  onClearTile: () => void;
}

export const Msx2Screen5TilesPanel: React.FC<Msx2Screen5TilesPanelProps> = ({
  tiles,
  selectedTileIndex,
  onSelectTileIndex,
  onAddTile,
  onDuplicateTile,
  onClearTile,
}) => (
  <Panel title="Tiles 16x16">
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
            className={`text-left px-2 py-1 rounded border text-xs ${index === selectedTileIndex ? 'border-msx-highlight bg-msx-highlight/20' : 'border-msx-border bg-msx-panelbg'}`}
            onClick={() => onSelectTileIndex(index)}
          >
            {index}: {tile.name}
          </button>
        ))}
      </div>
    </div>
  </Panel>
);

interface Msx2Screen5GridProps {
  map: number[][];
  slots: Screen5PaletteSlot[];
  tiles: Msx2Screen5Tile[];
  showGrid: boolean;
  mode: Msx2Screen5EditMode;
  layers: Msx2Screen5Layers;
  runtime: Msx2Screen5Runtime;
  selectedEntityId: string | null;
  showRuntimeOverlays: boolean;
  isDrawing: boolean;
  onSetDrawing: (isDrawing: boolean) => void;
  onCellAction: (action: Msx2Screen5CellAction) => void;
}

export const Msx2Screen5Grid: React.FC<Msx2Screen5GridProps> = ({
  map,
  slots,
  tiles,
  showGrid,
  mode,
  layers,
  runtime,
  selectedEntityId,
  showRuntimeOverlays,
  isDrawing,
  onSetDrawing,
  onCellAction,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
        for (let py = 0; py < TILE_SIZE; py++) {
          for (let px = 0; px < TILE_SIZE; px++) {
            const slot = tile.pixels[py][px] & 0x0f;
            const hex = slots[slot]?.hex || '#000000';
            ctx.fillStyle = hex === TRANSPARENT_HEX ? '#000000' : hex;
            ctx.fillRect(((mx * TILE_SIZE) + px) * 2, ((my * TILE_SIZE) + py) * 2, 2, 2);
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
        }
      }
    }
  }, [map, slots, tiles, showGrid, mode, layers, runtime, selectedEntityId, showRuntimeOverlays]);

  const emitCellAction = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * MAP_WIDTH);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * MAP_HEIGHT);
    if (x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT) return;
    onCellAction({ x, y, button: event.button });
  };

  return (
    <canvas
      ref={canvasRef}
      className="border border-msx-border bg-black"
      style={{ width: `${MAP_PIXEL_WIDTH * 2}px`, maxWidth: '100%', height: 'auto', aspectRatio: `${MAP_PIXEL_WIDTH} / ${MAP_PIXEL_HEIGHT}` }}
      onMouseDown={event => { onSetDrawing(true); emitCellAction(event); }}
      onMouseMove={event => { if (isDrawing && (mode === 'visual' || mode === 'collision' || mode === 'effects' || mode === 'behavior')) emitCellAction(event); }}
      onContextMenu={event => event.preventDefault()}
    />
  );
};

interface Msx2Screen5TileEditorPanelProps {
  selectedTileIndex: number;
  selectedTile: Msx2Screen5Tile;
  slots: Screen5PaletteSlot[];
  activeSlot: number;
  isDrawing: boolean;
  onSetDrawing: (isDrawing: boolean) => void;
  onPixelAction: (x: number, y: number, button: number) => void;
}

export const Msx2Screen5TileEditorPanel: React.FC<Msx2Screen5TileEditorPanelProps> = ({
  selectedTileIndex,
  selectedTile,
  slots,
  activeSlot,
  isDrawing,
  onSetDrawing,
  onPixelAction,
}) => {
  const tileCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = tileCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !selectedTile) return;
    const zoom = 16;
    canvas.width = TILE_SIZE * zoom;
    canvas.height = TILE_SIZE * zoom;
    ctx.imageSmoothingEnabled = false;
    for (let y = 0; y < TILE_SIZE; y++) {
      for (let x = 0; x < TILE_SIZE; x++) {
        const hex = slots[selectedTile.pixels[y][x]]?.hex || '#000';
        ctx.fillStyle = hex === TRANSPARENT_HEX ? '#05070b' : hex;
        ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
      }
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    for (let i = 0; i <= TILE_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * zoom + 0.5, 0);
      ctx.lineTo(i * zoom + 0.5, TILE_SIZE * zoom);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * zoom + 0.5);
      ctx.lineTo(TILE_SIZE * zoom, i * zoom + 0.5);
      ctx.stroke();
    }
  }, [selectedTile, slots]);

  const emitPixelAction = (event: React.MouseEvent<HTMLCanvasElement>, force = false) => {
    if (!force && !isDrawing) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * TILE_SIZE);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * TILE_SIZE);
    if (x < 0 || y < 0 || x >= TILE_SIZE || y >= TILE_SIZE || !selectedTile) return;
    onPixelAction(x, y, event.button);
  };

  return (
    <Panel title={`Edit Tile ${selectedTileIndex}`}>
      <div className="p-2 space-y-2">
        <div className="flex items-center justify-between text-xs text-msx-textsecondary">
          <span>Color slot {activeSlot}</span>
          <span
            className="inline-block w-5 h-5 rounded border border-msx-border"
            style={{ backgroundColor: slots[activeSlot]?.hex === TRANSPARENT_HEX ? '#111827' : slots[activeSlot]?.hex }}
          />
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

interface Msx2Screen5ExportModelPanelProps {
  layers: Msx2Screen5Layers;
}

export const Msx2Screen5ExportModelPanel: React.FC<Msx2Screen5ExportModelPanelProps> = ({ layers }) => (
  <Panel title="Export Model">
    <div className="p-2 text-xs text-msx-textsecondary space-y-1">
      <div>Tile raw size: 128 bytes</div>
      <div>Map size: 224 bytes</div>
      <div>Collision layer: 224 bytes</div>
      <div>Effects layer: 224 bytes</div>
      <div>Behavior layer: 224 bytes</div>
      <div>Entities: {layers.entities.length}</div>
      <div>Current backend: emits packed 16x16 tiles plus runtime layers.</div>
    </div>
  </Panel>
);

interface Msx2Screen5StatusBarProps {
  mode: Msx2Screen5EditMode;
  selectedTileIndex: number;
  selectedEffectCode: number;
  selectedBehaviorCode: number;
  layers: Msx2Screen5Layers;
  runtime: Msx2Screen5Runtime;
}

export const Msx2Screen5StatusBar: React.FC<Msx2Screen5StatusBarProps> = ({
  mode,
  selectedTileIndex,
  selectedEffectCode,
  selectedBehaviorCode,
  layers,
  runtime,
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
      Size: 16x14 / 256x224 map / 256x212 visible
    </div>
  );
};
