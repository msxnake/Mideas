import React from 'react';
import { SkillDialog } from './SkillDialog';

const data = {
  id: 'ground_pound',
  label: 'Ground Pound',
  description: 'Slam downward from the air with impact damage',
  icon: '⬇️',
  category: 'attack',
  parameters: [
    { key: 'poundSpeed', label: 'Pound speed (px/frame)', type: 'number', default: 12, min: 4, max: 24, step: 1, help: 'Vertical speed when ground pounding.' },
    { key: 'poundCooldown', label: 'Pound cooldown (frames)', type: 'number', default: 15, min: 5, max: 60, step: 1, help: 'Frames before you can move after landing from a pound.' },
    { key: 'poundDamage', label: 'Damage on impact', type: 'number', default: 1, min: 0, max: 10, step: 1, help: 'Damage dealt to enemies when landing. 0 = no damage.' },
    { key: 'requireKeyRelease', label: 'Require key release between pounds', type: 'boolean', default: true, help: 'Player must release down key before triggering another pound.' },
  ],
};

interface GroundPoundDialogProps {
  values: Record<string, number | boolean>;
  onPatch: (key: string, value: number | boolean) => void;
  onClose: () => void;
}

export const GroundPoundDialog: React.FC<GroundPoundDialogProps> = ({ values, onPatch, onClose }) => (
  <SkillDialog {...data} values={values} onPatch={onPatch} onClose={onClose} />
);

export default GroundPoundDialog;
