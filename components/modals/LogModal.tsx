
import React from 'react';
import { Button } from '../common/Button';

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: string[];
}

export const LogModal: React.FC<LogModalProps> = ({ isOpen, onClose, logs }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logModalTitle"
    >
      <div
        className="bg-msx-panelbg p-6 rounded-lg shadow-xl w-full max-w-xl flex flex-col max-h-[80vh] animate-slideIn pixel-font"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="logModalTitle" className="text-lg text-msx-highlight mb-4 text-center">
          Sample Song Load Log
        </h2>
        <div className="flex-grow bg-msx-bgcolor p-3 border border-msx-border rounded overflow-y-auto text-xs text-msx-textprimary space-y-1">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
          {logs.length === 0 && <p className="text-msx-textsecondary italic">No log messages yet.</p>}
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} variant="primary" size="md">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
