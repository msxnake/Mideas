import React from 'react';
import { useWindowManager } from '@/hooks/useWindowManager';
import { WindowState } from '@/components/WindowManager/WindowManagerProvider';
import '@/styles/WindowManager.css';

interface WindowProps {
  window: WindowState;
  children: React.ReactNode;
}

export const Window = React.memo<WindowProps>(({ window, children }) => {
  const { interactionState, startInteraction, stopInteraction, closeWindow } = useWindowManager();

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
      className={`window ${window.isFocused ? 'focused' : ''}`}
      style={{
        left: `${window.x}px`,
        top: `${window.y}px`,
        width: `${window.width}px`,
        height: `${window.height}px`,
        zIndex: window.zIndex,
        cursor: interactionState.mode !== 'idle' ? 'move' : 'default', // Visual feedback for active move
      }}
    >
      <div className="window-title-bar" onMouseDown={(e) => handleMouseDown(e, 'dragging')}>
        <span className="window-title">{window.title}</span>
        <button
          className="window-close-button"
          onClick={(e) => {
            e.stopPropagation();
            closeWindow(window.id);
          }}
          aria-label="Close Window"
        >
          &times;
        </button>
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
