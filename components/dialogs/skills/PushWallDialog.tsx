import React from 'react';
import { SkillDialog } from './SkillDialog';

const data = {
  id: 'push_wall',
  label: 'Push Wall',
  description: 'Push moveable walls to reveal secrets or create paths',
  icon: '🧱',
  category: 'puzzle',
  parameters: [
    { key: 'pushSpeed', label: 'Push speed (px/frame)', type: 'number', default: 1, min: 1, max: 4, step: 1, help: 'How fast the wall moves when pushed.' },
    { key: 'pushResistance', label: 'Push resistance (frames)', type: 'number', default: 5, min: 1, max: 20, step: 1, help: 'Frames required to start pushing the wall.' },
    { key: 'maxPushDistance', label: 'Max push distance (tiles)', type: 'number', default: 3, min: 1, max: 8, step: 1, help: 'Maximum tiles the wall can be pushed.' },
    { key: 'wallType', label: 'Wall type', type: 'number', default: 0, min: 0, max: 2, step: 1, help: '0=All pushable walls, 1=Crates only, 2=Boulders only.' },
  ],
};

interface PushWallDialogProps {
  values: Record<string, number | boolean>;
  onPatch: (key: string, value: number | boolean) => void;
  onClose: () => void;
}

export const PushWallDialog: React.FC<PushWallDialogProps> = ({ values, onPatch, onClose }) => (
  <SkillDialog {...data} values={values} onPatch={onPatch} onClose={onClose} />
);

export default PushWallDialog;
