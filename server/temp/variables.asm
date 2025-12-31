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
input_fire          EQU #C002   ; Fire button state (0=released, 1=pressed)
current_flow_state  EQU #C003   ; Current game flow state
prev_flow_state     EQU #C004   ; Previous game flow state

; ==================================================================
; MIDEAS GLOBAL VARIABLES (DEFAULTS + CUSTOM)
; ==================================================================
global_var_goal     EQU #C005   ; Goal status (0=Failure, 1=Completed)

; ==================================================================
; SYSTEM VARIABLES
; ==================================================================
ROM_slot            EQU #C006   ; ROM slot number (for SETPAGES32K)
frame_counter       EQU #C007   ; Frame counter (16-bit)

; ==================================================================
; VIEWPORT/CAMERA VARIABLES (for scroll system)
; ==================================================================
camera_x            EQU #C009   ; Camera X position in pixels (16-bit)
camera_y            EQU #C00B   ; Camera Y position in pixels (16-bit)
camera_tile_x       EQU #C00D   ; Camera tile X (column)
camera_tile_y       EQU #C00E   ; Camera tile Y (row)
world_width_tiles   EQU #C00F   ; World width in tiles
world_height_tiles  EQU #C010   ; World height in tiles
scroll_dirty_flag   EQU #C011   ; 1=viewport changed, needs redraw

; ==================================================================
; ANIMATED TILES VARIABLES
; ==================================================================
anim_tile_timer     EQU #C012   ; Animation frame timer
anim_tile_frame     EQU #C013   ; Current animation frame (0-3)
anim_tile_speed     EQU #C014   ; Frames between animation updates

; ==================================================================
; ENTITY SYSTEM VARIABLES (Fixed 32 entities)
; ==================================================================
MAX_ENTITIES        EQU 32
entity_x_pos        EQU #C015   ; Entity X positions (32 bytes)
entity_y_pos        EQU #C035   ; Entity Y positions (32 bytes)
entity_vel_x        EQU #C055   ; Entity X velocity (32 bytes)
entity_vel_y        EQU #C075   ; Entity Y velocity (32 bytes)
entity_comp_masks   EQU #C095   ; Entity component masks (32 bytes)
entity_comp_masks_hi EQU #C0B5   ; Entity component masks high byte (32 bytes)
entity_screen_id    EQU #C0D5   ; Entity screen ID (32 bytes)
entity_dir_mask     EQU #C0F5   ; Entity direction mask (32 bytes)
entity_health       EQU #C115   ; Entity health (32 bytes)
entity_anim_frame   EQU #C135   ; Entity animation frame (32 bytes)
entity_anim_tick    EQU #C155   ; Entity animation tick counter (32 bytes)
entity_anim_speed   EQU #C175   ; Entity animation speed (ticks per frame) (32 bytes)
entity_anim_flags   EQU #C195   ; Entity animation flags (32 bytes)
entity_sm_ptr_l     EQU #C1B5   ; Entity State Pointer Low (32 bytes)
entity_sm_ptr_h     EQU #C1D5   ; Entity State Pointer High (32 bytes)
entity_sm_timer_l   EQU #C1F5   ; Entity State Timer Low (32 bytes)
entity_sm_timer_h   EQU #C215   ; Entity State Timer High (32 bytes)
entity_sm_wait_timer EQU #C235   ; Entity State Wait Timer (32 bytes)
entity_lifetime     EQU #C255   ; Entity lifetime for auto-destroy (32 bytes, 0=infinite)
entity_sm_var_0     EQU #C275   ; Entity Variable 0 (32 bytes)
entity_sm_var_1     EQU #C295   ; Entity Variable 1 (32 bytes)
entity_sm_var_2     EQU #C2B5   ; Entity Variable 2 (32 bytes)
entity_sm_var_3     EQU #C2D5   ; Entity Variable 3 (32 bytes)
entity_sm_var_4     EQU #C2F5   ; Entity Variable 4 (32 bytes)
entity_sm_var_5     EQU #C315   ; Entity Variable 5 (32 bytes)
entity_sm_var_6     EQU #C335   ; Entity Variable 6 (32 bytes)
entity_sm_var_7     EQU #C355   ; Entity Variable 7 (32 bytes)

