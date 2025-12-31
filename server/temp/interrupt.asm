; ==================================================================
; INTERRUPT TASK SYSTEM - File: interrupt.asm
; Konami-style technique: Hook H.TIMI for 50/60Hz task execution
; ==================================================================

; ==================================================================
; INTERRUPT SYSTEM MEMORY LAYOUT
; Location: C090h-C0B0h (32 bytes)
; ==================================================================

; Task table: 8 slots Ç- 2 bytes (addresses) = 16 bytes
task_table              EQU #C090   ; Base address of task table
task_0_ptr              EQU #C090   ; Slot 0: Input polling (2 bytes)
task_1_ptr              EQU #C092   ; Slot 1: Physics update (2 bytes)
task_2_ptr              EQU #C094   ; Slot 2: Collision check (2 bytes)
task_3_ptr              EQU #C096   ; Slot 3: Sprite rendering (2 bytes)
task_4_ptr              EQU #C098   ; Slot 4: Frame counter (2 bytes)
task_5_ptr              EQU #C09A   ; Slot 5: User custom slot 1 (2 bytes)
task_6_ptr              EQU #C09C   ; Slot 6: User custom slot 2 (2 bytes)
task_7_ptr              EQU #C09E   ; Slot 7: User custom slot 3 (2 bytes)

; System state variables
interrupt_system_enabled  EQU #C0A0   ; 0=disabled, 1=enabled (1 byte)
old_htimi_hook           EQU #C0A1   ; Original H.TIMI hook (5 bytes: JP nnnn + padding)
interrupt_counter        EQU #C0A6   ; Frame counter (16-bit, C0A6-C0A7)
task_exec_time           EQU #C0A8   ; Cycles used by tasks - debug only (16-bit, C0A8-C0A9)
vblank_flag              EQU #C0AA   ; Set to 1 on each VBlank (1 byte)

; End marker
RAM_INTERRUPT_END        EQU #C0B0   ; End of interrupt system memory (32 bytes total)

