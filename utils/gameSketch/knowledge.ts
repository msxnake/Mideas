/**
 * Static knowledge shipped inside every AI Game Sketch: glossaries, component
 * semantics, physics formulas taken from the Mideas Play mode, and per-target
 * rebuild hints. Kept separate so it can be reviewed/extended without touching
 * the exporter logic.
 */

export const CONDITION_GLOSSARY: Record<string, string> = {
  AND: 'True when every child condition is true.',
  OR: 'True when at least one child condition is true.',
  XOR: 'True when exactly one child condition is true.',
  NOT: 'Negates its single child condition.',
  KEY_PRESSED: 'True while the given key/joystick direction is held. Keys use browser codes (KeyN, ArrowLeft, Space...); on MSX they map to cursors/joystick and SPACE/fire.',
  KEY_RELEASED: 'True on the frame the key stops being held.',
  TIME_OUT: 'True once the entity has stayed in the current state for the given time.',
  CAN_MOVE_DIRECTION: 'True if moving one step in the direction would not overlap a solid tile.',
  HAS_COLLISION: 'True while the entity hitbox overlaps another entity hitbox matching collisionType (enemy | item | wall | entity | any), optionally filtered by template / itemType. Respects collisionLayer/collidesWith bitmasks.',
  PATH_CLEAR: 'True if no solid tile lies ahead in the given direction.',
  ON_WALL_COLLISION: 'True while the entity is pushing against a solid tile on the given side.',
  HAS_DEADLY_TILE_COLLISION: 'True while the entity hitbox overlaps a tile whose logical properties have causesDamage = true.',
  IN_WATER: 'True while the entity is inside a "water" effect zone.',
  IS_WALL_GRABBING: 'True while the entity is clinging to a wall.',
  ANIMATION_COMPLETE: 'True once a non-looping sprite animation reached its last frame.',
  KEY_AND_MOVEMENT: 'Shortcut for KEY_PRESSED(key) AND CAN_MOVE_DIRECTION(direction).',
  VARIABLE_COMPARE: 'Compares a global variable with a constant or with another variable.',
};

export const ACTION_GLOSSARY: Record<string, string> = {
  NONE: 'No operation.',
  SET_POSITION: 'Teleports the entity to (x, y) pixels.',
  MOVE_BY: 'Adds (x, y) pixels to the position once.',
  SET_VELOCITY: 'Overwrites the velocity (pixels per frame).',
  APPLY_FORCE: 'Adds (x, y) to the velocity (impulse). Negative y = upwards.',
  CHANGE_SPRITE: 'Switches the entity graphic to another sprite asset (by name or id).',
  PLAY_ANIMATION: 'Starts a named animation.',
  SET_ANIMATION_SPEED: 'Changes animation speed.',
  TOGGLE_ANIMATION: 'Pauses/resumes the sprite animation.',
  PLAY_SOUND: 'Plays a PSG sound effect (see audio/sfx).',
  PLAY_MUSIC: 'Starts a tracker song (see audio/music).',
  MUTE_MUSIC: 'Mutes the current song.',
  STOP_MUSIC: 'Stops the current song.',
  SET_VARIABLE: 'Assigns a value to a global variable.',
  INCREMENT_VARIABLE: 'Adds amount (default 1) to a global variable.',
  DECREMENT_VARIABLE: 'Subtracts amount (default 1) from a global variable.',
  SET_COMPONENT_PROPERTY: 'Changes one property of one component of this entity at runtime.',
  WAIT: 'Waits before continuing.',
  GOTO_STATE: 'Forces a state change.',
  DESTROY_ENTITY: 'Removes this entity (target=self) or the other entity in the collision (target=other).',
  SPAWN_ENTITY: 'Creates a new entity from a template, optionally relative to this entity and with a lifetime (bullets, effects).',
  GET_RANDOM_ENTITY_POSITION: 'Moves the entity to a random valid position.',
  CHANGE_GAME_FLOW_NODE: 'Leaves gameplay and jumps to a node of the Game Flow graph.',
  REGENERATE_HUD: 'Redraws the HUD.',
  CLEAN_SPRITES: 'Hides every hardware sprite.',
  CHANGE_WORLD_SCREEN: 'Moves to another screen of the current world map.',
  EXIT_CURRENT_WORLD: 'Ends the WorldLink node and continues the Game Flow through its output.',
  DECREASE_LIVES: 'Removes lives. When lives reach 0 the game flow continues to its game-over branch.',
  INCREASE_LIVES: 'Adds lives.',
  RESPAWN_PLAYER: 'Places the player back at its spawn/checkpoint.',
  BREAK_TILE: 'Removes the tile adjacent to the entity in the given direction (destructible terrain).',
  REPLACE_TILE: 'Replaces the adjacent tile with another tile.',
  REPLACE_TILE_AT: 'Replaces the tile at an absolute cell (x 0..31, y 0..23).',
  MOVE_TILE_AREA: 'Moves a rectangle of tiles (moving walls, doors).',
  SHIFT_TILE_AREA: 'Shifts a rectangle of tiles, filling the gap with fillTileId.',
  RND: 'Stores a random number in a variable.',
  POINT_AT: 'Turns the entity to face a target.',
  ADD_VARIABLES: 'target = a + b', SUBTRACT_VARIABLES: 'target = a - b', MULTIPLY_VARIABLES: 'target = a * b',
  DIVIDE_VARIABLES: 'target = a / b (integer)', MODULO_VARIABLES: 'target = a % b', ASSIGN_VARIABLE: 'target = source',
  DISABLE_INPUT: 'Ignores player input until ENABLE_INPUT.',
  ENABLE_INPUT: 'Re-enables player input.',
};

