;; constants.asm
; This file contains shared constants and addresses for the project.

; --- BIOS Calls ---
CHGMOD  EQU     #005F   ; Change screen mode
CHGCLR  EQU     #0062   ; Change screen colors
WRTVDP  EQU     #0047   ; Write to VDP register
LDIRVM  EQU     #005C   ; Block transfer from CPU to VRAM

; --- System Variables ---
BAKCLR  EQU     #F3E9   ; Background color
BDRCLR  EQU     #F3EA   ; Border color
CLIKSW  EQU     #F3DB   ; Key click switch (0=off)
HKEY    EQU     #FD9A   ; Interrupt hook for key press
TIMI    EQU     #FD9F   ; Interrupt hook for VBLANK

; --- Custom Variables (to be defined in your RAM area) ---
deterministic EQU #C000 ; Example RAM address
isComputer50HzOr60Hz EQU #C001 ; Example RAM address

; --- VRAM Addresses for SCREEN 2 ---
CLRTBL2     EQU     #2000   ; Color Attribute Table base
CHRTBL2     EQU     #0000   ; Pattern Generator Table base
PATTBL2     EQU     #1800   ; Name Table (Pattern list) base

SPRTBL EQU #3800
SPRATR EQU #1B00
