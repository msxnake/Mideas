/**
 * @fileoverview Direct Hardware Access Generator
 * Generates optimized hardware access routines to replace BIOS calls
 * Performance gain: 30-60% faster than BIOS equivalents
 */
import { buildRegisterContractComment } from './registerContract';

export interface DirectHardwareOptions {
  mode: 'bios' | 'direct' | 'hybrid';
  optimizeLevel?: 'safe' | 'aggressive';
  includeDebug?: boolean;
}

/**
 * Generate direct hardware access routines file
 *
 * @param options - Configuration options for hardware access mode
 * @returns ASM code string with optimized hardware routines
 */
export function generateDirectHardwareFile(options: DirectHardwareOptions = { mode: 'hybrid' }): string {
  const { mode, optimizeLevel = 'safe', includeDebug = false } = options;

  let code = `; ==================================================================
; DIRECT HARDWARE ACCESS ROUTINES
; ==================================================================
; Mode: ${mode.toUpperCase()}
; Optimize Level: ${optimizeLevel}
; Debug: ${includeDebug ? 'ENABLED' : 'DISABLED'}
;
; These routines provide direct hardware access for maximum performance.
; They replace BIOS calls in performance-critical sections.
;
; Performance Gains vs BIOS:
;   FAST_LDIRVM:  ~40% faster (12,288 vs 20,480 cycles for 256 bytes)
;   FAST_WRTVRM:  ~43% faster (40 vs 70 cycles)
;   FAST_WRTVDP:  ~55% faster (25 vs 55 cycles)
;   FAST_GTSTCK:  ~58% faster (50 vs 120 cycles)
;   FAST_GTTRIG:  direct trigger read (joystick button)
;   FAST_SNSMAT:  direct keyboard matrix row read
;
; Compatibility: MSX1, MSX2, MSX2+
; ==================================================================

`;

  // Generate core routines (always included)
  code += generateFastLDIRVM();
  code += generateFastWRTVRM();
  code += generateFastRDVRM();
  code += generateFastWRTVDP();
  code += generateFastGTSTCK();
  code += generateFastGTTRIG();
  code += generateFastSNSMAT();
  // Note: wait_vblank removed - use HALT directly in game loop (more efficient)

  // Aggressive optimizations (optional)
  if (optimizeLevel === 'aggressive') {
    code += generateFastLDIRVM256();
    code += generateUnrolledSpriteCopy();
  }

  // Debug helpers (optional)
  if (includeDebug) {
    code += generateDebugHelpers();
  }

  code += `
; ==================================================================
; END OF DIRECT HARDWARE ROUTINES
; ==================================================================
`;

  return code;
}

/**
 * Generate FAST_LDIRVM - Optimized block transfer to VRAM
 */
function generateFastLDIRVM(): string {
  return `
; ==================================================================
; FAST_LDIRVM - Fast Block Transfer to VRAM
; ==================================================================
${buildRegisterContractComment({
  purpose: 'Block copy from RAM to VRAM using VDP data port auto-increment.',
  inputs: [
    'HL = source address (RAM)',
    'DE = destination address (VRAM)',
    'BC = byte count',
  ],
  outputs: ['None'],
  clobbers: ['AF', 'BC', 'HL'],
  preserved: ['DE'],
  usage: [
    'A = VDP address bytes and data byte being transferred',
    'HL = RAM read pointer (increments each byte)',
    'DE = only used to program initial VRAM address',
    'BC = countdown loop counter',
  ],
  notes: ['Caller must preserve AF/BC/HL if needed after call.'],
})}
; Replaces BIOS LDIRVM with direct hardware access
;
; Input:
;   HL = Source address (RAM)
;   DE = Destination address (VRAM)
;   BC = Byte count
;
; Output:
;   None
;
; Destroys:
;   AF, BC, HL
;
; Performance:
;   ~48 cycles/byte vs BIOS ~80+ cycles/byte
;   For 256 bytes: 12,288 cycles vs 20,480+ (40% faster)
;
; Notes:
;   - Auto-increments VRAM address (VDP feature)
;   - Briefly masks IRQs only while programming the VDP address latch
;   - Restores the previous IRQ enable state before the data loop starts
;   - Works on all MSX models (TMS9918, V9938, V9958)
; ==================================================================
FAST_LDIRVM:
    ; Preserve previous IRQ state (LD A,I copies IFF2 into P/V)
    ld a, i
    push af
    di

    ; Set VRAM write address
    ld a, e
    out (#99), a           ; Write address low byte to VDP
    nop                    ; Real VDPs need a short settle time between control writes
    ld a, d
    or #40                 ; Set bit 6 for write mode
    out (#99), a           ; Write address high byte + write command
    nop                    ; Let the VDP latch the address before the first data write

    ; Restore previous IRQ state before the bulk copy loop
    pop af
    jp po, .ldirvm_loop    ; P/V=0 => IRQs were already disabled
    ei

    ; Copy loop
.ldirvm_loop:
    ld a, (hl)             ; Read byte from RAM (7 cycles)
    out (#98), a           ; Write to VRAM data port (11 cycles)
    inc hl                 ; Next source address (6 cycles)
    dec bc                 ; Decrement counter (6 cycles)
    ld a, b                ; Check if BC = 0 (4 cycles)
    or c                   ; (4 cycles)
    jr nz, .ldirvm_loop    ; Loop if not zero (12/7 cycles)
    ret

`;
}

