
import React from 'react';
import { Button } from '../common/Button';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="aboutModalTitle"
    >
      <div
        className="bg-msx-panelbg p-6 rounded-lg shadow-xl w-full max-w-md animate-slideIn pixel-font text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="aboutModalTitle" className="text-xl text-msx-highlight mb-4">
          MSX Retro Game IDE
        </h2>
        <div className="space-y-2 text-sm text-msx-textprimary mb-6 font-sans">
            <p>A specialized Integrated Development Environment for MSX (MSX1/MSX2) game development.</p>
            <p>Version: 1.0.0 (Conceptual Mockup)</p>
            <p>This tool showcases key UI/UX elements for retro game creation.</p>
        </div>
        <div className="flex justify-center">
            <Button onClick={onClose} variant="primary" size="md">
                Close
            </Button>
        </div>
      </div>
    </div>
  );
};
