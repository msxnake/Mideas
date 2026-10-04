import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
  Msx2GameFlowTransitionNode,
  Msx2TransitionCustomPattern,
  Msx2TransitionPatternId,
  Msx2TransitionRgb,
  Screen5PaletteSlot,
} from '../../types';
import {
  buildScreen5FillPlan,
  DEFAULT_SCREEN5_FADE_COLOR,
  DEFAULT_SCREEN5_FLASH_COLOR,
  estimateScreen5FillPlanFrames,
  getScreen5PatternOrderMap,
  legacyTransitionHasOverrides,
  normalizeCustomPattern,
  normalizeScreen5Rgb,
  patternToCustomMask,
  resolveScreen5TransitionSpec,
  SCREEN5_FILL_TRANSITION_EFFECTS,
  SCREEN5_PALETTE_TRANSITION_EFFECTS,
  SCREEN5_TRANSITION_BLOCK_SIZES,
  SCREEN5_TRANSITION_DIRECTION_OPTIONS,
  SCREEN5_TRANSITION_DIRECTIONS_BY_EFFECT,
  SCREEN5_TRANSITION_IRIS_OPTIONS,
  SCREEN5_TRANSITION_PATTERN_OPTIONS,
  SCREEN5_TRANSITIONS_NEEDING_NEXT_SCENE,
  screen5TransitionUsesEngine,
} from '../../utils/msx2TransitionPatterns';
import { Button } from '../common/Button';

type TransitionUpdates = Partial<Omit<Msx2GameFlowTransitionNode, 'id' | 'type' | 'position'>>;

interface Screen5TransitionSettingsProps {
  node: Msx2GameFlowTransitionNode;
  onChange: (updates: TransitionUpdates) => void;
  /** Palette of the scene on screen (for colour swatches); optional. */
  palette?: Screen5PaletteSlot[];
}

const LEGACY_WIPES = new Set([
  'screen5_vertical_pixel_wipe',
  'screen5_horizontal_pixel_wipe',
  'screen5_mirror_pixel_wipe',
  'screen5_diagonal_pixel_wipe',
]);

const rgbToCss = (color: Msx2TransitionRgb): string => {
  const scale = (value: number) => Math.round((value / 7) * 255);
  return `rgb(${scale(color.r)}, ${scale(color.g)}, ${scale(color.b)})`;
};

const inputClass = 'mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1';

/** Order map preview: darker = painted earlier. */
const PatternPreview: React.FC<{ patternId: Msx2TransitionPatternId; custom?: Msx2TransitionCustomPattern }> = ({ patternId, custom }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const map = getScreen5PatternOrderMap(patternId, custom);
    const maxOrder = Math.max(1, ...map.order);
    const tiles = 16 / map.size >= 1 ? Math.max(1, Math.floor(32 / map.size)) : 1;
    const cell = 4;
    canvas.width = map.size * tiles * cell;
    canvas.height = map.size * tiles * cell;
    for (let ty = 0; ty < tiles; ty++) {
      for (let tx = 0; tx < tiles; tx++) {
        for (let y = 0; y < map.size; y++) {
          for (let x = 0; x < map.size; x++) {
            const order = map.order[y * map.size + x];
            const shade = order < 0 ? 255 : Math.round(40 + (order / maxOrder) * 200);
            ctx.fillStyle = order < 0 ? '#8b0000' : `rgb(${shade}, ${shade}, ${shade})`;
            ctx.fillRect((tx * map.size + x) * cell, (ty * map.size + y) * cell, cell, cell);
          }
        }
      }
    }
  }, [patternId, custom]);
  return (
    <canvas
      ref={canvasRef}
      className="border border-msx-border"
      style={{ width: 96, height: 96, imageRendering: 'pixelated' }}
      title="Fill order: dark cells are painted first"
    />
  );
};