/** Semantics of the built-in ECS components (matched by id or normalised name). */
export const COMPONENT_SEMANTICS: Record<string, { meaning: string; formulas?: string[] }> = {
  position: { meaning: 'Initial pixel position (x, y) of the entity, top-left corner of its sprite. Screen is 256x192 logical px.' },
  renderable: { meaning: 'Which sprite asset draws the entity, visibility and draw layer.' },
  render: { meaning: 'Which sprite asset draws the entity, visibility and draw layer.' },
  health: { meaning: 'Hit points: current and max.' },
  jump: {
    meaning: 'Jump ability. Requires Gravity. maxJumps > 1 allows multi-jump.',
    formulas: ['on jump: velocity.y = -jumpPower / 40   (pixels per frame, 1 frame = 1/60 s in Play mode)'],
  },
  gravity: {
    meaning: 'Constant downward acceleration while not standing on solid ground.',
    formulas: ['each frame while airborne: velocity.y += strength / 60', 'velocity.y = min(velocity.y, terminalVelocity)'],
  },
  physics: { meaning: 'Velocity in pixels/frame plus friction and mass. Bullets use a fixed velocity with friction 0.' },
  collision: {
    meaning: 'Axis-aligned hitbox relative to the sprite top-left. collisionLayer = the layer bit this entity is on; collidesWith = bitmask of layers it reacts to. isStatic = immovable (platforms). isTrigger = overlap is reported but there is no push-back.',
    formulas: ['A reacts to B when (A.collidesWith & B.collisionLayer) != 0', 'Layer bits: 1 player, 2 enemies, 4 player bullets, 8 platforms/walls, 16 enemy bullets, 32 collectibles, 64 triggers, 128 custom'],
  },
  wallcollision: { meaning: 'Hitbox used against SOLID TILES of the screen (tile logical property isSolid). stopOnCollision blocks movement.' },
  playerinput: { meaning: 'Entity is controlled by the player (cursors/joystick + fire).' },
  cursors: { meaning: 'Moves the entity with the cursor keys/joystick at `speed` px per frame, per allowed direction.' },
  aibehavior: { meaning: 'Simple AI: patrol within patrolRangeX pixels, chase the target template when it comes within aggroRadius pixels.' },
  damage: { meaning: 'Damage dealt on contact (damageAmount) and knockback.' },
  collectible: { meaning: 'Item picked up on contact. itemType/itemValue describe what it gives (score, ammo, key...).' },
  patrol: { meaning: 'Moves back and forth between waypoint1 and waypoint2 (pixels) at patrolSpeed, pausing waypointPause frames at each end. multiScreen = moving platform that crosses screens.' },
  aiming: { meaning: 'Rotates/aims towards a target template within aimingRange.' },
  shoot: { meaning: 'Can fire projectiles: sprite, speed, range, damage, cooldownMs, fireKey, aimMode (facing/aimed), anchor/offset from the shooter. hasAmmo=false means firing needs ammo collected first.' },
  statemachine: { meaning: 'Behaviour driven by a state machine (see rules/state_machines.md). currentStateId is the initial state.' },
  spawner: { meaning: 'Periodically spawns entities of entityTemplateId (every spawnRate ms, up to maxEntities) inside the spawn zone.' },
  tilecollector: { meaning: 'Collects background tiles listed in collectibleTileIds when touching them (pac-dots, coins), replacing them with replacementTileId.' },
  inventory: { meaning: 'Item counter and score per item; may display the count on screen.' },
  animation: { meaning: 'Sprite frame animation: speed, looping, and optionally only animate while moving.' },
  carry: { meaning: 'Can pick up and carry Box entities.' },
  box: { meaning: 'Object that can be carried/pushed.' },
  rotate: { meaning: 'Sprite rotation / facing direction (0..3).' },
  pacmanmovement: { meaning: 'Grid-locked maze movement: moves at `speed`, buffers the desired direction and turns when aligned to the tile grid (tileSize px). Stops on walls.' },
  pacmanmovementv2: { meaning: 'Grid-locked maze movement (v2): same as Pac-Man movement with pixel-exact turning.' },
  pacmanrotationv2: { meaning: 'Auto-rotates the sprite to the movement direction.' },
  behavior: { meaning: 'Legacy custom Z80 behaviour script (see code/). Must be reinterpreted by reading the ASM.' },
};