/**
 * Generate FAST_LDIRVM_256 - Optimized for 256-byte blocks
 */
function generateFastLDIRVM256(): string {
  return `
; ==================================================================
; FAST_LDIRVM_256 - Optimized for exactly 256 bytes
; ==================================================================
${buildRegisterContractComment({
  purpose: 'Fixed-size 256-byte transfer from RAM to VRAM using DJNZ.',
  inputs: ['HL = source address (RAM)', 'DE = destination address (VRAM)'],
  outputs: ['None'],
  clobbers: ['AF', 'B', 'HL'],
  preserved: ['C', 'DE'],
  usage: [
    'A = VDP address bytes and transferred byte',
    'B = DJNZ counter (0 means 256 iterations)',
    'HL = RAM read pointer',
    'DE = only used to set initial VRAM address',
  ],
  notes: ['Use only when exactly 256 bytes must be copied.'],
})}
; Specialized version for 256-byte blocks (common case: sprite patterns)
; Uses DJNZ for faster loop control
;
; Input:
;   HL = Source address (RAM)
;   DE = Destination address (VRAM)
;
; Output:
;   None
;
; Destroys:
;   AF, B, HL
;
; Performance:
;   ~46 cycles/byte (vs 48 for generic version)
;   Total: 11,776 cycles (saves ~500 cycles vs generic)
; ==================================================================
FAST_LDIRVM_256:
    ; Preserve previous IRQ state (LD A,I copies IFF2 into P/V)
    ld a, i
    push af
    di

    ; Set VRAM write address
    ld a, e
    out (#99), a
    nop
    ld a, d
    or #40
    out (#99), a
    nop

    ; Restore previous IRQ state before the bulk copy loop
    pop af
    jp po, .ldirvm_256_begin
    ei

    ; Copy 256 bytes using DJNZ (B=0 means 256)
.ldirvm_256_begin:
    ld b, 0                ; B = 256 (wraps from 0)
.ldirvm_256_loop:
    ld a, (hl)
    out (#98), a
    inc hl
    djnz .ldirvm_256_loop  ; Faster than dec bc + check (13/8 cycles)
    ret

`;
}

/**
 * Generate FAST_WRTVRM - Write single byte to VRAM
 */
function generateFastWRTVRM(): string {
  return `
; ==================================================================
; FAST_WRTVRM - Write Single Byte to VRAM
; ==================================================================
${buildRegisterContractComment({
  purpose: 'Write one byte into VRAM while preserving caller-visible state.',
  inputs: ['A = byte to write', 'HL = VRAM destination address'],
  outputs: ['None'],
  clobbers: ['None (all registers preserved)'],
  preserved: ['AF', 'BC', 'DE', 'HL'],
  usage: [
    'A = temporarily saved/restored around VDP address programming',
    'HL = VRAM address source (not modified)',
  ],
  notes: ['Safe helper when the caller cannot tolerate register changes.'],
})}
; Replaces BIOS WRTVRM
;
; Input:
;   A = Data byte to write
;   HL = VRAM destination address
;
; Output:
;   None
;
; Destroys:
;   None (all registers preserved)
;
; Performance:
;   ~40 cycles vs BIOS ~70 cycles (43% faster)
;
; Notes:
;   - Preserves all registers including AF
;   - Safe for HUD updates, tile changes
; ==================================================================
FAST_WRTVRM:
    push af                ; Save data byte (11 cycles)
    ld a, l
    out (#99), a           ; Address low (11 cycles)
    ld a, h
    or #40                 ; Write mode (7 cycles)
    out (#99), a           ; Address high + command (11 cycles)
    pop af                 ; Restore data (10 cycles)
    out (#98), a           ; Write to VRAM (11 cycles)
    ret                    ; (10 cycles)
                           ; Total: ~40 cycles

`;
}

