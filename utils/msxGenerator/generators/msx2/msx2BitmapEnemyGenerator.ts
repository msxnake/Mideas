import {
  MSX2_ENEMY_MOVEMENT_PATROL_CHASE_X,
  MSX2_ENEMY_MOVEMENT_WALKER_GRAVITY,
  MSX2_ENEMY_MOVEMENT_SLIME_CEILING,
} from './msx2EntityRuntimeGenerator';

/**
 * SCREEN 5 bitmap-room ENEMY runtime — patrol MVP.
 *
 * Port of the SCREEN 4 enemy/hazard slot system (msx2Screen4Generator
 * update_msx2_enemy_position_slot_N, PATROL mode only for now): each placed
 * `kind: 'enemy' | 'hazard'` entity with movement mode patrolX/patrolY becomes
 * one hardware sprite that bounces between minX/maxX (or minY/maxY) at 1px per
 * frame, exactly like the SCREEN 4 patrol handler. Enemies animate through
 * their sprite asset's frames and mirror horizontally when patrolling left
 * (variant order in VRAM: [facing-right, facing-left] per frame). While an
 * NPC dialogue is open the whole enemy engine pauses (movement + animation);
 * the SAT writer keeps running so the sprites stay visible, frozen.
 *
 * VRAM layout (sprite mode 2):
 *   SAT slots     [foreground][player layers][ENEMIES][bullets][terminator]
 *   colour table  current 16-byte line-colour block per enemy SAT slot
 *   patterns      maxFrames*2 32-byte groups per enemy slot, uploaded per room
 *                 by bitmap_load_enemies from the unique-sprite pattern table
 *
 * RAM (chained after the dialogue system, below the #C1F0 ceiling):
 *   bitmap_enemy_count   1 byte  active slots in the current room
 *   bitmap_enemy_pool    21 bytes/slot: x, y, dx, dy, minX, maxX, minY, maxY,
 *                        animTick, animFrame, frameCount, animDelay, colorOff,
 *                        mode, visualXOff, visualYOff, damage, hitX, hitY,
 *                        hitW, hitH, speed, updateLane
 *                        (+3 when a SlimeCeiling enemy exists anywhere:
 *                        travelPx, travelCount, phase -> 26 bytes/slot)
 *
 * ROM (resident, like the foreground tables):
 *   bitmap_room_enemy_table_N   count + maxSlots*(22 bytes, or 23 with slime)
 *                               x,y,dx,dy,minX,maxX,minY,maxY,
 *                               patGroupOff,colorOff,frameCount,animDelay,
 *                               mode,visualXOff,visualYOff,damage,hitX,hitY,
 *                               hitW,hitH,speed,updateLane (+travelPx on slime builds)
 *   bitmap_room_enemy_ptr_table DW per room
 *   bitmap_enemy_sprite_patterns  frames*2 variants x 32 bytes per unique sprite
 *                                 (frames*4 on slime builds: vertical-flip pair)
 *   bitmap_enemy_sprite_colors    frameCount x 16 bytes per unique sprite layer
 *                                 (x2 on slime builds: flipped tables appended)
 */

export const BITMAP_MAX_ENEMY_SLOTS = 4;
export const BITMAP_MAX_ENEMY_FRAMES = 4;
export const BITMAP_ENEMY_POOL_STRIDE = 23;  // RAM bytes per slot (base build)
/** Slime builds append travelPx/travelCount/phase to every pool slot. */
export const BITMAP_ENEMY_POOL_STRIDE_SLIME = 26;

/** RAM pool stride actually used by the generated runtime for this project. */
export function bitmapEnemyPoolStride(data: BitmapEnemyRoomData | undefined): number {
  return data?.slimeEnabled ? BITMAP_ENEMY_POOL_STRIDE_SLIME : BITMAP_ENEMY_POOL_STRIDE;
}

/** Sprite pattern variants emitted per animation frame ([right,left] or
 *  [right,left,ceilRight,ceilLeft] when a SlimeCeiling enemy exists). */
export function bitmapEnemyVariantsPerFrame(data: BitmapEnemyRoomData | undefined): number {
  return data?.slimeEnabled ? 4 : 2;
}
/** Same off-screen non-terminator Y the foreground empty slots use. */
const ENEMY_EMPTY_SPRITE_Y = 0xD4;

function asmByte(value: number): string {
  const byte = Math.max(0, Math.min(255, Math.floor(Number(value) || 0)));
  return `#${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}

function asmWord(value: number): string {
  const word = Math.max(0, Math.min(0xFFFF, Math.floor(Number(value) || 0)));
  return `#${word.toString(16).toUpperCase().padStart(4, '0')}`;
}

export interface BitmapEnemyRoomData {
  /** Max enemy slots used by any room (0 disables the whole system). */
  maxSlots: number;
  /** Max animation frames across the unique enemy sprites (>= 1). */
  maxFrames: number;
  /** Per-room table bytes: [count] + maxSlots * table stride (22, or 23 with slime). */
  roomTables: number[][];
  /** frames * variants x 32 bytes per unique enemy sprite ([right, left] per frame,
   *  plus [ceilRight, ceilLeft] vertical flips when slimeEnabled). */
  patternBytes: number[];
  /** frameCount x 16 bytes per unique enemy sprite layer (line colour tables);
   *  with slimeEnabled each layer also carries frameCount FLIPPED tables after
   *  the normal ones (line order reversed for the ceiling pose). */
  colorBytes: number[];
  /** True when any room places a SlimeCeiling (mode 11) enemy: widens the RAM
   *  pool/ROM table strides and doubles the per-frame sprite variants. */
  slimeEnabled: boolean;
}

