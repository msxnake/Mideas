# Probe for the #C1FC RAM alias (hud_hearts_drawn / bitmap_carry_held / bitmap_room_pool_index).
#
# Measures, from the .sym of the ROM under test (no hard-coded addresses):
#   - who WRITES the hearts dirty flag and the carry-held byte (PC + nearest label + value),
#   - whether they are the same byte,
#   - what happens to the hearts redraw when the carry system writes carry_held (a pickup),
#     including the STALE-HUD case: the player drops to health 1 in the very frame carry latched 1.
#
# Build + run (repo root; simple32k ROM, no -romtype; MegaROM adds -romtype konami):
#   python scripts/build_msx2_screen5_bitmap_room_smoke.py --include-infinite-room --skip-openmsx \
#       --json-output X.json --asm-output X.asm --rom-output X.rom        (X.sym is written next to X.rom)
#   RAM_SYM=X.sym RAM_OUT=result.txt "C:/Program Files/openMSX/openmsx.exe" -machine C-BIOS_MSX2 \
#       -cart X.rom -script test/msx2-ram-aliasing/c1fc_probe.tcl
proc envdef {name default} { if {[info exists ::env($name)]} { return $::env($name) } else { return $default } }
set sym_path [envdef RAM_SYM "test/msx2-infinite-room/out/infinite.sym"]
set out_path [envdef RAM_OUT "test/msx2-ram-aliasing/probe_result.txt"]
set fh [open $out_path w]; close $fh
proc log {msg} { global out_path; set f [open $out_path a]; puts $f $msg; close $f; puts $msg }

array set SYM {}
set code_labels {}
set sf [open $sym_path r]
while {[gets $sf line] >= 0} {
    if {[regexp {^([A-Za-z_.][A-Za-z0-9_.]*): equ ([0-9A-Fa-f]+)H} $line -> name hex]} {
        set a [expr "0x$hex"]
        set SYM($name) $a
        if {$a >= 0x4000 && $a < 0xC000} { lappend code_labels [list $a $name] }
    }
}
close $sf
set code_labels [lsort -integer -index 0 $code_labels]
proc nearest {pc} {
    set best "?"
    foreach e $::code_labels { if {[lindex $e 0] <= $pc} { set best [lindex $e 1] } else { break } }
    return $best
}
foreach need {bitmap_composition_state hud_hearts_drawn bitmap_carry_held player_health bitmap_carry_state bitmap_carry_slot player_x player_y player_facing .hud_draw_heart_page} {
    if {![info exists SYM($need)]} { log "FATAL: $need missing from $sym_path"; exit 1 }
}
proc rb {name {off 0}} { global SYM; return [debug read memory [expr {$SYM($name) + $off}]] }
proc wb {name val {off 0}} { global SYM; debug write memory [expr {$SYM($name) + $off}] $val }

set held_addr  $SYM(bitmap_carry_held)
set hearts_addr $SYM(hud_hearts_drawn)
log [format "addresses: hud_hearts_drawn=#%04X bitmap_carry_held=#%04X player_health=#%04X  -> %s" $hearts_addr $held_addr $SYM(player_health) \
    [expr {$held_addr == $hearts_addr ? "SAME BYTE (alias)" : "distinct bytes"}]]
if {[info exists SYM(bitmap_room_pool_index)]} {
    log [format "bitmap_room_pool_index=#%04X (%s; only LIVE when multi-world: %s)" $SYM(bitmap_room_pool_index)         [expr {$SYM(bitmap_room_pool_index) == $hearts_addr ? "same address as hearts flag" : "distinct"}]         [expr {[info exists SYM(bitmap_world_index)] ? "multi-world ROM" : "single world, EQU unused"}]]
}

# --- writers of the two bytes: log value + PC + nearest label (first 14 events only) ---
set ::wlog 0
proc on_write {tag} {
    if {$::wlog >= 14} { return }
    incr ::wlog
    set pc [reg PC]
    log [format "  write %-17s value=%3d  PC=#%04X (~%s)" $tag $::wp_last_value $pc [nearest $pc]]
}
debug set_watchpoint write_mem $held_addr {} {on_write carry_held}
if {$hearts_addr != $held_addr} { debug set_watchpoint write_mem $hearts_addr {} {on_write hearts_drawn} }

# hearts redraws: .hud_draw_heart_page is called once per VRAM page, two calls = one redraw
set ::redraw_calls 0
debug set_bp $SYM(.hud_draw_heart_page) {} {incr ::redraw_calls}

