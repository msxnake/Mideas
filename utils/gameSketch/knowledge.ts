/**
 * Static knowledge shipped inside every AI Game Sketch: glossaries, component
 * semantics and engine rules, and per-target rebuild hints.
 *
 * SOURCE OF TRUTH: the live Mideas Play mode, components/modals/GameFlowPreviewModal.tsx
 * (GFP:<line> references below), which mirrors the Z80 ROM generator
 * (utils/msxGenerator/generators/*). Every statement here was checked against
 * that code (Gauntlet review, round 1). Keep the line hints when editing.
 */

export const CONDITION_GLOSSARY: Record<string, string> = {
  AND: 'True when every child condition is true.',
  OR: 'True when at least one child condition is true.',
  XOR: 'True when an ODD number of child conditions are true (exactly one, for two children).',
  NOT: 'Negates its single child condition.',
  KEY_PRESSED: 'True while the given input is held (the player also gets an immediate check on the key-down event, which ignores guards/WAIT; the per-frame check fires the same transition anyway). Inputs are logical ids: up/down/left/right (cursors/joystick), fire (button 1 = SPACE), action2 (button 2: the key set in the Game Flow Controls node, N by default or CTRL; N, M, KeyN, grab, attack all map to action2), f1..f5. See engineRules.inputs.',
  KEY_RELEASED: 'Level-based: true WHILE the key is NOT held (not only on the release frame).',
  TIME_OUT: 'True once the entity has stayed in the current state for `duration` FRAMES (1 frame = 1/60 s; default 60 = 1 second).',
  CAN_MOVE_DIRECTION: 'True if moving one pixel in the direction would not overlap a solid tile. Test (Play = ROM): the Collision hitbox (16x16, offset 0 without Collision) moved one pixel; every 8x8 cell it covers must not be a full blocker (one-way platforms do not block; outside the screen is passable). Positions are bytes.',
  HAS_COLLISION: 'LEVEL-based (Play = ROM): true while this entity overlaps another entity (or, for wall/any, a solid tile) in the last collision pass. Both entities must accept each other (mutual layer rule). Classes come from the OTHER entity collision layer: enemy = layer bit #02, item = layer bit #10 (16), entity = any overlap, wall = tile wall contact, any = any of them. There is no itemType/template filter. No entity collides during its first 200 ms after spawning (Play).',
  PATH_CLEAR: 'True if no solid tile lies ahead in the given direction (direction 0 = deduced from the velocity; idle = clear). Test (Play = ROM): the Collision hitbox (16x16, offset 0 without Collision) moved one pixel; every 8x8 cell it covers must not be a full blocker (one-way platforms do not block; outside the screen is passable). Positions are bytes.',
  ON_WALL_COLLISION: 'LEVEL-based (Play = ROM): wall flags rebuilt every frame: up/left/right = a tile probe blocked the movement on that side this frame, down = standing on (or landing on) solid tiles. any = any side.',
  HAS_DEADLY_TILE_COLLISION: 'True while the CENTRE point of the entity hitbox is on a tile with causesDamage = true. Only evaluated for entities that have the "Deadly Tiles" marker component (comp_deadly_tiles); without it the condition is never true.',
  IN_WATER: 'True while the entity is inside a "water" effect zone. Requires the comp_in_water marker component.',
  IS_WALL_GRABBING: 'True while the entity is clinging to a wall. Requires comp_wall_grab + Gravity, and holding button 2 (Controls-node key, N by default) against a wall while airborne.',
  ANIMATION_COMPLETE: 'True once a non-looping sprite animation reached its last frame.',
  KEY_AND_MOVEMENT: 'Key held (level) AND the move test in `direction`, else in the direction of the key itself, else in the velocity direction (idle = false). Test (Play = ROM): the Collision hitbox (16x16, offset 0 without Collision) moved one pixel; every 8x8 cell it covers must not be a full blocker (one-way platforms do not block; outside the screen is passable). Positions are bytes.',
  VARIABLE_COMPARE: 'Compares a variable with a constant or another variable. The names x, y, vx, vy and isOnGround refer to THIS ENTITY (position/velocity/grounded), then system variables (gem_count, last_interaction_*), then global variables. For vy, values >= 64 are compared as Z80 signed bytes. Relational operators on non-numbers are false.',
};

