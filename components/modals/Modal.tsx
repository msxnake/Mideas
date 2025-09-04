import React, { useRef } from 'react';

/**
 * Props for the {@link Modal} component.
 * @category Modal
 */
interface ModalProps {
  /** Whether the modal is currently open. */
  isOpen: boolean;
  /** Callback function to close the modal. */
  onClose: () => void;
  /** The title of the modal. */
  title: string;
  /** The content of the modal. */
  children: React.ReactNode;
}

/**
 * A generic modal component.
 *
 * @param props The component props.
 * @returns A React component.
 * @category Modal
 */
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4 outline-none"
      onClick={onClose}
      tabIndex={-1}
    >
      <div
        className="bg-msx-panelbg p-4 sm:p-6 rounded-lg shadow-xl animate-slideIn font-sans flex flex-col items-center"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-md sm:text-lg text-msx-highlight mb-3 sm:mb-4 pixel-font">{title}</h2>
        {children}
      </div>
    </div>
  );
};
