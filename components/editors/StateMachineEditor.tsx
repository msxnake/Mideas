import React from 'react';
import { ProjectAsset } from '../../types';
import { Panel } from '../common/Panel';
import { StateMachine } from '../../statemachine.types';
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

  const handleAddState = () => {
    // TODO: Implement this
    console.log("Add new state");
  };

  const handleCreateEvent = () => {
    // TODO: Implement this
    console.log("Create new event");
  };

  return (
    <Panel title={`State Machine Editor: ${stateMachine.name}`}>
      <div className="p-4 flex space-x-4">
        <div className="w-1/4 space-y-4">
          <StatesPanel states={stateMachine.states} onAddState={handleAddState} />
          <EventsPanel events={stateMachine.events} onCreateEvent={handleCreateEvent} />
        </div>
        <div className="w-3/4">
          <TransitionsEditor stateMachine={stateMachine} />
        </div>
      </div>
    </Panel>
  );
};
