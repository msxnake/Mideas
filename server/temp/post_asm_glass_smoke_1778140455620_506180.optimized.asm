org #4000
    db "AB"
    dw start
    dw 0,0,0,0,0,0
start:
    ret

; @mideas:block id=live_block kind=component owner=test roots=boot
live_label:
    ret
; @mideas:endblock id=live_block

