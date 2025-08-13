


import React from 'react';
import { BehaviorScript, Snippet } from '../../types';
import { CodeEditor } from './CodeEditor'; // Re-use CodeEditor structure
import { Panel } from '../common/Panel';
import { SnippetsPanel } from '../common/SnippetsPanel';
import { Z80_BEHAVIOR_SNIPPETS } from '../../constants'; // Assuming specific snippets for behaviors

interface BehaviorEditorProps {
  behaviorScript: BehaviorScript;
  onUpdate: (data: Partial<BehaviorScript>) => void;
  onSnippetSelect: (snippet: Snippet) => void;
  userSnippets: Snippet[];
  onAddSnippet: (snippet: Snippet | null) => void;
  onEditSnippet: (snippet: Snippet) => void;
  onDeleteSnippet: (snippetId: string) => void;
  isSnippetsPanelEnabled: boolean;
}

export const BehaviorEditor: React.FC<BehaviorEditorProps> = ({
  behaviorScript,
  onUpdate,
  onSnippetSelect,
  userSnippets,
  onAddSnippet,
  onEditSnippet,
  onDeleteSnippet,
  isSnippetsPanelEnabled
}) => {
  const [snippetToInsert, setSnippetToInsert] = React.useState<{ code: string; timestamp: number } | null>(null);

  const handleCodeUpdate = (newCode: string) => {
    onUpdate({ code: newCode });
  };
  
  const handleLocalSnippetSelect = (snippet: Snippet) => {
    // This component receives the full snippet and passes it up to App.tsx
    // The App component will resolve it and pass the final code back down via props.
    onSnippetSelect(snippet);
  }

  // Combine default behavior snippets with user snippets
  const allBehaviorSnippets = React.useMemo(() => {
    const defaultSnippetsWithIds = Z80_BEHAVIOR_SNIPPETS.map((s, idx) => ({
        id: `default_behavior_${idx}_${s.name.toLowerCase().replace(/\s+/g, '_')}`,
        ...s
    }));
    return [...defaultSnippetsWithIds, ...userSnippets.filter(us => !defaultSnippetsWithIds.find(ds => ds.name === us.name))];
  }, [userSnippets]);


  return (
    <Panel title={`Behavior Editor: ${behaviorScript.name}`} className="flex-grow flex flex-col h-full overflow-hidden">
      <div className="flex flex-grow h-full overflow-hidden">
        <div className="flex-grow h-full">
          <CodeEditor
            code={behaviorScript.code}
            onUpdate={handleCodeUpdate}
            language="z80" // Assuming Z80 for now
            assetName={behaviorScript.name}
            snippetToInsert={snippetToInsert}
          />
        </div>
        {isSnippetsPanelEnabled && (
            <SnippetsPanel 
                snippets={allBehaviorSnippets} 
                onSnippetSelect={handleLocalSnippetSelect} 
                isEnabled={true} 
                onAddSnippet={() => onAddSnippet(null)} // Allow adding global snippets from here too
                onEditSnippet={onEditSnippet}
                onDeleteSnippet={onDeleteSnippet}
            />
        )}
      </div>
    </Panel>
  );
};