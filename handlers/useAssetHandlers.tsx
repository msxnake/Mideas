import { useCallback } from 'react';
import {
  ProjectAsset, EditorType, Tile, Sprite, Msx2Sprite, Msx2Screen4TileScreen, ScreenMap, ScreenLayerData, ScreenTile, SpriteFrame,
  TileLogicalProperties, Point, PixelData, TileBank, GameFlowNode, GameFlowGraph, Msx2GameFlowGraph,
  PSGSoundChannelState, PSGSoundChannelStep, PaletteAsset,
  DialogueAsset, PortraitAsset, ScreenKind, Boss, Msx2HudFontAsset, Msx2Screen4BitmapRoom, Msx2PlayerDefinition
} from '../types';
import {
  DEFAULT_TILE_WIDTH, DEFAULT_TILE_HEIGHT, MSX_SCREEN5_PALETTE, MSX1_PALETTE,
  DEFAULT_SCREEN2_FG_COLOR, DEFAULT_SCREEN2_BG_COLOR, DEFAULT_SCREEN_WIDTH_TILES,
  DEFAULT_SCREEN_HEIGHT_TILES, DEFAULT_SPRITE_SIZE, EDITOR_BASE_TILE_DIM_S2,
  DEFAULT_TILE_BANK_DEFINITIONS,
  DEFAULT_PRESENTATION_SCREEN_CONFIG,
  DEFAULT_MSX2_SCREEN5_PRESENTATION_CONFIG
} from '../constants';
import { createDefaultLineAttributes } from '../components/utils/tileUtils';
import { DEFAULT_MSX_FONT } from '../components/utils/msxFontRenderer';
import { createDefaultScreen5PaletteSlots } from '../utils/msx2PaletteUtils';
import { getScreenModeMetrics } from '../utils/screenModeConfig';
import { createCmajorChiptuneSampleSong } from '../utils/trackerSampleSong';
import { getProjectTargetFromScreenMode, isAssetTypeEnabledForMsx2Project } from '../utils/projectTarget';
import { createDefaultMsx2PlayerDefinition, createDefaultMsx2PlayerEntries } from '../utils/msx2PlayerDefaults';
import { buildDetailedMsx2PlayerDocument, MSX2_PLAYER_DOCUMENT_SCHEMA } from '../utils/msx2PlayerDocument';
import { GLOBAL_ENEMY_TEMPLATES, createEnemyFromTemplate } from '../data/enemyLibrary';

