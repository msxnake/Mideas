# High-frequency SAT probe for transient Boss sprite artefacts.
set root "C:/Users/salam/Documents/Programacion/Mideas/work"
set f [open "$root/test607_edge_sync_fast_probe.txt" w]
set sf [open "$root/test607_edge_sync.sym" r]
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
set samples 0
set hits 0
set last ""

proc scan {} {
    global SAT COL samples hits last
    incr samples
    if {[mem8 current_screen_index] != 12 || [mem8 boss_active] == 0} {
        after time 0.02 scan
        return
    }
    set pp [mem8 player_pat]
    set bad {}
    for {set i 3} {$i < 32} {incr i} {
        set y [v8 $SAT [expr {$i * 4}]]
        set x [v8 $SAT [expr {$i * 4 + 1}]]
        set p [v8 $SAT [expr {$i * 4 + 2}]]
        set c [v8 $COL [expr {$i * 16}]]
        set player_pat_match [expr {$p == $pp || $p == (($pp + 4) & 0xFF) || $p == (($pp + 8) & 0xFF) || $p == (($pp + 12) & 0xFF)}]
        set upper_left [expr {$x < 16 && $y < 32}]
        if {$upper_left || ($player_pat_match && (($c & 0x0F) == 0x0B || ($c & 0x0F) == 0x0D) && $y < 0xD0)} {
            lappend bad [format "%d:%02X,%02X,%02X,%02X" $i $y $x $p $c]
        }
    }
    set sig [join $bad ";"]
    if {$sig ne "" && $sig ne $last} {
        incr hits
        logline [format "HIT sample=%d t=%.2f player=%d,%d pat=%02X slots=%s" $samples [expr {$samples * 0.02}] [mem8 player_x] [mem8 player_y] $pp $sig]
    }
    set last $sig
    if {($samples % 100) == 0} {
        logline [format "MARK sample=%d t=%.2f player=%d,%d hits=%d" $samples [expr {$samples * 0.02}] [mem8 player_x] [mem8 player_y] $hits]
    }
    after time 0.02 scan
}

# Enter game and reach the Boss room; start sampling before the dialogue closes.
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
after time 27 { scan }
after time 40 {
    logline [format "RESULT samples=%d hits=%d" $::samples $::hits]
    close $::f
    exit
}
logline "test607_edge_sync_fast_probe"