; ==================================================================
; INIT_INTERRUPT_SYSTEM - Install H.TIMI hook
; ==================================================================
; Inputs: None
; Outputs: None
; Modifies: AF, BC, DE, HL
; ==================================================================
init_interrupt_system:
    di                          ; Disable interrupts during hook install

    ; --- STEP 1: Save original hook ---
    ld hl, #FD9F                ; H.TIMI address
    ld de, old_htimi_hook       ; Our backup location
    ld bc, 5                    ; Save 5 bytes (JP nnnn + padding)
    ldir                        ; Copy original hook to RAM

    ; --- STEP 2: Install our hook ---
    ; Write "JP interrupt_dispatcher" at FD9F
    ld a, #C3                   ; Opcode for JP
    ld (#FD9F), a               ; Write JP opcode
    ld hl, interrupt_dispatcher ; Address of our ISR
    ld (#FDA0), hl              ; Write address (little-endian)

    ; --- STEP 3: Initialize task table to 0 (all disabled) ---
    ld hl, task_table
    ld de, task_table+1
    ld bc, 15                   ; 8 slots Ç- 2 bytes = 16 bytes - 1
    ld (hl), 0
    ldir                        ; Clear all task pointers

    ; --- STEP 4: Initialize counters ---
    xor a
    ld (interrupt_counter), a
    ld (interrupt_counter+1), a
    ld (vblank_flag), a

    ; --- STEP 5: Mark system as enabled ---
    ld a, 1
    ld (interrupt_system_enabled), a

    ei                          ; Re-enable interrupts
    ret

; ==================================================================
; STOP_INTERRUPT_SYSTEM - Restore original H.TIMI hook
; ==================================================================
; Inputs: None
; Outputs: None
; Modifies: AF, BC, DE, HL
; ==================================================================
stop_interrupt_system:
    di                          ; Disable interrupts

    ; Restore original hook
    ld hl, old_htimi_hook       ; Our backup
    ld de, #FD9F                ; H.TIMI location
    ld bc, 5                    ; Restore 5 bytes
    ldir

    ; Mark system as disabled
    xor a
    ld (interrupt_system_enabled), a

    ei                          ; Re-enable interrupts
    ret

; ==================================================================
; INTERRUPT_DISPATCHER - Main ISR (60Hz/50Hz)
; ==================================================================
; This routine executes on each V-Blank
; CRITICAL: Minimal CPU cycles, maximum efficiency
; Overhead: ~80 cycles base + ~40 cycles per active task
; ==================================================================
interrupt_dispatcher:
    ; --- STEP 1: Save MINIMAL registers (only what we use) ---
    push af                     ; 11 cycles
    push hl                     ; 11 cycles
    push bc                     ; 11 cycles
    ; Total: 33 cycles overhead

    ; --- STEP 2: Check if system is enabled ---
    ld a, (interrupt_system_enabled)
    or a
    jr z, .exit                 ; If disabled, exit quickly

    ; --- STEP 3: Increment frame counter ---
    ld hl, (interrupt_counter)
    inc hl
    ld (interrupt_counter), hl

    ; --- STEP 3.5: Mark VBlank happened ---
    ld a, 1
    ld (vblank_flag), a

    ; --- STEP 4: Walk through task table ---
    ld hl, task_table           ; HL = pointer to task table
    ld b, 8                     ; 8 slots

.task_loop:
    ; Read task pointer (16-bit address)
    ld a, (hl)                  ; Low byte
    inc hl
    ld c, a
    ld a, (hl)                  ; High byte
    inc hl
    or c                        ; Check if pointer == 0
    jr z, .next_task            ; Skip if disabled (pointer == 0)

    ; Valid pointer: execute task
    dec hl
    dec hl                      ; Back to low byte
    push bc                     ; Save loop counter
    push hl                     ; Save table position

    ; Load task address into HL
    ld c, (hl)                  ; Low byte
    inc hl
    ld h, (hl)                  ; High byte
    ld l, c                     ; HL = task address

    ; Call task using JP (HL) pattern (faster than indirect CALL)
    call .call_task             ; Call the task

    pop hl                      ; Restore table position
    pop bc                      ; Restore loop counter
    inc hl
    inc hl                      ; Advance to next slot
    jr .continue_loop

.next_task:
    ; Nothing to do, HL already points to next slot

.continue_loop:
    djnz .task_loop             ; Loop 8 times

.exit:
    ; --- STEP 5: Restore registers ---
    pop bc                      ; 10 cycles
    pop hl                      ; 10 cycles
    pop af                      ; 10 cycles

    ; --- STEP 6: Return from interrupt ---
    ; For H.TIMI we should chain to the original hook (best compatibility)
    ; and let the BIOS interrupt handler manage EI/RETI.
    jp old_htimi_hook

; Helper for indirect call
.call_task:
    jp (hl)                     ; Jump to task (task will RET back here)

; ==================================================================
; TASK MANAGEMENT FUNCTIONS
; ==================================================================

; ==================================================================
; WAIT_VBLANK - Wait for next VBlank tick from H.TIMI
; ==================================================================
; Safe alternative to plain HALT: ensures we advance exactly one tick.
; Inputs: None
; Outputs: None
; Modifies: AF
; ==================================================================
wait_vblank:
    xor a
    ld (vblank_flag), a
.loop:
    halt
    ld a, (vblank_flag)
    or a
    jr z, .loop
    ret

; ==================================================================
; ENABLE_TASK - Activate a task in the system
; ==================================================================
; Inputs:
;   A = task slot (0-7)
;   HL = address of task routine
; Outputs: None
; Modifies: AF, BC, DE, HL
; ==================================================================
enable_task:
    ; Validate slot (0-7)
    cp 8
    ret nc                      ; Return if slot >= 8

    ; Calculate offset in table: slot * 2
    add a, a                    ; A = slot * 2
    ld e, a
    ld d, 0
    ld bc, task_table
    ex de, hl                   ; HL = offset, DE = task address
    add hl, bc                  ; HL = task_table + offset

    ; Write task address
    ex de, hl                   ; HL = task address, DE = slot location
    ld a, l
    ld (de), a                  ; Write low byte
    inc de
    ld a, h
    ld (de), a                  ; Write high byte

    ret

; ==================================================================
; DISABLE_TASK - Deactivate a task
; ==================================================================
; Inputs:
;   A = task slot (0-7)
; Outputs: None
; Modifies: AF, DE, HL
; ==================================================================
disable_task:
    ; Validate slot
    cp 8
    ret nc

    ; Calculate offset
    add a, a                    ; A = slot * 2
    ld e, a
    ld d, 0
    ld hl, task_table
    add hl, de                  ; HL = task_table + offset

    ; Write 0 (disable)
    xor a
    ld (hl), a                  ; Low byte = 0
    inc hl
    ld (hl), a                  ; High byte = 0

    ret

; ==================================================================
; GET_FRAME_COUNT - Get frame counter value
; ==================================================================
; Inputs: None
; Outputs: HL = frame count (16-bit)
; Modifies: HL
; ==================================================================
get_frame_count:
    ld hl, (interrupt_counter)
    ret

; ==================================================================
; DEFAULT INTERRUPT TASKS (60Hz Execution)
; ==================================================================

; ==================================================================
; TASK_UPDATE_INPUT - Joystick/Cursor polling at 60Hz
; ==================================================================
; This task guarantees responsive input (no missed button presses)
; Compatible with update_input_component existing function
; ==================================================================
task_update_input:
    push af
    push de

    ; Save previous state
    ld a, (input_state)
    ld (prev_input_state), a

    ; Read joystick 0 (cursors)
    xor a                       ; Joystick 0
    call GTSTCK                 ; BIOS call: A = direction
    ld b, a                     ; B = direction
    xor a                       ; Joystick 0
    call GTTRIG                 ; A = trigger status (0 = pressed)
    or a
    jr nz, .no_fire
    set 7, b                    ; Fire -> bit 7
    ld a, 1                     ; Fire pressed
    ld (input_fire), a
    jr .fire_done
.no_fire:
    xor a                       ; Fire not pressed
    ld (input_fire), a
.fire_done:
    ld a, b
    ld (input_state), a

    pop de
    pop af
    ret

; ==================================================================
; TASK_UPDATE_PHYSICS - Apply vx, vy -> X, Y
; ==================================================================
; Applies velocities to positions for all entities with Movement
; component. Ensures physics runs at fixed 60Hz.
; ==================================================================
task_update_physics:
    push af
    push bc
    push de
    push hl

    ; Physics pipeline (runs inside H.TIMI hook):
    ; 1) Jump (sets gravity impulse)
    ; 2) Movement (damping / velocity changes)
    ; 3) Gravity (acceleration + applies to Y)
    ; 4) Position (apply vel_x/vel_y -> x/y)
    call update_jump_component
    call update_movement_component
    call update_gravity_component
    call update_position_component

    pop hl
    pop de
    pop bc
    pop af
    ret

