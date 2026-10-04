// Intro node (illustrated slides + typewriter text) for the SCREEN 5 bitmap-room GameFlow.
//
// The resident 32 KB window of a real project is full (test703: 247 bytes free), so the
// interpreter does NOT live there. Everything except a ~60 byte trampoline is emitted into
// its own Konami SCC data bank mapped at P2 (#8000):
//
//   bank C   : interpreter + script (palettes, image/zone/step records, text) + fonts
//   bank C+1..: image rows (4 bpp, or 1 bpp for "mono" images; row-aligned so a row never straddles a bank)
//
// Music keeps playing: every driver moves P2 (the SCC maps its chip window there, the PT3
// replayer maps its module and then forces P2 back to bank 2; `mapper_bank_p2_current` is NOT
// updated by mapper_set_bank_p2), so the interpreter calls music_update through a resident
// wrapper that maps the intro bank again before returning. One tick per frame, like the
// gameplay loop.
//
// Images are written to VRAM page 0 row by row (the intro runs before any room is loaded and
// after the previous node, on the displayed page), so no command-engine time is spent.

import type { ProjectAnalysis } from '../../../asmTemplateGenerator';
import type {
  Msx2GameFlowGraph,
  Msx2GameFlowIntroNode,
  Msx2HudFontAsset,
  Msx2IntroAsset,
  Msx2IntroSlide,
  Msx2IntroTextZone,
  ProjectAsset,
} from '../../../../types';
import {
  INTRO_CHAR_H,
  layoutZoneText,
  normalizeScreenRect,
  renderIntroImagePixels,
  resolveIntroFont,
  type IntroFont,
} from '../../../msx2IntroUtils';
import { ensureScreen5PaletteSlots } from '../../../msx2PaletteUtils';
import { buildScreen5PaletteBytes } from './screen5PresentationData';
import { buildScreen5FlowFontBytes } from './msx2Screen5FlowFont';

/** Placeholder line in the runtime ASM where the Intro's resident routines are spliced (see buildRuntimeAsm). */
export const INTRO_RESIDENT_MARKER = '; @@BITMAP_INTRO_RESIDENT@@';

export const BITMAP_INTRO_RAM_BASE = 0xe600;
/** Scratch RAM used by the interpreter (see the equates below): #E600-#E6FF. */
const INTRO_RAM_BYTES = 0x100;
const BANK_BYTES = 0x2000;
const MAX_BANK = 255;
const ZONE_RECORD_BYTES = 11;
/** Glyph indices must stay below the #FE newline / #FF end markers. */
const MAX_GLYPHS = 250;
/** Interpreter + fade table + 1 bpp expander plus headroom. scripts/check_msx2_intro_smoke.mjs fails if glass produces more than this. */
export const INTRO_CODE_BYTES_ESTIMATE = 1800;
const CODE_BYTES_ESTIMATE = INTRO_CODE_BYTES_ESTIMATE;
const CODE_BANK_DATA_BUDGET = BANK_BYTES - CODE_BYTES_ESTIMATE;
const SCREEN_LINES = 212; // the bitmap runtime displays 212 lines (R#9 = #80)
const byteOr = (value: unknown, fallback: number): number => (Number.isFinite(Number(value)) ? Number(value) : fallback);
const NEWLINE = 0xfe;
const TEXT_END = 0xff;
/** (and-mask, or-mask) per byte of the 5x3 "more" triangle, rows top to bottom (3 bytes per row). */
const MARKER_MASKS: Array<[number, number]> = [
  [0x00, 0xff], [0x00, 0xff], [0x0f, 0xf0],
  [0xf0, 0x0f], [0x00, 0xff], [0xff, 0x00],
  [0xff, 0x00], [0x0f, 0xf0], [0xff, 0x00],
];

const hex = (value: number, width = 2): string => `#${(value & (width === 2 ? 0xff : 0xffff)).toString(16).toUpperCase().padStart(width, '0')}`;
const isSccWindowBank = (bank: number): boolean => (bank & 0x3f) === 0x3f;
/** Script counters are one byte: refuse to export something that would silently wrap. */
const oneByte = (n: number, what: string): number => {
  if (n > 255) throw new Error(`Intro export: ${what} is ${n}, but the script format holds at most 255. Split it into several slides/intros.`);
  return n;
};
/** Text that goes into an ASM comment: names come from the project and may contain line breaks. */
const oneLine = (text: unknown): string => String(text ?? '').replace(/[\r\n\t]+/g, ' ');
const dbLines = (bytes: number[]): string[] => {
  const lines: string[] = [];
  for (let i = 0; i < bytes.length; i += 16) lines.push(`    DB ${bytes.slice(i, i + 16).map(b => hex(b)).join(',')}`);
  return lines;
};

export interface BitmapIntroBuild {
  /** Intro asset id -> index passed in A to bitmap_intro_run. */
  introIndexById: Map<string, number>;
  equatesAsm: string;
  residentAsm: string;
  banksAsm: string;
  /** Last bank number used (== firstBank - 1 when the build is empty). */
  lastBank: number;
  /** Banks emitted in banksAsm, for the IDE bank map. `used` is absent for the code bank: only Glass can size it. */
  banks: Array<{ bank: number; kind: 'code' | 'image'; used?: number }>;
  warnings: string[];
}

export const EMPTY_BITMAP_INTRO_BUILD: Readonly<BitmapIntroBuild> = Object.freeze({
  introIndexById: new Map<string, number>(),
  equatesAsm: '',
  residentAsm: '',
  banksAsm: '',
  lastBank: 0,
  banks: [] as BitmapIntroBuild['banks'],
  warnings: [] as string[],
});

interface FontExport {
  key: string;
  cellBytes: number;
  glyphs: number[][]; // 8 rows each; last entry = blank glyph
  indexOf(ch: string): number;
}

/** Glyph table of a font (1bpp rows). Bitmap-colour fonts are reduced to their mask. */
function exportFont(assets: ProjectAsset[], font: IntroFont, warnings: string[]): FontExport {
  if (!font.custom) {
    const bytes = buildScreen5FlowFontBytes();
    const glyphs: number[][] = [];
    for (let i = 0; i + 8 <= bytes.length; i += 8) glyphs.push(bytes.slice(i, i + 8));
    return {
      key: 'builtin',
      cellBytes: 3,
      glyphs,
      indexOf: ch => Math.max(0, Math.min(glyphs.length - 1, ch.charCodeAt(0) - 32)),
    };
  }
  const asset = assets.find(a => a.id === font.id && a.type === 'msx2hudfont');
  const data = asset?.data as Msx2HudFontAsset | undefined;
  let chars = Array.from(data?.characters ?? '');
  if (chars.length > MAX_GLYPHS) {
    warnings.push(`Intro font "${font.name}" has ${chars.length} characters; only the first ${MAX_GLYPHS} can be used (#FE/#FF are text markers).`);
    chars = chars.slice(0, MAX_GLYPHS);
  }
  // The 1bpp mask every font carries; colour (SCREEN 5 bitmap) glyphs are not used by the Intro.
  const glyphs = chars.map(ch => Array.from({ length: 8 }, (_u, row) => (ch === ' ' ? 0 : Number(data?.patterns?.[ch]?.[row]) & 0xff)));
  if (data?.vdpMode === 'SCREEN5' && data.bitmapPatterns) {
    warnings.push(`Intro font "${font.name}" is a colour font; the Intro draws its shapes in the zone text colour.`);
  }
  glyphs.push([0, 0, 0, 0, 0, 0, 0, 0]); // blank glyph: unknown characters and spaces the font lacks
  const blank = glyphs.length - 1;
  const index = new Map(chars.map((ch, i) => [ch, i]));
  // Cell width in bytes (2 px each): 4 for an 8x8 font, 2 for a SCREEN 5 font set to 4x8 (half width).
  return { key: String(font.id), cellBytes: font.cellW >> 1, glyphs, indexOf: ch => index.get(ch) ?? blank };
}

interface ImageChunk { bank: number; addr: number; rows: number }

/** Image rows are packed row-aligned into banks; identical images share their bytes. */
class ImagePacker {
  private banks: Array<{ bank: number; used: number; bytes: number[] }> = [];
  private dedupe = new Map<string, ImageChunk[]>();
  private nextBank: number;
  constructor(firstBank: number) { this.nextBank = firstBank; }

  private open(): { bank: number; used: number; bytes: number[] } {
    while (isSccWindowBank(this.nextBank)) this.nextBank++;
    if (this.nextBank > MAX_BANK) throw new Error(`Intro images exceed the 2 MB Konami SCC MegaROM limit (bank ${this.nextBank} > ${MAX_BANK}).`);
    const created = { bank: this.nextBank++, used: 0, bytes: [] as number[] };
    this.banks.push(created);
    return created;
  }

