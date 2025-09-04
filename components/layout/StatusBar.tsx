

import React from 'react';

/**
 * Props for the StatusBar component.
 */
interface StatusBarProps {
  /** The main message to display in the status bar. */
  message: string;
  /** Optional details to display on the right side, such as an asset or project name. */
  details?: string;
}

/**
 * A status bar component that displays messages and details at the bottom of the application.
 */
export const StatusBar: React.FC<StatusBarProps> = ({ message, details }) => {
  return (
    <div className="bg-msx-panelbg border-t border-msx-border px-3 py-1.5 text-xs text-msx-textsecondary flex justify-between items-center shadow-inner">
      <span className="font-sans truncate">{message}</span>
      {details && <span className="pixel-font text-msx-highlight hidden sm:inline truncate" title={details}>{details}</span>}
    </div>
  );
};