export const ACTION_GLOSSARY: Record<string, string> = {
  NONE: 'No operation.',
  SET_POSITION: 'Teleports the entity to (x, y) pixels.',
  MOVE_BY: 'Adds (x, y) pixels to the position once.',
  SET_VELOCITY: 'Overwrites the velocity (pixels per frame). A non-zero y also sets the gravity accumulator (gravityVel = vy << 8) so gravity continues from that speed.',
  APPLY_FORCE: 'Adds (x, y) to the velocity (impulse). Negative y = upwards. The resulting vy is copied into the gravity accumulator (gravityVel = vy << 8).',
  CHANGE_SPRITE: 'Switches the entity graphic to another sprite asset (by name or id).',
  PLAY_ANIMATION: 'In Play mode: switches to the SPRITE ASSET with that name (same as CHANGE_SPRITE); animation only runs if the entity has the Animation component.',
  SET_ANIMATION_SPEED: 'Changes the animation speed; `speed` is in FRAMES per animation frame (converted to ms as speed*1000/60).',
  TOGGLE_ANIMATION: '`playing` 0 = stop, non-zero = play (without `playing`: mode stop = stop, start/toggle = play). There is no real toggle: the MSX ROM exports toggle as play.',
  PLAY_SOUND: 'Plays a PSG sound effect (see audio/sfx).',
  PLAY_MUSIC: 'Starts a tracker song (see audio/music). `loop` defaults to TRUE when absent.',
  MUTE_MUSIC: 'Mutes the current song.',
  STOP_MUSIC: 'Stops the current song.',
  SET_VARIABLE: 'Assigns a value to a global variable (an empty value assigns true).',
  INCREMENT_VARIABLE: 'Adds amount (default 1) to a global variable (a collectible can only add once per frame).',
  DECREMENT_VARIABLE: 'Subtracts amount (default 1) from a global variable.',
  SET_COMPONENT_PROPERTY: 'Changes one property of one component of this entity at runtime.',
  WAIT: 'Pauses this entity\'s state machine for `duration` MILLISECONDS (default 1000): no transition of this entity is evaluated meanwhile.',
  GOTO_STATE: 'Forces a state change.',
  DESTROY_ENTITY: 'Removes this entity (target=self) or the other entity in the collision (target=other).',
  SPAWN_ENTITY: 'Creates a new entity from a template (bullets, effects). Without x/y it appears at this entity position, except templates whose name contains "coin", which appear at a random nucleo point when nucleos exist (see engineRules.nucleo); isRelative = offset from this entity; matchFacing = inherits facing; lifetimeMs; delayMs = delayed spawn; randomNucleo = random spawn point.',
  GET_RANDOM_ENTITY_POSITION: 'Picks a random existing entity of template `templateId` and stores its x / y into the global variables `targetVariableX` / `targetVariableY` (it does NOT move anything).',
  CHANGE_GAME_FLOW_NODE: 'Leaves gameplay and jumps to a node of the Game Flow graph. This is the ONLY way gameplay reaches a game-over/victory screen.',
  REGENERATE_HUD: 'Redraws the HUD.',
  CLEAN_SPRITES: 'Play mode: skips drawing sprites for one frame (not a persistent hide).',
  CHANGE_WORLD_SCREEN: 'Same as EXIT_CURRENT_WORLD (Play and ROM).',
  EXIT_CURRENT_WORLD: 'Ends the WorldLink node and continues the Game Flow through its output.',
  DECREASE_LIVES: 'Subtracts `amount` from THIS entity\'s Health.current (floor 0; a current of 0/empty is read as the template value or 3) and copies the result into the global variable Lives. It does NOT end the game by itself: a rule must check Lives/Health and use CHANGE_GAME_FLOW_NODE.',
  INCREASE_LIVES: 'Adds `amount` to Health.current (capped at Health.max) and syncs the global Lives.',
  RESPAWN_PLAYER: 'Moves the entity running the action back to the checkpoint saved when the player entered the current screen (clamped to the active area); x/y are only used when there is no checkpoint.',
  BREAK_TILE: 'Removes the tile next to the sprite centre in `direction` (default up) on the behaviour/collision layer, only if that tile isBreakable.',
  REPLACE_TILE: 'Replaces the tile next to the sprite centre in `direction` (default up) with replacementTileId.',
  REPLACE_TILE_AT: 'Replaces the tile at an absolute cell (x 0..31, y 0..23).',
  MOVE_TILE_AREA: 'Moves a rectangle of tiles (moving walls, doors).',
  SHIFT_TILE_AREA: 'Shifts a rectangle of tiles, filling the gap with fillTileId.',
  RND: 'Stores a random number 0..255 in a variable.',
  POINT_AT: 'Sets vx/vy so the entity moves towards (x2, y2) at `speed`.',
  ADD_VARIABLES: 'target = operand1 + operand2 (each operand is a constant or a variable)',
  SUBTRACT_VARIABLES: 'target = operand1 - operand2',
  MULTIPLY_VARIABLES: 'target = operand1 * operand2',
  DIVIDE_VARIABLES: 'target = integer part of operand1 / operand2 (0 if operand2 is 0), as the MSX ROM',
  MODULO_VARIABLES: 'target = operand1 % operand2 (0 if operand2 is 0)',
  ASSIGN_VARIABLE: 'target = source',
  DISABLE_INPUT: 'For this entity: key conditions read as not pressed and cursors/jump/dash are ignored, until ENABLE_INPUT.',
  ENABLE_INPUT: 'Re-enables input for this entity and restores Animation.animateOnlyWhenMoving.',
};

