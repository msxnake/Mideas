import { ProjectAnalysis } from '../../asmTemplateGenerator';

const SCREEN2_TILE_CHAR_START = 128;
const SCREEN2_TILE_CHAR_END = 255;
const SCREEN2_TILE_CHAR_CAPACITY = SCREEN2_TILE_CHAR_END - SCREEN2_TILE_CHAR_START + 1;

type TileLike = {
  name?: string;
  width: number;
  height: number;
};

export function getScreen2TileCharCapacity(): number {
  return SCREEN2_TILE_CHAR_CAPACITY;
}

export function getTileCharUsage(tile: TileLike): number {
  return Math.ceil(tile.width / 8) * Math.ceil(tile.height / 8);
}

export function getTotalScreen2TileChars(analysis: ProjectAnalysis): number {
  return (analysis.tiles || []).reduce((total, tile) => total + getTileCharUsage(tile), 0);
}

function buildUsageLines(analysis: ProjectAnalysis): string[] {
  return (analysis.tiles || []).map((tile) => {
    const charsWide = Math.ceil(tile.width / 8);
    const charsHigh = Math.ceil(tile.height / 8);
    const charUsage = charsWide * charsHigh;
    return `- ${tile.name}: ${tile.width}x${tile.height}px -> ${charsWide}x${charsHigh} chars = ${charUsage}`;
  });
}

export function assertScreen2TileCapacity(analysis: ProjectAnalysis, context: string): void {
  const totalChars = getTotalScreen2TileChars(analysis);
  if (totalChars <= SCREEN2_TILE_CHAR_CAPACITY) {
    return;
  }

  const overflow = totalChars - SCREEN2_TILE_CHAR_CAPACITY;
  const usageLines = buildUsageLines(analysis);

  throw new Error(
    [
      `[${context}] Screen 2 tile charset overflow.`,
      `Available dynamic tile chars: ${SCREEN2_TILE_CHAR_CAPACITY} (char codes ${SCREEN2_TILE_CHAR_START}-${SCREEN2_TILE_CHAR_END}).`,
      `Requested chars: ${totalChars} (overflow: ${overflow}).`,
      `This corrupts VRAM because tile pattern/color uploads overrun the reserved Screen 2 tables.`,
      `In practice this can blank tiles and overwrite sprite pattern data, making gameplay or sprites disappear.`,
      `Tile usage:`,
      ...usageLines,
    ].join('\n')
  );
}