  place(packedRows: number[][]): ImageChunk[] {
    const key = packedRows.map(row => row.join(',')).join('|');
    const known = this.dedupe.get(key);
    if (known) return known;
    const chunks: ImageChunk[] = [];
    let current = this.banks[this.banks.length - 1];
    let row = 0;
    while (row < packedRows.length) {
      const rowBytes = packedRows[row].length;
      if (!current || current.used + rowBytes > BANK_BYTES) current = this.open();
      const fit = Math.min(packedRows.length - row, Math.floor((BANK_BYTES - current.used) / rowBytes));
      chunks.push({ bank: current.bank, addr: 0x8000 + current.used, rows: fit });
      for (let i = 0; i < fit; i++) { current.bytes.push(...packedRows[row + i]); }
      current.used += fit * rowBytes;
      row += fit;
    }
    this.dedupe.set(key, chunks);
    return chunks;
  }

  get list() { return this.banks; }
}

/** Nibble-pack pixel rows: left pixel in the high nibble (SCREEN 5). */
function packRows(pixels: Uint8Array, width: number, height: number): number[][] {
  const rows: number[][] = [];
  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x += 2) row.push(((pixels[y * width + x] & 15) << 4) | (pixels[y * width + x + 1] & 15));
    rows.push(row);
  }
  return rows;
}

/** 1 bpp rows for mono images: bit 7 = leftmost pixel, 1 = ink. Rows are padded to whole bytes. */
function packMonoRows(pixels: Uint8Array, width: number, height: number, ink: number): number[][] {
  const rows: number[][] = [];
  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x += 8) {
      let byte = 0;
      for (let k = 0; k < 8; k++) byte = (byte << 1) | (x + k < width && pixels[y * width + x + k] === ink ? 1 : 0);
      row.push(byte);
    }
    rows.push(row);
  }
  return rows;
}

function encodeText(font: IntroFont, fx: FontExport, zone: Msx2IntroTextZone, text: string): number[] {
  const layout = layoutZoneText(zone, text, font);
  const bytes: number[] = [];
  layout.lines.forEach((line, i) => {
    if (i > 0) bytes.push(NEWLINE);
    for (const ch of line) bytes.push(fx.indexOf(ch));
  });
  bytes.push(TEXT_END);
  return bytes;
}

/** Intro assets referenced by valid Intro nodes of the main SCREEN 5 flow, in node order. */
export function collectFlowIntroAssets(flow: Msx2GameFlowGraph | null | undefined, assets: ProjectAsset[]): Array<{ asset: ProjectAsset; data: Msx2IntroAsset }> {
  if (!flow) return [];
  const out: Array<{ asset: ProjectAsset; data: Msx2IntroAsset }> = [];
  for (const node of flow.nodes || []) {
    if ((node as any).type !== 'Intro') continue;
    const id = (node as Msx2GameFlowIntroNode).introAssetId;
    const asset = assets.find(a => a.id === id && a.type === 'msx2intro');
    const data = asset?.data as Msx2IntroAsset | undefined;
    if (!asset || !data?.slides?.length) continue;
    if (!out.some(item => item.asset.id === asset.id)) out.push({ asset, data });
  }
  return out;
}

