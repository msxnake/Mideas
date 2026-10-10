# Pursuer soldier: the TERRAIN BODY of the enemy interpreter (the complete-body engine fed with the soldier's resident descriptor
# 03 03 08 1C = the player's 9x29 hitbox inside the 16x32 sprite) and ANIM_CLIP.
#
# One OpenMSX run = one case against one ROM (make_pursuer_alert_lab.mjs / make_pursuer_tall_lab.mjs, boot through the WorldLink):
#   stand  the alert lab, start A: walk east into B, step away, wait. The soldier comes out at the player's entry height (y = 144) and
#          walks east. For 120 samples its y must NOT move: a 16x16 interpreter sank it 16 px into the floor (y = 160), and a body
#          taken from the complete 16x32 sprite stands at 144 as well, which is why the other cases carry the geometry.
#   ledge  the soldier appears on a ledge (y = 128, ground at 160), walks EAST off it and lands on the floor. After landing y+32 must be
#          the top of the ground (read from bitmap_room_collision_map in RAM) for >= 30 consecutive samples. It starts falling at x = 61
#          exactly: walking east the LEFT foot (x+3) is the last one over the ledge.
#   ledgeleft  the mirror image: a ledge on the east side (ground from x = 160), the soldier walks east to the wall, turns and walks WEST
#          off the ledge. Walking west the RIGHT foot (x+11) is the last one over the ledge, so it starts falling at x = 148 exactly.
#          A body with only its left foot (x+3) would fall at x = 156, one with the whole 16 px sprite at x = 145: only this case sees them.
#   t744   (a project derived from test744 that boots into the alert room "Area51-test", soldier of 8 hardware slots; its behaviour walks, turns,
#          idles, looks up and JUMPS under a low ceiling) the soldier on the real floor: whenever it is not in its Jump state y is 144 and
#          y+32 is the top of the ground (176), never lower; while it jumps it never goes below 144; every one of its slots carries the
#          descriptor 03 03 08 1C; no pixel of the 9x29 body is ever inside a solid pixel of the room (8x8 shapes included); and the second
#          cell of the sprite stays 16 px under the first.
#   wall   a ONE-CELL block on the floor. In EVERY sample none of the six corners of the hitbox (x+3 / x+11 by y+3 / y+17 / y+31) may be
#          inside a solid cell (collision map read from RAM), and the soldier must really reach the block and turn away from it.
#   ceiling a slab over a 32 px corridor leaves the soldier 3 px of headroom (the top row of its hitbox is y+3, the slab ends at y 143). It
#          jumps over and over: it must stop at y = 141 EXACTLY (the head row y+2 of the tall probe), and no corner of the hitbox may ever
#          be inside the slab. One row less or one row more in that probe is a 1 px error this case sees.
#   clip   the soldier stands and runs a loop of ANIM_CLIP states (test/msx2-pursuer/make_pursuer_tall_lab.mjs --case clip writes the
#          clip table next to the project, MIDEAS_CLIPS points at it). In EVERY frame the leader and the follower must show a frame
#          inside the clip of the current state, held clips must hold, cycles must cycle, and the sprite attribute table in VRAM must
#          show exactly the frame the pool holds (no frame outside the clip is ever displayed, not for a single video frame).
#
# What is measured, and why it can be trusted:
#   sample   one hit of the breakpoint on bitmap_update_enemy_sat per pass of the main loop: the SAT writer reads the pool BEFORE this
#            frame's bitmap_update_enemies runs, so the pool at that instant IS what the video shows this frame. The probe counts
#            the main-loop passes between two samples and fails when it is not exactly one (a skipped frame is a hole in "every frame").
#   SAT      the VRAM attribute table is read back at the START of the next pass of the main loop, i.e. after the SAT writer finished
#            and before it writes again, and compared with the pool of the sample before. The pattern number a pool frame must show is
#            NOT assumed linear any more (the pattern compaction shares identical planes between frames): it is decoded from the
#            writer's own code at .sat_slot_N_pat (opcodes verified) plus the frame/facing map in RAM, exactly what the writer reads.
#   Every address comes from the .sym of THIS rom (MIDEAS_SYM); a missing symbol is "FAIL instrument", never a guess.
#
# Verdict lines: "CHECK name=... PASS|FAIL detail" and one "RESULT case=<c> PASS|FAIL". Environment:
#   MIDEAS_SYM  .sym of the ROM    MIDEAS_OUT  result file    MIDEAS_CASE  stand|ledge|ledgeleft|wall|ceiling|clip|t744    MIDEAS_CLIPS  clip table (clip case)
#   MIDEAS_MAX_FRAMES (default 1500)    MIDEAS_GUARD (default 32)

proc env_or {name default} {
    if {[info exists ::env($name)] && $::env($name) ne ""} { return $::env($name) }
    return $default
}
set SYM   [env_or MIDEAS_SYM ""]
set OUT   [env_or MIDEAS_OUT "pursuer_tall_probe_result.txt"]
set CASE  [env_or MIDEAS_CASE stand]
set MAXF  [env_or MIDEAS_MAX_FRAMES 1500]
set GUARD [env_or MIDEAS_GUARD 32]
set CLIPS [env_or MIDEAS_CLIPS ""]

set LOG [open $OUT w]
set throttle off
proc say {s} { puts $::LOG $s; flush $::LOG }
proc finish_now {} { close $::LOG; exit }
proc fail_instrument {msg} {
    say "CHECK name=instrument FAIL $msg"
    say "RESULT case=$::CASE FAIL (instrument)"
    finish_now
}

