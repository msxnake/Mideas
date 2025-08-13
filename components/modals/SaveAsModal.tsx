
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../common/Button';

interface SaveAsModalProps {
  isOpen: boolean;
  currentName: string; // Default/current project name suggestion
  onConfirm: (newFilename: string) => void;
  onClose: () => void;
}

export const SaveAsModal: React.FC<SaveAsModalProps> = ({
  isOpen,
  currentName,
  onConfirm,
  onClose,
}) => {
  const [filename, setFilename] = useState(currentName);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      let suggestedName = currentName || "MyMSXProject";
      
      // Ensure the suggested filename ends with .json
      suggestedName = suggestedName.toLowerCase().endsWith('.json') 
        ? suggestedName 
        : `${suggestedName.replace(/\.[^/.]+$/, "")}.json`; 

      setFilename(suggestedName);
      setErrorMessage(null);
      setTimeout(() => {
        inputRef.current?.focus();
        const dotIndex = suggestedName.lastIndexOf('.json');
        if (dotIndex > 0 && inputRef.current) {
          // Select only the base name part for easy replacement
          inputRef.current.setSelectionRange(0, dotIndex);
        } else if (inputRef.current) {
          inputRef.current.select(); // Select all if .json not found or at start
        }
      }, 100);
    }
  }, [isOpen, currentName]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const trimmedFilename = filename.trim();
    if (trimmedFilename === "") {
      setErrorMessage("Filename cannot be empty.");
      return;
    }
    if (!trimmedFilename.toLowerCase().endsWith('.json')) {
        setErrorMessage("Filename must end with .json");
        return;
    }
    // Basic validation for filename characters (avoiding common problematic ones for filenames)
    if (/[<>:"/\\|?*\x00-\x1F]/.test(trimmedFilename)) {
        setErrorMessage("Filename contains invalid characters.");
        return;
    }
    onConfirm(trimmedFilename);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilename(e.target.value);
    if (errorMessage) setErrorMessage(null);
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
      aria-labelledby="saveAsModalTitle"
    >
      <div
        className="bg-msx-panelbg p-6 rounded-lg shadow-xl w-full max-w-md animate-slideIn pixel-font"
        onClick={e => e.stopPropagation()} // Prevent closing on modal content click
      >
        <h2 id="saveAsModalTitle" className="text-lg text-msx-highlight mb-4">
          Save Project As...
        </h2>
        <div className="mb-4">
          <label htmlFor="projectFilename" className="block text-xs text-msx-textsecondary mb-1">
            Enter filename:
          </label>
          <input
            ref={inputRef}
            type="text"
            id="projectFilename"
            value={filename}
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
          <Button onClick={onClose} variant="ghost" size="md">Cancel</Button>
          <Button onClick={handleSubmit} variant="primary" size="md">Save</Button>
        </div>
      </div>
    </div>
  );
};
