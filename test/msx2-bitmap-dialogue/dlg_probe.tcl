# NPC dialogue smoke: boot, talk (UP), watch typewriter, advance, close.
# bitmap_dlg_state EQU #C0F2 in this build (0 idle, 1 typing, 2 wait-advance).
set out [open "test/msx2-bitmap-dialogue/probe.log" w]
proc plog {msg} { global out; puts $out $msg; flush $out }
proc st {} { return [debug read memory 0xC0F2] }

after time 7 {
    plog "boot x=[debug read memory 0xC001] y=[debug read memory 0xC000] state=[st]"
    keymatrixdown 8 0x20
}
after time 7.4 { keymatrixup 8 0x20 }
after time 8 {
    plog "after UP: state=[st] (expect 1 typing)"
    screenshot test/msx2-bitmap-dialogue/shot1_typing.png
}
after time 11.5 {
    plog "typing done: state=[st] (expect 2 wait)"
    screenshot test/msx2-bitmap-dialogue/shot2_line1.png
    keymatrixdown 8 0x20
}
after time 11.9 { keymatrixup 8 0x20 }
after time 12.5 {
    plog "line 2 typing: state=[st] (expect 1)"
    screenshot test/msx2-bitmap-dialogue/shot3_line2.png
}
after time 15.5 {
    plog "line 2 done: state=[st] (expect 2)"
    keymatrixdown 8 0x20
}
after time 15.9 { keymatrixup 8 0x20 }
after time 16.5 {
    plog "closed: state=[st] (expect 0)"
    screenshot test/msx2-bitmap-dialogue/shot4_closed.png
    plog "player x=[debug read memory 0xC001] y=[debug read memory 0xC000]"
    exit
}
