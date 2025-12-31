; ==================================================================
; GAMEFLOW EXECUTION ENGINE
; File: gameflow.asm
; Description: GameFlow-based game orchestration system
; ==================================================================
;
; GameFlow: main
; Total Nodes: 2
; Total Connections: 1
; Start Node: gf_start_1757846301679
;
; ARCHITECTURE:
; - GameFlow is the SOLE execution orchestrator
; - Each node generates its own execution code
; - Connections between nodes define the complete flow
; - No hardcoded main_loop outside GameFlow
; ==================================================================

; ==================================================================
; GAMEFLOW INITIALIZATION
; ==================================================================

gameflow_init:
    ; Initialize GameFlow system
    ; Reset state
    xor a
    ld (gameflow_exit_requested), a
    ld (current_flow_state), a
    ret

; Main entry point - called from init_rom
; This is where the game STARTS
gameflow_start:
    ; Load the Start node
    ld hl, gameflow_node_gf_start_1757846301679
    jp gameflow_execute_node

; ==================================================================
; CORE EXECUTION ENGINE
; ==================================================================

; Execute a GameFlow node
; Input: HL = address of node structure
; 
; Node Structure:
;   +0: Node type (byte)
;   +1-2: Data pointer (word) - node-specific data
;   +3-4: Connection table pointer (word)
;
gameflow_execute_node:
    ; Read node type
    ld a, (hl)
    inc hl
    
    ; Save data pointer and connection table pointer for handlers
    ld e, (hl)
    inc hl
    ld d, (hl)      ; DE = data pointer
    inc hl
    ld c, (hl)
    inc hl
    ld b, (hl)      ; BC = connection table pointer
    
    ; DE = node data, BC = connection table
    ; Dispatch based on node type
    cp NODE_TYPE_START
    jp z, gameflow_handle_start
    cp NODE_TYPE_WORLD_LINK
    jp z, gameflow_handle_worldlink
    
    ; Unknown node type - error
    ret

; ==================================================================
; NODE TYPE HANDLERS
; Each handler receives:
;   DE = node data pointer
;   BC = connection table pointer
; ==================================================================

gameflow_handle_start:
    ; Start node - simply transition to next node
    ; BC = connection table
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z           ; No connection
    jp gameflow_execute_node

gameflow_handle_worldlink:
    ; WorldLink node - load world and enter game loop
    ; DE = world data pointer (contains load_world_X routine address)
    ; BC = connection table (for exit)
    
    push bc         ; Save connection table
    
    ; Load the world
    ; DE points to: dw load_world_X
    ex de, hl
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a         ; HL = load_world_X address
    
    ; Call the load routine
    ld de, .after_load
    push de
    jp (hl)          ; Indirect call, returns to .after_load
    
.after_load:
    ; Set game state
    ld a, FLOW_STATE_GAME
    ld (current_flow_state), a
    
    ; Update sprites
    call update_sprites_to_vram
    
    ; Enter game loop
    call gameflow_world_game_loop
    
    ; Exited loop - continue to next node
    pop bc          ; Restore connection table
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

; ==================================================================
; CONNECTION UTILITIES
; ==================================================================

; Get next node from connection table (for simple single-connection nodes)
; Input: BC = connection table pointer
; Output: HL = next node address (or 0 if none)
gameflow_get_default_connection:
    ; Connection table format:
    ;   db CONNECTION_TYPE
    ;   dw NODE_ADDRESS
    ;   db CONNECTION_END
    
    ld h, b
    ld l, c
    ld a, (hl)
    cp CONNECTION_END
    jr z, .no_connection
    
    inc hl
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a         ; HL = next node address
    ret

.no_connection:
    ld hl, 0
    ret

; Get connection by type
; Input: BC = connection table pointer, A = connection type to find
; Output: HL = next node address (or 0 if not found)
gameflow_get_connection_by_type:
    ld d, a         ; Save connection type
    ld h, b
    ld l, c

.search_loop:
    ld a, (hl)
    cp CONNECTION_END
    jr z, .not_found

    cp d
    jr z, .found

    ; OPTIMIZED: Skip this entry using ADD (11 cycles vs 3× INC = 18 cycles)
    ld bc, 3        ; Entry size: 1 byte type + 2 bytes address
    add hl, bc
    jr .search_loop

.found:
    inc hl
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ret

.not_found:
    ld hl, 0
    ret

; Connection type constants
CONNECTION_DEFAULT      EQU 0
CONNECTION_THEN         EQU 1
CONNECTION_ELSE         EQU 2
CONNECTION_OPTION_0     EQU 10
CONNECTION_OPTION_1     EQU 11
CONNECTION_OPTION_2     EQU 12
CONNECTION_OPTION_3     EQU 13
CONNECTION_OPTION_4     EQU 14
CONNECTION_OPTION_5     EQU 15
CONNECTION_END          EQU 255

; ==================================================================
; GAME LOOP (WorldLink nodes only)
; ==================================================================

; Main game loop - executed by WorldLink nodes
; This loop runs while a world/level is active
gameflow_world_game_loop:
    ; Check exit flag
    ld a, (gameflow_exit_requested)
    or a
    ret nz

    ; Update all entities
    call update_all_entities
    
    ; Execute all state machines
    call execute_all_state_machines
    
    ; Update sprites to VRAM
    call update_sprites_to_vram
    
    ; Wait for V-Blank (from H.TIMI hook)
    call wait_vblank
    
    ; Loop
    jp gameflow_world_game_loop

; ==================================================================
; NODE DATA STRUCTURES
; Each node has: type byte, data pointer, connection table pointer
; ==================================================================

; Node: Start - "gf_start_1757846301679"
gameflow_node_gf_start_1757846301679:
    db NODE_TYPE_START
    dw gameflow_node_gf_start_1757846301679_data
    dw gameflow_node_gf_start_1757846301679_conn

gameflow_node_gf_start_1757846301679_data:
    ; No additional data

gameflow_node_gf_start_1757846301679_conn:
    db CONNECTION_DEFAULT
    dw gameflow_node_gfn_1757846312799
    db CONNECTION_END

; Node: WorldLink - "gfn_1757846312799"
gameflow_node_gfn_1757846312799:
    db NODE_TYPE_WORLD_LINK
    dw gameflow_node_gfn_1757846312799_data
    dw gameflow_node_gfn_1757846312799_conn

gameflow_node_gfn_1757846312799_data:
    dw load_world_worldmap_1757846280079

gameflow_node_gfn_1757846312799_conn:
    db CONNECTION_DEFAULT
    dw 0
    db CONNECTION_END


; ==================================================================
; GAMEFLOW VARIABLES
; ==================================================================

gameflow_exit_requested:    db 0    ; Flag to exit current game loop
gameflow_menu_selection:    db 0    ; Last menu selection
gameflow_condition_result:  db 0    ; Result of last condition evaluation

; ==================================================================
; END OF GAMEFLOW
; ==================================================================
