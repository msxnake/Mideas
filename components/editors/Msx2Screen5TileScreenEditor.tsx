import React, { useEffect, useMemo, useState } from 'react';
import { MSXColorValue, Msx2Screen5EntityInstance, Msx2Screen5Layers, Msx2Screen5Runtime, Msx2Screen5Tile, Msx2Screen5TileScreen, ProjectAsset } from '../../types';
import { ensureScreen5PaletteSlots } from '../../utils/screen5PaletteUtils';
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  MSX2_ENTITY_REPERTOIRE,
  MSX2_ENTITY_KIND_OPTIONS,
  Msx2Screen5CellAction,
  Msx2EntityCreatePreset,
  Msx2Screen5EditMode,
  Msx2Screen5EntityPalettePanel,
  Msx2Screen5EntityPanel,
  Msx2Screen5ExportModelPanel,
  Msx2Screen5Grid,
  Msx2Screen5SelectionPanel,
  Msx2Screen5SelectionRect,
  Msx2Screen5StatusBar,
  Msx2Screen5TileEditorPanel,
  Msx2Screen5TilePaintTool,
  Msx2Screen5TilesPanel,
  Msx2Screen5Toolbar,
  TILE_SIZE,
} from '../msx2_screen5_editor/Msx2Screen5EditorParts';
import { buildMsx2EntityComponents } from '../msx2_screen5_editor/msx2EntityCatalog';
import { Button } from '../common/Button';

interface Msx2Screen5TileScreenEditorProps {
  screen: Msx2Screen5TileScreen;
  onUpdate: (data: Partial<Msx2Screen5TileScreen>) => void;
  selectedColor: MSXColorValue;
  allAssets: ProjectAsset[];
}

const MSX2_TILE_DIMENSION_OPTIONS = [8, 16, 24, 32] as const;

const normalizeTileDimension = (value: unknown): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return TILE_SIZE;
  const multipleOfEight = Math.round(numeric / 8) * 8;
  return Math.max(8, Math.min(32, multipleOfEight));
};

const createTilePixels = (slot = 0, width = TILE_SIZE, height = TILE_SIZE): number[][] =>
  Array.from({ length: height }, () => Array.from({ length: width }, () => slot));

const cloneTile = (tile: Msx2Screen5Tile): Msx2Screen5Tile => ({
  ...tile,
  width: normalizeTileDimension(tile.width ?? tile.pixels?.[0]?.length ?? TILE_SIZE),
  height: normalizeTileDimension(tile.height ?? tile.pixels?.length ?? TILE_SIZE),
  pixels: tile.pixels.map(row => [...row]),
});

const normalizeTiles = (tiles?: Msx2Screen5Tile[]): Msx2Screen5Tile[] => {
  const source = tiles?.length ? tiles : [{ id: 'tile_0', name: 'Tile 0', pixels: createTilePixels(0) }];
  return source.map((tile, index) => {
    const width = normalizeTileDimension(tile.width ?? tile.pixels?.[0]?.length ?? TILE_SIZE);
    const height = normalizeTileDimension(tile.height ?? tile.pixels?.length ?? TILE_SIZE);
    return {
      id: tile.id || `tile_${index}`,
      name: tile.name || `Tile ${index}`,
      width,
      height,
      pixels: Array.from({ length: height }, (_, y) =>
        Array.from({ length: width }, (_, x) => Math.max(0, Math.min(15, Number(tile.pixels?.[y]?.[x]) || 0)))
      ),
    };
  });
};

const normalizeMap = (map: number[][] | undefined, tileCount: number): number[][] =>
  Array.from({ length: MAP_HEIGHT }, (_, y) =>
    Array.from({ length: MAP_WIDTH }, (_, x) => Math.max(0, Math.min(Math.max(0, tileCount - 1), Number(map?.[y]?.[x]) || 0)))
  );

const normalizeByteLayer = (layer: number[][] | undefined, fallback?: number[][]): number[][] =>
  Array.from({ length: MAP_HEIGHT }, (_, y) =>
    Array.from({ length: MAP_WIDTH }, (_, x) => Math.max(0, Math.min(255, Number(layer?.[y]?.[x] ?? fallback?.[y]?.[x] ?? 0) || 0)))
  );

