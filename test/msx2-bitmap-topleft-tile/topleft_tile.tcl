# Top-left tile regression (SCREEN 5 bitmap-room backend).
# Boot -> assert game cell (0,0) of page 0 holds the green brick; walk A->B->A with real
# keys, assert after each settled state. Screenshots are taken 0.35 s emulated AFTER settling.
# Build + run (repo root; simple32k => no -romtype):
#   python scripts/build_msx2_screen5_bitmap_room_smoke.py --include-infinite-room --skip-openmsx \
#     --json-output test/msx2-bitmap-topleft-tile/out/i.json --asm-output test/msx2-bitmap-topleft-tile/out/i.asm \
#     --rom-output test/msx2-bitmap-topleft-tile/out/i.rom
#   TL_SYM=test/msx2-bitmap-topleft-tile/out/i.sym TL_SHOTS=test/msx2-bitmap-topleft-tile/shots_fixed \
#   TL_RESULT=test/msx2-bitmap-topleft-tile/result_fixed.txt \
#   "C:/Program Files/openMSX/openmsx.exe" -machine C-BIOS_MSX2 -cart test/msx2-bitmap-topleft-tile/out/i.rom \
#       -script test/msx2-bitmap-topleft-tile/topleft_tile.tcl
proc envdef {n d} { if {[info exists ::env($n)]} { return $::env($n) } else { return $d } }
set sym_path  [envdef TL_SYM    "test/msx2-bitmap-topleft-tile/out/i.sym"]
set shots_dir [envdef TL_SHOTS  "test/msx2-bitmap-topleft-tile/shots"]
set result    [envdef TL_RESULT "test/msx2-bitmap-topleft-tile/result.txt"]
file mkdir $shots_dir
array set SYM {}
set sf [open $sym_path r]
while {[gets $sf line] >= 0} { if {[regexp {^([A-Za-z_][A-Za-z0-9_]*): equ ([0-9A-Fa-f]+)H} $line -> n h]} { set SYM($n) [expr "0x$h"] } }
close $sf
proc rb {n} { global SYM; return [debug read memory $SYM($n)] }
proc wb {n v} { global SYM; debug write memory $SYM($n) $v }
proc log {m} { global result; set f [open $result a]; puts $f $m; close $f }
set fh [open $result w]; close $fh
set ::fails 0; set ::checks 0
proc check {name ok {detail ""}} { incr ::checks; if {!$ok} {incr ::fails}; log [format "%s %s %s" [expr {$ok ? "PASS" : "FAIL"}] $name $detail] }
# Golden: green brick, rows 0..15 of the cell, first 8 bytes (16 px) of each line.
set ::golden {1111111111111111 1ccccccc1cccccc1 1ccccccc1cccccc1 1ccccccc1cccccc1 1ccccccc1cccccc1 1ccccccc1cccccc1 1ccccccc1cccccc1 1ccccccc1cccccc1 1111111111111111 1cccccccccccccc1 1cccccccccccccc1 1cccccccccccccc1 1cccccccccccccc1 1cccccccccccccc1 1cccccccccccccc1 1111111111111111}
proc cellrows {y0} {
  # y0 is the page-0 line; shift to the DISPLAYED page (R#2 bit 5 = page 1 in SCREEN 5).
  set y0 [expr {$y0 + 256 * (([vdpreg 2] >> 5) & 1)}]
  set r {}
  for {set y $y0} {$y < $y0+16} {incr y} { set l ""; for {set b 0} {$b < 8} {incr b} { append l [format %02x [debug read VRAM [expr {$y*128+$b}]]] }; lappend r $l }
  return $r
}
proc cellmatch {y0} { set bad 0; set i 0; foreach l [cellrows $y0] g $::golden { if {$l ne $g} {incr bad} }; return $bad }
proc zerobytes {y0} { set z 0; foreach l [cellrows $y0] { foreach {a b} [split [regsub -all {(..)} $l {\1 }] " "] { if {$a eq "00"} {incr z} } }; return $z }
proc snap {name next} { after time 0.35 [list snap_now $name $next] }
proc snap_now {name next} {
  global shots_dir
  log [format "SHOT %s screen=%d state=%d px=%d py=%d R2=%02x" $name [rb current_screen_index] [rb bitmap_composition_state] [rb player_x] [rb player_y] [vdpreg 2]]
  screenshot ${shots_dir}/${name}.png
  after time 0.15 $next
}
proc await {cond maxpolls okcmd {n 0}} {
  if {[uplevel #0 [list expr $cond]]} { uplevel #0 $okcmd } elseif {$n >= $maxpolls} { check TIMEOUT 0 $cond; finish } else { after time 0.05 [list await $cond $maxpolls $okcmd [expr {$n + 1}]] }
}
proc page0y {} { return 20 }
proc t_boot {} { snap t01_boot t_boot_check }
proc t_boot_check {} {
  check "boot: cell(0,0) page0 matches green brick" [expr {[cellmatch 20] == 0}] "mismatched_rows=[cellmatch 20]"
  check "boot: cell(0,0) page0 no zero bytes" [expr {[zerobytes 20] == 0}] "zero_bytes=[zerobytes 20]"
  t_east
}
proc t_east {} {
  # Room A is an Infinite Room (east exit wraps) while the loop is active. Labelled shortcut:
  # poke the resting box into the zone (centre inside x160..207,y160..191) so the loop turns OFF.
  wb bitmap_carry_x 176; wb bitmap_carry_y 160
  await {[rb bitmap_inf_active] == 0} 60 { after time 0.4 t_east2 }
}
proc t_east2 {} {
  wb player_x 226; wb player_y 160
  keymatrixdown 8 0x80
  await {[rb current_screen_index] == 1 && [rb bitmap_composition_state] == 0} 200 { keymatrixup 8 0x80; snap t02_roomB t_b_check }
}
proc t_b_check {} {
  # Room B paints white at (0,0): the cell must differ from the green brick and be fully painted.
  log "B cell rows: [cellrows 20]"
  check "roomB: cell(0,0) is the white brick (golden with c->f)" [expr {[cellrows 20] eq [string map {c f} $::golden]}]
  check "roomB: cell(0,0) no zero bytes" [expr {[zerobytes 20] == 0}] "zero_bytes=[zerobytes 20]"
  t_west
}
proc t_west {} {
  wb player_x 6; wb player_y 160
  keymatrixdown 8 0x10
  await {[rb current_screen_index] == 0 && [rb bitmap_composition_state] == 0} 200 { keymatrixup 8 0x10; snap t03_back_roomA t_a_check }
}
proc t_a_check {} {
  check "A->B->A: cell(0,0) page0 matches green brick" [expr {[cellmatch 20] == 0}] "mismatched_rows=[cellmatch 20] rows=[cellrows 20]"
  check "A->B->A: cell(0,0) no zero bytes" [expr {[zerobytes 20] == 0}] "zero_bytes=[zerobytes 20]"
  finish
}
proc finish {} { log [format "RESULT %d checks, %d failed" $::checks $::fails]; after time 0.2 { exit } }
set throttle on
set frameskip 0
after time 7 t_boot
