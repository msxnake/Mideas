# PLAYER_IN_SIGHT, ray facing LEFT: does the main loop survive 600 frames?
#
# Question: with a left-facing guard whose X is not a multiple of 16, a free ray
# row and the player left of (X mod 16), does bitmap_enemy_script_cond_player_in_sight
# ever return? Before the fix it spins for ever (sub 16 underflows, the ray wraps
# to the right-hand side and walks the room again), the main loop stops and the
# frame counter of the game stops with it.
#
# What this measures, and why each number is trustworthy:
#   iters   breakpoint on .bitmap_main_loop, the first instruction of every game
#           frame (the loop polls the VDP frame flag with interrupts off, so a
#           stalled enemy update cannot be hiding behind an IRQ-driven loop).
#           Counted from the first pass, over exactly FRAMES emulated frames.
#   shots   breakpoint on bitmap_enemy_bullet_spawn: a FIRE actually executed.
#   pcs     a program-counter sample every 2 ms of emulated time, bucketed by the
#           nearest preceding label of THIS rom's .sym: a hang collapses to a
#           handful of labels inside cond_player_in_sight / bitmap_probe_solid.
#   new_exit  times the carry-exit added by the fix (jp c, ..._true right after the
#           `sub 16` of the left ray) was executed WITH carry set. It is located as
#           .sight_step_left + 7 and only armed when that byte really is a `jp c`
#           (#DA); in a ROM without the fix the byte is `ld b, a` and it stays 0.
#   dump    RAW bytes of the enemy slot, the player, the ray row and the floor
#           row, printed before any verdict, so the instrument is checked
#           against the scenario it claims to run (guard X, facing, free row).
#
# THE VERDICT (last line of the result file, always exactly one):
#   VERDICT PASS
#   VERDICT FAIL: <reason>[; <reason>...]
# "The main loop is alive" is NOT a pass on its own: a guard that is blind
# (the ray answers FALSE, or never reaches the player) also keeps the loop
# alive and used to read as green. A fixture therefore declares what it expects
# and the verdict checks all of it:
#   - the loop is alive (>= 5 passes in the second half of the window),
#   - the shot count satisfies MIDEAS_EXPECT_SHOTS (a FIRE actually executed),
#   - the scenario is the one the fixture claims (guard X, player X, which
#     cells of the ray row are solid), read raw from RAM at frame 60.
# Anything the instrument cannot establish (missing symbol, scenario not as
# claimed, no expectation given) is a FAIL with the word "instrument" in the
# reason, never a pass and never a silent timeout.
#
# Inputs (environment):
#   MIDEAS_SYM            the .sym that matches the ROM being run
#   MIDEAS_OUT            result file
#   MIDEAS_FRAMES         frames to observe (default 600)
#   MIDEAS_LABEL          free text echoed in the header
#   MIDEAS_EXPECT_SHOTS   REQUIRED. Comparison on the shot count: ">=10", "==0", ">0", "<=3", "<5"
#   MIDEAS_EXPECT_GUARD_X guard slot X in px (optional instrument check)
#   MIDEAS_EXPECT_PLAYER_X player_x in px (optional instrument check)
#   MIDEAS_EXPECT_WALL_COL "none" or the ONLY column (0..15) of ray row 10 that
#                         must be solid (optional instrument check)
# run_sight_left_hang.sh fills the four EXPECT_* from the fixture label.
#
# The .sym of THIS build gives every address; none is hardcoded.

proc env_or {name default} {
    if {[info exists ::env($name)] && $::env($name) ne ""} { return $::env($name) }
    return $default
}