const MSX2_HUD_FONT_CHARACTERS = ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ:-/';
const DEFAULT_MSX2_HUD_FONT_PATTERNS: Record<string, number[]> = {
  ' ': [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
  '0': [0x3C,0x66,0x6E,0x76,0x66,0x66,0x3C,0x00],
  '1': [0x18,0x38,0x18,0x18,0x18,0x18,0x7E,0x00],
  '2': [0x3C,0x66,0x06,0x1C,0x30,0x60,0x7E,0x00],
  '3': [0x3C,0x66,0x06,0x1C,0x06,0x66,0x3C,0x00],
  '4': [0x0C,0x1C,0x3C,0x6C,0x7E,0x0C,0x0C,0x00],
  '5': [0x7E,0x60,0x7C,0x06,0x06,0x66,0x3C,0x00],
  '6': [0x1C,0x30,0x60,0x7C,0x66,0x66,0x3C,0x00],
  '7': [0x7E,0x06,0x0C,0x18,0x30,0x30,0x30,0x00],
  '8': [0x3C,0x66,0x66,0x3C,0x66,0x66,0x3C,0x00],
  '9': [0x3C,0x66,0x66,0x3E,0x06,0x0C,0x38,0x00],
  A: [0x18,0x3C,0x66,0x66,0x7E,0x66,0x66,0x00],
  B: [0x7C,0x66,0x66,0x7C,0x66,0x66,0x7C,0x00],
  C: [0x3C,0x66,0x60,0x60,0x60,0x66,0x3C,0x00],
  D: [0x78,0x6C,0x66,0x66,0x66,0x6C,0x78,0x00],
  E: [0x7E,0x60,0x60,0x7C,0x60,0x60,0x7E,0x00],
  F: [0x7E,0x60,0x60,0x7C,0x60,0x60,0x60,0x00],
  G: [0x3C,0x66,0x60,0x6E,0x66,0x66,0x3C,0x00],
  H: [0x66,0x66,0x66,0x7E,0x66,0x66,0x66,0x00],
  I: [0x7E,0x18,0x18,0x18,0x18,0x18,0x7E,0x00],
  J: [0x1E,0x0C,0x0C,0x0C,0x0C,0x6C,0x38,0x00],
  K: [0x66,0x6C,0x78,0x70,0x78,0x6C,0x66,0x00],
  L: [0x60,0x60,0x60,0x60,0x60,0x60,0x7E,0x00],
  M: [0x63,0x77,0x7F,0x6B,0x63,0x63,0x63,0x00],
  N: [0x66,0x76,0x7E,0x7E,0x6E,0x66,0x66,0x00],
  O: [0x3C,0x66,0x66,0x66,0x66,0x66,0x3C,0x00],
  P: [0x7C,0x66,0x66,0x7C,0x60,0x60,0x60,0x00],
  Q: [0x3C,0x66,0x66,0x66,0x6A,0x6C,0x36,0x00],
  R: [0x7C,0x66,0x66,0x7C,0x78,0x6C,0x66,0x00],
  S: [0x3C,0x66,0x60,0x3C,0x06,0x66,0x3C,0x00],
  T: [0x7E,0x18,0x18,0x18,0x18,0x18,0x18,0x00],
  U: [0x66,0x66,0x66,0x66,0x66,0x66,0x3C,0x00],
  V: [0x66,0x66,0x66,0x66,0x66,0x3C,0x18,0x00],
  W: [0x63,0x63,0x63,0x6B,0x7F,0x77,0x63,0x00],
  X: [0x66,0x66,0x3C,0x18,0x3C,0x66,0x66,0x00],
  Y: [0x66,0x66,0x66,0x3C,0x18,0x18,0x18,0x00],
  Z: [0x7E,0x06,0x0C,0x18,0x30,0x60,0x7E,0x00],
  ':': [0x00,0x18,0x18,0x00,0x00,0x18,0x18,0x00],
  '-': [0x00,0x00,0x00,0x7E,0x00,0x00,0x00,0x00],
  '/': [0x06,0x0C,0x0C,0x18,0x30,0x30,0x60,0x00],
};

interface AssetHandlersProps {
  assets: ProjectAsset[];
  setAssetsWithHistory: (updater: (prevAssets: ProjectAsset[]) => ProjectAsset[]) => void;
  setTileBanksWithHistory: (updater: (prevTileBanks: TileBank[]) => TileBank[]) => void;
  setStatusBarMessage: (message: string) => void;
  selectedAssetId: string | null;
  setSelectedAssetId: (id: string | null) => void;
  setCurrentEditor: (editor: EditorType) => void;
  currentScreenMode: string;
  msx2ProjectProfile?: import('../types').Msx2ProjectProfile | null;
  setConfirmModalProps: (props: any) => void;
  setIsConfirmModalOpen: (open: boolean) => void;
  setSelectedEffectZoneId: (id: string | null) => void;
  setSpriteForFramesModal: (asset: ProjectAsset | null) => void;
  setIsSpriteFramesModalOpen: (open: boolean) => void;
  setIsSpriteSheetModalOpen: (open: boolean) => void;
  waypointPickerState: any;
  setWaypointPickerState: (state: any) => void;
}

export const useAssetHandlers = ({
  assets,
  setAssetsWithHistory,
  setTileBanksWithHistory,
  setStatusBarMessage,
  selectedAssetId,
  setSelectedAssetId,
  setCurrentEditor,
  currentScreenMode,
  msx2ProjectProfile = null,
  setConfirmModalProps,
  setIsConfirmModalOpen,
  setSelectedEffectZoneId,
  setSpriteForFramesModal,
  setIsSpriteFramesModalOpen,
  setIsSpriteSheetModalOpen,
  waypointPickerState,
  setWaypointPickerState
}: AssetHandlersProps) => {

  const getTileDataIdFromAsset = (asset: ProjectAsset | undefined): string | undefined => (
    asset?.type === 'tile' ? (asset.data as Tile | undefined)?.id : undefined
  );

  const collectTileReferenceIds = (tileAsset: ProjectAsset): Set<string> => {
    const tileIds = new Set<string>([tileAsset.id]);
    const tileDataId = getTileDataIdFromAsset(tileAsset);
    if (tileDataId) tileIds.add(tileDataId);
    return tileIds;
  };

  const collectBossTileIds = (boss: Boss): Set<string> => {
    const tileIds = new Set<string>();
    const addTileId = (tileId?: string | null) => {
      if (tileId) tileIds.add(tileId);
    };
    const addTileMatrix = (matrix?: (string | null)[][]) => {
      matrix?.forEach(row => row.forEach(addTileId));
    };
    const addWeakPointTiles = (weakPoints?: Array<{ destroyedTileId?: string }>) => {
      weakPoints?.forEach(weakPoint => addTileId(weakPoint.destroyedTileId));
    };

    boss.phases?.forEach(phase => {
      addTileMatrix(phase.tileMatrix);
      addWeakPointTiles(phase.weakPoints);
      phase.forms?.forEach(form => {
        addTileMatrix(form.tileMatrix);
        addWeakPointTiles(form.weakPoints);
      });
    });
    boss.attacks?.forEach(attack => {
      addTileId(attack.laserTileAssetId);
      addTileId(attack.blockTileAssetId);
    });

    return tileIds;
  };

  const removeTileAssignmentsFromBank = (tileBank: TileBank, tileIdsToRemove: Set<string>): TileBank => ({
    ...tileBank,
    banks: tileBank.banks.map(bank => {
      const assignedTiles = { ...(bank.assignedTiles || {}) };
      let changed = false;
      tileIdsToRemove.forEach(tileId => {
        if (tileId in assignedTiles) {
          delete assignedTiles[tileId];
          changed = true;
        }
      });

      return changed ? { ...bank, assignedTiles } : bank;
    }),
  });

  const deleteAssetAndMaybeTiles = (
    assetToDelete: ProjectAsset,
    tileIdsToDelete: Set<string> = new Set(),
    deletedTileAssetCount = tileIdsToDelete.size
  ) => {
    setAssetsWithHistory(prevAssets => {
      const remainingAssets = prevAssets
        .filter(asset => asset.id !== assetToDelete.id)
        .filter(asset => {
          if (asset.type !== 'tile') return true;
          const tileReferenceIds = collectTileReferenceIds(asset);
          return !Array.from(tileReferenceIds).some(tileId => tileIdsToDelete.has(tileId));
        })
        .map(asset => {
          if (asset.type !== 'tilebank' || !asset.data || tileIdsToDelete.size === 0) return asset;
          return {
            ...asset,
            data: removeTileAssignmentsFromBank(asset.data as TileBank, tileIdsToDelete),
          };
        });

      if (assetToDelete.type !== 'statemachine') {
        return remainingAssets;
      }

      return remainingAssets.map(asset => {
        if (asset.type !== 'screenmap' || !asset.data) return asset;

        const screenMap = asset.data as ScreenMap;
        const entities = screenMap.layers?.entities;
        if (!Array.isArray(entities)) return asset;

        let changed = false;
        const updatedEntities = entities.map(entity => {
          const overrides = entity.componentOverrides || {};
          const smOverride = overrides['comp_statemachine'];
          if (!smOverride || typeof smOverride !== 'object') return entity;
          if ((smOverride as any).stateMachineAssetId !== assetToDelete.id) return entity;

          const nextSmOverride = { ...(smOverride as Record<string, any>) };
          delete nextSmOverride.stateMachineAssetId;
          delete nextSmOverride.currentStateId;

          const nextOverrides: Record<string, any> = { ...overrides };
          if (Object.keys(nextSmOverride).length === 0) {
            delete nextOverrides['comp_statemachine'];
          } else {
            nextOverrides['comp_statemachine'] = nextSmOverride;
          }

          changed = true;
          return { ...entity, componentOverrides: nextOverrides };
        });

        if (!changed) return asset;

        return {
          ...asset,
          data: {
            ...screenMap,
            layers: {
              ...screenMap.layers,
              entities: updatedEntities
            }
          }
        };
      });
    });

    if (tileIdsToDelete.size > 0) {
      setTileBanksWithHistory(prevTileBanks => prevTileBanks.map(tileBank => removeTileAssignmentsFromBank(tileBank, tileIdsToDelete)));
    }
    if (assetToDelete.type === 'tilebank') {
      const deletedTileBankId = (assetToDelete.data as TileBank | undefined)?.id;
      setTileBanksWithHistory(prevTileBanks => prevTileBanks.filter(tileBank => (
        tileBank.id !== assetToDelete.id && tileBank.id !== deletedTileBankId
      )));
    }

    if (selectedAssetId === assetToDelete.id) {
      setSelectedAssetId(null);
      setCurrentEditor(EditorType.None);
      setSelectedEffectZoneId(null);
    }

    const isDeletingSingleTile = assetToDelete.type === 'tile';
    setStatusBarMessage(
      tileIdsToDelete.size > 0
        ? `Asset "${assetToDelete.name}" deleted${isDeletingSingleTile ? '' : ` with ${deletedTileAssetCount} boss tile${deletedTileAssetCount === 1 ? '' : 's'}`}. Bank assignments were cleaned.`
        : `Asset "${assetToDelete.name}" deleted.`
    );
    setIsConfirmModalOpen(false);
    setConfirmModalProps(null);
  };

  const handleUpdateAsset = useCallback((assetId: string, updatedData: any, newAssetsToCreate?: ProjectAsset[]) => {
    const assetBeforeUpdate = assets.find(asset => asset.id === assetId);
    const originalUpdatedData = updatedData;
    setAssetsWithHistory(prevAssets => {
      let intermediateAssets = prevAssets;
      if (newAssetsToCreate && newAssetsToCreate.length > 0) {
        intermediateAssets = [...prevAssets, ...newAssetsToCreate];

        const newAssetTypes = new Set(newAssetsToCreate.map(a => a.type));
        let message = `Created ${newAssetsToCreate.length} new ${Array.from(newAssetTypes).join('/')} asset(s).`;
        if (newAssetsToCreate.length === 1) message = `Created new ${newAssetsToCreate[0].type} asset: ${newAssetsToCreate[0].name}.`;
        setStatusBarMessage(message);
      }

      const isFunctionalUpdate = typeof updatedData === 'function';
      const isDataUpdateNeeded = isFunctionalUpdate || (updatedData && (!(typeof updatedData === 'object' && Object.keys(updatedData).length === 0)));

      if (!isDataUpdateNeeded) {
        return intermediateAssets;
      }

      return intermediateAssets.map(asset => {
        if (asset.id === assetId) {
          let effectiveUpdatedData = isFunctionalUpdate
            ? updatedData(asset.data, asset)
            : updatedData;

          if (!effectiveUpdatedData || (typeof effectiveUpdatedData === 'object' && Object.keys(effectiveUpdatedData).length === 0)) {
            return asset;
          }

          let newAssetData: ProjectAsset['data'] = asset.data;
          let newAssetName = asset.name;

          // Check if name is being updated and apply it to the asset itself
          if (effectiveUpdatedData && typeof effectiveUpdatedData === 'object' && 'name' in effectiveUpdatedData) {
            newAssetName = effectiveUpdatedData.name;
            // Remove name from data update to avoid duplication
            const { name, ...dataWithoutName } = effectiveUpdatedData;
            effectiveUpdatedData = dataWithoutName;
          }

          if (asset.type === 'msx2player' && effectiveUpdatedData?.schema === MSX2_PLAYER_DOCUMENT_SCHEMA) {
            newAssetData = effectiveUpdatedData;
            if (effectiveUpdatedData.player?.identity?.name) {
              newAssetName = effectiveUpdatedData.player.identity.name;
            }
            return { ...asset, name: newAssetName, data: newAssetData };
          }

          if (typeof asset.data === 'object' && asset.data !== null) {
            newAssetData = { ...asset.data, ...effectiveUpdatedData };
          } else {
            newAssetData = effectiveUpdatedData;
          }
          return { ...asset, name: newAssetName, data: newAssetData };
        }
        return asset;
      });
    });
    const createdTileBanks = (newAssetsToCreate || [])
      .filter(asset => asset.type === 'tilebank' && asset.data && Array.isArray((asset.data as TileBank).banks))
      .map(asset => asset.data as TileBank);
    if (createdTileBanks.length > 0) {
      setTileBanksWithHistory(prevTileBanks => [
        ...prevTileBanks.filter(tileBank => !createdTileBanks.some(created => created.id === tileBank.id)),
        ...createdTileBanks
      ]);
    }
    if (
      assetBeforeUpdate?.type === 'tilebank'
      && originalUpdatedData
      && typeof originalUpdatedData === 'object'
      && Object.keys(originalUpdatedData).length > 0
    ) {
      const tileBankData = assetBeforeUpdate.data as TileBank | undefined;
      if (tileBankData && Array.isArray(tileBankData.banks)) {
        const updatedTileBank = { ...tileBankData, ...originalUpdatedData } as TileBank;
        setTileBanksWithHistory(prevTileBanks => prevTileBanks.map(tileBank => (
          tileBank.id === assetBeforeUpdate.id || tileBank.id === tileBankData.id
            ? updatedTileBank
            : tileBank
        )));
      }
    }
  }, [assets, setAssetsWithHistory, setStatusBarMessage, setTileBanksWithHistory]);

  const handleNewAsset = (type: ProjectAsset['type'], options?: { select?: boolean; screenKind?: ScreenKind }): ProjectAsset | undefined => {
    if (type === 'msx2bitmap') {
      setStatusBarMessage('MSX2 bitmap assets are legacy import-only; use MSX2 SCREEN 4 Room (16x12) for new projects.');
      return undefined;
    }

    if (!isAssetTypeEnabledForMsx2Project(type, currentScreenMode, msx2ProjectProfile)) {
      setStatusBarMessage(`${type} is disabled for this ${getProjectTargetFromScreenMode(currentScreenMode)} project profile.`);
      return undefined;
    }

    const id = `${type}_${Date.now()}`;
    let newAssetData: any;
    let defaultName = `New ${type.charAt(0).toUpperCase() + type.slice(1)}`;

    // Special naming for gameflow assets
    if (type === 'gameflow') {
      const existingGameflows = assets.filter(a => a.type === 'gameflow');
      if (existingGameflows.length === 0) {
        // First gameflow is always "Main"
        defaultName = 'Main';
      } else {
        // Find unique name for subsequent gameflows
        let counter = 1;
        let candidateName = `New Gameflow ${counter}`;
        while (existingGameflows.some(a => a.name === candidateName)) {
          counter++;
          candidateName = `New Gameflow ${counter}`;
        }
        defaultName = candidateName;
      }
    }
    if (type === 'msx2gameflow') {
      const existingMsx2Gameflows = assets.filter(a => a.type === 'msx2gameflow');
      if (existingMsx2Gameflows.length === 0) {
        defaultName = 'Main MSX2';
      } else {
        let counter = 1;
        let candidateName = `New MSX2 Game Flow ${counter}`;
        while (existingMsx2Gameflows.some(a => a.name === candidateName)) {
          counter++;
          candidateName = `New MSX2 Game Flow ${counter}`;
        }
        defaultName = candidateName;
      }
    }

    let newEditorType: EditorType = EditorType.None;
    const defaultLogicalProps: TileLogicalProperties = {
      mapId: 0, familyId: 0, instanceId: 0,
      isSolid: false, isBreakable: false, causesDamage: false,
      isMovable: false, isInteractiveSwitch: false,
      isInteractable: false, interactionType: 'none', interactionValue: 1, interactionTarget: '',
    };

    switch (type) {
      case 'tile':
        const tileW = DEFAULT_TILE_WIDTH;
        const tileH = DEFAULT_TILE_HEIGHT;
        const initialColor = currentScreenMode === "SCREEN 2 (Graphics I)" ? DEFAULT_SCREEN2_BG_COLOR : MSX_SCREEN5_PALETTE[1].hex;
        newAssetData = {
          id, name: defaultName, width: tileW, height: tileH,
          data: Array(tileH).fill(null).map(() => Array(tileW).fill(initialColor)),
          ...(currentScreenMode === "SCREEN 2 (Graphics I)" && { lineAttributes: createDefaultLineAttributes(tileW, tileH, DEFAULT_SCREEN2_FG_COLOR, DEFAULT_SCREEN2_BG_COLOR) }),
          logicalProperties: defaultLogicalProps,
          ...(currentScreenMode !== "SCREEN 2 (Graphics I)" && { screen5Palette: createDefaultScreen5PaletteSlots() })
        };
        newEditorType = EditorType.Tile;
        break;
      case 'sprite':
        const spriteSize = DEFAULT_SPRITE_SIZE;
        const screen2Transparent = MSX1_PALETTE.find(c => c.index === 0)?.hex ?? 'rgba(0,0,0,0)';
        const initialBackgroundColor = currentScreenMode === "SCREEN 2 (Graphics I)" ? screen2Transparent : MSX_SCREEN5_PALETTE[0].hex;
        const spriteData: PixelData = Array(spriteSize).fill(null).map(() => Array(spriteSize).fill(initialBackgroundColor));
        newAssetData = {
          id, name: defaultName,
          size: { width: spriteSize, height: spriteSize },
          spritePalette: currentScreenMode === "SCREEN 2 (Graphics I)"
            ? [screen2Transparent, DEFAULT_SCREEN2_FG_COLOR, '#FF0000', '#00FF00']
            : [MSX_SCREEN5_PALETTE[0].hex, MSX_SCREEN5_PALETTE[1].hex, MSX_SCREEN5_PALETTE[2].hex, MSX_SCREEN5_PALETTE[3].hex],
          backgroundColor: initialBackgroundColor,
          frames: [{ id: `frame_${Date.now()}`, data: spriteData }],
          currentFrameIndex: 0
        };
        newEditorType = EditorType.Sprite;
        break;
      case 'msx2sprite':
        defaultName = 'New MSX2 Metasprite';
        const msx2SpriteSize = 16;
        const msx2Palette = createDefaultScreen5PaletteSlots();
        const msx2Background = MSX_SCREEN5_PALETTE[0].hex;
        const msx2SpriteData: PixelData = Array(msx2SpriteSize).fill(null).map(() => Array(msx2SpriteSize).fill(msx2Background));
        newAssetData = {
          id,
          name: defaultName,
            target: 'MSX2',
            vdpMode: 'SCREEN4',
            size: { width: msx2SpriteSize, height: msx2SpriteSize },
            superSpriteLayout: 'single16',
            superSpriteParts: [{ id: 'part_a', label: 'A', offsetX: 0, offsetY: 0, width: 16, height: 16 }],
            palette: msx2Palette,
            backgroundColor: msx2Background,
            frames: [{ id: `frame_${Date.now()}`, data: msx2SpriteData }],
          currentFrameIndex: 0,
          facingDirection: 'right',
          hardware: { x: 72, y: 102, color: 5, patternIndex: 0, useOrColor: true }
        } as Msx2Sprite;
        newEditorType = EditorType.Msx2Sprite;
        break;
      case 'msx2screen':
        defaultName = 'New MSX2 SCREEN 4 Room';
        const msx2TileSize = 16;
        const blankTile = Array.from({ length: msx2TileSize }, () => Array.from({ length: msx2TileSize }, () => 0));
        const floorTile = Array.from({ length: msx2TileSize }, (_, y) =>
          Array.from({ length: msx2TileSize }, (_, x) => y < 3 ? 15 : (x % 8 < 4 ? 5 : 4))
        );
        newAssetData = {
          id,
          name: defaultName,
          target: 'MSX2',
          vdpMode: 'SCREEN4',
          tileSize: 16,
          widthTiles: 16,
          heightTiles: 12,
          palette: createDefaultScreen5PaletteSlots(),
          tiles: [
            { id: `tile_${Date.now()}_0`, name: 'Blank', width: msx2TileSize, height: msx2TileSize, pixels: blankTile },
            { id: `tile_${Date.now()}_1`, name: 'Platform', width: msx2TileSize, height: msx2TileSize, pixels: floorTile },
          ],
          map: Array.from({ length: 12 }, (_, y) => Array.from({ length: 16 }, () => y === 11 ? 1 : 0)),
          collisionMap: Array.from({ length: 12 }, (_, y) => Array.from({ length: 16 }, () => y === 11 ? 1 : 0)),
          layers: {
            collision: Array.from({ length: 12 }, (_, y) => Array.from({ length: 16 }, () => y === 11 ? 1 : 0)),
            effects: Array.from({ length: 12 }, () => Array.from({ length: 16 }, () => 0)),
            behavior: Array.from({ length: 12 }, () => Array.from({ length: 16 }, () => 0)),
            entities: [],
          },
          playerEntries: createDefaultMsx2PlayerEntries(),
          runtime: {
            screenKind: 'playable',
            screenEngine: 'player',
            movementMode: 'platform',
            movementModel: 'platform',
            requiredCollectibles: 0,
            initialAir: 255,
            activeAreaX: 0,
            activeAreaY: 0,
            activeAreaWidth: 16,
            activeAreaHeight: 12,
          },
        } as Msx2Screen4TileScreen;
        newEditorType = EditorType.Msx2Screen;
        break;
      case 'msx2bitmaproom':
        defaultName = 'New MSX2 SCREEN 4 Bitmap Room';
        newAssetData = {
          id,
          name: defaultName,
          target: 'MSX2',
          vdpMode: 'SCREEN4_BITMAP_ROOM',
          width: 256,
          height: 192,
          palette: createDefaultScreen5PaletteSlots(),
          atlas: {
            width: 256,
            height: 128,
            offscreenBaseY: 320,
            pixels: Array.from({ length: 128 }, () => Array.from({ length: 256 }, () => 0)),
            entries: [
              { id: 'atlas_block_0', name: 'Blank 8x8', sx: 0, sy: 0, w: 8, h: 8 },
              { id: 'atlas_block_1', name: 'Solid 16x16', sx: 16, sy: 0, w: 16, h: 16 },
            ],
          },
          composition: {
            source: 'authored',
            commands: [
              { id: 'clear_screen', op: 'fill', x: 0, y: 0, w: 256, h: 192, color: 1 },
              { id: 'sample_block', op: 'copy', atlasEntryId: 'atlas_block_1', dx: 32, dy: 128 },
            ],
          },
          collision: Array.from({ length: 12 }, () => Array.from({ length: 16 }, () => 0)),
          effects: Array.from({ length: 12 }, () => Array.from({ length: 16 }, () => 0)),
          behavior: Array.from({ length: 12 }, () => Array.from({ length: 16 }, () => 0)),
          entities: [],
          playerEntries: createDefaultMsx2PlayerEntries(),
          notes: 'Bitmap SCREEN 4 room composer: atlas offscreen, V9938 copy/fill/line command list, sprites above.',
        } as Msx2Screen4BitmapRoom;
        newEditorType = EditorType.Msx2BitmapRoom;
        break;
      case 'msx2player':
        defaultName = 'Player_Main';
        newAssetData = buildDetailedMsx2PlayerDocument(createDefaultMsx2PlayerDefinition(id, msx2ProjectProfile?.profileId));
        newAssetData.player.identity.name = defaultName;
        (newAssetData.compact as Msx2PlayerDefinition).name = defaultName;
        newEditorType = EditorType.Msx2Player;
        break;
      case 'msx2enemy':
        defaultName = 'Bat_Enemy';
        newAssetData = {
          ...createEnemyFromTemplate(GLOBAL_ENEMY_TEMPLATES.find(template => template.templateId === 'bat_enemy_basic') || GLOBAL_ENEMY_TEMPLATES[0], {
            name: defaultName,
            existingIds: new Set(assets.filter(asset => asset.type === 'msx2enemy').map(asset => (asset.data as any)?.enemyId || asset.id)),
          }),
          assetId: id,
        };
        newEditorType = EditorType.Msx2Enemy;
        break;
      case 'msx2hudfont':
        defaultName = 'New MSX2 HUD Font';
        newAssetData = {
          target: 'MSX2',
          vdpMode: 'SCREEN4',
          baseChar: 0xC0,
          characters: MSX2_HUD_FONT_CHARACTERS,
          patterns: JSON.parse(JSON.stringify(DEFAULT_MSX2_HUD_FONT_PATTERNS)),
          colorByte: 0xF1,
          notes: 'Generic SCREEN 4 HUD font for counters and text widgets. Separate from MSX1 font assets.',
        } as Msx2HudFontAsset;
        newEditorType = EditorType.Msx2HudFont;
        break;
      case 'msx2presentation':
        defaultName = 'New MSX2 SCREEN 5 Presentation';
        newAssetData = {
          ...JSON.parse(JSON.stringify(DEFAULT_MSX2_SCREEN5_PRESENTATION_CONFIG)),
          name: defaultName,
        };
        newEditorType = EditorType.Msx2Presentation;
        break;
      case 'msx2gameflow':
        const msx2StartNodeId = `msx2_gf_start_${Date.now()}`;
        const msx2PresentationNodeId = `msx2_gf_screen5_${Date.now()}`;
        const msx2TransitionNodeId = `msx2_gf_transition_${Date.now()}`;
        const msx2EndNodeId = `msx2_gf_end_${Date.now()}`;
        newAssetData = {
          id,
          name: defaultName,
          target: 'MSX2',
          purpose: 'screen5-presentation',
          nodes: [
            { id: msx2StartNodeId, type: 'Start', position: { x: 70, y: 110 } },
            {
              id: msx2PresentationNodeId,
              type: 'Screen5Presentation',
              position: { x: 300, y: 110 },
              presentationAssetId: undefined,
              waitForKey: true,
              waitFrames: 0,
            },
            {
              id: msx2TransitionNodeId,
              type: 'Transition',
              position: { x: 530, y: 110 },
              effect: 'fade_to_black',
              durationFrames: 30,
            },
            { id: msx2EndNodeId, type: 'End', position: { x: 760, y: 110 } },
          ],
          connections: [
            { id: `msx2_gfc_start_screen5_${Date.now()}`, from: { nodeId: msx2StartNodeId }, to: { nodeId: msx2PresentationNodeId } },
            { id: `msx2_gfc_screen5_transition_${Date.now()}`, from: { nodeId: msx2PresentationNodeId }, to: { nodeId: msx2TransitionNodeId } },
            { id: `msx2_gfc_transition_end_${Date.now()}`, from: { nodeId: msx2TransitionNodeId }, to: { nodeId: msx2EndNodeId } },
          ],
          startNodeId: msx2StartNodeId,
          panOffset: { x: 0, y: 0 },
          zoomLevel: 1,
        } as Msx2GameFlowGraph;
        newEditorType = EditorType.Msx2GameFlow;
        break;
      case 'screenmap':
        const { widthTiles: mapW, heightTiles: mapH } = getScreenModeMetrics(currentScreenMode);
        const createEmptyLayer = (): ScreenLayerData =>
          Array.from({ length: mapH }, () =>
            Array.from({ length: mapW }, (): ScreenTile => ({ tileId: null }))
          );
        const emptyLayer = createEmptyLayer();
        const screenKind = options?.screenKind ?? 'playable';
        const screenEngine = screenKind === 'playable' ? 'player' : 'fakePlayer';
        defaultName = screenKind === 'playable'
          ? 'New Playable Screen'
          : `New ${screenKind.charAt(0).toUpperCase() + screenKind.slice(1)} Screen`;
        newAssetData = {
          id, name: defaultName,
          width: mapW,
          height: mapH,
          screenKind,
          screenEngine,
          layers: {
            background: emptyLayer,
            collision: createEmptyLayer(),
            effects: createEmptyLayer(),
            entities: []
          },
          blockOptimization: {
            backgroundMode: 'raw'
          },
          effectZones: [],
          activeAreaX: 0,
          activeAreaY: 0,
          activeAreaWidth: mapW,
          activeAreaHeight: mapH,
          hudConfiguration: { elements: [] }
        };
        newEditorType = EditorType.Screen;
        break;
      case 'code':
        newAssetData = "// Your Z80 Assembly code here\n";
        newEditorType = EditorType.Code;
        break;
      case 'sound':
        // PSG Sound for Yamaha AY-3-8910 (MSX1)
        // 3 tone channels (A, B, C) + 1 shared noise generator + 1 shared envelope generator
        const defaultChannelState = {
          id: 'A' as 'A' | 'B' | 'C',
          steps: [{
            id: `step_${Date.now()}`,
            tonePeriod: 257,
            volume: 10,
            toneEnabled: true,
            noiseEnabled: false,
            useEnvelope: false,
            durationMs: 200
          }],
          loop: false
        };

        newAssetData = {
          id,
          name: defaultName,
          tempoBPM: 120,
          channels: [
            defaultChannelState,
            { ...defaultChannelState, id: 'B' as 'B', steps: [] },
            { ...defaultChannelState, id: 'C' as 'C', steps: [] }
          ],
          noisePeriod: 16,
          envelopePeriod: 256,
          envelopeShape: 0b1000, // Continuous fall
          masterVolume: 1.0
        };
        newEditorType = EditorType.Sound;
        break;
      case 'worldmap':
        newAssetData = {
          id, name: defaultName,
          nodes: [],
          connections: [],
          panOffset: { x: 0, y: 0 },
          zoomLevel: 1,
          gridSize: 20
        };
        newEditorType = EditorType.WorldMap;
        break;
      case 'track':
        newAssetData = createCmajorChiptuneSampleSong(id);
        defaultName = newAssetData.name;
        newEditorType = EditorType.Track;
        break;
      case 'behavior':
        newAssetData = {
          id, name: defaultName,
          code: "# Behavior script\n# Write your behavior logic here\n"
        };
        newEditorType = EditorType.BehaviorEditor;
        break;
      case 'boss':
        newAssetData = {
          id, name: defaultName,
          totalHealth: 100,
          phases: [],
          phasesEnabled: [],
          attacks: [],
          runtimeUpdateIntervalFrames: 1,
          currentPhaseId: null
        };
        newEditorType = EditorType.Boss;
        break;
      case 'gameflow':
        const startNodeId = `gf_start_${Date.now()}`;
        const startNode: GameFlowNode = { id: startNodeId, type: 'Start', position: { x: 50, y: 50 } };
        newAssetData = {
          id, name: defaultName,
          nodes: [startNode],
          connections: [],
          startNodeId: startNodeId,
          panOffset: { x: 0, y: 0 },
          zoomLevel: 1
        } as GameFlowGraph;
        newEditorType = EditorType.GameFlow;
        break;
      case 'dialogue':
        newAssetData = {
          id,
          name: defaultName,
          lines: [
            {
              id: `line_${Date.now()}`,
              speaker: '',
              text: '',
              waitForInput: true,
            },
          ],
          box: {
            x: 0,
            y: 20,
            width: 32,
            height: 4,
            borderSource: 'generated',
            borderCharCodes: {
              topLeft: 43,
              topRight: 43,
              bottomLeft: 43,
              bottomRight: 43,
              horizontal: 45,
              vertical: 124,
            },
            graphic: { enabled: false, side: 'left', width: 4, height: 3, padding: 1, tileIds: [] },
          },
          exportOptions: {
            maxCharsPerLine: 28,
            maxLinesPerBox: 3,
            stripUnsupportedChars: true,
            charDelayFrames: 2,
            mouthToggleEveryChars: 3,
          },
        } as DialogueAsset;
        newEditorType = EditorType.Dialogue;
        break;
      case 'portrait':
        newAssetData = {
          id,
          name: defaultName,
          widthChars: 4,
          heightChars: 4,
          tileBankAssetId: undefined,
          cells: Array(16).fill(''),
          dedupeIdenticalTiles: true,
          mouth: { enabled: false, cellIndex: 0, openTileId: '' },
        } as PortraitAsset;
        newEditorType = EditorType.Portrait;
        break;
      case 'statemachine':
        newAssetData = {
          id, name: defaultName,
          states: [],
          transitions: [],
          startStateId: null
        };
        newEditorType = EditorType.StateMachine;
        break;
      case 'globalvariables':
        newAssetData = {
          customVariables: []
        };
        newEditorType = EditorType.GlobalVariables;
        break;
      case 'palette':
        newAssetData = {
          slots: createDefaultScreen5PaletteSlots(),
          notes: '',
          mode: 'SCREEN4'
        } as PaletteAsset;
        newEditorType = EditorType.Palette;
        break;
      case 'presentationscreen':
        newAssetData = { ...DEFAULT_PRESENTATION_SCREEN_CONFIG };
        newEditorType = EditorType.PresentationScreen;
        break;
      case 'font':
        // Create default color attributes for each character in the font
        const defaultColorAttributes: any = {};
        Object.keys(DEFAULT_MSX_FONT).forEach(charCodeStr => {
          const charCode = parseInt(charCodeStr);
          // Create default row colors (8 rows per character)
          defaultColorAttributes[charCode] = Array(8).fill({
            fg: DEFAULT_SCREEN2_FG_COLOR,
            bg: DEFAULT_SCREEN2_BG_COLOR
          });
        });

        newAssetData = {
          fontData: DEFAULT_MSX_FONT,
          fontColorAttributes: defaultColorAttributes
        };
        newEditorType = EditorType.Font;
        break;
      case 'tilebank':
        newAssetData = {
          id,
          name: defaultName,
          banks: JSON.parse(JSON.stringify(DEFAULT_TILE_BANK_DEFINITIONS))
        } as TileBank;
        newEditorType = EditorType.TileBanks;
        break;
      case 'componentdefinition':
        newAssetData = {
          id, name: defaultName,
          description: "A new component definition",
          properties: {}
        };
        newEditorType = EditorType.ComponentDefinitionEditor;
        break;
      case 'entitytemplate':
        newAssetData = {
          id, name: defaultName,
          description: "A new entity template",
          components: [],
          defaultComponentValues: {}
        };
        newEditorType = EditorType.EntityTemplateEditor;
        break;
      default: return undefined;
    }

    const newAsset: ProjectAsset = { id, name: defaultName, type, data: newAssetData };
    setAssetsWithHistory(prevAssets => [...prevAssets, newAsset]);
    if (type === 'tilebank') {
      setTileBanksWithHistory(prevTileBanks => [
        ...prevTileBanks.filter(tileBank => tileBank.id !== id),
        newAssetData as TileBank
      ]);
    }
    if (options?.select !== false) {
      setSelectedAssetId(id);
      setCurrentEditor(newEditorType);
    }
    setStatusBarMessage(`Created new ${type} asset: ${defaultName}.`);
    return newAsset;
  };

  const handleDeleteAsset = (assetId: string) => {
    const assetToDelete = assets.find(a => a.id === assetId);
    if (assetToDelete) {
      const bossTileAssets = assetToDelete.type === 'boss'
        ? Array.from(collectBossTileIds(assetToDelete.data as Boss))
            .map(tileId => assets.find(asset => (
              asset.type === 'tile'
              && (asset.id === tileId || getTileDataIdFromAsset(asset) === tileId)
            )))
            .filter((asset): asset is ProjectAsset => !!asset)
        : [];
      const bossTileIds = new Set(bossTileAssets.flatMap(asset => Array.from(collectTileReferenceIds(asset))));

      if (assetToDelete.type === 'boss' && bossTileAssets.length > 0) {
        const previewTileNames = bossTileAssets.slice(0, 8).map(asset => asset.name);
        const hiddenTileCount = Math.max(0, bossTileAssets.length - previewTileNames.length);

        setConfirmModalProps({
          title: "Delete Boss",
          message: (
            <div className="space-y-3">
              <p>Delete boss "{assetToDelete.name}"?</p>
              <p>
                This boss uses {bossTileAssets.length} tile{bossTileAssets.length === 1 ? '' : 's'}. You can keep those tiles, or delete them together with the boss.
              </p>
              <div className="max-h-28 overflow-y-auto rounded border border-msx-border bg-msx-bgcolor p-2 text-xs text-msx-textsecondary">
                {previewTileNames.map((tileName, index) => (
                  <div key={`${tileName}-${index}`} className="truncate">{tileName}</div>
                ))}
                {hiddenTileCount > 0 && <div>...and {hiddenTileCount} more</div>}
              </div>
            </div>
          ),
          onConfirm: () => deleteAssetAndMaybeTiles(assetToDelete),
          onSecondaryAction: () => deleteAssetAndMaybeTiles(assetToDelete, bossTileIds, bossTileAssets.length),
          confirmText: "Delete Boss Only",
          secondaryText: "Delete Boss + Tiles",
          secondaryButtonVariant: "danger",
          confirmButtonVariant: "danger"
        });
        setIsConfirmModalOpen(true);
        return;
      }

      setConfirmModalProps({
        title: "Delete Asset",
        message: `Are you sure you want to delete asset "${assetToDelete.name}"? This action can be undone.`,
        onConfirm: () => deleteAssetAndMaybeTiles(
          assetToDelete,
          assetToDelete.type === 'tile' ? collectTileReferenceIds(assetToDelete) : undefined,
          assetToDelete.type === 'tile' ? 1 : undefined
        ),
        confirmText: "Delete",
        confirmButtonVariant: "danger"
      });
      setIsConfirmModalOpen(true);
    }
  };

  const handleUpdateSpriteOrder = (reorderedSpriteAssets: ProjectAsset[]) => {
    setAssetsWithHistory(prevAssets => {
      const nonSpriteAssets = prevAssets.filter(a => a.type !== 'sprite');
      const firstSpriteIndex = prevAssets.findIndex(a => a.type === 'sprite');

      const newAssets = [...nonSpriteAssets];
      if (firstSpriteIndex !== -1) {
        newAssets.splice(firstSpriteIndex, 0, ...reorderedSpriteAssets);
      } else {
        newAssets.push(...reorderedSpriteAssets);
      }
      return newAssets;
    });
    setIsSpriteSheetModalOpen(false);
    setStatusBarMessage(`Sprite order updated.`);
  };

  const handleReorderSpriteFrames = (spriteAssetId: string, reorderedFrames: SpriteFrame[]) => {
    let updatedSpriteAsset: ProjectAsset | null = null;

    setAssetsWithHistory(prevAssets => prevAssets.map(asset => {
      if (asset.id !== spriteAssetId || asset.type !== 'sprite') {
        return asset;
      }

      const spriteData = asset.data as Sprite;
      const safeCurrentFrameIndex = Math.min(spriteData.currentFrameIndex || 0, Math.max(reorderedFrames.length - 1, 0));
      const newData: Sprite = { ...spriteData, frames: reorderedFrames, currentFrameIndex: safeCurrentFrameIndex };
      updatedSpriteAsset = { ...asset, data: newData };
      return updatedSpriteAsset;
    }));

    if (updatedSpriteAsset) {
      setStatusBarMessage(`Updated frame order for '${updatedSpriteAsset.name}'.`);
      setSpriteForFramesModal(updatedSpriteAsset);
    } else {
      setStatusBarMessage("Error: Could not update frame order (sprite not found).");
    }
  };

  const handleOpenSpriteFramesModal = (spriteAsset: ProjectAsset) => {
    setSpriteForFramesModal(spriteAsset);
    setIsSpriteFramesModalOpen(true);
  };

  const handleSplitFrames = (spriteAsset: ProjectAsset) => {
    const originalSprite = spriteAsset.data as Sprite;
    if (!originalSprite || originalSprite.frames.length === 0) {
      setStatusBarMessage("No frames to split.");
      return;
    }

    const newAssetsToCreate: ProjectAsset[] = [];
    originalSprite.frames.forEach((frame, index) => {
      const newSpriteId = `sprite_${Date.now()}_${index}`;
      const newSpriteName = `${originalSprite.name}_frame${index}`;

      const newSpriteData: Sprite = {
        id: newSpriteId,
        name: newSpriteName,
        size: { ...originalSprite.size },
        spritePalette: [...originalSprite.spritePalette],
        backgroundColor: originalSprite.backgroundColor,
        frames: [{ ...frame, id: `frame_${Date.now()}` }],
        currentFrameIndex: 0,
      };

      const newAsset: ProjectAsset = {
        id: newSpriteId,
        name: newSpriteName,
        type: 'sprite',
        data: newSpriteData,
      };
      newAssetsToCreate.push(newAsset);
    });

    setAssetsWithHistory(prevAssets => [...prevAssets, ...newAssetsToCreate]);
    setStatusBarMessage(`Split ${originalSprite.frames.length} frames from '${originalSprite.name}' into new sprites.`);
    setIsSpriteFramesModalOpen(false);
    setSpriteForFramesModal(null);
  };

  const handleCreateSpriteFromFrame = (sourceSpriteId: string, sourceFrameIndex: number) => {
    const sourceAsset = assets.find(a => a.id === sourceSpriteId && a.type === 'sprite');
    if (!sourceAsset) {
      setStatusBarMessage("Error: Source sprite not found.");
      return;
    }
    const sourceSprite = sourceAsset.data as Sprite;
    const sourceFrame = sourceSprite.frames[sourceFrameIndex];
    if (!sourceFrame) {
      setStatusBarMessage("Error: Source frame not found.");
      return;
    }

    const newSpriteId = `sprite_from_frame_${Date.now()}`;
    const newSpriteName = `${sourceSprite.name}_frame_${sourceFrameIndex}`;

    const newFrame: SpriteFrame = {
      id: `frame_${Date.now()}`,
      data: JSON.parse(JSON.stringify(sourceFrame.data)),
    };

    const newSpriteData: Sprite = {
      id: newSpriteId,
      name: newSpriteName,
      size: { ...sourceSprite.size },
      spritePalette: [...sourceSprite.spritePalette],
      backgroundColor: sourceSprite.backgroundColor,
      frames: [newFrame],
      currentFrameIndex: 0,
    };

    const newAsset: ProjectAsset = {
      id: newSpriteId,
      name: newSpriteName,
      type: 'sprite',
      data: newSpriteData,
    };

    setAssetsWithHistory(prevAssets => [...prevAssets, newAsset]);
    setSelectedAssetId(newSpriteId);
    setCurrentEditor(EditorType.Sprite);
    setStatusBarMessage(`Created new sprite '${newSpriteName}' from frame.`);
  };

  const handleWaypointPicked = (point: Point) => {
    if (!waypointPickerState.isPicking || !waypointPickerState.entityInstanceId || !waypointPickerState.componentDefId || !selectedAssetId) {
      setWaypointPickerState({ isPicking: false, entityInstanceId: null, componentDefId: null, waypointPrefix: 'waypoint1' });
      return;
    }

    const { entityInstanceId, componentDefId, waypointPrefix } = waypointPickerState;

    const activeScreenMapAsset = assets.find(a => a.id === selectedAssetId);
    if (!activeScreenMapAsset || activeScreenMapAsset.type !== 'screenmap') return;
    const activeScreenMap = activeScreenMapAsset.data as ScreenMap;

    const entityToUpdate = activeScreenMap.layers.entities.find(e => e.id === entityInstanceId);
    if (!entityToUpdate) return;

    const isScreen2 = currentScreenMode === "SCREEN 2 (Graphics I)";
    const EDITOR_BASE_TILE_DIM = isScreen2 ? EDITOR_BASE_TILE_DIM_S2 : 16;

    const finalPixelX = point.x * EDITOR_BASE_TILE_DIM;
    const finalPixelY = point.y * EDITOR_BASE_TILE_DIM;

    const newOverrides = JSON.parse(JSON.stringify(entityToUpdate.componentOverrides || {}));
    if (!newOverrides[componentDefId]) {
      newOverrides[componentDefId] = {};
    }

    newOverrides[componentDefId][`${waypointPrefix}_x`] = finalPixelX;
    newOverrides[componentDefId][`${waypointPrefix}_y`] = finalPixelY;

    const updatedEntities = activeScreenMap.layers.entities.map(e =>
      e.id === entityInstanceId ? { ...e, componentOverrides: newOverrides } : e
    );

    handleUpdateAsset(selectedAssetId, { layers: { ...activeScreenMap.layers, entities: updatedEntities } });

    setWaypointPickerState({ isPicking: false, entityInstanceId: null, componentDefId: null, waypointPrefix: 'waypoint1' });
    setStatusBarMessage(`Waypoint set to pixel coordinates (${finalPixelX}, ${finalPixelY}).`);
  };

  return {
    handleUpdateAsset,
    handleNewAsset,
    handleDeleteAsset,
    handleUpdateSpriteOrder,
    handleReorderSpriteFrames,
    handleOpenSpriteFramesModal,
    handleSplitFrames,
    handleCreateSpriteFromFrame,
    handleWaypointPicked
  };
};
