/**
 * SCREEN 5 bitmap-room "Soldado perseguidor" (Boina Verde): appearance at the entry door of an alert room.
 *
 * WHAT THIS PHASE DOES (and nothing else)
 *   A room with `runtime.alertZone.enabled` starts with no enemy in sight. `spawnDelaySec` seconds after the player enters,
 *   the soldier appears exactly where the player came in, unless the player is still closer than `guardPx` pixels to that
 *   spot (then it keeps waiting, one frame at a time, until the player has stepped away: no spawn-kill).
 *
 * HOW THE SOLDIER GETS INTO THE ROOM
 *   The soldier is a normal scripted enemy of the existing enemy system (mode 14, a `rules` program, as many pool slots as
 *   its sprite has cells x colour layers: two for a 16x32 body). `planBitmapPursuer` PREPENDS a synthetic copy of it to the
 *   entities of every alert room, so it becomes slots 0..N-1 of the pool and the enemy generator allocates its sprite art,
 *   colours and program exactly as for any other enemy. Only one thing differs: its movement-mode bytes in the room table are
 *   written as #FF ("dead and invisible"), which the update loop, the contact-damage pass and the SAT writer already skip.
 *   The init hook also parks the hidden body at y = #E0, below the visible room, because the pressure-plate overlap test and
 *   ENEMY_AHEAD do not filter #FF.
 *   To make it appear, the runtime writes x/y of every soldier slot and the real modes (14 for the leader, 15 for the
 *   followers) in the SAME frame. The next `bitmap_update_enemies` finds a complete body.
 *
 * WHERE THE CODE LIVES
 *   The resident window (#4000-#BFFF) is the scarce resource of this backend. The runtime is therefore a CODE BANK of its own,
 *   mapped in P2 (#8000-#9FFF) only while it runs; the resident window only holds two trampolines and three call sites:
 *
 *     resident  bitmap_pursuer_init   called when a room is entered, once the enemies are loaded AND the player is placed
 *               bitmap_pursuer_tick   called once per game frame, right before bitmap_update_enemies
 *     bank @#8000  bitmap_pursuerb_init / bitmap_pursuerb_tick + the per-room alert table
 *
 *   RULES OF THE BANK CODE (checked by scripts/check_msx2_pursuer_bank.mjs): it only reads or writes RAM (>= #C000) and its
 *   own bank; it never calls anything (so nothing can move P2 under its feet: music_update, the loaders and the boss runtime all
 *   do); its data (the alert table) lives in the same bank. On return P2/P3 are the resident banks, exactly as every other
 *   bank-mapping routine leaves them (bitmap_room_restore_resident_banks).
 *
 * ORDER OF THE HOOKS
 *   The init hook reads the entry point from player_x / player_y, so it has to run once the player is FINAL, and it has to
 *   leave the enemies of the room (already loaded) the way it wants them.
 *   - commit_room_flip (room change): the player is placed BEFORE the enemies are loaded, but several later hooks still move the
 *     player: bitmap_shaft_after_commit (the last entry of the loader list) rewrites player_y to put the player back on the
 *     lift cabin. The init hook is therefore the LAST call of that list, after shaftSystem.commitCallAsm; right after
 *     enemySystem.loadCallAsm, a player who enters an alert room riding a lift would give the soldier the edge Y (2 or 158)
 *     instead of the cabin's. The check scripts/check_msx2_pursuer_contract.mjs keeps it last (it must be the last call before
 *     bitmap_room_restore_resident_banks in commit_room_flip).
 *   - boot init / WorldLink: the enemies are loaded BEFORE the player is placed, so the init hook goes after "Place the
 *     player". Both paths are needed: a hook in only one leaves the start room (or every other room) without a soldier.
 *
 * ROM IDENTITY
 *   No room with `alertZone.enabled`: nothing is built, no bank, no hook, no EQU, no table change. The generator's own
 *   regression harness (scripts/check_generator_output_identical.mjs --rom) proves it.
 */

