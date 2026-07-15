set result_path "test/msx2-destroy/destroy_persist2.txt"
proc snap {label} {
    global result_path
    set f [open $result_path a]
    set cnt [debug read memory 0xC2D5]
    set scr [debug read memory 0xC00B]
    set px  [debug read memory 0xC001]
    set py  [debug read memory 0xC000]
    set c39  [debug read memory 0xC0A3]
    set c29  [debug read memory 0xC0A2]
    set c310 [debug read memory 0xC0B3]
    set c210 [debug read memory 0xC0B2]
    puts $f "$label count=$cnt screen=$scr pos=($px,$py) c(3,9)=$c39 c(2,9)=$c29 c(3,10)=$c310 c(2,10)=$c210"
    close $f
}
proc poll_home {} {
    set scr [debug read memory 0xC00B]
    if {$scr == 1} {
        keymatrixup 8 0x10
        keymatrixup 2 0x80
        after time 0.5 {
            snap "back_home"
            screenshot test/msx2-destroy/destroy_back.png
            after time 1 { exit }
        }
    } else {
        after time 0.25 { poll_home }
    }
}
after time 6  { keymatrixdown 8 0x01 }
after time 7  { keymatrixup 8 0x01 }
after time 8  { keymatrixdown 8 0x01 }
after time 9  { keymatrixup 8 0x01 }
after time 10 { keymatrixdown 8 0x01 }
after time 11 { keymatrixup 8 0x01 }
after time 13 {
    snap "boot"
    debug write memory 0xC001 96
    debug write memory 0xC000 144
    debug write memory 0xC008 0
    keymatrixdown 8 0x10
    keymatrixdown 2 0x80
}
after time 14.3 {
    keymatrixup 8 0x10
    keymatrixup 2 0x80
    snap "after_dig"
    screenshot test/msx2-destroy/destroy_dig.png
}
after time 15 {
    debug write memory 0xC001 200
    debug write memory 0xC000 128
    debug write memory 0xC008 1
    keymatrixdown 8 0x80
}
after time 18 {
    keymatrixup 8 0x80
    snap "east_room"
    keymatrixdown 8 0x10
    keymatrixdown 2 0x80
    poll_home
}
after time 40 { exit }
