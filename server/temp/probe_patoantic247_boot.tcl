set ::logfile "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic247_boot_probe.log"
set ::hit4010 0
set ::hit4220 0
set ::hitA000 0
proc logline {msg} {
  set fh [open $::logfile a]
  puts $fh $msg
  close $fh
  puts $msg
}
file delete -force $::logfile
proc bp_4010 {} {
  set ::hit4010 1
  logline [format "BP4010 pc=%04X sp=%04X" [reg PC] [reg SP]]
  debug cont
}
proc bp_4220 {} {
  set ::hit4220 1
  logline [format "BP4220 pc=%04X sp=%04X" [reg PC] [reg SP]]
  debug cont
}
proc bp_A000 {} {
  set ::hitA000 1
  logline [format "BPA000 pc=%04X sp=%04X" [reg PC] [reg SP]]
  debug cont
}
set ::bp1 [debug set_bp 0x4010 {} bp_4010]
set ::bp2 [debug set_bp 0x4220 {} bp_4220]
set ::bp3 [debug set_bp 0xA000 {} bp_A000]
after time 4000 {
  logline [format "FINAL pc=%04X sp=%04X hit4010=%d hit4220=%d hitA000=%d" [reg PC] [reg SP] $::hit4010 $::hit4220 $::hitA000]
  logline [format "BYTES4000=%02X %02X %02X %02X" [peek 0x4000] [peek 0x4001] [peek 0x4002] [peek 0x4003]]
  logline [format "SLOTS=%s/%s/%s/%s" [get_selected_slot 0] [get_selected_slot 1] [get_selected_slot 2] [get_selected_slot 3]]
  logline [format "DISASM=%s" [debug disasm [reg PC]]]
  exit
}
