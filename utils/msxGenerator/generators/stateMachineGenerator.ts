/**
 * @fileoverview State Machine Generator - Generates Z80 assembly for State Machines
 * Includes the runtime engine and data serialization logic.
 */

import { StateMachine, StateMachineState, Action, Condition, ActionTypes, ConditionTypes } from '../../../statemachine.types';
import { ProjectAsset } from '../../../types';

// =============================================================================
// CONSTANTS & MAPPINGS
// =============================================================================

const ACTION_IDS: Record<string, number> = {
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
};

// Variable IDs for VARIABLE_COMPARE condition
const VARIABLE_IDS: Record<string, number> = {
    'x': 0,         // entity_x_pos
    'y': 1,         // entity_y_pos
    'vx': 2,        // entity_vel_x
    'vy': 3,        // entity_vel_y
    'isOnGround': 4,  // entity_on_ground (bit 0)
    'health': 5,    // entity_health_current
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
    'up': 1,      // Up direction
    'down': 5,    // Down direction
    'left': 7,    // Left direction
    'right': 3,   // Right direction
    'fire': 9,    // Fire button (special check)
};

/**
 * Build complete variable ID map including global variables
 * @param globalVariables - Array of global variables from project
 * @returns Complete mapping of variable names to IDs
 */
function buildVariableIdMap(globalVariables?: any[]): Record<string, number> {
    const map: Record<string, number> = { ...VARIABLE_IDS };

    // Add global variables starting from ID 6
    if (globalVariables && globalVariables.length > 0) {
        globalVariables.forEach((variable, index) => {
            const varId = 6 + index;
            map[variable.name] = varId;
            // Also map by asmName for flexibility
            if (variable.asmName) {
                map[variable.asmName] = varId;
            }
        });
    }

    return map;
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
    push ix
    
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
    push hl             ; Save State Data Ptr
    ld bc, 5
    add hl, bc
    ld e, (hl)
    inc hl
    ld d, (hl)
    ; DE = Transitions List Ptr

    ; Restore State Data Ptr
    pop hl

    ; Get Entity Index from stack
    ; Stack: IX, HL, DE, BC, AF (pushed at start)
    ; SP + 0=IX, SP + 2=HL, SP + 4=DE, SP + 6=BC, SP + 8=AF
    ; A is at SP + 9
    ld ix, 0
    add ix, sp
    ld a, (ix + 9)      ; A = Entity Index
    
    call SM_CheckTransitions

    ; If Carry set, transition happened, stop update
    jp c, sm_update_done

    ; 4. Execute OnUpdate Actions (Optional)

sm_update_done:
    pop ix
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

    ; Condition False: Skip Target State Ptr and continue to next transition
    inc hl
    inc hl
    
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
    ld a, d
    or e
    ret z; Null pointer
    
    ex de, hl; HL = Action List

    ; We need Entity Index.It was passed in A ?
    ; Wait, SM_ChangeState called us.
    ; In SM_ChangeState:
;   pop af(Entity Index)
    ;   call SM_ExecuteActions
    ; So A has Entity Index.
    
    ld b, a; B = Entity Index

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


Action_ChangeSprite:
; Params: Sprite ID(1 byte)
    ld e, (hl); E = Sprite ID
    inc hl
    
    push hl; Save Params Ptr
    
    ld c, b; C = Entity Index
    ld b, 0; BC = Entity Index
    
    ld hl, sprite_pattern
    add hl, bc
    ld (hl), e          ; Set Sprite Pattern
    
    pop hl          ; Restore Params Ptr
    ret

Action_PlayAnimation:
; Params: Animation Name(1 byte - ID ?)
    ; TODO: Implement Animation System
    inc hl
    ret

Action_SetAnimSpeed:
; Params: Speed(1 byte)
    inc hl
    ret

Action_ToggleAnim:
; Params: Playing(1 byte)
    inc hl
    ret

Action_PlaySound:
; Params: Sound ID(1 byte)
    ld a, (hl)
    inc hl
    ; TODO: Call Sound Driver
    ; call AFX_PLAY
    ret

Action_PlayMusic:
; Params: Music ID(1 byte)
    ld a, (hl)
    inc hl
    ; TODO: Call Music Driver
    ; call PT3_INIT
    ret

Action_MuteMusic:
; No params
    ; call PT3_MUTE
    ret

Action_StopMusic:
; No params
    ; call PT3_STOP
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
    inc hl
    inc hl
    ld d, (hl)
    inc hl
    
    push hl; Save Params Ptr
    
    ld a, b; A = Entity Index
    call SM_ChangeState
    
    pop hl          ; Restore Params Ptr
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
    ; TODO: Destroy entity we last collided with
    ; Requires entity_last_collision variable to be implemented
    ; For now, do nothing
    pop hl
    ret

.destroy_self:
    ld c, b             ; C = Entity Index
    ld b, 0             ; BC = Entity Index

    ; Clear component mask (deactivates entity)
    ld hl, entity_comp_masks
    add hl, bc
    ld (hl), 0          ; Clear low byte

    ld hl, entity_comp_masks_hi
    add hl, bc
    ld (hl), 0          ; Clear high byte

    ; Clear position to move off-screen
    ld hl, entity_x_pos
    add hl, bc
    ld (hl), 255        ; X = off-screen

    ld hl, entity_y_pos
    add hl, bc
    ld (hl), 212        ; Y = below screen (192 + 20)

    pop hl              ; Restore Params Ptr
    ret

Action_SpawnEntity:
; Params: TemplateID(1 byte), X(1 byte), Y(1 byte)
; Spawns a new entity at specified position
; TODO: Full template-based spawning with component copying
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

    ; TODO: Copy template data (velocity, sprite pattern, etc.)
    ; For now, entity is spawned with basic components only

    pop bc
    pop de
    pop hl
    pop hl              ; Restore Params Ptr
    ret

Action_GetRandomPos:
    ret

Action_ChangeGameFlow:
    inc hl
    ret

Action_DecLives:
    ret

Action_IncLives:
    ret

Action_Respawn:
    ret

Action_BreakTile:
    inc hl
    inc hl
    ret

Action_ReplaceTile:
; Params: TileID(1 byte), Direction(1 byte)
    inc hl
    inc hl
    ret

Action_Rnd:
; Params: VarID(1 byte), DataType(1 byte)
    inc hl
    inc hl
    ret

Action_PointAt:
; Params: X1, Y1, X2, Y2, Speed (5 bytes)
    inc hl
    inc hl
    inc hl
    inc hl
    inc hl
    ret

Action_AddVars:
; Params: DestVar, Src1, Src2 (3 bytes)
    inc hl
    inc hl
    inc hl
    ret

Action_SubVars:
; Params: DestVar, Src1, Src2 (3 bytes)
    inc hl
    inc hl
    inc hl
    ret

Action_MulVars:
; Params: DestVar, Src1, Src2 (3 bytes)
    inc hl
    inc hl
    inc hl
    ret

Action_DivVars:
; Params: DestVar, Src1, Src2 (3 bytes)
    inc hl
    inc hl
    inc hl
    ret

Action_ModVars:
; Params: DestVar, Src1, Src2 (3 bytes)
    inc hl
    inc hl
    inc hl
    ret


Action_AssignVar:
    inc hl
    inc hl
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

    ; ------------------------------------------------------------------
    ; CONDITION HANDLERS IMPLEMENTATION
    ; ------------------------------------------------------------------

Condition_Nop:
    ld a, 1                 ; Always true
    ret

Condition_And:
    ; TODO: Implement AND logic
    ld a, 1
    ret

Condition_Or:
    ; TODO: Implement OR logic
    ld a, 1
    ret

Condition_Not:
    ; TODO: Implement NOT logic
    ld a, 1
    ret

Condition_KeyPressed:
    ; Check if specified key/direction is currently pressed
    ; Input: B = Entity Index, HL = Params Ptr
    ; Params: Key ID (1 byte) - 1=Up, 5=Down, 7=Left, 3=Right, 9=Fire
    ; Output: A = 1 (pressed) or 0 (not pressed), HL = Updated Ptr
    ; Destroys: AF, DE

    ld a, (hl)              ; A = Key ID
    inc hl                  ; Move past param

    cp 9                    ; Check if fire button
    jr z, .check_fire

    ; For directional keys, check if direction is active
    ld d, a                 ; D = Desired key ID
    ld a, (input_state)     ; A = Current direction (0-8)

    ; Simple direction check: match exact direction or diagonals
    cp d                    ; Check exact match
    jr z, .key_pressed

    ; Check for diagonal combinations
    ; If desired key is UP (1), also check UP+RIGHT (2) and UP+LEFT (8)
    ld a, d
    cp 1                    ; Desired = UP?
    jr nz, .check_down
    ld a, (input_state)
    cp 2                    ; UP+RIGHT?
    jr z, .key_pressed
    cp 8                    ; UP+LEFT?
    jr z, .key_pressed
    jr .key_not_pressed

.check_down:
    ld a, d
    cp 5                    ; Desired = DOWN?
    jr nz, .check_left
    ld a, (input_state)
    cp 4                    ; DOWN+RIGHT?
    jr z, .key_pressed
    cp 6                    ; DOWN+LEFT?
    jr z, .key_pressed
    jr .key_not_pressed

.check_left:
    ld a, d
    cp 7                    ; Desired = LEFT?
    jr nz, .check_right
    ld a, (input_state)
    cp 6                    ; DOWN+LEFT?
    jr z, .key_pressed
    cp 8                    ; UP+LEFT?
    jr z, .key_pressed
    jr .key_not_pressed

.check_right:
    ld a, d
    cp 3                    ; Desired = RIGHT?
    jr nz, .key_not_pressed
    ld a, (input_state)
    cp 2                    ; UP+RIGHT?
    jr z, .key_pressed
    cp 4                    ; DOWN+RIGHT?
    jr z, .key_pressed
    jr .key_not_pressed

.check_fire:
    ; Fire button check - TODO: Requires input_fire flag or GTTRIG check
    ; For now, return false (fire not implemented yet)
    ld a, 0
    ret

.key_pressed:
    ld a, 1
    ret

.key_not_pressed:
    ld a, 0
    ret

Condition_KeyReleased:
    ; TODO: Implement key release check
    inc hl                  ; Skip key param
    ld a, 1
    ret

Condition_TimeOut:
    ; TODO: Implement timeout check
    ld a, 1
    ret

Condition_CanMove:
    ; TODO: Implement movement check
    inc hl                  ; Skip direction param
    ld a, 1
    ret

Condition_HasCollision:
    ; TODO: Implement collision check
    ld a, 1
    ret

Condition_PathClear:
    ; TODO: Implement path clear check
    ld a, 1
    ret

Condition_OnWallCollision:
    ; TODO: Implement wall collision check
    inc hl                  ; Skip direction param
    ld a, 1
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
    ; TODO: Implement animation complete check
    ld a, 1
    ret

Condition_KeyAndMove:
    ; TODO: Implement key and movement check
    ld a, 1
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

.get_health:
    ld hl, entity_health_current
    add hl, bc
    ld e, (hl)              ; E = current health
    ; Fall through to .do_compare

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

// =============================================================================
// GENERATOR FUNCTIONS
// =============================================================================

/**
 * Generates the complete ASM file content for the State Machine system
 */
export function generateStateMachineSystem(stateMachines: StateMachine[], globalVariables?: any[]): string {
    let asm = Z80_RUNTIME_ENGINE + '\n' + Z80_DISPATCH_TABLE + '\n\n';

    // Generate global variables table
    if (globalVariables && globalVariables.length > 0) {
        asm += '; ==================================================================\n';
        asm += '; GLOBAL VARIABLES TABLE\n';
        asm += '; ==================================================================\n';
        asm += '; Maps variable IDs (6+) to their RAM addresses\n';
        asm += 'SM_GlobalVarTable:\n';

        globalVariables.forEach((variable, index) => {
            const varId = 6 + index; // Start from ID 6 (0-5 are entity variables)
            asm += `    DW ${variable.asmName}            ; ID ${varId}: ${variable.name}\n`;
        });
        asm += '\n';
    }

    asm += '; ==================================================================\n';
    asm += '; STATE MACHINE DATA\n';
    asm += '; ==================================================================\n\n';

    // Build variable ID map for serialization
    const variableIdMap = buildVariableIdMap(globalVariables);

    for (const sm of stateMachines) {
        asm += generateStateMachineData(sm, variableIdMap);
    }

    return asm;
}

function generateStateMachineData(sm: StateMachine, variableIdMap: Record<string, number>): string {
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
        // Include transitions that start from this state or from the special "Any" state
        const transitions = sm.transitions.filter(t =>
            t.fromStateId === state.id || isAnyStateId(t.fromStateId)
        );
        asm += `    DW ${transitions.length > 0 ? transitionsLabel : 0} \n`;

        // Actions Data
        if (state.onEnter && state.onEnter.length > 0) {
            asm += `${onEnterLabel}: \n`;
            for (const action of state.onEnter) {
                asm += generateActionBytes(action, sm.name, variableIdMap);
            }
            asm += `    DB 0xFF; END\n`;
        }

        if (state.onExit && state.onExit.length > 0) {
            asm += `${onExitLabel}: \n`;
            for (const action of state.onExit) {
                asm += generateActionBytes(action, sm.name, variableIdMap);
            }
            asm += `    DB 0xFF; END\n`;
        }

        // Transitions Data
        if (transitions.length > 0) {
            asm += `${transitionsLabel}: \n`;
            asm += `    DB ${transitions.length}; Count\n`;
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
                    asm += `${actionLabel}: \n`;
                    for (const action of t.actions || []) {
                        asm += generateActionBytes(action, sm.name, variableIdMap);
                    }
                    asm += `    DB 0xFF; END\n`;
                }
            });
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

