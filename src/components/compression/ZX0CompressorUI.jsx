import React, { useState } from 'react';
import { compressData } from '../../services/CompressionService';

const ZX0CompressorUI = ({ inputData, outputFilePath, onCompressionComplete, assetType }) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState(null);
  const [compressionStats, setCompressionStats] = useState(null);

  const handleCompressClick = async () => {
    if (!inputData || !outputFilePath || !assetType) {
      setError("Input data, output file path, and asset type are required.");
      return;
    }

    setIsCompressing(true);
    setError(null);
    setCompressionStats(null);

    // Ensure the output path is within the 'compressed/' directory.
    let finalOutputFilePath = outputFilePath;
    if (!finalOutputFilePath.startsWith('compressed/')) {
      finalOutputFilePath = `compressed/${finalOutputFilePath}`;
    }

    try {
      const stats = await compressData('ZX0', inputData, finalOutputFilePath, assetType);
      setCompressionStats(stats);
      if (onCompressionComplete) {
        onCompressionComplete(stats);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div>
      <button onClick={handleCompressClick} disabled={isCompressing}>
        {isCompressing ? 'Comprimiendo...' : 'Comprimir con ZX0'}
      </button>
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {compressionStats && (
        <div>
          <h4>Compresión exitosa!</h4>
          <p>Tamaño Original: {compressionStats.originalSize} bytes</p>
          <p>Tamaño Comprimido: {compressionStats.compressedSize} bytes</p>
          <p>Ratio de Compresión: {compressionStats.ratio.toFixed(2)}%</p>
        </div>
      )}
    </div>
  );
};

export default ZX0CompressorUI;
