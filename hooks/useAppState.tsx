import { useState, useRef } from 'react';
import {
  EditorType, ProjectAsset, MSXColorValue, ScreenEditorLayerName,
  ComponentDefinition, EntityTemplate, MainMenuConfig, EntityInstance,
  HUDConfiguration, TileBank, MSXFont, MSXFontColorAttributes,
  MSXFontAsset, DataFormat, Snippet, HistoryState, HistoryAction,
  CopiedScreenData, CopiedLayerData, CopiedTileData, WaypointPickerState,
  GameFlowGraph, CopiedBossPhaseData, HelpDocSection, PresentationScreenConfig
} from '../types';
import {
  MSX_SCREEN5_PALETTE, DEFAULT_SCREEN_MODE, DEFAULT_MAIN_MENU_CONFIG,
  DEFAULT_SCREEN2_BG_COLOR, MSX1_PALETTE, Z80_SNIPPETS as DEFAULT_Z80_SNIPPETS,
  Z80_BEHAVIOR_SNIPPETS, DEFAULT_TILE_BANK_DEFINITIONS, MAX_HISTORY_LENGTH,
  DEFAULT_HELP_DOCS_DATA, DEFAULT_PRESENTATION_SCREEN_CONFIG
} from '../constants';
import { DEFAULT_COMPONENT_DEFINITIONS, DEFAULT_ENTITY_TEMPLATES } from '../data/defaults';
import { getVariedColorsForChar } from '../utils/colorUtils';
import { msxFontJsonString } from '../data/msxFontData';

