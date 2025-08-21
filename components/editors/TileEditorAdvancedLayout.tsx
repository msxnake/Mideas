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
        gridTemplateColumns: '280px 1fr 280px',
        gap: '16px',
        width: '100%',
        height: '100%',
        alignItems: 'start',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {columnaIzquierda}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        {columnaCentral}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {columnaDerecha}
      </div>
    </div>
  );
};
