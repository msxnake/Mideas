import React from 'react';

interface PanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  icon?: React.ReactNode;
  headerButtons?: React.ReactNode;
}

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