set SYM    [env_or MIDEAS_SYM ""]
set OUT    [env_or MIDEAS_OUT "sight_left_hang_result.txt"]
set FRAMES [env_or MIDEAS_FRAMES 600]
set LABEL  [env_or MIDEAS_LABEL "?"]
set EXPECT_SHOTS    [env_or MIDEAS_EXPECT_SHOTS ""]
set EXPECT_GUARD_X  [env_or MIDEAS_EXPECT_GUARD_X ""]
set EXPECT_PLAYER_X [env_or MIDEAS_EXPECT_PLAYER_X ""]
set EXPECT_WALL_COL [env_or MIDEAS_EXPECT_WALL_COL ""]

set LOG [open $OUT w]
proc say {s} { puts $::LOG $s; flush $::LOG }

# The one way out when the instrument itself is broken.
proc fail_instrument {why} {
    say "VERDICT FAIL: instrument: $why"
    close $::LOG
    exit 2
}

# ---- symbols ---------------------------------------------------------------
# Glass writes "name: equ 40C4H" (hex with a trailing H, maybe a leading 0).
array set SYMS {}
set rom_labels {}
if {$SYM eq "" || [catch {open $SYM r} fh]} { fail_instrument "cannot open the .sym (MIDEAS_SYM='$SYM')" }
while {[gets $fh line] >= 0} {
    if {[regexp {^(\S+): equ ([0-9A-Fa-f]+)H\s*$} $line -> name hex]} {
        scan $hex %x value
        set SYMS($name) $value
        if {$value >= 0x4000 && $value < 0x8000} { lappend rom_labels [list $value $name] }
    }
}
close $fh
set rom_labels [lsort -integer -index 0 $rom_labels]

proc sym {name} {
    if {![info exists ::SYMS($name)]} { fail_instrument "missing symbol $name in $::SYM" }
    return $::SYMS($name)
}

proc label_for {pc} {
    set best "?"
    foreach entry $::rom_labels {
        if {[lindex $entry 0] > $pc} { break }
        set best [lindex $entry 1]
    }
    return $best
}

set A_LOOP    [sym .bitmap_main_loop]
set A_SPAWN   [sym bitmap_enemy_bullet_spawn]
set A_POOL    [sym bitmap_enemy_pool]
set A_COUNT   [sym bitmap_enemy_count]
set A_BULLETS [sym bitmap_enemy_bullet_pool]
set A_COLMAP  [sym bitmap_room_collision_map]
set A_PLX     [sym player_x]
set A_PLY     [sym player_y]
set A_SIGHT   [sym bitmap_enemy_script_cond_player_in_sight]
set A_STEP    [sym .sight_step_left]
set STRIDE    30

proc rb {a} { return [debug read memory $a] }
proc hexrow {base n} {
    set parts {}
    for {set i 0} {$i < $n} {incr i} { lappend parts [format %02X [rb [expr {$base + $i}]]] }
    return [join $parts " "]
}

say "label=$LABEL frames=$FRAMES sym=$SYM"
say [format "loop=%04X spawn=%04X in_sight=%04X pool=%04X bullets=%04X colmap=%04X player_x=%04X player_y=%04X" \
    $A_LOOP $A_SPAWN $A_SIGHT $A_POOL $A_BULLETS $A_COLMAP $A_PLX $A_PLY]

# ---- counters --------------------------------------------------------------
set iters 0
set shots 0
set frame 0
set t0 -1
set iters_at_half 0
set iters_base 0
set new_exit 0
set have_new 0
set maxActive 0
array set pcHist {}
set pcSamples 0
set finished 0

debug set_bp $A_LOOP {} { incr ::iters }
debug set_bp $A_SPAWN {} { incr ::shots }

proc sample_pc {} {
    if {$::finished || $::t0 < 0} { after time 0.002 sample_pc; return }
    set pc [reg PC]
    if {[info exists ::pcHist($pc)]} { incr ::pcHist($pc) } else { set ::pcHist($pc) 1 }
    incr ::pcSamples
    after time 0.002 sample_pc
}

proc active_bullets {} {
    set n 0
    for {set i 0} {$i < 2} {incr i} {
        if {[rb [expr {$::A_BULLETS + $i * 4}]] != 0} { incr n }
    }
    return $n
}

