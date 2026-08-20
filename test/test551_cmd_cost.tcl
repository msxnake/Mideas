# Per-command cost of the V9938 blits the boss issues, measured, plus the live
# hardware-sprite budget of the boss room.
#
# WHY
#   Deciding between "rock as bitmap" and "rock as hardware sprite" needs two
#   numbers this project does not have yet:
#     1. what ONE boss command actually costs at the launch site, by op byte --
#        including the wait for the previous command, which is the part that
#        blocks the Z80;
#     2. how many sprites are really live in the boss room and on which lines,
#        because the sprite option is only free if it fits under the 8-per-line
#        wall of SCREEN 5.
#   Both are measurements. The first is taken as the delta between consecutive
#   launches inside one burst; a launch that follows a long gap is discarded,
#   since that delta would be mostly idle time, not command time.
#
# The SAT is in VRAM, not RAM: sprite mode 2 keeps its tables at F400 (colours),
# F600 (attributes) and F800 (patterns). Reading 0xF600 as RAM returns zeros and
# makes every slot look like a live sprite parked on line 0 -- which is exactly
# the wrong answer to "is there room for one more sprite".
# Attribute entry = y, x, pattern, early-clock. y = 216 marks an unused sprite.

set SYMFILE "C:/Users/salam/AppData/Local/Temp/mideas-test551/test551_boss_claude.sym"
set OUTDIR  "C:/Users/salam/AppData/Local/Temp/mideas-test551"
set SAT     0xF600
set LOG [open "$OUTDIR/test551-cmd-cost.log" w]
proc say {msg} { global LOG; puts $LOG $msg; flush $LOG }

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
proc sym {name} {
    global SYM
    if {![dict exists $SYM $name]} { say "FATAL missing symbol $name" ; error "missing $name" }
    return [dict get $SYM $name]
}

set A_launch  [sym bitmap_boss_launch_cmd]
set R_cmd_buf [sym boss_cmd_buf]
set R_proj_on [sym boss_proj_active]

set t_last -1
set key_last ""
set cost [dict create]      ;# op/size -> list of ms deltas
set orphan [dict create]    ;# op/size -> times no successor was close enough

proc launch_bp {} {
    global t_last key_last cost orphan R_cmd_buf
    set t [machine_info time]
    set op [format "%02X" [debug read memory [expr {$R_cmd_buf + 14}]]]
    set nx [expr {[debug read memory [expr {$R_cmd_buf + 8}]] | ([debug read memory [expr {$R_cmd_buf + 9}]] << 8)}]
    set ny [expr {[debug read memory [expr {$R_cmd_buf + 10}]] | ([debug read memory [expr {$R_cmd_buf + 11}]] << 8)}]
    set key "$op ${nx}x${ny}"
    # ATTRIBUTION: the wait at the head of launch N is waiting for command N-1
    # to finish, so the interval N-1 -> N is the cost of N-1, NOT of N. Charging
    # it to N reports the cost of whatever ran before each command, which is how
    # the transparent rock draw first came out looking CHEAPER than the opaque
    # copies around it.
    if {$t_last >= 0 && $key_last ne ""} {
        set dt [expr {($t - $t_last) * 1000.0}]
        # 5 ms is far more than any single command here; a larger gap means the
        # next launch is in another burst and the delta is mostly idle time.
        if {$dt < 5.0} {
            if {![dict exists $cost $key_last]} { dict set cost $key_last {} }
            dict set cost $key_last [linsert [dict get $cost $key_last] end $dt]
        } else {
            if {![dict exists $orphan $key_last]} { dict set orphan $key_last 0 }
            dict set orphan $key_last [expr {[dict get $orphan $key_last] + 1}]
        }
    }
    set t_last $t
    set key_last $key
    debug cont
}

# ---- split the interval into "blocked waiting for the VDP" and "Z80 work" ----
# bitmap_boss_launch_cmd opens with `call vdp_wait_cmd_ready` (3 bytes), so the
# instruction right after it is the moment the command engine went free. The
# delta from the routine's entry to that point is pure blocked time; the rest,
# up to the next launch, is Z80 work (reinit pointer, OTIR of 15 bytes, R#15).
# This is the number that decides how many cells a non-blocking pump could
# issue per frame, and it cannot be inferred from the totals.
set t_enter -1
set wait_ms {}
set work_ms {}
set t_free -1

