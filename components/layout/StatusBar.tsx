

import React from 'react';

interface StatusBarProps {
  message: string;
  details?: string; // Can be current asset name or current project name
}

export const StatusBar: React.FC<StatusBarProps> = ({ message, details }) => {
  return (
    <div className="bg-msx-panelbg border-t border-msx-border px-3 py-1.5 text-xs text-msx-textsecondary flex justify-between items-center shadow-inner">
      <span className="font-sans truncate">{message}</span>
      {details && <span className="pixel-font text-msx-highlight hidden sm:inline truncate" title={details}>{details}</span>}
    </div>
  );
};
