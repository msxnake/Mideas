
set result [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-intro/intro_smoke_result.txt" w]
set fails 0
set music_seen_off 0
proc rd {a} { return [debug read memory $a] }
proc vram {a} { return [debug read "physical VRAM" $a] }
proc check {name cond detail} {
  global result fails
  if {$cond} { puts $result "ok    $name" } else { puts $result "FAIL  $name ($detail)"; incr fails }
  flush $result
}
# number of nibbles equal to `c` in `n` bytes of page 0 starting at `addr`
proc nibbles {addr n c} {
  set k 0
  for {set i 0} {$i < $n} {incr i} {
    set b [vram [expr {$addr + $i}]]
    if {(($b >> 4) & 15) == $c} { incr k }
    if {($b & 15) == $c} { incr k }
  }
  return $k
}
# bytes of a page-0 rectangle (x, w in bytes) as a Tcl list, for the 1 bpp comparison
proc dump_rect {x y w h} {
  set out {}
  for {set r 0} {$r < $h} {incr r} {
    for {set i 0} {$i < $w} {incr i} { lappend out [vram [expr {($y + $r) * 128 + $x + $i}]] }
  }
  return $out
}
set mono 0
set mono_dump {}
proc press {} { keymatrixdown 8 0x01; after time 0.2 { keymatrixup 8 0x01 } }
set slides_a 0xE603
set steps_a 0xE606
set marker_a 0xE621
set music_a 0xC400
set intro_active 0
# Music must never drop once the Music node has started it: sample every 0.25 s from t=9.
proc music_watch {} {
  global music_a music_seen_off intro_active result
  if {[rd $music_a] != 1} { incr music_seen_off; puts $result "note  music_active=[rd $music_a] at t=[format %.2f [machine_info time]]" }
  after time 0.25 music_watch
}
set throttle off
set joy_mode "space"
set joy 0
set joy1_a 0x8093
set joy2_a 0x80AA
if {$joy_mode ne "space"} {
  set jaddr [expr {$joy_mode eq "joy1" ? $joy1_a : $joy2_a}]
  # opcode check: the same address exists in the other banks mapped at #8000
  debug set_bp $jaddr {$joy == 1 && [debug read memory $jaddr] == 0xE6 && [debug read memory [expr {$jaddr + 1}]] == 0x10} { reg A 0 }
}
proc press_intro {} {
  global joy_mode joy
  if {$joy_mode eq "space"} { press } else { set joy 1; after time 0.2 { set ::joy 0 } }
}
set expect_music [expr {"keep" ne "none"}]

# The driver reacts to the intro's own "waiting for a press" flag instead of fixed times, so a slower
# BIOS boot or a longer transition only delays the test. k = index of the waiting moment.
set k 0
set started 0
set busy 0
set armed 1
set marker_on 0
set marker_off 0
set marker_px 0

proc finish {} {
  global result fails mono mono_dump
  if {$mono} {
    set f [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-intro/intro_mono_vram.txt" w]
    foreach item $mono_dump { puts $f "[lindex $item 0] [join [lindex $item 1] { }]" }
    close $f
  }
  puts $result [expr {$fails == 0 ? "RESULT PASS" : "RESULT FAIL ($fails)"}]
  close $result
  exit
}
proc timeout {} {
  global result fails k slides_a steps_a marker_a
  puts $result "FAIL  timeout: waiting moment $k never came (slides=[rd $slides_a] steps=[rd $steps_a] marker=[rd $marker_a])"
  incr fails
  finish
}
after time 120 timeout

# Music must never drop once the intro is up (the Music node started it before).
proc music_watch {} {
  global music_a music_seen_off result
  if {[rd $music_a] != 1} { incr music_seen_off; puts $result "note  music_active=[rd $music_a] at t=[format %.2f [machine_info time]]" }
  after time 0.25 music_watch
}

# The presentation before the intro waits for a key: press until the intro shows its first wait.
proc press_presentation {} {
  global started
  if {!$started} { press; after time 1.5 press_presentation }
}
after time 5.5 press_presentation

# The "more" triangle blinks every 16 frames: over ~1.2 s it must be seen drawn (RAM flag and slot-15
# pixels at the corner of the zone) and hidden again.
proc marker_watch {n} {
  global marker_a marker_on marker_off marker_px
  if {[rd $marker_a] == 1} {
    incr marker_on
    if {[nibbles [expr {180*128+116}] 3 15] > 0} { incr marker_px }
  } else { incr marker_off }
  if {$n > 0} { after time 0.05 [list marker_watch [expr {$n - 1}]] }
}

proc done_press {} { global busy armed; press_intro; set busy 0; set armed 0 }

proc on_wait {k} {
  global slides_a steps_a marker_a music_a expect_music started music_seen_off marker_on marker_off marker_px
  set slides [rd $slides_a]
  set steps [rd $steps_a]
  if {$k == 0} {
    set started 1
    if {$expect_music} { music_watch }
    check "slide1 step1 reached (slides left=1, steps left=1)" [expr {$slides == 1 && $steps == 1}] "slides=$slides steps=$steps"
    if {$::mono} { lappend ::mono_dump [list img_a [dump_rect 16 8 96 120]] }
    # image dest (32,8) 192x120: the sun (slot 10) lands around pixel (174,39) = byte 87, row 39
    check "image pixels in VRAM (sun, slot 10)" [expr {[nibbles [expr {39*128+80}] 16 10] > 10}] "count=[nibbles [expr {39*128+80}] 16 10]"
    check "typed text in VRAM (slot 15 in the zone rows)" [expr {[nibbles [expr {138*128+8}] 40 15] > 8}] "count=[nibbles [expr {138*128+8}] 40 15]"
    check "music during the intro follows the option (keep)" [expr {[rd $music_a] == $expect_music}] "music_active=[rd $music_a] expected=$expect_music"
    # the runtime displays 212 lines: the slide colour (slot 1) must reach rows 192..211 too
    check "background fills the 212-line display" [expr {[nibbles [expr {205*128+10}] 20 1] > 30}] "count=[nibbles [expr {205*128+10}] 20 1]"
    marker_watch 24
    after time 1.4 {
      check "'more' marker blinks (drawn and hidden)" [expr {$marker_on > 0 && $marker_off > 0}] "on=$marker_on off=$marker_off"
      check "'more' marker really painted in VRAM" [expr {$marker_px > 0}] "pixel samples=$marker_px"
      done_press
    }
  } elseif {$k == 1} {
    check "slide1 step2 reached (steps left=0)" [expr {$slides == 1 && $steps == 0}] "slides=$slides steps=$steps"
    done_press
  } elseif {$k == 2} {
    check "slide2 step1 reached (slides left=0, steps left=1)" [expr {$slides == 0 && $steps == 1}] "slides=$slides steps=$steps"
    if {$::mono} { lappend ::mono_dump [list img_b [dump_rect 32 40 62 48]] }
    # slide 2 title zone x=64,y=8 -> byte 32, row 8+: custom font glyph pixels in slot 15
    check "custom-font title typed" [expr {[nibbles [expr {10*128+32}] 64 15] > 6}] "count=[nibbles [expr {10*128+32}] 64 15]"
    done_press
  } elseif {$k == 3} {
    check "slide2 last step reached (steps left=0)" [expr {$slides == 0 && $steps == 0}] "slides=$slides steps=$steps"
    check "body text of the last step in VRAM" [expr {[nibbles [expr {102*128+12}] 100 15] > 20}] "count=[nibbles [expr {102*128+12}] 100 15]"
    done_press
    # the last press leaves the intro: the room is loaded and the marker is off
    after time 3 {
      check "intro finished, marker cleared" [expr {[rd $marker_a] == 0}] "marker=[rd $marker_a]"
      check "game room drawn after the intro (not the slide colour)" [expr {[nibbles [expr {14*128+8}] 40 2] < 20}] "count=[nibbles [expr {14*128+8}] 40 2]"
      check "music after the intro follows the option (keep)" [expr {[rd $music_a] == $expect_music}] "music_active=[rd $music_a] expected=$expect_music"
      if {$expect_music} { check "music never dropped" [expr {$music_seen_off == 0}] "dropped=$music_seen_off samples" }
      finish
    }
  }
}

proc poll {} {
  global marker_a k busy armed
  set m [rd $marker_a]
  if {$m == 0} { set armed 1 }
  if {!$busy && $armed && $m == 1} {
    set busy 1
    set armed 0
    set n $k
    incr k
    on_wait $n
  }
  after time 0.05 poll
}
debug write memory $marker_a 0
after time 5 poll
