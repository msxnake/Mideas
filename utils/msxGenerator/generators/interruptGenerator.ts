/**
 * @fileoverview Interrupt System Generator for MSX
 * Generates interrupt.asm file with H.TIMI hook-based task system
 * Emulates Konami's technique for V-Blank interrupt handling
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';
import { generateComponentsFile } from './componentsGenerator';
import { analyzeComponentUsage } from '../utils/componentAnalyzer';
import { buildRegisterContractComment } from './registerContract';
import type { ExecutionPlan } from '../types/executionTypes';

export interface InterruptGeneratorConfig {
  interruptDrivenComponents?: boolean;
  romMode?: string;
  hardPlayerTickEnabled?: boolean;
}

/**
 * Generate interrupt.asm file
 */
export function generateInterruptFile(
  analysis: ProjectAnalysis,
  config: InterruptGeneratorConfig = {},
  executionPlan?: ExecutionPlan
): string {
  console.log('ÐYZî [INTERRUPT GENERATOR] Generating interrupt.asm...');
  let code = '';

  code += `; ==================================================================\n`;
  code += `; INTERRUPT TASK SYSTEM - File: interrupt.asm\n`;
  code += `; Konami-style technique: Hook H.TIMI for 50/60Hz task execution\n`;
  code += `; ==================================================================\n\n`;

  // Memory layout
  code += generateInterruptMemoryLayout();

  // Core functions
  code += generateInitInterruptSystem(config.hardPlayerTickEnabled ?? false);
  code += generateStopInterruptSystem();
  code += generateInterruptDispatcher();
  code += generateTaskManagementFunctions();
  code += generateInitDefaultTasksFromPlan(executionPlan, config.romMode);

  // Default tasks
  if (executionPlan?.mode === 'interruptTaskManager') {
    code += generateSharedMainlineTaskWrappers();
    code += generatePlannedTasks(executionPlan);
  } else {
    code += generateDefaultTasks(analysis);
  }

  // Optional: Generate full component systems inside interrupt.asm
  // This makes interrupt.asm self-contained for all ECS routines.
  // NOTE: In this mode, components.asm should be skipped/emptied by the caller to avoid duplicate labels.
  // For megarom: components go in bank 1 as a separate module — never inline here.
  if (config.interruptDrivenComponents && config.romMode !== 'megarom') {
    code += `\n; ==================================================================\n`;
    code += `; COMPONENT SYSTEMS (INLINED)\n`;
    code += `; Generated inside interrupt.asm because interruptDrivenComponents=true\n`;
    code += `; ==================================================================\n\n`;
    code += generateComponentsFile(analysis, config.romMode || 'simple32k');
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
; Variables are defined in variables.asm (dynamically allocated)
; This avoids RAM overlap with entity system arrays
; ==================================================================
; Slots: task_table (8 slots x 2 bytes), task_0_ptr..task_7_ptr
; State: interrupt_system_enabled, old_htimi_hook, interrupt_counter,
;        task_exec_time, vblank_flag
; ==================================================================

`;
}

/**
 * Generate init_interrupt_system routine
 */
function generateInitInterruptSystem(hardPlayerTickEnabled: boolean): string {
  return `; ==================================================================
; INIT_INTERRUPT_SYSTEM - Install H.TIMI hook
; ==================================================================
${buildRegisterContractComment({
  purpose: 'Install JP hook on H.TIMI and initialize interrupt task state.',
  inputs: ['None'],
  outputs: ['None'],
  clobbers: ['AF', 'BC', 'DE', 'HL'],
  preserved: ['None'],
  usage: [
    'HL/DE/BC = block copy parameters for hook backup and task table clear',
    'A = enable flag and zeroing value',
  ],
  notes: ['Runs with DI/EI, so caller must not assume interrupt state is unchanged.'],
})}
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
    ld (interrupt_in_progress), a
    ld (player_hard_tick_lost), a
    ld (player_hard_tick_lost+1), a
    ld (far_call_irq_lock_depth), a
    ld a, ${hardPlayerTickEnabled ? 1 : 0}
    ld (player_hard_tick_enabled), a

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
  return `; @mideas:block id=runtime.interrupt.stop kind=routine owner=interrupt roots=stop_interrupt_system
; ==================================================================
; STOP_INTERRUPT_SYSTEM - Restore original H.TIMI hook
; ==================================================================
${buildRegisterContractComment({
  purpose: 'Restore original H.TIMI bytes and mark system disabled.',
  inputs: ['None'],
  outputs: ['None'],
  clobbers: ['AF', 'BC', 'DE', 'HL'],
  preserved: ['None'],
  usage: [
    'HL/DE/BC = LDIR source/destination/count for hook restore',
    'A = zero flag write to interrupt_system_enabled',
  ],
  notes: ['Runs with DI/EI for atomic hook restoration.'],
})}
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
    ld (player_hard_tick_enabled), a

    ei                          ; Re-enable interrupts
    ret
; @mideas:endblock id=runtime.interrupt.stop

`;
}

/**
 * Generate interrupt_dispatcher (ISR)
 */
function generateInterruptDispatcher(): string {
  return `; @mideas:block id=runtime.interrupt.dispatcher kind=routine owner=interrupt preserve=true roots=interrupt_dispatcher
; ==================================================================
; INTERRUPT_DISPATCHER - Main ISR (60Hz/50Hz)
; ==================================================================
${buildRegisterContractComment({
  purpose: 'Dispatch enabled interrupt tasks each VBlank and chain BIOS hook.',
  inputs: ['Triggered by H.TIMI hook'],
  outputs: ['interrupt_counter incremented', 'vblank_flag refreshed'],
  clobbers: ['AF', 'BC', 'DE', 'HL', 'IX', 'IY (all restored before exit)'],
  preserved: ['DE', 'IX', 'IY'],
  usage: [
    'HL = walks task_table and holds task pointer',
    'B = task slot loop counter',
    'C = temporary low byte for pointer reconstruction',
    'A = enabled checks and pointer validation',
  ],
  notes: ['Dispatcher saves/restores DE/IX/IY defensively, reducing coupling with task internals.'],
})}
; This routine executes on each V-Blank
; CRITICAL: Minimal CPU cycles, maximum efficiency
; Overhead: ~80 cycles base + ~40 cycles per active task
; ==================================================================
interrupt_dispatcher:
    ; --- STEP 1: Save caller-visible registers used by BIOS/user code ---
    push af                     ; 11 cycles
    push hl                     ; 11 cycles
    push bc                     ; 11 cycles
    push de                     ; 11 cycles
    push ix                     ; 15 cycles
    push iy                     ; 15 cycles
    ; Total: 74 cycles fixed prologue overhead

    ld a, 1
    ld (interrupt_in_progress), a

    ; --- STEP 2: Check if system is enabled ---
    ld a, (interrupt_system_enabled)
    or a
    jr z, .exit                 ; If disabled, exit quickly

    ; --- STEP 3: Ack/latch VBlank flag (reads VDP status before gameplay tick) ---
    call update_vblank_flag

    ; --- STEP 4: Increment frame counter ---
    ld hl, (interrupt_counter)
    inc hl
    ld (interrupt_counter), hl

    ; --- STEP 5: Run the non-negotiable Player tick before soft tasks ---
    call run_hard_player_tick

    ; --- STEP 6: Walk through task table (DI ensures no nested interrupts) ---
    di                          ; Disable interrupts for task execution
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
    xor a
    ld (interrupt_in_progress), a

    ; --- STEP 7: Restore registers ---
    pop iy                      ; 14 cycles
    pop ix                      ; 14 cycles
    pop de                      ; 10 cycles
    pop bc                      ; 10 cycles
    pop hl                      ; 10 cycles
    pop af                      ; 10 cycles

    ; --- STEP 8: Return from interrupt ---
    ; For H.TIMI we should chain to the original hook (best compatibility)
    ; and let the BIOS interrupt handler manage EI/RETI.
    jp old_htimi_hook

; Helper for indirect call
.call_task:
    jp (hl)                     ; Jump to task (task will RET back here)

; @mideas:endblock id=runtime.interrupt.dispatcher
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
; NOTE: wait_vblank function removed - use HALT directly in game loop
; HALT is more efficient (no call/ret overhead)
; ==================================================================

; ==================================================================
; UPDATE_VBLANK_FLAG - For interrupt dispatcher use only
; ==================================================================
; @mideas:block id=runtime.interrupt.vblank_flag kind=routine owner=interrupt roots=update_vblank_flag
${buildRegisterContractComment({
  purpose: 'Read VDP status register and latch VBlank state in RAM flag.',
  inputs: ['None'],
  outputs: ['vblank_flag = 0/1'],
  clobbers: ['AF (internally saved/restored)'],
  preserved: ['AF, BC, DE, HL'],
  usage: ['A = VDP status read and boolean conversion'],
})}
; Updates vblank_flag only if we're actually in VBlank
; Called from interrupt_dispatcher
; Inputs: None
; Outputs: None
; Modifies: AF
; ==================================================================
update_vblank_flag:
    push af
    in a, (#99)                 ; Read VDP status register
    bit 7, a                    ; Are we in VBlank?
    jr z, .not_in_vblank
    ld a, 1
    ld (vblank_flag), a
    jr .uvf_done
.not_in_vblank:
    xor a
    ld (vblank_flag), a
.uvf_done:
    pop af
    ret
; @mideas:endblock id=runtime.interrupt.vblank_flag

; ==================================================================
; RUN_HARD_PLAYER_TICK - Optional hard realtime Player slice
; ==================================================================
; @mideas:block id=runtime.interrupt.hard_player_tick kind=routine owner=interrupt roots=run_hard_player_tick
${buildRegisterContractComment({
  purpose: 'Run the optional VBlank hard Player pipeline before deferred tasks.',
  inputs: ['player_hard_tick_enabled', 'current_screen_engine', 'Player runtime RAM'],
  outputs: [
    'input buffers refreshed',
    'Player state/movement/collision/animation refreshed',
    'Player SAT bytes uploaded before soft sprite work',
    'player_hard_tick_lost incremented if the slice is skipped by lock state',
  ],
  clobbers: ['AF', 'BC', 'DE', 'HL'],
  preserved: ['AF, BC, DE, HL (by push/pop wrapper)', 'IX', 'IY'],
  usage: [
    'A = enable/engine/lock checks',
    'BC/DE/HL = scratch inside called Player fastpaths',
  ],
  notes: [
    'Disabled by default until a ROM opts in via interruptConfig.enableHardPlayerTick.',
    'Line interrupts must not call this path or increment interrupt_counter.',
  ],
})}
run_hard_player_tick:
    push af
    push bc
    push de
    push hl

    ld a, (player_hard_tick_enabled)
    or a
    jp z, .hard_player_done

    ; Do not enter mapper/VRAM-sensitive Player code while a far trampoline owns
    ; an IRQ-masked mapper window. Count the missed hard tick for debug builds.
    ld a, (far_call_irq_lock_depth)
    or a
    jp z, .hard_player_unlocked
    ld hl, player_hard_tick_lost
    inc (hl)
    jp nz, .hard_player_done
    inc hl
    inc (hl)
    jp .hard_player_done

.hard_player_unlocked:
    ld a, (current_screen_engine)
    or a
    jp nz, .hard_player_done

    ; HARD_PLAYER: input -> player state -> player sprite RAM -> player SAT only.
    call task_update_input
    call update_player_realtime_pipeline
    call upload_player_sprites_to_vram

.hard_player_done:
    pop hl
    pop de
    pop bc
    pop af
    ret
; @mideas:endblock id=runtime.interrupt.hard_player_tick

; ==================================================================
; ENABLE_TASK - Activate a task in the system
; ==================================================================
; @mideas:block id=runtime.interrupt.task_api kind=routine owner=interrupt roots=enable_task,disable_task,get_frame_count
${buildRegisterContractComment({
  purpose: 'Store routine pointer into task_table slot.',
  inputs: ['A = task slot (0-7)', 'HL = task routine address'],
  outputs: ['task_table[slot] = HL'],
  clobbers: ['AF', 'BC', 'DE', 'HL'],
  preserved: ['None'],
  usage: [
    'A = slot validation and offset math',
    'DE = holds routine address while HL is repurposed as slot pointer',
    'BC = task_table base address',
    'HL = slot address calculation / pointer write',
  ],
})}
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
${buildRegisterContractComment({
  purpose: 'Clear routine pointer in selected task slot.',
  inputs: ['A = task slot (0-7)'],
  outputs: ['task_table[slot] = 0'],
  clobbers: ['AF', 'DE', 'HL'],
  preserved: ['BC'],
  usage: [
    'A = slot validation and zero value for clearing',
    'HL = destination slot pointer',
    'DE = computed slot offset',
  ],
})}
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
${buildRegisterContractComment({
  purpose: 'Expose current 16-bit interrupt frame counter.',
  inputs: ['None'],
  outputs: ['HL = interrupt_counter'],
  clobbers: ['HL'],
  preserved: ['AF', 'BC', 'DE'],
  usage: ['HL = loaded return value'],
})}
; Inputs: None
; Outputs: HL = frame count (16-bit)
; Modifies: HL
; ==================================================================
get_frame_count:
    ld hl, (interrupt_counter)
    ret
; @mideas:endblock id=runtime.interrupt.task_api

`;
}

function generateInitDefaultTasksFromPlan(executionPlan?: ExecutionPlan, romMode: string = 'simple32k'): string {
  const tasks = executionPlan?.mode === 'interruptTaskManager'
    ? executionPlan.tasks.filter((task) => task.enabledAtBoot)
    : [];

  let code = `; ==================================================================\n`;
  code += `; INIT_DEFAULT_TASKS_FROM_PLAN - Register engine-selected IRQ tasks\n`;
  code += `; @mideas:block id=runtime.interrupt.task_input kind=routine owner=interrupt roots=task_update_input\n`;
  code += `; ==================================================================\n`;
  code += buildRegisterContractComment({
    purpose: 'Enable the IRQ task set selected by the engine execution plan.',
    inputs: ['None'],
    outputs: ['task_table updated for all enabled-at-boot tasks'],
    clobbers: ['AF', 'HL'],
    preserved: ['BC', 'DE'],
    usage: ['A = task slot', 'HL = task routine address'],
    notes: ['Calls enable_task once per enabled task.'],
  });
  code += `init_default_tasks_from_plan:\n`;

  if (tasks.length === 0) {
    code += `    ret\n\n`;
    return code;
  }

  const resolveTaskLabel = (label: string): string => {
    if (romMode !== 'megarom') return label;
    const residentTaskLabels: Record<string, string> = {
      task_audio_tick: 'call_task_audio_tick_resident',
      music_update: 'call_music_update_resident',
      sfx_update: 'call_sfx_update_resident',
    };
    return residentTaskLabels[label] || label;
  };

  tasks.forEach((task) => {
    code += `    ld a, ${task.slot}\n`;
    code += `    ld hl, ${resolveTaskLabel(task.routineLabel)}\n`;
    code += `    call enable_task\n`;
  });
  code += `    ret\n\n`;
  return code;
}

function generatePlannedTasks(executionPlan: ExecutionPlan): string {
  const hasFrameCounterTask = executionPlan.tasks.some((task) => task.routineLabel === 'task_frame_counter');
  let code = `; ==================================================================\n`;
  code += `; ENGINE EXECUTION PLAN TASKS\n`;
  code += `; ==================================================================\n\n`;

  if (executionPlan.tasks.length === 0) {
    code += `; No IRQ tasks selected by engine execution plan.\n\n`;
  } else {
    executionPlan.tasks.forEach((task) => {
      code += `; Slot ${task.slot}: ${task.id} -> ${task.routineLabel} (period=${task.period})\n`;
    });
    code += `\n`;
  }

  if (hasFrameCounterTask) {
    code += generateFrameCounterTask();
  }

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

function generateSharedMainlineTaskWrappers(): string {
  let code = `; ==================================================================\n`;
  code += `; SHARED MAINLINE TASK WRAPPERS\n`;
  code += `; ==================================================================\n`;
  code += `; These wrappers stay available in interruptTaskManager mode because\n`;
  code += `; the HALT-driven GameFlow loops still call them directly.\n`;
  code += `; ==================================================================\n\n`;

  code += `; ==================================================================\n`;
  code += `; TASK_UPDATE_INPUT - Joystick/Cursor polling wrapper\n`;
  code += `; ==================================================================\n`;
  code += buildRegisterContractComment({
    purpose: 'Poll joystick + keyboard fallback and update input state buffers.',
    inputs: ['Reads hardware via FAST_GTSTCK / FAST_GTTRIG and BIOS SNSMAT for keyboard rows'],
    outputs: ['input_state, prev_input_state, input_btn_curr, input_btn_prev, input_fire'],
    clobbers: ['AF', 'BC', 'DE'],
    preserved: ['AF', 'BC', 'DE (by push/pop wrapper)', 'HL'],
    usage: [
      'A = hardware reads and final scalar writes',
      'B = direction accumulator',
      'C = logical button bitmask after control remap',
      'D = physical button bitmask and keyboard direction flags',
      'E = temporary keyboard row bits',
    ],
    notes: ['Wrapper preserves caller-visible regs despite internal mutation.'],
  });
  code += `task_update_input:\n`;
  code += `    push af\n`;
  code += `    push bc\n`;
  code += `    push de\n`;
  code += `    push hl\n\n`;
  code += `    ; Save previous state\n`;
  code += `    ld a, (input_state)\n`;
  code += `    ld (prev_input_state), a\n`;
  code += `    ld a, (input_btn_curr)\n`;
  code += `    ld (input_btn_prev), a\n\n`;
  code += `    ; Read joystick direction first (priority source, direct hardware)\n`;
  code += `    xor a                       ; Joystick 0\n`;
  code += `    call FAST_GTSTCK            ; Direct hardware read\n`;
  code += `    ld b, a                     ; B = joystick direction\n`;
  code += `    or a\n`;
  code += `    jp nz, .dir_ready\n\n`;
  code += `    ; Fallback to keyboard cursor keys (row 8). Use BIOS SNSMAT here so\n`;
  code += `    ; OpenMSX keymatrix probes and real keyboard scans share one path.\n`;
  code += `    ld a, 8\n`;
  code += `    call SNSMAT                 ; Active low bits\n`;
  code += `    ld e, a\n`;
  code += `    xor a\n`;
  code += `    ld d, a                     ; D = direction flags: 0=none\n`;
  code += `    bit 5, e                    ; Up\n`;
  code += `    jr nz, .kbd_no_up\n`;
  code += `    set 0, d\n`;
  code += `.kbd_no_up:\n`;
  code += `    bit 6, e                    ; Down\n`;
  code += `    jr nz, .kbd_no_down\n`;
  code += `    set 1, d\n`;
  code += `.kbd_no_down:\n`;
  code += `    bit 4, e                    ; Left\n`;
  code += `    jr nz, .kbd_no_left\n`;
  code += `    set 2, d\n`;
  code += `.kbd_no_left:\n`;
  code += `    bit 7, e                    ; Right\n`;
  code += `    jr nz, .kbd_no_right\n`;
  code += `    set 3, d\n`;
  code += `.kbd_no_right:\n`;
  code += `    ; Cancel impossible opposite cursor pairs before mapping to STICK_*\n`;
  code += `    bit 0, d                    ; Up pressed?\n`;
  code += `    jr z, .kbd_vertical_ok\n`;
  code += `    bit 1, d                    ; Down also pressed?\n`;
  code += `    jr z, .kbd_vertical_ok\n`;
  code += `    res 0, d\n`;
  code += `    res 1, d\n`;
  code += `.kbd_vertical_ok:\n`;
  code += `    bit 2, d                    ; Left pressed?\n`;
  code += `    jr z, .kbd_opposites_done\n`;
  code += `    bit 3, d                    ; Right also pressed?\n`;
  code += `    jr z, .kbd_opposites_done\n`;
  code += `    res 2, d\n`;
  code += `    res 3, d\n`;
  code += `.kbd_opposites_done:\n`;
  code += `    xor a\n`;
  code += `    bit 0, d\n`;
  code += `    jr z, .kbd_check_down\n`;
  code += `    bit 3, d\n`;
  code += `    jr nz, .kbd_upright\n`;
  code += `    bit 2, d\n`;
  code += `    jr nz, .kbd_upleft\n`;
  code += `    ld a, STICK_UP\n`;
  code += `    jr .kbd_done\n`;
  code += `.kbd_upright:\n`;
  code += `    ld a, STICK_UPRIGHT\n`;
  code += `    jr .kbd_done\n`;
  code += `.kbd_upleft:\n`;
  code += `    ld a, STICK_UPLEFT\n`;
  code += `    jr .kbd_done\n`;
  code += `.kbd_check_down:\n`;
  code += `    bit 1, d\n`;
  code += `    jr z, .kbd_check_lr\n`;
  code += `    bit 3, d\n`;
  code += `    jr nz, .kbd_downright\n`;
  code += `    bit 2, d\n`;
  code += `    jr nz, .kbd_downleft\n`;
  code += `    ld a, STICK_DOWN\n`;
  code += `    jr .kbd_done\n`;
  code += `.kbd_downright:\n`;
  code += `    ld a, STICK_DOWNRIGHT\n`;
  code += `    jr .kbd_done\n`;
  code += `.kbd_downleft:\n`;
  code += `    ld a, STICK_DOWNLEFT\n`;
  code += `    jr .kbd_done\n`;
  code += `.kbd_check_lr:\n`;
  code += `    bit 2, d\n`;
  code += `    jr z, .kbd_check_right\n`;
  code += `    ld a, STICK_LEFT\n`;
  code += `    jr .kbd_done\n`;
  code += `.kbd_check_right:\n`;
  code += `    bit 3, d\n`;
  code += `    jr z, .kbd_done\n`;
  code += `    ld a, STICK_RIGHT\n`;
  code += `.kbd_done:\n`;
  code += `    ld b, a\n`;
  code += `.dir_ready:\n`;
  code += `    ; Normalize diagonals to cardinal directions for runtime stability\n`;
  code += `    ; UP+RIGHT/DOWN+RIGHT -> RIGHT, UP+LEFT/DOWN+LEFT -> LEFT\n`;
  code += `    ld a, b\n`;
  code += `    cp STICK_UPRIGHT\n`;
  code += `    jr z, .dir_norm_right\n`;
  code += `    cp STICK_DOWNRIGHT\n`;
  code += `    jr z, .dir_norm_right\n`;
  code += `    cp STICK_UPLEFT\n`;
  code += `    jr z, .dir_norm_left\n`;
  code += `    cp STICK_DOWNLEFT\n`;
  code += `    jr z, .dir_norm_left\n`;
  code += `    jr .dir_norm_done\n`;
  code += `.dir_norm_right:\n`;
  code += `    ld a, STICK_RIGHT\n`;
  code += `    jr .dir_norm_store\n`;
  code += `.dir_norm_left:\n`;
  code += `    ld a, STICK_LEFT\n`;
  code += `.dir_norm_store:\n`;
  code += `    ld b, a\n`;
  code += `.dir_norm_done:\n`;
  code += `    ld d, 0                     ; D = physical button bitmask (bit0=button1, bit1=button2)\n`;
  code += `    xor a                       ; Joystick 0 button A -> physical button 1\n`;
  code += `    call FAST_GTTRIG            ; A = #FF if pressed, 0 if not\n`;
  code += `    or a\n`;
  code += `    jr z, .phys_btn1_keyboard\n`;
  code += `    set 0, d\n`;
  code += `.phys_btn1_keyboard:\n`;
  code += `    ld a, (input_key_button1_mode)\n`;
  code += `    or a\n`;
  code += `    jr nz, .phys_btn1_ctrl\n`;
  code += `    ld a, 8                    ; SPACE row\n`;
  code += `    call SNSMAT\n`;
  code += `    bit 0, a                   ; SPC (active low)\n`;
  code += `    jr nz, .phys_btn1_done\n`;
  code += `    set 0, d\n`;
  code += `    jr .phys_btn1_done\n`;
  code += `.phys_btn1_ctrl:\n`;
  code += `    ld a, 6                    ; CTRL row\n`;
  code += `    call SNSMAT\n`;
  code += `    bit 2, a                   ; CTRL (active low)\n`;
  code += `    jr nz, .phys_btn1_done\n`;
  code += `    set 0, d\n`;
  code += `.phys_btn1_done:\n`;
  code += `    ; Joystick button B or configured keyboard key -> physical button 2\n`;
  code += `    push bc\n`;
  code += `    push hl\n`;
  code += `    ld a, 3                    ; GTTRIG(3) = joystick 1 button B\n`;
  code += `    call GTTRIG\n`;
  code += `    ld e, a\n`;
  code += `    pop hl\n`;
  code += `    pop bc\n`;
  code += `    ld a, e\n`;
  code += `    or a\n`;
  code += `    jr z, .phys_btn2_keyboard\n`;
  code += `    set 1, d\n`;
  code += `.phys_btn2_keyboard:\n`;
  code += `    ld a, (input_key_button2_mode)\n`;
  code += `    or a\n`;
  code += `    jr nz, .phys_btn2_ctrl\n`;
  code += `    ld a, 4                    ; Keyboard row containing N\n`;
  code += `    call SNSMAT\n`;
  code += `    bit 3, a                   ; N key (active low)\n`;
  code += `    jr nz, .phys_btn2_done\n`;
  code += `    set 1, d\n`;
  code += `    jr .phys_btn2_done\n`;
  code += `.phys_btn2_ctrl:\n`;
  code += `    ld a, 6                    ; CTRL row\n`;
  code += `    call SNSMAT\n`;
  code += `    bit 2, a                   ; CTRL (active low)\n`;
  code += `    jr nz, .phys_btn2_done\n`;
  code += `    set 1, d\n`;
  code += `.phys_btn2_done:\n`;
  code += `    ld c, 0                    ; C = logical buttons after action remap\n`;
  code += `    ld a, (control_jump_button)\n`;
  code += `    or a\n`;
  code += `    jr nz, .jump_uses_btn2\n`;
  code += `    bit 0, d\n`;
  code += `    jr z, .jump_done\n`;
  code += `    set 0, c                   ; logical fire/jump\n`;
  code += `    jr .jump_done\n`;
  code += `.jump_uses_btn2:\n`;
  code += `    bit 1, d\n`;
  code += `    jr z, .jump_done\n`;
  code += `    set 0, c\n`;
  code += `.jump_done:\n`;
  code += `    ld a, (control_action_button)\n`;
  code += `    or a\n`;
  code += `    jr nz, .action_uses_btn2\n`;
  code += `    bit 0, d\n`;
  code += `    jr z, .action_done\n`;
  code += `    set 1, c                   ; logical action/grab\n`;
  code += `    jr .action_done\n`;
  code += `.action_uses_btn2:\n`;
  code += `    bit 1, d\n`;
  code += `    jr z, .action_done\n`;
  code += `    set 1, c\n`;
  code += `.action_done:\n`;
  code += `    ld a, c\n`;
  code += `    and INPUT_BTN_FIRE\n`;
  code += `    jr z, .fire_state_released\n`;
  code += `    ld a, 1\n`;
  code += `    jr .store_fire_state\n`;
  code += `.fire_state_released:\n`;
  code += `    xor a\n`;
  code += `.store_fire_state:\n`;
  code += `    ld (input_fire), a\n`;
  code += `    ld a, b\n`;
  code += `    ld (input_state), a\n`;
  code += `    ld a, c\n`;
  code += `    ld (input_btn_curr), a\n\n`;
  code += `    pop hl\n`;
  code += `    pop de\n`;
  code += `    pop bc\n`;
  code += `    pop af\n`;
  code += `    ret\n\n`;
  code += `; @mideas:endblock id=runtime.interrupt.task_input\n\n`;

  return code;
}

function generateFrameCounterTask(): string {
  let code = `; ==================================================================\n`;
  code += `; TASK_FRAME_COUNTER - Custom timing/animations\n`;
  code += `; ==================================================================\n`;
  code += `; Placeholder for user-defined frame-based timing\n`;
  code += `; interrupt_counter is already incremented in dispatcher\n`;
  code += `; ==================================================================\n`;
  code += buildRegisterContractComment({
    purpose: 'Optional per-frame timing hook for lightweight counters/animations.',
    inputs: ['None'],
    outputs: ['None'],
    clobbers: ['None'],
    preserved: ['AF', 'BC', 'DE', 'HL'],
    usage: ['No registers modified in the default implementation'],
  });
  code += `task_frame_counter:\n`;
  code += `    ; Placeholder - counter is already incremented in dispatcher\n`;
  code += `    ; Add custom timing logic here if needed\n`;
  code += `    ret\n\n`;
  return code;
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
  code += buildRegisterContractComment({
    purpose: 'Poll joystick + keyboard fallback and update input state buffers.',
    inputs: ['Reads hardware via FAST_GTSTCK / FAST_GTTRIG and BIOS SNSMAT for keyboard rows'],
    outputs: ['input_state, prev_input_state, input_btn_curr, input_btn_prev, input_fire'],
    clobbers: ['AF', 'BC', 'DE'],
    preserved: ['AF', 'BC', 'DE (by push/pop wrapper)', 'HL'],
    usage: [
      'A = hardware reads and final scalar writes',
      'B = direction accumulator',
      'C = logical button bitmask after control remap',
      'D = physical button bitmask and keyboard direction flags',
      'E = temporary keyboard row bits',
    ],
    notes: ['Wrapper preserves caller-visible regs despite internal mutation.'],
  });
  code += `task_update_input:\n`;
  code += `    push af\n`;
  code += `    push bc\n`;
  code += `    push de\n`;
  code += `    push hl\n\n`;
  code += `    ; Save previous state\n`;
  code += `    ld a, (input_state)\n`;
  code += `    ld (prev_input_state), a\n`;
  code += `    ld a, (input_btn_curr)\n`;
  code += `    ld (input_btn_prev), a\n\n`;
  code += `    ; Read joystick direction first (priority source, direct hardware)\n`;
  code += `    xor a                       ; Joystick 0\n`;
  code += `    call FAST_GTSTCK            ; Direct hardware read\n`;
  code += `    ld b, a                     ; B = joystick direction\n`;
  code += `    or a\n`;
  code += `    jp nz, .dir_ready\n\n`;
  code += `    ; Fallback to keyboard cursor keys (row 8). Use BIOS SNSMAT here so\n`;
  code += `    ; OpenMSX keymatrix probes and real keyboard scans share one path.\n`;
  code += `    ld a, 8\n`;
  code += `    call SNSMAT                 ; Active low bits\n`;
  code += `    ld e, a\n`;
  code += `    xor a\n`;
  code += `    ld d, a                     ; D = direction flags: 0=none\n`;
  code += `    bit 5, e                    ; Up\n`;
  code += `    jr nz, .kbd_no_up\n`;
  code += `    set 0, d\n`;
  code += `.kbd_no_up:\n`;
  code += `    bit 6, e                    ; Down\n`;
  code += `    jr nz, .kbd_no_down\n`;
  code += `    set 1, d\n`;
  code += `.kbd_no_down:\n`;
  code += `    bit 4, e                    ; Left\n`;
  code += `    jr nz, .kbd_no_left\n`;
  code += `    set 2, d\n`;
  code += `.kbd_no_left:\n`;
  code += `    bit 7, e                    ; Right\n`;
  code += `    jr nz, .kbd_no_right\n`;
  code += `    set 3, d\n`;
  code += `.kbd_no_right:\n`;
  code += `    ; Cancel impossible opposite cursor pairs before mapping to STICK_*\n`;
  code += `    bit 0, d                    ; Up pressed?\n`;
  code += `    jr z, .kbd_vertical_ok\n`;
  code += `    bit 1, d                    ; Down also pressed?\n`;
  code += `    jr z, .kbd_vertical_ok\n`;
  code += `    res 0, d\n`;
  code += `    res 1, d\n`;
  code += `.kbd_vertical_ok:\n`;
  code += `    bit 2, d                    ; Left pressed?\n`;
  code += `    jr z, .kbd_opposites_done\n`;
  code += `    bit 3, d                    ; Right also pressed?\n`;
  code += `    jr z, .kbd_opposites_done\n`;
  code += `    res 2, d\n`;
  code += `    res 3, d\n`;
  code += `.kbd_opposites_done:\n`;
  code += `    xor a\n`;
  code += `    bit 0, d\n`;
  code += `    jr z, .kbd_check_down\n`;
  code += `    bit 3, d\n`;
  code += `    jr nz, .kbd_upright\n`;
  code += `    bit 2, d\n`;
  code += `    jr nz, .kbd_upleft\n`;
  code += `    ld a, STICK_UP\n`;
  code += `    jr .kbd_done\n`;
  code += `.kbd_upright:\n`;
  code += `    ld a, STICK_UPRIGHT\n`;
  code += `    jr .kbd_done\n`;
  code += `.kbd_upleft:\n`;
  code += `    ld a, STICK_UPLEFT\n`;
  code += `    jr .kbd_done\n`;
  code += `.kbd_check_down:\n`;
  code += `    bit 1, d\n`;
  code += `    jr z, .kbd_check_lr\n`;
  code += `    bit 3, d\n`;
  code += `    jr nz, .kbd_downright\n`;
  code += `    bit 2, d\n`;
  code += `    jr nz, .kbd_downleft\n`;
  code += `    ld a, STICK_DOWN\n`;
  code += `    jr .kbd_done\n`;
  code += `.kbd_downright:\n`;
  code += `    ld a, STICK_DOWNRIGHT\n`;
  code += `    jr .kbd_done\n`;
  code += `.kbd_downleft:\n`;
  code += `    ld a, STICK_DOWNLEFT\n`;
  code += `    jr .kbd_done\n`;
  code += `.kbd_check_lr:\n`;
  code += `    bit 2, d\n`;
  code += `    jr z, .kbd_check_right\n`;
  code += `    ld a, STICK_LEFT\n`;
  code += `    jr .kbd_done\n`;
  code += `.kbd_check_right:\n`;
  code += `    bit 3, d\n`;
  code += `    jr z, .kbd_done\n`;
  code += `    ld a, STICK_RIGHT\n`;
  code += `.kbd_done:\n`;
  code += `    ld b, a\n`;
  code += `.dir_ready:\n`;
  code += `    ; Normalize diagonals to cardinal directions for runtime stability\n`;
  code += `    ; UP+RIGHT/DOWN+RIGHT -> RIGHT, UP+LEFT/DOWN+LEFT -> LEFT\n`;
  code += `    ld a, b\n`;
  code += `    cp STICK_UPRIGHT\n`;
  code += `    jr z, .dir_norm_right\n`;
  code += `    cp STICK_DOWNRIGHT\n`;
  code += `    jr z, .dir_norm_right\n`;
  code += `    cp STICK_UPLEFT\n`;
  code += `    jr z, .dir_norm_left\n`;
  code += `    cp STICK_DOWNLEFT\n`;
  code += `    jr z, .dir_norm_left\n`;
  code += `    jr .dir_norm_done\n`;
  code += `.dir_norm_right:\n`;
  code += `    ld a, STICK_RIGHT\n`;
  code += `    jr .dir_norm_store\n`;
  code += `.dir_norm_left:\n`;
  code += `    ld a, STICK_LEFT\n`;
  code += `.dir_norm_store:\n`;
  code += `    ld b, a\n`;
  code += `.dir_norm_done:\n`;
  code += `    ld d, 0                     ; D = physical button bitmask (bit0=button1, bit1=button2)\n`;
  code += `    xor a                       ; Joystick 0 button A -> physical button 1\n`;
  code += `    call FAST_GTTRIG            ; A = #FF if pressed, 0 if not\n`;
  code += `    or a\n`;
  code += `    jr z, .phys_btn1_keyboard\n`;
  code += `    set 0, d\n`;
  code += `.phys_btn1_keyboard:\n`;
  code += `    ld a, (input_key_button1_mode)\n`;
  code += `    or a\n`;
  code += `    jr nz, .phys_btn1_ctrl\n`;
  code += `    ld a, 8                    ; SPACE row\n`;
  code += `    call SNSMAT\n`;
  code += `    bit 0, a                   ; SPC (active low)\n`;
  code += `    jr nz, .phys_btn1_done\n`;
  code += `    set 0, d\n`;
  code += `    jr .phys_btn1_done\n`;
  code += `.phys_btn1_ctrl:\n`;
  code += `    ld a, 6                    ; CTRL row\n`;
  code += `    call SNSMAT\n`;
  code += `    bit 2, a                   ; CTRL (active low)\n`;
  code += `    jr nz, .phys_btn1_done\n`;
  code += `    set 0, d\n`;
  code += `.phys_btn1_done:\n`;
  code += `    ; Joystick button B or configured keyboard key -> physical button 2\n`;
  code += `    push bc\n`;
  code += `    push hl\n`;
  code += `    ld a, 3                    ; GTTRIG(3) = joystick 1 button B\n`;
  code += `    call GTTRIG\n`;
  code += `    ld e, a\n`;
  code += `    pop hl\n`;
  code += `    pop bc\n`;
  code += `    ld a, e\n`;
  code += `    or a\n`;
  code += `    jr z, .phys_btn2_keyboard\n`;
  code += `    set 1, d\n`;
  code += `.phys_btn2_keyboard:\n`;
  code += `    ld a, (input_key_button2_mode)\n`;
  code += `    or a\n`;
  code += `    jr nz, .phys_btn2_ctrl\n`;
  code += `    ld a, 4                    ; Keyboard row containing N\n`;
  code += `    call SNSMAT\n`;
  code += `    bit 3, a                   ; N key (active low)\n`;
  code += `    jr nz, .phys_btn2_done\n`;
  code += `    set 1, d\n`;
  code += `    jr .phys_btn2_done\n`;
  code += `.phys_btn2_ctrl:\n`;
  code += `    ld a, 6                    ; CTRL row\n`;
  code += `    call SNSMAT\n`;
  code += `    bit 2, a                   ; CTRL (active low)\n`;
  code += `    jr nz, .phys_btn2_done\n`;
  code += `    set 1, d\n`;
  code += `.phys_btn2_done:\n`;
  code += `    ld c, 0                    ; C = logical buttons after action remap\n`;
  code += `    ld a, (control_jump_button)\n`;
  code += `    or a\n`;
  code += `    jr nz, .jump_uses_btn2\n`;
  code += `    bit 0, d\n`;
  code += `    jr z, .jump_done\n`;
  code += `    set 0, c                   ; logical fire/jump\n`;
  code += `    jr .jump_done\n`;
  code += `.jump_uses_btn2:\n`;
  code += `    bit 1, d\n`;
  code += `    jr z, .jump_done\n`;
  code += `    set 0, c\n`;
  code += `.jump_done:\n`;
  code += `    ld a, (control_action_button)\n`;
  code += `    or a\n`;
  code += `    jr nz, .action_uses_btn2\n`;
  code += `    bit 0, d\n`;
  code += `    jr z, .action_done\n`;
  code += `    set 1, c                   ; logical action/grab\n`;
  code += `    jr .action_done\n`;
  code += `.action_uses_btn2:\n`;
  code += `    bit 1, d\n`;
  code += `    jr z, .action_done\n`;
  code += `    set 1, c\n`;
  code += `.action_done:\n`;
  code += `    ld a, c\n`;
  code += `    and INPUT_BTN_FIRE\n`;
  code += `    jr z, .fire_state_released\n`;
  code += `    ld a, 1\n`;
  code += `    jr .store_fire_state\n`;
  code += `.fire_state_released:\n`;
  code += `    xor a\n`;
  code += `.store_fire_state:\n`;
  code += `    ld (input_fire), a\n`;
  code += `    ld a, b\n`;
  code += `    ld (input_state), a\n`;
  code += `    ld a, c\n`;
  code += `    ld (input_btn_curr), a\n\n`;
  code += `    pop hl\n`;
  code += `    pop de\n`;
  code += `    pop bc\n`;
  code += `    pop af\n`;
  code += `    ret\n\n`;
  code += `; @mideas:endblock id=runtime.interrupt.task_input\n\n`;

  // Task 1: Physics Update (OPTIMIZED - only generates calls for used components)
  if (analysis.hasEntities) {
    // Analyze which physics components are actually used
    const componentUsage = analyzeComponentUsage(analysis);
    const usedComponents = componentUsage.usedComponents;

    // Check which physics systems are needed
    const hasJump = usedComponents.has('Jump');
    const hasMovement = usedComponents.has('Movement') || usedComponents.has('Cursors');
    const hasGravity = usedComponents.has('Gravity');
    const needsPhysics = hasJump || hasMovement || hasGravity;

    if (needsPhysics) {
      code += `; ==================================================================\n`;
      code += `; TASK_UPDATE_PHYSICS - Apply vx, vy -> X, Y (OPTIMIZED)\n`;
      code += `; ==================================================================\n`;
      code += `; Only calls physics systems that are actually used in this project\n`;
      code += `; ==================================================================\n`;
      code += buildRegisterContractComment({
        purpose: 'Run selected physics component systems in deterministic order.',
        inputs: ['Entity/component RAM tables'],
        outputs: ['Entity motion state updated'],
        clobbers: ['AF', 'BC', 'DE', 'HL'],
        preserved: ['AF', 'BC', 'DE', 'HL (by push/pop wrapper)'],
        usage: ['Registers are scratch during component calls; wrapper restores caller context.'],
      });
      code += `task_update_physics:\n`;
      code += `    push af\n`;
      code += `    push bc\n`;
      code += `    push de\n`;
      code += `    push hl\n\n`;
      code += `    ; Keep system loops in sync with current component masks\n`;
      code += `    call rebuild_used_entity_list\n`;

      // Only generate calls for used components
      if (hasJump) {
        code += `    call update_jump_component      ; Jump impulse\n`;
      }
      if (hasMovement) {
        code += `    call update_movement_component  ; Movement/velocity\n`;
      }
      if (hasGravity) {
        code += `    call update_gravity_component   ; Gravity acceleration\n`;
      }
      // Position is always needed if any physics runs
      code += `    call update_position_component  ; Apply velocity to position\n\n`;

      code += `    pop hl\n`;
      code += `    pop de\n`;
      code += `    pop bc\n`;
      code += `    pop af\n`;
      code += `    ret\n\n`;
    } else {
      code += `; Task 1 (Physics): Minimal - only position update (no Jump/Movement/Gravity used)\n`;
      code += `task_update_physics:\n`;
      code += `    call rebuild_used_entity_list  ; Keep compact entity list updated\n`;
      code += `    call update_position_component  ; Just apply any existing velocities\n`;
      code += `    ret\n\n`;
    }
  } else {
    code += `; Task 1 (Physics): Not generated (no entities detected)\n\n`;
  }

  // Task 2: Collision Detection (if has collisions)
  if (analysis.hasCollisions) {
    code += `; ==================================================================\n`;
    code += `; TASK_UPDATE_COLLISION - Collision detection\n`;
    code += `; ==================================================================\n`;
    code += `; Detects collisions using collision layers (bitmask system)\n`;
    code += `; AABB collision for 16x16 sprites\n`;
    code += `; ==================================================================\n`;
    code += buildRegisterContractComment({
      purpose: 'Interrupt task wrapper for collision system (placeholder).',
      inputs: ['Entity collision data'],
      outputs: ['Collision flags/tables (when implemented)'],
      clobbers: ['AF', 'BC', 'DE', 'HL'],
      preserved: ['AF', 'BC', 'DE', 'HL (by push/pop wrapper)'],
    });
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
    code += buildRegisterContractComment({
      purpose: 'Interrupt-safe wrapper for sprite SAT upload routine.',
      inputs: ['Sprite component buffers'],
      outputs: ['VRAM sprite attribute/pattern tables updated'],
      clobbers: ['AF', 'BC', 'DE', 'HL'],
      preserved: ['AF', 'BC', 'DE', 'HL (by push/pop wrapper)'],
    });
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

  if ((analysis.tracks && analysis.tracks.length > 0) || (analysis.stateMachines && analysis.stateMachines.length > 0)) {
    code += `; ==================================================================\n`;
    code += `; TASK_UPDATE_MUSIC - Fixed-rate audio tick\n`;
    code += `; ==================================================================\n`;
    code += `; Keeps tracker and state-machine audio tied to H.TIMI instead of variable-cost loops\n`;
    code += `; ==================================================================\n`;
    code += buildRegisterContractComment({
      purpose: 'Interrupt-safe wrapper for tracker/state-machine audio tick.',
      inputs: ['Music engine RAM state and state-machine sound cursors'],
      outputs: ['PSG state advanced once per VBlank'],
      clobbers: ['AF', 'BC', 'DE', 'HL'],
      preserved: ['AF', 'BC', 'DE', 'HL (by push/pop wrapper)'],
    });
    code += `task_update_music:\n`;
    code += `    push af\n`;
    code += `    push bc\n`;
    code += `    push de\n`;
    code += `    push hl\n\n`;
    code += `    ld hl, prof_music_task_calls\n`;
    code += `    inc (hl)\n`;
    code += `    jr nz, .music_prof_counted\n`;
    code += `    inc hl\n`;
    code += `    inc (hl)\n`;
    code += `.music_prof_counted:\n`;
    code += `    call music_update\n`;
    if (analysis.stateMachines && analysis.stateMachines.length > 0) {
      code += `    call SM_UpdateSound\n`;
    }
    code += `\n`;
    code += `    pop hl\n`;
    code += `    pop de\n`;
    code += `    pop bc\n`;
    code += `    pop af\n`;
    code += `    ret\n\n`;
  } else {
    code += `; TASK_UPDATE_MUSIC: Not generated (no tracker/state-machine audio in project)\n\n`;
  }

  // Task 4: Frame Counter (placeholder for custom timing)
  code += `; ==================================================================\n`;
  code += `; TASK_FRAME_COUNTER - Custom timing/animations\n`;
  code += `; ==================================================================\n`;
  code += `; Placeholder for user-defined frame-based timing\n`;
  code += `; Example: Increment animation timers, etc.\n`;
  code += `; ==================================================================\n`;
  code += buildRegisterContractComment({
    purpose: 'Reserved slot for user timing logic.',
    inputs: ['None'],
    outputs: ['None by default'],
    clobbers: ['None by default'],
    preserved: ['All (default empty implementation)'],
  });
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
