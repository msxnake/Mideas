/**
 * @fileoverview State Machine Generator - Generates Z80 assembly for State Machines
 * Includes the runtime engine and data serialization logic.
 */

import { StateMachine, StateMachineState, Action, Condition, ActionTypes, ConditionTypes } from '../../../statemachine.types';
import { buildMSXDirectionalSpriteCatalog } from '../../../components/utils/spriteUtils';

// =============================================================================
// CONSTANTS & MAPPINGS
// =============================================================================

const ACTION_IDS: Record<string, number> = {
    [ActionTypes.NONE]: 0,
    [ActionTypes.SET_POSITION]: 1,
    [ActionTypes.MOVE_BY]: 2,
    [ActionTypes.SET_VELOCITY]: 3,
    [ActionTypes.APPLY_FORCE]: 4,
    [ActionTypes.CHANGE_SPRITE]: 5,
    [ActionTypes.PLAY_ANIMATION]: 6,
    [ActionTypes.SET_ANIMATION_SPEED]: 7,
    [ActionTypes.TOGGLE_ANIMATION]: 8,
    [ActionTypes.PLAY_SOUND]: 9,
    [ActionTypes.PLAY_MUSIC]: 10,
    [ActionTypes.MUTE_MUSIC]: 11,
    [ActionTypes.STOP_MUSIC]: 12,
    [ActionTypes.SET_VARIABLE]: 13,
    [ActionTypes.INCREMENT_VARIABLE]: 14,
    [ActionTypes.DECREMENT_VARIABLE]: 15,
    [ActionTypes.SET_COMPONENT_PROPERTY]: 16,
    [ActionTypes.WAIT]: 17,
    [ActionTypes.GOTO_STATE]: 18,
    [ActionTypes.DESTROY_ENTITY]: 19,
    [ActionTypes.SPAWN_ENTITY]: 20,
    [ActionTypes.GET_RANDOM_ENTITY_POSITION]: 21,
    [ActionTypes.CHANGE_GAME_FLOW_NODE]: 22,
    [ActionTypes.DECREASE_LIVES]: 23,
    [ActionTypes.INCREASE_LIVES]: 24,
    [ActionTypes.RESPAWN_PLAYER]: 25,
    [ActionTypes.BREAK_TILE]: 26,
    [ActionTypes.REPLACE_TILE]: 27,
    [ActionTypes.RND]: 28,
    [ActionTypes.POINT_AT]: 29,
    [ActionTypes.ADD_VARIABLES]: 30,
    [ActionTypes.SUBTRACT_VARIABLES]: 31,
    [ActionTypes.MULTIPLY_VARIABLES]: 32,
    [ActionTypes.DIVIDE_VARIABLES]: 33,
    [ActionTypes.MODULO_VARIABLES]: 34,
    [ActionTypes.ASSIGN_VARIABLE]: 35,
    // Input Control
    [ActionTypes.DISABLE_INPUT]: 36,
    [ActionTypes.ENABLE_INPUT]: 37,
    // Special
    END: 0xFF
};

const CONDITION_IDS: Record<string, number> = {
    [ConditionTypes.AND]: 1,
    [ConditionTypes.OR]: 2,
    [ConditionTypes.NOT]: 3,
    [ConditionTypes.KEY_PRESSED]: 4,
    [ConditionTypes.KEY_RELEASED]: 5,
    [ConditionTypes.TIME_OUT]: 6,
    [ConditionTypes.CAN_MOVE_DIRECTION]: 7,
    [ConditionTypes.HAS_COLLISION]: 8,
    [ConditionTypes.PATH_CLEAR]: 9,
    [ConditionTypes.ON_WALL_COLLISION]: 10,
    [ConditionTypes.HAS_DEADLY_TILE_COLLISION]: 11,
    [ConditionTypes.ANIMATION_COMPLETE]: 12,
    [ConditionTypes.KEY_AND_MOVEMENT]: 13,
    [ConditionTypes.VARIABLE_COMPARE]: 14,
    [ConditionTypes.XOR]: 15,
};

// Variable IDs for VARIABLE_COMPARE condition
const VARIABLE_IDS: Record<string, number> = {
    'x': 0,             // entity_x_pos
    'y': 1,             // entity_y_pos
    'vx': 2,            // entity_vel_x
    'vy': 3,            // entity_vel_y
    'isOnGround': 4,    // entity_on_ground (bit 0)
    'health': 5,        // entity_health_current
    // System global variables (IDs 6-7, always prepended to SM_GlobalVarTable)
    'gem_count': 6,     // gem_count RAM variable
    'last_gem_char': 7, // char code of last collected gem tile
    // User-defined global variables start at ID 8
};

// Operator IDs for VARIABLE_COMPARE condition
const OPERATOR_IDS: Record<string, number> = {
    '==': 0,
    '!=': 1,
    '>': 2,
    '<': 3,
    '>=': 4,
    '<=': 5,
};

// Key IDs for KEY_PRESSED condition
// Maps key names to their corresponding input state values
const KEY_IDS: Record<string, number> = {
    'up': 1,          // Up direction
    'arrowup': 1,     // DOM key name alias
    'down': 5,        // Down direction
    'arrowdown': 5,   // DOM key name alias
    'left': 7,        // Left direction
    'arrowleft': 7,   // DOM key name alias
    'right': 3,       // Right direction
    'arrowright': 3,  // DOM key name alias
    'fire': 9,        // Fire button (special check)
    'space': 9,       // Space as fire alias
};

const DIRECTION_IDS: Record<string, number> = {
    'up': 1,
    'down': 5,
    'left': 7,
    'right': 3,
};

const WALL_DIRECTION_IDS: Record<string, number> = {
    'any': 0,
    'up': 1,
    'down': 5,
    'left': 7,
    'right': 3,
};

const COLLISION_TYPE_IDS: Record<string, number> = {
    'any': 0,
    'wall': 1,
    'enemy': 2,
    'item': 3,
    'entity': 4,
};

const TILE_DIRECTION_IDS: Record<string, number> = {
    'up': 0,
    'down': 1,
    'left': 2,
    'right': 3,
    'up-right': 4,
    'up-left': 5,
    'down-right': 6,
    'down-left': 7,
};

// Compact IDs for SET_COMPONENT_PROPERTY runtime encoding.
const COMPONENT_IDS: Record<string, number> = {
    'comp_pos': 1,
    'position': 1,
    'comp_physics': 2,
    'physics': 2,
    'comp_render': 3,
    'render': 3,
    'comp_animation': 4,
    'animation': 4,
    'comp_health': 5,
    'health': 5,
};

const COMPONENT_PROPERTY_IDS: Record<string, number> = {
    'x': 1,
    'y': 2,
    'vx': 3,
    'velocityx': 3,
    'vy': 4,
    'velocityy': 4,
    'sprite': 5,
    'spriteassetid': 5,
    'isvisible': 6,
    'frame': 7,
    'currentframeindex': 7,
    'animationspeed': 8,
    'speed': 8,
    'isplaying': 9,
    'current': 10,
    'max': 11,
};

/**
 * Build complete variable ID map including global variables
 * @param globalVariables - Array of global variables from project
 * @returns Complete mapping of variable names to IDs
 */
function buildVariableIdMap(globalVariables?: any[]): Record<string, number> {
    const map: Record<string, number> = { ...VARIABLE_IDS };

    // Add user-defined global variables starting from ID 8
    // (IDs 6-7 are reserved for system variables: gem_count, last_gem_char)
    if (globalVariables && globalVariables.length > 0) {
        globalVariables.forEach((variable, index) => {
            const varId = 8 + index;
            map[variable.name] = varId;
            // Also map by asmName for flexibility
            if (variable.asmName) {
                map[variable.asmName] = varId;
            }
        });
    }

    return map;
}

function buildTileIdToBaseCharMap(tiles?: any[]): Record<string, number> {
    const map: Record<string, number> = {};
    if (!tiles || tiles.length === 0) return map;

    let nextCharCode = 128;
    tiles.forEach((tile) => {
        if (!tile || !tile.id) return;
        map[tile.id] = nextCharCode;
        if (tile.name) {
            map[String(tile.name)] = nextCharCode;
            map[String(tile.name).toLowerCase()] = nextCharCode;
        }
        const charsWide = Math.max(1, Math.ceil((Number(tile.width) || 8) / 8));
        const charsHigh = Math.max(1, Math.ceil((Number(tile.height) || 8) / 8));
        nextCharCode += charsWide * charsHigh;
    });

    return map;
}

function resolveComponentId(value: any): number {
    if (typeof value === 'string') {
        const key = value.toLowerCase();
        const mapped = COMPONENT_IDS[key];
        if (mapped !== undefined) return mapped;
    }
    return parseInt(serializeValue(value), 10) || 0;
}

function resolveComponentPropertyId(value: any): number {
    if (typeof value === 'string') {
        const key = value.toLowerCase();
        const mapped = COMPONENT_PROPERTY_IDS[key];
        if (mapped !== undefined) return mapped;
    }
    return parseInt(serializeValue(value), 10) || 0;
}

function resolveTileCharCode(value: any, tileIdToCharCode?: Record<string, number>): number {
    if (typeof value === 'string' && tileIdToCharCode) {
        if (tileIdToCharCode[value] !== undefined) return tileIdToCharCode[value];
        const lower = value.toLowerCase();
        if (tileIdToCharCode[lower] !== undefined) return tileIdToCharCode[lower];
    }
    const numeric = parseInt(serializeValue(value), 10);
    return Number.isNaN(numeric) ? 0 : numeric;
}

function buildTemplateTokenMap(templates?: any[]): Record<string, number> {
    const map: Record<string, number> = {};
    if (!templates || templates.length === 0) return map;

    let token = 1;
    templates.forEach((tpl) => {
        if (!tpl || !tpl.id) return;
        if (map[tpl.id] !== undefined) return;
        map[tpl.id] = token;
        if (tpl.name) {
            map[String(tpl.name)] = token;
            map[String(tpl.name).toLowerCase()] = token;
        }
        if (token < 255) token += 1;
    });
    return map;
}

interface TemplateProfileTables {
    maxToken: number;
    spriteByToken: number[];
    animSpeedByToken: number[];
    healthCurByToken: number[];
    healthMaxByToken: number[];
}

function buildTemplateProfileTables(
    templates?: any[],
    spriteNameToIndex?: Record<string, number>,
    templateTokenMap?: Record<string, number>
): TemplateProfileTables {
    const tokenMap = templateTokenMap || buildTemplateTokenMap(templates);
    let maxToken = 0;
    Object.values(tokenMap).forEach((token) => {
        if (token > maxToken) maxToken = token;
    });

    const spriteByToken = new Array(maxToken + 1).fill(0);
    const animSpeedByToken = new Array(maxToken + 1).fill(6);
    const healthCurByToken = new Array(maxToken + 1).fill(1);
    const healthMaxByToken = new Array(maxToken + 1).fill(1);

    const clampByte = (value: any, fallback: number): number => {
        const num = Number(value);
        if (!Number.isFinite(num)) return fallback;
        return Math.max(0, Math.min(255, num | 0));
    };

    templates?.forEach((tpl) => {
        if (!tpl?.id) return;
        const token = tokenMap[tpl.id];
        if (!token) return;
        const components = Array.isArray(tpl.components) ? tpl.components : [];

        const renderComp = components.find((c: any) => c?.definitionId === 'comp_render');
        const renderDefaults = renderComp?.defaultValues || {};
        const spriteRef = renderDefaults.spriteAssetId ?? renderDefaults.sprite ?? renderDefaults.spriteId;
        if (typeof spriteRef === 'string' && spriteNameToIndex) {
            const direct = spriteNameToIndex[spriteRef];
            const lower = spriteNameToIndex[spriteRef.toLowerCase()];
            if (direct !== undefined) {
                spriteByToken[token] = direct & 0xFF;
            } else if (lower !== undefined) {
                spriteByToken[token] = lower & 0xFF;
            }
        }

        const animComp = components.find((c: any) => c?.definitionId === 'comp_animation');
        const animDefaults = animComp?.defaultValues || {};
        animSpeedByToken[token] = clampByte(animDefaults.animationSpeed ?? animDefaults.speed ?? 6, 6);

        const healthComp = components.find((c: any) => c?.definitionId === 'comp_health');
        const healthDefaults = healthComp?.defaultValues || {};
        const cur = clampByte(healthDefaults.current ?? 1, 1);
        const max = clampByte(healthDefaults.max ?? cur, cur);
        healthCurByToken[token] = cur;
        healthMaxByToken[token] = max >= cur ? max : cur;
    });

    return {
        maxToken,
        spriteByToken,
        animSpeedByToken,
        healthCurByToken,
        healthMaxByToken,
    };
}

// =============================================================================
// Z80 RUNTIME ENGINE
// =============================================================================

const Z80_RUNTIME_ENGINE = `
    ; ------------------------------------------------------------------
    ; SM_Update
    ; Main State Machine Update Routine
    ; Input: A = Entity Index
    ; ------------------------------------------------------------------
SM_Update:
    push af
    push bc
    push de
    push hl
    
    ld c, a             ; C = Entity Index
    ld b, 0             ; BC = Entity Index
    
    ; 0. Check Wait Timer
    ld hl, entity_sm_wait_timer
    add hl, bc
    ld a, (hl)
    or a
    jr z, .sm_update_continue

    ; Timer Active, Decrement
    dec a
    ld (hl), a
    jp sm_update_done   ; Skip update

.sm_update_continue:
    ; BC is still Entity Index.
    
    ; 1. Increment Timer
    ld hl, entity_sm_timer_l
    add hl, bc
    inc (hl)
    jr nz, sm_timer_no_overflow
    
    ld hl, entity_sm_timer_h
    add hl, bc
    inc (hl)
sm_timer_no_overflow:

    ; 2. Get Current State Pointer
    ld hl, entity_sm_ptr_l
    add hl, bc
    ld e, (hl)          ; E = Ptr Low
    
    ld hl, entity_sm_ptr_h
    add hl, bc
    ld d, (hl)          ; D = Ptr High

    ; Check if pointer is null(0)
    ld a, d
    or e
    jp z, sm_update_done

    ; DE points to State Data:
    ; [0] = ID(Debug / Unused)
    ; [1-2] = OnEnter Actions Ptr
    ; [3-4] = OnExit Actions Ptr
    ; [5-6] = Transitions List Ptr
    
    ex de, hl           ; HL = State Data Ptr

    ; 3. Check Transitions
    ld de, 5
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ; DE = Transitions List Ptr
    ld a, c             ; A = Entity Index (kept in C)
    
    call SM_CheckTransitions

    ; If Carry set, transition happened, stop update
    jp c, sm_update_done

    ; 4. Execute OnUpdate Actions (Optional)

sm_update_done:
    pop hl
    pop de
    pop bc
    pop af
    ret

    ; ------------------------------------------------------------------
; SM_CheckTransitions
    ; Checks all transitions for the current state
; Input: DE = Pointer to Transitions List
    ; A = Entity Index
    ; Output: Carry Set if transition occurred
        ; ------------------------------------------------------------------
            SM_CheckTransitions:
    ld b, a; Save Entity Index in B
    
    ld a, d
    or e
    ret z; Null pointer, no transitions
    
    ex de, hl; HL = Transitions List

    ; Read Count
    ld c, (hl); C = Count
    inc hl

    ; If count is 0, return
    ld a, c
    or a
    ret z

    ; B = Entity Index
    ; C = Count
    ; HL = Transitions List Ptr

SM_CheckTransitions_Loop:
    push bc; Save Loop Counter(C) and Entity Index(B)

    ; Structure of Transition Entry:
;[0] = Condition Type
    ;[1...] = Params(Variable length)
    ;[Next] = Target State Ptr(Low)
    ;[Next + 1] = Target State Ptr(High)
    ;[Next + 2] = Actions Ptr(Low)
    ;[Next + 3] = Actions Ptr(High)
    
    ld a, b; A = Entity Index
    call SM_EvaluateCondition
    ; HL now points to Target State Ptr(or next param if we were parsing)
; Result in A(1 = True, 0 = False)
    
    or a
    jr nz, SM_TransitionTriggered

    ; Condition False: Skip Transition Tail and continue to next transition
    ; Transition tail layout after condition payload:
    ;   [0-1] Target State Ptr
    ;   [2-3] Actions Ptr
    ld de, 4
    add hl, de
    
    pop bc; Restore counters
    dec c; Decrement loop counter
    jr nz, SM_CheckTransitions_Loop
    
    or a            ; Clear carry(no transition)
    ret

SM_TransitionTriggered:
    pop bc; Restore counters(B = Entity Index)

    ; HL points to Target State Ptr
    ld e, (hl)
    inc hl
    ld d, (hl)
    ; DE = Target State Address
    inc hl
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ; HL = Actions Ptr (0 if none)

    ; Execute transition actions if present
    ld a, h
    or l
    jr z, .skip_transition_actions
    push de            ; Save target state
    ld a, b            ; Entity Index
    ex de, hl          ; DE = Actions Ptr
    call SM_ExecuteActions
    ex de, hl          ; HL = Actions Ptr (unused)
    pop de             ; Restore target state

.skip_transition_actions:

    ; Special case: Target State = 0 -> don't change state (Any->Any)
    ld a, d
    or e
    jr z, .no_state_change

    ; Perform State Change
    ld a, b; A = Entity Index
    call SM_ChangeState

    scf             ; Set carry(transition occurred)
    ret

.no_state_change:
    scf             ; Transition occurred (actions already executed)
    ret

    ; ------------------------------------------------------------------
; SM_ChangeState
    ; Changes the entity's state to DE
    ; Input: DE = New State Address
    ; A = Entity Index
    ; ------------------------------------------------------------------
        SM_ChangeState:
    push de; Save New State
    push af; Save Entity Index

    ; 1. Execute OnExit of Old State
    ; Get Old State Ptr
    ld c, a
    ld b, 0
    ld hl, entity_sm_ptr_l
    add hl, bc
    ld e, (hl)
    ld hl, entity_sm_ptr_h
    add hl, bc
    ld d, (hl)
    ; DE = Old State Ptr
    
    ex de, hl; HL = Old State Ptr
    ld bc, 3
    add hl, bc
    ld e, (hl)
    inc hl
    ld d, (hl)
    ; DE = OnExit Actions Ptr
    
    pop af; Restore Entity Index
    push af; Keep it saved
    
    call SM_ExecuteActions

    ; 2. Set New State
    pop af; Restore Entity Index
    pop de; Restore New State
    
    push af; Save Entity Index again
    push de; Save New State again
    
    ld c, a
    ld b, 0
    
    ld hl, entity_sm_ptr_l
    add hl, bc
    ld (hl), e
    
    ld hl, entity_sm_ptr_h
    add hl, bc
    ld (hl), d

    ; 3. Reset Timer
    ld hl, entity_sm_timer_l
    add hl, bc
    ld (hl), 0
    
    ld hl, entity_sm_timer_h
    add hl, bc
    ld (hl), 0

    ; 4. Execute OnEnter of New State
    pop hl; HL = New State Base
    pop af; A = Entity Index
    
    push hl; Save New State Base(needed ?) No.
    
    inc hl; Skip ID
    ld e, (hl)
    inc hl
    ld d, (hl)
    ; DE = OnEnter Actions Ptr
    
    pop hl; Clean stack(wait, I pushed HL above)
    
    call SM_ExecuteActions

    ret

    ; ------------------------------------------------------------------
; SM_ExecuteActions
    ; Executes a list of actions
    ; Input: DE = Pointer to Action List
    ; A = Entity Index
    ; ------------------------------------------------------------------
        SM_ExecuteActions:
    ld c, a         ; Save entity index before null check overwrites A
    ld a, d
    or e
    ret z           ; Null pointer

    ex de, hl       ; HL = Action List

    ld b, c         ; B = Entity Index (restored from C)

SM_ExecuteActions_Loop:
    ld a, (hl); Get Action ID
    inc hl
    
    cp 0xFF; END
    ret z
    
    push hl; Save Action List Ptr
    push bc; Save Entity Index

    ; Dispatch Action
    ; Input: A = Action ID
    ; HL = Params Ptr
    ; B = Entity Index

    ; We need to pass Entity Index in A to Dispatch ?
    ; Or B ?
    ; Let's use A for Action ID.
    ; Let's use B for Entity Index.
    
    ld c, a; C = Action ID
    ld a, b; A = Entity Index(swap for dispatch if needed)
    ; Actually, let's keep Entity Index in B.
    ld a, c; A = Action ID
    
    call SM_Dispatch
    ; Output: HL = Updated Params Ptr

    ; Restore Entity Index
    pop bc; B = Entity Index

    ; Restore Action List Ptr ?
    ; No, HL was updated by Dispatch to point to next action.
    ; So we discard the old HL.
    pop de; Pop old HL into DE(discard)
    
    jp SM_ExecuteActions_Loop

    ; ------------------------------------------------------------------
; SM_EvaluateCondition
    ; Evaluates a condition at HL
    ; Input: HL = Pointer to Condition Data
    ; A = Entity Index
    ; Output: A = 1(True), 0(False)
        ; HL = Updated Pointer(after params)
    ; ------------------------------------------------------------------
        SM_EvaluateCondition:
    ld b, a             ; B = Entity Index
    ld a, (hl)          ; Get Condition ID
    inc hl

    ; Dispatch to condition handler
    push hl             ; Save Params Ptr
    
    ; Calculate Table Address
    ld l, a
    ld h, 0
    add hl, hl          ; * 2 (word addresses)
    ld de, SM_ConditionTable
    add hl, de
    
    ; Get Handler Address
    ld e, (hl)
    inc hl
    ld d, (hl)
    ; DE = Handler Address
    
    ; Restore Params Ptr to HL
    pop hl
    
    ; Jump to Handler (B = Entity Index, HL = Params)
    push de
    ret
    `;

