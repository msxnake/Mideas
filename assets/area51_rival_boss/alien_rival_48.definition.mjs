// Rival alien from the other world. Each row generated below is a 48-pixel
// text grid; the msx2-sprites builder converts these grids into SCREEN 5 pixels.
const W = 48, H = 48;
const blank = () => Array.from({ length: H }, () => Array(W).fill('.'));

function polygon(grid, points, color) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i], [xj, yj] = points[j];
      if ((yi > y + 0.5) !== (yj > y + 0.5)
        && x + 0.5 < (xj - xi) * (y + 0.5 - yi) / (yj - yi) + xi) inside = !inside;
    }
    if (inside) grid[y][x] = color;
  }
}
function rect(grid, x0, y0, x1, y1, color) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) grid[y][x] = color;
}
function line(grid, x0, y0, x1, y1, color) {
  const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let error = dx + dy;
  for (;;) {
    if (x0 >= 0 && x0 < W && y0 >= 0 && y0 < H) grid[y0][x0] = color;
    if (x0 === x1 && y0 === y1) break;
    const twice = error * 2;
    if (twice >= dy) { error += dy; x0 += sx; }
    if (twice <= dx) { error += dx; y0 += sy; }
  }
}

function drawFrame(charged) {
  const g = blank();
  // Backward horns, broad shoulders and four-finger claws establish a shape
  // unlike the yellow-green, narrow player sprite even at 1x scale.
  polygon(g, [[17,9],[14,5],[11,3],[13,11],[16,15]], 'k');
  polygon(g, [[31,9],[34,5],[37,3],[35,11],[32,15]], 'k');
  polygon(g, [[17,9],[14,7],[14,11],[18,15]], 'p');
  polygon(g, [[31,9],[34,7],[34,11],[30,15]], 'p');
  line(g, 13, 5, 16, 11, 'v');
  line(g, 35, 5, 32, 11, 'v');

  // Outer armor and feet, drawn behind the face and torso.
  polygon(g, [[11,17],[5,19],[3,16],[4,24],[9,27],[14,25],[19,19]], 'k');
  polygon(g, [[37,17],[43,19],[45,16],[44,24],[39,27],[34,25],[29,19]], 'k');
  polygon(g, [[8,19],[5,21],[9,25],[16,24],[18,20]], 'p');
  polygon(g, [[40,19],[43,21],[39,25],[32,24],[30,20]], 'p');
  polygon(g, [[7,21],[12,19],[17,20],[12,22]], 'v');
  polygon(g, [[41,21],[36,19],[31,20],[36,22]], 'v');

  polygon(g, [[10,24],[15,25],[17,33],[14,38],[9,37],[6,34],[7,28]], 'k');
  polygon(g, [[38,24],[33,25],[31,33],[34,38],[39,37],[42,34],[41,28]], 'k');
  polygon(g, [[10,26],[14,27],[15,33],[12,36],[9,34],[9,29]], 'p');
  polygon(g, [[38,26],[34,27],[33,33],[36,36],[39,34],[39,29]], 'p');
  line(g, 10, 28, 11, 34, 'v');
  line(g, 38, 28, 37, 34, 'v');
  polygon(g, [[8,35],[14,37],[12,40],[7,40],[4,38]], 'k');
  polygon(g, [[40,35],[34,37],[36,40],[41,40],[44,38]], 'k');
  polygon(g, [[7,37],[13,38],[9,39],[5,38]], 'v');
  polygon(g, [[41,37],[35,38],[39,39],[43,38]], 'v');
  for (const [x,y] of [[3,39],[6,41],[10,41],[45,39],[42,41],[38,41]]) {
    line(g, x, y-2, x, y, 'w');
  }

  polygon(g, [[18,34],[23,36],[22,43],[20,47],[13,47],[14,43]], 'k');
  polygon(g, [[30,34],[25,36],[26,43],[28,47],[35,47],[34,43]], 'k');
  polygon(g, [[18,37],[21,39],[20,44],[17,45],[16,43]], 'p');
  polygon(g, [[30,37],[27,39],[28,44],[31,45],[32,43]], 'p');
  rect(g, 13, 45, 20, 46, 'v');
  rect(g, 28, 45, 35, 46, 'v');
  line(g, 16, 46, 13, 46, 'c');
  line(g, 32, 46, 35, 46, 'c');

  // Ribbed torso and a fixed exposed core: this is the Boss weak point.
  polygon(g, [[18,17],[30,17],[35,24],[32,33],[29,38],[19,38],[16,33],[13,24]], 'k');
  polygon(g, [[19,19],[29,19],[32,24],[30,33],[27,36],[21,36],[18,33],[16,24]], 'p');
  polygon(g, [[18,22],[22,23],[19,29],[17,28]], 'v');
  polygon(g, [[30,22],[26,23],[29,29],[31,28]], 'v');
  line(g, 18, 31, 22, 34, 'v');
  line(g, 30, 31, 26, 34, 'v');
  line(g, 17, 25, 20, 26, 'c');
  line(g, 31, 25, 28, 26, 'c');
  polygon(g, [[24,22],[28,27],[24,34],[20,27]], 'k');
  polygon(g, [[24,23],[27,27],[24,32],[21,27]], charged ? 'w' : 'r');
  polygon(g, [[24,25],[26,27],[24,30],[22,27]], charged ? 'c' : 'R');
  rect(g, 23, 27, 24, 28, 'w');

  // Long faceted cranium with three eyes and a narrow mandibular mask.
  polygon(g, [[20,5],[28,5],[34,9],[36,15],[33,21],[29,25],[19,25],[15,21],[12,15],[14,9]], 'k');
  polygon(g, [[20,7],[28,7],[32,10],[33,15],[31,20],[28,22],[20,22],[17,20],[15,15],[16,10]], 'p');
  polygon(g, [[18,9],[23,7],[18,14],[16,15]], 'v');
  polygon(g, [[30,9],[25,7],[30,14],[32,15]], 'v');
  polygon(g, [[21,7],[27,7],[28,9],[20,9]], 'l');
  polygon(g, [[17,16],[23,15],[22,18],[18,19]], 'k');
  polygon(g, [[31,16],[25,15],[26,18],[30,19]], 'k');
  line(g, 18, 17, 22, 16, charged ? 'w' : 'c');
  line(g, 30, 17, 26, 16, charged ? 'w' : 'c');
  polygon(g, [[24,10],[27,13],[24,16],[21,13]], 'k');
  polygon(g, [[24,11],[26,13],[24,15],[22,13]], charged ? 'w' : 'R');
  rect(g, 23, 13, 24, 13, 'w');
  polygon(g, [[21,20],[27,20],[29,22],[26,24],[22,24],[19,22]], 'k');
  line(g, 21, 21, 27, 21, 'v');
  line(g, 22, 23, 26, 23, 'c');
  // Occipital vents and faint energy channels.
  line(g, 15, 12, 13, 14, 'c');
  line(g, 33, 12, 35, 14, 'c');
  line(g, 20, 11, 19, 13, 'l');
  line(g, 28, 11, 29, 13, 'l');

  if (charged) {
    for (const [x,y] of [[3,12],[8,8],[40,8],[45,12],[2,29],[46,29]]) {
      g[y][x] = 'c'; g[y-1][x] = 'w';
    }
    line(g, 12, 27, 14, 29, 'c');
    line(g, 36, 29, 34, 27, 'c');
  }
  return g.map(row => row.join(''));
}

export default {
  fileName: 'alien_rival_48',
  id: 'msx2sprite_alien_rival_48',
  name: 'Sujeto Rival - alien del otro mundo',
  vdpMode: 'SCREEN5',
  size: [48, 48],
  superSpriteLayout: 'custom',
  facingDirection: 'right',
  animationSpeedMs: 180,
  hitbox: { width: 36, height: 42, offsetX: 6, offsetY: 5 },
  // Uses the Area51 room's actual SCREEN 5 palette. Dark graphite chitin,
  // steel facets, blue eyes and an orange-red weak point.
  palette: [
    'rgba(0,0,0,0)', '#000000', '#002449', '#00496D', '#246D92',
    '#496D92', '#242424', '#494949', '#6D6D6D', '#929292',
    '#FF2400', '#DBDB6D', '#FF6D49', '#B6DB00', '#2492DB', '#FFFFFF',
  ],
  legend: { '.': 0, k: 1, p: 7, v: 10, l: 9, c: 14, w: 15, r: 10, R: 12 },
  frames: [
    { id: 'idle', rows: drawFrame(false) },
    { id: 'charge', rows: drawFrame(true) },
  ],
  previewScale: 8,
};
