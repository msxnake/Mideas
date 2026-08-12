# Phase 1: get into gameplay, walk east into the boss room (pan2 = index 1),
# and log the boss/intro state every frame.
set log "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/_bug_probe1.txt"
set f [open $log "w"]
proc L {m} { global f; puts $f $m; flush $f }
proc M {a} { return [debug read memory $a] }

set SCREEN   0xC00B
set PX       0xC001
set PY       0xC000
set BACT     0xD08E
set BHP      0xD095
set BDEF     0xD0AA
set ISTATE   0xD0DA
set IAUTO    0xD0DF
set DLG      0xD040

set frame 0
set phase boot
set logged 0

proc tick {} {
    global frame phase logged SCREEN PX PY BACT BHP BDEF ISTATE IAUTO DLG
    incr frame
    set scr [M $SCREEN]

    if {$phase eq "boot"} {
        # mash SPACE to get through presentation / gameflow
        if {$frame % 20 == 0} { keymatrixdown 8 0x01 }
        if {$frame % 20 == 5} { keymatrixup 8 0x01 }
        if {$frame > 120 && $scr != 255} {
            L "GAMEPLAY at frame $frame screen=$scr player=([M $PX],[M $PY])"
            keymatrixup 8 0x01
            set phase walk
        }
        if {$frame > 1200} { L "NEVER REACHED GAMEPLAY (screen=$scr)"; close $f; exit }
    } elseif {$phase eq "walk"} {
        keymatrixdown 8 0x80 ;# RIGHT
        if {$frame % 10 == 0} {
            L [format "walk f%04d scr=%d x=%d y=%d bact=%d hp=%d ist=%d iau=%d def1=%d" \
                $frame $scr [M $PX] [M $PY] [M $BACT] [M $BHP] [M $ISTATE] [M $IAUTO] [debug read memory [expr {$BDEF+1}]]]
        }
        if {$scr == 1} {
            L "ENTERED BOSS ROOM at frame $frame"
            keymatrixup 8 0x80
            set phase inroom
            set logged 0
        }
        if {$frame > 2400} { L "TIMEOUT walking (scr=$scr)"; close $f; exit }
    } elseif {$phase eq "inroom"} {
        L [format "room f%04d scr=%d x=%d y=%d bact=%d hp=%d ist=%d iau=%d dlg=%d" \
            $frame $scr [M $PX] [M $PY] [M $BACT] [M $BHP] [M $ISTATE] [M $IAUTO] [M $DLG]]
        incr logged
        if {$logged >= 120} {
            screenshot "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/_bug_probe1.png"
            L "DONE"
            close $f
            exit
        }
    }
    after frame tick
}
tick
