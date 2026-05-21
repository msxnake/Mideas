import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Boss, BossAttack, BossCrushMovement, BossNeckChain, Tile, ProjectAsset, ScreenMap, Sprite, Msx2Screen5TileScreen } from '../../types';
import { Button } from '../common/Button';
import { createTileDataURL, renderScreenToCanvas } from '../utils/screenUtils';
import { EDITOR_BASE_TILE_DIM_S2 } from '../../constants';

/**
 * Props for the BossPreviewModal component.
 */
interface BossPreviewModalProps {
    /** Whether the modal is currently open. */
    isOpen: boolean;
    /** Callback function to close the modal. */
    onClose: () => void;
    /** The boss data to be previewed. */
    boss: Boss;
    /** The tileset used by the boss. */
    tileset: Tile[];
    /** A list of all project assets, used for resolving the background screen. */
    allAssets: ProjectAsset[];
}

/**
 * A generic modal component.
 */
const Modal: React.FC<{isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode}> = ({isOpen, onClose, title, children}) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4" onClick={onClose}>
            <div className="bg-msx-panelbg p-4 sm:p-6 rounded-lg shadow-xl animate-slideIn flex flex-col items-center" onClick={e => e.stopPropagation()}>
                <h2 className="text-md sm:text-lg text-msx-highlight mb-3 sm:mb-4 pixel-font">{title}</h2>
                {children}
                <Button onClick={onClose} variant="primary" size="md" className="mt-4">Close</Button>
            </div>
        </div>
    );
}

const getNeckSegmentOffset = (neckChain: BossNeckChain | undefined, x: number, y: number, tick: number) => {
    if (!neckChain?.enabled || neckChain.segments.length === 0) return { x: 0, y: 0 };

    const segmentIndex = neckChain.segments.findIndex(segment => segment.x === x && segment.y === y);
    if (segmentIndex < 0) return { x: 0, y: 0 };

    const delayedTick = tick - (segmentIndex * neckChain.segmentDelayFrames);
    const angle = delayedTick * 0.12 * neckChain.speed;
    const inheritedStrength = Math.pow(neckChain.followStrength, segmentIndex);

    return {
        x: Math.round(Math.sin(angle) * neckChain.amplitudeX * inheritedStrength),
        y: Math.round(Math.sin(angle) * neckChain.amplitudeY * inheritedStrength),
    };
};

const getProjectileVector = (direction: BossAttack['projectileDirection']) => {
    switch (direction) {
        case 'right': return { x: 1, y: 0 };
        case 'up': return { x: 0, y: -1 };
        case 'down': return { x: 0, y: 1 };
        case 'left':
        default:
            return { x: -1, y: 0 };
    }
};

const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);
const easeInOutQuad = (value: number) => (
    value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2
);

const getCrushMovementOffset = (movement: BossCrushMovement | undefined, tick: number) => {
    if (!movement?.enabled || movement.distance <= 0) return { x: 0, y: 0, phase: 'idle' };

    const windupFrames = Math.max(0, movement.windupFrames);
    const slamFrames = Math.max(1, movement.slamFrames);
    const holdFrames = Math.max(0, movement.holdFrames);
    const returnFrames = Math.max(1, movement.returnFrames);
    const cooldownFrames = Math.max(0, movement.cooldownFrames);
    const totalFrames = windupFrames + slamFrames + holdFrames + returnFrames + cooldownFrames;
    const cycleTick = totalFrames > 0 ? tick % totalFrames : 0;

    let distance = 0;
    let phase = 'windup';
    if (cycleTick < windupFrames) {
        const progress = windupFrames ? cycleTick / windupFrames : 1;
        distance = -Math.sin(progress * Math.PI) * Math.min(8, movement.distance * 0.15);
    } else if (cycleTick < windupFrames + slamFrames) {
        const progress = (cycleTick - windupFrames) / slamFrames;
        distance = easeOutCubic(progress) * movement.distance;
        phase = 'slam';
    } else if (cycleTick < windupFrames + slamFrames + holdFrames) {
        distance = movement.distance;
        phase = 'hold';
    } else if (cycleTick < windupFrames + slamFrames + holdFrames + returnFrames) {
        const progress = (cycleTick - windupFrames - slamFrames - holdFrames) / returnFrames;
        distance = (1 - easeInOutQuad(progress)) * movement.distance;
        phase = 'return';
    } else {
        distance = 0;
        phase = 'cooldown';
    }

    switch (movement.direction) {
        case 'up': return { x: 0, y: -distance, phase };
        case 'left': return { x: -distance, y: 0, phase };
        case 'right': return { x: distance, y: 0, phase };
        case 'down':
        default:
            return { x: 0, y: distance, phase };
    }
};