/** Editable dissolve mask: every cell stores the (1-based) step that paints it. */
const CustomMaskEditor: React.FC<{ value: Msx2TransitionCustomPattern | undefined; onChange: (value: Msx2TransitionCustomPattern) => void }> = ({ value, onChange }) => {
  const mask = normalizeCustomPattern(value);
  const [mode, setMode] = useState<'sequence' | 'paint'>('sequence');
  const [paintStep, setPaintStep] = useState(1);
  const [nextStep, setNextStep] = useState(1);
  const maxStep = Math.max(0, ...mask.order);

  const setCell = (index: number) => {
    const order = [...mask.order];
    if (mode === 'paint') {
      order[index] = paintStep;
    } else {
      order[index] = nextStep;
      setNextStep(Math.min(64, nextStep + 1));
    }
    onChange({ size: mask.size, order });
  };

  const resize = (size: 4 | 8) => {
    if (size === mask.size) return;
    onChange(size === 4 ? patternToCustomMask('bayer4') : patternToCustomMask('bayer8'));
    setNextStep(1);
  };

  const clear = () => {
    // One lit cell keeps the mask valid; the rest are left for the user.
    onChange({ size: mask.size, order: mask.order.map((_value, index) => (index === 0 ? 1 : 0)) });
    setNextStep(2);
  };

  return (
    <div className="space-y-2 border border-msx-border rounded p-2">
      <div className="flex items-center gap-1 text-xs">
        <span>Grid</span>
        <Button size="sm" variant={mask.size === 4 ? 'primary' : 'secondary'} onClick={() => resize(4)}>4x4</Button>
        <Button size="sm" variant={mask.size === 8 ? 'primary' : 'secondary'} onClick={() => resize(8)}>8x8</Button>
        <Button size="sm" variant="ghost" onClick={clear}>Clear</Button>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <label className="flex items-center gap-1">
          <input type="radio" checked={mode === 'sequence'} onChange={() => setMode('sequence')} />
          Click order
        </label>
        <label className="flex items-center gap-1">
          <input type="radio" checked={mode === 'paint'} onChange={() => setMode('paint')} />
          Paint step
        </label>
        {mode === 'paint' ? (
          <input
            type="number"
            min={0}
            max={64}
            value={paintStep}
            onChange={event => setPaintStep(Math.max(0, Math.min(64, Math.trunc(Number(event.target.value)) || 0)))}
            className="w-14 bg-msx-panelbg border border-msx-border rounded p-0.5"
            title="0 = cell never painted"
          />
        ) : (
          <span className="text-msx-textsecondary">next: {nextStep}</span>
        )}
      </div>
      <div
        className="grid gap-px bg-msx-border"
        style={{ gridTemplateColumns: `repeat(${mask.size}, minmax(0, 1fr))`, width: mask.size === 4 ? 128 : 192 }}
      >
        {mask.order.map((step, index) => {
          const shade = step === 0 ? 0 : Math.round(40 + (step / Math.max(1, maxStep)) * 200);
          return (
            <button
              key={index}
              type="button"
              onClick={() => setCell(index)}
              className="aspect-square text-[0.6rem] leading-none"
              style={{
                background: step === 0 ? '#5a0000' : `rgb(${shade}, ${shade}, ${shade})`,
                color: shade > 140 ? '#000' : '#fff',
              }}
              title={step === 0 ? 'never painted' : `step ${step}`}
            >
              {step || ''}
            </button>
          );
        })}
      </div>
      <p className="text-[0.65rem] leading-snug text-msx-textsecondary">
        Each cell shows the step that paints it (dark = early). "Click order" numbers cells 1, 2, 3... as you click;
        "Paint step" writes the chosen number. Cells with the same number are painted together. The mask repeats across the screen.
      </p>
    </div>
  );
};

