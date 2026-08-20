# Timing probe for the test551 "tuneladora" boss room.
#
# WHY THIS EXISTS
#   The cell probe (test551_boss_probe2.tcl) answers "does it draw every cell".
#   It cannot answer "why is the game slow", which is the open symptom. This one
#   measures the only thing that matters for that: how long ONE iteration of the
#   bitmap main loop takes in emulated milliseconds, split by whether the boss
#   body was repainted during it.
#
# WHY IT READS THE .sym INSTEAD OF HARDCODING
#   The previous probe carried addresses from an older build and was reading the
#   neighbouring RAM variables without saying so. Addresses move on every code
#   change, so this file resolves them at runtime and REFUSES to run if a symbol
#   is missing. A probe that silently measures the wrong instruction is worse
#   than no probe.
#
# NOTE ON METHOD
#   openMSX breakpoint callbacks do not advance emulated time, so counting with
#   breakpoints does not distort the intervals being measured.

set SYMFILE "C:/Users/salam/AppData/Local/Temp/mideas-test551/test551_boss_claude.sym"
set OUTDIR  "C:/Users/salam/AppData/Local/Temp/mideas-test551"
set LOG [open "$OUTDIR/test551-timing.log" w]
proc say {msg} { global LOG; puts $LOG $msg; flush $LOG }

# ---- resolve symbols -------------------------------------------------------
set SYM [dict create]
set fh [open $SYMFILE r]
set symtext [read $fh]
close $fh
foreach line [split $symtext "\n"] {
    if {[regexp {^([A-Za-z_][A-Za-z0-9_]*): equ ([0-9A-Fa-f]+)H} [string trim $line] -> name hex]} {
        # scan, not expr: a braced `expr {0x$hex}` is a syntax error in Tcl and
        # aborts the whole script before the log has a single line in it.
        scan $hex %x addr
        dict set SYM $name $addr
    }
}
proc sym {name} {
    global SYM
    if {![dict exists $SYM $name]} {
        say "FATAL missing symbol $name"
        error "missing symbol $name"
    }
    return [dict get $SYM $name]
}

set A_loop      [sym bitmap_enter_game_loop]
set A_cells     [sym bitmap_boss_draw_cell_list]
set A_launch    [sym bitmap_boss_launch_cmd]
set A_strips    [sym bitmap_boss_restore_strips]
set R_cmd_buf   [sym boss_cmd_buf]
set R_boss_x    [sym boss_x]
set R_boss_act  [sym boss_active]
set R_screen    [sym current_screen_index]

set A_proj -1
if {[dict exists $SYM bitmap_boss_proj_draw]} { set A_proj [dict get $SYM bitmap_boss_proj_draw] }

say [format "SYMS loop=%04X cells=%04X launch=%04X strips=%04X proj=%04X" \
    $A_loop $A_cells $A_launch $A_strips $A_proj]

# ---- counters --------------------------------------------------------------
set t_prev -1
set iter_ms {}          ;# every main-loop interval, in ms
set iter_body {}        ;# 1 if the body was repainted in that interval
set iter_launch {}      ;# launches issued in that interval
set cur_body 0
set cur_launch 0
set cur_strip 0
set cur_proj 0
set iter_strip {}
set iter_proj {}
set entry_c {}
set proj_ops {}
set op_tally [dict create]
set timp_blocks {}
set armed 0

proc loop_bp {} {
    global t_prev iter_ms iter_body iter_launch iter_strip iter_proj
    global cur_body cur_launch cur_strip cur_proj armed
    if {!$armed} { debug cont ; return }
    set t [machine_info time]
    if {$t_prev >= 0} {
        lappend iter_ms    [expr {($t - $t_prev) * 1000.0}]
        lappend iter_body  $cur_body
        lappend iter_launch $cur_launch
        lappend iter_strip $cur_strip
        lappend iter_proj  $cur_proj
    }
    set t_prev $t
    set cur_body 0
    set cur_launch 0
    set cur_strip 0
    set cur_proj 0
    debug cont
}

proc cells_bp {} {
    global cur_body entry_c
    incr cur_body
    lappend entry_c [reg C]
    debug cont
}

proc launch_bp {} {
    global cur_launch op_tally R_cmd_buf timp_blocks
    incr cur_launch
    # The op byte must be read HERE, at the launch site. Reading it on entry to
    # bitmap_boss_proj_draw returns the op of the PREVIOUS command (the HMMM
    # that bitmap_boss_proj_save just left in the buffer), which is how a probe
    # reports "opaque" for a transparent draw.
    set op [format "%02X" [debug read memory [expr {$R_cmd_buf + 14}]]]
    if {[dict exists $op_tally $op]} {
        dict set op_tally $op [expr {[dict get $op_tally $op] + 1}]
    } else {
        dict set op_tally $op 1
    }
    if {$op eq "98" && [llength $timp_blocks] < 6} {
        proc w {a} { return [expr {[debug read memory $a] | ([debug read memory [expr {$a+1}]] << 8)}] }
        set b $R_cmd_buf
        lappend timp_blocks [format "SX=%d SY=%d -> DX=%d DY=%d NX=%d NY=%d" \
            [w $b] [w [expr {$b+2}]] [w [expr {$b+4}]] [w [expr {$b+6}]] \
            [w [expr {$b+8}]] [w [expr {$b+10}]]]
    }
    debug cont
}