/** Semantics of the built-in ECS components (matched by id or normalised name), as Play mode runs them. */
export const COMPONENT_SEMANTICS: Record<string, { meaning: string; formulas?: string[]; ignoredProperties?: string[] }> = {
  position: {
    meaning: 'Not read by Play mode at all: placed entities spawn at `spawnPixel` (cell * 8, or Patrol waypoint1) and SPAWN_ENTITY uses its own x/y.',
    ignoredProperties: ['x', 'y'],
  },
  renderable: { meaning: 'Which sprite asset draws the entity. Draw order is the entity list order.', ignoredProperties: ['isVisible', 'layer'] },
  render: { meaning: 'Which sprite asset draws the entity. Draw order is the entity list order.', ignoredProperties: ['isVisible', 'layer'] },
  health: { meaning: 'Hit points / lives of this entity (current, max). DECREASE_LIVES and INCREASE_LIVES act on Health.current.' },
  jump: {
    meaning: 'Jump on SPACE (fire) while standing on the ground (not on a ladder); jumpSprite (if set) is shown while airborne. Fixed impulse, identical to the Z80 ROM. requireKeyRelease = must release SPACE between jumps. Only single jumps (maxJumps is not applied).',
    formulas: ['on jump: gravityVel = -1024 (8.8 fixed point) => vy = -4 px/frame', 'carrying a box: impulse * 0.75'],
    ignoredProperties: ['jumpPower', 'maxJumps', 'currentJumpCount', 'isJumping', 'trigger'],
  },
  gravity: {
    meaning: 'Constant downward acceleration while not on the ground/ladder, in 8.8 fixed point like the Z80 ROM.',
    formulas: [
      'each frame while airborne: gravityVel += 0x40 (0.25 px/frame^2)',
      'gravityVel = min(gravityVel, 0x400) (terminal 4 px/frame, only when falling)',
      'vy = signed high byte of gravityVel (whole pixels per frame)',
    ],
    ignoredProperties: ['strength', 'terminalVelocity'],
  },
  physics: { meaning: 'DECLARED BUT NOT IMPLEMENTED: neither Mideas Play mode nor the MSX1 ROM generator use it (intent only; implement it only if you want that feature). Velocities come from input, gravity, Patrol, Shoot and actions (SET_VELOCITY/APPLY_FORCE).', ignoredProperties: ['velocityX', 'velocityY', 'friction', 'mass'] },
  collision: {
    meaning: 'Axis-aligned hitbox relative to the sprite top-left. This component ALSO drives collision with tiles (without it the entity never lands and passes through walls). Hitbox precedence for entity-vs-entity: instance override > template value > sprite.hitbox; for tile probes the component values (definition default 16x16, offset 0) win over sprite.hitbox. collisionLayer 0 is treated as 1 and collidesWith 0 as 255. collisionLayer = layer bit(s) of this entity; collidesWith = bitmask of layers it accepts. isStatic = immovable (platforms). isTrigger = overlap is reported but there is no push-back.',
    formulas: [
      'A and B collide only when (A.collidesWith & B.collisionLayer) != 0 AND (B.collidesWith & A.collisionLayer) != 0 (mutual, same as the ROM)',
      'Layer bits used by HAS_COLLISION: 2 = enemy, 16 = item. Usual others: 1 player, 4 player bullets, 8 platforms/walls, 32/64/128 custom',
    ],
  },
  wallcollision: { meaning: 'Not simulated by Mideas Play mode (there, tile collision uses the Collision component hitbox); the MSX1 ROM does use it for tile collision.' },
  playerinput: { meaning: 'Entity is controlled by the player (cursors/joystick + fire).' },
  cursors: { meaning: 'Moves the entity with the cursor keys/joystick at `speed` px per frame, per allowed direction. Vertical movement only without Gravity or while on a ladder.', ignoredProperties: ['isEnabled'] },
  aibehavior: {
    meaning: 'Built-in X movement (Play = ROM update_behavior_component), chosen by behaviorType or aiState: chase/follow_player_x (move towards the player at `speed` px/frame), flee_player_x (away from the player), face_player_x (only turn to face the player), walk_x_wall_turn (walk and turn around at walls). Stops when |dx| <= stopDistance or, if range (aggroRadius) != 0, when |dx| > range. Any other value (e.g. idle, patrol) = no movement. For HAS_COLLISION "enemy" the collision layer must have bit 2.',
    formulas: ['speed clamped to 1..16 px/frame', 'runs before the state machine every frame'],
    ignoredProperties: ['stateTimer', 'targetEntityTemplateId', 'patrolRangeX'],
  },
  damage: { meaning: 'damageAmount/knockback are descriptive (rules decide the effect). For HAS_COLLISION "enemy" the collision layer must have bit 2.' },
  collectible: { meaning: 'Item picked up on contact (for HAS_COLLISION "item" its collision layer must have bit 16). It has NO effect by itself: score/ammo/keys come from state machine rules. Once collected it does not reappear when the screen is re-entered.' },
  patrol: {
    meaning: 'Moving platform/object. If waypoint1 is set the entity SPAWNS at waypoint1 (not at its cell) and moves in a straight line towards waypoint2 at `speed` px/frame (default 1), bouncing back when it reaches or passes a waypoint. multiScreen waypoints are in world coordinates relative to the origin screen (each screen is 256x192 in the world map layout).',
    formulas: ['velocity = normalize(waypoint2 - waypoint1) * (speed || 1)'],
    ignoredProperties: ['patrolSpeed', 'waypointPause', 'patrolType'],
  },
  aiming: { meaning: 'DECLARED BUT NOT IMPLEMENTED: neither Mideas Play mode nor the MSX1 ROM generator use it (intent only; implement it only if you want that feature). Intended: aim towards a target template within aimingRange.' },
  shoot: {
    meaning: 'Fires projectiles with `fireKey` (default key X; N in char mode): sprite, speed, range, damage, cooldownMs, aimMode ("facing" or "4dir"), anchor/offset. Firing is blocked only when hasAmmo is false/"false". If a global variable Ammo exists, firing needs Ammo != 0 (negative = infinite), subtracts 1 per shot and sets hasAmmo=false at 0.',
  },
  statemachine: { meaning: 'Behaviour driven by a state machine (see rules/state_machines.md and engineRules.stateMachines). currentStateId is the initial state.' },
  spawner: { meaning: 'DECLARED BUT NOT IMPLEMENTED: neither Mideas Play mode nor the MSX1 ROM generator use it (intent only; implement it only if you want that feature). Intended: spawn entityTemplateId every spawnRate ms, up to maxEntities, inside the spawn zone.' },
  tilecollector: { meaning: 'Play mode: only adds targetVariable/incrementAmount/flagVariable to the collection of "collect_gem" tiles (see engineRules.tileInteractions).', ignoredProperties: ['collectionRadius', 'collectibleTileIds', 'replacementTileId', 'collectionSoundId'] },
  inventory: { meaning: 'DECLARED BUT NOT IMPLEMENTED: neither Mideas Play mode nor the MSX1 ROM generator use it (intent only; implement it only if you want that feature). Intended: item counter and score per item.' },
  animation: {
    meaning: 'Only entities with this component animate. Sprite frame animation driven by REAL TIME: one frame every sprite.animationSpeedMs (200 ms when the sprite has none; this component\'s animationSpeed is not used). With animateOnlyWhenMoving it only animates while vx/vy != 0, in a walk/run/dash state, or in a priority state (Dead, Death, Hurt, Hit, Damage, Attack, Attacking, Stunned, GameOver, Invulnerable, Landing); when it stops it returns to frame 0. Looping comes from the sprite.',
    ignoredProperties: ['animationSpeed', 'currentAnimationName'],
  },
  carry: { meaning: 'Picks up / drops a nearby Box entity with key Z (or DOWN + fire key); it is dropped in front, at the feet. While carrying: speed * 0.5 and jump * 0.75.' },
  box: { meaning: 'Object that can be carried/pushed. Collected/moved boxes keep their state when the screen is re-entered.' },
  rotate: { meaning: 'DECLARED BUT NOT IMPLEMENTED: neither Mideas Play mode nor the MSX1 ROM generator use it (intent only; implement it only if you want that feature). Intended: sprite rotation / facing (0..3).' },
  pacmanmovement: { meaning: 'DECLARED BUT NOT IMPLEMENTED: neither Mideas Play mode nor the MSX1 ROM generator use it (intent only; implement it only if you want that feature). Intended: grid-locked maze movement at `speed`, buffering the desired direction and turning when aligned to the grid.' },
  pacmanmovementv2: { meaning: 'DECLARED BUT NOT IMPLEMENTED: neither Mideas Play mode nor the MSX1 ROM generator use it (intent only; implement it only if you want that feature). Intended: grid-locked maze movement with pixel-exact turning.' },
  pacmanrotationv2: { meaning: 'DECLARED BUT NOT IMPLEMENTED: neither Mideas Play mode nor the MSX1 ROM generator use it (intent only; implement it only if you want that feature). Intended: auto-rotate the sprite to the movement direction.' },
  behavior: { meaning: 'Same built-in movement as AIBehavior (behaviorType / speed / stopDistance / range / initialDirection; its values override AIBehavior). scriptAssetId is a legacy Z80 script reference; placeholder_behavior_* means no script.' },
};

