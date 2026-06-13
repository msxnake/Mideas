after time 6 { 
  set fh [open $::env(OUT) w]
  puts $fh "flags=[debug read memory 0xC00A] y=[debug read memory 0xC001]"
  close $fh
  exit
}
