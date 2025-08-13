
import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { ExplosionType, ExplosionSpriteSize, ExplosionParams, EXPLOSION_SPRITE_SIZES } from '../../types';


interface ExplosionGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (params: ExplosionParams) => void;
  initialSpriteSize?: ExplosionSpriteSize;
}

const explosionTypeTooltips: Record<ExplosionType, string> = {
  Radial: "Particles expand outwards in a circular pattern.",
  Fragmentada: "A few larger fragments burst outwards.",
  Implosión: "(Soon) Particles collapse inwards towards the center."
};

export const ExplosionGeneratorModal: React.FC<ExplosionGeneratorModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  initialSpriteSize = 16,
}) => {
  const [type, setType] = useState<ExplosionType>("Radial");
  const [size, setSize] = useState<ExplosionSpriteSize>(initialSpriteSize);
  const [numFrames, setNumFrames] = useState<number>(8);
  const [intensity, setIntensity] = useState<number>(70);
  const [jitter, setJitter] = useState<number>(20);
  const [numSimultaneousColors, setNumSimultaneousColors] = useState<1 | 2 | 3 | 4>(1);
  // Fragmentada specific
  const [numFragments, setNumFragments] = useState<number>(5);
  const [fragmentSpeedVariation, setFragmentSpeedVariation] = useState<number>(30);


  useEffect(() => {
    if (isOpen) {
        setType("Radial");
        setSize(initialSpriteSize);
        setNumFrames(8);
        setIntensity(70);
        setJitter(20);
        setNumSimultaneousColors(1);
        setNumFragments(5);
        setFragmentSpeedVariation(30);
    }
  }, [isOpen, initialSpriteSize]);

  if (!isOpen) {
    return null;
  }

  const handleGenerateClick = () => {
    const params: ExplosionParams = {
      type,
      size,
      numFrames: Math.max(1, Math.min(16, numFrames)),
      intensity: Math.max(0, Math.min(100, intensity)),
      jitter: Math.max(0, Math.min(50, jitter)),
      numSimultaneousColors,
    };
    if (type === "Fragmentada") {
      params.numFragments = Math.max(2, Math.min(12, numFragments));
      params.fragmentSpeedVariation = Math.max(0, Math.min(100, fragmentSpeedVariation));
    }
    onGenerate(params);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="explosionGenModalTitle"
    >
      <div
        className="bg-msx-panelbg p-6 rounded-lg shadow-xl w-full max-w-md animate-slideIn font-sans flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="explosionGenModalTitle" className="text-lg text-msx-highlight mb-4">
          Explosion Generator
        </h2>

        <div className="space-y-3 text-sm mb-6 max-h-[60vh] overflow-y-auto pr-2">
          <div>
            <label htmlFor="explosionType" className="block text-msx-textsecondary mb-1">Type:</label>
            <select
              id="explosionType"
              value={type}
              onChange={(e) => setType(e.target.value as ExplosionType)}
              className="w-full p-2 bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent"
            >
              {(Object.keys(explosionTypeTooltips) as ExplosionType[]).map(typeName => (
                <option 
                    key={typeName} 
                    value={typeName} 
                    title={explosionTypeTooltips[typeName]}
                    disabled={typeName === "Implosión"}
                >
                  {typeName}{typeName === "Implosión" ? " (Soon)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="spriteSize" className="block text-msx-textsecondary mb-1">Sprite Size (px):</label>
            <select
              id="spriteSize"
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value, 10) as ExplosionSpriteSize)}
              className="w-full p-2 bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent"
            >
              {EXPLOSION_SPRITE_SIZES.map(sVal => <option key={sVal} value={sVal}>{sVal}x{sVal}</option>)}
            </select>
          </div>
          
          <div>
            <label htmlFor="numFrames" className="block text-msx-textsecondary mb-1">Frames ({numFrames}):</label>
            <input
              type="range"
              id="numFrames"
              value={numFrames}
              onChange={(e) => setNumFrames(parseInt(e.target.value, 10))}
              min="1" max="16" step="1"
              className="w-full accent-msx-accent"
            />
          </div>
          
          <div>
            <label htmlFor="numSimultaneousColors" className="block text-msx-textsecondary mb-1">Simultaneous Colors:</label>
            <select
              id="numSimultaneousColors"
              value={numSimultaneousColors}
              onChange={(e) => setNumSimultaneousColors(parseInt(e.target.value, 10) as 1 | 2 | 3 | 4)}
              className="w-full p-2 bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent"
            >
              <option value={1}>1 Color (Evolves over anim)</option>
              <option value={2}>2 Colors (Cycles)</option>
              <option value={3}>3 Colors (Cycles)</option>
              <option value={4}>4 Colors (Cycles)</option>
            </select>
          </div>

          <div>
            <label htmlFor="intensity" className="block text-msx-textsecondary mb-1">Intensity / Spread ({intensity}%):</label>
            <input
              type="range"
              id="intensity"
              value={intensity}
              onChange={(e) => setIntensity(parseInt(e.target.value, 10))}
              min="0" max="100"
              className="w-full accent-msx-accent"
            />
          </div>

          <div>
            <label htmlFor="jitter" className="block text-msx-textsecondary mb-1">Jitter / Randomness ({jitter}%):</label>
            <input
              type="range"
              id="jitter"
              value={jitter}
              onChange={(e) => setJitter(parseInt(e.target.value, 10))}
              min="0" max="50"
              className="w-full accent-msx-accent"
            />
          </div>
          
          {type === "Fragmentada" && (
            <>
              <div className="pt-2 border-t border-msx-border/50">
                <label htmlFor="numFragments" className="block text-msx-textsecondary mb-1">Number of Fragments ({numFragments}):</label>
                <input
                  type="range"
                  id="numFragments"
                  value={numFragments}
                  onChange={(e) => setNumFragments(parseInt(e.target.value, 10))}
                  min="2" max="12" step="1"
                  className="w-full accent-msx-accent"
                />
              </div>
              <div>
                <label htmlFor="fragmentSpeedVariation" className="block text-msx-textsecondary mb-1">Fragment Speed Variation ({fragmentSpeedVariation}%):</label>
                <input
                  type="range"
                  id="fragmentSpeedVariation"
                  value={fragmentSpeedVariation}
                  onChange={(e) => setFragmentSpeedVariation(parseInt(e.target.value, 10))}
                  min="0" max="100" step="5"
                  className="w-full accent-msx-accent"
                />
              </div>
            </>
          )}

        </div>

        <div className="flex justify-end space-x-2">
          <Button onClick={onClose} variant="ghost" size="md">
            Cancel
          </Button>
          <Button onClick={handleGenerateClick} variant="primary" size="md">
            Generate
          </Button>
        </div>
      </div>
    </div>
  );
};
