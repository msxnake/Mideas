import React, { useEffect, useRef } from 'react';
import { ContextMenuItem } from '../../types';

/**
 * Props for the ContextMenu component.
 */
interface ContextMenuProps {
  /** Whether the context menu is currently open. */
  isOpen: boolean;
  /** The position (x, y) where the menu should appear. */
  position: { x: number; y: number };
  /** An array of items to display in the menu. */
  items: ContextMenuItem[];
  /** Callback function to close the menu. */
  onClose: () => void;
}

/**
 * A generic context menu component that appears at a specified position.
 * It closes automatically when clicking outside of it.
 */
export const ContextMenu: React.FC<ContextMenuProps> = ({ isOpen, position, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  useEffect(() => {
      if (isOpen && menuRef.current) {
          const menuWidth = menuRef.current.offsetWidth;
          const menuHeight = menuRef.current.offsetHeight;
          const { innerWidth, innerHeight } = window;
          
          let x = position.x;
          let y = position.y;
          
          if (x + menuWidth > innerWidth) {
              x = innerWidth - menuWidth - 5;
          }
          if (y + menuHeight > innerHeight) {
              y = innerHeight - menuHeight - 5;
          }
          menuRef.current.style.left = `${x}px`;
          menuRef.current.style.top = `${y}px`;
      }
  }, [isOpen, position]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-msx-panelbg border border-msx-border rounded-md shadow-lg py-1 animate-fadeIn"
      style={{ top: position.y, left: position.x }}
      role="menu"
    >
      {items.map((item, index) => {
        if ('label' in item) {
          return (
            <button
              key={item.label}
              onClick={() => {
                item.onClick();
                onClose();
              }}
              disabled={item.disabled}
              className="w-full text-left px-3 py-1.5 text-xs text-msx-textsecondary hover:bg-msx-accent hover:text-white flex items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-msx-textsecondary"
              role="menuitem"
            >
              {item.icon && <span className="mr-2 w-4 h-4">{item.icon}</span>}
              {item.label}
            </button>
          );
        } else {
          return <div key={`sep-${index}`} className="my-1 border-t border-msx-border opacity-50" />;
        }
      })}
    </div>
  );
};