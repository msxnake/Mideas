import React from 'react';
import { useWindowManager } from '@/hooks/useWindowManager';
import { WindowState } from '@/components/WindowManager/WindowManagerProvider';
import { WindowControls } from './WindowControls';
import '@/styles/WindowManager.css';

interface WindowProps {
  window: WindowState;
  children: React.ReactNode;
}

export const Window = React.memo<WindowProps>(({ window, children }) => {
  const {
    interactionState,
    startInteraction,
    stopInteraction,
    closeWindow,
    maximizeWindow,
    minimizeWindow,
    restoreWindow,
    updateWindowState,
  } = useWindowManager();

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, mode: 'dragging' | 'resizing') => {
    e.preventDefault();
    e.stopPropagation();

    // If we are already in an interaction, this click stops it.
    if (interactionState.mode !== 'idle') {
      stopInteraction();
    } else {
      // Otherwise, start a new interaction.
      startInteraction(mode, window.id, e);
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
        display: window.isMinimized ? 'none' : 'flex',
      }}
    >
      <div className="window-title-bar" onMouseDown={(e) => handleMouseDown(e, 'dragging')}>
        <span className="window-title">{window.title}</span>
        <WindowControls
            windowId={window.id}
            isMaximized={window.isMaximized}
            onClose={() => closeWindow(window.id)}
            onMaximize={() => maximizeWindow(window.id)}
            onRestore={() => restoreWindow(window.id)}
            onMinimize={() => minimizeWindow(window.id)}
            onStateRestored={(state) => updateWindowState(window.id, state)}
            currentGeometry={{ x: window.x, y: window.y, width: window.width, height: window.height }}
        />
      </div>
      {!window.isMinimized && (
        <div className="window-content">
          {children}
        </div>
      )}
      <div
        className="resize-handle resize-handle-se"
        onMouseDown={(e) => handleMouseDown(e, 'resizing')}
      ></div>
    </div>
  );
});
