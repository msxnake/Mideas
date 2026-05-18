set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc63_boss_probe.log"
set f [open $log_path "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} {
    set lo [mem8 $addr]
    set hi [mem8 [expr {$addr + 1}]]
    return [expr {$lo | ($hi << 8)}]
}

proc state {tag} {
    set pc [reg PC]
    set active [mem8 0xC020]
    set bx [mem8 0xC021]
    set by [mem8 0xC022]
    set bcount [mem8 0xC030]
    set bindex [mem8 0xC031]
    set btimer [mem8 0xC032]
    set btype [mem8 0xC038]
    set baux0 [mem8 0xC03C]
    set proj [mem8 0xC047]
    set px [mem8 0xC048]
    set py [mem8 0xC049]
    set pdist [mem8 0xC04E]
    set tick [mem8 0xC005]
    logline [format "%s pc=%04X tick=%02X bossActive=%02X bossXY=%d,%d beh=count:%d idx:%d timer:%d type:%d aux0:%d projectile=active:%d xy:%d,%d dist:%d" $tag $pc $tick $active $bx $by $bcount $bindex $btimer $btype $baux0 $proj $px $py $pdist]
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {tag} {
    state "${tag}_before"
    down 1
    after time 0.18 [list up 1]
    after time 0.22 [list state "${tag}_after"]
}

after time 1.0 { state "t01" }
after time 3.0 { state "t03" }
after time 7.0 { tap_space "space1" }
after time 9.0 { state "t09" }
after time 12.0 { tap_space "space2" }
after time 13.0 { state "t13" }
after time 14.0 { state "t14" }
after time 15.0 { state "t15" }
after time 16.0 { state "t16" }
after time 17.0 { state "t17" }
after time 18.0 { state "t18" }
after time 19.0 { state "t19" }
after time 20.0 { state "t20"; close $f; exit }
