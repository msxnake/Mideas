; ============================================================
; boss_blit_bench.asm - V9938 HMMM throughput benchmark for the
; MSX2 SCREEN 5 bitmap-room BOSS feasibility study.
;
; Measures:
;   A) Static: iterations of a calibrated Z80 poll loop (~37 T/iter)
;      while one HMMM (atlas page 2 -> visible page 0) is running,
;      for boss sizes 32x32, 48x48, 64x64, 96x96, 128x96.
;      Display ON + sprites logic ON = real in-game conditions.
;   B) Dynamic: 300 frames of a moving boss (2 px/frame ping-pong)
;      with page-1 background strip restore + full HMMM redraw,
;      counting frames where the previous command was still busy
;      at VBLANK (overruns), for 64x64 and 96x96.
;
; RAM results (read by boss_blit_probe.tcl):
;   #C000 w  iter count 32x32      #C008 w  iter count 128x96
;   #C002 w  iter count 48x48      #C00A w  overruns 64x64 dynamic
;   #C004 w  iter count 64x64      #C00C w  overruns 96x96 dynamic
;   #C006 w  iter count 96x96      #C00E w  done marker #ABCD
; ============================================================

DISSCR  EQU #0041
CHGMOD  EQU #005F

res_base    EQU #C000
var_x       EQU #C020   ; boss X (dynamic test)
var_dir     EQU #C021   ; +2 / -2 (signed)
var_frames  EQU #C022   ; word frame counter
var_over    EQU #C024   ; word overrun counter
dyn_w       EQU #C026   ; word boss width (RAM: ROM labels ignore writes)
dyn_h       EQU #C028   ; word boss height
cmd_buf     EQU #C030   ; 15-byte command block built in RAM

    org #4000
    db "AB"
    dw init
    ds 12, 0

init:
    di
    ld sp, #F380
    call DISSCR
    ld a, #05
    call CHGMOD
    di                      ; CHGMOD may return with IRQs enabled

    ; --- paint background on page 0 (visible) and page 1 (restore source) ---
    ld hl, 0                ; page 0: DY=0
    call paint_background
    ld hl, 256              ; page 1: DY=256
    call paint_background

    ; --- paint "boss" block on page 2 (DY=512): 128x96 colour 8 + frame 15 ---
    ld de, 512
    ld bc, 128
    ld hl, 96
    ld a, #88
    call fill_rect          ; body
    ld de, 512
    ld bc, 128
    ld hl, 4
    ld a, #FF
    call fill_rect          ; top edge marker (white)

    ; ============================================================
    ; A) STATIC MEASUREMENTS
    ; ============================================================
    ld ix, res_base
    ld bc, 32
    ld hl, 32
    call measure_hmmm
    ld bc, 48
    ld hl, 48
    call measure_hmmm
    ld bc, 64
    ld hl, 64
    call measure_hmmm
    ld bc, 96
    ld hl, 96
    call measure_hmmm
    ld bc, 128
    ld hl, 96
    call measure_hmmm

    ; ============================================================
    ; B) DYNAMIC TESTS
    ; ============================================================
    ld bc, 64               ; 64x64
    ld hl, 64
    call dynamic_test
    ld hl, (var_over)
    ld (res_base + 10), hl

    ld bc, 96               ; 96x96
    ld hl, 96
    call dynamic_test
    ld hl, (var_over)
    ld (res_base + 12), hl

    ld hl, #ABCD            ; done marker
    ld (res_base + 14), hl
forever:
    jp forever

; ------------------------------------------------------------
; measure_hmmm: BC=width px, HL=height. Launch HMMM page2->page0
; at (64,60) and count poll iterations until CE clears.
; Stores word count at (IX), IX += 2.
; ------------------------------------------------------------
measure_hmmm:
    push bc
    push hl
    call wait_vblank
    pop hl
    pop bc
    call build_hmmm         ; SX=0 SY=512 -> DX=64 DY=60, NX=BC NY=HL
    call send_cmd
    ; select S#2 and count until CE=0
    ld a, 2
    call set_status_reg
    ld bc, 0
