"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MSX2_DOUBLE_JUMP_IMPULSE_SCALE = exports.MSX2_DEFAULT_TERMINAL_VELOCITY_88 = exports.MSX2_DEFAULT_GRAVITY_STRENGTH_88 = exports.MSX2_DEFAULT_JUMP_IMPULSE_88 = void 0;
exports.clampMsx2JumpImpulse88 = clampMsx2JumpImpulse88;
exports.clampMsx2GravityStrength88 = clampMsx2GravityStrength88;
exports.clampMsx2GravityStrength88Px = clampMsx2GravityStrength88Px;
exports.clampMsx2TerminalVelocity88 = clampMsx2TerminalVelocity88;
exports.clampMsx2TerminalVelocity88Px = clampMsx2TerminalVelocity88Px;
exports.clampMsx2CoyoteFrames = clampMsx2CoyoteFrames;
exports.clampMsx2JumpBufferFrames = clampMsx2JumpBufferFrames;
exports.resolveMsx2JumpImpulse88 = resolveMsx2JumpImpulse88;
exports.resolveMsx2JumpImpulse88Px = resolveMsx2JumpImpulse88Px;
exports.isMsx2PlayerControlPressed = isMsx2PlayerControlPressed;
exports.isMsx2DashKeyPressed = isMsx2DashKeyPressed;
exports.isMsx2JumpKeyPressed = isMsx2JumpKeyPressed;
exports.applyMsx2JumpImpulseToEntity = applyMsx2JumpImpulseToEntity;
exports.scaleMsx2JumpImpulse88 = scaleMsx2JumpImpulse88;
exports.isMsx2TeleportKeyPressed = isMsx2TeleportKeyPressed;
exports.getMsx2GlideConfigFromPlayerEntity = getMsx2GlideConfigFromPlayerEntity;
exports.getMsx2TeleportABConfigFromPlayerEntity = getMsx2TeleportABConfigFromPlayerEntity;
exports.getMsx2DashConfigFromPlayerEntity = getMsx2DashConfigFromPlayerEntity;
exports.getMsx2AirDashConfigFromPlayerEntity = getMsx2AirDashConfigFromPlayerEntity;
exports.getMsx2CarryObjectConfigFromPlayerEntity = getMsx2CarryObjectConfigFromPlayerEntity;
exports.getMsx2CollectorGemsConfigFromPlayerEntity = getMsx2CollectorGemsConfigFromPlayerEntity;
exports.getMsx2WallJumpConfigFromPlayerEntity = getMsx2WallJumpConfigFromPlayerEntity;
exports.getMsx2PowerStompConfigFromPlayerEntity = getMsx2PowerStompConfigFromPlayerEntity;
exports.msx2PlayerWantsScreenShake = msx2PlayerWantsScreenShake;
exports.getMsx2PlatformPhysicsFromPlayerEntity = getMsx2PlatformPhysicsFromPlayerEntity;
exports.getMsx2PlatformPhysicsFromScreen = getMsx2PlatformPhysicsFromScreen;
exports.getMsx2PlatformPhysicsFromAnalysis = getMsx2PlatformPhysicsFromAnalysis;
exports.playerHasMsx2JumpComponent = playerHasMsx2JumpComponent;
exports.playerHasMsx2GravityComponent = playerHasMsx2GravityComponent;
exports.formatAsmWord = formatAsmWord;
exports.formatAsmByte = formatAsmByte;
exports.getTerminalVelocityHighByte = getTerminalVelocityHighByte;
const skills_1 = require("./msxGenerator/skills");
/** MSX1 ROM default: #FC00 (-1024 in 8.8 fixed-point, ~-4 px/frame initial rise). */
exports.MSX2_DEFAULT_JUMP_IMPULSE_88 = 0xfc00;
/** MSX1 ROM default gravity acceleration per frame (#40 on the low byte). */
exports.MSX2_DEFAULT_GRAVITY_STRENGTH_88 = 0x0040;
/** MSX1 ROM terminal fall speed cap (#0400 in 8.8). */
exports.MSX2_DEFAULT_TERMINAL_VELOCITY_88 = 0x0400;
/** Mid-air jump impulse scale when the optional double_jump skill is active. */
exports.MSX2_DOUBLE_JUMP_IMPULSE_SCALE = 0.7;
function clampMsx2JumpImpulse88(value) {
    const magnitude = Math.max(256, Math.min(2048, Math.floor(Math.abs(Number(value) || 1024))));
    return (-magnitude) & 0xffff;
}
function clampMsx2GravityStrength88(value) {
    return Math.max(16, Math.min(128, Math.floor(Number(value) || exports.MSX2_DEFAULT_GRAVITY_STRENGTH_88)));
}
function clampMsx2GravityStrength88Px(valuePx) {
    const px = Number(valuePx);
    const magnitude88 = Math.max(16, Math.min(128, Math.floor(Math.abs(px || 0) * 256)));
    return magnitude88;
}
function clampMsx2TerminalVelocity88(value) {
    return Math.max(256, Math.min(2048, Math.floor(Number(value) || exports.MSX2_DEFAULT_TERMINAL_VELOCITY_88)));
}
function clampMsx2TerminalVelocity88Px(valuePx) {
    const px = Number(valuePx);
    const magnitude88 = Math.max(256, Math.min(2048, Math.floor(Math.abs(px || 0) * 256)));
    return magnitude88;
}
function clampMsx2CoyoteFrames(value) {
    const n = Math.floor(Number(value) || 0);
    if (!Number.isFinite(n) || n <= 0)
        return 0;
    return Math.max(0, Math.min(16, n));
}
function clampMsx2JumpBufferFrames(value) {
    const n = Math.floor(Number(value) || 0);
    if (!Number.isFinite(n) || n <= 0)
        return 0;
    return Math.max(0, Math.min(16, n));
}
function resolveMsx2JumpImpulse88(jumpPower) {
    const numeric = Number(jumpPower);
    if (!Number.isFinite(numeric) || numeric === 0) {
        return exports.MSX2_DEFAULT_JUMP_IMPULSE_88;
    }
    if (numeric < 0) {
        return numeric & 0xffff;
    }
    return clampMsx2JumpImpulse88(numeric);
}
function resolveMsx2JumpImpulse88Px(jumpPowerPx) {
    const px = Number(jumpPowerPx);
    if (!Number.isFinite(px) || px === 0) {
        return exports.MSX2_DEFAULT_JUMP_IMPULSE_88;
    }
    const magnitude88 = Math.max(256, Math.min(2048, Math.floor(Math.abs(px) * 256)));
    return (-magnitude88) & 0xffff;
}
function isMsx2ComponentEnabled(component) {
    if (!component)
        return false;
    if (component.enabled === false || component.enabled === 'false')
        return false;
    return true;
}
function readPlayerActiveSkills(player) {
    if (!Array.isArray(player?.activeSkills))
        return [];
    return player.activeSkills.map((id) => String(id || '').trim()).filter(Boolean);
}
function resolveSkillNumberParam(params, skillId, key, fallback) {
    const raw = params[key];
    if (raw !== undefined && Number.isFinite(Number(raw))) {
        return Math.floor(Number(raw));
    }
    const def = (0, skills_1.getSkill)(skillId)?.parameters?.find((param) => param.key === key);
    if (def?.type === 'number' && def.default !== undefined && Number.isFinite(Number(def.default))) {
        return Math.floor(Number(def.default));
    }
    return fallback;
}
function pickSkillNumberParam(params, skillId, keys, fallback) {
    for (const key of keys) {
        const raw = params[key];
        if (raw !== undefined && Number.isFinite(Number(raw))) {
            return Math.floor(Number(raw));
        }
    }
    return resolveSkillNumberParam(params, skillId, keys[0], fallback);
}
const MSX2_JUMP_KEY_ALIASES = {
    spc: [' '],
    space: [' '],
    m: ['m', 'M'],
    z: ['z', 'Z', 'KeyZ'],
    x: ['x', 'X', 'KeyX'],
    a: ['a', 'A', 'KeyA'],
};
const MSX2_DASH_KEY_ALIASES = {
    attack: ['x', 'X', 'KeyX', 'z', 'Z', 'KeyZ', 'n', 'N', 'KeyN'],
    jump: [' ', 'a', 'A', 'KeyA'],
};
function aliasesForMsx2KeyboardButton(key) {
    const normalized = String(key || '').trim().toUpperCase();
    if (normalized === 'SPC' || normalized === 'SPACE')
        return [' '];
    if (normalized === 'M')
        return ['m', 'M'];
    if (normalized === 'N')
        return ['n', 'N', 'KeyN'];
    if (normalized === 'CTRL' || normalized === 'CONTROL')
        return ['Control'];
    if (normalized === 'Z')
        return ['z', 'Z', 'KeyZ'];
    if (normalized === 'X')
        return ['x', 'X', 'KeyX'];
    return [];
}
function aliasesForMsx2LogicalButton(settings, button) {
    if (!settings)
        return [];
    const key = button === 'button1' ? settings.keyboardButton1 : settings.keyboardButton2;
    return aliasesForMsx2KeyboardButton(key);
}
function isMsx2PlayerControlPressed(pressedKeys, control, settings) {
    if (control === 'right') {
        return pressedKeys.has('ArrowRight') || pressedKeys.has('d') || pressedKeys.has('D');
    }
    if (control === 'left') {
        return pressedKeys.has('ArrowLeft') || pressedKeys.has('a') || pressedKeys.has('A');
    }
    if (control === 'up') {
        return pressedKeys.has('ArrowUp') || pressedKeys.has('w') || pressedKeys.has('W');
    }
    if (control === 'down') {
        return pressedKeys.has('ArrowDown') || pressedKeys.has('s') || pressedKeys.has('S');
    }
    if (control === 'jump') {
        const logicalButton = settings?.jumpActionButton === 'button2' ? 'button2' : 'button1';
        const logicalAliases = aliasesForMsx2LogicalButton(settings, logicalButton);
        const fallbackAliases = MSX2_JUMP_KEY_ALIASES.jump;
        return [...logicalAliases, ...fallbackAliases].some((key) => pressedKeys.has(key));
    }
    if (control === 'attack') {
        const logicalButton = settings?.actionButton === 'button1' ? 'button1' : 'button2';
        const logicalAliases = aliasesForMsx2LogicalButton(settings, logicalButton);
        const fallbackAliases = MSX2_DASH_KEY_ALIASES.attack;
        return [...logicalAliases, ...fallbackAliases].some((key) => pressedKeys.has(key));
    }
    return false;
}
function isMsx2DashKeyPressed(pressedKeys, primaryControl, secondaryControl = 'none', settings) {
    if (settings) {
        if (!isMsx2PlayerControlPressed(pressedKeys, primaryControl, settings))
            return false;
        if (secondaryControl === 'none')
            return true;
        return isMsx2PlayerControlPressed(pressedKeys, secondaryControl, settings);
    }
    const primaryAliases = MSX2_DASH_KEY_ALIASES[primaryControl]
        || MSX2_JUMP_KEY_ALIASES[primaryControl]
        || MSX2_DASH_KEY_ALIASES.attack;
    const primaryDown = primaryAliases.some((key) => pressedKeys.has(key));
    if (!primaryDown)
        return false;
    if (secondaryControl === 'none')
        return true;
    const secondaryAliases = MSX2_DASH_KEY_ALIASES[secondaryControl]
        || MSX2_JUMP_KEY_ALIASES[secondaryControl]
        || [];
    return secondaryAliases.some((key) => pressedKeys.has(key));
}
function isMsx2JumpKeyPressed(pressedKeys, inputMapping) {
    if (pressedKeys.has(' '))
        return true;
    const jump = String(inputMapping?.jump || 'spc').trim().toLowerCase();
    const aliases = MSX2_JUMP_KEY_ALIASES[jump] || MSX2_JUMP_KEY_ALIASES.spc;
    return aliases.some((key) => pressedKeys.has(key));
}
function applyMsx2JumpImpulseToEntity(entity, impulse88) {
    entity.gravityVel = impulse88 & 0xffff;
    const hi = (entity.gravityVel >> 8) & 0xff;
    entity.vy = hi >= 0x80 ? hi - 0x100 : hi;
}
function scaleMsx2JumpImpulse88(impulse88, scale) {
    const word = impulse88 & 0xffff;
    const signed = word >= 0x8000 ? word - 0x10000 : word;
    const scaled = Math.round(signed * scale);
    return scaled & 0xffff;
}
function resolveMsx2SkillBinding(player, skillId) {
    const binding = player?.skillBindings?.[skillId];
    if (binding?.primary) {
        return {
            primary: binding.primary,
            secondary: (binding.secondary ?? 'none'),
        };
    }
    const def = (0, skills_1.getSkill)(skillId);
    const icons = def?.controlIcon
        ? (Array.isArray(def.controlIcon) ? def.controlIcon : [def.controlIcon])
        : ['attack'];
    return {
        primary: (icons[0] || 'attack'),
        secondary: (icons[1] ?? 'none'),
    };
}
function resolveDashSkillBinding(player) {
    return resolveMsx2SkillBinding(player, 'dash');
}
function resolveAirDashSkillBinding(player) {
    return resolveMsx2SkillBinding(player, 'air_dash');
}
function resolveTeleportABSkillBinding(player) {
    return resolveMsx2SkillBinding(player, 'teleport_a_b');
}
function resolveWallJumpSkillBinding(player) {
    return resolveMsx2SkillBinding(player, 'wall_jump');
}
function resolvePowerStompSkillBinding(player) {
    return resolveMsx2SkillBinding(player, 'power_stomp');
}
function isMsx2TeleportKeyPressed(pressedKeys, primaryControl, secondaryControl = 'none') {
    return isMsx2DashKeyPressed(pressedKeys, primaryControl, secondaryControl);
}
function getMsx2GlideConfigFromPlayerEntity(player) {
    const activeSkills = readPlayerActiveSkills(player);
    const enabled = activeSkills.includes('glide');
    const params = (player?.skillParameters?.glide || {});
    return {
        enabled,
        glideSpeed: Math.max(0, Math.min(4, Math.floor(Number(params.glideSpeed ?? 1) || 1))),
        glideHorizontalSpeed: Math.max(0, Math.min(6, Math.floor(Number(params.glideHorizontalSpeed ?? 2) || 2))),
        glideBoostCost: Math.max(0, Math.min(20, Math.floor(Number(params.glideBoostCost ?? 5) || 5))),
    };
}
function getMsx2TeleportABConfigFromPlayerEntity(player) {
    const activeSkills = readPlayerActiveSkills(player);
    const enabled = activeSkills.includes('teleport_a_b');
    const params = (player?.skillParameters?.teleport_a_b || {});
    const binding = resolveTeleportABSkillBinding(player);
    return {
        enabled,
        teleportCooldown: Math.max(10, Math.min(180, Math.floor(Number(params.teleportCooldown ?? 60) || 60))),
        teleportDelay: Math.max(5, Math.min(60, Math.floor(Number(params.teleportDelay ?? 15) || 15))),
        savePointA: params.savePointA !== false,
        useHorizontal: params.useHorizontal !== false,
        useVertical: params.useVertical !== false,
        maxDistance: Math.max(1, Math.min(50, Math.floor(Number(params.maxDistance ?? 10) || 10))),
        primaryControl: binding.primary,
        secondaryControl: binding.secondary,
    };
}
function getMsx2DashConfigFromPlayerEntity(player) {
    const activeSkills = readPlayerActiveSkills(player);
    const enabled = activeSkills.includes('dash');
    const params = (player?.skillParameters?.dash || {});
    const binding = resolveDashSkillBinding(player);
    const dashSpeed = pickSkillNumberParam(params, 'dash', ['dashSpeed'], 8);
    const dashDuration = pickSkillNumberParam(params, 'dash', ['dashDuration', 'dashDurationFrames'], 8);
    const dashCooldown = pickSkillNumberParam(params, 'dash', ['dashCooldown', 'dashCooldownFrames'], 30);
    return {
        enabled,
        dashSpeed: Math.max(1, Math.min(24, dashSpeed || 8)),
        dashDuration: Math.max(1, Math.min(30, dashDuration || 8)),
        dashCooldown: Math.max(0, Math.min(120, dashCooldown || 30)),
        requireKeyRelease: params.requireKeyRelease !== false,
        directional: params.directional !== false,
        invulnerable: params.invulnerable !== false,
        primaryControl: binding.primary,
        secondaryControl: binding.secondary,
    };
}
function getMsx2AirDashConfigFromPlayerEntity(player) {
    const activeSkills = readPlayerActiveSkills(player);
    const enabled = activeSkills.includes('air_dash');
    const params = (player?.skillParameters?.air_dash || {});
    const binding = resolveAirDashSkillBinding(player);
    const airDashSpeed = pickSkillNumberParam(params, 'air_dash', ['airDashSpeed'], 6);
    const airDashDuration = pickSkillNumberParam(params, 'air_dash', ['airDashDuration'], 6);
    const airDashCooldown = pickSkillNumberParam(params, 'air_dash', ['airDashCooldown'], 20);
    return {
        enabled,
        airDashSpeed: Math.max(1, Math.min(24, airDashSpeed || 6)),
        airDashDuration: Math.max(1, Math.min(30, airDashDuration || 6)),
        airDashCooldown: Math.max(0, Math.min(120, airDashCooldown || 20)),
        requireKeyRelease: params.requireKeyRelease !== false,
        invulnerable: params.invulnerable !== false,
        primaryControl: binding.primary,
        secondaryControl: binding.secondary,
    };
}
/**
 * Returns the resolved carry_object skill config for the given player.
 *
 * Reads `player.skillParameters.carry_object` and clamps every numeric field
 * to the range declared in `carryObjectParameters` (handlers/index.ts).
 * Default binding follows the skill's controlIcon ('attack').
 */
