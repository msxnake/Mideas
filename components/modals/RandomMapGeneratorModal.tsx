import React, { useState } from 'react';
import { Button } from '../common/Button';

interface RandomMapGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RandomMapGeneratorModal: React.FC<RandomMapGeneratorModalProps> = ({ isOpen, onClose }) => {
  const [numScreens, setNumScreens] = useState(10);
  const [numEnemies, setNumEnemies] = useState(5);
  const [numKeys, setNumKeys] = useState(2);
  const [numSecretZones, setNumSecretZones] = useState(1);
  const [numSpecialItems, setNumSpecialItems] = useState(1);
  const [hasFinalBoss, setHasFinalBoss] = useState(true);
  const [hasExitDoor, setHasExitDoor] = useState(true);

  if (!isOpen) return null;

  const handleGenerate = () => {
    const options = {
      numScreens,
      numEnemies,
      numKeys,
      numSecretZones,
      numSpecialItems,
      hasFinalBoss,
      hasExitDoor,
    };

    const map = generateMap(options);

    const data = {
      options,
      map,
    };

    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "random_map.json";
    a.click();
    URL.revokeObjectURL(url);

    onClose();
  };

  const generateMap = (options: any) => {
    const { numScreens, numEnemies, numKeys, numSecretZones, numSpecialItems, hasFinalBoss, hasExitDoor } = options;
    const totalCells = numScreens * 2;
    const cells = new Array(totalCells).fill('X');
    let placedCount = 0;

    const placeItem = (item: string, count: number) => {
      for (let i = 0; i < count; i++) {
        let index = Math.floor(Math.random() * totalCells);
        while (cells[index] !== 'X') {
          index = Math.floor(Math.random() * totalCells);
        }
        cells[index] = item;
        placedCount++;
      }
    };

    if (hasFinalBoss) placeItem('M', 1);
    if (hasExitDoor) placeItem('F', 1);
    placeItem('E', numEnemies);
    placeItem('K', numKeys);
    placeItem('S', numSecretZones);
    placeItem('I', numSpecialItems);

    for (let i = 0; i < totalCells; i++) {
      if (cells[i] === 'X' && placedCount < numScreens) {
        cells[i] = 'O';
        placedCount++;
      }
    }

    const map = [];
    const width = Math.ceil(Math.sqrt(numScreens));
    for (let i = 0; i < totalCells; i += width) {
      map.push(cells.slice(i, i + width));
    }

    return map;
  };


  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="randomMapModalTitle"
    >
      <div
        className="bg-msx-panelbg p-6 rounded-lg shadow-xl w-full max-w-md animate-slideIn pixel-font"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="randomMapModalTitle" className="text-xl text-msx-highlight mb-4">
          Generar Mapa Aleatorio
        </h2>
        <div className="space-y-4 text-sm text-msx-textprimary mb-6">
          <div className="flex items-center justify-between">
            <label>Número de pantallas:</label>
            <input
              type="number"
              value={numScreens}
              onChange={(e) => setNumScreens(parseInt(e.target.value))}
              className="w-24 p-1 bg-msx-panelbg border border-msx-border rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <label>Número de enemigos:</label>
            <input
              type="number"
              value={numEnemies}
              onChange={(e) => setNumEnemies(parseInt(e.target.value))}
              className="w-24 p-1 bg-msx-panelbg border border-msx-border rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <label>Número de llaves:</label>
            <input
              type="number"
              value={numKeys}
              onChange={(e) => setNumKeys(parseInt(e.target.value))}
              className="w-24 p-1 bg-msx-panelbg border border-msx-border rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <label>Número de zonas secretas:</label>
            <input
              type="number"
              value={numSecretZones}
              onChange={(e) => setNumSecretZones(parseInt(e.target.value))}
              className="w-24 p-1 bg-msx-panelbg border border-msx-border rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <label>Número de items especiales:</label>
            <input
              type="number"
              value={numSpecialItems}
              onChange={(e) => setNumSpecialItems(parseInt(e.target.value))}
              className="w-24 p-1 bg-msx-panelbg border border-msx-border rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <label>Jefe de final de fase:</label>
            <input
              type="checkbox"
              checked={hasFinalBoss}
              onChange={(e) => setHasFinalBoss(e.target.checked)}
              className="w-6 h-6"
            />
          </div>
          <div className="flex items-center justify-between">
            <label>Puerta de salida de fase:</label>
            <input
              type="checkbox"
              checked={hasExitDoor}
              onChange={(e) => setHasExitDoor(e.target.checked)}
              className="w-6 h-6"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button onClick={onClose} variant="secondary">
            Cancelar
          </Button>
          <Button onClick={handleGenerate} variant="primary">
            Generar
          </Button>
        </div>
      </div>
    </div>
  );
};
