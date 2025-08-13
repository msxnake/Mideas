

import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Z80SyntaxHighlighter } from '../common/Z80SyntaxHighlighter';
import { WorldMapGraph, ConnectionDirection, ScreenMap, DataFormat } from '../../types';

interface ExportWorldMapASMModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldMapGraph: WorldMapGraph;
  availableScreenMaps: ScreenMap[];
  dataOutputFormat: DataFormat;
}

const MODAL_DEFAULT_FONT_SIZE = 13;
const MODAL_LINE_HEIGHT_MULTIPLIER = 1.5;

const generateWorldMapASMCode = (
  graph: WorldMapGraph,
  availableScreenMaps: ScreenMap[],
  dataFormat: DataFormat
): string => {
  const safeMapName = graph.name.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
  let asmString = `;; WORLD MAP: ${graph.name}\n`;
  asmString += `;; Nodes: ${graph.nodes.length}, Connections: ${graph.connections.length}\n`;
  asmString += `;; Grid Size: ${graph.gridSize}, Zoom: ${graph.zoomLevel.toFixed(2)}, Pan: X=${graph.panOffset.x.toFixed(0)},Y=${graph.panOffset.y.toFixed(0)}\n`;
  asmString += `;; Data Format: ${dataFormat.toUpperCase()}\n\n`;

  const formatNumber = (value: number): string => {
    return dataFormat === 'hex' ? `#${value.toString(16).padStart(2, '0').toUpperCase()}` : value.toString(10);
  };

  const directionToCode = (dir: ConnectionDirection): number => {
    switch (dir) {
      case 'north': return 0;
      case 'south': return 1;
      case 'east': return 2;
      case 'west': return 3;
      default: return 255; // Invalid
    }
  };

  const nodeIdToIndexMap = new Map<string, number>();
  graph.nodes.forEach((node, index) => {
    nodeIdToIndexMap.set(node.id, index);
  });

  asmString += `;; --- NODE DEFINITIONS ---\n`;
  asmString += `;; Format: Index, ScreenAssetID_Index (see table below)\n`;
  asmString += `${safeMapName}_NODES_COUNT EQU ${graph.nodes.length}\n`;
  if (graph.nodes.length > 0) {
    asmString += `${safeMapName}_NODES_DATA:\n`;
    graph.nodes.forEach((node, index) => {
      const screenAsset = availableScreenMaps.find(sm => sm.id === node.screenAssetId);
      const screenAssetIndex = availableScreenMaps.findIndex(sm => sm.id === node.screenAssetId);
      
      asmString += `    ;; Node ${index}: Name='${node.name}', Screen='${screenAsset?.name || node.screenAssetId}' (Asset ID: ${node.screenAssetId})${node.zone ? `, Zone='${node.zone}'`: ''}\n`;
      asmString += `    DB ${formatNumber(index)} ; Node Index\n`;
      asmString += `    DB ${formatNumber(screenAssetIndex !== -1 ? screenAssetIndex : 255)} ; Screen Asset Index (255 if not found)\n`;
      // Optionally, export X/Y for debug/editor use, but might not be needed by game runtime
      // asmString += `    DEFW ${formatNumber(node.position.x)}, ${formatNumber(node.position.y)} ; World X, Y (for editor reference)\n`;
    });
  }
  asmString += '\n';

  asmString += `;; --- CONNECTION DEFINITIONS ---\n`;
  asmString += `;; Format: FromNodeIndex, FromDirectionCode, ToNodeIndex, ToDirectionCode\n`;
  asmString += `;; Direction Codes: 0=North, 1=South, 2=East, 3=West\n`;
  asmString += `${safeMapName}_CONNECTIONS_COUNT EQU ${graph.connections.length}\n`;
  if (graph.connections.length > 0) {
    asmString += `${safeMapName}_CONNECTIONS_DATA:\n`;
    graph.connections.forEach((conn, index) => {
      const fromNode = graph.nodes.find(n => n.id === conn.fromNodeId);
      const toNode = graph.nodes.find(n => n.id === conn.toNodeId);
      asmString += `    ;; Conn ${index}: ${fromNode?.name}(${conn.fromDirection}) -> ${toNode?.name}(${conn.toDirection})\n`;
      asmString += `    DB ${formatNumber(nodeIdToIndexMap.get(conn.fromNodeId) ?? 255)}, ${formatNumber(directionToCode(conn.fromDirection))}, ${formatNumber(nodeIdToIndexMap.get(conn.toNodeId) ?? 255)}, ${formatNumber(directionToCode(conn.toDirection))}\n`;
    });
  }
  asmString += '\n';
  
  asmString += `;; --- START SCREEN --- \n`;
  const startNodeIndex = graph.startScreenNodeId ? nodeIdToIndexMap.get(graph.startScreenNodeId) : null;
  if (startNodeIndex !== null && startNodeIndex !== undefined) {
    const startNode = graph.nodes.find(n => n.id === graph.startScreenNodeId);
    asmString += `${safeMapName}_START_NODE_INDEX EQU ${formatNumber(startNodeIndex)} ; Corresponds to node '${startNode?.name}'\n\n`;
  } else {
    asmString += `${safeMapName}_START_NODE_INDEX EQU 255 ; No start node defined or invalid\n\n`;
  }

  asmString += `;; --- SCREEN ASSETS TABLE (Indices used in Node Data) ---\n`;
  asmString += `;; This table provides a reference for which screen asset each index corresponds to.\n`;
  if (availableScreenMaps.length > 0) {
    asmString += `${safeMapName}_SCREEN_ASSETS_TABLE:\n`;
    availableScreenMaps.forEach((sm, index) => {
        const screenLabel = sm.id.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
        asmString += `  ;; Index ${formatNumber(index)}: Screen '${sm.name}' (Asset ID: ${sm.id})\n`;
        asmString += `${screenLabel}_ASSET_INDEX EQU ${formatNumber(index)}\n`;
    });
  } else {
      asmString += `  ;; No screen maps available in project to list here.\n`;
  }
  asmString += `\n;; End of World Map Data for ${graph.name}\n`;

  return asmString;
};


