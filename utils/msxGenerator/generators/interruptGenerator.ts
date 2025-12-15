/**
 * @fileoverview Interrupt System Generator for MSX
 * Generates interrupt.asm file with H.TIMI hook-based task system
 * Emulates Konami's technique for V-Blank interrupt handling
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';
import { generateComponentsFile } from './componentsGenerator';

export interface InterruptGeneratorConfig {
  interruptDrivenComponents?: boolean;
}

/**
 * Generate interrupt.asm file
 */
export function generateInterruptFile(analysis: ProjectAnalysis, config: InterruptGeneratorConfig = {}): string {
  console.log('ÐYZî [INTERRUPT GENERATOR] Generating interrupt.asm...');
  let code = '';

  code += `; ==================================================================\n`;
  code += `; INTERRUPT TASK SYSTEM - File: interrupt.asm\n`;
  code += `; Konami-style technique: Hook H.TIMI for 50/60Hz task execution\n`;
  code += `; ==================================================================\n\n`;

  // Memory layout
  code += generateInterruptMemoryLayout();

  // Core functions
  code += generateInitInterruptSystem();
  code += generateStopInterruptSystem();
  code += generateInterruptDispatcher();
  code += generateTaskManagementFunctions();

  // Default tasks
  code += generateDefaultTasks(analysis);

  // Optional: Generate full component systems inside interrupt.asm
  // This makes interrupt.asm self-contained for all ECS routines.
  // NOTE: In this mode, components.asm should be skipped/emptied by the caller to avoid duplicate labels.
  if (config.interruptDrivenComponents) {
    code += `\n; ==================================================================\n`;
    code += `; COMPONENT SYSTEMS (INLINED)\n`;
    code += `; Generated inside interrupt.asm because interruptDrivenComponents=true\n`;
    code += `; ==================================================================\n\n`;
    code += generateComponentsFile(analysis);
    code += `\n; ==================================================================\n`;
    code += `; END OF INLINED COMPONENT SYSTEMS\n`;
    code += `; ==================================================================\n\n`;
  }

  console.log(`ƒo. [INTERRUPT GENERATOR] Generated interrupt.asm (${code.length} chars)`);
  return code;
}

/**
 * Generate interrupt memory layout
 */
function generateInterruptMemoryLayout(): string {
  return `; ==================================================================
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

`;
}

/**
 * Generate init_interrupt_system routine
 */
function generateInitInterruptSystem(): string {
  return `; ==================================================================
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

`;
}

/**
 * Generate stop_interrupt_system routine
 */
function generateStopInterruptSystem(): string {
  return `; ==================================================================
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

`;
}

/**
 * Generate interrupt_dispatcher (ISR)
 */
function generateInterruptDispatcher(): string {
  return `; ==================================================================
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

`;
}

/**
 * Generate task management functions
 */
function generateTaskManagementFunctions(): string {
  return `; ==================================================================
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

`;
}

/**
 * Generate default tasks (input, physics, collision, sprites)
 */
