import React, { useState } from 'react';
import { Panel } from '../../common/Panel';
import { Button } from '../../common/Button';
import { StateMachineState, StateMachineStateName } from '../../../statemachine.types';
import { TrashIcon } from '../../icons/MsxIcons';

const PRESET_STATES: StateMachineStateName[] = [
  'Idle', 'Walking', 'Running', 'Jumping', 'Swimming', 'Patrolling',
  'Attacking', 'Shooting', 'Falling', 'Hurt', 'Take'
];

interface StatesPanelProps {
  states: StateMachineState[];
  onAddState: (name: string) => void;
  onDeleteState: (id: string) => void;
}

export const StatesPanel: React.FC<StatesPanelProps> = ({ states, onAddState, onDeleteState }) => {
  const [newStateName, setNewStateName] = useState('');

  const handleAddClick = () => {
    if (newStateName.trim()) {
      onAddState(newStateName.trim());
      setNewStateName('');
    }
  };

  const handlePresetAdd = (name: StateMachineStateName) => {
    if (name) {
      onAddState(name);
    }
  };

  return (
    <Panel title="States">
      <div className="p-2">
        <ul className="space-y-1 mb-2">
          {states.map(state => (
            <li key={state.id} className="flex items-center justify-between p-1 bg-msx-bgcolor rounded group">
              <span className="text-sm text-msx-textprimary">{state.name}</span>
              <button
                onClick={() => onDeleteState(state.id)}
                className="p-0.5 rounded-sm text-msx-danger opacity-0 group-hover:opacity-100"
                title={`Delete ${state.name}`}
              >
                <TrashIcon className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex space-x-1">
          <input
            type="text"
            value={newStateName}
            onChange={(e) => setNewStateName(e.target.value)}
            placeholder="Custom state name..."
            className="w-full p-1 text-sm bg-msx-bgcolor border border-msx-border rounded"
            onKeyDown={(e) => e.key === 'Enter' && handleAddClick()}
          />
          <Button onClick={handleAddClick} variant="secondary" size="sm">
            Add
          </Button>
        </div>
        <div className="flex space-x-1 mt-2">
          <select
            onChange={(e) => handlePresetAdd(e.target.value as StateMachineStateName)}
            className="w-full p-1 text-sm bg-msx-bgcolor border border-msx-border rounded"
            value=""
          >
            <option value="">Add from preset...</option>
            {PRESET_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
    </Panel>
  );
};