array set SYMS {}
if {$SYM eq "" || [catch {set fh [open $SYM r]}]} { fail_instrument "cannot open sym file '$SYM'" }
while {[gets $fh line] >= 0} {
    if {[regexp {^(\S+): equ ([0-9A-Fa-f]+)H\s*$} $line -> name hex]} { scan $hex %x v; set SYMS($name) $v }
}
close $fh
proc sym {name} {
    if {![info exists ::SYMS($name)]} { fail_instrument "missing symbol $name in $::SYM" }
    return $::SYMS($name)
}
set A_POOL     [sym bitmap_enemy_pool]
set A_SCREEN   [sym current_screen_index]
set A_PX       [sym player_x]
set A_PY       [sym player_y]
set A_INVULN   [sym player_invuln]
set A_STATE    [sym bitmap_pursuer_state]
set A_ENTRY_X  [sym bitmap_pursuer_entry_x]
set A_ENTRY_Y  [sym bitmap_pursuer_entry_y]
set A_SATW     [sym bitmap_update_enemy_sat]
set A_LOOP     [sym .bitmap_main_loop]
set A_WAIT     [sym bitmap_wait_vblank]
set A_COLMAP   [sym bitmap_room_collision_map]
set A_BEHMAP   [sym bitmap_room_behavior_map]
set A_BODYDESC [sym bitmap_enemy_sprite_body_bounds]
set A_CLIPOFS  [sym bitmap_enemy_script_clip_ofs]
set STRIDE     [sym BITMAP_PURSUER_POOL_STRIDE]
set NSLOTS     [sym BITMAP_PURSUER_SLOTS]
set F_X 0
set F_Y 1
set F_DX 2
set F_FRAME 9
set F_FRAMES 10
set F_COLOROFF 12
set F_MODE 13
set F_STATE [expr {$A_CLIPOFS - 5}]   ;# program, state, timer, velocity, shield, hit, clip: the state is five bytes before the clip byte
set MODE_SCRIPTED 14
set MODE_FOLLOWER 15

proc rb {a} { return [debug read memory $a] }
proc key {row mask down} { if {$down} { keymatrixdown $row $mask } else { keymatrixup $row $mask } }
proc tapspace {} { keymatrixdown 8 0x01; after time 0.15 { keymatrixup 8 0x01 } }
set keyR 0
set keyL 0
proc setkeys {r l} {
    if {$r != $::keyR} { key 8 0x80 $r; set ::keyR $r }
    if {$l != $::keyL} { key 8 0x10 $l; set ::keyL $l }
}
proc slot {i field} { return [rb [expr {$::A_POOL + $i * $::STRIDE + $field}]] }
proc iabs {v} { return [expr {$v < 0 ? -$v : $v}] }
proc soldier_out {} { return [expr {[slot 0 $::F_MODE] == $::MODE_SCRIPTED && [slot 1 $::F_MODE] == $::MODE_FOLLOWER}] }
proc cell {r c} { return [rb [expr {$::A_COLMAP + $r * 16 + $c}]] }
# A pixel is solid when its cell has the Solid bit (0x10) and, when the cell carries a shape (HAS_SHAPE 0x01), the pixel lies in a solid 8x8
# quadrant of the mask kept in the HIGH nibble of the behaviour byte (bit4 TL, bit5 TR, bit6 BL, bit7 BR; an empty nibble = the whole cell).
proc solid_px {px py} {
    if {$py < 0 || $py >= 192 || $px < 0 || $px > 255} { return 1 }
    set idx [expr {(($py >> 4) << 4) + ($px >> 4)}]
    set v [rb [expr {$::A_COLMAP + $idx}]]
    if {($v & 0x10) == 0} { return 0 }
    if {($v & 0x01) == 0} { return 1 }
    set mask [expr {[rb [expr {$::A_BEHMAP + $idx}]] & 0xF0}]
    if {$mask == 0} { return 1 }
    set quad [expr {((($py & 8) ? 2 : 0) | (($px & 8) ? 1 : 0))}]
    return [expr {($mask & (0x10 << $quad)) != 0}]
}
# first solid row under the two feet at or below the row of pixel row y+32: where the ground really is
proc ground_top {x y} {
    # the first pixel row at or under y+32 where one of the two feet columns (x+3, x+11) meets a solid pixel
    for {set py [expr {$y + 32}]} {$py < 192} {incr py} {
        if {[solid_px [expr {$x + 3}] $py] || [solid_px [expr {$x + 11}] $py]} { return $py }
    }
    return 192
}

# The resident 4-byte descriptor (left, top, width-1, height-1; hex) the engine loads for pool slot i: bitmap_enemy_sprite_body_bounds[4 * colorOff].
proc descriptor_of {i} {
    set a [expr {$::A_BODYDESC + 4 * [slot $i $::F_COLOROFF]}]
    return [format "%02X%02X%02X%02X" [rb $a] [rb [expr {$a + 1}]] [rb [expr {$a + 2}]] [rb [expr {$a + 3}]]]
}
set desc_leader ""
set desc_follower ""
set desc_all {}      ;# descriptor of EVERY slot of the soldier (BITMAP_PURSUER_SLOTS of them)

say "case=$CASE guard=$GUARD stride=$STRIDE slots=$NSLOTS state_ofs=$F_STATE clip_ofs=$A_CLIPOFS sym=$SYM"
say [format "loop=%04X satw=%04X pool=%04X bodydesc=%04X" $A_LOOP $A_SATW $A_POOL $A_BODYDESC]

