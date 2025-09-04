import React from 'react';

/**
 * Props for the Panel component.
 */
interface PanelProps {
  /** The title displayed in the panel's header. */
  title: string;
  /** The content to be displayed inside the panel. */
  children: React.ReactNode;
  /** Optional additional CSS classes for the panel container. */
  className?: string;
  /** Optional additional CSS classes for the panel title. */
  titleClassName?: string;
  /** An optional icon to display next to the title. */
  icon?: React.ReactNode;
  /** Optional buttons or other elements to display in the header. */
  headerButtons?: React.ReactNode;
}

/**
 * A general-purpose panel component with a header and content area.
 */
export const Panel: React.FC<PanelProps> = ({ title, children, className = '', titleClassName = '', icon, headerButtons }) => {
  return (
    <div className={`bg-msx-panelbg border border-msx-border rounded-md shadow-lg flex flex-col ${className}`}>
      <h3 className={`font-sans text-sm text-msx-textprimary p-2 border-b border-msx-border flex items-center ${titleClassName}`}> {/* Changed font and text color */}
        {icon && <span className="mr-2">{icon}</span>}
        <span className="flex-grow">{title}</span>
        {headerButtons && <div className="flex items-center space-x-1">{headerButtons}</div>}
      </h3>
      <div className="p-2 flex-grow overflow-auto">
        {children}
      </div>
    </div>
  );
};