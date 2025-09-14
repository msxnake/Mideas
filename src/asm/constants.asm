;; constants.asm
; MSX Memory Layout and System Constants
; ROM: #0000-#BFFF (System BIOS + Cartridge ROM - Read Only)
; RAM: #C000-#FFFF (Project Variables - Read/Write during execution)

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

; --- VRAM Addresses for SCREEN 2 ---
CLRTBL2     EQU     #2000   ; Color Attribute Table base
CHRTBL2     EQU     #0000   ; Pattern Generator Table base
PATTBL2     EQU     #1800   ; Name Table (Pattern list) base

SPRTBL EQU #3800
SPRATR EQU #1B00

; ===================================================================
; PROJECT RAM VARIABLES ZONE (#C000-#FFFF)
; Variables that can be written/read during game execution
; Using DS virtual to define addresses without inflating ROM binary
; ===================================================================

; Switch to RAM section for variables
    ORG #C000

; --- System Control Variables ---
deterministic:           DS virtual 1  ; System deterministic flag
isComputer50HzOr60Hz:    DS virtual 1  ; 50Hz/60Hz detection
game_state:              DS virtual 1  ; Current game state (0=menu, 1=game, 2=over)
prev_game_state:         DS virtual 1  ; Previous game state
current_screen_id:       DS virtual 1  ; Current screen/level ID
current_world_id:        DS virtual 1  ; Current world ID

; --- Input System Variables ---
input_state:             DS virtual 1  ; Current joystick/key state
prev_input_state:        DS virtual 1  ; Previous input state
input_buffer:            DS virtual 8  ; Input command buffer

; --- Player Variables ---
player_x:                DS virtual 2  ; Player X position (16-bit)
player_y:                DS virtual 2  ; Player Y position (16-bit)
player_vx:               DS virtual 1  ; Player velocity X
player_vy:               DS virtual 1  ; Player velocity Y
player_direction:        DS virtual 1  ; Player facing direction
player_health:           DS virtual 1  ; Player health points
player_score:            DS virtual 2  ; Player score (16-bit)
player_lives:            DS virtual 1  ; Player lives remaining

; --- Sprite System Variables ---
active_sprite_count:     DS virtual 1  ; Number of active sprites (0-32)
sprite_pool:             DS virtual 128 ; Sprite pool (32 sprites × 4 bytes each)
                                       ; Format per sprite: X, Y, Pattern, Color

; --- Collision Detection Variables ---
collision_result:        DS virtual 1  ; Last collision detection result
collision_x:             DS virtual 1  ; Collision X coordinate
collision_y:             DS virtual 1  ; Collision Y coordinate
collision_tile_id:       DS virtual 1  ; ID of colliding tile
collision_behavior_id:   DS virtual 1  ; Behavior ID of collision

; --- Sound System Variables ---
sound_channel_a:         DS virtual 1  ; PSG Channel A state
sound_channel_b:         DS virtual 1  ; PSG Channel B state
sound_channel_c:         DS virtual 1  ; PSG Channel C state
current_music_track:     DS virtual 1  ; Current music track ID
sound_fx_queue:          DS virtual 4  ; Sound effect queue

; --- Graphics System Variables ---
current_tileset_bank:    DS virtual 1  ; Current tileset bank (0-2)
tile_animation_frame:    DS virtual 1  ; Tile animation frame counter
screen_scroll_x:         DS virtual 2  ; Screen scroll X offset (16-bit)
screen_scroll_y:         DS virtual 2  ; Screen scroll Y offset (16-bit)
screen_transition_mode:  DS virtual 1  ; Screen transition type

; --- Game Flow Variables ---
current_flow_state:      DS virtual 1  ; Game flow state
prev_flow_state:         DS virtual 1  ; Previous flow state
flow_transition_timer:   DS virtual 1  ; Flow transition timer

; --- Frame and Timing Variables ---
frame_counter:           DS virtual 2  ; Global frame counter (16-bit)
vblank_flag:            DS virtual 1  ; V-Blank interrupt flag
game_timer:             DS virtual 2  ; Game timer (16-bit)

; --- Custom Project Variables Area ---
; Available from #C080 onwards for project-specific variables
PROJECT_CUSTOM_VARS:     EQU #C080     ; Start address for custom variables
