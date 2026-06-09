import React from 'react';
import { SkillDialog } from './SkillDialog';

const data = {
  id: 'collector_gems',
  label: 'Collector Gems',
  description: 'Collect gems and crystals scattered in the level',
  icon: '💎',
  category: 'collection',
  parameters: [
    { key: 'gemValue', label: 'Points per gem', type: 'number', default: 100, min: 1, max: 1000, step: 10, help: 'Score points awarded for each gem collected.' },
    { key: 'gemRespawn', label: 'Respawn time (frames)', type: 'number', default: 0, min: 0, max: 3600, step: 60, help: 'Frames before gem respawns. 0 = no respawn.' },
    { key: 'gemType', label: 'Gem type', type: 'number', default: 0, min: 0, max: 3, step: 1, help: '0=All, 1=Red, 2=Blue, 3=Green gems.' },
    { key: 'collectSound', label: 'Play collect sound', type: 'boolean', default: true, help: 'Play sound effect when gem is collected.' },
  ],
};

interface CollectorGemsDialogProps {
  values: Record<string, number | boolean>;
  onPatch: (key: string, value: number | boolean) => void;
  onClose: () => void;
}

export const CollectorGemsDialog: React.FC<CollectorGemsDialogProps> = ({ values, onPatch, onClose }) => (
  <SkillDialog {...data} values={values} onPatch={onPatch} onClose={onClose} />
);

export default CollectorGemsDialog;
