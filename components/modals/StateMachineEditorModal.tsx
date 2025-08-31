import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../common/Button';
import { StateMachine, StateMachineStateName, StateMachineEventName } from '../../statemachine.types';

const ALL_STATES: StateMachineStateName[] = [
  'Idle', 'Walking', 'Running', 'Jumping', 'Swimming', 'Patrolling',
  'Attacking', 'Shooting', 'Falling', 'Hurt', 'Take'
];

const ALL_EVENTS: StateMachineEventName[] = [
  'walk', 'run', 'jump', 'attack', 'shoot', 'fall'
];

interface StateMachineEditorModalProps {
  isOpen: boolean;
  onConfirm: (stateMachineData: Omit<StateMachine, 'id'>) => void;
  onClose: () => void;
}

export const StateMachineEditorModal: React.FC<StateMachineEditorModalProps> = ({ isOpen, onConfirm, onClose }) => {
  const [name, setName] = useState('');
  const [initialState, setInitialState] = useState<StateMachineStateName>('Idle');
  const [selectedEvents, setSelectedEvents] = useState<StateMachineEventName[]>([]);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('NewStateMachine');
      setInitialState('Idle');
      setSelectedEvents([]);
      setError('');
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEventChange = (eventName: StateMachineEventName) => {
    setSelectedEvents(prev =>
      prev.includes(eventName)
        ? prev.filter(e => e !== eventName)
        : [...prev, eventName]
    );
  };

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('State machine name cannot be empty.');
      return;
    }
    if (/[<>:"/\\|?*\x00-\x1F]/.test(trimmedName)) {
        setError("State machine name contains invalid characters.");
        return;
    }
    if (trimmedName.length > 50) {
        setError("State machine name is too long (max 50 characters).");
        return;
    }

    const states = ALL_STATES.map(stateName => ({
      id: `state_${stateName}`,
      name: stateName,
    }));

    const events = selectedEvents.map(eventName => ({
      id: `event_${eventName}`,
      name: eventName,
      fromStateId: '', // These will be editable later
      toStateId: '',   // in the state machine editor UI
    }));

    const initialStateId = states.find(s => s.name === initialState)?.id || null;

    onConfirm({
      name: trimmedName,
      states,
      events,
      initialStateId,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
    else if (e.key === 'Escape') onClose();
  };

  return (
    <div
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stateMachineModalTitle"
    >
      <div
        className="bg-msx-panelbg p-6 rounded-lg shadow-xl w-full max-w-lg animate-slideIn pixel-font"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="stateMachineModalTitle" className="text-lg text-msx-highlight mb-4">
          Create New State Machine
        </h2>

        <div className="mb-4">
          <label htmlFor="stateMachineNameInput" className="block text-xs text-msx-textsecondary mb-1">
            State Machine Name:
          </label>
          <input
            ref={inputRef}
            type="text"
            id="stateMachineNameInput"
            value={name}
            onChange={(e) => { setName(e.target.value); if (error) setError(''); }}
            onKeyDown={handleKeyDown}
            className={`w-full p-2 text-sm bg-msx-bgcolor border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent ${error ? 'border-msx-danger' : 'border-msx-border'}`}
            maxLength={50}
          />
          {error && <p className="text-xs text-msx-danger mt-1">{error}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="initialStateSelect" className="block text-xs text-msx-textsecondary mb-1">
            Initial State:
          </label>
          <select
            id="initialStateSelect"
            value={initialState}
            onChange={e => setInitialState(e.target.value as StateMachineStateName)}
            className="w-full p-2 text-sm bg-msx-bgcolor border rounded text-msx-textprimary border-msx-border focus:ring-msx-accent focus:border-msx-accent"
          >
            {ALL_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-xs text-msx-textsecondary mb-1">
            Events:
          </label>
          <div className="grid grid-cols-3 gap-2 p-2 border border-msx-border rounded-md bg-msx-bgcolor">
            {ALL_EVENTS.map(eventName => (
              <label key={eventName} className="flex items-center space-x-2 text-sm text-msx-textprimary cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedEvents.includes(eventName)}
                  onChange={() => handleEventChange(eventName)}
                  className="form-checkbox h-4 w-4 text-msx-accent bg-msx-bgcolor border-msx-border rounded focus:ring-msx-accent"
                />
                <span>{eventName}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button onClick={onClose} variant="ghost" size="md">Cancel</Button>
          <Button onClick={handleSubmit} variant="primary" size="md">Create</Button>
        </div>
      </div>
    </div>
  );
};
