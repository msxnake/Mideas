import React, { useEffect, useMemo, useState } from 'react';
import { MSXColorValue, Msx2HudWidget, Msx2PlayerEntry, Msx2ProjectProfile, Msx2Screen4EntityInstance, Msx2Screen4Layers, Msx2Screen4LineAttribute, Msx2Screen4Runtime, Msx2Screen4Tile, Msx2Screen4TileScreen, ProjectAsset } from '../../types';
import { filterMsx2EntityPresetsForProfile, getMsx2LockedRuntimeMode } from '../../utils/msx2ProjectProfiles';
import { ensureScreen5PaletteSlots } from '../../utils/msx2PaletteUtils';
import { normalizeMsx2ShooterRuntimeConfig } from '../../utils/msx2ShooterRuntime';
import { normalizeMsx2PlayerEntries } from '../../utils/msx2PlayerDefaults';
import {
  createDefaultLineAttributes,
  ensureLineAttributes,
  fillAllLineAttributeSlots,
  fixInvalidTilePixels,
  mirrorLineAttributesHorizontal,
  mirrorLineAttributesVertical,
  remapSegmentPixels,
  resizeLineAttributes,
  resolvePaintSlot,
} from '../../utils/msx2Screen4TileConstraints';
import {
  applyMsx2TileBehaviorToMapCell,
  stripMsx2BoxTileCollisionFromLayer,
  getDefaultHitboxForBehavior,
  getMsx2TileBehaviorKind,
  normalizeMsx2Screen4TileBehavior,
} from '../../utils/msx2Screen4TileBehavior';
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  MSX2_ENTITY_REPERTOIRE,
  MSX2_ENTITY_KIND_OPTIONS,
  Msx2Screen4CellAction,
  Msx2EntityCreatePreset,
  Msx2Screen4CompositionOverlay,
  Msx2Screen4EditMode,
  Msx2Screen4EntityPalettePanel,
  Msx2Screen4EntityPanel,
  Msx2Screen4ExportModelPanel,
  Msx2Screen4Grid,
  Msx2Screen4SelectionPanel,
  Msx2Screen4SelectionRect,
  Msx2Screen4StatusBar,
  Msx2Screen4TileEditorPanel,
  Msx2Screen4TilePaintTool,
  Msx2Screen4TilesPanel,
  Msx2Screen4Toolbar,
  TILE_SIZE,
} from '../msx2_screen4_editor/Msx2Screen4EditorParts';
import { buildMsx2EntityComponents } from '../msx2_screen4_editor/msx2EntityCatalog';
import { Button } from '../common/Button';
import { Panel } from '../common/Panel';
import { MSX2AtlasPreviewPanel } from '../screen_editor/MSX2AtlasPreviewPanel';
import { MSX2CompositionPanel } from '../screen_editor/MSX2CompositionPanel';
import { MSX2HudPlanPanel } from '../msx2_screen4_editor/MSX2HudPlanPanel';
import { Msx2Screen4TileStudio } from '../msx2_screen4_editor/Msx2Screen4TileStudio';

interface Msx2Screen4RoomEditorProps {
  screen: Msx2Screen4TileScreen;
  onUpdate: (data: Partial<Msx2Screen4TileScreen>, newAssets?: ProjectAsset[]) => void;
  selectedColor: MSXColorValue;
  allAssets: ProjectAsset[];
  msx2ProjectProfile?: Msx2ProjectProfile | null;
}

const MSX2_TILE_DIMENSION_OPTIONS = [8, 16, 24, 32] as const;
type Msx2RoomCompositionPreset = 'full' | 'topHud' | 'topHudBottom' | 'tallHud';

const normalizeTileDimension = (value: unknown): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return TILE_SIZE;
  const multipleOfEight = Math.round(numeric / 8) * 8;
  return Math.max(8, Math.min(32, multipleOfEight));
};

const createTilePixels = (slot = 0, width = TILE_SIZE, height = TILE_SIZE): number[][] =>
  Array.from({ length: height }, () => Array.from({ length: width }, () => slot));

const createTileWithDefaults = (slot = 0, width = TILE_SIZE, height = TILE_SIZE): Msx2Screen4Tile =>
  normalizeMsx2Screen4TileBehavior({
    id: `tile_${Date.now()}`,
    name: 'Tile',
    width,
    height,
    pixels: createTilePixels(slot, width, height),
    lineAttributes: createDefaultLineAttributes(width, height, slot === 0 ? 1 : slot, 0),
    behaviorKind: 'background',
    hitbox: getDefaultHitboxForBehavior('background', width, height),
  }, width, height);

const cloneTile = (tile: Msx2Screen4Tile): Msx2Screen4Tile => {
  const width = normalizeTileDimension(tile.width ?? tile.pixels?.[0]?.length ?? TILE_SIZE);
  const height = normalizeTileDimension(tile.height ?? tile.pixels?.length ?? TILE_SIZE);
  const pixels = tile.pixels.map(row => [...row]);
  return normalizeMsx2Screen4TileBehavior({
    ...tile,
    width,
    height,
    pixels,
    lineAttributes: ensureLineAttributes(pixels, tile.lineAttributes?.map(row => row.map(segment => ({ ...segment }))), width, height),
    hitbox: tile.hitbox ? { ...tile.hitbox } : undefined,
  }, width, height);
};

