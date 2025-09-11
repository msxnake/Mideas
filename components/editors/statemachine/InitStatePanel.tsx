import React from 'react';
import { Panel } from '../../common/Panel';
import { StateMachineState } from '../../../statemachine.types';

/**
 * Props for the InitStatePanel component.
 */
interface InitStatePanelProps {
  /** The list of states in the state machine. */
  states: StateMachineState[];
  /** The current initial state ID. */
  initialStateId: string | null;
  /** Callback to update the initial state. */
  onUpdateInitialState: (stateId: string | null) => void;
}

/**
 * A panel for setting the initial state of a state machine.
 * It allows users to select which state should be the starting state.
 */
export const InitStatePanel: React.FC<InitStatePanelProps> = ({ 
  states, 
  initialStateId, 
  onUpdateInitialState 
}) => {
  const handleInitStateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    onUpdateInitialState(value === '' ? null : value);
  };

  return (
    <Panel title="Init State">
      <div className="p-2">
        <div className="space-y-2">
          <label className="text-sm text-msx-textprimary">
            Initial State:
          </label>
          <select
            value={initialStateId || ''}
            onChange={handleInitStateChange}
            className="w-full p-2 text-sm bg-msx-bgcolor border border-msx-border rounded focus:outline-none focus:border-msx-highlight"
          >
            <option value="">Select initial state...</option>
            {states.map(state => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
          
          {initialStateId && (
            <div className="mt-2 p-2 bg-msx-bgcolor-dark rounded border border-msx-border">
              <p className="text-xs text-msx-textsecondary">
                Current initial state: <span className="text-msx-textprimary font-semibold">
                  {states.find(s => s.id === initialStateId)?.name || 'Unknown'}
                </span>
              </p>
            </div>
          )}
          
          {states.length === 0 && (
            <div className="text-xs text-msx-textsecondary italic">
              No states available. Create a state first.
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
};