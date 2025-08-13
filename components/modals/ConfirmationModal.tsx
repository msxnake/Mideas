import React, { useEffect, useRef } from 'react';
import { Button } from '../common/Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string | React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmButtonVariant?: 'primary' | 'danger' | 'secondary' | 'ghost';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmButtonVariant = 'danger',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      confirmButtonRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4"
      onClick={onCancel} // Close on backdrop click
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmationModalTitle"
      aria-describedby="confirmationModalMessage"
    >
      <div
        ref={modalRef}
        className="bg-msx-panelbg p-6 rounded-lg shadow-xl w-full max-w-md animate-slideIn pixel-font"
        onClick={(e) => e.stopPropagation()} // Prevent closing on modal content click
      >
        <h2 id="confirmationModalTitle" className="text-lg text-msx-highlight mb-4">
          {title}
        </h2>
        <div id="confirmationModalMessage" className="text-sm text-msx-textprimary mb-6">
          {typeof message === 'string' ? <p>{message}</p> : message}
        </div>
        <div className="flex justify-end space-x-3">
          <Button onClick={onCancel} variant="ghost" size="md">
            {cancelText}
          </Button>
          <Button ref={confirmButtonRef} onClick={onConfirm} variant={confirmButtonVariant} size="md">
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
