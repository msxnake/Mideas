"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScreenPlayModal = void 0;
var react_1 = require("react");
var Button_1 = require("../common/Button");
var screenUtils_1 = require("../utils/screenUtils");
var bossRenderUtils_1 = require("../utils/bossRenderUtils");
var spriteUtils_1 = require("../utils/spriteUtils");
var msxFontRenderer_1 = require("../utils/msxFontRenderer");
var engines_1 = require("../../src/engines");
var screenModeConfig_1 = require("../../utils/screenModeConfig");
// Sprite rotation utilities for auto-generated directional sprites
var rotatePixelData90CW = function (pixelData) {
    var height = pixelData.length;
    var width = pixelData[0].length;
    var rotated = Array(width).fill(null).map(function () { return Array(height).fill(null); });
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            rotated[x][height - 1 - y] = pixelData[y][x];
        }
    }
    return rotated;
};
var rotatePixelData180 = function (pixelData) {
    var height = pixelData.length;
    var width = pixelData[0].length;
    var rotated = Array(height).fill(null).map(function () { return Array(width).fill(null); });
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            rotated[height - 1 - y][width - 1 - x] = pixelData[y][x];
        }
    }
    return rotated;
};
var rotatePixelData270CW = function (pixelData) {
    var height = pixelData.length;
    var width = pixelData[0].length;
    var rotated = Array(width).fill(null).map(function () { return Array(height).fill(null); });
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            rotated[width - 1 - x][y] = pixelData[y][x];
        }
    }
    return rotated;
};
// Auto-generate rotated sprites from base frames
var generateRotatedSprites = function (entity) {
    if (entity.frameImages.length < 1 || !entity.sprite.frames[0]) {
        return entity.frameImages;
    }
    console.log("\uD83D\uDD04 Auto-generating rotated sprites for ".concat(entity.template.name, " (").concat(entity.frameImages.length, " base frames)"));
    var generatedFrames = [];
    var spriteWidth = entity.sprite.size.width;
    var spriteHeight = entity.sprite.size.height;
    var baseFrameCount = entity.sprite.frames.length;
    // Generate frames by direction: [all_right_frames, all_up_frames, all_left_frames, all_down_frames]
    for (var direction = 0; direction < 4; direction++) {
        for (var frameIndex = 0; frameIndex < baseFrameCount; frameIndex++) {
            var basePixelData = entity.sprite.frames[frameIndex].data;
            switch (direction) {
                case 0: // Right (0°) - original
                    generatedFrames.push(entity.frameImages[frameIndex]);
                    break;
                case 1: // Up (270°) - was Down
                    if (spriteWidth === spriteHeight) {
                        var rotated270 = rotatePixelData270CW(basePixelData);
                        var img270 = new Image();
                        img270.src = (0, screenUtils_1.createSpriteDataURL)(rotated270, spriteWidth, spriteHeight);
                        generatedFrames.push(img270);
                    }
                    else {
                        generatedFrames.push(entity.frameImages[frameIndex]);
                    }
                    break;
                case 2: // Left (mirror horizontal)
                    var mirrored = (0, spriteUtils_1.mirrorPixelDataHorizontally)(basePixelData);
                    var imgMirrored = new Image();
                    imgMirrored.src = (0, screenUtils_1.createSpriteDataURL)(mirrored, spriteWidth, spriteHeight);
                    generatedFrames.push(imgMirrored);
                    break;
                case 3: // Down (90°) - was Up
                    if (spriteWidth === spriteHeight) {
                        var rotated90 = rotatePixelData90CW(basePixelData);
                        var img90 = new Image();
                        img90.src = (0, screenUtils_1.createSpriteDataURL)(rotated90, spriteWidth, spriteHeight);
                        generatedFrames.push(img90);
                    }
                    else {
                        generatedFrames.push(entity.frameImages[frameIndex]);
                    }
                    break;
            }
        }
    }
    console.log("\u2705 Generated ".concat(generatedFrames.length, " rotated frames: ").concat(baseFrameCount, " frames \u00D7 4 directions"));
    console.log("\uD83D\uDCCB Frame structure: Right(0-".concat(baseFrameCount - 1, "), Up(").concat(baseFrameCount, "-").concat(baseFrameCount * 2 - 1, "), Left(").concat(baseFrameCount * 2, "-").concat(baseFrameCount * 3 - 1, "), Down(").concat(baseFrameCount * 3, "-").concat(baseFrameCount * 4 - 1, ")"));
    return generatedFrames;
};
var TILE_SIZE = 8;
var PREVIEW_WIDTH = 256;
var PREVIEW_HEIGHT = 192;
var ANIMATION_SPEED_MS = 200;
// Available Game Engines
var AVAILABLE_ENGINES = {
    gravity: {
        id: 'gravity',
        name: 'Gravity Engine',
        execute: function (entities, componentDefinitions) {
            entities.forEach(function (entity) {
                var _a;
                var gravityComp = entity.template.components.find(function (c) { return c.definitionId === 'comp_gravity'; });
                if (gravityComp) {
                    var gravityProps = __assign(__assign({}, gravityComp.defaultValues), (((_a = entity.instance.componentOverrides) === null || _a === void 0 ? void 0 : _a['comp_gravity']) || {}));
                    var strength = Number(gravityProps.strength || 0) / 60;
                    var terminalVelocity = Number(gravityProps.terminalVelocity || 2);
                    // Only apply gravity if entity is NOT on ground (not touching the ground)
                    // Note: wallCollisionEngine sets isGrounded, other systems may set isOnGround
                    if (!entity.isOnGround && !entity.isGrounded) {
                        entity.vy += strength;
                        if (entity.vy > terminalVelocity)
                            entity.vy = terminalVelocity;
                    }
                }
            });
        }
    },
    animation: {
        id: 'animation',
        name: 'Animation Engine',
        execute: function (entities, componentDefinitions) {
            var now = performance.now();
            entities.forEach(function (entity) {
                var _a, _b, _c, _d, _e, _f, _g;
                var animComp = entity.template.components.find(function (c) { return c.definitionId === 'comp_animation'; });
                var spriteAnimMs = (entity.sprite && typeof entity.sprite.animationSpeedMs === 'number') ? entity.sprite.animationSpeedMs : ANIMATION_SPEED_MS;
                if (animComp && entity.frameImages.length > 1 && now - entity.lastFrameUpdateTime > spriteAnimMs) {
                    // Check if animation should only play when moving
                    var animOverrides = ((_a = entity.instance.componentOverrides) === null || _a === void 0 ? void 0 : _a['comp_animation']) || {};
                    var animateOnlyWhenMoving = ((_b = animOverrides.animateOnlyWhenMoving) !== null && _b !== void 0 ? _b : (_c = animComp.defaultValues) === null || _c === void 0 ? void 0 : _c.animateOnlyWhenMoving) === true;
                    var isMoving = entity.vx !== 0 || entity.vy !== 0;
                    var stateName_1 = (entity.currentState || '').toLowerCase();
                    var isMovementState = ['run', 'running', 'walk', 'walking', 'dash', 'dashing'].some(function (state) { return stateName_1.includes(state); });
                    var isAnimationPlaying = (_g = (_e = (_d = entity.isAnimationPlaying) !== null && _d !== void 0 ? _d : animOverrides.isPlaying) !== null && _e !== void 0 ? _e : (_f = animComp.defaultValues) === null || _f === void 0 ? void 0 : _f.isPlaying) !== null && _g !== void 0 ? _g : true;
                    // Priority states that should always animate (death, hurt, attack, etc.)
                    var priorityStates = ['Dead', 'Death', 'Hurt', 'Hit', 'Damage', 'Attack', 'Attacking', 'Stunned', 'GameOver', 'Invulnerable'];
                    var isWallGrabAnimation = entity.isWallGrabbing === true && !!entity.wallGrabSpriteBackup;
                    var isInPriorityState = isWallGrabAnimation || (entity.currentState && priorityStates.some(function (state) { var _a; return (_a = entity.currentState) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(state.toLowerCase()); }));
                    // Only animate if: not restricted to movement, OR is moving, OR in priority state
                    if (isAnimationPlaying && (!animateOnlyWhenMoving || isMoving || isMovementState || isInPriorityState)) {
                        var oldFrame = entity.currentFrame;
                        // Check if entity has directional rotation system
                        if (entity.rotationData && entity.baseFrameForDirection !== undefined) {
                            if (entity.framesPerDirection && entity.framesPerDirection > 1) {
                                // Auto-generated system: cycle through frames in current direction
                                var baseFrame = entity.baseFrameForDirection;
                                var maxFrameInDirection = baseFrame + entity.framesPerDirection - 1;
                                if (entity.currentFrame >= maxFrameInDirection) {
                                    entity.currentFrame = baseFrame; // Back to first frame of direction
                                }
                                else {
                                    entity.currentFrame++; // Next frame in same direction
                                }
                            }
                            else {
                                // 8-frame manual system: alternate between open/closed mouth
                                var baseFrame = entity.baseFrameForDirection;
                                if (entity.currentFrame === baseFrame) {
                                    entity.currentFrame = baseFrame + 1; // Switch to closed mouth
                                }
                                else {
                                    entity.currentFrame = baseFrame; // Switch to open mouth
                                }
                            }
                        }
                        else {
                            // Standard animation: cycle through all frames
                            entity.currentFrame = (entity.currentFrame + 1) % entity.frameImages.length;
                        }
                        entity.lastFrameUpdateTime = now;
                        if (entity.instance.id.startsWith('spawned_') && oldFrame !== entity.currentFrame) {
                            console.log('🎬 Animating spawned entity:', {
                                id: entity.instance.id,
                                frame: "".concat(oldFrame, " \u2192 ").concat(entity.currentFrame),
                                totalFrames: entity.frameImages.length
                            });
                        }
                    }
                    else if (animateOnlyWhenMoving && !isMoving && !isInPriorityState) {
                        // Reset to first frame when stopped (and not in priority state)
                        entity.currentFrame = 0;
                    }
                }
            });
        }
    },
    patrol: {
        id: 'patrol',
        name: 'Patrol Engine',
        execute: function (entities, componentDefinitions) {
            entities.forEach(function (entity) {
                var _a, _b, _c;
                var patrolComp = (_a = entity.instance.componentOverrides) === null || _a === void 0 ? void 0 : _a.comp_patrol;
                if ((patrolComp === null || patrolComp === void 0 ? void 0 : patrolComp.waypoint1_x) !== undefined && (patrolComp === null || patrolComp === void 0 ? void 0 : patrolComp.waypoint1_y) !== undefined) {
                    var startPixelX = patrolComp.waypoint1_x;
                    var startPixelY = patrolComp.waypoint1_y;
                    var endPixelX = (_b = patrolComp.waypoint2_x) !== null && _b !== void 0 ? _b : startPixelX;
                    var endPixelY = (_c = patrolComp.waypoint2_y) !== null && _c !== void 0 ? _c : startPixelY;
                    // Horizontal patrol bounce with position correction
                    if (entity.vx > 0 && entity.x >= Math.max(startPixelX, endPixelX)) {
                        entity.vx = -entity.vx;
                        entity.x = Math.max(startPixelX, endPixelX);
                    }
                    if (entity.vx < 0 && entity.x <= Math.min(startPixelX, endPixelX)) {
                        entity.vx = -entity.vx;
                        entity.x = Math.min(startPixelX, endPixelX);
                    }
                    // Vertical patrol bounce with position correction
                    if (entity.vy > 0 && entity.y >= Math.max(startPixelY, endPixelY)) {
                        entity.vy = -entity.vy;
                        entity.y = Math.max(startPixelY, endPixelY);
                    }
                    if (entity.vy < 0 && entity.y <= Math.min(startPixelY, endPixelY)) {
                        entity.vy = -entity.vy;
                        entity.y = Math.min(startPixelY, endPixelY);
                    }
                }
            });
        }
    },
    spawner: {
        id: 'spawner',
        name: 'Spawner Engine',
        execute: function (entities, componentDefinitions, screenMap, entityTemplates, allAssets, pendingSpawns) {
            entities.forEach(function (entity) {
                var _a;
                var spawnerComp = entity.template.components.find(function (c) { return c.definitionId === 'comp_spawner'; });
                if (spawnerComp) {
                    var spawnerProps_1 = __assign(__assign({}, spawnerComp.defaultValues), (((_a = entity.instance.componentOverrides) === null || _a === void 0 ? void 0 : _a['comp_spawner']) || {}));
                    if (!spawnerProps_1.isActive)
                        return;
                    // Initialize spawner data if not exists
                    if (!entity.spawnerData) {
                        entity.spawnerData = {
                            lastSpawnTime: performance.now() - Number(spawnerProps_1.spawnRate),
                            spawnedEntities: [],
                            spawnCount: 0
                        };
                        console.log('🔧 Spawner initialized:', {
                            entityName: entity.template.name,
                            spawnerProps: spawnerProps_1,
                            spawnRate: Number(spawnerProps_1.spawnRate)
                        });
                        // Spawn on start if enabled
                        if (spawnerProps_1.spawnOnStart) {
                            entity.spawnerData.lastSpawnTime = performance.now() - Number(spawnerProps_1.spawnRate);
                        }
                    }
                    var now = performance.now();
                    var spawnRate = Number(spawnerProps_1.spawnRate);
                    var maxEntities = Number(spawnerProps_1.maxEntities);
                    // Clean up dead entities from tracking
                    if (entity.spawnerData.spawnedEntities) {
                        entity.spawnerData.spawnedEntities = entity.spawnerData.spawnedEntities.filter(function (spawnedId) {
                            return entities.some(function (e) { return e.instance.id === spawnedId; });
                        });
                    }
                    // Check if we should spawn
                    var timeSinceLastSpawn = now - entity.spawnerData.lastSpawnTime;
                    var shouldSpawn = timeSinceLastSpawn >= spawnRate && entity.spawnerData.spawnedEntities.length < maxEntities;
                    if (entity.spawnerData.spawnCount < 1) {
                        console.log('🕐 Spawner timing check:', {
                            entityName: entity.template.name,
                            timeSinceLastSpawn: timeSinceLastSpawn,
                            spawnRate: spawnRate,
                            currentEntities: entity.spawnerData.spawnedEntities.length,
                            maxEntities: maxEntities,
                            shouldSpawn: shouldSpawn
                        });
                    }
                    if (shouldSpawn) {
                        // Find template to spawn
                        var templateToSpawn = entityTemplates === null || entityTemplates === void 0 ? void 0 : entityTemplates.find(function (t) { return t.id === spawnerProps_1.entityTemplateId; });
                        if (templateToSpawn && screenMap && allAssets) {
                            // Calculate spawn position
                            var spawnZoneX = Number(spawnerProps_1.spawnZoneX) || 0;
                            var spawnZoneY = Number(spawnerProps_1.spawnZoneY) || 0;
                            var spawnZoneWidth = Number(spawnerProps_1.spawnZoneWidth) || PREVIEW_WIDTH;
                            var spawnZoneHeight = Number(spawnerProps_1.spawnZoneHeight) || PREVIEW_HEIGHT;
                            var spawnX = spawnZoneWidth > 0 ?
                                spawnZoneX + Math.random() * spawnZoneWidth :
                                Math.random() * PREVIEW_WIDTH;
                            var spawnY = spawnZoneHeight > 0 ?
                                spawnZoneY + Math.random() * spawnZoneHeight :
                                Math.random() * PREVIEW_HEIGHT;
                            // Create new entity instance
                            var newEntityId = "spawned_".concat(Date.now(), "_").concat(Math.random().toString(36).substring(2, 7));
                            var newEntityInstance = {
                                id: newEntityId,
                                entityTemplateId: templateToSpawn.id,
                                name: "".concat(templateToSpawn.name, " ").concat(entity.spawnerData.spawnCount + 1),
                                position: { x: Math.floor(spawnX / TILE_SIZE), y: Math.floor(spawnY / TILE_SIZE) },
                                componentOverrides: {}
                            };
                            // Add to pending spawns list for processing
                            if (pendingSpawns) {
                                pendingSpawns.current.push(newEntityInstance);
                            }
                            entity.spawnerData.spawnedEntities.push(newEntityId);
                            entity.spawnerData.spawnCount++;
                            entity.spawnerData.lastSpawnTime = now;
                            console.log("\uD83D\uDD27 Spawner: Created ".concat(templateToSpawn.name, " at (").concat(spawnX.toFixed(0), ", ").concat(spawnY.toFixed(0), ")"));
                        }
                    }
                }
            });
        }
    },
    shooting: {
        id: 'shooting',
        name: 'Shooting Engine',
        execute: function (entities, componentDefinitions, screenMap, entityTemplates, allAssets, pendingSpawns) {
            entities.forEach(function (entity) {
                var _a, _b, _c;
                var aimingComp = entity.template.components.find(function (c) { return c.definitionId === 'comp_aiming'; });
                var damageComp = entity.template.components.find(function (c) { return c.definitionId === 'comp_damage'; });
                if (aimingComp && damageComp) {
                    var aimingProps = __assign(__assign({}, aimingComp.defaultValues), (((_a = entity.instance.componentOverrides) === null || _a === void 0 ? void 0 : _a['comp_aiming']) || {}));
                    var damageProps = __assign(__assign({}, damageComp.defaultValues), (((_b = entity.instance.componentOverrides) === null || _b === void 0 ? void 0 : _b['comp_damage']) || {}));
                    // Initialize shooting data if not exists
                    if (!entity.shootingData) {
                        entity.shootingData = {
                            lastShotTime: 0,
                            fireRate: 500, // milliseconds between shots
                            target: null,
                            projectiles: []
                        };
                    }
                    var now = performance.now();
                    var canShoot = now - entity.shootingData.lastShotTime >= entity.shootingData.fireRate;
                    // Find target within range
                    var targetTemplateId_1 = aimingProps.targetEntityTemplateId || 'tpl_player';
                    var aimingRange = Number(aimingProps.aimingRange) || 128;
                    var potentialTargets = entities.filter(function (target) {
                        return target.template.id === targetTemplateId_1 &&
                            target.instance.id !== entity.instance.id;
                    });
                    var closestTarget_1 = null;
                    var closestDistance_1 = aimingRange;
                    potentialTargets.forEach(function (target) {
                        var distance = Math.sqrt(Math.pow(target.x - entity.x, 2) +
                            Math.pow(target.y - entity.y, 2));
                        if (distance < closestDistance_1) {
                            closestDistance_1 = distance;
                            closestTarget_1 = target;
                        }
                    });
                    // Shoot at target if found and can shoot
                    if (closestTarget_1 && canShoot && pendingSpawns && entityTemplates) {
                        var dx = closestTarget_1.x - entity.x;
                        var dy = closestTarget_1.y - entity.y;
                        var distance = Math.sqrt(dx * dx + dy * dy);
                        // Find bullet template - prioritize player bullet for player ships
                        var isPlayerShip = entity.template.id === 'tpl_player_ship';
                        var bulletTemplateId_1 = isPlayerShip ? 'tpl_player_bullet' : 'tpl_player_bullet'; // Can add enemy bullets later
                        var bulletTemplate = entityTemplates.find(function (t) { return t.id === bulletTemplateId_1; });
                        if (bulletTemplate) {
                            // Calculate bullet spawn position (from ship center/front)
                            var bulletStartX = entity.x + (entity.sprite.size.width / 2) - 4; // Center bullet
                            var bulletStartY = entity.y - 2; // Slightly above ship
                            // Create bullet entity instance
                            var bulletId = "bullet_".concat(Date.now(), "_").concat(Math.random().toString(36).substring(2, 5));
                            var bulletInstance = {
                                id: bulletId,
                                entityTemplateId: bulletTemplate.id,
                                name: "".concat(bulletTemplate.name, " ").concat(((_c = entity.shootingData.projectiles) === null || _c === void 0 ? void 0 : _c.length) || 0),
                                position: {
                                    x: Math.floor(bulletStartX / TILE_SIZE),
                                    y: Math.floor(bulletStartY / TILE_SIZE)
                                },
                                componentOverrides: {
                                    'comp_physics': {
                                        velocityY: -4 // Always shoot upward for now
                                    },
                                    'comp_damage': {
                                        damageAmount: Number(damageProps.damageAmount) || 1
                                    }
                                }
                            };
                            // Add to pending spawns for processing
                            pendingSpawns.current.push(bulletInstance);
                            entity.shootingData.lastShotTime = now;
                            console.log("\uD83D\uDD2B ".concat(entity.template.name, " fired bullet at (").concat(bulletStartX.toFixed(0), ", ").concat(bulletStartY.toFixed(0), ")"));
                        }
                    }
                    // Initialize shootingData if needed (for tracking fire rate)
                    if (!entity.shootingData) {
                        entity.shootingData = {
                            lastShotTime: 0,
                            fireRate: 500,
                            target: null,
                            projectiles: [] // Keep for compatibility, but bullets are now real entities
                        };
                    }
                }
            });
            // Remove entities marked for destruction
            // Note: This would need to be handled by the calling code
            // as we can't modify the entities array directly here
        }
    },
    cursors: {
        id: 'cursors',
        name: 'Cursor Control Engine',
        execute: function (entities, componentDefinitions, screenMap, entityTemplates, allAssets, pendingSpawns) {
            // Helper function to detect if entity is exiting the screen
            var detectScreenExit = function (entity, newX, newY) {
                var _a, _b, _c;
                if (!screenMap)
                    return null;
                var wallCollisionComp = entity.template.components.find(function (c) { return c.definitionId === 'comp_wall_collision'; });
                if (!wallCollisionComp)
                    return null;
                var props = __assign(__assign({}, wallCollisionComp.defaultValues), (((_a = entity.instance.componentOverrides) === null || _a === void 0 ? void 0 : _a['comp_wall_collision']) || {}));
                // Prioridad: comp_wall_collision > sprite.hitbox > sprite.size
                var spriteHitbox = entity.sprite.hitbox;
                var hitboxWidth = Number(props.hitboxWidth) || (spriteHitbox === null || spriteHitbox === void 0 ? void 0 : spriteHitbox.width) || entity.sprite.size.width;
                var hitboxHeight = Number(props.hitboxHeight) || (spriteHitbox === null || spriteHitbox === void 0 ? void 0 : spriteHitbox.height) || entity.sprite.size.height;
                var offsetX = (props.offsetX !== undefined && Number(props.offsetX) !== 0) ? Number(props.offsetX) : ((_b = spriteHitbox === null || spriteHitbox === void 0 ? void 0 : spriteHitbox.offsetX) !== null && _b !== void 0 ? _b : 0);
                var offsetY = (props.offsetY !== undefined && Number(props.offsetY) !== 0) ? Number(props.offsetY) : ((_c = spriteHitbox === null || spriteHitbox === void 0 ? void 0 : spriteHitbox.offsetY) !== null && _c !== void 0 ? _c : 0);
                var tileSize = Number(props.tileSize) || 8;
                var entityLeft = newX + offsetX;
                var entityTop = newY + offsetY;
                var entityRight = entityLeft + hitboxWidth;
                var entityBottom = entityTop + hitboxHeight;
                var leftTile = Math.floor(entityLeft / tileSize);
                var topTile = Math.floor(entityTop / tileSize);
                var rightTile = Math.floor((entityRight - 1) / tileSize);
                var bottomTile = Math.floor((entityBottom - 1) / tileSize);
                var mapWidth = screenMap.width || 0;
                var mapHeight = screenMap.height || 0;
                // Detectar si está saliendo completamente del mapa
                if (rightTile < 0) {
                    return 'left';
                }
                else if (leftTile >= mapWidth) {
                    return 'right';
                }
                else if (bottomTile < 0) {
                    return 'top';
                }
                else if (topTile >= mapHeight) {
                    return 'bottom';
                }
                return null;
            };
            // Helper function to check if a position would cause wall collision
            var wouldCollideWithWall = function (entity, newX, newY) {
                var _a, _b, _c, _d, _e, _f, _g;
                if (!((_a = screenMap === null || screenMap === void 0 ? void 0 : screenMap.layers) === null || _a === void 0 ? void 0 : _a.collision)) {
                    return false;
                }
                var wallCollisionComp = entity.template.components.find(function (c) { return c.definitionId === 'comp_wall_collision'; });
                // If entity has cursors but no wall collision, create default wall collision
                if (!wallCollisionComp) {
                    var cursorsComp = entity.template.components.find(function (c) { return c.definitionId === 'comp_cursors'; });
                    if (cursorsComp) {
                        wallCollisionComp = {
                            definitionId: 'comp_wall_collision',
                            defaultValues: {
                                hitboxWidth: 12,
                                hitboxHeight: 12,
                                offsetX: 2,
                                offsetY: 2,
                                tileSize: 8,
                                stopOnCollision: true
                            }
                        };
                    }
                    else {
                        return false;
                    }
                }
                var props = __assign(__assign({}, wallCollisionComp.defaultValues), (((_b = entity.instance.componentOverrides) === null || _b === void 0 ? void 0 : _b['comp_wall_collision']) || {}));
                // Prioridad: comp_wall_collision > sprite.hitbox > sprite.size
                var spriteHitbox = entity.sprite.hitbox;
                var hitboxWidth = Number(props.hitboxWidth) || (spriteHitbox === null || spriteHitbox === void 0 ? void 0 : spriteHitbox.width) || entity.sprite.size.width;
                var hitboxHeight = Number(props.hitboxHeight) || (spriteHitbox === null || spriteHitbox === void 0 ? void 0 : spriteHitbox.height) || entity.sprite.size.height;
                var offsetX = (props.offsetX !== undefined && Number(props.offsetX) !== 0) ? Number(props.offsetX) : ((_c = spriteHitbox === null || spriteHitbox === void 0 ? void 0 : spriteHitbox.offsetX) !== null && _c !== void 0 ? _c : 0);
                var offsetY = (props.offsetY !== undefined && Number(props.offsetY) !== 0) ? Number(props.offsetY) : ((_d = spriteHitbox === null || spriteHitbox === void 0 ? void 0 : spriteHitbox.offsetY) !== null && _d !== void 0 ? _d : 0);
                var tileSize = Number(props.tileSize) || 8;
                // Determine movement direction
                var movingHorizontally = newX !== entity.x;
                var movingVertically = newY !== entity.y;
                var movingRight = newX > entity.x;
                var movingLeft = newX < entity.x;
                var movingDown = newY > entity.y;
                var movingUp = newY < entity.y;
                // Calculate entity bounds at new position
                var entityLeft = newX + offsetX;
                var entityTop = newY + offsetY;
                var entityRight = entityLeft + hitboxWidth;
                var entityBottom = entityTop + hitboxHeight;
                // Convert to tile coordinates
                var leftTile = Math.floor(entityLeft / tileSize);
                var topTile = Math.floor(entityTop / tileSize);
                var rightTile = Math.floor(entityRight / tileSize);
                var bottomTile = Math.floor(entityBottom / tileSize);
                // Only check tiles that are relevant to the movement direction
                if (movingHorizontally && !movingVertically) {
                    // ALLOW EDGE EXIT: Let entities move off screen at horizontal edges
                    var SCREEN_WIDTH_PX = (screenMap.width || 0) * tileSize;
                    var EDGE_THRESHOLD = hitboxWidth;
                    var isNearLeftEdge = entityLeft < EDGE_THRESHOLD;
                    var isNearRightEdge = entityRight > SCREEN_WIDTH_PX - EDGE_THRESHOLD;
                    var allowEdgeExit = (movingLeft && isNearLeftEdge) || (movingRight && isNearRightEdge);
                    if (allowEdgeExit) {
                        return false; // Allow movement off screen
                    }
                    // Horizontal movement: only check the leading edge
                    // IMPORTANT: Don't check bottomTile - that's the ground we're standing on
                    var checkTileX = movingRight ? rightTile : leftTile;
                    for (var tileY = topTile; tileY < bottomTile; tileY++) {
                        if (checkTileX < 0 || tileY < 0 ||
                            checkTileX >= (screenMap.width || 0) ||
                            tileY >= (screenMap.height || 0)) {
                            continue;
                        }
                        var tileOnLayer = (_e = screenMap.layers.collision[tileY]) === null || _e === void 0 ? void 0 : _e[checkTileX];
                        if (tileOnLayer && tileOnLayer.tileId) {
                            return true;
                        }
                    }
                }
                else if (movingVertically && !movingHorizontally) {
                    // Vertical movement: only check the leading edge
                    var checkTileY = movingDown ? bottomTile : topTile;
                    for (var tileX = leftTile; tileX <= rightTile; tileX++) {
                        if (tileX < 0 || checkTileY < 0 ||
                            tileX >= (screenMap.width || 0) ||
                            checkTileY >= (screenMap.height || 0)) {
                            continue;
                        }
                        var tileOnLayer = (_f = screenMap.layers.collision[checkTileY]) === null || _f === void 0 ? void 0 : _f[tileX];
                        if (tileOnLayer && tileOnLayer.tileId) {
                            return true;
                        }
                    }
                }
                else {
                    // Diagonal or no movement: check entire area
                    for (var tileY = topTile; tileY <= bottomTile; tileY++) {
                        for (var tileX = leftTile; tileX <= rightTile; tileX++) {
                            if (tileX < 0 || tileY < 0 ||
                                tileX >= (screenMap.width || 0) ||
                                tileY >= (screenMap.height || 0)) {
                                continue;
                            }
                            var tileOnLayer = (_g = screenMap.layers.collision[tileY]) === null || _g === void 0 ? void 0 : _g[tileX];
                            if (tileOnLayer && tileOnLayer.tileId) {
                                return true;
                            }
                        }
                    }
                }
                return false; // No collision
            };
            // Get current pressed keys from the modal's key tracking system (we need to access it from the modal scope)
            // For now, we'll implement a simple key tracking system
            var currentPressedKeys = window.currentPressedKeys || new Set();
            var hasLimitOn = function (entity) {
                var _a, _b, _c;
                var limitComp = entity.template.components.find(function (c) { return c.definitionId === 'comp_limit_on'; });
                var override = (_a = entity.instance.componentOverrides) === null || _a === void 0 ? void 0 : _a['comp_limit_on'];
                if (!limitComp && !override)
                    return false;
                var enabled = (_b = override === null || override === void 0 ? void 0 : override.isEnabled) !== null && _b !== void 0 ? _b : (_c = limitComp === null || limitComp === void 0 ? void 0 : limitComp.defaultValues) === null || _c === void 0 ? void 0 : _c.isEnabled;
                return enabled !== false && enabled !== 'false';
            };
            entities.forEach(function (entity) {
                var _a, _b;
                var cursorsComp = entity.template.components.find(function (c) { return c.definitionId === 'comp_cursors'; });
                if (cursorsComp) {
                    var cursorsProps = __assign(__assign({}, cursorsComp.defaultValues), (((_a = entity.instance.componentOverrides) === null || _a === void 0 ? void 0 : _a['comp_cursors']) || {}));
                    // Only skip if explicitly disabled (not if undefined)
                    if (cursorsProps.isEnabled === false) {
                        return;
                    }
                    var speed = Number(cursorsProps.speed) || 2;
                    // Get allowed directions (default to true if not specified)
                    var allowUp = cursorsProps.allowUp !== false;
                    var allowDown = cursorsProps.allowDown !== false;
                    var allowLeft = cursorsProps.allowLeft !== false;
                    var allowRight = cursorsProps.allowRight !== false;
                    // Check if entity has gravity component
                    var hasGravity = entity.template.components.some(function (c) { return c.definitionId === 'comp_gravity'; });
                    var airControlComp = entity.template.components.find(function (c) { return c.definitionId === 'comp_air_control'; });
                    var airControlProps = airControlComp
                        ? __assign(__assign({}, airControlComp.defaultValues), (((_b = entity.instance.componentOverrides) === null || _b === void 0 ? void 0 : _b['comp_air_control']) || {})) : null;
                    var airControlEnabled = !!airControlProps && airControlProps.isEnabled !== false && airControlProps.isEnabled !== 'false';
                    var airControlMode = airControlEnabled
                        ? String((airControlProps === null || airControlProps === void 0 ? void 0 : airControlProps.airControlMode) || 'locked').trim().toLowerCase()
                        : 'full';
                    var airControlLocked = hasGravity
                        && airControlMode === 'locked'
                        && !entity.isOnLadder
                        && !(entity.isOnGround || entity.isGrounded);
                    if (!airControlLocked) {
                        // Reset horizontal velocity only when air control allows new input this frame.
                        entity.vx = 0;
                    }
                    // Only reset vertical velocity if entity doesn't have gravity
                    if (!hasGravity) {
                        entity.vy = 0;
                    }
                    // Apply movement based on pressed keys with wall collision prevention and allowed directions
                    // If entity has gravity, only allow horizontal movement (vertical is controlled by gravity)
                    if (!hasGravity) {
                        if (allowUp && (currentPressedKeys.has('ArrowUp') || currentPressedKeys.has('KeyW'))) {
                            var newY = entity.y - speed;
                            var exitDirection = detectScreenExit(entity, entity.x, newY);
                            if (exitDirection && !hasLimitOn(entity)) {
                                // Permitir movimiento y marcar cambio de pantalla
                                entity.vy = -speed;
                                screenExitDetectedRef.current = exitDirection;
                            }
                            else if (!wouldCollideWithWall(entity, entity.x, newY)) {
                                entity.vy = -speed;
                            }
                        }
                        if (allowDown && (currentPressedKeys.has('ArrowDown') || currentPressedKeys.has('KeyS'))) {
                            var newY = entity.y + speed;
                            var exitDirection = detectScreenExit(entity, entity.x, newY);
                            if (exitDirection && !hasLimitOn(entity)) {
                                // Permitir movimiento y marcar cambio de pantalla
                                entity.vy = speed;
                                screenExitDetectedRef.current = exitDirection;
                            }
                            else if (!wouldCollideWithWall(entity, entity.x, newY)) {
                                entity.vy = speed;
                            }
                        }
                    }
                    if (!airControlLocked) {
                        // Horizontal movement
                        if (allowLeft && (currentPressedKeys.has('ArrowLeft') || currentPressedKeys.has('KeyA'))) {
                            var newX = entity.x - speed;
                            var exitDirection = detectScreenExit(entity, newX, entity.y);
                            if (exitDirection && !hasLimitOn(entity)) {
                                // Permitir movimiento y marcar cambio de pantalla
                                entity.vx = -speed;
                                screenExitDetectedRef.current = exitDirection;
                            }
                            else if (!wouldCollideWithWall(entity, newX, entity.y)) {
                                entity.vx = -speed;
                            }
                        }
                        if (allowRight && (currentPressedKeys.has('ArrowRight') || currentPressedKeys.has('KeyD'))) {
                            var newX = entity.x + speed;
                            var exitDirection = detectScreenExit(entity, newX, entity.y);
                            if (exitDirection && !hasLimitOn(entity)) {
                                // Permitir movimiento y marcar cambio de pantalla
                                entity.vx = speed;
                                screenExitDetectedRef.current = exitDirection;
                            }
                            else if (!wouldCollideWithWall(entity, newX, entity.y)) {
                                entity.vx = speed;
                            }
                        }
                    }
                }
            });
        }
    },
    physics: {
        id: 'physics',
        name: 'Physics Engine',
        execute: function (entities, componentDefinitions) {
            entities.forEach(function (entity) {
                var _a;
                var physicsComp = entity.template.components.find(function (c) { return c.definitionId === 'comp_physics'; });
                if (physicsComp) {
                    var physicsProps = __assign(__assign({}, physicsComp.defaultValues), (((_a = entity.instance.componentOverrides) === null || _a === void 0 ? void 0 : _a['comp_physics']) || {}));
                    // Apply physics velocities to entity movement.
                    // NOTE: These are OVERRIDES (=), not accumulations (+=).
                    // Using += would add the velocity on every frame, causing infinite acceleration.
                    var velocityX = Number(physicsProps.velocityX) || 0;
                    var velocityY = Number(physicsProps.velocityY) || 0;
                    // Only override velocity if a non-zero physics velocity is defined
                    if (velocityX !== 0)
                        entity.vx = velocityX;
                    if (velocityY !== 0)
                        entity.vy = velocityY;
                    // Apply friction if specified
                    var friction = Number(physicsProps.friction) || 0;
                    if (friction > 0) {
                        var frictionFactor = friction / 255; // Normalize to 0-1
                        entity.vx *= (1 - frictionFactor);
                        entity.vy *= (1 - frictionFactor);
                    }
                }
            });
        }
    },
    collision: engines_1.entityCollisionEngine,
    wallCollision: engines_1.wallCollisionEngine,
    tileCollection: {
        id: 'tileCollection',
        name: 'Tile Collection Engine',
        execute: function (entities, componentDefinitions, screenMap, entityTemplates, allAssets) {
            var _a;
            if (!screenMap || !((_a = screenMap.layers) === null || _a === void 0 ? void 0 : _a.background))
                return;
            entities.forEach(function (entity) {
                var _a, _b;
                var tileCollectorComp = entity.template.components.find(function (c) { return c.definitionId === 'comp_tile_collector'; });
                var inventoryComp = entity.template.components.find(function (c) { return c.definitionId === 'comp_inventory'; });
                if (tileCollectorComp) {
                    var now_1 = Date.now();
                    var collectorProps_1 = __assign(__assign({}, tileCollectorComp.defaultValues), (((_a = entity.instance.componentOverrides) === null || _a === void 0 ? void 0 : _a['comp_tile_collector']) || {}));
                    console.log('🎯 Tile Collector - Entity pos:', entity.x, entity.y, 'Props:', collectorProps_1);
                    var inventoryProps_1 = null;
                    if (inventoryComp) {
                        inventoryProps_1 = __assign(__assign({}, inventoryComp.defaultValues), (((_b = entity.instance.componentOverrides) === null || _b === void 0 ? void 0 : _b['comp_inventory']) || {}));
                    }
                    if (!collectorProps_1.isEnabled)
                        return;
                    // Initialize inventory data if needed
                    if (!entity.inventoryData && inventoryProps_1) {
                        entity.inventoryData = {
                            currentItemCount: Number(inventoryProps_1.currentItemCount) || 0,
                            totalScore: Number(inventoryProps_1.totalScore) || 0,
                            collectedItems: [] // Track what was collected for advanced features
                        };
                    }
                    if (!entity.jumpData) {
                        entity.jumpData = { bonusCharges: 0 };
                    }
                    if (!entity.tileCollectorData) {
                        entity.tileCollectorData = { bonusRespawns: [] };
                    }
                    var dueBonusRespawns = entity.tileCollectorData.bonusRespawns.filter(function (respawn) { return now_1 >= respawn.respawnAt; });
                    entity.tileCollectorData.bonusRespawns = entity.tileCollectorData.bonusRespawns.filter(function (respawn) { return now_1 < respawn.respawnAt; });
                    // Calculate entity's current tile position
                    var collectionRadius_1 = Number(collectorProps_1.collectionRadius) || 4;
                    var tileX = Math.floor((entity.x + 8) / 16); // Assuming 16x16 tiles
                    var tileY = Math.floor((entity.y + 8) / 16);
                    // Get collectible tile IDs
                    var collectibleTileIds_1 = (collectorProps_1.collectibleTileIds || 'dot,powerup,fruit')
                        .split(',')
                        .map(function (id) { return id.trim(); });
                    var replacementTileId_1 = collectorProps_1.replacementTileId || 'empty';
                    var bonusTileId_1 = typeof collectorProps_1.bonusTileId === 'string' ? collectorProps_1.bonusTileId : '';
                    var bonusReplacementTileId_1 = collectorProps_1.bonusReplacementTileId || 'empty';
                    var bonusRespawnSeconds_1 = Math.max(0, Math.min(255, Number(collectorProps_1.bonusRespawnSeconds) || 0));
                    var bonusEntityEffect_1 = typeof collectorProps_1.bonusEntityEffect === 'string'
                        ? collectorProps_1.bonusEntityEffect.trim().toLowerCase()
                        : 'none';
                    var bonusEffectAmount_1 = Math.max(0, Number(collectorProps_1.bonusEffectAmount) || 0);
                    var bonusSlashStrength_1 = Math.max(1, Math.min(32, Number(collectorProps_1.bonusSlashStrength) || 8));
                    var currentPressedKeys_1 = window.currentPressedKeys || new Set();
                    // Check surrounding tiles for collectibles (Pac-Man style - center collision)
                    var tilesToCheck = [
                        { x: tileX, y: tileY }, // Center tile
                        // Optional: Check adjacent tiles for larger collision radius
                        { x: tileX - 1, y: tileY },
                        { x: tileX + 1, y: tileY },
                        { x: tileX, y: tileY - 1 },
                        { x: tileX, y: tileY + 1 }
                    ];
                    tilesToCheck.forEach(function (tilePos) {
                        var _a, _b;
                        if (tilePos.x < 0 || tilePos.y < 0 ||
                            tilePos.x >= screenMap.width || tilePos.y >= screenMap.height) {
                            return;
                        }
                        // Get tile at position
                        var currentTile = (_a = screenMap.layers.background[tilePos.y]) === null || _a === void 0 ? void 0 : _a[tilePos.x];
                        if (!currentTile)
                            return;
                        var isBonusTile = !!bonusTileId_1 && (currentTile.tileId === bonusTileId_1 ||
                            currentTile.id === bonusTileId_1);
                        var isCollectible = !isBonusTile && collectibleTileIds_1.some(function (collectibleId) {
                            return currentTile.tileId === collectibleId ||
                                currentTile.id === collectibleId;
                        });
                        console.log('🔍 Checking tile at', tilePos.x, tilePos.y, ':', currentTile.tileId, 'collectible:', isCollectible);
                        if (isCollectible || isBonusTile) {
                            // Calculate distance from entity center to tile center for precise collection
                            var tileCenterX = tilePos.x * 16 + 8;
                            var tileCenterY = tilePos.y * 16 + 8;
                            var entityCenterX = entity.x + 8;
                            var entityCenterY = entity.y + 8;
                            var distance = Math.sqrt(Math.pow(entityCenterX - tileCenterX, 2) +
                                Math.pow(entityCenterY - tileCenterY, 2));
                            // Only collect if within collection radius
                            if (distance <= collectionRadius_1) {
                                if (isBonusTile) {
                                    screenMap.layers.background[tilePos.y][tilePos.x] = __assign(__assign({}, currentTile), { tileId: bonusReplacementTileId_1, id: bonusReplacementTileId_1 });
                                    if (bonusEntityEffect_1 === 'grant_extra_jump' && bonusEffectAmount_1 > 0) {
                                        var cursorsComp = entity.template.components.find(function (c) { return c.definitionId === 'comp_cursors'; });
                                        var cursorsProps = cursorsComp
                                            ? __assign(__assign({}, cursorsComp.defaultValues), (((_b = entity.instance.componentOverrides) === null || _b === void 0 ? void 0 : _b['comp_cursors']) || {})) : {};
                                        var allowUp = cursorsProps.allowUp !== false;
                                        var allowDown = cursorsProps.allowDown !== false;
                                        var allowLeft = cursorsProps.allowLeft !== false;
                                        var allowRight = cursorsProps.allowRight !== false;
                                        var upPressed = allowUp && (currentPressedKeys_1.has('ArrowUp') || currentPressedKeys_1.has('KeyW'));
                                        var downPressed = allowDown && (currentPressedKeys_1.has('ArrowDown') || currentPressedKeys_1.has('KeyS'));
                                        var leftPressed = allowLeft && (currentPressedKeys_1.has('ArrowLeft') || currentPressedKeys_1.has('KeyA'));
                                        var rightPressed = allowRight && (currentPressedKeys_1.has('ArrowRight') || currentPressedKeys_1.has('KeyD'));
                                        var slashUpStrength = Math.max(1, bonusSlashStrength_1 - 1);
                                        var slashDownStrength = Math.max(1, bonusSlashStrength_1 - 2);
                                        entity.isOnGround = false;
                                        entity.isGrounded = false;
                                        if (!upPressed && !downPressed && !leftPressed && !rightPressed) {
                                            if (allowUp) {
                                                entity.vx = 0;
                                                entity.vy = -4;
                                            }
                                        }
                                        else if (upPressed && rightPressed) {
                                            entity.vx = slashUpStrength;
                                            entity.vy = -3;
                                        }
                                        else if (upPressed && leftPressed) {
                                            entity.vx = -slashUpStrength;
                                            entity.vy = -3;
                                        }
                                        else if (downPressed && rightPressed) {
                                            entity.vx = slashDownStrength;
                                            entity.vy = 1;
                                        }
                                        else if (downPressed && leftPressed) {
                                            entity.vx = -slashDownStrength;
                                            entity.vy = 1;
                                        }
                                        else if (rightPressed) {
                                            entity.vx = bonusSlashStrength_1;
                                            entity.vy = -1;
                                        }
                                        else if (leftPressed) {
                                            entity.vx = -bonusSlashStrength_1;
                                            entity.vy = -1;
                                        }
                                        else if (downPressed) {
                                            entity.vx = 0;
                                            entity.vy = 2;
                                        }
                                        else if (upPressed) {
                                            entity.vx = 0;
                                            entity.vy = -4;
                                        }
                                    }
                                    if (bonusRespawnSeconds_1 > 0) {
                                        entity.tileCollectorData.bonusRespawns = entity.tileCollectorData.bonusRespawns.filter(function (respawn) {
                                            return respawn.position.x !== tilePos.x || respawn.position.y !== tilePos.y;
                                        });
                                        entity.tileCollectorData.bonusRespawns.push({
                                            position: { x: tilePos.x, y: tilePos.y },
                                            tileId: bonusTileId_1,
                                            respawnAt: now_1 + (bonusRespawnSeconds_1 * 1000)
                                        });
                                    }
                                    if (collectorProps_1.bonusSoundId) {
                                        console.log("\uD83D\uDD0A Playing bonus collection sound: ".concat(collectorProps_1.bonusSoundId));
                                    }
                                    return;
                                }
                                // Replace tile with empty/floor tile
                                screenMap.layers.background[tilePos.y][tilePos.x] = __assign(__assign({}, currentTile), { tileId: replacementTileId_1, id: replacementTileId_1 });
                                // Update inventory
                                if (entity.inventoryData && inventoryProps_1) {
                                    entity.inventoryData.currentItemCount++;
                                    entity.inventoryData.totalScore += Number(inventoryProps_1.scorePerItem) || 10;
                                    entity.inventoryData.collectedItems.push({
                                        tileId: currentTile.tileId,
                                        position: { x: tilePos.x, y: tilePos.y },
                                        timestamp: Date.now()
                                    });
                                    console.log("\uD83C\uDF52 ".concat(entity.template.name, " collected ").concat(currentTile.tileId, "! Total: ").concat(entity.inventoryData.currentItemCount, ", Score: ").concat(entity.inventoryData.totalScore));
                                }
                                // Play collection sound if specified
                                if (collectorProps_1.collectionSoundId) {
                                    // TODO: Implement sound playing
                                    console.log("\uD83D\uDD0A Playing collection sound: ".concat(collectorProps_1.collectionSoundId));
                                }
                            }
                        }
                    });
                    dueBonusRespawns.forEach(function (respawn) {
                        var targetRow = screenMap.layers.background[respawn.position.y];
                        var targetTile = targetRow === null || targetRow === void 0 ? void 0 : targetRow[respawn.position.x];
                        if (targetTile) {
                            targetRow[respawn.position.x] = __assign(__assign({}, targetTile), { tileId: respawn.tileId, id: respawn.tileId });
                        }
                    });
                }
            });
        }
    },
    rotation: {
        id: 'rotation',
        name: 'Sprite Rotation Engine',
        execute: function (entities, componentDefinitions) {
            entities.forEach(function (entity) {
                var _a;
                var rotateComp = entity.template.components.find(function (c) { return c.definitionId === 'comp_rotate'; });
                if (rotateComp) {
                    var rotateProps = __assign(__assign({}, rotateComp.defaultValues), (((_a = entity.instance.componentOverrides) === null || _a === void 0 ? void 0 : _a['comp_rotate']) || {}));
                    // Initialize rotation data if needed
                    if (!entity.rotationData) {
                        entity.rotationData = {
                            rotation: Number(rotateProps.rotation) || 0,
                            facingDirection: Number(rotateProps.facingDirection) || 0,
                            lastDirection: 0
                        };
                    }
                    // Update facing direction based on movement velocity
                    var newDirection = entity.rotationData.facingDirection;
                    var newRotation = entity.rotationData.rotation;
                    if (entity.vx > 0) {
                        // Moving right
                        newDirection = 0;
                        newRotation = 0;
                    }
                    else if (entity.vx < 0) {
                        // Moving left
                        newDirection = 2;
                        newRotation = 180;
                    }
                    else if (entity.vy < 0) {
                        // Moving up
                        newDirection = 1;
                        newRotation = 90;
                    }
                    else if (entity.vy > 0) {
                        // Moving down
                        newDirection = 3;
                        newRotation = 270;
                    }
                    // Only update if direction changed
                    if (newDirection !== entity.rotationData.facingDirection) {
                        entity.rotationData.facingDirection = newDirection;
                        entity.rotationData.rotation = newRotation;
                        entity.rotationData.lastDirection = newDirection;
                        console.log("\uD83D\uDD04 ".concat(entity.template.name, " rotation: direction=").concat(newDirection, ", rotation=").concat(newRotation, "\u00B0, frames=").concat(entity.frameImages.length));
                        // Update current animation frame based on direction for auto-generated sprites
                        var baseFrameCount = entity.sprite.frames.length; // Original frames before generation
                        var totalFrames = entity.frameImages.length;
                        if (totalFrames === baseFrameCount * 4) {
                            // Auto-generated system: 4 rotations per base frame
                            // Structure: [base0_right, base0_up, base0_left, base0_down, base1_right, base1_up, ...]
                            var framesPerDirection = baseFrameCount;
                            var baseFrame = newDirection * framesPerDirection;
                            entity.currentFrame = baseFrame; // Start with first frame of new direction
                            entity.baseFrameForDirection = baseFrame; // Store for animation engine
                            entity.framesPerDirection = framesPerDirection; // Store for animation system
                            console.log("\uD83C\uDFAD ".concat(entity.template.name, " switched to direction ").concat(newDirection, ", base frame ").concat(baseFrame, " (auto-generated, ").concat(framesPerDirection, " frames per direction)"));
                        }
                        else if (entity.frameImages.length >= 8) {
                            // 8-frame manual system: 2 frames per direction (open/closed mouth)
                            var baseFrame = newDirection * 2;
                            entity.currentFrame = baseFrame;
                            entity.baseFrameForDirection = baseFrame;
                            console.log("\uD83C\uDFAD ".concat(entity.template.name, " switched to direction ").concat(newDirection, ", base frame ").concat(baseFrame, " (8-frame manual system)"));
                        }
                        else if (entity.frameImages.length >= 4) {
                            // 4-frame system: one frame per direction 
                            entity.currentFrame = newDirection;
                            console.log("\uD83C\uDFAD ".concat(entity.template.name, " switched to frame ").concat(newDirection, " for direction (4-frame system)"));
                        }
                        else if (entity.frameImages.length > 1) {
                            // For sprites with fewer frames, cycle through available frames
                            entity.currentFrame = newDirection % entity.frameImages.length;
                            console.log("\uD83C\uDFAD ".concat(entity.template.name, " cycled to frame ").concat(entity.currentFrame, " (").concat(entity.frameImages.length, " total frames)"));
                        }
                        else {
                            console.log("\uD83C\uDFAD ".concat(entity.template.name, " has only 1 frame - no visual rotation"));
                        }
                        // For single-frame sprites, keep currentFrame as 0
                    }
                }
            });
        }
    },
    stateMachine: {
        id: 'stateMachine',
        name: 'State Machine Engine',
        execute: function (entities, componentDefinitions) {
            entities.forEach(function (entity) {
                var _a;
                if (!entity.stateMachine || !entity.currentState)
                    return;
                var currentStateDef = entity.stateMachine.states.find(function (s) { return s.name === entity.currentState; });
                if (!currentStateDef)
                    return;
                // Execute onEnter actions if this is the first frame for this state
                if (!entity.stateData) {
                    entity.stateData = {
                        currentStateName: entity.currentState,
                        stateStartTime: performance.now(),
                        hasExecutedOnEnter: false
                    };
                }
                // Execute onEnter actions once when entering a new state
                if (!entity.stateData.hasExecutedOnEnter || entity.stateData.currentStateName !== entity.currentState) {
                    entity.stateData.currentStateName = entity.currentState;
                    entity.stateData.stateStartTime = performance.now();
                    entity.stateData.hasExecutedOnEnter = true;
                    console.log("\uD83C\uDFAF Executing onEnter actions for state: ".concat(entity.currentState, " on entity: ").concat(entity.template.name, " (").concat(entity.instance.name, ")"));
                    console.log("\uD83D\uDCCB State definition:", currentStateDef);
                    if (currentStateDef.onEnter && currentStateDef.onEnter.length > 0) {
                        console.log("\uD83C\uDFAC Found ".concat(currentStateDef.onEnter.length, " onEnter actions"));
                        currentStateDef.onEnter.forEach(function (action, index) {
                            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
                            console.log("\uD83C\uDFAD Executing action ".concat(index + 1, "/").concat(currentStateDef.onEnter.length, ":"), action);
                            switch (action.type) {
                                case 'SET_VELOCITY':
                                    var vx = Number((_a = action.params) === null || _a === void 0 ? void 0 : _a.x) || 0;
                                    var vy = Number((_b = action.params) === null || _b === void 0 ? void 0 : _b.y) || 0;
                                    var prevVx = entity.vx;
                                    var prevVy = entity.vy;
                                    entity.vx = vx;
                                    entity.vy = vy;
                                    console.log("\u26A1 SET_VELOCITY: (".concat(prevVx, ", ").concat(prevVy, ") \u2192 (").concat(vx, ", ").concat(vy, ") for ").concat(entity.template.name));
                                    break;
                                case 'PLAY_SOUND':
                                    console.log("\uD83D\uDD0A PLAY_SOUND: ".concat((_c = action.params) === null || _c === void 0 ? void 0 : _c.soundId, " for ").concat(entity.template.name));
                                    break;
                                case 'CHANGE_SPRITE': {
                                    var spriteName_1 = ((_d = action.params) === null || _d === void 0 ? void 0 : _d.sprite) || ((_e = action.params) === null || _e === void 0 ? void 0 : _e.spriteName) || ((_f = action.params) === null || _f === void 0 ? void 0 : _f.sprite_name);
                                    var spriteAssetData = allAssets.find(function (a) {
                                        var _a, _b;
                                        return a.type === 'sprite' &&
                                            (((_a = a.data) === null || _a === void 0 ? void 0 : _a.name) === spriteName_1 || ((_b = a.data) === null || _b === void 0 ? void 0 : _b.id) === spriteName_1 || a.name === spriteName_1);
                                    });
                                    var spriteData_1 = spriteAssetData === null || spriteAssetData === void 0 ? void 0 : spriteAssetData.data;
                                    if ((_g = spriteData_1 === null || spriteData_1 === void 0 ? void 0 : spriteData_1.frames) === null || _g === void 0 ? void 0 : _g.length) {
                                        entity.sprite = spriteData_1;
                                        entity.spriteAssetId = spriteAssetData === null || spriteAssetData === void 0 ? void 0 : spriteAssetData.id;
                                        entity.currentFrame = 0;
                                        entity.lastFrameUpdateTime = performance.now();
                                        entity.isAnimationPlaying = true;
                                        entity.frameImages = spriteData_1.frames.map(function (frame) {
                                            var img = new Image();
                                            img.src = (0, screenUtils_1.createSpriteDataURL)(frame.data, spriteData_1.size.width, spriteData_1.size.height);
                                            return img;
                                        });
                                        entity.mirroredFrameImages = ['right', 'left'].includes(spriteData_1.facingDirection)
                                            ? spriteData_1.frames.map(function (frame) {
                                                var img = new Image();
                                                img.src = (0, screenUtils_1.createSpriteDataURL)((0, spriteUtils_1.mirrorPixelDataHorizontally)(frame.data), spriteData_1.size.width, spriteData_1.size.height);
                                                return img;
                                            })
                                            : undefined;
                                    }
                                    break;
                                }
                                case 'SET_ANIMATION':
                                    console.log("\uD83C\uDFAC SET_ANIMATION: ".concat((_h = action.params) === null || _h === void 0 ? void 0 : _h.animationId, " for ").concat(entity.template.name));
                                    break;
                                case 'SET_ANIMATION_SPEED': {
                                    var rawSpeed = (_m = (_k = (_j = action.params) === null || _j === void 0 ? void 0 : _j.speed) !== null && _k !== void 0 ? _k : (_l = action.params) === null || _l === void 0 ? void 0 : _l.speedMs) !== null && _m !== void 0 ? _m : 200;
                                    entity.sprite.animationSpeedMs = ((_o = action.params) === null || _o === void 0 ? void 0 : _o.speed) !== undefined
                                        ? Math.max(16, Math.round(Number(rawSpeed) * (1000 / 60)))
                                        : Math.max(16, Number(rawSpeed) || 200);
                                    break;
                                }
                                case 'TOGGLE_ANIMATION': {
                                    var mode = ((_p = action.params) === null || _p === void 0 ? void 0 : _p.mode) || (((_q = action.params) === null || _q === void 0 ? void 0 : _q.playing) === 0 ? 'stop' : 'start');
                                    entity.isAnimationPlaying = mode === 'toggle'
                                        ? !((_r = entity.isAnimationPlaying) !== null && _r !== void 0 ? _r : true)
                                        : mode !== 'stop';
                                    break;
                                }
                                default:
                                    console.log("\u2753 Unknown action type: ".concat(action.type));
                            }
                        });
                    }
                    else {
                        console.log("\u26A0\uFE0F No onEnter actions found for state: ".concat(entity.currentState));
                    }
                }
                // Continuously execute state actions (if any) - for states that need continuous behavior
                if ((_a = currentStateDef.properties) === null || _a === void 0 ? void 0 : _a.continuousMovement) {
                    // Example: continuous movement based on state properties
                    var moveSpeed = Number(currentStateDef.properties.moveSpeed) || 1;
                    var direction = currentStateDef.properties.direction || 'right';
                    switch (direction) {
                        case 'right':
                            entity.vx = moveSpeed;
                            break;
                        case 'left':
                            entity.vx = -moveSpeed;
                            break;
                        case 'up':
                            entity.vy = -moveSpeed;
                            break;
                        case 'down':
                            entity.vy = moveSpeed;
                            break;
                    }
                }
            });
        }
    },
    pacMovement: engines_1.pacMovementEngine,
    pacmanMovementV2: engines_1.pacmanMovementV2Engine
};
// Engine Detection System
var detectRequiredEngines = function (entities) {
    var requiredEngines = new Set();
    entities.forEach(function (entity) {
        var _a;
        // Check each component to determine required engines
        entity.template.components.forEach(function (comp) {
            switch (comp.definitionId) {
                case 'comp_gravity':
                    requiredEngines.add('gravity');
                    break;
                case 'comp_physics':
                    requiredEngines.add('physics');
                    break;
                case 'comp_animation':
                    requiredEngines.add('animation');
                    break;
                case 'comp_spawner':
                    requiredEngines.add('spawner');
                    break;
                case 'comp_aiming':
                    // Check if entity also has damage component for shooting
                    var hasDamageComp = entity.template.components.some(function (c) { return c.definitionId === 'comp_damage'; });
                    if (hasDamageComp) {
                        requiredEngines.add('shooting');
                    }
                    break;
                case 'comp_cursors':
                    requiredEngines.add('cursors');
                    break;
                case 'comp_collision':
                    requiredEngines.add('collision');
                    // Also activate wallCollision engine for tile-based collision detection
                    requiredEngines.add('wallCollision');
                    break;
                case 'comp_wall_collision':
                    requiredEngines.add('wallCollision');
                    break;
                case 'comp_tile_collector':
                    requiredEngines.add('tileCollection');
                    break;
                case 'comp_rotate':
                    requiredEngines.add('rotation');
                    break;
                case 'comp_pacMovement':
                    requiredEngines.add('pacMovement');
                    break;
                case 'comp_PacmanMovementV2':
                    requiredEngines.add('pacmanMovementV2');
                    break;
                case 'comp_statemachine':
                    requiredEngines.add('stateMachine');
                    break;
            }
        });
        // Check instance overrides for additional engines
        if ((_a = entity.instance.componentOverrides) === null || _a === void 0 ? void 0 : _a.comp_patrol) {
            requiredEngines.add('patrol');
        }
        // Check if entity has a state machine (also check the entity itself)
        if (entity.stateMachine) {
            requiredEngines.add('stateMachine');
        }
    });
    return Array.from(requiredEngines);
};
var ScreenPlayModal = function (_a) {
    var _b;
    var isOpen = _a.isOpen, onClose = _a.onClose, screenMap = _a.screenMap, allAssets = _a.allAssets, entityTemplates = _a.entityTemplates, componentDefinitions = _a.componentDefinitions, currentScreenMode = _a.currentScreenMode, msxFont = _a.msxFont, msxFontColorAttributes = _a.msxFontColorAttributes, tileBanks = _a.tileBanks;
    var canvasRef = (0, react_1.useRef)(null);
    var modalRef = (0, react_1.useRef)(null);
    var animationFrameId = (0, react_1.useRef)();
    var entitiesRef = (0, react_1.useRef)([]);
    var playerRef = (0, react_1.useRef)(null);
    var pressedKeys = (0, react_1.useRef)(new Set());
    var jumpKeyProcessed = (0, react_1.useRef)(false);
    var activeEnginesRef = (0, react_1.useRef)([]);
    var pendingSpawnsRef = (0, react_1.useRef)([]);
    var _c = (0, react_1.useState)(0), entityCount = _c[0], setEntityCount = _c[1];
    var screenExitDetectedRef = (0, react_1.useRef)(null); // 'left', 'right', 'top', 'bottom'
    var _d = (0, react_1.useState)(false), debugMode = _d[0], setDebugMode = _d[1];
    var _e = (0, react_1.useState)(false), isFullScreen = _e[0], setIsFullScreen = _e[1];
    var _f = (0, react_1.useState)(true), entitiesEnabled = _f[0], setEntitiesEnabled = _f[1];
    var _g = (0, react_1.useState)(true), hudEnabled = _g[0], setHudEnabled = _g[1];
    var _h = (0, react_1.useState)(true), physicsEnabled = _h[0], setPhysicsEnabled = _h[1];
    var _j = (0, react_1.useState)(true), animationEnabled = _j[0], setAnimationEnabled = _j[1];
    var fullScreenTimerRef = (0, react_1.useRef)();
    var _k = (0, react_1.useState)(screenMap), currentScreen = _k[0], setCurrentScreen = _k[1];
    // Pac-Man style movement tracking
    var desiredDirection = (0, react_1.useRef)(null);
    var currentDirection = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(function () {
        setCurrentScreen(screenMap);
    }, [screenMap]);
    // Full Screen functionality
    var handleFullScreen = function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    if (!!document.fullscreenElement) return [3 /*break*/, 2];
                    return [4 /*yield*/, document.documentElement.requestFullscreen()];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2: return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error entering fullscreen:', error_1);
                    // Si falla, asegurar que el estado sea correcto
                    setIsFullScreen(false);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleExitFullScreen = function () {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        setIsFullScreen(false);
        if (fullScreenTimerRef.current) {
            clearTimeout(fullScreenTimerRef.current);
        }
    };
    // Handle fullscreen changes (both entering and exiting)
    (0, react_1.useEffect)(function () {
        var handleFullscreenChange = function () {
            var isCurrentlyFullscreen = !!document.fullscreenElement;
            setIsFullScreen(isCurrentlyFullscreen);
            if (isCurrentlyFullscreen) {
                // Entró a fullscreen - iniciar timer de auto-close
                fullScreenTimerRef.current = setTimeout(function () {
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    }
                }, 15000);
            }
            else {
                // Salió de fullscreen - limpiar timer
                if (fullScreenTimerRef.current) {
                    clearTimeout(fullScreenTimerRef.current);
                    fullScreenTimerRef.current = undefined;
                }
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return function () {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);
    // Clean up timer on unmount
    (0, react_1.useEffect)(function () {
        return function () {
            if (fullScreenTimerRef.current) {
                clearTimeout(fullScreenTimerRef.current);
            }
        };
    }, []);
    // Helper function to check if entity can move in a specific direction
    var canMoveInDirection = (0, react_1.useCallback)(function (entity, direction) {
        // Debug logs removed for cleaner output
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        if (!((_a = screenMap === null || screenMap === void 0 ? void 0 : screenMap.layers) === null || _a === void 0 ? void 0 : _a.collision)) {
            // console.log(`🔍 No collision layer found - returning true`);
            return true;
        }
        // Get the actual velocity that would be applied based on direction
        var velocityX = 0, velocityY = 0;
        switch (direction) {
            case 'left':
                velocityX = -1;
                break;
            case 'right':
                velocityX = 1;
                break;
            case 'up':
                velocityY = -1;
                break;
            case 'down':
                velocityY = 1;
                break;
            default: return true;
        }
        // Calculate next position using the actual velocity that would be set
        var nextX = entity.x + velocityX;
        var nextY = entity.y + velocityY;
        // Use same collision detection logic as the movement system
        var wallCollisionComp = entity.template.components.find(function (c) { return c.definitionId === 'comp_wall_collision' || c.definitionId === 'comp_collision'; });
        if (!wallCollisionComp) {
            // console.log(`🔍 No collision component found - returning true`);
            return true;
        }
        // console.log(`🔍 Found collision component: ${wallCollisionComp.definitionId}`);
        var componentId = wallCollisionComp.definitionId;
        var props = __assign(__assign({}, wallCollisionComp.defaultValues), (((_b = entity.instance.componentOverrides) === null || _b === void 0 ? void 0 : _b[componentId]) || {}));
        // Get hitbox values from sprite first, then fallback to collision component
        var hitboxWidth = 12;
        var hitboxHeight = 12;
        var offsetX = 2;
        var offsetY = 2;
        // Try to get sprite hitbox values
        var spriteAssetId;
        // Search in component overrides
        if ((_c = entity.instance) === null || _c === void 0 ? void 0 : _c.componentOverrides) {
            var _loop_1 = function (compId) {
                var compDef = componentDefinitions.find(function (c) { return c.id === compId; });
                var spriteProp = compDef === null || compDef === void 0 ? void 0 : compDef.properties.find(function (p) { return p.type === 'sprite_ref'; });
                if (spriteProp && ((_d = entity.instance.componentOverrides[compId]) === null || _d === void 0 ? void 0 : _d[spriteProp.name])) {
                    spriteAssetId = entity.instance.componentOverrides[compId][spriteProp.name];
                    return "break";
                }
            };
            for (var compId in entity.instance.componentOverrides) {
                var state_1 = _loop_1(compId);
                if (state_1 === "break")
                    break;
            }
        }
        // If not found in overrides, search in template defaults
        if (!spriteAssetId) {
            var _loop_2 = function (comp) {
                var compDef = componentDefinitions.find(function (c) { return c.id === comp.definitionId; });
                var spriteProp = compDef === null || compDef === void 0 ? void 0 : compDef.properties.find(function (p) { return p.type === 'sprite_ref'; });
                if (spriteProp && ((_e = comp.defaultValues) === null || _e === void 0 ? void 0 : _e[spriteProp.name])) {
                    spriteAssetId = comp.defaultValues[spriteProp.name];
                    return "break";
                }
            };
            for (var _i = 0, _l = entity.template.components; _i < _l.length; _i++) {
                var comp = _l[_i];
                var state_2 = _loop_2(comp);
                if (state_2 === "break")
                    break;
            }
        }
        // Get sprite asset and use its hitbox values (solo si allAssets está disponible)
        if (spriteAssetId && allAssets && allAssets.length > 0) {
            var spriteAsset = allAssets.find(function (a) { return a.id === spriteAssetId && a.type === 'sprite'; });
            var sprite = spriteAsset === null || spriteAsset === void 0 ? void 0 : spriteAsset.data;
            if (sprite === null || sprite === void 0 ? void 0 : sprite.hitbox) {
                hitboxWidth = sprite.hitbox.width;
                hitboxHeight = sprite.hitbox.height;
                offsetX = sprite.hitbox.offsetX;
                offsetY = sprite.hitbox.offsetY;
            }
        }
        // Fallback: use collision component values if no sprite hitbox (with Pac-Man style adjustment)
        if (!spriteAssetId || !allAssets || !((_g = (_f = allAssets.find(function (a) { return a.id === spriteAssetId && a.type === 'sprite'; })) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g.hitbox)) {
            hitboxWidth = Number(props.hitboxWidth) > 14 ? 12 : Number(props.hitboxWidth) || 12;
            hitboxHeight = Number(props.hitboxHeight) > 14 ? 12 : Number(props.hitboxHeight) || 12;
            offsetX = Number(props.offsetX) || 2;
            offsetY = Number(props.offsetY) || 2;
        }
        // Check if new position would collide
        var entityLeft = nextX + offsetX;
        var entityTop = nextY + offsetY;
        var entityRight = entityLeft + hitboxWidth;
        var entityBottom = entityTop + hitboxHeight;
        var leftTile = Math.floor(entityLeft / 16);
        var topTile = Math.floor(entityTop / 16);
        var rightTile = Math.floor((entityRight - 1) / 16);
        var bottomTile = Math.floor((entityBottom - 1) / 16);
        // Debug info
        // console.log(`🔍 Checking direction ${direction}: nextPos(${nextX}, ${nextY}), hitbox(${hitboxWidth}×${hitboxHeight}), offset(${offsetX}, ${offsetY})`);
        // console.log(`🔍 Tiles to check: (${leftTile}, ${topTile}) to (${rightTile}, ${bottomTile})`);
        // Check all tiles the entity would occupy
        for (var tileY = topTile; tileY <= bottomTile; tileY++) {
            for (var tileX = leftTile; tileX <= rightTile; tileX++) {
                // Check bounds
                if (tileX < 0 || tileY < 0 || tileX >= screenMap.width || tileY >= screenMap.height) {
                    // console.log(`🔍 Tile (${tileX}, ${tileY}) is out of bounds`);
                    return false;
                }
                // DEBUG: Check collision layer structure - always show when checking tiles
                console.log("\uD83D\uDD0D DEBUG Collision vs Game Flow differences en (".concat(tileX, ",").concat(tileY, "):"), {
                    tilePos: { x: tileX, y: tileY },
                    screenPlayTileSize: actualTileSize,
                    gameFlowTileSize: 8, // Game Flow Preview uses TILE_SIZE = 8
                    entityPixelPos: { x: entity.x, y: entity.y }
                });
                // Use the same structure as the working collision system
                var tileOnLayer = (_h = screenMap.layers.collision[tileY]) === null || _h === void 0 ? void 0 : _h[tileX];
                console.log("\uD83D\uDD0D Tile en (".concat(tileX, ",").concat(tileY, "):"), tileOnLayer);
                // If tile exists and has a tileId, check if it's actually solid (using Game Flow Preview logic)
                if (tileOnLayer && tileOnLayer.tileId) {
                    // Get tileset from allAssets (same as Game Flow Preview)
                    var tileset = allAssets ? allAssets.filter(function (a) { return a.type === 'tile'; }).map(function (a) { return a.data; }) : [];
                    var tileById = new Map(tileset.map(function (t) { return [t.id, t]; }));
                    var isSolid = (_k = (_j = (0, screenUtils_1.getScreenTileLogicalProperties)(tileOnLayer, tileById)) === null || _j === void 0 ? void 0 : _j.isSolid) !== null && _k !== void 0 ? _k : false;
                    console.log("\uD83E\uDDF1 Pac-Man Movement - Tile ".concat(tileOnLayer.tileId, " en (").concat(tileX, ",").concat(tileY, "): isSolid=").concat(isSolid));
                    if (isSolid) {
                        console.log("\uD83D\uDEA7 Tile s\u00F3lido encontrado en (".concat(tileX, ",").concat(tileY, "), tileId: ").concat(tileOnLayer.tileId));
                        return false;
                    }
                    else {
                        console.log("\uD83D\uDFE2 Tile transitable en (".concat(tileX, ",").concat(tileY, "), tileId: ").concat(tileOnLayer.tileId));
                    }
                }
            }
        }
        // console.log(`🔍 No collision found - movement allowed`);
        return true;
    }, [screenMap]);
    // Enhanced condition evaluator that supports compound conditions
    var evaluateCondition = (0, react_1.useCallback)(function (condition, entity, pressedKey, isKeyDown) {
        var _a, _b, _c;
        if (!condition)
            return false;
        var matchesInputKey = function (expectedKey, actualKey) {
            var expected = String(expectedKey !== null && expectedKey !== void 0 ? expectedKey : '').toLowerCase();
            var actual = String(actualKey !== null && actualKey !== void 0 ? actualKey : '').toLowerCase();
            var aliases = {
                up: ['up', 'arrowup'],
                down: ['down', 'arrowdown'],
                left: ['left', 'arrowleft'],
                right: ['right', 'arrowright'],
                space: ['space', ' '],
                fire: ['fire', 'space', ' ', 'keyx', 'x'],
            };
            return (aliases[expected] || [expected]).includes(actual);
        };
        switch (condition.type) {
            case 'KEY_PRESSED':
                return isKeyDown && matchesInputKey((_a = condition.params) === null || _a === void 0 ? void 0 : _a.key, pressedKey);
            case 'KEY_RELEASED':
                return !isKeyDown && matchesInputKey((_b = condition.params) === null || _b === void 0 ? void 0 : _b.key, pressedKey);
            case 'CAN_MOVE_DIRECTION':
                var canMove = canMoveInDirection(entity, (_c = condition.params) === null || _c === void 0 ? void 0 : _c.direction);
                // console.log(`🔍 CAN_MOVE_DIRECTION(${condition.params?.direction}): ${canMove} at position (${entity.x}, ${entity.y})`);
                return canMove;
            case 'IS_WALL_GRABBING':
                return entity.isWallGrabbing === true;
            case 'AND':
                if (!condition.conditions || !Array.isArray(condition.conditions))
                    return false;
                return condition.conditions.every(function (subCondition) {
                    return evaluateCondition(subCondition, entity, pressedKey, isKeyDown);
                });
            case 'OR':
                if (!condition.conditions || !Array.isArray(condition.conditions))
                    return false;
                return condition.conditions.some(function (subCondition) {
                    return evaluateCondition(subCondition, entity, pressedKey, isKeyDown);
                });
            case 'NOT':
                if (!condition.conditions || !Array.isArray(condition.conditions))
                    return false;
                return !evaluateCondition(condition.conditions[0], entity, pressedKey, isKeyDown);
            default:
                return false;
        }
    }, [canMoveInDirection]);
    var checkKeyTransitions = (0, react_1.useCallback)(function (entityId, pressedKey, isKeyDown) {
        var entity = entitiesRef.current.find(function (e) { return e.instance.id === entityId; });
        if (!entity || !entity.stateMachine || !entity.currentState)
            return;
        var currentStateDef = entity.stateMachine.states.find(function (s) { return s.name === entity.currentState; });
        if (!currentStateDef)
            return;
        var _loop_3 = function (transition) {
            if (transition.fromStateId !== currentStateDef.id)
                return "continue";
            var condition = transition.conditions;
            if (!condition)
                return "continue";
            // Use enhanced condition evaluation
            var conditionMet = evaluateCondition(condition, entity, pressedKey, isKeyDown);
            if (conditionMet) {
                var nextState = entity.stateMachine.states.find(function (s) { return s.id === transition.toStateId; });
                if (nextState) {
                    console.log("\uD83D\uDD04 State transition: ".concat(entity.currentState, " \u2192 ").concat(nextState.name, " (key: ").concat(pressedKey, ")"));
                    entity.currentState = nextState.name;
                    if (transition.actions) {
                        for (var _b = 0, _c = transition.actions; _b < _c.length; _b++) {
                            var action = _c[_b];
                            if (action.type === 'SET_VELOCITY') {
                                var newVx = action.params.x || 0;
                                var newVy = action.params.y || 0;
                                console.log("\u26A1 Setting velocity: (".concat(entity.vx, ", ").concat(entity.vy, ") \u2192 (").concat(newVx, ", ").concat(newVy, ")"));
                                entity.vx = newVx;
                                entity.vy = newVy;
                            }
                        }
                    }
                    return { value: void 0 };
                }
            }
        };
        for (var _i = 0, _a = entity.stateMachine.transitions; _i < _a.length; _i++) {
            var transition = _a[_i];
            var state_3 = _loop_3(transition);
            if (typeof state_3 === "object")
                return state_3.value;
        }
    }, [evaluateCondition]);
    var handleKeyDown = (0, react_1.useCallback)(function (e) {
        // Don't prevent default for arrow keys - let them propagate to window event listeners
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }
        if (playerRef.current && !pressedKeys.current.has(e.key)) {
            pressedKeys.current.add(e.key);
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                checkKeyTransitions(playerRef.current.instance.id, e.key, true);
            }
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    }, [checkKeyTransitions, onClose]);
    var handleKeyUp = (0, react_1.useCallback)(function (e) {
        if (playerRef.current && pressedKeys.current.has(e.key)) {
            pressedKeys.current.delete(e.key);
            // Only call checkKeyTransitions for KeyUp for non-movement keys or specific KEY_RELEASED transitions
            // For movement keys, we mainly care about KeyDown events
            if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                checkKeyTransitions(playerRef.current.instance.id, e.key, false);
            }
        }
        // Reset jump key processed flag when space is released
        if (e.key === ' ') {
            jumpKeyProcessed.current = false;
        }
    }, [checkKeyTransitions]);
    var processSpawnedEntities = (0, react_1.useCallback)(function () {
        if (pendingSpawnsRef.current.length === 0)
            return;
        var newAnimatedEntities = [];
        pendingSpawnsRef.current.forEach(function (instance) {
            var _a, _b, _c, _d;
            console.log('🔄 Processing spawn:', {
                instanceId: instance.id,
                templateId: instance.entityTemplateId,
                position: instance.position
            });
            var template = entityTemplates.find(function (t) { return t.id === instance.entityTemplateId; });
            if (!template) {
                console.error('❌ Template not found:', instance.entityTemplateId);
                return;
            }
            // Get sprite (same logic as existing entity loading)
            var spriteAssetId;
            if (instance.componentOverrides) {
                var _loop_4 = function (compId) {
                    var compDef = componentDefinitions.find(function (c) { return c.id === compId; });
                    var spriteProp = compDef === null || compDef === void 0 ? void 0 : compDef.properties.find(function (p) { return p.type === 'sprite_ref'; });
                    if (spriteProp && ((_a = instance.componentOverrides[compId]) === null || _a === void 0 ? void 0 : _a[spriteProp.name])) {
                        spriteAssetId = instance.componentOverrides[compId][spriteProp.name];
                        return "break";
                    }
                };
                for (var compId in instance.componentOverrides) {
                    var state_4 = _loop_4(compId);
                    if (state_4 === "break")
                        break;
                }
            }
            if (!spriteAssetId) {
                var _loop_5 = function (comp) {
                    var compDef = componentDefinitions.find(function (c) { return c.id === comp.definitionId; });
                    var spriteProp = compDef === null || compDef === void 0 ? void 0 : compDef.properties.find(function (p) { return p.type === 'sprite_ref'; });
                    if (spriteProp && ((_b = comp.defaultValues) === null || _b === void 0 ? void 0 : _b[spriteProp.name])) {
                        spriteAssetId = comp.defaultValues[spriteProp.name];
                        return "break";
                    }
                };
                for (var _i = 0, _e = template.components; _i < _e.length; _i++) {
                    var comp = _e[_i];
                    var state_5 = _loop_5(comp);
                    if (state_5 === "break")
                        break;
                }
            }
            console.log('🖼️ Sprite search:', {
                spriteAssetId: spriteAssetId,
                availableSprites: allAssets.filter(function (a) { return a.type === 'sprite'; }).map(function (a) { return a.id; })
            });
            var spriteAsset = allAssets.find(function (a) { return a.id === spriteAssetId && a.type === 'sprite'; });
            var sprite = spriteAsset === null || spriteAsset === void 0 ? void 0 : spriteAsset.data;
            // Fallback: Use first available sprite if configured sprite not found
            if (!((_c = sprite === null || sprite === void 0 ? void 0 : sprite.frames) === null || _c === void 0 ? void 0 : _c.length)) {
                console.warn('⚠️ Sprite not found, using fallback:', spriteAssetId);
                spriteAsset = allAssets.find(function (a) { return a.type === 'sprite'; });
                sprite = spriteAsset === null || spriteAsset === void 0 ? void 0 : spriteAsset.data;
                if (!((_d = sprite === null || sprite === void 0 ? void 0 : sprite.frames) === null || _d === void 0 ? void 0 : _d.length)) {
                    console.error('❌ No sprites available in project');
                    return;
                }
                console.log('✅ Using fallback sprite:', spriteAsset === null || spriteAsset === void 0 ? void 0 : spriteAsset.id);
            }
            var frameImages = sprite.frames.map(function (frame) {
                var img = new Image();
                img.src = (0, screenUtils_1.createSpriteDataURL)(frame.data, sprite.size.width, sprite.size.height);
                return img;
            });
            // Create fake animation frames for single-frame sprites (for spawned entities)
            if (frameImages.length === 1) {
                console.log('🎭 Creating fake animation frames for single-frame sprite');
                var originalFrame = frameImages[0];
                // Create 3 additional frames with slight variations (tint effects)
                for (var i = 1; i < 4; i++) {
                    var canvas = document.createElement('canvas');
                    canvas.width = sprite.size.width;
                    canvas.height = sprite.size.height;
                    var ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(originalFrame, 0, 0);
                        // Apply different tint for each frame
                        ctx.globalCompositeOperation = 'multiply';
                        ctx.fillStyle = i === 1 ? 'rgba(255, 200, 200, 0.1)' :
                            i === 2 ? 'rgba(200, 255, 200, 0.1)' :
                                'rgba(200, 200, 255, 0.1)';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        var img = new Image();
                        img.src = canvas.toDataURL();
                        frameImages.push(img);
                    }
                }
            }
            var mirroredFrameImages;
            if (['right', 'left'].includes(sprite.facingDirection)) {
                mirroredFrameImages = sprite.frames.map(function (frame) {
                    var mirroredData = (0, spriteUtils_1.mirrorPixelDataHorizontally)(frame.data);
                    var img = new Image();
                    img.src = (0, screenUtils_1.createSpriteDataURL)(mirroredData, sprite.size.width, sprite.size.height);
                    return img;
                });
            }
            var startX = instance.position.x * TILE_SIZE;
            var startY = instance.position.y * TILE_SIZE;
            var newAnimatedEntity = {
                instance: instance,
                template: template,
                sprite: sprite,
                spriteAssetId: spriteAsset === null || spriteAsset === void 0 ? void 0 : spriteAsset.id,
                x: startX,
                y: startY,
                vx: 0,
                vy: 0,
                frameImages: frameImages,
                mirroredFrameImages: mirroredFrameImages,
                currentFrame: 0,
                lastFrameUpdateTime: 0,
                spawnTime: performance.now(),
                isOnGround: false
            };
            console.log('✅ Created animated entity:', {
                id: instance.id,
                templateName: template.name,
                pixelPosition: { x: startX, y: startY },
                tilePosition: instance.position,
                spriteSize: sprite.size,
                framesCount: frameImages.length
            });
            newAnimatedEntities.push(newAnimatedEntity);
        });
        // Add new entities to the main entities list
        entitiesRef.current = __spreadArray(__spreadArray([], entitiesRef.current, true), newAnimatedEntities, true);
        pendingSpawnsRef.current = []; // Clear pending spawns
        if (newAnimatedEntities.length > 0) {
            console.log("\uD83C\uDFAF Spawned ".concat(newAnimatedEntities.length, " new entities. Total entities: ").concat(entitiesRef.current.length));
            console.log('New entities:', newAnimatedEntities.map(function (e) { return ({ name: e.template.name, x: e.x, y: e.y }); }));
            // Update UI state to trigger re-render
            setEntityCount(entitiesRef.current.length);
        }
    }, [entityTemplates, componentDefinitions, allAssets]);
    (0, react_1.useEffect)(function () {
        var _a;
        if (isOpen) {
            (_a = modalRef.current) === null || _a === void 0 ? void 0 : _a.focus();
            pressedKeys.current.clear();
            jumpKeyProcessed.current = false;
        }
        else {
            if (animationFrameId.current)
                cancelAnimationFrame(animationFrameId.current);
        }
    }, [isOpen]);
    (0, react_1.useEffect)(function () {
        if (!isOpen) {
            entitiesRef.current = [];
            playerRef.current = null;
            return;
        }
        var getAsset = function (assetId, assetType) {
            if (!assetId)
                return undefined;
            return allAssets.find(function (a) { return a.id === assetId && a.type === assetType; });
        };
        var entitiesToAnimate = [];
        screenMap.layers.entities.forEach(function (instance) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            var template = entityTemplates.find(function (t) { return t.id === instance.entityTemplateId; });
            if (!template)
                return;
            var spriteAssetId;
            // Get sprite from component overrides or template defaults
            if (instance.componentOverrides) {
                var _loop_6 = function (compId) {
                    var compDef = componentDefinitions.find(function (c) { return c.id === compId; });
                    var spriteProp = compDef === null || compDef === void 0 ? void 0 : compDef.properties.find(function (p) { return p.type === 'sprite_ref'; });
                    if (spriteProp && ((_a = instance.componentOverrides[compId]) === null || _a === void 0 ? void 0 : _a[spriteProp.name])) {
                        spriteAssetId = instance.componentOverrides[compId][spriteProp.name];
                        return "break";
                    }
                };
                for (var compId in instance.componentOverrides) {
                    var state_6 = _loop_6(compId);
                    if (state_6 === "break")
                        break;
                }
            }
            if (!spriteAssetId) {
                var _loop_7 = function (comp) {
                    var compDef = componentDefinitions.find(function (c) { return c.id === comp.definitionId; });
                    var spriteProp = compDef === null || compDef === void 0 ? void 0 : compDef.properties.find(function (p) { return p.type === 'sprite_ref'; });
                    if (spriteProp && ((_b = comp.defaultValues) === null || _b === void 0 ? void 0 : _b[spriteProp.name])) {
                        spriteAssetId = comp.defaultValues[spriteProp.name];
                        return "break";
                    }
                };
                for (var _i = 0, _k = template.components; _i < _k.length; _i++) {
                    var comp = _k[_i];
                    var state_7 = _loop_7(comp);
                    if (state_7 === "break")
                        break;
                }
            }
            var spriteAsset = getAsset(spriteAssetId, 'sprite');
            var sprite = spriteAsset === null || spriteAsset === void 0 ? void 0 : spriteAsset.data;
            if (!((_c = sprite === null || sprite === void 0 ? void 0 : sprite.frames) === null || _c === void 0 ? void 0 : _c.length))
                return;
            var frameImages = sprite.frames.map(function (frame) {
                var img = new Image();
                img.src = (0, screenUtils_1.createSpriteDataURL)(frame.data, sprite.size.width, sprite.size.height);
                return img;
            });
            var mirroredFrameImages;
            if (['right', 'left'].includes(sprite.facingDirection)) {
                mirroredFrameImages = sprite.frames.map(function (frame) {
                    var mirroredData = (0, spriteUtils_1.mirrorPixelDataHorizontally)(frame.data);
                    var img = new Image();
                    img.src = (0, screenUtils_1.createSpriteDataURL)(mirroredData, sprite.size.width, sprite.size.height);
                    return img;
                });
            }
            var stateMachine;
            var currentState;
            var smc = template.components.find(function (c) { return c.definitionId === 'comp_statemachine'; });
            var smcOverride = (_d = instance.componentOverrides) === null || _d === void 0 ? void 0 : _d['comp_statemachine'];
            var stateMachineAssetId = (smcOverride === null || smcOverride === void 0 ? void 0 : smcOverride.stateMachineAssetId) || ((_e = smc === null || smc === void 0 ? void 0 : smc.defaultValues) === null || _e === void 0 ? void 0 : _e.stateMachineAssetId);
            if (stateMachineAssetId && stateMachineAssetId !== '0' && stateMachineAssetId !== '') {
                var stateMachineAsset = getAsset(stateMachineAssetId, 'statemachine');
                stateMachine = stateMachineAsset === null || stateMachineAsset === void 0 ? void 0 : stateMachineAsset.data;
                if (stateMachine) {
                    var instanceCurrentStateId = smcOverride === null || smcOverride === void 0 ? void 0 : smcOverride.currentStateId;
                    var templateCurrentStateId = (_f = smc === null || smc === void 0 ? void 0 : smc.defaultValues) === null || _f === void 0 ? void 0 : _f.currentStateId;
                    var machineInitialStateId = stateMachine.initialStateId;
                    var startStateId_1 = instanceCurrentStateId || templateCurrentStateId || machineInitialStateId;
                    console.log("\uD83C\uDFAF State Machine Initialization for ".concat(template.name, ":"), {
                        instanceName: instance.name,
                        stateMachineAsset: stateMachineAssetId,
                        instanceCurrentStateId: instanceCurrentStateId,
                        templateCurrentStateId: templateCurrentStateId,
                        machineInitialStateId: machineInitialStateId,
                        selectedStartStateId: startStateId_1,
                        availableStates: stateMachine.states.map(function (s) { return ({ id: s.id, name: s.name }); })
                    });
                    var initialState = stateMachine.states.find(function (s) { return s.id === startStateId_1; });
                    if (!initialState && startStateId_1) {
                        initialState = stateMachine.states.find(function (s) { return s.name === startStateId_1; });
                        console.log("\uD83D\uDD0D State found by name: ".concat(initialState === null || initialState === void 0 ? void 0 : initialState.name));
                    }
                    if (!initialState) {
                        initialState = stateMachine.states.find(function (s) { return s.name.toLowerCase() === 'idle'; }) || stateMachine.states[0];
                        console.log("\uD83D\uDD0D Fallback state selected: ".concat(initialState === null || initialState === void 0 ? void 0 : initialState.name));
                    }
                    currentState = initialState === null || initialState === void 0 ? void 0 : initialState.name;
                    console.log("\u2705 Final selected state: ".concat(currentState));
                }
            }
            var startX = instance.position.x * TILE_SIZE;
            var startY = instance.position.y * TILE_SIZE;
            // Check if entity has rotation component and auto-generate rotated sprites
            var hasRotateComponent = template.components.some(function (c) { return c.definitionId === 'comp_rotate'; });
            var finalFrameImages = frameImages;
            if (hasRotateComponent && sprite.frames.length > 0) {
                // Create temporary entity for sprite generation
                var tempEntity = {
                    instance: instance,
                    template: template,
                    sprite: sprite,
                    x: startX, y: startY, vx: 0, vy: 0,
                    frameImages: frameImages,
                    currentFrame: 0, lastFrameUpdateTime: 0, spawnTime: performance.now(), isOnGround: false
                };
                finalFrameImages = generateRotatedSprites(tempEntity);
                console.log("\uD83C\uDFAF Auto-generated directional sprites for ".concat(template.name, ": ").concat(finalFrameImages.length, " total frames"));
            }
            var newAnimatedEntity = {
                instance: instance,
                template: template,
                sprite: sprite,
                spriteAssetId: spriteAsset === null || spriteAsset === void 0 ? void 0 : spriteAsset.id,
                x: startX,
                y: startY,
                vx: 0,
                vy: 0,
                frameImages: finalFrameImages,
                mirroredFrameImages: mirroredFrameImages,
                currentFrame: 0,
                lastFrameUpdateTime: 0,
                spawnTime: performance.now(),
                stateMachine: stateMachine,
                currentState: currentState,
                isOnGround: false
            };
            // Initialize patrol velocity if entity has patrol component
            var patrolComp = (_g = instance.componentOverrides) === null || _g === void 0 ? void 0 : _g.comp_patrol;
            if (patrolComp && patrolComp.waypoint1_x !== undefined && patrolComp.waypoint1_y !== undefined) {
                var patrolStartX = patrolComp.waypoint1_x;
                var patrolStartY = patrolComp.waypoint1_y;
                var patrolEndX = (_h = patrolComp.waypoint2_x) !== null && _h !== void 0 ? _h : patrolStartX;
                var patrolEndY = (_j = patrolComp.waypoint2_y) !== null && _j !== void 0 ? _j : patrolStartY;
                var dx = patrolEndX - patrolStartX;
                var dy = patrolEndY - patrolStartY;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    var speed = Number(patrolComp.speed) || 1;
                    newAnimatedEntity.vx = (dx / dist) * speed;
                    newAnimatedEntity.vy = (dy / dist) * speed;
                }
            }
            entitiesToAnimate.push(newAnimatedEntity);
            // Detect player entity
            if (template.components.some(function (c) { return c.definitionId === 'comp_cursors'; }) ||
                template.components.some(function (c) { return c.definitionId === 'comp_player_input'; }) ||
                template.name === 'Player') {
                playerRef.current = newAnimatedEntity;
            }
        });
        entitiesRef.current = entitiesToAnimate;
        setEntityCount(entitiesToAnimate.length); // Initialize UI counter
        // Dynamic Engine Detection and Registration
        var requiredEngineIds = detectRequiredEngines(entitiesToAnimate);
        var activeEngines = requiredEngineIds.map(function (engineId) { return AVAILABLE_ENGINES[engineId]; }).filter(Boolean);
        activeEnginesRef.current = activeEngines;
        console.log('🎮 Dynamic Engine System:', {
            totalEntities: entitiesToAnimate.length,
            requiredEngines: requiredEngineIds,
            activeEngineCount: activeEngines.length,
            entityTemplates: entitiesToAnimate.map(function (e) { return ({
                name: e.template.name,
                components: e.template.components.map(function (c) { return c.definitionId; })
            }); })
        });
        // DIAGNOSTIC: Log screen map entities and available assets
        console.log('🔍 DIAGNOSTIC INFO:', {
            screenMapEntities: screenMap.layers.entities.length,
            entityInstances: screenMap.layers.entities.map(function (e) {
                var template = entityTemplates.find(function (t) { return t.id === e.entityTemplateId; });
                var hasWallCollision = template === null || template === void 0 ? void 0 : template.components.some(function (c) { return c.definitionId === 'comp_wall_collision'; });
                return {
                    id: e.id,
                    templateId: e.entityTemplateId,
                    name: e.name,
                    position: e.position,
                    templateName: template === null || template === void 0 ? void 0 : template.name,
                    hasWallCollision: hasWallCollision
                };
            }),
            availableTemplates: entityTemplates.map(function (t) { return ({
                id: t.id,
                name: t.name,
                hasWallCollision: t.components.some(function (c) { return c.definitionId === 'comp_wall_collision'; })
            }); }),
            availableSprites: allAssets.filter(function (a) { return a.type === 'sprite'; }).map(function (a) { return ({
                id: a.id,
                name: a.name
            }); }),
            collectorPlayerTemplate: entityTemplates.find(function (t) { return t.id === 'tpl_collector_player'; })
        });
    }, [isOpen, screenMap, allAssets, entityTemplates, componentDefinitions]);
    // HUD image cache
    var hudImageCache = (0, react_1.useRef)(new Map());
    // HUD rendering function
    var renderHUDElements = (0, react_1.useCallback)(function (ctx) {
        var _a;
        var hudElements = (_a = screenMap.hudConfiguration) === null || _a === void 0 ? void 0 : _a.elements;
        if (!hudElements || hudElements.length === 0)
            return;
        console.log('🎨 Rendering HUD elements:', hudElements.length);
        hudElements.forEach(function (hudEl) {
            var _a, _b, _c, _d;
            if (!hudEl.visible)
                return;
            // Check if it's a text-based HUD element
            var isTextBased = [
                'Score', 'HighScore', 'Lives', 'SceneName', 'CoinCounter',
                'AttackAlert', 'TextBox', 'NumericField', 'CustomCounter'
            ].includes(hudEl.type);
            if (isTextBased && (hudEl.text || hudEl.name)) {
                var textToRender = hudEl.text || hudEl.name || "TEXT";
                var charSpacing = ((_a = hudEl.details) === null || _a === void 0 ? void 0 : _a.charSpacing) || 0;
                // Extract TileBank and colors from HUD element details
                var tileBankAssetId_1 = (_b = hudEl.details) === null || _b === void 0 ? void 0 : _b.tileBankAssetId;
                var hudTextColor = ((_c = hudEl.details) === null || _c === void 0 ? void 0 : _c.textColor) || undefined; // Legacy support
                var hudBackgroundColor = ((_d = hudEl.details) === null || _d === void 0 ? void 0 : _d.textBackgroundColor) || undefined;
                console.log("\uD83D\uDDBC\uFE0F Rendering HUD text: \"".concat(textToRender, "\" at (").concat(hudEl.position.x, ", ").concat(hudEl.position.y, ")"));
                console.log("\uD83C\uDFA8 HUD Colors - Text: ".concat(hudTextColor, ", Background: ").concat(hudBackgroundColor, ", TileBank: ").concat(tileBankAssetId_1));
                // Use font from selected TileBank asset or fallback to MSX font
                var fontToUse = msxFont || msxFontRenderer_1.DEFAULT_MSX_FONT;
                var fontColorAttrs = msxFontColorAttributes || {};
                // Check for TileBank asset selection
                if (tileBankAssetId_1 && allAssets) {
                    var selectedTileBankAsset = allAssets.find(function (asset) {
                        return asset.id === tileBankAssetId_1 && asset.type === 'tilebank';
                    });
                    if (selectedTileBankAsset === null || selectedTileBankAsset === void 0 ? void 0 : selectedTileBankAsset.data) {
                        console.log('✅ Found TileBank asset, using tile-based rendering');
                        // TileBank selected - use tile-based rendering
                        var tileBasedFont_1 = (0, msxFontRenderer_1.createTileBasedFont)(tileBanks, allAssets, fontToUse, fontColorAttrs, hudTextColor, hudBackgroundColor);
                        if (tileBasedFont_1) {
                            // Render using tile-based font from TileBank
                            var xOffset = hudEl.position.x;
                            for (var _i = 0, textToRender_1 = textToRender; _i < textToRender_1.length; _i++) {
                                var char = textToRender_1[_i];
                                var tileImg = tileBasedFont_1[char.toUpperCase()] || tileBasedFont_1[char];
                                if (tileImg && tileImg.complete && tileImg.naturalWidth > 0) {
                                    ctx.drawImage(tileImg, xOffset, hudEl.position.y, 8, 8);
                                    console.log("\u2705 Drew TileBank tile for '".concat(char, "' at (").concat(xOffset, ", ").concat(hudEl.position.y, ")"));
                                }
                                else {
                                    // Fallback for missing characters
                                    ctx.fillStyle = hudTextColor || '#FFFFFF';
                                    ctx.font = '6px monospace';
                                    ctx.fillText(char, xOffset + 1, hudEl.position.y + 6);
                                    console.log("\u26A0\uFE0F Used fallback text for '".concat(char, "' at (").concat(xOffset, ", ").concat(hudEl.position.y, ")"));
                                }
                                xOffset += 8 + charSpacing;
                            }
                            return; // Exit early if tile-based rendering succeeded
                        }
                    }
                }
                // Fallback: Try legacy tile-based font or MSX font
                var tileBasedFont = (0, msxFontRenderer_1.createTileBasedFont)(tileBanks, allAssets, fontToUse, fontColorAttrs, hudTextColor, hudBackgroundColor);
                if (tileBasedFont) {
                    console.log('✅ Using tile-based font');
                    // Render character by character using tiles
                    var xOffset = hudEl.position.x;
                    for (var _e = 0, textToRender_2 = textToRender; _e < textToRender_2.length; _e++) {
                        var char = textToRender_2[_e];
                        var tileImg = tileBasedFont[char.toUpperCase()] || tileBasedFont[char];
                        if (tileImg && tileImg.complete && tileImg.naturalWidth > 0) {
                            ctx.drawImage(tileImg, xOffset, hudEl.position.y, 8, 8);
                            console.log("\u2705 Drew tile for '".concat(char, "' at (").concat(xOffset, ", ").concat(hudEl.position.y, ")"));
                        }
                        else {
                            // Fallback with custom colors if provided
                            var fallbackBgColor = hudBackgroundColor && hudBackgroundColor !== 'transparent' ? hudBackgroundColor : '#FF0000';
                            var fallbackTextColor = hudTextColor || '#FFFFFF';
                            if (hudBackgroundColor !== 'transparent') {
                                ctx.fillStyle = fallbackBgColor;
                                ctx.fillRect(xOffset, hudEl.position.y, 8, 8);
                            }
                            ctx.fillStyle = fallbackTextColor;
                            ctx.font = '6px monospace';
                            ctx.fillText(char, xOffset + 1, hudEl.position.y + 6);
                            console.log("\u26A0\uFE0F Used fallback for '".concat(char, "' at (").concat(xOffset, ", ").concat(hudEl.position.y, ") with colors ").concat(fallbackTextColor, "/").concat(fallbackBgColor));
                        }
                        xOffset += 8 + charSpacing;
                    }
                }
                else {
                    console.log('❌ No tile-based font, using MSX font fallback');
                    // Fallback to MSX font rendering
                    try {
                        var textImageSrc = (0, msxFontRenderer_1.renderMSX1TextToDataURL)(textToRender, fontToUse, fontColorAttrs, 1, charSpacing, hudTextColor, hudBackgroundColor);
                        var img_1 = new Image();
                        img_1.onload = function () {
                            ctx.drawImage(img_1, hudEl.position.x, hudEl.position.y);
                        };
                        img_1.src = textImageSrc;
                    }
                    catch (error) {
                        console.warn('Failed to render fallback HUD text:', textToRender, error);
                        // Final fallback: simple text with custom colors
                        ctx.fillStyle = hudTextColor || '#FFFFFF';
                        ctx.font = '8px monospace';
                        ctx.fillText(textToRender, hudEl.position.x, hudEl.position.y + 8);
                    }
                }
            }
        });
    }, [(_b = screenMap.hudConfiguration) === null || _b === void 0 ? void 0 : _b.elements, msxFont, msxFontColorAttributes, tileBanks, allAssets]);
    // Key tracking system
    (0, react_1.useEffect)(function () {
        if (!isOpen)
            return;
        var handleKeyDown = function (e) {
            pressedKeys.current.add(e.code);
            // Also add to global for engine access
            if (!window.currentPressedKeys) {
                window.currentPressedKeys = new Set();
            }
            window.currentPressedKeys.add(e.code);
        };
        var handleKeyUp = function (e) {
            pressedKeys.current.delete(e.code);
            if (window.currentPressedKeys) {
                window.currentPressedKeys.delete(e.code);
            }
        };
        // Add event listeners with capture phase to execute BEFORE React handlers
        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('keyup', handleKeyUp, true);
        return function () {
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('keyup', handleKeyUp, true);
            pressedKeys.current.clear();
            if (window.currentPressedKeys) {
                window.currentPressedKeys.clear();
            }
        };
    }, [isOpen]);
    (0, react_1.useEffect)(function () {
        if (!isOpen)
            return;
        var canvas = canvasRef.current;
        var ctx = canvas === null || canvas === void 0 ? void 0 : canvas.getContext('2d');
        if (!canvas || !ctx)
            return;
        ctx.imageSmoothingEnabled = false;
        var tileset = allAssets.filter(function (a) { return a.type === 'tile'; }).map(function (a) { return a.data; });
        var tileById = new Map(tileset.map(function (t) { return [t.id, t]; }));
        var getWallCollisionComponent = function (entity) {
            return entity.template.components.find(function (c) { return c.definitionId === 'comp_wall_collision'; })
                || entity.template.components.find(function (c) { return c.definitionId === 'comp_collision'; });
        };
        var getWallCollisionProps = function (entity) {
            var _a, _b, _c, _d;
            var comp = getWallCollisionComponent(entity);
            if (!comp)
                return null;
            var componentDefaults = ((_a = componentDefinitions
                .find(function (c) { return c.id === comp.definitionId; })) === null || _a === void 0 ? void 0 : _a.properties.reduce(function (acc, prop) {
                acc[prop.name] = prop.defaultValue;
                return acc;
            }, {})) || {};
            var props = __assign(__assign(__assign({}, componentDefaults), comp.defaultValues), (((_b = entity.instance.componentOverrides) === null || _b === void 0 ? void 0 : _b[comp.definitionId]) || {}));
            var spriteHitbox = entity.sprite.hitbox;
            return {
                hitboxWidth: Number(props.hitboxWidth) || (spriteHitbox === null || spriteHitbox === void 0 ? void 0 : spriteHitbox.width) || entity.sprite.size.width,
                hitboxHeight: Number(props.hitboxHeight) || (spriteHitbox === null || spriteHitbox === void 0 ? void 0 : spriteHitbox.height) || entity.sprite.size.height,
                offsetX: (props.offsetX !== undefined && props.offsetX !== '') ? Number(props.offsetX) : ((_c = spriteHitbox === null || spriteHitbox === void 0 ? void 0 : spriteHitbox.offsetX) !== null && _c !== void 0 ? _c : 0),
                offsetY: (props.offsetY !== undefined && props.offsetY !== '') ? Number(props.offsetY) : ((_d = spriteHitbox === null || spriteHitbox === void 0 ? void 0 : spriteHitbox.offsetY) !== null && _d !== void 0 ? _d : 0),
                tileSize: Number(props.tileSize) || TILE_SIZE,
                stopOnCollision: props.stopOnCollision !== false && props.stopOnCollision !== 'false'
            };
        };
        var isSolidCollisionTile = function (tileX, tileY) {
            var _a, _b, _c, _d;
            if (tileX < 0 || tileY < 0 || tileX >= screenMap.width || tileY >= screenMap.height) {
                return true;
            }
            var tileOnLayer = (_b = (_a = screenMap.layers.collision) === null || _a === void 0 ? void 0 : _a[tileY]) === null || _b === void 0 ? void 0 : _b[tileX];
            if (!tileOnLayer || !tileOnLayer.tileId || tileOnLayer.tileId === 'empty') {
                return false;
            }
            return (_d = (_c = (0, screenUtils_1.getScreenTileLogicalProperties)(tileOnLayer, tileById)) === null || _c === void 0 ? void 0 : _c.isSolid) !== null && _d !== void 0 ? _d : false;
        };
        var isSolidCollisionAtPixel = function (x, y, tileSize) {
            if (tileSize === void 0) { tileSize = TILE_SIZE; }
            return isSolidCollisionTile(Math.floor(x / tileSize), Math.floor(y / tileSize));
        };
        // --- Entity Collision Helper Functions (same as GameFlowPreviewModal) ---
        var entityCollisionProps = function (entity) {
            var _a, _b, _c, _d, _e, _f;
            var collisionCompDef = componentDefinitions.find(function (c) { return c.id === 'comp_collision'; });
            if (!collisionCompDef)
                return null;
            var props = __assign(__assign(__assign({}, collisionCompDef.properties.reduce(function (acc, prop) { acc[prop.name] = prop.defaultValue; return acc; }, {})), (((_a = entity.template.components.find(function (c) { return c.definitionId === 'comp_collision'; })) === null || _a === void 0 ? void 0 : _a.defaultValues) || {})), (((_b = entity.instance.componentOverrides) === null || _b === void 0 ? void 0 : _b['comp_collision']) || {}));
            // Prioridad de hitbox: comp_collision > sprite.hitbox > sprite.size
            var spriteHitbox = entity.sprite.hitbox;
            var fallbackWidth = (_c = spriteHitbox === null || spriteHitbox === void 0 ? void 0 : spriteHitbox.width) !== null && _c !== void 0 ? _c : entity.sprite.size.width;
            var fallbackHeight = (_d = spriteHitbox === null || spriteHitbox === void 0 ? void 0 : spriteHitbox.height) !== null && _d !== void 0 ? _d : entity.sprite.size.height;
            var fallbackOffsetX = (_e = spriteHitbox === null || spriteHitbox === void 0 ? void 0 : spriteHitbox.offsetX) !== null && _e !== void 0 ? _e : 0;
            var fallbackOffsetY = (_f = spriteHitbox === null || spriteHitbox === void 0 ? void 0 : spriteHitbox.offsetY) !== null && _f !== void 0 ? _f : 0;
            var result = {
                hitboxWidth: Number(props.hitboxWidth) || fallbackWidth,
                hitboxHeight: Number(props.hitboxHeight) || fallbackHeight,
                offsetX: (props.offsetX !== undefined && props.offsetX !== '' && Number(props.offsetX) !== 0) ? Number(props.offsetX) : fallbackOffsetX,
                offsetY: (props.offsetY !== undefined && props.offsetY !== '' && Number(props.offsetY) !== 0) ? Number(props.offsetY) : fallbackOffsetY,
                collisionLayer: Number(props.collisionLayer) || 1,
                collidesWith: Number(props.collidesWith) || 255,
                isStatic: props.isStatic === true || props.isStatic === 'true',
                isTrigger: props.isTrigger === true || props.isTrigger === 'true' || (typeof props.isTrigger === 'string' && props.isTrigger.toLowerCase() === 'true')
            };
            return result;
        };
        var getHitboxFor = function (entity, props) { return ({
            x: entity.x + (props.offsetX || 0),
            y: entity.y + (props.offsetY || 0),
            width: props.hitboxWidth || entity.sprite.size.width,
            height: props.hitboxHeight || entity.sprite.size.height,
        }); };
        var resolveEntityCollision = function (entityA, entityB, propsA, propsB) {
            var hitboxA = getHitboxFor(entityA, propsA);
            var hitboxB = getHitboxFor(entityB, propsB);
            // Calculate overlap in both axes
            var overlapX = Math.min(hitboxA.x + hitboxA.width - hitboxB.x, hitboxB.x + hitboxB.width - hitboxA.x);
            var overlapY = Math.min(hitboxA.y + hitboxA.height - hitboxB.y, hitboxB.y + hitboxB.height - hitboxA.y);
            // Determine if entities are static (immovable) or dynamic
            var isAStatic = propsA.isStatic === true || propsA.isStatic === 'true';
            var isBStatic = propsB.isStatic === true || propsB.isStatic === 'true';
            // If both are static, no resolution needed
            if (isAStatic && isBStatic)
                return;
            // Find minimum translation vector (MTV) - separate on axis with less overlap
            if (overlapX < overlapY) {
                // Separate on X axis
                var direction = (hitboxA.x + hitboxA.width / 2) < (hitboxB.x + hitboxB.width / 2) ? -1 : 1;
                var separation = overlapX * direction;
                if (isAStatic) {
                    entityB.x -= separation;
                    entityB.vx = 0;
                }
                else if (isBStatic) {
                    entityA.x += separation;
                    entityA.vx = 0;
                }
                else {
                    var halfSep = separation / 2;
                    entityA.x += halfSep;
                    entityB.x -= halfSep;
                    var tempVx = entityA.vx;
                    entityA.vx = entityB.vx;
                    entityB.vx = tempVx;
                }
            }
            else {
                // Separate on Y axis
                var direction = (hitboxA.y + hitboxA.height / 2) < (hitboxB.y + hitboxB.height / 2) ? -1 : 1;
                var separation = overlapY * direction;
                if (isAStatic) {
                    entityB.y -= separation;
                    entityB.vy = 0;
                }
                else if (isBStatic) {
                    entityA.y += separation;
                    entityA.vy = 0;
                }
                else {
                    var halfSep = separation / 2;
                    entityA.y += halfSep;
                    entityB.y -= halfSep;
                    var tempVy = entityA.vy;
                    entityA.vy = entityB.vy;
                    entityB.vy = tempVy;
                }
            }
        };
        // Pre-render tiles to offscreen buffer (optimization)
        var tileBuffer = document.createElement('canvas');
        tileBuffer.width = PREVIEW_WIDTH;
        tileBuffer.height = PREVIEW_HEIGHT;
        var tileCtx = tileBuffer.getContext('2d');
        if (tileCtx) {
            tileCtx.imageSmoothingEnabled = false;
            // Draw background color
            var bgColor = (0, screenModeConfig_1.getBackgroundColorHex)(screenMap.backgroundColor, currentScreenMode);
            tileCtx.fillStyle = bgColor;
            tileCtx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
            // Render all tiles to buffer once
            (0, screenUtils_1.renderScreenToCanvas)(tileBuffer, screenMap, tileset, currentScreenMode, TILE_SIZE);
        }
        var animate = function () {
            // 1. Clear canvas
            ctx.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
            // 2. Draw pre-rendered tile buffer (much faster than redrawing tiles)
            if (tileBuffer) {
                ctx.drawImage(tileBuffer, 0, 0);
            }
            (0, bossRenderUtils_1.renderBossInstancesToCanvas)(ctx, screenMap, allAssets, tileset, currentScreenMode, TILE_SIZE, {
                frame: Math.floor(performance.now() / (1000 / 30)),
                playerXChar: playerRef.current ? Math.floor(playerRef.current.x / TILE_SIZE) : undefined,
                playerYChar: playerRef.current ? Math.floor(playerRef.current.y / TILE_SIZE) : undefined,
            });
            // 3. Render HUD elements (only if hudEnabled is true)
            if (hudEnabled) {
                renderHUDElements(ctx);
            }
            // Execute Animation Engine independently (controlled by animationEnabled)
            if (animationEnabled) {
                var animationEngine = activeEnginesRef.current.find(function (e) { return e.id === 'animation'; });
                if (animationEngine) {
                    animationEngine.execute(entitiesRef.current, componentDefinitions, screenMap, entityTemplates, allAssets, pendingSpawnsRef);
                }
            }
            // Compute isOnGround for all entities before executing engines.
            // IMPORTANT: Must run for any entity with comp_gravity, not just comp_collision.
            if (physicsEnabled) {
                entitiesRef.current.forEach(function (entity) {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
                    var hasGravityComp = entity.template.components.some(function (c) { return c.definitionId === 'comp_gravity'; });
                    var hasCollisionComp = entity.template.components.some(function (c) {
                        return c.definitionId === 'comp_collision' || c.definitionId === 'comp_wall_collision';
                    });
                    // Only run ground check for entities that have gravity or collision
                    if (!hasGravityComp && !hasCollisionComp)
                        return;
                    if ((_a = screenMap === null || screenMap === void 0 ? void 0 : screenMap.layers) === null || _a === void 0 ? void 0 : _a.collision) {
                        var wallProps = getWallCollisionProps(entity);
                        var spriteHitbox = (_b = entity.sprite) === null || _b === void 0 ? void 0 : _b.hitbox;
                        var hitboxWidth = (_d = (_c = wallProps === null || wallProps === void 0 ? void 0 : wallProps.hitboxWidth) !== null && _c !== void 0 ? _c : spriteHitbox === null || spriteHitbox === void 0 ? void 0 : spriteHitbox.width) !== null && _d !== void 0 ? _d : entity.sprite.size.width;
                        var hitboxHeight = (_f = (_e = wallProps === null || wallProps === void 0 ? void 0 : wallProps.hitboxHeight) !== null && _e !== void 0 ? _e : spriteHitbox === null || spriteHitbox === void 0 ? void 0 : spriteHitbox.height) !== null && _f !== void 0 ? _f : entity.sprite.size.height;
                        var offsetX = (_h = (_g = wallProps === null || wallProps === void 0 ? void 0 : wallProps.offsetX) !== null && _g !== void 0 ? _g : spriteHitbox === null || spriteHitbox === void 0 ? void 0 : spriteHitbox.offsetX) !== null && _h !== void 0 ? _h : 0;
                        var offsetY = (_k = (_j = wallProps === null || wallProps === void 0 ? void 0 : wallProps.offsetY) !== null && _j !== void 0 ? _j : spriteHitbox === null || spriteHitbox === void 0 ? void 0 : spriteHitbox.offsetY) !== null && _k !== void 0 ? _k : 0;
                        var tileSize = (_l = wallProps === null || wallProps === void 0 ? void 0 : wallProps.tileSize) !== null && _l !== void 0 ? _l : TILE_SIZE;
                        var hitboxX = entity.x + offsetX;
                        var hitboxY = entity.y + offsetY;
                        var centerX1 = hitboxX + Math.floor(hitboxWidth / 3);
                        var centerX2 = hitboxX + Math.floor((2 * hitboxWidth) / 3);
                        var bottomY = hitboxY + hitboxHeight;
                        var onGround = isSolidCollisionAtPixel(centerX1, bottomY + 1, tileSize)
                            || isSolidCollisionAtPixel(centerX2, bottomY + 1, tileSize);
                        entity.isOnGround = onGround;
                        entity.isGrounded = onGround; // Keep both in sync for wallCollisionEngine compatibility
                    }
                    else {
                        entity.isOnGround = false;
                        entity.isGrounded = false;
                    }
                });
            }
            // Execute Other Game Engines (only if physicsEnabled is true)
            if (physicsEnabled) {
                activeEnginesRef.current.forEach(function (engine) {
                    // Skip animation engine (already executed above)
                    if (engine.id === 'animation') {
                        return;
                    }
                    engine.execute(entitiesRef.current, componentDefinitions, screenMap, entityTemplates, allAssets, pendingSpawnsRef);
                });
                // Jump logic (must be here to access jumpKeyProcessed ref)
                var currentPressedKeys_2 = window.currentPressedKeys || new Set();
                entitiesRef.current.forEach(function (entity) {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
                    var jumpComp = entity.template.components.find(function (c) { return c.definitionId === 'comp_jump'; });
                    if (jumpComp) {
                        var jumpProps = __assign(__assign({}, jumpComp.defaultValues), (((_a = entity.instance.componentOverrides) === null || _a === void 0 ? void 0 : _a['comp_jump']) || {}));
                        var requireKeyRelease = jumpProps.requireKeyRelease !== 'false' && jumpProps.requireKeyRelease !== false;
                        var spacePressed = currentPressedKeys_2.has('Space');
                        var hasGravity = entity.template.components.some(function (c) { return c.definitionId === 'comp_gravity'; });
                        if (!entity.jumpData) {
                            entity.jumpData = { bonusCharges: 0 };
                        }
                        if (hasGravity && spacePressed) {
                            var canJump = !requireKeyRelease || !jumpKeyProcessed.current;
                            if (canJump && entity.isOnGround) {
                                var jumpPower = Number(jumpProps.jumpPower || 256);
                                entity.vy = -jumpPower / 40;
                                jumpKeyProcessed.current = true;
                            }
                            else if (canJump && (entity.jumpData.bonusCharges || 0) > 0) {
                                var jumpPower = Number(jumpProps.jumpPower || 256);
                                entity.vy = -jumpPower / 40;
                                entity.jumpData.bonusCharges--;
                                jumpKeyProcessed.current = true;
                            }
                        }
                        // Match Z80 edge-triggered jump: releasing the key rearms it immediately.
                        if (!spacePressed) {
                            jumpKeyProcessed.current = false;
                        }
                    }
                    var wallGrabComp = entity.template.components.find(function (c) { return c.definitionId === 'comp_wall_grab'; });
                    if (wallGrabComp) {
                        var wallGrabProps = __assign(__assign({}, wallGrabComp.defaultValues), (((_b = entity.instance.componentOverrides) === null || _b === void 0 ? void 0 : _b['comp_wall_grab']) || {}));
                        var wallGrabEnabled = wallGrabProps.isEnabled !== false && wallGrabProps.isEnabled !== 'false';
                        var hasGravity = entity.template.components.some(function (c) { return c.definitionId === 'comp_gravity'; });
                        var grabPressed = currentPressedKeys_2.has('KeyN') || currentPressedKeys_2.has('n') || currentPressedKeys_2.has('N');
                        var onGroundNow = !!entity.isOnGround || !!entity.isGrounded;
                        var wallGrabFacing_1 = entity.isTouchingWallLeft ? 'left' :
                            entity.isTouchingWallRight ? 'right' :
                                undefined;
                        var touchingWall = !!wallGrabFacing_1;
                        var climbSpeed = Math.max(0, Number((_c = wallGrabProps.climbSpeed) !== null && _c !== void 0 ? _c : 1) || 0);
                        var grabDurationFrames = Math.max(0, Number((_d = wallGrabProps.grabDurationFrames) !== null && _d !== void 0 ? _d : 240) || 0);
                        if (onGroundNow && !entity.isWallGrabbing) {
                            entity.wallGrabLockout = false;
                            entity.wallGrabTimerRemaining = undefined;
                        }
                        var canWallGrab = wallGrabEnabled && hasGravity && grabPressed && (!onGroundNow || entity.isWallGrabbing) && !entity.isOnLadder && !entity.wallGrabLockout;
                        var graceFrames = (_e = entity.wallGrabReleaseGraceFrames) !== null && _e !== void 0 ? _e : 0;
                        var wallGrabActiveNow = canWallGrab && (touchingWall || (entity.isWallGrabbing && graceFrames > 0));
                        if (wallGrabActiveNow) {
                            var releaseAfterTimerExpired = false;
                            entity.wallGrabReleaseGraceFrames = touchingWall ? 2 : Math.max(0, graceFrames - 1);
                            entity.vx = 0;
                            if (!entity.isWallGrabbing && entity.wallGrabTimerRemaining === undefined) {
                                entity.wallGrabTimerRemaining = grabDurationFrames;
                            }
                            var climbUpPressed = currentPressedKeys_2.has('ArrowUp');
                            var climbDownPressed = currentPressedKeys_2.has('ArrowDown');
                            var remainingFrames = Math.max(0, (_f = entity.wallGrabTimerRemaining) !== null && _f !== void 0 ? _f : grabDurationFrames);
                            var wallGrabVy = 0;
                            if (climbSpeed > 0 && (climbUpPressed || climbDownPressed)) {
                                wallGrabVy = climbUpPressed ? -climbSpeed : climbSpeed;
                            }
                            releaseAfterTimerExpired = remainingFrames <= 0;
                            var nextTimer = releaseAfterTimerExpired ? 0 : Math.max(0, remainingFrames - 1);
                            entity.wallGrabTimerRemaining = nextTimer;
                            entity.vy = wallGrabVy;
                            entity.gravityVel = ((wallGrabVy & 0xFF) << 8) & 0xFFFF;
                            var applyWallGrabFacing = function (spriteData) {
                                if (!wallGrabFacing_1)
                                    return;
                                if (spriteData.facingDirection === 'right')
                                    entity.isFacingMirrored = wallGrabFacing_1 === 'left';
                                else if (spriteData.facingDirection === 'left')
                                    entity.isFacingMirrored = wallGrabFacing_1 === 'right';
                            };
                            if (!entity.isWallGrabbing) {
                                entity.isWallGrabbing = true;
                            }
                            var grabSpriteId_1 = wallGrabProps.grabSpriteAssetId;
                            if (grabSpriteId_1) {
                                if (!entity.wallGrabSpriteBackup) {
                                    entity.wallGrabSpriteBackup = {
                                        sprite: entity.sprite,
                                        frameImages: entity.frameImages,
                                        mirroredFrameImages: entity.mirroredFrameImages,
                                        currentFrame: entity.currentFrame,
                                        spriteAssetId: entity.spriteAssetId,
                                        isFacingMirrored: entity.isFacingMirrored
                                    };
                                }
                                var grabSpriteAsset = allAssets.find(function (a) {
                                    var _a, _b;
                                    return a.type === 'sprite' && (a.id === grabSpriteId_1 ||
                                        a.name === grabSpriteId_1 ||
                                        ((_a = a.data) === null || _a === void 0 ? void 0 : _a.id) === grabSpriteId_1 ||
                                        ((_b = a.data) === null || _b === void 0 ? void 0 : _b.name) === grabSpriteId_1);
                                });
                                var grabSpriteData_1 = grabSpriteAsset === null || grabSpriteAsset === void 0 ? void 0 : grabSpriteAsset.data;
                                var wasUsingGrabSprite = grabSpriteData_1 && entity.spriteAssetId === grabSpriteAsset.id;
                                var needsGrabSpriteRefresh = !!grabSpriteData_1 && (!wasUsingGrabSprite ||
                                    entity.sprite !== grabSpriteData_1 ||
                                    entity.frameImages.length !== grabSpriteData_1.frames.length);
                                if (grabSpriteData_1 && needsGrabSpriteRefresh) {
                                    var nextFrame = wasUsingGrabSprite
                                        ? Math.min(entity.currentFrame, Math.max(0, grabSpriteData_1.frames.length - 1))
                                        : 0;
                                    var built = {
                                        frames: grabSpriteData_1.frames.map(function (frame) {
                                            var img = new Image();
                                            img.src = (0, screenUtils_1.createSpriteDataURL)(frame.data, grabSpriteData_1.size.width, grabSpriteData_1.size.height);
                                            return img;
                                        }),
                                        mirrored: ['right', 'left'].includes(grabSpriteData_1.facingDirection) ? grabSpriteData_1.frames.map(function (frame) {
                                            var img = new Image();
                                            img.src = (0, screenUtils_1.createSpriteDataURL)((0, spriteUtils_1.mirrorPixelDataHorizontally)(frame.data), grabSpriteData_1.size.width, grabSpriteData_1.size.height);
                                            return img;
                                        }) : undefined
                                    };
                                    entity.sprite = grabSpriteData_1;
                                    entity.frameImages = built.frames;
                                    entity.mirroredFrameImages = built.mirrored;
                                    entity.currentFrame = nextFrame;
                                    entity.lastFrameUpdateTime = performance.now();
                                    entity.spriteAssetId = grabSpriteAsset.id;
                                }
                                if (grabSpriteData_1)
                                    applyWallGrabFacing(grabSpriteData_1);
                            }
                            else {
                                applyWallGrabFacing(entity.sprite);
                            }
                            if (releaseAfterTimerExpired) {
                                entity.wallGrabLockout = true;
                                entity.isWallGrabbing = false;
                                entity.wallGrabReleaseGraceFrames = 0;
                                entity.wallGrabTimerRemaining = undefined;
                                if (entity.wallGrabSpriteBackup) {
                                    var backup = entity.wallGrabSpriteBackup;
                                    entity.sprite = backup.sprite;
                                    entity.frameImages = backup.frameImages;
                                    entity.mirroredFrameImages = backup.mirroredFrameImages;
                                    entity.currentFrame = (_g = backup.currentFrame) !== null && _g !== void 0 ? _g : 0;
                                    entity.spriteAssetId = backup.spriteAssetId;
                                    entity.isFacingMirrored = backup.isFacingMirrored;
                                    entity.lastFrameUpdateTime = performance.now();
                                    entity.wallGrabSpriteBackup = undefined;
                                }
                            }
                        }
                        else if (entity.isWallGrabbing) {
                            // Transition from grabbing to not grabbing
                            entity.isWallGrabbing = false;
                            entity.wallGrabReleaseGraceFrames = 0;
                            if (onGroundNow) {
                                entity.wallGrabTimerRemaining = undefined;
                            }
                            if (entity.wallGrabSpriteBackup) {
                                var backup = entity.wallGrabSpriteBackup;
                                entity.sprite = backup.sprite;
                                entity.frameImages = backup.frameImages;
                                entity.mirroredFrameImages = backup.mirroredFrameImages;
                                entity.currentFrame = (_h = backup.currentFrame) !== null && _h !== void 0 ? _h : 0;
                                entity.spriteAssetId = backup.spriteAssetId;
                                entity.isFacingMirrored = backup.isFacingMirrored;
                                entity.lastFrameUpdateTime = performance.now();
                                entity.wallGrabSpriteBackup = undefined;
                            }
                        }
                    }
                    else {
                        entity.isWallGrabbing = false;
                        entity.wallGrabReleaseGraceFrames = 0;
                        entity.wallGrabTimerRemaining = undefined;
                        entity.wallGrabLockout = false;
                    }
                    var wallJumpComp = entity.template.components.find(function (c) { return c.definitionId === 'comp_wall_jump'; });
                    if (wallJumpComp) {
                        var wallJumpProps = __assign(__assign({}, wallJumpComp.defaultValues), (((_j = entity.instance.componentOverrides) === null || _j === void 0 ? void 0 : _j['comp_wall_jump']) || {}));
                        var wallJumpEnabled = wallJumpProps.isEnabled !== false && wallJumpProps.isEnabled !== 'false';
                        if (!entity.wallJumpData) {
                            entity.wallJumpData = { lockFramesRemaining: 0, lockedVx: 0 };
                        }
                        if (wallJumpEnabled) {
                            var hasGravity = entity.template.components.some(function (c) { return c.definitionId === 'comp_gravity'; });
                            var spacePressed = currentPressedKeys_2.has('Space');
                            var onGroundNow = !!entity.isOnGround || !!entity.isGrounded;
                            var touchingLeft = !!entity.isTouchingWallLeft;
                            var touchingRight = !!entity.isTouchingWallRight;
                            var touchingWall = touchingLeft || touchingRight;
                            if (onGroundNow) {
                                entity.wallJumpData.lockFramesRemaining = 0;
                            }
                            else if (entity.wallJumpData.lockFramesRemaining > 0) {
                                entity.wallJumpData.lockFramesRemaining--;
                                entity.vx = entity.wallJumpData.lockedVx;
                            }
                            var slideFallSpeed = Math.max(0, Number((_k = wallJumpProps.slideFallSpeed) !== null && _k !== void 0 ? _k : 2) || 0);
                            if (hasGravity && !onGroundNow && !entity.isOnLadder && touchingWall && slideFallSpeed > 0 && entity.vy > slideFallSpeed) {
                                entity.vy = slideFallSpeed;
                                entity.gravityVel = (slideFallSpeed << 8) & 0xFFFF;
                            }
                            var canWallJump = hasGravity && !onGroundNow && !entity.isOnLadder && touchingWall && spacePressed && !jumpKeyProcessed.current;
                            if (canWallJump) {
                                var leftPressed = currentPressedKeys_2.has('ArrowLeft') || currentPressedKeys_2.has('KeyA');
                                var rightPressed = currentPressedKeys_2.has('ArrowRight') || currentPressedKeys_2.has('KeyD');
                                var requireAway = wallJumpProps.requirePressAwayFromWall === true || wallJumpProps.requirePressAwayFromWall === 'true';
                                var jumpFromLeftWall = false;
                                var jumpFromRightWall = false;
                                if (requireAway) {
                                    jumpFromLeftWall = touchingLeft && rightPressed;
                                    jumpFromRightWall = touchingRight && leftPressed;
                                }
                                else {
                                    jumpFromLeftWall = touchingLeft && (!touchingRight || rightPressed || !leftPressed);
                                    jumpFromRightWall = !jumpFromLeftWall && touchingRight;
                                }
                                if (jumpFromLeftWall || jumpFromRightWall) {
                                    var horizontalPush = Math.max(1, Number((_l = wallJumpProps.horizontalPush) !== null && _l !== void 0 ? _l : 3) || 3);
                                    var verticalMagnitude = Math.max(1, Number((_m = wallJumpProps.verticalImpulse) !== null && _m !== void 0 ? _m : 1024) || 1024);
                                    var jumpImpulse = ((0x10000 - verticalMagnitude) & 0xFFFF) >>> 0;
                                    var jumpVx = jumpFromLeftWall ? horizontalPush : -horizontalPush;
                                    var lockFrames = Math.max(0, Number((_o = wallJumpProps.lockFrames) !== null && _o !== void 0 ? _o : 8) || 0);
                                    var hi = (jumpImpulse >> 8) & 0xFF;
                                    entity.vx = jumpVx;
                                    entity.wallJumpData.lockedVx = jumpVx;
                                    entity.wallJumpData.lockFramesRemaining = lockFrames;
                                    entity.gravityVel = jumpImpulse;
                                    entity.vy = hi >= 0x80 ? hi - 0x100 : hi;
                                    entity.isOnGround = false;
                                    entity.isGrounded = false;
                                    jumpKeyProcessed.current = true;
                                }
                            }
                        }
                    }
                });
                // --- Slash Attack (player melee, same logic as ASM buildSlashState) ---
                entitiesRef.current.forEach(function (entity) {
                    var _a, _b, _c, _d, _e;
                    var isPlayer = entity.template.components.some(function (c) { return c.definitionId === 'comp_cursors'; });
                    if (!isPlayer)
                        return;
                    if (!entity.slashData) {
                        entity.slashData = { cooldownFrames: 0 };
                    }
                    var attackPressed = currentPressedKeys_2.has('KeyX') || currentPressedKeys_2.has('Space');
                    if (entity.slashData.cooldownFrames > 0) {
                        entity.slashData.cooldownFrames--;
                    }
                    else if (attackPressed) {
                        entity.slashData.cooldownFrames = 10;
                        var hitbox = (_a = entity.sprite) === null || _a === void 0 ? void 0 : _a.hitbox;
                        var hw = (_b = hitbox === null || hitbox === void 0 ? void 0 : hitbox.width) !== null && _b !== void 0 ? _b : 12;
                        var hh = (_c = hitbox === null || hitbox === void 0 ? void 0 : hitbox.height) !== null && _c !== void 0 ? _c : 12;
                        var ox = (_d = hitbox === null || hitbox === void 0 ? void 0 : hitbox.offsetX) !== null && _d !== void 0 ? _d : 2;
                        var oy = (_e = hitbox === null || hitbox === void 0 ? void 0 : hitbox.offsetY) !== null && _e !== void 0 ? _e : 2;
                        var playerCenterX_1 = entity.x + ox + Math.floor(hw / 2);
                        var playerCenterY_1 = entity.y + oy + Math.floor(hh / 2);
                        entitiesRef.current.forEach(function (target) {
                            var _a, _b, _c, _d, _e;
                            if (target.instance.id === entity.instance.id)
                                return;
                            if (target.markedForDestruction)
                                return;
                            var th = (_a = target.sprite) === null || _a === void 0 ? void 0 : _a.hitbox;
                            var tw = (_b = th === null || th === void 0 ? void 0 : th.width) !== null && _b !== void 0 ? _b : 12;
                            var tH = (_c = th === null || th === void 0 ? void 0 : th.height) !== null && _c !== void 0 ? _c : 12;
                            var tox = (_d = th === null || th === void 0 ? void 0 : th.offsetX) !== null && _d !== void 0 ? _d : 2;
                            var toy = (_e = th === null || th === void 0 ? void 0 : th.offsetY) !== null && _e !== void 0 ? _e : 2;
                            var targetCenterX = target.x + tox + Math.floor(tw / 2);
                            var targetCenterY = target.y + toy + Math.floor(tH / 2);
                            var dx = Math.abs(playerCenterX_1 - targetCenterX);
                            var dy = Math.abs(playerCenterY_1 - targetCenterY);
                            if (dx < 15 && dy < 15) {
                                target.markedForDestruction = true;
                            }
                        });
                    }
                });
                // --- Entity vs Entity Collision Detection ---
                var now_2 = performance.now();
                entitiesRef.current.forEach(function (entityA, indexA) {
                    var hasCollisionComp = entityA.template.components.some(function (c) { return c.definitionId === 'comp_collision'; });
                    if (!hasCollisionComp)
                        return;
                    for (var indexB = indexA + 1; indexB < entitiesRef.current.length; indexB++) {
                        var entityB = entitiesRef.current[indexB];
                        var entityBHasCollision = entityB.template.components.some(function (c) { return c.definitionId === 'comp_collision'; });
                        if (!entityBHasCollision)
                            continue;
                        var propsA = entityCollisionProps(entityA);
                        var propsB = entityCollisionProps(entityB);
                        if (!propsA || !propsB)
                            continue;
                        var hitboxA = getHitboxFor(entityA, propsA);
                        var hitboxB = getHitboxFor(entityB, propsB);
                        // Check AABB collision
                        var isColliding = hitboxA.x < hitboxB.x + hitboxB.width &&
                            hitboxA.x + hitboxA.width > hitboxB.x &&
                            hitboxA.y < hitboxB.y + hitboxB.height &&
                            hitboxA.y + hitboxA.height > hitboxB.y;
                        if (isColliding) {
                            var layerA = Number(propsA.collisionLayer) || 0;
                            var collidesWithA = Number(propsA.collidesWith) || 0;
                            var layerB = Number(propsB.collisionLayer) || 0;
                            var collidesWithB = Number(propsB.collidesWith) || 0;
                            // PROTECTION: Ignore collisions in the first 200ms after spawn
                            var SPAWN_GRACE_PERIOD_MS = 200;
                            var entityAAge = now_2 - (entityA.spawnTime || 0);
                            var entityBAge = now_2 - (entityB.spawnTime || 0);
                            if (entityAAge < SPAWN_GRACE_PERIOD_MS || entityBAge < SPAWN_GRACE_PERIOD_MS) {
                                continue;
                            }
                            // Check if layers allow collision (bit mask check)
                            var aCanCollideWithB = (collidesWithA & layerB) !== 0;
                            var bCanCollideWithA = (collidesWithB & layerA) !== 0;
                            if (aCanCollideWithB && bCanCollideWithA) {
                                var isATrigger = propsA.isTrigger;
                                var isBTrigger = propsB.isTrigger;
                                // Only apply physical separation if neither is a trigger
                                if (!isATrigger && !isBTrigger) {
                                    resolveEntityCollision(entityA, entityB, propsA, propsB);
                                }
                            }
                        }
                    }
                });
            }
            // Process any pending spawned entities
            processSpawnedEntities();
            // Update entities position and rendering
            entitiesRef.current.forEach(function (entity) {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
                // Only apply movement and physics if physicsEnabled is true
                if (physicsEnabled) {
                    // Check if movement would cause collision before applying it
                    var newX = entity.x + entity.vx;
                    var newY = entity.y + entity.vy;
                    // Check collision for the new position
                    var wallCollisionComp = entity.template.components.find(function (c) { return c.definitionId === 'comp_wall_collision' || c.definitionId === 'comp_collision'; });
                    if (wallCollisionComp && ((_a = screenMap === null || screenMap === void 0 ? void 0 : screenMap.layers) === null || _a === void 0 ? void 0 : _a.collision)) {
                        var componentId = wallCollisionComp.definitionId;
                        var props = __assign(__assign({}, wallCollisionComp.defaultValues), (((_b = entity.instance.componentOverrides) === null || _b === void 0 ? void 0 : _b[componentId]) || {}));
                        // Get hitbox values from sprite first, then fallback to collision component
                        var hitboxWidth = 12;
                        var hitboxHeight = 12;
                        var offsetX = 2;
                        var offsetY = 2;
                        var tileSize = TILE_SIZE;
                        // Try to get sprite hitbox values
                        var spriteAssetId_1;
                        // Search in component overrides
                        if ((_c = entity.instance) === null || _c === void 0 ? void 0 : _c.componentOverrides) {
                            var _loop_8 = function (compId) {
                                var compDef = componentDefinitions.find(function (c) { return c.id === compId; });
                                var spriteProp = compDef === null || compDef === void 0 ? void 0 : compDef.properties.find(function (p) { return p.type === 'sprite_ref'; });
                                if (spriteProp && ((_d = entity.instance.componentOverrides[compId]) === null || _d === void 0 ? void 0 : _d[spriteProp.name])) {
                                    spriteAssetId_1 = entity.instance.componentOverrides[compId][spriteProp.name];
                                    return "break";
                                }
                            };
                            for (var compId in entity.instance.componentOverrides) {
                                var state_8 = _loop_8(compId);
                                if (state_8 === "break")
                                    break;
                            }
                        }
                        // If not found in overrides, search in template defaults
                        if (!spriteAssetId_1) {
                            var _loop_9 = function (comp) {
                                var compDef = componentDefinitions.find(function (c) { return c.id === comp.definitionId; });
                                var spriteProp = compDef === null || compDef === void 0 ? void 0 : compDef.properties.find(function (p) { return p.type === 'sprite_ref'; });
                                if (spriteProp && ((_e = comp.defaultValues) === null || _e === void 0 ? void 0 : _e[spriteProp.name])) {
                                    spriteAssetId_1 = comp.defaultValues[spriteProp.name];
                                    return "break";
                                }
                            };
                            for (var _i = 0, _x = entity.template.components; _i < _x.length; _i++) {
                                var comp = _x[_i];
                                var state_9 = _loop_9(comp);
                                if (state_9 === "break")
                                    break;
                            }
                        }
                        // Get sprite asset and use its hitbox values (solo si allAssets está disponible)
                        if (spriteAssetId_1 && allAssets && allAssets.length > 0) {
                            var spriteAsset = allAssets.find(function (a) { return a.id === spriteAssetId_1 && a.type === 'sprite'; });
                            var sprite = spriteAsset === null || spriteAsset === void 0 ? void 0 : spriteAsset.data;
                            if (sprite === null || sprite === void 0 ? void 0 : sprite.hitbox) {
                                hitboxWidth = sprite.hitbox.width;
                                hitboxHeight = sprite.hitbox.height;
                                offsetX = sprite.hitbox.offsetX;
                                offsetY = sprite.hitbox.offsetY;
                            }
                        }
                        // Fallback: use collision component values if no sprite hitbox (with Pac-Man style adjustment)
                        if (!spriteAssetId_1 || !allAssets || !((_g = (_f = allAssets.find(function (a) { return a.id === spriteAssetId_1 && a.type === 'sprite'; })) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g.hitbox)) {
                            hitboxWidth = Number(props.hitboxWidth) || 12;
                            hitboxHeight = Number(props.hitboxHeight) || 12;
                            offsetX = Number(props.offsetX) || 0;
                            offsetY = Number(props.offsetY) || 0;
                        }
                        tileSize = Number(props.tileSize) || TILE_SIZE;
                        // Check if new position would collide
                        var entityLeft = newX + offsetX;
                        var entityTop = newY + offsetY;
                        var entityRight = entityLeft + hitboxWidth;
                        var entityBottom = entityTop + hitboxHeight;
                        var leftTile = Math.floor(entityLeft / tileSize);
                        var topTile = Math.floor(entityTop / tileSize);
                        var rightTile = Math.floor((entityRight - 1) / tileSize);
                        var bottomTile = Math.floor((entityBottom - 1) / tileSize);
                        var hasCollision = false;
                        var collisionType = null;
                        // Check all tiles the entity would occupy
                        for (var tileY = topTile; tileY <= bottomTile && !hasCollision; tileY++) {
                            for (var tileX = leftTile; tileX <= rightTile && !hasCollision; tileX++) {
                                if (tileX < 0 || tileY < 0 || tileX >= screenMap.width || tileY >= screenMap.height) {
                                    hasCollision = true;
                                    collisionType = 'boundary';
                                    break;
                                }
                                // Access collision layer as 2D array: collision[row][column]
                                var collisionRow = screenMap.layers.collision[tileY];
                                if (!collisionRow)
                                    continue;
                                var tile = collisionRow[tileX];
                                // Check if tile is logically solid; non-solid behavior tiles should not stop motion.
                                if (tile && tile.tileId && tile.tileId !== 'empty' && tile.tileId !== ''
                                    && ((_j = (_h = (0, screenUtils_1.getScreenTileLogicalProperties)(tile, tileById)) === null || _h === void 0 ? void 0 : _h.isSolid) !== null && _j !== void 0 ? _j : false)) {
                                    hasCollision = true;
                                    collisionType = 'tile';
                                    break;
                                }
                            }
                        }
                        // Only apply movement if no collision
                        if (!hasCollision) {
                            entity.x = newX;
                            entity.y = newY;
                        }
                        else {
                            if (collisionType === 'tile') {
                                if (entity.vy > 0) {
                                    entity.y = bottomTile * tileSize - offsetY - hitboxHeight;
                                    entity.isOnGround = true;
                                    entity.isGrounded = true;
                                }
                                else if (entity.vy < 0) {
                                    entity.y = (topTile + 1) * tileSize - offsetY;
                                    entity.isTouchingCeiling = true;
                                }
                                else if (entity.vx > 0) {
                                    entity.x = rightTile * tileSize - offsetX - hitboxWidth;
                                    entity.isTouchingWallRight = true;
                                }
                                else if (entity.vx < 0) {
                                    entity.x = (leftTile + 1) * tileSize - offsetX;
                                    entity.isTouchingWallLeft = true;
                                }
                            }
                            // Stop velocity on collision (only log if entity was actually moving)
                            if (entity.vx !== 0 || entity.vy !== 0) {
                                if (collisionType === 'boundary') {
                                    console.log("\uD83D\uDEA7 Detecci\u00F3n de salida de pantalla! Stopping velocity (".concat(entity.vx, ", ").concat(entity.vy, ") \u2192 (0, 0) at position (").concat(entity.x, ", ").concat(entity.y, ")"));
                                }
                                else {
                                    console.log("\uD83D\uDEA7 Collision detected! Stopping velocity (".concat(entity.vx, ", ").concat(entity.vy, ") \u2192 (0, 0) at position (").concat(entity.x, ", ").concat(entity.y, ")"));
                                }
                            }
                            entity.vx = 0;
                            entity.vy = 0;
                        }
                    }
                    else {
                        // No collision detection component, apply movement normally
                        entity.x = newX;
                        entity.y = newY;
                        // Clamp to screen boundaries so gravity entities don't fly off
                        if (entity.y > PREVIEW_HEIGHT) {
                            entity.y = PREVIEW_HEIGHT;
                            entity.vy = 0;
                            entity.isOnGround = true;
                            entity.isGrounded = true;
                        }
                        if (entity.y < 0) {
                            entity.y = 0;
                            entity.vy = 0;
                        }
                        if (entity.x < -entity.sprite.size.width) {
                            entity.x = -entity.sprite.size.width;
                        }
                        if (entity.x > PREVIEW_WIDTH) {
                            entity.x = PREVIEW_WIDTH;
                        }
                    }
                    // Screen boundary constraints removed to allow entities to move off-screen
                    // (useful for side-scrolling games, screen transitions, etc.)
                } // End of physicsEnabled block
                var limitComp = entity.template.components.find(function (c) { return c.definitionId === 'comp_limit_on'; });
                var limitOverride = (_k = entity.instance.componentOverrides) === null || _k === void 0 ? void 0 : _k['comp_limit_on'];
                var limitEnabled = (limitComp || limitOverride) &&
                    ((_l = limitOverride === null || limitOverride === void 0 ? void 0 : limitOverride.isEnabled) !== null && _l !== void 0 ? _l : (_m = limitComp === null || limitComp === void 0 ? void 0 : limitComp.defaultValues) === null || _m === void 0 ? void 0 : _m.isEnabled) !== false &&
                    ((_o = limitOverride === null || limitOverride === void 0 ? void 0 : limitOverride.isEnabled) !== null && _o !== void 0 ? _o : (_p = limitComp === null || limitComp === void 0 ? void 0 : limitComp.defaultValues) === null || _p === void 0 ? void 0 : _p.isEnabled) !== 'false';
                if (limitEnabled) {
                    var maxX = PREVIEW_WIDTH - entity.sprite.size.width;
                    var maxY = PREVIEW_HEIGHT - entity.sprite.size.height;
                    if (entity.x < 0) {
                        entity.x = 0;
                        if (entity.vx < 0)
                            entity.vx = 0;
                    }
                    else if (entity.x > maxX) {
                        entity.x = maxX;
                        if (entity.vx > 0)
                            entity.vx = 0;
                    }
                    if (entity.y < 0) {
                        entity.y = 0;
                        if (entity.vy < 0)
                            entity.vy = 0;
                    }
                    else if (entity.y > maxY) {
                        entity.y = maxY;
                        if (entity.vy > 0)
                            entity.vy = 0;
                        entity.isOnGround = true;
                        entity.isGrounded = true;
                    }
                }
                // Choose correct sprite image (animation is now handled by animation engine)
                // Ensure currentFrame is within bounds
                var safeFrameIndex = Math.min(entity.currentFrame, entity.frameImages.length - 1);
                // Determine which image to draw based on movement direction
                var shouldUseMirrored = false;
                if (entity.mirroredFrameImages && safeFrameIndex < entity.mirroredFrameImages.length) {
                    // Check if currently moving
                    if (entity.vx !== 0) {
                        // Moving: determine direction and update facing state
                        if (entity.sprite.facingDirection === 'right' && entity.vx < 0) {
                            shouldUseMirrored = true;
                            entity.isFacingMirrored = true; // Remember: facing left
                        }
                        else if (entity.sprite.facingDirection === 'left' && entity.vx > 0) {
                            shouldUseMirrored = true;
                            entity.isFacingMirrored = true; // Remember: facing right
                        }
                        else {
                            entity.isFacingMirrored = false; // Remember: facing default direction
                        }
                    }
                    else {
                        // Not moving: use last known direction
                        shouldUseMirrored = entity.isFacingMirrored === true;
                    }
                }
                var imageToDraw = shouldUseMirrored ? entity.mirroredFrameImages[safeFrameIndex] : entity.frameImages[safeFrameIndex];
                // Only render entities if entitiesEnabled is true
                if (entitiesEnabled && imageToDraw) {
                    ctx.drawImage(imageToDraw, entity.x, entity.y);
                }
                // Debug: Draw hitboxes when debug mode is enabled
                if (debugMode) {
                    // Get hitbox values from sprite first, then fallback to collision component, then sprite size
                    var hitboxWidth = entity.sprite.size.width;
                    var hitboxHeight = entity.sprite.size.height;
                    var offsetX = 0;
                    var offsetY = 0;
                    // Try to get sprite hitbox values
                    var spriteAssetId_2;
                    // Search in component overrides
                    if ((_q = entity.instance) === null || _q === void 0 ? void 0 : _q.componentOverrides) {
                        var _loop_10 = function (compId) {
                            var compDef = componentDefinitions.find(function (c) { return c.id === compId; });
                            var spriteProp = compDef === null || compDef === void 0 ? void 0 : compDef.properties.find(function (p) { return p.type === 'sprite_ref'; });
                            if (spriteProp && ((_r = entity.instance.componentOverrides[compId]) === null || _r === void 0 ? void 0 : _r[spriteProp.name])) {
                                spriteAssetId_2 = entity.instance.componentOverrides[compId][spriteProp.name];
                                return "break";
                            }
                        };
                        for (var compId in entity.instance.componentOverrides) {
                            var state_10 = _loop_10(compId);
                            if (state_10 === "break")
                                break;
                        }
                    }
                    // If not found in overrides, search in template defaults
                    if (!spriteAssetId_2) {
                        var _loop_11 = function (comp) {
                            var compDef = componentDefinitions.find(function (c) { return c.id === comp.definitionId; });
                            var spriteProp = compDef === null || compDef === void 0 ? void 0 : compDef.properties.find(function (p) { return p.type === 'sprite_ref'; });
                            if (spriteProp && ((_s = comp.defaultValues) === null || _s === void 0 ? void 0 : _s[spriteProp.name])) {
                                spriteAssetId_2 = comp.defaultValues[spriteProp.name];
                                return "break";
                            }
                        };
                        for (var _y = 0, _z = entity.template.components; _y < _z.length; _y++) {
                            var comp = _z[_y];
                            var state_11 = _loop_11(comp);
                            if (state_11 === "break")
                                break;
                        }
                    }
                    // Get sprite asset and use its hitbox values (solo si allAssets está disponible)
                    if (spriteAssetId_2 && allAssets && allAssets.length > 0) {
                        var spriteAsset = allAssets.find(function (a) { return a.id === spriteAssetId_2 && a.type === 'sprite'; });
                        var sprite = spriteAsset === null || spriteAsset === void 0 ? void 0 : spriteAsset.data;
                        if (sprite === null || sprite === void 0 ? void 0 : sprite.hitbox) {
                            hitboxWidth = sprite.hitbox.width;
                            hitboxHeight = sprite.hitbox.height;
                            offsetX = sprite.hitbox.offsetX;
                            offsetY = sprite.hitbox.offsetY;
                        }
                    }
                    // Fallback: get from collision components
                    if (!spriteAssetId_2 || !allAssets || !((_u = (_t = allAssets.find(function (a) { return a.id === spriteAssetId_2 && a.type === 'sprite'; })) === null || _t === void 0 ? void 0 : _t.data) === null || _u === void 0 ? void 0 : _u.hitbox)) {
                        var collisionComp = entity.template.components.find(function (c) { return c.definitionId === 'comp_collision' || c.definitionId === 'comp_wall_collision'; });
                        if (collisionComp) {
                            var props = __assign(__assign({}, collisionComp.defaultValues), (((_w = (_v = entity.instance) === null || _v === void 0 ? void 0 : _v.componentOverrides) === null || _w === void 0 ? void 0 : _w[collisionComp.definitionId]) || {}));
                            hitboxWidth = Number(props.hitboxWidth) || entity.sprite.size.width;
                            hitboxHeight = Number(props.hitboxHeight) || entity.sprite.size.height;
                            offsetX = Number(props.offsetX) || 0;
                            offsetY = Number(props.offsetY) || 0;
                        }
                    }
                    // Draw hitbox as semi-transparent gray rectangle
                    ctx.save();
                    ctx.fillStyle = 'rgba(128, 128, 128, 0.3)'; // Semi-transparent gray
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; // White border
                    ctx.lineWidth = 1;
                    var hitboxX = entity.x + offsetX;
                    var hitboxY = entity.y + offsetY;
                    ctx.fillRect(hitboxX, hitboxY, hitboxWidth, hitboxHeight);
                    ctx.strokeRect(hitboxX, hitboxY, hitboxWidth, hitboxHeight);
                    ctx.restore();
                }
                // Check if bullet entities should be cleaned up (off-screen)
                if (entity.template.id === 'tpl_player_bullet') {
                    if (entity.y < -20 || entity.y > PREVIEW_HEIGHT + 20 ||
                        entity.x < -20 || entity.x > PREVIEW_WIDTH + 20) {
                        entity.markedForDestruction = true;
                    }
                }
            });
            // Remove entities marked for destruction
            entitiesRef.current = entitiesRef.current.filter(function (entity) { return !entity.markedForDestruction; });
            // Check if screen exit was detected
            if (screenExitDetectedRef.current) {
                var exitDirection = screenExitDetectedRef.current;
                console.log("\uD83D\uDEAA Screen exit detected! Direction: ".concat(exitDirection));
                console.log("   Player would transition to next screen via ".concat(exitDirection, " edge"));
                // TODO: Implementar cambio de pantalla aquí
                // Por ahora solo mostramos un mensaje en consola
                // En el futuro, esto debería:
                // 1. Cargar la pantalla conectada en esa dirección (screenMap.connections[exitDirection])
                // 2. Posicionar al jugador en el borde opuesto de la nueva pantalla
                // 3. Reinicializar las entidades de la nueva pantalla
                // Reset detection flag
                screenExitDetectedRef.current = null;
            }
            animationFrameId.current = requestAnimationFrame(animate);
        };
        animationFrameId.current = requestAnimationFrame(animate);
        return function () {
            if (animationFrameId.current)
                cancelAnimationFrame(animationFrameId.current);
        };
    }, [isOpen, screenMap, allAssets, currentScreenMode, debugMode, isFullScreen, renderHUDElements, entitiesEnabled, hudEnabled, animationEnabled, physicsEnabled]);
    if (!isOpen)
        return null;
    return (<div ref={modalRef} className={"fixed inset-0 flex items-center justify-center z-50 outline-none ".concat(isFullScreen
            ? 'bg-black'
            : 'bg-black bg-opacity-75 animate-fadeIn p-4')} onClick={isFullScreen ? handleExitFullScreen : onClose} onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} tabIndex={-1}>
            {/* Content wrapper - only shows in normal mode */}
            {!isFullScreen && (<div className="bg-msx-panelbg p-4 sm:p-6 rounded-lg shadow-xl animate-slideIn font-sans flex flex-col items-center" onClick={function (e) { return e.stopPropagation(); }}>
                    <h2 className="text-md sm:text-lg text-msx-highlight mb-3 sm:mb-4 pixel-font">Screen Play Mode</h2>

                    {/* Info text above game */}
                    <div className="text-center mb-4">
                        <p className="text-xs text-msx-textsecondary mb-1">Use Arrow keys to move. Press Escape to close.</p>
                        <p className="text-xs text-msx-textsecondary mb-1">
                            Active Engines: {activeEnginesRef.current.map(function (e) { return e.name; }).join(', ') || 'None'}
                        </p>
                        <p className="text-xs text-msx-textsecondary mb-2">
                            Total Entities: {entityCount} | Pending Spawns: {pendingSpawnsRef.current.length}
                        </p>
                    </div>

                    {/* Canvas - game screen */}
                    <canvas ref={canvasRef} width={PREVIEW_WIDTH} height={PREVIEW_HEIGHT} className="border-2 border-msx-border mb-4" style={{
                width: PREVIEW_WIDTH * 2,
                height: PREVIEW_HEIGHT * 2,
                imageRendering: 'pixelated',
                backgroundColor: 'black'
            }}/>

                    {/* Controls below game */}
                    <div className="flex gap-3">
                        <Button_1.Button onClick={function (e) {
                e.preventDefault();
                e.stopPropagation();
                setEntitiesEnabled(!entitiesEnabled);
            }} variant={entitiesEnabled ? "primary" : "danger"} size="md">
                            Entities
                        </Button_1.Button>
                        <Button_1.Button onClick={function (e) {
                e.preventDefault();
                e.stopPropagation();
                setHudEnabled(!hudEnabled);
            }} variant={hudEnabled ? "primary" : "danger"} size="md">
                            HUD
                        </Button_1.Button>
                        <Button_1.Button onClick={function (e) {
                e.preventDefault();
                e.stopPropagation();
                setAnimationEnabled(!animationEnabled);
            }} variant={animationEnabled ? "primary" : "danger"} size="md">
                            Animation
                        </Button_1.Button>
                        <Button_1.Button onClick={function (e) {
                e.preventDefault();
                e.stopPropagation();
                setPhysicsEnabled(!physicsEnabled);
            }} variant={physicsEnabled ? "primary" : "danger"} size="md">
                            Physics
                        </Button_1.Button>
                        <Button_1.Button onClick={function (e) {
                e.preventDefault();
                e.stopPropagation();
                setDebugMode(!debugMode);
            }} variant={debugMode ? "primary" : "danger"} size="md">
                            {debugMode ? "Debug ON" : "Debug OFF"}
                        </Button_1.Button>
                        <Button_1.Button onClick={onClose} variant="primary" size="md">Close</Button_1.Button>
                    </div>
                </div>)}

            {/* Fullscreen canvas */}
            {isFullScreen && (<>
                    <canvas ref={canvasRef} width={PREVIEW_WIDTH} height={PREVIEW_HEIGHT} style={{
                width: '90vw',
                height: '90vh',
                maxWidth: '90vw',
                maxHeight: '90vh',
                objectFit: 'contain',
                imageRendering: 'pixelated',
                backgroundColor: 'black',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
            }}/>

                    {/* Full Screen indicator */}
                    <div className="absolute top-4 right-4 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                        Click to exit | Auto-close in 15s
                    </div>
                </>)}
        </div>);
};
exports.ScreenPlayModal = ScreenPlayModal;