proc strip_bp {} {
    global cur_strip
    incr cur_strip
    debug cont
}

proc proj_bp {} {
    global cur_proj proj_ops R_cmd_buf
    incr cur_proj
    if {[llength $proj_ops] < 8} {
        # op byte lives at boss_cmd_buf+14; #D0 = HMMM opaque, #98 = LMMM+TIMP.
        # The buffer is filled before the routine writes the op, so read it at
        # the launch site instead if this ever shows a stale value.
        lappend proj_ops [format "%02X" [debug read memory [expr {$R_cmd_buf + 14}]]]
    }
    debug cont
}

# ---- summary helpers -------------------------------------------------------
proc summarize {label vals} {
    if {[llength $vals] == 0} { say [format "%-22s n=0" $label] ; return }
    set n [llength $vals]
    set sum 0.0
    set mn [lindex $vals 0]
    set mx [lindex $vals 0]
    foreach v $vals {
        set sum [expr {$sum + $v}]
        if {$v < $mn} { set mn $v }
        if {$v > $mx} { set mx $v }
    }
    set sorted [lsort -real $vals]
    set med [lindex $sorted [expr {$n / 2}]]
    say [format "%-22s n=%-5d mean=%7.2f ms  median=%7.2f  min=%7.2f  max=%7.2f  (=%.1f frames of 16.67)" \
        $label $n [expr {$sum / $n}] $med $mn $mx [expr {$sum / $n / 16.667}]]
}

# ---- schedule --------------------------------------------------------------
# make_test551_boss_fixture removes the Room Lock dialogue for this fight-only
# benchmark. Keep the sample short enough that player death/respawn cannot turn
# its tail into room-transition timing.
after time 6.000 {
    global A_loop A_cells A_launch A_strips A_proj armed R_screen R_boss_act R_boss_x
    debug set_bp $A_loop   {} { loop_bp }
    debug set_bp $A_cells  {} { cells_bp }
    debug set_bp $A_launch {} { launch_bp }
    debug set_bp $A_strips {} { strip_bp }
    if {$A_proj >= 0} { debug set_bp $A_proj {} { proj_bp } }
    set armed 1
    say [format "ARMED at screen=%d boss_active=%d boss_x=%d" \
        [debug read memory $R_screen] [debug read memory $R_boss_act] [debug read memory $R_boss_x]]
    debug cont
}

after time 11.000 {
    global iter_ms iter_body iter_launch iter_strip iter_proj entry_c proj_ops
    global OUTDIR R_screen R_boss_act R_boss_x

    set total 0.0
    foreach v $iter_ms { set total [expr {$total + $v}] }
    set n [llength $iter_ms]
    say ""
    say "================ MAIN LOOP TIMING ================"
    say [format "window: %d iterations over %.3f s  ->  %.2f iterations/second" \
        $n [expr {$total / 1000.0}] [expr {$n / ($total / 1000.0)}]]
    say "(60 = smooth. Anything below ~30 is the reported slowdown.)"
    say ""

    set body_ms {}
    set idle_ms {}
    set body_launch {}
    set proj_only_ms {}
    for {set i 0} {$i < $n} {incr i} {
        set ms [lindex $iter_ms $i]
        if {[lindex $iter_body $i] > 0} {
            lappend body_ms $ms
            lappend body_launch [lindex $iter_launch $i]
        } elseif {[lindex $iter_proj $i] > 0} {
            lappend proj_only_ms $ms
        } else {
            lappend idle_ms $ms
        }
    }
    summarize "ALL iterations"      $iter_ms
    summarize "body repaint frames" $body_ms
    summarize "rock-only frames"    $proj_only_ms
    summarize "no-boss-draw frames" $idle_ms
    say ""
    summarize "launches/body frame" $body_launch
    say ""
    set sum_l 0
    foreach v $iter_launch { incr sum_l $v }
    set sum_s 0
    foreach v $iter_strip { incr sum_s $v }
    set sum_p 0
    foreach v $iter_proj { incr sum_p $v }
    say [format "TOTALS launches=%d restores=%d proj_draws=%d body_repaints=%d" \
        $sum_l $sum_s $sum_p [llength $body_ms]]
    set uniq [lsort -unique $entry_c]
    say "ENTRY C distinct values: $uniq"
    say ""
    say "---- V9938 op bytes actually launched (D0 = HMMM opaque, 98 = LMMM+TIMP) ----"
    foreach op [lsort [dict keys $op_tally]] {
        say [format "  op %s : %d commands" $op [dict get $op_tally $op]]
    }
    say "TIMP command blocks (first 6):"
    foreach blk $timp_blocks { say "  $blk" }
    say [format "STATE screen=%d active=%d x=%d" \
        [debug read memory $R_screen] [debug read memory $R_boss_act] [debug read memory $R_boss_x]]
    screenshot "$OUTDIR/test551-timing.png"
    close $LOG
    after time 0.300 { exit }
}
