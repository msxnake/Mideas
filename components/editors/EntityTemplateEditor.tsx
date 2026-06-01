import React, { useState, useEffect, useMemo } from 'react';
import { EntityTemplate, ComponentDefinition, EntityTemplateComponent, ComponentPropertyDefinition, ProjectAsset, Msx2ProjectProfile } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { Tooltip } from '../common/Tooltip';
import { PlusCircleIcon, TrashIcon, SaveIcon, PuzzlePieceIcon, CaretDownIcon, CaretRightIcon, SpriteIcon, CodeIcon, LoadIcon, DocumentPlusIcon } from '../icons/MsxIcons';
import { ConfirmationModal } from '../modals/ConfirmationModal';
import { AssetPickerModal } from '../modals/AssetPickerModal';
import { DEFAULT_ENTITY_TEMPLATES } from '../../data/defaults';
import { GLOBAL_PLAYER_TEMPLATES, createProjectPlayerTemplate } from '../../data/playerLibrary';
import { downloadTextFile } from '../../utils/downloadUtils';
import { BEHAVIOR_DIRECTION_OPTIONS, BEHAVIOR_TYPE_OPTIONS, isBehaviorComponentProperty } from '../../utils/behaviorComponentOptions';
import {
  createPlayerKitPackage,
  parsePlayerKitPackage,
  remapPlayerKitForImport,
  sanitizePlayerKitFilename,
} from '../../utils/playerKitUtils';
import {
  getProjectTargetFromScreenMode,
  isComponentDefinitionEnabledForProject,
  isEntityTemplateEnabledForProject,
  filterEntityTemplatesForProject,
  isScreen4Project,
} from '../../utils/projectTarget';
import { getMsx2ProfileEntityLabels } from '../../utils/msx2ProjectProfiles';

/**
 * Props for the EntityTemplateEditor component.
 */
interface EntityTemplateEditorProps {
  /** The current list of entity templates. */
  entityTemplates: EntityTemplate[];
  /** Callback to update the list of entity templates. */
  onUpdateEntityTemplates: (updatedTemplates: EntityTemplate[]) => void;
  /** Callback to update component definitions when a Player Kit brings missing custom components. */
  onUpdateComponentDefinitions?: (updatedDefinitions: ComponentDefinition[]) => void;
  /** Callback to create referenced assets when importing a Player Kit. */
  onCreateAssets?: (assetsToCreate: ProjectAsset[]) => void;
  /** The list of all available component definitions. */
  componentDefinitions: ComponentDefinition[];
  /** Callback to trigger the generation of assembly code for all templates. */
  onGenerateAsm: () => void;
  /** A list of all project assets, used for asset reference picking. */
  allAssets: ProjectAsset[];
  /** Optional status message sink. */
  setStatusBarMessage?: (message: string) => void;
  currentScreenMode: string;
  msx2ProjectProfile?: Msx2ProjectProfile | null;
}

/**
 * A full-screen editor for creating, updating, and deleting entity templates.
 * Entity templates are pre-configured collections of components that define a type of entity in the game.
 */
