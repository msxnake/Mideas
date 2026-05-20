import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MSXColorValue, Msx2EntityKind, Msx2Screen5EntityInstance, Msx2Screen5Layers, Msx2Screen5Runtime, Msx2Screen5Tile, Msx2Screen5TileScreen } from '../../types';
import { ensureScreen5PaletteSlots } from '../../utils/screen5PaletteUtils';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';

interface Msx2Screen5TileScreenEditorProps {
  screen: Msx2Screen5TileScreen;
  onUpdate: (data: Partial<Msx2Screen5TileScreen>) => void;
  selectedColor: MSXColorValue;
}

const SCREEN_WIDTH = 256;
const SCREEN_HEIGHT = 212;
const TILE_SIZE = 16;
const MAP_WIDTH = 16;
const MAP_HEIGHT = 14;
const TRANSPARENT_HEX = 'rgba(0,0,0,0)';

const createTilePixels = (slot = 0): number[][] =>
  Array.from({ length: TILE_SIZE }, () => Array.from({ length: TILE_SIZE }, () => slot));

const cloneTile = (tile: Msx2Screen5Tile): Msx2Screen5Tile => ({
  ...tile,
  pixels: tile.pixels.map(row => [...row]),
});

const normalizeTiles = (tiles?: Msx2Screen5Tile[]): Msx2Screen5Tile[] => {
  const source = tiles?.length ? tiles : [{ id: 'tile_0', name: 'Tile 0', pixels: createTilePixels(0) }];
  return source.map((tile, index) => ({
    id: tile.id || `tile_${index}`,
    name: tile.name || `Tile ${index}`,
    pixels: Array.from({ length: TILE_SIZE }, (_, y) =>
      Array.from({ length: TILE_SIZE }, (_, x) => Math.max(0, Math.min(15, Number(tile.pixels?.[y]?.[x]) || 0)))
    ),
  }));
};

const normalizeMap = (map: number[][] | undefined, tileCount: number): number[][] =>
  Array.from({ length: MAP_HEIGHT }, (_, y) =>
    Array.from({ length: MAP_WIDTH }, (_, x) => Math.max(0, Math.min(Math.max(0, tileCount - 1), Number(map?.[y]?.[x]) || 0)))
  );

const normalizeByteLayer = (layer: number[][] | undefined, fallback?: number[][]): number[][] =>
  Array.from({ length: MAP_HEIGHT }, (_, y) =>
    Array.from({ length: MAP_WIDTH }, (_, x) => Math.max(0, Math.min(255, Number(layer?.[y]?.[x] ?? fallback?.[y]?.[x] ?? 0) || 0)))
  );

const normalizeEntities = (entities?: Msx2Screen5EntityInstance[]): Msx2Screen5EntityInstance[] =>
  (entities || []).map((entity, index) => ({
    id: entity.id || `msx2_entity_${index}`,
    name: entity.name || `Entity ${index + 1}`,
    kind: entity.kind || 'custom',
    position: {
      x: Math.max(0, Math.min(MAP_WIDTH - 1, Number(entity.position?.x) || 0)),
      y: Math.max(0, Math.min(MAP_HEIGHT - 1, Number(entity.position?.y) || 0)),
    },
    spriteAssetId: entity.spriteAssetId,
    params: entity.params || {},
  }));

const normalizeLayers = (screen: Msx2Screen5TileScreen): Msx2Screen5Layers => ({
  collision: normalizeByteLayer(screen.layers?.collision, screen.collisionMap),
  effects: normalizeByteLayer(screen.layers?.effects),
  behavior: normalizeByteLayer(screen.layers?.behavior),
  entities: normalizeEntities(screen.layers?.entities),
});

const normalizeRuntime = (runtime?: Msx2Screen5Runtime): Msx2Screen5Runtime => ({
  screenKind: runtime?.screenKind || 'playable',
  screenEngine: runtime?.screenEngine || 'player',
  activeAreaX: Math.max(0, Math.min(MAP_WIDTH - 1, Number(runtime?.activeAreaX) || 0)),
  activeAreaY: Math.max(0, Math.min(MAP_HEIGHT - 1, Number(runtime?.activeAreaY) || 0)),
  activeAreaWidth: Math.max(1, Math.min(MAP_WIDTH, Number(runtime?.activeAreaWidth) || MAP_WIDTH)),
  activeAreaHeight: Math.max(1, Math.min(MAP_HEIGHT, Number(runtime?.activeAreaHeight) || MAP_HEIGHT)),
});

