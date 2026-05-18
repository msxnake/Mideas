set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/ascii16_gameplay_movement_probe.log"
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
    set screen [mem8 0xE167]
    set input [mem8 0xC000]
    set btn [mem8 0xC002]
    set px [mem16 0xE171]
    set py [mem16 0xE173]
    set enabled [mem8 0xE175]
    set entity [mem8 0xE176]
    set vx [mem8 0xE177]
    set vy [mem8 0xE178]
    set irq [mem16 0xE809]
    logline [format "%s pc=%04X sp=%04X banks=%02X/%02X/%02X screen=%02X input=%02X btn=%02X player=%02X ent=%02X xy=%d,%d v=%02X/%02X irq=%d" $tag $pc $sp $p1 $p2 $p3 $screen $input $btn $enabled $entity $px $py $vx $vy $irq]
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
    after time 0.35 [list state ${tag}_during]
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
    state "BP_4010_RESET_OR_BOOT"
    debug cont
}

after time 7.0 { tap_space "intro_spc" }
after time 12.0 { tap_space "start_spc" }
after time 13.4 { shot "patoantic248_ascii16_gameplay_start.png" "gameplay_start" }
after time 14.0 { hold "RIGHT" {128} 1.1 }
after time 15.4 { shot "patoantic248_ascii16_after_right.png" "after_right" }
after time 16.0 { hold "LEFT" {16} 1.1 }
after time 17.4 { shot "patoantic248_ascii16_after_left.png" "after_left" }
after time 19.0 {
    state "FINAL"
    close $f
    exit
}
