# gemroute v2: enter the Caverna2 gem room through a real transition, then
# catch the PC=0700 freeze Codex reported after the bank fix and dump the Z80
# stack so the jumper can be named. Releases RIGHT once inside the target room
# so the player cannot walk on into the next one.
set SYMFILE "C:/Users/salam/AppData/Local/Temp/mideas-test551/test551_boss_claude.sym"
set OUTDIR  "C:/Users/salam/AppData/Local/Temp/mideas-test551"
set LOG [open "$OUTDIR/test551-gemroute2.log" w]
proc say {m} { global LOG; puts $LOG $m; flush $LOG }

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
proc sym1 {n} {
    global ADDR2SYM
    return [dict get $ADDR2SYM [symaddr $n]]
}
proc symaddr {n} {
    global ADDR2SYM
    foreach {a nm} $ADDR2SYM { if {$nm eq $n} { return $a } }
    error "no $n"
}
set R_screen [symaddr current_screen_index]
set R_player [symaddr player_x]
set R_staged [symaddr bitmap_gem_staged_room]

after time 2.000 { keymatrixdown 8 0x80 ; say "holding RIGHT" }

proc poll {} {
    global R_screen R_player R_staged
    set scr [debug read memory $R_screen]
    if {$scr == 1} { keymatrixup 8 0x80 ; say "inside target room: RIGHT released" }
    say [format "t=%.3f screen=%d player_x=%d staged=%d PC=%04X" \
        [machine_info time] $scr [debug read memory $R_player] \
        [debug read memory $R_staged] [reg PC]]
    if {[machine_info time] < 12.0} {
        after time 0.300 { poll }
    } else {
        after time 0.100 { diagnose }
    }
}

proc diagnose {} {
    global OUTDIR R_screen R_staged
    debug break
    set pc [reg PC]
    set sp [reg SP]
    say ""
    say "================ FREEZE DIAGNOSTIC ================"
    say [format "t=%.3f PC=%04X SP=%04X screen=%d staged=%d" \
        [machine_info time] $pc $sp [debug read memory $R_screen] [debug read memory $R_staged]]
    say "stack (return addresses):"
    for {set i 0} {$i < 14} {incr i} {
        set lo [debug read memory [expr {$sp + $i * 2}]]
        set hi [debug read memory [expr {$sp + $i * 2 + 1}]]
        set w [expr {($hi << 8) | $lo}]
        say [format "  +%02d: %04X  %s" [expr {$i * 2}] $w [nearest $w]]
    }
    if {[catch {set ce [debug read "VDP status" 2]} err]} {
        say "S#2 unavailable: $err"
    } else {
        say [format "S#2=%02X (bit0=CE: %d)" $ce [expr {$ce & 1}]]
    }
    # The command registers keep the LAST command written: if an invalid one
    # killed the engine, its operands are still sitting here.
    set names {SX SX- SY SY- DX DX- DY DY- NX NX- NY NY- CLR ARG CMD}
    set vals {}
    set names2 {}
    for {set r 32} {$r <= 46} {incr r} {
        if {[catch {set v [debug read "VDP regs" $r]} err]} {
            say "VDP regs unavailable: $err"
            break
        }
        lappend vals [format %02X $v]
        lappend names2 [lindex $names [expr {$r - 32}]]
    }
    if {[llength $vals] == 15} {
        say "LAST VDP COMMAND: [join $names2 { }]"
        say "                   [join $vals { }]"
    }
    if {[catch {set r15 [debug read "VDP regs" 15]} err]} {
        say "R#15 unavailable: $err"
    } else {
        say [format "R#15=%d" $r15]
    }
    # Is the emulated VBlank still alive? Watch S#0 bit7 across ~40 ms.
    set ::fseen 0
    for {set i 0} {$i < 16} {incr i} {
        after time [expr {0.0025 * double($i)}] {
            if {![catch {set s0 [debug read "VDP status" 0]}] && ($s0 & 0x80)} { set ::fseen 1 }
        }
    }
    after time 0.045 {
        say "S#0 bit7 seen in 40ms: $::fseen (1 = VBlank alive)"
        screenshot "$::OUTDIR/test551-gemroute2-freeze.png"
        say "SHOT saved"
        close $::LOG
        after time 0.200 { exit }
    }
    debug cont
}
after time 6.000 { poll }
debug cont
