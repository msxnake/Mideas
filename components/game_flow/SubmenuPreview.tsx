import React from 'react';
import { GameFlowSubMenuNode } from '../../types';

interface SubmenuPreviewProps {
  menuData: GameFlowSubMenuNode;
  selectedIndex: number;
}

const SubmenuPreview: React.FC<SubmenuPreviewProps> = ({ menuData, selectedIndex }) => (
  <div className="submenu-preview p-4">
    <h2 className="text-lg font-bold mb-2">{menuData.title}</h2>
    <ul className="list-disc pl-5">
      {menuData.options.map((option, index) => (
        <li key={option.id} className={index === selectedIndex ? 'text-yellow-400' : ''}>
          {option.text}
        </li>
      ))}
    </ul>
  </div>
);

export default SubmenuPreview;