; ==================================================================
; TASK_UPDATE_COLLISION - Collision detection
; ==================================================================
; Detects collisions using collision layers (bitmask system)
; AABB collision for 16x16 sprites
; ==================================================================
task_update_collision:
    push af
    push bc
    push de
    push hl

    ; TODO: Implement collision detection
    ; Loop over entities with COMP_MASK_COLLISION
    ; Check: collisionLayer & collidesWith for each pair
    ; AABB test: |X1-X2| < 16 && |Y1-Y2| < 16

    pop hl
    pop de
    pop bc
    pop af
    ret

; ==================================================================
; TASK_UPDATE_SPRITES - Update sprites to VRAM
; ==================================================================
; WARNING: This task is HEAVY (~800 cycles)
; Consider executing every N frames instead of every frame
; ==================================================================
task_update_sprites:
    push af
    push bc
    push de
    push hl

    ; Call existing sprite update function
    call update_sprites_to_vram

    pop hl
    pop de
    pop bc
    pop af
    ret

; ==================================================================
; TASK_FRAME_COUNTER - Custom timing/animations
; ==================================================================
; Placeholder for user-defined frame-based timing
; Example: Increment animation timers, etc.
; ==================================================================
task_frame_counter:
    ; Placeholder - counter is already incremented in dispatcher
    ; Add custom timing logic here if needed
    ret

; ==================================================================
; USER CUSTOM TASK SLOTS (5-7)
; ==================================================================
; These slots are reserved for user-defined tasks
; Enable them dynamically using:
;   LD A, 5                    ; Slot 5
;   LD HL, my_custom_task
;   CALL enable_task
; ==================================================================


; ==================================================================
; COMPONENT SYSTEMS (INLINED)
; Generated inside interrupt.asm because interruptDrivenComponents=true
; ==================================================================

; ==================================================================
; GAME COMPONENT SYSTEMS - MSX ECS ENGINE
    ; File: components.asm
        ; Description: Component systems based on Mideas React.js architecture
    ; Implements Position, Sprite, Movement, Collision, Input, and Behavior systems
    ; ==================================================================
;
; INTELLIGENT FILTERING ACTIVE:
;   Active entities: 1
;   Used components: 
;   Filtered out: 8 unused component systems
    ;
; ==================================================================

; ==================================================================
; COMPONENT TYPE CONSTANTS(Based on ComponentDefinition analysis)
    ; ==================================================================

; Core Components(always present)
COMP_POSITION   EQU 0; Position component(x, y coordinates)
COMP_SPRITE     EQU 1; Sprite rendering component
COMP_MOVEMENT   EQU 2; Movement / velocity component
COMP_COLLISION  EQU 3; Collision detection component
COMP_INPUT      EQU 4; Input handling component
COMP_BEHAVIOR   EQU 5; AI / Logic behavior component
COMP_HEALTH     EQU 6; Health / damage component
COMP_ANIMATION  EQU 7; Animation state component
COMP_JUMP       EQU 8; Jump behavior component(platformer physics)
COMP_GRAVITY    EQU 9; Gravity physics component

    ; Component flags for entity filtering(16 - bit masks for 10 + components)
COMP_MASK_POSITION   EQU #0001; Binary: 0000000000000001
COMP_MASK_SPRITE     EQU #0002; Binary: 0000000000000010
COMP_MASK_MOVEMENT   EQU #0004; Binary: 0000000000000100
COMP_MASK_COLLISION  EQU #0008; Binary: 0000000000001000
COMP_MASK_INPUT      EQU #0010; Binary: 0000000000010000
COMP_MASK_BEHAVIOR   EQU #0020; Binary: 0000000000100000
COMP_MASK_HEALTH     EQU #0040; Binary: 0000000001000000
COMP_MASK_ANIMATION  EQU #0080; Binary: 0000000010000000
COMP_MASK_JUMP       EQU #0100; Binary: 0000000100000000
COMP_MASK_GRAVITY    EQU #0200; Binary: 0000001000000000
COMP_MASK_AUTO_DESTROY EQU #0400; Binary: 0000010000000000

; ==================================================================
; ANIMATION FLAGS (entity_anim_flags)
; ==================================================================
ANIM_FLAG_PLAYING            EQU #01
ANIM_FLAG_LOOP               EQU #02
ANIM_FLAG_ONLY_WHEN_MOVING   EQU #04
ANIM_DEFAULT_SPEED           EQU 8

    ; ==================================================================
; COMPONENT DATA STRUCTURES(Entity - Component arrays)
    ; ==================================================================

; NOTE: Core entity variables are now defined in variables.asm
    ; (entity_x_pos, entity_y_pos, entity_vel_x, entity_vel_y, entity_comp_masks, etc.)

    ; Jump Component Data(Fixed - Point 8.8 for smooth physics)
    ; Using temporary storage for optional components to save RAM