// =============================================================================
// Z80 DISPATCH TABLE (Appended to Engine)
// =============================================================================

const Z80_DISPATCH_TABLE = `
    ; ------------------------------------------------------------------
; SM_Dispatch
    ; Dispatches to the handler for Action A
    ; Input: A = Action ID
    ; HL = Pointer to Params
    ; B = Entity Index
    ; Output: HL = Updated Pointer(after params)
    ; ------------------------------------------------------------------
        SM_Dispatch:
; 1. Save Params Ptr
    push hl

    ; 2. Calculate Table Address
    ld l, a
    ld h, 0
    add hl, hl
    ld de, SM_ActionTable
    add hl, de

    ; 3. Get Handler Address
    ld e, (hl)
    inc hl
    ld d, (hl)
    ; DE = Handler Address

    ; 4. Restore Params Ptr to HL
    pop hl

    ; 5. Jump to Handler
    push de
    ret

SM_ActionTable:
    DW Action_Nop; 0
    DW Action_SetPosition; 1
    DW Action_MoveBy; 2
    DW Action_SetVelocity; 3
    DW Action_ApplyForce; 4
    DW Action_ChangeSprite; 5
    DW Action_PlayAnimation; 6
    DW Action_SetAnimSpeed; 7
    DW Action_ToggleAnim; 8
    DW Action_PlaySound; 9
    DW Action_PlayMusic; 10
    DW Action_MuteMusic; 11
    DW Action_StopMusic; 12
    DW Action_SetVariable; 13
    DW Action_IncVariable; 14
    DW Action_DecVariable; 15
    DW Action_SetCompProp; 16
    DW Action_Wait; 17
    DW Action_GotoState; 18
    DW Action_DestroyEntity; 19
    DW Action_SpawnEntity; 20
    DW Action_GetRandomPos; 21
    DW Action_ChangeGameFlow; 22
    DW Action_DecLives; 23
    DW Action_IncLives; 24
    DW Action_Respawn; 25
    DW Action_BreakTile; 26
    DW Action_ReplaceTile; 27
    DW Action_Rnd; 28
    DW Action_PointAt; 29
    DW Action_AddVars; 30
    DW Action_SubVars; 31
    DW Action_MulVars; 32
    DW Action_DivVars; 33
    DW Action_ModVars; 34
    DW Action_AssignVar; 35
    DW Action_DisableInput; 36
    DW Action_EnableInput; 37

    ; ------------------------------------------------------------------
; ACTION HANDLERS IMPLEMENTATION
    ; ------------------------------------------------------------------

Action_Nop:
    ret

Action_SetPosition:
; Params: X(1 byte), Y(1 byte)
; Sets entity position (teleport)
    ld e, (hl)          ; E = X
    inc hl
    ld d, (hl)          ; D = Y
    inc hl

    push hl             ; Save Params Ptr

    ld c, b             ; C = Entity Index
    ld b, 0             ; BC = Entity Index

    ld hl, entity_x_pos
    add hl, bc
    ld (hl), e          ; Set X

    ld hl, entity_y_pos
    add hl, bc
    ld (hl), d          ; Set Y

    pop hl              ; Restore Params Ptr
    ret

Action_MoveBy:
; Params: DX(1 byte signed), DY(1 byte signed)
    ld e, (hl)          ; E = DX
    inc hl
    ld d, (hl)          ; D = DY
    inc hl
    
    push hl             ; Save Params Ptr
    
    ld c, b             ; C = Entity Index
    ld b, 0             ; BC = Entity Index
    
    ; Add DX to X position
    ld hl, entity_x_pos
    add hl, bc
    ld a, (hl)
    add a, e
    ld (hl), a
    
    ; Add DY to Y position
    ld hl, entity_y_pos
    add hl, bc
    ld a, (hl)
    add a, d
    ld (hl), a
    
    pop hl              ; Restore Params Ptr
    ret

Action_SetVelocity:
; Params: VX(1 byte), VY(1 byte)
    ld e, (hl)          ; E = VX
    inc hl
    ld d, (hl)          ; D = VY
    inc hl
    
    push hl             ; Save Params Ptr
    
    ld c, b             ; C = Entity Index
    ld b, 0             ; BC = Entity Index
    
    ld hl, entity_vel_x
    add hl, bc
    ld (hl), e          ; Set VX
    
    ld hl, entity_vel_y
    add hl, bc
    ld (hl), d          ; Set VY
    
    pop hl              ; Restore Params Ptr
    ret

Action_ApplyForce:
; Params: FX(1 byte), FY(1 byte)
    ld e, (hl); E = FX
    inc hl
    ld d, (hl); D = FY
    inc hl
    
    push hl; Save Params Ptr
    
    ld c, b; C = Entity Index
    ld b, 0; BC = Entity Index

    ; Add to VX
    ld hl, entity_vel_x
    add hl, bc
    ld a, (hl)
    add a, e
    ld (hl), a

    ; Add to VY
    ld hl, entity_vel_y
    add hl, bc
    ld a, (hl)
    add a, d
    ld (hl), a
    
    pop hl          ; Restore Params Ptr
    ret


; Table: SM Facing Direction to Sprite Lookup Table Pointer
; Maps entity_facing_dir (1=left,2=right,3=up,4=down) to directional sprite tables.
; Usage: dec facing (→ 0-3), index into this table to get the DW sprite_dir_*_table ptr.
SM_FacingDirTablePtrs:
    DW sprite_dir_left_table    ; facing 1 (LEFT)  → dec → 0
    DW sprite_dir_right_table   ; facing 2 (RIGHT) → dec → 1
    DW sprite_dir_up_table      ; facing 3 (UP)    → dec → 2
    DW sprite_dir_down_table    ; facing 4 (DOWN)  → dec → 3

; ==================================================================
; Action_ChangeSprite
; ------------------------------------------------------------------
; Cambia el sprite activo de una entidad. Realiza 5 operaciones:
;   1. Redirect direccional: si entity_facing_dir != 0, sustituye el
;      sprite pedido por su variante direccional (left/right/up/down)
;      usando SM_FacingDirTablePtrs.
;   2. Commit: escribe el sprite final en entity_sprite_asset_index.
;   3. Reset de animación: pone entity_anim_frame y entity_anim_tick a 0.
;   4. Flags de animación: activa PLAYING, aplica el flag de LOOP del
;      sprite, y para sprites one-shot borra ONLY_WHEN_MOVING para que
;      la animación avance aunque la entidad esté quieta.
;   5. Upload inmediato: copia el frame 0 del nuevo sprite a VRAM en
;      el mismo frame para que el cambio sea visible sin esperar al
;      siguiente ciclo de update_animation_component.
;   6. Colores de capas: actualiza sprite_layer_colors (tabla RAM) con
;      los colores del nuevo sprite desde SM_SpriteLayerColorTable.
;
; Input:
;   HL  = puntero al parámetro (sprite asset ID, 1 byte)
;   B   = entity index (convención SM_ExecuteActions)
;
; Output:
;   HL  = puntero al byte siguiente a los parámetros (para el caller)
;
; Destruye: AF, BC, DE, HL (todos restaurados al salir salvo HL=next param)
;
; Stack al entrar (top → bottom):
;   [llamada desde SM_ExecuteActions]
; Stack al salir: igual que al entrar.
;
; Tablas ROM usadas:
;   SM_FacingDirTablePtrs      — punteros a las 4 tablas de redirect
;   sprite_loop_flags          — 1 byte/sprite: 0x02=loop, 0x00=one-shot
;   SM_SpritePatternPtrTable   — puntero al frame 0 de cada sprite
;   SM_SpriteLayerColorTable   — colores por sprite (SPRITE_MAX_ENTITY_LAYERS bytes/sprite)
;
; Variables RAM usadas:
;   entity_facing_dir          — dirección actual de la entidad (0-4)
;   entity_sprite_asset_index  — índice del sprite activo de la entidad
;   entity_anim_frame          — frame actual de la animación
;   entity_anim_tick           — contador de ticks entre frames
;   entity_anim_flags          — flags de animación (ver bits más abajo)
;   entity_sprite_config       — base HW sprite + layer count (2 bytes/entidad)
;   sprite_layer_colors        — colores actuales por slot HW sprite (RAM)
;
; Bits de entity_anim_flags:
;   bit 0 = ANIM_FLAG_PLAYING       (1 = animando)
;   bit 1 = ANIM_FLAG_LOOP          (1 = bucle infinito, 0 = one-shot)
;   bit 2 = ANIM_FLAG_ONLY_WHEN_MOVING (1 = solo anima si vel != 0)
;   bit 3 = ANIM_FLAG_COMPLETED     (1 = one-shot llegó al último frame)
;
; NOTA: el bloque de redirect direccional usa B como registro temporal
; para guardar el sprite ID. Al salir del bloque, B queda corrupto.
; Se restaura explícitamente con "ld b, 0" antes de los add hl, bc.
; ==================================================================
Action_ChangeSprite:
    ld a, (hl)              ; A = Sprite Asset ID pedido por la SM
    inc hl                  ; HL apunta al byte siguiente al parámetro
    push hl                 ; [stack] guarda puntero de parámetros para el ret final

    push af                 ; [stack] guarda Sprite Asset ID (se necesita tras setup)

    ; ------------------------------------------------------------------
    ; Setup: convertir B (entity index) a BC = (0, entity_index)
    ; Convención de SM_ExecuteActions: B = entity index al entrar.
    ; ------------------------------------------------------------------
    ld c, b                 ; C = entity index
    ld b, 0                 ; B = 0  →  BC = (0, entity_index)

    ; Pre-calcular HL = &entity_sprite_asset_index[entity]
    ; Se usará tras el bloque de redirect para escribir el sprite final.
    ld hl, entity_sprite_asset_index
    add hl, bc              ; HL = &entity_sprite_asset_index[entity]

    pop af                  ; A = Sprite Asset ID (recuperado del stack)

    ; ------------------------------------------------------------------
    ; BLOQUE 1: Redirect direccional
    ; Si entity_facing_dir[entity] != 0, reemplaza el sprite pedido por
    ; su variante para la dirección actual.
    ;   facing 0 = sin dirección → usar sprite tal cual
    ;   facing 1 = izquierda  → SM_FacingDirTablePtrs[0] → sprite_dir_left_table
    ;   facing 2 = derecha     → SM_FacingDirTablePtrs[1] → sprite_dir_right_table
    ;   facing 3 = arriba      → SM_FacingDirTablePtrs[2] → sprite_dir_up_table
    ;   facing 4 = abajo       → SM_FacingDirTablePtrs[3] → sprite_dir_down_table
    ;
    ; Las tablas de dirección son arrays de 1 byte por sprite asset:
    ;   dir_table[originalSprite] = spriteVariante
    ; Si no existe variante, la tabla devuelve el mismo ID original.
    ;
    ; IMPORTANTE: este bloque usa B como temporal para guardar el sprite ID.
    ; Al salir, B queda con el sprite ID (no con 0). Se corrige después.
    ; ------------------------------------------------------------------
    push hl                 ; [stack] guarda &entity_sprite_asset_index[entity]

    ld h, 0
    ld l, c                 ; HL = entity index
    ld de, entity_facing_dir
    add hl, de              ; HL = &entity_facing_dir[entity]
    ld e, (hl)              ; E = facing dir (0=none, 1=left, 2=right, 3=up, 4=down)

    ld b, a                 ; B = sprite ID original  [B QUEDA CORRUPTO hasta ld b,0 abajo]
    ld a, e                 ; A = facing dir
    or a
    jr z, .acs_dir_done     ; facing = 0 → no hay redirect, usar sprite original

    ; Convertir facing (1-4) a índice de tabla (0-3): dec a
    dec a                   ; A = índice en SM_FacingDirTablePtrs (0=left, 1=right, 2=up, 3=down)
    ld hl, SM_FacingDirTablePtrs
    ld d, 0
    ld e, a
    add hl, de
    add hl, de              ; HL = &SM_FacingDirTablePtrs[facing_index * 2]  (tabla de punteros, DW)
    ld e, (hl)
    inc hl
    ld d, (hl)              ; DE = puntero a la tabla de sprites para esta dirección

    ; Leer el sprite redirigido: dir_table[originalSprite]
    ld l, b                 ; L = sprite ID original
    ld h, 0
    add hl, de              ; HL = &dir_table[originalSprite]
    ld b, (hl)              ; B = sprite ID redirigido (puede ser el mismo si no hay variante)

.acs_dir_done:
    ; A = sprite ID final (original o redirigido)
    ld a, b                 ; A = sprite ID (posiblemente redirigido)
    pop hl                  ; HL = &entity_sprite_asset_index[entity]  [recuperado del stack]

    ; ------------------------------------------------------------------
    ; BLOQUE 2: Commit del sprite y reset de estado de animación
    ; ------------------------------------------------------------------

    ; D guardará el sprite ID para uso posterior (VRAM upload, loop flags).
    ; No usar A directamente porque las instrucciones siguientes lo machan.
    ld d, a                 ; D = Sprite Asset ID final (preservado para los bloques 3-5)
    ld (hl), a              ; entity_sprite_asset_index[entity] = sprite ID final

    ; RESTAURAR B=0: el bloque de redirect dejó B=sprite_ID.
    ; Todos los "add hl, bc" siguientes necesitan BC = (0, entity_index).
    ld b, 0                 ; B = 0  →  BC = (0, entity_index)  [BUG FIX: corrupto por redirect]

    ; Reiniciar frame al principio del nuevo sprite
    ld hl, entity_anim_frame
    add hl, bc              ; HL = &entity_anim_frame[entity]
    ld (hl), 0              ; entity_anim_frame[entity] = 0  (empieza desde frame 0)

    ; Reiniciar contador de ticks para que el primer avance de frame
    ; ocurra tras entity_anim_speed ticks completos, no de inmediato.
    ld hl, entity_anim_tick
    add hl, bc              ; HL = &entity_anim_tick[entity]
    ld (hl), 0              ; entity_anim_tick[entity] = 0

    ; ------------------------------------------------------------------
    ; BLOQUE 3: Leer el flag de loop del nuevo sprite
    ; sprite_loop_flags[spriteId] = 0x02 si loop, 0x00 si one-shot
    ; El valor se guarda en E para aplicarlo a entity_anim_flags.
    ; D se restaura al sprite ID tras poner D=0 para el add hl,de.
    ; ------------------------------------------------------------------
    ld hl, sprite_loop_flags
    ld a, d                 ; A = Sprite Asset ID (salvar antes de poner D=0)
    ld e, a                 ; E = Sprite Asset ID
    ld d, 0
    add hl, de              ; HL = &sprite_loop_flags[spriteId]
    ld e, (hl)              ; E = loop flag (0x02=loop, 0x00=one-shot)
    ld d, a                 ; D = Sprite Asset ID  (restaurado para el upload)

    ; ------------------------------------------------------------------
    ; BLOQUE 4: Actualizar entity_anim_flags
    ;
    ; Cambios aplicados:
    ;   - bit 3 (COMPLETED)       → 0  (el one-shot anterior ya no importa)
    ;   - bit 0 (PLAYING)         → 1  (arrancar animación)
    ;   - bit 1 (LOOP)            → según sprite_loop_flags del nuevo sprite
    ;   - bit 2 (ONLY_WHEN_MOVING)→ 0  SIEMPRE, para cualquier sprite
    ;
    ; Razón de limpiar ONLY_WHEN_MOVING siempre:
    ;   Cuando el SM llama ChangeSprite, lo hace porque quiere mostrar ese
    ;   sprite ahora. La animación debe avanzar siempre que PLAYING=1,
    ;   sin importar la velocidad. La lógica de "anima solo si se mueve"
    ;   es solo relevante para el sprite inicial de la entidad (config del
    ;   editor). Una vez en la SM, el estado controla qué sprite se muestra.
    ;   Si se dejara ONLY_WHEN_MOVING=1 para sprites loop, la animación walk
    ;   no avanzaría: la fricción del movement component puede dejar vel_x=0
    ;   antes de que llegue el turno de animation (step 11 > step 5).
    ; ------------------------------------------------------------------
    ld hl, entity_anim_flags
    add hl, bc              ; HL = &entity_anim_flags[entity]
    ld a, (hl)              ; A = flags actuales

    res 3, a                ; bit 3 = 0: borrar ANIM_FLAG_COMPLETED
    or ANIM_FLAG_PLAYING    ; bit 0 = 1: activar ANIM_FLAG_PLAYING
    and #FD                 ; bit 1 = 0: limpiar ANIM_FLAG_LOOP antes de aplicar el nuevo
    or e                    ; bit 1 = nuevo loop flag (E=0x02 o 0x00 según el sprite)
    and #FB                 ; bit 2 = 0: borrar ANIM_FLAG_ONLY_WHEN_MOVING (siempre)
    ld (hl), a              ; entity_anim_flags[entity] = flags actualizados

    ; ------------------------------------------------------------------
    ; BLOQUE 5: Upload inmediato del frame 0 a VRAM
    ;
    ; update_animation_component no se ejecuta hasta el próximo frame.
    ; Para que el sprite nuevo se vea en el frame actual, copiamos el
    ; frame 0 directamente a VRAM ahora.
    ;
    ; Stack a la entrada de este bloque (top → bottom):
    ;   HL = &entity_anim_flags[entity]  ← push hl
    ;   BC = (0, entity_index)           ← push bc
    ;   DE = (spriteId, loopFlag)        ← push de
    ;
    ; Al salir (.acs_upload_done) se recuperan los tres en orden inverso.
    ; ------------------------------------------------------------------
    push hl                 ; [stack] guarda ptr entity_anim_flags (descartado al salir)
    push bc                 ; [stack] BC = (0, entity_index)
    push de                 ; [stack] DE = (D=spriteId, E=loopFlag)

    ; Validar que el sprite ID esté dentro del rango conocido
    ld a, d                 ; A = sprite asset ID
    cp SM_SpriteAssetCount  ; ¿fuera de rango?
    jr nc, .acs_upload_done ; sí → saltar el upload (evitar acceso fuera de tabla)

    ; Obtener puntero al frame 0: SM_SpritePatternPtrTable[spriteId * 2]
    ; El banco ROM se deriva del propio puntero, no de una tabla separada.
    ; Esto evita desincronizaciones cuando el export comprimido remapea
    ; labels de sprite a blobs ZX0 en un postproceso posterior.
    ld e, a
    ld d, 0                 ; DE = sprite asset index

    ld hl, SM_SpritePatternPtrTable
    add hl, de
    add hl, de              ; HL = &SM_SpritePatternPtrTable[spriteId * 2]
    ld e, (hl)
    inc hl
    ld d, (hl)
    ex de, hl               ; HL = puntero al frame 0 (datos de patrón en ROM)
    push hl                 ; [stack] guarda puntero al frame 0

    ; Mapear el banco ROM que contiene los datos del frame 0.
    ; Bank = ((framePtr - #4000) / #2000), derivado en runtime desde HL.
    ld a, h
    sub #40
    srl a
    srl a
    srl a
    srl a
    srl a
    call mapper_push_p2     ; salva el banco actual de P2 en la pila del mapper
    call mapper_set_bank_p2 ; mapea el banco del frame 0 en la ventana P2 (#8000-#BFFF)

    ; Leer configuración HW del sprite: entity_sprite_config[entity * 2]
    ;   byte 0: base HW sprite index (slot en la OAM, 0-31)
    ;   byte 1: layer count (número de capas HW del sprite, típicamente 1-2)
    ld e, c                 ; E = entity index (C preservado de antes)
    ld d, 0
    ld hl, entity_sprite_config
    add hl, de
    add hl, de              ; HL = &entity_sprite_config[entity * 2]
    ld a, (hl)              ; A = base HW sprite index
    inc hl
    ld c, (hl)              ; C = layer count
    ld d, a                 ; D = base HW sprite index

    ; Si layer count = 0, no hay sprite HW asignado → saltar upload
    ld a, c
    or a
    jr z, .acs_upload_pop_source

    ; Calcular BC = layerCount * 32  (bytes totales de patrón a copiar)
    ; Cada capa HW ocupa 32 bytes de patrón (sprite 16x16 = 2 tiles * 16 bytes, comprimido como 32)
    ld a, c
    ld b, 0
    ld c, a                 ; C = layer count
    sla c
    rl b                    ; × 2
    sla c
    rl b                    ; × 4
    sla c
    rl b                    ; × 8
    sla c
    rl b                    ; × 16
    sla c
    rl b                    ; × 32  →  BC = layerCount * 32

    ; Calcular DE = SPRPAT + baseHwSprite * 32  (destino en VRAM)
    ld a, d                 ; A = base HW sprite index
    ld l, a
    ld h, 0
    add hl, hl              ; × 2
    add hl, hl              ; × 4
    add hl, hl              ; × 8
    add hl, hl              ; × 16
    add hl, hl              ; × 32  →  HL = base * 32
    ld de, SPRPAT
    add hl, de              ; HL = SPRPAT + base * 32  (dirección VRAM del slot HW)
    ex de, hl               ; DE = destino VRAM, HL libre para fuente

    pop hl                  ; HL = puntero al frame 0 en ROM  [recuperado del stack]
    call FAST_LDIRVM        ; copia BC bytes desde HL (ROM/RAM) a DE (VRAM)
    jr .acs_upload_restore_bank

.acs_upload_pop_source:
    pop hl                  ; descarta el puntero al frame 0 (layer count = 0, nada que copiar)

.acs_upload_restore_bank:
    call mapper_pop_p2      ; restaura el banco ROM que estaba antes en P2

.acs_upload_done:
    pop de                  ; DE: D = sprite asset ID, E = loop flag  [recuperado del stack]
    pop bc                  ; BC = (0, entity_index)                  [recuperado del stack]
    pop hl                  ; descarta ptr entity_anim_flags           [recuperado del stack]

    ; ------------------------------------------------------------------
    ; BLOQUE 6: Actualizar tabla de colores de capas en RAM
    ;
    ; sprite_layer_colors es una tabla RAM indexada por slot HW sprite.
    ; SM_SpriteLayerColorTable es una tabla ROM de SPRITE_MAX_ENTITY_LAYERS
    ; bytes por sprite, con el color de cada capa del sprite.
    ;
    ; Se copian los colores del nuevo sprite a los slots HW de la entidad
    ; para que render_sprites use los colores correctos en el próximo frame.
    ;
    ; Registros a la entrada:
    ;   D = sprite asset ID
    ;   C = entity index
    ;   B = 0
    ; ------------------------------------------------------------------

    ; Validar rango (mismo guard que en el upload)
    ld a, d
    cp SM_SpriteAssetCount
    jp nc, .acs_skip_color_update  ; fuera de rango → saltar

    push de                 ; [stack] guarda D=spriteId, E=loopFlag

    ; Obtener el base HW sprite de la entidad: entity_sprite_config[entity * 2]
    ld h, 0
    ld l, c                 ; HL = entity index
    add hl, hl              ; HL = entity index * 2
    ld de, entity_sprite_config
    add hl, de              ; HL = &entity_sprite_config[entity * 2]
    ld c, (hl)              ; C = base HW sprite index (slot de partida en la OAM)

    pop de                  ; DE: D=spriteId, E=loopFlag  [recuperado del stack]

    ; Calcular HL = SM_SpriteLayerColorTable + spriteId * SPRITE_MAX_ENTITY_LAYERS
    ; mediante suma repetida (SPRITE_MAX_ENTITY_LAYERS es pequeño, típicamente 2-4)
    ld l, d                 ; L = sprite asset ID
    ld h, 0                 ; HL = sprite asset ID
    ld e, l
    ld d, h                 ; DE = sprite asset ID (multiplicando)
    ld hl, 0
    ld b, SPRITE_MAX_ENTITY_LAYERS
.acs_mul_max_layers:
    add hl, de              ; acumulador += sprite_ID
    djnz .acs_mul_max_layers ; repetir SPRITE_MAX_ENTITY_LAYERS veces → HL = spriteId * maxLayers
    ld de, SM_SpriteLayerColorTable
    add hl, de              ; HL = &SM_SpriteLayerColorTable[spriteId * maxLayers]

    ; Copiar SPRITE_MAX_ENTITY_LAYERS colores desde la tabla ROM a sprite_layer_colors[hw..]
    ; C = slot HW actual (se incrementa en cada iteración)
    ; HL = fuente en ROM (se incrementa con inc hl)
    ld b, SPRITE_MAX_ENTITY_LAYERS  ; B = contador de capas
.acs_color_update_loop:
    ld a, (hl)              ; A = color de esta capa en la tabla ROM
    inc hl                  ; avanzar al siguiente color en la tabla ROM
    push hl                 ; [stack] preservar HL (fuente ROM) durante el write
    push bc                 ; [stack] preservar B (contador) y C (slot HW)

    ld h, 0
    ld l, c                 ; HL = slot HW actual (índice en sprite_layer_colors)
    ld de, sprite_layer_colors
    add hl, de              ; HL = &sprite_layer_colors[hw_slot]
    ld (hl), a              ; sprite_layer_colors[hw_slot] = color del nuevo sprite

    pop bc                  ; [stack] restaurar B=contador, C=slot HW
    pop hl                  ; [stack] restaurar HL=fuente ROM
    inc c                   ; avanzar al siguiente slot HW
    djnz .acs_color_update_loop

.acs_skip_color_update:

    ; ------------------------------------------------------------------
    ; Epilogue: restaurar puntero de parámetros y retornar al dispatcher
    ; ------------------------------------------------------------------
    pop hl                  ; HL = puntero al byte tras los parámetros  [del push inicial]
    ret

Action_PlayAnimation:
    ; Params: Animation Name (1 byte - ignored in MSX, animations are frame-based)
    ; Starts/restarts animation playback from frame 0
    inc hl                  ; Skip animationName param (not used in MSX)

    push hl                 ; Save Params Ptr

    ; BC = Entity Index
    ld c, b
    ld b, 0

    ; Set PLAYING flag in entity_anim_flags
    ld hl, entity_anim_flags
    add hl, bc
    ld a, (hl)
    or ANIM_FLAG_PLAYING    ; Set bit 0 (PLAYING)
    and #F7                 ; Clear bit 3 (ANIM_FLAG_COMPLETED)
    ld (hl), a

    ; Reset animation to frame 0
    ld hl, entity_anim_frame
    add hl, bc
    ld (hl), 0

    ; Reset tick counter
    ld hl, entity_anim_tick
    add hl, bc
    ld (hl), 0

    ; We also need to get the sprite loop status and apply it!
    ; Get current sprite asset ID for this entity
    ld hl, entity_sprite_asset_index
    add hl, bc
    ld e, (hl)
    ld d, 0
    
    ; Read loop flag from sprite_loop_flags
    ld hl, sprite_loop_flags
    add hl, de
    ld e, (hl)              ; E = loop flag bit (0x02 or 0x00)
    
    ; Apply it to entity_anim_flags
    ld hl, entity_anim_flags
    add hl, bc
    ld a, (hl)
    and #FD                 ; Clear ANIM_FLAG_LOOP
    or e                    ; Set new loop status
    ld (hl), a

    pop hl                  ; Restore Params Ptr
    ret

Action_SetAnimSpeed:
    ; Params: Speed (1 byte) - frames to wait between animation frames
    ld a, (hl)              ; A = Speed
    inc hl

    push hl                 ; Save Params Ptr

    ; BC = Entity Index
    ld c, b
    ld b, 0

    ; Set entity_anim_speed
    ld hl, entity_anim_speed
    add hl, bc
    ld (hl), a              ; entity_anim_speed[entity] = speed

    pop hl                  ; Restore Params Ptr
    ret

Action_ToggleAnim:
    ; Params: Playing (1 byte) - 0 = pause, non-zero = play
    ld a, (hl)              ; A = Playing flag
    inc hl

    push hl                 ; Save Params Ptr
    push af                 ; Save Playing flag

    ; BC = Entity Index
    ld c, b
    ld b, 0

    ; Get current flags
    ld hl, entity_anim_flags
    add hl, bc
    ld a, (hl)

    pop de                  ; D = Playing flag (was in A)
    ld e, a                 ; E = Current flags

    ; Check if we should play or pause
    ld a, d
    or a
    jr z, .pause_anim

.play_anim:
    ; Set PLAYING flag (bit 0)
    ld a, e
    or ANIM_FLAG_PLAYING
    and #F7                 ; Clear bit 3 (ANIM_FLAG_COMPLETED)
    ld (hl), a
    jr .done_toggle

.pause_anim:
    ; Clear PLAYING flag (bit 0)
    ld a, e
    and #FE                 ; AND with 11111110 to clear bit 0 (PLAYING flag)
    ld (hl), a

.done_toggle:
    pop hl                  ; Restore Params Ptr
    ret

Action_PlaySound:
; Params: Sound Asset Index (1 byte)
    ld a, (hl)
    inc hl

    push hl
    ; PLAY_SOUND now uses the real exported sound asset stream.
    ; This keeps multi-step sounds audible and guarantees auto-silence.
    call SM_PlaySoundAsset
    pop hl
    ret

Action_PlayMusic:
; Params: Music Track Index(1 byte), Loop Flag(1 byte)
    ld a, (hl)
    inc hl
    ld b, (hl)
    inc hl

    push hl
    call music_play_track
    pop hl
    ret

Action_MuteMusic:
; No params
    push hl
    call music_mute
    pop hl
    ret

Action_StopMusic:
; No params
    push hl
    call music_stop
    pop hl
    ret

Action_SetVariable:
; Params: VarID(1 byte), Value(1 byte)
; Supports both entity variables (ID 0-5) and global variables (ID 6+)
    ld a, (hl)              ; A = VarID
    inc hl
    ld c, (hl)              ; C = Value
    inc hl

    push hl                 ; Save Params Ptr
    push bc                 ; Save Value and Entity Index

    ; Check if VarID < 6 (entity variable)
    cp 6
    jr c, .entity_variable

.global_variable:
    ; VarID >= 6: Global variable
    ; Calculate table offset: (VarID - 6) * 2
    sub 6                   ; A = VarID - 6
    ld l, a
    ld h, 0
    add hl, hl              ; HL = (VarID - 6) * 2

    ; Get address from SM_GlobalVarTable
    ld de, SM_GlobalVarTable
    add hl, de              ; HL = &SM_GlobalVarTable[VarID - 6]

    ; Read address from table (16-bit)
    ld e, (hl)
    inc hl
    ld d, (hl)              ; DE = address of global variable

    ; Store value
    pop bc                  ; Restore Value in C
    ld a, c
    ld (de), a              ; Store value in global variable

    pop hl                  ; Restore Params Ptr
    ret

.entity_variable:
    ; VarID 0-5: Entity variables (x, y, vx, vy, isOnGround, health)
    ; Map VarID to entity variable address
    push af                 ; Save VarID
    ld c, b                 ; C = Entity Index
    ld b, 0                 ; BC = Entity Index
    pop af                  ; A = VarID

    ; Dispatch based on VarID
    or a
    jr z, .set_x
    dec a
    jr z, .set_y
    dec a
    jr z, .set_vx
    dec a
    jr z, .set_vy
    dec a
    jr z, .set_on_ground
    ; VarID 5 = health

.set_health:
    ld hl, entity_health_current
    add hl, bc
    pop bc                  ; C = Value
    ld (hl), c
    pop hl
    ret

.set_x:
    ld hl, entity_x_pos
    add hl, bc
    pop bc
    ld (hl), c
    pop hl
    ret

.set_y:
    ld hl, entity_y_pos
    add hl, bc
    pop bc
    ld (hl), c
    pop hl
    ret

.set_vx:
    ld hl, entity_vel_x
    add hl, bc
    pop bc
    ld (hl), c
    pop hl
    ret

.set_vy:
    ld hl, entity_vel_y
    add hl, bc
    pop bc
    ld (hl), c
    pop hl
    ret

.set_on_ground:
    ld hl, entity_on_ground
    add hl, bc
    pop bc                  ; C = Value
    ld a, c
    or a
    jr z, .clear_ground
    set 0, (hl)             ; Set bit 0
    pop hl
    ret
.clear_ground:
    res 0, (hl)             ; Clear bit 0
    pop hl
    ret

Action_IncVariable:
; Params: VarID(1 byte), Amount(1 byte)
; Supports both entity variables (ID 0-5) and global variables (ID 6+)
    ld a, (hl)              ; A = VarID
    inc hl
    ld c, (hl)              ; C = Amount
    inc hl

    push hl                 ; Save Params Ptr

    ; Check if VarID < 6 (entity variable)
    cp 6
    jr nc, .inc_global

.inc_entity:
    ; Entity variable increment (simplified: only supports x, y positions for now)
    push bc                 ; Save Amount and Entity Index
    ld e, b                 ; E = Entity Index
    ld d, 0                 ; DE = Entity Index

    ; Map VarID to address (0=x, 1=y, 2=vx, 3=vy, 5=health)
    or a
    jr z, .inc_entity_x
    dec a
    jr z, .inc_entity_y
    dec a
    jr z, .inc_entity_vx
    dec a
    jr z, .inc_entity_vy
    dec a
    jr z, .inc_entity_on_ground
    jr .inc_entity_health   ; Default to health

.inc_entity_x:
    ld hl, entity_x_pos
    jr .do_inc_entity
.inc_entity_y:
    ld hl, entity_y_pos
    jr .do_inc_entity
.inc_entity_vx:
    ld hl, entity_vel_x
    jr .do_inc_entity
.inc_entity_vy:
    ld hl, entity_vel_y
    jr .do_inc_entity
.inc_entity_on_ground:
    ld hl, entity_on_ground
    jr .do_inc_entity
.inc_entity_health:
    ld hl, entity_health_current

.do_inc_entity:
    add hl, de              ; HL = address of entity variable
    pop bc                  ; C = Amount
    ld a, (hl)
    add a, c
    ld (hl), a
    pop hl                  ; Restore Params Ptr
    ret

.inc_global:
    ; VarID >= 6: Global variable
    sub 6                   ; A = VarID - 6
    ld l, a
    ld h, 0
    add hl, hl              ; HL = (VarID - 6) * 2

    ld de, SM_GlobalVarTable
    add hl, de              ; HL = &SM_GlobalVarTable[VarID - 6]

    ; Read address from table
    ld e, (hl)
    inc hl
    ld d, (hl)              ; DE = address of global variable

    ; Increment value
    ld a, (de)              ; Get current value
    add a, c                ; Add amount
    ld (de), a              ; Store new value

    pop hl                  ; Restore Params Ptr
    ret

Action_DecVariable:
; Params: VarID(1 byte), Amount(1 byte)
; Supports both entity variables (ID 0-5) and global variables (ID 6+)
    ld a, (hl)              ; A = VarID
    inc hl
    ld c, (hl)              ; C = Amount
    inc hl

    push hl                 ; Save Params Ptr

    ; Check if VarID < 6 (entity variable)
    cp 6
    jr nc, .dec_global

.dec_entity:
    push bc                 ; Save Amount and Entity Index
    ld e, b                 ; E = Entity Index
    ld d, 0                 ; DE = Entity Index

    ; Map VarID to address
    or a
    jr z, .dec_entity_x
    dec a
    jr z, .dec_entity_y
    dec a
    jr z, .dec_entity_vx
    dec a
    jr z, .dec_entity_vy
    dec a
    jr z, .dec_entity_on_ground
    jr .dec_entity_health

.dec_entity_x:
    ld hl, entity_x_pos
    jr .do_dec_entity
.dec_entity_y:
    ld hl, entity_y_pos
    jr .do_dec_entity
.dec_entity_vx:
    ld hl, entity_vel_x
    jr .do_dec_entity
.dec_entity_vy:
    ld hl, entity_vel_y
    jr .do_dec_entity
.dec_entity_on_ground:
    ld hl, entity_on_ground
    jr .do_dec_entity
.dec_entity_health:
    ld hl, entity_health_current

.do_dec_entity:
    add hl, de              ; HL = address of entity variable
    pop bc                  ; C = Amount
    ld a, (hl)
    sub c                   ; Subtract amount
    ld (hl), a
    pop hl                  ; Restore Params Ptr
    ret

.dec_global:
    ; VarID >= 6: Global variable
    sub 6                   ; A = VarID - 6
    ld l, a
    ld h, 0
    add hl, hl              ; HL = (VarID - 6) * 2

    ld de, SM_GlobalVarTable
    add hl, de              ; HL = &SM_GlobalVarTable[VarID - 6]

    ; Read address from table
    ld e, (hl)
    inc hl
    ld d, (hl)              ; DE = address of global variable

    ; Decrement value
    ld a, (de)              ; Get current value
    sub c                   ; Subtract amount
    ld (de), a              ; Store new value

    pop hl                  ; Restore Params Ptr
    ret

Action_Wait:
; Params: Duration(1 byte)
    ld a, (hl)          ; A = Duration
    inc hl
    
    push hl             ; Save Params Ptr
    
    ld c, b             ; C = Entity Index
    ld b, 0             ; BC = Entity Index
    
    ld hl, entity_sm_wait_timer
    add hl, bc
    ld (hl), a          ; Set wait timer
    
    pop hl              ; Restore Params Ptr
    ret

Action_GotoState:
; Params: StatePtr Low(1 byte), StatePtr High(1 byte)
    ld e, (hl)          ; E = State Ptr Low
    inc hl
    ld d, (hl)          ; D = State Ptr High
    inc hl
    
    push hl             ; Save Params Ptr
    
    ld a, b             ; A = Entity Index
    call SM_ChangeState
    
    pop hl              ; Restore Params Ptr
    ret

Action_SetCompProp:
; Params: ComponentID(1 byte), PropertyID(1 byte), Value(1 byte)
; Supports a compact set of common runtime fields.
; Property IDs:
;   1=x, 2=y, 3=vx, 4=vy, 5=sprite, 6=isVisible, 7=frame,
;   8=animSpeed, 9=isPlaying, 10=healthCurrent, 11=healthMax.
    ld d, (hl)              ; D = ComponentID
    inc hl
    ld e, (hl)              ; E = PropertyID
    inc hl
    ld c, (hl)              ; C = Value
    inc hl

    push hl                 ; Save Params Ptr

    ; Guard invalid target entity index.
    ld a, b
    cp MAX_ENTITIES
    jp nc, .scp_done

    ld a, e                 ; A = PropertyID
    cp 1
    jp z, .scp_set_x
    cp 2
    jp z, .scp_set_y
    cp 3
    jp z, .scp_set_vx
    cp 4
    jp z, .scp_set_vy
    cp 5
    jp z, .scp_set_sprite
    cp 6
    jp z, .scp_set_visible
    cp 7
    jp z, .scp_set_frame
    cp 8
    jp z, .scp_set_anim_speed
    cp 9
    jp z, .scp_set_anim_playing
    cp 10
    jp z, .scp_set_health_current
    cp 11
    jp z, .scp_set_health_max

    ; Fallback by component when PropertyID is unknown.
    ld a, d                 ; A = ComponentID
    cp 1
    jp z, .scp_set_x
    cp 2
    jp z, .scp_set_vx
    cp 3
    jp z, .scp_set_sprite
    cp 4
    jp z, .scp_set_anim_playing
    cp 5
    jp z, .scp_set_health_current
    jp .scp_done

.scp_set_x:
    ld l, b
    ld h, 0
    ld de, entity_x_pos
    add hl, de
    ld (hl), c
    jp .scp_done

.scp_set_y:
    ld l, b
    ld h, 0
    ld de, entity_y_pos
    add hl, de
    ld (hl), c
    jp .scp_done

.scp_set_vx:
    ld l, b
    ld h, 0
    ld de, entity_vel_x
    add hl, de
    ld (hl), c
    jp .scp_done

.scp_set_vy:
    ld l, b
    ld h, 0
    ld de, entity_vel_y
    add hl, de
    ld (hl), c
    jp .scp_done

.scp_set_sprite:
    ld a, c
    cp SM_SpriteAssetCount
    jr c, .scp_set_sprite_ok
    ld c, #FF
.scp_set_sprite_ok:
    ld l, b
    ld h, 0
    ld de, entity_sprite_asset_index
    add hl, de
    ld (hl), c
    ; Reset animation progression when sprite changes.
    ld l, b
    ld h, 0
    ld de, entity_anim_frame
    add hl, de
    ld (hl), 0
    ld l, b
    ld h, 0
    ld de, entity_anim_tick
    add hl, de
    ld (hl), 0
    jp .scp_done

.scp_set_visible:
    ld l, b
    ld h, 0
    ld de, entity_active
    add hl, de
    ld a, c
    or a
    jp z, .scp_hide
    ld (hl), 1
    jp .scp_done
.scp_hide:
    ld (hl), 0
    jp .scp_done

.scp_set_frame:
    ld l, b
    ld h, 0
    ld de, entity_anim_frame
    add hl, de
    ld (hl), c
    jp .scp_done

.scp_set_anim_speed:
    ld l, b
    ld h, 0
    ld de, entity_anim_speed
    add hl, de
    ld (hl), c
    jp .scp_done

.scp_set_anim_playing:
    ld l, b
    ld h, 0
    ld de, entity_anim_flags
    add hl, de
    ld a, c
    or a
    jp z, .scp_pause_anim
    ld a, (hl)
    or ANIM_FLAG_PLAYING
    and #F7                 ; Clear completed flag when forcing play
    ld (hl), a
    jp .scp_done
.scp_pause_anim:
    ld a, (hl)
    and #FE
    ld (hl), a
    jp .scp_done

.scp_set_health_current:
    ld l, b
    ld h, 0
    ld de, entity_health_current
    add hl, de
    ld (hl), c
    jp .scp_done

.scp_set_health_max:
    ld l, b
    ld h, 0
    ld de, entity_health_max
    add hl, de
    ld (hl), c

.scp_done:
    pop hl
    ret

Action_DestroyEntity:
; Params: Target (1 byte) - 0=self, 1=other
; Destroys entity by clearing its component mask
    ld a, (hl)          ; A = target (0=self, 1=other)
    inc hl

    push hl             ; Save Params Ptr

    or a                ; Check if target == 0 (self)
    jr z, .destroy_self

.destroy_other:
    ; Destroy the last entity collided with by this source entity
    ld hl, entity_last_collision_entity
    ld e, b
    ld d, 0
    add hl, de
    ld a, (hl)          ; A = last collided entity index (255 = none)
    cp 255
    jr z, .destroy_done ; No collision target latched
    ld c, a             ; C = target entity index
    jr .destroy_apply

.destroy_self:
    ld c, b             ; C = self entity index

.destroy_apply:
    ld b, 0             ; BC = target entity index

    ; Clear component mask (deactivates entity)
    ld hl, entity_comp_masks
    add hl, bc
    ld (hl), 0          ; Clear low byte

    ld hl, entity_comp_masks_hi
    add hl, bc
    ld (hl), 0          ; Clear high byte

    ; Mark entity as inactive
    ld hl, entity_active
    add hl, bc
    ld (hl), 0

    ; Clear position to move off-screen
    ld hl, entity_x_pos
    add hl, bc
    ld (hl), 255        ; X = off-screen

    ld hl, entity_y_pos
    add hl, bc
    ld (hl), 212        ; Y = below screen (192 + 20)

.destroy_done:
    pop hl              ; Restore Params Ptr
    ret

Action_SpawnEntity:
; Params: TemplateID(1 byte), X(1 byte), Y(1 byte)
; Spawns a new entity at specified position
    ld d, (hl)          ; D = Template ID
    inc hl
    ld e, (hl)          ; E = X position
    inc hl
    ld c, (hl)          ; C = Y position
    inc hl

    push hl             ; Save Params Ptr
    push bc             ; Save Y position and entity index
    push de             ; Save Template ID and X position

    ; Find free entity slot (mask == 0)
    ld hl, entity_comp_masks
    ld b, 32            ; Check up to 32 entities
    ld c, 0             ; Entity index

.find_slot:
    ld a, (hl)          ; Check low byte
    or a
    jr z, .check_high   ; Low byte is 0, check high byte

.next_slot:
    inc hl              ; Next entity
    inc c               ; Increment index
    djnz .find_slot     ; Loop for all entities

    ; No free slot found
    pop de
    pop bc
    pop hl
    ret

.check_high:
    push hl
    ld hl, entity_comp_masks_hi
    ld a, c
    add a, l
    ld l, a
    ld a, 0
    adc a, h
    ld h, a
    ld a, (hl)          ; Check high byte
    pop hl
    or a
    jr nz, .next_slot   ; High byte not zero, keep searching

.found_slot:
    ; C = Free entity index
    ; Stack: X/TemplateID, Y/B, Params Ptr
    pop de              ; DE = Template ID (D) / X (E)
    pop hl              ; HL = Y (H) / saved B (L)
    ld a, h             ; A = Y position

    ; Set entity position
    push hl
    push de
    push bc

    ld h, 0
    ld l, c             ; HL = Entity index
    ld bc, entity_x_pos
    add hl, bc
    ld (hl), e          ; Set X

    ld h, 0
    ld l, c             ; HL = Entity index (C preserved)
    ld de, entity_y_pos
    add hl, de
    ld (hl), a          ; Set Y

    ; Activate entity with basic mask (Position + Sprite)
    ld h, 0
    ld l, c             ; HL = Entity index
    ld de, entity_comp_masks
    add hl, de
    ld (hl), #03        ; COMP_MASK_POSITION | COMP_MASK_SPRITE (low byte)

    ld h, 0
    ld l, c
    ld de, entity_comp_masks_hi
    add hl, de
    ld (hl), 0          ; High byte = 0

    ; Store template token for template-aware runtime queries
    ld h, 0
    ld l, c
    ld de, entity_template_token
    add hl, de
    ld (hl), d

    ; Apply template profile defaults (sprite/anim/health)
    ld a, d                 ; A = template token
    call SM_ApplyTemplateDefaultsToEntity

    pop bc
    pop de
    pop hl
    pop hl              ; Restore Params Ptr
    ret

Action_GetRandomPos:
; Params: TemplateToken(1 byte, 0=any), TargetVarX(1 byte), TargetVarY(1 byte)
    ld c, (hl)              ; C = template token filter
    inc hl
    ld d, (hl)              ; D = TargetVarX ID
    inc hl
    ld e, (hl)              ; E = TargetVarY ID
    inc hl

    push hl                 ; Save params ptr
    push de                 ; Save target var IDs

    ld a, c
    call SM_RandomActiveEntityByTemplate
    jr c, .grp_has_entity

    ; No active entity found: write 0,0
    pop de
    push de
    ld c, 0
    ld a, d
    call SM_WriteVar
    pop de
    ld c, 0
    ld a, e
    call SM_WriteVar
    pop hl
    ret

.grp_has_entity:
    ld b, a                 ; B = random entity index

    ; Read random entity X and write to target variable X
    ld a, 0                 ; VarID 0 = entity x
    call SM_ReadVar         ; A = x
    pop de                  ; DE = target var IDs
    push de
    ld c, a
    ld a, d                 ; TargetVarX
    call SM_WriteVar

    ; Read random entity Y and write to target variable Y
    ld a, 1                 ; VarID 1 = entity y
    call SM_ReadVar         ; A = y
    pop de
    ld c, a
    ld a, e                 ; TargetVarY
    call SM_WriteVar

    pop hl
    ret

Action_ChangeGameFlow:
; Params: NodeID(1 byte), 255 = START
; Minimal runtime bridge: update flow state registers.
    ld a, (hl)
    inc hl
    push hl
    push af
    ld a, (current_flow_state)
    ld (prev_flow_state), a
    pop af
    cp 255
    jr nz, .cgf_store
    xor a
.cgf_store:
    ld (current_flow_state), a
    pop hl
    ret

Action_DecLives:
; Params: Amount(1 byte)
; Decrease entity health/lives with clamp to 0
    ld a, (hl)              ; A = amount
    inc hl
    or a
    jr nz, .dec_lives_have_amount
    ld a, 1                 ; Default amount
.dec_lives_have_amount:
    ld c, a                 ; C = amount

    ; Compute entity_health_current[entity] -= amount, clamp at 0
    ld e, b                 ; DE = entity index
    ld d, 0
    ld hl, entity_health_current
    add hl, de
    ld a, (hl)              ; A = current health
    sub c
    jr nc, .dec_lives_store
    xor a
.dec_lives_store:
    ld (hl), a
    ret

Action_IncLives:
; Params: Amount(1 byte)
; Increase entity health/lives with clamp to entity_health_max
    ld a, (hl)              ; A = amount
    inc hl
    or a
    jr nz, .inc_lives_have_amount
    ld a, 1                 ; Default amount
.inc_lives_have_amount:
    ld c, a                 ; C = amount

    ; DE = entity index
    ld e, b
    ld d, 0

    ; result = current + amount
    ld hl, entity_health_current
    add hl, de
    ld a, (hl)              ; A = current
    add a, c
    ld c, a                 ; C = tentative result

    ; compare with max
    ld hl, entity_health_max
    add hl, de
    ld a, (hl)              ; A = max
    cp c
    jr nc, .inc_lives_store_result
    ld c, a                 ; clamp to max

.inc_lives_store_result:
    ld hl, entity_health_current
    add hl, de
    ld (hl), c
    ret

Action_Respawn:
; Params: X(1 byte), Y(1 byte)
; 255 means "keep current coordinate"
; Also clears velocity/wait timer and re-activates entity.
    ld d, (hl)              ; D = respawn X
    inc hl
    ld e, (hl)              ; E = respawn Y
    inc hl

    push hl                 ; Save params ptr
    push de                 ; Save X/Y

    ; BC = entity index
    ld c, b
    ld b, 0

    pop de                  ; Restore X/Y

    ; Optional X update
    ld a, d
    cp 255
    jr z, .respawn_skip_x
    ld hl, entity_x_pos
    add hl, bc
    ld (hl), a

.respawn_skip_x:
    ; Optional Y update
    ld a, e
    cp 255
    jr z, .respawn_skip_y
    ld hl, entity_y_pos
    add hl, bc
    ld (hl), a

.respawn_skip_y:
    ; Reset velocity
    ld hl, entity_vel_x
    add hl, bc
    ld (hl), 0
    ld hl, entity_vel_y
    add hl, bc
    ld (hl), 0

    ; Clear wait timer so FSM resumes immediately
    ld hl, entity_sm_wait_timer
    add hl, bc
    ld (hl), 0

    ; Ensure entity is active
    ld hl, entity_active
    add hl, bc
    ld (hl), 1

    ; If entity was fully destroyed, restore minimal Position+Sprite mask
    ld hl, entity_comp_masks
    add hl, bc
    ld a, (hl)
    ld d, a
    ld hl, entity_comp_masks_hi
    add hl, bc
    ld a, (hl)
    or d
    jr nz, .respawn_done

    ld hl, entity_comp_masks
    add hl, bc
    ld (hl), #03            ; COMP_MASK_POSITION | COMP_MASK_SPRITE
    ld hl, entity_comp_masks_hi
    add hl, bc
    ld (hl), 0

.respawn_done:
    pop hl
    ret

Action_BreakTile:
; Params: TileID(1 byte), Direction(1 byte)
; BREAK_TILE is serialized as TileID=0.
    ld a, (hl)              ; A = replacement tile ID (0 for break)
    inc hl
    ld c, (hl)              ; C = direction (0..7)
    inc hl
    push hl
    call SM_WriteTileRelativeToEntity
    pop hl
    ret

Action_ReplaceTile:
; Params: TileID(1 byte), Direction(1 byte)
    ld a, (hl)              ; A = replacement tile ID
    inc hl
    ld c, (hl)              ; C = direction (0..7)
    inc hl
    push hl
    call SM_WriteTileRelativeToEntity
    pop hl
    ret

Action_Rnd:
; Params: VarID(1 byte), DataType(1 byte)
    ld a, (hl)              ; A = VarID
    inc hl
    inc hl                  ; Skip DataType for now (numeric random)

    push hl                 ; Save params ptr
    push af                 ; Save VarID

    call SM_RandomByte      ; A = pseudorandom 0..255
    ld c, a                 ; C = value

    pop af                  ; Restore VarID
    call SM_WriteVar        ; Write random value to var

    pop hl                  ; Restore params ptr
    ret

Action_PointAt:
; Params: X1, Y1, X2, Y2, Speed (5 bytes)
    ld d, (hl)              ; D = x1
    inc hl
    ld e, (hl)              ; E = y1
    inc hl
    ld c, (hl)              ; C = x2
    inc hl
    ld a, (hl)              ; A = y2
    inc hl
    ld l, (hl)              ; L = speed
    inc hl

    push hl                 ; Save params ptr
    ld h, a                 ; H = y2

    ; Compute VX using sign(dx) * speed
    ld a, c
    sub d                   ; A = dx = x2 - x1
    ld d, 0                 ; Default VX = 0
    jr z, .pointat_vx_done
    bit 7, a
    jr z, .pointat_vx_pos
    ld a, l
    cpl
    inc a
    ld d, a
    jr .pointat_vx_done
.pointat_vx_pos:
    ld d, l

.pointat_vx_done:
    ; Compute VY using sign(dy) * speed
    ld a, h
    sub e                   ; A = dy = y2 - y1
    ld e, 0                 ; Default VY = 0
    jr z, .pointat_vy_done
    bit 7, a
    jr z, .pointat_vy_pos
    ld a, l
    cpl
    inc a
    ld e, a
    jr .pointat_vy_done
.pointat_vy_pos:
    ld e, l

.pointat_vy_done:
    ; Store velocity in current entity
    ld c, b
    ld b, 0
    ld hl, entity_vel_x
    add hl, bc
    ld a, d
    ld (hl), a
    ld hl, entity_vel_y
    add hl, bc
    ld a, e
    ld (hl), a

    pop hl
    ret

; ------------------------------------------------------------------
; STATE MACHINE AUDIO HELPERS (self-contained, no sound.asm dependency)
; ------------------------------------------------------------------
SM_MusicState:
    db 0                    ; 0=stopped, 1=playing, 2=muted
SM_MusicTrack:
    db 0
SM_RandSeed:
    db #5A
SM_TemplateFilterToken:
    db 0

SM_SilencePSG:
    xor a
    ld e, a
    ld a, 8                 ; Volume A
    call WRTPSG
    xor a
    ld e, a
    ld a, 9                 ; Volume B
    call WRTPSG
    xor a
    ld e, a
    ld a, 10                ; Volume C
    call WRTPSG
    ld a, #3F               ; Disable all tone/noise
    ld e, a
    ld a, 7                 ; Mixer register
    call WRTPSG
    ret

SM_ApplySoundFrame:
    ; Input: HL = pointer to 11-byte pre-expanded sound frame
    ; Output: HL = pointer to next frame
    ld e, (hl)
    ld a, 0
    call WRTPSG
    inc hl
    ld e, (hl)
    ld a, 1
    call WRTPSG
    inc hl
    ld e, (hl)
    ld a, 8
    call WRTPSG
    inc hl

    ld e, (hl)
    ld a, 2
    call WRTPSG
    inc hl
    ld e, (hl)
    ld a, 3
    call WRTPSG
    inc hl
    ld e, (hl)
    ld a, 9
    call WRTPSG
    inc hl

    ld e, (hl)
    ld a, 4
    call WRTPSG
    inc hl
    ld e, (hl)
    ld a, 5
    call WRTPSG
    inc hl
    ld e, (hl)
    ld a, 10
    call WRTPSG
    inc hl

    ld e, (hl)
    ld a, 6
    call WRTPSG
    inc hl
    ld e, (hl)
    ld a, 7
    call WRTPSG
    inc hl
    ret

SM_PlaySoundAsset:
    ; Input: A = sound asset index (0..SM_SoundAssetCount-1)
    ; Destroys: AF, BC, DE, HL
    cp SM_SoundAssetCount
    jr c, .play_valid_sound
    call SM_SilencePSG
    xor a
    ld (sfx_active), a
    ld (sm_sound_active), a
    ld (sm_sound_frames_left), a
    ret

.play_valid_sound:

    ; Stop any previous state-machine sound before starting a new one.
    push af
    call SM_SilencePSG
    xor a
    ld (sfx_active), a
    pop af

    ld l, a
    ld h, 0
    add hl, hl
    ld de, SM_SoundPtrTable
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ex de, hl

    ld a, (hl)
    or a
    jr z, .empty_sound
    ld (sm_sound_frames_left), a
    inc hl
    ld e, (hl)
    inc hl
    ld d, (hl)
    ex de, hl

    call SM_ApplySoundFrame

    ld a, l
    ld (sm_sound_ptr_l), a
    ld a, h
    ld (sm_sound_ptr_h), a
    ld a, 1
    ld (sm_sound_active), a
    ret

.empty_sound:
    xor a
    ld (sm_sound_active), a
    ld (sm_sound_frames_left), a
    ret

SM_UpdateSound:
    ; Advances one frame of the active PLAY_SOUND asset.
    ; The current frame is emitted immediately on SM_PlaySoundAsset, so
    ; frames_left includes the frame already sounding.
    ld a, (sm_sound_active)
    or a
    ret z

    ld a, (sm_sound_frames_left)
    or a
    jr z, .stop_sound

    dec a
    ld (sm_sound_frames_left), a
    jr z, .stop_sound

    ld a, (sm_sound_ptr_l)
    ld l, a
    ld a, (sm_sound_ptr_h)
    ld h, a
    call SM_ApplySoundFrame
    ld a, l
    ld (sm_sound_ptr_l), a
    ld a, h
    ld (sm_sound_ptr_h), a
    ret

.stop_sound:
    call SM_SilencePSG
    xor a
    ld (sm_sound_active), a
    ret

SM_PlaySfx_Beep:
    ld a, 0                 ; Tone A low
    ld e, #1C               ; NOTE_A4 low (284)
    call WRTPSG
    ld a, 1                 ; Tone A high
    ld e, #01
    call WRTPSG
    ld a, 8                 ; Volume A
    ld e, 12
    call WRTPSG
    ld a, 7                 ; Mixer
    ld e, #3E               ; Tone A on
    call WRTPSG
    ret

SM_PlaySfx_Jump:
    ld a, 0
    ld e, #DD               ; NOTE_C4 low (477)
    call WRTPSG
    ld a, 1
    ld e, #01
    call WRTPSG
    ld a, 8
    ld e, 10
    call WRTPSG
    ld a, 7
    ld e, #3E
    call WRTPSG
    ret

SM_PlaySfx_Shoot:
    ld a, 0
    ld e, #64               ; Tone A low (period 100)
    call WRTPSG
    ld a, 1
    ld e, 0
    call WRTPSG
    ld a, 6                 ; Noise period
    ld e, 5
    call WRTPSG
    ld a, 8                 ; Volume A
    ld e, 8
    call WRTPSG
    ld a, 7
    ld e, #36               ; Tone A + Noise A on
    call WRTPSG
    ret

SM_PlaySfx_Explosion:
    ld a, 6
    ld e, 10
    call WRTPSG
    ld a, 8
    ld e, 15
    call WRTPSG
    ld a, 7
    ld e, #39               ; Noise A only
    call WRTPSG
    ret

SM_PlaySfx_Coin:
    ld a, 2                 ; Tone B low
    ld e, #7B               ; NOTE_E4 low (379)
    call WRTPSG
    ld a, 3                 ; Tone B high
    ld e, #01
    call WRTPSG
    ld a, 9                 ; Volume B
    ld e, 10
    call WRTPSG
    ld a, 7
    ld e, #3D               ; Tone B on
    call WRTPSG
    ret

SM_PlaySfx_Damage:
    ld a, 6                 ; Noise period
    ld e, 3
    call WRTPSG
    ld a, 10                ; Volume C
    ld e, 12
    call WRTPSG
    ld a, 7
    ld e, #1F               ; Noise C on
    call WRTPSG
    ret

SM_RandomByte:
    ; Lightweight local PRNG for state machine actions.
    ld hl, SM_RandSeed
    ld a, (hl)
    add a, 37
    xor #A7
    ld (hl), a
    ret

SM_RandomActiveEntity:
    ; Picks a random-ish active entity slot.
    ; Output: A = entity index, Carry set if found
    ;         A = 0, Carry clear if none found
    call SM_RandomByte
    and 31                  ; MAX_ENTITIES-1 (32 slots)
    ld c, a                 ; C = candidate index
    ld b, 32                ; Probe all slots at most once

.srae_loop:
    ld e, c
    ld d, 0

    ; Must be active
    ld hl, entity_active
    add hl, de
    ld a, (hl)
    or a
    jr z, .srae_next

    ; Must have non-zero component mask
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    ld hl, entity_comp_masks_hi
    add hl, de
    or (hl)
    jr z, .srae_next

    ; Found
    ld a, c
    scf
    ret

.srae_next:
    inc c
    ld a, c
    and 31
    ld c, a
    djnz .srae_loop

    xor a
    or a                    ; Clear carry
    ret

SM_RandomActiveEntityByTemplate:
    ; Input: A = template token filter (0 = any)
    or a
    jp z, SM_RandomActiveEntity
    ld (SM_TemplateFilterToken), a

    call SM_RandomByte
    and 31
    ld c, a                 ; C = candidate index
    ld b, 32

.sraet_loop:
    ld e, c
    ld d, 0

    ; Must be active
    ld hl, entity_active
    add hl, de
    ld a, (hl)
    or a
    jr z, .sraet_next

    ; Must have non-zero component mask
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    ld hl, entity_comp_masks_hi
    add hl, de
    or (hl)
    jr z, .sraet_next

    ; Must match template token
    ld hl, entity_template_token
    add hl, de
    ld a, (SM_TemplateFilterToken)
    cp (hl)
    jr nz, .sraet_next

    ld a, c
    scf
    ret

.sraet_next:
    inc c
    ld a, c
    and 31
    ld c, a
    djnz .sraet_loop

    xor a
    or a                    ; Clear carry
    ret

SM_ApplyTemplateDefaultsToEntity:
    ; Input: A = template token, C = entity index
    ; Applies sprite/animation/health defaults from template profile tables.
    or a
    ret z
    cp SM_TemplateProfileCount + 1
    ret nc
    ld (SM_TemplateFilterToken), a

    ; Sprite index
    ld a, (SM_TemplateFilterToken)
    ld e, a
    ld d, 0
    ld hl, SM_TemplateSpriteTable
    add hl, de
    ld a, (hl)
    ld l, c
    ld h, 0
    ld de, entity_sprite_asset_index
    add hl, de
    ld (hl), a

    ; Animation speed
    ld a, (SM_TemplateFilterToken)
    ld e, a
    ld d, 0
    ld hl, SM_TemplateAnimSpeedTable
    add hl, de
    ld a, (hl)
    ld l, c
    ld h, 0
    ld de, entity_anim_speed
    add hl, de
    ld (hl), a

    ; Reset animation counters and force playing-loop state
    ld l, c
    ld h, 0
    ld de, entity_anim_frame
    add hl, de
    ld (hl), 0
    ld l, c
    ld h, 0
    ld de, entity_anim_tick
    add hl, de
    ld (hl), 0
    ld l, c
    ld h, 0
    ld de, entity_anim_flags
    add hl, de
    ld (hl), ANIM_FLAG_PLAYING | ANIM_FLAG_LOOP

    ; Health current
    ld a, (SM_TemplateFilterToken)
    ld e, a
    ld d, 0
    ld hl, SM_TemplateHealthCurrentTable
    add hl, de
    ld a, (hl)
    ld l, c
    ld h, 0
    ld de, entity_health_current
    add hl, de
    ld (hl), a

    ; Health max
    ld a, (SM_TemplateFilterToken)
    ld e, a
    ld d, 0
    ld hl, SM_TemplateHealthMaxTable
    add hl, de
    ld a, (hl)
    ld l, c
    ld h, 0
    ld de, entity_health_max
    add hl, de
    ld (hl), a
    ret

SM_WriteTileRelativeToEntity:
    ; Input: A = tile char ID, B = entity index, C = direction (0..7)
    ; Writes directly to VRAM Name Table at target cell.
    push af                 ; Save tile ID
    push bc                 ; Save direction + entity index

    ; Read entity center in pixels (approx center for 16x16 sprites)
    ld e, b
    ld d, 0
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    add a, 8
    ld b, a                 ; B = center X pixel

    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    add a, 8
    ld c, a                 ; C = center Y pixel

    ; Convert to tile coordinates (8x8 grid)
    ld a, b
    srl a
    srl a
    srl a
    ld b, a                 ; B = tile X
    ld a, c
    srl a
    srl a
    srl a
    ld c, a                 ; C = tile Y

    ; Restore direction in A (from pushed BC high byte via stack)
    pop de                  ; D = old B(entity), E = old C(direction)
    ld a, e                 ; A = direction

    ; Apply direction offset with bounds checks
    or a
    jr z, .swt_up
    cp 1
    jr z, .swt_down
    cp 2
    jr z, .swt_left
    cp 3
    jr z, .swt_right
    cp 4
    jr z, .swt_up_right
    cp 5
    jr z, .swt_up_left
    cp 6
    jr z, .swt_down_right
    cp 7
    jr z, .swt_down_left
    jp .swt_out

.swt_up:
    ld a, c
    or a
    jp z, .swt_out
    dec c
    jr .swt_apply

.swt_down:
    ld a, c
    cp 23
    jp nc, .swt_out
    inc c
    jr .swt_apply

.swt_left:
    ld a, b
    or a
    jp z, .swt_out
    dec b
    jr .swt_apply

.swt_right:
    ld a, b
    cp 31
    jp nc, .swt_out
    inc b
    jr .swt_apply

.swt_up_right:
    ld a, c
    or a
    jp z, .swt_out
    ld a, b
    cp 31
    jp nc, .swt_out
    dec c
    inc b
    jr .swt_apply

.swt_up_left:
    ld a, c
    or a
    jp z, .swt_out
    ld a, b
    or a
    jp z, .swt_out
    dec c
    dec b
    jr .swt_apply

.swt_down_right:
    ld a, c
    cp 23
    jp nc, .swt_out
    ld a, b
    cp 31
    jp nc, .swt_out
    inc c
    inc b
    jr .swt_apply

.swt_down_left:
    ld a, c
    cp 23
    jp nc, .swt_out
    ld a, b
    or a
    jp z, .swt_out
    inc c
    dec b

.swt_apply:
    ; HL = tile offset = (tileY * 32) + tileX
    ld l, c
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl              ; *32
    ld e, b
    ld d, 0
    add hl, de

    pop af                  ; A = tile char ID
    ld b, a                 ; Preserve tile ID in B

    ; Update mutable screen layout map
    push hl                 ; Save tile offset
    ld de, (current_screen_layout)
    add hl, de
    call mapper_push_p2
    ld a, (current_screen_layout_bank)
    call mapper_set_bank_p2
    ld a, b
    ld (hl), a
    call mapper_pop_p2
    pop hl

    ; Update mutable behavior map (0 = passable, 1 = solid)
    push hl
    ld de, (current_behavior_map)
    add hl, de
    call mapper_push_p2
    ld a, (current_behavior_map_bank)
    call mapper_set_bank_p2
    ld a, b
    or a
    jr z, .store_behavior_passable
    ld a, 1
.store_behavior_passable:
    ld (hl), a
    call mapper_pop_p2
    pop hl

    ; Invalidate cached behavior row after map mutation
    ld a, #FF
    ld (behavior_cache_row), a

    ; Write tile character to VRAM Name Table
    ld de, NAMETBL
    add hl, de
    ld a, b
    call WRTVRM
    ret

.swt_out:
    pop af
    ret

; ==================================================================
; HELPER: Read Variable Value
; Input: A = VarID, B = Entity Index
; Output: A = Variable Value
; Destroys: DE, HL
; ==================================================================
SM_ReadVar:
    cp 6
    jr nc, .read_global

    ; Entity variable (0-5) - use jump table for speed
    push bc
    ld e, b
    ld d, 0                 ; DE = Entity Index

    ; Jump table dispatch
    ld l, a
    ld h, 0
    add hl, hl              ; HL = VarID * 2
    ld bc, .read_entity_var_table
    add hl, bc
    ld c, (hl)
    inc hl
    ld b, (hl)
    push bc
    ret                     ; Jump to handler

.read_entity_var_table:
    DW .read_x              ; 0
    DW .read_y              ; 1
    DW .read_vx             ; 2
    DW .read_vy             ; 3
    DW .read_on_ground      ; 4
    DW .read_health         ; 5

.read_x:
    ld hl, entity_x_pos
    jr .do_read_entity
.read_y:
    ld hl, entity_y_pos
    jr .do_read_entity
.read_vx:
    ld hl, entity_vel_x
    jr .do_read_entity
.read_vy:
    ld hl, entity_vel_y
    jr .do_read_entity
.read_on_ground:
    ld hl, entity_on_ground
    add hl, de
    ld a, (hl)
    and #01
    pop bc
    ret
.read_health:
    ld hl, entity_health_current
    ; Fall through to do_read_entity

.do_read_entity:
    add hl, de
    ld a, (hl)
    pop bc
    ret

.read_global:
    ; Global variable (6+)
    sub 6
    ld l, a
    ld h, 0
    add hl, hl              ; HL = (VarID - 6) * 2

    push de
    ld de, SM_GlobalVarTable
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)              ; DE = address
    ld a, (de)              ; A = value
    pop de
    ret

; ==================================================================
; HELPER: Write Variable Value
; Input: A = VarID, C = Value, B = Entity Index
; Destroys: DE, HL
; ==================================================================
SM_WriteVar:
    cp 6
    jr nc, .write_global

    ; Entity variable (0-5) - use jump table for speed
    push bc
    ld e, b
    ld d, 0                 ; DE = Entity Index

    ; Jump table dispatch
    ld l, a
    ld h, 0
    add hl, hl              ; HL = VarID * 2
    ld bc, .write_entity_var_table
    add hl, bc
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld bc, .do_write
    push bc
    jp (hl)                 ; Jump to handler

.write_entity_var_table:
    DW .write_x             ; 0
    DW .write_y             ; 1
    DW .write_vx            ; 2
    DW .write_vy            ; 3
    DW .write_on_ground     ; 4
    DW .write_health        ; 5

.write_x:
    ld hl, entity_x_pos
    jr .do_write_entity
.write_y:
    ld hl, entity_y_pos
    jr .do_write_entity
.write_vx:
    ld hl, entity_vel_x
    jr .do_write_entity
.write_vy:
    ld hl, entity_vel_y
    jr .do_write_entity
.write_on_ground:
    ld hl, entity_on_ground
    jr .do_write_entity
.write_health:
    ld hl, entity_health_current
    ; Fall through to do_write_entity

.do_write_entity:
    add hl, de
    ld (hl), c
.do_write:
    pop bc
    ret

.write_global:
    sub 6
    ld l, a
    ld h, 0
    add hl, hl

    push de
    ld de, SM_GlobalVarTable
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, c
    ld (de), a
    pop de
    ret

; ==================================================================
; MATHEMATICAL OPERATIONS
; ==================================================================

Action_AddVars:
; Params: DestVarID, Src1VarID, Src2VarID (3 bytes)
; DestVar = Src1 + Src2
    ld c, (hl)              ; C = DestVarID
    inc hl
    ld d, (hl)              ; D = Src1VarID
    inc hl
    ld e, (hl)              ; E = Src2VarID
    inc hl

    push hl                 ; Save params ptr
    push bc                 ; Save DestVarID

    ; Read Src1
    ld a, d
    call SM_ReadVar         ; A = Src1 value
    ld d, a                 ; D = Src1 value

    ; Read Src2
    ld a, e
    call SM_ReadVar         ; A = Src2 value

    ; Add
    add a, d                ; A = Src1 + Src2
    ld c, a                 ; C = result

    ; Write to Dest
    pop de                  ; E = DestVarID
    ld a, e
    call SM_WriteVar

    pop hl
    ret

Action_SubVars:
; Params: DestVarID, Src1VarID, Src2VarID (3 bytes)
; DestVar = Src1 - Src2
    ld c, (hl)              ; C = DestVarID
    inc hl
    ld d, (hl)              ; D = Src1VarID
    inc hl
    ld e, (hl)              ; E = Src2VarID
    inc hl

    push hl
    push bc

    ; Read Src1
    ld a, d
    call SM_ReadVar
    ld d, a

    ; Read Src2
    ld a, e
    call SM_ReadVar

    ; Subtract
    ld e, a                 ; E = Src2
    ld a, d                 ; A = Src1
    sub e                   ; A = Src1 - Src2
    ld c, a

    ; Write to Dest
    pop de
    ld a, e
    call SM_WriteVar

    pop hl
    ret

Action_MulVars:
; Params: DestVarID, Src1VarID, Src2VarID (3 bytes)
; DestVar = Src1 * Src2 (8-bit multiplication, optimized for powers of 2)
    ld c, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld e, (hl)
    inc hl

    push hl
    push bc

    ; Read Src1 (multiplicand)
    ld a, d
    call SM_ReadVar
    ld d, a

    ; Read Src2 (multiplier)
    ld a, e
    call SM_ReadVar
    ld e, a

    ; Optimize for special cases
    or a
    jr z, .mul_by_zero      ; multiplier == 0
    cp 1
    jr z, .mul_by_one       ; multiplier == 1

    ; Check if multiplier is power of 2 (2,4,8,16,32,64,128)
    ld b, a                 ; B = multiplier

    ; Test for power of 2: (B & (B-1)) == 0
    ld a, b
    dec a
    and b
    jr nz, .mul_slow        ; Not power of 2, use slow method

    ; Count shifts needed (find which power of 2)
    ld a, d                 ; A = multiplicand

    ; Power of 2 detected - use shifts
    ld a, d                 ; A = multiplicand
    ld c, b                 ; C = multiplier

.mul_shift_loop:
    cp 1
    jr z, .mul_done
    srl c                   ; Shift multiplier right
    jr nc, .mul_shift_loop  ; If bit was 0, continue
    sla a                   ; Shift result left (multiply by 2)
    jr .mul_shift_loop

.mul_slow:
    ; Standard multiplication by repeated addition
    ld a, 0
    ld c, e                 ; C = multiplier

.mul_loop:
    add a, d
    dec c
    jr nz, .mul_loop
    jr .mul_done

.mul_by_zero:
    ld a, 0
    jr .mul_done

.mul_by_one:
    ld a, d                 ; result = multiplicand

.mul_done:
    ld c, a                 ; C = result

    ; Write to Dest
    pop de
    ld a, e
    call SM_WriteVar

    pop hl
    ret

Action_DivVars:
; Params: DestVarID, Src1VarID, Src2VarID (3 bytes)
; DestVar = Src1 / Src2 (integer division, optimized for powers of 2)
    ld c, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld e, (hl)
    inc hl

    push hl
    push bc

    ; Read Src1 (dividend)
    ld a, d
    call SM_ReadVar
    ld d, a

    ; Read Src2 (divisor)
    ld a, e
    call SM_ReadVar
    ld e, a

    ; Optimize for special cases
    or a
    jr z, .div_by_zero      ; divisor == 0
    cp 1
    jr z, .div_by_one       ; divisor == 1

    ; Check if divisor is power of 2 (2,4,8,16,32,64,128)
    ld b, a                 ; B = divisor

    ; Test for power of 2: (B & (B-1)) == 0
    ld a, b
    dec a
    and b
    jr nz, .div_slow        ; Not power of 2, use slow method

    ; Power of 2 detected - use shifts
    ld a, d                 ; A = dividend
    ld c, b                 ; C = divisor

.div_shift_loop:
    srl c                   ; Shift divisor right
    jr z, .div_done         ; If divisor became 0, done
    srl a                   ; Shift dividend right (divide by 2)
    jr .div_shift_loop

.div_slow:
    ; Standard division by repeated subtraction
    ld c, e                 ; C = divisor
    ld a, d                 ; A = dividend
    ld d, 0                 ; D = quotient

.div_loop:
    cp c
    jr c, .div_done_slow    ; If A < divisor, done
    sub c                   ; A -= divisor
    inc d                   ; quotient++
    jr .div_loop

.div_done_slow:
    ld a, d                 ; A = quotient
    jr .div_done

.div_by_zero:
    ld a, 0                 ; Division by zero = 0
    jr .div_done

.div_by_one:
    ld a, d                 ; result = dividend

.div_done:
    ld c, a                 ; C = result

    ; Write to Dest
    pop de
    ld a, e
    call SM_WriteVar

    pop hl
    ret

Action_ModVars:
; Params: DestVarID, Src1VarID, Src2VarID (3 bytes)
; DestVar = Src1 % Src2 (modulo/remainder, optimized for powers of 2)
    ld c, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld e, (hl)
    inc hl

    push hl
    push bc

    ; Read Src1 (dividend)
    ld a, d
    call SM_ReadVar
    ld d, a

    ; Read Src2 (divisor/modulo)
    ld a, e
    call SM_ReadVar
    ld e, a

    ; Optimize for special cases
    or a
    jr z, .mod_by_zero      ; modulo == 0
    cp 1
    jr z, .mod_by_one       ; modulo == 1 (always 0)

    ; Check if modulo is power of 2 (2,4,8,16,32,64,128)
    ld b, a                 ; B = modulo

    ; Test for power of 2: (B & (B-1)) == 0
    ld a, b
    dec a
    and b
    jr nz, .mod_slow        ; Not power of 2, use slow method

    ; Power of 2 detected - use AND mask
    ; x % (2^n) = x & (2^n - 1)
    ld a, b
    dec a                   ; A = modulo - 1 (mask)
    ld c, a
    ld a, d                 ; A = dividend
    and c                   ; A = dividend & (modulo - 1)
    jr .mod_done

.mod_slow:
    ; Standard modulo by repeated subtraction
    ld c, e                 ; C = modulo
    ld a, d                 ; A = dividend

.mod_loop:
    cp c
    jr c, .mod_done         ; If A < modulo, A is the remainder
    sub c
    jr .mod_loop

.mod_by_zero:
    ld a, 0                 ; Modulo by zero = 0
    jr .mod_done

.mod_by_one:
    ld a, 0                 ; x % 1 = 0 always

.mod_done:
    ld c, a                 ; C = result

    ; Write to Dest
    pop de
    ld a, e
    call SM_WriteVar

    pop hl
    ret


Action_AssignVar:
; Params: DestVarID, SrcVarID (2 bytes)
; DestVar = SrcVar
    ld c, (hl)              ; C = DestVarID
    inc hl
    ld d, (hl)              ; D = SrcVarID
    inc hl

    push hl                 ; Save params ptr
    push bc                 ; Save DestVarID (in C) and entity index (in B)

    ; Read source variable value
    ld a, d
    call SM_ReadVar         ; A = source value
    ld c, a                 ; C = value to write

    ; Write to destination variable
    pop de                  ; E = DestVarID
    ld a, e
    call SM_WriteVar

    pop hl
    ret

Action_DisableInput:
; No params - sets entity_input_disabled[entity] = 1
    push hl
    ld c, b
    ld b, 0
    ld hl, entity_input_disabled
    add hl, bc
    ld (hl), 1             ; Disable input for this entity
    pop hl
    ret

Action_EnableInput:
; No params - sets entity_input_disabled[entity] = 0
    push hl
    ld c, b
    ld b, 0
    ld hl, entity_input_disabled
    add hl, bc
    ld (hl), 0             ; Enable input for this entity

    ; Restore "only animate when moving" behavior after temporary disable.
    ; This prevents idle loop animation after death/recover transitions.
    ld hl, entity_anim_flags
    add hl, bc
    set 2, (hl)            ; ANIM_FLAG_ONLY_WHEN_MOVING
    pop hl
    ret

    ; ------------------------------------------------------------------
    ; CONDITION DISPATCH TABLE
    ; ------------------------------------------------------------------

SM_ConditionTable:
    DW Condition_Nop            ; 0
    DW Condition_And            ; 1
    DW Condition_Or             ; 2
    DW Condition_Not            ; 3
    DW Condition_KeyPressed     ; 4
    DW Condition_KeyReleased    ; 5
    DW Condition_TimeOut        ; 6
    DW Condition_CanMove        ; 7
    DW Condition_HasCollision   ; 8
    DW Condition_PathClear      ; 9
    DW Condition_OnWallCollision; 10
    DW Condition_DeadlyTile     ; 11
    DW Condition_AnimComplete   ; 12
    DW Condition_KeyAndMove     ; 13
    DW Condition_VariableCompare; 14
    DW Condition_Xor            ; 15

    ; ------------------------------------------------------------------
    ; CONDITION HANDLERS IMPLEMENTATION
    ; ------------------------------------------------------------------

Condition_Nop:
    ld a, 1                 ; Always true
    ret

Condition_And:
    ; AND compound condition
    ; Data format: DB subcondition_count, then N subconditions inline
    ; Evaluates all subconditions; returns true only if ALL are true
    ; Input: B = Entity Index, HL = Params (points to count byte)
    ; Output: A = 1 (all true) or 0 (any false), HL = past all subcondition data
    ld c, (hl)              ; C = subcondition count
    inc hl
    ld d, 1                 ; D = result accumulator (1 = all true so far)

.and_loop:
    ld a, c
    or a
    jr z, .and_done         ; No more subconditions

    push bc                 ; Save count (C) and entity index (implicitly)
    push de                 ; Save result accumulator (D)

    ld a, b                 ; A = Entity Index
    call SM_EvaluateCondition ; A = subcondition result, HL advanced

    pop de                  ; Restore result accumulator
    and d                   ; Combine: D = D AND result
    ld d, a

    pop bc                  ; Restore count and entity index
    dec c
    jr .and_loop

.and_done:
    ld a, d                 ; A = AND result
    ret

Condition_Or:
    ; OR compound condition
    ; Data format: DB subcondition_count, then N subconditions inline
    ; Evaluates all subconditions; returns true if ANY is true
    ; Input: B = Entity Index, HL = Params (points to count byte)
    ; Output: A = 1 (any true) or 0 (all false), HL = past all subcondition data
    ld c, (hl)              ; C = subcondition count
    inc hl
    ld d, 0                 ; D = result accumulator (0 = all false so far)

.or_loop:
    ld a, c
    or a
    jr z, .or_done          ; No more subconditions

    push bc                 ; Save count (C) and entity index
    push de                 ; Save result accumulator (D)

    ld a, b                 ; A = Entity Index
    call SM_EvaluateCondition ; A = subcondition result, HL advanced

    pop de                  ; Restore result accumulator
    or d                    ; Combine: D = D OR result
    ld d, a

    pop bc                  ; Restore count and entity index
    dec c
    jr .or_loop

.or_done:
    ld a, d                 ; A = OR result
    ret

Condition_Xor:
    ; XOR compound condition
    ; Data format: DB subcondition_count, then N subconditions inline
    ; Returns true if an odd number of subconditions are true.
    ; Input: B = Entity Index, HL = Params (points to count byte)
    ; Output: A = 1 (odd true count) or 0 (even true count), HL advanced
    ld c, (hl)              ; C = subcondition count
    inc hl
    xor a
    ld d, a                 ; D = XOR accumulator (0 = even)

.xor_loop:
    ld a, c
    or a
    jr z, .xor_done

    push bc                 ; Save count/entity index
    push de                 ; Save accumulator

    ld a, b                 ; A = Entity Index
    call SM_EvaluateCondition ; A = subcondition result, HL advanced
    and 1

    pop de                  ; Restore accumulator in D
    xor d                   ; Toggle parity if result is 1
    and 1
    ld d, a

    pop bc
    dec c
    jr .xor_loop

.xor_done:
    ld a, d
    ret

Condition_Not:
    ; NOT compound condition
    ; Data format: DB 1 (always 1 subcondition), then 1 subcondition inline
    ; Evaluates the single subcondition and inverts the result
    ; Input: B = Entity Index, HL = Params (points to count byte)
    ; Output: A = inverted result, HL = past subcondition data
    inc hl                  ; Skip count byte (always 1)

    ld a, b                 ; A = Entity Index
    call SM_EvaluateCondition ; A = subcondition result, HL advanced

    ; Invert: 0 -> 1, non-zero -> 0
    or a
    jr z, .not_was_false
    xor a                   ; Was true -> return false
    ret
.not_was_false:
    ld a, 1                 ; Was false -> return true
    ret

; ------------------------------------------------------------------
; HELPER: Match directional key against one input direction value
; Input: D = Desired key (1/3/5/7), A = direction (0-8), B = entity index
; Output: A = 1 if active, 0 if inactive
; Note: diagonal inputs only match a cardinal if entity_dir_mask[B] permits
;       that direction. Entities without Input default to #0F (all allowed).
; ------------------------------------------------------------------
SM_MatchDirection:
    ld e, a
    cp d
    jp z, .smd_match_yes    ; exact match always passes

    ld a, d
    cp 1                    ; UP
    jp nz, .smd_not_up
    ld a, e
    cp 2                    ; UP+RIGHT
    jr z, .smd_check_up
    cp 8                    ; UP+LEFT
    jp nz, .smd_match_no
.smd_check_up:
    push hl
    push de
    ld hl, entity_dir_mask
    ld d, 0
    ld e, b
    add hl, de
    ld a, (hl)
    pop de
    pop hl
    and DIR_ALLOW_UP
    jp nz, .smd_match_yes
    jp .smd_match_no

.smd_not_up:
    cp 5                    ; DOWN
    jp nz, .smd_not_down
    ld a, e
    cp 4                    ; DOWN+RIGHT
    jr z, .smd_check_down
    cp 6                    ; DOWN+LEFT
    jp nz, .smd_match_no
.smd_check_down:
    push hl
    push de
    ld hl, entity_dir_mask
    ld d, 0
    ld e, b
    add hl, de
    ld a, (hl)
    pop de
    pop hl
    and DIR_ALLOW_DOWN
    jp nz, .smd_match_yes
    jp .smd_match_no

.smd_not_down:
    cp 7                    ; LEFT
    jp nz, .smd_not_left
    ld a, e
    cp 6                    ; DOWN+LEFT
    jr z, .smd_check_left
    cp 8                    ; UP+LEFT
    jp nz, .smd_match_no
.smd_check_left:
    push hl
    push de
    ld hl, entity_dir_mask
    ld d, 0
    ld e, b
    add hl, de
    ld a, (hl)
    pop de
    pop hl
    and DIR_ALLOW_LEFT
    jp nz, .smd_match_yes
    jp .smd_match_no

.smd_not_left:
    cp 3                    ; RIGHT
    jp nz, .smd_match_no
    ld a, e
    cp 2                    ; UP+RIGHT
    jr z, .smd_check_right
    cp 4                    ; DOWN+RIGHT
    jp nz, .smd_match_no
.smd_check_right:
    push hl
    push de
    ld hl, entity_dir_mask
    ld d, 0
    ld e, b
    add hl, de
    ld a, (hl)
    pop de
    pop hl
    and DIR_ALLOW_RIGHT
    jp nz, .smd_match_yes

.smd_match_no:
    xor a
    ret

.smd_match_yes:
    ld a, 1
    ret

; ------------------------------------------------------------------
; HELPER: Deduce movement direction from entity velocity
; Input: B = Entity Index
; Output: A = direction key id (1/3/5/7) or 0 if idle
; ------------------------------------------------------------------
SM_DeduceDirectionFromVelocity:
    push de
    push hl

    ld e, b
    ld d, 0

    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    or a
    jr z, .sddv_check_y
    bit 7, a
    jr z, .sddv_right
    ld a, 7
    jr .sddv_done

.sddv_right:
    ld a, 3
    jr .sddv_done

.sddv_check_y:
    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)
    or a
    jr z, .sddv_idle
    bit 7, a
    jr z, .sddv_down
    ld a, 1
    jr .sddv_done

.sddv_down:
    ld a, 5
    jr .sddv_done

.sddv_idle:
    xor a

.sddv_done:
    pop hl
    pop de
    ret

; ------------------------------------------------------------------
; HELPER: Check if an entity can move one pixel in a direction
; Input: B = Entity Index, A = direction key id (1/3/5/7)
; Output: A = 1 if path is clear, 0 if blocked
; ------------------------------------------------------------------
SM_TestMoveDirection:
    push bc
    push de
    push hl

    ld c, a                 ; C = direction

    ; Unknown/neutral direction -> treat as clear
    cp 1
    jr z, .smtmd_load_pos
    cp 3
    jr z, .smtmd_load_pos
    cp 5
    jr z, .smtmd_load_pos
    cp 7
    jr z, .smtmd_load_pos
    ld a, 1
    jr .smtmd_done

.smtmd_load_pos:
    ld e, b
    ld d, 0

    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)              ; A = X (keep DE as entity index)

    ld hl, entity_y_pos
    add hl, de
    ld e, (hl)              ; E = Y
    ld d, a                 ; D = X

    ld a, c
    cp 1
    jr nz, .smtmd_not_up
    dec e
    jr .smtmd_check

.smtmd_not_up:
    cp 5
    jr nz, .smtmd_not_down
    inc e
    jr .smtmd_check

.smtmd_not_down:
    cp 7
    jr nz, .smtmd_not_left
    dec d
    jr .smtmd_check

.smtmd_not_left:
    inc d                   ; RIGHT (3)

.smtmd_check:
    call check_collision_box
    jr z, .smtmd_clear
    xor a
    jr .smtmd_done

.smtmd_clear:
    ld a, 1

.smtmd_done:
    pop hl
    pop de
    pop bc
    ret

Condition_KeyPressed:
    ; Check if input is disabled for this entity
    push hl
    ld c, b
    ld b, 0
    ld hl, entity_input_disabled
    add hl, bc
    ld a, (hl)
    pop hl
    ld b, c             ; Restore B = entity index
    or a
    jr z, .sm_input_enabled
    xor a               ; A = 0 (key not pressed, input disabled)
    inc hl              ; Skip keyId param
    ret
.sm_input_enabled:
    ; Edge keydown: active now and inactive previous frame
    ; Params: Key ID (1=Up, 5=Down, 7=Left, 3=Right, 9=Fire)
    ld d, (hl)
    inc hl

    ld a, d
    cp 9
    jr z, .ckp_fire

    ; Directional edge: current active, previous inactive
    ld a, (input_state)
    call SM_MatchDirection
    or a
    jr z, .ckp_not_pressed

    ld a, (prev_input_state)
    call SM_MatchDirection
    or a
    jr nz, .ckp_not_pressed

    ld a, 1
    ret

.ckp_fire:
    ld a, (input_btn_curr)
    and INPUT_BTN_FIRE
    jr z, .ckp_not_pressed
    ld a, (input_btn_prev)
    and INPUT_BTN_FIRE
    jr nz, .ckp_not_pressed
    ld a, 1
    ret

.ckp_not_pressed:
    xor a
    ret

Condition_KeyReleased:
    ; Edge keyup: inactive now and active previous frame
    ; Params: Key ID (1=Up, 5=Down, 7=Left, 3=Right, 9=Fire)
    ld d, (hl)
    inc hl

    ld a, d
    cp 9
    jr z, .ckr_fire

    ; Directional edge: current inactive, previous active
    ld a, (input_state)
    call SM_MatchDirection
    or a
    jr nz, .ckr_not_released

    ld a, (prev_input_state)
    call SM_MatchDirection
    or a
    jr z, .ckr_not_released

    ld a, 1
    ret

.ckr_fire:
    ld a, (input_btn_curr)
    and INPUT_BTN_FIRE
    jr nz, .ckr_not_released
    ld a, (input_btn_prev)
    and INPUT_BTN_FIRE
    jr z, .ckr_not_released
    ld a, 1
    ret

.ckr_not_released:
    xor a
    ret

Condition_TimeOut:
    ; Params: Duration (1 byte) - frames to wait
    ; Returns: A=1 if entity state timer >= duration, else A=0
    ld a, (hl)              ; A = Duration threshold
    inc hl

    push hl                 ; Save Params Ptr
    push af                 ; Save Duration

    ; BC = Entity Index
    ld c, b
    ld b, 0

    ; Read entity state timer (16-bit: entity_sm_timer_h:entity_sm_timer_l)
    ld hl, entity_sm_timer_l
    add hl, bc
    ld e, (hl)              ; E = Timer Low

    ld hl, entity_sm_timer_h
    add hl, bc
    ld d, (hl)              ; D = Timer High

    ; Compare timer (DE) with duration (stored in stack)
    pop af                  ; A = Duration threshold
    ld b, a                 ; B = Duration

    ; Since duration is 8-bit, compare low byte first
    ; If timer_low >= duration, return true
    ld a, e                 ; A = Timer Low
    cp b
    jr nc, .timeout_true    ; Timer Low >= Duration -> true

    ; If timer_high > 0, definitely >= duration (since duration is 8-bit max 255)
    ld a, d
    or a
    jr nz, .timeout_true

    ; Timer < Duration
.timeout_false:
    xor a                   ; A = 0 (false)
    pop hl
    ret

.timeout_true:
    ld a, 1                 ; A = 1 (true)
    pop hl
    ret

Condition_CanMove:
    ; Params: direction key id (1/3/5/7)
    ld a, (hl)
    inc hl
    call SM_TestMoveDirection
    ret

Condition_HasCollision:
    ; Params: collisionType (0=any, 1=wall, 2=enemy, 3=item, 4=entity)
    ld a, (hl)
    inc hl
    ld c, a                 ; C = collision type

    push hl
    ld e, b
    ld d, 0

    ; Read wall collision flags without clobbering DE index
    ld hl, entity_wall_collision_flags
    add hl, de
    ld a, (hl)              ; A = wall flags

    ; Read entity-entity collision flags using same DE index
    ld hl, entity_entity_collision_flags
    add hl, de
    ld e, (hl)
    ld d, a                 ; D = wall flags
    pop hl

    ld a, c
    or a
    jr z, .chc_any
    cp 1
    jr z, .chc_wall
    cp 2
    jr z, .chc_enemy
    cp 3
    jr z, .chc_item
    cp 4
    jr z, .chc_entity

.chc_none:
    xor a
    ret

.chc_any:
    ld a, d
    or e
    jr z, .chc_none
    ld a, 1
    ret

.chc_wall:
    ld a, d
    or a
    jr z, .chc_none
    ld a, 1
    ret

.chc_enemy:
    ld a, e
    and COLLISION_EVENT_ENEMY
    jr z, .chc_none
    ld a, 1
    ret

.chc_item:
    ld a, e
    and COLLISION_EVENT_ITEM
    jr z, .chc_none
    ld a, 1
    ret

.chc_entity:
    ld a, e
    and COLLISION_EVENT_ENTITY
    jr z, .chc_none
    ld a, 1
    ret

Condition_PathClear:
    ; Params: direction key id (1/3/5/7), 0 = deduce from velocity
    ld a, (hl)
    inc hl
    or a
    jr nz, .cpc_have_direction
    call SM_DeduceDirectionFromVelocity
    or a
    jr z, .cpc_idle

.cpc_have_direction:
    call SM_TestMoveDirection
    ret

.cpc_idle:
    ld a, 1                 ; Idle has clear path by definition
    ret

Condition_OnWallCollision:
    ; Params: direction key id (0=any, 1=up, 5=down, 7=left, 3=right)
    ld a, (hl)
    inc hl
    ld c, a

    push hl
    ld hl, entity_wall_collision_flags
    ld e, b
    ld d, 0
    add hl, de
    ld a, (hl)
    ld e, a                 ; E = flags
    pop hl

    ld a, c
    or a
    jr z, .cowc_any
    cp 1
    jr z, .cowc_up
    cp 5
    jr z, .cowc_down
    cp 7
    jr z, .cowc_left
    cp 3
    jr z, .cowc_right
    xor a
    ret

.cowc_any:
    ld a, e
    or a
    jr z, .cowc_no
    ld a, 1
    ret

.cowc_up:
    ld a, e
    and #01
    jr z, .cowc_no
    ld a, 1
    ret

.cowc_down:
    ld a, e
    and #02
    jr z, .cowc_no
    ld a, 1
    ret

.cowc_left:
    ld a, e
    and #04
    jr z, .cowc_no
    ld a, 1
    ret

.cowc_right:
    ld a, e
    and #08
    jr z, .cowc_no
    ld a, 1
    ret

.cowc_no:
    xor a
    ret

Condition_DeadlyTile:
    ; Check if entity is touching deadly tile
    ; Input: B = Entity Index, HL = Params Ptr (no params)
    ; Output: A = 1 (touching deadly tile) or 0 (safe)
    ; Destroys: DE, HL
    push hl
    ld hl, entity_deadly_collision
    ld e, b
    ld d, 0
    add hl, de
    ld a, (hl)
    and #01                       ; Check bit 0
    pop hl
    ret                           ; A = 1 if deadly, 0 if safe

Condition_AnimComplete:
    ; One-shot event latched by update_animation_component when
    ; a non-loop animation reaches its final frame.
    ; Consume-on-read semantics prevents repeated transitions.
    push hl
    ld hl, entity_anim_flags
    ld e, b
    ld d, 0
    add hl, de
    bit 3, (hl)                    ; ANIM_FLAG_COMPLETED
    jr z, .anim_complete_false
    res 3, (hl)                    ; consume event
    ld a, 1
    pop hl
    ret

.anim_complete_false:
    xor a
    pop hl
    ret

Condition_KeyAndMove:
    ; Params: keyId, directionId (0 means derive from key/velocity)
    ld d, (hl)              ; keyId
    inc hl
    ld c, (hl)              ; directionId
    inc hl

    ; First: key active (level check)
    ld a, d
    cp 9
    jr z, .ckam_fire
    ld a, (input_state)
    call SM_MatchDirection
    or a
    jr z, .ckam_false
    jr .ckam_check_move

.ckam_fire:
    ld a, (input_btn_curr)
    and INPUT_BTN_FIRE
    jr z, .ckam_false

.ckam_check_move:
    ld a, c
    or a
    jr nz, .ckam_have_dir

    ld a, d
    cp 9
    jr z, .ckam_from_velocity
    ld a, d
    jr .ckam_have_dir

.ckam_from_velocity:
    call SM_DeduceDirectionFromVelocity
    or a
    jr z, .ckam_false

.ckam_have_dir:
    call SM_TestMoveDirection
    ret

.ckam_false:
    xor a
    ret

Condition_VariableCompare:
    ; Params: VarID (1 byte), Operator (1 byte), Value (1 byte)
    ; Input: B = Entity Index, HL = Params Ptr
    ; Output: A = 1 (true) or 0 (false), HL = Updated Ptr
    ; Supports entity variables (ID 0-5) and global variables (ID 6+)

    ld a, (hl)              ; A = Variable ID
    inc hl
    ld c, (hl)              ; C = Operator ID
    inc hl
    ld d, (hl)              ; D = Compare Value
    inc hl

    push hl                 ; Save updated params ptr
    push bc                 ; Save Operator and Entity Index
    push de                 ; Save Compare Value

    ; Check if VarID < 6 (entity variable) or >= 6 (global variable)
    cp 6
    jr nc, .get_global_var

    ; Entity variables (ID 0-5)
    ld c, b                 ; C = Entity Index
    ld b, 0                 ; BC = Entity Index

    cp 0                    ; Check if x
    jr z, .get_x
    cp 1                    ; Check if y
    jr z, .get_y
    cp 2                    ; Check if vx
    jr z, .get_vx
    cp 3                    ; Check if vy
    jr z, .get_vy
    cp 4                    ; Check if isOnGround
    jr z, .get_on_ground
    ; cp 5: health (fall through)

.get_health:
    ld hl, entity_health_current
    add hl, bc
    ld e, (hl)
    jr .do_compare

.get_global_var:
    ; VarID >= 6: Global variable
    ; Get address from SM_GlobalVarTable
    sub 6                   ; A = VarID - 6
    ld l, a
    ld h, 0
    add hl, hl              ; HL = (VarID - 6) * 2

    push de                 ; Save Compare Value
    ld de, SM_GlobalVarTable
    add hl, de              ; HL = &SM_GlobalVarTable[VarID - 6]

    ; Read address from table
    ld e, (hl)
    inc hl
    ld d, (hl)              ; DE = address of global variable

    ; Read value
    ld a, (de)              ; A = global variable value
    ld e, a                 ; E = variable value
    pop de                  ; Restore Compare Value to D
    jr .do_compare

.get_x:
    ld hl, entity_x_pos
    add hl, bc
    ld e, (hl)              ; E = entity x position
    jr .do_compare

.get_y:
    ld hl, entity_y_pos
    add hl, bc
    ld e, (hl)              ; E = entity y position
    jr .do_compare

.get_vx:
    ld hl, entity_vel_x
    add hl, bc
    ld e, (hl)              ; E = entity x velocity
    jr .do_compare

.get_vy:
    ld hl, entity_vel_y
    add hl, bc
    ld e, (hl)              ; E = entity y velocity
    jr .do_compare

.get_on_ground:
    ld hl, entity_on_ground
    add hl, bc
    ld a, (hl)
    and #01                 ; Extract bit 0
    ld e, a                 ; E = 1 if on ground, 0 if in air
    jr .do_compare

.do_compare:
    ; E = Variable Value
    ; Stack: Compare Value (D), Operator (C in saved BC), Entity Index
    pop hl                  ; HL = Compare Value (D in H)
    ld d, h                 ; D = Compare Value
    pop bc                  ; C = Operator ID, B = Entity Index (restore)
    pop hl                  ; HL = Updated Params Ptr
    
    ; Now: E = Variable Value, D = Compare Value, C = Operator
    ; Perform comparison based on operator
    ld a, c                 ; A = Operator ID
    
    cp 0                    ; == operator
    jr z, .op_equals
    cp 1                    ; != operator
    jr z, .op_not_equals
    cp 2                    ; > operator
    jr z, .op_greater
    cp 3                    ; < operator
    jr z, .op_less
    cp 4                    ; >= operator
    jr z, .op_greater_equal
    cp 5                    ; <= operator
    jr z, .op_less_equal
    
    ; Invalid operator, return false
    ld a, 0
    ret

.op_equals:
    ld a, e                 ; A = Variable Value
    cp d                    ; Compare with D
    jr z, .return_true
    jr .return_false

.op_not_equals:
    ld a, e
    cp d
    jr nz, .return_true
    jr .return_false

.op_greater:
    ld a, e
    cp d
    jr z, .return_false     ; If equal, not greater
    jr nc, .return_true     ; If no carry, E >= D, so E > D (since not equal)
    jr .return_false

.op_less:
    ld a, e
    cp d
    jr c, .return_true      ; If carry, E < D
    jr .return_false

.op_greater_equal:
    ld a, e
    cp d
    jr nc, .return_true     ; If no carry, E >= D
    jr .return_false

.op_less_equal:
    ld a, e
    cp d
    jr z, .return_true      ; If equal
    jr c, .return_true      ; If carry, E < D
    jr .return_false

.return_true:
    ld a, 1
    ret

.return_false:
    ld a, 0
    ret
    `;

