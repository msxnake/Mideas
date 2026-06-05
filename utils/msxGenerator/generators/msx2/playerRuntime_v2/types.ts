import { Msx2HardwareLayer, PlayerAnimRole } from '../msx2Screen4Generator';
import { Msx2PlatformPhysicsConfig } from '../../../../msx2PlatformPhysics';
import { Msx2Screen4TileScreen } from '../../../../../types';

export type { Msx2PlatformPhysicsConfig, Msx2HardwareLayer, PlayerAnimRole };

export interface V2Options {
  useKonamiDataBank: boolean;
  pushBoxEnabled: boolean;
  tileScreens: Array<Msx2Screen4TileScreen | undefined>;
  deferSatUploadToShooterFrameDispatch?: boolean;
}

export interface V2Output {
  init: string;
  data: string;
  runtime: string;
}

export interface RoleLayout {
  basePatternIndex: number;
  frameStride: number;
  mirrorPatternOffset: number;
  layers: Msx2HardwareLayer[];
  frameCount: number;
  delay: number;
  facingDirection: 'left' | 'right' | undefined;
  uniqueFrameCount: number;
  uniqueFrameIndices: number[];
  frameMapLabel: string;
  frames: number[];
}

export interface SpriteLayout {
  basePatternIndex: number;
  layers: Msx2HardwareLayer[];
  frameCount: number;
  frameStride: number;
  mirrorPatternOffset: number;
  horizontalFacing: boolean;
  playerUsesFlipX: boolean;
  animationDelayFrames: number;
  animateOnlyWhenMoving: boolean;
  usePlayerWalkingFlag: boolean;
  hasPlayerAnimRoles: boolean;
  idle: RoleLayout | null;
  walk: RoleLayout | null;
  hbLeft: number;
  hbFeet: number;
  hbRight: number;
  hbCenterX: number;
  hbCenterY: number;
  playerPatternCount: number;
  enemyPatternIndex: number;
  enemyMirrorPatternIndex: number;
  playerBulletPatternIndex: number;
  enemyBulletPatternIndex: number;
  pushBoxPatternIndex: number;
  color: number;
  visible: boolean;
  initX: number;
  initY: number;
  initialFacingDx: number;
  initialFrame: number;
  patrolBounds: { minX: number; maxX: number };
  control2Players: boolean;
  playerHardwareVisible: boolean;
  usesVerticalPhysics: boolean;
  walkingFlagManaged: boolean;
  fallbackPlayerFacing: 'left' | 'right' | undefined;
  mirrorPatternVariantCount: number;
  enemyPatternVariantCount: number;
  playerBulletSlotCount: number;
  enemyBulletSlotCount: number;
  setPlayerWalkingFlagAsm: string;
  clearPlayerWalkingFlagAsm: string;
}
