# Feature-agnostic walk used to compare screenshots of a ROM WITH the infinite-room feature
# (loop initially OFF, so the east exit reaches room 1) against the SAME project WITHOUT it:
# boot -> pick up the box -> east exit to room 1 -> west exit back to room 0.
# Uses only core symbols, so it runs on both ROMs. Env: WALK_SYM, WALK_SHOTS, WALK_RESULT.
proc envdef {name default} { if {[info exists ::env($name)]} { return $::env($name) } else { return $default } }
set sym_path  [envdef WALK_SYM    "test/msx2-infinite-room/out/off.sym"]
set shots_dir [envdef WALK_SHOTS  "test/msx2-infinite-room/out/walk_off"]
set result    [envdef WALK_RESULT "test/msx2-infinite-room/out/walk_off.txt"]
file mkdir $shots_dir
array set SYM {}
set sf [open $sym_path r]
while {[gets $sf line] >= 0} {
    if {[regexp {^([A-Za-z_][A-Za-z0-9_]*): equ ([0-9A-Fa-f]+)H} $line -> name hex]} { set SYM($name) [expr "0x$hex"] }
}
close $sf
proc rb {name {off 0}} { global SYM; return [debug read memory [expr {$SYM($name) + $off}]] }
proc wb {name val {off 0}} { global SYM; debug write memory [expr {$SYM($name) + $off}] $val }
proc log {msg} { global result; set f [open $result a]; puts $f $msg; close $f; puts $msg }
set fh [open $result w]; close $fh
proc snap {name next} { after time 0.4 [list snap_now $name $next] }
proc snap_now {name next} {
    global shots_dir
    log [format "SHOT %s screen=%d px=%d py=%d box st=%d x=%d y=%d" $name [rb current_screen_index] [rb player_x] [rb player_y] [rb bitmap_carry_state 0] [rb bitmap_carry_x 0] [rb bitmap_carry_y 0]]
    screenshot ${shots_dir}/${name}.png
    after time 0.15 $next
}
proc await {cond maxpolls okcmd {n 0}} {
    if {[uplevel #0 [list expr $cond]]} { uplevel #0 $okcmd } elseif {$n >= $maxpolls} { log "TIMEOUT $cond"; exit } else { after time 0.05 [list await $cond $maxpolls $okcmd [expr {$n + 1}]] }
}
proc w_boot {} { snap w01_boot w_pickup }
proc w_pickup {} {
    wb player_x 60
    wb player_y 160
    after time 0.6 { keymatrixdown 4 0x08; after time 0.3 { keymatrixup 4 0x08; snap w02_carried w_east } }
}
proc w_east {} {
    wb player_x 226
    wb player_y 160
    keymatrixdown 8 0x80
    await {[rb current_screen_index] == 1 && [rb bitmap_composition_state] == 0} 160 { keymatrixup 8 0x80; snap w03_room1 w_west }
}
proc w_west {} {
    wb player_x 6
    wb player_y 160
    keymatrixdown 8 0x10
    await {[rb current_screen_index] == 0 && [rb bitmap_composition_state] == 0} 160 { keymatrixup 8 0x10; snap w04_back_room0 w_done }
}
proc w_done {} { log "DONE"; after time 0.3 { exit } }
set throttle on
set frameskip 0
after time 7 w_boot
