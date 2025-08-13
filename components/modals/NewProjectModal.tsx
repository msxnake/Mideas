
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../common/Button';

interface NewProjectModalProps {
  isOpen: boolean;
  onConfirm: (projectName: string) => void;
  onClose: () => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onConfirm, onClose }) => {
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setProjectName('MyMSXGame'); // Default project name
      setError('');
      // Focus input when modal opens
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const trimmedName = projectName.trim();
    if (!trimmedName) {
      setError('Project name cannot be empty.');
      return;
    }
    // Basic validation for project name characters (avoiding common problematic ones for filenames)
    if (/[<>:"/\\|?*\x00-\x1F]/.test(trimmedName)) {
        setError("Project name contains invalid characters (e.g., < > : \" / \\ | ? *).");
        return;
    }
    if (trimmedName.length > 50) {
        setError("Project name is too long (max 50 characters).");
        return;
    }
    onConfirm(trimmedName);
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
        aria-labelledby="newProjectModalTitle"
    >
      <div 
        className="bg-msx-panelbg p-6 rounded-lg shadow-xl w-full max-w-md animate-slideIn pixel-font"
        onClick={e => e.stopPropagation()} // Prevent closing on modal content click
      >
        <h2 id="newProjectModalTitle" className="text-lg text-msx-highlight mb-4">
          Create New MSX Project
        </h2>
        
        <div className="mb-4">
          <label htmlFor="projectNameInput" className="block text-xs text-msx-textsecondary mb-1">
            Project Name:
          </label>
          <input
            ref={inputRef}
            type="text"
            id="projectNameInput"
            value={projectName}
            onChange={(e) => { setProjectName(e.target.value); if (error) setError(''); }}
            onKeyDown={handleKeyDown}
            className={`w-full p-2 text-sm bg-msx-bgcolor border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent
                        ${error ? 'border-msx-danger' : 'border-msx-border'}`}
            maxLength={50}
          />
          {error && (
            <p className="text-xs text-msx-danger mt-1">{error}</p>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button onClick={onClose} variant="ghost" size="md">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="primary" size="md">
            Create Project
          </Button>
        </div>
      </div>
    </div>
  );
};
