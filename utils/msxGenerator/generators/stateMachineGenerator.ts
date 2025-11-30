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
    'x': 0,   // entity_x_pos
    'y': 1,   // entity_y_pos
    'vx': 2,  // entity_vel_x
    'vy': 3,  // entity_vel_y
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

    ; Perform State Change
    ld a, b; A = Entity Index
    call SM_ChangeState

    scf             ; Set carry(transition occurred)
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
    ld e, (hl); E = X
    inc hl
    ld d, (hl); D = Y
    inc hl
    
    push hl; Save Params Ptr
    
    ld c, b; C = Entity Index
    ld b, 0; BC = Entity Index
    
    ld hl, entity_x_pos
    add hl, bc
    ld (hl), e          ; Set X
    
    ld hl, entity_y_pos
    add hl, bc
    inc hl
    ld d, (hl); D = VY
    inc hl
    
    push hl; Save Params Ptr
    
    ld c, b; C = Entity Index
    ld b, 0; BC = Entity Index
    
    ld hl, entity_vel_x
    add hl, bc
    ld (hl), e          ; Set VX
    
    ld hl, entity_vel_y
    add hl, bc
    ld (hl), d          ; Set VY
    
    pop hl          ; Restore Params Ptr
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
    ld a, (hl); A = VarID
    inc hl
    ld c, (hl); C = Value
    inc hl
    
    push hl; Save Params Ptr

    ; Calculate Address: entity_sm_var_0 + (VarID * 32) + EntityIndex
    ld l, a
    ld h, 0
    add hl, hl; * 2
    add hl, hl; * 4
    add hl, hl; * 8
    add hl, hl; * 16
    add hl, hl; * 32
    
    ld de, entity_sm_var_0
    add hl, de
    
    ld e, b; E = Entity Index
    ld d, 0
    add hl, de

    ld (hl), c          ; Store Value
    
    pop hl          ; Restore Params Ptr
    ret

Action_IncVariable:
; Params: VarID(1 byte), Amount(1 byte)
    ld a, (hl); A = VarID
    inc hl
    ld c, (hl); C = Amount
    inc hl
    
    push hl; Save Params Ptr

    ; Calculate Address
    ld l, a
    ld h, 0
    add hl, hl; * 32
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    
    ld de, entity_sm_var_0
    add hl, de
    
    ld e, b; E = Entity Index
    ld d, 0
    add hl, de
    
    ld a, (hl)          ; Get current value
    add a, c            ; Add amount
    ld (hl), a          ; Store new value
    
    pop hl
    ret

Action_DecVariable:
; Params: VarID(1 byte), Amount(1 byte)
    ld a, (hl); A = VarID
    inc hl
    ld c, (hl); C = Amount
    inc hl
    
    push hl; Save Params Ptr

    ; Calculate Address
    ld l, a
    ld h, 0
    add hl, hl; * 32
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    
    ld de, entity_sm_var_0
    add hl, de
    
    ld e, b; E = Entity Index
    ld d, 0
    add hl, de
    
    ld a, (hl)          ; Get current value
    sub c               ; Subtract amount
    ld (hl), a          ; Store new value
    
    pop hl
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
; Params: None
    push hl; Save Params Ptr
    
    ld c, b; C = Entity Index
    ld b, 0; BC = Entity Index
    
    ld hl, entity_comp_masks
    add hl, bc
    ld (hl), 0          ; Clear mask(deactivate)
    
    pop hl          ; Restore Params Ptr
    ret

Action_SpawnEntity:
; Params: EntityID(1 byte), X(1 byte), Y(1 byte)
    inc hl
    inc hl
    inc hl
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
    ; TODO: Implement key press check
    inc hl                  ; Skip key param
    ld a, 1
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
    ; TODO: Implement deadly tile check
    ld a, 1
    ret

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
    
    ld a, (hl)              ; A = Variable ID
    inc hl
    ld c, (hl)              ; C = Operator ID
    inc hl
    ld d, (hl)              ; D = Compare Value
    inc hl
    
    push hl                 ; Save updated params ptr
    push bc                 ; Save Operator and Entity Index
    push de                 ; Save Compare Value
    
    ; Get variable value based on Variable ID
    ; A = Variable ID (0=x, 1=y, 2=vx, 3=vy)
    ; B = Entity Index
    
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
    
    ; Invalid variable ID, return false
    pop de
    pop bc
    pop hl
    ld a, 0
    ret

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
export function generateStateMachineSystem(stateMachines: StateMachine[]): string {
    let asm = Z80_RUNTIME_ENGINE + '\n' + Z80_DISPATCH_TABLE + '\n\n';

    asm += '; ==================================================================\n';
    asm += '; STATE MACHINE DATA\n';
    asm += '; ==================================================================\n\n';

    for (const sm of stateMachines) {
        asm += generateStateMachineData(sm);
    }

    return asm;
}

