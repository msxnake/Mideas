import React from 'react';

interface WindowControlsProps {
  windowId: string;
  isMaximized: boolean;
  onClose: () => void;
  onMaximize: () => void;
  onRestore: () => void;
  onMinimize: () => void;
  onStateRestored: (state: { x: number; y: number; width: number; height: number }) => void;
  // We need the current window geometry to save it
  currentGeometry: { x: number; y: number; width: number; height: number };
}

const STORAGE_KEY_PREFIX = 'mideas_window_state_';

export const WindowControls: React.FC<WindowControlsProps> = ({
  windowId,
  isMaximized,
  onClose,
  onMaximize,
  onRestore,
  onMinimize,
  onStateRestored,
  currentGeometry,
}) => {
  const handleSaveState = () => {
    try {
      const stateToSave = JSON.stringify(currentGeometry);
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${windowId}`, stateToSave);
      // Optional: Add a visual confirmation
      console.log(`State for window ${windowId} saved.`);
    } catch (error) {
      console.error("Failed to save window state:", error);
    }
  };

  const handleRestoreState = () => {
    try {
      const savedStateJSON = localStorage.getItem(`${STORAGE_KEY_PREFIX}${windowId}`);
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        onStateRestored(savedState);
      } else {
        console.log(`No saved state found for window ${windowId}.`);
      }
    } catch (error) {
      console.error("Failed to restore window state:", error);
    }
  };

  const buttonStyle = "px-2 py-0.5 text-xs bg-msx-border hover:bg-msx-highlight rounded";

  return (
    <div className="flex items-center space-x-1">
      <button onClick={handleSaveState} className={buttonStyle} title="Save Layout">S</button>
      <button onClick={handleRestoreState} className={buttonStyle} title="Restore Layout">R</button>
      <button onClick={onMinimize} className={buttonStyle} title="Minimize">_</button>
      {isMaximized ? (
        <button onClick={onRestore} className={buttonStyle} title="Restore">r</button>
      ) : (
        <button onClick={onMaximize} className={buttonStyle} title="Maximize">M</button>
      )}
      <button onClick={onClose} className={buttonStyle + " bg-msx-danger"} title="Close">X</button>
    </div>
  );
};
