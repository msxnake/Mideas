import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Msx2BitmapStampAsset, Msx2DialogueAsset, Msx2DialogueLine, Msx2DialoguePortrait, Msx2HudFontAsset, ProjectAsset, Screen5PaletteSlot } from '../../types';
import { createDefaultScreen5PaletteSlots, screen5SlotsToMsxColors } from '../../utils/msx2PaletteUtils';
import { bitmapStampToPixelGrid, buildScreen5BitmapStampAsset, createScreen5PaletteAssetForTile, findMatchingScreen5PaletteAsset } from '../../utils/msx2Screen5BitmapTileLibrary';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PencilIcon, PlayIcon, PlusCircleIcon, SaveFloppyIcon, TrashIcon } from '../icons/MsxIcons';

/**
 * Editor for 'msx2dialogue' assets: pixel-based NPC dialogues for the SCREEN 5
 * bitmap-room backend (independent from the MSX1 tile DialogueEditor).
 * Left: lines + box/typewriter options. Right: 2-frame portrait pixel editor
 * (mouth closed / mouth open) + an animated preview that mirrors the runtime
 * (uppercase, word wrap, per-char delay, mouth toggle cadence, close on end).
 */

const GAME_W = 256;
const GAME_H = 192;

// 1bpp fallback glyphs when the project has no msx2hudfont (same charset the
// ASM generator falls back to). Rendered as textColor-on-background.
const FALLBACK_PATTERNS: Record<string, number[]> = {
  ' ': [0, 0, 0, 0, 0, 0, 0, 0],
};

interface Msx2DialogueEditorProps {
  dialogue: Msx2DialogueAsset;
  onUpdate: (data: Partial<Msx2DialogueAsset>, newAssetsToCreate?: ProjectAsset[]) => void;
  allAssets: ProjectAsset[];
  paletteSlots?: Screen5PaletteSlot[];
  setStatusBarMessage?: (message: string) => void;
}

const clampSlot = (value: unknown, fallback = 0): number => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? Math.max(0, Math.min(15, n)) : fallback;
};

const clampInt = (value: unknown, min: number, max: number, fallback: number): number => {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
};

/** Same word wrap the ASM generator applies at build time. */
function wrapDialogueText(text: string, maxCols: number, maxRows: number): string[] {
  const rows: string[] = [];
  for (const paragraph of String(text || '').split('\n')) {
    let current = '';
    for (const word of paragraph.split(' ')) {
      if (!word && current.length < maxCols) continue;
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length <= maxCols) {
        current = candidate;
        continue;
      }
      if (current) rows.push(current);
      let chunk = word;
      while (chunk.length > maxCols) {
        rows.push(chunk.slice(0, maxCols));
        chunk = chunk.slice(maxCols);
      }
      current = chunk;
    }
    rows.push(current);
  }
  while (rows.length && rows[rows.length - 1] === '') rows.pop();
  return rows.slice(0, Math.max(1, maxRows));
}

function resizeFrame(pixels: number[][] | undefined, width: number, height: number, fill: number): number[][] {
  return Array.from({ length: height }, (_u, y) =>
    Array.from({ length: width }, (_u2, x) => clampSlot(pixels?.[y]?.[x], fill))
  );
}

