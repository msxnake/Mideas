set out [open "percept_anim_smoke.log" "w"]
proc snap {label} {
  global out
  puts $out "$label: flag_near=[debug read memory 0xC0E7] anim=[debug read memory 0xC1F0] px=[debug read memory 0xC001] py=[debug read memory 0xC000] room=[debug read memory 0xC00B]"
}
after time 6 {
  snap "boot"
  keymatrixdown 8 0x80
  after time 0.7 {
    keymatrixup 8 0x80
    after time 0.2 {
      snap "near_idle"
      screenshot -prefix percept_anim_near
      keymatrixdown 8 0x10
      after time 1.0 {
        keymatrixup 8 0x10
        after time 0.2 {
          snap "left_far"
          flush $out
          close $out
          exit
        }
      }
    }
  }
}