import type { Msx2Screen5BitmapRoom } from '../../../../types';
import type { ProjectAnalysis } from '../../../asmTemplateGenerator';
import {
  getMsx2RoomAlertZone,
  msx2AlertSpawnDelayFrames,
  resolveMsx2PursuerProject,
  MSX2_PURSUER_BODY_HEIGHT,
  MSX2_PURSUER_TERRAIN_BODY,
  type Msx2PursuerSoldier,
} from '../../../msx2Pursuer';
import { MSX2_ENEMY_MOVEMENT_LAYER_FOLLOWER } from './msx2EntityRuntimeGenerator';
import { MSX2_ENEMY_MOVEMENT_SCRIPTED } from './msx2EnemyBehaviorRuntime';
import { BITMAP_MAX_ENEMY_SLOTS, bitmapEnemyPoolStride, type BitmapEnemyRoomData } from './msx2BitmapEnemyGenerator';

/** `entity.params[...]` flag that marks the synthesized soldier; the room-table builder writes its mode bytes as #FF. */
export const BITMAP_PURSUER_SOLDIER_PARAM = 'pursuerSoldier';
/** Label prefix of the routines that live in the bank. The resident trampolines are `bitmap_pursuer_*`. */
export const BITMAP_PURSUER_BANK_PREFIX = 'bitmap_pursuerb';
/** Resident RAM: state, countdown (word), guard, entry x, entry y. */
export const BITMAP_PURSUER_RAM_BYTES = 6;
/** Bytes per room in the alert table: delay frames (word, 0 = no alert in this room), guard px, spare. */
const ALERT_RECORD_BYTES = 4;
/** One Konami bank. */
const BANK_BYTES = 0x2000;
/** Banks whose low 6 bits are all set would expose the SCC in the P2 window: never used for code or data. */
const SCC_WINDOW_MASK = 0x3f;
const isSccWindowBank = (bank: number): boolean => (bank & SCC_WINDOW_MASK) === SCC_WINDOW_MASK;

// Layout of one enemy pool slot (see msx2BitmapEnemyGenerator.ts, bitmap_load_enemies): the same numbers the interpreter
// hard-codes everywhere (ix+0, ix+1, ix+13, ix+14, ix+15).
const POOL_X = 0;
const POOL_Y = 1;
const POOL_MODE = 13;
const POOL_X_OFF = 14;
const POOL_Y_OFF = 15;
/** Movement mode of a slot that is "dead and invisible" for every enemy pass. */
const MODE_HIDDEN = 0xff;
/**
 * Y of a hidden soldier slot. Not every enemy pass skips mode #FF: bitmap_pressure_any_enemy_overlaps (a pressure plate that
 * enemies press) and the ENEMY_AHEAD probe do not, and a body parked at the loader's (0,0) would press a plate under the top-left
 * corner of the room. #E0 (224) is below the 192 visible lines, so none of those 16x16 boxes can meet a plate or an enemy there.
 * The appearance rewrites x and y of every slot, so nothing depends on this value afterwards.
 */
const HIDDEN_PARK_Y = 0xe0;

const hex = (value: number, digits = 2): string => `#${(value & ((1 << (digits * 4)) - 1)).toString(16).toUpperCase().padStart(digits, '0')}`;

/** Contract header required by ai/ASM_GUIDELINES.md for every generated routine (same layout as the other bank generators). */
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

export interface BitmapPursuerRoomAlert {
  roomName: string;
  /** Countdown in game frames. */
  delayFrames: number;
  guardPx: number;
}

export interface BitmapPursuerPlan {
  enabled: boolean;
  /** The room list the ENEMY builder must read: alert rooms carry the soldier as entity 0. Same array when disabled. */
  rooms: Msx2Screen5BitmapRoom[];
  soldier?: Msx2PursuerSoldier;
  /** One entry per global room index; null = the room has no alert. */
  alerts: Array<BitmapPursuerRoomAlert | null>;
  alertRoomCount: number;
}

/** True when the entity is a placement of the pursuer's `msx2enemy` asset. */
function placesEnemyAsset(entity: any, soldier: Msx2PursuerSoldier): boolean {
  const id = String(entity?.params?.enemyAssetId || entity?.enemyAssetId || '').trim();
  return id !== '' && (id === soldier.enemyAssetId || id === soldier.name);
}