.poll:
    inc bc                  ; 7 T
    in a, (#99)             ; 12 T
    rra                     ; 5 T   CE -> carry
    jr c, .poll             ; 13 T taken  => ~37 T/iter = 10.34 us @3.58MHz
    xor a
    call set_status_reg
    ld (ix + 0), c
    ld (ix + 1), b
    inc ix
    inc ix
    ret

; ------------------------------------------------------------
; dynamic_test: BC=width, HL=height. 300 frames ping-pong X with
; strip restore (page1->page0) + full redraw (page2->page0).
; Counts VBLANK overruns into var_over.
; ------------------------------------------------------------
dynamic_test:
    ld (dyn_w), bc
    ld (dyn_h), hl
    ld a, 16
    ld (var_x), a
    ld a, 2
    ld (var_dir), a
    ld hl, 0
    ld (var_frames), hl
    ld (var_over), hl
.frame:
    call wait_vblank
    ; overrun check: is the previous frame's command still running?
    ld a, 2
    call set_status_reg
    in a, (#99)
    rra
    jr nc, .no_overrun
    ld hl, (var_over)
    inc hl
    ld (var_over), hl
.wait_prev:
    in a, (#99)             ; wait until free before issuing more
    rra
    jr c, .wait_prev
.no_overrun:
    xor a
    call set_status_reg

    ; restore two 4px strips at old boss edges: page1 -> page0
    ld a, (var_x)
    ld d, a                 ; left strip X
    call restore_strip
    ld a, (var_x)
    ld hl, dyn_w
    add a, (hl)
    sub 4
    ld d, a                 ; right strip X
    call restore_strip

    ; advance X
    ld a, (var_x)
    ld b, a
    ld a, (var_dir)
    add a, b
    ld (var_x), a
    ; bounce at 8 / 248-w
    cp 8
    jr nc, .chk_hi
    ld a, 2
    ld (var_dir), a
    jr .draw
.chk_hi:
    ld b, a
    ld a, 248
    ld hl, dyn_w
    sub (hl)
    cp b
    jr nc, .draw
    ld a, -2
    ld (var_dir), a
.draw:
    ; full boss redraw: page2 atlas -> page0 at (var_x, 60)
    ld bc, (dyn_w)
    ld hl, (dyn_h)
    ld a, (var_x)
    call build_hmmm_at
    call send_cmd

    ld hl, (var_frames)
    inc hl
    ld (var_frames), hl
    ld a, h
    cp 1                    ; 256 frames? continue to 300
    jr c, .frame
    ld a, l
    cp 44                   ; 300 = #012C
    jr c, .frame
    ret

; ------------------------------------------------------------
; restore_strip: D = destination X. Copies a 4 x dyn_h strip
; from page 1 background to page 0 at (D, 60).
; ------------------------------------------------------------
restore_strip:
    ld a, d
    and #FE                 ; even X for byte-aligned HMMM
    ld (cmd_buf + 0), a     ; SX low
    xor a
    ld (cmd_buf + 1), a
    ld hl, 60 + 256         ; SY on page 1
    ld (cmd_buf + 2), hl
    ld a, (cmd_buf + 0)
    ld (cmd_buf + 4), a     ; DX low = same X
    xor a
    ld (cmd_buf + 5), a
    ld hl, 60               ; DY on page 0
    ld (cmd_buf + 6), hl
    ld hl, 4
    ld (cmd_buf + 8), hl    ; NX = 4 px
    ld hl, (dyn_h)
    ld (cmd_buf + 10), hl   ; NY
    xor a
    ld (cmd_buf + 12), a    ; CLR unused
    ld (cmd_buf + 13), a    ; ARG = 0
    ld a, #D0
    ld (cmd_buf + 14), a    ; HMMM
    call wait_ce
    jp send_cmd

; ------------------------------------------------------------
; build_hmmm: BC=NX, HL=NY, fixed DX=64. Source page2 (0,512).
; build_hmmm_at: same but A = DX low.
; ------------------------------------------------------------
build_hmmm:
    ld a, 64
build_hmmm_at:
    and #FE
    push af
    xor a
    ld (cmd_buf + 0), a     ; SX = 0
    ld (cmd_buf + 1), a
    push hl
    ld hl, 512
    ld (cmd_buf + 2), hl    ; SY = 512 (page 2)
    pop hl
    pop af
    ld (cmd_buf + 4), a     ; DX low
    xor a
    ld (cmd_buf + 5), a
    push hl
    ld hl, 60
    ld (cmd_buf + 6), hl    ; DY = 60 (page 0)
    pop hl
    ld (cmd_buf + 8), bc    ; NX
    ld (cmd_buf + 10), hl   ; NY
    xor a
    ld (cmd_buf + 12), a
    ld (cmd_buf + 13), a    ; ARG = 0
    ld a, #D0
    ld (cmd_buf + 14), a    ; HMMM
    ret

; ------------------------------------------------------------
; fill_rect: DE=DY, BC=NX, HL=NY, A=colour byte. HMMV at DX=0.
; ------------------------------------------------------------
fill_rect:
    push af
    xor a
    ld (cmd_buf + 0), a     ; SX unused
    ld (cmd_buf + 1), a
    ld (cmd_buf + 2), a
    ld (cmd_buf + 3), a
    ld (cmd_buf + 4), a     ; DX = 0
    ld (cmd_buf + 5), a
    ld (cmd_buf + 6), de    ; DY
    ld (cmd_buf + 8), bc    ; NX
    ld (cmd_buf + 10), hl   ; NY
    pop af
    ld (cmd_buf + 12), a    ; CLR
    xor a
    ld (cmd_buf + 13), a    ; ARG
    ld a, #C0
    ld (cmd_buf + 14), a    ; HMMV
    call wait_ce
    jp send_cmd

; ------------------------------------------------------------
; paint_background: HL = base DY (0 = page 0, 256 = page 1).
; Fills 256x212 colour 4 + vertical colour-9 stripes every 32 px.
; ------------------------------------------------------------
paint_background:
    push hl
    ex de, hl               ; DE = DY
    ld bc, 256
    ld hl, 212
    ld a, #44
    call fill_rect
    pop de                  ; DE = base DY again (from push hl)
    ld a, 0                 ; stripe X
.stripe:
    push af
    push de
    ld (cmd_buf + 4), a     ; DX low
    xor a
    ld (cmd_buf + 5), a
    ld (cmd_buf + 6), de    ; DY
    ld hl, 4
    ld (cmd_buf + 8), hl    ; NX = 4
    ld hl, 212
    ld (cmd_buf + 10), hl   ; NY
    ld a, #99
    ld (cmd_buf + 12), a    ; colour 9
    xor a
    ld (cmd_buf + 13), a
    ld a, #C0
    ld (cmd_buf + 14), a
    call wait_ce
    call send_cmd
    pop de
    pop af
    add a, 32
    jr nc, .stripe
    ret

; ------------------------------------------------------------
; send_cmd: wait for a free command unit, then write cmd_buf
; (R#32..R#46) through R#17 + port #9B.
; ------------------------------------------------------------
send_cmd:
    call wait_ce
    ld a, 32
    out (#99), a
    ld a, 17 + #80
    out (#99), a            ; R#17 = 32 (autoincrement)
    ld hl, cmd_buf
    ld bc, #0F9B            ; B=15 bytes, C=port #9B
    otir
    ret

; wait_ce: block until the previous command finishes.
wait_ce:
    push af
    ld a, 2
    call set_status_reg
.busy:
    in a, (#99)
    rra
    jr c, .busy
    xor a
    call set_status_reg
    pop af
    ret

; set_status_reg: A = status register number for R#15.
set_status_reg:
    out (#99), a
    ld a, 15 + #80
    out (#99), a
    ret

; wait_vblank: poll S#0 bit 7 (register 15 already 0 outside polls).
wait_vblank:
    in a, (#99)             ; clear a pending flag first
.wv:
    in a, (#99)
    and #80
    jr z, .wv
    ret

    ds #8000 - $, #FF       ; pad to 16KB
