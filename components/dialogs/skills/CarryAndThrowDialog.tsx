import React from 'react';
import { SkillDialog } from './SkillDialog';

const data = {
  id: 'carry_and_throw',
  label: 'Carry & Throw Through',
  description: 'Lift objects and throw them through gaps or at enemies',
  icon: '🏋️',
  category: 'utility',
  parameters: [
    { key: 'liftStrength', label: 'Lift strength', type: 'number', default: 1024, min: 256, max: 2048, step: 128, help: 'Force required to lift heavy objects in 8.8 fixed point.' },
    { key: 'throwDistance', label: 'Throw distance (tiles)', type: 'number', default: 5, min: 1, max: 20, step: 1, help: 'How far the object travels when thrown.' },
    { key: 'throwTrajectory', label: 'Throw trajectory', type: 'number', default: 1, min: 0, max: 1, step: 1, help: '0=Linear, 1=Parabolic arc.' },
    { key: 'throwSpeed', label: 'Throw speed (px/frame)', type: 'number', default: 12, min: 4, max: 24, step: 1, help: 'Horizontal velocity of thrown object.' },
    { key: 'throwVertical', label: 'Arc height (px/frame)', type: 'number', default: 8, min: 1, max: 24, step: 1, help: 'Initial upward velocity of the parabolic throw.' },
    { key: 'throwGravity', label: 'Arc gravity (px/frame)', type: 'number', default: 1, min: 1, max: 8, step: 1, help: 'Downward acceleration applied every frame.' },
    { key: 'pickupRadius', label: 'Pickup radius (px)', type: 'number', default: 20, min: 8, max: 32, step: 1, help: 'Distance from the player at which the object can be picked up.' },
    { key: 'objectCollision', label: 'Object has collision', type: 'boolean', default: true, help: 'If true, thrown object collides with walls and platforms.' },
    { key: 'enemyCollision', label: 'Object damages enemies', type: 'boolean', default: true, help: 'If true, thrown object damages enemies on contact.' },
    { key: 'dropOnGround', label: 'Drop on ground contact', type: 'boolean', default: true, help: 'If true, object drops when hitting ground instead of stopping.' },
    { key: 'throwCooldown', label: 'Throw cooldown (frames)', type: 'number', default: 30, min: 10, max: 120, step: 5, help: 'Frames before you can throw another object.' },
  ],
};

interface CarryAndThrowDialogProps {
  values: Record<string, number | boolean>;
  onPatch: (key: string, value: number | boolean) => void;
  onClose: () => void;
}

export const CarryAndThrowDialog: React.FC<CarryAndThrowDialogProps> = ({ values, onPatch, onClose }) => (
  <SkillDialog {...data} values={values} onPatch={onPatch} onClose={onClose} />
);

export default CarryAndThrowDialog;
