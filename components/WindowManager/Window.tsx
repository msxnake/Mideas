import React from 'react';
import { useWindowManager } from '@/hooks/useWindowManager';
import { WindowState } from '@/components/WindowManager/WindowManagerProvider';
import { WindowControls } from './WindowControls';
import '@/styles/WindowManager.css';

interface WindowProps {
  window: WindowState;
  children: React.ReactNode;
}

const STORAGE_KEY_PREFIX = 'mideas_window_state_';

export const Window = React.memo<WindowProps>(({ window, children }) => {
  const {
    interactionState,
    startInteraction,
    stopInteraction,
    closeWindow,
    maximizeWindow,
    restoreWindow,
    updateWindowState,
  } = useWindowManager();

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, mode: 'dragging' | 'resizing') => {
    e.preventDefault();
    e.stopPropagation();

    if (interactionState.mode !== 'idle') {
      stopInteraction();
    } else {
      startInteraction(mode, window.id, e);
    }
  };

  const handleSaveState = () => {
    try {
      const stateToSave = JSON.stringify({
        x: window.x,
        y: window.y,
        width: window.width,
        height: window.height,
      });
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${window.id}`, stateToSave);
      // Optional: notify user
      console.log(`State for window ${window.id} saved.`);
    } catch (error) {
      console.error("Failed to save window state:", error);
    }
  };

  const handleRestoreState = () => {
    try {
      const savedStateJSON = localStorage.getItem(`${STORAGE_KEY_PREFIX}${window.id}`);
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        updateWindowState(window.id, savedState);
      } else {
        console.log(`No saved state found for window ${window.id}.`);
      }
    } catch (error) {
      console.error("Failed to restore window state:", error);
    }
  };


  if (!window.isVisible) {
    return null;
  }

  return (
    <div
      className={`window ${window.isFocused ? 'focused' : ''} ${window.isMaximized ? 'maximized' : ''}`}
      style={{
        left: window.isMaximized ? '0' : `${window.x}px`,
        top: window.isMaximized ? '0' : `${window.y}px`,
        width: window.isMaximized ? '100%' : `${window.width}px`,
        height: window.isMaximized ? '100%' : `${window.height}px`,
        zIndex: window.zIndex,
        cursor: interactionState.mode !== 'idle' ? 'move' : 'default',
      }}
    >
      <div className="window-title-bar" onMouseDown={(e) => handleMouseDown(e, 'dragging')}>
        <span className="window-title">{window.title}</span>
        <WindowControls
            isMaximized={window.isMaximized}
            onClose={() => closeWindow(window.id)}
            onMaximize={() => maximizeWindow(window.id)}
            onRestore={() => restoreWindow(window.id)}
            onStateSave={handleSaveState}
            onStateRestore={handleRestoreState}
        />
      </div>
      <div className="window-content">
        {children}
      </div>
      <div
        className="resize-handle resize-handle-se"
        onMouseDown={(e) => handleMouseDown(e, 'resizing')}
      ></div>
    </div>
  );
});
