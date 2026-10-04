
set out [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-intro/intro_fade_samples.txt" w]
set marker_a 0xe621
proc bright {} {
  set blk [debug read_block "VDP palette" 0 32]
  binary scan $blk c* bytes
  set s 0
  for {set i 0} {$i < 16} {incr i} {
    set rb [expr {[lindex $bytes [expr {2*$i}]] & 255}]
    set g [expr {[lindex $bytes [expr {2*$i+1}]] & 255}]
    incr s [expr {(($rb >> 4) & 7) + ($rb & 7) + ($g & 7)}]
  }
  return $s
}
proc press {} { keymatrixdown 8 0x01; after time 0.2 { keymatrixup 8 0x01 } }
proc sample {} {
  global out marker_a
  puts $out "[format %.3f [machine_info time]] [bright] [debug read memory $marker_a]"
  after time 0.02 sample
}
proc auto_press {} {
  global marker_a
  if {[debug read memory $marker_a] == 1} { press; after time 0.6 auto_press } else { after time 0.1 auto_press }
}
set throttle off
after time 6 { press }
after time 5 { sample }
after time 6.5 { auto_press }
after time 40 { close $out; exit }
