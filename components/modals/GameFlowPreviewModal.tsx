
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CRTShaderOverlay, CRTShaderConfig, defaultCRTConfig } from '../../src/components/CRTShaderOverlay';
import { CRTConfigModal } from '../../src/components/CRTConfigModal';
import {
    GameFlowGraph,
    GameFlowGlobalInitializationConfig,
    ProjectAsset,
    GameFlowNode,
    GameFlowSubMenuNode,
    GameFlowWorldLinkNode,
    GameFlowTextNode,
    MSXFont,
    MSXFontColorAttributes,
    EntityTemplate,
    ScreenMap,
    ScreenTile,
    Tile,
    WorldMapGraph,
    EntityInstance,
    WorldMapConnection,
    Sprite,
    FacingDirection,
    ComponentDefinition,
    PixelData,
    AssetType,
    TileBank,
    DialogueAsset
} from '../../types';
import { Button } from '../common/Button';
import { renderMSX1TextToDataURL, getTextDimensionsMSX1, renderUnifiedTextToDataURL } from '../utils/msxFontRenderer';
import { renderScreenToCanvas, createSpriteDataURL, getScreenBehaviorLayer, normalizeTileInteractionType } from '../utils/screenUtils';
import { drawPresentationScreenPreview } from '../utils/presentationScreenUtils';
import type { PresentationScreenConfig } from '../../types';
import { mirrorPixelDataHorizontally, mirrorPixelDataVertically } from '../utils/spriteUtils';
import { ArrowUpIcon, ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, ArrowsPointingOutIcon } from '../icons/MsxIcons';
import { StateMachine, StateMachineState, Action, TransitionGuard } from '../../statemachine.types';
import { AYSynthesizer } from '../utils/aySynthesizer';
import {
    buildScreenWorldMap,
    localToGlobal,
    globalToLocal,
    getAdjacentScreens,
    type ScreenWorldPosition
} from '../../utils/screenCoordinates';
import { getScreenModeMetrics } from '../../utils/screenModeConfig';
import { getAllGlobalVariables } from '../../utils/globalVariablesUtils';
import { AutoEventToken, parseAutoEventString } from '../../utils/autoEventString';
import { log } from 'console';


const ANIMATION_SPEED_MS = 200; // Fallback if sprite.animationSpeedMs is undefined
const SCREEN2_LABEL = "SCREEN 2 (Graphics I)";
const SCREEN5_LABEL = "SCREEN 5 (Graphics III)";
const DEADLY_TILES_COMPONENT_ID = 'comp_deadly_tiles';

const resolveScreenModeForMap = (map: ScreenMap | null, fallback: string): string => {
    if (!map) return fallback;
    if (map.height && map.height > 24) return SCREEN5_LABEL;
    if (map.tileBankAssetId) return SCREEN2_LABEL;
    return fallback;
};
const CHILD_LINK_COMPONENT_ID = 'comp_child_link';

interface ChildLinkConfig {
    parentTemplateId?: string;
    parentInstanceId?: string;
    parentInstanceName?: string;
    offsetX: number;
    offsetY: number;
    inheritVelocity: boolean;
    inheritFacing: boolean;
    followParentGlobal: boolean;
    detachOnParentLost: boolean;
    mirrorParent?: boolean;
}

interface CarrySpriteSnapshot {
    sprite: Sprite;
    spriteAssetId?: string;
    frameImages: HTMLImageElement[];
    mirroredFrameImages?: HTMLImageElement[];
    currentFrame: number;
    isFacingMirrored?: boolean;
}

interface AnimatedEntity {
    instance: EntityInstance;
    template: EntityTemplate;
    sprite: Sprite;
    spriteAssetId?: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    gravityVel: number; // 8.8 fixed-point gravity velocity (signed 16-bit), matching Z80 entity_gravity_vel
    frameImages: HTMLImageElement[];
    mirroredFrameImages?: HTMLImageElement[];
    currentFrame: number;
    lastFrameUpdateTime: number;
    carrySpriteBackup?: CarrySpriteSnapshot;
    wallGrabSpriteBackup?: CarrySpriteSnapshot;
    stateMachine?: StateMachine;
    currentState?: string;
    isOnGround: boolean;
    isOnLadder?: boolean;
    isTouchingCeiling?: boolean;
    isTouchingWallLeft?: boolean;
    isTouchingWallRight?: boolean;
    wallJumpData?: {
        lockFramesRemaining: number;
        lockedVx: number;
    };
    isWallGrabbing?: boolean;
    wallGrabReleaseGraceFrames?: number;
    wallGrabTimerRemaining?: number;
    wallGrabLockout?: boolean;
    spawnTime: number; // Timestamp when entity was created
    animationHasCompleted?: boolean; // True when a non-looping animation reaches its last frame
    lastAnimationState?: string; // Track which state's animation was playing
    isFacingMirrored?: boolean; // Track if entity is currently facing mirrored direction (for idle pose)
    lastDamageTime?: number; // Timestamp of last damage taken (for invincibility frames)
    hasDangerousTileCollision?: boolean; // True when touching a deadly tile
    // Multi-screen properties
    globalX?: number; // Global X coordinate in world space (for multi-screen entities)
    globalY?: number; // Global Y coordinate in world space
    originScreenId?: string; // Screen where entity was originally created
    parentEntityId?: string | null; // ID of parent entity (for riding platforms)
    platformUnderneath?: AnimatedEntity | null; // Reference to platform entity this entity is standing on
    platformGraceFramesLeft?: number; // Small grace period to keep grounded after brief de-anchoring
    screenAssetId?: string | null; // Screen where this runtime entity was created
    // Carry mechanics
    carriedBox?: AnimatedEntity | null; // Reference to the box currently carried (only meaningful for hero)
    // Box persistence
    ownerScreenId?: string | null; // For Box entities: which screen this box belongs to (null if being carried)
    // Timer/Wait system
    waitUntilTime?: number; // Timestamp when WAIT action will complete (blocks state machine transitions)
    // Shooting / projectile
    lastShotTime?: number; // Cooldown tracker for shooting
    isProjectile?: boolean; // Marks this entity as a projectile
    projectileOwnerId?: string; // Owner entity id (to avoid self-collisions)
    projectileStartX?: number; // Where the projectile started (for range)
    projectileStartY?: number;
    projectileMaxRange?: number; // Pixels
    projectileDamage?: number; // Damage to apply on hit
    projectileExpireOnHit?: boolean; // Destroy projectile after first hit
    // Projectile animation control
    animateProjectile?: boolean; // If true, projectile cycles its frames
    // Explosion (Render2) support
    isExploding?: boolean; // True once impact triggers explosion animation
    explosionSprite?: Sprite; // Explosion sprite (Render2)
    explosionFrameImages?: HTMLImageElement[]; // Prebuilt frames for Render2
    explosionMirroredFrameImages?: HTMLImageElement[]; // Mirrored frames for Render2 if needed
    // Desired world-facing direction for correct mirroring decisions
    desiredFacingDirection?: FacingDirection; // 'left' | 'right' | 'neutral'
    childLink?: ChildLinkConfig;
    // Lifetime
    lifetimeMs?: number;
    expiresAt?: number;
    activeButtonInteractionKey?: string | null;
    retractableGateCurrentStep?: number;
    retractableGateNextStepAt?: number;
    autoEventRuntime?: AutoEventRuntimeState;
}

interface AutoEventRuntimeState {
    tokens: AutoEventToken[];
    index: number;
    loop: boolean;
    moveRemaining: number;
    moveAxis?: 'x' | 'y';
    moveStep?: number;
    delayUntil?: number;
    waitingForSpc?: boolean;
    waitingForText?: boolean;
    dialogue?: DialogueAsset;
}

interface AutoDialoguePreviewState {
    active: boolean;
    text: string;
    visibleChars: number;
    lastCharAt: number;
    charDelayMs: number;
}

/** Animated tile group state for Z80-faithful tile animation in the simulator */
interface TileAnimGroupState {
    groupId: string;
    baseTileId: string;          // The tile placed on screen (target of animation)
    frameTiles: Tile[];          // All frame tiles in order (frame 0 = base tile visual)
    speed: number;               // Ticks (frames) between animation updates
    currentFrame: number;        // Current frame index
    tickCounter: number;         // Frames elapsed since last frame change
    positions: { x: number; y: number }[];  // Grid positions on screen where base tile appears
    mode: 'frames' | 'transform';
    transformEffect?: string;    // For transform mode
    transformIncludeColors?: boolean;
    transformCheckpoints?: number;
}

interface StateTransitionOptions {
    previousState?: StateMachineState;
    runEnterActions?: boolean;
    runExitActions?: boolean;
    forceEnter?: boolean;
}

const normalizeChildLinkString = (value: any): string | undefined => {
    if (value === undefined || value === null) return undefined;
    const str = `${value}`.trim();
    return str.length > 0 ? str : undefined;
};

const toChildLinkNumber = (value: any): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const parseChildLinkConfig = (template: EntityTemplate, instance: EntityInstance): ChildLinkConfig | undefined => {
    const templateComp = template.components.find(c => c.definitionId === CHILD_LINK_COMPONENT_ID);
    if (!templateComp) return undefined;

    const overrides = instance.componentOverrides?.[CHILD_LINK_COMPONENT_ID] || {};
    const values = {
        ...(templateComp.defaultValues || {}),
        ...overrides
    };

    const parentTemplateId = normalizeChildLinkString(values.parentTemplateId ?? values.parentEntityTemplateId);
    const parentInstanceId = normalizeChildLinkString(values.parentInstanceId);
    const parentInstanceName = normalizeChildLinkString(values.parentInstanceName ?? values.parentName);

    if (!parentTemplateId && !parentInstanceId && !parentInstanceName) {
        return undefined;
    }

    return {
        parentTemplateId,
        parentInstanceId,
        parentInstanceName,
        offsetX: toChildLinkNumber(values.offsetX),
        offsetY: toChildLinkNumber(values.offsetY),
        inheritVelocity: values.inheritVelocity !== false,
        inheritFacing: values.inheritFacing !== false,
        followParentGlobal: values.followParentGlobal !== false,
        detachOnParentLost: values.detachOnParentLost === true,
        mirrorParent: values.mirrorParent === true || values.mirrorParent === 'true'
    };
};

const resolveLifetimeMs = (template: EntityTemplate, instance: EntityInstance, overrideMs?: number): number | undefined => {
    const lifetimeComp = template.components.find(c => c.definitionId === 'comp_lifetime');
    if (!lifetimeComp) return undefined;
    const lifetimeOverride = instance.componentOverrides?.['comp_lifetime']?.lifetimeMs;
    const raw = overrideMs ?? lifetimeOverride ?? (lifetimeComp as any)?.defaultValues?.lifetimeMs ?? (lifetimeComp as any)?.defaultValues?.lifeTimeMs;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const normalizeVariableName = (value?: string | null): string | undefined => {
    if (value === undefined || value === null) return undefined;
    const raw = `${value}`.trim();
    if (!raw) return undefined;
    const separators = ['\u2192', '->', ':', '\u001A'];
    let normalized = raw;
    separators.forEach(separator => {
        if (normalized.includes(separator)) {
            const parts = normalized.split(separator);
            const last = parts[parts.length - 1];
            normalized = last ? last.trim() : normalized;
        }
    });
    return normalized || undefined;
};

// Detect collectibles either by component or by common naming convention (e.g., "coin", "key", "item")
const isCollectibleTemplate = (template: EntityTemplate): boolean => {
    const hasCollectibleComp = template.components?.some(c => c.definitionId === 'comp_collectible');
    if (hasCollectibleComp) return true;
    const name = (template.name || '').toLowerCase();
    return name.includes('coin') || name.includes('key') || name.includes('collectible') || name.includes('item');
};

const isCollectibleEntity = (entity: AnimatedEntity): boolean => isCollectibleTemplate(entity.template);

const coerceGlobalVariableValue = (value: any): any => {
    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '') return true;
        const lowered = trimmed.toLowerCase();
        if (lowered === 'true') return true;
        if (lowered === 'false') return false;
        // Treat type-hint placeholders (e.g. "number", "byte", "word") as 0
        // These come from constants.ts values[] definitions and are not actual values
        if (lowered === 'number' || lowered === 'byte' || lowered === 'word') return 0;
        const numeric = Number(trimmed);
        if (!Number.isNaN(numeric)) {
            return numeric;
        }
        return trimmed;
    }

    if (value === null || value === undefined) {
        return true;
    }

    if (typeof value === 'number') {
        return value;
    }

    return value;
};

const resolveChildLinkParents = (
    entities: AnimatedEntity[],
    entityLookup: Map<string, AnimatedEntity>
) => {
    entities.forEach(entity => {
        const config = entity.childLink;
        if (!config) return;

        if (entity.parentEntityId) {
            const stillExists = entityLookup.get(entity.parentEntityId);
            if (stillExists) {
                return;
            }
        }

        const desiredName = config.parentInstanceName?.toLowerCase();
        let parent: AnimatedEntity | undefined;

        if (config.parentInstanceId) {
            parent = entityLookup.get(config.parentInstanceId);
        }

        if (!parent) {
            parent = entities.find(candidate => {
                if (candidate.instance.id === entity.instance.id) return false;
                const templateMatches = config.parentTemplateId
                    ? (candidate.template.id === config.parentTemplateId ||
                        candidate.template.name === config.parentTemplateId)
                    : true;
                const nameMatches = desiredName
                    ? candidate.instance.name?.toLowerCase() === desiredName
                    : true;
                return templateMatches && nameMatches;
            });
        }

        if (parent) {
            entity.parentEntityId = parent.instance.id;
        } else if (config.detachOnParentLost) {
            entity.parentEntityId = null;
        }
    });
};

const applyChildLinkTransform = (
    child: AnimatedEntity,
    parent: AnimatedEntity,
    config: ChildLinkConfig
) => {
    const rawOffsetX = Number.isFinite(config.offsetX) ? config.offsetX : 0;
    const offsetY = Number.isFinite(config.offsetY) ? config.offsetY : 0;
    const shouldFlipOffsetX = config.mirrorParent && (parent.isFacingMirrored || parent.isMirrored);
    const offsetX = shouldFlipOffsetX ? -rawOffsetX : rawOffsetX;

    child.x = parent.x + offsetX;
    child.y = parent.y + offsetY;

    if (config.inheritVelocity) {
        child.vx = parent.vx;
        child.vy = parent.vy;
    }

    if (config.followParentGlobal) {
        if (parent.globalX !== undefined && parent.globalY !== undefined) {
            child.globalX = parent.globalX + offsetX;
            child.globalY = parent.globalY + offsetY;
        } else {
            child.globalX = undefined;
            child.globalY = undefined;
        }
    }

    if (config.inheritFacing) {
        child.isFacingMirrored = parent.isFacingMirrored;
        child.desiredFacingDirection = parent.desiredFacingDirection;
    }

    if (config.mirrorParent) {
        child.isMirrored = parent.isMirrored;
    }
};

interface GameFlowPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    graphData: GameFlowGraph;
    allAssets: ProjectAsset[];
    msxFont: MSXFont;
    msxFontColorAttributes: MSXFontColorAttributes;
    entityTemplates: EntityTemplate[];
    currentScreenMode: string;
    componentDefinitions: ComponentDefinition[];
    initialIsDynamic?: boolean;
    isPlayMode?: boolean;
    gameFlowAssetName: string;
}

interface EnrichedConnection extends WorldMapConnection {
    targetNodeId: string;
}

export const GameFlowPreviewModal: React.FC<GameFlowPreviewModalProps> = ({
    isOpen,
    onClose,
    graphData,
    allAssets,
    msxFont,
    msxFontColorAttributes,
    entityTemplates,
    currentScreenMode,
    componentDefinitions,
    initialIsDynamic = false,
    isPlayMode = false,
    gameFlowAssetName,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const animationFrameId = useRef<number>();
    const entitiesRef = useRef<AnimatedEntity[]>([]);
    const heroRef = useRef<AnimatedEntity | null>(null);
    const pressedKeys = useRef<Set<string>>(new Set());
    // Track last gamepad-derived keys to emit key transitions cleanly
    const prevGamepadKeysRef = useRef<Set<string>>(new Set());
    // Track previous menu button states for edge detection (SubMenu navigation)
    const menuPadPrevRef = useRef<{ up: boolean; down: boolean; a: boolean; b: boolean }>({ up: false, down: false, a: false, b: false });
    // Refs to invoke actions without TDZ issues
    const handleActionRef = useRef<() => void>(() => { });
    const handleGoBackRef = useRef<() => void>(() => { });
    const checkKeyTransitionsRef = useRef<((entityId: string, key: string, isDown: boolean) => void) | null>(null);
    const expandMenuOptionsRef = useRef<((sub: GameFlowSubMenuNode) => Array<{ text: string, originalIndex: number, isControlOption?: boolean, controlValue?: string }>) | null>(null);
    const jumpKeyProcessed = useRef<boolean>(false);
    const actionKeyProcessed = useRef<boolean>(false); // For pickup/drop action debouncing (e.g., KeyZ)
    const pendingEvents = useRef<Map<string, Set<string>>>(new Map()); // entityId -> Set of event names
    // Box persistence registry: tracks which boxes have been picked up from their original screens
    // Key: "${screenId}_${entityInstanceId}", Value: true if picked up (should not respawn)
    const boxPickedUpRegistry = useRef<Set<string>>(new Set());
    // Collectible items persistence registry: tracks which items have been collected from their original screens
    // Key: "${screenId}_${entityInstanceId}", Value: true if collected (should not respawn)
    const collectedItemsRegistry = useRef<Set<string>>(new Set());
    // Tile collection persistence registry: tracks interactable tiles collected (mapId & 0x08)
    // Key: "${screenId}@${tileX},${tileY}", Value: true if collected (should not respawn)
    const collectedTilesRegistry = useRef<Set<string>>(new Set());
    const consumedInteractionRegistry = useRef<Set<string>>(new Set());
    const autoDialoguePreviewRef = useRef<AutoDialoguePreviewState>({
        active: false,
        text: '',
        visibleChars: 0,
        lastCharAt: 0,
        charDelayMs: 35,
    });
    const autoEventSpaceWasDownRef = useRef(false);
    // Secret passage tiles registry: tracks which background tiles have been revealed (made invisible)
    // Key: "${screenId}_${x}_${y}", Value: true if revealed (should stay hidden)
    const revealedSecretTiles = useRef<Set<string>>(new Set());
    // Spawn anchors for collectibles (e.g., coins) distributed across the screen
    const nucleoPositionsRef = useRef<Array<{ x: number; y: number }>>([]);
    const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
    const [navigationStack, setNavigationStack] = useState<string[]>([]);
    const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
    const [currentScreenMap, setCurrentScreenMap] = useState<ScreenMap | null>(null);
    const [currentWorldMapGraph, setCurrentWorldMapGraph] = useState<WorldMapGraph | null>(null);
    const [isDynamic, setIsDynamic] = useState(initialIsDynamic);
    const [showHitboxDebug, setShowHitboxDebug] = useState(false);
    const [showTileHitboxes, setShowTileHitboxes] = useState(false); // Debug: outlines for solid Collision tiles
    const [showEntityCount, setShowEntityCount] = useState(false);
    const [showStateMachineStates, setShowStateMachineStates] = useState(false); // Show all entity states when StateMachine node is active
    const [visibleEntityCount, setVisibleEntityCount] = useState(0);
    const visibleEntityCountRef = useRef(0);
    const showEntityCountRef = useRef(showEntityCount);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [crtConfig, setCrtConfig] = useState<CRTShaderConfig>(() => {
        const saved = localStorage.getItem('crtShaderConfig');
        return saved ? JSON.parse(saved) : defaultCRTConfig;
    });
    const collectibleDefaultItemType = useMemo(() => {
        const def = componentDefinitions.find(d => d.id === 'comp_collectible');
        const prop = def?.properties?.find(p => p.name === 'itemType');
        return prop?.defaultValue;
    }, [componentDefinitions]);
    const [isCrtConfigOpen, setIsCrtConfigOpen] = useState(false);
    // Carry offset now comes from comp_carry on the Player entity (editable in entity attrs)
    const [gameGlobalVariables, setGameGlobalVariables] = useState<Record<string, any>>({});
    // Keep a live ref for reads inside the animation loop and effects
    const gameGlobalVariablesRef = useRef<Record<string, any>>({});
    useEffect(() => { gameGlobalVariablesRef.current = gameGlobalVariables; }, [gameGlobalVariables]);
    const updateGameGlobalVariables = useCallback((updater: (prev: Record<string, any>) => Record<string, any>) => {
        setGameGlobalVariables(prev => {
            const next = updater(prev);
            gameGlobalVariablesRef.current = next;
            return next;
        });
    }, [setGameGlobalVariables]);
    const allGlobalVariables = useMemo(() => getAllGlobalVariables(allAssets), [allAssets]);
    const applyNodeGlobalInitialization = useCallback((initConfig?: GameFlowGlobalInitializationConfig) => {
        if (!initConfig?.enabled) return;

        const explicitVariables = Array.isArray(initConfig.variables) ? initConfig.variables : [];
        updateGameGlobalVariables(prev => {
            const next: Record<string, any> = { ...prev };

            if (explicitVariables.length > 0) {
                explicitVariables.forEach(entry => {
                    const rawName = entry?.variableName;
                    const resolvedName = normalizeVariableName(rawName) ?? (rawName !== undefined && rawName !== null ? `${rawName}`.trim() : '');
                    if (!resolvedName) return;
                    next[resolvedName] = coerceGlobalVariableValue(entry.value);
                });
                return next;
            }

            allGlobalVariables.forEach(variable => {
                const resolvedName = normalizeVariableName(variable.name) ?? `${variable.name}`.trim();
                if (!resolvedName) return;

                const rawInitialValue = Array.isArray(variable.values) && variable.values.length > 0
                    ? variable.values[0]?.value
                    : 0;

                let initialValue: any = 0;
                if (typeof rawInitialValue === 'boolean') {
                    initialValue = rawInitialValue;
                } else {
                    const parsedValue = Number(rawInitialValue);
                    initialValue = Number.isFinite(parsedValue) ? Math.trunc(parsedValue) : 0;
                }

                next[resolvedName] = initialValue;
            });

            return next;
        });
    }, [allGlobalVariables, updateGameGlobalVariables]);
    // HUD refresh key to make sure overlay re-paints when globals change
    const [hudVersion, setHudVersion] = useState(0);
    useEffect(() => { setHudVersion(v => v + 1); }, [gameGlobalVariables]);
    useEffect(() => {
        showEntityCountRef.current = showEntityCount;
        if (!showEntityCount) {
            visibleEntityCountRef.current = 0;
            setVisibleEntityCount(0);
        }
    }, [showEntityCount]);
    const [gameFlowStack, setGameFlowStack] = useState<Array<{ parentGraphData: GameFlowGraph, returnNodeId: string, parentGameFlowName: string }>>([]);
    const [currentNestedGraphData, setCurrentNestedGraphData] = useState<GameFlowGraph | null>(null);
    const [currentExecutingGameFlowName, setCurrentExecutingGameFlowName] = useState<string>(gameFlowAssetName);
    const [playerEntryPoint, setPlayerEntryPoint] = useState<{ x: number, y: number } | null>(null);
    const [isPositioningMode, setIsPositioningMode] = useState(false);
    const [hoverExitDirection, setHoverExitDirection] = useState<'north' | 'south' | 'east' | 'west' | null>(null);
    const [cursorBlinkOn, setCursorBlinkOn] = useState(true);
    const [runtimeCollisionLayer, setRuntimeCollisionLayer] = useState<ScreenTile[][]>([]);
    const tileBufferNeedsUpdate = useRef<boolean>(false);
    const screenWorldMapRef = useRef<Map<string, ScreenWorldPosition>>(new Map()); // Multi-screen coordinate system
    const tileBufferRef = useRef<HTMLCanvasElement | null>(null);
    const tileAnimGroupsRef = useRef<TileAnimGroupState[]>([]);
    const gameFlowExitRequestedRef = useRef(false);
    const cleanSpritesNextFrameRef = useRef(false);
    const pendingNodeTransitionRef = useRef<string | null>(null);
    const screenTimerRuntimeRef = useRef<{ screenId: string | null; lastTickTime: number; carryMs: number }>({
        screenId: null,
        lastTickTime: 0,
        carryMs: 0,
    });
    const STAGE_TIME_VARIABLE = 'TimeRemaining';
    const STAGE_TIME_SECONDS = 60;

    // Music playback state
    const musicSynthesizerRef = useRef<any>(null); // AYSynthesizer instance for music
    const musicPlaybackIntervalRef = useRef<number | null>(null);
    const currentMusicTrackIdRef = useRef<string | null>(null);
    const musicIsMutedRef = useRef<boolean>(false);

    const currentGraphData = currentNestedGraphData || graphData;
    const { nodes, connections } = currentGraphData;
    const currentNode = nodes.find(node => node.id === currentNodeId);

    useEffect(() => {
        if (currentNode?.type === 'Start' || currentNode?.type === 'WorldLink') {
            applyNodeGlobalInitialization(currentNode.initializeGlobals);
        }
    }, [currentNodeId, currentNode, applyNodeGlobalInitialization]);


    // Refs to share state between callbacks and effects
    const currentScreenMapRef = useRef<ScreenMap | null>(null);
    const currentWorldMapGraphRef = useRef<WorldMapGraph | null>(null);
    const setPlayerEntryPointRef = useRef<(entry: { x: number; y: number } | null) => void>(() => { });
    const handleScreenTransitionRef = useRef<(toNodeId: string) => void>(() => { });
    const runtimeCollisionLayerRef = useRef<ScreenTile[][]>([]);
    // HUD config persistence: both the imported frame and the full hudConfiguration persist across screen transitions
    const hudImportedFrameRef = useRef<any>(null);
    const hudConfigRef = useRef<any>(null);
    // Cooldown to avoid immediate re-trigger of screen exits after a transition
    const lastScreenTransitionTimeRef = useRef<number>(0);
    const hudBufferRef = useRef<HTMLCanvasElement | null>(null);
    // Prevent duplicate item collisions within a single frame
    const collisionItemFrameGuardRef = useRef<Set<string>>(new Set());
    // Prevent double variable increments for the same collectible within a frame
    const processedCollectibleScoreRef = useRef<Set<string>>(new Set());

    const previewScreenMode = useMemo(
        () => resolveScreenModeForMap(currentScreenMap, currentScreenMode),
        [currentScreenMap, currentScreenMode]
    );
    const screenModeMetrics = useMemo(() => getScreenModeMetrics(previewScreenMode), [previewScreenMode]);
    const TILE_SIZE = screenModeMetrics.baseTileSize || 8;
    const gridWidthTiles = currentScreenMap?.width ?? screenModeMetrics.widthTiles;
    const gridHeightTiles = currentScreenMap?.height ?? screenModeMetrics.heightTiles;
    const PREVIEW_WIDTH = gridWidthTiles * TILE_SIZE;
    const PREVIEW_HEIGHT = gridHeightTiles * TILE_SIZE;
    const resolveTemplateComponentValues = useCallback((template: EntityTemplate, instance: EntityInstance, compId: string): Record<string, any> | null => {
        const templateComp = template.components.find(c => c.definitionId === compId);
        const overrides = instance.componentOverrides?.[compId];
        if (!templateComp && !overrides) return null;
        return {
            ...(templateComp?.defaultValues || {}),
            ...(overrides || {})
        };
    }, []);
    const createAutoEventRuntime = useCallback((template: EntityTemplate, instance: EntityInstance): AutoEventRuntimeState | undefined => {
        const values = resolveTemplateComponentValues(template, instance, 'comp_auto_control_script');
        if (!values) return undefined;
        if (values.enabled === false || values.enabled === 'false') return undefined;
        if (values.startsOnScreenLoad === false || values.startsOnScreenLoad === 'false') return undefined;
        if (String(values.scriptFormat || 'commands') !== 'eventString') return undefined;

        const dialogueAssetId = String(values.defaultDialogueAssetId || '');
        const dialogueAsset = allAssets.find(asset => asset.id === dialogueAssetId && asset.type === 'dialogue');
        const dialogue = dialogueAsset?.data as DialogueAsset | undefined;
        const parsed = parseAutoEventString(String(values.eventString || ''), dialogue);
        if (parsed.tokens.length === 0) return undefined;

        return {
            tokens: parsed.tokens,
            index: 0,
            loop: values.loop === true || values.loop === 'true',
            moveRemaining: 0,
            dialogue,
        };
    }, [allAssets, resolveTemplateComponentValues]);
    const drawAutoDialoguePreview = useCallback((ctx: CanvasRenderingContext2D) => {
        const state = autoDialoguePreviewRef.current;
        if (!state.active) return;

        const boxX = Math.max(8, Math.floor(PREVIEW_WIDTH * 0.08));
        const boxW = Math.max(64, Math.floor(PREVIEW_WIDTH * 0.84));
        const boxH = Math.max(32, Math.floor(PREVIEW_HEIGHT * 0.22));
        const boxY = Math.max(8, PREVIEW_HEIGHT - boxH - 8);
        const visibleText = state.text.slice(0, state.visibleChars);

        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '8px monospace';
        ctx.textBaseline = 'top';

        const maxChars = Math.max(8, Math.floor((boxW - 16) / 5));
        const words = visibleText.split(/\s+/).filter(Boolean);
        const lines: string[] = [];
        let line = '';
        for (const word of words) {
            const next = line ? `${line} ${word}` : word;
            if (next.length > maxChars && line) {
                lines.push(line);
                line = word;
            } else {
                line = next;
            }
            if (lines.length >= 3) break;
        }
        if (line && lines.length < 3) lines.push(line);
        lines.forEach((textLine, index) => {
            ctx.fillText(textLine, boxX + 8, boxY + 8 + index * 10);
        });
        ctx.restore();
    }, [PREVIEW_HEIGHT, PREVIEW_WIDTH]);
    const updateAutoEventRuntime = useCallback((entity: AnimatedEntity, nowMs: number) => {
        const runtime = entity.autoEventRuntime;
        if (!runtime || runtime.tokens.length === 0) return;

        const dialogueState = autoDialoguePreviewRef.current;
        const spaceDown = pressedKeys.current.has(' ');
        const spacePressed = spaceDown && !autoEventSpaceWasDownRef.current;

        if (dialogueState.active && dialogueState.visibleChars < dialogueState.text.length && nowMs - dialogueState.lastCharAt >= dialogueState.charDelayMs) {
            dialogueState.visibleChars += 1;
            dialogueState.lastCharAt = nowMs;
        }

        if (runtime.moveRemaining > 0 && runtime.moveAxis && runtime.moveStep) {
            const step = Math.min(runtime.moveRemaining, Math.abs(runtime.moveStep));
            if (runtime.moveAxis === 'x') {
                entity.x += runtime.moveStep > 0 ? step : -step;
                entity.vx = runtime.moveStep > 0 ? 1 : -1;
                entity.vy = 0;
            } else {
                entity.y += runtime.moveStep > 0 ? step : -step;
                entity.vy = runtime.moveStep > 0 ? 1 : -1;
                entity.vx = 0;
            }
            runtime.moveRemaining -= step;
            if (runtime.moveRemaining > 0) return;
            entity.vx = 0;
            entity.vy = 0;
            runtime.moveAxis = undefined;
            runtime.moveStep = undefined;
        }

        if (runtime.delayUntil !== undefined) {
            if (nowMs < runtime.delayUntil) return;
            runtime.delayUntil = undefined;
        }

        if (runtime.waitingForText) {
            if (dialogueState.visibleChars < dialogueState.text.length) return;
            runtime.waitingForText = false;
        }

        if (runtime.waitingForSpc) {
            if (!spacePressed) return;
            runtime.waitingForSpc = false;
        }

        let guard = 0;
        while (guard < 8) {
            guard += 1;
            const token = runtime.tokens[runtime.index];
            if (!token) {
                if (runtime.loop) {
                    runtime.index = 0;
                    continue;
                }
                entity.autoEventRuntime = undefined;
                entity.vx = 0;
                entity.vy = 0;
                return;
            }
            runtime.index += 1;

            if (token.type === 'move') {
                runtime.moveRemaining = Math.abs(token.amount);
                runtime.moveAxis = token.axis;
                runtime.moveStep = token.amount >= 0 ? 1 : -1;
                return;
            }
            if (token.type === 'delay') {
                runtime.delayUntil = nowMs + token.ms;
                return;
            }
            if (token.type === 'openDialog') {
                dialogueState.active = true;
                dialogueState.text = '';
                dialogueState.visibleChars = 0;
                dialogueState.lastCharAt = nowMs;
                continue;
            }
            if (token.type === 'writeLine') {
                const line = runtime.dialogue?.lines?.[token.lineNumber - 1];
                const text = `${line?.speaker?.trim() ? `${line.speaker.trim()}: ` : ''}${line?.text || ''}`.trim();
                dialogueState.active = true;
                dialogueState.text = text;
                dialogueState.visibleChars = 0;
                dialogueState.lastCharAt = nowMs;
                runtime.waitingForText = true;
                return;
            }
            if (token.type === 'waitText') {
                runtime.waitingForText = true;
                return;
            }
            if (token.type === 'waitSpc') {
                runtime.waitingForSpc = true;
                return;
            }
            if (token.type === 'clearDialog') {
                dialogueState.text = '';
                dialogueState.visibleChars = 0;
                dialogueState.lastCharAt = nowMs;
                continue;
            }
            if (token.type === 'closeDialog') {
                dialogueState.active = false;
                dialogueState.text = '';
                dialogueState.visibleChars = 0;
                continue;
            }
        }
    }, []);
    const getScreenActiveBoundsPx = useCallback((screen: ScreenMap | null | undefined) => {
        const screenWidthTiles = Math.max(1, screen?.width ?? screenModeMetrics.widthTiles);
        const screenHeightTiles = Math.max(1, screen?.height ?? screenModeMetrics.heightTiles);
        const activeAreaX = Math.max(0, Math.min(screenWidthTiles - 1, screen?.activeAreaX ?? 0));
        const activeAreaY = Math.max(0, Math.min(screenHeightTiles - 1, screen?.activeAreaY ?? 0));
        const activeAreaWidth = Math.max(1, Math.min(screenWidthTiles - activeAreaX, screen?.activeAreaWidth ?? screenWidthTiles));
        const activeAreaHeight = Math.max(1, Math.min(screenHeightTiles - activeAreaY, screen?.activeAreaHeight ?? screenHeightTiles));
        return {
            leftPx: activeAreaX * TILE_SIZE,
            topPx: activeAreaY * TILE_SIZE,
            rightPx: (activeAreaX + activeAreaWidth) * TILE_SIZE,
            bottomPx: (activeAreaY + activeAreaHeight) * TILE_SIZE,
        };
    }, [TILE_SIZE, screenModeMetrics.heightTiles, screenModeMetrics.widthTiles]);
    const getArrowCursor = useCallback((direction: 'north' | 'south' | 'east' | 'west') => {
        const rotation = direction === 'east' ? 0 : direction === 'south' ? 90 : direction === 'west' ? 180 : -90;
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><polygon points='8,4 26,16 8,28 8,20 2,20 2,12 8,12' fill='red' transform='rotate(${rotation} 16 16)'/></svg>`;
        const encoded = encodeURIComponent(svg);
        return `url(\"data:image/svg+xml,${encoded}\") 16 16, auto`;
    }, []);
    useEffect(() => {
        if (!hoverExitDirection) {
            setCursorBlinkOn(true);
            return;
        }
        const id = window.setInterval(() => setCursorBlinkOn(prev => !prev), 450);
        return () => window.clearInterval(id);
    }, [hoverExitDirection]);
    const buildFramesForSprite = (spriteData: Sprite) => {
        const frames = spriteData.frames.map(frame => {
            const img = new Image();
            img.src = createSpriteDataURL(frame.data, spriteData.size.width, spriteData.size.height);
            return img;
        });
        let mirroredFrames: HTMLImageElement[] | undefined;
        if (['right', 'left'].includes(spriteData.facingDirection)) {
            mirroredFrames = spriteData.frames.map(frame => {
                const img = new Image();
                img.src = createSpriteDataURL(mirrorPixelDataHorizontally(frame.data), spriteData.size.width, spriteData.size.height);
                return img;
            });
        }
        return { frames, mirroredFrames };
    };
    const applySpriteToEntity = (entity: AnimatedEntity, spriteData: Sprite, spriteAssetId?: string) => {
        const built = buildFramesForSprite(spriteData);
        entity.sprite = spriteData;
        entity.frameImages = built.frames;
        entity.mirroredFrameImages = built.mirroredFrames;
        entity.currentFrame = 0;
        entity.lastFrameUpdateTime = performance.now();
        if (spriteAssetId) {
            entity.spriteAssetId = spriteAssetId;
        }
    };
    const restoreSpriteAfterCarry = (entity: AnimatedEntity) => {
        const backup = entity.carrySpriteBackup;
        if (!backup) return;
        entity.sprite = backup.sprite;
        entity.frameImages = backup.frameImages;
        entity.mirroredFrameImages = backup.mirroredFrameImages;
        entity.currentFrame = backup.currentFrame ?? 0;
        entity.spriteAssetId = backup.spriteAssetId;
        entity.lastFrameUpdateTime = performance.now();
        entity.carrySpriteBackup = undefined;
    };

    const formatHudValue = (value: any, digits?: number): string | undefined => {
        if (value === undefined || value === null) return undefined;
        const parsedDigits = Number.isFinite(digits) ? Math.max(0, Number(digits)) : undefined;
        const numeric = Number(value);
        if (!Number.isNaN(numeric)) {
            const asInt = Math.floor(numeric);
            return parsedDigits !== undefined ? Math.max(0, asInt).toString().padStart(parsedDigits, '0') : asInt.toString();
        }
        return String(value);
    };

    const getGlobalVariableValue = (rawName?: string | null): any => {
        const resolved = normalizeVariableName(rawName);
        if (!resolved) return undefined;
        const current = gameGlobalVariablesRef.current || {};
        // Direct hit
        if (resolved in current) return current[resolved];
        // Case-insensitive / normalized fallback
        const lower = resolved.toLowerCase();
        const matchKey = Object.keys(current).find(k => (normalizeVariableName(k) ?? k).toLowerCase() === lower);
        return matchKey ? current[matchKey] : undefined;
    };

    const resetScreenTimer = useCallback((screenId?: string | null) => {
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        screenTimerRuntimeRef.current = {
            screenId: screenId ?? currentScreenMapRef.current?.id ?? null,
            lastTickTime: now,
            carryMs: 0,
        };
        updateGameGlobalVariables(prev => ({
            ...prev,
            [STAGE_TIME_VARIABLE]: STAGE_TIME_SECONDS
        }));
    }, [updateGameGlobalVariables]);

    const resolveHudText = (hudEl: any): string => {
        const rawText = (hudEl as any).text || (hudEl as any).name || '';
        if (!rawText) return '';
        const digits = Number((hudEl as any).details?.digits);
        const safeDigits = Number.isFinite(digits) ? digits : undefined;

        // 1) Replace {{variable}} placeholders with matching global variable values
        const placeholderRegex = /\{\{\s*([^{}]+?)\s*\}\}/g;
        let replaced = false;
        const withPlaceholders = rawText.replace(placeholderRegex, (full, varNameRaw) => {
            const varName = normalizeVariableName(varNameRaw) ?? (typeof varNameRaw === 'string' ? varNameRaw.trim() : `${varNameRaw}`);
            const formatted = varName ? formatHudValue(getGlobalVariableValue(varName), safeDigits) : undefined;
            if (formatted !== undefined) {
                replaced = true;
                return formatted;
            }
            return full;
        });
        if (replaced) return withPlaceholders;

        // 2) Fallback: infer variable name from HUD type or explicit detail fields
        const explicitVarName = normalizeVariableName(
            (hudEl as any).details?.variableName ??
            (hudEl as any).details?.globalVariableName ??
            (hudEl as any).details?.bindingVariable
        );
        const defaultVarName = (() => {
            switch ((hudEl as any).type) {
                case 'Score': return 'Score';
                case 'HighScore': return 'HighScore';
                case 'Lives': return 'Lives';
                case 'CoinCounter': return 'Coin';
                case 'CustomCounter': return (hudEl as any).text || (hudEl as any).name;
                default: return undefined;
            }
        })();
        const resolvedVarName = explicitVarName ?? normalizeVariableName(defaultVarName);
        const formattedFallback = resolvedVarName ? formatHudValue(getGlobalVariableValue(resolvedVarName), safeDigits) : undefined;
        if (formattedFallback !== undefined) {
            if (safeDigits && safeDigits > 0) {
                const digitPattern = new RegExp(`\\d{${safeDigits}}`);
                if (digitPattern.test(rawText)) {
                    return rawText.replace(digitPattern, formattedFallback.padStart(safeDigits, '0'));
                }
            }
            const digitMatches = rawText.match(/\d+/g);
            if (digitMatches && digitMatches.length > 0) {
                const target = digitMatches[digitMatches.length - 1];
                return rawText.replace(target, formattedFallback);
            }
            return `${rawText} ${formattedFallback}`;
        }

        return rawText;
    };

    // Pre-render HUD text (mirrors Screen Editor HUD renderer so text appears in GameFlow)
    useEffect(() => {
        // Use current screen's HUD config, or fall back to the persisted one from the first screen
        const hudConfig = currentScreenMap?.hudConfiguration?.elements?.length
            ? currentScreenMap.hudConfiguration
            : hudConfigRef.current;
        if (!hudConfig?.elements?.length) {
            hudBufferRef.current = null;
            return;
        }

        const canvas = hudBufferRef.current ?? document.createElement('canvas');
        canvas.width = PREVIEW_WIDTH;
        canvas.height = PREVIEW_HEIGHT;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);

        const textBasedTypes = new Set([
            'Score', 'HighScore', 'Lives', 'SceneName', 'CoinCounter',
            'AttackAlert', 'TextBox', 'NumericField', 'CustomCounter'
        ]);

        const tileBanks: TileBank[] = allAssets
            .filter(a => a.type === 'tilebank' || a.type === 'tilebanks')
            .map(a => a.data as TileBank);

        for (const hudEl of hudConfig.elements) {
            if (!hudEl || (hudEl as any).visible === false) continue;
            const isTextBased = textBasedTypes.has((hudEl as any).type);
            const rawText = (hudEl as any).text || (hudEl as any).name;
            const resolvedText = isTextBased ? resolveHudText(hudEl) : rawText;
            if (!isTextBased || !resolvedText) continue;

            const charSpacing = (hudEl as any).details?.charSpacing || 0;
            const hudTextColor = (hudEl as any).details?.textColor;
            const hudBackgroundColor = (hudEl as any).details?.textBackgroundColor;

            const dataUrl = renderUnifiedTextToDataURL(
                resolvedText,
                tileBanks.length ? tileBanks : undefined,
                allAssets,
                msxFont,
                msxFontColorAttributes,
                1,
                charSpacing,
                hudTextColor,
                hudBackgroundColor
            );

            if (!dataUrl) continue;

            const img = new Image();
            img.src = dataUrl;
            const draw = () => ctx.drawImage(img, (hudEl as any).position?.x || 0, (hudEl as any).position?.y || 0);
            if (img.complete && img.naturalWidth > 0) {
                draw();
            } else {
                img.onload = draw;
            }
        }

        hudBufferRef.current = canvas;
    }, [currentScreenMap, allAssets, msxFont, msxFontColorAttributes, PREVIEW_WIDTH, PREVIEW_HEIGHT, hudVersion]);
    const switchToCarrySpriteIfConfigured = (entity: AnimatedEntity) => {
        const carryTemplateComp = entity.template.components.find(c => c.definitionId === 'comp_carry');
        if (!carryTemplateComp) return;
        const carryProps = {
            ...(carryTemplateComp.defaultValues || {}),
            ...(entity.instance.componentOverrides?.comp_carry || {})
        } as any;
        const carrySpriteId = carryProps.carrySpriteAssetId || carryProps.carrySprite || carryProps.carrySpriteId || carryProps.spriteAssetId;
        if (!carrySpriteId) return;
        if (!entity.carrySpriteBackup) {
            entity.carrySpriteBackup = {
                sprite: entity.sprite,
                frameImages: entity.frameImages,
                mirroredFrameImages: entity.mirroredFrameImages,
                currentFrame: entity.currentFrame,
                spriteAssetId: entity.spriteAssetId
            };
        }
        const carrySpriteAsset = allAssets.find(a =>
            a.type === 'sprite' && (
                a.id === carrySpriteId ||
                a.name === carrySpriteId ||
                (a.data as any)?.id === carrySpriteId ||
                (a.data as any)?.name === carrySpriteId
            )
        );
        const carrySpriteData = carrySpriteAsset?.data as Sprite | undefined;
        if (!carrySpriteData) return;
        applySpriteToEntity(entity, carrySpriteData, carrySpriteAsset.id);
    };

    const refreshVisibleEntityCount = useCallback((currentScreenId?: string | null) => {
        if (!showEntityCountRef.current) return;

        if (!currentScreenId) {
            if (visibleEntityCountRef.current !== 0) {
                visibleEntityCountRef.current = 0;
                setVisibleEntityCount(0);
            }
            return;
        }

        const entityLookup = new Map<string, AnimatedEntity>();
        for (const entity of entitiesRef.current) {
            entityLookup.set(entity.instance.id, entity);
        }

        let count = 0;
        for (const entity of entitiesRef.current) {
            if ((entity as any).markedForDestruction) continue;

            const childLinkConfig = entity.childLink;
            const parent = childLinkConfig && entity.parentEntityId
                ? entityLookup.get(entity.parentEntityId)
                : undefined;
            const isChildOfVisibleParent =
                !!childLinkConfig &&
                !!parent &&
                parent.ownerScreenId === currentScreenId;

            if (
                entity.ownerScreenId &&
                entity.ownerScreenId !== currentScreenId &&
                !isChildOfVisibleParent
            ) {
                continue;
            }

            const isBox = entity.template.components?.some(c => c.definitionId === 'comp_box') || /box/i.test(entity.template.name);
            if (isBox) {
                const shouldCountBox = entity.ownerScreenId === null ||
                    entity.ownerScreenId === currentScreenId ||
                    isChildOfVisibleParent;

                if (!shouldCountBox) continue;
            }

            const isCollectible = isCollectibleEntity(entity);
            if (isCollectible) {
                const shouldCountCollectible =
                    entity.ownerScreenId === currentScreenId ||
                    isChildOfVisibleParent;

                if (!shouldCountCollectible) continue;
            }

            count += 1;
        }

        if (visibleEntityCountRef.current !== count) {
            visibleEntityCountRef.current = count;
            setVisibleEntityCount(count);
        }
    }, []);

    const isGamepadAllowed = useCallback(() => {
        const t = (gameGlobalVariables?.CONTROL_TYPE || '').toString().toUpperCase();
        if (t === 'KEYS' || t === 'CURSORS') return false;
        if (t === 'JOYSTICK') return true;
        // Default: allow if unset
        return true;
    }, [gameGlobalVariables]);

    // Map a connected gamepad to our pressedKeys set (A=fire, B=jump; D-Pad/Left stick for arrows)
    const syncGamepadToPressedKeys = useCallback(() => {
        // Only process during gameplay where keys are read continuously
        if (!isOpen) return;
        if (!isGamepadAllowed()) {
            // Clear any previously injected keys
            for (const key of prevGamepadKeysRef.current) {
                if (pressedKeys.current.has(key)) pressedKeys.current.delete(key);
            }
            prevGamepadKeysRef.current.clear();
            return;
        }
        // Try to get first connected gamepad
        const gps = (typeof navigator !== 'undefined' && navigator.getGamepads) ? navigator.getGamepads() : [] as any;
        const gp = gps && Array.isArray(gps) ? (gps.find(g => g && g.connected) as Gamepad | undefined) : undefined;
        const newKeys = new Set<string>();
        if (gp) {
            // Standard mapping: buttons 12..15 -> dpad U/D/L/R
            const btn = gp.buttons || [];
            const axes = gp.axes || [];
            const pressed = (i: number) => !!btn[i] && btn[i].pressed === true;
            // D-Pad
            if (pressed(12)) newKeys.add('ArrowUp');
            if (pressed(13)) newKeys.add('ArrowDown');
            if (pressed(14)) newKeys.add('ArrowLeft');
            if (pressed(15)) newKeys.add('ArrowRight');
            // Left stick with threshold acts as arrows too
            const AXIS_THRESHOLD = 0.5;
            const axX = axes[0] ?? 0;
            const axY = axes[1] ?? 0;
            if (axX <= -AXIS_THRESHOLD) newKeys.add('ArrowLeft');
            if (axX >= AXIS_THRESHOLD) newKeys.add('ArrowRight');
            if (axY <= -AXIS_THRESHOLD) newKeys.add('ArrowUp');
            if (axY >= AXIS_THRESHOLD) newKeys.add('ArrowDown');
            // Buttons: 0 (A) -> Fire (KeyX), 1 (B) -> Jump (Space), 2 (X) -> Grab (KeyN)
            if (pressed(0)) newKeys.add('KeyX');
            if (pressed(1)) newKeys.add(' ');
            if (pressed(2)) newKeys.add('KeyN');
        }

        const prev = prevGamepadKeysRef.current;
        // Added keys
        for (const key of newKeys) {
            if (!prev.has(key)) {
                // New press
                if (!pressedKeys.current.has(key)) {
                    pressedKeys.current.add(key);
                }
                // Emit state machine key transitions for arrows
                if (heroRef.current && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
                    try { checkKeyTransitionsRef.current?.(heroRef.current.instance.id, key, true); } catch { }
                }
            }
        }
        // Released keys
        for (const key of prev) {
            if (!newKeys.has(key)) {
                if (pressedKeys.current.has(key)) {
                    pressedKeys.current.delete(key);
                }
                if (heroRef.current && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
                    try { checkKeyTransitionsRef.current?.(heroRef.current.instance.id, key, false); } catch { }
                }
            }
        }
        prevGamepadKeysRef.current = newKeys;
    }, [isOpen, isGamepadAllowed]);

    // Handle SubMenu navigation via gamepad (D-Pad Up/Down, A=accept, B=back)
    const syncGamepadForMenu = useCallback(() => {
        if (!isOpen) return;
        if (!isGamepadAllowed()) return;
        if (!currentNode || currentNode.type !== 'SubMenu') return;
        const gps = (typeof navigator !== 'undefined' && navigator.getGamepads) ? navigator.getGamepads() : [] as any;
        const gp = gps && Array.isArray(gps) ? (gps.find(g => g && g.connected) as Gamepad | undefined) : undefined;
        if (!gp) return;
        const btn = gp.buttons || [];
        const axes = gp.axes || [];
        const pressed = (i: number) => !!btn[i] && btn[i].pressed === true;
        const AXIS_THRESHOLD = 0.5;
        const up = pressed(12) || ((axes[1] ?? 0) <= -AXIS_THRESHOLD);
        const down = pressed(13) || ((axes[1] ?? 0) >= AXIS_THRESHOLD);
        const a = pressed(0);
        const b = pressed(1);
        const prev = menuPadPrevRef.current;

        const subMenuNode = currentNode as GameFlowSubMenuNode;
        const expandedOptions = (expandMenuOptionsRef.current
            ? expandMenuOptionsRef.current(subMenuNode)
            : []);
        const maxIndex = expandedOptions.length - 1;

        // Rising edges only to avoid fast repeats
        if (up && !prev.up) setSelectedOptionIndex(prevIdx => Math.max(0, prevIdx - 1));
        if (down && !prev.down) setSelectedOptionIndex(prevIdx => Math.min(maxIndex, prevIdx + 1));
        if (a && !prev.a) handleActionRef.current();
        if (b && !prev.b) handleGoBackRef.current();

        menuPadPrevRef.current = { up, down, a, b };
    }, [isOpen, isGamepadAllowed, currentNode]);

    // Handler para posicionar al player con click
    const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isPositioningMode || !isDynamic || currentNode?.type !== 'WorldLink') return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Calcular coordenadas relativas al canvas (considerando el scale)
        const rect = canvas.getBoundingClientRect();
        const scale = isFullscreen ? 4 : 2;
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        // Encontrar la entidad player (la que tiene comp_player_input o comp_cursors)
        const playerEntity = entitiesRef.current.find(entity =>
            entity.template.components.some(c =>
                c.definitionId === 'comp_player_input' ||
                c.definitionId === 'comp_cursors' ||
                c.definitionId === 'comp_input'
            )
        );

        if (playerEntity) {
            // Move the player to the click position (sprite centered)
            playerEntity.x = x - playerEntity.sprite.size.width / 2;
            playerEntity.y = y - playerEntity.sprite.size.height / 2;
        }
    }, [isPositioningMode, isDynamic, currentNode, isFullscreen]);

    const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (currentNode?.type !== 'WorldLink' || !currentWorldMapGraph || !currentScreenMap) {
            if (hoverExitDirection) setHoverExitDirection(null);
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scale = isFullscreen ? 4 : 2;
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;
        const margin = 10;

        let direction: 'north' | 'south' | 'east' | 'west' | null = null;
        if (x <= margin) direction = 'west';
        else if (x >= PREVIEW_WIDTH - margin) direction = 'east';
        else if (y <= margin) direction = 'north';
        else if (y >= PREVIEW_HEIGHT - margin) direction = 'south';

        if (!direction) {
            if (hoverExitDirection) setHoverExitDirection(null);
            return;
        }

        const currentScreenNode = currentWorldMapGraph.nodes.find(n => n.screenAssetId === currentScreenMap.id);
        const hasExit = currentScreenNode
            ? currentWorldMapGraph.connections.some(conn =>
                (conn.fromNodeId === currentScreenNode.id && conn.fromDirection === direction) ||
                (conn.toNodeId === currentScreenNode.id && conn.toDirection === direction)
            )
            : false;

        setHoverExitDirection(hasExit ? direction : null);
    }, [currentNode, currentWorldMapGraph, currentScreenMap, isFullscreen, PREVIEW_WIDTH, PREVIEW_HEIGHT, hoverExitDirection]);

    // Modify a tile inside the runtime collision layer
    const modifyTileInLayer = useCallback((tileX: number, tileY: number, newTileId: string | null) => {
        const currentLayer = runtimeCollisionLayerRef.current;
        const maxRows = currentLayer.length || currentScreenMapRef.current?.height || 0;
        const maxCols = (currentLayer[0]?.length ?? currentScreenMapRef.current?.width) || 0;
        if (tileY < 0 || tileY >= maxRows || tileX < 0 || tileX >= maxCols) {
            return;
        }

        setRuntimeCollisionLayer(prev => {
            const newLayer = JSON.parse(JSON.stringify(prev));
            if (!newLayer[tileY]) newLayer[tileY] = [];
            newLayer[tileY][tileX] = { tileId: newTileId };
            runtimeCollisionLayerRef.current = newLayer;
            return newLayer;
        });

        tileBufferNeedsUpdate.current = true;

    }, []);

    const moveTileAreaInLayer = useCallback((
        sourceX: number,
        sourceY: number,
        width: number,
        height: number,
        direction: 'up' | 'down' | 'left' | 'right',
        distance: number,
        fillTileId: string | null
    ) => {
        const currentLayer = runtimeCollisionLayerRef.current;
        const maxRows = currentLayer.length || currentScreenMapRef.current?.height || 0;
        const maxCols = (currentLayer[0]?.length ?? currentScreenMapRef.current?.width) || 0;
        if (width <= 0 || height <= 0 || distance <= 0 || maxRows <= 0 || maxCols <= 0) {
            return;
        }

        const offsets: Record<'up' | 'down' | 'left' | 'right', { x: number; y: number }> = {
            up: { x: 0, y: -1 },
            down: { x: 0, y: 1 },
            left: { x: -1, y: 0 },
            right: { x: 1, y: 0 },
        };
        const offset = offsets[direction] || offsets.up;
        const safeSourceX = Math.trunc(sourceX);
        const safeSourceY = Math.trunc(sourceY);
        const safeWidth = Math.max(1, Math.trunc(width));
        const safeHeight = Math.max(1, Math.trunc(height));
        const safeDistance = Math.max(1, Math.trunc(distance));
        const sourceSnapshot: { tileId: string | null }[][] = [];

        for (let row = 0; row < safeHeight; row++) {
            const snapshotRow: { tileId: string | null }[] = [];
            for (let col = 0; col < safeWidth; col++) {
                const sampleX = safeSourceX + col;
                const sampleY = safeSourceY + row;
                snapshotRow.push({
                    tileId: sampleX >= 0 && sampleX < maxCols && sampleY >= 0 && sampleY < maxRows
                        ? (currentLayer[sampleY]?.[sampleX]?.tileId ?? null)
                        : null,
                });
            }
            sourceSnapshot.push(snapshotRow);
        }

        setRuntimeCollisionLayer(prev => {
            const nextLayer = JSON.parse(JSON.stringify(prev));

            for (let row = 0; row < safeHeight; row++) {
                for (let col = 0; col < safeWidth; col++) {
                    const clearX = safeSourceX + col;
                    const clearY = safeSourceY + row;
                    if (clearX >= 0 && clearX < maxCols && clearY >= 0 && clearY < maxRows) {
                        if (!nextLayer[clearY]) nextLayer[clearY] = [];
                        nextLayer[clearY][clearX] = { tileId: fillTileId };
                    }
                }
            }

            const targetBaseX = safeSourceX + (offset.x * safeDistance);
            const targetBaseY = safeSourceY + (offset.y * safeDistance);

            for (let row = 0; row < safeHeight; row++) {
                for (let col = 0; col < safeWidth; col++) {
                    const destX = targetBaseX + col;
                    const destY = targetBaseY + row;
                    if (destX >= 0 && destX < maxCols && destY >= 0 && destY < maxRows) {
                        if (!nextLayer[destY]) nextLayer[destY] = [];
                        nextLayer[destY][destX] = { tileId: sourceSnapshot[row]?.[col]?.tileId ?? null };
                    }
                }
            }

            runtimeCollisionLayerRef.current = nextLayer;
            return nextLayer;
        });

        tileBufferNeedsUpdate.current = true;
    }, []);

    const shiftTileAreaInLayer = useCallback((
        sourceX: number,
        sourceY: number,
        width: number,
        height: number,
        direction: 'up' | 'down' | 'left' | 'right',
        distance: number,
        fillTileId: string | null
    ) => {
        const currentLayer = runtimeCollisionLayerRef.current;
        const maxRows = currentLayer.length || currentScreenMapRef.current?.height || 0;
        const maxCols = (currentLayer[0]?.length ?? currentScreenMapRef.current?.width) || 0;
        if (width <= 0 || height <= 0 || distance <= 0 || maxRows <= 0 || maxCols <= 0) {
            return;
        }

        const safeSourceX = Math.trunc(sourceX);
        const safeSourceY = Math.trunc(sourceY);
        const safeWidth = Math.max(1, Math.trunc(width));
        const safeHeight = Math.max(1, Math.trunc(height));
        const safeDistance = Math.max(1, Math.trunc(distance));

        setRuntimeCollisionLayer(prev => {
            const nextLayer = JSON.parse(JSON.stringify(prev));

            for (let step = 0; step < safeDistance; step++) {
                if (direction === 'up') {
                    for (let row = 0; row < safeHeight - 1; row++) {
                        for (let col = 0; col < safeWidth; col++) {
                            const destX = safeSourceX + col;
                            const destY = safeSourceY + row;
                            const srcY = destY + 1;
                            if (destX < 0 || destX >= maxCols || destY < 0 || destY >= maxRows || srcY < 0 || srcY >= maxRows) continue;
                            if (!nextLayer[destY]) nextLayer[destY] = [];
                            nextLayer[destY][destX] = { tileId: nextLayer[srcY]?.[destX]?.tileId ?? null };
                        }
                    }
                    const fillY = safeSourceY + safeHeight - 1;
                    for (let col = 0; col < safeWidth; col++) {
                        const fillX = safeSourceX + col;
                        if (fillX < 0 || fillX >= maxCols || fillY < 0 || fillY >= maxRows) continue;
                        if (!nextLayer[fillY]) nextLayer[fillY] = [];
                        nextLayer[fillY][fillX] = { tileId: fillTileId };
                    }
                } else if (direction === 'down') {
                    for (let row = safeHeight - 1; row > 0; row--) {
                        for (let col = 0; col < safeWidth; col++) {
                            const destX = safeSourceX + col;
                            const destY = safeSourceY + row;
                            const srcY = destY - 1;
                            if (destX < 0 || destX >= maxCols || destY < 0 || destY >= maxRows || srcY < 0 || srcY >= maxRows) continue;
                            if (!nextLayer[destY]) nextLayer[destY] = [];
                            nextLayer[destY][destX] = { tileId: nextLayer[srcY]?.[destX]?.tileId ?? null };
                        }
                    }
                    const fillY = safeSourceY;
                    for (let col = 0; col < safeWidth; col++) {
                        const fillX = safeSourceX + col;
                        if (fillX < 0 || fillX >= maxCols || fillY < 0 || fillY >= maxRows) continue;
                        if (!nextLayer[fillY]) nextLayer[fillY] = [];
                        nextLayer[fillY][fillX] = { tileId: fillTileId };
                    }
                } else if (direction === 'left') {
                    for (let col = 0; col < safeWidth - 1; col++) {
                        for (let row = 0; row < safeHeight; row++) {
                            const destX = safeSourceX + col;
                            const destY = safeSourceY + row;
                            const srcX = destX + 1;
                            if (destX < 0 || destX >= maxCols || destY < 0 || destY >= maxRows || srcX < 0 || srcX >= maxCols) continue;
                            if (!nextLayer[destY]) nextLayer[destY] = [];
                            nextLayer[destY][destX] = { tileId: nextLayer[destY]?.[srcX]?.tileId ?? null };
                        }
                    }
                    const fillX = safeSourceX + safeWidth - 1;
                    for (let row = 0; row < safeHeight; row++) {
                        const fillY = safeSourceY + row;
                        if (fillX < 0 || fillX >= maxCols || fillY < 0 || fillY >= maxRows) continue;
                        if (!nextLayer[fillY]) nextLayer[fillY] = [];
                        nextLayer[fillY][fillX] = { tileId: fillTileId };
                    }
                } else {
                    for (let col = safeWidth - 1; col > 0; col--) {
                        for (let row = 0; row < safeHeight; row++) {
                            const destX = safeSourceX + col;
                            const destY = safeSourceY + row;
                            const srcX = destX - 1;
                            if (destX < 0 || destX >= maxCols || destY < 0 || destY >= maxRows || srcX < 0 || srcX >= maxCols) continue;
                            if (!nextLayer[destY]) nextLayer[destY] = [];
                            nextLayer[destY][destX] = { tileId: nextLayer[destY]?.[srcX]?.tileId ?? null };
                        }
                    }
                    const fillX = safeSourceX;
                    for (let row = 0; row < safeHeight; row++) {
                        const fillY = safeSourceY + row;
                        if (fillX < 0 || fillX >= maxCols || fillY < 0 || fillY >= maxRows) continue;
                        if (!nextLayer[fillY]) nextLayer[fillY] = [];
                        nextLayer[fillY][fillX] = { tileId: fillTileId };
                    }
                }
            }

            runtimeCollisionLayerRef.current = nextLayer;
            return nextLayer;
        });

        tileBufferNeedsUpdate.current = true;
    }, []);

    const evaluateRetractableGateTrigger = useCallback((values: Record<string, any> | null): boolean => {
        if (!values || values.isEnabled === false || values.isEnabled === 'false') return false;
        const variableName = String(values.triggerVariable || '').trim();
        if (!variableName) return false;

        const rawCurrent = (gameGlobalVariablesRef.current as any)?.[variableName];
        const rawTarget = values.triggerValue ?? 1;
        const currentNum = Number(rawCurrent ?? 0);
        const targetNum = Number(rawTarget ?? 0);
        const currentValue = Number.isFinite(currentNum) ? currentNum : 0;
        const targetValue = Number.isFinite(targetNum) ? targetNum : 0;
        const operator = String(values.triggerOperator || '==').trim();

        switch (operator) {
            case '!=': return currentValue !== targetValue;
            case '>': return currentValue > targetValue;
            case '<': return currentValue < targetValue;
            case '>=': return currentValue >= targetValue;
            case '<=': return currentValue <= targetValue;
            case '==':
            default:
                return currentValue === targetValue;
        }
    }, []);

    // Disparar un evento para una entidad
    const triggerEvent = useCallback((entityId: string, eventName: string) => {
        if (!pendingEvents.current.has(entityId)) {
            pendingEvents.current.set(entityId, new Set());
        }
        pendingEvents.current.get(entityId)!.add(eventName);
    }, []);

    // Evaluate whether a condition is satisfied based on the entity state
    const evaluateCondition = useCallback((condition: any, entity: AnimatedEntity): boolean => {
        if (!condition) return false;

        const entityEvents = pendingEvents.current.get(entity.instance.id) || new Set<string>();

        switch (condition.type) {
            case 'KEY_PRESSED':
                // Check whether the specified key is currently pressed
                const key = condition.params?.key;
                if (!key) return false;
                const isPressed = pressedKeys.current.has(key);
                return isPressed;

            case 'TIME_OUT': {
                // Default to GameTime global variable, allow override via params
                const targetVar = normalizeVariableName(
                    condition.params?.variable ?? condition.params?.variableName ?? 'GameTime'
                );
                if (!targetVar) return false;
                const remainingTime = getGlobalVariableValue(targetVar);
                const numericTime = Number(remainingTime);
                if (Number.isNaN(numericTime)) return false;
                return numericTime < 1;
            }

            case 'HAS_COLLISION':
                // Verificar tipo especfico de colisin (entity, enemy, item, wall, any)
                const collisionType = condition.params?.collisionType || 'any';

                switch (collisionType) {
                    case 'enemy':
                        return entityEvents.has('collision_enemy');

                    case 'entity':
                        return entityEvents.has('collision_entity');

                    case 'item': {
                        // Permite filtrar por tipo de item o plantilla concreta
                        // Params opcionales: itemType, templateId, templateName
                        if (!entityEvents.has('collision_item')) return false;
                        const other = (entity as any).lastCollidedEntity;
                        if (!other || !other.template) {
                            console.warn('collision_item event detected but lastCollidedEntity is missing or invalid');
                            return false;
                        }

                        // Función para normalizar valores (trim + lowercase)
                        const normalizeValue = (value: any) => {
                            if (value === null || value === undefined || value === '') return '';
                            return String(value).trim().toLowerCase();
                        };

                        // Obtener parámetros de la condición (solo itemType)
                        const wantsItemType = condition.params?.itemType;

                        // Debug logging mejorado
                        console.log(`[Collision Debug] Item collided: ${other.template.name} (ID: ${other.template.id})`);
                        console.log(`[Collision Debug] State machine condition params:`, { itemType: wantsItemType || '(any)' });

                        // Filtrar por itemType (propiedad de comp_collectible o cualquier component con itemType)
                        if (wantsItemType) {
                            const comp = other.template.components?.find((c: any) => c.definitionId === 'comp_collectible');
                            if (!comp) {
                                console.warn(`Item entity ${other.template.name} is missing comp_collectible component`);
                                return false;
                            }
                            let otherItemType = comp.defaultValues?.itemType ?? collectibleDefaultItemType ?? '';
                            const overrideItemType = other.instance?.componentOverrides?.['comp_collectible']?.itemType;
                            if (overrideItemType !== undefined && `${overrideItemType}`.trim() !== '') {
                                otherItemType = overrideItemType;
                            }
                            const normalizedWantedType = normalizeValue(wantsItemType);
                            const normalizedActualType = normalizeValue(otherItemType);
                            if (normalizedActualType !== normalizedWantedType) {
                                console.debug(`Item type mismatch: wanted "${normalizedWantedType}", got "${normalizedActualType}" (from template: ${other.template.name})`);
                                return false;
                            }
                            console.debug(`Item type match: "${normalizedWantedType}"`);
                        }

                        console.log(`[Collision Debug] All conditions met for item: ${other.template.name}`);
                        return true;
                    }

                    case 'wall':
                        return entityEvents.has('collision_wall');

                    case 'any':
                    default:
                        return entityEvents.has('collision_entity') ||
                            entityEvents.has('collision_enemy') ||
                            entityEvents.has('collision_item') ||
                            entityEvents.has('collision_wall');
                }

            case 'ON_WALL_COLLISION': {
                const requestedDirection = (condition.params?.direction || 'any').toLowerCase();
                if (requestedDirection === 'any') {
                    return (
                        entityEvents.has('collision_wall') ||
                        entityEvents.has('collision_wall_left') ||
                        entityEvents.has('collision_wall_right') ||
                        entityEvents.has('collision_wall_up') ||
                        entityEvents.has('collision_wall_down')
                    );
                }

                const validDirections = ['left', 'right', 'up', 'down'];
                const normalizedDirection = validDirections.includes(requestedDirection)
                    ? requestedDirection
                    : 'any';

                if (normalizedDirection === 'any') {
                    return entityEvents.has('collision_wall');
                }

                return entityEvents.has(`collision_wall_${normalizedDirection}`);
            }

            case 'HAS_DEADLY_TILE_COLLISION':
                // Verificar si la entidad estA tocando un tile mortal
                return entity.hasDangerousTileCollision === true;

            case 'ANIMATION_COMPLETE':
                // Check directly on entity property (not events)
                return entity.animationHasCompleted === true;

            case 'VARIABLE_COMPARE': {
                const variable = condition.params?.variable || 'x';
                const operator = condition.params?.operator || '==';
                const valueSource = condition.params?.valueSource === 'variable' ? 'variable' : 'constant';
                const rawValue = condition.params?.value ?? 0;
                const compareVariableName = condition.params?.valueVariable || variable;

                // Helper to normalize values for comparison (handles booleans, numbers, strings)
                const normalizeValue = (value: any): boolean | number | string => {
                    if (typeof value === 'boolean') {
                        return value;
                    }
                    if (typeof value === 'string') {
                        const trimmed = value.trim().toLowerCase();
                        if (trimmed === 'true') return true;
                        if (trimmed === 'false') return false;
                        const num = Number(trimmed);
                        if (!Number.isNaN(num)) return num;
                        return trimmed;
                    }
                    if (typeof value === 'number') {
                        return value;
                    }
                    return value;
                };

                // Z80 velocity mapping: SM conditions use Z80 8-bit unsigned values where
                // 128+ means negative (two's complement). The simulator uses signed floats.
                const simVelToZ80Byte = (v: number): number => {
                    if (v < 0) {
                        const clamped = Math.max(-128, Math.round(v));
                        return 256 + clamped;
                    }

                    return Math.min(127, Math.round(v));
                };

                const resolveVariableValue = (variableName: string, compareHint?: boolean | number | string): boolean | number | string => {
                    switch (variableName) {
                        case 'x':
                            return Number.isFinite(entity.x) ? entity.x : 0;
                        case 'y':
                            return Number.isFinite(entity.y) ? entity.y : 0;
                        case 'vx':
                            return Number.isFinite(entity.vx) ? entity.vx : 0;
                        case 'vy': {
                            const vy = Number.isFinite(entity.vy) ? entity.vy : 0;
                            const numericHint = typeof compareHint === 'number' ? compareHint : Number(compareHint);
                            if (!Number.isNaN(numericHint) && numericHint >= 64) {
                                return simVelToZ80Byte(vy);
                            }
                            return vy;
                        }
                        default: {
                            const resolvedVarName = normalizeVariableName(variableName) ?? variableName;
                            const globalValue = gameGlobalVariablesRef.current?.[resolvedVarName];

                            if (globalValue !== undefined) {
                                return normalizeValue(globalValue);
                            }

                            const entityProp = (entity as any)?.[variableName];
                            if (entityProp !== undefined) {
                                return normalizeValue(entityProp);
                            }

                            return 0;
                        }
                    }
                };

                const rightValue = valueSource === 'variable'
                    ? resolveVariableValue(compareVariableName)
                    : normalizeValue(rawValue);

                const leftValue = (() => {
                    return resolveVariableValue(variable, rightValue);
                })();

                // Type-aware comparison
                const leftType = typeof leftValue;
                const rightType = typeof rightValue;

                // For equality/inequality, allow comparison across types
                if (operator === '==' || operator === '!=') {
                    const isEqual = leftValue == rightValue; // Use == for loose equality
                    return operator === '==' ? isEqual : !isEqual;
                }

                // For numeric comparisons, ensure both are numbers
                if (leftType === 'number' && rightType === 'number') {
                    switch (operator) {
                        case '>': return (leftValue as number) > (rightValue as number);
                        case '<': return (leftValue as number) < (rightValue as number);
                        case '>=': return (leftValue as number) >= (rightValue as number);
                        case '<=': return (leftValue as number) <= (rightValue as number);
                        default: return false;
                    }
                }

                // Can't do numeric comparison on non-numbers
                return false;
            }

            case 'AND':
                return condition.conditions?.every((c: any) => evaluateCondition(c, entity)) ?? false;

            case 'OR':
                return condition.conditions?.some((c: any) => evaluateCondition(c, entity)) ?? false;

            case 'NOT':
                return condition.conditions
                    ? !condition.conditions.every((c: any) => evaluateCondition(c, entity))
                    : true;

            default:
                return false;
        }
    }, []);

    const evaluateGuard = useCallback((guard?: TransitionGuard | null): boolean => {
        if (!guard || !guard.variableName) return true;
        const normalizeValue = (value: any): any => {
            if (typeof value === 'number' || typeof value === 'boolean') return value;
            if (value === null || value === undefined || value === '') return '';
            if (typeof value === 'string') {
                const trimmed = value.trim();
                if (trimmed === '') return ''; // Should be caught above, but for safety
                const lowered = trimmed.toLowerCase();
                if (lowered === 'true') return true;
                if (lowered === 'false') return false;
                const num = Number(trimmed);
                if (!Number.isNaN(num)) return num;
                return trimmed;
            }
            return value;
        };

        const resolvedVarName = normalizeVariableName(guard.variableName) ?? (typeof guard.variableName === 'string' ? guard.variableName.trim() : `${guard.variableName}`.trim());
        if (!resolvedVarName) return true;

        // Normalizar ambos lados de la comparación para asegurar que los tipos coincidan
        // (p. ej., booleano `true` se compara correctamente con la cadena `"true"`)
        const leftValue = normalizeValue(gameGlobalVariablesRef.current?.[resolvedVarName]);
        const rightValue = normalizeValue(guard.compareValue);

        const compareNumbers = (left: number, right: number) => {
            switch (guard.operator) {
                case '==': return left === right;
                case '!=': return left !== right;
                case '>': return left > right;
                case '<': return left < right;
                case '>=': return left >= right;
                case '<=': return left <= right;
                default: return false;
            }
        };

        const compareBooleans = (left: boolean, right: boolean) => {
            switch (guard.operator) {
                case '==': return left === right;
                case '!=': return left !== right;
                default: return false;
            }
        };

        // Si después de normalizar, ambos son números, usa comparación numérica.
        if (typeof leftValue === 'number' && typeof rightValue === 'number') {
            return compareNumbers(leftValue, rightValue);
        }

        // Si después de normalizar, ambos son booleanos, usa comparación booleana.
        if (typeof leftValue === 'boolean' && typeof rightValue === 'boolean') {
            return compareBooleans(leftValue, rightValue);
        }

        // Para cualquier otra combinación (string, etc.), compara como cadenas.
        const leftStr = (leftValue ?? '').toString().toLowerCase();
        const rightStr = (rightValue ?? '').toString().toLowerCase();

        if (guard.operator === '==') {
            return leftStr === rightStr;
        }
        if (guard.operator === '!=') {
            return leftStr !== rightStr;
        }
        // Non-numeric comparisons for >, <, >=, <= are not supported for strings
        return false;
    }, []);

    const executeStateActions = (entity: AnimatedEntity, actions?: Action[]) => {
        if (!actions?.length) {
            return;
        }
        for (const action of actions) {
            const visualActionBlockedByWallGrab =
                entity.isWallGrabbing === true && (
                    action.type === 'CHANGE_SPRITE' ||
                    action.type === 'PLAY_ANIMATION' ||
                    action.type === 'SET_ANIMATION' ||
                    action.type === 'SET_ANIMATION_SPEED' ||
                    action.type === 'TOGGLE_ANIMATION'
                );
            if (visualActionBlockedByWallGrab) {
                continue;
            }

            switch (action.type) {
                case 'SET_VELOCITY': {
                    entity.vx = action.params.x || 0;
                    const setVy = Number(action.params.y || 0);
                    entity.vy = setVy;
                    // Sync gravityVel so gravity system doesn't overwrite this vel_y
                    // Convert pixel velocity to 8.8 fixed point (integer part = vy, fractional = 0)
                    if (setVy !== 0) {
                        const gv88 = (setVy << 8) & 0xFFFF;
                        entity.gravityVel = gv88;
                    }
                    break;
                }

                case 'APPLY_FORCE': {
                    // Add force to current velocity (additive, unlike SET_VELOCITY)
                    const forceX = Number(action.params.x || 0);
                    const forceY = Number(action.params.y || 0);
                    entity.vx = (entity.vx || 0) + forceX;
                    entity.vy = (entity.vy || 0) + forceY;
                    // Sync gravityVel with new vy
                    if (forceY !== 0) {
                        entity.gravityVel = (Math.round(entity.vy) << 8) & 0xFFFF;
                    }
                    break;
                }

                case 'CHANGE_SPRITE':
                    const spriteName = action.params.sprite || action.params.spriteName || action.params.sprite_name;
                    if (spriteName) {
                        // Find sprite in allAssets
                        const spriteAssetData = allAssets.find(a =>
                            a.type === 'sprite' &&
                            (a.data.name === spriteName || a.data.id === spriteName || a.name === spriteName)
                        );

                        if (spriteAssetData) {
                            const spriteData = spriteAssetData.data as Sprite;
                            entity.sprite = spriteData;
                            entity.spriteAssetId = spriteAssetData.id;
                            entity.currentFrame = 0; // Reset to first frame

                            // Regenerate frame images for the new sprite
                            // Use Promise.all to wait for all images to load
                            const imageLoadPromises = spriteData.frames.map((frame, idx) => {
                                return new Promise<HTMLImageElement>((resolve, reject) => {
                                    const img = new Image();
                                    img.onload = () => resolve(img);
                                    img.onerror = (error) => {
                                        reject(error);
                                    };
                                    try {
                                        img.src = createSpriteDataURL(frame.data, spriteData.size.width, spriteData.size.height);
                                    } catch (err) {
                                        reject(err);
                                    }
                                });
                            });

                            // Load images asynchronously
                            Promise.all(imageLoadPromises).then((loadedImages) => {
                                if (entity.isWallGrabbing) return;
                                entity.frameImages = loadedImages;
                            }).catch(() => {
                                // Silently fail
                            });

                            // Regenerate mirrored frame images if sprite has facing direction
                            if (['right', 'left'].includes(spriteData.facingDirection)) {
                                const mirroredImageLoadPromises = spriteData.frames.map((frame, idx) => {
                                    return new Promise<HTMLImageElement>((resolve, reject) => {
                                        const img = new Image();
                                        img.onload = () => resolve(img);
                                        img.onerror = (error) => {
                                            reject(error);
                                        };
                                        try {
                                            const mirroredData = mirrorPixelDataHorizontally(frame.data as PixelData);
                                            img.src = createSpriteDataURL(mirroredData, spriteData.size.width, spriteData.size.height);
                                        } catch (err) {
                                            reject(err);
                                        }
                                    });
                                });

                                // Load mirrored images asynchronously
                                Promise.all(mirroredImageLoadPromises).then((loadedMirroredImages) => {
                                    if (entity.isWallGrabbing) return;
                                    entity.mirroredFrameImages = loadedMirroredImages;
                                }).catch(() => {
                                    // Silently fail
                                });
                            } else {
                                // Clear mirrored frames if new sprite doesn't support mirroring
                                entity.mirroredFrameImages = undefined;
                            }

                        }
                    }
                    break;

                case 'PLAY_ANIMATION': {
                    const animName = action.params.animationName || action.params.animation;
                    const loop = action.params.loop !== undefined ? action.params.loop : true;

                    // Reset animation to first frame
                    entity.currentFrame = 0;
                    entity.lastFrameUpdateTime = performance.now();

                    // Clear animation completion flag
                    entity.animationHasCompleted = false;

                    // If animation name is specified, try to find corresponding sprite
                    if (animName) {
                        // Find sprite with matching name or animation property
                        const spriteAsset = allAssets.find(a =>
                            a.type === 'sprite' &&
                            (a.name === animName || a.data.name === animName || a.data.animationName === animName)
                        );

                        if (spriteAsset) {
                            const spriteData = spriteAsset.data as Sprite;
                            entity.sprite = spriteData;

                            // Regenerate frame images
                            const imageLoadPromises = spriteData.frames.map(frame => {
                                return new Promise<HTMLImageElement>((resolve, reject) => {
                                    const img = new Image();
                                    img.onload = () => resolve(img);
                                    img.onerror = reject;
                                    try {
                                        img.src = createSpriteDataURL(frame.data, spriteData.size.width, spriteData.size.height);
                                    } catch (err) {
                                        reject(err);
                                    }
                                });
                            });

                            Promise.all(imageLoadPromises).then(loadedImages => {
                                if (entity.isWallGrabbing) return;
                                entity.frameImages = loadedImages;
                            }).catch(() => {
                                // Silently fail
                            });

                            // Regenerate mirrored frames if needed
                            if (['right', 'left'].includes(spriteData.facingDirection)) {
                                const mirroredPromises = spriteData.frames.map(frame => {
                                    return new Promise<HTMLImageElement>((resolve, reject) => {
                                        const img = new Image();
                                        img.onload = () => resolve(img);
                                        img.onerror = reject;
                                        try {
                                            const mirroredData = mirrorPixelDataHorizontally(frame.data as PixelData);
                                            img.src = createSpriteDataURL(mirroredData, spriteData.size.width, spriteData.size.height);
                                        } catch (err) {
                                            reject(err);
                                        }
                                    });
                                });

                                Promise.all(mirroredPromises).then(loadedMirroredImages => {
                                    if (entity.isWallGrabbing) return;
                                    entity.mirroredFrameImages = loadedMirroredImages;
                                }).catch(() => {
                                    // Silently fail
                                });
                            }
                        }
                    }

                    // Store loop setting (could be used in animation update logic)
                    (entity as any).animationLoop = loop;
                    break;
                }

                case 'DESTROY_ENTITY': {
                    const target = action.params?.target || 'self';
                    if (target === 'other') {
                        // Destroy the entity we last collided with
                        const otherEntity = (entity as any).lastCollidedEntity;
                        if (otherEntity) {
                            otherEntity.markedForDestruction = true;

                            // If it's a collectible item, register it as collected to prevent respawning
                        const isCollectible = isCollectibleEntity(otherEntity);
                        if (isCollectible && otherEntity.ownerScreenId) {
                            const registryKey = `${otherEntity.ownerScreenId}_${otherEntity.instance.id}`;
                            collectedItemsRegistry.current.add(registryKey);
                        }
                    }
                } else {
                    // Default: destroy self
                    entity.markedForDestruction = true;

                    // If destroying self and it's a collectible item, register it
                    const isCollectible = isCollectibleEntity(entity);
                    if (isCollectible && entity.ownerScreenId) {
                        const registryKey = `${entity.ownerScreenId}_${entity.instance.id}`;
                        collectedItemsRegistry.current.add(registryKey);
                    }
                }
                break;
                }

                case 'SET_POSITION': {
                    if (action.params.x !== undefined) entity.x = Number(action.params.x);
                    if (action.params.y !== undefined) entity.y = Number(action.params.y);
                    break;
                }

                case 'SET_VARIABLE': {
                    const rawVarName = action.params.variable ?? action.params.variableName ?? action.params.name;
                    const resolvedVarName = normalizeVariableName(rawVarName) ?? (rawVarName !== undefined && rawVarName !== null ? `${rawVarName}`.trim() : undefined);
                    if (resolvedVarName) {
                        const nextValue = coerceGlobalVariableValue(action.params.value);
                        updateGameGlobalVariables(prev => ({
                            ...prev,
                            [resolvedVarName]: nextValue
                        }));
                    }
                    break;
                }

                case 'REGENERATE_HUD':
                    setHudVersion(v => v + 1);
                    break;

                case 'CLEAN_SPRITES':
                    cleanSpritesNextFrameRef.current = true;
                    break;

                case 'EXIT_CURRENT_WORLD':
                    if (currentNode?.type === 'WorldLink') {
                        gameFlowExitRequestedRef.current = true;
                    }
                    break;

                case 'INCREMENT_VARIABLE': {
                    const rawVarName = action.params.variable ?? action.params.variableName ?? action.params.name;
                    const resolvedVarName = normalizeVariableName(rawVarName) ?? (rawVarName !== undefined && rawVarName !== null ? `${rawVarName}`.trim() : undefined);
                    // Coerce amount to number (supports numeric strings)
                    const incrementAmount = (() => {
                        const raw = action.params.amount ?? 1;
                        const n = Number(typeof raw === 'string' ? raw.trim() : raw);
                        return Number.isNaN(n) ? 1 : n;
                    })();
                    if (resolvedVarName) {
                        // Guard: avoid double increment for the same collectible within a frame
                        const lastOther = (entity as any).lastCollidedEntity;
                        const otherIsCollectible = lastOther ? isCollectibleEntity(lastOther) : false;
                        if (otherIsCollectible) {
                            if (processedCollectibleScoreRef.current.has(lastOther.instance.id)) {
                                break;
                            }
                            processedCollectibleScoreRef.current.add(lastOther.instance.id);
                        }
                        updateGameGlobalVariables(prev => {
                            const raw = (prev as any)[resolvedVarName];
                            const curr = Number(typeof raw === 'string' ? raw.trim() : raw);
                            const currentValue = Number.isNaN(curr) ? 0 : curr;
                            const newValue = currentValue + incrementAmount;
                            if (resolvedVarName.toLowerCase() === 'ammo' && newValue < currentValue) {
                                try { console.log(`[Ammo] ${currentValue} -> ${newValue} (INCREMENT_VARIABLE)`); } catch { }
                            }
                            return {
                                ...prev,
                                [resolvedVarName]: newValue
                            };
                        });
                    }
                    break;
                }

                case 'DECREMENT_VARIABLE': {
                    const rawVarName = action.params.variable ?? action.params.variableName ?? action.params.name;
                    const resolvedVarName = normalizeVariableName(rawVarName) ?? (rawVarName !== undefined && rawVarName !== null ? `${rawVarName}`.trim() : undefined);
                    // Coerce amount to number (supports numeric strings)
                    const decrementAmount = (() => {
                        const raw = action.params.amount ?? 1;
                        const n = Number(typeof raw === 'string' ? raw.trim() : raw);
                        return Number.isNaN(n) ? 1 : n;
                    })();
                    if (resolvedVarName) {
                        updateGameGlobalVariables(prev => {
                            const raw = (prev as any)[resolvedVarName];
                            const curr = Number(typeof raw === 'string' ? raw.trim() : raw);
                            const currentValue = Number.isNaN(curr) ? 0 : curr;
                            const newValue = currentValue - decrementAmount;
                            if (resolvedVarName.toLowerCase() === 'ammo' && newValue < currentValue) {
                                try { console.log(`[Ammo] ${currentValue} -> ${newValue} (DECREMENT_VARIABLE)`); } catch { }
                            }
                            return {
                                ...prev,
                                [resolvedVarName]: newValue
                            };
                        });
                    }
                    break;
                }

                case 'ADD_VARIABLES':
                case 'SUBTRACT_VARIABLES':
                case 'MULTIPLY_VARIABLES':
                case 'DIVIDE_VARIABLES':
                case 'MODULO_VARIABLES': {
    const resolveOperandValue = (operandType: string, operandValue: any, operandVariable: string): number => {
        if (operandType === 'constant') {
            const val = Number(operandValue ?? 0);
            return isNaN(val) ? 0 : val;
        } else {
            const varName = normalizeVariableName(operandVariable) ?? (operandVariable !== undefined ? `${operandVariable}`.trim() : '');
            if (!varName) return 0;
            const raw = gameGlobalVariablesRef.current?.[varName];
            const val = Number(typeof raw === 'string' ? raw.trim() : raw);
            return isNaN(val) ? 0 : val;
        }
    };
    const targetVar = action.params.targetVariable;
    const resolvedTargetVar = normalizeVariableName(targetVar) ?? (targetVar !== undefined ? `${targetVar}`.trim() : '');
    if (!resolvedTargetVar) break;
    const operand1Type = action.params.operand1Type || 'constant';
    const operand2Type = action.params.operand2Type || 'constant';
    const operand1 = resolveOperandValue(operand1Type, action.params.operand1Value, action.params.operand1Variable);
    const operand2 = resolveOperandValue(operand2Type, action.params.operand2Value, action.params.operand2Variable);
    let result = 0;
    if (action.type === 'ADD_VARIABLES') result = operand1 + operand2;
    else if (action.type === 'SUBTRACT_VARIABLES') result = operand1 - operand2;
    else if (action.type === 'MULTIPLY_VARIABLES') result = operand1 * operand2;
    else if (action.type === 'DIVIDE_VARIABLES') result = operand2 !== 0 ? operand1 / operand2 : 0;
    else if (action.type === 'MODULO_VARIABLES') result = operand2 !== 0 ? operand1 % operand2 : 0;
    updateGameGlobalVariables(prev => ({ ...prev, [resolvedTargetVar]: result }));
    break;
}

                case 'ASSIGN_VARIABLE': {
    const targetVar = action.params.targetVariable;
    const resolvedTargetVar = normalizeVariableName(targetVar) ?? (targetVar !== undefined ? `${targetVar}`.trim() : '');
    if (!resolvedTargetVar) break;
    const sourceType = action.params.sourceType || 'constant';
    let sourceValue = 0;
    if (sourceType === 'constant') {
        const val = Number(action.params.sourceValue ?? 0);
        sourceValue = isNaN(val) ? 0 : val;
    } else {
        const sourceVar = action.params.sourceVariable;
        const resolvedSourceVar = normalizeVariableName(sourceVar) ?? (sourceVar !== undefined ? `${sourceVar}`.trim() : '');
        if (resolvedSourceVar) {
            const raw = gameGlobalVariablesRef.current?.[resolvedSourceVar];
            const val = Number(typeof raw === 'string' ? raw.trim() : raw);
            sourceValue = isNaN(val) ? 0 : val;
        }
    }
    updateGameGlobalVariables(prev => ({ ...prev, [resolvedTargetVar]: sourceValue }));
    break;
}

                case 'SET_COMPONENT_PROPERTY': {
    const compId = action.params.componentId || action.params.component || action.params.compId;
    const propName = action.params.propertyName || action.params.prop || action.params.name;
    const value = action.params.value;
    if (entity.isWallGrabbing) {
        const normalizedCompId = String(compId || '').toLowerCase();
        const normalizedPropName = String(propName || '').toLowerCase();
        const changesWallGrabVisuals =
            normalizedCompId === 'comp_render' ||
            normalizedCompId === 'comp_animation' ||
            normalizedPropName.includes('sprite') ||
            normalizedPropName.includes('frame') ||
            normalizedPropName.includes('anim');
        if (changesWallGrabVisuals) break;
    }
    if (compId && propName !== undefined) {
        if (!entity.instance.componentOverrides) entity.instance.componentOverrides = {} as any;
        if (!entity.instance.componentOverrides[compId]) entity.instance.componentOverrides[compId] = {} as any;
        entity.instance.componentOverrides[compId][propName] = value;
    }
    break;
}

                case 'GOTO_STATE': {
    const targetStateName = action.params.stateName || action.params.state;
    if (targetStateName && entity.stateMachine) {
        // Find state by name in the state machine
        const targetState = entity.stateMachine.states.find(
            s => s.name === targetStateName || s.id === targetStateName
        );
        if (targetState) {
            changeEntityState(entity, targetState);
        }
    }
    break;
}

                case 'SPAWN_ENTITY': {
    const templateId = action.params.templateId || action.params.entityTemplateId;
    const isRelative = action.params.isRelative === true;
    const matchFacing = action.params.matchFacing === true;
    const delayMs = Number(action.params.delayMs ?? action.params.spawnDelayMs ?? 0);

    const performSpawn = () => {
        let spawnX = 0;
        let spawnY = 0;

        if (isRelative) {
            const offsetX = Number(action.params.x || 0);
            const offsetY = Number(action.params.y || 0);

            // Check facing direction for mirroring
            const isParentMirrored = entity.isFacingMirrored;
            const finalOffsetX = (matchFacing && isParentMirrored) ? -offsetX : offsetX;

            spawnX = entity.x + finalOffsetX;
            spawnY = entity.y + offsetY;
        } else {
            spawnX = Number(action.params.x !== undefined ? action.params.x : entity.x);
            spawnY = Number(action.params.y !== undefined ? action.params.y : entity.y);
        }

        const actionLifetimeMs = action.params.lifetimeMs !== undefined ? Number(action.params.lifetimeMs) : undefined;

        if (!templateId) return;

        // Find entity template
        // Look up the template both in the in-memory list and in entitytemplate assets (to support templates loaded from assets only)
        const template = entityTemplates.find(t => t.id === templateId || t.name === templateId)
            || (allAssets.find(a => a.type === 'entitytemplate' && (a.id === templateId || a.name === templateId || (a.data as any)?.id === templateId))?.data as EntityTemplate | undefined);
        if (!template) return;
        const templateName = (template.name || '').toLowerCase();
        const wantsRandomNucleo = action.params.randomNucleo === true || action.params.randomNucleo === 'true' ||
            action.params.spawnAtRandomNucleo === true || action.params.spawnAtRandomNucleo === 'true' ||
            action.params.useNucleo === true || action.params.useNucleo === 'true';
        const shouldAutoUseNucleo = templateName.includes('coin') &&
            action.params.x === undefined &&
            action.params.y === undefined &&
            nucleoPositionsRef.current.length > 0;
        if ((wantsRandomNucleo || shouldAutoUseNucleo) && nucleoPositionsRef.current.length > 0) {
            const randomIndex = Math.floor(Math.random() * nucleoPositionsRef.current.length);
            const randomAnchor = nucleoPositionsRef.current[randomIndex];
            spawnX = randomAnchor.x;
            spawnY = randomAnchor.y;
        } else if (wantsRandomNucleo && nucleoPositionsRef.current.length === 0) {
            try { console.warn('SPAWN_ENTITY asked for random nucleo but none exist in this screen'); } catch { }
        }

        // Find sprite for this entity
        let spriteAssetId: string | undefined;
        for (const comp of template.components) {
            const compDef = componentDefinitions.find(c => c.id === comp.definitionId);
            const spriteProp = compDef?.properties.find(p => p.type === 'sprite_ref');
            if (spriteProp && comp.defaultValues?.[spriteProp.name]) {
                spriteAssetId = comp.defaultValues[spriteProp.name];
                break;
            }
        }

        const spriteAsset = allAssets.find(a => a.id === spriteAssetId && a.type === 'sprite');
        const sprite = spriteAsset?.data as Sprite;
        if (!sprite?.frames?.length) return;

        // Create frame images
        const frameImages = sprite.frames.map(frame => {
            const img = new Image();
            img.src = createSpriteDataURL(frame.data, sprite.size.width, sprite.size.height);
            return img;
        });

        // Create mirrored frames if needed
        let mirroredFrameImages: HTMLImageElement[] | undefined;
        if (['right', 'left'].includes(sprite.facingDirection)) {
            mirroredFrameImages = sprite.frames.map(frame => {
                const mirroredData = mirrorPixelDataHorizontally(frame.data as PixelData);
                const img = new Image();
                img.src = createSpriteDataURL(mirroredData, sprite.size.width, sprite.size.height);
                return img;
            });
        }

        // Find state machine if entity has one
        let stateMachine: StateMachine | undefined;
        let currentState: string | undefined;
        let initialStateDef: StateMachineState | undefined;
        const smc = template.components.find(c => c.definitionId === 'comp_statemachine');
        const stateMachineAssetId = smc?.defaultValues?.stateMachineAssetId;
        if (stateMachineAssetId && stateMachineAssetId !== '0' && stateMachineAssetId !== '') {
            const stateMachineAsset = allAssets.find(a =>
                a.id === stateMachineAssetId && a.type === 'statemachine'
            );
            stateMachine = stateMachineAsset?.data as StateMachine | undefined;
            if (stateMachine) {
                const startStateId = smc?.defaultValues?.currentStateId || stateMachine.initialStateId;
                let initialState = stateMachine.states.find(s => s.id === startStateId);
                if (!initialState && startStateId) {
                    initialState = stateMachine.states.find(s => s.name === startStateId);
                }
                if (!initialState) {
                    initialState = stateMachine.states.find(s => s.name.toLowerCase() === 'idle')
                        || stateMachine.states[0];
                }
                initialStateDef = initialState;
                currentState = initialState?.name;
            }
        }

        // Determine ownership for persistence/visibility (boxes and collectibles stick to their origin screen)
        const isBoxEntity = template.components?.some(c => c.definitionId === 'comp_box') || /box/i.test(template.name || '');
        const isCollectibleItem = isCollectibleTemplate(template);
        const ownerScreenId = (isBoxEntity || isCollectibleItem) ? currentScreenMapRef.current?.id : undefined;

        // Create new entity instance
        const newInstance: EntityInstance = {
            id: `spawned_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: template.name,
            entityTemplateId: template.id,
            position: { x: Math.floor(spawnX / 8), y: Math.floor(spawnY / 8) },
            componentOverrides: {}
        };

        const childLink = parseChildLinkConfig(template, newInstance);
        const lifetimeMs = resolveLifetimeMs(template, newInstance, actionLifetimeMs);
        const expiresAt = lifetimeMs ? performance.now() + lifetimeMs : undefined;

        // Create animated entity
        const newEntity: AnimatedEntity = {
            instance: newInstance,
            template,
            sprite,
            spriteAssetId: spriteAsset?.id,
            x: spawnX,
            y: spawnY,
            vx: 0,
            vy: 0,
            gravityVel: 0,
            frameImages,
            mirroredFrameImages,
            currentFrame: 0,
            lastFrameUpdateTime: performance.now(),
            stateMachine,
            currentState,
            isOnGround: false,
            isOnLadder: false,
            spawnTime: performance.now(),
            screenAssetId: currentScreenMapRef.current?.id,
            parentEntityId: null,
            platformGraceFramesLeft: 0,
            childLink,
            lifetimeMs,
            expiresAt,
            isFacingMirrored: matchFacing ? entity.isFacingMirrored : false,
            desiredFacingDirection: matchFacing ? entity.desiredFacingDirection : undefined,
            ownerScreenId
        };

        if (stateMachine && initialStateDef) {
            changeEntityState(newEntity, initialStateDef, { runExitActions: false });
        }

        // Add to entities list
        entitiesRef.current.push(newEntity);
    };

    if (delayMs > 0) {
        setTimeout(() => {
            if (!isOpen) return;
            performSpawn();
        }, delayMs);
    } else {
        performSpawn();
    }
    break;
}

                case 'WAIT': {
    const durationMs = Number(action.params.duration || action.params.time || 1000);
    // Set wait timer - this will block state machine transitions until time expires
    entity.waitUntilTime = performance.now() + durationMs;
    break;
}

                case 'SET_ANIMATION_SPEED': {
    const speedMs = Number(action.params.speedMs || 200);
    if (entity.sprite) {
        entity.sprite.animationSpeedMs = speedMs;
    }
    break;
}

                case 'TOGGLE_ANIMATION': {
    const mode = action.params.mode || 'toggle'; // 'start', 'stop', 'toggle'

    // Get the current animation state from comp_animation component
    const animComp = entity.template.components.find(c => c.definitionId === 'comp_animation');
    if (animComp) {
        // Initialize componentOverrides if needed
        if (!entity.instance.componentOverrides) {
            entity.instance.componentOverrides = {};
        }
        if (!entity.instance.componentOverrides['comp_animation']) {
            entity.instance.componentOverrides['comp_animation'] = {};
        }

        // Get current playing state
        const currentPlaying = entity.instance.componentOverrides['comp_animation'].isPlaying
            ?? animComp.defaultValues?.isPlaying
            ?? true;

        // Determine new state based on mode
        let newPlaying = currentPlaying;
        if (mode === 'start') {
            newPlaying = true;
        } else if (mode === 'stop') {
            newPlaying = false;
        } else { // toggle
            newPlaying = !currentPlaying;
        }

        // Update the override
        entity.instance.componentOverrides['comp_animation'].isPlaying = newPlaying;

        // Store on entity for runtime use
        (entity as any).isAnimationPlaying = newPlaying;
    }
    break;
}

                case 'PLAY_SOUND': {
    const soundId = action.params.soundId || action.params.sound || action.params.soundAssetId;
    if (soundId) {
        // Find sound asset
        const soundAsset = allAssets.find(a =>
            a.type === 'sound' && (a.id === soundId || a.name === soundId)
        );

        if (soundAsset) {
            const soundData = soundAsset.data as any; // PSGSoundData

            // Create Web Audio context if not exists
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

            // PSG constants
            const PSG_INPUT_CLOCK = 3579545 / 2; // ~1.79 MHz
            const REFERENCE_BPM = 120;

            const calculateFrequencyFromTonePeriod = (tonePeriod: number): number => {
                if (tonePeriod === 0 || tonePeriod > 4095) return 0;
                return PSG_INPUT_CLOCK / (16 * tonePeriod);
            };

            const calculateFrequencyFromNoisePeriod = (noisePeriod: number): number => {
                const effectiveNP = (noisePeriod === 0) ? 1 : noisePeriod & 0x1F;
                return PSG_INPUT_CLOCK / (32 * effectiveNP);
            };

            // Master gain
            const masterGain = audioCtx.createGain();
            masterGain.gain.value = soundData.masterVolume || 1.0;
            masterGain.connect(audioCtx.destination);

            // Create global noise source
            const noiseFilterNode = audioCtx.createBiquadFilter();
            noiseFilterNode.type = 'bandpass';
            noiseFilterNode.Q.value = 1.0;
            const noiseFreq = calculateFrequencyFromNoisePeriod(soundData.noisePeriod || 16);
            const maxFilterFreq = audioCtx.sampleRate / 2;
            const frequency = Math.min(Math.max(20, noiseFreq), maxFilterFreq);
            if (isFinite(frequency)) {
                noiseFilterNode.frequency.setValueAtTime(frequency, audioCtx.currentTime);
            }

            const bufferSize = audioCtx.sampleRate * 0.5;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const output = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
            const globalNoiseSource = audioCtx.createBufferSource();
            globalNoiseSource.buffer = buffer;
            globalNoiseSource.loop = true;
            try {
                globalNoiseSource.start();
                globalNoiseSource.connect(noiseFilterNode);
            } catch (e) {
                console.error("Failed to start global noise source:", e);
            }

            // Function to play a single step for a channel
            const playStepForChannel = (channel: any, stepIndex: number, startTime: number): number => {
                if (stepIndex >= channel.steps.length) {
                    if (channel.loop && channel.steps.length > 0) {
                        return playStepForChannel(channel, 0, startTime);
                    }
                    return startTime;
                }

                const step = channel.steps[stepIndex];

                // Create channel gain node
                const channelGain = audioCtx.createGain();
                channelGain.gain.value = step.useEnvelope ? 0 : step.volume / 15;
                channelGain.connect(masterGain);

                // Tone oscillator
                if (step.toneEnabled) {
                    const osc = audioCtx.createOscillator();
                    osc.type = 'square';
                    const freq = calculateFrequencyFromTonePeriod(step.tonePeriod || 257);
                    if (freq > 0 && isFinite(freq)) {
                        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
                        osc.connect(channelGain);
                        try {
                            osc.start(startTime);
                        } catch (e) {
                            console.warn("Error starting oscillator", e);
                        }
                    }
                }

                // Noise
                if (step.noiseEnabled && noiseFilterNode) {
                    noiseFilterNode.connect(channelGain);
                }

                // Calculate effective duration (with tempo scaling)
                const tempo = soundData.tempoBPM > 0 ? soundData.tempoBPM : REFERENCE_BPM;
                const durationScaleFactor = REFERENCE_BPM / tempo;
                const effectiveDurationMs = step.durationMs * durationScaleFactor;
                const effectiveDurationSec = effectiveDurationMs / 1000;

                // Apply envelope if enabled
                if (step.useEnvelope) {
                    const now = startTime;
                    const peakVolume = Math.max(0, Math.min(1, (step.volume || 0) / 15));

                    channelGain.gain.cancelScheduledValues(now);
                    if (isFinite(peakVolume)) {
                        channelGain.gain.setValueAtTime(0, now);
                    }

                    // Use step-specific envelope shape if defined, otherwise use global
                    const shape = step.envelopeShape ?? soundData.envelopeShape;
                    const isAttack = (shape & 0b0100) !== 0;
                    const isAlternate = (shape & 0b0010) !== 0;

                    if (isAttack) {
                        channelGain.gain.linearRampToValueAtTime(peakVolume, now + effectiveDurationSec * (isAlternate ? 0.5 : 1));
                        if (isAlternate) channelGain.gain.linearRampToValueAtTime(0, now + effectiveDurationSec);
                    } else { // Fall
                        if (isFinite(peakVolume)) {
                            channelGain.gain.setValueAtTime(peakVolume, now);
                        }
                        channelGain.gain.linearRampToValueAtTime(0, now + effectiveDurationSec * (isAlternate ? 0.5 : 1));
                        if (isAlternate) channelGain.gain.linearRampToValueAtTime(peakVolume, now + effectiveDurationSec);
                    }
                }

                // Schedule disconnect after step duration
                const nextStartTime = startTime + effectiveDurationSec;
                setTimeout(() => {
                    if (step.noiseEnabled && noiseFilterNode) {
                        try {
                            noiseFilterNode.disconnect(channelGain);
                        } catch (e) { }
                    }
                    try {
                        channelGain.disconnect();
                    } catch (e) { }
                }, effectiveDurationMs);

                // Play next step recursively
                return playStepForChannel(channel, stepIndex + 1, nextStartTime);
            };

            // Play all channels starting from step 0
            soundData.channels?.forEach((channel: any) => {
                if (channel.steps && channel.steps.length > 0) {
                    playStepForChannel(channel, 0, audioCtx.currentTime);
                }
            });

            console.log(`[PLAY_SOUND] Playing sound: ${soundAsset.name}`);
        }
    }
    break;
}

                case 'PLAY_MUSIC': {
    const trackId = action.params.trackId;
    const loop = action.params.loop ?? true;

    if (trackId) {
        // Find track asset
        const trackAsset = allAssets.find(a =>
            a.type === 'track' && (a.id === trackId || a.name === trackId)
        );

        if (trackAsset) {
            const trackData = trackAsset.data as any; // TrackerSongData

            // Stop current music if playing
            if (musicSynthesizerRef.current) {
                musicSynthesizerRef.current.stopAllNotes();
                if (musicPlaybackIntervalRef.current) {
                    clearInterval(musicPlaybackIntervalRef.current);
                    musicPlaybackIntervalRef.current = null;
                }
            }

            // Create new synthesizer
            const synth = new AYSynthesizer(trackData.globalVolume / 15);
            synth.setSongData(trackData);
            musicSynthesizerRef.current = synth;
            currentMusicTrackIdRef.current = trackId;
            musicIsMutedRef.current = false;

            // Start playback
            synth.ensureAudioContext().then(() => {
                let currentPatternIndexInOrder = 0;
                let currentRow = 0;

                const playNextRow = () => {
                    if (musicIsMutedRef.current || !musicSynthesizerRef.current) return;

                    const orderIndex = currentPatternIndexInOrder;
                    if (orderIndex >= trackData.order.length) {
                        if (loop) {
                            currentPatternIndexInOrder = trackData.restartPosition || 0;
                            currentRow = 0;
                            return;
                        } else {
                            // Stop playback
                            if (musicPlaybackIntervalRef.current) {
                                clearInterval(musicPlaybackIntervalRef.current);
                                musicPlaybackIntervalRef.current = null;
                            }
                            return;
                        }
                    }

                    const patternIndex = trackData.order[orderIndex];
                    const pattern = trackData.patterns[patternIndex];
                    if (!pattern) return;

                    const rowData = pattern.rows[currentRow];
                    if (rowData) {
                        // Play notes for each channel
                        ['A', 'B', 'C'].forEach((chId, chIndex) => {
                            const cell = rowData[chId as 'A' | 'B' | 'C'];
                            synth.playNote(
                                chIndex as 0 | 1 | 2,
                                cell.note,
                                cell.instrument,
                                cell.ornament,
                                cell.volume
                            );
                        });
                    }

                    currentRow++;
                    if (currentRow >= pattern.numRows) {
                        currentRow = 0;
                        currentPatternIndexInOrder++;
                    }
                };

                // Calculate row duration
                const rowDurationMs = (2500 * trackData.speed) / trackData.bpm;

                musicPlaybackIntervalRef.current = window.setInterval(playNextRow, Math.max(20, rowDurationMs));
                playNextRow(); // Play first row immediately
            });

            console.log(`[PLAY_MUSIC] Playing track: ${trackAsset.name}`);
        }
    }
    break;
}

                case 'MUTE_MUSIC': {
    if (musicSynthesizerRef.current) {
        musicSynthesizerRef.current.stopAllNotes();
        musicIsMutedRef.current = true;
        console.log(`[MUTE_MUSIC] Music muted`);
    }
    break;
}

                case 'STOP_MUSIC': {
    if (musicSynthesizerRef.current) {
        musicSynthesizerRef.current.stopAllNotes();
        if (musicPlaybackIntervalRef.current) {
            clearInterval(musicPlaybackIntervalRef.current);
            musicPlaybackIntervalRef.current = null;
        }
        musicSynthesizerRef.current = null;
        currentMusicTrackIdRef.current = null;
        musicIsMutedRef.current = false;
        console.log(`[STOP_MUSIC] Music stopped`);
    }
    break;
}

                case 'CHANGE_GAME_FLOW_NODE':
let targetNodeId = action.params.nodeId || action.params.targetNodeId;

// Special case: "START" navigates to the Start node
if (targetNodeId === 'START') {
    const startNode = nodes.find(n => n.type === 'Start');
    if (startNode) {
        targetNodeId = startNode.id;
    } else {
        break;
    }
}

if (targetNodeId) {
    // Store the target node for deferred navigation (after frame completes)
    pendingNodeTransitionRef.current = String(targetNodeId);
}
break;

                case 'DECREASE_LIVES': {
const decreaseAmount = Number(action.params.amount || 1);
// Find comp_health
const healthCompForDecrease = entity.template.components.find(c => c.definitionId === 'comp_health');
if (healthCompForDecrease) {
    const healthOverride = entity.instance.componentOverrides?.['comp_health'] || {};
    const currentLives = Number(healthOverride.current || healthCompForDecrease.defaultValues?.current || 3);
    const newLives = Math.max(0, currentLives - decreaseAmount);

    if (!entity.instance.componentOverrides) entity.instance.componentOverrides = {};
    if (!entity.instance.componentOverrides['comp_health']) {
        entity.instance.componentOverrides['comp_health'] = {};
    }
    entity.instance.componentOverrides['comp_health'].current = newLives;

    // Sync with Lives global variable (matching Z80: Lives RAM variable)
    updateGameGlobalVariables(prev => ({ ...prev, Lives: newLives }));
}
break;
}

                case 'INCREASE_LIVES': {
const increaseAmount = Number(action.params.amount || 1);
const healthCompForIncrease = entity.template.components.find(c => c.definitionId === 'comp_health');
if (healthCompForIncrease) {
    const healthOverride = entity.instance.componentOverrides?.['comp_health'] || {};
    const currentLives = Number(healthOverride.current || healthCompForIncrease.defaultValues?.current || 3);
    const maxLives = Number(healthOverride.max || healthCompForIncrease.defaultValues?.max || 3);
    const newLives = Math.min(maxLives, currentLives + increaseAmount);

    if (!entity.instance.componentOverrides) entity.instance.componentOverrides = {};
    if (!entity.instance.componentOverrides['comp_health']) {
        entity.instance.componentOverrides['comp_health'] = {};
    }
    entity.instance.componentOverrides['comp_health'].current = newLives;

    // Sync with Lives global variable (matching Z80: Lives RAM variable)
    updateGameGlobalVariables(prev => ({ ...prev, Lives: newLives }));
}
break;
}

                case 'RESPAWN_PLAYER': {
    let spawnX: number;
    let spawnY: number;
    let targetScreenId: string | undefined;

    if (gameGlobalVariables.playerCheckpointX !== undefined && gameGlobalVariables.playerCheckpointY !== undefined && gameGlobalVariables.playerCheckpointScreen) {
        spawnX = Number(gameGlobalVariables.playerCheckpointX);
        spawnY = Number(gameGlobalVariables.playerCheckpointY);
        targetScreenId = gameGlobalVariables.playerCheckpointScreen;
    } else if (action.params.x !== undefined || action.params.y !== undefined) {
        spawnX = Number(action.params.x !== undefined ? action.params.x : entity.x);
        spawnY = Number(action.params.y !== undefined ? action.params.y : entity.y);
    } else {
        spawnX = entity.instance.position.x * 8;
        spawnY = entity.instance.position.y * 8;
    }

    const currentScreenMap = currentScreenMapRef.current;
    const currentWorldMapGraph = currentWorldMapGraphRef.current;

    // If the checkpoint belongs to another screen, switch to it
    if (targetScreenId && currentScreenMap?.id !== targetScreenId) {
        const setPlayerEntryPoint = setPlayerEntryPointRef.current;
        const handleScreenTransition = handleScreenTransitionRef.current;

        setPlayerEntryPoint({ x: spawnX, y: spawnY });

        if (currentWorldMapGraph) {
            const targetScreenNode = currentWorldMapGraph.nodes.find(n => n.screenAssetId === targetScreenId);
            if (targetScreenNode) {
                handleScreenTransition(targetScreenNode.id);
                // Leave entity.x/y untouched here; useEffect will update them after transition
                return;
            }
        }
    }

    // Already on the right screen, so respawn locally
    entity.x = spawnX;
    entity.y = spawnY;
    entity.vx = 0;
    entity.vy = 0;
    entity.gravityVel = 0;
    break;
}

                case 'BREAK_TILE':
                case 'REPLACE_TILE': {
    const params = action.params;
    const dir = params.direction || 'up';

    // Compute the tile position based on player's facing direction
    const offsets: Record<string, { x: number; y: number }> = {
        here: { x: 0, y: 0 },
        up: { x: 0, y: -1 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        right: { x: 1, y: 0 },
        // Diagonales
        'up-right': { x: 1, y: -1 },
        'up-left': { x: -1, y: -1 },
        'down-right': { x: 1, y: 1 },
        'down-left': { x: -1, y: 1 }
    };

    // Player position expressed in tiles (8x8)
    const playerTileX = Math.floor((entity.x + entity.sprite.size.width / 2) / 8);
    const playerTileY = Math.floor((entity.y + entity.sprite.size.height / 2) / 8);

    // Target tile position
    const selectedOffset = offsets[dir] || offsets.up;
    const targetTileX = playerTileX + selectedOffset.x;
    const targetTileY = playerTileY + selectedOffset.y;

    // Ensure the target tile exists (using the ref for synchronous access)
    const targetTile = runtimeCollisionLayerRef.current[targetTileY]?.[targetTileX];

    if (targetTile?.tileId) {
        const tileAsset = allAssets.find(a => a.id === targetTile.tileId && a.type === 'tile');
        const tileData = tileAsset?.data as Tile | undefined;

        if (action.type === 'BREAK_TILE') {
            // Solo romper si el tile es breakable
            if (tileData?.logicalProperties?.isBreakable) {
                modifyTileInLayer(targetTileX, targetTileY, null);
            } else {
            }
        } else if (action.type === 'REPLACE_TILE') {
            // Reemplazar con nuevo tile
            const newTileId = params.replacementTileId || null;
            modifyTileInLayer(targetTileX, targetTileY, newTileId);
        }
    } else if (!targetTile?.tileId && action.type === 'REPLACE_TILE') {
        // Allow placing a tile in empty space
        const newTileId = params.replacementTileId || null;
        if (newTileId) {
            modifyTileInLayer(targetTileX, targetTileY, newTileId);
        }
    } else {
    }
    break;
}

                case 'REPLACE_TILE_AT': {
    const params = action.params;
    const targetTileX = Number(params.x ?? 0);
    const targetTileY = Number(params.y ?? 0);
    const newTileId = params.replacementTileId || null;

    if (!Number.isFinite(targetTileX) || !Number.isFinite(targetTileY)) {
        break;
    }

    modifyTileInLayer(Math.trunc(targetTileX), Math.trunc(targetTileY), newTileId);
    break;
}

                case 'MOVE_TILE_AREA': {
    const params = action.params;
    const sourceX = Number(params.x ?? 0);
    const sourceY = Number(params.y ?? 0);
    const width = Number(params.width ?? 1);
    const height = Number(params.height ?? 1);
    const distance = Number(params.distance ?? 1);
    const direction = String(params.direction || 'up').toLowerCase() as 'up' | 'down' | 'left' | 'right';
    const fillTileId = params.fillTileId || null;

    if (!Number.isFinite(sourceX) || !Number.isFinite(sourceY) || !Number.isFinite(width) || !Number.isFinite(height) || !Number.isFinite(distance)) {
        break;
    }

    moveTileAreaInLayer(
        Math.trunc(sourceX),
        Math.trunc(sourceY),
        Math.max(1, Math.trunc(width)),
        Math.max(1, Math.trunc(height)),
        direction,
        Math.max(1, Math.trunc(distance)),
        fillTileId
    );
    break;
}

                case 'SHIFT_TILE_AREA': {
    const params = action.params;
    const sourceX = Number(params.x ?? 0);
    const sourceY = Number(params.y ?? 0);
    const width = Number(params.width ?? 1);
    const height = Number(params.height ?? 1);
    const distance = Number(params.distance ?? 1);
    const direction = String(params.direction || 'up').toLowerCase() as 'up' | 'down' | 'left' | 'right';
    const fillTileId = params.fillTileId || null;

    if (!Number.isFinite(sourceX) || !Number.isFinite(sourceY) || !Number.isFinite(width) || !Number.isFinite(height) || !Number.isFinite(distance)) {
        break;
    }

    shiftTileAreaInLayer(
        Math.trunc(sourceX),
        Math.trunc(sourceY),
        Math.max(1, Math.trunc(width)),
        Math.max(1, Math.trunc(height)),
        direction,
        Math.max(1, Math.trunc(distance)),
        fillTileId
    );
    break;
}

                case 'POINT_AT': {
    // Calculate normalized direction vector from (x1, y1) to (x2, y2)
    const x1 = Number(action.params.x1 || 0);
    const y1 = Number(action.params.y1 || 0);
    const x2 = Number(action.params.x2 || 0);
    const y2 = Number(action.params.y2 || 0);
    const speed = Number(action.params.speed || 1);

    // Calculate direction vector
    const dx = x2 - x1;
    const dy = y2 - y1;

    // Calculate magnitude (distance)
    const magnitude = Math.sqrt(dx * dx + dy * dy);

    // Normalize and apply speed
    // If magnitude is 0 (same point), velocity is 0
    let velocityX = 0;
    let velocityY = 0;

    if (magnitude > 0) {
        // Normalized direction * speed = velocity in pixels per frame
        velocityX = (dx / magnitude) * speed;
        velocityY = (dy / magnitude) * speed;
    }

    // Apply the calculated velocity to the entity
    entity.vx = velocityX;
    entity.vy = velocityY;

    console.log(`🎯 POINT_AT: from (${x1}, ${y1}) to (${x2}, ${y2}) → direction (${dx}, ${dy}), magnitude ${magnitude.toFixed(2)}, velocity (${velocityX.toFixed(2)}, ${velocityY.toFixed(2)}) at speed ${speed}`);
    break;
}

                case 'GET_RANDOM_ENTITY_POSITION': {
    const templateId = action.params.templateId;
    const targetVariableX = action.params.targetVariableX;
    const targetVariableY = action.params.targetVariableY;

    if (!templateId || !targetVariableX || !targetVariableY) {
        console.warn('[GET_RANDOM_ENTITY_POSITION] Missing required parameters:', { templateId, targetVariableX, targetVariableY });
        break;
    }

    // Filter entities by template
    const matchingEntities = entitiesRef.current.filter(e =>
        e.template.id === templateId && !e.markedForDestruction
    );

    if (matchingEntities.length === 0) {
        console.warn(`[GET_RANDOM_ENTITY_POSITION] No entities found with template: ${templateId}`);
        break;
    }

    // Select random entity
    const randomEntity = matchingEntities[Math.floor(Math.random() * matchingEntities.length)];

    // Normalize variable names
    const resolvedVarX = normalizeVariableName(targetVariableX) ?? targetVariableX.trim();
    const resolvedVarY = normalizeVariableName(targetVariableY) ?? targetVariableY.trim();

    // Store position in global variables
    updateGameGlobalVariables(prev => ({
        ...prev,
        [resolvedVarX]: Math.floor(randomEntity.x),
        [resolvedVarY]: Math.floor(randomEntity.y)
    }));

    console.log(`🎲 GET_RANDOM_ENTITY_POSITION: Selected entity at (${Math.floor(randomEntity.x)}, ${Math.floor(randomEntity.y)}) from ${matchingEntities.length} candidates`);
    break;
}

                default:
break;
            }
        }
    };

const applyStatePropertiesFromState = (entity: AnimatedEntity, state?: StateMachineState) => {
    if (!state?.properties) return;
    if (state.properties.velocityX !== undefined) {
        entity.vx = state.properties.velocityX;
    }
    if (state.properties.velocityY !== undefined) {
        entity.vy = state.properties.velocityY;
    }
};

function changeEntityState(
    entity: AnimatedEntity,
    nextState: StateMachineState,
    options: StateTransitionOptions = {}
): { stateChanged: boolean } {
    const previousState =
        options.previousState ??
        entity.stateMachine?.states.find(s => s.name === entity.currentState);
    const stateChanged = !previousState || previousState.id !== nextState.id;

    if (options.runExitActions !== false && stateChanged && previousState?.onExit?.length) {
        executeStateActions(entity, previousState.onExit);
    }

    entity.currentState = nextState.name;
    applyStatePropertiesFromState(entity, nextState);

    const shouldRunEnter =
        options.runEnterActions === false
            ? false
            : ((stateChanged || options.forceEnter) && !!nextState.onEnter?.length);

    if (shouldRunEnter && nextState.onEnter) {
        executeStateActions(entity, nextState.onEnter);
    }

    return { stateChanged };
}

const isAnyStateId = (stateId?: string): boolean => {
    if (typeof stateId !== 'string') return false;
    const normalized = stateId.trim().toLowerCase();
    return normalized === 'any' || normalized === '__any_state__' || normalized === 'any state (*)';
};

// Procesar condiciones y verificar transiciones
const processEventTransitions = useCallback((entity: AnimatedEntity) => {
    if (!entity.stateMachine || !entity.currentState) return;
    const entityEvents = pendingEvents.current.get(entity.instance.id);
    // Skip already collected items to avoid double-processing state actions
    const isCollectible = isCollectibleEntity(entity);
    if (isCollectible && (entity as any).__collectedOnce) {
        // Allow one final processing pass if there are pending events (e.g., collision_item)
        if (!entityEvents || entityEvents.size === 0) {
            if (entityEvents) entityEvents.clear();
            return;
        }
    }

    // Check if entity is waiting (WAIT action blocks all state transitions)
    if (entity.waitUntilTime !== undefined) {
        const now = performance.now();
        const entityLookup = new Map<string, AnimatedEntity>();
        for (const entity of entitiesRef.current) {
            entityLookup.set(entity.instance.id, entity);
        }
        resolveChildLinkParents(entitiesRef.current, entityLookup);
        if (now < entity.waitUntilTime) {
            // Still waiting, block all transitions
            return;
        } else {
            // Wait completed, clear the timer
            entity.waitUntilTime = undefined;
        }
    }

    const currentStateDef = entity.stateMachine.states.find(s => s.name === entity.currentState);
    if (!currentStateDef) return;

    // Look for transitions whose conditions are satisfied
    for (const transition of entity.stateMachine.transitions) {
        const fromMatchesCurrent = transition.fromStateId === currentStateDef.id;
        const fromIsAny = isAnyStateId(transition.fromStateId);
        if (!fromMatchesCurrent && !fromIsAny) continue;

        const conditionSatisfied = transition.conditions ? evaluateCondition(transition.conditions, entity) : true;
        if (conditionSatisfied && evaluateGuard(transition.guard)) {
            const toIsAny = isAnyStateId(transition.toStateId);
            const nextState = toIsAny
                ? currentStateDef
                : entity.stateMachine.states.find(s => s.id === transition.toStateId);
            if (nextState) {
                let stateChanged = false;
                if (!toIsAny) {
                    stateChanged = changeEntityState(entity, nextState, {
                        previousState: currentStateDef,
                        runEnterActions: false
                    }).stateChanged;
                }

                if (transition.actions) {
                    executeStateActions(entity, transition.actions);
                }

                if (!toIsAny && stateChanged) {
                    executeStateActions(entity, nextState.onEnter);
                }

                // Clear all pending events after processing the transition
                const entityEvents = pendingEvents.current.get(entity.instance.id);
                if (entityEvents) {
                    entityEvents.clear();
                }
                break; // Only allow a single transition per frame
            }
        }
    }
}, [evaluateCondition, changeEntityState, executeStateActions, evaluateGuard]);

const checkKeyTransitions = useCallback((entityId: string, pressedKey: string, isKeyDown: boolean) => {
    const entity = entitiesRef.current.find(e => e.instance.id === entityId);
    if (!entity) {
        return;
    }
    if (!entity.stateMachine) {
        // Input for non-statemachine entities is now handled in the animate loop.
        return;
    }
    if (!entity.currentState) {
        return;
    }
    const currentStateDef = entity.stateMachine.states.find(s => s.name === entity.currentState);
    if (!currentStateDef) {
        return;
    }
    for (const transition of entity.stateMachine.transitions) {
        const fromMatchesCurrent = transition.fromStateId === currentStateDef.id;
        const fromIsAny = isAnyStateId(transition.fromStateId);
        if (!fromMatchesCurrent && !fromIsAny) continue;
        const condition = transition.conditions;
        if (!condition) continue;
        let conditionMet = false;
        if (isKeyDown && condition.type === 'KEY_PRESSED' && condition.params?.key === pressedKey) {
            conditionMet = true;
        } else if (!isKeyDown && condition.type === 'KEY_RELEASED' && condition.params?.key === pressedKey) {
            conditionMet = true;
        }
        if (conditionMet) {
            const toIsAny = isAnyStateId(transition.toStateId);
            const nextState = toIsAny
                ? currentStateDef
                : entity.stateMachine.states.find(s => s.id === transition.toStateId);
            if (nextState) {
                let stateChanged = false;
                if (!toIsAny) {
                    stateChanged = changeEntityState(entity, nextState, {
                        previousState: currentStateDef,
                        runEnterActions: false
                    }).stateChanged;
                }
                if (transition.actions) {
                    executeStateActions(entity, transition.actions);
                }
                if (!toIsAny && stateChanged) {
                    executeStateActions(entity, nextState.onEnter);
                }
                return;
            }
        }
    }
}, []);

useEffect(() => {
    if (isOpen) {
        document.body.style.overflow = 'hidden';
        modalRef.current?.focus();
        const startNode = graphData.nodes.find(n => n.type === 'Start');
        if (startNode) setCurrentNodeId(startNode.id);
        setNavigationStack([]);
        setSelectedOptionIndex(0);
        setCurrentScreenMap(null);
        setCurrentWorldMapGraph(null);
        setGameFlowStack([]);
        setCurrentNestedGraphData(null);
        setCurrentExecutingGameFlowName(gameFlowAssetName);
        heroRef.current = null;
        pressedKeys.current.clear();
        jumpKeyProcessed.current = false;
        gameFlowExitRequestedRef.current = false;
        pendingNodeTransitionRef.current = null;

        // Reset transient session state to avoid stale values between plays
        // - Clear collected item registries
        try { boxPickedUpRegistry.current.clear(); } catch { }
        try { collectedItemsRegistry.current.clear(); } catch { }
        try { collectedTilesRegistry.current.clear(); } catch { }
        try { consumedInteractionRegistry.current.clear(); } catch { }
        hudImportedFrameRef.current = null;
        hudConfigRef.current = null;
        try { revealedSecretTiles.current.clear(); } catch { }
        // - Reset global variables (will be re-initialized by Globals node if present)
        updateGameGlobalVariables(() => ({}));
        // - Reset internal refs related to globals and timers
        gameGlobalVariablesRef.current = {};
        lastScreenTransitionTimeRef.current = 0;
        // - Ensure music is fully stopped on fresh play
        try {
            if (musicSynthesizerRef.current) {
                musicSynthesizerRef.current.stopAllNotes();
            }
            if (musicPlaybackIntervalRef.current) {
                clearInterval(musicPlaybackIntervalRef.current);
                musicPlaybackIntervalRef.current = null;
            }
            musicSynthesizerRef.current = null;
            currentMusicTrackIdRef.current = null;
            musicIsMutedRef.current = false;
        } catch { }
        // - Reset HUD version so overlays refresh deterministically
        try { setHudVersion(0); } catch { }
    } else {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        setTimeout(() => {
            const mainContainer = document.querySelector('.flex-grow.flex.overflow-hidden');
            if (mainContainer instanceof HTMLElement) {
                mainContainer.style.display = 'none';
                mainContainer.offsetHeight;
                mainContainer.style.display = '';
            }
            window.dispatchEvent(new Event('resize'));
            document.body.offsetHeight;
        }, 100);
    }
}, [isOpen, graphData, gameFlowAssetName]);

const expandMenuOptions = useCallback((subMenuNode: GameFlowSubMenuNode) => {
    const expandedOptions: Array<{ text: string, originalIndex: number, isControlOption?: boolean, controlValue?: string }> = [];
    subMenuNode.options.forEach((option, idx) => {
        if (option.type === 'controls' && option.controlOptions && option.controlOptions.length > 0) {
            option.controlOptions.forEach(ctrl => {
                expandedOptions.push({ text: ctrl, originalIndex: idx, isControlOption: true, controlValue: ctrl });
            });
        } else {
            expandedOptions.push({ text: option.text, originalIndex: idx });
        }
    });
    return expandedOptions;
}, []);

const handleAction = useCallback(() => {
    if (!currentNode || currentNode.type !== 'SubMenu') return;
    const subMenuNode = currentNode as GameFlowSubMenuNode;
    const expandedOptions = expandMenuOptions(subMenuNode);
    const selectedExpanded = expandedOptions[selectedOptionIndex];
    if (!selectedExpanded) return;
    const selectedOption = subMenuNode.options[selectedExpanded.originalIndex];
    if (!selectedOption) return;
    if (selectedExpanded.isControlOption && selectedExpanded.controlValue && selectedOption.globalVariableName) {
        const resolvedVarName = normalizeVariableName(selectedOption.globalVariableName);
        if (resolvedVarName) {
            updateGameGlobalVariables(prev => ({
                ...prev,
                [resolvedVarName]: selectedExpanded.controlValue
            }));
        }
    }
    const connection = connections.find(c => c.from.nodeId === currentNode.id && c.from.sourceId === selectedOption.id);
    if (connection) {
        let targetNodeId = connection.to.nodeId;
        let targetNode = nodes.find(n => n.id === targetNodeId);
        while (targetNode && targetNode.type === 'Waypoint') {
            const nextConn = connections.find(c => c.from.nodeId === targetNodeId);
            if (nextConn) {
                targetNodeId = nextConn.to.nodeId;
                targetNode = nodes.find(n => n.id === targetNodeId);
            } else {
                break;
            }
        }
        setNavigationStack(prev => [...prev, currentNode.id]);
        setCurrentNodeId(targetNodeId);
        setSelectedOptionIndex(0);
    }
}, [currentNode, connections, selectedOptionIndex, nodes, expandMenuOptions]);

const handleGoBack = useCallback(() => {
    if (navigationStack.length > 0) {
        const lastNodeId = navigationStack[navigationStack.length - 1];
        setNavigationStack(prev => prev.slice(0, -1));
        setCurrentNodeId(lastNodeId);
        setSelectedOptionIndex(0);
    } else if (currentNode?.type === 'WorldLink') {
        onClose();
    }
}, [navigationStack, currentNode, onClose]);

// Keep refs in sync for gamepad handlers
useEffect(() => {
    handleActionRef.current = handleAction;
    handleGoBackRef.current = handleGoBack;
}, [handleAction, handleGoBack]);
useEffect(() => {
    checkKeyTransitionsRef.current = checkKeyTransitions;
}, [checkKeyTransitions]);
useEffect(() => {
    expandMenuOptionsRef.current = expandMenuOptions;
}, [expandMenuOptions]);

const handleScreenTransition = useCallback((toNodeId: string) => {
    if (!currentWorldMapGraph) return;
    const nextScreenNode = currentWorldMapGraph.nodes.find(n => n.id === toNodeId);
    if (!nextScreenNode) return;
    const nextScreenAsset = allAssets.find(a => a.id === nextScreenNode.screenAssetId && a.type === 'screenmap');
    if (!nextScreenAsset) return;

    // Skip checkpoint persistence here because:
    // - Border crossings set playerEntryPoint and the effect will record the safe spot
    // - Manual transitions follow the same flow and would double-save otherwise
    // Mark transition time to debounce immediate re-exit on arrival
    try { lastScreenTransitionTimeRef.current = (typeof performance !== 'undefined' ? performance.now() : Date.now()); } catch { lastScreenTransitionTimeRef.current = Date.now(); }

    setCurrentScreenMap(nextScreenAsset.data as ScreenMap);
}, [currentWorldMapGraph, allAssets]);

const resolveDefaultGameFlowExitNode = useCallback((fromNodeId: string): string | null => {
    const conn = connections.find(c => c.from.nodeId === fromNodeId);
    if (!conn) return null;

    let targetNodeId = conn.to.nodeId;
    let targetNode = nodes.find(n => n.id === targetNodeId);
    while (targetNode && targetNode.type === 'Waypoint') {
        const nextConn = connections.find(c => c.from.nodeId === targetNodeId);
        if (!nextConn) break;
        targetNodeId = nextConn.to.nodeId;
        targetNode = nodes.find(n => n.id === targetNodeId);
    }
    return targetNodeId;
}, [connections, nodes]);

const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    // Remove both e.key and e.code for compatibility
    if (heroRef.current) {
        if (pressedKeys.current.has(e.key)) {
            pressedKeys.current.delete(e.key);
        }
        if (e.code && pressedKeys.current.has(e.code)) {
            pressedKeys.current.delete(e.code);
        }
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            checkKeyTransitions(heroRef.current.instance.id, e.key, false);
        }
    }
    // Reset jump key processed flag when space is released
    if (e.key === ' ') {
        jumpKeyProcessed.current = false;
    }
}, [checkKeyTransitions]);

// Ensure keyboard is captured even if modal loses focus (e.g., fullscreen)
useEffect(() => {
    if (!isOpen) return;
    const onWindowKeyDown = (e: KeyboardEvent) => {
        if (currentNode?.type !== 'WorldLink') return;
        // Mirror minimal logic from handleKeyDown for gameplay
        if (!pressedKeys.current.has(e.key)) pressedKeys.current.add(e.key);
        if (e.code && !pressedKeys.current.has(e.code)) pressedKeys.current.add(e.code);
        if (heroRef.current && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            checkKeyTransitions(heroRef.current.instance.id, e.key, true);
        }
    };
    const onWindowKeyUp = (e: KeyboardEvent) => {
        if (currentNode?.type !== 'WorldLink') return;
        if (pressedKeys.current.has(e.key)) pressedKeys.current.delete(e.key);
        if (e.code && pressedKeys.current.has(e.code)) pressedKeys.current.delete(e.code);
        if (heroRef.current && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            checkKeyTransitions(heroRef.current.instance.id, e.key, false);
        }
        if (e.key === ' ') {
            jumpKeyProcessed.current = false;
        }
    };
    window.addEventListener('keydown', onWindowKeyDown);
    window.addEventListener('keyup', onWindowKeyUp);
    return () => {
        window.removeEventListener('keydown', onWindowKeyDown);
        window.removeEventListener('keyup', onWindowKeyUp);
    };
}, [isOpen, currentNode?.type, checkKeyTransitions]);

const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.preventDefault();
    if (!currentNode) return;
    if (currentNode.type === 'SubMenu') {
        const subMenuNode = currentNode as GameFlowSubMenuNode;
        const expandedOptions = expandMenuOptions(subMenuNode);
        const maxIndex = expandedOptions.length - 1;
        switch (e.key) {
            case 'ArrowUp': setSelectedOptionIndex(prev => Math.max(0, prev - 1)); break;
            case 'ArrowDown': setSelectedOptionIndex(prev => Math.min(maxIndex, prev + 1)); break;
            case ' ': case 'Enter': handleAction(); break;
            case 'Escape': handleGoBack(); break;
        }
    } else if (currentNode.type === 'Text' || currentNode.type === 'Restart' || currentNode.type === 'Music' || currentNode.type === 'PresentationScreen') {
        switch (e.key) {
            case ' ': case 'Enter':
                if (currentNode.type === 'Restart') {
                    // Hard reset transient gameplay/session state to avoid stale entities (e.g., carried boxes)
                    try { boxPickedUpRegistry.current.clear(); } catch { }
                    try { collectedItemsRegistry.current.clear(); } catch { }
                    try { collectedTilesRegistry.current.clear(); } catch { }
                    try { consumedInteractionRegistry.current.clear(); } catch { }
        hudImportedFrameRef.current = null;
        hudConfigRef.current = null;
                    try { revealedSecretTiles.current.clear(); } catch { }
                    updateGameGlobalVariables(() => ({}));
                    try { gameGlobalVariablesRef.current = {}; } catch { }
                    try { lastScreenTransitionTimeRef.current = 0; } catch { }

                    // Stop any playing music and clear playback state
                    try {
                        if (musicSynthesizerRef.current) {
                            musicSynthesizerRef.current.stopAllNotes();
                        }
                        if (musicPlaybackIntervalRef.current) {
                            clearInterval(musicPlaybackIntervalRef.current);
                            musicPlaybackIntervalRef.current = null;
                        }
                        musicSynthesizerRef.current = null;
                        currentMusicTrackIdRef.current = null;
                        musicIsMutedRef.current = false;
                    } catch { }

                    // CRITICAL: Clear carried box reference before clearing entities
                    // This prevents Box ghosts when restarting while carrying a Box
                    if (heroRef.current?.carriedBox) {
                        heroRef.current.carriedBox = null;
                    }

                    // Clear runtime entities and input state
                    entitiesRef.current = [];
                    heroRef.current = null;
                    pressedKeys.current.clear();
                    jumpKeyProcessed.current = false;
                    try { setPlayerEntryPoint(null); } catch { }

                    // Reset screen/world so next Start reinitializes cleanly
                    setCurrentScreenMap(null);
                    setCurrentWorldMapGraph(null);
                    setGameFlowStack([]);
                    setCurrentNestedGraphData(null);
                    setCurrentExecutingGameFlowName(gameFlowAssetName);
                    try { setHudVersion(0); } catch { }

                    const startNode = nodes.find(n => n.type === 'Start');
                    if (startNode) {
                        setCurrentNodeId(startNode.id);
                        setNavigationStack([]);
                        setSelectedOptionIndex(0);
                    }
                    break;
                }
                const conn = connections.find(c => c.from.nodeId === currentNode.id);
                if (conn) {
                    let targetNodeId = conn.to.nodeId;
                    let targetNode = nodes.find(n => n.id === targetNodeId);
                    while (targetNode && targetNode.type === 'Waypoint') {
                        const nextConn = connections.find(c => c.from.nodeId === targetNodeId);
                        if (nextConn) {
                            targetNodeId = nextConn.to.nodeId;
                            targetNode = nodes.find(n => n.id === targetNodeId);
                        } else {
                            break;
                        }
                    }
                    setCurrentNodeId(targetNodeId);
                }
                break;
            case 'Escape': handleGoBack(); break;
        }
    } else if (currentNode.type === 'WorldLink') {
        if (heroRef.current) {
            if (e.code === 'Space') {
                // Jump logic is now handled in the animate loop
            }
            // Add both e.key and e.code for compatibility (e.g., "n" and "KeyN")
            // e.key for legacy comp_cursors/comp_jump, e.code for State Machine conditions
            if (!pressedKeys.current.has(e.key)) {
                pressedKeys.current.add(e.key);
            }
            if (e.code && !pressedKeys.current.has(e.code)) {
                pressedKeys.current.add(e.code);
            }
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                checkKeyTransitions(heroRef.current.instance.id, e.key, true);
            }
            if (e.key === 'Escape') {
                // If in fullscreen, exit fullscreen first
                if (isFullscreen) {
                    setIsFullscreen(false);
                } else {
                    handleGoBack();
                }
            }
            return;
        }
        const currentScreenNode = currentWorldMapGraph?.nodes.find(n => n.screenAssetId === currentScreenMap?.id);
        if (!currentScreenNode || !currentWorldMapGraph) return;
        const findAndTransition = (direction: 'north' | 'south' | 'east' | 'west') => {
            const outgoing = currentWorldMapGraph.connections.find(c => c.fromNodeId === currentScreenNode.id && c.fromDirection === direction);
            if (outgoing) { handleScreenTransition(outgoing.toNodeId); return; }
            const incoming = currentWorldMapGraph.connections.find(c => c.toNodeId === currentScreenNode.id && c.toDirection === direction);
            if (incoming) handleScreenTransition(incoming.fromNodeId);
        };
        switch (e.key) {
            case 'ArrowUp': findAndTransition('north'); break;
            case 'ArrowDown': findAndTransition('south'); break;
            case 'ArrowLeft': findAndTransition('west'); break;
            case 'ArrowRight': findAndTransition('east'); break;
            case 'Escape': handleGoBack(); break;
        }
    }
}, [currentNode, currentScreenMap, currentWorldMapGraph, handleScreenTransition, handleAction, handleGoBack, checkKeyTransitions, expandMenuOptions, nodes, connections, isFullscreen]);

useEffect(() => {
    if (!isOpen || currentNode?.type !== 'WorldLink' || currentScreenMap) return;
    const worldMapAsset = allAssets.find(a => a.id === (currentNode as GameFlowWorldLinkNode).worldAssetId && a.type === 'worldmap');
    if (!worldMapAsset) return;
    const worldMapGraph = worldMapAsset.data as WorldMapGraph;
    if (!worldMapGraph?.startScreenNodeId) return;
    setCurrentWorldMapGraph(worldMapGraph);
    const startScreenNode = worldMapGraph.nodes.find(n => n.id === worldMapGraph.startScreenNodeId);
    if (!startScreenNode) return;
    const screenMapAsset = allAssets.find(a => a.id === startScreenNode.screenAssetId && a.type === 'screenmap');
    if (!screenMapAsset) return;
    setCurrentScreenMap(screenMapAsset.data as ScreenMap);
}, [isOpen, currentNode, allAssets, currentScreenMap]);

useEffect(() => {
    if (!isOpen || currentNode?.type !== 'WorldLink' || !currentScreenMap?.id) {
        screenTimerRuntimeRef.current = { screenId: null, lastTickTime: 0, carryMs: 0 };
        return;
    }

    if (screenTimerRuntimeRef.current.screenId === currentScreenMap.id) {
        return;
    }

    resetScreenTimer(currentScreenMap.id);
}, [isOpen, currentNode?.type, currentScreenMap?.id, resetScreenTimer]);

// Build screen world map when WorldMapGraph changes
useEffect(() => {
    if (currentWorldMapGraph) {

        // Log all nodes
        currentWorldMapGraph.nodes.forEach(node => {
        });

        // Log all connections
        currentWorldMapGraph.connections.forEach(conn => {
        });

        const screenWorldMap = buildScreenWorldMap(currentWorldMapGraph);
        screenWorldMapRef.current = screenWorldMap;

        // Log all screen positions
        screenWorldMap.forEach((pos, screenId) => {
        });
    } else {
        screenWorldMapRef.current = new Map();
    }
}, [currentWorldMapGraph]);

// Update currentScreenMap when the underlying asset changes in allAssets
useEffect(() => {
    if (!isOpen || !currentScreenMap) return;
    const updatedScreenMapAsset = allAssets.find(a => a.id === currentScreenMap.id && a.type === 'screenmap');
    if (!updatedScreenMapAsset) return;
    const updatedScreenMap = updatedScreenMapAsset.data as ScreenMap;
    // Only update if the reference has actually changed (indicating an update occurred)
    if (updatedScreenMap !== currentScreenMap) {
        setCurrentScreenMap(updatedScreenMap);
    }
}, [isOpen, allAssets, currentScreenMap]);

useEffect(() => {
    if (!isOpen) {
        heroRef.current = null;
        nucleoPositionsRef.current = [];
        autoDialoguePreviewRef.current = { active: false, text: '', visibleChars: 0, lastCharAt: 0, charDelayMs: 35 };
        autoEventSpaceWasDownRef.current = false;
        return;
    }
    if (!currentScreenMap) {
        entitiesRef.current = [];
        nucleoPositionsRef.current = [];
        autoDialoguePreviewRef.current = { active: false, text: '', visibleChars: 0, lastCharAt: 0, charDelayMs: 35 };
        autoEventSpaceWasDownRef.current = false;
        return;
    };
    nucleoPositionsRef.current = [];
    // Store refs for use inside asynchronous actions
    currentScreenMapRef.current = currentScreenMap;
    currentWorldMapGraphRef.current = currentWorldMapGraph;

    // Capture HUD config from the first screen that has it (persists across transitions)
    if (!hudConfigRef.current && currentScreenMap.hudConfiguration?.elements?.length) {
        hudConfigRef.current = currentScreenMap.hudConfiguration;
    }
    if (!hudImportedFrameRef.current && currentScreenMap.hudConfiguration?.importedFrame?.cells?.length) {
        hudImportedFrameRef.current = currentScreenMap.hudConfiguration.importedFrame;
    }
    setPlayerEntryPointRef.current = setPlayerEntryPoint;
    handleScreenTransitionRef.current = handleScreenTransition;


    // Initialize runtime collision layer (cloned from screenMap for in-game modifications)
    const effectiveBehaviorLayer = getScreenBehaviorLayer(currentScreenMap);
    if (effectiveBehaviorLayer) {
        const clonedLayer = JSON.parse(JSON.stringify(effectiveBehaviorLayer));
        runtimeCollisionLayerRef.current = clonedLayer;
        setRuntimeCollisionLayer(clonedLayer);
    } else {
        const height = currentScreenMap.height ?? gridHeightTiles;
        const width = currentScreenMap.width ?? gridWidthTiles;
        const emptyLayer: ScreenTile[][] = Array.from({ length: height }, () =>
            Array.from({ length: width }, () => ({ tileId: null }))
        );
        runtimeCollisionLayerRef.current = emptyLayer;
        setRuntimeCollisionLayer(emptyLayer);
    }

    const getAsset = <T extends AssetType>(assetId: string | null | undefined, assetType: T): ProjectAsset | undefined => {
        if (!assetId) return undefined;
        return allAssets.find(a => a.id === assetId && a.type === assetType);
    };

    const nativeEntities = currentScreenMap.layers.entities.map(instance => {
        const template = entityTemplates.find(t => t.id === instance.entityTemplateId);
        if (!template) return null;
        const templateName = (template.name || '').toLowerCase();
        const templateIdNormalized = (template.id || '').toLowerCase();
        const isNucleoTemplate = templateName === 'nucleo' || templateIdNormalized === 'nucleo';
        if (isNucleoTemplate) {
            nucleoPositionsRef.current.push({
                x: instance.position.x * TILE_SIZE,
                y: instance.position.y * TILE_SIZE
            });
            return null; // Use nucleo as a spawn anchor only
        }
        let spriteAssetId: string | undefined;
        if (instance.componentOverrides) {
            for (const compId in instance.componentOverrides) {
                const compDef = componentDefinitions.find(c => c.id === compId);
                const spriteProp = compDef?.properties.find(p => p.type === 'sprite_ref');
                if (spriteProp && instance.componentOverrides[compId]?.[spriteProp.name]) {
                    spriteAssetId = instance.componentOverrides[compId][spriteProp.name];
                    break;
                }
            }
        }
        if (!spriteAssetId) {
            for (const comp of template.components) {
                const compDef = componentDefinitions.find(c => c.id === comp.definitionId);
                const spriteProp = compDef?.properties.find(p => p.type === 'sprite_ref');
                if (spriteProp && comp.defaultValues?.[spriteProp.name]) {
                    spriteAssetId = comp.defaultValues[spriteProp.name];
                    break;
                }
            }
        }
        const spriteAsset = getAsset(spriteAssetId, 'sprite');
        const sprite = spriteAsset?.data as Sprite;
        if (!sprite?.frames?.length) return null;
        const frameImages = sprite.frames.map(frame => {
            const img = new Image();
            img.src = createSpriteDataURL(frame.data, sprite.size.width, sprite.size.height);
            return img;
        });
        let mirroredFrameImages: HTMLImageElement[] | undefined;
        if (['right', 'left'].includes(sprite.facingDirection)) {
            mirroredFrameImages = sprite.frames.map(frame => {
                const mirroredData = mirrorPixelDataHorizontally(frame.data as PixelData);
                const img = new Image();
                img.src = createSpriteDataURL(mirroredData, sprite.size.width, sprite.size.height);
                return img;
            });
        }
        let stateMachine: StateMachine | undefined;
        let currentState: string | undefined;
        let initialStateDef: StateMachineState | undefined;
        const smc = template.components.find(c => c.definitionId === 'comp_statemachine');
        const smcOverride = instance.componentOverrides?.['comp_statemachine'];
        const stateMachineAssetId = smcOverride?.stateMachineAssetId || smc?.defaultValues?.stateMachineAssetId;
        if (stateMachineAssetId && stateMachineAssetId !== '0' && stateMachineAssetId !== '') {
            const stateMachineAsset = getAsset(stateMachineAssetId, 'statemachine');
            stateMachine = stateMachineAsset?.data as StateMachine | undefined;
            if (stateMachine) {
                const startStateId = smcOverride?.currentStateId || smc?.defaultValues?.currentStateId || stateMachine.initialStateId;
                let initialState = stateMachine.states.find(s => s.id === startStateId);
                if (!initialState && startStateId) initialState = stateMachine.states.find(s => s.name === startStateId);
                if (!initialState) initialState = stateMachine.states.find(s => s.name.toLowerCase() === 'idle') || stateMachine.states[0];
                initialStateDef = initialState;
                currentState = initialState?.name;
            }
        }
        // Merge patrol component defaultValues with componentOverrides
        const patrolTemplateComp = template.components.find(c => c.definitionId === 'comp_patrol');
        const patrolComp = {
            ...(patrolTemplateComp?.defaultValues || {}),
            ...(instance.componentOverrides?.comp_patrol || {})
        };
        let startX = instance.position.x * TILE_SIZE;
        let startY = instance.position.y * TILE_SIZE;


        let vx = 0, vy = 0;
        if (patrolComp?.waypoint1_x !== undefined && patrolComp?.waypoint1_y !== undefined) {
            // IMPORTANT: if waypoint1 exists, prefer those coordinates as the starting point
            startX = Number(patrolComp.waypoint1_x);
            startY = Number(patrolComp.waypoint1_y);

            // Calculate the direction vector toward waypoint2
            const endX = Number(patrolComp.waypoint2_x ?? startX);
            const endY = Number(patrolComp.waypoint2_y ?? startY);

            const dx = endX - startX;
            const dy = endY - startY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Apply the component speed to build the velocity vector
            const speed = Number(patrolComp.speed) || 1;
            if (dist > 0) {
                vx = (dx / dist) * speed;
                vy = (dy / dist) * speed;
            }

        }

        // Initialize multi-screen properties if enabled
        let globalX: number | undefined;
        let globalY: number | undefined;
        let originScreenId: string | undefined;

        if (patrolComp?.multiScreen === true || patrolComp?.multiScreen === 'true') {
            originScreenId = currentScreenMap.id;
            const screenPos = screenWorldMapRef.current.get(currentScreenMap.id);
            if (screenPos) {
                globalX = screenPos.globalX + startX;
                globalY = screenPos.globalY + startY;
            }
        }

        // Initialize ownerScreenId for Box entities (screen persistence)
        const isBoxEntity = template.components?.some(c => c.definitionId === 'comp_box') || /box/i.test(template.name);
            const isCollectibleItem = isCollectibleTemplate(template);
        const ownerScreenId = (isBoxEntity || isCollectibleItem) ? currentScreenMap.id : undefined;

        // Skip Box entities that have already been picked up from this screen
        if (isBoxEntity && ownerScreenId) {
            const registryKey = `${ownerScreenId}_${instance.id}`;
            if (boxPickedUpRegistry.current.has(registryKey)) {
                return null; // This box was already picked up, don't respawn it
            }
        }

        // Skip Collectible items that have already been collected from this screen
        if (isCollectibleItem && ownerScreenId) {
            const registryKey = `${ownerScreenId}_${instance.id}`;
            if (collectedItemsRegistry.current.has(registryKey)) {
                return null; // This item was already collected, don't respawn it
            }
        }

        const childLink = parseChildLinkConfig(template, instance);
        const lifetimeMs = resolveLifetimeMs(template, instance);
        const expiresAt = lifetimeMs ? performance.now() + lifetimeMs : undefined;
        const autoEventRuntime = createAutoEventRuntime(template, instance);

        const newEntity = {
            instance, template, sprite, spriteAssetId, x: startX, y: startY, vx, vy,
            gravityVel: 0,
            frameImages, mirroredFrameImages, currentFrame: 0, lastFrameUpdateTime: 0,
                    stateMachine, currentState, isOnGround: false, isOnLadder: false, spawnTime: performance.now(),
            screenAssetId: currentScreenMap.id,
            globalX, globalY, originScreenId, parentEntityId: null, platformGraceFramesLeft: 0,
            ownerScreenId,
            childLink,
            lifetimeMs,
            expiresAt,
            autoEventRuntime
        };

        if (stateMachine && initialStateDef) {
            changeEntityState(newEntity, initialStateDef, { runExitActions: false });
        }

        // Debug log for multi-screen entities
        if (globalX !== undefined || globalY !== undefined) {
        }

        return newEntity;
    }).filter(Boolean) as AnimatedEntity[];

    let entitiesToAnimate = nativeEntities;
    let heroForThisScreen: AnimatedEntity | undefined;

    // Si hay playerEntryPoint (cruce de borde), SIEMPRE usar el hero actual (carry over)
    if (playerEntryPoint && heroRef.current) {

        // IMPORTANTE: Remover el player nativo si existe, para evitar duplicados
        entitiesToAnimate = entitiesToAnimate.filter(e =>
            !e.template.components.some(c => c.definitionId === 'comp_cursors' || c.definitionId === 'comp_player_input') &&
            e.template.name !== 'Player'
        );

        entitiesToAnimate.push(heroRef.current);
        // Also carry over any carried box
        if (heroRef.current.carriedBox) {
            const carried = heroRef.current.carriedBox;
            if (!entitiesToAnimate.some(e => e.instance.id === carried.instance.id)) {
                entitiesToAnimate.push(carried);
            }
        }
        heroForThisScreen = heroRef.current;
    } else {
        // Si NO hay playerEntryPoint, buscar hero nativo o usar carry over
        heroForThisScreen = entitiesToAnimate.find(e => e.template.components.some(c => c.definitionId === 'comp_cursors' || c.definitionId === 'comp_player_input') || e.template.name === 'Player');
        if (heroRef.current && !heroForThisScreen) {
            entitiesToAnimate.push(heroRef.current);
            // Also carry over any carried box
            if (heroRef.current.carriedBox) {
                const carried = heroRef.current.carriedBox;
                if (!entitiesToAnimate.some(e => e.instance.id === carried.instance.id)) {
                    entitiesToAnimate.push(carried);
                }
            }
            heroForThisScreen = heroRef.current;
        }
    }

    // === CARRY-OVER DE ENTIDADES MULTI-PANTALLA Y SUS HIJOS ===
    // Mantener entidades multi-pantalla (como plataformas) y cualquier child-link atado a ellas o al player
    if (entitiesRef.current.length > 0) {
        const carryOverParents = new Set<string>();
        if (heroForThisScreen) {
            carryOverParents.add(heroForThisScreen.instance.id);
        }

        const carryOverEntities: AnimatedEntity[] = [];
        const carryOverInstanceIds = new Set<string>();
        const enqueueCarryOver = (entity: AnimatedEntity) => {
            if (entity === heroRef.current) return;
            if (carryOverInstanceIds.has(entity.instance.id)) return;
            carryOverInstanceIds.add(entity.instance.id);
            carryOverEntities.push(entity);
        };

        const previousMultiScreenEntities = entitiesRef.current.filter(e => {
            if (e === heroRef.current) return false; // Hero ya se maneja por separado

            // Check if entity has multi-screen patrol
            const patrolTemplateComp = e.template.components.find(c => c.definitionId === 'comp_patrol');
            const patrolComp = {
                ...(patrolTemplateComp?.defaultValues || {}),
                ...(e.instance.componentOverrides?.comp_patrol || {})
            };
            const isMultiScreenPatrol = patrolComp.multiScreen === true || patrolComp.multiScreen === 'true';

            // Also keep Box entities that have ownerScreenId (belong to a specific screen)
            const isBox = e.template.components?.some(c => c.definitionId === 'comp_box') || /box/i.test(e.template.name);
            const boxHasOwner = isBox && e.ownerScreenId !== undefined;

            return isMultiScreenPatrol || boxHasOwner;
        });

        previousMultiScreenEntities.forEach(entity => {
            enqueueCarryOver(entity);
            carryOverParents.add(entity.instance.id);
        });

        // Propagar child-links que dependen de un parent que persiste (player o multi-screen)
        if (carryOverParents.size > 0) {
            let foundFollower = true;
            while (foundFollower) {
                foundFollower = false;
                for (const candidate of entitiesRef.current) {
                    if (candidate === heroRef.current) continue;
                    if (!candidate.childLink || !candidate.parentEntityId) continue;
                    if (carryOverInstanceIds.has(candidate.instance.id)) continue;
                    if (carryOverParents.has(candidate.parentEntityId)) {
                        enqueueCarryOver(candidate);
                        carryOverParents.add(candidate.instance.id);
                        foundFollower = true;
                    }
                }
            }
        }

        if (carryOverEntities.length > 0) {

            // IMPORTANT: Remove native entities that have same instance.id as carry-over entities
            // to avoid duplicates when returning a screen
            const carryOverIds = new Set(carryOverEntities.map(e => e.instance.id));
            const originalCount = entitiesToAnimate.length;
            entitiesToAnimate = entitiesToAnimate.filter(e => {
                const isDuplicate = carryOverIds.has(e.instance.id);
                if (isDuplicate) {
                }
                return !isDuplicate;
            });

            carryOverEntities.forEach(entity => {

                // Update local coordinates from global coordinates for new screen
                if (entity.globalX !== undefined && entity.globalY !== undefined) {
                    const localCoord = globalToLocal(
                        { x: entity.globalX, y: entity.globalY },
                        screenWorldMapRef.current
                    );

                    if (localCoord && localCoord.screenId === currentScreenMap.id) {
                        // Entity is visible in current screen
                        entity.x = localCoord.x;
                        entity.y = localCoord.y;
                    } else {
                        // Entity is in another screen - position off-screen but keep in memory
                        entity.x = -1000;
                        entity.y = -1000;
                    }
                }

                // Ensure frame images are loaded (in case of context reset or missing images)
                try {
                    const spriteData = entity.sprite;
                    if (!entity.frameImages || entity.frameImages.length === 0 || !entity.frameImages[0] || !entity.frameImages[0].complete) {
                        const rebuilt = spriteData.frames.map(frame => {
                            const img = new Image();
                            img.src = createSpriteDataURL(frame.data, spriteData.size.width, spriteData.size.height);
                            return img;
                        });
                        entity.frameImages = rebuilt;
                        if (spriteData.facingDirection === 'left' || spriteData.facingDirection === 'right') {
                            const mirrored = spriteData.frames.map(frame => {
                                const mirroredData = mirrorPixelDataHorizontally(frame.data as PixelData);
                                const mimg = new Image();
                                mimg.src = createSpriteDataURL(mirroredData, spriteData.size.width, spriteData.size.height);
                                return mimg;
                            });
                            entity.mirroredFrameImages = mirrored;
                        }
                        entity.currentFrame = 0;
                        entity.lastFrameUpdateTime = 0;
                    }
                } catch (err) {
                    // Silently fail
                }

                // Always add carry-over entity (it's already filtered from duplicates)
                entitiesToAnimate.push(entity);
            });
        }
    }

    // Save the hero checkpoint every time we enter the screen
    if (heroForThisScreen) {
        let checkpointX: number;
        let checkpointY: number;

        if (playerEntryPoint) {
            // Edge transition: honor the supplied playerEntryPoint coordinates
            heroForThisScreen.x = playerEntryPoint.x;
            heroForThisScreen.y = playerEntryPoint.y;
            heroForThisScreen.vx = 0;
            heroForThisScreen.vy = 0;
            heroForThisScreen.gravityVel = 0;
            checkpointX = Math.round(playerEntryPoint.x);
            checkpointY = Math.round(playerEntryPoint.y);
        } else {
            // Initial load: use the hero position from the entity itself
            checkpointX = Math.round(heroForThisScreen.x);
            checkpointY = Math.round(heroForThisScreen.y);
        }

        // Always persist checkpoints, even if one already existed for this screen
        // Entry point is only for positioning the player visually
        if (playerEntryPoint) {
            heroForThisScreen.x = playerEntryPoint.x;
            heroForThisScreen.y = playerEntryPoint.y;
            heroForThisScreen.vx = 0;
            heroForThisScreen.vy = 0;
            heroForThisScreen.gravityVel = 0;
            setPlayerEntryPoint(null); // Entry point was consumed
        }

        // Checkpoint: clamp to the active gameplay area of the current screen
        const activeBounds = getScreenActiveBoundsPx(currentScreenMap);
        const safeX = Math.max(activeBounds.leftPx + 8, Math.min(activeBounds.rightPx - heroForThisScreen.sprite.size.width - 8, Math.round(heroForThisScreen.x)));
        const safeY = Math.max(activeBounds.topPx + 8, Math.min(activeBounds.bottomPx - heroForThisScreen.sprite.size.height - 8, Math.round(heroForThisScreen.y)));

        updateGameGlobalVariables(prev => ({
            ...prev,
            playerCheckpointX: safeX,
            playerCheckpointY: safeY,
            playerCheckpointScreen: currentScreenMap.id
        }));
    }
    setPlayerEntryPoint(null);
    entitiesRef.current = entitiesToAnimate;
    heroRef.current = heroForThisScreen || null;

    if (heroForThisScreen && playerEntryPoint) {
        pressedKeys.current.forEach(key => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
                checkKeyTransitions(heroForThisScreen!.instance.id, key, true);
            }
        });
        setPlayerEntryPoint(null);
    }
}, [isOpen, currentScreenMap, allAssets, entityTemplates, componentDefinitions, checkKeyTransitions, getScreenActiveBoundsPx]);

useEffect(() => {
    if (!isOpen || !currentNode) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.imageSmoothingEnabled = false;

    // --- Nuevo: Pre-renderizado de Tiles ---
    const subMenuNode = currentNode.type === 'SubMenu' ? currentNode as GameFlowSubMenuNode : null;
    const textNodeForBg = currentNode.type === 'Text' ? currentNode as GameFlowTextNode : null;
    const bgScreenAssetId = subMenuNode?.appearance?.backgroundScreenAssetId || textNodeForBg?.appearance?.backgroundScreenAssetId;
    const bgAsset = bgScreenAssetId ? allAssets.find(a => a.id === bgScreenAssetId) : null;
    const screenMapToRender = currentScreenMap || (bgAsset?.data as ScreenMap);
    const tileset = allAssets.filter(a => a.type === 'tile').map(a => a.data as Tile);

    type CollisionCheckOptions = {
        ignoreTopSolid?: boolean;
        platformContext?: { hitboxBottom: number; velocityY: number };
    };

    const checkCollisionAt = (x: number, y: number, screenMap: ScreenMap, options?: CollisionCheckOptions) => {
        const tileX = Math.floor(x / TILE_SIZE);
        const tileY = Math.floor(y / TILE_SIZE);
        if (tileX < 0 || tileX >= screenMap.width || tileY < 0 || tileY >= screenMap.height) return false;

        // Use runtimeCollisionLayerRef when rendering the active screen so tile edits are respected
        const useRuntimeLayer = screenMap === currentScreenMap && runtimeCollisionLayerRef.current.length > 0;
        const collisionLayer = useRuntimeLayer ? runtimeCollisionLayerRef.current : getScreenBehaviorLayer(screenMap);
        const tileOnLayer = collisionLayer[tileY]?.[tileX];

        if (!tileOnLayer || !tileOnLayer.tileId) return false;
        const tile = tileset.find(t => t.id === tileOnLayer.tileId);
        const logical = tile?.logicalProperties;
        if (!logical?.isSolid) return false;

        // Treat familyId 2 as "top-solid/platform": only solid when approached from above
        const isTopSolid = logical.familyId === 2;
        if (isTopSolid) {
            if (options?.ignoreTopSolid) return false;

            // If we have motion context, only collide when falling/standing above the tile
            if (options?.platformContext) {
                const tileTop = tileY * TILE_SIZE;
                const wasAbove = options.platformContext.hitboxBottom <= tileTop + 2; // Small tolerance
                const descendingOrIdle = options.platformContext.velocityY >= 0;
                if (!(wasAbove && descendingOrIdle)) {
                    return false;
                }
            }
        }

        return true;
    };

    const checkDangerousTileAt = (x: number, y: number, screenMap: ScreenMap) => {
        const tileX = Math.floor(x / TILE_SIZE);
        const tileY = Math.floor(y / TILE_SIZE);
        if (tileX < 0 || tileX >= screenMap.width || tileY < 0 || tileY >= screenMap.height) return false;

        const useRuntimeLayer = screenMap === currentScreenMap && runtimeCollisionLayerRef.current.length > 0;
        const collisionLayer = useRuntimeLayer ? runtimeCollisionLayerRef.current : getScreenBehaviorLayer(screenMap);
        const tileOnLayer = collisionLayer[tileY]?.[tileX];

        if (!tileOnLayer || !tileOnLayer.tileId) return false;
        const tile = tileset.find(t => t.id === tileOnLayer.tileId);
        return tile?.logicalProperties?.causesDamage ?? false;
    };

    const isLadderTileAt = (x: number, y: number, screenMap: ScreenMap) => {
        const tileX = Math.floor(x / TILE_SIZE);
        const tileY = Math.floor(y / TILE_SIZE);
        if (tileX < 0 || tileX >= screenMap.width || tileY < 0 || tileY >= screenMap.height) return false;

        const useRuntimeLayer = screenMap === currentScreenMap && runtimeCollisionLayerRef.current.length > 0;
        const collisionLayer = useRuntimeLayer ? runtimeCollisionLayerRef.current : getScreenBehaviorLayer(screenMap);
        const tileOnLayer = collisionLayer[tileY]?.[tileX];
        if (!tileOnLayer?.tileId) return false;

        const tile = tileset.find(t => t.id === tileOnLayer.tileId);
        return normalizeTileInteractionType(tile?.logicalProperties) === 'ladder';
    };

    const detectLadderStateForEntity = (entity: AnimatedEntity, screenMap: ScreenMap | null) => {
        if (!screenMap) return false;
        const centerX = entity.x + Math.floor(entity.sprite.size.width / 2);
        const centerY = entity.y + Math.floor(entity.sprite.size.height / 2);
        const feetY = entity.y + Math.max(0, entity.sprite.size.height - 2);
        return isLadderTileAt(centerX, centerY, screenMap) || isLadderTileAt(centerX, feetY, screenMap);
    };

    // === TILE INTERACTION (Z80 check_tile_interaction equivalent) ===
    // Dispatches per-tile interactions from the effective behavior layer.
    const checkTileInteraction = (entity: AnimatedEntity, screenMap: ScreenMap | null) => {
        if (!screenMap) return;
        const hasInput = entity.template.components?.some(c =>
            c.definitionId === 'comp_cursors' || c.definitionId === 'comp_input' || c.definitionId === 'comp_player_input'
        );
        const hasTileCollector = entity.template.components?.some(c => c.definitionId === 'comp_tile_collector');
        if (!hasInput && !hasTileCollector) return;

        const centerX = Math.floor(entity.x + 8);
        const centerY = Math.floor(entity.y + 8);
        const tileX = Math.floor(centerX / TILE_SIZE);
        const tileY = Math.floor(centerY / TILE_SIZE);
        const collisionLayer = runtimeCollisionLayerRef.current.length > 0
            ? runtimeCollisionLayerRef.current
            : getScreenBehaviorLayer(screenMap);
        const layerRows = collisionLayer.length;
        const layerCols = collisionLayer[0]?.length ?? 0;
        if (tileX < 0 || tileX >= layerCols || tileY < 0 || tileY >= layerRows) {
            entity.activeButtonInteractionKey = null;
            return;
        }

        const screenId = currentScreenMapRef.current?.id ?? screenMap.id ?? '';
        const interactionKey = `${screenId}@${tileX},${tileY}`;
        if (collectedTilesRegistry.current.has(interactionKey) || consumedInteractionRegistry.current.has(interactionKey)) {
            entity.activeButtonInteractionKey = null;
            return;
        }

        const tileOnLayer = collisionLayer[tileY]?.[tileX];
        if (!tileOnLayer || !tileOnLayer.tileId) {
            entity.activeButtonInteractionKey = null;
            return;
        }

        const tile = tileset.find(t => t.id === tileOnLayer.tileId);
        if (!tile?.logicalProperties) {
            entity.activeButtonInteractionKey = null;
            return;
        }
        const interactionType = normalizeTileInteractionType(tile.logicalProperties);
        if (interactionType === 'none' || interactionType === 'ladder') {
            entity.activeButtonInteractionKey = null;
            return;
        }
        if (interactionType !== 'button_press') {
            entity.activeButtonInteractionKey = null;
        }

        const interactionValueRaw = Number(tile.logicalProperties.interactionValue ?? 0);
        const interactionValue = Number.isFinite(interactionValueRaw) ? Math.max(0, Math.trunc(interactionValueRaw)) : 0;
        const interactionTarget = normalizeVariableName(tile.logicalProperties.interactionTarget)
            ?? (typeof tile.logicalProperties.interactionTarget === 'string' ? tile.logicalProperties.interactionTarget.trim() : '');
        const bufferCanvas = tileBufferRef.current;
        const clearTileVisually = () => {
            if (runtimeCollisionLayerRef.current[tileY]?.[tileX]) {
                runtimeCollisionLayerRef.current[tileY][tileX] = { tileId: null };
            }
            if (bufferCanvas) {
                const ctx = bufferCanvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(tileX * TILE_SIZE, tileY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
            for (const group of tileAnimGroupsRef.current) {
                const idx = group.positions.findIndex(p => p.x === tileX && p.y === tileY);
                if (idx !== -1) {
                    group.positions.splice(idx, 1);
                }
            }
        };
        const addToTargetVariable = (fallbackAmount = 1) => {
            if (!interactionTarget) return;
            const amount = interactionValue > 0 ? interactionValue : fallbackAmount;
            updateGameGlobalVariables((prev: Record<string, any>) => {
                const current = Number(prev[interactionTarget] ?? 0);
                return { ...prev, [interactionTarget]: current + amount };
            });
        };
        const toggleTargetVariable = () => {
            if (!interactionTarget) return;
            updateGameGlobalVariables((prev: Record<string, any>) => {
                const current = Number(prev[interactionTarget] ?? 0);
                return { ...prev, [interactionTarget]: current ? 0 : 1 };
            });
        };
        const increaseEntityLives = (fallbackAmount = 1) => {
            const increaseAmount = interactionValue > 0 ? interactionValue : fallbackAmount;
            const healthComp = entity.template.components.find(c => c.definitionId === 'comp_health');
            if (!healthComp) return;
            if (!entity.instance.componentOverrides) entity.instance.componentOverrides = {} as any;
            if (!entity.instance.componentOverrides['comp_health']) entity.instance.componentOverrides['comp_health'] = {};
            const overrides = entity.instance.componentOverrides['comp_health'];
            const currentLives = Number(overrides.current ?? healthComp.defaultValues?.current ?? 3);
            const maxLives = Number(overrides.max ?? healthComp.defaultValues?.max ?? 3);
            const nextLives = Math.min(maxLives, currentLives + increaseAmount);
            overrides.current = nextLives;
            updateGameGlobalVariables(prev => ({ ...prev, Lives: nextLives }));
        };

        updateGameGlobalVariables((prev: Record<string, any>) => ({
            ...prev,
            last_interaction_char: tile.id,
            last_gem_char: tile.id,
            last_interaction_type: interactionType,
            last_interaction_value: interactionValue,
            last_interaction_target: interactionTarget,
            last_interaction_x: tileX,
            last_interaction_y: tileY,
            last_interaction_entity: entity.instance.id ?? entity.instance.name ?? entity.template.id
        }));

        switch (interactionType) {
            case 'collect_gem': {
                clearTileVisually();
                collectedTilesRegistry.current.add(interactionKey);
                updateGameGlobalVariables((prev: Record<string, any>) => {
                    const current = Number(prev.gem_count ?? 0);
                    return { ...prev, gem_count: current + 1 };
                });
                if (hasTileCollector) {
                    const tileCollectorComp = entity.template.components.find(c => c.definitionId === 'comp_tile_collector');
                    const tileCollectorProps = {
                        ...(tileCollectorComp?.defaultValues || {}),
                        ...(entity.instance.componentOverrides?.['comp_tile_collector'] || {})
                    };
                    const targetVar = normalizeVariableName(tileCollectorProps.targetVariable)
                        ?? (typeof tileCollectorProps.targetVariable === 'string' ? tileCollectorProps.targetVariable.trim() : '');
                    const incrementAmount = Number(tileCollectorProps.incrementAmount ?? 0);
                    if (targetVar && incrementAmount > 0) {
                        updateGameGlobalVariables((prev: Record<string, any>) => {
                            const current = Number(prev[targetVar] ?? 0);
                            return { ...prev, [targetVar]: current + incrementAmount };
                        });
                    }
                    const rawFlagVar = tileCollectorProps.flagVariable;
                    const flagVar = normalizeVariableName(rawFlagVar) ?? (typeof rawFlagVar === 'string' ? rawFlagVar.trim() : '');
                    const rawFlagValue = tileCollectorProps.flagValue;
                    const flagValue = typeof rawFlagValue === 'boolean'
                        ? rawFlagValue
                        : (() => {
                            const parsed = Number(rawFlagValue ?? 1);
                            return Number.isNaN(parsed) ? 1 : parsed;
                        })();
                    if (flagVar) {
                        updateGameGlobalVariables((prev: Record<string, any>) => ({
                            ...prev,
                            [flagVar]: flagValue
                        }));
                    }
                }
                addToTargetVariable(1);
                break;
            }
            case 'collect_item':
                clearTileVisually();
                collectedTilesRegistry.current.add(interactionKey);
                addToTargetVariable(1);
                break;
            case 'add_energy':
                clearTileVisually();
                collectedTilesRegistry.current.add(interactionKey);
                increaseEntityLives(1);
                addToTargetVariable(1);
                break;
            case 'lever_toggle':
                consumedInteractionRegistry.current.add(interactionKey);
                toggleTargetVariable();
                break;
            case 'button_press':
                if (entity.activeButtonInteractionKey === interactionKey) {
                    break;
                }
                entity.activeButtonInteractionKey = interactionKey;
                updateGameGlobalVariables((prev: Record<string, any>) => ({
                    ...prev,
                    last_interaction_pending: true
                }));
                break;
            case 'jumper': {
                const jumpStrength = Math.max(8, interactionValue > 0 ? interactionValue : 8);
                entity.isOnGround = false;
                entity.platformUnderneath = null;
                entity.platformGraceFramesLeft = 0;
                entity.gravityVel = 0;
                entity.vy = -jumpStrength;
                break;
            }
            default:
                break;
        }
    };

    // Re-apply collected tiles after screen load (matching Z80: apply_collected_tiles)
    const applyCollectedTiles = (screenMap: ScreenMap) => {
        const screenId = screenMap.id ?? currentScreenMapRef.current?.id ?? '';
        const collisionLayer = runtimeCollisionLayerRef.current;
        const bufferCanvas = tileBufferRef.current;
        const prefix = screenId + '@';

        for (const key of collectedTilesRegistry.current) {
            if (!key.startsWith(prefix)) continue;
            const coordPart = key.substring(prefix.length); // "tileX,tileY"
            const [txStr, tyStr] = coordPart.split(',');
            const tileX = parseInt(txStr, 10);
            const tileY = parseInt(tyStr, 10);
            if (isNaN(tileX) || isNaN(tileY)) continue;

            // Clear collision layer
            if (collisionLayer[tileY]?.[tileX]) {
                collisionLayer[tileY][tileX] = { tileId: null };
            }

            // Clear visual on tile buffer
            if (bufferCanvas) {
                const ctx = bufferCanvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(tileX * TILE_SIZE, tileY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }

            // Remove from animated tile groups
            for (const group of tileAnimGroupsRef.current) {
                const idx = group.positions.findIndex(p => p.x === tileX && p.y === tileY);
                if (idx !== -1) {
                    group.positions.splice(idx, 1);
                }
            }
        }
    };

    const entityHasDeadlyTilesComponent = (entity: AnimatedEntity) =>
        entity.template.components?.some(c => c.definitionId === DEADLY_TILES_COMPONENT_ID);

    const updateDeadlyTileFlagForEntity = (entity: AnimatedEntity, screenMap: ScreenMap | null) => {
        if (!screenMap || !entityHasDeadlyTilesComponent(entity)) {
            entity.hasDangerousTileCollision = false;
            return;
        }

        const props = entityCollisionProps(entity);
        let finalHitbox: { x: number; y: number; width: number; height: number };

        if (props) {
            finalHitbox = getHitboxFor(entity, props);
        } else if (entity.sprite.hitbox) {
            finalHitbox = {
                x: entity.x + (entity.sprite.hitbox.offsetX ?? 0),
                y: entity.y + (entity.sprite.hitbox.offsetY ?? 0),
                width: entity.sprite.hitbox.width ?? entity.sprite.size.width,
                height: entity.sprite.hitbox.height ?? entity.sprite.size.height,
            };
        } else {
            finalHitbox = {
                x: entity.x,
                y: entity.y,
                width: entity.sprite.size.width,
                height: entity.sprite.size.height,
            };
        }

        const centerX = finalHitbox.x + Math.floor(finalHitbox.width / 2);
        const centerY = finalHitbox.y + Math.floor(finalHitbox.height / 2);
        entity.hasDangerousTileCollision = checkDangerousTileAt(centerX, centerY, screenMap);
    };

    const renderTileMapToBuffer = (map: ScreenMap, tset: Tile[], mode: string, runtimeLayer?: ScreenTile[][]) => {
        if (!map) return null; // No hay mapa para renderizar
        const canvas = tileBufferRef.current ?? document.createElement('canvas');
        canvas.width = PREVIEW_WIDTH;
        canvas.height = PREVIEW_HEIGHT;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.imageSmoothingEnabled = false;

        // Si hay runtime layer, crear copia temporal del screenMap con ese layer solo para collision
        // El background se mantiene original para el renderizado visual
        const mapToRender = runtimeLayer ? {
            ...map,
            layers: {
                ...map.layers,
                background: map.layers.background,  // Mantener background original para renderizado
                collision: runtimeLayer              // Solo usar runtime para deteccin de colisiones
            }
        } : map;

        renderScreenToCanvas(canvas, mapToRender, tset, mode, TILE_SIZE);
        tileBufferRef.current = canvas;
        return canvas;
    };

    // Paint HUD imported frame (tile-based graphic border) onto the tile buffer.
    // Matches Z80 imprimir_marco: draws HUD frame tiles once after screen load.
    const paintHudFrameOnBuffer = (bufferCanvas: HTMLCanvasElement | null) => {
        const frame = hudImportedFrameRef.current;
        if (!frame?.cells?.length || !bufferCanvas) return;
        const ctx = bufferCanvas.getContext('2d');
        if (!ctx) return;
        ctx.imageSmoothingEnabled = false;

        const tileById = new Map<string, Tile>();
        for (const t of tileset) if (t?.id) tileById.set(t.id, t);

        const isScreen2 = previewScreenMode.includes('SCREEN 2') || previewScreenMode.includes('Graphics I');
        const SCREEN2_PIXELS_PER_COLOR_SEGMENT = 8;

        for (const cell of frame.cells) {
            const tile = tileById.get(cell.tileId);
            if (!tile?.data) continue;

            const gridX = cell.x;
            const gridY = cell.y;
            const sX = (cell.subTileX ?? 0) * TILE_SIZE;
            const sY = (cell.subTileY ?? 0) * TILE_SIZE;

            for (let py = 0; py < TILE_SIZE; py++) {
                for (let px = 0; px < TILE_SIZE; px++) {
                    const fullDataX = sX + px;
                    const fullDataY = sY + py;
                    if (fullDataY >= tile.data.length || fullDataX >= (tile.data[0]?.length ?? 0)) continue;

                    let color = tile.data[fullDataY]?.[fullDataX];
                    if (color === undefined) continue;

                    if (isScreen2 && tile.lineAttributes && tile.lineAttributes[fullDataY]) {
                        const segIdx = Math.floor(fullDataX / SCREEN2_PIXELS_PER_COLOR_SEGMENT);
                        const attr = tile.lineAttributes[fullDataY][segIdx];
                        if (attr && color !== attr.fg && color !== attr.bg) {
                            color = attr.fg;
                        }
                    }

                    ctx.fillStyle = color;
                    ctx.fillRect(gridX * TILE_SIZE + px, gridY * TILE_SIZE + py, 1, 1);
                }
            }
        }
    };

    // === ANIMATED TILES SYSTEM (Z80-faithful) ===
    // Builds animation groups from tileset + screen map, matching ASM animatedTilesGenerator logic.
    const buildTileAnimGroups = (map: ScreenMap, tset: Tile[]): TileAnimGroupState[] => {
        const groups: TileAnimGroupState[] = [];
        const tileById = new Map<string, Tile>();
        for (const t of tset) if (t?.id) tileById.set(t.id, t);

        // Collect animated tiles grouped by groupId
        const candidatesByGroup = new Map<string, { tile: Tile; frameOrder: number; speed: number; baseTileId: string | null; mode: 'frames' | 'transform'; transformEffect?: string; transformIncludeColors?: boolean; transformCheckpoints?: number }[]>();

        for (const tile of tset) {
            if (!tile?.id) continue;
            const anim = tile.animation;
            const isEnabled = anim?.enabled ?? tile.isAnimated ?? false;
            if (!isEnabled) continue;

            const mode: 'frames' | 'transform' = (tile.animationMode ?? anim?.mode ?? 'frames') as any;
            let groupId = (tile.animationGroup ?? anim?.groupId ?? '').trim();
            // Transform tiles often have empty groupId - use tile.id as fallback
            if (!groupId) {
                if (mode === 'transform') {
                    groupId = `__transform_${tile.id}`;
                } else {
                    continue; // frames mode NEEDS a groupId to find siblings
                }
            }

            const frameOrder = tile.animationFrameIndex ?? anim?.frameIndex ?? 0;
            const speed = tile.animationSpeed ?? anim?.speed ?? 8;
            const baseTileId = tile.animationBaseTileId ?? anim?.baseTileId ?? null;
            const transformEffect = tile.animationTransformEffect ?? anim?.transform?.effect;
            const transformIncludeColors = tile.animationTransformIncludeColors ?? anim?.transform?.includeColors ?? true;
            const transformCheckpoints = tile.animationTransformCheckpoints ?? anim?.transform?.checkpoints ?? 8;

            if (!candidatesByGroup.has(groupId)) candidatesByGroup.set(groupId, []);
            candidatesByGroup.get(groupId)!.push({ tile, frameOrder, speed, baseTileId, mode, transformEffect, transformIncludeColors, transformCheckpoints });
        }

        // Process each group
        for (const [groupId, candidates] of candidatesByGroup.entries()) {
            if (candidates.length === 0) continue;

            const firstCandidate = candidates[0];
            const mode = firstCandidate.mode;

            if (mode === 'frames') {
                // Sort frames by frameOrder
                candidates.sort((a, b) => a.frameOrder - b.frameOrder);

                // Determine the base/target tile (the one placed on screen)
                const baseTileId = firstCandidate.baseTileId || candidates[0].tile.id;
                const baseTile = tileById.get(baseTileId);
                if (!baseTile) continue;

                // Build frame tile list
                const frameTiles = candidates.map(c => c.tile);
                if (frameTiles.length < 2) continue; // Need at least 2 frames

                // Find positions on screen where the base tile (or any group tile) is placed
                const groupTileIds = new Set<string>([baseTileId, ...candidates.map(c => c.tile.id)]);
                const positions: { x: number; y: number }[] = [];
                const bgLayer = map.layers.background;
                for (let y = 0; y < map.height; y++) {
                    for (let x = 0; x < map.width; x++) {
                        const cell = bgLayer[y]?.[x];
                        if (cell?.tileId && groupTileIds.has(cell.tileId)) {
                            positions.push({ x, y });
                        }
                    }
                }

                if (positions.length === 0) continue; // No instances on screen

                groups.push({
                    groupId,
                    baseTileId,
                    frameTiles,
                    speed: Math.max(1, firstCandidate.speed),
                    currentFrame: 0,
                    tickCounter: 0,
                    positions,
                    mode: 'frames'
                });
            } else if (mode === 'transform') {
                // Transform mode: single tile with runtime pixel operations
                const baseTileId = firstCandidate.baseTileId || firstCandidate.tile.id;
                const baseTile = tileById.get(baseTileId);
                if (!baseTile) continue;

                const positions: { x: number; y: number }[] = [];
                const bgLayer = map.layers.background;
                for (let y = 0; y < map.height; y++) {
                    for (let x = 0; x < map.width; x++) {
                        const cell = bgLayer[y]?.[x];
                        if (cell?.tileId === baseTileId) {
                            positions.push({ x, y });
                        }
                    }
                }
                if (positions.length === 0) continue;

                const checkpoints = Math.max(2, firstCandidate.transformCheckpoints ?? 8);
                // Pre-generate all transform frames as Tile-like objects with modified pixel data
                const frameTiles: Tile[] = [];
                for (let step = 0; step < checkpoints; step++) {
                    const transformedTile = applyTransformToTile(baseTile, firstCandidate.transformEffect || 'rotate_left', step, firstCandidate.transformIncludeColors ?? true);
                    frameTiles.push(transformedTile);
                }

                groups.push({
                    groupId,
                    baseTileId,
                    frameTiles,
                    speed: Math.max(1, firstCandidate.speed),
                    currentFrame: 0,
                    tickCounter: 0,
                    positions,
                    mode: 'transform',
                    transformEffect: firstCandidate.transformEffect,
                    transformIncludeColors: firstCandidate.transformIncludeColors,
                    transformCheckpoints: checkpoints
                });
            }
        }

        console.log(`[AnimTiles] Built ${groups.length} anim groups:`, groups.map(g => `${g.groupId}(${g.mode}, ${g.frameTiles.length}fr, ${g.positions.length}pos)`));
        return groups;
    };

    // Apply a pixel transform to a tile (matching Z80 transform operations)
    const applyTransformToTile = (baseTile: Tile, effect: string, steps: number, includeColors: boolean): Tile => {
        const data = baseTile.data.map(row => [...row]); // Deep copy pixel data
        const lineAttrs = baseTile.lineAttributes ? baseTile.lineAttributes.map(row => row ? [...row] : row) : undefined;

        switch (effect) {
            case 'rotate_left':
            case 'shift_left':
                // Shift/rotate pixels left by `steps` positions
                for (let y = 0; y < data.length; y++) {
                    const row = data[y];
                    const s = steps % row.length;
                    if (s === 0) continue;
                    if (effect === 'rotate_left') {
                        data[y] = [...row.slice(s), ...row.slice(0, s)];
                    } else {
                        data[y] = [...row.slice(s), ...new Array(s).fill(row[row.length - 1] || '#000000')];
                    }
                }
                break;
            case 'rotate_right':
            case 'shift_right':
                for (let y = 0; y < data.length; y++) {
                    const row = data[y];
                    const s = steps % row.length;
                    if (s === 0) continue;
                    if (effect === 'rotate_right') {
                        data[y] = [...row.slice(row.length - s), ...row.slice(0, row.length - s)];
                    } else {
                        data[y] = [...new Array(s).fill(row[0] || '#000000'), ...row.slice(0, row.length - s)];
                    }
                }
                break;
            case 'shift_up': {
                const h = data.length;
                const s = steps % h;
                if (s > 0) {
                    const shifted = [...data.slice(s), ...data.slice(0, s)];
                    for (let y = 0; y < h; y++) data[y] = shifted[y];
                    if (includeColors && lineAttrs) {
                        const shiftedAttrs = [...lineAttrs.slice(s), ...lineAttrs.slice(0, s)];
                        for (let y = 0; y < h; y++) lineAttrs[y] = shiftedAttrs[y];
                    }
                }
                break;
            }
            case 'shift_down': {
                const h = data.length;
                const s = steps % h;
                if (s > 0) {
                    const shifted = [...data.slice(h - s), ...data.slice(0, h - s)];
                    for (let y = 0; y < h; y++) data[y] = shifted[y];
                    if (includeColors && lineAttrs) {
                        const shiftedAttrs = [...lineAttrs.slice(h - s), ...lineAttrs.slice(0, h - s)];
                        for (let y = 0; y < h; y++) lineAttrs[y] = shiftedAttrs[y];
                    }
                }
                break;
            }
            case 'swap_top_bottom': {
                if ((steps & 1) !== 0 && data.length >= 2) {
                    const temp = data[0];
                    data[0] = data[data.length - 1];
                    data[data.length - 1] = temp;
                    if (includeColors && lineAttrs && lineAttrs.length >= 2) {
                        const tempA = lineAttrs[0];
                        lineAttrs[0] = lineAttrs[lineAttrs.length - 1];
                        lineAttrs[lineAttrs.length - 1] = tempA;
                    }
                }
                break;
            }
        }

        return { ...baseTile, data, lineAttributes: lineAttrs as any };
    };

    // Render a single tile onto the tile buffer canvas at a given grid position
    const renderSingleTileToBuffer = (
        bufferCanvas: HTMLCanvasElement,
        tile: Tile,
        gridX: number,
        gridY: number,
        screenTile: ScreenTile | undefined,
        mode: string
    ) => {
        const ctx = bufferCanvas.getContext('2d');
        if (!ctx) return;
        ctx.imageSmoothingEnabled = false;
        const isScreen2 = mode.includes('SCREEN 2') || mode.includes('Graphics I');
        const SCREEN2_PIXELS_PER_COLOR_SEGMENT = 8;

        const { data: fullPixelData, width: fullAssetWidth, height: fullAssetHeight, lineAttributes } = tile;
        if (!fullPixelData) return;

        const subTileXCoord = screenTile?.subTileX ?? 0;
        const subTileYCoord = screenTile?.subTileY ?? 0;
        const sX = subTileXCoord * TILE_SIZE;
        const sY = subTileYCoord * TILE_SIZE;

        for (let py = 0; py < TILE_SIZE; py++) {
            for (let px = 0; px < TILE_SIZE; px++) {
                const fullDataX = sX + px;
                const fullDataY = sY + py;

                if (fullDataY < fullAssetHeight && fullDataX < fullAssetWidth) {
                    let color = fullPixelData[fullDataY]?.[fullDataX];
                    if (color === undefined) continue;

                    if (isScreen2 && lineAttributes && lineAttributes[fullDataY]) {
                        const segmentIndex = Math.floor(fullDataX / SCREEN2_PIXELS_PER_COLOR_SEGMENT);
                        const attr = lineAttributes[fullDataY][segmentIndex];
                        if (attr && color !== attr.fg && color !== attr.bg) {
                            color = attr.fg;
                        }
                    }

                    ctx.fillStyle = color;
                    ctx.fillRect(gridX * TILE_SIZE + px, gridY * TILE_SIZE + py, 1, 1);
                }
            }
        }
    };

    // Update animated tiles: advance tick counters, redraw changed tiles on buffer
    const updateAnimatedTilesBuffer = () => {
        const groups = tileAnimGroupsRef.current;
        if (groups.length === 0) return;
        const bufferCanvas = tileBufferRef.current;
        if (!bufferCanvas) return;
        const map = currentScreenMapRef.current;
        if (!map) return;

        for (const group of groups) {
            group.tickCounter++;
            if (group.tickCounter < group.speed) continue;

            // Advance frame
            group.tickCounter = 0;
            group.currentFrame = (group.currentFrame + 1) % group.frameTiles.length;
            const frameTile = group.frameTiles[group.currentFrame];

            // Repaint all positions where this animated tile appears
            for (const pos of group.positions) {
                const screenTile = map.layers.background[pos.y]?.[pos.x];
                renderSingleTileToBuffer(bufferCanvas, frameTile, pos.x, pos.y, screenTile, previewScreenMode);
            }
        }
    };

    // Debug helper: draw outlines for solid tiles from the Collision layer
    const drawCollisionTileOutlines = (ctx: CanvasRenderingContext2D) => {
        if (!showTileHitboxes) return;
        const map = currentScreenMapRef.current;
        if (!map) return;

        // Prefer runtime collision layer when available (reflects tile changes during play)
        const collisionLayer: ScreenTile[][] = (runtimeCollisionLayerRef.current && runtimeCollisionLayerRef.current.length > 0)
            ? runtimeCollisionLayerRef.current
            : getScreenBehaviorLayer(map);

        if (!collisionLayer) return;

        // Precompute solid tile ids
        const solidIds = new Set<string>();
        for (const t of tileset) {
            if (t?.logicalProperties?.isSolid) solidIds.add(t.id);
        }

        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#00FFFF';
        ctx.setLineDash([3, 2]);
        for (let ty = 0; ty < map.height; ty++) {
            const row = collisionLayer[ty];
            if (!row) continue;
            for (let tx = 0; tx < map.width; tx++) {
                const cell = row[tx];
                const id = cell?.tileId || null;
                if (!id || !solidIds.has(id)) continue;
                ctx.strokeRect(tx * TILE_SIZE + 0.5, ty * TILE_SIZE + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
            }
        }
        ctx.setLineDash([]);
        ctx.restore();
    };

    // Pre-renderizar el mapa actual si existe, usando runtimeCollisionLayer si estA disponible
    if (screenMapToRender) {
        const layerToUse = runtimeCollisionLayerRef.current.length > 0 ? runtimeCollisionLayerRef.current : undefined;
        tileBufferRef.current = renderTileMapToBuffer(screenMapToRender, tileset, previewScreenMode, layerToUse);
        // Paint HUD frame on top of tile buffer (matching Z80: imprimir_marco after screen load)
        paintHudFrameOnBuffer(tileBufferRef.current);
        tileBufferNeedsUpdate.current = false; // Reset flag
        // Initialize animated tile groups for this screen
        tileAnimGroupsRef.current = buildTileAnimGroups(screenMapToRender, tileset);
        // Re-apply collected tiles from persistence (matching Z80: call apply_collected_tiles)
        applyCollectedTiles(screenMapToRender);
    }
    // --- Fin Nuevo ---

    // --- Shooting helpers ---
    const getMergedComponentValues = (entity: AnimatedEntity, compId: string): Record<string, any> | null => {
        const templateComp = entity.template.components.find(c => c.definitionId === compId);
        if (!templateComp) return null;
        return {
            ...(templateComp.defaultValues || {}),
            ...(entity.instance.componentOverrides?.[compId] || {})
        } as Record<string, any>;
    };

    const spawnProjectile = (shooter: AnimatedEntity) => {
        const shootProps = getMergedComponentValues(shooter, 'comp_shoot');
        if (!shootProps) return;

        const spriteAssetId = shootProps.spriteAssetId || shootProps.renderSpriteAssetId || shootProps.render;
        // Allow lookup by asset id or asset name (or inner data name/id)
        const projectileSpriteAsset = allAssets.find(a => (
            a.type === 'sprite' && (
                a.id === spriteAssetId ||
                a.name === spriteAssetId ||
                (a.data && (a.data as any).id === spriteAssetId) ||
                (a.data && (a.data as any).name === spriteAssetId)
            )
        ));
        const projectileSprite = projectileSpriteAsset?.data as Sprite | undefined;
        if (!projectileSprite || !projectileSprite.frames?.length) return;

        // --- Determine aim and velocity (supports 4-direction shooting) ---
        const aimMode = String(shootProps.aimMode || 'facing').toLowerCase();
        const allowDiagonals = (shootProps.allowDiagonals === true) || (shootProps.allowDiagonals === 'true');
        const speedProp = Number(shootProps.speed);
        const vxProp = Number(shootProps.velocityX);
        const vyProp = Number(shootProps.velocityY);

        // Determine facing sign for horizontal
        let dirX = 1;
        if (shooter.sprite.facingDirection === 'right') {
            dirX = shooter.isFacingMirrored ? -1 : 1;
        } else if (shooter.sprite.facingDirection === 'left') {
            dirX = shooter.isFacingMirrored ? 1 : -1;
        }

        // Read input for aiming
        const upPressed = pressedKeys.current.has('ArrowUp') || pressedKeys.current.has('w') || pressedKeys.current.has('W');
        const downPressed = pressedKeys.current.has('ArrowDown') || pressedKeys.current.has('s') || pressedKeys.current.has('S');
        const leftPressed = pressedKeys.current.has('ArrowLeft') || pressedKeys.current.has('a') || pressedKeys.current.has('A');
        const rightPressed = pressedKeys.current.has('ArrowRight') || pressedKeys.current.has('d') || pressedKeys.current.has('D');

        let dx = 0, dy = 0;
        if (aimMode === '4dir' || aimMode === 'four' || aimMode === 'fourdir' || aimMode === '4-dir') {
            const anyVertical = (upPressed && !downPressed) || (downPressed && !upPressed);
            const anyHorizontal = (leftPressed && !rightPressed) || (rightPressed && !leftPressed);
            if (allowDiagonals && anyVertical && anyHorizontal) {
                dx = leftPressed ? -1 : (rightPressed ? 1 : 0);
                dy = upPressed ? -1 : (downPressed ? 1 : 0);
            } else {
                if (upPressed && !downPressed) { dy = -1; }
                else if (downPressed && !upPressed) { dy = 1; }
                else if (leftPressed && !rightPressed) { dx = -1; }
                else if (rightPressed && !leftPressed) { dx = 1; }
                else { dx = dirX; dy = 0; }
            }
        } else {
            // Default: facing-based horizontal
            dx = dirX; dy = 0;
        }

        // Determine speed magnitude
        let speed = (!isNaN(speedProp) && speedProp > 0) ? speedProp : NaN;
        let vx = 0, vy = 0;
        if (aimMode === '4dir' || aimMode === 'four' || aimMode === 'fourdir' || aimMode === '4-dir') {
            if (isNaN(speed)) {
                const candX = isNaN(vxProp) ? 0 : Math.abs(vxProp);
                const candY = isNaN(vyProp) ? 0 : Math.abs(vyProp);
                speed = Math.max(candX, candY, 0);
                if (!speed || speed <= 0) speed = 3;
            }
            vx = dx * speed;
            vy = dy * speed;
        } else {
            // Facing-based: keep semantics where positive vx means magnitude auto-flipped; negative is explicit
            if (!isNaN(vxProp)) {
                vx = (vxProp >= 0) ? (Math.abs(vxProp) * dirX) : vxProp;
            } else {
                vx = (isNaN(speed) ? 3 : speed) * dirX;
            }
            vy = isNaN(vyProp) ? 0 : vyProp;
        }

        // Compute offsets, flipping horizontally only if actually shooting horizontally
        let offsetX = Number(shootProps.offsetX || 0);
        let offsetY = Number(shootProps.offsetY || 0);
        const isHorizontalShot = Math.abs(dx) > 0 && Math.abs(dy) === 0;
        if (isHorizontalShot && shooter.isFacingMirrored && (shooter.sprite.facingDirection === 'right' || shooter.sprite.facingDirection === 'left')) {
            offsetX = -offsetX;
        }

        const spawnX = Math.round(shooter.x + (shooter.sprite.size.width / 2) - (projectileSprite.size.width / 2) + offsetX);
        const spawnY = Math.round(shooter.y + (shooter.sprite.size.height / 2) - (projectileSprite.size.height / 2) + offsetY);

        const maxRange = Number(shootProps.range || shootProps.maxRange || 128);
        const damage = Number(shootProps.damage || 1);
        const expireOnHit = (shootProps.expireOnHit === undefined) ? true : (shootProps.expireOnHit === true || shootProps.expireOnHit === 'true');
        // Optional: allow comp_shoot to control if projectile animates
        const playAnimation = (shootProps.playAnimation === undefined)
            ? true
            : (shootProps.playAnimation === true || shootProps.playAnimation === 'true');

        // Build projectile frame images (and optional mirrored set)
        const buildFrames = (spr: Sprite) => {
            const frames = spr.frames.map(frame => {
                const img = new Image();
                img.src = createSpriteDataURL(frame.data, spr.size.width, spr.size.height);
                return img;
            });
            const mirrored = spr.frames.map(frame => {
                const img = new Image();
                img.src = createSpriteDataURL(
                    mirrorPixelDataHorizontally(frame.data),
                    spr.size.width,
                    spr.size.height
                );
                return img;
            });
            return { frames, mirrored };
        };

        const projFrames = buildFrames(projectileSprite);

        // Optional: explosion sprite (Render2)
        const explosionSpriteId = shootProps.spriteAssetId2 || shootProps.renderSpriteAssetId2 || shootProps.render2;
        const explosionSprite = explosionSpriteId
            ? (allAssets.find(a => a.id === explosionSpriteId && a.type === 'sprite')?.data as Sprite | undefined)
            : undefined;
        const explosionFrames = explosionSprite ? buildFrames(explosionSprite) : null;

        // Determine desired facing (world) based on shot direction or shooter mirroring
        const isHoriz = Math.abs(vx) > Math.abs(vy);
        const desiredFacing: FacingDirection = isHoriz
            ? (vx < 0 ? 'left' : 'right')
            : (shooter.isFacingMirrored ? 'left' : 'right');
        // Decide if projectile needs mirroring comparing its sprite facing with desired world facing
        const projMirrored = computeMirrorForSprite(projectileSprite, desiredFacing);

        const proj: AnimatedEntity = {
            instance: {
                id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                entityTemplateId: 'tpl_projectile_runtime',
                name: 'Projectile',
                position: { x: Math.floor(spawnX / TILE_SIZE), y: Math.floor(spawnY / TILE_SIZE) },
                componentOverrides: {}
            },
            template: { id: 'tpl_projectile_runtime', name: 'Projectile', components: [], description: 'Runtime projectile' },
            sprite: projectileSprite,
            x: spawnX,
            y: spawnY,
            vx,
            vy,
            gravityVel: 0,
            frameImages: projFrames.frames,
            mirroredFrameImages: projFrames.mirrored,
            currentFrame: 0,
            lastFrameUpdateTime: performance.now(),
            isOnGround: false,
            isOnLadder: false,
            spawnTime: performance.now(),
            parentEntityId: shooter.instance.id,
            platformGraceFramesLeft: 0,
            isFacingMirrored: projMirrored,
            isProjectile: true,
            projectileOwnerId: shooter.instance.id,
            projectileStartX: spawnX,
            projectileStartY: spawnY,
            projectileMaxRange: maxRange,
            projectileDamage: damage,
            projectileExpireOnHit: expireOnHit,
            animateProjectile: playAnimation,
            // Explosion (Render2)
            isExploding: false,
            explosionSprite: explosionSprite,
            explosionFrameImages: explosionFrames?.frames,
            explosionMirroredFrameImages: explosionFrames?.mirrored,
            desiredFacingDirection: desiredFacing,
        };

        entitiesRef.current.push(proj);
        shooter.lastShotTime = performance.now();
    };

    const drawTextAsync = (text: string, x: number, y: number, colorAttrs: MSXFontColorAttributes, customFont?: MSXFont, customColorAttrs?: MSXFontColorAttributes) => {
        return new Promise<void>((resolve) => {
            const textImg = new Image();
            textImg.onload = () => { ctx.drawImage(textImg, x, y); resolve(); };
            const fontToUse = customFont || msxFont;
            const colorAttrsToUse = customColorAttrs || colorAttrs;
            textImg.src = renderMSX1TextToDataURL(text, fontToUse, colorAttrsToUse, 1, 1);
        });
    };

    // Given a sprite's default facing and a desired world facing, decide if we must mirror horizontally
    const computeMirrorForSprite = (sprite: Sprite, desired: FacingDirection | undefined): boolean => {
        if (!sprite) return false;
        const desiredDir = desired === 'left' || desired === 'right' ? desired : 'right';
        const baseDir = sprite.facingDirection === 'left' || sprite.facingDirection === 'right' ? sprite.facingDirection : 'right';
        if (sprite.facingDirection === 'neutral' || sprite.facingDirection === 'up' || sprite.facingDirection === 'down') {
            return false; // Neutral or vertical-facing sprites don't need mirroring decisions
        }
        // Mirror when desired world direction differs from sprite's default facing
        return (baseDir === 'right' && desiredDir === 'left') || (baseDir === 'left' && desiredDir === 'right');
    };

    // Trigger projectile explosion (Render2). If no Render2 defined, destroy immediately.
    const startProjectileExplosion = (proj: AnimatedEntity) => {
        if (!proj.isProjectile) return;
        if (proj.isExploding) return;

        // If we have explosion frames, switch to them and stop movement
        if (proj.explosionSprite && proj.explosionFrameImages && proj.explosionFrameImages.length > 0) {
            proj.isExploding = true;
            proj.vx = 0; proj.vy = 0;
            // Swap sprite and frames to Render2
            proj.sprite = proj.explosionSprite;
            proj.frameImages = proj.explosionFrameImages;
            // Keep mirrored frames if available so direction can be respected
            proj.mirroredFrameImages = proj.explosionMirroredFrameImages;
            // Re-evaluate mirroring using the explosion sprite facing parameter and desired world direction
            const desired = proj.desiredFacingDirection;
            proj.isFacingMirrored = computeMirrorForSprite(proj.sprite, desired);
            proj.currentFrame = 0;
            proj.lastFrameUpdateTime = performance.now();
        } else {
            // Fallback: no explosion configured
            (proj as any).markedForDestruction = true;
        }
    };

    const applyTransitionEffect = async (effect: string, duration: number) => {
        const steps = Math.max(10, Math.floor(duration / 50));
        switch (effect) {
            case 'cls':
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
                await new Promise(resolve => setTimeout(resolve, 100));
                break;
            case 'dissolve_pixels':
                for (let i = 0; i < steps; i++) {
                    const pixelsPerStep = Math.floor((PREVIEW_WIDTH * PREVIEW_HEIGHT) / steps);
                    for (let j = 0; j < pixelsPerStep; j++) {
                        const x = Math.floor(Math.random() * PREVIEW_WIDTH);
                        const y = Math.floor(Math.random() * PREVIEW_HEIGHT);
                        ctx.fillStyle = '#000000';
                        ctx.fillRect(x, y, 1, 1);
                    }
                    await new Promise(resolve => setTimeout(resolve, duration / steps));
                }
                break;
            case 'dissolve_chars':
                const charWidth = 8;
                const charHeight = 8;
                const charsX = Math.floor(PREVIEW_WIDTH / charWidth);
                const charsY = Math.floor(PREVIEW_HEIGHT / charHeight);
                const totalChars = charsX * charsY;
                const charsPerStep = Math.max(1, Math.floor(totalChars / steps));
                const positions = Array.from({ length: totalChars }, (_, i) => i);
                for (let i = positions.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [positions[i], positions[j]] = [positions[j], positions[i]];
                }
                for (let i = 0; i < steps && positions.length > 0; i++) {
                    for (let j = 0; j < charsPerStep && positions.length > 0; j++) {
                        const pos = positions.pop()!;
                        const cx = (pos % charsX) * charWidth;
                        const cy = Math.floor(pos / charsX) * charHeight;
                        ctx.fillStyle = '#000000';
                        ctx.fillRect(cx, cy, charWidth, charHeight);
                    }
                    await new Promise(resolve => setTimeout(resolve, duration / steps));
                }
                break;
            case 'vertical_lines':
                for (let x = 0; x < PREVIEW_WIDTH; x += Math.max(1, Math.floor(PREVIEW_WIDTH / steps))) {
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(x, 0, Math.max(1, Math.floor(PREVIEW_WIDTH / steps)), PREVIEW_HEIGHT);
                    await new Promise(resolve => setTimeout(resolve, duration / steps));
                }
                break;
            case 'horizontal_lines':
                for (let y = 0; y < PREVIEW_HEIGHT; y += Math.max(1, Math.floor(PREVIEW_HEIGHT / steps))) {
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(0, y, PREVIEW_WIDTH, Math.max(1, Math.floor(PREVIEW_HEIGHT / steps)));
                    await new Promise(resolve => setTimeout(resolve, duration / steps));
                }
                break;
            case 'spiral':
                let left = 0, right = PREVIEW_WIDTH - 1, top = 0, bottom = PREVIEW_HEIGHT - 1;
                const spiralStep = Math.max(1, Math.floor(Math.min(PREVIEW_WIDTH, PREVIEW_HEIGHT) / (steps * 2)));
                while (left <= right && top <= bottom) {
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(left, top, right - left + 1, spiralStep);
                    top += spiralStep;
                    if (left <= right && top <= bottom) {
                        ctx.fillRect(right - spiralStep + 1, top, spiralStep, bottom - top + 1);
                        right -= spiralStep;
                    }
                    if (left <= right && top <= bottom) {
                        ctx.fillRect(left, bottom - spiralStep + 1, right - left + 1, spiralStep);
                        bottom -= spiralStep;
                    }
                    if (left <= right && top <= bottom) {
                        ctx.fillRect(left, top, spiralStep, bottom - top + 1);
                        left += spiralStep;
                    }
                    await new Promise(resolve => setTimeout(resolve, duration / Math.ceil(steps / 4)));
                }
                break;
            case 'fill_white_squares':
                const squareSize = 16;
                const squaresX = Math.ceil(PREVIEW_WIDTH / squareSize);
                const squaresY = Math.ceil(PREVIEW_HEIGHT / squareSize);
                const totalSquares = squaresX * squaresY;
                const squarePositions = Array.from({ length: totalSquares }, (_, i) => i);
                for (let i = squarePositions.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [squarePositions[i], squarePositions[j]] = [squarePositions[j], squarePositions[i]];
                }
                const squaresPerStep = Math.max(1, Math.floor(totalSquares / steps));
                for (let i = 0; i < steps && squarePositions.length > 0; i++) {
                    for (let j = 0; j < squaresPerStep && squarePositions.length > 0; j++) {
                        const pos = squarePositions.pop()!;
                        const sx = (pos % squaresX) * squareSize;
                        const sy = Math.floor(pos / squaresX) * squareSize;
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(sx, sy, squareSize, squareSize);
                    }
                    await new Promise(resolve => setTimeout(resolve, duration / steps));
                }
                await new Promise(resolve => setTimeout(resolve, 200));
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
                break;
        }
    };

    const renderTextNodes = async () => {
        if (currentNode.type !== 'Transition') {
            let bgColor = '#000000';
            if (currentNode.type === 'SubMenu') {
                bgColor = (currentNode as GameFlowSubMenuNode).appearance?.colors?.background || '#000000';
            } else if (currentNode.type === 'Text') {
                bgColor = (currentNode as GameFlowTextNode).appearance?.colors?.background || '#000000';
            }
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
            if (tileBufferRef.current) {
                ctx.drawImage(tileBufferRef.current, 0, 0); // Dibujar buffer pre-renderizado

                // Hide revealed secret tiles
                if (currentScreenMapRef.current) {
                    ctx.fillStyle = '#000000';
                    revealedSecretTiles.current.forEach((key) => {
                        const parts = key.split('_');
                        const screenId = parts.slice(0, -2).join('_');
                        const tx = parseInt(parts[parts.length - 2], 10);
                        const ty = parseInt(parts[parts.length - 1], 10);

                        if (screenId === currentScreenMapRef.current?.id) {
                            ctx.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                        }
                    });
                }
            }
        }
        switch (currentNode.type) {
            case 'Start':
                if (currentExecutingGameFlowName === 'Main') {
                    const startText = 'Build with Mideas';
                    const startDims = getTextDimensionsMSX1(startText, 1);
                    await drawTextAsync(startText, (PREVIEW_WIDTH - startDims.width) / 2, (PREVIEW_HEIGHT - startDims.height) / 2, msxFontColorAttributes);
                }
                setTimeout(() => {
                    const conn = connections.find(c => c.from.nodeId === currentNode.id);
                    if (conn) setCurrentNodeId(conn.to.nodeId);
                }, 1000);
                break;
            case 'SubMenu':
                const subMenu = currentNode as GameFlowSubMenuNode;
                const subMenuFontAsset = (subMenu.appearance as any)?.fontAssetId
                    ? allAssets.find(a => a.id === (subMenu.appearance as any).fontAssetId)
                    : null;
                const subMenuFont = subMenuFontAsset ? (subMenuFontAsset.data as any)?.fontData as MSXFont | undefined : undefined;
                const subMenuFontColorAttrs = subMenuFontAsset ? (subMenuFontAsset.data as any)?.fontColorAttributes as MSXFontColorAttributes | undefined : undefined;
                const titleDims = getTextDimensionsMSX1(subMenu.title, 1);
                await drawTextAsync(subMenu.title, (PREVIEW_WIDTH - titleDims.width) / 2, 40, msxFontColorAttributes, subMenuFont, subMenuFontColorAttrs);
                const expandedOptions: Array<{ text: string, originalIndex: number, isControlOption?: boolean }> = [];
                subMenu.options.forEach((option, idx) => {
                    if (option.type === 'controls' && option.controlOptions && option.controlOptions.length > 0) {
                        option.controlOptions.forEach(ctrl => {
                            expandedOptions.push({ text: ctrl, originalIndex: idx, isControlOption: true });
                        });
                    } else {
                        expandedOptions.push({ text: option.text, originalIndex: idx });
                    }
                });
                for (const [displayIndex, expandedOption] of expandedOptions.entries()) {
                    const optionText = expandedOption.text;
                    const optionDims = getTextDimensionsMSX1(optionText, 1);
                    const isSelected = displayIndex === selectedOptionIndex;
                    let colorAttrs = subMenuFontColorAttrs || msxFontColorAttributes;
                    if (isSelected) {
                        const highlightedColorAttrs = JSON.parse(JSON.stringify(colorAttrs));
                        for (let i = 0; i < optionText.length; i++) {
                            highlightedColorAttrs[optionText.charCodeAt(i)] = Array(8).fill({ fg: '#FFFF00', bg: '#000000' });
                        }
                        colorAttrs = highlightedColorAttrs;
                    }
                    await drawTextAsync(optionText, (PREVIEW_WIDTH - optionDims.width) / 2, 80 + displayIndex * 12, colorAttrs, subMenuFont, colorAttrs);
                }
                break;
            case 'Text':
                const textNode = currentNode as GameFlowTextNode;
                const textNodeFontAsset = textNode.appearance?.fontAssetId
                    ? allAssets.find(a => a.id === textNode.appearance.fontAssetId)
                    : null;
                const textNodeFont = textNodeFontAsset ? (textNodeFontAsset.data as any)?.fontData as MSXFont | undefined : undefined;
                const textNodeFontColorAttrs = textNodeFontAsset ? (textNodeFontAsset.data as any)?.fontColorAttributes as MSXFontColorAttributes | undefined : undefined;
                const textNodeTitle = textNode.title;
                const textNodeMessage = textNode.message || '';
                const textNodeTitleDims = getTextDimensionsMSX1(textNodeTitle, 1);
                await drawTextAsync(textNodeTitle, (PREVIEW_WIDTH - textNodeTitleDims.width) / 2, 30, msxFontColorAttributes, textNodeFont, textNodeFontColorAttrs);
                const words = textNodeMessage.split(' ');
                let lines: string[] = [];
                let currentLine = '';
                const maxLineWidth = PREVIEW_WIDTH - 20;
                for (const word of words) {
                    const testLine = currentLine ? currentLine + ' ' + word : word;
                    const testDims = getTextDimensionsMSX1(testLine, 1);
                    if (testDims.width > maxLineWidth && currentLine) {
                        lines.push(currentLine);
                        currentLine = word;
                    } else {
                        currentLine = testLine;
                    }
                }
                if (currentLine) lines.push(currentLine);
                const lineHeight = 10;
                const startY = 60;
                for (let i = 0; i < lines.length; i++) {
                    const lineDims = getTextDimensionsMSX1(lines[i], 1);
                    await drawTextAsync(lines[i], (PREVIEW_WIDTH - lineDims.width) / 2, startY + i * lineHeight, msxFontColorAttributes, textNodeFont, textNodeFontColorAttrs);
                }
                const promptText = 'PRESS FIRE TO CONTINUE';
                const promptDims = getTextDimensionsMSX1(promptText, 1);
                await drawTextAsync(promptText, (PREVIEW_WIDTH - promptDims.width) / 2, PREVIEW_HEIGHT - 30, msxFontColorAttributes, textNodeFont, textNodeFontColorAttrs);
                break;
            case 'Globals':
                try {
                    const globalsNode: any = currentNode;
                    const vars: Array<{ name: string; value: string }> = globalsNode?.variables || [];
                    updateGameGlobalVariables(prev => {
                        const next: Record<string, any> = { ...prev };
                        for (const entry of vars) {
                            const baseName = (entry?.name || '').trim();
                            const key = normalizeVariableName(entry?.name) ?? baseName;
                            if (!key) continue;
                            const raw = String(entry?.value ?? '');
                            const lower = raw.trim().toLowerCase();
                            let parsed: any = raw;
                            if (lower === 'true' || lower === 'false') parsed = (lower === 'true');
                            else if (!Number.isNaN(Number(raw)) && raw !== '') parsed = Number(raw);
                            next[key] = parsed;
                        }
                        return next;
                    });
                } catch { }
                // Auto-navigate to next node
                {
                    const conn = connections.find(c => c.from.nodeId === currentNode.id);
                    if (conn) setCurrentNodeId(conn.to.nodeId);
                }
                break;
            case 'Music':
                const musicNode = currentNode as any;
                // If node is configured to stop music, stop any current playback and move on
                if (musicNode.stop === true) {
                    if (musicSynthesizerRef.current) {
                        musicSynthesizerRef.current.stopAllNotes();
                    }
                    if (musicPlaybackIntervalRef.current) {
                        clearInterval(musicPlaybackIntervalRef.current);
                        musicPlaybackIntervalRef.current = null;
                    }
                    musicSynthesizerRef.current = null;
                    currentMusicTrackIdRef.current = null;
                    musicIsMutedRef.current = false;
                    // Auto-navigate to next node quickly
                    setTimeout(() => {
                        const conn = connections.find(c => c.from.nodeId === currentNode.id);
                        if (conn) setCurrentNodeId(conn.to.nodeId);
                    }, 100);
                    break;
                }
                if (musicNode.trackAssetId && musicNode.autoPlay !== false) {
                    // Find track asset
                    const trackAsset = allAssets.find(a =>
                        a.type === 'track' && a.id === musicNode.trackAssetId
                    );

                    if (trackAsset) {
                        const trackData = trackAsset.data as any; // TrackerSongData

                        // Stop current music if playing
                        if (musicSynthesizerRef.current) {
                            musicSynthesizerRef.current.stopAllNotes();
                            if (musicPlaybackIntervalRef.current) {
                                clearInterval(musicPlaybackIntervalRef.current);
                                musicPlaybackIntervalRef.current = null;
                            }
                        }

                        // Create new synthesizer
                        const synth = new AYSynthesizer(trackData.globalVolume / 15);
                        synth.setSongData(trackData);
                        musicSynthesizerRef.current = synth;
                        currentMusicTrackIdRef.current = musicNode.trackAssetId;
                        musicIsMutedRef.current = false;

                        // Start playback
                        synth.ensureAudioContext().then(() => {
                            let currentPatternIndexInOrder = 0;
                            let currentRow = 0;

                            const playNextRow = () => {
                                if (musicIsMutedRef.current || !musicSynthesizerRef.current) return;

                                const orderIndex = currentPatternIndexInOrder;
                                if (orderIndex >= trackData.order.length) {
                                    if (musicNode.loop !== false) {
                                        currentPatternIndexInOrder = trackData.restartPosition || 0;
                                        currentRow = 0;
                                        return;
                                    } else {
                                        // Stop playback
                                        if (musicPlaybackIntervalRef.current) {
                                            clearInterval(musicPlaybackIntervalRef.current);
                                            musicPlaybackIntervalRef.current = null;
                                        }
                                        return;
                                    }
                                }

                                const patternIndex = trackData.order[orderIndex];
                                const pattern = trackData.patterns[patternIndex];
                                if (!pattern) return;

                                const rowData = pattern.rows[currentRow];
                                if (rowData) {
                                    // Play notes for each channel
                                    ['A', 'B', 'C'].forEach((chId, chIndex) => {
                                        const cell = rowData[chId as 'A' | 'B' | 'C'];
                                        synth.playNote(
                                            chIndex as 0 | 1 | 2,
                                            cell.note,
                                            cell.instrument,
                                            cell.ornament,
                                            cell.volume
                                        );
                                    });
                                }

                                currentRow++;
                                if (currentRow >= pattern.numRows) {
                                    currentRow = 0;
                                    currentPatternIndexInOrder++;
                                }
                            };

                            // Calculate row duration
                            const rowDurationMs = (2500 * trackData.speed) / trackData.bpm;

                            musicPlaybackIntervalRef.current = window.setInterval(playNextRow, Math.max(20, rowDurationMs));
                            playNextRow(); // Play first row immediately
                        });

                        console.log(`[Music Node] Playing track: ${trackAsset.name}`);
                    }
                }
                // Auto-navigate to next node after music starts
                setTimeout(() => {
                    const conn = connections.find(c => c.from.nodeId === currentNode.id);
                    if (conn) setCurrentNodeId(conn.to.nodeId);
                }, 500);
                break;
            case 'PresentationScreen': {
                const psNode = currentNode as any;
                const psAsset = psNode.presentationScreenAssetId
                    ? allAssets.find(a => a.id === psNode.presentationScreenAssetId && a.type === 'presentationscreen')
                    : null;
                const psConfig = psAsset
                    ? (psAsset.data as PresentationScreenConfig)
                    : null;
                const canvas = canvasRef.current;
                if (canvas && psConfig) {
                    drawPresentationScreenPreview(canvas, psConfig);
                } else if (canvas) {
                    // No asset found: show a placeholder
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.fillStyle = '#101820';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.fillStyle = '#888';
                        ctx.font = '12px monospace';
                        ctx.fillText('PresentationScreen: no asset assigned', 16, canvas.height / 2);
                    }
                }
                // Auto-advance after waitForFrames (60fps), or wait for fire if waitForKey
                const psRuntime = psConfig?.runtime;
                const psWaitFrames = psRuntime?.waitForFrames ?? 0;
                const psWaitKey = psRuntime?.waitForKey ?? true;
                if (!psWaitKey && psWaitFrames > 0) {
                    setTimeout(() => {
                        const conn = connections.find(c => c.from.nodeId === currentNode.id);
                        if (conn) setCurrentNodeId(conn.to.nodeId);
                    }, Math.round((psWaitFrames / 60) * 1000));
                }
                // If waitForKey (or no frames configured), user must press Space/Enter (handled in handleKeyDown)
                break;
            }
            case 'End':
                if (gameFlowStack.length > 0) {
                    const { parentGraphData, returnNodeId, parentGameFlowName } = gameFlowStack[gameFlowStack.length - 1];
                    setGameFlowStack(prev => prev.slice(0, -1));
                    const restoredGraphData = gameFlowStack.length > 1
                        ? gameFlowStack[gameFlowStack.length - 2].parentGraphData
                        : graphData;
                    if (gameFlowStack.length > 1) {
                        setCurrentNestedGraphData(gameFlowStack[gameFlowStack.length - 2].parentGraphData);
                    } else {
                        setCurrentNestedGraphData(null);
                    }
                    setCurrentExecutingGameFlowName(parentGameFlowName);
                    let finalNodeId = returnNodeId;
                    let finalNode = restoredGraphData.nodes.find(n => n.id === finalNodeId);
                    while (finalNode && finalNode.type === 'Waypoint') {
                        const nextConn = restoredGraphData.connections.find(c => c.from.nodeId === finalNodeId);
                        if (nextConn) {
                            finalNodeId = nextConn.to.nodeId;
                            finalNode = restoredGraphData.nodes.find(n => n.id === finalNodeId);
                        } else {
                            break;
                        }
                    }
                    setCurrentNodeId(finalNodeId);
                    setNavigationStack([]);
                    setSelectedOptionIndex(0);
                }
                break;
            case 'Restart':
                const restartNode = currentNode as any;
                const restartTitle = restartNode.title || 'Restart';
                const restartMessage = restartNode.message || 'Press Fire to restart';
                const restartTitleDims = getTextDimensionsMSX1(restartTitle, 1);
                await drawTextAsync(restartTitle, (PREVIEW_WIDTH - restartTitleDims.width) / 2, 60, msxFontColorAttributes);
                const restartMsgDims = getTextDimensionsMSX1(restartMessage, 1);
                await drawTextAsync(restartMessage, (PREVIEW_WIDTH - restartMsgDims.width) / 2, 90, msxFontColorAttributes);
                const restartPrompt = 'Press Fire to restart';
                const restartPromptDims = getTextDimensionsMSX1(restartPrompt, 1);
                await drawTextAsync(restartPrompt, (PREVIEW_WIDTH - restartPromptDims.width) / 2, PREVIEW_HEIGHT - 30, msxFontColorAttributes);
                break;
            case 'Transition':
                const transitionNode = currentNode as any;
                const effect = transitionNode.effect || 'cls';
                const duration = transitionNode.duration || 1000;
                await applyTransitionEffect(effect, duration);
                const transitionConn = connections.find(c => c.from.nodeId === currentNode.id);
                if (transitionConn) {
                    let targetNodeId = transitionConn.to.nodeId;
                    let targetNode = nodes.find(n => n.id === targetNodeId);
                    while (targetNode && targetNode.type === 'Waypoint') {
                        const nextConn = connections.find(c => c.from.nodeId === targetNodeId);
                        if (nextConn) {
                            targetNodeId = nextConn.to.nodeId;
                            targetNode = nodes.find(n => n.id === targetNodeId);
                        } else {
                            break;
                        }
                    }
                    setCurrentNodeId(targetNodeId);
                }
                break;
            case 'Group':
                const groupNode = currentNode as any;
                const groupGameFlowAsset = allAssets.find(a => a.id === groupNode.gameFlowAssetId && a.type === 'gameflow');
                if (!groupNode.gameFlowAssetId || !groupGameFlowAsset) {
                    const groupTitle = groupNode.name || 'Group';
                    const groupTitleDims = getTextDimensionsMSX1(groupTitle, 1);
                    await drawTextAsync(groupTitle, (PREVIEW_WIDTH - groupTitleDims.width) / 2, 60, msxFontColorAttributes);
                    const noFlowText = groupNode.gameFlowAssetId ? 'GameFlow not found' : 'No GameFlow assigned';
                    const noFlowDims = getTextDimensionsMSX1(noFlowText, 1);
                    await drawTextAsync(noFlowText, (PREVIEW_WIDTH - noFlowDims.width) / 2, 90, msxFontColorAttributes);
                } else {
                    const nestedGraphData = groupGameFlowAsset.data as GameFlowGraph;
                    const exitConnection = connections.find(c => c.from.nodeId === currentNode.id);
                    const returnNodeId = exitConnection ? exitConnection.to.nodeId : currentNode.id;
                    setGameFlowStack(prev => [...prev, {
                        parentGraphData: currentGraphData,
                        returnNodeId,
                        parentGameFlowName: currentExecutingGameFlowName
                    }]);
                    setCurrentNestedGraphData(nestedGraphData);
                    setCurrentExecutingGameFlowName(groupGameFlowAsset.name);
                    const nestedStartNode = nestedGraphData.nodes.find(n => n.type === 'Start');
                    if (nestedStartNode) {
                        setCurrentNodeId(nestedStartNode.id);
                        setNavigationStack([]);
                        setSelectedOptionIndex(0);
                    }
                }
                break;
        }
    };



    const handleTilemapCollision = (entity: AnimatedEntity, screenMap: ScreenMap, tileset: Tile[], collisionCompDef: ComponentDefinition) => {
        if (!screenMap || !tileset || !collisionCompDef) return;
        entity.isTouchingCeiling = false;
        entity.isTouchingWallLeft = false;
        entity.isTouchingWallRight = false;
        const entityCollisionProps = {
            ...collisionCompDef.properties.reduce((acc, prop) => { acc[prop.name] = prop.defaultValue; return acc; }, {}),
            ...(entity.template.components.find(c => c.definitionId === 'comp_collision')?.defaultValues || {}),
            ...(entity.instance.componentOverrides?.['comp_collision'] || {})
        };
        const registerWallCollisionEvent = (direction: 'left' | 'right' | 'up' | 'down') => {
            triggerEvent(entity.instance.id, 'collision_wall');
            triggerEvent(entity.instance.id, `collision_wall_${direction}`);
        };
        const getHitboxFor = (x: number, y: number) => {
            // Respect sprite-defined hitbox when comp values are not provided
            const sHit = entity.sprite.hitbox;
            const offsetX = (entityCollisionProps.offsetX !== undefined && entityCollisionProps.offsetX !== '')
                ? Number(entityCollisionProps.offsetX)
                : (sHit?.offsetX ?? 0);
            const offsetY = (entityCollisionProps.offsetY !== undefined && entityCollisionProps.offsetY !== '')
                ? Number(entityCollisionProps.offsetY)
                : (sHit?.offsetY ?? 0);
            const width = (entityCollisionProps.hitboxWidth !== undefined && entityCollisionProps.hitboxWidth !== '')
                ? Number(entityCollisionProps.hitboxWidth)
                : (sHit?.width ?? entity.sprite.size.width);
            const height = (entityCollisionProps.hitboxHeight !== undefined && entityCollisionProps.hitboxHeight !== '')
                ? Number(entityCollisionProps.hitboxHeight)
                : (sHit?.height ?? entity.sprite.size.height);
            return { x: x + offsetX, y: y + offsetY, width, height };
        };
        const currentHitbox = getHitboxFor(entity.x, entity.y);
        const platformContext = { hitboxBottom: currentHitbox.y + currentHitbox.height, velocityY: entity.vy };
        let tentativeX = entity.x + entity.vx;
        let tentativeY = entity.y + entity.vy;
        let tentativeHitbox = getHitboxFor(tentativeX, tentativeY);

        // --- X-axis collision: use centered vertical probes to avoid top/bottom corner glitches ---
        if (entity.vx !== 0) {
            let collisionX = false;
            const centerY1 = tentativeHitbox.y + Math.floor(tentativeHitbox.height / 3);
            const centerY2 = tentativeHitbox.y + Math.floor((2 * tentativeHitbox.height) / 3);

            if (entity.vx > 0) { // Derecha
                if (checkCollisionAt(tentativeHitbox.x + tentativeHitbox.width, centerY1, screenMap, { ignoreTopSolid: true }) ||
                    checkCollisionAt(tentativeHitbox.x + tentativeHitbox.width, centerY2, screenMap, { ignoreTopSolid: true })) {
                    collisionX = true;
                    const tileLeftEdge = Math.floor((tentativeHitbox.x + tentativeHitbox.width) / TILE_SIZE) * TILE_SIZE;
                    tentativeX = tileLeftEdge - Number(entityCollisionProps.offsetX ?? 0) - tentativeHitbox.width;
                    entity.vx = 0;
                    entity.isTouchingWallRight = true;
                    registerWallCollisionEvent('right');
                }
            } else if (entity.vx < 0) { // Izquierda
                if (checkCollisionAt(tentativeHitbox.x, centerY1, screenMap, { ignoreTopSolid: true }) ||
                    checkCollisionAt(tentativeHitbox.x, centerY2, screenMap, { ignoreTopSolid: true })) {
                    collisionX = true;
                    const tileRightEdge = Math.ceil(tentativeHitbox.x / TILE_SIZE) * TILE_SIZE;
                    tentativeX = tileRightEdge - Number(entityCollisionProps.offsetX ?? 0);
                    entity.vx = 0;
                    entity.isTouchingWallLeft = true;
                    registerWallCollisionEvent('left');
                }
            }
            if (collisionX) {
                tentativeHitbox = getHitboxFor(tentativeX, tentativeY);
            }
        }

        // --- Y-axis collision: use centered horizontal probes ---
        if (entity.vy !== 0) {
            let collisionY = false;
            const centerX1 = tentativeHitbox.x + Math.floor(tentativeHitbox.width / 3);
            const centerX2 = tentativeHitbox.x + Math.floor((2 * tentativeHitbox.width) / 3);

            if (entity.vy > 0) { // Cayendo
                const onPlatform = entity.platformUnderneath != null;
                if (!onPlatform && (checkCollisionAt(centerX1, tentativeHitbox.y + tentativeHitbox.height, screenMap, { platformContext }) ||
                    checkCollisionAt(centerX2, tentativeHitbox.y + tentativeHitbox.height, screenMap, { platformContext }))) {
                    collisionY = true;
                    const tileTopEdge = Math.floor((tentativeHitbox.y + tentativeHitbox.height) / TILE_SIZE) * TILE_SIZE;
                    tentativeY = tileTopEdge - Number(entityCollisionProps.offsetY ?? 0) - tentativeHitbox.height;
                    entity.vy = 0;
                    entity.gravityVel = 0; // Z80: cancel gravity accumulator on floor hit
                    registerWallCollisionEvent('down');
                }
            } else if (entity.vy < 0) { // Saltando (hacia arriba)
                if (checkCollisionAt(centerX1, tentativeHitbox.y, screenMap, { ignoreTopSolid: true }) ||
                    checkCollisionAt(centerX2, tentativeHitbox.y, screenMap, { ignoreTopSolid: true })) {
                    collisionY = true;
                    const tileRow = Math.floor(tentativeHitbox.y / TILE_SIZE);
                    const tileBottomEdge = (tileRow + 1) * TILE_SIZE;
                    tentativeY = tileBottomEdge - Number(entityCollisionProps.offsetY ?? 0);
                    entity.vy = 0; // Stop vertical velocity after touching the ceiling
                    entity.gravityVel = 0; // Z80: cancel gravity accumulator on ceiling hit
                    entity.isTouchingCeiling = true;
                    registerWallCollisionEvent('up');


                }
            }
            if (collisionY) {
                // No es estrictamente necesario, pero mantiene consistencia
                // tentativeHitbox = getHitboxFor(tentativeX, tentativeY);
            }
        }

        // Apply the final position after collision resolution
        entity.x = tentativeX;
        entity.y = tentativeY;

        // Deadly tile detection now lives in a dedicated component pass
        // keyed by comp_deadly_tiles so Preview matches the ECS/ASM model.
    };

    const entityCollisionProps = (entity: AnimatedEntity) => {
        const collisionCompDef = componentDefinitions.find(c => c.id === 'comp_collision');
        if (!collisionCompDef) {
            return null;
        }

        const templateCollisionComp = entity.template.components.find(c => c.definitionId === 'comp_collision');
        const templateValues = templateCollisionComp?.defaultValues || {};
        const instanceValues = entity.instance.componentOverrides?.['comp_collision'] || {};

        // Priority: instanceValues > templateValues > sprite.hitbox > defaults > sprite.size
        const spriteHitbox = entity.sprite.hitbox;
        const defaults = collisionCompDef.properties.reduce((acc, prop) => { acc[prop.name] = prop.defaultValue; return acc; }, {} as Record<string, any>);

        // Helper that resolves a value following the priority rules above
        const getPriorityValue = (propName: string, spriteFallback?: number) => {
            // 1. Instance override (highest priority)
            if (instanceValues[propName] !== undefined && instanceValues[propName] !== '') {
                return Number(instanceValues[propName]);
            }
            // 2. Template default value
            if (templateValues[propName] !== undefined && templateValues[propName] !== '') {
                return Number(templateValues[propName]);
            }
            // 3. Sprite hitbox fallback when available
            if (spriteFallback !== undefined) {
                return spriteFallback;
            }
            // 4. Component default
            if (defaults[propName] !== undefined && defaults[propName] !== '') {
                return Number(defaults[propName]);
            }
            // 5. Final fallback
            return 0;
        };

        const hitboxWidth = getPriorityValue('hitboxWidth', spriteHitbox?.width ?? entity.sprite.size.width);
        const hitboxHeight = getPriorityValue('hitboxHeight', spriteHitbox?.height ?? entity.sprite.size.height);
        const offsetX = getPriorityValue('offsetX', spriteHitbox?.offsetX ?? 0);
        const offsetY = getPriorityValue('offsetY', spriteHitbox?.offsetY ?? 0);

        // Para otras propiedades sin sprite fallback: instance > template > defaults
        const getValueNoSpriteFallback = (propName: string, defaultFallback: any) => {
            if (instanceValues[propName] !== undefined && instanceValues[propName] !== '') return instanceValues[propName];
            if (templateValues[propName] !== undefined && templateValues[propName] !== '') return templateValues[propName];
            if (defaults[propName] !== undefined && defaults[propName] !== '') return defaults[propName];
            return defaultFallback;
        };

        const collisionLayer = Number(getValueNoSpriteFallback('collisionLayer', 1)) || 1;
        const collidesWith = Number(getValueNoSpriteFallback('collidesWith', 255)) || 255;
        const isStatic = getValueNoSpriteFallback('isStatic', false) === true || getValueNoSpriteFallback('isStatic', false) === 'true';
        const isTrigger = getValueNoSpriteFallback('isTrigger', false) === true || getValueNoSpriteFallback('isTrigger', false) === 'true';

        const result = {
            hitboxWidth,
            hitboxHeight,
            offsetX,
            offsetY,
            collisionLayer,
            collidesWith,
            isStatic,
            isTrigger
        };

        return result;
    };

    const getHitboxFor = (entity: AnimatedEntity, props: any) => ({
        x: entity.x + (props.offsetX || 0), y: entity.y + (props.offsetY || 0),
        width: props.hitboxWidth || entity.sprite.size.width, height: props.hitboxHeight || entity.sprite.size.height,
    });

    const getHitboxForPosition = (entity: AnimatedEntity, x: number, y: number, props: any) => ({
        x: x + (props.offsetX || 0), y: y + (props.offsetY || 0),
        width: props.hitboxWidth || entity.sprite.size.width, height: props.hitboxHeight || entity.sprite.size.height,
    });

    // --- Entity Collision Resolution (Physical Response) ---
    const resolveEntityCollision = (entityA: AnimatedEntity, entityB: AnimatedEntity, propsA: any, propsB: any) => {
        const hitboxA = getHitboxFor(entityA, propsA);
        const hitboxB = getHitboxFor(entityB, propsB);

        // Calculate overlap in both axes
        const overlapX = Math.min(
            hitboxA.x + hitboxA.width - hitboxB.x,
            hitboxB.x + hitboxB.width - hitboxA.x
        );
        const overlapY = Math.min(
            hitboxA.y + hitboxA.height - hitboxB.y,
            hitboxB.y + hitboxB.height - hitboxA.y
        );

        // Determine if entities are static (immovable) or dynamic
        const isAStatic = propsA.isStatic === true || propsA.isStatic === 'true';
        const isBStatic = propsB.isStatic === true || propsB.isStatic === 'true';

        // If both are static, no resolution needed
        if (isAStatic && isBStatic) return;

        // DEBUG: Log collision details for platform detection
        const isPlatformInvolved = (propsA.collisionLayer & 8) !== 0 || (propsB.collisionLayer & 8) !== 0;
        if (isPlatformInvolved) {
        }

        // Detect platform riding BEFORE axis separation (works regardless of separation axis)
        // Check if A is standing on top of B (platform detection based on relative positions)
        const isAAboveB = (hitboxA.y + hitboxA.height / 2) < (hitboxB.y + hitboxB.height / 2);
        const isBAboveA = (hitboxB.y + hitboxB.height / 2) < (hitboxA.y + hitboxA.height / 2);

        // DEBUG: Log platform detection conditions
        if (isPlatformInvolved) {
        }

        if (isAAboveB && entityA.vy >= 0) {

            // A is above B and falling/stationary - check if B is a platform OR a box
            const isPlatformLayer = (propsB.collisionLayer & 8) !== 0;
            const isBoxEntity = entityB.template.components?.some(c => c.definitionId === 'comp_box') || /box/i.test(entityB.template.name);
            if (isPlatformLayer || isBoxEntity) {
                entityA.platformUnderneath = entityB;
            } else {
            }
        } else if (isAAboveB) {
        }

        if (isBAboveA && entityB.vy >= 0) {
            // B is above A and falling/stationary - check if A is a platform OR a box
            const isPlatformLayer = (propsA.collisionLayer & 8) !== 0;
            const isBoxEntity = entityA.template.components?.some(c => c.definitionId === 'comp_box') || /box/i.test(entityA.template.name);
            if (isPlatformLayer || isBoxEntity) {
                entityB.platformUnderneath = entityA;
            }
        }

        const isPlatformCase = entityA.platformUnderneath === entityB || entityB.platformUnderneath === entityA;

        // Find minimum translation vector (MTV) - separate on axis with less overlap
        if (overlapX < overlapY && !isPlatformCase) {
            // Separate on X axis
            const direction = (hitboxA.x + hitboxA.width / 2) < (hitboxB.x + hitboxB.width / 2) ? -1 : 1;
            const separation = overlapX * direction;

            if (isAStatic) {
                // Only B moves
                entityB.x -= separation;
                entityB.vx = 0;
            } else if (isBStatic) {
                // Only A moves
                entityA.x += separation;
                entityA.vx = 0;
            } else {
                // Both move (split separation)
                const halfSep = separation / 2;
                entityA.x += halfSep;
                entityB.x -= halfSep;

                // Exchange velocities (simple elastic collision)
                const isBPlatformX = (propsB.collisionLayer & 8) !== 0;
                const isAPlatformX = (propsA.collisionLayer & 8) !== 0;

                if (isAPlatformX || isBPlatformX) {
                    // For platforms, don't exchange velocity. Just stop the dynamic entity.
                    if (isBPlatformX && !isAPlatformX) entityA.vx = 0;
                    if (isAPlatformX && !isBPlatformX) entityB.vx = 0;
                } else {
                    const tempVx = entityA.vx;
                    entityA.vx = entityB.vx;
                    entityB.vx = tempVx;
                }
            }
        } else {
            // Separate on Y axis
            const direction = (hitboxA.y + hitboxA.height / 2) < (hitboxB.y + hitboxB.height / 2) ? -1 : 1;
            const separation = overlapY * direction;

            if (isAStatic) {
                // Only B moves
                entityB.y -= separation;
                entityB.vy = 0;
                entityB.gravityVel = 0;
            } else if (isBStatic) {
                // Only A moves
                entityA.y += separation;
                entityA.vy = 0;
                entityA.gravityVel = 0;
            } else {
                // Both move (split separation)
                const halfSep = separation / 2;
                entityA.y += halfSep;
                entityB.y -= halfSep;

                // Exchange velocities (simple elastic collision)
                const isBPlatformY = (propsB.collisionLayer & 8) !== 0;
                const isAPlatformY = (propsA.collisionLayer & 8) !== 0;

                if (isAPlatformY || isBPlatformY) {
                    // When on a platform, stop the entity's vertical velocity.
                    // The platform will move the entity directly in the platform update section.
                    if (isBPlatformY && !isAPlatformY && isAAboveB) {
                        entityA.vy = 0; entityA.gravityVel = 0; // Stop player velocity, platform will move it
                    } else if (isAPlatformY && !isBPlatformY && isBAboveA) {
                        entityB.vy = 0; entityB.gravityVel = 0; // Stop entity velocity, platform will move it
                    } else {
                        // Side or bottom collision, just stop.
                        if (isBPlatformY && !isAPlatformY) { entityA.vy = 0; entityA.gravityVel = 0; }
                        if (isAPlatformY && !isBPlatformY) { entityB.vy = 0; entityB.gravityVel = 0; }
                    }
                } else {
                    const tempVy = entityA.vy;
                    entityA.vy = entityB.vy;
                    entityB.vy = tempVy;
                }
            }
        }
    };

    // --- New animation function ---
    let lastTime = 0;
    const animate = (currentTime: number) => {
        // Sync gamepad state into pressedKeys before processing input/physics
        try { syncGamepadToPressedKeys(); } catch { }
        // Allow gamepad to navigate SubMenu
        try { syncGamepadForMenu(); } catch { }
        const skipSpriteDrawThisFrame = cleanSpritesNextFrameRef.current;
        cleanSpritesNextFrameRef.current = false;
        // Reset per-frame item collision guard
        collisionItemFrameGuardRef.current.clear();
        processedCollectibleScoreRef.current.clear();
        // --- Calcular deltaTime (opcional) ---
        // const deltaTime = currentTime - lastTime;
        // lastTime = currentTime;
        // --- Fin deltaTime ---

        if (currentNode.type === 'WorldLink' && currentScreenMapRef.current?.id) {
            const timerState = screenTimerRuntimeRef.current;
            const currentScreenId = currentScreenMapRef.current.id;

            if (timerState.screenId !== currentScreenId) {
                timerState.screenId = currentScreenId;
                timerState.lastTickTime = currentTime;
                timerState.carryMs = 0;
            } else {
                const deltaMs = Math.max(0, currentTime - (timerState.lastTickTime || currentTime));
                timerState.lastTickTime = currentTime;
                timerState.carryMs += deltaMs;

                const elapsedSeconds = Math.floor(timerState.carryMs / 1000);
                if (elapsedSeconds > 0) {
                    timerState.carryMs -= elapsedSeconds * 1000;
                    const currentValueRaw = getGlobalVariableValue(STAGE_TIME_VARIABLE);
                    const currentValue = Number.isFinite(Number(currentValueRaw))
                        ? Math.max(0, Math.floor(Number(currentValueRaw)))
                        : STAGE_TIME_SECONDS;

                    if (currentValue > 0) {
                        const nextValue = Math.max(0, currentValue - elapsedSeconds);
                        if (nextValue !== currentValue) {
                            updateGameGlobalVariables(prev => ({
                                ...prev,
                                [STAGE_TIME_VARIABLE]: nextValue
                            }));
                        }
                    }
                }
            }
        }

        // Regenerar buffer si es necesario (tiles modificados por BREAK_TILE/REPLACE_TILE)
        if (tileBufferNeedsUpdate.current && screenMapToRender) {
            const layerToUse = runtimeCollisionLayerRef.current.length > 0 ? runtimeCollisionLayerRef.current : undefined;
            tileBufferRef.current = renderTileMapToBuffer(screenMapToRender, tileset, previewScreenMode, layerToUse);
            // Paint HUD frame on top of tile buffer
            paintHudFrameOnBuffer(tileBufferRef.current);
            tileBufferNeedsUpdate.current = false;
            // Re-initialize animated tile groups after full buffer rebuild
            tileAnimGroupsRef.current = buildTileAnimGroups(screenMapToRender, tileset);
            // Re-apply collected tiles after buffer rebuild
            applyCollectedTiles(screenMapToRender);
        }

        // Update animated tiles (advance frames, repaint changed positions on buffer)
        updateAnimatedTilesBuffer();

        // === RESOLVE PARENTS FOR CHILD-LINKED ENTITIES ===
        const entityLookup = new Map<string, AnimatedEntity>();
        for (const entity of entitiesRef.current) {
            entityLookup.set(entity.instance.id, entity);
        }
        resolveChildLinkParents(entitiesRef.current, entityLookup);
        // ================================================

        // Limpiar solo el Area principal
        ctx.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);

        // Dibujar el fondo pre-renderizado (tiles)
        if (tileBufferRef.current) {
            ctx.drawImage(tileBufferRef.current, 0, 0);

            // Hide revealed secret tiles by drawing black rectangles over them
            if (currentScreenMapRef.current) {
                ctx.fillStyle = '#000000'; // Background color
                revealedSecretTiles.current.forEach((key) => {
                    const parts = key.split('_');
                    const screenId = parts.slice(0, -2).join('_');
                    const tx = parseInt(parts[parts.length - 2], 10);
                    const ty = parseInt(parts[parts.length - 1], 10);

                    if (screenId === currentScreenMapRef.current?.id) {
                        // Draw black rectangle to hide this tile
                        ctx.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    }
                });
            }

            // Debug overlay: outlines for solid tiles in Collision layer
            drawCollisionTileOutlines(ctx);
        } else {
            // Si no hay buffer (por ejemplo, en nodos de texto), limpiar y dibujar fondo
            ctx.fillStyle = '#000000'; // Color por defecto
            if (subMenuNode?.appearance?.colors?.background) {
                ctx.fillStyle = subMenuNode.appearance.colors.background;
            } else if (currentNode.type === 'Text') {
                const textNode = currentNode as GameFlowTextNode;
                ctx.fillStyle = textNode.appearance?.colors?.background || '#000000';
            }
            ctx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
        }

        const now = performance.now();
        updateGameGlobalVariables(prev => ({
            ...prev,
            last_interaction_pending: false
        }));
        // Lifetime expiration: mark entities whose time is over
        entitiesRef.current.forEach(e => {
            if (e.expiresAt !== undefined && now >= e.expiresAt) {
                (e as any).markedForDestruction = true;
            }
        });

        // Debug: Log entities with collision component (only once per second to avoid spam)
        // if (now % 1000 < 16) { // Aproximadamente cada segundo
        ////     entitiesRef.current.forEach((e, idx) => {
        //         const hasComp = e.template.components.some(c => c.definitionId === 'comp_collision');
        //         const props = entityCollisionProps(e);
        //         if (hasComp && props) {
        //         } else if (hasComp && !props) {
        //         }
        //     });
        // }

        entitiesRef.current.forEach((entityA, indexA) => {
            const isCarriedBox = heroRef.current?.carriedBox === entityA;
            // Treat entities tagged as box as collidable with tiles even if they don't explicitly have comp_collision
            const isBoxEntity = entityA.template.components?.some(c => c.definitionId === 'comp_box') || /box/i.test(entityA.template.name);
            const isCollectibleItem = isCollectibleEntity(entityA);
            const childLinkConfig = entityA.childLink;
            const childLinkParent = childLinkConfig && entityA.parentEntityId
                ? entityLookup.get(entityA.parentEntityId)
                : undefined;
            if (entityA.carriedBox && !entityA.carrySpriteBackup) {
                switchToCarrySpriteIfConfigured(entityA);
            } else if (!entityA.carriedBox && entityA.carrySpriteBackup) {
                restoreSpriteAfterCarry(entityA);
            }
            // Prevent double-processing of collectibles once consumed
            if (isCollectibleItem && (entityA as any).__collectedOnce) {
                return;
            }

            // --- Early-out para entidades que no pertenecen a esta pantalla ---
            // Salvo que sean hijas y su padre est visible aqu
            const currentScreenId = currentScreenMapRef.current?.id;
            const isChildOfVisibleParent = childLinkConfig &&
                childLinkParent &&
                childLinkParent.ownerScreenId === currentScreenId;

            if (
                entityA.ownerScreenId &&
                entityA.ownerScreenId !== currentScreenId &&
                !isChildOfVisibleParent
            ) {
                return; // No se dibuja ni se procesa ms
            }

            // Filter Box entities: only process if they belong to current screen or are being carried
            if (isBoxEntity) {
                const shouldProcessBox = entityA.ownerScreenId === null || // Being carried
                    entityA.ownerScreenId === currentScreenMapRef.current?.id || // Belongs to current screen
                    isChildOfVisibleParent; // Child rendered with its parent

                if (!shouldProcessBox) {
                    return; // Skip processing this Box (it belongs to another screen)
                }
            }

            // Filter Collectible items: only process if they belong to current screen
            if (isCollectibleItem) {
                const shouldProcessCollectible = entityA.ownerScreenId === currentScreenMapRef.current?.id || // Belongs to current screen
                    isChildOfVisibleParent;

                if (!shouldProcessCollectible) {
                    return; // Skip processing this item (it belongs to another screen)
                }
            }

            if (entityA.autoEventRuntime) {
                updateAutoEventRuntime(entityA, now);
            }

            // --- PROJECTILES: movement, range and collisions ---
            if (entityA.isProjectile) {
                // Move projectile
                entityA.x += entityA.vx || 0;
                entityA.y += entityA.vy || 0;

                // Out-of-bounds quick cull
                if (entityA.x < -32 || entityA.x > PREVIEW_WIDTH + 32 || entityA.y < -32 || entityA.y > PREVIEW_HEIGHT + 32) {
                    entityA.markedForDestruction = true as any;
                }

                // Range check
                const sx = entityA.projectileStartX ?? entityA.x;
                const sy = entityA.projectileStartY ?? entityA.y;
                const dxr = (entityA.x - sx);
                const dyr = (entityA.y - sy);
                const dist = Math.sqrt(dxr * dxr + dyr * dyr);
                if (entityA.projectileMaxRange !== undefined && dist >= entityA.projectileMaxRange) {
                    entityA.markedForDestruction = true as any;
                }

                // Tile collision (respect sprite hitbox if present)
                if (screenMapToRender) {
                    const sHit = entityA.sprite.hitbox;
                    const hbX = entityA.x + (sHit?.offsetX ?? 0);
                    const hbY = entityA.y + (sHit?.offsetY ?? 0);
                    const hbW = sHit?.width ?? entityA.sprite.size.width;
                    const hbH = sHit?.height ?? entityA.sprite.size.height;

                    const cx = hbX + Math.floor(hbW / 2);
                    const cy = hbY + Math.floor(hbH / 2);
                    const hitTile =
                        checkCollisionAt(cx, cy, screenMapToRender) ||
                        checkCollisionAt(hbX, cy, screenMapToRender) ||
                        checkCollisionAt(hbX + hbW - 1, cy, screenMapToRender) ||
                        checkCollisionAt(cx, hbY, screenMapToRender) ||
                        checkCollisionAt(cx, hbY + hbH - 1, screenMapToRender);
                    if (hitTile) {
                        // On solid tile, trigger explosion (Render2) if present; otherwise destroy
                        startProjectileExplosion(entityA);
                    }
                }

                // Entity collisions (respect both projectile and target hitboxes)
                for (let j = 0; j < entitiesRef.current.length && !entityA.markedForDestruction; j++) {
                    if (j === indexA) continue;
                    const target = entitiesRef.current[j];
                    if (target.instance.id === entityA.projectileOwnerId) continue;
                    if (target.isProjectile) continue;

                    // Projectile hitbox from sprite or sprite size
                    const pHB = entityA.sprite.hitbox;
                    const ax1 = entityA.x + (pHB?.offsetX ?? 0);
                    const ay1 = entityA.y + (pHB?.offsetY ?? 0);
                    const ax2 = ax1 + (pHB?.width ?? entityA.sprite.size.width);
                    const ay2 = ay1 + (pHB?.height ?? entityA.sprite.size.height);

                    // Target hitbox from comp_collision (with sprite fallback) or sprite.hitbox/size
                    let bx1 = target.x, by1 = target.y, bx2 = bx1 + target.sprite.size.width, by2 = by1 + target.sprite.size.height;
                    const tProps = entityCollisionProps(target);
                    if (tProps) {
                        const thb = getHitboxFor(target, tProps);
                        bx1 = thb.x; by1 = thb.y; bx2 = thb.x + thb.width; by2 = thb.y + thb.height;
                    } else if (target.sprite.hitbox) {
                        const sh = target.sprite.hitbox;
                        bx1 = target.x + (sh.offsetX ?? 0);
                        by1 = target.y + (sh.offsetY ?? 0);
                        bx2 = bx1 + (sh.width ?? target.sprite.size.width);
                        by2 = by1 + (sh.height ?? target.sprite.size.height);
                    }

                    const overlap = (ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1);
                    if (!overlap) continue;

                    const healthComp = target.template.components.find(c => c.definitionId === 'comp_health');
                    if (healthComp) {
                        if (!target.instance.componentOverrides) target.instance.componentOverrides = {} as any;
                        if (!target.instance.componentOverrides['comp_health']) target.instance.componentOverrides['comp_health'] = {};
                        const overrides = target.instance.componentOverrides['comp_health'];
                        const current = Number(overrides.current ?? healthComp.defaultValues?.current ?? 1);
                        const newVal = Math.max(0, current - (entityA.projectileDamage || 1));
                        overrides.current = newVal;
                        if (newVal <= 0) {
                            target.markedForDestruction = true as any;
                        }
                    }

                    if (entityA.projectileExpireOnHit !== false) {
                        // On entity impact, explode if configured, else destroy
                        startProjectileExplosion(entityA);
                    }
                }

                // Animate projectile frames if enabled
                if ((entityA.isExploding || entityA.animateProjectile !== false) && entityA.frameImages.length > 1) {
                    const spriteAnimMs = (entityA.sprite && typeof entityA.sprite.animationSpeedMs === 'number') ? entityA.sprite.animationSpeedMs! : ANIMATION_SPEED_MS;
                    if (now - entityA.lastFrameUpdateTime > spriteAnimMs) {
                        if (entityA.isExploding) {
                            // Explosion should not loop; end when finished
                            if (entityA.currentFrame < entityA.frameImages.length - 1) {
                                entityA.currentFrame++;
                            } else {
                                (entityA as any).markedForDestruction = true;
                            }
                        } else {
                            const loops = (entityA.sprite.loops !== undefined) ? entityA.sprite.loops : true;
                            if (loops) {
                                entityA.currentFrame = (entityA.currentFrame + 1) % entityA.frameImages.length;
                            } else if (entityA.currentFrame < entityA.frameImages.length - 1) {
                                entityA.currentFrame++;
                            }
                        }
                        entityA.lastFrameUpdateTime = now;
                    }
                }

                // Render projectile immediately and skip rest
                if (entityA.frameImages.length > 0) {
                    const useMirrored = !!(entityA.isFacingMirrored && entityA.mirroredFrameImages && entityA.mirroredFrameImages.length > 0);
                    const framesToUse = useMirrored ? (entityA.mirroredFrameImages as HTMLImageElement[]) : entityA.frameImages;
                    const img = framesToUse[entityA.currentFrame] || framesToUse[0];
                    if (!skipSpriteDrawThisFrame && img && img.complete && img.naturalWidth > 0) {
                        ctx.drawImage(img, entityA.x, entityA.y);
                    }
                }
                return;
            }
            // --- 0. Compute isOnGround based on current position ---
            const hasCollisionComp = entityA.template.components.some(c => c.definitionId === 'comp_collision');
            const collisionCompDef = componentDefinitions.find(c => c.id === 'comp_collision');
            // Boxes should also interact with tile collisions even without comp_collision
            if ((hasCollisionComp || isBoxEntity) && collisionCompDef && screenMapToRender && !isCarriedBox) {
                const props = entityCollisionProps(entityA);
                if (props) {
                    const hitbox = getHitboxForPosition(entityA, entityA.x, entityA.y + 1, props); // Check 1px below
                    const centerX1 = hitbox.x + Math.floor(hitbox.width / 3);
                    const centerX2 = hitbox.x + Math.floor((2 * hitbox.width) / 3);
                    const bottomY = hitbox.y + hitbox.height;
                    const platformContext = { hitboxBottom: bottomY, velocityY: entityA.vy };

                    // Check tiles OR platform from PREVIOUS frame (before it gets cleared)
                    const onTiles = checkCollisionAt(centerX1, bottomY, screenMapToRender, { platformContext }) ||
                        checkCollisionAt(centerX2, bottomY, screenMapToRender, { platformContext });
                    // Be robust: consider we were on a platform last frame if the reference exists
                    const onPlatformPreviousFrame = !!entityA.platformUnderneath;

                    // Coyote-time: keep grounded for a few frames after leaving a platform
                    if (onPlatformPreviousFrame) {
                        entityA.platformGraceFramesLeft = 6; // ~6 frames of tolerance
                    } else if ((entityA.platformGraceFramesLeft || 0) > 0) {
                        entityA.platformGraceFramesLeft = (entityA.platformGraceFramesLeft || 0) - 1;
                    }

                    const hasPlatformGrace = (entityA.platformGraceFramesLeft || 0) > 0;
                    entityA.isOnGround = onTiles || onPlatformPreviousFrame || hasPlatformGrace;
                } else {
                    entityA.isOnGround = false;
                }
            } else {
                entityA.isOnGround = false;
            }

            // --- Handle Landing (Revert Jump Sprite) ---
            const wasJumping = entityA.instance.componentOverrides?.['comp_jump']?.isJumping;
            if ((entityA.isOnGround || entityA.isOnLadder) && wasJumping) {
                // Reset jumping flag
                if (!entityA.instance.componentOverrides) entityA.instance.componentOverrides = {};
                if (!entityA.instance.componentOverrides['comp_jump']) entityA.instance.componentOverrides['comp_jump'] = {};
                entityA.instance.componentOverrides['comp_jump'].isJumping = false;

                // Revert to default sprite (from comp_render)
                const renderProps = getMergedComponentValues(entityA, 'comp_render');
                const defaultSpriteId = renderProps?.spriteAssetId;
                if (defaultSpriteId) {
                    const spriteAsset = allAssets.find(a => a.id === defaultSpriteId && a.type === 'sprite');
                    if (spriteAsset) {
                        const spriteData = spriteAsset.data as Sprite;
                        entityA.sprite = spriteData;

                        // Regenerate frames
                        const frames = spriteData.frames.map(frame => {
                            const img = new Image();
                            img.src = createSpriteDataURL(frame.data, spriteData.size.width, spriteData.size.height);
                            return img;
                        });
                        entityA.frameImages = frames;

                        // Regenerate mirrored frames
                        if (['right', 'left'].includes(spriteData.facingDirection)) {
                            const mirrored = spriteData.frames.map(frame => {
                                const img = new Image();
                                img.src = createSpriteDataURL(mirrorPixelDataHorizontally(frame.data), spriteData.size.width, spriteData.size.height);
                                return img;
                            });
                            entityA.mirroredFrameImages = mirrored;
                        }

                        entityA.currentFrame = 0;
                        entityA.lastFrameUpdateTime = performance.now();
                    }
                }
            }

            // --- 0.5. Detect Secret Passages ---
            // When player overlaps a background tile that has no collision, reveal it
            if (entityA === heroRef.current && screenMapToRender && currentScreenMapRef.current) {
                const playerTileX = Math.floor(entityA.x / TILE_SIZE);
                const playerTileY = Math.floor(entityA.y / TILE_SIZE);

                // Check if there's a background tile but no collision tile
                const bgTile = screenMapToRender.layers.background[playerTileY]?.[playerTileX];
                const collTile = getScreenBehaviorLayer(screenMapToRender)[playerTileY]?.[playerTileX];

                if (bgTile?.tileId && (!collTile?.tileId || !checkCollisionAt(entityA.x + 4, entityA.y + 4, screenMapToRender))) {
                    // Player is in a secret passage! Reveal nearby background tiles
                    const revealRadius = 2; // Reveal 2 tiles around player
                    for (let dy = -revealRadius; dy <= revealRadius; dy++) {
                        for (let dx = -revealRadius; dx <= revealRadius; dx++) {
                            const tx = playerTileX + dx;
                            const ty = playerTileY + dy;

                            if (ty >= 0 && ty < screenMapToRender.height && tx >= 0 && tx < screenMapToRender.width) {
                                const bgTileCheck = screenMapToRender.layers.background[ty]?.[tx];
                                const collTileCheck = getScreenBehaviorLayer(screenMapToRender)[ty]?.[tx];

                                // Only reveal if there's background but no solid collision
                                if (bgTileCheck?.tileId && !collTileCheck?.tileId) {
                                    const key = `${currentScreenMapRef.current.id}_${tx}_${ty}`;
                                    if (!revealedSecretTiles.current.has(key)) {
                                        revealedSecretTiles.current.add(key);
                                        tileBufferNeedsUpdate.current = false; // Don't force re-render, just hide tiles

                                    }
                                }
                            }
                        }
                    }
                }
            }

            // --- 0.6. Process collision events (state machine transitions) ---
            processEventTransitions(entityA);

            // --- 1. Actualizar Velocidad ---
            if (entityA === heroRef.current) {
                // Apply state machine velocity properties if present
                if (entityA.stateMachine && entityA.currentState) {
                    const stateDef = entityA.stateMachine.states.find(s => s.name === entityA.currentState);
                    if (stateDef?.properties) {
                        if (stateDef.properties.velocityX !== undefined) entityA.vx = stateDef.properties.velocityX;
                        if (stateDef.properties.velocityY !== undefined) entityA.vy = stateDef.properties.velocityY;
                    }
                }

                // Check if current state allows input
                const statesWithoutInput = ['Dead', 'GameOver', 'Stunned', 'Frozen']; // States that disable controls
                const canProcessInput = !entityA.currentState || !statesWithoutInput.includes(entityA.currentState);
                entityA.isOnLadder = detectLadderStateForEntity(entityA, screenMapToRender ?? null);

                // Process input (cursors, jump, actions) - Only if state allows it
                if (canProcessInput) {
                    const hasGravity = entityA.template.components.some(c => c.definitionId === 'comp_gravity') || !!(entityA.instance.componentOverrides?.['comp_gravity']);
                    const cursorsComp = entityA.template.components.find(c => c.definitionId === 'comp_cursors');
                    const airControlComp = entityA.template.components.find(c => c.definitionId === 'comp_air_control');
                    const airControlProps = airControlComp
                        ? {
                            ...airControlComp.defaultValues,
                            ...(entityA.instance.componentOverrides?.['comp_air_control'] || {})
                        }
                        : null;
                    const airControlEnabled = !!airControlProps && airControlProps.isEnabled !== false && airControlProps.isEnabled !== 'false';
                    const airControlMode = airControlEnabled
                        ? String(airControlProps?.airControlMode || 'locked').trim().toLowerCase()
                        : 'full';
                    const airControlLocked = hasGravity
                        && airControlMode === 'locked'
                        && !entityA.isOnLadder
                        && !entityA.isOnGround;

                    // Horizontal Movement
                    if (cursorsComp && !airControlLocked) {
                        const cursorsProps = {
                            ...cursorsComp.defaultValues,
                            ...(entityA.instance.componentOverrides?.['comp_cursors'] || {})
                        };
                        let speed = Number(cursorsProps.speed) || 2;

                        // Reduce speed by half when carrying a box
                        if (entityA.carriedBox) {
                            speed = speed * 0.5;
                        }

                        const allowLeft = cursorsProps.allowLeft !== false;
                        const allowRight = cursorsProps.allowRight !== false;
                        const leftPressed = pressedKeys.current.has('ArrowLeft');
                        const rightPressed = pressedKeys.current.has('ArrowRight');

                        if (leftPressed && allowLeft) {
                            entityA.vx = -speed;
                        } else if (rightPressed && allowRight) {
                            entityA.vx = speed;
                        } else {
                            entityA.vx = 0;
                        }
                    }

                    // Vertical Movement (non-gravity entities, plus gravity entities while climbing a ladder)
                    if (((!hasGravity) || entityA.isOnLadder) && cursorsComp) {
                        const cursorsProps = {
                            ...cursorsComp.defaultValues,
                            ...(entityA.instance.componentOverrides?.['comp_cursors'] || {})
                        };
                        let speed = Number(cursorsProps.speed) || 2;

                        // Reduce speed by half when carrying a box
                        if (entityA.carriedBox) {
                            speed = speed * 0.5;
                        }

                        const allowUp = cursorsProps.allowUp !== false;
                        const allowDown = cursorsProps.allowDown !== false;
                        const upPressed = pressedKeys.current.has('ArrowUp');
                        const downPressed = pressedKeys.current.has('ArrowDown');

                        if (upPressed && allowUp) {
                            entityA.vy = -speed;
                        } else if (downPressed && allowDown) {
                            entityA.vy = speed;
                        } else {
                            entityA.vy = 0;
                        }
                    }

                    // Jump (only for gravity entities)
                    const jumpComp = entityA.template.components.find(c => c.definitionId === 'comp_jump');
                    if (jumpComp) {
                        const jumpProps = { ...jumpComp.defaultValues, ...(entityA.instance.componentOverrides?.['comp_jump'] || {}) };
                        const requireKeyRelease = jumpProps.requireKeyRelease !== 'false' && jumpProps.requireKeyRelease !== false;
                        const spacePressed = pressedKeys.current.has(' ');

                        if (hasGravity && entityA.isOnGround && !entityA.isOnLadder && spacePressed) {
                            // Check if we can jump based on requireKeyRelease setting
                            const canJump = !requireKeyRelease || !jumpKeyProcessed.current;

                            if (canJump) {
                                // Z80-faithful 8.8 fixed-point jump impulse
                                // Z80 hardcodes #FC00 = -1024 in 8.8 = -4 px/frame initial velocity
                                let jumpImpulse = -1024; // 8.8 fixed-point (matching Z80 #FC00)

                                // Reduce jump power by 25% when carrying a box
                                if (entityA.carriedBox) {
                                    jumpImpulse = Math.round(jumpImpulse * 0.75);
                                }

                                // Set gravity velocity directly (8.8 fixed-point), matching Z80 .do_jump
                                entityA.gravityVel = jumpImpulse & 0xFFFF; // keep as unsigned 16-bit
                                // vy = integer part (high byte, signed)
                                const hi = (entityA.gravityVel >> 8) & 0xFF;
                                entityA.vy = hi >= 0x80 ? hi - 0x100 : hi;
                                jumpKeyProcessed.current = true;

                                // Handle Jump Sprite
                                const jumpSpriteId = jumpProps.jumpSprite;
                                if (jumpSpriteId) {
                                    const spriteAsset = allAssets.find(a => a.id === jumpSpriteId && a.type === 'sprite');
                                    if (spriteAsset) {
                                        // Set isJumping flag
                                        if (!entityA.instance.componentOverrides) entityA.instance.componentOverrides = {};
                                        if (!entityA.instance.componentOverrides['comp_jump']) entityA.instance.componentOverrides['comp_jump'] = {};
                                        entityA.instance.componentOverrides['comp_jump'].isJumping = true;

                                        const spriteData = spriteAsset.data as Sprite;
                                        entityA.sprite = spriteData;
                                        entityA.spriteAssetId = spriteAsset.id;

                                        // Regenerate frames
                                        const frames = spriteData.frames.map(frame => {
                                            const img = new Image();
                                            img.src = createSpriteDataURL(frame.data, spriteData.size.width, spriteData.size.height);
                                            return img;
                                        });
                                        entityA.frameImages = frames;

                                        // Regenerate mirrored frames
                                        if (['right', 'left'].includes(spriteData.facingDirection)) {
                                            const mirrored = spriteData.frames.map(frame => {
                                                const img = new Image();
                                                img.src = createSpriteDataURL(mirrorPixelDataHorizontally(frame.data), spriteData.size.width, spriteData.size.height);
                                                return img;
                                            });
                                            entityA.mirroredFrameImages = mirrored;
                                        }

                                        entityA.currentFrame = 0;
                                        entityA.lastFrameUpdateTime = performance.now();
                                    }
                                }

                                // Clear platform reference when jumping to prevent infinite jumps
                                entityA.platformUnderneath = null;
                                entityA.isOnGround = false;
                            }
                        }

                        // Match Z80 edge-triggered jump: releasing the key rearms it immediately.
                        if (!spacePressed) {
                            jumpKeyProcessed.current = false;
                        }
                    }

                    // --- Action: Pick up / Drop box ---
                    // Allow: KeyZ (legacy) OR (Down + Fire button)
                    // Determine fire key from comp_shoot (defaults to 'KeyX')
                    const shootCompForAction = entityA.template.components.find(c => c.definitionId === 'comp_shoot');
                    const shootPropsForAction = shootCompForAction ? getMergedComponentValues(entityA, 'comp_shoot') || {} : {} as any;
                    const fireKeyForAction = shootPropsForAction.fireKey || 'KeyX';
                    const downPressedForAction = pressedKeys.current.has('ArrowDown') || pressedKeys.current.has('s') || pressedKeys.current.has('S');
                    const firePressedForAction = pressedKeys.current.has(fireKeyForAction) || pressedKeys.current.has('x') || pressedKeys.current.has('X');
                    const actionPressed = (
                        pressedKeys.current.has('KeyZ') || pressedKeys.current.has('z') || pressedKeys.current.has('Z') ||
                        (downPressedForAction && firePressedForAction)
                    );
                    const isBoxEntity = (e: AnimatedEntity) => e.template.components?.some(c => c.definitionId === 'comp_box') || /box/i.test(e.template.name);

                    if (actionPressed && !actionKeyProcessed.current) {
                        if (!entityA.carriedBox) {
                            // Try to pick up a nearby box (expanded detection area)
                            const heroProps = entityCollisionProps(entityA);
                            const heroHitbox = heroProps ? getHitboxFor(entityA, heroProps) : { x: entityA.x, y: entityA.y, width: entityA.sprite.size.width, height: entityA.sprite.size.height };
                            const heroCenterX = heroHitbox.x + heroHitbox.width / 2;
                            const heroCenterY = heroHitbox.y + heroHitbox.height / 2;
                            const proximityPxHorizontal = TILE_SIZE * 2.5; // 20px horizontal (allows side pickup)
                            const proximityPxDown = TILE_SIZE * 3; // 24px down (can pick box underneath)
                            const proximityPxUp = TILE_SIZE; // 8px up

                            const candidate = entitiesRef.current.find(e => (
                                e !== entityA && isBoxEntity(e) && e !== heroRef.current?.carriedBox
                            ) && (() => {
                                const boxProps = entityCollisionProps(e);
                                const boxHitbox = boxProps ? getHitboxFor(e, boxProps) : { x: e.x, y: e.y, width: e.sprite.size.width, height: e.sprite.size.height };
                                const boxCenterX = boxHitbox.x + boxHitbox.width / 2;
                                const boxCenterY = boxHitbox.y + boxHitbox.height / 2;
                                const deltaX = Math.abs(boxCenterX - heroCenterX);
                                const deltaY = boxCenterY - heroCenterY; // positive if box is below hero

                                // Extended pickup zone: normal range horizontally, but larger range downward
                                const inRangeX = deltaX <= proximityPxHorizontal;
                                const inRangeY = (deltaY >= -proximityPxUp && deltaY <= proximityPxDown);
                                return inRangeX && inRangeY;
                            })());

                            if (candidate) {
                                entityA.carriedBox = candidate;
                                // Freeze box motion immediately
                                candidate.vx = 0; candidate.vy = 0;

                                // Register this box as picked up from its original screen
                                if (candidate.ownerScreenId) {
                                    const registryKey = `${candidate.ownerScreenId}_${candidate.instance.id}`;
                                    boxPickedUpRegistry.current.add(registryKey);
                                }

                                // Remove box from its current screen (it's now being carried)
                                candidate.ownerScreenId = null;

                                // Swap to carry-specific sprite if configured
                                switchToCarrySpriteIfConfigured(entityA);
                            }
                        } else {
                            // Drop currently carried box in front of the hero if space is free
                            const box = entityA.carriedBox;
                            if (box && screenMapToRender) {
                                const boxProps = entityCollisionProps(box);
                                const boxW = boxProps?.hitboxWidth || box.sprite.size.width;
                                const boxH = boxProps?.hitboxHeight || box.sprite.size.height;
                                const offX = boxProps?.offsetX || 0;
                                const offY = boxProps?.offsetY || 0;

                                // Use hero hitbox for accurate drop anchor
                                const heroPropsDrop = entityCollisionProps(entityA);
                                const heroHitboxDrop = heroPropsDrop
                                    ? getHitboxFor(entityA, heroPropsDrop)
                                    : { x: entityA.x, y: entityA.y, width: entityA.sprite.size.width, height: entityA.sprite.size.height };

                                const facingDefaultRight = entityA.sprite.facingDirection === 'right';
                                const facingDefaultLeft = entityA.sprite.facingDirection === 'left';
                                const facingLeft = (facingDefaultRight && entityA.isFacingMirrored) || (facingDefaultLeft && !entityA.isFacingMirrored);

                                // Desired hitbox top-left for the box (hx, hy)
                                let hx = heroHitboxDrop.x + heroHitboxDrop.width; // right side by default
                                if (facingLeft) {
                                    hx = heroHitboxDrop.x - boxW; // left side
                                }
                                const hy = heroHitboxDrop.y + heroHitboxDrop.height - boxH; // at hero's feet

                                // Convert desired hitbox position to sprite (visual) top-left
                                const dropX = hx - offX;
                                const dropY = hy - offY;
                                const clear = !(
                                    checkCollisionAt(hx, hy, screenMapToRender) ||
                                    checkCollisionAt(hx + boxW - 1, hy, screenMapToRender) ||
                                    checkCollisionAt(hx, hy + boxH - 1, screenMapToRender) ||
                                    checkCollisionAt(hx + boxW - 1, hy + boxH - 1, screenMapToRender)
                                );

                                if (clear) {
                                    box.x = dropX;
                                    box.y = dropY;
                                    // Apply impulse in facing direction and vertical
                                    const impulseH = 2;   // px/frame
                                    const impulseV = -2;  // upward kick
                                    box.vx = facingLeft ? -impulseH : impulseH;
                                    box.vy = impulseV;
                                    // Ensure physics re-engages after being carried
                                    box.isOnGround = false;
                                    box.platformUnderneath = null;
                                    // Assign box to current screen
                                    box.ownerScreenId = currentScreenMap?.id || null;
                                    entityA.carriedBox = null;
                                    restoreSpriteAfterCarry(entityA);
                                } else {
                                }
                            }
                        }
                        actionKeyProcessed.current = true;
                    }
                    if (!actionPressed) actionKeyProcessed.current = false;

                    // Shooting: if entity has comp_shoot and fire key pressed
                    const shootComp = entityA.template.components.find(c => c.definitionId === 'comp_shoot');
                    if (shootComp) {
                        const shootProps = getMergedComponentValues(entityA, 'comp_shoot') || {};
                        const fireKey = shootProps.fireKey || 'KeyX';
                        const firePressed = pressedKeys.current.has(fireKey) || pressedKeys.current.has('x') || pressedKeys.current.has('X');
                        const cooldownMs = Number(shootProps.cooldownMs || shootProps.fireRateMs || 250);
                        const nowTs = performance.now();
                        const canFire = !entityA.lastShotTime || (nowTs - entityA.lastShotTime >= cooldownMs);

                        // Ammo gating: si hasAmmo es explcitamente falso, bloquear disparo
                        const hasAmmo = !(shootProps.hasAmmo === false || shootProps.hasAmmo === 'false');

                        // Global Ammo variable gating
                        const ammoRaw = (gameGlobalVariablesRef.current as any)?.Ammo;
                        let allowByAmmoVar = true;
                        if (ammoRaw !== undefined) {
                            const ammoVal = Number(ammoRaw);
                            if (!Number.isNaN(ammoVal)) {
                                allowByAmmoVar = (ammoVal > 0) || (ammoVal < 0); // -1 => infinite
                            }
                        }

                        if (firePressed && canFire && hasAmmo && allowByAmmoVar) {
                            spawnProjectile(entityA);

                            // Decrementar Ammo si es finito (>= 0)
                            if (ammoRaw !== undefined) {
                                const currentAmmo = Number(ammoRaw);
                                if (!Number.isNaN(currentAmmo) && currentAmmo >= 0) {
                                    const newAmmo = Math.max(0, currentAmmo - 1);
                                    console.log(`[Ammo] ${currentAmmo} -> ${newAmmo} (SHOOT)`);
                                    updateGameGlobalVariables(prev => ({
                                        ...prev,
                                        Ammo: newAmmo
                                    }));

                                    // Si se queda sin municin, tambin desactivar hasAmmo
                                    if (newAmmo === 0) {
                                        if (!entityA.instance.componentOverrides) entityA.instance.componentOverrides = {} as any;
                                        if (!entityA.instance.componentOverrides['comp_shoot']) entityA.instance.componentOverrides['comp_shoot'] = {} as any;
                                        entityA.instance.componentOverrides['comp_shoot'].hasAmmo = false;
                                    }
                                }
                            }
                        }
                    }

                } // End of canProcessInput check
            }

            // Check if physics should be disabled (same states as input)
            const statesWithoutPhysics = ['Dead', 'GameOver', 'Stunned', 'Frozen'];
            const canProcessPhysics = !entityA.currentState || !statesWithoutPhysics.includes(entityA.currentState);

            if (canProcessPhysics) {
                const skipPhysics = heroRef.current?.carriedBox === entityA; // Skip physics for carried box
                // --- Gravity ---
                const gravityComp = entityA.template.components.find(c => c.definitionId === 'comp_gravity');
                const gravityOverride = entityA.instance.componentOverrides?.['comp_gravity'];
                const gravityEnabled = !!gravityComp || !!gravityOverride; // allow instance-level activation
                if (!skipPhysics && gravityEnabled && entityA.isOnLadder) {
                    entityA.gravityVel = 0;
                } else if (!skipPhysics && gravityEnabled && !entityA.isOnGround) {
                    // Z80-faithful 8.8 fixed-point gravity (matching update_gravity_component)
                    // Gravity accel: add 0x0040 (64) per frame = 0.25 px/frame²
                    // Terminal velocity: cap at 0x0400 (1024) = 4 px/frame downward
                    const GRAVITY_ACCEL = 0x40;   // matching Z80 `add a, #40`
                    const TERMINAL_VEL = 0x0400;  // matching Z80 `cp #04 / ld de, #0400`

                    // Add gravity acceleration (signed 16-bit arithmetic)
                    let gv = entityA.gravityVel;
                    // Convert to signed for arithmetic
                    if (gv >= 0x8000) gv = gv - 0x10000;
                    gv += GRAVITY_ACCEL;

                    // Terminal velocity cap (only when falling downward, i.e. positive velocity)
                    if (gv > 0 && gv > TERMINAL_VEL) {
                        gv = TERMINAL_VEL;
                    }

                    // Store back as unsigned 16-bit
                    entityA.gravityVel = gv & 0xFFFF;

                    // vel_y = high byte (integer part) of gravityVel, sign-extended
                    const hi = (entityA.gravityVel >> 8) & 0xFF;
                    entityA.vy = hi >= 0x80 ? hi - 0x100 : hi;
                } else if (!skipPhysics && gravityEnabled && entityA.isOnGround) {
                    // Z80: gravity_grounded resets gravity_vel to 0
                    entityA.gravityVel = 0;
                }

                // --- Wall Grab ---
                const wallGrabComp = entityA.template.components.find(c => c.definitionId === 'comp_wall_grab');
                if (!skipPhysics && wallGrabComp) {
                    const wallGrabProps = {
                        ...wallGrabComp.defaultValues,
                        ...(entityA.instance.componentOverrides?.['comp_wall_grab'] || {})
                    };
                    const wallGrabEnabled = wallGrabProps.isEnabled !== false && wallGrabProps.isEnabled !== 'false';
                    const grabPressed = pressedKeys.current.has('KeyN') || pressedKeys.current.has('n') || pressedKeys.current.has('N');
                    const onGroundNow = !!entityA.isOnGround;
                    const wallGrabFacing: FacingDirection | undefined =
                        entityA.isTouchingWallLeft ? 'left' :
                        entityA.isTouchingWallRight ? 'right' :
                        undefined;
                    const touchingWall = !!wallGrabFacing;
                    const grabFallSpeed = Math.max(0, Number(wallGrabProps.grabFallSpeed ?? 0) || 0);
                    const climbSpeed = Math.max(0, Number(wallGrabProps.climbSpeed ?? 1) || 0);
                    const grabDurationFrames = Math.max(0, Number(wallGrabProps.grabDurationFrames ?? 240) || 0);
                    if (onGroundNow) {
                        entityA.wallGrabLockout = false;
                        entityA.wallGrabTimerRemaining = undefined;
                    }
                    const canWallGrab = wallGrabEnabled && gravityEnabled && grabPressed && !onGroundNow && !entityA.isOnLadder && !entityA.wallGrabLockout;
                    const graceFrames = entityA.wallGrabReleaseGraceFrames ?? 0;
                    const wallGrabActiveNow = canWallGrab && (touchingWall || (entityA.isWallGrabbing && graceFrames > 0));

                    if (wallGrabActiveNow) {
                        let releaseAfterTimerExpired = false;
                        entityA.wallGrabReleaseGraceFrames = touchingWall ? 2 : Math.max(0, graceFrames - 1);
                        entityA.vx = 0;

                        if (!entityA.isWallGrabbing && entityA.wallGrabTimerRemaining === undefined) {
                            entityA.wallGrabTimerRemaining = grabDurationFrames;
                        }

                        const climbUpPressed = pressedKeys.current.has('ArrowUp');
                        const climbDownPressed = pressedKeys.current.has('ArrowDown');
                        const remainingFrames = Math.max(0, entityA.wallGrabTimerRemaining ?? grabDurationFrames);
                        let wallGrabVy = grabFallSpeed;
                        if (climbSpeed > 0 && (climbUpPressed || climbDownPressed)) {
                            wallGrabVy = climbUpPressed ? -climbSpeed : climbSpeed;
                        }
                        const nextTimer = Math.max(0, remainingFrames - 1);
                        entityA.wallGrabTimerRemaining = nextTimer;
                        releaseAfterTimerExpired = nextTimer <= 0;

                        entityA.vy = wallGrabVy;
                        entityA.gravityVel = ((wallGrabVy & 0xFF) << 8) & 0xFFFF;

                        const applyWallGrabFacing = (spriteData: Sprite) => {
                            if (!wallGrabFacing) return;
                            entityA.desiredFacingDirection = wallGrabFacing;
                            entityA.isFacingMirrored = computeMirrorForSprite(spriteData, wallGrabFacing);
                        };

                        if (!entityA.isWallGrabbing) {
                            entityA.isWallGrabbing = true;
                        }

                        const grabSpriteId = wallGrabProps.grabSpriteAssetId;
                        if (grabSpriteId) {
                            if (!entityA.wallGrabSpriteBackup) {
                                entityA.wallGrabSpriteBackup = {
                                    sprite: entityA.sprite,
                                    frameImages: entityA.frameImages,
                                    mirroredFrameImages: entityA.mirroredFrameImages,
                                    currentFrame: entityA.currentFrame,
                                    spriteAssetId: entityA.spriteAssetId,
                                    isFacingMirrored: entityA.isFacingMirrored
                                };
                            }
                            const grabSpriteAsset = allAssets.find(a =>
                                a.type === 'sprite' && (
                                    a.id === grabSpriteId ||
                                    a.name === grabSpriteId ||
                                    (a.data as any)?.id === grabSpriteId ||
                                    (a.data as any)?.name === grabSpriteId
                                )
                            );
                            const grabSpriteData = grabSpriteAsset?.data as Sprite | undefined;
                            const wasUsingGrabSprite = grabSpriteData && entityA.spriteAssetId === grabSpriteAsset.id;
                            const needsGrabSpriteRefresh = !!grabSpriteData && (
                                !wasUsingGrabSprite ||
                                entityA.sprite !== grabSpriteData ||
                                entityA.frameImages.length !== grabSpriteData.frames.length
                            );
                            if (grabSpriteData && needsGrabSpriteRefresh) {
                                const nextFrame = wasUsingGrabSprite
                                    ? Math.min(entityA.currentFrame, Math.max(0, grabSpriteData.frames.length - 1))
                                    : 0;
                                applySpriteToEntity(entityA, grabSpriteData, grabSpriteAsset.id);
                                entityA.currentFrame = nextFrame;
                            }
                            if (grabSpriteData) applyWallGrabFacing(grabSpriteData);
                        } else {
                            applyWallGrabFacing(entityA.sprite);
                        }

                        if (releaseAfterTimerExpired) {
                            entityA.wallGrabLockout = true;
                            entityA.isWallGrabbing = false;
                            entityA.wallGrabReleaseGraceFrames = 0;
                            entityA.wallGrabTimerRemaining = undefined;
                            if (entityA.wallGrabSpriteBackup) {
                                const backup = entityA.wallGrabSpriteBackup;
                                entityA.sprite = backup.sprite;
                                entityA.frameImages = backup.frameImages;
                                entityA.mirroredFrameImages = backup.mirroredFrameImages;
                                entityA.currentFrame = backup.currentFrame ?? 0;
                                entityA.spriteAssetId = backup.spriteAssetId;
                                entityA.isFacingMirrored = backup.isFacingMirrored;
                                entityA.lastFrameUpdateTime = performance.now();
                                entityA.wallGrabSpriteBackup = undefined;
                            }
                        }
                    } else if (entityA.isWallGrabbing) {
                        // Transition from grabbing to not grabbing
                        entityA.isWallGrabbing = false;
                        entityA.wallGrabReleaseGraceFrames = 0;
                        if (onGroundNow) {
                            entityA.wallGrabTimerRemaining = undefined;
                        }
                        if (entityA.wallGrabSpriteBackup) {
                            const backup = entityA.wallGrabSpriteBackup;
                            entityA.sprite = backup.sprite;
                            entityA.frameImages = backup.frameImages;
                            entityA.mirroredFrameImages = backup.mirroredFrameImages;
                            entityA.currentFrame = backup.currentFrame ?? 0;
                            entityA.spriteAssetId = backup.spriteAssetId;
                            entityA.isFacingMirrored = backup.isFacingMirrored;
                            entityA.lastFrameUpdateTime = performance.now();
                            entityA.wallGrabSpriteBackup = undefined;
                        }
                    }
                } else {
                    entityA.isWallGrabbing = false;
                    entityA.wallGrabReleaseGraceFrames = 0;
                    entityA.wallGrabTimerRemaining = undefined;
                    entityA.wallGrabLockout = false;
                }

                // --- Wall Jump / Wall Slide ---
                const wallJumpComp = entityA.template.components.find(c => c.definitionId === 'comp_wall_jump');
                if (!skipPhysics && wallJumpComp) {
                    const wallJumpProps = {
                        ...wallJumpComp.defaultValues,
                        ...(entityA.instance.componentOverrides?.['comp_wall_jump'] || {})
                    };
                    const wallJumpEnabled = wallJumpProps.isEnabled !== false && wallJumpProps.isEnabled !== 'false';
                    if (!entityA.wallJumpData) {
                        entityA.wallJumpData = { lockFramesRemaining: 0, lockedVx: 0 };
                    }

                    if (wallJumpEnabled) {
                        const onGroundNow = !!entityA.isOnGround;
                        const touchingLeft = !!entityA.isTouchingWallLeft;
                        const touchingRight = !!entityA.isTouchingWallRight;
                        const touchingWall = touchingLeft || touchingRight;
                        const slideFallSpeed = Math.max(0, Number(wallJumpProps.slideFallSpeed ?? 2) || 0);
                        const spacePressed = pressedKeys.current.has(' ');

                        if (onGroundNow || entityA.isOnLadder) {
                            entityA.wallJumpData.lockFramesRemaining = 0;
                            entityA.wallJumpData.lockedVx = 0;
                        } else if (entityA.wallJumpData.lockedVx !== 0) {
                            if (entityA.vy < 0) {
                                entityA.vx = entityA.wallJumpData.lockedVx;
                                if (entityA.wallJumpData.lockFramesRemaining > 0) {
                                    entityA.wallJumpData.lockFramesRemaining--;
                                }
                            } else {
                                entityA.wallJumpData.lockFramesRemaining = 0;
                                entityA.wallJumpData.lockedVx = 0;
                            }
                        }

                        if (gravityEnabled && !onGroundNow && !entityA.isOnLadder && touchingWall && slideFallSpeed > 0 && entityA.vy > slideFallSpeed) {
                            entityA.vy = slideFallSpeed;
                            entityA.gravityVel = (slideFallSpeed << 8) & 0xFFFF;
                        }

                        const canWallJump = gravityEnabled && !onGroundNow && !entityA.isOnLadder && touchingWall && spacePressed && !jumpKeyProcessed.current;
                        if (canWallJump) {
                            const leftPressed = pressedKeys.current.has('ArrowLeft') || pressedKeys.current.has('a') || pressedKeys.current.has('A');
                            const rightPressed = pressedKeys.current.has('ArrowRight') || pressedKeys.current.has('d') || pressedKeys.current.has('D');
                            const requireAway = wallJumpProps.requirePressAwayFromWall === true || wallJumpProps.requirePressAwayFromWall === 'true';
                            let jumpFromLeftWall = false;
                            let jumpFromRightWall = false;

                            if (requireAway) {
                                jumpFromLeftWall = touchingLeft && rightPressed;
                                jumpFromRightWall = touchingRight && leftPressed;
                            } else {
                                jumpFromLeftWall = touchingLeft && (!touchingRight || rightPressed || !leftPressed);
                                jumpFromRightWall = !jumpFromLeftWall && touchingRight;
                            }

                            if (jumpFromLeftWall || jumpFromRightWall) {
                                const horizontalPush = Math.max(1, Number(wallJumpProps.horizontalPush ?? 3) || 3);
                                const verticalMagnitude = Math.max(1, Number(wallJumpProps.verticalImpulse ?? 1024) || 1024);
                                const jumpImpulse = ((0x10000 - verticalMagnitude) & 0xFFFF) >>> 0;
                                const jumpVx = jumpFromLeftWall ? horizontalPush : -horizontalPush;
                                const lockFrames = Math.max(0, Number(wallJumpProps.lockFrames ?? 8) || 0);
                                const hi = (jumpImpulse >> 8) & 0xFF;

                                entityA.vx = jumpVx;
                                entityA.wallJumpData.lockedVx = jumpVx;
                                entityA.wallJumpData.lockFramesRemaining = lockFrames;
                                entityA.gravityVel = jumpImpulse;
                                entityA.vy = hi >= 0x80 ? hi - 0x100 : hi;
                                entityA.x += Math.sign(jumpVx);
                                entityA.isOnGround = false;
                                entityA.platformUnderneath = null;
                                jumpKeyProcessed.current = true;
                            }
                        }
                    }
                }

                // --- Friction (for boxes on ground) ---
                const isBoxEntity = entityA.template.components?.some(c => c.definitionId === 'comp_box') || /box/i.test(entityA.template.name);
                if (!skipPhysics && isBoxEntity && entityA.isOnGround) {
                    const frictionCoeff = 0.85; // Friction coefficient (lower = more friction, 1 = no friction)
                    entityA.vx *= frictionCoeff;
                    // Stop completely when velocity is very small (avoid infinite sliding)
                    if (Math.abs(entityA.vx) < 0.1) {
                        entityA.vx = 0;
                    }
                }

                // --- 2. Resolve collisions and apply the new position ---
                // Check if entity is multi-screen - if so, position is calculated from global coords in patrol logic
                // Merge defaultValues from template with componentOverrides
                const patrolTemplateComp2 = entityA.template.components.find(c => c.definitionId === 'comp_patrol');
                const patrolCompProps2 = {
                    ...(patrolTemplateComp2?.defaultValues || {}),
                    ...(entityA.instance.componentOverrides?.comp_patrol || {})
                };
                const isMultiScreenEntity =
                    (patrolCompProps2.multiScreen === true || patrolCompProps2.multiScreen === 'true') &&
                    entityA.globalX !== undefined && entityA.globalY !== undefined;
                const hasPatrolComponent = !!patrolTemplateComp2;

                // Multi-screen entities don't use tilemap collision - their position is controlled by global coordinates
                if (!skipPhysics && !isMultiScreenEntity) {
                    // Apply tilemap collision or standard position update for single-screen entities
                    if ((hasCollisionComp || isBoxEntity) && collisionCompDef && screenMapToRender) {
                        handleTilemapCollision(entityA, screenMapToRender, tileset, collisionCompDef);
                    } else {
                        entityA.x += entityA.vx;
                        entityA.y += entityA.vy;
                    }

                    // --- Screen border restrictions for non-multiscreen entities ---
                    if (entityA !== heroRef.current) {
                        const spriteWidth = entityA.sprite.size.width;
                        const spriteHeight = entityA.sprite.size.height;
                        if (entityA.x < 0) {
                            entityA.x = 0;
                            if (entityA.vx < 0) entityA.vx = 0;
                        } else if (entityA.x + spriteWidth > PREVIEW_WIDTH) {
                            entityA.x = PREVIEW_WIDTH - spriteWidth;
                            if (entityA.vx > 0) entityA.vx = 0;
                        }
                        // Allow platforms/patrolling entities to exit vertically (avoid getting stuck at top/bottom)
                        if (!hasPatrolComponent) {
                            if (entityA.y < 0) {
                                entityA.y = 0;
                                if (entityA.vy < 0) entityA.vy = 0;
                            } else if (entityA.y + spriteHeight > PREVIEW_HEIGHT) {
                                entityA.y = PREVIEW_HEIGHT - spriteHeight;
                                if (entityA.vy > 0) entityA.vy = 0;
                            }
                        }
                    }
                }
                // Multi-screen entities: position will be calculated from globalX/globalY in patrol logic below
            } else {
                // Physics disabled - freeze entity in place
                entityA.vx = 0;
                entityA.vy = 0;
            }

            updateDeadlyTileFlagForEntity(entityA, screenMapToRender ?? null);

            // --- 2b. Tile interaction (collect interactable tiles, matching Z80 step 8e) ---
            checkTileInteraction(entityA, screenMapToRender ?? null);

            // --- 3. Screen transition logic (hero only) ---
            if (entityA === heroRef.current && currentWorldMapGraph && currentScreenMap && canProcessPhysics) {
                // States that temporarily disable border exits (prevents respawn/despawn loops)
                const statesThatDisableScreenExit = ['Dead', 'Death', 'Respawn', 'Spawning', 'Hurt', 'Hit', 'GameOver', 'Invulnerable'];
                const isExitingDisabled = entityA.currentState && statesThatDisableScreenExit.some(state =>
                    entityA.currentState?.toLowerCase().includes(state.toLowerCase())
                );

                // Prevent immediate re-trigger right after a screen change
                const nowTs = (typeof performance !== 'undefined' ? performance.now() : Date.now());
                const recentlyTransitioned = (nowTs - lastScreenTransitionTimeRef.current) < 300;
                if (!isExitingDisabled && !recentlyTransitioned) {
                    const spriteWidth = entityA.sprite.size.width;
                    const spriteHeight = entityA.sprite.size.height;
                    let exitDirection: 'north' | 'south' | 'east' | 'west' | null = null;
                    const currentActiveBounds = getScreenActiveBoundsPx(currentScreenMap);

                    // Use platform velocity when riding to infer movement direction
                    const platformVx = entityA.platformUnderneath ? entityA.platformUnderneath.vx : 0;
                    const platformVy = entityA.platformUnderneath ? entityA.platformUnderneath.vy : 0;
                    const effectiveVx = (Math.abs(platformVx) > Math.abs(entityA.vx)) ? platformVx : entityA.vx;
                    const effectiveVy = (Math.abs(platformVy) > Math.abs(entityA.vy)) ? platformVy : entityA.vy;

                    const centerX = entityA.x + spriteWidth / 2;
                    const centerY = entityA.y + spriteHeight / 2;

                    if (centerX < currentActiveBounds.leftPx && (effectiveVx < 0)) exitDirection = 'west';
                    else if (centerX > currentActiveBounds.rightPx && (effectiveVx > 0)) exitDirection = 'east';
                    else if (centerY < currentActiveBounds.topPx && (effectiveVy < 0)) exitDirection = 'north';
                    else if (centerY > currentActiveBounds.bottomPx && (effectiveVy > 0)) exitDirection = 'south';

                    if (exitDirection) {
                        const currentScreenNode = currentWorldMapGraph.nodes.find(n => n.screenAssetId === currentScreenMap.id);
                        if (currentScreenNode) {
                            let connection = currentWorldMapGraph.connections.find(c => c.fromNodeId === currentScreenNode.id && c.fromDirection === exitDirection);
                            let targetNodeId = connection?.toNodeId;
                            if (!connection) {
                                connection = currentWorldMapGraph.connections.find(c => c.toNodeId === currentScreenNode.id && c.toDirection === exitDirection);
                                targetNodeId = connection?.fromNodeId;
                            }
                            if (targetNodeId) {
                                let newPlayerPos = { x: entityA.x, y: entityA.y };
                                const targetScreenNode = currentWorldMapGraph.nodes.find(n => n.id === targetNodeId);
                                const targetScreenAsset = targetScreenNode
                                    ? allAssets.find(a => a.id === targetScreenNode.screenAssetId && a.type === 'screenmap')
                                    : null;
                                const targetActiveBounds = getScreenActiveBoundsPx((targetScreenAsset?.data as ScreenMap | undefined) ?? null);

                                const entryMargin = 2;
                                switch (exitDirection) {
                                    case 'east': newPlayerPos.x = targetActiveBounds.leftPx + entryMargin; break;
                                    case 'west': newPlayerPos.x = Math.max(targetActiveBounds.leftPx + entryMargin, targetActiveBounds.rightPx - spriteWidth - entryMargin); break;
                                    case 'south': newPlayerPos.y = targetActiveBounds.topPx + entryMargin; break;
                                    case 'north': newPlayerPos.y = Math.max(targetActiveBounds.topPx + entryMargin, targetActiveBounds.bottomPx - spriteHeight - entryMargin); break;
                                }
                                setPlayerEntryPoint(newPlayerPos);
                                handleScreenTransition(targetNodeId);
                                return; // Stop processing this frame so the transition can run cleanly
                            }
                        }
                    }
                }
            }

            // --- 5. Entity collision logic ---
            // Store previous platform to detect when we fall off (declare outside if block)
            let previousPlatform: AnimatedEntity | null = null;

            if (hasCollisionComp) {
                // Clear platform reference at start of frame - will be re-established if still colliding
                if (entityA.platformUnderneath && !entitiesRef.current.includes(entityA.platformUnderneath)) {
                    entityA.platformUnderneath = null;
                }
                // Store previous platform to detect when we fall off
                previousPlatform = entityA.platformUnderneath;

                // SPECIAL CASE: For multi-screen platforms, verify if still on platform using global coords
                const isMultiScreenPlatform = entityA.platformUnderneath &&
                    entityA.platformUnderneath.globalX !== undefined &&
                    entityA.platformUnderneath.globalY !== undefined &&
                    entityA.globalX !== undefined &&
                    entityA.globalY !== undefined;

                if (isMultiScreenPlatform) {
                    // Verify if player is still on platform using global coordinates
                    const platform = entityA.platformUnderneath!;
                    const propsA = entityCollisionProps(entityA);
                    const propsB = entityCollisionProps(platform);

                    if (propsA && propsB) {
                        // Get hitboxes in global space
                        const playerGlobalHitbox = {
                            x: entityA.globalX! + (propsA.offsetX || 0),
                            y: entityA.globalY! + (propsA.offsetY || 0),
                            width: propsA.hitboxWidth || 16,
                            height: propsA.hitboxHeight || 16
                        };

                        const platformGlobalHitbox = {
                            x: platform.globalX! + (propsB.offsetX || 0),
                            y: platform.globalY! + (propsB.offsetY || 0),
                            width: propsB.hitboxWidth || 16,
                            height: propsB.hitboxHeight || 16
                        };

                        // Check if player is above platform (with some tolerance)
                        const isAbovePlatform = (playerGlobalHitbox.y + playerGlobalHitbox.height) <= (platformGlobalHitbox.y + 4);

                        // Check horizontal overlap with a dynamic tolerance based on platform speed
                        const tolerance = Math.abs(platform.vx) + 1; // +1 for rounding/sub-pixel errors
                        const horizontalOverlap =
                            (playerGlobalHitbox.x - tolerance) < (platformGlobalHitbox.x + platformGlobalHitbox.width) &&
                            (playerGlobalHitbox.x + playerGlobalHitbox.width + tolerance) > platformGlobalHitbox.x;

                        // Check if player is falling or stationary (not jumping)
                        const notJumping = entityA.vy >= -2; // Allow small upward velocity

                        const stillOnPlatform = isAbovePlatform && horizontalOverlap && notJumping;

                        if (stillOnPlatform) {
                        } else {
                            entityA.platformUnderneath = null;
                        }
                    } else {
                        // Can't verify, clear the link
                        entityA.platformUnderneath = null;
                    }
                } else {
                    // Not a multi-screen platform: verify if still on platform
                    // Check if player is jumping (vy < -2) - if so, clear immediately
                    const isJumping = entityA.vy < -2;
                    if (isJumping) {
                        entityA.platformUnderneath = null;
                    } else if (entityA.platformUnderneath) {
                        // Verify if player still has horizontal support under their feet
                        const platform = entityA.platformUnderneath;
                        const propsA = entityCollisionProps(entityA);
                        const propsB = entityCollisionProps(platform);

                        if (propsA && propsB) {
                            // Get hitboxes in local screen space
                            const playerHitbox = getHitboxFor(entityA, propsA);
                            const platformHitbox = getHitboxFor(platform, propsB);

                            // Check if player's feet are above platform's top (with small tolerance)
                            const playerBottom = playerHitbox.y + playerHitbox.height;
                            const platformTop = platformHitbox.y;
                            const isAbovePlatform = playerBottom <= (platformTop + 4); // 4px tolerance

                            // Check horizontal overlap (player's feet must be over the platform)
                            const horizontalOverlap =
                                playerHitbox.x < (platformHitbox.x + platformHitbox.width) &&
                                (playerHitbox.x + playerHitbox.width) > platformHitbox.x;

                            const stillOnPlatform = isAbovePlatform && horizontalOverlap;

                            if (!stillOnPlatform) {
                                entityA.platformUnderneath = null;
                                entityA.platformGraceFramesLeft = 0; // Clear grace frames too
                            }
                        } else {
                            // Can't verify, clear the link
                            entityA.platformUnderneath = null;
                        }
                    }
                }

                // Debug log para ver si entra al loop
                if (indexA === 0 && now % 1000 < 16) {
                }

                for (let indexB = indexA + 1; indexB < entitiesRef.current.length; indexB++) {
                    const entityB = entitiesRef.current[indexB];
                    // Skip collisions for carried box
                    if (heroRef.current?.carriedBox === entityA || heroRef.current?.carriedBox === entityB) {
                        continue;
                    }
                    // Skip already collected items to avoid double-processing
                    const isCollectedA = isCollectibleEntity(entityA) && (entityA as any).__collectedOnce;
                    const isCollectedB = isCollectibleEntity(entityB) && (entityB as any).__collectedOnce;
                    if (isCollectedA || isCollectedB) continue;
                    const entityBHasCollision = entityB.template.components.some(c => c.definitionId === 'comp_collision');

                    if (indexA === 0 && now % 1000 < 16) {
                    }

                    if (!entityBHasCollision) continue;
                    const propsA = entityCollisionProps(entityA);
                    const propsB = entityCollisionProps(entityB);
                    if (!propsA || !propsB) continue;
                    const hitboxA = getHitboxFor(entityA, propsA);
                    const hitboxB = getHitboxFor(entityB, propsB);

                    // Check AABB collision
                    if (hitboxA.x < hitboxB.x + hitboxB.width &&
                        hitboxA.x + hitboxA.width > hitboxB.x &&
                        hitboxA.y < hitboxB.y + hitboxB.height &&
                        hitboxA.y + hitboxA.height > hitboxB.y) {

                        const layerA = Number(propsA.collisionLayer) || 0;
                        const collidesWithA = Number(propsA.collidesWith) || 0;
                        const layerB = Number(propsB.collisionLayer) || 0;
                        const collidesWithB = Number(propsB.collidesWith) || 0;

                        // PROTECTION: Ignore collisions in the first 200ms after spawn
                        const SPAWN_GRACE_PERIOD_MS = 200;
                        const entityAAge = now - entityA.spawnTime;
                        const entityBAge = now - entityB.spawnTime;

                        if (entityAAge < SPAWN_GRACE_PERIOD_MS || entityBAge < SPAWN_GRACE_PERIOD_MS) {
                            continue; // Skip this collision pair
                        }


                        // Check if layers allow collision
                        const aCanCollideWithB = (collidesWithA & layerB) !== 0;
                        const bCanCollideWithA = (collidesWithB & layerA) !== 0;


                        if (aCanCollideWithB && bCanCollideWithA) {
                            // Check if either entity is a trigger
                            const isATrigger = propsA.isTrigger;
                            const isBTrigger = propsB.isTrigger;

                            if (isATrigger || isBTrigger) {
                                // TRIGGER COLLISION: No physical separation, only event detection

                                // Helper function: Determine collision event type based on entity layer and components
                                const getCollisionEventType = (entity: typeof entityA | typeof entityB, entityLayer: number): string => {
                                    // Check if entity is collectible
                                    if (isCollectibleEntity(entity)) return 'collision_item';

                                    // Check layer 8 (bit 3) for platforms/walls - MUST check before enemy detection
                                    if ((entityLayer & 8) !== 0) return 'collision_wall';

                                    // Check if entity has comp_damage or comp_ai_behavior (enemy)
                                    const hasAI = entity.template.components.some(c => c.definitionId === 'comp_ai_behavior');
                                    const hasDamage = entity.template.components.some(c => c.definitionId === 'comp_damage');
                                    if (hasAI || hasDamage) return 'collision_enemy';

                                    // Fallback to template name detection for wall/obstacle/platform
                                    const templateName = entity.template.name.toLowerCase();
                                    if (templateName.includes('wall') || templateName.includes('obstacle') || templateName.includes('platform')) {
                                        return 'collision_wall';
                                    }

                                    return 'collision_wall'; // Default changed from 'collision_enemy' to 'collision_wall' (safer)
                                };

                                // Check if entities are in invulnerable states (Dead, Hurt, etc.)
                                const invulnerableStates = ['Dead', 'Death', 'Hurt', 'Hit', 'Damage', 'Respawn', 'Spawning', 'Invulnerable'];
                                const isAInvulnerable = entityA.currentState && invulnerableStates.some(state =>
                                    entityA.currentState?.toLowerCase().includes(state.toLowerCase())
                                );
                                const isBInvulnerable = entityB.currentState && invulnerableStates.some(state =>
                                    entityB.currentState?.toLowerCase().includes(state.toLowerCase())
                                );

                                // Only trigger collision events if not invulnerable
                            if (!isAInvulnerable) {
                                const eventNameA = getCollisionEventType(entityB, layerB); // What A collided with
                                // Guard: avoid double-processing the same collectible in the same frame
                                if (eventNameA === 'collision_item' && isCollectibleEntity(entityB)) {
                                    const key = entityB.instance.id;
                                    if (collisionItemFrameGuardRef.current.has(key)) {
                                        continue;
                                    }
                                    collisionItemFrameGuardRef.current.add(key);
                                }
                                triggerEvent(entityA.instance.id, 'collision_entity');
                                triggerEvent(entityA.instance.id, eventNameA);
                                // Store reference to the other entity for DESTROY_ENTITY action
                                (entityA as any).lastCollidedEntity = entityB;
                                if (eventNameA === 'collision_item' && isCollectibleEntity(entityB)) {
                                    (entityB as any).__collectedOnce = true;
                                }
                            }
                            if (!isBInvulnerable) {
                                const eventNameB = getCollisionEventType(entityA, layerA); // What B collided with
                                // Guard: avoid double-processing the same collectible in the same frame
                                if (eventNameB === 'collision_item' && isCollectibleEntity(entityA)) {
                                    const key = entityA.instance.id;
                                    if (collisionItemFrameGuardRef.current.has(key)) {
                                        continue;
                                    }
                                    collisionItemFrameGuardRef.current.add(key);
                                }
                                triggerEvent(entityB.instance.id, 'collision_entity');
                                triggerEvent(entityB.instance.id, eventNameB);
                                // Store reference to the other entity for DESTROY_ENTITY action
                                (entityB as any).lastCollidedEntity = entityA;
                                if (eventNameB === 'collision_item' && isCollectibleEntity(entityA)) {
                                    (entityA as any).__collectedOnce = true;
                                }
                            }
                        } else {
                                // SOLID COLLISION: Apply physical separation
                                resolveEntityCollision(entityA, entityB, propsA, propsB);

                                // Helper function: Determine collision event type based on entity layer and components
                                const getCollisionEventType = (entity: typeof entityA | typeof entityB, entityLayer: number): string => {
                                    // Check if entity is collectible
                                    if (isCollectibleEntity(entity)) return 'collision_item';

                                    // Check layer 8 (bit 3) for platforms/walls - MUST check before enemy detection
                                    if ((entityLayer & 8) !== 0) return 'collision_wall';

                                    // Check if entity has comp_damage or comp_ai_behavior (enemy)
                                    const hasAI = entity.template.components.some(c => c.definitionId === 'comp_ai_behavior');
                                    const hasDamage = entity.template.components.some(c => c.definitionId === 'comp_damage');
                                    if (hasAI || hasDamage) return 'collision_enemy';

                                    // Fallback to template name detection for wall/obstacle/platform
                                    const templateName = entity.template.name.toLowerCase();
                                    if (templateName.includes('wall') || templateName.includes('obstacle') || templateName.includes('platform')) {
                                        return 'collision_wall';
                                    }

                                    return 'collision_wall'; // Default changed from 'collision_enemy' to 'collision_wall' (safer)
                                };

                                // Check if entities are in invulnerable states (Dead, Hurt, etc.)
                                const invulnerableStates = ['Dead', 'Death', 'Hurt', 'Hit', 'Damage', 'Respawn', 'Spawning', 'Invulnerable'];
                                const isAInvulnerable = entityA.currentState && invulnerableStates.some(state =>
                                    entityA.currentState?.toLowerCase().includes(state.toLowerCase())
                                );
                                const isBInvulnerable = entityB.currentState && invulnerableStates.some(state =>
                                    entityB.currentState?.toLowerCase().includes(state.toLowerCase())
                                );

                                // Only trigger collision events if not invulnerable
                                if (!isAInvulnerable) {
                                    const eventNameA = getCollisionEventType(entityB, layerB); // What A collided with
                                    triggerEvent(entityA.instance.id, 'collision_entity');
                                    triggerEvent(entityA.instance.id, eventNameA);
                                    // Store reference to the other entity for DESTROY_ENTITY action
                                    (entityA as any).lastCollidedEntity = entityB;
                                }
                                if (!isBInvulnerable) {
                                    const eventNameB = getCollisionEventType(entityA, layerA); // What B collided with
                                    triggerEvent(entityB.instance.id, 'collision_entity');
                                    triggerEvent(entityB.instance.id, eventNameB);
                                    // Store reference to the other entity for DESTROY_ENTITY action
                                    (entityB as any).lastCollidedEntity = entityA;
                                }
                            }
                        } else {
                        }
                    }
                }
            }

            // --- 6. Patrol logic ---
            // Only process patrol AI if physics is enabled
            if (canProcessPhysics) {
                // Merge patrol component defaultValues with componentOverrides
                const patrolTemplateComp3 = entityA.template.components.find(c => c.definitionId === 'comp_patrol');
                const patrolComp = {
                    ...(patrolTemplateComp3?.defaultValues || {}),
                    ...(entityA.instance.componentOverrides?.comp_patrol || {})
                };
                if (patrolComp?.waypoint1_x !== undefined && patrolComp?.waypoint1_y !== undefined) {
                    const isMultiScreen = patrolComp.multiScreen === true || patrolComp.multiScreen === 'true';

                    if (isMultiScreen && entityA.globalX !== undefined && entityA.globalY !== undefined && entityA.originScreenId) {
                        // Multi-screen patrol: work with global coordinates
                        const originScreenPos = screenWorldMapRef.current.get(entityA.originScreenId);
                        if (originScreenPos) {
                            // Update global coordinates
                            const oldGlobalX = entityA.globalX;
                            const oldGlobalY = entityA.globalY;
                            entityA.globalX += entityA.vx;
                            entityA.globalY += entityA.vy;

                            // Debug log for coordinate updates
                            if (now % 500 < 16) { // Log every ~500ms
                            }

                            // Debug: log when crossing screen boundaries
                            if ((entityA.x < -50 || entityA.x > PREVIEW_WIDTH + 50) && now % 500 < 16) {
                            }

                            // Waypoints are in local coordinates relative to origin screen
                            const globalWaypoint1X = originScreenPos.globalX + Number(patrolComp.waypoint1_x);
                            const globalWaypoint1Y = originScreenPos.globalY + Number(patrolComp.waypoint1_y);
                            const globalWaypoint2X = originScreenPos.globalX + Number(patrolComp.waypoint2_x ?? patrolComp.waypoint1_x);
                            const globalWaypoint2Y = originScreenPos.globalY + Number(patrolComp.waypoint2_y ?? patrolComp.waypoint1_y);

                            // Bounce logic in global space
                            if ((entityA.vx > 0 && entityA.globalX >= Math.max(globalWaypoint1X, globalWaypoint2X)) ||
                                (entityA.vx < 0 && entityA.globalX <= Math.min(globalWaypoint1X, globalWaypoint2X))) {
                                entityA.vx = -entityA.vx;
                            }
                            if ((entityA.vy > 0 && entityA.globalY >= Math.max(globalWaypoint1Y, globalWaypoint2Y)) ||
                                (entityA.vy < 0 && entityA.globalY <= Math.min(globalWaypoint1Y, globalWaypoint2Y))) {
                                entityA.vy = -entityA.vy;
                            }

                            // Convert global coordinates back to local for current screen
                            const localCoord = globalToLocal(
                                { x: entityA.globalX, y: entityA.globalY },
                                screenWorldMapRef.current
                            );

                            if (localCoord && localCoord.screenId === currentScreenMap.id) {
                                // Entity is in current screen
                                entityA.x = localCoord.x;
                                entityA.y = localCoord.y;
                            } else {
                                // Entity is in another screen - position it off-screen
                                entityA.x = -1000;
                                entityA.y = -1000;
                            }
                        }
                    } else if (isMultiScreen) {
                        // Multi-screen patrol but global coords not initialized properly
                    } else if (!isMultiScreen) {
                        // Traditional single-screen patrol
                        const startPixelX = patrolComp.waypoint1_x;
                        const startPixelY = patrolComp.waypoint1_y;
                        const endPixelX = patrolComp.waypoint2_x ?? startPixelX;
                        const endPixelY = patrolComp.waypoint2_y ?? startPixelY;

                        if ((entityA.vx > 0 && entityA.x >= Math.max(startPixelX, endPixelX)) ||
                            (entityA.vx < 0 && entityA.x <= Math.min(startPixelX, endPixelX))) {
                            entityA.vx = -entityA.vx;
                        }
                        if ((entityA.vy > 0 && entityA.y >= Math.max(startPixelY, endPixelY)) ||
                            (entityA.vy < 0 && entityA.y <= Math.min(startPixelY, endPixelY))) {
                            entityA.vy = -entityA.vy;
                        }
                    }
                }
            }

            // --- 6.5. Update isOnGround after entity collisions to include platform riding ---
            if (hasCollisionComp) {
                // If we're on a platform (platformUnderneath was set during collisions), we're on ground
                // Also honor a short grace period to smooth descending platforms
                const hasPlatformGrace = (entityA.platformGraceFramesLeft || 0) > 0;
                // Only follow movement of a platform when actually standing on it; grace only affects grounded flag
                const platformToFollow = entityA.platformUnderneath;
                if (platformToFollow) {
                    entityA.isOnGround = true;

                    // Transfer platform velocity if standing on a moving platform
                    if (entityA === heroRef.current) {
                        // Establish parent-child link for multi-screen platforms
                        // Merge patrol component defaultValues with componentOverrides
                        const platformPatrolTemplateComp = platformToFollow.template.components.find(c => c.definitionId === 'comp_patrol');
                        const platformPatrolComp = {
                            ...(platformPatrolTemplateComp?.defaultValues || {}),
                            ...(platformToFollow.instance.componentOverrides?.comp_patrol || {})
                        };
                        const isMultiScreenPlatform = platformPatrolComp && (platformPatrolComp.multiScreen === true || platformPatrolComp.multiScreen === 'true');

                        if (isMultiScreenPlatform) {
                            // Link player to platform
                            entityA.parentEntityId = platformToFollow.instance.id;

                            // Sync global coordinates if platform has them
                            if (platformToFollow.globalX !== undefined && platformToFollow.globalY !== undefined) {
                                // Initialize player's global coordinates if not set
                                if (entityA.globalX === undefined || entityA.globalY === undefined) {
                                    const currentScreenPos = screenWorldMapRef.current.get(currentScreenMap.id);
                                    if (currentScreenPos) {
                                        entityA.globalX = currentScreenPos.globalX + entityA.x;
                                        entityA.globalY = currentScreenPos.globalY + entityA.y;
                                        entityA.originScreenId = currentScreenMap.id;
                                    }
                                }

                                // Transfer platform velocity in global space
                                if (entityA.globalX !== undefined && entityA.globalY !== undefined) {
                                    const oldGlobalX = entityA.globalX;
                                    const oldGlobalY = entityA.globalY;

                                    // Add player's own velocity for this frame.
                                    // vx/vy might have been zeroed by tile collision, which is correct.
                                    entityA.globalX += entityA.vx;
                                    entityA.globalY += entityA.vy;

                                    // Add platform's velocity (both X and Y)
                                    entityA.globalX += platformToFollow.vx;
                                    entityA.globalY += platformToFollow.vy;

                                    // (Reverted) Do not enforce attach offset vertically here


                                    // Convert back to local coordinates for rendering
                                    const localCoord = globalToLocal(
                                        { x: entityA.globalX, y: entityA.globalY },
                                        screenWorldMapRef.current
                                    );

                                    if (localCoord) {

                                        entityA.x = localCoord.x;
                                        entityA.y = localCoord.y;

                                        // Check if player moved to a different screen
                                        if (localCoord.screenId !== currentScreenMap.id) {
                                            // Debounce platform-driven transitions to avoid oscillation at borders
                                            const nowTs = (typeof performance !== 'undefined' ? performance.now() : Date.now());
                                            const recentlyTransitioned = (nowTs - lastScreenTransitionTimeRef.current) < 300;
                                            if (!recentlyTransitioned) {
                                                // Trigger screen transition
                                                const targetScreenNode = currentWorldMapGraph?.nodes.find(n => n.screenAssetId === localCoord.screenId);
                                                if (targetScreenNode) {
                                                    const targetScreenAsset = allAssets.find(a => a.id === targetScreenNode.screenAssetId && a.type === 'screenmap');
                                                    const targetActiveBounds = getScreenActiveBoundsPx((targetScreenAsset?.data as ScreenMap | undefined) ?? null);
                                                    const spriteW = entityA.sprite.size.width;
                                                    const spriteH = entityA.sprite.size.height;
                                                    const margin = 2;
                                                    const entryX = Math.max(targetActiveBounds.leftPx + margin, Math.min(targetActiveBounds.rightPx - spriteW - margin, localCoord.x));
                                                    const entryY = Math.max(targetActiveBounds.topPx + margin, Math.min(targetActiveBounds.bottomPx - spriteH - margin, localCoord.y));
                                                    setPlayerEntryPoint({ x: entryX, y: entryY });

                                                    // Mark transition timestamp
                                                    try { lastScreenTransitionTimeRef.current = (typeof performance !== 'undefined' ? performance.now() : Date.now()); } catch { lastScreenTransitionTimeRef.current = Date.now(); }

                                                    handleScreenTransition(targetScreenNode.id);
                                                    return; // Stop processing this frame to allow transition
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        } else {
                            // Traditional single-screen platform
                            entityA.x += platformToFollow.vx;
                            entityA.y += platformToFollow.vy;

                            // Snap player to platform top to avoid drift/jitter after jumps/landings
                            const propsA = entityCollisionProps(entityA);
                            const propsP = entityCollisionProps(platformToFollow);
                            if (propsA && propsP) {
                                const platformTop = platformToFollow.y + (propsP.offsetY || 0);
                                const playerBottom = entityA.y + (propsA.offsetY || 0) + (propsA.hitboxHeight || entityA.sprite.size.height);
                                const delta = platformTop - playerBottom;
                                // When riding and not moving upwards, enforce alignment with platform top
                                if (entityA.vy >= 0) {
                                    entityA.y += delta;
                                    entityA.vy = 0;
                                }
                            }
                        }

                    }
                } else {
                    // Not on a platform - clear parent link and stale global coords
                    if (entityA === heroRef.current) {
                        if (entityA.parentEntityId) {
                            entityA.parentEntityId = null;
                        }
                        if (entityA.globalX !== undefined || entityA.globalY !== undefined) {
                            entityA.globalX = undefined;
                            entityA.globalY = undefined;
                        }
                    }
                }

                // Detect falling off platform
                if (previousPlatform && !entityA.platformUnderneath) {
                }
            }

            // --- 7. Sprite animation ---
            const animComp = entityA.template.components.find(c => c.definitionId === 'comp_animation');
            if (animComp && entityA.frameImages.length > 1) {
                const spriteAnimMs = (entityA.sprite && typeof entityA.sprite.animationSpeedMs === 'number') ? entityA.sprite.animationSpeedMs! : ANIMATION_SPEED_MS;
                if (now - entityA.lastFrameUpdateTime > spriteAnimMs) {
                    // Check if animation should only play when moving
                    const animateOnlyWhenMoving = animComp.defaultValues?.animateOnlyWhenMoving === true;
                    const isMoving = entityA.vx !== 0 || entityA.vy !== 0;

                    // Priority states that should always animate (death, hurt, attack, etc.)
                    const priorityStates = ['Dead', 'Death', 'Hurt', 'Hit', 'Damage', 'Attack', 'Attacking', 'Stunned', 'GameOver', 'Invulnerable', 'Landing'];
                    const isWallGrabAnimation = entityA.isWallGrabbing === true && !!entityA.wallGrabSpriteBackup;
                    const isInPriorityState = isWallGrabAnimation || (entityA.currentState ? priorityStates.some(state =>
                        entityA.currentState.toLowerCase().includes(state.toLowerCase())
                    ) : false);

                    // Check if animation loops (from sprite metadata, fallback to component)
                    const loops = entityA.sprite.loops !== undefined
                        ? entityA.sprite.loops
                        : (animComp.defaultValues?.loops !== false); // Default true

                    // Reset completion flag if state changed
                    if (entityA.lastAnimationState !== entityA.currentState) {
                        entityA.animationHasCompleted = false;
                        entityA.lastAnimationState = entityA.currentState;
                    }

                    // Animate if: not restricted to movement, OR is moving, OR in priority state
                    // AND (animation hasn't completed OR animation loops)
                    if ((!animateOnlyWhenMoving || isMoving || isInPriorityState) && (!entityA.animationHasCompleted || loops)) {
                        const previousFrame = entityA.currentFrame;

                        if (loops) {
                            // Looping animation: cycle through frames
                            entityA.currentFrame = (entityA.currentFrame + 1) % entityA.frameImages.length;
                        } else {
                            // Non-looping animation: stop at last frame
                            if (entityA.currentFrame < entityA.frameImages.length - 1) {
                                entityA.currentFrame++;
                            } else {
                                // Animation completed!
                                if (!entityA.animationHasCompleted) {
                                    entityA.animationHasCompleted = true;
                                }
                            }
                        }

                        entityA.lastFrameUpdateTime = now;
                    } else if (!isInPriorityState) {
                        // Reset to first frame when stopped (and not in priority state)
                        entityA.currentFrame = 0;
                    }
                }

            }

            if (childLinkConfig) {
                if (childLinkParent) {
                    applyChildLinkTransform(entityA, childLinkParent, childLinkConfig);
                } else if (childLinkConfig.followParentGlobal) {
                    entityA.globalX = undefined;
                    entityA.globalY = undefined;
                }
            }

            // --- Transport carried box along with hero ---
            if (entityA === heroRef.current && entityA.carriedBox) {
                const box = entityA.carriedBox;
                // Carry overhead: align visually using sprite bounds (ignores hitbox offsets while carried)
                // Read carry offset from comp_carry (template defaultValues + instance overrides)
                const carryTemplateComp = entityA.template.components.find(c => c.definitionId === 'comp_carry');
                const carryProps = {
                    ...(carryTemplateComp?.defaultValues || {}),
                    ...(entityA.instance.componentOverrides?.comp_carry || {})
                } as any;
                const overheadGap = Number(carryProps.offset ?? 0);

                // Visual center/top based on HERO HITBOX for better alignment
                const heroPropsCarry = entityCollisionProps(entityA);
                const heroHitboxCarry = heroPropsCarry
                    ? getHitboxFor(entityA, heroPropsCarry)
                    : { x: entityA.x, y: entityA.y, width: entityA.sprite.size.width, height: entityA.sprite.size.height };
                const heroCenterX = heroHitboxCarry.x + (heroHitboxCarry.width / 2);
                const boxWVis = box.sprite.size.width;
                const boxHVis = box.sprite.size.height;

                box.x = Math.round(heroCenterX - (boxWVis / 2));
                box.y = Math.round(heroHitboxCarry.y - overheadGap - boxHVis);

                // Freeze box while carried
                box.vx = 0;
                box.vy = 0;
            }

            // --- 8. Dibujar Entidad ---
            // Filter Box entities: only render if they belong to current screen or are being carried
            const shouldRenderBox = !isBoxEntity ||
                entityA.ownerScreenId === null || // Being carried
                entityA.ownerScreenId === currentScreenMapRef.current?.id || // Belongs to current screen
                isChildOfVisibleParent;

            if (!shouldRenderBox) {
                return; // Skip rendering this Box (it belongs to another screen)
            }

            // Filter Collectible items: only render if they belong to current screen
            const shouldRenderCollectible = !isCollectibleItem ||
                entityA.ownerScreenId === currentScreenMapRef.current?.id ||
                isChildOfVisibleParent;

            if (!shouldRenderCollectible) {
                return; // Skip rendering this item (it belongs to another screen)
            }

            // Safety check: ensure frameImages array has elements and currentFrame is valid
            if (entityA.frameImages.length > 0) {
                // Ensure currentFrame is within bounds
                if (entityA.currentFrame >= entityA.frameImages.length) {
                    entityA.currentFrame = 0;
                }

                // Determine which image to draw based on movement direction
                let shouldUseMirrored = false;

                if (entityA.mirroredFrameImages && entityA.mirroredFrameImages.length > entityA.currentFrame) {
                    // Check if currently moving
                    if (entityA.vx !== 0) {
                        // Moving: determine direction and update facing state
                        if (entityA.sprite.facingDirection === 'right' && entityA.vx < 0) {
                            shouldUseMirrored = true;
                            entityA.isFacingMirrored = true; // Remember: facing left
                        } else if (entityA.sprite.facingDirection === 'left' && entityA.vx > 0) {
                            shouldUseMirrored = true;
                            entityA.isFacingMirrored = true; // Remember: facing right
                        } else {
                            entityA.isFacingMirrored = false; // Remember: facing default direction
                        }
                    } else {
                        // Not moving: use last known direction
                        shouldUseMirrored = entityA.isFacingMirrored === true;
                    }
                }

                let imageToDraw = shouldUseMirrored ? entityA.mirroredFrameImages![entityA.currentFrame] : entityA.frameImages[entityA.currentFrame];
                // Asegurarse de que la imagen estA cargada antes de dibujar es crucial para el rendimiento
                if (!skipSpriteDrawThisFrame && imageToDraw && imageToDraw.complete && imageToDraw.naturalWidth > 0) {
                    if (heroRef.current?.carriedBox !== entityA) { ctx.drawImage(imageToDraw, entityA.x, entityA.y); }
                } else if (imageToDraw) {
                    // Opcional: manejar imagen no cargada (e.g., dibujar placeholder)
                    // console.warn("Imagen no cargada aAon:", entityA.instance.name);
                }
            }
            // If frameImages is empty, simply skip drawing but continue processing

            // Draw carried box after hero to ensure it appears on top
            if (entityA === heroRef.current && entityA.carriedBox) {
                const box = entityA.carriedBox;
                if (box.frameImages.length > 0) {
                    const img = box.frameImages[box.currentFrame] || box.frameImages[0];
                    if (!skipSpriteDrawThisFrame && img && img.complete && img.naturalWidth > 0) {
                        ctx.drawImage(img, box.x, box.y);
                    }
                }
            }

            // --- 9. DEBUG: Dibujar Hitboxes (si tiene comp_collision) ---
            if (showHitboxDebug && hasCollisionComp && heroRef.current?.carriedBox !== entityA) {
                const props = entityCollisionProps(entityA);
                if (props) {
                    const hitbox = getHitboxFor(entityA, props);

                    // Detailed debug log
                    if (now % 1000 < 16) {
                    }

                    // Color based on collision type
                    if (props.isTrigger) {
                        ctx.strokeStyle = '#FFAA00'; // Orange for triggers (no push)
                        ctx.setLineDash([4, 2]); // Dotted line for triggers
                    } else {
                        ctx.strokeStyle = '#00FF00'; // Green for solid collisions (with push)
                        ctx.setLineDash([]); // Solid line
                    }
                    ctx.lineWidth = 2;
                    ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
                    ctx.setLineDash([]); // Reset dash

                    // Draw the center point
                    ctx.fillStyle = props.isTrigger ? '#FFAA00' : '#00FF00';
                    ctx.fillRect(hitbox.x + hitbox.width / 2 - 2, hitbox.y + hitbox.height / 2 - 2, 4, 4);

                    // Draw the entity name
                    ctx.fillStyle = '#FFFF00';
                    ctx.font = '8px monospace';
                    const label = `${entityA.instance.name} L${props.collisionLayer}${props.isTrigger ? ' [T]' : ''}`;
                    ctx.fillText(label, hitbox.x, hitbox.y - 2);
                } else {
                    if (now % 1000 < 16) {
                    }
                }
            } else if (showHitboxDebug) {
                if (now % 1000 < 16) {
                }
            }
        });

        const activeScreenId = currentScreenMapRef.current?.id || null;
        entitiesRef.current.forEach(entity => {
            if (entity.screenAssetId && activeScreenId && entity.screenAssetId !== activeScreenId) return;

            const gateProps = getMergedComponentValues(entity, 'comp_retractable_gate');
            if (!gateProps) return;

            const width = Math.max(1, Number(gateProps.width ?? 1) || 1);
            const height = Math.max(1, Number(gateProps.height ?? 1) || 1);
            const direction = String(gateProps.direction || 'up').toLowerCase() as 'up' | 'down' | 'left' | 'right';
            const totalSteps = Math.max(1, direction === 'left' || direction === 'right' ? width : height);
            const currentStep = entity.retractableGateCurrentStep ?? 0;
            if (currentStep >= totalSteps) return;

            if (!evaluateRetractableGateTrigger(gateProps)) return;

            const durationMs = Math.max(1, Number(gateProps.durationMs ?? 2000) || 2000);
            const stepDelayMs = Math.max(1, Math.ceil(durationMs / Math.max(1, totalSteps - 1)));

            if (entity.retractableGateCurrentStep === undefined || entity.retractableGateCurrentStep === 0) {
                shiftTileAreaInLayer(
                    Math.trunc(Number(gateProps.screenX ?? 0)),
                    Math.trunc(Number(gateProps.screenY ?? 0)),
                    width,
                    height,
                    direction,
                    1,
                    gateProps.fillTileId || null
                );
                entity.retractableGateCurrentStep = 1;
                entity.retractableGateNextStepAt = now + stepDelayMs;
                return;
            }

            const nextStepAt = entity.retractableGateNextStepAt ?? (now + stepDelayMs);
            if (now < nextStepAt) return;

            shiftTileAreaInLayer(
                Math.trunc(Number(gateProps.screenX ?? 0)),
                Math.trunc(Number(gateProps.screenY ?? 0)),
                width,
                height,
                direction,
                1,
                gateProps.fillTileId || null
            );
            entity.retractableGateCurrentStep = currentStep + 1;
            entity.retractableGateNextStepAt = now + stepDelayMs;
        });

        // HUD overlay (pre-rendered to avoid per-frame text building)
        if (hudBufferRef.current) {
            ctx.drawImage(hudBufferRef.current, 0, 0);
        }
        drawAutoDialoguePreview(ctx);
        autoEventSpaceWasDownRef.current = pressedKeys.current.has(' ');

        // --- Remove destroyed entities ---
        entitiesRef.current = entitiesRef.current.filter(e => !e.markedForDestruction);

        refreshVisibleEntityCount(currentScreenMapRef.current?.id);

        if (gameFlowExitRequestedRef.current && currentNode.type === 'WorldLink') {
            gameFlowExitRequestedRef.current = false;
            const targetNodeId = resolveDefaultGameFlowExitNode(currentNode.id);
            if (targetNodeId) {
                setNavigationStack(prev => [...prev, currentNode.id]);
                setCurrentNodeId(targetNodeId);
                setSelectedOptionIndex(0);
                setCurrentScreenMap(null);
                setCurrentWorldMapGraph(null);
                return;
            }
        }

        // --- Check for pending node transitions (from CHANGE_GAME_FLOW_NODE action) ---
        const targetNodeId = pendingNodeTransitionRef.current;
        if (targetNodeId) {
            pendingNodeTransitionRef.current = null;
            // Handle different transition types
            if (currentNode.type === 'WorldLink') {
                // World map transition
                handleScreenTransition(targetNodeId);
            } else {
                // Game flow transition
                setNavigationStack(prev => [...prev, currentNode.id]);
                setCurrentNodeId(targetNodeId);
                setSelectedOptionIndex(0);
                setCurrentScreenMap(null);
                setCurrentWorldMapGraph(null);
            }
            return; // Stop animation frame to allow transition
        }

        animationFrameId.current = requestAnimationFrame(animate);
    };
    // --- End of new animation function ---

    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    if (currentNode.type === 'WorldLink') {
        if (isDynamic) {
            lastTime = 0; // Reiniciar deltaTime
            animationFrameId.current = requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
            if (tileBufferRef.current) { // Dibujar buffer estAtico
                ctx.drawImage(tileBufferRef.current, 0, 0);

                // Hide revealed secret tiles
                if (currentScreenMapRef.current) {
                    ctx.fillStyle = '#000000';
                    revealedSecretTiles.current.forEach((key) => {
                        const parts = key.split('_');
                        const screenId = parts.slice(0, -2).join('_');
                        const tx = parseInt(parts[parts.length - 2], 10);
                        const ty = parseInt(parts[parts.length - 1], 10);

                        if (screenId === currentScreenMapRef.current?.id) {
                            ctx.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                        }
                    });
                }
            } else {
                // Si no hay buffer, dibujar fondo por defecto
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
            }

            // === RESOLVE CHILD-LINK PARENTS EVERY FRAME ===
            const entityLookup = new Map<string, AnimatedEntity>();
            for (const entity of entitiesRef.current) {
                entityLookup.set(entity.instance.id, entity);
            }
            resolveChildLinkParents(entitiesRef.current, entityLookup);
            // ==============================================

            entitiesRef.current.forEach(entity => {
                const currentScreenId = currentScreenMapRef.current?.id;
                const childLinkConfig = entity.childLink;
                const childLinkParent = childLinkConfig && entity.parentEntityId
                    ? entityLookup.get(entity.parentEntityId)
                    : undefined;
                const isChildOfVisibleParent =
                    !!childLinkConfig &&
                    !!childLinkParent &&
                    childLinkParent.ownerScreenId === currentScreenId;

                // Skip entities from other screens unless they are child-linked to a visible parent
                if (
                    entity.ownerScreenId &&
                    entity.ownerScreenId !== currentScreenId &&
                    !isChildOfVisibleParent
                ) {
                    return;
                }

                // Filter Box entities: only render if they belong to current screen or are being carried
                const isBox = entity.template.components?.some(c => c.definitionId === 'comp_box') || /box/i.test(entity.template.name);
                const shouldRenderBox = !isBox ||
                    entity.ownerScreenId === null || // Being carried
                    entity.ownerScreenId === currentScreenId || // Belongs to current screen
                    isChildOfVisibleParent; // Child of a visible parent

                if (!shouldRenderBox) return; // Skip this Box (belongs to another screen and not linked)

                // Filter Collectible items: only render if they belong to current screen
                const isCollectible = isCollectibleEntity(entity);
                const shouldRenderCollectible = !isCollectible ||
                    entity.ownerScreenId === currentScreenId ||
                    isChildOfVisibleParent;

                if (!shouldRenderCollectible) return; // Skip this item (belongs to another screen and not linked)

                // Apply relative position if this entity is child-linked
                if (childLinkConfig && entity.parentEntityId) {
                    const parent = entityLookup.get(entity.parentEntityId);
                    if (parent) {
                        const rawOffsetX = Number(childLinkConfig.offsetX) || 0;
                        const offsetY = Number(childLinkConfig.offsetY) || 0;
                        const shouldFlipOffsetX =
                            childLinkConfig.mirrorParent && (parent.isFacingMirrored || parent.isMirrored);
                        const offsetX = shouldFlipOffsetX ? -rawOffsetX : rawOffsetX;
                        entity.x = parent.x + offsetX;
                        entity.y = parent.y + offsetY;

                        if (childLinkConfig.followParentGlobal && parent.globalX !== undefined && parent.globalY !== undefined) {
                            entity.globalX = parent.globalX + offsetX;
                            entity.globalY = parent.globalY + offsetY;
                        }

                        if (childLinkConfig.mirrorParent) {
                            entity.isMirrored = parent.isMirrored;
                        }
                    }
                }

                if (entity.frameImages.length > 0 && entity.frameImages[0].complete) {
                    ctx.drawImage(entity.frameImages[0], entity.x, entity.y);
                }
            });

            if (hudBufferRef.current) {
                ctx.drawImage(hudBufferRef.current, 0, 0);
            }
            drawAutoDialoguePreview(ctx);

            refreshVisibleEntityCount(currentScreenMapRef.current?.id);
        }
    } else {
        renderTextNodes();
        refreshVisibleEntityCount(null);
    }

    return () => {
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        // tileCanvas = null; tileCtx = null; // Opcional: limpiar referencias
    };
}, [
    isOpen, isDynamic, currentNode, currentScreenMap, allAssets, connections, currentGraphData,
    msxFont, msxFontColorAttributes, entityTemplates, currentScreenMode, selectedOptionIndex, checkKeyTransitions,
    // Asegurarse de que dependencias de las funciones internas estAn aquA si cambian
    componentDefinitions, TILE_SIZE, PREVIEW_WIDTH, PREVIEW_HEIGHT, showHitboxDebug, showTileHitboxes, isFullscreen,
    refreshVisibleEntityCount, showEntityCount, createAutoEventRuntime, drawAutoDialoguePreview, updateAutoEventRuntime
]);

if (!isOpen) return null;

const currentScreenNode = currentWorldMapGraph?.nodes.find(n => n.screenAssetId === currentScreenMap?.id);
const getExitsForDirection = (direction: 'north' | 'south' | 'east' | 'west'): EnrichedConnection[] => {
    if (!currentScreenNode || !currentWorldMapGraph) return [];
    const outgoing = currentWorldMapGraph.connections
        .filter(c => c.fromNodeId === currentScreenNode.id && c.fromDirection === direction)
        .map(c => ({ ...c, targetNodeId: c.toNodeId }));
    const incoming = currentWorldMapGraph.connections
        .filter(c => c.toNodeId === currentScreenNode.id && c.toDirection === direction)
        .map(c => ({ ...c, targetNodeId: c.fromNodeId }));
    return [...outgoing, ...incoming];
};

const northExits = getExitsForDirection('north');
const southExits = getExitsForDirection('south');
const eastExits = getExitsForDirection('east');
const westExits = getExitsForDirection('west');

const getButtonStyle = (direction: 'north' | 'south' | 'east' | 'west', index: number, total: number): React.CSSProperties => {
    const offset = (index - (total - 1) / 2) * (isFullscreen ? 64 : 32);
    switch (direction) {
        case 'north': return { top: 0, left: `calc(50% + ${offset}px)`, transform: 'translateX(-50%)' };
        case 'south': return { bottom: 0, left: `calc(50% + ${offset}px)`, transform: 'translateX(-50%)' };
        case 'west': return { left: 0, top: `calc(50% + ${offset}px)`, transform: 'translateY(-50%)' };
        case 'east': return { right: 0, top: `calc(50% + ${offset}px)`, transform: 'translateY(-50%)' };
    }
};

const handleSaveCrtConfig = (config: CRTShaderConfig) => {
    setCrtConfig(config);
    localStorage.setItem('crtShaderConfig', JSON.stringify(config));
};

// Cleanup music on unmount or when modal closes
useEffect(() => {
    return () => {
        if (musicSynthesizerRef.current) {
            musicSynthesizerRef.current.stopAllNotes();
        }
        if (musicPlaybackIntervalRef.current) {
            clearInterval(musicPlaybackIntervalRef.current);
            musicPlaybackIntervalRef.current = null;
        }
    };
}, []);

const subMenuNode = currentNode?.type === 'SubMenu' ? currentNode as GameFlowSubMenuNode : null;
const subMenuSelectorModeRaw =
    (subMenuNode as any)?.appearance?.selectorType ??
    (subMenuNode as any)?.appearance?.cursorType ??
    (subMenuNode as any)?.appearance?.cursorMode ??
    (subMenuNode as any)?.selectorType ??
    (subMenuNode as any)?.cursorType ??
    (subMenuNode as any)?.cursorMode ??
    'auto';
const subMenuSelectorMode = String(subMenuSelectorModeRaw).trim().toLowerCase();
const selectorForcesChar = ['char', 'character', 'text', 'glyph'].includes(subMenuSelectorMode);
const selectorForcesSprite = ['sprite', 'image'].includes(subMenuSelectorMode);
const shouldUseSpriteCursor = selectorForcesChar
    ? false
    : selectorForcesSprite
        ? !!subMenuNode?.appearance?.cursorSpriteAssetId
        : !!subMenuNode?.appearance?.cursorSpriteAssetId;
const cursorAsset = shouldUseSpriteCursor && subMenuNode?.appearance?.cursorSpriteAssetId
    ? allAssets.find(a => a.id === subMenuNode.appearance.cursorSpriteAssetId)
    : null;
const canvasBackgroundColor = subMenuNode?.appearance?.colors?.background || '#000000';
const computedCanvasCursor = useMemo(() => {
    if (hoverExitDirection && cursorBlinkOn) {
        return getArrowCursor(hoverExitDirection);
    }
    return isPositioningMode ? 'crosshair' : undefined;
}, [hoverExitDirection, cursorBlinkOn, getArrowCursor, isPositioningMode]);

const modalContent = (
    <div
        ref={modalRef}
        className={`fixed inset-0 ${isFullscreen ? 'bg-black' : 'bg-black bg-opacity-75'} flex items-center justify-center z-50 animate-fadeIn ${isFullscreen ? '' : 'p-4'} outline-none`}
        onClick={isFullscreen ? undefined : onClose}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        tabIndex={-1}
    >
        {isFullscreen ? (
            // Fullscreen mode - only game canvas centered on black background
            <div className="relative" style={{ width: PREVIEW_WIDTH * 4, height: PREVIEW_HEIGHT * 4 }}>
                <CRTShaderOverlay enabled={isFullscreen} config={crtConfig}>
                    <canvas
                        ref={canvasRef}
                        width={PREVIEW_WIDTH}
                        height={PREVIEW_HEIGHT}
                        className={`${isPositioningMode ? 'cursor-crosshair' : ''}`}
                        style={{
                            width: PREVIEW_WIDTH * 4,
                            height: PREVIEW_HEIGHT * 4,
                            imageRendering: 'pixelated',
                            backgroundColor: canvasBackgroundColor,
                            cursor: computedCanvasCursor
                        }}
                        onClick={handleCanvasClick}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseLeave={() => setHoverExitDirection(null)}
                    />
                </CRTShaderOverlay>
                {(gameGlobalVariables as any)?.Ammo !== undefined && (
                    <div key={hudVersion}
                        className="absolute text-white bg-black bg-opacity-50 px-2 py-1 rounded pixel-font"
                        style={{ top: 8, left: 8, fontSize: 16 }}
                    >
                        {`Ammo: ${(() => { const v = (gameGlobalVariables as any).Ammo; const n = Number(v); return (!Number.isNaN(n) && n < 0) ? '8' : String(v); })()}`}
                    </div>
                )}
                {showEntityCount && currentNode?.type === 'WorldLink' && (
                    <div
                        className="absolute text-white bg-black bg-opacity-50 px-2 py-1 rounded pixel-font"
                        style={{ top: 8, right: 8, fontSize: 16 }}
                    >
                        {`Entities: ${visibleEntityCount}`}
                    </div>
                )}
                {showStateMachineStates && currentNode?.type === 'WorldLink' && (
                    <div
                        className="absolute text-white bg-black bg-opacity-70 px-3 py-2 rounded pixel-font"
                        style={{ top: 40, right: 8, fontSize: 12, maxHeight: '400px', overflowY: 'auto' }}
                    >
                        <div className="font-bold mb-1">Entity States:</div>
                        {entitiesRef.current
                            .filter(e => e.stateMachine && e.currentState)
                            .map((e, idx) => (
                                <div key={idx} className="text-xs mb-0.5">
                                    {e.template.name}: <span className="text-yellow-300">{e.currentState}</span>
                                </div>
                            ))}
                        {entitiesRef.current.filter(e => e.stateMachine && e.currentState).length === 0 && (
                            <div className="text-xs text-gray-400">No entities with state machines</div>
                        )}
                    </div>
                )}
                {cursorAsset && subMenuNode && (() => {
                    const expandedOpts = expandMenuOptions(subMenuNode);
                    const selectedText = expandedOpts[selectedOptionIndex]?.text || '';
                    const scale = 4;
                    return (
                        <img
                            src={createSpriteDataURL((cursorAsset.data as Sprite).frames[0].data, (cursorAsset.data as Sprite).size.width, (cursorAsset.data as Sprite).size.height)}
                            alt="cursor"
                            className="absolute pointer-events-none"
                            style={{
                                left: ((PREVIEW_WIDTH - getTextDimensionsMSX1(selectedText, 1).width) / 2 - 16) * scale,
                                top: ((80 + selectedOptionIndex * 12) - 4) * scale,
                                imageRendering: 'pixelated',
                                width: (cursorAsset.data as Sprite).size.width * scale,
                                height: (cursorAsset.data as Sprite).size.height * scale,
                            }}
                        />
                    );
                })()}
            </div>
        ) : (
            // Normal mode - full modal with controls
            <div
                className="bg-msx-panelbg p-4 sm:p-6 rounded-lg shadow-xl animate-slideIn font-sans flex flex-col items-center"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-md sm:text-lg text-msx-highlight mb-3 sm:mb-4 pixel-font">Game Flow Preview</h2>
                <p className="text-xs text-msx-textsecondary mb-2">Use Arrows, Enter/Space, and Escape to navigate.</p>
                <div className="relative" style={{ width: PREVIEW_WIDTH * 2, height: PREVIEW_HEIGHT * 2 }}>
                    <CRTShaderOverlay enabled={false} config={crtConfig}>
                        <canvas
                            ref={canvasRef}
                            width={PREVIEW_WIDTH}
                            height={PREVIEW_HEIGHT}
                            className={`border-2 border-msx-border ${isPositioningMode ? 'cursor-crosshair' : ''}`}
                            style={{
                                width: PREVIEW_WIDTH * 2,
                                height: PREVIEW_HEIGHT * 2,
                                imageRendering: 'pixelated',
                                backgroundColor: canvasBackgroundColor,
                                cursor: computedCanvasCursor
                            }}
                            onClick={handleCanvasClick}
                            onMouseMove={handleCanvasMouseMove}
                            onMouseLeave={() => setHoverExitDirection(null)}
                        />
                    </CRTShaderOverlay>
                    {(gameGlobalVariables as any)?.Ammo !== undefined && (
                        <div key={hudVersion}
                            className="absolute text-white bg-black bg-opacity-50 px-2 py-0.5 rounded pixel-font"
                            style={{ top: 4, left: 4, fontSize: 12 }}
                        >
                            {`Ammo: ${(() => { const v = (gameGlobalVariables as any).Ammo; const n = Number(v); return (!Number.isNaN(n) && n < 0) ? '8' : String(v); })()}`}
                        </div>
                    )}
                    {showEntityCount && currentNode?.type === 'WorldLink' && (
                        <div
                            className="absolute text-white bg-black bg-opacity-50 px-2 py-0.5 rounded pixel-font"
                            style={{ top: 4, right: 4, fontSize: 12 }}
                        >
                            {`Entities: ${visibleEntityCount}`}
                        </div>
                    )}
                    {showStateMachineStates && currentNode?.type === 'WorldLink' && (
                        <div
                            className="absolute text-white bg-black bg-opacity-70 px-2 py-1 rounded pixel-font"
                            style={{ top: 26, right: 4, fontSize: 10, maxHeight: '300px', overflowY: 'auto' }}
                        >
                            <div className="font-bold mb-0.5">Entity States:</div>
                            {entitiesRef.current
                                .filter(e => e.stateMachine && e.currentState)
                                .map((e, idx) => (
                                    <div key={idx} className="text-xs mb-0.5">
                                        {e.template.name}: <span className="text-yellow-300">{e.currentState}</span>
                                    </div>
                                ))}
                            {entitiesRef.current.filter(e => e.stateMachine && e.currentState).length === 0 && (
                                <div className="text-xs text-gray-400">No entities with state machines</div>
                            )}
                        </div>
                    )}
                    {cursorAsset && subMenuNode && (() => {
                        const expandedOpts = expandMenuOptions(subMenuNode);
                        const selectedText = expandedOpts[selectedOptionIndex]?.text || '';
                        const scale = 2;
                        return (
                            <img
                                src={createSpriteDataURL((cursorAsset.data as Sprite).frames[0].data, (cursorAsset.data as Sprite).size.width, (cursorAsset.data as Sprite).size.height)}
                                alt="cursor"
                                className="absolute pointer-events-none"
                                style={{
                                    left: ((PREVIEW_WIDTH - getTextDimensionsMSX1(selectedText, 1).width) / 2 - 16) * scale,
                                    top: ((80 + selectedOptionIndex * 12) - 4) * scale,
                                    imageRendering: 'pixelated',
                                    width: (cursorAsset.data as Sprite).size.width * scale,
                                    height: (cursorAsset.data as Sprite).size.height * scale,
                                }}
                            />
                        );
                    })()}
                    {currentScreenMap && !isPlayMode && (
                        <>
                            {northExits.map((conn, index) => (
                                <button key={`${conn.id}-${index}`} onClick={() => handleScreenTransition(conn.targetNodeId)} style={getButtonStyle('north', index, northExits.length)} className="absolute bg-black bg-opacity-50 text-white p-1 rounded-full">
                                    <ArrowUpIcon className="w-6 h-6" />
                                </button>
                            ))}
                            {southExits.map((conn, index) => (
                                <button key={`${conn.id}-${index}`} onClick={() => handleScreenTransition(conn.targetNodeId)} style={getButtonStyle('south', index, southExits.length)} className="absolute bg-black bg-opacity-50 text-white p-1 rounded-full">
                                    <ArrowDownIcon className="w-6 h-6" />
                                </button>
                            ))}
                            {westExits.map((conn, index) => (
                                <button key={`${conn.id}-${index}`} onClick={() => handleScreenTransition(conn.targetNodeId)} style={getButtonStyle('west', index, westExits.length)} className="absolute bg-black bg-opacity-50 text-white p-1 rounded-full">
                                    <ArrowLeftIcon className="w-6 h-6" />
                                </button>
                            ))}
                            {eastExits.map((conn, index) => (
                                <button key={`${conn.id}-${index}`} onClick={() => handleScreenTransition(conn.targetNodeId)} style={getButtonStyle('east', index, eastExits.length)} className="absolute bg-black bg-opacity-50 text-white p-1 rounded-full">
                                    <ArrowRightIcon className="w-6 h-6" />
                                </button>
                            ))}
                        </>
                    )}
                </div>
                <div className="flex items-center mt-4">
                    {!isPlayMode && (
                        <>
                            <Button onClick={() => setIsDynamic(!isDynamic)} variant={isDynamic ? 'secondary' : 'ghost'} size="md" className="mr-4">Dynamic: {isDynamic ? 'On' : 'Off'}</Button>
                            {isDynamic && currentNode?.type === 'WorldLink' && (
                                <>
                                    <Button onClick={() => setShowHitboxDebug(!showHitboxDebug)} variant={showHitboxDebug ? 'secondary' : 'ghost'} size="md" className="mr-4">
                                        Hitbox Debug: {showHitboxDebug ? 'On' : 'Off'}
                                    </Button>
                                    <Button onClick={() => setShowTileHitboxes(!showTileHitboxes)} variant={showTileHitboxes ? 'secondary' : 'ghost'} size="md" className="mr-4">
                                        Hitbox Tiles: {showTileHitboxes ? 'On' : 'Off'}
                                    </Button>
                                    <Button onClick={() => setShowEntityCount(!showEntityCount)} variant={showEntityCount ? 'secondary' : 'ghost'} size="md" className="mr-4">
                                        Entities: {showEntityCount ? visibleEntityCount : 'Off'}
                                    </Button>
                                    <Button onClick={() => setShowStateMachineStates(!showStateMachineStates)} variant={showStateMachineStates ? 'secondary' : 'ghost'} size="md" className="mr-4">
                                        States: {showStateMachineStates ? 'On' : 'Off'}
                                    </Button>
                                    <Button onClick={() => setIsPositioningMode(!isPositioningMode)} variant={isPositioningMode ? 'secondary' : 'ghost'} size="md" className="mr-4">
                                        Position Player: {isPositioningMode ? 'On' : 'Off'}
                                    </Button>
                                    <Button variant="ghost" size="md" className="mr-4 cursor-default">
                                        {(() => {
                                            const playerEntity = entitiesRef.current.find(entity =>
                                                entity.template.components.some(c =>
                                                    c.definitionId === 'comp_player_input' ||
                                                    c.definitionId === 'comp_cursors' ||
                                                    c.definitionId === 'comp_input'
                                                )
                                            );
                                            if (!playerEntity?.stateMachine) {
                                                return 'Player: No StateMachine';
                                            }
                                            return `Player State: ${playerEntity.currentState || 'N/A'}`;
                                        })()}
                                    </Button>
                                    {/* Carry offset is now configured via comp_carry on the Player entity */}
                                </>
                            )}
                            {currentNode?.type === 'WorldLink' && (() => {
                                const targetNodeId = resolveDefaultGameFlowExitNode(currentNode.id);
                                return targetNodeId ? (
                                    <Button onClick={() => {
                                        setNavigationStack(prev => [...prev, currentNode.id]);
                                        setCurrentNodeId(targetNodeId);
                                        setSelectedOptionIndex(0);
                                        setCurrentScreenMap(null);
                                        setCurrentWorldMapGraph(null);
                                    }} variant="secondary" size="md" className="mr-4">Exit World</Button>
                                ) : null;
                            })()}
                        </>
                    )}
                    {isPlayMode && (
                        <>
                            <Button
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                variant="secondary"
                                size="md"
                                icon={<ArrowsPointingOutIcon />}
                                className="mr-4"
                            >
                                {isFullscreen ? 'Normal Size' : 'Full Size'}
                            </Button>
                            <Button
                                onClick={() => setIsCrtConfigOpen(true)}
                                variant="ghost"
                                size="md"
                                className="mr-4"
                            >
                                CRT Config
                            </Button>
                            {/* Carry offset is now configured via comp_carry on the Player entity */}
                        </>
                    )}
                    <Button onClick={onClose} variant="primary" size="md">Close</Button>
                </div>
            </div>
        )}
    </div>
);

return (
    <>
        {createPortal(modalContent, document.body)}
        <CRTConfigModal
            isOpen={isCrtConfigOpen}
            onClose={() => setIsCrtConfigOpen(false)}
            currentConfig={crtConfig}
            onSave={handleSaveCrtConfig}
        />
    </>
);
};