export const Msx2Screen5TileScreenEditor: React.FC<Msx2Screen5TileScreenEditorProps> = ({ screen, onUpdate, selectedColor }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tileCanvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTileIndex, setSelectedTileIndex] = useState(0);
  const [mode, setMode] = useState<'visual' | 'collision' | 'effects' | 'behavior' | 'entities' | 'tile'>('visual');
  const [selectedEffectCode, setSelectedEffectCode] = useState(1);
  const [selectedBehaviorCode, setSelectedBehaviorCode] = useState(1);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);

  const { slots, changed } = useMemo(() => ensureScreen5PaletteSlots(screen.palette), [screen.palette]);
  const tiles = useMemo(() => normalizeTiles(screen.tiles), [screen.tiles]);
  const map = useMemo(() => normalizeMap(screen.map, tiles.length), [screen.map, tiles.length]);
  const layers = useMemo(() => normalizeLayers(screen), [screen]);
  const runtime = useMemo(() => normalizeRuntime(screen.runtime), [screen.runtime]);
  const selectedTile = tiles[Math.max(0, Math.min(tiles.length - 1, selectedTileIndex))];
  const selectedEntity = useMemo(
    () => layers.entities.find(entity => entity.id === selectedEntityId) || null,
    [layers.entities, selectedEntityId]
  );
  const activeSlot = useMemo(() => {
    const exact = slots.find(slot => slot.hex === selectedColor)?.slotIndex;
    return typeof exact === 'number' ? exact : 0;
  }, [selectedColor, slots]);

  useEffect(() => {
    if (changed) onUpdate({ palette: slots.map(slot => ({ ...slot })) });
  }, [changed, onUpdate, slots]);

  useEffect(() => {
    if (!screen.layers || !screen.layers.behavior || !screen.runtime) {
      onUpdate({
        layers,
        runtime,
        collisionMap: layers.collision,
      });
    }
  }, [layers, onUpdate, runtime, screen.layers, screen.runtime]);

  useEffect(() => {
    setSelectedTileIndex(index => Math.max(0, Math.min(tiles.length - 1, index)));
  }, [tiles.length]);

  useEffect(() => {
    if (selectedEntityId && !layers.entities.some(entity => entity.id === selectedEntityId)) {
      setSelectedEntityId(null);
    }
  }, [layers.entities, selectedEntityId]);

  useEffect(() => {
    const stop = () => setIsDrawing(false);
    window.addEventListener('mouseup', stop);
    return () => window.removeEventListener('mouseup', stop);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.width = SCREEN_WIDTH * 2;
    canvas.height = SCREEN_HEIGHT * 2;
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
        ctx.lineTo(SCREEN_WIDTH * 2 + 0.5, y * TILE_SIZE * 2 + 0.5);
        ctx.stroke();
      }
    }

    if (mode === 'collision' || mode === 'effects' || mode === 'behavior' || mode === 'entities') {
      for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
          const px = x * TILE_SIZE * 2;
          const py = y * TILE_SIZE * 2;
          const collision = layers.collision[y]?.[x] || 0;
          const effect = layers.effects[y]?.[x] || 0;
          const behavior = layers.behavior?.[y]?.[x] || 0;
          if (mode === 'collision' && collision) {
            ctx.fillStyle = 'rgba(255, 64, 64, 0.42)';
            ctx.fillRect(px, py, TILE_SIZE * 2, TILE_SIZE * 2);
          }
          if (mode === 'effects' && effect) {
            ctx.fillStyle = effect === 1 ? 'rgba(255, 80, 80, 0.40)' : effect === 2 ? 'rgba(255, 216, 64, 0.42)' : 'rgba(80, 220, 255, 0.38)';
            ctx.fillRect(px, py, TILE_SIZE * 2, TILE_SIZE * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '18px monospace';
            ctx.fillText(String(effect), px + 8, py + 22);
          }
          if (mode === 'behavior' && behavior) {
            ctx.fillStyle = behavior === 1 ? 'rgba(64, 220, 120, 0.40)' : 'rgba(255, 160, 48, 0.42)';
            ctx.fillRect(px, py, TILE_SIZE * 2, TILE_SIZE * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '18px monospace';
            ctx.fillText(String(behavior), px + 8, py + 22);
          }
        }
      }

      if (mode === 'entities') {
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
  }, [map, slots, tiles, showGrid, mode, layers, selectedEntityId]);

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

  const updateLayers = (nextLayers: Msx2Screen5Layers) => {
    onUpdate({
      layers: nextLayers,
      collisionMap: nextLayers.collision,
    });
  };

  const updateSelectedEntity = (patch: Partial<Msx2Screen5EntityInstance>) => {
    if (!selectedEntity) return;
    updateLayers({
      ...layers,
      entities: layers.entities.map(entity =>
        entity.id === selectedEntity.id
          ? { ...entity, ...patch, params: patch.params ?? entity.params }
          : entity
      ),
    });
  };

  const updateSelectedEntityParams = (patch: Record<string, any>) => {
    if (!selectedEntity) return;
    updateSelectedEntity({ params: { ...(selectedEntity.params || {}), ...patch } });
  };

  const removeSelectedEntity = () => {
    if (!selectedEntity) return;
    updateLayers({ ...layers, entities: layers.entities.filter(entity => entity.id !== selectedEntity.id) });
    setSelectedEntityId(null);
  };

  const handleMapCanvasPaint = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * MAP_WIDTH);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * MAP_HEIGHT);
    if (x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT) return;

    if (mode === 'visual') {
      const next = map.map(row => [...row]);
      next[y][x] = selectedTileIndex;
      onUpdate({ map: next });
      return;
    }

    if (mode === 'collision') {
      const next = { ...layers, collision: layers.collision.map(row => [...row]) };
      next.collision[y][x] = event.button === 2 ? 0 : (next.collision[y][x] ? 0 : 1);
      updateLayers(next);
      return;
    }

    if (mode === 'effects') {
      const next = { ...layers, effects: layers.effects.map(row => [...row]) };
      next.effects[y][x] = event.button === 2 ? 0 : selectedEffectCode;
      updateLayers(next);
      return;
    }

    if (mode === 'behavior') {
      const nextBehavior = (layers.behavior || normalizeByteLayer(undefined)).map(row => [...row]);
      nextBehavior[y][x] = event.button === 2 ? 0 : selectedBehaviorCode;
      updateLayers({ ...layers, behavior: nextBehavior });
      return;
    }

    if (mode === 'entities') {
      const existing = layers.entities.find(entity => entity.position.x === x && entity.position.y === y);
      if (event.button === 2) {
        if (existing?.id === selectedEntityId) setSelectedEntityId(null);
        updateLayers({ ...layers, entities: layers.entities.filter(entity => entity.id !== existing?.id) });
        return;
      }
      if (existing) {
        setSelectedEntityId(existing.id);
        return;
      }
      const id = `msx2_entity_${Date.now()}`;
      const nextEntity: Msx2Screen5EntityInstance = {
        id,
        name: `Entity ${layers.entities.length + 1}`,
        kind: layers.entities.some(entity => entity.kind === 'player') ? 'enemy' : 'player',
        position: { x, y },
        params: {},
      };
      updateLayers({ ...layers, entities: [...layers.entities, nextEntity] });
      setSelectedEntityId(id);
    }
  };

  const paintTilePixel = (event: React.MouseEvent<HTMLCanvasElement>, force = false) => {
    if (!force && !isDrawing) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * TILE_SIZE);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * TILE_SIZE);
    if (x < 0 || y < 0 || x >= TILE_SIZE || y >= TILE_SIZE || !selectedTile) return;
    const nextTiles = tiles.map(cloneTile);
    nextTiles[selectedTileIndex].pixels[y][x] = event.button === 2 ? 0 : activeSlot;
    onUpdate({ tiles: nextTiles });
  };

  const addTile = () => {
    const nextTiles = [...tiles.map(cloneTile), { id: `tile_${Date.now()}`, name: `Tile ${tiles.length}`, pixels: createTilePixels(0) }];
    onUpdate({ tiles: nextTiles });
    setSelectedTileIndex(nextTiles.length - 1);
  };

  const duplicateTile = () => {
    const copy = cloneTile(selectedTile);
    copy.id = `tile_${Date.now()}`;
    copy.name = `${selectedTile.name} copy`;
    const nextTiles = [...tiles.map(cloneTile), copy];
    onUpdate({ tiles: nextTiles });
    setSelectedTileIndex(nextTiles.length - 1);
  };

  const clearTile = () => {
    const nextTiles = tiles.map(cloneTile);
    nextTiles[selectedTileIndex].pixels = createTilePixels(0);
    onUpdate({ tiles: nextTiles });
  };

  const numberInputClass = 'w-full px-2 py-1 bg-msx-panelbg border border-msx-border rounded';

  return (
    <div className="h-full min-h-0 grid grid-cols-[220px_1fr_300px] gap-2 p-2 bg-msx-bgcolor overflow-hidden">
      <div className="min-h-0 overflow-y-auto border-r border-msx-border pr-2 space-y-2">
        <Panel title="MSX2 Screen">
          <div className="p-2 space-y-2 text-xs">
            <input
              value={screen.name}
              onChange={event => onUpdate({ name: event.target.value })}
              className="w-full px-2 py-1 bg-msx-panelbg border border-msx-border rounded"
              aria-label="MSX2 screen name"
            />
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant={mode === 'visual' ? 'primary' : 'secondary'} onClick={() => setMode('visual')}>Visual</Button>
              <Button size="sm" variant={mode === 'tile' ? 'primary' : 'secondary'} onClick={() => setMode('tile')}>Tile</Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button size="sm" variant={mode === 'collision' ? 'primary' : 'secondary'} onClick={() => setMode('collision')}>Collision</Button>
              <Button size="sm" variant={mode === 'effects' ? 'primary' : 'secondary'} onClick={() => setMode('effects')}>Effects</Button>
              <Button size="sm" variant={mode === 'behavior' ? 'primary' : 'secondary'} onClick={() => setMode('behavior')}>Behavior</Button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Button size="sm" variant={mode === 'entities' ? 'primary' : 'secondary'} onClick={() => setMode('entities')}>Entities</Button>
            </div>
            {mode === 'effects' && (
              <div className="space-y-1">
                <div className="text-msx-textsecondary">Effect code</div>
                <select
                  value={selectedEffectCode}
                  onChange={event => setSelectedEffectCode(Number(event.target.value))}
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
                  onChange={event => setSelectedBehaviorCode(Number(event.target.value))}
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
              <input type="checkbox" checked={showGrid} onChange={event => setShowGrid(event.target.checked)} />
              Tile grid
            </label>
            <div className="text-msx-textsecondary">
              16x14 tiles, 16x16 px. Export crops the visible SCREEN 5 area to 256x212.
            </div>
            <div className="text-msx-textsecondary">
              Runtime: {runtime.screenKind} / {runtime.screenEngine}
            </div>
          </div>
        </Panel>

        {mode === 'entities' && (
          <Panel title="Entity Properties">
            <div className="p-2 space-y-2 text-xs">
              {selectedEntity ? (
                <>
                  <input
                    value={selectedEntity.name}
                    onChange={event => updateSelectedEntity({ name: event.target.value })}
                    className={numberInputClass}
                    aria-label="Entity name"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={selectedEntity.kind}
                      onChange={event => updateSelectedEntity({ kind: event.target.value as Msx2EntityKind })}
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
                          updateSelectedEntity({ params: {} });
                          return;
                        }
                        updateSelectedEntityParams({
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
                        onChange={event => updateSelectedEntity({
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
                        onChange={event => updateSelectedEntity({
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
                            <input type="number" min={0} max={MAP_WIDTH - 1} value={selectedEntity.params?.minX ?? selectedEntity.position.x} onChange={event => updateSelectedEntityParams({ minX: Math.max(0, Math.min(MAP_WIDTH - 1, Number(event.target.value) || 0)) })} className={numberInputClass} aria-label="Patrol min X" />
                          </label>
                          <label className="space-y-1">
                            <span className="text-msx-textsecondary">Max X</span>
                            <input type="number" min={0} max={MAP_WIDTH - 1} value={selectedEntity.params?.maxX ?? selectedEntity.position.x} onChange={event => updateSelectedEntityParams({ maxX: Math.max(0, Math.min(MAP_WIDTH - 1, Number(event.target.value) || 0)) })} className={numberInputClass} aria-label="Patrol max X" />
                          </label>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <label className="space-y-1">
                            <span className="text-msx-textsecondary">Min Y</span>
                            <input type="number" min={0} max={MAP_HEIGHT - 1} value={selectedEntity.params?.minY ?? selectedEntity.position.y} onChange={event => updateSelectedEntityParams({ minY: Math.max(0, Math.min(MAP_HEIGHT - 1, Number(event.target.value) || 0)) })} className={numberInputClass} aria-label="Patrol min Y" />
                          </label>
                          <label className="space-y-1">
                            <span className="text-msx-textsecondary">Max Y</span>
                            <input type="number" min={0} max={MAP_HEIGHT - 1} value={selectedEntity.params?.maxY ?? selectedEntity.position.y} onChange={event => updateSelectedEntityParams({ maxY: Math.max(0, Math.min(MAP_HEIGHT - 1, Number(event.target.value) || 0)) })} className={numberInputClass} aria-label="Patrol max Y" />
                          </label>
                        </div>
                      )}
                      <select
                        value={Number(selectedEntity.params?.direction) < 0 ? -1 : 1}
                        onChange={event => updateSelectedEntityParams({ direction: Number(event.target.value) })}
                        className={numberInputClass}
                        aria-label="Patrol direction"
                      >
                        <option value={1}>Positive</option>
                        <option value={-1}>Negative</option>
                      </select>
                    </>
                  )}
                  <Button size="sm" variant="danger" onClick={removeSelectedEntity}>Delete Entity</Button>
                </>
              ) : (
                <div className="text-msx-textsecondary">No entity selected.</div>
              )}
            </div>
          </Panel>
        )}

        <Panel title="Tiles 16x16">
          <div className="p-2 space-y-2">
            <div className="grid grid-cols-2 gap-1">
              <Button size="sm" variant="secondary" onClick={addTile}>Add</Button>
              <Button size="sm" variant="secondary" onClick={duplicateTile}>Duplicate</Button>
              <Button size="sm" variant="danger" onClick={clearTile}>Clear</Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {tiles.map((tile, index) => (
                <button
                  key={tile.id}
                  type="button"
                  className={`text-left px-2 py-1 rounded border text-xs ${index === selectedTileIndex ? 'border-msx-highlight bg-msx-highlight/20' : 'border-msx-border bg-msx-panelbg'}`}
                  onClick={() => setSelectedTileIndex(index)}
                >
                  {index}: {tile.name}
                </button>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <div className="min-h-0 min-w-0 overflow-auto flex items-start justify-center p-3">
        <canvas
          ref={canvasRef}
          className="border border-msx-border bg-black"
          onMouseDown={event => { setIsDrawing(true); handleMapCanvasPaint(event); }}
          onMouseMove={event => { if (isDrawing && (mode === 'visual' || mode === 'collision' || mode === 'effects' || mode === 'behavior')) handleMapCanvasPaint(event); }}
          onContextMenu={event => event.preventDefault()}
        />
      </div>

      <div className="min-h-0 overflow-y-auto border-l border-msx-border pl-2 space-y-2">
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
              onMouseDown={event => { setIsDrawing(true); paintTilePixel(event, true); }}
              onMouseMove={event => paintTilePixel(event)}
              onContextMenu={event => event.preventDefault()}
            />
          </div>
        </Panel>

        <Panel title="Export Model">
          <div className="p-2 text-xs text-msx-textsecondary space-y-1">
            <div>Tile raw size: 128 bytes</div>
            <div>Map size: 208 bytes</div>
            <div>Collision layer: 224 bytes</div>
            <div>Effects layer: 224 bytes</div>
            <div>Behavior layer: 224 bytes</div>
            <div>Entities: {layers.entities.length}</div>
            <div>Current backend: emits packed 16x16 tiles plus runtime layers.</div>
          </div>
        </Panel>
      </div>
    </div>
  );
};
