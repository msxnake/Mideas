/**
 * Which boss parameters belong to the reusable `msx2boss` definition and which
 * ones a single encounter (a boss entity placed on a room) may override.
 *
 * Placing a boss from the library used to copy EVERY definition field into the
 * entity's params. Those copies are a snapshot taken the day the boss was
 * placed, and `resolveBossParams` lets any non-empty encounter value win, so the
 * snapshot silently outranked the definition forever: re-tuning "Hit points" in
 * the Boss Editor changed nothing in a room that already had the boss on it.
 *
 * The design doc (docs/msx/BOSS_SYSTEM_DESIGN.md §4.2) says an encounter only
 * carries `bossId`, `startPhase`, `hpOverride`, `lockDoors` and `onDefeated`.
 * Everything below is therefore definition-owned: ignored on the encounter, so
 * one edit in the Boss Editor reaches every room that placed the boss.
 *
 * `onDefeated` is deliberately NOT here — §4.2 makes it per-encounter, and the
 * merge already treats an empty array as "keep what the definition says".
 * `hpOverride` is the documented per-encounter spelling for HP and is applied
 * after the merge, so a screen can still make one copy of a boss tougher.
 */
export const BOSS_DEFINITION_OWNED_PARAMS: ReadonlySet<string> = new Set([
  // --- body ---
  'bossStampAssetId',
  'bossAtlasEntryId',
  'bossFrames',
  'bossAnimDelay',
  'bossHp',
  'bossDamage',
  'bossInterval',
  // --- movement ---
  'bossMovement',
  'bossSpeed',
  'bossRangePx',
  // --- chain barrier ---
  'bossBarrierTileId',
  // --- projectiles ---
  'bossProjectileKind',
  'bossProjectileSpriteId',
  'bossProjectileTileId',
  'bossShootInterval',
  'bossProjectileSpeed',
  'bossProjectileDamage',
  // --- attack phases ---
  'bossPhases',
  // --- damage zones (authored only in the Boss Editor) ---
  'damageZones',
  // --- weak-point hit feedback ---
  'bossHitBlastEnabled',
  'bossHitBlastFrames',
  // --- death bitmap FX ---
  'bossDeathExplosionStampIds',
  'bossDeathExplosionCount',
  'bossDeathExplosionInterval',
  'bossDeathExplosionHoldFrames',
  'bossDeathExplosionAnimated',
  'bossDeathExplosionConcurrent',
  'bossDeathExplosionFrameDelay',
  'bossDeathExplosionSoundAssetId',
]);
