; ============================================================
; lmmv_bench.asm - V9938 LMMV (logical fill) throughput benchmark
; for the SCREEN 5 bitmap-room LIGHTING system.
;
; Same harness as test/boss/boss_blit_bench.asm (identical 37 T poll
; loop = 10.336 us/iteration) so the numbers are directly comparable
; with the measured HMMM figure of ~5.7 us/byte.
;
; Every measurement repeats one command (or one whole halo pass) K
; times and accumulates:
;   +0 dword  total CE-busy poll iterations  (pure VDP command time)
;   +4 word   vblanks seen (sampled once per command = wall time,
;             only meaningful when each command is shorter than a frame)
;
; Conditions: SCREEN 5, display ON, page 0 visible and painted,
; 9 hardware sprites active (like a real bitmap room) except for the
; first entry, which runs with sprites disabled as a control.
;
; Results table at #C000, 8 bytes per entry (read by lmmv_bench_probe.tcl):
;   0  #C000  HMMM  256x64  sprites OFF   K=8    control vs the boss study
;   1  #C008  HMMM  256x64  sprites ON    K=8    cost of the sprite layer
;   2  #C010  HMMV  256x64  (no logic op) K=8    high-speed fill baseline
;   3  #C018  LMMV  #80 IMP 256x64        K=8    logical cmd, no operation
;   4  #C020  LMMV  #82 OR  256x64        K=8    <- the "dim" op
;   5  #C028  LMMV  #81 AND 256x64        K=8    <- the "light" op
;   6  #C030  LMMV  #82 OR  64x64         K=32   linearity check
;   7  #C038  LMMV  #82 OR  2x8           K=2048 real X strip, short band
;   8  #C040  LMMV  #82 OR  2x32          K=2048 real X strip, tall band
;   9  #C048  LMMV  #82 OR  40x2          K=2048 real Y step, end sliver
;   10 #C050  LMMV  #82 OR  10x2          K=2048 real Y step, boundary
;   11 #C058  full X pass d=2 (10 rects)  K=128  walking one frame
;   12 #C060  full Y pass d=2 (10 rects)  K=128  falling one frame
;   13 #C068  X+Y pass d=8   (20 rects)   K=64   worst case
;   14 #C070  LMMV  #82 OR  256x192       K=2    room-entry dark fill
;   15 #C078  LMMV  #82 OR  256x192       K=2    same, display blanked
;      #C0C0  word done marker #ABCD
; ============================================================

DISSCR  EQU #0041
CHGMOD  EQU #005F

res_base    EQU #C000
res_done    EQU #C0C0

; --- working RAM (cartridge: EQU only, never ORG) ---
acc_lo      EQU #C080   ; 32-bit poll-iteration accumulator
acc_hi      EQU #C082
vbl_cnt     EQU #C084
rep_cnt     EQU #C086
res_ptr     EQU #C088
pass_ptr    EQU #C08A
send_ptr    EQU #C08C
fill_byte   EQU #C08E

cmd_buf     EQU #C090   ; 15-byte block for R#32..R#46 (HMMM only)

; command parameters, contiguous: copied in one LDIR from ROM
p_dx        EQU #C0A0   ; word
p_dy        EQU #C0A2   ; word (high byte = page)
p_nx        EQU #C0A4   ; word
p_ny        EQU #C0A6   ; word
p_clr       EQU #C0A8   ; byte
p_cmd       EQU #C0A9   ; byte
P_LEN       EQU 10

b_dy        EQU #C0B0   ; band record being resolved
b_h         EQU #C0B1
b_hw        EQU #C0B2
x_sign      EQU #C0B3   ; 0 = cx - hw, 1 = cx + hw
light_x     EQU #C0B4
light_y     EQU #C0B5
light_d     EQU #C0B6

