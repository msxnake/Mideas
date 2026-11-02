/**
 * Translates Mideas logic (state machines made of Conditions + Actions) into
 * three parallel representations an AI can rebuild in any engine:
 *   1. `natural`  - plain English sentence.
 *   2. `pseudo`   - engine-neutral pseudocode (maps easily to GDScript/JS/Python).
 *   3. `raw`      - the original Mideas structure (lossless).
 * Mideas has no events: every transition is a condition evaluated each frame.
 */
import type { Action, Condition, StateMachine, TransitionGuard } from '../../statemachine.types';
import { normalizeStateMachineInput } from '../stateMachineInputs';

/** Exist in the MSX ROM generator but not in Mideas Play mode (GameFlowPreviewModal). */
export const ROM_ONLY_CONDITIONS = new Set(['XOR', 'CAN_MOVE_DIRECTION', 'PATH_CLEAR', 'KEY_AND_MOVEMENT']);
export const ROM_ONLY_ACTIONS = new Set(['MOVE_BY', 'RND', 'DISABLE_INPUT', 'ENABLE_INPUT']);
const ROM_ONLY_NOTE = ' [ROM only: never true in Play mode]';
const ROM_ONLY_ACTION_NOTE = ' [ROM only: no effect in Play mode]';
/** Variable names VARIABLE_COMPARE resolves on the entity itself before globals. */
const ENTITY_VARS = new Set(['x', 'y', 'vx', 'vy', 'isonground']);

export interface NameResolver {
  /** Returns a readable name for an asset / template / tile / node id, or null. */
  name(id: unknown): string | null;
}

const q = (v: unknown) => JSON.stringify(v ?? null);

function ref(resolver: NameResolver, id: unknown): string {
  if (id === undefined || id === null || id === '') return '(none)';
  const n = resolver.name(id);
  return n ? `"${n}"` : `"${String(id)}"`;
}

export function keyLabel(key: unknown): string {
  const k = String(key ?? '').trim();
  if (!k) return '(unset key)';
  const map: Record<string, string> = {
    ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
    up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT', space: 'FIRE (SPACE)', Space: 'FIRE (SPACE)', ' ': 'FIRE (SPACE)',
    Spc: 'FIRE (SPACE)', Enter: 'ENTER', ShiftLeft: 'SHIFT', ControlLeft: 'CTRL', Ctrl: 'CTRL',
  };
  if (map[k]) return map[k];
  // Logical inputs stored by the state machine editor (utils/stateMachineInputs.ts).
  const logical = normalizeStateMachineInput(k);
  if (logical === 'fire') return 'FIRE (button 1, SPACE)';
  if (logical === 'action2') return 'BUTTON 2 (action2: key M by default in Play mode)';
  if (/^f[1-5]$/.test(logical)) return logical.toUpperCase();
  if (['up', 'down', 'left', 'right'].includes(logical)) return logical.toUpperCase();
  if (/^Key[A-Z]$/.test(k)) return k.slice(3);
  if (/^Digit[0-9]$/.test(k)) return k.slice(5);
  return k.toUpperCase();
}

/** Arithmetic operands as stored by ActionParamsEditor: operandNType ('constant'|'variable'), operandNValue, operandNVariable. */
function operand(p: Record<string, any>, n: 1 | 2, pseudo = false): string {
  const type = p[`operand${n}Type`] ?? 'constant';
  if (type === 'variable') return `${pseudo ? 'globals.' : ''}${fmtVar(p[`operand${n}Variable`])}`;
  const v = p[`operand${n}Value`];
  return v === undefined || v === '' ? '0' : String(v);
}

/** Stable input id for pseudocode: logical id when known (fire, action2, up...), else the key label. */
function keyId(key: unknown): string {
  const logical = normalizeStateMachineInput(key);
  return ['up', 'down', 'left', 'right', 'fire', 'action2'].includes(logical) || /^f[1-5]$/.test(logical) ? logical : keyLabel(key);
}

