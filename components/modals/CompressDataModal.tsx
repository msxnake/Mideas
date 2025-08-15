import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { ProjectAsset } from '../../types';

interface CompressDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: ProjectAsset[];
  onCompress: (selectedAssetIds: string[]) => void;
}

export const CompressDataModal: React.FC<CompressDataModalProps> = ({
  isOpen,
  onClose,
  assets,
  onCompress,
}) => {
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      // Reset selection when modal opens
      setSelected({});
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleToggleSelect = (assetId: string) => {
    setSelected(prev => ({ ...prev, [assetId]: !prev[assetId] }));
  };

  const handleSelectAll = () => {
    const allSelected = assets.every(asset => selected[asset.id]);
    const newSelected: Record<string, boolean> = {};
    if (!allSelected) {
      for (const asset of assets) {
        newSelected[asset.id] = true;
      }
    }
    setSelected(newSelected);
  };

  const handleCompressClick = () => {
    const selectedAssetIds = Object.keys(selected).filter(id => selected[id]);
    onCompress(selectedAssetIds);
    onClose();
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="compressDataModalTitle"
    >
      <div
        className="bg-msx-panelbg p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-lg animate-slideIn pixel-font flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="compressDataModalTitle" className="text-md sm:text-lg text-msx-highlight mb-3 sm:mb-4">
          Compress Data Files
        </h2>

        <div className="flex-grow overflow-hidden mb-3 sm:mb-4 border border-msx-border rounded bg-msx-bgcolor p-2">
          <div className="h-full overflow-auto">
            {assets.map(asset => (
              <div key={asset.id} className="flex items-center p-1 hover:bg-msx-border">
                <input
                  type="checkbox"
                  id={`compress-${asset.id}`}
                  checked={!!selected[asset.id]}
                  onChange={() => handleToggleSelect(asset.id)}
                  className="mr-3"
                />
                <label htmlFor={`compress-${asset.id}`} className="text-msx-textprimary cursor-pointer">
                  {asset.name} <span className="text-msx-textsecondary text-xs">({asset.type})</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
            <Button onClick={handleSelectAll} variant="secondary" size="sm">
                {assets.length === selectedCount ? 'Deselect All' : 'Select All'}
            </Button>
            <p className="text-xs text-msx-textsecondary">{selectedCount} of {assets.length} selected</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
          <Button onClick={onClose} variant="ghost" size="sm" className="w-full sm:w-auto">Cancel</Button>
          <Button onClick={handleCompressClick} variant="primary" size="sm" className="w-full sm:w-auto">Compress</Button>
        </div>
      </div>
    </div>
  );
};