; Halo geometry, copied from msx2BitmapLightingGenerator.ts
CX          EQU 128
CY          EQU 116     ; GAME_Y(20) + 96, centre of the play band

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

    call paint_background
    call setup_sprites

    ld hl, res_base
    ld (res_ptr), hl

    ; ---------------- 0: HMMM 256x64, sprites OFF (control) ----------
    ld a, 8                 ; R#8 = #0A: bit1 = SPD -> sprite plane off
    ld e, #0A
    call vdp_write_reg_ea
    call build_hmmm_256x64
    ld bc, 8
    call measure_loop15

    ; ---------------- 1: HMMM 256x64, sprites ON ---------------------
    ld a, 8                 ; R#8 = #08: sprites back on
    ld e, #08
    call vdp_write_reg_ea
    call build_hmmm_256x64
    ld bc, 8
    call measure_loop15

    ; ---------------- 2..6: single fills -----------------------------
    ld hl, desc_hmmv_256x64
    ld bc, 8
    call run_fill

    ld hl, desc_imp_256x64
    ld bc, 8
    call run_fill

    ld hl, desc_or_256x64
    ld bc, 8
    call run_fill

    ld hl, desc_and_256x64
    ld bc, 8
    call run_fill

    ld hl, desc_or_64x64
    ld bc, 32
    call run_fill

    ; ---------------- 7..10: the real halo rectangles ----------------
    ld hl, desc_or_2x8
    ld bc, 2048
    call run_fill

    ld hl, desc_or_2x32
    ld bc, 2048
    call run_fill

    ld hl, desc_or_40x2
    ld bc, 2048
    call run_fill

    ld hl, desc_or_10x2
    ld bc, 2048
    call run_fill

    ; ---------------- 11..13: whole halo passes ----------------------
    ld a, CX
    ld (light_x), a
    ld a, CY
    ld (light_y), a

    ld a, 2
    ld (light_d), a
    ld de, run_x_pass
    ld bc, 128
    call measure_pass

    ld a, 2
    ld (light_d), a
    ld de, run_y_pass
    ld bc, 128
    call measure_pass

    ld a, 8
    ld (light_d), a
    ld de, run_xy_pass
    ld bc, 64
    call measure_pass

    ; ---------------- 14: room-entry dark fill -----------------------
    ld hl, desc_or_256x192
    ld bc, 2
    call run_fill

    ; ---------------- 15: same fill with the display blanked ---------
    call DISSCR
    di
    ld hl, desc_or_256x192
    ld bc, 2
    call run_fill
    ld a, 1
    ld e, #E2               ; R#1 = #E2: display on, IRQ on, 16x16 sprites
    call vdp_write_reg_ea

    ld hl, #ABCD
    ld (res_done), hl
forever:
    jp forever

; ------------------------------------------------------------
; run_fill: HL = 10-byte ROM descriptor, BC = repetitions.
; ------------------------------------------------------------
run_fill:
    push bc
    ld de, p_dx
    ld bc, P_LEN
    ldir
    pop bc
    jp measure_loop

; ------------------------------------------------------------
; measure_loop: fire the command in p_* BC times, accumulating.
; measure_loop15: same but sending the 15-byte cmd_buf (HMMM).
; ------------------------------------------------------------
measure_loop:
    ld hl, send_fill12
    ld (send_ptr), hl
    jp measure_common
measure_loop15:
    ld hl, send_cmd15
    ld (send_ptr), hl
measure_common:
    ld (rep_cnt), bc
    call acc_reset
    call wait_ce
.rep:
    call call_sender
    call poll_and_acc
    ld hl, (rep_cnt)
    dec hl
    ld (rep_cnt), hl
    ld a, h
    or l
    jp nz, .rep
    jp acc_store
call_sender:
    ld hl, (send_ptr)
    jp (hl)

; ------------------------------------------------------------
; measure_pass: DE = pass routine, BC = repetitions. The pass
; itself accumulates every rectangle it fires.
; ------------------------------------------------------------
measure_pass:
    ld (pass_ptr), de
    ld (rep_cnt), bc
    call acc_reset
    call wait_ce
.prep:
    call call_pass
    ld hl, (rep_cnt)
    dec hl
    ld (rep_cnt), hl
    ld a, h
    or l
    jp nz, .prep
    jp acc_store
call_pass:
    ld hl, (pass_ptr)
    jp (hl)

; ------------------------------------------------------------
; acc_reset / acc_store: 32-bit iteration total + vblank count.
; ------------------------------------------------------------
acc_reset:
    ld hl, 0
    ld (acc_lo), hl
    ld (acc_hi), hl
    ld (vbl_cnt), hl
    ret

