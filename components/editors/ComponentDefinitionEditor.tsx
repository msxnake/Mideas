import React, { useState, useEffect, useRef } from 'react';
import { ComponentDefinition, ComponentPropertyDefinition } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PlusCircleIcon, TrashIcon, SaveIcon, PuzzlePieceIcon, UploadIcon, DownloadIcon } from '../icons/MsxIcons';
import { ConfirmationModal } from '../modals/ConfirmationModal';

interface ComponentDefinitionEditorProps {
  componentDefinitions: ComponentDefinition[];
  onUpdateComponentDefinitions: (updatedDefinitions: ComponentDefinition[]) => void;
}

const PROPERTY_TYPES: ComponentPropertyDefinition['type'][] = [
  'byte', 'word', 'boolean', 'string', 'color', 
  'sprite_ref', 'sound_ref', 'behavior_script_ref', 'entity_template_ref', 'statemachine_ref'
];

export const ComponentDefinitionEditor: React.FC<ComponentDefinitionEditorProps> = ({
  componentDefinitions,
  onUpdateComponentDefinitions,
}) => {
  const [selectedDefinitionId, setSelectedDefinitionId] = useState<string | null>(null);
  const [editingDefinition, setEditingDefinition] = useState<Partial<ComponentDefinition> | null>(null);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [definitionToDelete, setDefinitionToDelete] = useState<ComponentDefinition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedDefinitionId) {
        if (editingDefinition && editingDefinition.id === selectedDefinitionId && 
            !componentDefinitions.find(d => d.id === selectedDefinitionId)) {
            return; 
        }
        const defFromList = componentDefinitions.find(d => d.id === selectedDefinitionId);
        if (defFromList) {
            setEditingDefinition({ ...defFromList, properties: defFromList.properties.map(p => ({...p})) });
        } else {
            setEditingDefinition(null);
        }
    } else {
        setEditingDefinition(null);
    }
  }, [selectedDefinitionId, componentDefinitions]);

  const handleSelectDefinition = (id: string) => {
    setSelectedDefinitionId(id);
  };

  const handleAddNewDefinition = () => {
    const newId = `comp_def_${Date.now()}`;
    const newDef: Partial<ComponentDefinition> = {
      id: newId,
      name: 'NewComponent',
      description: '',
      properties: [],
    };
    setEditingDefinition(newDef); 
    setSelectedDefinitionId(newId);
  };

  const handleDefinitionChange = (field: keyof ComponentDefinition, value: string) => {
    if (editingDefinition) {
      setEditingDefinition(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const handlePropertyChange = (index: number, field: keyof ComponentPropertyDefinition, value: string) => {
    if (editingDefinition && editingDefinition.properties) {
      const newProperties = [...editingDefinition.properties];
      (newProperties[index] as any)[field] = value;
      setEditingDefinition(prev => prev ? { ...prev, properties: newProperties } : null);
    }
  };

  const handleAddProperty = () => {
    if (editingDefinition) {
      const newProperty: ComponentPropertyDefinition = {
        name: `newProperty${(editingDefinition.properties?.length || 0) + 1}`,
        type: 'byte',
        defaultValue: '0',
        description: '',
      };
      setEditingDefinition(prev => ({
        ...prev,
        properties: [...(prev?.properties || []), newProperty],
      }));
    }
  };

  const handleRemoveProperty = (index: number) => {
    if (editingDefinition && editingDefinition.properties) {
      const newProperties = editingDefinition.properties.filter((_, i) => i !== index);
      setEditingDefinition(prev => prev ? { ...prev, properties: newProperties } : null);
    }
  };

  const handleSaveDefinition = () => {
    if (!editingDefinition || !editingDefinition.id || !editingDefinition.name?.trim()) {
      alert("Component ID and Name are required.");
      return;
    }
    if (editingDefinition.properties?.some(p => !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(p.name))) {
        alert("Property names must be valid identifiers (letters, numbers, underscores, start with letter/underscore).");
        return;
    }
    const finalDefinition = { ...editingDefinition } as ComponentDefinition;
    const existingIndex = componentDefinitions.findIndex(d => d.id === finalDefinition.id);
    if (existingIndex > -1) {
      if (componentDefinitions.some(d => d.name.toLowerCase() === finalDefinition.name.toLowerCase() && d.id !== finalDefinition.id)) {
        alert(`A component definition with the name "${finalDefinition.name}" already exists.`);
        return;
      }
      const updated = [...componentDefinitions];
      updated[existingIndex] = finalDefinition;
      onUpdateComponentDefinitions(updated);
    } else {
       if (componentDefinitions.some(d => d.name.toLowerCase() === finalDefinition.name.toLowerCase())) {
        alert(`A component definition with the name "${finalDefinition.name}" already exists.`);
        return;
      }
      onUpdateComponentDefinitions([...componentDefinitions, finalDefinition]);
    }
  };

  const handleDeleteDefinition = (definition: ComponentDefinition | null) => {
    if (definition) {
        setDefinitionToDelete(definition);
        setIsConfirmDeleteModalOpen(true);
    }
  };

  const confirmDelete = () => {
    if (definitionToDelete) {
        onUpdateComponentDefinitions(componentDefinitions.filter(d => d.id !== definitionToDelete.id));
        if (selectedDefinitionId === definitionToDelete.id) {
            setSelectedDefinitionId(null);
            setEditingDefinition(null);
        }
    }
    setIsConfirmDeleteModalOpen(false);
    setDefinitionToDelete(null);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(componentDefinitions, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'components.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("File could not be read as text.");
        const importedDefs = JSON.parse(text) as ComponentDefinition[];

        if (!Array.isArray(importedDefs) || !importedDefs.every(def => def.id && def.name && Array.isArray(def.properties))) {
            throw new Error("Invalid JSON structure for component definitions.");
        }

        const updatedDefsMap = new Map(componentDefinitions.map(def => [def.id, def]));

        let importedCount = 0;
        let overwrittenCount = 0;

        importedDefs.forEach(importedDef => {
            if (updatedDefsMap.has(importedDef.id)) {
                overwrittenCount++;
            } else {
                importedCount++;
            }
            updatedDefsMap.set(importedDef.id, importedDef);
        });

        onUpdateComponentDefinitions(Array.from(updatedDefsMap.values()));
        alert(`${importedCount} new components imported.\n${overwrittenCount} existing components overwritten.`);

      } catch (error) {
        console.error("Error parsing or processing component definitions file:", error);
        alert(`Failed to import components: ${error.message}`);
      } finally {
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <Panel title="Component Definition Editor" icon={<PuzzlePieceIcon className="w-5 h-5 text-msx-textprimary" />} className="flex-grow flex flex-col !p-0">
      <div className="flex flex-grow overflow-hidden" style={{ userSelect: 'none' }}>
        <div className="w-1/3 border-r border-msx-border p-2 overflow-y-auto">
          <Button onClick={handleAddNewDefinition} variant="secondary" size="sm" icon={<PlusCircleIcon />} className="w-full mb-2">
            Add New Component
          </Button>
          <div className="flex space-x-2 mb-2">
            <Button onClick={handleImportClick} variant="secondary" size="sm" icon={<UploadIcon />} className="flex-1">Import</Button>
            <Button onClick={handleExport} variant="secondary" size="sm" icon={<DownloadIcon />} className="flex-1">Export</Button>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" style={{ display: 'none' }} />

          {componentDefinitions.length === 0 && <p className="text-xs text-msx-textsecondary italic">No components defined.</p>}
          <ul className="space-y-1">
            {componentDefinitions.map(def => (
              <li key={def.id}>
                <button
                  onClick={() => handleSelectDefinition(def.id)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs ${selectedDefinitionId === def.id ? 'bg-msx-accent text-white' : 'bg-msx-panelbg hover:bg-msx-border text-msx-textprimary'}`}
                >
                  {def.name} <span className="text-msx-textsecondary text-[0.65rem]">({def.id})</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="w-2/3 p-3 overflow-y-auto">
          {!editingDefinition ? (
            <p className="text-msx-textsecondary text-center mt-10">Select a component definition to edit or add a new one.</p>
          ) : (
            <div className="space-y-3">
              <div>
                <label htmlFor="compDefName" className="block text-sm font-medium text-msx-textsecondary">Component Name:</label>
                <input
                  type="text"
                  id="compDefName"
                  value={editingDefinition.name || ''}
                  onChange={e => handleDefinitionChange('name', e.target.value)}
                  className="w-full p-1.5 text-sm bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary"
                />
              </div>
              <div>
                <label htmlFor="compDefDesc" className="block text-sm font-medium text-msx-textsecondary">Description:</label>
                <textarea
                  id="compDefDesc"
                  value={editingDefinition.description || ''}
                  onChange={e => handleDefinitionChange('description', e.target.value)}
                  rows={2}
                  className="w-full p-1.5 text-sm bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary"
                />
              </div>

              <Panel title="Properties" icon={<PuzzlePieceIcon className="w-3 h-3"/>} className="shadow-sm">
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {editingDefinition.properties?.map((prop, index) => (
                    <div key={index} className="p-2 border border-msx-border/50 rounded bg-msx-bgcolor/50">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-msx-highlight">Property {index + 1}</span>
                        <Button onClick={() => handleRemoveProperty(index)} variant="danger" size="sm" icon={<TrashIcon className="w-3 h-3" />} className="!p-0.5">{null}</Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="block text-msx-textsecondary mb-0.5">Name:</label>
                          <input type="text" value={prop.name} onChange={e => handlePropertyChange(index, 'name', e.target.value)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                        </div>
                        <div>
                          <label className="block text-msx-textsecondary mb-0.5">Type:</label>
                          <select value={prop.type} onChange={e => handlePropertyChange(index, 'type', e.target.value)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded">
                            {PROPERTY_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-msx-textsecondary mb-0.5">Default Value (as string):</label>
                          <input type="text" value={String(prop.defaultValue ?? '')} onChange={e => handlePropertyChange(index, 'defaultValue', e.target.value)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-msx-textsecondary mb-0.5">Description:</label>
                          <input type="text" value={prop.description || ''} onChange={e => handlePropertyChange(index, 'description', e.target.value)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={handleAddProperty} variant="secondary" size="sm" icon={<PlusCircleIcon />} className="mt-2">Add Property</Button>
              </Panel>

              <div className="flex justify-end space-x-2 mt-4">
                <Button onClick={() => handleDeleteDefinition(editingDefinition as ComponentDefinition)} variant="danger" disabled={!componentDefinitions.find(d => d.id === editingDefinition?.id)}>
                  Delete Component
                </Button>
                <Button onClick={handleSaveDefinition} variant="primary" icon={<SaveIcon/>}>
                  Save Component
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
       {isConfirmDeleteModalOpen && definitionToDelete && (
        <ConfirmationModal
            isOpen={isConfirmDeleteModalOpen}
            title="Delete Component Definition"
            message={<>Are you sure you want to delete component "<strong>{definitionToDelete.name}</strong>"? This cannot be undone and may affect Entity Templates using it.</>}
            onConfirm={confirmDelete}
            onCancel={() => setIsConfirmDeleteModalOpen(false)}
            confirmButtonVariant="danger"
        />
      )}
    </Panel>
  );
};
