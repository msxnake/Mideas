# Diagnostic probe for the deferred-render test607 build.
set root "C:/Users/salam/Documents/Programacion/Mideas/work"
set f [open "$root/test607_deferred_ghost_probe.txt" w]
set shot_dir "$root/test607_deferred_render_shots"
set sf [open "$root/test607_deferred_render.sym" r]
set syms [read $sf]
close $sf
proc addr {label} {
    if {![regexp -line "^${label}: equ (\[0-9A-Fa-f\]+)H" $::syms -> hex]} { error "Missing symbol $label" }
    return [expr "0x$hex"]
}
proc mem8 {label} { return [debug read memory [addr $label]] }
proc v8 {base offset} { return [vpeek [expr {$base + $offset}]] }
proc logline {msg} { puts $::f $msg; flush $::f }
proc shot {name} {
    global shot_dir
    if {[catch {screenshot "$shot_dir/$name.png"} err]} {
        logline [format "SHOT_ERROR %s %s" $name $err]
    } else {
        logline [format "SHOT_OK %s" $name]
    }
}

set SAT 0xF600
set COL 0xF400
set frame 0
set ghost_count 0
set last_sig ""
set last_x -1
set last_y -1
set max_dx 0
set max_dy 0

proc scan {} {
    global SAT COL frame ghost_count last_sig last_x last_y max_dx max_dy
    incr frame
    if {[mem8 current_screen_index] != 12 || [mem8 boss_active] == 0} {
        after time 0.1 scan
        return
    }
    set px [mem8 player_x]
    set py [mem8 player_y]
    set pp [mem8 player_pat]
    if {$last_x >= 0} {
        set dx [expr {abs($px - $last_x)}]
        set dy [expr {abs($py - $last_y)}]
        if {$dx > $max_dx} { set max_dx $dx }
        if {$dy > $max_dy} { set max_dy $dy }
    }
    set last_x $px
    set last_y $py
    set visible {}
    set sig {}
    for {set i 0} {$i < 32} {incr i} {
        set y [v8 $SAT [expr {$i * 4}]]
        set x [v8 $SAT [expr {$i * 4 + 1}]]
        set p [v8 $SAT [expr {$i * 4 + 2}]]
        set c0 [v8 $COL [expr {$i * 16}]]
        if {$y < 0xD0} {
            lappend visible [format "%d:%02X,%02X,%02X,%02X" $i $y $x $p $c0]
        }
        if {$i >= 7 && $y < 0xD0 && ($p == $pp || $p == (($pp + 4) & 0xFF) || $p == (($pp + 8) & 0xFF) || $p == (($pp + 12) & 0xFF)) && (($c0 & 0x0F) == 0x0B || ($c0 & 0x0F) == 0x0D)} {
            incr ghost_count
            lappend sig [format "%d:%02X,%02X,%02X,%02X" $i $y $x $p $c0]
        }
    }
    set sig [join $sig ";"]
    if {$sig ne $last_sig} {
        if {$sig ne ""} {
            logline [format "CANDIDATE t=%.1f player=%d,%d pat=%02X boss=%d,%d slots=%s" [expr {$frame * 0.1}] $px $py $pp [mem8 boss_x] [mem8 boss_y] $sig]
        } elseif {$last_sig ne ""} {
            logline [format "CANDIDATE_END t=%.1f player=%d,%d visible=%s" [expr {$frame * 0.1}] $px $py [join $visible ";"]]
        }
        set last_sig $sig
    }
    if {($frame % 20) == 0} {
        logline [format "MARK t=%.1f player=%d,%d boss=%d,%d visible=%s max_delta=%d,%d candidates=%d" [expr {$frame * 0.1}] $px $py [mem8 boss_x] [mem8 boss_y] [join $visible ";"] $max_dx $max_dy $ghost_count]
    }
    after time 0.1 scan
}

# Enter the game and reach pan18, matching the established test607 route.
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
after time 13 { scan }
foreach t {15 16 17 18 19 20 21 22 23 24 25 26 27 28} {
    after time $t [list shot "t$t"]
}
after time 50 {
    logline [format "RESULT candidates=%d max_delta=%d,%d" $::ghost_count $::max_dx $::max_dy]
    close $::f
    exit
}
logline "test607_edge_sync_ghost_probe"
