import React from 'react';
import { SkillDialog } from './SkillDialog';

const data = {
  id: 'wall_jump',
  label: 'Wall Jump',
  description: 'Jump off walls to reach higher platforms',
  icon: '🧱',
  category: 'movement',
  parameters: [
    { key: 'wallJumpPower', label: 'Wall jump power', type: 'number', default: 1024, min: 256, max: 2048, step: 1, help: 'Vertical impulse when jumping from wall in 8.8 fixed point.' },
    { key: 'wallJumpHorizontal', label: 'Horizontal push (px/frame)', type: 'number', default: 4, min: 1, max: 12, step: 1, help: 'Horizontal velocity away from wall after wall jump.' },
    { key: 'wallSlideSpeed', label: 'Wall slide speed (px/frame)', type: 'number', default: 1, min: 0, max: 4, step: 1, help: 'Max fall speed while clinging to wall. 0 = instant drop.' },
    { key: 'requireKeyRelease', label: 'Require key release between wall jumps', type: 'boolean', default: true, help: 'Player must release jump key before triggering another wall jump.' },
  ],
};

interface WallJumpDialogProps {
  values: Record<string, number | boolean>;
  onPatch: (key: string, value: number | boolean) => void;
  onClose: () => void;
}

export const WallJumpDialog: React.FC<WallJumpDialogProps> = ({ values, onPatch, onClose }) => (
  <SkillDialog {...data} values={values} onPatch={onPatch} onClose={onClose} />
);

export default WallJumpDialog;