function getMsx2CarryObjectConfigFromPlayerEntity(player) {
    const activeSkills = readPlayerActiveSkills(player);
    const enabled = activeSkills.includes('carry_object');
    const params = (player?.skillParameters?.carry_object || {});
    const binding = resolveMsx2SkillBinding(player, 'carry_object');
    const throwPower = pickSkillNumberParam(params, 'carry_object', ['throwPower'], 8);
    const throwCooldown = pickSkillNumberParam(params, 'carry_object', ['throwCooldown'], 20);
    return {
        enabled,
        throwPower: Math.max(2, Math.min(16, throwPower || 8)),
        throwCooldown: Math.max(5, Math.min(60, throwCooldown || 20)),
        primaryControl: binding.primary,
        secondaryControl: binding.secondary,
    };
}
/**
 * Returns the resolved collector_gems skill config for the given player.
 *
 * Reads `player.skillParameters.collector_gems` and clamps `gemValue` to the
 * range declared in `collectorGemsParameters` (handlers/index.ts). The skill
 * is passive (no control binding): it only augments the collectible pickup.
 */
function getMsx2CollectorGemsConfigFromPlayerEntity(player) {
    const activeSkills = readPlayerActiveSkills(player);
    const enabled = activeSkills.includes('collector_gems');
    const params = (player?.skillParameters?.collector_gems || {});
    const gemValue = pickSkillNumberParam(params, 'collector_gems', ['gemValue'], 100);
    return {
        enabled,
        gemValue: Math.max(1, Math.min(1000, gemValue || 100)),
        collectSound: params.collectSound !== false,
    };
}
/**
 * Returns the resolved wall_jump skill config for the given player.
 *
 * Reads `player.skillParameters.wall_jump` and clamps every numeric field to
 * the range declared in `wallJumpParameters` (handlers/index.ts). The
 * `wallJumpPower88` is sign-extended negative to align with `clampMsx2JumpImpulse88`
 * (vertical impulse convention: -y = up).
 */
