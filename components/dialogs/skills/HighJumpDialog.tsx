import React from 'react';
import { SkillDialog } from './SkillDialog';

const data = {
  id: 'high_jump',
  label: 'High Jump',
  description: 'Hold jump for a higher leap',
  icon: '⬆️',
  category: 'movement',
  parameters: [
    { key: 'highJumpPower', label: 'High jump power', type: 'number', default: 1536, min: 512, max: 3072, step: 1, help: 'Vertical impulse for high jump in 8.8 fixed point. 1536 = ~6 px/frame.' },
    { key: 'highJumpRequired', label: 'Hold time for high jump (frames)', type: 'number', default: 10, min: 5, max: 30, step: 1, help: 'Frames jump key must be held to trigger high jump.' },
    { key: 'highJumpKnockback', label: 'Horizontal knockback on high jump', type: 'number', default: 2, min: 0, max: 6, step: 1, help: 'Horizontal velocity added during high jump.' },
  ],
};

interface HighJumpDialogProps {
  values: Record<string, number | boolean>;
  onPatch: (key: string, value: number | boolean) => void;
  onClose: () => void;
}

export const HighJumpDialog: React.FC<HighJumpDialogProps> = ({ values, onPatch, onClose }) => (
  <SkillDialog {...data} values={values} onPatch={onPatch} onClose={onClose} />
);

export default HighJumpDialog;