/** The soldier as the enemy system sees any other enemy: a scripted body 16x32 that starts anywhere (it is hidden). */
function buildSoldierEntity(soldier: Msx2PursuerSoldier, room: Msx2Screen5BitmapRoom): any {
  return {
    id: `msx2_pursuer_soldier_${room.id}`,
    name: soldier.name,
    kind: 'enemy',
    position: { x: 0, y: 0 },
    spriteAssetId: soldier.spriteAssetId,
    components: {
      msx2_transform: { tileX: 0, tileY: 0, pixelX: 0, pixelY: 0, spawnX: 0, spawnY: 0 },
      msx2_hardware_sprite: { msx2SpriteAssetId: soldier.spriteAssetId, frame: 0, paletteSlot: 10, visible: true },
      // Bounds are the whole room width: the soldier appears wherever the player came in, including the edge columns. maxY is the origin
      // whose terrain body (top 3 + height 29, see MSX2_PURSUER_TERRAIN_BODY) still ends on the last row of the room: 160.
      msx2_movement: { mode: 'scripted', direction: 1, speed: 1, minX: 0, maxX: 240, minY: 0, maxY: 192 - (MSX2_PURSUER_TERRAIN_BODY.top + MSX2_PURSUER_TERRAIN_BODY.height), boundsUnit: 'px' },
      // The soldier thinks every frame whatever the asset says (the room generator enforces it for the synthesized soldier).
      msx2_ai: { behaviorAssetId: soldier.behaviorAssetId, logicUpdateIntervalFrames: 1 },
      msx2_collision: { hitboxW: 16, hitboxH: MSX2_PURSUER_BODY_HEIGHT, offsetX: 0, offsetY: 0, solid: false, damage: 1 },
    },
    params: {
      runtime: 'MSX2',
      engine: 'staticEnemy',
      movement: 'scripted',
      enemyAssetId: soldier.enemyAssetId,
      ...(soldier.renderRoleId ? { enemyRenderRoleId: soldier.renderRoleId } : {}),
      behaviorAssetId: soldier.behaviorAssetId,
      [BITMAP_PURSUER_SOLDIER_PARAM]: true,
    },
  };
}

/**
 * Reads the alert zones of the (global, flat) room list and, when any is enabled, returns the room list the enemy builder has
 * to use. Throws a user-facing Error for every configuration that cannot work; nothing is built for a project without alerts.
 */
export function planBitmapPursuer(analysis: ProjectAnalysis, rooms: Msx2Screen5BitmapRoom[]): BitmapPursuerPlan {
  const alerts: Array<BitmapPursuerRoomAlert | null> = rooms.map(room => {
    const zone = getMsx2RoomAlertZone(room);
    return zone.enabled
      ? { roomName: String(room.name || room.id), delayFrames: msx2AlertSpawnDelayFrames(zone), guardPx: zone.guardPx }
      : null;
  });
  const alertRoomCount = alerts.filter(Boolean).length;
  if (alertRoomCount === 0) return { enabled: false, rooms, alerts, alertRoomCount: 0 };

  const names = rooms.filter((_room, index) => alerts[index]).map(room => `"${room.name || room.id}"`).join(', ');
  const resolution = resolveMsx2PursuerProject((analysis.assets || []) as any);
  if (resolution.candidateCount === 0) {
    throw new Error(`Alert zone enabled in ${names}, but no enemy is the pursuer soldier: mark exactly one msx2enemy asset with pursuer.enabled.`);
  }
  if (resolution.errors.length || !resolution.soldier) {
    throw new Error(`Pursuer soldier: ${resolution.errors.join(' ')}`);
  }
  const soldier = resolution.soldier;

  rooms.forEach((room, index) => {
    if (!alerts[index]) return;
    const entities: any[] = Array.isArray(room.entities) ? room.entities : [];
    if (entities.some(entity => entity?.kind === 'boss')) {
      // A room that mixes a boss with regular enemies makes the bitmap backend drop the hardware-sprite bullets of EVERY boss of
      // the project (bossRoomsHaveEnemies), and the soldier's SAT slots are the ones the boss bullets would borrow.
      throw new Error(`Alert zone in "${room.name || room.id}": the room has a boss. The soldier is an enemy, and a room that mixes a boss with enemies disables the sprite bullets of every boss in the project. Remove the boss or the alert zone.`);
    }
    if (entities.some(entity => placesEnemyAsset(entity, soldier))) {
      throw new Error(`Alert zone in "${room.name || room.id}": the soldier "${soldier.name}" is also placed by hand in this room. The alert zone puts it there by itself; remove the placed copy.`);
    }
  });

  const alertRooms = rooms.map((room, index) => (alerts[index]
    ? { ...room, entities: [buildSoldierEntity(soldier, room), ...(Array.isArray(room.entities) ? room.entities : [])] }
    : room));
  return { enabled: true, rooms: alertRooms, soldier, alerts, alertRoomCount };
}