const normalizeTiles = (tiles?: Msx2Screen4Tile[]): Msx2Screen4Tile[] => {
  const source = tiles?.length ? tiles : [{ id: 'tile_0', name: 'Tile 0', pixels: createTilePixels(0) }];
  return source.map((tile, index) => {
    const width = normalizeTileDimension(tile.width ?? tile.pixels?.[0]?.length ?? TILE_SIZE);
    const height = normalizeTileDimension(tile.height ?? tile.pixels?.length ?? TILE_SIZE);
    const pixels = Array.from({ length: height }, (_, y) =>
      Array.from({ length: width }, (_, x) => Math.max(0, Math.min(15, Number(tile.pixels?.[y]?.[x]) || 0)))
    );
    return normalizeMsx2Screen4TileBehavior({
      id: tile.id || `tile_${index}`,
      name: tile.name || `Tile ${index}`,
      width,
      height,
      pixels,
      lineAttributes: ensureLineAttributes(pixels, tile.lineAttributes, width, height),
      behaviorKind: tile.behaviorKind,
      hitbox: tile.hitbox,
    }, width, height);
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

const normalizeEntityKind = (kind: Msx2Screen4EntityInstance['kind'] | undefined): Msx2Screen4EntityInstance['kind'] =>
  MSX2_ENTITY_KIND_OPTIONS.some(option => option.value === kind) ? kind as Msx2Screen4EntityInstance['kind'] : 'enemy';

const normalizeEntities = (entities?: Msx2Screen4EntityInstance[]): Msx2Screen4EntityInstance[] =>
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

const normalizeOptionalNibble = (value: unknown): number | undefined => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(15, Math.floor(numeric))) : undefined;
};

const normalizeHudWidgets = (widgets?: Msx2HudWidget[]): Msx2HudWidget[] =>
  (widgets || []).map((widget, index) => ({
    id: widget.id || `msx2_hud_widget_${index}`,
    name: widget.name || `HUD Widget ${index + 1}`,
    kind: widget.kind || 'bar',
    binding: widget.binding || 'custom',
    x: Math.max(0, Math.min(255, Math.floor(Number(widget.x) || 0))),
    y: Math.max(0, Math.min(191, Math.floor(Number(widget.y) || 0))),
    width: Math.max(1, Math.min(256, Math.floor(Number(widget.width) || 64))),
    height: Math.max(1, Math.min(64, Math.floor(Number(widget.height) || 6))),
    ...(widget.maxValue !== undefined ? { maxValue: normalizeOptionalByte(widget.maxValue, 1) } : {}),
    ...(widget.initialValue !== undefined ? { initialValue: normalizeOptionalByte(widget.initialValue, 0) } : {}),
    ...(widget.primaryColor !== undefined ? { primaryColor: normalizeOptionalNibble(widget.primaryColor) } : {}),
    ...(widget.secondaryColor !== undefined ? { secondaryColor: normalizeOptionalNibble(widget.secondaryColor) } : {}),
    ...(widget.borderColor !== undefined ? { borderColor: normalizeOptionalNibble(widget.borderColor) } : {}),
    ...(widget.emptyColor !== undefined ? { emptyColor: normalizeOptionalNibble(widget.emptyColor) } : {}),
    ...(widget.iconTileIndex !== undefined ? { iconTileIndex: normalizeOptionalByte(widget.iconTileIndex) } : {}),
    ...(widget.text ? { text: widget.text } : {}),
    ...(widget.variableName ? { variableName: widget.variableName } : {}),
  }));

const normalizeRuntimeArea = (runtime?: Msx2Screen4Runtime): Msx2Screen4Runtime => {
  const activeAreaX = Math.max(0, Math.min(MAP_WIDTH - 1, Number(runtime?.activeAreaX) || 0));
  const activeAreaY = Math.max(0, Math.min(MAP_HEIGHT - 1, Number(runtime?.activeAreaY) || 0));
  const activeAreaWidth = Math.max(1, Math.min(MAP_WIDTH - activeAreaX, Number(runtime?.activeAreaWidth) || MAP_WIDTH - activeAreaX));
  const activeAreaHeight = Math.max(1, Math.min(MAP_HEIGHT - activeAreaY, Number(runtime?.activeAreaHeight) || MAP_HEIGHT - activeAreaY));
  const movementMode = runtime?.movementMode
    || runtime?.movementModel
    || runtime?.controlMode
    || runtime?.playerMode
    || (runtime?.screenEngine === 'maze' ? 'maze' : undefined)
    || (runtime?.screenEngine === 'shooter' ? 'shooterVertical' : undefined);
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
    ...(runtime?.hudStyle ? { hudStyle: runtime.hudStyle } : {}),
    ...(runtime?.playerEnergyMax !== undefined ? { playerEnergyMax: normalizeOptionalByte(runtime.playerEnergyMax, 1) } : {}),
    ...(runtime?.playerEnergyInitial !== undefined ? { playerEnergyInitial: normalizeOptionalByte(runtime.playerEnergyInitial, 1) } : {}),
    ...(runtime?.bossEnergyMax !== undefined ? { bossEnergyMax: normalizeOptionalByte(runtime.bossEnergyMax, 1) } : {}),
    ...(runtime?.bossEnergyInitial !== undefined ? { bossEnergyInitial: normalizeOptionalByte(runtime.bossEnergyInitial, 1) } : {}),
    ...(runtime?.hudPrimaryColor !== undefined ? { hudPrimaryColor: normalizeOptionalByte(runtime.hudPrimaryColor) } : {}),
    ...(runtime?.hudSecondaryColor !== undefined ? { hudSecondaryColor: normalizeOptionalByte(runtime.hudSecondaryColor) } : {}),
    ...(runtime?.hudBorderColor !== undefined ? { hudBorderColor: normalizeOptionalByte(runtime.hudBorderColor) } : {}),
    ...(runtime?.hudEmptyColor !== undefined ? { hudEmptyColor: normalizeOptionalByte(runtime.hudEmptyColor) } : {}),
    ...(runtime?.hudWidgets ? { hudWidgets: normalizeHudWidgets(runtime.hudWidgets) } : {}),
    ...(runtime?.screenEngine === 'shooter' || runtime?.shooter
      ? { shooter: normalizeMsx2ShooterRuntimeConfig(runtime?.shooter) }
      : {}),
    ...(runtime?.notes ? { notes: runtime.notes } : {}),
  };
};