export const useAppState = () => {
  // Editor state
  const [currentEditor, setCurrentEditor] = useState<EditorType>(EditorType.None);
  const [previousEditorContext, setPreviousEditorContext] = useState<{ editor: EditorType, assetId: string | null } | null>(null);
  const prevValuesRef = useRef<{ editor: EditorType, assetId: string | null }>();

  // Project state
  const [assets, setAssets] = useState<ProjectAsset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState<string | null>(null);
  const [currentScreenMode, setCurrentScreenMode] = useState<string>(DEFAULT_SCREEN_MODE);
  const [statusBarMessage, setStatusBarMessage] = useState<string>("MSX Retro Game IDE Initialized.");
  const [selectedColor, setSelectedColor] = useState<MSXColorValue>(MSX_SCREEN5_PALETTE[1].hex);

  // Screen Editor state
  const [screenEditorSelectedTileId, setScreenEditorSelectedTileId] = useState<string | null>(null);
  const [currentScreenEditorActiveLayer, setCurrentScreenEditorActiveLayer] = useState<ScreenEditorLayerName>('background');

  // Entity & Component state
  const [componentDefinitions, setComponentDefinitionsState] = useState<ComponentDefinition[]>(DEFAULT_COMPONENT_DEFINITIONS);
  const [entityTemplates, setEntityTemplatesState] = useState<EntityTemplate[]>(DEFAULT_ENTITY_TEMPLATES);
  const [mainMenuConfig, setMainMenuConfigState] = useState<MainMenuConfig>(DEFAULT_MAIN_MENU_CONFIG);
  const [presentationScreen, setPresentationScreenState] = useState<PresentationScreenConfig>(DEFAULT_PRESENTATION_SCREEN_CONFIG);
  const [currentEntityTypeToPlace, setCurrentEntityTypeToPlace] = useState<EntityTemplate | null>(null);
  const [selectedEntityInstanceId, setSelectedEntityInstanceId] = useState<string | null>(null);
  const [selectedEffectZoneId, setSelectedEffectZoneId] = useState<string | null>(null);
  const [selectedGameFlowNodeId, setSelectedGameFlowNodeId] = useState<string | null>(null);

  // Modal states
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [assetToRenameInfo, setAssetToRenameInfo] = useState<{ id: string; currentName: string; type: ProjectAsset['type'] } | null>(null);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isSpriteImportModalOpen, setIsSpriteImportModalOpen] = useState(false);
  const [isSpriteFramesModalOpen, setIsSpriteFramesModalOpen] = useState(false);
  const [spriteFramesModalAsset, setSpriteFramesModalAsset] = useState<ProjectAsset | null>(null);
  const [isTrackImportModalOpen, setIsTrackImportModalOpen] = useState(false);
  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
  const [isSnippetEditorModalOpen, setIsSnippetEditorModalOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalProps, setConfirmModalProps] = useState<any>({});
  const [isMapFileDisplayModalOpen, setIsMapFileDisplayModalOpen] = useState(false);
  const [isCodeExportModalOpen, setIsCodeExportModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isCompressDataModalOpen, setIsCompressDataModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isSpriteSheetModalOpen, setIsSpriteSheetModalOpen] = useState(false);

  // Configuration states
  const [tileBanks, setTileBanks] = useState<TileBank[]>(() => {
    const savedBanks = localStorage.getItem('tileBanksConfig');
    if (savedBanks) {
      try {
        const parsedBanks = JSON.parse(savedBanks);
        const needsMigration = parsedBanks.some((bank: TileBank) =>
          !bank.hasOwnProperty('logicalTilesEnabled') || !bank.hasOwnProperty('logicalTileTypes')
        );
        if (needsMigration) {
          const migratedBanks = parsedBanks.map((bank: TileBank) => ({
            ...bank,
            logicalTilesEnabled: bank.logicalTilesEnabled ?? false,
            logicalTileTypes: bank.logicalTileTypes ?? []
          }));
          localStorage.setItem('tileBanksConfig', JSON.stringify(migratedBanks));
          return migratedBanks;
        }
        return parsedBanks;
      } catch (e) {
        console.error('Failed to parse tile banks config. Using defaults.', e);
      }
    }
    return DEFAULT_TILE_BANK_DEFINITIONS;
  });

  const [msxFont, setMsxFont] = useState<MSXFont>(() => {
    const savedFont = localStorage.getItem('msxFont');
    if (savedFont) {
      try {
        return JSON.parse(savedFont);
      } catch (e) {
        console.error('Failed to parse MSX font. Using default.', e);
      }
    }
    const parsedFont = JSON.parse(msxFontJsonString);
    const fontCharset: MSXFont = {};
    for (const key in parsedFont.charset) {
      fontCharset[key] = parsedFont.charset[key];
    }
    return fontCharset;
  });

  const [msxFontColors, setMsxFontColors] = useState<MSXFontColorAttributes>(() => {
    const savedFontColors = localStorage.getItem('msxFontColors');
    if (savedFontColors) {
      try {
        return JSON.parse(savedFontColors);
      } catch (e) {
        console.error('Failed to parse MSX font colors. Using default.', e);
      }
    }
    const parsedFont = JSON.parse(msxFontJsonString);
    const fontColors: MSXFontColorAttributes = {};
    if (parsedFont.colorAttributes) {
      for (const key in parsedFont.colorAttributes) {
        fontColors[key] = parsedFont.colorAttributes[key];
      }
    } else {
      const initialColors: MSXFontColorAttributes = {};
      for (const charCodeStr in parsedFont.charset) {
        const charCodeNum = Number(charCodeStr);
        if (!isNaN(charCodeNum)) {
          const colors = getVariedColorsForChar(charCodeNum);
          initialColors[charCodeStr] = { fg: colors.fg, bg: colors.bg };
        }
      }
      return initialColors;
    }
    return fontColors;
  });

  const [userSnippets, setUserSnippets] = useState<Snippet[]>(() => {
    const SNIPPETS_STORAGE_KEY = 'msxIdeUserSnippets_v1';
    const savedSnippetsJSON = localStorage.getItem(SNIPPETS_STORAGE_KEY);
    if (savedSnippetsJSON) {
      try {
        const parsedSnippets = JSON.parse(savedSnippetsJSON);
        if (Array.isArray(parsedSnippets) && parsedSnippets.every((s: any) =>
          s && typeof s.id === 'string' && typeof s.name === 'string' && typeof s.code === 'string'
        )) {
          return parsedSnippets as Snippet[];
        } else {
          console.warn('Snippets from localStorage have invalid structure. Falling back to defaults.', parsedSnippets);
        }
      } catch (e) {
        console.error('Failed to parse snippets. Falling back to defaults.', e, savedSnippetsJSON);
      }
    }
    const allDefaultSnippets = [...DEFAULT_Z80_SNIPPETS, ...Z80_BEHAVIOR_SNIPPETS];
    return allDefaultSnippets;
  });

  // Help & Documentation
  const [helpDocsData, setHelpDocsData] = useState<HelpDocSection[]>(DEFAULT_HELP_DOCS_DATA);

  // IDE Configuration
  const [dataOutputFormat, setDataOutputFormat] = useState<DataFormat>(() => {
    const savedConfig = localStorage.getItem('ideConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        return config.dataOutputFormat || 'both';
      } catch (e) {
        console.error('Failed to parse IDE config. Using defaults.', e);
      }
    }
    return 'both';
  });

  const [autosaveEnabled, setAutosaveEnabled] = useState<boolean>(() => {
    const savedConfig = localStorage.getItem('ideConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        return config.autosaveEnabled !== undefined ? config.autosaveEnabled : true;
      } catch (e) {
        console.error('Failed to parse IDE config. Using defaults.', e);
      }
    }
    return true;
  });

  const [snippetsEnabled, setSnippetsEnabled] = useState<boolean>(() => {
    const savedConfig = localStorage.getItem('ideConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        return config.snippetsEnabled !== undefined ? config.snippetsEnabled : true;
      } catch (e) {
        console.error('Failed to parse IDE config. Using defaults.', e);
      }
    }
    return true;
  });

  const [syntaxHighlightingEnabled, setSyntaxHighlightingEnabled] = useState<boolean>(() => {
    const savedConfig = localStorage.getItem('ideConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        return config.syntaxHighlightingEnabled !== undefined ? config.syntaxHighlightingEnabled : true;
      } catch (e) {
        console.error('Failed to parse IDE config. Using defaults.', e);
      }
    }
    return true;
  });

  const [worldViewGridVisible, setWorldViewGridVisible] = useState<boolean>(() => {
    const savedConfig = localStorage.getItem('ideConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        return config.worldViewGridVisible !== undefined ? config.worldViewGridVisible : true;
      } catch (e) {
        console.error('Failed to parse IDE config. Using defaults.', e);
      }
    }
    return true;
  });

  const [saveBossZoom, setSaveBossZoom] = useState<boolean>(() => {
    const savedConfig = localStorage.getItem('ideConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        return config.saveBossZoom !== undefined ? config.saveBossZoom : false;
      } catch (e) {
        console.error('Failed to parse IDE config. Using defaults.', e);
      }
    }
    return false;
  });

  const [saveSpriteZoom, setSaveSpriteZoom] = useState<boolean>(() => {
    const savedConfig = localStorage.getItem('ideConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        return config.saveSpriteZoom !== undefined ? config.saveSpriteZoom : false;
      } catch (e) {
        console.error('Failed to parse IDE config. Using defaults.', e);
      }
    }
    return false;
  });

  const [saveTileZoom, setSaveTileZoom] = useState<boolean>(() => {
    const savedConfig = localStorage.getItem('ideConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        return config.saveTileZoom !== undefined ? config.saveTileZoom : false;
      } catch (e) {
        console.error('Failed to parse IDE config. Using defaults.', e);
      }
    }
    return false;
  });

  const [saveScreenZoom, setSaveScreenZoom] = useState<boolean>(() => {
    const savedConfig = localStorage.getItem('ideConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        return config.saveScreenZoom !== undefined ? config.saveScreenZoom : false;
      } catch (e) {
        console.error('Failed to parse IDE config. Using defaults.', e);
      }
    }
    return false;
  });

  const [saveSectorLines, setSaveSectorLines] = useState<boolean>(() => {
    const savedConfig = localStorage.getItem('ideConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        return config.saveSectorLines !== undefined ? config.saveSectorLines : false;
      } catch (e) {
        console.error('Failed to parse IDE config. Using defaults.', e);
      }
    }
    return false;
  });

  // History state
  const [historyStates, setHistoryStates] = useState<HistoryState[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);

  // Copy/Paste state
  const [copiedScreenData, setCopiedScreenData] = useState<CopiedScreenData | null>(null);
  const [copiedLayerData, setCopiedLayerData] = useState<CopiedLayerData | null>(null);
  const [copiedTileData, setCopiedTileData] = useState<CopiedTileData | null>(null);
  const [copiedBossPhaseData, setCopiedBossPhaseData] = useState<CopiedBossPhaseData | null>(null);

  // HUD Configuration
  const [hudConfig, setHudConfig] = useState<HUDConfiguration>({
    selectedTileIndex: 0,
    textColor: '#FFFFFF',
    backgroundColor: '#000000',
    hudElements: []
  });

  // Game Flow
  const [gameFlowGraph, setGameFlowGraph] = useState<GameFlowGraph>({
    nodes: [],
    connections: []
  });

  // Waypoint Picker
  const [waypointPickerState, setWaypointPickerState] = useState<WaypointPickerState>({
    isActive: false,
    sourceEntityId: null,
    targetWaypointFieldName: null
  });

  return {
    // Editor state
    currentEditor,
    setCurrentEditor,
    previousEditorContext,
    setPreviousEditorContext,
    prevValuesRef,

    // Project state
    assets,
    setAssets,
    selectedAssetId,
    setSelectedAssetId,
    currentProjectName,
    setCurrentProjectName,
    currentScreenMode,
    setCurrentScreenMode,
    statusBarMessage,
    setStatusBarMessage,
    selectedColor,
    setSelectedColor,

    // Screen Editor state
    screenEditorSelectedTileId,
    setScreenEditorSelectedTileId,
    currentScreenEditorActiveLayer,
    setCurrentScreenEditorActiveLayer,

    // Entity & Component state
    componentDefinitions,
    setComponentDefinitionsState,
    entityTemplates,
    setEntityTemplatesState,
    mainMenuConfig,
    setMainMenuConfigState,
    presentationScreen,
    setPresentationScreenState,
    currentEntityTypeToPlace,
    setCurrentEntityTypeToPlace,
    selectedEntityInstanceId,
    setSelectedEntityInstanceId,
    selectedEffectZoneId,
    setSelectedEffectZoneId,
    selectedGameFlowNodeId,
    setSelectedGameFlowNodeId,

    // Modal states
    isRenameModalOpen,
    setIsRenameModalOpen,
    assetToRenameInfo,
    setAssetToRenameInfo,
    isNewProjectModalOpen,
    setIsNewProjectModalOpen,
    isSpriteImportModalOpen,
    setIsSpriteImportModalOpen,
    isSpriteFramesModalOpen,
    setIsSpriteFramesModalOpen,
    spriteFramesModalAsset,
    setSpriteFramesModalAsset,
    isTrackImportModalOpen,
    setIsTrackImportModalOpen,
    isSaveAsModalOpen,
    setIsSaveAsModalOpen,
    isSnippetEditorModalOpen,
    setIsSnippetEditorModalOpen,
    editingSnippet,
    setEditingSnippet,
    isConfirmModalOpen,
    setIsConfirmModalOpen,
    confirmModalProps,
    setConfirmModalProps,
    isMapFileDisplayModalOpen,
    setIsMapFileDisplayModalOpen,
    isCodeExportModalOpen,
    setIsCodeExportModalOpen,
    isAboutModalOpen,
    setIsAboutModalOpen,
    isCompressDataModalOpen,
    setIsCompressDataModalOpen,
    isConfigModalOpen,
    setIsConfigModalOpen,
    isSpriteSheetModalOpen,
    setIsSpriteSheetModalOpen,

    // Configuration states
    tileBanks,
    setTileBanks,
    msxFont,
    setMsxFont,
    msxFontColors,
    setMsxFontColors,
    userSnippets,
    setUserSnippets,

    // Help & Documentation
    helpDocsData,
    setHelpDocsData,

    // IDE Configuration
    dataOutputFormat,
    setDataOutputFormat,
    autosaveEnabled,
    setAutosaveEnabled,
    snippetsEnabled,
    setSnippetsEnabled,
    syntaxHighlightingEnabled,
    setSyntaxHighlightingEnabled,
    worldViewGridVisible,
    setWorldViewGridVisible,
    saveBossZoom,
    setSaveBossZoom,
    saveSpriteZoom,
    setSaveSpriteZoom,
    saveTileZoom,
    setSaveTileZoom,
    saveScreenZoom,
    setSaveScreenZoom,
    saveSectorLines,
    setSaveSectorLines,

    // History state
    historyStates,
    setHistoryStates,
    currentHistoryIndex,
    setCurrentHistoryIndex,

    // Copy/Paste state
    copiedScreenData,
    setCopiedScreenData,
    copiedLayerData,
    setCopiedLayerData,
    copiedTileData,
    setCopiedTileData,
    copiedBossPhaseData,
    setCopiedBossPhaseData,

    // HUD Configuration
    hudConfig,
    setHudConfig,

    // Game Flow
    gameFlowGraph,
    setGameFlowGraph,

    // Waypoint Picker
    waypointPickerState,
    setWaypointPickerState
  };
};
