
import React, { useState, useCallback, useEffect, useRef } from 'react';
import JSZip from 'jszip'; 
import { 
  EditorType, ProjectAsset, Tile, Sprite, ScreenMap, MSXColorValue, SpriteFrame, PixelData, 
  LineColorAttribute, MSX1ColorValue, WorldMapGraph, PSGSoundData, PSGSoundChannelState, 
  TrackerSongData, HUDConfiguration, TileBank, MSXFont, 
  MSXFontColorAttributes, DataFormat,
  Snippet, ScreenLayerData,
  EntityInstance, MockEntityType, HelpDocSection, BehaviorScript, TileLogicalProperties,
  CopiedScreenData, CopiedLayerData, EffectZone, ScreenEditorLayerName, 
  ComponentDefinition, EntityTemplate, ContextMenuItem,
  Boss, BossPhase, Point, HistoryState, HistoryAction, HistoryActionType, CopiedTileData, WaypointPickerState, MainMenuConfig
} from './types';
import { 
  MSX_SCREEN5_PALETTE, DEFAULT_TILE_WIDTH, DEFAULT_TILE_HEIGHT, 
  DEFAULT_SPRITE_SIZE, DEFAULT_SCREEN_WIDTH_TILES, DEFAULT_SCREEN_HEIGHT_TILES, 
  SCREEN_MODES, DEFAULT_SCREEN_MODE, MSX1_PALETTE,
  DEFAULT_SCREEN2_FG_COLOR, DEFAULT_SCREEN2_BG_COLOR,
  DEFAULT_TILE_BANKS_CONFIG, Z80_SNIPPETS as DEFAULT_Z80_SNIPPETS, Z80_BEHAVIOR_SNIPPETS,
  EDITOR_BASE_TILE_DIM_S2,
  DEFAULT_PT3_ROWS_PER_PATTERN, DEFAULT_PT3_BPM, DEFAULT_PT3_SPEED,
  DEFAULT_HELP_DOCS_DATA, HELP_DOCS_SYSTEM_ASSET_ID, MAX_HISTORY_LENGTH, DEFAULT_MAIN_MENU_CONFIG
} from './constants';
import { DEFAULT_MSX_FONT, EDITABLE_CHAR_CODES_SUBSET } from './components/utils/msxFontRenderer'; 
import { createDefaultLineAttributes, generateTilePatternBytes, generateTileColorBytes } from './components/utils/tileUtils'; 
import { generateScreenMapLayoutBytes, deepCompareTiles } from './components/utils/screenUtils'; 
import { generateSpriteBinaryData } from './components/utils/spriteUtils';
import { generateFontPatternBinaryData, generateFontColorBinaryData } from './components/utils/msxFontUtils'; 
import { generateTemplatesASM } from './components/utils/ecsUtils';
import { createDefaultTrackerPattern as createDefaultPT3Pattern } from './components/utils/trackerUtils';
import { resolveSnippetPlaceholders } from './components/utils/snippetResolver'; 
import { TILE_BANKS_SYSTEM_ASSET_ID, FONT_EDITOR_SYSTEM_ASSET_ID, COMPONENT_DEF_EDITOR_SYSTEM_ASSET_ID, ENTITY_TEMPLATE_EDITOR_SYSTEM_ASSET_ID, WORLD_VIEW_SYSTEM_ASSET_ID, MAIN_MENU_SYSTEM_ASSET_ID } from './components/tools/FileExplorerPanel'; 
import { msxFontJsonString } from './data/msxFontData';
import { AppUI } from './components/AppUI';
import { deepCopy, getFormattedDate, generateAsmFileHeader, generateMainAsmContent } from './utils/projectUtils';
import { DEFAULT_COMPONENT_DEFINITIONS, DEFAULT_ENTITY_TEMPLATES, DEFAULT_MAP_ASM_CONTENT, DEFAULT_CONSTANTS_ASM_CONTENT } from './data/defaults';
import { ThemeProvider } from './contexts/ThemeContext';


const SNIPPETS_STORAGE_KEY = 'msxIdeUserSnippets_v1';
const AUTOSAVE_INTERVAL = 10 * 60 * 1000;