function clampByte(value: any): number {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(255, Math.round(numeric)));
}

function clampNibble(value: any): number {
    return Math.max(0, Math.min(15, clampByte(value)));
}

function clampTonePeriod(value: any): number {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(4095, Math.round(numeric)));
}

function toSoundFrameCount(durationMs: any): number {
    const numeric = Number(durationMs);
    if (!Number.isFinite(numeric) || numeric <= 0) return 1;
    return Math.max(1, Math.round((numeric * 60) / 1000));
}

function buildSoundNameToIndexMap(sounds?: any[]): Record<string, number> {
    const soundMap: Record<string, number> = {};
    (sounds || []).forEach((sound, index) => {
        const id = typeof sound?.id === 'string' ? sound.id : '';
        const name = typeof sound?.name === 'string' ? sound.name : '';
        if (id) {
            soundMap[id] = index;
            soundMap[id.toLowerCase()] = index;
        }
        if (name) {
            soundMap[name] = index;
            soundMap[name.toLowerCase()] = index;
        }
    });
    return soundMap;
}

function generateStateMachineSoundTables(sounds?: any[]): string {
    const soundList = Array.isArray(sounds) ? sounds : [];
    let asm = `SM_SoundFrameSize EQU 11\n`;
    asm += `SM_SoundAssetCount EQU ${soundList.length}\n`;
    asm += `SM_SoundPtrTable:\n`;

    if (soundList.length === 0) {
        asm += `    DW 0\n`;
        return asm;
    }

    soundList.forEach((sound, soundIndex) => {
        asm += `    DW SM_SoundAsset_${soundIndex}\n`;
    });
    asm += `\n`;

    soundList.forEach((sound, soundIndex) => {
        const channels = Array.isArray(sound?.channels) ? sound.channels : [];
        const expandedChannels = [0, 1, 2].map((channelIndex) => {
            const channel = channels[channelIndex];
            const steps = Array.isArray(channel?.steps) ? channel.steps : [];
            const expanded: any[] = [];

            for (const step of steps) {
                const frameCount = toSoundFrameCount(step?.durationMs);
                for (let i = 0; i < frameCount; i++) {
                    expanded.push(step || {});
                }
            }

            return expanded;
        });

        const totalFrames = Math.max(
            expandedChannels[0].length,
            expandedChannels[1].length,
            expandedChannels[2].length
        );
        const safeFrameCount = Math.min(255, totalFrames);
        const globalNoisePeriod = Math.max(0, Math.min(31, clampByte(sound?.noisePeriod)));

        asm += `SM_SoundAsset_${soundIndex}:\n`;
        asm += `    DB ${safeFrameCount}\n`;
        asm += `    DW SM_SoundAsset_${soundIndex}_Frames\n`;
        asm += `\n`;
        asm += `SM_SoundAsset_${soundIndex}_Frames:\n`;

        if (safeFrameCount === 0) {
            asm += `    ; Empty sound asset: silent\n`;
            return;
        }

        for (let frameIndex = 0; frameIndex < safeFrameCount; frameIndex++) {
            let mixer = 0x3F;
            const frameBytes: number[] = [];

            for (let channelIndex = 0; channelIndex < 3; channelIndex++) {
                const step = expandedChannels[channelIndex][frameIndex];
                const tonePeriod = clampTonePeriod(step?.tonePeriod);
                const toneLow = tonePeriod & 0xFF;
                const toneHigh = (tonePeriod >> 8) & 0x0F;
                const volume = step ? clampNibble(step.volume) : 0;
                const toneEnabled = !!step?.toneEnabled;
                const noiseEnabled = !!step?.noiseEnabled;

                if (toneEnabled) {
                    mixer &= ~(1 << channelIndex);
                }
                if (noiseEnabled) {
                    mixer &= ~(1 << (channelIndex + 3));
                }

                frameBytes.push(toneLow, toneHigh, volume);
            }

            frameBytes.push(globalNoisePeriod, mixer & 0x3F);
            asm += `    DB ${frameBytes.join(', ')}\n`;
        }

        asm += `\n`;
    });

    return asm.trimEnd();
}

