# Regeneration check: collapse the tile under the spawn, leave to room B, come back
# and verify the tile is whole again.
#
#   c(3,6) #C073 : #10 -> 0 (collapsed) -> #10 again after re-entering room A
#   The player is teleported out of the 1-cell pit it falls into (it cannot walk
#   out of it) and to the room edge, exactly like the destroy_tile smoke does.
set result_path "test/msx2-crumble/crumble_roundtrip.txt"
proc snap {label} {
    global result_path
    set f [open $result_path a]
    puts $f [format "%-12s screen=%s pos=(%s,%s) grounded=%s slot0(cell=%s stage=%s) c(2,6)=%s c(3,6)=%s c(4,6)=%s" \
        $label [debug read memory 0xC00B] [debug read memory 0xC001] [debug read memory 0xC000] \
        [expr {[debug read memory 0xC007] & 1}] \
        [debug read memory 0xD004] [debug read memory 0xD005] \
        [debug read memory 0xC072] [debug read memory 0xC073] [debug read memory 0xC074]]
    close $f
}
after time 4  { keymatrixdown 8 0x01 } ; after time 4.2 { keymatrixup 8 0x01 }
after time 5  { keymatrixdown 8 0x01 } ; after time 5.2 { keymatrixup 8 0x01 }
after time 6  { keymatrixdown 8 0x01 } ; after time 6.2 { keymatrixup 8 0x01 }

after time 12 {
    snap "collapsed"
    screenshot test/msx2-crumble/roundtrip_collapsed.png
    debug write memory 0xC000 80     ; # out of the pit
    debug write memory 0xC001 240    ; # at the east edge
    keymatrixdown 8 0x80
}
after time 13.5 {
    keymatrixup 8 0x80
    snap "in_room_B"
    screenshot test/msx2-crumble/roundtrip_room_b.png
    debug write memory 0xC001 8      ; # at the west edge of room B
    keymatrixdown 8 0x10
}
after time 15 {
    keymatrixup 8 0x10
    snap "back_home"
    screenshot test/msx2-crumble/roundtrip_back.png
}
after time 16 { snap "settled" ; screenshot test/msx2-crumble/roundtrip_settled.png ; after time 1 { exit } }
