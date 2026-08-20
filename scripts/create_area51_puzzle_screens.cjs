const fs = require('fs');
const path = require('path');

const sourcePath = process.argv[2] || 'C:/Users/salam/Downloads/test534-area51-omega-v2_autosave (72).json';
const outputPath = process.argv[3] || 'C:/Users/salam/Downloads/test534-area51-omega-v3-puzzle-screens.json';

const project = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const baseRoom = project.assets.find((asset) => asset.id === 'bitmap_room_area51_defense_omega_20260818');
if (!baseRoom) throw new Error('No se encontró la sala base Area51 Defense Omega.');

const paletteId = 'palette_screen5_area51_defense_omega_20260818';
const entryNames = {
  1: 'wall_panel_dark',
  2: 'wall_panel_bolts',
  3: 'vent_grille',
  4: 'cracked_panel',
  5: 'floor_plate',
  6: 'hazard_stripes',
  7: 'ceiling_plate',
  8: 'corner_support',
  9: 'laser_horizontal',
  10: 'laser_vertical',
  11: 'rocket_launcher',
  12: 'turret_base',
  13: 'defense_core',
  14: 'cable_conduit',
  15: 'warning_light',
  16: 'background_dark',
  17: 'mirror_crate_one_face',
  18: 'mirror_crate_two_faces',
  19: 'laser_diagonal_down',
  20: 'laser_diagonal_up',
  21: 'security_switch',
  22: 'elevator_platform',
};

const customTiles = [
  {
    value: 17,
    id: 'bitmap_tile_screen5_area51_omega_mirror_crate_one_face_20260819',
    name: 'A51 Omega - Mirror Crate One Face',
    pixelData: makeMirrorCrate(false),
    notes: 'Caja cuadrada empujable con una cara reflectante. Authoring tile for Area51 puzzle rooms.',
  },
  {
    value: 18,
    id: 'bitmap_tile_screen5_area51_omega_mirror_crate_two_faces_20260819',
    name: 'A51 Omega - Mirror Crate Two Faces',
    pixelData: makeMirrorCrate(true),
    notes: 'Caja cuadrada empujable con dos caras reflectantes. Authoring tile for Area51 puzzle rooms.',
  },
  {
    value: 19,
    id: 'bitmap_tile_screen5_area51_omega_laser_diagonal_down_20260819',
    name: 'A51 Omega - Laser Diagonal Down',
    pixelData: makeLaserTile(true),
    notes: 'Segmento de láser diagonal descendente. Authoring tile for Area51 puzzle rooms.',
  },
  {
    value: 20,
    id: 'bitmap_tile_screen5_area51_omega_laser_diagonal_up_20260819',
    name: 'A51 Omega - Laser Diagonal Up',
    pixelData: makeLaserTile(false),
    notes: 'Segmento de láser diagonal ascendente. Authoring tile for Area51 puzzle rooms.',
  },
  {
    value: 21,
    id: 'bitmap_tile_screen5_area51_omega_security_switch_20260819',
    name: 'A51 Omega - Security Switch',
    pixelData: makeSwitchTile(),
    notes: 'Interruptor visual para los puzles de seguridad. Authoring tile for Area51 puzzle rooms.',
  },
  {
    value: 22,
    id: 'bitmap_tile_screen5_area51_omega_elevator_platform_20260819',
    name: 'A51 Omega - Elevator Platform',
    pixelData: makeElevatorTile(),
    notes: 'Plataforma de elevador visual para salvar cambios de altura. Authoring tile for Area51 puzzle rooms.',
  },
];

