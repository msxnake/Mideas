import React, { useState } from 'react';
import { Panel } from '../../common/Panel';
import { Button } from '../../common/Button';
import { StateMachineEvent, StateMachineEventName, StateMachineInputType } from '../../../statemachine.types';
import { TrashIcon } from '../../icons/MsxIcons';

const PRESET_EVENTS: StateMachineEventName[] = [
  'walk', 'run', 'jump', 'attack', 'shoot', 'fall'
];

const INPUT_TYPES: StateMachineInputType[] = ['key', 'system_action', 'collision'];

interface EventsPanelProps {
  events: StateMachineEvent[];
  onCreateEvent: (name: string, type: StateMachineInputType) => void;
  onDeleteEvent: (id: string) => void;
}

export const EventsPanel: React.FC<EventsPanelProps> = ({ events, onCreateEvent, onDeleteEvent }) => {
  const [newEventName, setNewEventName] = useState('');
  const [newEventType, setNewEventType] = useState<StateMachineInputType>('key');

  const handleAddClick = () => {
    if (newEventName.trim()) {
      onCreateEvent(newEventName.trim(), newEventType);
      setNewEventName('');
    }
  };

  const handlePresetAdd = (name: StateMachineEventName) => {
    if (name) {
      // For presets, we can default to a type, e.g., 'key' or make it selectable too.
      // For now, let's default to 'key' for simplicity.
      onCreateEvent(name, 'key');
    }
  };

  return (
    <Panel title="Events">
      <div className="p-2">
        <ul className="space-y-1 mb-2">
          {events.map(event => (
            <li key={event.id} className="flex items-center justify-between p-1 bg-msx-bgcolor rounded group">
              <div>
                <span className="text-sm text-msx-textprimary">{event.name}</span>
                <span className="text-xs text-msx-textsecondary ml-2">({event.type})</span>
              </div>
              <button
                onClick={() => onDeleteEvent(event.id)}
                className="p-0.5 rounded-sm text-msx-danger opacity-0 group-hover:opacity-100"
                title={`Delete ${event.name}`}
              >
                <TrashIcon className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
        <div className="space-y-2 border-t border-msx-border pt-2">
          <div className="flex space-x-1">
            <input
              type="text"
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
              placeholder="Custom event name..."
              className="w-full p-1 text-sm bg-msx-bgcolor border border-msx-border rounded"
              onKeyDown={(e) => e.key === 'Enter' && handleAddClick()}
            />
            <Button onClick={handleAddClick} variant="secondary" size="sm">
              Add
            </Button>
          </div>
          <select
            value={newEventType}
            onChange={e => setNewEventType(e.target.value as StateMachineInputType)}
            className="w-full p-1 text-sm bg-msx-bgcolor border border-msx-border rounded"
          >
            {INPUT_TYPES.map(type => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}
          </select>
          <select
            onChange={(e) => handlePresetAdd(e.target.value as StateMachineEventName)}
            className="w-full p-1 text-sm bg-msx-bgcolor border border-msx-border rounded"
            value=""
          >
            <option value="">Add from preset...</option>
            {PRESET_EVENTS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>
    </Panel>
  );
};
