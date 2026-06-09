import React from 'react';
import { SkillDialog } from './SkillDialog';

const data = {
  id: 'power_stomp',
  label: 'Power Stomp',
  description: 'Fall with impact and break tiles or damage enemies',
  icon: '💥',
  category: 'attack',
  parameters: [
    { key: 'stompSpeed', label: 'Stomp speed (px/frame)', type: 'number', default: 16, min: 4, max: 32, step: 1, help: 'Fall speed when stomping.' },
    { key: 'stompDamage', label: 'Stomp damage', type: 'number', default: 2, min: 0, max: 10, step: 1, help: 'Damage dealt to enemies on impact. 0 = no damage.' },
    { key: 'breakTiles', label: 'Break tiles on impact', type: 'boolean', default: true, help: 'If true, certain tiles break when stomped.' },
    { key: 'breakableTiles', label: 'Breakable tile types', type: 'number', default: 7, min: 1, max: 255, step: 1, help: 'Bitmask of tile IDs that can be broken (1=brittle, 2=wood, 4=glass).' },
    { key: 'impactRadius', label: 'Impact radius (tiles)', type: 'number', default: 1, min: 1, max: 4, step: 1, help: 'Radius of stomp impact in tiles.' },
    { key: 'stompCooldown', label: 'Stomp cooldown (frames)', type: 'number', default: 30, min: 10, max: 120, step: 5, help: 'Frames before stomp can be used again.' },
    { key: 'chargeRequired', label: 'Requires charge in air', type: 'boolean', default: false, help: 'If true, must hold down in air before stomp activates.' },
    { key: 'ricochetOnMiss', label: 'Ricochet if no enemy hit', type: 'boolean', default: false, help: 'If true, player bounces off ground if no enemy was hit.' },
  ],
};

interface PowerStompDialogProps {
  values: Record<string, number | boolean>;
  onPatch: (key: string, value: number | boolean) => void;
  onClose: () => void;
}

export const PowerStompDialog: React.FC<PowerStompDialogProps> = ({ values, onPatch, onClose }) => (
  <SkillDialog {...data} values={values} onPatch={onPatch} onClose={onClose} />
);

export default PowerStompDialog;
