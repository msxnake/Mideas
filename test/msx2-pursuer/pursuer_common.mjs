// Shared helpers for the "Soldado perseguidor" (Boina Verde) measurement tools.
// Pure data builders: no I/O, no dependency on the generator. The soldier is a NORMAL scripted
// enemy of the existing system (msx2_movement.mode = 'scripted' + msx2_ai.behaviorAssetId);
// none of the new-mechanic fields (alertZone, pursuer, ...) exist yet and none are written here.

export const SOLDIER_SPRITE_ID = 'msx2sprite_pursuer_boina_verde';
export const SOLDIER_BEHAVIOR_ID = 'msx2enemybehavior_pursuer_boina_verde';

// Same 16-colour sprite palette the existing fixtures use (slot -> MSX2 master palette index).
export const SPRITE_PALETTE = [
  { slotIndex: 0, masterIndex: -1, hex: 'rgba(0,0,0,0)' },
  { slotIndex: 1, masterIndex: 0, hex: '#000000' },
  { slotIndex: 2, masterIndex: 113, hex: '#24DB24' },
  { slotIndex: 3, masterIndex: 251, hex: '#6DFF6D' },
  { slotIndex: 4, masterIndex: 79, hex: '#2424FF' },
  { slotIndex: 5, masterIndex: 159, hex: '#496DFF' },
  { slotIndex: 6, masterIndex: 329, hex: '#B62424' },
  { slotIndex: 7, masterIndex: 183, hex: '#49DBFF' },
  { slotIndex: 8, masterIndex: 457, hex: '#FF2424' },
  { slotIndex: 9, masterIndex: 475, hex: '#FF6D6D' },
  { slotIndex: 10, masterIndex: 433, hex: '#DBDB24' },
  { slotIndex: 11, masterIndex: 436, hex: '#DBDB92' },
  { slotIndex: 12, masterIndex: 97, hex: '#249224' },
  { slotIndex: 13, masterIndex: 405, hex: '#DB49B6' },
  { slotIndex: 14, masterIndex: 365, hex: '#B6B6B6' },
  { slotIndex: 15, masterIndex: 511, hex: '#FFFFFF' },
];

const T = 'rgba(0,0,0,0)';

/**
 * 16x32 humanoid sprite, "stackVertical" (two 16x16 parts, like the player). Every pixel row carries
 * AT MOST ONE colour: a MSX2 sprite colours per line, so a row with two inks costs a second hardware
 * layer. One ink per row keeps it at one layer per 16x16 cell = 2 hardware slots per body.
 * Each row is { c: colour, a: first column, b: last column } (inclusive); frame 1 spreads the legs.
 */
function humanoidRows(frame, colors) {
  const { hat, skin, body, belt, boots } = colors;
  const rows = [];
  const span = (c, a, b) => ({ c, a, b });
  rows.push(span(hat, 4, 11));        // 0  hat top
  rows.push(span(hat, 3, 12));        // 1  hat brim
  rows.push(span(skin, 4, 11));       // 2  forehead
  rows.push(span(skin, 4, 11));       // 3  face
  rows.push(span(skin, 5, 10));       // 4  chin
  rows.push(span(body, 6, 9));        // 5  neck/collar
  for (let r = 6; r <= 12; r++) rows.push(span(body, 2, 13));   // 6..12 torso + arms
  rows.push(span(belt, 4, 11));       // 13 belt
  for (let r = 14; r <= 19; r++) rows.push(span(body, 4, 11)); // 14..19 hips
  const legA = frame === 0 ? 4 : 3;
  const legB = frame === 0 ? 11 : 12;
  for (let r = 20; r <= 28; r++) rows.push(span(body, legA, legB));
  for (let r = 29; r <= 31; r++) rows.push(span(boots, legA, legB));
  return rows;
}

export const SOLDIER_COLORS = { hat: '#249224', skin: '#DBDB92', body: '#24DB24', belt: '#B62424', boots: '#000000' };
export const LAB_PLAYER_COLORS = { hat: '#2424FF', skin: '#FF6D6D', body: '#496DFF', belt: '#FFFFFF', boots: '#000000' };

