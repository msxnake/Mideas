import React, { useRef, useState } from 'react';
import { Connection } from '@xyflow/react';
import { StateMachine, StateMachineState, StateMachineStateName, StateMachineTransition, Condition, Action } from '../../statemachine.types';
import { ProjectAsset, EntityTemplate } from '../../types';
import { StatesPanel } from './statemachine/StatesPanel';
import { TransitionsEditor } from './statemachine/TransitionsEditor';
import { ActionSequenceEditor } from './statemachine/ActionSequenceEditor';
import { StatePropertiesEditor } from './statemachine/StatePropertiesEditor';
import StateMachineVisualizer from './statemachine/StateMachineVisualizer';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { InitStatePanel } from './statemachine/InitStatePanel';
import { LoadIcon, SaveIcon } from '../icons/MsxIcons';
import { downloadJsonFile } from '../../utils/downloadUtils';

interface StateMachineEditorProps {
  currentAsset: ProjectAsset;
  onUpdateAsset: (updatedData: Partial<StateMachine>) => void;
  allAssets: ProjectAsset[];
  entityTemplates: EntityTemplate[];
}

interface StateMachineExportPackage {
  format: 'mideas.statemachine';
  version: 1;
  exportedAt: string;
  stateMachine: StateMachine;
}

const sanitizeFilenamePart = (value: string): string => {
  const sanitized = value.trim().replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '');
  return sanitized || 'state_machine';
};

const isRecord = (value: unknown): value is Record<string, any> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const cloneJson = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const extractStateMachineFromJson = (parsed: unknown): unknown => {
  if (!isRecord(parsed)) return null;
  if (isRecord(parsed.stateMachine)) return parsed.stateMachine;
  if (isRecord(parsed.data) && parsed.type === 'statemachine') return parsed.data;
  return parsed;
};

const normalizeImportedStateMachine = (
  imported: unknown,
  currentStateMachine: StateMachine,
  currentAsset: ProjectAsset
): StateMachine => {
  if (!isRecord(imported)) {
    throw new Error('The JSON root is not a State Machine object.');
  }

  if (!Array.isArray(imported.states) || !Array.isArray(imported.transitions)) {
    throw new Error('The JSON does not contain State Machine states and transitions arrays.');
  }

  const states: StateMachineState[] = imported.states.map((state, index) => {
    if (!isRecord(state) || typeof state.id !== 'string' || typeof state.name !== 'string') {
      throw new Error(`State at index ${index} is missing a valid id or name.`);
    }
    return {
      ...cloneJson(state),
      id: state.id,
      name: state.name as StateMachineStateName,
      properties: isRecord(state.properties) ? cloneJson(state.properties) : {},
      onEnter: Array.isArray(state.onEnter) ? cloneJson(state.onEnter) : undefined,
      onExit: Array.isArray(state.onExit) ? cloneJson(state.onExit) : undefined,
    };
  });

  const transitions: StateMachineTransition[] = imported.transitions.map((transition, index) => {
    if (
      !isRecord(transition)
      || typeof transition.fromStateId !== 'string'
      || typeof transition.toStateId !== 'string'
    ) {
      throw new Error(`Transition at index ${index} is missing valid from/to state ids.`);
    }
    return {
      ...cloneJson(transition),
      id: typeof transition.id === 'string' && transition.id ? transition.id : `transition_${Date.now()}_${index}`,
      fromStateId: transition.fromStateId,
      toStateId: transition.toStateId,
      conditions: isRecord(transition.conditions) ? cloneJson(transition.conditions) : undefined,
      actions: Array.isArray(transition.actions) ? cloneJson(transition.actions) : [],
      guard: isRecord(transition.guard) ? cloneJson(transition.guard) : undefined,
    };
  });

  const stateIds = new Set(states.map(state => state.id));
  const importedInitialStateId = typeof imported.initialStateId === 'string' ? imported.initialStateId : null;
  const initialStateId = importedInitialStateId && stateIds.has(importedInitialStateId)
    ? importedInitialStateId
    : states[0]?.id || null;

  return {
    ...currentStateMachine,
    ...cloneJson(imported),
    id: typeof currentStateMachine.id === 'string' && currentStateMachine.id ? currentStateMachine.id : currentAsset.id,
    name: currentStateMachine.name || currentAsset.name,
    states,
    events: Array.isArray(imported.events) ? cloneJson(imported.events) : [],
    transitions,
    initialStateId,
  };
};

