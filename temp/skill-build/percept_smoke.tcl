set out [open "percept_smoke.log" "w"]
after time 6 {
  puts $out "boot: flag_near=[debug read memory 0xC0E7] px=[debug read memory 0xC001] py=[debug read memory 0xC000] room=[debug read memory 0xC00B]"
  keymatrixdown 8 0x80
  after time 0.7 {
    keymatrixup 8 0x80
    after time 0.2 {
      puts $out "near: flag_near=[debug read memory 0xC0E7] px=[debug read memory 0xC001] py=[debug read memory 0xC000] room=[debug read memory 0xC00B]"
      screenshot -prefix percept_near
      flush $out
      close $out
      exit
    }
  }
}
