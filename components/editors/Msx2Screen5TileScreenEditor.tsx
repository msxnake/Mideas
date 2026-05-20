import React, { useEffect, useMemo, useState } from 'react';
import { MSXColorValue, Msx2Screen5EntityInstance, Msx2Screen5Layers, Msx2Screen5Runtime, Msx2Screen5Tile, Msx2Screen5TileScreen } from '../../types';
import { ensureScreen5PaletteSlots } from '../../utils/screen5PaletteUtils';
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  Msx2Screen5CellAction,
  Msx2Screen5EditMode,
  Msx2Screen5EntityPanel,
  Msx2Screen5ExportModelPanel,
  Msx2Screen5Grid,
  Msx2Screen5StatusBar,
  Msx2Screen5TileEditorPanel,
  Msx2Screen5TilesPanel,
  Msx2Screen5Toolbar,
  TILE_SIZE,
} from '../msx2_screen5_editor/Msx2Screen5EditorParts';

interface Msx2Screen5TileScreenEditorProps {
  screen: Msx2Screen5TileScreen;
  onUpdate: (data: Partial<Msx2Screen5TileScreen>) => void;
  selectedColor: MSXColorValue;
}

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

const normalizeOptionalByte = (value: unknown, min = 0): number | undefined => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(min, Math.min(255, Math.floor(numeric))) : undefined;
};

const normalizeRuntimeArea = (runtime?: Msx2Screen5Runtime): Msx2Screen5Runtime => {
  const activeAreaX = Math.max(0, Math.min(MAP_WIDTH - 1, Number(runtime?.activeAreaX) || 0));
  const activeAreaY = Math.max(0, Math.min(MAP_HEIGHT - 1, Number(runtime?.activeAreaY) || 0));
  const activeAreaWidth = Math.max(1, Math.min(MAP_WIDTH - activeAreaX, Number(runtime?.activeAreaWidth) || MAP_WIDTH - activeAreaX));
  const activeAreaHeight = Math.max(1, Math.min(MAP_HEIGHT - activeAreaY, Number(runtime?.activeAreaHeight) || MAP_HEIGHT - activeAreaY));

  return {
    screenKind: runtime?.screenKind || 'playable',
    screenEngine: runtime?.screenEngine || 'player',
    requiredCollectibles: normalizeOptionalByte(runtime?.requiredCollectibles),
    initialAir: normalizeOptionalByte(runtime?.initialAir, 1),
    activeAreaX,
    activeAreaY,
    activeAreaWidth,
    activeAreaHeight,
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

export const Msx2Screen5TileScreenEditor: React.FC<Msx2Screen5TileScreenEditorProps> = ({ screen, onUpdate, selectedColor }) => {
  const [selectedTileIndex, setSelectedTileIndex] = useState(0);
  const [mode, setMode] = useState<Msx2Screen5EditMode>('visual');
  const [selectedEffectCode, setSelectedEffectCode] = useState(1);
  const [selectedBehaviorCode, setSelectedBehaviorCode] = useState(1);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showRuntimeOverlays, setShowRuntimeOverlays] = useState(false);
  const [copiedLayer, setCopiedLayer] = useState<CopiedMsx2Layer | null>(null);
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

  const handleTilePixelAction = (x: number, y: number, button: number) => {
    if (!selectedTile) return;
    const nextTiles = tiles.map(cloneTile);
    nextTiles[selectedTileIndex].pixels[y][x] = button === 2 ? 0 : activeSlot;
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

  const editableRuntimeLayer = mode === 'collision' || mode === 'effects' || mode === 'behavior';

  const copyActiveLayer = () => {
    if (!editableRuntimeLayer) return;
    const layer = mode === 'collision' ? layers.collision : mode === 'effects' ? layers.effects : (layers.behavior || normalizeByteLayer(undefined));
    const data = Array.from({ length: runtime.activeAreaHeight }, (_, y) =>
      layer[runtime.activeAreaY + y].slice(runtime.activeAreaX, runtime.activeAreaX + runtime.activeAreaWidth)
    );
    setCopiedLayer({ data, width: runtime.activeAreaWidth, height: runtime.activeAreaHeight });
  };

  const pasteActiveLayer = () => {
    if (!editableRuntimeLayer || !copiedLayer) return;
    const sourceLayer = mode === 'collision' ? layers.collision : mode === 'effects' ? layers.effects : (layers.behavior || normalizeByteLayer(undefined));
    const nextLayer = sourceLayer.map(row => [...row]);
    const pasteWidth = Math.min(runtime.activeAreaWidth, copiedLayer.width);
    const pasteHeight = Math.min(runtime.activeAreaHeight, copiedLayer.height);
    for (let y = 0; y < pasteHeight; y++) {
      for (let x = 0; x < pasteWidth; x++) {
        nextLayer[runtime.activeAreaY + y][runtime.activeAreaX + x] = Math.max(0, Math.min(255, Number(copiedLayer.data[y]?.[x]) || 0));
      }
    }
    if (mode === 'collision') updateLayers({ ...layers, collision: nextLayer });
    if (mode === 'effects') updateLayers({ ...layers, effects: nextLayer });
    if (mode === 'behavior') updateLayers({ ...layers, behavior: nextLayer });
  };

  return (
    <div className="h-full min-h-0 flex flex-col bg-msx-bgcolor overflow-hidden">
      <div className="min-h-0 flex flex-wrap flex-grow items-start content-start overflow-auto p-2 gap-2">
        <div className="w-[220px] flex-none min-h-0 overflow-y-auto border-r border-msx-border pr-2 space-y-2">
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
            onUpdateSelectedEntity={updateSelectedEntity}
            onUpdateSelectedEntityParams={updateSelectedEntityParams}
            onRemoveSelectedEntity={removeSelectedEntity}
          />
          <Msx2Screen5TilesPanel
            tiles={tiles}
            selectedTileIndex={selectedTileIndex}
            onSelectTileIndex={setSelectedTileIndex}
            onAddTile={addTile}
            onDuplicateTile={duplicateTile}
            onClearTile={clearTile}
          />
        </div>

        <div className="w-[540px] flex-none min-h-0 overflow-auto flex items-start justify-center p-3">
          <Msx2Screen5Grid
            map={map}
            slots={slots}
            tiles={tiles}
            showGrid={showGrid}
            mode={mode}
            layers={layers}
            runtime={runtime}
            selectedEntityId={selectedEntityId}
            showRuntimeOverlays={showRuntimeOverlays}
            isDrawing={isDrawing}
            onSetDrawing={setIsDrawing}
            onCellAction={handleCellAction}
          />
        </div>

        <div className="w-[300px] flex-none min-h-0 overflow-y-auto border-l border-msx-border pl-2 space-y-2">
          <Msx2Screen5TileEditorPanel
            selectedTileIndex={selectedTileIndex}
            selectedTile={selectedTile}
            slots={slots}
            activeSlot={activeSlot}
            isDrawing={isDrawing}
            onSetDrawing={setIsDrawing}
            onPixelAction={handleTilePixelAction}
          />
          <Msx2Screen5ExportModelPanel layers={layers} />
        </div>
      </div>
      <Msx2Screen5StatusBar
        mode={mode}
        selectedTileIndex={selectedTileIndex}
        selectedEffectCode={selectedEffectCode}
        selectedBehaviorCode={selectedBehaviorCode}
        layers={layers}
        runtime={runtime}
      />
    </div>
  );
};