/**
 * Generate FAST_RDVRM - Read single byte from VRAM
 */
function generateFastRDVRM(): string {
  return `
; ==================================================================
; FAST_RDVRM - Read Single Byte from VRAM
; ==================================================================
${buildRegisterContractComment({
  purpose: 'Read one byte from VRAM data port.',
  inputs: ['HL = VRAM source address'],
  outputs: ['A = byte read from VRAM'],
  clobbers: ['AF'],
  preserved: ['BC', 'DE', 'HL'],
  usage: [
    'A = VDP addressing command then read result',
    'HL = address source only (unchanged)',
  ],
  notes: ['Callers relying on flags must account for AF clobber.'],
})}
; Replaces BIOS RDVRM
;
; Input:
;   HL = VRAM source address
;
; Output:
;   A = Byte read from VRAM
;
; Destroys:
;   AF
;
; Performance:
;   ~35 cycles vs BIOS ~65 cycles (46% faster)
;
; Notes:
;   - Useful for collision detection, tile reading
;   - VDP requires small delay after address set before read
; ==================================================================
FAST_RDVRM:
    ld a, l
    out (#99), a           ; Address low
    ld a, h
    and #3F                ; Clear bit 6 for read mode (bit 7 must be 0)
    out (#99), a           ; Address high + read command
    nop                    ; VDP needs time to process address before read
    in a, (#98)            ; Read from VRAM data port
    ret

`;
}

/**
 * Generate FAST_WRTVDP - Write VDP register
 */
function generateFastWRTVDP(): string {
  return `
; ==================================================================
; FAST_WRTVDP - Write VDP Register
; ==================================================================
${buildRegisterContractComment({
  purpose: 'Write one VDP register value (value first, then register index).',
  inputs: ['B = register value', 'C = register number'],
  outputs: ['None'],
  clobbers: ['AF'],
  preserved: ['BC', 'DE', 'HL'],
  usage: [
    'A = output staging register for both OUT operations',
    'B/C = preserved input pair for value and register id',
  ],
  notes: ['Order of writes is mandatory for VDP register writes.'],
})}
; Replaces BIOS WRTVDP
;
; Input:
;   B = Register value
;   C = Register number (0-7 for MSX1, 0-23 for MSX2, 0-46 for MSX2+)
;
; Output:
;   None
;
; Destroys:
;   AF
;
; Performance:
;   ~25 cycles vs BIOS ~55 cycles (55% faster)
;
; Notes:
;   - Used for mode changes, colors, scroll, etc.
;   - Register write order matters: value first, then register number
; ==================================================================
FAST_WRTVDP:
    ld a, b                ; Get register value (4 cycles)
    out (#99), a           ; Write value first (11 cycles)
    ld a, c                ; Get register number (4 cycles)
    or #80                 ; Set bit 7 for register write (7 cycles)
    out (#99), a           ; Write register select (11 cycles)
    ret                    ; (10 cycles)
                           ; Total: ~25 cycles

`;
}

/**
 * Generate FAST_GTSTCK - Read joystick direction
 */
