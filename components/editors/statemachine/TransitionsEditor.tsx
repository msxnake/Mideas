import React from 'react';
import { Panel } from '../../common/Panel';
import { StateMachine, StateMachineState, StateMachineEvent } from '../../../statemachine.types';

interface TransitionsEditorProps {
  stateMachine: StateMachine;
}

export const TransitionsEditor: React.FC<TransitionsEditorProps> = ({ stateMachine }) => {
  const { states, events } = stateMachine;

  // Create maps for quick lookup
  const stateMap = new Map(states.map(s => [s.id, s.name]));
  const eventMap = new Map(events.map(e => [e.id, e.name]));

  // For now, we'll use the events as the source of transitions
  // A real implementation would have a separate transitions array
  const transitions = events.filter(e => e.fromStateId && e.toStateId);

  return (
    <Panel title="Transitions">
      <div className="p-2">
        <table className="w-full text-sm text-left">
          <thead className="bg-msx-border text-xs text-msx-textsecondary uppercase">
            <tr>
              <th className="py-2 px-4">From State</th>
              <th className="py-2 px-4">Event</th>
              <th className="py-2 px-4">To State</th>
            </tr>
          </thead>
          <tbody className="bg-msx-panelbg">
            {transitions.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-4 text-msx-textsecondary">
                  No transitions defined yet.
                </td>
              </tr>
            ) : (
              transitions.map(transition => (
                <tr key={transition.id} className="border-b border-msx-border">
                  <td className="py-2 px-4">{stateMap.get(transition.fromStateId) || 'Unknown'}</td>
                  <td className="py-2 px-4">{transition.name}</td>
                  <td className="py-2 px-4">{stateMap.get(transition.toStateId) || 'Unknown'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
};
