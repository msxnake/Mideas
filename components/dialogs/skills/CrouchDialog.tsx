import React from 'react';
import { SkillDialog } from './SkillDialog';

const data = {
  id: 'crouch',
  label: 'Crouch',
  description: 'Duck under obstacles and crawl through tight spaces',
  icon: '⬇️',
  category: 'movement',
  parameters: [
    { key: 'crouchSpeed', label: 'Crouch move speed (px/frame)', type: 'number', default: 1, min: 0, max: 4, step: 1, help: 'Horizontal movement speed while crouching. 0 = immobile.' },
    { key: 'crouchHitboxHeight', label: 'Crouch hitbox height (pixels)', type: 'number', default: 8, min: 4, max: 12, step: 1, help: 'Height of player hitbox when crouching.' },
    { key: 'slideDistance', label: 'Slide distance on release (px)', type: 'number', default: 0, min: 0, max: 16, step: 1, help: 'Momentum slide when releasing crouch. 0 = no slide.' },
  ],
};

interface CrouchDialogProps {
  values: Record<string, number | boolean>;
  onPatch: (key: string, value: number | boolean) => void;
  onClose: () => void;
}

export const CrouchDialog: React.FC<CrouchDialogProps> = ({ values, onPatch, onClose }) => (
  <SkillDialog {...data} values={values} onPatch={onPatch} onClose={onClose} />
);

export default CrouchDialog;
