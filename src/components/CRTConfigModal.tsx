// src/components/CRTConfigModal.tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CRTShaderConfig, defaultCRTConfig } from './CRTShaderOverlay';
import { Button } from '../../components/common/Button';
import { SaveIcon } from '../../components/icons/MsxIcons';

interface CRTConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: CRTShaderConfig;
  onSave: (config: CRTShaderConfig) => void;
}

export const CRTConfigModal: React.FC<CRTConfigModalProps> = ({ isOpen, onClose, currentConfig, onSave }) => {
  const [config, setConfig] = useState<CRTShaderConfig>(currentConfig);

  useEffect(() => {
    setConfig(currentConfig);
  }, [currentConfig]);

  if (!isOpen) return null;

  const handleReset = () => {
    setConfig(defaultCRTConfig);
  };

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const updateValue = (key: keyof CRTShaderConfig, value: number) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const sliders: Array<{ key: keyof CRTShaderConfig; label: string; min: number; max: number; step: number }> = [
    { key: 'curvatureX', label: 'Curvature X', min: 6, max: 30, step: 0.5 },
    { key: 'curvatureY', label: 'Curvature Y', min: 4, max: 20, step: 0.5 },
    { key: 'aberration', label: 'Chromatic Aberration', min: 0, max: 0.005, step: 0.0001 },
    { key: 'scanlineIntensity', label: 'Scanline Intensity', min: 0, max: 0.1, step: 0.001 },
    { key: 'scanlineStrength', label: 'Scanline Strength', min: 0, max: 1, step: 0.01 },
    { key: 'glowIntensity', label: 'Phosphor Glow', min: 0, max: 0.3, step: 0.01 },
    { key: 'bloomIntensity', label: 'Bloom Intensity', min: 0, max: 0.5, step: 0.01 },
    { key: 'maskIntensity', label: 'RGB Mask Intensity', min: 0, max: 1, step: 0.01 },
    { key: 'vignetteStrength', label: 'Vignette Strength', min: 10, max: 30, step: 0.5 },
    { key: 'vignettePower', label: 'Vignette Power', min: 0.05, max: 0.5, step: 0.01 },
    { key: 'grainIntensity', label: 'Grain Intensity', min: 0, max: 0.1, step: 0.001 },
    { key: 'flickerIntensity', label: 'Flicker Intensity', min: 0, max: 0.01, step: 0.0001 },
    { key: 'humIntensity', label: 'Brightness Hum', min: 0, max: 0.05, step: 0.001 },
    { key: 'contrast', label: 'Contrast', min: 1, max: 1.5, step: 0.01 },
    { key: 'brightness', label: 'Brightness', min: 1, max: 1.3, step: 0.01 },
  ];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-msx-background border-2 border-msx-primary p-6 rounded max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-msx-primary mb-4">CRT Shader Configuration</h2>

        <div className="space-y-4">
          {sliders.map(({ key, label, min, max, step }) => (
            <div key={key} className="flex items-center gap-4">
              <label className="text-msx-text text-sm w-48 flex-shrink-0">{label}</label>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={config[key]}
                onChange={(e) => updateValue(key, parseFloat(e.target.value))}
                className="flex-grow"
              />
              <span className="text-msx-text text-xs w-20 text-right font-mono">{config[key].toFixed(4)}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-4">
          <Button onClick={handleSave} variant="primary" icon={<SaveIcon />}>
            Save & Close
          </Button>
          <Button onClick={handleReset} variant="secondary">
            Reset to Default
          </Button>
          <Button onClick={onClose} variant="ghost">
            Cancel
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
