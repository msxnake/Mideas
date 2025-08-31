import React from 'react';
import { ProjectAsset } from '../../types';
import { Panel } from '../common/Panel';
import { StateMachine, StateMachineState, StateMachineStateName, StateMachineEvent, StateMachineEventName, StateMachineTransition, StateMachineInputType } from '../../statemachine.types';
import { StatesPanel } from './statemachine/StatesPanel';
import { EventsPanel } from './statemachine/EventsPanel';
import { TransitionsEditor } from './statemachine/TransitionsEditor';

interface StateMachineEditorProps {
  currentAsset: ProjectAsset;
  onUpdateAsset: (updatedData: Partial<StateMachine>) => void;
}

export const StateMachineEditor: React.FC<StateMachineEditorProps> = ({
  currentAsset,
  onUpdateAsset,
}) => {
  const stateMachine = currentAsset.data as StateMachine;

  if (!stateMachine) {
    return <Panel title="State Machine Editor">Error: No state machine data found.</Panel>;
  }

  const handleAddState = (name: string) => {
    const newState: StateMachineState = {
      id: `state_${Date.now()}`,
      name: name as StateMachineStateName, // This is a bit of a hack, we should validate the name
    };
    onUpdateAsset({ states: [...stateMachine.states, newState] });
  };

  const handleDeleteState = (id: string) => {
    onUpdateAsset({
      states: stateMachine.states.filter(s => s.id !== id),
      // Also delete transitions that use this state
      transitions: stateMachine.transitions.filter(t => t.fromStateId !== id && t.toStateId !== id),
    });
  };

  const handleCreateEvent = (name: string, type: StateMachineInputType) => {
    const newEvent: StateMachineEvent = {
      id: `event_${Date.now()}`,
      name: name as StateMachineEventName, // This is a bit of a hack, we should validate the name
      type,
    };
    onUpdateAsset({ events: [...stateMachine.events, newEvent] });
  };

  const handleDeleteEvent = (id: string) => {
    onUpdateAsset({
      events: stateMachine.events.filter(e => e.id !== id),
      // Also delete transitions that use this event
      transitions: stateMachine.transitions.filter(t => t.eventId !== id),
    });
  };

  const handleAddTransition = (fromStateId: string, eventId: string, toStateId: string) => {
    const newTransition: StateMachineTransition = {
      id: `transition_${Date.now()}`,
      fromStateId,
      eventId,
      toStateId,
    };
    onUpdateAsset({ transitions: [...stateMachine.transitions, newTransition] });
  };

  const handleDeleteTransition = (id: string) => {
    onUpdateAsset({
      transitions: stateMachine.transitions.filter(t => t.id !== id),
    });
  };

  return (
    <Panel title={`State Machine Editor: ${stateMachine.name}`}>
      <div className="p-4 flex space-x-4">
        <div className="w-1/4 space-y-4">
          <StatesPanel
            states={stateMachine.states}
            onAddState={handleAddState}
            onDeleteState={handleDeleteState}
          />
          <EventsPanel
            events={stateMachine.events}
            onCreateEvent={handleCreateEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        </div>
        <div className="w-3/4">
          <TransitionsEditor
            stateMachine={stateMachine}
            onAddTransition={handleAddTransition}
            onDeleteTransition={handleDeleteTransition}
          />
        </div>
      </div>
    </Panel>
  );
};
