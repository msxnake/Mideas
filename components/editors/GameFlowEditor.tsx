import React from 'react';
import { Panel } from '../common/Panel';

export const GameFlowEditor: React.FC = () => {
  return (
    <Panel title="Game Flow Editor">
      <div className="p-4">
        <h2 className="text-xl text-msx-textprimary mb-4">Game Flow</h2>
        <p className="text-msx-textsecondary">
          This is the editor for the game flow. Here you will be able to create and manage the node-based game progression system.
        </p>
      </div>
    </Panel>
  );
};