export interface BitmapPursuerSystem {
  enabled: boolean;
  /** RAM claimed in the hud-linked chain. */
  ramBytes: number;
  /** RAM EQUs (goes with the other systems' equates). */
  equates: string;
  /** `call bitmap_pursuer_init`: after the enemies are loaded and the player is FINAL (the last hook of commit_room_flip, see the header). */
  initCallAsm: string;
  /** `call bitmap_pursuer_tick`: once per game frame, before bitmap_update_enemies. */
  tickCallAsm: string;
  /** Pool slots taken by the soldier (always slots 0..N-1 of an alert room). */
  soldierSlots: number;
  /** Bytes between two pool slots. */
  poolStride: number;
  alerts: Array<BitmapPursuerRoomAlert | null>;
  /** Copied into the resident tick: same gate as the enemy update (a conversation freezes the countdown). */
  pauseGateAsm: string;
}

export const EMPTY_BITMAP_PURSUER_SYSTEM: Readonly<BitmapPursuerSystem> = Object.freeze({
  enabled: false,
  ramBytes: 0,
  equates: '',
  initCallAsm: '',
  tickCallAsm: '',
  soldierSlots: 0,
  poolStride: 0,
  alerts: [] as Array<BitmapPursuerRoomAlert | null>,
  pauseGateAsm: '',
});

/**
 * Checks the enemy tables that were built from `plan.rooms` and lays out the RAM / call sites.
 *
 * The room allocator reserves every soldier layer and the room's other enemies,
 * then checks the complete SAT chain against the hardware ceiling. Retain the
 * dropped-slot check for callers supplying legacy/incomplete enemy tables.
 */
export function buildBitmapPursuerSystem(
  plan: BitmapPursuerPlan,
  enemyData: BitmapEnemyRoomData,
  options: { ramBase: number; pauseGateAsm?: string },
): BitmapPursuerSystem {
  if (!plan.enabled) return EMPTY_BITMAP_PURSUER_SYSTEM;
  const perRoom = enemyData.pursuerRooms || [];
  let soldierSlots = 0;
  plan.alerts.forEach((alert, index) => {
    if (!alert) return;
    const info = perRoom[index];
    if (!info || info.soldierSlots < 1) {
      throw new Error(`Alert zone in "${alert.roomName}": the soldier did not reach the enemy table of the room (internal error).`);
    }
    if (info.slotsDropped > 0) {
      throw new Error(`Alert zone in "${alert.roomName}": the enemy table contains only ${info.soldierSlots} soldier layer(s) and omits ${info.slotsDropped} required hardware sprite layer(s). All soldier and enemy layers must fit together with the player and bullets in the ${BITMAP_MAX_ENEMY_SLOTS} hardware slots.`);
    }
    if (soldierSlots !== 0 && soldierSlots !== info.soldierSlots) {
      throw new Error(`Alert zone in "${alert.roomName}": the soldier takes ${info.soldierSlots} slot(s) here but ${soldierSlots} in another room (internal error).`);
    }
    soldierSlots = info.soldierSlots;
  });
  const base = options.ramBase;
  const address = (offset: number) => `#${(base + offset).toString(16).toUpperCase().padStart(4, '0')}`;
  const equates = `; --- PURSUER soldier runtime state (${BITMAP_PURSUER_RAM_BYTES} bytes): state (1 = counting down / waiting to appear), countdown frames (word), guard px, entry x, entry y ---
bitmap_pursuer_state   EQU ${address(0)}
bitmap_pursuer_timer   EQU ${address(1)}
bitmap_pursuer_guard   EQU ${address(3)}
bitmap_pursuer_entry_x EQU ${address(4)}
bitmap_pursuer_entry_y EQU ${address(5)}
`;
  return {
    enabled: true,
    ramBytes: BITMAP_PURSUER_RAM_BYTES,
    equates,
    initCallAsm: '    call bitmap_pursuer_init\n',
    tickCallAsm: '    call bitmap_pursuer_tick\n',
    soldierSlots,
    poolStride: bitmapEnemyPoolStride(enemyData),
    alerts: plan.alerts,
    pauseGateAsm: options.pauseGateAsm || '',
  };
}