// =============================================================================
// GENERATOR FUNCTIONS
// =============================================================================

/**
 * Generates the complete ASM file content for the State Machine system
 */
export function generateStateMachineSystem(
    stateMachines: StateMachine[],
    globalVariables?: any[],
    sprites?: any[],
    tiles?: any[],
    templates?: any[],
    sounds?: any[],
    trackIndexByAssetId?: Record<string, number>
): string {
    let asm = Z80_RUNTIME_ENGINE + '\n' + Z80_DISPATCH_TABLE + '\n\n';

    // Build sprite name -> asset index map for CHANGE_SPRITE actions.
    // Must match spritesGenerator directional expansion to keep indexes aligned.
    const spriteCatalog = buildMSXDirectionalSpriteCatalog((sprites || []) as any[]);
    const spriteNameToIndex: Record<string, number> = spriteCatalog.nameToIndex;
    spriteCatalog.warnings.forEach(warning => {
        console.warn(`[State Machine Generator] ${warning}`);
    });

    // Generate global variables table
    asm += '; ==================================================================\n';
    asm += '; GLOBAL VARIABLES TABLE\n';
    asm += '; ==================================================================\n';
    // SM_GlobalVarTable maps VarID-6 to RAM address.
    // IDs 6-7 are system variables (always present).
    // IDs 8+ are user-defined global variables.
    asm += '; Maps variable IDs (6+) to their RAM addresses\n';
    asm += '; ID 6 = gem_count, ID 7 = last_gem_char, ID 8+ = user globals\n';
    asm += 'SM_GlobalVarTable:\n';
    asm += `    DW gem_count            ; ID 6: gem_count\n`;
    asm += `    DW last_gem_char        ; ID 7: last_gem_char (char of last collected tile)\n`;
    if (globalVariables && globalVariables.length > 0) {
        globalVariables.forEach((variable, index) => {
            const varId = 8 + index; // User globals start at ID 8
            asm += `    DW ${variable.asmName}            ; ID ${varId}: ${variable.name}\n`;
        });
    }
    asm += '\n';

    asm += '; ==================================================================\n';
    asm += '; STATE MACHINE DATA\n';
    asm += '; ==================================================================\n\n';

    // Build variable ID map for serialization
    const variableIdMap = buildVariableIdMap(globalVariables);
    const tileIdToCharCode = buildTileIdToBaseCharMap(tiles);
    const templateTokenMap = buildTemplateTokenMap(templates);
    const soundNameToIndex = buildSoundNameToIndexMap(sounds);
    const templateProfiles = buildTemplateProfileTables(templates, spriteNameToIndex, templateTokenMap);
    const formatDbTable = (label: string, values: number[]): string => {
        const escapedValues = values.map((v) => Math.max(0, Math.min(255, v | 0)));
        return `${label}:\n    DB ${escapedValues.join(', ')}\n`;
    };

    asm += '; ==================================================================\n';
    asm += '; TEMPLATE PROFILE TABLES\n';
    asm += '; ==================================================================\n';
    asm += `SM_TemplateProfileCount EQU ${templateProfiles.maxToken}\n`;
    asm += formatDbTable('SM_TemplateSpriteTable', templateProfiles.spriteByToken);
    asm += formatDbTable('SM_TemplateAnimSpeedTable', templateProfiles.animSpeedByToken);
    asm += formatDbTable('SM_TemplateHealthCurrentTable', templateProfiles.healthCurByToken);
    asm += formatDbTable('SM_TemplateHealthMaxTable', templateProfiles.healthMaxByToken);
    asm += '\n';

    asm += '; ==================================================================\n';
    asm += '; STATE MACHINE SPRITE RUNTIME TABLES\n';
    asm += '; NOTE: frame bank is derived from the frame pointer at runtime.\n';
    asm += '; This keeps ChangeSprite compatible with post-export ZX0 label remaps.\n';
    asm += '; ==================================================================\n';
    asm += `SM_SpriteAssetCount EQU ${spriteCatalog.sprites.length}\n`;
    asm += 'SM_SpritePatternPtrTable:\n';
    if (spriteCatalog.sprites.length > 0) {
        spriteCatalog.sprites.forEach((_, index) => {
            asm += `    DW SPRITE_${index}_PATTERN\n`;
        });
    } else {
        asm += '    ; Empty table (no sprites)\n';
    }
    asm += '\n';

    asm += '; ==================================================================\n';
    asm += '; STATE MACHINE SOUND ASSET TABLES\n';
    asm += '; PLAY_SOUND exports a one-shot 60Hz frame stream per sound asset.\n';
    asm += '; Channel loops are flattened to a single pass to avoid stuck PSG.\n';
    asm += '; Hardware envelopes are not emitted yet in this state-machine path.\n';
    asm += '; ==================================================================\n';
    asm += generateStateMachineSoundTables(sounds);
    asm += '\n';

    for (const sm of stateMachines) {
        asm += generateStateMachineData(sm, variableIdMap, spriteNameToIndex, tileIdToCharCode, templateTokenMap, soundNameToIndex, trackIndexByAssetId);
    }

    return asm;
}

