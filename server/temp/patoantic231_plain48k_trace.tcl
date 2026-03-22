set __log "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic231_plain48k_trace.log"
set __hits_show 0
set __hits_map 0
set __hits_decomp 0
set __hits_restore 0

proc log_line {line} {
  set fh [open $::__log "a"]
  puts $fh $line
  close $fh
}

proc maybe_continue {} {
  debug cont
}

proc on_show {} {
  incr ::__hits_show
  log_line [format "show #%d pc=%04X sp=%04X" $::__hits_show [reg PC] [reg SP]]
  maybe_continue
}

proc on_map {} {
  incr ::__hits_map
  log_line [format "map #%d pc=%04X sp=%04X a=%02X" $::__hits_map [reg PC] [reg SP] [reg A]]
  maybe_continue
}

proc on_decomp {} {
  incr ::__hits_decomp
  log_line [format "decomp #%d pc=%04X sp=%04X hl=%04X de=%04X" $::__hits_decomp [reg PC] [reg SP] [reg HL] [reg DE]]
  maybe_continue
}

proc on_restore {} {
  incr ::__hits_restore
  log_line [format "restore #%d pc=%04X sp=%04X" $::__hits_restore [reg PC] [reg SP]]
  maybe_continue
}

proc finish_trace {} {
  log_line [format "timeout pc=%04X sp=%04X show=%d map=%d decomp=%d restore=%d" [reg PC] [reg SP] $::__hits_show $::__hits_map $::__hits_decomp $::__hits_restore]
  exit
}

set fh [open $__log "w"]
puts $fh "trace start"
close $fh

set __bp_show [debug set_bp 0x7995 {} {on_show}]
set __bp_map [debug set_bp 0xBB7C {} {on_map}]
set __bp_decomp [debug set_bp 0xBBF9 {} {on_decomp}]
set __bp_restore [debug set_bp 0xBBE6 {} {on_restore}]

reset
after time 8000 {finish_trace}
debug cont
vwait forever
