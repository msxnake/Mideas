import {
  MSX2_ENEMY_MOVEMENT_PATROL_CHASE_X,
  MSX2_ENEMY_MOVEMENT_WALKER_GRAVITY,
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
 *                        hitW, hitH
 *
 * ROM (resident, like the foreground tables):
 *   bitmap_room_enemy_table_N   1 + maxSlots*20 bytes: count + per-slot
 *                               x,y,dx,dy,minX,maxX,minY,maxY,
 *                               patGroupOff,colorOff,frameCount,animDelay,
 *                               mode,visualXOff,visualYOff,damage,hitX,hitY,
 *                               hitW,hitH
 *   bitmap_room_enemy_ptr_table DW per room
 *   bitmap_enemy_sprite_patterns  frames*2 variants x 32 bytes per unique sprite
 *   bitmap_enemy_sprite_colors    frameCount x 16 bytes per unique sprite layer
 */

export const BITMAP_MAX_ENEMY_SLOTS = 4;
export const BITMAP_MAX_ENEMY_FRAMES = 4;
export const BITMAP_ENEMY_POOL_STRIDE = 21;  // RAM bytes per slot
const POOL_STRIDE = BITMAP_ENEMY_POOL_STRIDE;
const TABLE_STRIDE = 20; // ROM bytes per slot
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
  /** Per-room table bytes: [count] + maxSlots * TABLE_STRIDE. */
  roomTables: number[][];
  /** frames*2 variants x 32 bytes per unique enemy sprite ([right, left] per frame). */
  patternBytes: number[];
  /** frameCount x 16 bytes per unique enemy sprite layer (line colour tables). */
  colorBytes: number[];
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
  const groupsPerSlot = maxFrames * 2; // [right, left] variant pair per frame
  const ramBytes = 1 + maxSlots * POOL_STRIDE;
  const countAddr = opts.ramBase;
  const poolAddr = opts.ramBase + 1;

  const equates = `; --- ENEMY runtime state (${ramBytes} bytes): count + ${maxSlots} slot(s) x ${POOL_STRIDE}
; (x,y,dx,dy,minX,maxX,minY,maxY,animTick,animFrame,frameCount,animDelay,colorOff,mode,xOff,yOff,damage,hitX,hitY,hitW,hitH) ---
bitmap_enemy_count EQU ${asmWord(countAddr)}
bitmap_enemy_pool  EQU ${asmWord(poolAddr)}
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
    ; --- upload frameCount*2 pattern groups -> VRAM ${asmWord(patternVram)} (group ${patternGroup}+) ---
    ld a, (ix+8)
    call bitmap_enemy_patterns_offset
    ld a, (ix+10)             ; frameCount
    add a, a                  ; *2 variants
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

  // ---- bitmap_update_enemies: SCREEN 4 patrol port (1 px/frame, bounce) ----
  // Check-then-move like the SCREEN 4 slot handler: at the bound the enemy
  // turns without moving, so positions can never overshoot minX/maxX.
  const updateAsm = `
; ------------------------------------------------------------
; FUNCTION: bitmap_update_enemies
; ------------------------------------------------------------
; PURPOSE: Steps every active enemy slot with the SCREEN 4 PATROL rules:
;   dx != 0 -> move 1px horizontally, turning at minX/maxX;
;   dy != 0 -> move 1px vertically, turning at minY/maxY;
;   then ticks the slot's frame animation (animDelay frames per step).
;   Paused entirely (movement + animation) while a pause gate holds, e.g.
;   an open NPC dialogue; the SAT writer keeps drawing the frozen sprites.
; INPUT: bitmap_enemy_count, bitmap_enemy_pool.
; OUTPUT: pool x/y/dx/dy/anim state updated in RAM.
; DESTROYS: AF, B, DE, IX. PRESERVES: C, HL, IY.
; ------------------------------------------------------------
bitmap_update_enemies:
${opts.pauseGateAsm || ''}    ld a, (bitmap_enemy_count)
    or a
    ret z
    ld b, a
    ld ix, bitmap_enemy_pool
.enemy_step_loop:
    ld a, (ix+13)             ; #FF = killed by a thrown object
    cp #FF
    jp z, .enemy_step_next
    ld a, (ix+13)             ; movement mode
    cp ${MSX2_ENEMY_MOVEMENT_PATROL_CHASE_X}
    jp z, .enemy_step_patrol_chase_x
    cp ${MSX2_ENEMY_MOVEMENT_WALKER_GRAVITY}
    jp z, .enemy_step_walker_gravity
    ; --- X axis ---
.enemy_step_patrol:
    ld a, (ix+2)              ; dx
    or a
    jp z, .enemy_step_y
    bit 7, a
    jp nz, .enemy_step_left
    ld a, (ix+0)
    cp (ix+5)                 ; x vs maxX
    jp nc, .enemy_turn_left
    inc (ix+0)
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
    jp .enemy_step_y
.enemy_turn_right:
    ld (ix+2), #01
.enemy_step_y:
    ; --- Y axis ---
    ld a, (ix+3)              ; dy
    or a
    jp z, .enemy_anim
    bit 7, a
    jp nz, .enemy_step_up
    ld a, (ix+1)
    cp (ix+7)                 ; y vs maxY
    jp nc, .enemy_turn_up
    inc (ix+1)
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
    jp .enemy_anim
.enemy_turn_down:
    ld (ix+3), #01
    jp .enemy_anim
.enemy_step_patrol_chase_x:
    ; Detects player only inside this slot's patrol span. Outside that active
    ; zone it behaves like normal patrol; inside it runs horizontally at 2px/frame.
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
    ld a, (ix+0)
    cp (ix+5)
    jp nc, .enemy_anim
    cp c
    jp nc, .enemy_anim
    inc (ix+0)
    ld a, (ix+0)
    cp (ix+5)
    jp nc, .enemy_anim
    cp c
    jp nc, .enemy_anim
    inc (ix+0)
    jp .enemy_anim
.enemy_chase_left:
    ld (ix+2), #FF
    ld a, (ix+0)
    cp (ix+4)
    jp z, .enemy_anim
    jp c, .enemy_anim
    cp c
    jp c, .enemy_anim
    dec (ix+0)
    ld a, (ix+0)
    cp (ix+4)
    jp z, .enemy_anim
    jp c, .enemy_anim
    cp c
    jp z, .enemy_anim
    jp c, .enemy_anim
    dec (ix+0)
    jp .enemy_anim
.enemy_step_walker_gravity:
    ; Logical origin = SAT x/y minus the visual cell offset. This keeps multi-cell
    ; hardware sprites moving as one physics body.
    ; Gravity: if there is no solid tile below the body, fall 1px and skip walking.
    ld a, (ix+1)
    ld e, (ix+15)
    sub e                      ; A = logical top Y
    cp 176
    jp nc, .walker_on_ground
    push bc                    ; preserve enemy loop counter in B
    add a, 16                  ; probe one pixel row under 16px body
    ld c, a
    ld a, (ix+0)
    ld e, (ix+14)
    sub e
    add a, 8                   ; probe bottom centre
    ld b, a
    call bitmap_probe_solid
    or a
    pop bc
    jp nz, .walker_on_ground
    inc (ix+1)
    jp .enemy_anim
.walker_on_ground:
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
    pop bc
    jp nz, .walker_turn_left
    inc (ix+0)
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
    pop bc
    jp nz, .walker_turn_right
    dec (ix+0)
    jp .enemy_anim
.walker_turn_right:
    ld (ix+2), #01
.enemy_anim:
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
    ld e, a
    ld a, (${poolBase} + 2)   ; dx: bit7 set = moving left = mirrored variant
    and #80
    jp z, .sat_slot_${i}_right
    ld a, 4
    jp .sat_slot_${i}_pat
.sat_slot_${i}_right:
    xor a
.sat_slot_${i}_pat:
    add a, e
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
    call bitmap_enemy_colors_offset
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
    emitBytes(`bitmap_room_enemy_table_${index}`, table, `Room ${index} enemies: count + ${maxSlots} slot(s) x ${TABLE_STRIDE} (x,y,dx,dy,minX,maxX,minY,maxY,patOff,colOff,frames,delay,mode,xOff,yOff,damage,hitX,hitY,hitW,hitH)`)
  ).join('')
    + `bitmap_room_enemy_ptr_table:\n${data.roomTables.map((_t, index) => `    DW bitmap_room_enemy_table_${index}`).join('\n')}\n`
    + emitBytes('bitmap_enemy_sprite_patterns', data.patternBytes, `Enemy sprites: ${data.patternBytes.length / 32} pattern group(s), [right, left] variant pair per frame (mode 2 quadrants)`)
    + emitBytes('bitmap_enemy_sprite_colors', data.colorBytes, 'Enemy sprites: 16-byte line colour tables per unique sprite layer frame');

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