export function buildBitmapIntro(
  analysis: ProjectAnalysis,
  flow: Msx2GameFlowGraph | null | undefined,
  options: { firstBank: number; music: boolean; megaRom: boolean; /** First free byte after the project's dedicated RAM chain. */ ramChainEnd?: number },
): BitmapIntroBuild {
  const assets = (((analysis as any).assets || []) as ProjectAsset[]);
  const intros = collectFlowIntroAssets(flow, assets);
  if (intros.length === 0) return EMPTY_BITMAP_INTRO_BUILD;
  if (!options.megaRom) {
    throw new Error('Intro nodes need a Konami MegaROM export (the interpreter and its images live in ROM banks); switch the export to MegaROM.');
  }
  if (options.ramChainEnd !== undefined && options.ramChainEnd > BITMAP_INTRO_RAM_BASE) {
    throw new Error(`Intro export: the project's dedicated RAM chain already reaches ${hex(options.ramChainEnd, 4)}, which collides with the Intro scratch RAM (${hex(BITMAP_INTRO_RAM_BASE, 4)}-${hex(BITMAP_INTRO_RAM_BASE + INTRO_RAM_BYTES - 1, 4)}). Reduce dynamic HUD widgets, pickups, enemies or platforms.`);
  }
  const warnings: string[] = [];
  let codeBank = options.firstBank;
  const padding: string[] = [];
  let expected = options.firstBank;
  while (isSccWindowBank(codeBank)) { codeBank++; }
  for (; expected < codeBank; expected++) padding.push(`; Bank ${expected} reserved: (bank & #3F) == #3F would expose the SCC in the P2 window.\n    ds #2000, #FF`);
  if (codeBank > MAX_BANK) throw new Error('No ROM bank left for the Intro interpreter.');

  const packer = new ImagePacker(codeBank + 1);
  const fonts: FontExport[] = [];
  const fontIndex = (font: IntroFont): number => {
    const key = font.custom ? String(font.id) : 'builtin';
    let idx = fonts.findIndex(f => f.key === key);
    if (idx < 0) { fonts.push(exportFont(assets, font, warnings)); idx = fonts.length - 1; }
    return idx;
  };

  const scripts: string[][] = [];
  let anyMono = false;
  intros.forEach(({ data }, introIdx) => {
    const lines: string[] = [`bitmap_intro_script_${introIdx}:`, `    DB ${oneByte(data.slides.length, `intro "${oneLine(data.name)}" has ${data.slides.length} slides, which`)}`];
    data.slides.forEach((slide: Msx2IntroSlide, slideIdx) => {
      lines.push(`; slide ${slideIdx + 1}: ${oneLine(slide.name)}`);
      const palette = ensureScreen5PaletteSlots(slide.palette).slots;
      const fadeFlags = (slide.transitionIn === 'fade' ? 1 : 0) | (slide.transitionOut === 'fade' ? 2 : 0);
      const bytes: number[] = [slide.backgroundColor & 15, fadeFlags, ...buildScreen5PaletteBytes(palette)];
      const images = slide.images
        .map(image => {
          const rendered = renderIntroImagePixels(slide, image, assets);
          if (!rendered) warnings.push(`Intro slide "${oneLine(slide.name)}": image "${oneLine(image.name)}" has no source presentation and is skipped.`);
          return rendered && { ...rendered, mono: image.mono };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item));
      bytes.push(oneByte(images.length, `slide "${oneLine(slide.name)}" has ${images.length} images, which`));
      for (const { dest, pixels, mono } of images) {
        // Record: x bytes (bit 7 = 1 bpp, x <= 127 so the bit is free), y, width bytes, height,
        // [1 bpp only: ink << 4 | paper], chunk count, chunks. Colour records keep the original format.
        if (mono) {
          anyMono = true;
          const ink = mono.ink & 15;
          const chunks = packer.place(packMonoRows(pixels, dest.w, dest.h, ink));
          bytes.push((dest.x >> 1) | 0x80, dest.y, dest.w >> 1, dest.h, (ink << 4) | (mono.paper & 15), oneByte(chunks.length, 'an image spans that many banks, which'));
          for (const chunk of chunks) bytes.push(chunk.bank, chunk.addr & 0xff, chunk.addr >> 8, chunk.rows);
          continue;
        }
        const chunks = packer.place(packRows(pixels, dest.w, dest.h));
        bytes.push(dest.x >> 1, dest.y, dest.w >> 1, dest.h, oneByte(chunks.length, 'an image spans that many banks, which'));
        for (const chunk of chunks) bytes.push(chunk.bank, chunk.addr & 0xff, chunk.addr >> 8, chunk.rows);
      }
      bytes.push(oneByte(slide.textZones.length, `slide "${oneLine(slide.name)}" has ${slide.textZones.length} text zones, which`));
      const zoneFonts = slide.textZones.map(zone => {
        const { font, missing } = resolveIntroFont(assets, zone.fontAssetId, data.fontAssetId);
        if (missing) warnings.push(`Intro slide "${slide.name}": font of zone "${zone.name}" is missing; built-in font used.`);
        return font;
      });
      slide.textZones.forEach((zone, zi) => {
        const font = zoneFonts[zi];
        const rect = normalizeScreenRect(zone.rect, font.cellW, font.cellH);
        if (rect.x !== zone.rect.x || rect.y !== zone.rect.y || rect.w !== zone.rect.w || rect.h !== zone.rect.h) {
          warnings.push(`Intro slide "${slide.name}": zone "${zone.name}" was adjusted to the screen (even x/w, inside 256x192).`);
        }
        bytes.push(
          rect.x >> 1, rect.y, rect.w >> 1, rect.h,
          font.cellW >> 1, fontIndex(font), zone.fg & 15, zone.bg & 15,   // cell width in bytes: 3 built-in, 4 custom 8x8, 2 custom 4x8
          Math.max(8, Math.min(16, byteOr(zone.lineSpacing, 10))), Math.max(1, Math.min(255, byteOr(zone.charDelayFrames, 3))),
          Math.max(1, Math.floor(rect.w / font.cellW)),
        );
      });
      bytes.push(oneByte(slide.steps.length, `slide "${oneLine(slide.name)}" has ${slide.steps.length} steps, which`));
      for (const step of slide.steps) {
        const zi = slide.textZones.findIndex(z => z.id === step.zoneId);
        if (zi < 0) throw new Error(`Intro export aborted: slide "${slide.name}" has a step that points at a deleted text zone. Delete the step or re-create the zone.`);
        const zone = { ...slide.textZones[zi], rect: normalizeScreenRect(slide.textZones[zi].rect, zoneFonts[zi].cellW, zoneFonts[zi].cellH) };
        const font = zoneFonts[zi];
        const fx = fonts[fontIndex(font)];
        bytes.push(zi, step.clearBefore ? 1 : 0, Math.max(0, Math.min(255, step.autoAdvanceFrames)));
        bytes.push(...encodeText(font, fx, zone, step.text));
      }
      lines.push(...dbLines(bytes));
    });
    scripts.push(lines);
  });
  const fontLines: string[] = ['bitmap_intro_fonts:'];
  fonts.forEach((_f, i) => fontLines.push(`    DW bitmap_intro_font_${i}`));
  fonts.forEach((f, i) => {
    fontLines.push(`bitmap_intro_font_${i}:  ; ${f.glyphs.length} glyphs x 8 rows, ${f.cellBytes * 2}px cell`);
    fontLines.push(...dbLines(f.glyphs.flat()));
  });

  const dataBytes = scripts.reduce((n, s) => n + s.reduce((m, line) => m + (line.startsWith('    DB ') ? line.split(',').length : 0), 0), 0)
    + fonts.reduce((n, f) => n + f.glyphs.length * 8, 0) + intros.length * 2 + fonts.length * 2;
  if (dataBytes > CODE_BANK_DATA_BUDGET) {
    throw new Error(`Intro export: the script text, palettes and fonts need about ${dataBytes} bytes but the interpreter bank has ${CODE_BANK_DATA_BUDGET} free. Shorten the texts, use fewer fonts/slides, or split the story into two Intro nodes.`);
  }
  const code = buildIntroCode({ music: options.music, codeBank, mono: anyMono });
  const dataLines = [
    'bitmap_intro_table:',
    ...intros.map((_i, idx) => `    DW bitmap_intro_script_${idx}`),
    ...scripts.flat(),
    ...fontLines,
  ];

  const banks = packer.list;
  const lastBank = banks.length ? banks[banks.length - 1].bank : codeBank;
  const out: string[] = ['; ==================================================================', '; INTRO BANKS (Intro GameFlow node)', '; =================================================================='];
  out.push(...padding);
  out.push(`BITMAP_INTRO_CODE_BANK_PHYS_START:`, '    org #8000', code, ...dataLines);
  out.push('BITMAP_INTRO_CODE_BANK_USED_END:', '    ds #A000 - $, #FF   ; fails loudly if the interpreter + script outgrow one 8KB bank', '    org BITMAP_INTRO_CODE_BANK_PHYS_START + #2000', '');
  let expectedImage = codeBank + 1;
  banks.forEach((bank, index) => {
    for (; expectedImage < bank.bank; expectedImage++) out.push(`; Bank ${expectedImage} reserved: (bank & #3F) == #3F would expose the SCC in the P2 window.`, '    ds #2000, #FF');
    expectedImage = bank.bank + 1;
    out.push(`; INTRO IMAGE BANK ${bank.bank} (${bank.used}/8192 bytes, row-aligned)`, `BITMAP_INTRO_IMAGE_BANK_${index}_PHYS_START:`, '    org #8000', ...dbLines(bank.bytes));
    out.push(`    ds #A000 - $, #FF`, `    org BITMAP_INTRO_IMAGE_BANK_${index}_PHYS_START + #2000`, '');
  });

  const R = (offset: number) => hex(BITMAP_INTRO_RAM_BASE + offset, 4);
  const equates = `; ---- Intro node: bank + RAM ----
BITMAP_INTRO_CODE_BANK EQU ${codeBank}
bitmap_intro_which     EQU ${R(0x00)}
bitmap_intro_ptr       EQU ${R(0x01)}   ; word: script read pointer
bitmap_intro_slides    EQU ${R(0x03)}
bitmap_intro_zones     EQU ${R(0x04)}   ; word: zone table of the slide
bitmap_intro_steps     EQU ${R(0x06)}
bitmap_intro_zone      EQU ${R(0x07)}   ; word: current zone record
bitmap_intro_txt       EQU ${R(0x09)}   ; word: text read pointer
bitmap_intro_col       EQU ${R(0x0B)}
bitmap_intro_line      EQU ${R(0x0C)}
bitmap_intro_key_prev  EQU ${R(0x0D)}
bitmap_intro_frame_ctr EQU ${R(0x0E)}
bitmap_intro_auto      EQU ${R(0x0F)}
bitmap_intro_fontptr   EQU ${R(0x10)}   ; word
bitmap_intro_pair      EQU ${R(0x12)}   ; 4 bytes: nibble pairs bg/fg
bitmap_intro_skip      EQU ${R(0x16)}
bitmap_intro_tmp       EQU ${R(0x17)}
bitmap_intro_nimg      EQU ${R(0x18)}
bitmap_intro_nchunks   EQU ${R(0x19)}
bitmap_intro_rows      EQU ${R(0x1A)}
bitmap_intro_wb        EQU ${R(0x1B)}
bitmap_intro_srcbank   EQU ${R(0x1C)}
bitmap_intro_srcaddr   EQU ${R(0x1D)}   ; word
bitmap_intro_vram      EQU ${R(0x1F)}   ; word
bitmap_intro_marker    EQU ${R(0x21)}   ; 1 while the "more" marker is drawn
bitmap_intro_marker_px EQU ${R(0x22)}   ; 9 bytes: pixels under the marker
bitmap_intro_marker_addr EQU ${R(0x2C)} ; word
bitmap_intro_fgpair    EQU ${R(0x2E)}
bitmap_intro_z         EQU ${R(0x30)}   ; 11 bytes: copy of the current zone record
bitmap_intro_flags     EQU ${R(0x3B)}   ; slide flags: bit0 fade in, bit1 fade out
bitmap_intro_level8    EQU ${R(0x3C)}   ; fade level * 8 (row of the fade table)
bitmap_intro_fadedir   EQU ${R(0x3D)}   ; 0 = fading out, 1 = fading in
bitmap_intro_pending   EQU ${R(0x3E)}   ; palette level to write at the next vblank, #FF = none
${anyMono ? `bitmap_intro_mono      EQU ${R(0x3F)}   ; source bytes per row of a 1 bpp image, 0 = 4 bpp image
` : ''}bitmap_intro_buf       EQU ${R(0x40)}   ; 32 bytes: one expanded glyph / scaled palette
bitmap_intro_fillbuf   EQU ${R(0x60)}   ; 128 bytes
bitmap_intro_pal       EQU ${R(0xE0)}   ; 32 bytes: the slide palette (16 x [R<<4|B, G])
`;

  const music = options.music;
  const resident = `
; ---- Intro node: resident part (the interpreter lives in bank ${codeBank}, mapped at #8000) ----
${routineHeader('bitmap_intro_run', 'Play an intro. Maps the intro code bank at #8000, runs the interpreter and puts the game back:\nresident banks, game palette and display.', {
    input: 'A = intro index (order of the Intro assets used by the GameFlow).',
    destroys: 'AF, BC, DE, HL.',
    calls: 'mapper_set_bank_p2, bitmap_intro_main (banked), bitmap_room_restore_resident_banks,\nload_screen5_bitmap_palette, vdp_write_register.',
    side: 'VRAM page 0, the VDP palette, R#1/R#2/R#8 and the P2/P3 banks change while it runs; on return P2 = 2,\nP3 = 3, the game palette is loaded and the display is on over a blank page.',
    notes: 'Everything the interpreter needs lives in the intro code bank and RAM #E600-#E6FF.',
  })}bitmap_intro_run:
    ld (bitmap_intro_which), a
    ld a, BITMAP_INTRO_CODE_BANK
    call mapper_set_bank_p2
    call bitmap_intro_main
    call bitmap_room_restore_resident_banks
    call load_screen5_bitmap_palette   ; the page is blank (bitmap_intro_finish): no slide colours can leak
    ld a, #01
    ld e, #62
    jp vdp_write_register              ; display on again

${routineHeader('bitmap_intro_copy_vram', 'Copy image rows from an intro image bank to VRAM for a caller that lives in P2.', {
    input: 'A = image bank, HL = source (inside that bank, #8000+), DE = VRAM address, BC = byte count (> 0).',
    destroys: 'AF, BC, DE, HL.',
    calls: 'mapper_set_bank_p2, copy_to_vram_ext.',
    side: 'P2 shows the image bank during the copy and the intro code bank again before RET.',
    notes: 'Resident on purpose: the caller sits in P2, so the bank swap must not happen in its own code.',
  })}bitmap_intro_copy_vram:
    call mapper_set_bank_p2
    call copy_to_vram_ext
    ld a, BITMAP_INTRO_CODE_BANK
    jp mapper_set_bank_p2
${anyMono ? `
${routineHeader('bitmap_intro_copy_ram', 'Copy bytes from an intro image bank to RAM for a caller that lives in P2 (1 bpp image rows).', {
    input: 'A = image bank, HL = source (inside that bank, #8000+), DE = RAM destination, BC = byte count (> 0).',
    destroys: 'AF, BC, DE, HL.',
    calls: 'mapper_set_bank_p2.',
    side: 'P2 shows the image bank during the copy and the intro code bank again before RET.',
    notes: 'Resident for the same reason as bitmap_intro_copy_vram. No music tick here: the rows are short.',
  })}bitmap_intro_copy_ram:
    call mapper_set_bank_p2
    ldir
    ld a, BITMAP_INTRO_CODE_BANK
    jp mapper_set_bank_p2
` : ''}${music ? `
${routineHeader('bitmap_intro_music', 'Run music_update for code that lives in P2.', {
    destroys: 'AF, BC, DE, HL (music_update).',
    calls: 'music_update, mapper_set_bank_p2.',
    side: 'Every music driver moves P2 (the SCC maps its chip window there; the PT3 replayer maps its module and\nthen forces P2 back to bank 2, ignoring mapper_bank_p2_current), so the intro bank is mapped again here,\nfrom resident ROM, before RET.',
  })}bitmap_intro_music:
    call music_update
    ld a, BITMAP_INTRO_CODE_BANK
    jp mapper_set_bank_p2

${routineHeader('bitmap_intro_tick_music', 'Tick the music once per elapsed vblank between VRAM blocks (same idea as commit_room_tick_music).', {
    destroys: 'AF, BC, DE, HL (when a tick runs).',
    calls: 'bitmap_intro_music.',
    side: 'R#15 = 0 (status register S#0). Reading S#0 clears its frame flag.',
    notes: 'Needed because a long VRAM copy spans several frames and the song must not stall.',
  })}bitmap_intro_tick_music:
    xor a
    out (#99), a
    ld a, #8F
    out (#99), a                    ; R#15 = 0 -> status port reads S#0
    in a, (#99)
    bit 7, a
    jp nz, bitmap_intro_music
    ret
` : ''}bitmap_intro_resident_end:
    if bitmap_intro_resident_end > #8000
    ds -1   ; the intro trampoline crosses #8000: it would unmap itself. Free resident space below #8000.
    endif
`;

  return {
    introIndexById: new Map(intros.map((item, idx) => [item.asset.id, idx])),
    equatesAsm: equates,
    residentAsm: resident,
    banksAsm: out.join('\n'),
    lastBank,
    banks: [
      { bank: codeBank, kind: 'code' },
      ...banks.map(bank => ({ bank: bank.bank, kind: 'image' as const, used: bank.used })),
    ],
    warnings,
  };
}

/** Contract header required by ai/ASM_GUIDELINES.md for every generated routine. */
function routineHeader(name: string, purpose: string, c: {
  input?: string; output?: string; destroys: string; preserves?: string; calls?: string; side?: string; notes?: string;
}): string {
  const block = (title: string, text?: string) => (text ? `; ${title}:\n${text.split('\n').map(l => `;   ${l}`).join('\n')}\n;\n` : '');
  return `
; ------------------------------------------------------------
; FUNCTION: ${name}
; ------------------------------------------------------------
; PURPOSE:
${purpose.split('\n').map(l => `;   ${l}`).join('\n')}
;
${block('INPUT', c.input ?? 'None.')}${block('OUTPUT', c.output ?? 'None.')}${block('DESTROYS', c.destroys)}${block('PRESERVES', c.preserves ?? 'IX, IY (and whatever DESTROYS does not list).')}${block('CALLS', c.calls ?? 'None.')}${block('SIDE EFFECTS', c.side ?? 'None.')}${block('NOTES', c.notes ?? 'None.')}; ------------------------------------------------------------
`;
}

/**
 * 1 bpp image support, emitted only when some Intro image is "mono" (colour-only intros stay
 * byte-identical). A row is fetched from its bank into bitmap_intro_buf (resident copy, the code
 * runs in P2), expanded through the 4-entry nibble-pair table into bitmap_intro_fillbuf, and
 * written to VRAM with bitmap_intro_vwrite.
 */
function monoImageCode(pairBase: number): string {
  const fillbufLow = (BITMAP_INTRO_RAM_BASE + 0x60) & 0xff;
  if (fillbufLow & 3) throw new Error('Intro generator: bitmap_intro_fillbuf must be 4-byte aligned for the 1 bpp expander.');
  const H = routineHeader;
  return `${H('bitmap_intro_mono_setup', 'Prepare a 1 bpp image: read its ink/paper byte, build the nibble-pair table and the row size.', {
    input: 'bitmap_intro_ptr at the colour byte (ink << 4 | paper); bitmap_intro_wb = width in 4 bpp bytes.',
    destroys: 'AF, BC, DE, HL.',
    calls: 'bitmap_intro_read_byte.',
    side: 'bitmap_intro_pair[0..3] = paper/paper, paper/ink, ink/paper, ink/ink (index = left << 1 | right, 1 = ink);\nbitmap_intro_mono = source bytes per row = ceil(wb / 4) (never 0).',
    notes: 'The text steps rebuild bitmap_intro_pair with the zone colours, so reusing it here is safe.',
  })}bitmap_intro_mono_setup:
    call bitmap_intro_read_byte    ; ink << 4 | paper
    ld (bitmap_intro_pair + 2), a  ; ink,paper
    ld c, a
    and #0F
    ld b, a                        ; B = paper
    rlca
    rlca
    rlca
    rlca
    or b
    ld (bitmap_intro_pair), a      ; paper,paper
    ld a, c
    and #F0
    ld d, a                        ; D = ink << 4
    rrca
    rrca
    rrca
    rrca
    ld e, a                        ; E = ink
    or d
    ld (bitmap_intro_pair + 3), a  ; ink,ink
    ld a, b
    rlca
    rlca
    rlca
    rlca
    or e
    ld (bitmap_intro_pair + 1), a  ; paper,ink
    ld a, (bitmap_intro_wb)        ; <= 128
    add a, 3
    rrca
    rrca
    and #3F
    ld (bitmap_intro_mono), a      ; ceil(wb / 4) = 1 bpp bytes per row (<= 32)
    ret

${H('bitmap_intro_mono_row', 'Draw one row of a 1 bpp image and continue the image row loop.', {
    input: 'A = source bytes per row (bitmap_intro_mono); bitmap_intro_srcbank/srcaddr/vram/wb set, pair table built.',
    destroys: 'AF, BC, DE, HL.',
    calls: 'bitmap_intro_copy_ram (resident), bitmap_intro_vwrite.',
    side: 'Uses bitmap_intro_buf (source row, <= 32 bytes) and bitmap_intro_fillbuf (expanded row, <= 128 bytes).',
    notes: 'Jumped to (not called) from bitmap_intro_row_loop; exits by JP bitmap_intro_row_next with A = source bytes.\nfillbuf is 4-byte aligned, so E & 3 == 0 marks every 4th output byte = a new source byte.',
  })}bitmap_intro_mono_row:
    ld c, a
    ld b, 0
    ld hl, (bitmap_intro_srcaddr)
    ld de, bitmap_intro_buf
    ld a, (bitmap_intro_srcbank)
    call bitmap_intro_copy_ram
    ld hl, bitmap_intro_buf
    ld de, bitmap_intro_fillbuf
    ld a, (bitmap_intro_wb)
    ld b, a                        ; B = output bytes (2 pixels each)
bitmap_intro_mono_pair:
    ld a, e
    and #03
    jp nz, bitmap_intro_mono_have
    ld c, (hl)                     ; next 8 source pixels
    inc hl
bitmap_intro_mono_have:
    push hl
    xor a
    rlc c
    rla
    rlc c
    rla                            ; A = (left << 1) | right
    add a, ${hex(pairBase & 0xff)}
    ld l, a
    ld h, ${hex(pairBase >> 8)}
    ld a, (hl)
    ld (de), a
    inc de
    pop hl
    dec b
    jp nz, bitmap_intro_mono_pair
    ld de, (bitmap_intro_vram)
    ld hl, bitmap_intro_fillbuf
    ld a, (bitmap_intro_wb)
    ld b, a
    call bitmap_intro_vwrite
    ld a, (bitmap_intro_mono)
    jp bitmap_intro_row_next

`;
}

/** 8x8 table of round(component * level / 7): the palette fade scales R, G and B (0..7). */
function fadeTableBytes(): number[] {
  const out: number[] = [];
  for (let level = 0; level < 8; level++) for (let c = 0; c < 8; c++) out.push(Math.round((c * level) / 7));
  return out;
}

/**
 * The interpreter, assembled at #8000 inside the intro code bank.
 * Runs in P2: it may only CALL resident routines (below #8000), and any of them that move P2
 * must put the intro bank back before RET (see bitmap_intro_copy_vram / bitmap_intro_music).
 */
function buildIntroCode(o: { music: boolean; codeBank: number; mono: boolean }): string {
  const tick = o.music ? '    call bitmap_intro_tick_music\n' : '';
  const frameMusic = o.music ? '    call bitmap_intro_music\n' : '';
  const row = INTRO_CHAR_H;
  const H = routineHeader;
  const pairBase = BITMAP_INTRO_RAM_BASE + 0x12;
  return `
${H('bitmap_intro_main', 'Play the intro number held in bitmap_intro_which: every slide, in order.\nRuns from the intro code bank mapped at #8000 (called by the resident bitmap_intro_run).', {
    input: 'bitmap_intro_which = intro index.',
    destroys: 'AF, BC, DE, HL, IX/IY untouched.',
    calls: 'vdp_write_register, bitmap_intro_read_byte, bitmap_intro_read_key, bitmap_intro_slide, bitmap_intro_finish.',
    side: 'Forces page 0 as the displayed page (bitmap_displayed_page/_pending_display_page = 0, R#2 = #1F),\nturns the sprites off (R#8 = #0A) and leaves R#15 = 0. VRAM page 0 is overwritten.',
    notes: 'The caller restores the resident banks and the game palette afterwards.',
  })}bitmap_intro_main:
    xor a
    ld (bitmap_displayed_page), a
    ld (bitmap_pending_display_page), a
    ld a, #02
    ld e, #1F
    call vdp_write_register        ; name table = page 0
    ld a, #0F
    ld e, #00
    call vdp_write_register        ; status register S#0
    ld a, #08
    ld e, #0A
    call vdp_write_register        ; sprites off (the room sprites would sit on top)
    ld a, (bitmap_intro_which)
    add a, a
    ld e, a
    ld d, 0
    ld hl, bitmap_intro_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld (bitmap_intro_ptr), hl
    call bitmap_intro_read_byte
    ld (bitmap_intro_slides), a
    call bitmap_intro_read_key      ; a key held from the previous node is not a press
    ld (bitmap_intro_key_prev), a
    xor a
    ld (bitmap_intro_marker), a
    dec a                          ; #FF
    ld (bitmap_intro_pending), a
bitmap_intro_slide_loop:
    ld a, (bitmap_intro_slides)
    or a
    jp z, bitmap_intro_finish
    dec a
    ld (bitmap_intro_slides), a
    call bitmap_intro_slide
    jp bitmap_intro_slide_loop

${H('bitmap_intro_finish', 'Leave the screen blank so the game palette never shows the last slide, then re-enable the sprites.', {
    destroys: 'AF, BC, DE, HL.',
    calls: 'vdp_write_register, bitmap_intro_fill_screen.',
    side: 'Display off, page 0 filled with slot 0, R#8 = #08 (sprites on), R#14 = 0.\nThe resident caller restores the game palette and switches the display on.',
  })}bitmap_intro_finish:
    ld a, #01
    ld e, #22
    call vdp_write_register        ; display off
    xor a
    call bitmap_intro_fill_screen
    ld a, #08
    ld e, #08
    call vdp_write_register        ; sprites on
    ld a, #0E
    ld e, #00
    jp vdp_write_register          ; R#14 back to 0

${H('bitmap_intro_read_byte', 'Read the next byte of the script and advance the script pointer.', {
    output: 'A = byte.',
    destroys: 'AF, HL.',
    preserves: 'BC, DE, IX, IY.',
    side: 'bitmap_intro_ptr += 1.',
  })}bitmap_intro_read_byte:
    ld hl, (bitmap_intro_ptr)
    ld a, (hl)
    inc hl
    ld (bitmap_intro_ptr), hl
    ret

${H('bitmap_intro_read_key', 'Sample the advance controls: SPACE (PPI row 8 bit 0) or the fire button A of either joystick port.', {
    output: 'A = 1 while any of them is down, 0 otherwise.',
    destroys: 'AF, B.',
    preserves: 'C, DE, HL, IX, IY.',
    side: 'Selects PPI row 8; writes PSG register 15 (joystick port select) and leaves register 14 latched.\nNo BIOS call.',
    notes: 'Joystick lines are active low and pulled up, so an unplugged port reads as "released".',
  })}bitmap_intro_read_key:
    in a, (PPI_C)
    and #F0
    or 8
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and #01
    ld b, a                        ; B = SPACE
    ld a, 15
    out (#A0), a
    in a, (#A2)
    and #BF
    out (#A1), a                   ; joystick port 1
    ld a, 14
    out (#A0), a
    in a, (#A2)
bitmap_intro_key_joy1:
    and #10                        ; trigger A, 0 = pressed
    jp nz, bitmap_intro_key_port2
    ld b, 1
bitmap_intro_key_port2:
    ld a, 15
    out (#A0), a
    in a, (#A2)
    or #40
    out (#A1), a                   ; joystick port 2
    ld a, 14
    out (#A0), a
    in a, (#A2)
bitmap_intro_key_joy2:
    and #10
    jp nz, bitmap_intro_key_done
    ld b, 1
bitmap_intro_key_done:
    ld a, b
    ret

${H('bitmap_intro_frame', 'Advance one frame: wait for the vblank, tick the music and read the controls.', {
    input: 'bitmap_intro_pending = a palette level (0..7) to write right after the vblank, or #FF for none.',
    output: 'A = 1 on a FRESH press (up edge -> down), 0 otherwise. bitmap_intro_key_prev is updated.',
    destroys: 'AF, BC, DE, HL.',
    calls: 'bitmap_wait_vblank, bitmap_intro_set_level, bitmap_intro_music (if music), bitmap_intro_read_key.',
    notes: 'The music driver may take more than a frame\'s share of CPU; callers keep their state in RAM.',
  })}bitmap_intro_frame:
    call bitmap_wait_vblank
    ld a, (bitmap_intro_pending)
    cp #FF
    jp z, bitmap_intro_frame_nopal
    call bitmap_intro_set_level    ; a fade step's palette lands at the very start of the vblank
    ld a, #FF
    ld (bitmap_intro_pending), a
bitmap_intro_frame_nopal:
${frameMusic}    call bitmap_intro_read_key
    ld b, a
    ld a, (bitmap_intro_key_prev)
    ld c, a
    ld a, b
    ld (bitmap_intro_key_prev), a
    ld a, c
    or a
    jp nz, bitmap_intro_frame_none
    ld a, b
    ret
bitmap_intro_frame_none:
    xor a
    ret

${H('bitmap_intro_vwrite', 'Write a block to VRAM (page 0..3 addresses, R#14 derived from the address).', {
    input: 'DE = VRAM address, HL = source, B = byte count (1..255).',
    output: 'HL = source + count.',
    destroys: 'AF, BC, HL.',
    preserves: 'DE, IX, IY.',
    side: 'R#14 = address bits 14..16 (left set, callers set it again for every block).',
  })}bitmap_intro_vwrite:
    ld a, d
    rlca
    rlca
    and #03
    out (#99), a
    ld a, #8E
    out (#99), a
    ld a, e
    out (#99), a
    ld a, d
    and #3F
    or #40
    out (#99), a
    ld c, #98
    otir
    ret

${H('bitmap_intro_vread', 'Read a block back from VRAM (used to save the pixels under the "more" marker).', {
    input: 'DE = VRAM address, HL = destination, B = byte count (1..255).',
    output: 'HL = destination + count.',
    destroys: 'AF, BC, HL.',
    preserves: 'DE, IX, IY.',
    side: 'R#14 = address bits 14..16.',
    notes: 'The V9938 needs a short pause between setting a read address and the first read: two\n"ex (sp),hl" (38 T-states) give it, HL survives the double swap.',
  })}bitmap_intro_vread:
    ld a, d
    rlca
    rlca
    and #03
    out (#99), a
    ld a, #8E
    out (#99), a
    ld a, e
    out (#99), a
    ld a, d
    and #3F
    out (#99), a
    ex (sp), hl
    ex (sp), hl
    ld c, #98
    inir
    ret

${H('bitmap_intro_dup_nibble', 'Build a byte with the same palette slot in both nibbles (a solid run of that colour).', {
    input: 'A = slot (0..15; the high bits are ignored).',
    output: 'A = (slot << 4) | slot.',
    destroys: 'AF, C.',
    preserves: 'B, DE, HL, IX, IY.',
  })}bitmap_intro_dup_nibble:
    and #0F
    ld c, a
    rlca
    rlca
    rlca
    rlca
    or c
    ret

${H('bitmap_intro_fill_screen', 'Fill the 212 displayed lines of page 0 with one colour pair.', {
    input: 'A = fill byte (both nibbles = palette slot).',
    destroys: 'AF, BC, DE, HL.',
    calls: 'bitmap_intro_vwrite, bitmap_intro_tick_music (if music).',
    side: 'Uses bitmap_intro_fillbuf, bitmap_intro_vram and bitmap_intro_rows. Ticks the music every 8 lines\nso a long fill does not stall the song.',
  })}bitmap_intro_fill_screen:
    ld hl, bitmap_intro_fillbuf
    ld (hl), a
    ld de, bitmap_intro_fillbuf + 1
    ld bc, 127
    ldir
    ld hl, 0
    ld (bitmap_intro_vram), hl
    ld a, ${SCREEN_LINES}
    ld (bitmap_intro_rows), a
bitmap_intro_fill_loop:
    ld de, (bitmap_intro_vram)
    ld hl, bitmap_intro_fillbuf
    ld b, 128
    call bitmap_intro_vwrite
    ld hl, (bitmap_intro_vram)
    ld de, 128
    add hl, de
    ld (bitmap_intro_vram), hl
    ld a, (bitmap_intro_rows)
    dec a
    ld (bitmap_intro_rows), a
    ret z
    and #07
    jp nz, bitmap_intro_fill_loop
${tick}    jp bitmap_intro_fill_loop

${H('bitmap_intro_fade_comp', 'Scale one 3-bit colour component by the current fade level.', {
    input: 'A = component (0..7); bitmap_intro_level8 = level * 8.',
    output: 'A = round(component * level / 7).',
    destroys: 'AF.',
    preserves: 'BC, DE, HL, IX, IY.',
  })}bitmap_intro_fade_comp:
    push hl
    push de
    ld e, a
    ld a, (bitmap_intro_level8)
    add a, e
    ld e, a
    ld d, 0
    ld hl, bitmap_intro_fade_table
    add hl, de
    ld a, (hl)
    pop de
    pop hl
    ret

${H('bitmap_intro_set_level', 'Write the slide palette to the VDP scaled to a brightness level (7 = as authored, 0 = black).', {
    input: 'A = level 0..7; bitmap_intro_pal = the slide palette (16 x [R<<4|B, G]).',
    destroys: 'AF, BC, DE, HL.',
    calls: 'bitmap_intro_fade_comp, vdp_write_register.',
    side: 'Builds the scaled palette in bitmap_intro_buf; R#16 = 0 then 32 bytes to port #9A.',
  })}bitmap_intro_set_level:
    add a, a
    add a, a
    add a, a
    ld (bitmap_intro_level8), a
    ld hl, bitmap_intro_pal
    ld de, bitmap_intro_buf
    ld b, 16
bitmap_intro_level_entry:
    ld a, (hl)
    inc hl
    ld c, a                        ; C = (R << 4) | B
    and #07
    call bitmap_intro_fade_comp
    ld (de), a                     ; B'
    ld a, c
    rrca
    rrca
    rrca
    rrca
    and #07
    call bitmap_intro_fade_comp    ; R'
    rlca
    rlca
    rlca
    rlca
    ld c, a
    ld a, (de)
    or c
    ld (de), a
    inc de
    ld a, (hl)
    inc hl
    and #07
    call bitmap_intro_fade_comp    ; G'
    ld (de), a
    inc de
    dec b
    jp nz, bitmap_intro_level_entry
    ld a, #10
    ld e, #00
    call vdp_write_register        ; R#16 = 0
    ld hl, bitmap_intro_buf
    ld b, 32
    ld c, #9A
    otir
    ret

${H('bitmap_intro_fade', 'Fade the slide palette out to black or in from black in seven steps of two frames.', {
    input: 'A = 0 fade out (levels 6..0), 1 fade in (levels 1..7). Fade in starts from an already black palette.',
    destroys: 'AF, BC, DE, HL.',
    calls: 'bitmap_intro_set_level, bitmap_intro_frame.',
    side: 'Presses during the fade are ignored (the key state is still tracked).',
  })}bitmap_intro_fade:
    ld (bitmap_intro_fadedir), a
    ld b, 7
bitmap_intro_fade_step:
    push bc
    ld a, (bitmap_intro_fadedir)
    or a
    ld a, b
    jp z, bitmap_intro_fade_out_level
    ld c, a
    ld a, 8
    sub c                          ; level = 8 - b (1..7)
    jp bitmap_intro_fade_go
bitmap_intro_fade_out_level:
    dec a                          ; level = b - 1 (6..0)
bitmap_intro_fade_go:
    ld (bitmap_intro_pending), a   ; written by the next frame, right after its vblank starts
    call bitmap_intro_frame
    call bitmap_intro_frame
    pop bc
    dec b
    jp nz, bitmap_intro_fade_step
    ret

${H('bitmap_intro_slide', 'Draw one slide (palette, background, images, zone table) and run its typewriter steps.', {
    destroys: 'AF, BC, DE, HL.',
    calls: 'vdp_write_register, bitmap_intro_read_byte, bitmap_intro_set_level, bitmap_intro_fill_screen,\nbitmap_intro_copy_vram (resident), bitmap_intro_tick_music (if music), bitmap_intro_fade,\nbitmap_intro_step.',
    side: 'Display is off while the slide is drawn and on before the first step. Script format per slide:\nbg, flags (bit0 fade in, bit1 fade out), 32 palette bytes, images, zones, steps.',
  })}bitmap_intro_slide:
    ld a, #01
    ld e, #22
    call vdp_write_register        ; display off while the slide is drawn
    call bitmap_intro_read_byte
    ld (bitmap_intro_tmp), a       ; background slot
    call bitmap_intro_read_byte
    ld (bitmap_intro_flags), a
    ld hl, (bitmap_intro_ptr)
    ld de, bitmap_intro_pal
    ld bc, 32
    ldir                           ; palette -> RAM (the fades scale it)
    ld (bitmap_intro_ptr), hl
    ld a, 7
    call bitmap_intro_set_level    ; authored palette while nothing is visible
    ld a, (bitmap_intro_tmp)
    call bitmap_intro_dup_nibble
    call bitmap_intro_fill_screen
    ; images
    call bitmap_intro_read_byte
    ld (bitmap_intro_nimg), a
bitmap_intro_image_loop:
    ld a, (bitmap_intro_nimg)
    or a
    jp z, bitmap_intro_images_done
    dec a
    ld (bitmap_intro_nimg), a
    call bitmap_intro_read_byte    ; x in bytes${o.mono ? ' (bit 7 = 1 bpp image)' : ''}
${o.mono ? `    ld e, a
    and #7F
    ld (bitmap_intro_tmp), a
    xor e
    ld (bitmap_intro_mono), a      ; #80 = 1 bpp, 0 = 4 bpp (the byte count comes below)
    ld a, (bitmap_intro_tmp)
` : ''}    ld e, a
    call bitmap_intro_read_byte    ; y
    ld l, 0
    ld h, a
    srl h
    rr l                           ; HL = y * 128
    ld d, 0
    add hl, de
    ld (bitmap_intro_vram), hl
    call bitmap_intro_read_byte    ; width in bytes
    ld (bitmap_intro_wb), a
    call bitmap_intro_read_byte    ; height (rows are counted per chunk)
${o.mono ? `    ld a, (bitmap_intro_mono)
    or a
    call nz, bitmap_intro_mono_setup
` : ''}    call bitmap_intro_read_byte    ; chunk count
    ld (bitmap_intro_nchunks), a
bitmap_intro_chunk_loop:
    ld a, (bitmap_intro_nchunks)
    or a
    jp z, bitmap_intro_image_loop
    dec a
    ld (bitmap_intro_nchunks), a
    call bitmap_intro_read_byte
    ld (bitmap_intro_srcbank), a
    call bitmap_intro_read_byte
    ld e, a
    call bitmap_intro_read_byte
    ld d, a
    ld (bitmap_intro_srcaddr), de
    call bitmap_intro_read_byte
    ld (bitmap_intro_rows), a
bitmap_intro_row_loop:
${o.mono ? `    ld a, (bitmap_intro_mono)
    or a
    jp nz, bitmap_intro_mono_row
` : ''}    ld hl, (bitmap_intro_srcaddr)
    ld de, (bitmap_intro_vram)
    ld a, (bitmap_intro_wb)
    ld c, a
    ld b, 0
    ld a, (bitmap_intro_srcbank)
    call bitmap_intro_copy_vram
    ld a, (bitmap_intro_wb)
${o.mono ? `bitmap_intro_row_next:            ; A = source bytes of the row just drawn
` : ''}    ld e, a
    ld d, 0
    ld hl, (bitmap_intro_srcaddr)
    add hl, de
    ld (bitmap_intro_srcaddr), hl
    ld hl, (bitmap_intro_vram)
    ld de, 128
    add hl, de
    ld (bitmap_intro_vram), hl
${tick}    ld a, (bitmap_intro_rows)
    dec a
    ld (bitmap_intro_rows), a
    jp nz, bitmap_intro_row_loop
    jp bitmap_intro_chunk_loop
bitmap_intro_images_done:
    ; zone table
    call bitmap_intro_read_byte
    ld (bitmap_intro_tmp), a
    ld hl, (bitmap_intro_ptr)
    ld (bitmap_intro_zones), hl
    ld a, (bitmap_intro_tmp)
    ld e, a
    ld d, 0
    ld l, e
    ld h, d
    add hl, hl
    add hl, hl
    add hl, hl                     ; x8
    add hl, de
    add hl, de
    add hl, de                     ; x11
    ld de, (bitmap_intro_ptr)
    add hl, de
    ld (bitmap_intro_ptr), hl
    ld a, (bitmap_intro_flags)
    and #01
    jp z, bitmap_intro_show_now
    xor a
    call bitmap_intro_set_level    ; fade in: show the slide black first
    ld a, #01
    ld e, #62
    call vdp_write_register        ; display on
    ld a, 1
    call bitmap_intro_fade
    jp bitmap_intro_shown
bitmap_intro_show_now:
    ld a, #01
    ld e, #62
    call vdp_write_register        ; display on
bitmap_intro_shown:
    call bitmap_intro_read_byte
    ld (bitmap_intro_steps), a
bitmap_intro_step_loop:
    ld a, (bitmap_intro_steps)
    or a
    jp z, bitmap_intro_slide_end
    dec a
    ld (bitmap_intro_steps), a
    call bitmap_intro_step
    jp bitmap_intro_step_loop
bitmap_intro_slide_end:
    ld a, (bitmap_intro_flags)
    and #02
    ret z
    xor a
    jp bitmap_intro_fade           ; fade out (tail call)

${o.mono ? monoImageCode(pairBase) : ''}${H('bitmap_intro_step', 'Type one text into one zone, then wait for a press (or the auto-advance time).', {
    destroys: 'AF, BC, DE, HL.',
    calls: 'bitmap_intro_read_byte, bitmap_intro_clear_zone, bitmap_intro_draw_glyph, bitmap_intro_frame,\nbitmap_intro_marker_set.',
    side: 'Copies the zone record to bitmap_intro_z and builds the four nibble pairs of the zone colours.\nA press while typing only completes the text; the next press (a new edge) advances.\nA text with no characters goes straight to the wait without spending a press.',
  })}bitmap_intro_step:
    call bitmap_intro_read_byte    ; zone index
    ld e, a
    ld d, 0
    ld l, e
    ld h, d
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, de
    add hl, de
    add hl, de                     ; x11
    ld de, (bitmap_intro_zones)
    add hl, de
    ld de, bitmap_intro_z
    ld bc, ${ZONE_RECORD_BYTES}
    ldir
    call bitmap_intro_read_byte    ; flags
    ld (bitmap_intro_tmp), a
    call bitmap_intro_read_byte    ; auto-advance frames
    ld (bitmap_intro_auto), a
    ld hl, (bitmap_intro_ptr)
    ld (bitmap_intro_txt), hl
    ; nibble pairs, index = (left pixel << 1) | right pixel (0 = background, 1 = text)
    ld a, (bitmap_intro_z + 6)
    and #0F
    ld b, a                        ; B = text slot
    ld a, (bitmap_intro_z + 7)
    and #0F
    ld c, a                        ; C = background slot
    ld a, c
    rlca
    rlca
    rlca
    rlca
    or c
    ld (bitmap_intro_pair), a      ; bg,bg
    ld a, c
    rlca
    rlca
    rlca
    rlca
    or b
    ld (bitmap_intro_pair + 1), a  ; bg,fg
    ld a, b
    rlca
    rlca
    rlca
    rlca
    or c
    ld (bitmap_intro_pair + 2), a  ; fg,bg
    ld a, b
    rlca
    rlca
    rlca
    rlca
    or b
    ld (bitmap_intro_pair + 3), a  ; fg,fg
    ld (bitmap_intro_fgpair), a
    ; font table pointer
    ld a, (bitmap_intro_z + 5)
    add a, a
    ld e, a
    ld d, 0
    ld hl, bitmap_intro_fonts
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld (bitmap_intro_fontptr), hl
    ; clear the zone box
    ld a, (bitmap_intro_tmp)
    and #01
    jp z, bitmap_intro_no_clear
    call bitmap_intro_clear_zone
bitmap_intro_no_clear:
    xor a
    ld (bitmap_intro_col), a
    ld (bitmap_intro_line), a
    ld (bitmap_intro_skip), a
bitmap_intro_type_loop:
    ld hl, (bitmap_intro_txt)
    ld a, (hl)
    inc hl
    ld (bitmap_intro_txt), hl
    cp ${TEXT_END}
    jp z, bitmap_intro_typed
    cp ${NEWLINE}
    jp z, bitmap_intro_newline
    call bitmap_intro_draw_glyph
    ld a, (bitmap_intro_col)
    inc a
    ld (bitmap_intro_col), a
    ld a, (bitmap_intro_skip)
    or a
    jp nz, bitmap_intro_type_skipped
    ld a, (bitmap_intro_z + 9)     ; frames between characters
    ld b, a
bitmap_intro_delay_loop:
    push bc
    call bitmap_intro_frame
    pop bc
    or a
    jp nz, bitmap_intro_skip_typing
    dec b
    jp nz, bitmap_intro_delay_loop
    jp bitmap_intro_type_loop
bitmap_intro_skip_typing:
    ld a, 1
    ld (bitmap_intro_skip), a      ; this press only completes the text
bitmap_intro_type_skipped:
${tick}    jp bitmap_intro_type_loop
bitmap_intro_newline:
    xor a
    ld (bitmap_intro_col), a
    ld a, (bitmap_intro_line)
    inc a
    ld (bitmap_intro_line), a
    jp bitmap_intro_type_loop
bitmap_intro_typed:
    ld hl, (bitmap_intro_txt)
    ld (bitmap_intro_ptr), hl      ; the next record starts after the terminator
    xor a
    ld (bitmap_intro_frame_ctr), a
    ld (bitmap_intro_marker), a
    ld (bitmap_intro_skip), a      ; reused as the auto-advance counter
    ld a, 1
    call bitmap_intro_marker_set
bitmap_intro_wait_loop:
    call bitmap_intro_frame
    or a
    jp nz, bitmap_intro_wait_done
    ld a, (bitmap_intro_auto)
    or a
    jp z, bitmap_intro_wait_marker
    ld b, a
    ld a, (bitmap_intro_skip)
    inc a
    ld (bitmap_intro_skip), a
    cp b
    jp nc, bitmap_intro_wait_done
bitmap_intro_wait_marker:
    ld a, (bitmap_intro_frame_ctr)
    inc a
    ld (bitmap_intro_frame_ctr), a
    and #0F
    jp nz, bitmap_intro_wait_loop  ; toggle every 16 frames
    ld a, (bitmap_intro_marker)
    xor 1
    call bitmap_intro_marker_set
    jp bitmap_intro_wait_loop
bitmap_intro_wait_done:
    xor a
    jp bitmap_intro_marker_set     ; hide it (restores the pixels) and return

${H('bitmap_intro_clear_zone', 'Fill the current zone rectangle with its background colour.', {
    input: 'bitmap_intro_z = zone record, bitmap_intro_pair[0] = background pair.',
    destroys: 'AF, BC, DE, HL.',
    calls: 'bitmap_intro_vwrite.',
    side: 'Uses bitmap_intro_fillbuf (zone width <= 128 bytes), bitmap_intro_vram, bitmap_intro_rows.',
  })}bitmap_intro_clear_zone:
    ld a, (bitmap_intro_pair)
    ld hl, bitmap_intro_fillbuf
    ld (hl), a
    ld de, bitmap_intro_fillbuf + 1
    ld a, (bitmap_intro_z + 2)
    dec a
    jp z, bitmap_intro_clear_one
    ld c, a
    ld b, 0
    ldir
bitmap_intro_clear_one:
    ld a, (bitmap_intro_z + 1)     ; y
    ld l, 0
    ld h, a
    srl h
    rr l
    ld a, (bitmap_intro_z)         ; x in bytes
    ld e, a
    ld d, 0
    add hl, de
    ld (bitmap_intro_vram), hl
    ld a, (bitmap_intro_z + 3)     ; height
    ld (bitmap_intro_rows), a
bitmap_intro_clear_loop:
    ld de, (bitmap_intro_vram)
    ld hl, bitmap_intro_fillbuf
    ld a, (bitmap_intro_z + 2)
    ld b, a
    call bitmap_intro_vwrite
    ld hl, (bitmap_intro_vram)
    ld de, 128
    add hl, de
    ld (bitmap_intro_vram), hl
    ld a, (bitmap_intro_rows)
    dec a
    ld (bitmap_intro_rows), a
    jp nz, bitmap_intro_clear_loop
    ret

${H('bitmap_intro_draw_glyph', 'Draw one glyph of the zone font at (bitmap_intro_col, bitmap_intro_line).', {
    input: 'A = glyph index in the zone font; bitmap_intro_z, bitmap_intro_fontptr, bitmap_intro_pair set.',
    destroys: 'AF, BC, DE, HL.',
    calls: 'bitmap_intro_vwrite.',
    side: 'Expands the 8 rows (1 bit per pixel) to nibbles in bitmap_intro_buf, then writes them to page 0.\nPosition: x = zone x + col * cell bytes, y = zone y + line * spacing.',
  })}bitmap_intro_draw_glyph:
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    ld de, (bitmap_intro_fontptr)
    add hl, de
    ld de, bitmap_intro_buf
    ld b, ${row}
bitmap_intro_glyph_row:
    push bc
    ld a, (hl)
    inc hl
    push hl
    ld c, a
    ld a, (bitmap_intro_z + 4)     ; cell width in bytes
    ld b, a
bitmap_intro_glyph_pair:
    xor a
    rlc c
    rla
    rlc c
    rla                            ; A = (left << 1) | right
    add a, ${hex(pairBase & 0xff)}
    ld l, a
    ld h, ${hex(pairBase >> 8)}
    ld a, (hl)
    ld (de), a
    inc de
    dec b
    jp nz, bitmap_intro_glyph_pair
    pop hl
    pop bc
    dec b
    jp nz, bitmap_intro_glyph_row
    ; y = zone y + line * spacing
    ld a, (bitmap_intro_z + 1)
    ld c, a
    ld a, (bitmap_intro_line)
    or a
    jp z, bitmap_intro_glyph_y_done
    ld b, a
    ld a, (bitmap_intro_z + 8)
    ld d, a
    ld a, c
bitmap_intro_glyph_y_mul:
    add a, d
    dec b
    jp nz, bitmap_intro_glyph_y_mul
    ld c, a
bitmap_intro_glyph_y_done:
    ld l, 0
    ld h, c
    srl h
    rr l                           ; HL = y * 128
    ; x (bytes) = zone x + col * cell
    ld a, (bitmap_intro_z)
    ld c, a
    ld a, (bitmap_intro_col)
    or a
    jp z, bitmap_intro_glyph_x_done
    ld b, a
    ld a, (bitmap_intro_z + 4)
    ld d, a
    ld a, c
bitmap_intro_glyph_x_mul:
    add a, d
    dec b
    jp nz, bitmap_intro_glyph_x_mul
    ld c, a
bitmap_intro_glyph_x_done:
    ld e, c
    ld d, 0
    add hl, de
    ex de, hl                      ; DE = VRAM address of the first glyph row
    ld hl, bitmap_intro_buf
    ld a, ${row}
    ld (bitmap_intro_rows), a
bitmap_intro_glyph_blit:
    ld a, (bitmap_intro_z + 4)
    ld b, a
    call bitmap_intro_vwrite       ; HL advances through the expanded rows
    ld a, e
    add a, 128
    ld e, a
    ld a, d
    adc a, 0
    ld d, a
    ld a, (bitmap_intro_rows)
    dec a
    ld (bitmap_intro_rows), a
    jp nz, bitmap_intro_glyph_blit
    ret

${H('bitmap_intro_marker_set', 'Show or hide the blinking "more" triangle at the bottom-right corner of the zone.', {
    input: 'A = 1 show, 0 hide; bitmap_intro_z = zone record.',
    destroys: 'AF, BC, DE, HL.',
    calls: 'bitmap_intro_vread, bitmap_intro_vwrite.',
    side: 'Saves the 3x3 bytes under the triangle (bitmap_intro_marker_px) and puts them back when hiding, so\ntext that reaches the corner is never damaged. Does nothing if the requested state is already set.',
  })}bitmap_intro_marker_set:
    ld c, a
    ld a, (bitmap_intro_marker)
    cp c
    ret z
    ld a, c
    ld (bitmap_intro_marker), a
    or a
    jp z, bitmap_intro_marker_hide
    ; VRAM address of the marker: row (y + h - 4), byte (x + w - 4)
    ld a, (bitmap_intro_z + 1)
    ld b, a
    ld a, (bitmap_intro_z + 3)
    add a, b
    sub 4
    ld l, 0
    ld h, a
    srl h
    rr l
    ld a, (bitmap_intro_z)
    ld b, a
    ld a, (bitmap_intro_z + 2)
    add a, b
    sub 4
    ld e, a
    ld d, 0
    add hl, de
    ld (bitmap_intro_marker_addr), hl
    ; save the 3 rows under the marker
    ex de, hl
    ld hl, bitmap_intro_marker_px
    ld a, 3
    ld (bitmap_intro_rows), a
bitmap_intro_marker_read:
    ld b, 3
    call bitmap_intro_vread        ; HL advances, DE is kept
    ld a, e
    add a, 128
    ld e, a
    ld a, d
    adc a, 0
    ld d, a
    ld a, (bitmap_intro_rows)
    dec a
    ld (bitmap_intro_rows), a
    jp nz, bitmap_intro_marker_read
    ; merged pixels: (saved & and-mask) | (text pair & or-mask), byte by byte
${MARKER_MASKS.map((m, k) => `    ld a, (bitmap_intro_marker_px + ${k})
    and #${m[0].toString(16).toUpperCase().padStart(2, '0')}
    ld b, a
    ld a, (bitmap_intro_fgpair)
    and #${m[1].toString(16).toUpperCase().padStart(2, '0')}
    or b
    ld (bitmap_intro_buf + ${k}), a`).join('\n')}
    ld hl, bitmap_intro_buf
    jp bitmap_intro_marker_write
bitmap_intro_marker_hide:
    ld hl, bitmap_intro_marker_px
; HL = 9 bytes (3 rows of 3) -> VRAM at bitmap_intro_marker_addr
bitmap_intro_marker_write:
    ld de, (bitmap_intro_marker_addr)
    ld a, 3
    ld (bitmap_intro_rows), a
bitmap_intro_marker_wloop:
    ld b, 3
    call bitmap_intro_vwrite       ; HL advances, DE is kept
    ld a, e
    add a, 128
    ld e, a
    ld a, d
    adc a, 0
    ld d, a
    ld a, (bitmap_intro_rows)
    dec a
    ld (bitmap_intro_rows), a
    jp nz, bitmap_intro_marker_wloop
    ret

; Fade table: bitmap_intro_fade_table[level * 8 + component] = round(component * level / 7).
bitmap_intro_fade_table:
${dbLines(fadeTableBytes()).join('\n')}
`;
}
