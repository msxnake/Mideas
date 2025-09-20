; ==================================================================
; MSX FONT DATA FOR SCREEN 2 TEXT
; File: font.asm
; Description: Font pattern data based on Mideas Font Editor
; Character patterns optimized for Screen 2 mode text rendering
; ==================================================================

; ==================================================================
; FONT PATTERN DATA (Based on DEFAULT_MSX_FONT from FontEditor)
; ==================================================================

; Character patterns (8 bytes per character, 8x8 pixels)
; Format: Each byte represents one row of 8 pixels (bit 7 = leftmost pixel)

FONT_PATTERN_DATA:
    ; Character 32: Space
    DB #00, #00, #00, #00, #00, #00, #00, #00

    ; Character 48: '0'
    DB #3E, #7F, #73, #73, #73, #7F, #3E, #00

    ; Character 49: '1'
    DB #18, #38, #18, #18, #18, #18, #7E, #00

    ; Character 50: '2'
    DB #3E, #7F, #03, #3E, #60, #7F, #3E, #00

    ; Character 58: ':'
    DB #00, #36, #36, #00, #36, #36, #00, #00

    ; Character 65: 'A'
    DB #3E, #7F, #63, #7F, #7F, #63, #63, #00

    ; Character 66: 'B'
    DB #7E, #7F, #63, #7E, #63, #7F, #7E, #00

    ; Character 67: 'C'
    DB #3C, #7E, #60, #60, #60, #7E, #3C, #00

    ; Character 68: 'D'
    DB #7C, #7E, #66, #66, #66, #7E, #7C, #00

    ; Character 69: 'E'
    DB #7F, #7F, #60, #7C, #60, #7F, #7F, #00

    ; Character 70: 'F'
    DB #7F, #7F, #60, #7C, #60, #60, #60, #00

    ; Character 71: 'G'
    DB #3C, #7E, #60, #67, #63, #7F, #3E, #00

    ; Character 72: 'H'
    DB #63, #63, #63, #7F, #63, #63, #63, #00

    ; Character 73: 'I'
    DB #7E, #18, #18, #18, #18, #18, #7E, #00

    ; Character 76: 'L'
    DB #60, #60, #60, #60, #60, #7F, #7F, #00

    ; Character 77: 'M'
    DB #63, #77, #7F, #6B, #63, #63, #63, #00

    ; Character 78: 'N'
    DB #63, #73, #7B, #6F, #67, #63, #63, #00

    ; Character 79: 'O'
    DB #3E, #7F, #63, #63, #63, #7F, #3E, #00

    ; Character 80: 'P'
    DB #7E, #7F, #63, #7F, #7E, #60, #60, #00

    ; Character 82: 'R'
    DB #7E, #7F, #63, #7E, #7B, #6F, #63, #00

    ; Character 83: 'S'
    DB #3E, #7F, #60, #3E, #0F, #7F, #3E, #00

    ; Character 84: 'T'
    DB #7F, #7F, #18, #18, #18, #18, #18, #00

    ; Character 85: 'U'
    DB #63, #63, #63, #63, #63, #7F, #3E, #00

    ; Character 63: '?'
    DB #3E, #7F, #63, #18, #18, #00, #18, #00

; Character index table (for quick lookup)
FONT_CHAR_INDEX:
    DB 32, 48, 49, 50, 58, 65, 66, 67, 68, 69, 70, 71, 72, 73, 76, 77, 78, 79, 80, 82, 83, 84, 85, 63
FONT_CHAR_COUNT EQU 24

; ==================================================================
; FONT LOADING FUNCTIONS (Based on Mideas generateFontPatternBinaryData)
; ==================================================================

LOAD_CUSTOM_FONT:
    ; Load custom font patterns to VRAM Pattern Generator Table
    ; This replaces the MSX BIOS font with our custom font for text display
    ; BIOS LDIRVM handles timing automatically

    ; Calculate target address in Pattern Generator Table
    ; Characters 32-127 (printable ASCII) start at pattern #20 (32 decimal)
    LD HL, FONT_PATTERN_DATA
    LD DE, CHRTBL2 + (32 * 8)     ; Start at character 32 (space)
    LD BC, FONT_CHAR_COUNT * 8    ; Load all custom characters
    CALL LDIRVM                   ; BIOS handles safe VRAM access
    RET

LOAD_FONT_BANK0:
    ; Load font to Pattern Generator Bank 0 (characters 0-255)
    LD HL, FONT_PATTERN_DATA
    LD DE, CHRTBL2 + (32 * 8)     ; Start at character 32
    LD BC, FONT_CHAR_COUNT * 8
    CALL LDIRVM                   ; BIOS handles safe VRAM access
    RET

