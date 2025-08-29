import React from 'react';
import { GameFlowSubMenuNode, ProjectAsset } from '../../types';
import { Button } from '../common/Button';

interface SubMenuAppearanceEditorProps {
  node: GameFlowSubMenuNode;
  onUpdate: (data: Partial<GameFlowSubMenuNode>) => void;
  allAssets: ProjectAsset[];
  openAssetPicker: (assetType: 'screenmap' | 'sprite', onSelect: (assetId: string) => void) => void;
}

export const SubMenuAppearanceEditor: React.FC<SubMenuAppearanceEditorProps> = ({ node, onUpdate, allAssets, openAssetPicker }) => {
  const appearance = node.appearance || {
    colors: {
      text: '#FFFFFF',
      background: '#5455ED',
      highlightText: '#E6CE60',
      highlightBackground: '#7D78FC',
      border: '#FFFFFF',
    },
  };

  const handleColorChange = (field: keyof typeof appearance.colors, value: string) => {
    const newAppearance = {
      ...appearance,
      colors: {
        ...appearance.colors,
        [field]: value,
      },
    };
    onUpdate({ appearance: newAppearance });
  };

  const handleAssetSelect = (field: 'backgroundScreenAssetId' | 'cursorSpriteAssetId', assetId: string) => {
    const newAppearance = {
      ...appearance,
      [field]: assetId,
    };
    onUpdate({ appearance: newAppearance });
  };

  const backgroundScreenName = allAssets.find(a => a.id === appearance.backgroundScreenAssetId)?.name || 'None';
  const cursorSpriteName = allAssets.find(a => a.id === appearance.cursorSpriteAssetId)?.name || 'None';

  return (
    <div className="space-y-4 p-2 border-t border-msx-border">
      <h3 className="text-sm font-bold text-msx-highlight">Appearance</h3>
      
      {/* Visuals Section */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-msx-textsecondary">Visuals</h4>
        <div>
          <label className="block text-xs text-msx-textsecondary mb-1">Select Background Screen</label>
          <Button onClick={() => openAssetPicker('screenmap', (assetId) => handleAssetSelect('backgroundScreenAssetId', assetId))}>
            {backgroundScreenName}
          </Button>
        </div>
        <div>
          <label className="block text-xs text-msx-textsecondary mb-1">Select Cursor Sprite</label>
          <Button onClick={() => openAssetPicker('sprite', (assetId) => handleAssetSelect('cursorSpriteAssetId', assetId))}>
            {cursorSpriteName}
          </Button>
        </div>
      </div>

      {/* Colors Section */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-msx-textsecondary">Colors</h4>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(appearance.colors).map(([key, value]) => (
            <div key={key}>
              <label className="block text-xs text-msx-textsecondary mb-1">{key.charAt(0).toUpperCase() + key.slice(1)}</label>
              <input
                type="color"
                value={value}
                onChange={(e) => handleColorChange(key as keyof typeof appearance.colors, e.target.value)}
                className="w-full h-8 p-0 border-none rounded cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
