set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/ascii16_gameplay_probe.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/screenshots"
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
    set p1 [mem8 0xC11D]
    set p2 [mem8 0xC11E]
    set p3 [mem8 0xC11F]
    set p4 [mem8 0xC120]
    set flow [mem8 0xC104]
    set screen [mem8 0xE187]
    set input [mem8 0xC000]
    set enabled [mem8 0xE195]
    set px [mem16 0xE191]
    set py [mem16 0xE193]
    set irq [mem16 0xE829]
    logline [format "%s pc=%04X sp=%04X banks=%02X/%02X/%02X/%02X flow=%02X screen=%02X input=%02X player=%02X xy=%d,%d irq=%d" $tag $pc $sp $p1 $p2 $p3 $p4 $flow $screen $input $enabled $px $py $irq]
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }

proc release {tag masks} {
    foreach m $masks { up $m }
    state ${tag}_after
}

proc hold {tag masks duration} {
    state ${tag}_before
    foreach m $masks { down $m }
    after time 0.30 [list state ${tag}_during]
    after time $duration [list release $tag $masks]
}

proc tap_space {tag} {
    hold $tag {1} 0.22
}

proc shot {name tag} {
    global shot_dir
    state $tag
    if {[catch {screenshot "$shot_dir/$name"} err]} {
        logline "SHOTERR $err"
    } else {
        logline "SHOTOK $name"
    }
}

debug set_bp 0x4010 {} {
    state "BP_4010_RESET_OR_INIT"
    debug cont
}
debug set_bp 0x0000 {} {
    state "BP_0000"
    debug cont
}

after time 7.0 { tap_space "intro_spc" }
after time 12.0 { tap_space "start_spc" }
after time 13.6 { shot "patoantic248_ascii16_gameplay_start_clean.png" "gameplay_start" }
after time 14.2 { hold "RIGHT" {128} 1.0 }
after time 15.5 { shot "patoantic248_ascii16_after_right_clean.png" "after_right" }
after time 16.0 { hold "LEFT" {16} 1.0 }
after time 17.3 { shot "patoantic248_ascii16_after_left_clean.png" "after_left" }
after time 18.0 {
    state "FINAL"
    close $f
    exit
}
