// 6x8 SCREEN 5 GameFlow font.
//
// Glyphs are authored as 5x7 pixel rows and stored as 8 ROM bytes per character
// with the 5 pixels left-aligned on bits 7..3. The runtime blitter always reads
// 6 pixels per row, so bit 2 stays clear and becomes the inter-character gap.
// Characters are ASCII 32..90 (space .. 'Z') so the runtime can index the table
// with `(char - 32) * 8` without a lookup table.

export const SCREEN5_FLOW_FONT_FIRST_CHAR = 32;
export const SCREEN5_FLOW_FONT_LAST_CHAR = 90;
export const SCREEN5_FLOW_FONT_GLYPH_COUNT = SCREEN5_FLOW_FONT_LAST_CHAR - SCREEN5_FLOW_FONT_FIRST_CHAR + 1;
export const SCREEN5_FLOW_CHAR_WIDTH_BYTES = 3; // 6 pixels
export const SCREEN5_FLOW_CHAR_HEIGHT = 8;

const BLANK = ['00000', '00000', '00000', '00000', '00000', '00000', '00000'];

const GLYPHS: Record<string, string[]> = {
  ' ': BLANK,
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '"': ['01010', '01010', '00000', '00000', '00000', '00000', '00000'],
  '#': ['01010', '11111', '01010', '01010', '01010', '11111', '01010'],
  '$': ['00100', '01111', '10100', '01110', '00101', '11110', '00100'],
  '%': ['11000', '11001', '00010', '00100', '01000', '10011', '00011'],
  '&': ['01000', '10100', '10100', '01000', '10101', '10010', '01101'],
  "'": ['00100', '00100', '00000', '00000', '00000', '00000', '00000'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  '*': ['00000', '10101', '01110', '11111', '01110', '10101', '00000'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  ',': ['00000', '00000', '00000', '00000', '01100', '01100', '01000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
  '6': ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  ';': ['00000', '01100', '01100', '00000', '01100', '01100', '01000'],
  '<': ['00010', '00100', '01000', '10000', '01000', '00100', '00010'],
  '=': ['00000', '00000', '11111', '00000', '11111', '00000', '00000'],
  '>': ['01000', '00100', '00010', '00001', '00010', '00100', '01000'],
  '?': ['01110', '10001', '00001', '00010', '00100', '00000', '00100'],
  '@': ['01110', '10001', '10111', '10101', '10111', '10000', '01110'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
};

/** Returns the ROM bytes of the whole font table (glyphCount * 8 bytes). */
export function buildScreen5FlowFontBytes(): number[] {
  const bytes: number[] = [];
  for (let code = SCREEN5_FLOW_FONT_FIRST_CHAR; code <= SCREEN5_FLOW_FONT_LAST_CHAR; code++) {
    const glyph = GLYPHS[String.fromCharCode(code)] || BLANK;
    for (let row = 0; row < 7; row++) {
      const pattern = glyph[row] || '00000';
      let value = 0;
      for (let column = 0; column < 5; column++) {
        if (pattern[column] === '1') value |= 0x80 >> column;
      }
      bytes.push(value & 0xf8);
    }
    bytes.push(0); // 8th row keeps a blank line between text rows
  }
  return bytes;
}

/** Uppercases and drops anything the font cannot draw. */
export function sanitizeScreen5FlowText(value: unknown, maxLength: number): string {
  const text = String(value ?? '')
    .toUpperCase()
    .replace(/[ÁÀÄÂ]/g, 'A')
    .replace(/[ÉÈËÊ]/g, 'E')
    .replace(/[ÍÌÏÎ]/g, 'I')
    .replace(/[ÓÒÖÔ]/g, 'O')
    .replace(/[ÚÙÜÛ]/g, 'U')
    .replace(/Ñ/g, 'N')
    .replace(/Ç/g, 'C');
  let out = '';
  for (const character of text) {
    const code = character.charCodeAt(0);
    out += code >= SCREEN5_FLOW_FONT_FIRST_CHAR && code <= SCREEN5_FLOW_FONT_LAST_CHAR ? character : ' ';
  }
  return out.slice(0, maxLength);
}

/** Word-wraps sanitized text into at most `maxLines` lines of `maxColumns` chars. */
export function wrapScreen5FlowText(value: unknown, maxColumns: number, maxLines: number): string[] {
  const paragraphs = String(value ?? '').replace(/\r/g, '').split('\n');
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    const words = sanitizeScreen5FlowText(paragraph, 4096).split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      continue;
    }
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length > maxColumns && current) {
        lines.push(current);
        current = word.slice(0, maxColumns);
      } else {
        current = candidate.slice(0, maxColumns);
      }
    }
    if (current) lines.push(current);
  }
  return lines.slice(0, maxLines);
}