const StateDetailView = ({
  state,
  onUpdateActions,
  onUpdateProperties,
  stateMachine,
  onAddTransition,
  onDeleteTransition,
  onUpdateTransition,
  allAssets,
  entityTemplates,
  stateMachineAssetId,
}: {
  state: StateMachineState | undefined,
  onUpdateActions: (actionList: 'onEnter' | 'onExit', newActions: Action[]) => void,
  onUpdateProperties: (properties: { [key: string]: any }) => void,
  stateMachine: StateMachine,
  onAddTransition: (fromStateId: string, toStateId: string, conditions: Condition, actions: Action[], guard?: any) => void,
  allAssets: ProjectAsset[],
  entityTemplates: EntityTemplate[],
  stateMachineAssetId: string,
  onDeleteTransition: (id: string) => void,
  onUpdateTransition: (id: string, updates: Partial<StateMachineTransition>) => void
}) => {
  if (!state) {
    return (
      <div className="space-y-4">
        <Panel title="State Details">
          <div className="p-4 text-sm text-gray-400">Select a state to see its details.</div>
        </Panel>
        <Panel title="Transitions">
          <div className="p-2">
            <TransitionsEditor
              stateMachine={stateMachine}
              onAddTransition={onAddTransition}
              onDeleteTransition={onDeleteTransition}
              onUpdateTransition={onUpdateTransition}
              allAssets={allAssets}
              entityTemplates={entityTemplates}
              stateMachineAssetId={stateMachineAssetId}
            />
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Panel title={`State: ${state.name}`}>
        <div className="p-2 space-y-2">
          <p className="text-sm text-gray-400">ID: {state.id}</p>
          <div>
            <h5 className="text-xs font-bold mb-1">Properties</h5>
            <StatePropertiesEditor state={state} onUpdate={onUpdateProperties} />
          </div>
        </div>
      </Panel>
      <Panel title="On Enter Actions">
        <div className="p-2">
            <ActionSequenceEditor
              actions={state.onEnter || []}
              onUpdateActions={(newActions) => onUpdateActions('onEnter', newActions)}
              allAssets={allAssets}
              entityTemplates={entityTemplates}
            />
        </div>
      </Panel>
      <Panel title="On Exit Actions">
        <div className="p-2">
            <ActionSequenceEditor
              actions={state.onExit || []}
              onUpdateActions={(newActions) => onUpdateActions('onExit', newActions)}
              allAssets={allAssets}
              entityTemplates={entityTemplates}
            />
        </div>
      </Panel>
      <Panel title="Transitions">
        <div className="p-2">
            <TransitionsEditor
              stateMachine={stateMachine}
              onAddTransition={onAddTransition}
              onDeleteTransition={onDeleteTransition}
              onUpdateTransition={onUpdateTransition}
              allAssets={allAssets}
              entityTemplates={entityTemplates}
              stateMachineAssetId={stateMachineAssetId}
            />
        </div>
      </Panel>
    </div>
  );
};

export const StateMachineEditor: React.FC<StateMachineEditorProps> = ({
  currentAsset,
  onUpdateAsset,
  allAssets,
  entityTemplates,
}) => {
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [view, setView] = useState<'list' | 'visual'>('list');
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const stateMachineFileInputRef = useRef<HTMLInputElement>(null);
  const stateMachine = currentAsset.data as StateMachine;

  if (!stateMachine) {
    return <Panel title="State Machine Editor">Error: No state machine data found.</Panel>;
  }

  const handleAddState = (name: string) => {
    const newState: StateMachineState = {
      id: `state_${Date.now()}`,
      name: name as StateMachineStateName,
      properties: {},
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

  const handleUpdateInitialState = (stateId: string | null) => {
    onUpdateAsset({ initialStateId: stateId });
  };

  const handleUpdateStateActions = (actionList: 'onEnter' | 'onExit', newActions: Action[]) => {
    if (!selectedStateId) return;

    const updatedStates = stateMachine.states.map(s => {
      if (s.id === selectedStateId) {
        return { ...s, [actionList]: newActions };
      }
      return s;
    });
    onUpdateAsset({ states: updatedStates });
  };

  const handleUpdateStateProperties = (properties: { [key: string]: any }) => {
    if (!selectedStateId) return;

    const updatedStates = stateMachine.states.map(s => {
      if (s.id === selectedStateId) {
        return { ...s, properties };
      }
      return s;
    });
    onUpdateAsset({ states: updatedStates });
  };

  const handleNodePositionChange = (nodeId: string, position: { x: number, y: number }) => {
    const updatedStates = stateMachine.states.map(s => {
      if (s.id === nodeId) {
        return { ...s, position };
      }
      return s;
    });
    onUpdateAsset({ states: updatedStates });
  };

  const handleAddTransition = (fromStateId: string, toStateId: string, conditions: Condition, actions: Action[], guard?: any) => {
    const newTransition: StateMachineTransition = {
      id: `transition_${Date.now()}`,
      fromStateId,
      toStateId,
      conditions,
      actions,
      guard,
    };
    onUpdateAsset({ transitions: [...stateMachine.transitions, newTransition] });
  };

  const handleConnect = (connection: Connection) => {
    if (connection.source && connection.target) {
      const newTransition: StateMachineTransition = {
        id: `transition_${Date.now()}`,
        fromStateId: connection.source,
        toStateId: connection.target,
        conditions: { type: 'KEY_PRESSED', params: { key: '' } }, // Default condition
        actions: [],
      };
      onUpdateAsset({ transitions: [...stateMachine.transitions, newTransition] });
    }
  };

  const handleUpdateTransition = (id: string, updates: Partial<StateMachineTransition>) => {
    onUpdateAsset({
      transitions: stateMachine.transitions.map(t => t.id === id ? { ...t, ...updates } : t),
    });
  };

  const handleDeleteTransition = (id: string) => {
    onUpdateAsset({
      transitions: stateMachine.transitions.filter(t => t.id !== id),
    });
  };

  const handleSaveStateMachine = () => {
    const exportPackage: StateMachineExportPackage = {
      format: 'mideas.statemachine',
      version: 1,
      exportedAt: new Date().toISOString(),
      stateMachine: cloneJson(stateMachine),
    };
    downloadJsonFile(`${sanitizeFilenamePart(stateMachine.name || currentAsset.name)}.statemachine.json`, exportPackage);
  };

  const handleLoadStateMachine = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const parsed = JSON.parse(String(loadEvent.target?.result || ''));
        const imported = extractStateMachineFromJson(parsed);
        const normalized = normalizeImportedStateMachine(imported, stateMachine, currentAsset);
        onUpdateAsset(normalized);
        setSelectedStateId(null);
      } catch (error) {
        console.error('Error importing State Machine JSON:', error);
        window.alert('Could not load this State Machine JSON. The file may be corrupted or in the wrong format.');
      } finally {
        event.target.value = '';
      }
    };
    reader.onerror = () => {
      window.alert('Could not read the selected State Machine JSON file.');
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  const selectedState = stateMachine.states.find(s => s.id === selectedStateId);

  return (
    <Panel
      title={`State Machine Editor: ${stateMachine.name}`}
      headerButtons={
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Button
              onClick={handleSaveStateMachine}
              variant="ghost"
              size="sm"
              icon={<SaveIcon className="w-4 h-4" />}
              title="Save State Machine JSON"
            >
              Save State Machine
            </Button>
            <Button
              onClick={() => stateMachineFileInputRef.current?.click()}
              variant="ghost"
              size="sm"
              icon={<LoadIcon className="w-4 h-4" />}
              title="Load State Machine JSON"
            >
              Load State Machine
            </Button>
            <input
              ref={stateMachineFileInputRef}
              type="file"
              accept=".json,.statemachine.json,application/json"
              onChange={handleLoadStateMachine}
              className="hidden"
            />
          </div>
          <div className="flex items-center space-x-1 p-1 bg-msx-bgcolor-dark rounded-md">
            <Button onClick={() => setView('list')} variant={view === 'list' ? 'primary' : 'ghost'} size="sm">List</Button>
            <Button onClick={() => setView('visual')} variant={view === 'visual' ? 'primary' : 'ghost'} size="sm">Visual</Button>
          </div>
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
        </div>
      }
    >
      <div className="max-h-[800px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4a5568 #2d3748' }}>
        {view === 'list' ? (
          <div className="p-4 flex space-x-4">
            <div className="w-1/3 space-y-4">
              <StatesPanel
                states={stateMachine.states}
                selectedStateId={selectedStateId}
                onStateSelect={setSelectedStateId}
                onAddState={handleAddState}
                onDeleteState={(id) => {
                  if (selectedStateId === id) {
                    setSelectedStateId(null);
                  }
                  handleDeleteState(id);
                }}
                language={language}
              />
              <InitStatePanel
                states={stateMachine.states}
                initialStateId={stateMachine.initialStateId}
                onUpdateInitialState={handleUpdateInitialState}
              />
            </div>
            <div className="w-2/3">
              <StateDetailView
                state={selectedState}
                onUpdateActions={handleUpdateStateActions}
                onUpdateProperties={handleUpdateStateProperties}
                stateMachine={stateMachine}
                onAddTransition={handleAddTransition}
                onDeleteTransition={handleDeleteTransition}
                onUpdateTransition={handleUpdateTransition}
                allAssets={allAssets}
                entityTemplates={entityTemplates}
                stateMachineAssetId={currentAsset.id}
              />
            </div>
          </div>
        ) : (
          <div className="w-full h-[600px]">
            <StateMachineVisualizer 
              stateMachine={stateMachine}
              onNodePositionChange={handleNodePositionChange}
              onConnect={handleConnect}
            />
          </div>
        )}
      </div>
    </Panel>
  );
};