export const Msx2DialogueEditor: React.FC<Msx2DialogueEditorProps> = ({ dialogue, onUpdate, allAssets, paletteSlots, setStatusBarMessage }) => {
  const box = dialogue.box || { x: 8, y: 8, width: 240, height: 56, backgroundColor: 1, borderColor: 15, textColor: 15, portraitSide: 'left' as const, padding: 4 };
  const lines = Array.isArray(dialogue.lines) ? dialogue.lines : [];
  const portraits = Array.isArray(dialogue.portraits) ? dialogue.portraits : [];
  const exportOptions = dialogue.exportOptions || { charDelayFrames: 3, mouthToggleEveryChars: 2, stripUnsupportedChars: true };

  const [selectedPortraitId, setSelectedPortraitId] = useState<string | undefined>(dialogue.defaultPortraitId || portraits[0]?.id);
  const [activeFrame, setActiveFrame] = useState<'closed' | 'open'>('closed');
  const [paintSlot, setPaintSlot] = useState(15);
  const [previewNonce, setPreviewNonce] = useState(0);

  const palette = useMemo(() => {
    const slots = paletteSlots && paletteSlots.length === 16 ? paletteSlots : createDefaultScreen5PaletteSlots();
    return screen5SlotsToMsxColors(slots).map(color => color.hex);
  }, [paletteSlots]);

  const fontAssets = useMemo(() => allAssets.filter(asset => asset.type === 'msx2hudfont'), [allAssets]);
  const fontAsset = useMemo(() => {
    const byId = dialogue.fontAssetId ? fontAssets.find(asset => asset.id === dialogue.fontAssetId) : undefined;
    return (byId || fontAssets[0])?.data as Msx2HudFontAsset | undefined;
  }, [dialogue.fontAssetId, fontAssets]);

  const selectedPortrait = portraits.find(portrait => portrait.id === selectedPortraitId) || portraits[0];

  const updateBox = (patch: Partial<typeof box>) => onUpdate({ box: { ...box, ...patch } });
  const updateExport = (patch: Partial<typeof exportOptions>) => onUpdate({ exportOptions: { ...exportOptions, ...patch } });

  const updateLine = (lineId: string, patch: Partial<Msx2DialogueLine>) =>
    onUpdate({ lines: lines.map(line => (line.id === lineId ? { ...line, ...patch } : line)) });

  const addLine = () =>
    onUpdate({
      lines: [...lines, { id: `dlg_line_${Date.now()}`, speaker: lines[lines.length - 1]?.speaker || '', text: 'NEW LINE', waitForInput: true }],
    });

  const removeLine = (lineId: string) => onUpdate({ lines: lines.filter(line => line.id !== lineId) });

  const moveLine = (lineId: string, delta: number) => {
    const index = lines.findIndex(line => line.id === lineId);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= lines.length) return;
    const next = [...lines];
    [next[index], next[target]] = [next[target], next[index]];
    onUpdate({ lines: next });
  };

  const updatePortrait = (portraitId: string, patch: Partial<Msx2DialoguePortrait>) =>
    onUpdate({ portraits: portraits.map(portrait => (portrait.id === portraitId ? { ...portrait, ...patch } : portrait)) });

  const addPortrait = () => {
    const id = `dlg_portrait_${Date.now()}`;
    const blank = () => Array.from({ length: 32 }, () => new Array(32).fill(clampSlot(box.backgroundColor, 1)));
    const portrait: Msx2DialoguePortrait = { id, name: `Portrait ${portraits.length + 1}`, width: 32, height: 32, closedPixels: blank(), openPixels: blank() };
    onUpdate({ portraits: [...portraits, portrait], defaultPortraitId: dialogue.defaultPortraitId || id });
    setSelectedPortraitId(id);
  };

  const removePortrait = (portraitId: string) => {
    const next = portraits.filter(portrait => portrait.id !== portraitId);
    onUpdate({
      portraits: next,
      defaultPortraitId: dialogue.defaultPortraitId === portraitId ? next[0]?.id : dialogue.defaultPortraitId,
      lines: lines.map(line => (line.portraitId === portraitId ? { ...line, portraitId: undefined } : line)),
    });
    if (selectedPortraitId === portraitId) setSelectedPortraitId(next[0]?.id);
  };

  const resizePortrait = (portrait: Msx2DialoguePortrait, width: number, height: number) => {
    const bg = clampSlot(box.backgroundColor, 1);
    updatePortrait(portrait.id, {
      width,
      height,
      closedPixels: resizeFrame(portrait.closedPixels, width, height, bg),
      openPixels: resizeFrame(portrait.openPixels, width, height, bg),
    });
  };

  const paintPortraitPixel = (portrait: Msx2DialoguePortrait, frame: 'closed' | 'open', x: number, y: number, slot: number) => {
    const key = frame === 'closed' ? 'closedPixels' : 'openPixels';
    const source = frame === 'closed' ? portrait.closedPixels : portrait.openPixels;
    const next = resizeFrame(source, portrait.width, portrait.height, clampSlot(box.backgroundColor, 1));
    if (next[y]?.[x] === undefined || next[y][x] === slot) return;
    next[y] = [...next[y]];
    next[y][x] = slot;
    updatePortrait(portrait.id, { [key]: next } as Partial<Msx2DialoguePortrait>);
  };

  // ---- Head metatile round-trip against SCREEN 5 bitmap stamps (msx2bitmapstamp). ----
  const stampAssets = useMemo(() => allAssets.filter(asset => asset.type === 'msx2bitmapstamp'), [allAssets]);
  const activePaletteSlots = useMemo(
    () => (paletteSlots && paletteSlots.length === 16 ? paletteSlots : createDefaultScreen5PaletteSlots()),
    [paletteSlots]
  );

  /** Pour a chosen stamp metatile into the active frame, resizing the portrait to
   *  the stamp's dimensions (clamped to the 48px portrait ceiling = up to 3x3 tiles). */
  const importStampIntoFrame = (stampAsset: ProjectAsset) => {
    if (!selectedPortrait) return;
    const stamp = (stampAsset.data as Msx2BitmapStampAsset | undefined)?.stamp;
    if (!stamp || stamp.mode !== 'SCREEN5_BITMAP_STAMP' || !Array.isArray(stamp.tiles)) {
      setStatusBarMessage?.('El stamp seleccionado no es un metatile SCREEN 5 válido.');
      return;
    }
    const grid = bitmapStampToPixelGrid(stamp);
    const cols = Math.min(3, Math.max(1, stamp.columns));
    const rows = Math.min(3, Math.max(1, stamp.rows));
    const width = cols * 16;
    const height = rows * 16;
    const bg = clampSlot(box.backgroundColor, 1);
    const framePixels = Array.from({ length: height }, (_u, y) =>
      Array.from({ length: width }, (_u2, x) => clampSlot(grid[y]?.[x], bg))
    );
    const key = activeFrame === 'closed' ? 'closedPixels' : 'openPixels';
    const otherKey = activeFrame === 'closed' ? 'openPixels' : 'closedPixels';
    // Resize BOTH frames so the portrait stays rectangular; only the active frame
    // gets the imported pixels, the other is resized (padded) to match.
    updatePortrait(selectedPortrait.id, {
      width,
      height,
      [key]: framePixels,
      [otherKey]: resizeFrame(activeFrame === 'closed' ? selectedPortrait.openPixels : selectedPortrait.closedPixels, width, height, bg),
    } as Partial<Msx2DialoguePortrait>);
    const cropped = stamp.columns > cols || stamp.rows > rows;
    setStatusBarMessage?.(`Metatile "${stampAsset.name}" importado al frame ${activeFrame === 'closed' ? 'boca cerrada' : 'boca abierta'} (${width}x${height})${cropped ? ' — recortado a 48px máx.' : ''}.`);
  };

  /** Split the active frame into 16x16 tiles and create a new msx2bitmapstamp
   *  metatile asset (plus a matching SCREEN 5 palette asset when needed). */
  const exportFrameToStamp = () => {
    if (!selectedPortrait) return;
    if (selectedPortrait.width % 16 !== 0 || selectedPortrait.height % 16 !== 0) {
      setStatusBarMessage?.(`El retrato es ${selectedPortrait.width}x${selectedPortrait.height}: para exportar como stamp ambos lados deben ser múltiplo de 16 (16/32/48). Usa los botones de tamaño.`);
      return;
    }
    const framePixels = resizeFrame(
      activeFrame === 'closed' ? selectedPortrait.closedPixels : selectedPortrait.openPixels,
      selectedPortrait.width,
      selectedPortrait.height,
      clampSlot(box.backgroundColor, 1)
    );
    const stampName = `${selectedPortrait.name || dialogue.name || 'Head'} ${activeFrame === 'closed' ? 'closed' : 'open'}`;
    const matchingPalette = findMatchingScreen5PaletteAsset(activePaletteSlots, allAssets);
    const paletteAsset = matchingPalette ?? createScreen5PaletteAssetForTile(activePaletteSlots, stampName, 'pending', allAssets);
    const stampAsset = buildScreen5BitmapStampAsset({
      name: stampName,
      pixels: framePixels,
      paletteId: paletteAsset.id,
      palette: activePaletteSlots,
      existingAssets: matchingPalette ? allAssets : [...allAssets, paletteAsset],
      sourceType: 'manual-edit',
    });
    const newAssets = matchingPalette ? [stampAsset] : [paletteAsset, stampAsset];
    // No change to the dialogue asset itself; just register the new metatile(s).
    onUpdate({}, newAssets);
    setStatusBarMessage?.(`Metatile "${stampAsset.name}" (${selectedPortrait.width / 16}x${selectedPortrait.height / 16} tiles) creado en MSX2 Bitmap Stamps${matchingPalette ? '' : ' + paleta'}. Edítalo desde la librería de stamps.`);
  };

  // ---- Layout math shared with the preview (mirrors the ASM generator). ----
  const layout = useMemo(() => {
    const even = (v: number) => v & ~1;
    const boxW = Math.max(48, Math.min(254, even(clampInt(box.width, 16, 254, 240))));
    const boxH = Math.max(24, Math.min(GAME_H, clampInt(box.height, 24, GAME_H, 56)));
    const boxX = even(clampInt(box.x, 0, GAME_W - boxW, 8));
    const boxY = clampInt(box.y, 0, GAME_H - boxH, 8);
    const padding = even(clampInt(box.padding, 0, 8, 4));
    const anyPortrait = portraits.length > 0;
    const porMaxW = anyPortrait ? Math.max(...portraits.map(p => clampInt(p.width, 8, 48, 32))) : 0;
    const porMaxH = anyPortrait ? Math.max(...portraits.map(p => clampInt(p.height, 8, 48, 32))) : 0;
    const interiorX = boxX + 2;
    const interiorY = boxY + 2;
    const interiorW = boxW - 4;
    const interiorH = boxH - 4;
    const side = box.portraitSide === 'right' ? 'right' : 'left';
    const porX = porMaxW === 0 ? 0 : side === 'left' ? interiorX + padding : even(interiorX + interiorW - padding - porMaxW);
    const porY = porMaxH === 0 ? 0 : interiorY + padding;
    const textX = porMaxW === 0 || side === 'right' ? interiorX + padding : porX + porMaxW + padding;
    const textAvailW = side === 'right'
      ? (porMaxW === 0 ? interiorW - 2 * padding : porX - padding - textX)
      : interiorX + interiorW - padding - textX;
    const textCols = Math.floor(textAvailW / 8);
    const textRows = Math.floor((interiorH - 2 * padding) / 8);
    return { boxX, boxY, boxW, boxH, padding, porX, porY, porMaxW, porMaxH, textX, textY: interiorY + padding, textCols, textRows };
  }, [box, portraits]);

  // ---- Preview: typewriter + mouth animation on a 2x canvas. ----
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let disposed = false;
    let frameHandle = 0;

    const bg = palette[clampSlot(box.backgroundColor, 1)];
    const border = palette[clampSlot(box.borderColor, 15)];
    const textColor = palette[clampSlot(box.textColor, 15)];

    const drawGlyph = (char: string, px: number, py: number) => {
      const bitmap = (fontAsset as any)?.bitmapPatterns?.[char];
      if (fontAsset?.vdpMode === 'SCREEN5' && Array.isArray(bitmap)) {
        const fontBg = clampSlot(fontAsset.screen5BackgroundSlot, 0);
        for (let y = 0; y < 8; y++) {
          for (let x = 0; x < 8; x++) {
            const slot = clampSlot(bitmap[y]?.[x], fontBg);
            ctx.fillStyle = slot === fontBg ? bg : palette[slot];
            ctx.fillRect((px + x) * 2, (py + y) * 2, 2, 2);
          }
        }
        return;
      }
      const pattern = fontAsset?.patterns?.[char] || FALLBACK_PATTERNS[char];
      if (pattern) {
        for (let y = 0; y < 8; y++) {
          for (let x = 0; x < 8; x++) {
            ctx.fillStyle = ((Number(pattern[y]) || 0) & (0x80 >> x)) ? textColor : bg;
            ctx.fillRect((px + x) * 2, (py + y) * 2, 2, 2);
          }
        }
        return;
      }
      // No font glyph available: canvas text approximation (preview only).
      ctx.fillStyle = bg;
      ctx.fillRect(px * 2, py * 2, 16, 16);
      ctx.fillStyle = textColor;
      ctx.font = 'bold 14px monospace';
      ctx.textBaseline = 'top';
      ctx.fillText(char, px * 2 + 2, py * 2 + 1);
    };

    const drawPortraitFrame = (portrait: Msx2DialoguePortrait | undefined, open: boolean) => {
      if (!portrait || layout.porMaxW === 0) return;
      ctx.fillStyle = bg;
      ctx.fillRect(layout.porX * 2, layout.porY * 2, layout.porMaxW * 2, layout.porMaxH * 2);
      const frame = open ? portrait.openPixels : portrait.closedPixels;
      for (let y = 0; y < portrait.height; y++) {
        for (let x = 0; x < portrait.width; x++) {
          ctx.fillStyle = palette[clampSlot(frame?.[y]?.[x], 1)];
          ctx.fillRect((layout.porX + x) * 2, (layout.porY + y) * 2, 2, 2);
        }
      }
    };

    // Static backdrop + box.
    ctx.fillStyle = '#10102a';
    ctx.fillRect(0, 0, GAME_W * 2, GAME_H * 2);
    ctx.fillStyle = border;
    ctx.fillRect(layout.boxX * 2, layout.boxY * 2, layout.boxW * 2, layout.boxH * 2);
    ctx.fillStyle = bg;
    ctx.fillRect((layout.boxX + 2) * 2, (layout.boxY + 2) * 2, (layout.boxW - 4) * 2, (layout.boxH - 4) * 2);

    // Animation plan: for every line, the wrapped chars in order.
    const plan = lines.map(line => {
      const speakerPrefix = line.speaker ? `${line.speaker}: ` : '';
      const rows = wrapDialogueText(`${speakerPrefix}${line.text || ''}`.toUpperCase(), Math.max(1, layout.textCols), layout.textRows);
      const portrait = portraits.find(p => p.id === (line.portraitId || dialogue.defaultPortraitId));
      return { rows, portrait };
    });
    if (!plan.length) return;

    let lineIndex = 0;
    let rowIndex = 0;
    let colIndex = 0;
    let delay = 0;
    let charCount = 0;
    let mouthOpen = false;
    let linePause = 0;
    const charDelay = Math.max(0, clampInt(exportOptions.charDelayFrames, 0, 255, 3));
    const mouthEvery = Math.max(0, clampInt(exportOptions.mouthToggleEveryChars, 0, 255, 2));

    const startLine = () => {
      ctx.fillStyle = bg;
      ctx.fillRect(layout.textX * 2, layout.textY * 2, layout.textCols * 16, layout.textRows * 16);
      drawPortraitFrame(plan[lineIndex].portrait, false);
      mouthOpen = false;
      rowIndex = 0;
      colIndex = 0;
      charCount = 0;
      delay = 0;
    };
    startLine();

    const tick = () => {
      if (disposed) return;
      if (linePause > 0) {
        linePause--;
        if (linePause === 0) {
          lineIndex++;
          if (lineIndex >= plan.length) return; // preview ends after last line
          startLine();
        }
      } else if (delay > 0) {
        delay--;
      } else {
        const rows = plan[lineIndex].rows;
        if (rowIndex >= rows.length) {
          drawPortraitFrame(plan[lineIndex].portrait, false);
          linePause = 60;
        } else if (colIndex >= rows[rowIndex].length) {
          rowIndex++;
          colIndex = 0;
        } else {
          const char = rows[rowIndex][colIndex];
          drawGlyph(char, layout.textX + colIndex * 8, layout.textY + rowIndex * 8);
          colIndex++;
          charCount++;
          if (mouthEvery > 0 && charCount % mouthEvery === 0) {
            mouthOpen = !mouthOpen;
            drawPortraitFrame(plan[lineIndex].portrait, mouthOpen);
          }
          delay = charDelay;
        }
      }
      frameHandle = requestAnimationFrame(tick);
    };
    frameHandle = requestAnimationFrame(tick);
    return () => {
      disposed = true;
      cancelAnimationFrame(frameHandle);
    };
  }, [previewNonce, lines, portraits, layout, palette, box, exportOptions, fontAsset, dialogue.defaultPortraitId]);

  // ---- Portrait frame canvas painting. ----
  const frameCanvasRef = useRef<HTMLCanvasElement>(null);
  const paintingRef = useRef(false);
  useEffect(() => {
    const canvas = frameCanvasRef.current;
    if (!canvas || !selectedPortrait) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const zoom = 8;
    const frame = activeFrame === 'closed' ? selectedPortrait.closedPixels : selectedPortrait.openPixels;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < selectedPortrait.height; y++) {
      for (let x = 0; x < selectedPortrait.width; x++) {
        ctx.fillStyle = palette[clampSlot(frame?.[y]?.[x], 1)];
        ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
      }
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    for (let x = 0; x <= selectedPortrait.width; x += 8) {
      ctx.beginPath(); ctx.moveTo(x * zoom, 0); ctx.lineTo(x * zoom, selectedPortrait.height * zoom); ctx.stroke();
    }
    for (let y = 0; y <= selectedPortrait.height; y += 8) {
      ctx.beginPath(); ctx.moveTo(0, y * zoom); ctx.lineTo(selectedPortrait.width * zoom, y * zoom); ctx.stroke();
    }
  }, [selectedPortrait, activeFrame, palette, portraits]);

  const handleFramePaint = (event: React.MouseEvent<HTMLCanvasElement>, isRightClick: boolean) => {
    if (!selectedPortrait) return;
    const canvas = frameCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * selectedPortrait.width);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * selectedPortrait.height);
    if (x < 0 || y < 0 || x >= selectedPortrait.width || y >= selectedPortrait.height) return;
    paintPortraitPixel(selectedPortrait, activeFrame, x, y, isRightClick ? clampSlot(box.backgroundColor, 1) : paintSlot);
  };

  const slotSelector = (label: string, value: number, onChange: (slot: number) => void) => (
    <div className="flex items-center gap-1">
      <span className="text-xs text-msx-textsecondary w-20">{label}</span>
      <div className="flex flex-wrap gap-0.5">
        {palette.map((hex, slot) => (
          <button
            key={slot}
            title={`Slot ${slot}`}
            onClick={() => onChange(slot)}
            className={`w-4 h-4 border ${value === slot ? 'border-msx-accent ring-1 ring-msx-accent' : 'border-msx-border'}`}
            style={{ backgroundColor: hex }}
          />
        ))}
      </div>
    </div>
  );

  const numberField = (label: string, value: number, min: number, max: number, step: number, onChange: (value: number) => void) => (
    <label className="flex items-center gap-1 text-xs text-msx-textsecondary">
      <span className="w-16">{label}</span>
      <input
        type="number"
        className="w-16 bg-msx-panelbg border border-msx-border rounded px-1 py-0.5 text-msx-textprimary"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={event => onChange(clampInt(event.target.value, min, max, value))}
      />
    </label>
  );

  return (
    <div className="flex h-full gap-2 p-2 overflow-auto text-msx-textprimary">
      {/* Left: lines + box config */}
      <div className="flex flex-col gap-2 w-[46%] min-w-[380px]">
        <Panel title={`Dialogue Lines (${lines.length})`} icon={<PencilIcon className="w-4 h-4" />}>
          <div className="flex flex-col gap-2 p-1 max-h-[40vh] overflow-y-auto">
            {lines.map((line, index) => (
              <div key={line.id} className="border border-msx-border rounded p-1.5 flex flex-col gap-1 bg-msx-panelbg/60">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-msx-textsecondary w-4">{index + 1}</span>
                  <input
                    className="w-28 bg-msx-panelbg border border-msx-border rounded px-1 py-0.5 text-xs"
                    placeholder="Speaker"
                    value={line.speaker || ''}
                    onChange={event => updateLine(line.id, { speaker: event.target.value })}
                  />
                  <select
                    className="bg-msx-panelbg border border-msx-border rounded px-1 py-0.5 text-xs"
                    value={line.portraitId || ''}
                    onChange={event => updateLine(line.id, { portraitId: event.target.value || undefined })}
                    title="Portrait for this line (empty = default)"
                  >
                    <option value="">Default portrait</option>
                    {portraits.map(portrait => (
                      <option key={portrait.id} value={portrait.id}>{portrait.name}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1 text-[10px] text-msx-textsecondary" title="Wait for talk key before the next line">
                    <input
                      type="checkbox"
                      checked={line.waitForInput !== false}
                      onChange={event => updateLine(line.id, { waitForInput: event.target.checked })}
                    />
                    wait
                  </label>
                  <div className="ml-auto flex gap-0.5">
                    <button className="px-1 text-xs hover:text-msx-accent" title="Move up" onClick={() => moveLine(line.id, -1)}>▲</button>
                    <button className="px-1 text-xs hover:text-msx-accent" title="Move down" onClick={() => moveLine(line.id, 1)}>▼</button>
                    <button className="px-1 text-xs text-msx-danger hover:text-red-400" title="Delete line" onClick={() => removeLine(line.id)}><TrashIcon className="w-3 h-3" /></button>
                  </div>
                </div>
                <textarea
                  className="bg-msx-panelbg border border-msx-border rounded px-1 py-0.5 text-xs font-mono resize-y min-h-[36px]"
                  value={line.text}
                  onChange={event => updateLine(line.id, { text: event.target.value })}
                />
              </div>
            ))}
            <Button size="sm" variant="ghost" icon={<PlusCircleIcon className="w-4 h-4" />} onClick={addLine}>Add Line</Button>
          </div>
        </Panel>

        <Panel title="Box & Typewriter">
          <div className="flex flex-col gap-1.5 p-1">
            <div className="flex flex-wrap gap-2">
              {numberField('X', box.x, 0, 254, 2, value => updateBox({ x: value }))}
              {numberField('Y', box.y, 0, GAME_H - 24, 1, value => updateBox({ y: value }))}
              {numberField('Width', box.width, 48, 254, 2, value => updateBox({ width: value }))}
              {numberField('Height', box.height, 24, GAME_H, 1, value => updateBox({ height: value }))}
              {numberField('Padding', box.padding, 0, 8, 2, value => updateBox({ padding: value }))}
            </div>
            {slotSelector('Background', clampSlot(box.backgroundColor, 1), slot => updateBox({ backgroundColor: slot }))}
            {slotSelector('Border', clampSlot(box.borderColor, 15), slot => updateBox({ borderColor: slot }))}
            {slotSelector('Text', clampSlot(box.textColor, 15), slot => updateBox({ textColor: slot }))}
            <div className="flex flex-wrap gap-2 items-center">
              <label className="flex items-center gap-1 text-xs text-msx-textsecondary">
                <span>Portrait side</span>
                <select
                  className="bg-msx-panelbg border border-msx-border rounded px-1 py-0.5 text-xs"
                  value={box.portraitSide || 'left'}
                  onChange={event => updateBox({ portraitSide: event.target.value === 'right' ? 'right' : 'left' })}
                >
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </label>
              {numberField('Char delay', exportOptions.charDelayFrames, 0, 255, 1, value => updateExport({ charDelayFrames: value }))}
              {numberField('Mouth every', exportOptions.mouthToggleEveryChars, 0, 255, 1, value => updateExport({ mouthToggleEveryChars: value }))}
            </div>
            <label className="flex items-center gap-1 text-xs text-msx-textsecondary">
              <span>Font</span>
              <select
                className="bg-msx-panelbg border border-msx-border rounded px-1 py-0.5 text-xs"
                value={dialogue.fontAssetId || ''}
                onChange={event => onUpdate({ fontAssetId: event.target.value || undefined })}
              >
                <option value="">Room HUD font (auto)</option>
                {fontAssets.map(asset => (
                  <option key={asset.id} value={asset.id}>{asset.name}</option>
                ))}
              </select>
            </label>
            <p className="text-[10px] text-msx-textsecondary">
              Text area: {layout.textCols} cols x {layout.textRows} rows. Talk key (UP/SPACE) is set on each NPC in the bitmap room editor.
            </p>
          </div>
        </Panel>
      </div>

      {/* Right: portraits + preview */}
      <div className="flex flex-col gap-2 flex-1 min-w-[420px]">
        <Panel title="Talking Head (2 frames)">
          <div className="flex gap-2 p-1">
            <div className="flex flex-col gap-1 w-40">
              {portraits.map(portrait => (
                <div key={portrait.id} className={`flex items-center gap-1 px-1 py-0.5 rounded cursor-pointer ${selectedPortrait?.id === portrait.id ? 'bg-msx-border' : 'hover:bg-msx-border/40'}`} onClick={() => setSelectedPortraitId(portrait.id)}>
                  <input
                    className="flex-1 min-w-0 bg-transparent border-b border-transparent focus:border-msx-border text-xs"
                    value={portrait.name}
                    onChange={event => updatePortrait(portrait.id, { name: event.target.value })}
                  />
                  <input
                    type="radio"
                    name="default-portrait"
                    title="Default portrait"
                    checked={dialogue.defaultPortraitId === portrait.id}
                    onChange={() => onUpdate({ defaultPortraitId: portrait.id })}
                  />
                  <button className="text-msx-danger hover:text-red-400" title="Delete portrait" onClick={event => { event.stopPropagation(); removePortrait(portrait.id); }}><TrashIcon className="w-3 h-3" /></button>
                </div>
              ))}
              <Button size="sm" variant="ghost" icon={<PlusCircleIcon className="w-4 h-4" />} onClick={addPortrait}>Add Portrait</Button>
              {selectedPortrait && (
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex gap-1">
                    {numberField('W', selectedPortrait.width, 8, 48, 8, value => resizePortrait(selectedPortrait, value, selectedPortrait.height))}
                    {numberField('H', selectedPortrait.height, 8, 48, 8, value => resizePortrait(selectedPortrait, selectedPortrait.width, value))}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => updatePortrait(selectedPortrait.id, { openPixels: resizeFrame(selectedPortrait.closedPixels, selectedPortrait.width, selectedPortrait.height, clampSlot(box.backgroundColor, 1)) })}
                  >
                    Copy closed → open
                  </Button>
                  <div className="flex gap-1 mt-1">
                    <Button size="sm" variant="ghost" onClick={() => resizePortrait(selectedPortrait, 16, 16)}>16²</Button>
                    <Button size="sm" variant="ghost" onClick={() => resizePortrait(selectedPortrait, 32, 32)}>32²</Button>
                    <Button size="sm" variant="ghost" onClick={() => resizePortrait(selectedPortrait, 48, 48)}>48²</Button>
                  </div>

                  {/* Head metatile round-trip (msx2bitmapstamp). */}
                  <div className="mt-2 border-t border-msx-border pt-1 flex flex-col gap-1">
                    <span className="text-[10px] text-msx-highlight">Metatile (stamp 16×16)</span>
                    <select
                      className="bg-msx-panelbg border border-msx-border rounded px-1 py-0.5 text-[10px]"
                      value=""
                      onChange={event => {
                        const asset = stampAssets.find(item => item.id === event.target.value);
                        if (asset) importStampIntoFrame(asset);
                        event.target.value = '';
                      }}
                      title="Importa un stamp (metatile) al frame activo"
                    >
                      <option value="">{stampAssets.length ? `Importar stamp → ${activeFrame === 'closed' ? 'boca cerrada' : 'boca abierta'}…` : 'No hay stamps en el proyecto'}</option>
                      {stampAssets.map(asset => (
                        <option key={asset.id} value={asset.id}>{asset.name}</option>
                      ))}
                    </select>
                    <Button size="sm" variant="ghost" icon={<SaveFloppyIcon className="w-3 h-3" />} onClick={exportFrameToStamp}>
                      Exportar frame → stamp
                    </Button>
                    <span className="text-[9px] text-msx-textsecondary leading-tight">
                      El stamp se compone de tiles 16×16 editables. Requiere lados múltiplo de 16.
                    </span>
                  </div>
                </div>
              )}
            </div>
            {selectedPortrait && (
              <div className="flex flex-col gap-1">
                <div className="flex gap-1">
                  <Button size="sm" variant={activeFrame === 'closed' ? 'primary' : 'ghost'} onClick={() => setActiveFrame('closed')}>Mouth closed</Button>
                  <Button size="sm" variant={activeFrame === 'open' ? 'primary' : 'ghost'} onClick={() => setActiveFrame('open')}>Mouth open</Button>
                </div>
                <canvas
                  ref={frameCanvasRef}
                  width={selectedPortrait.width * 8}
                  height={selectedPortrait.height * 8}
                  className="border border-msx-border cursor-crosshair"
                  style={{ imageRendering: 'pixelated', width: selectedPortrait.width * 8, height: selectedPortrait.height * 8 }}
                  onMouseDown={event => { paintingRef.current = true; handleFramePaint(event, event.button === 2); }}
                  onMouseMove={event => { if (paintingRef.current) handleFramePaint(event, (event.buttons & 2) !== 0); }}
                  onMouseUp={() => { paintingRef.current = false; }}
                  onMouseLeave={() => { paintingRef.current = false; }}
                  onContextMenu={event => event.preventDefault()}
                />
                <div className="flex flex-wrap gap-0.5 items-center">
                  <span className="text-[10px] text-msx-textsecondary mr-1">Paint:</span>
                  {palette.map((hex, slot) => (
                    <button
                      key={slot}
                      title={`Slot ${slot}`}
                      onClick={() => setPaintSlot(slot)}
                      className={`w-4 h-4 border ${paintSlot === slot ? 'border-msx-accent ring-1 ring-msx-accent' : 'border-msx-border'}`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                  <span className="text-[10px] text-msx-textsecondary ml-2">Right-click = background</span>
                </div>
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Preview (typewriter + mouth)">
          <div className="flex flex-col gap-1 items-start p-1">
            <Button size="sm" variant="primary" icon={<PlayIcon className="w-4 h-4" />} onClick={() => setPreviewNonce(nonce => nonce + 1)}>Replay</Button>
            <canvas
              ref={previewCanvasRef}
              width={GAME_W * 2}
              height={GAME_H * 2}
              className="border border-msx-border"
              style={{ imageRendering: 'pixelated' }}
            />
            {!fontAsset && (
              <p className="text-[10px] text-msx-warning">No msx2hudfont asset in the project: preview text is approximated; the ROM will use the built-in HUD charset.</p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
};
