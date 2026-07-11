set ::hits 0
debug set_bp 0x4E0F 1 { incr ::hits }
after time 3 {
    # press SPACE (trigger) a few times to pass any PRESS KEY gate
    keymatrixdown 8 0x01
    after time 0.3 { keymatrixup 8 0x01
      after time 0.3 {
        keymatrixdown 4 0x08
        after time 0.3 { keymatrixup 4 0x08
          after time 2 {
            set fh [open "test/keytest_stomp.txt" w]
            puts $fh "input_gate_hits_after_keypress=$::hits y=[debug read memory 0xC001] flags=[debug read memory 0xC00A]"
            close $fh
            exit
          }
        }
      }
    }
}
