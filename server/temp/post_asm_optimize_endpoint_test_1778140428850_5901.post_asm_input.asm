boot_entry:
    call live_label
    ret

; @mideas:block id=live_block kind=component owner=test roots=boot
live_label:
    ret
; @mideas:endblock id=live_block

; @mideas:block id=dead_block kind=component owner=test
dead_label:
    ret
; @mideas:endblock id=dead_block