entity_jump_vel_y   EQU temp_word_3; Y velocity for jumping(signed word, 32 words = 64 bytes)
entity_jump_count   EQU temp_byte_4; Current jump count(0 = grounded, 1 = first jump, etc.)(32 bytes)
entity_on_ground    EQU temp_byte_5; Ground contact flag(bit 0 = on ground)(32 bytes)

    ; Gravity Component Data
entity_gravity_vel  EQU temp_word_4; Accumulated gravity velocity(signed word, 64 bytes)

    ; Health Component Data
entity_health_current EQU temp_byte_6 ; Current health/lives (32 bytes)
entity_health_max     EQU temp_byte_7 ; Maximum health/lives (32 bytes)

    ; Deadly Tile Collision Data
entity_deadly_collision EQU temp_byte_8 ; Flag: bit 0 = touching deadly tile (32 bytes)

    ; Damage Component Data
entity_invincibility_frames EQU temp_byte_9  ; Countdown timer for invulnerability (32 bytes)
entity_damage_amount        EQU temp_byte_10 ; Damage dealt by this entity (32 bytes)

    ; Shoot Component Data
entity_shoot_cooldown   EQU temp_byte_11 ; Cooldown frames until can shoot (32 bytes)
entity_shoot_sprite_id  EQU temp_byte_12 ; Projectile sprite ID (32 bytes)
entity_shoot_speed      EQU temp_byte_13 ; Projectile velocity (32 bytes)

    ; Collision Layer Data (for projectile and advanced collision)
entity_collision_layer  EQU temp_byte_14 ; Which layer this entity is on (32 bytes)
entity_collides_with    EQU temp_byte_15 ; Bitmask of layers this entity collides with (32 bytes)

    ; Platform Riding Data
entity_platform_id      EQU temp_byte_16 ; ID of platform underneath (255 = none) (32 bytes)
entity_platform_grace   EQU temp_byte_17 ; Grace frames for platform (32 bytes)


    ; ==================================================================
; CORE ECS SYSTEM FUNCTIONS
    ; ==================================================================

        init_components: 
; Initialize component systems(OPTIMIZED - only used components) 
    ; Used:  
 
; Initialize current screen ID(multi - screen support) 
        ld a, 0; Start at screen 0 
        ld (current_screen_id), a 
 
    ; Clear all component masks 
        ld hl, entity_comp_masks 
        ld de, entity_comp_masks + 1 
        ld bc, 31 
        ld (hl), 0 
        ldir 

    ; Clear all component masks (high byte)
        ld hl, entity_comp_masks_hi
        ld de, entity_comp_masks_hi + 1
        ld bc, 31
        ld (hl), 0
        ldir 
 
        ; Initialize position system (always)
    call init_position_system
        ; Initialize auto-destroy system
    call init_auto_destroy_system
        ; Initialize platform riding system
    call init_platform_riding_system
    
    ret
    

; ==================================================================
; POSITION COMPONENT SYSTEM (Based on SpriteEditor position handling)
; ==================================================================

init_position_system:
    ; Initialize position component system
    ; Clear all entity positions
    ld hl, entity_x_pos
    ld de, entity_x_pos+1
    ld bc, 31
    ld (hl), 0
    ldir

    ld hl, entity_y_pos
    ld de, entity_y_pos+1
    ld bc, 31
    ld (hl), 0
    ldir
    ret

update_position_component:
    ; Update positions based on velocities (Movement -> Position)
    ld b, 32                   ; Loop through all entities
    ld hl, entity_comp_masks   ; Check component masks
    ld c, 0                    ; Entity index

position_update_loop:
    ld a, (hl)                 ; Get entity component mask
    ld d, a                    ; OPTIMIZED: Save mask in D to avoid redundant memory read
    and COMP_MASK_POSITION     ; Check if has position component
    jr z, position_next_entity ; Skip if no position component

    ; Apply velocity to position (if has movement component)
    ld a, d                    ; OPTIMIZED: Reuse saved mask (saves 1 memory read)
    and COMP_MASK_MOVEMENT
    jr z, position_next_entity ; Skip velocity if no movement

    push bc
    push hl

    ; Update X Position
    ; X = X + VelX
    ld hl, entity_vel_x
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                 ; A = VelX
    ld b, a                    ; B = VelX

    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)                 ; A = X
    add a, b                   ; A = X + VelX
    ld (hl), a                 ; Store new X

    ; Update Y Position
    ; Y = Y + VelY
    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)                 ; A = VelY
    ld b, a                    ; B = VelY

    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)                 ; A = Y
    add a, b                   ; A = Y + VelY
    ld (hl), a                 ; Store new Y

    pop hl
    pop bc

position_next_entity:
    inc hl                     ; Next entity mask
    inc c                      ; Next entity index
    djnz position_update_loop
    ret

; ==================================================================
; SPRITE COMPONENT SYSTEM (Based on SpriteEditor rendering)
; ==================================================================

init_sprite_system:
    ; Initialize sprite rendering system
    ; Clear all sprite attributes
    call clear_all_sprites
    ret

update_sprite_component:
    ; Update sprite rendering based on entity positions
    ld b, 32                   ; Loop through all entities
    ld hl, entity_comp_masks   ; Check component masks
    ld c, 0                    ; Entity index counter

