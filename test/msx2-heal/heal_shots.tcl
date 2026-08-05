proc M {a} { return [debug read memory $a] }
set ::shot 0
proc watch {n} {
    if {[M 0xC1FD] == 4 && $::shot == 0} {
        set ::shot 1
        after time 0.2 { screenshot -raw "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-heal/heal_hud_4.png" }
    }
    if {$n > 0} { after frame [list watch [expr {$n-1}]] }
}
after time 8 {
    keymatrixdown 8 0x80
    watch 200
    after time 2.0 {
        keymatrixup 8 0x80
        after time 0.5 {
            screenshot -raw "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-heal/heal_hud_5.png"
            after time 0.3 { exit }
        }
    }
}
