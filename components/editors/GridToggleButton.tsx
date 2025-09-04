import React from 'react';
import { Button } from '../common/Button';
import { GridIcon } from '../icons/MsxIcons';

/**
 * Props for the GridToggleButton component.
 */
interface GridToggleButtonProps {
  /** Whether the grid is currently visible. */
  isGridVisible: boolean;
  /** Callback function to toggle the grid's visibility. */
  onToggle: () => void;
}

/**
 * A button component specifically for toggling the visibility of a grid in an editor.
 */
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
