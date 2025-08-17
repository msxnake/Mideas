import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useWindowManager } from '../../hooks/useWindowManager';
import { WindowState } from './WindowManagerProvider';
import '../../styles/WindowManager.css';

interface WindowProps {
  window: WindowState;
  children: React.ReactNode;
}

const MIN_WIDTH = 150;
const MIN_HEIGHT = 100;
const TITLE_BAR_HEIGHT = 37; // Approximate height of the title bar for boundary checks

const WindowComponent: React.FC<WindowProps> = ({ window, children }) => {
  const { updateWindowState, focusWindow, closeWindow } = useWindowManager();

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });

  const windowRef = useRef<HTMLDivElement>(null);

  const handleMouseDownOnWindow = () => {
    if (window.id) {
        focusWindow(window.id);
    }
  };

  const handleMouseDownOnTitleBar = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (window.id) {
        focusWindow(window.id);
    }
    setIsDragging(true);

    const rect = windowRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStartPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseDownOnResize = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      let newX = e.clientX - dragStartPos.x;
      let newY = e.clientY - dragStartPos.y;

      // Viewport boundary checks for dragging
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Prevent dragging header completely off-screen
      newX = Math.max(-window.width + 50, Math.min(newX, viewportWidth - 50));
      newY = Math.max(0, Math.min(newY, viewportHeight - TITLE_BAR_HEIGHT));

      updateWindowState(window.id, { x: newX, y: newY });
    }

    if (isResizing) {
        const rect = windowRef.current?.getBoundingClientRect();
        if (rect) {
            let newWidth = e.clientX - rect.left;
            let newHeight = e.clientY - rect.top;

            // Enforce minimum size
            newWidth = Math.max(newWidth, MIN_WIDTH);
            newHeight = Math.max(newHeight, MIN_HEIGHT);

            // Enforce maximum size (viewport boundary)
            newWidth = Math.min(newWidth, window.innerWidth - rect.left);
            newHeight = Math.min(newHeight, window.innerHeight - rect.top);

            updateWindowState(window.id, { width: newWidth, height: newHeight });
        }
    }
  }, [isDragging, isResizing, dragStartPos, window.id, window.width, updateWindowState]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

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
      onMouseDown={handleMouseDownOnWindow}
    >
      <div className="window-title-bar" onMouseDown={handleMouseDownOnTitleBar}>
        <span className="window-title">{window.title}</span>
        <button
          className="window-close-button"
          onClick={(e) => {
            e.stopPropagation();
            if (window.id) closeWindow(window.id);
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
};

export const Window = React.memo(WindowComponent);
