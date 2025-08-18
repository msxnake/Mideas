import React from 'react';

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

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const handleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMaximize();
  };

  const handleRestore = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRestore();
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStateSave();
  };

  const handleLoad = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStateRestore();
  };

  const buttonStyle = "px-2 py-0.5 text-xs bg-msx-border hover:bg-msx-highlight rounded";

  return (
    <div className="flex items-center space-x-1">
      <button onClick={handleSave} className={buttonStyle} title="Save Layout">S</button>
      <button onClick={handleLoad} className={buttonStyle} title="Restore Layout">R</button>
      {isMaximized ? (
        <button onClick={handleRestore} className={buttonStyle} title="Restore">r</button>
      ) : (
        <button onClick={handleMaximize} className={buttonStyle} title="Maximize">M</button>
      )}
      <button onClick={handleClose} className={buttonStyle + " bg-msx-danger"} title="Close">X</button>
    </div>
  );
};
