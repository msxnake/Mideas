import type { Msx2BossDefinition, Msx2ShootDefinition } from '../types';

export function createMsx2BossDefinition(id: string, name: string): Msx2BossDefinition {
  return {
    id,
    name,
    bossAtlasEntryId: '',
    bossFrames: 1,
    bossAnimDelay: 12,
    bossHp: 8,
    bossDamage: 1,
    bossInterval: 3,
    bossMovement: 'patrolX',
    bossSpeed: 2,
    bossRangePx: 0,
    bossBarrierTileId: '',
    bossProjectileKind: 'sprite',
    bossProjectilePattern: 'aimed',
    bossProjectileSpriteId: '',
    bossProjectileTileId: '',
    bossShootInterval: 90,
    bossProjectileSpeed: 2,
    bossProjectileDamage: 1,
    bossLaserTileId: '',
    bossLaserInterval: 90,
    bossLaserMaxLengthPx: 128,
    bossLaserDirectionMask: 0x0f,
    bossPhases: [],
    damageZones: [],
    bossDeathExplosionStampIds: [],
    bossDeathExplosionCount: 8,
    bossDeathExplosionInterval: 6,
    bossDeathExplosionHoldFrames: 12,
    bossDeathExplosionAnimated: false,
    bossDeathExplosionConcurrent: false,
    bossDeathExplosionFrameDelay: 4,
    bossDeathExplosionSoundAssetId: '',
    onDefeated: [],
  };
}

export function createMsx2ShootDefinition(id: string, name: string): Msx2ShootDefinition {
  return {
    id, name,
    pattern: 'aimed', bulletCount: 1, direction: 'down', speed: 0,
    spreadStep: 2, burstCount: 1, burstInterval: 8,
  };
}
