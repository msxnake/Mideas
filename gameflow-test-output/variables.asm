; ==================================================================
; RAM VARIABLES DEFINITIONS
; File: variables.asm
; Description: Dynamic variable allocation using EQU addresses
; Generated based on project analysis
; ==================================================================

; ==================================================================
; CORE SYSTEM VARIABLES (ALWAYS PRESENT)
; ==================================================================
input_state         EQU #C000   ; Current joystick/keyboard state
prev_input_state    EQU #C001   ; Previous input state
current_flow_state  EQU #C002   ; Current game flow state
prev_flow_state     EQU #C003   ; Previous game flow state
frame_counter       EQU #C004   ; Frame counter (16-bit)

; ==================================================================
; SPRITE SYSTEM VARIABLES (1 sprites detected)
; ==================================================================
active_sprite_count EQU #C006   ; Number of sprites currently active
sprite_x_pos        EQU #C007   ; Sprite X positions (32 bytes)
sprite_y_pos        EQU #C027   ; Sprite Y positions (32 bytes)
sprite_pattern      EQU #C047   ; Sprite pattern IDs (32 bytes)
sprite_color        EQU #C067   ; Sprite colors (32 bytes)

; ==================================================================
; SCREEN SYSTEM VARIABLES (1 screens detected)
; ==================================================================
current_screen_id   EQU #C087   ; Currently displayed screen ID
screen_dirty_flag   EQU #C088   ; Screen needs redraw flag

; ==================================================================
; TEMPORARY VARIABLES (ALWAYS NEEDED)
; ==================================================================
temp_word_1         EQU #C089   ; Temporary 16-bit storage
temp_word_2         EQU #C08B   ; Temporary 16-bit storage
temp_byte_1         EQU #C08D   ; Temporary 8-bit storage
temp_byte_2         EQU #C08E   ; Temporary 8-bit storage

; ==================================================================
; END OF VARIABLES
; ==================================================================
RAM_USAGE_END       EQU #C08F   ; End of project variables (143 bytes used)

; ==================================================================
; MEMORY SAFETY CHECK
; ==================================================================
; RAM Layout:
;   #C000-#C08F: Project variables (143 bytes)
;   #C08F-#F37F: Free RAM (~13041 bytes available)
;   #F380-#FFFF: MSX System variables (DO NOT TOUCH)
; ==================================================================
