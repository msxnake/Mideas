# Directed regression of fast_copy_to_vram_chunked (C2-parche) v3.
# Source build asm sha256: 1f88702ab3b2a4193c89a71a5560deb06cc5b18c53e9513f5aa1872e07138278
# Driver ROM sha256: 04e156d076d5fc8013f661b56db21dee9a489d408dc24c68a24bc360b0b20454
set f [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-screen5-c2trans/chunked_helper_directed.txt" w]
set throttle off
set failures 0
set boots 0
set prefills 0
set verifies 0
set armed 0
set pw 0
set cnt_start [lrepeat 4 0]
set cnt_end [lrepeat 4 0]
array set basereg {}
set cases [list [list 12288 0 252 5 {12288 12289 12290 12291 12292 12293 12294 12295 12296 12297 12298 12299 12300 12301 12302 12303}] [list 30720 1 245 22 {30721 30722 30723 30724 30725 30726 30727 30728 30729 30730 30731 30732 30733 30734 30735 30736}] [list 47104 255 238 39 {47359 47360 47361 47362 47363 47364 47365 47366 47367 47368 47369 47370 47371 47372 47373 47374}] [list 63488 256 231 56 {63744 63745 63746 63747 63748 63749 63750 63751 63752 63753 63754 63755 63756 63757 63758 63759}] [list 12288 257 224 73 {12545 12546 12547 12548 12549 12550 12551 12552 12553 12554 12555 12556 12557 12558 12559 12560}] [list 30720 512 217 90 {31232 31233 31234 31235 31236 31237 31238 31239 31240 31241 31242 31243 31244 31245 31246 31247}] [list 47104 1024 210 107 {48128 48129 48130 48131 48132 48133 48134 48135 48136 48137 48138 48139 48140 48141 48142 48143}] [list 63488 2048 203 124 {49152 49153 49154 49155 49156 49157 49158 49159 49160 49161 49162 49163 49164 49165 49166 49167}]]
proc check {yes msg} { if {!$yes} { incr ::failures; puts $::f "FAIL $msg"; flush $::f } }
proc regsnap {} {
  set s {}
  for {set r 0} {$r < 24} {incr r} { lappend s [debug read {VDP regs} $r] }
  return $s
}
proc seqval {base k} { return [expr {($base + 3*$k + 29*($k/256)) % 256}] }
proc cntval {} {
  set lo [debug read memory 49164]
  set hi [debug read memory [expr {49164+1}]]
  return [expr {$hi*256 + $lo}]
}
proc passmode {p} { return [expr {$p <= 1 ? 7 : 0}] }
proc prefill {p c} {
  set cc [lindex $::cases $c]
  set dst [lindex $cc 0]
  set len [lindex $cc 1]
  set poi [lindex $cc 2]
  set ga [lindex $cc 4]
  incr ::prefills
  if {![info exists ::basereg($p)]} { set ::basereg($p) [regsnap] }
  lset ::cnt_start $p [cntval]
  debug write memory 49152 238
  for {set k 1} {$k <= 16} {incr k} { debug write VRAM [expr {$dst-$k}] $poi }
  for {set k 0} {$k < $len} {incr k} { debug write VRAM [expr {$dst+$k}] $poi }
  foreach a $ga { debug write VRAM $a $poi }
  if {$c == 0} { set ::armed 1 }
}
proc verify {p c} {
  set cc [lindex $::cases $c]
  set dst [lindex $cc 0]
  set len [lindex $cc 1]
  set poi [lindex $cc 2]
  set bs [lindex $cc 3]
  set ga [lindex $cc 4]
  incr ::verifies
  set res [debug read memory 49152]
  check [expr {$res == 0}] "p$p c$c RESULT=$res (0 ok 1 ix 2 iy 238 unreached)"
  if {$c == 0} {
    check [expr {$::armed == 1}] "p$p c0 armed flag lost"
    set ::armed 0
    check [expr {$::pw == 0}] "p$p c0 port writes during BC=0 helper: $::pw"
  }
  set iff [reg IFF]
  check [expr {$iff == [passmode $p]}] "p$p c$c IFF=$iff want [passmode $p] after helper"
  set bad 0
  for {set k 0} {$k < $len} {incr k} {
    if {[debug read VRAM [expr {$dst+$k}]] != [seqval $bs $k]} {
      incr bad
      if {$bad <= 20} { puts $::f "FAIL p$p c$c byte +$k got [debug read VRAM [expr {$dst+$k}]] want [seqval $bs $k]" }
    }
  }
  check [expr {$bad == 0}] "p$p c$c copy mismatches=$bad/$len"
  set badg 0
  for {set k 1} {$k <= 16} {incr k} {
    if {[debug read VRAM [expr {$dst-$k}]] != $poi} { incr badg }
  }
  check [expr {$badg == 0}] "p$p c$c guard-below mismatches=$badg/16"
  set bada 0
  foreach a $ga {
    if {[debug read VRAM $a] != $poi} { incr bada }
  }
  check [expr {$bada == 0}] "p$p c$c guard-after mismatches=$bada/16"
  set r14 [debug read {VDP regs} 14]
  if {$len == 0} {
    check [expr {$r14 == 2}] "p$p c$c R14=$r14 want 2 (BC=0 must not touch R14)"
  } else {
    check [expr {$r14 == 0}] "p$p c$c R14=$r14 want 0"
  }
  set cur [regsnap]
  for {set r 0} {$r < 24} {incr r} {
    set b [lindex $::basereg($p) $r]
    set v [lindex $cur $r]
    if {$b != $v && !($r == 14 && $len > 0 && $v == 0)} {
      check [expr {0}] "p$p c$c VDP R#$r changed $b -> $v"
    }
  }
  if {$c == 7} { lset ::cnt_end $p [cntval] }
  puts $::f "CASE p$p c$c len=$len dst=[format %04X $dst] RESULT=$res IFF=$iff R14=$r14 leftover BC=[format %04X [reg BC]]"
  flush $::f
}
debug set_bp 17011 {} { if {$::armed} { incr ::pw }; debug cont }
debug set_bp 17018 {} { if {$::armed} { incr ::pw }; debug cont }
debug set_bp 17055 {} { if {$::armed} { incr ::pw }; debug cont }
debug set_bp 17060 {} { if {$::armed} { incr ::pw }; debug cont }
debug set_bp 16400 {} { incr ::boots; puts $::f "INIT-HIT boots=$::boots"; flush $::f; debug cont }
debug set_bp 16825 {} {
  if {[catch {
    set a [reg A]
    set i [expr {$a & 127}]
    set p [expr {$i >> 4}]
    set c [expr {$i & 15}]
    if {$a >= 128} { puts $::f "PREFILL p$p c$c"; flush $::f; prefill $p $c } else { puts $::f "VERIFY p$p c$c"; flush $::f; verify $p $c }
  } e]} { incr ::failures; puts $::f "ERROR $e"; flush $::f }
  debug cont
}
debug set_bp 16822 {} {
  if {[catch {
    set done [debug read memory 49153]
    check [expr {$done == 170}] "DONE=$done (want 170=#AA; else run not completed)"
    check [expr {$::verifies == 32}] "verifies=$::verifies want 32"
    check [expr {$::prefills == 32}] "prefills=$::prefills want 32"
    check [expr {$::boots == 1}] "boots=$::boots"
    check [expr {[lindex $::cnt_end 0] > [lindex $::cnt_start 0]}] "pass0 IRQ mode not proven active: cnt [lindex $::cnt_start 0] -> [lindex $::cnt_end 0]"
    foreach p {2 3} {
      check [expr {[lindex $::cnt_start $p] == [lindex $::cnt_end $p]}] "pass$p CNT moved [lindex $::cnt_start $p] -> [lindex $::cnt_end $p] (DI mode not clean)"
    }
    check [expr {$::pw == 0}] "residual port writes: $::pw"
  } e]} { incr ::failures; puts $::f "ERROR $e" }
  puts $::f "verifies=$::verifies prefills=$::prefills boots=$::boots pw=$::pw cnt=[lindex $::cnt_start 0]/[lindex $::cnt_end 0] failures=$::failures"
  puts $::f [expr {$::failures == 0 ? "VERDICT: PASS" : "VERDICT: FAIL"}]
  puts $::f "RUN-COMPLETE"
  close $::f
  exit
}
after time 60 { puts $::f "VERDICT: FAIL timeout"; close $::f; exit }