const normalizeLayers = (screen: Msx2Screen4TileScreen, map: number[][], tiles: Msx2Screen4Tile[]): Msx2Screen4Layers => {
  const collision = stripMsx2BoxTileCollisionFromLayer(
    map,
    tiles,
    normalizeByteLayer(screen.layers?.collision, screen.collisionMap)
  );
  return {
    collision,
    effects: normalizeByteLayer(screen.layers?.effects),
    behavior: normalizeByteLayer(screen.layers?.behavior),
    entities: normalizeEntities(screen.layers?.entities),
  };
};

const normalizeRuntime = normalizeRuntimeArea;

interface CopiedMsx2Layer {
  data: number[][];
  width: number;
  height: number;
}

export const Msx2Screen4RoomEditor: React.FC<Msx2Screen4RoomEditorProps> = ({ screen, onUpdate, selectedColor, allAssets, msx2ProjectProfile = null }) => {
  const [selectedTileIndex, setSelectedTileIndex] = useState(0);
  const [tileStudioOpen, setTileStudioOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [mode, setMode] = useState<Msx2Screen4EditMode>('visual');
  const [selectedEffectCode, setSelectedEffectCode] = useState(1);
  const [selectedBehaviorCode, setSelectedBehaviorCode] = useState(1);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedPlayerEntryId, setSelectedPlayerEntryId] = useState<string | null>(null);
  const [selectedEntityPresetId, setSelectedEntityPresetId] = useState(MSX2_ENTITY_REPERTOIRE[0].id);
  const [showGrid, setShowGrid] = useState(true);
  const [showRuntimeOverlays, setShowRuntimeOverlays] = useState(false);
  const [compositionOverlay, setCompositionOverlay] = useState<Msx2Screen4CompositionOverlay>('off');
  const [copiedLayer, setCopiedLayer] = useState<CopiedMsx2Layer | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectionRect, setSelectionRect] = useState<Msx2Screen4SelectionRect | null>(null);
  const [paintSlot, setPaintSlot] = useState(0);
  const [tilePaintTool, setTilePaintTool] = useState<Msx2Screen4TilePaintTool>('pencil');
  const [copiedLineAttribute, setCopiedLineAttribute] = useState<Msx2Screen4LineAttribute | null>(null);

  const { slots, changed } = useMemo(() => ensureScreen5PaletteSlots(screen.palette), [screen.palette]);
  const tiles = useMemo(() => normalizeTiles(screen.tiles), [screen.tiles]);
  const map = useMemo(() => normalizeMap(screen.map, tiles.length), [screen.map, tiles.length]);
  const layers = useMemo(() => normalizeLayers(screen, map, tiles), [screen, map, tiles]);
  const playerEntries = useMemo(() => normalizeMsx2PlayerEntries(screen.playerEntries), [screen.playerEntries]);
  const playerAssetOptions = useMemo(() => allAssets.filter(asset => asset.type === 'msx2player'), [allAssets]);
  const defaultPlayerAssetId = playerAssetOptions[0]?.id;
  const runtime = useMemo(() => normalizeRuntime(screen.runtime), [screen.runtime]);
  const selectedTile = tiles[Math.max(0, Math.min(tiles.length - 1, selectedTileIndex))];
  const selectedEntity = useMemo(
    () => layers.entities.find(entity => entity.id === selectedEntityId) || null,
    [layers.entities, selectedEntityId]
  );
  const selectedPlayerEntry = useMemo(
    () => playerEntries.find(entry => entry.id === selectedPlayerEntryId) || playerEntries[0] || null,
    [playerEntries, selectedPlayerEntryId]
  );
  const getPlayerEntryAssetLabel = (playerId?: string) => {
    if (!playerId) return 'Default player';
    return playerAssetOptions.find(asset => asset.id === playerId)?.name || 'Missing player';
  };
  const entityPresets = useMemo(
    () => filterMsx2EntityPresetsForProfile(MSX2_ENTITY_REPERTOIRE, msx2ProjectProfile),
    [msx2ProjectProfile]
  );
  const lockedRuntimeMode = useMemo(
    () => getMsx2LockedRuntimeMode(msx2ProjectProfile),
    [msx2ProjectProfile]
  );

  useEffect(() => {
    if (!entityPresets.some(preset => preset.id === selectedEntityPresetId)) {
      setSelectedEntityPresetId(entityPresets[0]?.id || MSX2_ENTITY_REPERTOIRE[0].id);
    }
  }, [entityPresets, selectedEntityPresetId]);

  useEffect(() => {
    const rawCollision = normalizeByteLayer(screen.layers?.collision, screen.collisionMap);
    const cleaned = stripMsx2BoxTileCollisionFromLayer(map, tiles, rawCollision);
    const changed = cleaned.some((row, y) => row.some((value, x) => value !== (rawCollision[y]?.[x] ?? 0)));
    if (!changed) return;
    onUpdate({
      layers: {
        collision: cleaned,
        effects: normalizeByteLayer(screen.layers?.effects),
        behavior: normalizeByteLayer(screen.layers?.behavior),
        entities: normalizeEntities(screen.layers?.entities),
      },
    });
  }, [screen.id, map, tiles, screen.layers?.collision, screen.collisionMap, onUpdate]);

  const selectedEntityPreset = useMemo<Msx2EntityCreatePreset>(
    () => entityPresets.find(preset => preset.id === selectedEntityPresetId)
      || entityPresets[0]
      || MSX2_ENTITY_REPERTOIRE[0],
    [entityPresets, selectedEntityPresetId]
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
    if (!screen.layers || !screen.layers.behavior || !screen.runtime || !screen.playerEntries) {
      onUpdate({
        layers,
        runtime,
        playerEntries,
        collisionMap: layers.collision,
      });
    }
  }, [layers, onUpdate, playerEntries, runtime, screen.layers, screen.playerEntries, screen.runtime]);

  useEffect(() => {
    setSelectedTileIndex(index => Math.max(0, Math.min(tiles.length - 1, index)));
  }, [tiles.length]);

  useEffect(() => {
    if (selectedEntityId && !layers.entities.some(entity => entity.id === selectedEntityId)) {
      setSelectedEntityId(null);
    }
  }, [layers.entities, selectedEntityId]);

  useEffect(() => {
    if (selectedPlayerEntryId && !playerEntries.some(entry => entry.id === selectedPlayerEntryId)) {
      setSelectedPlayerEntryId(null);
    }
  }, [playerEntries, selectedPlayerEntryId]);

  useEffect(() => {
    const stop = () => setIsDrawing(false);
    window.addEventListener('mouseup', stop);
    return () => window.removeEventListener('mouseup', stop);
  }, []);

  const updateLayers = (nextLayers: Msx2Screen4Layers) => {
    onUpdate({
      layers: nextLayers,
      collisionMap: nextLayers.collision,
    });
  };

  const updateSelectedEntity = (patch: Partial<Msx2Screen4EntityInstance>) => {
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

  const updatePlayerEntries = (nextEntries: Msx2PlayerEntry[]) => {
    onUpdate({ playerEntries: normalizeMsx2PlayerEntries(nextEntries) });
  };

  const updateSelectedPlayerEntry = (patch: Partial<Msx2PlayerEntry>) => {
    if (!selectedPlayerEntry) return;
    if (Object.prototype.hasOwnProperty.call(patch, 'id')) {
      setSelectedPlayerEntryId(String(patch.id || `entry_${playerEntries.indexOf(selectedPlayerEntry) + 1}`));
    }
    updatePlayerEntries(playerEntries.map(entry => entry.id === selectedPlayerEntry.id ? { ...entry, ...patch } : entry));
  };

  const updatePlayerEntryById = (id: string, patch: Partial<Msx2PlayerEntry>) => {
    updatePlayerEntries(playerEntries.map(entry => entry.id === id ? { ...entry, ...patch } : entry));
  };

  const addPlayerEntry = (x = 32, y = 128) => {
    const id = `entry_${playerEntries.length + 1}`;
    const nextEntry: Msx2PlayerEntry = {
      id,
      x,
      y,
      ...(defaultPlayerAssetId ? { playerId: defaultPlayerAssetId } : {}),
      facing: 'right',
      state: 'IDLE',
      entryAnimation: 'none',
      invulnerabilityFrames: 0,
      cameraTransition: 'instant',
    };
    updatePlayerEntries([...playerEntries, nextEntry]);
    setSelectedPlayerEntryId(id);
  };

  const movePlayerEntry = (id: string, x: number, y: number) => {
    setSelectedPlayerEntryId(id);
    updatePlayerEntryById(id, {
      x: Math.max(0, Math.min(255, Math.round(x))),
      y: Math.max(0, Math.min(191, Math.round(y))),
    });
  };

  const removePlayerEntry = (id: string) => {
    updatePlayerEntries(playerEntries.filter(entry => entry.id !== id));
    if (selectedPlayerEntryId === id) setSelectedPlayerEntryId(null);
  };

  const removeSelectedPlayerEntry = () => {
    if (!selectedPlayerEntry) return;
    removePlayerEntry(selectedPlayerEntry.id);
  };

  const handleCellAction = ({ x, y, button }: Msx2Screen4CellAction) => {
    if (mode === 'visual') {
      const paintedTile = tiles[selectedTileIndex];
      const nextMap = map.map(row => [...row]);
      const nextCollision = layers.collision.map(row => [...row]);
      const nextEffects = layers.effects.map(row => [...row]);
      nextMap[y][x] = selectedTileIndex;
      applyMsx2TileBehaviorToMapCell(paintedTile, x, y, nextCollision, nextEffects);
      onUpdate({
        map: nextMap,
        layers: { ...layers, collision: nextCollision, effects: nextEffects },
      });
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

    if (mode === 'playerEntries') {
      const pixelX = Math.max(0, Math.min(255, x * TILE_SIZE + TILE_SIZE / 2));
      const pixelY = Math.max(0, Math.min(191, y * TILE_SIZE + TILE_SIZE / 2));
      const existing = playerEntries.find(entry => Math.floor(entry.x / TILE_SIZE) === x && Math.floor(entry.y / TILE_SIZE) === y);
      if (button === 2) {
        if (existing?.id === selectedPlayerEntryId) setSelectedPlayerEntryId(null);
        updatePlayerEntries(playerEntries.filter(entry => entry.id !== existing?.id));
        return;
      }
      if (existing) {
        setSelectedPlayerEntryId(existing.id);
        return;
      }
      addPlayerEntry(pixelX, pixelY);
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
      const nextEntity: Msx2Screen4EntityInstance = {
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
        const nextRuntime: Msx2Screen4Runtime = {
          ...runtime,
          screenKind: 'playable',
          screenEngine: movementMode === 'maze'
            ? 'maze'
            : movementMode === 'shooterHorizontal' || movementMode === 'shooterVertical'
              ? 'shooter'
              : 'player',
          ...(movementMode ? { movementMode, movementModel: movementMode } : {}),
          ...(movementMode === 'shooterHorizontal' || movementMode === 'shooterVertical'
            ? {
              shooter: normalizeMsx2ShooterRuntimeConfig({
                direction: movementMode === 'shooterHorizontal' ? 'horizontal' : 'vertical',
                scrollMode: movementMode === 'shooterHorizontal' ? 'none' : 'tileVertical',
              }),
            }
            : {}),
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
    const lineAttributes = ensureLineAttributes(targetTile.pixels, targetTile.lineAttributes, tileWidth, tileHeight);
    targetTile.lineAttributes = lineAttributes;

    if (paintTool === 'pick') {
      setPaintSlot(Math.max(0, Math.min(15, Number(targetTile.pixels?.[y]?.[x]) || 0)));
      setTilePaintTool('pencil');
      return;
    }

    if (paintTool === 'fill') {
      const sourceSlot = Math.max(0, Math.min(15, Number(targetTile.pixels?.[y]?.[x]) || 0));
      const fillSlot = resolvePaintSlot(x, y, button, 'pencil', lineAttributes, activeSlot);
      if (sourceSlot !== fillSlot) {
        const queue: Array<[number, number]> = [[x, y]];
        const seen = new Set<string>();
        while (queue.length) {
          const [cx, cy] = queue.shift()!;
          const key = `${cx},${cy}`;
          if (seen.has(key) || cx < 0 || cy < 0 || cx >= tileWidth || cy >= tileHeight) continue;
          seen.add(key);
          if ((targetTile.pixels?.[cy]?.[cx] ?? 0) !== sourceSlot) continue;
          targetTile.pixels[cy][cx] = fillSlot;
          queue.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
        }
      }
      onUpdate({ tiles: nextTiles });
      return;
    }

    targetTile.pixels[y][x] = resolvePaintSlot(x, y, button, paintTool, lineAttributes, activeSlot);
    onUpdate({ tiles: nextTiles });
  };

  const updateSelectedTile = (buildTile: (tile: Msx2Screen4Tile) => Msx2Screen4Tile) => {
    if (!selectedTile) return;
    const nextTiles = tiles.map(cloneTile);
    const targetIndex = Math.max(0, Math.min(nextTiles.length - 1, selectedTileIndex));
    nextTiles[targetIndex] = buildTile(nextTiles[targetIndex]);
    onUpdate({ tiles: nextTiles });
  };

  const updateSelectedTileMeta = (patch: Partial<Pick<Msx2Screen4Tile, 'name' | 'behaviorKind' | 'hitbox'>>) => {
    updateSelectedTile(tile => {
      const width = normalizeTileDimension(tile.width ?? tile.pixels?.[0]?.length ?? TILE_SIZE);
      const height = normalizeTileDimension(tile.height ?? tile.pixels?.length ?? TILE_SIZE);
      const nextBehavior = patch.behaviorKind ?? getMsx2TileBehaviorKind(tile);
      const nextHitbox = patch.hitbox
        ?? (patch.behaviorKind ? getDefaultHitboxForBehavior(nextBehavior, width, height) : tile.hitbox);
      return normalizeMsx2Screen4TileBehavior({
        ...tile,
        ...patch,
        behaviorKind: nextBehavior,
        hitbox: nextHitbox,
      }, width, height);
    });
  };

  const handleUpdateLineAttribute = (rowIndex: number, segmentIndex: number, newAttribute: Msx2Screen4LineAttribute) => {
    updateSelectedTile(tile => {
      const width = normalizeTileDimension(tile.width ?? tile.pixels?.[0]?.length ?? TILE_SIZE);
      const height = normalizeTileDimension(tile.height ?? tile.pixels?.length ?? TILE_SIZE);
      const lineAttributes = ensureLineAttributes(tile.pixels, tile.lineAttributes, width, height);
      const oldAttribute = lineAttributes[rowIndex]?.[segmentIndex];
      if (!oldAttribute) {
        return { ...tile, lineAttributes };
      }
      const nextAttributes = lineAttributes.map((row, rIdx) =>
        rIdx === rowIndex ? row.map((seg, sIdx) => (sIdx === segmentIndex ? { ...newAttribute } : { ...seg })) : row.map(seg => ({ ...seg }))
      );
      return {
        ...tile,
        width,
        height,
        lineAttributes: nextAttributes,
        pixels: remapSegmentPixels(tile.pixels, rowIndex, segmentIndex, oldAttribute, newAttribute),
      };
    });
  };

  const handleFillAllLineAttributeSlots = (type: 'fg' | 'bg') => {
    updateSelectedTile(tile => {
      const width = normalizeTileDimension(tile.width ?? tile.pixels?.[0]?.length ?? TILE_SIZE);
      const height = normalizeTileDimension(tile.height ?? tile.pixels?.length ?? TILE_SIZE);
      const lineAttributes = ensureLineAttributes(tile.pixels, tile.lineAttributes, width, height);
      return {
        ...tile,
        lineAttributes: fillAllLineAttributeSlots(lineAttributes, activeSlot, type),
      };
    });
  };

  const handleCopyLineAttribute = (rowIndex: number, segmentIndex: number) => {
    const attribute = selectedTile?.lineAttributes?.[rowIndex]?.[segmentIndex];
    if (attribute) setCopiedLineAttribute({ ...attribute });
  };

  const handlePasteLineAttribute = (rowIndex: number, segmentIndex: number) => {
    if (copiedLineAttribute) handleUpdateLineAttribute(rowIndex, segmentIndex, copiedLineAttribute);
  };

  const handleFixInvalidPixels = () => {
    updateSelectedTile(tile => {
      const width = normalizeTileDimension(tile.width ?? tile.pixels?.[0]?.length ?? TILE_SIZE);
      const height = normalizeTileDimension(tile.height ?? tile.pixels?.length ?? TILE_SIZE);
      const lineAttributes = ensureLineAttributes(tile.pixels, tile.lineAttributes, width, height);
      return {
        ...tile,
        width,
        height,
        lineAttributes,
        pixels: fixInvalidTilePixels(tile.pixels, lineAttributes),
      };
    });
  };


  const fillSelectedTile = () => {
    updateSelectedTile(tile => {
      const width = normalizeTileDimension(tile.width ?? tile.pixels?.[0]?.length ?? TILE_SIZE);
      const height = normalizeTileDimension(tile.height ?? tile.pixels?.length ?? TILE_SIZE);
      const lineAttributes = ensureLineAttributes(tile.pixels, tile.lineAttributes, width, height)
        .map(row => row.map(segment => ({ fg: activeSlot, bg: segment.bg })));
      const pixels = Array.from({ length: height }, (_, y) =>
        Array.from({ length: width }, (_, x) => lineAttributes[y]?.[Math.floor(x / 8)]?.bg ?? 0)
      );
      return { ...tile, width, height, pixels, lineAttributes };
    });
  };

  const flipSelectedTileHorizontal = () => {
    updateSelectedTile(tile => {
      const width = normalizeTileDimension(tile.width ?? tile.pixels?.[0]?.length ?? TILE_SIZE);
      const height = normalizeTileDimension(tile.height ?? tile.pixels?.length ?? TILE_SIZE);
      return {
        ...tile,
        width,
        height,
        pixels: tile.pixels.map(row => [...row].reverse()),
        lineAttributes: mirrorLineAttributesHorizontal(tile.lineAttributes, width) ?? ensureLineAttributes(tile.pixels, tile.lineAttributes, width, height),
      };
    });
  };

  const flipSelectedTileVertical = () => {
    updateSelectedTile(tile => {
      const width = normalizeTileDimension(tile.width ?? tile.pixels?.[0]?.length ?? TILE_SIZE);
      const height = normalizeTileDimension(tile.height ?? tile.pixels?.length ?? TILE_SIZE);
      return {
        ...tile,
        width,
        height,
        pixels: [...tile.pixels].reverse().map(row => [...row]),
        lineAttributes: mirrorLineAttributesVertical(tile.lineAttributes) ?? ensureLineAttributes(tile.pixels, tile.lineAttributes, width, height),
      };
    });
  };

  const shiftSelectedTile = (dx: number, dy: number) => {
    updateSelectedTile(tile => {
      const width = normalizeTileDimension(tile.width ?? tile.pixels?.[0]?.length ?? TILE_SIZE);
      const height = normalizeTileDimension(tile.height ?? tile.pixels?.length ?? TILE_SIZE);
      const lineAttributes = ensureLineAttributes(tile.pixels, tile.lineAttributes, width, height);
      const shiftedPixels = Array.from({ length: height }, (_, y) =>
        Array.from({ length: width }, (_, x) => {
          const sourceX = x - dx;
          const sourceY = y - dy;
          if (sourceX < 0 || sourceY < 0 || sourceX >= width || sourceY >= height) return 0;
          return tile.pixels[sourceY]?.[sourceX] ?? 0;
        })
      );
      return {
        ...tile,
        width,
        height,
        pixels: fixInvalidTilePixels(shiftedPixels, lineAttributes),
        lineAttributes,
      };
    });
  };

  const resizeSelectedTile = (width: number, height: number) => {
    if (!selectedTile) return;
    const nextWidth = normalizeTileDimension(width);
    const nextHeight = normalizeTileDimension(height);
    updateSelectedTile(tile => ({
      ...tile,
      width: nextWidth,
      height: nextHeight,
      pixels: Array.from({ length: nextHeight }, (_, y) =>
        Array.from({ length: nextWidth }, (_, x) => Math.max(0, Math.min(15, Number(tile.pixels?.[y]?.[x]) || 0)))
      ),
      lineAttributes: resizeLineAttributes(
        tile.lineAttributes,
        normalizeTileDimension(tile.width ?? tile.pixels?.[0]?.length ?? TILE_SIZE),
        normalizeTileDimension(tile.height ?? tile.pixels?.length ?? TILE_SIZE),
        nextWidth,
        nextHeight
      ),
    }));
  };

  const addTile = () => {
    const nextTile = createTileWithDefaults(0, TILE_SIZE, TILE_SIZE);
    nextTile.name = `Tile ${tiles.length}`;
    const nextTiles = [...tiles.map(cloneTile), nextTile];
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
    updateSelectedTile(tile => {
      const width = normalizeTileDimension(tile.width ?? tile.pixels?.[0]?.length ?? TILE_SIZE);
      const height = normalizeTileDimension(tile.height ?? tile.pixels?.length ?? TILE_SIZE);
      return {
        ...tile,
        width,
        height,
        pixels: createTilePixels(0, width, height),
        lineAttributes: createDefaultLineAttributes(width, height),
      };
    });
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
      const paintedTile = tiles[Math.max(0, Math.min(tiles.length - 1, value))];
      const nextMap = map.map(row => [...row]);
      const nextCollision = layers.collision.map(row => [...row]);
      const nextEffects = layers.effects.map(row => [...row]);
      for (let y = selectionRect.y; y < selectionRect.y + selectionRect.height; y++) {
        for (let x = selectionRect.x; x < selectionRect.x + selectionRect.width; x++) {
          const tileIndex = Math.max(0, Math.min(tiles.length - 1, value));
          nextMap[y][x] = tileIndex;
          applyMsx2TileBehaviorToMapCell(paintedTile, x, y, nextCollision, nextEffects);
        }
      }
      onUpdate({
        map: nextMap,
        layers: { ...layers, collision: nextCollision, effects: nextEffects },
      });
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

  const applyCompositionPreset = (preset: Msx2RoomCompositionPreset) => {
    const presetConfig = {
      full: { y: 0, height: MAP_HEIGHT },
      topHud: { y: 2, height: Math.max(1, MAP_HEIGHT - 2) },
      topHudBottom: { y: 2, height: Math.max(1, MAP_HEIGHT - 3) },
      tallHud: { y: 3, height: Math.max(1, MAP_HEIGHT - 3) },
    }[preset];

    onUpdate({
      runtime: normalizeRuntime({
        ...runtime,
        activeAreaX: 0,
        activeAreaY: presetConfig.y,
        activeAreaWidth: MAP_WIDTH,
        activeAreaHeight: presetConfig.height,
      }),
    });
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
          <Msx2Screen4Toolbar
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
            compositionOverlay={compositionOverlay}
            onCompositionOverlayChange={setCompositionOverlay}
            runtime={runtime}
            onRuntimeChange={nextRuntime => onUpdate({ runtime: normalizeRuntime(nextRuntime) })}
            lockedRuntimeMode={lockedRuntimeMode}
            lockedRuntimeModeHint={msx2ProjectProfile ? `${msx2ProjectProfile.label} project` : null}
            canCopyLayer={editableRuntimeLayer}
            canPasteLayer={editableRuntimeLayer && !!copiedLayer}
            onCopyLayer={copyActiveLayer}
            onPasteLayer={pasteActiveLayer}
          />
          {mode === 'playerEntries' && (
            <Panel title="Player Entries" bodyClassName="p-2 space-y-2 text-xs">
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => addPlayerEntry()}>Add</Button>
                <Button size="sm" variant="danger" onClick={removeSelectedPlayerEntry} disabled={!selectedPlayerEntry}>Remove</Button>
              </div>
              <div className="space-y-1 max-h-40 overflow-auto">
                {playerEntries.map(entry => (
                  <button
                    key={entry.id}
                    type="button"
                    className={`w-full text-left px-2 py-1 rounded border ${selectedPlayerEntry?.id === entry.id ? 'border-msx-accent bg-msx-accent/15' : 'border-msx-border bg-msx-bgcolor'}`}
                    onClick={() => setSelectedPlayerEntryId(entry.id)}
                  >
                    <span className="block font-mono">{entry.id}</span>
                    <span className="block text-[10px] text-msx-textsecondary">{entry.x},{entry.y} {entry.facing} - {getPlayerEntryAssetLabel(entry.playerId)}</span>
                  </button>
                ))}
              </div>
              {selectedPlayerEntry && (
                <div className="space-y-2 border-t border-msx-border pt-2">
                  <label className="block space-y-1">
                    <span className="text-msx-textsecondary">Player Asset</span>
                    <select
                      className="w-full px-2 py-1 bg-msx-bgcolor border border-msx-border rounded"
                      value={selectedPlayerEntry.playerId || ''}
                      onChange={event => updateSelectedPlayerEntry({ playerId: event.target.value || undefined })}
                    >
                      <option value="">Default player</option>
                      {playerAssetOptions.map(asset => (
                        <option key={asset.id} value={asset.id}>{asset.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="text-msx-textsecondary">Entry ID</span>
                    <input className="w-full px-2 py-1 bg-msx-bgcolor border border-msx-border rounded" value={selectedPlayerEntry.id} onChange={event => updateSelectedPlayerEntry({ id: event.target.value })} />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block space-y-1">
                      <span className="text-msx-textsecondary">X</span>
                      <input type="number" className="w-full px-2 py-1 bg-msx-bgcolor border border-msx-border rounded" value={selectedPlayerEntry.x} onChange={event => updateSelectedPlayerEntry({ x: Number(event.target.value) })} />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-msx-textsecondary">Y</span>
                      <input type="number" className="w-full px-2 py-1 bg-msx-bgcolor border border-msx-border rounded" value={selectedPlayerEntry.y} onChange={event => updateSelectedPlayerEntry({ y: Number(event.target.value) })} />
                    </label>
                  </div>
                  <label className="block space-y-1">
                    <span className="text-msx-textsecondary">Facing</span>
                    <select className="w-full px-2 py-1 bg-msx-bgcolor border border-msx-border rounded" value={selectedPlayerEntry.facing} onChange={event => updateSelectedPlayerEntry({ facing: event.target.value as Msx2PlayerEntry['facing'] })}>
                      <option value="neutral">Neutral</option>
                      <option value="right">Right</option>
                      <option value="left">Left</option>
                      <option value="up">Up</option>
                      <option value="down">Down</option>
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="text-msx-textsecondary">Spawn state</span>
                    <input className="w-full px-2 py-1 bg-msx-bgcolor border border-msx-border rounded" value={selectedPlayerEntry.state || 'IDLE'} onChange={event => updateSelectedPlayerEntry({ state: event.target.value })} />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block space-y-1">
                      <span className="text-msx-textsecondary">Entry anim</span>
                      <select className="w-full px-2 py-1 bg-msx-bgcolor border border-msx-border rounded" value={selectedPlayerEntry.entryAnimation || 'none'} onChange={event => updateSelectedPlayerEntry({ entryAnimation: event.target.value as Msx2PlayerEntry['entryAnimation'] })}>
                        <option value="none">None</option>
                        <option value="walkIn">Walk in</option>
                        <option value="doorExit">Door exit</option>
                        <option value="ladderExit">Ladder exit</option>
                        <option value="fadeIn">Fade in</option>
                      </select>
                    </label>
                    <label className="block space-y-1">
                      <span className="text-msx-textsecondary">I-frames</span>
                      <input type="number" className="w-full px-2 py-1 bg-msx-bgcolor border border-msx-border rounded" value={selectedPlayerEntry.invulnerabilityFrames || 0} onChange={event => updateSelectedPlayerEntry({ invulnerabilityFrames: Number(event.target.value) })} />
                    </label>
                  </div>
                </div>
              )}
            </Panel>
          )}
          <Msx2Screen4EntityPanel
            mode={mode}
            selectedEntity={selectedEntity}
            tiles={tiles}
            allAssets={allAssets}
            onUpdateSelectedEntity={updateSelectedEntity}
            onUpdateSelectedEntityParams={updateSelectedEntityParams}
            onRemoveSelectedEntity={removeSelectedEntity}
            msx2ProjectProfile={msx2ProjectProfile}
          />
          <Msx2Screen4EntityPalettePanel
            mode={mode}
            presets={entityPresets}
            selectedPresetId={selectedEntityPresetId}
            onSelectPresetId={setSelectedEntityPresetId}
          />
          <Msx2Screen4SelectionPanel
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
          {mode !== 'entities' && mode !== 'playerEntries' && (
            <Msx2Screen4TilesPanel
              tiles={tiles}
              slots={slots}
              selectedTileIndex={selectedTileIndex}
              onSelectTileIndex={setSelectedTileIndex}
              onAddTile={addTile}
              onDuplicateTile={duplicateTile}
              onClearTile={clearTile}
              onOpenTileStudio={() => setTileStudioOpen(open => !open)}
              tileStudioOpen={tileStudioOpen}
            />
          )}
        </div>

          <div className="min-w-0 flex-1 min-h-0 overflow-auto flex items-start justify-center p-3">
          {tileStudioOpen && mode !== 'entities' && mode !== 'playerEntries' ? (
            <Msx2Screen4TileStudio
              tiles={tiles}
              slots={slots}
              selectedTileIndex={selectedTileIndex}
              selectedTile={selectedTile}
              onSelectTileIndex={setSelectedTileIndex}
              onAddTile={addTile}
              onDuplicateTile={duplicateTile}
              onClearTile={clearTile}
              onClose={() => setTileStudioOpen(false)}
              onUpdate={onUpdate}
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
              onUpdateLineAttribute={handleUpdateLineAttribute}
              onFillAllLineAttributeFg={() => handleFillAllLineAttributeSlots('fg')}
              onFillAllLineAttributeBg={() => handleFillAllLineAttributeSlots('bg')}
              onCopyLineAttribute={handleCopyLineAttribute}
              onPasteLineAttribute={handlePasteLineAttribute}
              copiedLineAttribute={copiedLineAttribute}
              onFixInvalidPixels={handleFixInvalidPixels}
              onUpdateTileMeta={updateSelectedTileMeta}
            />
          ) : (
          <Msx2Screen4Grid
            map={map}
            slots={slots}
            tiles={tiles}
            showGrid={showGrid}
            mode={mode}
            layers={layers}
            playerEntries={playerEntries}
            runtime={runtime}
            selectionMode={selectionMode}
            selectionRect={selectionRect}
            selectedEntityId={selectedEntityId}
            selectedPlayerEntryId={selectedPlayerEntryId}
            showRuntimeOverlays={showRuntimeOverlays}
            compositionOverlay={compositionOverlay}
            isDrawing={isDrawing}
            onSetDrawing={setIsDrawing}
            onCellAction={handleCellAction}
            onSelectionChange={setSelectionRect}
            onSelectPlayerEntry={setSelectedPlayerEntryId}
            onCreatePlayerEntryAt={addPlayerEntry}
            onMovePlayerEntry={movePlayerEntry}
            onRemovePlayerEntry={removePlayerEntry}
          />
          )}
        </div>

          <div className="flex flex-shrink-0 min-h-0 self-stretch">
            <button
              type="button"
              onClick={() => setRightSidebarOpen(open => !open)}
              className="self-start mt-2 w-6 min-h-[3.5rem] flex items-center justify-center rounded-l-md border border-msx-border border-r-0 bg-msx-bgcolor text-msx-textsecondary hover:text-msx-highlight hover:border-msx-highlight"
              title={rightSidebarOpen ? 'Ocultar panel derecho' : 'Mostrar panel derecho'}
              aria-expanded={rightSidebarOpen}
              aria-label={rightSidebarOpen ? 'Ocultar panel derecho' : 'Mostrar panel derecho'}
            >
              {rightSidebarOpen ? '>' : '<'}
            </button>
            {rightSidebarOpen && (
          <div className="w-[300px] flex-shrink-0 min-h-0 overflow-y-auto border-l border-msx-border pl-2 space-y-2">
          {mode !== 'entities' && mode !== 'playerEntries' && !tileStudioOpen && (
            <Msx2Screen4TileEditorPanel
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
              onUpdateLineAttribute={handleUpdateLineAttribute}
              onFillAllLineAttributeFg={() => handleFillAllLineAttributeSlots('fg')}
              onFillAllLineAttributeBg={() => handleFillAllLineAttributeSlots('bg')}
              onCopyLineAttribute={handleCopyLineAttribute}
              onPasteLineAttribute={handlePasteLineAttribute}
              copiedLineAttribute={copiedLineAttribute}
              onFixInvalidPixels={handleFixInvalidPixels}
              onUpdateTileMeta={updateSelectedTileMeta}
            />
          )}
          <Msx2Screen4ExportModelPanel layers={layers} />
          <MSX2CompositionPanel
            title="MSX2 Room Composition"
            screenWidth={MAP_WIDTH}
            screenHeight={MAP_HEIGHT}
            pixelWidth={MAP_WIDTH * TILE_SIZE}
            pixelHeight={MAP_HEIGHT * TILE_SIZE}
            cellPixelSize={TILE_SIZE}
            activeAreaX={runtime.activeAreaX}
            activeAreaY={runtime.activeAreaY}
            activeAreaWidth={runtime.activeAreaWidth}
            activeAreaHeight={runtime.activeAreaHeight}
            currentMode="raw"
            rawLengthBytes={MAP_WIDTH * MAP_HEIGHT}
            blocks2x2={null}
            blocks4x4={null}
            recommendedMode="raw"
            onApplyRoomPreset={applyCompositionPreset}
            className="w-full"
          />
          <MSX2HudPlanPanel
            runtime={runtime}
            onRuntimeChange={nextRuntime => onUpdate({ runtime: normalizeRuntime(nextRuntime) })}
          />
          <MSX2AtlasPreviewPanel
            tiles={tiles}
            map={map}
            runtime={runtime}
          />
          </div>
            )}
          </div>
        </div>
      </div>
      <Msx2Screen4StatusBar
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
