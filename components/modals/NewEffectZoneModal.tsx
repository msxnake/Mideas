import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../common/Button';
import { Modal } from './Modal';
import {
  EffectType,
  EFFECT_ZONE_TYPE_CONFIG,
  ScreenSelectionRect,
  WindEffectDirection,
  getDefaultEffectZoneParams,
  normalizeEffectZoneParams,
} from '../../types';

interface NewEffectZoneValues {
  name: string;
  effectType: EffectType;
  params: Record<string, any>;
  description: string;
}

interface NewEffectZoneModalProps {
  isOpen: boolean;
  selectionRect: ScreenSelectionRect | null;
  zoneCount: number;
  onClose: () => void;
  onConfirm: (values: NewEffectZoneValues) => void;
}

const WIND_DIRECTIONS: WindEffectDirection[] = ['left', 'right', 'up', 'down'];

export const NewEffectZoneModal: React.FC<NewEffectZoneModalProps> = ({
  isOpen,
  selectionRect,
  zoneCount,
  onClose,
  onConfirm,
}) => {
  const [name, setName] = useState('');
  const [effectType, setEffectType] = useState<EffectType>('secretZone');
  const [description, setDescription] = useState('');
  const [windDirection, setWindDirection] = useState<WindEffectDirection>('right');
  const [windStrength, setWindStrength] = useState('1');

  const normalizedWindStrength = useMemo(() => {
    const parsed = parseInt(windStrength, 10);
    return Number.isFinite(parsed) ? parsed : 1;
  }, [windStrength]);

  useEffect(() => {
    if (!isOpen) return;
    setName(`Effect Zone ${zoneCount + 1}`);
    setEffectType('secretZone');
    setDescription('');
    setWindDirection('right');
    setWindStrength('1');
  }, [isOpen, zoneCount]);

  if (!selectionRect) {
    return null;
  }

  const handleConfirm = () => {
    const params = effectType === 'wind'
      ? normalizeEffectZoneParams('wind', { direction: windDirection, strength: normalizedWindStrength })
      : getDefaultEffectZoneParams(effectType);

    onConfirm({
      name: name.trim() || `Effect Zone ${zoneCount + 1}`,
      effectType,
      params,
      description: description.trim(),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Zone">
      <div className="w-[28rem] max-w-full space-y-3 text-sm">
        <div className="rounded border border-msx-border bg-msx-bgcolor/40 p-2 text-xs text-msx-textsecondary">
          Area: X {selectionRect.x}, Y {selectionRect.y}, W {selectionRect.width}, H {selectionRect.height}
        </div>

        <div>
          <label htmlFor="newEffectZoneName" className="mb-1 block text-xs text-msx-textsecondary">Name</label>
          <input
            id="newEffectZoneName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-msx-border bg-msx-bgcolor p-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="newEffectZoneType" className="mb-1 block text-xs text-msx-textsecondary">Effect Type</label>
          <select
            id="newEffectZoneType"
            value={effectType}
            onChange={(e) => setEffectType(e.target.value as EffectType)}
            className="w-full rounded border border-msx-border bg-msx-bgcolor p-2 text-sm"
          >
            {Object.entries(EFFECT_ZONE_TYPE_CONFIG).map(([type, config]) => (
              <option key={type} value={type}>
                {config.label}
              </option>
            ))}
          </select>
        </div>

        {effectType === 'wind' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="newEffectZoneWindDirection" className="mb-1 block text-xs text-msx-textsecondary">Direction</label>
              <select
                id="newEffectZoneWindDirection"
                value={windDirection}
                onChange={(e) => setWindDirection(e.target.value as WindEffectDirection)}
                className="w-full rounded border border-msx-border bg-msx-bgcolor p-2 text-sm"
              >
                {WIND_DIRECTIONS.map(direction => (
                  <option key={direction} value={direction}>
                    {direction}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="newEffectZoneWindStrength" className="mb-1 block text-xs text-msx-textsecondary">Strength</label>
              <input
                id="newEffectZoneWindStrength"
                type="number"
                min="0"
                value={windStrength}
                onChange={(e) => setWindStrength(e.target.value)}
                className="w-full rounded border border-msx-border bg-msx-bgcolor p-2 text-sm"
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="newEffectZoneDescription" className="mb-1 block text-xs text-msx-textsecondary">Description</label>
          <textarea
            id="newEffectZoneDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded border border-msx-border bg-msx-bgcolor p-2 text-sm"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={onClose} variant="ghost" size="sm">Cancel</Button>
          <Button onClick={handleConfirm} variant="primary" size="sm">Create Zone</Button>
        </div>
      </div>
    </Modal>
  );
};