sprite_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_SPRITE       ; Check if has sprite component
    jp z, sprite_next_entity   ; Skip if no sprite component (jp because distance > 127 bytes)

    ; Check if entity is in current screen (multi-screen support)
    push bc
    push hl

    ; Check entity screen ID
    ld hl, entity_screen_id
    ld e, c                    ; Entity index
    ld d, 0
    add hl, de                 ; HL points to entity screen ID
    ld a, (hl)                 ; A = entity screen ID

    ; Compare with current screen ID
    ld hl, current_screen_id
    cp (hl)                    ; Compare entity screen with current screen
    jr nz, sprite_hide         ; If different screen, hide sprite

    ; Entity is in current screen - render normally
    ; E already contains entity index (from line 129)
    ; D = 0 (from line 130)
    
    ; Get entity position (X, Y)
    ld hl, entity_x_pos
    add hl, de                 ; HL points to entity X
    ld b, (hl)                 ; B = X position

    ld hl, entity_y_pos
    add hl, de                 ; HL points to entity Y
    ld c, (hl)                 ; C = Y position

    ; Get sprite configuration (Base HW Sprite + Layer Count)
    ; E still contains entity index, D = 0
    ld hl, entity_sprite_config
    add hl, de
    add hl, de                 ; Index * 2 (2 bytes per entry)
    
    ld a, (hl)                 ; Base HW Sprite
    inc hl
    ld h, (hl)                 ; Layer Count
    ld l, a                    ; L = Base HW Sprite (Current HW Sprite)
    ld a, h
    or a
    jp z, sprite_continue      ; No layers -> skip rendering
    
    ; Loop through layers
    ; H = Remaining Layers
    ; L = Current HW Sprite
    ; B = X Position
    ; C = Y Position
    
sprite_layer_loop:
    push hl                    ; Save counters
    push bc                    ; Save Position
    
    ; Calculate Pattern: Pattern = HW Sprite Index (0-31)
    ld a, l
    ld d, a                    ; D = Pattern (direct index, not *4)
    
    ; Get Color from sprite_layer_colors table
    ; Table is indexed by HW Sprite Index (L)
    push de
    ld de, sprite_layer_colors
    ld a, l
    add a, e
    ld e, a
    ld a, 0
    adc a, d
    ld d, a                    ; DE = &sprite_layer_colors[hwSprite]
    ld a, (de)                 ; A = Color
    pop de                     ; Restore D (Pattern)
    ld e, a                    ; E = Color
    
    ; Call show_sprite (A=HW Sprite, B=X, C=Y, D=Pattern, E=Color)
    ld a, l                    ; A = HW Sprite
    call show_sprite
    
    pop bc                     ; Restore Position
    pop hl                     ; Restore counters
    
    inc l                      ; Next HW Sprite
    dec h                      ; Decrement Layer Count
    jr nz, sprite_layer_loop
    
    jr sprite_continue

sprite_hide:
    ; Entity is in different screen - hide sprite (Y = 208+)
    ; We must hide ALL layers for this entity
    ; E contains Entity Index (from line 129)
    ; D = 0 (from line 130)
    
    ld hl, entity_sprite_config
    add hl, de
    add hl, de
    
    ld a, (hl)                 ; Base HW Sprite
    inc hl
    ld b, (hl)                 ; Layer Count
    ld a, b
    or a
    jr z, sprite_continue      ; Nothing to hide for anchor entities
    
sprite_hide_loop:
    push bc
    push af
    call hide_sprite           ; A = HW Sprite
    pop af
    pop bc
    
    inc a                      ; Next HW Sprite
    djnz sprite_hide_loop

sprite_continue:
    pop hl
    pop bc

sprite_next_entity:
    inc hl                     ; Next entity
    inc c                      ; Next entity index
    dec b                      ; Decrement loop counter
    jp nz, sprite_update_loop  ; Jump if not zero (djnz replacement for long jumps)

    ; Update all sprites to VRAM
    call update_sprites_to_vram
    ret

; ==================================================================
; HELPER: Force update a single entity's sprite (used by init_entities)
; Input: C = Entity Index
; ==================================================================
force_update_entity_sprite:
    push bc
    push de
    push hl
    
    ; Get X/Y from memory
    ld hl, entity_x_pos
    ld e, c
    ld d, 0
    add hl, de
    ld b, (hl)                 ; B = X
    
    ld hl, entity_y_pos
    add hl, de
    ld c, (hl)                 ; C = Y
    
    ; E still has Entity Index, D = 0
    ; B = X, C = Y
    
    ; Get Config
    ld hl, entity_sprite_config
    add hl, de
    add hl, de                 ; Index * 2
    
    ld a, (hl)                 ; Base HW Sprite
    inc hl
    ld h, (hl)                 ; Layer Count
    ld l, a                    ; L = Base HW Sprite
    ld a, h
    or a
    jr z, force_sprite_done    ; Skip if no layers for this entity

    ; Loop through layers
    ; H = Layer Count
    ; L = HW Sprite Index
    ; B = X, C = Y
force_sprite_layer_loop:
    push hl                    ; Save counters
    push bc                    ; Save Position
    
    ; Calculate Pattern: Pattern = HW Sprite Index (0-31)
    ld a, l
    ld d, a                    ; D = Pattern (direct index, not *4)
    
    ; Get Color
    push de
    ld de, sprite_layer_colors
    ld a, l
    add a, e
    ld e, a
    ld a, 0
    adc a, d
    ld d, a
    ld a, (de)
    pop de                     ; Restore D
    ld e, a                    ; E = Color
    
    ; Call show_sprite
    ld a, l                    ; A = HW Sprite
    call show_sprite
    
    pop bc                     ; Restore Position
    pop hl                     ; Restore counters
    
    inc l
    dec h
    jr nz, force_sprite_layer_loop

