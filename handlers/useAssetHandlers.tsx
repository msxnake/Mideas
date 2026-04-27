import { useCallback } from 'react';
import {
  ProjectAsset, EditorType, Tile, Sprite, ScreenMap, ScreenLayerData, ScreenTile, SpriteFrame,
  TileLogicalProperties, Point, PixelData, TileBank, GameFlowNode, GameFlowGraph,
  PSGSoundChannelState, PSGSoundChannelStep, PaletteAsset, PT3Instrument, TrackerSongData, TrackerPattern,
  DialogueAsset
} from '../types';
import {
  DEFAULT_TILE_WIDTH, DEFAULT_TILE_HEIGHT, MSX_SCREEN5_PALETTE, MSX1_PALETTE,
  DEFAULT_SCREEN2_FG_COLOR, DEFAULT_SCREEN2_BG_COLOR, DEFAULT_SCREEN_WIDTH_TILES,
  DEFAULT_SCREEN_HEIGHT_TILES, DEFAULT_SPRITE_SIZE, EDITOR_BASE_TILE_DIM_S2,
  DEFAULT_TILE_BANK_DEFINITIONS, DEFAULT_PSG_INSTRUMENTS, DEFAULT_PT3_BPM, DEFAULT_PT3_SPEED, DEFAULT_PT3_ROWS_PER_PATTERN,
  DEFAULT_PRESENTATION_SCREEN_CONFIG
} from '../constants';
import { createDefaultLineAttributes } from '../components/utils/tileUtils';
import { DEFAULT_MSX_FONT } from '../components/utils/msxFontRenderer';
import { createDefaultScreen5PaletteSlots } from '../utils/screen5PaletteUtils';
import { getScreenModeMetrics } from '../utils/screenModeConfig';

