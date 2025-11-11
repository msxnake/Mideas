import React from 'react';
import { GameFlowGlobalsNode } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PlusCircleIcon, TrashIcon } from '../icons/MsxIcons';

interface GlobalsNodeEditorProps {
  node: GameFlowGlobalsNode;
  onNodeChange: (newNode: GameFlowGlobalsNode) => void;
}

export const GlobalsNodeEditor: React.FC<GlobalsNodeEditorProps> = ({ node, onNodeChange }) => {
  const handleTitleChange = (val: string) => {
    onNodeChange({ ...node, title: val });
  };

  const handleVarNameChange = (id: string, name: string) => {
    const updated = node.variables.map(v => v.id === id ? { ...v, name } : v);
    onNodeChange({ ...node, variables: updated });
  };

  const handleVarValueChange = (id: string, value: string) => {
    const updated = node.variables.map(v => v.id === id ? { ...v, value } : v);
    onNodeChange({ ...node, variables: updated });
  };

  const handleAddRow = () => {
    const newId = `var_${Date.now()}`;
    const updated = [...(node.variables || []), { id: newId, name: 'NewVar', value: '0' }];
    onNodeChange({ ...node, variables: updated });
  };

  const handleDeleteRow = (id: string) => {
    const updated = (node.variables || []).filter(v => v.id !== id);
    onNodeChange({ ...node, variables: updated });
  };

  return (
    <div className="space-y-4 p-4">
      <Panel title="Node">
        <div className="mb-2">
          <label className="block text-sm mb-1">Title</label>
          <input
            type="text"
            value={node.title || ''}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full bg-msx-bgcolor border border-msx-border text-white rounded px-2 py-1 focus:outline-none"
          />
        </div>
      </Panel>
      <Panel title="Assignments">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-msx-textsecondary">Set global variables when this node is reached</span>
          <Button onClick={handleAddRow} size="sm" variant="secondary" icon={<PlusCircleIcon className="w-4 h-4"/>}>Add</Button>
        </div>
        <div className="space-y-2">
          {(node.variables || []).map(v => (
            <div key={v.id} className="flex items-center space-x-2">
              <input
                type="text"
                value={v.name}
                onChange={(e) => handleVarNameChange(v.id, e.target.value)}
                placeholder="Variable name (e.g., Ammo)"
                className="flex-1 bg-msx-bgcolor border border-msx-border text-white rounded px-2 py-1 focus:outline-none"
              />
              <input
                type="text"
                value={v.value}
                onChange={(e) => handleVarValueChange(v.id, e.target.value)}
                placeholder="Value (e.g., 0, -1, true)"
                className="w-40 bg-msx-bgcolor border border-msx-border text-white rounded px-2 py-1 focus:outline-none"
              />
              <Button onClick={() => handleDeleteRow(v.id)} size="sm" variant="ghost" icon={<TrashIcon className="w-4 h-4"/>}>Delete</Button>
            </div>
          ))}
          {(!node.variables || node.variables.length === 0) && (
            <div className="text-sm text-msx-textsecondary italic">No variables configured</div>
          )}
        </div>
      </Panel>
    </div>
  );
};