const createSpriteFrameDataURL = (sprite: Sprite) => {
    const frame = sprite.frames[0]?.data;
    if (!frame) return null;

    const canvas = document.createElement('canvas');
    canvas.width = sprite.size.width;
    canvas.height = sprite.size.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    for (let y = 0; y < sprite.size.height; y++) {
        for (let x = 0; x < sprite.size.width; x++) {
            const color = frame[y]?.[x];
            if (color && color !== sprite.backgroundColor) {
                ctx.fillStyle = color;
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    return canvas.toDataURL();
};

const isMsx2Screen4Asset = (asset: ProjectAsset | undefined): asset is ProjectAsset & { data: Msx2Screen5TileScreen } =>
    !!asset && asset.type === 'msx2screen' && !!asset.data && Array.isArray((asset.data as Msx2Screen5TileScreen).map);

const renderMsx2Screen4Background = (canvas: HTMLCanvasElement, screen: Msx2Screen5TileScreen): void => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = screen.palette?.[0]?.hex || '#000000';
    ctx.fillRect(0, 0, 256, 192);

    const anchorSize = Math.max(1, Number(screen.tileSize) || 16);
    for (let tileY = 0; tileY < Math.ceil(192 / anchorSize); tileY++) {
        for (let tileX = 0; tileX < Math.ceil(256 / anchorSize); tileX++) {
            const tileIndex = screen.map?.[tileY]?.[tileX] ?? 0;
            const tile = screen.tiles?.[tileIndex];
            if (!tile) continue;
            const tileHeight = Math.max(1, Math.min(32, Number(tile.height ?? tile.pixels?.length ?? anchorSize) || anchorSize));
            const tileWidth = Math.max(1, Math.min(32, Number(tile.width ?? tile.pixels?.[0]?.length ?? anchorSize) || anchorSize));
            for (let py = 0; py < tileHeight; py++) {
                const destY = tileY * anchorSize + py;
                if (destY >= 192) continue;
                for (let px = 0; px < tileWidth; px++) {
                    const destX = tileX * anchorSize + px;
                    if (destX >= 256) continue;
                    const colorIndex = tile.pixels?.[py]?.[px] ?? 0;
                    const color = screen.palette?.[colorIndex]?.hex || '#000000';
                    if (color === 'transparent' || color === 'rgba(0,0,0,0)') continue;
                    ctx.fillStyle = color;
                    ctx.fillRect(destX, destY, 1, 1);
                }
            }
        }
    }
};

/**
 * A modal dialog for previewing a boss's animation cycles.
 * It displays the different phases of a boss animation in sequence.
 */
export const BossPreviewModal: React.FC<BossPreviewModalProps> = ({ isOpen, onClose, boss, tileset, allAssets }) => {
    const [frameDelay, setFrameDelay] = useState(200);
    const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
    const [animationTick, setAnimationTick] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [showBackground, setShowBackground] = useState(true);
    const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);

    const linkedScreenAsset = useMemo(() => {
        if (!boss.linkedScreenId) return null;
        return allAssets.find(a => a.id === boss.linkedScreenId && (a.type === 'screenmap' || a.type === 'msx2screen'));
    }, [boss.linkedScreenId, allAssets]);

    const fullTileset = useMemo(() => allAssets.filter(a => a.type === 'tile').map(a => a.data as Tile), [allAssets]);

    const enabledPhases = useMemo(() => {
        const phasesEnabled = boss.phasesEnabled ?? Array(boss.phases.length).fill(true);
        const enabled = boss.phases.filter((_, index) => phasesEnabled[index]);
        return enabled.length > 0 ? enabled : boss.phases;
    }, [boss.phases, boss.phasesEnabled]);

    const tilesById = useMemo(() => new Map(tileset.map(t => [t.id, t])), [tileset]);

    useEffect(() => {
        if (!isOpen || !isPlaying) return;

        const timer = setInterval(() => {
            setAnimationTick(prev => prev + 1);
        }, 50);

        return () => clearInterval(timer);
    }, [isOpen, isPlaying]);

    useEffect(() => {
        if (!isOpen) return;

        // Render background screen if linked
        const canvas = backgroundCanvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && linkedScreenAsset && showBackground) {
            if (isMsx2Screen4Asset(linkedScreenAsset)) {
                renderMsx2Screen4Background(canvas, linkedScreenAsset.data);
            } else {
                const screenMap = linkedScreenAsset.data as ScreenMap;
                renderScreenToCanvas(canvas, screenMap, fullTileset, "SCREEN 2 (Graphics I)", EDITOR_BASE_TILE_DIM_S2);
            }
        } else if (ctx) {
            // Clear canvas if no screen is linked
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }

        // Handle boss animation
        if (enabledPhases.length === 0) {
            setCurrentPhaseIndex(0);
            return;
        }
        if (!isPlaying) return;

        const timer = setTimeout(() => {
            setCurrentPhaseIndex((prevIndex) => (prevIndex + 1) % enabledPhases.length);
        }, frameDelay);

        return () => clearTimeout(timer);
    }, [isOpen, currentPhaseIndex, frameDelay, enabledPhases, linkedScreenAsset, fullTileset, isPlaying, showBackground]);

    if (!isOpen) return null;

    const currentPhase = enabledPhases[currentPhaseIndex];
    if (!currentPhase) return null;

    const phaseGridWidth = currentPhase.dimensions?.width || 8;
    const phaseGridHeight = currentPhase.dimensions?.height || 8;
    const tileSize = 16;
    const bossWidthPx = phaseGridWidth * tileSize;
    const bossHeightPx = phaseGridHeight * tileSize;
    const bossLeftPx = (256 - bossWidthPx) / 2;
    const bossTopPx = (192 - bossHeightPx) / 2;
    const crushOffset = getCrushMovementOffset(currentPhase.crushMovement, animationTick);
    const activeProjectileAttacks = (currentPhase.attackSequence || [])
        .map(attackId => (boss.attacks || []).find(attack => attack.id === attackId))
        .filter((attack): attack is BossAttack => !!attack && attack.type === 'Projectile');
    const activeBoomerangAttacks = (currentPhase.attackSequence || [])
        .map(attackId => (boss.attacks || []).find(attack => attack.id === attackId))
        .filter((attack): attack is BossAttack => !!attack && attack.type === 'Boomerang');
    const activeRockAttacks = (currentPhase.attackSequence || [])
        .map(attackId => (boss.attacks || []).find(attack => attack.id === attackId))
        .filter((attack): attack is BossAttack => !!attack && attack.type === 'Rock');
    const activeLaserAttacks = (currentPhase.attackSequence || [])
        .map(attackId => (boss.attacks || []).find(attack => attack.id === attackId))
        .filter((attack): attack is BossAttack => !!attack && attack.type === 'Laser');
    const activeMeteorAttacks = (currentPhase.attackSequence || [])
        .map(attackId => (boss.attacks || []).find(attack => attack.id === attackId))
        .filter((attack): attack is BossAttack => !!attack && attack.type === 'Meteor');
    const activeSlamRocksAttacks = (currentPhase.attackSequence || [])
        .map(attackId => (boss.attacks || []).find(attack => attack.id === attackId))
        .filter((attack): attack is BossAttack => !!attack && attack.type === 'SlamRocks');
    const activeFallingBlocksAttacks = (currentPhase.attackSequence || [])
        .map(attackId => (boss.attacks || []).find(attack => attack.id === attackId))
        .filter((attack): attack is BossAttack => !!attack && attack.type === 'FallingBlocks');
    const activeBombAttacks = (currentPhase.attackSequence || [])
        .map(attackId => (boss.attacks || []).find(attack => attack.id === attackId))
        .filter((attack): attack is BossAttack => !!attack && attack.type === 'Bomb');
    const primarySlamRocksAttack = activeSlamRocksAttacks[0];
    const primarySlamCycleFrames = primarySlamRocksAttack
        ? Math.max(1, Math.round((primarySlamRocksAttack.cooldown || 4000) / 50))
        : 1;
    const primarySlamCycleTick = primarySlamRocksAttack ? animationTick % primarySlamCycleFrames : 0;
    const primarySlamOffsetY = primarySlamRocksAttack && primarySlamCycleTick < Math.max(1, primarySlamRocksAttack.slamWindupFrames ?? 16)
        ? -Math.max(1, primarySlamRocksAttack.slamRiseChars ?? 3) * tileSize
        : 0;

    const goToPhase = (direction: -1 | 1) => {
        if (enabledPhases.length === 0) return;
        setCurrentPhaseIndex(prev => (prev + direction + enabledPhases.length) % enabledPhases.length);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Boss Animation Preview">
            <div className="bg-msx-bgcolor p-4 rounded-lg flex flex-col space-y-4 items-center">
                <div className="relative bg-msx-checkerboard border-2 border-msx-border" style={{ width: 256, height: 192 }}>
                    <canvas
                        ref={backgroundCanvasRef}
                        width="256"
                        height="192"
                        className="absolute top-0 left-0 w-full h-full"
                        style={{ imageRendering: 'pixelated' }}
                    />
                    <div
                        className="absolute grid"
                        style={{
                            gridTemplateColumns: `repeat(${phaseGridWidth}, ${tileSize}px)`,
                            gridTemplateRows: `repeat(${phaseGridHeight}, ${tileSize}px)`,
                            width: `${phaseGridWidth * tileSize}px`,
                            height: `${phaseGridHeight * tileSize}px`,
                            imageRendering: 'pixelated',
                            top: '50%',
                            left: '50%',
                            transform: `translate(-50%, -50%) translate(${crushOffset.x}px, ${crushOffset.y + primarySlamOffsetY}px)`,
                        }}
                    >
                        {currentPhase.tileMatrix?.flat().map((tileId, index) => {
                            const tileX = index % phaseGridWidth;
                            const tileY = Math.floor(index / phaseGridWidth);
                            const neckOffset = getNeckSegmentOffset(currentPhase.neckChain, tileX, tileY, animationTick);
                            const tile = tileId ? tilesById.get(tileId) : null;
                            const dataUrl = tile ? createTileDataURL(tile, 0, 0, tile.width, tile.height, tile.width, "SCREEN 4 (Graphics II)") : null;
                            return (
                                <div
                                    key={index}
                                    className="w-full h-full"
                                    style={{
                                        backgroundImage: dataUrl ? `url(${dataUrl})` : 'none',
                                        backgroundSize: 'cover',
                                        transform: `translate(${neckOffset.x}px, ${neckOffset.y}px)`,
                                        zIndex: currentPhase.neckChain?.segments.findIndex(segment => segment.x === tileX && segment.y === tileY) ?? 0,
                                    }}
                                />
                            );
                        })}
                    </div>
                    {activeProjectileAttacks.map((attack, attackIndex) => {
                        const projectileSpriteAsset = attack.spriteAssetId
                            ? allAssets.find(asset => asset.id === attack.spriteAssetId && asset.type === 'sprite')
                            : null;
                        const projectileSprite = projectileSpriteAsset?.data as Sprite | undefined;
                        const projectileDataUrl = projectileSprite ? createSpriteFrameDataURL(projectileSprite) : null;
                        const projectileWidth = projectileSprite?.size.width || 8;
                        const projectileHeight = projectileSprite?.size.height || 8;
                        const cooldownFrames = Math.max(1, Math.round((attack.cooldown || 900) / 50));
                        const speed = Math.max(1, attack.speed || 3);
                        const range = Math.max(8, attack.range || 160);
                        const phaseOffset = attackIndex * Math.max(1, Math.floor(cooldownFrames / Math.max(1, activeProjectileAttacks.length)));
                        const projectileAge = (animationTick + phaseOffset) % cooldownFrames;
                        const distance = projectileAge * speed;
                        if (distance > range) return null;

                        const vector = getProjectileVector(attack.projectileDirection || 'left');
                        const spawnX = bossLeftPx + crushOffset.x + (bossWidthPx / 2) - (projectileWidth / 2) + (attack.spawnOffsetX || 0);
                        const spawnY = bossTopPx + crushOffset.y + (bossHeightPx / 2) - (projectileHeight / 2) + (attack.spawnOffsetY || 0);

                        return (
                            <div
                                key={attack.id}
                                title={`${attack.name} damage ${attack.damage}`}
                                className="absolute border border-msx-highlight/70 bg-msx-danger"
                                style={{
                                    left: `${spawnX + vector.x * distance}px`,
                                    top: `${spawnY + vector.y * distance}px`,
                                    width: `${projectileWidth}px`,
                                    height: `${projectileHeight}px`,
                                    backgroundImage: projectileDataUrl ? `url(${projectileDataUrl})` : undefined,
                                    backgroundSize: 'cover',
                                    imageRendering: 'pixelated',
                                }}
                            />
                        );
                    })}
                    {activeBoomerangAttacks.map((attack, attackIndex) => {
                        const boomerangSpriteAsset = attack.spriteAssetId
                            ? allAssets.find(asset => asset.id === attack.spriteAssetId && asset.type === 'sprite')
                            : null;
                        const boomerangSprite = boomerangSpriteAsset?.data as Sprite | undefined;
                        const boomerangDataUrl = boomerangSprite ? createSpriteFrameDataURL(boomerangSprite) : null;
                        const boomerangWidth = boomerangSprite?.size.width || 8;
                        const boomerangHeight = boomerangSprite?.size.height || 8;
                        const cooldownFrames = Math.max(1, Math.round((attack.cooldown || 3400) / 50));
                        const speed = Math.max(1, attack.speed || 3);
                        const range = Math.max(8, attack.range || 96);
                        const travelFrames = Math.max(1, Math.ceil(range / speed));
                        const activeFrames = travelFrames * 2;
                        const loopFrames = Math.max(cooldownFrames, activeFrames + 1);
                        const phaseOffset = attackIndex * Math.max(1, Math.floor(loopFrames / Math.max(1, activeBoomerangAttacks.length)));
                        const boomerangAge = (animationTick + phaseOffset) % loopFrames;
                        if (boomerangAge > activeFrames) return null;

                        const returning = boomerangAge > travelFrames;
                        const pathAge = returning ? activeFrames - boomerangAge : boomerangAge;
                        const distance = Math.min(range, pathAge * speed);
                        const vector = getProjectileVector(attack.projectileDirection || 'left');
                        const spawnX = bossLeftPx + crushOffset.x + (bossWidthPx / 2) - (boomerangWidth / 2) + (attack.spawnOffsetX || 0);
                        const spawnY = bossTopPx + crushOffset.y + (bossHeightPx / 2) - (boomerangHeight / 2) + (attack.spawnOffsetY || 0);

                        return (
                            <div
                                key={attack.id}
                                title={`${attack.name} ${returning ? 'return' : 'out'} damage ${attack.damage}`}
                                className="absolute rounded-full border border-msx-highlight/70 bg-msx-cyan"
                                style={{
                                    left: `${spawnX + vector.x * distance}px`,
                                    top: `${spawnY + vector.y * distance}px`,
                                    width: `${boomerangWidth}px`,
                                    height: `${boomerangHeight}px`,
                                    backgroundImage: boomerangDataUrl ? `url(${boomerangDataUrl})` : undefined,
                                    backgroundSize: 'cover',
                                    imageRendering: 'pixelated',
                                    transform: `rotate(${animationTick * 24}deg)`,
                                }}
                            />
                        );
                    })}
                    {activeRockAttacks.map((attack, attackIndex) => {
                        const rockSpriteAsset = attack.spriteAssetId
                            ? allAssets.find(asset => asset.id === attack.spriteAssetId && asset.type === 'sprite')
                            : null;
                        const rockSprite = rockSpriteAsset?.data as Sprite | undefined;
                        const rockDataUrl = rockSprite ? createSpriteFrameDataURL(rockSprite) : null;
                        const rockWidth = rockSprite?.size.width || 8;
                        const rockHeight = rockSprite?.size.height || 8;
                        const cooldownFrames = Math.max(1, Math.round((attack.cooldown || 1400) / 50));
                        const speed = Math.max(1, attack.speed || 3);
                        const range = Math.max(8, attack.range || 128);
                        const arcHeight = Math.max(0, attack.arcHeight ?? 40);
                        const phaseOffset = attackIndex * Math.max(1, Math.floor(cooldownFrames / Math.max(1, activeRockAttacks.length)));
                        const rockAge = (animationTick + phaseOffset) % cooldownFrames;
                        const distance = rockAge * speed;
                        if (distance > range) return null;

                        const vector = getProjectileVector(attack.projectileDirection || 'left');
                        const progress = Math.max(0, Math.min(1, distance / range));
                        const arcOffset = Math.sin(progress * Math.PI) * arcHeight;
                        const spawnX = bossLeftPx + crushOffset.x + (bossWidthPx / 2) - (rockWidth / 2) + (attack.spawnOffsetX || 0);
                        const spawnY = bossTopPx + crushOffset.y + (bossHeightPx / 2) - (rockHeight / 2) + (attack.spawnOffsetY || 0);

                        return (
                            <div
                                key={attack.id}
                                title={`${attack.name} parabolic damage ${attack.damage}`}
                                className="absolute rounded-full border border-msx-highlight/70 bg-msx-border"
                                style={{
                                    left: `${spawnX + vector.x * distance}px`,
                                    top: `${spawnY + vector.y * distance - arcOffset}px`,
                                    width: `${rockWidth}px`,
                                    height: `${rockHeight}px`,
                                    backgroundImage: rockDataUrl ? `url(${rockDataUrl})` : undefined,
                                    backgroundSize: 'cover',
                                    imageRendering: 'pixelated',
                                    transform: `rotate(${animationTick * 12}deg)`,
                                }}
                            />
                        );
                    })}
                    {activeLaserAttacks.map((attack, attackIndex) => {
                        const laserTileAsset = attack.laserTileAssetId
                            ? allAssets.find(asset => asset.id === attack.laserTileAssetId && asset.type === 'tile')
                            : null;
                        const laserTile = laserTileAsset?.data as Tile | undefined;
                        const laserDataUrl = laserTile ? createTileDataURL(laserTile, 0, 0, laserTile.width, laserTile.height, laserTile.width, "SCREEN 4 (Graphics II)") : null;
                        const charSize = 8;
                        const lengthChars = Math.max(1, attack.laserLengthChars || 12);
                        const durationFrames = Math.max(1, attack.laserDurationFrames || 18);
                        const cooldownFrames = Math.max(1, Math.round((attack.cooldown || 1200) / 50));
                        const phaseOffset = attackIndex * Math.max(1, Math.floor(cooldownFrames / Math.max(1, activeLaserAttacks.length)));
                        const laserAge = (animationTick + phaseOffset) % cooldownFrames;
                        if (laserAge >= durationFrames) return null;

                        const direction = attack.projectileDirection || 'left';
                        const isHorizontal = direction === 'left' || direction === 'right';
                        const beamWidth = isHorizontal ? lengthChars * charSize : charSize;
                        const beamHeight = isHorizontal ? charSize : lengthChars * charSize;
                        const originX = bossLeftPx + crushOffset.x + (bossWidthPx / 2) + (attack.spawnOffsetX || 0);
                        const originY = bossTopPx + crushOffset.y + (bossHeightPx / 2) + (attack.spawnOffsetY || 0);
                        const left = direction === 'left' ? originX - beamWidth : direction === 'right' ? originX : originX - (charSize / 2);
                        const top = direction === 'up' ? originY - beamHeight : direction === 'down' ? originY : originY - (charSize / 2);

                        return (
                            <div
                                key={attack.id}
                                title={`${attack.name} laser damage ${attack.damage}`}
                                className="absolute border border-msx-highlight/80 bg-msx-cyan"
                                style={{
                                    left: `${left}px`,
                                    top: `${top}px`,
                                    width: `${beamWidth}px`,
                                    height: `${beamHeight}px`,
                                    backgroundImage: laserDataUrl ? `url(${laserDataUrl})` : undefined,
                                    backgroundRepeat: 'repeat',
                                    backgroundSize: `${charSize}px ${charSize}px`,
                                    imageRendering: 'pixelated',
                                    opacity: laserAge % 4 < 2 ? 1 : 0.72,
                                }}
                            />
                        );
                    })}
                    {activeMeteorAttacks.flatMap((attack, attackIndex) => {
                        const meteorSpriteAsset = attack.spriteAssetId
                            ? allAssets.find(asset => asset.id === attack.spriteAssetId && asset.type === 'sprite')
                            : null;
                        const meteorSprite = meteorSpriteAsset?.data as Sprite | undefined;
                        const meteorDataUrl = meteorSprite ? createSpriteFrameDataURL(meteorSprite) : null;
                        const meteorWidth = meteorSprite?.size.width || 8;
                        const meteorHeight = meteorSprite?.size.height || 8;
                        const meteorCount = Math.max(1, attack.meteorCount || 4);
                        const meteorSpreadX = Math.max(0, attack.meteorSpreadX ?? 32);
                        const warningFrames = Math.max(0, attack.meteorWarningFrames ?? 18);
                        const cooldownFrames = Math.max(1, Math.round((attack.cooldown || 1200) / 50));
                        const speed = Math.max(1, attack.speed || 4);
                        const range = Math.max(32, attack.range || 216);
                        const phaseOffset = attackIndex * Math.max(1, Math.floor(cooldownFrames / Math.max(1, activeMeteorAttacks.length)));
                        const cycleTick = (animationTick + phaseOffset) % cooldownFrames;
                        const baseX = bossLeftPx + crushOffset.x + (bossWidthPx / 2) - (meteorWidth / 2) + (attack.spawnOffsetX || 0);
                        const startY = -meteorHeight + (attack.spawnOffsetY ?? -16);
                        const laneStart = -((meteorCount - 1) * meteorSpreadX) / 2;

                        return Array.from({ length: meteorCount }).map((_, meteorIndex) => {
                            const laneDelay = meteorIndex * 4;
                            const meteorAge = cycleTick - warningFrames - laneDelay;
                            const laneX = baseX + laneStart + (meteorIndex * meteorSpreadX);
                            const targetY = Math.min(184, startY + range);

                            if (cycleTick < warningFrames + laneDelay) {
                                return (
                                    <div
                                        key={`${attack.id}_warn_${meteorIndex}`}
                                        title={`${attack.name} warning`}
                                        className="absolute border border-msx-danger bg-msx-danger/30"
                                        style={{
                                            left: `${laneX}px`,
                                            top: `${targetY}px`,
                                            width: `${meteorWidth}px`,
                                            height: '3px',
                                        }}
                                    />
                                );
                            }

                            const distance = meteorAge * speed;
                            if (distance > range) return null;

                            return (
                                <div
                                    key={`${attack.id}_meteor_${meteorIndex}`}
                                    title={`${attack.name} damage ${attack.damage}`}
                                    className="absolute border border-msx-highlight/70 bg-msx-danger"
                                    style={{
                                        left: `${laneX}px`,
                                        top: `${startY + distance}px`,
                                        width: `${meteorWidth}px`,
                                        height: `${meteorHeight}px`,
                                        backgroundImage: meteorDataUrl ? `url(${meteorDataUrl})` : undefined,
                                        backgroundSize: 'cover',
                                        imageRendering: 'pixelated',
                                    }}
                                />
                            );
                        });
                    })}
                    {activeSlamRocksAttacks.flatMap((attack, attackIndex) => {
                        const rockSpriteAsset = attack.spriteAssetId
                            ? allAssets.find(asset => asset.id === attack.spriteAssetId && asset.type === 'sprite')
                            : null;
                        const rockSprite = rockSpriteAsset?.data as Sprite | undefined;
                        const rockDataUrl = rockSprite ? createSpriteFrameDataURL(rockSprite) : null;
                        const rockWidth = rockSprite?.size.width || 8;
                        const rockHeight = rockSprite?.size.height || 8;
                        const rockCount = Math.max(1, Math.min(4, attack.meteorCount || 4));
                        const cooldownFrames = Math.max(1, Math.round((attack.cooldown || 4000) / 50));
                        const speed = Math.max(1, attack.speed || 4);
                        const range = Math.max(32, attack.range || 216);
                        const windupFrames = Math.max(1, attack.slamWindupFrames ?? 16);
                        const slamFrames = Math.max(1, attack.slamFrames ?? 6);
                        const holdFrames = Math.max(0, attack.slamHoldFrames ?? 8);
                        const phaseOffset = attackIndex * Math.max(1, Math.floor(cooldownFrames / Math.max(1, activeSlamRocksAttacks.length)));
                        const cycleTick = (animationTick + phaseOffset) % cooldownFrames;
                        const rockStart = windupFrames + slamFrames + holdFrames;

                        return Array.from({ length: rockCount }).map((_, rockIndex) => {
                            const laneDelay = rockIndex * 8;
                            const rockAge = cycleTick - rockStart - laneDelay;
                            const laneX = ((rockIndex * 67) + (attackIndex * 37) + 24) % 224;
                            if (rockAge < 0) return null;
                            const distance = rockAge * speed;
                            if (distance > range) return null;
                            return (
                                <div
                                    key={`${attack.id}_slam_rock_${rockIndex}`}
                                    title={`${attack.name} falling rock`}
                                    className="absolute border border-msx-highlight/70 bg-msx-border"
                                    style={{
                                        left: `${laneX}px`,
                                        top: `${distance}px`,
                                        width: `${rockWidth}px`,
                                        height: `${rockHeight}px`,
                                        backgroundImage: rockDataUrl ? `url(${rockDataUrl})` : undefined,
                                        backgroundSize: 'cover',
                                        imageRendering: 'pixelated',
                                    }}
                                />
                            );
                        });
                    })}
                    {activeFallingBlocksAttacks.flatMap((attack, attackIndex) => {
                        const blockSpriteAsset = attack.spriteAssetId
                            ? allAssets.find(asset => asset.id === attack.spriteAssetId && asset.type === 'sprite')
                            : null;
                        const blockSprite = blockSpriteAsset?.data as Sprite | undefined;
                        const blockSpriteDataUrl = blockSprite ? createSpriteFrameDataURL(blockSprite) : null;
                        const blockTileAsset = attack.blockTileAssetId
                            ? allAssets.find(asset => asset.id === attack.blockTileAssetId && asset.type === 'tile')
                            : null;
                        const blockTile = blockTileAsset?.data as Tile | undefined;
                        const blockTileDataUrl = blockTile ? createTileDataURL(blockTile, 0, 0, blockTile.width, blockTile.height, blockTile.width, "SCREEN 4 (Graphics II)") : null;
                        const blockWidth = blockSprite?.size.width || 8;
                        const blockHeight = blockSprite?.size.height || 8;
                        const blockCount = Math.max(1, Math.min(4, attack.meteorCount || 4));
                        const cooldownFrames = Math.max(1, Math.round((attack.cooldown || 4000) / 50));
                        const speed = Math.max(1, attack.speed || 4);
                        const landingY = Math.max(0, Math.min(23, attack.landingYChar ?? 20)) * 8;
                        const phaseOffset = attackIndex * Math.max(1, Math.floor(cooldownFrames / Math.max(1, activeFallingBlocksAttacks.length)));
                        const cycleTick = (animationTick + phaseOffset) % cooldownFrames;

                        return Array.from({ length: blockCount }).map((_, blockIndex) => {
                            const laneDelay = blockIndex * 8;
                            const blockAge = cycleTick - laneDelay;
                            const laneX = ((blockIndex * 67) + (attackIndex * 37) + 24) % 224;
                            if (blockAge < 0) return null;
                            const distance = blockAge * speed;
                            const hasLanded = distance >= landingY;
                            return (
                                <div
                                    key={`${attack.id}_falling_block_${blockIndex}`}
                                    title={`${attack.name} ${hasLanded ? 'landed block' : 'falling block'}`}
                                    className="absolute border border-msx-highlight/70 bg-msx-border"
                                    style={{
                                        left: `${laneX}px`,
                                        top: `${hasLanded ? landingY : distance}px`,
                                        width: `${hasLanded ? 8 : blockWidth}px`,
                                        height: `${hasLanded ? 8 : blockHeight}px`,
                                        backgroundImage: hasLanded && blockTileDataUrl ? `url(${blockTileDataUrl})` : blockSpriteDataUrl ? `url(${blockSpriteDataUrl})` : undefined,
                                        backgroundSize: 'cover',
                                        imageRendering: 'pixelated',
                                    }}
                                />
                            );
                        });
                    })}
                    {activeBombAttacks.flatMap((attack, attackIndex) => {
                        const bombSpriteAsset = attack.spriteAssetId
                            ? allAssets.find(asset => asset.id === attack.spriteAssetId && asset.type === 'sprite')
                            : null;
                        const explosionSpriteAsset = attack.explosionSpriteAssetId
                            ? allAssets.find(asset => asset.id === attack.explosionSpriteAssetId && asset.type === 'sprite')
                            : null;
                        const bombSprite = bombSpriteAsset?.data as Sprite | undefined;
                        const explosionSprite = explosionSpriteAsset?.data as Sprite | undefined;
                        const bombDataUrl = bombSprite ? createSpriteFrameDataURL(bombSprite) : null;
                        const explosionDataUrl = explosionSprite ? createSpriteFrameDataURL(explosionSprite) : null;
                        const bombWidth = bombSprite?.size.width || 8;
                        const bombHeight = bombSprite?.size.height || 8;
                        const bombCount = Math.max(1, attack.bombCount || 3);
                        const bombSpreadX = Math.max(0, attack.bombSpreadX ?? 28);
                        const fuseFrames = Math.max(1, attack.bombFuseFrames ?? 45);
                        const explosionFrames = Math.max(1, attack.explosionDurationFrames ?? 18);
                        const explosionRadius = Math.max(8, attack.explosionRadius ?? 24);
                        const cooldownFrames = Math.max(1, Math.round((attack.cooldown || 1500) / 50));
                        const phaseOffset = attackIndex * Math.max(1, Math.floor(cooldownFrames / Math.max(1, activeBombAttacks.length)));
                        const cycleTick = (animationTick + phaseOffset) % cooldownFrames;
                        const baseX = bossLeftPx + crushOffset.x + (bossWidthPx / 2) - (bombWidth / 2) + (attack.spawnOffsetX || 0);
                        const baseY = bossTopPx + crushOffset.y + (bossHeightPx / 2) - (bombHeight / 2) + (attack.spawnOffsetY || 0);
                        const laneStart = -((bombCount - 1) * bombSpreadX) / 2;

                        return Array.from({ length: bombCount }).map((_, bombIndex) => {
                            const laneDelay = bombIndex * 5;
                            const bombAge = cycleTick - laneDelay;
                            if (bombAge < 0) return null;

                            const laneX = baseX + laneStart + (bombIndex * bombSpreadX);
                            if (bombAge < fuseFrames) {
                                const pulse = bombAge % 10 >= 5 ? 1.12 : 1;
                                return (
                                    <div
                                        key={`${attack.id}_bomb_${bombIndex}`}
                                        title={`${attack.name} fuse`}
                                        className="absolute border border-msx-highlight/70 bg-msx-warning"
                                        style={{
                                            left: `${laneX}px`,
                                            top: `${baseY}px`,
                                            width: `${bombWidth}px`,
                                            height: `${bombHeight}px`,
                                            backgroundImage: bombDataUrl ? `url(${bombDataUrl})` : undefined,
                                            backgroundSize: 'cover',
                                            imageRendering: 'pixelated',
                                            transform: `scale(${pulse})`,
                                            transformOrigin: 'center',
                                        }}
                                    />
                                );
                            }

                            if (bombAge >= fuseFrames + explosionFrames) return null;

                            const explosionSize = explosionSprite?.size.width || explosionRadius * 2;
                            const explosionHeight = explosionSprite?.size.height || explosionSize;
                            return (
                                <div
                                    key={`${attack.id}_explosion_${bombIndex}`}
                                    title={`${attack.name} explosion damage ${attack.damage}`}
                                    className="absolute rounded-full border-2 border-msx-danger bg-msx-danger/50"
                                    style={{
                                        left: `${laneX + (bombWidth / 2) - (explosionSize / 2)}px`,
                                        top: `${baseY + (bombHeight / 2) - (explosionHeight / 2)}px`,
                                        width: `${explosionSize}px`,
                                        height: `${explosionHeight}px`,
                                        backgroundImage: explosionDataUrl ? `url(${explosionDataUrl})` : undefined,
                                        backgroundSize: 'cover',
                                        imageRendering: 'pixelated',
                                    }}
                                />
                            );
                        });
                    })}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs w-full max-w-xs">
                    <Button onClick={() => goToPhase(-1)} variant="ghost" size="sm" disabled={enabledPhases.length < 2}>Prev</Button>
                    <Button onClick={() => setIsPlaying(prev => !prev)} variant={isPlaying ? 'secondary' : 'ghost'} size="sm">
                        {isPlaying ? 'Pause' : 'Play'}
                    </Button>
                    <Button onClick={() => goToPhase(1)} variant="ghost" size="sm" disabled={enabledPhases.length < 2}>Next</Button>
                    <Button onClick={() => setAnimationTick(0)} variant="ghost" size="sm">Reset</Button>
                </div>
                <label className="flex items-center gap-2 text-xs text-msx-textsecondary">
                    <input
                        type="checkbox"
                        checked={showBackground}
                        onChange={e => setShowBackground(e.target.checked)}
                        className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent"
                    />
                    Show linked screen
                </label>
                <div className="flex items-center space-x-2 text-xs w-full max-w-xs">
                    <label htmlFor="frame-delay" className="text-msx-textsecondary whitespace-nowrap">Delay:</label>
                    <input
                        id="frame-delay"
                        type="range"
                        min="50"
                        max="2000"
                        step="50"
                        value={frameDelay}
                        onChange={(e) => setFrameDelay(Number(e.target.value))}
                        className="w-full h-2 bg-msx-border rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="font-mono w-12 text-right">{frameDelay}ms</span>
                </div>
                <div className="text-center text-xs text-msx-textsecondary h-4">
                    {currentPhase.name} ({currentPhaseIndex + 1} / {enabledPhases.length})
                </div>
                {currentPhase.neckChain?.enabled && currentPhase.neckChain.segments.length > 0 && (
                    <div className="text-center text-xs text-msx-cyan h-4">
                        Neck chain: {currentPhase.neckChain.segments.length} tiles
                    </div>
                )}
                {currentPhase.crushMovement?.enabled && (
                    <div className="text-center text-xs text-msx-danger h-4">
                        Crush: {currentPhase.crushMovement.direction} {Math.round(Math.abs(crushOffset.x || crushOffset.y))}px ({crushOffset.phase})
                    </div>
                )}
                {activeProjectileAttacks.length > 0 && (
                    <div className="text-center text-xs text-msx-highlight h-4">
                        Projectiles: {activeProjectileAttacks.map(attack => attack.name).join(', ')}
                    </div>
                )}
                {activeBoomerangAttacks.length > 0 && (
                    <div className="text-center text-xs text-msx-highlight h-4">
                        Boomerangs: {activeBoomerangAttacks.map(attack => attack.name).join(', ')}
                    </div>
                )}
                {activeRockAttacks.length > 0 && (
                    <div className="text-center text-xs text-msx-highlight h-4">
                        Rocks: {activeRockAttacks.map(attack => attack.name).join(', ')}
                    </div>
                )}
                {activeLaserAttacks.length > 0 && (
                    <div className="text-center text-xs text-msx-highlight h-4">
                        Lasers: {activeLaserAttacks.map(attack => attack.name).join(', ')}
                    </div>
                )}
                {activeMeteorAttacks.length > 0 && (
                    <div className="text-center text-xs text-msx-highlight h-4">
                        Meteors: {activeMeteorAttacks.map(attack => attack.name).join(', ')}
                    </div>
                )}
                {activeBombAttacks.length > 0 && (
                    <div className="text-center text-xs text-msx-highlight h-4">
                        Bombs: {activeBombAttacks.map(attack => attack.name).join(', ')}
                    </div>
                )}
            </div>
        </Modal>
    );
};
