;auxiliar.asm 

;
;-----------------------------------------------
;; clear sprites:
clearSprites:
    xor a
    ld bc,32*4
    ld hl,SPRATR1
    jp FILVRM


;-----------------------------------------------
; Fills the whole screen with the pattern in register 'a'
FILLSCREEN:
    xor a
    ld bc,768
    ld hl,NAMTBL2
    jp FILVRM


;-----------------------------------------------
; Clears the screen left to right
clearScreenLeftToRight:
    call clearAllTheSprites
    ld a,32
    ld bc,0
clearScreenLeftToRightExternalLoop
    push af
    push bc
    ld a,24
    ld hl,NAMTBL2
    add hl,bc
clearScreenLeftToRightLoop:
    push hl
    push af
    xor a
    ld bc,1
    call FILVRM
    pop af
    pop hl
    ld bc,32
    add hl,bc
    dec a
    jr nz,clearScreenLeftToRightLoop
    pop bc
    pop af
    inc bc
    dec a
    halt
    jr nz,clearScreenLeftToRightExternalLoop
    ret  
;-----------------------------------------------
; copies the sprite pointed at by "de" to VDP address pointed by "hl"
loadSpriteToVDP:
    push de
    call SETWRT
    ; get the VDP write register:
    ld a,(VDP.DW)
    ld c,a
    ld b,32
    pop hl
loadSpriteToVDP_loop:
    outi
    jp nz,loadSpriteToVDP_loop
    ret


;-----------------------------------------------
; renders the player and other sprites:
renderSprites:
    ld hl,SPRATR2
    call SETWRT

    ; get the VDP write register:
    ld a,(VDP.DW)
    ld c,a

    ld a,(game_cycle)
    and #01
    jr nz,renderSprites_reverse_order

    ld b,4*NUMBER_OF_SPRITES_USED
    ld hl,sprite_attributes
renderSprites_loop:
    outi
    jp nz,renderSprites_loop
    ret

;-----------------------------------------------
; Source: http://wikiti.brandonw.net/index.php?title=Z80_Routines:Math:Random
;-----> Generate a random number
; ouput a=answer 0<=a<=255
; all registers are preserved except: af
random:
    push    hl
    push    de
    ld      hl,(randData)
    ld      a,r
    ld      d,a
    ld      e,(hl)
    add     hl,de
    add     a,l
    xor     h
    ld      (randData),hl
    pop     de
    pop     hl
    ret


randomSeedUpdate:
    ld a,(randSeedIndex)
    inc a
    ld (randSeedIndex),a
    and #01
    jp z,randomSeedUpdate2
    ld a,r
    ld (randData),a
    ret
randomSeedUpdate2:
    ld a,r
    ld (randData+1),a
    ret
    

;-----------------------------------------------
; Generates a random number between 0 and "a-1"
; - note: this function is slow, since it requires calling a division, so, do not
;         call in code that is supposed to run fast.
randomModuloA:
    push hl
    push de
    push af
    call random
    ld h,0
    ld l,a
    pop af
    ld d,a
    call Div8
    pop de
    pop hl
    ret


;-----------------------------------------------
; Source: (thanks to ARTRAG) https://www.msx.org/forum/msx-talk/development/memory-pages-again
; Sets the memory pages to : BIOS, ROM, ROM, RAM
setupROMRAMslots:
    call RSLREG     ; Reads the primary slot register
    rrca
    rrca
    and #03         ; keep the two bits for page 1
    ld c,a
    add a,#C1       
    ld l,a
    ld h,#FC        ; HL = EXPTBL + a
    ld a,(hl)
    and #80         ; keep just the most significant bit (expanded or not)
    or c
    ld c,a          ; c = a || c (a had #80 if slot was expanded, and #00 otherwise)
    inc l           
    inc l
    inc l
    inc l           ; increment 4, in order to get to the corresponding SLTTBL
    ld a,(hl)       
    and #0C         
    or c            ; in A the rom slotvar 
    ld h,#80        ; move page 1 of the ROM to page 2 in main memory
    jp ENASLT       
    

;-----------------------------------------------
; source: https://www.msx.org/forum/development/msx-development/how-0?page=0
; returns 1 in a and clears z flag if vdp is 60Hz
; size: 27 bytes
CheckIf60Hz:
    di
    in      a,(#99)
    nop
    nop
    nop
vdpSync:
    in      a,(#99)
    and     #80
    jr      z,vdpSync
    
    ld      hl,#900
vdpLoop:
    dec     hl
    ld      a,h
    or      l
    jr      nz,vdpLoop
    
    in      a,(#99)
    rlca
    and     1
    ei
    ret
