set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic_print_probe.log"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc down_space {} { keymatrixdown 8 0x01 }
proc up_space {} { keymatrixup 8 0x01 }
proc tap_space {} { down_space; after time 0.25 up_space }
set hits 0
debug set_bp 0x61D1 {} {
  global hits
  incr hits
  if {$hits <= 8} {
    set p1 [mem8 0xC15A]; set p2 [mem8 0xC15B]; set p3 [mem8 0xC15C]
    set hl [reg HL]; set de [reg DE]
    set bytes ""
    for {set i 0} {$i < 12} {incr i} { append bytes [format "%02X " [mem8 [expr {$hl + $i}]]] }
    logline [format "hit%d bank=%02X/%02X/%02X HL=%04X DE=%04X bytes=%s" $hits $p1 $p2 $p3 $hl $de $bytes]
  }
  debug cont
}
after time 8.0 { tap_space }
after time 10.0 { close $f; exit }
