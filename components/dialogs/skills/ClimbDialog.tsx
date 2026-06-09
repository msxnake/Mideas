import React from 'react';
import { SkillDialog } from './SkillDialog';

const data = {
  id: 'climb',
  label: 'Climb Ladders',
  description: 'Climb up and down ladders and ropes',
  icon: '🪜',
  category: 'movement',
  parameters: [
    { key: 'climbSpeed', label: 'Climb speed (px/frame)', type: 'number', default: 2, min: 1, max: 6, step: 1, help: 'Vertical speed while climbing.' },
    { key: 'ladderDetectionRange', label: 'Ladder detection (pixels)', type: 'number', default: 8, min: 4, max: 16, step: 1, help: 'How far player can reach to grab a ladder.' },
    { key: 'dismountJumpBoost', label: 'Jump boost on dismount', type: 'number', default: 0, min: 0, max: 8, step: 1, help: 'Additional jump velocity when jumping off ladder.' },
  ],
};

interface ClimbDialogProps {
  values: Record<string, number | boolean>;
  onPatch: (key: string, value: number | boolean) => void;
  onClose: () => void;
}

export const ClimbDialog: React.FC<ClimbDialogProps> = ({ values, onPatch, onClose }) => (
  <SkillDialog {...data} values={values} onPatch={onPatch} onClose={onClose} />
);

export default ClimbDialog;