/** Engine rules of the Play mode that are not attached to a single component. */
export const ENGINE_RULES = {
  timing: 'Fixed 60 updates per second. Speeds are pixels per frame. Animations and WAIT use real milliseconds.',
  stateMachines: [
    'Every frame, for each entity, the transitions whose `from` is the current state OR "Any State" (__ANY_STATE__) are checked in list order; the FIRST one whose condition (and guard) is true fires, at most one per frame.',
    'Firing order: onExit actions of the old state -> state change (TIME_OUT counter reset; the new state properties.velocityX/velocityY are applied, and for the player they override its velocity every frame) -> transition actions -> onEnter actions of the new state. A self-transition, or a transition to "Any State", keeps the state: no onExit/onEnter and no counter reset. Pending collision events are cleared when a transition fires.',
    'While a WAIT action is pending, no transition of that entity is evaluated.',
    'State NAMES have engine effects: Dead/Death/Hurt/Hit/Damage/Respawn/Spawning/Invulnerable (substring, case-insensitive) suppress entity-collision events; exactly "Dead", "GameOver", "Stunned" or "Frozen" (exact, case-sensitive) disable input and physics; Dead/Death/Respawn/Spawning/Hurt/Hit/GameOver/Invulnerable (substring) disable screen exits.',
    'All conditions are levels evaluated every frame (collision flags are rebuilt on every pass, as in the ROM).',
  ],
  tileCollision: [
    'Solidity comes ONLY from the tile logical property isSolid (see collisionMap legend: # B X D = are blocking).',
    'Who stops on tiles: every entity with the Collision component, unless it has WallCollision with stopOnCollision = false (multi-screen Patrol objects excepted). Same in Play and ROM (the ROM adds the platform bit #08 to collidesWith automatically).',
    'familyId 2 tiles ("=" in collisionMap) are one-way platforms: solid only when the entity comes from above (its hitbox bottom was within 2 px above the tile top) and is falling or idle.',
    'Ground/wall probes use 2 points of the leading side at inset = min(2, floor((size-1)/2)) px from each edge (same as the ROM WallCollision), and snap the entity flush to the tile edge.',
    'Ladder tiles (interactionType "ladder", H in collisionMap) cancel gravity while overlapping them.',
  ],
  entityCollision: {
    rule: 'Mutual: (A.collidesWith & B.collisionLayer) != 0 AND (B.collidesWith & A.collisionLayer) != 0.',
    classification: 'By the OTHER entity collision layer (same in Play and ROM): bit #02 = enemy, bit #10 = item, every overlap = entity. HAS_COLLISION flags are rebuilt on every collision pass (level-based).',
  },
  screenExits: [
    'Only the player. An exit happens when the CENTRE of the sprite leaves the screen ACTIVE AREA (activeArea in screens/*.json) while moving outwards.',
    'Connections work in both directions: if no connection leaves through that side, the reverse connection (entering through it) is used.',
    'The player enters the target screen 2 px inside its active area on the opposite side, keeping the other coordinate (unless the connection uses fixed/door/ladder/checkpoint entry).',
    'After a screen change, exits are blocked for 300 ms. A side without connection is only a wall if the player has the "limit_on" component; otherwise the player can leave the screen.',
    'A checkpoint (respawn point) is saved every time the player enters a screen.',
  ],
  playVsRom: 'Remaining Mideas Play mode vs MSX ROM differences (being closed, see docs/project/PLAN_PARIDAD_PLAY_ROM.md): Spawner, Inventory, Aiming, Rotate, Pac-Man movement are declared but implemented by neither; Dash, Mirror, Physics/Movement, Position and WallJump are used only by the ROM.',
  inputs: 'Logical inputs: up/down/left/right = cursors/joystick; fire = button 1 (SPACE); action2 = button 2 = the key chosen in the Game Flow Controls node (N by default, or CTRL), same in Play and ROM (an MSX2 player asset can override it); X = shoot (Shoot.fireKey); Z = carry.',
  tileInteractions: 'Only for entities with Cursors, PlayerInput, comp_input or Tile Collector. Each frame the tile under the point (x+8, y+8) of the entity is checked and all types write last_interaction_type/value/target. Effects: collect_gem (also tiles flagged isInteractable/isInteractiveSwitch) removes the tile and increments gem_count (plus Tile Collector targetVariable/incrementAmount/flagVariable); collect_item adds interactionValue (or 1) to the variable interactionTarget; add_energy adds 1 to Health and Lives; lever_toggle toggles the interactionTarget variable between 0 and 1 (once); button_press sets last_interaction_pending = true for one frame; jumper sets vy = -max(8, value) (x1.5 while SPACE is held); wallJumper sets vx = +/-value (max 15). Rules can read these with VARIABLE_COMPARE.',
  nucleo: 'Entities of a template named "nucleo" are NOT spawned: they are invisible spawn anchors. SPAWN_ENTITY with randomNucleo uses a random anchor; templates whose name contains "coin" spawned without x/y also use one automatically.',
  entityLifecycle: 'Entering a screen rebuilds all its entities at their spawn points and initial states (enemies reset). Only the player, carried boxes and multiScreen Patrol objects persist across screens; collected items and moved boxes remember their state. Entities of other screens are not simulated. Non-player entities are clamped to the screen. Entities standing on moving platforms are carried along.',
  hud: 'HUD text: {{Variable}} placeholders are replaced by global variables; otherwise the value comes from details.variableName or the element type (Score->Score, HighScore->HighScore, Lives->Lives, CoinCounter->Coin), zero-padded to details.digits and written over the last group of digits of the text.',
  menusAndTexts: 'Menus and text screens are drawn with the project font, centred: SubMenu title at y=40 and options at y=80+12*i (selected option yellow on black); Text nodes: title at y=30, message from y=60 wrapped to 236 px (10 px per line), and "PRESS FIRE TO CONTINUE" 30 px above the bottom. appearance.colors in the flow data are not used by Play.',
  spriteMirroring: 'A sprite drawn facing "right" is mirrored while vx < 0 (and one facing "left" while vx > 0); with vx = 0 it keeps the last orientation. Shots and carried boxes follow that orientation.',
  lives: 'There is no automatic game over: losing all lives only changes Health/Lives; a state-machine rule must jump to the game-over node with CHANGE_GAME_FLOW_NODE.',
};

