import React from 'react';
import { SkillDialog } from './SkillDialog';

const data = {
  id: 'parry',
  label: 'Parry',
  description: 'Deflect enemy attacks with perfect timing',
  icon: '🛡️',
  category: 'defense',
  parameters: [
    { key: 'parryWindow', label: 'Parry window (frames)', type: 'number', default: 8, min: 2, max: 20, step: 1, help: 'Frames during which a perfect block registers. Typical: 4-12.' },
    { key: 'parryStun', label: 'Enemy stun duration (frames)', type: 'number', default: 30, min: 10, max: 60, step: 1, help: 'How long enemies are stunned after being parried.' },
    { key: 'parryCooldown', label: 'Parry cooldown (frames)', type: 'number', default: 20, min: 5, max: 60, step: 1, help: 'Frames before parry can be used again.' },
    { key: 'parryKnockback', label: 'Knockback force', type: 'number', default: 6, min: 0, max: 12, step: 1, help: 'How far enemies are pushed after parry.' },
  ],
};

interface ParryDialogProps {
  values: Record<string, number | boolean>;
  onPatch: (key: string, value: number | boolean) => void;
  onClose: () => void;
}

export const ParryDialog: React.FC<ParryDialogProps> = ({ values, onPatch, onClose }) => (
  <SkillDialog {...data} values={values} onPatch={onPatch} onClose={onClose} />
);

export default ParryDialog;
