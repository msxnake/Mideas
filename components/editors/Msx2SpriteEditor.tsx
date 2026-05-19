import React, { useMemo, useState } from 'react';
import { Msx2Sprite, MSXColorValue, PixelData, Screen5PaletteSlot } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { DEFAULT_SCREEN5_CUSTOM_PALETTE, MSX_SCREEN5_PALETTE } from '../../constants';

interface Msx2SpriteEditorProps {
  sprite: Msx2Sprite;
  onUpdate: (data: Partial<Msx2Sprite>) => void;
}

const clonePixels = (data: PixelData): PixelData => data.map(row => [...row]);

const createPixels = (width: number, height: number, color: MSXColorValue): PixelData =>
  Array.from({ length: height }, () => Array.from({ length: width }, () => color));

const ensurePalette = (palette?: Screen5PaletteSlot[]): Screen5PaletteSlot[] => {
  const source = palette?.length === 16 ? palette : DEFAULT_SCREEN5_CUSTOM_PALETTE;
  return source.map((slot, index) => ({
    slotIndex: slot.slotIndex ?? index,
    masterIndex: slot.masterIndex,
    hex: slot.hex,
  }));
};

const normalizeFrame = (sprite: Msx2Sprite): PixelData => {
  const frame = sprite.frames[sprite.currentFrameIndex] || sprite.frames[0];
  if (frame?.data?.length) return frame.data;
  return createPixels(sprite.size.width, sprite.size.height, sprite.backgroundColor);
};

const toAsmBytes = (sprite: Msx2Sprite): string => {
  const frame = normalizeFrame(sprite);
  const bytes: number[] = [];
  const bg = sprite.backgroundColor.toUpperCase();
  const byteFor = (x0: number, y: number) => {
    let value = 0;
    for (let bit = 0; bit < 8; bit++) {
      const color = String(frame[y]?.[x0 + bit] || '').toUpperCase();
      if (color && color !== bg) value |= 0x80 >> bit;
    }
    return value;
  };
  for (let y = 0; y < 8; y++) bytes.push(byteFor(0, y));
  for (let y = 0; y < 8; y++) bytes.push(byteFor(8, y));
  for (let y = 8; y < 16; y++) bytes.push(byteFor(0, y));
  for (let y = 8; y < 16; y++) bytes.push(byteFor(8, y));
  return bytes.map(value => `#${value.toString(16).toUpperCase().padStart(2, '0')}`).join(',');
};

