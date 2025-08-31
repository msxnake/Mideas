import React, { useState } from 'react';
import { Panel } from '../../common/Panel';
import { Button } from '../../common/Button';
import { StateMachineEvent } from '../../../statemachine.types';
import { TrashIcon } from '../../icons/MsxIcons';

interface EventsPanelProps {
  events: StateMachineEvent[];
  onCreateEvent: (name: string) => void;
  onDeleteEvent: (id: string) => void;
}

export const EventsPanel: React.FC<EventsPanelProps> = ({ events, onCreateEvent, onDeleteEvent }) => {
  const [newEventName, setNewEventName] = useState('');

  const handleAddClick = () => {
    if (newEventName.trim()) {
      onCreateEvent(newEventName.trim());
      setNewEventName('');
    }
  };

  return (
    <Panel title="Events">
      <div className="p-2">
        <ul className="space-y-1 mb-2">
          {events.map(event => (
            <li key={event.id} className="flex items-center justify-between p-1 bg-msx-bgcolor rounded group">
              <span className="text-sm text-msx-textprimary">{event.name}</span>
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
        <div className="flex space-x-1">
          <input
            type="text"
            value={newEventName}
            onChange={(e) => setNewEventName(e.target.value)}
            placeholder="New event name..."
            className="w-full p-1 text-sm bg-msx-bgcolor border border-msx-border rounded"
            onKeyDown={(e) => e.key === 'Enter' && handleAddClick()}
          />
          <Button onClick={handleAddClick} variant="secondary" size="sm">
            Add
          </Button>
        </div>
      </div>
    </Panel>
  );
};
