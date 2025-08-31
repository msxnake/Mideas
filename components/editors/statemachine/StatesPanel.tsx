import React from 'react';
import { Panel } from '../../../common/Panel';
import { Button } from '../../../common/Button';
import { StateMachineState } from '../../../../statemachine.types';

interface StatesPanelProps {
  states: StateMachineState[];
  onAddState: () => void;
}

export const StatesPanel: React.FC<StatesPanelProps> = ({ states, onAddState }) => {
  return (
    <Panel title="States">
      <div className="p-2">
        <ul className="space-y-1">
          {states.map(state => (
            <li key={state.id} className="flex items-center justify-between p-1 bg-msx-bgcolor rounded">
              <span className="text-sm text-msx-textprimary">{state.name}</span>
            </li>
          ))}
        </ul>
        <Button onClick={onAddState} variant="secondary" size="sm" className="mt-2">
          + Add State
        </Button>
      </div>
    </Panel>
  );
};
