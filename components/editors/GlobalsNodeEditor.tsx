import React, { useEffect, useMemo } from 'react';
import { GameFlowGlobalsNode, ProjectAsset } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PlusCircleIcon, TrashIcon } from '../icons/MsxIcons';
import { MideasGlobalVariable } from '../../constants';

interface GlobalsNodeEditorProps {
  node: GameFlowGlobalsNode;
  onNodeChange: (newNode: GameFlowGlobalsNode) => void;
  allAssets?: ProjectAsset[];
}

export const GlobalsNodeEditor: React.FC<GlobalsNodeEditorProps> = ({
  node,
  onNodeChange,
  allAssets = [],
}) => {
  const globalVariablesAssets = useMemo(
    () => allAssets.filter(asset => asset.type === 'globalvariables'),
    [allAssets]
  );

  const selectedAssetId = node.globalVariablesAssetId || globalVariablesAssets[0]?.id || '';

  const customVariables = useMemo(() => {
    const asset = globalVariablesAssets.find(a => a.id === selectedAssetId);
    if (!asset?.data) return [];
    return ((asset.data as any).customVariables || []) as MideasGlobalVariable[];
  }, [globalVariablesAssets, selectedAssetId]);

  useEffect(() => {
    if (!node.globalVariablesAssetId && globalVariablesAssets.length > 0) {
      onNodeChange({ ...node, globalVariablesAssetId: globalVariablesAssets[0].id });
    }
  }, [globalVariablesAssets, node.globalVariablesAssetId, onNodeChange]);

  const getDefaultValueForVariable = (variable?: MideasGlobalVariable): string => {
    if (!variable) return '0';
    const type = (variable.type || '').toLowerCase();
    if (type === 'boolean') return 'false';
    if (variable.values && variable.values.length > 0) {
      const first = variable.values[0];
      if (first.value === 'number') return '0';
      return `${first.value}`;
    }
    if (type === 'string') return '';
    return '0';
  };

  const customVariablesForAsset = (assetId: string): MideasGlobalVariable[] => {
    const asset = globalVariablesAssets.find(a => a.id === assetId);
    if (!asset?.data) return [];
    return ((asset.data as any).customVariables || []) as MideasGlobalVariable[];
  };

  const handleTitleChange = (val: string) => {
    onNodeChange({ ...node, title: val });
  };

  const handleAssetChange = (assetId: string) => {
    const assetVariables = customVariablesForAsset(assetId);
    const firstVariable = assetVariables[0];

    const updatedAssignments = (node.variables || []).map(assignment => {
      const stillExists = assetVariables.some(v => v.name === assignment.name);
      if (stillExists) return assignment;
      if (!firstVariable) return assignment;
      return {
        ...assignment,
        name: firstVariable.name,
        value: getDefaultValueForVariable(firstVariable),
      };
    });

    const newAssignments =
      updatedAssignments.length > 0
        ? updatedAssignments
        : firstVariable
          ? [{ id: `var_${Date.now()}`, name: firstVariable.name, value: getDefaultValueForVariable(firstVariable) }]
          : (node.variables || []);

    onNodeChange({
      ...node,
      globalVariablesAssetId: assetId,
      variables: newAssignments,
    });
  };

  const handleVarNameTextChange = (id: string, name: string) => {
    const updated = (node.variables || []).map(v => (v.id === id ? { ...v, name } : v));
    onNodeChange({ ...node, variables: updated });
  };

  const handleVarSelectionChange = (id: string, name: string) => {
    const variable = customVariables.find(v => v.name === name);
    const updated = (node.variables || []).map(v =>
      v.id === id ? { ...v, name, value: getDefaultValueForVariable(variable) } : v
    );
    onNodeChange({ ...node, variables: updated });
  };

  const handleVarValueChange = (id: string, value: string) => {
    const updated = (node.variables || []).map(v => (v.id === id ? { ...v, value } : v));
    onNodeChange({ ...node, variables: updated });
  };

  const handleAddRow = () => {
    const newId = `var_${Date.now()}`;
    const defaultVar = customVariables[0];
    const updated = [
      ...(node.variables || []),
      {
        id: newId,
        name: defaultVar?.name || 'NewVar',
        value: getDefaultValueForVariable(defaultVar),
      },
    ];
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
      <Panel title="Global Variables Asset">
        <div className="mb-2">
          <label className="block text-sm mb-1">Source Asset</label>
          <select
            value={selectedAssetId}
            onChange={(e) => handleAssetChange(e.target.value)}
            className="w-full bg-msx-bgcolor border border-msx-border text-white rounded px-2 py-1 focus:outline-none"
            disabled={globalVariablesAssets.length === 0}
          >
            {globalVariablesAssets.map(asset => (
              <option key={asset.id} value={asset.id}>{asset.name}</option>
            ))}
          </select>
          {globalVariablesAssets.length === 0 && (
            <p className="text-xs text-msx-textsecondary mt-1 italic">
              Create a GlobalVariables asset to pick variables from a list.
            </p>
          )}
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
              {customVariables.length > 0 ? (
                <select
                  value={v.name}
                  onChange={(e) => handleVarSelectionChange(v.id, e.target.value)}
                  className="flex-1 bg-msx-bgcolor border border-msx-border text-white rounded px-2 py-1 focus:outline-none"
                >
                  {customVariables.map(variable => (
                    <option key={variable.name} value={variable.name}>
                      {variable.name} ({variable.type})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={v.name}
                  onChange={(e) => handleVarNameTextChange(v.id, e.target.value)}
                  placeholder="Variable name (e.g., Ammo)"
                  className="flex-1 bg-msx-bgcolor border border-msx-border text-white rounded px-2 py-1 focus:outline-none"
                />
              )}

              {(() => {
                const variable = customVariables.find(cv => cv.name === v.name);
                const hasEnumValues = variable?.values && variable.values.length > 0 && variable.values[0].value !== 'number';
                if (variable?.type === 'boolean') {
                  return (
                    <select
                      value={v.value}
                      onChange={(e) => handleVarValueChange(v.id, e.target.value)}
                      className="w-40 bg-msx-bgcolor border border-msx-border text-white rounded px-2 py-1 focus:outline-none"
                    >
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  );
                }

                if (hasEnumValues) {
                  return (
                    <select
                      value={v.value}
                      onChange={(e) => handleVarValueChange(v.id, e.target.value)}
                      className="w-40 bg-msx-bgcolor border border-msx-border text-white rounded px-2 py-1 focus:outline-none"
                    >
                      {variable?.values.map(option => (
                        <option key={`${variable.name}-${option.label}`} value={`${option.value}`}>
                          {option.label} ({option.value})
                        </option>
                      ))}
                    </select>
                  );
                }

                if (variable?.type === 'string') {
                  return (
                    <input
                      type="text"
                      value={v.value}
                      onChange={(e) => handleVarValueChange(v.id, e.target.value)}
                      placeholder="Value"
                      className="w-40 bg-msx-bgcolor border border-msx-border text-white rounded px-2 py-1 focus:outline-none"
                    />
                  );
                }

                return (
                  <input
                    type="text"
                    inputMode="numeric"
                    value={v.value}
                    onChange={(e) => handleVarValueChange(v.id, e.target.value)}
                    placeholder="Value (e.g., 0, -1)"
                    className="w-40 bg-msx-bgcolor border border-msx-border text-white rounded px-2 py-1 focus:outline-none"
                  />
                );
              })()}
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
