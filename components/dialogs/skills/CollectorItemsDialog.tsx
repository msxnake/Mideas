import React from 'react';
import { SkillDialog } from './SkillDialog';

const data = {
  id: 'collector_items',
  label: 'Collector Items',
  description: 'Pick up collectible items like coins, keys, and power-ups',
  icon: '🪙',
  category: 'collection',
  parameters: [
    { key: 'itemTypes', label: 'Item types collected', type: 'number', default: 7, min: 1, max: 31, step: 1, help: 'Bitmask: 1=Coins, 2=Keys, 4=Potions, 8=Gems, 16=Scrolls.' },
    { key: 'coinValue', label: 'Coin value', type: 'number', default: 10, min: 1, max: 100, step: 1, help: 'Points per coin collected.' },
    { key: 'maxCoins', label: 'Max coins stored', type: 'number', default: 99, min: 1, max: 999, step: 1, help: 'Maximum coins that can be stored.' },
    { key: 'keyRequired', label: 'Key opens doors', type: 'boolean', default: true, help: 'Collected keys are used to open locked doors.' },
  ],
};

interface CollectorItemsDialogProps {
  values: Record<string, number | boolean>;
  onPatch: (key: string, value: number | boolean) => void;
  onClose: () => void;
}

export const CollectorItemsDialog: React.FC<CollectorItemsDialogProps> = ({ values, onPatch, onClose }) => (
  <SkillDialog {...data} values={values} onPatch={onPatch} onClose={onClose} />
);

export default CollectorItemsDialog;
