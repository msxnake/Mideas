"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Msx2EnemyEditor = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const enemyLibrary_1 = require("../../data/enemyLibrary");
const msx2EnemyLibrary_1 = require("../../utils/msx2EnemyLibrary");
const navItems = [
    'General',
    'Graphics & Animations',
    'Behavior',
    'Combat & Hitboxes',
    'Spawn Params',
    'Sounds & Budget',
    'Preview',
];
const BEHAVIOR_OPTIONS = ['None', 'PatrolHorizontal', 'WalkerTurnOnEdge', 'FlyerSine', 'BounceDiagonal', 'Jumper', 'HopperTowardsPlayer', 'ShooterStatic', 'ChaseHorizontal', 'DropFromCeiling', 'EmergeFromGround', 'CustomBehavior'];
const ATTACK_OPTIONS = ['None', 'DamageOnTouch', 'ShooterStatic', 'ProjectileEmitter', 'MeleeBox', 'ExplosionOnTouch'];
const CATEGORY_OPTIONS = ['simpleEnemy', 'boss', 'hazard', 'projectileLike'];
const SCOPE_OPTIONS = ['common', 'perWorld', 'boss'];
const RENDER_MODE_OPTIONS = ['hardwareSprite', 'softwareSprite', 'hybrid'];
const SPRITE_SIZE_OPTIONS = ['16x16', '16x32', '32x16', '32x32'];
const PARAM_TYPE_OPTIONS = ['byte', 'int', 'enum', 'boolean'];
const SOUND_EVENTS = ['onSpawn', 'onAttack', 'onHit', 'onDeath', 'onBounce', 'onDespawn'];
const ROLE_PRESETS = [
    { id: 'idle', label: 'Idle', state: 'Idle' },
    { id: 'patrol', label: 'Patrol', state: 'Patrol' },
    { id: 'attack', label: 'Attack', state: 'Attacking' },
    { id: 'melee', label: 'Melee', state: 'MeleeAttack' },
    { id: 'shoot', label: 'Shoot', state: 'Shooting' },
    { id: 'hurt', label: 'Hurt', state: 'Damaged' },
    { id: 'death', label: 'Death', state: 'Dying' },
];
const STATE_OPTIONS = ['Idle', 'Patrol', 'Walking', 'Flying', 'Jumping', 'Falling', 'Attacking', 'MeleeAttack', 'Shooting', 'Damaged', 'Dying', 'Dead', 'Custom'];
const inputClass = 'h-7 w-full rounded border border-slate-700 bg-[#111821] px-2 text-xs text-slate-100 outline-none focus:border-red-500';
const selectClass = `${inputClass} pr-6`;
const panelClass = 'flex min-h-0 flex-col overflow-hidden rounded border border-slate-700 bg-[#1d2430] shadow-sm';
const panelTitleClass = 'flex-shrink-0 border-b border-slate-700 px-3 py-2 text-xs font-bold uppercase tracking-wide text-red-300';
const numberValue = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const slugify = (value) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'enemy';
const formatAsmSymbol = (value) => slugify(value).toUpperCase();
const parseFrameList = (value) => {
    const frames = value
        .split(',')
        .map(part => Number(part.trim()))
        .filter(Number.isFinite)
        .map(frame => Math.max(0, Math.min(255, Math.floor(frame))));
    return frames.length ? frames : [0];
};
const getAssetFrameCount = (asset) => {
    const frames = asset?.data?.frames;
    return Array.isArray(frames) ? Math.max(1, frames.length) : 1;
};
const rangeFramesForAsset = (asset) => Array.from({ length: Math.min(8, getAssetFrameCount(asset)) }, (_unused, index) => index);
const buildRenderRoles = (enemy) => {
    const roles = enemy.render.roles;
    if (Array.isArray(roles) && roles.length > 0) {
        return roles.map((role, index) => ({
            id: role.id || `role_${index + 1}`,
            label: role.label || role.id || `Role ${index + 1}`,
            state: role.state || role.label || role.id || '',
            behavior: role.behavior || 'Any',
            attack: role.attack || 'Any',
            spriteId: role.spriteId || enemy.render.spriteId || '',
            animation: role.animation || role.id || `role_${index + 1}`,
            frames: Array.isArray(role.frames) && role.frames.length ? role.frames : [0],
            speed: numberValue(role.speed, 4),
            loop: role.loop ?? true,
            notes: role.notes || '',
        }));
    }
    return Object.entries(enemy.render.animations || {}).map(([id, animation], index) => ({
        id,
        label: id.charAt(0).toUpperCase() + id.slice(1),
        state: id.charAt(0).toUpperCase() + id.slice(1),
        behavior: index === 0 ? enemy.behavior.type : 'Any',
        attack: index === 0 && enemy.attack.type !== 'None' ? enemy.attack.type : 'Any',
        spriteId: enemy.render.spriteId || '',
        animation: id,
        frames: animation.frames?.length ? animation.frames : [0],
        speed: numberValue(animation.speed, 4),
        loop: animation.loop ?? true,
    }));
};
const buildBehaviorTransitions = (enemy) => (Array.isArray(enemy.behavior.stateTransitions)
    ? enemy.behavior.stateTransitions.map((transition, index) => ({
        id: transition.id || `transition_${index + 1}`,
        label: transition.label || transition.id || `Transition ${index + 1}`,
        condition: transition.condition || 'PlayerNear',
        toBehavior: transition.toBehavior || 'ChaseHorizontal',
        fromBehavior: transition.fromBehavior || enemy.behavior.type || 'Any',
        returnBehavior: transition.returnBehavior || enemy.behavior.type || 'None',
        rangeX: Math.max(1, Math.min(255, numberValue(transition.rangeX, 48))),
        rangeY: Math.max(1, Math.min(191, numberValue(transition.rangeY, 32))),
    }))
    : []);
