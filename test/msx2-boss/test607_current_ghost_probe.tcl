# Diagnostic probe for test607_current. The player sprite uses pattern groups
# 0/4/8/12 and yellow line colours; any such pattern outside SAT slots 0..3
# is a stale Player-shaped sprite candidate.
set root "C:/Users/salam/Documents/Programacion/Mideas/work"
set f [open "$root/test607_current_ghost_probe.txt" w]
set sf [open "$root/test607_current.sym" r]
set syms [read $sf]
close $sf
proc addr {label} {
    if {![regexp -line "^${label}: equ (\[0-9A-Fa-f\]+)H" $::syms -> hex]} { error "Missing symbol $label" }
    return [expr "0x$hex"]
}
proc mem8 {label} { return [debug read memory [addr $label]] }
proc v8 {base offset} { return [vpeek [expr {$base + $offset}]] }
proc logline {msg} { puts $::f $msg; flush $::f }

set SAT 0xF600
set COL 0xF400
set throttle on
set frame 0
set armed 0
set ghost_count 0
set last_sig ""
set scan_calls 0

proc state {tag} {
    logline [format "STATE %s screen=%d boss=%d player=%d,%d" $tag [debug read memory 0xC00B] [debug read memory 0xD1D4] [debug read memory 0xC001] [debug read memory 0xC000]]
}

proc safe_scan {} {
    incr ::scan_calls
    if {[catch {scan} err]} {
        logline [format "SCAN_ERROR call=%d err=%s" $::scan_calls $err]
        close $::f
        exit
    }
}

proc scan {} {
    global SAT COL frame armed ghost_count last_sig
    incr frame
    if {[mem8 current_screen_index] != 12 || [mem8 boss_active] == 0} {
        after time 0.1 scan
        return
    }
    set px [mem8 player_x]
    set py [mem8 player_y]
    set pp [mem8 player_pat]
    set sig ""
    set rows {}
    for {set i 0} {$i < 32} {incr i} {
        set y [v8 $SAT [expr {$i * 4}]]
        set x [v8 $SAT [expr {$i * 4 + 1}]]
        set p [v8 $SAT [expr {$i * 4 + 2}]]
        set c0 [v8 $COL [expr {$i * 16}]]
        if {$y < 0xD0} {
            lappend rows [format "%d:%02X,%02X,%02X,%02X" $i $y $x $p $c0]
        }
        if {$i >= 4 && $y < 0xD0 && ($p == $pp || $p == (($pp + 4) & 0xFF) || $p == (($pp + 8) & 0xFF) || $p == (($pp + 12) & 0xFF)) && (($c0 & 0x0F) == 0x0B || ($c0 & 0x0F) == 0x0D)} {
            incr ghost_count
            lappend sig [format "%d:%02X,%02X,%02X,%02X" $i $y $x $p $c0]
        }
    }
    set sig [join $sig ";"]
    if {$sig ne "" || $sig ne $last_sig} {
        if {$sig ne ""} {
            logline [format "CANDIDATE frame=%d player=%d,%d pat=%02X boss=%d,%d slots=%s" $frame $px $py $pp [mem8 boss_x] [mem8 boss_y] $sig]
        } elseif {$last_sig ne ""} {
            logline [format "CANDIDATE_END frame=%d player=%d,%d pat=%02X slots=%s" $frame $px $py $pp [join $rows ";"]]
        }
        set last_sig $sig
    }
    if {!$armed} {
        set armed 1
        logline [format "ARMED frame=%d player=%d,%d boss=%d,%d" $frame $px $py [mem8 boss_x] [mem8 boss_y]]
    }
    if {($frame % 120) == 0} {
        logline [format "MARK frame=%d player=%d,%d boss=%d,%d slots=%s candidates=%d" $frame $px $py [mem8 boss_x] [mem8 boss_y] [join $rows ";"] $ghost_count]
    }
    after time 0.1 scan
}

# Enter the game and reach pan18, matching the existing test607 route.
after time 6  { keymatrixdown 8 0x01 }
after time 6.5 { keymatrixup 8 0x01 }
after time 8  { keymatrixdown 8 0x01 }
after time 8.5 { keymatrixup 8 0x01 }
after time 10 { keymatrixdown 8 0x01 }
after time 10.5 { keymatrixup 8 0x01 }
after time 12 { keymatrixdown 8 0x80 }
after time 29 { keymatrixup 8 0x80 }
foreach t {13 15 17 19 21 23 25 27} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t+0.4}] "keymatrixup 8 0x01"
}
foreach t {24 26 28 30 32} {
    after time $t "keymatrixdown 8 0x20"
    after time [expr {$t+0.3}] "keymatrixup 8 0x20"
}
after time 33 { keymatrixdown 8 0x10 }
after time 34 { keymatrixup 8 0x10 }
after time 37 { keymatrixdown 8 0x80 }
after time 38 { keymatrixup 8 0x80 }
after time 12 { state t12 }
after time 15 { state t15 }
after time 20 { state t20 }
after time 13 { safe_scan }
after time 50 {
    logline [format "RESULT candidates=%d" $::ghost_count]
    close $::f
    exit
}
logline "test607_current_ghost_probe"