const assetById = new Map(project.assets.map((asset) => [asset.id, asset]));
for (const tile of customTiles) {
  if (!assetById.has(tile.id)) {
    const asset = {
      id: tile.id,
      name: tile.name,
      type: 'msx2bitmaptile',
      data: {
        id: tile.id,
        name: tile.name,
        mode: 'SCREEN5_BITMAP',
        width: 16,
        height: 16,
        sourceType: 'area51-puzzle-authoring',
        paletteId,
        pixelData: tile.pixelData,
        createdAt: '2026-08-19T00:00:00.000Z',
        updatedAt: '2026-08-19T00:00:00.000Z',
        notes: tile.notes,
      },
    };
    project.assets.push(asset);
    assetById.set(tile.id, asset);
  }
}

const roomSpecs = [
  {
    suffix: '01_entrada_seguridad',
    name: 'A51-01 Entrada de Seguridad',
    objective: 'Aprender a empujar una caja espejo y activar el primer interruptor.',
    difficulty: 1,
    player: { x: 24, y: 144, facing: 'right' },
    mechanics: ['push_mirror_crate_one_face', 'horizontal_laser', 'security_switch', 'short_elevator'],
    objects: [
      { type: 'mirror_crate', variant: 'one_face', x: 4, y: 9, mirrorFaces: 1 },
      { type: 'security_switch', x: 11, y: 9, linkedTo: 'exit_door_01' },
      { type: 'elevator', x: 13, y: 8, fromY: 9, toY: 8, heightCells: 1 },
    ],
    changes: [[4, 9, 17], [11, 9, 21], [13, 8, 22], [13, 9, 22], [5, 6, 9], [6, 6, 9], [7, 6, 9], [8, 6, 9]],
    platforms: [[2, 10, 13, 10]],
    lasers: [[5, 6, 9], [6, 6, 9], [7, 6, 9], [8, 6, 9]],
    switches: [[11, 9]],
    elevators: [[13, 8], [13, 9]],
    solution: 'Empujar la caja desde la izquierda hasta alinear el láser con el receptor; tocar el interruptor y subir al elevador de salida.',
  },
  {
    suffix: '02_pasillo_rebote',
    name: 'A51-02 Pasillo de Rebote',
    objective: 'Resolver dos rebotes usando cajas de una y dos caras.',
    difficulty: 2,
    player: { x: 24, y: 144, facing: 'right' },
    mechanics: ['push_mirror_crate_one_face', 'push_mirror_crate_two_faces', 'diagonal_laser', 'short_jump', 'short_elevator'],
    objects: [
      { type: 'mirror_crate', variant: 'one_face', x: 4, y: 7, mirrorFaces: 1 },
      { type: 'mirror_crate', variant: 'two_faces', x: 10, y: 7, mirrorFaces: 2 },
      { type: 'elevator', x: 13, y: 8, fromY: 9, toY: 8, heightCells: 1 },
    ],
    changes: [[4, 7, 17], [10, 7, 18], [5, 6, 19], [6, 7, 19], [7, 8, 20], [8, 7, 20], [9, 6, 19], [10, 5, 20], [13, 8, 22], [13, 9, 22]],
    platforms: [[2, 8, 5, 8], [8, 8, 12, 8]],
    lasers: [[5, 6, 19], [6, 7, 19], [7, 8, 20], [8, 7, 20], [9, 6, 19], [10, 5, 20]],
    switches: [[12, 8]],
    elevators: [[13, 8], [13, 9]],
    solution: 'Subir al primer descanso, empujar la caja de una cara hacia la diagonal y usar la caja de dos caras para completar el segundo rebote.',
  },
  {
    suffix: '03_sala_sensores',
    name: 'A51-03 Sala de Sensores',
    objective: 'Cruzar sensores de movimiento y cerrar un circuito láser por etapas.',
    difficulty: 3,
    player: { x: 24, y: 144, facing: 'right' },
    mechanics: ['motion_sensor', 'timed_laser', 'push_mirror_crate_two_faces', 'central_elevator'],
    objects: [
      { type: 'motion_sensor', x: 3, y: 9, trigger: 'laser_A' },
      { type: 'mirror_crate', variant: 'two_faces', x: 7, y: 8, mirrorFaces: 2 },
      { type: 'motion_sensor', x: 11, y: 8, trigger: 'laser_B' },
      { type: 'security_switch', x: 13, y: 6, linkedTo: 'exit_door_03' },
      { type: 'elevator', x: 8, y: 7, fromY: 9, toY: 6, heightCells: 3 },
    ],
    changes: [[7, 8, 18], [3, 9, 21], [11, 8, 21], [13, 6, 21], [8, 7, 22], [8, 8, 22], [8, 9, 22], [4, 5, 19], [5, 6, 19], [6, 7, 20], [9, 7, 20], [10, 6, 19], [11, 5, 20]],
    platforms: [[2, 9, 5, 9], [6, 8, 9, 8], [10, 7, 13, 7]],
    lasers: [[4, 5, 19], [5, 6, 19], [6, 7, 20], [9, 7, 20], [10, 6, 19], [11, 5, 20]],
    switches: [[3, 9], [11, 8], [13, 6]],
    elevators: [[8, 7], [8, 8], [8, 9]],
    solution: 'Activar el sensor inferior, usar el elevador central, mover la caja de dos caras y atravesar el segundo sensor para encender el interruptor superior.',
    sequence: { ordered: true, steps: ['S1', 'move_box', 'S2', 'switch_top'], resetOnWrongOrder: true, resetOnDeath: true, progressVisible: true },
  },
  {
    suffix: '04_pozo_elevadores',
    name: 'A51-04 Pozo de Elevadores',
    objective: 'Usar un elevador vertical para alcanzar tres alturas sin saltos largos.',
    difficulty: 4,
    player: { x: 24, y: 144, facing: 'right' },
    mechanics: ['vertical_elevator', 'one_face_mirror_crate', 'diagonal_laser', 'height_management'],
    objects: [
      { type: 'mirror_crate', variant: 'one_face', x: 4, y: 9, mirrorFaces: 1 },
      { type: 'elevator', x: 8, y: 8, fromY: 9, toY: 5, heightCells: 4 },
      { type: 'security_switch', x: 11, y: 5, linkedTo: 'exit_door_04' },
      { type: 'elevator', x: 13, y: 8, fromY: 9, toY: 7, heightCells: 2 },
    ],
    changes: [[4, 9, 17], [8, 5, 22], [8, 6, 22], [8, 7, 22], [8, 8, 22], [11, 5, 21], [13, 7, 22], [13, 8, 22], [5, 7, 19], [6, 6, 20], [7, 5, 19], [9, 5, 20], [10, 6, 19]],
    platforms: [[2, 9, 5, 9], [9, 7, 12, 7], [9, 5, 12, 5]],
    lasers: [[5, 7, 19], [6, 6, 20], [7, 5, 19], [9, 5, 20], [10, 6, 19]],
    switches: [[11, 5]],
    elevators: [[8, 5], [8, 6], [8, 7], [8, 8], [13, 7], [13, 8]],
    solution: 'Colocar la caja en la primera repisa, tomar el elevador central hasta la plataforma alta y activar el interruptor; bajar por el elevador lateral.',
    elevatorStops: [9, 7, 5],
    elevatorRecovery: 'automatic_round_trip_and_callable_from_each_stop',
  },
  {
    suffix: '05_nucleo_omega',
    name: 'A51-05 Núcleo Omega',
    objective: 'Resolver la combinación final de espejos, sensores e interruptores para abrir el núcleo.',
    difficulty: 5,
    player: { x: 24, y: 144, facing: 'right' },
    mechanics: ['two_mirror_crates', 'two_switches', 'motion_sensor', 'two_bounce_laser', 'final_elevator'],
    objects: [
      { type: 'mirror_crate', variant: 'one_face', x: 5, y: 8, mirrorFaces: 1 },
      { type: 'mirror_crate', variant: 'two_faces', x: 9, y: 8, mirrorFaces: 2 },
      { type: 'motion_sensor', x: 3, y: 9, trigger: 'laser_final_A' },
      { type: 'security_switch', x: 4, y: 8, linkedTo: 'core_lock_A' },
      { type: 'security_switch', x: 12, y: 7, linkedTo: 'core_lock_B' },
      { type: 'elevator', x: 14, y: 8, fromY: 9, toY: 7, heightCells: 2 },
    ],
    changes: [[3, 9, 21], [4, 8, 21], [5, 8, 17], [9, 8, 18], [12, 7, 21], [14, 7, 22], [14, 8, 22], [5, 6, 19], [6, 7, 19], [7, 8, 20], [8, 7, 20], [9, 6, 19], [10, 5, 20], [11, 6, 19], [12, 7, 20]],
    platforms: [[2, 9, 6, 9], [7, 8, 10, 8], [11, 7, 13, 7]],
    lasers: [[5, 6, 19], [6, 7, 19], [7, 8, 20], [8, 7, 20], [9, 6, 19], [10, 5, 20], [11, 6, 19], [12, 7, 20]],
    switches: [[3, 9], [4, 8], [12, 7]],
    elevators: [[14, 7], [14, 8]],
    solution: 'Activar el sensor de entrada, empujar la caja de una cara, orientar la de dos caras para completar los dos rebotes, activar ambos interruptores y tomar el elevador hasta la puerta del núcleo.',
    resetPolicy: { puzzleResetAction: 'restart_puzzle_only', boxesRecoverable: true, switchesLatchOpen: true, exitStaysOpen: true, elevatorCallableFromTop: true },
  },
];

