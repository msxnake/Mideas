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
sprite_x_pos        EQU #C007   ; Sprite X positions (1 bytes)
sprite_y_pos        EQU #C008   ; Sprite Y positions (1 bytes)
sprite_pattern      EQU #C009   ; Sprite pattern IDs (1 bytes)
sprite_color        EQU #C00A   ; Sprite colors (1 bytes)

; ==================================================================
; SCREEN SYSTEM VARIABLES (1 screens detected)
; ==================================================================
current_screen_id   EQU #C00B   ; Currently displayed screen ID
screen_dirty_flag   EQU #C00C   ; Screen needs redraw flag

; ==================================================================
; PLAYER SYSTEM VARIABLES (player entity detected)
; ==================================================================
player_x            EQU #C00D   ; Player X position (16-bit)
player_y            EQU #C00F   ; Player Y position (16-bit)
player_health       EQU #C011   ; Player health points
player_score        EQU #C012   ; Player score (16-bit)

; ==================================================================
; TEMPORARY VARIABLES (ALWAYS NEEDED)
; ==================================================================
temp_word_1         EQU #C014   ; Temporary 16-bit storage
temp_word_2         EQU #C016   ; Temporary 16-bit storage
temp_byte_1         EQU #C018   ; Temporary 8-bit storage
temp_byte_2         EQU #C019   ; Temporary 8-bit storage

; ==================================================================
; END OF VARIABLES
; ==================================================================
RAM_USAGE_END       EQU #C01A   ; End of project variables (26 bytes used)

; ==================================================================
; MEMORY SAFETY CHECK
; ==================================================================
; RAM Layout:
;   #C000-#C01A: Project variables (26 bytes)
;   #C01A-#F37F: Free RAM (~13158 bytes available)
;   #F380-#FFFF: MSX System variables (DO NOT TOUCH)
; ==================================================================
