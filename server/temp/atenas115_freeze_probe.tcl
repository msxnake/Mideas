set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas115_freeze_probe.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas115_freeze_probe_shots"
file mkdir $shot_dir
set f [open $log_path "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} {
    if {[catch {debug read memory $addr} value]} {
        return 0
    }
    return $value
}

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
    set p4 [mem8 0xC13A]
    set flow [mem8 0xC11C]
    set screen [mem8 0xE27E]
    set irq [mem16 0xE960]
    set inirq [mem8 0xE965]
    set muted [mem8 0xE96C]
    set track [mem8 0xE96E]
    set active [mem8 0xE969]
    set row [mem8 0xE972]
    set countdown [mem8 0xE970]
    logline [format "%s pc=%04X sp=%04X bank=%02X/%02X/%02X/%02X flow=%02X screen=%02X irq=%04X inirq=%02X music=%02X muted=%02X track=%02X row=%02X cd=%02X" $tag $pc $sp $p1 $p2 $p3 $p4 $flow $screen $irq $inirq $active $muted $track $row $countdown]
}

proc shot {name tag} {
    global shot_dir
    state $tag
    if {[catch {screenshot "$shot_dir/$name"} err]} {
        logline "SHOTERR $name $err"
    } else {
        logline "SHOTOK $name"
    }
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {tag} {
    state "${tag}_before"
    down 1
    after time 0.20 { up 1 }
    after time 0.25 [list state "${tag}_after"]
}

debug set_bp 0x4010 {} {
    state "BP_INIT_4010"
    debug cont
}
debug set_bp 0x6200 {} {
    state "BP_GAMEFLOW_MUSIC_6200"
    debug cont
}
debug set_bp 0x55E7 {} {
    state "BP_CALL_MUSIC_RESIDENT_55E7"
    debug cont
}
debug set_bp 0x4C2E {} {
    state "BP_MUSIC_FAR_4C2E"
    debug cont
}
debug set_bp 0x626C {} {
    state "BP_MUSIC_EXEC_626C"
    debug cont
}
debug set_bp 0x65BA {} {
    state "BP_MUSIC_PLAY_65BA"
    debug cont
}
debug set_bp 0x6248 {} {
    state "BP_MUSIC_STOP_6248"
    debug cont
}

after time 1.0 { shot "t01.png" "T01" }
after time 2.0 { state "T02" }
after time 3.0 { state "T03" }
after time 4.0 { state "T04" }
after time 5.0 { state "T05" }
after time 6.0 { state "T06" }
after time 7.0 { tap_space "SPACE1" }
after time 8.0 { state "T08" }
after time 9.0 { tap_space "SPACE2" }
after time 10.0 { shot "t10.png" "T10" }
after time 12.0 { shot "t12.png" "T12" }
after time 14.0 { state "T14" }
after time 16.0 { shot "t16.png" "T16" }
after time 18.0 { state "T18" }
after time 20.0 { shot "t20.png" "T20"; close $f; exit }