interface AssetHandlersProps {
  assets: ProjectAsset[];
  setAssetsWithHistory: (updater: (prevAssets: ProjectAsset[]) => ProjectAsset[]) => void;
  setStatusBarMessage: (message: string) => void;
  selectedAssetId: string | null;
  setSelectedAssetId: (id: string | null) => void;
  setCurrentEditor: (editor: EditorType) => void;
  currentScreenMode: string;
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
  setStatusBarMessage,
  selectedAssetId,
  setSelectedAssetId,
  setCurrentEditor,
  currentScreenMode,
  setConfirmModalProps,
  setIsConfirmModalOpen,
  setSelectedEffectZoneId,
  setSpriteForFramesModal,
  setIsSpriteFramesModalOpen,
  setIsSpriteSheetModalOpen,
  waypointPickerState,
  setWaypointPickerState
}: AssetHandlersProps) => {

  const handleUpdateAsset = useCallback((assetId: string, updatedData: any, newAssetsToCreate?: ProjectAsset[]) => {
    setAssetsWithHistory(prevAssets => {
      let intermediateAssets = prevAssets;
      if (newAssetsToCreate && newAssetsToCreate.length > 0) {
        intermediateAssets = [...prevAssets, ...newAssetsToCreate];

        const newAssetTypes = new Set(newAssetsToCreate.map(a => a.type));
        let message = `Created ${newAssetsToCreate.length} new ${Array.from(newAssetTypes).join('/')} asset(s).`;
        if (newAssetsToCreate.length === 1) message = `Created new ${newAssetsToCreate[0].type} asset: ${newAssetsToCreate[0].name}.`;
        setStatusBarMessage(message);
      }

      const isDataUpdateNeeded = updatedData && (!(typeof updatedData === 'object' && Object.keys(updatedData).length === 0));

      if (!isDataUpdateNeeded) {
        return intermediateAssets;
      }

      return intermediateAssets.map(asset => {
        if (asset.id === assetId) {
          let newAssetData: ProjectAsset['data'] = asset.data;
          let newAssetName = asset.name;

          // Check if name is being updated and apply it to the asset itself
          if (updatedData && typeof updatedData === 'object' && 'name' in updatedData) {
            newAssetName = updatedData.name;
            // Remove name from data update to avoid duplication
            const { name, ...dataWithoutName } = updatedData;
            updatedData = dataWithoutName;
          }

          if (typeof asset.data === 'object' && asset.data !== null) {
            newAssetData = { ...asset.data, ...updatedData };
          } else {
            newAssetData = updatedData;
          }
          return { ...asset, name: newAssetName, data: newAssetData };
        }
        return asset;
      });
    });
  }, [setAssetsWithHistory, setStatusBarMessage]);

  const handleNewAsset = (type: ProjectAsset['type']) => {
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
      case 'screenmap':
        const { widthTiles: mapW, heightTiles: mapH } = getScreenModeMetrics(currentScreenMode);
        const createEmptyLayer = (): ScreenLayerData =>
          Array.from({ length: mapH }, () =>
            Array.from({ length: mapW }, (): ScreenTile => ({ tileId: null }))
          );
        const emptyLayer = createEmptyLayer();
        newAssetData = {
          id, name: defaultName,
          width: mapW,
          height: mapH,
          screenKind: 'playable',
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
        // Create initial empty pattern
        const initialPattern: TrackerPattern = {
          id: `pattern_${Date.now()}`,
          name: 'Pattern 00',
          numRows: DEFAULT_PT3_ROWS_PER_PATTERN,
          rows: Array(DEFAULT_PT3_ROWS_PER_PATTERN).fill(null).map(() => ({
            A: { note: null, instrument: null, ornament: null, volume: null },
            B: { note: null, instrument: null, ornament: null, volume: null },
            C: { note: null, instrument: null, ornament: null, volume: null },
          }))
        };

        newAssetData = {
          id,
          name: defaultName,
          soundChip: 'PSG',
          author: "Unknown",
          title: defaultName,
          bpm: DEFAULT_PT3_BPM,
          speed: DEFAULT_PT3_SPEED,
          globalVolume: 15,
          patterns: [initialPattern],
          order: [0],
          lengthInPatterns: 1,
          restartPosition: 0,
          instruments: DEFAULT_PSG_INSTRUMENTS.map(inst => ({ ...inst })), // Clone default instruments
          ornaments: [],
          currentPatternIndexInOrder: 0,
          currentPatternId: initialPattern.id,
        } as TrackerSongData;
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
          },
          exportOptions: {
            maxCharsPerLine: 28,
            maxLinesPerBox: 3,
            stripUnsupportedChars: true,
            charDelayFrames: 2,
          },
        } as DialogueAsset;
        newEditorType = EditorType.Dialogue;
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
          mode: 'SCREEN5'
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
      default: return;
    }

    const newAsset: ProjectAsset = { id, name: defaultName, type, data: newAssetData };
    setAssetsWithHistory(prevAssets => [...prevAssets, newAsset]);
    setSelectedAssetId(id);
    setCurrentEditor(newEditorType);
    setStatusBarMessage(`Created new ${type} asset: ${defaultName}.`);
  };

  const handleDeleteAsset = (assetId: string) => {
    const assetToDelete = assets.find(a => a.id === assetId);
    if (assetToDelete) {
      setConfirmModalProps({
        title: "Delete Asset",
        message: `Are you sure you want to delete asset "${assetToDelete.name}"? This action can be undone.`,
        onConfirm: () => {
          setAssetsWithHistory(prevAssets => {
            const remainingAssets = prevAssets.filter(a => a.id !== assetId);
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
                if ((smOverride as any).stateMachineAssetId !== assetId) return entity;

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
          if (selectedAssetId === assetId) {
            setSelectedAssetId(null);
            setCurrentEditor(EditorType.None);
            setSelectedEffectZoneId(null);
          }
          setStatusBarMessage(`Asset "${assetToDelete.name}" deleted.`);
          setIsConfirmModalOpen(false);
        },
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
