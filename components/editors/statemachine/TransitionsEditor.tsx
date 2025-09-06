import React, { useState, useEffect } from 'react';
import { Panel } from '../../common/Panel';
import { Button } from '../../common/Button';
import { StateMachine, Condition, StateMachineTransition, Action } from '../../../statemachine.types';
import { TrashIcon } from '../../icons/MsxIcons';
import { ConditionBuilder } from './ConditionBuilder';
import { ActionSequenceEditor } from './ActionSequenceEditor';

interface TransitionsEditorProps {
  stateMachine: StateMachine;
  onAddTransition: (fromStateId: string, toStateId: string, conditions: Condition, actions: Action[]) => void;
  onDeleteTransition: (id: string) => void;
  onUpdateTransition: (id: string, updates: Partial<StateMachineTransition>) => void;
}

export const TransitionsEditor: React.FC<TransitionsEditorProps> = ({ 
  stateMachine, 
  onAddTransition, 
  onDeleteTransition, 
  onUpdateTransition 
}) => {
  const { states, transitions } = stateMachine;

  const [fromState, setFromState] = useState<string>(states[0]?.id || '');
  const [toState, setToState] = useState<string>(states[0]?.id || '');
  const [condition, setCondition] = useState<Condition | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [editingTransitionId, setEditingTransitionId] = useState<string | null>(null);

  const stateMap = new Map(states.map(s => [s.id, s.name]));

  useEffect(() => {
    if (!states.find(s => s.id === fromState)) {
      setFromState(states[0]?.id || '');
    }
    if (!states.find(s => s.id === toState)) {
      setToState(states[0]?.id || '');
    }
  }, [states, fromState, toState]);

  const handleAddClick = () => {
    if (fromState && toState && condition) {
      onAddTransition(fromState, toState, condition, actions);
      setCondition(null);
      setActions([]);
    } else {
      alert("Please select from/to states and define a condition.");
    }
  };

  const renderCondition = (c: Condition) => {
    if (!c) return 'None';
    if (c.type === 'AND' || c.type === 'OR') {
      return `${c.type}(${c.conditions?.map(renderCondition).join(', ') || ''})`;
    }
    return `${c.type} ${JSON.stringify(c.params || {})}`;
  }

  return (
    <Panel title="Transitions">
      <div className="p-2">
        <table className="w-full text-sm text-left">
          <thead className="bg-msx-border text-xs text-msx-textsecondary uppercase">
            <tr>
              <th className="py-2 px-4">From</th>
              <th className="py-2 px-4">To</th>
              <th className="py-2 px-4">Condition</th>
              <th className="py-2 px-4"></th>
            </tr>
          </thead>
          <tbody className="bg-msx-panelbg">
            {transitions.map(transition => (
              <React.Fragment key={transition.id}>
                <tr className="border-b border-msx-border group cursor-pointer" onClick={() => setEditingTransitionId(editingTransitionId === transition.id ? null : transition.id)}>
                  <td className="py-2 px-4">{stateMap.get(transition.fromStateId) || 'Unknown'}</td>
                  <td className="py-2 px-4">{stateMap.get(transition.toStateId) || 'Unknown'}</td>
                  <td className="py-2 px-4 text-xs">{renderCondition(transition.conditions)}</td>
                  <td className="py-2 px-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteTransition(transition.id); }}
                      className="p-0.5 rounded-sm text-msx-danger opacity-0 group-hover:opacity-100"
                      title="Delete Transition"
                    >
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
                {editingTransitionId === transition.id && (
                  <tr className="border-b border-msx-border">
                    <td colSpan={4} className="p-2 bg-msx-bgcolor-dark">
                      <h5 className="text-xs font-bold mb-1">Actions</h5>
                      <ActionSequenceEditor 
                        actions={transition.actions || []} 
                        onUpdateActions={(newActions) => onUpdateTransition(transition.id, { actions: newActions })} 
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {transitions.length === 0 && (
          <p className="text-center py-4 text-msx-textsecondary">
            No transitions defined yet.
          </p>
        )}
        <div className="mt-4 p-2 border-t border-msx-border space-y-2">
          <h4 className="text-sm font-bold mb-2">Add New Transition</h4>
          <div className="grid grid-cols-2 gap-2">
            <select value={fromState} onChange={e => setFromState(e.target.value)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded">
              <option value="">From State</option>
              {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={toState} onChange={e => setToState(e.target.value)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded">
              <option value="">To State</option>
              {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <h5 className="text-xs font-bold mb-1">Condition</h5>
            {condition ? (
              <ConditionBuilder condition={condition} onUpdate={setCondition} />
            ) : (
              <Button onClick={() => setCondition({ type: 'KEY_PRESSED', params: { key: '' } })} size="sm">+ Add Condition</Button>
            )}
          </div>
          {condition && (
            <>
              <div>
                <h5 className="text-xs font-bold mb-1">Actions</h5>
                <ActionSequenceEditor actions={actions} onUpdateActions={setActions} />
              </div>
              <Button onClick={handleAddClick} variant="secondary" size="sm" className="mt-2">Add Transition</Button>
            </>
          )}
        </div>
      </div>
    </Panel>
  );
};