force_sprite_done:
    pop hl
    pop de
    pop bc
    ret

    ; Movement system filtered out(not used)
init_movement_system:
    ret

update_movement_component:
    ret
    
    ; Collision system filtered out(not used)
init_collision_system:
    ret

update_collision_component:
    ret
    
    ; Input system filtered out(not used)
init_input_system:
    ret

update_input_component:
    ret
    
    ; Behavior system filtered out(not used)
init_behavior_system:
    ret

update_behavior_component:
    ret
    
    ; Health system filtered out(not used)
init_health_system:
    ret

update_health_component:
    ret
    
    ; Animation system filtered out(not used)
init_animation_system:
    ret

update_animation_component:
    ret
    
    ; Jump system filtered out(not used)
init_jump_system:
    ret

update_jump_component:
    ret
    
    ; Gravity system filtered out(not used)
init_gravity_system:
    ret

update_gravity_component:
    ret
    
    ; ==================================================================
    ; AUTO-DESTROY COMPONENT SYSTEM
    ; ==================================================================
    ; Entities with AUTO_DESTROY component have a lifetime counter
    ; When lifetime reaches 0, entity is automatically destroyed
    ; Useful for: projectiles, particles, temporary effects, etc.

init_auto_destroy_system:
    ; Initialize all lifetimes to 0 (infinite by default)
    ld hl, entity_lifetime
    ld de, entity_lifetime+1
    ld bc, 31
    ld (hl), 0
    ldir
    ret

update_auto_destroy_component:
    ; Update lifetime counters and destroy entities when expired
    ld b, 32                      ; Loop all entities
    ld hl, entity_comp_masks_hi    ; High byte masks
        ld c, 0                       ; Entity index

    auto_destroy_loop:
        ld a, (hl)
        and #04                       ; AUTO_DESTROY bit (COMP_MASK_AUTO_DESTROY=#0400 -> high byte bit2)
        jr z, auto_destroy_next

        ; Entity has auto-destroy component
        push bc
        push hl

        ; Get lifetime for this entity
        ld e, c                       ; Entity index
        ld d, 0
        ld hl, entity_lifetime
        add hl, de
        ld a, (hl)                    ; A = lifetime

        ; Check if lifetime is 0 (infinite) or > 0
        or a
        jr z, auto_destroy_done       ; 0 = infinite lifetime, skip

        ; Decrement lifetime
        dec a
        ld (hl), a                    ; Store decremented value

        ; Check if lifetime reached 0
        or a
        jr nz, auto_destroy_done      ; Still alive

        ; Lifetime expired - destroy entity
        ; Clear component masks (deactivates entity)
        ld hl, entity_comp_masks
        ld e, c
        ld d, 0
        add hl, de
        ld (hl), 0                    ; Clear low byte

        ld hl, entity_comp_masks_hi
        add hl, de
        ld (hl), 0                    ; Clear high byte

        ; Move entity off-screen
        ld hl, entity_x_pos
        add hl, de
        ld (hl), 255                  ; X = off-screen

        ld hl, entity_y_pos
        add hl, de
        ld (hl), 212                  ; Y = below screen (192 + 20)

auto_destroy_done:
        pop hl
        pop bc

auto_destroy_next:
        inc hl                        ; Next entity high mask
        inc c                         ; Next entity index
        dec b
        jp nz, auto_destroy_loop
        ret
    
    ; Cursors system filtered out(not used)
init_cursors_system:
    ret

update_cursors_component:
    ret
    
    ; StateMachine system filtered out(not used)
init_statemachine_system:
    ret

update_statemachine_component:
    ret
    
    ; Carry system filtered out(not used)
init_carry_system:
    ret

update_carry_component:
    ret
    
    ; Damage system filtered out(not used)
init_damage_system:
    ret

update_damage_component:
    ret
    
    ; Shoot system filtered out(not used)
init_shoot_system:
    ret

update_shoot_component:
    ret
    
    ; ==================================================================
    ; PLATFORM RIDING SYSTEM
    ; ==================================================================
    ; Detects when entities are standing on platforms and transfers velocity
    ;
    ; Platform detection: Entity A is on platform B if:
    ; - A's bottom edge is at or near B's top edge
    ; - A has horizontal overlap with B
    ; - B has collision_layer bit 3 set (platform layer = 8)
    ;
    ; Grace frames: 6 frames tolerance when leaving platform

init_platform_riding_system:
    ; Initialize platform IDs to 255 (no platform)
    ld hl, entity_platform_id
    ld de, entity_platform_id + 1
    ld bc, 31
    ld (hl), 255
    ldir

    ; Initialize grace frames to 0
    ld hl, entity_platform_grace
    ld de, entity_platform_grace + 1
    ld bc, 31
    ld (hl), 0
    ldir
    ret

prepare_platform_detection:
    ; PHASE 1 - Called BEFORE collision detection
    ; Clear platform references from previous frame
    ; Entities that were on platforms get grace frames
    ; Collision detection will reset platform_id if still in contact

    ld b, 32
    ld hl, entity_platform_id
    ld de, entity_platform_grace
    ld c, 0