export function makeHumanoidSpriteAsset(id, name, colors) {
  const frames = [0, 1].map(f => {
    const data = humanoidRows(f, colors).map(({ c, a, b }) => Array.from({ length: 16 }, (_x, col) => (col >= a && col <= b ? c : T)));
    return { id: `frame_${id}_${f}`, data };
  });
  return {
    id, name, type: 'msx2sprite',
    data: {
      id, name, target: 'MSX2', vdpMode: 'SCREEN5',
      size: { width: 16, height: 32 },
      superSpriteLayout: 'stackVertical',
      superSpriteParts: [
        { id: 'part_a', label: 'A', offsetX: 0, offsetY: 0, width: 16, height: 16 },
        { id: 'part_b', label: 'B', offsetX: 0, offsetY: 16, width: 16, height: 16 },
      ],
      palette: SPRITE_PALETTE.map(p => ({ ...p })),
      backgroundColor: T,
      frames,
      currentFrameIndex: 0,
      animationSpeedMs: 140,
      loops: true,
      facingDirection: 'right',
      hardware: { x: 48, y: 80, color: 15, patternIndex: 0 },
    },
  };
}

/** The Boina Verde soldier: green beret, green uniform. */
export function makeSoldierSpriteAsset(id = SOLDIER_SPRITE_ID, name = 'BoinaVerde') {
  return makeHumanoidSpriteAsset(id, name, SOLDIER_COLORS);
}

/** Smallest useful 'rules' program: walk, turn at ledges and walls. No FIRE, no JUMP, no sight. */
export function makeSoldierBehaviorAsset(id = SOLDIER_BEHAVIOR_ID, name = 'BoinaVerde walk') {
  return {
    id, name, type: 'msx2enemybehavior',
    data: {
      id, name, target: 'MSX2', initialState: 0, speedPxPerTick: 1, logicIntervalFrames: 2,
      states: [{
        id: 'state_walk', name: 'Walk',
        rules: [
          { id: 'r_noFloor', condition: 'NO_FLOOR_AHEAD', action: 'TURN_AND_WALK' },
          { id: 'r_wall', condition: 'WALL_AHEAD', action: 'TURN_AND_WALK' },
          { id: 'r_walk', condition: 'ALWAYS', action: 'WALK' },
        ],
      }],
    },
  };
}

/**
 * Scripted enemy entity, 16x32 (tileX/tileY = top-left 16x16 cell; the body spans tileY and tileY+1).
 * Mirrors the shape of test/msx2-behavior/fixture_scripted_enemy.json plus the sprite/hitbox size.
 */
export function makeSoldierEntity({ id, name = 'BoinaVerde', tileX, tileY, spriteId = SOLDIER_SPRITE_ID, behaviorId = SOLDIER_BEHAVIOR_ID, minX = 16, maxX = 224 }) {
  return {
    id, name, kind: 'enemy',
    position: { x: tileX, y: tileY },
    spriteAssetId: spriteId,
    components: {
      msx2_transform: { tileX, tileY, pixelX: tileX * 16, pixelY: tileY * 16, spawnX: tileX * 16, spawnY: tileY * 16 },
      msx2_hardware_sprite: { msx2SpriteAssetId: spriteId, frame: 0, paletteSlot: 10, visible: true },
      msx2_movement: { mode: 'scripted', direction: 1, speed: 1, minX, maxX, boundsUnit: 'px' },
      msx2_ai: { behaviorAssetId: behaviorId, logicUpdateIntervalFrames: 2 },
      msx2_collision: { hitboxW: 16, hitboxH: 32, offsetX: 0, offsetY: 0, solid: false, damage: 1 },
    },
    params: { runtime: 'MSX2', engine: 'staticEnemy', movement: 'scripted', behaviorAssetId: behaviorId },
  };
}
