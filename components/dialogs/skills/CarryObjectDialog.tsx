import React from 'react';
import { SkillDialog } from './SkillDialog';

const data = {
  id: 'carry_object',
  label: 'Carry Object',
  description: 'Pick up, carry and throw objects',
  icon: '📦',
  category: 'utility',
  parameters: [
    { key: 'carrySpeed', label: 'Carry speed (px/frame)', type: 'number', default: 1, min: 0, max: 4, step: 1, help: 'Movement speed while carrying. 0 = immobile while carrying.' },
    { key: 'throwPower', label: 'Throw power (px/frame)', type: 'number', default: 8, min: 2, max: 16, step: 1, help: 'Horizontal velocity when throwing the object.' },
    { key: 'throwVertical', label: 'Throw vertical (px/frame)', type: 'number', default: 4, min: 0, max: 12, step: 1, help: 'Vertical velocity when throwing upward.' },
    { key: 'throwCooldown', label: 'Throw cooldown (frames)', type: 'number', default: 20, min: 5, max: 60, step: 1, help: 'Frames before you can pick up another object.' },
    { key: 'objectTypes', label: 'Object types', type: 'number', default: 1, min: 1, max: 15, step: 1, help: 'Bitmask: 1=Crates, 2=Boulders, 4=Barrels, 8=Power-ups.' },
  ],
};

interface CarryObjectDialogProps {
  values: Record<string, number | boolean>;
  onPatch: (key: string, value: number | boolean) => void;
  onClose: () => void;
}

export const CarryObjectDialog: React.FC<CarryObjectDialogProps> = ({ values, onPatch, onClose }) => (
  <SkillDialog {...data} values={values} onPatch={onPatch} onClose={onClose} />
);

export default CarryObjectDialog;
