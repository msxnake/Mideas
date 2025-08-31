import React from 'react';
import { Panel } from '../../common/Panel';
import { Button } from '../../common/Button';
import { StateMachineEvent } from '../../../statemachine.types';

interface EventsPanelProps {
  events: StateMachineEvent[];
  onCreateEvent: () => void;
}

export const EventsPanel: React.FC<EventsPanelProps> = ({ events, onCreateEvent }) => {
  return (
    <Panel title="Events">
      <div className="p-2">
        <ul className="space-y-1">
          {events.map(event => (
            <li key={event.id} className="flex items-center justify-between p-1 bg-msx-bgcolor rounded">
              <span className="text-sm text-msx-textprimary">{event.name}</span>
            </li>
          ))}
        </ul>
        <Button onClick={onCreateEvent} variant="secondary" size="sm" className="mt-2">
          + Create Event
        </Button>
      </div>
    </Panel>
  );
};
