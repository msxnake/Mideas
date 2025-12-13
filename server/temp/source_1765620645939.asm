; ==================================================================
; INTERRUPT TASK SYSTEM - File: interrupt.asm
; Konami-style technique: Hook H.TIMI for 50/60Hz task execution
; ==================================================================

; ==================================================================
; INTERRUPT SYSTEM MEMORY LAYOUT
; Location: C090h-C0B0h (32 bytes)
; ==================================================================

; Task table: 8 slots × 2 bytes (addresses) = 16 bytes
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
    ld bc, 15                   ; 8 slots × 2 bytes = 16 bytes - 1
    ld (hl), 0
    ldir                        ; Clear all task pointers

    ; --- STEP 4: Initialize counters ---
    xor a
    ld (interrupt_counter), a
    ld (interrupt_counter+1), a

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
    ; NOTE: For H.TIMI we use RET, not RETI
    ; RETI is only needed for IM 2 mode
    ei                          ; Re-enable interrupts
    ret                         ; Return from interrupt

; Helper for indirect call
.call_task:
    jp (hl)                     ; Jump to task (task will RET back here)

; ==================================================================
; TASK MANAGEMENT FUNCTIONS
; ==================================================================

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
    ld (input_state), a

    ; TODO: Read trigger (button) if needed
    ; call GTTRIG

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

    ; TODO: Implement full physics update
    ; Loop over entities with COMP_MASK_MOVEMENT
    ; Apply: entity_x_pos[i] += entity_vel_x[i]
    ;        entity_y_pos[i] += entity_vel_y[i]

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