; ==================================================================
; SPRITE SYSTEM VARIABLES
; ==================================================================
active_sprite_count EQU #C375   ; Number of sprites currently active
sprite_pattern      EQU #C376   ; Sprite pattern IDs (32 bytes)
sprite_color        EQU #C396   ; Sprite colors (32 bytes)
sprite_attributes   EQU #C3B6   ; Interleaved sprite attributes (32 * 4 bytes)

; ==================================================================
; SCREEN SYSTEM VARIABLES (1 screens detected)
; ==================================================================
current_screen_id   EQU #C436   ; Currently displayed screen ID
screen_dirty_flag   EQU #C437   ; Screen needs redraw flag
current_world_id    EQU #C438   ; Current world ID (for multi-world support)
current_screen_index EQU #C439   ; Current screen index within world

; ==================================================================
; PLAYER SYSTEM VARIABLES (player entity detected)
; ==================================================================
player_x            EQU #C43A   ; Player X position (16-bit)
player_y            EQU #C43C   ; Player Y position (16-bit)
player_health       EQU #C43E   ; Player health points
player_score        EQU #C43F   ; Player score (16-bit)

; ==================================================================
; AUXILIARY VARIABLES 
; ==================================================================
deterministic        EQU #C441   ; Deterministic mode flag

; ==================================================================
; TEMPORARY VARIABLES (ALWAYS NEEDED)
; ==================================================================
temp_word_1         EQU #C442   ; Temporary 16-bit storage
temp_word_2         EQU #C444   ; Temporary 16-bit storage
temp_byte_1         EQU #C446   ; Temporary 8-bit storage
temp_byte_2         EQU #C447   ; Temporary 8-bit storage
temp_byte_3         EQU #C448   ; Temporary 8-bit storage (32 bytes)
temp_byte_4         EQU #C468   ; Temporary 8-bit storage (32 bytes)
temp_byte_5         EQU #C488   ; Temporary 8-bit storage (32 bytes)
temp_byte_6         EQU #C4A8   ; Temporary 8-bit storage (32 bytes)
temp_byte_7         EQU #C4C8   ; Temporary 8-bit storage (32 bytes)
temp_byte_8         EQU #C4E8   ; Temporary 8-bit storage (32 bytes)
temp_byte_9         EQU #C508   ; Temporary 8-bit storage (32 bytes)
temp_byte_10        EQU #C528   ; Temporary 8-bit storage (32 bytes)
temp_byte_11        EQU #C548   ; Temporary 8-bit storage (32 bytes)
temp_byte_12        EQU #C568   ; Temporary 8-bit storage (32 bytes)
temp_byte_13        EQU #C588   ; Temporary 8-bit storage (32 bytes)
temp_byte_14        EQU #C5A8   ; Temporary 8-bit storage (32 bytes)
temp_byte_15        EQU #C5C8   ; Temporary 8-bit storage (32 bytes)
temp_byte_16        EQU #C5E8   ; Temporary 8-bit storage (32 bytes)
temp_byte_17        EQU #C608   ; Temporary 8-bit storage (32 bytes)
temp_word_3         EQU #C628   ; Temporary 16-bit storage (64 bytes)
temp_word_4         EQU #C668   ; Temporary 16-bit storage (64 bytes)

; ==================================================================
; END OF VARIABLES
; ==================================================================
RAM_USAGE_END       EQU #C6A8   ; End of project variables (1704 bytes used)

; ==================================================================
; MEMORY SAFETY CHECK
; ==================================================================
; RAM Layout:
;   #C000-#C6A8: Project variables (1704 bytes)
;   #C6A8-#F37F: Free RAM (~11480 bytes available)
;   #F380-#FFFF: MSX System variables (DO NOT TOUCH)
; ==================================================================

; ==================================================================
; VARIABLE SPACE RESERVATION
; ==================================================================
; Reserve actual RAM space for all variables
; This section should be placed in RAM area (#C000+)
; ==================================================================
    ORG #C000

; Reserve space for all variables defined above
    DS 1704   ; Reserve 1704 bytes for all variables

; ==================================================================
; END OF VARIABLE SPACE
; ==================================================================
