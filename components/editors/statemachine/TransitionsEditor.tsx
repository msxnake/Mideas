import React, { useState, useEffect } from 'react';
import { Panel } from '../../common/Panel';
import { Button } from '../../common/Button';
import { StateMachine, StateMachineState, StateMachineEvent, StateMachineTransition } from '../../../statemachine.types';
import { TrashIcon } from '../../icons/MsxIcons';

interface TransitionsEditorProps {
  stateMachine: StateMachine;
  onAddTransition: (fromStateId: string, eventId: string, toStateId: string) => void;
  onDeleteTransition: (id: string) => void;
}

export const TransitionsEditor: React.FC<TransitionsEditorProps> = ({ stateMachine, onAddTransition, onDeleteTransition }) => {
  const { states, events, transitions } = stateMachine;

  const [fromState, setFromState] = useState<string>(states[0]?.id || '');
  const [event, setEvent] = useState<string>(events[0]?.id || '');
  const [toState, setToState] = useState<string>(states[0]?.id || '');

  // Create maps for quick lookup
  const stateMap = new Map(states.map(s => [s.id, s.name]));
  const eventMap = new Map(events.map(e => [e.id, e.name]));

  useEffect(() => {
    // If the currently selected state/event is no longer valid or not set, reset to the first one.
    if (!states.find(s => s.id === fromState)) {
      setFromState(states[0]?.id || '');
    }
    if (!states.find(s => s.id === toState)) {
      setToState(states[0]?.id || '');
    }
  }, [states, fromState, toState]);

  useEffect(() => {
    if (!events.find(e => e.id === event)) {
      setEvent(events[0]?.id || '');
    }
  }, [events, event]);

  const handleAddClick = () => {
    if (fromState && event && toState) {
      onAddTransition(fromState, event, toState);
    }
  };

  return (
    <Panel title="Transitions">
      <div className="p-2">
        <table className="w-full text-sm text-left">
          <thead className="bg-msx-border text-xs text-msx-textsecondary uppercase">
            <tr>
              <th className="py-2 px-4">From State</th>
              <th className="py-2 px-4">Event</th>
              <th className="py-2 px-4">To State</th>
              <th className="py-2 px-4">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-msx-panelbg">
            {transitions.map(transition => (
              <tr key={transition.id} className="border-b border-msx-border group">
                <td className="py-2 px-4">{stateMap.get(transition.fromStateId) || 'Unknown'}</td>
                <td className="py-2 px-4">{eventMap.get(transition.eventId) || 'Unknown'}</td>
                <td className="py-2 px-4">{stateMap.get(transition.toStateId) || 'Unknown'}</td>
                <td className="py-2 px-4">
                  <button
                    onClick={() => onDeleteTransition(transition.id)}
                    className="p-0.5 rounded-sm text-msx-danger opacity-0 group-hover:opacity-100"
                    title="Delete Transition"
                  >
                    <TrashIcon className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transitions.length === 0 && (
          <p className="text-center py-4 text-msx-textsecondary">
            No transitions defined yet.
          </p>
        )}
        <div className="mt-4 p-2 border-t border-msx-border">
          <h4 className="text-sm font-bold mb-2">Add New Transition</h4>
          <div className="grid grid-cols-4 gap-2 items-center">
            <select value={fromState} onChange={e => setFromState(e.target.value)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded">
              {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={event} onChange={e => setEvent(e.target.value)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded">
              {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <select value={toState} onChange={e => setToState(e.target.value)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded">
              {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <Button onClick={handleAddClick} variant="secondary" size="sm">Add</Button>
          </div>
        </div>
      </div>
    </Panel>
  );
};