export interface BitmapEnemyRuntimeOptions {
  ramBase: number;
  /** First enemy SAT entry (after foreground + player layers). */
  satBase: number;
  /** First enemy 16-byte colour block (mirrors satBase slot order). */
  colorBase: number;
  /** First V9938 sprite pattern group reserved for enemy slots. */
  patternGroupBase: number;
  /** HUD band offset added to logical Y before the SAT write. */
  gameYOffset: number;
  /** Player body hitbox in local player coordinates. */
  playerHitbox: { x: number; y: number; w: number; h: number };
  /** I-frame count to arm after a DamageOnTouch hit. */
  damageInvulnFrames: number;
  /** Player max health byte (matches the deadly system). Used to reset health on
   *  respawn when enemy contact drains the last heart. Required for lives support. */
  maxHealth?: number;
  /** Player starting lives byte (matches the deadly system). When provided,
   *  enemy contact that drops health to 0 decrements player_lives and, at 0
   *  lives, arms bitmap_game_over_flag so the Game Flow exits — consistent with
   *  the deadly-tile damage path. */
  lives?: number;
  /** Whether enemy damage should respawn the player (reset health + reposition to
   *  spawn) when health hits 0, mirroring the deadly system. Defaults to false
   *  (legacy behaviour: health saturates at 0, no respawn). */
  respawnOnDeath?: boolean;
  /** Early-return gate prepended to bitmap_update_enemies (e.g. the NPC
   * dialogue pause). Empty when no pausing system exists in this ROM. */
  pauseGateAsm?: string;
}

export interface BitmapEnemySystemAsm {
  enabled: boolean;
  ramBytes: number;
  equates: string;
  /** `call bitmap_load_enemies` — after load_room at init and on room commit. */
  loadCallAsm: string;
  /** `call bitmap_update_enemies` — before bitmap_update_sprite_sat. */
  updateCallAsm: string;
  /** `call bitmap_update_enemy_sat` — right after bitmap_update_sprite_sat and
   * BEFORE the bullet SAT writer (each writer overwrites the previous
   * terminator and appends its own). */
  satCallAsm: string;
  routinesAsm: string;
  dataAsm: string;
}

export function bitmapEnemySystemEnabled(data: BitmapEnemyRoomData | undefined): boolean {
  return Boolean(data && data.maxSlots > 0);
}

