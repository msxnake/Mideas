import React, { useState } from 'react';
import { GameFlowTextNode, ProjectAsset } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { AssetPickerModal, AssetPickerType } from '../modals/AssetPickerModal';
import { InlineColorPicker } from '../common/InlineColorPicker';

interface TextNodeEditorProps {
  node: GameFlowTextNode;
  onNodeChange: (newNode: GameFlowTextNode) => void;
  allAssets: ProjectAsset[];
}

export const TextNodeEditor: React.FC<TextNodeEditorProps> = ({
  node,
  onNodeChange,
  allAssets,
}) => {
  const [assetPickerState, setAssetPickerState] = useState<{
    isOpen: boolean;
    assetType: AssetPickerType;
    onSelect: (assetId: string) => void;
  } | null>(null);

  const handleFieldChange = (field: keyof GameFlowTextNode, value: any) => {
    onNodeChange({ ...node, [field]: value });
  };

  const handleColorChange = (field: 'background' | 'border', value: string) => {
    onNodeChange({
      ...node,
      appearance: {
        ...node.appearance,
        colors: {
          ...node.appearance?.colors,
          background: node.appearance?.colors?.background || '#000000',
          border: node.appearance?.colors?.border || '#FFFFFF',
          [field]: value,
        },
      },
    });
  };

  const handleBackgroundAssetChange = (assetId: string | null) => {
    onNodeChange({
      ...node,
      appearance: {
        ...node.appearance,
        colors: node.appearance?.colors || {
          background: '#000000',
          border: '#FFFFFF',
        },
        backgroundScreenAssetId: assetId || undefined,
      },
    });
  };

  const handleFontAssetChange = (assetId: string | null) => {
    onNodeChange({
      ...node,
      appearance: {
        ...node.appearance,
        colors: node.appearance?.colors || {
          background: '#000000',
          border: '#FFFFFF',
        },
        fontAssetId: assetId || undefined,
      },
    });
  };

  const openAssetPicker = (assetType: AssetPickerType, onSelect: (assetId: string) => void) => {
    setAssetPickerState({ isOpen: true, assetType, onSelect });
  };

  const bgAsset = allAssets.find(a => a.id === node.appearance?.backgroundScreenAssetId);
  const fontAsset = allAssets.find(a => a.id === node.appearance?.fontAssetId);

  return (
    <div className="space-y-3 p-4">
      <Panel title="Content">
        <div className="mb-2">
          <label className="block text-msx-textprimary text-sm mb-1">Title</label>
          <input
            type="text"
            value={node.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            className="w-full bg-msx-bgcolor border border-msx-border text-msx-textprimary rounded px-2 py-1 focus:outline-none focus:border-msx-primary"
          />
        </div>
        <div className="mb-2">
          <label className="block text-msx-textprimary text-sm mb-1">Message</label>
          <textarea
            value={node.message}
            onChange={(e) => {
              const val = e.target.value.replace(/\\n/g, '\n');
              handleFieldChange('message', val);
            }}
            rows={4}
            className="w-full bg-msx-bgcolor border border-msx-border text-msx-textprimary rounded px-2 py-1 focus:outline-none focus:border-msx-primary resize-none"
          />
          <p className="text-msx-textsecondary text-xs mt-1">Use \n or Enter for line breaks</p>
        </div>
      </Panel>

      <Panel title="Visuals">
        <div className="mb-3">
          <label className="block text-msx-textprimary text-sm mb-1">Background Screen</label>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => openAssetPicker('screenBackground', (id) => handleBackgroundAssetChange(id))}
              variant="secondary"
              size="sm"
            >
              Select
            </Button>
            {node.appearance?.backgroundScreenAssetId && (
              <Button
                onClick={() => handleBackgroundAssetChange(null)}
                variant="ghost"
                size="sm"
              >
                Clear
              </Button>
            )}
            <span className="text-msx-textsecondary truncate">
              {bgAsset ? `${bgAsset.name}` : 'None'}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-msx-textprimary text-sm mb-1">Font</label>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => openAssetPicker('font', (id) => handleFontAssetChange(id))}
              variant="secondary"
              size="sm"
            >
              Select Font
            </Button>
            {node.appearance?.fontAssetId && (
              <Button
                onClick={() => handleFontAssetChange(null)}
                variant="ghost"
                size="sm"
              >
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
        <InlineColorPicker
          label="Background"
          color={node.appearance?.colors?.background || '#000000'}
          onChange={color => handleColorChange('background', color)}
        />
        <InlineColorPicker
          label="Border"
          color={node.appearance?.colors?.border || '#FFFFFF'}
          onChange={color => handleColorChange('border', color)}
        />
      </Panel>

      {assetPickerState?.isOpen && (
        <AssetPickerModal
          isOpen={assetPickerState.isOpen}
          onClose={() => setAssetPickerState(null)}
          onSelectAsset={assetPickerState.onSelect}
          assetTypeToPick={assetPickerState.assetType}
          allAssets={allAssets}
          currentSelectedId={
            assetPickerState.assetType === 'screenBackground'
              ? node.appearance?.backgroundScreenAssetId || null
              : node.appearance?.fontAssetId || null
          }
        />
      )}
    </div>
  );
};