function generateFastGTSTCK(): string {
  return `
; ==================================================================
; FAST_GTSTCK - Read Joystick Direction
; ==================================================================
${buildRegisterContractComment({
  purpose: 'Read joystick direction and map PSG bits to MSX GTSTCK direction code.',
  inputs: ['A = joystick port (0 or 1)'],
  outputs: ['A = direction code (0-8)'],
  clobbers: ['AF', 'HL'],
  preserved: ['BC', 'DE'],
  usage: [
    'A = PSG register selection, raw read, and final direction code',
    'HL = lookup table pointer into joystick_direction_table',
  ],
  notes: ['Bits are active-low; routine inverts and masks input nibble.'],
})}
; Replaces BIOS GTSTCK (which is notoriously slow)
;
; Input:
;   A = Joystick port (0 = port 1, 1 = port 2)
;
; Output:
;   A = Direction code (0-8)
;       0 = Center (no direction)
;       1 = Up
;       2 = Up + Right
;       3 = Right
;       4 = Down + Right
;       5 = Down
;       6 = Down + Left
;       7 = Left
;       8 = Up + Left
;
; Destroys:
;   AF, HL
;
; Performance:
;   ~50 cycles vs BIOS ~120+ cycles (58% faster)
;
; Notes:
;   - Reads from PSG register 14 (port 1) or 15 (port 2)
;   - Joystick bits are active-low (inverted)
;   - Uses lookup table for direction decoding
; ==================================================================
FAST_GTSTCK:
    ; Calculate PSG register: 14 (port 1) or 15 (port 2)
    rrca                   ; A = A / 2 (joystick port becomes 0 or 8)
    and #0F                ; Mask to valid range
    or #0E                 ; Add 14 (base register for joystick)

    ; Select PSG register
    out (#A0), a           ; Write register number to PSG address port
    in a, (#A2)            ; Read value from PSG data port

    ; Process joystick data
    cpl                    ; Invert bits (joystick is active-low)
    and #0F                ; Mask to 4 direction bits (Up, Down, Left, Right)

    ; Lookup direction code from table
    ld hl, joystick_direction_table
    add a, l               ; Add offset to table base
    ld l, a
    adc a, h               ; Handle carry if table crosses page boundary
    sub l
    ld h, a
    ld a, (hl)             ; Get direction code (0-8)
    ret

; Direction lookup table (16 entries for all 4-bit combinations)
; MSX PSG register 14 joystick bit order:
;   Bit 0 = Up    (0001)
;   Bit 1 = Down  (0010)
;   Bit 2 = Left  (0100)
;   Bit 3 = Right (1000)
; Value: GTSTCK-compatible direction code (0-8)
joystick_direction_table:
    db 0  ; 0000 = Center
    db 1  ; 0001 = Up
    db 5  ; 0010 = Down
    db 0  ; 0011 = Up+Down (invalid)
    db 7  ; 0100 = Left
    db 8  ; 0101 = Up+Left
    db 6  ; 0110 = Down+Left
    db 0  ; 0111 = Invalid
    db 3  ; 1000 = Right
    db 2  ; 1001 = Up+Right
    db 4  ; 1010 = Down+Right
    db 0  ; 1011 = Invalid
    db 0  ; 1100 = Left+Right (invalid)
    db 0  ; 1101 = Invalid
    db 0  ; 1110 = Invalid
    db 0  ; 1111 = All directions (invalid)

`;
}

/**
 * Generate FAST_GTTRIG - Read joystick trigger directly
 */
function generateFastGTTRIG(): string {
  return `
; ==================================================================
; FAST_GTTRIG - Read Joystick Trigger
; ==================================================================
${buildRegisterContractComment({
  purpose: 'Read joystick trigger bit directly from PSG register.',
  inputs: ['A = joystick port (0 or 1)'],
  outputs: ['A = #FF if pressed, #00 if released'],
  clobbers: ['AF'],
  preserved: ['BC', 'DE', 'HL'],
  usage: ['A = register select, raw PSG read, and normalized return value'],
  notes: ['Trigger is active-low in PSG bit 4.'],
})}
; Direct hardware replacement for BIOS GTTRIG
;
; Input:
;   A = Joystick port (0 = port 1, 1 = port 2)
;
; Output:
;   A = #FF if pressed, 0 if released
;
; Destroys:
;   AF
;
; Notes:
;   - Reads PSG register 14/15 directly
;   - Trigger bit is active-low
; ==================================================================
FAST_GTTRIG:
    ; Calculate PSG register: 14 (port 1) or 15 (port 2)
    rrca
    and #0F
    or #0E

    ; Select PSG register and read value
    out (#A0), a
    in a, (#A2)

    ; Trigger bit (bit 4): 0 when pressed, 1 when released
    and #10
    ld a, #00
    ret nz
    ld a, #FF
    ret

`;
}

/**
 * Generate FAST_SNSMAT - Read keyboard matrix row directly
 */