set iters 0
set n 0
set started 0
set checked 0
set last_iters -1
set skipped 0
set phase 0
set phase_n 0
set entry_x -1
set entry_y -1
set checks_failed 0
set done 0
set sat_pending {}      ;# per-sample record waiting for the SAT readback at the next loop pass
set foreign_hits 0      ;# calls of bitmap_update_enemy_sat from outside the main loop (not samples)

proc check {name ok detail} {
    if {!$ok} { incr ::checks_failed }
    say [format "CHECK name=%s %s %s" $name [expr {$ok ? "PASS" : "FAIL"}] $detail]
}

proc check_instrument {} {
    set b0 [rb $::A_LOOP]
    set target [expr {[rb [expr {$::A_LOOP + 1}]] + 256 * [rb [expr {$::A_LOOP + 2}]]}]
    if {$b0 != 0xCD || $target != $::A_WAIT} {
        fail_instrument [format "%04X is not 'call bitmap_wait_vblank' (bytes %02X -> %04X)" $::A_LOOP $b0 $target]
    }
    set sp [reg SP]
    set ret [expr {[rb $sp] + 256 * [rb [expr {$sp + 1}]]}]
    set op [rb [expr {$ret - 3}]]
    set to [expr {[rb [expr {$ret - 2}]] + 256 * [rb [expr {$ret - 1}]]}]
    if {$op != 0xCD || $to != $::A_SATW || $ret < $::A_LOOP || $ret > $::A_LOOP + 120} {
        fail_instrument [format "bitmap_update_enemy_sat was not reached by a call of the main loop (ret %04X, bytes %02X -> %04X)" $ret $op $to]
    }
    set kinds {}
    for {set i 0} {$i < 192} {incr i} {
        set v [rb [expr {$::A_COLMAP + $i}]]
        if {[lsearch -exact $kinds $v] < 0} { lappend kinds $v }
        if {$::CASE ne "t744" && $v != 0 && $v != 16} { fail_instrument "collision map byte $i is $v: this probe only knows empty (0) and solid (16) cells" }
        # the real project may carry 8x8 shapes (0x11) but nothing else this probe could misjudge (one-way platforms, destructibles, deadly cells)
        if {$::CASE eq "t744" && $v != 0 && $v != 16 && $v != 17} { fail_instrument "collision map byte $i is $v: the t744 case knows empty (0), solid (16) and solid with an 8x8 shape (17) only" }
    }
    set ::checked 1
    say [format "instrument OK: main loop at %04X, call bitmap_update_enemy_sat at %04X, collision map bytes seen: %s" $::A_LOOP [expr {$ret - 3}] [lsort -integer $kinds]]
}

# ---- breakpoints -----------------------------------------------------------------------------------------------------------------
debug set_bp $A_LOOP {} { incr ::iters; on_loop }
debug set_bp $A_SATW {} { on_sample }

set boot_n 0
proc boot_tick {} {
    if {$::started} { return }
    incr ::boot_n
    tapspace
    if {$::boot_n > 100} { say "RESULT case=$::CASE FAIL (game loop never reached)"; finish_now }
    after time 1.2 boot_tick
}
after time 1.0 boot_tick

# ---- per-case recorders --------------------------------------------------------------------------------------------------------------
set rec {}           ;# per sample after the soldier is out: dict-like list {n iters lx ly lf fx fy ff dx state}
set out_n -1
set far_done 0

proc dist_far {} {
    if {$::entry_x < 0} { return 0 }
    set dx [iabs [expr {[rb $::A_PX] - $::entry_x}]]
    set dy [iabs [expr {[rb $::A_PY] - $::entry_y}]]
    return [expr {$dx >= $::GUARD || $dy >= $::GUARD}]
}

# The main-loop hook: reads back the SAT of the sample before (the writer has finished, nothing has rewritten it yet).
proc on_loop {} {
    if {$::done || !$::started || $::sat_pending eq ""} { return }
    sat_readback
}

# ---- the sample -------------------------------------------------------------------------------------------------------------------------
proc on_sample {} {
    if {$::done} { return }
    # bitmap_update_enemy_sat is also called outside the main loop (the room loaders publish a SAT): only the calls of the loop are samples
    set sp [reg SP]
    set ret [expr {[rb $sp] + 256 * [rb [expr {$sp + 1}]]}]
    if {$ret < $::A_LOOP || $ret > $::A_LOOP + 120} { incr ::foreign_hits; return }
    if {!$::checked} { check_instrument; set ::started 1 }
    incr ::n
    if {$::last_iters >= 0 && ($::iters - $::last_iters) != 1} { incr ::skipped }
    set ::last_iters $::iters
    if {$::n % 20 == 0} { debug write memory [sym player_health] 5; debug write memory [sym player_lives] 9 }
    debug write memory $::A_INVULN 255      ;# the soldier walks through the player: contact is not what this probe measures
    if {$::n > $::MAXF} { conclude "timeout after $::MAXF samples (phase $::phase)"; return }

    # the entry point of the alert room: the first sample with the countdown armed
    if {$::entry_x < 0 && [rb $::A_STATE] == 1} {
        set ::entry_x [rb $::A_ENTRY_X]
        set ::entry_y [rb $::A_ENTRY_Y]
        say "entry point of the soldier: ($::entry_x,$::entry_y) at sample $::n screen [rb $::A_SCREEN]"
    }
    switch $::CASE {
        stand { drive_stand }
        default { drive_boot_alert }
    }
    if {$::out_n < 0 && [soldier_out]} {
        set ::out_n $::n
        set ::phase 20
        setkeys 0 0
        set ::desc_leader [descriptor_of 0]
        set ::desc_follower [descriptor_of 1]
        for {set di 0} {$di < $::NSLOTS} {incr di} { lappend ::desc_all [descriptor_of $di] }
        say [format "soldier out at sample %d: leader=(%d,%d) follower=(%d,%d) player=(%d,%d) descriptors leader=%s follower=%s" $::n [slot 0 $::F_X] [slot 0 $::F_Y] [slot 1 $::F_X] [slot 1 $::F_Y] [rb $::A_PX] [rb $::A_PY] $::desc_leader $::desc_follower]
    }
    if {$::out_n >= 0} { record_and_judge }
}

