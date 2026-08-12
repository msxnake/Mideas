set logpath "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-lighting/nuts_log.txt"
set log [open $logpath w]

proc dump {tag} {
    global log
    set nuts [debug read memory 0xD00B]
    set b0   [debug read memory 0xC0DA]
    set b1   [debug read memory 0xC0DE]
    set b2   [debug read memory 0xC0E2]
    set px   [debug read memory 0xC001]
    set py   [debug read memory 0xC000]
    puts $log "$tag nuts=$nuts bullets=($b0,$b1,$b2) player=($px,$py)"
    flush $log
}

# 1) Fire with an empty pouch: no bullet may appear.
after time 4 { dump t4_before_any }
after time 4.2 { keymatrixdown 4 0x08 }
after time 4.6 { keymatrixup 4 0x08 ; dump t4_fire_empty }

# 2) Walk right over the three nuts and the gem.
after time 5 { keymatrixdown 8 0x80 }
after time 8 { keymatrixup 8 0x80 ; dump t8_after_walk }

# 3) Fire three times: each shot must spend one nut, the fourth must be refused.
after time 8.5 { keymatrixdown 4 0x08 }
after time 8.8 { keymatrixup 4 0x08 ; dump t9_shot1 }
after time 9.3 { keymatrixdown 4 0x08 }
after time 9.6 { keymatrixup 4 0x08 ; dump t10_shot2 }
after time 10.1 { keymatrixdown 4 0x08 }
after time 10.4 { keymatrixup 4 0x08 ; dump t11_shot3 }
after time 10.9 { keymatrixdown 4 0x08 }
after time 11.2 { keymatrixup 4 0x08 ; dump t12_shot4_should_fail }
after time 12 {
    dump t13_end
    screenshot -prefix nuts_end_
    close $log
    exit
}
