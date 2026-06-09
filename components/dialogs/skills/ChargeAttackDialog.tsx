import React from 'react';
import { SkillDialog } from './SkillDialog';

const data = {
  id: 'charge_attack',
  label: 'Charge Attack',
  description: 'Hold to charge, release for a powerful attack',
  icon: '⚡',
  category: 'attack',
  parameters: [
    { key: 'minChargeFrames', label: 'Min charge time (frames)', type: 'number', default: 20, min: 5, max: 60, step: 1, help: 'Minimum frames to hold before attack releases.' },
    { key: 'maxChargeFrames', label: 'Max charge time (frames)', type: 'number', default: 60, min: 20, max: 120, step: 1, help: 'Frames to hold for maximum charge.' },
    { key: 'chargeMultiplier', label: 'Max charge damage multiplier', type: 'number', default: 3, min: 1, max: 8, step: 1, help: 'Damage multiplier at full charge (1 = no bonus).' },
    { key: 'releaseOnJump', label: 'Release charge on jump', type: 'boolean', default: false, help: 'If true, releasing jump key fires the charged attack.' },
  ],
};

interface ChargeAttackDialogProps {
  values: Record<string, number | boolean>;
  onPatch: (key: string, value: number | boolean) => void;
  onClose: () => void;
}

export const ChargeAttackDialog: React.FC<ChargeAttackDialogProps> = ({ values, onPatch, onClose }) => (
  <SkillDialog {...data} values={values} onPatch={onPatch} onClose={onClose} />
);

export default ChargeAttackDialog;