/** Behaviour presets of enemy assets (EnemyDefinition, used by the MSX2 enemy library). MSX1 ECS entities do not use them. */
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
    'Collision layers: Godot masks are one-way, Mideas is mutual. Put A in B\'s mask only when (A.collidesWith & B.collisionLayer) and (B.collidesWith & A.collisionLayer) are both non-zero, or test the mutual rule in code.',
    'Game Flow becomes an autoload (singleton) that switches scenes: menus, text screens, world, game over, victory.',
    'Audio: use the ready-made WAVs (audio/music/*.wav, audio/sfx/*.wav). Songs already contain their loop points (smpl chunk), so keep the import option Loop Mode = "Detect From WAV". Play music with an AudioStreamPlayer on a "Music" bus and effects with AudioStreamPlayer/AudioStreamPlayer2D on an "SFX" bus.',
  ],
  html5: [
    'Use a 256x192 canvas scaled with CSS (image-rendering: pixelated) or draw graphics/xN/ assets on an N-times bigger canvas.',
    'Fixed timestep game loop at 60 updates per second (requestAnimationFrame + accumulator).',
    'Tilemaps are 32x24 arrays; collision is AABB vs tile grid using the collisionMap of screens/*.json (see engineRules.tileCollision).',
    'Audio: play the WAVs in audio/ with HTMLAudioElement or WebAudio (loop songs from wav.loop.startMs); or synthesize the PSG with WebAudio from the JSON (see audio/AUDIO_SPEC.md).',
  ],
  msx2: [
    'SCREEN 4 keeps the same 32x24 tile layout and sprite mode 2: each sprite line can have its own colour, so multi-layer MSX1 sprites can become single sprites with per-line colours.',
    'The 512-colour palette (16 at a time) allows recolouring: keep palette indices, tweak RGB values.',
    'Up to 8 sprites per scanline instead of 4.',
    'SCREEN 5 (bitmap, 16 colours per pixel) removes the 2-colours-per-8-pixels limit: redraw tiles freely at the same size.',
    'Gameplay data (screens, entities, rules, music) can be reused unchanged.',
    'Mideas Play mode physics are already the Z80 8.8 fixed-point formulas, so they port 1:1.',
  ],
};

export const ART_STYLE_RULES = [
  'Logical resolution is 256x192 and every coordinate in this sketch is in logical (x1) pixels, even when graphics are provided at a higher scale.',
  'If you redraw or enhance graphics, keep each image at exactly N times its original size and keep the silhouette, the hitbox, the pivot (top-left) and the number of animation frames.',
  'Transparent pixels in sprites are alpha = 0 in the PNGs.',
  'graphics/x1 are the exact original pixels. graphics/xN were upscaled automatically (see sketch.graphics.scaleMethod); they are a starting point, not final art.',
  'Each sprite/tile has an auto-generated "description" field plus its name: use them as prompts if you generate higher-resolution art.',
];
