import React, { useState } from 'react';
import { GameFlowTextScroll2Node, GameFlowTextScrollColorNode, GameFlowTextScrollNode, ProjectAsset } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { AssetPickerModal } from '../modals/AssetPickerModal';
import { InlineColorPicker } from '../common/InlineColorPicker';

interface TextScrollNodeEditorProps {
  node: GameFlowTextScrollNode | GameFlowTextScrollColorNode | GameFlowTextScroll2Node;
  onNodeChange: (newNode: GameFlowTextScrollNode | GameFlowTextScrollColorNode | GameFlowTextScroll2Node) => void;
  allAssets: ProjectAsset[];
}

const clampSpeedFrames = (value: number): number => Math.max(1, Math.min(8, Math.trunc(value || 1)));

export const TextScrollNodeEditor: React.FC<TextScrollNodeEditorProps> = ({
  node,
  onNodeChange,
  allAssets,
}) => {
  const [isFontPickerOpen, setIsFontPickerOpen] = useState(false);
  const fontAsset = node.fontAssetId ? allAssets.find(asset => asset.id === node.fontAssetId) : null;

  const update = <K extends keyof (GameFlowTextScrollNode | GameFlowTextScrollColorNode | GameFlowTextScroll2Node)>(field: K, value: (GameFlowTextScrollNode | GameFlowTextScrollColorNode | GameFlowTextScroll2Node)[K]) => {
    onNodeChange({ ...node, [field]: value });
  };

  return (
    <div className="space-y-3 p-4">
      <Panel title="Content">
        <div className="mb-2">
          <label className="block text-msx-textprimary text-sm mb-1">Title</label>
          <input
            type="text"
            value={node.title}
            onChange={(event) => update('title', event.target.value)}
            className="w-full bg-msx-bgcolor border border-msx-border text-msx-textprimary rounded px-2 py-1 focus:outline-none focus:border-msx-primary"
          />
        </div>
        <div>
          <label className="block text-msx-textprimary text-sm mb-1">Texto</label>
          <textarea
            value={node.text}
            onChange={(event) => update('text', event.target.value.replace(/\\n/g, '\n'))}
            rows={8}
            className="w-full bg-msx-bgcolor border border-msx-border text-msx-textprimary rounded px-2 py-1 focus:outline-none focus:border-msx-primary resize-none"
          />
          <p className="text-msx-textsecondary text-xs mt-1">Acepta Enter o \n para saltos de linea.</p>
        </div>
      </Panel>

      <Panel title="Fuente">
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsFontPickerOpen(true)} variant="secondary" size="sm">
            Select Font
          </Button>
          {node.fontAssetId && (
            <Button onClick={() => update('fontAssetId', undefined)} variant="ghost" size="sm">
              Clear
            </Button>
          )}
          <span className="text-msx-textsecondary truncate">
            {fontAsset ? fontAsset.name : 'Default'}
          </span>
        </div>
      </Panel>

      <Panel title="Colores">
        <InlineColorPicker
          label="Color fondo"
          color={node.backgroundColor || '#000000'}
          onChange={(color) => update('backgroundColor', color)}
        />
        <InlineColorPicker
          label="Color franja"
          color={node.stripeColor || '#000000'}
          onChange={(color) => update('stripeColor', color)}
        />
        {node.type === 'TextScrollColor' && (
          <InlineColorPicker
            label="Color texto"
            color={node.textColor || '#FFFFFF'}
            onChange={(color) => update('textColor', color)}
          />
        )}
      </Panel>

      <Panel title="Velocidad">
        <label className="block text-msx-textprimary text-sm mb-1">Frames por pixel</label>
        <input
          type="number"
          value={clampSpeedFrames(node.speedFrames)}
          min={1}
          max={8}
          step={1}
          onChange={(event) => update('speedFrames', clampSpeedFrames(Number(event.target.value)))}
          className="w-full bg-msx-bgcolor border border-msx-border text-msx-textprimary rounded px-2 py-1 focus:outline-none focus:border-msx-primary"
        />
        <p className="text-msx-textsecondary text-xs mt-1">1 es lo mas rapido; 8 es lo mas lento permitido.</p>
      </Panel>

      {isFontPickerOpen && (
        <AssetPickerModal
          isOpen={isFontPickerOpen}
          onClose={() => setIsFontPickerOpen(false)}
          onSelectAsset={(assetId) => {
            update('fontAssetId', assetId);
            setIsFontPickerOpen(false);
          }}
          assetTypeToPick="font"
          allAssets={allAssets}
          currentSelectedId={node.fontAssetId || null}
        />
      )}
    </div>
  );
};
