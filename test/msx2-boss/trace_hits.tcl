set f [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/trace_hits.txt" w]
set throttle off
proc logline {s} { puts $::f $s; flush $::f }
proc mem8 {a} { return [debug read memory $a] }
set frame 0
set u1 0
set u0 0
set loop 0
debug set_bp 0x6BE2 {} { incr ::u1; debug cont }
debug set_bp 0x6D9E {} { incr ::u0; debug cont }
debug set_bp 0x424F {} { incr ::loop; debug cont }
foreach t {6 8 10} {
  after time $t "keymatrixdown 8 0x01"
  after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}
after time 12 { debug write memory 0xD1D2 0 }
after time 26 { debug write memory 0xD17A 10 }
proc watch {} {
  incr ::frame
  if {$::frame % 120 == 0} {
    logline "F $::frame upd1=$::u1 upd0=$::u0 loop=$::loop act=[mem8 0xD173] intro=[mem8 0xD1D2] ph=[mem8 0xC1FD] hp=[mem8 0xD17A] idx=[mem8 0xD1CA] pend=[mem8 0xD1CC] cur=[mem8 0xD1C7] x=[mem8 0xD174] y=[mem8 0xD175]"
  }
  if {$::frame >= 2100} { finish }
  after frame watch
}
after frame watch
proc finish {} {
  logline "FINAL upd1=$::u1 upd0=$::u0 loop=$::loop"
  logline DONE
  close $::f
  exit
}
after time 55 { logline TIMEOUT; close $::f; exit }
logline "trace start"
