/**
 * Pixel layout of a SCREEN 5 GameFlow SubMenu (generic walker backend).
 *
 * Shared by the generator (msx2Screen5FlowGenerator.ts) and the GameFlow
 * editor (validation + layout preview), so both agree on where every option
 * row lands and on when a menu does not fit.
 */
import type { Msx2GameFlowSubMenuNode } from '../types';
import { sanitizeScreen5FlowText } from './msxGenerator/generators/msx2/msx2Screen5FlowFont';
import {
  GF_CHAR_WIDTH_BYTES,
  GF_MAX_COLUMNS,
  GF_MENU_FIRST_OPTION_Y,
  GF_MENU_OPTION_STEP,
  GF_MENU_TITLE_Y,
} from './msxGenerator/generators/msx2/msx2Screen5FlowRuntime';

export interface Screen5MenuItemLayout {
  idleText: string;
  selectedText: string;
  /** Span printed for the row, in 6px character cells. */
  spanCharacters: number;
  /** Byte column (3 bytes per character cell) of the span. */
  column: number;
  y: number;
}

export interface Screen5MenuLayout {
  items: Screen5MenuItemLayout[];
  horizontal: boolean;
  useBar: boolean;
  titleY: number;
  titleColumn?: number;
  error?: string;
}

/**
 * Pixel layout of a SCREEN 5 SubMenu. With no layout/cursor fields set it
 * reproduces the classic centred highlight-bar menu exactly (same strings, same
 * coordinates), so existing flows keep a byte-identical ROM.
 */
export function resolveScreen5MenuLayout(menuNode: Msx2GameFlowSubMenuNode, rawTexts: string[]): Screen5MenuLayout {
  const cursorStyle = menuNode.cursorStyle === 'arrow' || menuNode.cursorStyle === 'arrow_bar' ? menuNode.cursorStyle : 'bar';
  const useArrow = cursorStyle !== 'bar';
  const useBar = cursorStyle !== 'arrow';
  const cursorChar = sanitizeScreen5FlowText(String(menuNode.cursorChar || '>').slice(0, 1), 1) || '>';
  const horizontal = menuNode.layout === 'horizontal';
  const align = menuNode.align === 'left' ? 'left' : 'center';
  const clampPx = (value: unknown, min: number, max: number, fallback: number): number => {
    const numeric = Math.trunc(Number(value));
    if (!Number.isFinite(numeric) || value === undefined || value === null || value === '') return fallback;
    return Math.max(min, Math.min(max, numeric));
  };
  const hasMenuX = menuNode.menuX !== undefined && menuNode.menuX !== null && Number.isFinite(Number(menuNode.menuX));
  const firstY = clampPx(menuNode.menuY, 0, 204, GF_MENU_FIRST_OPTION_Y);
  const spacing = clampPx(menuNode.optionSpacing, 10, 40, GF_MENU_OPTION_STEP);
  const titleY = clampPx(menuNode.titleY, 0, 204, GF_MENU_TITLE_Y);
  const columnOfPx = (px: number): number => Math.floor(Math.max(0, Math.min(255, px)) / 6);
  const leftCells = 2;

  const optionTexts = rawTexts.map(text => sanitizeScreen5FlowText(text || '', GF_MAX_COLUMNS - 4));
  const maxLength = Math.max(...optionTexts.map(text => text.length));

  if (!horizontal) {
    let spanCharacters: number;
    let render: (text: string, selected: boolean) => string;
    if (!useArrow) {
      // Classic: every option centred inside a span 4 cells wider than the longest.
      spanCharacters = maxLength + 4;
      render = text => {
        const padding = Math.max(0, spanCharacters - text.length);
        const left = align === 'left' ? 1 : Math.floor(padding / 2);
        return `${' '.repeat(left)}${text}${' '.repeat(padding - left)}`;
      };
    } else {
      // Cursor glyph + space + left-aligned text (+1 cell of bar margin).
      spanCharacters = maxLength + (useBar ? 3 : 2);
      render = (text, selected) => `${selected ? cursorChar : ' '} ${text}`.padEnd(spanCharacters, ' ');
    }
    const spanCells = Math.min(GF_MAX_COLUMNS, spanCharacters);
    const startCell = hasMenuX
      ? Math.min(columnOfPx(Number(menuNode.menuX)), GF_MAX_COLUMNS - spanCells)
      : align === 'left'
        ? leftCells
        : Math.max(0, Math.floor((GF_MAX_COLUMNS - spanCells) / 2));
    const classic = !useArrow && !hasMenuX && align === 'center';
    const lastY = firstY + (optionTexts.length - 1) * spacing;
    if (lastY > 204) {
      return { items: [], horizontal, useBar, titleY, error: `options do not fit: last row at y=${lastY} (max 204). Lower menuY or optionSpacing.` };
    }
    return {
      horizontal,
      useBar,
      titleY,
      titleColumn: classic ? undefined : (align === 'left' || hasMenuX) ? startCell * GF_CHAR_WIDTH_BYTES : undefined,
      items: optionTexts.map((text, index) => ({
        idleText: render(text, false),
        selectedText: render(text, true),
        spanCharacters: spanCells,
        // The classic layout lets printCall centre the span itself.
        column: classic ? Math.max(0, Math.floor((GF_MAX_COLUMNS - Math.min(spanCharacters, GF_MAX_COLUMNS)) / 2)) * GF_CHAR_WIDTH_BYTES : startCell * GF_CHAR_WIDTH_BYTES,
        y: firstY + index * spacing,
      })),
    };
  }

  // Horizontal: options side by side on one row, separated by one blank cell.
  const cells = optionTexts.map(text => text.length + (useArrow ? 2 : 0) + (useBar ? 2 : 0));
  const gap = 1;
  const totalCells = cells.reduce((sum, value) => sum + value, 0) + gap * (cells.length - 1);
  if (totalCells > GF_MAX_COLUMNS) {
    return { items: [], horizontal, useBar, titleY, error: `horizontal options need ${totalCells} character cells but the row has ${GF_MAX_COLUMNS}. Shorten the texts or use the vertical layout.` };
  }
  let cell = hasMenuX
    ? Math.min(columnOfPx(Number(menuNode.menuX)), GF_MAX_COLUMNS - totalCells)
    : align === 'left'
      ? Math.min(leftCells, GF_MAX_COLUMNS - totalCells)
      : Math.floor((GF_MAX_COLUMNS - totalCells) / 2);
  const startCell = cell;
  const items = optionTexts.map((text, index) => {
    const span = cells[index];
    const pad = useBar ? ' ' : '';
    const render = (selected: boolean) => `${pad}${useArrow ? `${selected ? cursorChar : ' '} ` : ''}${text}${pad}`.padEnd(span, ' ');
    const item: Screen5MenuItemLayout = {
      idleText: render(false),
      selectedText: render(true),
      spanCharacters: span,
      column: cell * GF_CHAR_WIDTH_BYTES,
      y: firstY,
    };
    cell += span + gap;
    return item;
  });
  return {
    horizontal,
    useBar,
    titleY,
    titleColumn: (align === 'left' || hasMenuX) ? startCell * GF_CHAR_WIDTH_BYTES : undefined,
    items,
  };
}
