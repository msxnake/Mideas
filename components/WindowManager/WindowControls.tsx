import React from 'react';
import { useWindowManager } from '@/hooks/useWindowManager';

interface WindowControlsProps {
  isMaximized: boolean;
  onClose: () => void;
  onMaximize: () => void;
  onRestore: () => void;
  onStateSave: () => void;
  onStateRestore: () => void;
}

export const WindowControls: React.FC<WindowControlsProps> = ({
  isMaximized,
  onClose,
  onMaximize,
  onRestore,
  onStateSave,
  onStateRestore,
}) => {
  const { interactionState, stopInteraction } = useWindowManager();

  // A generic handler to wrap all control actions
  const createControlHandler = (action: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();

    // If we are in the middle of a drag/resize, a click on a button should stop that interaction.
    if (interactionState.mode !== 'idle') {
      stopInteraction();
    }

    // Then, perform the button's specific action.
    action();
  };

  const buttonStyle = "px-2 py-0.5 text-xs bg-msx-border hover:bg-msx-highlight rounded";

  return (
    <div className="flex items-center space-x-1">
      <button onMouseDown={createControlHandler(onStateSave)} className={buttonStyle} title="Save Layout">S</button>
      <button onMouseDown={createControlHandler(onStateRestore)} className={buttonStyle} title="Restore Layout">R</button>
      {isMaximized ? (
        <button onMouseDown={createControlHandler(onRestore)} className={buttonStyle} title="Restore">r</button>
      ) : (
        <button onMouseDown={createControlHandler(onMaximize)} className={buttonStyle} title="Maximize">M</button>
      )}
      <button onMouseDown={createControlHandler(onClose)} className={buttonStyle + " bg-msx-danger"} title="Close">X</button>
    </div>
  );
};
