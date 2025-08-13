import { ComponentDefinition, EntityTemplate } from '../types';

export const DEFAULT_MAP_ASM_CONTENT = ` include "constants.asm"
 MAX_PTR: EQU {{CALCULATED_MAX_PTR}}

;-----------------------------------------------
; PAGE 2:

    org #4000   ; Start in the 2nd slot
 StartOfPage2:

;-----------------------------------------------
    db "AB"     ; ROM signature
    dw Execute  ; start address
BLANK_CHAR_PATTERN: ;aprovechamos valores 0
    db 0,0,0,0,0,0,0,0,0,0,0,0
;-----------------------------------------------

ALL_MAP_TILES_PTR:
 incbin "bin/AllPatterns.BIN"

ALL_MAP_TILES_COL:
 incbin "bin/AllColors.BIN"

PAN1_LAYOUT_DATA:
 incbin "bin/MapLayout.bin"




BLANK_CHAR_COLOR:
    DB #11,#11,#11,#11,#11,#11,#11,#11 


;-------------------------------------------------------------------------------
; Set Video Mode
; Configures the VDP registers for Screen 2.
; Register 7 is explicitly set to 00h for a black background.
;-------------------------------------------------------------------------------
 Execute:
    di
    ; init the stack:
    ld sp,#F380
    ; reset some interrupts to make sure it runs in some MSX computers 
    ; with disk controllers installed in some interrupt handlers
    ld a,#C9
    ld (HKEY),a
    ld (TIMI),a
    ei

    ;call SETPAGES32K

    ; Silence, init keyboard, and clear config:
    xor a
    ld (CLIKSW),a
    ld (deterministic),a


    ld a,1
    ld hl,$f3e9
    ld [hl],15
    inc hl
    ld [hl],1
    inc hl
    ld [hl],1

    ; Change background colors:
    ld (BAKCLR),a
    ld (BDRCLR),a
    call CHGCLR

    ld a,2      ; Change screen mode
    call CHGMOD


    ;; 16x16 sprites:
    ld bc,#e201  ;; write #e2 in VDP register #01 (activate sprites, generate interrupts, 16x16 sprites with no magnification)
    call WRTVDP

    ;call CheckIf60Hz
    ld (isComputer50HzOr60Hz),a ; 0: 50Hz, 1: 60Hz
    
    call loadMyScreen
    call redef_spr
    
 bucle1: 
  jp bucle1

redef_spr:
            ;es redefineixen tots els sprites
    ; define sprites
        ld      hl,spr_jack 
        ld      de,SPRTBL
        ld      b,160
        call    DoCopy
    ; define sprite
        ld      hl,SPRATR
        ld      de,sprites
        ld      bc,32
        ldir
        ret


;-----------------------------------------------------------
;hl=origen
;de=destino
;b=blokes de 8 bytes

DoCopy:
 ld a,e
 di
 out ($99),a
 ld a,d
 or a,$40

 out ($99),a
 ei
 ld c,$98
 VdpReady:
  ld d,b
  outi
  outi
  outi
  outi
  outi
  outi
  outi
  ld b,d
  outi
  jp nz,VdpReady
  
  ret 

;-------------------------------------------------------------------------------
; loadMyScreen (NEW ROUTINE)
; Loads custom tile patterns and colors into all three VRAM banks,
; and then draws the screen layout.
;-------------------------------------------------------------------------------
 loadMyScreen:
     
      
 loadPatternBanks:
        ; --- Load TILE1 Pattern Data into all three PGT banks ---
        LD      HL, ALL_MAP_TILES_PTR ; Source RAM address for TILE1 patterns
        LD DE,CHRTBL2
        LD BC,MAX_PTR       ; 4 characters (0-3) * 8 bytes/char = 32 bytes
        CALL LDIRVM
        ; Load TILE1 patterns into the second PGT bank
        LD    HL, ALL_MAP_TILES_PTR ; Source RAM address for TILE1 patterns
        LD DE,CHRTBL2 + #800 ; Destination VRAM address for PGT bank 1
        LD BC, MAX_PTR       ; 4 characters (0-3) * 8 bytes/char = 32 bytes
        CALL LDIRVM
        ; Load TILE1 patterns into the third PGT bank
        LD    HL, ALL_MAP_TILES_PTR ; Source RAM address for TILE1 patterns
        LD DE,CHRTBL2 + #1000 ; Destination VRAM address for P
        LD BC, MAX_PTR        ; 4 characters (0-3) * 8 bytes/char = 32 bytes
        CALL LDIRVM

       


 loadColorBanks:
        ; --- Load TILE1 Color Data into all three CAT banks ---
        LD      HL,ALL_MAP_TILES_COL; Source RAM address for TILE1 colors
        LD      DE, CLRTBL2
        LD      BC, MAX_PTR      ; 4 characters * 8 bytes/char = 32 bytes
        CALL    LDIRVM

        ; Load TILE1 colors into the second CAT bank
        LD      HL,ALL_MAP_TILES_COL;Source RAM address for TILE1 colors
        LD      DE, CLRTBL2 + #800 ; Destination VRAM address for CAT
        LD      BC,MAX_PTR    ; 4 characters * 8 bytes/char = 32 bytes
        CALL    LDIRVM
        ; Load TILE1 colors into the third CAT bank
        LD      HL,ALL_MAP_TILES_COL;Source RAM address for TILE1 colors
        LD      DE, CLRTBL2 + #1000 ; Destination VRAM address for
        LD      BC,MAX_PTR     ; 4 characters * 8 bytes/char = 32 bytes
        CALL    LDIRVM

        ; --- Load Blank Character Pattern (character #255) into all three PGT banks ---

 loadBlankCharPatterns:
        LD      HL, BLANK_CHAR_PATTERN ; Source RAM address for blank character pattern
        LD     DE, CHRTBL2 + #0000 + (255 * 8) ; Destination VRAM address for char #255 in PGT bank 0
        LD      BC, 8           ; 8 bytes for one character pattern
        CALL    LDIRVM
        ; Load BLANK_CHAR_PATTERN into the second PGT bank
        LD      HL, BLANK_CHAR_PATTERN ; Source RAM address for blank character pattern
        LD      DE, CHRTBL2 + #800 + (255 * 8)
        ; Destination VRAM address for char #255 in PGT bank 1
        LD      BC, 8           ; 8 bytes for one character pattern
        CALL    LDIRVM
        ; Load BLANK_CHAR_PATTERN into the third PGT bank
        LD      HL, BLANK_CHAR_PATTERN ; Source RAM address for blank character pattern
        LD      DE, CHRTBL2 + #1000 + (255 * 8)
        ; Destination VRAM address for char #255 in PGT bank 2
        LD      BC, 8           ; 8 bytes for one character pattern
        CALL    LDIRVM

 

   
 loadBlankCharColors:
        ; --- Load Blank Character Color Data (character #255) into all three CAT banks ---
        LD      HL, BLANK_CHAR_COLOR ; Source RAM address for blank character color
        LD      DE, CLRTBL2 + #0000 + (255 * 8)
        LD      BC, 8           ; 8 bytes for one character color
        CALL    LDIRVM
        ; Load BLANK_CHAR_COLOR into the second CAT bank
        LD      HL, BLANK_CHAR_COLOR ; Source RAM address for blank character color
        LD      DE, CLRTBL2 + #800 + (255 * 8)
        ; Destination VRAM address for char #255 in CAT bank 1
        LD      BC, 8           ; 8 bytes for one character color
        CALL    LDIRVM
        ; Load BLANK_CHAR_COLOR into the third CAT bank
        LD      HL, BLANK_CHAR_COLOR ; Source RAM address for blank character color
        LD      DE, CLRTBL2 + #1000 + (255 * 8)
        ; Destination VRAM address for char #255 in CAT bank 2
        LD      BC, 8           ; 8 bytes for one character color
        CALL    LDIRVM

    

        ; --- Draw the Screen Layout to the Name Table ---
        CALL    drawScreenLayout
        RET


;-------------------------------------------------------------------------------
; Draw Screen Layout
; Copies the PAN1_LAYOUT_DATA to the VRAM Name Table.
;-------------------------------------------------------------------------------
 drawScreenLayout:
        LD      HL, PAN1_LAYOUT_DATA  ; Source RAM address
        LD      DE, #1800             ; Destination VRAM address (Name Table base)
        LD      BC, 256 * 3               ; Size of the layout data (32 columns * 24 rows)
        CALL    LDIRVM           ; Copy data to VRAM

        
        RET




`;