const newRoomAssets = [];
const roomIds = [];
for (const spec of roomSpecs) {
  const room = JSON.parse(JSON.stringify(baseRoom));
  room.id = `bitmap_room_area51_puzzle_${spec.suffix}_20260819`;
  room.name = spec.name;
  room.data.id = room.id;
  room.data.name = spec.name;
  room.data.notes = `Área 51 puzzle vertical slice. ${spec.objective} ${spec.solution}`;
  room.data.atlas = buildAtlasWithPuzzleTiles(baseRoom.data.atlas, customTiles);
  room.data.tileGrid = buildGrid(spec);
  room.data.collision = buildCollision(room.data.tileGrid);
  room.data.effects = emptyGrid(12, 16);
  room.data.behavior = emptyGrid(12, 16);
  room.data.composition = {
    source: 'tile-grid',
    commands: buildComposition(room.data.tileGrid, room.data.atlas.entries),
  };
  room.data.entities = [];
  room.data.playerEntries = [{
    id: 'default',
    x: spec.player.x,
    y: spec.player.y,
    facing: spec.player.facing,
    state: 'IDLE',
    playerId: 'player_bitmapPlatform_1781954607778',
    entryAnimation: 'none',
    invulnerabilityFrames: 0,
    cameraTransition: 'instant',
  }];
  room.data.runtime = {
    screenKind: 'playable',
    screenEngine: 'player',
    movementMode: 'platform',
    movementModel: 'platform',
    activeAreaX: 0,
    activeAreaY: 0,
    activeAreaWidth: 256,
    activeAreaHeight: 192,
    showHud: true,
    statusHud: true,
    hudAssetId: 'msx2hud_1782922069276',
    playerEnergyMax: 5,
    playerEnergyInitial: 5,
    requiredCollectibles: 0,
    initialAir: 255,
  };
  room.data.puzzleSpec = {
    schema: 'mideas.area51.puzzle-room',
    schemaVersion: 1,
    roomId: room.id,
    objective: spec.objective,
    difficulty: spec.difficulty,
    mechanics: spec.mechanics,
    objects: spec.objects,
    solution: spec.solution,
    sequence: spec.sequence || null,
    elevatorStops: spec.elevatorStops || null,
    elevatorRecovery: spec.elevatorRecovery || null,
    resetPolicy: spec.resetPolicy || {
      puzzleResetAction: 'restart_puzzle_only',
      boxesRecoverable: true,
      switchesLatchOpen: true,
      exitStaysOpen: true,
    },
    playerMetrics: {
      moveSpeedPx: 2,
      jumpPower: 10,
      gravity: 1,
      maxFallSpeed: 6,
      gridCellPx: 16,
      maxDesignedJumpHeightCells: 2,
      elevatorRequiredForHigherRise: true,
    },
    validation: {
      noBlindJumps: true,
      restartSafe: true,
      softLockRisk: 'low',
      runtimeStatus: 'authoring-metadata; puzzle behavior still needs runtime components',
    },
  };
  newRoomAssets.push(room);
  roomIds.push(room.id);
}

