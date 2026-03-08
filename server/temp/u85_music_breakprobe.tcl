set __rom "C:/Users/salam/Documents/Programacion/Mideas/server/temp/MyMSXGame13_looptick.rom"
set __log "C:/Users/salam/Documents/Programacion/Mideas/server/temp/u85_music_breakprobe.log"
set __hits 0

proc log_line {line} {
  set fh [open $::__log "a"]
  puts $fh $line
  close $fh
}

proc maybe_finish {} {
  if {$::__hits >= 3} {
    log_line "done"
    exit
  }
  debug cont
}

proc on_music_play {} {
  incr ::__hits
  log_line "music_play_track pc=[format %04X [reg PC]] a=[format %02X [reg A]] b=[format %02X [expr {[reg BC] >> 8}]] active=[peek 0xD14B] muted=[peek 0xD14C] pt3=[peek 0xD172]"
  debug remove_bp $::__bp_play
  maybe_finish
}

proc on_music_update {} {
  incr ::__hits
  log_line "music_update pc=[format %04X [reg PC]] active=[peek 0xD14B] muted=[peek 0xD14C] pt3=[peek 0xD172] dely=[peek 0xD1EC]"
  debug remove_bp $::__bp_update
  maybe_finish
}

proc on_pt3_rout {} {
  incr ::__hits
  log_line "PT3_ROUT pc=[format %04X [reg PC]] mixer=[peek 0xD2B9] ampA=[peek 0xD2BA] ampB=[peek 0xD2BB] ampC=[peek 0xD2BC]"
  debug remove_bp $::__bp_rout
  maybe_finish
}

set fh [open $__log "w"]
puts $fh "breakprobe start"
close $fh

if {[catch {carta $__rom} err]} {
  log_line "load error: $err"
  exit 1
}

set __bp_play [debug set_bp 0x53EE {} {on_music_play}]
set __bp_update [debug set_bp 0x5421 {} {on_music_update}]
set __bp_rout [debug set_bp 0x59EC {} {on_pt3_rout}]

reset
debug cont
vwait forever