export const Msx2SpriteEditor: React.FC<Msx2SpriteEditorProps> = ({ sprite, onUpdate }) => {
  const palette = useMemo(() => ensurePalette(sprite.palette), [sprite.palette]);
  const frame = normalizeFrame(sprite);
  const [selectedColor, setSelectedColor] = useState<MSXColorValue>(palette[5]?.hex || MSX_SCREEN5_PALETTE[5]?.hex || '#FFFF00');
  const [zoom, setZoom] = useState(18);

  const updateFrameData = (data: PixelData) => {
    const frames = sprite.frames.length > 0 ? [...sprite.frames] : [{ id: `frame_${Date.now()}`, data }];
    const frameIndex = Math.max(0, Math.min(sprite.currentFrameIndex || 0, frames.length - 1));
    frames[frameIndex] = { ...(frames[frameIndex] || { id: `frame_${Date.now()}` }), data };
    onUpdate({ frames, currentFrameIndex: frameIndex });
  };

  const paintPixel = (x: number, y: number, color: MSXColorValue) => {
    const next = clonePixels(frame);
    next[y][x] = color;
    updateFrameData(next);
  };

  const addFrame = () => {
    const frames = [
      ...sprite.frames,
      { id: `frame_${Date.now()}`, data: createPixels(sprite.size.width, sprite.size.height, sprite.backgroundColor) },
    ];
    onUpdate({ frames, currentFrameIndex: frames.length - 1 });
  };

  const clearFrame = () => updateFrameData(createPixels(sprite.size.width, sprite.size.height, sprite.backgroundColor));

  const setHardware = (field: keyof Msx2Sprite['hardware'], value: number) => {
    onUpdate({ hardware: { ...sprite.hardware, [field]: value } });
  };

  const asmBytes = useMemo(() => toAsmBytes(sprite), [sprite]);

  return (
    <div className="h-full min-h-0 flex flex-col gap-2 p-2 bg-msx-bgcolor">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <input
            value={sprite.name}
            onChange={event => onUpdate({ name: event.target.value })}
            className="px-2 py-1 bg-msx-panelbg border border-msx-border rounded text-sm"
          />
          <span className="px-2 py-1 bg-msx-panelbg border border-msx-border rounded text-sm">
            16x16 hardware
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setZoom(Math.max(8, zoom - 2))}>-</Button>
          <span className="w-10 text-center text-xs">{zoom}px</span>
          <Button size="sm" variant="secondary" onClick={() => setZoom(Math.min(32, zoom + 2))}>+</Button>
          <Button size="sm" variant="secondary" onClick={addFrame}>Frame</Button>
          <Button size="sm" variant="danger" onClick={clearFrame}>Clear</Button>
        </div>
      </div>

      <div className="min-h-0 flex flex-1 gap-2">
        <Panel title="MSX2 Sprite" className="flex-shrink-0">
          <div className="p-3">
            <div
              className="grid border border-msx-border bg-black"
              style={{
                gridTemplateColumns: `repeat(${sprite.size.width}, ${zoom}px)`,
                gridTemplateRows: `repeat(${sprite.size.height}, ${zoom}px)`,
                width: sprite.size.width * zoom,
                height: sprite.size.height * zoom,
                imageRendering: 'pixelated',
              }}
              onContextMenu={event => event.preventDefault()}
            >
              {frame.map((row, y) => row.map((color, x) => (
                <button
                  key={`${x}-${y}`}
                  type="button"
                  className="border-0 p-0"
                  style={{
                    width: zoom,
                    height: zoom,
                    backgroundColor: color === sprite.backgroundColor ? 'transparent' : color,
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                  }}
                  onMouseDown={event => paintPixel(x, y, event.button === 2 ? sprite.backgroundColor : selectedColor)}
                  title={`${x},${y}`}
                />
              )))}
            </div>
          </div>
        </Panel>

        <div className="min-w-0 flex-1 space-y-2">
          <Panel title="Palette SCREEN 5">
            <div className="grid grid-cols-8 gap-1 p-3">
              {palette.map(slot => (
                <button
                  key={slot.slotIndex}
                  type="button"
                  className={`h-8 rounded border ${selectedColor === slot.hex ? 'border-msx-highlight' : 'border-msx-border'}`}
                  style={{ backgroundColor: slot.hex === sprite.backgroundColor ? '#111827' : slot.hex }}
                  onClick={() => setSelectedColor(slot.hex)}
                  title={`Slot ${slot.slotIndex}: ${slot.hex}`}
                />
              ))}
            </div>
          </Panel>

          <Panel title="Hardware">
            <div className="grid grid-cols-4 gap-2 p-3 text-xs">
              <label>X<input type="number" value={sprite.hardware.x} min={0} max={255} onChange={e => setHardware('x', Number(e.target.value))} className="mt-1 w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1" /></label>
              <label>Y<input type="number" value={sprite.hardware.y} min={0} max={211} onChange={e => setHardware('y', Number(e.target.value))} className="mt-1 w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1" /></label>
              <label>Color<input type="number" value={sprite.hardware.color} min={1} max={15} onChange={e => setHardware('color', Number(e.target.value))} className="mt-1 w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1" /></label>
              <label>Pattern<input type="number" value={sprite.hardware.patternIndex} min={0} max={252} step={4} onChange={e => setHardware('patternIndex', Number(e.target.value))} className="mt-1 w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1" /></label>
            </div>
          </Panel>

          <Panel title="Frames">
            <div className="flex flex-wrap gap-2 p-3">
              {sprite.frames.map((spriteFrame, index) => (
                <Button
                  key={spriteFrame.id}
                  size="sm"
                  variant={index === sprite.currentFrameIndex ? 'primary' : 'secondary'}
                  onClick={() => onUpdate({ currentFrameIndex: index })}
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          </Panel>

          <Panel title="Pattern Bytes">
            <pre className="m-0 max-h-28 overflow-auto p-3 text-xs text-msx-textsecondary whitespace-pre-wrap">{asmBytes}</pre>
          </Panel>
        </div>
      </div>
    </div>
  );
};