.platform_clear_loop:
    ld a, (hl)              ; A = platform_id
    cp 255                  ; Check if on a platform
    jr z, .platform_skip_clear ; Already no platform, skip

    ; Entity was on a platform last frame
    ; Set grace frames to 6 (coyote time for leaving platform)
    push hl
    ld a, 6
    ld (de), a              ; Set grace frames
    pop hl

    ; Clear platform reference (collision will reset if still touching)
    ld (hl), 255

.platform_skip_clear:
    inc hl                  ; Next platform_id
    inc de                  ; Next grace counter
    inc c
    djnz .platform_clear_loop
    ret

update_platform_riding:
    ; PHASE 2 - Called AFTER collision detection
    ; Decrement grace frames for entities not on platforms
    ; (Entities on platforms have grace=0, set by handle_entity_collision)

    ld b, 32
    ld hl, entity_platform_grace
    ld de, entity_platform_id
    ld c, 0

.grace_loop:
    ; Check if entity has platform reference
    ld a, (de)              ; A = platform_id
    cp 255
    jr nz, .grace_next      ; Has platform, skip grace decrement

    ; No platform - decrement grace frames if > 0
    ld a, (hl)              ; A = grace frames
    or a
    jr z, .grace_next       ; Already 0, skip

    dec a                   ; Decrement grace
    ld (hl), a

.grace_next:
    inc hl                  ; Next grace counter
    inc de                  ; Next platform_id
    inc c
    djnz .grace_loop
    ret
    
    ; WallCollision system filtered out(not used)
init_wallcollision_system:
    ret

update_wallcollision_component:
    ret
    
    ; Collectible system filtered out(not used)
init_collectible_system:
    ret

update_collectible_component:
    ret
     
    ; ================================================================== 
        ; ENTITY MANAGEMENT FUNCTIONS(Based on EntityTemplate system) 
    ; ================================================================== 

        ; Create entity with components(A = entity ID, B = mask low byte, C = mask high byte) 
        create_entity: 
; Set component mask for entity 
            ld hl, entity_comp_masks 
            ld e, a; Entity index 
            ld d, 0 
            add hl, de; HL points to entity mask 
            ld (hl), b; Set component mask low byte

            ld hl, entity_comp_masks_hi
            add hl, de
            ld (hl), c; Set component mask high byte 
 
    ; Initialize component data based on mask 
            bit 0, b; Check COMP_MASK_POSITION (low byte)
            call nz, init_entity_position 
 
            bit 1, b; Check COMP_MASK_SPRITE (low byte)
            call nz, init_entity_sprite 
 
    ; TODO: Initialize other components based on mask bits 
 
    ret 

    ; Initialize position component for entity(A = entity ID)
        init_entity_position:
            ld hl, entity_x_pos
            ld e, a
            ld d, 0
            add hl, de
            ld (hl), 100; Default X position

            ld hl, entity_y_pos
            add hl, de
            ld (hl), 100; Default Y position
    ret

    ; Initialize sprite component for entity(A = entity ID)
        init_entity_sprite:
    ; Set sprite as visible with default pattern
            ld hl, sprite_pattern
            ld e, a
            ld d, 0
            add hl, de
            ld (hl), 0; Pattern 0

            ld hl, sprite_color
            add hl, de
            ld (hl), 15; White color
    ret
    
; ==================================================================
; UPDATE ALL ENTITIES - Called by GameFlow
; ==================================================================
; This function updates all active entities by calling each
; component update system in the correct order
update_all_entities:
    ; Update all entity components in proper order
    call update_input_component        ; 1. Input (player control) - uses input_state from hook
    call update_shoot_component        ; 2. Shooting (cooldown + projectile spawn)
    call update_behavior_component     ; 3. Behavior/AI
    call update_jump_component         ; 4. Jump impulse / grounded flags
    call update_movement_component     ; 5. Movement (vx/vy changes)
    call update_gravity_component      ; 6. Gravity acceleration
    call update_position_component     ; 7. Apply velocity to position
    call prepare_platform_detection    ; 8. Clear platform refs (before collision)
    call update_collision_component    ; 9. Collision detection / set platform refs
    call update_platform_riding        ; 10. Platform riding / grace frames
    call update_health_component       ; 11. Health/Death
    call update_damage_component       ; 12. Damage/Invincibility
    call update_animation_component    ; 13. Animation
    call update_auto_destroy_component ; 14. Auto-destroy (lifetime countdown)
    call update_sprite_component       ; 15. Sprite rendering + SAT->VRAM copy
    ret


; ==================================================================
; EXECUTE ALL STATE MACHINES - Called by GameFlow
; ==================================================================
; This function executes the state machine for each entity that has one
execute_all_state_machines:
    ld b, 32                      ; Loop through all 32 entities
    xor a                         ; A = 0 (entity index counter)
    
.sm_loop:
    push af                       ; Save entity index
    push bc                       ; Save loop counter
    
    ; Check if this entity has a state machine assigned
    ld c, a                       ; C = entity index
    ld b, 0                       ; BC = entity index
    ld hl, entity_sm_ptr_l
    add hl, bc
    ld e, (hl)                    ; E = SM ptr low
    
    ld hl, entity_sm_ptr_h
    add hl, bc
    ld d, (hl)                    ; D = SM ptr high
    
    ; Check if SM pointer is non-zero
    ld a, d
    or e
    jr z, .skip_entity            ; No SM assigned, skip
    
    ; Entity has a state machine - execute it
    pop bc                        ; Restore loop counter
    pop af                        ; Restore entity index
    push af                       ; Save again for continuation
    push bc                       ; Save again for continuation
    
    call SM_Update                ; Execute state machine (A = entity index)
    
