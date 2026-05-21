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
    assetType: 'screenmap' | 'sprite' | 'font';
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

  const openAssetPicker = (assetType: 'screenmap' | 'sprite' | 'font', onSelect: (assetId: string) => void) => {
    setAssetPickerState({ isOpen: true, assetType, onSelect });
  };

  const bgAsset = allAssets.find(a => a.id === appearance.backgroundScreenAssetId);
  const cursorAsset = allAssets.find(a => a.id === appearance.cursorSpriteAssetId);
  const fontAsset = allAssets.find(a => a.id === (appearance as any).fontAssetId);
  const selectorType = (appearance as any).selectorType || (appearance as any).cursorType || (appearance as any).cursorMode || 'auto';

  return (
    <div className="space-y-3 p-4">
      <Panel title="Visuals">
        <div className="mb-3">
          <label className="block text-msx-textprimary text-sm mb-1">Background Screen</label>
          <div className="flex items-center space-x-2">
            <Button onClick={() => openAssetPicker('screenmap', (id) => handleConfigChange('backgroundScreenAssetId', id))} variant="secondary" size="sm">
              Select
            </Button>
            {appearance.backgroundScreenAssetId && (
              <Button onClick={() => handleConfigChange('backgroundScreenAssetId', undefined)} variant="ghost" size="sm">
                Clear
              </Button>
            )}
            <span className="text-msx-textsecondary truncate">
              {bgAsset ? `${bgAsset.name}` : 'None'}
            </span>
          </div>
        </div>

        <div className="mb-3">
          <label className="block text-msx-textprimary text-sm mb-1">Selector Type</label>
          <select
            value={selectorType}
            onChange={(e) => {
              const value = e.target.value;
              onAppearanceChange({
                ...(appearance as any),
                selectorType: value === 'auto' ? undefined : value,
              });
            }}
            className="w-full max-w-xs px-2 py-1 rounded bg-msx-bgcolor border border-msx-border text-msx-textprimary"
          >
            <option value="auto">Auto (MSX1 sprite if selected, else char)</option>
            <option value="char">Char ('&gt;')</option>
            <option value="sprite">MSX1 Sprite</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="block text-msx-textprimary text-sm mb-1">MSX1 Cursor Sprite</label>
          <div className="flex items-center space-x-2">
            <Button onClick={() => openAssetPicker('sprite', (id) => handleConfigChange('cursorSpriteAssetId', id))} variant="secondary" size="sm">
              Select
            </Button>
            {appearance.cursorSpriteAssetId && (
              <Button onClick={() => handleConfigChange('cursorSpriteAssetId', undefined)} variant="ghost" size="sm">
                Clear
              </Button>
            )}
            <span className="text-msx-textsecondary truncate">
              {cursorAsset ? `${cursorAsset.name}` : 'None'}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-msx-textprimary text-sm mb-1">MSX1 Font</label>
          <div className="flex items-center space-x-2">
            <Button onClick={() => openAssetPicker('font', (id) => handleConfigChange('fontAssetId' as any, id))} variant="secondary" size="sm">
              MSX1 Select Font
            </Button>
            {(appearance as any).fontAssetId && (
              <Button onClick={() => handleConfigChange('fontAssetId' as any, undefined)} variant="ghost" size="sm">
                Clear
              </Button>
            )}
            <span className="text-msx-textsecondary truncate">
              {fontAsset ? `${fontAsset.name}` : 'Default'}
            </span>
          </div>
        </div>
      </Panel>
      <Panel title="Colors">
        <InlineColorPicker label="Background" color={appearance.colors.background} onChange={color => handleColorChange('background', color)} />
        <InlineColorPicker label="Border" color={appearance.colors.border || 'transparent'} onChange={color => handleColorChange('border', color)} />
      </Panel>

      {assetPickerState?.isOpen && (
        <AssetPickerModal
          isOpen={assetPickerState.isOpen}
          onClose={() => setAssetPickerState(null)}
          onSelectAsset={assetPickerState.onSelect}
          assetTypeToPick={assetPickerState.assetType}
          allAssets={allAssets}
          currentSelectedId={
            assetPickerState.assetType === 'screenmap' ? appearance.backgroundScreenAssetId || null :
            assetPickerState.assetType === 'sprite' ? appearance.cursorSpriteAssetId || null :
            (appearance as any).fontAssetId || null
          }
        />
      )}
    </div>
  );
};
