
import React from 'react';
import { Panel } from '../common/Panel';
import { EntityTemplate } from '../../types'; // Changed from MockEntityType
import { SpriteIcon } from '../icons/MsxIcons'; 

interface EntityTypeListPanelProps {
  entityTypes: EntityTemplate[]; // Changed from MockEntityType[]
  selectedEntityTypeId: string | null;
  onSelectEntityType: (entityType: EntityTemplate | null) => void; // Changed
}

export const EntityTypeListPanel: React.FC<EntityTypeListPanelProps> = ({
  entityTypes,
  selectedEntityTypeId,
  onSelectEntityType,
}) => {
  return (
    <Panel title="Entity Templates" className="text-xs"> {/* Changed title */}
      <p className="text-msx-textsecondary text-[0.65rem] mb-1 p-1">
        Select an entity template to place on the screen.
      </p>
      <ul className="space-y-0.5">
        {entityTypes.map(template => ( // Changed variable name from type to template
          <li key={template.id}>
            <button
              onClick={() => onSelectEntityType(template)}
              className={`w-full text-left px-2 py-1.5 rounded flex items-center group text-xs
                ${selectedEntityTypeId === template.id
                  ? 'bg-msx-accent text-white'
                  : 'text-msx-textsecondary hover:bg-msx-border hover:text-msx-textprimary'
                }`}
              title={`Place ${template.name}`}
            >
              {template.icon ? (
                <span className="mr-1.5 text-sm">{template.icon}</span>
              ) : (
                <SpriteIcon className="w-3.5 h-3.5 mr-1.5 opacity-70" />
              )}
              <span className="truncate">{template.name}</span>
            </button>
          </li>
        ))}
        <li>
            <button
              onClick={() => onSelectEntityType(null)} // Allows deselecting/switching to a generic select tool
              className={`w-full text-left px-2 py-1.5 rounded flex items-center group text-xs
                ${selectedEntityTypeId === null 
                  ? 'bg-msx-highlight text-msx-bgcolor' 
                  : 'text-msx-textsecondary hover:bg-msx-border hover:text-msx-textprimary'
                }`}
              title="Select/Move Entity Tool"
            >
                 <SpriteIcon className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                Select/Move Entity
            </button>
        </li>
      </ul>
    </Panel>
  );
};