.skip_entity:
    pop bc                        ; Restore loop counter
    pop af                        ; Restore entity index
    
    inc a                         ; Next entity
    djnz .sm_loop                 ; Loop for all entities
    
    ret


; ==================================================================
; TILE COLLISION SYSTEM
; ==================================================================
; Provides functions for checking collision with background tiles
; Uses behavior maps generated from screen collision layers
; ==================================================================

; ------------------------------------------------------------------
; get_tile_at_position
; Convert pixel coordinates to tile coordinates and get tile ID
; Input:  D = X position (pixels), E = Y position (pixels)
; Output: A = Tile ID at that position, Z flag set if out of bounds
; Destroys: BC, HL
; ------------------------------------------------------------------
get_tile_at_position:
    ; Convert X pixel to tile column (divide by TILE_WIDTH)
    ld a, d
    
    ; Tile width is 16 pixels - shift right 4 times
    srl a
    srl a
    srl a
    srl a
    ld b, a                       ; B = tile column

    ; Convert Y pixel to tile row (divide by TILE_HEIGHT)
    ld a, e
    
    ; Tile height is 16 pixels - shift right 4 times
    srl a
    srl a
    srl a
    srl a
    ld c, a                       ; C = tile row

    ; Check bounds (assume 32x24 tile screen for now)
    ld a, b
    cp 32
    jr nc, .out_of_bounds
    ld a, c
    cp 24
    jr nc, .out_of_bounds

    ; Calculate tile index: index = row * 32 + column
    ld a, c
    add a, a                      ; A = row * 2
    add a, a                      ; A = row * 4
    add a, a                      ; A = row * 8
    add a, a                      ; A = row * 16
    add a, a                      ; A = row * 32
    add a, b                      ; A = row * 32 + column

    ; TODO: Read actual tile from screen map
    ; For now, return tile index as placeholder
    cp a                          ; Clear Z flag (tile found)
    ret

.out_of_bounds:
    xor a                         ; A = 0
    ret                           ; Z flag set (out of bounds)

; ------------------------------------------------------------------
; get_tile_behavior
; Get behavior/collision type of a tile
; Input:  A = Tile ID
; Output: A = Behavior flags (TILE_SOLID, TILE_PLATFORM, etc.)
; Destroys: HL
; ------------------------------------------------------------------
get_tile_behavior:
    ; TODO: Look up tile behavior from behavior map
    ; For now, simple logic: tile 0 = passable, others = solid
    or a
    jr z, .passable
    ld a, TILE_SOLID
    ret
.passable:
    ld a, TILE_PASSABLE
    ret

; ------------------------------------------------------------------
; check_collision_at_point
; Check if there's a solid tile at given pixel coordinates
; Input:  D = X position, E = Y position
; Output: Z flag set if passable, cleared if solid
;         A = Behavior flags of tile at that position
; Destroys: BC, HL
; ------------------------------------------------------------------
check_collision_at_point:
    call get_tile_at_position
    ret z                         ; Out of bounds = passable
    call get_tile_behavior
    and TILE_SOLID | TILE_PLATFORM
    ret                           ; Z if passable, NZ if solid

; ------------------------------------------------------------------
; check_collision_box
; Check collision for entity bounding box (16x16)
; Input:  D = X position (top-left), E = Y position (top-left)
; Output: Z flag set if no collision, cleared if collision detected
;         A = Behavior flags of colliding tile
; Destroys: BC, HL
; ------------------------------------------------------------------
check_collision_box:
    ; Check 4 corners of 16x16 box:
    ; Top-left (X, Y)
    push de
    call check_collision_at_point
    jr nz, .collision_found

    ; Top-right (X+15, Y)
    pop de
    push de
    ld a, d
    add a, 15
    ld d, a
    call check_collision_at_point
    jr nz, .collision_found

    ; Bottom-left (X, Y+15)
    pop de
    push de
    ld a, e
    add a, 15
    ld e, a
    call check_collision_at_point
    jr nz, .collision_found

    ; Bottom-right (X+15, Y+15)
    pop de
    push de
    ld a, d
    add a, 15
    ld d, a
    ld a, e
    add a, 15
    ld e, a
    call check_collision_at_point
    jr nz, .collision_found

    ; No collision
    pop de
    xor a                         ; Z flag set
    ret

.collision_found:
    pop de
    or a                          ; Clear Z flag
    ret

; ------------------------------------------------------------------
; div_a_by_c
; Divide A by C (unsigned 8-bit division)
; Input:  A = dividend, C = divisor
; Output: A = quotient
; Destroys: B
; ------------------------------------------------------------------
div_a_by_c:
    ld b, 0                       ; B = quotient
.tile_div_loop:
    sub c
    jr c, .tile_div_done
    inc b
    jr .tile_div_loop
.tile_div_done:
    ld a, b
    ret


    ; ==================================================================
; END OF COMPONENT SYSTEMS
    ; ==================================================================
        
; ==================================================================
; END OF INLINED COMPONENT SYSTEMS
; ==================================================================

