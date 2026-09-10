export interface BitmapStrokeCell { x: number; y: number }

/** Join delivered mouse samples; browsers need not send an event in every cell. */
export const interpolateBitmapStrokeCells = (
  from: BitmapStrokeCell | null,
  to: BitmapStrokeCell,
): BitmapStrokeCell[] => {
  if (!from) return [{ ...to }];
  const cells: BitmapStrokeCell[] = [];
  let x = from.x;
  let y = from.y;
  const dx = Math.abs(to.x - x);
  const dy = -Math.abs(to.y - y);
  const sx = x < to.x ? 1 : -1;
  const sy = y < to.y ? 1 : -1;
  let error = dx + dy;
  while (x !== to.x || y !== to.y) {
    const twice = 2 * error;
    if (twice >= dy) { error += dy; x += sx; }
    if (twice <= dx) { error += dx; y += sy; }
    cells.push({ x, y });
  }
  // Exclude the starting cell: it was already painted by the previous event.
  return cells;
};