export interface BitmapPursuerBankBuild {
  /** `BITMAP_PURSUER_CODE_BANK EQU n`; empty when the soldier is not used. */
  equatesAsm: string;
  /** The two resident trampolines (goes at INTRO_RESIDENT_MARKER, below #8000). */
  residentAsm: string;
  /** The bank itself, appended after the last data / FX / engine bank. */
  banksAsm: string;
  /** Last bank used (== firstBank - 1 when the build is empty). */
  lastBank: number;
  /** For the IDE bank map. */
  banks: Array<{ bank: number; kind: 'code' }>;
  blockNames: string[];
}

export const EMPTY_BITMAP_PURSUER_BANK_BUILD: Readonly<BitmapPursuerBankBuild> = Object.freeze({
  equatesAsm: '',
  residentAsm: '',
  banksAsm: '',
  lastBank: 0,
  banks: [] as BitmapPursuerBankBuild['banks'],
  blockNames: [] as string[],
});

/**
 * Emits the code bank and the resident trampolines. Call it AFTER every other bank has been numbered.
 * MegaROM only: the whole point is a bank; a linear 32 KB ROM has none, so an alert zone there is an error, not a silent no-op.
 */
export function buildBitmapPursuerBank(
  system: BitmapPursuerSystem,
  options: { firstBank: number; megaRom: boolean; maxBank: number },
): BitmapPursuerBankBuild {
  if (!system.enabled) return EMPTY_BITMAP_PURSUER_BANK_BUILD;
  if (!options.megaRom) {
    throw new Error('Alert zones need a Konami MegaROM export: the pursuer soldier runtime lives in its own ROM bank. Export with a MegaROM.');
  }
  let codeBank = options.firstBank;
  const padding: string[] = [];
  for (let expected = options.firstBank; isSccWindowBank(expected); expected++) {
    padding.push(`; Bank ${expected} reserved: (bank & #3F) == #3F would expose the SCC in the P2 window.\n    ds #2000, #FF`);
    codeBank = expected + 1;
  }
  if (codeBank > options.maxBank) throw new Error('No ROM bank left for the pursuer soldier runtime.');

  const P = BITMAP_PURSUER_BANK_PREFIX;
  const stride = system.poolStride;
  const slotBase = (slot: number): string => `bitmap_enemy_pool + ${slot * stride}`;
  const slots = Array.from({ length: system.soldierSlots }, (_unused, i) => i);

  // The two geometry EQUs are read by the OpenMSX probe (test/msx2-pursuer/pursuer_spawn_probe.tcl) so it never hard-codes the pool layout.
  const equates = `; ---- Pursuer soldier runtime bank ----
BITMAP_PURSUER_CODE_BANK  EQU ${codeBank}
BITMAP_PURSUER_POOL_STRIDE EQU ${stride}   ; bytes between two enemy pool slots
BITMAP_PURSUER_SLOTS      EQU ${system.soldierSlots}   ; pool slots 0..N-1 of an alert room are the soldier
`;

  const resident = `
; ---- Pursuer soldier: resident trampolines (the runtime lives in bank ${codeBank}, mapped at #8000) ----
${routineHeader('bitmap_pursuer_init', 'Room-entry hook of the pursuer soldier. Maps the runtime bank at #8000, runs the init there and puts the\nresident banks back before returning.', {
    input: 'The room is loaded: current_screen_index, the enemy pool and the player position are final.',
    destroys: 'AF, BC, DE, HL.',
    preserves: 'IX, IY.',
    calls: `mapper_set_bank_p2, ${P}_init (banked), bitmap_room_restore_resident_banks.`,
    side: 'Arms or disarms the appearance countdown (bitmap_pursuer_*). On return P2 = 2, P3 = 3.',
    notes: 'Lives below #8000 on purpose: it maps the bank that would otherwise hide its own next instruction. The caller may sit\nin #8000-#BFFF in a big project: the final jp restores P2 before the ret pops the caller address.',
  })}bitmap_pursuer_init:
    ld a, BITMAP_PURSUER_CODE_BANK
    call mapper_set_bank_p2
    call ${P}_init
    jp bitmap_room_restore_resident_banks
${routineHeader('bitmap_pursuer_tick', 'Per-frame hook of the pursuer soldier. Does nothing (no bank switch) unless this room is counting down.', {
    input: 'bitmap_pursuer_state.',
    destroys: 'AF, BC, DE, HL.',
    preserves: 'IX, IY.',
    calls: `mapper_set_bank_p2, ${P}_tick (banked), bitmap_room_restore_resident_banks.`,
    side: 'May write the soldier slots of the enemy pool (appearance). On return P2 = 2, P3 = 3.',
    notes: `Called right before bitmap_update_enemies, so the appearance and the first update of the body happen in the same frame.${system.pauseGateAsm ? '\nThe pause gate is the enemy one: an open conversation freezes the countdown too.' : ''}`,
  })}bitmap_pursuer_tick:
    ld a, (bitmap_pursuer_state)
    or a
    ret z                      ; dormant: no alert here, or the soldier is already out
${system.pauseGateAsm}    ld a, BITMAP_PURSUER_CODE_BANK
    call mapper_set_bank_p2
    call ${P}_tick
    jp bitmap_room_restore_resident_banks
bitmap_pursuer_resident_end:
    if bitmap_pursuer_resident_end > #8000
    ds -1   ; the pursuer trampolines cross #8000: they would unmap themselves. Free resident space below #8000.
    endif
`;

  const hideAsm = slots.map(slot => `    ld (${slotBase(slot)} + ${POOL_MODE}), a`).join('\n');
  const parkAsm = slots.map(slot => `    ld (${slotBase(slot)} + ${POOL_Y}), a`).join('\n');
  const writeSlotAsm = slots.map(slot => {
    const mode = slot === 0 ? MSX2_ENEMY_MOVEMENT_SCRIPTED : MSX2_ENEMY_MOVEMENT_LAYER_FOLLOWER;
    return `    ; slot ${slot}: ${slot === 0 ? 'the leader (decides)' : 'a follower (copies the leader)'}
    ld a, (${slotBase(slot)} + ${POOL_X_OFF})   ; visual X offset from the body origin
    add a, b
    ld (${slotBase(slot)} + ${POOL_X}), a
    ld a, (${slotBase(slot)} + ${POOL_Y_OFF})   ; visual Y offset from the body origin
    add a, c
    ld (${slotBase(slot)} + ${POOL_Y}), a
    ld a, ${mode}
    ld (${slotBase(slot)} + ${POOL_MODE}), a`;
  }).join('\n');

  const alertTable = system.alerts.map(alert => (alert
    ? `    DW ${alert.delayFrames}\n    DB ${alert.guardPx}, 0     ; ${alert.roomName}`
    : '    DW 0\n    DB 0, 0'))
    .join('\n');

  const bank = `${routineHeader(`${P}_init`, 'Arms the appearance countdown of the room that was just entered, or disarms it when the room has no alert.', {
    input: 'current_screen_index; the soldier slots are loaded (movement mode #FF) and the player is placed.',
    output: 'bitmap_pursuer_state = 1 with the timer, guard and entry point set in an alert room, 0 elsewhere.',
    destroys: 'AF, BC, DE, HL.',
    preserves: 'IX, IY.',
    side: `Writes bitmap_pursuer_*; writes movement mode ${hex(MODE_HIDDEN)} and y = ${hex(HIDDEN_PARK_Y)} into the ${system.soldierSlots} soldier slot(s) of an alert room (the mode is idempotent: the loader already did).`,
    notes: `RAM and own-bank reads only. The entry point is the player position AFTER placement: the spot the soldier will come out of.\nThe hidden body is parked at y = ${hex(HIDDEN_PARK_Y)}: the enemy passes that do not skip mode ${hex(MODE_HIDDEN)} (pressure plates, ENEMY_AHEAD) must not meet a body at (0,0).`,
  })}${P}_begin:
${P}_init:
    xor a
    ld (bitmap_pursuer_state), a            ; dormant until proven otherwise
    ld a, (current_screen_index)
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl                              ; * ${ALERT_RECORD_BYTES} bytes per room
    ld de, ${P}_alert_table
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)                              ; DE = countdown frames, 0 = no alert in this room
    inc hl
    ld a, d
    or e
    ret z
    ld a, (hl)
    ld (bitmap_pursuer_guard), a
    inc de                                  ; the entry frame itself already ticked once: delay + 1 = exactly 'delay' hidden frames after it
    ld (bitmap_pursuer_timer), de
    ld a, ${hex(MODE_HIDDEN)}
${hideAsm}
    ld a, ${hex(HIDDEN_PARK_Y)}                              ; parked below the room (see HIDDEN_PARK_Y in the generator)
${parkAsm}
    ld a, (player_x)
    ld (bitmap_pursuer_entry_x), a
    ld a, (player_y)
    ld (bitmap_pursuer_entry_y), a
    ld a, 1
    ld (bitmap_pursuer_state), a
    ret
${routineHeader(`${P}_tick`, 'One frame of the appearance countdown. At zero, shows the soldier at the entry point as soon as the player is\nfar enough from it; until then it tries again every frame.', {
    input: 'bitmap_pursuer_state = 1; the timer, guard and entry point set by init.',
    output: 'When the soldier appears: x/y of every slot AND the real movement modes written in this call, state = 0.',
    destroys: 'AF, BC, DE, HL.',
    preserves: 'IX, IY.',
    side: 'Writes bitmap_pursuer_timer and, on appearance, the soldier slots of bitmap_enemy_pool.',
    notes: `Far enough = |player_x - entry_x| >= guard OR |player_y - entry_y| >= guard (a guard of 0 never holds the soldier back).\nThe slots are written complete in one go (position, then mode) so bitmap_update_enemies never sees half a body.\nBody origin = entry point; slot i sits at origin + its own cell offset (pool +${POOL_X_OFF}/+${POOL_Y_OFF}), which puts the followers 16 px below the leader for a 16x32 body.`,
  })}${P}_tick:
    ld hl, (bitmap_pursuer_timer)
    ld a, h
    or l
    jp z, .pb_tick_try                      ; the countdown is over: retry until the player has stepped away
    dec hl
    ld (bitmap_pursuer_timer), hl
    ld a, h
    or l
    ret nz                                  ; still counting
.pb_tick_try:
    ld a, (bitmap_pursuer_guard)
    ld d, a                                 ; D = guard px
    ld a, (player_x)
    ld b, a
    ld a, (bitmap_pursuer_entry_x)
    sub b
    jp nc, .pb_tick_abs_x
    neg
.pb_tick_abs_x:
    cp d
    jp nc, .pb_tick_appear                  ; |dx| >= guard
    ld a, (player_y)
    ld b, a
    ld a, (bitmap_pursuer_entry_y)
    sub b
    jp nc, .pb_tick_abs_y
    neg
.pb_tick_abs_y:
    cp d
    ret c                                   ; |dy| < guard too: the player is still on top of the door, wait
.pb_tick_appear:
    ld a, (bitmap_pursuer_entry_x)
    ld b, a                                 ; B = body origin X
    ld a, (bitmap_pursuer_entry_y)
    ld c, a                                 ; C = body origin Y
${writeSlotAsm}
    xor a
    ld (bitmap_pursuer_state), a            ; out for good: the tick goes back to sleep
    ret
${P}_code_end:

; Alert table, indexed by current_screen_index: ${ALERT_RECORD_BYTES} bytes per room = countdown frames (word, 0 = no alert),
; guard px, spare.
${P}_alert_table:
${alertTable}
`;

  const out: string[] = [
    '; ==================================================================',
    '; PURSUER SOLDIER RUNTIME BANK (appearance countdown + alert table)',
    '; ==================================================================',
    ...padding,
    'BITMAP_PURSUER_CODE_BANK_PHYS_START:',
    '    org #8000',
    bank,
    'BITMAP_PURSUER_CODE_BANK_USED_END:',
    '    ds #A000 - $, #FF   ; fails loudly if the runtime outgrows one 8KB bank',
    '    org BITMAP_PURSUER_CODE_BANK_PHYS_START + #2000',
    '',
  ];
  if (system.alerts.length * ALERT_RECORD_BYTES > BANK_BYTES - 512) {
    throw new Error(`Pursuer soldier: ${system.alerts.length} rooms do not fit the alert table of one bank.`);
  }

  return {
    equatesAsm: equates,
    residentAsm: resident,
    banksAsm: out.join('\n'),
    lastBank: codeBank,
    banks: [{ bank: codeBank, kind: 'code' }],
    blockNames: [
      `Pursuer runtime (init + tick), ${system.soldierSlots} soldier slot(s)`,
      `Alert table: ${system.alerts.filter(Boolean).length} room(s)`,
    ],
  };
}