export const Screen5TransitionSettings: React.FC<Screen5TransitionSettingsProps> = ({ node, onChange, palette }) => {
  const effect = String(node.effect);
  const isFill = SCREEN5_FILL_TRANSITION_EFFECTS.has(effect);
  const isPalette = SCREEN5_PALETTE_TRANSITION_EFFECTS.has(effect);
  const isLegacyWipe = LEGACY_WIPES.has(effect);
  const hasOverrides = legacyTransitionHasOverrides(node);
  const [showLegacyAdvanced, setShowLegacyAdvanced] = useState(hasOverrides);
  const showFillParams = isFill || (isLegacyWipe && showLegacyAdvanced);
  const usesEngine = screen5TransitionUsesEngine(node);

  const spec = useMemo(() => (usesEngine ? resolveScreen5TransitionSpec(node) : null), [node, usesEngine]);
  const estimate = useMemo(() => {
    if (!spec) return null;
    if (spec.kind === 'palette') {
      const passes = spec.effect === 'palette_flash' ? spec.flashCount * 2 : spec.effect === 'palette_fade_out_in' ? 2 : 1;
      return passes * 8 * spec.framesPerStep;
    }
    try {
      return estimateScreen5FillPlanFrames(buildScreen5FillPlan(spec), spec.framesPerStep);
    } catch {
      return null;
    }
  }, [spec]);

  const directions = SCREEN5_TRANSITION_DIRECTIONS_BY_EFFECT[isLegacyWipe ? '' : effect] || [];
  const blockSizes = SCREEN5_TRANSITION_BLOCK_SIZES[effect] || [];
  const blockLabel = effect === 'screen5_blinds' ? 'Slat size (px)' : effect === 'screen5_pattern' ? 'Cell size (px)' : effect === 'screen5_iris' ? 'Block size (px)' : 'Band / block size (px)';
  const fadeColor = normalizeScreen5Rgb(node.fadeColor, effect === 'palette_flash' ? DEFAULT_SCREEN5_FLASH_COLOR : DEFAULT_SCREEN5_FADE_COLOR);
  const fillColor = Math.max(0, Math.min(15, Math.trunc(Number(node.fillColorIndex ?? 0)) || 0));
  const fillSwatch = palette?.find(slot => slot.slotIndex === fillColor)?.hex;

  const resetLegacyOverrides = () => {
    onChange({ blockSize: undefined, fillColorIndex: undefined, framesPerStep: undefined, reverse: undefined });
    setShowLegacyAdvanced(false);
  };

  return (
    <div className="space-y-2">
      {isLegacyWipe && (
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={showLegacyAdvanced}
            onChange={event => (event.target.checked ? setShowLegacyAdvanced(true) : resetLegacyOverrides())}
          />
          Customise (colour, size, speed)
        </label>
      )}
      {isLegacyWipe && showLegacyAdvanced && (
        <p className="text-[0.65rem] leading-snug text-msx-textsecondary">
          With custom values this wipe is played by the new SCREEN 5 transition engine. Untick to go back to the original routine.
        </p>
      )}

      {showFillParams && (
        <>
          {directions.length > 0 && (
            <label className="block text-xs">
              Direction
              <select
                value={node.direction && directions.includes(node.direction) ? node.direction : directions[0]}
                onChange={event => onChange({ direction: event.target.value as Msx2GameFlowTransitionNode['direction'] })}
                className={inputClass}
              >
                {SCREEN5_TRANSITION_DIRECTION_OPTIONS.filter(option => directions.includes(option.value)).map(option => (
                  <option key={option.value} value={option.value}>
                    {effect === 'screen5_iris'
                      ? option.value === 'center_out_h' ? 'Open (centre -> out)' : 'Close (out -> centre)'
                      : option.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          {effect === 'screen5_iris' && (
            <label className="block text-xs">
              Shape
              <select value={node.irisShape || 'circle'} onChange={event => onChange({ irisShape: event.target.value as Msx2GameFlowTransitionNode['irisShape'] })} className={inputClass}>
                {SCREEN5_TRANSITION_IRIS_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          )}
          {effect === 'screen5_pattern' && (
            <>
              <label className="block text-xs">
                Pattern
                <select
                  value={node.patternId || 'bayer4'}
                  onChange={event => {
                    const patternId = event.target.value as Msx2TransitionPatternId;
                    onChange(patternId === 'custom' && !node.customPattern
                      ? { patternId, customPattern: patternToCustomMask((node.patternId || 'bayer4') as Msx2TransitionPatternId) }
                      : { patternId });
                  }}
                  className={inputClass}
                >
                  {SCREEN5_TRANSITION_PATTERN_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <div className="flex items-start gap-2">
                <PatternPreview patternId={(node.patternId || 'bayer4') as Msx2TransitionPatternId} custom={node.customPattern} />
                {node.patternId !== 'custom' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onChange({ patternId: 'custom', customPattern: patternToCustomMask((node.patternId || 'bayer4') as Msx2TransitionPatternId) })}
                  >
                    Edit as custom
                  </Button>
                )}
              </div>
              {node.patternId === 'custom' && (
                <CustomMaskEditor value={node.customPattern} onChange={customPattern => onChange({ customPattern })} />
              )}
            </>
          )}
          {blockSizes.length > 0 && (
            <label className="block text-xs">
              {blockLabel}
              <select
                value={blockSizes.includes(Number(node.blockSize)) ? Number(node.blockSize) : blockSizes[0]}
                onChange={event => onChange({ blockSize: Number(event.target.value) })}
                className={inputClass}
              >
                {[...blockSizes].sort((a, b) => a - b).map(size => <option key={size} value={size}>{size}</option>)}
              </select>
            </label>
          )}
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs">
              Fill colour (0-15)
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={15}
                  value={fillColor}
                  onChange={event => onChange({ fillColorIndex: Math.max(0, Math.min(15, Math.trunc(Number(event.target.value)) || 0)) })}
                  className={inputClass}
                />
                <span className="mt-1 w-5 h-5 border border-msx-border shrink-0" style={{ background: fillSwatch || 'transparent' }} title={fillSwatch ? `slot ${fillColor}` : 'colour of the scene palette'} />
              </div>
            </label>
            <label className="block text-xs">
              Frames per step
              <input
                type="number"
                min={1}
                max={30}
                value={node.framesPerStep ?? 1}
                onChange={event => onChange({ framesPerStep: Math.max(1, Math.min(30, Math.trunc(Number(event.target.value)) || 1)) })}
                className={inputClass}
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={node.reverse === true} onChange={event => onChange({ reverse: event.target.checked || undefined })} />
            Reverse order
          </label>
        </>
      )}

      {(isPalette || effect === 'fade_to_black') && (
        <>
          {isPalette && (
            <div className="text-xs">
              {effect === 'palette_flash' ? 'Flash colour' : effect === 'palette_crossfade' ? 'Colour (unused by crossfade)' : 'Fade colour'}
              <div className="mt-1 flex items-center gap-1">
                {(['r', 'g', 'b'] as const).map(component => (
                  <label key={component} className="flex items-center gap-0.5 uppercase">
                    {component}
                    <select
                      value={fadeColor[component]}
                      onChange={event => onChange({ fadeColor: { ...fadeColor, [component]: Number(event.target.value) } })}
                      className="bg-msx-panelbg border border-msx-border rounded p-0.5"
                      disabled={effect === 'palette_crossfade'}
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7].map(level => <option key={level} value={level}>{level}</option>)}
                    </select>
                  </label>
                ))}
                <span className="w-5 h-5 border border-msx-border" style={{ background: rgbToCss(fadeColor) }} />
                <Button size="sm" variant="ghost" onClick={() => onChange({ fadeColor: { r: 0, g: 0, b: 0 } })}>Black</Button>
                <Button size="sm" variant="ghost" onClick={() => onChange({ fadeColor: { r: 7, g: 7, b: 7 } })}>White</Button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs">
              Frames per step (8 steps)
              <input
                type="number"
                min={1}
                max={30}
                value={node.framesPerStep ?? (effect === 'palette_flash' ? 1 : 2)}
                onChange={event => onChange({ framesPerStep: Math.max(1, Math.min(30, Math.trunc(Number(event.target.value)) || 1)) })}
                className={inputClass}
              />
            </label>
            {effect === 'palette_flash' && (
              <label className="block text-xs">
                Flashes
                <input
                  type="number"
                  min={1}
                  max={4}
                  value={node.flashCount ?? 1}
                  onChange={event => onChange({ flashCount: Math.max(1, Math.min(4, Math.trunc(Number(event.target.value)) || 1)) })}
                  className={inputClass}
                />
              </label>
            )}
          </div>
          {effect === 'fade_to_black' && node.framesPerStep !== undefined && (
            <Button size="sm" variant="ghost" onClick={() => onChange({ framesPerStep: undefined, fadeColor: undefined })}>
              Back to the original fade
            </Button>
          )}
          {SCREEN5_TRANSITIONS_NEEDING_NEXT_SCENE.has(effect) && (
            <p className="text-[0.65rem] leading-snug text-msx-textsecondary">
              The next node must be a SCREEN 5 Presentation: its image is uploaded while the screen shows the fade colour
              {effect === 'palette_crossfade' ? ' (crossfade: its palette is reached first, then the image is uploaded with the screen on — ideal for the same picture with a different palette)' : ' and then fades in'}.
            </p>
          )}
        </>
      )}

      {estimate !== null && (
        <p className="text-[0.65rem] leading-snug text-msx-textsecondary">
          Approx. duration: {estimate} frames ({(estimate / 60).toFixed(2)} s at 60 Hz){spec?.kind === 'fill' && estimate > 90 ? ' — use a bigger block/cell size to make it faster.' : '.'}
        </p>
      )}
    </div>
  );
};

export default Screen5TransitionSettings;
