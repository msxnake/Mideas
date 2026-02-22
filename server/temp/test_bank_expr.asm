    org #4000
    db "AB"
    dw start
    ds 10,0
label1:
    db 1,2,3
bank1 equ ((label1-#4000)/#2000)
start:
    ld a,bank1
    ret
    end
