
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../common/Button';
import { ProjectAsset } from '../../types';

interface RenameModalProps {
  isOpen: boolean;
  assetId: string;
  currentName: string;
  assetType: ProjectAsset['type'];
  onConfirm: (newName: string) => void;
  onClose: () => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({ 
  isOpen, 
  assetId, 
  currentName, 
  assetType, 
  onConfirm, 
  onClose 
}) => {
  const [newName, setNewName] = useState(currentName);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setNewName(currentName); // Reset to current name when modal opens
      setErrorMessage(null);
      // Focus the input field when the modal opens
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100); // Small delay to ensure modal is rendered
    }
  }, [isOpen, currentName]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = () => {
    const trimmedName = newName.trim();
    if (trimmedName === "") {
      setErrorMessage("Asset name cannot be empty.");
      return;
    }
    // Basic validation for asset name (e.g., avoid special chars if needed for filenames)
    // For now, just ensure it's not empty.
    onConfirm(trimmedName);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewName(e.target.value);
    if (errorMessage) {
      setErrorMessage(null); // Clear error message on input change
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4" 
        onClick={onClose} // Close on backdrop click
        role="dialog"
        aria-modal="true"
        aria-labelledby="renameModalTitle"
    >
      <div 
        className="bg-msx-panelbg p-6 rounded-lg shadow-xl w-full max-w-md animate-slideIn pixel-font"
        onClick={e => e.stopPropagation()} // Prevent closing on modal content click
      >
        <h2 id="renameModalTitle" className="text-lg text-msx-highlight mb-4">
          Rename {assetType.charAt(0).toUpperCase() + assetType.slice(1)}
        </h2>
        
        <div className="mb-4">
          <label htmlFor="assetNewName" className="block text-xs text-msx-textsecondary mb-1">
            Enter new name for "{currentName}":
          </label>
          <input
            ref={inputRef}
            type="text"
            id="assetNewName"
            value={newName}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className={`w-full p-2 text-sm bg-msx-bgcolor border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent
                        ${errorMessage ? 'border-msx-danger' : 'border-msx-border'}`}
          />
          {errorMessage && (
            <p className="text-xs text-msx-danger mt-1">{errorMessage}</p>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button onClick={onClose} variant="ghost" size="md">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="primary" size="md">
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};
