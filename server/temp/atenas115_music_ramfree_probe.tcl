set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas115_music_ramfree_probe.log"
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
    set sp [reg SP]
    set p1 [mem8 0xC137]
    set p2 [mem8 0xC138]
    set p3 [mem8 0xC139]
    set flow [mem8 0xC11C]
    set screen [mem8 0xDF7D]
    set player [mem8 0xDF8C]
    set tick [mem16 0xE65F]
    set music [mem8 0xE66A]
    set px 0
    set py 0
    if {$player < 32} {
        set px [mem8 [expr {0xD91C + $player}]]
        set py [mem8 [expr {0xD93C + $player}]]
    }
    logline [format "%s pc=%04X sp=%04X banks=%02X/%02X/%02X flow=%02X screen=%02X player=%02X xy=%d,%d tick=%04X music=%02X" $tag $pc $sp $p1 $p2 $p3 $flow $screen $player $px $py $tick $music]
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }

proc tap_space {tag} {
    state "${tag}_before"
    down 1
    after time 0.18 [list state "${tag}_during"]
    after time 0.25 [list up 1]
    after time 0.35 [list state "${tag}_after"]
}

debug set_bp 0x4010 {} {
    state "BP_4010_RESET_OR_INIT"
    debug cont
}

after time 2.0  { state "t02" }
after time 4.0  { state "t04" }
after time 6.0  { state "t06" }
after time 7.0  { tap_space "intro_space" }
after time 8.0  { state "t08_after_intro_space" }
after time 10.0 { state "t10" }
after time 12.0 { tap_space "start_space" }
after time 13.0 { state "t13_after_start_space" }
after time 14.0 { state "t14" }
after time 15.0 { state "t15" }
after time 16.0 { state "t16"; close $f; exit }
