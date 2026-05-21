import React from 'react';
import { ImageIcon } from '../icons/MsxIcons';
import { Panel } from '../common/Panel';

const PNG_MSX_TOOL_URL = `${import.meta.env.BASE_URL}tools/png-msx-chars/index.html`;

export const PngMsxCharsTool: React.FC = () => {
  return (
    <Panel
      title="MSX1 PNG a Screen 2 Chars"
      icon={<ImageIcon className="w-5 h-5 text-msx-textprimary" />}
      className="flex-grow flex flex-col !p-0"
      bodyClassName="p-0 flex-grow overflow-hidden"
    >
      <iframe
        src={PNG_MSX_TOOL_URL}
        title="MSX1 PNG a Screen 2 Chars"
        className="w-full h-full border-0 bg-msx-bgcolor"
      />
    </Panel>
  );
};
