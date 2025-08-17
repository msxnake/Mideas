import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';

// --- Type Definitions ---

import { ScreenEditorLayerName } from '../../types';

export interface WindowState {
  id: string; // Unique ID for the window instance, can be the assetId
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isFocused: boolean;
  isVisible: boolean;
  // We need to know what to render inside
  assetId: string;
  assetType: string;
  // State specific to certain editor types
  activeLayer?: ScreenEditorLayerName;
}

export interface WindowManagerContextType {
  windows: WindowState[];
  openWindow: (assetId: string, assetType: string, title: string) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowState: (id: string, newState: Partial<Pick<WindowState, 'x' | 'y' | 'width' | 'height' | 'activeLayer'>>) => void;
}

// --- Context ---

export const WindowManagerContext = createContext<WindowManagerContextType | null>(null);
const WINDOW_STATE_STORAGE_KEY = 'mideas-window-state';

// --- Provider Component ---

export const WindowManagerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<WindowState[]>([]);

  // Load state from localStorage on initial render
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(WINDOW_STATE_STORAGE_KEY);
      if (savedState) {
        const parsedState: WindowState[] = JSON.parse(savedState);
        // Ensure all windows are initially unfocused after a reload
        const initialState = parsedState.map(w => ({ ...w, isFocused: false }));
        setWindows(initialState);
      }
    } catch (error) {
      console.error("Failed to load window state from localStorage:", error);
      setWindows([]);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(WINDOW_STATE_STORAGE_KEY, JSON.stringify(windows));
    } catch (error) {
      console.error("Failed to save window state to localStorage:", error);
    }
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
    let windowExists = false;
    setWindows(prevWindows => {
      const existingWindow = prevWindows.find(w => w.id === assetId);
      if (existingWindow) {
        windowExists = true;
        // Make it visible. Focus will be handled outside this callback.
        return prevWindows.map(w => w.id === assetId ? { ...w, isVisible: true } : w);
      } else {
        // Create a new window
        const highestZIndex = prevWindows.reduce((max, w) => Math.max(max, w.zIndex), 0);
        const newWindow: WindowState = {
          id: assetId,
          assetId,
          assetType,
          title,
          x: 50 + (prevWindows.length % 10) * 25, // Cascade new windows slightly
          y: 50 + (prevWindows.length % 10) * 25,
          width: 640,
          height: 480,
          zIndex: highestZIndex + 1,
          isFocused: true, // It will be focused immediately
          isVisible: true,
          // Add initial state for specific window types
          ...(assetType === 'screenmap' && { activeLayer: 'background' as ScreenEditorLayerName }),
        };
        // Unfocus all other windows before adding the new one
        return [...prevWindows.map(w => ({...w, isFocused: false})), newWindow];
      }
    });

    // Always focus the window that is being opened.
    // The state update from setWindows is queued, but focusWindow will also queue an update.
    // React will batch these updates.
    focusWindow(assetId);
  }, [focusWindow]);

  const closeWindow = useCallback((id: string) => {
    setWindows(prevWindows => prevWindows.map(w =>
      w.id === id ? { ...w, isVisible: false, isFocused: false } : w
    ));
  }, []);

  const updateWindowState = useCallback((id: string, newState: Partial<Pick<WindowState, 'x' | 'y' | 'width' | 'height' | 'activeLayer'>>) => {
    setWindows(prevWindows => prevWindows.map(w =>
      w.id === id ? { ...w, ...newState } : w
    ));
  }, []);

  const contextValue: WindowManagerContextType = {
    windows,
    openWindow,
    closeWindow,
    focusWindow,
    updateWindowState,
  };

  return (
    <WindowManagerContext.Provider value={contextValue}>
      {children}
    </WindowManagerContext.Provider>
  );
};