function fmtVar(name: unknown): string {
  return String(name ?? 'var').replace(/[^A-Za-z0-9_]/g, '_') || 'var';
}

// ---------------------------------------------------------------------------
// Conditions
// ---------------------------------------------------------------------------

export function conditionToNatural(cond: Condition | null | undefined, r: NameResolver): string {
  if (!cond) return 'always (no condition)';
  const p = cond.params || {};
  const subs = cond.conditions || [];
  switch (cond.type) {
    case 'AND': return subs.length ? subs.map(c => `(${conditionToNatural(c, r)})`).join(' AND ') : 'always';
    case 'OR': return subs.length ? subs.map(c => `(${conditionToNatural(c, r)})`).join(' OR ') : 'never';
    case 'XOR': return `exactly one of: ${subs.map(c => `(${conditionToNatural(c, r)})`).join(', ')}${ROM_ONLY_NOTE}`;
    case 'NOT': return `NOT (${subs[0] ? conditionToNatural(subs[0], r) : 'nothing'})`;
    case 'KEY_PRESSED': return `the player is pressing ${keyLabel(p.key)}`;
    case 'KEY_RELEASED': return `${keyLabel(p.key)} is not being held`;
    case 'TIME_OUT': return `the entity has been in the current state for ${p.duration ?? p.frames ?? 60} frames (${(Number(p.duration ?? p.frames ?? 60) / 60).toFixed(2)} s)`;
    case 'CAN_MOVE_DIRECTION': return `the entity can move ${p.direction ?? '?'} (no solid tile blocks it)${ROM_ONLY_NOTE}`;
    case 'PATH_CLEAR': return `the path ${p.direction ? `to the ${p.direction} ` : ''}is clear of solid tiles${ROM_ONLY_NOTE}`;
    case 'ON_WALL_COLLISION': return `the entity is touching a wall${p.direction && p.direction !== 'any' ? ` on its ${p.direction} side` : ''}`;
    case 'HAS_DEADLY_TILE_COLLISION': return 'the centre of the entity hitbox is on a tile marked as deadly (causesDamage)';
    case 'IN_WATER': return 'the entity is inside a water effect zone';
    case 'IS_WALL_GRABBING': return 'the entity is grabbing a wall';
    case 'ANIMATION_COMPLETE': return 'the current sprite animation has finished playing';
    case 'KEY_AND_MOVEMENT': return `the player presses ${keyLabel(p.key)} and the entity can move ${p.direction ?? 'in that direction'}${ROM_ONLY_NOTE}`;
    case 'HAS_COLLISION': {
      // templateId/templateName are stored by the editor but Play does not filter by them.
      const type = p.collisionType ?? 'any';
      const who = '';
      const item = p.itemType && type === 'item' ? ` (itemType="${p.itemType}")` : '';
      const article = /^[aeiou]/i.test(String(type)) ? 'an' : 'a';
      return type === 'any'
        ? `the entity collides with anything${who}${item}`
        : `the entity collides with ${article} ${type}${who}${item}`;
    }
    case 'VARIABLE_COMPARE': {
      const name = String(p.variable ?? p.variableName ?? '');
      const left = ENTITY_VARS.has(name.toLowerCase()) ? `this entity's ${name}` : `variable ${fmtVar(name)}`;
      const right = p.valueSource === 'variable' || p.valueVariable ? `variable ${fmtVar(p.valueVariable)}` : q(p.value);
      return `${left} ${p.operator ?? '=='} ${right}`;
    }
    default:
      return `${String((cond as any).type)}(${Object.entries(p).map(([k, v]) => `${k}=${q(v)}`).join(', ')})`;
  }
}