set ::pass 0; set ::fail 0
proc check {label cond detail} {
    if {[uplevel #0 [list expr $cond]]} { incr ::pass; log "PASS  $label  ($detail)" } else { incr ::fail; log "FAIL  $label  ($detail)" }
}

proc phase_boot {} {
    log "--- boot: wait until the game loop runs (health seeded) ---"
    wait_boot 0
}
proc wait_boot {n} {
    if {[rb player_health] > 0 && [rb bitmap_composition_state] == 0} { after time 1.0 phase_idle; return }
    if {$n > 600} { log "FATAL: boot never reached the game loop"; exit 1 }
    after time 0.05 [list wait_boot [expr {$n + 1}]]
}
proc phase_idle {} {
    log [format "idle: health=%d carry_held=%d hearts_drawn=%d carry_state0=%d" [rb player_health] [debug read memory $::held_addr] [debug read memory $::hearts_addr] [rb bitmap_carry_state 0]]
    check "no carryable held: bitmap_carry_held reads 0" {[debug read memory $::held_addr] == 0} "carry_held=[debug read memory $::held_addr] health=[rb player_health]"
    wb player_x 60; wb player_y 160; wb player_facing 1
    set ::redraws_before_pickup $::redraw_calls
    after time 0.6 phase_pickup
}
proc phase_pickup {} {
    log "--- pickup (N key) ---"
    keymatrixdown 4 0x08
    after time 0.3 phase_after_pickup
}
proc phase_after_pickup {} {
    keymatrixup 4 0x08
    log [format "carried: state0=%d slot=%d carry_held=%d hearts_drawn=%d health=%d  redraw calls since idle=%d" \
        [rb bitmap_carry_state 0] [rb bitmap_carry_slot] [debug read memory $::held_addr] [debug read memory $::hearts_addr] [rb player_health] \
        [expr {$::redraw_calls - $::redraws_before_pickup}]]
    check "pickup works: box carried" {[rb bitmap_carry_state 0] == 1 && [rb bitmap_carry_slot] == 0} "state0=[rb bitmap_carry_state 0]"
    check "carry_held == 1 while carrying" {[debug read memory $::held_addr] == 1} "carry_held=[debug read memory $::held_addr] (health=[rb player_health])"
    check "pickup does NOT trigger a hearts redraw (health unchanged)" {($::redraw_calls - $::redraws_before_pickup) == 0} "redraw calls=[expr {$::redraw_calls - $::redraws_before_pickup}]"
    # throw it away again (box -> state 0 lands), then run the STALE-HUD scenario
    after time 0.8 phase_throw
}
proc phase_throw {} {
    keymatrixdown 4 0x08
    after time 0.2 {
        keymatrixup 4 0x08
        after time 1.5 phase_stale
    }
}
proc phase_stale {} {
    log [format "after throw: state0=%d carry_held=%d hearts_drawn=%d health=%d" [rb bitmap_carry_state 0] [debug read memory $::held_addr] [debug read memory $::hearts_addr] [rb player_health]]
    log "--- stale-HUD scenario: damage lands in the frame the carry system latches carry_held=1 ---"
    # 1) hearts HUD is settled at the current health
    set ::h_full [rb player_health]
    # 2) arm: the instant carry writes 1 to carry_held, the player drops to health 1
    set ::armed 1
    set ::stale_wp [debug set_watchpoint write_mem $::held_addr {} {
        if {$::armed && $::wp_last_value == 1} { set ::armed 0; wb player_health 1 }
    }]
    wb player_x 108; wb player_y 160; wb player_facing 1
    # move the box next to the player so the pickup fires again
    wb bitmap_carry_x [expr {[rb player_x] + 4}] 0
    wb bitmap_carry_y 160 0
    wb bitmap_carry_state 0 0
    set ::redraws_before_stale $::redraw_calls
    after time 0.6 {
        keymatrixdown 4 0x08
        after time 0.3 phase_stale_done
    }
}
proc phase_stale_done {} {
    keymatrixup 4 0x08
    after time 0.5 {
        set drawn [debug read memory $::hearts_addr]
        set redraws [expr {($::redraw_calls - $::redraws_before_stale) / 2}]
        log [format "stale test: carry_state0=%d health=%d hearts_drawn(latch)=%d hearts redraws since arming=%d (full health was %d)" \
            [rb bitmap_carry_state 0] [rb player_health] $drawn $redraws $::h_full]
        check "stale-HUD scenario: pickup happened" {[rb bitmap_carry_state 0] == 1} "state0=[rb bitmap_carry_state 0]"
        check "health dropped to 1 => the hearts HUD MUST redraw (latch must be 1 only AFTER a redraw)" {$redraws >= 1} "redraws=$redraws latch=$drawn"
        log "RESULT: $::pass passed, $::fail failed"
        after time 0.3 { exit }
    }
}
after time 0.1 phase_boot