function generateStateMachineData(sm: StateMachine): string {
    let asm = `; State Machine: ${sm.name} (${sm.id}) \n`;
    const safeName = sm.name.replace(/[^a-zA-Z0-9]/g, '_');

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
        // Check if there are transitions from this state
        const transitions = sm.transitions.filter(t => t.fromStateId === state.id);
        asm += `    DW ${transitions.length > 0 ? transitionsLabel : 0} \n`;

        // Actions Data
        if (state.onEnter && state.onEnter.length > 0) {
            asm += `${onEnterLabel}: \n`;
            for (const action of state.onEnter) {
                asm += generateActionBytes(action, sm.name);
            }
            asm += `    DB 0xFF; END\n`;
        }

        if (state.onExit && state.onExit.length > 0) {
            asm += `${onExitLabel}: \n`;
            for (const action of state.onExit) {
                asm += generateActionBytes(action, sm.name);
            }
            asm += `    DB 0xFF; END\n`;
        }

        // Transitions Data
        if (transitions.length > 0) {
            asm += `${transitionsLabel}: \n`;
            asm += `    DB ${transitions.length}; Count\n`;
            for (const t of transitions) {
                const targetStateLabel = `SM_${safeName}_${t.toStateId.replace(/[^a-zA-Z0-9]/g, '_')}`;
                if (t.conditions) {
                    asm += generateConditionBytes(t.conditions);
                } else {
                    asm += `    DB 0; Empty Condition(Always True) \n`;
                }
                asm += `    DW ${targetStateLabel} \n`;
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
        return '0';
    }
    return '0';
}

function generateActionBytes(action: Action, smName: string = ''): string {
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
        case ActionTypes.DECREMENT_VARIABLE:
            bytes += `    DB ${serializeValue(action.params.variableId)}, ${serializeValue(action.params.value)} \n`;
            break;

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

        case ActionTypes.DESTROY_ENTITY:
            bytes += `    DB 0\n`;
            break;

        default:
            bytes += `    ; Params not implemented for ${action.type}\n`;
            break;
    }

    return bytes;
}

function generateConditionBytes(condition: Condition): string {
    const id = CONDITION_IDS[condition.type];
    if (!id) return `; Unknown Condition: ${condition.type} \n`;

    let bytes = `    DB ${id}; ${condition.type} \n`;

    switch (condition.type) {
        case ConditionTypes.KEY_PRESSED:
        case ConditionTypes.KEY_RELEASED:
            bytes += `    DB ${serializeValue(condition.params?.key)}; Key Code\n`;
            break;

        case ConditionTypes.TIME_OUT:
            bytes += `    DB ${serializeValue(condition.params?.duration)} \n`;
            break;

        case ConditionTypes.AND:
        case ConditionTypes.OR:
            if (condition.conditions) {
                bytes += `    DB ${condition.conditions.length} \n`;
                for (const sub of condition.conditions) {
                    bytes += generateConditionBytes(sub);
                }
            } else {
                bytes += `    DB 0\n`;
            }
            break;

        case ConditionTypes.VARIABLE_COMPARE:
            const varId = VARIABLE_IDS[condition.params?.variable || 'x'] || 0;
            const opId = OPERATOR_IDS[condition.params?.operator || '=='] || 0;
            const value = condition.params?.value || 0;
            bytes += `    DB ${varId}, ${opId}, ${value}; ${condition.params?.variable} ${condition.params?.operator} ${value}\n`;
            break;

        default:
            break;
    }

    return bytes;
}
