# Infinite Room smoke (SCREEN 5 bitmap-room backend).
#
# Build the ROM first (from the repo root):
#   python scripts/build_msx2_screen5_bitmap_room_smoke.py --include-infinite-room --skip-openmsx \
#       --json-output test/msx2-infinite-room/out/infinite.json \
#       --asm-output  test/msx2-infinite-room/out/infinite.asm \
#       --rom-output  test/msx2-infinite-room/out/infinite.rom        (simple32k + infinite.sym)
#   python scripts/build_mideas_unified_rom.py --json test/msx2-infinite-room/out/infinite.json \
#       --project-root . --asm-output test/msx2-infinite-room/out/mega.asm \
#       --rom-output test/msx2-infinite-room/out/mega.rom --sym-output test/msx2-infinite-room/out/mega.sym \
#       --allow-tsc-errors --rom-mode megarom --target-format konami   (MegaROM / bankedRle path)
#
# Run from the repo root (env vars pick the build under test; defaults = simple32k):
#   "C:/Program Files/openMSX/openmsx.exe" -machine C-BIOS_MSX2 -cart test/msx2-infinite-room/out/infinite.rom \
#       -script test/msx2-infinite-room/infinite_smoke.tcl
#   INF_SYM=test/msx2-infinite-room/out/mega.sym INF_RESULT=test/msx2-infinite-room/infinite_result_mega.txt \
#   INF_SHOTS=test/msx2-infinite-room/shots_mega \
#   "C:/Program Files/openMSX/openmsx.exe" -machine C-BIOS_MSX2 -cart test/msx2-infinite-room/out/mega.rom \
#       -romtype konami -script test/msx2-infinite-room/infinite_smoke.tcl
# (simple32k: do NOT pass -romtype; MegaROM: -romtype konami.)
#
# Layout of room A (index 0, infinite, loop initially ACTIVE):
#   floor on the last collision row except a pit at columns 10..12 (x 160..207)
#   carry_box  (slot 0, zone target) rests at (64,160); carry_rock (slot 1) at (96,160)
#   zone x 160..208, y 160..192 (centre of the box must be inside)
# Room B (index 1) is the plain east neighbour.
#
# Every RAM address comes from the .sym file of the ROM under test. Keys (matrix row/mask):
# RIGHT 8/0x80, LEFT 8/0x10, carry/throw N 4/0x08. The box is picked up, carried and THROWN with
# real key presses; pokes are only used to position the player (and as a labelled fallback).
# Screenshots are taken >= 0.3 emulated seconds after the state they show has settled and the
# state at the moment of the shot is logged next to it.
# NOTE: bitmap_carry_held used to alias the hearts-HUD dirty byte (#C1FC); it now has its own chain byte
# when the classic hearts HUD is active. It is still not asserted here (see test/msx2-ram-aliasing/c1fc_probe.tcl).

proc envdef {name default} { if {[info exists ::env($name)]} { return $::env($name) } else { return $default } }
set result_path [envdef INF_RESULT "test/msx2-infinite-room/infinite_result.txt"]
set sym_path    [envdef INF_SYM    "test/msx2-infinite-room/out/infinite.sym"]
set shots_dir   [envdef INF_SHOTS  "test/msx2-infinite-room/shots"]
file mkdir $shots_dir

set fh [open $result_path w]
close $fh

proc log {msg} {
    global result_path
    set f [open $result_path a]
    puts $f $msg
    close $f
    puts $msg
}

# --- symbols ---------------------------------------------------------------
array set SYM {}
set sf [open $sym_path r]
while {[gets $sf line] >= 0} {
    if {[regexp {^([A-Za-z_.][A-Za-z0-9_.]*): equ ([0-9A-Fa-f]+)H} $line -> name hex]} {
        set SYM($name) [expr "0x$hex"]
    }
}
close $sf
foreach need {player_x player_y player_facing current_screen_index bitmap_composition_state \
              bitmap_transition_dir bitmap_displayed_page bitmap_inf_active bitmap_inf_cur \
              bitmap_inf_self_wrap bitmap_carry_state bitmap_carry_x bitmap_carry_y \
              bitmap_carry_slot psg_sfx_r7_c_bits bitmap_inf_load_room} {
    if {![info exists SYM($need)]} { log "FATAL: symbol $need missing from $sym_path"; exit 1 }
}
proc rb {name {off 0}} { global SYM; return [debug read memory [expr {$SYM($name) + $off}]] }
proc wb {name val {off 0}} { global SYM; debug write memory [expr {$SYM($name) + $off}] $val }