export function conditionToPseudo(cond: Condition | null | undefined): string {
  if (!cond) return 'true';
  const p = cond.params || {};
  const subs = cond.conditions || [];
  switch (cond.type) {
    case 'AND': return subs.length ? subs.map(c => `(${conditionToPseudo(c)})`).join(' and ') : 'true';
    case 'OR': return subs.length ? subs.map(c => `(${conditionToPseudo(c)})`).join(' or ') : 'false';
    case 'XOR': return `xor(${subs.map(c => conditionToPseudo(c)).join(', ')})`;
    case 'NOT': return `not (${subs[0] ? conditionToPseudo(subs[0]) : 'false'})`;
    case 'KEY_PRESSED': return `input.is_pressed(${q(keyId(p.key))})`;
    case 'KEY_RELEASED': return `not input.is_pressed(${q(keyId(p.key))})`;
    case 'TIME_OUT': return `state_time_frames >= ${p.duration ?? p.frames ?? 60}`;
    case 'CAN_MOVE_DIRECTION': return `can_move(${q(p.direction)})`;
    case 'PATH_CLEAR': return `path_clear(${q(p.direction ?? 'forward')})`;
    case 'ON_WALL_COLLISION': return `touching_wall(${q(p.direction ?? 'any')})`;
    case 'HAS_DEADLY_TILE_COLLISION': return 'tile_at(hitbox_center).causes_damage';
    case 'IN_WATER': return 'inside_zone("water")';
    case 'IS_WALL_GRABBING': return 'is_wall_grabbing()';
    case 'ANIMATION_COMPLETE': return 'animation_finished()';
    case 'KEY_AND_MOVEMENT': return `input.is_pressed(${q(keyId(p.key))}) and can_move(${q(p.direction)})  # ROM only`;
    case 'HAS_COLLISION': {
      const args: string[] = [q(p.collisionType ?? 'any')];
      if (p.itemType && (p.collisionType ?? 'any') === 'item') args.push(`item_type=${q(p.itemType)}`);
      return `collides_with(${args.join(', ')})`;
    }
    case 'VARIABLE_COMPARE': {
      const name = String(p.variable ?? p.variableName ?? '');
      const left = ENTITY_VARS.has(name.toLowerCase()) ? `self.${fmtVar(name)}` : `globals.${fmtVar(name)}`;
      const right = p.valueSource === 'variable' || p.valueVariable ? `globals.${fmtVar(p.valueVariable)}` : q(p.value);
      return `${left} ${p.operator ?? '=='} ${right}`;
    }
    default:
      return `${String((cond as any).type).toLowerCase()}(${Object.entries(p).map(([k, v]) => `${k}=${q(v)}`).join(', ')})`;
  }
}

export function guardToNatural(g: TransitionGuard | undefined): string | null {
  if (!g || !g.variableName) return null;
  return `variable ${fmtVar(g.variableName)} ${g.operator} ${q(g.compareValue)}`;
}