export const ENEMY_BEHAVIOR_GLOSSARY: Record<string, string> = {
  PatrolHorizontal: 'Walks left/right between two limits.',
  WalkerTurnOnEdge: 'Walks and turns around at walls and platform edges.',
  FlyerSine: 'Flies horizontally while oscillating vertically (sine wave).',
  BounceDiagonal: 'Moves diagonally and bounces on walls.',
  Jumper: 'Jumps periodically.',
  HopperTowardsPlayer: 'Hops towards the player.',
  ShooterStatic: 'Stays still and shoots periodically.',
  TurretAim: 'Static turret that aims at the player.',
  ChaseHorizontal: 'Follows the player horizontally.',
  SlimeCeiling: 'Crawls along the ceiling.',
  GearWheel: 'Rotating gear hazard following walls.',
  FlyBounce8: 'Flies in 8 directions bouncing on walls.',
  DropFromCeiling: 'Falls when the player passes below.',
  EmergeFromGround: 'Hides in the ground and emerges near the player.',
};

export const MSX1_SOURCE_PLATFORM = {
  machine: 'MSX1 (TMS9918A VDP, Z80 3.58 MHz, AY-3-8910 PSG, optional Konami SCC)',
  videoMode: 'SCREEN 2: 256x192 px, 32x24 cells of 8x8 px',
  refreshRate: '50 Hz (PAL) / 60 Hz (NTSC). Mideas Play mode runs at 60 fps; "frames" in this sketch mean 1/60 s.',
  palette: '15 fixed colours + transparent (index 0). See palette.json.',
  constraints: [
    'Tiles: each 8-pixel horizontal line of a tile can only use 2 colours (foreground/background). This is a HARDWARE limit, not a design choice.',
    'Hardware sprites: 16x16, 1 colour per sprite layer; multicolour characters are made by stacking several sprite layers (see sprite colours).',
    'Max 32 sprites on screen and max 4 sprites per scanline (extra ones flicker). Ignore this limit on modern targets.',
    'Screen is split in 3 vertical banks (rows 0-7, 8-15, 16-23) with their own 256-tile sets.',
    'Screens are fixed (flip-screen), there is no hardware scrolling.',
  ],
  howToTreatConstraints: 'Keep every DESIGN decision (layout, sizes, speeds, rules, hitboxes). Treat the hardware constraints above as optional: a remake may drop them (more colours, no flicker, more sprites) unless a faithful "retro" look is requested.',
};