const App: React.FC = () => {
  const [currentEditor, setCurrentEditor] = useState<EditorType>(EditorType.None); 
  const [assets, setAssets] = useState<ProjectAsset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState<string | null>(null); 
  const [currentScreenMode, setCurrentScreenMode] = useState<string>(DEFAULT_SCREEN_MODE);
  const [statusBarMessage, setStatusBarMessage] = useState<string>("MSX Retro Game IDE Initialized.");
  const [selectedColor, setSelectedColor] = useState<MSXColorValue>(MSX_SCREEN5_PALETTE[1].hex);
  
  const [screenEditorSelectedTileId, setScreenEditorSelectedTileId] = useState<string | null>(null);
  const [currentScreenEditorActiveLayer, setCurrentScreenEditorActiveLayer] = useState<ScreenEditorLayerName>('background'); 
  
  const [componentDefinitions, setComponentDefinitionsState] = useState<ComponentDefinition[]>(DEFAULT_COMPONENT_DEFINITIONS);
  const [entityTemplates, setEntityTemplatesState] = useState<EntityTemplate[]>(DEFAULT_ENTITY_TEMPLATES);
  const [mainMenuConfig, setMainMenuConfigState] = useState<MainMenuConfig>(DEFAULT_MAIN_MENU_CONFIG);
  const [currentEntityTypeToPlace, setCurrentEntityTypeToPlace] = useState<EntityTemplate | null>(null); 
  const [selectedEntityInstanceId, setSelectedEntityInstanceId] = useState<string | null>(null); 
  const [selectedEffectZoneId, setSelectedEffectZoneId] = useState<string | null>(null); 

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [assetToRenameInfo, setAssetToRenameInfo] = useState<{ id: string; currentName: string; type: ProjectAsset['type'] } | null>(null);

  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false); 
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false); 

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalProps, setConfirmModalProps] = useState<{
    title: string;
    message: string | React.ReactNode;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    confirmButtonVariant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  } | null>(null);

  const [tileBanks, setTileBanksState] = useState<TileBank[]>(() => { 
    const savedBanks = localStorage.getItem('tileBanksConfig');
    return savedBanks ? JSON.parse(savedBanks) : DEFAULT_TILE_BANKS_CONFIG;
  });
  
  const [msxFont, setMsxFontState] = useState<MSXFont>(() => { 
    try {
      const parsedFont = JSON.parse(msxFontJsonString);
      const fontCharset: MSXFont = {};
      for (const key in parsedFont.charset) {
          fontCharset[Number(key)] = parsedFont.charset[key];
      }
      return fontCharset;
    } catch (e) {
      console.error("Error parsing default MSX Font JSON:", e);
      return DEFAULT_MSX_FONT;
    }
  });
  
  const [msxFontColorAttributes, setMsxFontColorAttributesState] = useState<MSXFontColorAttributes>(() => { 
    try {
        const parsedFont = JSON.parse(msxFontJsonString);
        const fontColors: MSXFontColorAttributes = {};
        if (parsedFont.colorAttributes) {
            for (const key in parsedFont.colorAttributes) {
                fontColors[Number(key)] = parsedFont.colorAttributes[key];
            }
        } else {
            Object.keys(msxFont).forEach(charCodeStr => {
                const charCodeNum = Number(charCodeStr);
                if (!isNaN(charCodeNum)) {
                    fontColors[charCodeNum] = Array(8).fill(null).map(() => ({ fg: DEFAULT_SCREEN2_FG_COLOR, bg: DEFAULT_SCREEN2_BG_COLOR }));
                }
            });
        }
        return fontColors;
    } catch (e) {
        console.error("Error parsing MSX Font Color Attributes:", e);
        const initialColors: MSXFontColorAttributes = {};
        Object.keys(msxFont).forEach(charCodeStr => {
            const charCodeNum = Number(charCodeStr);
            if (!isNaN(charCodeNum)) {
                 initialColors[charCodeNum] = Array(8).fill(null).map(() => ({ fg: DEFAULT_SCREEN2_FG_COLOR, bg: DEFAULT_SCREEN2_BG_COLOR }));
            }
        });
        return initialColors;
    }
  });
  const [currentLoadedFontName, setCurrentLoadedFontName] = useState<string>("Default MSX1 Font");
  const [helpDocsData, setHelpDocsData] = useState<HelpDocSection[]>(DEFAULT_HELP_DOCS_DATA);

  const [dataOutputFormat, setDataOutputFormat] = useState<DataFormat>('hex');
  const [autosaveEnabled, setAutosaveEnabled] = useState<boolean>(true);
  const [snippetsEnabled, setSnippetsEnabled] = useState<boolean>(true);
  const [syntaxHighlightingEnabled, setSyntaxHighlightingEnabled] = useState<boolean>(true);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isSpriteSheetModalOpen, setIsSpriteSheetModalOpen] = useState(false);
  const [isSpriteFramesModalOpen, setIsSpriteFramesModalOpen] = useState(false);
  const [spriteForFramesModal, setSpriteForFramesModal] = useState<ProjectAsset | null>(null);

  const [snippetToInsert, setSnippetToInsert] = useState<{ code: string; timestamp: number } | null>(null);
  
  const [userSnippets, setUserSnippets] = useState<Snippet[]>(() => {
    const savedSnippetsJSON = localStorage.getItem(SNIPPETS_STORAGE_KEY);
    if (savedSnippetsJSON) { try { const parsedSnippets = JSON.parse(savedSnippetsJSON); if (Array.isArray(parsedSnippets) && parsedSnippets.every((s: any) =>s && typeof s.id === 'string' && typeof s.name === 'string' && typeof s.code === 'string' )) { return parsedSnippets as Snippet[]; } else { console.warn('Snippets from localStorage have invalid structure. Falling back to defaults.', parsedSnippets); }} catch (e) { console.error('Failed to parse snippets. Falling back to defaults.', e, savedSnippetsJSON);}}
    
    const allDefaultSnippets = [...DEFAULT_Z80_SNIPPETS, ...Z80_BEHAVIOR_SNIPPETS];
    return allDefaultSnippets.map((s, index) => ({ id: `default_${index}_${s.name.toLowerCase().replace(/\s+/g, '_')}`, name: s.name, code: s.code, }));
  });
  const [isSnippetEditorModalOpen, setIsSnippetEditorModalOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const autosaveFunctionRef = useRef<(() => void) | null>(null);

  const [history, setHistory] = useState<HistoryState>({ undoStack: [], redoStack: [] });

  const [copiedScreenBuffer, setCopiedScreenBuffer] = useState<CopiedScreenData | null>(null);
  const [copiedTileData, setCopiedTileData] = useState<CopiedTileData | null>(null);
  const [copiedLayerBuffer, setCopiedLayerBuffer] = useState<CopiedLayerData | null>(null); 

  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; position: { x: number; y: number }; items: ContextMenuItem[] } | null>(null);

  const [waypointPickerState, setWaypointPickerState] = useState<WaypointPickerState>({ isPicking: false, entityInstanceId: null, componentDefId: null, waypointPrefix: 'waypoint1' });

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
            frames: [{ ...frame, id: `frame_${Date.now()}` }], // New frame with new ID
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
      data: JSON.parse(JSON.stringify(sourceFrame.data)), // Deep copy
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
  

  const showContextMenu = (position: { x: number; y: number }, items: ContextMenuItem[]) => {
    setContextMenu({ isOpen: true, position, items });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };
  
  useEffect(() => {
    const playTadaSound = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
      if (!audioContext) return;
  
      if (audioContext.state === 'suspended') {
          audioContext.resume().catch(e => console.warn("AudioContext resume failed", e));
      }
      
      const now = audioContext.currentTime;
      const gainNode = audioContext.createGain();
      gainNode.connect(audioContext.destination);
      
      const osc1 = audioContext.createOscillator();
      const osc2 = audioContext.createOscillator();
      
      osc1.type = 'triangle';
      osc2.type = 'triangle';
      
      osc1.frequency.value = 523.25; 
      osc2.frequency.value = 783.99;
  
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.4, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
  
      osc1.connect(gainNode);
      osc2.connect(gainNode);
  
      osc1.start(now);
      osc2.start(now + 0.12);
  
      osc1.stop(now + 1.0);
      osc2.stop(now + 1.0);
  
      setTimeout(() => {
          audioContext.close();
      }, 1500);
    };
  
    try {
        playTadaSound();
    } catch(e) {
        console.error("Could not play init sound:", e);
    }
  
  }, []);
  
  const playAutosaveSound = useCallback(() => {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (!audioContext) return;

        if (audioContext.state === 'suspended') {
            audioContext.resume().catch(e => console.warn("AudioContext resume failed for autosave sound", e));
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01); 
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.1); 

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);

        setTimeout(() => audioContext.close(), 500);
    } catch (e) {
        console.warn("Autosave sound playback failed:", e);
    }
  }, []);
  
  const pushToHistory = useCallback((type: HistoryActionType, before: any, after: any) => {
    if (JSON.stringify(before) === JSON.stringify(after)) {
        return;
    }
    const newAction: HistoryAction = {
        type,
        payload: { before: deepCopy(before), after: deepCopy(after) },
    };
    setHistory(prev => {
        const newUndoStack = [...prev.undoStack, newAction];
        if (newUndoStack.length > MAX_HISTORY_LENGTH) {
            newUndoStack.shift();
        }
        return { undoStack: newUndoStack, redoStack: [] };
    });
  }, []);

  const clearAllHistory = () => {
    setHistory({ undoStack: [], redoStack: [] });
  };

  const setAssetsWithHistory = useCallback((updater: (prev: ProjectAsset[]) => ProjectAsset[]) => {
    setAssets(prevAssets => {
        const newAssets = updater(prevAssets);
        pushToHistory('ASSETS_UPDATE', prevAssets, newAssets);
        return newAssets;
    });
  }, [pushToHistory]);

  const setTileBanks = useCallback((updater: TileBank[] | ((prev: TileBank[]) => TileBank[])) => {
    setTileBanksState(prevBanks => {
        const newBanks = typeof updater === 'function' ? (updater as (prev: TileBank[]) => TileBank[])(prevBanks) : updater;
        pushToHistory('TILE_BANKS_UPDATE', prevBanks, newBanks);
        return newBanks;
    });
  }, [pushToHistory]);

  const setMsxFont = useCallback((updater: MSXFont | ((prev: MSXFont) => MSXFont)) => {
    setMsxFontState(prevFont => {
        const newFont = typeof updater === 'function' ? (updater as (prev: MSXFont) => MSXFont)(prevFont) : updater;
        pushToHistory('FONT_UPDATE', prevFont, newFont);
        return newFont;
    });
  }, [pushToHistory]);

  const setMsxFontColorAttributes = useCallback((updater: MSXFontColorAttributes | ((prev: MSXFontColorAttributes) => MSXFontColorAttributes)) => {
    setMsxFontColorAttributesState(prevAttrs => {
        const newAttrs = typeof updater === 'function' ? (updater as (prev: MSXFontColorAttributes) => MSXFontColorAttributes)(prevAttrs) : updater;
        pushToHistory('FONT_COLOR_UPDATE', prevAttrs, newAttrs);
        return newAttrs;
    });
  }, [pushToHistory]);

  const setComponentDefinitions = useCallback((updater: ComponentDefinition[] | ((prev: ComponentDefinition[]) => ComponentDefinition[])) => {
    setComponentDefinitionsState(prevDefs => {
        const newDefs = typeof updater === 'function' ? (updater as (prev: ComponentDefinition[]) => ComponentDefinition[])(prevDefs) : updater;
        pushToHistory('COMPONENT_DEFINITIONS_UPDATE', prevDefs, newDefs);
        return newDefs;
    });
  }, [pushToHistory]);

  const setEntityTemplates = useCallback((updater: EntityTemplate[] | ((prev: EntityTemplate[]) => EntityTemplate[])) => {
    setEntityTemplatesState(prevTpls => {
        const newTpls = typeof updater === 'function' ? (updater as (prev: EntityTemplate[]) => EntityTemplate[])(prevTpls) : updater;
        pushToHistory('ENTITY_TEMPLATES_UPDATE', prevTpls, newTpls);
        return newTpls;
    });
  }, [pushToHistory]);
  
  const setMainMenuConfig = useCallback((updater: MainMenuConfig | ((prev: MainMenuConfig) => MainMenuConfig)) => {
    setMainMenuConfigState(prevConfig => {
        const newConfig = typeof updater === 'function' ? (updater as (prev: MainMenuConfig) => MainMenuConfig)(prevConfig) : updater;
        pushToHistory('MAIN_MENU_UPDATE', prevConfig, newConfig);
        return newConfig;
    });
  }, [pushToHistory]);

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

      const isDataUpdateNeeded = updatedData && (! (typeof updatedData === 'object' && Object.keys(updatedData).length === 0));

      if (!isDataUpdateNeeded) {
        return intermediateAssets;
      }
      
      return intermediateAssets.map(asset => {
        if (asset.id === assetId) {
          let newAssetData: ProjectAsset['data'] = asset.data;
          switch (asset.type) {
            case 'tile': case 'sprite': case 'boss': case 'screenmap': case 'worldmap': case 'sound': case 'track': case 'behavior': case 'componentdefinition': case 'entitytemplate':
              if (asset.data && typeof asset.data === 'object' && typeof updatedData === 'object') {
                newAssetData = { ...asset.data, ...updatedData } as any;
              }
              break;
            case 'code':
              if (typeof updatedData === 'string') { newAssetData = updatedData; }
              break;
            default: break;
          }
          return { ...asset, data: newAssetData };
        }
        return asset;
      });
    });
  }, [setAssetsWithHistory, setStatusBarMessage]);

  useEffect(() => { localStorage.setItem(SNIPPETS_STORAGE_KEY, JSON.stringify(userSnippets));}, [userSnippets]);
  const handleOpenSnippetEditor = (snippet: Snippet | null) => { setEditingSnippet(snippet); setIsSnippetEditorModalOpen(true); };
  const handleSaveSnippet = (snippetToSave: Snippet) => { setUserSnippets(prevSnippets => { const existingIndex = prevSnippets.findIndex(s => s.id === snippetToSave.id); if (existingIndex > -1) { const updatedSnippets = [...prevSnippets]; updatedSnippets[existingIndex] = snippetToSave; return updatedSnippets; } else { return [...prevSnippets, snippetToSave]; }}); setIsSnippetEditorModalOpen(false); setEditingSnippet(null); setStatusBarMessage(`Snippet "${snippetToSave.name}" saved.`);};
  const handleDeleteSnippet = (snippetId: string) => { const snippetToDelete = userSnippets.find(s => s.id === snippetId); if (snippetToDelete) { setConfirmModalProps({ title: "Delete Snippet", message: `Are you sure you want to delete snippet "${snippetToDelete.name}"? This cannot be undone.`, onConfirm: () => { setUserSnippets(prevSnippets => prevSnippets.filter(s => s.id !== snippetId)); setStatusBarMessage(`Snippet "${snippetToDelete.name}" deleted.`); setIsConfirmModalOpen(false);}, confirmText: "Delete", confirmButtonVariant: 'danger'}); setIsConfirmModalOpen(true);}};
  
  const handleSnippetSelected = useCallback((snippet: Snippet) => {
    const resolvedCode = resolveSnippetPlaceholders(snippet.code, {
      assets,
      tileBanks,
    });
    setSnippetToInsert({ code: resolvedCode, timestamp: Date.now() });
  }, [assets, tileBanks]);

  useEffect(() => { const savedConfig = localStorage.getItem('ideConfig'); if (savedConfig) { try { const parsed = JSON.parse(savedConfig); if (parsed.dataOutputFormat) setDataOutputFormat(parsed.dataOutputFormat); if (typeof parsed.autosaveEnabled === 'boolean') setAutosaveEnabled(parsed.autosaveEnabled); if (typeof parsed.snippetsEnabled === 'boolean') setSnippetsEnabled(parsed.snippetsEnabled); if (typeof parsed.syntaxHighlightingEnabled === 'boolean') setSyntaxHighlightingEnabled(parsed.syntaxHighlightingEnabled); } catch (e) { console.error("Failed to load IDE config from localStorage", e); }}}, []);
  const saveIdeConfig = () => { const configToSave = { dataOutputFormat, autosaveEnabled, snippetsEnabled, syntaxHighlightingEnabled }; localStorage.setItem('ideConfig', JSON.stringify(configToSave)); setStatusBarMessage("IDE configuration saved to browser.");};
  const resetIdeConfig = () => { setDataOutputFormat('hex'); setAutosaveEnabled(true); setSnippetsEnabled(true); setSyntaxHighlightingEnabled(true); localStorage.removeItem('ideConfig'); setStatusBarMessage("IDE configuration reset to defaults.");};
  useEffect(() => { localStorage.setItem('tileBanksConfig', JSON.stringify(tileBanks));}, [tileBanks]);
  const handleOpenNewProjectModal = () => setIsNewProjectModalOpen(true);

  const handleConfirmNewProject = (projectNameFromModal: string) => {
    setConfirmModalProps({
      title: "Create New Project?",
      message: ( <> <p>Are you sure you want to create a new project named "{projectNameFromModal}"?</p> <p className="text-msx-warning mt-2">This will clear all current unsaved assets and history.</p> </> ),
      onConfirm: () => {
        setAssets([]);
        setSelectedAssetId(null);
        setCurrentProjectName(projectNameFromModal); 
        setCurrentEditor(EditorType.None);
        setTileBanksState(DEFAULT_TILE_BANKS_CONFIG); 
        setComponentDefinitionsState(DEFAULT_COMPONENT_DEFINITIONS);
        setEntityTemplatesState(DEFAULT_ENTITY_TEMPLATES);
        setMainMenuConfigState(DEFAULT_MAIN_MENU_CONFIG);
        clearAllHistory(); 
        setCopiedScreenBuffer(null); 
        setCopiedTileData(null);
        setCopiedLayerBuffer(null); 
        setSelectedEffectZoneId(null);
        const newProjectFiles = [ "main.asm", "data/graphics.asm", "data/components.asm", "code/behaviors.asm"];
        const formattedDate = getFormattedDate();
        const createdAssets: ProjectAsset[] = [];
        let mainAsmAssetId: string | null = null;
        newProjectFiles.forEach(filename => { const fileContent = filename === "main.asm" ? generateMainAsmContent(projectNameFromModal, formattedDate) : generateAsmFileHeader(projectNameFromModal, formattedDate, filename); const assetId = `code_new_${projectNameFromModal.replace(/\s+/g, '_')}_${filename.replace('.asm', '').replace(/\//g, '_')}_${Date.now()}_${Math.random().toString(36).substring(2,7)}`; const newAsset: ProjectAsset = { id: assetId, name: filename, type: 'code', data: fileContent }; createdAssets.push(newAsset); if (filename === "main.asm") { mainAsmAssetId = assetId; }});
        setAssets(createdAssets);
        if (mainAsmAssetId) { setSelectedAssetId(mainAsmAssetId); setCurrentEditor(EditorType.Code); setStatusBarMessage(`Project "${projectNameFromModal}" created. main.asm opened.`);} else { setStatusBarMessage(`Project "${projectNameFromModal}" created.`);}
        setIsNewProjectModalOpen(false); setIsConfirmModalOpen(false);
      }, confirmText: "Create New", confirmButtonVariant: 'danger'
    });
    setIsConfirmModalOpen(true);
  };

  const handleNewAsset = (type: ProjectAsset['type']) => {
    const id = `${type}_${Date.now()}`;
    let newAssetData: any;
    let defaultName = `New ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    let newEditorType: EditorType = EditorType.None;
    const defaultLogicalProps: TileLogicalProperties = {
      mapId: 0, familyId: 0, instanceId: 0,
      isSolid: false, isBreakable: false, causesDamage: false,
      isMovable: false, isInteractiveSwitch: false,
    };

    switch (type) {
      case 'tile': 
        const tileW = DEFAULT_TILE_WIDTH; 
        const tileH = DEFAULT_TILE_HEIGHT; 
        const initialColor = currentScreenMode === "SCREEN 2 (Graphics I)" ? DEFAULT_SCREEN2_FG_COLOR : MSX_SCREEN5_PALETTE[1].hex; 
        newAssetData = { 
            id, name: defaultName, width: tileW, height: tileH, 
            data: Array(tileH).fill(null).map(() => Array(tileW).fill(initialColor)), 
            ...(currentScreenMode === "SCREEN 2 (Graphics I)" && { lineAttributes: createDefaultLineAttributes(tileW, tileH, DEFAULT_SCREEN2_FG_COLOR, DEFAULT_SCREEN2_BG_COLOR) }),
            logicalProperties: defaultLogicalProps 
        } as Tile; 
        newEditorType = EditorType.Tile; 
        break;
      case 'sprite': newAssetData = { id, name: defaultName, size: { width: DEFAULT_SPRITE_SIZE, height: DEFAULT_SPRITE_SIZE }, spritePalette: [MSX_SCREEN5_PALETTE[1].hex, MSX_SCREEN5_PALETTE[2].hex, MSX_SCREEN5_PALETTE[8].hex, MSX_SCREEN5_PALETTE[15].hex], backgroundColor: MSX_SCREEN5_PALETTE[0].hex, frames: [{ id: `frame_${Date.now()}`, data: Array(DEFAULT_SPRITE_SIZE).fill(null).map(() => Array(DEFAULT_SPRITE_SIZE).fill(MSX_SCREEN5_PALETTE[0].hex)) }], currentFrameIndex: 0, } as Sprite; newEditorType = EditorType.Sprite; break;
      case 'boss': 
        const defaultPhase: BossPhase = {
            id: `phase_initial_${Date.now()}`,
            name: 'Phase 1',
            healthThreshold: 100,
            buildType: 'tile',
            dimensions: { width: 8, height: 8 },
            tileMatrix: Array(8).fill(null).map(() => Array(8).fill(null)),
            collisionMatrix: Array(8).fill(null).map(() => Array(8).fill(false)),
            weakPoints: [],
            attackSequence: [],
        };
        newAssetData = {
            id, name: defaultName,
            totalHealth: 100,
            phases: [defaultPhase],
            attacks: [],
        } as Boss;
        newEditorType = EditorType.Boss;
        break;
      case 'screenmap': const mapW = DEFAULT_SCREEN_WIDTH_TILES; const mapH = DEFAULT_SCREEN_HEIGHT_TILES; const emptyLayer: ScreenLayerData = Array(mapH).fill(null).map(() => Array(mapW).fill({ tileId: null })); newAssetData = { id, name: defaultName, width: mapW, height: mapH, layers: { background: emptyLayer, collision: [...emptyLayer.map(r => r.map(c => ({...c})))], effects: [...emptyLayer.map(r => r.map(c => ({...c})))], entities: [] }, effectZones: [], activeAreaX: 0, activeAreaY: 0, activeAreaWidth: mapW, activeAreaHeight: mapH, hudConfiguration: { elements: [] } } as ScreenMap; newEditorType = EditorType.Screen; break;
      case 'worldmap': newAssetData = { id, name: defaultName, nodes: [], connections: [], startScreenNodeId: null, gridSize: 40, zoomLevel: 1, panOffset: {x:0, y:0} } as WorldMapGraph; newEditorType = EditorType.WorldMap; break;
      case 'sound': const defaultChannelState: PSGSoundChannelState = { id: 'A', steps: [ { id: `step_${Date.now()}`, tonePeriod: 257, volume: 10, toneEnabled: true, noiseEnabled: false, useEnvelope: false, durationMs: 200 } ], loop: false }; newAssetData = { id, name: defaultName, tempoBPM: 120, channels: [defaultChannelState, { ...defaultChannelState, id: 'B', steps: [] }, { ...defaultChannelState, id: 'C', steps: [] }], noisePeriod: 16, envelopePeriod: 256, envelopeShape: 0b1000, masterVolume: 1.0, } as PSGSoundData; newEditorType = EditorType.Sound; break;
      case 'track': const initialPattern = createDefaultPT3Pattern(`initial_${Date.now()}`); newAssetData = { id, name: defaultName, bpm: DEFAULT_PT3_BPM, speed: DEFAULT_PT3_SPEED, globalVolume: 15, patterns: [initialPattern], order: [0], lengthInPatterns: 1, restartPosition: 0, instruments: [], ornaments: [], currentPatternIndexInOrder: 0, currentPatternId: initialPattern.id, } as TrackerSongData; newEditorType = EditorType.Track; break;
      case 'behavior': defaultName = "NewBehaviorScript.asm"; newAssetData = { id, name: defaultName, code: Z80_BEHAVIOR_SNIPPETS[0]?.code || "; New Behavior Script\n\nentity_update:\n    ret\n" } as BehaviorScript; newEditorType = EditorType.BehaviorEditor; break;
      case 'code': const formattedDate = getFormattedDate(); let projectNameForHeader = currentProjectName || "UntitledProject"; defaultName = "NewCodeFile.asm"; newAssetData = generateAsmFileHeader(projectNameForHeader, formattedDate, defaultName); newEditorType = EditorType.Code; break;
      default: setStatusBarMessage(`Asset type ${type} creation not implemented for this flow.`); return;
    }
    const newAsset: ProjectAsset = { id, name: defaultName, type, data: newAssetData };
    setAssetsWithHistory(prev => [...prev, newAsset]);
    setSelectedAssetId(id);
    setCurrentEditor(newEditorType);
    if (type === 'screenmap') setSelectedEffectZoneId(null); 
    setStatusBarMessage(`${defaultName} created.`);
  };

  
  const handleSpriteImported = (newSpriteData: Omit<Sprite, 'id' | 'name'>) => {
    const id = `sprite_imported_${Date.now()}`;
    const name = `Imported Sprite ${assets.filter(a => a.type === 'sprite').length + 1}`;
    const fullSpriteData: Sprite = {
      ...newSpriteData,
      id,
      name,
      currentFrameIndex: newSpriteData.frames.length > 0 ? 0 : -1, 
    };
    const newAsset: ProjectAsset = { id, name, type: 'sprite', data: fullSpriteData };
    setAssetsWithHistory(prev => [...prev, newAsset]);
    setSelectedAssetId(id);
    setCurrentEditor(EditorType.Sprite);
    setStatusBarMessage(`Sprite "${name}" imported successfully.`);
  };


  const memoizedHandleSelectAsset = useCallback((assetId: string | null, editorTypeOverride?: EditorType) => {
    setSelectedAssetId(assetId); 
    setSelectedEntityInstanceId(null); 
    setSelectedEffectZoneId(null); 
    
    if (editorTypeOverride) { 
      setCurrentEditor(editorTypeOverride);
      if (assetId) setStatusBarMessage(`Opened ${EditorType[editorTypeOverride]} Editor.`);
      return;
    }

    if (assetId === TILE_BANKS_SYSTEM_ASSET_ID) { setCurrentEditor(EditorType.TileBanks); setStatusBarMessage("Opened Tile Banks Editor."); } 
    else if (assetId === FONT_EDITOR_SYSTEM_ASSET_ID) { setCurrentEditor(EditorType.Font); setStatusBarMessage("Opened Font Editor."); } 
    else if (assetId === HELP_DOCS_SYSTEM_ASSET_ID) { setCurrentEditor(EditorType.HelpDocs); setStatusBarMessage("Opened Help & Tutorials."); }
    else if (assetId === COMPONENT_DEF_EDITOR_SYSTEM_ASSET_ID) { setCurrentEditor(EditorType.ComponentDefinitionEditor); setStatusBarMessage("Opened Component Definition Editor."); }
    else if (assetId === ENTITY_TEMPLATE_EDITOR_SYSTEM_ASSET_ID) { setCurrentEditor(EditorType.EntityTemplateEditor); setStatusBarMessage("Opened Entity Template Editor."); }
    else if (assetId === WORLD_VIEW_SYSTEM_ASSET_ID) { setCurrentEditor(EditorType.WorldView); setStatusBarMessage("Opened World View."); }
    else if (assetId === MAIN_MENU_SYSTEM_ASSET_ID) { setCurrentEditor(EditorType.MainMenu); setStatusBarMessage("Opened Main Menu Editor."); }
    else if (assetId) { const asset = assets.find(a => a.id === assetId); if (asset) { setCurrentEditor( asset.type === 'tile' ? EditorType.Tile : asset.type === 'sprite' ? EditorType.Sprite : asset.type === 'screenmap' ? EditorType.Screen : asset.type === 'worldmap' ? EditorType.WorldMap : asset.type === 'sound' ? EditorType.Sound : asset.type === 'track' ? EditorType.Track : asset.type === 'behavior' ? EditorType.BehaviorEditor : asset.type === 'code' ? EditorType.Code : asset.type === 'boss' ? EditorType.Boss : EditorType.None ); setStatusBarMessage(`Selected ${asset.name}.`); }} 
    else { setCurrentEditor(EditorType.None); setStatusBarMessage("No asset selected.");}
  }, [assets]);

  const memoizedOnRequestRename = useCallback((assetId: string, currentName: string, assetType: ProjectAsset['type']) => { setAssetToRenameInfo({ id: assetId, currentName, type: assetType }); setIsRenameModalOpen(true);}, []);
  
  const handleConfirmRename = useCallback((newName: string) => { 
    if (assetToRenameInfo) { 
      setAssetsWithHistory(prevAssets => prevAssets.map(a => { 
        if (a.id === assetToRenameInfo.id) { 
          const updatedAsset = { ...a, name: newName }; 
          if (updatedAsset.data && typeof updatedAsset.data === 'object') { 
            (updatedAsset.data as any).name = newName; 
          }
          return updatedAsset;
        } 
        return a;
      }));
      setStatusBarMessage(`Asset renamed to ${newName}.`);
    } 
    setIsRenameModalOpen(false); 
    setAssetToRenameInfo(null);
  }, [assetToRenameInfo, setAssetsWithHistory]);

  const handleCancelRename = () => { setIsRenameModalOpen(false); setAssetToRenameInfo(null); setStatusBarMessage("Rename cancelled.");};
  
  const handleDeleteAsset = (assetId: string) => { 
      const assetToDelete = assets.find(a => a.id === assetId); 
      if (assetToDelete) { 
          setConfirmModalProps({ 
              title: "Delete Asset", 
              message: `Are you sure you want to delete asset "${assetToDelete.name}"? This cannot be undone from the history.`, 
              onConfirm: () => { 
                  setAssets(prevAssets => prevAssets.filter(a => a.id !== assetId));
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

  const handleUpdateScreenMode = (mode: string) => { setCurrentScreenMode(mode); setStatusBarMessage(`Screen mode changed to ${mode}.`); if (mode === "SCREEN 2 (Graphics I)") { setSelectedColor(MSX1_PALETTE[15].hex); } else { setSelectedColor(MSX_SCREEN5_PALETTE[1].hex);}};
  
  const handleOpenSaveAsModal = () => { setIsSaveAsModalOpen(true); };

  const handleSaveProject = useCallback((filenameToSave?: string, isManualSaveOperation: boolean = true) => {
    let effectiveFilename = filenameToSave;
    if (!effectiveFilename) { 
      if (currentProjectName) {
        effectiveFilename = `${currentProjectName}.json`;
      } else {
        handleOpenSaveAsModal(); 
        return; 
      }
    }
    const projectData = { 
        assets, currentScreenMode, selectedAssetId, currentEditor, 
        tileBanks, msxFont, msxFontColorAttributes, 
        ideConfiguration: { dataOutputFormat, autosaveEnabled, snippetsEnabled, syntaxHighlightingEnabled }, 
        userSnippets, helpDocsData,
        currentProjectName, 
        componentDefinitions, entityTemplates, 
        mainMenuConfig,
        selectedEntityInstanceId, selectedEffectZoneId, 
    }; 
    const dataStr = JSON.stringify(projectData, null, 2); 
    const blob = new Blob([dataStr], { type: 'application/json' }); 
    const url = URL.createObjectURL(blob); 
    const a = document.createElement('a'); 
    a.href = url; 
    a.download = effectiveFilename; 
    document.body.appendChild(a); 
    a.click(); 
    document.body.removeChild(a); 
    URL.revokeObjectURL(url); 
    if (isManualSaveOperation && !effectiveFilename.includes('autosave')) { 
        setStatusBarMessage(`Project saved to ${effectiveFilename}`);
    }
  }, [assets, currentScreenMode, selectedAssetId, currentEditor, tileBanks, msxFont, msxFontColorAttributes, dataOutputFormat, autosaveEnabled, snippetsEnabled, syntaxHighlightingEnabled, userSnippets, helpDocsData, currentProjectName, componentDefinitions, entityTemplates, mainMenuConfig, selectedEntityInstanceId, selectedEffectZoneId]); 
  
  useEffect(() => { autosaveFunctionRef.current = () => { handleSaveProject('msx_ide_project_autosave.json', false); };}, [handleSaveProject]);
  
  useEffect(() => {
    if (!autosaveEnabled) {
      return;
    }
    const performSave = () => {
      setStatusBarMessage("Autosaving project...");
      setIsAutosaving(true);
      if (autosaveFunctionRef.current) {
        autosaveFunctionRef.current();
      }
      setTimeout(() => {
        setIsAutosaving(false);
        setStatusBarMessage("Project autosaved.");
        playAutosaveSound();
      }, 1000);
    };
    const intervalId = setInterval(performSave, AUTOSAVE_INTERVAL);
    return () => {
      clearInterval(intervalId);
    };
  }, [autosaveEnabled, playAutosaveSound]);

  const handleConfirmSaveAsProjectAs = (filenameFromModal: string) => {
    const finalFilename = filenameFromModal.toLowerCase().endsWith('.json') ? filenameFromModal : `${filenameFromModal}.json`;
    handleSaveProject(finalFilename, true); 
    const baseName = finalFilename.slice(0, -5); 
    setCurrentProjectName(baseName);
    setIsSaveAsModalOpen(false);
  };

  const handleLoadProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const projectData = JSON.parse(e.target?.result as string);
          clearAllHistory(); 
          setCopiedScreenBuffer(null); 
          setCopiedTileData(null);
          setCopiedLayerBuffer(null);
          if (projectData.assets) {
            const assetsWithEnsuredEffectZones = projectData.assets.map((asset: ProjectAsset) => {
                if (asset.type === 'screenmap' && asset.data && !(asset.data as ScreenMap).effectZones) {
                    return { ...asset, data: { ...(asset.data as ScreenMap), effectZones: [] } };
                }
                return asset;
            });
            setAssets(assetsWithEnsuredEffectZones);
          }
          if (projectData.currentScreenMode) setCurrentScreenMode(projectData.currentScreenMode);
          if (projectData.selectedAssetId) setSelectedAssetId(projectData.selectedAssetId);
          if (projectData.currentEditor) setCurrentEditor(projectData.currentEditor);
          if (projectData.tileBanks) setTileBanksState(projectData.tileBanks); else setTileBanksState(DEFAULT_TILE_BANKS_CONFIG);
          if (projectData.msxFont) setMsxFontState(projectData.msxFont); else setMsxFontState(DEFAULT_MSX_FONT); 
          if (projectData.msxFontColorAttributes) setMsxFontColorAttributesState(projectData.msxFontColorAttributes); else { const initialColors: MSXFontColorAttributes = {}; Object.keys(projectData.msxFont || msxFont).forEach(charCodeStr => { const charCodeNum = Number(charCodeStr); if (!isNaN(charCodeNum)) { initialColors[charCodeNum] = Array(8).fill(null).map(() => ({ fg: DEFAULT_SCREEN2_FG_COLOR, bg: DEFAULT_SCREEN2_BG_COLOR }));}}); setMsxFontColorAttributesState(initialColors);}
          if (projectData.ideConfiguration) { setDataOutputFormat(projectData.ideConfiguration.dataOutputFormat || 'hex'); setAutosaveEnabled(projectData.ideConfiguration.autosaveEnabled !== undefined ? projectData.ideConfiguration.autosaveEnabled : true); setSnippetsEnabled(projectData.ideConfiguration.snippetsEnabled !== undefined ? projectData.ideConfiguration.snippetsEnabled : true); setSyntaxHighlightingEnabled(projectData.ideConfiguration.syntaxHighlightingEnabled !== undefined ? projectData.ideConfiguration.syntaxHighlightingEnabled : true);}
          if (Array.isArray(projectData.userSnippets)) { setUserSnippets(projectData.userSnippets);}
          if (Array.isArray(projectData.helpDocsData)) { setHelpDocsData(projectData.helpDocsData); } else { setHelpDocsData(DEFAULT_HELP_DOCS_DATA); }
          if (typeof projectData.currentProjectName === 'string') { setCurrentProjectName(projectData.currentProjectName); setStatusBarMessage(`Project "${projectData.currentProjectName}" loaded from ${file.name}.`);} else {setCurrentProjectName(null); setStatusBarMessage(`Project loaded from "${file.name}". (No project name found, use Save As).`);}
          
          if (Array.isArray(projectData.componentDefinitions)) setComponentDefinitionsState(projectData.componentDefinitions); else setComponentDefinitionsState(DEFAULT_COMPONENT_DEFINITIONS);
          if (Array.isArray(projectData.entityTemplates)) setEntityTemplatesState(projectData.entityTemplates); else setEntityTemplatesState(DEFAULT_ENTITY_TEMPLATES);
          if (projectData.mainMenuConfig) setMainMenuConfigState(projectData.mainMenuConfig); else setMainMenuConfigState(DEFAULT_MAIN_MENU_CONFIG);

          setSelectedEntityInstanceId(projectData.selectedEntityInstanceId || null);
          setSelectedEffectZoneId(projectData.selectedEffectZoneId || null);

        } catch (error) { console.error("Error loading project:", error); setStatusBarMessage(`Failed to load project: ${error instanceof Error ? error.message : "Invalid file format"}`);}
      };
      reader.readAsText(file);
    }
  };
  const fileLoadInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleDeleteEntityInstance = (entityIdToDelete: string) => { 
    const activeAsset = assets.find(a => a.id === selectedAssetId);
    if (activeAsset && activeAsset.type === 'screenmap' && activeAsset.data) { 
      const currentScreenMap = activeAsset.data as ScreenMap; 
      const entityName = currentScreenMap.layers.entities.find(e => e.id === entityIdToDelete)?.name || "Unknown Entity"; 
      setConfirmModalProps({ 
        title: "Delete Entity Instance", 
        message: `Are you sure you want to delete entity "${entityName}"? This cannot be undone.`, 
        onConfirm: () => { 
          const updatedEntities = currentScreenMap.layers.entities.filter(e => e.id !== entityIdToDelete); 
          handleUpdateAsset(activeAsset.id, { layers: { ...currentScreenMap.layers, entities: updatedEntities } }); 
          setSelectedEntityInstanceId(null); 
          setStatusBarMessage("Entity instance deleted."); 
          setIsConfirmModalOpen(false);
        }, 
        confirmText: "Delete", 
        confirmButtonVariant: "danger"
      }); 
      setIsConfirmModalOpen(true);
    } else { 
      setStatusBarMessage("No screen map selected to delete entity from.");
    }
  };

  const handleShowMapFile = useCallback(() => {
    const allUniqueTileIdsInBanks = new Set<string>();
    tileBanks.filter(b => b.enabled ?? true).forEach(bank => {
        Object.keys(bank.assignedTiles).forEach(tileId => {
            allUniqueTileIdsInBanks.add(tileId);
        });
    });

    let totalChars = 0;
    allUniqueTileIdsInBanks.forEach(tileId => {
        const tileAsset = assets.find(a => a.id === tileId && a.type === 'tile');
        if (tileAsset?.data) {
            const tile = tileAsset.data as Tile;
            const widthInChars = Math.ceil(tile.width / EDITOR_BASE_TILE_DIM_S2);
            const heightInChars = Math.ceil(tile.height / EDITOR_BASE_TILE_DIM_S2);
            totalChars += widthInChars * heightInChars;
        }
    });
    
    const calculatedMaxPtr = totalChars * 8;
    const finalMapAsmContent = DEFAULT_MAP_ASM_CONTENT.replace('{{CALCULATED_MAX_PTR}}', String(calculatedMaxPtr));

    let mapAsmAsset = assets.find(a => a.name === 'map.asm');
    let constantsAsmAsset = assets.find(a => a.name === 'constants.asm');
    const newAssetsToCreate: ProjectAsset[] = [];
    let mapAsmAssetId: string | null = mapAsmAsset?.id || null;

    if (!mapAsmAsset) {
        const id = `code_map_asm_${Date.now()}`;
        mapAsmAsset = {
            id, name: 'map.asm', type: 'code', data: finalMapAsmContent,
        };
        newAssetsToCreate.push(mapAsmAsset);
        mapAsmAssetId = id;
    } else if (mapAsmAsset.data !== finalMapAsmContent) {
        setAssetsWithHistory(prev => prev.map(a => 
            a.id === mapAsmAsset!.id ? { ...a, data: finalMapAsmContent } : a
        ));
    }

    if (!constantsAsmAsset) {
        const id = `code_constants_asm_${Date.now()}`;
        constantsAsmAsset = {
            id, name: 'constants.asm', type: 'code', data: DEFAULT_CONSTANTS_ASM_CONTENT
        };
        newAssetsToCreate.push(constantsAsmAsset);
    }

    if (newAssetsToCreate.length > 0) {
        setAssetsWithHistory(prev => [...prev, ...newAssetsToCreate]);
        setStatusBarMessage(`Created map assembly files. MAX_PTR = ${calculatedMaxPtr}.`);
    } else {
        setStatusBarMessage(`Updated map.asm with MAX_PTR = ${calculatedMaxPtr}.`);
    }

    setTimeout(() => {
        if (mapAsmAssetId) {
          memoizedHandleSelectAsset(mapAsmAssetId, EditorType.Code);
        }
    }, 0);
  }, [assets, tileBanks, memoizedHandleSelectAsset, setAssetsWithHistory]);

  const handleUndo = useCallback(() => {
    if (history.undoStack.length === 0) {
        setStatusBarMessage("Nothing to undo.");
        return;
    }

    const newUndoStack = [...history.undoStack];
    const actionToUndo = newUndoStack.pop()!;
    const { type, payload } = actionToUndo;

    switch (type) {
        case 'ASSETS_UPDATE': setAssets(payload.before); break;
        case 'TILE_BANKS_UPDATE': setTileBanksState(payload.before); break;
        case 'FONT_UPDATE': setMsxFontState(payload.before); break;
        case 'FONT_COLOR_UPDATE': setMsxFontColorAttributesState(payload.before); break;
        case 'COMPONENT_DEFINITIONS_UPDATE': setComponentDefinitionsState(payload.before); break;
        case 'ENTITY_TEMPLATES_UPDATE': setEntityTemplatesState(payload.before); break;
        case 'MAIN_MENU_UPDATE': setMainMenuConfigState(payload.before); break;
    }
    
    setHistory(prev => ({ undoStack: newUndoStack, redoStack: [...prev.redoStack, actionToUndo] }));
    setStatusBarMessage(`Undo: ${type.replace(/_/g, ' ').toLowerCase()}`);
  }, [history]);

  const handleRedo = useCallback(() => {
    if (history.redoStack.length === 0) {
        setStatusBarMessage("Nothing to redo.");
        return;
    }

    const newRedoStack = [...history.redoStack];
    const actionToRedo = newRedoStack.pop()!;
    const { type, payload } = actionToRedo;

    switch (type) {
        case 'ASSETS_UPDATE': setAssets(payload.after); break;
        case 'TILE_BANKS_UPDATE': setTileBanksState(payload.after); break;
        case 'FONT_UPDATE': setMsxFontState(payload.after); break;
        case 'FONT_COLOR_UPDATE': setMsxFontColorAttributesState(payload.after); break;
        case 'COMPONENT_DEFINITIONS_UPDATE': setComponentDefinitionsState(payload.after); break;
        case 'ENTITY_TEMPLATES_UPDATE': setEntityTemplatesState(payload.after); break;
        case 'MAIN_MENU_UPDATE': setMainMenuConfigState(payload.after); break;
    }

    setHistory(prev => ({ undoStack: [...prev.undoStack, actionToRedo], redoStack: newRedoStack }));
    setStatusBarMessage(`Redo: ${type.replace(/_/g, ' ').toLowerCase()}`);
  }, [history]);

  const handleExportAllCodeFiles = async () => {
    setStatusBarMessage("Exporting all project files (code & binary assets)...");
    const codeAssets = assets.filter(a => a.type === 'code' || a.type === 'behavior'); 
    const tileAssetsAll = assets.filter(a => a.type === 'tile');
    const spriteAssetsAll = assets.filter(a => a.type === 'sprite');
    const screenMapAsset = assets.find(a => a.type === 'screenmap');
  
    if (codeAssets.length === 0 && tileAssetsAll.length === 0 && spriteAssetsAll.length === 0 && !screenMapAsset && Object.keys(msxFont).length === 0) {
      setStatusBarMessage("No files or font data to export.");
      return;
    }
  
    let projectName = currentProjectName || "MSX_Project"; 
    
    const zipFilename = `${projectName}.zip`;
    
    try {
      const zip = new JSZip();
      const projectFolderInZip = zip.folder(projectName);
  
      if (!projectFolderInZip) {
          throw new Error("Could not create project folder in zip.");
      }
      
      codeAssets.forEach(asset => {
        if (typeof asset.data === 'string' || (asset.type === 'behavior' && typeof (asset.data as BehaviorScript).code === 'string') ) {
          const content = asset.type === 'behavior' ? (asset.data as BehaviorScript).code : (asset.data as string);
          projectFolderInZip.file(asset.name, content);
        }
      });

      const binFolderInZip = projectFolderInZip.folder("bin");
      if (!binFolderInZip) {
        throw new Error("Could not create 'bin' folder in zip.");
      }

      if (tileAssetsAll.length > 0) {
        const allPatternsBytesArrays: Uint8Array[] = [];
        tileAssetsAll.forEach(asset => {
            const tile = asset.data as Tile;
            allPatternsBytesArrays.push(generateTilePatternBytes(tile, currentScreenMode));
        });
        if (allPatternsBytesArrays.length > 0) {
            const totalPatternLength = allPatternsBytesArrays.reduce((sum, arr) => sum + arr.length, 0);
            const combinedPatternBytes = new Uint8Array(totalPatternLength);
            let offset = 0;
            allPatternsBytesArrays.forEach(arr => {
                combinedPatternBytes.set(arr, offset);
                offset += arr.length;
            });
            if (combinedPatternBytes.length > 0) {
                 binFolderInZip.file("AllPatterns.BIN", combinedPatternBytes);
            }
        }

        if (currentScreenMode === "SCREEN 2 (Graphics I)") {
            const allColorsBytesArrays: Uint8Array[] = []; 
            tileAssetsAll.forEach(asset => {
                const tile = asset.data as Tile;
                const colorBytes = generateTileColorBytes(tile);
                if (colorBytes) allColorsBytesArrays.push(colorBytes); 
            });
            if (allColorsBytesArrays.length > 0) {
                const totalColorLength = allColorsBytesArrays.reduce((sum, arr) => sum + arr.length, 0); 
                const combinedColorBytes = new Uint8Array(totalColorLength);
                let offset = 0;
                allColorsBytesArrays.forEach(arr => {
                    combinedColorBytes.set(arr, offset);
                    offset += arr.length;
                });
                if (combinedColorBytes.length > 0) {
                    binFolderInZip.file("AllColors.BIN", combinedColorBytes);
                }
            }
        }
      }

      if (screenMapAsset) {
        const screenMapData = screenMapAsset.data as ScreenMap;
        const tileAssetDataForMap = tileAssetsAll.map(ta => ta.data as Tile);
        const banksForMap = currentScreenMode === "SCREEN 2 (Graphics I)" ? tileBanks : undefined;
        const layoutBytes = generateScreenMapLayoutBytes(screenMapData, tileAssetDataForMap, banksForMap, currentScreenMode);
        if (layoutBytes.length > 0) {
          binFolderInZip.file("MapLayout.bin", layoutBytes);
        }
      }
      
      if (spriteAssetsAll.length > 0) {
        const allSpriteDataArrays: Uint8Array[] = [];
        spriteAssetsAll.forEach(asset => {
          const sprite = asset.data as Sprite;
          allSpriteDataArrays.push(generateSpriteBinaryData(sprite));
        });
        if (allSpriteDataArrays.length > 0) {
          const totalSpriteDataLength = allSpriteDataArrays.reduce((sum, arr) => sum + arr.length, 0);
          const combinedSpriteDataBytes = new Uint8Array(totalSpriteDataLength);
          let offset = 0;
          allSpriteDataArrays.forEach(arr => {
            combinedSpriteDataBytes.set(arr, offset);
            offset += arr.length;
          });
          if (combinedSpriteDataBytes.length > 0) {
            binFolderInZip.file("sprites.bin", combinedSpriteDataBytes);
          }
        }
      }

      const fontPatternBytes = generateFontPatternBinaryData(msxFont, true); 
      if (fontPatternBytes.length > 0) {
        binFolderInZip.file("font_patterns.bin", fontPatternBytes);
      }
      if (currentScreenMode === "SCREEN 2 (Graphics I)") {
        const fontColorBytes = generateFontColorBinaryData(msxFontColorAttributes, true); 
        if (fontColorBytes.length > 0) {
          binFolderInZip.file("font_colors.bin", fontColorBytes);
        }
      }
  
      const zipBlob = await zip.generateAsync({ type: "blob" });
      
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = zipFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusBarMessage(`Project '${projectName}' (code & all binary assets) exported to ${zipFilename}.`);
    } catch (error) {
      console.error("Error exporting project files:", error);
      setStatusBarMessage(`Error exporting files: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };
  
  const handleCopyTileData = (tileToCopy: Tile) => {
    setCopiedTileData({
      data: tileToCopy.data.map(row => [...row]),
      lineAttributes: tileToCopy.lineAttributes ? deepCopy(tileToCopy.lineAttributes) : undefined,
      width: tileToCopy.width,
      height: tileToCopy.height,
    });
    setStatusBarMessage(`Tile "${tileToCopy.name}" copied to buffer.`);
  };

  const handleGenerateTemplatesAsm = useCallback(() => {
    const asmFilename = "data/entity_templates.asm";
    const asmCode = generateTemplatesASM(entityTemplates, componentDefinitions, assets);

    const existingAsset = assets.find(a => a.name === asmFilename);

    if (existingAsset) {
        setAssetsWithHistory(prev => prev.map(a => a.id === existingAsset.id ? { ...a, data: asmCode } : a));
        setStatusBarMessage(`Updated ${asmFilename} with latest template data.`);
        memoizedHandleSelectAsset(existingAsset.id);
    } else {
        const id = `code_tpl_asm_${Date.now()}`;
        const newAsset: ProjectAsset = {
            id,
            name: asmFilename,
            type: 'code',
            data: asmCode
        };
        setAssetsWithHistory(prev => [...prev, newAsset]);
        setStatusBarMessage(`Created ${asmFilename} with template data.`);
        memoizedHandleSelectAsset(id);
    }
  }, [entityTemplates, componentDefinitions, assets, setAssetsWithHistory, memoizedHandleSelectAsset]);

  const allPassedProps = {
    currentEditor, setCurrentEditor, assets, setAssets, selectedAssetId, setSelectedAssetId, currentProjectName, setCurrentProjectName, currentScreenMode, setCurrentScreenMode, statusBarMessage, setStatusBarMessage, selectedColor, setSelectedColor, screenEditorSelectedTileId, setScreenEditorSelectedTileId, currentScreenEditorActiveLayer, setCurrentScreenEditorActiveLayer, componentDefinitions, setComponentDefinitions, entityTemplates, setEntityTemplates, currentEntityTypeToPlace, setCurrentEntityTypeToPlace, selectedEntityInstanceId, setSelectedEntityInstanceId, selectedEffectZoneId, setSelectedEffectZoneId, isRenameModalOpen, setIsRenameModalOpen, assetToRenameInfo, setAssetToRenameInfo, isSaveAsModalOpen, setIsSaveAsModalOpen, isNewProjectModalOpen, setIsNewProjectModalOpen, isAboutModalOpen, setIsAboutModalOpen, isConfirmModalOpen, setIsConfirmModalOpen, confirmModalProps, setConfirmModalProps, tileBanks, setTileBanks, msxFont, setMsxFont, msxFontColorAttributes, setMsxFontColorAttributes, currentLoadedFontName, setCurrentLoadedFontName, helpDocsData, setHelpDocsData, dataOutputFormat, setDataOutputFormat, autosaveEnabled, setAutosaveEnabled, snippetsEnabled, setSnippetsEnabled, syntaxHighlightingEnabled, setSyntaxHighlightingEnabled, isConfigModalOpen, setIsConfigModalOpen, isSpriteSheetModalOpen, setIsSpriteSheetModalOpen, isSpriteFramesModalOpen, setIsSpriteFramesModalOpen, spriteForFramesModal, setSpriteForFramesModal, snippetToInsert, setSnippetToInsert, userSnippets, setUserSnippets, isSnippetEditorModalOpen, setIsSnippetEditorModalOpen, editingSnippet, setEditingSnippet, isAutosaving, setIsAutosaving, history, setHistory, copiedScreenBuffer, setCopiedScreenBuffer, copiedTileData, setCopiedTileData, copiedLayerBuffer, setCopiedLayerBuffer, contextMenu, setContextMenu, waypointPickerState, setWaypointPickerState, mainMenuConfig, onUpdateMainMenuConfig: setMainMenuConfig, handleUpdateSpriteOrder, handleOpenSpriteFramesModal, handleSplitFrames, handleCreateSpriteFromFrame, handleWaypointPicked, showContextMenu, closeContextMenu, playAutosaveSound, pushToHistory, clearAllHistory, setAssetsWithHistory, handleUpdateAsset, handleOpenSnippetEditor, handleSaveSnippet, handleDeleteSnippet, handleSnippetSelected, saveIdeConfig, resetIdeConfig, handleOpenNewProjectModal, handleConfirmNewProject, handleNewAsset, handleSpriteImported, memoizedHandleSelectAsset, memoizedOnRequestRename, handleConfirmRename, handleCancelRename, handleDeleteAsset, handleUpdateScreenMode, handleOpenSaveAsModal, handleSaveProject, handleConfirmSaveAsProjectAs, handleLoadProject, fileLoadInputRef, handleDeleteEntityInstance, handleShowMapFile, handleUndo, handleRedo, handleExportAllCodeFiles, handleCopyTileData, handleGenerateTemplatesAsm,
  };

  return (
    <ThemeProvider>
        <AppUI {...allPassedProps} />
    </ThemeProvider>
  );
};

export default App;