# stand: A -> B (east), then away from the door
proc drive_stand {} {
    switch $::phase {
        0 { if {$::n >= 30} { set ::phase 1; set ::phase_n $::n } }
        1 { setkeys 1 0
            if {$::entry_x >= 0} { set ::phase 2 } }
        2 { setkeys 1 0
            if {[dist_far]} { setkeys 0 0; set ::phase 3 } }
        3 { setkeys 0 0 }
    }
}
# ledge / wall / clip: the start room is the alert room (WorldLink boot arms the countdown); step away from the door
proc drive_boot_alert {} {
    switch $::phase {
        0 { if {$::n >= 5} { set ::phase 2 } }
        2 { if {$::entry_x >= 0} { setkeys 1 0 }
            if {$::entry_x >= 0 && [dist_far]} { setkeys 0 0; set ::phase 3 } }
        3 { setkeys 0 0 }
    }
}

# ---- judge ------------------------------------------------------------------------------------------------------------------------------
set leader_ys {}
set follower_ys {}
set leader_xs {}
set stand_done 0
# ledge
set ledge_y0 -1
set ledge_stand 0
set ledge_fall_start -1
set ledge_fall_x -1
set ledge_fall_dir 0
set ledge_land_n -1
set ledge_land_y -1
set ledge_checked 0
set ledge_bad {}
set ledge_prev_y -1
set ledge_still 0
# wall
set wall_viol {}
set wall_max_x 0
set wall_min_x 999
set wall_turns 0
set wall_prev_dir -1
set wall_samples 0
# ceiling
set ceil_min_y 999
set ceil_max_y 0
set ceil_jumps 0
set ceil_prev_y -1
set ceil_viol {}
set ceil_samples 0
set ceil_follower_bad 0
# clip
set clip_visit_state -1
set clip_visit_frames {}
set clip_bad {}
set clip_visits {}
set clip_cal 0
set clip_pat0 0
set clip_pat1 0
set clip_entry -1
set clip_samples 0
set clip_sat_bad {}
set clip_sat_checked 0
set clip_seen_states {}
set clip_follower_bad {}

proc load_clips {} {
    # the clip table written by make_pursuer_tall_lab.mjs: a JSON array of flat objects; parsed with a regexp, no JSON package needed
    if {$::CLIPS eq "" || [catch {set fh [open $::CLIPS r]}]} { fail_instrument "cannot open the clip table '$::CLIPS' (MIDEAS_CLIPS)" }
    set txt [read $fh]
    close $fh
    set ::clip_table {}
    foreach m [regexp -all -inline {\{[^\}]*\}} $txt] {
        foreach key {state first n minFrame maxFrame} {
            if {![regexp "\"$key\": *(\[0-9\]+)" $m -> v($key)]} { fail_instrument "clip table entry without $key: $m" }
        }
        regexp {"cycles": *(true|false)} $m -> cyc
        lappend ::clip_table [list $v(state) $v(first) $v(n) $v(minFrame) $v(maxFrame) [expr {$cyc eq "true"}]]
    }
    if {[llength $::clip_table] == 0} { fail_instrument "empty clip table" }
    say "clip table: [llength $::clip_table] states: $::clip_table"
}
if {$CASE eq "clip"} { load_clips }

proc record_and_judge {} {
    set lx [slot 0 $::F_X]; set ly [slot 0 $::F_Y]; set lf [slot 0 $::F_FRAME]
    set fx [slot 1 $::F_X]; set fy [slot 1 $::F_Y]; set ff [slot 1 $::F_FRAME]
    set dx [slot 0 $::F_DX]
    set k [expr {$::n - $::out_n}]
    switch $::CASE {
        stand { judge_stand $k $lx $ly $fy }
        ledge - ledgeleft { judge_ledge $k $lx $ly $fy }
        wall  { judge_wall $k $lx $ly $fy $dx }
        ceiling { judge_ceiling $k $lx $ly $fy }
        clip  { judge_clip $k $lx $ly $lf $fx $fy $ff }
        t744  { judge_t744 $k $lx $ly }
    }
}

proc judge_stand {k lx ly fy} {
    lappend ::leader_ys $ly
    lappend ::follower_ys $fy
    lappend ::leader_xs $lx
    if {$k >= 119 && !$::stand_done} { set ::stand_done 1; conclude "" }
}