export const ExportWorldMapASMModal: React.FC<ExportWorldMapASMModalProps> = ({
  isOpen,
  onClose,
  worldMapGraph,
  availableScreenMaps,
  dataOutputFormat,
}) => {
  const [asmCode, setAsmCode] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAsmCode(generateWorldMapASMCode(worldMapGraph, availableScreenMaps, dataOutputFormat));
    }
  }, [isOpen, worldMapGraph, availableScreenMaps, dataOutputFormat]);

  if (!isOpen) {
    return null;
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(asmCode)
      .then(() => alert('World Map ASM code copied to clipboard!'))
      .catch(err => console.error('Failed to copy World Map ASM code: ', err));
  };

  const handleDownloadASM = () => {
    const safeMapName = worldMapGraph.name.replace(/[^a-zA-Z0-9_]/g, '_');
    const filename = `${safeMapName}_worldmap.asm`;
    const blob = new Blob([asmCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const editorLineHeight = MODAL_DEFAULT_FONT_SIZE * MODAL_LINE_HEIGHT_MULTIPLIER;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exportWorldMapAsmModalTitle"
    >
      <div 
        className="bg-msx-panelbg p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-2xl animate-slideIn font-sans flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="exportWorldMapAsmModalTitle" className="text-md sm:text-lg text-msx-highlight mb-3 sm:mb-4">Export World Map ASM: {worldMapGraph.name}</h2>
        
        <div className="flex-grow overflow-hidden mb-3 sm:mb-4">
            <Z80SyntaxHighlighter 
                code={asmCode} 
                editorFontSize={MODAL_DEFAULT_FONT_SIZE}
                editorLineHeight={editorLineHeight}
            />
        </div>
        <p className="text-xs text-msx-textsecondary mb-3">
          This ASM data represents the structure of your world map, including nodes (screens) and their connections.
        </p>

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
          <Button onClick={handleCopyToClipboard} variant="secondary" size="md" className="w-full sm:w-auto">Copy to Clipboard</Button>
          <Button onClick={handleDownloadASM} variant="primary" size="md" className="w-full sm:w-auto">Download .ASM</Button>
          <Button onClick={onClose} variant="ghost" size="md" className="w-full sm:w-auto">Close</Button>
        </div>
      </div>
    </div>
  );
};