proc dump_instrument {tag} {
    say "-- $tag (frame $::frame, iters $::iters)"
    say "enemy_count   = [rb $::A_COUNT]"
    say "slot0 raw (30): [hexrow $::A_POOL 30]"
    say "slot1 raw (30): [hexrow [expr {$::A_POOL + $::STRIDE}] 30]"
    say "               x  y  dx dy minX maxX minY maxY ... (+24 prog, +25 state, +26 timer)"
    say [format "slot0 x=%d y=%d dx=%02X  minX=%d maxX=%d  state=%d timer=%d" \
        [rb $::A_POOL] [rb [expr {$::A_POOL + 1}]] [rb [expr {$::A_POOL + 2}]] \
        [rb [expr {$::A_POOL + 4}]] [rb [expr {$::A_POOL + 5}]] \
        [rb [expr {$::A_POOL + 25}]] [rb [expr {$::A_POOL + 26}]]]
    say [format "player x=%d y=%d" [rb $::A_PLX] [rb $::A_PLY]]
    say "ray row 10 (cells 0..15): [hexrow [expr {$::A_COLMAP + 160}] 16]"
    say "floor row 11            : [hexrow [expr {$::A_COLMAP + 176}] 16]"
}

# What the scenario really is at frame 60, read raw from RAM (not from the fixture).
set seen_guard_x -1
set seen_player_x -1
set seen_ray_row {}
proc capture_scenario {} {
    set ::seen_guard_x [rb $::A_POOL]
    set ::seen_player_x [rb $::A_PLX]
    set row {}
    for {set i 0} {$i < 16} {incr i} { lappend row [rb [expr {$::A_COLMAP + 160 + $i}]] }
    set ::seen_ray_row $row
}

# Everything the instrument can establish about the scenario, as a list of reasons it is NOT the one claimed.
proc scenario_problems {} {
    set bad {}
    if {$::EXPECT_GUARD_X ne "" && $::seen_guard_x != $::EXPECT_GUARD_X} {
        lappend bad "guard x=$::seen_guard_x, fixture claims $::EXPECT_GUARD_X"
    }
    if {$::EXPECT_PLAYER_X ne "" && $::seen_player_x != $::EXPECT_PLAYER_X} {
        lappend bad "player x=$::seen_player_x, fixture claims $::EXPECT_PLAYER_X"
    }
    if {$::EXPECT_WALL_COL ne ""} {
        set solid {}
        for {set i 0} {$i < 16} {incr i} { if {[lindex $::seen_ray_row $i] != 0} { lappend solid $i } }
        set want [expr {$::EXPECT_WALL_COL eq "none" ? {} : [list $::EXPECT_WALL_COL]}]
        if {$solid ne $want} {
            lappend bad "solid columns of the ray row = {$solid}, fixture claims {$want}"
        }
    }
    return $bad
}

proc on_frame {} {
    incr ::frame
    if {$::t0 < 0} {
        # Never reached the game loop: say so instead of waiting for the wall-clock kill.
        if {$::frame > 2400} { fail_instrument "the main loop was not reached in 2400 frames" }
        if {$::iters >= 1} {
            set ::t0 $::frame
            set ::iters_base $::iters
            say "main loop first seen at emulator frame $::frame"
            # The cartridge is only mapped now, so this is the first moment the
            # opcode can be read. ld b,a = #47 (no fix); jp c,nn = #DA (fix).
            set ::A_NEW [expr {$::A_STEP + 7}]
            set op [rb $::A_NEW]
            set what "not a jp c: no carry exit in this ROM"
            if {$op == 0xDA} { set what "jp c: carry exit present" }
            say [format "byte at .sight_step_left+7 (%04X) = %02X (%s)" $::A_NEW $op $what]
            if {$op == 0xDA} {
                set ::have_new 1
                debug set_bp $::A_NEW {[expr {[reg F] & 1}]} { incr ::new_exit }
            }
        }
        after frame on_frame
        return
    }
    set k [expr {$::frame - $::t0}]
    set a [active_bullets]
    if {$a > $::maxActive} { set ::maxActive $a }
    if {$k == 60} { dump_instrument "instrument check"; capture_scenario }
    if {$k == [expr {$::FRAMES / 2}]} { set ::iters_at_half $::iters }
    if {$k % 100 == 0} {
        say [format "k=%4d iters=%5d shots=%3d activeBullets=%d pc=%04X (%s)" \
            $k [expr {$::iters - $::iters_base}] $::shots $a [reg PC] [label_for [reg PC]]]
    }
    if {$k >= $::FRAMES} { finish; return }
    after frame on_frame
}

