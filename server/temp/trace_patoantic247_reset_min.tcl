set ::logfile "C:/Users/salam/Documents/Programacion/Mideas/server/temp/trace_patoantic247_reset_min.log"
file delete -force $::logfile

set ::c_init 0
set ::c_restart 0
set ::c_gf 0
set ::c_irq 0

proc logline {msg} {
  set fh [open $::logfile a]
  puts $fh $msg
  close $fh
  puts $msg
}

proc on_init {} {
  incr ::c_init
  logline [format "init#%d pc=%04X sp=%04X" $::c_init [reg PC] [reg SP]]
  debug cont
}

proc on_restart {} {
  incr ::c_restart
  logline [format "restart#%d pc=%04X sp=%04X" $::c_restart [reg PC] [reg SP]]
  debug cont
}

proc on_gf {} {
  incr ::c_gf
  logline [format "gf#%d pc=%04X sp=%04X" $::c_gf [reg PC] [reg SP]]
  debug cont
}

proc on_irq {} {
  incr ::c_irq
  logline [format "irq#%d pc=%04X sp=%04X" $::c_irq [reg PC] [reg SP]]
  debug cont
}

logline "TRACE_START"
debug set_bp 0x4010 {} on_init
debug set_bp 0x401C {} on_restart
debug set_bp 0xA008 {} on_gf
debug set_bp 0x0038 {} on_irq

after realtime 6000 {
  logline [format "FINAL pc=%04X sp=%04X init=%d restart=%d gf=%d irq=%d" [reg PC] [reg SP] $::c_init $::c_restart $::c_gf $::c_irq]
  exit
}
