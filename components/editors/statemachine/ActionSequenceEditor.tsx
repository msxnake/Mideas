import React from 'react';
import { Action, ActionTypes, ActionType } from '../../../copia3';
import { Button } from '../../common/Button';
import { TrashIcon } from '../../icons/MsxIcons';
import { ActionParamsEditor } from './ActionParamsEditor';

interface ActionSequenceEditorProps {
  actions: Action[];
  onUpdateActions: (actions: Action[]) => void;
}

export const ActionSequenceEditor: React.FC<ActionSequenceEditorProps> = ({ actions, onUpdateActions }) => {
  const [selectedActionType, setSelectedActionType] = React.useState<ActionType>(ActionTypes.SET_POSITION);

  const handleAddAction = () => {
    const newAction: Action = {
      type: selectedActionType,
      params: {},
    };
    onUpdateActions([...actions, newAction]);
  };

  const handleDeleteAction = (index: number) => {
    onUpdateActions(actions.filter((_, i) => i !== index));
  };

  const handleUpdateActionParams = (index: number, params: { [key: string]: any }) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], params };
    onUpdateActions(newActions);
  };

  return (
    <div>
      <ul className="space-y-2">
        {actions.map((action, index) => (
          <li key={index} className="p-2 bg-msx-bgcolor-dark rounded">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono">{action.type}</span>
              <Button onClick={() => handleDeleteAction(index)} variant="danger" size="sm">
                <TrashIcon className="w-4 h-4" />
              </Button>
            </div>
            <ActionParamsEditor 
              action={action} 
              onUpdateParams={(params) => handleUpdateActionParams(index, params)} 
            />
          </li>
        ))}
      </ul>

      <div className="flex items-center space-x-2 mt-4">
        <select 
          value={selectedActionType}
          onChange={(e) => setSelectedActionType(e.target.value as ActionType)}
          className="w-full p-1 text-sm bg-msx-bgcolor border border-msx-border rounded"
        >
          {Object.values(ActionTypes).map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <Button onClick={handleAddAction} variant="secondary">
          Add Action
        </Button>
      </div>
    </div>
  );
};