export const EntityTemplateEditor: React.FC<EntityTemplateEditorProps> = ({
  entityTemplates,
  onUpdateEntityTemplates,
  onUpdateComponentDefinitions,
  onCreateAssets,
  componentDefinitions,
  onGenerateAsm,
  allAssets,
  setStatusBarMessage,
  currentScreenMode,
  msx2ProjectProfile = null,
}) => {
  const projectTarget = getProjectTargetFromScreenMode(currentScreenMode);
  const activeEntityTemplates = useMemo(() => filterEntityTemplatesForProject(
    entityTemplates,
    currentScreenMode,
    msx2ProjectProfile
  ), [entityTemplates, currentScreenMode, msx2ProjectProfile]);
  const activeComponentDefinitions = useMemo(() => componentDefinitions.filter(definition =>
    isComponentDefinitionEnabledForProject(definition, currentScreenMode)
  ), [componentDefinitions, currentScreenMode]);
  const profileEntityLabels = useMemo(
    () => (isScreen4Project(currentScreenMode) && msx2ProjectProfile ? getMsx2ProfileEntityLabels(msx2ProjectProfile) : []),
    [currentScreenMode, msx2ProjectProfile]
  );
  const projectPlayers = useMemo(
    () => activeEntityTemplates.filter(template => template.isPlayer || template.playerLibraryRole === 'projectPlayer'),
    [activeEntityTemplates]
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Partial<EntityTemplate> | null>(null);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<EntityTemplate | null>(null);
  const [expandedComponents, setExpandedComponents] = useState<Record<string,boolean>>({});
  const [isAddComponentModalOpen, setIsAddComponentModalOpen] = useState(false);
  const [isConfirmLoadDefaultsModalOpen, setIsConfirmLoadDefaultsModalOpen] = useState(false);
  
  const [assetPickerState, setAssetPickerState] = useState<{
    isOpen: boolean;
    assetTypeToPick: ProjectAsset['type'] | null;
    onSelect: ((assetId: string) => void) | null;
    currentValue: string | null;
  }>({ isOpen: false, assetTypeToPick: null, onSelect: null, currentValue: null });

  const assetsWithEntityTemplates = useMemo(() => {
    if (!entityTemplates || entityTemplates.length === 0) return allAssets;

    const existingTemplateIds = new Set(
      allAssets
        .filter(asset => asset.type === 'entitytemplate')
        .map(asset => asset.id)
    );

    const syntheticTemplateAssets = entityTemplates
      .filter(template => template && !existingTemplateIds.has(template.id))
      .map<ProjectAsset>(template => ({
        id: template.id,
        name: template.name || template.id,
        type: 'entitytemplate',
        data: template,
      }));

    return syntheticTemplateAssets.length > 0
      ? [...allAssets, ...syntheticTemplateAssets]
      : allAssets;
  }, [allAssets, entityTemplates]);


  useEffect(() => {
    if (selectedTemplateId) {
        if (editingTemplate && editingTemplate.id === selectedTemplateId &&
            !activeEntityTemplates.find(d => d.id === selectedTemplateId)) {
            return;
        }

        const templateFromList = activeEntityTemplates.find(t => t.id === selectedTemplateId);
        if (templateFromList) {
            // Limpiar defaultValues redundantes al cargar (para proyectos antiguos)
            const cleanedComponents = templateFromList.components.map(c => {
              const componentDef = activeComponentDefinitions.find(cd => cd.id === c.definitionId);
              if (!componentDef) return { ...c, defaultValues: { ...c.defaultValues } };

              // Crear nuevos defaultValues solo con valores diferentes del default
              const cleanedDefaultValues: Record<string, any> = {};
              Object.entries(c.defaultValues).forEach(([key, value]) => {
                const propertyDef = componentDef.properties.find(p => p.name === key);
                const definitionDefault = propertyDef?.defaultValue;

                // Normalizar para comparación (manejar diferencias de tipo string/number/boolean)
                const normalizedValue = String(value);
                const normalizedDefault = String(definitionDefault);

                // Solo mantener si es diferente del default de la definición
                if (normalizedValue !== normalizedDefault) {
                  cleanedDefaultValues[key] = value;
                }
              });

              return { ...c, defaultValues: cleanedDefaultValues };
            });

            setEditingTemplate({ ...templateFromList, components: cleanedComponents });
        } else {
             if (!(editingTemplate && editingTemplate.id === selectedTemplateId)) {
                setEditingTemplate(null);
            }
        }
    } else {
        setEditingTemplate(null);
    }
     setExpandedComponents({});
  }, [selectedTemplateId, activeEntityTemplates, activeComponentDefinitions]);


  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
  };

  const handleAddNewTemplate = () => {
    const newId = `tpl_${Date.now()}_${Math.random().toString(36).substring(2,7)}`;
    const newTpl: Partial<EntityTemplate> = {
      id: newId,
      name: `NewEntityTemplate_${entityTemplates.length + 1}`,
      target: projectTarget,
      icon: '❓',
      isPlayer: false,
      description: '',
      components: [],
    };
    setEditingTemplate(newTpl);
    setSelectedTemplateId(newId);
    setExpandedComponents({});
  };

  const handleCreatePlayerFromGlobalTemplate = (templateId: string) => {
    const playerTemplate = GLOBAL_PLAYER_TEMPLATES.find(template => template.templateId === templateId);
    if (!playerTemplate) return;

    const defaultName = playerTemplate.name.replace(/\s+/g, '_');
    const requestedName = window.prompt('Project player name:', defaultName);
    if (requestedName === null) return;

    const cleanName = requestedName.trim() || defaultName;
    const existingIds = new Set(entityTemplates.map(template => template.id));
    const projectPlayer = createProjectPlayerTemplate(playerTemplate, {
      name: cleanName,
      target: projectTarget,
      existingIds,
    });

    onUpdateEntityTemplates([...entityTemplates, projectPlayer]);
    setSelectedTemplateId(projectPlayer.id);
    setEditingTemplate(projectPlayer);
    setStatusBarMessage?.(`Created project player "${projectPlayer.name}" from "${playerTemplate.name}".`);
  };

  const handleTemplateChange = (
    field: keyof Omit<EntityTemplate, 'components' | 'id'>,
    value: string | boolean
  ) => {
    if (editingTemplate) {
      setEditingTemplate(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const handleComponentDefaultValueChange = (componentDefId: string, propertyName: string, value: any) => {
    if (editingTemplate && editingTemplate.components) {
      const newComponents = editingTemplate.components.map(c => {
        if (c.definitionId === componentDefId) {
          const componentDef = activeComponentDefinitions.find(cd => cd.id === componentDefId);
          const propertyDef = componentDef?.properties.find(p => p.name === propertyName);
          const definitionDefault = propertyDef?.defaultValue;

          // Solo guardar el valor si es diferente del default de la definición
          const newDefaultValues = { ...c.defaultValues };

          // Normalizar para comparación (manejar diferencias de tipo string/number/boolean)
          const normalizedValue = String(value);
          const normalizedDefault = String(definitionDefault);

          if (normalizedValue === normalizedDefault || (value === '' && definitionDefault === undefined)) {
            // Si el valor es igual al default, eliminarlo de defaultValues
            delete newDefaultValues[propertyName];
          } else {
            // Si es diferente, guardarlo
            newDefaultValues[propertyName] = value;
          }

          return { ...c, defaultValues: newDefaultValues };
        }
        return c;
      });
      setEditingTemplate(prev => prev ? { ...prev, components: newComponents } : null);
    }
  };

  const handleAddComponentToTemplate = (componentDefId: string) => {
    if (editingTemplate && !editingTemplate.components?.find(c => c.definitionId === componentDefId)) {
      const componentDef = activeComponentDefinitions.find(cd => cd.id === componentDefId);
      if (!componentDef) return;

      // Solo guardar defaultValues vacío - los valores reales vienen de la definición del componente
      // Solo se guardarán valores cuando el usuario los modifique explícitamente
      const newTemplateComponent: EntityTemplateComponent = {
        definitionId: componentDefId,
        defaultValues: {},
      };

      setEditingTemplate(prev => ({
        ...prev,
        components: [...(prev?.components || []), newTemplateComponent],
      }));
    }
    setIsAddComponentModalOpen(false);
  };

  const handleRemoveComponentFromTemplate = (componentDefId: string) => {
    if (editingTemplate && editingTemplate.components) {
      setEditingTemplate(prev => ({
        ...prev,
        components: prev?.components?.filter(c => c.definitionId !== componentDefId),
      }));
    }
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate || !editingTemplate.id || !editingTemplate.name?.trim()) {
      alert("Template ID and Name are required.");
      return;
    }
    const finalTemplate = { target: projectTarget, ...editingTemplate } as EntityTemplate;
    const existingIndex = entityTemplates.findIndex(t => t.id === finalTemplate.id);

    if (existingIndex > -1) {
       if (entityTemplates.some(t => t.name.toLowerCase() === finalTemplate.name.toLowerCase() && t.id !== finalTemplate.id)) {
        alert(`An entity template with the name "${finalTemplate.name}" already exists.`);
        return;
      }
      const updated = [...entityTemplates];
      updated[existingIndex] = finalTemplate;
      onUpdateEntityTemplates(updated);
    } else {
       if (entityTemplates.some(t => t.name.toLowerCase() === finalTemplate.name.toLowerCase())) {
        alert(`An entity template with the name "${finalTemplate.name}" already exists.`);
        return;
      }
      onUpdateEntityTemplates([...entityTemplates, finalTemplate]);
    }
  };
  
  const handleDeleteTemplate = (template: EntityTemplate | null) => {
    if (template) {
        setTemplateToDelete(template);
        setIsConfirmDeleteModalOpen(true);
    }
  };

  const confirmDelete = () => {
    if (templateToDelete) {
        onUpdateEntityTemplates(entityTemplates.filter(t => t.id !== templateToDelete.id));
        if (selectedTemplateId === templateToDelete.id) {
            setSelectedTemplateId(null);
            setEditingTemplate(null);
        }
    }
    setIsConfirmDeleteModalOpen(false);
    setTemplateToDelete(null);
  };

  const handleExportEntityTemplates = () => {
    const exportData = {
      type: 'entity_templates',
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: entityTemplates
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `entity_templates_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportEntityTemplates = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const importData = JSON.parse(event.target?.result as string);
            
            if (importData.type !== 'entity_templates' || !Array.isArray(importData.data)) {
              alert('Invalid entity templates file format.');
              return;
            }

            // Validate the imported data structure
            const isValidEntityTemplate = (template: any): template is EntityTemplate => {
              return template && 
                     typeof template.id === 'string' && 
                     typeof template.name === 'string' && 
                     Array.isArray(template.components) &&
                     template.components.every((comp: any) => 
                       comp && typeof comp.definitionId === 'string' && typeof comp.defaultValues === 'object'
                     );
            };

            const validTemplates = importData.data
              .filter(isValidEntityTemplate)
              .map((template: EntityTemplate) => ({ ...template, target: template.target || projectTarget }))
              .filter((template: EntityTemplate) =>
                isEntityTemplateEnabledForProject(template, currentScreenMode)
              );
            
            if (validTemplates.length === 0) {
              alert('No valid entity templates found in the file.');
              return;
            }

            // Merge with existing templates, handling ID conflicts
            const existingIds = new Set(entityTemplates.map(t => t.id));
            const mergedTemplates = [...entityTemplates];
            
            validTemplates.forEach((importedTemplate: EntityTemplate) => {
              if (existingIds.has(importedTemplate.id)) {
                // Create new ID for conflicting templates
                const newId = `${importedTemplate.id}_imported_${Date.now()}`;
                mergedTemplates.push({ ...importedTemplate, id: newId });
              } else {
                mergedTemplates.push(importedTemplate);
              }
            });

            onUpdateEntityTemplates(mergedTemplates);
            alert(`Successfully imported ${validTemplates.length} entity template(s).`);
          } catch (error) {
            alert('Error reading entity templates file. Please ensure it\'s a valid JSON file.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleExportPlayerKit = () => {
    const templateToExport = entityTemplates.find(template => template.id === selectedTemplateId);
    if (!templateToExport) {
      alert('Select a saved entity template before exporting a Player Kit.');
      return;
    }

    const playerKit = createPlayerKitPackage(templateToExport, entityTemplates, componentDefinitions, allAssets);
    const filename = `${sanitizePlayerKitFilename(templateToExport.name)}.player-kit.json`;
    downloadTextFile(filename, JSON.stringify(playerKit, null, 2), 'application/json');
    setStatusBarMessage?.(`Exported Player Kit "${templateToExport.name}" with ${playerKit.assets.length} asset(s).`);
  };

  const handleImportPlayerKit = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const packageData = parsePlayerKitPackage(String(event.target?.result || ''));
          const remapped = remapPlayerKitForImport(
            packageData,
            entityTemplates,
            componentDefinitions,
            allAssets
          );
          const componentDefinitionsToImport = remapped.componentDefinitionsToImport
            .map(definition => ({ ...definition, target: definition.target || projectTarget }))
            .filter(definition => isComponentDefinitionEnabledForProject(definition, currentScreenMode));
          const templatesToImport = remapped.templatesToImport
            .map(template => ({ ...template, target: template.target || projectTarget }))
            .filter(template => isEntityTemplateEnabledForProject(template, currentScreenMode));

          if (componentDefinitionsToImport.length > 0) {
            onUpdateComponentDefinitions?.([
              ...componentDefinitions,
              ...componentDefinitionsToImport,
            ]);
          }

          if (remapped.assetsToCreate.length > 0) {
            onCreateAssets?.(remapped.assetsToCreate);
          }

          onUpdateEntityTemplates([
            ...entityTemplates,
            ...templatesToImport,
          ]);
          if (templatesToImport.some(template => template.id === remapped.rootTemplateId)) {
            setSelectedTemplateId(remapped.rootTemplateId);
          }
          setStatusBarMessage?.(
            `Imported Player Kit with ${templatesToImport.length} template(s), ${remapped.assetsToCreate.length} asset(s).`
          );
        } catch (error) {
          console.error('Error importing Player Kit:', error);
          alert('Error reading Player Kit file. Please ensure it is a valid .player-kit.json file.');
        }
      };
      reader.onerror = () => {
        alert('Could not read the selected Player Kit file.');
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleLoadDefaults = () => {
    setIsConfirmLoadDefaultsModalOpen(true);
  };

  const handleConfirmLoadDefaults = () => {
    onUpdateEntityTemplates(filterEntityTemplatesForProject(
      DEFAULT_ENTITY_TEMPLATES,
      currentScreenMode,
      msx2ProjectProfile
    ));
    setSelectedTemplateId(null);
    setEditingTemplate(null);
    setIsConfirmLoadDefaultsModalOpen(false);
  };

  const openAssetPicker = (
    propertyType: ComponentPropertyDefinition['type'],
    currentValue: string,
    onSelectCallback: (assetId: string) => void
  ) => {
    const assetTypeMap: Record<string, ProjectAsset['type']> = {
        'sprite_ref': 'sprite',
        'msx2sprite_ref': 'msx2sprite',
        'sound_ref': 'sound',
        'behavior_script_ref': 'behavior',
        'entity_template_ref': 'entitytemplate',
        'statemachine_ref': 'statemachine',
        'tile_ref': 'tile',
        'dialogue_ref': 'dialogue',
    };
    const assetType = assetTypeMap[propertyType];
    if (!assetType) return;

    setAssetPickerState({
        isOpen: true,
        assetTypeToPick: assetType,
        onSelect: onSelectCallback,
        currentValue: currentValue,
    });
  };

  const toggleComponentExpansion = (componentDefId: string) => {
    setExpandedComponents(prev => ({...prev, [componentDefId]: !prev[componentDefId]}));
  };

  const getComponentPropertyOriginalDefault = (defId: string, propName: string): string => {
    const compDef = componentDefinitions.find(cd => cd.id === defId);
    const propDef = compDef?.properties.find(p => p.name === propName);
    return String(propDef?.defaultValue ?? '');
  };


  return (
    <Panel title="Entity Template Editor" icon={<SpriteIcon className="w-5 h-5 text-msx-textprimary" />} className="flex-grow flex flex-col !p-0">
      <div className="flex flex-grow overflow-hidden" style={{ userSelect: 'none' }}>
        <div className="w-1/3 border-r border-msx-border p-2 overflow-y-auto">
          <div className="flex space-x-2 mb-2">
              <Button onClick={handleAddNewTemplate} variant="secondary" size="sm" icon={<PlusCircleIcon />} className="flex-1">
                Add New
              </Button>
          </div>
          <div className="flex space-x-1 mb-2">
            <Button onClick={handleExportEntityTemplates} variant="ghost" size="sm" icon={<SaveIcon />} className="flex-1" title="Export all entity templates">
              Export
            </Button>
            <Button onClick={handleImportEntityTemplates} variant="ghost" size="sm" icon={<LoadIcon />} className="flex-1" title="Import entity templates">
              Import
            </Button>
          </div>
          <div className="flex space-x-1 mb-2">
            <Button onClick={handleExportPlayerKit} variant="ghost" size="sm" icon={<SaveIcon />} className="flex-1" title="Export selected template with referenced assets and State Machines" disabled={!selectedTemplateId || !entityTemplates.some(template => template.id === selectedTemplateId)}>
              Export Kit
            </Button>
            <Button onClick={handleImportPlayerKit} variant="ghost" size="sm" icon={<LoadIcon />} className="flex-1" title="Import a Player Kit with templates, components and assets">
              Import Kit
            </Button>
          </div>
          <div className="mb-2">
            <Button onClick={handleLoadDefaults} variant="warning" size="sm" icon={<DocumentPlusIcon />} className="w-full" title="Load default entity templates">
              Default entities
            </Button>
          </div>
          {profileEntityLabels.length > 0 && (
            <p className="text-[11px] text-msx-textsecondary mb-2 leading-snug">
              {msx2ProjectProfile?.label} profile: {profileEntityLabels.join(', ')}
            </p>
          )}

          <div className="mb-3 border border-msx-border rounded p-2 bg-msx-bgcolor/40">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-semibold text-msx-highlight">Global Player Library</h3>
              <span className="text-[10px] text-msx-textsecondary">{GLOBAL_PLAYER_TEMPLATES.length} templates</span>
            </div>
            <div className="space-y-1">
              {GLOBAL_PLAYER_TEMPLATES.map(template => (
                <button
                  key={template.templateId}
                  onClick={() => handleCreatePlayerFromGlobalTemplate(template.templateId)}
                  className="w-full text-left px-2 py-1.5 rounded border border-msx-border/40 bg-msx-panelbg hover:bg-msx-border text-msx-textprimary"
                  title={`${template.description || template.name}. CPU ${template.budget.cpu}, RAM ${template.budget.ram}, sprites ${template.budget.sprites}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs truncate">{template.name}</span>
                    <span className="text-[10px] uppercase text-msx-cyan shrink-0">{template.category}</span>
                  </div>
                  <div className="text-[10px] text-msx-textsecondary">
                    CPU {template.budget.cpu} | RAM {template.budget.ram} | SPR {template.budget.sprites}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-msx-textsecondary">Project Players</h3>
              <span className="text-[10px] text-msx-textsecondary">{projectPlayers.length}</span>
            </div>
          </div>

          {activeEntityTemplates.length === 0 && <p className="text-xs text-msx-textsecondary italic">No {projectTarget} templates defined.</p>}
          <ul className="space-y-1">
            {activeEntityTemplates.map(tpl => (
              <li key={tpl.id}>
                <button
                  onClick={() => handleSelectTemplate(tpl.id)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs ${selectedTemplateId === tpl.id ? 'bg-msx-accent text-white' : 'bg-msx-panelbg hover:bg-msx-border text-msx-textprimary'}`}
                >
                  {tpl.icon} {tpl.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="w-2/3 p-3 overflow-y-auto">
          {!editingTemplate ? (
            <p className="text-msx-textsecondary text-center mt-10">Select an entity template to edit or add a new one.</p>
          ) : (
            <div className="space-y-3">
              <div>
                <label htmlFor="tplName" className="block text-sm font-medium text-msx-textsecondary">Template Name:</label>
                <input type="text" id="tplName" value={editingTemplate.name || ''} onChange={e => handleTemplateChange('name', e.target.value)} className="w-full p-1.5 text-sm bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary"/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="tplIcon" className="block text-sm font-medium text-msx-textsecondary">Icon (Emoji/Char):</label>
                  <input type="text" id="tplIcon" value={editingTemplate.icon || ''} onChange={e => handleTemplateChange('icon', e.target.value)} maxLength={2} className="w-full p-1.5 text-sm bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary"/>
                </div>
                <label className="flex items-center gap-2 self-end rounded border border-msx-border px-3 py-2 text-sm text-msx-textprimary">
                  <input
                    type="checkbox"
                    checked={!!editingTemplate.isPlayer}
                    onChange={e => handleTemplateChange('isPlayer', e.target.checked)}
                  />
                  <span>Is Player</span>
                </label>
              </div>
              <div>
                <label htmlFor="tplDesc" className="block text-sm font-medium text-msx-textsecondary">Description:</label>
                <textarea id="tplDesc" value={editingTemplate.description || ''} onChange={e => handleTemplateChange('description', e.target.value)} rows={2} className="w-full p-1.5 text-sm bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary"/>
              </div>

              <Panel title="Assigned Components" icon={<PuzzlePieceIcon className="w-3 h-3"/>} className="shadow-sm">
                <Button onClick={() => setIsAddComponentModalOpen(true)} variant="secondary" size="sm" icon={<PlusCircleIcon />} className="mb-2">Add Component</Button>
                <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                  {editingTemplate.components?.map(tc => {
                    const compDef = activeComponentDefinitions.find(cd => cd.id === tc.definitionId);
                    if (!compDef) return <div key={tc.definitionId} className="text-xs text-red-500">Error: Component Definition "{tc.definitionId}" not found.</div>;
                    const isExpanded = !!expandedComponents[tc.definitionId];
                    return (
                      <div key={tc.definitionId} className="p-1.5 border border-msx-border/50 rounded bg-msx-bgcolor/50">
                        <div className="flex justify-between items-center">
                          <button onClick={() => toggleComponentExpansion(tc.definitionId)} className="flex items-center text-xs text-msx-cyan hover:text-msx-highlight">
                            {isExpanded ? <CaretDownIcon className="w-2.5 h-2.5 mr-1"/> : <CaretRightIcon className="w-2.5 h-2.5 mr-1"/>}
                            {compDef.name}
                          </button>
                          <Tooltip text="Remove component from template"><Button onClick={() => handleRemoveComponentFromTemplate(tc.definitionId)} variant="danger" size="sm" icon={<TrashIcon className="w-3 h-3"/>} className="!p-0.5">{null}</Button></Tooltip>
                        </div>
                        {isExpanded && (
                           <div className="mt-1.5 pl-2 space-y-1 border-l border-msx-border/30">
                                {compDef.properties.map(propDef => {
                                    const overrideValue = tc.defaultValues[propDef.name];
                                    const definitionDefaultValue = propDef.defaultValue;
                                    const currentValue = overrideValue !== undefined ? overrideValue : definitionDefaultValue;
                                    const isRefType = propDef.type.endsWith('_ref');
                                    const isBehaviorType = isBehaviorComponentProperty(compDef.id, propDef.name, 'behaviorType');
                                    const isBehaviorInitialDirection = isBehaviorComponentProperty(compDef.id, propDef.name, 'initialDirection');

                                    return (
                                        <div key={propDef.name} className="text-xs">
                                            <label className="block text-msx-textsecondary text-[0.65rem] mb-0.5">
                                                {propDef.name} <span className="text-msx-textprimary/70">({propDef.type})</span>
                                                <span className="italic text-msx-textsecondary/70 ml-1">(Def: {getComponentPropertyOriginalDefault(compDef.id, propDef.name)})</span>
                                            </label>
                                            {isBehaviorType ? (
                                                <select
                                                    value={String(currentValue ?? 'none')}
                                                    onChange={e => handleComponentDefaultValueChange(compDef.id, propDef.name, e.target.value)}
                                                    className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
                                                >
                                                    {BEHAVIOR_TYPE_OPTIONS.map(option => (
                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                    ))}
                                                </select>
                                            ) : isBehaviorInitialDirection ? (
                                                <select
                                                    value={String(currentValue ?? 'right')}
                                                    onChange={e => handleComponentDefaultValueChange(compDef.id, propDef.name, e.target.value)}
                                                    className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
                                                >
                                                    {BEHAVIOR_DIRECTION_OPTIONS.map(option => (
                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                    ))}
                                                </select>
                                            ) : isRefType ? (
                                                <div className="flex items-center space-x-1">
                                                    <span className="p-1 bg-msx-bgcolor border border-msx-border/30 rounded text-msx-textsecondary flex-grow truncate" title={currentValue || "None"}>
                                                        {assetsWithEntityTemplates.find(a => a.id === currentValue)?.name || "None"}
                                                    </span>
                                                    <Button size="sm" variant="secondary" onClick={() => openAssetPicker(propDef.type, currentValue, (assetId) => handleComponentDefaultValueChange(compDef.id, propDef.name, assetId))}>...</Button>
                                                </div>
                                            ) : propDef.type === 'boolean' ? (
                                                <input type="checkbox" checked={currentValue === true || String(currentValue).toLowerCase() === 'true'} onChange={e => handleComponentDefaultValueChange(compDef.id, propDef.name, e.target.checked)} className="form-checkbox ml-1 bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent"/>
                                            ) : (
                                                <input type={propDef.type === 'byte' || propDef.type === 'word' ? 'number' : 'text'} value={String(currentValue ?? '')} onChange={e => handleComponentDefaultValueChange(compDef.id, propDef.name, e.target.value)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded" placeholder={`Default for ${propDef.name}`}/>
                                            )}
                                        </div>
                                    );
                                })}
                           </div>
                        )}
                      </div>
                    );
                  })}
                  {(!editingTemplate.components || editingTemplate.components.length === 0) && <p className="text-xs text-msx-textsecondary italic">No components assigned.</p>}
                </div>
              </Panel>

              <div className="flex justify-end space-x-2 mt-4">
                <Button onClick={() => handleDeleteTemplate(editingTemplate as EntityTemplate)} variant="danger" disabled={!entityTemplates.find(t => t.id === editingTemplate?.id)}>
                  Delete Template
                </Button>
                <Button onClick={handleSaveTemplate} variant="primary" icon={<SaveIcon/>}>
                  Save Template
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {assetPickerState.isOpen && (
        <AssetPickerModal
            isOpen={assetPickerState.isOpen}
            onClose={() => setAssetPickerState({ isOpen: false, assetTypeToPick: null, onSelect: null, currentValue: null })}
            onSelectAsset={(assetId) => {
                assetPickerState.onSelect?.(assetId);
                setAssetPickerState({ isOpen: false, assetTypeToPick: null, onSelect: null, currentValue: null });
            }}
            assetTypeToPick={assetPickerState.assetTypeToPick!}
            allAssets={assetsWithEntityTemplates}
            currentSelectedId={assetPickerState.currentValue}
        />
      )}

      {isAddComponentModalOpen && editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn" onClick={() => setIsAddComponentModalOpen(false)}>
          <div className="bg-msx-panelbg p-4 rounded-lg shadow-xl w-full max-w-sm animate-slideIn" onClick={e => e.stopPropagation()}>
            <h4 className="text-md text-msx-highlight mb-3">Add Component to Template</h4>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {activeComponentDefinitions.filter(cd => !editingTemplate.components?.find(c => c.definitionId === cd.id)).map(cd => (
                <Button key={cd.id} onClick={() => handleAddComponentToTemplate(cd.id)} variant="ghost" className="w-full justify-start text-xs">
                  {cd.name}
                </Button>
              ))}
              {activeComponentDefinitions.filter(cd => !editingTemplate.components?.find(c => c.definitionId === cd.id)).length === 0 && (
                <p className="text-xs text-msx-textsecondary italic p-2">All available components are already added or no components defined.</p>
              )}
            </div>
            <Button onClick={() => setIsAddComponentModalOpen(false)} variant="primary" size="sm" className="mt-3 w-full">Close</Button>
          </div>
        </div>
      )}
       {isConfirmDeleteModalOpen && templateToDelete && (
        <ConfirmationModal
            isOpen={isConfirmDeleteModalOpen}
            title="Delete Entity Template"
            message={<>Are you sure you want to delete template "<strong>{templateToDelete.name}</strong>"? This cannot be undone and may affect existing entity instances.</>}
            onConfirm={confirmDelete}
            onCancel={() => setIsConfirmDeleteModalOpen(false)}
            confirmButtonVariant="danger"
        />
      )}
      {isConfirmLoadDefaultsModalOpen && (
        <ConfirmationModal
            isOpen={isConfirmLoadDefaultsModalOpen}
            title="Load Default Entities"
            message="Are you sure? Your Entity Templates will be erased and replaced with default templates."
            onConfirm={handleConfirmLoadDefaults}
            onCancel={() => setIsConfirmLoadDefaultsModalOpen(false)}
            confirmButtonVariant="warning"
        />
      )}
    </Panel>
  );
};
