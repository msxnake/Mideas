import React, { useState } from 'react';
import { MainMenuAppearance, ProjectAsset } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { AssetPickerModal } from '../modals/AssetPickerModal';
import { InlineColorPicker } from '../common/InlineColorPicker';

interface SubMenuAppearanceEditorProps {
  appearance: MainMenuAppearance;
  onAppearanceChange: (newAppearance: MainMenuAppearance) => void;
  allAssets: ProjectAsset[];
}

export const SubMenuAppearanceEditor: React.FC<SubMenuAppearanceEditorProps> = ({
  appearance,
  onAppearanceChange,
  allAssets,
}) => {
  const [assetPickerState, setAssetPickerState] = useState<{
    isOpen: boolean;
    assetType: 'screenmap' | 'sprite';
    onSelect: (assetId: string) => void;
  } | null>(null);

  const handleConfigChange = (field: keyof MainMenuAppearance, value: any) => {
    onAppearanceChange({ ...appearance, [field]: value });
  };

  const handleColorChange = (field: keyof MainMenuAppearance['colors'], value: any) => {
    onAppearanceChange({
      ...appearance,
      colors: {
        ...appearance.colors,
        [field]: value,
      },
    });
  };

  const openAssetPicker = (assetType: 'screenmap' | 'sprite', onSelect: (assetId: string) => void) => {
    setAssetPickerState({ isOpen: true, assetType, onSelect });
  };

  const bgAsset = allAssets.find(a => a.id === appearance.backgroundScreenAssetId);
  const cursorAsset = allAssets.find(a => a.id === appearance.cursorSpriteAssetId);

  return (
    <div className="space-y-3 p-4">
      <Panel title="Visuals">
        <div className="flex items-center space-x-2">
          <Button onClick={() => openAssetPicker('screenmap', (id) => handleConfigChange('backgroundScreenAssetId', id))} variant="secondary" size="sm">
            Select Background Screen
          </Button>
          <span className="text-msx-textsecondary truncate">
            Selected: {bgAsset ? `${bgAsset.name}` : 'None'}
          </span>
        </div>
        <div className="flex items-center space-x-2 mt-2">
          <Button onClick={() => openAssetPicker('sprite', (id) => handleConfigChange('cursorSpriteAssetId', id))} variant="secondary" size="sm">
            Select Cursor Sprite
          </Button>
          <span className="text-msx-textsecondary truncate">
            Selected: {cursorAsset ? `${cursorAsset.name}` : 'None'}
          </span>
        </div>
      </Panel>
      <Panel title="Colors">
        <InlineColorPicker label="Text" color={appearance.colors.text} onChange={color => handleColorChange('text', color)} />
        <InlineColorPicker label="Background" color={appearance.colors.background} onChange={color => handleColorChange('background', color)} />
        <InlineColorPicker label="Highlight Text" color={appearance.colors.highlightText} onChange={color => handleColorChange('highlightText', color)} />
        <InlineColorPicker label="Highlight BG" color={appearance.colors.highlightBackground} onChange={color => handleColorChange('highlightBackground', color)} />
        <InlineColorPicker label="Border" color={appearance.colors.border || 'transparent'} onChange={color => handleColorChange('border', color)} />
      </Panel>

      {assetPickerState?.isOpen && (
        <AssetPickerModal
          isOpen={assetPickerState.isOpen}
          onClose={() => setAssetPickerState(null)}
          onSelectAsset={assetPickerState.onSelect}
          assetTypeToPick={assetPickerState.assetType}
          allAssets={allAssets}
          currentSelectedId={appearance.backgroundScreenAssetId || appearance.cursorSpriteAssetId || null}
        />
      )}
    </div>
  );
};