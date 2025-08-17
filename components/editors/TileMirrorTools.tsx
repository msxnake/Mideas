import React from 'react';
import { Button } from '../common/Button';
import { PixelData } from '../../types';

interface TileMirrorToolsProps {
  currentTileData: PixelData;
  onUpdateTileData: (data: PixelData) => void;
}

const TileMirrorTools: React.FC<TileMirrorToolsProps> = ({ currentTileData, onUpdateTileData }) => {

  const handleMirrorH = () => {
    // Deep copy to avoid mutating the original data
    const newData = JSON.parse(JSON.stringify(currentTileData));
    // Reverse each row
    newData.forEach((row: string[]) => row.reverse());
    onUpdateTileData(newData);
  };

  const handleMirrorV = () => {
    // Deep copy and reverse the array of rows
    const newData = JSON.parse(JSON.stringify(currentTileData)).reverse();
    onUpdateTileData(newData);
  };

  return (
    <>
      <Button onClick={handleMirrorH} size="sm" variant="secondary" id="mirror-h-button">
        Mirror H
      </Button>
      <Button onClick={handleMirrorV} size="sm" variant="secondary" id="mirror-v-button">
        Mirror V
      </Button>
    </>
  );
};

export default TileMirrorTools;
