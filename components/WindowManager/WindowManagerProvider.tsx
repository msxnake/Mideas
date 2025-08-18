import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ScreenEditorLayerName } from '../../types';

// --- Type Definitions ---

export interface WindowState {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isFocused: boolean;
  isVisible: boolean;
  assetId: string;
  assetType: string;
  activeLayer?: ScreenEditorLayerName;
}

export type InteractionMode = 'idle' | 'dragging' | 'resizing';

export interface InteractionState {
  mode: InteractionMode;
  targetId: string | null;
  // Store the initial mouse and window positions at the start of an interaction
  initialMouseX: number;
  initialMouseY: number;
  initialWindowX: number;
  initialWindowY: number;
  initialWindowWidth: number;
  initialWindowHeight: number;
}

export interface WindowManagerContextType {
  windows: WindowState[];
  interactionState: InteractionState;
  openWindow: (assetId: string, assetType: string, title: string) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowState: (id: string, newState: Partial<Pick<WindowState, 'x' | 'y' | 'width' | 'height' | 'activeLayer'>>) => void;
  startInteraction: (mode: InteractionMode, targetId: string, e: React.MouseEvent<HTMLDivElement>) => void;
  stopInteraction: () => void;
}

// --- Context ---

export const WindowManagerContext = createContext<WindowManagerContextType | null>(null);
const WINDOW_STATE_STORAGE_KEY = 'mideas-window-state';

// --- Provider Component ---

export const WindowManagerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [interactionState, setInteractionState] = useState<InteractionState>({
    mode: 'idle',
    targetId: null,
    initialMouseX: 0,
    initialMouseY: 0,
    initialWindowX: 0,
    initialWindowY: 0,
    initialWindowWidth: 0,
    initialWindowHeight: 0,
  });

  // Load/Save window state from/to localStorage
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(WINDOW_STATE_STORAGE_KEY);
      if (savedState) {
        setWindows(JSON.parse(savedState).map((w: any) => ({ ...w, isFocused: false })));
      }
    } catch (error) { console.error("Failed to load window state:", error); }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(WINDOW_STATE_STORAGE_KEY, JSON.stringify(windows));
    } catch (error) { console.error("Failed to save window state:", error); }
  }, [windows]);

  const focusWindow = useCallback((id: string) => {
    setWindows(prevWindows => {
      const highestZIndex = prevWindows.reduce((max, w) => Math.max(max, w.zIndex), 0);
      return prevWindows.map(w => ({
        ...w,
        isFocused: w.id === id,
        zIndex: w.id === id ? highestZIndex + 1 : w.zIndex,
      }));
    });
  }, []);

  const openWindow = useCallback((assetId: string, assetType: string, title: string) => {
    setWindows(prevWindows => {
      const existingWindow = prevWindows.find(w => w.id === assetId);
      if (existingWindow) {
        return prevWindows.map(w => w.id === assetId ? { ...w, isVisible: true } : w);
      }
      const highestZIndex = prevWindows.reduce((max, w) => Math.max(max, w.zIndex), 0);
      const newWindow: WindowState = {
        id: assetId, assetId, assetType, title,
        x: 50 + (prevWindows.length % 10) * 25,
        y: 50 + (prevWindows.length % 10) * 25,
        width: 640, height: 480, zIndex: highestZIndex + 1,
        isFocused: true, isVisible: true,
        ...(assetType === 'screenmap' && { activeLayer: 'background' as ScreenEditorLayerName }),
      };
      return [...prevWindows.map(w => ({...w, isFocused: false})), newWindow];
    });
    focusWindow(assetId);
  }, [focusWindow]);

  const closeWindow = useCallback((id: string) => {
    setWindows(prevWindows => prevWindows.map(w => w.id === id ? { ...w, isVisible: false, isFocused: false } : w));
  }, []);

  const updateWindowState = useCallback((id: string, newState: Partial<Pick<WindowState, 'x' | 'y' | 'width' | 'height' | 'activeLayer'>>) => {
    setWindows(prevWindows => prevWindows.map(w => w.id === id ? { ...w, ...newState } : w));
  }, []);

  const startInteraction = useCallback((mode: InteractionMode, targetId: string, e: React.MouseEvent<HTMLDivElement>) => {
    focusWindow(targetId);

    const targetWindow = windows.find(w => w.id === targetId);
    if (!targetWindow) return;

    setInteractionState({
        mode,
        targetId,
        initialMouseX: e.clientX,
        initialMouseY: e.clientY,
        initialWindowX: targetWindow.x,
        initialWindowY: targetWindow.y,
        initialWindowWidth: targetWindow.width,
        initialWindowHeight: targetWindow.height,
    });
  }, [windows, focusWindow]);

  const stopInteraction = useCallback(() => {
    setInteractionState(prev => ({ ...prev, mode: 'idle', targetId: null }));
  }, []);

  const contextValue: WindowManagerContextType = {
    windows,
    interactionState,
    openWindow,
    closeWindow,
    focusWindow,
    updateWindowState,
    startInteraction,
    stopInteraction,
  };

  return (
    <WindowManagerContext.Provider value={contextValue}>
      {children}
    </WindowManagerContext.Provider>
  );
};
