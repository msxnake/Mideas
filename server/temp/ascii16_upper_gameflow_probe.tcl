set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/ascii16_upper_gameflow_probe.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/ascii16_upper_gameflow_probe_shots"
file mkdir $shot_dir
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
    set p1 [mem8 0xC053]
    set p2 [mem8 0xC054]
    set p3 [mem8 0xC055]
    set p4 [mem8 0xC056]
    set flow [mem8 0xC104]
    set screen [mem8 0xE531]
    set irq [mem16 0xE788]
    set inirq [mem8 0xE78D]
    set px [mem16 0xE53B]
    set py [mem16 0xE53D]
    set input [mem8 0xC000]
    set btn [mem8 0xC002]
    logline [format "%s pc=%04X sp=%04X bank=%02X/%02X/%02X/%02X flow=%02X screen=%02X irq=%04X inirq=%02X pos=%d,%d input=%02X btn=%02X" $tag $pc $sp $p1 $p2 $p3 $p4 $flow $screen $irq $inirq $px $py $input $btn]
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }

proc tap_space {tag} {
    state ${tag}_before
    down 1
    after time 0.25 [list up 1]
    after time 0.35 [list state ${tag}_after]
}

proc hold_key {tag mask duration} {
    state ${tag}_before
    down $mask
    after time $duration [list up $mask]
    after time [expr {$duration + 0.15}] [list state ${tag}_after]
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
    state "BP_4010"
    debug cont
}

debug set_bp 0x8DBA {} {
    state "BP_gameflow_start"
    debug cont
}

debug set_bp 0x8DED {} {
    state "BP_gameflow_handle_start"
    debug cont
}

after time 1.0  { state "t1" }
after time 4.0  { state "t4" }
after time 7.0  { tap_space "space1" }
after time 10.0 { state "t10" }
after time 12.0 { tap_space "space2" }
after time 13.2 { shot "ascii16_upper_t13.png" "t13" }
after time 14.0 { hold_key "right" 128 1.0 }
after time 15.4 { shot "ascii16_upper_right.png" "after_right" }
after time 17.0 { hold_key "left" 16 1.0 }
after time 18.4 { shot "ascii16_upper_left.png" "after_left" }
after time 22.0 { state "t22"; close $f; exit }
