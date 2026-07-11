set ::out [open "percept_dbg.log" "w"]
proc log_replay {} {
  set hl [reg HL]
  set bc [reg BC]
  set bytes ""
  for {set i 0} {$i < 15} {incr i} {
    append bytes [format "%02X " [debug read memory [expr {$hl + $i}]]]
  }
  puts $::out "replay entry: HL=[format %04X $hl] BC=[format %04X $bc] blk0: $bytes"
  flush $::out
}
debug set_bp 0x428D {} { log_replay }
after time 6 {
  puts $::out "--- pressing I (open) ---"
  flush $::out
  keymatrixdown 3 0x40
  after time 0.3 {
    keymatrixup 3 0x40
    after time 0.2 {
      puts $::out "--- pressing I (close) ---"
      flush $::out
      keymatrixdown 3 0x40
      after time 0.3 {
        keymatrixup 3 0x40
        after time 0.3 {
          close $::out
          exit
        }
      }
    }
  }
}
