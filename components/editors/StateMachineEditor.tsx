import React, { useState } from 'react';
import { ProjectAsset } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
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
  const [language, setLanguage] = useState<'en' | 'es'>('en');
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

  const handleUpdateState = (stateId: string, updatedProperties: { [key: string]: any }) => {
    const updatedStates = stateMachine.states.map(s => {
      if (s.id === stateId) {
        return { ...s, properties: updatedProperties };
      }
      return s;
    });
    onUpdateAsset({ states: updatedStates });
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
    <Panel
      title={`State Machine Editor: ${stateMachine.name}`}
      headerButtons={
        <div className="flex items-center space-x-2 text-xs">
          <span className={language === 'en' ? 'font-bold' : ''}>EN</span>
          <Button
            onClick={() => setLanguage(lang => lang === 'en' ? 'es' : 'en')}
            variant="ghost"
            size="sm"
            className="p-1"
          >
            <div className="w-8 h-4 bg-gray-600 rounded-full flex items-center px-0.5">
              <div
                className={`w-3 h-3 bg-white rounded-full transform transition-transform ${language === 'es' ? 'translate-x-4' : ''}`}
              />
            </div>
          </Button>
          <span className={language === 'es' ? 'font-bold' : ''}>ES</span>
        </div>
      }
    >
      <div className="p-4 flex space-x-4">
        <div className="w-1/4 space-y-4">
          <StatesPanel
            states={stateMachine.states}
            onAddState={handleAddState}
            onDeleteState={handleDeleteState}
            onUpdateState={handleUpdateState}
            language={language}
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
