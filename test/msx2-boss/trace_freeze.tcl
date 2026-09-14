set f [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/trace_freeze.txt" w]
set throttle off
proc logline {s} { puts $::f $s; flush $::f }
proc mem8 {a} { return [debug read memory $a] }
set X 0x0D174
set SDX 0x0D1CE
set SDY 0x0D1CF
set RX 0x0D1D0
set RY 0x0D1D1
set PW 0x0D1C9
set CUR 0x0D1C7
set IT 0x0D17D
set INTRO 0x0D1D2
set HP 0x0D17A
foreach t {6 8 10} {
  after time $t "keymatrixdown 8 0x01"
  after time [expr { + 0.5}] "keymatrixup 8 0x01"
}
after time 12 { debug write memory $INTRO 0 }
set frame 0
proc watch {} {
  incr ::frame
  if {$::frame >= 30} {
    logline "F $::frame x=[mem8 $X] sdx=[mem8 $SDX] sdy=[mem8 $SDY] rx=[mem8 $RX] ry=[mem8 $RY] pw=[mem8 $PW] cur=[mem8 $CUR] it=[mem8 $IT] hp=[mem8 $HP]"
  }
  if {$::frame >= 1400} { finish }
  after frame watch
}
after frame watch
proc finish {} { logline DONE; close $::f; exit }
after time 60 { logline TIMEOUT; close $::f; exit }
