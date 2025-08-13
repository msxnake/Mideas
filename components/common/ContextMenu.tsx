import React, { useEffect, useRef } from 'react';
import { ContextMenuItem } from '../../types';

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  items: ContextMenuItem[];
  onClose: () => void;
}

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