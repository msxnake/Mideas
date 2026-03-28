set logfile "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic247_script_boot.log"
file delete -force $logfile
proc logline {msg} {
  set f [open "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic247_script_boot.log" a]
  puts $f $msg
  close $f
  puts $msg
}
logline "SCRIPT_START"
cart "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic247_zone_test_post_zx0_v2.rom"
reset
after time 3000 {
  logline [format "FINAL pc=%04X sp=%04X bytes=%02X %02X %02X %02X" [reg PC] [reg SP] [peek 0x4000] [peek 0x4001] [peek 0x4002] [peek 0x4003]]
  exit
}
vwait forever