proc judge_ledge {k lx ly fy} {
    # stand on the ledge, fall, land, then >= 30 consecutive samples with y+32 = the top of the ground
    if {$::ledge_y0 < 0} { set ::ledge_y0 $ly }
    set top [ground_top $lx $ly]
    if {$::ledge_fall_start < 0} {
        if {$ly > $::ledge_y0} { set ::ledge_fall_start $k; set ::ledge_fall_x $lx; set ::ledge_fall_dir [expr {([slot 0 $::F_DX] & 0x80) ? -1 : 1}] } else {
            incr ::ledge_stand
            if {$ly + 32 != $top} { lappend ::ledge_bad [list stand k=$k y=$ly top=$top] }
        }
    } elseif {$::ledge_land_n < 0} {
        if {$ly == $::ledge_prev_y} { incr ::ledge_still } else { set ::ledge_still 0 }
        if {$::ledge_still >= 2} { set ::ledge_land_n $k; set ::ledge_land_y $ly }
    } else {
        incr ::ledge_checked
        if {$ly != $::ledge_land_y || $ly + 32 != $top} { lappend ::ledge_bad [list landed k=$k y=$ly x=$lx top=$top] }
        if {$::ledge_checked >= 30} { conclude ""; return }
    }
    set ::ledge_prev_y $ly
    if {$k > 400} { conclude "the soldier never landed within 400 samples (ledge_fall_start=$::ledge_fall_start)" }
}

proc judge_wall {k lx ly fy dx} {
    incr ::wall_samples
    if {$lx > $::wall_max_x} { set ::wall_max_x $lx }
    if {$lx < $::wall_min_x} { set ::wall_min_x $lx }
    set dir [expr {($dx & 0x80) ? 0 : 1}]
    if {$::wall_prev_dir >= 0 && $dir != $::wall_prev_dir} { incr ::wall_turns }
    set ::wall_prev_dir $dir
    foreach cx [list [expr {$lx + 3}] [expr {$lx + 11}]] {
        foreach cy [list [expr {$ly + 3}] [expr {$ly + 17}] [expr {$ly + 31}]] {
            if {[solid_px $cx $cy]} { lappend ::wall_viol [list k=$k body=($lx,$ly) corner=($cx,$cy)] }
        }
    }
    if {$k >= 500} { conclude "" }
}

proc judge_ceiling {k lx ly fy} {
    incr ::ceil_samples
    if {$ly < $::ceil_min_y} { set ::ceil_min_y $ly }
    if {$ly > $::ceil_max_y} { set ::ceil_max_y $ly }
    if {$::ceil_prev_y == 144 && $ly < 144} { incr ::ceil_jumps }
    set ::ceil_prev_y $ly
    if {$fy != $ly + 16} { incr ::ceil_follower_bad }
    foreach cx [list [expr {$lx + 3}] [expr {$lx + 11}]] {
        foreach cy [list [expr {$ly + 3}] [expr {$ly + 17}] [expr {$ly + 31}]] {
            if {[solid_px $cx $cy]} { lappend ::ceil_viol [list k=$k body=($lx,$ly) corner=($cx,$cy)] }
        }
    }
    if {$k >= 400} { conclude "" }
}

# t744: the soldier of the real project on its real floor
set t744_ys {}
set t744_ground_ys {}
set t744_air 0
set t744_xs {}
set t744_pen {}
set t744_cell2_bad {}
set t744_ground_bad {}
proc judge_t744 {k lx ly} {
    lappend ::t744_ys $ly
    lappend ::t744_xs $lx
    set jumping [expr {[slot 0 $::F_STATE] == 2}]     ;# state_jump of the behaviour of test744
    if {$jumping} { incr ::t744_air } else { lappend ::t744_ground_ys $ly }
    # every pixel of the 9x29 body (x+3..x+11, y+3..y+31) must be outside the solid pixels of the room
    for {set py [expr {$ly + 3}]} {$py <= [expr {$ly + 31}]} {incr py} {
        for {set px [expr {$lx + 3}]} {$px <= [expr {$lx + 11}]} {incr px} {
            if {[solid_px $px $py]} { lappend ::t744_pen [list k=$k body=($lx,$ly) pixel=($px,$py)]; break }
        }
    }
    if {!$jumping && $ly + 32 != [ground_top $lx $ly]} { lappend ::t744_ground_bad [list k=$k y=$ly top=[ground_top $lx $ly]] }
    # the second cell of the sprite sits 16 px under the first (the slots are 4 colour layers per cell: the last half of the slots)
    for {set si 1} {$si < $::NSLOTS} {incr si} {
        set dy [expr {[slot $si $::F_Y] - $ly}]
        set dxs [expr {[slot $si $::F_X] - $lx}]
        if {($dy != 0 && $dy != 16) || $dxs != 0} { lappend ::t744_cell2_bad [list k=$k slot=$si dy=$dy dx=$dxs] }
    }
    if {$k >= 239} { conclude "" }
}