function generateActionBytes(action: Action, smName: string = '', variableIdMap?: Record<string, number>): string {
    const id = ACTION_IDS[action.type];
    if (!id) return `; Unknown Action: ${action.type} \n`;

    let bytes = `    DB ${id}; ${action.type} \n`;

    switch (action.type) {
        case ActionTypes.SET_POSITION:
        case ActionTypes.MOVE_BY:
        case ActionTypes.SET_VELOCITY:
        case ActionTypes.APPLY_FORCE:
            bytes += `    DB ${serializeValue(action.params.x)}, ${serializeValue(action.params.y)} \n`;
            break;

        case ActionTypes.CHANGE_SPRITE:
            bytes += `    DB ${serializeValue(action.params.spriteId)} \n`;
            break;

        case ActionTypes.PLAY_ANIMATION:
            bytes += `    DB ${serializeValue(action.params.animationName)} \n`;
            break;

        case ActionTypes.SET_ANIMATION_SPEED:
            bytes += `    DB ${serializeValue(action.params.speed)} \n`;
            break;

        case ActionTypes.TOGGLE_ANIMATION:
            bytes += `    DB ${serializeValue(action.params.playing)} \n`;
            break;

        case ActionTypes.PLAY_SOUND:
            bytes += `    DB ${serializeValue(action.params.soundId)} \n`;
            break;

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

        case ActionTypes.SPAWN_ENTITY:
            bytes += `    DB ${serializeValue(action.params.entityId)}, ${serializeValue(action.params.x)}, ${serializeValue(action.params.y)} \n`;
            break;

        case ActionTypes.DESTROY_ENTITY: {
            const target = action.params?.target || 'self';
            const targetId = target === 'other' ? 1 : 0;
            bytes += `    DB ${targetId}          ; Target: ${target}\n`;
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
    if (!id) return `; Unknown Condition: ${condition.type} \n`;

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

        case ConditionTypes.AND:
        case ConditionTypes.OR:
            if (condition.conditions) {
                bytes += `    DB ${condition.conditions.length} \n`;
                for (const sub of condition.conditions) {
                    bytes += generateConditionBytes(sub, variableIdMap);
                }
            } else {
                bytes += `    DB 0\n`;
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
