set f [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/trace_wanted.txt" w]
set throttle off
proc logline {s} { puts $::f $s; flush $::f }
proc mem8 {a} { return [debug read memory $a] }
set HP 0x0D17A
set HPL null
set IDX 0x0D1CA
set INTRO 0x0D1D2
set hits 0
debug set_bp 0x7677 {} {
  incr ::hits
  if {$::hits % 50 == 1} { logline "WANTED=[reg A] hp=[mem8 $HP] hplive=[mem8 $HPL] idx=[mem8 $IDX]" }
  if {$::hits > 20000} { logline STOP; close $::f; exit }
  debug cont
}
foreach t {6 8 10} {
  after time $t "keymatrixdown 8 0x01"
  after time [expr { + 0.5}] "keymatrixup 8 0x01"
}
after time 12 { debug write memory $INTRO 0 }
after time 26 { debug write memory $HP 10; debug write memory $HPL 10; logline "POKED" }
after time 40 { logline DONE; close $::f; exit }