export function buildBitmapEnemySystemAsm(
  data: BitmapEnemyRoomData,
  opts: BitmapEnemyRuntimeOptions,
): BitmapEnemySystemAsm {
  if (!bitmapEnemySystemEnabled(data)) {
    return { enabled: false, ramBytes: 0, equates: '', loadCallAsm: '', updateCallAsm: '', satCallAsm: '', routinesAsm: '', dataAsm: '' };
  }
  const maxSlots = data.maxSlots;
  const maxFrames = Math.max(1, data.maxFrames);
  const slime = Boolean(data.slimeEnabled);
  const POOL_STRIDE = bitmapEnemyPoolStride(data);
  const TABLE_STRIDE = slime ? 23 : 22; // ROM bytes per slot
  const variantsPerFrame = bitmapEnemyVariantsPerFrame(data);
  const groupsPerSlot = maxFrames * variantsPerFrame;
  const ramBytes = 2 + maxSlots * POOL_STRIDE;
  const countAddr = opts.ramBase;
  const poolAddr = opts.ramBase + 1;
  const updateLaneAddr = poolAddr + maxSlots * POOL_STRIDE;

  const equates = `; --- ENEMY runtime state (${ramBytes} bytes): count + ${maxSlots} slot(s) x ${POOL_STRIDE} + update lane
; (x,y,dx,dy,minX,maxX,minY,maxY,animTick,animFrame,frameCount,animDelay,colorOff,mode,xOff,yOff,damage,hitX,hitY,hitW,hitH,speed,updateLane${slime ? ',travelPx,travelCount,phase' : ''}) ---
bitmap_enemy_count EQU ${asmWord(countAddr)}
bitmap_enemy_pool  EQU ${asmWord(poolAddr)}
bitmap_enemy_update_lane EQU ${asmWord(updateLaneAddr)}
`;

  // ---- bitmap_load_enemies: per-room table -> RAM pool + VRAM uploads ----
  const loadSlotBlocks = Array.from({ length: maxSlots }, (_unused, i) => {
    const patternGroup = opts.patternGroupBase + i * groupsPerSlot;
    const patternVram = 0xF800 + patternGroup * 32;
    const colorVram = opts.colorBase + i * 16;
    const poolBase = `bitmap_enemy_pool + ${i * POOL_STRIDE}`;
    return `.benemy_slot_${i}:
    ld a, (bitmap_enemy_count)
    cp ${i + 1}
    jp c, .benemy_slot_${i}_done      ; slot unused in this room
    push ix
    pop hl
    ld de, ${poolBase}
    ld bc, 8
    ldir                      ; movement bytes (x..maxY)
    ld a, (ix+11)             ; animDelay
    ld (${poolBase} + 8), a   ; animTick = delay
    ld (${poolBase} + 11), a  ; animDelay
    xor a
    ld (${poolBase} + 9), a   ; animFrame = 0
    ld a, (ix+10)             ; frameCount
    ld (${poolBase} + 10), a
    ld a, (ix+9)              ; colorOff base, in 16-byte blocks
    ld (${poolBase} + 12), a
    ld a, (ix+12)             ; movement mode
    ld (${poolBase} + 13), a
    ld a, (ix+13)             ; visual X offset from logical enemy origin
    ld (${poolBase} + 14), a
    ld a, (ix+14)             ; visual Y offset from logical enemy origin
    ld (${poolBase} + 15), a
    ld a, (ix+15)             ; DamageOnTouch damage (0 = harmless)
    ld (${poolBase} + 16), a
    ld a, (ix+16)             ; damage hitbox X offset from logical origin
    ld (${poolBase} + 17), a
    ld a, (ix+17)             ; damage hitbox Y offset from logical origin
    ld (${poolBase} + 18), a
    ld a, (ix+18)             ; damage hitbox width
    ld (${poolBase} + 19), a
    ld a, (ix+19)             ; damage hitbox height
    ld (${poolBase} + 20), a
    ld a, (ix+20)             ; authored movement speed in px/update
    ld (${poolBase} + 21), a
    ld a, (ix+21)             ; logical enemy update lane (0 or 1)
    ld (${poolBase} + 22), a
${slime ? `    ld a, (ix+22)             ; slime hop distance in px (0 on non-slime slots)
    ld (${poolBase} + 23), a
    xor a
    ld (${poolBase} + 24), a  ; travelCount = 0
    ld (${poolBase} + 25), a  ; phase = ground crawl
` : ''}    ; --- upload frameCount*${variantsPerFrame} pattern groups -> VRAM ${asmWord(patternVram)} (group ${patternGroup}+) ---
    ld a, (ix+8)
    call bitmap_enemy_patterns_offset
    ld a, (ix+10)             ; frameCount
    add a, a                  ; *2 variants${slime ? `
    add a, a                  ; *4 variants (ceiling flips)` : ''}
    push hl
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                ; *32 bytes/group
    ld b, h
    ld c, l
    pop hl
    ld de, ${asmWord(patternVram)}
    call copy_to_vram_ext
    ; --- upload 16-byte colour table -> VRAM ${asmWord(colorVram)} (slot ${i}) ---
    ld a, (ix+9)
    call bitmap_enemy_colors_offset
    ld de, ${asmWord(colorVram)}
    ld bc, 16
    call copy_to_vram_ext
.benemy_slot_${i}_done:
    ld de, ${TABLE_STRIDE}
    add ix, de`;
  }).join('\n');

  const playerHitbox = opts.playerHitbox;
  const playerLeft = Math.max(0, Math.min(31, Math.floor(playerHitbox.x) || 0));
  const playerTop = Math.max(0, Math.min(31, Math.floor(playerHitbox.y) || 0));
  const playerRight = Math.max(playerLeft + 1, Math.min(64, playerLeft + (Math.floor(playerHitbox.w) || 16)));
  const playerBottom = Math.max(playerTop + 1, Math.min(64, playerTop + (Math.floor(playerHitbox.h) || 16)));
  const enemyInvulnFrames = asmByte(opts.damageInvulnFrames || 60);
  // Lives/respawn support (optional). When respawnOnDeath is true, enemy contact
  // that drains the last heart mirrors the deadly system: -1 life, respawn to
  // spawn, and at 0 lives arm bitmap_game_over_flag so the Game Flow exits.
  const respawnOnDeath = opts.respawnOnDeath === true;
  const maxHealthByte = asmByte(opts.maxHealth ?? 5);
  void opts.lives; // lives are seeded by the deadly system init; the touch handler only decrements.

  // ---- bitmap_update_enemies: alternating logical-enemy movement lanes ----
  // Check-then-move like the SCREEN 4 slot handler: at the bound the enemy
  // turns without moving, so positions can never overshoot minX/maxX.
  const updateAsm = `
; ------------------------------------------------------------
; FUNCTION: bitmap_update_enemies
; ------------------------------------------------------------
; PURPOSE: Ticks animation for every active slot, but moves only one logical
;   enemy lane per video frame. Lanes 0/1 alternate, so authored speed N means
;   N pixels every two frames (N/2 pixels per video frame on average). Every
;   hardware layer belonging to one logical enemy shares the same lane.
;   Paused entirely (movement + animation) while a pause gate holds, e.g.
;   an open NPC dialogue; the SAT writer keeps drawing the frozen sprites.
; INPUT: bitmap_enemy_count, bitmap_enemy_pool, bitmap_enemy_update_lane.
; OUTPUT: pool x/y/dx/dy/anim state updated in RAM.
; DESTROYS: AF, DE, IX. PRESERVES: BC, HL, IY.
; ------------------------------------------------------------
bitmap_update_enemies:
${opts.pauseGateAsm || ''}    ld a, (bitmap_enemy_count)
    or a
    ret z
    push bc
    ld a, (bitmap_enemy_update_lane)
    xor 1
    and 1
    ld (bitmap_enemy_update_lane), a
    ld a, (bitmap_enemy_count)
    ld b, a
    ld ix, bitmap_enemy_pool
.enemy_step_loop:
    ld a, (ix+13)             ; #FF = killed by a thrown object
    cp #FF
    jp z, .enemy_step_next
    ld a, (bitmap_enemy_update_lane)
    cp (ix+22)                ; other lane: animate, but defer movement
    jp nz, .enemy_anim
    ld a, (ix+13)             ; movement mode
    cp ${MSX2_ENEMY_MOVEMENT_PATROL_CHASE_X}
    jp z, .enemy_step_patrol_chase_x
    cp ${MSX2_ENEMY_MOVEMENT_WALKER_GRAVITY}
    jp z, .enemy_step_walker_gravity
${slime ? `    cp ${MSX2_ENEMY_MOVEMENT_SLIME_CEILING}
    jp z, .enemy_step_slime
` : ''}    ; --- X axis ---
.enemy_step_patrol:
    ld a, (ix+2)              ; dx
    or a
    jp z, .enemy_step_y
    ld d, (ix+21)             ; authored pixels per alternating update
.enemy_step_x_px:
    ld a, (ix+2)
    bit 7, a
    jp nz, .enemy_step_left
    ld a, (ix+0)
    cp (ix+5)                 ; x vs maxX
    jp nc, .enemy_turn_left
    inc (ix+0)
    dec d
    jp nz, .enemy_step_x_px
    jp .enemy_step_y
.enemy_turn_left:
    ld (ix+2), #FF
    jp .enemy_step_y
.enemy_step_left:
    ld a, (ix+0)
    cp (ix+4)                 ; x vs minX
    jp z, .enemy_turn_right
    jp c, .enemy_turn_right
    dec (ix+0)
    dec d
    jp nz, .enemy_step_x_px
    jp .enemy_step_y
.enemy_turn_right:
    ld (ix+2), #01
.enemy_step_y:
    ; --- Y axis ---
    ld a, (ix+3)              ; dy
    or a
    jp z, .enemy_anim
    ld d, (ix+21)
.enemy_step_y_px:
    ld a, (ix+3)
    bit 7, a
    jp nz, .enemy_step_up
    ld a, (ix+1)
    cp (ix+7)                 ; y vs maxY
    jp nc, .enemy_turn_up
    inc (ix+1)
    dec d
    jp nz, .enemy_step_y_px
    jp .enemy_anim
.enemy_turn_up:
    ld (ix+3), #FF
    jp .enemy_anim
.enemy_step_up:
    ld a, (ix+1)
    cp (ix+6)                 ; y vs minY
    jp z, .enemy_turn_down
    jp c, .enemy_turn_down
    dec (ix+1)
    dec d
    jp nz, .enemy_step_y_px
    jp .enemy_anim
.enemy_turn_down:
    ld (ix+3), #01
    jp .enemy_anim
.enemy_step_patrol_chase_x:
    ; Detects player only inside this slot's patrol span. Outside that active
    ; zone it behaves like normal patrol; inside it uses authored speed.
    ld a, (player_x)
    cp (ix+4)                 ; player_x < minX -> patrol
    jp c, .enemy_step_patrol
    ld c, a                   ; C = player_x
    ld a, (ix+5)              ; maxX
    cp c
    jp c, .enemy_step_patrol  ; maxX < player_x -> patrol
    ld a, c
    cp (ix+0)                 ; player_x vs enemy_x
    jp z, .enemy_anim
    jp c, .enemy_chase_left
.enemy_chase_right:
    ld (ix+2), #01
    ld d, (ix+21)
.enemy_chase_right_px:
    ld a, (ix+0)
    cp (ix+5)
    jp nc, .enemy_anim
    cp c
    jp nc, .enemy_anim
    inc (ix+0)
    dec d
    jp nz, .enemy_chase_right_px
    jp .enemy_anim
.enemy_chase_left:
    ld (ix+2), #FF
    ld d, (ix+21)
.enemy_chase_left_px:
    ld a, (ix+0)
    cp (ix+4)
    jp z, .enemy_anim
    jp c, .enemy_anim
    cp c
    jp c, .enemy_anim
    dec (ix+0)
    dec d
    jp nz, .enemy_chase_left_px
    jp .enemy_anim
.enemy_step_walker_gravity:
    ; Logical origin = SAT x/y minus the visual cell offset. This keeps multi-cell
    ; hardware sprites moving as one physics body.
    ; Gravity probes every traversed pixel at the authored speed.
    ld d, (ix+21)
.walker_fall_px:
    ld a, (ix+1)
    ld e, (ix+15)
    sub e                      ; A = logical top Y
    cp 176
    jp nc, .walker_on_ground
    push bc                    ; preserve enemy loop counter in B
    push de                    ; preserve remaining speed pixels in D
    add a, 16                  ; probe one pixel row under 16px body
    ld c, a
    ld a, (ix+0)
    ld e, (ix+14)
    sub e
    add a, 8                   ; probe bottom centre
    ld b, a
    call bitmap_probe_solid
    or a
    pop de
    pop bc
    jp nz, .walker_on_ground
    inc (ix+1)
    dec d
    jp nz, .walker_fall_px
    jp .enemy_anim
.walker_on_ground:
    ld d, (ix+21)
    ld a, (ix+2)
    or a
    jp z, .walker_set_right
    bit 7, a
    jp nz, .walker_left
.walker_right:
    ; Wall probe at logical x+16, y+8. Solid or max bound -> reverse.
    ld a, (ix+0)
    cp (ix+5)
    jp nc, .walker_turn_left
    push bc                    ; preserve enemy loop counter in B
    push de
    ld e, (ix+14)
    sub e
    add a, 16
    ld b, a
    ld a, (ix+1)
    ld e, (ix+15)
    sub e
    add a, 8
    ld c, a
    call bitmap_probe_solid
    or a
    pop de
    pop bc
    jp nz, .walker_turn_left
    inc (ix+0)
    dec d
    jp nz, .walker_right
    jp .enemy_anim
.walker_turn_left:
    ld (ix+2), #FF
    jp .enemy_anim
.walker_set_right:
    ld (ix+2), #01
    jp .walker_right
.walker_left:
    ; Wall probe at logical x-1, y+8. Solid or min bound -> reverse.
    ld a, (ix+0)
    cp (ix+4)
    jp z, .walker_turn_right
    jp c, .walker_turn_right
    push bc                    ; preserve enemy loop counter in B
    push de
    ld e, (ix+14)
    sub e
    dec a
    ld b, a
    ld a, (ix+1)
    ld e, (ix+15)
    sub e
    add a, 8
    ld c, a
    call bitmap_probe_solid
    or a
    pop de
    pop bc
    jp nz, .walker_turn_right
    dec (ix+0)
    dec d
    jp nz, .walker_left
    jp .enemy_anim
.walker_turn_right:
    ld (ix+2), #01
${slime ? `    jp .enemy_anim
.enemy_step_slime:
    ; SlimeCeiling: crawls its authored travel distance along the floor, then
    ; sticks (Metroid-style gravity flip look), crawls the same distance upside
    ; down, then drops back to the floor and repeats. Pool extras:
    ;   +21 speed, +22 updateLane, +23 travelPx, +24 travelCount, +25 phase
    ;   phase: 0 = floor crawl, 1 = rising, 2 = ceiling crawl, 3 = falling
    ;   All phases use the authored speed and probe every traversed pixel.
    ; Logical origin = SAT x/y minus the visual cell offset, like the walker.
    ld a, (ix+25)
    or a
    jp z, .slime_ground
    cp 1
    jp z, .slime_rise
    cp 2
    jp z, .slime_ceiling
    jp .slime_fall
.slime_ground:
    ; Floor gone under the body (bottom-centre probe)? Then fall first.
    ld a, (ix+1)
    ld e, (ix+15)
    sub e                      ; A = logical top Y
    cp 176
    jp nc, .slime_ground_crawl ; resting on the room's bottom line
    push bc                    ; preserve enemy loop counter in B
    add a, 16                  ; probe one pixel row under the 16px body
    ld c, a
    call .slime_probe_body_width
    or a
    pop bc
    jp z, .slime_start_fall
.slime_ground_crawl:
    push bc                    ; B is the outer enemy counter; C is caller-owned
    ld b, (ix+21)              ; apply authored speed pixel-by-pixel
.slime_ground_speed_loop:
    call .slime_crawl_step
    jp c, .slime_ground_speed_done ; turned at a wall/bound: stop this frame
    inc (ix+24)
    ld a, (ix+24)
    cp (ix+23)
    jp nc, .slime_ground_travel_done
    dec b
    jp nz, .slime_ground_speed_loop
.slime_ground_speed_done:
    pop bc
    jp .enemy_anim
.slime_ground_travel_done:
    xor a
    ld (ix+24), a
    ld (ix+25), 1              ; hop: start rising to the ceiling
    pop bc
    jp .enemy_anim
.slime_start_fall:
    xor a
    ld (ix+24), a
    ld (ix+25), 3
    jp .enemy_anim
.slime_rise:
    ld d, (ix+21)              ; authored px/update, probing every pixel
.slime_rise_px:
    ld a, (ix+1)
    ld e, (ix+15)
    sub e                      ; A = logical top Y
    or a
    jp z, .slime_attach        ; reached the top edge: stick there
    dec a                      ; probe the pixel row above the head
    push bc
    push de
    ld c, a
    call .slime_probe_body_width
    or a
    pop de
    pop bc
    jp nz, .slime_attach
    dec (ix+1)
    dec d
    jp nz, .slime_rise_px
    jp .enemy_anim
.slime_attach:
    xor a
    ld (ix+24), a
    ld (ix+25), 2              ; stuck to the ceiling
    jp .enemy_anim
.slime_ceiling:
    ; Ceiling still there (head-row probe)? A destroyed tile drops the slime.
    ld a, (ix+1)
    ld e, (ix+15)
    sub e
    or a
    jp z, .slime_ceiling_crawl ; glued to the top edge of the room
    dec a
    push bc
    ld c, a
    call .slime_probe_body_width
    or a
    pop bc
    jp z, .slime_start_fall
.slime_ceiling_crawl:
    push bc                    ; preserve outer counter and caller-owned C
    ld b, (ix+21)
.slime_ceiling_speed_loop:
    call .slime_crawl_step
    jp c, .slime_ceiling_speed_done
    inc (ix+24)
    ld a, (ix+24)
    cp (ix+23)
    jp nc, .slime_ceiling_travel_done
    dec b
    jp nz, .slime_ceiling_speed_loop
.slime_ceiling_speed_done:
    pop bc
    jp .enemy_anim
.slime_ceiling_travel_done:
    xor a
    ld (ix+24), a
    ld (ix+25), 3              ; detach: drop back to the floor
    pop bc
    jp .enemy_anim
.slime_fall:
    ld d, (ix+21)              ; authored px/update, probing every pixel
.slime_fall_px:
    ld a, (ix+1)
    ld e, (ix+15)
    sub e
    cp 176
    jp nc, .slime_land         ; bottom line of the play area
    add a, 16
    push bc
    push de
    ld c, a
    call .slime_probe_body_width
    or a
    pop de
    pop bc
    jp nz, .slime_land
    inc (ix+1)
    dec d
    jp nz, .slime_fall_px
    jp .enemy_anim
.slime_land:
    xor a
    ld (ix+24), a
    ld (ix+25), a              ; phase = floor crawl
    jp .enemy_anim
.slime_probe_body_width:
    ; ------------------------------------------------------------
    ; PURPOSE: Probe one vertical collision row across the full 16px body.
    ; INPUT: C = logical probe Y, IX = current slime slot.
    ; OUTPUT: A = first solid cell or right-edge cell; Z when both edges pass.
    ; DESTROYS: AF, DE, HL. PRESERVES: BC, IX, IY.
    ; CALLS: bitmap_probe_solid.
    ; NOTES: Samples logical X and X+15, so landing/attachment reflects the
    ; complete sprite width instead of treating the slime as a centre point.
    ; ------------------------------------------------------------
    push bc
    ld a, (ix+0)
    ld e, (ix+14)
    sub e                      ; logical left edge X
    ld b, a
    call bitmap_probe_solid
    or a
    jp nz, .slime_probe_body_width_done
    ld a, (ix+0)
    ld e, (ix+14)
    sub e
    add a, 15                 ; logical right edge X (16px body)
    ld b, a
    call bitmap_probe_solid
    or a
.slime_probe_body_width_done:
    pop bc
    ret
.slime_crawl_step:
    ; Shared floor/ceiling crawl: 1px towards dx with wall/bound turns, exactly
    ; the walker rules. Returns NC when the slime advanced 1px, C when it only
    ; turned (blocked). Preserves B (loop counter) around the probes.
    ld a, (ix+2)
    or a
    jp z, .slime_set_right
    bit 7, a
    jp nz, .slime_left
.slime_right:
    ld a, (ix+0)
    cp (ix+5)                  ; x vs maxX
    jp nc, .slime_turn_left
    push bc
    ld e, (ix+14)
    sub e
    add a, 16                  ; wall probe ahead at logical x+16
    ld b, a
    ld a, (ix+1)
    ld e, (ix+15)
    sub e
    add a, 8                   ; body-middle row works on floor and ceiling
    ld c, a
    call bitmap_probe_solid
    or a
    pop bc
    jp nz, .slime_turn_left
    inc (ix+0)
    or a                       ; NC = advanced (A is 0 from the empty probe)
    ret
.slime_turn_left:
    ld (ix+2), #FF
    scf
    ret
.slime_set_right:
    ld (ix+2), #01
    jp .slime_right
.slime_left:
    ld a, (ix+0)
    cp (ix+4)                  ; x vs minX
    jp z, .slime_turn_right
    jp c, .slime_turn_right
    push bc
    ld e, (ix+14)
    sub e
    dec a                      ; wall probe at logical x-1
    ld b, a
    ld a, (ix+1)
    ld e, (ix+15)
    sub e
    add a, 8
    ld c, a
    call bitmap_probe_solid
    or a
    pop bc
    jp nz, .slime_turn_right
    dec (ix+0)
    or a                       ; NC = advanced
    ret
.slime_turn_right:
    ld (ix+2), #01
    scf
    ret
` : ''}.enemy_anim:
    ; --- frame animation: every animDelay frames, frame = (frame+1) % frameCount ---
    ld a, (ix+10)             ; frameCount
    cp 2
    jp c, .enemy_step_next    ; 0/1 frames = static
    dec (ix+8)                ; animTick
    jp nz, .enemy_step_next
    ld a, (ix+11)             ; animDelay
    ld (ix+8), a
    ld a, (ix+9)              ; animFrame
    inc a
    cp (ix+10)
    jp c, .enemy_anim_store
    xor a
.enemy_anim_store:
    ld (ix+9), a
.enemy_step_next:
    ld de, ${POOL_STRIDE}
    add ix, de
    dec b                     ; loop body exceeds djnz's -128 range
    jp nz, .enemy_step_loop
    pop bc
    ret
`;

  const touchDamageAsm = `
; ------------------------------------------------------------
; FUNCTION: bitmap_check_enemy_touch
; ------------------------------------------------------------
; PURPOSE:
;   Apply DamageOnTouch for active bitmap-room enemy slots. Each damaging
;   enemy compares its configured damage hitbox against the Player Config body
;   hitbox, subtracts its damage from player_health, and arms player_invuln.
;
; INPUT:
;   RAM state: bitmap_enemy_count, bitmap_enemy_pool, player_x, player_y,
;              player_health, player_invuln.
;
; OUTPUT:
;   player_health and player_invuln updated on the first active overlap.
;
; DESTROYS:
;   AF, BC, DE, IX
;
; PRESERVES:
;   HL, IY
;
; CALLS:
;   None
;
; SIDE EFFECTS:
;   Reads enemy slot contact bytes at +16..+20. Damage byte 0 disables contact.
;   Does not respawn or decrement lives; it only applies contact damage + i-frames.
; ------------------------------------------------------------
bitmap_check_enemy_touch:
${opts.pauseGateAsm || ''}    ld a, (bitmap_enemy_count)
    or a
    ret z
    ld a, (player_invuln)
    or a
    ret nz                     ; already blinking -> immune this frame
    ld a, (bitmap_enemy_count)
    ld b, a
    ld ix, bitmap_enemy_pool
.enemy_touch_loop:
    ld a, (ix+13)             ; #FF = killed by a thrown object
    cp #FF
    jp z, .enemy_touch_next
    ld a, (ix+16)              ; damage
    or a
    jp z, .enemy_touch_next

    ; X overlap: enemyRight > playerLeft && playerRight > enemyLeft.
    ld a, (ix+0)
    sub (ix+14)                ; logical enemy X = visual X - visualXOff
    add a, (ix+17)             ; + damage hitbox X
    ld d, a                    ; D = enemyLeft
    ld e, a
    ld a, (ix+19)              ; hitW
    add a, e
    ld e, a                    ; E = enemyRight exclusive
    ld a, (player_x)
${playerLeft ? `    add a, ${playerLeft}\n` : ''}    ld c, a                    ; C = playerLeft
    ld a, e
    cp c
    jp z, .enemy_touch_next
    jp c, .enemy_touch_next
    ld a, (player_x)
${playerRight ? `    add a, ${playerRight}\n` : ''}    cp d                       ; playerRight <= enemyLeft -> separated
    jp z, .enemy_touch_next
    jp c, .enemy_touch_next

    ; Y overlap: enemyBottom > playerTop && playerBottom > enemyTop.
    ld a, (ix+1)
    sub (ix+15)                ; logical enemy Y = visual Y - visualYOff
    add a, (ix+18)             ; + damage hitbox Y
    ld d, a                    ; D = enemyTop
    ld e, a
    ld a, (ix+20)              ; hitH
    add a, e
    ld e, a                    ; E = enemyBottom exclusive
    ld a, (player_y)
${playerTop ? `    add a, ${playerTop}\n` : ''}    ld c, a                    ; C = playerTop
    ld a, e
    cp c
    jp z, .enemy_touch_next
    jp c, .enemy_touch_next
    ld a, (player_y)
${playerBottom ? `    add a, ${playerBottom}\n` : ''}    cp d                       ; playerBottom <= enemyTop -> separated
    jp z, .enemy_touch_next
    jp c, .enemy_touch_next

    ; Apply contact damage, saturating at zero to avoid byte underflow.
    ld a, (player_health)
    ld e, (ix+16)
    sub e
    jp z, .enemy_touch_zero
    jp c, .enemy_touch_zero
    ld (player_health), a
    jp .enemy_touch_arm_iframes
.enemy_touch_zero:
    xor a
    ld (player_health), a
${respawnOnDeath ? `
    ; Last heart drained by enemy contact: spend a life, like the deadly system.
    ld hl, player_lives
    dec (hl)
    ld a, (hl)
    or a
    jr z, .enemy_touch_game_over     ; lives 0 -> request Game Flow exit
    jp .enemy_touch_respawn
.enemy_touch_game_over:
    ld a, 1
    ld (bitmap_game_over_flag), a
.enemy_touch_respawn:
    ; Full respawn: reset health, arm blink, zero velocity, reposition to spawn.
    ld a, ${maxHealthByte}
    ld (player_health), a
    xor a
    ld (player_vy), a
    ld (player_vy_frac), a
    ld (player_vx), a
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_spawn_x_table
    add hl, de
    ld a, (hl)
    ld (player_x), a
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_spawn_y_table
    add hl, de
    ld a, (hl)
    ld (player_y), a
` : ''}.enemy_touch_arm_iframes:
    ld a, ${enemyInvulnFrames}
    ld (player_invuln), a
    ret
.enemy_touch_next:
    ld de, ${POOL_STRIDE}
    add ix, de
    dec b
    jp nz, .enemy_touch_loop
    ret
`;

  // ---- bitmap_update_enemy_sat: fixed slots after the player layers ----
  // Pattern byte = slot base group *4 + animFrame*8 (2 variants/frame) + 4
  // when patrolling left (variant 1 = mirrored/facing-left).
  const satSlotBlocks = Array.from({ length: maxSlots }, (_unused, i) => {
    const patternByteBase = ((opts.patternGroupBase + i * groupsPerSlot) * 4) & 0xff;
    const poolBase = `bitmap_enemy_pool + ${i * POOL_STRIDE}`;
    return `.sat_slot_${i}:
    ld a, (bitmap_enemy_count)
    cp ${i + 1}
    jp c, .sat_slot_${i}_hidden
    ld a, (${poolBase} + 13)  ; killed enemy stays in the pool but is invisible
    cp #FF
    jp z, .sat_slot_${i}_hidden
    ld a, (${poolBase} + 1)
    add a, ${opts.gameYOffset}
    out (VDP_DATA_PORT), a    ; Y
    ld a, (${poolBase})
    out (VDP_DATA_PORT), a    ; X
    ld a, (${poolBase} + 9)   ; animFrame
    add a, a
    add a, a
    add a, a                  ; frame * 8 (2 variants x 4 pattern numbers)
${slime ? `    add a, a                  ; frame * 16 (4 variants x 4 pattern numbers)
` : ''}    ld e, a
    ld a, (${poolBase} + 2)   ; dx: bit7 set = moving left = mirrored variant
    and #80
    jp z, .sat_slot_${i}_right
    ld a, 4
    jp .sat_slot_${i}_pat
.sat_slot_${i}_right:
    xor a
.sat_slot_${i}_pat:
${slime ? `    ld d, a
    ld a, (${poolBase} + 25)  ; slime phase 1/2 (rising/ceiling) = flipped pose
    dec a
    cp 2
    ld a, d
    jp nc, .sat_slot_${i}_noflip
    add a, 8                  ; +2 pattern groups: the vertical-flip pair
.sat_slot_${i}_noflip:
` : ''}    add a, e
    add a, ${asmByte(patternByteBase)}
    out (VDP_DATA_PORT), a    ; pattern
    xor a
    out (VDP_DATA_PORT), a    ; EC = 0
    jp .sat_slot_${i}_end
.sat_slot_${i}_hidden:
    ld a, ${asmByte(ENEMY_EMPTY_SPRITE_Y)}
    out (VDP_DATA_PORT), a    ; off-screen, non-terminator
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
.sat_slot_${i}_end:`;
  }).join('\n');

  const colorUploadSlotBlocks = Array.from({ length: maxSlots }, (_unused, i) => {
    const colorVram = opts.colorBase + i * 16;
    const poolBase = `bitmap_enemy_pool + ${i * POOL_STRIDE}`;
    return `.color_slot_${i}:
    ld a, (bitmap_enemy_count)
    cp ${i + 1}
    jp c, .color_slot_${i}_done
    ld a, (${poolBase} + 12)  ; colorOff base, in 16-byte blocks
    ld e, a
    ld a, (${poolBase} + 9)   ; animFrame
    add a, e
${slime ? `    ld e, a
    ld a, (${poolBase} + 25)  ; slime phase 1/2 = flipped line-colour table
    dec a
    cp 2
    jp nc, .color_slot_${i}_noflip
    ld a, (${poolBase} + 10)  ; flipped tables sit frameCount blocks later
    add a, e
    ld e, a
.color_slot_${i}_noflip:
    ld a, e
` : ''}    call bitmap_enemy_colors_offset
    ld de, ${asmWord(colorVram)}
    ld bc, 16
    call copy_to_vram_ext
.color_slot_${i}_done:`;
  }).join('\n');

  const routinesAsm = `
; ------------------------------------------------------------
; FUNCTION: bitmap_load_enemies
; ------------------------------------------------------------
; PURPOSE: Loads the enemy slots of the ACTIVE room: copies the per-room ROM
;   table into the mutable RAM pool, seeds the per-slot animation state and
;   uploads each used slot's sprite pattern/colour tables to its reserved
;   VRAM groups. Called after load_room at init and on every room-transition
;   commit (same sites as the foreground sprite loader).
; INPUT: current_screen_index.
; OUTPUT: bitmap_enemy_count/pool + VRAM pattern groups ${opts.patternGroupBase}..${opts.patternGroupBase + maxSlots * groupsPerSlot - 1}.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY (IX saved/restored).
; CALLS: copy_to_vram_ext, bitmap_enemy_patterns_offset, bitmap_enemy_colors_offset.
; ------------------------------------------------------------
bitmap_load_enemies:
    push ix
    ld hl, bitmap_room_enemy_ptr_table
    ld a, (current_screen_index)
    add a, a
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld a, (hl)                ; count byte
    ld (bitmap_enemy_count), a
    ld a, #FF                 ; first gameplay frame selects update lane 0
    ld (bitmap_enemy_update_lane), a
    inc hl
    push hl
    pop ix                    ; IX -> slot 0 (${TABLE_STRIDE} bytes/slot)
${loadSlotBlocks}
    pop ix
    ret

; HL = bitmap_enemy_sprite_patterns + A*32 (A = pattern group offset).
bitmap_enemy_patterns_offset:
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                ; *32
    ld de, bitmap_enemy_sprite_patterns
    add hl, de
    ret

; HL = bitmap_enemy_sprite_colors + A*16 (A = color block offset).
bitmap_enemy_colors_offset:
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                ; *16
    ld de, bitmap_enemy_sprite_colors
    add hl, de
    ret
${updateAsm}
${touchDamageAsm}
; ------------------------------------------------------------
; FUNCTION: bitmap_update_enemy_sat
; ------------------------------------------------------------
; PURPOSE: Writes the ${maxSlots} fixed enemy SAT slot(s) at VRAM ${asmWord(opts.satBase)}
;   (right after the player layers, overwriting the player writer's
;   terminator), then appends a #D8 terminator. Unused slots get an
;   off-screen Y=${asmByte(ENEMY_EMPTY_SPRITE_Y)} sprite so the VDP keeps scanning. When the shoot
;   skill is active its bullet writer runs AFTER this and overwrites our
;   terminator in turn. Also refreshes each active slot's line-colour table for
;   its current animation frame before opening the SAT write stream.
; INPUT: bitmap_enemy_count, bitmap_enemy_pool.
; OUTPUT: SAT entries at VRAM ${asmWord(opts.satBase)}..${asmWord(opts.satBase + maxSlots * 4 + 3)}.
; DESTROYS: AF, DE. PRESERVES: BC, HL, IX, IY.
; ------------------------------------------------------------
bitmap_update_enemy_sat:
    push bc
    push hl
${colorUploadSlotBlocks}
    ld de, ${asmWord(opts.satBase)}
    push de
    ld a, d
    and #C0
    rlca
    rlca
    ld e, a
    ld a, #0E
    call vdp_write_register
    pop de
    ld a, e
    out (VDP_CTRL_PORT), a
    ld a, d
    and #3F
    or #40
    out (VDP_CTRL_PORT), a
${satSlotBlocks}
    ld a, #D8
    out (VDP_DATA_PORT), a    ; terminator
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    xor a
    ld e, a
    ld a, #0E
    call vdp_write_register
    pop hl
    pop bc
    ret
`;

  const emitBytes = (label: string, bytes: number[], comment: string): string => {
    const lines: string[] = [`; ${comment}`, `${label}:`];
    for (let i = 0; i < bytes.length; i += 16) {
      lines.push(`    DB ${bytes.slice(i, i + 16).map(b => asmByte(b & 0xff)).join(',')}`);
    }
    return lines.join('\n') + '\n';
  };
  const dataAsm = data.roomTables.map((table, index) =>
    emitBytes(`bitmap_room_enemy_table_${index}`, table, `Room ${index} enemies: count + ${maxSlots} slot(s) x ${TABLE_STRIDE} (x,y,dx,dy,minX,maxX,minY,maxY,patOff,colOff,frames,delay,mode,xOff,yOff,damage,hitX,hitY,hitW,hitH,speed,updateLane${slime ? ',travelPx' : ''})`)
  ).join('')
    + `bitmap_room_enemy_ptr_table:\n${data.roomTables.map((_t, index) => `    DW bitmap_room_enemy_table_${index}`).join('\n')}\n`
    + emitBytes('bitmap_enemy_sprite_patterns', data.patternBytes, `Enemy sprites: ${data.patternBytes.length / 32} pattern group(s), ${slime ? '[right, left, ceilRight, ceilLeft] variants' : '[right, left] variant pair'} per frame (mode 2 quadrants)`)
    + emitBytes('bitmap_enemy_sprite_colors', data.colorBytes, `Enemy sprites: 16-byte line colour tables per unique sprite layer frame${slime ? ' (normal tables then vertical flips)' : ''}`);

  return {
    enabled: true,
    ramBytes,
    equates,
    loadCallAsm: '    call bitmap_load_enemies\n',
    updateCallAsm: '    call bitmap_update_enemies\n    call bitmap_check_enemy_touch\n',
    satCallAsm: '    call bitmap_update_enemy_sat\n',
    routinesAsm,
    dataAsm,
  };
}