const Field = ({ label, children, suffix }) => ((0, jsx_runtime_1.jsxs)("label", { className: "grid grid-cols-[112px_1fr_auto] items-center gap-2 text-xs text-slate-200", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-slate-100", children: [label, ":"] }), children, (0, jsx_runtime_1.jsx)("span", { className: "min-w-0 text-[11px] text-slate-300", children: suffix })] }));
const SmallNumber = ({ value, onChange, min, max, step = 1 }) => ((0, jsx_runtime_1.jsx)("input", { type: "number", min: min, max: max, step: step, className: inputClass, value: value, onChange: event => onChange(Number(event.target.value)) }));
const Checkbox = ({ label, checked, onChange }) => ((0, jsx_runtime_1.jsxs)("label", { className: "flex items-center gap-2 text-xs text-slate-100", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: checked, onChange: event => onChange(event.target.checked), className: "h-3.5 w-3.5 accent-red-500" }), label] }));
const getSpritePixels = (asset) => {
    const sprite = asset?.data;
    const frame = sprite?.frames?.[sprite?.currentFrameIndex || 0] || sprite?.frames?.[0];
    const pixels = frame?.data;
    const width = sprite?.size?.width || pixels?.[0]?.length || 16;
    const height = sprite?.size?.height || pixels?.length || 16;
    return { pixels, backgroundColor: sprite?.backgroundColor, width, height };
};
const SpritePreview = ({ asset, size = '16x16' }) => {
    const { pixels, backgroundColor, width, height } = getSpritePixels(asset);
    const [fallbackW, fallbackH] = size.split('x').map(value => Number(value) || 16);
    const resolvedW = pixels?.[0]?.length || fallbackW;
    const resolvedH = pixels?.length || fallbackH;
    const scale = Math.max(2, Math.min(5, Math.floor(128 / Math.max(width, height, resolvedW, resolvedH))));
    if (!pixels?.length) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "relative h-32 w-32 rounded border border-slate-700 bg-[#0b1118]", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute left-[34%] top-[18%] h-[18%] w-[32%] bg-[#5f437f]" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute left-[20%] top-[32%] h-[24%] w-[60%] bg-[#7c5aa8]" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute left-[8%] top-[24%] h-[26%] w-[26%] bg-[#3d2d5c]" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute right-[8%] top-[24%] h-[26%] w-[26%] bg-[#3d2d5c]" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute left-[38%] top-[52%] h-[18%] w-[24%] bg-[#251b38]" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute left-[42%] top-[36%] h-[5%] w-[5%] bg-[#f4d35e]" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute right-[42%] top-[36%] h-[5%] w-[5%] bg-[#f4d35e]" })] }));
    }
    return ((0, jsx_runtime_1.jsx)("div", { className: "grid rounded border border-slate-700 bg-[#0b1118] p-2", style: {
            gridTemplateColumns: `repeat(${width}, ${scale}px)`,
            gridAutoRows: `${scale}px`,
            width: width * scale + 16,
            height: height * scale + 16,
        }, children: Array.from({ length: height }).flatMap((_, y) => Array.from({ length: width }).map((__, x) => {
            const color = String((pixels[y]?.[x] ?? backgroundColor) || 'transparent');
            const transparent = !color || color.toUpperCase() === String(backgroundColor || '').toUpperCase() || color.toUpperCase() === 'TRANSPARENT' || color.toUpperCase() === 'RGBA(0,0,0,0)';
            return (0, jsx_runtime_1.jsx)("span", { style: { backgroundColor: transparent ? 'transparent' : color } }, `${x}_${y}`);
        })) }));
};
const HitboxEditor = ({ title, value, onChange }) => ((0, jsx_runtime_1.jsxs)("div", { className: "rounded border border-slate-700 bg-[#111821] p-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "mb-2 text-xs font-semibold uppercase tracking-wide text-slate-300", children: title }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-4 gap-2", children: ['x', 'y', 'w', 'h'].map(key => ((0, jsx_runtime_1.jsxs)("label", { className: "space-y-1 text-xs text-slate-200", children: [(0, jsx_runtime_1.jsx)("span", { className: "uppercase text-slate-400", children: key }), (0, jsx_runtime_1.jsx)(SmallNumber, { value: numberValue(value[key]), onChange: next => onChange({ ...value, [key]: next }), min: 0 })] }, key))) })] }));
const buildEnemyAsmPreview = (enemy) => {
    const enemySymbol = `ENEMY_${formatAsmSymbol(enemy.enemyId)}`;
    const params = enemy.spawnParamsSchema
        .slice()
        .sort((a, b) => a.exportParam.localeCompare(b.exportParam))
        .map(param => {
        if (param.type === 'boolean')
            return param.default ? '1' : '0';
        if (param.type === 'enum')
            return `${formatAsmSymbol(param.name)}_${formatAsmSymbol(String(param.default))}`;
        return String(param.default);
    });
    return [
        `${enemySymbol} EQU 0`,
        '',
        `${enemySymbol}_DEF:`,
        `    db BEHAVIOR_${formatAsmSymbol(enemy.behavior.type)}, ATTACK_${formatAsmSymbol(enemy.attack.type)}`,
        `    db ${enemy.stats.hp}, ${enemy.stats.damage}, ${enemy.stats.invulnerabilityFrames || 0}, ${enemy.stats.knockback || 0}`,
        `    db ${enemy.budget.cpu}, ${enemy.budget.sprites}, ${enemy.budget.ram}`,
        `    dw ${formatAsmSymbol(enemy.render.spriteId || 'missing_sprite')}_SPR`,
        '',
        `; Render roles:`,
        ...buildRenderRoles(enemy).map(role => `;   ${formatAsmSymbol(role.id)} state=${role.state || '-'} behavior=${role.behavior || 'Any'} attack=${role.attack || 'Any'} sprite=${role.spriteId || enemy.render.spriteId || 'default'} frames=${role.frames.join(',')} speed=${role.speed}`),
        '',
        `; Spawn: enemyId, x, y, p0, p1, p2, p3`,
        `    db ${enemySymbol}, 80, 64${params.length ? `, ${params.join(', ')}` : ''}`,
        `    db $FF`,
    ].join('\n');
};
const validateEnemy = (enemy, allAssets) => {
    const issues = [];
    if (!enemy.name.trim())
        issues.push('Name is required.');
    if (!enemy.enemyId.trim())
        issues.push('Enemy ID is required.');
    if (!enemy.render.spriteId)
        issues.push('Sprite is not assigned.');
    if (enemy.render.spriteId && !allAssets.some(asset => asset.id === enemy.render.spriteId))
        issues.push('Assigned sprite was not found.');
    if (Object.keys(enemy.render.animations || {}).length === 0)
        issues.push('At least one animation is recommended.');
    const roles = buildRenderRoles(enemy);
    if (roles.length === 0)
        issues.push('At least one render role is recommended.');
    if (roles.some(role => role.spriteId && !allAssets.some(asset => asset.id === role.spriteId)))
        issues.push('A render role references a missing sprite.');
    if (roles.some(role => role.frames.length === 0))
        issues.push('Every render role needs at least one frame.');
    if (enemy.hitboxes.body.w <= 0 || enemy.hitboxes.body.h <= 0)
        issues.push('Body hitbox must have width and height.');
    if (enemy.budget.sprites > 4)
        issues.push('Sprite budget is high for MSX2 hardware sprites.');
    return issues;
};
const Msx2EnemyEditor = ({ enemy, onUpdate, allAssets, setStatusBarMessage, }) => {
    const [activeSection, setActiveSection] = (0, react_1.useState)('General');
    const [selectedRoleIndex, setSelectedRoleIndex] = (0, react_1.useState)(0);
    const selectedSprite = (0, react_1.useMemo)(() => allAssets.find(asset => asset.id === enemy.render.spriteId) || null, [allAssets, enemy.render.spriteId]);
    const spriteAssets = allAssets.filter(asset => asset.type === 'msx2sprite' || asset.type === 'sprite');
    const soundAssets = allAssets.filter(asset => asset.type === 'sound');
    const issues = validateEnemy(enemy, allAssets);
    const animationEntries = Object.entries(enemy.render.animations || {});
    const renderRoles = buildRenderRoles(enemy);
    const behaviorTransitions = buildBehaviorTransitions(enemy);
    const selectedRole = renderRoles[Math.min(selectedRoleIndex, Math.max(0, renderRoles.length - 1))];
    const selectedRoleSprite = allAssets.find(asset => asset.id === selectedRole?.spriteId) || selectedSprite;
    const patch = (next) => onUpdate({ ...enemy, ...next });
    const patchRender = (next) => patch({ render: { ...enemy.render, ...next } });
    const patchStats = (next) => patch({ stats: { ...enemy.stats, ...next } });
    const patchBudget = (next) => patch({ budget: { ...enemy.budget, ...next } });
    const patchSound = (eventId, soundAssetId) => patch({ sound: { ...enemy.sound, [eventId]: soundAssetId || null } });
    const patchRoles = (roles) => patchRender({ roles });
    const patchBehaviorTransitions = (stateTransitions) => patch({
        behavior: { ...enemy.behavior, stateTransitions },
    });
    const applyTemplate = (templateId) => {
        const template = enemyLibrary_1.GLOBAL_ENEMY_TEMPLATES.find(item => item.templateId === templateId);
        if (!template)
            return;
        const next = (0, enemyLibrary_1.createEnemyFromTemplate)(template, { name: enemy.name || template.name });
        onUpdate({
            ...next,
            enemyId: enemy.enemyId || next.enemyId,
            name: enemy.name || next.name,
            render: {
                ...next.render,
                spriteId: enemy.render.spriteId,
                palette: enemy.render.palette,
            },
            sound: { ...next.sound, ...enemy.sound },
            budget: {
                ...next.budget,
                codePackage: enemy.budget.codePackage || next.budget.codePackage,
                graphicsPackage: enemy.budget.graphicsPackage || next.budget.graphicsPackage,
                graphicsBank: enemy.budget.graphicsBank || next.budget.graphicsBank,
                ramPackage: enemy.budget.ramPackage || next.budget.ramPackage,
            },
        });
        setStatusBarMessage?.(`Applied enemy preset "${template.name}".`);
    };
    const updateAnimation = (name, patchAnimation) => {
        patchRender({
            animations: {
                ...enemy.render.animations,
                [name]: {
                    frames: enemy.render.animations[name]?.frames || [0],
                    speed: enemy.render.animations[name]?.speed || 4,
                    loop: enemy.render.animations[name]?.loop ?? true,
                    ...patchAnimation,
                },
            },
        });
    };
    const renameAnimation = (oldName, newName) => {
        const key = slugify(newName);
        if (!key || key === oldName)
            return;
        const nextAnimations = { ...enemy.render.animations };
        nextAnimations[key] = nextAnimations[oldName];
        delete nextAnimations[oldName];
        patchRender({ animations: nextAnimations });
    };
    const removeAnimation = (name) => {
        const nextAnimations = { ...enemy.render.animations };
        delete nextAnimations[name];
        patchRender({ animations: nextAnimations });
    };
    const updateRenderRole = (index, next) => {
        const roles = renderRoles.map((role, roleIndex) => (roleIndex === index ? { ...role, ...next } : role));
        patchRoles(roles);
    };
    const addRenderRole = (preset = ROLE_PRESETS[0]) => {
        const usedIds = new Set(renderRoles.map(role => role.id));
        let id = preset.id;
        let suffix = 2;
        while (usedIds.has(id))
            id = `${preset.id}_${suffix++}`;
        const spriteId = enemy.render.spriteId || spriteAssets[0]?.id || '';
        const sprite = allAssets.find(asset => asset.id === spriteId) || null;
        const frames = rangeFramesForAsset(sprite);
        const role = {
            id,
            label: preset.label,
            state: preset.state,
            behavior: preset.id === 'patrol' ? enemy.behavior.type : 'Any',
            attack: preset.id === 'attack' || preset.id === 'melee' || preset.id === 'shoot' ? enemy.attack.type : 'Any',
            spriteId,
            animation: id,
            frames,
            speed: 4,
            loop: preset.id !== 'death',
        };
        patchRoles([...renderRoles, role]);
        setSelectedRoleIndex(renderRoles.length);
    };
    const duplicateRenderRole = (index) => {
        const source = renderRoles[index];
        if (!source)
            return;
        const usedIds = new Set(renderRoles.map(role => role.id));
        let id = `${source.id}_copy`;
        let suffix = 2;
        while (usedIds.has(id))
            id = `${source.id}_copy_${suffix++}`;
        patchRoles([...renderRoles, { ...source, id, label: `${source.label} Copy`, animation: id }]);
        setSelectedRoleIndex(renderRoles.length);
    };
    const removeRenderRole = (index) => {
        const nextRoles = renderRoles.filter((_role, roleIndex) => roleIndex !== index);
        patchRoles(nextRoles);
        setSelectedRoleIndex(Math.max(0, Math.min(index, nextRoles.length - 1)));
    };
    const updateBehaviorTransition = (index, next) => {
        patchBehaviorTransitions(behaviorTransitions.map((transition, transitionIndex) => (transitionIndex === index ? { ...transition, ...next } : transition)));
    };
    const addBehaviorTransition = () => {
        const usedIds = new Set(behaviorTransitions.map(transition => transition.id));
        let id = 'player_near_chase';
        let suffix = 2;
        while (usedIds.has(id))
            id = `player_near_chase_${suffix++}`;
        patchBehaviorTransitions([
            ...behaviorTransitions,
            {
                id,
                label: 'Player Near Chase',
                condition: 'PlayerNear',
                fromBehavior: enemy.behavior.type || 'Any',
                toBehavior: 'ChaseHorizontal',
                returnBehavior: enemy.behavior.type || 'None',
                rangeX: 48,
                rangeY: 32,
            },
        ]);
    };
    const removeBehaviorTransition = (index) => {
        patchBehaviorTransitions(behaviorTransitions.filter((_transition, transitionIndex) => transitionIndex !== index));
    };
    const updateSpawnParam = (index, next) => {
        patch({
            spawnParamsSchema: enemy.spawnParamsSchema.map((param, paramIndex) => (paramIndex === index ? { ...param, ...next } : param)),
        });
    };
    const removeSpawnParam = (index) => {
        patch({ spawnParamsSchema: enemy.spawnParamsSchema.filter((_, paramIndex) => paramIndex !== index) });
    };
    const addSpawnParam = () => {
        const used = new Set(enemy.spawnParamsSchema.map(param => param.exportParam));
        const slot = ['p0', 'p1', 'p2', 'p3'].find(value => !used.has(value)) || 'p3';
        patch({
            spawnParamsSchema: [
                ...enemy.spawnParamsSchema,
                { name: slot, label: `Param ${slot.toUpperCase()}`, type: 'byte', default: 0, min: 0, max: 255, exportParam: slot },
            ],
        });
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex h-full min-h-0 flex-col bg-[#121820] text-slate-100", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-none items-center justify-between border-b border-slate-700 bg-[#17202b] px-4 py-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "min-w-0", children: [(0, jsx_runtime_1.jsxs)("h2", { className: "truncate text-base font-bold text-red-200", children: ["MSX2 Enemy Config: ", enemy.name || 'Unnamed enemy'] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-xs text-slate-400", children: [enemy.enemyId || 'missing_id', " \u00B7 ", enemy.behavior.type, " \u00B7 ", enemy.attack.type] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsxs)("select", { className: "h-8 rounded border border-slate-700 bg-[#111821] px-2 text-xs text-slate-100", value: enemy.basedOnTemplate || '', onChange: event => applyTemplate(event.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Apply preset..." }), enemyLibrary_1.GLOBAL_ENEMY_TEMPLATES.map(template => ((0, jsx_runtime_1.jsx)("option", { value: template.templateId, children: template.name }, template.templateId)))] }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "h-8 rounded border border-emerald-700 bg-emerald-900/30 px-3 text-xs text-emerald-100 hover:bg-emerald-800/50", title: "Save this enemy to the global MSX2 Enemies Library (persists across projects, reusable via Libraries > Enemies).", onClick: () => {
                                    const entry = (0, msx2EnemyLibrary_1.addEntryToMsx2EnemyLibrary)(enemy, enemy.name);
                                    setStatusBarMessage?.(`Exported "${entry.name}" to the global MSX2 Enemies Library.`);
                                    alert(`Exported "${entry.name}" to the global MSX2 Enemies Library.`);
                                }, children: "Export to Library" }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "h-8 rounded border border-red-700 bg-red-900/30 px-3 text-xs text-red-100 hover:bg-red-800/50", onClick: () => applyTemplate('bat_enemy_basic'), children: "Bat Enemy" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid min-h-0 flex-1 grid-cols-[180px_1fr_300px] gap-3 p-3", children: [(0, jsx_runtime_1.jsxs)("aside", { className: "min-h-0 overflow-hidden rounded border border-slate-700 bg-[#1d2430]", children: [(0, jsx_runtime_1.jsx)("div", { className: "border-b border-slate-700 px-4 py-2 text-xs font-bold uppercase tracking-wide text-red-300", children: "Enemy Asset" }), navItems.map(item => ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setActiveSection(item), className: `block h-8 w-full border-b border-slate-800 px-4 text-left text-xs ${activeSection === item ? 'bg-red-700 text-white' : 'text-slate-100 hover:bg-slate-800'}`, children: item }, item)))] }), (0, jsx_runtime_1.jsxs)("main", { className: "relative min-h-0", children: [(0, jsx_runtime_1.jsxs)("section", { className: `${panelClass} ${activeSection === 'General' ? 'absolute inset-0' : 'hidden'}`, children: [(0, jsx_runtime_1.jsx)("div", { className: panelTitleClass, children: "General" }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3 overflow-auto p-4", children: [(0, jsx_runtime_1.jsx)(Field, { label: "Name", children: (0, jsx_runtime_1.jsx)("input", { className: inputClass, value: enemy.name, onChange: event => patch({ name: event.target.value }) }) }), (0, jsx_runtime_1.jsx)(Field, { label: "Enemy ID", children: (0, jsx_runtime_1.jsx)("input", { className: inputClass, value: enemy.enemyId, onChange: event => patch({ enemyId: slugify(event.target.value) }) }) }), (0, jsx_runtime_1.jsx)(Field, { label: "Category", children: (0, jsx_runtime_1.jsx)("select", { className: selectClass, value: enemy.category, onChange: event => patch({ category: event.target.value }), children: CATEGORY_OPTIONS.map(option => (0, jsx_runtime_1.jsx)("option", { value: option, children: option }, option)) }) }), (0, jsx_runtime_1.jsx)(Field, { label: "Scope", children: (0, jsx_runtime_1.jsx)("select", { className: selectClass, value: enemy.scope, onChange: event => patch({ scope: event.target.value }), children: SCOPE_OPTIONS.map(option => (0, jsx_runtime_1.jsx)("option", { value: option, children: option }, option)) }) }), (0, jsx_runtime_1.jsx)(Field, { label: "World/Group", children: (0, jsx_runtime_1.jsx)("input", { className: inputClass, value: enemy.world, onChange: event => patch({ world: event.target.value }) }) }), (0, jsx_runtime_1.jsx)(Field, { label: "Behavior Set", children: (0, jsx_runtime_1.jsx)("input", { className: inputClass, value: enemy.behaviorGroup, onChange: event => patch({ behaviorGroup: event.target.value }) }) }), (0, jsx_runtime_1.jsxs)("label", { className: "block space-y-1 text-xs text-slate-200", children: [(0, jsx_runtime_1.jsx)("span", { children: "Notes" }), (0, jsx_runtime_1.jsx)("textarea", { className: "h-28 w-full rounded border border-slate-700 bg-[#111821] p-2 text-xs text-slate-100 outline-none focus:border-red-500", value: enemy.notes || '', onChange: event => patch({ notes: event.target.value }) })] })] })] }), (0, jsx_runtime_1.jsxs)("section", { className: `${panelClass} ${activeSection === 'Graphics & Animations' ? 'absolute inset-0' : 'hidden'}`, children: [(0, jsx_runtime_1.jsx)("div", { className: panelTitleClass, children: "Graphics & Animations" }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4 overflow-auto p-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded border border-slate-700 bg-[#111821]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-3 border-b border-slate-700 p-3", children: [(0, jsx_runtime_1.jsx)(Field, { label: "Default Sprite", children: (0, jsx_runtime_1.jsxs)("select", { className: selectClass, value: enemy.render.spriteId, onChange: event => patchRender({ spriteId: event.target.value }), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "None" }), spriteAssets.map(asset => (0, jsx_runtime_1.jsx)("option", { value: asset.id, children: asset.name }, asset.id))] }) }), (0, jsx_runtime_1.jsx)(Field, { label: "Render Mode", children: (0, jsx_runtime_1.jsx)("select", { className: selectClass, value: enemy.render.renderMode, onChange: event => patchRender({ renderMode: event.target.value }), children: RENDER_MODE_OPTIONS.map(option => (0, jsx_runtime_1.jsx)("option", { value: option, children: option }, option)) }) }), (0, jsx_runtime_1.jsx)(Field, { label: "Size", children: (0, jsx_runtime_1.jsx)("select", { className: selectClass, value: enemy.render.size, onChange: event => patchRender({ size: event.target.value }), children: SPRITE_SIZE_OPTIONS.map(option => (0, jsx_runtime_1.jsx)("option", { value: option, children: option }, option)) }) }), (0, jsx_runtime_1.jsx)(Field, { label: "Palette", children: (0, jsx_runtime_1.jsx)("input", { className: inputClass, value: enemy.render.palette, onChange: event => patchRender({ palette: event.target.value }) }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between border-b border-slate-700 px-3 py-2", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "text-xs font-bold uppercase text-red-300", children: "Role Render Links" }), (0, jsx_runtime_1.jsx)("div", { className: "text-[11px] text-slate-400", children: "Declarative links: state/behavior to sprite render and frames." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsxs)("select", { className: "h-7 rounded border border-slate-700 bg-[#0b1118] px-2 text-xs text-slate-100 outline-none focus:border-red-500", defaultValue: "", onChange: event => {
                                                                            const preset = ROLE_PRESETS.find(item => item.id === event.target.value);
                                                                            if (preset)
                                                                                addRenderRole(preset);
                                                                            event.currentTarget.value = '';
                                                                        }, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Add role..." }), ROLE_PRESETS.map(preset => (0, jsx_runtime_1.jsx)("option", { value: preset.id, children: preset.label }, preset.id))] }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "h-7 rounded border border-slate-600 px-3 text-xs text-slate-100 hover:bg-slate-800", onClick: () => duplicateRenderRole(Math.min(selectedRoleIndex, Math.max(0, renderRoles.length - 1))), children: "Duplicate" })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "min-h-[150px] overflow-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "w-full table-fixed text-xs", children: [(0, jsx_runtime_1.jsx)("thead", { className: "bg-[#141b25] text-left text-slate-300", children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { className: "w-12 px-3 py-2", children: "ID" }), (0, jsx_runtime_1.jsx)("th", { className: "w-28 px-3 py-2", children: "Role" }), (0, jsx_runtime_1.jsx)("th", { className: "w-32 px-3 py-2", children: "State" }), (0, jsx_runtime_1.jsx)("th", { className: "w-36 px-3 py-2", children: "Behavior" }), (0, jsx_runtime_1.jsx)("th", { className: "w-36 px-3 py-2", children: "Attack" }), (0, jsx_runtime_1.jsx)("th", { className: "px-3 py-2", children: "Sprite" }), (0, jsx_runtime_1.jsx)("th", { className: "w-24 px-3 py-2", children: "Frames" }), (0, jsx_runtime_1.jsx)("th", { className: "w-20 px-3 py-2", children: "Speed" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: renderRoles.map((role, index) => {
                                                                        const roleSprite = allAssets.find(asset => asset.id === role.spriteId);
                                                                        return ((0, jsx_runtime_1.jsxs)("tr", { className: `cursor-pointer border-t border-slate-800 ${index === selectedRoleIndex ? 'bg-red-950/40 text-white' : 'text-slate-100 hover:bg-slate-800/60'}`, onClick: () => setSelectedRoleIndex(index), children: [(0, jsx_runtime_1.jsx)("td", { className: "px-3 py-2 text-slate-300", children: index }), (0, jsx_runtime_1.jsx)("td", { className: "truncate px-3 py-2 font-semibold", children: role.label }), (0, jsx_runtime_1.jsx)("td", { className: "truncate px-3 py-2", children: role.state || '-' }), (0, jsx_runtime_1.jsx)("td", { className: "truncate px-3 py-2", children: role.behavior || 'Any' }), (0, jsx_runtime_1.jsx)("td", { className: "truncate px-3 py-2", children: role.attack || 'Any' }), (0, jsx_runtime_1.jsx)("td", { className: "truncate px-3 py-2", children: roleSprite?.name || (role.spriteId ? 'Missing sprite' : 'Default') }), (0, jsx_runtime_1.jsx)("td", { className: "truncate px-3 py-2", children: role.frames.join(',') }), (0, jsx_runtime_1.jsx)("td", { className: "px-3 py-2", children: role.speed })] }, `${role.id}_${index}`));
                                                                    }) })] }) })] }), selectedRole && ((0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-[180px_1fr] gap-3 rounded border border-slate-700 bg-[#111821] p-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center justify-center rounded border border-slate-700 bg-[#0b1118] p-3", children: [(0, jsx_runtime_1.jsx)(SpritePreview, { asset: selectedRoleSprite, size: enemy.render.size }), (0, jsx_runtime_1.jsx)("div", { className: "mt-2 max-w-full truncate text-xs text-slate-300", children: selectedRoleSprite?.name || 'Default sprite' })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-3", children: [(0, jsx_runtime_1.jsx)(Field, { label: "Role ID", children: (0, jsx_runtime_1.jsx)("input", { className: inputClass, value: selectedRole.id, onChange: event => updateRenderRole(selectedRoleIndex, { id: slugify(event.target.value), animation: slugify(event.target.value) }) }) }), (0, jsx_runtime_1.jsx)(Field, { label: "Label", children: (0, jsx_runtime_1.jsx)("input", { className: inputClass, value: selectedRole.label, onChange: event => updateRenderRole(selectedRoleIndex, { label: event.target.value }) }) }), (0, jsx_runtime_1.jsx)(Field, { label: "State", children: (0, jsx_runtime_1.jsxs)("select", { className: selectClass, value: selectedRole.state || '', onChange: event => updateRenderRole(selectedRoleIndex, { state: event.target.value }), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Unlinked" }), STATE_OPTIONS.map(option => (0, jsx_runtime_1.jsx)("option", { value: option, children: option }, option))] }) }), (0, jsx_runtime_1.jsx)(Field, { label: "Sprite", children: (0, jsx_runtime_1.jsxs)("select", { className: selectClass, value: selectedRole.spriteId || '', onChange: event => updateRenderRole(selectedRoleIndex, { spriteId: event.target.value, frames: rangeFramesForAsset(allAssets.find(asset => asset.id === event.target.value)) }), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Use default sprite" }), spriteAssets.map(asset => (0, jsx_runtime_1.jsx)("option", { value: asset.id, children: asset.name }, asset.id))] }) }), (0, jsx_runtime_1.jsx)(Field, { label: "Behavior", children: (0, jsx_runtime_1.jsxs)("select", { className: selectClass, value: selectedRole.behavior || 'Any', onChange: event => updateRenderRole(selectedRoleIndex, { behavior: event.target.value }), children: [(0, jsx_runtime_1.jsx)("option", { value: "Any", children: "Any" }), BEHAVIOR_OPTIONS.map(option => (0, jsx_runtime_1.jsx)("option", { value: option, children: option }, option))] }) }), (0, jsx_runtime_1.jsx)(Field, { label: "Attack", children: (0, jsx_runtime_1.jsxs)("select", { className: selectClass, value: selectedRole.attack || 'Any', onChange: event => updateRenderRole(selectedRoleIndex, { attack: event.target.value }), children: [(0, jsx_runtime_1.jsx)("option", { value: "Any", children: "Any" }), ATTACK_OPTIONS.map(option => (0, jsx_runtime_1.jsx)("option", { value: option, children: option }, option))] }) }), (0, jsx_runtime_1.jsx)(Field, { label: "Frames", children: (0, jsx_runtime_1.jsx)("input", { className: inputClass, value: selectedRole.frames.join(','), onChange: event => updateRenderRole(selectedRoleIndex, { frames: parseFrameList(event.target.value) }) }) }), (0, jsx_runtime_1.jsx)(Field, { label: "Speed", children: (0, jsx_runtime_1.jsx)(SmallNumber, { value: selectedRole.speed, min: 1, max: 255, onChange: value => updateRenderRole(selectedRoleIndex, { speed: value }) }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-[1fr_auto_auto] items-center gap-2", children: [(0, jsx_runtime_1.jsx)("input", { className: inputClass, value: selectedRole.notes || '', placeholder: "Notes for this render role", onChange: event => updateRenderRole(selectedRoleIndex, { notes: event.target.value }) }), (0, jsx_runtime_1.jsx)(Checkbox, { label: "Loop", checked: selectedRole.loop, onChange: checked => updateRenderRole(selectedRoleIndex, { loop: checked }) }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "h-7 rounded border border-red-700 bg-red-950/30 px-3 text-xs text-red-100 hover:bg-red-900/50", onClick: () => removeRenderRole(selectedRoleIndex), children: "Delete" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-[11px] text-slate-400", children: ["Internal key: ", selectedRole.id, " - Animation: ", selectedRole.animation, " - Frames: ", selectedRole.frames.join(', ')] })] })] })), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2 rounded border border-slate-700 bg-[#111821] p-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "text-xs font-semibold uppercase text-slate-300", children: "Animation Clips" }), (0, jsx_runtime_1.jsx)("div", { className: "text-[11px] text-slate-500", children: "Compatibility clips. Runtime role links above choose the sprite and frame set." })] }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "rounded border border-slate-600 px-2 py-1 text-xs hover:bg-slate-800", onClick: () => updateAnimation(`anim_${animationEntries.length + 1}`, { frames: [0], speed: 4, loop: true }), children: "Add" })] }), animationEntries.map(([name, animation]) => ((0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-[120px_1fr_72px_72px_auto] items-center gap-2 rounded border border-slate-700 bg-[#0b1118] p-2", children: [(0, jsx_runtime_1.jsx)("input", { className: inputClass, value: name, onChange: event => renameAnimation(name, event.target.value) }), (0, jsx_runtime_1.jsx)("input", { className: inputClass, value: animation.frames.join(','), onChange: event => updateAnimation(name, { frames: parseFrameList(event.target.value) }) }), (0, jsx_runtime_1.jsx)(SmallNumber, { value: animation.speed, min: 1, onChange: value => updateAnimation(name, { speed: value }) }), (0, jsx_runtime_1.jsx)(Checkbox, { label: "Loop", checked: animation.loop, onChange: checked => updateAnimation(name, { loop: checked }) }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "rounded border border-slate-600 px-2 py-1 text-xs hover:bg-slate-800", onClick: () => removeAnimation(name), children: "Remove" })] }, name)))] })] })] }), (0, jsx_runtime_1.jsxs)("section", { className: `${panelClass} ${activeSection === 'Behavior' ? 'absolute inset-0' : 'hidden'}`, children: [(0, jsx_runtime_1.jsx)("div", { className: panelTitleClass, children: "Behavior" }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3 overflow-auto p-4", children: [(0, jsx_runtime_1.jsx)(Field, { label: "Movement", children: (0, jsx_runtime_1.jsx)("select", { className: selectClass, value: enemy.behavior.type, onChange: event => patch({ behavior: { ...enemy.behavior, type: event.target.value } }), children: BEHAVIOR_OPTIONS.map(option => (0, jsx_runtime_1.jsx)("option", { value: option, children: option }, option)) }) }), (0, jsx_runtime_1.jsx)(Field, { label: "Custom Routine", children: (0, jsx_runtime_1.jsx)("input", { className: inputClass, value: enemy.behavior.customRoutine || '', onChange: event => patch({ behavior: { ...enemy.behavior, customRoutine: event.target.value } }) }) }), (0, jsx_runtime_1.jsx)("div", { className: "rounded border border-slate-700 bg-[#111821] p-3 text-xs text-slate-300", children: "`FlyerSine` is the recommended movement for Bat Enemy. `PatrolHorizontal` and `WalkerTurnOnEdge` are cheaper for ground enemies." }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2 rounded border border-slate-700 bg-[#111821] p-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between gap-2", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "text-xs font-semibold uppercase tracking-wide text-slate-300", children: "Runtime State Switches" }), (0, jsx_runtime_1.jsx)("div", { className: "text-[11px] text-slate-500", children: "Compact MSX2 behavior changes. Render roles remain declarative until per-slot render is implemented." })] }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "h-7 rounded border border-slate-600 px-3 text-xs text-slate-100 hover:bg-slate-800", onClick: addBehaviorTransition, children: "Add Player Near" })] }), behaviorTransitions.length === 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "rounded border border-slate-800 bg-[#0b1118] p-2 text-xs text-slate-400", children: "No runtime behavior transition. Enemy keeps its base movement." })) : ((0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: behaviorTransitions.map((transition, index) => ((0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-[120px_130px_130px_86px_86px_auto] items-end gap-2 rounded border border-slate-700 bg-[#0b1118] p-2", children: [(0, jsx_runtime_1.jsxs)("label", { className: "space-y-1 text-xs text-slate-200", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-slate-400", children: "Condition" }), (0, jsx_runtime_1.jsx)("select", { className: selectClass, value: transition.condition, onChange: event => updateBehaviorTransition(index, { condition: event.target.value }), children: (0, jsx_runtime_1.jsx)("option", { value: "PlayerNear", children: "PlayerNear" }) })] }), (0, jsx_runtime_1.jsxs)("label", { className: "space-y-1 text-xs text-slate-200", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-slate-400", children: "Near behavior" }), (0, jsx_runtime_1.jsx)("select", { className: selectClass, value: transition.toBehavior, onChange: event => updateBehaviorTransition(index, { toBehavior: event.target.value }), children: BEHAVIOR_OPTIONS.map(option => (0, jsx_runtime_1.jsx)("option", { value: option, children: option }, option)) })] }), (0, jsx_runtime_1.jsxs)("label", { className: "space-y-1 text-xs text-slate-200", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-slate-400", children: "Return behavior" }), (0, jsx_runtime_1.jsx)("select", { className: selectClass, value: transition.returnBehavior || enemy.behavior.type, onChange: event => updateBehaviorTransition(index, { returnBehavior: event.target.value }), children: BEHAVIOR_OPTIONS.map(option => (0, jsx_runtime_1.jsx)("option", { value: option, children: option }, option)) })] }), (0, jsx_runtime_1.jsxs)("label", { className: "space-y-1 text-xs text-slate-200", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-slate-400", children: "Range X" }), (0, jsx_runtime_1.jsx)(SmallNumber, { value: transition.rangeX, min: 1, max: 255, onChange: value => updateBehaviorTransition(index, { rangeX: value }) })] }), (0, jsx_runtime_1.jsxs)("label", { className: "space-y-1 text-xs text-slate-200", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-slate-400", children: "Range Y" }), (0, jsx_runtime_1.jsx)(SmallNumber, { value: transition.rangeY, min: 1, max: 191, onChange: value => updateBehaviorTransition(index, { rangeY: value }) })] }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "h-7 rounded border border-red-700 bg-red-950/30 px-3 text-xs text-red-100 hover:bg-red-900/50", onClick: () => removeBehaviorTransition(index), children: "Delete" })] }, `${transition.id}_${index}`))) }))] }), (0, jsx_runtime_1.jsxs)("label", { className: "block space-y-1 text-xs text-slate-200", children: [(0, jsx_runtime_1.jsx)("span", { children: "Required Routines" }), (0, jsx_runtime_1.jsx)("textarea", { className: "h-32 w-full rounded border border-slate-700 bg-[#111821] p-2 font-mono text-xs text-slate-100 outline-none focus:border-red-500", value: enemy.requiredRoutines.join('\n'), onChange: event => patch({ requiredRoutines: event.target.value.split(/\r?\n|,/).map(value => value.trim()).filter(Boolean) }) })] })] })] }), (0, jsx_runtime_1.jsxs)("section", { className: `${panelClass} ${activeSection === 'Combat & Hitboxes' ? 'absolute inset-0' : 'hidden'}`, children: [(0, jsx_runtime_1.jsx)("div", { className: panelTitleClass, children: "Combat & Hitboxes" }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4 overflow-auto p-4", children: [(0, jsx_runtime_1.jsx)(Field, { label: "Attack", children: (0, jsx_runtime_1.jsx)("select", { className: selectClass, value: enemy.attack.type, onChange: event => patch({ attack: { ...enemy.attack, type: event.target.value } }), children: ATTACK_OPTIONS.map(option => (0, jsx_runtime_1.jsx)("option", { value: option, children: option }, option)) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-4 gap-3", children: [(0, jsx_runtime_1.jsx)(Field, { label: "HP", children: (0, jsx_runtime_1.jsx)(SmallNumber, { value: enemy.stats.hp, min: 0, onChange: value => patchStats({ hp: value }) }) }), (0, jsx_runtime_1.jsx)(Field, { label: "Damage", children: (0, jsx_runtime_1.jsx)(SmallNumber, { value: enemy.stats.damage, min: 0, onChange: value => patchStats({ damage: value }) }) }), (0, jsx_runtime_1.jsx)(Field, { label: "I-Frames", children: (0, jsx_runtime_1.jsx)(SmallNumber, { value: enemy.stats.invulnerabilityFrames || 0, min: 0, onChange: value => patchStats({ invulnerabilityFrames: value }) }) }), (0, jsx_runtime_1.jsx)(Field, { label: "Knockback", children: (0, jsx_runtime_1.jsx)(SmallNumber, { value: enemy.stats.knockback || 0, min: 0, onChange: value => patchStats({ knockback: value }) }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-3", children: [(0, jsx_runtime_1.jsx)(HitboxEditor, { title: "Body Hitbox", value: enemy.hitboxes.body, onChange: body => patch({ hitboxes: { ...enemy.hitboxes, body } }) }), (0, jsx_runtime_1.jsx)(HitboxEditor, { title: "Damage Hitbox", value: enemy.hitboxes.damage, onChange: damage => patch({ hitboxes: { ...enemy.hitboxes, damage } }) })] })] })] }), (0, jsx_runtime_1.jsxs)("section", { className: `${panelClass} ${activeSection === 'Spawn Params' ? 'absolute inset-0' : 'hidden'}`, children: [(0, jsx_runtime_1.jsx)("div", { className: panelTitleClass, children: "Spawn Params" }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3 overflow-auto p-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex justify-end", children: (0, jsx_runtime_1.jsx)("button", { type: "button", className: "rounded border border-slate-600 px-2 py-1 text-xs hover:bg-slate-800", onClick: addSpawnParam, children: "Add Param" }) }), enemy.spawnParamsSchema.map((param, index) => ((0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-[72px_100px_1fr_88px_88px_96px_auto] items-center gap-2 rounded border border-slate-700 bg-[#111821] p-2", children: [(0, jsx_runtime_1.jsx)("select", { className: selectClass, value: param.exportParam, onChange: event => updateSpawnParam(index, { exportParam: event.target.value }), children: ['p0', 'p1', 'p2', 'p3'].map(slot => (0, jsx_runtime_1.jsx)("option", { value: slot, children: slot }, slot)) }), (0, jsx_runtime_1.jsx)("input", { className: inputClass, value: param.name, onChange: event => updateSpawnParam(index, { name: slugify(event.target.value) }) }), (0, jsx_runtime_1.jsx)("input", { className: inputClass, value: param.label || '', onChange: event => updateSpawnParam(index, { label: event.target.value }) }), (0, jsx_runtime_1.jsx)("select", { className: selectClass, value: param.type, onChange: event => updateSpawnParam(index, { type: event.target.value }), children: PARAM_TYPE_OPTIONS.map(option => (0, jsx_runtime_1.jsx)("option", { value: option, children: option }, option)) }), (0, jsx_runtime_1.jsx)("input", { className: inputClass, value: String(param.default), onChange: event => updateSpawnParam(index, { default: param.type === 'boolean' ? event.target.value === 'true' : param.type === 'enum' ? event.target.value : Number(event.target.value) }) }), (0, jsx_runtime_1.jsx)("input", { className: inputClass, value: (param.values || []).join(','), placeholder: "enum values", onChange: event => updateSpawnParam(index, { values: event.target.value.split(',').map(value => value.trim()).filter(Boolean) }) }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "rounded border border-slate-600 px-2 py-1 text-xs hover:bg-slate-800", onClick: () => removeSpawnParam(index), children: "Remove" })] }, `${param.exportParam}_${index}`)))] })] }), (0, jsx_runtime_1.jsxs)("section", { className: `${panelClass} ${activeSection === 'Sounds & Budget' ? 'absolute inset-0' : 'hidden'}`, children: [(0, jsx_runtime_1.jsx)("div", { className: panelTitleClass, children: "Sounds & Budget" }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4 overflow-auto p-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-2 gap-3", children: SOUND_EVENTS.map(eventId => ((0, jsx_runtime_1.jsx)(Field, { label: eventId, children: (0, jsx_runtime_1.jsxs)("select", { className: selectClass, value: enemy.sound[eventId] || '', onChange: event => patchSound(eventId, event.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "None" }), soundAssets.map(asset => (0, jsx_runtime_1.jsx)("option", { value: asset.id, children: asset.name }, asset.id))] }) }, eventId))) }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-3 gap-3", children: [(0, jsx_runtime_1.jsx)(Field, { label: "CPU", children: (0, jsx_runtime_1.jsx)(SmallNumber, { value: enemy.budget.cpu, min: 0, onChange: value => patchBudget({ cpu: value }) }) }), (0, jsx_runtime_1.jsx)(Field, { label: "Sprites", children: (0, jsx_runtime_1.jsx)(SmallNumber, { value: enemy.budget.sprites, min: 0, onChange: value => patchBudget({ sprites: value }) }) }), (0, jsx_runtime_1.jsx)(Field, { label: "RAM", children: (0, jsx_runtime_1.jsx)(SmallNumber, { value: enemy.budget.ram, min: 0, onChange: value => patchBudget({ ram: value }), suffix: "bytes" }) })] }), (0, jsx_runtime_1.jsx)(Field, { label: "Code Package", children: (0, jsx_runtime_1.jsx)("input", { className: inputClass, value: enemy.budget.codePackage, onChange: event => patchBudget({ codePackage: event.target.value }) }) }), (0, jsx_runtime_1.jsx)(Field, { label: "GFX Package", children: (0, jsx_runtime_1.jsx)("input", { className: inputClass, value: enemy.budget.graphicsPackage || '', onChange: event => patchBudget({ graphicsPackage: event.target.value }) }) }), (0, jsx_runtime_1.jsx)(Field, { label: "GFX Bank", children: (0, jsx_runtime_1.jsx)("input", { className: inputClass, value: enemy.budget.graphicsBank || '', onChange: event => patchBudget({ graphicsBank: event.target.value }) }) }), (0, jsx_runtime_1.jsx)(Field, { label: "RAM Package", children: (0, jsx_runtime_1.jsx)("input", { className: inputClass, value: enemy.budget.ramPackage || '', onChange: event => patchBudget({ ramPackage: event.target.value }) }) })] })] }), (0, jsx_runtime_1.jsxs)("section", { className: `${panelClass} ${activeSection === 'Preview' ? 'absolute inset-0' : 'hidden'}`, children: [(0, jsx_runtime_1.jsx)("div", { className: panelTitleClass, children: "Preview" }), (0, jsx_runtime_1.jsxs)("div", { className: "grid min-h-0 flex-1 grid-cols-[220px_1fr] gap-4 overflow-auto p-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center justify-center rounded border border-slate-700 bg-[#111821] p-4", children: [(0, jsx_runtime_1.jsx)(SpritePreview, { asset: selectedSprite, size: enemy.render.size }), (0, jsx_runtime_1.jsx)("div", { className: "mt-3 text-center text-xs text-slate-300", children: selectedSprite?.name || 'Bat placeholder' })] }), (0, jsx_runtime_1.jsx)("pre", { className: "min-h-0 overflow-auto rounded border border-slate-700 bg-[#05070b] p-3 font-mono text-xs text-emerald-200", children: buildEnemyAsmPreview(enemy) })] })] })] }), (0, jsx_runtime_1.jsxs)("aside", { className: "flex min-h-0 flex-col gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded border border-slate-700 bg-[#1d2430] p-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "mb-3 text-xs font-bold uppercase tracking-wide text-red-300", children: "Sprite Preview" }), (0, jsx_runtime_1.jsx)("div", { className: "flex justify-center", children: (0, jsx_runtime_1.jsx)(SpritePreview, { asset: selectedSprite, size: enemy.render.size }) }), (0, jsx_runtime_1.jsx)("div", { className: "mt-3 text-center text-xs text-slate-300", children: selectedSprite?.name || 'No sprite assigned' })] }), (0, jsx_runtime_1.jsxs)("div", { className: "min-h-0 flex-1 overflow-auto rounded border border-slate-700 bg-[#1d2430] p-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "mb-2 text-xs font-bold uppercase tracking-wide text-red-300", children: "Validation" }), issues.length === 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "rounded border border-emerald-700 bg-emerald-950/30 p-2 text-xs text-emerald-200", children: "Enemy config is ready." })) : ((0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: issues.map(issue => ((0, jsx_runtime_1.jsx)("div", { className: "rounded border border-amber-700 bg-amber-950/30 p-2 text-xs text-amber-100", children: issue }, issue))) }))] })] })] })] }));
};
exports.Msx2EnemyEditor = Msx2EnemyEditor;
