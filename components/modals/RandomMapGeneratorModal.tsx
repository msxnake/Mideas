import React, { useState } from 'react';
import { Button } from '../common/Button';

interface RandomMapGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateAndPlace: (data: { options: any; map: string[][] }) => void;
}

export const RandomMapGeneratorModal: React.FC<RandomMapGeneratorModalProps> = ({ isOpen, onClose, onGenerateAndPlace }) => {
  const [numScreens, setNumScreens] = useState(10);
  const [numEnemies, setNumEnemies] = useState(5);
  const [numKeys, setNumKeys] = useState(2);
  const [numSecretZones, setNumSecretZones] = useState(1);
  const [numSpecialItems, setNumSpecialItems] = useState(1);
  const [hasFinalBoss, setHasFinalBoss] = useState(true);
  const [hasExitDoor, setHasExitDoor] = useState(true);
  const [density, setDensity] = useState(1.5);

  if (!isOpen) return null;

  const generateMapData = () => {
    const options = {
      numScreens,
      numEnemies,
      numKeys,
      numSecretZones,
      numSpecialItems,
      hasFinalBoss,
      hasExitDoor,
      density,
    };

    const map = generateMap(options);

    return { options, map };
  }

  const handleDownloadJson = () => {
    const data = generateMapData();
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

  const handleGenerateAndPlaceClick = () => {
    const data = generateMapData();
    onGenerateAndPlace(data);
    onClose();
  };

  const generateMap = (options: any) => {
    const { numScreens, numEnemies, numKeys, numSecretZones, numSpecialItems, hasFinalBoss, hasExitDoor, density } = options;

    let screenTypes: string[] = [];
    if (hasFinalBoss) screenTypes.push('M');
    if (hasExitDoor) screenTypes.push('F');
    for (let i = 0; i < numEnemies; i++) screenTypes.push('E');
    for (let i = 0; i < numKeys; i++) screenTypes.push('K');
    for (let i = 0; i < numSecretZones; i++) screenTypes.push('S');
    for (let i = 0; i < numSpecialItems; i++) screenTypes.push('I');

    if (screenTypes.length > numScreens) {
      alert('The number of special screens is greater than the total number of screens. Please adjust the numbers.');
      return [];
    }

    const normalScreensToAdd = numScreens - screenTypes.length;
    for (let i = 0; i < normalScreensToAdd; i++) {
      screenTypes.push('O');
    }

    // Shuffle the screen types
    for (let i = screenTypes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [screenTypes[i], screenTypes[j]] = [screenTypes[j], screenTypes[i]];
    }

    const aspectRatio = 1.618; // Golden ratio
    const totalCells = Math.ceil(numScreens * density);
    const width = Math.round(Math.sqrt(totalCells * aspectRatio));
    const height = Math.round(totalCells / width);

    const cells = new Array(width * height).fill('X');
    screenTypes.forEach((type, index) => {
      cells[index] = type;
    });

    // Shuffle the cells to distribute the 'X's randomly
    for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    const map = [];
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
          <div className="flex items-center justify-between">
            <label>Map Density: {density.toFixed(1)}x</label>
            <input
              type="range"
              min="1.1"
              max="3.0"
              step="0.1"
              value={density}
              onChange={(e) => setDensity(parseFloat(e.target.value))}
              className="w-48 accent-msx-accent"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button onClick={onClose} variant="secondary">
            Cancelar
          </Button>
          <Button onClick={handleDownloadJson} variant="secondary">
            Descargar JSON
          </Button>
          <Button onClick={handleGenerateAndPlaceClick} variant="primary">
            Generar y Colocar
          </Button>
        </div>
      </div>
    </div>
  );
};
