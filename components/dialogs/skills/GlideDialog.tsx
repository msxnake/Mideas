import React from 'react';
import { SkillDialog } from './SkillDialog';

const data = {
  id: 'glide',
  label: 'Glide',
  description: 'Slow your fall and control horizontal movement',
  icon: '🦅',
  category: 'movement',
  parameters: [
    { key: 'glideSpeed', label: 'Glide fall speed (px/frame)', type: 'number', default: 1, min: 0, max: 4, step: 1, help: 'Max vertical speed while gliding. 0 = float in place.' },
    { key: 'glideHorizontalSpeed', label: 'Horizontal control (px/frame)', type: 'number', default: 2, min: 0, max: 6, step: 1, help: 'Horizontal movement allowed while gliding.' },
    { key: 'glideBoostCost', label: 'Stamina cost per boost', type: 'number', default: 5, min: 0, max: 20, step: 1, help: 'Stamina consumed per boost. 0 = infinite glide.' },
  ],
};

interface GlideDialogProps {
  values: Record<string, number | boolean>;
  onPatch: (key: string, value: number | boolean) => void;
  onClose: () => void;
}

export const GlideDialog: React.FC<GlideDialogProps> = ({ values, onPatch, onClose }) => (
  <SkillDialog {...data} values={values} onPatch={onPatch} onClose={onClose} />
);

export default GlideDialog;
