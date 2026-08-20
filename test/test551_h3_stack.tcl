# Capture the Z80 call stack while the H3 boot is parked in vdp_wait_cmd_ready.
set SYMFILE "C:/Users/salam/AppData/Local/Temp/mideas-test551/test551_boss_claude.sym"
set OUTDIR  "C:/Users/salam/AppData/Local/Temp/mideas-test551"
set LOG [open "$OUTDIR/test551-h3-stack.log" w]
proc say {msg} { global LOG; puts $LOG $msg; flush $LOG }

set ADDR2SYM [dict create]
set SORTED {}
set fh [open $SYMFILE r]
set symtext [read $fh]
close $fh
foreach line [split $symtext "\n"] {
    if {[regexp {^([A-Za-z_][A-Za-z0-9_.]*): equ ([0-9A-Fa-f]+)H} [string trim $line] -> name hex]} {
        scan $hex %x addr
        dict set ADDR2SYM $addr $name
        lappend SORTED $addr
    }
}
set SORTED [lsort -integer -unique $SORTED]

proc nearest {addr} {
    global SORTED ADDR2SYM
    set best "?"
    foreach a $SORTED {
        if {$a <= $addr} {
            if {[dict exists $ADDR2SYM $a]} { set best "[dict get $ADDR2SYM $a]+[expr {$addr - $a}]" }
        } else { break }
    }
    return $best
}

set A_wait -1
if {[dict exists $ADDR2SYM 0]} { }
foreach line [split $symtext "\n"] {
    if {[regexp {^vdp_wait_cmd_ready: equ ([0-9A-Fa-f]+)H} $line -> h]} { scan $h %x A_wait }
}
say "vdp_wait_cmd_ready = [format %04X $A_wait]"

proc dump {} {
    set sp [reg SP]
    say [format "t=%.3f PC=%04X SP=%04X" [machine_info time] [reg PC] $sp]
    for {set i 0} {$i < 14} {incr i} {
        set lo [debug read memory [expr {$sp + $i * 2}]]
        set hi [debug read memory [expr {$sp + $i * 2 + 1}]]
        set w [expr {($hi << 8) | $lo}]
        say [format "  stack+%02d: %04X  %s" [expr {$i * 2}] $w [nearest $w]]
    }
    screenshot "$::OUTDIR/test551-h3-stack.png"
    close $::LOG
    after time 0.100 { exit }
}

after time 10.000 dump
debug cont
