import { useCallback, useState } from 'react';
import {
  ProjectAsset, HistoryState, HistoryAction, HistoryActionType,
  TileBank, MSXFont, MSXFontColorAttributes, ComponentDefinition,
  EntityTemplate, MainMenuConfig, PresentationScreenConfig
} from '../types';
import { MAX_HISTORY_LENGTH } from '../constants';

interface HistoryHandlersProps {
  setAssets: (assets: ProjectAsset[]) => void;
  setTileBanksState: (banks: TileBank[]) => void;
  setMsxFontState: (font: MSXFont) => void;
  setMsxFontColorAttributesState: (colors: MSXFontColorAttributes) => void;
  setComponentDefinitionsState: (defs: ComponentDefinition[]) => void;
  setEntityTemplatesState: (templates: EntityTemplate[]) => void;
  setMainMenuConfigState: (config: MainMenuConfig) => void;
  setPresentationScreenState: (config: PresentationScreenConfig) => void;
  setStatusBarMessage: (message: string) => void;
}

export const useHistoryHandlers = ({
  setAssets,
  setTileBanksState,
  setMsxFontState,
  setMsxFontColorAttributesState,
  setComponentDefinitionsState,
  setEntityTemplatesState,
  setMainMenuConfigState,
  setPresentationScreenState,
  setStatusBarMessage
}: HistoryHandlersProps) => {

  const [history, setHistory] = useState<HistoryState>({ undoStack: [], redoStack: [] });

  const pushToHistory = useCallback((type: HistoryActionType, before: any, after: any) => {
    if (JSON.stringify(before) === JSON.stringify(after)) {
      return; // No change, don't add to history
    }

    const action: HistoryAction = {
      type,
      payload: { before, after },
      timestamp: Date.now()
    };

    setHistory(prev => {
      const newUndoStack = [...prev.undoStack, action];

      // Limit history size
      if (newUndoStack.length > MAX_HISTORY_LENGTH) {
        newUndoStack.shift(); // Remove oldest entry
      }

      return {
        undoStack: newUndoStack,
        redoStack: [] // Clear redo stack when new action is performed
      };
    });
  }, []);

  const clearAllHistory = useCallback(() => {
    setHistory({ undoStack: [], redoStack: [] });
  }, []);

  const setAssetsWithHistory = useCallback((updater: (prev: ProjectAsset[]) => ProjectAsset[]) => {
    setAssets(prevAssets => {
      const newAssets = updater(prevAssets);
      pushToHistory('ASSETS_UPDATE', prevAssets, newAssets);
      return newAssets;
    });
  }, [pushToHistory, setAssets]);

  const setTileBanks = useCallback((updater: TileBank[] | ((prev: TileBank[]) => TileBank[])) => {
    setTileBanksState(prevBanks => {
      const newBanks = typeof updater === 'function' ?
        (updater as (prev: TileBank[]) => TileBank[])(prevBanks) : updater;
      pushToHistory('TILE_BANKS_UPDATE', prevBanks, newBanks);
      return newBanks;
    });
  }, [pushToHistory, setTileBanksState]);

  const setMsxFont = useCallback((updater: MSXFont | ((prev: MSXFont) => MSXFont)) => {
    setMsxFontState(prevFont => {
      const newFont = typeof updater === 'function' ?
        (updater as (prev: MSXFont) => MSXFont)(prevFont) : updater;
      pushToHistory('FONT_UPDATE', prevFont, newFont);
      return newFont;
    });
  }, [pushToHistory, setMsxFontState]);

  const setMsxFontColorAttributes = useCallback((updater: MSXFontColorAttributes | ((prev: MSXFontColorAttributes) => MSXFontColorAttributes)) => {
    setMsxFontColorAttributesState(prevColors => {
      const newColors = typeof updater === 'function' ?
        (updater as (prev: MSXFontColorAttributes) => MSXFontColorAttributes)(prevColors) : updater;
      pushToHistory('FONT_COLOR_UPDATE', prevColors, newColors);
      return newColors;
    });
  }, [pushToHistory, setMsxFontColorAttributesState]);

  const setComponentDefinitions = useCallback((updater: ComponentDefinition[] | ((prev: ComponentDefinition[]) => ComponentDefinition[])) => {
    setComponentDefinitionsState(prevDefs => {
      const newDefs = typeof updater === 'function' ?
        (updater as (prev: ComponentDefinition[]) => ComponentDefinition[])(prevDefs) : updater;
      pushToHistory('COMPONENT_DEFINITIONS_UPDATE', prevDefs, newDefs);
      return newDefs;
    });
  }, [pushToHistory, setComponentDefinitionsState]);

  const setEntityTemplates = useCallback((updater: EntityTemplate[] | ((prev: EntityTemplate[]) => EntityTemplate[])) => {
    setEntityTemplatesState(prevTemplates => {
      const newTemplates = typeof updater === 'function' ?
        (updater as (prev: EntityTemplate[]) => EntityTemplate[])(prevTemplates) : updater;
      pushToHistory('ENTITY_TEMPLATES_UPDATE', prevTemplates, newTemplates);
      return newTemplates;
    });
  }, [pushToHistory, setEntityTemplatesState]);

  const setMainMenuConfig = useCallback((updater: MainMenuConfig | ((prev: MainMenuConfig) => MainMenuConfig)) => {
    setMainMenuConfigState(prevConfig => {
      const newConfig = typeof updater === 'function' ?
        (updater as (prev: MainMenuConfig) => MainMenuConfig)(prevConfig) : updater;
      pushToHistory('MAIN_MENU_UPDATE', prevConfig, newConfig);
      return newConfig;
    });
  }, [pushToHistory, setMainMenuConfigState]);

  const setPresentationScreen = useCallback((updater: PresentationScreenConfig | ((prev: PresentationScreenConfig) => PresentationScreenConfig)) => {
    setPresentationScreenState(prevConfig => {
      const newConfig = typeof updater === 'function'
        ? (updater as (prev: PresentationScreenConfig) => PresentationScreenConfig)(prevConfig)
        : updater;
      pushToHistory('PRESENTATION_SCREEN_UPDATE', prevConfig, newConfig);
      return newConfig;
    });
  }, [pushToHistory, setPresentationScreenState]);

  const handleUndo = useCallback(() => {
    if (history.undoStack.length === 0) {
      setStatusBarMessage("Nothing to undo.");
      return;
    }

    const newUndoStack = [...history.undoStack];
    const actionToUndo = newUndoStack.pop()!;
    const { type, payload } = actionToUndo;

    switch (type) {
      case 'ASSETS_UPDATE':
        setAssets(payload.before);
        break;
      case 'TILE_BANKS_UPDATE':
        setTileBanksState(payload.before);
        break;
      case 'FONT_UPDATE':
        setMsxFontState(payload.before);
        break;
      case 'FONT_COLOR_UPDATE':
        setMsxFontColorAttributesState(payload.before);
        break;
      case 'COMPONENT_DEFINITIONS_UPDATE':
        setComponentDefinitionsState(payload.before);
        break;
      case 'ENTITY_TEMPLATES_UPDATE':
        setEntityTemplatesState(payload.before);
        break;
      case 'MAIN_MENU_UPDATE':
        setMainMenuConfigState(payload.before);
        break;
      case 'PRESENTATION_SCREEN_UPDATE':
        setPresentationScreenState(payload.before);
        break;
    }

    setHistory(prev => ({
      undoStack: newUndoStack,
      redoStack: [...prev.redoStack, actionToUndo]
    }));

    setStatusBarMessage(`Undone: ${type.replace('_', ' ').toLowerCase()}.`);
  }, [
    history.undoStack,
    setAssets,
    setTileBanksState,
    setMsxFontState,
    setMsxFontColorAttributesState,
    setComponentDefinitionsState,
    setEntityTemplatesState,
    setMainMenuConfigState,
    setPresentationScreenState,
    setStatusBarMessage
  ]);

  const handleRedo = useCallback(() => {
    if (history.redoStack.length === 0) {
      setStatusBarMessage("Nothing to redo.");
      return;
    }

    const newRedoStack = [...history.redoStack];
    const actionToRedo = newRedoStack.pop()!;
    const { type, payload } = actionToRedo;

    switch (type) {
      case 'ASSETS_UPDATE':
        setAssets(payload.after);
        break;
      case 'TILE_BANKS_UPDATE':
        setTileBanksState(payload.after);
        break;
      case 'FONT_UPDATE':
        setMsxFontState(payload.after);
        break;
      case 'FONT_COLOR_UPDATE':
        setMsxFontColorAttributesState(payload.after);
        break;
      case 'COMPONENT_DEFINITIONS_UPDATE':
        setComponentDefinitionsState(payload.after);
        break;
      case 'ENTITY_TEMPLATES_UPDATE':
        setEntityTemplatesState(payload.after);
        break;
      case 'MAIN_MENU_UPDATE':
        setMainMenuConfigState(payload.after);
        break;
      case 'PRESENTATION_SCREEN_UPDATE':
        setPresentationScreenState(payload.after);
        break;
    }

    setHistory(prev => ({
      undoStack: [...prev.undoStack, actionToRedo],
      redoStack: newRedoStack
    }));

    setStatusBarMessage(`Redone: ${type.replace('_', ' ').toLowerCase()}.`);
  }, [
    history.redoStack,
    setAssets,
    setTileBanksState,
    setMsxFontState,
    setMsxFontColorAttributesState,
    setComponentDefinitionsState,
    setEntityTemplatesState,
    setMainMenuConfigState,
    setPresentationScreenState,
    setStatusBarMessage
  ]);

  return {
    history,
    setHistory,
    pushToHistory,
    clearAllHistory,
    setAssetsWithHistory,
    setTileBanks,
    setMsxFont,
    setMsxFontColorAttributes,
    setComponentDefinitions,
    setEntityTemplates,
    setMainMenuConfig,
    setPresentationScreen,
    handleUndo,
    handleRedo
  };
};
