import React from 'react';
import { SkillDialog } from './SkillDialog';

const data = {
  id: 'push_door',
  label: 'Push Door',
  description: 'Open doors by pushing or using keys',
  icon: '🚪',
  category: 'puzzle',
  parameters: [
    { key: 'doorType', label: 'Door type', type: 'number', default: 0, min: 0, max: 3, step: 1, help: '0=All doors, 1=Wooden, 2=Iron, 3=Locked.' },
    { key: 'openSpeed', label: 'Open speed (frames)', type: 'number', default: 20, min: 5, max: 60, step: 1, help: 'Frames to fully open the door.' },
    { key: 'requiresKey', label: 'Requires key to open', type: 'boolean', default: false, help: 'If true, player must have a key to open locked doors.' },
    { key: 'keyConsumed', label: 'Key is consumed on use', type: 'boolean', default: true, help: 'If true, key is used up when opening door.' },
  ],
};

interface PushDoorDialogProps {
  values: Record<string, number | boolean>;
  onPatch: (key: string, value: number | boolean) => void;
  onClose: () => void;
}

export const PushDoorDialog: React.FC<PushDoorDialogProps> = ({ values, onPatch, onClose }) => (
  <SkillDialog {...data} values={values} onPatch={onPatch} onClose={onClose} />
);

export default PushDoorDialog;