proc enter_bp {} {
    global t_enter
    set t_enter [machine_info time]
    debug cont
}

proc free_bp {} {
    global t_enter wait_ms t_free
    set t [machine_info time]
    if {$t_enter >= 0} {
        set dt [expr {($t - $t_enter) * 1000.0}]
        if {$dt < 5.0} { lappend wait_ms $dt }
    }
    set t_free $t
    debug cont
}

after time 6.000 {
    global A_launch
    debug set_bp $A_launch {} { launch_bp }
    debug set_bp $A_launch {} { enter_bp }
    debug set_bp [expr {$A_launch + 3}] {} { free_bp }
    say "ARMED"
    debug cont
}

after time 16.000 {
    global cost orphan SAT R_proj_on
    say ""
    say "---- measured cost per launched command (interval charged to the command that was RUNNING) ----"
    say "op/size            n      mean ms   median   min     max"
    foreach key [lsort [dict keys $cost]] {
        set vals [dict get $cost $key]
        set n [llength $vals]
        if {$n == 0} { continue }
        set sum 0.0
        set mn [lindex $vals 0]
        set mx [lindex $vals 0]
        foreach v $vals {
            set sum [expr {$sum + $v}]
            if {$v < $mn} { set mn $v }
            if {$v > $mx} { set mx $v }
        }
        set sorted [lsort -real $vals]
        say [format "%-16s %-6d %8.3f %8.3f %7.3f %7.3f" \
            $key $n [expr {$sum / $n}] [lindex $sorted [expr {$n / 2}]] $mn $mx]
    }
    say ""
    if {[llength $wait_ms] > 0} {
        set n [llength $wait_ms]
        set sum 0.0
        set mx 0.0
        foreach v $wait_ms { set sum [expr {$sum + $v}] ; if {$v > $mx} { set mx $v } }
        set sorted [lsort -real $wait_ms]
        say [format "BLOCKED waiting for command engine: n=%d mean=%.3f ms median=%.3f max=%.3f" \
            $n [expr {$sum / $n}] [lindex $sorted [expr {$n / 2}]] $mx]
        say "  (Z80 work per command = interval above minus this. That difference is"
        say "   what a non-blocking pump would still have to pay per cell.)"
    }
    say ""
    say "commands with NO close successor (their own duration is NOT measured here):"
    foreach key [lsort [dict keys $orphan]] {
        say [format "  %-16s %d times" $key [dict get $orphan $key]]
    }

    say ""
    say "---- hardware sprite budget in the boss room (SAT shadow at 0xF600) ----"
    say [format "rock live at sample time: %d" [debug read memory $R_proj_on]]
    set live 0
    set lines [dict create]
    for {set i 0} {$i < 32} {incr i} {
        set base [expr {$SAT + $i * 4}]
        set y [debug read VRAM $base]
        # y = 216 is the end-of-table marker in sprite mode 2: everything after
        # it is not displayed at all, so stop rather than skip.
        if {$y == 216} { say [format "  slot %2d  y=216 END-OF-TABLE marker (slots %d..31 are not displayed)" $i $i] ; break }
        # This project parks unused sprites below the visible area.
        if {$y >= 212} { continue }
        incr live
        set x [debug read VRAM [expr {$base + 1}]]
        set pat [debug read VRAM [expr {$base + 2}]]
        set col [debug read VRAM [expr {$base + 3}]]
        say [format "  slot %2d  y=%3d x=%3d pattern=%3d colour=%02X" $i $y $x $pat $col]
        # A 16x16 sprite covers y..y+15; tally how many sprites touch each line.
        for {set l $y} {$l < $y + 16} {incr l} {
            if {$l < 0 || $l > 211} { continue }
            if {[dict exists $lines $l]} {
                dict set lines $l [expr {[dict get $lines $l] + 1}]
            } else {
                dict set lines $l 1
            }
        }
    }
    set worst 0
    set worst_line -1
    foreach l [dict keys $lines] {
        if {[dict get $lines $l] > $worst} { set worst [dict get $lines $l] ; set worst_line $l }
    }
    say [format "LIVE SPRITES: %d of 32.  Worst line: %d sprites on line %d (SCREEN 5 wall = 8)." \
        $live $worst $worst_line]
    close $LOG
    after time 0.300 { exit }
}