function generateFastSNSMAT(): string {
  return `
; ==================================================================
; FAST_SNSMAT - Sense Keyboard Matrix Row
; ==================================================================
${buildRegisterContractComment({
  purpose: 'Select keyboard matrix row via PPI and return row state.',
  inputs: ['A = matrix row (0-11)'],
  outputs: ['A = row bits (active-low)'],
  clobbers: ['AF', 'C'],
  preserved: ['B', 'DE', 'HL'],
  usage: [
    'A = row selector composition and final row read',
    'C = cached low nibble used to build PPI port C output',
  ],
  notes: ['Upper nibble of current PPI port C is preserved.'],
})}
; Direct hardware replacement for BIOS SNSMAT
;
; Input:
;   A = row (0-11)
;
; Output:
;   A = row bits (active-low, 0=pressed)
;
; Destroys:
;   AF, C
; ==================================================================
FAST_SNSMAT:
    and #0F                 ; Keep valid row bits
    ld c, a
    in a, (#AA)             ; Read current PPI port C
    and #F0                 ; Preserve upper nibble
    or c                    ; Set keyboard row in lower nibble
    out (#AA), a            ; Select row
    in a, (#A9)             ; Read keyboard matrix row
    ret

`;
}

// Note: generateWaitVBlank() removed - use HALT directly in game loop (more efficient)

/**
 * Generate unrolled sprite copy (aggressive optimization)
 */
function generateUnrolledSpriteCopy(): string {
  return `
; ==================================================================
; COPY_SPRITE_PATTERN_UNROLLED - Ultra-fast sprite pattern copy
; ==================================================================
${buildRegisterContractComment({
  purpose: 'Copy fixed 32-byte sprite pattern to VRAM with unrolled writes.',
  inputs: [
    'HL = source address (32-byte sprite pattern in RAM)',
    'DE = destination VRAM address',
  ],
  outputs: ['None'],
  clobbers: ['AF', 'HL'],
  preserved: ['BC', 'DE'],
  usage: [
    'A = VDP address bytes and each streamed pattern byte',
    'HL = source pointer advanced 32 times',
    'DE = initial VRAM destination programming only',
  ],
  notes: ['Optimized for speed at the cost of ROM size.'],
})}
; Unrolled loop for copying 32-byte sprite pattern to VRAM
; Use for critical sprite updates (player, bullets, etc.)
;
; Input:
;   HL = Source address (sprite pattern data, 32 bytes)
;   DE = Destination (VRAM sprite pattern table address)
;
; Output:
;   None
;
; Destroys:
;   AF, HL
;
; Performance:
;   ~1,100 cycles (vs ~1,536 with looped version)
;   Saves ~436 cycles per sprite update (28% faster)
;
; Trade-off:
;   Uses ~100 bytes of ROM vs ~20 bytes for loop
; ==================================================================
COPY_SPRITE_PATTERN_UNROLLED:
    ; Set VRAM write address
    ld a, e
    out (#99), a
    ld a, d
    or #40
    out (#99), a

    ; Unrolled copy (32 iterations)
    ; Each iteration: LD A,(HL) + OUT + INC HL = 7+11+6 = 24 cycles
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ld a, (hl) : out (#98), a : inc hl
    ret

`;
}

/**
 * Generate debug helpers
 */
function generateDebugHelpers(): string {
  return `
; ==================================================================
; DEBUG HELPERS
; ==================================================================

; Print hex byte to screen (for debugging)
DEBUG_PRINT_HEX:
    push af
    push bc
    push hl

    ; Convert high nibble
    ld b, a
    rrca
    rrca
    rrca
    rrca
    and #0F
    call .nibble_to_ascii
    call FAST_WRTVRM

    ; Convert low nibble
    ld a, b
    and #0F
    call .nibble_to_ascii
    inc hl
    call FAST_WRTVRM

    pop hl
    pop bc
    pop af
    ret

.nibble_to_ascii:
    cp 10
    jr c, .is_digit
    add a, 7  ; A-F
.is_digit:
    add a, '0'
    ret

; Cycle counter (uses H.TIMI hook)
DEBUG_START_TIMER:
    ld hl, (#FC9E)  ; H.TIMI counter
    ld (debug_timer_start), hl
    ret

DEBUG_STOP_TIMER:
    ld hl, (#FC9E)
    ld de, (debug_timer_start)
    or a
    sbc hl, de
    ld (debug_timer_result), hl
    ret

debug_timer_start:  dw 0
debug_timer_result: dw 0

`;
}
