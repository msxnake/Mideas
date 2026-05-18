    org #4000
FOO EQU ((#25FE8 - #4000) / #2000)
BAR EQU 4
test1:
    ld a, FOO
test2:
    ld a, FOO & #FF
test3:
    ld a, #00 + FOO
test4:
    ld a, BAR
    end
