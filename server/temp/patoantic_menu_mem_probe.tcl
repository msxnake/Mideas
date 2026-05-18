set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic_menu_mem_probe.log"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} { set lo [mem8 $addr]; set hi [mem8 [expr {$addr + 1}]]; return [expr {$lo | ($hi << 8)}] }
proc dump {tag} {
  set p1 [mem8 0xC15A]; set p2 [mem8 0xC15B]; set p3 [mem8 0xC15C]
  set ptr [mem16 0xC120]
  set data ""
  for {set i 0} {$i < 24} {incr i} { append data [format "%02X " [mem8 [expr {0x9E5C + $i}]]] }
  set pdata ""
  for {set i 0} {$i < 20} {incr i} { append pdata [format "%02X " [mem8 [expr {$ptr + $i}]]] }
  logline [format "%s bank=%02X/%02X/%02X ptr=%04X titleBytes=%s dataBytes=%s" $tag $p1 $p2 $p3 $ptr $data $pdata]
}
proc down_space {} { keymatrixdown 8 0x01 }
proc up_space {} { keymatrixup 8 0x01 }
proc tap_space {} { down_space; after time 0.25 up_space }
after time 7.5 { dump "before" }
after time 8.0 { tap_space }
after time 8.7 { dump "after_space" }
after time 10.0 { dump "later"; close $f; exit }