function generateStateMachineData(
    sm: StateMachine,
    variableIdMap: Record<string, number>,
    spriteNameToIndex?: Record<string, number>,
    tileIdToCharCode?: Record<string, number>,
    templateTokenMap?: Record<string, number>,
    soundNameToIndex?: Record<string, number>,
    trackIndexByAssetId?: Record<string, number>
): string {
    let asm = `; State Machine: ${sm.name} (${sm.id}) \n`;
    const safeName = sm.name.replace(/[^a-zA-Z0-9]/g, '_');
    const isAnyStateId = (value?: string | null) => {
        if (!value) return false;
        const normalized = value.trim().toLowerCase();
        return normalized === 'any' || normalized === '__any_state__' || normalized === 'any state (*)';
    };

    // Generate States
    for (const state of sm.states) {
        const stateLabel = `SM_${safeName}_${state.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const onEnterLabel = `${stateLabel}_OnEnter`;
        const onExitLabel = `${stateLabel}_OnExit`;
        const transitionsLabel = `${stateLabel}_Transitions`;

        asm += `${stateLabel}: \n`;
        asm += `    DB 0; ID(unused) \n`;
        asm += `    DW ${state.onEnter && state.onEnter.length > 0 ? onEnterLabel : 0} \n`;
        asm += `    DW ${state.onExit && state.onExit.length > 0 ? onExitLabel : 0} \n`;
        // Include transitions that start from this state plus global "Any" transitions.
        // Guard: do not replicate an Any->X transition inside X itself, because that
        // creates a self-transition loop every frame when condition stays true.
        const transitions = sm.transitions.filter(t => {
            if (t.fromStateId === state.id) return true;
            if (!isAnyStateId(t.fromStateId)) return false;
            return t.toStateId !== state.id;
        });
        asm += `    DW ${transitions.length > 0 ? transitionsLabel : 0} \n`;

        // Actions Data
        if (state.onEnter && state.onEnter.length > 0) {
            asm += `${onEnterLabel}: \n`;
            for (const action of state.onEnter) {
                asm += generateActionBytes(action, sm.name, variableIdMap, spriteNameToIndex, tileIdToCharCode, templateTokenMap, soundNameToIndex, trackIndexByAssetId);
            }
            asm += `    DB 0xFF; END\n`;
        }

        if (state.onExit && state.onExit.length > 0) {
            asm += `${onExitLabel}: \n`;
            for (const action of state.onExit) {
                asm += generateActionBytes(action, sm.name, variableIdMap, spriteNameToIndex, tileIdToCharCode, templateTokenMap, soundNameToIndex, trackIndexByAssetId);
            }
            asm += `    DB 0xFF; END\n`;
        }

        // Transitions Data
        if (transitions.length > 0) {
            asm += `${transitionsLabel}: \n`;
            asm += `    DB ${transitions.length}; Count\n`;
            const deferredActionBlocks: string[] = [];
            transitions.forEach((t, idx) => {
                const isAnyToAny = isAnyStateId(t.fromStateId) && isAnyStateId(t.toStateId);
                const targetStateLabel = isAnyToAny
                    ? '0' // special marker: do not change state, only actions
                    : `SM_${safeName}_${t.toStateId.replace(/[^a-zA-Z0-9]/g, '_')}`;
                const actionLabel =
                    t.actions && t.actions.length > 0
                        ? `${transitionsLabel}_Actions_${idx}`
                        : '0';

                if (t.conditions) {
                    asm += generateConditionBytes(t.conditions, variableIdMap);
                } else {
                    asm += `    DB 0; Empty Condition(Always True) \n`;
                }
                asm += `    DW ${targetStateLabel} \n`;
                asm += `    DW ${actionLabel} \n`;

                if (actionLabel !== '0') {
                    let actionBlock = `${actionLabel}: \n`;
                    for (const action of t.actions || []) {
                        actionBlock += generateActionBytes(action, sm.name, variableIdMap, spriteNameToIndex, tileIdToCharCode, templateTokenMap, soundNameToIndex, trackIndexByAssetId);
                    }
                    actionBlock += `    DB 0xFF; END\n`;
                    deferredActionBlocks.push(actionBlock);
                }
            });
            if (deferredActionBlocks.length > 0) {
                asm += '\n';
                asm += deferredActionBlocks.join('');
            }
        }
        asm += '\n';
    }

    return asm;
}

function serializeValue(value: any): string {
    if (typeof value === 'number') {
        return value.toString();
    }
    if (typeof value === 'boolean') {
        return value ? '1' : '0';
    }
    if (typeof value === 'string') {
        // Handle string representations of booleans
        if (value === 'true') return '1';
        if (value === 'false') return '0';
        // Try to parse as number
        const num = parseInt(value, 10);
        if (!isNaN(num)) return num.toString();
        return '0';
    }
    return '0';
}

function resolveTrackIndex(value: any, trackIndexByAssetId?: Record<string, number>): number {
    if (typeof value === 'string') {
        const direct = trackIndexByAssetId?.[value];
        if (direct !== undefined) return direct;

        const parsed = parseInt(value, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 254) return parsed;
        return 0xFF;
    }

    if (typeof value === 'number' && value >= 0 && value <= 254) {
        return value;
    }

    return 0xFF;
}

function generateActionBytes(
    action: Action,
    smName: string = '',
    variableIdMap?: Record<string, number>,
    spriteNameToIndex?: Record<string, number>,
    tileIdToCharCode?: Record<string, number>,
    templateTokenMap?: Record<string, number>,
    soundNameToIndex?: Record<string, number>,
    trackIndexByAssetId?: Record<string, number>
): string {
    const id = ACTION_IDS[action.type];
    if (id === undefined) return `; Unknown Action: ${action.type} \n`;

    let bytes = `    DB ${id}; ${action.type} \n`;

    switch (action.type) {
        case ActionTypes.NONE:
            // Explicit no-op action (runtime Action_Nop / ID 0)
            break;

        case ActionTypes.SET_POSITION:
        case ActionTypes.MOVE_BY:
        case ActionTypes.SET_VELOCITY:
        case ActionTypes.APPLY_FORCE:
            bytes += `    DB ${serializeValue(action.params.x)}, ${serializeValue(action.params.y)} \n`;
            break;

        case ActionTypes.CHANGE_SPRITE: {
            // JSON uses "sprite" (name/id), convert to asset index
            const spriteName = action.params.sprite || action.params.spriteId || '';
            let spriteIndex = 0;
            if (spriteNameToIndex && typeof spriteName === 'string') {
                const directIndex = spriteNameToIndex[spriteName];
                const lowerIndex = spriteNameToIndex[spriteName.toLowerCase()];
                if (directIndex !== undefined) {
                    spriteIndex = directIndex;
                } else if (lowerIndex !== undefined) {
                    spriteIndex = lowerIndex;
                } else {
                    spriteIndex = serializeValue(spriteName) === '0' ? 0 : parseInt(serializeValue(spriteName), 10) || 0;
                }
            } else {
                spriteIndex = serializeValue(spriteName) === '0' ? 0 : parseInt(serializeValue(spriteName), 10) || 0;
            }
            bytes += `    DB ${spriteIndex}; sprite: ${spriteName} \n`;
            break;
        }

        case ActionTypes.PLAY_ANIMATION:
            bytes += `    DB ${serializeValue(action.params.animationName)} \n`;
            break;

        case ActionTypes.SET_ANIMATION_SPEED:
            bytes += `    DB ${serializeValue(action.params.speed)} \n`;
            break;

        case ActionTypes.TOGGLE_ANIMATION:
            bytes += `    DB ${serializeValue(action.params.playing)} \n`;
            break;

        case ActionTypes.PLAY_SOUND: {
            const soundId = action.params.soundId ?? action.params.sound ?? action.params.soundAssetId ?? 0;
            let soundIndex = 255;
            if (typeof soundId === 'string') {
                const directIndex = soundNameToIndex?.[soundId];
                const lowerIndex = soundNameToIndex?.[soundId.toLowerCase()];
                if (directIndex !== undefined) {
                    soundIndex = directIndex;
                } else if (lowerIndex !== undefined) {
                    soundIndex = lowerIndex;
                }
            } else {
                const parsedIndex = parseInt(serializeValue(soundId), 10);
                if (!isNaN(parsedIndex)) {
                    soundIndex = parsedIndex;
                }
            }
            bytes += `    DB ${soundIndex}        ; sound: ${soundId}\n`;
            break;
        }

        case ActionTypes.PLAY_MUSIC: {
            const trackId = action.params.trackId ?? action.params.musicId ?? action.params.music ?? 0;
            const loopFlag = action.params.loop ?? true;
            const trackIndex = resolveTrackIndex(trackId, trackIndexByAssetId);
            const warning = trackIndex === 0xFF && trackId !== 0 && trackId !== '0'
                ? `        ; WARNING: unresolved/non-PSG track ${trackId}`
                : '';
            bytes += `    DB ${trackIndex}, ${serializeValue(loopFlag)}        ; track: ${trackId}${warning}\n`;
            break;
        }

        case ActionTypes.SET_VARIABLE:
        case ActionTypes.INCREMENT_VARIABLE:
        case ActionTypes.DECREMENT_VARIABLE: {
            // Get variable name from params
            const variableName = action.params.variable || action.params.variableName || action.params.name;
            // Look up variable ID in map
            const varId = variableIdMap?.[variableName] ?? 0;
            const value = action.params.value ?? action.params.amount ?? 0;
            bytes += `    DB ${varId}, ${serializeValue(value)}        ; ${variableName} (ID ${varId})\n`;
            break;
        }

        case ActionTypes.WAIT:
            bytes += `    DB ${serializeValue(action.params.duration)} \n`;
            break;

        case ActionTypes.GOTO_STATE:
            if (smName && action.params.stateId) {
                const targetLabel = `SM_${smName.replace(/[^a-zA-Z0-9]/g, '_')}_${action.params.stateId.replace(/[^a-zA-Z0-9]/g, '_')} `;
                bytes += `    DW ${targetLabel} \n`;
            } else {
                bytes += `    DW 0; Invalid GOTO target\n`;
            }
            break;

        case ActionTypes.SPAWN_ENTITY: {
            const templateRaw = action.params.templateId ?? action.params.entityTemplateId ?? action.params.entityId ?? 0;
            const templateToken = typeof templateRaw === 'string'
                ? (templateTokenMap?.[templateRaw] ?? templateTokenMap?.[templateRaw.toLowerCase()] ?? 0)
                : parseInt(serializeValue(templateRaw), 10) || 0;
            const xRaw = action.params.x ?? 0;
            const yRaw = action.params.y ?? 0;
            bytes += `    DB ${templateToken}, ${serializeValue(xRaw)}, ${serializeValue(yRaw)}        ; template=${templateRaw}=>${templateToken}\n`;
            break;
        }

        case ActionTypes.DESTROY_ENTITY: {
            const target = action.params?.target || 'self';
            const targetId = target === 'other' ? 1 : 0;
            bytes += `    DB ${targetId}          ; Target: ${target}\n`;
            break;
        }

        case ActionTypes.GET_RANDOM_ENTITY_POSITION: {
            const templateRaw = action.params.templateId ?? action.params.entityTemplateId ?? 0;
            const templateToken = typeof templateRaw === 'string'
                ? (templateTokenMap?.[templateRaw] ?? templateTokenMap?.[templateRaw.toLowerCase()] ?? 0)
                : parseInt(serializeValue(templateRaw), 10) || 0;
            const targetVarXName = action.params.targetVariableX ?? action.params.variableX;
            const targetVarYName = action.params.targetVariableY ?? action.params.variableY;
            const targetVarXId = variableIdMap?.[targetVarXName] ?? 0;
            const targetVarYId = variableIdMap?.[targetVarYName] ?? 0;
            bytes += `    DB ${templateToken}, ${targetVarXId}, ${targetVarYId}        ; template=${templateRaw}, x->${targetVarXName}(${targetVarXId}), y->${targetVarYName}(${targetVarYId})\n`;
            break;
        }

        case ActionTypes.SET_COMPONENT_PROPERTY: {
            const compRaw = action.params.componentId ?? action.params.component ?? action.params.compId ?? 0;
            const propRaw = action.params.propertyName ?? action.params.prop ?? action.params.name ?? 0;
            const valueRaw = action.params.value ?? 0;
            const compId = resolveComponentId(compRaw);
            const propId = resolveComponentPropertyId(propRaw);

            let encodedValue = serializeValue(valueRaw);
            if (propId === 5 && typeof valueRaw === 'string' && spriteNameToIndex) {
                const direct = spriteNameToIndex[valueRaw];
                const lower = spriteNameToIndex[valueRaw.toLowerCase()];
                if (direct !== undefined) {
                    encodedValue = String(direct);
                } else if (lower !== undefined) {
                    encodedValue = String(lower);
                }
            }

            bytes += `    DB ${compId}, ${propId}, ${encodedValue}        ; comp=${compRaw}=>${compId}, prop=${propRaw}=>${propId}, value=${valueRaw}\n`;
            break;
        }

        case ActionTypes.CHANGE_GAME_FLOW_NODE: {
            const nodeRaw = action.params.nodeId ?? action.params.targetNodeId ?? 0;
            const nodeId = typeof nodeRaw === 'string' && nodeRaw.toUpperCase() === 'START'
                ? 255
                : serializeValue(nodeRaw);
            bytes += `    DB ${nodeId}        ; node=${nodeRaw}\n`;
            break;
        }

        case ActionTypes.BREAK_TILE: {
            const directionName = String(action.params.direction || 'up').toLowerCase();
            const directionId = TILE_DIRECTION_IDS[directionName] ?? 0;
            bytes += `    DB 0, ${directionId}        ; BREAK_TILE dir=${directionName}\n`;
            break;
        }

        case ActionTypes.REPLACE_TILE: {
            const directionName = String(action.params.direction || 'up').toLowerCase();
            const directionId = TILE_DIRECTION_IDS[directionName] ?? 0;
            const replacementRaw = action.params.replacementTileId ?? action.params.tileId ?? 0;
            const replacementTileChar = resolveTileCharCode(replacementRaw, tileIdToCharCode);
            bytes += `    DB ${replacementTileChar}, ${directionId}        ; REPLACE_TILE tile=${replacementRaw}=>${replacementTileChar}, dir=${directionName}\n`;
            break;
        }

        case ActionTypes.RND: {
            const variableName = action.params.variable ?? action.params.variableName ?? action.params.targetVariable ?? action.params.name;
            const varId = variableIdMap?.[variableName] ?? serializeValue(action.params.varId ?? 0);
            const dataType = serializeValue(action.params.dataType ?? action.params.type ?? 0);
            bytes += `    DB ${varId}, ${dataType}        ; RND var=${variableName ?? action.params.varId ?? 0}, type=${action.params.dataType ?? action.params.type ?? 0}\n`;
            break;
        }

        case ActionTypes.POINT_AT: {
            const x1 = serializeValue(action.params.x1 ?? 0);
            const y1 = serializeValue(action.params.y1 ?? 0);
            const x2 = serializeValue(action.params.x2 ?? 0);
            const y2 = serializeValue(action.params.y2 ?? 0);
            const speed = serializeValue(action.params.speed ?? 1);
            bytes += `    DB ${x1}, ${y1}, ${x2}, ${y2}, ${speed}\n`;
            break;
        }

        case ActionTypes.DECREASE_LIVES:
        case ActionTypes.INCREASE_LIVES: {
            const amount = action.params.amount ?? 1;
            bytes += `    DB ${serializeValue(amount)} \n`;
            break;
        }

        case ActionTypes.RESPAWN_PLAYER: {
            const x = action.params.x ?? 255;
            const y = action.params.y ?? 255;
            bytes += `    DB ${serializeValue(x)}, ${serializeValue(y)} \n`;
            break;
        }

        case ActionTypes.ADD_VARIABLES:
        case ActionTypes.SUBTRACT_VARIABLES:
        case ActionTypes.MULTIPLY_VARIABLES:
        case ActionTypes.DIVIDE_VARIABLES:
        case ActionTypes.MODULO_VARIABLES: {
            // Mathematical operations: DestVar = Src1 OP Src2
            // Params: destination, source1, source2 (variable names)
            const destName = action.params.destination || action.params.dest || action.params.result;
            const src1Name = action.params.source1 || action.params.src1 || action.params.operand1;
            const src2Name = action.params.source2 || action.params.src2 || action.params.operand2;

            const destId = variableIdMap?.[destName] ?? 0;
            const src1Id = variableIdMap?.[src1Name] ?? 0;
            const src2Id = variableIdMap?.[src2Name] ?? 0;

            const opName = action.type === ActionTypes.ADD_VARIABLES ? 'ADD' :
                action.type === ActionTypes.SUBTRACT_VARIABLES ? 'SUB' :
                    action.type === ActionTypes.MULTIPLY_VARIABLES ? 'MUL' :
                        action.type === ActionTypes.DIVIDE_VARIABLES ? 'DIV' : 'MOD';

            bytes += `    DB ${destId}, ${src1Id}, ${src2Id}        ; ${destName} = ${src1Name} ${opName} ${src2Name}\n`;
            break;
        }

        case ActionTypes.ASSIGN_VARIABLE: {
            // Assign variable: target = source
            // Supports UI params:
            // - targetVariable
            // - sourceType: 'constant' | 'variable'
            // - sourceValue (when constant)
            // - sourceVariable (when variable)
            const destName = action.params.targetVariable || action.params.destination || action.params.dest || action.params.result;
            const destId = variableIdMap?.[destName] ?? 0;

            const sourceType = action.params.sourceType || (action.params.sourceVariable ? 'variable' : 'constant');
            if (sourceType !== 'variable') {
                // Compile constant assign as SET_VARIABLE to preserve runtime semantics.
                const sourceValue = action.params.sourceValue ?? action.params.value ?? 0;
                const setVariableId = ACTION_IDS[ActionTypes.SET_VARIABLE];
                bytes = `    DB ${setVariableId}; ${ActionTypes.SET_VARIABLE} (from ${ActionTypes.ASSIGN_VARIABLE})\n`;
                bytes += `    DB ${destId}, ${serializeValue(sourceValue)}        ; ${destName} = ${sourceValue}\n`;
                break;
            }

            const srcName = action.params.sourceVariable || action.params.source || action.params.src || action.params.operand || action.params.source1;
            const srcId = variableIdMap?.[srcName] ?? 0;
            bytes += `    DB ${destId}, ${srcId}        ; ${destName} = ${srcName}\n`;
            break;
        }

        default:
            bytes += `    ; Params not implemented for ${action.type}\n`;
            break;
    }

    return bytes;
}

function generateConditionBytes(condition: Condition, variableIdMap?: Record<string, number>): string {
    const id = CONDITION_IDS[condition.type];
    if (!id) {
        console.warn(`[State Machine Generator] Unknown condition "${condition.type}". Falling back to NOP condition.`);
        return `    DB 0; FALLBACK NOP for unknown condition ${condition.type}\n`;
    }

    let bytes = `    DB ${id}; ${condition.type} \n`;

    switch (condition.type) {
        case ConditionTypes.KEY_PRESSED:
        case ConditionTypes.KEY_RELEASED: {
            const keyName = condition.params?.key?.toLowerCase();
            const keyId = KEY_IDS[keyName] ?? 0; // Default to 0 (center/no key) if unknown
            bytes += `    DB ${keyId}          ; Key: ${keyName || 'unknown'}\n`;
            break;
        }

        case ConditionTypes.TIME_OUT:
            bytes += `    DB ${serializeValue(condition.params?.duration)} \n`;
            break;

        case ConditionTypes.CAN_MOVE_DIRECTION: {
            const directionName = String(condition.params?.direction || '').toLowerCase();
            const directionId = DIRECTION_IDS[directionName] ?? 0;
            if (directionName && directionId === 0) {
                console.warn(`[State Machine Generator] Unknown direction "${directionName}" in CAN_MOVE_DIRECTION. Using 0 (no direction).`);
            }
            bytes += `    DB ${directionId}          ; Direction: ${directionName || 'none'}\n`;
            break;
        }

        case ConditionTypes.ON_WALL_COLLISION: {
            const directionName = String(condition.params?.direction || 'any').toLowerCase();
            const directionId = WALL_DIRECTION_IDS[directionName] ?? 0;
            if (!(directionName in WALL_DIRECTION_IDS)) {
                console.warn(`[State Machine Generator] Unknown direction "${directionName}" in ON_WALL_COLLISION. Using any.`);
            }
            bytes += `    DB ${directionId}          ; Wall direction: ${directionName}\n`;
            break;
        }

        case ConditionTypes.HAS_COLLISION: {
            const collisionType = String(condition.params?.collisionType || 'any').toLowerCase();
            let collisionId = COLLISION_TYPE_IDS[collisionType];

            if (collisionId === undefined) {
                console.warn(`[State Machine Generator] Unknown collisionType "${collisionType}" in HAS_COLLISION. Using any.`);
                collisionId = COLLISION_TYPE_IDS.any;
            }

            bytes += `    DB ${collisionId}          ; collisionType: ${collisionType}\n`;
            break;
        }

        case ConditionTypes.PATH_CLEAR: {
            const directionName = String(condition.params?.direction || '').toLowerCase();
            const directionId = DIRECTION_IDS[directionName] ?? 0;
            if (directionName && directionId === 0) {
                console.warn(`[State Machine Generator] Unknown direction "${directionName}" in PATH_CLEAR. Using auto-deduce (0).`);
            }
            bytes += `    DB ${directionId}          ; Direction (0=auto): ${directionName || 'auto'}\n`;
            break;
        }

        case ConditionTypes.ANIMATION_COMPLETE:
            // No params. Runtime checks/consumes ANIM_FLAG_COMPLETED.
            break;

        case ConditionTypes.KEY_AND_MOVEMENT: {
            const keyName = String(condition.params?.key || '').toLowerCase();
            const keyId = KEY_IDS[keyName] ?? 0;

            const directionName = String(condition.params?.direction || '').toLowerCase();
            let directionId = DIRECTION_IDS[directionName] ?? 0;

            if (!directionName && keyId !== 9) {
                // If movement key is directional and no explicit direction was provided, use same direction
                directionId = keyId;
            }

            if (directionName && directionId === 0) {
                console.warn(`[State Machine Generator] Unknown direction "${directionName}" in KEY_AND_MOVEMENT. Using 0.`);
            }

            bytes += `    DB ${keyId}, ${directionId}          ; key=${keyName || 'unknown'}, dir=${directionName || 'auto'}\n`;
            break;
        }

        case ConditionTypes.AND:
        case ConditionTypes.OR:
        case ConditionTypes.XOR:
            if (condition.conditions) {
                bytes += `    DB ${condition.conditions.length} \n`;
                for (const sub of condition.conditions) {
                    bytes += generateConditionBytes(sub, variableIdMap);
                }
            } else {
                bytes += `    DB 0\n`;
            }
            break;

        case ConditionTypes.NOT:
            if (condition.conditions && condition.conditions.length > 0) {
                bytes += `    DB 1 \n`;
                bytes += generateConditionBytes(condition.conditions[0], variableIdMap);
            } else {
                bytes += `    DB 1 \n`;
                bytes += `    DB 0; Fallback NOP subcondition for NOT\n`;
            }
            break;

        case ConditionTypes.VARIABLE_COMPARE: {
            // Get variable name with proper fallback
            const variableName = condition.params?.variable || 'x';
            const varId = variableIdMap?.[variableName];

            // If variable is not in the map, log warning and use fallback
            if (varId === undefined) {
                console.warn(`[State Machine Generator] Unknown variable "${variableName}" in VARIABLE_COMPARE. Using x (ID 0) as fallback.`);
                // Use variable ID 0 (x position) as fallback
                bytes += `    DB 0, ${OPERATOR_IDS[condition.params?.operator || '=='] || 0}, ${serializeValue(condition.params?.value || 0)}; FALLBACK: unknown var "${variableName}" -> x ${condition.params?.operator || '=='} ${condition.params?.value || 0}\n`;
            } else {
                const opId = OPERATOR_IDS[condition.params?.operator || '=='] || 0;
                const value = condition.params?.value || 0;
                bytes += `    DB ${varId}, ${opId}, ${serializeValue(value)}; ${variableName} (ID ${varId}) ${condition.params?.operator || '=='} ${value}\n`;
            }
            break;
        }

        default:
            break;
    }

    return bytes;
}
