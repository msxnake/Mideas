; ===== header.asm =====
; Konami ROM Header for BasicEnemy(7)
ORG #4000
DB "AB"              ; Konami signature
DW START             ; Start address
DW 0,0,0             ; Fill bytes

; ===== constants.asm =====
; Constants for BasicEnemy(7)
SPRITE_COUNT EQU 1
ENTITY_COUNT EQU 1
COMPONENT_COUNT EQU 4

; GameFlow states
FLOW_STATE_GAME EQU 1
FLOW_STATE_MENU EQU 0

; ===== sprites.asm =====
; Sprite data (1 sprites)
; Sprite: bot1 (16x16, 2 frames)
BOT1_PATTERN:
DB 0,0,0,0  ; Pattern data would be here
BOT1_FRAMES EQU 2

; ===== entities.asm =====
; Entity definitions (1 entities)
; Entity: BasicPatrol
BASICPATROL_COMPONENTS:
DB 4  ; Component count

; ===== components.asm =====
; Component definitions (4 components)
; Component: Position
COMP_POSITION_MASK EQU #01
; Component: Renderable
COMP_RENDERABLE_MASK EQU #02
; Component: Patrol
COMP_PATROL_MASK EQU #04
; Component: Animation
COMP_ANIMATION_MASK EQU #08

; ===== main.asm =====
; Main game loop for BasicEnemy(7)
START:
    ; Initialize MSX
    CALL INIT_MSX

    ; Load GameFlow: main
    CALL LOAD_GAMEFLOW

    ; Start main loop
MAIN_LOOP:
    ; Update entities (1)
    CALL UPDATE_ENTITIES

    ; Update sprites (1)
    CALL UPDATE_SPRITES

    ; V-Blank sync
    HALT

    JR MAIN_LOOP

; ===== bios.asm =====
; MSX BIOS functions

; ===== variables.asm =====
; RAM variables C000h-F37Fh