set out [open "percept_parts_smoke.log" "w"]
proc snap {label} {
  global out
  puts $out "$label: cnt=[debug read memory 0xC0EA] inv=[debug read memory 0xC0EB] f0=[debug read memory 0xC0ED] f1=[debug read memory 0xC0EE] f2=[debug read memory 0xC0EF] near=[debug read memory 0xC0E7] px=[debug read memory 0xC001] py=[debug read memory 0xC000]"
}
after time 6 {
  snap "boot"
  keymatrixdown 8 0x80
  after time 0.7 {
    keymatrixup 8 0x80
    after time 0.2 {
      snap "collected"
      keymatrixdown 3 0x40
      after time 0.3 {
        keymatrixup 3 0x40
        after time 0.2 {
          snap "window_open"
          screenshot -prefix percept_window_open
          keymatrixdown 8 0x80
          after time 0.5 {
            keymatrixup 8 0x80
            snap "frozen_right_held"
            keymatrixdown 3 0x40
            after time 0.3 {
              keymatrixup 3 0x40
              after time 0.2 {
                snap "window_closed"
                screenshot -prefix percept_window_closed
                flush $out
                close $out
                exit
              }
            }
          }
        }
      }
    }
  }
}
