var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var interruptGenerator_exports = {};
__export(interruptGenerator_exports, {
  generateInterruptFile: () => generateInterruptFile
});
module.exports = __toCommonJS(interruptGenerator_exports);
var import_componentsGenerator = require("./componentsGenerator");
var import_componentAnalyzer = require("../utils/componentAnalyzer");
var import_registerContract = require("./registerContract");
function generateInterruptFile(analysis, config = {}, executionPlan) {
  console.log("\xD0YZ\xEE [INTERRUPT GENERATOR] Generating interrupt.asm...");
  let code = "";
  code += `; ==================================================================
`;
  code += `; INTERRUPT TASK SYSTEM - File: interrupt.asm
`;
  code += `; Konami-style technique: Hook H.TIMI for 50/60Hz task execution
`;
  code += `; ==================================================================

`;
  code += generateInterruptMemoryLayout();
  code += generateInitInterruptSystem();
  code += generateStopInterruptSystem();
  code += generateInterruptDispatcher();
  code += generateTaskManagementFunctions();
  code += generateInitDefaultTasksFromPlan(executionPlan);
  if (executionPlan?.mode === "interruptTaskManager") {
    code += generateSharedMainlineTaskWrappers();
    code += generatePlannedTasks(executionPlan);
  } else {
    code += generateDefaultTasks(analysis);
  }
  if (config.interruptDrivenComponents && config.romMode !== "megarom") {
    code += `
; ==================================================================
`;
    code += `; COMPONENT SYSTEMS (INLINED)
`;
    code += `; Generated inside interrupt.asm because interruptDrivenComponents=true
`;
    code += `; ==================================================================

`;
    code += (0, import_componentsGenerator.generateComponentsFile)(analysis, config.romMode || "simple32k");
    code += `
; ==================================================================
`;
    code += `; END OF INLINED COMPONENT SYSTEMS
`;
    code += `; ==================================================================

`;
  }
  console.log(`\u0192o. [INTERRUPT GENERATOR] Generated interrupt.asm (${code.length} chars)`);
  return code;
}
function generateInterruptMemoryLayout() {
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
function generateInitInterruptSystem() {
  return `; ==================================================================
; INIT_INTERRUPT_SYSTEM - Install H.TIMI hook
; ==================================================================
${(0, import_registerContract.buildRegisterContractComment)({
    purpose: "Install JP hook on H.TIMI and initialize interrupt task state.",
    inputs: ["None"],
    outputs: ["None"],
    clobbers: ["AF", "BC", "DE", "HL"],
    preserved: ["None"],
    usage: [
      "HL/DE/BC = block copy parameters for hook backup and task table clear",
      "A = enable flag and zeroing value"
    ],
    notes: ["Runs with DI/EI, so caller must not assume interrupt state is unchanged."]
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
    ld bc, 15                   ; 8 slots \xC7- 2 bytes = 16 bytes - 1
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
function generateStopInterruptSystem() {
  return `; ==================================================================
; STOP_INTERRUPT_SYSTEM - Restore original H.TIMI hook
; ==================================================================
${(0, import_registerContract.buildRegisterContractComment)({
    purpose: "Restore original H.TIMI bytes and mark system disabled.",
    inputs: ["None"],
    outputs: ["None"],
    clobbers: ["AF", "BC", "DE", "HL"],
    preserved: ["None"],
    usage: [
      "HL/DE/BC = LDIR source/destination/count for hook restore",
      "A = zero flag write to interrupt_system_enabled"
    ],
    notes: ["Runs with DI/EI for atomic hook restoration."]
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

    ei                          ; Re-enable interrupts
    ret

`;
}
function generateInterruptDispatcher() {
  return `; ==================================================================
; INTERRUPT_DISPATCHER - Main ISR (60Hz/50Hz)
; ==================================================================
${(0, import_registerContract.buildRegisterContractComment)({
    purpose: "Dispatch enabled interrupt tasks each VBlank and chain BIOS hook.",
    inputs: ["Triggered by H.TIMI hook"],
    outputs: ["interrupt_counter incremented", "vblank_flag refreshed"],
    clobbers: ["AF", "BC", "DE", "HL", "IX", "IY (all restored before exit)"],
    preserved: ["DE", "IX", "IY"],
    usage: [
      "HL = walks task_table and holds task pointer",
      "B = task slot loop counter",
      "C = temporary low byte for pointer reconstruction",
      "A = enabled checks and pointer validation"
    ],
    notes: ["Dispatcher saves/restores DE/IX/IY defensively, reducing coupling with task internals."]
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

    ; --- STEP 2: Check if system is enabled ---
    ld a, (interrupt_system_enabled)
    or a
    jr z, .exit                 ; If disabled, exit quickly

    ; --- STEP 3: Increment frame counter ---
    ld hl, (interrupt_counter)
    inc hl
    ld (interrupt_counter), hl

    ; --- STEP 3.5: Update VBlank flag (reads VDP status) ---
    call update_vblank_flag

    ; --- STEP 4: Walk through task table (DI ensures no nested interrupts) ---
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
    ; --- STEP 5: Restore registers ---
    pop iy                      ; 14 cycles
    pop ix                      ; 14 cycles
    pop de                      ; 10 cycles
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
function generateTaskManagementFunctions() {
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
${(0, import_registerContract.buildRegisterContractComment)({
    purpose: "Read VDP status register and latch VBlank state in RAM flag.",
    inputs: ["None"],
    outputs: ["vblank_flag = 0/1"],
    clobbers: ["AF (internally saved/restored)"],
    preserved: ["AF, BC, DE, HL"],
    usage: ["A = VDP status read and boolean conversion"]
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

; ==================================================================
; ENABLE_TASK - Activate a task in the system
; ==================================================================
${(0, import_registerContract.buildRegisterContractComment)({
    purpose: "Store routine pointer into task_table slot.",
    inputs: ["A = task slot (0-7)", "HL = task routine address"],
    outputs: ["task_table[slot] = HL"],
    clobbers: ["AF", "BC", "DE", "HL"],
    preserved: ["None"],
    usage: [
      "A = slot validation and offset math",
      "DE = holds routine address while HL is repurposed as slot pointer",
      "BC = task_table base address",
      "HL = slot address calculation / pointer write"
    ]
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
${(0, import_registerContract.buildRegisterContractComment)({
    purpose: "Clear routine pointer in selected task slot.",
    inputs: ["A = task slot (0-7)"],
    outputs: ["task_table[slot] = 0"],
    clobbers: ["AF", "DE", "HL"],
    preserved: ["BC"],
    usage: [
      "A = slot validation and zero value for clearing",
      "HL = destination slot pointer",
      "DE = computed slot offset"
    ]
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
${(0, import_registerContract.buildRegisterContractComment)({
    purpose: "Expose current 16-bit interrupt frame counter.",
    inputs: ["None"],
    outputs: ["HL = interrupt_counter"],
    clobbers: ["HL"],
    preserved: ["AF", "BC", "DE"],
    usage: ["HL = loaded return value"]
  })}
; Inputs: None
; Outputs: HL = frame count (16-bit)
; Modifies: HL
; ==================================================================
get_frame_count:
    ld hl, (interrupt_counter)
    ret

`;
}
function generateInitDefaultTasksFromPlan(executionPlan) {
  const tasks = executionPlan?.mode === "interruptTaskManager" ? executionPlan.tasks.filter((task) => task.enabledAtBoot) : [];
  let code = `; ==================================================================
`;
  code += `; INIT_DEFAULT_TASKS_FROM_PLAN - Register engine-selected IRQ tasks
`;
  code += `; ==================================================================
`;
  code += (0, import_registerContract.buildRegisterContractComment)({
    purpose: "Enable the IRQ task set selected by the engine execution plan.",
    inputs: ["None"],
    outputs: ["task_table updated for all enabled-at-boot tasks"],
    clobbers: ["AF", "HL"],
    preserved: ["BC", "DE"],
    usage: ["A = task slot", "HL = task routine address"],
    notes: ["Calls enable_task once per enabled task."]
  });
  code += `init_default_tasks_from_plan:
`;
  if (tasks.length === 0) {
    code += `    ret

`;
    return code;
  }
  tasks.forEach((task) => {
    code += `    ld a, ${task.slot}
`;
    code += `    ld hl, ${task.routineLabel}
`;
    code += `    call enable_task
`;
  });
  code += `    ret

`;
  return code;
}
function generatePlannedTasks(executionPlan) {
  const hasFrameCounterTask = executionPlan.tasks.some((task) => task.routineLabel === "task_frame_counter");
  let code = `; ==================================================================
`;
  code += `; ENGINE EXECUTION PLAN TASKS
`;
  code += `; ==================================================================

`;
  if (executionPlan.tasks.length === 0) {
    code += `; No IRQ tasks selected by engine execution plan.

`;
  } else {
    executionPlan.tasks.forEach((task) => {
      code += `; Slot ${task.slot}: ${task.id} -> ${task.routineLabel} (period=${task.period})
`;
    });
    code += `
`;
  }
  if (hasFrameCounterTask) {
    code += generateFrameCounterTask();
  }
  code += `; ==================================================================
`;
  code += `; USER CUSTOM TASK SLOTS (5-7)
`;
  code += `; ==================================================================
`;
  code += `; These slots are reserved for user-defined tasks
`;
  code += `; Enable them dynamically using:
`;
  code += `;   LD A, 5                    ; Slot 5
`;
  code += `;   LD HL, my_custom_task
`;
  code += `;   CALL enable_task
`;
  code += `; ==================================================================

`;
  return code;
}
function generateSharedMainlineTaskWrappers() {
  let code = `; ==================================================================
`;
  code += `; SHARED MAINLINE TASK WRAPPERS
`;
  code += `; ==================================================================
`;
  code += `; These wrappers stay available in interruptTaskManager mode because
`;
  code += `; the HALT-driven GameFlow loops still call them directly.
`;
  code += `; ==================================================================

`;
  code += `; ==================================================================
`;
  code += `; TASK_UPDATE_INPUT - Joystick/Cursor polling wrapper
`;
  code += `; ==================================================================
`;
  code += (0, import_registerContract.buildRegisterContractComment)({
    purpose: "Poll joystick + keyboard fallback and update input state buffers.",
    inputs: ["Reads hardware via FAST_GTSTCK / FAST_GTTRIG / FAST_SNSMAT"],
    outputs: ["input_state, prev_input_state, input_btn_curr, input_btn_prev, input_fire"],
    clobbers: ["AF", "BC", "DE"],
    preserved: ["AF", "BC", "DE (by push/pop wrapper)", "HL"],
    usage: [
      "A = hardware reads and final scalar writes",
      "B = direction accumulator",
      "D = button bitmask and keyboard direction flags",
      "E = temporary keyboard row bits"
    ],
    notes: ["Wrapper preserves caller-visible regs despite internal mutation."]
  });
  code += `task_update_input:
`;
  code += `    push af
`;
  code += `    push bc
`;
  code += `    push de

`;
  code += `    ; Save previous state
`;
  code += `    ld a, (input_state)
`;
  code += `    ld (prev_input_state), a
`;
  code += `    ld a, (input_btn_curr)
`;
  code += `    ld (input_btn_prev), a

`;
  code += `    ; Read joystick direction first (priority source, direct hardware)
`;
  code += `    xor a                       ; Joystick 0
`;
  code += `    call FAST_GTSTCK            ; Direct hardware read
`;
  code += `    ld b, a                     ; B = joystick direction
`;
  code += `    or a
`;
  code += `    jr nz, .dir_ready

`;
  code += `    ; Fallback to keyboard cursor keys (row 8, direct matrix read)
`;
  code += `    ld a, 8
`;
  code += `    call FAST_SNSMAT            ; Active low bits
`;
  code += `    ld e, a
`;
  code += `    xor a
`;
  code += `    ld d, a                     ; D = direction flags: 0=none
`;
  code += `    bit 5, e                    ; Up
`;
  code += `    jr nz, .kbd_no_up
`;
  code += `    set 0, d
`;
  code += `.kbd_no_up:
`;
  code += `    bit 6, e                    ; Down
`;
  code += `    jr nz, .kbd_no_down
`;
  code += `    set 1, d
`;
  code += `.kbd_no_down:
`;
  code += `    bit 4, e                    ; Left
`;
  code += `    jr nz, .kbd_no_left
`;
  code += `    set 2, d
`;
  code += `.kbd_no_left:
`;
  code += `    bit 7, e                    ; Right
`;
  code += `    jr nz, .kbd_no_right
`;
  code += `    set 3, d
`;
  code += `.kbd_no_right:
`;
  code += `    xor a
`;
  code += `    bit 0, d
`;
  code += `    jr z, .kbd_check_down
`;
  code += `    bit 3, d
`;
  code += `    jr nz, .kbd_upright
`;
  code += `    bit 2, d
`;
  code += `    jr nz, .kbd_upleft
`;
  code += `    ld a, STICK_UP
`;
  code += `    jr .kbd_done
`;
  code += `.kbd_upright:
`;
  code += `    ld a, STICK_UPRIGHT
`;
  code += `    jr .kbd_done
`;
  code += `.kbd_upleft:
`;
  code += `    ld a, STICK_UPLEFT
`;
  code += `    jr .kbd_done
`;
  code += `.kbd_check_down:
`;
  code += `    bit 1, d
`;
  code += `    jr z, .kbd_check_lr
`;
  code += `    bit 3, d
`;
  code += `    jr nz, .kbd_downright
`;
  code += `    bit 2, d
`;
  code += `    jr nz, .kbd_downleft
`;
  code += `    ld a, STICK_DOWN
`;
  code += `    jr .kbd_done
`;
  code += `.kbd_downright:
`;
  code += `    ld a, STICK_DOWNRIGHT
`;
  code += `    jr .kbd_done
`;
  code += `.kbd_downleft:
`;
  code += `    ld a, STICK_DOWNLEFT
`;
  code += `    jr .kbd_done
`;
  code += `.kbd_check_lr:
`;
  code += `    bit 2, d
`;
  code += `    jr z, .kbd_check_right
`;
  code += `    ld a, STICK_LEFT
`;
  code += `    jr .kbd_done
`;
  code += `.kbd_check_right:
`;
  code += `    bit 3, d
`;
  code += `    jr z, .kbd_done
`;
  code += `    ld a, STICK_RIGHT
`;
  code += `.kbd_done:
`;
  code += `    ld b, a
`;
  code += `.dir_ready:
`;
  code += `    ; Normalize diagonals to cardinal directions for runtime stability
`;
  code += `    ; UP+RIGHT/DOWN+RIGHT -> RIGHT, UP+LEFT/DOWN+LEFT -> LEFT
`;
  code += `    ld a, b
`;
  code += `    cp STICK_UPRIGHT
`;
  code += `    jr z, .dir_norm_right
`;
  code += `    cp STICK_DOWNRIGHT
`;
  code += `    jr z, .dir_norm_right
`;
  code += `    cp STICK_UPLEFT
`;
  code += `    jr z, .dir_norm_left
`;
  code += `    cp STICK_DOWNLEFT
`;
  code += `    jr z, .dir_norm_left
`;
  code += `    jr .dir_norm_done
`;
  code += `.dir_norm_right:
`;
  code += `    ld a, STICK_RIGHT
`;
  code += `    jr .dir_norm_store
`;
  code += `.dir_norm_left:
`;
  code += `    ld a, STICK_LEFT
`;
  code += `.dir_norm_store:
`;
  code += `    ld b, a
`;
  code += `.dir_norm_done:
`;
  code += `    xor a                       ; Joystick 0
`;
  code += `    call FAST_GTTRIG            ; A = #FF if pressed, 0 if not
`;
  code += `    ld d, 0                     ; D = button bitmask
`;
  code += `    or a
`;
  code += `    jr z, .no_fire              ; Jump if NOT pressed (A=0)
`;
  code += `    ld d, INPUT_BTN_FIRE
`;
  code += `    ld a, 1                     ; Fire pressed
`;
  code += `    ld (input_fire), a
`;
  code += `    jr .fire_done
`;
  code += `.no_fire:
`;
  code += `    ; Keyboard fallback for fire (SPACE, row 8 bit 0, active low)
`;
  code += `    ld a, 8
`;
  code += `    call FAST_SNSMAT
`;
  code += `    bit 0, a
`;
  code += `    jr nz, .fire_released
`;
  code += `    ld d, INPUT_BTN_FIRE
`;
  code += `    ld a, 1
`;
  code += `    ld (input_fire), a
`;
  code += `    jr .fire_done
`;
  code += `.fire_released:
`;
  code += `    xor a                       ; Fire not pressed
`;
  code += `    ld (input_fire), a
`;
  code += `.fire_done:
`;
  code += `    ld a, b
`;
  code += `    ld (input_state), a
`;
  code += `    ld a, d
`;
  code += `    ld (input_btn_curr), a

`;
  code += `    pop de
`;
  code += `    pop bc
`;
  code += `    pop af
`;
  code += `    ret

`;
  return code;
}
function generateFrameCounterTask() {
  let code = `; ==================================================================
`;
  code += `; TASK_FRAME_COUNTER - Custom timing/animations
`;
  code += `; ==================================================================
`;
  code += `; Placeholder for user-defined frame-based timing
`;
  code += `; interrupt_counter is already incremented in dispatcher
`;
  code += `; ==================================================================
`;
  code += (0, import_registerContract.buildRegisterContractComment)({
    purpose: "Optional per-frame timing hook for lightweight counters/animations.",
    inputs: ["None"],
    outputs: ["None"],
    clobbers: ["None"],
    preserved: ["AF", "BC", "DE", "HL"],
    usage: ["No registers modified in the default implementation"]
  });
  code += `task_frame_counter:
`;
  code += `    ; Placeholder - counter is already incremented in dispatcher
`;
  code += `    ; Add custom timing logic here if needed
`;
  code += `    ret

`;
  return code;
}
function generateDefaultTasks(analysis) {
  let code = "";
  code += `; ==================================================================
`;
  code += `; DEFAULT INTERRUPT TASKS (60Hz Execution)
`;
  code += `; ==================================================================

`;
  code += `; ==================================================================
`;
  code += `; TASK_UPDATE_INPUT - Joystick/Cursor polling at 60Hz
`;
  code += `; ==================================================================
`;
  code += `; This task guarantees responsive input (no missed button presses)
`;
  code += `; Compatible with update_input_component existing function
`;
  code += `; ==================================================================
`;
  code += (0, import_registerContract.buildRegisterContractComment)({
    purpose: "Poll joystick + keyboard fallback and update input state buffers.",
    inputs: ["Reads hardware via FAST_GTSTCK / FAST_GTTRIG / FAST_SNSMAT"],
    outputs: ["input_state, prev_input_state, input_btn_curr, input_btn_prev, input_fire"],
    clobbers: ["AF", "BC", "DE"],
    preserved: ["AF", "BC", "DE (by push/pop wrapper)", "HL"],
    usage: [
      "A = hardware reads and final scalar writes",
      "B = direction accumulator",
      "D = button bitmask and keyboard direction flags",
      "E = temporary keyboard row bits"
    ],
    notes: ["Wrapper preserves caller-visible regs despite internal mutation."]
  });
  code += `task_update_input:
`;
  code += `    push af
`;
  code += `    push bc
`;
  code += `    push de

`;
  code += `    ; Save previous state
`;
  code += `    ld a, (input_state)
`;
  code += `    ld (prev_input_state), a
`;
  code += `    ld a, (input_btn_curr)
`;
  code += `    ld (input_btn_prev), a

`;
  code += `    ; Read joystick direction first (priority source, direct hardware)
`;
  code += `    xor a                       ; Joystick 0
`;
  code += `    call FAST_GTSTCK            ; Direct hardware read
`;
  code += `    ld b, a                     ; B = joystick direction
`;
  code += `    or a
`;
  code += `    jr nz, .dir_ready

`;
  code += `    ; Fallback to keyboard cursor keys (row 8, direct matrix read)
`;
  code += `    ld a, 8
`;
  code += `    call FAST_SNSMAT            ; Active low bits
`;
  code += `    ld e, a
`;
  code += `    xor a
`;
  code += `    ld d, a                     ; D = direction flags: 0=none
`;
  code += `    bit 5, e                    ; Up
`;
  code += `    jr nz, .kbd_no_up
`;
  code += `    set 0, d
`;
  code += `.kbd_no_up:
`;
  code += `    bit 6, e                    ; Down
`;
  code += `    jr nz, .kbd_no_down
`;
  code += `    set 1, d
`;
  code += `.kbd_no_down:
`;
  code += `    bit 4, e                    ; Left
`;
  code += `    jr nz, .kbd_no_left
`;
  code += `    set 2, d
`;
  code += `.kbd_no_left:
`;
  code += `    bit 7, e                    ; Right
`;
  code += `    jr nz, .kbd_no_right
`;
  code += `    set 3, d
`;
  code += `.kbd_no_right:
`;
  code += `    xor a
`;
  code += `    bit 0, d
`;
  code += `    jr z, .kbd_check_down
`;
  code += `    bit 3, d
`;
  code += `    jr nz, .kbd_upright
`;
  code += `    bit 2, d
`;
  code += `    jr nz, .kbd_upleft
`;
  code += `    ld a, STICK_UP
`;
  code += `    jr .kbd_done
`;
  code += `.kbd_upright:
`;
  code += `    ld a, STICK_UPRIGHT
`;
  code += `    jr .kbd_done
`;
  code += `.kbd_upleft:
`;
  code += `    ld a, STICK_UPLEFT
`;
  code += `    jr .kbd_done
`;
  code += `.kbd_check_down:
`;
  code += `    bit 1, d
`;
  code += `    jr z, .kbd_check_lr
`;
  code += `    bit 3, d
`;
  code += `    jr nz, .kbd_downright
`;
  code += `    bit 2, d
`;
  code += `    jr nz, .kbd_downleft
`;
  code += `    ld a, STICK_DOWN
`;
  code += `    jr .kbd_done
`;
  code += `.kbd_downright:
`;
  code += `    ld a, STICK_DOWNRIGHT
`;
  code += `    jr .kbd_done
`;
  code += `.kbd_downleft:
`;
  code += `    ld a, STICK_DOWNLEFT
`;
  code += `    jr .kbd_done
`;
  code += `.kbd_check_lr:
`;
  code += `    bit 2, d
`;
  code += `    jr z, .kbd_check_right
`;
  code += `    ld a, STICK_LEFT
`;
  code += `    jr .kbd_done
`;
  code += `.kbd_check_right:
`;
  code += `    bit 3, d
`;
  code += `    jr z, .kbd_done
`;
  code += `    ld a, STICK_RIGHT
`;
  code += `.kbd_done:
`;
  code += `    ld b, a
`;
  code += `.dir_ready:
`;
  code += `    ; Normalize diagonals to cardinal directions for runtime stability
`;
  code += `    ; UP+RIGHT/DOWN+RIGHT -> RIGHT, UP+LEFT/DOWN+LEFT -> LEFT
`;
  code += `    ld a, b
`;
  code += `    cp STICK_UPRIGHT
`;
  code += `    jr z, .dir_norm_right
`;
  code += `    cp STICK_DOWNRIGHT
`;
  code += `    jr z, .dir_norm_right
`;
  code += `    cp STICK_UPLEFT
`;
  code += `    jr z, .dir_norm_left
`;
  code += `    cp STICK_DOWNLEFT
`;
  code += `    jr z, .dir_norm_left
`;
  code += `    jr .dir_norm_done
`;
  code += `.dir_norm_right:
`;
  code += `    ld a, STICK_RIGHT
`;
  code += `    jr .dir_norm_store
`;
  code += `.dir_norm_left:
`;
  code += `    ld a, STICK_LEFT
`;
  code += `.dir_norm_store:
`;
  code += `    ld b, a
`;
  code += `.dir_norm_done:
`;
  code += `    xor a                       ; Joystick 0
`;
  code += `    call FAST_GTTRIG            ; A = #FF if pressed, 0 if not
`;
  code += `    ld d, 0                     ; D = button bitmask
`;
  code += `    or a
`;
  code += `    jr z, .no_fire              ; Jump if NOT pressed (A=0)
`;
  code += `    ld d, INPUT_BTN_FIRE
`;
  code += `    ld a, 1                     ; Fire pressed
`;
  code += `    ld (input_fire), a
`;
  code += `    jr .fire_done
`;
  code += `.no_fire:
`;
  code += `    ; Keyboard fallback for fire (SPACE, row 8 bit 0, active low)
`;
  code += `    ld a, 8
`;
  code += `    call FAST_SNSMAT
`;
  code += `    bit 0, a
`;
  code += `    jr nz, .fire_released
`;
  code += `    ld d, INPUT_BTN_FIRE
`;
  code += `    ld a, 1
`;
  code += `    ld (input_fire), a
`;
  code += `    jr .fire_done
`;
  code += `.fire_released:
`;
  code += `    xor a                       ; Fire not pressed
`;
  code += `    ld (input_fire), a
`;
  code += `.fire_done:
`;
  code += `    ld a, b
`;
  code += `    ld (input_state), a
`;
  code += `    ld a, d
`;
  code += `    ld (input_btn_curr), a

`;
  code += `    pop de
`;
  code += `    pop bc
`;
  code += `    pop af
`;
  code += `    ret

`;
  if (analysis.hasEntities) {
    const componentUsage = (0, import_componentAnalyzer.analyzeComponentUsage)(analysis);
    const usedComponents = componentUsage.usedComponents;
    const hasJump = usedComponents.has("Jump");
    const hasMovement = usedComponents.has("Movement") || usedComponents.has("Cursors");
    const hasGravity = usedComponents.has("Gravity");
    const needsPhysics = hasJump || hasMovement || hasGravity;
    if (needsPhysics) {
      code += `; ==================================================================
`;
      code += `; TASK_UPDATE_PHYSICS - Apply vx, vy -> X, Y (OPTIMIZED)
`;
      code += `; ==================================================================
`;
      code += `; Only calls physics systems that are actually used in this project
`;
      code += `; ==================================================================
`;
      code += (0, import_registerContract.buildRegisterContractComment)({
        purpose: "Run selected physics component systems in deterministic order.",
        inputs: ["Entity/component RAM tables"],
        outputs: ["Entity motion state updated"],
        clobbers: ["AF", "BC", "DE", "HL"],
        preserved: ["AF", "BC", "DE", "HL (by push/pop wrapper)"],
        usage: ["Registers are scratch during component calls; wrapper restores caller context."]
      });
      code += `task_update_physics:
`;
      code += `    push af
`;
      code += `    push bc
`;
      code += `    push de
`;
      code += `    push hl

`;
      code += `    ; Keep system loops in sync with current component masks
`;
      code += `    call rebuild_used_entity_list
`;
      if (hasJump) {
        code += `    call update_jump_component      ; Jump impulse
`;
      }
      if (hasMovement) {
        code += `    call update_movement_component  ; Movement/velocity
`;
      }
      if (hasGravity) {
        code += `    call update_gravity_component   ; Gravity acceleration
`;
      }
      code += `    call update_position_component  ; Apply velocity to position

`;
      code += `    pop hl
`;
      code += `    pop de
`;
      code += `    pop bc
`;
      code += `    pop af
`;
      code += `    ret

`;
    } else {
      code += `; Task 1 (Physics): Minimal - only position update (no Jump/Movement/Gravity used)
`;
      code += `task_update_physics:
`;
      code += `    call rebuild_used_entity_list  ; Keep compact entity list updated
`;
      code += `    call update_position_component  ; Just apply any existing velocities
`;
      code += `    ret

`;
    }
  } else {
    code += `; Task 1 (Physics): Not generated (no entities detected)

`;
  }
  if (analysis.hasCollisions) {
    code += `; ==================================================================
`;
    code += `; TASK_UPDATE_COLLISION - Collision detection
`;
    code += `; ==================================================================
`;
    code += `; Detects collisions using collision layers (bitmask system)
`;
    code += `; AABB collision for 16x16 sprites
`;
    code += `; ==================================================================
`;
    code += (0, import_registerContract.buildRegisterContractComment)({
      purpose: "Interrupt task wrapper for collision system (placeholder).",
      inputs: ["Entity collision data"],
      outputs: ["Collision flags/tables (when implemented)"],
      clobbers: ["AF", "BC", "DE", "HL"],
      preserved: ["AF", "BC", "DE", "HL (by push/pop wrapper)"]
    });
    code += `task_update_collision:
`;
    code += `    push af
`;
    code += `    push bc
`;
    code += `    push de
`;
    code += `    push hl

`;
    code += `    ; TODO: Implement collision detection
`;
    code += `    ; Loop over entities with COMP_MASK_COLLISION
`;
    code += `    ; Check: collisionLayer & collidesWith for each pair
`;
    code += `    ; AABB test: |X1-X2| < 16 && |Y1-Y2| < 16

`;
    code += `    pop hl
`;
    code += `    pop de
`;
    code += `    pop bc
`;
    code += `    pop af
`;
    code += `    ret

`;
  } else {
    code += `; Task 2 (Collision): Not generated (no collision detection needed)

`;
  }
  if (analysis.hasSprites) {
    code += `; ==================================================================
`;
    code += `; TASK_UPDATE_SPRITES - Update sprites to VRAM
`;
    code += `; ==================================================================
`;
    code += `; WARNING: This task is HEAVY (~800 cycles)
`;
    code += `; Consider executing every N frames instead of every frame
`;
    code += `; ==================================================================
`;
    code += (0, import_registerContract.buildRegisterContractComment)({
      purpose: "Interrupt-safe wrapper for sprite SAT upload routine.",
      inputs: ["Sprite component buffers"],
      outputs: ["VRAM sprite attribute/pattern tables updated"],
      clobbers: ["AF", "BC", "DE", "HL"],
      preserved: ["AF", "BC", "DE", "HL (by push/pop wrapper)"]
    });
    code += `task_update_sprites:
`;
    code += `    push af
`;
    code += `    push bc
`;
    code += `    push de
`;
    code += `    push hl

`;
    code += `    ; Call existing sprite update function
`;
    code += `    call update_sprites_to_vram

`;
    code += `    pop hl
`;
    code += `    pop de
`;
    code += `    pop bc
`;
    code += `    pop af
`;
    code += `    ret

`;
  } else {
    code += `; Task 3 (Sprites): Not generated (no sprites in project)

`;
  }
  if (analysis.tracks && analysis.tracks.length > 0 || analysis.stateMachines && analysis.stateMachines.length > 0) {
    code += `; ==================================================================
`;
    code += `; TASK_UPDATE_MUSIC - Fixed-rate audio tick
`;
    code += `; ==================================================================
`;
    code += `; Keeps tracker and state-machine audio tied to H.TIMI instead of variable-cost loops
`;
    code += `; ==================================================================
`;
    code += (0, import_registerContract.buildRegisterContractComment)({
      purpose: "Interrupt-safe wrapper for tracker/state-machine audio tick.",
      inputs: ["Music engine RAM state and state-machine sound cursors"],
      outputs: ["PSG state advanced once per VBlank"],
      clobbers: ["AF", "BC", "DE", "HL"],
      preserved: ["AF", "BC", "DE", "HL (by push/pop wrapper)"]
    });
    code += `task_update_music:
`;
    code += `    push af
`;
    code += `    push bc
`;
    code += `    push de
`;
    code += `    push hl

`;
    code += `    ld hl, prof_music_task_calls
`;
    code += `    inc (hl)
`;
    code += `    jr nz, .music_prof_counted
`;
    code += `    inc hl
`;
    code += `    inc (hl)
`;
    code += `.music_prof_counted:
`;
    code += `    call music_update
`;
    if (analysis.stateMachines && analysis.stateMachines.length > 0) {
      code += `    call SM_UpdateSound
`;
    }
    code += `
`;
    code += `    pop hl
`;
    code += `    pop de
`;
    code += `    pop bc
`;
    code += `    pop af
`;
    code += `    ret

`;
  } else {
    code += `; TASK_UPDATE_MUSIC: Not generated (no tracker/state-machine audio in project)

`;
  }
  code += `; ==================================================================
`;
  code += `; TASK_FRAME_COUNTER - Custom timing/animations
`;
  code += `; ==================================================================
`;
  code += `; Placeholder for user-defined frame-based timing
`;
  code += `; Example: Increment animation timers, etc.
`;
  code += `; ==================================================================
`;
  code += (0, import_registerContract.buildRegisterContractComment)({
    purpose: "Reserved slot for user timing logic.",
    inputs: ["None"],
    outputs: ["None by default"],
    clobbers: ["None by default"],
    preserved: ["All (default empty implementation)"]
  });
  code += `task_frame_counter:
`;
  code += `    ; Placeholder - counter is already incremented in dispatcher
`;
  code += `    ; Add custom timing logic here if needed
`;
  code += `    ret

`;
  code += `; ==================================================================
`;
  code += `; USER CUSTOM TASK SLOTS (5-7)
`;
  code += `; ==================================================================
`;
  code += `; These slots are reserved for user-defined tasks
`;
  code += `; Enable them dynamically using:
`;
  code += `;   LD A, 5                    ; Slot 5
`;
  code += `;   LD HL, my_custom_task
`;
  code += `;   CALL enable_task
`;
  code += `; ==================================================================

`;
  return code;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  generateInterruptFile
});