project.assets.push(...newRoomAssets);
const worldMapId = 'worldmap_area51_instalaciones_puzzles_20260819';
project.assets.push({
  id: worldMapId,
  name: 'Área 51 - Instalaciones',
  type: 'worldmap',
  data: {
    id: worldMapId,
    name: 'Área 51 - Instalaciones',
    nodes: roomIds.map((screenAssetId, index) => ({
      id: `wmnode_area51_puzzle_${roomSpecs[index].suffix}_20260819`,
      screenAssetId,
      name: roomSpecs[index].name,
      position: { x: index * 240, y: 0 },
    })),
    connections: roomIds.slice(1).map((screenAssetId, index) => ({
      id: `wmconn_area51_puzzle_${index + 1}_20260819`,
      fromNodeId: `wmnode_area51_puzzle_${roomSpecs[index].suffix}_20260819`,
      toNodeId: `wmnode_area51_puzzle_${roomSpecs[index + 1].suffix}_20260819`,
      fromDirection: 'east',
      toDirection: 'west',
      transitionMode: 'preserve_y_validated',
      ifBlocked: 'deny',
    })),
    panOffset: { x: 0, y: 0 },
    zoomLevel: 1,
    gridSize: 20,
    startScreenNodeId: `wmnode_area51_puzzle_${roomSpecs[0].suffix}_20260819`,
    paletteAssetId: paletteId,
  },
});

