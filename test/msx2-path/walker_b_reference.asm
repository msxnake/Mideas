; Reference walker for architecture B (node graph walked at runtime).
;
; NOT production code and not wired to anything: this exists so the paper can
; quote a T-state count taken from EMITTED, ASSEMBLED Z80 instead of from an
; estimate. [144] already showed what an estimate is worth here — "~70" for the
; boss walker turned out to be 287 once every instruction was counted.
;
; Representation as fixed in [145]:
;   node (5 bytes, in RAM, copied once per room):  x, y, next, nextAlt, policy
;   per slot (3 bytes):  node pointer (2, cached) + branch mask (1)
;
; Caching the POINTER instead of the index is the one deliberate optimisation:
; rebuilding `nodes + index*5` costs ~95 T-states every tick, and it only ever
; changes when the body arrives at a node, which is rare.
;
; Policies: 0 fixed, 1 alternate, 2 playerSide, 3 flag.

PATH_NODE_BYTES   EQU 5
SLOT_NODE_PTR     EQU 24        ; and 25: cached pointer to the current node
SLOT_BRANCH_MASK  EQU 26        ; one bit per fork taken, for `alternate`

    org #4000

    jp bitmap_enemy_path_step

; --- stubs standing in for the real runtime -----------------------------------
player_x            EQU #C001
bitmap_path_nodes   EQU #C300   ; the room's node cache, filled by load_room
bitmap_enemy_pool   EQU #D0D4

; ------------------------------------------------------------
; FUNCTION: bitmap_enemy_path_step
; ------------------------------------------------------------
; PURPOSE: One tick of path following for the slot in IX. Steps one pixel per
;   axis towards the current node; on arrival hands over to the node advance.
; INPUT: IX = pool slot with a cached node pointer at +24/+25.
; OUTPUT: (ix+0)/(ix+1) moved; the cached pointer advanced on arrival.
; DESTROYS: AF, C, E, HL. PRESERVES: B, D, IX, IY.
; ------------------------------------------------------------
; C counts the axes already on target. Two of them means the body has arrived,
; and counting is cheaper than remembering two flags.
bitmap_enemy_path_step:
    ld l, (ix+SLOT_NODE_PTR)
    ld h, (ix+SLOT_NODE_PTR+1)
    ld c, 0
    ld a, (hl)                 ; node.x
    inc hl
    ld e, (hl)                 ; node.y, saved before HL moves on
    sub (ix+0)
    jr z, .pth_x_on
    jr nc, .pth_x_right
    dec (ix+0)
    jr .pth_y
.pth_x_right:
    inc (ix+0)
    jr .pth_y
.pth_x_on:
    inc c
.pth_y:
    ld a, e
    sub (ix+1)
    jr z, .pth_y_on
    jr nc, .pth_y_down
    dec (ix+1)
    ret
.pth_y_down:
    inc (ix+1)
    ret
.pth_y_on:
    inc c
    ld a, c
    cp 2
    ret nz                     ; only one axis home: keep walking
    ; falls through into the advance

; ------------------------------------------------------------
; FUNCTION: bitmap_enemy_path_advance
; ------------------------------------------------------------
; PURPOSE: Picks the next node and re-caches its pointer. Runs ON ARRIVAL only,
;   which is why it may afford the index-to-pointer multiply the step avoids.
; INPUT: IX = slot, HL -> current node + 2 (the caller left it there).
; DESTROYS: AF, C, E, HL. PRESERVES: B, D, IX, IY.
; ------------------------------------------------------------
bitmap_enemy_path_advance:
    inc hl                     ; -> next
    ld a, (hl)                 ; A = next index
    inc hl
    ld c, (hl)                 ; C = nextAlt index
    inc hl
    ld e, (hl)                 ; E = policy
    ; policy 0 (fixed) is the default and the common case: test it first so the
    ; ordinary node pays one compare and nothing else.
    ld h, a                    ; keep `next` while the policy decides
    ld a, e
    or a
    jr z, .pth_take
    cp 2
    jr z, .pth_player_side
    cp 1
    jr z, .pth_alternate
    ; policy 3 (flag) and anything unknown fall back to `next`, so a corrupt
    ; byte costs a wrong turn and never a wild pointer.
    jr .pth_take
.pth_alternate:
    ld a, (ix+SLOT_BRANCH_MASK)
    xor 1
    ld (ix+SLOT_BRANCH_MASK), a
    and 1
    jr z, .pth_take
    ld h, c
    jr .pth_take
.pth_player_side:
    ld a, (player_x)
    cp (ix+0)
    jr c, .pth_take            ; player to the left: keep `next`
    ld h, c
.pth_take:
    ; index -> pointer: nodes + index*5, done here and cached, so the step above
    ; never pays for it.
    ld a, h
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl                 ; *4
    ld e, a
    ld d, 0
    add hl, de                 ; *5
    ld de, bitmap_path_nodes
    add hl, de
    ld (ix+SLOT_NODE_PTR), l
    ld (ix+SLOT_NODE_PTR+1), h
    ret