function generateDefaultTasks(analysis: ProjectAnalysis): string {
  let code = '';

  code += `; ==================================================================\n`;
  code += `; DEFAULT INTERRUPT TASKS (60Hz Execution)\n`;
  code += `; ==================================================================\n\n`;

  // Task 0: Input Polling (ALWAYS generated)
  code += `; ==================================================================\n`;
  code += `; TASK_UPDATE_INPUT - Joystick/Cursor polling at 60Hz\n`;
  code += `; ==================================================================\n`;
  code += `; This task guarantees responsive input (no missed button presses)\n`;
  code += `; Compatible with update_input_component existing function\n`;
  code += `; ==================================================================\n`;
  code += `task_update_input:\n`;
  code += `    push af\n`;
  code += `    push de\n\n`;
  code += `    ; Save previous state\n`;
  code += `    ld a, (input_state)\n`;
  code += `    ld (prev_input_state), a\n\n`;
  code += `    ; Read joystick 0 (cursors)\n`;
  code += `    xor a                       ; Joystick 0\n`;
  code += `    call GTSTCK                 ; BIOS call: A = direction\n`;
  code += `    ld b, a                     ; B = direction\n`;
  code += `    xor a                       ; Joystick 0\n`;
  code += `    call GTTRIG                 ; A = trigger status (0 = pressed)\n`;
  code += `    or a\n`;
  code += `    jr nz, .no_fire\n`;
  code += `    set 7, b                    ; Fire -> bit 7\n`;
  code += `.no_fire:\n`;
  code += `    ld a, b\n`;
  code += `    ld (input_state), a\n\n`;
  code += `    pop de\n`;
  code += `    pop af\n`;
  code += `    ret\n\n`;

  // Task 1: Physics Update (if has entities - they likely need movement)
  if (analysis.hasEntities) {
    code += `; ==================================================================\n`;
    code += `; TASK_UPDATE_PHYSICS - Apply vx, vy -> X, Y\n`;
    code += `; ==================================================================\n`;
    code += `; Applies velocities to positions for all entities with Movement\n`;
    code += `; component. Ensures physics runs at fixed 60Hz.\n`;
    code += `; ==================================================================\n`;
    code += `task_update_physics:\n`;
    code += `    push af\n`;
    code += `    push bc\n`;
    code += `    push de\n`;
    code += `    push hl\n\n`;
    code += `    ; Physics pipeline (runs inside H.TIMI hook):\n`;
    code += `    ; 1) Jump (sets gravity impulse)\n`;
    code += `    ; 2) Movement (damping / velocity changes)\n`;
    code += `    ; 3) Gravity (acceleration + applies to Y)\n`;
    code += `    ; 4) Position (apply vel_x/vel_y -> x/y)\n`;
    code += `    call update_jump_component\n`;
    code += `    call update_movement_component\n`;
    code += `    call update_gravity_component\n`;
    code += `    call update_position_component\n\n`;
    code += `    pop hl\n`;
    code += `    pop de\n`;
    code += `    pop bc\n`;
    code += `    pop af\n`;
    code += `    ret\n\n`;
  } else {
    code += `; Task 1 (Physics): Not generated (no movement components detected)\n\n`;
  }

  // Task 2: Collision Detection (if has collisions)
  if (analysis.hasCollisions) {
    code += `; ==================================================================\n`;
    code += `; TASK_UPDATE_COLLISION - Collision detection\n`;
    code += `; ==================================================================\n`;
    code += `; Detects collisions using collision layers (bitmask system)\n`;
    code += `; AABB collision for 16x16 sprites\n`;
    code += `; ==================================================================\n`;
    code += `task_update_collision:\n`;
    code += `    push af\n`;
    code += `    push bc\n`;
    code += `    push de\n`;
    code += `    push hl\n\n`;
    code += `    ; TODO: Implement collision detection\n`;
    code += `    ; Loop over entities with COMP_MASK_COLLISION\n`;
    code += `    ; Check: collisionLayer & collidesWith for each pair\n`;
    code += `    ; AABB test: |X1-X2| < 16 && |Y1-Y2| < 16\n\n`;
    code += `    pop hl\n`;
    code += `    pop de\n`;
    code += `    pop bc\n`;
    code += `    pop af\n`;
    code += `    ret\n\n`;
  } else {
    code += `; Task 2 (Collision): Not generated (no collision detection needed)\n\n`;
  }

  // Task 3: Sprite Rendering (if has sprites)
  if (analysis.hasSprites) {
    code += `; ==================================================================\n`;
    code += `; TASK_UPDATE_SPRITES - Update sprites to VRAM\n`;
    code += `; ==================================================================\n`;
    code += `; WARNING: This task is HEAVY (~800 cycles)\n`;
    code += `; Consider executing every N frames instead of every frame\n`;
    code += `; ==================================================================\n`;
    code += `task_update_sprites:\n`;
    code += `    push af\n`;
    code += `    push bc\n`;
    code += `    push de\n`;
    code += `    push hl\n\n`;
    code += `    ; Call existing sprite update function\n`;
    code += `    call update_sprites_to_vram\n\n`;
    code += `    pop hl\n`;
    code += `    pop de\n`;
    code += `    pop bc\n`;
    code += `    pop af\n`;
    code += `    ret\n\n`;
  } else {
    code += `; Task 3 (Sprites): Not generated (no sprites in project)\n\n`;
  }

  // Task 4: Frame Counter (placeholder for custom timing)
  code += `; ==================================================================\n`;
  code += `; TASK_FRAME_COUNTER - Custom timing/animations\n`;
  code += `; ==================================================================\n`;
  code += `; Placeholder for user-defined frame-based timing\n`;
  code += `; Example: Increment animation timers, etc.\n`;
  code += `; ==================================================================\n`;
  code += `task_frame_counter:\n`;
  code += `    ; Placeholder - counter is already incremented in dispatcher\n`;
  code += `    ; Add custom timing logic here if needed\n`;
  code += `    ret\n\n`;

  // Slots 5-7: User custom (just placeholders)
  code += `; ==================================================================\n`;
  code += `; USER CUSTOM TASK SLOTS (5-7)\n`;
  code += `; ==================================================================\n`;
  code += `; These slots are reserved for user-defined tasks\n`;
  code += `; Enable them dynamically using:\n`;
  code += `;   LD A, 5                    ; Slot 5\n`;
  code += `;   LD HL, my_custom_task\n`;
  code += `;   CALL enable_task\n`;
  code += `; ==================================================================\n\n`;

  return code;
}
