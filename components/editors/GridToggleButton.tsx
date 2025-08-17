import React from 'react';
import { Button } from '../common/Button';
import { GridIcon } from '../icons/MsxIcons';

interface GridToggleButtonProps {
  isGridVisible: boolean;
  onToggle: () => void;
}

export const GridToggleButton: React.FC<GridToggleButtonProps> = ({ isGridVisible, onToggle }) => {
  return (
    <Button
      onClick={onToggle}
      size="sm"
      variant={isGridVisible ? 'secondary' : 'ghost'}
      title={isGridVisible ? 'Hide Grid' : 'Show Grid'}
      icon={<GridIcon className="w-4 h-4" />}
    >
      Grid
    </Button>
  );
};
