set out [open "percept_iso.log" "w"]
proc snap {label} {
  global out
  puts $out "$label: inv=[debug read memory 0xC0EB] page=[debug read memory 0xC0D0] comp=[debug read memory 0xC0D1] px=[debug read memory 0xC001]"
  flush $out
}
after time 6 {
  keymatrixdown 3 0x40
  after time 0.3 {
    keymatrixup 3 0x40
    after time 0.2 {
      snap "open"
      screenshot -prefix iso_open
      keymatrixdown 3 0x40
      after time 0.1 {
        keymatrixup 3 0x40
        after time 0.05 {
          snap "closed_fast"
          screenshot -prefix iso_closed_fast
          after time 1.0 {
            snap "closed_late"
            screenshot -prefix iso_closed_late
            close $out
            exit
          }
        }
      }
    }
  }
}