function getMsx2WallJumpConfigFromPlayerEntity(player) {
    const activeSkills = readPlayerActiveSkills(player);
    const enabled = activeSkills.includes('wall_jump');
    const params = (player?.skillParameters?.wall_jump || {});
    const binding = resolveWallJumpSkillBinding(player);
    const wallJumpPower = pickSkillNumberParam(params, 'wall_jump', ['wallJumpPower'], 1024);
    const wallJumpHorizontal = pickSkillNumberParam(params, 'wall_jump', ['wallJumpHorizontal'], 4);
    const wallSlideSpeed = pickSkillNumberParam(params, 'wall_jump', ['wallSlideSpeed'], 1);
    // wallJumpVertical (px/frame) is the human-facing vertical force field.
    // Precedence: it wins ONLY when explicitly present in the project params,
    // so legacy projects that tuned the 8.8 wallJumpPower keep their value
    // (do NOT use pickSkillNumberParam here: its skill-def default would
    // silently override every custom wallJumpPower with 4 px/f).
    const wallJumpVerticalRaw = params.wallJumpVertical;
    const hasWallJumpVertical = wallJumpVerticalRaw !== undefined
        && Number.isFinite(Number(wallJumpVerticalRaw))
        && Number(wallJumpVerticalRaw) > 0;
    const wallJumpPower88 = hasWallJumpVertical
        ? resolveMsx2JumpImpulse88Px(Math.max(1, Math.min(8, Math.floor(Number(wallJumpVerticalRaw)))))
        : clampMsx2JumpImpulse88(wallJumpPower);
    return {
        enabled,
        wallJumpPower88,
        wallJumpHorizontal: Math.max(1, Math.min(12, wallJumpHorizontal || 4)),
        wallSlideSpeed: Math.max(0, Math.min(4, wallSlideSpeed || 1)),
        requireKeyRelease: params.requireKeyRelease !== false,
        primaryControl: binding.primary,
    };
}
/**
 * Returns the resolved power_stomp skill config for the given player.
 *
 * Reads `player.skillParameters.power_stomp` and clamps every numeric field to
 * the range declared in `powerStompParameters` (handlers/index.ts). The default
 * binding is DOWN+B (down + attack) — see `controlIcon: ['down','attack']`.
 */
