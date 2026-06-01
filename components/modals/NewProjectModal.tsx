
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../common/Button';

/**
 * Props for the {@link NewProjectModal} component.
 * @category Modal
 */
interface NewProjectModalProps {
  /** Whether the modal is currently open. */
  isOpen: boolean;
  /** Callback function when the user confirms the new project name and mode. */
  onConfirm: (projectName: string, screenMode: string) => void;
  /** MSX2 projects continue to the central game-type picker before creation. */
  onRequestMsx2GameProfile?: (projectName: string, screenMode: string) => void;
  /** Callback function to close the modal. */
  onClose: () => void;
}

/**
 * A modal dialog for creating a new project.
 * It prompts the user to enter a name for the new project.
 *
 * @param props The component props.
 * @returns A React component.
 * @category Modal
 */
const SCREEN_MODE_OPTIONS = [
  {
    value: 'SCREEN 2 (Graphics I)',
    title: 'MSX1 SCREEN 2 (Graphics I)',
    description: 'Modo tileado (256×192, 4 colores) ideal para compatibilidad MSX-1 y VRAM mínima.',
  },
  {
    value: 'SCREEN 4 (Graphics II)',
    title: 'MSX2 SCREEN 4 (Graphics II)',
    description: 'Modo tileado/patrones (256x192, paleta MSX2 y sprites tipo 2) pensado para juegos Z80.',
  },
];

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onConfirm, onRequestMsx2GameProfile, onClose }) => {
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>(SCREEN_MODE_OPTIONS[0].value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setProjectName('MyMSXGame'); // Default project name
      setSelectedMode(SCREEN_MODE_OPTIONS[0].value);
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
    if (selectedMode === 'SCREEN 4 (Graphics II)' && onRequestMsx2GameProfile) {
      onRequestMsx2GameProfile(trimmedName, selectedMode);
      return;
    }
    onConfirm(trimmedName, selectedMode);
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

        <div className="mb-4">
          <label className="block text-xs text-msx-textsecondary mb-2">
            Target Screen Mode (cannot be changed later):
          </label>
          <div className="space-y-2">
            {SCREEN_MODE_OPTIONS.map(option => (
              <label
                key={option.value}
                className={`flex items-start space-x-2 p-2 border rounded cursor-pointer transition-colors ${
                  selectedMode === option.value ? 'border-msx-accent bg-msx-accent/10' : 'border-msx-border hover:border-msx-accent'
                }`}
              >
                <input
                  type="radio"
                  name="screenMode"
                  value={option.value}
                  checked={selectedMode === option.value}
                  onChange={() => setSelectedMode(option.value)}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm text-msx-textprimary font-semibold">{option.title}</p>
                  <p className="text-xs text-msx-textsecondary">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button onClick={onClose} variant="ghost" size="md">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="primary" size="md">
            {selectedMode === 'SCREEN 4 (Graphics II)' && onRequestMsx2GameProfile ? 'Continue' : 'Create Project'}
          </Button>
        </div>
      </div>
    </div>
  );
};