project.currentProjectName = 'test534-area51-omega-v3-puzzle-screens';
project.currentEditor = 'Msx2BitmapRoom';
project.currentScreenMode = 'SCREEN 5 (Graphics III)';
project.selectedAssetId = roomIds[0];

fs.writeFileSync(outputPath, JSON.stringify(project));
console.log(JSON.stringify({
  sourcePath,
  outputPath,
  addedRooms: roomIds,
  addedTiles: customTiles.map((tile) => tile.id),
  worldMapId,
  assetCount: project.assets.length,
}, null, 2));

function emptyGrid(height, width) {
  return Array.from({ length: height }, () => Array(width).fill(0));
}

function buildGrid(spec) {
  const grid = Array.from({ length: 12 }, (_, y) => Array.from({ length: 16 }, (_, x) => {
    if ((x === 0 || x === 15) && (y === 0 || y === 11)) return 8;
    if (x === 0 || x === 15) return 8;
    if (y === 0) return x === 3 || x === 12 ? 15 : 7;
    if (y === 11) return 5;
    if (y === 10) return x % 3 === 0 ? 6 : 5;
    return 1;
  }));
  for (const [x1, y1, x2, y2] of spec.platforms) {
    for (let y = y1; y <= y2; y += 1) {
      for (let x = x1; x <= x2; x += 1) grid[y][x] = 5;
    }
  }
  for (const [x, y, value] of spec.changes) grid[y][x] = value;
  return grid;
}

function buildCollision(grid) {
  return grid.map((row) => row.map((value, y) => {
    if (value === 9 || value === 10 || value === 19 || value === 20) return 64;
    if (value === 17 || value === 18 || value === 21) return value === 21 ? 0 : 16;
    if (value === 22) return 16;
    if (value === 5 || value === 6 || value === 8 || y >= 10) return 16;
    return 0;
  }));
}