function getMsx2PowerStompConfigFromPlayerEntity(player) {
    const activeSkills = readPlayerActiveSkills(player);
    const enabled = activeSkills.includes('power_stomp');
    const params = (player?.skillParameters?.power_stomp || {});
    const binding = resolvePowerStompSkillBinding(player);
    const stompSpeed = pickSkillNumberParam(params, 'power_stomp', ['stompSpeed'], 16);
    const stompCooldown = pickSkillNumberParam(params, 'power_stomp', ['stompCooldown'], 30);
    return {
        enabled,
        stompSpeed: Math.max(4, Math.min(32, stompSpeed || 16)),
        stompCooldown: Math.max(10, Math.min(120, stompCooldown || 30)),
        screenShake: params.screenShake !== false,
        primaryControl: binding.primary || 'down',
        secondaryControl: binding.secondary ?? 'attack',
    };
}
/**
 * True when the player has power_stomp enabled AND its screenShake flag is on.
 * The generator uses this to decide whether to include the reusable VDP R#18
 * screen-shake module (`msx2ScreenShakeGenerator`).
 */
function msx2PlayerWantsScreenShake(player) {
    const config = getMsx2PowerStompConfigFromPlayerEntity(player);
    return config.enabled && config.screenShake;
}
function resolveDoubleJumpMaxJumps(doubleJumpParams) {
    return Math.max(1, Math.min(4, Math.floor(Number(doubleJumpParams?.maxJumps ?? 2) || 2)));
}
function getMsx2PlatformPhysicsFromPlayerEntity(player) {
    const jump = player?.components?.msx2_jump;
    const gravity = player?.components?.msx2_gravity;
    const control = player?.components?.msx2_player_control || {};
    const params = player?.params || {};
    const movement = player?.movement || {};
    // New declarative source: skillParameters.jump from Player Config Abilities & Items dialog.
    // Wins when present (per AI Charter 2026-06-08: Player Config is the human-facing source of truth).
    const skillJump = player?.skillParameters?.jump;
    const hasSkillJump = skillJump && typeof skillJump === 'object';
    const jumpEnabled = hasSkillJump
        ? skillJump.enabled !== false && skillJump.enabled !== 'false'
        : isMsx2ComponentEnabled(jump)
            || (jump === undefined && (control.jump === true || control.jump === 'true' || params.jump === true));
    const gravityEnabled = isMsx2ComponentEnabled(gravity)
        || (gravity === undefined && (control.gravity === true || control.gravity === 'true' || params.gravity === true));
    // Skill wins when present. For legacy projects (no skillParameters.jump), use movement.*
    // for physics values (jumpPower, gravity, maxFallSpeed) as these were the intended pixel values.
    // Do NOT use movement.coyoteTime/movement.jumpBuffer for legacy projects - those were never
    // used by the ASM runtime and would introduce new untested code paths.
    const hasMovementPhysics = !hasSkillJump && (movement.jumpPower !== undefined
        || movement.gravity !== undefined
        || movement.maxFallSpeed !== undefined);
    let jumpPower;
    let gravityStrength;
    let terminalVelocity;
    if (hasSkillJump && skillJump.jumpPower !== undefined) {
        jumpPower = skillJump.jumpPower;
    }
    else if (hasMovementPhysics) {
        jumpPower = movement.jumpPower ?? movement.jumpImpulse;
        gravityStrength = movement.gravity;
        terminalVelocity = movement.maxFallSpeed;
    }
    else {
        jumpPower = jump?.jumpPower ?? jump?.jumpImpulse
            ?? control.jumpPower ?? control.jumpImpulse
            ?? params.jumpPower ?? params.jumpImpulse;
        gravityStrength = gravity?.strength ?? gravity?.gravityStrength
            ?? control.gravityStrength ?? params.gravityStrength;
        terminalVelocity = gravity?.terminalVelocity
            ?? control.terminalVelocity ?? params.terminalVelocity;
    }
    const activeSkills = readPlayerActiveSkills(player);
    const doubleJumpEnabled = activeSkills.includes('double_jump');
    const doubleJumpParams = player?.skillParameters?.double_jump;
    const maxJumps = doubleJumpEnabled
        ? resolveDoubleJumpMaxJumps(doubleJumpParams)
        : Math.max(1, Math.min(4, Math.floor(Number(jump?.maxJumps ?? params.maxJumps ?? 1) || 1)));
    const requireKeyRelease = doubleJumpEnabled
        ? doubleJumpParams?.requireKeyRelease !== false
        : hasSkillJump
            ? (skillJump.requireKeyRelease !== false && skillJump.requireKeyRelease !== 'false')
            : (jump?.requireKeyRelease !== false
                && jump?.requireKeyRelease !== 'false'
                && control.requireKeyRelease !== false
                && control.requireKeyRelease !== 'false');
    // Coyote / jumpBuffer: ONLY enabled when explicitly configured via skillParameters.jump.
    // Legacy projects may have movement.coyoteTime/movement.jumpBuffer in JSON but they were
    // NEVER used by the ASM runtime. Reading them would introduce new untested code paths
    // (coyote/jump buffer logic) breaking backward compatibility.
    // See ai/LESSONS_LEARNED.md: "Bug Resuelto: cambio en ASM runtime MSX sin smoke automatizable"
    const coyoteTime = hasSkillJump
        ? clampMsx2CoyoteFrames(skillJump.coyoteTime)
        : 0;
    const jumpBuffer = hasSkillJump
        ? clampMsx2JumpBufferFrames(skillJump.jumpBuffer)
        : 0;
    const jumpImpulse88 = hasSkillJump
        ? resolveMsx2JumpImpulse88(jumpPower)
        : hasMovementPhysics
            ? resolveMsx2JumpImpulse88Px(jumpPower)
            : resolveMsx2JumpImpulse88(jumpPower);
    const airJumpImpulse88 = doubleJumpEnabled
        ? scaleMsx2JumpImpulse88(jumpImpulse88, exports.MSX2_DOUBLE_JUMP_IMPULSE_SCALE)
        : jumpImpulse88;
    return {
        jumpEnabled,
        gravityEnabled,
        jumpImpulse88,
        airJumpImpulse88,
        gravityStrength88: hasMovementPhysics
            ? clampMsx2GravityStrength88Px(gravityStrength)
            : clampMsx2GravityStrength88(gravityStrength),
        terminalVelocity88: hasMovementPhysics
            ? clampMsx2TerminalVelocity88Px(terminalVelocity)
            : clampMsx2TerminalVelocity88(terminalVelocity),
        maxJumps,
        doubleJumpEnabled,
        requireKeyRelease,
        coyoteTime,
        jumpBuffer,
    };
}
function getMsx2PlatformPhysicsFromScreen(screen, player) {
    const base = getMsx2PlatformPhysicsFromPlayerEntity(player);
    const runtime = screen?.runtime;
    if (!runtime)
        return base;
    return {
        ...base,
        jumpImpulse88: runtime.jumpImpulse !== undefined || runtime.jumpPower !== undefined
            ? resolveMsx2JumpImpulse88(runtime.jumpImpulse ?? runtime.jumpPower)
            : base.jumpImpulse88,
        gravityStrength88: runtime.gravityStrength !== undefined
            ? clampMsx2GravityStrength88(runtime.gravityStrength)
            : base.gravityStrength88,
        terminalVelocity88: runtime.terminalVelocity !== undefined
            ? clampMsx2TerminalVelocity88(runtime.terminalVelocity)
            : base.terminalVelocity88,
    };
}
function getMsx2PlatformPhysicsFromAnalysis(analysis) {
    const screen = analysis.msx2Screens?.find(item => item.layers?.entities?.some(entity => entity.kind === 'player')
        || (Array.isArray(item.playerEntries) && item.playerEntries.length > 0))
        || analysis.msx2Screens?.[0];
    const player = screen?.layers?.entities?.find(entity => entity.kind === 'player')
        || (Array.isArray(screen?.playerEntries) && screen.playerEntries.length > 0
            ? {
                kind: 'player',
                components: {
                    msx2_player_control: {
                        jump: String(screen?.runtime?.movementMode || screen?.runtime?.screenEngine || 'platform').replace(/[\s_-]+/g, '').toLowerCase() === 'platform',
                        gravity: String(screen?.runtime?.movementMode || screen?.runtime?.screenEngine || 'platform').replace(/[\s_-]+/g, '').toLowerCase() === 'platform',
                        jumpPower: screen?.runtime?.jumpPower ?? screen?.runtime?.jumpImpulse,
                        gravityStrength: screen?.runtime?.gravityStrength,
                        terminalVelocity: screen?.runtime?.terminalVelocity,
                    },
                },
            }
            : undefined);
    return getMsx2PlatformPhysicsFromScreen(screen, player);
}
function playerHasMsx2JumpComponent(player) {
    return getMsx2PlatformPhysicsFromPlayerEntity(player).jumpEnabled;
}
function playerHasMsx2GravityComponent(player) {
    return getMsx2PlatformPhysicsFromPlayerEntity(player).gravityEnabled;
}
function formatAsmWord(value) {
    const word = value & 0xffff;
    return `#${word.toString(16).toUpperCase().padStart(4, '0')}`;
}
function formatAsmByte(value) {
    const byte = value & 0xff;
    return `#${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}
/** High byte of the 8.8 terminal cap used in the MSX1 gravity routine. */
function getTerminalVelocityHighByte(terminalVelocity88) {
    return (clampMsx2TerminalVelocity88(terminalVelocity88) >> 8) & 0xff;
}