proc judge_clip {k lx ly lf fx fy ff} {
    incr ::clip_samples
    set state [slot 0 $::F_STATE]
    set frames [slot 0 $::F_FRAMES]
    if {$state >= [llength $::clip_table]} { lappend ::clip_bad [list k=$k state=$state out_of_table] ; return }
    lassign [lindex $::clip_table $state] st first n lo hi cycles
    if {[lsearch -exact $::clip_seen_states $state] < 0} { lappend ::clip_seen_states $state }
    # the visit bookkeeping: frames seen while the leader is in this state
    if {$state != $::clip_visit_state} {
        if {$::clip_visit_state >= 0} { lappend ::clip_visits [list $::clip_visit_state [lsort -integer -unique $::clip_visit_frames]] }
        set ::clip_visit_state $state
        set ::clip_visit_frames {}
    }
    lappend ::clip_visit_frames $lf
    # every frame, leader AND follower, inside the clip of the state the leader is in right now
    if {$lf < $lo || $lf > $hi} { lappend ::clip_bad [list k=$k state=$state leader_frame=$lf clip=$lo..$hi] }
    if {$ff < $lo || $ff > $hi} { lappend ::clip_bad [list k=$k state=$state follower_frame=$ff clip=$lo..$hi] }
    if {$ff != $lf} { lappend ::clip_follower_bad [list k=$k leader=$lf follower=$ff] }
    if {$frames != 4} { lappend ::clip_bad [list k=$k frameCount=$frames expected_4] }
    # remember what this sample shows, for the SAT readback at the next main-loop pass (facing = bit 7 of dx, of each slot)
    set ::sat_pending [list $k $lx $ly $lf $fx $fy $ff [expr {([slot 0 $::F_DX] & 0x80) ? 1 : 0}] [expr {([slot 1 $::F_DX] & 0x80) ? 1 : 0}]]
    if {$::clip_samples >= 700} { conclude "" }   ;# the visit in progress is NOT judged: only whole visits are
}

# The pattern number the SAT writer produces for slot i showing pool frame `frame` facing `left` (1 = moving left), decoded from the
# writer's own code at .sat_slot_i_pat. Compact build: add a,e / rrca / rrca / ld e,a / ld d,0 / ld hl,MAP / add hl,de / ld a,(hl) /
# add a,a / add a,a / add a,N  -> (MAP[frame * 2 + left] * 4 + N) & 255. Plain build: add a,e / add a,N -> N + frame * 8 + left * 4.
proc sat_expected_pattern {i frame left} {
    set a [sym .sat_slot_${i}_pat]
    set b {}
    for {set k 0} {$k < 15} {incr k} { lappend b [rb [expr {$a + $k}]] }
    if {[lindex $b 0] != 0x83} { fail_instrument [format "slot %d: .sat_slot_%d_pat does not start with 'add a,e' (bytes %s)" $i $i $b] }
    if {[lindex $b 1] == 0x0F} {
        if {[lrange $b 1 6] ne {15 15 95 22 0 33} || [lindex $b 9] != 0x19 || [lindex $b 10] != 0x7E || [lrange $b 11 13] ne {135 135 198}} {
            fail_instrument [format "slot %d: the compact pattern resolution is not the expected instruction sequence (bytes %s)" $i $b]
        }
        set map [expr {[lindex $b 7] + 256 * [lindex $b 8]}]
        set idx [expr {$frame * 2 + $left}]
        return [expr {(([rb [expr {$map + $idx}]] << 2) + [lindex $b 14]) & 0xFF}]
    }
    if {[lindex $b 1] != 0xC6} { fail_instrument [format "slot %d: unknown pattern resolution (bytes %s)" $i $b] }
    return [expr {([lindex $b 2] + $frame * 8 + $left * 4) & 0xFF}]
}

# SAT readback (clip case): find the two entries of the soldier once (by X and Y), then compare the pattern of every sample with what the
# writer must produce for the pool frame of the sample before
proc sat_base {} {
    set r5 [debug read "VDP regs" 5]
    set r11 [debug read "VDP regs" 11]
    return [expr {(($r5 & 0xFC) << 7) | (($r11 & 3) << 15)}]
}
# A Tcl error inside a breakpoint callback is swallowed by OpenMSX; turn it into a loud instrument failure instead.
proc sat_readback {} {
    if {[catch {sat_readback_impl} err]} { fail_instrument "exception in sat_readback: $err | $::errorInfo" }
}
proc sat_readback_impl {} {
    lassign $::sat_pending k lx ly lf fx fy ff left0 left1
    set ::sat_pending {}
    set base [sat_base]
    if {!$::clip_cal} {
        for {set i 0} {$i < 31} {incr i} {
            set a [expr {$base + 4 * $i}]
            set sy [vpeek $a]
            set sx [vpeek [expr {$a + 1}]]
            set a2 [expr {$a + 4}]
            set sy2 [vpeek $a2]
            set sx2 [vpeek [expr {$a2 + 1}]]
            if {$sx == $lx && $sx2 == $fx && ($sy - $ly) == ($sy2 - $fy) && ($sy - $ly) >= 0 && ($sy - $ly) <= 40} {
                set ::clip_entry $i
                set ::clip_cal 1
                say [format "SAT calibration: base %04X, soldier entries %d and %d, Y offset %d (sample %d showing frame %d); patterns decoded from the writer: leader %d follower %d" $base $i [expr {$i + 1}] [expr {$sy - $ly}] $k $lf [sat_expected_pattern 0 $lf $left0] [sat_expected_pattern 1 $ff $left1]]
                break
            }
        }
        if {!$::clip_cal} { lappend ::clip_sat_bad [list k=$k no_sat_entry_for_the_soldier] }
        return
    }
    set a [expr {$base + 4 * $::clip_entry}]
    set p0 [vpeek [expr {$a + 2}]]
    set p1 [vpeek [expr {$a + 6}]]
    set e0 [sat_expected_pattern 0 $lf $left0]
    set e1 [sat_expected_pattern 1 $ff $left1]
    incr ::clip_sat_checked
    if {$p0 != $e0 || $p1 != $e1 || [vpeek [expr {$a + 1}]] != $lx} {
        lappend ::clip_sat_bad [list k=$k leader_pool_frame=$lf SAT_pattern=$p0 expected=$e0 follower_pool_frame=$ff SAT_pattern=$p1 expected=$e1]
    }
}

