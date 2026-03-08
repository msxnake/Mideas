proc dump_u85_state {} {
  set ic_lo [peek 0xD142]
  set ic_hi [peek 0xD143]
  set music_active [peek 0xD14B]
  set music_muted [peek 0xD14C]
  set music_track [peek 0xD14E]
  set pt3_setup [peek 0xD172]
  set task4_lo [peek 0xD134]
  set task4_hi [peek 0xD135]
  set line [format "U85 interrupt_counter=%d music_active=%d music_muted=%d music_track=%d pt3_setup=%d task4=%02X%02X" [expr {$ic_lo + 256 * $ic_hi}] $music_active $music_muted $music_track $pt3_setup $task4_hi $task4_lo]
  set f [open "C:/Users/salam/Documents/Programacion/Mideas/server/temp/u85_runtime_probe.log" a]
  puts $f $line
  close $f
}

after time 2000 {
  dump_u85_state
}
after time 4000 {
  dump_u85_state
  exit
}