export function guardToPseudo(g: TransitionGuard | undefined): string | null {
  if (!g || !g.variableName) return null;
  return `globals.${fmtVar(g.variableName)} ${g.operator} ${q(g.compareValue)}`;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export function actionToNatural(a: Action, r: NameResolver): string {
  const p = a.params || {};
  const rel = p.isRelative ? ' relative to the entity' : '';
  switch (a.type) {
    case 'NONE': return 'do nothing';
    case 'SET_POSITION': return `set position to (${p.x ?? 0}, ${p.y ?? 0}) px`;
    case 'MOVE_BY': return `move by (${p.x ?? 0}, ${p.y ?? 0}) px${ROM_ONLY_ACTION_NOTE}`;
    case 'SET_VELOCITY': return `set velocity to (${p.x ?? 0}, ${p.y ?? 0}) px/frame`;
    case 'APPLY_FORCE': return `apply force/impulse (${p.x ?? 0}, ${p.y ?? 0}) px/frame`;
    case 'CHANGE_SPRITE': return `change sprite to ${ref(r, p.sprite)}`;
    case 'PLAY_ANIMATION': return `play animation ${q(p.animation)}`;
    case 'SET_ANIMATION_SPEED': return p.speedMs !== undefined ? `set animation speed to ${p.speedMs} ms per frame` : `set animation speed to ${p.speed} frames (${Math.round((Number(p.speed) * 1000) / 60)} ms) per animation frame`;
    case 'TOGGLE_ANIMATION': {
      const mode = String(p.mode ?? (p.playing === 0 || p.playing === false || p.playing === '0' ? 'stop' : p.playing === 1 || p.playing === true || p.playing === '1' ? 'start' : 'toggle'));
      return `${mode === 'stop' ? 'stop' : mode === 'start' ? 'start' : 'toggle'} the sprite animation`;
    }
    case 'PLAY_SOUND': return `play sound effect ${ref(r, p.soundId)}`;
    case 'PLAY_MUSIC': return `play music ${ref(r, p.trackId)}${p.loop === false ? ' once' : ' (looping)'}`;
    case 'MUTE_MUSIC': return 'mute the music';
    case 'STOP_MUSIC': return 'stop the music';
    case 'SET_VARIABLE': return `set variable ${fmtVar(p.variable ?? p.variableName ?? p.name)} = ${p.value === undefined || p.value === null || p.value === '' ? 'true' : q(p.value)}`;
    case 'INCREMENT_VARIABLE': return `increase variable ${fmtVar(p.variable)} by ${p.amount ?? 1}`;
    case 'DECREMENT_VARIABLE': return `decrease variable ${fmtVar(p.variable)} by ${p.amount ?? 1}`;
    case 'SET_COMPONENT_PROPERTY': return `set component ${q(p.componentId ?? p.component ?? p.compId)} property ${q(p.propertyName ?? p.prop ?? p.name)} = ${q(p.value)}`;
    case 'WAIT': return `wait ${p.duration ?? p.ms ?? 1000} ms (no transition of this entity is evaluated meanwhile)`;
    case 'GOTO_STATE': return `go to state ${q(p.stateName ?? p.state ?? p.stateId)}`;
    case 'DESTROY_ENTITY': return p.target === 'other' ? 'destroy the OTHER entity involved in the collision' : 'destroy this entity';
    case 'SPAWN_ENTITY': {
      const tpl = ref(r, p.templateId ?? p.entityTemplateId);
      const pos = p.x !== undefined || p.y !== undefined ? ` at (${p.x ?? 0}, ${p.y ?? 0})${rel}` : ' at this entity position';
      const life = p.lifetimeMs ? `, lives ${p.lifetimeMs} ms` : '';
      const facing = p.matchFacing ? ', inheriting facing direction' : '';
      const delay = p.delayMs ?? p.spawnDelayMs ? `, after ${p.delayMs ?? p.spawnDelayMs} ms` : '';
      const random = p.randomNucleo ? ', at a random spawn point' : '';
      return `spawn entity ${tpl}${pos}${facing}${delay}${random}${life}`;
    }
    case 'GET_RANDOM_ENTITY_POSITION': return `store the position of a random ${ref(r, p.templateId)} entity into ${fmtVar(p.targetVariableX)} / ${fmtVar(p.targetVariableY)}`;
    case 'CHANGE_GAME_FLOW_NODE': return `jump to Game Flow node ${ref(r, p.nodeId ?? p.targetNodeId)}`;
    case 'REGENERATE_HUD': return 'redraw the HUD';
    case 'CLEAN_SPRITES': return 'skip drawing sprites for one frame';
    case 'CHANGE_WORLD_SCREEN': return 'exit the current world (CHANGE_WORLD_SCREEN: no effect in Play, EXIT_CURRENT_WORLD in the ROM)';
    case 'EXIT_CURRENT_WORLD': return 'exit the current world (continue the Game Flow after the WorldLink node)';
    case 'DECREASE_LIVES': return `subtract ${p.amount ?? 1} from this entity's Health.current and copy it to the global Lives (no automatic game over)`;
    case 'INCREASE_LIVES': return `add ${p.amount ?? 1} to this entity's Health.current and copy it to the global Lives`;
    case 'RESPAWN_PLAYER': return p.x !== undefined || p.y !== undefined ? `move this entity back to the screen checkpoint (or to (${p.x ?? 0}, ${p.y ?? 0}) if there is none)` : 'move this entity back to the checkpoint saved when the player entered this screen';
    case 'BREAK_TILE': return `break (remove) the breakable tile ${p.direction ?? 'up'} of the sprite centre`;
    case 'REPLACE_TILE': return `replace the tile ${p.direction ?? 'up'} of the sprite centre with ${ref(r, p.replacementTileId)}`;
    case 'REPLACE_TILE_AT': return `replace the tile at cell (${p.x}, ${p.y}) with ${p.replacementTileId ? ref(r, p.replacementTileId) : 'nothing (empty)'}`;
    case 'MOVE_TILE_AREA':
    case 'SHIFT_TILE_AREA':
      return `${a.type === 'MOVE_TILE_AREA' ? 'move' : 'shift'} the tile area (${p.x},${p.y}) size ${p.width}x${p.height} cells ${p.direction}${p.distance ? ` by ${p.distance}` : ''}${p.fillTileId ? `, filling with ${ref(r, p.fillTileId)}` : ''}`;
    case 'RND': return `store a random number in ${fmtVar(p.targetVariable ?? p.variable)}${ROM_ONLY_ACTION_NOTE}`;
    case 'POINT_AT': return `set the velocity towards (${p.x2 ?? '?'}, ${p.y2 ?? '?'}) at speed ${p.speed ?? 1}`;
    case 'ADD_VARIABLES':
    case 'SUBTRACT_VARIABLES':
    case 'MULTIPLY_VARIABLES':
    case 'DIVIDE_VARIABLES':
    case 'MODULO_VARIABLES': {
      const op = { ADD_VARIABLES: '+', SUBTRACT_VARIABLES: '-', MULTIPLY_VARIABLES: '*', DIVIDE_VARIABLES: '/', MODULO_VARIABLES: '%' }[a.type];
      return `${fmtVar(p.targetVariable)} = ${operand(p, 1)} ${op} ${operand(p, 2)}`;
    }
    case 'ASSIGN_VARIABLE': return `${fmtVar(p.targetVariable)} = ${p.sourceType === 'variable' ? fmtVar(p.sourceVariable) : q(p.sourceValue ?? p.value)}`;
    case 'DISABLE_INPUT': return `disable player input${ROM_ONLY_ACTION_NOTE}`;
    case 'ENABLE_INPUT': return `enable player input${ROM_ONLY_ACTION_NOTE}`;
    default:
      return `${String((a as any).type)}(${Object.entries(p).map(([k, v]) => `${k}=${q(v)}`).join(', ')})`;
  }
}

export function actionToPseudo(a: Action): string {
  const p = a.params || {};
  switch (a.type) {
    case 'NONE': return 'pass';
    case 'SET_POSITION': return `self.position = (${p.x ?? 0}, ${p.y ?? 0})`;
    case 'MOVE_BY': return `self.position += (${p.x ?? 0}, ${p.y ?? 0})  # ROM only`;
    case 'SET_VELOCITY': return `self.velocity = (${p.x ?? 0}, ${p.y ?? 0})`;
    case 'APPLY_FORCE': return `self.velocity += (${p.x ?? 0}, ${p.y ?? 0})`;
    case 'CHANGE_SPRITE': return `self.sprite = sprite(${q(p.sprite)})`;
    case 'PLAY_ANIMATION': return `self.play_animation(${q(p.animation)})`;
    case 'PLAY_SOUND': return `audio.play_sfx(${q(p.soundId)})`;
    case 'PLAY_MUSIC': return `audio.play_music(${q(p.trackId)}, loop=${p.loop !== false})`;
    case 'MUTE_MUSIC': return 'audio.mute_music()';
    case 'STOP_MUSIC': return 'audio.stop_music()';
    case 'SET_VARIABLE': return `globals.${fmtVar(p.variable ?? p.variableName ?? p.name)} = ${p.value === undefined || p.value === null || p.value === '' ? 'true' : q(p.value)}`;
    case 'ASSIGN_VARIABLE': return `globals.${fmtVar(p.targetVariable)} = ${p.sourceType === 'variable' ? `globals.${fmtVar(p.sourceVariable)}` : q(p.sourceValue ?? p.value)}`;
    case 'TOGGLE_ANIMATION': return `self.animation.${String(p.mode ?? 'toggle')}()`;
    case 'GOTO_STATE': return `state = ${q(p.stateName ?? p.state ?? p.stateId)}`;
    case 'POINT_AT': return `self.velocity = normalize((${p.x2 ?? 0}, ${p.y2 ?? 0}) - self.position) * ${p.speed ?? 1}`;
    case 'RND': return `globals.${fmtVar(p.targetVariable ?? p.variable)} = random()  # ROM only`;
    case 'INCREMENT_VARIABLE': return `globals.${fmtVar(p.variable)} += ${p.amount ?? 1}`;
    case 'DECREMENT_VARIABLE': return `globals.${fmtVar(p.variable)} -= ${p.amount ?? 1}`;
    case 'SET_COMPONENT_PROPERTY': return `self.components[${q(p.componentId ?? p.component ?? p.compId)}].${fmtVar(p.propertyName ?? p.prop ?? p.name)} = ${q(p.value)}`;
    case 'DESTROY_ENTITY': return p.target === 'other' ? 'other.destroy()' : 'self.destroy()';
    case 'SPAWN_ENTITY': {
      const args = [q(p.templateId ?? p.entityTemplateId)];
      if (p.x !== undefined || p.y !== undefined) args.push(`x=${p.x ?? 0}`, `y=${p.y ?? 0}`, `relative=${!!p.isRelative}`);
      else args.push('at=self.position');
      if (p.matchFacing) args.push('match_facing=true');
      if (p.delayMs ?? p.spawnDelayMs) args.push(`delay_ms=${p.delayMs ?? p.spawnDelayMs}`);
      if (p.randomNucleo) args.push('random_spawn_point=true');
      if (p.lifetimeMs) args.push(`lifetime_ms=${p.lifetimeMs}`);
      return `spawn(${args.join(', ')})`;
    }
    case 'CHANGE_GAME_FLOW_NODE': return `game_flow.goto(${q(p.nodeId ?? p.targetNodeId)})`;
    case 'EXIT_CURRENT_WORLD': return 'game_flow.exit_world()';
    case 'RESPAWN_PLAYER': return 'player.respawn()';
    case 'BREAK_TILE': return `if tilemap.cell(self.center_cell(${q(p.direction ?? 'up')})).breakable: tilemap.clear_cell(...)`;
    case 'REPLACE_TILE': return `tilemap.set_cell(self.center_cell(${q(p.direction ?? 'up')}), ${q(p.replacementTileId)})`;
    case 'REPLACE_TILE_AT': return `tilemap.set_cell((${p.x}, ${p.y}), ${q(p.replacementTileId ?? null)})`;
    case 'REGENERATE_HUD': return 'hud.redraw()';
    case 'CLEAN_SPRITES': return 'sprites.skip_draw_this_frame()';
    case 'WAIT': return `self.wait_ms(${p.duration ?? p.ms ?? 1000})  # blocks this entity's transitions`;
    case 'GET_RANDOM_ENTITY_POSITION': return `e = random_entity(${q(p.templateId)}); globals.${fmtVar(p.targetVariableX)} = e.x; globals.${fmtVar(p.targetVariableY)} = e.y`;
    case 'ADD_VARIABLES': return `globals.${fmtVar(p.targetVariable)} = ${operand(p, 1, true)} + ${operand(p, 2, true)}`;
    case 'SUBTRACT_VARIABLES': return `globals.${fmtVar(p.targetVariable)} = ${operand(p, 1, true)} - ${operand(p, 2, true)}`;
    case 'MULTIPLY_VARIABLES': return `globals.${fmtVar(p.targetVariable)} = ${operand(p, 1, true)} * ${operand(p, 2, true)}`;
    case 'DIVIDE_VARIABLES': return `globals.${fmtVar(p.targetVariable)} = (${operand(p, 2, true)} != 0) ? ${operand(p, 1, true)} / ${operand(p, 2, true)} : 0`;
    case 'MODULO_VARIABLES': return `globals.${fmtVar(p.targetVariable)} = (${operand(p, 2, true)} != 0) ? ${operand(p, 1, true)} % ${operand(p, 2, true)} : 0`;
    case 'DECREASE_LIVES': return `self.health.current = max(0, self.health.current - ${p.amount ?? 1}); globals.Lives = self.health.current`;
    case 'INCREASE_LIVES': return `self.health.current += ${p.amount ?? 1}; globals.Lives = self.health.current`;
    case 'CHANGE_WORLD_SCREEN': return 'game_flow.exit_world()  # ROM behaviour; no-op in Play';
    case 'DISABLE_INPUT': return 'input.enabled = false  # ROM only';
    case 'ENABLE_INPUT': return 'input.enabled = true  # ROM only';
    default:
      return `${String((a as any).type).toLowerCase()}(${Object.entries(p).map(([k, v]) => `${k}=${q(v)}`).join(', ')})`;
  }
}

// ---------------------------------------------------------------------------
// State machines
// ---------------------------------------------------------------------------

export interface SketchStateMachine {
  id: string;
  name: string;
  initialState: string | null;
  evaluation: string;
  states: Array<{ id: string; name: string; onEnter: string[]; onExit: string[]; properties?: Record<string, any> }>;
  transitions: Array<{
    id: string;
    from: string;
    to: string;
    natural: string;
    pseudo: string;
    raw: { conditions?: Condition; guard?: TransitionGuard; actions?: Action[] };
  }>;
  mermaid: string;
}

function mermaidId(name: string, idx: number) {
  const base = name.replace(/[^A-Za-z0-9_]/g, '_');
  return base && /^[A-Za-z_]/.test(base) ? base : `S${idx}_${base}`;
}

function mermaidLabel(s: string, max = 60) {
  const clean = s.replace(/["|{}<>[\]]/g, "'").replace(/\s+/g, ' ');
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export function buildStateMachineSketch(sm: StateMachine, r: NameResolver): SketchStateMachine {
  const stateName = new Map<string, string>();
  const stateMid = new Map<string, string>();
  const ANY = 'Any State';
  const isAny = (id: unknown) => typeof id === 'string' && ['any', '__any_state__', 'any state (*)'].includes(id.trim().toLowerCase());
  const usedMids = new Set<string>();
  (sm.states ?? []).forEach((s, i) => {
    stateName.set(s.id, s.name || s.id);
    let id = mermaidId(s.name || s.id, i);
    while (usedMids.has(id)) id = `${id}_${i}`; // "Run!" and "Run?" must stay distinct
    usedMids.add(id);
    stateMid.set(s.id, id);
  });

  const states = (sm.states ?? []).map(s => ({
    id: s.id,
    name: s.name,
    onEnter: (s.onEnter || []).map(a => actionToNatural(a, r)),
    onExit: (s.onExit || []).map(a => actionToNatural(a, r)),
    ...(s.properties && Object.keys(s.properties).length ? { properties: s.properties } : {}),
  }));

  const transitions = (sm.transitions ?? []).map(t => {
    const fromAny = isAny(t.fromStateId);
    const toAny = isAny(t.toStateId);
    const from = fromAny ? ANY : stateName.get(t.fromStateId) ?? t.fromStateId;
    const to = toAny ? (fromAny ? ANY : from) : stateName.get(t.toStateId) ?? t.toStateId;
    const condNat = conditionToNatural(t.conditions, r);
    const guardNat = guardToNatural(t.guard);
    const actsNat = (t.actions || []).map(a => actionToNatural(a, r));
    const condPseudo = conditionToPseudo(t.conditions);
    const guardPseudo = guardToPseudo(t.guard);
    const actsPseudo = (t.actions || []).map(a => actionToPseudo(a));
    const whenNat = guardNat ? `${condNat} AND ${guardNat}` : condNat;
    const stays = toAny || from === to;
    const natural = `${fromAny ? 'In ANY state' : `While in "${from}"`}, if ${whenNat}${actsNat.length ? ` -> ${actsNat.join('; ')}` : ''}${stays ? '; stay in the same state' : `; then switch to "${to}"`}.`;
    const cond = guardPseudo ? `(${condPseudo}) and ${guardPseudo}` : condPseudo;
    const pseudoLines = [
      fromAny ? `if ${cond}:  # from any state` : `if state == ${q(from)} and ${cond}:`,
      ...actsPseudo.map(l => `    ${l}`),
      !stays ? `    state = ${q(to)}` : (actsPseudo.length ? '' : '    pass'),
    ].filter(Boolean);
    return {
      id: t.id,
      from,
      to,
      natural,
      pseudo: pseudoLines.join('\n'),
      raw: {
        ...(t.conditions ? { conditions: t.conditions } : {}),
        ...(t.guard ? { guard: t.guard } : {}),
        ...(t.actions ? { actions: t.actions } : {}),
      },
    };
  });

  const lines = ['stateDiagram-v2'];
  if (sm.initialStateId && stateMid.has(sm.initialStateId)) lines.push(`    [*] --> ${stateMid.get(sm.initialStateId)}`);
  (sm.states ?? []).forEach(s => {
    const mid = stateMid.get(s.id)!;
    if (mid !== s.name) lines.push(`    state "${mermaidLabel(s.name || s.id)}" as ${mid}`);
  });
  if ((sm.transitions ?? []).some(t => isAny(t.fromStateId))) lines.push('    state "Any State" as AnyState');
  (sm.transitions ?? []).forEach(t => {
    const a = isAny(t.fromStateId) ? 'AnyState' : stateMid.get(t.fromStateId);
    const b = isAny(t.toStateId) ? a : stateMid.get(t.toStateId);
    if (!a || !b) return;
    lines.push(`    ${a} --> ${b} : ${mermaidLabel(conditionToPseudo(t.conditions))}`);
  });

  return {
    id: sm.id,
    name: sm.name,
    initialState: sm.initialStateId ? stateName.get(sm.initialStateId) ?? null : null,
    evaluation: 'Every frame, the transitions whose source is the current state or "Any State" are checked in list order; the FIRST one whose condition is true fires (onExit, state change, transition actions, onEnter; see engineRules.stateMachines). Self-transitions (and transitions to "Any State") keep the state: "while in this state, when X happens, do Y". A pending WAIT blocks all transitions of the entity. Some state names have engine effects: see game_sketch.json > engineRules.stateMachines.',
    states,
    transitions,
    mermaid: lines.join('\n'),
  };
}

export function stateMachineToMarkdown(sm: SketchStateMachine, usedBy: string[]): string {
  const out: string[] = [];
  out.push(`## State machine: ${sm.name}`);
  out.push('');
  out.push(`- Id: \`${sm.id}\``);
  out.push(`- Initial state: **${sm.initialState ?? '(none)'}**`);
  if (usedBy.length) out.push(`- Used by entity templates: ${usedBy.map(u => `**${u}**`).join(', ')}`);
  out.push(`- Evaluation: ${sm.evaluation}`);
  out.push('');
  out.push('```mermaid');
  out.push(sm.mermaid);
  out.push('```');
  out.push('');
  out.push('### States');
  for (const s of sm.states) {
    out.push(`- **${s.name}**${s.onEnter.length ? ` - on enter: ${s.onEnter.join('; ')}` : ''}${s.onExit.length ? ` - on exit: ${s.onExit.join('; ')}` : ''}`);
  }
  out.push('');
  out.push('### Rules (in evaluation order)');
  sm.transitions.forEach((t, i) => {
    out.push(`${i + 1}. ${t.natural}`);
    out.push('');
    out.push('   ```');
    t.pseudo.split('\n').forEach(l => out.push(`   ${l}`));
    out.push('   ```');
  });
  out.push('');
  return out.join('\n');
}
