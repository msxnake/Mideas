import React from 'react';

interface TileEditorAdvancedLayoutProps {
  columnaIzquierda: React.ReactNode;
  columnaCentral: React.ReactNode;
  columnaDerecha: React.ReactNode;
}

export const TileEditorAdvancedLayout: React.FC<TileEditorAdvancedLayoutProps> = ({
  columnaIzquierda,
  columnaCentral,
  columnaDerecha,
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '350px 1fr 350px',
        gap: '16px',
        width: '100%',
        height: '100%',
        alignItems: 'stretch',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {columnaIzquierda}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        {columnaCentral}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '800px', overflowY: 'auto' }}>
        {columnaDerecha}
      </div>
    </div>
  );
};
