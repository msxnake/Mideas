import React from 'react';
import { GameFlowWorldLinkNode, ProjectAsset } from '../../types';

interface ScreenPreviewProps {
  screenData: GameFlowWorldLinkNode;
  allAssets: ProjectAsset[];
}

const ScreenPreview: React.FC<ScreenPreviewProps> = ({ screenData, allAssets }) => {
  const asset = allAssets.find(a => a.id === screenData.worldAssetId);

  return (
    <div className="screen-preview p-4">
      <h3 className="text-lg font-bold mb-2">Screen Preview</h3>
      <p>Asset: {asset ? asset.name : 'Unknown'}</p>
      <p className="text-sm text-gray-400 mt-4">(Cannot go back from here)</p>
    </div>
  );
};

export default ScreenPreview;