const normalizeEntityKind = (kind: Msx2Screen5EntityInstance['kind'] | undefined): Msx2Screen5EntityInstance['kind'] =>
  MSX2_ENTITY_KIND_OPTIONS.some(option => option.value === kind) ? kind as Msx2Screen5EntityInstance['kind'] : 'enemy';

const normalizeEntities = (entities?: Msx2Screen5EntityInstance[]): Msx2Screen5EntityInstance[] =>
  (entities || []).map((entity, index) => ({
    id: entity.id || `msx2_entity_${index}`,
    name: entity.name || `Entity ${index + 1}`,
    kind: normalizeEntityKind(entity.kind),
    position: {
      x: Math.max(0, Math.min(MAP_WIDTH - 1, Number(entity.position?.x) || 0)),
      y: Math.max(0, Math.min(MAP_HEIGHT - 1, Number(entity.position?.y) || 0)),
    },
    spriteAssetId: entity.spriteAssetId,
    components: { ...(entity.components || {}) },
    params: { ...(entity.params || {}), runtime: 'MSX2' },
  }));

const normalizeOptionalByte = (value: unknown, min = 0): number | undefined => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(min, Math.min(255, Math.floor(numeric))) : undefined;
};

const normalizeRuntimeArea = (runtime?: Msx2Screen5Runtime): Msx2Screen5Runtime => {
  const activeAreaX = Math.max(0, Math.min(MAP_WIDTH - 1, Number(runtime?.activeAreaX) || 0));
  const activeAreaY = Math.max(0, Math.min(MAP_HEIGHT - 1, Number(runtime?.activeAreaY) || 0));
  const activeAreaWidth = Math.max(1, Math.min(MAP_WIDTH - activeAreaX, Number(runtime?.activeAreaWidth) || MAP_WIDTH - activeAreaX));
  const activeAreaHeight = Math.max(1, Math.min(MAP_HEIGHT - activeAreaY, Number(runtime?.activeAreaHeight) || MAP_HEIGHT - activeAreaY));
  const movementMode = runtime?.movementMode
    || runtime?.movementModel
    || runtime?.controlMode
    || runtime?.playerMode
    || (runtime?.screenEngine === 'maze' ? 'maze' : undefined);
  const initialAir = runtime?.disableAirTimer || runtime?.airTimer === false
    ? 0
    : normalizeOptionalByte(runtime?.initialAir, 0);

  return {
    screenKind: runtime?.screenKind || 'playable',
    screenEngine: runtime?.screenEngine || 'player',
    ...(movementMode ? { movementMode, movementModel: movementMode } : {}),
    requiredCollectibles: normalizeOptionalByte(runtime?.requiredCollectibles),
    initialAir,
    ...(initialAir === 0 ? { disableAirTimer: true, airTimer: false } : {}),
    activeAreaX,
    activeAreaY,
    activeAreaWidth,
    activeAreaHeight,
    ...(runtime?.hideHud !== undefined ? { hideHud: runtime.hideHud } : {}),
    ...(runtime?.showHud !== undefined ? { showHud: runtime.showHud } : {}),
    ...(runtime?.statusHud !== undefined ? { statusHud: runtime.statusHud } : {}),
    ...(runtime?.notes ? { notes: runtime.notes } : {}),
  };
};

const normalizeLayers = (screen: Msx2Screen5TileScreen): Msx2Screen5Layers => ({
  collision: normalizeByteLayer(screen.layers?.collision, screen.collisionMap),
  effects: normalizeByteLayer(screen.layers?.effects),
  behavior: normalizeByteLayer(screen.layers?.behavior),
  entities: normalizeEntities(screen.layers?.entities),
});

const normalizeRuntime = normalizeRuntimeArea;

interface CopiedMsx2Layer {
  data: number[][];
  width: number;
  height: number;
}