export const TARGET_HINTS: Record<string, string[]> = {
  godot4: [
    'Use a 256x192 base viewport (Project Settings > Display > Window: viewport 256x192, stretch mode "viewport", integer scaling) so all coordinates in this sketch are used unchanged; graphics/xN/ PNGs can be used with a Camera2D zoom or a bigger viewport (multiply every coordinate by N).',
    'One TileSet built from graphics/x1/tiles/tileset_atlas.png (8x8 cells). Tile logical properties (solid, deadly, breakable) become TileSet custom data layers + physics layers.',
    'One scene per screen (TileMapLayer + entity instances). The world map connections tell which screen is entered when the player leaves through each border.',
    'Each entity template becomes a scene (CharacterBody2D for players/enemies, Area2D for items/triggers). Components become exported variables; state machines become a script with an enum + match in _physics_process.',
    'collisionLayer/collidesWith map 1:1 to Godot collision_layer / collision_mask bits.',
    'Game Flow becomes an autoload (singleton) that switches scenes: menus, text screens, world, game over, victory.',
    'Audio: use the ready-made WAVs (audio/music/*.wav, audio/sfx/*.wav). Songs already contain their loop points (smpl chunk), so keep the import option Loop Mode = "Detect From WAV". Play music with an AudioStreamPlayer on a "Music" bus and effects with AudioStreamPlayer/AudioStreamPlayer2D on an "SFX" bus.',
  ],
  html5: [
    'Use a 256x192 canvas scaled with CSS (image-rendering: pixelated) or draw graphics/xN/ assets on an N-times bigger canvas.',
    'Fixed timestep game loop at 60 updates per second (requestAnimationFrame + accumulator).',
    'Tilemaps are 32x24 arrays; collision is AABB vs tile grid using the solid/deadly flags in screens/*.json.',
    'Audio: play the WAVs in audio/ with HTMLAudioElement or WebAudio (loop songs from wav.loop.startMs); or synthesize the PSG with WebAudio from the JSON (see audio/AUDIO_SPEC.md).',
  ],
  msx2: [
    'SCREEN 4 keeps the same 32x24 tile layout and sprite mode 2: each sprite line can have its own colour, so multi-layer MSX1 sprites can become single sprites with per-line colours.',
    'The 512-colour palette (16 at a time) allows recolouring: keep palette indices, tweak RGB values.',
    'Up to 8 sprites per scanline instead of 4.',
    'SCREEN 5 (bitmap, 16 colours per pixel) removes the 2-colours-per-8-pixels limit: redraw tiles freely at the same size.',
    'Gameplay data (screens, entities, rules, music) can be reused unchanged.',
  ],
};

export const ART_STYLE_RULES = [
  'Logical resolution is 256x192 and every coordinate in this sketch is in logical (x1) pixels, even when graphics are provided at a higher scale.',
  'If you redraw or enhance graphics, keep each image at exactly N times its original size and keep the silhouette, the hitbox, the pivot (top-left) and the number of animation frames.',
  'Transparent pixels in sprites are alpha = 0 in the PNGs.',
  'graphics/x1 are the exact original pixels. graphics/xN were upscaled automatically (see sketch.graphics.scaleMethod); they are a starting point, not final art.',
  'Each sprite/tile has an auto-generated "description" field plus its name: use them as prompts if you generate higher-resolution art.',
];