# --- PSG write recorder: every value written to register 4 (channel C tone, low) ---
set ::psg_sel -1
set ::r4writes {}
debug set_watchpoint write_io 0xA0 {} {set ::psg_sel $::wp_last_value}
debug set_watchpoint write_io 0xA1 {} {if {$::psg_sel == 4} {lappend ::r4writes $::wp_last_value}}
# Count how often the normal (non self-wrap) load path of bitmap_inf_load_room runs; on MegaROM its
# first instruction is the bitmap_room_restore_resident_banks call.
set ::normal_loads 0
if {[info exists SYM(.inf_load_normal)]} {
    debug set_bp $SYM(.inf_load_normal) {} {incr ::normal_loads}
}

# --- assertions ------------------------------------------------------------
set ::pass 0
set ::fail 0
proc check {label cond detail} {
    if {[uplevel #0 [list expr $cond]]} {
        incr ::pass
        log "PASS  $label  ($detail)"
    } else {
        incr ::fail
        log "FAIL  $label  ($detail)"
    }
}
proc finish {} {
    log "normal (non self-wrap) inf loads executed: $::normal_loads"
    log "RESULT: $::pass passed, $::fail failed"
    after time 0.5 { exit }
}
proc state {tag} {
    log [format "state %-26s screen=%d inf_active=%d inf_cur=%d px=%d py=%d comp=%d page=%d | box st=%d x=%d y=%d | rock st=%d x=%d y=%d | slot=%d" \
        $tag [rb current_screen_index] [rb bitmap_inf_active] [rb bitmap_inf_cur] [rb player_x] [rb player_y] \
        [rb bitmap_composition_state] [rb bitmap_displayed_page] \
        [rb bitmap_carry_state 0] [rb bitmap_carry_x 0] [rb bitmap_carry_y 0] \
        [rb bitmap_carry_state 1] [rb bitmap_carry_x 1] [rb bitmap_carry_y 1] \
        [rb bitmap_carry_slot]]
}
# Let the frame be drawn (0.3 s of emulated time with the game loop running), log the state that
# the picture shows, take the screenshot, then continue.
proc snap {name next} {
    after time 0.3 [list snap_now $name $next]
}
proc snap_now {name next} {
    global shots_dir
    state "SHOT $name"
    screenshot ${shots_dir}/${name}.png
    log "shot  ${shots_dir}/${name}.png"
    after time 0.15 $next
}
# Poll an expression every 0.05 emulated seconds; run okcmd when true, fail+finish on timeout.
proc await {cond maxpolls okcmd {n 0}} {
    if {[uplevel #0 [list expr $cond]]} {
        uplevel #0 $okcmd
    } elseif {$n >= $maxpolls} {
        check "await" 0 "timeout waiting for: $cond"
        state "timeout"
        finish
    } else {
        after time 0.05 [list await $cond $maxpolls $okcmd [expr {$n + 1}]]
    }
}
proc keys_off {} {
    keymatrixup 8 0x80
    keymatrixup 8 0x10
    keymatrixup 4 0x08
}
# Real throw: stand on the floor at x facing right holding the box, wait for the carry lock/cooldown,
# press N, wait for the box to land. Falls back to writing the landed state if it never lands.
proc throw_from {x cont} {
    wb player_x $x
    wb player_y 160
    wb player_facing 1
    after time 0.9 [list throw_press $cont]
}
proc throw_press {cont} {
    keymatrixdown 4 0x08
    after time 0.15 [list throw_released $cont]
}
proc throw_released {cont} {
    keymatrixup 4 0x08
    state "just thrown"
    await {[rb bitmap_carry_state 0] == 0 && [rb bitmap_carry_x 0] > 100} 100 $cont
}

# ---------------------------------------------------------------------------
proc step_boot {} {
    state "boot"
    check "boot: room 0, anchor 0, loop ACTIVE" {[rb current_screen_index] == 0 && [rb bitmap_inf_cur] == 0 && [rb bitmap_inf_active] == 1} "loop starts at initialLoopActive"
    check "boot: box + rock resting at authored cells" {[rb bitmap_carry_state 0] == 0 && [rb bitmap_carry_x 0] == 64 && [rb bitmap_carry_y 0] == 160 && [rb bitmap_carry_state 1] == 0 && [rb bitmap_carry_x 1] == 96} "slots 0/1"
    check "boot: sfx shadow still muted" {[rb psg_sfx_r7_c_bits] == 0x24} "psg_sfx_r7_c_bits"
    snap 01_initial_room step_east
}
proc step_east {} {
    wb player_x 226
    wb player_y 160
    keymatrixdown 8 0x80
    await {[rb player_x] < 100 && [rb bitmap_composition_state] == 0} 80 step_east_done
}
proc step_east_done {} {
    keys_off
    after time 0.2 {
        state "after east wrap"
        check "east exit with loop active stays in room 0" {[rb current_screen_index] == 0} "current_screen_index"
        check "east exit appears at the WEST edge" {[rb player_x] < 20} "player_x=[rb player_x]"
        snap 02_after_wrap_east step_west
    }
}
proc step_west {} {
    wb player_x 8
    wb player_y 160
    keymatrixdown 8 0x10
    await {[rb player_x] > 180 && [rb bitmap_composition_state] == 0} 80 step_west_done
}
proc step_west_done {} {
    keys_off
    after time 0.2 {
        state "after west wrap"
        check "west exit with loop active stays in room 0" {[rb current_screen_index] == 0} "current_screen_index"
        check "west exit appears at the EAST edge" {[rb player_x] > 220} "player_x=[rb player_x]"
        snap 03_after_wrap_west step_south
    }
}
proc step_south {} {
    wb player_x 176
    wb player_y 150
    await {[rb bitmap_composition_state] != 0} 120 step_south_started
}
proc step_south_started {} {
    check "south exit requests direction 3" {[rb bitmap_transition_dir] == 3} "bitmap_transition_dir=[rb bitmap_transition_dir]"
    await {[rb bitmap_composition_state] == 0} 120 step_south_done
}
proc step_south_done {} {
    state "after south wrap"
    check "south exit stays in room 0 and appears at the TOP" {[rb current_screen_index] == 0 && [rb player_y] < 60} "player_y=[rb player_y]"
    wb player_x 200
    wb player_y 250
    await {[rb bitmap_composition_state] != 0} 40 step_north_started
}
proc step_north_started {} {
    check "north exit requests direction 2" {[rb bitmap_transition_dir] == 2} "bitmap_transition_dir=[rb bitmap_transition_dir]"
    await {[rb bitmap_composition_state] == 0} 120 step_north_done
}
proc step_north_done {} {
    state "after north wrap"
    check "north exit stays in room 0" {[rb current_screen_index] == 0} "current_screen_index"
    wb player_x 60
    wb player_y 160
    after time 0.6 step_pickup
}
proc step_pickup {} {
    keymatrixdown 4 0x08
    after time 0.3 {
        keymatrixup 4 0x08
        check "box is CARRIED after pressing N next to it" {[rb bitmap_carry_state 0] == 1 && [rb bitmap_carry_slot] == 0} "state=[rb bitmap_carry_state 0] slot=[rb bitmap_carry_slot]"
        snap 04_box_carried step_carry_wrap
    }
}
proc step_carry_wrap {} {
    wb player_x 226
    wb player_y 160
    keymatrixdown 8 0x80
    await {[rb player_x] < 100 && [rb bitmap_composition_state] == 0} 80 step_carry_wrap_done
}
proc step_carry_wrap_done {} {
    keys_off
    after time 0.3 {
        state "carried across wrap"
        check "wrap keeps the room" {[rb current_screen_index] == 0} "current_screen_index"
        check "held box is STILL carried after the wrap" {[rb bitmap_carry_state 0] == 1 && [rb bitmap_carry_slot] == 0} "state=[rb bitmap_carry_state 0] slot=[rb bitmap_carry_slot]"
        check "carried box follows the player" {abs([rb bitmap_carry_x 0] - [rb player_x]) <= 2} "box_x=[rb bitmap_carry_x 0] player_x=[rb player_x]"
        check "self-wrap latch consumed" {[rb bitmap_inf_self_wrap] == 0} "bitmap_inf_self_wrap"
        snap 05_after_wrap_carrying step_throw1
    }
}
# (3) REAL throw into the zone.
proc step_throw1 {} {
    set ::r4_before [llength $::r4writes]
    throw_from 108 step_landed
}
proc step_landed {} {
    state "box landed after real throw"
    set ::box_cx [expr {[rb bitmap_carry_x 0] + 8}]
    set ::box_cy [expr {[rb bitmap_carry_y 0] + 8}]
    check "real throw: the box landed resting INSIDE the zone (centre x 160..207, y 160..191)" {$::box_cx >= 160 && $::box_cx < 208 && $::box_cy >= 160 && $::box_cy < 192} "centre=($::box_cx,$::box_cy)"
    await {[rb bitmap_inf_active] == 0} 40 step_after_drop
}
proc step_after_drop {} {
    check "resting box inside the zone switches the loop OFF" {[rb bitmap_inf_active] == 0} "bitmap_inf_active"
    set ::new [lrange $::r4writes $::r4_before end]
    check "loop-off sfx ran (PSG R4 written with the 'solved' tone #0F)" {[lsearch $::new 15] >= 0} "R4 writes: $::new"
    check "sfx mixer shadow now #20" {[rb psg_sfx_r7_c_bits] == 0x20} "psg_sfx_r7_c_bits=[rb psg_sfx_r7_c_bits]"
    set ::r4_stable [llength $::r4writes]
    snap 06_box_in_zone step_no_spam
}
proc step_no_spam {} {
    after time 0.5 {
        check "no sound while the box just stays in the zone" {[llength $::r4writes] == $::r4_stable} "R4 writes now [llength $::r4writes]"
        step_pick_out
    }
}
# (4) REAL pick-out: stand at the pit edge next to the resting box and press N.
proc step_pick_out {} {
    set ::r4_before [llength $::r4writes]
    wb player_x 148
    wb player_y 160
    after time 0.5 {
        keymatrixdown 4 0x08
        after time 0.2 step_pick_out_done
    }
}
proc step_pick_out_done {} {
    keymatrixup 4 0x08
    state "after picking out"
    check "box picked out of the zone is carried again" {[rb bitmap_carry_state 0] == 1} "state=[rb bitmap_carry_state 0]"
    await {[rb bitmap_inf_active] == 1} 40 step_after_pick
}
proc step_after_pick {} {
    check "picking it out flips the loop back ON" {[rb bitmap_inf_active] == 1} "bitmap_inf_active"
    set ::new [lrange $::r4writes $::r4_before end]
    check "loop-on sfx ran (PSG R4 written with the 'unsolved' tone #C0)" {[lsearch $::new 192] >= 0} "R4 writes: $::new"
    snap 07_box_picked_out step_throw2
}
# (5) throw it back in (real), leave east with the loop off, come back.
proc step_throw2 {} {
    throw_from 108 step_landed2
}
proc step_landed2 {} {
    await {[rb bitmap_inf_active] == 0} 40 step_leave_east
}
proc step_leave_east {} {
    state "box in zone again"
    set ::box_before_leave "[rb bitmap_carry_x 0],[rb bitmap_carry_y 0]"
    wb player_x 226
    wb player_y 160
    keymatrixdown 8 0x80
    await {[rb current_screen_index] == 1 && [rb bitmap_composition_state] == 0} 160 step_in_room1
}
proc step_in_room1 {} {
    keys_off
    after time 0.3 {
        state "in room 1"
        check "loop OFF: east exit reaches room 1" {[rb current_screen_index] == 1} "current_screen_index"
        check "room 1 is not infinite (anchor #FF, active 0)" {[rb bitmap_inf_cur] == 255 && [rb bitmap_inf_active] == 0} "cur=[rb bitmap_inf_cur] active=[rb bitmap_inf_active]"
        set ::r4_before_return [llength $::r4writes]
        snap 08_room1 step_back_west
    }
}
proc step_back_west {} {
    wb player_x 6
    wb player_y 160
    keymatrixdown 8 0x10
    await {[rb current_screen_index] == 0 && [rb bitmap_composition_state] == 0} 160 step_back_home
}
proc step_back_home {} {
    keys_off
    after time 0.4 {
        state "back in room 0"
        check "west exit of room 1 returns to room 0" {[rb current_screen_index] == 0} "current_screen_index"
        check "box is STILL where it was left (persisted position)" {"[rb bitmap_carry_x 0],[rb bitmap_carry_y 0]" eq $::box_before_leave && [rb bitmap_carry_state 0] == 0} "was ($::box_before_leave) now ([rb bitmap_carry_x 0],[rb bitmap_carry_y 0]) st=[rb bitmap_carry_state 0]"
        set cx [expr {[rb bitmap_carry_x 0] + 8}]
        set cy [expr {[rb bitmap_carry_y 0] + 8}]
        check "box is still inside the zone" {$cx >= 160 && $cx < 208 && $cy >= 160 && $cy < 192} "centre=($cx,$cy)"
        check "loop is STILL off" {[rb bitmap_inf_active] == 0 && [rb bitmap_inf_cur] == 0} "active=[rb bitmap_inf_active] cur=[rb bitmap_inf_cur]"
        check "rock persisted at its own resting cell" {[rb bitmap_carry_state 1] == 0 && [rb bitmap_carry_x 1] == 96 && [rb bitmap_carry_y 1] == 160} "rock x=[rb bitmap_carry_x 1] y=[rb bitmap_carry_y 1]"
        check "no sound at room load / restore" {[llength $::r4writes] == $::r4_before_return} "R4 writes during the return: [expr {[llength $::r4writes] - $::r4_before_return}]"
        check "the normal load path of bitmap_inf_load_room ran (boot + room1 + back)" {$::normal_loads >= 3} "hits=$::normal_loads"
        snap 09_back_in_room0 finish
    }
}

set throttle on
set frameskip 0
after time 7 step_boot