export const Msx2Screen5TileScreenEditor: React.FC<Msx2Screen5TileScreenEditorProps> = ({ screen, onUpdate, selectedColor, allAssets }) => {
  const [selectedTileIndex, setSelectedTileIndex] = useState(0);
  const [mode, setMode] = useState<Msx2Screen5EditMode>('visual');
  const [selectedEffectCode, setSelectedEffectCode] = useState(1);
  const [selectedBehaviorCode, setSelectedBehaviorCode] = useState(1);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedEntityPresetId, setSelectedEntityPresetId] = useState(MSX2_ENTITY_REPERTOIRE[0].id);
  const [showGrid, setShowGrid] = useState(true);
  const [showRuntimeOverlays, setShowRuntimeOverlays] = useState(false);
  const [copiedLayer, setCopiedLayer] = useState<CopiedMsx2Layer | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectionRect, setSelectionRect] = useState<Msx2Screen5SelectionRect | null>(null);
  const [paintSlot, setPaintSlot] = useState(0);
  const [tilePaintTool, setTilePaintTool] = useState<Msx2Screen5TilePaintTool>('pencil');

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
  const selectedEntityPreset = useMemo<Msx2EntityCreatePreset>(
    () => MSX2_ENTITY_REPERTOIRE.find(preset => preset.id === selectedEntityPresetId)
      || MSX2_ENTITY_REPERTOIRE[0],
    [selectedEntityPresetId]
  );
  const selectedColorSlot = useMemo(() => {
    const exact = slots.find(slot => slot.hex === selectedColor)?.slotIndex;
    return typeof exact === 'number' ? exact : 0;
  }, [selectedColor, slots]);
  const activeSlot = Math.max(0, Math.min(15, paintSlot));

  useEffect(() => {
    if (changed) onUpdate({ palette: slots.map(slot => ({ ...slot })) });
  }, [changed, onUpdate, slots]);

  useEffect(() => {
    setPaintSlot(selectedColorSlot);
  }, [selectedColorSlot]);

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
          ? {
            ...entity,
            ...patch,
            components: patch.position
              ? {
                ...(patch.components ?? entity.components ?? {}),
                msx2_transform: {
                  ...((patch.components ?? entity.components ?? {}).msx2_transform || {}),
                  tileX: patch.position.x,
                  tileY: patch.position.y,
                  pixelX: patch.position.x * TILE_SIZE,
                  pixelY: patch.position.y * TILE_SIZE,
                },
              }
              : patch.components ?? entity.components,
            params: patch.params ?? entity.params,
          }
          : entity
      ),
    });
  };

  const updateSelectedEntityParams = (patch: Record<string, any>) => {
    if (!selectedEntity) return;
    const componentPatch: Record<string, Record<string, any>> = { ...(selectedEntity.components || {}) };
    const movementKeys = ['movement', 'mode', 'speed', 'direction', 'minX', 'maxX', 'minY', 'maxY', 'boundsUnit'];
    const hasMovementPatch = movementKeys.some(key => Object.prototype.hasOwnProperty.call(patch, key));
    if (hasMovementPatch || componentPatch.msx2_movement) {
      componentPatch.msx2_movement = {
        ...(componentPatch.msx2_movement || {}),
        ...Object.fromEntries(
          Object.entries(patch)
            .filter(([key]) => movementKeys.includes(key))
            .map(([key, value]) => [key === 'movement' ? 'mode' : key, value])
        ),
      };
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'initialDirection') || componentPatch.msx2_ai) {
      componentPatch.msx2_ai = {
        ...(componentPatch.msx2_ai || {}),
        ...(patch.initialDirection !== undefined ? { initialDirection: patch.initialDirection } : {}),
      };
    }
    updateSelectedEntity({
      components: componentPatch,
      params: { ...(selectedEntity.params || {}), ...patch },
    });
  };

  const removeSelectedEntity = () => {
    if (!selectedEntity) return;
    updateLayers({ ...layers, entities: layers.entities.filter(entity => entity.id !== selectedEntity.id) });
    setSelectedEntityId(null);
  };

  const handleCellAction = ({ x, y, button }: Msx2Screen5CellAction) => {
    if (mode === 'visual') {
      const next = map.map(row => [...row]);
      next[y][x] = selectedTileIndex;
      onUpdate({ map: next });
      return;
    }

    if (mode === 'collision') {
      const next = { ...layers, collision: layers.collision.map(row => [...row]) };
      next.collision[y][x] = button === 2 ? 0 : (next.collision[y][x] ? 0 : 1);
      updateLayers(next);
      return;
    }

    if (mode === 'effects') {
      const next = { ...layers, effects: layers.effects.map(row => [...row]) };
      next.effects[y][x] = button === 2 ? 0 : selectedEffectCode;
      updateLayers(next);
      return;
    }

    if (mode === 'behavior') {
      const nextBehavior = (layers.behavior || normalizeByteLayer(undefined)).map(row => [...row]);
      nextBehavior[y][x] = button === 2 ? 0 : selectedBehaviorCode;
      updateLayers({ ...layers, behavior: nextBehavior });
      return;
    }

    if (mode === 'entities') {
      const existing = layers.entities.find(entity => entity.position.x === x && entity.position.y === y);
      if (button === 2) {
        if (existing?.id === selectedEntityId) setSelectedEntityId(null);
        updateLayers({ ...layers, entities: layers.entities.filter(entity => entity.id !== existing?.id) });
        return;
      }
      if (existing) {
        setSelectedEntityId(existing.id);
        return;
      }
      const id = `msx2_entity_${Date.now()}`;
      const presetParams = { ...(selectedEntityPreset.params || {}) };
      const components = buildMsx2EntityComponents(selectedEntityPreset, x, y);
      if (presetParams.movement === 'patrolX') {
        presetParams.minX = x;
        presetParams.maxX = Math.min(MAP_WIDTH - 1, x + 4);
        presetParams.minY = y;
        presetParams.maxY = y;
        components.msx2_movement = {
          ...(components.msx2_movement || {}),
          minX: presetParams.minX,
          maxX: presetParams.maxX,
          minY: presetParams.minY,
          maxY: presetParams.maxY,
        };
      } else if (presetParams.movement === 'patrolY') {
        presetParams.minX = x;
        presetParams.maxX = x;
        presetParams.minY = y;
        presetParams.maxY = Math.min(MAP_HEIGHT - 1, y + 4);
        components.msx2_movement = {
          ...(components.msx2_movement || {}),
          minX: presetParams.minX,
          maxX: presetParams.maxX,
          minY: presetParams.minY,
          maxY: presetParams.maxY,
        };
      }
      const nextEntity: Msx2Screen5EntityInstance = {
        id,
        name: `${selectedEntityPreset.label} ${layers.entities.length + 1}`,
        kind: selectedEntityPreset.kind,
        position: { x, y },
        components,
        params: presetParams,
      };
      const nextLayers = { ...layers, entities: [...layers.entities, nextEntity] };
      if (selectedEntityPreset.kind === 'player') {
        const movementMode = presetParams.movementMode || presetParams.controlMode || presetParams.movement;
        const nextRuntime: Msx2Screen5Runtime = {
          ...runtime,
          screenKind: 'playable',
          screenEngine: movementMode === 'maze'
            ? 'maze'
            : movementMode === 'shooterHorizontal'
              ? 'shooter'
              : 'player',
          ...(movementMode ? { movementMode, movementModel: movementMode } : {}),
          ...(presetParams.disableAirTimer ? { initialAir: 0, disableAirTimer: true, airTimer: false } : {}),
        };
        onUpdate({
          layers: nextLayers,
          collisionMap: nextLayers.collision,
          runtime: nextRuntime,
        });
      } else {
        updateLayers(nextLayers);
      }
      setSelectedEntityId(id);
    }
  };

  const handleTilePixelAction = (x: number, y: number, button: number) => {
    if (!selectedTile) return;
    const nextTiles = tiles.map(cloneTile);
    const targetIndex = Math.max(0, Math.min(nextTiles.length - 1, selectedTileIndex));
    const targetTile = nextTiles[targetIndex];
    const paintTool = button === 2 ? 'erase' : tilePaintTool;
    const tileWidth = normalizeTileDimension(targetTile.width ?? targetTile.pixels?.[0]?.length ?? TILE_SIZE);
    const tileHeight = normalizeTileDimension(targetTile.height ?? targetTile.pixels?.length ?? TILE_SIZE);

    if (paintTool === 'pick') {
      setPaintSlot(Math.max(0, Math.min(15, Number(targetTile.pixels?.[y]?.[x]) || 0)));
      setTilePaintTool('pencil');
      return;
    }

    if (paintTool === 'fill') {
      const sourceSlot = Math.max(0, Math.min(15, Number(targetTile.pixels?.[y]?.[x]) || 0));
      if (sourceSlot !== activeSlot) {
        const queue: Array<[number, number]> = [[x, y]];
        const seen = new Set<string>();
        while (queue.length) {
          const [cx, cy] = queue.shift()!;
          const key = `${cx},${cy}`;
          if (seen.has(key) || cx < 0 || cy < 0 || cx >= tileWidth || cy >= tileHeight) continue;
          seen.add(key);
          if ((targetTile.pixels?.[cy]?.[cx] ?? 0) !== sourceSlot) continue;
          targetTile.pixels[cy][cx] = activeSlot;
          queue.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
        }
      }
      onUpdate({ tiles: nextTiles });
      return;
    }

    targetTile.pixels[y][x] = paintTool === 'erase' ? 0 : activeSlot;
    onUpdate({ tiles: nextTiles });
  };

  const updateSelectedTilePixels = (buildPixels: (tile: Msx2Screen5Tile) => number[][]) => {
    if (!selectedTile) return;
    const nextTiles = tiles.map(cloneTile);
    const targetIndex = Math.max(0, Math.min(nextTiles.length - 1, selectedTileIndex));
    const current = nextTiles[targetIndex];
    const width = normalizeTileDimension(current.width ?? current.pixels?.[0]?.length ?? TILE_SIZE);
    const height = normalizeTileDimension(current.height ?? current.pixels?.length ?? TILE_SIZE);
    const pixels = buildPixels(current);
    current.width = width;
    current.height = height;
    current.pixels = Array.from({ length: height }, (_, y) =>
      Array.from({ length: width }, (_, x) => Math.max(0, Math.min(15, Number(pixels?.[y]?.[x]) || 0)))
    );
    onUpdate({ tiles: nextTiles });
  };

  const fillSelectedTile = () => {
    updateSelectedTilePixels(tile =>
      createTilePixels(activeSlot, tile.width || TILE_SIZE, tile.height || TILE_SIZE)
    );
  };

  const flipSelectedTileHorizontal = () => {
    updateSelectedTilePixels(tile => tile.pixels.map(row => [...row].reverse()));
  };

  const flipSelectedTileVertical = () => {
    updateSelectedTilePixels(tile => [...tile.pixels].reverse().map(row => [...row]));
  };

  const shiftSelectedTile = (dx: number, dy: number) => {
    updateSelectedTilePixels(tile => {
      const width = normalizeTileDimension(tile.width ?? tile.pixels?.[0]?.length ?? TILE_SIZE);
      const height = normalizeTileDimension(tile.height ?? tile.pixels?.length ?? TILE_SIZE);
      return Array.from({ length: height }, (_, y) =>
        Array.from({ length: width }, (_, x) => {
          const sourceX = x - dx;
          const sourceY = y - dy;
          if (sourceX < 0 || sourceY < 0 || sourceX >= width || sourceY >= height) return 0;
          return tile.pixels[sourceY]?.[sourceX] ?? 0;
        })
      );
    });
  };

  const resizeSelectedTile = (width: number, height: number) => {
    if (!selectedTile) return;
    const nextWidth = normalizeTileDimension(width);
    const nextHeight = normalizeTileDimension(height);
    const nextTiles = tiles.map(cloneTile);
    const current = nextTiles[selectedTileIndex];
    current.width = nextWidth;
    current.height = nextHeight;
    current.pixels = Array.from({ length: nextHeight }, (_, y) =>
      Array.from({ length: nextWidth }, (_, x) => Math.max(0, Math.min(15, Number(current.pixels?.[y]?.[x]) || 0)))
    );
    onUpdate({ tiles: nextTiles });
  };

  const addTile = () => {
    const nextTiles = [...tiles.map(cloneTile), { id: `tile_${Date.now()}`, name: `Tile ${tiles.length}`, width: TILE_SIZE, height: TILE_SIZE, pixels: createTilePixels(0) }];
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
    nextTiles[selectedTileIndex].pixels = createTilePixels(0, selectedTile.width || TILE_SIZE, selectedTile.height || TILE_SIZE);
    onUpdate({ tiles: nextTiles });
  };

  const editableRuntimeLayer = mode === 'collision' || mode === 'effects' || mode === 'behavior';
  const editableSelectionLayer = mode === 'visual' || editableRuntimeLayer;
  const activeEditRect = selectionRect || {
    x: runtime.activeAreaX,
    y: runtime.activeAreaY,
    width: runtime.activeAreaWidth,
    height: runtime.activeAreaHeight,
  };

  const getActiveRuntimeLayer = (): number[][] =>
    mode === 'collision' ? layers.collision : mode === 'effects' ? layers.effects : (layers.behavior || normalizeByteLayer(undefined));

  const getPaintValueForCurrentLayer = () => {
    if (mode === 'visual') return selectedTileIndex;
    if (mode === 'collision') return 1;
    if (mode === 'effects') return selectedEffectCode;
    if (mode === 'behavior') return selectedBehaviorCode;
    return 0;
  };

  const updateCurrentRuntimeLayer = (nextLayer: number[][]) => {
    if (mode === 'collision') updateLayers({ ...layers, collision: nextLayer });
    if (mode === 'effects') updateLayers({ ...layers, effects: nextLayer });
    if (mode === 'behavior') updateLayers({ ...layers, behavior: nextLayer });
  };

  const applySelectionValue = (value: number) => {
    if (!editableSelectionLayer || !selectionRect) return;
    if (mode === 'visual') {
      const nextMap = map.map(row => [...row]);
      for (let y = selectionRect.y; y < selectionRect.y + selectionRect.height; y++) {
        for (let x = selectionRect.x; x < selectionRect.x + selectionRect.width; x++) {
          nextMap[y][x] = Math.max(0, Math.min(tiles.length - 1, value));
        }
      }
      onUpdate({ map: nextMap });
      return;
    }

    const nextLayer = getActiveRuntimeLayer().map(row => [...row]);
    for (let y = selectionRect.y; y < selectionRect.y + selectionRect.height; y++) {
      for (let x = selectionRect.x; x < selectionRect.x + selectionRect.width; x++) {
        nextLayer[y][x] = Math.max(0, Math.min(255, value));
      }
    }
    updateCurrentRuntimeLayer(nextLayer);
  };

  const copyActiveLayer = () => {
    if (!editableRuntimeLayer) return;
    const layer = getActiveRuntimeLayer();
    const data = Array.from({ length: activeEditRect.height }, (_, y) =>
      layer[activeEditRect.y + y].slice(activeEditRect.x, activeEditRect.x + activeEditRect.width)
    );
    setCopiedLayer({ data, width: activeEditRect.width, height: activeEditRect.height });
  };

  const pasteActiveLayer = () => {
    if (!editableRuntimeLayer || !copiedLayer) return;
    const sourceLayer = getActiveRuntimeLayer();
    const nextLayer = sourceLayer.map(row => [...row]);
    const pasteWidth = Math.min(activeEditRect.width, copiedLayer.width);
    const pasteHeight = Math.min(activeEditRect.height, copiedLayer.height);
    for (let y = 0; y < pasteHeight; y++) {
      for (let x = 0; x < pasteWidth; x++) {
        nextLayer[activeEditRect.y + y][activeEditRect.x + x] = Math.max(0, Math.min(255, Number(copiedLayer.data[y]?.[x]) || 0));
      }
    }
    updateCurrentRuntimeLayer(nextLayer);
  };

  const setAllPanelsCollapsed = (collapsed: boolean) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('mideas:panel-collapse-all', { detail: { collapsed } }));
  };

  return (
    <div className="h-full min-h-0 flex flex-col bg-msx-bgcolor overflow-hidden">
      <div className="flex flex-none items-center justify-between border-b border-msx-border px-3 py-2 text-xs">
        <span className="text-msx-textsecondary">MSX2 editor sections</span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setAllPanelsCollapsed(true)}
            aria-label="Collapse all MSX2 editor sections"
          >
            Collapse All
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setAllPanelsCollapsed(false)}
            aria-label="Expand all MSX2 editor sections"
          >
            Expand All
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-grow overflow-hidden p-2">
        <div className="flex h-full min-h-0 min-w-0 gap-2 overflow-hidden">
          <div className="w-[220px] flex-shrink-0 min-h-0 overflow-y-auto border-r border-msx-border pr-2 space-y-2">
          <Msx2Screen5Toolbar
            screenName={screen.name}
            onScreenNameChange={name => onUpdate({ name })}
            mode={mode}
            onModeChange={setMode}
            selectedEffectCode={selectedEffectCode}
            onSelectedEffectCodeChange={setSelectedEffectCode}
            selectedBehaviorCode={selectedBehaviorCode}
            onSelectedBehaviorCodeChange={setSelectedBehaviorCode}
            showGrid={showGrid}
            onShowGridChange={setShowGrid}
            showRuntimeOverlays={showRuntimeOverlays}
            onShowRuntimeOverlaysChange={setShowRuntimeOverlays}
            runtime={runtime}
            onRuntimeChange={nextRuntime => onUpdate({ runtime: normalizeRuntime(nextRuntime) })}
            canCopyLayer={editableRuntimeLayer}
            canPasteLayer={editableRuntimeLayer && !!copiedLayer}
            onCopyLayer={copyActiveLayer}
            onPasteLayer={pasteActiveLayer}
          />
          <Msx2Screen5EntityPanel
            mode={mode}
            selectedEntity={selectedEntity}
            allAssets={allAssets}
            onUpdateSelectedEntity={updateSelectedEntity}
            onUpdateSelectedEntityParams={updateSelectedEntityParams}
            onRemoveSelectedEntity={removeSelectedEntity}
          />
          <Msx2Screen5EntityPalettePanel
            mode={mode}
            presets={MSX2_ENTITY_REPERTOIRE}
            selectedPresetId={selectedEntityPresetId}
            onSelectPresetId={setSelectedEntityPresetId}
          />
          <Msx2Screen5SelectionPanel
            selectionMode={selectionMode}
            onSelectionModeChange={setSelectionMode}
            selectionRect={selectionRect}
            canEditSelection={editableSelectionLayer && !!selectionRect}
            canCopySelection={editableRuntimeLayer && !!selectionRect}
            canPasteSelection={editableRuntimeLayer && !!copiedLayer}
            onClearSelectionRect={() => setSelectionRect(null)}
            onFillSelection={() => applySelectionValue(getPaintValueForCurrentLayer())}
            onClearSelection={() => applySelectionValue(0)}
            onCopySelection={copyActiveLayer}
            onPasteSelection={pasteActiveLayer}
          />
          {mode !== 'entities' && (
            <Msx2Screen5TilesPanel
              tiles={tiles}
              slots={slots}
              selectedTileIndex={selectedTileIndex}
              onSelectTileIndex={setSelectedTileIndex}
              onAddTile={addTile}
              onDuplicateTile={duplicateTile}
              onClearTile={clearTile}
            />
          )}
        </div>

          <div className="min-w-0 flex-1 min-h-0 overflow-auto flex items-start justify-center p-3">
          <Msx2Screen5Grid
            map={map}
            slots={slots}
            tiles={tiles}
            showGrid={showGrid}
            mode={mode}
            layers={layers}
            runtime={runtime}
            selectionMode={selectionMode}
            selectionRect={selectionRect}
            selectedEntityId={selectedEntityId}
            showRuntimeOverlays={showRuntimeOverlays}
            isDrawing={isDrawing}
            onSetDrawing={setIsDrawing}
            onCellAction={handleCellAction}
            onSelectionChange={setSelectionRect}
          />
        </div>

          <div className="w-[300px] flex-shrink-0 min-h-0 overflow-y-auto border-l border-msx-border pl-2 space-y-2">
          {mode !== 'entities' && (
            <Msx2Screen5TileEditorPanel
              selectedTileIndex={selectedTileIndex}
              selectedTile={selectedTile}
              slots={slots}
              activeSlot={activeSlot}
              paintTool={tilePaintTool}
              dimensionOptions={MSX2_TILE_DIMENSION_OPTIONS}
              isDrawing={isDrawing}
              onSetDrawing={setIsDrawing}
              onSelectSlot={setPaintSlot}
              onPaintToolChange={setTilePaintTool}
              onPixelAction={handleTilePixelAction}
              onResizeTile={resizeSelectedTile}
              onFillTile={fillSelectedTile}
              onFlipHorizontal={flipSelectedTileHorizontal}
              onFlipVertical={flipSelectedTileVertical}
              onShiftTile={shiftSelectedTile}
            />
          )}
          <Msx2Screen5ExportModelPanel layers={layers} />
          </div>
        </div>
      </div>
      <Msx2Screen5StatusBar
        mode={mode}
        selectedTileIndex={selectedTileIndex}
        selectedEffectCode={selectedEffectCode}
        selectedBehaviorCode={selectedBehaviorCode}
        layers={layers}
        runtime={runtime}
        selectionRect={selectionRect}
      />
    </div>
  );
};
