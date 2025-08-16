import React, { useState } from 'react';
import { compressFile } from '../../services/CompressionService';

const ZX0CompressorUI = ({ inputFilePath, outputFilePath, onCompressionComplete }) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState(null);
  const [compressionStats, setCompressionStats] = useState(null);

  const handleCompressClick = async () => {
    if (!inputFilePath || !outputFilePath) {
      setError("Input and output file paths are required.");
      return;
    }

    setIsCompressing(true);
    setError(null);
    setCompressionStats(null);

    try {
      const stats = await compressFile('ZX0', inputFilePath, outputFilePath);
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
