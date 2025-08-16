; Custom Interrupt Handler Hook
; This snippet shows how to replace the default
; interrupt handler with your own, while preserving
; the original hook to call it later.

start:
    ; first save the old hook
    ld      hl,#FD9F    ; Address of H.TIMI (ISR hook)
    ld      de,oldhk
    ld      bc,5        ; JP instruction is 3 bytes, + 2 for safety/padding
    ldir

    ; now set the new hook
    di                  ; Disable interrupts
    ld      hl,newhk_entry
    ld      de,#FD9F
    ld      bc,5
    ldir
    ei                  ; Enable interrupts

; -- spectacular main loop
loop:
    halt                ; Wait for interrupt
    jr      loop

newhk_entry:
    jp      my_interrupt_handler
    ret                 ; Padding for 5 bytes
    ret

; -- here your custom int handler
;    This one is not very inspiring :-)
my_interrupt_handler:
    ; --- Your ISR code here ---
    ; Example: Increment a counter
    ; ld hl, myCounter
    ; inc [hl]
    ; --- End of your ISR code ---

    ; After your code, jump to the original hook
    jp      oldhk

; -- storage for the old hook's JP instruction
oldhk:
    nop                 ; Will be overwritten by JP nnnn
    nop
    nop
    nop                 ; Extra NOPs if the original hook was shorter
    nop                 ; or if you need to ensure old_hook is 5 bytes.
                        ; Typically, the first 3 bytes are JP nnnn.
                        ; The 'ret ret' in the original snippet for 'newhk'
                        ; was a way to make 'newhk' 5 bytes long for ldir.
                        ; 'oldhk' needs to safely store 5 bytes.
