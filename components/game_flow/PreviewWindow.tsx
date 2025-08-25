import React from 'react';
import { GameFlowNode, ProjectAsset } from '../../types';
import SubmenuPreview from './SubmenuPreview';
import ScreenPreview from './ScreenPreview';

interface PreviewWindowProps {
  node: GameFlowNode | null;
  selectedOptionIndex: number;
  allAssets: ProjectAsset[];
}

const PreviewWindow: React.FC<PreviewWindowProps> = ({ node, selectedOptionIndex, allAssets }) => {
  if (!node) {
    return <div className="p-4">Select a node to see a preview.</div>;
  }

  switch (node.type) {
    case 'SubMenu':
      return <SubmenuPreview menuData={node} selectedIndex={selectedOptionIndex} />;
    case 'WorldLink':
      return <ScreenPreview screenData={node} allAssets={allAssets} />;
    case 'Start':
        return <div className="p-4">This is the start of the game.</div>;
    case 'End':
        return <div className="p-4">This is an end point of the game.</div>;
    default:
      return <div className="p-4">Unsupported node type for preview.</div>;
  }
};

export default PreviewWindow;
