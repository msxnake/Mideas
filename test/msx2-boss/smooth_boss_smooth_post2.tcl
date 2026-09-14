# Boss smoothness probe: boss_smooth_post2, sampling t=13..33s, hp poke at t=26
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/smooth_boss_smooth_post2.txt"
set f [open $log_path "w"]
proc logline {s} { puts $::f $s; flush $::f }
set throttle off
proc mem8 {a} { return [debug read memory $a] }
set X 0xD174
set Y 0xD175
set frame 0
set blits 0
debug set_bp 0x6EB4 {} { incr ::blits; debug cont }
foreach t {6 8 10} {
  after time $t "keymatrixdown 8 0x01"
  after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}
after time 12 { debug write memory 0xD1D2 0 }
after time 26 { debug write memory 0xD17A 10; logline "POKE hp=10" }
after time 13 { logline "START x=[mem8 $X] y=[mem8 $Y] hp=[mem8 0xD17A]" }
proc watch {} {
  incr ::frame
  if {$::frame >= 30} {
    logline "F $::frame [mem8 $::X] [mem8 $::Y] idx=[mem8 0xD1CA] blits=$::blits hp=[mem8 0xD17A] act=[mem8 0xD173] intro=[mem8 0xD1D2] ph=[mem8 0xC1FD]"
  }
  if {$::frame >= 33 * 60 - 780} { finish }
  after frame watch
}
after frame watch
proc finish {} {
  logline "TOTAL frames=$::frame bodyBlits=$::blits"
  logline "PROBE-DONE"
  close $::f
  exit
}
after time 53 { logline "VERDICT: FAIL timeout frames=$::frame"; close $::f; exit }
logline "smoothness start boss_smooth_post2 bossX=0xD174 launch=0x6EB4"
