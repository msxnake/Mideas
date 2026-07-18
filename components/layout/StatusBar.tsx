

import React from 'react';
import { getScreenModeDisplayName } from '../../utils/screenModeConfig';

/**
 * Props for the StatusBar component.
 */
interface StatusBarProps {
  /** The main message to display in the status bar. */
  message: string;
  /** Optional details to display on the right side, such as an asset or project name. */
  details?: string;
  /** Current MSX screen mode shown on the left. */
  screenMode?: string;
}

/**
 * A status bar component that displays messages and details at the bottom of the application.
 */
export const StatusBar: React.FC<StatusBarProps> = ({ message, details, screenMode }) => {
  return (
    <div className="bg-msx-panelbg border-t border-msx-border px-3 py-1.5 text-xs text-msx-textsecondary flex items-center gap-3 shadow-inner">
      {screenMode && (
        <span className="font-sans text-msx-textsecondary shrink-0">
          Mode: <span className="text-msx-highlight">{getScreenModeDisplayName(screenMode)}</span>
          <span className="opacity-50 ml-1">(locked)</span>
        </span>
      )}
      {screenMode && <span className="w-px h-3.5 bg-msx-border shrink-0" />}
      <span className="font-sans truncate flex-1">{message}</span>
      {details && <span className="pixel-font text-msx-highlight hidden sm:inline truncate shrink-0" title={details}>{details}</span>}
    </div>
  );
};