export const DEFAULT_CONSTANTS_ASM_CONTENT = `;; constants.asm
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

`;

export const DEFAULT_COMPONENT_DEFINITIONS: ComponentDefinition[] = [
  { 
    id: "comp_pos", name: "Position", 
    properties: [
      { name: "x", type: "byte", defaultValue: "0", description: "Horizontal position (pixel units or grid units depending on context)" }, 
      { name: "y", type: "byte", defaultValue: "0", description: "Vertical position" }
    ],
    description: "Defines an entity's 2D coordinates."
  },
  { 
    id: "comp_render", name: "Renderable", 
    properties: [
      { name: "spriteAssetId", type: "sprite_ref", defaultValue: "", description: "ID of the sprite asset to render" },
      { name: "isVisible", type: "boolean", defaultValue: "true", description: "Whether the entity is currently visible" },
      { name: "layer", type: "byte", defaultValue: "1", description: "Render layer (0=bg, 1=main, 2=fg)"}
    ],
    description: "Allows an entity to be drawn on screen using a sprite."
  },
  {
    id: "comp_behavior", name: "Behavior",
    properties: [
      { name: "scriptAssetId", type: "behavior_script_ref", defaultValue: "", description: "ID of the behavior script to run" }
    ],
    description: "Attaches a behavior script to an entity."
  },
  {
    id: "comp_health", name: "Health",
    properties: [
      { name: "current", type: "byte", defaultValue: "1" },
      { name: "max", type: "byte", defaultValue: "1" }
    ],
    description: "Manages health points for an entity."
  },
  {
    id: "comp_jump", name: "Jump",
    description: "Manages jumping behavior for an entity.",
    properties: [
      { name: "jumpPower", type: "word", defaultValue: "256", description: "Initial upward velocity or force." },
      { name: "maxJumps", type: "byte", defaultValue: "1", description: "Number of jumps allowed before landing." },
      { name: "currentJumpCount", type: "byte", defaultValue: "0", description: "Current jump count." },
      { name: "isJumping", type: "boolean", defaultValue: "false", description: "Is the entity currently jumping?" },
    ],
  },
  {
    id: "comp_gravity", name: "Gravity",
    description: "Applies gravitational force to an entity.",
    properties: [
      { name: "strength", type: "word", defaultValue: "64", description: "Acceleration due to gravity." },
      { name: "terminalVelocity", type: "word", defaultValue: "1024", description: "Maximum falling speed." },
    ],
  },
  {
    id: "comp_animation", name: "Animation",
    description: "Manages sprite animation sequences for an entity.",
    properties: [
      { name: "currentAnimationName", type: "string", defaultValue: "idle", description: "Name of the current animation (e.g., 'idle', 'walk')." },
      { name: "currentFrameIndex", type: "byte", defaultValue: "0", description: "Current frame in the animation." },
      { name: "animationSpeed", type: "byte", defaultValue: "6", description: "Ticks/frames per animation update." },
      { name: "loops", type: "boolean", defaultValue: "true", description: "Does the animation loop?" },
      { name: "isPlaying", type: "boolean", defaultValue: "true", description: "Is the animation currently playing?" },
    ],
  },
  { 
    id: "comp_collision", name: "Collision", 
    properties: [
      { name: "hitboxWidth", type: "byte", defaultValue: "16", description: "Width of the collision bounding box." },
      { name: "hitboxHeight", type: "byte", defaultValue: "16", description: "Height of the collision bounding box." },
      { name: "offsetX", type: "byte", defaultValue: "0", description: "Horizontal offset of the hitbox from the entity's origin." },
      { name: "offsetY", type: "byte", defaultValue: "0", description: "Vertical offset of the hitbox from the entity's origin." },
      { name: "collisionLayer", type: "byte", defaultValue: "1", description: "Bitmask defining the entity's collision group (e.g., 1=player, 2=enemy)." },
      { name: "collidesWith", type: "byte", defaultValue: "255", description: "Bitmask defining which layers this entity can collide with." }
    ],
    description: "Defines the physical shape and interaction rules for an entity."
  },
  { 
    id: "comp_physics", name: "Physics", 
    properties: [
      { name: "velocityX", type: "word", defaultValue: "0", description: "Horizontal speed (fixed-point 8.8 or integer)." },
      { name: "velocityY", type: "word", defaultValue: "0", description: "Vertical speed (fixed-point 8.8 or integer)." },
      { name: "friction", type: "byte", defaultValue: "10", description: "Damping factor for velocity (0-255, where 255 is no friction)." },
      { name: "mass", type: "byte", defaultValue: "1", description: "Mass of the entity, affecting knockback etc." }
    ],
    description: "Governs basic physical properties like velocity. Works with Gravity and Jump."
  },
  { 
    id: "comp_player_input", name: "PlayerInput", 
    properties: [
      { name: "controllerId", type: "byte", defaultValue: "0", description: "Controller ID (0 for player 1, 1 for player 2, etc.)." },
      { name: "inputEnabled", type: "boolean", defaultValue: "true", description: "Is input processing active for this entity." }
    ],
    description: "A marker component indicating the entity responds to player controls."
  },
  { 
    id: "comp_ai_behavior", name: "AIBehavior", 
    properties: [
      { name: "aiState", type: "string", defaultValue: "idle", description: "Current AI state (e.g., 'idle', 'patrol', 'chase')." },
      { name: "stateTimer", type: "word", defaultValue: "0", description: "Timer for current AI state duration or cooldown." },
      { name: "targetEntityTemplateId", type: "entity_template_ref", defaultValue: "", description: "ID of the entity template this AI is targeting (e.g., 'tpl_player')." },
      { name: "patrolRangeX", type: "word", defaultValue: "64", description: "Horizontal patrol range." },
      { name: "aggroRadius", type: "word", defaultValue: "80", description: "Radius to detect and target entities." }
    ],
    description: "Manages autonomous behavior for non-player entities."
  },
  { 
    id: "comp_damage", name: "Damage", 
    properties: [
      { name: "damageAmount", type: "byte", defaultValue: "1", description: "Amount of damage dealt." },
      { name: "damageType", type: "string", defaultValue: "contact", description: "Type of damage (e.g., 'contact', 'bullet', 'explosion')." },
      { name: "knockbackForce", type: "byte", defaultValue: "5", description: "Force applied on hit." }
    ],
    description: "Defines how much damage an entity inflicts upon collision or attack."
  },
  { 
    id: "comp_collectible", name: "Collectible", 
    properties: [
      { name: "itemType", type: "string", defaultValue: "coin", description: "Type of collectible (e.g., 'coin', 'key', 'powerup_health')." },
      { name: "itemValue", type: "word", defaultValue: "1", description: "Value associated with the item (e.g., score, health restored)." },
      { name: "autoCollectRadius", type: "byte", defaultValue: "8", description: "Radius within which the item is automatically collected." },
      { name: "collectionSoundRef", type: "sound_ref", defaultValue: "", description: "Sound to play on collection." }
    ],
    description: "Marks an entity as an item that can be picked up."
  },
  {
    id: "comp_patrol", name: "Patrol",
    description: "Defines a patrol route for an entity. Works with a Behavior script to update entity velocity.",
    properties: [
      { name: "patrolType", type: 'string', defaultValue: 'Horizontal', description: "Type of patrol: Horizontal, Vertical, Box, BackAndForth." },
      { name: "waypoint1_x", type: 'word', defaultValue: '0', description: "Start X coordinate or min corner of box." },
      { name: "waypoint1_y", type: 'word', defaultValue: '0', description: "Start Y coordinate or min corner of box." },
      { name: "waypoint2_x", type: 'word', defaultValue: '64', description: "End X coordinate or max corner of box." },
      { name: "waypoint2_y", type: 'word', defaultValue: '0', description: "End Y coordinate or max corner of box." },
      { name: "patrolSpeed", type: 'word', defaultValue: '50', description: "Movement speed during patrol." },
      { name: "waypointPause", type: 'word', defaultValue: '0', description: "Pause duration in ticks at each waypoint." }
    ],
  },
  {
    id: "comp_aiming", name: "Aiming",
    description: "Allows an entity to aim at a target. Used by turrets or enemies that shoot.",
    properties: [
      { name: "targetEntityTemplateId", type: 'entity_template_ref', defaultValue: 'tpl_player', description: "The type of entity to aim at." },
      { name: "aimingRange", type: 'word', defaultValue: '128', description: "Maximum distance to acquire a target." },
      { name: "rotationSpeed", type: 'word', defaultValue: '5', description: "How fast the entity rotates to face the target (0 for instant)." },
      { name: "fieldOfView", type: 'byte', defaultValue: '128', description: "The vision cone angle (0-255, mapping to 0-360 degrees)." },
      { name: "predictsTargetMovement", type: 'boolean', defaultValue: 'false', description: "Whether to aim ahead of a moving target." },
      { name: "predictionFactor", type: 'byte', defaultValue: '10', description: "Multiplier for leading the target." }
    ],
  },
  {
    id: "comp_bounce", name: "Bounce",
    description: "Makes an entity bounce off surfaces upon collision.",
    properties: [
      { name: "bounciness", type: 'byte', defaultValue: '200', description: "Elasticity of the bounce (0-255, where 255 is a near-perfect bounce)." },
      { name: "bounceOnLayers", type: 'byte', defaultValue: '255', description: "Bitmask of collision layers this entity will bounce off." },
      { name: "minVelocityToBounce", type: 'word', defaultValue: '25', description: "Minimum velocity required to trigger a bounce." },
      { name: "maxBounces", type: 'byte', defaultValue: '255', description: "Maximum number of bounces before stopping (255 for infinite)." },
      { name: "bounceSoundId", type: 'sound_ref', defaultValue: '', description: "ID of the sound asset to play on bounce." }
    ],
  }
];

