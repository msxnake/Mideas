import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../common/Button';
import { Modal } from './Modal';
import { EffectZone, ProjectAsset, TileBank } from '../../types';

interface FontOption {
  fontTileId: string;
  label: string;
  characters: string;
  sector: number;
}

interface AddSecretTextModalProps {
  isOpen: boolean;
  effectZone: EffectZone | null;
  tileBank: TileBank | null;
  allAssets: ProjectAsset[];
  onClose: () => void;
  onConfirm: (payload: { fontTileId: string; text: string; offsetX: number; offsetY: number }) => void;
}

export const AddSecretTextModal: React.FC<AddSecretTextModalProps> = ({
  isOpen,
  effectZone,
  tileBank,
  allAssets,
  onClose,
  onConfirm,
}) => {
  const [text, setText] = useState('');
  const [offsetX, setOffsetX] = useState('0');
  const [offsetY, setOffsetY] = useState('0');
  const [selectedFontTileId, setSelectedFontTileId] = useState('');
  const [validationMessage, setValidationMessage] = useState('');

  const currentSector = useMemo(() => {
    const absoluteY = (effectZone?.rect.y ?? 0) + (parseInt(offsetY, 10) || 0);
    if (absoluteY < 8) return 0;
    if (absoluteY < 16) return 1;
    return 2;
  }, [effectZone?.rect.y, offsetY]);

  const fontOptions = useMemo<FontOption[]>(() => {
    if (!tileBank) return [];
    const bank = tileBank.banks[currentSector];
    if (!bank) return [];

    return Object.entries(bank.assignedTiles)
      .filter(([tileId, assignment]) => tileId.startsWith('font_') && Array.isArray((assignment as any).fontCharacters))
      .map(([tileId, assignment]) => {
        const fontAsset = allAssets.find(asset => asset.type === 'font' && tileId.includes(asset.id));
        const label = fontAsset?.name || tileId;
        const characters = ((assignment as any).fontCharacters || []).map((charInfo: any) => charInfo.character).join('');
        return {
          fontTileId: tileId,
          label,
          characters,
          sector: currentSector,
        };
      });
  }, [allAssets, currentSector, tileBank]);

  useEffect(() => {
    if (!isOpen) return;
    setText('');
    setOffsetX('0');
    setOffsetY('0');
    setValidationMessage('');
  }, [isOpen, effectZone?.id]);

  useEffect(() => {
    if (!fontOptions.length) {
      setSelectedFontTileId('');
      return;
    }
    if (!fontOptions.some(option => option.fontTileId === selectedFontTileId)) {
      setSelectedFontTileId(fontOptions[0].fontTileId);
    }
  }, [fontOptions, selectedFontTileId]);

  const handleConfirm = () => {
    const trimmedText = text.trim();
    const resolvedFontTileId = selectedFontTileId || fontOptions[0]?.fontTileId || '';
    if (!trimmedText) {
      setValidationMessage('Enter some text before inserting it.');
      return;
    }
    if (!resolvedFontTileId) {
      setValidationMessage(`No font assigned in TileBank sector ${currentSector}.`);
      return;
    }
    setValidationMessage('');
    onConfirm({
      fontTileId: resolvedFontTileId,
      text: trimmedText,
      offsetX: parseInt(offsetX, 10) || 0,
      offsetY: parseInt(offsetY, 10) || 0,
    });
  };

  const selectedFontOption = fontOptions.find(option => option.fontTileId === selectedFontTileId) || null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Text">
      <div className="w-[28rem] max-w-full space-y-3 text-sm">
        <div className="rounded border border-msx-border bg-msx-bgcolor/40 p-2 text-xs text-msx-textsecondary">
          Zone: X {effectZone?.rect.x ?? 0}, Y {effectZone?.rect.y ?? 0}, W {effectZone?.rect.width ?? 0}, H {effectZone?.rect.height ?? 0}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="secretTextOffsetX" className="mb-1 block text-xs text-msx-textsecondary">Offset X</label>
            <input
              id="secretTextOffsetX"
              type="number"
              min="0"
              max={Math.max(0, (effectZone?.rect.width ?? 1) - 1)}
              value={offsetX}
              onChange={(e) => setOffsetX(e.target.value)}
              className="w-full rounded border border-msx-border bg-msx-bgcolor p-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="secretTextOffsetY" className="mb-1 block text-xs text-msx-textsecondary">Offset Y</label>
            <input
              id="secretTextOffsetY"
              type="number"
              min="0"
              max={Math.max(0, (effectZone?.rect.height ?? 1) - 1)}
              value={offsetY}
              onChange={(e) => setOffsetY(e.target.value)}
              className="w-full rounded border border-msx-border bg-msx-bgcolor p-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="secretTextFont" className="mb-1 block text-xs text-msx-textsecondary">Font</label>
          <select
            id="secretTextFont"
            value={selectedFontTileId}
            onChange={(e) => setSelectedFontTileId(e.target.value)}
            disabled={fontOptions.length === 0}
            className="w-full rounded border border-msx-border bg-msx-bgcolor p-2 text-sm"
          >
            {fontOptions.length === 0 && <option value="">No font assigned in TileBank sector {currentSector}</option>}
            {fontOptions.map(option => (
              <option key={option.fontTileId} value={option.fontTileId}>
                {option.label}
              </option>
            ))}
          </select>
          {selectedFontOption && (
            <div className="mt-1 text-xs text-msx-textsecondary">
              Sector {selectedFontOption.sector} characters: {selectedFontOption.characters || '(none)'}
            </div>
          )}
          {fontOptions.length === 0 && (
            <div className="mt-1 text-xs text-msx-danger">
              Assign a font in TileBank sector {currentSector} to insert text here.
            </div>
          )}
        </div>

        <div>
          <label htmlFor="secretTextValue" className="mb-1 block text-xs text-msx-textsecondary">Text</label>
          <input
            id="secretTextValue"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full rounded border border-msx-border bg-msx-bgcolor p-2 text-sm"
            placeholder="SECRET"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" onClick={onClose} variant="ghost" size="sm">Cancel</Button>
          <Button type="button" onClick={handleConfirm} variant="primary" size="sm">Insert Text</Button>
        </div>
        {validationMessage && (
          <div className="text-right text-xs text-msx-danger">
            {validationMessage}
          </div>
        )}
      </div>
    </Modal>
  );
};
