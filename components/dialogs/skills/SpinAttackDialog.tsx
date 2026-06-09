import React from 'react';
import { SkillDialog } from './SkillDialog';

const data = {
  id: 'spin_attack',
  label: 'Spin Attack',
  description: 'Rotating melee attack that hits all nearby enemies',
  icon: '🔄',
  category: 'attack',
  parameters: [
    { key: 'spinDuration', label: 'Spin duration (frames)', type: 'number', default: 30, min: 10, max: 60, step: 1, help: 'How long the spin attack lasts.' },
    { key: 'spinDamage', label: 'Damage per hit', type: 'number', default: 1, min: 1, max: 5, step: 1, help: 'Damage dealt to enemies per spin hit.' },
    { key: 'spinCooldown', label: 'Spin cooldown (frames)', type: 'number', default: 40, min: 10, max: 120, step: 1, help: 'Frames before spin can be used again.' },
    { key: 'spinKnockback', label: 'Knockback force', type: 'number', default: 4, min: 0, max: 8, step: 1, help: 'How far enemies are pushed away.' },
  ],
};

interface SpinAttackDialogProps {
  values: Record<string, number | boolean>;
  onPatch: (key: string, value: number | boolean) => void;
  onClose: () => void;
}

export const SpinAttackDialog: React.FC<SpinAttackDialogProps> = ({ values, onPatch, onClose }) => (
  <SkillDialog {...data} values={values} onPatch={onPatch} onClose={onClose} />
);

export default SpinAttackDialog;