function buildComposition(grid, entries) {
  const entryByName = new Map(entries.map((entry) => [entry.name, entry.id]));
  return grid.flatMap((row, y) => row.map((value, x) => {
    const name = entryNames[value];
    const atlasEntryId = entryByName.get(name);
    if (!atlasEntryId) throw new Error(`No hay atlas entry para tile ${value} (${name}).`);
    return {
      id: `area51_puzzle_tile_${x}_${y}`,
      op: 'copy',
      atlasEntryId,
      dx: x * 16,
      dy: y * 16,
      w: 16,
      h: 16,
    };
  }));
}

function buildAtlasWithPuzzleTiles(baseAtlas, tiles) {
  const atlas = JSON.parse(JSON.stringify(baseAtlas));
  const existingWidth = atlas.width;
  for (let y = 0; y < atlas.pixels.length; y += 1) {
    for (const tile of tiles) atlas.pixels[y].push(...tile.pixelData.slice(y * 16, y * 16 + 16));
  }
  for (let i = 0; i < tiles.length; i += 1) {
    const tile = tiles[i];
    atlas.entries.push({
      id: `atlas_area51_puzzle_${tile.value}_${tile.id.split('_').slice(-2, -1)[0]}`,
      name: entryNames[tile.value],
      sx: existingWidth + i * 16,
      sy: 0,
      w: 16,
      h: 16,
      sourceAssetId: tile.id,
      collisionFlags: tile.value === 17 || tile.value === 18 ? 16 : tile.value === 19 || tile.value === 20 ? 64 : tile.value === 22 ? 16 : 0,
    });
  }
  atlas.width = existingWidth + tiles.length * 16;
  return atlas;
}

function makeTile(fill = 6) {
  return Array(256).fill(fill);
}

function makeMirrorCrate(twoFaces) {
  const p = makeTile(6);
  for (let y = 0; y < 16; y += 1) for (let x = 0; x < 16; x += 1) {
    if (x === 0 || y === 0 || x === 15 || y === 15) p[y * 16 + x] = 15;
    else if (x === 1 || y === 1 || x === 14 || y === 14) p[y * 16 + x] = 7;
    else if (x + y === 10 || x + y === 11 || (twoFaces && x - y === 3)) p[y * 16 + x] = 14;
    else if (x + y === 9 || x + y === 12 || (twoFaces && x - y === 2)) p[y * 16 + x] = 3;
    else p[y * 16 + x] = 8;
  }
  return p;
}

function makeLaserTile(descending) {
  const p = makeTile(6);
  for (let y = 0; y < 16; y += 1) for (let x = 0; x < 16; x += 1) {
    const line = descending ? Math.abs(x - y) <= 1 : Math.abs(x - (15 - y)) <= 1;
    const glow = descending ? Math.abs(x - y) === 2 : Math.abs(x - (15 - y)) === 2;
    if (line) p[y * 16 + x] = 10;
    else if (glow) p[y * 16 + x] = 12;
  }
  return p;
}

function makeSwitchTile() {
  const p = makeTile(6);
  for (let y = 0; y < 16; y += 1) for (let x = 0; x < 16; x += 1) {
    if (x === 0 || y === 0 || x === 15 || y === 15) p[y * 16 + x] = 7;
    else if (x >= 4 && x <= 11 && y >= 5 && y <= 10) p[y * 16 + x] = 13;
    else if (x >= 6 && x <= 9 && y >= 3 && y <= 5) p[y * 16 + x] = 15;
  }
  return p;
}

function makeElevatorTile() {
  const p = makeTile(6);
  for (let y = 0; y < 16; y += 1) for (let x = 0; x < 16; x += 1) {
    if (y === 3 || y === 4) p[y * 16 + x] = 15;
    else if (y === 5 || y === 6) p[y * 16 + x] = 14;
    else if (x === 2 || x === 13) p[y * 16 + x] = 7;
    else if ((x + y) % 4 === 0) p[y * 16 + x] = 3;
  }
  return p;
}
