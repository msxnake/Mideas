; ==================================================================
; MINI_GAME75_MUSIC_TEST_MEGAROM_CHECK - MEGAROM UNIFIED FILE
; File: unitedFiles.asm
; ROM Mode: megarom (multi-bank, 8KB banks, ASCII8K/Konami pattern)
; Mapper: konami
;
; Bank 0 [#4000-#5FFFh] : Bootstrap (header, bios, mapper, interrupt, init)
; Banks 1-3 [#6000-#BFFFh] : Game code — FFD-packed primary (see layout below)
; Bank 4+ (code) [far]  : Far code banks — accessed via trampolines in bank 0
; Bank 4+ (data) [#C000h+] : DATA TABLES (patterns, colors, screens, font - P2 switch)
;
; Tiles: 12
; Sprites: 11
; Screens: 7
; Entities: 14
; Menus: Yes
; HUD: No
; State Machines: 2
; Engine Execution Mode: interruptTaskManager
; IRQ Task: slot 0 -> task_audio_tick (audio, every 1 frame)
; IRQ Task: slot 1 -> task_frame_counter (timer, every 1 frame)
; Mainline: postHalt -> update_sprites_to_vram (sprites)
; Mainline: preUpdate -> check_world_screen_transition (screenFlow)
; Mainline: postUpdate -> update_all_entities (entities)
; Mainline: postUpdate -> execute_all_state_machines (stateMachines)
; Mainline: postUpdate -> update_animated_tiles (animation)
; Mainline: postUpdate -> sfx_update (sfx)
; Mainline: render -> render_hud (hud)
; Warning: none
; ------------------------------------------------------------------
; DYNAMIC BANK PACKER (FFD) — Estimated layout for code banks
; ------------------------------------------------------------------
; Bank 1 [#6000-#8000]: components (51572/8192 bytes est.)
; Bank 2 [#8000-#A000]: statemachine (18222/8192 bytes est.)
; Bank 3 [#A000-#C000]: gameflow (13413/8192 bytes est.)
; Bank 4 [#6000-#8000]: sound (12643/8192 bytes est.)
; Bank 5 [#8000-#A000]: sprites (12350/8192 bytes est.)
; Bank 6 [#A000-#C000]: animtiles, scroll (6966/8192 bytes est.)
; Bank 7 [#6000-#8000]: entities (19757/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 8 [#8000-#A000]: screens_code (9985/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 9 [#A000-#C000]: worlds (7573/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 10 [#6000-#8000]: font (1950/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 11 [#8000-#A000]: patterns_code (1123/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 12 [#A000-#C000]: colors_code (1095/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 13 [#6000-#8000]: menus (437/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 4+ (data) [#C000+]: DATA (patterns, colors, screens, font, presentation)
; ------------------------------------------------------------------
; Far code banks: bank7(entities) bank8(screens_code) bank9(worlds) bank10(font) bank11(patterns_code) bank12(colors_code) bank13(menus)
; ------------------------------------------------------------------
; 8KB BANK PACKER ESTIMATE (diagnostic placement view)
; Runtime bank constants are derived from label addresses at assemble time.
; Estimated payload bytes: 157323
; Estimated banks used: 20
; ------------------------------------------------------------------
; BANK 00 @#0000 : page0.asm (96 bytes)
; BANK 00 @#0060 : patterns.asm (1123 bytes)
; BANK 00 @#04C3 : colors.asm (1095 bytes)
; BANK 00 @#090A : components.asm part 1/7 (5878 bytes)
; BANK 01 @#0000 : components.asm part 2/7 (8192 bytes)
; BANK 02 @#0000 : components.asm part 3/7 (8192 bytes)
; BANK 03 @#0000 : components.asm part 4/7 (8192 bytes)
; BANK 04 @#0000 : components.asm part 5/7 (8192 bytes)
; BANK 05 @#0000 : components.asm part 6/7 (8192 bytes)
; BANK 06 @#0000 : components.asm part 7/7 (4758 bytes)
; BANK 06 @#1296 : entities.asm part 1/3 (3434 bytes)
; BANK 07 @#0000 : entities.asm part 2/3 (8192 bytes)
; BANK 08 @#0000 : entities.asm part 3/3 (8131 bytes)
; BANK 08 @#1FC3 : worlds.asm (61 bytes)
; BANK 09 @#0000 : worlds.asm (7512 bytes)
; BANK 09 @#1D58 : screens.asm part 1/2 (680 bytes)
; BANK 10 @#0000 : screens.asm part 2/2 (8192 bytes)
; BANK 11 @#0000 : screens.asm part 3/2 (1114 bytes)
; BANK 11 @#045A : sprites.asm part 1/2 (7078 bytes)
; BANK 12 @#0000 : sprites.asm part 2/2 (5272 bytes)
; BANK 12 @#1498 : font.asm (1950 bytes)
; BANK 12 @#1C36 : hud.asm (79 bytes)
; BANK 12 @#1C85 : menus.asm (437 bytes)
; BANK 12 @#1E3A : sound.asm part 1/2 (454 bytes)
; BANK 13 @#0000 : sound.asm part 2/2 (8192 bytes)
; BANK 14 @#0000 : sound.asm part 3/2 (3997 bytes)
; BANK 14 @#0F9D : scroll.asm (2353 bytes)
; BANK 14 @#18CE : animtiles.asm (1842 bytes)
; BANK 15 @#0000 : animtiles.asm (2771 bytes)
; BANK 15 @#0AD3 : statemachine.asm part 1/3 (5421 bytes)
; BANK 16 @#0000 : statemachine.asm part 2/3 (8192 bytes)
; BANK 17 @#0000 : statemachine.asm part 3/3 (4645 bytes)
; BANK 17 @#1225 : gameflow.asm part 1/2 (3547 bytes)
; BANK 18 @#0000 : gameflow.asm part 2/2 (8192 bytes)
; BANK 19 @#0000 : gameflow.asm part 3/2 (1675 bytes); ==================================================================

; ##################################################################
; BANK 0 — Bootstrap (#4000h-#5FFFh, FIXED window in Konami mapper)
; Contains: header, bios, constants, variables, mapper, interrupt,
;           page-0 stubs, far-call trampolines, init_game_systems.
; All mapper_set_bank calls are here so they execute from this fixed bank.
; ##################################################################

; CRITICAL: header.asm with ORG #4000 and "AB" signature MUST be first
; ==================================================================
; MSX CARTRIDGE ROM HEADER
; File: header.asm
; Description: Standard MSX cartridge initialization
; GameFlow Integration: Using "Main" as execution orchestrator
; Flow: Start → SubMenu (HISTORY)
; ==================================================================

    org #4000           ; MSX cartridge start address

; ==================================================================
; CARTRIDGE HEADER
; ==================================================================
    db "AB"             ; MSX cartridge signature
    dw init_rom         ; Initialization address
    dw 0                ; Statement handler (not used)
    dw 0                ; Device handler (not used)
    dw 0                ; Text handler (not used)
    dw 0                ; Reserved
    dw 0                ; Reserved
    dw 0                ; Reserved

; ==================================================================
; ROM INITIALIZATION ENTRY POINT
; ==================================================================
init_rom:
    di
    im 1
    
    ; Initialize stack
    ld sp, #F380

    ; Cold boot path: ensure cartridge page 2 (8000h-BFFFh) is mapped to the cartridge slot.
    ; Required for both simple32k and plain48k: the BIOS only maps page 1 when it finds "AB",
    ; page 2 must be explicitly mapped via SETPAGES32K (reads page-1 slot, applies it to page 2).
    call SETPAGES32K
    jp restart_rom_continue

; Restart entry point for GameFlow Restart node.
; Reinitializes runtime safely without remapping cartridge pages.
restart_rom:
    di
    im 1
    ld sp, #F380

restart_rom_continue:
    ; Capture the normal slot state for optional linear 48K page-0 helpers.
    call init_page0_runtime_state

    ; Initialize mapper runtime state (safe no-op in simple32k mode)
    call mapper_runtime_init

    ; MEGAROM: Static bank setup — map physical banks 1-3 to their pages.
    ; Konami4 register layout: write to 6000h→6000-7FFFh, 8000h→8000-9FFFh, A000h→A000-BFFFh
    ; p1 writes to reg #6000, p2 to #8000, p3 to #A000.
    ; Bank 0 (4000h-5FFFh): fixed (Konami4 cannot change this page)
    ; Bank 1 (6000h-7FFFh): set via p1 (reg #6000)
    ; Bank 2 (8000h-9FFFh): set via p2 (reg #8000)
    ; Bank 3 (A000h-BFFFh): set via p3 (reg #A000)
    ld a, 1
    call mapper_set_bank_p1
    ld a, 2
    call mapper_set_bank_p2
    ld a, 3
    call mapper_set_bank_p3

    ; Reset some interrupts to ensure compatibility
    ; with MSX computers with disk controllers
    ld a, #C9
    ld (HKEY), a
    ; NOTE: TIMI (H.TIMI) is now managed by init_interrupt_system

    ; Silence click, init keyboard, clear config
    xor a
    ld (CLIKSW), a
    ld (deterministic), a
    
    ; Change background colors
    ld (BAKCLR), a
    ld (BDRCLR), a
    call CHGCLR

    ; Disable screen while switching modes / initializing VDP
    call DISSCR

    ; Change screen mode to SCREEN 2
    ld a, 2
    call CHGMOD

    ; Configure 16x16 sprites
    ; VDP Register #01: activate sprites, generate interrupts, 16x16 sprites
    ld bc, #E201
    call FAST_WRTVDP
    ; CRITICAL: Update BIOS system variable RG1SAV to match
    ; Without this, DISSCR/ENASCR will overwrite VDP R1 losing 16x16 sprite config
    ld a, #E2
    ld (#F3E0), a       ; RG1SAV = #E2 (preserves 16x16 sprite bit)

    ; Detect 50Hz/60Hz
    call CheckIf60Hz
    ld (isComputer50HzOr60Hz), a ; 0: 50Hz, 1: 60Hz

    ; ====================================================
    ; INTERRUPT SYSTEM INITIALIZATION (Konami-style)
    ; ====================================================
    ; Initialize interrupt task system (hooks H.TIMI)
    call init_interrupt_system
    di

    ; Register default tasks based on project needs
        ; Initialize PSG/audio once at boot. WorldLink must not reset music after a Music node.
    call init_sound_system

    ; Register boot-time IRQ tasks defined by the engine execution plan.
    call init_default_tasks_from_plan


    ei

    ; ====================================================
    ; GAMEFLOW INITIALIZATION
    ; ====================================================
    ; Initialize GameFlow system
    call gameflow_init

    ; Start execution from GameFlow Start node
    ; GameFlow is now the sole orchestrator
    call ENASCR
    jp gameflow_start

; ==================================================================
; AUXILIARY FUNCTIONS
; ==================================================================

; Helper: Get expanded slot value for ENASLT/CALSLT usage
; Input:  A = slot number (0-3) in lower bits
; Output: A = expanded slot value if needed
GETSLOT:
    and #03             ; Proteccion, nos aseguramos de que el valor esta en 0-3
    ld  c,a             ; c = slot de la pagina
    ld  b,0             ; bc = slot de la pagina
    ld  hl,#fcc1        ; Tabla de slots expandidos
    add hl,bc           ; hl -> variable que indica si este slot esta expandido
    ld  a,(hl)          ; Tomamos el valor
    and #80             ; Si el bit mas alto es cero...
    jr  z,GETSLOT_EXIT  ; ...nos vamos a @@EXIT
    ; --- El slot esta expandido ---
    or  c               ; Slot basico en el lugar adecuado
    ld  c,a             ; Guardamos el valor en c
    inc hl              ; Incrementamos hl una...
    inc hl              ; ...dos...
    inc hl              ; ...tres...
    inc hl              ; ...cuatro veces
    ld  a,(hl)          ; a = valor del registro de subslot del slot donde estamos
    and #0C             ; Nos quedamos con el valor donde esta nuestro cartucho
GETSLOT_EXIT:
    or  c
    ret

; From: http://www.z80st.es/downloads/code/
; SETPAGES32K:  BIOS-ROM-YY-ZZ   -> BIOS-ROM-ROM-ZZ (SITUA PAGINA 2)
SETPAGES32K:    ; --- Posiciona las paginas de un megarom o un 32K ---
    ld  a, #C9              ; Codigo de RET
    ld  (SETPAGES32K_NOPRET), a   ; Modificamos la siguiente instruccion si estamos en RAM
SETPAGES32K_NOPRET:
    nop                     ; No hacemos nada si no estamos en RAM
    ; --- Si llegamos aqui no estamos en RAM, hay que posicionar la pagina ---
    call RSLREG             ; Leemos el contenido del registro de seleccion de slots
    rrca                    ; Rotamos a la derecha...
    rrca                    ; ...dos veces
    call GETSLOT            ; Obtenemos el slot de la pagina 1 ($4000-$BFFF)
    ld (ROM_slot), a        ; Save slot for later use
    ld  h, #80              ; Seleccionamos pagina 2 ($8000-$BFFF)
    jp  ENASLT              ; Posicionamos la pagina 2 y volvemos

; Source: https://www.msx.org/forum/development/msx-development/how-0?page=0
; Returns 1 in a and clears z flag if vdp is 60Hz
CheckIf60Hz:
    di
    in      a, (#99)
    nop
    nop
    nop
vdpSync:
    in      a, (#99)
    and     #80
    jr      z, vdpSync

    ld      hl, #900
vdpLoop:
    dec     hl
    ld      a, h
    or      l
    jr      nz, vdpLoop

    in      a, (#99)
    rlca
    and     1
    ei
    ret

; ==================================================================
; END OF HEADER
; ==================================================================


; ==================================================================
; MSX BIOS FUNCTIONS AND ADDRESSES
; File: bios.asm
; Description: Standard MSX BIOS function definitions
; ==================================================================

; ==================================================================
; MAIN BIOS FUNCTIONS
; ==================================================================

; Screen and Display
CHGMOD  EQU #005F        ; Change screen mode (A=mode)
CHGCLR  EQU #0062        ; Change colors
CLS     EQU #00C3        ; Clear screen
POSIT   EQU #00C6        ; Position cursor (H=X, L=Y)
ERAFNK  EQU #00CC        ; Erase function keys
DSPFNK  EQU #00CF        ; Display function keys
DISSCR  EQU #0041        ; Disable screen (prevent flicker)
ENASCR  EQU #0044        ; Enable screen
INITXT  EQU #006C        ; Initialize text mode
INIT32  EQU #006F        ; Initialize screen mode
INIGRP  EQU #0072        ; Initialize graphics routines

; Character I/O
CHPUT   EQU #00A2        ; Character output (A=char)
CHGET   EQU #009F        ; Character input
CHSNS   EQU #009C        ; Character sense (check key)
BREAKX  EQU #00B7        ; Check CTRL+STOP
ISCNTC  EQU #00BA        ; Check CTRL+C

; String I/O
OUTDO   EQU #005A        ; String output (HL=string)

; Input Devices
GTSTCK  EQU #00D5        ; Get joystick status (A=port)
GTTRIG  EQU #00D8        ; Get trigger status (A=port)
GTPAD   EQU #00DB        ; Get paddle (A=port)
GTPDL   EQU #00DE        ; Get paddle value
SNSMAT  EQU #0141        ; Sense matrix (A=row)
KILBUF  EQU #0156        ; Kill keyboard buffer

; Slot Management
RSLREG  EQU #0138        ; Read slot register
WSLREG  EQU #013B        ; Write slot register
ENASLT  EQU #0024        ; Enable slot (H=page, A=slot)
CALSLT  EQU #001C        ; Call routine in another slot

; Sound
GICINI  EQU #0090        ; Initialize PSG
WRTPSG  EQU #0093        ; Write PSG register (A=reg, E=value)
RDPSG   EQU #0096        ; Read PSG register (A=reg)

; Graphics VDP
GRPPRT  EQU #0089        ; Print in graphic mode
SETGRP  EQU #007E        ; Set graphic mode

; Memory Transfer
LDIRVM  EQU #005C        ; Block transfer from CPU to VRAM
LDIRMV  EQU #0059        ; Block transfer from VRAM to CPU
WRTVDP  EQU #0047        ; Write to VDP register
WRTVRM  EQU #004D        ; Write data to VRAM (A=data, HL=address)

; File I/O (Disk BIOS) - Not used in cartridge ROMs
; DSKIO   EQU #004A      ; Disk I/O (conflicts with WRTVRM, not available in cartridge)
; DSKCHF  EQU #004D      ; Disk change flag (same address as WRTVRM, not used)

; Math
GETYPR  EQU #0053        ; Get type of variable

; ==================================================================
; VDP PORTS AND REGISTERS
; ==================================================================

; VDP Data/Status Ports
VDPDR   EQU #0098        ; VDP Data Register (Port 0)
VDPSR   EQU #0099        ; VDP Status Register (Port 1)

; VDP Registers (use with VDPSR)
VDP_R0  EQU 0            ; Mode register 0
VDP_R1  EQU 1            ; Mode register 1
VDP_R2  EQU 2            ; Name table base address
VDP_R3  EQU 3            ; Color table base address
VDP_R4  EQU 4            ; Pattern table base address
VDP_R5  EQU 5            ; Sprite attribute table
VDP_R6  EQU 6            ; Sprite pattern table
VDP_R7  EQU 7            ; Text/border color

; System Variables
HKEY    EQU #F3DB        ; Hook function key (system variable)
CLIKSW  EQU #F3DC        ; Key click switch
FORCLR  EQU #F3E8        ; Foreground color
BAKCLR  EQU #F3E9        ; Background color
BDRCLR  EQU #F3EA        ; Border color
isComputer50HzOr60Hz EQU #F3EB  ; System frequency flag

; ==================================================================
; NOTE: Fast hardware access routines (FAST_LDIRVM, FAST_WRTVRM, etc.)
;       are provided by directHardwareGenerator.ts when hybrid/direct mode
;       is enabled. See directHardwareGenerator.ts for implementations.
; ==================================================================

; ==================================================================
; END OF BIOS DEFINITIONS
; ==================================================================

; ==================================================================
; DIRECT HARDWARE ACCESS ROUTINES
; ==================================================================
; Mode: HYBRID
; Optimize Level: safe
; Debug: DISABLED
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


; ==================================================================
; FAST_LDIRVM - Fast Block Transfer to VRAM
; ==================================================================
; Register Contract:
;   Purpose: Block copy from RAM to VRAM using VDP data port auto-increment.
;   Inputs:
;     - HL = source address (RAM)
;     - DE = destination address (VRAM)
;     - BC = byte count
;   Outputs:
;     - None
;   Clobbers:
;     - AF
;     - BC
;     - HL
;   Preserved:
;     - DE
;   Register roles:
;     - A = VDP address bytes and data byte being transferred
;     - HL = RAM read pointer (increments each byte)
;     - DE = only used to program initial VRAM address
;     - BC = countdown loop counter
;   Notes:
;     - Caller must preserve AF/BC/HL if needed after call.

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
;   - Keeps IRQs masked for the whole transfer to avoid VDP port races
;   - Restores previous IRQ enable state on return
;   - Works on all MSX models (TMS9918, V9938, V9958)
; ==================================================================
FAST_LDIRVM:
    ; Disable interrupts during VDP port sequence to prevent ISR races.
    ; Always re-enables on exit (called from main loop where EI is guaranteed).
    ; NOTE: The old LD A,I / PUSH AF / RET PO pattern is unreliable on Z80 —
    ; an interrupt between LD A,I and PUSH AF clears P/V, skipping EI and
    ; leaving interrupts permanently disabled (next HALT locks the system).
    di

    ; Set VRAM write address
    ld a, e
    out (#99), a           ; Write address low byte to VDP
    nop                    ; Real VDPs need a short settle time between control writes
    ld a, d
    or #40                 ; Set bit 6 for write mode
    out (#99), a           ; Write address high byte + write command
    nop                    ; Let the VDP latch the address before the first data write

    ; Copy loop
.ldirvm_loop:
    ld a, (hl)             ; Read byte from RAM (7 cycles)
    out (#98), a           ; Write to VRAM data port (11 cycles)
    inc hl                 ; Next source address (6 cycles)
    dec bc                 ; Decrement counter (6 cycles)
    ld a, b                ; Check if BC = 0 (4 cycles)
    or c                   ; (4 cycles)
    jr nz, .ldirvm_loop    ; Loop if not zero (12/7 cycles)

    ei
    ret


; ==================================================================
; FAST_WRTVRM - Write Single Byte to VRAM
; ==================================================================
; Register Contract:
;   Purpose: Write one byte into VRAM while preserving caller-visible state.
;   Inputs:
;     - A = byte to write
;     - HL = VRAM destination address
;   Outputs:
;     - None
;   Clobbers:
;     - None (all registers preserved)
;   Preserved:
;     - AF
;     - BC
;     - DE
;     - HL
;   Register roles:
;     - A = temporarily saved/restored around VDP address programming
;     - HL = VRAM address source (not modified)
;   Notes:
;     - Safe helper when the caller cannot tolerate register changes.

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
;   - VDP write sequence is atomic against ISR VRAM writes
; ==================================================================
FAST_WRTVRM:
    ; Preserve caller-visible state. Disable interrupts during VDP write
    ; (see FAST_LDIRVM note on why LD A,I / RET PO is unsafe).
    push bc
    ld c, a                ; C = input data byte
    push af                ; Save caller AF
    di
    ld a, l
    out (#99), a           ; Address low (11 cycles)
    ld a, h
    or #40                 ; Write mode (7 cycles)
    out (#99), a           ; Address high + command (11 cycles)
    ld a, c
    out (#98), a           ; Write to VRAM (11 cycles)
    ei
    pop af                 ; Restore caller AF
    pop bc
    ret


; ==================================================================
; FAST_RDVRM - Read Single Byte from VRAM
; ==================================================================
; Register Contract:
;   Purpose: Read one byte from VRAM data port.
;   Inputs:
;     - HL = VRAM source address
;   Outputs:
;     - A = byte read from VRAM
;   Clobbers:
;     - AF
;   Preserved:
;     - BC
;     - DE
;     - HL
;   Register roles:
;     - A = VDP addressing command then read result
;     - HL = address source only (unchanged)
;   Notes:
;     - Callers relying on flags must account for AF clobber.

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
;   Slower than a naive single IN, but correct on TMS9918/MSX1 because
;   VRAM reads require one dummy fetch after setting the address.
;
; Notes:
;   - Useful for collision detection, tile reading
;   - First IN primes the VDP read-ahead buffer; second IN returns the byte
; ==================================================================
FAST_RDVRM:
    ld a, l
    out (#99), a           ; Address low
    ld a, h
    and #3F                ; Clear bit 6 for read mode (bit 7 must be 0)
    out (#99), a           ; Address high + read command
    nop                    ; Let the VDP latch the read address
    in a, (#98)            ; Dummy read: primes the TMS9918 prefetch buffer
    in a, (#98)            ; Actual byte from VRAM[HL]
    ret


; ==================================================================
; FAST_WRTVDP - Write VDP Register
; ==================================================================
; Register Contract:
;   Purpose: Write one VDP register value (value first, then register index).
;   Inputs:
;     - B = register value
;     - C = register number
;   Outputs:
;     - None
;   Clobbers:
;     - AF
;   Preserved:
;     - BC
;     - DE
;     - HL
;   Register roles:
;     - A = output staging register for both OUT operations
;     - B/C = preserved input pair for value and register id
;   Notes:
;     - Order of writes is mandatory for VDP register writes.

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


; ==================================================================
; FAST_GTSTCK - Read Joystick Direction
; ==================================================================
; Register Contract:
;   Purpose: Read joystick direction and map PSG bits to MSX GTSTCK direction code.
;   Inputs:
;     - A = joystick port (0 or 1)
;   Outputs:
;     - A = direction code (0-8)
;   Clobbers:
;     - AF
;     - HL
;   Preserved:
;     - BC
;     - DE
;   Register roles:
;     - A = PSG register selection, raw read, and final direction code
;     - HL = lookup table pointer into joystick_direction_table
;   Notes:
;     - Bits are active-low; routine inverts and masks input nibble.

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

    ; Make PSG select+read atomic so VBlank music writes cannot
    ; corrupt the selected register mid-access.
    di
    out (#A0), a           ; Write register number to PSG address port
    in a, (#A2)            ; Read value from PSG data port
    ei

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


; ==================================================================
; FAST_GTTRIG - Read Joystick Trigger
; ==================================================================
; Register Contract:
;   Purpose: Read joystick trigger bit directly from PSG register.
;   Inputs:
;     - A = joystick port (0 or 1)
;   Outputs:
;     - A = #FF if pressed, #00 if released
;   Clobbers:
;     - AF
;   Preserved:
;     - BC
;     - DE
;     - HL
;   Register roles:
;     - A = register select, raw PSG read, and normalized return value
;   Notes:
;     - Trigger is active-low in PSG bit 4.

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

    ; Make PSG select+read atomic so VBlank music writes cannot
    ; corrupt the selected register mid-access.
    di
    out (#A0), a
    in a, (#A2)
    ei

    ; Trigger bit (bit 4): 0 when pressed, 1 when released
    and #10
    ld a, #00
    ret nz
    ld a, #FF
    ret


; ==================================================================
; FAST_SNSMAT - Sense Keyboard Matrix Row
; ==================================================================
; Register Contract:
;   Purpose: Select keyboard matrix row via PPI and return row state.
;   Inputs:
;     - A = matrix row (0-11)
;   Outputs:
;     - A = row bits (active-low)
;   Clobbers:
;     - AF
;     - C
;   Preserved:
;     - B
;     - DE
;     - HL
;   Register roles:
;     - A = row selector composition and final row read
;     - C = cached low nibble used to build PPI port C output
;   Notes:
;     - Upper nibble of current PPI port C is preserved.

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


; ==================================================================
; END OF DIRECT HARDWARE ROUTINES
; ==================================================================


; ==================================================================
; MSX SYSTEM CONSTANTS
; File: constants.asm
; Description: MSX hardware constants and project-specific definitions
; ==================================================================

; ==================================================================
; VRAM LAYOUT - SCREEN 2 MODE
; ==================================================================

; Pattern Generator Table (PGT) - 3 Banks
CHRTBL  EQU #0000        ; Pattern table base address (alias)
CHRTBL2 EQU #0000        ; Pattern table base address (Bank 0)
; Bank 1: CHRTBL2 + #800   (#0800)
; Bank 2: CHRTBL2 + #1000  (#1000)

; Color Attribute Table (CAT) - 3 Banks
CLRTBL  EQU #2000        ; Color table base address (alias)
CLRTBL2 EQU #2000        ; Color table base address (Bank 0)
; Bank 1: CLRTBL2 + #800   (#2800)
; Bank 2: CLRTBL2 + #1000  (#3000)

; Other VRAM Areas
NAMETBL EQU #1800        ; Name table base address
SPRATR  EQU #1B00        ; Sprite attribute table
SPRPAT  EQU #3800        ; Sprite pattern table

; ==================================================================
; SCREEN MODES
; ==================================================================
SCREEN0     EQU 0        ; 40x24 text
SCREEN1     EQU 1        ; 32x24 text/graphics
SCREEN2     EQU 2        ; 256x192 graphics
SCREEN3     EQU 3        ; 64x48 multicolor

; ==================================================================
; SCREEN DIMENSIONS (DYNAMIC BASED ON PROJECT TILES)
; ==================================================================

; Project-specific tile dimensions detected:
; Tile 0: rajol_dalt_esq = 16x16px (2x2 MSX chars)
; Tile 1: roca_blava1 = 16x16px (2x2 MSX chars)
; Tile 2: punxa = 8x8px (1x1 MSX chars)
; Tile 3: gel3 = 16x16px (2x2 MSX chars)
; Tile 4: rajol_groc = 16x16px (2x2 MSX chars)
; Tile 5: gel2 = 16x16px (2x2 MSX chars)
; Tile 6: rajol_dalt = 16x16px (2x2 MSX chars)
; Tile 7: rajol_mig_ov = 16x16px (2x2 MSX chars)
; Tile 8: rajol_esq = 16x16px (2x2 MSX chars)
; Tile 9: rajols6 = 16x16px (2x2 MSX chars)
; Tile 10: rajol_dalt_dreta = 16x16px (2x2 MSX chars)
; Tile 11: rajol_dreta = 16x16px (2x2 MSX chars)

; Using primary tile size: 16x16px
TILE_WIDTH      EQU 16    ; Primary tile width in pixels
TILE_HEIGHT     EQU 16   ; Primary tile height in pixels
SCREEN_TILES_X  EQU 16    ; Horizontal tiles (256px ÷ 16px)
SCREEN_TILES_Y  EQU 12   ; Vertical tiles (192px ÷ 16px)
MSX_CHARS_PER_TILE_X EQU 2  ; MSX characters wide per tile
MSX_CHARS_PER_TILE_Y EQU 2 ; MSX characters high per tile



; ==================================================================
; MSX COLORS
; ==================================================================
TRANSPARENT EQU 0
BLACK       EQU 1
MEDIUM_GREEN EQU 2
LIGHT_GREEN EQU 3
DARK_BLUE   EQU 4
LIGHT_BLUE  EQU 5
DARK_RED    EQU 6
CYAN        EQU 7
MEDIUM_RED  EQU 8
LIGHT_RED   EQU 9
DARK_YELLOW EQU 10
LIGHT_YELLOW EQU 11
DARK_GREEN  EQU 12
MAGENTA     EQU 13
GRAY        EQU 14
WHITE       EQU 15

; ==================================================================
; INPUT CONSTANTS
; ==================================================================

; Joystick Directions
STICK_UP    EQU 1
STICK_UPRIGHT EQU 2
STICK_RIGHT EQU 3
STICK_DOWNRIGHT EQU 4
STICK_DOWN  EQU 5
STICK_DOWNLEFT EQU 6
STICK_LEFT  EQU 7
STICK_UPLEFT EQU 8
STICK_CENTER EQU 0

; Trigger Constants
TRIG_A      EQU #10      ; Trigger A (Fire)
TRIG_B      EQU #20      ; Trigger B (MSX2+)

; Input Button Bitmask
INPUT_BTN_FIRE EQU #01   ; Fire/Space button bit in input_btn_curr/input_btn_prev

; Direction flags shared by input/state machine helpers
DIR_ALLOW_UP     EQU #01 ; Bit 0: Allow UP movement
DIR_ALLOW_DOWN   EQU #02 ; Bit 1: Allow DOWN movement
DIR_ALLOW_LEFT   EQU #04 ; Bit 2: Allow LEFT movement
DIR_ALLOW_RIGHT  EQU #08 ; Bit 3: Allow RIGHT movement

; ==================================================================
; TILE BEHAVIOR CONSTANTS (for collision detection)
; ==================================================================

; Tile Behavior encoding matches TileEditor logicalProperties.mapId:
;   bits 7-4 = solidity family
;   bits 3-0 = property flags
TILE_PASSABLE       EQU #00    ; Family 0: passable / no-solid
TILE_SOLID          EQU #10    ; Family 1: solid wall/floor
TILE_PLATFORM       EQU #20    ; Family 2: top-solid platform
TILE_SLOPE          EQU #30    ; Family 3: slope / custom solid family
TILE_BREAKABLE      EQU #01    ; Flag bit 0
TILE_MOVABLE        EQU #02    ; Flag bit 1
TILE_DEADLY         EQU #04    ; Flag bit 2: causesDamage
TILE_INTERACTABLE   EQU #08    ; Flag bit 3: isInteractiveSwitch

; Collision Directions (for platform logic)
COLL_FROM_ABOVE     EQU #01    ; Entity approaching from above
COLL_FROM_BELOW     EQU #02    ; Entity approaching from below
COLL_FROM_LEFT      EQU #04    ; Entity approaching from left
COLL_FROM_RIGHT     EQU #08    ; Entity approaching from right

; Entity Collision Layer Presets (entity_collision_layer / entity_collides_with)
COLLISION_LAYER_PLAYER      EQU #01
COLLISION_LAYER_ENEMY       EQU #02
COLLISION_LAYER_PROJECTILE  EQU #04
COLLISION_LAYER_PLATFORM    EQU #08
COLLISION_LAYER_ITEM        EQU #10

; Entity-Entity Collision Event Flags (entity_entity_collision_flags)
COLLISION_EVENT_ENTITY      EQU #01
COLLISION_EVENT_ENEMY       EQU #02
COLLISION_EVENT_ITEM        EQU #04

; ==================================================================
; MIDEAS GLOBAL VARIABLES - CONSTANTS FOR VALUES
; ==================================================================

; Goal Variable Values (default)
GOAL_FAILURE            EQU 0    ; Goal = "Failure"
GOAL_COMPLETED          EQU 1    ; Goal = "Completed"


; ==================================================================
; GAME FLOW STATES (PROJECT-SPECIFIC)
; ==================================================================

; Basic Game Flow States (always available)
FLOW_STATE_MAIN_MENU    EQU 0
FLOW_STATE_GAME         EQU 1
FLOW_STATE_PAUSE        EQU 2
FLOW_STATE_GAME_OVER    EQU 3
FLOW_STATE_CREDITS      EQU 4

; GameFlow Node Types
NODE_TYPE_START         EQU 0    ; Start node (initial entry point)
NODE_TYPE_WORLDLINK     EQU 1    ; World link node (loads world map)
NODE_TYPE_WORLD_LINK    EQU 1    ; Alias with underscore (for compatibility)
NODE_TYPE_SCREEN        EQU 2    ; Screen node (loads specific screen)
NODE_TYPE_MENU          EQU 3    ; Menu node (shows menu interface)
NODE_TYPE_SUBMENU       EQU 3    ; Alias for menu node
NODE_TYPE_SUB_MENU      EQU 3    ; Alias with underscore (for compatibility)
NODE_TYPE_TEXT          EQU 4    ; Text node (displays text)
NODE_TYPE_TRANSITION    EQU 5    ; Transition node
NODE_TYPE_RESTART       EQU 6    ; Restart node (restart game/level)
NODE_TYPE_END           EQU 7    ; End node (game over, victory, credits)
NODE_TYPE_IF_THEN_ELSE  EQU 8    ; IfThenElse node (conditional branch)
NODE_TYPE_GLOBALS       EQU 9    ; Globals node (global variable ops)
NODE_TYPE_WAYPOINT      EQU 10   ; Waypoint node (routing marker)
NODE_TYPE_GROUP         EQU 11   ; Group node (nested flow)
NODE_TYPE_MUSIC         EQU 12   ; Music node (audio command)
NODE_TYPE_PRESENTATION_SCREEN EQU 13 ; Presentation Screen node (static tile screen)
NODE_TYPE_UNKNOWN       EQU 255  ; Unknown/unsupported node type

; Additional Game Flow States detected in project
; (Custom states would be added here if needed)


; ==================================================================
; PROJECT-SPECIFIC CONSTANTS
; ==================================================================

; Detected Assets
TOTAL_SPRITES           EQU 14
TOTAL_TILES             EQU 12
TOTAL_SCREENS           EQU 7

; ==================================================================
; END OF CONSTANTS
; ==================================================================


; ==================================================================
; RAM VARIABLES DEFINITIONS
; File: variables.asm
; Description: Dynamic variable allocation using EQU addresses
; Generated based on project analysis
; ==================================================================

; ==================================================================
; CORE SYSTEM VARIABLES (ALWAYS PRESENT)
; ==================================================================
input_state         EQU #C000   ; Current direction state (0-8)
prev_input_state    EQU #C001   ; Previous direction state (0-8)
input_btn_curr      EQU #C002   ; Current input buttons bitmask (bit0=fire)
input_btn_prev      EQU #C003   ; Previous input buttons bitmask (bit0=fire)
input_fire          EQU #C004   ; Fire button state (0=released, 1=pressed)
current_flow_state  EQU #C005   ; Current game flow state
prev_flow_state     EQU #C006   ; Previous game flow state
gameflow_exit_requested EQU #C007   ; Exit flag for WorldLink loop
gameflow_menu_selection EQU #C008   ; Current/last submenu selection
gameflow_submenu_data_ptr EQU #C009   ; Pointer to active submenu data (16-bit)
gameflow_submenu_option_count EQU #C00B   ; Cached submenu option count
gameflow_submenu_cursor_enabled EQU #C00C   ; 1 when submenu uses sprite cursor
gameflow_submenu_cursor_layer_count EQU #C00D   ; Cursor sprite layer count (1..4)
gameflow_condition_result EQU #C00E   ; Result of last condition evaluation
transition_delay_var    EQU #C00F   ; Frames per step for active transition effect

; ==================================================================
; MIDEAS GLOBAL VARIABLES (DEFAULTS + CUSTOM)
; ==================================================================
global_var_goal     EQU #C010   ; Goal status (0=Failure, 1=Completed)

; ==================================================================
; SYSTEM VARIABLES
; ==================================================================
ROM_slot            EQU #C011   ; Expanded slot for normal page 1 ROM access
slot_primary_normal EQU #C012   ; Primary slot register snapshot for BIOS-ROM-ROM-RAM layout
page0_bios_slot     EQU #C013   ; Expanded slot for normal BIOS page 0
page2_normal_slot   EQU #C014   ; Expanded slot for normal page 2 layout
page3_normal_slot   EQU #C015   ; Expanded slot for normal RAM page 3
mapper_bank_p1_current EQU #C016   ; Mapper current bank for page/window 1
mapper_bank_p2_current EQU #C017   ; Mapper current bank for page/window 2
mapper_bank_p3_current EQU #C018   ; Mapper current bank for page/window 3
mapper_bank_p4_current EQU #C019   ; Mapper current bank for page/window 4
mapper_saved_bank    EQU #C01A   ; Saved mapper bank for push/pop helpers
mapper_saved_bank_p1 EQU #C01B   ; Saved mapper bank for page/window 1 helpers
mapper_saved_bank_p3 EQU #C01C   ; Saved mapper bank for page/window 3 helpers
mapper_saved_bank_p4 EQU #C01D   ; Saved mapper bank for page/window 4 helpers
frame_counter       EQU #C01E   ; Frame counter (16-bit)

; Profiling counters (16-bit, cumulative)
prof_update_all_entities_calls EQU #C020   ; Calls to update_all_entities
prof_execute_sm_calls EQU #C022   ; Calls to execute_all_state_machines
prof_sm_update_calls  EQU #C024   ; Calls to SM_Update
prof_collision_calls  EQU #C026   ; Calls to update_collision_component
prof_wall_calls       EQU #C028   ; Calls to update_wallcollision_component
prof_deadly_calls     EQU #C02A   ; Calls to update_deadly_tiles_component
prof_tile_interaction_calls EQU #C02C   ; Calls to check_tile_interaction
prof_animation_calls  EQU #C02E   ; Calls to update_animation_component
prof_sprite_calls     EQU #C030   ; Calls to update_sprite_component
prof_music_task_calls EQU #C032   ; Calls to task_update_music
prof_deadly_behavior_reads EQU #C034   ; Deadly helper behavior-map reads
page0_transfer_buffer EQU #C036   ; Temporary RAM buffer for page0 -> VRAM copies

; ==================================================================
; SCREEN MAP POINTERS (Current active screen)
; ==================================================================
current_screen_layout   EQU #C136   ; Pointer to current screen layout data (16-bit)
current_screen_layout_bank EQU #C138   ; Mapper bank for current screen layout data
current_behavior_map    EQU #C139   ; Pointer to current behavior map data (16-bit)
current_behavior_map_bank EQU #C13B   ; Mapper bank for current behavior map data
behavior_cache_row     EQU #C13C   ; Cached behavior row (255=invalid)
behavior_cache_map_l   EQU #C13D   ; Cached behavior map pointer low byte
behavior_cache_map_h   EQU #C13E   ; Cached behavior map pointer high byte
behavior_cache_row_base EQU #C13F   ; Cached row base address in behavior map (16-bit)
RUNTIME_SCREEN_MAP_SIZE EQU 768
MAX_RUNTIME_EFFECT_ZONES EQU 64
runtime_background_layout EQU #C141   ; Immutable copy of current background layout (32x24)
runtime_screen_layout  EQU #C441   ; Mutable copy of current screen layout (32x24)
runtime_behavior_map   EQU #C741   ; Mutable copy of current behavior map (32x24)
runtime_effects_layout EQU #CA41   ; Alternate effects layout copy for secret zones (32x24)
runtime_effect_zone_table EQU #CD41   ; Current screen effect zone table (MAX_RUNTIME_EFFECT_ZONES * 8 bytes)
current_effect_zone_count EQU #CF41   ; Number of effect zones copied into runtime_effect_zone_table
secret_zone_active EQU #CF42   ; 1 if hero is currently inside an active secret zone
secret_zone_rect_x EQU #CF43   ; Active secret zone rect X in cells
secret_zone_rect_y EQU #CF44   ; Active secret zone rect Y in cells
secret_zone_rect_w EQU #CF45   ; Active secret zone rect width in cells
secret_zone_rect_h EQU #CF46   ; Active secret zone rect height in cells

; ==================================================================
; VIEWPORT/CAMERA VARIABLES (for scroll system)
; ==================================================================
camera_x            EQU #CF47   ; Camera X position in pixels (16-bit)
camera_y            EQU #CF49   ; Camera Y position in pixels (16-bit)
camera_tile_x       EQU #CF4B   ; Camera tile X (column)
camera_tile_y       EQU #CF4C   ; Camera tile Y (row)
world_width_tiles   EQU #CF4D   ; World width in tiles
world_height_tiles  EQU #CF4E   ; World height in tiles
scroll_dirty_flag   EQU #CF4F   ; 1=viewport changed, needs redraw
hud_dirty_flag      EQU #CF50   ; 1=HUD needs redraw, 0=clean
time_second_frame_counter EQU #CF51   ; VBlank frames remaining until the next TimeRemaining decrement
time_last_interrupt_counter EQU #CF52   ; Last interrupt_counter snapshot used by TimeRemaining sync (16-bit)

; ==================================================================
; ANIMATED TILES VARIABLES
; ==================================================================
anim_tile_timer     EQU #CF54   ; Animation frame timer
anim_tile_frame     EQU #CF55   ; Current animation frame (0-3)
anim_tile_speed     EQU #CF56   ; Frames between animation updates
anim_tile_transform_flags EQU #CF57   ; Runtime flags for transform-mode tile animation (byte0=flags, byte1=opcode scratch)
anim_tile_row_buffer EQU #CF59   ; Temp buffer (8 bytes) for row transforms

; ==================================================================
; ENTITY SYSTEM VARIABLES (Fixed 32 entities)
; ==================================================================
MAX_ENTITIES        EQU 32
entity_active       EQU #CF61   ; Entity active flags (32 bytes, 0=inactive, 1=active)
entity_is_player    EQU #CF81   ; Entity hero/player flag (32 bytes, 0=no, 1=yes)
entity_x_pos        EQU #CFA1   ; Entity X positions (32 bytes)
entity_y_pos        EQU #CFC1   ; Entity Y positions (32 bytes)
entity_vel_x        EQU #CFE1   ; Entity X velocity (32 bytes)
entity_vel_y        EQU #D001   ; Entity Y velocity (32 bytes)
entity_comp_masks   EQU #D021   ; Entity component masks (32 bytes)
entity_comp_masks_hi EQU #D041   ; Entity component masks high byte (32 bytes)
entity_screen_id    EQU #D061   ; Entity screen ID (32 bytes)
entity_job_period   EQU #D081   ; Entity job period in frames (32 bytes, 1=100%,2=50%,3=33%,4=25%)
entity_job_entry    EQU #D0A1   ; Entity job entry slot within period window (32 bytes)
entity_job_scheduler_active EQU #D0C1   ; 1 when any entity uses non-default job cadence
entity_dir_mask     EQU #D0C2   ; Entity direction mask (32 bytes)
entity_input_speed  EQU #D0E2   ; Entity input/cursor speed (32 bytes)
entity_health       EQU #D102   ; Entity health (32 bytes)
entity_anim_frame   EQU #D122   ; Entity animation frame (32 bytes)
entity_anim_tick    EQU #D142   ; Entity animation tick counter (32 bytes)
entity_anim_speed   EQU #D162   ; Entity animation speed (ticks per frame) (32 bytes)
entity_anim_flags   EQU #D182   ; Entity animation flags (32 bytes)
entity_sm_ptr_l     EQU #D1A2   ; Entity State Pointer Low (32 bytes)
entity_sm_ptr_h     EQU #D1C2   ; Entity State Pointer High (32 bytes)
entity_sm_timer_l   EQU #D1E2   ; Entity State Timer Low (32 bytes)
entity_sm_timer_h   EQU #D202   ; Entity State Timer High (32 bytes)
entity_sm_wait_timer EQU #D222   ; Entity State Wait Timer (32 bytes)
entity_lifetime     EQU #D242   ; Entity lifetime for auto-destroy (32 bytes, 0=infinite)
entity_carried_by   EQU #D262   ; Entity carrier ID (32 bytes, 255=not carried)
entity_template_token EQU #D282   ; Entity template token (32 bytes, 0=unknown)
entity_facing_dir   EQU #D2A2   ; Last facing direction (32 bytes, 0=none,1=left,2=right,3=up,4=down)
entity_sm_var_0     EQU #D2C2   ; Entity Variable 0 (32 bytes)
entity_sm_var_1     EQU #D2E2   ; Entity Variable 1 (32 bytes)
entity_sm_var_2     EQU #D302   ; Entity Variable 2 (32 bytes)
entity_sm_var_3     EQU #D322   ; Entity Variable 3 (32 bytes)
entity_sm_var_4     EQU #D342   ; Entity Variable 4 (32 bytes)
entity_sm_var_5     EQU #D362   ; Entity Variable 5 (32 bytes)
entity_sm_var_6     EQU #D382   ; Entity Variable 6 (32 bytes)
entity_sm_var_7     EQU #D3A2   ; Entity Variable 7 (32 bytes)

; ==================================================================
; SPRITE SYSTEM VARIABLES
; ==================================================================
entity_sprite_asset_index EQU #D3C2   ; Entity sprite asset index - RAM copy (32 bytes)
active_sprite_count EQU #D3E2   ; Number of sprites currently active
sprites_dirty      EQU #D3E3   ; 1=sprite_attributes changed, needs VRAM sync
sprite_pattern      EQU #D3E4   ; Sprite pattern IDs (32 bytes)
sprite_color        EQU #D404   ; Sprite colors (32 bytes)
sprite_layer_colors EQU #D424   ; HW sprite layer color cache - RAM copy (32 bytes, indexed by HW sprite index)
sprite_asset_base_pattern_slot_runtime EQU #D444   ; Runtime base 16x16 slot per sprite asset (14 bytes)
sprite_placeholder_base_pattern_num EQU #D452   ; Runtime placeholder pattern number (base slot * 4)
sprite_attributes   EQU #D453   ; Interleaved sprite attributes (32 * 4 bytes)

; ==================================================================
; SCREEN SYSTEM VARIABLES (7 screens detected)
; ==================================================================
current_screen_id   EQU #D4D3   ; Currently displayed screen ID
screen_dirty_flag   EQU #D4D4   ; Screen needs redraw flag
screen_transition_cooldown EQU #D4D5   ; Cooldown frames after screen transition
current_world_id    EQU #D4D6   ; Current world ID (for multi-world support)
current_screen_index EQU #D4D7   ; Current screen index within world
current_screen_anim_group_count EQU #D4D8   ; Animated tile groups visible in current screen
current_screen_entity_count EQU #D4D9   ; Entity instances assigned to current screen
current_screen_sprite_pattern_slots EQU #D4DA   ; Sprite pattern slots needed by current screen
current_screen_summary_flags EQU #D4DB   ; Runtime screen summary flags (music/hud/effects/anim)

; ==================================================================
; PLAYER SYSTEM VARIABLES (player entity detected)
; ==================================================================
player_x            EQU #D4DC   ; Player X position (16-bit)
player_y            EQU #D4DE   ; Player Y position (16-bit)
player_runtime_enabled EQU #D4E0   ; 1=player fast runtime bound to hero entity
player_entity_index EQU #D4E1   ; Entity index used by player fast runtime (#FF=none)
player_vx_runtime   EQU #D4E2   ; Cached player X velocity (signed 8-bit)
player_vy_runtime   EQU #D4E3   ; Cached player Y velocity (signed 8-bit)
player_health       EQU #D4E4   ; Player health points
player_score        EQU #D4E5   ; Player score (16-bit)
gem_count           EQU #D4E7   ; Collectible tile counter (8-bit)
last_gem_char       EQU #D4E8   ; Char code of last collected gem tile (for SM VARIABLE_COMPARE)

; Persistent collectibles list (survives screen re-entry)
MAX_COLLECTIBLES     EQU 64              ; Max persistent collectible records
collected_count      EQU #D4E9   ; Number of collected tiles recorded (8-bit)
collected_world      EQU #D4EA   ; World IDs for each collected tile (MAX_COLLECTIBLES bytes)
collected_screen     EQU #D52A   ; Screen IDs for each collected tile (MAX_COLLECTIBLES bytes)
collected_idx_l      EQU #D56A   ; Tile name-table index low byte (MAX_COLLECTIBLES bytes)
collected_idx_h      EQU #D5AA   ; Tile name-table index high byte (MAX_COLLECTIBLES bytes)

; Timed bonus tile respawn slots (bonus gem regeneration)
MAX_BONUS_RESPAWNS   EQU 16              ; Max timed bonus tiles waiting to respawn
bonus_respawn_world  EQU #D5EA   ; World IDs for timed bonus respawns (MAX_BONUS_RESPAWNS bytes)
bonus_respawn_screen EQU #D5FA   ; Screen IDs for timed bonus respawns (MAX_BONUS_RESPAWNS bytes)
bonus_respawn_idx_l  EQU #D60A   ; Tile index low byte for timed respawns (MAX_BONUS_RESPAWNS bytes)
bonus_respawn_idx_h  EQU #D61A   ; Tile index high byte for timed respawns (MAX_BONUS_RESPAWNS bytes)
bonus_respawn_secs   EQU #D62A   ; Remaining seconds per timed respawn slot (MAX_BONUS_RESPAWNS bytes)
bonus_respawn_frames EQU #D63A   ; Frame countdown (60..1) per timed respawn slot (MAX_BONUS_RESPAWNS bytes)

; ==================================================================
; AUXILIARY VARIABLES 
; ==================================================================
deterministic        EQU #D64A   ; Deterministic mode flag

; ==================================================================
; TEMPORARY VARIABLES (ALWAYS NEEDED)
; ==================================================================
temp_word_1         EQU #D64B   ; Temporary 16-bit storage
temp_word_2         EQU #D64D   ; Temporary 16-bit storage
temp_byte_1         EQU #D64F   ; Temporary 8-bit storage
temp_byte_2         EQU #D650   ; Temporary 8-bit storage
temp_byte_3         EQU #D651   ; Temporary 8-bit storage (32 bytes)
temp_byte_4         EQU #D671   ; Temporary 8-bit storage (32 bytes)
temp_byte_5         EQU #D691   ; Temporary 8-bit storage (32 bytes)
temp_byte_6         EQU #D6B1   ; Temporary 8-bit storage (32 bytes)

; ==================================================================
; SOUND SYSTEM VARIABLES
; ==================================================================
sfx_active          EQU #D6D1   ; 0=no SFX active, 1=playing
sfx_timer           EQU #D6D2   ; Frames remaining for current SFX
sfx_fadeout         EQU #D6D3   ; Reserved fadeout flag/state
temp_byte_7         EQU #D6D4   ; Temporary 8-bit storage (32 bytes)
temp_byte_8         EQU #D6F4   ; Temporary 8-bit storage (32 bytes)
temp_byte_9         EQU #D714   ; Temporary 8-bit storage (32 bytes)
temp_byte_10        EQU #D734   ; Temporary 8-bit storage (32 bytes)
temp_byte_11        EQU #D754   ; Temporary 8-bit storage (32 bytes)
temp_byte_12        EQU #D774   ; Temporary 8-bit storage (32 bytes)
temp_byte_13        EQU #D794   ; Temporary 8-bit storage (32 bytes)
temp_byte_14        EQU #D7B4   ; Temporary 8-bit storage (32 bytes)
temp_byte_15        EQU #D7D4   ; Temporary 8-bit storage (32 bytes)
temp_byte_16        EQU #D7F4   ; Temporary 8-bit storage (32 bytes)
temp_byte_17        EQU #D814   ; Temporary 8-bit storage (32 bytes)
temp_byte_18        EQU #D834   ; Temporary 8-bit storage (32 bytes)
temp_byte_19        EQU #D854   ; Temporary 8-bit storage (32 bytes)
temp_byte_20        EQU #D874   ; Temporary 8-bit storage (32 bytes)
temp_byte_21        EQU #D894   ; Temporary 8-bit storage (32 bytes)
temp_byte_22        EQU #D8B4   ; Temporary 8-bit storage (32 bytes)
temp_byte_23        EQU #D8D4   ; Temporary 8-bit storage (32 bytes)
temp_byte_24        EQU #D8F4   ; Temporary 8-bit storage (32 bytes)
temp_byte_25        EQU #D914   ; Temporary 8-bit storage (32 bytes)
temp_word_3         EQU #D934   ; Temporary 16-bit storage (64 bytes)
temp_word_4         EQU #D974   ; Temporary 16-bit storage (64 bytes)
temp_byte_26        EQU #D9B4   ; Temporary 8-bit storage (32 bytes)
temp_byte_27        EQU #D9D4   ; Temporary 8-bit storage (32 bytes)
temp_byte_28        EQU #D9F4   ; Temporary 8-bit storage (32 bytes)
tileDead_dbg        EQU #DA14   ; Debug byte: current hero deadly contact
tileDead_latched_dbg EQU #DA15   ; Debug byte: latched hero deadly contact
tileDead_x_dbg      EQU #DA16   ; Debug byte: last sampled deadly tile X
tileDead_y_dbg      EQU #DA17   ; Debug byte: last sampled deadly tile Y
tileDead_value_dbg  EQU #DA18   ; Debug byte: last raw deadly behavior value

; Wall collision temporary variables
wall_temp_x         EQU #DA19   ; Cached entity X for wall checks
wall_temp_y         EQU #DA1A   ; Cached entity Y for wall checks
wall_hit_left       EQU #DA1B   ; Hitbox left edge cache
wall_hit_top        EQU #DA1C   ; Hitbox top edge cache
wall_hit_right      EQU #DA1D   ; Hitbox right edge cache
wall_hit_bottom     EQU #DA1E   ; Hitbox bottom edge cache
wall_hit_w          EQU #DA1F   ; Hitbox width cache (min 1)
wall_hit_h          EQU #DA20   ; Hitbox height cache (min 1)
wall_probe_left     EQU #DA21   ; X probe near hitbox left (adaptive inset)
wall_probe_right    EQU #DA22   ; X probe near hitbox right (adaptive inset)
wall_probe_top      EQU #DA23   ; Y probe near hitbox top (adaptive inset)
wall_probe_bottom   EQU #DA24   ; Y probe near hitbox bottom (adaptive inset)

; Unified update helpers
active_entity_list  EQU #DA25   ; Entity indices with non-zero component masks (MAX_ENTITIES bytes)
active_entity_count EQU #DA45   ; Number of entries in active_entity_list
hero_entity_id      EQU #DA46   ; First current-screen entity flagged as player (#FF = none)
active_entity_list_dirty EQU #DA47   ; 1=rebuild active_entity_list required
input_entity_list   EQU #DA48   ; Active current-screen entities with Input component (MAX_ENTITIES bytes)
input_entity_count  EQU #DA68   ; Number of entries in input_entity_list
render_entity_list  EQU #DA69   ; Active current-screen entities with Sprite component (MAX_ENTITIES bytes)
render_entity_count EQU #DA89   ; Number of entries in render_entity_list
collision_entity_list EQU #DA8A   ; Active current-screen entities with Collision component (MAX_ENTITIES bytes)
collision_entity_count EQU #DAAA   ; Number of entries in collision_entity_list
ground_entity_list  EQU #DAAB   ; Active current-screen entities with Collision or Gravity (MAX_ENTITIES bytes)
ground_entity_count EQU #DACB   ; Number of entries in ground_entity_list
anim_entity_list    EQU #DACC   ; Active current-screen entities with Animation+Sprite (MAX_ENTITIES bytes)
anim_entity_count   EQU #DAEC   ; Number of entries in anim_entity_list

; Entity-entity collision optimized variables
coll_list           EQU #DAED   ; Active collidable entity indices (MAX_ENTITIES bytes)
coll_list_count     EQU #DB0D   ; Number of entities in coll_list
coll_src_left       EQU #DB0E   ; Source AABB left edge (scratch)
coll_src_right      EQU #DB0F   ; Source AABB right edge (scratch)
coll_src_top        EQU #DB10   ; Source AABB top edge (scratch)
coll_src_bottom     EQU #DB11   ; Source AABB bottom edge (scratch)

; ==================================================================
; INTERRUPT SYSTEM VARIABLES (dynamically allocated)
; ==================================================================
task_table              EQU #DB12   ; Task table base (8 slots x 2 bytes = 16 bytes)
task_0_ptr              EQU #DB12   ; Slot 0 pointer (2 bytes)
task_1_ptr              EQU #DB14   ; Slot 1 pointer (2 bytes)
task_2_ptr              EQU #DB16   ; Slot 2 pointer (2 bytes)
task_3_ptr              EQU #DB18   ; Slot 3 pointer (2 bytes)
task_4_ptr              EQU #DB1A   ; Slot 4 pointer (2 bytes)
task_5_ptr              EQU #DB1C   ; Slot 5 pointer (2 bytes)
task_6_ptr              EQU #DB1E   ; Slot 6 pointer (2 bytes)
task_7_ptr              EQU #DB20   ; Slot 7 pointer (2 bytes)
interrupt_system_enabled EQU #DB22   ; 0=disabled, 1=enabled (1 byte)
old_htimi_hook          EQU #DB23   ; Original H.TIMI hook (5 bytes)
interrupt_counter       EQU #DB28   ; Frame counter (16-bit)
task_exec_time          EQU #DB2A   ; Cycles used by tasks (16-bit, debug)
vblank_flag             EQU #DB2C   ; Set to 1 on each VBlank (1 byte)
RAM_INTERRUPT_END       EQU #DB2D   ; End of interrupt system

; ==================================================================
; STATE MACHINE SOUND RUNTIME (one active sound asset)
; ==================================================================
sm_sound_active       EQU #DB2D   ; 0=idle, 1=playing state-machine sound asset
sm_sound_frames_left  EQU #DB2E   ; Frames left for current state-machine sound asset
sm_sound_ptr_l        EQU #DB2F   ; Next sound frame pointer low byte
sm_sound_ptr_h        EQU #DB30   ; Next sound frame pointer high byte

; ==================================================================
; TRACKER MUSIC RUNTIME
; ==================================================================
music_active         EQU #DB31   ; 0=stopped, 1=track active
music_muted          EQU #DB32   ; 0=audible, 1=muted/pause
music_loop           EQU #DB33   ; 0=no loop, 1=loop enabled
music_track_index    EQU #DB34   ; Current ROM track index
music_row_frames     EQU #DB35   ; Frames per tracker row
music_row_countdown  EQU #DB36   ; Countdown to next row
music_order_pos      EQU #DB37   ; Current order position
music_pattern_index  EQU #DB38   ; Current pattern index
music_pattern_row    EQU #DB39   ; Current row inside pattern
music_pattern_rows   EQU #DB3A   ; Cached rows in current pattern
music_track_ptr_l    EQU #DB3B   ; Current track pointer low byte
music_track_ptr_h    EQU #DB3C   ; Current track pointer high byte
music_pattern_ptr_l  EQU #DB3D   ; Current pattern rows pointer low byte
music_pattern_ptr_h  EQU #DB3E   ; Current pattern rows pointer high byte
music_mixer_shadow   EQU #DB3F   ; PSG mixer shadow for music runtime
music_ch_note_base EQU #DB40   ; Current note index (255=silent) (3 bytes)
music_ch_a_note EQU #DB40   ; Channel A
music_ch_b_note EQU #DB41   ; Channel B
music_ch_c_note EQU #DB42   ; Channel C
music_ch_instrument_base EQU #DB43   ; Current instrument id (0=none) (3 bytes)
music_ch_a_instrument EQU #DB43   ; Channel A
music_ch_b_instrument EQU #DB44   ; Channel B
music_ch_c_instrument EQU #DB45   ; Channel C
music_ch_ornament_base EQU #DB46   ; Current ornament id (0=none) (3 bytes)
music_ch_a_ornament EQU #DB46   ; Channel A
music_ch_b_ornament EQU #DB47   ; Channel B
music_ch_c_ornament EQU #DB48   ; Channel C
music_ch_volume_base EQU #DB49   ; Current base volume (0-15) (3 bytes)
music_ch_a_volume EQU #DB49   ; Channel A
music_ch_b_volume EQU #DB4A   ; Channel B
music_ch_c_volume EQU #DB4B   ; Channel C
music_ch_vol_step_base EQU #DB4C   ; Reserved software volume envelope step (3 bytes)
music_ch_a_vol_step EQU #DB4C   ; Channel A
music_ch_b_vol_step EQU #DB4D   ; Channel B
music_ch_c_vol_step EQU #DB4E   ; Channel C
music_ch_tone_step_base EQU #DB4F   ; Reserved software tone envelope step (3 bytes)
music_ch_a_tone_step EQU #DB4F   ; Channel A
music_ch_b_tone_step EQU #DB50   ; Channel B
music_ch_c_tone_step EQU #DB51   ; Channel C
music_ch_noise_step_base EQU #DB52   ; Reserved software noise envelope step (3 bytes)
music_ch_a_noise_step EQU #DB52   ; Channel A
music_ch_b_noise_step EQU #DB53   ; Channel B
music_ch_c_noise_step EQU #DB54   ; Channel C
music_ch_orn_step_base EQU #DB55   ; Reserved ornament step (3 bytes)
music_ch_a_orn_step EQU #DB55   ; Channel A
music_ch_b_orn_step EQU #DB56   ; Channel B
music_ch_c_orn_step EQU #DB57   ; Channel C

; ==================================================================
; ZX0 TEMPORARY RAM BUFFERS
; ==================================================================
; Fixed high-RAM scratch area used by compressed asset loaders and
; plain48k page-0 decompression helpers.
ZX0_SCREEN_BUFFER       EQU #DE00   ; Screen/layout scratch (768 bytes)
ZX0_BEHAVIOR_BUFFER     EQU #E100   ; Behavior map scratch (768 bytes)
ZX0_TILE_PATTERN_BUFFER EQU #E400   ; Tile pattern scratch (1488 bytes)
ZX0_TILE_COLOR_BUFFER   EQU #EA00   ; Tile color scratch (1488 bytes)
ZX0_FONT_PATTERN_BUFFER EQU #F000   ; Font pattern scratch (360 bytes)
; Keep font buffers tightly packed to leave enough headroom below SP=#F380.
; Old layout put FONT_COLOR at #F200, leaving only 24 bytes before the stack.
ZX0_FONT_COLOR_BUFFER   EQU #F168   ; Font color scratch (360 bytes)

; ==================================================================
; END OF VARIABLES
; ==================================================================
RAM_USAGE_END       EQU #DB58   ; End of project variables (7000 bytes used)

; ==================================================================
; MEMORY LAYOUT INFO (Reference only - no code generated)
; ==================================================================
; RAM Layout:
;   #C000-#DB58: Project variables (7000 bytes)
;   #DB58-#F37F: Free RAM (~6184 bytes available)
;   #F380-#FFFF: MSX System variables (DO NOT TOUCH)
;
; NOTE: Variables are defined using EQU (address labels only).
;       RAM space is used at runtime, NOT reserved in ROM.
;       Do NOT use ORG #C000 in cartridge ROMs!
; ==================================================================


; ==================================================================
; MAPPER RUNTIME API
; File: mapper.asm
; Description: Centralized mapper register writes (no scattered inline writes)
; Target mapper: konami
; ROM mode: megarom (autoMegaROM=false)
; ==================================================================

; Konami (without SCC) write window references:
;   6000h-7FFFh, 8000h-9FFFh, A000h-BFFFh are switch registers.
; Note: in original Konami cartridges 4000h-5FFFh is typically fixed.
; Mapper register writes are enabled for this build configuration.

; Mapper registers for active target format
MAPPER_REG_P1       EQU #6000
MAPPER_REG_P2       EQU #8000
MAPPER_REG_P3       EQU #A000
MAPPER_REG_P4       EQU #A000

; ------------------------------------------------------------------
; mapper_runtime_init
; Initializes mapper state variables with deterministic defaults.
; ------------------------------------------------------------------
mapper_runtime_init:
    xor a
    ld (mapper_bank_p1_current), a
    ld a, 1
    ld (mapper_bank_p2_current), a
    ld a, 2
    ld (mapper_bank_p3_current), a
    ld a, 3
    ld (mapper_bank_p4_current), a
    ret

; ------------------------------------------------------------------
; API: mapper_set_bank_pX
; Input: A = bank number
; ------------------------------------------------------------------
mapper_set_bank_p1:
    ld (mapper_bank_p1_current), a
    ld (MAPPER_REG_P1), a
    ret

mapper_set_bank_p2:
    ld (mapper_bank_p2_current), a
    ld (MAPPER_REG_P2), a
    ret

mapper_set_bank_p3:
    ld (mapper_bank_p3_current), a
    ld (MAPPER_REG_P3), a
    ret

mapper_set_bank_p4:
    ld (mapper_bank_p4_current), a
    ld (MAPPER_REG_P4), a
    ret

; ------------------------------------------------------------------
; Helpers for deterministic save/restore around far calls.
; ------------------------------------------------------------------
mapper_push_p1:
    ld a, (mapper_bank_p1_current)
    ld (mapper_saved_bank_p1), a
    ret

mapper_pop_p1:
    ld a, (mapper_saved_bank_p1)
    jp mapper_set_bank_p1

mapper_push_p2:
    ld a, (mapper_bank_p2_current)
    ld (mapper_saved_bank), a
    ret

mapper_pop_p2:
    ld a, (mapper_saved_bank)
    jp mapper_set_bank_p2

mapper_push_p3:
    ld a, (mapper_bank_p3_current)
    ld (mapper_saved_bank_p3), a
    ret

mapper_pop_p3:
    ld a, (mapper_saved_bank_p3)
    jp mapper_set_bank_p3

mapper_push_p4:
    ld a, (mapper_bank_p4_current)
    ld (mapper_saved_bank_p4), a
    ret

mapper_pop_p4:
    ld a, (mapper_saved_bank_p4)
    jp mapper_set_bank_p4

; ------------------------------------------------------------------
; Far call helpers (dynamic target address in HL)
; Input:
;   A = target bank number
;   HL = target routine address in selected page window
; Output:
;   Returns after restoring previous bank.
; ------------------------------------------------------------------
mapper_call_hl_p1:
    push hl
    push af
    call mapper_push_p1
    pop af
    call mapper_set_bank_p1
    pop hl
    ld de, .return_p1
    push de
    jp (hl)
.return_p1:
    call mapper_pop_p1
    ret

mapper_call_hl_p2:
    push hl
    push af
    call mapper_push_p2
    pop af
    call mapper_set_bank_p2
    pop hl
    ld de, .return_p2
    push de
    jp (hl)
.return_p2:
    call mapper_pop_p2
    ret

mapper_call_hl_p3:
    push hl
    push af
    call mapper_push_p3
    pop af
    call mapper_set_bank_p3
    pop hl
    ld de, .return_p3
    push de
    jp (hl)
.return_p3:
    call mapper_pop_p3
    ret

mapper_call_hl_p4:
    push hl
    push af
    call mapper_push_p4
    pop af
    call mapper_set_bank_p4
    pop hl
    ld de, .return_p4
    push de
    jp (hl)
.return_p4:
    call mapper_pop_p4
    ret

; ------------------------------------------------------------------
; mapper_call_hl_auto
; Auto-select mapper window from HL target address range:
;   4000-5FFF -> p1
;   6000-7FFF -> p2
;   8000-9FFF -> p3
;   A000-BFFF -> p4
; Input:
;   A = target bank
;   HL = target routine address
; ------------------------------------------------------------------
mapper_call_hl_auto:
    push af
    ld a, h
    cp #60
    jr c, .use_p1
    cp #80
    jr c, .use_p2
    cp #A0
    jr c, .use_p3
    pop af
    jp mapper_call_hl_p4

.use_p1:
    pop af
    jp mapper_call_hl_p1

.use_p2:
    pop af
    jp mapper_call_hl_p2

.use_p3:
    pop af
    jp mapper_call_hl_p3


; ==================================================================
; PAGE-0 STUBS — labels required by header.asm, no-ops in megarom
; ==================================================================
init_page0_runtime_state:
    ret

page0_map_expanded_slot:
    ret

page0_map_game_rom:
    ret

page0_restore_bios_rom:
    ret

page0_copy_chunk_to_buffer:
    ret

page0_decompress_to_ram:
    ret

page0_copy_to_vram:
    ret

; ==================================================================
; INTERRUPT TASK SYSTEM - File: interrupt.asm
; Konami-style technique: Hook H.TIMI for 50/60Hz task execution
; ==================================================================

; ==================================================================
; INTERRUPT SYSTEM MEMORY LAYOUT
; Variables are defined in variables.asm (dynamically allocated)
; This avoids RAM overlap with entity system arrays
; ==================================================================
; Slots: task_table (8 slots x 2 bytes), task_0_ptr..task_7_ptr
; State: interrupt_system_enabled, old_htimi_hook, interrupt_counter,
;        task_exec_time, vblank_flag
; ==================================================================

; ==================================================================
; INIT_INTERRUPT_SYSTEM - Install H.TIMI hook
; ==================================================================
; Register Contract:
;   Purpose: Install JP hook on H.TIMI and initialize interrupt task state.
;   Inputs:
;     - None
;   Outputs:
;     - None
;   Clobbers:
;     - AF
;     - BC
;     - DE
;     - HL
;   Preserved:
;     - None
;   Register roles:
;     - HL/DE/BC = block copy parameters for hook backup and task table clear
;     - A = enable flag and zeroing value
;   Notes:
;     - Runs with DI/EI, so caller must not assume interrupt state is unchanged.

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
; Register Contract:
;   Purpose: Restore original H.TIMI bytes and mark system disabled.
;   Inputs:
;     - None
;   Outputs:
;     - None
;   Clobbers:
;     - AF
;     - BC
;     - DE
;     - HL
;   Preserved:
;     - None
;   Register roles:
;     - HL/DE/BC = LDIR source/destination/count for hook restore
;     - A = zero flag write to interrupt_system_enabled
;   Notes:
;     - Runs with DI/EI for atomic hook restoration.

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
; Register Contract:
;   Purpose: Dispatch enabled interrupt tasks each VBlank and chain BIOS hook.
;   Inputs:
;     - Triggered by H.TIMI hook
;   Outputs:
;     - interrupt_counter incremented
;     - vblank_flag refreshed
;   Clobbers:
;     - AF
;     - BC
;     - DE
;     - HL
;     - IX
;     - IY (all restored before exit)
;   Preserved:
;     - DE
;     - IX
;     - IY
;   Register roles:
;     - HL = walks task_table and holds task pointer
;     - B = task slot loop counter
;     - C = temporary low byte for pointer reconstruction
;     - A = enabled checks and pointer validation
;   Notes:
;     - Dispatcher saves/restores DE/IX/IY defensively, reducing coupling with task internals.

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

; ==================================================================
; TASK MANAGEMENT FUNCTIONS
; ==================================================================

; ==================================================================
; NOTE: wait_vblank function removed - use HALT directly in game loop
; HALT is more efficient (no call/ret overhead)
; ==================================================================

; ==================================================================
; UPDATE_VBLANK_FLAG - For interrupt dispatcher use only
; ==================================================================
; Register Contract:
;   Purpose: Read VDP status register and latch VBlank state in RAM flag.
;   Inputs:
;     - None
;   Outputs:
;     - vblank_flag = 0/1
;   Clobbers:
;     - AF (internally saved/restored)
;   Preserved:
;     - AF, BC, DE, HL
;   Register roles:
;     - A = VDP status read and boolean conversion

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
; Register Contract:
;   Purpose: Store routine pointer into task_table slot.
;   Inputs:
;     - A = task slot (0-7)
;     - HL = task routine address
;   Outputs:
;     - task_table[slot] = HL
;   Clobbers:
;     - AF
;     - BC
;     - DE
;     - HL
;   Preserved:
;     - None
;   Register roles:
;     - A = slot validation and offset math
;     - DE = holds routine address while HL is repurposed as slot pointer
;     - BC = task_table base address
;     - HL = slot address calculation / pointer write

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
; Register Contract:
;   Purpose: Clear routine pointer in selected task slot.
;   Inputs:
;     - A = task slot (0-7)
;   Outputs:
;     - task_table[slot] = 0
;   Clobbers:
;     - AF
;     - DE
;     - HL
;   Preserved:
;     - BC
;   Register roles:
;     - A = slot validation and zero value for clearing
;     - HL = destination slot pointer
;     - DE = computed slot offset

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
; Register Contract:
;   Purpose: Expose current 16-bit interrupt frame counter.
;   Inputs:
;     - None
;   Outputs:
;     - HL = interrupt_counter
;   Clobbers:
;     - HL
;   Preserved:
;     - AF
;     - BC
;     - DE
;   Register roles:
;     - HL = loaded return value

; Inputs: None
; Outputs: HL = frame count (16-bit)
; Modifies: HL
; ==================================================================
get_frame_count:
    ld hl, (interrupt_counter)
    ret

; ==================================================================
; INIT_DEFAULT_TASKS_FROM_PLAN - Register engine-selected IRQ tasks
; ==================================================================
; Register Contract:
;   Purpose: Enable the IRQ task set selected by the engine execution plan.
;   Inputs:
;     - None
;   Outputs:
;     - task_table updated for all enabled-at-boot tasks
;   Clobbers:
;     - AF
;     - HL
;   Preserved:
;     - BC
;     - DE
;   Register roles:
;     - A = task slot
;     - HL = task routine address
;   Notes:
;     - Calls enable_task once per enabled task.
init_default_tasks_from_plan:
    ld a, 0
    ld hl, task_audio_tick
    call enable_task
    ld a, 1
    ld hl, task_frame_counter
    call enable_task
    ret

; ==================================================================
; SHARED MAINLINE TASK WRAPPERS
; ==================================================================
; These wrappers stay available in interruptTaskManager mode because
; the HALT-driven GameFlow loops still call them directly.
; ==================================================================

; ==================================================================
; TASK_UPDATE_INPUT - Joystick/Cursor polling wrapper
; ==================================================================
; Register Contract:
;   Purpose: Poll joystick + keyboard fallback and update input state buffers.
;   Inputs:
;     - Reads hardware via FAST_GTSTCK / FAST_GTTRIG / FAST_SNSMAT
;   Outputs:
;     - input_state, prev_input_state, input_btn_curr, input_btn_prev, input_fire
;   Clobbers:
;     - AF
;     - BC
;     - DE
;   Preserved:
;     - AF
;     - BC
;     - DE (by push/pop wrapper)
;     - HL
;   Register roles:
;     - A = hardware reads and final scalar writes
;     - B = direction accumulator
;     - D = button bitmask and keyboard direction flags
;     - E = temporary keyboard row bits
;   Notes:
;     - Wrapper preserves caller-visible regs despite internal mutation.
task_update_input:
    push af
    push bc
    push de

    ; Save previous state
    ld a, (input_state)
    ld (prev_input_state), a
    ld a, (input_btn_curr)
    ld (input_btn_prev), a

    ; Read joystick direction first (priority source, direct hardware)
    xor a                       ; Joystick 0
    call FAST_GTSTCK            ; Direct hardware read
    ld b, a                     ; B = joystick direction
    or a
    jr nz, .dir_ready

    ; Fallback to keyboard cursor keys (row 8, direct matrix read)
    ld a, 8
    call FAST_SNSMAT            ; Active low bits
    ld e, a
    xor a
    ld d, a                     ; D = direction flags: 0=none
    bit 5, e                    ; Up
    jr nz, .kbd_no_up
    set 0, d
.kbd_no_up:
    bit 6, e                    ; Down
    jr nz, .kbd_no_down
    set 1, d
.kbd_no_down:
    bit 4, e                    ; Left
    jr nz, .kbd_no_left
    set 2, d
.kbd_no_left:
    bit 7, e                    ; Right
    jr nz, .kbd_no_right
    set 3, d
.kbd_no_right:
    xor a
    bit 0, d
    jr z, .kbd_check_down
    bit 3, d
    jr nz, .kbd_upright
    bit 2, d
    jr nz, .kbd_upleft
    ld a, STICK_UP
    jr .kbd_done
.kbd_upright:
    ld a, STICK_UPRIGHT
    jr .kbd_done
.kbd_upleft:
    ld a, STICK_UPLEFT
    jr .kbd_done
.kbd_check_down:
    bit 1, d
    jr z, .kbd_check_lr
    bit 3, d
    jr nz, .kbd_downright
    bit 2, d
    jr nz, .kbd_downleft
    ld a, STICK_DOWN
    jr .kbd_done
.kbd_downright:
    ld a, STICK_DOWNRIGHT
    jr .kbd_done
.kbd_downleft:
    ld a, STICK_DOWNLEFT
    jr .kbd_done
.kbd_check_lr:
    bit 2, d
    jr z, .kbd_check_right
    ld a, STICK_LEFT
    jr .kbd_done
.kbd_check_right:
    bit 3, d
    jr z, .kbd_done
    ld a, STICK_RIGHT
.kbd_done:
    ld b, a
.dir_ready:
    ; Normalize diagonals to cardinal directions for runtime stability
    ; UP+RIGHT/DOWN+RIGHT -> RIGHT, UP+LEFT/DOWN+LEFT -> LEFT
    ld a, b
    cp STICK_UPRIGHT
    jr z, .dir_norm_right
    cp STICK_DOWNRIGHT
    jr z, .dir_norm_right
    cp STICK_UPLEFT
    jr z, .dir_norm_left
    cp STICK_DOWNLEFT
    jr z, .dir_norm_left
    jr .dir_norm_done
.dir_norm_right:
    ld a, STICK_RIGHT
    jr .dir_norm_store
.dir_norm_left:
    ld a, STICK_LEFT
.dir_norm_store:
    ld b, a
.dir_norm_done:
    xor a                       ; Joystick 0
    call FAST_GTTRIG            ; A = #FF if pressed, 0 if not
    ld d, 0                     ; D = button bitmask
    or a
    jr z, .no_fire              ; Jump if NOT pressed (A=0)
    ld d, INPUT_BTN_FIRE
    ld a, 1                     ; Fire pressed
    ld (input_fire), a
    jr .fire_done
.no_fire:
    ; Keyboard fallback for fire (SPACE, row 8 bit 0, active low)
    ld a, 8
    call FAST_SNSMAT
    bit 0, a
    jr nz, .fire_released
    ld d, INPUT_BTN_FIRE
    ld a, 1
    ld (input_fire), a
    jr .fire_done
.fire_released:
    xor a                       ; Fire not pressed
    ld (input_fire), a
.fire_done:
    ld a, b
    ld (input_state), a
    ld a, d
    ld (input_btn_curr), a

    pop de
    pop bc
    pop af
    ret

; ==================================================================
; ENGINE EXECUTION PLAN TASKS
; ==================================================================

; Slot 0: audio_tick -> task_audio_tick (period=1)
; Slot 1: frame_counter -> task_frame_counter (period=1)

; ==================================================================
; TASK_FRAME_COUNTER - Custom timing/animations
; ==================================================================
; Placeholder for user-defined frame-based timing
; interrupt_counter is already incremented in dispatcher
; ==================================================================
; Register Contract:
;   Purpose: Optional per-frame timing hook for lightweight counters/animations.
;   Inputs:
;     - None
;   Outputs:
;     - None
;   Clobbers:
;     - None
;   Preserved:
;     - AF
;     - BC
;     - DE
;     - HL
;   Register roles:
;     - No registers modified in the default implementation
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
; FAR-CALL TRAMPOLINES — bank 0 (always accessible at #4000-#5FFF)
; Far banks are mapped to their window temporarily, routine is called,
; then the original bank is restored. Window used matches the bank ORG.
; ==================================================================

; --- Far bank 7 [#6000, window P1] trampolines ---
FAR_BANK_7 EQU 7

init_entities_far:
    push af
    call mapper_push_p1
    ld a, FAR_BANK_7
    call mapper_set_bank_p1
    call init_entities
    call mapper_pop_p1
    pop af
    ret

; --- Far bank 8 [#8000, window P2] trampolines ---
FAR_BANK_8 EQU 8

load_screen_pan1_760723005040_far:
    push af
    call mapper_push_p2
    ld a, FAR_BANK_8
    call mapper_set_bank_p2
    call load_screen_pan1_760723005040
    call mapper_pop_p2
    pop af
    ret

load_screen_pan2_760784762679_far:
    push af
    call mapper_push_p2
    ld a, FAR_BANK_8
    call mapper_set_bank_p2
    call load_screen_pan2_760784762679
    call mapper_pop_p2
    pop af
    ret

load_screen_pan3_760799152493_far:
    push af
    call mapper_push_p2
    ld a, FAR_BANK_8
    call mapper_set_bank_p2
    call load_screen_pan3_760799152493
    call mapper_pop_p2
    pop af
    ret

load_screen_pan4_760799516565_far:
    push af
    call mapper_push_p2
    ld a, FAR_BANK_8
    call mapper_set_bank_p2
    call load_screen_pan4_760799516565
    call mapper_pop_p2
    pop af
    ret

load_screen_pan5_760961565333_far:
    push af
    call mapper_push_p2
    ld a, FAR_BANK_8
    call mapper_set_bank_p2
    call load_screen_pan5_760961565333
    call mapper_pop_p2
    pop af
    ret

load_screen_pan62_761237904051_far:
    push af
    call mapper_push_p2
    ld a, FAR_BANK_8
    call mapper_set_bank_p2
    call load_screen_pan62_761237904051
    call mapper_pop_p2
    pop af
    ret

load_screen_pan7_761471728391_far:
    push af
    call mapper_push_p2
    ld a, FAR_BANK_8
    call mapper_set_bank_p2
    call load_screen_pan7_761471728391
    call mapper_pop_p2
    pop af
    ret

; --- Far bank 9 [#A000, window P3] trampolines ---
FAR_BANK_9 EQU 9

load_world_default_far:
    push af
    call mapper_push_p3
    ld a, FAR_BANK_9
    call mapper_set_bank_p3
    call load_world_default
    call mapper_pop_p3
    pop af
    ret

check_world_screen_transition_far:
    push af
    call mapper_push_p3
    ld a, FAR_BANK_9
    call mapper_set_bank_p3
    call check_world_screen_transition
    call mapper_pop_p3
    pop af
    ret

load_world_worldmap_1760724209990_far:
    push af
    call mapper_push_p3
    ld a, FAR_BANK_9
    call mapper_set_bank_p3
    call load_world_worldmap_1760724209990
    call mapper_pop_p3
    pop af
    ret

transition_worldmap_1760724209990_0_far:
    push af
    call mapper_push_p3
    ld a, FAR_BANK_9
    call mapper_set_bank_p3
    call transition_worldmap_1760724209990_0
    call mapper_pop_p3
    pop af
    ret

transition_worldmap_1760724209990_1_far:
    push af
    call mapper_push_p3
    ld a, FAR_BANK_9
    call mapper_set_bank_p3
    call transition_worldmap_1760724209990_1
    call mapper_pop_p3
    pop af
    ret

transition_worldmap_1760724209990_2_far:
    push af
    call mapper_push_p3
    ld a, FAR_BANK_9
    call mapper_set_bank_p3
    call transition_worldmap_1760724209990_2
    call mapper_pop_p3
    pop af
    ret

transition_worldmap_1760724209990_3_far:
    push af
    call mapper_push_p3
    ld a, FAR_BANK_9
    call mapper_set_bank_p3
    call transition_worldmap_1760724209990_3
    call mapper_pop_p3
    pop af
    ret

transition_worldmap_1760724209990_4_far:
    push af
    call mapper_push_p3
    ld a, FAR_BANK_9
    call mapper_set_bank_p3
    call transition_worldmap_1760724209990_4
    call mapper_pop_p3
    pop af
    ret

transition_worldmap_1760724209990_5_far:
    push af
    call mapper_push_p3
    ld a, FAR_BANK_9
    call mapper_set_bank_p3
    call transition_worldmap_1760724209990_5
    call mapper_pop_p3
    pop af
    ret

transition_worldmap_1760724209990_6_far:
    push af
    call mapper_push_p3
    ld a, FAR_BANK_9
    call mapper_set_bank_p3
    call transition_worldmap_1760724209990_6
    call mapper_pop_p3
    pop af
    ret

; --- Far bank 10 [#6000, window P1] trampolines ---
FAR_BANK_10 EQU 10

init_font_system_far:
    push af
    call mapper_push_p1
    ld a, FAR_BANK_10
    call mapper_set_bank_p1
    call init_font_system
    call mapper_pop_p1
    pop af
    ret

; --- Far bank 11 [#8000, window P2] trampolines ---
FAR_BANK_11 EQU 11

load_pattern_bank0_far:
    push af
    call mapper_push_p2
    ld a, FAR_BANK_11
    call mapper_set_bank_p2
    call load_pattern_bank0
    call mapper_pop_p2
    pop af
    ret

load_pattern_bank1_far:
    push af
    call mapper_push_p2
    ld a, FAR_BANK_11
    call mapper_set_bank_p2
    call load_pattern_bank1
    call mapper_pop_p2
    pop af
    ret

load_pattern_bank2_far:
    push af
    call mapper_push_p2
    ld a, FAR_BANK_11
    call mapper_set_bank_p2
    call load_pattern_bank2
    call mapper_pop_p2
    pop af
    ret

load_patterns_to_vram_far:
    push af
    call mapper_push_p2
    ld a, FAR_BANK_11
    call mapper_set_bank_p2
    call load_patterns_to_vram
    call mapper_pop_p2
    pop af
    ret

; --- Far bank 12 [#A000, window P3] trampolines ---
FAR_BANK_12 EQU 12

load_color_bank0_far:
    push af
    call mapper_push_p3
    ld a, FAR_BANK_12
    call mapper_set_bank_p3
    call load_color_bank0
    call mapper_pop_p3
    pop af
    ret

load_color_bank1_far:
    push af
    call mapper_push_p3
    ld a, FAR_BANK_12
    call mapper_set_bank_p3
    call load_color_bank1
    call mapper_pop_p3
    pop af
    ret

load_color_bank2_far:
    push af
    call mapper_push_p3
    ld a, FAR_BANK_12
    call mapper_set_bank_p3
    call load_color_bank2
    call mapper_pop_p3
    pop af
    ret

load_colors_to_vram_far:
    push af
    call mapper_push_p3
    ld a, FAR_BANK_12
    call mapper_set_bank_p3
    call load_colors_to_vram
    call mapper_pop_p3
    pop af
    ret

; --- Far bank 13 [#6000, window P1] trampolines ---
FAR_BANK_13 EQU 13

; ==================================================================
; INIT_GAME_SYSTEMS — in bank 0 so it is reachable from any bank
; Calls routines in statically-mapped primary banks (1-3) via CALL.
; Routines in far banks (4+) are called via _far trampolines above.
; ==================================================================
init_game_systems:
    call DISSCR               ; Disable screen while loading VRAM assets
    ; Initialize component systems (entities detected)
    call init_components

    ; Load pattern and color data (tiles detected)
    call load_pattern_bank0_far
    call load_pattern_bank1_far
    call load_pattern_bank2_far
    call load_color_bank0_far
    call load_color_bank1_far
    call load_color_bank2_far

    ; Initialize animated tile runtime (safe no-op if no animated groups)
    call init_animated_tiles

    ; Initialize game entities with real positions from JSON
    call init_entities_far

    ; Load the first game screen
    call load_game_screen
    call rebuild_used_entity_list

    ; Initialize font system
    call init_font_system_far
    call ENASCR               ; Re-enable screen after VRAM updates
    ret

load_game_screen:
    ret

; --- End of Bank 0 — pad to 8KB boundary ---
    ds #6000 - $, #FF

; ##################################################################
; BANK 1 — [#6000h-#8000h] PRIMARY: components
; (Always mapped at boot: bank1→P1, bank2→P2, bank3→P3)
; ##################################################################
    org #6000

; ==================================================================
; GAME COMPONENT SYSTEMS - MSX ECS ENGINE
    ; File: components.asm
        ; Description: Component systems based on Mideas React.js architecture
    ; Implements Position, Sprite, Movement, Collision, Input, and Behavior systems
    ; ==================================================================
;
; INTELLIGENT FILTERING ACTIVE:
;   Active entities: 14
;   Used components: Position, Sprite, Behavior, Health, Jump, Gravity, Animation, Collision, Input, StateMachine, Cursors, Carry, comp_shoot, comp_physics, Patrol, WallCollision, comp_box, Collectible, Damage
;   Filtered out: -11 unused component systems
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
COMP_DEADLY_TILES EQU 13; Deadly behavior-map tile detection marker

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
COMP_MASK_DEADLY_TILES EQU #2000; Binary: 0010000000000000

; ==================================================================
; ANIMATION FLAGS (entity_anim_flags)
; ==================================================================
ANIM_FLAG_PLAYING            EQU #01
ANIM_FLAG_LOOP               EQU #02
ANIM_FLAG_ONLY_WHEN_MOVING   EQU #04
ANIM_FLAG_COMPLETED          EQU #08
ANIM_FLAG_FORCE_UPLOAD       EQU #10
ANIM_DEFAULT_SPEED           EQU 8

    ; ==================================================================
; COMPONENT DATA STRUCTURES(Entity - Component arrays)
    ; ==================================================================

; NOTE: Core entity variables are now defined in variables.asm
    ; (entity_x_pos, entity_y_pos, entity_vel_x, entity_vel_y, entity_comp_masks, etc.)

    ; Jump Component Data(Fixed - Point 8.8 for smooth physics)
    ; Using temporary storage for optional components to save RAM
entity_jump_vel_y   EQU temp_word_3; Y velocity for jumping(signed word, 32 words = 64 bytes)
entity_slash_vel_x  EQU temp_byte_3; Additive horizontal slash velocity from bonus tiles (32 bytes)
entity_slash_vel_y  EQU temp_byte_28; Additive vertical slash velocity from bonus tiles (32 bytes)
entity_jump_count   EQU temp_byte_4; Current jump count(0 = grounded, 1 = first jump, etc.)(32 bytes)
entity_jump_max     EQU temp_byte_25; Configured max jumps for this entity (32 bytes)
entity_jump_bonus   EQU temp_byte_27; Temporary extra jumps granted by bonus tiles (32 bytes)
entity_on_ground    EQU temp_byte_5; Ground contact flag(bit 0 = on ground)(32 bytes)

    ; Gravity Component Data
entity_gravity_vel  EQU temp_word_4; Accumulated gravity velocity(signed word, 64 bytes)

    ; Health Component Data
entity_health_current EQU temp_byte_6 ; Current health/lives (32 bytes)
entity_health_max     EQU temp_byte_7 ; Maximum health/lives (32 bytes)

; Deadly Tile Collision Data
entity_flag_deadly_tile EQU temp_byte_8 ; Flag: bit 0 = touching deadly tile (32 bytes)
entity_deadly_collision EQU temp_byte_8 ; Backward-compatible alias
tileDead EQU tileDead_dbg ; Debug byte: mirrors hero deadly contact (entity 0)
tileDeadLatched EQU tileDead_latched_dbg ; Debug byte: latched hero deadly detection
tileDeadX EQU tileDead_x_dbg ; Debug byte: last sampled tile X
tileDeadY EQU tileDead_y_dbg ; Debug byte: last sampled tile Y
tileDeadValue EQU tileDead_value_dbg ; Debug byte: raw behavior byte read

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
entity_wall_collision_flags EQU temp_byte_18 ; Directional wall collision bits (32 bytes)
entity_collision_hitbox_w EQU temp_byte_19 ; Entity collision hitbox width (32 bytes)
entity_collision_hitbox_h EQU temp_byte_20 ; Entity collision hitbox height (32 bytes)
entity_collision_offset_x EQU temp_byte_21 ; Entity collision hitbox X offset (32 bytes)
entity_collision_offset_y EQU temp_byte_22 ; Entity collision hitbox Y offset (32 bytes)
entity_entity_collision_flags EQU temp_byte_23 ; bit0 entity(any), bit1 enemy, bit2 item (32 bytes)
entity_last_collision_entity EQU temp_byte_24 ; Last collided entity index (255=none) (32 bytes)

    ; Input Disable Flag
entity_input_disabled EQU temp_byte_26 ; 0=enabled, 1=disabled (32 bytes)


    ; ==================================================================
; CORE ECS SYSTEM FUNCTIONS
    ; ==================================================================

        init_components: 
; Initialize component systems(OPTIMIZED - only used components) 
    ; Used: Position, Sprite, Behavior, Health, Jump, Gravity, Animation, Collision, Input, StateMachine, Cursors, Carry, comp_shoot, comp_physics, Patrol, WallCollision, comp_box, Collectible, Damage 
 
; Initialize current screen ID(multi - screen support) 
        ld a, 0; Start at screen 0 
        ld (current_screen_id), a 
        ld (current_world_id), a
        ld (current_screen_index), a
        ld (screen_transition_cooldown), a
        ld hl, active_entity_list_dirty
        ld (hl), 1

    ; Reset collectible persistence state on new game / restart.
    ; Cartridge RAM is not guaranteed to be zeroed.
        ld hl, gem_count
        ld de, gem_count + 1
        ld bc, 354                 ; bytes to clear - 1 (gem_count..bonus_respawn_frames)
        xor a
        ld (hl), a
        ldir

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

    ; Initialize entity job scheduler defaults
    ; period=1 (100%), entry=0 for every entity slot
        ld hl, entity_job_period
        ld de, entity_job_period + 1
        ld bc, 31
        ld (hl), 1
        ldir

        ld hl, entity_job_entry
        ld de, entity_job_entry + 1
        ld bc, 31
        ld (hl), 0
        ldir
        xor a
        ld (entity_job_scheduler_active), a
 
        ; Initialize position system (always)
    call init_position_system
        ; Initialize sprite system
    call init_sprite_system
        ; Initialize collision system
    call init_collision_system
        ; Initialize input system
    call init_input_system
        ; Initialize behavior system
    call init_behavior_system
        ; Initialize health system
    call init_health_system
        ; Initialize animation state defaults (also needed by sprite rendering frame selection)
    call init_animation_system
        ; Initialize jump system
    call init_jump_system
        ; Initialize gravity system
    call init_gravity_system
        ; Initialize auto-destroy system
    call init_auto_destroy_system
        ; Initialize cursors system (stub)
    call init_cursors_system
        ; Initialize state machine system (stub)
    call init_statemachine_system
        ; Initialize carry system (stub)
    call init_carry_system
        ; Initialize damage system
    call init_damage_system
        ; Initialize platform riding system
    call init_platform_riding_system
        ; Initialize wall collision system (stub)
    call init_wallcollision_system
        ; Initialize collectible system (stub)
    call init_collectible_system
    
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
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a                    ; Loop through used entities only
    ld hl, active_entity_list

position_update_loop:
    ld c, (hl)                 ; C = entity index
    inc hl                     ; Advance list pointer
    push hl                    ; Save list pointer
    ld a, (player_runtime_enabled)
    or a
    jp z, .position_check_mask
    ld a, (player_entity_index)
    cp c
    jp z, .position_skip_fast_player
.position_check_mask:
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)                 ; Get entity component mask
    ld d, a                    ; OPTIMIZED: Save mask in D to avoid redundant memory read
    pop hl                     ; Restore list pointer
    and COMP_MASK_POSITION     ; Check if has position component
    jr z, position_next_entity ; Skip if no position component

    ; Apply velocity to position (if has movement OR input component)
    ld a, d                    ; OPTIMIZED: Reuse saved mask (saves 1 memory read)
    and COMP_MASK_MOVEMENT | COMP_MASK_INPUT
    jr z, position_next_entity ; Skip velocity if no movement/input source

    ; active_entity_list already guarantees current_screen_id membership

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
    ; Y = Y + VelY (defensive clamp to avoid byte-wrap teleports)
    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)                 ; A = VelY (signed)
    ; Clamp vertical delta to [-16..+16] to avoid single-frame wrap jumps
    bit 7, a
    jr z, .pos_vy_positive
    cp #F0                     ; -16
    jr nc, .pos_vy_ready       ; already in [-16..-1]
    ld a, #F0
    jr .pos_vy_ready
.pos_vy_positive:
    cp #11                     ; 17
    jr c, .pos_vy_ready        ; already in [0..16]
    ld a, #10                  ; +16
.pos_vy_ready:
    ld b, a                    ; B = VelY

    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)                 ; A = Y
    add a, b                   ; A = Y + VelY
    ld (hl), a                 ; Store new Y

    pop hl
    pop bc
    jp position_next_entity

.position_skip_fast_player:
    pop hl

position_next_entity:
    dec b
    jp nz, position_update_loop
    ret

; ==================================================================
; SPRITE COMPONENT SYSTEM (Based on SpriteEditor rendering)
; ==================================================================

init_sprite_system:
    ; Initialize sprite rendering system
    ; Clear all sprite attributes
    call clear_all_sprites
    ; Copy entity_sprite_asset_index from ROM to RAM (so CHANGE_SPRITE can modify it)
    ld hl, entity_sprite_asset_index_init
    ld de, entity_sprite_asset_index
    ld bc, 32
    ldir
    ret

update_sprite_component:
    ; Update sprite rendering based on entity positions
    ld a, (render_entity_count)
    or a
    ret z
    ld b, a                    ; Loop through renderable entities only
    ld hl, render_entity_list

sprite_update_loop:
    ld c, (hl)                 ; C = entity index
    inc hl                     ; Advance list pointer
    ld e, c
    ld d, 0
    ld a, (player_runtime_enabled)
    or a
    jp z, .sprite_not_fast_player
    ld a, (player_entity_index)
    cp c
    jp z, sprite_next_entity
.sprite_not_fast_player:

    ; render_entity_list already guarantees active + current_screen_id + sprite
    push bc
    push hl

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

.sprite_layers_ready:
    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .sprite_layers_legacy
    push bc
    push hl
    call compute_entity_base_pattern
    ld d, a                    ; D = current pattern number for layer 0
    pop hl
    pop bc
    jr .sprite_layers_mode_ready

.sprite_layers_legacy:
    ld d, 0                    ; Legacy path recomputes pattern from HW slot each layer

.sprite_layers_mode_ready:
    
    ; Loop through layers
    ; H = Remaining Layers
    ; L = Current HW Sprite
    ; B = X Position
    ; C = Y Position
    
sprite_layer_loop:
    push hl                    ; Save counters
    push bc                    ; Save Position
    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .sprite_layer_pattern_legacy
    push de                    ; Preserve current pattern number across lookup/call
    jr .sprite_layer_have_pattern

.sprite_layer_pattern_legacy:
    ld a, l
    sla a
    sla a
    ld d, a                    ; D = Pattern (HW index * 4 for 16x16)
    jr .sprite_layer_have_pattern

.sprite_layer_have_pattern:

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

    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .sprite_layer_after_pattern_restore
    pop de                     ; Restore current pattern number

.sprite_layer_after_pattern_restore:
    pop bc                     ; Restore Position
    pop hl                     ; Restore counters
    
    inc l                      ; Next HW Sprite
    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .sprite_layer_next
    ld a, d
    add a, 4                   ; Next 16x16 pattern
    ld d, a

.sprite_layer_next:
    dec h                      ; Decrement Layer Count
    jr nz, sprite_layer_loop
    
sprite_continue:
    pop hl
    pop bc

sprite_next_entity:
    dec b
    jp nz, sprite_update_loop

    ret

; ==================================================================
; PLAYER SPRITE FASTPATH
; ==================================================================
refresh_player_sprite_fastpath:
    ld a, (player_runtime_enabled)
    or a
    ret z
    ld a, (player_entity_index)
    cp #FF
    ret z
    ld c, a
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_SPRITE
    ret z
    call force_update_entity_sprite
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

.force_sprite_layers_ready:
    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .force_sprite_layers_legacy
    push bc
    push hl
    call compute_entity_base_pattern
    ld d, a                    ; D = current pattern number for layer 0
    pop hl
    pop bc
    jr .force_sprite_layers_mode_ready

.force_sprite_layers_legacy:
    ld d, 0                    ; Legacy path recomputes pattern from HW slot each layer

.force_sprite_layers_mode_ready:

    ; Loop through layers
    ; H = Layer Count
    ; L = HW Sprite Index
    ; B = X, C = Y
force_sprite_layer_loop:
    push hl                    ; Save counters
    push bc                    ; Save Position
    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .force_sprite_pattern_legacy
    push de                    ; Preserve current pattern number across lookup/call
    jr .force_sprite_have_pattern

.force_sprite_pattern_legacy:
    ld a, l
    sla a
    sla a
    ld d, a                    ; D = Pattern (HW index * 4 for 16x16)
    jr .force_sprite_have_pattern

.force_sprite_have_pattern:

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

    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .force_sprite_after_pattern_restore
    pop de                     ; Restore current pattern number

.force_sprite_after_pattern_restore:
    pop bc                     ; Restore Position
    pop hl                     ; Restore counters
    
    inc l
    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .force_sprite_next
    ld a, d
    add a, 4
    ld d, a

.force_sprite_next:
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
    
        ; ==================================================================
; COLLISION COMPONENT SYSTEM(Based on ScreenEditor collision detection)
        ; ==================================================================

            init_collision_system:
    ; Initialize collision detection system
    ; Clear deadly collision flags
    ld hl, entity_deadly_collision
    ld de, entity_deadly_collision + 1
    ld bc, 31                     ; 32 bytes - 1
    ld (hl), 0
    ldir

    ; Clear entity-entity collision flags
    ld hl, entity_entity_collision_flags
    ld de, entity_entity_collision_flags + 1
    ld bc, 31
    ld (hl), 0
    ldir

    ; Initialize last collided entity to "none"
    ld hl, entity_last_collision_entity
    ld de, entity_last_collision_entity + 1
    ld bc, 31
    ld (hl), 255
    ldir

    ; Default collision hitboxes: 16x16 with no offset
    ld hl, entity_collision_hitbox_w
    ld de, entity_collision_hitbox_w + 1
    ld bc, 31
    ld (hl), 16
    ldir

    ld hl, entity_collision_hitbox_h
    ld de, entity_collision_hitbox_h + 1
    ld bc, 31
    ld (hl), 16
    ldir

    ld hl, entity_collision_offset_x
    ld de, entity_collision_offset_x + 1
    ld bc, 31
    ld (hl), 0
    ldir

    ld hl, entity_collision_offset_y
    ld de, entity_collision_offset_y + 1
    ld bc, 31
    ld (hl), 0
    ldir
    ret

    update_collision_component:
    ; Ground detection for entities with Collision or Gravity components
    ; Sets entity_on_ground flag based on Y position
    ld a, (ground_entity_count)
    or a
    ret z
    ld b, a                       ; Loop through ground-probe entities only
    ld hl, ground_entity_list

    collision_update_loop:
    ld c, (hl)                    ; C = entity index
    inc hl                        ; Advance list pointer
    push hl                       ; Save list pointer

    ; Get entity Y position
    push bc
    push hl
    push de

    ; Ground detection is handled exclusively by update_wallcollision_component (tile-based)
    ; Check only platform_id and grace frames for platform-riding entities
    ; Entity is grounded if: on tiles OR on platform OR has grace frames

    ; Check if entity has platform reference
    push hl
    ld hl, entity_platform_id
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = platform_id
    cp 255
    jr nz, .grounded_by_platform  ; Has platform, mark grounded

    ; No platform, check grace frames
    ld hl, entity_platform_grace
    add hl, de
    ld a, (hl)                    ; A = grace frames
    or a
    jr nz, .grounded_by_platform  ; Has grace, mark grounded

    ; No tiles, no platform, no grace - entity is in air
    pop hl
    ld hl, entity_on_ground
    ld e, c
    ld d, 0
    add hl, de
    res 0, (hl)                   ; Mark as in air
    jr .ground_check_done

.grounded_by_platform:
    ; Entity is grounded by platform or grace frames
    pop hl
    ld hl, entity_on_ground
    ld e, c
    ld d, 0
    add hl, de
    set 0, (hl)                   ; Mark as grounded

.ground_check_done:
    ; Deadly contact is updated later by update_deadly_tiles_component.
    ; Keep collision focused on ground/platform state so we do not resample
    ; the behavior map twice per frame for the same entity.
    pop de
    pop hl
    pop bc

    collision_next_entity:
    pop hl                        ; Restore list pointer
    dec b
    jp nz, collision_update_loop

    ; Run lightweight entity-entity collision pass for all collidable entities
    call update_entity_collision_fast
    ret

update_entity_collision_fast:
    ; =============================================================
    ; Optimized entity-entity collision: 2-phase active-list system
    ; Phase 1: Build list of active collidable entities on screen
    ; Phase 2: Check only valid pairs (i < j) with clamped AABB
    ; Runs every 2 frames (latches previous result on skip frames)
    ; =============================================================

    ; Frame skip - every 2 frames
    ld hl, interrupt_counter
    ld a, (hl)
    and 1
    ret nz

    ; === PHASE 1: Build active list from prefiltered collision bucket ===
    ld hl, coll_list              ; HL = write pointer into coll_list
    xor a
    ld (coll_list_count), a       ; count = 0
    ld a, (collision_entity_count)
    or a
    ret z
    ld b, a
    ld de, collision_entity_list

.build_loop:
    ld a, (de)
    ld c, a
    inc de

    ; Clear collision flags for ALL entities with collision component
    push hl                       ; Save list write pointer
    push de
    ld e, c
    ld d, 0

    ; Clear collision flags for this entity (even if wrong screen)
    ld hl, entity_entity_collision_flags
    add hl, de
    ld (hl), 0
    ld hl, entity_last_collision_entity
    add hl, de
    ld (hl), 255

    ; Entity qualifies - add to list (max MAX_ENTITIES)
    ld a, (coll_list_count)
    cp MAX_ENTITIES
    jp nc, .build_skip            ; List full

    ; Restore pointers in reverse push order: DE read cursor first, then HL write cursor.
    ; The previous order wrote into collision_entity_list instead of coll_list.
    pop de
    pop hl
    ld (hl), c                    ; coll_list[count] = entity index
    inc hl                        ; Advance write pointer
    push hl                       ; Save updated write pointer
    push de

    ld a, (coll_list_count)
    inc a
    ld (coll_list_count), a

.build_skip:
    pop de
    pop hl                        ; Restore list write pointer
    djnz .build_loop

.build_done:
    ; === PHASE 2: Check pairs ===
    ; Need at least 2 entities for any pair
    ld a, (coll_list_count)
    cp 2
    ret c                         ; 0 or 1 entities, nothing to check

    ; Outer loop: i = 0 .. count-2
    ld b, 0                       ; B = outer index i

.outer_loop:
    ld a, (coll_list_count)
    dec a                         ; A = count - 1
    cp b
    jp z, .coll_done              ; i == count-1, done
    jp c, .coll_done              ; safety

    ; Get source entity index from coll_list[i]
    push bc                       ; Save B=i
    ld hl, coll_list
    ld e, b
    ld d, 0
    add hl, de
    ld c, (hl)                    ; C = source entity index

    ; Cache source AABB with clamping
    ld e, c
    ld d, 0

    ; source left = x + offset_x
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld hl, entity_collision_offset_x
    add hl, de
    call coll_add_signed_offset_clamped
    ld (coll_src_left), a

    ; source right = left + hitbox_w (clamped)
    ld hl, entity_collision_hitbox_w
    add hl, de
    add a, (hl)
    jp nc, .src_right_ok
    ld a, 255                     ; Clamp on overflow
.src_right_ok:
    ld (coll_src_right), a

    ; source top = y + offset_y
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld hl, entity_collision_offset_y
    add hl, de
    call coll_add_signed_offset_clamped
    ld (coll_src_top), a

    ; source bottom = top + hitbox_h (clamped)
    ld hl, entity_collision_hitbox_h
    add hl, de
    add a, (hl)
    jp nc, .src_bot_ok
    ld a, 255
.src_bot_ok:
    ld (coll_src_bottom), a

    ; Inner loop: j = i+1 .. count-1
    ; Preserve C=source entity index while restoring outer index i.
    pop de                        ; D = outer index i, E = saved scratch
    ld b, d
    push de                       ; Save i again for .inner_done
    ld a, b
    inc a                         ; A = i+1
    ld b, a                       ; B = inner index j (reusing B temporarily)
    push bc                       ; Save B=j, (stack: j, i)

.inner_loop:
    pop bc                        ; Restore B=j
    ld a, (coll_list_count)
    cp b
    jp z, .inner_done             ; j == count, done with inner
    jp c, .inner_done

    ; Get target entity index from coll_list[j]
    push bc                       ; Save B=j
    ld hl, coll_list
    ld e, b
    ld d, 0
    add hl, de
    ld b, (hl)                    ; B = target entity index

    ; --- Mutual layer mask check ---
    ; source.collidesWith & target.layer
    ld e, c
    ld d, 0
    ld hl, entity_collides_with
    add hl, de
    ld a, (hl)                    ; A = source.collidesWith
    ld e, b
    ld hl, entity_collision_layer
    add hl, de
    and (hl)                      ; A = source.collidesWith & target.layer
    jp z, .next_inner

    ; target.collidesWith & source.layer
    ld e, b
    ld d, 0
    ld hl, entity_collides_with
    add hl, de
    ld a, (hl)                    ; A = target.collidesWith
    ld e, c
    ld hl, entity_collision_layer
    add hl, de
    and (hl)                      ; A = target.collidesWith & source.layer
    jp z, .next_inner

    ; --- AABB overlap test (source cached, compute target with clamp) ---
    ; target left = x + offset_x
    ld e, b
    ld d, 0
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld hl, entity_collision_offset_x
    add hl, de
    push bc
    call coll_add_signed_offset_clamped
    pop bc
    ld e, a                       ; E = target_left

    ; source.right < target.left => no overlap
    ; (edge-touch counts as collision contact)
    ld a, (coll_src_right)
    cp e
    jp c, .next_inner

    ; target right = target_left + hitbox_w (clamped)
    push de                       ; Save E=target_left, D free
    ld e, b
    ld d, 0
    ld hl, entity_collision_hitbox_w
    add hl, de
    pop de                        ; Restore E=target_left
    ld a, e                       ; A = target_left
    add a, (hl)                   ; A = target_left + width
    jp nc, .tgt_right_ok
    ld a, 255
.tgt_right_ok:
    ; source.left > target.right => no overlap
    ; (edge-touch counts as collision contact)
    ld d, a                       ; D = target_right
    ld a, (coll_src_left)
    cp d
    jp c, .x_overlap_ok
    jp z, .x_overlap_ok
    jp .next_inner
.x_overlap_ok:

    ; target top = y + offset_y
    ld e, b
    ld d, 0
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld hl, entity_collision_offset_y
    add hl, de
    push bc
    call coll_add_signed_offset_clamped
    pop bc
    ld e, a                       ; E = target_top

    ; source.bottom < target.top => no overlap
    ; (edge-touch counts as collision contact)
    ld a, (coll_src_bottom)
    cp e
    jp c, .next_inner

    ; target bottom = target_top + hitbox_h (clamped)
    push de                       ; Save E=target_top
    ld e, b
    ld d, 0
    ld hl, entity_collision_hitbox_h
    add hl, de
    pop de                        ; Restore E=target_top
    ld a, e                       ; A = target_top
    add a, (hl)                   ; A = target_top + height
    jp nc, .tgt_bot_ok
    ld a, 255
.tgt_bot_ok:
    ; source.top > target.bottom => no overlap
    ; (edge-touch counts as collision contact)
    ld d, a                       ; D = target_bottom
    ld a, (coll_src_top)
    cp d
    jp c, .y_overlap_ok
    jp z, .y_overlap_ok
    jp .next_inner
.y_overlap_ok:

    ; ==========  COLLISION DETECTED between source(C) and target(B) ==========

    ; --- Set flags for SOURCE entity (C) ---
    push bc                       ; Save B=target, C=source
    ld e, c
    ld d, 0

    ; Store target index in source's last_collision_entity
    ld hl, entity_last_collision_entity
    add hl, de
    ld (hl), b

    ; Classify target layer into collision event flags
    push de
    ld e, b
    ld d, 0
    ld hl, entity_collision_layer
    add hl, de
    ld a, (hl)                    ; A = target layer bitmask
    pop de
    call coll_flags_from_layer
    ld hl, entity_entity_collision_flags
    add hl, de
    or (hl)                       ; OR with existing flags (multiple hits)
    ld (hl), a

    ; --- Set flags for TARGET entity (B) --- (bidirectional)
    pop bc                        ; Restore B=target, C=source
    push bc

    ld e, b
    ld d, 0

    ; Store source index in target's last_collision_entity
    ld hl, entity_last_collision_entity
    add hl, de
    ld (hl), c

    ; Classify source layer into collision event flags
    push de
    ld e, c
    ld d, 0
    ld hl, entity_collision_layer
    add hl, de
    ld a, (hl)                    ; A = source layer bitmask
    pop de
    call coll_flags_from_layer
    ld hl, entity_entity_collision_flags
    add hl, de
    or (hl)                       ; OR with existing flags
    ld (hl), a

    pop bc                        ; Restore B=target, C=source

.next_inner:
    ; Advance j
    pop bc                        ; Restore B=j (inner index)
    inc b
    push bc                       ; Save updated j
    jp .inner_loop

.inner_done:
    pop de                        ; Restore D=i (keep C=source untouched)
    ld b, d
    inc b                         ; i++
    jp .outer_loop

.coll_done:
    ret

        ; ==================================================================
; COLLISION HELPER FUNCTIONS(Critical for Gameplay Parity)
        ; ==================================================================

; ------------------------------------------------------------------
; coll_add_signed_offset_clamped
; Input:  A = base coordinate (0..255)
;         HL = pointer to signed offset byte (-128..127, two's complement)
; Output: A = clamped (base + offset), saturated to 0..255
; Clobbers: B
; ------------------------------------------------------------------
coll_add_signed_offset_clamped:
    ld b, (hl)                    ; B = signed offset byte
    add a, b                      ; A = base + offset (wrapped)
    bit 7, b
    jr z, .casc_positive
    ; Negative offset: carry=0 means underflow (wrapped below 0)
    jr c, .casc_done
    xor a                         ; Clamp to 0
    ret
.casc_positive:
    ; Positive offset: carry=1 means overflow (wrapped above 255)
    jr nc, .casc_done
    ld a, 255                     ; Clamp to 255
.casc_done:
    ret

; ------------------------------------------------------------------
; coll_flags_from_layer
; Input:  A = collision layer bitmask of the other entity
; Output: A = collision event flags (entity/enemy/item)
; Clobbers: B, C
; ------------------------------------------------------------------
coll_flags_from_layer:
    ld b, a
    ld c, COLLISION_EVENT_ENTITY

    ld a, b
    and COLLISION_LAYER_ENEMY
    jr z, .cffl_no_enemy
    ld a, c
    or COLLISION_EVENT_ENEMY
    ld c, a
.cffl_no_enemy:
    ld a, b
    and COLLISION_LAYER_ITEM
    jr z, .cffl_done
    ld a, c
    or COLLISION_EVENT_ITEM
    ld c, a
.cffl_done:
    ld a, c
    ret

            check_tile_collision:
    ; Check collision with background tiles
        ; A = X position, B = Y position
        ; Convert pixel position to tile coordinates
    push af
    push bc

        ; DYNAMIC TILE SIZE CONVERSION
        ; TODO: This should be calculated from actual screen map tile sizes
        ; For now, detect most common tile size in project
; MSX Screen 2: behavior map is 32x24 (one entry per 8x8 character cell)
    ; Always divide by 8 to convert pixels to character column/row
    ; Convert X to tile column (divide by 8)

    srl a                      ; A = X / 2
    srl a                      ; A = X / 4
    srl a                      ; A = X / 8
    ld c, a; C = tile column

        ; Convert Y to tile row (divide by 8)
    ld a, b
    srl a                      ; A = Y / 2
    srl a                      ; A = Y / 4
    srl a                      ; A = Y / 8
    ld b, a; B = tile row

        ; Check if position is within valid tile map
    ld a, c
    cp 32; Screen width in tiles
    jr nc, no_tile_collision
    ld a, b
    cp 24; Screen height in tiles
    jr nc, no_tile_collision

        ; Get tile at position(simplified - would read from behavior map)
        ; For now, assume all non - zero tiles are solid
        ; This would read from the behavior map generated from screen data
    call get_behavior_tile; Returns A = behavior value
    and #F0               ; Family bits only (0=NoSolid, #10+=Solid)
    jr z, no_tile_collision; 0 = passable (NoSolid family)

        ; Collision detected - handle it
    call handle_tile_collision

    no_tile_collision:
    pop bc
    pop af
    ret

    check_entity_collision:
    ; Check collision with other entities
        ; A = current entity X, B = current entity Y, C = current entity index
    push bc
    push af

        ; Loop through all other entities
    ld hl, entity_comp_masks
    ld e, 0; Other entity index

    entity_collision_loop:
    ld a, e
    cp c; Skip self
    jr z, next_entity_collision

        ; Check if other entity has collision component
    ld a, (hl)
    and COMP_MASK_COLLISION
    jr z, next_entity_collision

        ; Get other entity position
    push hl
    push de

    ld hl, entity_x_pos
    ld d, 0
    add hl, de; HL points to other entity X
    ld d, (hl); D = other X

    push de; Save D=otherX, E=otherIndex
    ld d, 0; Reset D for correct address calculation
    ld hl, entity_y_pos
    add hl, de; HL points to other entity Y
    ld a, (hl); A = other Y
    pop de; Restore D=otherX, E=otherIndex
    ld e, a; E = other Y

        ; Check if entities overlap(16x16 sprites)
            ; Current entity: A = X, B = Y
                ; Other entity: D = X, E = Y

                    ; X overlap check: | X1 - X2 | <16
    ld h, a; H = current X
    ld a, d; A = other X
    sub h; A = other X - current X
    jr nc, x_diff_positive; Jump if positive
    neg; Make positive
    x_diff_positive:
    cp 16; Check if <16
    jr nc, no_entity_collision; No X overlap

        ; Y overlap check: | Y1 - Y2 | <16
    ld a, e; A = other Y
    sub b; A = other Y - current Y
    jr nc, y_diff_positive; Jump if positive
    neg; Make positive
    y_diff_positive:
    cp 16; Check if <16
    jr nc, no_entity_collision; No Y overlap

        ; Collision detected!
    call handle_entity_collision

    no_entity_collision:
    pop de
    pop hl

    next_entity_collision:
    inc hl; Next entity mask
    inc e; Next entity index
    ld a, e
    cp 32; Check all 32 entities
    jr nz, entity_collision_loop

    pop af
    pop bc
    ret

    handle_boundary_collision:
    ; Handle collision with screen boundaries
    ; C = entity index (from collision loop)
    push de
    push hl
    ld e, c
    ld d, 0
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a              ; Stop X movement for this entity
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a              ; Stop Y movement for this entity
    pop hl
    pop de
    ret

    handle_tile_collision:
    ; Handle collision with solid tiles
    ; C = entity index (from collision loop)
    push de
    push hl
    ld e, c
    ld d, 0
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a              ; Stop X movement for this entity
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a              ; Stop Y movement for this entity
    pop hl
    pop de
    ret

    handle_entity_collision:
    ; Handle collision between entities
    ; At entry:
    ;   C = current entity index
    ;   Stack top: DE (E = other entity index), HL, AF, BC
    ; Check for platform riding: if current entity is above other entity and
    ; other entity is a platform (collision_layer & 8), set platform reference

    push bc
    push de
    push hl

    ; Get other entity index from stack (it's at SP+6)
    ld hl, 6
    add hl, sp
    ld a, (hl)              ; A = other entity index (E from pushed DE)
    ld e, a                 ; E = other entity index

    ; Get current entity Y position
    ld hl, entity_y_pos
    ld d, 0
    ld b, c                 ; B = current entity index
    add hl, bc              ; HL = &entity_y_pos[current]
    ld b, (hl)              ; B = current Y

    ; Get other entity Y position
    ld hl, entity_y_pos
    ld d, 0
    add hl, de              ; HL = &entity_y_pos[other]
    ld d, (hl)              ; D = other Y

    ; Check if current entity is above other entity
    ; Current is above if: current_Y + 16 is near other_Y (within 4 pixels)
    ld a, b                 ; A = current Y
    add a, 16               ; A = current Y + height
    sub d                   ; A = (current Y + 16) - other Y
    ; If result is 0-4, current is standing on other
    cp 5
    jr nc, .not_on_platform ; Not standing on platform

    ; Current entity is above other entity
    ; Check if other entity is a platform (collision_layer & COLLISION_LAYER_PLATFORM)
    ld hl, entity_collision_layer
    ld d, 0
    add hl, de              ; HL = &entity_collision_layer[other]
    ld a, (hl)              ; A = other entity collision layer
    and COLLISION_LAYER_PLATFORM
    jr z, .not_on_platform  ; Not a platform

    ; Other entity IS a platform - set platform reference
    ld a, e                 ; A = other entity index
    ld hl, entity_platform_id
    ld d, 0
    ld e, c                 ; E = current entity index
    add hl, de              ; HL = &entity_platform_id[current]
    ld (hl), a              ; Set platform reference

    ; Reset grace frames to 0 (we're on a platform now)
    ld hl, entity_platform_grace
    ld e, c
    add hl, de
    ld (hl), 0

.not_on_platform:
    pop hl
    pop de
    pop bc
    ret

        
    ; ------------------------------------------------------------------
    ; get_behavior_tile
    ; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Read behavior byte for tile at (B=row, C=column) from the runtime behavior map.
;   Inputs:
;     - B = tile row    (0..23, out-of-range → A=0, passable)
;     - C = tile column (0..31, out-of-range → A=0, passable)
;     - current_behavior_map = 16-bit pointer to active screen behavior map
;     - current_behavior_map_bank = memory bank number (mapper context)
;   Outputs:
;     - A = behavior byte:
;     -   bits 7-4 (A & #F0): family / solidity class (0x00 = NoSolid, 0x10+ = Solid)
;     -   bits 3-0 (A & #0F): flag bits (e.g. 0x08 = Interactable)
;   Clobbers:
;     - AF
;   Preserved:
;     - BC
;     - DE
;     - HL
;   Notes:
;     - Maintains a single-row cache (behavior_cache_row / behavior_cache_row_base)
;     - so consecutive calls for the same row skip the row*32 multiply.
;     - Mapper push/pop protects P2 bank around the map read (no-op in simple32k mode).
;     - MUST be called with DE = entity index already set (DE is preserved, not used).

get_behavior_tile:
    ; Bounds check: row must be 0-23, column must be 0-31
    ; NOTE: jp nc (not jr nc) to gbt_oob — gbt_oob is a global label defined after
    ; get_behavior_tile_nb. Using jr would create a local-label scoping conflict in
    ; glass.jar (get_behavior_tile_nb: starts a new scope, so .bt_out_of_bounds would
    ; belong to that scope, not get_behavior_tile's scope).
    ld a, b
    cp 24
    jp nc, gbt_oob                ; Row >= 24: treat as passable
    ld a, c
    cp 32
    jp nc, gbt_oob                ; Column >= 32: treat as passable
get_behavior_tile_nb:
    ; Entry point for callers that guarantee B ∈ 0..23 and C ∈ 0..31.
    ; Saves 36 cycles (4+7+7+4+7+7) by skipping bounds validation.
    ; DO NOT call this unless the probe coordinates are provably in-bounds.
    push hl
    push de

    ; Load cached behavior map pointer (fallback to current_behavior_map)
    ld hl, behavior_cache_map_l
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, d
    or e
    jr nz, .map_ptr_ready

    ld de, (current_behavior_map)
    ld a, e
    ld (behavior_cache_map_l), a
    ld a, d
    ld (behavior_cache_map_h), a
    ld a, #FF
    ld (behavior_cache_row), a

.map_ptr_ready:
    ; Reuse previous row base when checking multiple points on same row
    ld a, b
    ld hl, behavior_cache_row
    cp (hl)
    jr z, .use_cached_row_base

    ; Cache miss: row base = behavior_map + row*32
    ld a, b
    ld l, a
    ld h, 0
    add hl, hl                    ; HL = row * 2
    add hl, hl                    ; HL = row * 4
    add hl, hl                    ; HL = row * 8
    add hl, hl                    ; HL = row * 16
    add hl, hl                    ; HL = row * 32
    add hl, de                    ; HL = row base address

    ld a, b
    ld (behavior_cache_row), a
    ld (behavior_cache_row_base), hl
    jr .row_base_ready

.use_cached_row_base:
    ld hl, (behavior_cache_row_base)

.row_base_ready:
    ld e, c
    ld d, 0
    add hl, de                    ; HL = row base + column

    ; Banked ROM build: protect P2 bank around the read in case behavior map is in ROM bank.
    call mapper_push_p2
    ld a, (current_behavior_map_bank)
    call mapper_set_bank_p2
    ld a, (hl)                    ; A = behavior value
    push af
    call mapper_pop_p2
    pop af
    pop de
    pop hl
    ret
gbt_oob:
    xor a                         ; A = 0 (passable)
    ret
    
        ; ==================================================================
        ; INPUT COMPONENT SYSTEM (With direction restrictions - Cursors)
        ; ==================================================================

        init_input_system:
            ; Initialize input handling system
            xor a
            ld (input_state), a
            ld (prev_input_state), a
            ld (input_btn_curr), a
            ld (input_btn_prev), a
            ld (input_fire), a

            ; Initialize direction masks for all entities (default: all directions allowed)
            ld hl, entity_dir_mask
            ld de, entity_dir_mask + 1
            ld bc, 31
            ld (hl), #0F               ; Default: 00001111 = all directions enabled
            ldir

            ; Initialize cursor speed for all entities (default: 2 px/frame)
            ld hl, entity_input_speed
            ld de, entity_input_speed + 1
            ld bc, 31
            ld (hl), 2
            ldir

            ; Initialize input disabled flags to 0 (all entities start with input ENABLED)
            ld hl, entity_input_disabled
            ld de, entity_input_disabled + 1
            ld bc, 31
            ld (hl), 0
            ldir
            ret

        update_input_component:
            ; Update input handling for player entities
            ; NOTE: input_state/prev_input_state are polled by interrupt task_update_input

            ; Process input for entities with input component
            ld a, (input_entity_count)
            or a
            ret z
            ld b, a                    ; Loop through input-enabled entities only
            ld hl, input_entity_list

        input_update_loop:
            ld c, (hl)                 ; C = entity index
            inc hl                     ; Advance list pointer
            push hl                    ; Save list pointer
            pop hl                     ; Restore list pointer
            ld a, (player_runtime_enabled)
            or a
            jp z, .input_not_fast_player
            ld a, (player_entity_index)
            cp c
            jp z, input_next_entity
        .input_not_fast_player:

            ; input_entity_list already guarantees active + current_screen_id + input

            ; Check if input is disabled for this entity (DISABLE_INPUT action)
            push hl
            ld e, c
            ld d, 0
            ld hl, entity_input_disabled
            add hl, de
            ld a, (hl)
            pop hl
            or a
            jp z, .input_enabled
            ; Input disabled: zero velocity and skip
            push hl
            ld e, c
            ld d, 0
            ld hl, entity_vel_x
            add hl, de
            ld (hl), 0
            ld hl, entity_vel_y
            add hl, de
            ld (hl), 0
            pop hl
            jp input_next_entity
        .input_enabled:

            ; Apply input to entity movement (real implementation)
            push bc
            push hl

            ; Get direction mask for this entity
            ld hl, entity_dir_mask
            ld e, c
            ld d, 0
            add hl, de
            ld d, (hl)                 ; D = direction mask (allowUp / Down / Left / Right)

            ; Convert joystick input to velocity
            ld a, (input_state)
            ld b, 0                    ; Default X velocity
            ld c, 0                    ; Default Y velocity

            ; Resolve per-entity input speed once per update.
            ; H = cardinal speed, L = diagonal speed (max(1, speed/2)).
            push af
            ld a, d
            push af
            ld d, 0
            ld hl, entity_input_speed
            add hl, de
            ld a, (hl)
            or a
            jr nz, .input_speed_ok
            ld a, 1
        .input_speed_ok:
            ld h, a
            srl a
            jr nz, .input_diag_speed_ok
            ld a, 1
        .input_diag_speed_ok:
            ld l, a
            pop af
            ld d, a
            pop af

            ; Check directional input with direction restrictions
            cp STICK_UP
            jp z, input_move_up
            cp STICK_DOWN
            jp z, input_move_down
            cp STICK_LEFT
            jp z, input_move_left
            cp STICK_RIGHT
            jp z, input_move_right
            cp STICK_UPRIGHT
            jp z, input_move_upright
            cp STICK_UPLEFT
            jp z, input_move_upleft
            cp STICK_DOWNRIGHT
            jp z, input_move_downright
            cp STICK_DOWNLEFT
            jp z, input_move_downleft
            jp input_apply_velocity

        input_move_up:
            ; Check if UP is allowed (bit 0)
            ld a, d
            and DIR_ALLOW_UP
            jp z, input_apply_velocity ; Not allowed, skip
            ld a, h
            neg
            ld c, a                    ; Negative Y velocity (up)
            jp input_apply_velocity

        input_move_down:
            ; Check if DOWN is allowed (bit 1)
            ld a, d
            and DIR_ALLOW_DOWN
            jp z, input_apply_velocity ; Not allowed, skip
            ld a, h
            ld c, a                    ; Positive Y velocity (down)
            jp input_apply_velocity

        input_move_left:
            ; Check if LEFT is allowed (bit 2)
            ld a, d
            and DIR_ALLOW_LEFT
            jp z, input_apply_velocity ; Not allowed, skip
            ld a, h
            neg
            ld b, a                    ; Negative X velocity (left)
            jp input_apply_velocity

        input_move_right:
            ; Check if RIGHT is allowed (bit 3)
            ld a, d
            and DIR_ALLOW_RIGHT
            jp z, input_apply_velocity ; Not allowed, skip
            ld a, h
            ld b, a                    ; Positive X velocity (right)
            jp input_apply_velocity

        input_move_upright:
            ; Check if both UP and RIGHT are allowed
            ld a, d
            and DIR_ALLOW_UP
            jp z, input_check_right_only ; UP not allowed
            ld a, d
            and DIR_ALLOW_RIGHT
            jp z, input_check_up_only  ; RIGHT not allowed
            ; Both allowed - diagonal
            ld a, l                    ; Diagonal movement (slower)
            ld b, a
            neg
            ld c, a
            jp input_apply_velocity
        input_check_right_only:
            ; Only RIGHT allowed
            ld a, d
            and DIR_ALLOW_RIGHT
            jp z, input_apply_velocity
            ld a, h
            ld b, a
            jp input_apply_velocity
        input_check_up_only:
            ; Only UP allowed
            ld a, h
            neg
            ld c, a
            jp input_apply_velocity

        input_move_upleft:
            ; Check if both UP and LEFT are allowed
            ld a, d
            and DIR_ALLOW_UP
            jp z, input_check_left_only1 ; UP not allowed
            ld a, d
            and DIR_ALLOW_LEFT
            jp z, input_check_up_only1 ; LEFT not allowed
            ; Both allowed - diagonal
            ld a, l
            neg
            ld b, a
            ld c, a
            jp input_apply_velocity
        input_check_left_only1:
            ; Only LEFT allowed
            ld a, d
            and DIR_ALLOW_LEFT
            jp z, input_apply_velocity
            ld a, h
            neg
            ld b, a
            jp input_apply_velocity
        input_check_up_only1:
            ; Only UP allowed
            ld a, h
            neg
            ld c, a
            jp input_apply_velocity

        input_move_downright:
            ; Check if both DOWN and RIGHT are allowed
            ld a, d
            and DIR_ALLOW_DOWN
            jp z, input_check_right_only2 ; DOWN not allowed
            ld a, d
            and DIR_ALLOW_RIGHT
            jp z, input_check_down_only2 ; RIGHT not allowed
            ; Both allowed - diagonal
            ld a, l
            ld b, a
            ld c, a
            jp input_apply_velocity
        input_check_right_only2:
            ; Only RIGHT allowed
            ld a, d
            and DIR_ALLOW_RIGHT
            jp z, input_apply_velocity
            ld a, h
            ld b, a
            jp input_apply_velocity
        input_check_down_only2:
            ; Only DOWN allowed
            ld a, h
            ld c, a
            jp input_apply_velocity

        input_move_downleft:
            ; Check if both DOWN and LEFT are allowed
            ld a, d
            and DIR_ALLOW_DOWN
            jp z, input_check_left_only3 ; DOWN not allowed
            ld a, d
            and DIR_ALLOW_LEFT
            jp z, input_check_down_only3 ; LEFT not allowed
            ; Both allowed - diagonal
            ld a, l
            ld c, a
            neg
            ld b, a
            jp input_apply_velocity
        input_check_left_only3:
            ; Only LEFT allowed
            ld a, d
            and DIR_ALLOW_LEFT
            jp z, input_apply_velocity
            ld a, h
            neg
            ld b, a
            jp input_apply_velocity
        input_check_down_only3:
            ; Only DOWN allowed
            ld a, h
            ld c, a

        input_apply_velocity:
            ; Apply calculated velocity to entity
            ; B = X velocity, C = Y velocity, E = entity index (preserved from earlier)
            ld d, 0
            ld hl, entity_vel_x
            add hl, de
            ld (hl), b                 ; entity_vel_x[entity_index] = X velocity

            ld hl, entity_vel_y
            add hl, de
            ld (hl), c                 ; entity_vel_y[entity_index] = Y velocity

            ; Update entity_facing_dir based on input_state
            ; Only updates for directional inputs (0 = no change, keeps last facing)
            push af
            ld a, (input_state)
            or a
            jr z, .input_facing_done    ; 0 = no direction pressed, keep last facing
            cp 2
            jr c, .input_facing_up      ; 1 = UP only
            cp 5
            jr c, .input_facing_right   ; 2,3,4 = UP+RIGHT, RIGHT, DOWN+RIGHT
            jr z, .input_facing_down    ; 5 = DOWN only
            ; 6,7,8 = DOWN+LEFT, LEFT, UP+LEFT
            ld a, 1                     ; FACING_LEFT = 1
            jr .input_facing_write
.input_facing_right:
            ld a, 2                     ; FACING_RIGHT = 2
            jr .input_facing_write
.input_facing_up:
            ld a, 3                     ; FACING_UP = 3
            jr .input_facing_write
.input_facing_down:
            ld a, 4                     ; FACING_DOWN = 4
.input_facing_write:
            push hl
            push de
            ld hl, entity_facing_dir
            add hl, de                  ; DE = (0, entity_index)
            ld (hl), a
            pop de
            pop hl
.input_facing_done:
            pop af

            ; Sync directional sprite facing for input-driven entities.
            ; Uses sprite_dir_* lookup tables (left/right/up/down variants).
            ; SKIP if entity has a State Machine: SM controls sprite via ChangeSprite.
            ; Calling patrol facing for SM entities overwrites entity_sprite_asset_index
            ; every frame, undoing what ChangeSprite set (walk sprite would revert to idle).
            push af
            ld hl, entity_sm_ptr_l
            add hl, de              ; DE = (0, entity_index)
            ld a, (hl)
            ld hl, entity_sm_ptr_h
            add hl, de
            or (hl)                 ; A != 0 if SM pointer is set
            pop af
            jr nz, .skip_patrol_facing
            call update_entity_patrol_facing
.skip_patrol_facing:

            pop hl
            pop bc

        input_next_entity:
            dec b
            jp nz, input_update_loop
            ret
    
    ; ==================================================================
        ; BEHAVIOR COMPONENT SYSTEM(Based on BehaviorEditor logic)
    ; ==================================================================

        init_behavior_system:
; Initialize AI / behavior system
            ret

update_behavior_component:
; Update AI / behavior logic for entities
            ld a, (active_entity_count)
            or a
            ret z
            ld b, a                    ; Loop through used entities only
            ld hl, active_entity_list

behavior_update_loop:
            ld c, (hl)                 ; C = entity index
            inc hl                     ; Advance list pointer
            push hl                    ; Save list pointer
            ld e, c
            ld d, 0
            ld hl, entity_comp_masks
            add hl, de
            ld a, (hl)                 ; Get entity component mask
            pop hl                     ; Restore list pointer
            and COMP_MASK_BEHAVIOR; Check if has behavior component
            jr z, behavior_next_entity; Skip if no behavior component

    ; Execute behavior scripts / AI logic
    ; TODO: State machines, pathfinding, decision trees

behavior_next_entity:
            dec b
            jp nz, behavior_update_loop
            ret
    
    ; ==================================================================
    ; HEALTH COMPONENT SYSTEM
    ; ==================================================================
    ; Manages entity health/lives (current, max)
    ; Detects death when current <= 0
    ; Provides DECREASE_LIVES and INCREASE_LIVES functionality
    ; ==================================================================

init_health_system:
    ; Initialize health for all entities with Health component
    ; Default: current = 3, max = 3 (configurable per entity)
    ld b, 32                      ; Loop all entities
    ld hl, entity_comp_masks_hi   ; Check high byte for Health bit
    ld c, 0                       ; Entity index

.init_loop:
    ld a, (hl)
    and #04                       ; COMP_MASK_HEALTH (bit 2 in high byte = #0400)
    jr z, .init_next_entity       ; Skip if no health component

    ; Initialize current health (default: 3)
    push bc
    push hl
    ld hl, entity_health_current
    ld e, c
    ld d, 0
    add hl, de
    ld (hl), 3                    ; Default current = 3

    ; Initialize max health (default: 3)
    ld hl, entity_health_max
    add hl, de
    ld (hl), 3                    ; Default max = 3
    pop hl
    pop bc

.init_next_entity:
    inc hl
    inc c
    djnz .init_loop
    ret

update_health_component:
    ; Check for death (current <= 0) and mark entities as dead
    ; Entity death is detected by state machine via HEALTH_LESS_THAN condition
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a                       ; Loop used entities only
    ld hl, active_entity_list

.health_update_loop:
    ld c, (hl)                    ; C = entity index
    inc hl                        ; Advance list pointer
    push hl                       ; Save list pointer
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    pop hl                        ; Restore list pointer
    and #04                       ; COMP_MASK_HEALTH
    jr z, .health_next_entity

    ; Check current health
    push bc
    push hl
    ld hl, entity_health_current
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = current health

    ; Check if dead (current <= 0)
    or a                          ; Set flags
    jr nz, .health_alive          ; If != 0, entity is alive

    ; Entity is dead (current = 0)
    ; Could trigger death state here, but state machine handles it
    ; via HEALTH_LESS_THAN or HEALTH_EQUALS conditions

.health_alive:
    pop hl
    pop bc

.health_next_entity:
    dec b
    jp nz, .health_update_loop
    ret

; ==================================================================
; HEALTH HELPER FUNCTIONS (called by State Machine actions)
; ==================================================================

decrease_entity_lives:
    ; Decrease lives for entity in register C by amount in register A
    ; Input: C = entity index, A = amount to decrease
    ; Output: Updated entity_health_current
    ; Destroys: AF, DE, HL
    push bc
    ld b, a                       ; Save amount in B
    ld hl, entity_health_current
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = current health
    sub b                         ; Subtract amount
    jr nc, .store_health          ; If no carry (result >= 0), store
    xor a                         ; Clamp to 0 if negative
.store_health:
    ld (hl), a                    ; Store new health
    pop bc
    ret

increase_entity_lives:
    ; Increase lives for entity in register C by amount in register A
    ; Input: C = entity index, A = amount to increase
    ; Output: Updated entity_health_current (clamped to max)
    ; Destroys: AF, DE, HL
    push bc
    ld b, a                       ; Save amount in B

    ; Get current health
    ld hl, entity_health_current
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = current health

    ; Add amount
    add a, b
    ld b, a                       ; Save result in B

    ; Get max health
    ld hl, entity_health_max
    add hl, de
    ld a, (hl)                    ; A = max health

    ; Clamp to max
    cp b                          ; Compare max with result
    jr nc, .store_result          ; If max >= result, use result
    ld b, a                       ; Otherwise clamp to max

.store_result:
    ld hl, entity_health_current
    add hl, de
    ld (hl), b                    ; Store clamped health
    pop bc
    ret
    
    ; ==================================================================
        ; ANIMATION COMPONENT SYSTEM
    ; ==================================================================

        init_animation_system:
            ; Initialize animation component data
            ; Clear frames
            ld hl, entity_anim_frame
            ld de, entity_anim_frame+1
            ld bc, 31
            ld (hl), 0
            ldir

            ; Clear ticks
            ld hl, entity_anim_tick
            ld de, entity_anim_tick+1
            ld bc, 31
            ld (hl), 0
            ldir

            ; Default speed = ANIM_DEFAULT_SPEED
            ld hl, entity_anim_speed
            ld de, entity_anim_speed+1
            ld bc, 31
            ld (hl), ANIM_DEFAULT_SPEED
            ldir

            ; Default flags = playing + loop (loop cleared/set per-sprite by Action_ChangeSprite)
            ld hl, entity_anim_flags
            ld de, entity_anim_flags+1
            ld bc, 31
            ld (hl), ANIM_FLAG_PLAYING | ANIM_FLAG_LOOP
            ldir
            ret

        compute_entity_base_pattern:
            ; Input: DE = entity index
            ; Output: A = base pattern number for this entity's current frame
            ; Clobbers: AF, BC, HL
            ld a, SPRITE_PATTERN_PRELOAD_MODE
            or a
            jr z, .legacy_hw_pattern

            ld hl, entity_sprite_asset_index
            add hl, de
            ld a, (hl)
            cp #FF
            jr z, .placeholder_pattern
            cp SPRITE_ASSET_COUNT
            jr nc, .placeholder_pattern

            ld c, a
            ld b, 0
            ld hl, sprite_asset_base_pattern_slot_runtime
            add hl, bc
            ld a, (hl)                 ; A = base 16x16 pattern slot for this asset
            push af                    ; Save base slot before HL is reused

            ld hl, entity_anim_frame
            add hl, de
            ld c, (hl)                 ; C = current animation frame

            ld hl, entity_sprite_config
            add hl, de
            add hl, de
            inc hl
            ld b, (hl)                 ; B = entity layer count (frame stride)

            pop af                     ; A = base slot (restored)
            ld l, a                    ; L = base slot (ready for stride loop)
            ld a, c
            or a
            jr z, .slot_to_pattern

        .frame_stride_loop:
            ld a, l
            add a, b
            ld l, a
            dec c
            jr nz, .frame_stride_loop

        .slot_to_pattern:
            ld a, l
            add a, a
            add a, a
            ret

        .placeholder_pattern:
            ld a, (sprite_placeholder_base_pattern_num)
            ret

        .legacy_hw_pattern:
            ld hl, entity_sprite_config
            add hl, de
            add hl, de
            ld a, (hl)
            add a, a
            add a, a
            ret

        update_animation_component:
            ; Update animations for entities
            ; - Advances entity_anim_frame using entity_anim_tick/entity_anim_speed
            ; - In preload mode, sprite rendering picks the frame directly from SAT pattern indices
            ; - In fallback mode, copies the selected frame's patterns to VRAM for this entity
            ld a, (anim_entity_count)
            or a
            ret z
            ld b, a                    ; Loop animated render entities only
            ld hl, anim_entity_list

        .anim_loop:
            ld c, (hl)                 ; C = entity index
            inc hl                     ; Advance list pointer
            push hl                    ; Save list pointer
            ld e, c
            ld d, 0
            pop hl                     ; Restore list pointer
            ld a, (player_runtime_enabled)
            or a
            jp z, .anim_not_fast_player
            ld a, (player_entity_index)
            cp c
            jp z, .anim_next_entity
        .anim_not_fast_player:

            ; anim_entity_list already guarantees active + current_screen_id + animation + sprite

            push bc
            push hl

            ; Check flags (playing?)
            ld e, c
            ld d, 0
            ld hl, entity_anim_flags
            add hl, de
            ld a, (hl)
            bit 0, a
            jp z, anim_done_entity

            ; Only animate when moving?
            bit 2, a
            jr z, .tick

            ; vel_x != 0 || vel_y != 0
            ld hl, entity_vel_x
            add hl, de
            ld a, (hl)
            ld hl, entity_vel_y
            add hl, de
            or (hl)
            jp z, anim_done_entity

        .tick:
            ; ChangeSprite defers the frame sync to the next animation pass
            ; so sprite changes happen from the regular frame pipeline instead
            ; of mid-frame inside the state-machine action path.
            ld hl, entity_anim_flags
            add hl, de
            bit 4, (hl)
            jr z, .anim_tick_advance
            res 4, (hl)
            ld hl, entity_sprite_asset_index
            add hl, de
            ld a, (hl)
            cp #FF
            jp z, anim_done_entity
            cp SPRITE_ASSET_COUNT
            jp nc, anim_done_entity
            ld b, a                    ; B = sprite asset index for forced upload
            ld hl, entity_anim_frame
            add hl, de
            ld a, (hl)
            jp .anim_upload_frame

        .anim_tick_advance:
            ; tick++
            ld hl, entity_anim_tick
            add hl, de
            inc (hl)

            ; if tick < speed -> done
            ld a, (hl)
            ld hl, entity_anim_speed
            add hl, de
            cp (hl)
            jp c, anim_done_entity

            ; tick = 0
            ld hl, entity_anim_tick
            add hl, de
            ld (hl), 0

            ; Sprite asset index for this entity (#FF = none)
            ld hl, entity_sprite_asset_index
            add hl, de
            ld a, (hl)
            cp #FF
            jp z, anim_done_entity
            cp SPRITE_ASSET_COUNT
            jp nc, anim_done_entity
            ld b, a                    ; B = sprite asset index

            ; frameCount = sprite_asset_frame_count[B]
            ld hl, sprite_asset_frame_count
            ld e, b
            ld d, 0
            add hl, de
            ld a, (hl)                 ; A = frameCount
            cp 2
            jp c, anim_done_entity     ; 0/1 frames -> no animation
            push af                    ; Save frameCount on stack

            ; Advance frame (entity_anim_frame++)
            ld e, c
            ld d, 0
            ld hl, entity_anim_frame
            add hl, de
            ld a, (hl)                 ; A = current frame
            inc a                      ; A = next frame
            pop de                     ; D = frameCount (was pushed as A)
            push de                    ; Keep frameCount on stack for .clamp_last
            cp d                       ; Compare frame with frameCount
            jr c, .store_frame

            ; Overflow: loop?
            ld e, c
            ld d, 0
            ld hl, entity_anim_flags
            add hl, de
            bit 1, (hl)                ; loop flag
            jr z, .clamp_last
            xor a                      ; frame = 0
            jr .store_frame

        .clamp_last:
            pop de                     ; D = frameCount
            push de                    ; Keep balanced
            ld a, d
            dec a                      ; frame = frameCount-1
            push af                    ; Preserve clamped frame index

            ; Mark one-shot completion and stop playback for non-loop anim.
            ; State machine condition ANIMATION_COMPLETE consumes this flag.
            ld e, c
            ld d, 0
            ld hl, entity_anim_flags
            add hl, de
            set 3, (hl)                ; ANIM_FLAG_COMPLETED
            res 0, (hl)                ; clear ANIM_FLAG_PLAYING
            pop af

        .store_frame:
            pop de                     ; Clean stack (discard frameCount)
            ld e, c
            ld d, 0
            ld hl, entity_anim_frame
            add hl, de
            ld (hl), a                 ; store new frame index

        .anim_upload_frame:
            push af                    ; Preserve frame index
            ld a, SPRITE_PATTERN_PRELOAD_MODE
            or a
            jr z, .anim_upload_frame_fallback
            pop af
            jp anim_done_entity

        .anim_upload_frame_fallback:
            pop af

            ; Get pointer to this sprite asset's frame pointer list
            ld l, b
            ld h, 0
            add hl, hl                 ; index * 2
            ld de, sprite_asset_frame_ptr_table
            add hl, de
            ld e, (hl)
            inc hl
            ld d, (hl)
            ex de, hl                  ; HL = frame pointer list base

            ; HL = &frame_ptrs[frame]
            ld e, a
            ld d, 0
            add hl, de
            add hl, de                 ; + frame*2
            ld e, (hl)
            inc hl
            ld d, (hl)
            ex de, hl                  ; HL = source pattern data

            ; Get entity sprite config (base HW sprite + layer count)
            push hl                    ; save source
            ld e, c
            ld d, 0
            ld hl, entity_sprite_config
            add hl, de
            add hl, de                 ; entityIndex * 2
            ld a, (hl)                 ; base HW sprite
            inc hl
            ld c, (hl)                 ; layer count
            ld d, a                    ; D = base HW sprite (save)
            pop hl                     ; restore source

            ld a, c
            or a
            jp z, anim_done_entity     ; no layers for this entity

            ; BC = layerCount * 32
            ld a, c
            ld b, 0
            ld c, a
            sla c
            rl b
            sla c
            rl b
            sla c
            rl b
            sla c
            rl b
            sla c
            rl b

            ; DE = SPRPAT + baseHwSprite*32
            push hl                    ; save source
            ld a, d
            ld l, a
            ld h, 0
            add hl, hl
            add hl, hl
            add hl, hl
            add hl, hl
            add hl, hl                 ; HL = base * 32
            ld de, SPRPAT
            add hl, de
            ex de, hl                  ; DE = VRAM destination
            pop hl                     ; restore source

            call FAST_LDIRVM           ; copy pattern data to VRAM

anim_done_entity:
            pop hl
            pop bc

        .anim_next_entity:
            dec b
            jp nz, .anim_loop
    ret

refresh_player_animation_fastpath:
    ld a, (player_runtime_enabled)
    or a
    ret z
    ld a, (player_entity_index)
    cp #FF
    ret z
    ld c, a
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_ANIMATION | COMP_MASK_SPRITE
    cp COMP_MASK_ANIMATION | COMP_MASK_SPRITE
    ret nz

    ld a, (player_runtime_enabled)
    push af
    ld a, (anim_entity_count)
    push af
    ld a, (anim_entity_list)
    push af

    xor a
    ld (player_runtime_enabled), a
    ld a, c
    ld (anim_entity_list), a
    ld a, 1
    ld (anim_entity_count), a
    call update_animation_component

    pop af
    ld (anim_entity_list), a
    pop af
    ld (anim_entity_count), a
    pop af
    ld (player_runtime_enabled), a
    ret
    
    ; ==================================================================
        ; JUMP COMPONENT SYSTEM
    ; ==================================================================

        init_jump_system:
            ; Initialize jump system
            ; Clear jump velocities (32 words = 64 bytes)
            ld hl, entity_jump_vel_y
            ld de, entity_jump_vel_y+1
            ld bc, 63
            ld (hl), 0
            ldir

            ; Clear jump counters
            ld hl, entity_jump_count
            ld de, entity_jump_count+1
            ld bc, 31
            ld (hl), 0
            ldir

            ; Clear temporary extra-jump charges granted by bonus pickups
            ld hl, entity_jump_bonus
            ld de, entity_jump_bonus+1
            ld bc, 31
            ld (hl), 0
            ldir

            ; Initialize configured max jumps (default: single jump)
            ld hl, entity_jump_max
            ld de, entity_jump_max+1
            ld bc, 31
            ld (hl), 1
            ldir

            ; Clear on-ground flags
            ld hl, entity_on_ground
            ld de, entity_on_ground+1
            ld bc, 31
            ld (hl), 0
            ldir
            ret

        update_jump_component:
            ; Update jump logic for entities
            ; Fire button edge triggers jump for entities with Jump+Input
            ; Uses: entity_jump_count, entity_jump_max, entity_jump_bonus, entity_on_ground, entity_gravity_vel
            ; Uses global input_btn_curr/input_btn_prev edge detection

            ld a, (active_entity_count)
            or a
            ret z
            ld b, a                       ; Loop used entities only
            ld hl, active_entity_list

        jump_update_loop:
            ld c, (hl)                    ; C = entity index
            inc hl                        ; Advance list pointer
            push hl                       ; Save list pointer
            ld a, (player_runtime_enabled)
            or a
            jp z, .jump_check_mask
            ld a, (player_entity_index)
            cp c
            jp z, .jump_skip_fast_player
        .jump_check_mask:
            ld e, c
            ld d, 0
            ld hl, entity_comp_masks_hi
            add hl, de
            ld a, (hl)
            pop hl                        ; Restore list pointer
            and #01                       ; Jump bit (COMP_MASK_JUMP=#0100 -> high byte bit0)
            jp z, jump_next_entity

            ; Require Input component
            push hl
            ld hl, entity_comp_masks
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            and COMP_MASK_INPUT
            pop hl
            jp z, jump_next_entity

            push bc
            push hl

            ; Ground detection is now handled by update_collision_component
            ; Just reset jump count if grounded
            ld e, c
            ld d, 0
            ld hl, entity_on_ground
            add hl, de
            bit 0, (hl)                   ; Check if on ground
            jr z, .jump_check             ; Not grounded, skip reset

            ; Entity is grounded - reset jump count
            ld hl, entity_jump_count
            add hl, de
            ld (hl), 0

            ; Landing also clears any unused extra-jump bonus.
            ld hl, entity_jump_bonus
            add hl, de
            ld (hl), 0

        .jump_check:
            ; --- Jump trigger edge (fire pressed now, not pressed previous frame) ---
            ld a, (input_btn_curr)
            and INPUT_BTN_FIRE
            jp z, jump_done_entity        ; not pressed
            ld a, (input_btn_prev)
            and INPUT_BTN_FIRE
            jp nz, jump_done_entity       ; already held last frame

            ; Check jump count < configured max OR grounded
            ld hl, entity_jump_count
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            ld hl, entity_jump_max
            ld e, c
            ld d, 0
            add hl, de
            ld b, (hl)
            ld hl, entity_jump_bonus
            add hl, de
            ld d, (hl)
            ld a, b
            add a, d
            ld b, a
            ld hl, entity_jump_count
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            cp b
            jr c, .do_jump

            ld hl, entity_on_ground
            add hl, de
            bit 0, (hl)
            jp z, jump_done_entity

        .do_jump:
            ; Consume one bonus jump only when performing an airborne jump
            ; beyond the entity's base maxJumps.
            ld hl, entity_on_ground
            add hl, de
            bit 0, (hl)
            jr nz, .skip_bonus_consume

            ld hl, entity_jump_count
            add hl, de
            ld a, (hl)
            ld hl, entity_jump_max
            add hl, de
            cp (hl)
            jr c, .skip_bonus_consume

            ld hl, entity_jump_bonus
            add hl, de
            ld a, (hl)
            or a
            jr z, .skip_bonus_consume
            dec (hl)

        .skip_bonus_consume:
            ; jump_count++
            ld hl, entity_jump_count
            add hl, de
            inc (hl)

            ; clear grounded
            ld hl, entity_on_ground
            add hl, de
            res 0, (hl)

            ; clear platform reference (prevent infinite jumps)
            ld hl, entity_platform_id
            add hl, de
            ld (hl), 255

            ; If entity has Gravity, set gravity velocity to negative jump impulse
            ; Jump impulse: -1024 (8.8 fixed) => #FC00 (~4 tiles height with gravity #40)
            ld hl, entity_comp_masks_hi
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            and #02                       ; Gravity bit (COMP_MASK_GRAVITY=#0200 -> high byte bit1)
            jp z, jump_done_entity

            ld hl, entity_gravity_vel
            ld e, c
            ld d, 0
            add hl, de
            add hl, de                    ; word index
            ld (hl), #00                  ; low byte
            inc hl
            ld (hl), #FC                  ; high byte (negative)

jump_done_entity:
            pop hl
            pop bc
            jp jump_next_entity

        .jump_skip_fast_player:
            pop hl

        jump_next_entity:
            dec b
            jp nz, jump_update_loop
    ret
    
    ; ==================================================================
        ; GRAVITY COMPONENT SYSTEM(Constant downward acceleration)
    ; ==================================================================

        init_gravity_system:
; Initialize gravity system
    ; Clear gravity velocities
            ld hl, entity_gravity_vel
            ld de, entity_gravity_vel + 1
            ld bc, 63; 64 bytes - 1(32 words)
            ld (hl), 0
            ldir
            ret

update_gravity_component:
; Apply gravity acceleration to entities
            ld a, (active_entity_count)
            or a
            ret z
            ld b, a                    ; Loop through used entities only
            ld hl, active_entity_list

gravity_update_loop:
            ld c, (hl)                 ; C = entity index
            inc hl                     ; Advance list pointer
            push hl                    ; Save list pointer
            ld a, (player_runtime_enabled)
            or a
            jp z, .gravity_check_mask
            ld a, (player_entity_index)
            cp c
            jp z, .gravity_skip_fast_player
        .gravity_check_mask:
            ld e, c
            ld d, 0
            ld hl, entity_comp_masks_hi
            add hl, de
            ld a, (hl)                 ; Get entity component mask high byte
            pop hl                     ; Restore list pointer
            and #02; Check COMP_MASK_GRAVITY(#0200) => bit 1 in high byte
            jr z, gravity_next_entity; Skip if no gravity component

    ; active_entity_list already guarantees current_screen_id membership

    ; Entity has gravity - apply acceleration
            push bc
            push hl

    ; Check if entity is grounded
            ld hl, entity_on_ground
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            bit 0, a; Check ground flag
            jr nz, gravity_grounded; Skip gravity if on ground

    ; Apply gravity acceleration
            ld hl, entity_gravity_vel
            ld e, c
            ld d, 0
            add hl, de
            add hl, de; HL points to gravity velocity(word)

            ld e, (hl); Load current gravity velocity
            inc hl
            ld d, (hl)

    ; Add gravity strength(64 in fixed - point = ~0.25 pixels / frame acceleration)
            ld a, e
            add a, #40; Add 64 to low byte
            ld e, a
            ld a, d
            adc a, #00; Add carry to high byte
            ld d, a

    ; Check terminal velocity(1024 = max fall speed)
    ; Skip cap if velocity is negative (entity is moving UP / jumping)
            ld a, d
            bit 7, a; Check sign bit - negative means going up
            jr nz, gravity_store_vel; Skip cap for upward velocity
            cp #04; Check if >= 1024 (unsigned, only for positive/downward)
            jr c, gravity_store_vel; If < 1024, continue
            ld de, #0400; Cap at terminal velocity

gravity_store_vel:
; Store updated gravity velocity
            dec hl
            ld (hl), e
            inc hl
            ld (hl), d

    ; Set entity_vel_y to gravity integer part
    ; Position component will apply vel_y to Y position
    ; Wall collision can then detect vertical movement and snap back
            push de                ; Save gravity velocity (D=integer part)
            ld hl, entity_vel_y
            ld e, c                ; E = entity index
            ld d, 0
            add hl, de             ; HL = &entity_vel_y[entity]
            pop de                 ; Restore gravity velocity
            ld (hl), d             ; vel_y = gravity velocity integer part

            jr gravity_done

gravity_grounded:
; Entity is grounded - reset gravity velocity
            ld hl, entity_gravity_vel
            ld e, c
            ld d, 0
            add hl, de
            add hl, de
            ld (hl), 0; Clear velocity low
            inc hl
            ld (hl), 0; Clear velocity high

gravity_done:
            pop hl
            pop bc
            jp gravity_next_entity

        .gravity_skip_fast_player:
            pop hl

gravity_next_entity:
            dec b
            jp nz, gravity_update_loop
    ret
    
    ; ==================================================================
    ; AUTO-DESTROY COMPONENT SYSTEM
    ; ==================================================================
    ; Entities with AUTO_DESTROY component have a lifetime counter
    ; When lifetime reaches 0, entity is automatically destroyed
    ; Useful for: projectiles and other temporary effects.

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
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a                       ; Loop used entities only
    ld hl, active_entity_list

    auto_destroy_loop:
        ld c, (hl)                    ; C = entity index
        inc hl                        ; Advance list pointer
        push hl                       ; Save list pointer
        ld e, c
        ld d, 0
        ld hl, entity_comp_masks_hi
        add hl, de
        ld a, (hl)
        pop hl                        ; Restore list pointer
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
        ld hl, active_entity_list_dirty
        ld (hl), 1

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
        dec b
        jp nz, auto_destroy_loop
        ret
    
    ; ==================================================================
    ; CURSORS COMPONENT SYSTEM
    ; ==================================================================
    ; NOTE:
    ; This system is intentionally disabled in runtime gameplay.
    ; Directional movement is already handled by update_input_component.
    ; Keeping cursor movement here causes double movement/jitter.

init_cursors_system:
    ; No initialization needed
    ret

; ------------------------------------------------------------------
; update_cursors_component
; Disabled no-op (reserved for future menu-only cursor implementation)
; ------------------------------------------------------------------
update_cursors_component:
    ret
    
    ; StateMachine system (integrates with stateMachineGenerator.ts)
    ; Note: The actual SM_Update runtime is in statemachine.asm
    ; This component iterates entities and calls SM_Update for each one

init_statemachine_system:
    ; No initialization needed - state machines are initialized
    ; when entity templates are loaded
    ret

; ------------------------------------------------------------------
; update_statemachine_component
; Update all entities with StateMachine component
; Calls SM_Update (from statemachine.asm) for each entity
; ------------------------------------------------------------------
update_statemachine_component:
    ld c, 0                       ; C = entity index

.sm_comp_loop:
    ld a, c
    cp MAX_ENTITIES
    ret z                         ; Done with all entities

    ; Check if entity is active
    ld hl, entity_active
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    or a
    jr z, .sm_comp_next           ; Entity not active, skip

    ; Check if entity has StateMachine component (bit in component mask)
    ; Note: StateMachine component mask bit should be defined in constants
    ; For now, we assume all active entities may have state machines
    ; In production, check entity_component_mask

    ; Get state machine pointer to verify it exists
    push bc
    ld b, 0                       ; BC = entity index
    ld hl, entity_sm_ptr_l
    add hl, bc
    ld e, (hl)                    ; E = ptr_low

    ld hl, entity_sm_ptr_h
    ld b, 0                       ; BC = entity index again
    add hl, bc
    ld d, (hl)                    ; D = ptr_high

    ; Check if pointer is null (DE = 0)
    ld a, d
    or e
    pop bc
    jr z, .sm_comp_next           ; No state machine, skip

    ; Call SM_Update with entity index in A
    ld a, c
    call SM_Update

.sm_comp_next:
    inc c
    jr .sm_comp_loop
    
    ; ==================================================================
    ; CARRY COMPONENT SYSTEM
    ; ==================================================================
    ; Allows entities to "carry" other entities
    ; Carried entities follow the carrier's position with offset
    ; Variables: entity_carried_by (ID of carrier, 255=none)

init_carry_system:
    ; Initialize all entities as not carried
    ld hl, entity_carried_by
    ld de, entity_carried_by+1
    ld bc, 31
    ld (hl), 255                  ; 255 = not carried
    ldir
    ret

; ------------------------------------------------------------------
; update_carry_component
; Update positions of carried entities to follow carrier
; ------------------------------------------------------------------
update_carry_component:
    ld c, 0                       ; Entity index

.carry_loop:
    ld a, c
    cp MAX_ENTITIES
    ret z

    ; Check if this entity is being carried
    ld hl, entity_carried_by
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = carrier ID
    cp 255
    jr z, .carry_next             ; Not being carried

    ; Entity is being carried - get carrier position
    ld b, a                       ; B = carrier ID
    push bc

    ; Get carrier X position
    ld e, b
    ld d, 0
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)                    ; A = carrier X

    ; Set carried entity X position (same as carrier)
    pop bc
    push bc
    ld e, c
    ld d, 0
    ld hl, entity_x_pos
    add hl, de
    ld (hl), a

    ; Get carrier Y position
    pop bc
    push bc
    ld e, b
    ld d, 0
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)                    ; A = carrier Y
    sub 16                        ; Offset: carried item above carrier

    ; Set carried entity Y position
    pop bc
    ld e, c
    ld d, 0
    ld hl, entity_y_pos
    add hl, de
    ld (hl), a

.carry_next:
    inc c
    jr .carry_loop
    
    ; ==================================================================
    ; DAMAGE COMPONENT SYSTEM
    ; ==================================================================
    ; Manages damage dealing and invincibility frames
    ;
    ; Components:
    ; - entity_invincibility_frames: Countdown timer for invulnerability (32 bytes)
    ; - entity_damage_amount: How much damage this entity deals (32 bytes)
    ;
    ; Invincibility frames prevent damage for ~1 second after being hit

init_damage_system:
    ; Initialize invincibility frames to 0 for all entities
    ld hl, entity_invincibility_frames
    ld de, entity_invincibility_frames + 1
    ld bc, 31                     ; 32 bytes - 1
    ld (hl), 0
    ldir

    ; Initialize damage amounts (default: 1 damage per entity)
    ld hl, entity_damage_amount
    ld de, entity_damage_amount + 1
    ld bc, 31
    ld (hl), 1
    ldir
    ret

update_damage_component:
    ; Update invincibility frames for all entities with Damage component
    ; Decrements invincibility_frames counter each frame
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a                       ; Loop used entities only
    ld hl, active_entity_list

.damage_update_loop:
    ld c, (hl)                    ; C = entity index
    inc hl                        ; Advance list pointer
    push hl                       ; Save list pointer
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    pop hl                        ; Restore list pointer
    and #08                       ; COMP_MASK_DAMAGE (bit 3 in high byte = #0800)
    jr z, .damage_next_entity     ; Skip if no damage component

    ; Decrement invincibility frames if > 0
    push bc
    push hl

    ld hl, entity_invincibility_frames
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = current invincibility frames
    or a                          ; Check if 0
    jr z, .damage_frames_done     ; Already 0, skip

    dec a                         ; Decrement
    ld (hl), a                    ; Store back

.damage_frames_done:
    pop hl
    pop bc

.damage_next_entity:
    dec b
    jp nz, .damage_update_loop
    ret

; ==================================================================
; DAMAGE HELPER FUNCTIONS
; ==================================================================

apply_damage_to_entity:
    ; Apply damage to entity and set invincibility frames
    ; Input: C = entity index, A = damage amount
    ; Destroys: AF, DE, HL
    push bc
    ld b, a                       ; B = damage amount

    ; Check if entity has invincibility frames active
    ld hl, entity_invincibility_frames
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    or a
    jr nz, .damage_blocked        ; Still invincible, block damage

    ; Apply damage using decrease_entity_lives
    ld a, b                       ; A = damage amount
    call decrease_entity_lives    ; C still holds entity index

    ; Set invincibility frames (60 frames = 1 second @ 60 FPS)
    ld hl, entity_invincibility_frames
    ld e, c
    ld d, 0
    add hl, de
    ld (hl), 60                   ; 1 second of invincibility

.damage_blocked:
    pop bc
    ret

check_entity_invincible:
    ; Check if entity is currently invincible
    ; Input: C = entity index
    ; Output: A = 1 if invincible, 0 if vulnerable
    ; Destroys: DE, HL
    ld hl, entity_invincibility_frames
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    or a                          ; Sets Z flag if 0
    ret z                         ; Return 0 if vulnerable

    ld a, 1                       ; Return 1 if invincible
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

    ld a, (active_entity_count)
    or a
    ret z
    ld b, a

    ld hl, active_entity_list
.platform_clear_loop:
    ld e, (hl)              ; E = entity index
    ld d, 0                 ; DE = entity index (16-bit offset)
    inc hl
    push hl
    push bc

    ; Check entity_platform_id[entity]
    ld hl, entity_platform_id
    add hl, de
    ld a, (hl)              ; A = platform_id
    cp 255                  ; Check if on a platform
    jr z, .platform_skip_clear ; Already no platform, skip

    ; Entity was on a platform last frame
    ; Set grace frames to 6 (coyote time for leaving platform)
    push hl                 ; Save entity_platform_id pointer
    ld hl, entity_platform_grace
    add hl, de
    ld a, 6
    ld (hl), a              ; Set grace frames
    pop hl                  ; Restore entity_platform_id pointer

    ; Clear platform reference (collision will reset if still touching)
    ld (hl), 255

.platform_skip_clear:
    pop bc
    pop hl
    djnz .platform_clear_loop
    ret

update_platform_riding:
    ; PHASE 2 - Called AFTER collision detection
    ; Decrement grace frames for entities not on platforms
    ; (Entities on platforms have grace=0, set by handle_entity_collision)

    ld a, (active_entity_count)
    or a
    ret z
    ld b, a

    ld hl, active_entity_list
.grace_loop:
    ld e, (hl)              ; E = entity index
    ld d, 0                 ; DE = entity index (16-bit offset)
    inc hl
    push hl
    push bc

    ; Check if entity has platform reference
    ld hl, entity_platform_id
    add hl, de
    ld a, (hl)              ; A = platform_id
    cp 255
    jr nz, .grace_skip      ; Has platform, skip grace decrement

    ; No platform - decrement grace frames if > 0
    ld hl, entity_platform_grace
    add hl, de
    ld a, (hl)              ; A = grace frames
    or a
    jr z, .grace_skip       ; Already 0, skip

    dec a                   ; Decrement grace
    ld (hl), a

.grace_skip:
    pop bc
    pop hl
    djnz .grace_loop
    ret
    
    ; ==================================================================
    ; WALL COLLISION COMPONENT SYSTEM
    ; ==================================================================
    ; Prevents entities from moving through walls
    ; Uses per-entity hitbox (offset + width/height)
    ; Snaps entity position to wall edge AND zeros velocity

init_wallcollision_system:
    ret

; ------------------------------------------------------------------
; wall_behavior_is_full_blocker
; Input:  A = behavior byte or family bits
; Output: Z = passable / top-solid platform, NZ = full blocker
; Clobbers: AF
; Notes:
;   - familyId 2 (#20) is treated as one-way/top-solid, so it must not
;     block horizontal motion or upward motion.
; ------------------------------------------------------------------
wall_behavior_is_full_blocker:
    and #F0
    ret z
    cp #20
    ret z
    or a
    ret

; ------------------------------------------------------------------
; wall_down_behavior_blocks
; Input:
;   - A  = behavior byte or family bits from get_behavior_tile
;   - B  = tile row of the floor probe
;   - DE = entity index
; Output:
;   - Z  = passable
;   - NZ = blocks downward movement / supports standing
; Clobbers: AF, C, HL
; Preserved: B, DE
; Notes:
;   - familyId 2 (#20) is top-solid: it only blocks when the entity was
;     already above the tile before this frame's vertical movement.
;   - update_position_component already applied vel_y before WallCollision,
;     so previous_bottom = wall_hit_bottom - entity_vel_y.
; ------------------------------------------------------------------
wall_down_behavior_blocks:
    and #F0
    ret z
    cp #20
    jr z, .platform_check
    or a
    ret

.platform_check:
    push bc
    push hl
    ld a, b
    add a, a
    add a, a
    add a, a                      ; A = tileTop = row * 8
    add a, 2
    ld c, a                       ; C = tileTop + tolerance
    ld a, (wall_hit_bottom)
    ld hl, entity_vel_y
    add hl, de
    sub (hl)                      ; previous_bottom = current_bottom - vel_y
    cp c
    pop hl
    pop bc
    jr c, .platform_blocks
    jr z, .platform_blocks
    xor a
    ret

.platform_blocks:
    ld a, 1
    ret

; ------------------------------------------------------------------
; update_wallcollision_component
; ------------------------------------------------------------------
; Check wall collisions and prevent movement through solid tiles.
; Uses behavior map (current_behavior_map) for collision detection.
; Entity position is cached in wall_temp_x/y and converted to hitbox bounds.
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Iterate all entity slots; for each active entity with
;            WallCollision eligibility, probe solid tiles in movement
;            direction(s) and snap position + zero velocity on hit.
;   Inputs:
;     - entity_active[]         : 1 = entity exists
;     - active_entity_list[] / active_entity_count : compact active list already current
;     - entity_comp_masks[]     : low byte component bitmask
;     - entity_comp_masks_hi[]  : high byte (COMP_MASK_GRAVITY at bit 1)
;     - entity_collides_with[]  : must include COLLISION_LAYER_PLATFORM (#08)
;     - entity_x_pos/y_pos[]    : world position
;     - entity_vel_x/vel_y[]    : signed 8-bit velocity (negative = left/up)
;     - entity_gravity_vel[]    : 16-bit signed gravity accumulator (word)
;     - entity_collision_offset_x/y[]: signed offset from origin to hitbox corner
;     - entity_collision_hitbox_w/h[]: hitbox size (minimum 1 if zero)
;     - current_behavior_map    : pointer to active screen behavior map
;   Outputs:
;     - entity_x_pos/y_pos[]    : snapped on collision
;     - entity_vel_x/vel_y[]    : zeroed on collision axis
;     - entity_gravity_vel[]    : zeroed on vertical collision
;     - entity_on_ground[]      : bit 0 set=floor, cleared at loop start
;     - entity_wall_collision_flags[]: bits 0=UP,1=DOWN,2=LEFT,3=RIGHT
;   Clobbers: AF, BC, DE, HL
;   Preserved: (none — uses scratch RAM wall_temp_x/y, wall_hit_*, wall_probe_*)
;   Notes:
;     - Opt-B: loop uses active_entity_list (entities guaranteed active + on screen).
;       Eliminates ~29 wasted iterations vs 0..MAX_ENTITIES scan (3 entities active).
;     - Caller must refresh active_entity_list earlier in the frame.
;     - Opt-C: wall_build_hitbox_cache is skipped on DOWN snap when new Y == current Y
;       (entity already on floor). Saves ~200 cycles/entity/frame when standing still.
;     - wall_build_hitbox_cache is called once at entity entry, and after each snap
;       where the position actually changes.
;     - Gravity floor check (.check_wall_y_gravity) runs even when vel_y=0
;       so entity_on_ground stays accurate when entity is standing still.
; ------------------------------------------------------------------
update_wallcollision_component:
    ; update_all_entities refreshed active_entity_list before entering the
    ; component chain, so we can consume it directly here.
    ld a, (collision_entity_count)
    or a
    ret z                         ; no active entities → done
    ld b, a                       ; B = entity count (loop counter for djnz)
    ld hl, collision_entity_list

.wall_loop:
    ; ---- Load next entity index from compact list ----
    ld e, (hl)                    ; E = entity index
    ld d, 0                       ; DE = entity index (word)
    push hl                       ; save list pointer (clobbered by hl arithmetic below)
    push bc                       ; save loop counter

    ; --- Filter A: entity must have Collision component ---
    ; (entity_active and entity_screen_id are implicit via active_entity_list)
    ; Hitbox data lives in Collision arrays; no Collision = no valid hitbox.
    ; Opt-D: read comp_masks into B (B is free — loop counter saved on stack above).
    ; B holds comp_masks for Filter C reuse, eliminating a second memory read.
    ld hl, entity_comp_masks
    add hl, de
    ld b, (hl)                    ; B = comp_masks[E] (safe: loop ctr on stack)
    ld a, b
    and COMP_MASK_COLLISION       ; low byte, bit 3
    jp z, .wall_next

    ; --- Filter B: entity must collide with the Platform layer ---
    ; entity_collides_with is a bitmask; COLLISION_LAYER_PLATFORM (#08) = map tiles.
    ld hl, entity_collides_with
    add hl, de
    ld a, (hl)
    and COLLISION_LAYER_PLATFORM
    jp z, .wall_next

    ; --- Filter C: entity must be moveable (Input or Movement component) ---
    ; Static entities (platforms, decorations) have no velocity to correct.
    ; Opt-D: reuse comp_masks from B — no extra ld hl/add hl,de/ld a,(hl) needed (saves 28 cycles/entity).
    ld a, b
    and COMP_MASK_MOVEMENT | COMP_MASK_INPUT
    jp z, .wall_next

    ; ---- Entity passed all filters — cache its position ----
    ; wall_temp_x/y are scratch RAM used by wall_build_hitbox_cache and
    ; the snap routines to avoid repeated indexed array lookups.
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld (wall_temp_x), a          ; scratch X = entity_x_pos[E]
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld (wall_temp_y), a          ; scratch Y = entity_y_pos[E]

    ; Clear on_ground flag - will be re-set by .wall_down_blocked if floor found
    ; This ensures entity correctly detects walking off platform edges
    ld hl, entity_wall_collision_flags
    add hl, de                        ; DE still = entity index from above
    ld (hl), 0                        ; Clear directional wall flags

    ld hl, entity_on_ground
    add hl, de                        ; DE still = entity index from above
    res 0, (hl)

    ; Build initial hitbox cache for this entity.
    call wall_build_hitbox_cache

    ; ---- CHECK HORIZONTAL VELOCITY ----
    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    or a
    jp z, .check_wall_y           ; No X velocity, check Y

    bit 7, a
    jp z, .wall_check_right

.wall_check_left:
    ; Moving left - probe one pixel before hitbox left edge
    ld a, (wall_hit_left)
    or a
    jp z, .check_wall_y           ; already at left boundary
    sub 1
    srl a
    srl a
    srl a                         ; Column = (left-1) / 8
    ld c, a

    ; Check point 1: adaptive top probe (safe for small hitboxes)
    ld a, (wall_probe_top)
    srl a
    srl a
    srl a
    ld b, a                       ; Row = top / 8
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jp nz, .wall_left_blocked

    ; Check point 2: adaptive bottom probe (safe for small hitboxes)
    ; probe_bottom = hitbox_bottom - inset ≤ 191 → row ≤ 23, col = (left-1)/8 ≤ 31 → NB safe
    ld a, (wall_probe_bottom)
    srl a
    srl a
    srl a
    ld b, a                       ; Row = bottom / 8
    call get_behavior_tile_nb
    call wall_behavior_is_full_blocker
    jp z, .check_wall_y           ; Both passable

.wall_left_blocked:
    ; ---------------------------------------------------------------
    ; Snap formula (LEFT wall):
    ;   C = tile column that blocked us (from (left-1)/8 probe)
    ;   new_hitbox_left = (C + 1) * 8   → first pixel right of the wall
    ;   entity_x = new_hitbox_left - collision_offset_x
    ;              (wall_sub_signed_offset_clamped reverses the offset)
    ; After snap: vel_x = 0, entity_wall_collision_flags bit 2 (LEFT) set.
    ; ---------------------------------------------------------------
    ld a, c
    inc a
    add a, a
    add a, a
    add a, a                      ; A = (C+1)*8 = new hitbox left pixel
    push af                       ; save new hitbox left
    ld hl, entity_collision_offset_x
    add hl, de
    pop af
    call wall_sub_signed_offset_clamped ; A = entity_x = new_left - offset_x
    ld (wall_temp_x), a           ; update position cache
    push af
    ld hl, entity_x_pos
    add hl, de
    pop af
    ld (hl), a                    ; write snapped entity X to RAM
    call wall_build_hitbox_cache  ; recalculate hitbox after position change

    ; Cancel leftward velocity and flag the collision
    ld hl, entity_vel_x
    add hl, de
    ld (hl), 0
    ld hl, entity_wall_collision_flags
    add hl, de
    set 2, (hl)                       ; bit 2 = LEFT wall collision
    jp .check_wall_y

.wall_check_right:
    ; Moving right - probe one pixel after hitbox right edge
    ld a, (wall_hit_right)
    inc a
    jp z, .check_wall_y           ; overflow (right==255), skip
    srl a
    srl a
    srl a                         ; Column = (X+16) / 8
    ld c, a

    ; Check point 1: adaptive top probe (safe for small hitboxes)
    ld a, (wall_probe_top)
    srl a
    srl a
    srl a
    ld b, a                       ; Row = top / 8
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jp nz, .wall_right_blocked

    ; Check point 2: adaptive bottom probe (safe for small hitboxes)
    ; probe_bottom ≤ 191 → row ≤ 23, col = (right+1)/8 ≤ 31 → NB safe
    ld a, (wall_probe_bottom)
    srl a
    srl a
    srl a
    ld b, a                       ; Row = bottom / 8
    call get_behavior_tile_nb
    call wall_behavior_is_full_blocker
    jp z, .check_wall_y           ; Both passable

.wall_right_blocked:
    ; ---------------------------------------------------------------
    ; Snap formula (RIGHT wall):
    ;   C = tile column that blocked us (from (right+1)/8 probe)
    ;   wall_left_of_tile = C * 8           → left pixel of blocking tile
    ;   new_hitbox_left   = C*8 - hitbox_w  → push entity left so right edge
    ;                                         just touches the tile's left side
    ;   If underflow (hitbox_w > C*8): clamp new_hitbox_left to 0.
    ;   entity_x = new_hitbox_left - collision_offset_x
    ; After snap: vel_x = 0, entity_wall_collision_flags bit 3 (RIGHT) set.
    ; ---------------------------------------------------------------
    ld a, c
    add a, a
    add a, a
    add a, a                      ; A = C * 8 = left pixel of blocking tile
    ld b, a                       ; B = C*8
    ld a, (wall_hit_w)
    ld c, a                       ; C = hitbox width
    ld a, b
    sub c                         ; A = C*8 - hitbox_w = new hitbox left
    jr nc, .wall_right_left_ok
    xor a                         ; underflow: clamp to 0
.wall_right_left_ok:
    push af                       ; save new hitbox left
    ld hl, entity_collision_offset_x
    add hl, de
    pop af
    call wall_sub_signed_offset_clamped ; A = entity_x = new_left - offset_x
    ld (wall_temp_x), a           ; update position cache
    push af
    ld hl, entity_x_pos
    add hl, de
    pop af
    ld (hl), a                    ; write snapped entity X to RAM
    call wall_build_hitbox_cache  ; recalculate hitbox after position change

    ; Cancel rightward velocity and flag the collision
    ld hl, entity_vel_x
    add hl, de
    ld (hl), 0
    ld hl, entity_wall_collision_flags
    add hl, de
    set 3, (hl)                       ; bit 3 = RIGHT wall collision

.check_wall_y:
    ; ---- CHECK VERTICAL VELOCITY ----
    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)
    or a
    jp z, .check_wall_y_gravity   ; vel_y=0, but check floor for gravity entities

    bit 7, a
    jp z, .wall_check_down

.wall_check_up:
    ; Moving up - probe one pixel above hitbox top edge
    ld a, (wall_hit_top)
    or a
    jp z, .wall_up_top_edge       ; top=0, clamp + stop upward velocity
    sub 1
    srl a
    srl a
    srl a
    ld b, a                       ; Row = (top-1) / 8

    ; Check point 1: adaptive left probe (safe for small hitboxes)
    ; NOTE: uses get_behavior_tile (with bounds) — entity_y can wrap off-screen,
    ; making B = (top-1)/8 > 23 (e.g. top=252 → row=31). Bounds check returns 0.
    ld a, (wall_probe_left)
    srl a
    srl a
    srl a
    ld c, a                       ; Column = left / 8
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jp nz, .wall_up_blocked

    ; Check point 2: adaptive right probe (safe for small hitboxes)
    ld a, (wall_probe_right)
    srl a
    srl a
    srl a
    ld c, a                       ; Column = right / 8
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jp z, .wall_next              ; Both passable

.wall_up_top_edge:
    ; ---------------------------------------------------------------
    ; Screen top boundary clamp (wall_hit_top == 0, no tile above row 0).
    ; This path is entered when wall_hit_left == 0 (entity already at top
    ; screen boundary) or when the UP probe is at row -1 (invalid).
    ; Sanity guard: only snap if entity_y < 24 (i.e. truly near the top).
    ; If entity_y >= 24, the "top=0" probe is a false positive — just
    ; cancel velocity via .wall_up_cancel_only without moving entity.
    ; new_hitbox_top = 0, entity_y = 0 - offset_y (clamped).
    ; ---------------------------------------------------------------
    ld a, (wall_temp_y)
    cp 24
    jp nc, .wall_up_cancel_only
    xor a
    push af                       ; keep new hitbox top
    ld hl, entity_collision_offset_y
    add hl, de
    pop af
    call wall_sub_signed_offset_clamped
    ld (wall_temp_y), a
    push af
    ld hl, entity_y_pos
    add hl, de
    pop af
    ld (hl), a                    ; Clamp entity Y to top boundary
    call wall_build_hitbox_cache  ; Refresh hitbox cache after snap

    ; Zero Y velocity
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0

    ; Also zero gravity_vel to stop upward momentum at top edge
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de                        ; word index
    ld (hl), 0
    inc hl
    ld (hl), 0
    ld hl, entity_wall_collision_flags
    add hl, de
    set 0, (hl)                       ; UP wall collision
    jp .wall_next

.wall_up_blocked:
    ; ---------------------------------------------------------------
    ; Snap formula (UP / ceiling):
    ;   B = tile row that blocked us (from (top-1)/8 probe)
    ;   new_hitbox_top = (B + 1) * 8  → first pixel below the ceiling tile
    ;   Safety guard: if new_top < current wall_hit_top, the snap would
    ;   push us further into the ceiling (sub-pixel rounding artefact).
    ;   In that case, fall through to .wall_up_cancel_only to just
    ;   cancel velocity without moving the entity.
    ;   entity_y = new_hitbox_top - collision_offset_y
    ; After snap: vel_y = 0, gravity_vel = 0, wall_collision_flags bit 0 (UP) set.
    ; ---------------------------------------------------------------
    ld a, b
    inc a
    add a, a
    add a, a
    add a, a                      ; A = (B+1)*8 = new hitbox top pixel
    ; Guard: new_top must be >= current hitbox top (no upward nudge)
    ld c, a
    ld hl, wall_hit_top
    ld a, c
    cp (hl)                       ; new_top < current_top? → carry set
    jp c, .wall_up_cancel_only    ; invalid snap: only cancel momentum
    ld a, c
    push af                       ; save new hitbox top
    ld hl, entity_collision_offset_y
    add hl, de
    pop af
    call wall_sub_signed_offset_clamped ; A = entity_y = new_top - offset_y
    ld (wall_temp_y), a           ; update position cache
    push af
    ld hl, entity_y_pos
    add hl, de
    pop af
    ld (hl), a                    ; write snapped entity Y to RAM
    call wall_build_hitbox_cache  ; recalculate hitbox after position change

    ; Cancel upward velocity and gravity accumulator
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0

    ; gravity_vel is 16-bit (word array): DE*2 offset
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de                        ; word index (2 bytes per entity)
    ld (hl), 0
    inc hl
    ld (hl), 0
    ld hl, entity_wall_collision_flags
    add hl, de
    set 0, (hl)                       ; bit 0 = UP wall collision
    jp .wall_next

.wall_up_cancel_only:
    ; ---------------------------------------------------------------
    ; Defensive path: snap would move entity upward (invalid) or
    ; entity is far from the screen top boundary.
    ; Keep current Y position, but cancel upward momentum this frame.
    ; ---------------------------------------------------------------
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0

    ld hl, entity_gravity_vel
    add hl, de
    add hl, de                        ; word index
    ld (hl), 0
    inc hl
    ld (hl), 0
    ld hl, entity_wall_collision_flags
    add hl, de
    set 0, (hl)                       ; UP wall collision
    jp .wall_next

.wall_check_down:
    ; Moving down - probe one pixel below hitbox bottom edge
    ld a, (wall_hit_bottom)
    inc a
    jp z, .wall_next              ; overflow (bottom==255), skip
    srl a
    srl a
    srl a
    ld b, a                       ; Row = (bottom+1) / 8

    ; Check point 1: adaptive left probe (safe for small hitboxes)
    ld a, (wall_probe_left)
    srl a
    srl a
    srl a
    ld c, a                       ; Column = left / 8
    call get_behavior_tile
    call wall_down_behavior_blocks
    jp nz, .wall_down_blocked

    ; Check point 2: adaptive right probe (safe for small hitboxes)
    ld a, (wall_probe_right)
    srl a
    srl a
    srl a
    ld c, a                       ; Column = right / 8
    call get_behavior_tile
    call wall_down_behavior_blocks
    jp z, .wall_next              ; Both passable

.wall_down_blocked:
    ; ---------------------------------------------------------------
    ; Snap formula (DOWN / floor):
    ;   B = tile row that blocked us (from (bottom+1)/8 probe)
    ;   floor_top_pixel  = B * 8          → top pixel of the floor tile
    ;   new_hitbox_top   = B*8 - hitbox_h → push entity up so bottom edge
    ;                                       just sits on the floor surface
    ;   If underflow (hitbox_h > B*8): clamp new_hitbox_top to 0.
    ;   entity_y = new_hitbox_top - collision_offset_y
    ; After snap: vel_y = 0, gravity_vel = 0, entity_on_ground bit 0 set,
    ;             entity_wall_collision_flags bit 1 (DOWN) set.
    ; Note: jp .wall_next skips .check_wall_y_gravity intentionally —
    ;       floor already detected; no redundant gravity probe needed.
    ; ---------------------------------------------------------------
    ld a, b
    add a, a
    add a, a
    add a, a                      ; A = B*8 = top pixel of floor tile
    ld b, a                       ; B = floor_top_pixel
    ld a, (wall_hit_h)
    ld c, a                       ; C = hitbox height
    ld a, b
    sub c                         ; A = B*8 - hitbox_h = new hitbox top
    jr nc, .wall_down_top_ok
    xor a                         ; underflow: clamp to 0
.wall_down_top_ok:
    push af                       ; save new hitbox top
    ld hl, entity_collision_offset_y
    add hl, de
    pop af
    call wall_sub_signed_offset_clamped ; A = entity_y = new_top - offset_y
    ld (wall_temp_y), a           ; update position cache
    push af
    ld hl, entity_y_pos
    add hl, de
    pop af
    ; Opt-C: skip rebuild if new Y == current Y (entity already on floor).
    ; Saves ~200 cycles/frame for standing-still entities (most common state).
    ; Falls through to normal snap path on actual position change (e.g. landing).
    cp (hl)
    jp z, .wall_down_at_floor     ; position unchanged → hitbox still valid
    ld (hl), a                    ; write snapped entity Y to RAM
    call wall_build_hitbox_cache  ; recalculate hitbox after position change
.wall_down_at_floor:
    ; Cancel downward velocity and gravity accumulator (landing)
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0

    ; gravity_vel is 16-bit (word array): DE*2 offset
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de                        ; word index (2 bytes per entity)
    ld (hl), 0
    inc hl
    ld (hl), 0

    ; Mark entity as on-ground and flag DOWN wall collision
    ld hl, entity_on_ground
    add hl, de
    set 0, (hl)                       ; bit 0 = standing on solid floor
    ld hl, entity_wall_collision_flags
    add hl, de
    set 1, (hl)                       ; bit 1 = DOWN wall collision
    jp .wall_next                     ; floor handled; skip gravity floor check

.check_wall_y_gravity:
    ; ---------------------------------------------------------------
    ; vel_y == 0, but gravity entities still need a floor probe every
    ; frame to keep entity_on_ground accurate (e.g. entity walks off
    ; a platform edge — vel_y is 0 at that instant but the flag must
    ; be cleared promptly so the gravity system can accelerate it).
    ; Only enter .wall_check_down if entity has COMP_MASK_GRAVITY
    ; (stored in entity_comp_masks_hi bit 1).
    ; Non-gravity entities: skip vertical check entirely.
    ; ---------------------------------------------------------------
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #02                       ; COMP_MASK_GRAVITY high byte bit 1
    jp nz, .wall_check_down       ; gravity entity → check floor
    ; No gravity component → no vertical wall check needed
.wall_next:
    ; Opt-B: restore list pointer and count, advance to next entity.
    ; NOTE: djnz range is ±127 bytes — wall_loop body is too large.
    ; Use dec b / jp nz instead (jp supports any distance).
    pop bc
    pop hl
    inc hl                        ; next entry in active_entity_list
    dec b
    jp nz, .wall_loop
    ret

; ------------------------------------------------------------------
; wall_build_hitbox_cache
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Compute and cache hitbox AABB and adaptive probe coordinates
;            from entity position (wall_temp_x/y) plus collision offsets/sizes.
;   Inputs:
;     - DE                        = entity index (used to index per-entity arrays)
;     - wall_temp_x               = cached entity X origin (set before calling)
;     - wall_temp_y               = cached entity Y origin (set before calling)
;     - entity_collision_hitbox_w[DE]: hitbox width  (0 treated as 1)
;     - entity_collision_hitbox_h[DE]: hitbox height (0 treated as 1)
;     - entity_collision_offset_x[DE]: signed X offset from entity origin to hitbox left
;     - entity_collision_offset_y[DE]: signed Y offset from entity origin to hitbox top
;   Outputs:
;     - wall_hit_left   = hitbox left  pixel (entity_x + offset_x, clamped 0..255)
;     - wall_hit_top    = hitbox top   pixel (entity_y + offset_y, clamped 0..255)
;     - wall_hit_right  = left + (w-1), clamped 0..255
;     - wall_hit_bottom = top  + (h-1), clamped 0..255
;     - wall_hit_w      = effective width  (>= 1)
;     - wall_hit_h      = effective height (>= 1)
;     - wall_probe_left / wall_probe_right : X probes (inset up to 2px from sides)
;     - wall_probe_top  / wall_probe_bottom: Y probes (inset up to 2px from top/bottom)
;   Clobbers: AF, BC, HL
;   Preserved: DE (entity index is never modified)
;   Notes:
;     - Adaptive inset: min(2, floor((right-left)/2)) and min(2, floor((bottom-top)/2)).
;       Prevents corner-only probes for entities smaller than 4 pixels on an axis.
;     - Call wall_add_signed_offset_clamped for offset application.
;     - Called once at entity loop entry; called again after every position snap.
; ------------------------------------------------------------------
wall_build_hitbox_cache:
    ; Width (minimum 1)
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld a, (hl)
    or a
    jr nz, .wbhc_w_ok
    ld a, 1
.wbhc_w_ok:
    ld (wall_hit_w), a

    ; Height (minimum 1)
    ld hl, entity_collision_hitbox_h
    add hl, de
    ld a, (hl)
    or a
    jr nz, .wbhc_h_ok
    ld a, 1
.wbhc_h_ok:
    ld (wall_hit_h), a

    ; left = entity_x + offset_x (signed, clamped)
    ld a, (wall_temp_x)
    ld hl, entity_collision_offset_x
    add hl, de
    call wall_add_signed_offset_clamped
    ld (wall_hit_left), a

    ; top = entity_y + offset_y (signed, clamped)
    ld a, (wall_temp_y)
    ld hl, entity_collision_offset_y
    add hl, de
    call wall_add_signed_offset_clamped
    ld (wall_hit_top), a

    ; right = left + (w-1), clamped
    ld a, (wall_hit_w)
    dec a
    ld b, a
    ld a, (wall_hit_left)
    add a, b
    jr nc, .wbhc_right_ok
    ld a, 255
.wbhc_right_ok:
    ld (wall_hit_right), a

    ; bottom = top + (h-1), clamped
    ld a, (wall_hit_h)
    dec a
    ld b, a
    ld a, (wall_hit_top)
    add a, b
    jr nc, .wbhc_bottom_ok
    ld a, 255
.wbhc_bottom_ok:
    ld (wall_hit_bottom), a

    ; ---- Adaptive X probes: inset = min(2, floor((right-left)/2)) ----
    ; Purpose: avoid probing the exact corner pixels for small sprites.
    ; For a 16px-wide entity: inset = min(2, 8) = 2.
    ;   probe_left  = left  + 2  (2px inside left edge)
    ;   probe_right = right - 2  (2px inside right edge)
    ; For a 4px-wide entity: inset = min(2, 2) = 2 (probes overlap at center).
    ; For a 2px-wide entity: inset = min(2, 1) = 1.
    ld a, (wall_hit_left)
    ld c, a                       ; C = left pixel
    ld a, (wall_hit_right)
    sub c                         ; A = width span (right - left)
    srl a                         ; A = span / 2
    cp 3                          ; is span/2 < 3 (i.e. inset < 2)?
    jr c, .wbhc_inset_x_ready    ; yes: use as-is
    ld a, 2                       ; no: cap inset at 2
.wbhc_inset_x_ready:
    ld b, a                       ; B = inset value
    ld a, c
    add a, b
    ld (wall_probe_left), a       ; probe_left  = left  + inset
    ld a, (wall_hit_right)
    sub b
    ld (wall_probe_right), a      ; probe_right = right - inset

    ; ---- Adaptive Y probes: inset = min(2, floor((bottom-top)/2)) ----
    ; Same logic on Y axis.
    ;   probe_top    = top    + inset
    ;   probe_bottom = bottom - inset
    ld a, (wall_hit_top)
    ld c, a                       ; C = top pixel
    ld a, (wall_hit_bottom)
    sub c                         ; A = height span (bottom - top)
    srl a                         ; A = span / 2
    cp 3
    jr c, .wbhc_inset_y_ready
    ld a, 2
.wbhc_inset_y_ready:
    ld b, a                       ; B = inset value
    ld a, c
    add a, b
    ld (wall_probe_top), a        ; probe_top    = top    + inset
    ld a, (wall_hit_bottom)
    sub b
    ld (wall_probe_bottom), a     ; probe_bottom = bottom - inset
    ret

; ------------------------------------------------------------------
; wall_add_signed_offset_clamped
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Add a signed 8-bit offset to a pixel coordinate, clamping result to 0..255.
;            Used to apply entity_collision_offset_x/y to entity origin (entity→hitbox).
;   Inputs:
;     - A  = base pixel coordinate (unsigned, 0..255)
;     - HL = pointer to signed offset byte (-128..127)
;   Outputs:
;     - A  = clamp(base + offset, 0, 255)
;   Clobbers: AF, B
;   Preserved: C, DE, HL
;   Notes:
;     - Negative offset: carry=0 after add → underflow → A clamped to 0.
;     - Positive offset: carry=1 after add → overflow → A clamped to 255.
;     - B is used to hold the offset byte; caller must save B if needed.
; ------------------------------------------------------------------
wall_add_signed_offset_clamped:
    ld b, (hl)                    ; B = signed offset
    add a, b
    bit 7, b
    jr z, .wasc_positive
    ; Negative offset: carry=0 means underflow
    jr c, .wasc_done
    xor a
    ret
.wasc_positive:
    ; Positive offset: carry=1 means overflow
    jr nc, .wasc_done
    ld a, 255
.wasc_done:
    ret

; ------------------------------------------------------------------
; wall_sub_signed_offset_clamped
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Subtract a signed 8-bit offset from a hitbox coordinate, clamping to 0..255.
;            Used to convert hitbox left/top back to entity origin after a snap.
;            Inverse of wall_add_signed_offset_clamped.
;   Inputs:
;     - A  = hitbox pixel coordinate (left or top, unsigned 0..255)
;     - HL = pointer to signed collision offset byte (-128..127)
;            (same pointer passed to wall_add_signed_offset_clamped when building)
;   Outputs:
;     - A  = clamp(hitbox - offset, 0, 255)
;            i.e. the entity origin coordinate that produces the snapped hitbox edge
;   Clobbers: AF, B, C
;   Preserved: DE, HL
;   Notes:
;     - If offset is negative: hitbox - offset = hitbox + abs(offset).
;       Overflow (carry clear after add) → A clamped to 255.
;     - If offset is positive: hitbox - offset computed directly.
;       Underflow (carry clear after sub) → A clamped to 0.
;     - B holds the raw offset byte; C holds the original hitbox coordinate.
; ------------------------------------------------------------------
wall_sub_signed_offset_clamped:
    ld c, a
    ld b, (hl)                    ; B = signed offset
    bit 7, b
    jr z, .wssc_positive
    ; offset < 0 -> hitbox - offset = hitbox + abs(offset)
    ld a, b
    neg
    add a, c
    jr nc, .wssc_done
    ld a, 255
    ret
.wssc_positive:
    ld a, c
    sub b
    jr nc, .wssc_done
    xor a
.wssc_done:
    ret
    
    ; DeadlyTiles system filtered out(not used)
init_deadly_tiles_system:
    ret

update_deadly_tiles_component:
    ret
    
    ; ==================================================================
    ; COLLECTIBLE COMPONENT SYSTEM
    ; ==================================================================
    ; Items that can be collected when player touches them
    ; Increments score/counters and deactivates item

init_collectible_system:
    ret

; ------------------------------------------------------------------
; update_collectible_component
; Check collisions between collectibles and player
; When collected: deactivate item, increment score
; ------------------------------------------------------------------
update_collectible_component:
    call resolve_runtime_hero_entity
    cp #FF
    ret z
    ld c, 0                       ; Entity index

.collect_loop:
    ld a, c
    cp MAX_ENTITIES
    ret z

    ; Check if entity is active
    ld hl, entity_active
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    or a
    jr z, .collect_next

    ; TODO: Check if entity has COLLECTIBLE component mask

    ; Check collision against resolved hero entity
    ; Get collectible position
    ld hl, entity_x_pos
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = collectible X

    ; Get player X position
    ld hl, entity_x_pos
    ld a, (hero_entity_id)
    ld e, a
    ld d, 0
    add hl, de
    ld b, (hl)                    ; B = player X

    ; Check X distance
    sub b                         ; A = collectible_x - player_x
    ; Check if within range (-16 to +16)
    cp 240                        ; Negative check (< -16)
    jr c, .collect_next
    cp 16                         ; Positive check (> +16)
    jr nc, .collect_next

    ; X is close, check Y
    ld hl, entity_y_pos
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = collectible Y

    ld hl, entity_y_pos
    ld a, (hero_entity_id)
    ld e, a
    ld d, 0
    add hl, de
    ld b, (hl)                    ; B = player Y

    sub b                         ; A = collectible_y - player_y
    cp 240
    jr c, .collect_next
    cp 16
    jr nc, .collect_next

    ; Collision detected - collect item!
    push bc

    ; Deactivate collectible (set entity_active[c] = 0)
    ld hl, entity_active
    ld e, c
    ld d, 0
    add hl, de
    ld (hl), 0                    ; Deactivate entity
    ld hl, active_entity_list_dirty
    ld (hl), 1

    ; TODO: Increment score or item counter
    ; ld hl, player_score
    ; inc (hl)

    ; Built-in collection sound (coin)
    ld a, 4
    call play_sound_effect

    pop bc

.collect_next:
    inc c
    jr .collect_loop
    
    ; Tile interaction system filtered out(no interactable tiles or no input)
init_tile_interaction_system:
    ret

update_slash_component:
    ret

check_tile_interaction:
    ret

; Stub: apply_collected_tiles (no interactable tiles in project)
apply_collected_tiles:
    ret
     
    ; ================================================================== 
        ; ENTITY MANAGEMENT FUNCTIONS(Based on EntityTemplate system) 
    ; ================================================================== 

        ; Create entity with components(A = entity ID, B = mask low byte, C = mask high byte) 
        create_entity:
    ; Guard invalid indices to avoid RAM table corruption.
            cp MAX_ENTITIES
            ret nc
; Set component mask for entity
            ld hl, entity_comp_masks
            ld e, a; Entity index
            ld d, 0
            add hl, de; HL points to entity mask
            ld (hl), b; Set component mask low byte

            ld hl, entity_comp_masks_hi
            add hl, de
            ld (hl), c; Set component mask high byte

    ; Mark entity as active
            ld hl, entity_active
            add hl, de
            ld (hl), 1                    ; entity_active[entity] = 1
            ld hl, active_entity_list_dirty
            ld (hl), 1

    ; Default job scheduler profile for newly created entities
    ; period=1 (100%), entry=0
            ld hl, entity_job_period
            add hl, de
            ld (hl), 1
            ld hl, entity_job_entry
            add hl, de
            ld (hl), 0

    ; Initialize component data based on mask
            bit 0, b; Check COMP_MASK_POSITION (low byte)
            call nz, init_entity_position

            bit 1, b; Check COMP_MASK_SPRITE (low byte)
            call nz, init_entity_sprite

    ret 

    ; ------------------------------------------------------------------
    ; entity_job_set
    ; Set/update job scheduler profile for one entity.
    ; Input:  A = entity index (0..31)
    ;         B = period in frames (0 treated as 1)
    ;         C = entry slot (wrapped to 0..period-1)
    ; Output: entity_job_period/entry updated for that entity
    ; Destroys: AF, DE, HL
    ; ------------------------------------------------------------------
entity_job_set:
            cp MAX_ENTITIES
            ret nc
            ld e, a
            ld d, 0

            ld a, b
            or a
            jr nz, entity_job_set_period_ok
            ld a, 1
entity_job_set_period_ok:
            ld b, a

            ld a, c
entity_job_set_entry_wrap:
            cp b
            jr c, entity_job_set_entry_ok
            sub b
            jr entity_job_set_entry_wrap
entity_job_set_entry_ok:
            ld c, a

            ld hl, entity_job_period
            add hl, de
            ld a, b
            ld (hl), a

            ld hl, entity_job_entry
            add hl, de
            ld a, c
            ld (hl), a
            ld a, b
            cp 1
            jr nz, entity_job_set_enable_scheduler
            ld a, c
            or a
            ret z
entity_job_set_enable_scheduler:
            ld a, 1
            ld (entity_job_scheduler_active), a
            ret

    ; ------------------------------------------------------------------
    ; entity_job_should_run_c
    ; Evaluate per-entity cadence gate for current frame.
    ; Input:  C = entity index (0..31)
    ; Output: A = 1 when entity should run this frame, 0 otherwise
    ; Destroys: AF, BC, DE, HL
    ; Notes:
    ;   - Fast path for power-of-two periods using bitmask modulo.
    ;   - Fallback path uses 16-bit frame modulo with fixed 16-iteration cost.
    ; ------------------------------------------------------------------
entity_job_should_run_c:
            ld a, c
            cp MAX_ENTITIES
            jr c, .entity_job_run_idx_ok
            xor a
            ret
.entity_job_run_idx_ok:
            push bc
            push de
            push hl

            ld e, c
            ld d, 0

            ld hl, entity_job_period
            add hl, de
            ld a, (hl)
            or a
            jr nz, entity_job_run_period_ok
            ld a, 1
entity_job_run_period_ok:
            cp 1
            jr z, entity_job_run_active
            ld b, a

            ld hl, entity_job_entry
            add hl, de
            ld a, (hl)
            ld e, a

            ; Fast modulo for power-of-two period:
            ; if (period & (period - 1)) == 0 then use AND mask.
            ld a, b
            dec a
            ld d, a                    ; D = period - 1
            ld a, d
            and b
            jr nz, entity_job_run_fallback_mod

            ld a, e
            and d
            ld e, a
            ld a, (interrupt_counter)
            and d
            cp e
            jr nz, entity_job_run_inactive
            jr entity_job_run_active

entity_job_run_fallback_mod:
            ld a, e
entity_job_run_entry_mod:
            cp b
            jr c, entity_job_run_entry_ready
            sub b
            jr entity_job_run_entry_mod
entity_job_run_entry_ready:
            ld e, a

            ; 16-bit frame modulo: (interrupt_counter % period) in A
            ; Uses shift/subtract division with fixed 16 iterations.
            ld hl, (interrupt_counter)
            xor a
            ld d, 16
entity_job_run_frame_mod16:
            add hl, hl
            adc a, a
            cp b
            jr c, entity_job_run_frame_mod16_no_sub
            sub b
entity_job_run_frame_mod16_no_sub:
            dec d
            jr nz, entity_job_run_frame_mod16

            cp e
            jr nz, entity_job_run_inactive
entity_job_run_active:
            ld a, 1
            jr entity_job_run_done
entity_job_run_inactive:
            xor a
entity_job_run_done:
            pop hl
            pop de
            pop bc
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
; UPDATE ALL ENTITIES - Called by GameFlow (OPTIMIZED)
; ==================================================================
; Only calls component systems that are actually used in this project
; Unused systems are NOT called (saves Z80 cycles)
; Register Contract:
;   Purpose: Main ECS tick entrypoint for one frame.
;   Inputs:
;     - Entity/component tables in RAM
;   Outputs:
;     - Components updated in fixed order
;   Clobbers:
;     - AF
;     - BC
;     - DE
;     - HL
;   Preserved:
;     - None (callers should save what they need)
;   Register roles:
;     - Registers are scratch across component CALL chain
;     - Contract intentionally conservative to prevent hidden coupling
;   Notes:
;     - Do not assume any register survives this routine.

update_all_entities:
    ld hl, prof_update_all_entities_calls
    inc (hl)
    jr nz, .prof_update_all_entities_counted
    inc hl
    inc (hl)
.prof_update_all_entities_counted:
    ; Fast path: when all entities use default job cadence (period=1, entry=0),
    ; rebuild the compact list only when entity/screen membership changes.
    ld a, (entity_job_scheduler_active)
    or a
    jp nz, .update_all_entities_rebuild_list
    call ensure_used_entity_list_current
    jp .update_all_entities_list_ready
.update_all_entities_rebuild_list:
    ; Scheduler active: cadence depends on interrupt_counter, so rebuild every frame.
    call rebuild_used_entity_list
.update_all_entities_list_ready:
    call update_input_component         ; 1. Input (player control)
    call update_behavior_component      ; 3. Behavior/AI
    call update_entities                ; 3b. Patrol/per-entity update
    call update_jump_component          ; 4. Jump impulse
    call update_cursors_component       ; 5b. Cursors movement
    call update_gravity_component       ; 6. Gravity
    call update_position_component      ; 7. Apply velocity
    call prepare_platform_detection     ; 8a. Clear platform refs
    ld hl, prof_collision_calls
    inc (hl)
    jr nz, $+4
    inc hl
    inc (hl)
    call update_collision_component     ; 8b. Collision detection
    call update_platform_riding         ; 8c. Platform riding
    ld hl, prof_wall_calls
    inc (hl)
    jr nz, $+4
    inc hl
    inc (hl)
    call update_wallcollision_component ; 8d. Wall collision
    call update_health_component        ; 9. Health/Death
    call update_damage_component        ; 10. Damage
    ld hl, prof_animation_calls
    inc (hl)
    jr nz, $+4
    inc hl
    inc (hl)
    call update_animation_component     ; 11. Animation
    ld hl, prof_sprite_calls
    inc (hl)
    jr nz, $+4
    inc hl
    inc (hl)
    call update_sprite_component        ; 13. Sprite rendering
    call sync_player_runtime_from_entity
    ret
; Total systems called: 15 (optimized from 16)


; ------------------------------------------------------------------
; mark_used_entity_list_dirty
; Invalidate compact entity list cache.
; Call this after spawn/despawn or screen-id changes.
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Mark compact active-entity cache as stale.
;   Inputs:
;     - None
;   Outputs:
;     - active_entity_list_dirty = 1
;   Clobbers:
;     - HL
;   Preserved:
;     - AF
;     - BC
;     - DE
;   Register roles:
;     - HL = points to dirty flag byte

mark_used_entity_list_dirty:
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ret

; ------------------------------------------------------------------
; ensure_used_entity_list_current
; Rebuild compact list only when marked dirty.
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Conditionally rebuild compact active list only when dirty.
;   Inputs:
;     - active_entity_list_dirty flag
;   Outputs:
;     - active_entity_list rebuilt if needed
;   Clobbers:
;     - AF
;   Preserved:
;     - BC
;     - DE
;     - HL (except nested call clobbers when rebuild happens)
;   Register roles:
;     - A = dirty flag test and branch
;   Notes:
;     - If dirty, downstream rebuild_used_entity_list can clobber many registers.

ensure_used_entity_list_current:
    ld a, (active_entity_list_dirty)
    or a
    ret z
    call rebuild_used_entity_list
    ret

; ------------------------------------------------------------------
; rebuild_used_entity_list
; Build compact list of ACTIVE entity slots that are in use
; for the CURRENT SCREEN only:
; (entity_active != 0 and mask_l|mask_h != 0 and entity_screen_id == current_screen_id)
; Output:
;   active_entity_list[]   = entity indices with components
;   active_entity_count    = number of entries
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Recompute compact list of entities active on current screen.
;   Inputs:
;     - entity_active, entity_comp_masks(_hi), entity_screen_id, current_screen_id
;   Outputs:
;     - active_entity_list[]
;     - active_entity_count
;     - hero_entity_id updated from first current-screen entity flagged as player
;     - input/render/collision/ground/anim buckets refreshed
;     - active_entity_list_dirty=0
;   Clobbers:
;     - AF
;     - BC
;     - DE
;     - HL
;   Preserved:
;     - None
;   Register roles:
;     - B = slots remaining (MAX_ENTITIES..1)
;     - C = entity slot iterator (0..MAX_ENTITIES-1)
;     - DE = index offset (entity id / active list position)
;     - HL = pointer math over component and state arrays
;     - A = predicate checks and counters

rebuild_used_entity_list:
    xor a
    ld (active_entity_count), a
    ld (input_entity_count), a
    ld (render_entity_count), a
    ld (collision_entity_count), a
    ld (ground_entity_count), a
    ld (anim_entity_count), a
    ld a, #FF
    ld (hero_entity_id), a
    ld b, MAX_ENTITIES
    ld c, 0

.rebuild_loop:
    ld e, c
    ld d, 0
    ld hl, entity_active
    add hl, de
    ld a, (hl)
    or a
    jp z, .next_entity

    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    ld hl, entity_comp_masks_hi
    add hl, de
    or (hl)
    jp z, .next_entity

    ; Keep only entities from currently visible screen
    ld hl, entity_screen_id
    add hl, de
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jp nz, .next_entity

    ; Keep only entities scheduled to run on this frame.
    ; entity_job_should_run_c expects C=entity index.
    push bc
    call entity_job_should_run_c
    pop bc
    or a
    jp z, .next_entity

    ld hl, active_entity_count
    ld a, (hl)
    cp MAX_ENTITIES
    jp nc, .next_entity

    ld e, a
    ld d, 0
    ld hl, active_entity_list
    add hl, de
    ld (hl), c
    ld hl, active_entity_count
    inc (hl)

    ld e, c
    ld d, 0
    ld a, (hero_entity_id)
    cp #FF
    jr nz, .skip_hero_candidate
    ld hl, entity_is_player
    add hl, de
    ld a, (hl)
    or a
    jr z, .skip_hero_candidate
    ld a, c
    ld (hero_entity_id), a
.skip_hero_candidate:

    ; Build hot-path buckets once so gameplay systems avoid repeating
    ; the same component-mask filtering every frame.
    ld e, c
    ld d, 0

    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    jr z, .skip_input_bucket
    ld a, (input_entity_count)
    ld l, a
    ld h, 0
    ld de, input_entity_list
    add hl, de
    ld (hl), c
    ld hl, input_entity_count
    inc (hl)
.skip_input_bucket:

    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_SPRITE
    jr z, .skip_render_bucket
    ld a, (render_entity_count)
    ld l, a
    ld h, 0
    ld de, render_entity_list
    add hl, de
    ld (hl), c
    ld hl, render_entity_count
    inc (hl)
.skip_render_bucket:

    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_COLLISION
    jr z, .skip_collision_bucket
    ld a, (collision_entity_count)
    ld l, a
    ld h, 0
    ld de, collision_entity_list
    add hl, de
    ld (hl), c
    ld hl, collision_entity_count
    inc (hl)
.skip_collision_bucket:

    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_COLLISION
    jr nz, .store_ground_bucket
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #02                       ; COMP_MASK_GRAVITY
    jr z, .skip_ground_bucket
.store_ground_bucket:
    ld a, (ground_entity_count)
    ld l, a
    ld h, 0
    ld de, ground_entity_list
    add hl, de
    ld (hl), c
    ld hl, ground_entity_count
    inc (hl)
.skip_ground_bucket:

    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_ANIMATION | COMP_MASK_SPRITE
    cp COMP_MASK_ANIMATION | COMP_MASK_SPRITE
    jp nz, .next_entity
    ld a, (anim_entity_count)
    ld l, a
    ld h, 0
    ld de, anim_entity_list
    add hl, de
    ld (hl), c
    ld hl, anim_entity_count
    inc (hl)

.next_entity:
    inc c
    dec b
    jp nz, .rebuild_loop

.rebuild_done:
    ld a, (hero_entity_id)
    cp #FF
    jr nz, .rebuild_store_clean
    ld a, (input_entity_count)
    or a
    jr z, .rebuild_store_clean
    ld hl, input_entity_list
    ld a, (hl)
    ld (hero_entity_id), a
.rebuild_store_clean:
    xor a
    ld (active_entity_list_dirty), a
    ret

; ------------------------------------------------------------------
; ensure_player_fast_runtime_bound
; Keep the dedicated player runtime attached to the current hero entity.
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Bind the player fast-path runtime to the current hero entity.
;   Inputs:
;     - active_entity_list_dirty, hero_entity_id, current-screen filtered entity lists
;   Outputs:
;     - player_runtime_enabled, player_entity_index, player_x/player_y, player_vx_runtime/player_vy_runtime
;   Clobbers:
;     - AF
;     - BC
;     - DE
;     - HL
;   Preserved:
;     - None
;   Notes:
;     - Calls ensure_used_entity_list_current and resolve_runtime_hero_entity.

ensure_player_fast_runtime_bound:
    call ensure_used_entity_list_current
    call resolve_runtime_hero_entity
    cp #FF
    jp nz, .bind_runtime

    xor a
    ld (player_runtime_enabled), a
    ld (player_vx_runtime), a
    ld (player_vy_runtime), a
    ld (player_x), a
    ld (player_x+1), a
    ld (player_y), a
    ld (player_y+1), a
    ld a, #FF
    ld (player_entity_index), a
    ret

.bind_runtime:
    ld (player_entity_index), a
    ld a, 1
    ld (player_runtime_enabled), a
    call sync_player_runtime_from_entity
    ret

; ------------------------------------------------------------------
; sync_player_runtime_from_entity
; Mirror hero ECS coordinates/velocity into player_* runtime vars.
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Copy the current bound hero entity state into player_* runtime variables.
;   Inputs:
;     - player_runtime_enabled, player_entity_index, entity_x_pos/y_pos, entity_vel_x/y
;   Outputs:
;     - player_x, player_y, player_vx_runtime, player_vy_runtime updated
;   Clobbers:
;     - AF
;     - BC
;     - DE
;     - HL
;   Preserved:
;     - None

sync_player_runtime_from_entity:
    ld a, (player_runtime_enabled)
    or a
    ret z
    ld a, (player_entity_index)
    cp #FF
    ret z
    ld c, a
    ld e, c
    ld d, 0

    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld (player_x), a
    xor a
    ld (player_x+1), a

    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld (player_y), a
    xor a
    ld (player_y+1), a

    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    ld (player_vx_runtime), a

    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)
    ld (player_vy_runtime), a
    ret

; ------------------------------------------------------------------
; update_player_fastpath
; Dedicated hero update path executed before the generic ECS sweeps.
; Mirrors the critical input->jump->gravity->position chain for the
; current player entity without iterating over every active entity.
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Run the critical per-frame player update without ECS list iteration.
;   Inputs:
;     - task_update_input already refreshed input_state/input_btn_*
;   Outputs:
;     - Hero input/jump/gravity/position resolved into entity tables and player_* mirror
;   Clobbers:
;     - AF
;     - BC
;     - DE
;     - HL
;   Preserved:
;     - None
;   Notes:
;     - Global collision/wall/sprite systems still run later in the frame and may refine the final result.

update_player_fastpath:
    call ensure_player_fast_runtime_bound
    ld a, (player_runtime_enabled)
    or a
    ret z
    ld a, (player_entity_index)
    cp #FF
    ret z
    ld c, a

    ; Require Input component to treat this entity as the player fast-path target.
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    jp z, .player_fast_sync

    ; --------------------------------------------------------------
    ; INPUT
    ; --------------------------------------------------------------
    ld e, c
    ld d, 0
    ld hl, entity_input_disabled
    add hl, de
    ld a, (hl)
    or a
    jp z, .player_fast_input_enabled

    ld hl, entity_vel_x
    add hl, de
    ld (hl), 0
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0
    jp .player_fast_after_input

.player_fast_input_enabled:
    ld hl, entity_dir_mask
    add hl, de
    ld b, (hl)                    ; B = direction mask

    ld hl, entity_input_speed
    add hl, de
    ld a, (hl)
    or a
    jr nz, .player_fast_speed_ok
    ld a, 1
.player_fast_speed_ok:
    ld h, a                       ; H = cardinal speed
    srl a
    jr nz, .player_fast_diag_speed_ok
    ld a, 1
.player_fast_diag_speed_ok:
    ld l, a                       ; L = diagonal speed

    ld a, (input_state)
    ld d, 0                       ; D = vel_x
    ld e, 0                       ; E = vel_y
    cp STICK_UP
    jp z, .player_fast_input_up
    cp STICK_DOWN
    jp z, .player_fast_input_down
    cp STICK_LEFT
    jp z, .player_fast_input_left
    cp STICK_RIGHT
    jp z, .player_fast_input_right
    cp STICK_UPRIGHT
    jp z, .player_fast_input_upright
    cp STICK_UPLEFT
    jp z, .player_fast_input_upleft
    cp STICK_DOWNRIGHT
    jp z, .player_fast_input_downright
    cp STICK_DOWNLEFT
    jp z, .player_fast_input_downleft
    jp .player_fast_apply_velocity

.player_fast_input_up:
    ld a, b
    and DIR_ALLOW_UP
    jp z, .player_fast_apply_velocity
    ld a, h
    neg
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_input_down:
    ld a, b
    and DIR_ALLOW_DOWN
    jp z, .player_fast_apply_velocity
    ld a, h
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_input_left:
    ld a, b
    and DIR_ALLOW_LEFT
    jp z, .player_fast_apply_velocity
    ld a, h
    neg
    ld d, a
    jp .player_fast_apply_velocity

.player_fast_input_right:
    ld a, b
    and DIR_ALLOW_RIGHT
    jp z, .player_fast_apply_velocity
    ld a, h
    ld d, a
    jp .player_fast_apply_velocity

.player_fast_input_upright:
    ld a, b
    and DIR_ALLOW_UP
    jp z, .player_fast_check_right_only
    ld a, b
    and DIR_ALLOW_RIGHT
    jp z, .player_fast_check_up_only
    ld a, l
    ld d, a
    neg
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_check_right_only:
    ld a, b
    and DIR_ALLOW_RIGHT
    jp z, .player_fast_apply_velocity
    ld a, h
    ld d, a
    jp .player_fast_apply_velocity

.player_fast_check_up_only:
    ld a, h
    neg
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_input_upleft:
    ld a, b
    and DIR_ALLOW_UP
    jp z, .player_fast_check_left_only_1
    ld a, b
    and DIR_ALLOW_LEFT
    jp z, .player_fast_check_up_only_1
    ld a, l
    neg
    ld d, a
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_check_left_only_1:
    ld a, b
    and DIR_ALLOW_LEFT
    jp z, .player_fast_apply_velocity
    ld a, h
    neg
    ld d, a
    jp .player_fast_apply_velocity

.player_fast_check_up_only_1:
    ld a, h
    neg
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_input_downright:
    ld a, b
    and DIR_ALLOW_DOWN
    jp z, .player_fast_check_right_only_2
    ld a, b
    and DIR_ALLOW_RIGHT
    jp z, .player_fast_check_down_only_2
    ld a, l
    ld d, a
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_check_right_only_2:
    ld a, b
    and DIR_ALLOW_RIGHT
    jp z, .player_fast_apply_velocity
    ld a, h
    ld d, a
    jp .player_fast_apply_velocity

.player_fast_check_down_only_2:
    ld a, h
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_input_downleft:
    ld a, b
    and DIR_ALLOW_DOWN
    jp z, .player_fast_check_left_only_3
    ld a, b
    and DIR_ALLOW_LEFT
    jp z, .player_fast_check_down_only_3
    ld a, l
    neg
    ld d, a
    neg
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_check_left_only_3:
    ld a, b
    and DIR_ALLOW_LEFT
    jp z, .player_fast_apply_velocity
    ld a, h
    neg
    ld d, a
    jp .player_fast_apply_velocity

.player_fast_check_down_only_3:
    ld a, h
    ld e, a

.player_fast_apply_velocity:
    push de
    ld hl, entity_vel_x
    ld e, c
    ld d, 0
    add hl, de
    pop de
    ld (hl), d

    push de
    ld hl, entity_vel_y
    ld e, c
    ld d, 0
    add hl, de
    pop de
    ld (hl), e

    ; Update entity_facing_dir based on input_state.
    ; Match the generic input system so Player fast-path preserves the
    ; same directional semantics used by ChangeSprite and sprite variants.
    push af
    ld a, (input_state)
    or a
    jr z, .player_fast_facing_done
    cp 2
    jr c, .player_fast_facing_up
    cp 5
    jr c, .player_fast_facing_right
    jr z, .player_fast_facing_down
    ld a, 1                     ; FACING_LEFT
    jr .player_fast_facing_write
.player_fast_facing_right:
    ld a, 2                     ; FACING_RIGHT
    jr .player_fast_facing_write
.player_fast_facing_up:
    ld a, 3                     ; FACING_UP
    jr .player_fast_facing_write
.player_fast_facing_down:
    ld a, 4                     ; FACING_DOWN
.player_fast_facing_write:
    push hl
    push de
    ld e, c
    ld d, 0
    ld hl, entity_facing_dir
    add hl, de
    ld (hl), a
    pop de
    pop hl
.player_fast_facing_done:
    pop af

    ; Sync directional sprite facing for input-driven entities.
    ; Keep the same rule as the generic input system: skip when a
    ; State Machine owns ChangeSprite for this entity.
    push af
    push de
    ld e, c
    ld d, 0
    ld hl, entity_sm_ptr_l
    add hl, de
    ld a, (hl)
    ld hl, entity_sm_ptr_h
    add hl, de
    or (hl)
    pop de
    pop af
    jr nz, .player_fast_skip_patrol_facing
    push de
    ld e, c
    ld d, 0
    call update_entity_patrol_facing
    pop de
.player_fast_skip_patrol_facing:

.player_fast_after_input:
    ; --------------------------------------------------------------
    ; JUMP
    ; --------------------------------------------------------------
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #01
    jp z, .player_fast_after_jump

    ld hl, entity_on_ground
    add hl, de
    bit 0, (hl)
    jr z, .player_fast_jump_check

    ld hl, entity_jump_count
    add hl, de
    ld (hl), 0
    ld hl, entity_jump_bonus
    add hl, de
    ld (hl), 0

.player_fast_jump_check:
    ld a, (input_btn_curr)
    and INPUT_BTN_FIRE
    jp z, .player_fast_after_jump
    ld a, (input_btn_prev)
    and INPUT_BTN_FIRE
    jp nz, .player_fast_after_jump

    ld hl, entity_jump_max
    add hl, de
    ld b, (hl)
    ld hl, entity_jump_bonus
    add hl, de
    ld a, (hl)
    add a, b
    ld b, a

    ld hl, entity_jump_count
    add hl, de
    ld a, (hl)
    cp b
    jr c, .player_fast_do_jump

    ld hl, entity_on_ground
    add hl, de
    bit 0, (hl)
    jp z, .player_fast_after_jump

.player_fast_do_jump:
    ld hl, entity_on_ground
    add hl, de
    bit 0, (hl)
    jr nz, .player_fast_skip_bonus_consume

    ld hl, entity_jump_count
    add hl, de
    ld a, (hl)
    ld hl, entity_jump_max
    add hl, de
    cp (hl)
    jr c, .player_fast_skip_bonus_consume

    ld hl, entity_jump_bonus
    add hl, de
    ld a, (hl)
    or a
    jr z, .player_fast_skip_bonus_consume
    dec (hl)

.player_fast_skip_bonus_consume:
    ld hl, entity_jump_count
    add hl, de
    inc (hl)

    ld hl, entity_on_ground
    add hl, de
    res 0, (hl)

    ld hl, entity_platform_id
    add hl, de
    ld (hl), 255

    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #02
    jp z, .player_fast_after_jump

    ld hl, entity_gravity_vel
    add hl, de
    add hl, de
    ld (hl), #00
    inc hl
    ld (hl), #FC

.player_fast_after_jump:
    ; --------------------------------------------------------------
    ; GRAVITY
    ; --------------------------------------------------------------
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #02
    jp z, .player_fast_after_gravity

    ld hl, entity_on_ground
    add hl, de
    ld a, (hl)
    bit 0, a
    jr nz, .player_fast_gravity_grounded

    ld hl, entity_gravity_vel
    add hl, de
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)

    ld a, e
    add a, #40
    ld e, a
    ld a, d
    adc a, #00
    ld d, a

    ld a, d
    bit 7, a
    jr nz, .player_fast_store_gravity
    cp #04
    jr c, .player_fast_store_gravity
    ld de, #0400

.player_fast_store_gravity:
    dec hl
    ld (hl), e
    inc hl
    ld (hl), d

    push de
    ld hl, entity_vel_y
    ld e, c
    ld d, 0
    add hl, de
    pop de
    ld (hl), d
    jr .player_fast_after_gravity

.player_fast_gravity_grounded:
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de
    ld (hl), 0
    inc hl
    ld (hl), 0

.player_fast_after_gravity:
    ; --------------------------------------------------------------
    ; POSITION
    ; --------------------------------------------------------------
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    ld b, a
    and COMP_MASK_POSITION
    jp z, .player_fast_sync

    ld a, b
    and COMP_MASK_MOVEMENT | COMP_MASK_INPUT
    jp z, .player_fast_sync

    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    add a, b
    ld (hl), a

    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)
    bit 7, a
    jr z, .player_fast_vy_positive
    cp #F0
    jr nc, .player_fast_vy_ready
    ld a, #F0
    jr .player_fast_vy_ready
.player_fast_vy_positive:
    cp #11
    jr c, .player_fast_vy_ready
    ld a, #10
.player_fast_vy_ready:
    ld b, a
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    add a, b
    ld (hl), a

.player_fast_sync:
    call sync_player_runtime_from_entity
    ret

; ==================================================================
; EXECUTE ALL STATE MACHINES - Called by GameFlow
; ==================================================================
; This function executes the state machine for each entity that has one
execute_all_state_machines:
    ld hl, prof_execute_sm_calls
    inc (hl)
    jr nz, .prof_execute_sm_counted
    inc hl
    inc (hl)
.prof_execute_sm_counted:
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a                       ; Loop through used entities only
    ld hl, active_entity_list
    
.sm_loop:
    ld a, (hl)                    ; A = entity index
    inc hl                        ; Advance list pointer
    push hl                       ; Save list pointer
    ld c, a
    ld a, (player_runtime_enabled)
    or a
    jr z, .sm_entity_ready
    ld a, (player_entity_index)
    cp c
    jr z, .skip_entity
.sm_entity_ready:
    ld a, c

    ; active_entity_list already guarantees active + current_screen_id
    ld e, a                       ; DE = entity index
    ld d, 0

    ; Check if this entity has a state machine assigned
    ld hl, entity_sm_ptr_l
    add hl, de
    ld c, (hl)                    ; C = SM ptr low
    
    ld hl, entity_sm_ptr_h
    add hl, de
    ld a, (hl)                    ; A = SM ptr high
    
    ; Check if SM pointer is non-zero
    or c
    jr z, .skip_entity            ; No SM assigned, skip

    ; Entity has a state machine - execute it
    ld a, e
    push bc                       ; Preserve loop counter (B) across call
    call SM_Update                ; Execute state machine (A = entity index)
    pop bc
    
.skip_entity:
    pop hl                        ; Restore list pointer
    djnz .sm_loop                 ; Loop for all used entities
    
    ret

refresh_player_state_machine_fastpath:
    ld a, (player_runtime_enabled)
    or a
    ret z
    ld a, (player_entity_index)
    cp #FF
    ret z

    ld e, a
    ld d, 0
    ld hl, entity_sm_ptr_l
    add hl, de
    ld c, (hl)
    ld hl, entity_sm_ptr_h
    add hl, de
    ld a, (hl)
    or c
    ret z

    ld a, e
    call SM_Update
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
    ; Convert X pixel to tile column (divide by 8 - MSX Screen 2 character cell)
    ; Screen layout is ALWAYS 32x24 grid of 8x8 cells regardless of project tile size
    ld a, d
    srl a
    srl a
    srl a                         ; A = X / 8 = tile column
    ld b, a                       ; B = tile column

    ; Convert Y pixel to tile row (divide by 8 - MSX Screen 2 character cell)
    ld a, e
    srl a
    srl a
    srl a                         ; A = Y / 8 = tile row
    ld c, a                       ; C = tile row

    ; Check bounds (assume 32x24 tile screen for now)
    ld a, b
    cp 32
    jr nc, .out_of_bounds
    ld a, c
    cp 24
    jr nc, .out_of_bounds

    ; Calculate tile index: index = row * 32 + column (16-bit to avoid overflow)
    ld l, c
    ld h, 0                       ; HL = row (16-bit)
    add hl, hl                    ; HL = row * 2
    add hl, hl                    ; HL = row * 4
    add hl, hl                    ; HL = row * 8
    add hl, hl                    ; HL = row * 16
    add hl, hl                    ; HL = row * 32
    ld e, b
    ld d, 0
    add hl, de                    ; HL = row * 32 + column

    ; Read actual tile from current screen layout
    ld de, (current_screen_layout) ; DE = pointer to screen layout data
    add hl, de                    ; HL = pointer to tile at position
    call mapper_push_p2
    ld a, (current_screen_layout_bank)
    call mapper_set_bank_p2
    ld a, (hl)                    ; A = tile ID from screen map
    push af
    call mapper_pop_p2
    pop af

    or a                          ; Set flags based on tile ID
    ret                           ; Z flag set if tile == 0 (empty)

.out_of_bounds:
    xor a                         ; A = 0
    ret                           ; Z flag set (out of bounds)

; ------------------------------------------------------------------
; get_tile_behavior
; Get behavior/collision type of a tile
; Input:  A = Tile ID (character code from screen map)
; Output: A = Behavior flags (TILE_SOLID, TILE_PLATFORM, etc.)
; Destroys: HL
; ------------------------------------------------------------------
get_tile_behavior:
    ; Tile ID 0 is always passable (empty tile)
    or a
    jr z, .passable

    ; Look up tile behavior from tile_behavior_table
    ; The table is indexed by tile ID
    ld l, a
    ld h, 0
    ld de, tile_behavior_table
    add hl, de                    ; HL = &tile_behavior_table[tile_id]
    ld a, (hl)                    ; A = behavior flags
    ret

.passable:
    ld a, TILE_PASSABLE
    ret

; ------------------------------------------------------------------
; Tile Behavior Table
; Maps character IDs (0-255) to behavior flags
; NOTE: Wall collision uses behavior map directly (get_behavior_tile).
; This table is used by check_collision_at_point and deadly tile checks.
; Character 0 = empty (passable). Characters >= 128 = project tiles (solid).
; ------------------------------------------------------------------
tile_behavior_table:
    ; Index 0-127: Default passable (background, empty space)
    db TILE_PASSABLE              ; 0: Empty tile
    db TILE_PASSABLE              ; 1: Passable
    db TILE_PASSABLE              ; 2: Passable
    db TILE_PASSABLE              ; 3: Passable
    db TILE_PASSABLE              ; 4: Passable
    db TILE_PASSABLE              ; 5: Passable
    db TILE_PASSABLE              ; 6: Passable
    db TILE_PASSABLE              ; 7: Passable
    db TILE_PASSABLE              ; 8: Passable
    db TILE_PASSABLE              ; 9: Passable
    db TILE_PASSABLE              ; 10: Passable
    db TILE_PASSABLE              ; 11: Passable
    db TILE_PASSABLE              ; 12: Passable
    db TILE_PASSABLE              ; 13: Passable
    db TILE_PASSABLE              ; 14: Passable
    db TILE_PASSABLE              ; 15: Passable
    db TILE_PASSABLE              ; 16: Passable
    db TILE_PASSABLE              ; 17: Passable
    db TILE_PASSABLE              ; 18: Passable
    db TILE_PASSABLE              ; 19: Passable
    db TILE_PASSABLE              ; 20: Passable
    db TILE_PASSABLE              ; 21: Passable
    db TILE_PASSABLE              ; 22: Passable
    db TILE_PASSABLE              ; 23: Passable
    db TILE_PASSABLE              ; 24: Passable
    db TILE_PASSABLE              ; 25: Passable
    db TILE_PASSABLE              ; 26: Passable
    db TILE_PASSABLE              ; 27: Passable
    db TILE_PASSABLE              ; 28: Passable
    db TILE_PASSABLE              ; 29: Passable
    db TILE_PASSABLE              ; 30: Passable
    db TILE_PASSABLE              ; 31: Passable
    db TILE_PASSABLE              ; 32: Passable
    db TILE_PASSABLE              ; 33: Passable
    db TILE_PASSABLE              ; 34: Passable
    db TILE_PASSABLE              ; 35: Passable
    db TILE_PASSABLE              ; 36: Passable
    db TILE_PASSABLE              ; 37: Passable
    db TILE_PASSABLE              ; 38: Passable
    db TILE_PASSABLE              ; 39: Passable
    db TILE_PASSABLE              ; 40: Passable
    db TILE_PASSABLE              ; 41: Passable
    db TILE_PASSABLE              ; 42: Passable
    db TILE_PASSABLE              ; 43: Passable
    db TILE_PASSABLE              ; 44: Passable
    db TILE_PASSABLE              ; 45: Passable
    db TILE_PASSABLE              ; 46: Passable
    db TILE_PASSABLE              ; 47: Passable
    db TILE_PASSABLE              ; 48: Passable
    db TILE_PASSABLE              ; 49: Passable
    db TILE_PASSABLE              ; 50: Passable
    db TILE_PASSABLE              ; 51: Passable
    db TILE_PASSABLE              ; 52: Passable
    db TILE_PASSABLE              ; 53: Passable
    db TILE_PASSABLE              ; 54: Passable
    db TILE_PASSABLE              ; 55: Passable
    db TILE_PASSABLE              ; 56: Passable
    db TILE_PASSABLE              ; 57: Passable
    db TILE_PASSABLE              ; 58: Passable
    db TILE_PASSABLE              ; 59: Passable
    db TILE_PASSABLE              ; 60: Passable
    db TILE_PASSABLE              ; 61: Passable
    db TILE_PASSABLE              ; 62: Passable
    db TILE_PASSABLE              ; 63: Passable
    db TILE_PASSABLE              ; 64: Passable
    db TILE_PASSABLE              ; 65: Passable
    db TILE_PASSABLE              ; 66: Passable
    db TILE_PASSABLE              ; 67: Passable
    db TILE_PASSABLE              ; 68: Passable
    db TILE_PASSABLE              ; 69: Passable
    db TILE_PASSABLE              ; 70: Passable
    db TILE_PASSABLE              ; 71: Passable
    db TILE_PASSABLE              ; 72: Passable
    db TILE_PASSABLE              ; 73: Passable
    db TILE_PASSABLE              ; 74: Passable
    db TILE_PASSABLE              ; 75: Passable
    db TILE_PASSABLE              ; 76: Passable
    db TILE_PASSABLE              ; 77: Passable
    db TILE_PASSABLE              ; 78: Passable
    db TILE_PASSABLE              ; 79: Passable
    db TILE_PASSABLE              ; 80: Passable
    db TILE_PASSABLE              ; 81: Passable
    db TILE_PASSABLE              ; 82: Passable
    db TILE_PASSABLE              ; 83: Passable
    db TILE_PASSABLE              ; 84: Passable
    db TILE_PASSABLE              ; 85: Passable
    db TILE_PASSABLE              ; 86: Passable
    db TILE_PASSABLE              ; 87: Passable
    db TILE_PASSABLE              ; 88: Passable
    db TILE_PASSABLE              ; 89: Passable
    db TILE_PASSABLE              ; 90: Passable
    db TILE_PASSABLE              ; 91: Passable
    db TILE_PASSABLE              ; 92: Passable
    db TILE_PASSABLE              ; 93: Passable
    db TILE_PASSABLE              ; 94: Passable
    db TILE_PASSABLE              ; 95: Passable
    db TILE_PASSABLE              ; 96: Passable
    db TILE_PASSABLE              ; 97: Passable
    db TILE_PASSABLE              ; 98: Passable
    db TILE_PASSABLE              ; 99: Passable
    db TILE_PASSABLE              ; 100: Passable
    db TILE_PASSABLE              ; 101: Passable
    db TILE_PASSABLE              ; 102: Passable
    db TILE_PASSABLE              ; 103: Passable
    db TILE_PASSABLE              ; 104: Passable
    db TILE_PASSABLE              ; 105: Passable
    db TILE_PASSABLE              ; 106: Passable
    db TILE_PASSABLE              ; 107: Passable
    db TILE_PASSABLE              ; 108: Passable
    db TILE_PASSABLE              ; 109: Passable
    db TILE_PASSABLE              ; 110: Passable
    db TILE_PASSABLE              ; 111: Passable
    db TILE_PASSABLE              ; 112: Passable
    db TILE_PASSABLE              ; 113: Passable
    db TILE_PASSABLE              ; 114: Passable
    db TILE_PASSABLE              ; 115: Passable
    db TILE_PASSABLE              ; 116: Passable
    db TILE_PASSABLE              ; 117: Passable
    db TILE_PASSABLE              ; 118: Passable
    db TILE_PASSABLE              ; 119: Passable
    db TILE_PASSABLE              ; 120: Passable
    db TILE_PASSABLE              ; 121: Passable
    db TILE_PASSABLE              ; 122: Passable
    db TILE_PASSABLE              ; 123: Passable
    db TILE_PASSABLE              ; 124: Passable
    db TILE_PASSABLE              ; 125: Passable
    db TILE_PASSABLE              ; 126: Passable
    db TILE_PASSABLE              ; 127: Passable

    ; Index 128-255: Project tile characters (solid by default)
    ; MSX Screen 2 assigns character IDs >= 128 to project tiles
    db TILE_SOLID                 ; 128: Solid
    db TILE_SOLID                 ; 129: Solid
    db TILE_SOLID                 ; 130: Solid
    db TILE_SOLID                 ; 131: Solid
    db TILE_SOLID                 ; 132: Solid
    db TILE_SOLID                 ; 133: Solid
    db TILE_SOLID                 ; 134: Solid
    db TILE_SOLID                 ; 135: Solid
    db TILE_SOLID                 ; 136: Solid
    db TILE_SOLID                 ; 137: Solid
    db TILE_SOLID                 ; 138: Solid
    db TILE_SOLID                 ; 139: Solid
    db TILE_SOLID                 ; 140: Solid
    db TILE_SOLID                 ; 141: Solid
    db TILE_SOLID                 ; 142: Solid
    db TILE_SOLID                 ; 143: Solid
    db TILE_SOLID                 ; 144: Solid
    db TILE_SOLID                 ; 145: Solid
    db TILE_SOLID                 ; 146: Solid
    db TILE_SOLID                 ; 147: Solid
    db TILE_SOLID                 ; 148: Solid
    db TILE_SOLID                 ; 149: Solid
    db TILE_SOLID                 ; 150: Solid
    db TILE_SOLID                 ; 151: Solid
    db TILE_SOLID                 ; 152: Solid
    db TILE_SOLID                 ; 153: Solid
    db TILE_SOLID                 ; 154: Solid
    db TILE_SOLID                 ; 155: Solid
    db TILE_SOLID                 ; 156: Solid
    db TILE_SOLID                 ; 157: Solid
    db TILE_SOLID                 ; 158: Solid
    db TILE_SOLID                 ; 159: Solid
    db TILE_SOLID                 ; 160: Solid
    db TILE_SOLID                 ; 161: Solid
    db TILE_SOLID                 ; 162: Solid
    db TILE_SOLID                 ; 163: Solid
    db TILE_SOLID                 ; 164: Solid
    db TILE_SOLID                 ; 165: Solid
    db TILE_SOLID                 ; 166: Solid
    db TILE_SOLID                 ; 167: Solid
    db TILE_SOLID                 ; 168: Solid
    db TILE_SOLID                 ; 169: Solid
    db TILE_SOLID                 ; 170: Solid
    db TILE_SOLID                 ; 171: Solid
    db TILE_SOLID                 ; 172: Solid
    db TILE_SOLID                 ; 173: Solid
    db TILE_SOLID                 ; 174: Solid
    db TILE_SOLID                 ; 175: Solid
    db TILE_SOLID                 ; 176: Solid
    db TILE_SOLID                 ; 177: Solid
    db TILE_SOLID                 ; 178: Solid
    db TILE_SOLID                 ; 179: Solid
    db TILE_SOLID                 ; 180: Solid
    db TILE_SOLID                 ; 181: Solid
    db TILE_SOLID                 ; 182: Solid
    db TILE_SOLID                 ; 183: Solid
    db TILE_SOLID                 ; 184: Solid
    db TILE_SOLID                 ; 185: Solid
    db TILE_SOLID                 ; 186: Solid
    db TILE_SOLID                 ; 187: Solid
    db TILE_SOLID                 ; 188: Solid
    db TILE_SOLID                 ; 189: Solid
    db TILE_SOLID                 ; 190: Solid
    db TILE_SOLID                 ; 191: Solid
    db TILE_SOLID                 ; 192: Solid
    db TILE_SOLID                 ; 193: Solid
    db TILE_SOLID                 ; 194: Solid
    db TILE_SOLID                 ; 195: Solid
    db TILE_SOLID                 ; 196: Solid
    db TILE_SOLID                 ; 197: Solid
    db TILE_SOLID                 ; 198: Solid
    db TILE_SOLID                 ; 199: Solid
    db TILE_SOLID                 ; 200: Solid
    db TILE_SOLID                 ; 201: Solid
    db TILE_SOLID                 ; 202: Solid
    db TILE_SOLID                 ; 203: Solid
    db TILE_SOLID                 ; 204: Solid
    db TILE_SOLID                 ; 205: Solid
    db TILE_SOLID                 ; 206: Solid
    db TILE_SOLID                 ; 207: Solid
    db TILE_SOLID                 ; 208: Solid
    db TILE_SOLID                 ; 209: Solid
    db TILE_SOLID                 ; 210: Solid
    db TILE_SOLID                 ; 211: Solid
    db TILE_SOLID                 ; 212: Solid
    db TILE_SOLID                 ; 213: Solid
    db TILE_SOLID                 ; 214: Solid
    db TILE_SOLID                 ; 215: Solid
    db TILE_SOLID                 ; 216: Solid
    db TILE_SOLID                 ; 217: Solid
    db TILE_SOLID                 ; 218: Solid
    db TILE_SOLID                 ; 219: Solid
    db TILE_SOLID                 ; 220: Solid
    db TILE_SOLID                 ; 221: Solid
    db TILE_SOLID                 ; 222: Solid
    db TILE_SOLID                 ; 223: Solid
    db TILE_SOLID                 ; 224: Solid
    db TILE_SOLID                 ; 225: Solid
    db TILE_SOLID                 ; 226: Solid
    db TILE_SOLID                 ; 227: Solid
    db TILE_SOLID                 ; 228: Solid
    db TILE_SOLID                 ; 229: Solid
    db TILE_SOLID                 ; 230: Solid
    db TILE_SOLID                 ; 231: Solid
    db TILE_SOLID                 ; 232: Solid
    db TILE_SOLID                 ; 233: Solid
    db TILE_SOLID                 ; 234: Solid
    db TILE_SOLID                 ; 235: Solid
    db TILE_SOLID                 ; 236: Solid
    db TILE_SOLID                 ; 237: Solid
    db TILE_SOLID                 ; 238: Solid
    db TILE_SOLID                 ; 239: Solid
    db TILE_SOLID                 ; 240: Solid
    db TILE_SOLID                 ; 241: Solid
    db TILE_SOLID                 ; 242: Solid
    db TILE_SOLID                 ; 243: Solid
    db TILE_SOLID                 ; 244: Solid
    db TILE_SOLID                 ; 245: Solid
    db TILE_SOLID                 ; 246: Solid
    db TILE_SOLID                 ; 247: Solid
    db TILE_SOLID                 ; 248: Solid
    db TILE_SOLID                 ; 249: Solid
    db TILE_SOLID                 ; 250: Solid
    db TILE_SOLID                 ; 251: Solid
    db TILE_SOLID                 ; 252: Solid
    db TILE_SOLID                 ; 253: Solid
    db TILE_SOLID                 ; 254: Solid
    db TILE_SOLID                 ; 255: Solid

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


update_secret_zone_component:
    ret


    ; ==================================================================
; END OF COMPONENT SYSTEMS
    ; ==================================================================
        

; --- End of Bank 1 — pad to 8KB boundary ---
    ds #8000 - $, #FF

; ##################################################################
; BANK 2 — [#8000h-#A000h] PRIMARY: statemachine
; (Always mapped at boot: bank1→P1, bank2→P2, bank3→P3)
; ##################################################################
    org #8000


    ; ------------------------------------------------------------------
    ; SM_Update
    ; Main State Machine Update Routine
    ; Input: A = Entity Index
    ; ------------------------------------------------------------------
SM_Update:
    ld hl, prof_sm_update_calls
    inc (hl)
    jr nz, .sm_prof_counted
    inc hl
    inc (hl)
.sm_prof_counted:
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
    DW Action_Nop ; 1 [Action_SetPosition stripped]
    DW Action_Nop ; 2 [Action_MoveBy stripped]
    DW Action_Nop ; 3 [Action_SetVelocity stripped]
    DW Action_ApplyForce; 4
    DW Action_ChangeSprite; 5
    DW Action_Nop ; 6 [Action_PlayAnimation stripped]
    DW Action_Nop ; 7 [Action_SetAnimSpeed stripped]
    DW Action_Nop ; 8 [Action_ToggleAnim stripped]
    DW Action_PlaySound; 9
    DW Action_Nop ; 10 [Action_PlayMusic stripped]
    DW Action_Nop ; 11 [Action_MuteMusic stripped]
    DW Action_Nop ; 12 [Action_StopMusic stripped]
    DW Action_SetVariable; 13
    DW Action_Nop ; 14 [Action_IncVariable stripped]
    DW Action_Nop ; 15 [Action_DecVariable stripped]
    DW Action_SetCompProp; 16
    DW Action_Nop ; 17 [Action_Wait stripped]
    DW Action_Nop ; 18 [Action_GotoState stripped]
    DW Action_DestroyEntity; 19
    DW Action_Nop ; 20 [Action_SpawnEntity stripped]
    DW Action_Nop ; 21 [Action_GetRandomPos stripped]
    DW Action_Nop ; 22 [Action_ChangeGameFlow stripped]
    DW Action_Nop ; 23 [Action_RegenerateHud stripped]
    DW Action_DecLives; 24
    DW Action_IncLives; 25
    DW Action_Respawn; 26
    DW Action_BreakTile; 27
    DW Action_Nop ; 28 [Action_ReplaceTile stripped]
    DW Action_Nop ; 29 [Action_Rnd stripped]
    DW Action_Nop ; 30 [Action_PointAt stripped]
    DW Action_Nop ; 31 [Action_AddVars stripped]
    DW Action_Nop ; 32 [Action_SubVars stripped]
    DW Action_Nop ; 33 [Action_MulVars stripped]
    DW Action_Nop ; 34 [Action_DivVars stripped]
    DW Action_Nop ; 35 [Action_ModVars stripped]
    DW Action_Nop ; 36 [Action_AssignVar stripped]
    DW Action_Nop ; 37 [Action_DisableInput stripped]
    DW Action_Nop ; 38 [Action_EnableInput stripped]
    DW Action_Nop ; 39 [Action_CleanSprites stripped]
    DW Action_Nop ; 40 [Action_ExitCurrentWorld stripped]

    ; ------------------------------------------------------------------
; ACTION HANDLERS IMPLEMENTATION
    ; ------------------------------------------------------------------

Action_Nop:
    ret

; [Action_SetPosition stripped - not used]

; [Action_MoveBy stripped - not used]

; [Action_SetVelocity stripped - not used]

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
;      sprite, borra ONLY_WHEN_MOVING y marca FORCE_UPLOAD para que el
;      próximo update_animation_component sincronice el frame actual
;      fuera del path de cambio de sprite.
;   5. Colores de capas: actualiza sprite_layer_colors (tabla RAM) con
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
;   bit 4 = ANIM_FLAG_FORCE_UPLOAD  (1 = sincronizar frame actual en el próximo update_animation_component)
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
    cp 5
    jr nc, .acs_dir_done    ; facing inválido → ignorar redirect y usar sprite original

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

    ; D guardará el sprite ID para uso posterior (color update, loop flags).
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
    ;   - bit 4 (FORCE_UPLOAD)    → 1  pedir sincronización del frame actual
    ;                                 en el próximo update_animation_component
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
    and #EF                 ; bit 4 = 0: limpiar FORCE_UPLOAD previo
    or ANIM_FLAG_FORCE_UPLOAD
    ld (hl), a              ; entity_anim_flags[entity] = flags actualizados

    ; ------------------------------------------------------------------
    ; BLOQUE 5: Actualizar tabla de colores de capas en RAM
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

; [Action_PlayAnimation stripped - not used]

; [Action_SetAnimSpeed stripped - not used]

; [Action_ToggleAnim stripped - not used]

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

; [Action_PlayMusic stripped - not used]

; [Action_MuteMusic stripped - not used]

; [Action_StopMusic stripped - not used]

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

; [Action_IncVariable stripped - not used]

; [Action_DecVariable stripped - not used]

; [Action_Wait stripped - not used]

; [Action_GotoState stripped - not used]

Action_SetCompProp:
; Params: ComponentID(1 byte), PropertyID(1 byte), Value(1 byte)
; Supports a compact set of common runtime fields.
; Property IDs:
;   1=x, 2=y, 3=vx, 4=vy, 5=sprite, 6=isVisible, 7=frame,
;   8=animSpeed, 9=isPlaying, 10=healthCurrent, 11=healthMax,
;   12=inputSpeed.
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
    cp 12
    jp z, .scp_set_input_speed

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
    cp 6
    jp z, .scp_set_input_speed
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
    jp .scp_done

.scp_set_input_speed:
    ld l, b
    ld h, 0
    ld de, entity_input_speed
    add hl, de
    ld a, c
    or a
    jr nz, .scp_input_speed_ok
    ld a, 1                 ; Cursor speed 0 would freeze the entity
.scp_input_speed_ok:
    ld (hl), a

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

; [Action_SpawnEntity stripped - not used]

; [Action_ChangeGameFlow stripped - not used]

; [Action_RegenerateHud stripped - not used]

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
    ld a, c
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

; [Action_ReplaceTile stripped - not used]

; [Action_Rnd stripped - not used]

; [Action_PointAt stripped - not used]

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

; [SM_RandomByte stripped - not used]

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

; [Action_AddVars stripped - not used]

; [Action_SubVars stripped - not used]

; [Action_MulVars stripped - not used]

; [Action_DivVars stripped - not used]

; [Action_ModVars stripped - not used]

; [Action_AssignVar stripped - not used]

; [Action_DisableInput stripped - not used]

; [Action_EnableInput stripped - not used]

; [Action_CleanSprites stripped - not used]

; [Action_ExitCurrentWorld stripped - not used]

SM_ConditionTable:
    DW Condition_Nop            ; 0
    DW Condition_Nop ; 1 [Condition_And stripped]
    DW Condition_Nop ; 2 [Condition_Or stripped]
    DW Condition_Nop ; 3 [Condition_Not stripped]
    DW Condition_KeyPressed     ; 4
    DW Condition_Nop ; 5 [Condition_KeyReleased stripped]
    DW Condition_Nop ; 6 [Condition_TimeOut stripped]
    DW Condition_Nop ; 7 [Condition_CanMove stripped]
    DW Condition_HasCollision   ; 8
    DW Condition_Nop ; 9 [Condition_PathClear stripped]
    DW Condition_OnWallCollision; 10
    DW Condition_DeadlyTile     ; 11
    DW Condition_AnimComplete   ; 12
    DW Condition_Nop ; 13 [Condition_KeyAndMove stripped]
    DW Condition_Nop ; 14 [Condition_VariableCompare stripped]
    DW Condition_Nop ; 15 [Condition_Xor stripped]

    ; ------------------------------------------------------------------
    ; CONDITION HANDLERS IMPLEMENTATION
    ; ------------------------------------------------------------------

Condition_Nop:
    ld a, 1                 ; Always true
    ret

; [Condition_And stripped - not used]

; [Condition_Or stripped - not used]

; [Condition_Xor stripped - not used]

; [Condition_Not stripped - not used]

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
; [SM_DeduceDirectionFromVelocity stripped - not used]

; [SM_TestMoveDirection stripped - not used]

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

; [Condition_KeyReleased stripped - not used]

; [Condition_TimeOut stripped - not used]

; [Condition_CanMove stripped - not used]

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

; [Condition_PathClear stripped - not used]

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
    ld hl, entity_flag_deadly_tile
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

; [Condition_KeyAndMove stripped - not used]

; [Condition_VariableCompare stripped - not used]
; ==================================================================
; GLOBAL VARIABLES TABLE
; ==================================================================
; Maps variable IDs (6+) to their RAM addresses
; ID 6 = gem_count, ID 7 = last_gem_char, ID 8+ = user globals
SM_GlobalVarTable:
    DW gem_count            ; ID 6: gem_count
    DW last_gem_char        ; ID 7: last_gem_char (char of last collected tile)

; ==================================================================
; STATE MACHINE DATA
; ==================================================================

; ==================================================================
; TEMPLATE PROFILE TABLES
; ==================================================================
SM_TemplateProfileCount EQU 14
SM_TemplateSpriteTable:
    DB 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 7, 10, 10
SM_TemplateAnimSpeedTable:
    DB 6, 8, 10, 15, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6
SM_TemplateHealthCurrentTable:
    DB 1, 3, 1, 1, 1, 3, 1, 3, 3, 3, 1, 1, 1, 1, 1
SM_TemplateHealthMaxTable:
    DB 1, 3, 1, 1, 1, 3, 1, 3, 3, 3, 1, 1, 1, 1, 1

; ==================================================================
; STATE MACHINE SPRITE RUNTIME TABLES
; NOTE: frame bank is derived from the frame pointer at runtime.
; This keeps ChangeSprite compatible with post-export ZX0 label remaps.
; ==================================================================
SM_SpriteAssetCount EQU 14
SM_SpritePatternPtrTable:
    DW SPRITE_0_PATTERN
    DW SPRITE_1_PATTERN
    DW SPRITE_2_PATTERN
    DW SPRITE_3_PATTERN
    DW SPRITE_4_PATTERN
    DW SPRITE_5_PATTERN
    DW SPRITE_6_PATTERN
    DW SPRITE_7_PATTERN
    DW SPRITE_8_PATTERN
    DW SPRITE_9_PATTERN
    DW SPRITE_10_PATTERN
    DW SPRITE_11_PATTERN
    DW SPRITE_12_PATTERN
    DW SPRITE_13_PATTERN

; ==================================================================
; STATE MACHINE SOUND ASSET TABLES
; PLAY_SOUND exports a one-shot 60Hz frame stream per sound asset.
; Channel loops are flattened to a single pass to avoid stuck PSG.
; Hardware envelopes are not emitted yet in this state-machine path.
; ==================================================================
SM_SoundFrameSize EQU 11
SM_SoundAssetCount EQU 1
SM_SoundPtrTable:
    DW SM_SoundAsset_0

SM_SoundAsset_0:
    DB 21
    DW SM_SoundAsset_0_Frames

SM_SoundAsset_0_Frames:
    DB 155, 0, 10, 0, 0, 0, 0, 0, 0, 16, 62
    DB 155, 0, 10, 0, 0, 0, 0, 0, 0, 16, 62
    DB 155, 0, 10, 0, 0, 0, 0, 0, 0, 16, 62
    DB 155, 0, 10, 0, 0, 0, 0, 0, 0, 16, 62
    DB 155, 0, 10, 0, 0, 0, 0, 0, 0, 16, 62
    DB 155, 0, 10, 0, 0, 0, 0, 0, 0, 16, 62
    DB 155, 0, 10, 0, 0, 0, 0, 0, 0, 16, 62
    DB 155, 0, 10, 0, 0, 0, 0, 0, 0, 16, 62
    DB 155, 0, 10, 0, 0, 0, 0, 0, 0, 16, 62
    DB 155, 0, 10, 0, 0, 0, 0, 0, 0, 16, 62
    DB 245, 0, 10, 0, 0, 0, 0, 0, 0, 16, 62
    DB 245, 0, 10, 0, 0, 0, 0, 0, 0, 16, 62
    DB 245, 0, 10, 0, 0, 0, 0, 0, 0, 16, 62
    DB 245, 0, 10, 0, 0, 0, 0, 0, 0, 16, 62
    DB 245, 0, 10, 0, 0, 0, 0, 0, 0, 16, 62
    DB 245, 0, 10, 0, 0, 0, 0, 0, 0, 16, 62
    DB 245, 0, 10, 0, 0, 0, 0, 0, 0, 16, 62
    DB 245, 0, 10, 0, 0, 0, 0, 0, 0, 16, 62
    DB 245, 0, 10, 0, 0, 0, 0, 0, 0, 16, 62
    DB 245, 0, 10, 0, 0, 0, 0, 0, 0, 16, 62
    DB 245, 0, 10, 0, 0, 0, 0, 0, 0, 16, 62
; State Machine: player_sm (statemachine_1761075121583) 
SM_player_sm_state_1761075124676: 
    DB 0; ID(unused) 
    DW SM_player_sm_state_1761075124676_OnEnter 
    DW 0 
    DW SM_player_sm_state_1761075124676_Transitions 
SM_player_sm_state_1761075124676_OnEnter: 
    DB 5; CHANGE_SPRITE 
    DB 0; sprite: hero 
    DB 0xFF; END
SM_player_sm_state_1761075124676_Transitions: 
    DB 6; Count
    DB 8; HAS_COLLISION 
    DB 2          ; collisionType: enemy
    DW SM_player_sm_state_1761075128298 
    DW SM_player_sm_state_1761075124676_Transitions_Actions_0 
    DB 4; KEY_PRESSED 
    DB 0          ; Key: keyn
    DW SM_player_sm_state_1761075124676 
    DW SM_player_sm_state_1761075124676_Transitions_Actions_1 
    DB 4; KEY_PRESSED 
    DB 0          ; Key: keyn
    DW SM_player_sm_state_1761075124676 
    DW SM_player_sm_state_1761075124676_Transitions_Actions_2 
    DB 11; HAS_DEADLY_TILE_COLLISION 
    DW SM_player_sm_state_1761075128298 
    DW SM_player_sm_state_1761075124676_Transitions_Actions_3 
    DB 8; HAS_COLLISION 
    DB 3          ; collisionType: item
    DW SM_player_sm_state_1761075124676 
    DW SM_player_sm_state_1761075124676_Transitions_Actions_4 
    DB 8; HAS_COLLISION 
    DB 3          ; collisionType: item
    DW SM_player_sm_state_1761075124676 
    DW SM_player_sm_state_1761075124676_Transitions_Actions_5 

SM_player_sm_state_1761075124676_Transitions_Actions_0: 
    DB 5; CHANGE_SPRITE 
    DB 4; sprite: hero_dead 
    DB 0xFF; END
SM_player_sm_state_1761075124676_Transitions_Actions_1: 
    DB 27; BREAK_TILE 
    DB 0, 2        ; BREAK_TILE dir=left
    DB 0xFF; END
SM_player_sm_state_1761075124676_Transitions_Actions_2: 
    DB 27; BREAK_TILE 
    DB 0, 3        ; BREAK_TILE dir=right
    DB 0xFF; END
SM_player_sm_state_1761075124676_Transitions_Actions_3: 
    DB 5; CHANGE_SPRITE 
    DB 4; sprite: hero_dead 
    DB 0xFF; END
SM_player_sm_state_1761075124676_Transitions_Actions_4: 
    DB 4; APPLY_FORCE 
    DB 0, -1 
    DB 19; DESTROY_ENTITY 
    DB 1          ; Target: other
    DB 9; PLAY_SOUND 
    DB 0        ; sound: sound_1762348286756
    DB 0xFF; END
SM_player_sm_state_1761075124676_Transitions_Actions_5: 
    DB 16; SET_COMPONENT_PROPERTY 
    DB 0, 0, 0        ; comp=comp_shoot=>0, prop=hasAmmo=>0, value=
    DB 13; SET_VARIABLE 
    DB 0, 100        ; Ammo (ID 0)
    DB 4; APPLY_FORCE 
    DB 4, 4 
    DB 0xFF; END

SM_player_sm_state_1761075128298: 
    DB 0; ID(unused) 
    DW 0 
    DW 0 
    DW SM_player_sm_state_1761075128298_Transitions 
SM_player_sm_state_1761075128298_Transitions: 
    DB 1; Count
    DB 12; ANIMATION_COMPLETE 
    DW SM_player_sm_state_1761164765068 
    DW SM_player_sm_state_1761075128298_Transitions_Actions_0 

SM_player_sm_state_1761075128298_Transitions_Actions_0: 
    DB 26; RESPAWN_PLAYER 
    DB 255, 255 
    DB 0xFF; END

SM_player_sm_state_1761164765068: 
    DB 0; ID(unused) 
    DW 0 
    DW 0 
    DW SM_player_sm_state_1761164765068_Transitions 
SM_player_sm_state_1761164765068_Transitions: 
    DB 1; Count
    DB 12; ANIMATION_COMPLETE 
    DW SM_player_sm_state_1761075124676 
    DW SM_player_sm_state_1761164765068_Transitions_Actions_0 

SM_player_sm_state_1761164765068_Transitions_Actions_0: 
    DB 5; CHANGE_SPRITE 
    DB 0; sprite: hero 
    DB 0xFF; END

SM_player_sm_state_1761590318090: 
    DB 0; ID(unused) 
    DW 0 
    DW 0 
    DW 0 

; State Machine: box_sm (statemachine_1762195602243) 
SM_box_sm_state_1762195617579: 
    DB 0; ID(unused) 
    DW 0 
    DW 0 
    DW 0 

SM_box_sm_state_1762195627402: 
    DB 0; ID(unused) 
    DW 0 
    DW 0 
    DW 0 

SM_box_sm_state_1762195655252: 
    DB 0; ID(unused) 
    DW 0 
    DW 0 
    DW SM_box_sm_state_1762195655252_Transitions 
SM_box_sm_state_1762195655252_Transitions: 
    DB 2; Count
    DB 10; ON_WALL_COLLISION 
    DB 5          ; Wall direction: down
    DW SM_box_sm_state_1762195617579 
    DW 0 
    DB 8; HAS_COLLISION 
    DB 0          ; collisionType: any
    DW SM_box_sm_state_1762195617579 
    DW 0 



; --- End of Bank 2 — pad to 8KB boundary ---
    ds #A000 - $, #FF

; ##################################################################
; BANK 3 — [#A000h-#C000h] PRIMARY: gameflow
; (Always mapped at boot: bank1→P1, bank2→P2, bank3→P3)
; ##################################################################
    org #A000

; ==================================================================
; GAMEFLOW EXECUTION ENGINE
; File: gameflow.asm
; Description: GameFlow-based game orchestration system
; ==================================================================
;
; GameFlow: Main
; Total Nodes: 7
; Total Connections: 7
; Start Node: gf_start_1760724231672
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
    ld hl, gameflow_node_gf_start_1760724231672
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
    cp NODE_TYPE_RESTART
    jp z, gameflow_handle_restart
    cp NODE_TYPE_TEXT
    jp z, gameflow_handle_text
    cp NODE_TYPE_MUSIC
    jp z, gameflow_handle_music
    cp NODE_TYPE_SUB_MENU
    jp z, gameflow_handle_submenu
    
    ; Unknown node type - error
    ret

; ==================================================================
; NODE TYPE HANDLERS
; Each handler receives:
;   DE = node data pointer
;   BC = connection table pointer
; ==================================================================

gameflow_handle_start:
    ; Start node - Initialize game state and systems
    ; DE = node data pointer:
    ;   [init_routine_ptr DW][init_routine_bank DB]
    ; BC = connection table

    push bc         ; Save connection table

    ; Execute initialization routine
    ; DE points to start_init_data structure
    ex de, hl
    ld e, (hl)
    inc hl
    ld d, (hl)      ; DE = initialization routine address
    inc hl
    ld b, (hl)      ; B = initialization routine bank
    ld h, d
    ld l, e         ; HL = initialization routine address

    ; Call initialization routine (if not null)
    ld a, h
    or l
    jr z, .skip_init

    ; Mapper-safe far call (auto window from HL address)
    ld a, b
    call mapper_call_hl_auto

.skip_init:
    ; Continue to next node
    pop bc
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z           ; No connection
    jp gameflow_execute_node

gameflow_handle_worldlink:
    ; WorldLink node - load world and enter game loop
    ; DE = world data pointer:
    ;   [load_world_ptr DW][load_world_bank DB]
    ; BC = connection table (for exit)

    push bc         ; Save connection table

    ; Load the world
    ; DE points to: dw load_world_X, db load_world_bank
    ex de, hl
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld b, (hl)      ; B = load_world_X bank
    ld h, d
    ld l, e         ; HL = load_world_X address

    ; Mapper-safe far call to world load routine
    ld a, h
    or l
    jr z, .after_load
    ld a, b
    call mapper_call_hl_auto

.after_load:
    ; Set game state
    xor a
    ld (gameflow_exit_requested), a
    ld a, FLOW_STATE_GAME
    ld (current_flow_state), a

    ; Sync SAT patterns using the slot table just filled by load_world.
    ; force_update_entity_sprite (called during init_entities) ran before
    ; load_sprite_patterns, so sprite_asset_base_pattern_slot_runtime was
    ; all zeros then.  Calling update_sprite_component here recomputes the
    ; correct slot->pattern mapping for all entities in the render list
    ; so the very first update_sprites_to_vram below writes the right data.
    call update_sprite_component

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

gameflow_handle_restart:
    ; Restart node - safe runtime reinit entry (no cold page remap).
    jp restart_rom

gameflow_handle_text:
    ; Text node - show text screen and wait for fire
    ; DE = text data pointer (pre-computed lines table)
    ; BC = connection table

    push bc

    ; Show text screen (full screen with title, message, prompt)
    call show_text_screen

    ; Wait for fire button
    call wait_for_fire

    ; Continue to next node
    pop bc
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

; ------------------------------------------------------------------
; show_text_screen
; Display full text screen with optional background screen asset
; Input: DE = text data pointer
;   Format: DB bgColor, DW screen_load_ptr (0=none), DB screen_load_bank, DB numLines
;           Per line: DB row, DB col, DW string_ptr
; If screen_load_ptr != 0: calls that function to load background screen
; (the load_screen function sets VDP colors and name table from screen asset)
; If screen_load_ptr == 0: sets bgColor, clears screen, renders text on solid bg
; ------------------------------------------------------------------
show_text_screen:
    push bc
    push de
    push hl

    ex de, hl                     ; HL = data pointer

    ; Read bgColor, screen load function pointer, and screen load bank
    ld a, (hl)                    ; A = bgColor
    inc hl
    ld c, (hl)                    ; C = screen_load_ptr low
    inc hl
    ld b, (hl)                    ; B = screen_load_ptr high
    inc hl                        ; BC = load function ptr (0 = no bg screen)
    ld e, (hl)                    ; E = screen_load_bank
    inc hl

    push hl                       ; (1) Save pointer to numLines
    push af                       ; (2) Save bgColor
    push bc                       ; (3) Save function pointer
    push de                       ; (4) Save bank byte (E)

    ; Disable screen before any VRAM write
    call DISSCR

    ; Check if we have a background screen to load
    pop de                        ; (4) Restore bank byte (E)
    pop bc                        ; (3) Restore function pointer
    ld a, b
    or c
    jr z, .sts_no_bg_screen

    ; Has background screen: mapper-safe call to load_screen_X
    ; (load_screen sets VDP colors + writes name table)
    ld h, b
    ld l, c                       ; HL = function address
    ld a, e                       ; A = screen_load_bank
    call mapper_call_hl_auto
    pop af                        ; (2) Discard saved bgColor (screen set its own colors)
    jp .sts_render

.sts_no_bg_screen:
    ; No background screen: set solid color and clear
    pop af                        ; (2) Restore bgColor
    ld b, a                       ; B = border color (same as bg)
    push af
    call set_screen_colors
    pop af
    call init_char0_color

    ; Clear entire screen (24 rows)
    ld a, 0
    ld b, 24
.sts_clear_loop:
    push af
    push bc
    call clear_screen_row
    pop bc
    pop af
    inc a
    djnz .sts_clear_loop

.sts_render:
    ; Background loaders may overwrite character patterns/colors used for text.
    ; Restore font before rendering text lines.
    call init_font_system

    ; Now render each text line
    pop hl                        ; (1) HL = pointer to numLines
    ld a, (hl)                    ; A = numLines
    inc hl                        ; HL = first line entry
    or a
    jp z, .sts_enable             ; No lines? just enable screen

    ld b, a                       ; B = line counter

.sts_line_loop:
    push bc

    ; Read row
    ld a, (hl)                    ; A = row
    inc hl
    ; Read col
    ld c, (hl)                    ; C = col
    inc hl
    ; Read string pointer
    ld e, (hl)
    inc hl
    ld d, (hl)                    ; DE = string pointer
    inc hl

    push hl                       ; Save data pointer

    ; Calculate VRAM address: #1800 + row*32 + col
    push de                       ; Save string pointer
    ld l, a
    ld h, 0
    add hl, hl                    ; * 2
    add hl, hl                    ; * 4
    add hl, hl                    ; * 8
    add hl, hl                    ; * 16
    add hl, hl                    ; * 32
    ld e, c
    ld d, 0
    add hl, de                    ; + col
    ld de, #1800
    add hl, de                    ; + name table base
    ex de, hl                     ; DE = VRAM address
    pop hl                        ; HL = string pointer

    call print_string_vram

    pop hl                        ; Restore data pointer
    pop bc
    djnz .sts_line_loop

.sts_enable:
    call ENASCR

    pop hl
    pop de
    pop bc
    ret

; ------------------------------------------------------------------
; wait_for_fire
; Wait for fire button press and release
; ------------------------------------------------------------------
wait_for_fire:
    push bc

    ; Wait for fire button press
.wait_press:
    halt

    ld a, 0                       ; Trigger 0 = space bar
    call GTTRIG
    or a
    jr z, .wait_press

    ; Wait for fire button release
.wait_release:
    halt

    ld a, 0
    call GTTRIG
    or a
    jr nz, .wait_release

    ; Small delay after release
    ld b, 5
.delay_loop:
    halt
    push bc
    pop bc
    djnz .delay_loop

    pop bc
    ret

gameflow_handle_music:
    ; Music node - play/stop music
    ; DE = music data (command, track index, loop flag)
    ; BC = connection table

    push bc
    call music_execute_command
    pop bc
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node
gameflow_handle_submenu:
    ; SubMenu node - interactive navigation
    ; DE points to SubMenu data:
    ;   [bg_color][cursor_sprite_idx][cursor_layer_count]
    ;   [cursor_layer_offsets x4][cursor_colors x4]
    ;   [bg_screen_fn DW][bg_screen_bank DB]
    ;   [option_count][initial_selection][title_ptr][option_ptr_0]...
    push bc
    call show_menu_placeholder
    ld a, (gameflow_menu_selection)
    cp 6
    jr c, .submenu_idx_ok
    ld a, 5                       ; Max supported connection option
.submenu_idx_ok:
    add a, CONNECTION_OPTION_0
    pop bc
    call gameflow_get_connection_by_type
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

; ------------------------------------------------------------------
; show_menu_placeholder
; Runtime GameFlow submenu renderer + input
; Input:  DE = menu data pointer
;   Format: DB bg_color, DB cursor_sprite_idx, DB cursor_layer_count,
;           DB cursor_src_off0..cursor_src_off3,
;           DB cursor_color0..cursor_color3,
;           DW bg_screen_fn, DB bg_screen_bank,
;           DB option_count, DB initial_selection,
;           DW title_ptr, DW option_ptr[n]
; Output: gameflow_menu_selection = selected index (0..5)
; ------------------------------------------------------------------
show_menu_placeholder:
    push bc
    push de
    push hl

    ; Cache menu data pointer
    ld h, d
    ld l, e
    ld (gameflow_submenu_data_ptr), hl

    ; Cache option count (clamped to supported range)
    ; option_count is at offset +14 (+11-12 = bg_screen_fn DW, +13 = bg_screen_bank)
    ld bc, 14
    add hl, bc
    ld a, (hl)
    cp 6
    jr c, .smp_count_ok
    ld a, 6
.smp_count_ok:
    ld (gameflow_submenu_option_count), a

    ; Initialize selected option
    or a
    jr nz, .smp_has_options
    xor a
    ld (gameflow_menu_selection), a
    call submenu_prepare_cursor_sprite
    call render_submenu_screen
    jr .smp_exit

.smp_has_options:
    ld b, a
    inc hl
    ld a, (hl)                    ; initial_selection
    cp b
    jr c, .smp_sel_ok
    xor a
.smp_sel_ok:
    ld (gameflow_menu_selection), a

    call submenu_prepare_cursor_sprite
    call render_submenu_screen

.smp_loop:
    halt

    ; Defensive refresh: some projects keep background/runtime VRAM writers
    ; active while the submenu is idle, which can trample ASCII font chars.
    ; Re-apply the font after each VBlank before polling menu input.
    call init_font_system
    ld a, 0
    call GTSTCK
    cp 1                          ; Up
    jr nz, .smp_check_down

    ld a, (gameflow_menu_selection)
    or a
    jr z, .smp_wait_neutral
    dec a
    ld (gameflow_menu_selection), a
    call render_submenu_screen
    jr .smp_wait_neutral

.smp_check_down:
    cp 5                          ; Down
    jr nz, .smp_check_fire

    ld a, (gameflow_submenu_option_count)
    dec a                         ; max index
    ld b, a
    ld a, (gameflow_menu_selection)
    cp b
    jr nc, .smp_wait_neutral
    inc a
    ld (gameflow_menu_selection), a
    call render_submenu_screen
    jr .smp_wait_neutral

.smp_check_fire:
    ld a, 0
    call GTTRIG
    or a
    jr z, .smp_loop

.smp_wait_fire_release:
    halt

    call init_font_system
    ld a, 0
    call GTTRIG
    or a
    jr nz, .smp_wait_fire_release
    jr .smp_exit

.smp_wait_neutral:
.smp_wait_neutral_loop:
    halt

    call init_font_system
    ld a, 0
    call GTSTCK
    or a
    jr nz, .smp_wait_neutral_loop
    jr .smp_loop

.smp_exit:
    call submenu_hide_cursor_sprite
    ; Ensure no gameplay/menu sprite remains resident after leaving submenu.
    call clear_all_sprites
    call update_sprites_to_vram
    pop hl
    pop de
    pop bc
    ret

; ------------------------------------------------------------------
; render_submenu_screen
; Draw title, options, and selection marker ('>').
; Uses cached pointer/count variables set by show_menu_placeholder.
; ------------------------------------------------------------------
render_submenu_screen:
    push bc
    push de
    push hl

    ; Apply submenu background/border colors from node config.
    ld hl, (gameflow_submenu_data_ptr)
    ld a, (hl)                    ; bg_color
    ld b, a                       ; border = bg
    push af
    call set_screen_colors
    pop af
    call init_char0_color

    ; Load background screen (if configured) or clear solid background.
    ; bg_screen_fn DW is at +11, bg_screen_bank is +13, option_count is +14.
    ld hl, (gameflow_submenu_data_ptr)
    ld bc, 11
    add hl, bc
    ld e, (hl)                    ; E = bg_screen_fn low
    inc hl
    ld d, (hl)                    ; D = bg_screen_fn high
    inc hl
    ld a, (hl)                    ; A = bg_screen_bank
    ld c, a
    ex de, hl                     ; HL = bg_screen_fn (0 if none)
    ld d, c                       ; D = bg_screen_bank
    ld a, h
    or l
    jr z, .rss_clear_screen       ; no bg screen -> solid clear

    ; Mapper-safe call to background screen loader.
    ld a, d
    call mapper_call_hl_auto
    jr .rss_read_count

.rss_clear_screen:
    ; Clear full visible screen (24 rows) with tile 0 (solid background).
    ld a, 0
    ld b, 24
.rss_clear_loop:
    push af
    push bc
    call clear_screen_row
    pop bc
    pop af
    inc a
    djnz .rss_clear_loop

.rss_read_count:
    ; Background loaders may overwrite character patterns/colors used for text.
    ; Restore font before printing title/options in submenu.
    call init_font_system

    ld hl, (gameflow_submenu_data_ptr)
    ld bc, 14                     ; offset to option_count (+11-12 fn, +13 bank)
    add hl, bc
    ld a, (hl)                    ; option_count
    cp 6
    jr c, .rss_count_ok
    ld a, 6
.rss_count_ok:
    ld b, a
    or a
    jr z, .rss_done

    inc hl                        ; skip option_count
    inc hl                        ; skip initial_selection

    ; Print title at row 5, horizontally centered (match PC preview Y=40)
    ld e, (hl)
    inc hl
    ld d, (hl)                    ; DE = title pointer
    inc hl                        ; HL = first option pointer
    push hl
    ex de, hl                     ; HL = title string
    call submenu_compute_center_col
    ld c, a                       ; C = centered col
    ld a, 5                       ; A = row 5 (5*8=40px)
    call submenu_calc_vram_addr   ; DE = VRAM addr
    call print_string_vram
    pop hl

    ; Print options from row 10, spaced 2 rows apart (match PC preview Y=80+idx*12)
    ld c, 0
.rss_option_loop:
    ld a, c
    cp b
    jr nc, .rss_done

    ; Read option string pointer
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    push hl                        ; Save option pointer cursor
    push de                        ; Save option string pointer
    push bc                        ; Save option_count/index
    ex de, hl                      ; HL = option string

    ; Marker at (centered text col - 2)
    ld a, (gameflow_menu_selection)
    cp c
    ld a, ' '
    jr nz, .rss_marker_ready
    ld a, (gameflow_submenu_cursor_enabled)
    or a
    jr nz, .rss_marker_ready      ; sprite cursor active -> keep blank marker
    ld a, '>'
.rss_marker_ready:
    push af
    push bc
    ld a, c
    add a, a                       ; *2 (2 rows per option)
    add a, 10                      ; start at row 10
    ld b, a                        ; B = row for current option
    call submenu_compute_center_col
    sub 2
    jr nc, .rss_marker_col_ok
    xor a
.rss_marker_col_ok:
    ld c, a
    ld a, b
    call submenu_calc_vram_addr
    pop bc
    pop af
    ex de, hl
    call WRTVRM

    pop bc                        ; Restore option_count/index
    pop hl                        ; HL = option string pointer

    ; Option text at centered column
    push bc
    ld a, c
    add a, a                       ; *2 (2 rows per option)
    add a, 10                      ; start at row 10
    ld b, a                        ; B = row for current option
    call submenu_compute_center_col
    ld c, a
    ld a, b
    call submenu_calc_vram_addr
    pop bc
    call print_string_vram

    pop hl                        ; Restore option pointer cursor
    inc c
    jr .rss_option_loop

.rss_done:
    call submenu_update_cursor_sprite
    pop hl
    pop de
    pop bc
    ret

; ------------------------------------------------------------------
; submenu_calc_vram_addr
; Convert row/col to name table VRAM address.
; Input:  A = row (0-23), C = col (0-31)
; Output: DE = VRAM address (#1800 + row*32 + col)
; ------------------------------------------------------------------
submenu_calc_vram_addr:
    push hl
    push bc

    ld l, a
    ld h, 0
    add hl, hl                    ; *2
    add hl, hl                    ; *4
    add hl, hl                    ; *8
    add hl, hl                    ; *16
    add hl, hl                    ; *32
    ld b, 0
    add hl, bc                    ; +col
    ld bc, #1800
    add hl, bc                    ; +name table base
    ex de, hl

    pop bc
    pop hl
    ret

; ------------------------------------------------------------------
; submenu_string_length
; Input: HL = null-terminated string
; Output: A = length in characters (0..255)
; Preserves: HL
; ------------------------------------------------------------------
submenu_string_length:
    push hl
    push bc
    ld c, 0                       ; C = length counter
.ssl_loop:
    ld a, (hl)
    or a                          ; test char for null terminator
    jr z, .ssl_done
    inc c
    inc hl
    jr .ssl_loop
.ssl_done:
    ld a, c                       ; A = string length
    pop bc
    pop hl
    ret

; ------------------------------------------------------------------
; submenu_compute_center_col
; Input: HL = null-terminated string
; Output: A = centered start column (0..31)
; Preserves: HL
; ------------------------------------------------------------------
submenu_compute_center_col:
    push bc
    call submenu_string_length
    cp 32
    jr c, .scc_len_ok
    xor a
    jr .scc_done
.scc_len_ok:
    ld b, a
    ld a, 32
    sub b
    srl a
.scc_done:
    pop bc
    ret

; ------------------------------------------------------------------
; submenu_prepare_cursor_sprite
; Load cursor sprite patterns and initialize cursor state.
; Uses sprite slots SUBMENU_CURSOR_BASE_SPRITE..+3.
; ------------------------------------------------------------------
submenu_prepare_cursor_sprite:
    push bc
    push de
    push hl

    ; Default: no sprite cursor
    xor a
    ld (gameflow_submenu_cursor_enabled), a
    ld (gameflow_submenu_cursor_layer_count), a

    ; Clear SAT buffer once to avoid stale sprite garbage in menus
    call clear_all_sprites

    ld hl, (gameflow_submenu_data_ptr)
    inc hl                        ; +1 cursor_sprite_idx
    ld a, (hl)
    cp #FF
    jr z, .sps_done               ; no sprite cursor configured

    ; Resolve pattern pointer from sprite asset index
    call submenu_get_cursor_pattern_ptr
    jr c, .sps_done               ; invalid index -> fallback to char marker
    push hl                       ; save pattern ptr

    ; Read and clamp layer count (+2)
    ld hl, (gameflow_submenu_data_ptr)
    ld bc, 2
    add hl, bc
    ld a, (hl)
    or a
    jr z, .sps_restore_no_cursor
    cp 5
    jr c, .sps_layer_ok
    ld a, 4
.sps_layer_ok:
    ld (gameflow_submenu_cursor_layer_count), a

    ; Upload all layers as one contiguous block.
    ; SPRITE_X_PATTERN points to layer0 data; layers are stored sequentially
    ; in ROM so layer_count * 32 bytes covers all of them.
    ; SPRPAT + (SUBMENU_CURSOR_BASE_SPRITE * 32) is an assembly-time constant
    ; (no 8-bit runtime overflow).
    pop hl                        ; HL = source pattern base (SPRITE_X_PATTERN)
    ld a, (gameflow_submenu_cursor_layer_count)
    add a, a                      ; *2
    add a, a                      ; *4
    add a, a                      ; *8
    add a, a                      ; *16
    add a, a                      ; *32  (layer_count <= 4, max 128 — fits in A)
    ld c, a
    ld b, 0                       ; BC = layer_count * 32
    ld de, SPRPAT + (SUBMENU_CURSOR_BASE_SPRITE * 32)
    call COPY_SPRITE_SRC_TO_VRAM

.sps_enable_cursor:

    ld a, 1
    ld (gameflow_submenu_cursor_enabled), a
    jr .sps_done

.sps_restore_no_cursor:
    pop hl

.sps_done:
    call submenu_update_cursor_sprite
    pop hl
    pop de
    pop bc
    ret

; ------------------------------------------------------------------
; submenu_update_cursor_sprite
; Draw or hide submenu cursor sprite according to current selection.
; ------------------------------------------------------------------
submenu_update_cursor_sprite:
    push bc
    push de
    push hl

    ld a, (gameflow_submenu_cursor_enabled)
    or a
    jr z, .sus_hide

    ; Compute cursor Y from selected option row (row = 10 + selection*2)
    ; Y = (10 + selection*2) * 8 - 4 to match PC preview placement.
    ld a, (gameflow_menu_selection)
    add a, a                      ; selection * 2
    add a, 10                     ; + 10 (start row)
    add a, a                      ; *2
    add a, a                      ; *4
    add a, a                      ; *8
    sub 4
    jr nc, .sus_y_ok
    xor a
.sus_y_ok:
    ld c, a                       ; C = Y (pixels)

    ; Resolve selected option pointer and centered text start column.
    ; Header layout (bg_screen_fn DW at +11-12, bg_screen_bank at +13):
    ; +18 = first option DW pointer
    ld hl, (gameflow_submenu_data_ptr)
    ld de, 18
    add hl, de
    ld a, (gameflow_menu_selection)
    add a, a                      ; *2 (DW stride)
    ld e, a
    ld d, 0
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ex de, hl                     ; HL = selected option string
    call submenu_compute_center_col

    ; X = (start_col * 8) - 16 (sprite width)
    add a, a                      ; *2
    add a, a                      ; *4
    add a, a                      ; *8
    sub 16
    jr nc, .sus_x_ok
    xor a
.sus_x_ok:
    ld b, a                       ; B = X (pixels)

    ; HL -> first cursor color byte (+7)
    ld hl, (gameflow_submenu_data_ptr)
    ld de, 7
    add hl, de

    ld a, (gameflow_submenu_cursor_layer_count)
    or a
    jr z, .sus_hide

    ld d, SUBMENU_CURSOR_BASE_SPRITE
.sus_draw_loop:
    push af                       ; [1] save remaining layer count
    ld e, (hl)                    ; E = color for this layer
    push hl                       ; [2] save color pointer
    push de                       ; [3] save D=sprite index, E=color
    ld a, d                       ; A = sprite index (for show_sprite param)
    push af                       ; [4] save A=sprite index
    add a, a
    add a, a
    ld d, a                       ; D = pattern = sprite_index * 4
    pop af                        ; [4] restore A=sprite index
    call show_sprite              ; A=index, B=X, C=Y, D=pattern, E=color
    pop de                        ; [3] restore D=sprite index (E=old color, ignore)
    inc d                         ; next sprite slot
    pop hl                        ; [2] restore color pointer
    inc hl                        ; advance to next layer color
    pop af                        ; [1] restore remaining layer count
    dec a
    jr nz, .sus_draw_loop

    ; Hide unused reserved cursor sprite slots
    ld a, (gameflow_submenu_cursor_layer_count)
    ld e, a
    ld a, SUBMENU_CURSOR_MAX_LAYERS
    sub e
    ld b, a                       ; B = remaining to hide
    ld a, SUBMENU_CURSOR_BASE_SPRITE
    add a, e
    ld d, a                       ; D = first unused sprite slot
    jr .sus_hide_remaining_check

.sus_hide_remaining:
    ld a, d
    call hide_sprite
    inc d
    djnz .sus_hide_remaining

.sus_hide_remaining_check:
    ld a, b
    or a
    jr nz, .sus_hide_remaining
    jr .sus_flush

.sus_hide:
    call submenu_hide_cursor_sprite
    jr .sus_done

.sus_flush:
    call update_sprites_to_vram

.sus_done:
    pop hl
    pop de
    pop bc
    ret

; ------------------------------------------------------------------
; submenu_hide_cursor_sprite
; Hide reserved cursor sprite slots.
; ------------------------------------------------------------------
submenu_hide_cursor_sprite:
    push bc
    push de

    ld d, SUBMENU_CURSOR_BASE_SPRITE
    ld b, SUBMENU_CURSOR_MAX_LAYERS
.shc_loop:
    ld a, d
    call hide_sprite
    inc d
    djnz .shc_loop
    call update_sprites_to_vram

    pop de
    pop bc
    ret

; ------------------------------------------------------------------
; submenu_get_cursor_pattern_ptr
; Input: A = sprite asset index
; Output: HL = SPRITE_<index>_PATTERN, CF=1 on invalid index
; ------------------------------------------------------------------
submenu_get_cursor_pattern_ptr:
    cp SUBMENU_CURSOR_PATTERN_COUNT
    jr nc, .sgcpp_invalid
    ld l, a
    ld h, 0
    add hl, hl
    ld de, submenu_cursor_sprite_pattern_table
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ex de, hl
    or a                          ; clear carry
    ret
.sgcpp_invalid:
    scf
    ret

; ------------------------------------------------------------------
; submenu_get_cursor_layer_source
; Input: A = sprite asset index, C = compact layer slot (0..3)
; Output: HL = source label, A = source bank, CF=1 on invalid/missing layer
; ------------------------------------------------------------------
submenu_get_cursor_layer_source:
    cp SUBMENU_CURSOR_PATTERN_COUNT
    jr nc, .sgcls_invalid
    ld b, a
    ld a, c
    cp 4
    jr nc, .sgcls_invalid

    ; Pattern pointer table offset = sprite_index * 8 + layer_slot * 2
    ld l, b
    ld h, 0
    add hl, hl                    ; *2
    add hl, hl                    ; *4
    add hl, hl                    ; *8
    ld a, c
    add a, a                      ; layer_slot * 2
    ld e, a
    ld d, 0
    add hl, de
    ld de, submenu_cursor_sprite_layer_pattern_table
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, d
    or e
    jr z, .sgcls_invalid
    ex de, hl

    ; Bank table offset = sprite_index * 4 + layer_slot
    ld l, b
    ld h, 0
    add hl, hl                    ; *2
    add hl, hl                    ; *4
    ld d, 0
    ld e, c
    add hl, de
    ld de, submenu_cursor_sprite_layer_bank_table
    add hl, de
    ld a, (hl)
    or a                          ; clear carry
    ret

.sgcls_invalid:
    scf
    ret

SUBMENU_CURSOR_BASE_SPRITE EQU 28
SUBMENU_CURSOR_MAX_LAYERS  EQU 4
SUBMENU_CURSOR_PATTERN_COUNT EQU 14

submenu_cursor_sprite_pattern_table:
    dw SPRITE_0_PATTERN
    dw SPRITE_1_PATTERN
    dw SPRITE_2_PATTERN
    dw SPRITE_3_PATTERN
    dw SPRITE_4_PATTERN
    dw SPRITE_5_PATTERN
    dw SPRITE_6_PATTERN
    dw SPRITE_7_PATTERN
    dw SPRITE_8_PATTERN
    dw SPRITE_9_PATTERN
    dw SPRITE_10_PATTERN
    dw SPRITE_11_PATTERN
    dw SPRITE_12_PATTERN
    dw SPRITE_13_PATTERN


submenu_cursor_sprite_layer_pattern_table:
    dw HERO_LEFT_0_F0_LAYER1
    dw HERO_LEFT_0_F0_LAYER2
    dw 0
    dw 0
    dw BIRD_1_F0_LAYER1
    dw 0
    dw 0
    dw 0
    dw BOT1_2_F0_LAYER1
    dw 0
    dw 0
    dw 0
    dw BOT2_RIGHT_3_F0_LAYER0
    dw 0
    dw 0
    dw 0
    dw HERO_DEAD_4_F0_LAYER1
    dw 0
    dw 0
    dw 0
    dw NEW_SPRITE_5_F0_LAYER1
    dw 0
    dw 0
    dw 0
    dw GEMA1_6_F0_LAYER2
    dw 0
    dw 0
    dw 0
    dw BOX_7_F0_LAYER1
    dw 0
    dw 0
    dw 0
    dw FIRE_8_F0_LAYER1
    dw 0
    dw 0
    dw 0
    dw FIRE2_LEFT_9_F0_LAYER1
    dw 0
    dw 0
    dw 0
    dw NEW_SPRITE_1_10_F0_LAYER1
    dw NEW_SPRITE_1_10_F0_LAYER3
    dw 0
    dw 0
    dw HERO_RIGHT_11_F0_LAYER1
    dw HERO_RIGHT_11_F0_LAYER2
    dw 0
    dw 0
    dw BOT2_LEFT_12_F0_LAYER0
    dw 0
    dw 0
    dw 0
    dw FIRE2_RIGHT_13_F0_LAYER1
    dw 0
    dw 0
    dw 0


submenu_cursor_sprite_layer_bank_table:
    db ((HERO_LEFT_0_F0_LAYER1 - #4000) / #2000)
    db ((HERO_LEFT_0_F0_LAYER2 - #4000) / #2000)
    db 0
    db 0
    db ((BIRD_1_F0_LAYER1 - #4000) / #2000)
    db 0
    db 0
    db 0
    db ((BOT1_2_F0_LAYER1 - #4000) / #2000)
    db 0
    db 0
    db 0
    db ((BOT2_RIGHT_3_F0_LAYER0 - #4000) / #2000)
    db 0
    db 0
    db 0
    db ((HERO_DEAD_4_F0_LAYER1 - #4000) / #2000)
    db 0
    db 0
    db 0
    db ((NEW_SPRITE_5_F0_LAYER1 - #4000) / #2000)
    db 0
    db 0
    db 0
    db ((GEMA1_6_F0_LAYER2 - #4000) / #2000)
    db 0
    db 0
    db 0
    db ((BOX_7_F0_LAYER1 - #4000) / #2000)
    db 0
    db 0
    db 0
    db ((FIRE_8_F0_LAYER1 - #4000) / #2000)
    db 0
    db 0
    db 0
    db ((FIRE2_LEFT_9_F0_LAYER1 - #4000) / #2000)
    db 0
    db 0
    db 0
    db ((NEW_SPRITE_1_10_F0_LAYER1 - #4000) / #2000)
    db ((NEW_SPRITE_1_10_F0_LAYER3 - #4000) / #2000)
    db 0
    db 0
    db ((HERO_RIGHT_11_F0_LAYER1 - #4000) / #2000)
    db ((HERO_RIGHT_11_F0_LAYER2 - #4000) / #2000)
    db 0
    db 0
    db ((BOT2_LEFT_12_F0_LAYER0 - #4000) / #2000)
    db 0
    db 0
    db 0
    db ((FIRE2_RIGHT_13_F0_LAYER1 - #4000) / #2000)
    db 0
    db 0
    db 0


; ------------------------------------------------------------------
; Shared helper: Print string to VRAM
; Input: HL = string pointer (null-terminated)
;        DE = VRAM destination
; ------------------------------------------------------------------
print_string_vram:
    push bc
    push de
    push hl

.psv_loop:
    ld a, (hl)                    ; Get character
    or a                          ; Check for null terminator
    jr z, .psv_done

    ; Write character to VRAM
    push hl
    push de
    ex de, hl                     ; HL = VRAM address (from DE)
    call FAST_WRTVRM              ; Write A to VRAM at HL (direct port)
    pop de
    pop hl

    inc hl                        ; Next character
    inc de                        ; Next VRAM position
    jr .psv_loop

.psv_done:
    pop hl
    pop de
    pop bc
    ret

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

; Shared data pointer for nodes without data
gameflow_no_data:
    db #C9                        ; RET instruction - returns immediately

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

    ; Frame sync first: start each tick exactly on V-Blank edge
    halt
    ; Poll input immediately after V-Blank edge so the hero uses
    ; the freshest input state in the same visible frame.
    call task_update_input
    call update_player_fastpath



    ; Handle world screen edge transitions (Preview parity)
    call check_world_screen_transition

    ; Update all entities
    call update_all_entities

    ; Refresh player deadly-tile state before state machines consume it.
    call refresh_player_deadly_fastpath

    ; Refresh player tile interactions without running bonus respawns twice.
    call refresh_player_tile_interaction_fastpath

    ; Run the player state machine before the generic SM sweep.
    call refresh_player_state_machine_fastpath

    ; Execute all state machines
    call execute_all_state_machines

    ; Update timed PSG sound effects
    call sfx_update

    ; Refresh player animation with the final state of this frame.
    call refresh_player_animation_fastpath

    ; Refresh player sprite once with the final state of this frame.
    call refresh_player_sprite_fastpath

    ; Upload sprites after gameplay so the hero position computed this frame
    ; is what gets shown on screen, instead of the previous frame's SAT.
    call update_sprites_to_vram

    ; Animated transform tiles do VRAM read-modify-write, so defer them until
    ; after hero/entity work to keep player response prioritized.
    call update_animated_tiles

    ; Sprite SAT upload runs once per frame, outside ISR.

    ; Loop
    jp gameflow_world_game_loop

; ==================================================================
; NODE DATA STRUCTURES
; Each node has: type byte, data pointer, connection table pointer
; ==================================================================

; Node: Start - "gf_start_1760724231672"
gameflow_node_gf_start_1760724231672:
    db NODE_TYPE_START
    dw gameflow_node_gf_start_1760724231672_data
    dw gameflow_node_gf_start_1760724231672_conn

gameflow_node_gf_start_1760724231672_data:
    dw gameflow_node_gf_start_1760724231672_init    ; Initialization routine address
    db ((gameflow_node_gf_start_1760724231672_init - #4000) / #2000)    ; Initialization routine bank

gameflow_node_gf_start_1760724231672_conn:
    db CONNECTION_DEFAULT
    dw gameflow_node_gfn_1762622270460
    db CONNECTION_END

; ------------------------------------------------------------------
; gameflow_node_gf_start_1760724231672_init
; Initialization routine for Start node
; Initializes global variables and MSX systems
; ------------------------------------------------------------------
gameflow_node_gf_start_1760724231672_init:
    ; === Core Game Systems Initialization (ALWAYS required) ===
    call init_game_systems

    ret

; Node: WorldLink - "gfn_1760724236721"
gameflow_node_gfn_1760724236721:
    db NODE_TYPE_WORLD_LINK
    dw gameflow_node_gfn_1760724236721_data
    dw gameflow_node_gfn_1760724236721_conn

gameflow_node_gfn_1760724236721_data:
    dw load_world_worldmap_1760724209990
    db ((load_world_worldmap_1760724209990 - #4000) / #2000)

gameflow_node_gfn_1760724236721_conn:
    db CONNECTION_DEFAULT
    dw gameflow_node_gfn_1760724243695
    db CONNECTION_END

; Node: Restart - "Game Over"
gameflow_node_gfn_1760724243695:
    db NODE_TYPE_RESTART
    dw gameflow_no_data
    dw gameflow_node_gfn_1760724243695_conn

gameflow_node_gfn_1760724243695_conn:
    db CONNECTION_DEFAULT
    dw 0
    db CONNECTION_END

; Node: Text - "TROLL'S CAVERNA"
gameflow_node_gfn_1761372692996:
    db NODE_TYPE_TEXT
    dw gameflow_node_gfn_1761372692996_data
    dw gameflow_node_gfn_1761372692996_conn

gameflow_node_gfn_1761372692996_data:
    DB 1                  ; Background color (MSX index from #000000)
    DW 0            ; Background screen load function (0=none)
    DB 0         ; Background screen load bank
    DB 5                  ; Number of lines
    DB 3, 8              ; Row 3, Col 8
    DW text_gfn_1761372692996_title          ; -> "TROLL'S CAVERNA"
    DB 7, 2              ; Row 7, Col 2
    DW text_gfn_1761372692996_msg0          ; -> "IN THE MIDDLE OF THE NIGHT,"
    DB 8, 3              ; Row 8, Col 3
    DW text_gfn_1761372692996_msg1          ; -> "A MISTERIOS METEROR SHOOT"
    DB 9, 7              ; Row 9, Col 7
    DW text_gfn_1761372692996_msg2          ; -> "INTO THE VILLAGE."
    DB 20, 5              ; Row 20, Col 5
    DW text_gfn_1761372692996_prompt          ; -> "PRESS FIRE TO CONTINUE"

text_gfn_1761372692996_title:
    DB "TROLL'S CAVERNA", 0
text_gfn_1761372692996_msg0:
    DB "IN THE MIDDLE OF THE NIGHT,", 0
text_gfn_1761372692996_msg1:
    DB "A MISTERIOS METEROR SHOOT", 0
text_gfn_1761372692996_msg2:
    DB "INTO THE VILLAGE.", 0
text_gfn_1761372692996_prompt:
    DB "PRESS FIRE TO CONTINUE", 0

gameflow_node_gfn_1761372692996_conn:
    db CONNECTION_DEFAULT
    dw gameflow_node_gfn_1762369379990
    db CONNECTION_END

; Node: Music - "gfn_1762369379990"
gameflow_node_gfn_1762369379990:
    db NODE_TYPE_MUSIC
    dw gameflow_node_gfn_1762369379990_data
    dw gameflow_node_gfn_1762369379990_conn

gameflow_node_gfn_1762369379990_data:
    db 255, 255, 1    ; command, track index, loop flag
    ; WARNING: Track "track_1762369178903" not found / not exportable as PSG

gameflow_node_gfn_1762369379990_conn:
    db CONNECTION_DEFAULT
    dw gameflow_node_gfn_1760724236721
    db CONNECTION_END

; Node: SubMenu - "HISTORY"
gameflow_node_gfn_1762622270460:
    db NODE_TYPE_SUB_MENU
    dw gameflow_node_gfn_1762622270460_data
    dw gameflow_node_gfn_1762622270460_conn

gameflow_node_gfn_1762622270460_data:
    db 1    ; Background color (MSX index)
    db 255    ; Cursor sprite asset index (#FF = use text marker)
    db 0    ; Cursor sprite layer count (max 4)
    db 0, 0, 0, 0    ; Cursor source layer offsets
    db 0, 0, 0, 0    ; Cursor layer colors
    dw 0    ; Background screen load function (0=none)
    db 0    ; Background screen load bank
    db 2    ; Number of options (max 6)
    db 0    ; Initial selected option
    dw submenu_gfn_1762622270460_title
    dw submenu_gfn_1762622270460_opt0
    dw submenu_gfn_1762622270460_opt1

submenu_gfn_1762622270460_title:
    db "HISTORY", 0
submenu_gfn_1762622270460_opt0:
    db "START GAME DEFAULTS", 0
submenu_gfn_1762622270460_opt1:
    db "CHOOSE", 0

gameflow_node_gfn_1762622270460_conn:
    db CONNECTION_OPTION_0
    dw gameflow_node_gfn_1761372692996
    db CONNECTION_OPTION_1
    dw gameflow_node_gfn_1762622410990
    db CONNECTION_END

; Node: Text - "Texto"
gameflow_node_gfn_1762622410990:
    db NODE_TYPE_TEXT
    dw gameflow_node_gfn_1762622410990_data
    dw gameflow_node_gfn_1762622410990_conn

gameflow_node_gfn_1762622410990_data:
    DB 1                  ; Background color (MSX index from #000000)
    DW 0            ; Background screen load function (0=none)
    DB 0         ; Background screen load bank
    DB 3                  ; Number of lines
    DB 3, 13              ; Row 3, Col 13
    DW text_gfn_1762622410990_title          ; -> "TEXTO"
    DB 7, 3              ; Row 7, Col 3
    DW text_gfn_1762622410990_msg0          ; -> "ESCRIBE TU MENSAJE AQUÍ..."
    DB 20, 5              ; Row 20, Col 5
    DW text_gfn_1762622410990_prompt          ; -> "PRESS FIRE TO CONTINUE"

text_gfn_1762622410990_title:
    DB "TEXTO", 0
text_gfn_1762622410990_msg0:
    DB "ESCRIBE TU MENSAJE AQUÍ...", 0
text_gfn_1762622410990_prompt:
    DB "PRESS FIRE TO CONTINUE", 0

gameflow_node_gfn_1762622410990_conn:
    db CONNECTION_DEFAULT
    dw gameflow_node_gfn_1762369379990
    db CONNECTION_END


; ==================================================================
; INITIALIZATION UTILITY FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; init_psg_silence
; Silence all PSG channels
; ------------------------------------------------------------------
init_psg_silence:
    push af
    push bc

    ; Silence channel A
    ld a, #08    ; Volume register channel A
    out (#A0), a
    ld a, 0      ; Volume = 0
    out (#A1), a

    ; Silence channel B
    ld a, #09    ; Volume register channel B
    out (#A0), a
    ld a, 0
    out (#A1), a

    ; Silence channel C
    ld a, #0A    ; Volume register channel C
    out (#A0), a
    ld a, 0
    out (#A1), a

    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; clear_sprite_table
; Clear sprite attribute table in VRAM
; ------------------------------------------------------------------
clear_sprite_table:
    push af
    push bc
    push de
    push hl

    ; Clear sprite attribute table (#1B00-#1B7F, 128 bytes)
    ld hl, #1B00         ; Sprite attribute table base
    ld bc, 128           ; 128 bytes (32 sprites × 4 bytes)
    ld a, #D1            ; Y=209 (off-screen)
.cst_loop:
    push af
    push bc
    push hl
    call WRTVRM          ; Write to VRAM
    pop hl
    pop bc
    pop af
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, .cst_loop

    pop hl
    pop de
    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; clear_vram_areas
; Clear VRAM pattern and color tables
; ------------------------------------------------------------------
clear_vram_areas:
    push af
    push bc
    push de
    push hl

    ; Clear pattern table (#0000-#17FF, 6144 bytes)
    ld hl, #0000
    ld bc, 6144
    ld a, 0
.clear_patterns:
    push af
    push bc
    push hl
    call WRTVRM
    pop hl
    pop bc
    pop af
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, .clear_patterns

    ; Clear color table (#2000-#37FF, 6144 bytes)
    ld hl, #2000
    ld bc, 6144
    ld a, #F0            ; White on black
.clear_colors:
    push af
    push bc
    push hl
    call WRTVRM
    pop hl
    pop bc
    pop af
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, .clear_colors

    pop hl
    pop de
    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; reset_vdp_registers
; Reset VDP registers to Screen 2 defaults
; ------------------------------------------------------------------
reset_vdp_registers:
    push af
    push bc

    ; Already configured in init_rom, this is a no-op for now
    ; Could be extended to reset specific registers if needed

    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; init_all_global_variables
; Initialize all global variables to their default values
; ------------------------------------------------------------------
init_all_global_variables:
    ret

; ==================================================================
; GAMEFLOW VARIABLES
; ==================================================================

; Runtime GameFlow variables are allocated in variables.asm (RAM EQUs):
; gameflow_exit_requested, gameflow_menu_selection,
; gameflow_submenu_data_ptr, gameflow_submenu_option_count,
; gameflow_submenu_cursor_enabled, gameflow_submenu_cursor_layer_count,
; gameflow_condition_result

; ==================================================================
; COMMON GAMEFLOW UTILITIES
; ==================================================================

; ------------------------------------------------------------------
; Helper: Clear screen area for menus/end screens
; ------------------------------------------------------------------
clear_screen_area:
    ; Clear center area of screen
    ld b, 8                       ; 8 rows
    ld c, 8                       ; Start at row 8

.csa_loop:
    push bc
    ld a, c
    call clear_screen_row
    pop bc
    inc c
    djnz .csa_loop
    ret

; ------------------------------------------------------------------
; Helper: Clear a screen row (fill with empty tile)
; Input: A = Row number (0-23)
; ------------------------------------------------------------------
clear_screen_row:
    push af
    push bc
    push de
    push hl

    ; Calculate row start in name table
    ; Row address = #1800 + (row * 32)
    ld l, a
    ld h, 0
    add hl, hl                    ; * 2
    add hl, hl                    ; * 4
    add hl, hl                    ; * 8
    add hl, hl                    ; * 16
    add hl, hl                    ; * 32

    ; Add base address (name table)
    ld de, #1800                  ; Name table base (Screen 2)
    add hl, de                    ; HL = VRAM address

    ; Clear 32 tiles (one row)
    ex de, hl                     ; DE = VRAM destination
    ld hl, empty_row_data         ; HL = source (32 zeros)
    ld bc, 32                     ; Copy 32 bytes
    call LDIRVM

    pop hl
    pop de
    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; Data: Empty row (32 zero bytes)
; ------------------------------------------------------------------
empty_row_data:
    db 0, 0, 0, 0, 0, 0, 0, 0
    db 0, 0, 0, 0, 0, 0, 0, 0
    db 0, 0, 0, 0, 0, 0, 0, 0
    db 0, 0, 0, 0, 0, 0, 0, 0

; ==================================================================
; END OF GAMEFLOW
; ==================================================================


; --- End of Bank 3 — pad to 8KB boundary ---
    ds #C000 - $, #FF

; ##################################################################
; BANK 4 — [#6000h-#8000h] PRIMARY: sound
; (Always mapped at boot: bank1→P1, bank2→P2, bank3→P3)
; ##################################################################
    org #6000

; ==================================================================
; PSG SOUND SYSTEM
; File: sound.asm
; Description: AY-3-8910 PSG control and sound effects
; Engine Audio Tick: IRQ task_manager
; ==================================================================

; ==================================================================
; PSG REGISTER ADDRESSES
; ==================================================================

; Tone Generators (Channels A, B, C)
PSG_TONE_A_LO       EQU 0        ; Channel A period low byte
PSG_TONE_A_HI       EQU 1        ; Channel A period high byte (4 bits)
PSG_TONE_B_LO       EQU 2        ; Channel B period low byte
PSG_TONE_B_HI       EQU 3        ; Channel B period high byte (4 bits)
PSG_TONE_C_LO       EQU 4        ; Channel C period low byte
PSG_TONE_C_HI       EQU 5        ; Channel C period high byte (4 bits)

; Noise Generator
PSG_NOISE_PERIOD    EQU 6        ; Noise period (5 bits)

; Mixer Control
PSG_MIXER           EQU 7        ; Mixer/Enable register
; Bit 0: Channel A tone enable (0=on, 1=off)
; Bit 1: Channel B tone enable
; Bit 2: Channel C tone enable
; Bit 3: Channel A noise enable (0=on, 1=off)
; Bit 4: Channel B noise enable
; Bit 5: Channel C noise enable

; Volume Control
PSG_VOL_A           EQU 8        ; Channel A volume (4 bits) + envelope flag (bit 4)
PSG_VOL_B           EQU 9        ; Channel B volume
PSG_VOL_C           EQU 10       ; Channel C volume

; Envelope Generator
PSG_ENV_LO          EQU 11       ; Envelope period low byte
PSG_ENV_HI          EQU 12       ; Envelope period high byte
PSG_ENV_SHAPE       EQU 13       ; Envelope shape (4 bits)

; ==================================================================
; PSG TONE PERIODS (Musical notes, octave 4, 3.579545 MHz clock)
; ==================================================================

; Note frequencies for octave 4 (middle C = C4)
NOTE_C4         EQU 477      ; C  - 261.63 Hz
NOTE_CS4        EQU 450      ; C# - 277.18 Hz
NOTE_D4         EQU 425      ; D  - 293.66 Hz
NOTE_DS4        EQU 401      ; D# - 311.13 Hz
NOTE_E4         EQU 379      ; E  - 329.63 Hz
NOTE_F4         EQU 357      ; F  - 349.23 Hz
NOTE_FS4        EQU 337      ; F# - 369.99 Hz
NOTE_G4         EQU 318      ; G  - 392.00 Hz
NOTE_GS4        EQU 300      ; G# - 415.30 Hz
NOTE_A4         EQU 284      ; A  - 440.00 Hz
NOTE_AS4        EQU 268      ; A# - 466.16 Hz
NOTE_B4         EQU 253      ; B  - 493.88 Hz
NOTE_C5         EQU 238      ; C5 - 523.25 Hz

; Octave multipliers: Divide period by 2 for +1 octave, multiply by 2 for -1 octave

; ==================================================================
; SOUND EFFECT DURATIONS (in frames, 60Hz)
; ==================================================================

SFX_SHORT           EQU 5        ; ~83ms
SFX_MEDIUM          EQU 15       ; ~250ms
SFX_LONG            EQU 30       ; ~500ms

; ==================================================================
; SOUND SYSTEM INITIALIZATION
; ==================================================================

init_sound_system:
    ; Initialize PSG via BIOS
    call GICINI

    ; Clear runtime sound state so power-on RAM garbage cannot make
    ; sfx_update / SM_UpdateSound drive the PSG for a few random frames.
    xor a
    ld (sfx_active), a
    ld (sfx_timer), a
    ld (sfx_fadeout), a
    ld (sm_sound_active), a
    ld (sm_sound_frames_left), a
    ld (sm_sound_ptr_l), a
    ld (sm_sound_ptr_h), a
    call music_init_system

    ; Silence all channels
    call sfx_silence_all

    ret

; ------------------------------------------------------------------
; task_audio_tick
; Shared audio tick wrapper for IRQ task_manager or HALT game loops.
; Preserves caller-visible registers on every exit path.
; ------------------------------------------------------------------
task_audio_tick:
    push af
    push bc
    push de
    push hl

    call music_update
    call SM_UpdateSound


    pop hl
    pop de
    pop bc
    pop af
    ret

; ==================================================================
; PSG LOW-LEVEL CONTROL FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; psg_write
; Write to PSG register via BIOS
; Input:  A = Register number (0-13)
;         E = Value to write
; Destroys: AF, E
; ------------------------------------------------------------------
psg_write:
    call WRTPSG
    ret

; ------------------------------------------------------------------
; psg_set_tone
; Set tone period for a channel
; Input:  A = Channel (0=A, 1=B, 2=C)
;         HL = Tone period (12-bit value)
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
psg_set_tone:
    ; Calculate register numbers (A*2 for low, A*2+1 for high)
    add a, a                     ; A = channel * 2
    ld c, a                      ; C = low register number
    inc a
    ld b, a                      ; B = high register number

    ; Write low byte
    ld a, c
    ld e, l
    call WRTPSG

    ; Write high byte (only lower 4 bits)
    ld a, b
    ld e, h
    ld a, e
    and #0F
    ld e, a
    ld a, b
    call WRTPSG

    ret

; ------------------------------------------------------------------
; psg_set_volume
; Set volume for a channel
; Input:  A = Channel (0=A, 1=B, 2=C)
;         B = Volume (0-15) or #10 to enable PSG hardware envelope
; Destroys: AF, E
; ------------------------------------------------------------------
psg_set_volume:
    add a, PSG_VOL_A             ; A = PSG_VOL_x register
    ld e, b                      ; E = volume value
    call WRTPSG
    ret

; ------------------------------------------------------------------
; psg_set_noise
; Set noise generator period
; Input:  A = Noise period (0-31)
; Destroys: AF, E
; ------------------------------------------------------------------
psg_set_noise:
    ld e, a
    ld a, PSG_NOISE_PERIOD
    call WRTPSG
    ret

; ------------------------------------------------------------------
; psg_set_mixer
; Set mixer control (enable/disable tone and noise)
; Input:  A = Mixer value
;         Bits 0-2: Tone off (0=on, 1=off) for channels A,B,C
;         Bits 3-5: Noise off (0=on, 1=off) for channels A,B,C
; Destroys: AF, E
; ------------------------------------------------------------------
psg_set_mixer:
    ld e, a
    ld a, PSG_MIXER
    call WRTPSG
    ret

; ------------------------------------------------------------------
; psg_set_envelope
; Program the global PSG hardware envelope generator
; Input:  HL = Envelope period
;         B = Envelope shape (0-15)
; Destroys: AF, E
; ------------------------------------------------------------------
psg_set_envelope:
    ld a, PSG_ENV_LO
    ld e, l
    call WRTPSG
    ld a, PSG_ENV_HI
    ld e, h
    call WRTPSG
    ld a, b
    and #0F
    ld e, a
    ld a, PSG_ENV_SHAPE
    call WRTPSG
    ret

; ==================================================================
; HIGH-LEVEL SOUND EFFECTS
; ==================================================================

; ------------------------------------------------------------------
; sfx_silence_all
; Silence all PSG channels
; ------------------------------------------------------------------
sfx_silence_all:
    ; Set all volumes to 0
    xor a                        ; A = channel A
    ld b, 0                      ; B = volume 0
    call psg_set_volume

    ld a, 1                      ; A = channel B
    ld b, 0
    call psg_set_volume

    ld a, 2                      ; A = channel C
    ld b, 0
    call psg_set_volume

    ; Disable all tone and noise
    ld a, #3F                    ; All tone and noise off
    call psg_set_mixer

    ret

; ------------------------------------------------------------------
; sfx_beep
; Simple beep sound
; ------------------------------------------------------------------
sfx_beep:
    ; Channel A: 440Hz (A4)
    xor a                        ; A = channel A
    ld hl, NOTE_A4
    call psg_set_tone

    ; Volume 12
    xor a
    ld b, 12
    call psg_set_volume

    ; Enable tone A only
    ld a, #3E                    ; Tone A on, others off
    call psg_set_mixer

    ret

; ------------------------------------------------------------------
; sfx_jump
; Jump sound effect (rising pitch)
; ------------------------------------------------------------------
sfx_jump:
    ; Channel A: Start at C4, quick rise
    xor a
    ld hl, NOTE_C4
    call psg_set_tone

    ; Volume 10
    xor a
    ld b, 10
    call psg_set_volume

    ; Enable tone A
    ld a, #3E
    call psg_set_mixer

    ; TODO: Add pitch sweep for realistic jump sound
    ret

; ------------------------------------------------------------------
; sfx_shoot
; Shooting sound (noise + low tone)
; ------------------------------------------------------------------
sfx_shoot:
    ; Channel A: Low tone
    xor a
    ld hl, 100                   ; Low period = high pitch
    call psg_set_tone

    ; Volume 8
    xor a
    ld b, 8
    call psg_set_volume

    ; Noise generator at period 5
    ld a, 5
    call psg_set_noise

    ; Enable tone A + noise A
    ld a, #36                    ; Tone A + Noise A on
    call psg_set_mixer

    ret

; ------------------------------------------------------------------
; sfx_explosion
; Explosion sound (noise-heavy)
; ------------------------------------------------------------------
sfx_explosion:
    ; Noise generator at period 10
    ld a, 10
    call psg_set_noise

    ; Channel A: Volume 15 (max) with noise
    xor a
    ld b, 15
    call psg_set_volume

    ; Enable noise A only (no tone)
    ld a, #39                    ; Noise A on, tone off
    call psg_set_mixer

    ret

; ------------------------------------------------------------------
; sfx_coin
; Coin/pickup sound (quick ascending notes)
; ------------------------------------------------------------------
sfx_coin:
    ; Channel B: E4 note
    ld a, 1                      ; Channel B
    ld hl, NOTE_E4
    call psg_set_tone

    ; Volume 10
    ld a, 1
    ld b, 10
    call psg_set_volume

    ; Enable tone B
    ld a, #3D                    ; Tone B on, others off
    call psg_set_mixer

    ; TODO: Quick ascend to G4 for classic coin sound
    ret

; ------------------------------------------------------------------
; sfx_damage
; Damage/hit sound (harsh noise)
; ------------------------------------------------------------------
sfx_damage:
    ; Short noise burst
    ld a, 3                      ; Harsh noise period
    call psg_set_noise

    ; Channel C: Volume 12
    ld a, 2                      ; Channel C
    ld b, 12
    call psg_set_volume

    ; Enable noise C only
    ld a, #1F                    ; Noise C on
    call psg_set_mixer

    ret

; ==================================================================
; SOUND EFFECT PLAYBACK SYSTEM
; ==================================================================
; This section provides a simple sound effect manager that can
; play effects with automatic duration and fadeout

; Runtime state lives in variables.asm:
;   sfx_active, sfx_timer, sfx_fadeout

; ------------------------------------------------------------------
; play_sound_effect
; Play one of the built-in sound effects by ID
; Input:  A = sound ID
;         0=beep, 1=jump, 2=shoot, 3=explosion, 4=coin, 5=damage
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
play_sound_effect:
    ld a, (music_active)
    or a
    ret nz
    cp 1
    jp z, play_sound_effect_jump
    cp 2
    jp z, play_sound_effect_shoot
    cp 3
    jp z, play_sound_effect_explosion
    cp 4
    jp z, play_sound_effect_coin
    cp 5
    jp z, play_sound_effect_damage

play_sound_effect_beep:
    ld hl, sfx_beep
    ld b, SFX_SHORT
    call sfx_play
    ret

play_sound_effect_jump:
    ld hl, sfx_jump
    ld b, SFX_SHORT
    call sfx_play
    ret

play_sound_effect_shoot:
    ld hl, sfx_shoot
    ld b, SFX_SHORT
    call sfx_play
    ret

play_sound_effect_explosion:
    ld hl, sfx_explosion
    ld b, SFX_MEDIUM
    call sfx_play
    ret

play_sound_effect_coin:
    ld hl, sfx_coin
    ld b, SFX_SHORT
    call sfx_play
    ret

play_sound_effect_damage:
    ld hl, sfx_damage
    ld b, SFX_SHORT
    call sfx_play
    ret

; ------------------------------------------------------------------
; sfx_play
; Play a sound effect with duration
; Input:  HL = Sound effect function address
;         B = Duration in frames
; ------------------------------------------------------------------
sfx_play:
    ld a, (music_active)
    or a
    ret nz
    ; Call the sound effect function
    push bc
    push hl
    ld de, .return_address
    push de
    jp (hl)                      ; Indirect call
.return_address:
    pop hl
    pop bc

    ; Set timer
    ld a, b
    ld (sfx_timer), a

    ; Mark as active
    ld a, 1
    ld (sfx_active), a

    ret

; ------------------------------------------------------------------
; sfx_update
; Update sound effect system (call every frame)
; Handles automatic fadeout and silence
; ------------------------------------------------------------------
sfx_update:
    ld a, (music_active)
    or a
    ret nz
    ; Check if sound is active
    ld a, (sfx_active)
    or a
    ret z                        ; No active sound

    ; Decrement timer
    ld a, (sfx_timer)
    or a
    jr z, .silence_now

    dec a
    ld (sfx_timer), a

    ; Check if entering fadeout zone (last 5 frames)
    cp 5
    ret nc                       ; Still in main sound

    ; TODO: Implement volume fadeout here
    ret

.silence_now:
    call sfx_silence_all
    xor a
    ld (sfx_active), a
    ret

; ==================================================================
; TRACKER MUSIC RUNTIME (Phase 1)
; Phase 1 plays row data and loop state in ROM; descriptor tables are
; serialized now for compatibility and future expansion.
; ==================================================================

MUSIC_TRACK_ORDER_TABLE     EQU 5
MUSIC_TRACK_PATTERN_TABLE   EQU 7
MUSIC_TRACK_INSTRUMENT_TABLE EQU 9
MUSIC_TRACK_NOISE_DEFAULT   EQU 15

; ------------------------------------------------------------------
; music_init_system
; Reset tracker runtime RAM and default PSG mixer shadow.
; Input:  None
; Output: music_active=0, music_muted=0, music_mixer_shadow=#3F
; Destroys: AF
; ------------------------------------------------------------------
music_init_system:
    xor a
    ld (music_active), a
    ld (music_muted), a
    ld (music_loop), a
    ld (music_track_index), a
    ld (music_row_frames), a
    ld (music_row_countdown), a
    ld (music_order_pos), a
    ld (music_pattern_index), a
    ld (music_pattern_row), a
    ld (music_pattern_rows), a
    ld (music_track_ptr_l), a
    ld (music_track_ptr_h), a
    ld (music_pattern_ptr_l), a
    ld (music_pattern_ptr_h), a
    ld a, #3F
    ld (music_mixer_shadow), a
    call music_reset_channel_state
    ret

music_reset_channel_state:
    ld a, #FF
    ld (music_ch_a_note), a
    ld (music_ch_b_note), a
    ld (music_ch_c_note), a
    xor a
    ld (music_ch_a_instrument), a
    ld (music_ch_b_instrument), a
    ld (music_ch_c_instrument), a
    ld (music_ch_a_ornament), a
    ld (music_ch_b_ornament), a
    ld (music_ch_c_ornament), a
    ld (music_ch_a_vol_step), a
    ld (music_ch_b_vol_step), a
    ld (music_ch_c_vol_step), a
    ld (music_ch_a_tone_step), a
    ld (music_ch_b_tone_step), a
    ld (music_ch_c_tone_step), a
    ld (music_ch_a_noise_step), a
    ld (music_ch_b_noise_step), a
    ld (music_ch_c_noise_step), a
    ld (music_ch_a_orn_step), a
    ld (music_ch_b_orn_step), a
    ld (music_ch_c_orn_step), a
    ld a, #0F
    ld (music_ch_a_volume), a
    ld (music_ch_b_volume), a
    ld (music_ch_c_volume), a
    ret

music_silence_channels:
    xor a
    ld b, 0
    call psg_set_volume
    ld a, 1
    ld b, 0
    call psg_set_volume
    ld a, 2
    ld b, 0
    call psg_set_volume
    ld a, #3F
    call psg_set_mixer
    ret

music_stop:
    push af
    call music_init_system
    call music_silence_channels
    pop af
    ret

music_mute:
    ld a, (music_active)
    or a
    ret z
    ld a, 1
    ld (music_muted), a
    call music_silence_channels
    ret

music_resume:
    ld a, (music_active)
    or a
    ret z
    xor a
    ld (music_muted), a
    call music_update_channel_effects
    ret

; ------------------------------------------------------------------
; music_execute_command
; Dispatch a compact music command stream used by Game Flow nodes.
; Input:  DE -> [command, trackIndex, loopFlag]
;         command: 0=stop, 1=play, 2=mute, 3=resume, #FF=no-op
; Output: Selected command executed, DE may advance while parsing
; Destroys: AF, BC (play path), DE (play path), HL (via callees)
; ------------------------------------------------------------------
music_execute_command:
    ld a, (de)
    cp #FF
    ret z
    or a
    jp z, music_stop
    cp 1
    jp z, .play_track
    cp 2
    jp z, music_mute
    cp 3
    jp z, music_resume
    ret
.play_track:
    inc de
    ld a, (de)
    ld c, a
    inc de
    ld a, (de)
    ld b, a
    ld a, c
    call music_play_track
    ret

music_load_track_pointer_from_index:
    add a, a
    ld e, a
    ld d, 0
    ld hl, music_track_ptr_table
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, e
    ld (music_track_ptr_l), a
    ld a, d
    ld (music_track_ptr_h), a
    ret

music_get_track_ptr:
    ld a, (music_track_ptr_l)
    ld l, a
    ld a, (music_track_ptr_h)
    ld h, a
    ret

music_get_track_header_ptr:
    ld e, a
    ld d, 0
    call music_get_track_ptr
    add hl, de
    ret

music_read_track_byte:
    call music_get_track_header_ptr
    ld a, (hl)
    ret

music_read_track_word:
    call music_get_track_header_ptr
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld h, d
    ld l, e
    ret

music_get_instrument_ptr:
    or a
    jr z, .no_instrument
    add a, a
    ld e, a
    ld d, 0
    ld a, MUSIC_TRACK_INSTRUMENT_TABLE
    call music_read_track_word
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld h, d
    ld l, e
    ret
.no_instrument:
    ld hl, 0
    ret

; ------------------------------------------------------------------
; music_get_channel_instrument_ptr
; Resolve current channel instrument pointer from the cached channel id.
; Input:  C = channel index (0=A, 1=B, 2=C)
; Output: HL = instrument descriptor or 0 when none is active
; Destroys: AF, DE, HL
; ------------------------------------------------------------------
music_get_channel_instrument_ptr:
    ld hl, music_ch_instrument_base
    call music_load_channel_byte
    call music_get_instrument_ptr
    ret

; ------------------------------------------------------------------
; music_channel_uses_hardware_env
; Check if the active instrument routes channel volume through PSG ENV.
; Input:  C = channel index (0=A, 1=B, 2=C)
; Output: A = 1 when PSG hardware envelope is enabled, else 0
; Destroys: AF, DE, HL
; ------------------------------------------------------------------
music_channel_uses_hardware_env:
    push hl
    call music_get_channel_instrument_ptr
    ld a, h
    or l
    jr z, music_channel_uses_hardware_env_no_hw_env
    ld a, (hl)
    and #04
    jr z, music_channel_uses_hardware_env_no_hw_env
    ld a, 1
    pop hl
    ret
music_channel_uses_hardware_env_no_hw_env:
    xor a
    pop hl
    ret

; ------------------------------------------------------------------
; music_trigger_channel_attack
; Hook kept for compatibility. The preview-style hardware envelope is
; emulated in software per channel, so new-note state is already reset
; by music_apply_channel_cell before this helper is called.
; Input:  C = channel index (0=A, 1=B, 2=C)
; Output: None
; Destroys: None
; ------------------------------------------------------------------
music_trigger_channel_attack:
    ret

; ------------------------------------------------------------------
; music_resolve_channel_volume
; Resolve per-frame channel volume.
; Current Phase 1 behavior:
; - emulates AY hardware envelope shapes in software when ayEnvelopeShape is set
; - falls back to music_ch_volume_base when no envelope data exists
; - applies a simple software volumeEnvelope when present
; Input:  C = channel index (0=A, 1=B, 2=C)
; Output: B = PSG volume 0-15
; Destroys: AF, DE, HL
; ------------------------------------------------------------------
music_resolve_channel_volume:
    push af
    push de
    push hl
    ld hl, music_ch_instrument_base
    call music_load_channel_byte
    or a
    jp z, .fallback_base
    call music_get_instrument_ptr
    ld a, h
    or l
    jp z, .fallback_base
    ld a, (hl)
    and #04
    jp nz, .hardware_env
.check_software_env:
    push hl
    ld de, 8
    add hl, de
    ld b, (hl)
    pop hl
    ld a, b
    or a
    jp z, .fallback_base
    push hl
    ld de, 6
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    pop hl
    push hl
    ld hl, music_ch_vol_step_base
    call music_load_channel_byte
    cp b
    jr c, .step_ok_restore
    pop hl
    push de
    push hl
    ld de, 9
    add hl, de
    ld a, (hl)
    pop hl
    pop de
    cp b
    jr c, .step_ok
    ld a, b
    push af
    ld hl, music_ch_vol_step_base
    call music_store_channel_byte
    pop af
    ld hl, music_ch_note_base
    ld a, #FF
    call music_store_channel_byte
    xor a
    ld b, a
    jp .mrcv_done
.step_ok_restore:
    pop hl
.step_ok:
    push af
    inc a
    cp b
    jr c, .next_step_ok
    push de
    push hl
    ld de, 9
    add hl, de
    ld a, (hl)
    pop hl
    pop de
    cp b
    jr c, .next_step_ok
    ld a, b
.next_step_ok:
    push de
    ld hl, music_ch_vol_step_base
    call music_store_channel_byte
    pop de
    pop af
    ld l, a
    ld h, 0
    add hl, de
    ld a, (hl)
    cp 16
    jr c, .env_volume_ok
    ld a, 15
.env_volume_ok:
    ld b, a
    jp .mrcv_done
.hardware_env:
    ld hl, music_ch_tone_step_base
    call music_load_channel_byte
    inc a
    cp 2
    jr c, .hw_store_counter
    xor a
    push af
    ld hl, music_ch_tone_step_base
    call music_store_channel_byte
    pop af
    ld hl, music_ch_vol_step_base
    call music_load_channel_byte
    cp 15
    jr nc, .hw_phase_ready
    inc a
    push af
    ld hl, music_ch_vol_step_base
    call music_store_channel_byte
    pop af
    jr .hw_phase_ready
.hw_store_counter:
    push af
    ld hl, music_ch_tone_step_base
    call music_store_channel_byte
    pop af
    ld hl, music_ch_vol_step_base
    call music_load_channel_byte
.hw_phase_ready:
    push af
    call music_get_channel_instrument_ptr
    ld a, h
    or l
    pop af
    jr z, .hw_decay
    push af
    inc hl
    inc hl
    ld a, (hl)
    and #04
    pop af
    jr z, .hw_decay
    ld b, a
    jp .mrcv_done
.hw_decay:
    ld e, a
    ld a, 15
    sub e
    ld b, a
    jp .mrcv_done
.fallback_base:
    ld hl, music_ch_volume_base
    call music_load_channel_byte
    ld b, a
.mrcv_done:
    pop hl
    pop de
    pop af
    ret

; ------------------------------------------------------------------
; music_resolve_channel_noise
; Resolve per-frame channel noise period, including the PT3-inspired
; software noise macro appended to the instrument descriptor.
; Input:  C = channel index (0=A, 1=B, 2=C)
; Output: A = PSG noise period 0-31
; Destroys: AF, DE, HL
; Preserves: Stack balance restored before return
; ------------------------------------------------------------------
music_resolve_channel_noise:
    push de
    push hl
    ld hl, music_ch_instrument_base
    call music_load_channel_byte
    or a
    jp z, .mrcn_track_default
    call music_get_instrument_ptr
    ld a, h
    or l
    jp z, .mrcn_track_default
    push hl
    ld de, 16
    add hl, de
    ld b, (hl)
    pop hl
    ld a, b
    or a
    jp z, .mrcn_static_noise
    push hl
    ld hl, music_ch_noise_step_base
    call music_load_channel_byte
    cp b
    jr c, .mrcn_step_ok
    ld a, b
    dec a
.mrcn_step_ok:
    push af
    pop af
    pop hl
    push af
    inc a
    cp b
    jr c, .mrcn_store_next
    push de
    ld de, 17
    add hl, de
    ld a, (hl)
    pop de
    cp b
    jr c, .mrcn_store_next
    ld a, b
    dec a
.mrcn_store_next:
    push hl
    push af
    ld hl, music_ch_noise_step_base
    call music_store_channel_byte
    pop af
    pop hl
    ld de, 14
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    pop af
    ld l, a
    ld h, 0
    add hl, de
    ld a, (hl)
    and #1F
    jp .mrcn_done
.mrcn_static_noise:
    push de
    ld de, 3
    add hl, de
    ld a, (hl)
    pop de
    and #1F
    jp .mrcn_done
.mrcn_track_default:
    ld a, MUSIC_TRACK_NOISE_DEFAULT
    call music_read_track_byte
    and #1F
.mrcn_done:
    pop hl
    pop de
    ret

; ------------------------------------------------------------------
; music_play_track
; Start a serialized PSG tracker song from ROM.
; Input:  A = track index in music_track_ptr_table
;         B bit 0 = loop enabled flag
; Output: music_active=1 and first row applied immediately
; Destroys: AF, BC, DE, HL
; Preserves: Stack balance restored on all exits
; ------------------------------------------------------------------
music_play_track:
    push bc
    push de
    push hl
    ld hl, music_track_count
    cp (hl)
    jp nc, .mpt_done
    ld (music_track_index), a
    call music_load_track_pointer_from_index
    ld a, b
    and 1
    ld (music_loop), a
    xor a
    ld (music_muted), a
    ld (music_order_pos), a
    ld (music_pattern_index), a
    ld (music_pattern_row), a
    ld a, 1
    ld (music_active), a
    call music_reset_channel_state
    call music_apply_row
.mpt_done:
    pop hl
    pop de
    pop bc
    ret

music_store_channel_byte:
    push de
    ld e, c
    ld d, 0
    add hl, de
    ld (hl), a
    pop de
    ret

music_load_channel_byte:
    push de
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    pop de
    ret

music_apply_channel_cell:
    ld c, a
    ld d, 0
    ld a, (hl)
    inc hl
    cp #FF
    jp z, .note_done
    cp #FE
    jp nz, .store_note
    ld a, #FF
    jr .store_note
.store_note:
    cp #FF
    jr z, .store_note_value
    ld d, 1
.store_note_value:
    push hl
    ld hl, music_ch_note_base
    call music_store_channel_byte
    xor a
    ld hl, music_ch_vol_step_base
    call music_store_channel_byte
    ld hl, music_ch_tone_step_base
    call music_store_channel_byte
    ld hl, music_ch_noise_step_base
    call music_store_channel_byte
    ld hl, music_ch_orn_step_base
    call music_store_channel_byte
    pop hl
.note_done:
    ld a, (hl)
    inc hl
    cp #FF
    jp z, .instrument_done
    push hl
    ld hl, music_ch_instrument_base
    call music_store_channel_byte
    pop hl
.instrument_done:
    ld a, (hl)
    inc hl
    cp #FF
    jp z, .ornament_done
    push hl
    ld hl, music_ch_ornament_base
    call music_store_channel_byte
    pop hl
.ornament_done:
    ld a, (hl)
    inc hl
    cp #FF
    jr z, .maybe_trigger_attack
    push hl
    ld hl, music_ch_volume_base
    call music_store_channel_byte
    pop hl
.maybe_trigger_attack:
    ld a, d
    or a
    ret z
    push hl
    call music_trigger_channel_attack
    pop hl
    ret

; ------------------------------------------------------------------
; music_apply_row
; Decode current order/pattern row and cache channel state for A/B/C.
; Input:  Runtime variables select track/order/pattern position
; Output: Channel note/instrument/volume caches updated
;         Row countdown reloaded and PSG refreshed once
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
music_apply_row:
    ld a, MUSIC_TRACK_ORDER_TABLE
    call music_read_track_word
    ld a, (music_order_pos)
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
    ld (music_pattern_index), a
    ld a, MUSIC_TRACK_PATTERN_TABLE
    call music_read_track_word
    ld a, (music_pattern_index)
    ld e, a
    ld d, 0
    add hl, de
    add hl, de
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld a, (hl)
    ld (music_pattern_rows), a
    ld a, e
    ld (music_pattern_ptr_l), a
    ld a, d
    ld (music_pattern_ptr_h), a
    ld h, d
    ld l, e
    ld a, (music_pattern_row)
    or a
    jp z, .row_ptr_ready
    ld b, a
.row_offset_loop:
    ld de, 12
    add hl, de
    djnz .row_offset_loop
.row_ptr_ready:
    xor a
    call music_apply_channel_cell
    ld a, 1
    call music_apply_channel_cell
    ld a, 2
    call music_apply_channel_cell
    ld a, (music_pattern_row)
    inc a
    ld d, a
    ld a, (music_pattern_rows)
    cp d
    jp z, .advance_order
    jp c, .advance_order
    ld a, d
    ld (music_pattern_row), a
    jp .row_done
.advance_order:
    xor a
    ld (music_pattern_row), a
    ld a, (music_order_pos)
    inc a
    ld d, a
    ld a, 1
    call music_read_track_byte
    cp d
    jp z, .end_of_order
    jp c, .end_of_order
    ld a, d
    ld (music_order_pos), a
    jp .row_done
.end_of_order:
    ld a, (music_loop)
    or a
    jp z, music_stop
    ld a, 2
    call music_read_track_byte
    ld (music_order_pos), a
.row_done:
    xor a
    call music_read_track_byte
    ld (music_row_frames), a
    ld (music_row_countdown), a
    call music_update_channel_effects
    ret

; ------------------------------------------------------------------
; music_update
; Advance the tracker once per game frame.
; Input:  None
; Output: Current channel PSG state refreshed; next row applied when due
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
music_update:
    ld a, (music_active)
    or a
    ret z
    ld a, (music_muted)
    or a
    ret nz
    call music_update_channel_effects
    ld a, (music_row_countdown)
    or a
    jp z, music_apply_row
    dec a
    ld (music_row_countdown), a
    ret nz
    call music_apply_row
    ret

; ------------------------------------------------------------------
; music_update_channel_effects
; Rebuild mixer bits and push current cached channel state to PSG.
; Input:  music_ch_* caches already populated
; Output: PSG tone/volume registers updated for channels A/B/C
;         music_mixer_shadow rewritten with current enable bits
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
music_update_channel_effects:
    ld a, #3F
    ld (music_mixer_shadow), a
    ld c, 0
    call music_update_one_channel
    ld c, 1
    call music_update_one_channel
    ld c, 2
    call music_update_one_channel
    ld a, (music_mixer_shadow)
    call psg_set_mixer
    ret

; ------------------------------------------------------------------
; music_update_one_channel
; Apply one cached channel to PSG and update the mixer shadow bits.
; Input:  C = channel index (0=A, 1=B, 2=C)
; Output: Channel PSG tone/volume updated or silenced
;         music_mixer_shadow updated for that channel
; Destroys: AF, BC, DE, HL
; Preserves: Stack balance restored before return
; ------------------------------------------------------------------
music_update_one_channel:
    push bc
    push de
    push hl
    ld hl, music_ch_note_base
    call music_load_channel_byte
    cp #FF
    jp z, .silent_channel
    add a, a
    ld e, a
    ld d, 0
    ld hl, music_note_period_table
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld h, d
    ld l, e
    ld a, c
    push bc
    call psg_set_tone
    pop bc
    call music_resolve_channel_volume
    ld a, c
    push bc
    call psg_set_volume
    pop bc
    ld d, 1
    ld e, 0
    call music_get_channel_instrument_ptr
    ld a, h
    or l
    jr z, .apply_mixer_bits
    ld a, (hl)
    and #01
    ld d, a
    ld a, (hl)
    and #02
    srl a
    ld e, a
    ld a, e
    or a
    jr z, .apply_mixer_bits
    push de
    call music_resolve_channel_noise
    call psg_set_noise
    pop de
.apply_mixer_bits:
    ld a, (music_mixer_shadow)
    ld b, a
    ld a, c
    cp 1
    jp z, .enable_b
    cp 2
    jp z, .enable_c
    ld a, b
    bit 0, d
    jr z, .a_tone_off
    and #3E
    jr .a_noise_gate
.a_tone_off:
    or #01
.a_noise_gate:
    bit 0, e
    jr z, .a_noise_off
    and #37
    jp .store_mixer
.a_noise_off:
    or #08
    jp .store_mixer
.enable_b:
    ld a, b
    bit 0, d
    jr z, .b_tone_off
    and #3D
    jr .b_noise_gate
.b_tone_off:
    or #02
.b_noise_gate:
    bit 0, e
    jr z, .b_noise_off
    and #2F
    jp .store_mixer
.b_noise_off:
    or #10
    jp .store_mixer
.enable_c:
    ld a, b
    bit 0, d
    jr z, .c_tone_off
    and #3B
    jr .c_noise_gate
.c_tone_off:
    or #04
.c_noise_gate:
    bit 0, e
    jr z, .c_noise_off
    and #1F
    jp .store_mixer
.c_noise_off:
    or #20
    jp .store_mixer
.silent_channel:
    ld b, 0
    ld a, c
    push bc
    call psg_set_volume
    pop bc
    ld a, (music_mixer_shadow)
    ld b, a
    ld a, c
    cp 1
    jp z, .disable_b
    cp 2
    jp z, .disable_c
    ld a, b
    or #09
    jp .store_mixer
.disable_b:
    ld a, b
    or #12
    jp .store_mixer
.disable_c:
    ld a, b
    or #24
.store_mixer:
    ld (music_mixer_shadow), a
    pop hl
    pop de
    pop bc
    ret

music_note_period_table:
    DW #1AB9,#1939,#17CF,#1679,#1536,#1405,#12E5,#11D6
    DW #10D6,#0FE4,#0EFF,#0E28,#0D5C,#0C9D,#0BE7,#0B3C
    DW #0A9B,#0A02,#0973,#08EB,#086B,#07F2,#0780,#0714
    DW #06AE,#064E,#05F4,#059E,#054D,#0501,#04B9,#0475
    DW #0435,#03F9,#03C0,#038A,#0357,#0327,#02FA,#02CF
    DW #02A7,#0281,#025D,#023B,#021B,#01FC,#01E0,#01C5
    DW #01AC,#0194,#017D,#0168,#0153,#0140,#012E,#011D
    DW #010D,#00FE,#00F0,#00E2,#00D6,#00CA,#00BE,#00B4
    DW #00AA,#00A0,#0097,#008F,#0087,#007F,#0078,#0071
    DW #006B,#0065,#005F,#005A,#0055,#0050,#004C,#0047
    DW #0043,#0040,#003C,#0039,#0035,#0032,#0030,#002D
    DW #002A,#0028,#0026,#0024,#0022,#0020,#001E,#001C

music_track_count:
    DB #01

music_track_ptr_table:
    DW music_track_0_Oda1_data

; ------------------------------------------------------------------
; Tracker Song 0: Oda1
; ------------------------------------------------------------------
music_track_0_Oda1_data:
    DB #03
    DB #02
    DB #00
    DB #01
    DB #02
    DW music_track_0_Oda1_order_table
    DW music_track_0_Oda1_pattern_table
    DW music_track_0_Oda1_instrument_ptr_table
    DW music_track_0_Oda1_ornament_ptr_table
    DW #5208
    DB #10

music_track_0_Oda1_order_table:
    DB #00,#01

music_track_0_Oda1_pattern_table:
    DW music_track_0_Oda1_pattern_0_rows
    DB #40
    DW music_track_0_Oda1_pattern_1_rows
    DB #40

music_track_0_Oda1_instrument_ptr_table:
    DW 0
    DW music_track_0_Oda1_inst_1
    DW music_track_0_Oda1_inst_2
    DW music_track_0_Oda1_inst_3
    DW music_track_0_Oda1_inst_4
    DW music_track_0_Oda1_inst_5
    DW music_track_0_Oda1_inst_6
    DW music_track_0_Oda1_inst_7
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0

music_track_0_Oda1_ornament_ptr_table:
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0

music_track_0_Oda1_pattern_0_rows:
    DB #34,#05,#FF,#0F,#24,#01,#FF,#0C,#3C,#03,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #34,#05,#FF,#0F,#24,#01,#FF,#0C,#FF,#00,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #36,#05,#FF,#0F,#24,#01,#FF,#0C,#3C,#02,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #37,#05,#FF,#0F,#24,#01,#FF,#0C,#FF,#00,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #37,#05,#FF,#0F,#1F,#01,#FF,#0C,#3C,#04,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #36,#05,#FF,#0F,#1F,#01,#FF,#0C,#FF,#00,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #34,#05,#FF,#0F,#1F,#01,#FF,#0C,#3C,#02,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #32,#05,#FF,#0F,#1F,#01,#FF,#0C,#FF,#00,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #30,#05,#FF,#0F,#24,#01,#FF,#0C,#3C,#03,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #30,#05,#FF,#0F,#24,#01,#FF,#0C,#FF,#00,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #32,#05,#FF,#0F,#24,#01,#FF,#0C,#3C,#02,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #34,#05,#FF,#0F,#24,#01,#FF,#0C,#FF,#00,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #34,#05,#FF,#0F,#1F,#01,#FF,#0C,#3C,#04,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #32,#05,#FF,#0F,#1F,#01,#FF,#0C,#FF,#00,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #32,#05,#FF,#0F,#1F,#01,#FF,#0C,#3C,#02,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #32,#05,#FF,#0F,#1F,#01,#FF,#0C,#3C,#02,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF

music_track_0_Oda1_pattern_1_rows:
    DB #34,#06,#FF,#0F,#24,#01,#FF,#0C,#3C,#03,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #34,#06,#FF,#0F,#24,#01,#FF,#0C,#FF,#00,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #36,#06,#FF,#0F,#24,#01,#FF,#0C,#3C,#02,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #37,#06,#FF,#0F,#24,#01,#FF,#0C,#FF,#00,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #37,#06,#FF,#0F,#1F,#01,#FF,#0C,#3C,#04,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #36,#06,#FF,#0F,#1F,#01,#FF,#0C,#FF,#00,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #34,#06,#FF,#0F,#1F,#01,#FF,#0C,#3C,#02,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #32,#06,#FF,#0F,#1F,#01,#FF,#0C,#FF,#00,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #30,#06,#FF,#0F,#24,#01,#FF,#0C,#3C,#03,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #30,#06,#FF,#0F,#24,#01,#FF,#0C,#FF,#00,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #32,#06,#FF,#0F,#24,#01,#FF,#0C,#3C,#02,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #34,#06,#FF,#0F,#24,#01,#FF,#0C,#FF,#00,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #32,#06,#FF,#0F,#24,#01,#FF,#0C,#3C,#04,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #30,#06,#FF,#0F,#24,#01,#FF,#0C,#3C,#02,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #30,#06,#FF,#0F,#24,#01,#FF,#0C,#3C,#02,#FF,#0A
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #30,#06,#FF,#0F,#24,#01,#FF,#0C,#FE,#00,#FF,#00
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF

music_track_0_Oda1_inst_1:
    DB #05
    DB #00
    DB #09
    DB #10
    DW #5208
    DW music_track_0_Oda1_inst_1_vol_env
    DB #07
    DB #03
    DW music_track_0_Oda1_inst_1_tone_env
    DB #01
    DB #FF
    DW 0
    DB #00
    DB #FF
music_track_0_Oda1_inst_1_vol_env:
    DB #00,#06,#0C,#0F,#0D,#0C,#09
music_track_0_Oda1_inst_1_tone_env:
    DB #00

music_track_0_Oda1_inst_2:
    DB #06
    DB #0F
    DB #00
    DB #10
    DW #5208
    DW music_track_0_Oda1_inst_2_vol_env
    DB #06
    DB #FF
    DW music_track_0_Oda1_inst_2_tone_env
    DB #01
    DB #FF
    DW 0
    DB #00
    DB #FF
music_track_0_Oda1_inst_2_vol_env:
    DB #0F,#0C,#09,#05,#02,#00
music_track_0_Oda1_inst_2_tone_env:
    DB #00

music_track_0_Oda1_inst_3:
    DB #05
    DB #0F
    DB #00
    DB #10
    DW #5208
    DW music_track_0_Oda1_inst_3_vol_env
    DB #06
    DB #FF
    DW music_track_0_Oda1_inst_3_tone_env
    DB #0B
    DB #FF
    DW 0
    DB #00
    DB #FF
music_track_0_Oda1_inst_3_vol_env:
    DB #0F,#0B,#08,#06,#02,#00
music_track_0_Oda1_inst_3_tone_env:
    DB #0A,#09,#08,#07,#06,#05,#04,#03,#02,#01,#00

music_track_0_Oda1_inst_4:
    DB #06
    DB #09
    DB #00
    DB #10
    DW #5208
    DW music_track_0_Oda1_inst_4_vol_env
    DB #06
    DB #FF
    DW music_track_0_Oda1_inst_4_tone_env
    DB #01
    DB #FF
    DW 0
    DB #00
    DB #FF
music_track_0_Oda1_inst_4_vol_env:
    DB #09,#08,#07,#05,#02,#00
music_track_0_Oda1_inst_4_tone_env:
    DB #00

music_track_0_Oda1_inst_5:
    DB #05
    DB #00
    DB #0B
    DB #10
    DW #5208
    DW music_track_0_Oda1_inst_5_vol_env
    DB #07
    DB #02
    DW music_track_0_Oda1_inst_5_tone_env
    DB #08
    DB #00
    DW 0
    DB #00
    DB #FF
music_track_0_Oda1_inst_5_vol_env:
    DB #00,#04,#09,#0F,#0D,#0C,#0B
music_track_0_Oda1_inst_5_tone_env:
    DB #00,#01,#02,#01,#00,#FF,#FE,#FF

music_track_0_Oda1_inst_6:
    DB #05
    DB #0C
    DB #0D
    DB #10
    DW #5208
    DW music_track_0_Oda1_inst_6_vol_env
    DB #08
    DB #00
    DW music_track_0_Oda1_inst_6_tone_env
    DB #07
    DB #00
    DW 0
    DB #00
    DB #FF
music_track_0_Oda1_inst_6_vol_env:
    DB #0C,#0F,#0C,#0B,#0C,#0F,#0B,#09
music_track_0_Oda1_inst_6_tone_env:
    DB #00,#04,#07,#0C,#07,#04,#00

music_track_0_Oda1_inst_7:
    DB #05
    DB #00
    DB #0C
    DB #10
    DW #5208
    DW music_track_0_Oda1_inst_7_vol_env
    DB #0A
    DB #04
    DW music_track_0_Oda1_inst_7_tone_env
    DB #08
    DB #00
    DW 0
    DB #00
    DB #FF
music_track_0_Oda1_inst_7_vol_env:
    DB #00,#05,#09,#0E,#0F,#0C,#0B,#09,#08,#07
music_track_0_Oda1_inst_7_tone_env:
    DB #00,#00,#01,#01,#00,#00,#01,#01


; ==================================================================
; END OF PSG SOUND SYSTEM
; ==================================================================


; --- End of Bank 4 — pad to 8KB boundary ---
    ds #8000 - $, #FF

; ##################################################################
; BANK 5 — [#8000h-#A000h] PRIMARY: sprites
; (Always mapped at boot: bank1→P1, bank2→P2, bank3→P3)
; ##################################################################
    org #8000

; ==================================================================
; SPRITE DATA
; File: sprites.asm
; Description: Sprite pattern and animation data
; Entities: 14
; Total Hardware Sprites (Layers): 32
; SAT Upload Sprites per frame: 18
; Sprite Pattern Preload Mode: STATIC_ALL_FRAMES
; Runtime Sprite Pattern Packs: 1
; ==================================================================

; ==================================================================
; SPRITE PATTERN DATA
; ==================================================================

; Sprite Asset 0: hero_left
;; Sprite: hero_left
;; Total Frames: 4
;; Size: 16x16
;; Background Color (not exported as a layer): rgba(0,0,0,0)
;; Drawable Palette (Hex): C0=#000000, C1=#FFFFFF, C2=#42EBF5, C3=#00FF00

SPRITE_HERO_LEFT_0_WIDTH     EQU 16
SPRITE_HERO_LEFT_0_HEIGHT    EQU 16
SPRITE_HERO_LEFT_0_FRAMES    EQU 4

;; ---- Sprite Frame: hero_left_0_F0 ----
;; Size: 16x16
HERO_LEFT_0_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#03,#1F,#3B,#71,#FB,#DF,#87,#8F,#07,#00,#00,#00,#00,#03
    DB #00,#00,#80,#F8,#D4,#EB,#DD,#F2,#E0,#E0,#C0,#00,#00,#80,#80,#80

HERO_LEFT_0_F0_LAYER2: ; Brush Color Index 2 (Actual Color: #42EBF5)
    DB #03,#1F,#20,#00,#00,#00,#00,#00,#00,#00,#00,#03,#03,#00,#00,#00
    DB #C0,#E0,#70,#00,#00,#00,#00,#00,#00,#00,#00,#C0,#C0,#00,#00,#00

;; ---- End of Frame: hero_left_0_F0 ----

;; ---- Sprite Frame: hero_left_0_F1 ----
;; Size: 16x16
HERO_LEFT_0_F1_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#03,#1F,#3B,#71,#FB,#DF,#87,#8F,#07,#00,#04,#08,#08,#18
    DB #00,#00,#80,#F8,#D4,#EB,#DD,#F2,#E0,#E0,#C0,#00,#20,#10,#08,#18

HERO_LEFT_0_F1_LAYER2: ; Brush Color Index 2 (Actual Color: #42EBF5)
    DB #03,#1F,#20,#00,#00,#00,#00,#00,#00,#00,#00,#03,#03,#00,#00,#00
    DB #C0,#E0,#70,#00,#00,#00,#00,#00,#00,#00,#00,#C0,#C0,#00,#00,#00

;; ---- End of Frame: hero_left_0_F1 ----

;; ---- Sprite Frame: hero_left_0_F2 ----
;; Size: 16x16
HERO_LEFT_0_F2_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#00,#03,#1F,#3B,#71,#FB,#DF,#87,#80,#18,#10,#10,#10,#30
    DB #00,#00,#00,#80,#D8,#EC,#D2,#ED,#F2,#E1,#00,#00,#3F,#01,#00,#00

HERO_LEFT_0_F2_LAYER2: ; Brush Color Index 2 (Actual Color: #42EBF5)
    DB #00,#03,#1F,#20,#00,#00,#00,#00,#00,#00,#07,#07,#00,#00,#00,#00
    DB #00,#C0,#E0,#70,#00,#00,#00,#00,#00,#00,#E0,#E0,#00,#00,#00,#00

;; ---- End of Frame: hero_left_0_F2 ----

;; ---- Sprite Frame: hero_left_0_F3 ----
;; Size: 16x16
HERO_LEFT_0_F3_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#03,#1F,#3B,#71,#FB,#DF,#87,#80,#00,#04,#04,#04,#04,#0C
    DB #00,#00,#80,#D8,#EC,#D2,#ED,#F2,#E0,#00,#1F,#01,#00,#00,#00,#00

HERO_LEFT_0_F3_LAYER2: ; Brush Color Index 2 (Actual Color: #42EBF5)
    DB #03,#1F,#20,#00,#00,#00,#00,#00,#00,#07,#07,#00,#00,#00,#00,#00
    DB #C0,#E0,#70,#00,#00,#00,#00,#00,#00,#E0,#E0,#00,#00,#00,#00,#00

;; ---- End of Frame: hero_left_0_F3 ----


; Unified pattern label for sprite 0
SPRITE_0_PATTERN EQU HERO_LEFT_0_F0_LAYER1
SPRITE_0_PATTERN_BANK EQU ((SPRITE_0_PATTERN - #4000) / #2000)

; Sprite Asset 1: bird
;; Sprite: bird
;; Total Frames: 4
;; Size: 16x16
;; Background Color (not exported as a layer): rgba(0,0,0,0)
;; Drawable Palette (Hex): C0=#000000, C1=#FFFFFF, C2=#FF0000, C3=#00FF00

SPRITE_BIRD_1_WIDTH     EQU 16
SPRITE_BIRD_1_HEIGHT    EQU 16
SPRITE_BIRD_1_FRAMES    EQU 4

;; ---- Sprite Frame: bird_1_F0 ----
;; Size: 16x16
BIRD_1_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#00,#00,#00,#00,#1E,#21,#01,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#F0,#08,#00,#00,#00,#00,#00,#00,#00,#00

;; ---- End of Frame: bird_1_F0 ----

;; ---- Sprite Frame: bird_1_F1 ----
;; Size: 16x16
BIRD_1_F1_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#00,#00,#00,#00,#0E,#11,#21,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#E0,#10,#08,#00,#00,#00,#00,#00,#00,#00

;; ---- End of Frame: bird_1_F1 ----

;; ---- Sprite Frame: bird_1_F2 ----
;; Size: 16x16
BIRD_1_F2_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#00,#00,#00,#06,#09,#11,#10,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#C0,#20,#10,#10,#00,#00,#00,#00,#00,#00,#00

;; ---- End of Frame: bird_1_F2 ----

;; ---- Sprite Frame: bird_1_F3 ----
;; Size: 16x16
BIRD_1_F3_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#00,#00,#00,#06,#09,#11,#10,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#C0,#20,#10,#10,#00,#00,#00,#00,#00,#00,#00

;; ---- End of Frame: bird_1_F3 ----


; Unified pattern label for sprite 1
SPRITE_1_PATTERN EQU BIRD_1_F0_LAYER1
SPRITE_1_PATTERN_BANK EQU ((SPRITE_1_PATTERN - #4000) / #2000)

; Sprite Asset 2: bot1
;; Sprite: bot1
;; Total Frames: 1
;; Size: 16x16
;; Background Color (not exported as a layer): #000000
;; Drawable Palette (Hex): C0=#000000, C1=#FFFFFF, C2=#FF0000, C3=#00FF00

SPRITE_BOT1_2_WIDTH     EQU 16
SPRITE_BOT1_2_HEIGHT    EQU 16
SPRITE_BOT1_2_FRAMES    EQU 1

;; ---- Sprite Frame: bot1_2_F0 ----
;; Size: 16x16
BOT1_2_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF

;; ---- End of Frame: bot1_2_F0 ----


; Unified pattern label for sprite 2
SPRITE_2_PATTERN EQU BOT1_2_F0_LAYER1
SPRITE_2_PATTERN_BANK EQU ((SPRITE_2_PATTERN - #4000) / #2000)

; Sprite Asset 3: bot2_right
;; Sprite: bot2_right
;; Total Frames: 2
;; Size: 16x16
;; Background Color (not exported as a layer): rgba(0,0,0,0)
;; Drawable Palette (Hex): C0=#FFFFFF, C1=#000000, C2=#3EB847, C3=#74D07D

SPRITE_BOT2_RIGHT_3_WIDTH     EQU 16
SPRITE_BOT2_RIGHT_3_HEIGHT    EQU 16
SPRITE_BOT2_RIGHT_3_FRAMES    EQU 2

;; ---- Sprite Frame: bot2_right_3_F0 ----
;; Size: 16x16
BOT2_RIGHT_3_F0_LAYER0: ; Brush Color Index 0 (Actual Color: #FFFFFF)
    DB #1F,#7F,#CF,#8F,#07,#00,#2F,#6F,#6F,#6F,#00,#0C,#FC,#FC,#C0,#C0
    DB #E0,#B0,#B0,#F0,#E0,#00,#F0,#BD,#BD,#F0,#00,#1C,#1C,#07,#07,#07

;; ---- End of Frame: bot2_right_3_F0 ----

;; ---- Sprite Frame: bot2_right_3_F1 ----
;; Size: 16x16
BOT2_RIGHT_3_F1_LAYER0: ; Brush Color Index 0 (Actual Color: #FFFFFF)
    DB #1F,#FF,#CF,#0F,#07,#00,#2F,#6F,#6F,#6E,#00,#01,#01,#01,#01,#01
    DB #E0,#B0,#B0,#F0,#E0,#00,#F0,#F0,#F0,#70,#00,#80,#80,#80,#E0,#E0

;; ---- End of Frame: bot2_right_3_F1 ----


; Unified pattern label for sprite 3
SPRITE_3_PATTERN EQU BOT2_RIGHT_3_F0_LAYER0
SPRITE_3_PATTERN_BANK EQU ((SPRITE_3_PATTERN - #4000) / #2000)

; Sprite Asset 4: hero_dead
;; Sprite: hero_dead
;; Total Frames: 14
;; Size: 16x16
;; Background Color (not exported as a layer): rgba(0,0,0,0)
;; Drawable Palette (Hex): C0=#000000, C1=#FFFFFF, C2=#FF0000, C3=#00FF00

SPRITE_HERO_DEAD_4_WIDTH     EQU 16
SPRITE_HERO_DEAD_4_HEIGHT    EQU 16
SPRITE_HERO_DEAD_4_FRAMES    EQU 14

;; ---- Sprite Frame: hero_dead_4_F0 ----
;; Size: 16x16
HERO_DEAD_4_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#03,#5F,#2B,#5B,#2F,#1F,#0F,#0F,#07,#00,#00,#02,#02,#06
    DB #00,#00,#80,#FA,#B4,#AA,#F8,#F0,#E0,#E0,#C0,#00,#00,#40,#40,#60

;; ---- End of Frame: hero_dead_4_F0 ----

;; ---- Sprite Frame: hero_dead_4_F1 ----
;; Size: 16x16
HERO_DEAD_4_F1_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#03,#5F,#2B,#5B,#2F,#1F,#0F,#0F,#07,#00,#00,#02,#02,#06
    DB #00,#00,#80,#FA,#B4,#AA,#F8,#F0,#E0,#E0,#C0,#00,#00,#40,#40,#60

;; ---- End of Frame: hero_dead_4_F1 ----

;; ---- Sprite Frame: hero_dead_4_F2 ----
;; Size: 16x16
HERO_DEAD_4_F2_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#03,#5F,#2B,#5B,#2F,#1F,#0F,#0F,#07,#00,#00,#02,#02,#00
    DB #00,#00,#80,#FA,#B4,#AA,#F8,#F0,#E0,#E0,#C0,#00,#00,#40,#40,#00

;; ---- End of Frame: hero_dead_4_F2 ----

;; ---- Sprite Frame: hero_dead_4_F3 ----
;; Size: 16x16
HERO_DEAD_4_F3_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#06,#BE,#56,#B6,#5E,#3E,#00,#00,#1E,#1E,#0E,#00,#00,#04,#04
    DB #00,#40,#7D,#5A,#55,#7C,#78,#00,#00,#70,#70,#60,#00,#00,#20,#20

;; ---- End of Frame: hero_dead_4_F3 ----

;; ---- Sprite Frame: hero_dead_4_F4 ----
;; Size: 16x16
HERO_DEAD_4_F4_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#06,#3E,#56,#36,#5E,#3E,#00,#00,#1E,#1E,#0E,#00,#00,#04,#00
    DB #00,#40,#7C,#5A,#54,#7C,#78,#00,#00,#70,#70,#60,#00,#00,#20,#00

;; ---- End of Frame: hero_dead_4_F4 ----

;; ---- Sprite Frame: hero_dead_4_F5 ----
;; Size: 16x16
HERO_DEAD_4_F5_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#7C,#2C,#6C,#3C,#7C,#00,#00,#00,#00,#3C,#3C,#1C,#00,#00,#00
    DB #00,#3E,#2C,#2A,#3E,#3C,#00,#00,#00,#00,#38,#38,#30,#00,#00,#00

;; ---- End of Frame: hero_dead_4_F5 ----

;; ---- Sprite Frame: hero_dead_4_F6 ----
;; Size: 16x16
HERO_DEAD_4_F6_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#7C,#2C,#6C,#3C,#7C,#00,#00,#00,#00,#3C,#3C,#1C,#00,#00,#00
    DB #00,#3E,#2C,#2A,#3E,#3C,#00,#00,#00,#00,#38,#38,#30,#00,#00,#00

;; ---- End of Frame: hero_dead_4_F6 ----

;; ---- Sprite Frame: hero_dead_4_F7 ----
;; Size: 16x16
HERO_DEAD_4_F7_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#58,#58,#78,#78,#00,#00,#00,#00,#00,#00,#78,#78,#38,#00,#00
    DB #00,#16,#14,#1E,#1E,#00,#00,#00,#00,#00,#00,#1C,#1C,#18,#00,#00

;; ---- End of Frame: hero_dead_4_F7 ----

;; ---- Sprite Frame: hero_dead_4_F8 ----
;; Size: 16x16
HERO_DEAD_4_F8_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#58,#58,#78,#78,#00,#00,#00,#00,#00,#00,#78,#78,#38,#00,#00
    DB #00,#16,#14,#1E,#1E,#00,#00,#00,#00,#00,#00,#1C,#1C,#18,#00,#00

;; ---- End of Frame: hero_dead_4_F8 ----

;; ---- Sprite Frame: hero_dead_4_F9 ----
;; Size: 16x16
HERO_DEAD_4_F9_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#30,#70,#70,#00,#00,#00,#00,#00,#00,#00,#00,#70,#70,#70,#00
    DB #00,#0A,#0E,#0E,#00,#00,#00,#00,#00,#00,#00,#00,#0E,#0E,#0C,#00

;; ---- End of Frame: hero_dead_4_F9 ----

;; ---- Sprite Frame: hero_dead_4_F10 ----
;; Size: 16x16
HERO_DEAD_4_F10_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#30,#30,#00,#00,#00,#00,#00,#00,#00,#00,#30,#30,#00,#00
    DB #00,#00,#0C,#0C,#00,#00,#00,#00,#00,#00,#00,#00,#0C,#0C,#00,#00

;; ---- End of Frame: hero_dead_4_F10 ----

;; ---- Sprite Frame: hero_dead_4_F11 ----
;; Size: 16x16
HERO_DEAD_4_F11_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#60,#60,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#60,#60,#00
    DB #00,#06,#06,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#06,#06,#00

;; ---- End of Frame: hero_dead_4_F11 ----

;; ---- Sprite Frame: hero_dead_4_F12 ----
;; Size: 16x16
HERO_DEAD_4_F12_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#20,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#20,#00,#00
    DB #00,#00,#04,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#04,#00,#00

;; ---- End of Frame: hero_dead_4_F12 ----

;; ---- Sprite Frame: hero_dead_4_F13 ----
;; Size: 16x16
HERO_DEAD_4_F13_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

;; ---- End of Frame: hero_dead_4_F13 ----


; Unified pattern label for sprite 4
SPRITE_4_PATTERN EQU HERO_DEAD_4_F0_LAYER1
SPRITE_4_PATTERN_BANK EQU ((SPRITE_4_PATTERN - #4000) / #2000)

; Sprite Asset 5: New Sprite
;; Sprite: New Sprite
;; Total Frames: 1
;; Size: 32x16
;; Background Color (not exported as a layer): rgba(0,0,0,0)
;; Drawable Palette (Hex): C0=#000000, C1=#FFFFFF, C2=#FF0000, C3=#00FF00

SPRITE_NEW_SPRITE_5_WIDTH     EQU 32
SPRITE_NEW_SPRITE_5_HEIGHT    EQU 16
SPRITE_NEW_SPRITE_5_FRAMES    EQU 1

;; ---- Sprite Frame: New Sprite_5_F0 ----
;; Size: 32x16
NEW_SPRITE_5_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#7F,#FF,#FF,#FE
    DB #FF,#FF,#FF,#FF,#7F,#FF,#FF,#FE,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

;; ---- End of Frame: New Sprite_5_F0 ----


; Unified pattern label for sprite 5
SPRITE_5_PATTERN EQU NEW_SPRITE_5_F0_LAYER1
SPRITE_5_PATTERN_BANK EQU ((SPRITE_5_PATTERN - #4000) / #2000)

; Sprite Asset 6: gema1
;; Sprite: gema1
;; Total Frames: 2
;; Size: 16x16
;; Background Color (not exported as a layer): #000000
;; Drawable Palette (Hex): C0=#000000, C1=#FFFFFF, C2=#FF0000, C3=#00FF00

SPRITE_GEMA1_6_WIDTH     EQU 16
SPRITE_GEMA1_6_HEIGHT    EQU 16
SPRITE_GEMA1_6_FRAMES    EQU 2

;; ---- Sprite Frame: gema1_6_F0 ----
;; Size: 16x16
GEMA1_6_F0_LAYER2: ; Brush Color Index 2 (Actual Color: #FF0000)
    DB #00,#00,#00,#01,#03,#06,#05,#06,#07,#07,#03,#01,#00,#00,#00,#00
    DB #00,#00,#80,#C0,#E0,#F0,#D0,#D0,#90,#90,#20,#40,#80,#00,#00,#00

;; ---- End of Frame: gema1_6_F0 ----

;; ---- Sprite Frame: gema1_6_F1 ----
;; Size: 16x16
GEMA1_6_F1_LAYER2: ; Brush Color Index 2 (Actual Color: #FF0000)
    DB #00,#10,#08,#01,#03,#06,#05,#66,#07,#07,#03,#01,#08,#10,#00,#00
    DB #00,#04,#88,#C0,#E0,#F0,#D0,#D3,#90,#90,#20,#40,#88,#04,#00,#00

;; ---- End of Frame: gema1_6_F1 ----


; Unified pattern label for sprite 6
SPRITE_6_PATTERN EQU GEMA1_6_F0_LAYER2
SPRITE_6_PATTERN_BANK EQU ((SPRITE_6_PATTERN - #4000) / #2000)

; Sprite Asset 7: Box
;; Sprite: Box
;; Total Frames: 1
;; Size: 16x16
;; Background Color (not exported as a layer): #000000
;; Drawable Palette (Hex): C0=#000000, C1=#D4C154, C2=#FF0000, C3=#00FF00

SPRITE_BOX_7_WIDTH     EQU 16
SPRITE_BOX_7_HEIGHT    EQU 16
SPRITE_BOX_7_FRAMES    EQU 1

;; ---- Sprite Frame: Box_7_F0 ----
;; Size: 16x16
BOX_7_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #D4C154)
    DB #00,#7F,#40,#40,#40,#7E,#41,#7E,#5F,#5F,#5F,#5F,#5F,#5F,#40,#7F
    DB #00,#FE,#02,#02,#02,#7E,#82,#7E,#FE,#FA,#FA,#FA,#FA,#FA,#02,#FE

;; ---- End of Frame: Box_7_F0 ----


; Unified pattern label for sprite 7
SPRITE_7_PATTERN EQU BOX_7_F0_LAYER1
SPRITE_7_PATTERN_BANK EQU ((SPRITE_7_PATTERN - #4000) / #2000)

; Sprite Asset 8: fire
;; Sprite: fire
;; Total Frames: 2
;; Size: 16x16
;; Background Color (not exported as a layer): rgba(0,0,0,0)
;; Drawable Palette (Hex): C0=#000000, C1=#FFFFFF, C2=#FF0000, C3=#00FF00

SPRITE_FIRE_8_WIDTH     EQU 16
SPRITE_FIRE_8_HEIGHT    EQU 16
SPRITE_FIRE_8_FRAMES    EQU 2

;; ---- Sprite Frame: fire_8_F0 ----
;; Size: 16x16
FIRE_8_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#00,#00,#00,#00,#01,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#80,#C0,#80,#00,#00,#00,#00,#00,#00,#00,#00

;; ---- End of Frame: fire_8_F0 ----

;; ---- Sprite Frame: fire_8_F1 ----
;; Size: 16x16
FIRE_8_F1_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#00,#00,#00,#01,#00,#01,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#40,#80,#40,#00,#00,#00,#00,#00,#00,#00,#00

;; ---- End of Frame: fire_8_F1 ----


; Unified pattern label for sprite 8
SPRITE_8_PATTERN EQU FIRE_8_F0_LAYER1
SPRITE_8_PATTERN_BANK EQU ((SPRITE_8_PATTERN - #4000) / #2000)

; Sprite Asset 9: fire2_left
;; Sprite: fire2_left
;; Total Frames: 5
;; Size: 16x16
;; Background Color (not exported as a layer): rgba(0,0,0,0)
;; Drawable Palette (Hex): C0=#000000, C1=#FFFFFF, C2=#FF0000, C3=#00FF00

SPRITE_FIRE2_LEFT_9_WIDTH     EQU 16
SPRITE_FIRE2_LEFT_9_HEIGHT    EQU 16
SPRITE_FIRE2_LEFT_9_FRAMES    EQU 5

;; ---- Sprite Frame: fire2_left_9_F0 ----
;; Size: 16x16
FIRE2_LEFT_9_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#40,#00,#40,#00,#40,#00,#40,#00,#00,#00,#00

;; ---- End of Frame: fire2_left_9_F0 ----

;; ---- Sprite Frame: fire2_left_9_F1 ----
;; Size: 16x16
FIRE2_LEFT_9_F1_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#10,#00,#10,#40,#10,#40,#10,#00,#10,#00,#00,#00

;; ---- End of Frame: fire2_left_9_F1 ----

;; ---- Sprite Frame: fire2_left_9_F2 ----
;; Size: 16x16
FIRE2_LEFT_9_F2_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#04,#00,#10,#00,#14,#20,#50,#24,#10,#00,#14,#00,#04,#00

;; ---- End of Frame: fire2_left_9_F2 ----

;; ---- Sprite Frame: fire2_left_9_F3 ----
;; Size: 16x16
FIRE2_LEFT_9_F3_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#04,#00,#10,#00,#04,#00,#00,#04,#00,#00,#14,#00,#04,#00

;; ---- End of Frame: fire2_left_9_F3 ----

;; ---- Sprite Frame: fire2_left_9_F4 ----
;; Size: 16x16
FIRE2_LEFT_9_F4_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#01,#00,#00,#04,#00,#00,#00,#00,#00,#00,#04,#00,#00,#01,#00

;; ---- End of Frame: fire2_left_9_F4 ----


; Unified pattern label for sprite 9
SPRITE_9_PATTERN EQU FIRE2_LEFT_9_F0_LAYER1
SPRITE_9_PATTERN_BANK EQU ((SPRITE_9_PATTERN - #4000) / #2000)

; Sprite Asset 10: New Sprite_1
;; Sprite: New Sprite_1
;; Total Frames: 1
;; Size: 16x16
;; Background Color (not exported as a layer): rgba(0,0,0,0)
;; Drawable Palette (Hex): C0=#000000, C1=#CCCCCC, C2=#D4C154, C3=#7D76FC

SPRITE_NEW_SPRITE_1_10_WIDTH     EQU 16
SPRITE_NEW_SPRITE_1_10_HEIGHT    EQU 16
SPRITE_NEW_SPRITE_1_10_FRAMES    EQU 1

;; ---- Sprite Frame: New Sprite_1_10_F0 ----
;; Size: 16x16
NEW_SPRITE_1_10_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #CCCCCC)
    DB #00,#00,#00,#00,#00,#20,#3F,#3F,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#FC,#8E,#FC,#00,#48,#08,#08,#08,#00,#00,#00

NEW_SPRITE_1_10_F0_LAYER3: ; Brush Color Index 3 (Actual Color: #7D76FC)
    DB #00,#00,#00,#00,#00,#1F,#40,#40,#01,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#02,#50,#00,#3C,#B4,#34,#34,#34,#38,#00,#00

;; ---- End of Frame: New Sprite_1_10_F0 ----


; Unified pattern label for sprite 10
SPRITE_10_PATTERN EQU NEW_SPRITE_1_10_F0_LAYER1
SPRITE_10_PATTERN_BANK EQU ((SPRITE_10_PATTERN - #4000) / #2000)

; Sprite Asset 11: hero_right
;; Sprite: hero_right
;; Total Frames: 4
;; Size: 16x16
;; Background Color (not exported as a layer): rgba(0,0,0,0)
;; Drawable Palette (Hex): C0=#000000, C1=#FFFFFF, C2=#42EBF5, C3=#00FF00

SPRITE_HERO_RIGHT_11_WIDTH     EQU 16
SPRITE_HERO_RIGHT_11_HEIGHT    EQU 16
SPRITE_HERO_RIGHT_11_FRAMES    EQU 4

;; ---- Sprite Frame: hero_right_11_F0 ----
;; Size: 16x16
HERO_RIGHT_11_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#01,#1F,#2B,#D7,#BB,#4F,#07,#07,#03,#00,#00,#01,#01,#01
    DB #00,#00,#C0,#F8,#DC,#8E,#DF,#FB,#E1,#F1,#E0,#00,#00,#00,#00,#C0

HERO_RIGHT_11_F0_LAYER2: ; Brush Color Index 2 (Actual Color: #42EBF5)
    DB #03,#07,#0E,#00,#00,#00,#00,#00,#00,#00,#00,#03,#03,#00,#00,#00
    DB #C0,#F8,#04,#00,#00,#00,#00,#00,#00,#00,#00,#C0,#C0,#00,#00,#00

;; ---- End of Frame: hero_right_11_F0 ----

;; ---- Sprite Frame: hero_right_11_F1 ----
;; Size: 16x16
HERO_RIGHT_11_F1_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#01,#1F,#2B,#D7,#BB,#4F,#07,#07,#03,#00,#04,#08,#10,#18
    DB #00,#00,#C0,#F8,#DC,#8E,#DF,#FB,#E1,#F1,#E0,#00,#20,#10,#10,#18

HERO_RIGHT_11_F1_LAYER2: ; Brush Color Index 2 (Actual Color: #42EBF5)
    DB #03,#07,#0E,#00,#00,#00,#00,#00,#00,#00,#00,#03,#03,#00,#00,#00
    DB #C0,#F8,#04,#00,#00,#00,#00,#00,#00,#00,#00,#C0,#C0,#00,#00,#00

;; ---- End of Frame: hero_right_11_F1 ----

;; ---- Sprite Frame: hero_right_11_F2 ----
;; Size: 16x16
HERO_RIGHT_11_F2_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#00,#01,#1B,#37,#4B,#B7,#4F,#87,#00,#00,#FC,#80,#00,#00
    DB #00,#00,#00,#C0,#F8,#DC,#8E,#DF,#FB,#E1,#01,#18,#08,#08,#08,#0C

HERO_RIGHT_11_F2_LAYER2: ; Brush Color Index 2 (Actual Color: #42EBF5)
    DB #00,#03,#07,#0E,#00,#00,#00,#00,#00,#00,#07,#07,#00,#00,#00,#00
    DB #00,#C0,#F8,#04,#00,#00,#00,#00,#00,#00,#E0,#E0,#00,#00,#00,#00

;; ---- End of Frame: hero_right_11_F2 ----

;; ---- Sprite Frame: hero_right_11_F3 ----
;; Size: 16x16
HERO_RIGHT_11_F3_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#01,#1B,#37,#4B,#B7,#4F,#07,#00,#F8,#80,#00,#00,#00,#00
    DB #00,#00,#C0,#F8,#DC,#8E,#DF,#FB,#E1,#01,#00,#20,#20,#20,#20,#30

HERO_RIGHT_11_F3_LAYER2: ; Brush Color Index 2 (Actual Color: #42EBF5)
    DB #03,#07,#0E,#00,#00,#00,#00,#00,#00,#07,#07,#00,#00,#00,#00,#00
    DB #C0,#F8,#04,#00,#00,#00,#00,#00,#00,#E0,#E0,#00,#00,#00,#00,#00

;; ---- End of Frame: hero_right_11_F3 ----


; Unified pattern label for sprite 11
SPRITE_11_PATTERN EQU HERO_RIGHT_11_F0_LAYER1
SPRITE_11_PATTERN_BANK EQU ((SPRITE_11_PATTERN - #4000) / #2000)

; Sprite Asset 12: bot2_left
;; Sprite: bot2_left
;; Total Frames: 2
;; Size: 16x16
;; Background Color (not exported as a layer): rgba(0,0,0,0)
;; Drawable Palette (Hex): C0=#FFFFFF, C1=#000000, C2=#3EB847, C3=#74D07D

SPRITE_BOT2_LEFT_12_WIDTH     EQU 16
SPRITE_BOT2_LEFT_12_HEIGHT    EQU 16
SPRITE_BOT2_LEFT_12_FRAMES    EQU 2

;; ---- Sprite Frame: bot2_left_12_F0 ----
;; Size: 16x16
BOT2_LEFT_12_F0_LAYER0: ; Brush Color Index 0 (Actual Color: #FFFFFF)
    DB #07,#0D,#0D,#0F,#07,#00,#0F,#BD,#BD,#0F,#00,#38,#38,#E0,#E0,#E0
    DB #F8,#FE,#F3,#F1,#E0,#00,#F4,#F6,#F6,#F6,#00,#30,#3F,#3F,#03,#03

;; ---- End of Frame: bot2_left_12_F0 ----

;; ---- Sprite Frame: bot2_left_12_F1 ----
;; Size: 16x16
BOT2_LEFT_12_F1_LAYER0: ; Brush Color Index 0 (Actual Color: #FFFFFF)
    DB #07,#0D,#0D,#0F,#07,#00,#0F,#0F,#0F,#0E,#00,#01,#01,#01,#07,#07
    DB #F8,#FF,#F3,#F0,#E0,#00,#F4,#F6,#F6,#76,#00,#80,#80,#80,#80,#80

;; ---- End of Frame: bot2_left_12_F1 ----


; Unified pattern label for sprite 12
SPRITE_12_PATTERN EQU BOT2_LEFT_12_F0_LAYER0
SPRITE_12_PATTERN_BANK EQU ((SPRITE_12_PATTERN - #4000) / #2000)

; Sprite Asset 13: fire2_right
;; Sprite: fire2_right
;; Total Frames: 5
;; Size: 16x16
;; Background Color (not exported as a layer): rgba(0,0,0,0)
;; Drawable Palette (Hex): C0=#000000, C1=#FFFFFF, C2=#FF0000, C3=#00FF00

SPRITE_FIRE2_RIGHT_13_WIDTH     EQU 16
SPRITE_FIRE2_RIGHT_13_HEIGHT    EQU 16
SPRITE_FIRE2_RIGHT_13_FRAMES    EQU 5

;; ---- Sprite Frame: fire2_right_13_F0 ----
;; Size: 16x16
FIRE2_RIGHT_13_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#00,#00,#00,#02,#00,#02,#00,#02,#00,#02,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

;; ---- End of Frame: fire2_right_13_F0 ----

;; ---- Sprite Frame: fire2_right_13_F1 ----
;; Size: 16x16
FIRE2_RIGHT_13_F1_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#00,#00,#08,#00,#08,#02,#08,#02,#08,#00,#08,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

;; ---- End of Frame: fire2_right_13_F1 ----

;; ---- Sprite Frame: fire2_right_13_F2 ----
;; Size: 16x16
FIRE2_RIGHT_13_F2_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#20,#00,#08,#00,#28,#04,#0A,#24,#08,#00,#28,#00,#20,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

;; ---- End of Frame: fire2_right_13_F2 ----

;; ---- Sprite Frame: fire2_right_13_F3 ----
;; Size: 16x16
FIRE2_RIGHT_13_F3_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#20,#00,#08,#00,#20,#00,#00,#20,#00,#00,#28,#00,#20,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

;; ---- End of Frame: fire2_right_13_F3 ----

;; ---- Sprite Frame: fire2_right_13_F4 ----
;; Size: 16x16
FIRE2_RIGHT_13_F4_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#80,#00,#00,#20,#00,#00,#00,#00,#00,#00,#20,#00,#00,#80,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

;; ---- End of Frame: fire2_right_13_F4 ----


; Unified pattern label for sprite 13
SPRITE_13_PATTERN EQU FIRE2_RIGHT_13_F0_LAYER1
SPRITE_13_PATTERN_BANK EQU ((SPRITE_13_PATTERN - #4000) / #2000)

; ==================================================================
; PLACEHOLDER SPRITE PATTERN (for entities with missing sprite assets)
; ==================================================================
; 16x16 white square sprite (solid fill)
SPRITE_PLACEHOLDER_PATTERN:
    ; Top half (8x8)
    db #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF
    ; Bottom half (8x8)
    db #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF
    ; Right half top (8x8)
    db #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF
    ; Right half bottom (8x8)
    db #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF
SPRITE_PLACEHOLDER_PATTERN_BANK EQU ((SPRITE_PLACEHOLDER_PATTERN - #4000) / #2000)


; ==================================================================
; SPRITE ANIMATION METADATA TABLES
; ==================================================================

; Table: Sprite Asset Frame Counts
; Format: db frame_count
sprite_asset_frame_count:
    db 4 ; Sprite 0: hero_left
    db 4 ; Sprite 1: bird
    db 1 ; Sprite 2: bot1
    db 2 ; Sprite 3: bot2_right
    db 14 ; Sprite 4: hero_dead
    db 1 ; Sprite 5: New Sprite
    db 2 ; Sprite 6: gema1
    db 1 ; Sprite 7: Box
    db 2 ; Sprite 8: fire
    db 5 ; Sprite 9: fire2_left
    db 1 ; Sprite 10: New Sprite_1
    db 4 ; Sprite 11: hero_right
    db 2 ; Sprite 12: bot2_left
    db 5 ; Sprite 13: fire2_right
SPRITE_ASSET_COUNT EQU 14
SPRITE_PATTERN_PRELOAD_MODE EQU 1

; Table: Sprite Asset Loop Flags
; Format: db flags (bit 1: 1=loop, 0=once)
sprite_loop_flags:
    db 2 ; Sprite 0: hero_left
    db 2 ; Sprite 1: bird
    db 2 ; Sprite 2: bot1
    db 2 ; Sprite 3: bot2_right
    db 0 ; Sprite 4: hero_dead
    db 0 ; Sprite 5: New Sprite
    db 2 ; Sprite 6: gema1
    db 2 ; Sprite 7: Box
    db 2 ; Sprite 8: fire
    db 0 ; Sprite 9: fire2_left
    db 2 ; Sprite 10: New Sprite_1
    db 2 ; Sprite 11: hero_right
    db 2 ; Sprite 12: bot2_left
    db 0 ; Sprite 13: fire2_right

; Table: Sprite Asset Frame Pointer List Table
; Format: dw SPRITE_<id>_FRAME_PTRS
sprite_asset_frame_ptr_table:
    dw SPRITE_0_FRAME_PTRS
    dw SPRITE_1_FRAME_PTRS
    dw SPRITE_2_FRAME_PTRS
    dw SPRITE_3_FRAME_PTRS
    dw SPRITE_4_FRAME_PTRS
    dw SPRITE_5_FRAME_PTRS
    dw SPRITE_6_FRAME_PTRS
    dw SPRITE_7_FRAME_PTRS
    dw SPRITE_8_FRAME_PTRS
    dw SPRITE_9_FRAME_PTRS
    dw SPRITE_10_FRAME_PTRS
    dw SPRITE_11_FRAME_PTRS
    dw SPRITE_12_FRAME_PTRS
    dw SPRITE_13_FRAME_PTRS

; Sprite 0: hero_left frame pointers
SPRITE_0_FRAME_PTRS:
    dw HERO_LEFT_0_F0_LAYER1
    dw HERO_LEFT_0_F1_LAYER1
    dw HERO_LEFT_0_F2_LAYER1
    dw HERO_LEFT_0_F3_LAYER1

; Sprite 1: bird frame pointers
SPRITE_1_FRAME_PTRS:
    dw BIRD_1_F0_LAYER1
    dw BIRD_1_F1_LAYER1
    dw BIRD_1_F2_LAYER1
    dw BIRD_1_F3_LAYER1

; Sprite 2: bot1 frame pointers
SPRITE_2_FRAME_PTRS:
    dw BOT1_2_F0_LAYER1

; Sprite 3: bot2_right frame pointers
SPRITE_3_FRAME_PTRS:
    dw BOT2_RIGHT_3_F0_LAYER0
    dw BOT2_RIGHT_3_F1_LAYER0

; Sprite 4: hero_dead frame pointers
SPRITE_4_FRAME_PTRS:
    dw HERO_DEAD_4_F0_LAYER1
    dw HERO_DEAD_4_F1_LAYER1
    dw HERO_DEAD_4_F2_LAYER1
    dw HERO_DEAD_4_F3_LAYER1
    dw HERO_DEAD_4_F4_LAYER1
    dw HERO_DEAD_4_F5_LAYER1
    dw HERO_DEAD_4_F6_LAYER1
    dw HERO_DEAD_4_F7_LAYER1
    dw HERO_DEAD_4_F8_LAYER1
    dw HERO_DEAD_4_F9_LAYER1
    dw HERO_DEAD_4_F10_LAYER1
    dw HERO_DEAD_4_F11_LAYER1
    dw HERO_DEAD_4_F12_LAYER1
    dw HERO_DEAD_4_F13_LAYER1

; Sprite 5: New Sprite frame pointers
SPRITE_5_FRAME_PTRS:
    dw NEW_SPRITE_5_F0_LAYER1

; Sprite 6: gema1 frame pointers
SPRITE_6_FRAME_PTRS:
    dw GEMA1_6_F0_LAYER2
    dw GEMA1_6_F1_LAYER2

; Sprite 7: Box frame pointers
SPRITE_7_FRAME_PTRS:
    dw BOX_7_F0_LAYER1

; Sprite 8: fire frame pointers
SPRITE_8_FRAME_PTRS:
    dw FIRE_8_F0_LAYER1
    dw FIRE_8_F1_LAYER1

; Sprite 9: fire2_left frame pointers
SPRITE_9_FRAME_PTRS:
    dw FIRE2_LEFT_9_F0_LAYER1
    dw FIRE2_LEFT_9_F1_LAYER1
    dw FIRE2_LEFT_9_F2_LAYER1
    dw FIRE2_LEFT_9_F3_LAYER1
    dw FIRE2_LEFT_9_F4_LAYER1

; Sprite 10: New Sprite_1 frame pointers
SPRITE_10_FRAME_PTRS:
    dw NEW_SPRITE_1_10_F0_LAYER1

; Sprite 11: hero_right frame pointers
SPRITE_11_FRAME_PTRS:
    dw HERO_RIGHT_11_F0_LAYER1
    dw HERO_RIGHT_11_F1_LAYER1
    dw HERO_RIGHT_11_F2_LAYER1
    dw HERO_RIGHT_11_F3_LAYER1

; Sprite 12: bot2_left frame pointers
SPRITE_12_FRAME_PTRS:
    dw BOT2_LEFT_12_F0_LAYER0
    dw BOT2_LEFT_12_F1_LAYER0

; Sprite 13: fire2_right frame pointers
SPRITE_13_FRAME_PTRS:
    dw FIRE2_RIGHT_13_F0_LAYER1
    dw FIRE2_RIGHT_13_F1_LAYER1
    dw FIRE2_RIGHT_13_F2_LAYER1
    dw FIRE2_RIGHT_13_F3_LAYER1
    dw FIRE2_RIGHT_13_F4_LAYER1

; ==================================================================
; DIRECTIONAL SPRITE LOOKUP TABLES
; Maps any sprite asset index to its directional variant index.
; If no directional variant exists, table points back to same index.
; ==================================================================
sprite_dir_left_table:
    db 0, 1, 2, 12, 4, 5, 6, 7, 8, 9, 10, 0, 12, 9

sprite_dir_right_table:
    db 11, 1, 2, 3, 4, 5, 6, 7, 8, 13, 10, 11, 3, 13

sprite_dir_up_table:
    db 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13

sprite_dir_down_table:
    db 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13

 
; ================================================================== 
; SPRITE CONFIGURATION TABLES 
; ================================================================== 

; Table: Entity Sprite Configuration 
; Format: db base_hw_sprite_index, layer_count 
entity_sprite_config: 
    db 0, 2 ; Entity 0 (hero_left)
    db 2, 1 ; Entity 1 (New Sprite)
    db 3, 1 ; Entity 2 (Box)
    db 4, 1 ; Entity 3 (gema1)
    db 5, 2 ; Entity 4 (New Sprite_1)
    db 7, 2 ; Entity 5 (New Sprite_1)
    db 9, 1 ; Entity 6 (bot2_right)
    db 10, 1 ; Entity 7 (gema1)
    db 11, 1 ; Entity 8 (gema1)
    db 12, 1 ; Entity 9 (gema1)
    db 13, 1 ; Entity 10 (gema1)
    db 14, 1 ; Entity 11 (gema1)
    db 15, 1 ; Entity 12 (gema1)
    db 16, 1 ; Entity 13 (New Sprite)
    ds 36, 0 ; Padding

; Table: Entity -> Sprite Asset Index (ROM initial values)
; Copied to RAM entity_sprite_asset_index at init
; Format: db sprite_asset_index (#FF = none)
entity_sprite_asset_index_init:
    db #00 ; Entity 0 (hero_left)
    db #05 ; Entity 1 (New Sprite)
    db #07 ; Entity 2 (Box)
    db #06 ; Entity 3 (gema1)
    db #0A ; Entity 4 (New Sprite_1)
    db #0A ; Entity 5 (New Sprite_1)
    db #03 ; Entity 6 (bot2_right)
    db #06 ; Entity 7 (gema1)
    db #06 ; Entity 8 (gema1)
    db #06 ; Entity 9 (gema1)
    db #06 ; Entity 10 (gema1)
    db #06 ; Entity 11 (gema1)
    db #06 ; Entity 12 (gema1)
    db #05 ; Entity 13 (New Sprite)
    ds 18, #FF ; Padding
SPRITE_MAX_ENTITY_LAYERS EQU 2  ; Max HW sprite layers per entity

; Table: Hardware Sprite Layer Colors (ROM initial values - copied to RAM at init)
; Format: db color_index
sprite_layer_colors_init:
    ; Entity 0 (hero_left) layers:
    db 15 ; Layer 0
    db 7 ; Layer 1
    ; Entity 1 (New Sprite) layers:
    db 15 ; Layer 0
    ; Entity 2 (Box) layers:
    db 10 ; Layer 0
    ; Entity 3 (gema1) layers:
    db 8 ; Layer 0
    ; Entity 4 (New Sprite_1) layers:
    db 14 ; Layer 0
    db 5 ; Layer 1
    ; Entity 5 (New Sprite_1) layers:
    db 14 ; Layer 0
    db 5 ; Layer 1
    ; Entity 6 (bot2_right) layers:
    db 15 ; Layer 0
    ; Entity 7 (gema1) layers:
    db 8 ; Layer 0
    ; Entity 8 (gema1) layers:
    db 8 ; Layer 0
    ; Entity 9 (gema1) layers:
    db 8 ; Layer 0
    ; Entity 10 (gema1) layers:
    db 8 ; Layer 0
    ; Entity 11 (gema1) layers:
    db 8 ; Layer 0
    ; Entity 12 (gema1) layers:
    db 8 ; Layer 0
    ; Entity 13 (New Sprite) layers:
    db 15 ; Layer 0
    ds 15, 0 ; Padding

; Table: SM Sprite Layer Colors (for Action_ChangeSprite runtime color update)
; Format: SPRITE_MAX_ENTITY_LAYERS bytes per sprite asset
; Entry[i*SPRITE_MAX_ENTITY_LAYERS + j] = color for HW sprite slot j of sprite i
SM_SpriteLayerColorTable:
    db 15, 7 ; Sprite 0: hero_left
    db 15, 0 ; Sprite 1: bird
    db 15, 0 ; Sprite 2: bot1
    db 15, 0 ; Sprite 3: bot2_right
    db 15, 0 ; Sprite 4: hero_dead
    db 15, 0 ; Sprite 5: New Sprite
    db 8, 0 ; Sprite 6: gema1
    db 10, 0 ; Sprite 7: Box
    db 15, 0 ; Sprite 8: fire
    db 15, 0 ; Sprite 9: fire2_left
    db 14, 5 ; Sprite 10: New Sprite_1
    db 15, 7 ; Sprite 11: hero_right
    db 15, 0 ; Sprite 12: bot2_left
    db 15, 0 ; Sprite 13: fire2_right

; ==================================================================
; SPRITE INITIALIZATION FUNCTIONS
; ==================================================================

init_sprites:
    ; Copy sprite_layer_colors_init (ROM) -> sprite_layer_colors (RAM)
    ld hl, sprite_layer_colors_init
    ld de, sprite_layer_colors
    ld bc, 32
    ldir
    call clear_all_sprites
    ld hl, sprite_asset_base_pattern_slot_runtime
    ld (hl), 0
    ld de, sprite_asset_base_pattern_slot_runtime+1
    ld bc, 13
    ldir
    xor a
    ld (sprite_placeholder_base_pattern_num), a
    xor a
    ld (active_sprite_count), a
    ret

load_sprite_patterns:
    call load_sprite_patterns_worldmap_1760724209990
    ret


; ------------------------------------------------------------------
; Runtime Sprite Pattern Pack: World "New Worldmap"
; Slots required: 41/64
; ------------------------------------------------------------------
sprite_asset_base_pattern_slot_worldmap_1760724209990:
    db 0 ; Sprite 0: hero_left
    db 0 ; Sprite 1: bird
    db 0 ; Sprite 2: bot1
    db 8 ; Sprite 3: bot2_right
    db 10 ; Sprite 4: hero_dead
    db 24 ; Sprite 5: New Sprite
    db 25 ; Sprite 6: gema1
    db 27 ; Sprite 7: Box
    db 0 ; Sprite 8: fire
    db 0 ; Sprite 9: fire2_left
    db 28 ; Sprite 10: New Sprite_1
    db 30 ; Sprite 11: hero_right
    db 38 ; Sprite 12: bot2_left
    db 0 ; Sprite 13: fire2_right

load_sprite_patterns_worldmap_1760724209990:
    ld hl, sprite_asset_base_pattern_slot_worldmap_1760724209990
    ld de, sprite_asset_base_pattern_slot_runtime
    ld bc, SPRITE_ASSET_COUNT
    ldir
    ld a, 160
    ld (sprite_placeholder_base_pattern_num), a
    call mapper_push_p2
    ; Sprite Asset 0: hero_left frame 0 (2 layers)
    ld a, SPRITE_0_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (HERO_LEFT_0_F0_LAYER1 & #1FFF) | #8000
    ld de, SPRPAT + (0 * 32)
    ld bc, 64
    call FAST_LDIRVM
    ; Sprite Asset 0: hero_left frame 1 (2 layers)
    ld a, SPRITE_0_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (HERO_LEFT_0_F1_LAYER1 & #1FFF) | #8000
    ld de, SPRPAT + (2 * 32)
    ld bc, 64
    call FAST_LDIRVM
    ; Sprite Asset 0: hero_left frame 2 (2 layers)
    ld a, SPRITE_0_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (HERO_LEFT_0_F2_LAYER1 & #1FFF) | #8000
    ld de, SPRPAT + (4 * 32)
    ld bc, 64
    call FAST_LDIRVM
    ; Sprite Asset 0: hero_left frame 3 (2 layers)
    ld a, SPRITE_0_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (HERO_LEFT_0_F3_LAYER1 & #1FFF) | #8000
    ld de, SPRPAT + (6 * 32)
    ld bc, 64
    call FAST_LDIRVM
    ; Sprite Asset 3: bot2_right frame 0 (1 layers)
    ld a, SPRITE_3_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (BOT2_RIGHT_3_F0_LAYER0 & #1FFF) | #8000
    ld de, SPRPAT + (8 * 32)
    ld bc, 32
    call FAST_LDIRVM
    ; Sprite Asset 3: bot2_right frame 1 (1 layers)
    ld a, SPRITE_3_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (BOT2_RIGHT_3_F1_LAYER0 & #1FFF) | #8000
    ld de, SPRPAT + (9 * 32)
    ld bc, 32
    call FAST_LDIRVM
    ; Sprite Asset 4: hero_dead frame 0 (1 layers)
    ld a, SPRITE_4_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (HERO_DEAD_4_F0_LAYER1 & #1FFF) | #8000
    ld de, SPRPAT + (10 * 32)
    ld bc, 32
    call FAST_LDIRVM
    ; Sprite Asset 4: hero_dead frame 1 (1 layers)
    ld a, SPRITE_4_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (HERO_DEAD_4_F1_LAYER1 & #1FFF) | #8000
    ld de, SPRPAT + (11 * 32)
    ld bc, 32
    call FAST_LDIRVM
    ; Sprite Asset 4: hero_dead frame 2 (1 layers)
    ld a, SPRITE_4_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (HERO_DEAD_4_F2_LAYER1 & #1FFF) | #8000
    ld de, SPRPAT + (12 * 32)
    ld bc, 32
    call FAST_LDIRVM
    ; Sprite Asset 4: hero_dead frame 3 (1 layers)
    ld a, SPRITE_4_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (HERO_DEAD_4_F3_LAYER1 & #1FFF) | #8000
    ld de, SPRPAT + (13 * 32)
    ld bc, 32
    call FAST_LDIRVM
    ; Sprite Asset 4: hero_dead frame 4 (1 layers)
    ld a, SPRITE_4_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (HERO_DEAD_4_F4_LAYER1 & #1FFF) | #8000
    ld de, SPRPAT + (14 * 32)
    ld bc, 32
    call FAST_LDIRVM
    ; Sprite Asset 4: hero_dead frame 5 (1 layers)
    ld a, SPRITE_4_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (HERO_DEAD_4_F5_LAYER1 & #1FFF) | #8000
    ld de, SPRPAT + (15 * 32)
    ld bc, 32
    call FAST_LDIRVM
    ; Sprite Asset 4: hero_dead frame 6 (1 layers)
    ld a, SPRITE_4_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (HERO_DEAD_4_F6_LAYER1 & #1FFF) | #8000
    ld de, SPRPAT + (16 * 32)
    ld bc, 32
    call FAST_LDIRVM
    ; Sprite Asset 4: hero_dead frame 7 (1 layers)
    ld a, SPRITE_4_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (HERO_DEAD_4_F7_LAYER1 & #1FFF) | #8000
    ld de, SPRPAT + (17 * 32)
    ld bc, 32
    call FAST_LDIRVM
    ; Sprite Asset 4: hero_dead frame 8 (1 layers)
    ld a, SPRITE_4_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (HERO_DEAD_4_F8_LAYER1 & #1FFF) | #8000
    ld de, SPRPAT + (18 * 32)
    ld bc, 32
    call FAST_LDIRVM
    ; Sprite Asset 4: hero_dead frame 9 (1 layers)
    ld a, SPRITE_4_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (HERO_DEAD_4_F9_LAYER1 & #1FFF) | #8000
    ld de, SPRPAT + (19 * 32)
    ld bc, 32
    call FAST_LDIRVM
    ; Sprite Asset 4: hero_dead frame 10 (1 layers)
    ld a, SPRITE_4_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (HERO_DEAD_4_F10_LAYER1 & #1FFF) | #8000
    ld de, SPRPAT + (20 * 32)
    ld bc, 32
    call FAST_LDIRVM
    ; Sprite Asset 4: hero_dead frame 11 (1 layers)
    ld a, SPRITE_4_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (HERO_DEAD_4_F11_LAYER1 & #1FFF) | #8000
    ld de, SPRPAT + (21 * 32)
    ld bc, 32
    call FAST_LDIRVM
    ; Sprite Asset 4: hero_dead frame 12 (1 layers)
    ld a, SPRITE_4_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (HERO_DEAD_4_F12_LAYER1 & #1FFF) | #8000
    ld de, SPRPAT + (22 * 32)
    ld bc, 32
    call FAST_LDIRVM
    ; Sprite Asset 4: hero_dead frame 13 (1 layers)
    ld a, SPRITE_4_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (HERO_DEAD_4_F13_LAYER1 & #1FFF) | #8000
    ld de, SPRPAT + (23 * 32)
    ld bc, 32
    call FAST_LDIRVM
    ; Sprite Asset 5: New Sprite frame 0 (1 layers)
    ld a, SPRITE_5_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (NEW_SPRITE_5_F0_LAYER1 & #1FFF) | #8000
    ld de, SPRPAT + (24 * 32)
    ld bc, 32
    call FAST_LDIRVM
    ; Sprite Asset 6: gema1 frame 0 (1 layers)
    ld a, SPRITE_6_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (GEMA1_6_F0_LAYER2 & #1FFF) | #8000
    ld de, SPRPAT + (25 * 32)
    ld bc, 32
    call FAST_LDIRVM
    ; Sprite Asset 6: gema1 frame 1 (1 layers)
    ld a, SPRITE_6_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (GEMA1_6_F1_LAYER2 & #1FFF) | #8000
    ld de, SPRPAT + (26 * 32)
    ld bc, 32
    call FAST_LDIRVM
    ; Sprite Asset 7: Box frame 0 (1 layers)
    ld a, SPRITE_7_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (BOX_7_F0_LAYER1 & #1FFF) | #8000
    ld de, SPRPAT + (27 * 32)
    ld bc, 32
    call FAST_LDIRVM
    ; Sprite Asset 10: New Sprite_1 frame 0 (2 layers)
    ld a, SPRITE_10_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (NEW_SPRITE_1_10_F0_LAYER1 & #1FFF) | #8000
    ld de, SPRPAT + (28 * 32)
    ld bc, 64
    call FAST_LDIRVM
    ; Sprite Asset 11: hero_right frame 0 (2 layers)
    ld a, SPRITE_11_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (HERO_RIGHT_11_F0_LAYER1 & #1FFF) | #8000
    ld de, SPRPAT + (30 * 32)
    ld bc, 64
    call FAST_LDIRVM
    ; Sprite Asset 11: hero_right frame 1 (2 layers)
    ld a, SPRITE_11_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (HERO_RIGHT_11_F1_LAYER1 & #1FFF) | #8000
    ld de, SPRPAT + (32 * 32)
    ld bc, 64
    call FAST_LDIRVM
    ; Sprite Asset 11: hero_right frame 2 (2 layers)
    ld a, SPRITE_11_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (HERO_RIGHT_11_F2_LAYER1 & #1FFF) | #8000
    ld de, SPRPAT + (34 * 32)
    ld bc, 64
    call FAST_LDIRVM
    ; Sprite Asset 11: hero_right frame 3 (2 layers)
    ld a, SPRITE_11_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (HERO_RIGHT_11_F3_LAYER1 & #1FFF) | #8000
    ld de, SPRPAT + (36 * 32)
    ld bc, 64
    call FAST_LDIRVM
    ; Sprite Asset 12: bot2_left frame 0 (1 layers)
    ld a, SPRITE_12_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (BOT2_LEFT_12_F0_LAYER0 & #1FFF) | #8000
    ld de, SPRPAT + (38 * 32)
    ld bc, 32
    call FAST_LDIRVM
    ; Sprite Asset 12: bot2_left frame 1 (1 layers)
    ld a, SPRITE_12_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (BOT2_LEFT_12_F1_LAYER0 & #1FFF) | #8000
    ld de, SPRPAT + (39 * 32)
    ld bc, 32
    call FAST_LDIRVM
    ; Placeholder sprite used by missing sprite refs
    ld a, SPRITE_PLACEHOLDER_PATTERN_BANK
    call mapper_set_bank_p2
    ld hl, (SPRITE_PLACEHOLDER_PATTERN & #1FFF) | #8000
    ld de, SPRPAT + (40 * 32)
    ld bc, 32
    call FAST_LDIRVM
    call mapper_pop_p2
    ret

; ==================================================================
; SPRITE MANAGEMENT FUNCTIONS
; ==================================================================

; A = hardware sprite index, B = X, C = Y, D = pattern, E = color
show_sprite:
    ; Safety check: Ensure sprite index < 32
    cp 32
    ret nc

    ; Safety check: Never write Y >= 208 (208 is SAT end marker on MSX)
    push af
    ld a, c
    cp 208
    jr c, .y_ok
    ld c, SPRITE_INVISIBLE
.y_ok:
    pop af

    ; Save pattern (D) and color (E) before calculating address
    push de

    ; Calculate base address for sprite: index * 4
    ld l, a
    ld h, 0
    add hl, hl      ; index * 2
    add hl, hl      ; index * 4
    ; Add base of the attribute table
    ld de, sprite_attributes
    add hl, de      ; HL = &sprite_attributes[index * 4]

    ; Restore pattern and color
    pop de

    ; Write attributes
    ld (hl), c      ; Y
    inc hl
    ld (hl), b      ; X
    inc hl
    ld (hl), d      ; Pattern
    inc hl
    ld (hl), e      ; Color

    ld a, 1
    ld (sprites_dirty), a
    ret

; Clear all sprites (set Y = SPRITE_INVISIBLE)
; OPTIMIZED: Uses faster increment method instead of ADD HL,DE
clear_all_sprites:
    ld hl, sprite_attributes
    ld b, 32
    ld a, SPRITE_INVISIBLE
.sprite_clear_loop:
    ld (hl), a      ; Set Y = SPRITE_INVISIBLE
    inc hl          ; Skip to X
    inc hl          ; Skip to Pattern
    inc hl          ; Skip to Color
    inc hl          ; Next sprite (4× INC HL = 24 cycles vs ADD HL,DE = 35 cycles)
    djnz .sprite_clear_loop
    ld a, 1
    ld (sprites_dirty), a
    ret

; Hide specific sprite (A = hardware sprite index)
hide_sprite:
    cp 32
    ret nc
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    ld de, sprite_attributes
    add hl, de
    ld (hl), SPRITE_INVISIBLE
    ld a, 1
    ld (sprites_dirty), a
    ret

; Copy sprite attributes from RAM to VRAM
update_sprites_to_vram:
    ld a, (sprites_dirty)
    or a
    ret z
    xor a
    ld (sprites_dirty), a
    ld hl, sprite_attributes
    ld de, SPRATR
    ld bc, 72  ; Upload active sprite range + SAT end marker
    call FAST_LDIRVM
    ret

; ==================================================================
; SPRITE CONSTANTS
; ==================================================================
SPRITE_INVISIBLE    EQU 224

; ==================================================================
; RAM REQUIREMENTS
; ==================================================================
; sprite_attributes: ds 128
; active_sprite_count: db 0
; sprites_dirty: db 0


; --- End of Bank 5 — pad to 8KB boundary ---
    ds #A000 - $, #FF

; ##################################################################
; BANK 6 — [#A000h-#C000h] PRIMARY: animtiles, scroll
; (Always mapped at boot: bank1→P1, bank2→P2, bank3→P3)
; ##################################################################
    org #A000

; ==================================================================
; ANIMATED TILES SYSTEM
; File: animtiles.asm
; Description: Background tile animation for water, lava, fire, etc.
; ==================================================================

; Auto-detected animated groups:
;   frame groups: 0
;   transform groups: 0

; ==================================================================
; ANIMATED TILES CONSTANTS
; ==================================================================

; Animation speeds (in frames)
ANIM_SPEED_SLOW         EQU 15      ; ~250ms (water)
ANIM_SPEED_MEDIUM       EQU 8       ; ~133ms (lava)
ANIM_SPEED_FAST         EQU 4       ; ~66ms (fire)

; Maximum animated tiles
MAX_ANIM_TILES          EQU 1
ANIM_TILE_ENTRY_SIZE    EQU 7       ; char, chars, frames, speed, bytesPerFrame, ptr(2)
ANIM_TRANS_ENTRY_SIZE   EQU 4       ; char, chars, opCode, flags
ANIM_TILE_DATA_BANK     EQU ((anim_tile_table - #4000) / #2000)

; ==================================================================
; ANIMATED TILES INITIALIZATION
; ==================================================================

init_animated_tiles:
    ; Initialize animation variables
    xor a
    ld (anim_tile_timer), a
    ld (anim_tile_frame), a

    ; Set default global animation speed
    ld a, 8
    ld (anim_tile_speed), a

    ; Upload initial animation frame state immediately
    call update_animated_tiles_vram

    ret

; ==================================================================
; ANIMATED TILES UPDATE FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; update_animated_tiles
; Update animation frame and redraw animated tiles if needed
; Call this every frame from main loop
; ------------------------------------------------------------------
update_animated_tiles:
    ; Skip animation work on screens with no animated tile groups
    ld a, (current_screen_anim_group_count)
    or a
    ret z

    ; Increment timer
    ld a, (anim_tile_timer)
    inc a
    ld (anim_tile_timer), a

    ; Check if it's time to advance frame
    ld b, a
    ld a, (anim_tile_speed)
    or a
    jr nz, .anim_speed_ok
    ld a, 1
    ld (anim_tile_speed), a
.anim_speed_ok:
    cp b
    ret nc                          ; Not yet time to update (timer < speed)

    ; Reset timer
    xor a
    ld (anim_tile_timer), a

    ; Advance global animation counter
    ld a, (anim_tile_frame)
    inc a
    ld (anim_tile_frame), a

    ; Update all animated tiles in VRAM
    call update_animated_tiles_vram

    ret

; ------------------------------------------------------------------
; update_animated_tiles_vram
; Update pattern data in VRAM for all animated tiles
; This updates the actual tile patterns based on current frame
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
update_animated_tiles_vram:
    ; Protect VDP port sequence from ISR VRAM writes.
    ; Always re-enables on exit (see FAST_LDIRVM note on LD A,I bug).
    di

    ei
    ret

; ------------------------------------------------------------------
; set_animation_speed
; Set global animation speed for all animated tiles
; Input:  A = Speed (frames between updates)
; ------------------------------------------------------------------
set_animation_speed:
    or a
    jr nz, .anim_speed_store
    ld a, 1
.anim_speed_store:
    ld (anim_tile_speed), a
    ret

; ------------------------------------------------------------------
; anim_copy_8_bytes
; Copy 8 bytes from CPU memory to VRAM
; Input: DE = source pointer, HL = VRAM destination
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
anim_copy_8_bytes:
    ld b, 8
.anim_copy_loop:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_copy_loop

    ret

; ==================================================================
; anim_upload_char_frame
; Upload one animated char (pattern + color) to all 3 Screen 2 banks
; Input: A = target char code, HL = source frame chunk (16 bytes)
; Source layout: 8 pattern bytes + 8 color bytes
; Destroys: AF, BC, DE, HL
; ==================================================================
anim_upload_char_frame:
    push af
    push bc
    push de
    push hl

    ; BC = target char offset (charCode * 8)
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    ld b, h
    ld c, l

    pop hl
    ex de, hl                      ; DE = source pattern pointer

    ; Pattern bank 0
    push de
    ld hl, CHRTBL2
    add hl, bc
    push bc
    call anim_copy_8_bytes
    pop bc
    pop de

    ; Pattern bank 1
    push de
    ld hl, CHRTBL2 + #800
    add hl, bc
    push bc
    call anim_copy_8_bytes
    pop bc
    pop de

    ; Pattern bank 2
    ld hl, CHRTBL2 + #1000
    add hl, bc
    push bc
    call anim_copy_8_bytes
    pop bc

    ; DE now points to color bytes (source + 8)
    ; Color bank 0
    push de
    ld hl, CLRTBL2
    add hl, bc
    push bc
    call anim_copy_8_bytes
    pop bc
    pop de

    ; Color bank 1
    push de
    ld hl, CLRTBL2 + #800
    add hl, bc
    push bc
    call anim_copy_8_bytes
    pop bc
    pop de

    ; Color bank 2
    ld hl, CLRTBL2 + #1000
    add hl, bc
    push bc
    call anim_copy_8_bytes
    pop bc

    pop de
    pop bc
    pop af
    ret

; ==================================================================
; TRANSFORM MODE ROUTINES (Z80 runtime bit/row transforms)
; ==================================================================

; ------------------------------------------------------------------
; Routine: update_animated_transform_tiles_vram
; Purpose:
;   Applies Z80 transform operations directly on tile bytes in VRAM.
; Input:
;   None
; Output:
;   None
; Modifies:
;   AF, BC, DE, HL
; Preserves:
;   IX, IY, SP
; Flags:
;   Not preserved
; Stack:
;   Uses PUSH/POP HL, BC and DE internally
; ------------------------------------------------------------------
update_animated_transform_tiles_vram:
    ret

; ------------------------------------------------------------------
; Routine: anim_transform_char_frame
; Purpose:
;   Transform one character pattern in all SCREEN 2 banks.
; Input:
;   A = character code
;   D = transform operation code
;   (anim_tile_transform_flags).bit0 = transform color rows too
; Output:
;   None
; Modifies:
;   AF, BC, DE, HL
; Preserves:
;   IX, IY, SP
; Flags:
;   Not preserved
; Stack:
;   Pushes/pops BC, DE and HL
; ------------------------------------------------------------------
anim_transform_char_frame:
    push bc
    push de
    push hl

    ; BC = charCode * 8 (row offset in pattern/color tables)
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    ld b, h
    ld c, l

    ; Save opcode D to scratch RAM so anim_transform_vram_block can reload it
    ; after DE is reused internally as a pointer.
    ld a, d
    ld (anim_tile_transform_flags + 1), a

    ; Pattern banks: read bank 0 once and mirror the transformed result to all 3
    ; SCREEN 2 banks to keep animation phase identical across thirds.
    ld hl, CHRTBL2
    add hl, bc
    call anim_transform_vram_block

    ; anim_transform_vram_block reuses DE internally, so reload the opcode
    ; from scratch RAM before deciding whether color rows also need a transform.
    ld a, (anim_tile_transform_flags + 1)
    cp 5
    jr c, .anim_transform_char_done

    ld a, (anim_tile_transform_flags)
    and 1
    jr z, .anim_transform_char_done

    ; Color banks: same approach, read bank 0 and mirror to all 3 banks.
    ld a, (anim_tile_transform_flags + 1)
    ld d, a
    ld hl, CLRTBL2
    add hl, bc
    call anim_transform_vram_block

.anim_transform_char_done:
    pop hl
    pop de
    pop bc
    ret

; ------------------------------------------------------------------
; Routine: anim_transform_vram_block
; Purpose:
;   Apply transform to one 8-byte VRAM block (one char rows table).
; Input:
;   HL = VRAM base address for row 0 (8 consecutive bytes)
;   D  = operation code:
;        1 rotate_left  (RLCA)
;        2 rotate_right (RRCA)
;        3 shift_left   (SLA)
;        4 shift_right  (SRL)
;        5 shift_up rows
;        6 shift_down rows
;        7 swap top/bottom row
; Output:
;   None
; Modifies:
;   AF, BC, DE, HL
; Preserves:
;   IX, IY, SP
; Flags:
;   Not preserved
; Stack:
;   Uses stack while reading row bytes
; ------------------------------------------------------------------
anim_transform_vram_block:
    ; HL = VRAM base address for bank 0. The routine captures the source rows
    ; from bank 0, transforms them in RAM, then writes the same result to the
    ; three SCREEN 2 banks. This prevents per-bank phase drift.
    ld a, d
    cp 5
    jr nc, .anim_transform_vertical

    ; Step 1: Read bank 0 into the RAM buffer.
    push hl
    ld de, anim_tile_row_buffer
    ld b, 8
.anim_read_horiz_loop:
    push hl
    call FAST_RDVRM                 ; A = row byte from VRAM[HL]
    pop hl
    ld (de), a
    inc de
    inc hl
    djnz .anim_read_horiz_loop
    pop hl

    ; Step 2: Transform the buffered bytes in RAM.
    ld de, anim_tile_row_buffer
    ld b, 8
    ld a, (anim_tile_transform_flags + 1)
    ld c, a
.anim_apply_horiz_loop:
    ld a, (de)
    push de
    push bc
    ld b, a
    ld a, c
    cp 1
    jr nz, .anim_not_rl3
    ld a, b
    rlca
    jr .anim_store_h
.anim_not_rl3:
    cp 2
    jr nz, .anim_not_rr3
    ld a, b
    rrca
    jr .anim_store_h
.anim_not_rr3:
    cp 3
    jr nz, .anim_not_sla3
    ld a, b
    sla a
    jr .anim_store_h
.anim_not_sla3:
    ld a, b
    srl a
.anim_store_h:
    pop bc
    pop de
    ld (de), a
    inc de
    djnz .anim_apply_horiz_loop

    ; Step 3: Mirror the transformed buffer to the 3 pattern/color banks.
    push hl
    ld de, anim_tile_row_buffer
    ld b, 8
.anim_write_bank0_loop:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_bank0_loop
    pop hl

    push hl
    ld de, #0800
    add hl, de
    ld de, anim_tile_row_buffer
    ld b, 8
.anim_write_bank1_loop:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_bank1_loop
    pop hl

    ld de, #1000
    add hl, de
    ld de, anim_tile_row_buffer
    ld b, 8
.anim_write_bank2_loop:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_bank2_loop
    ret

.anim_transform_vertical:
    ; Step 1: Read bank 0 into the RAM buffer.
    push de
    ld de, anim_tile_row_buffer
    ld b, 8
.anim_read_rows_loop:
    push hl
    call FAST_RDVRM                 ; A = row byte
    pop hl
    ld (de), a
    inc de
    inc hl
    djnz .anim_read_rows_loop
    pop de

    ; Restore HL to the start of bank 0 and reload the opcode scratch byte.
    ld de, #FFF8
    add hl, de

    ld a, (anim_tile_transform_flags + 1)
    cp 5
    jr nz, .anim_not_shift_up

    ; shift_up: row0<-row1 ... row6<-row7 row7<-row0(original)
    push hl
    ld de, anim_tile_row_buffer + 1
    ld b, 7
.anim_write_up_b0:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_up_b0
    ld a, (anim_tile_row_buffer)
    call FAST_WRTVRM
    pop hl

    push hl
    ld de, #0800
    add hl, de
    ld de, anim_tile_row_buffer + 1
    ld b, 7
.anim_write_up_b1:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_up_b1
    ld a, (anim_tile_row_buffer)
    call FAST_WRTVRM
    pop hl

    ld de, #1000
    add hl, de
    ld de, anim_tile_row_buffer + 1
    ld b, 7
.anim_write_up_b2:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_up_b2
    ld a, (anim_tile_row_buffer)
    call FAST_WRTVRM
    ret

.anim_not_shift_up:
    cp 6
    jr nz, .anim_not_shift_down

    ; shift_down: row0<-row7(original) row1<-row0 ... row7<-row6
    push hl
    ld a, (anim_tile_row_buffer + 7)
    call FAST_WRTVRM
    inc hl
    ld de, anim_tile_row_buffer
    ld b, 7
.anim_write_dn_b0:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_dn_b0
    pop hl

    push hl
    ld de, #0800
    add hl, de
    ld a, (anim_tile_row_buffer + 7)
    call FAST_WRTVRM
    inc hl
    ld de, anim_tile_row_buffer
    ld b, 7
.anim_write_dn_b1:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_dn_b1
    pop hl

    ld de, #1000
    add hl, de
    ld a, (anim_tile_row_buffer + 7)
    call FAST_WRTVRM
    inc hl
    ld de, anim_tile_row_buffer
    ld b, 7
.anim_write_dn_b2:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_dn_b2
    ret

.anim_not_shift_down:
    ; swap_top_bottom: row0<->row7, middle rows unchanged
    push hl
    ld a, (anim_tile_row_buffer + 7)
    call FAST_WRTVRM
    inc hl
    ld de, anim_tile_row_buffer + 1
    ld b, 6
.anim_write_sw_mid_b0:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_sw_mid_b0
    ld a, (anim_tile_row_buffer)
    call FAST_WRTVRM
    pop hl

    push hl
    ld de, #0800
    add hl, de
    ld a, (anim_tile_row_buffer + 7)
    call FAST_WRTVRM
    inc hl
    ld de, anim_tile_row_buffer + 1
    ld b, 6
.anim_write_sw_mid_b1:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_sw_mid_b1
    ld a, (anim_tile_row_buffer)
    call FAST_WRTVRM
    pop hl

    ld de, #1000
    add hl, de
    ld a, (anim_tile_row_buffer + 7)
    call FAST_WRTVRM
    inc hl
    ld de, anim_tile_row_buffer + 1
    ld b, 6
.anim_write_sw_mid_b2:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_sw_mid_b2
    ld a, (anim_tile_row_buffer)
    call FAST_WRTVRM
    ret

; ==================================================================
; ANIMATED TILE DEFINITIONS (AUTO-GENERATED)
; ==================================================================

; ------------------------------------------------------------------
; Animated tile mapping table
; Format:
;   db targetCharCode, charsPerTile, numFrames, speed, bytesPerFrame
;   dw frameDataPointer
; ------------------------------------------------------------------
anim_tile_table:
    ; No animated tile groups detected in project data
    db 255                          ; End marker

; ------------------------------------------------------------------
; Transform tile mapping table
; Format:
;   db targetCharCode, charsPerTile, opCode, flags
; flags:
;   bit0 = apply vertical transform on color rows
; ------------------------------------------------------------------
anim_transform_table:
    ; Transform groups are precomputed as frame data in anim_tile_table
    db 255                          ; End marker

; ==================================================================
; ANIMATION FRAME DATA
; ==================================================================
anim_group_empty_data:
    db #00


; ------------------------------------------------------------------
; register_animated_tile
; Runtime registration is not supported in this generator version.
; Input:  A = Tile ID to animate
;         B = Number of frames (2-4)
;         C = Animation speed
; Output: A = 0 if failed (table full), 1 if success
; Destroys: AF, DE, HL
; ------------------------------------------------------------------
register_animated_tile:
    xor a                           ; Not supported (static generated table)
    ret

; ------------------------------------------------------------------
; get_tile_animation_frame
; Get current animation frame for a tile
; Input:  A = target char code
; Output: A = Current frame index (mod numFrames), or 0 if not animated
; Destroys: BC, DE, HL
; ------------------------------------------------------------------
get_tile_animation_frame:
    ld c, a                         ; C = char code to search
    ld hl, anim_tile_table

.anim_search_loop:
    ld a, (hl)
    cp 255
    jr z, .anim_not_found
    cp c
    jr z, .anim_found_tile

    ld de, ANIM_TILE_ENTRY_SIZE
    add hl, de
    jr .anim_search_loop

.anim_found_tile:
    inc hl
    inc hl
    ld b, (hl)                      ; B = numFrames
    ld a, (anim_tile_frame)
.anim_found_mod:
    cp b
    jr c, .anim_found_done
    sub b
    jr .anim_found_mod
.anim_found_done:
    ret

.anim_not_found:
    xor a
    ret

; ==================================================================
; END OF ANIMATED TILES SYSTEM
; ==================================================================


; ==================================================================
; SCROLL SYSTEM
; File: scroll.asm
; Description: Viewport management and screen scrolling for large worlds
; ==================================================================

; ==================================================================
; SCROLL SYSTEM CONSTANTS
; ==================================================================

SCREEN_WIDTH_TILES      EQU 32      ; MSX Screen 2 width in tiles
SCREEN_HEIGHT_TILES     EQU 24      ; MSX Screen 2 height in tiles
SCREEN_WIDTH_PIXELS     EQU 256     ; MSX Screen 2 width in pixels
SCREEN_HEIGHT_PIXELS    EQU 192     ; MSX Screen 2 height in pixels

; Note: NAMETBL (#1800) is already defined in constants.asm

; ==================================================================
; SCROLL SYSTEM INITIALIZATION
; ==================================================================

init_scroll_system:
    ; Initialize camera to (0, 0)
    xor a
    ld (camera_x), a
    ld (camera_x + 1), a
    ld (camera_y), a
    ld (camera_y + 1), a
    ld (camera_tile_x), a
    ld (camera_tile_y), a

    ; Set world dimensions (will be updated by level loader)
    ld a, SCREEN_WIDTH_TILES
    ld (world_width_tiles), a
    ld a, SCREEN_HEIGHT_TILES
    ld (world_height_tiles), a

    ; Clear dirty flag
    xor a
    ld (scroll_dirty_flag), a

    ret

; ==================================================================
; CAMERA CONTROL FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; set_camera_position
; Set camera position in pixels (with bounds checking)
; Input:  HL = X position (pixels), DE = Y position (pixels)
; Destroys: AF, BC
; ------------------------------------------------------------------
set_camera_position:
    ; Bounds check X
    push hl
    push de

    ; Calculate max X = (world_width_tiles - SCREEN_WIDTH_TILES) * TILE_WIDTH
    ld a, (world_width_tiles)
    sub SCREEN_WIDTH_TILES
    jr c, .scroll_x_in_bounds   ; World smaller than screen

    ; A = tiles to scroll, multiply by tile width
    ld b, a
    ld a, 16
    call multiply_a_by_b        ; HL = max X

    ; Compare camera X with max X
    pop de
    pop bc                      ; BC = requested X
    push bc
    push de

    ; If requested X > max X, clamp to max X
    ld a, b
    cp h
    jr c, .scroll_x_clamped
    jr nz, .scroll_x_in_bounds
    ld a, c
    cp l
    jr c, .scroll_x_clamped
    jr .scroll_x_in_bounds

.scroll_x_clamped:
    ld b, h
    ld c, l
    jr .scroll_x_done

.scroll_x_in_bounds:
    pop de
    pop bc
    push bc
    push de

.scroll_x_done:
    ; Store camera X
    ld a, c
    ld (camera_x), a
    ld a, b
    ld (camera_x + 1), a

    ; Calculate camera_tile_x = camera_x / TILE_WIDTH
    
    ; Tile width is 16, shift right 4 times
    ld a, c
    srl b
    rra
    srl b
    rra
    srl b
    rra
    srl b
    rra
    ld (camera_tile_x), a

    ; Bounds check Y
    pop de                      ; DE = requested Y
    pop bc

    ; Calculate max Y = (world_height_tiles - SCREEN_HEIGHT_TILES) * TILE_HEIGHT
    ld a, (world_height_tiles)
    sub SCREEN_HEIGHT_TILES
    jr c, .scroll_y_in_bounds   ; World smaller than screen

    ld b, a
    ld a, 16
    call multiply_a_by_b        ; HL = max Y

    ; If requested Y > max Y, clamp to max Y
    ld a, d
    cp h
    jr c, .scroll_y_clamped
    jr nz, .scroll_y_in_bounds
    ld a, e
    cp l
    jr c, .scroll_y_clamped
    jr .scroll_y_in_bounds

.scroll_y_clamped:
    ld d, h
    ld e, l

.scroll_y_in_bounds:
    ; Store camera Y
    ld a, e
    ld (camera_y), a
    ld a, d
    ld (camera_y + 1), a

    ; Calculate camera_tile_y = camera_y / TILE_HEIGHT
    
    ; Tile height is 16, shift right 4 times
    ld a, e
    srl d
    rra
    srl d
    rra
    srl d
    rra
    srl d
    rra
    ld (camera_tile_y), a

    ; Mark viewport as dirty (needs redraw)
    ld a, 1
    ld (scroll_dirty_flag), a

    ret

; ------------------------------------------------------------------
; move_camera
; Move camera by delta (relative movement)
; Input:  B = delta X (signed), C = delta Y (signed)
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
move_camera:
    ; Get current camera position
    ld a, (camera_x)
    ld l, a
    ld a, (camera_x + 1)
    ld h, a                     ; HL = camera X

    ld a, (camera_y)
    ld e, a
    ld a, (camera_y + 1)
    ld d, a                     ; DE = camera Y

    ; Add delta X (signed 8-bit)
    ld a, b
    or a
    jp p, .move_positive_x      ; Positive delta

    ; Negative delta
    cpl
    inc a                       ; A = abs(delta)
    ld b, a
    ld a, l
    sub b
    ld l, a
    ld a, h
    sbc a, 0
    ld h, a
    jr .move_x_done

.move_positive_x:
    ld a, l
    add a, b
    ld l, a
    ld a, h
    adc a, 0
    ld h, a

.move_x_done:
    ; Add delta Y (signed 8-bit)
    ld a, c
    or a
    jp p, .move_positive_y

    ; Negative delta
    cpl
    inc a
    ld c, a
    ld a, e
    sub c
    ld e, a
    ld a, d
    sbc a, 0
    ld d, a
    jr .move_y_done

.move_positive_y:
    ld a, e
    add a, c
    ld e, a
    ld a, d
    adc a, 0
    ld d, a

.move_y_done:
    ; Set new camera position (with bounds checking)
    call set_camera_position
    ret

; ------------------------------------------------------------------
; center_camera_on_entity
; Center viewport on an entity (e.g. player)
; Input:  A = Entity index
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
center_camera_on_entity:
    ; Get entity position
    ld c, a
    ld b, 0
    ld hl, entity_x_pos
    add hl, bc
    ld a, (hl)                  ; A = entity X

    ld hl, entity_y_pos
    add hl, bc
    ld e, (hl)                  ; E = entity Y

    ; Calculate camera position to center entity
    ; camera_x = entity_x - (SCREEN_WIDTH / 2)
    sub 128                     ; Center horizontally
    ld l, a
    ld h, 0                     ; HL = camera X

    ; camera_y = entity_y - (SCREEN_HEIGHT / 2)
    ld a, e
    sub 96                      ; Center vertically
    ld e, a
    ld d, 0                     ; DE = camera Y

    ; Set camera position
    call set_camera_position
    ret

; ==================================================================
; VIEWPORT RENDERING
; ==================================================================

; ------------------------------------------------------------------
; update_scroll
; Update viewport if dirty flag is set
; Redraws visible tiles based on camera position
; ------------------------------------------------------------------
update_scroll:
    ; Check if viewport changed
    ld a, (scroll_dirty_flag)
    or a
    ret z                       ; Not dirty, nothing to do

    ; TODO: Implement efficient partial screen redraw
    ; For now: redraw entire visible area (simple but slow)
    call redraw_viewport

    ; Clear dirty flag
    xor a
    ld (scroll_dirty_flag), a
    ret

; ------------------------------------------------------------------
; redraw_viewport
; Redraw all visible tiles based on camera position
; This is the simple (slow) version that redraws everything
; ------------------------------------------------------------------
redraw_viewport:
    ; TODO: Implement full viewport redraw
    ; For each visible tile (32x24):
    ;   1. Calculate world tile coords (camera_tile + screen offset)
    ;   2. Read tile ID from world map
    ;   3. Write tile ID to Name Table

    ; Placeholder: Just return for now
    ret

; ==================================================================
; UTILITY FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; multiply_a_by_b
; Multiply A by B (unsigned 8-bit)
; Input:  A = multiplicand, B = multiplier
; Output: HL = result (16-bit)
; Destroys: AF, BC
; ------------------------------------------------------------------
multiply_a_by_b:
    ld hl, 0
    ld c, a
.scroll_mul_loop:
    ld a, b
    or a
    ret z
    add hl, bc
    dec b
    jr .scroll_mul_loop

; ==================================================================
; END OF SCROLL SYSTEM
; ==================================================================


; --- End of Bank 6 — pad to 8KB boundary ---
    ds #C000 - $, #FF

; ##################################################################
; FAR BANK 7 — [#6000h-#8000h] FAR CODE: entities
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank7 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-3). No far-to-far calls allowed.
; ##################################################################
    org #6000

; ==================================================================
; GAME ENTITIES
; File: entities.asm
; Description: Game entity definitions and behavior
; ==================================================================
;
; INTELLIGENT FILTERING ACTIVE:
;   Entity templates in project: 14
;   Actually instantiated: 14
;   Filtered out: 0 unused templates
;
; ==================================================================

; ==================================================================
; ENTITY DEFINITIONS
; ==================================================================

; Entity: Player 1 (instance from template: tpl_player)
ENTITY_PLAYER_1_ID EQU 0
ENTITY_PLAYER_1_COMP_MASK EQU #3FB  ; Component mask: 1111111011b
; Template: tpl_player
ENTITY_PLAYER_1_X EQU 25
ENTITY_PLAYER_1_Y EQU 9

; Entity: e_platform_multi 1 (instance from template: tpl_1761854826357_l38q3)
ENTITY_E_PLATFORM_MULTI_1_ID EQU 1
ENTITY_E_PLATFORM_MULTI_1_COMP_MASK EQU #0F  ; Component mask: 00001111b
; Template: tpl_1761854826357_l38q3
ENTITY_E_PLATFORM_MULTI_1_X EQU 10
ENTITY_E_PLATFORM_MULTI_1_Y EQU 4

; Entity: Box1 1 (instance from template: tpl_1762175003712_4xmw2)
ENTITY_BOX1_1_ID EQU 2
ENTITY_BOX1_1_COMP_MASK EQU #20B  ; Component mask: 1000001011b
; Template: tpl_1762175003712_4xmw2
ENTITY_BOX1_1_X EQU 18
ENTITY_BOX1_1_Y EQU 4

; Entity: Key Item 1 (instance from template: tpl_item_key)
ENTITY_KEY_ITEM_1_ID EQU 3
ENTITY_KEY_ITEM_1_COMP_MASK EQU #8B  ; Component mask: 10001011b
; Template: tpl_item_key
ENTITY_KEY_ITEM_1_X EQU 4
ENTITY_KEY_ITEM_1_Y EQU 6

; Entity: Gun 1 (instance from template: tpl_1762690119375_nbwd5)
ENTITY_GUN_1_ID EQU 4
ENTITY_GUN_1_COMP_MASK EQU #0B  ; Component mask: 00001011b
; Template: tpl_1762690119375_nbwd5
ENTITY_GUN_1_X EQU 9
ENTITY_GUN_1_Y EQU 12

; Entity: bazoka 1 (instance from template: tpl_1762707121832_rjlgc)
ENTITY_BAZOKA_1_ID EQU 5
ENTITY_BAZOKA_1_COMP_MASK EQU #0B  ; Component mask: 00001011b
; Template: tpl_1762707121832_rjlgc
ENTITY_BAZOKA_1_X EQU 3
ENTITY_BAZOKA_1_Y EQU 13

; Entity: Basic Enemy 1 (instance from template: tpl_enemy_basic)
ENTITY_BASIC_ENEMY_1_ID EQU 6
ENTITY_BASIC_ENEMY_1_COMP_MASK EQU #2EB  ; Component mask: 1011101011b
; Template: tpl_enemy_basic
ENTITY_BASIC_ENEMY_1_X EQU 13
ENTITY_BASIC_ENEMY_1_Y EQU 15

; Entity: Item (instance from template: tpl_item_key)
ENTITY_ITEM_ID EQU 7
ENTITY_ITEM_COMP_MASK EQU #8B  ; Component mask: 10001011b
; Template: tpl_item_key
ENTITY_ITEM_X EQU 17
ENTITY_ITEM_Y EQU 6

; Entity: Key Item 2 (instance from template: tpl_item_key)
ENTITY_KEY_ITEM_2_ID EQU 8
ENTITY_KEY_ITEM_2_COMP_MASK EQU #8B  ; Component mask: 10001011b
; Template: tpl_item_key
ENTITY_KEY_ITEM_2_X EQU 2
ENTITY_KEY_ITEM_2_Y EQU 8

; Entity: Key Item 3 (instance from template: tpl_item_key)
ENTITY_KEY_ITEM_3_ID EQU 9
ENTITY_KEY_ITEM_3_COMP_MASK EQU #8B  ; Component mask: 10001011b
; Template: tpl_item_key
ENTITY_KEY_ITEM_3_X EQU 9
ENTITY_KEY_ITEM_3_Y EQU 4

; Entity: Key Item 1 (instance from template: tpl_item_key)
ENTITY_KEY_ITEM_1_2_ID EQU 10
ENTITY_KEY_ITEM_1_2_COMP_MASK EQU #8B  ; Component mask: 10001011b
; Template: tpl_item_key
ENTITY_KEY_ITEM_1_2_X EQU 2
ENTITY_KEY_ITEM_1_2_Y EQU 4

; Entity: Key Item 2 (instance from template: tpl_item_key)
ENTITY_KEY_ITEM_2_2_ID EQU 11
ENTITY_KEY_ITEM_2_2_COMP_MASK EQU #8B  ; Component mask: 10001011b
; Template: tpl_item_key
ENTITY_KEY_ITEM_2_2_X EQU 29
ENTITY_KEY_ITEM_2_2_Y EQU 6

; Entity: Key Item 3 (instance from template: tpl_item_key)
ENTITY_KEY_ITEM_3_2_ID EQU 12
ENTITY_KEY_ITEM_3_2_COMP_MASK EQU #8B  ; Component mask: 10001011b
; Template: tpl_item_key
ENTITY_KEY_ITEM_3_2_X EQU 1
ENTITY_KEY_ITEM_3_2_Y EQU 18

; Entity: e_platform_multi 1 (instance from template: tpl_1761854826357_l38q3)
ENTITY_E_PLATFORM_MULTI_1_2_ID EQU 13
ENTITY_E_PLATFORM_MULTI_1_2_COMP_MASK EQU #0F  ; Component mask: 00001111b
; Template: tpl_1761854826357_l38q3
ENTITY_E_PLATFORM_MULTI_1_2_X EQU 2
ENTITY_E_PLATFORM_MULTI_1_2_Y EQU 3

; ==================================================================
; ENTITY MANAGEMENT FUNCTIONS
; ==================================================================

init_entities:
    ; Initialize all active game entities (14 entities)

    ; Ensure sprite system is reset whenever entities are initialized
    call init_sprites
    call init_player_fast_runtime

    ; CRITICAL: Clear ALL entity component masks to prevent ghost entities
    ; RAM may contain random data - entities 0..N will be set by create_entity
    ld hl, entity_comp_masks
    ld de, entity_comp_masks+1
    ld bc, 31                  ; Clear 32 bytes (32-1 for LDIR)
    ld (hl), 0
    ldir

    ld hl, entity_comp_masks_hi
    ld de, entity_comp_masks_hi+1
    ld bc, 31
    ld (hl), 0
    ldir

    ; Clear entity screen IDs to prevent ghost entities on restart
    ld hl, entity_screen_id
    ld de, entity_screen_id+1
    ld bc, 31
    ld (hl), 0
    ldir

    ; Clear entity player-role flags
    ld hl, entity_is_player
    ld de, entity_is_player+1
    ld bc, 31
    ld (hl), 0
    ldir

    ; Clear entity template tokens
    ld hl, entity_template_token
    ld de, entity_template_token+1
    ld bc, 31
    ld (hl), 0
    ldir

    ; Clear facing-direction cache so first-frame ChangeSprite does not
    ; redirect through stale RAM garbage from a previous run/screen.
    ld hl, entity_facing_dir
    ld de, entity_facing_dir+1
    ld bc, 31
    ld (hl), 0
    ldir
    
    ; Initialize State Machine variables (Clear to 0)
    ld hl, entity_sm_ptr_l
    ld de, entity_sm_ptr_l+1
    ld bc, 31
    ld (hl), 0
    ldir

    ld hl, entity_sm_ptr_h
    ld de, entity_sm_ptr_h+1
    ld bc, 31
    ld (hl), 0
    ldir

    ld hl, entity_sm_timer_l
    ld de, entity_sm_timer_l+1
    ld bc, 31
    ld (hl), 0
    ldir

    ld hl, entity_sm_timer_h
    ld de, entity_sm_timer_h+1
    ld bc, 31
    ld (hl), 0
    ldir

    ld hl, entity_sm_wait_timer
    ld de, entity_sm_wait_timer+1
    ld bc, 31
    ld (hl), 0
    ldir
    
    call init_player_1
    call init_e_platform_multi_1
    call init_box1_1
    call init_key_item_1
    call init_gun_1
    call init_bazoka_1
    call init_basic_enemy_1
    call init_item
    call init_key_item_2
    call init_key_item_3
    call init_key_item_1_2
    call init_key_item_2_2
    call init_key_item_3_2
    call init_e_platform_multi_1_2
    call init_player_from_hero_entity
    ret

update_entities:
    ; Update all active entities (14 entities)
    ; Skip entity update if entity belongs to another screen
    ld hl, entity_screen_id + 0
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_update_0
    ; Run per-entity update
    call update_player_1
.skip_update_0:
    ; Skip entity update if entity belongs to another screen
    ld hl, entity_screen_id + 1
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_update_1
    ; Run per-entity update
    call update_e_platform_multi_1
.skip_update_1:
    ; Skip entity update if entity belongs to another screen
    ld hl, entity_screen_id + 2
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_update_2
    ; Run per-entity update
    call update_box1_1
.skip_update_2:
    ; Skip entity update if entity belongs to another screen
    ld hl, entity_screen_id + 3
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_update_3
    ; Run per-entity update
    call update_key_item_1
.skip_update_3:
    ; Skip entity update if entity belongs to another screen
    ld hl, entity_screen_id + 4
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_update_4
    ; Run per-entity update
    call update_gun_1
.skip_update_4:
    ; Skip entity update if entity belongs to another screen
    ld hl, entity_screen_id + 5
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_update_5
    ; Run per-entity update
    call update_bazoka_1
.skip_update_5:
    ; Skip entity update if entity belongs to another screen
    ld hl, entity_screen_id + 6
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_update_6
    ; Run per-entity update
    call update_basic_enemy_1
.skip_update_6:
    ; Skip entity update if entity belongs to another screen
    ld hl, entity_screen_id + 7
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_update_7
    ; Run per-entity update
    call update_item
.skip_update_7:
    ; Skip entity update if entity belongs to another screen
    ld hl, entity_screen_id + 8
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_update_8
    ; Run per-entity update
    call update_key_item_2
.skip_update_8:
    ; Skip entity update if entity belongs to another screen
    ld hl, entity_screen_id + 9
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_update_9
    ; Run per-entity update
    call update_key_item_3
.skip_update_9:
    ; Skip entity update if entity belongs to another screen
    ld hl, entity_screen_id + 10
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_update_10
    ; Run per-entity update
    call update_key_item_1_2
.skip_update_10:
    ; Skip entity update if entity belongs to another screen
    ld hl, entity_screen_id + 11
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_update_11
    ; Run per-entity update
    call update_key_item_2_2
.skip_update_11:
    ; Skip entity update if entity belongs to another screen
    ld hl, entity_screen_id + 12
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_update_12
    ; Run per-entity update
    call update_key_item_3_2
.skip_update_12:
    ; Skip entity update if entity belongs to another screen
    ld hl, entity_screen_id + 13
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_update_13
    ; Run per-entity update
    call update_e_platform_multi_1_2
.skip_update_13:
    ret

init_player_1:
    ; Initialize Player 1 at real position from JSON
    ; JSON position: (25, 9) tiles = (200, 72) pixels
    ; Template: tpl_player
    ; Components: Position, Sprite, Collision, Input, Behavior, Health, Animation, Jump, Gravity
    ; Direction mask: #0F (1111b) = All directions

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ; Mask is 16-bit: B=low byte, C=high byte
    ld a, 0             ; Entity ID
    ld b, #FB              ; Mask low byte
    ld c, #03              ; Mask high byte
    call create_entity         ; Create with actual components from template

    ; Configure per-entity job cadence
    ; period: 1 frame(s), entry: 0
    ld a, 0
    ld b, 1
    ld c, 0
    call entity_job_set

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, 0             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), 200         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 72         ; Set real Y position from JSON

    ; Set entity screen ID (for multi-screen support)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), 0                 ; Screen ID (world node index / fallback screen index)

    ld hl, entity_is_player
    add hl, de
    ld (hl), 1                 ; Player/hero marker from template

    ; Template token for state-machine template-aware actions
    ld hl, entity_template_token
    add hl, de
    ld (hl), 1

    ; Deterministic spawn facing: right.
    ; This keeps the first SM ChangeSprite aligned with the same default
    ; world-facing direction used by Preview/runtime web.
    ld hl, entity_facing_dir
    add hl, de
    ld (hl), 2



    ; Initialize Animation component
    ld hl, entity_anim_frame
    add hl, de
    ld (hl), #00           ; currentFrameIndex

    ld hl, entity_anim_tick
    add hl, de
    ld (hl), 0                ; tick counter

    ld hl, entity_anim_speed
    add hl, de
    ld (hl), #08           ; animationSpeed

    ld hl, entity_anim_flags
    add hl, de
    ld (hl), #05           ; flags (playing/loop/onlyWhenMoving)



    ; Initialize Collision component (hitbox + layer masks)
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld (hl), #0E      ; hitboxWidth

    ld hl, entity_collision_hitbox_h
    add hl, de
    ld (hl), #0F      ; hitboxHeight

    ld hl, entity_collision_offset_x
    add hl, de
    ld (hl), #01      ; offsetX (1)

    ld hl, entity_collision_offset_y
    add hl, de
    ld (hl), #01      ; offsetY (1)

    ld hl, entity_collision_layer
    add hl, de
    ld (hl), #01      ; collisionLayer

    ld hl, entity_collides_with
    add hl, de
    ld (hl), #2E      ; collidesWith

    ; Set sprite pattern and color (renderable entity)
    ld hl, sprite_pattern
    add hl, de
    ld (hl), 0          ; Use entity index * 4 for 16x16 sprites

    ld hl, sprite_color
    add hl, de
    ld (hl), 2                ; Distinct color for debugging


    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #0F            ; Direction restrictions: All directions

    ; Set input speed for Cursors component (if entity has Input component)
    ld hl, entity_input_speed
    add hl, de
    ld (hl), 2            ; Cursor speed (px/frame)

    ; Set Jump component configuration
    ld hl, entity_jump_max
    add hl, de
    ld (hl), 1            ; Maximum jumps before touching ground


    ; Force update sprite attributes only if entity is in current screen
    ld hl, entity_screen_id + 0
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_force_show_0

    ; Force update sprite attributes (using correct multi-layer config)
    ld c, 0             ; Entity Index
    call force_update_entity_sprite
.skip_force_show_0:



    ; Initialize State Machine pointer to initial state (player_sm)
    ld hl, SM_player_sm_state_1761075124676          ; HL = initial state address
    ld a, l
    ld (entity_sm_ptr_l + 0), a   ; SM ptr low byte
    ld a, h
    ld (entity_sm_ptr_h + 0), a   ; SM ptr high byte

    ; Fire OnEnter of initial state immediately.
    ; Normally OnEnter fires via SM_ChangeState, but the first state is set
    ; directly (no transition). Without this call, ChangeSprite / other
    ; OnEnter actions never run and entity_sprite_asset_index stays at 0.
    ; State data layout: [ID:1][OnEnter ptr:2][OnExit ptr:2][Transitions ptr:2]
    ld hl, SM_player_sm_state_1761075124676 + 1      ; HL = &OnEnter Actions Ptr field
    ld e, (hl)
    inc hl
    ld d, (hl)                    ; DE = OnEnter Actions Ptr (0 if none)
    ld a, 0                ; A = entity index
    call SM_ExecuteActions        ; safe: SM_ExecuteActions returns immediately if DE=0

    ret

update_player_1:
    ; Update Player 1 logic with real behavior
    ; Check if entity has input component (player entities)
    ld a, 0
    ld hl, entity_comp_masks
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    ret z                      ; Skip if no input component

    ; This is a player entity - update based on input
    ; Input velocity is already calculated in UPDATE_INPUT_COMPONENT
    ; Position update happens in UPDATE_POSITION_COMPONENT
    ret

init_e_platform_multi_1:
    ; Initialize e_platform_multi 1 at real position from JSON
    ; JSON position: (10, 4) tiles = (80, 32) pixels
    ; Template: tpl_1761854826357_l38q3
    ; Components: Position, Sprite, Movement, Collision
    ; Direction mask: #0F (1111b) = All directions

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ; Mask is 16-bit: B=low byte, C=high byte
    ld a, 1             ; Entity ID
    ld b, #0F              ; Mask low byte
    ld c, #00              ; Mask high byte
    call create_entity         ; Create with actual components from template

    ; Configure per-entity job cadence
    ; period: 1 frame(s), entry: 0
    ld a, 1
    ld b, 1
    ld c, 0
    call entity_job_set

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, 1             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), 80         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 32         ; Set real Y position from JSON

    ; Set entity screen ID (for multi-screen support)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), 0                 ; Screen ID (world node index / fallback screen index)

    ld hl, entity_is_player
    add hl, de
    ld (hl), 0                 ; Player/hero marker from template

    ; Template token for state-machine template-aware actions
    ld hl, entity_template_token
    add hl, de
    ld (hl), 11




    ; === Patrol Component Init ===
    ; Waypoints: (189, 24) -> (0, 24)
    ; Override position with waypoint1
    ld hl, entity_x_pos
    add hl, de
    ld (hl), 189         ; Start X = waypoint1_x

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 24         ; Start Y = waypoint1_y

    ; Set patrol velocity
    ld hl, entity_vel_x
    add hl, de
    ld (hl), 255           ; VelX = -1

    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0           ; VelY = +0


    ; Initialize Collision component (hitbox + layer masks)
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld (hl), #10      ; hitboxWidth

    ld hl, entity_collision_hitbox_h
    add hl, de
    ld (hl), #10      ; hitboxHeight

    ld hl, entity_collision_offset_x
    add hl, de
    ld (hl), #00      ; offsetX (0)

    ld hl, entity_collision_offset_y
    add hl, de
    ld (hl), #00      ; offsetY (0)

    ld hl, entity_collision_layer
    add hl, de
    ld (hl), #08      ; collisionLayer

    ld hl, entity_collides_with
    add hl, de
    ld (hl), #01      ; collidesWith

    ; Set sprite pattern and color (renderable entity)
    ld hl, sprite_pattern
    add hl, de
    ld (hl), 4          ; Use entity index * 4 for 16x16 sprites

    ld hl, sprite_color
    add hl, de
    ld (hl), 3                ; Distinct color for debugging


    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #0F            ; Direction restrictions: All directions

    ; Set input speed for Cursors component (if entity has Input component)
    ld hl, entity_input_speed
    add hl, de
    ld (hl), 2            ; Cursor speed (px/frame)


    ; Force update sprite attributes only if entity is in current screen
    ld hl, entity_screen_id + 1
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_force_show_1

    ; Force update sprite attributes (using correct multi-layer config)
    ld c, 1             ; Entity Index
    call force_update_entity_sprite
.skip_force_show_1:



    ret

update_e_platform_multi_1:
    ; Update e_platform_multi 1 - Patrol bounce
    ; Waypoints: (189, 24) -> (0, 24)
    ld e, 1             ; Entity index
    ld d, 0

    ; --- X axis bounce ---
    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    or a
    jp z, .patrol_end_1
    bit 7, a
    jp nz, .patrol_chk_min_x_1

    ; Moving right: x >= 189?
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp 189
    jp c, .patrol_end_1
    ; Bounce: negate vel_x
    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    neg
    ld (hl), a
    jp .patrol_end_1

.patrol_chk_min_x_1:
    ; Moving left: x <= 0?
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp 1
    jp nc, .patrol_end_1
    ; Bounce: negate vel_x
    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    neg
    ld (hl), a

.patrol_end_1:
    ; Sync sprite facing with current patrol velocity
    call update_entity_patrol_facing
    ret

init_box1_1:
    ; Initialize Box1 1 at real position from JSON
    ; JSON position: (18, 4) tiles = (144, 32) pixels
    ; Template: tpl_1762175003712_4xmw2
    ; Components: Position, Sprite, Collision, Gravity
    ; Direction mask: #0F (1111b) = All directions

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ; Mask is 16-bit: B=low byte, C=high byte
    ld a, 2             ; Entity ID
    ld b, #0B              ; Mask low byte
    ld c, #02              ; Mask high byte
    call create_entity         ; Create with actual components from template

    ; Configure per-entity job cadence
    ; period: 1 frame(s), entry: 0
    ld a, 2
    ld b, 1
    ld c, 0
    call entity_job_set

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, 2             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), 144         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 32         ; Set real Y position from JSON

    ; Set entity screen ID (for multi-screen support)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), 0                 ; Screen ID (world node index / fallback screen index)

    ld hl, entity_is_player
    add hl, de
    ld (hl), 0                 ; Player/hero marker from template

    ; Template token for state-machine template-aware actions
    ld hl, entity_template_token
    add hl, de
    ld (hl), 12





    ; Initialize Collision component (hitbox + layer masks)
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld (hl), #10      ; hitboxWidth

    ld hl, entity_collision_hitbox_h
    add hl, de
    ld (hl), #10      ; hitboxHeight

    ld hl, entity_collision_offset_x
    add hl, de
    ld (hl), #00      ; offsetX (0)

    ld hl, entity_collision_offset_y
    add hl, de
    ld (hl), #00      ; offsetY (0)

    ld hl, entity_collision_layer
    add hl, de
    ld (hl), #04      ; collisionLayer

    ld hl, entity_collides_with
    add hl, de
    ld (hl), #FF      ; collidesWith

    ; Set sprite pattern and color (renderable entity)
    ld hl, sprite_pattern
    add hl, de
    ld (hl), 8          ; Use entity index * 4 for 16x16 sprites

    ld hl, sprite_color
    add hl, de
    ld (hl), 4                ; Distinct color for debugging


    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #0F            ; Direction restrictions: All directions

    ; Set input speed for Cursors component (if entity has Input component)
    ld hl, entity_input_speed
    add hl, de
    ld (hl), 2            ; Cursor speed (px/frame)


    ; Force update sprite attributes only if entity is in current screen
    ld hl, entity_screen_id + 2
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_force_show_2

    ; Force update sprite attributes (using correct multi-layer config)
    ld c, 2             ; Entity Index
    call force_update_entity_sprite
.skip_force_show_2:



    ; Initialize State Machine pointer to initial state (box_sm)
    ld hl, SM_box_sm_state_1762195655252          ; HL = initial state address
    ld a, l
    ld (entity_sm_ptr_l + 2), a   ; SM ptr low byte
    ld a, h
    ld (entity_sm_ptr_h + 2), a   ; SM ptr high byte

    ; Fire OnEnter of initial state immediately.
    ; Normally OnEnter fires via SM_ChangeState, but the first state is set
    ; directly (no transition). Without this call, ChangeSprite / other
    ; OnEnter actions never run and entity_sprite_asset_index stays at 0.
    ; State data layout: [ID:1][OnEnter ptr:2][OnExit ptr:2][Transitions ptr:2]
    ld hl, SM_box_sm_state_1762195655252 + 1      ; HL = &OnEnter Actions Ptr field
    ld e, (hl)
    inc hl
    ld d, (hl)                    ; DE = OnEnter Actions Ptr (0 if none)
    ld a, 2                ; A = entity index
    call SM_ExecuteActions        ; safe: SM_ExecuteActions returns immediately if DE=0

    ret

update_box1_1:
    ; Update Box1 1 logic with real behavior
    ; Check if entity has input component (player entities)
    ld a, 2
    ld hl, entity_comp_masks
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    ret z                      ; Skip if no input component

    ; This is a player entity - update based on input
    ; Input velocity is already calculated in UPDATE_INPUT_COMPONENT
    ; Position update happens in UPDATE_POSITION_COMPONENT
    ret

init_key_item_1:
    ; Initialize Key Item 1 at real position from JSON
    ; JSON position: (4, 6) tiles = (32, 48) pixels
    ; Template: tpl_item_key
    ; Components: Position, Sprite, Collision, Animation
    ; Direction mask: #0F (1111b) = All directions

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ; Mask is 16-bit: B=low byte, C=high byte
    ld a, 3             ; Entity ID
    ld b, #8B              ; Mask low byte
    ld c, #00              ; Mask high byte
    call create_entity         ; Create with actual components from template

    ; Configure per-entity job cadence
    ; period: 1 frame(s), entry: 0
    ld a, 3
    ld b, 1
    ld c, 0
    call entity_job_set

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, 3             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), 32         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 48         ; Set real Y position from JSON

    ; Set entity screen ID (for multi-screen support)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), 0                 ; Screen ID (world node index / fallback screen index)

    ld hl, entity_is_player
    add hl, de
    ld (hl), 0                 ; Player/hero marker from template

    ; Template token for state-machine template-aware actions
    ld hl, entity_template_token
    add hl, de
    ld (hl), 3



    ; Initialize Animation component
    ld hl, entity_anim_frame
    add hl, de
    ld (hl), #00           ; currentFrameIndex

    ld hl, entity_anim_tick
    add hl, de
    ld (hl), 0                ; tick counter

    ld hl, entity_anim_speed
    add hl, de
    ld (hl), #0F           ; animationSpeed

    ld hl, entity_anim_flags
    add hl, de
    ld (hl), #03           ; flags (playing/loop/onlyWhenMoving)



    ; Initialize Collision component (hitbox + layer masks)
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld (hl), #10      ; hitboxWidth

    ld hl, entity_collision_hitbox_h
    add hl, de
    ld (hl), #10      ; hitboxHeight

    ld hl, entity_collision_offset_x
    add hl, de
    ld (hl), #00      ; offsetX (0)

    ld hl, entity_collision_offset_y
    add hl, de
    ld (hl), #00      ; offsetY (0)

    ld hl, entity_collision_layer
    add hl, de
    ld (hl), #20      ; collisionLayer

    ld hl, entity_collides_with
    add hl, de
    ld (hl), #01      ; collidesWith

    ; Set sprite pattern and color (renderable entity)
    ld hl, sprite_pattern
    add hl, de
    ld (hl), 12          ; Use entity index * 4 for 16x16 sprites

    ld hl, sprite_color
    add hl, de
    ld (hl), 5                ; Distinct color for debugging


    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #0F            ; Direction restrictions: All directions

    ; Set input speed for Cursors component (if entity has Input component)
    ld hl, entity_input_speed
    add hl, de
    ld (hl), 2            ; Cursor speed (px/frame)


    ; Force update sprite attributes only if entity is in current screen
    ld hl, entity_screen_id + 3
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_force_show_3

    ; Force update sprite attributes (using correct multi-layer config)
    ld c, 3             ; Entity Index
    call force_update_entity_sprite
.skip_force_show_3:



    ret

update_key_item_1:
    ; Update Key Item 1 logic with real behavior
    ; Check if entity has input component (player entities)
    ld a, 3
    ld hl, entity_comp_masks
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    ret z                      ; Skip if no input component

    ; This is a player entity - update based on input
    ; Input velocity is already calculated in UPDATE_INPUT_COMPONENT
    ; Position update happens in UPDATE_POSITION_COMPONENT
    ret

init_gun_1:
    ; Initialize Gun 1 at real position from JSON
    ; JSON position: (9, 12) tiles = (72, 96) pixels
    ; Template: tpl_1762690119375_nbwd5
    ; Components: Position, Sprite, Collision
    ; Direction mask: #0F (1111b) = All directions

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ; Mask is 16-bit: B=low byte, C=high byte
    ld a, 4             ; Entity ID
    ld b, #0B              ; Mask low byte
    ld c, #00              ; Mask high byte
    call create_entity         ; Create with actual components from template

    ; Configure per-entity job cadence
    ; period: 1 frame(s), entry: 0
    ld a, 4
    ld b, 1
    ld c, 0
    call entity_job_set

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, 4             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), 72         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 96         ; Set real Y position from JSON

    ; Set entity screen ID (for multi-screen support)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), 0                 ; Screen ID (world node index / fallback screen index)

    ld hl, entity_is_player
    add hl, de
    ld (hl), 0                 ; Player/hero marker from template

    ; Template token for state-machine template-aware actions
    ld hl, entity_template_token
    add hl, de
    ld (hl), 13





    ; Initialize Collision component (hitbox + layer masks)
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld (hl), #10      ; hitboxWidth

    ld hl, entity_collision_hitbox_h
    add hl, de
    ld (hl), #10      ; hitboxHeight

    ld hl, entity_collision_offset_x
    add hl, de
    ld (hl), #00      ; offsetX (0)

    ld hl, entity_collision_offset_y
    add hl, de
    ld (hl), #00      ; offsetY (0)

    ld hl, entity_collision_layer
    add hl, de
    ld (hl), #04      ; collisionLayer

    ld hl, entity_collides_with
    add hl, de
    ld (hl), #01      ; collidesWith

    ; Set sprite pattern and color (renderable entity)
    ld hl, sprite_pattern
    add hl, de
    ld (hl), 16          ; Use entity index * 4 for 16x16 sprites

    ld hl, sprite_color
    add hl, de
    ld (hl), 6                ; Distinct color for debugging


    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #0F            ; Direction restrictions: All directions

    ; Set input speed for Cursors component (if entity has Input component)
    ld hl, entity_input_speed
    add hl, de
    ld (hl), 2            ; Cursor speed (px/frame)


    ; Force update sprite attributes only if entity is in current screen
    ld hl, entity_screen_id + 4
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_force_show_4

    ; Force update sprite attributes (using correct multi-layer config)
    ld c, 4             ; Entity Index
    call force_update_entity_sprite
.skip_force_show_4:



    ret

update_gun_1:
    ; Update Gun 1 logic with real behavior
    ; Check if entity has input component (player entities)
    ld a, 4
    ld hl, entity_comp_masks
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    ret z                      ; Skip if no input component

    ; This is a player entity - update based on input
    ; Input velocity is already calculated in UPDATE_INPUT_COMPONENT
    ; Position update happens in UPDATE_POSITION_COMPONENT
    ret

init_bazoka_1:
    ; Initialize bazoka 1 at real position from JSON
    ; JSON position: (3, 13) tiles = (24, 104) pixels
    ; Template: tpl_1762707121832_rjlgc
    ; Components: Position, Sprite, Collision
    ; Direction mask: #0F (1111b) = All directions

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ; Mask is 16-bit: B=low byte, C=high byte
    ld a, 5             ; Entity ID
    ld b, #0B              ; Mask low byte
    ld c, #00              ; Mask high byte
    call create_entity         ; Create with actual components from template

    ; Configure per-entity job cadence
    ; period: 1 frame(s), entry: 0
    ld a, 5
    ld b, 1
    ld c, 0
    call entity_job_set

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, 5             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), 24         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 104         ; Set real Y position from JSON

    ; Set entity screen ID (for multi-screen support)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), 0                 ; Screen ID (world node index / fallback screen index)

    ld hl, entity_is_player
    add hl, de
    ld (hl), 0                 ; Player/hero marker from template

    ; Template token for state-machine template-aware actions
    ld hl, entity_template_token
    add hl, de
    ld (hl), 14





    ; Initialize Collision component (hitbox + layer masks)
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld (hl), #10      ; hitboxWidth

    ld hl, entity_collision_hitbox_h
    add hl, de
    ld (hl), #10      ; hitboxHeight

    ld hl, entity_collision_offset_x
    add hl, de
    ld (hl), #00      ; offsetX (0)

    ld hl, entity_collision_offset_y
    add hl, de
    ld (hl), #00      ; offsetY (0)

    ld hl, entity_collision_layer
    add hl, de
    ld (hl), #04      ; collisionLayer

    ld hl, entity_collides_with
    add hl, de
    ld (hl), #01      ; collidesWith

    ; Set sprite pattern and color (renderable entity)
    ld hl, sprite_pattern
    add hl, de
    ld (hl), 20          ; Use entity index * 4 for 16x16 sprites

    ld hl, sprite_color
    add hl, de
    ld (hl), 7                ; Distinct color for debugging


    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #0F            ; Direction restrictions: All directions

    ; Set input speed for Cursors component (if entity has Input component)
    ld hl, entity_input_speed
    add hl, de
    ld (hl), 2            ; Cursor speed (px/frame)


    ; Force update sprite attributes only if entity is in current screen
    ld hl, entity_screen_id + 5
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_force_show_5

    ; Force update sprite attributes (using correct multi-layer config)
    ld c, 5             ; Entity Index
    call force_update_entity_sprite
.skip_force_show_5:



    ret

update_bazoka_1:
    ; Update bazoka 1 logic with real behavior
    ; Check if entity has input component (player entities)
    ld a, 5
    ld hl, entity_comp_masks
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    ret z                      ; Skip if no input component

    ; This is a player entity - update based on input
    ; Input velocity is already calculated in UPDATE_INPUT_COMPONENT
    ; Position update happens in UPDATE_POSITION_COMPONENT
    ret

init_basic_enemy_1:
    ; Initialize Basic Enemy 1 at real position from JSON
    ; JSON position: (13, 15) tiles = (104, 120) pixels
    ; Template: tpl_enemy_basic
    ; Components: Position, Sprite, Collision, Behavior, Health, Animation, Gravity
    ; Direction mask: #0F (1111b) = All directions

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ; Mask is 16-bit: B=low byte, C=high byte
    ld a, 6             ; Entity ID
    ld b, #EB              ; Mask low byte
    ld c, #02              ; Mask high byte
    call create_entity         ; Create with actual components from template

    ; Configure per-entity job cadence
    ; period: 1 frame(s), entry: 0
    ld a, 6
    ld b, 1
    ld c, 0
    call entity_job_set

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, 6             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), 104         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 120         ; Set real Y position from JSON

    ; Set entity screen ID (for multi-screen support)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), 1                 ; Screen ID (world node index / fallback screen index)

    ld hl, entity_is_player
    add hl, de
    ld (hl), 0                 ; Player/hero marker from template

    ; Template token for state-machine template-aware actions
    ld hl, entity_template_token
    add hl, de
    ld (hl), 2



    ; Initialize Animation component
    ld hl, entity_anim_frame
    add hl, de
    ld (hl), #00           ; currentFrameIndex

    ld hl, entity_anim_tick
    add hl, de
    ld (hl), 0                ; tick counter

    ld hl, entity_anim_speed
    add hl, de
    ld (hl), #0A           ; animationSpeed

    ld hl, entity_anim_flags
    add hl, de
    ld (hl), #03           ; flags (playing/loop/onlyWhenMoving)



    ; Initialize Collision component (hitbox + layer masks)
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld (hl), #10      ; hitboxWidth

    ld hl, entity_collision_hitbox_h
    add hl, de
    ld (hl), #10      ; hitboxHeight

    ld hl, entity_collision_offset_x
    add hl, de
    ld (hl), #00      ; offsetX (0)

    ld hl, entity_collision_offset_y
    add hl, de
    ld (hl), #00      ; offsetY (0)

    ld hl, entity_collision_layer
    add hl, de
    ld (hl), #02      ; collisionLayer

    ld hl, entity_collides_with
    add hl, de
    ld (hl), #01      ; collidesWith

    ; Set sprite pattern and color (renderable entity)
    ld hl, sprite_pattern
    add hl, de
    ld (hl), 24          ; Use entity index * 4 for 16x16 sprites

    ld hl, sprite_color
    add hl, de
    ld (hl), 8                ; Distinct color for debugging


    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #0F            ; Direction restrictions: All directions

    ; Set input speed for Cursors component (if entity has Input component)
    ld hl, entity_input_speed
    add hl, de
    ld (hl), 2            ; Cursor speed (px/frame)


    ; Force update sprite attributes only if entity is in current screen
    ld hl, entity_screen_id + 6
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_force_show_6

    ; Force update sprite attributes (using correct multi-layer config)
    ld c, 6             ; Entity Index
    call force_update_entity_sprite
.skip_force_show_6:



    ret

update_basic_enemy_1:
    ; Update Basic Enemy 1 logic with real behavior
    ; Check if entity has input component (player entities)
    ld a, 6
    ld hl, entity_comp_masks
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    ret z                      ; Skip if no input component

    ; This is a player entity - update based on input
    ; Input velocity is already calculated in UPDATE_INPUT_COMPONENT
    ; Position update happens in UPDATE_POSITION_COMPONENT
    ret

init_item:
    ; Initialize Item at real position from JSON
    ; JSON position: (17, 6) tiles = (136, 48) pixels
    ; Template: tpl_item_key
    ; Components: Position, Sprite, Collision, Animation
    ; Direction mask: #0F (1111b) = All directions

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ; Mask is 16-bit: B=low byte, C=high byte
    ld a, 7             ; Entity ID
    ld b, #8B              ; Mask low byte
    ld c, #00              ; Mask high byte
    call create_entity         ; Create with actual components from template

    ; Configure per-entity job cadence
    ; period: 1 frame(s), entry: 0
    ld a, 7
    ld b, 1
    ld c, 0
    call entity_job_set

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, 7             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), 136         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 48         ; Set real Y position from JSON

    ; Set entity screen ID (for multi-screen support)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), 2                 ; Screen ID (world node index / fallback screen index)

    ld hl, entity_is_player
    add hl, de
    ld (hl), 0                 ; Player/hero marker from template

    ; Template token for state-machine template-aware actions
    ld hl, entity_template_token
    add hl, de
    ld (hl), 3



    ; Initialize Animation component
    ld hl, entity_anim_frame
    add hl, de
    ld (hl), #00           ; currentFrameIndex

    ld hl, entity_anim_tick
    add hl, de
    ld (hl), 0                ; tick counter

    ld hl, entity_anim_speed
    add hl, de
    ld (hl), #0F           ; animationSpeed

    ld hl, entity_anim_flags
    add hl, de
    ld (hl), #03           ; flags (playing/loop/onlyWhenMoving)



    ; Initialize Collision component (hitbox + layer masks)
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld (hl), #10      ; hitboxWidth

    ld hl, entity_collision_hitbox_h
    add hl, de
    ld (hl), #10      ; hitboxHeight

    ld hl, entity_collision_offset_x
    add hl, de
    ld (hl), #00      ; offsetX (0)

    ld hl, entity_collision_offset_y
    add hl, de
    ld (hl), #00      ; offsetY (0)

    ld hl, entity_collision_layer
    add hl, de
    ld (hl), #20      ; collisionLayer

    ld hl, entity_collides_with
    add hl, de
    ld (hl), #01      ; collidesWith

    ; Set sprite pattern and color (renderable entity)
    ld hl, sprite_pattern
    add hl, de
    ld (hl), 28          ; Use entity index * 4 for 16x16 sprites

    ld hl, sprite_color
    add hl, de
    ld (hl), 9                ; Distinct color for debugging


    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #0F            ; Direction restrictions: All directions

    ; Set input speed for Cursors component (if entity has Input component)
    ld hl, entity_input_speed
    add hl, de
    ld (hl), 2            ; Cursor speed (px/frame)


    ; Force update sprite attributes only if entity is in current screen
    ld hl, entity_screen_id + 7
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_force_show_7

    ; Force update sprite attributes (using correct multi-layer config)
    ld c, 7             ; Entity Index
    call force_update_entity_sprite
.skip_force_show_7:



    ret

update_item:
    ; Update Item logic with real behavior
    ; Check if entity has input component (player entities)
    ld a, 7
    ld hl, entity_comp_masks
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    ret z                      ; Skip if no input component

    ; This is a player entity - update based on input
    ; Input velocity is already calculated in UPDATE_INPUT_COMPONENT
    ; Position update happens in UPDATE_POSITION_COMPONENT
    ret

init_key_item_2:
    ; Initialize Key Item 2 at real position from JSON
    ; JSON position: (2, 8) tiles = (16, 64) pixels
    ; Template: tpl_item_key
    ; Components: Position, Sprite, Collision, Animation
    ; Direction mask: #0F (1111b) = All directions

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ; Mask is 16-bit: B=low byte, C=high byte
    ld a, 8             ; Entity ID
    ld b, #8B              ; Mask low byte
    ld c, #00              ; Mask high byte
    call create_entity         ; Create with actual components from template

    ; Configure per-entity job cadence
    ; period: 1 frame(s), entry: 0
    ld a, 8
    ld b, 1
    ld c, 0
    call entity_job_set

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, 8             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), 16         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 64         ; Set real Y position from JSON

    ; Set entity screen ID (for multi-screen support)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), 2                 ; Screen ID (world node index / fallback screen index)

    ld hl, entity_is_player
    add hl, de
    ld (hl), 0                 ; Player/hero marker from template

    ; Template token for state-machine template-aware actions
    ld hl, entity_template_token
    add hl, de
    ld (hl), 3



    ; Initialize Animation component
    ld hl, entity_anim_frame
    add hl, de
    ld (hl), #00           ; currentFrameIndex

    ld hl, entity_anim_tick
    add hl, de
    ld (hl), 0                ; tick counter

    ld hl, entity_anim_speed
    add hl, de
    ld (hl), #0F           ; animationSpeed

    ld hl, entity_anim_flags
    add hl, de
    ld (hl), #03           ; flags (playing/loop/onlyWhenMoving)



    ; Initialize Collision component (hitbox + layer masks)
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld (hl), #10      ; hitboxWidth

    ld hl, entity_collision_hitbox_h
    add hl, de
    ld (hl), #10      ; hitboxHeight

    ld hl, entity_collision_offset_x
    add hl, de
    ld (hl), #00      ; offsetX (0)

    ld hl, entity_collision_offset_y
    add hl, de
    ld (hl), #00      ; offsetY (0)

    ld hl, entity_collision_layer
    add hl, de
    ld (hl), #20      ; collisionLayer

    ld hl, entity_collides_with
    add hl, de
    ld (hl), #01      ; collidesWith

    ; Set sprite pattern and color (renderable entity)
    ld hl, sprite_pattern
    add hl, de
    ld (hl), 32          ; Use entity index * 4 for 16x16 sprites

    ld hl, sprite_color
    add hl, de
    ld (hl), 10                ; Distinct color for debugging


    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #0F            ; Direction restrictions: All directions

    ; Set input speed for Cursors component (if entity has Input component)
    ld hl, entity_input_speed
    add hl, de
    ld (hl), 2            ; Cursor speed (px/frame)


    ; Force update sprite attributes only if entity is in current screen
    ld hl, entity_screen_id + 8
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_force_show_8

    ; Force update sprite attributes (using correct multi-layer config)
    ld c, 8             ; Entity Index
    call force_update_entity_sprite
.skip_force_show_8:



    ret

update_key_item_2:
    ; Update Key Item 2 logic with real behavior
    ; Check if entity has input component (player entities)
    ld a, 8
    ld hl, entity_comp_masks
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    ret z                      ; Skip if no input component

    ; This is a player entity - update based on input
    ; Input velocity is already calculated in UPDATE_INPUT_COMPONENT
    ; Position update happens in UPDATE_POSITION_COMPONENT
    ret

init_key_item_3:
    ; Initialize Key Item 3 at real position from JSON
    ; JSON position: (9, 4) tiles = (72, 32) pixels
    ; Template: tpl_item_key
    ; Components: Position, Sprite, Collision, Animation
    ; Direction mask: #0F (1111b) = All directions

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ; Mask is 16-bit: B=low byte, C=high byte
    ld a, 9             ; Entity ID
    ld b, #8B              ; Mask low byte
    ld c, #00              ; Mask high byte
    call create_entity         ; Create with actual components from template

    ; Configure per-entity job cadence
    ; period: 1 frame(s), entry: 0
    ld a, 9
    ld b, 1
    ld c, 0
    call entity_job_set

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, 9             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), 72         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 32         ; Set real Y position from JSON

    ; Set entity screen ID (for multi-screen support)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), 2                 ; Screen ID (world node index / fallback screen index)

    ld hl, entity_is_player
    add hl, de
    ld (hl), 0                 ; Player/hero marker from template

    ; Template token for state-machine template-aware actions
    ld hl, entity_template_token
    add hl, de
    ld (hl), 3



    ; Initialize Animation component
    ld hl, entity_anim_frame
    add hl, de
    ld (hl), #00           ; currentFrameIndex

    ld hl, entity_anim_tick
    add hl, de
    ld (hl), 0                ; tick counter

    ld hl, entity_anim_speed
    add hl, de
    ld (hl), #0F           ; animationSpeed

    ld hl, entity_anim_flags
    add hl, de
    ld (hl), #03           ; flags (playing/loop/onlyWhenMoving)



    ; Initialize Collision component (hitbox + layer masks)
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld (hl), #10      ; hitboxWidth

    ld hl, entity_collision_hitbox_h
    add hl, de
    ld (hl), #10      ; hitboxHeight

    ld hl, entity_collision_offset_x
    add hl, de
    ld (hl), #00      ; offsetX (0)

    ld hl, entity_collision_offset_y
    add hl, de
    ld (hl), #00      ; offsetY (0)

    ld hl, entity_collision_layer
    add hl, de
    ld (hl), #20      ; collisionLayer

    ld hl, entity_collides_with
    add hl, de
    ld (hl), #01      ; collidesWith

    ; Set sprite pattern and color (renderable entity)
    ld hl, sprite_pattern
    add hl, de
    ld (hl), 36          ; Use entity index * 4 for 16x16 sprites

    ld hl, sprite_color
    add hl, de
    ld (hl), 11                ; Distinct color for debugging


    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #0F            ; Direction restrictions: All directions

    ; Set input speed for Cursors component (if entity has Input component)
    ld hl, entity_input_speed
    add hl, de
    ld (hl), 2            ; Cursor speed (px/frame)


    ; Force update sprite attributes only if entity is in current screen
    ld hl, entity_screen_id + 9
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_force_show_9

    ; Force update sprite attributes (using correct multi-layer config)
    ld c, 9             ; Entity Index
    call force_update_entity_sprite
.skip_force_show_9:



    ret

update_key_item_3:
    ; Update Key Item 3 logic with real behavior
    ; Check if entity has input component (player entities)
    ld a, 9
    ld hl, entity_comp_masks
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    ret z                      ; Skip if no input component

    ; This is a player entity - update based on input
    ; Input velocity is already calculated in UPDATE_INPUT_COMPONENT
    ; Position update happens in UPDATE_POSITION_COMPONENT
    ret

init_key_item_1_2:
    ; Initialize Key Item 1 at real position from JSON
    ; JSON position: (2, 4) tiles = (16, 32) pixels
    ; Template: tpl_item_key
    ; Components: Position, Sprite, Collision, Animation
    ; Direction mask: #0F (1111b) = All directions

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ; Mask is 16-bit: B=low byte, C=high byte
    ld a, 10             ; Entity ID
    ld b, #8B              ; Mask low byte
    ld c, #00              ; Mask high byte
    call create_entity         ; Create with actual components from template

    ; Configure per-entity job cadence
    ; period: 1 frame(s), entry: 0
    ld a, 10
    ld b, 1
    ld c, 0
    call entity_job_set

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, 10             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), 16         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 32         ; Set real Y position from JSON

    ; Set entity screen ID (for multi-screen support)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), 4                 ; Screen ID (world node index / fallback screen index)

    ld hl, entity_is_player
    add hl, de
    ld (hl), 0                 ; Player/hero marker from template

    ; Template token for state-machine template-aware actions
    ld hl, entity_template_token
    add hl, de
    ld (hl), 3



    ; Initialize Animation component
    ld hl, entity_anim_frame
    add hl, de
    ld (hl), #00           ; currentFrameIndex

    ld hl, entity_anim_tick
    add hl, de
    ld (hl), 0                ; tick counter

    ld hl, entity_anim_speed
    add hl, de
    ld (hl), #0F           ; animationSpeed

    ld hl, entity_anim_flags
    add hl, de
    ld (hl), #03           ; flags (playing/loop/onlyWhenMoving)



    ; Initialize Collision component (hitbox + layer masks)
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld (hl), #10      ; hitboxWidth

    ld hl, entity_collision_hitbox_h
    add hl, de
    ld (hl), #10      ; hitboxHeight

    ld hl, entity_collision_offset_x
    add hl, de
    ld (hl), #00      ; offsetX (0)

    ld hl, entity_collision_offset_y
    add hl, de
    ld (hl), #00      ; offsetY (0)

    ld hl, entity_collision_layer
    add hl, de
    ld (hl), #20      ; collisionLayer

    ld hl, entity_collides_with
    add hl, de
    ld (hl), #01      ; collidesWith

    ; Set sprite pattern and color (renderable entity)
    ld hl, sprite_pattern
    add hl, de
    ld (hl), 40          ; Use entity index * 4 for 16x16 sprites

    ld hl, sprite_color
    add hl, de
    ld (hl), 12                ; Distinct color for debugging


    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #0F            ; Direction restrictions: All directions

    ; Set input speed for Cursors component (if entity has Input component)
    ld hl, entity_input_speed
    add hl, de
    ld (hl), 2            ; Cursor speed (px/frame)


    ; Force update sprite attributes only if entity is in current screen
    ld hl, entity_screen_id + 10
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_force_show_10

    ; Force update sprite attributes (using correct multi-layer config)
    ld c, 10             ; Entity Index
    call force_update_entity_sprite
.skip_force_show_10:



    ret

update_key_item_1_2:
    ; Update Key Item 1 logic with real behavior
    ; Check if entity has input component (player entities)
    ld a, 10
    ld hl, entity_comp_masks
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    ret z                      ; Skip if no input component

    ; This is a player entity - update based on input
    ; Input velocity is already calculated in UPDATE_INPUT_COMPONENT
    ; Position update happens in UPDATE_POSITION_COMPONENT
    ret

init_key_item_2_2:
    ; Initialize Key Item 2 at real position from JSON
    ; JSON position: (29, 6) tiles = (232, 48) pixels
    ; Template: tpl_item_key
    ; Components: Position, Sprite, Collision, Animation
    ; Direction mask: #0F (1111b) = All directions

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ; Mask is 16-bit: B=low byte, C=high byte
    ld a, 11             ; Entity ID
    ld b, #8B              ; Mask low byte
    ld c, #00              ; Mask high byte
    call create_entity         ; Create with actual components from template

    ; Configure per-entity job cadence
    ; period: 1 frame(s), entry: 0
    ld a, 11
    ld b, 1
    ld c, 0
    call entity_job_set

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, 11             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), 232         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 48         ; Set real Y position from JSON

    ; Set entity screen ID (for multi-screen support)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), 4                 ; Screen ID (world node index / fallback screen index)

    ld hl, entity_is_player
    add hl, de
    ld (hl), 0                 ; Player/hero marker from template

    ; Template token for state-machine template-aware actions
    ld hl, entity_template_token
    add hl, de
    ld (hl), 3



    ; Initialize Animation component
    ld hl, entity_anim_frame
    add hl, de
    ld (hl), #00           ; currentFrameIndex

    ld hl, entity_anim_tick
    add hl, de
    ld (hl), 0                ; tick counter

    ld hl, entity_anim_speed
    add hl, de
    ld (hl), #0F           ; animationSpeed

    ld hl, entity_anim_flags
    add hl, de
    ld (hl), #03           ; flags (playing/loop/onlyWhenMoving)



    ; Initialize Collision component (hitbox + layer masks)
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld (hl), #10      ; hitboxWidth

    ld hl, entity_collision_hitbox_h
    add hl, de
    ld (hl), #10      ; hitboxHeight

    ld hl, entity_collision_offset_x
    add hl, de
    ld (hl), #00      ; offsetX (0)

    ld hl, entity_collision_offset_y
    add hl, de
    ld (hl), #00      ; offsetY (0)

    ld hl, entity_collision_layer
    add hl, de
    ld (hl), #20      ; collisionLayer

    ld hl, entity_collides_with
    add hl, de
    ld (hl), #01      ; collidesWith

    ; Set sprite pattern and color (renderable entity)
    ld hl, sprite_pattern
    add hl, de
    ld (hl), 44          ; Use entity index * 4 for 16x16 sprites

    ld hl, sprite_color
    add hl, de
    ld (hl), 13                ; Distinct color for debugging


    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #0F            ; Direction restrictions: All directions

    ; Set input speed for Cursors component (if entity has Input component)
    ld hl, entity_input_speed
    add hl, de
    ld (hl), 2            ; Cursor speed (px/frame)


    ; Force update sprite attributes only if entity is in current screen
    ld hl, entity_screen_id + 11
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_force_show_11

    ; Force update sprite attributes (using correct multi-layer config)
    ld c, 11             ; Entity Index
    call force_update_entity_sprite
.skip_force_show_11:



    ret

update_key_item_2_2:
    ; Update Key Item 2 logic with real behavior
    ; Check if entity has input component (player entities)
    ld a, 11
    ld hl, entity_comp_masks
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    ret z                      ; Skip if no input component

    ; This is a player entity - update based on input
    ; Input velocity is already calculated in UPDATE_INPUT_COMPONENT
    ; Position update happens in UPDATE_POSITION_COMPONENT
    ret

init_key_item_3_2:
    ; Initialize Key Item 3 at real position from JSON
    ; JSON position: (1, 18) tiles = (8, 144) pixels
    ; Template: tpl_item_key
    ; Components: Position, Sprite, Collision, Animation
    ; Direction mask: #0F (1111b) = All directions

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ; Mask is 16-bit: B=low byte, C=high byte
    ld a, 12             ; Entity ID
    ld b, #8B              ; Mask low byte
    ld c, #00              ; Mask high byte
    call create_entity         ; Create with actual components from template

    ; Configure per-entity job cadence
    ; period: 1 frame(s), entry: 0
    ld a, 12
    ld b, 1
    ld c, 0
    call entity_job_set

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, 12             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), 8         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 144         ; Set real Y position from JSON

    ; Set entity screen ID (for multi-screen support)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), 4                 ; Screen ID (world node index / fallback screen index)

    ld hl, entity_is_player
    add hl, de
    ld (hl), 0                 ; Player/hero marker from template

    ; Template token for state-machine template-aware actions
    ld hl, entity_template_token
    add hl, de
    ld (hl), 3



    ; Initialize Animation component
    ld hl, entity_anim_frame
    add hl, de
    ld (hl), #00           ; currentFrameIndex

    ld hl, entity_anim_tick
    add hl, de
    ld (hl), 0                ; tick counter

    ld hl, entity_anim_speed
    add hl, de
    ld (hl), #0F           ; animationSpeed

    ld hl, entity_anim_flags
    add hl, de
    ld (hl), #03           ; flags (playing/loop/onlyWhenMoving)



    ; Initialize Collision component (hitbox + layer masks)
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld (hl), #10      ; hitboxWidth

    ld hl, entity_collision_hitbox_h
    add hl, de
    ld (hl), #10      ; hitboxHeight

    ld hl, entity_collision_offset_x
    add hl, de
    ld (hl), #00      ; offsetX (0)

    ld hl, entity_collision_offset_y
    add hl, de
    ld (hl), #00      ; offsetY (0)

    ld hl, entity_collision_layer
    add hl, de
    ld (hl), #20      ; collisionLayer

    ld hl, entity_collides_with
    add hl, de
    ld (hl), #01      ; collidesWith

    ; Set sprite pattern and color (renderable entity)
    ld hl, sprite_pattern
    add hl, de
    ld (hl), 48          ; Use entity index * 4 for 16x16 sprites

    ld hl, sprite_color
    add hl, de
    ld (hl), 14                ; Distinct color for debugging


    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #0F            ; Direction restrictions: All directions

    ; Set input speed for Cursors component (if entity has Input component)
    ld hl, entity_input_speed
    add hl, de
    ld (hl), 2            ; Cursor speed (px/frame)


    ; Force update sprite attributes only if entity is in current screen
    ld hl, entity_screen_id + 12
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_force_show_12

    ; Force update sprite attributes (using correct multi-layer config)
    ld c, 12             ; Entity Index
    call force_update_entity_sprite
.skip_force_show_12:



    ret

update_key_item_3_2:
    ; Update Key Item 3 logic with real behavior
    ; Check if entity has input component (player entities)
    ld a, 12
    ld hl, entity_comp_masks
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    ret z                      ; Skip if no input component

    ; This is a player entity - update based on input
    ; Input velocity is already calculated in UPDATE_INPUT_COMPONENT
    ; Position update happens in UPDATE_POSITION_COMPONENT
    ret

init_e_platform_multi_1_2:
    ; Initialize e_platform_multi 1 at real position from JSON
    ; JSON position: (2, 3) tiles = (16, 24) pixels
    ; Template: tpl_1761854826357_l38q3
    ; Components: Position, Sprite, Movement, Collision
    ; Direction mask: #0F (1111b) = All directions

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ; Mask is 16-bit: B=low byte, C=high byte
    ld a, 13             ; Entity ID
    ld b, #0F              ; Mask low byte
    ld c, #00              ; Mask high byte
    call create_entity         ; Create with actual components from template

    ; Configure per-entity job cadence
    ; period: 1 frame(s), entry: 0
    ld a, 13
    ld b, 1
    ld c, 0
    call entity_job_set

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, 13             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), 16         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 24         ; Set real Y position from JSON

    ; Set entity screen ID (for multi-screen support)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), 5                 ; Screen ID (world node index / fallback screen index)

    ld hl, entity_is_player
    add hl, de
    ld (hl), 0                 ; Player/hero marker from template

    ; Template token for state-machine template-aware actions
    ld hl, entity_template_token
    add hl, de
    ld (hl), 11




    ; === Patrol Component Init ===
    ; Waypoints: (16, 0) -> (16, 128)
    ; Override position with waypoint1
    ld hl, entity_x_pos
    add hl, de
    ld (hl), 16         ; Start X = waypoint1_x

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 0         ; Start Y = waypoint1_y

    ; Set patrol velocity
    ld hl, entity_vel_x
    add hl, de
    ld (hl), 0           ; VelX = +0

    ld hl, entity_vel_y
    add hl, de
    ld (hl), 1           ; VelY = +1


    ; Initialize Collision component (hitbox + layer masks)
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld (hl), #10      ; hitboxWidth

    ld hl, entity_collision_hitbox_h
    add hl, de
    ld (hl), #10      ; hitboxHeight

    ld hl, entity_collision_offset_x
    add hl, de
    ld (hl), #00      ; offsetX (0)

    ld hl, entity_collision_offset_y
    add hl, de
    ld (hl), #00      ; offsetY (0)

    ld hl, entity_collision_layer
    add hl, de
    ld (hl), #08      ; collisionLayer

    ld hl, entity_collides_with
    add hl, de
    ld (hl), #01      ; collidesWith

    ; Set sprite pattern and color (renderable entity)
    ld hl, sprite_pattern
    add hl, de
    ld (hl), 52          ; Use entity index * 4 for 16x16 sprites

    ld hl, sprite_color
    add hl, de
    ld (hl), 15                ; Distinct color for debugging


    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #0F            ; Direction restrictions: All directions

    ; Set input speed for Cursors component (if entity has Input component)
    ld hl, entity_input_speed
    add hl, de
    ld (hl), 2            ; Cursor speed (px/frame)


    ; Force update sprite attributes only if entity is in current screen
    ld hl, entity_screen_id + 13
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_force_show_13

    ; Force update sprite attributes (using correct multi-layer config)
    ld c, 13             ; Entity Index
    call force_update_entity_sprite
.skip_force_show_13:



    ret

update_e_platform_multi_1_2:
    ; Update e_platform_multi 1 - Patrol bounce
    ; Waypoints: (16, 0) -> (16, 128)
    ld e, 13             ; Entity index
    ld d, 0

    ; --- Y axis bounce ---
    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)
    or a
    jp z, .patrol_end_13
    bit 7, a
    jp nz, .patrol_chk_min_y_13

    ; Moving down: y >= 128?
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    cp 128
    jp c, .patrol_end_13
    ; Bounce: negate vel_y
    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)
    neg
    ld (hl), a
    jp .patrol_end_13

.patrol_chk_min_y_13:
    ; Moving up: y <= 0?
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    cp 1
    jp nc, .patrol_end_13
    ; Bounce: negate vel_y
    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)
    neg
    ld (hl), a

.patrol_end_13:
    ; Sync sprite facing with current patrol velocity
    call update_entity_patrol_facing
    ret


; ------------------------------------------------------------------
; update_entity_patrol_facing
; Input: DE = entity index
; Updates entity_sprite_asset_index using directional lookup tables.
; ------------------------------------------------------------------
update_entity_patrol_facing:
    push af
    push bc
    push hl

    ; Guard invalid DE index coming from callers.
    ld a, d
    or a
    jp nz, .patrol_facing_done
    ld a, e
    cp MAX_ENTITIES
    jp nc, .patrol_facing_done

    ; Read base sprite asset index from ROM init table.
    ; This keeps patrol facing within the entity's directional family
    ; and avoids getting stuck in an unrelated 1-layer sprite asset.
    ld hl, entity_sprite_asset_index_init
    add hl, de
    ld a, (hl)
    cp #FF
    jp z, .patrol_facing_done
    cp SPRITE_ASSET_COUNT
    jp nc, .patrol_facing_done
    ld c, a
    ld b, 0

    ; Prefer horizontal facing when vel_x != 0
    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    or a
    jr z, .check_vertical
    bit 7, a
    jr nz, .use_left
    ld hl, sprite_dir_right_table
    jr .apply_lookup

.use_left:
    ld hl, sprite_dir_left_table
    jr .apply_lookup

.check_vertical:
    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)
    or a
    jr z, .patrol_facing_done
    bit 7, a
    jr nz, .use_up
    ld hl, sprite_dir_down_table
    jr .apply_lookup

.use_up:
    ld hl, sprite_dir_up_table

.apply_lookup:
    add hl, bc
    ld a, (hl)

    ld hl, entity_sprite_asset_index
    add hl, de
    cp (hl)
    jr z, .patrol_facing_done
    ld (hl), a

    ; Reset animation progression when directional variant changes.
    ; Without this, switching to a variant with fewer frames can leave
    ; entity_anim_frame out of range until the next animation wrap.
    ld hl, entity_anim_frame
    add hl, de
    ld (hl), 0

    ld hl, entity_anim_tick
    add hl, de
    ld (hl), 0

.patrol_facing_done:
    pop hl
    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; init_player_fast_runtime
; Reset the dedicated player fast-path runtime mirror.
; ------------------------------------------------------------------
init_player_fast_runtime:
    xor a
    ld (player_runtime_enabled), a
    ld (player_vx_runtime), a
    ld (player_vy_runtime), a
    ld (player_x), a
    ld (player_x+1), a
    ld (player_y), a
    ld (player_y+1), a
    ld a, #FF
    ld (player_entity_index), a
    ret

; ------------------------------------------------------------------
; init_player_from_hero_entity
; Seed player fast-path runtime from current hero_entity_id when available.
; Safe to call before hero_entity_id has been resolved.
; ------------------------------------------------------------------
init_player_from_hero_entity:
    ld a, (hero_entity_id)
    cp #FF
    ret z
    ld (player_entity_index), a
    ld c, a
    ld a, 1
    ld (player_runtime_enabled), a

    ld e, c
    ld d, 0

    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld (player_x), a
    xor a
    ld (player_x+1), a

    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld (player_y), a
    xor a
    ld (player_y+1), a

    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    ld (player_vx_runtime), a

    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)
    ld (player_vy_runtime), a
    ret
; ==================================================================
; END OF ENTITIES
; ==================================================================


; --- End of Far Bank 7 — pad to 8KB boundary ---
    ds #8000 - $, #FF

; ##################################################################
; FAR BANK 8 — [#8000h-#A000h] FAR CODE: screens_code
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P2, maps bank8 to P2,
; calls routine, then restores P2.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-3). No far-to-far calls allowed.
; ##################################################################
    org #8000

; ==================================================================
; SCREEN MAPS
; File: screens.asm
; Description: Screen layout and map data
; ==================================================================

; ==================================================================
; SCREEN MAP CONSTANTS
; ==================================================================

EFFECT_ZONE_ENTRY_SIZE EQU 8
EFFECT_TYPE_SECRET_ZONE EQU 0
EFFECT_TYPE_WIND EQU 1
EFFECT_TYPE_WATER EQU 2
EFFECT_TYPE_CUSTOM_GRAVITY EQU 3
EFFECT_TYPE_ICE_PHYSICS EQU 4
EFFECT_TYPE_SPRITE_CONCEAL EQU 5
EFFECT_WIND_DIR_LEFT EQU 0
EFFECT_WIND_DIR_RIGHT EQU 1
EFFECT_WIND_DIR_UP EQU 2
EFFECT_WIND_DIR_DOWN EQU 3
SCREEN_RUNTIME_SUMMARY_ENTRY_SIZE EQU 4
SCREEN_RUNTIME_SUMMARY_OFFS_ANIM_GROUPS EQU 0
SCREEN_RUNTIME_SUMMARY_OFFS_ENTITY_COUNT EQU 1
SCREEN_RUNTIME_SUMMARY_OFFS_SPRITE_PATTERN_SLOTS EQU 2
SCREEN_RUNTIME_SUMMARY_OFFS_FLAGS EQU 3
SCREEN_RUNTIME_SUMMARY_FLAG_MUSIC_IN_GAME EQU #01
SCREEN_RUNTIME_SUMMARY_FLAG_HAS_HUD EQU #02
SCREEN_RUNTIME_SUMMARY_FLAG_HAS_EFFECTS EQU #04
SCREEN_RUNTIME_SUMMARY_FLAG_HAS_ANIM_TILES EQU #08

SCREEN_PAN1_0_ID EQU 0
SCREEN_PAN1_0_LAYOUT_BANK EQU ((SCREEN_PAN1_0_LAYOUT - #4000) / #2000)
BEHAVIOR_PAN1_0_DATA_BANK EQU ((BEHAVIOR_PAN1_0_DATA - #4000) / #2000)
SCREEN_PAN1_0_EFFECTS_LAYOUT_BANK EQU ((SCREEN_PAN1_0_EFFECTS_LAYOUT - #4000) / #2000)
SCREEN_PAN1_0_EFFECTS_LAYOUT_PRESENT EQU 1
SCREEN_PAN1_0_EFFECTS_LAYOUT_SIZE EQU 768
SCREEN_PAN1_0_EFFECT_ZONE_TABLE_BANK EQU ((SCREEN_PAN1_0_EFFECT_ZONE_TABLE - #4000) / #2000)
SCREEN_PAN1_0_EFFECT_ZONE_COUNT EQU 0
SCREEN_PAN1_0_EFFECT_ZONE_TABLE_SIZE EQU 0
SCREEN_PAN1_0_ANIM_GROUP_COUNT EQU 0
SCREEN_PAN1_0_ENTITY_COUNT EQU 6
SCREEN_PAN1_0_SPRITE_PATTERN_SLOTS EQU 37
SCREEN_PAN1_0_MUSIC_IN_GAME EQU 0
SCREEN_PAN1_0_SUMMARY_FLAGS EQU #04
SCREEN_PAN2_1_ID EQU 1
SCREEN_PAN2_1_LAYOUT_BANK EQU ((SCREEN_PAN2_1_LAYOUT - #4000) / #2000)
BEHAVIOR_PAN2_1_DATA_BANK EQU ((BEHAVIOR_PAN2_1_DATA - #4000) / #2000)
SCREEN_PAN2_1_EFFECTS_LAYOUT_BANK EQU ((SCREEN_PAN2_1_EFFECTS_LAYOUT - #4000) / #2000)
SCREEN_PAN2_1_EFFECTS_LAYOUT_PRESENT EQU 1
SCREEN_PAN2_1_EFFECTS_LAYOUT_SIZE EQU 768
SCREEN_PAN2_1_EFFECT_ZONE_TABLE_BANK EQU ((SCREEN_PAN2_1_EFFECT_ZONE_TABLE - #4000) / #2000)
SCREEN_PAN2_1_EFFECT_ZONE_COUNT EQU 0
SCREEN_PAN2_1_EFFECT_ZONE_TABLE_SIZE EQU 0
SCREEN_PAN2_1_ANIM_GROUP_COUNT EQU 0
SCREEN_PAN2_1_ENTITY_COUNT EQU 1
SCREEN_PAN2_1_SPRITE_PATTERN_SLOTS EQU 5
SCREEN_PAN2_1_MUSIC_IN_GAME EQU 0
SCREEN_PAN2_1_SUMMARY_FLAGS EQU #04
SCREEN_PAN3_2_ID EQU 2
SCREEN_PAN3_2_LAYOUT_BANK EQU ((SCREEN_PAN3_2_LAYOUT - #4000) / #2000)
BEHAVIOR_PAN3_2_DATA_BANK EQU ((BEHAVIOR_PAN3_2_DATA - #4000) / #2000)
SCREEN_PAN3_2_EFFECTS_LAYOUT_BANK EQU ((SCREEN_PAN3_2_EFFECTS_LAYOUT - #4000) / #2000)
SCREEN_PAN3_2_EFFECTS_LAYOUT_PRESENT EQU 1
SCREEN_PAN3_2_EFFECTS_LAYOUT_SIZE EQU 768
SCREEN_PAN3_2_EFFECT_ZONE_TABLE_BANK EQU ((SCREEN_PAN3_2_EFFECT_ZONE_TABLE - #4000) / #2000)
SCREEN_PAN3_2_EFFECT_ZONE_COUNT EQU 0
SCREEN_PAN3_2_EFFECT_ZONE_TABLE_SIZE EQU 0
SCREEN_PAN3_2_ANIM_GROUP_COUNT EQU 0
SCREEN_PAN3_2_ENTITY_COUNT EQU 3
SCREEN_PAN3_2_SPRITE_PATTERN_SLOTS EQU 3
SCREEN_PAN3_2_MUSIC_IN_GAME EQU 0
SCREEN_PAN3_2_SUMMARY_FLAGS EQU #04
SCREEN_PAN4_3_ID EQU 3
SCREEN_PAN4_3_LAYOUT_BANK EQU ((SCREEN_PAN4_3_LAYOUT - #4000) / #2000)
BEHAVIOR_PAN4_3_DATA_BANK EQU ((BEHAVIOR_PAN4_3_DATA - #4000) / #2000)
SCREEN_PAN4_3_EFFECTS_LAYOUT_BANK EQU ((SCREEN_PAN4_3_EFFECTS_LAYOUT - #4000) / #2000)
SCREEN_PAN4_3_EFFECTS_LAYOUT_PRESENT EQU 1
SCREEN_PAN4_3_EFFECTS_LAYOUT_SIZE EQU 768
SCREEN_PAN4_3_EFFECT_ZONE_TABLE_BANK EQU ((SCREEN_PAN4_3_EFFECT_ZONE_TABLE - #4000) / #2000)
SCREEN_PAN4_3_EFFECT_ZONE_COUNT EQU 0
SCREEN_PAN4_3_EFFECT_ZONE_TABLE_SIZE EQU 0
SCREEN_PAN4_3_ANIM_GROUP_COUNT EQU 0
SCREEN_PAN4_3_ENTITY_COUNT EQU 0
SCREEN_PAN4_3_SPRITE_PATTERN_SLOTS EQU 1
SCREEN_PAN4_3_MUSIC_IN_GAME EQU 0
SCREEN_PAN4_3_SUMMARY_FLAGS EQU #04
SCREEN_PAN5_4_ID EQU 4
SCREEN_PAN5_4_LAYOUT_BANK EQU ((SCREEN_PAN5_4_LAYOUT - #4000) / #2000)
BEHAVIOR_PAN5_4_DATA_BANK EQU ((BEHAVIOR_PAN5_4_DATA - #4000) / #2000)
SCREEN_PAN5_4_EFFECTS_LAYOUT_BANK EQU ((SCREEN_PAN5_4_EFFECTS_LAYOUT - #4000) / #2000)
SCREEN_PAN5_4_EFFECTS_LAYOUT_PRESENT EQU 1
SCREEN_PAN5_4_EFFECTS_LAYOUT_SIZE EQU 768
SCREEN_PAN5_4_EFFECT_ZONE_TABLE_BANK EQU ((SCREEN_PAN5_4_EFFECT_ZONE_TABLE - #4000) / #2000)
SCREEN_PAN5_4_EFFECT_ZONE_COUNT EQU 0
SCREEN_PAN5_4_EFFECT_ZONE_TABLE_SIZE EQU 0
SCREEN_PAN5_4_ANIM_GROUP_COUNT EQU 0
SCREEN_PAN5_4_ENTITY_COUNT EQU 3
SCREEN_PAN5_4_SPRITE_PATTERN_SLOTS EQU 3
SCREEN_PAN5_4_MUSIC_IN_GAME EQU 0
SCREEN_PAN5_4_SUMMARY_FLAGS EQU #04
SCREEN_PAN62_5_ID EQU 5
SCREEN_PAN62_5_LAYOUT_BANK EQU ((SCREEN_PAN62_5_LAYOUT - #4000) / #2000)
BEHAVIOR_PAN62_5_DATA_BANK EQU ((BEHAVIOR_PAN62_5_DATA - #4000) / #2000)
SCREEN_PAN62_5_EFFECTS_LAYOUT_BANK EQU ((SCREEN_PAN62_5_EFFECTS_LAYOUT - #4000) / #2000)
SCREEN_PAN62_5_EFFECTS_LAYOUT_PRESENT EQU 1
SCREEN_PAN62_5_EFFECTS_LAYOUT_SIZE EQU 768
SCREEN_PAN62_5_EFFECT_ZONE_TABLE_BANK EQU ((SCREEN_PAN62_5_EFFECT_ZONE_TABLE - #4000) / #2000)
SCREEN_PAN62_5_EFFECT_ZONE_COUNT EQU 0
SCREEN_PAN62_5_EFFECT_ZONE_TABLE_SIZE EQU 0
SCREEN_PAN62_5_ANIM_GROUP_COUNT EQU 0
SCREEN_PAN62_5_ENTITY_COUNT EQU 1
SCREEN_PAN62_5_SPRITE_PATTERN_SLOTS EQU 2
SCREEN_PAN62_5_MUSIC_IN_GAME EQU 0
SCREEN_PAN62_5_SUMMARY_FLAGS EQU #04
SCREEN_PAN7_6_ID EQU 6
SCREEN_PAN7_6_LAYOUT_BANK EQU ((SCREEN_PAN7_6_LAYOUT - #4000) / #2000)
BEHAVIOR_PAN7_6_DATA_BANK EQU ((BEHAVIOR_PAN7_6_DATA - #4000) / #2000)
SCREEN_PAN7_6_EFFECTS_LAYOUT_BANK EQU ((SCREEN_PAN7_6_EFFECTS_LAYOUT - #4000) / #2000)
SCREEN_PAN7_6_EFFECTS_LAYOUT_PRESENT EQU 1
SCREEN_PAN7_6_EFFECTS_LAYOUT_SIZE EQU 768
SCREEN_PAN7_6_EFFECT_ZONE_TABLE_BANK EQU ((SCREEN_PAN7_6_EFFECT_ZONE_TABLE - #4000) / #2000)
SCREEN_PAN7_6_EFFECT_ZONE_COUNT EQU 0
SCREEN_PAN7_6_EFFECT_ZONE_TABLE_SIZE EQU 0
SCREEN_PAN7_6_ANIM_GROUP_COUNT EQU 0
SCREEN_PAN7_6_ENTITY_COUNT EQU 0
SCREEN_PAN7_6_SPRITE_PATTERN_SLOTS EQU 1
SCREEN_PAN7_6_MUSIC_IN_GAME EQU 0
SCREEN_PAN7_6_SUMMARY_FLAGS EQU #04

; ==================================================================
; SCREEN RUNTIME SUMMARY TABLE
; anim_groups: animated tile groups visible in this screen
; entity_count: entity instances assigned to this screen
; sprite_pattern_slots: SPRPAT slots needed by this screen's entity runtime set
; flags bit0=music_in_game, bit1=has_hud, bit2=has_effects, bit3=has_anim_tiles
; ==================================================================

screen_runtime_summary_table:
    db 0, 6, 37, #04    ; Screen 0: pan1
    db 0, 1, 5, #04    ; Screen 1: pan2
    db 0, 3, 3, #04    ; Screen 2: pan3
    db 0, 0, 1, #04    ; Screen 3: pan4
    db 0, 3, 3, #04    ; Screen 4: pan5
    db 0, 1, 2, #04    ; Screen 5: pan62
    db 0, 0, 1, #04    ; Screen 6: pan7

; ==================================================================
; SCREEN MAP DATA
; ==================================================================

; [SCREEN_PAN1_0_LAYOUT emitted in bank4 section]
; [SCREEN_PAN1_0_EFFECTS_LAYOUT emitted in bank4 section]
; [SCREEN_PAN1_0_EFFECT_ZONE_TABLE emitted in bank4 section]
; [BEHAVIOR_PAN1_0_DATA emitted in bank4 section]


; [SCREEN_PAN2_1_LAYOUT emitted in bank4 section]
; [SCREEN_PAN2_1_EFFECTS_LAYOUT emitted in bank4 section]
; [SCREEN_PAN2_1_EFFECT_ZONE_TABLE emitted in bank4 section]
; [BEHAVIOR_PAN2_1_DATA emitted in bank4 section]


; [SCREEN_PAN3_2_LAYOUT emitted in bank4 section]
; [SCREEN_PAN3_2_EFFECTS_LAYOUT emitted in bank4 section]
; [SCREEN_PAN3_2_EFFECT_ZONE_TABLE emitted in bank4 section]
; [BEHAVIOR_PAN3_2_DATA emitted in bank4 section]


; [SCREEN_PAN4_3_LAYOUT emitted in bank4 section]
; [SCREEN_PAN4_3_EFFECTS_LAYOUT emitted in bank4 section]
; [SCREEN_PAN4_3_EFFECT_ZONE_TABLE emitted in bank4 section]
; [BEHAVIOR_PAN4_3_DATA emitted in bank4 section]


; [SCREEN_PAN5_4_LAYOUT emitted in bank4 section]
; [SCREEN_PAN5_4_EFFECTS_LAYOUT emitted in bank4 section]
; [SCREEN_PAN5_4_EFFECT_ZONE_TABLE emitted in bank4 section]
; [BEHAVIOR_PAN5_4_DATA emitted in bank4 section]


; [SCREEN_PAN62_5_LAYOUT emitted in bank4 section]
; [SCREEN_PAN62_5_EFFECTS_LAYOUT emitted in bank4 section]
; [SCREEN_PAN62_5_EFFECT_ZONE_TABLE emitted in bank4 section]
; [BEHAVIOR_PAN62_5_DATA emitted in bank4 section]


; [SCREEN_PAN7_6_LAYOUT emitted in bank4 section]
; [SCREEN_PAN7_6_EFFECTS_LAYOUT emitted in bank4 section]
; [SCREEN_PAN7_6_EFFECT_ZONE_TABLE emitted in bank4 section]
; [BEHAVIOR_PAN7_6_DATA emitted in bank4 section]


show_presentation_screen:
    ret

; ==================================================================
; SCREEN LOADING FUNCTIONS
; ==================================================================

; Color shift lookup table (0-15 shifted to high nibble)
; OPTIMIZED: Table lookup is faster than 4× RLCA (11 cycles vs 16 cycles)
color_shift_table:
    db #00, #10, #20, #30, #40, #50, #60, #70
    db #80, #90, #A0, #B0, #C0, #D0, #E0, #F0

; Helper function to set VDP background and border colors
; Input: A = background color (0-15), B = border color (0-15)
set_screen_colors:
    push af
    push bc
    push hl

    ; Set VDP Register 7: [Background Color (4-7) | Border Color (0-3)]

    ; OPTIMIZED: Use lookup table instead of 4× RLCA
    ; Process Background Color (in A) -> High Nibble
    and #0F                    ; Ensure 0-15 range
    ld hl, color_shift_table
    add a, l                   ; Add offset to table base
    ld l, a
    adc a, h                   ; Handle carry
    sub l
    ld h, a
    ld a, (hl)                 ; A = background color << 4
    ld c, a                    ; Save shifted background in C

    ; Process Border Color (in B) -> Low Nibble
    ld a, b                    ; Get border color
    and #0F                    ; Ensure 0-15 range

    ; Combine
    or c                       ; Combine: background << 4 | border

    ld b, a                    ; Value for VDP R#7
    ld c, 7                    ; VDP Register 7
    call FAST_WRTVDP           ; BIOS call to write VDP register

    pop hl
    pop bc
    pop af
    ret

; Helper function to initialize character 0 (empty cell) with background color
; Input: A = background color (0-15)
; This ensures empty cells show the correct background color instead of BIOS default (blue)
init_char0_color:
    push af
    push bc
    push de
    push hl
    
    ; Calculate color byte: (bg_color << 4) | bg_color
    ; This makes both foreground and background the same color
    and #0F                    ; Ensure 0-15 range
    ld b, a                    ; Save in B
    rlca                       ; Shift to high nibble
    rlca
    rlca
    rlca
    or b                       ; Combine: bg_color in both nibbles
    ld b, a                    ; B = color byte to write
    
    ; Write color to character 0 in all 3 banks (8 bytes each)
    ; Bank 0: CLRTBL2 + (0 * 8)
    ld hl, CLRTBL2
    ld c, 8                    ; 8 bytes per character
init_char0_bank0_loop:
    ld a, b                    ; Get color byte
    call FAST_WRTVRM                ; Write to VRAM
    inc hl
    dec c
    jr nz, init_char0_bank0_loop
    
    ; Bank 1: CLRTBL2 + #800 + (0 * 8)
    ld hl, CLRTBL2 + #800
    ld c, 8
init_char0_bank1_loop:
    ld a, b
    call FAST_WRTVRM
    inc hl
    dec c
    jr nz, init_char0_bank1_loop
    
    ; Bank 2: CLRTBL2 + #1000 + (0 * 8)
    ld hl, CLRTBL2 + #1000
    ld c, 8
init_char0_bank2_loop:
    ld a, b
    call FAST_WRTVRM
    inc hl
    dec c
    jr nz, init_char0_bank2_loop
    
    ; Also clear pattern for character 0 (all zeros = blank)
    ; Bank 0: CHRTBL2 + (0 * 8)
    ld hl, CHRTBL2
    ld c, 8
    xor a                      ; A = 0 (blank pattern)
init_char0_pattern_bank0_loop:
    call FAST_WRTVRM
    inc hl
    dec c
    jr nz, init_char0_pattern_bank0_loop
    
    ; Bank 1: CHRTBL2 + #800 + (0 * 8)
    ld hl, CHRTBL2 + #800
    ld c, 8
    xor a
init_char0_pattern_bank1_loop:
    call FAST_WRTVRM
    inc hl
    dec c
    jr nz, init_char0_pattern_bank1_loop
    
    ; Bank 2: CHRTBL2 + #1000 + (0 * 8)
    ld hl, CHRTBL2 + #1000
    ld c, 8
    xor a
init_char0_pattern_bank2_loop:
    call FAST_WRTVRM
    inc hl
    dec c
    jr nz, init_char0_pattern_bank2_loop
    
    pop hl
    pop de
    pop bc
    pop af
    ret

; Helper: Copy rectangular area from screen layout (RAM) to Name Table (VRAM)
; Input: HL = source in RAM
;        DE = destination in VRAM
;        A  = number of rows
;        C  = bytes per row (width)
copy_layout_rect_to_vram:
    or a
    ret z
    ld b, a
    ld a, c
    or a
    ret z
    ld a, b

.copy_rect_row_loop:
    push af
    push bc
    push hl
    push de
    ld b, 0
    call FAST_LDIRVM
    pop de
    pop hl
    pop bc
    pop af

    dec a
    ret z
    ; HL/DE were restored by push/pop, so advance a full row (32 bytes)
    push bc
    ld bc, 32
    add hl, bc
    ex de, hl
    add hl, bc
    ex de, hl
    pop bc
    jr .copy_rect_row_loop

; Helper: Copy rectangular area between 32-byte rows in RAM
; Input: HL = source in RAM
;        DE = destination in RAM
;        A  = number of rows
;        C  = bytes per row (width)
copy_layout_rect_ram_to_ram:
    or a
    ret z
    ld b, a
    ld a, c
    or a
    ret z
    ld a, b

.copy_rect_ram_row_loop:
    push af
    push bc
    push hl
    push de
    ld b, 0
    ldir
    pop de
    pop hl
    pop bc
    pop af

    dec a
    ret z
    ; HL/DE were restored by push/pop, so advance a full row (32 bytes)
    push bc
    ld bc, 32
    add hl, bc
    ex de, hl
    add hl, bc
    ex de, hl
    pop bc
    jr .copy_rect_ram_row_loop

load_screen:

    ; Load screen (A = screen ID)
    ; TODO: Implement screen loading logic
    ret

load_screen_pan1_760723005040:
    ; Load pan1 screen (fast direct port access)
    ; Set VDP colors FIRST (before loading screen data)
    ld a, 1           ; Background color
    ld b, 1       ; Border color
    call set_screen_colors
    ; Initialize character 0 (empty cells) with background color
    ld a, 1           ; Background color for char 0
    call init_char0_color
    call load_tilebank_tilebank_1760723902303_patterns_to_vram
    call load_tilebank_tilebank_1760723902303_colors_to_vram
    ; Clear hardware sprites on screen switch to avoid visual carry-over
    call clear_all_sprites
    call update_sprites_to_vram
    ; Now load screen layout (full 32x24)
    call mapper_push_p2
    ld a, SCREEN_PAN1_0_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, (SCREEN_PAN1_0_LAYOUT & #1FFF) | #8000
    ld de, NAMETBL
    ld bc, SCREEN_PAN1_0_SIZE
    call FAST_LDIRVM           ; Fast VRAM write (direct port access)
    call mapper_pop_p2
    ; Build mutable runtime screen/effects/behavior maps in RAM
    call mapper_push_p2
    ld a, SCREEN_PAN1_0_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, (SCREEN_PAN1_0_LAYOUT & #1FFF) | #8000
    ld de, runtime_background_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    ld hl, (SCREEN_PAN1_0_LAYOUT & #1FFF) | #8000
    ld de, runtime_screen_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    call mapper_push_p2
    ld a, SCREEN_PAN1_0_EFFECTS_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, (SCREEN_PAN1_0_EFFECTS_LAYOUT & #1FFF) | #8000
    ld de, runtime_effects_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    call mapper_push_p2
    ld a, BEHAVIOR_PAN1_0_DATA_BANK
    call mapper_set_bank_p2
    ld hl, (BEHAVIOR_PAN1_0_DATA & #1FFF) | #8000
    ld de, runtime_behavior_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    ld a, 0
    ld (current_effect_zone_count), a
    or a
    jr z, .load_pan1_760723005040_zones_done
    call mapper_push_p2
    ld a, SCREEN_PAN1_0_EFFECT_ZONE_TABLE_BANK
    call mapper_set_bank_p2
    ld hl, (SCREEN_PAN1_0_EFFECT_ZONE_TABLE & #1FFF) | #8000
    ld de, runtime_effect_zone_table
    ld bc, 0
    ldir
    call mapper_pop_p2
.load_pan1_760723005040_zones_done:
    ld a, 0
    ld (current_screen_anim_group_count), a
    ld a, 6
    ld (current_screen_entity_count), a
    ld a, 37
    ld (current_screen_sprite_pattern_slots), a
    ld a, SCREEN_PAN1_0_SUMMARY_FLAGS
    ld (current_screen_summary_flags), a
    ; Initialize collision system pointers for this screen
    ld hl, runtime_screen_layout
    ld (current_screen_layout), hl
    ld a, #FF
    ld (current_screen_layout_bank), a
    ld hl, runtime_behavior_map
    ld (current_behavior_map), hl
    ld a, #FF
    ld (current_behavior_map_bank), a
    ld a, l
    ld (behavior_cache_map_l), a
    ld a, h
    ld (behavior_cache_map_h), a
    ld a, #FF
    ld (behavior_cache_row), a
    xor a
    ld (secret_zone_active), a
    ld (secret_zone_rect_x), a
    ld (secret_zone_rect_y), a
    ld (secret_zone_rect_w), a
    ld (secret_zone_rect_h), a
    ret

load_screen_pan2_760784762679:
    ; Load pan2 screen (fast direct port access)
    ; Set VDP colors FIRST (before loading screen data)
    ld a, 1           ; Background color
    ld b, 1       ; Border color
    call set_screen_colors
    ; Initialize character 0 (empty cells) with background color
    ld a, 1           ; Background color for char 0
    call init_char0_color
    call load_tilebank_tilebank_1760723902303_patterns_to_vram
    call load_tilebank_tilebank_1760723902303_colors_to_vram
    ; Clear hardware sprites on screen switch to avoid visual carry-over
    call clear_all_sprites
    call update_sprites_to_vram
    ; Now load screen layout (full 32x24)
    call mapper_push_p2
    ld a, SCREEN_PAN2_1_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, (SCREEN_PAN2_1_LAYOUT & #1FFF) | #8000
    ld de, NAMETBL
    ld bc, SCREEN_PAN2_1_SIZE
    call FAST_LDIRVM           ; Fast VRAM write (direct port access)
    call mapper_pop_p2
    ; Build mutable runtime screen/effects/behavior maps in RAM
    call mapper_push_p2
    ld a, SCREEN_PAN2_1_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, (SCREEN_PAN2_1_LAYOUT & #1FFF) | #8000
    ld de, runtime_background_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    ld hl, (SCREEN_PAN2_1_LAYOUT & #1FFF) | #8000
    ld de, runtime_screen_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    call mapper_push_p2
    ld a, SCREEN_PAN2_1_EFFECTS_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, (SCREEN_PAN2_1_EFFECTS_LAYOUT & #1FFF) | #8000
    ld de, runtime_effects_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    call mapper_push_p2
    ld a, BEHAVIOR_PAN2_1_DATA_BANK
    call mapper_set_bank_p2
    ld hl, (BEHAVIOR_PAN2_1_DATA & #1FFF) | #8000
    ld de, runtime_behavior_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    ld a, 0
    ld (current_effect_zone_count), a
    or a
    jr z, .load_pan2_760784762679_zones_done
    call mapper_push_p2
    ld a, SCREEN_PAN2_1_EFFECT_ZONE_TABLE_BANK
    call mapper_set_bank_p2
    ld hl, (SCREEN_PAN2_1_EFFECT_ZONE_TABLE & #1FFF) | #8000
    ld de, runtime_effect_zone_table
    ld bc, 0
    ldir
    call mapper_pop_p2
.load_pan2_760784762679_zones_done:
    ld a, 0
    ld (current_screen_anim_group_count), a
    ld a, 1
    ld (current_screen_entity_count), a
    ld a, 5
    ld (current_screen_sprite_pattern_slots), a
    ld a, SCREEN_PAN2_1_SUMMARY_FLAGS
    ld (current_screen_summary_flags), a
    ; Initialize collision system pointers for this screen
    ld hl, runtime_screen_layout
    ld (current_screen_layout), hl
    ld a, #FF
    ld (current_screen_layout_bank), a
    ld hl, runtime_behavior_map
    ld (current_behavior_map), hl
    ld a, #FF
    ld (current_behavior_map_bank), a
    ld a, l
    ld (behavior_cache_map_l), a
    ld a, h
    ld (behavior_cache_map_h), a
    ld a, #FF
    ld (behavior_cache_row), a
    xor a
    ld (secret_zone_active), a
    ld (secret_zone_rect_x), a
    ld (secret_zone_rect_y), a
    ld (secret_zone_rect_w), a
    ld (secret_zone_rect_h), a
    ret

load_screen_pan3_760799152493:
    ; Load pan3 screen (fast direct port access)
    ; Set VDP colors FIRST (before loading screen data)
    ld a, 1           ; Background color
    ld b, 1       ; Border color
    call set_screen_colors
    ; Initialize character 0 (empty cells) with background color
    ld a, 1           ; Background color for char 0
    call init_char0_color
    call load_tilebank_tilebank_1760723902303_patterns_to_vram
    call load_tilebank_tilebank_1760723902303_colors_to_vram
    ; Clear hardware sprites on screen switch to avoid visual carry-over
    call clear_all_sprites
    call update_sprites_to_vram
    ; Now load screen layout (full 32x24)
    call mapper_push_p2
    ld a, SCREEN_PAN3_2_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, (SCREEN_PAN3_2_LAYOUT & #1FFF) | #8000
    ld de, NAMETBL
    ld bc, SCREEN_PAN3_2_SIZE
    call FAST_LDIRVM           ; Fast VRAM write (direct port access)
    call mapper_pop_p2
    ; Build mutable runtime screen/effects/behavior maps in RAM
    call mapper_push_p2
    ld a, SCREEN_PAN3_2_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, (SCREEN_PAN3_2_LAYOUT & #1FFF) | #8000
    ld de, runtime_background_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    ld hl, (SCREEN_PAN3_2_LAYOUT & #1FFF) | #8000
    ld de, runtime_screen_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    call mapper_push_p2
    ld a, SCREEN_PAN3_2_EFFECTS_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, (SCREEN_PAN3_2_EFFECTS_LAYOUT & #1FFF) | #8000
    ld de, runtime_effects_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    call mapper_push_p2
    ld a, BEHAVIOR_PAN3_2_DATA_BANK
    call mapper_set_bank_p2
    ld hl, (BEHAVIOR_PAN3_2_DATA & #1FFF) | #8000
    ld de, runtime_behavior_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    ld a, 0
    ld (current_effect_zone_count), a
    or a
    jr z, .load_pan3_760799152493_zones_done
    call mapper_push_p2
    ld a, SCREEN_PAN3_2_EFFECT_ZONE_TABLE_BANK
    call mapper_set_bank_p2
    ld hl, (SCREEN_PAN3_2_EFFECT_ZONE_TABLE & #1FFF) | #8000
    ld de, runtime_effect_zone_table
    ld bc, 0
    ldir
    call mapper_pop_p2
.load_pan3_760799152493_zones_done:
    ld a, 0
    ld (current_screen_anim_group_count), a
    ld a, 3
    ld (current_screen_entity_count), a
    ld a, 3
    ld (current_screen_sprite_pattern_slots), a
    ld a, SCREEN_PAN3_2_SUMMARY_FLAGS
    ld (current_screen_summary_flags), a
    ; Initialize collision system pointers for this screen
    ld hl, runtime_screen_layout
    ld (current_screen_layout), hl
    ld a, #FF
    ld (current_screen_layout_bank), a
    ld hl, runtime_behavior_map
    ld (current_behavior_map), hl
    ld a, #FF
    ld (current_behavior_map_bank), a
    ld a, l
    ld (behavior_cache_map_l), a
    ld a, h
    ld (behavior_cache_map_h), a
    ld a, #FF
    ld (behavior_cache_row), a
    xor a
    ld (secret_zone_active), a
    ld (secret_zone_rect_x), a
    ld (secret_zone_rect_y), a
    ld (secret_zone_rect_w), a
    ld (secret_zone_rect_h), a
    ret

load_screen_pan4_760799516565:
    ; Load pan4 screen (fast direct port access)
    ; Set VDP colors FIRST (before loading screen data)
    ld a, 1           ; Background color
    ld b, 1       ; Border color
    call set_screen_colors
    ; Initialize character 0 (empty cells) with background color
    ld a, 1           ; Background color for char 0
    call init_char0_color
    call load_tilebank_tilebank_1760723902303_patterns_to_vram
    call load_tilebank_tilebank_1760723902303_colors_to_vram
    ; Clear hardware sprites on screen switch to avoid visual carry-over
    call clear_all_sprites
    call update_sprites_to_vram
    ; Now load screen layout (full 32x24)
    call mapper_push_p2
    ld a, SCREEN_PAN4_3_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, (SCREEN_PAN4_3_LAYOUT & #1FFF) | #8000
    ld de, NAMETBL
    ld bc, SCREEN_PAN4_3_SIZE
    call FAST_LDIRVM           ; Fast VRAM write (direct port access)
    call mapper_pop_p2
    ; Build mutable runtime screen/effects/behavior maps in RAM
    call mapper_push_p2
    ld a, SCREEN_PAN4_3_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, (SCREEN_PAN4_3_LAYOUT & #1FFF) | #8000
    ld de, runtime_background_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    ld hl, (SCREEN_PAN4_3_LAYOUT & #1FFF) | #8000
    ld de, runtime_screen_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    call mapper_push_p2
    ld a, SCREEN_PAN4_3_EFFECTS_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, (SCREEN_PAN4_3_EFFECTS_LAYOUT & #1FFF) | #8000
    ld de, runtime_effects_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    call mapper_push_p2
    ld a, BEHAVIOR_PAN4_3_DATA_BANK
    call mapper_set_bank_p2
    ld hl, (BEHAVIOR_PAN4_3_DATA & #1FFF) | #8000
    ld de, runtime_behavior_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    ld a, 0
    ld (current_effect_zone_count), a
    or a
    jr z, .load_pan4_760799516565_zones_done
    call mapper_push_p2
    ld a, SCREEN_PAN4_3_EFFECT_ZONE_TABLE_BANK
    call mapper_set_bank_p2
    ld hl, (SCREEN_PAN4_3_EFFECT_ZONE_TABLE & #1FFF) | #8000
    ld de, runtime_effect_zone_table
    ld bc, 0
    ldir
    call mapper_pop_p2
.load_pan4_760799516565_zones_done:
    ld a, 0
    ld (current_screen_anim_group_count), a
    ld a, 0
    ld (current_screen_entity_count), a
    ld a, 1
    ld (current_screen_sprite_pattern_slots), a
    ld a, SCREEN_PAN4_3_SUMMARY_FLAGS
    ld (current_screen_summary_flags), a
    ; Initialize collision system pointers for this screen
    ld hl, runtime_screen_layout
    ld (current_screen_layout), hl
    ld a, #FF
    ld (current_screen_layout_bank), a
    ld hl, runtime_behavior_map
    ld (current_behavior_map), hl
    ld a, #FF
    ld (current_behavior_map_bank), a
    ld a, l
    ld (behavior_cache_map_l), a
    ld a, h
    ld (behavior_cache_map_h), a
    ld a, #FF
    ld (behavior_cache_row), a
    xor a
    ld (secret_zone_active), a
    ld (secret_zone_rect_x), a
    ld (secret_zone_rect_y), a
    ld (secret_zone_rect_w), a
    ld (secret_zone_rect_h), a
    ret

load_screen_pan5_760961565333:
    ; Load pan5 screen (fast direct port access)
    ; Set VDP colors FIRST (before loading screen data)
    ld a, 1           ; Background color
    ld b, 1       ; Border color
    call set_screen_colors
    ; Initialize character 0 (empty cells) with background color
    ld a, 1           ; Background color for char 0
    call init_char0_color
    call load_tilebank_tilebank_1760723902303_patterns_to_vram
    call load_tilebank_tilebank_1760723902303_colors_to_vram
    ; Clear hardware sprites on screen switch to avoid visual carry-over
    call clear_all_sprites
    call update_sprites_to_vram
    ; Now load screen layout (full 32x24)
    call mapper_push_p2
    ld a, SCREEN_PAN5_4_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, (SCREEN_PAN5_4_LAYOUT & #1FFF) | #8000
    ld de, NAMETBL
    ld bc, SCREEN_PAN5_4_SIZE
    call FAST_LDIRVM           ; Fast VRAM write (direct port access)
    call mapper_pop_p2
    ; Build mutable runtime screen/effects/behavior maps in RAM
    call mapper_push_p2
    ld a, SCREEN_PAN5_4_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, (SCREEN_PAN5_4_LAYOUT & #1FFF) | #8000
    ld de, runtime_background_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    ld hl, (SCREEN_PAN5_4_LAYOUT & #1FFF) | #8000
    ld de, runtime_screen_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    call mapper_push_p2
    ld a, SCREEN_PAN5_4_EFFECTS_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, (SCREEN_PAN5_4_EFFECTS_LAYOUT & #1FFF) | #8000
    ld de, runtime_effects_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    call mapper_push_p2
    ld a, BEHAVIOR_PAN5_4_DATA_BANK
    call mapper_set_bank_p2
    ld hl, (BEHAVIOR_PAN5_4_DATA & #1FFF) | #8000
    ld de, runtime_behavior_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    ld a, 0
    ld (current_effect_zone_count), a
    or a
    jr z, .load_pan5_760961565333_zones_done
    call mapper_push_p2
    ld a, SCREEN_PAN5_4_EFFECT_ZONE_TABLE_BANK
    call mapper_set_bank_p2
    ld hl, (SCREEN_PAN5_4_EFFECT_ZONE_TABLE & #1FFF) | #8000
    ld de, runtime_effect_zone_table
    ld bc, 0
    ldir
    call mapper_pop_p2
.load_pan5_760961565333_zones_done:
    ld a, 0
    ld (current_screen_anim_group_count), a
    ld a, 3
    ld (current_screen_entity_count), a
    ld a, 3
    ld (current_screen_sprite_pattern_slots), a
    ld a, SCREEN_PAN5_4_SUMMARY_FLAGS
    ld (current_screen_summary_flags), a
    ; Initialize collision system pointers for this screen
    ld hl, runtime_screen_layout
    ld (current_screen_layout), hl
    ld a, #FF
    ld (current_screen_layout_bank), a
    ld hl, runtime_behavior_map
    ld (current_behavior_map), hl
    ld a, #FF
    ld (current_behavior_map_bank), a
    ld a, l
    ld (behavior_cache_map_l), a
    ld a, h
    ld (behavior_cache_map_h), a
    ld a, #FF
    ld (behavior_cache_row), a
    xor a
    ld (secret_zone_active), a
    ld (secret_zone_rect_x), a
    ld (secret_zone_rect_y), a
    ld (secret_zone_rect_w), a
    ld (secret_zone_rect_h), a
    ret

load_screen_pan62_761237904051:
    ; Load pan62 screen (fast direct port access)
    ; Set VDP colors FIRST (before loading screen data)
    ld a, 1           ; Background color
    ld b, 1       ; Border color
    call set_screen_colors
    ; Initialize character 0 (empty cells) with background color
    ld a, 1           ; Background color for char 0
    call init_char0_color
    call load_tilebank_tilebank_1760723902303_patterns_to_vram
    call load_tilebank_tilebank_1760723902303_colors_to_vram
    ; Clear hardware sprites on screen switch to avoid visual carry-over
    call clear_all_sprites
    call update_sprites_to_vram
    ; Now load screen layout (full 32x24)
    call mapper_push_p2
    ld a, SCREEN_PAN62_5_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, (SCREEN_PAN62_5_LAYOUT & #1FFF) | #8000
    ld de, NAMETBL
    ld bc, SCREEN_PAN62_5_SIZE
    call FAST_LDIRVM           ; Fast VRAM write (direct port access)
    call mapper_pop_p2
    ; Build mutable runtime screen/effects/behavior maps in RAM
    call mapper_push_p2
    ld a, SCREEN_PAN62_5_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, (SCREEN_PAN62_5_LAYOUT & #1FFF) | #8000
    ld de, runtime_background_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    ld hl, (SCREEN_PAN62_5_LAYOUT & #1FFF) | #8000
    ld de, runtime_screen_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    call mapper_push_p2
    ld a, SCREEN_PAN62_5_EFFECTS_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, (SCREEN_PAN62_5_EFFECTS_LAYOUT & #1FFF) | #8000
    ld de, runtime_effects_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    call mapper_push_p2
    ld a, BEHAVIOR_PAN62_5_DATA_BANK
    call mapper_set_bank_p2
    ld hl, (BEHAVIOR_PAN62_5_DATA & #1FFF) | #8000
    ld de, runtime_behavior_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    ld a, 0
    ld (current_effect_zone_count), a
    or a
    jr z, .load_pan62_761237904051_zones_done
    call mapper_push_p2
    ld a, SCREEN_PAN62_5_EFFECT_ZONE_TABLE_BANK
    call mapper_set_bank_p2
    ld hl, (SCREEN_PAN62_5_EFFECT_ZONE_TABLE & #1FFF) | #8000
    ld de, runtime_effect_zone_table
    ld bc, 0
    ldir
    call mapper_pop_p2
.load_pan62_761237904051_zones_done:
    ld a, 0
    ld (current_screen_anim_group_count), a
    ld a, 1
    ld (current_screen_entity_count), a
    ld a, 2
    ld (current_screen_sprite_pattern_slots), a
    ld a, SCREEN_PAN62_5_SUMMARY_FLAGS
    ld (current_screen_summary_flags), a
    ; Initialize collision system pointers for this screen
    ld hl, runtime_screen_layout
    ld (current_screen_layout), hl
    ld a, #FF
    ld (current_screen_layout_bank), a
    ld hl, runtime_behavior_map
    ld (current_behavior_map), hl
    ld a, #FF
    ld (current_behavior_map_bank), a
    ld a, l
    ld (behavior_cache_map_l), a
    ld a, h
    ld (behavior_cache_map_h), a
    ld a, #FF
    ld (behavior_cache_row), a
    xor a
    ld (secret_zone_active), a
    ld (secret_zone_rect_x), a
    ld (secret_zone_rect_y), a
    ld (secret_zone_rect_w), a
    ld (secret_zone_rect_h), a
    ret

load_screen_pan7_761471728391:
    ; Load pan7 screen (fast direct port access)
    ; Set VDP colors FIRST (before loading screen data)
    ld a, 1           ; Background color
    ld b, 1       ; Border color
    call set_screen_colors
    ; Initialize character 0 (empty cells) with background color
    ld a, 1           ; Background color for char 0
    call init_char0_color
    call load_tilebank_tilebank_1760723902303_patterns_to_vram
    call load_tilebank_tilebank_1760723902303_colors_to_vram
    ; Clear hardware sprites on screen switch to avoid visual carry-over
    call clear_all_sprites
    call update_sprites_to_vram
    ; Now load screen layout (full 32x24)
    call mapper_push_p2
    ld a, SCREEN_PAN7_6_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, (SCREEN_PAN7_6_LAYOUT & #1FFF) | #8000
    ld de, NAMETBL
    ld bc, SCREEN_PAN7_6_SIZE
    call FAST_LDIRVM           ; Fast VRAM write (direct port access)
    call mapper_pop_p2
    ; Build mutable runtime screen/effects/behavior maps in RAM
    call mapper_push_p2
    ld a, SCREEN_PAN7_6_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, (SCREEN_PAN7_6_LAYOUT & #1FFF) | #8000
    ld de, runtime_background_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    ld hl, (SCREEN_PAN7_6_LAYOUT & #1FFF) | #8000
    ld de, runtime_screen_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    call mapper_push_p2
    ld a, SCREEN_PAN7_6_EFFECTS_LAYOUT_BANK
    call mapper_set_bank_p2
    ld hl, (SCREEN_PAN7_6_EFFECTS_LAYOUT & #1FFF) | #8000
    ld de, runtime_effects_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    call mapper_push_p2
    ld a, BEHAVIOR_PAN7_6_DATA_BANK
    call mapper_set_bank_p2
    ld hl, (BEHAVIOR_PAN7_6_DATA & #1FFF) | #8000
    ld de, runtime_behavior_map
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    call mapper_pop_p2

    ld a, 0
    ld (current_effect_zone_count), a
    or a
    jr z, .load_pan7_761471728391_zones_done
    call mapper_push_p2
    ld a, SCREEN_PAN7_6_EFFECT_ZONE_TABLE_BANK
    call mapper_set_bank_p2
    ld hl, (SCREEN_PAN7_6_EFFECT_ZONE_TABLE & #1FFF) | #8000
    ld de, runtime_effect_zone_table
    ld bc, 0
    ldir
    call mapper_pop_p2
.load_pan7_761471728391_zones_done:
    ld a, 0
    ld (current_screen_anim_group_count), a
    ld a, 0
    ld (current_screen_entity_count), a
    ld a, 1
    ld (current_screen_sprite_pattern_slots), a
    ld a, SCREEN_PAN7_6_SUMMARY_FLAGS
    ld (current_screen_summary_flags), a
    ; Initialize collision system pointers for this screen
    ld hl, runtime_screen_layout
    ld (current_screen_layout), hl
    ld a, #FF
    ld (current_screen_layout_bank), a
    ld hl, runtime_behavior_map
    ld (current_behavior_map), hl
    ld a, #FF
    ld (current_behavior_map_bank), a
    ld a, l
    ld (behavior_cache_map_l), a
    ld a, h
    ld (behavior_cache_map_h), a
    ld a, #FF
    ld (behavior_cache_row), a
    xor a
    ld (secret_zone_active), a
    ld (secret_zone_rect_x), a
    ld (secret_zone_rect_y), a
    ld (secret_zone_rect_w), a
    ld (secret_zone_rect_h), a
    ret


; ==================================================================
; END OF SCREENS
; ==================================================================


; --- End of Far Bank 8 — pad to 8KB boundary ---
    ds #A000 - $, #FF

; ##################################################################
; FAR BANK 9 — [#A000h-#C000h] FAR CODE: worlds
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P3, maps bank9 to P3,
; calls routine, then restores P3.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-3). No far-to-far calls allowed.
; ##################################################################
    org #A000

; ==================================================================
; WORLD MAPS
; File: worlds.asm
; Description: World map structures and screen loading functions
; Generated by Mideas MSX Generator
; ==================================================================

; ==================================================================
; WORLD MAP CONSTANTS
; ==================================================================

; World: New Worldmap (worldmap_1760724209990)
WORLD_NEW_WORLDMAP_ID EQU 0
WORLD_NEW_WORLDMAP_SCREEN_COUNT EQU 7
WORLD_NEW_WORLDMAP_SCREEN_NEW_SCREENMAP_ID EQU 0
WORLD_NEW_WORLDMAP_SCREEN_PAN2_ID EQU 1
WORLD_NEW_WORLDMAP_SCREEN_PAN3_ID EQU 2
WORLD_NEW_WORLDMAP_SCREEN_PAN4_ID EQU 3
WORLD_NEW_WORLDMAP_SCREEN_PAN5_ID EQU 4
WORLD_NEW_WORLDMAP_SCREEN_NEW_SCREENMAP_2_ID EQU 5
WORLD_NEW_WORLDMAP_SCREEN_PAN7_ID EQU 6

; ==================================================================
; WORLD LOADING FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; Load World: New Worldmap
; World ID: worldmap_1760724209990
; Screens: 7
; Start Screen Node: wmnode_1760724212148
; ------------------------------------------------------------------
load_world_worldmap_1760724209990:
    ; Load runtime sprite patterns for this world
    call load_sprite_patterns_worldmap_1760724209990
    ; Load start screen: New Screenmap (screenmap_1760723005040)
    call load_screen_pan1_760723005040_far

    ; Initialize world state
    ld a, WORLD_NEW_WORLDMAP_ID
    ld (current_world_id), a

    ld a, 0
    ld (current_screen_index), a
    ld a, 0
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1

    xor a
    ld (screen_transition_cooldown), a

    call rebuild_used_entity_list  ; Precompute room entity buckets before gameplay resumes
    call apply_collected_tiles     ; Re-apply persistent collection state for this screen
    ret

; ==================================================================
; SCREEN TRANSITION FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; World: New Worldmap
; Connections: 7
; ------------------------------------------------------------------

; Transition: pan2 -> New Screenmap
transition_worldmap_1760724209990_0:
    call load_screen_pan1_760723005040_far

    ld a, 0
    ld (current_screen_index), a
    ld a, 0
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    call rebuild_used_entity_list  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state
    ret

; Transition: pan3 -> pan2
transition_worldmap_1760724209990_1:
    call load_screen_pan2_760784762679_far

    ld a, 1
    ld (current_screen_index), a
    ld a, 1
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    call rebuild_used_entity_list  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state
    ret

; Transition: pan4 -> pan3
transition_worldmap_1760724209990_2:
    call load_screen_pan3_760799152493_far

    ld a, 2
    ld (current_screen_index), a
    ld a, 2
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    call rebuild_used_entity_list  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state
    ret

; Transition: pan5 -> pan4
transition_worldmap_1760724209990_3:
    call load_screen_pan4_760799516565_far

    ld a, 3
    ld (current_screen_index), a
    ld a, 3
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    call rebuild_used_entity_list  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state
    ret

; Transition: New Screenmap -> pan5
transition_worldmap_1760724209990_4:
    call load_screen_pan5_760961565333_far

    ld a, 4
    ld (current_screen_index), a
    ld a, 4
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    call rebuild_used_entity_list  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state
    ret

; Transition: pan7 -> New Screenmap
transition_worldmap_1760724209990_5:
    call load_screen_pan62_761237904051_far

    ld a, 5
    ld (current_screen_index), a
    ld a, 5
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    call rebuild_used_entity_list  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state
    ret

; Transition: pan7 -> pan4
transition_worldmap_1760724209990_6:
    call load_screen_pan4_760799516565_far

    ld a, 3
    ld (current_screen_index), a
    ld a, 3
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    call rebuild_used_entity_list  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state
    ret

; ------------------------------------------------------------------
; load_world_default: alias for the first world (required by megarom trampolines)
; ------------------------------------------------------------------
load_world_default:
    jp load_world_worldmap_1760724209990

; ==================================================================
; SCREEN EDGE TRANSITION RUNTIME
; ==================================================================
; Checks controllable entity exits and transitions world screen.
; Prevents X/Y byte wrap from keeping player in same screen.
; ==================================================================

check_world_screen_transition:
    ; Debounce to prevent immediate re-trigger after crossing
    ld a, (screen_transition_cooldown)
    or a
    jr z, .find_player_start
    dec a
    ld (screen_transition_cooldown), a
    ret

    ; Find first controllable entity from active list (already filtered by screen)
    ; This avoids scanning all 32 entity slots every frame.
.find_player_start:
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a
    ld hl, active_entity_list
.find_player_loop:
    ; E = entity index from compact active list
    ld e, (hl)
    inc hl
    ld d, 0

    ; Check Input component mask
    push hl
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    pop hl
    jr nz, .player_found

.find_player_next:
    djnz .find_player_loop
    ret                        ; No controllable entity found

.player_found:
    ld d, 0                    ; DE = player entity index

.dispatch_world:
    ld a, (current_world_id)
    cp WORLD_NEW_WORLDMAP_ID
    jp z, check_transition_world_worldmap_1760724209990
    ret

check_transition_world_worldmap_1760724209990:
    ld a, (current_screen_index)
    cp 0
    jp z, check_transition_worldmap_1760724209990_screen_0
    cp 1
    jp z, check_transition_worldmap_1760724209990_screen_1
    cp 2
    jp z, check_transition_worldmap_1760724209990_screen_2
    cp 3
    jp z, check_transition_worldmap_1760724209990_screen_3
    cp 4
    jp z, check_transition_worldmap_1760724209990_screen_4
    cp 5
    jp z, check_transition_worldmap_1760724209990_screen_5
    cp 6
    jp z, check_transition_worldmap_1760724209990_screen_6
    ret

check_transition_worldmap_1760724209990_screen_0:
    ; West exit: X near left edge and leftward input
    ld a, (input_state)
    cp STICK_LEFT
    jr z, .dir_ok_check_transition_worldmap_1760724209990_s0_skip_west
    cp STICK_UPLEFT
    jr z, .dir_ok_check_transition_worldmap_1760724209990_s0_skip_west
    cp STICK_DOWNLEFT
    jp nz, check_transition_worldmap_1760724209990_s0_skip_west
.dir_ok_check_transition_worldmap_1760724209990_s0_skip_west:
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp 2
    jp nc, check_transition_worldmap_1760724209990_s0_skip_west
check_transition_worldmap_1760724209990_s0_apply_west:
    push de
    call load_screen_pan2_760784762679_far
    pop de
    ld a, 1
    ld (current_screen_index), a
    ld a, 1
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ld hl, entity_screen_id
    add hl, de
    ld (hl), a
    ; Enter from east edge of target active area
    ld hl, entity_x_pos
    add hl, de
    ld (hl), 238
    ; Reset player velocity after transition
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a

    ; Debounce immediate re-trigger
    ld a, 8
    ld (screen_transition_cooldown), a
    call rebuild_used_entity_list  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state for new screen
    ret

check_transition_worldmap_1760724209990_s0_skip_west:
    ret

check_transition_worldmap_1760724209990_screen_1:
    ; East exit: X near right edge and rightward input
    ld a, (input_state)
    cp STICK_RIGHT
    jr z, .dir_ok_check_transition_worldmap_1760724209990_s1_skip_east
    cp STICK_UPRIGHT
    jr z, .dir_ok_check_transition_worldmap_1760724209990_s1_skip_east
    cp STICK_DOWNRIGHT
    jp nz, check_transition_worldmap_1760724209990_s1_skip_east
.dir_ok_check_transition_worldmap_1760724209990_s1_skip_east:
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp 240
    jp c, check_transition_worldmap_1760724209990_s1_skip_east
check_transition_worldmap_1760724209990_s1_apply_east:
    push de
    call load_screen_pan1_760723005040_far
    pop de
    ld a, 0
    ld (current_screen_index), a
    ld a, 0
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ld hl, entity_screen_id
    add hl, de
    ld (hl), a
    ; Enter from west edge
    ld hl, entity_x_pos
    add hl, de
    ld (hl), 2
    ; Reset player velocity after transition
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a

    ; Debounce immediate re-trigger
    ld a, 8
    ld (screen_transition_cooldown), a
    call rebuild_used_entity_list  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state for new screen
    ret

check_transition_worldmap_1760724209990_s1_skip_east:
    ; West exit: X near left edge and leftward input
    ld a, (input_state)
    cp STICK_LEFT
    jr z, .dir_ok_check_transition_worldmap_1760724209990_s1_skip_west
    cp STICK_UPLEFT
    jr z, .dir_ok_check_transition_worldmap_1760724209990_s1_skip_west
    cp STICK_DOWNLEFT
    jp nz, check_transition_worldmap_1760724209990_s1_skip_west
.dir_ok_check_transition_worldmap_1760724209990_s1_skip_west:
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp 2
    jp nc, check_transition_worldmap_1760724209990_s1_skip_west
check_transition_worldmap_1760724209990_s1_apply_west:
    push de
    call load_screen_pan3_760799152493_far
    pop de
    ld a, 2
    ld (current_screen_index), a
    ld a, 2
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ld hl, entity_screen_id
    add hl, de
    ld (hl), a
    ; Enter from east edge of target active area
    ld hl, entity_x_pos
    add hl, de
    ld (hl), 238
    ; Reset player velocity after transition
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a

    ; Debounce immediate re-trigger
    ld a, 8
    ld (screen_transition_cooldown), a
    call rebuild_used_entity_list  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state for new screen
    ret

check_transition_worldmap_1760724209990_s1_skip_west:
    ret

check_transition_worldmap_1760724209990_screen_2:
    ; East exit: X near right edge and rightward input
    ld a, (input_state)
    cp STICK_RIGHT
    jr z, .dir_ok_check_transition_worldmap_1760724209990_s2_skip_east
    cp STICK_UPRIGHT
    jr z, .dir_ok_check_transition_worldmap_1760724209990_s2_skip_east
    cp STICK_DOWNRIGHT
    jp nz, check_transition_worldmap_1760724209990_s2_skip_east
.dir_ok_check_transition_worldmap_1760724209990_s2_skip_east:
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp 240
    jp c, check_transition_worldmap_1760724209990_s2_skip_east
check_transition_worldmap_1760724209990_s2_apply_east:
    push de
    call load_screen_pan2_760784762679_far
    pop de
    ld a, 1
    ld (current_screen_index), a
    ld a, 1
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ld hl, entity_screen_id
    add hl, de
    ld (hl), a
    ; Enter from west edge
    ld hl, entity_x_pos
    add hl, de
    ld (hl), 2
    ; Reset player velocity after transition
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a

    ; Debounce immediate re-trigger
    ld a, 8
    ld (screen_transition_cooldown), a
    call rebuild_used_entity_list  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state for new screen
    ret

check_transition_worldmap_1760724209990_s2_skip_east:
    ; South exit: Y near bottom edge
    ; No input-direction gate: supports gravity/platform-driven movement
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    cp 176
    jp c, check_transition_worldmap_1760724209990_s2_skip_south
check_transition_worldmap_1760724209990_s2_apply_south:
    push de
    call load_screen_pan4_760799516565_far
    pop de
    ld a, 3
    ld (current_screen_index), a
    ld a, 3
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ld hl, entity_screen_id
    add hl, de
    ld (hl), a
    ; Enter from north edge
    ld hl, entity_y_pos
    add hl, de
    ld (hl), 2
    ; Reset player velocity after transition
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a

    ; Debounce immediate re-trigger
    ld a, 8
    ld (screen_transition_cooldown), a
    call rebuild_used_entity_list  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state for new screen
    ret

check_transition_worldmap_1760724209990_s2_skip_south:
    ret

check_transition_worldmap_1760724209990_screen_3:
    ; West exit: X near left edge and leftward input
    ld a, (input_state)
    cp STICK_LEFT
    jr z, .dir_ok_check_transition_worldmap_1760724209990_s3_skip_west
    cp STICK_UPLEFT
    jr z, .dir_ok_check_transition_worldmap_1760724209990_s3_skip_west
    cp STICK_DOWNLEFT
    jp nz, check_transition_worldmap_1760724209990_s3_skip_west
.dir_ok_check_transition_worldmap_1760724209990_s3_skip_west:
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp 2
    jp nc, check_transition_worldmap_1760724209990_s3_skip_west
check_transition_worldmap_1760724209990_s3_apply_west:
    push de
    call load_screen_pan7_761471728391_far
    pop de
    ld a, 6
    ld (current_screen_index), a
    ld a, 6
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ld hl, entity_screen_id
    add hl, de
    ld (hl), a
    ; Enter from east edge of target active area
    ld hl, entity_x_pos
    add hl, de
    ld (hl), 238
    ; Reset player velocity after transition
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a

    ; Debounce immediate re-trigger
    ld a, 8
    ld (screen_transition_cooldown), a
    call rebuild_used_entity_list  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state for new screen
    ret

check_transition_worldmap_1760724209990_s3_skip_west:
    ; South exit: Y near bottom edge
    ; No input-direction gate: supports gravity/platform-driven movement
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    cp 176
    jp c, check_transition_worldmap_1760724209990_s3_skip_south
check_transition_worldmap_1760724209990_s3_apply_south:
    push de
    call load_screen_pan5_760961565333_far
    pop de
    ld a, 4
    ld (current_screen_index), a
    ld a, 4
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ld hl, entity_screen_id
    add hl, de
    ld (hl), a
    ; Enter from north edge
    ld hl, entity_y_pos
    add hl, de
    ld (hl), 2
    ; Reset player velocity after transition
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a

    ; Debounce immediate re-trigger
    ld a, 8
    ld (screen_transition_cooldown), a
    call rebuild_used_entity_list  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state for new screen
    ret

check_transition_worldmap_1760724209990_s3_skip_south:
    ; North exit: Y near top edge
    ; No input-direction gate: supports velocity-driven movement
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    cp 2
    jp nc, check_transition_worldmap_1760724209990_s3_skip_north
check_transition_worldmap_1760724209990_s3_apply_north:
    push de
    call load_screen_pan3_760799152493_far
    pop de
    ld a, 2
    ld (current_screen_index), a
    ld a, 2
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ld hl, entity_screen_id
    add hl, de
    ld (hl), a
    ; Enter from south edge of target active area
    ld hl, entity_y_pos
    add hl, de
    ld (hl), 174
    ; Reset player velocity after transition
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a

    ; Debounce immediate re-trigger
    ld a, 8
    ld (screen_transition_cooldown), a
    call rebuild_used_entity_list  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state for new screen
    ret

check_transition_worldmap_1760724209990_s3_skip_north:
    ret

check_transition_worldmap_1760724209990_screen_4:
    ; West exit: X near left edge and leftward input
    ld a, (input_state)
    cp STICK_LEFT
    jr z, .dir_ok_check_transition_worldmap_1760724209990_s4_skip_west
    cp STICK_UPLEFT
    jr z, .dir_ok_check_transition_worldmap_1760724209990_s4_skip_west
    cp STICK_DOWNLEFT
    jp nz, check_transition_worldmap_1760724209990_s4_skip_west
.dir_ok_check_transition_worldmap_1760724209990_s4_skip_west:
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp 2
    jp nc, check_transition_worldmap_1760724209990_s4_skip_west
check_transition_worldmap_1760724209990_s4_apply_west:
    push de
    call load_screen_pan62_761237904051_far
    pop de
    ld a, 5
    ld (current_screen_index), a
    ld a, 5
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ld hl, entity_screen_id
    add hl, de
    ld (hl), a
    ; Enter from east edge of target active area
    ld hl, entity_x_pos
    add hl, de
    ld (hl), 238
    ; Reset player velocity after transition
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a

    ; Debounce immediate re-trigger
    ld a, 8
    ld (screen_transition_cooldown), a
    call rebuild_used_entity_list  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state for new screen
    ret

check_transition_worldmap_1760724209990_s4_skip_west:
    ; North exit: Y near top edge
    ; No input-direction gate: supports velocity-driven movement
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    cp 2
    jp nc, check_transition_worldmap_1760724209990_s4_skip_north
check_transition_worldmap_1760724209990_s4_apply_north:
    push de
    call load_screen_pan4_760799516565_far
    pop de
    ld a, 3
    ld (current_screen_index), a
    ld a, 3
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ld hl, entity_screen_id
    add hl, de
    ld (hl), a
    ; Enter from south edge of target active area
    ld hl, entity_y_pos
    add hl, de
    ld (hl), 174
    ; Reset player velocity after transition
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a

    ; Debounce immediate re-trigger
    ld a, 8
    ld (screen_transition_cooldown), a
    call rebuild_used_entity_list  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state for new screen
    ret

check_transition_worldmap_1760724209990_s4_skip_north:
    ret

check_transition_worldmap_1760724209990_screen_5:
    ; East exit: X near right edge and rightward input
    ld a, (input_state)
    cp STICK_RIGHT
    jr z, .dir_ok_check_transition_worldmap_1760724209990_s5_skip_east
    cp STICK_UPRIGHT
    jr z, .dir_ok_check_transition_worldmap_1760724209990_s5_skip_east
    cp STICK_DOWNRIGHT
    jp nz, check_transition_worldmap_1760724209990_s5_skip_east
.dir_ok_check_transition_worldmap_1760724209990_s5_skip_east:
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp 240
    jp c, check_transition_worldmap_1760724209990_s5_skip_east
check_transition_worldmap_1760724209990_s5_apply_east:
    push de
    call load_screen_pan5_760961565333_far
    pop de
    ld a, 4
    ld (current_screen_index), a
    ld a, 4
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ld hl, entity_screen_id
    add hl, de
    ld (hl), a
    ; Enter from west edge
    ld hl, entity_x_pos
    add hl, de
    ld (hl), 2
    ; Reset player velocity after transition
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a

    ; Debounce immediate re-trigger
    ld a, 8
    ld (screen_transition_cooldown), a
    call rebuild_used_entity_list  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state for new screen
    ret

check_transition_worldmap_1760724209990_s5_skip_east:
    ; North exit: Y near top edge
    ; No input-direction gate: supports velocity-driven movement
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    cp 2
    jp nc, check_transition_worldmap_1760724209990_s5_skip_north
check_transition_worldmap_1760724209990_s5_apply_north:
    push de
    call load_screen_pan7_761471728391_far
    pop de
    ld a, 6
    ld (current_screen_index), a
    ld a, 6
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ld hl, entity_screen_id
    add hl, de
    ld (hl), a
    ; Enter from south edge of target active area
    ld hl, entity_y_pos
    add hl, de
    ld (hl), 174
    ; Reset player velocity after transition
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a

    ; Debounce immediate re-trigger
    ld a, 8
    ld (screen_transition_cooldown), a
    call rebuild_used_entity_list  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state for new screen
    ret

check_transition_worldmap_1760724209990_s5_skip_north:
    ret

check_transition_worldmap_1760724209990_screen_6:
    ; East exit: X near right edge and rightward input
    ld a, (input_state)
    cp STICK_RIGHT
    jr z, .dir_ok_check_transition_worldmap_1760724209990_s6_skip_east
    cp STICK_UPRIGHT
    jr z, .dir_ok_check_transition_worldmap_1760724209990_s6_skip_east
    cp STICK_DOWNRIGHT
    jp nz, check_transition_worldmap_1760724209990_s6_skip_east
.dir_ok_check_transition_worldmap_1760724209990_s6_skip_east:
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp 240
    jp c, check_transition_worldmap_1760724209990_s6_skip_east
check_transition_worldmap_1760724209990_s6_apply_east:
    push de
    call load_screen_pan4_760799516565_far
    pop de
    ld a, 3
    ld (current_screen_index), a
    ld a, 3
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ld hl, entity_screen_id
    add hl, de
    ld (hl), a
    ; Enter from west edge
    ld hl, entity_x_pos
    add hl, de
    ld (hl), 2
    ; Reset player velocity after transition
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a

    ; Debounce immediate re-trigger
    ld a, 8
    ld (screen_transition_cooldown), a
    call rebuild_used_entity_list  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state for new screen
    ret

check_transition_worldmap_1760724209990_s6_skip_east:
    ; South exit: Y near bottom edge
    ; No input-direction gate: supports gravity/platform-driven movement
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    cp 176
    jp c, check_transition_worldmap_1760724209990_s6_skip_south
check_transition_worldmap_1760724209990_s6_apply_south:
    push de
    call load_screen_pan62_761237904051_far
    pop de
    ld a, 5
    ld (current_screen_index), a
    ld a, 5
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ld hl, entity_screen_id
    add hl, de
    ld (hl), a
    ; Enter from north edge
    ld hl, entity_y_pos
    add hl, de
    ld (hl), 2
    ; Reset player velocity after transition
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a

    ; Debounce immediate re-trigger
    ld a, 8
    ld (screen_transition_cooldown), a
    call rebuild_used_entity_list  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state for new screen
    ret

check_transition_worldmap_1760724209990_s6_skip_south:
    ret

; ==================================================================
; WORLD HELPER FUNCTIONS
; ==================================================================

; Get current world ID
; Output: A = current world ID
get_current_world_id:
    ld a, (current_world_id)
    ret

; Get current screen index
; Output: A = current screen index in world
get_current_screen_index:
    ld a, (current_screen_index)
    ret

; Set current screen
; Input: A = screen index
set_current_screen:
    ld (current_screen_index), a
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    call rebuild_used_entity_list
    ret

; ==================================================================
; END OF WORLDS
; ==================================================================


; --- End of Far Bank 9 — pad to 8KB boundary ---
    ds #C000 - $, #FF

; ##################################################################
; FAR BANK 10 — [#6000h-#8000h] FAR CODE: font
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank10 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-3). No far-to-far calls allowed.
; ##################################################################
    org #6000

; ==================================================================
; MSX FONT DATA FOR SCREEN 2 TEXT
; File: font.asm
; Description: Font pattern data generated from project assets
; ==================================================================

; FONT_DATA_ROM_DATA_GROUP: bank4
; (FONT_PATTERN_DATA and FONT_COLOR_DATA are in bank4 section, org #C000, for megarom builds)
FONT_PATTERN_DATA_BANK EQU ((FONT_PATTERN_DATA - #4000) / #2000)
FONT_COLOR_DATA_BANK   EQU ((FONT_COLOR_DATA - #4000) / #2000)

; [FONT_PATTERN_DATA blob emitted in bank4 section (org #C000)]

; Character index table (for quick lookup)
FONT_CHAR_INDEX:
    DB 32, 43, 45, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 62, 63, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 124
FONT_CHAR_COUNT EQU 43


; ==================================================================
; FONT LOADING FUNCTIONS
; ==================================================================

load_custom_font:
    ; Load custom font patterns to VRAM Pattern Generator Table
    ; Uses FONT_CHAR_INDEX to map specific characters to their correct VRAM addresses
    ld de, CHRTBL2                ; Bank 0 Base
    call load_font_patterns_to_bank
    ret

load_font_bank0:
    ld de, CHRTBL2                ; Bank 0 Base
    call load_font_patterns_to_bank
    ret

load_font_bank1:
    ld de, CHRTBL2 + #800         ; Bank 1 Base
    call load_font_patterns_to_bank
    ret

load_font_bank2:
    ld de, CHRTBL2 + #1000        ; Bank 2 Base
    call load_font_patterns_to_bank
    ret

load_all_font_banks:
    call load_font_bank0
    call load_font_bank1
    call load_font_bank2
    ret

; Helper: Load font patterns to a specific bank
; Input: DE = Bank Base Address
load_font_patterns_to_bank:
    call mapper_push_p2
    ld a, FONT_PATTERN_DATA_BANK
    call mapper_set_bank_p2
    ld ix, FONT_CHAR_INDEX        ; Pointer to ASCII codes
    ld iy, (FONT_PATTERN_DATA & #1FFF) | #8000      ; Pointer to pattern data (window addr for bank4)
    ld b, FONT_CHAR_COUNT         ; Number of characters to load

.load_loop:
    push bc                       ; Save loop counter
    push de                       ; Save bank base address

    ; Get ASCII code
    ld a, (ix)                    ; A = ASCII code
    inc ix                        ; Next index

    ; Calculate VRAM offset: Base + (ASCII * 8)
    ld l, a
    ld h, 0
    add hl, hl                    ; * 2
    add hl, hl                    ; * 4
    add hl, hl                    ; * 8
    add hl, de                    ; Add Base Address
    ex de, hl                     ; DE = VRAM Destination

    ; Prepare source pointer (IY is in RAM, so use HL)
    push iy
    pop hl                        ; HL = Source Pattern (IY)

    ; Copy 8 bytes
    ld bc, 8
    call FAST_LDIRVM              ; Copy from HL(RAM) to DE(VRAM)

    ; Advance source pointer
    ld bc, 8
    add iy, bc                    ; IY += 8

    pop de                        ; Restore bank base
    pop bc                        ; Restore loop counter
    djnz .load_loop
    call mapper_pop_p2
    ret

; [FONT_COLOR_DATA blob emitted in bank4 section (org #C000)]

load_font_colors:
    ld de, CLRTBL2                ; Bank 0 Base
    call load_font_colors_to_bank
    ret

load_font_colors_all_banks:
    ld de, CLRTBL2                ; Bank 0 Base
    call load_font_colors_to_bank

    ld de, CLRTBL2 + #800         ; Bank 1 Base
    call load_font_colors_to_bank

    ld de, CLRTBL2 + #1000        ; Bank 2 Base
    call load_font_colors_to_bank
    ret

; Helper: Load font colors to a specific bank
; Input: DE = Bank Base Address
load_font_colors_to_bank:
    call mapper_push_p2
    ld a, FONT_COLOR_DATA_BANK
    call mapper_set_bank_p2
    ld ix, FONT_CHAR_INDEX        ; Pointer to ASCII codes
    ld iy, (FONT_COLOR_DATA & #1FFF) | #8000        ; Pointer to color data (window addr for bank4)
    ld b, FONT_CHAR_COUNT         ; Number of characters to load

.load_colors_loop:
    push bc                       ; Save loop counter
    push de                       ; Save bank base address

    ; Get ASCII code
    ld a, (ix)                    ; A = ASCII code
    inc ix                        ; Next index

    ; Calculate VRAM offset: Base + (ASCII * 8)
    ld l, a
    ld h, 0
    add hl, hl                    ; * 2
    add hl, hl                    ; * 4
    add hl, hl                    ; * 8
    add hl, de                    ; Add Base Address
    ex de, hl                     ; DE = VRAM Destination

    ; Prepare source pointer
    push iy
    pop hl                        ; HL = Source Color (IY)

    ; Copy 8 bytes
    ld bc, 8
    call FAST_LDIRVM              ; Copy from HL(RAM) to DE(VRAM)

    ; Advance source pointer
    ld bc, 8
    add iy, bc                    ; IY += 8

    pop de                        ; Restore bank base
    pop bc                        ; Restore loop counter
    djnz .load_colors_loop
    call mapper_pop_p2
    ret

; ==================================================================
; TEXT RENDERING FUNCTIONS (Based on Mideas renderMSX1TextToDataURL)
; ==================================================================

; Print string to Screen 2 name table (text mode compatible)
; HL = string pointer (null-terminated), DE = VRAM position
print_string_screen2:
    push bc
    ld b, 0                        ; Character counter

print_string_loop:
    ld a, (hl)                     ; Get character
    or a                           ; Check for null terminator
    jr z, print_string_end         ; End if null

    ; Write character to VRAM Name Table
    ; FAST_WRTVRM signature: A = data, HL = VRAM address
    ; A already has character, HL already has VRAM address
    push hl                        ; Save string pointer
    push de                        ; Save VRAM position
    ex de, hl                      ; Swap: DE = string ptr, HL = VRAM address for FAST_WRTVRM
    call FAST_WRTVRM               ; Write character to VRAM (fast)
    pop de                         ; Restore VRAM position
    pop hl                         ; Restore string pointer

    ; Move to next character
    inc hl                         ; Next character in string
    inc de                         ; Next position in VRAM
    inc b                          ; Count characters
    ld a, b
    cp 32                          ; Limit to screen width
    jr nz, print_string_loop       ; Continue if not at edge

print_string_end:
    pop bc
    ret

; Initialize font system for Screen 2 text rendering
init_font_system:
    ; Load custom font patterns and colors
    call load_all_font_banks       ; Load patterns to all banks
    call load_font_colors_all_banks ; Load colors to all banks
    ret

; ==================================================================
; END OF FONT DATA
; ==================================================================


; --- End of Far Bank 10 — pad to 8KB boundary ---
    ds #8000 - $, #FF

; ##################################################################
; FAR BANK 11 — [#8000h-#A000h] FAR CODE: patterns_code
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P2, maps bank11 to P2,
; calls routine, then restores P2.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-3). No far-to-far calls allowed.
; ##################################################################
    org #8000

; ==================================================================
; TILE PATTERN DATA
; File: patterns.asm
; Description: Tile pattern definitions for MSX Screen 2
; 12 tiles detected
; ==================================================================

PATTERN_DATA_BANK EQU ((tile_pattern_bank0 - #4000) / #2000)

; PATTERN_DATA_ROM_DATA_GROUP: bank4
; (tile_pattern_bank0 and tilebank data are emitted in bank4 section, org #C000+)

; ==================================================================
; PATTERN LOADING FUNCTIONS
; ==================================================================
load_pattern_bank0:
    ; Load pattern bank 0 to VRAM (base patterns)
    ; Fast direct port access (no BIOS overhead)
    call mapper_push_p2
    ld a, PATTERN_DATA_BANK
    call mapper_set_bank_p2
    ld hl, (tile_pattern_bank0 & #1FFF) | #8000
    ld de, CHRTBL2 + (128 * 8)    ; VRAM pattern table bank 0 (start at char 128)
    ld bc, 360    ; Total bytes for all tile characters (16x16 tiles = 4 chars each)
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
    call mapper_pop_p2
    ret

load_pattern_bank1:
    ; Load pattern bank 1: same patterns as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
    call mapper_push_p2
    ld a, PATTERN_DATA_BANK
    call mapper_set_bank_p2
    ld hl, (tile_pattern_bank0 & #1FFF) | #8000     ; Same source as Bank 0
    ld de, CHRTBL2 + #800 + (128 * 8) ; VRAM pattern table bank 1 (+#800 offset + char 128)
    ld bc, 360    ; Total bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
    call mapper_pop_p2
    ret

load_pattern_bank2:
    ; Load pattern bank 2: same patterns as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
    call mapper_push_p2
    ld a, PATTERN_DATA_BANK
    call mapper_set_bank_p2
    ld hl, (tile_pattern_bank0 & #1FFF) | #8000     ; Same source as Bank 0
    ld de, CHRTBL2 + #1000 + (128 * 8) ; VRAM pattern table bank 2 (+#1000 offset + char 128)
    ld bc, 360    ; Total bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
    call mapper_pop_p2
    ret

load_patterns_to_vram:
    ; Load all pattern banks to VRAM (required for SCREEN 2)
    ; This loads the same patterns to all 3 banks (standard MSX Screen 2 setup)
    call load_pattern_bank0
    call load_pattern_bank1
    call load_pattern_bank2
    ret

; ==================================================================
; SCREEN 2 TILEBANK PATTERN DATA (tilebank_1760723902303)
; ==================================================================

tilebank_tilebank_1760723902303_load_pattern_bank0:
    call mapper_push_p2
    ld a, PATTERN_DATA_BANK
    call mapper_set_bank_p2
    ld hl, (tilebank_pattern_data_0 & #1FFF) | #8000
    ld de, CHRTBL2 + (128 * 8)
    ld bc, 328
    call FAST_LDIRVM
    call mapper_pop_p2
    ret

tilebank_tilebank_1760723902303_load_pattern_bank1:
    call mapper_push_p2
    ld a, PATTERN_DATA_BANK
    call mapper_set_bank_p2
    ld hl, (tilebank_pattern_data_0 & #1FFF) | #8000
    ld de, CHRTBL2 + #800 + (128 * 8)
    ld bc, 328
    call FAST_LDIRVM
    call mapper_pop_p2
    ret

tilebank_tilebank_1760723902303_load_pattern_bank2:
    call mapper_push_p2
    ld a, PATTERN_DATA_BANK
    call mapper_set_bank_p2
    ld hl, (tilebank_pattern_data_0 & #1FFF) | #8000
    ld de, CHRTBL2 + #1000 + (128 * 8)
    ld bc, 328
    call FAST_LDIRVM
    call mapper_pop_p2
    ret

load_tilebank_tilebank_1760723902303_patterns_to_vram:
    call tilebank_tilebank_1760723902303_load_pattern_bank0
    call tilebank_tilebank_1760723902303_load_pattern_bank1
    call tilebank_tilebank_1760723902303_load_pattern_bank2
    ret

; [tilebank_pattern_data_* emitted in bank4 section]

; ==================================================================
; END OF PATTERN DATA
; ==================================================================


; --- End of Far Bank 11 — pad to 8KB boundary ---
    ds #A000 - $, #FF

; ##################################################################
; FAR BANK 12 — [#A000h-#C000h] FAR CODE: colors_code
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P3, maps bank12 to P3,
; calls routine, then restores P3.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-3). No far-to-far calls allowed.
; ##################################################################
    org #A000

; ==================================================================
; TILE COLOR DATA
; File: colors.asm
; Description: Tile color definitions for MSX Screen 2
; 12 tiles detected
; ==================================================================

COLOR_DATA_BANK EQU ((tile_color_bank0 - #4000) / #2000)

; COLOR_DATA_ROM_DATA_GROUP: bank4
; (tile_color_bank0 and tilebank data are emitted in bank4 section, org #C000+)

; ==================================================================
; COLOR LOADING FUNCTIONS
; ==================================================================
load_color_bank0:
    ; Load color bank 0 to VRAM (base colors)
    ; Fast direct port access (no BIOS overhead)
    call mapper_push_p2
    ld a, COLOR_DATA_BANK
    call mapper_set_bank_p2
    ld hl, (tile_color_bank0 & #1FFF) | #8000
    ld de, CLRTBL2 + (128 * 8)    ; VRAM color table bank 0 (start at char 128)
    ld bc, 360     ; Total color bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
    call mapper_pop_p2
    ret

load_color_bank1:
    ; Load color bank 1: same colors as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
    call mapper_push_p2
    ld a, COLOR_DATA_BANK
    call mapper_set_bank_p2
    ld hl, (tile_color_bank0 & #1FFF) | #8000       ; Same source as Bank 0
    ld de, CLRTBL2 + #800 + (128 * 8) ; VRAM color table bank 1 (+#800 offset + char 128)
    ld bc, 360     ; Total color bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
    call mapper_pop_p2
    ret

load_color_bank2:
    ; Load color bank 2: same colors as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
    call mapper_push_p2
    ld a, COLOR_DATA_BANK
    call mapper_set_bank_p2
    ld hl, (tile_color_bank0 & #1FFF) | #8000       ; Same source as Bank 0
    ld de, CLRTBL2 + #1000 + (128 * 8) ; VRAM color table bank 2 (+#1000 offset + char 128)
    ld bc, 360     ; Total color bytes for all tile characters
    call FAST_LDIRVM              ; Fast VRAM write (direct port access)
    call mapper_pop_p2
    ret

load_colors_to_vram:
    ; Load all color banks to VRAM (required for SCREEN 2)
    ; This loads the same colors to all 3 banks (standard MSX Screen 2 setup)
    call load_color_bank0
    call load_color_bank1
    call load_color_bank2
    ret

; ==================================================================
; SCREEN 2 TILEBANK COLOR DATA (tilebank_1760723902303)
; ==================================================================

tilebank_tilebank_1760723902303_load_color_bank0:
    call mapper_push_p2
    ld a, COLOR_DATA_BANK
    call mapper_set_bank_p2
    ld hl, (tilebank_color_data_0 & #1FFF) | #8000
    ld de, CLRTBL2 + (128 * 8)
    ld bc, 328
    call FAST_LDIRVM
    call mapper_pop_p2
    ret

tilebank_tilebank_1760723902303_load_color_bank1:
    call mapper_push_p2
    ld a, COLOR_DATA_BANK
    call mapper_set_bank_p2
    ld hl, (tilebank_color_data_0 & #1FFF) | #8000
    ld de, CLRTBL2 + #800 + (128 * 8)
    ld bc, 328
    call FAST_LDIRVM
    call mapper_pop_p2
    ret

tilebank_tilebank_1760723902303_load_color_bank2:
    call mapper_push_p2
    ld a, COLOR_DATA_BANK
    call mapper_set_bank_p2
    ld hl, (tilebank_color_data_0 & #1FFF) | #8000
    ld de, CLRTBL2 + #1000 + (128 * 8)
    ld bc, 328
    call FAST_LDIRVM
    call mapper_pop_p2
    ret

load_tilebank_tilebank_1760723902303_colors_to_vram:
    call tilebank_tilebank_1760723902303_load_color_bank0
    call tilebank_tilebank_1760723902303_load_color_bank1
    call tilebank_tilebank_1760723902303_load_color_bank2
    ret

; [tilebank_color_data_* emitted in bank4 section]

; ==================================================================
; END OF COLOR DATA
; ==================================================================


; --- End of Far Bank 12 — pad to 8KB boundary ---
    ds #C000 - $, #FF

; ##################################################################
; FAR BANK 13 — [#6000h-#8000h] FAR CODE: menus
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank13 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-3). No far-to-far calls allowed.
; ##################################################################
    org #6000

; ==================================================================
; GAME MENUS
; File: menus.asm
; Description: Menu systems and user interface with custom font support
; ==================================================================

; ==================================================================
; MENU CONSTANTS
; ==================================================================

MENU_HISTORY_ID EQU 0

; ==================================================================
; MENU FUNCTIONS
; ==================================================================

show_menu_gfn_1762622270460:
    ; Display HISTORY menu
    ; Set background color using VDP
    ld b, 31 ; Background (high) | Border (low)
    ld c, 7                     ; VDP Register 7
    call FAST_WRTVDP

    ; Set system color variables
    ld a, 15
    ld (BDRCLR), a

    ld a, 1
    ld (BAKCLR), a

    ld a, 15                    ; Default text color (White)
    ld (FORCLR), a

    ; Clear screen with background color
    call CLS

    ; Display menu title
    ld hl, menu_gfn_1762622270460_title
    ld de, NAMETBL + (5 * 32) + 10
    call print_string_screen2

    ; Display menu options
    ; TODO: Add option rendering logic here

    ret

menu_gfn_1762622270460_title:
    db "HISTORY", 0

handle_menu_gfn_1762622270460:
    ; Handle HISTORY menu input
    call GTSTCK
    ; TODO: Implement input handling
    ret

; ==================================================================
; END OF MENUS
; ==================================================================


; --- End of Far Bank 13 — pad to 8KB boundary ---
    ds #8000 - $, #FF

; ==================================================================
; DATA BANKS — Zone-packed data (8192 bytes per zone)
; First data bank: 14
; Accessed through mapper P2 using
; (label & #1FFF) | #8000.
; BANK_NUMBER = ((label - #4000) / #2000)
; NOTE: Each zone is explicitly padded to preserve bank placement even after
;       server-side ZX0 block rewrites shrink individual data blobs.
; ==================================================================
; ------------------------------------------------------------------
; MEGAROM DATA ZONE PACKER
; Zone size: 8192 bytes
; Data start address: #20000
; Total data bytes (source blocks): 18199
; Zones used: 3
; ------------------------------------------------------------------
; ZONE 00 [#20000-#22000] bank 14 used=7523 slack=669
;   + tile_pattern_bank0 (patterns) @ +#0000 size=360
;   + tilebank_pattern_data_0 (patterns) @ +#0168 size=328
;   + tile_color_bank0 (colors) @ +#02B0 size=360
;   + tilebank_color_data_0 (colors) @ +#0418 size=328
;   + SCREEN_PAN1_0_LAYOUT (screens) @ +#0560 size=768
;   + SCREEN_PAN1_0_EFFECTS_LAYOUT (screens) @ +#0860 size=768
;   + SCREEN_PAN1_0_EFFECT_ZONE_TABLE (screens) @ +#0B60 size=1
;   + BEHAVIOR_PAN1_0_DATA (screens) @ +#0B61 size=768
;   + SCREEN_PAN2_1_LAYOUT (screens) @ +#0E61 size=768
;   + SCREEN_PAN2_1_EFFECTS_LAYOUT (screens) @ +#1161 size=768
;   + SCREEN_PAN2_1_EFFECT_ZONE_TABLE (screens) @ +#1461 size=1
;   + BEHAVIOR_PAN2_1_DATA (screens) @ +#1462 size=768
;   + SCREEN_PAN3_2_LAYOUT (screens) @ +#1762 size=768
;   + SCREEN_PAN3_2_EFFECTS_LAYOUT (screens) @ +#1A62 size=768
;   + SCREEN_PAN3_2_EFFECT_ZONE_TABLE (screens) @ +#1D62 size=1
; ZONE 01 [#22000-#24000] bank 15 used=7683 slack=509
;   + BEHAVIOR_PAN3_2_DATA (screens) @ +#0000 size=768
;   + SCREEN_PAN4_3_LAYOUT (screens) @ +#0300 size=768
;   + SCREEN_PAN4_3_EFFECTS_LAYOUT (screens) @ +#0600 size=768
;   + SCREEN_PAN4_3_EFFECT_ZONE_TABLE (screens) @ +#0900 size=1
;   + BEHAVIOR_PAN4_3_DATA (screens) @ +#0901 size=768
;   + SCREEN_PAN5_4_LAYOUT (screens) @ +#0C01 size=768
;   + SCREEN_PAN5_4_EFFECTS_LAYOUT (screens) @ +#0F01 size=768
;   + SCREEN_PAN5_4_EFFECT_ZONE_TABLE (screens) @ +#1201 size=1
;   + BEHAVIOR_PAN5_4_DATA (screens) @ +#1202 size=768
;   + SCREEN_PAN62_5_LAYOUT (screens) @ +#1502 size=768
;   + SCREEN_PAN62_5_EFFECTS_LAYOUT (screens) @ +#1802 size=768
;   + SCREEN_PAN62_5_EFFECT_ZONE_TABLE (screens) @ +#1B02 size=1
;   + BEHAVIOR_PAN62_5_DATA (screens) @ +#1B03 size=768
; ZONE 02 [#24000-#26000] bank 16 used=2993 slack=5199
;   + SCREEN_PAN7_6_LAYOUT (screens) @ +#0000 size=768
;   + SCREEN_PAN7_6_EFFECTS_LAYOUT (screens) @ +#0300 size=768
;   + SCREEN_PAN7_6_EFFECT_ZONE_TABLE (screens) @ +#0600 size=1
;   + BEHAVIOR_PAN7_6_DATA (screens) @ +#0601 size=768
;   + FONT_PATTERN_DATA (font) @ +#0901 size=344
;   + FONT_COLOR_DATA (font) @ +#0A59 size=344

    org #20000
; ==================================================================
; DATA ZONE 00 (bank 14) used=7523 slack=669
; ==================================================================
; ==================================================================
; TILE PATTERN BANK 0 (Base patterns) - bank4 data
; ==================================================================
tile_pattern_bank0:
    ; Tile 0: rajol_dalt_esq (16x16px = 4 MSX characters)
    db #03, #1F, #3F, #7F, #7E, #7D, #78, #F8, #FF, #FF, #AB, #D4, #AA, #50, #00, #00, #F2, #E8, #D0, #A0, #D0, #E0, #C0, #C0, #00, #20, #00, #00, #80, #00, #02, #00
    ; Tile 1: roca_blava1 (16x16px = 4 MSX characters)
    db #2B, #57, #2B, #57, #5F, #7B, #7F, #7C, #FF, #FF, #FB, #EF, #9D, #E7, #E7, #F7, #7F, #63, #4F, #7F, #77, #7D, #7F, #00, #EB, #D4, #EA, #D5, #2A, #C1, #FF, #00
    ; Tile 2: punxa (8x8px = 1 MSX characters)
    db #10, #10, #18, #18, #38, #38, #7C, #AC
    ; Tile 3: gel3 (16x16px = 4 MSX characters)
    db #00, #7F, #7F, #7A, #75, #7A, #75, #7A, #00, #FE, #EE, #BE, #5E, #BE, #5E, #BE, #75, #7A, #7D, #7F, #7F, #7F, #7F, #00, #5E, #BE, #FE, #FE, #FE, #7E, #F6, #00
    ; Tile 4: rajol_groc (16x16px = 4 MSX characters)
    db #00, #7F, #7F, #7F, #7F, #7F, #7F, #7F, #00, #FB, #FB, #FB, #FB, #FB, #FB, #FB, #7F, #00, #FE, #FE, #FE, #FE, #FE, #FE, #FB, #00, #FF, #FF, #FF, #FF, #FF, #FF
    ; Tile 5: gel2 (16x16px = 4 MSX characters)
    db #00, #7F, #7F, #7A, #75, #7A, #75, #7A, #00, #FE, #EE, #BE, #5E, #BE, #5E, #BE, #75, #7A, #7D, #7F, #7F, #7F, #7F, #00, #5E, #BE, #FE, #FE, #FE, #7E, #F6, #00
    ; Tile 6: rajol_dalt (16x16px = 4 MSX characters)
    db #DF, #FF, #EB, #5D, #A8, #10, #20, #24, #FB, #7F, #AD, #5B, #37, #00, #00, #08, #01, #00, #00, #00, #08, #00, #00, #01, #00, #00, #00, #00, #40, #00, #00, #02
    ; Tile 7: rajol_mig_ov (16x16px = 4 MSX characters)
    db #0F, #1F, #3A, #7D, #70, #58, #60, #C8, #F8, #FC, #96, #03, #15, #01, #05, #0B, #AC, #C4, #80, #C0, #C0, #C0, #C2, #C0, #05, #83, #05, #03, #25, #05, #03, #01
    ; Tile 8: rajol_esq (16x16px = 4 MSX characters)
    db #E0, #E0, #E0, #50, #E0, #C4, #E0, #C0, #00, #00, #80, #00, #02, #00, #00, #00, #A0, #C0, #C0, #C0, #F0, #A0, #C4, #C0, #00, #80, #00, #00, #20, #00, #01, #00
    ; Tile 9: rajols6 (16x16px = 4 MSX characters)
    db #1F, #7E, #FF, #BA, #D3, #F6, #EB, #BF, #FC, #96, #7B, #5D, #79, #FD, #79, #21, #FC, #A8, #E8, #9C, #DE, #6C, #3F, #00, #93, #25, #83, #25, #03, #0A, #FC, #00
    ; Tile 10: rajol_dalt_dreta (16x16px = 4 MSX characters)
    db #FF, #FF, #D5, #2B, #55, #22, #00, #00, #C0, #F8, #FC, #FE, #7E, #BE, #1E, #1F, #00, #20, #00, #00, #08, #00, #40, #01, #4F, #17, #0B, #05, #0B, #07, #03, #03
    ; Tile 11: rajol_dreta (16x16px = 4 MSX characters)
    db #00, #02, #00, #00, #40, #00, #10, #00, #07, #07, #07, #0A, #07, #23, #07, #03, #00, #01, #00, #08, #80, #00, #00, #00, #05, #03, #07, #0B, #07, #07, #85, #03

; Tilebank pattern data blocks

tilebank_pattern_data_0:
    db #03, #1F, #3F, #7F, #7E, #7D, #78, #F8, #FF, #FF, #AB, #D4, #AA, #50, #00, #00
    db #F2, #E8, #D0, #A0, #D0, #E0, #C0, #C0, #00, #20, #00, #00, #80, #00, #02, #00
    db #2B, #57, #2B, #57, #5F, #7B, #7F, #7C, #FF, #FF, #FB, #EF, #9D, #E7, #E7, #F7
    db #7F, #63, #4F, #7F, #77, #7D, #7F, #00, #EB, #D4, #EA, #D5, #2A, #C1, #FF, #00
    db #10, #10, #18, #18, #38, #38, #7C, #AC, #00, #7F, #7F, #7F, #7F, #7F, #7F, #7F
    db #00, #FB, #FB, #FB, #FB, #FB, #FB, #FB, #7F, #00, #FE, #FE, #FE, #FE, #FE, #FE
    db #FB, #00, #FF, #FF, #FF, #FF, #FF, #FF, #00, #7F, #7F, #7A, #75, #7A, #75, #7A
    db #00, #FE, #EE, #BE, #5E, #BE, #5E, #BE, #75, #7A, #7D, #7F, #7F, #7F, #7F, #00
    db #5E, #BE, #FE, #FE, #FE, #7E, #F6, #00, #DF, #FF, #EB, #5D, #A8, #10, #20, #24
    db #FB, #7F, #AD, #5B, #37, #00, #00, #08, #01, #00, #00, #00, #08, #00, #00, #01
    db #00, #00, #00, #00, #40, #00, #00, #02, #0F, #1F, #3A, #7D, #70, #58, #60, #C8
    db #F8, #FC, #96, #03, #15, #01, #05, #0B, #AC, #C4, #80, #C0, #C0, #C0, #C2, #C0
    db #05, #83, #05, #03, #25, #05, #03, #01, #E0, #E0, #E0, #50, #E0, #C4, #E0, #C0
    db #00, #00, #80, #00, #02, #00, #00, #00, #A0, #C0, #C0, #C0, #F0, #A0, #C4, #C0
    db #00, #80, #00, #00, #20, #00, #01, #00, #1F, #7E, #FF, #BA, #D3, #F6, #EB, #BF
    db #FC, #96, #7B, #5D, #79, #FD, #79, #21, #FC, #A8, #E8, #9C, #DE, #6C, #3F, #00
    db #93, #25, #83, #25, #03, #0A, #FC, #00, #FF, #FF, #D5, #2B, #55, #22, #00, #00
    db #C0, #F8, #FC, #FE, #7E, #BE, #1E, #1F, #00, #20, #00, #00, #08, #00, #40, #01
    db #4F, #17, #0B, #05, #0B, #07, #03, #03, #00, #02, #00, #00, #40, #00, #10, #00
    db #07, #07, #07, #0A, #07, #23, #07, #03, #00, #01, #00, #08, #80, #00, #00, #00
    db #05, #03, #07, #0B, #07, #07, #85, #03

; ==================================================================
; TILE COLOR BANK 0 (Base colors) - bank4 data
; ==================================================================
tile_color_bank0:
    ; Tile 0: rajol_dalt_esq colors (fg/bg pairs)
    db #51, #51, #51, #41, #41, #41, #41, #41, #51, #51, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41
    ; Tile 1: roca_blava1 colors (fg/bg pairs)
    db #41, #51, #51, #51, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #51, #51, #51, #51, #41, #41
    ; Tile 2: punxa colors (fg/bg pairs)
    db #81, #81, #81, #71, #71, #71, #71, #57
    ; Tile 3: gel3 colors (fg/bg pairs)
    db #71, #71, #71, #71, #71, #71, #71, #71, #71, #71, #71, #71, #71, #71, #71, #71, #71, #71, #71, #71, #71, #E1, #F1, #F1, #71, #71, #71, #71, #71, #E1, #F1, #F1
    ; Tile 4: rajol_groc colors (fg/bg pairs)
    db #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF
    ; Tile 5: gel2 colors (fg/bg pairs)
    db #71, #71, #71, #71, #71, #71, #71, #71, #71, #71, #71, #71, #71, #71, #71, #71, #71, #71, #71, #71, #71, #E1, #F1, #F1, #71, #71, #71, #71, #71, #E1, #F1, #F1
    ; Tile 6: rajol_dalt colors (fg/bg pairs)
    db #51, #51, #41, #41, #41, #41, #41, #41, #51, #51, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41
    ; Tile 7: rajol_mig_ov colors (fg/bg pairs)
    db #51, #51, #51, #41, #41, #41, #41, #41, #51, #51, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41
    ; Tile 8: rajol_esq colors (fg/bg pairs)
    db #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #51, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41
    ; Tile 9: rajols6 colors (fg/bg pairs)
    db #51, #51, #51, #41, #41, #41, #41, #41, #51, #51, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41
    ; Tile 10: rajol_dalt_dreta colors (fg/bg pairs)
    db #51, #51, #41, #41, #41, #41, #41, #41, #51, #51, #51, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41
    ; Tile 11: rajol_dreta colors (fg/bg pairs)
    db #41, #41, #41, #41, #51, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #51, #51, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41

; Tilebank color data blocks

tilebank_color_data_0:
    db #51, #51, #51, #41, #41, #41, #41, #41, #51, #51, #41, #41, #41, #41, #41, #41
    db #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41
    db #41, #51, #51, #51, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41
    db #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #51, #51, #51, #51, #41, #41
    db #81, #81, #81, #71, #71, #71, #71, #57, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF
    db #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF
    db #AF, #AF, #AF, #AF, #AF, #AF, #AF, #AF, #71, #71, #71, #71, #71, #71, #71, #71
    db #71, #71, #71, #71, #71, #71, #71, #71, #71, #71, #71, #71, #71, #E1, #F1, #F1
    db #71, #71, #71, #71, #71, #E1, #F1, #F1, #51, #51, #41, #41, #41, #41, #41, #41
    db #51, #51, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41
    db #41, #41, #41, #41, #41, #41, #41, #41, #51, #51, #51, #41, #41, #41, #41, #41
    db #51, #51, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41
    db #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41
    db #41, #41, #41, #41, #51, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41
    db #41, #41, #41, #41, #41, #41, #41, #41, #51, #51, #51, #41, #41, #41, #41, #41
    db #51, #51, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41
    db #41, #41, #41, #41, #41, #41, #41, #41, #51, #51, #41, #41, #41, #41, #41, #41
    db #51, #51, #51, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41
    db #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #41, #51, #41, #41, #41
    db #41, #41, #41, #41, #41, #41, #41, #41, #51, #51, #41, #41, #41, #41, #41, #41
    db #41, #41, #41, #41, #41, #41, #41, #41

; ==================================================================
; SCREEN DATA TABLES - bank4 section
; ==================================================================

;; MAP: pan1_0 (32x24 tiles)
;; Total size: 768 bytes

SCREEN_PAN1_0_WIDTH     EQU 32
SCREEN_PAN1_0_HEIGHT    EQU 24
SCREEN_PAN1_0_SIZE      EQU 768

SCREEN_PAN1_0_LAYOUT:
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#80,#81,#91,#92
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#82,#83,#93,#94
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#99,#9A,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#9B,#9C,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#99,#9A,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#9B,#9C,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#99,#9A,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#9B,#9C,#FF,#FF
    DB #80,#81,#91,#92,#91,#92,#91,#92,#91,#A1,#A2,#FF,#FF,#FF,#FF,#FF
    DB #80,#81,#A1,#A2,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#99,#9A,#FF,#FF
    DB #82,#83,#93,#94,#93,#94,#93,#94,#93,#A3,#A4,#FF,#FF,#FF,#FF,#FF
    DB #82,#83,#A3,#A4,#FF,#FF,#FF,#95,#96,#FF,#FF,#FF,#9B,#9C,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#97,#98,#FF,#FF,#FF,#99,#9A,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#80,#81,#91,#92,#91,#92,#9C,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#82,#83,#93,#94,#93,#94,#9A,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #80,#81,#91,#92,#91,#92,#91,#92,#92,#91,#92,#81,#9B,#9C,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#80,#81,#A1,#A2,#FF,#FF,#FF,#FF
    DB #82,#FF,#93,#94,#93,#94,#93,#94,#94,#93,#94,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#82,#83,#A3,#A4,#FF,#FF,#FF,#FF
    DB #99,#9A,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #80,#81,#91,#92,#91,#92,#91,#92,#91,#92,#91,#92,#91,#92,#91,#92
    DB #9B,#9C,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #82,#83,#93,#94,#93,#94,#93,#94,#93,#94,#93,#94,#93,#94,#93,#94
    DB #82,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF

SCREEN_PAN1_0_EFFECTS_LAYOUT:
    ; Alternate Effects layer for pan1
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF

SCREEN_PAN1_0_EFFECT_ZONE_TABLE:
    ; No effect zones for pan1
    DB #00

;; BEHAVIOR MAP: pan1_0 (32x24 tiles)
;; Total size: 768 bytes (Map IDs 0-255)
;; Data format: HEX

BEHAVIOR_PAN1_0_WIDTH     EQU 32
BEHAVIOR_PAN1_0_HEIGHT    EQU 24
BEHAVIOR_PAN1_0_SIZE      EQU 768

BEHAVIOR_PAN1_0_DATA:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#00,#00,#00,#10,#10,#00,#00,#00,#10,#10,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00,#00,#10,#10,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#00,#00,#00,#00
    DB #10,#00,#10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#00,#00,#00,#00
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

;; End of Behavior Map Data for pan1_0

;; MAP: pan2_1 (32x24 tiles)
;; Total size: 768 bytes

SCREEN_PAN2_1_WIDTH     EQU 32
SCREEN_PAN2_1_HEIGHT    EQU 24
SCREEN_PAN2_1_SIZE      EQU 768

SCREEN_PAN2_1_LAYOUT:
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #91,#92,#91,#92,#91,#92,#91,#92,#91,#92,#91,#A1,#A2,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #93,#94,#93,#94,#93,#94,#93,#94,#93,#94,#93,#A3,#A4,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #95,#96,#FF,#FF,#95,#96,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#80,#81,#A1,#A2,#FF,#FF,#80,#81,#A1,#A2
    DB #97,#98,#88,#88,#97,#98,#91,#92,#91,#92,#91,#92,#91,#92,#91,#92
    DB #91,#92,#91,#92,#91,#92,#82,#83,#A3,#A4,#88,#88,#82,#83,#A3,#A4
    DB #99,#9A,#91,#92,#FF,#FF,#93,#94,#93,#94,#93,#94,#93,#94,#93,#94
    DB #93,#94,#93,#94,#93,#94,#FF,#FF,#FF,#FF,#91,#92,#FF,#FF,#A5,#A6
    DB #9B,#9C,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#A7,#A8
    DB #99,#9A,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#A5,#A6
    DB #9B,#9C,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#A7,#A8
    DB #99,#9A,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#A5,#A6
    DB #9B,#9C,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#A7,#A8

SCREEN_PAN2_1_EFFECTS_LAYOUT:
    ; Alternate Effects layer for pan2
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF

SCREEN_PAN2_1_EFFECT_ZONE_TABLE:
    ; No effect zones for pan2
    DB #00

;; BEHAVIOR MAP: pan2_1 (32x24 tiles)
;; Total size: 768 bytes (Map IDs 0-255)
;; Data format: HEX

BEHAVIOR_PAN2_1_WIDTH     EQU 32
BEHAVIOR_PAN2_1_HEIGHT    EQU 24
BEHAVIOR_PAN2_1_SIZE      EQU 768

BEHAVIOR_PAN2_1_DATA:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#00,#00,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#00,#00,#10,#10,#10,#10
    DB #10,#10,#04,#04,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#04,#04,#10,#10,#10,#10
    DB #10,#10,#10,#10,#00,#00,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#10,#10,#10,#10,#00,#00,#00,#00,#10,#10,#00,#00,#10,#10
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10

;; End of Behavior Map Data for pan2_1

;; MAP: pan3_2 (32x24 tiles)
;; Total size: 768 bytes

SCREEN_PAN3_2_WIDTH     EQU 32
SCREEN_PAN3_2_HEIGHT    EQU 24
SCREEN_PAN3_2_SIZE      EQU 768

SCREEN_PAN3_2_LAYOUT:
    DB #A5,#A6,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #A7,#A8,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #A5,#A6,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #A7,#A8,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #A5,#A6,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #A7,#A8,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#88,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #A5,#A6,#FF,#FF,#FF,#FF,#FF,#FF,#80,#81,#81,#A1,#A2,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #A7,#A8,#FF,#FF,#FF,#FF,#FF,#FF,#82,#83,#83,#A3,#A4,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #A5,#A6,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#80,#81,#91,#92,#91,#92,#91,#92,#91,#92,#91,#92,#91,#92,#91
    DB #A7,#A8,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#82,#83,#93,#94,#93,#94,#93,#94,#93,#94,#93,#94,#93,#94,#93
    DB #A5,#A6,#A1,#A2,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #A7,#A8,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #A5,#A6,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #A7,#A8,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #A5,#A6,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #A7,#A8,#88,#88,#88,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #80,#81,#91,#92,#A1,#A2,#FF,#FF,#FF,#80,#81,#81,#A1,#A2,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#80,#81,#91,#92
    DB #82,#83,#93,#94,#A3,#A4,#FF,#FF,#FF,#82,#83,#83,#A3,#A4,#82,#91
    DB #92,#A1,#A2,#FF,#FF,#FF,#FF,#FF,#FF,#80,#81,#92,#82,#83,#93,#94
    DB #FF,#FF,#FF,#FF,#A5,#A6,#FF,#FF,#FF,#99,#9A,#FF,#FF,#FF,#FF,#93
    DB #94,#A3,#A4,#A2,#FF,#FF,#80,#81,#81,#82,#83,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#A7,#A8,#FF,#FF,#FF,#9B,#9C,#FF,#FF,#FF,#FF,#FF
    DB #FF,#83,#A3,#A4,#88,#88,#82,#83,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#A5,#A6,#FF,#FF,#FF,#99,#9A,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#91,#92,#91,#92,#91,#92,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#A7,#A8,#FF,#FF,#FF,#9B,#9C,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#93,#94,#93,#94,#93,#94,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#A5,#A6,#FF,#FF,#FF,#99,#9A,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#A7,#A8,#FF,#FF,#FF,#9B,#9C,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF

SCREEN_PAN3_2_EFFECTS_LAYOUT:
    ; Alternate Effects layer for pan3
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF

SCREEN_PAN3_2_EFFECT_ZONE_TABLE:
    ; No effect zones for pan3
    DB #00

;; BEHAVIOR MAP: pan3_2 (32x24 tiles)
;; Total size: 768 bytes (Map IDs 0-255)
;; Data format: HEX

BEHAVIOR_PAN3_2_WIDTH     EQU 32
BEHAVIOR_PAN3_2_HEIGHT    EQU 24
BEHAVIOR_PAN3_2_SIZE      EQU 768
    ds #22000 - $, #FF

    org #22000
; ==================================================================
; DATA ZONE 01 (bank 15) used=7683 slack=509
; ==================================================================
BEHAVIOR_PAN3_2_DATA:
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#04,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#04,#04,#04,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#10,#10,#10,#10,#10,#00,#00,#00,#10,#10,#10,#10,#10,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10
    DB #10,#10,#10,#10,#10,#10,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#10,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#10,#10,#00,#00,#00,#00,#10
    DB #10,#10,#10,#10,#00,#00,#10,#10,#10,#10,#10,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00
    DB #00,#10,#10,#10,#04,#04,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00
    DB #00,#00,#10,#10,#10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00
    DB #00,#00,#10,#10,#10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

;; End of Behavior Map Data for pan3_2

;; MAP: pan4_3 (32x24 tiles)
;; Total size: 768 bytes

SCREEN_PAN4_3_WIDTH     EQU 32
SCREEN_PAN4_3_HEIGHT    EQU 24
SCREEN_PAN4_3_SIZE      EQU 768

SCREEN_PAN4_3_LAYOUT:
    DB #FF,#FF,#FF,#FF,#A5,#A6,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#95
    DB #96,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#A7,#A8,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#97
    DB #98,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#A5,#A6,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#99
    DB #9A,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#A7,#A8,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#9B
    DB #9C,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#A5,#A6,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#99
    DB #9A,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#A7,#A8,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#9B
    DB #9C,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#A5,#A6,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#99
    DB #9A,#91,#92,#91,#92,#91,#92,#91,#92,#91,#92,#91,#92,#91,#92,#91
    DB #FF,#FF,#FF,#FF,#A7,#A8,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#9B
    DB #9C,#93,#94,#93,#94,#93,#94,#93,#94,#93,#94,#93,#94,#93,#94,#93
    DB #FF,#FF,#FF,#FF,#A5,#A6,#9D,#9E,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#99,#9A,#FF
    DB #FF,#FF,#FF,#FF,#A7,#A8,#9F,#A0,#9D,#9E,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#9B,#9C,#FF
    DB #FF,#FF,#FF,#FF,#A5,#A6,#FF,#FF,#9F,#A0,#9D,#9E,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#99,#9A,#FF
    DB #FF,#FF,#FF,#FF,#A7,#A8,#FF,#FF,#FF,#FF,#9F,#A0,#9D,#9E,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#9B,#9C,#FF
    DB #FF,#FF,#FF,#FF,#A5,#A6,#FF,#FF,#FF,#FF,#FF,#FF,#9F,#A0,#9D,#9E
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#99,#9A,#FF
    DB #FF,#FF,#FF,#FF,#A7,#A8,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#9F,#A0
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#9B,#9C,#FF
    DB #FF,#FF,#FF,#FF,#A5,#A6,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#99,#9A,#FF
    DB #FF,#FF,#FF,#FF,#A7,#A8,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#9B,#9C,#FF
    DB #FF,#FF,#FF,#FF,#A5,#A6,#FF,#FF,#FF,#80,#81,#81,#A1,#A2,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#99,#9A,#FF
    DB #FF,#FF,#FF,#FF,#A7,#A8,#FF,#FF,#FF,#82,#83,#83,#A3,#A4,#A1,#A2
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#9B,#9C,#FF
    DB #FF,#FF,#FF,#FF,#A5,#A6,#FF,#FF,#FF,#99,#9A,#FF,#FF,#FF,#FF,#A4
    DB #A1,#A2,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#99,#9A,#FF
    DB #FF,#FF,#FF,#FF,#A7,#A8,#FF,#FF,#FF,#9B,#9C,#FF,#FF,#FF,#FF,#83
    DB #A3,#A4,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#9B,#9C,#FF
    DB #FF,#FF,#FF,#FF,#A5,#A6,#FF,#FF,#FF,#99,#9A,#FF,#FF,#FF,#FF,#FF
    DB #A5,#A6,#FF,#FF,#FF,#95,#96,#FF,#FF,#FF,#FF,#FF,#80,#81,#FF,#FF
    DB #FF,#FF,#FF,#FF,#A7,#A8,#FF,#FF,#FF,#9B,#9C,#FF,#FF,#FF,#FF,#FF
    DB #A7,#A8,#88,#88,#88,#97,#98,#FF,#FF,#FF,#FF,#FF,#82,#83,#FF,#FF
    DB #FF,#FF,#FF,#FF,#A5,#A6,#FF,#FF,#FF,#99,#9A,#FF,#FF,#FF,#FF,#FF
    DB #FF,#91,#92,#91,#92,#A5,#A6,#FF,#FF,#FF,#FF,#FF,#99,#9A,#9A,#FF
    DB #FF,#FF,#FF,#FF,#A7,#A8,#FF,#FF,#FF,#9B,#9C,#FF,#FF,#FF,#FF,#FF
    DB #FF,#93,#94,#93,#94,#FF,#A8,#FF,#FF,#FF,#FF,#FF,#9B,#9C,#9C,#FF

SCREEN_PAN4_3_EFFECTS_LAYOUT:
    ; Alternate Effects layer for pan4
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF

SCREEN_PAN4_3_EFFECT_ZONE_TABLE:
    ; No effect zones for pan4
    DB #00

;; BEHAVIOR MAP: pan4_3 (32x24 tiles)
;; Total size: 768 bytes (Map IDs 0-255)
;; Data format: HEX

BEHAVIOR_PAN4_3_WIDTH     EQU 32
BEHAVIOR_PAN4_3_HEIGHT    EQU 24
BEHAVIOR_PAN4_3_SIZE      EQU 768

BEHAVIOR_PAN4_3_DATA:
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #00,#00,#00,#00,#10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00
    DB #00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00
    DB #00,#00,#00,#00,#10,#10,#00,#00,#10,#10,#10,#10,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#00,#10,#10,#10,#10,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#10,#10,#10,#10,#10,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#10,#10,#00,#00,#00,#00,#10
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#10,#10,#00,#00,#00,#00,#10
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00
    DB #10,#10,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00,#10,#10,#00,#00
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00
    DB #10,#10,#04,#04,#04,#10,#10,#00,#00,#00,#00,#00,#10,#10,#00,#00
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00
    DB #00,#10,#10,#10,#10,#10,#10,#00,#00,#00,#00,#00,#10,#10,#10,#00
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#10,#10,#00,#00,#00,#00,#00
    DB #00,#10,#10,#10,#10,#00,#10,#00,#00,#00,#00,#00,#10,#10,#10,#00

;; End of Behavior Map Data for pan4_3

;; MAP: pan5_4 (32x24 tiles)
;; Total size: 768 bytes

SCREEN_PAN5_4_WIDTH     EQU 32
SCREEN_PAN5_4_HEIGHT    EQU 24
SCREEN_PAN5_4_SIZE      EQU 768

SCREEN_PAN5_4_LAYOUT:
    DB #FF,#FF,#FF,#FF,#99,#A6,#FF,#FF,#FF,#85,#84,#85,#84,#85,#84,#85
    DB #84,#85,#84,#84,#85,#84,#85,#FF,#FF,#FF,#FF,#FF,#84,#85,#84,#85
    DB #FF,#FF,#FF,#FF,#9B,#A8,#FF,#FF,#FF,#87,#86,#87,#86,#87,#86,#87
    DB #86,#87,#86,#86,#87,#86,#87,#FF,#FF,#FF,#FF,#FF,#86,#87,#86,#87
    DB #FF,#FF,#FF,#FF,#99,#A6,#FF,#FF,#FF,#84,#85,#84,#85,#84,#85,#84
    DB #85,#84,#85,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#85,#84,#85,#84
    DB #FF,#FF,#FF,#FF,#9B,#A8,#FF,#FF,#FF,#86,#87,#86,#87,#86,#87,#86
    DB #87,#86,#87,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#87,#86,#87,#86
    DB #FF,#FF,#FF,#FF,#99,#A6,#FF,#FF,#FF,#85,#84,#85,#84,#85,#84,#85
    DB #84,#85,#84,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#84,#85,#84,#85
    DB #FF,#FF,#FF,#FF,#9B,#A8,#FF,#FF,#FF,#87,#86,#87,#86,#87,#86,#87
    DB #86,#87,#86,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#86,#87,#86,#87
    DB #85,#84,#85,#84,#99,#A6,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#85,#FF,#FF,#84
    DB #87,#86,#87,#86,#9B,#A8,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#87,#FF,#FF,#86
    DB #84,#85,#84,#85,#99,#A6,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#85
    DB #86,#87,#86,#87,#9B,#A8,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#87
    DB #85,#84,#85,#84,#85,#84,#85,#84,#85,#FF,#FF,#84,#85,#FF,#FF,#84
    DB #85,#84,#85,#FF,#FF,#84,#85,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#84
    DB #87,#86,#87,#86,#87,#86,#87,#86,#87,#FF,#FF,#86,#87,#FF,#FF,#86
    DB #87,#86,#87,#FF,#FF,#86,#87,#FF,#FF,#84,#85,#FF,#FF,#FF,#FF,#86
    DB #84,#85,#84,#85,#84,#85,#84,#85,#84,#FF,#FF,#FF,#FF,#FF,#FF,#85
    DB #84,#85,#84,#FF,#FF,#FF,#FF,#FF,#FF,#86,#87,#FF,#FF,#FF,#84,#85
    DB #86,#87,#86,#87,#86,#87,#86,#87,#86,#FF,#FF,#FF,#FF,#FF,#FF,#87
    DB #86,#87,#86,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#86,#87
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#84
    DB #85,#84,#85,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#84
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#86
    DB #87,#86,#87,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#86
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#85
    DB #84,#85,#84,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#84,#85,#84,#85
    DB #86,#87,#86,#87,#86,#87,#86,#87,#86,#87,#86,#87,#86,#87,#86,#87
    DB #86,#87,#86,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#86,#87,#86,#87
    DB #85,#84,#85,#84,#85,#84,#85,#84,#85,#84,#85,#84,#85,#84,#85,#84
    DB #85,#84,#85,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#84,#85,#84,#85
    DB #87,#86,#87,#86,#87,#86,#87,#86,#87,#86,#87,#86,#87,#86,#87,#86
    DB #87,#86,#87,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#86,#87,#86,#87
    DB #84,#85,#84,#85,#84,#85,#84,#85,#84,#85,#84,#85,#84,#85,#84,#85
    DB #84,#85,#84,#9D,#9E,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#85,#84,#85,#84
    DB #86,#87,#86,#87,#86,#87,#86,#87,#86,#87,#86,#87,#86,#87,#86,#87
    DB #86,#87,#86,#9F,#A0,#88,#88,#88,#88,#88,#88,#88,#87,#86,#87,#86
    DB #85,#84,#85,#84,#85,#84,#85,#84,#85,#84,#85,#84,#85,#84,#85,#84
    DB #85,#84,#85,#84,#85,#84,#85,#84,#85,#84,#85,#84,#85,#84,#85,#84
    DB #87,#86,#87,#86,#87,#86,#87,#86,#87,#86,#87,#86,#87,#86,#87,#86
    DB #87,#86,#87,#86,#87,#86,#87,#86,#87,#86,#87,#86,#87,#86,#87,#86

SCREEN_PAN5_4_EFFECTS_LAYOUT:
    ; Alternate Effects layer for pan5
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF

SCREEN_PAN5_4_EFFECT_ZONE_TABLE:
    ; No effect zones for pan5
    DB #00

;; BEHAVIOR MAP: pan5_4 (32x24 tiles)
;; Total size: 768 bytes (Map IDs 0-255)
;; Data format: HEX

BEHAVIOR_PAN5_4_WIDTH     EQU 32
BEHAVIOR_PAN5_4_HEIGHT    EQU 24
BEHAVIOR_PAN5_4_SIZE      EQU 768

BEHAVIOR_PAN5_4_DATA:
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#10,#10,#10,#10,#10,#00,#00,#00,#00,#00,#10,#10,#10,#10
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#10,#10,#10,#10,#10,#00,#00,#00,#00,#00,#10,#10,#10,#10
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10
    DB #00,#00,#00,#00,#10,#10,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10
    DB #10,#10,#10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#00,#00,#10
    DB #10,#10,#10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#00,#00,#10
    DB #10,#10,#10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#10,#10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#00,#10,#10,#00,#00,#10
    DB #10,#10,#10,#00,#00,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#00,#10,#10,#00,#00,#10
    DB #10,#10,#10,#00,#00,#10,#10,#00,#00,#10,#10,#00,#00,#00,#00,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#10
    DB #10,#10,#10,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00,#00,#10,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#10
    DB #10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#10,#10,#10,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#10,#10,#10,#04,#04,#04,#04,#04,#04,#04,#10,#10,#10,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10

;; End of Behavior Map Data for pan5_4

;; MAP: pan62_5 (32x24 tiles)
;; Total size: 768 bytes

SCREEN_PAN62_5_WIDTH     EQU 32
SCREEN_PAN62_5_HEIGHT    EQU 24
SCREEN_PAN62_5_SIZE      EQU 768

SCREEN_PAN62_5_LAYOUT:
    DB #84,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #86,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #84,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #86,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#84,#85,#84,#85,#84,#85,#84,#85,#84,#FF,#FF,#FF,#FF
    DB #84,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #86,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #84,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#84
    DB #86,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#88,#88,#88,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#86
    DB #84,#FF,#FF,#FF,#FF,#FF,#84,#85,#84,#85,#84,#85,#84,#85,#84,#85
    DB #84,#85,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#84
    DB #86,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#86
    DB #84,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#84
    DB #86,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#86
    DB #84,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#84
    DB #86,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#86
    DB #84,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #86,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #84,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #86,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#84,#85,#84,#85,#84,#85,#84,#85
    DB #84,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#86,#87,#86,#87,#86,#87,#86,#87
    DB #86,#91,#92,#91,#92,#91,#92,#91,#92,#91,#92,#91,#92,#91,#92,#A1
    DB #A2,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#85,#84,#85,#84,#85,#84,#85,#84
    DB #84,#93,#94,#93,#94,#93,#94,#93,#94,#93,#94,#93,#94,#93,#94,#A3
    DB #A4,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#87,#86,#87,#86,#87,#86,#87,#86
    DB #86,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#9F
    DB #A0,#88,#88,#88,#88,#88,#88,#88,#84,#85,#84,#85,#84,#85,#84,#85
    DB #84,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#91
    DB #92,#91,#92,#91,#92,#91,#92,#91,#92,#91,#92,#91,#92,#91,#92,#86
    DB #86,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#93
    DB #94,#93,#94,#93,#94,#93,#94,#93,#94,#93,#94,#93,#94,#93,#94,#84

SCREEN_PAN62_5_EFFECTS_LAYOUT:
    ; Alternate Effects layer for pan62
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF

SCREEN_PAN62_5_EFFECT_ZONE_TABLE:
    ; No effect zones for pan62
    DB #00

;; BEHAVIOR MAP: pan62_5 (32x24 tiles)
;; Total size: 768 bytes (Map IDs 0-255)
;; Data format: HEX

BEHAVIOR_PAN62_5_WIDTH     EQU 32
BEHAVIOR_PAN62_5_HEIGHT    EQU 24
BEHAVIOR_PAN62_5_SIZE      EQU 768

BEHAVIOR_PAN62_5_DATA:
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#04,#04,#04,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#04,#04,#04,#04,#04,#04,#04,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10

;; End of Behavior Map Data for pan62_5

;; MAP: pan7_6 (32x24 tiles)
;; Total size: 768 bytes

SCREEN_PAN7_6_WIDTH     EQU 32
SCREEN_PAN7_6_HEIGHT    EQU 24
SCREEN_PAN7_6_SIZE      EQU 768
    ds #24000 - $, #FF

    org #24000
; ==================================================================
; DATA ZONE 02 (bank 16) used=2993 slack=5199
; ==================================================================
SCREEN_PAN7_6_LAYOUT:
    DB #84,#9D,#9E,#9D,#9E,#9D,#9E,#9D,#9E,#9D,#9E,#9D,#9E,#9D,#9E,#9D
    DB #9E,#9D,#9E,#9D,#9E,#9D,#9E,#9D,#9E,#9D,#9E,#9D,#9E,#85,#9D,#9E
    DB #86,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#8D,#8E,#FF,#FF
    DB #84,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#8F,#90,#FF,#FF
    DB #86,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#84,#85,#84,#85,#84,#85,#84,#85,#84,#85,#84,#FF,#FF
    DB #84,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#87,#86,#FF,#FF
    DB #86,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#84,#85,#FF,#FF
    DB #84,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#86,#87,#FF,#FF
    DB #86,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#85,#84,#FF,#FF
    DB #84,#FF,#FF,#FF,#FF,#FF,#84,#85,#84,#85,#84,#85,#84,#85,#84,#85
    DB #84,#85,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#87,#86,#FF,#FF
    DB #86,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#84,#85,#FF,#FF
    DB #84,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#86,#87,#FF,#FF
    DB #86,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#85,#84,#FF,#FF
    DB #84,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#87,#86,#FF,#FF
    DB #86,#FF,#FF,#FF,#FF,#FF,#84,#85,#84,#85,#84,#85,#84,#85,#84,#85
    DB #84,#85,#84,#85,#84,#85,#84,#85,#84,#85,#84,#85,#84,#85,#FF,#FF
    DB #84,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#86,#87,#FF,#FF
    DB #86,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#85,#84,#FF,#FF
    DB #84,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#87,#86,#84,#85
    DB #86,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#86,#87,#86,#87,#84,#85,#86,#87
    DB #84,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#85,#84,#85,#84,#86,#87,#84,#85
    DB #86,#FF,#FF,#FF,#FF,#FF,#FF,#85,#84,#85,#84,#85,#84,#85,#84,#85
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#87,#86,#87,#86,#85,#84,#86,#87
    DB #84,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#87,#86,#84,#85
    DB #86,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#84,#85,#86,#87
    DB #84,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#86,#87,#84,#85
    DB #86,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#85,#84,#86,#87

SCREEN_PAN7_6_EFFECTS_LAYOUT:
    ; Alternate Effects layer for pan7
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF

SCREEN_PAN7_6_EFFECT_ZONE_TABLE:
    ; No effect zones for pan7
    DB #00

;; BEHAVIOR MAP: pan7_6 (32x24 tiles)
;; Total size: 768 bytes (Map IDs 0-255)
;; Data format: HEX

BEHAVIOR_PAN7_6_WIDTH     EQU 32
BEHAVIOR_PAN7_6_HEIGHT    EQU 24
BEHAVIOR_PAN7_6_SIZE      EQU 768

BEHAVIOR_PAN7_6_DATA:
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#11,#11,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#11,#11,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00
    DB #10,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00
    DB #10,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#10,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#00,#00
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#10,#10
    DB #00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10,#10,#10,#10,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10
    DB #10,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#10,#10,#10,#10

;; End of Behavior Map Data for pan7_6

FONT_PATTERN_DATA:
    ; Char 32 (' ')
    DB #00, #00, #00, #00, #00, #00, #00, #00
    ; Char 43 ('+')
    DB #00, #10, #10, #7C, #10, #10, #00, #00
    ; Char 45 ('-')
    DB #00, #00, #00, #7E, #00, #00, #00, #00
    ; Char 48 ('0')
    DB #3E, #7F, #73, #73, #73, #7F, #3E, #00
    ; Char 49 ('1')
    DB #18, #38, #18, #18, #18, #18, #7E, #00
    ; Char 50 ('2')
    DB #3E, #7F, #03, #3E, #60, #7F, #3E, #00
    ; Char 51 ('3')
    DB #3E, #7F, #03, #3E, #03, #7F, #3E, #00
    ; Char 52 ('4')
    DB #06, #0E, #1E, #36, #7F, #06, #06, #00
    ; Char 53 ('5')
    DB #7F, #7F, #60, #7E, #03, #7F, #3E, #00
    ; Char 54 ('6')
    DB #3E, #7F, #60, #7E, #63, #7F, #3E, #00
    ; Char 55 ('7')
    DB #7F, #7F, #03, #06, #0C, #18, #18, #00
    ; Char 56 ('8')
    DB #3E, #7F, #63, #3E, #63, #7F, #3E, #00
    ; Char 57 ('9')
    DB #3E, #7F, #63, #3F, #03, #7F, #3E, #00
    ; Char 58 (':')
    DB #00, #36, #36, #00, #36, #36, #00, #00
    ; Char 62 ('>')
    DB #00, #30, #18, #0C, #18, #30, #00, #00
    ; Char 63 ('?')
    DB #3E, #7F, #63, #18, #18, #00, #18, #00
    ; Char 65 ('A')
    DB #3E, #7F, #63, #7F, #7F, #63, #63, #00
    ; Char 66 ('B')
    DB #7E, #7F, #63, #7E, #63, #7F, #7E, #00
    ; Char 67 ('C')
    DB #3C, #7E, #60, #60, #60, #7E, #3C, #00
    ; Char 68 ('D')
    DB #7C, #7E, #66, #66, #66, #7E, #7C, #00
    ; Char 69 ('E')
    DB #7F, #7F, #60, #7C, #60, #7F, #7F, #00
    ; Char 70 ('F')
    DB #7F, #7F, #60, #7C, #60, #60, #60, #00
    ; Char 71 ('G')
    DB #3E, #7F, #63, #60, #67, #7F, #3E, #00
    ; Char 72 ('H')
    DB #63, #63, #63, #7F, #63, #63, #63, #00
    ; Char 73 ('I')
    DB #3E, #3E, #1C, #1C, #1C, #3E, #3E, #00
    ; Char 74 ('J')
    DB #1F, #1F, #06, #06, #66, #7E, #3C, #00
    ; Char 75 ('K')
    DB #63, #66, #6C, #78, #6C, #66, #63, #00
    ; Char 76 ('L')
    DB #60, #60, #60, #60, #60, #7F, #7F, #00
    ; Char 77 ('M')
    DB #63, #77, #7F, #6B, #63, #63, #63, #00
    ; Char 78 ('N')
    DB #63, #73, #7B, #6F, #67, #63, #63, #00
    ; Char 79 ('O')
    DB #3E, #7F, #63, #63, #63, #7F, #3E, #00
    ; Char 80 ('P')
    DB #7E, #7F, #63, #7E, #60, #60, #60, #00
    ; Char 81 ('Q')
    DB #3E, #7F, #63, #6B, #67, #7F, #3E, #00
    ; Char 82 ('R')
    DB #7E, #7F, #63, #7E, #7B, #6F, #63, #00
    ; Char 83 ('S')
    DB #3E, #7F, #60, #3E, #0F, #7F, #3E, #00
    ; Char 84 ('T')
    DB #7F, #7F, #18, #18, #18, #18, #18, #00
    ; Char 85 ('U')
    DB #63, #63, #63, #63, #63, #7F, #3E, #00
    ; Char 86 ('V')
    DB #63, #63, #63, #63, #36, #1C, #08, #00
    ; Char 87 ('W')
    DB #63, #63, #63, #6B, #7F, #77, #63, #00
    ; Char 88 ('X')
    DB #63, #63, #36, #1C, #36, #63, #63, #00
    ; Char 89 ('Y')
    DB #63, #63, #36, #1C, #18, #18, #18, #00
    ; Char 90 ('Z')
    DB #7F, #7F, #06, #0C, #30, #7F, #7F, #00
    ; Char 124 ('|')
    DB #18, #18, #18, #18, #18, #18, #18, #18

FONT_COLOR_DATA:
    ; Char 32
    DB #F1, #F1, #F1, #F1, #F1, #F1, #F1, #F1
    ; Char 43
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 45
    DB #F1, #F1, #F1, #F1, #F1, #F1, #F1, #F1
    ; Char 48
    DB #F1, #F1, #F1, #F1, #F1, #F1, #F1, #F1
    ; Char 49
    DB #F1, #F1, #F1, #F1, #F1, #F1, #F1, #F1
    ; Char 50
    DB #F1, #F1, #F1, #F1, #F1, #F1, #F1, #F1
    ; Char 51
    DB #F1, #F1, #F1, #F1, #F1, #F1, #F1, #F1
    ; Char 52
    DB #F1, #F1, #F1, #F1, #F1, #F1, #F1, #F1
    ; Char 53
    DB #F1, #F1, #F1, #F1, #F1, #F1, #F1, #F1
    ; Char 54
    DB #F1, #F1, #F1, #F1, #F1, #F1, #F1, #F1
    ; Char 55
    DB #F1, #F1, #F1, #F1, #F1, #F1, #F1, #F1
    ; Char 56
    DB #F1, #F1, #F1, #F1, #F1, #F1, #F1, #F1
    ; Char 57
    DB #F1, #F1, #F1, #F1, #F1, #F1, #F1, #F1
    ; Char 58
    DB #F1, #F1, #F1, #F1, #F1, #F1, #F1, #F1
    ; Char 62
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 63
    DB #F1, #F1, #F1, #F1, #F1, #F1, #F1, #F1
    ; Char 65
    DB #41, #41, #41, #41, #51, #51, #51, #51
    ; Char 66
    DB #41, #41, #41, #41, #51, #51, #51, #51
    ; Char 67
    DB #41, #41, #41, #41, #51, #51, #51, #51
    ; Char 68
    DB #41, #41, #41, #41, #51, #51, #51, #51
    ; Char 69
    DB #41, #41, #41, #41, #51, #51, #51, #51
    ; Char 70
    DB #41, #41, #41, #41, #51, #51, #51, #51
    ; Char 71
    DB #41, #41, #41, #41, #51, #51, #51, #51
    ; Char 72
    DB #41, #41, #41, #41, #51, #51, #51, #51
    ; Char 73
    DB #41, #41, #41, #41, #51, #51, #51, #51
    ; Char 74
    DB #41, #41, #41, #41, #51, #51, #51, #51
    ; Char 75
    DB #41, #41, #41, #41, #51, #51, #51, #51
    ; Char 76
    DB #41, #41, #41, #41, #51, #51, #51, #51
    ; Char 77
    DB #41, #41, #41, #41, #51, #51, #51, #51
    ; Char 78
    DB #41, #41, #41, #41, #51, #51, #51, #51
    ; Char 79
    DB #41, #41, #41, #41, #51, #51, #51, #51
    ; Char 80
    DB #41, #41, #41, #41, #51, #51, #51, #51
    ; Char 81
    DB #41, #41, #41, #41, #51, #51, #51, #51
    ; Char 82
    DB #41, #41, #41, #41, #51, #51, #51, #51
    ; Char 83
    DB #41, #41, #41, #41, #51, #51, #51, #51
    ; Char 84
    DB #41, #41, #41, #41, #51, #51, #51, #51
    ; Char 85
    DB #41, #41, #41, #41, #51, #51, #51, #51
    ; Char 86
    DB #41, #41, #41, #41, #51, #51, #51, #51
    ; Char 87
    DB #41, #41, #41, #41, #51, #51, #51, #51
    ; Char 88
    DB #41, #41, #41, #41, #51, #51, #51, #51
    ; Char 89
    DB #41, #41, #41, #41, #51, #51, #51, #51
    ; Char 90
    DB #41, #41, #41, #41, #51, #51, #51, #51
    ; Char 124
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ds #26000 - $, #FF
    end                 ; End of assembly