proc finish {} {
    set ::finished 1
    set total [expr {$::iters - $::iters_base}]
    set second [expr {$::iters - $::iters_at_half}]
    dump_instrument "final"
    # Bucket the PC samples by label.
    array set byLabel {}
    foreach pc [array names ::pcHist] {
        set l [label_for $pc]
        if {[info exists byLabel($l)]} { incr byLabel($l) $::pcHist($pc) } else { set byLabel($l) $::pcHist($pc) }
    }
    set rows {}
    foreach l [array names byLabel] { lappend rows [list $byLabel($l) $l] }
    set rows [lsort -integer -decreasing -index 0 $rows]
    say "-- PC histogram: $::pcSamples samples, [array size ::pcHist] distinct PCs, [array size byLabel] labels"
    set shown 0
    foreach r $rows {
        say [format "  %5d  %5.1f%%  %s" [lindex $r 0] [expr {100.0 * [lindex $r 0] / $::pcSamples}] [lindex $r 1]]
        incr shown
        if {$shown >= 8} { break }
    }
    set inSight 0
    foreach r $rows {
        set l [lindex $r 1]
        if {[string match "*cond_player_in_sight*" $l] || [string match ".sight*" $l] || $l eq "bitmap_probe_solid" || [string match ".probe_*" $l]} {
            incr inSight [lindex $r 0]
        }
    }
    set pct [expr {$::pcSamples > 0 ? 100.0 * $inSight / $::pcSamples : 0.0}]
    say [format "RESULT frames=%d iters=%d iters_second_half=%d shots=%d maxActiveBullets=%d pc_in_sight_or_probe=%.1f%% carry_exit_armed=%d carry_exit_taken=%d" \
        $::FRAMES $total $second $::shots $::maxActive $pct $::have_new $::new_exit]
    # Diagnostic only; the VERDICT line below is the single judgement.
    if {$second < 5} {
        say "LOOP HUNG (main loop stopped: $second iterations in the second half of the window)"
    } else {
        say "LOOP RUNNING ($total iterations in $::FRAMES frames)"
    }
    set why {}
    set instrument_bad [scenario_problems]
    if {$::EXPECT_SHOTS eq ""} {
        lappend instrument_bad "no expectation given (MIDEAS_EXPECT_SHOTS is empty): refusing to call a live loop a pass"
    } elseif {![regexp {^(>=|<=|==|>|<)([0-9]+)$} $::EXPECT_SHOTS -> op want]} {
        lappend instrument_bad "unparsable MIDEAS_EXPECT_SHOTS '$::EXPECT_SHOTS'"
    }
    foreach b $instrument_bad { lappend why "instrument: $b" }
    if {$second < 5} { lappend why "main loop hung ($second passes in the second half of $::FRAMES frames, $::shots shots)" }
    if {[info exists op] && ![expr "$::shots $op $want"]} {
        lappend why "shots=$::shots, expected $::EXPECT_SHOTS in $::FRAMES frames"
    }
    if {[llength $why]} {
        say "VERDICT FAIL: [join $why {; }]"
    } else {
        say "VERDICT PASS"
    }
    close $::LOG
    exit
}

after time 0.002 sample_pc
after frame on_frame