LOAD_FONT_BANK1:
    ; Load font to Pattern Generator Bank 1 (same patterns)
    LD HL, FONT_PATTERN_DATA
    LD DE, CHRTBL2 + #800 + (32 * 8)  ; Bank 1 + character 32
    LD BC, FONT_CHAR_COUNT * 8
    CALL LDIRVM                   ; BIOS handles safe VRAM access
    RET

LOAD_FONT_BANK2:
    ; Load font to Pattern Generator Bank 2 (same patterns)
    LD HL, FONT_PATTERN_DATA
    LD DE, CHRTBL2 + #1000 + (32 * 8) ; Bank 2 + character 32
    LD BC, FONT_CHAR_COUNT * 8
    CALL LDIRVM                   ; BIOS handles safe VRAM access
    RET

LOAD_ALL_FONT_BANKS:
    ; Load custom font to all three Pattern Generator banks
    ; Required for complete Screen 2 text coverage
    CALL LOAD_FONT_BANK0
    CALL LOAD_FONT_BANK1
    CALL LOAD_FONT_BANK2
    RET

; ==================================================================
; FONT COLOR ATTRIBUTES (Based on MSXFontColorAttributes)
; ==================================================================

; Default color attributes for font characters (Screen 2 mode)
; Format: (FG color << 4) | BG color per 8-pixel row
FONT_COLOR_DATA:
    ; Character 32: Space (transparent)
    DB #00, #00, #00, #00, #00, #00, #00, #00

    ; Character 48-85: Standard text (white on black)
    ; Repeat for each character pattern
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; '0'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; '1'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; '2'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; ':'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'A'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'B'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'C'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'D'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'E'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'F'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'G'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'H'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'I'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'L'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'M'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'N'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'O'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'P'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'R'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'S'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'T'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; 'U'
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0   ; '?'

LOAD_FONT_COLORS:
    ; Load font color attributes to Color Attribute Table
    ; Based on generateFontColorBinaryData from FontEditor
    LD HL, FONT_COLOR_DATA
    LD DE, CLRTBL2 + (32 * 8)     ; Start at character 32
    LD BC, FONT_CHAR_COUNT * 8
    CALL LDIRVM                   ; BIOS handles safe VRAM access
    RET

LOAD_FONT_COLORS_ALL_BANKS:
    ; Load font colors to all three Color Attribute banks
    ; Bank 0
    LD HL, FONT_COLOR_DATA
    LD DE, CLRTBL2 + (32 * 8)
    LD BC, FONT_CHAR_COUNT * 8
    CALL LDIRVM

    ; Bank 1
    LD HL, FONT_COLOR_DATA
    LD DE, CLRTBL2 + #800 + (32 * 8)
    LD BC, FONT_CHAR_COUNT * 8
    CALL LDIRVM

    ; Bank 2
    LD HL, FONT_COLOR_DATA
    LD DE, CLRTBL2 + #1000 + (32 * 8)
    LD BC, FONT_CHAR_COUNT * 8
    CALL LDIRVM
    RET

; ==================================================================
; TEXT RENDERING FUNCTIONS (Based on Mideas renderMSX1TextToDataURL)
; ==================================================================

; Print string to Screen 2 name table (text mode compatible)
; HL = string pointer (null-terminated), DE = VRAM position
PRINT_STRING_SCREEN2:
    PUSH BC
    LD B, 0                        ; Character counter

print_string_loop:
    LD A, (HL)                     ; Get character
    OR A                           ; Check for null terminator
    JR Z, print_string_end         ; End if null

    ; Write character to VRAM Name Table
    PUSH HL                        ; Save string pointer
    PUSH DE                        ; Save VRAM position
    LD HL, DE                      ; HL = VRAM address for WRTVRM
    CALL WRTVRM                    ; Write character to VRAM
    POP DE                         ; Restore VRAM position
    POP HL                         ; Restore string pointer

    ; Move to next character
    INC HL                         ; Next character in string
    INC DE                         ; Next position in VRAM
    INC B                          ; Count characters
    LD A, B
    CP 32                          ; Limit to screen width
    JR NZ, print_string_loop       ; Continue if not at edge

print_string_end:
    POP BC
    RET

; Initialize font system for Screen 2 text rendering
INIT_FONT_SYSTEM:
    ; Load custom font patterns and colors
    CALL LOAD_ALL_FONT_BANKS       ; Load patterns to all banks
    CALL LOAD_FONT_COLORS_ALL_BANKS ; Load colors to all banks
    RET

; ==================================================================
; END OF FONT DATA
; ==================================================================
