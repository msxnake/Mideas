import React, { useRef, useState, useEffect, useCallback } from 'react';
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

const WindowComponent: React.FC<WindowProps> = ({ window, children }) => {
  const { updateWindowState, focusWindow, closeWindow } = useWindowManager();

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Use a ref for drag start position to avoid re-triggering useEffect
  const dragStartPosRef = useRef({ x: 0, y: 0 });
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

    const rect = windowRef.current?.getBoundingClientRect();
    if (rect) {
      dragStartPosRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      setIsDragging(true);
    }
  };

  const handleMouseDownOnResize = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        let newX = e.clientX - dragStartPosRef.current.x;
        let newY = e.clientY - dragStartPosRef.current.y;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        newX = Math.max(-window.width + 50, Math.min(newX, viewportWidth - 50));
        newY = Math.max(0, Math.min(newY, viewportHeight - TITLE_BAR_HEIGHT));

        updateWindowState(window.id, { x: newX, y: newY });
      }

      if (isResizing) {
          const rect = windowRef.current?.getBoundingClientRect();
          if (rect) {
              let newWidth = e.clientX - rect.left;
              let newHeight = e.clientY - rect.top;

              newWidth = Math.max(newWidth, MIN_WIDTH);
              newHeight = Math.max(newHeight, MIN_HEIGHT);

              newWidth = Math.min(newWidth, window.innerWidth - rect.left);
              newHeight = Math.min(newHeight, window.innerHeight - rect.top);

              updateWindowState(window.id, { width: newWidth, height: newHeight });
          }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    // Only add listeners if we are currently dragging or resizing
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp, { once: true }); // Automatically remove after one fire
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, window.id, window.width, updateWindowState]);


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
