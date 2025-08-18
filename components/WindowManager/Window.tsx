import React, { useRef, useEffect } from 'react';
import { useWindowManager } from '@/hooks/useWindowManager';
import { WindowState } from '@/components/WindowManager/WindowManagerProvider';
import '@/styles/WindowManager.css';

interface WindowProps {
  window: WindowState;
  children: React.ReactNode;
}

const MIN_WIDTH = 150;
const MIN_HEIGHT = 100;
const TITLE_BAR_HEIGHT = 37;

// Using React.memo for performance optimization
export const Window = React.memo<WindowProps>(({ window, children }) => {
  const { updateWindowState, focusWindow, closeWindow } = useWindowManager();

  // Refs to hold state that doesn't need to trigger re-renders
  const stateRef = useRef({
    isDragging: false,
    isResizing: false,
    dragStartX: 0,
    dragStartY: 0,
  });

  const windowRef = useRef<HTMLDivElement>(null);

  // Use a ref to keep the latest version of the update function available to the event listeners
  // without needing to re-bind them.
  const updateWindowStateRef = useRef(updateWindowState);
  useEffect(() => {
    updateWindowStateRef.current = updateWindowState;
  }, [updateWindowState]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (stateRef.current.isDragging) {
        let newX = e.clientX - stateRef.current.dragStartX;
        let newY = e.clientY - stateRef.current.dragStartY;

        // Boundary checks
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        newX = Math.max(-window.width + 50, Math.min(newX, viewportWidth - 50));
        newY = Math.max(0, Math.min(newY, viewportHeight - TITLE_BAR_HEIGHT));

        updateWindowStateRef.current(window.id, { x: newX, y: newY });
      }

      if (stateRef.current.isResizing) {
        const rect = windowRef.current?.getBoundingClientRect();
        if (rect) {
          let newWidth = e.clientX - rect.left;
          let newHeight = e.clientY - rect.top;

          newWidth = Math.max(newWidth, MIN_WIDTH);
          newHeight = Math.max(newHeight, MIN_HEIGHT);

          newWidth = Math.min(newWidth, window.innerWidth - rect.left);
          newHeight = Math.min(newHeight, window.innerHeight - rect.top);

          updateWindowStateRef.current(window.id, { width: newWidth, height: newHeight });
        }
      }
    };

    const handleMouseUp = () => {
      stateRef.current.isDragging = false;
      stateRef.current.isResizing = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [window.id, window.width]); // Re-bind if window properties used in checks change

  const handleMouseDownOnTitleBar = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    focusWindow(window.id);

    const rect = windowRef.current?.getBoundingClientRect();
    if (rect) {
      stateRef.current.dragStartX = e.clientX - rect.left;
      stateRef.current.dragStartY = e.clientY - rect.top;
      stateRef.current.isDragging = true;
    }
  };

  const handleMouseDownOnResize = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    stateRef.current.isResizing = true;
  };

  if (!window.isVisible) {
    return null;
  }

  return (
    <div
      ref={windowRef}
      className={`window ${window.isFocused ? 'focused' : ''}`}
      style={{
        left: `${window.x}px`,
        top: `${window.y}px`,
        width: `${window.width}px`,
        height: `${window.height}px`,
        zIndex: window.zIndex,
      }}
      onMouseDown={() => focusWindow(window.id)}
    >
      <div className="window-title-bar" onMouseDown={handleMouseDownOnTitleBar}>
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
        onMouseDown={handleMouseDownOnResize}
      ></div>
    </div>
  );
});