acc_store:
    ld hl, (res_ptr)
    ex de, hl               ; DE = destination slot
    ld hl, (acc_lo)
    ld a, l
    ld (de), a
    inc de
    ld a, h
    ld (de), a
    inc de
    ld hl, (acc_hi)
    ld a, l
    ld (de), a
    inc de
    ld a, h
    ld (de), a
    inc de
    ld hl, (vbl_cnt)
    ld a, l
    ld (de), a
    inc de
    ld a, h
    ld (de), a
    inc de
    xor a
    ld (de), a
    inc de
    ld (de), a
    inc de
    ex de, hl               ; HL = next slot
    ld (res_ptr), hl
    ret

; ------------------------------------------------------------
; poll_and_acc: count CE-busy iterations with the SAME 37 T loop
; as boss_blit_bench, add them to the accumulator, then sample the
; vblank flag once (S#0 bit 7 is latched until read).
; ------------------------------------------------------------
poll_and_acc:
    ld a, 2
    call set_status_reg
    ld bc, 0
.poll:
    inc bc                  ; 7 T
    in a, (#99)             ; 12 T
    rra                     ; 5 T  CE -> carry
    jr c, .poll             ; 13 T taken => 37 T/iter = 10.336 us
    push bc
    ld hl, (acc_lo)
    add hl, bc
    ld (acc_lo), hl
    jr nc, .no_carry
    ld hl, (acc_hi)
    inc hl
    ld (acc_hi), hl
.no_carry:
    xor a
    call set_status_reg
    in a, (#99)             ; S#0: bit 7 = frame flag, reading clears it
    and #80
    jr z, .no_vbl
    ld hl, (vbl_cnt)
    inc hl
    ld (vbl_cnt), hl
.no_vbl:
    pop bc
    ret

; ------------------------------------------------------------
; send_fill12: exactly the 11 OUTs bitmap_light_rect emits
; (R#17 = 36 -> indirect writes from DX to CMD).
; ------------------------------------------------------------
send_fill12:
    ld a, #11
    ld e, #24
    call vdp_write_reg_ea
    ld a, (p_dx)
    out (#9B), a
    ld a, (p_dx + 1)
    out (#9B), a
    ld a, (p_dy)
    out (#9B), a
    ld a, (p_dy + 1)
    out (#9B), a
    ld a, (p_nx)
    out (#9B), a
    ld a, (p_nx + 1)
    out (#9B), a
    ld a, (p_ny)
    out (#9B), a
    ld a, (p_ny + 1)
    out (#9B), a
    ld a, (p_clr)
    out (#9B), a
    xor a
    out (#9B), a            ; ARG
    ld a, (p_cmd)
    out (#9B), a
    ret

; send_cmd15: full R#32..R#46 block from cmd_buf (needs SX/SY).
send_cmd15:
    ld a, 32
    out (#99), a
    ld a, 17 + #80
    out (#99), a
    ld hl, cmd_buf
    ld bc, #0F9B            ; B = 15 bytes, C = port #9B
    otir
    ret

; build_hmmm_256x64: page 1 (SY=256) -> page 0 (DY=0), 256x64.
build_hmmm_256x64:
    ld hl, 0
    ld (cmd_buf + 0), hl    ; SX = 0
    ld hl, 256
    ld (cmd_buf + 2), hl    ; SY = 256 (page 1)
    ld hl, 0
    ld (cmd_buf + 4), hl    ; DX = 0
    ld hl, 0
    ld (cmd_buf + 6), hl    ; DY = 0 (page 0)
    ld hl, 256
    ld (cmd_buf + 8), hl    ; NX
    ld hl, 64
    ld (cmd_buf + 10), hl   ; NY
    xor a
    ld (cmd_buf + 12), a    ; CLR
    ld (cmd_buf + 13), a    ; ARG
    ld a, #D0               ; HMMM
    ld (cmd_buf + 14), a
    ret

; ------------------------------------------------------------
; run_x_pass: the halo's horizontal delta, exactly like
; bitmap_light_shift_x moving right: one dimmed strip leaving on
; the left edge of every band, one lit strip entering on the right.
; ------------------------------------------------------------
run_x_pass:
    xor a
    ld (x_sign), a          ; left edge: cx - hw
    ld a, #08
    ld (p_clr), a
    ld a, #82               ; LMMV + OR = dim
    ld (p_cmd), a
    call x_strip_pass
    ld a, 1
    ld (x_sign), a          ; right edge: cx + hw
    ld a, #07
    ld (p_clr), a
    ld a, #81               ; LMMV + AND = light
    ld (p_cmd), a
    jp x_strip_pass

x_strip_pass:
    ld hl, band_table
    ld b, 5
.strip:
    push bc
    call load_band          ; HL += 3
    push hl
    call rect_from_band
    call send_fill12
    call poll_and_acc
    pop hl
    pop bc
    djnz .strip
    ret

load_band:
    ld a, (hl)
    ld (b_dy), a
    inc hl
    ld a, (hl)
    ld (b_h), a
    inc hl
    ld a, (hl)
    ld (b_hw), a
    inc hl
    ret

rect_from_band:
    ld a, (b_hw)
    ld c, a
    ld a, (x_sign)
    or a
    ld a, (light_x)
    jr z, .minus
    add a, c
    jr .store_x
.minus:
    sub c
.store_x:
    ld (p_dx), a
    xor a
    ld (p_dx + 1), a
    ld a, (light_y)
    ld c, a
    ld a, (b_dy)            ; signed offset
    add a, c
    ld (p_dy), a
    xor a
    ld (p_dy + 1), a
    ld a, (light_d)
    ld (p_nx), a
    xor a
    ld (p_nx + 1), a
    ld a, (b_h)
    ld (p_ny), a
    xor a
    ld (p_ny + 1), a
    ret

; ------------------------------------------------------------
; run_y_pass: the vertical delta table (10 rectangles, each d rows
; tall), exactly like bitmap_light_step_pass going down.
; ------------------------------------------------------------
run_y_pass:
    ld hl, ystep_table
    ld b, 10
.step:
    push bc
    ld a, (light_y)
    add a, (hl)             ; signed row offset
    ld (p_dy), a
    xor a
    ld (p_dy + 1), a
    inc hl
    ld a, (light_x)
    add a, (hl)             ; signed column offset
    ld (p_dx), a
    xor a
    ld (p_dx + 1), a
    inc hl
    ld a, (hl)
    ld (p_nx), a
    xor a
    ld (p_nx + 1), a
    inc hl
    ld a, (light_d)
    ld (p_ny), a
    xor a
    ld (p_ny + 1), a
    ld a, (hl)              ; 1 = light, 0 = dim
    inc hl
    push hl
    or a
    jr z, .dim
    ld a, #07
    ld (p_clr), a
    ld a, #81
    ld (p_cmd), a
    jr .fire
.dim:
    ld a, #08
    ld (p_clr), a
    ld a, #82
    ld (p_cmd), a
.fire:
    call send_fill12
    call poll_and_acc
    pop hl
    pop bc
    djnz .step
    ret

run_xy_pass:
    call run_x_pass
    jp run_y_pass

; ------------------------------------------------------------
; Background: colour 4 with colour 2 stripes on page 0 (visible)
; and page 1 (HMMM source). Every colour is 0-7, like the art of a
; dark room must be.
; ------------------------------------------------------------
paint_background:
    ld hl, 0
    call paint_page
    ld hl, 256
    jp paint_page

paint_page:
    ld (p_dy), hl
    ld hl, 0
    ld (p_dx), hl
    ld hl, 256
    ld (p_nx), hl
    ld hl, 212
    ld (p_ny), hl
    ld a, #44
    ld (p_clr), a
    ld a, #C0               ; HMMV
    ld (p_cmd), a
    call wait_ce
    call send_fill12
    ; stripes
    ld a, (p_dy)
    ld c, a
    ld a, (p_dy + 1)
    ld b, a                 ; BC = page base DY
    ld d, 0                 ; stripe X
.stripe:
    push bc
    push de
    ld a, d
    ld (p_dx), a
    xor a
    ld (p_dx + 1), a
    ld a, c
    ld (p_dy), a
    ld a, b
    ld (p_dy + 1), a
    ld hl, 4
    ld (p_nx), hl
    ld hl, 212
    ld (p_ny), hl
    ld a, #22
    ld (p_clr), a
    ld a, #C0
    ld (p_cmd), a
    call wait_ce
    call send_fill12
    pop de
    pop bc
    ld a, d
    add a, 32
    ld d, a
    jp nc, .stripe
    jp wait_ce

; ------------------------------------------------------------
; setup_sprites: 9 solid 16x16 sprites, laid out like a bitmap room
; (4 overlapping player layers + enemies), so the sprite plane steals
; the same VDP bandwidth it steals in game.
; ------------------------------------------------------------
setup_sprites:
    ld hl, #7800            ; sprite patterns
    ld bc, 32
    ld a, #FF
    call vram_fill
    ld hl, #7400            ; sprite colours (mode 2: one byte per line)
    ld bc, 144
    ld a, #0F
    call vram_fill
    ld hl, #7600            ; sprite attributes
    ld de, sat_data
    ld bc, 40
    jp vram_copy

vram_fill:
    ld (fill_byte), a
    call set_vram_write
.vf:
    ld a, (fill_byte)
    out (#98), a
    dec bc
    ld a, b
    or c
    jp nz, .vf
    ret

vram_copy:
    call set_vram_write
.vc:
    ld a, (de)
    out (#98), a
    inc de
    dec bc
    ld a, b
    or c
    jp nz, .vc
    ret

set_vram_write:
    push af
    ld a, h
    rlca
    rlca
    and #03
    out (#99), a
    ld a, 14 + #80
    out (#99), a            ; R#14 = A16-A14
    ld a, l
    out (#99), a
    ld a, h
    and #3F
    or #40
    out (#99), a            ; write mode
    pop af
    ret

; ------------------------------------------------------------
; VDP helpers
; ------------------------------------------------------------
; vdp_write_reg_ea: A = register number, E = value.
vdp_write_reg_ea:
    push af
    ld a, e
    out (#99), a
    pop af
    or #80
    out (#99), a
    ret

set_status_reg:
    out (#99), a
    ld a, 15 + #80
    out (#99), a
    ret

wait_ce:
    ld a, 2
    call set_status_reg
.busy:
    in a, (#99)
    rra
    jr c, .busy
    xor a
    jp set_status_reg

; ------------------------------------------------------------
; DATA
; ------------------------------------------------------------
; Command descriptors: dw DX, dw DY, dw NX, dw NY, db CLR, db CMD
desc_hmmv_256x64:
    dw 0, 0, 256, 64
    db #44, #C0
desc_imp_256x64:
    dw 0, 0, 256, 64
    db #08, #80
desc_or_256x64:
    dw 0, 0, 256, 64
    db #08, #82
desc_and_256x64:
    dw 0, 0, 256, 64
    db #07, #81
desc_or_64x64:
    dw 64, 64, 64, 64
    db #08, #82
desc_or_2x8:
    dw 108, 84, 2, 8
    db #08, #82
desc_or_2x32:
    dw 88, 100, 2, 32
    db #08, #82
desc_or_40x2:
    dw 108, 84, 40, 2
    db #08, #82
desc_or_10x2:
    dw 98, 92, 10, 2
    db #08, #82
desc_or_256x192:
    dw 0, 20, 256, 192
    db #08, #82

; Halo bands: signed row offset, height, half width (stage 0 = lamp)
band_table:
    db #E0, 8, 20           ; -32
    db #E8, 8, 30           ; -24
    db #F0, 32, 40          ; -16
    db 16, 8, 30
    db 24, 8, 20

; Vertical step table, going down: row offset, column offset, width,
; 1 = light / 0 = dim. Generated by buildStepTable() for stage 0.
ystep_table:
    db #E0, #EC, 40, 0      ; -32, -20  trailing full-width sliver
    db #E8, #E2, 10, 0      ; -24, -30
    db #E8, 20, 10, 0
    db #F0, #D8, 10, 0      ; -16, -40
    db #F0, 30, 10, 0
    db 16, #D8, 10, 1
    db 16, 30, 10, 1
    db 24, #E2, 10, 1
    db 24, 20, 10, 1
    db 32, #EC, 40, 1       ; leading full-width sliver

; Sprite attribute table: 9 sprites + Y=216 terminator.
sat_data:
    db 110, 100, 0, 0       ; player, four overlapping layers
    db 110, 100, 0, 0
    db 110, 100, 0, 0
    db 110, 100, 0, 0
    db 60, 40, 0, 0
    db 60, 200, 0, 0
    db 150, 60, 0, 0
    db 150, 180, 0, 0
    db 90, 130, 0, 0
    db 216, 0, 0, 0

    ds #8000 - $, #FF       ; pad to 16KB
