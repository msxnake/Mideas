
set result [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-intro/intro_midgame_result.txt" w]
set fails 0
proc rd {a} { return [debug read memory $a] }
proc note {msg} { global result; puts $result "note  $msg"; flush $result }
proc check {name cond detail} {
  global result fails
  if {$cond} { puts $result "ok    $name" } else { puts $result "FAIL  $name ($detail)"; incr fails }
  flush $result
}
proc room_sum {} {
  # rows 24..189 of page 0 (below the HUD band, above the letterbox): the drawn room
  set blk [debug read_block "physical VRAM" [expr {24*128}] [expr {166*128}]]
  binary scan $blk c* bytes
  set s 0
  foreach b $bytes { set s [expr {($s * 31 + ($b & 255)) & 0xFFFFFF}] }
  return $s
}
proc palette {} {
  set l {}
  for {set i 0} {$i < 32} {incr i} { lappend l [debug read "VDP palette" $i] }
  return $l
}
proc press {} { keymatrixdown 8 0x01; after time 0.2 { keymatrixup 8 0x01 } }
set marker_a 0xE621
set over_a 0xC1F8
set hp_a 0xC1FD
set scr_a 0xC00B
set music_a 0xC400
set slides_a 0xE603
set intro_seen 0
set music_off 0
set throttle_dummy 0
set throttle off
set music_mode "track"
set music_on_after_intro 0

after time 6 { press }
proc music_watch {} {
  global music_a music_off
  if {[rd $music_a] != 1} { incr music_off }
  after time 0.25 music_watch
}
after time [expr {$music_mode eq "track" ? 9 : 100}] { music_watch }

# 1. zone A running: remember the world, then leave it
after time 12 {
  global before_room before_pal before_hp before_scr
  set before_room [room_sum]
  set before_pal [palette]
  set before_hp [rd $hp_a]
  set before_scr [rd $scr_a]
  note "before: hearts=$before_hp screen=$before_scr room_sum=$before_room"
  debug write memory $hp_a 3    ;# zone A ends with 3 hearts: does the next WorldLink keep them?
  note "hearts set to 3 just before leaving zone A"
  debug write memory $over_a 1
}
# 2. while the intro shows, press SPACE whenever it is waiting (the "more" marker is on)
proc auto_press {} {
  global marker_a intro_seen
  if {[rd $marker_a] == 1} { incr intro_seen; press; after time 0.6 auto_press } else { after time 0.1 auto_press }
}
after time 12.3 { auto_press }

# 3. zone B running again
after time 34 {
  global before_room before_pal before_hp before_scr
  set room [room_sum]
  set pal [palette]
  set sprites_on [expr {([debug read "VDP regs" 8] & 2) == 0}]
  note "after:  hearts=[rd $hp_a] screen=[rd $scr_a] room_sum=$room intro_presses=$intro_seen"
  check "the intro ran between the zones (4 steps)" [expr {$intro_seen >= 4}] "waits=$intro_seen"
  check "game loop is back (game-over flag cleared)" [expr {[rd $over_a] == 0}] "flag=[rd $over_a]"
  check "same start room after the second WorldLink" [expr {[rd $scr_a] == $before_scr}] "before=$before_scr after=[rd $scr_a]"
  check "room on page 0 identical to zone A's start room" [expr {$room == $before_room}] "before=$before_room after=$room"
  check "game palette restored (slide palette gone)" [expr {$pal == $before_pal}] "differs"
  check "sprites re-enabled" $sprites_on "R#8=[debug read "VDP regs" 8]"
  # track: the intro starts the song -> never off after zone A ends. none/keep: leaving a zone silences it and
  # neither option restarts it -> off after the zone ended (the intro left it alone / silenced it).
  if {$music_mode eq "track"} {
    check "intro music option: song keeps playing through the intermission" [expr {$music_off == 0 && [rd $music_a] == 1}] "off_samples=$music_off active=[rd $music_a]"
  } else {
    check "music option '$music_mode': silent after leaving the zone" [expr {[rd $music_a] == 0}] "active=[rd $music_a]"
  }
  check "intro scratch flag cleared" [expr {[rd $marker_a] == 0}] "marker=[rd $marker_a]"
  puts $result [expr {$fails == 0 ? "RESULT PASS" : "RESULT FAIL ($fails)"}]
  close $result
  exit
}