export const DEFAULT_ENTITY_TEMPLATES: EntityTemplate[] = [
  { 
    id: "tpl_player", name: "Player", icon: "👤", 
    components: [ 
      { definitionId: "comp_pos", defaultValues: {x: 32, y: 100}}, 
      { definitionId: "comp_render", defaultValues: { spriteAssetId: "placeholder_sprite_player", isVisible: true, layer: 1 } }, 
      { definitionId: "comp_behavior", defaultValues: { scriptAssetId: "placeholder_behavior_player_control"} },
      { definitionId: "comp_health", defaultValues: { current: 3, max: 3 } },
      { definitionId: "comp_jump", defaultValues: { jumpPower: "384", maxJumps: "2" } }, 
      { definitionId: "comp_gravity", defaultValues: { strength: "80" } },
      { definitionId: "comp_animation", defaultValues: { currentAnimationName: "player_idle", animationSpeed: "8" } },
      { definitionId: "comp_collision", defaultValues: { hitboxWidth: 14, hitboxHeight: 15, offsetX: 1, offsetY: 1, collisionLayer: 1, collidesWith: 2 }} // Example player collision
    ],
    description: "The main player character."
  },
  { 
    id: "tpl_enemy_basic", name: "Basic Enemy", icon: "👻", 
    components: [ 
      { definitionId: "comp_pos", defaultValues: {x: 100, y: 100}}, 
      { definitionId: "comp_render", defaultValues: { spriteAssetId: "placeholder_sprite_enemy", isVisible: true, layer: 1 } }, 
      { definitionId: "comp_ai_behavior", defaultValues: { scriptAssetId: "placeholder_behavior_patrol", patrolRangeX: 32, aggroRadius: 64 } },
      { definitionId: "comp_health", defaultValues: { current: 1, max: 1 } },
      { definitionId: "comp_gravity", defaultValues: {} }, 
      { definitionId: "comp_animation", defaultValues: { currentAnimationName: "enemy_walk", animationSpeed: "10" } },
      { definitionId: "comp_collision", defaultValues: { collisionLayer: 2, collidesWith: 1 }}, // Example enemy collision
      { definitionId: "comp_damage", defaultValues: { damageAmount: 1, damageType: "contact"}}
    ],
    description: "A simple enemy that patrols and deals contact damage."
  },
  { 
    id: "tpl_item_key", name: "Key Item", icon: "🔑", 
    components: [ 
      { definitionId: "comp_pos", defaultValues: {x: 50,y: 50}}, 
      { definitionId: "comp_render", defaultValues: { spriteAssetId: "placeholder_sprite_key", isVisible: true, layer: 0 } },
      { definitionId: "comp_animation", defaultValues: { currentAnimationName: "key_shine", loops: true, animationSpeed: "15" } },
      { definitionId: "comp_collectible", defaultValues: { itemType: "key", itemValue: 1, autoCollectRadius: 12, collectionSoundRef: "sfx_collect_key" }}
    ],
    description: "A key item to be collected."
  },
];
