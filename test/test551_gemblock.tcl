# Dump every gem VDP command block at launch time while the gemboot fixture
# hangs, plus the staged gem table, so the first corrupt block can be told
# apart from the block that merely got stuck waiting behind it.
#
# bitmap_gem_launch_cmd opens with call vdp_wait_cmd_ready (hang PC lands at
# +3), so when the machine freezes the LAST block already launched is the
# corrupt one and the in-flight launch is the one blocked behind it.
set SYMFILE "C:/Users/salam/AppData/Local/Temp/mideas-test551/test551_boss_claude.sym"
set LOG [open "C:/Users/salam/AppData/Local/Temp/mideas-test551/test551-gemblock.log" w]
proc say {m} { global LOG; puts $LOG $m; flush $LOG }

set SYM [dict create]
set fh [open $SYMFILE r]
set symtext [read $fh]
close $fh
foreach line [split $symtext "\n"] {
    if {[regexp {^([A-Za-z_][A-Za-z0-9_]*): equ ([0-9A-Fa-f]+)H} [string trim $line] -> name hex]} {
        scan $hex %x addr
        dict set SYM $name $addr
    }
}
proc sym {n} { global SYM ; return [dict get $SYM $n] }

set A_launch [sym bitmap_gem_launch_cmd]
set R_block  [sym bitmap_gem_cmd_block]
set R_table  [sym bitmap_gem_table_buf]
set R_staged [sym bitmap_gem_staged_room]
set R_wait   [sym vdp_wait_cmd_ready]

proc word {base off} {
    return [expr {[debug read memory [expr {$base + $off}]] | ([debug read memory [expr {$base + $off + 1}]] << 8)}]
}

set launches 0
proc gem_bp {} {
    global launches R_block R_table
    incr launches
    set b $R_block
    say [format "GEM LAUNCH #%d t=%.3f: SX=%d SY=%d DX=%d DY=%d NX=%d NY=%d ARG=%02X CMD=%02X" \
        $launches [machine_info time] [word $b 0] [word $b 2] [word $b 4] [word $b 6] \
        [word $b 8] [word $b 10] [debug read memory [expr {$b + 12}]] [debug read memory [expr {$b + 14}]]]
    debug cont
}

after time 1.000 {
    global A_launch
    debug set_bp $A_launch {} { gem_bp }
    say [format "ARMED launch=%04X block=%04X table=%04X" $A_launch $R_block $R_table]
    debug cont
}

# The machine hangs with time still advancing (VDP keeps rendering), so this
# still fires: report PC and the staged table at the freeze.
after time 9.000 {
    global R_table R_staged R_wait launches
    set pc [reg PC]
    say [format "AT t=9: PC=%04X (vdp_wait_cmd_ready=%04X) launches=%d staged_room=%d" \
        $pc $R_wait $launches [debug read memory $R_staged]]
    say "STAGED GEM TABLE (first 48 bytes of bitmap_gem_table_buf):"
    set line ""
    for {set i 0} {$i < 48} {incr i} {
        append line [format "%02X " [debug read memory [expr {$R_table + $i}]]]
        if {($i + 1) % 16 == 0} { say "  $line" ; set line "" }
    }
    say "LAST COMMAND BLOCK (15 bytes of bitmap_gem_cmd_block):"
    set line ""
    for {set i 0} {$i < 15} {incr i} {
        append line [format "%02X " [debug read memory [expr {$R_block + $i}]]]
    }
    say "  $line"
    close $LOG
    after time 0.200 { exit }
}
debug cont
