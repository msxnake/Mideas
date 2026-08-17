set tag $env(HALO_TAG)
after time 9 { keymatrixdown 8 0x80 }
after time 9.7 { keymatrixup 8 0x80 }
after time 10.5 { screenshot -prefix look_${tag}_ ; after time 1 { exit } }