# ---- verdicts -----------------------------------------------------------------------------------------------------------------------------
proc head {l} { return [lrange $l 0 2] }
proc conclude {why} {
    if {$::done} { return }
    set ::done 1
    setkeys 0 0
    say "-- samples: $::n, main-loop passes: $::iters, soldier out at sample $::out_n, SAT writer calls outside the loop (ignored): $::foreign_hits"
    if {$why ne ""} { check timeout 0 $why }
    check no_skipped_frames [expr {$::skipped == 0}] "$::skipped sample(s) were not exactly one main-loop pass after the previous one (every frame is sampled)"
    set bad_desc [lsearch -all -not -exact $::desc_all "0303081C"]
    check soldier_descriptor_is_the_player_hitbox [expr {$::desc_leader eq "0303081C" && $::desc_follower eq "0303081C" && [llength $::desc_all] == $::NSLOTS && [llength $bad_desc] == 0}] "resident terrain descriptors of the leader / follower slots: $::desc_leader / $::desc_follower; all $::NSLOTS soldier slots: $::desc_all (left=3 top=3 width-1=8 height-1=28: x+3..x+11, y+3..y+31, feet row y+32)"
    switch $::CASE {
        stand {
            set ys $::leader_ys
            set n [llength $ys]
            if {$n > 0} {
                set mn [lindex [lsort -integer $ys] 0]
                set mx [lindex [lsort -integer $ys] end]
                check samples_taken [expr {$n >= 120}] "$n samples after the soldier came out (120 required)"
                check entry_height_is_144 [expr {$::entry_y == 144}] "the soldier comes out at the player's entry height: entry y=$::entry_y (the lab's floor is y 176: a 16x32 body stands at 144)"
                check leader_y_stays_at_entry [expr {$mn == $::entry_y && $mx == $::entry_y}] "leader y over the $n samples: min=$mn max=$mx expected $::entry_y every time"
                check follower_16_below [expr {[lsearch -exact -not [lmap f $::follower_ys l $ys {expr {$f - $l}}] 16] < 0}] "follower y = leader y + 16 in every sample"
                set x0 [lindex $::leader_xs 0]; set x1 [lindex $::leader_xs end]
                check soldier_walks [expr {$x1 - $x0 >= 100}] "leader x moved $x0 -> $x1 over $n samples (a body that is not walking proves nothing about its feet)"
            } else {
                check samples_taken 0 "the soldier never came out"
            }
        }
        ledge - ledgeleft {
            set west [expr {$::CASE eq "ledgeleft"}]
            set want_x [expr {$west ? 148 : 61}]
            check stood_on_the_ledge [expr {$::ledge_stand >= 10}] "$::ledge_stand samples standing on the ledge at y=$::ledge_y0 with y+32 = the ground top (>= 10 required)"
            check started_on_the_ledge [expr {$::ledge_y0 == 128}] "first y=$::ledge_y0 (the ledge fixture spawns the player at 128, ground at 160)"
            check fell_off_the_ledge [expr {$::ledge_fall_start >= 0}] "the soldier started falling at sample k=$::ledge_fall_start"
            check fell_walking_the_expected_way [expr {$::ledge_fall_dir == ($west ? -1 : 1)}] "walking direction when the fall started: $::ledge_fall_dir (expected [expr {$west ? "-1, west" : "1, east"}])"
            if {$west} {
                check fell_at_x148 [expr {$::ledge_fall_x == $want_x}] "the soldier started falling at x=$::ledge_fall_x (ledge ground from x=160; walking west the body stands while its RIGHT foot x+11 is over it, so the first x with nothing under any pixel of x+3..x+11 is 148)"
            } else {
                check fell_at_x61 [expr {$::ledge_fall_x == $want_x}] "the soldier started falling at x=$::ledge_fall_x (ledge x 0-63: walking east the body stands while its LEFT foot x+3 is over it, so the first x with nothing under any pixel of x+3..x+11 is 61)"
            }
            check landed [expr {$::ledge_land_n >= 0}] "landed at k=$::ledge_land_n with y=$::ledge_land_y"
            check landed_on_the_floor_y144 [expr {$::ledge_land_y == 144}] "landing y=$::ledge_land_y (floor top 176 - 32 = 144)"
            check on_the_ground_30_samples [expr {$::ledge_checked >= 30 && [llength $::ledge_bad] == 0}] "$::ledge_checked consecutive samples after landing; samples where y+32 != the top of the ground (or y moved): [llength $::ledge_bad] [head $::ledge_bad]"
        }
        wall {
            check samples_taken [expr {$::wall_samples >= 500}] "$::wall_samples samples after the soldier came out"
            check reaches_the_block [expr {$::wall_max_x == 116}] "the soldier got as far as x=$::wall_max_x (the block is at x 128-143: flush against it is x 116, the hitbox ends at x+11)"
            check reaches_the_left_wall [expr {$::wall_min_x == 13}] "the soldier got as far left as x=$::wall_min_x (the wall is at x 0-15: flush against it is x 13, the hitbox starts at x+3)"
            check turns_away_from_the_block [expr {$::wall_turns >= 1}] "the soldier reversed $::wall_turns time(s)"
            check no_corner_inside_solid [expr {[llength $::wall_viol] == 0}] "samples with a hitbox corner (x+3/x+11 by y+3/y+17/y+31) inside a solid cell: [llength $::wall_viol] [head $::wall_viol]"
        }
        ceiling {
            check samples_taken [expr {$::ceil_samples >= 400}] "$::ceil_samples samples after the soldier came out"
            check keeps_jumping [expr {$::ceil_jumps >= 5}] "$::ceil_jumps take-offs from the floor (a soldier that never jumps proves nothing about its head)"
            check stands_on_the_floor_at_144 [expr {$::ceil_max_y == 144}] "highest y seen at the bottom = $::ceil_max_y (floor top 176 - 32)"
            check head_stops_at_141 [expr {$::ceil_min_y == 141}] "lowest y reached = $::ceil_min_y (slab ends at y 143, hitbox top row is y+3: 141 is the last y that keeps it out of the slab)"
            check no_corner_inside_the_slab [expr {[llength $::ceil_viol] == 0}] "samples with a hitbox corner inside a solid cell: [llength $::ceil_viol] [head $::ceil_viol]"
            check follower_16_below [expr {$::ceil_follower_bad == 0}] "samples where follower y != leader y + 16: $::ceil_follower_bad"
        }
        t744 {
            set ys $::t744_ys
            set n [llength $ys]
            check samples_taken [expr {$n >= 240}] "$n samples after the soldier came out"
            set mn [lindex [lsort -integer $ys] 0]
            set mx [lindex [lsort -integer $ys] end]
            set gys $::t744_ground_ys
            set gmn [lindex [lsort -integer $gys] 0]
            set gmx [lindex [lsort -integer $gys] end]
            check never_below_144 [expr {$n > 0 && $mx == 144}] "soldier y over $n samples: min=$mn max=$mx (the floor top is 176 and the body ends 3+29 under the origin: a soldier that sinks reads 160 here)"
            check standing_at_144 [expr {[llength $gys] >= 120 && $gmn == 144 && $gmx == 144}] "[llength $gys] samples outside the Jump state ($::t744_air in it): y min=$gmn max=$gmx (entry height $::entry_y)"
            check feet_on_the_floor_176 [expr {[llength $::t744_ground_bad] == 0}] "samples outside the Jump state where y+32 != the top of the ground under the body (176 expected): [llength $::t744_ground_bad] [head $::t744_ground_bad]"
            check zero_penetrations [expr {[llength $::t744_pen] == 0}] "samples with a cell of the 9x29 body inside a solid cell: [llength $::t744_pen] [head $::t744_pen]"
            check second_cell_16_below [expr {[llength $::t744_cell2_bad] == 0}] "slot samples where a follower is not at dy 0 or 16 / dx 0 from the leader: [llength $::t744_cell2_bad] [head $::t744_cell2_bad]"
            set x0 [lindex $::t744_xs 0]; set x1 [lindex $::t744_xs end]
            set xs_sorted [lsort -integer $::t744_xs]
            set span [expr {[lindex $xs_sorted end] - [lindex $xs_sorted 0]}]
            check soldier_moves [expr {$span >= 20}] "leader x $x0 -> $x1 over $n samples, spread $span px (a standing soldier proves nothing about its feet)"
        }
        clip {
            check samples_taken [expr {$::clip_samples >= 700}] "$::clip_samples samples after the soldier came out"
            check every_state_visited [expr {[llength $::clip_seen_states] == [llength $::clip_table]}] "states seen: $::clip_seen_states of [llength $::clip_table]"
            check frame_inside_the_clip_in_every_sample [expr {[llength $::clip_bad] == 0}] "samples where the leader or the follower showed a frame outside the clip of the current state: [llength $::clip_bad] [head $::clip_bad]"
            check follower_equals_leader [expr {[llength $::clip_follower_bad] == 0}] "samples where follower frame != leader frame: [llength $::clip_follower_bad] [head $::clip_follower_bad]"
            # held clips hold, cycles cycle (judged per visit: whole visits only, the first visit starts mid-way is fine too)
            set held_bad {}; set cyc_bad {}
            foreach visit $::clip_visits {
                lassign $visit state frames
                lassign [lindex $::clip_table $state] st first n lo hi cycles
                if {!$cycles && $frames ne [list $first]} { lappend held_bad [list state=$state frames=$frames expected=$first] }
                set want {}
                for {set f $lo} {$f <= $hi} {incr f} { lappend want $f }
                if {$cycles && $frames ne $want} { lappend cyc_bad [list state=$state frames=$frames expected=$want] }
            }
            check held_clips_hold [expr {[llength $held_bad] == 0 && [llength $::clip_visits] >= 7}] "whole visits judged: [llength $::clip_visits]; visits of a held clip that did not show exactly its frame: [llength $held_bad] [head $held_bad]"
            check cycling_clips_cycle [expr {[llength $cyc_bad] == 0}] "visits of a cycling clip that did not show EVERY frame of its clip: [llength $cyc_bad] [head $cyc_bad]"
            check sat_calibrated [expr {$::clip_cal == 1}] "the soldier's two entries were found in the VRAM SAT (entry $::clip_entry)"
            check sat_shows_the_pool_frame [expr {$::clip_cal == 1 && [llength $::clip_sat_bad] == 0 && $::clip_sat_checked >= 600}] "$::clip_sat_checked SAT readbacks; mismatches between the VRAM SAT and the pool frame: [llength $::clip_sat_bad] [head $::clip_sat_bad]"
            say "visits: $::clip_visits"
        }
    }
    say [format "RESULT case=%s %s (checks failed: %d)" $::CASE [expr {$::checks_failed == 0 ? "PASS" : "FAIL"}] $::checks_failed]
    finish_now
}

after time 300 { say "RESULT case=$::CASE FAIL (wall timeout, phase $::phase, n=$::n)"; finish_now }
