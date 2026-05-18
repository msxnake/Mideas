set boot_f [open "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_verify_probe_boot.log" "w"]
puts $boot_f "probe-start"
flush $boot_f
close $boot_f
set mode $env(MIDEAS_PROBE_MODE)
set boot_f [open "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_verify_probe_boot.log" "a"]
puts $boot_f "mode-ok $mode"
flush $boot_f
set log_path $env(MIDEAS_PROBE_LOG)
puts $boot_f "log-path $log_path"
flush $boot_f
set shot_dir $env(MIDEAS_PROBE_SHOTS)
puts $boot_f "shot-dir $shot_dir"
flush $boot_f
set screen_addr [expr {$env(MIDEAS_SCREEN_ADDR)}]
puts $boot_f "screen-ok $screen_addr"
flush $boot_f
set player_x_addr [expr {$env(MIDEAS_PLAYER_X_ADDR)}]
puts $boot_f "px-ok $player_x_addr"
flush $boot_f
set player_y_addr [expr {$env(MIDEAS_PLAYER_Y_ADDR)}]
puts $boot_f "py-ok $player_y_addr"
flush $boot_f

file mkdir $shot_dir
puts $boot_f "mkdir-ok"
flush $boot_f
set f [open $log_path "w"]
puts $boot_f "open-log-ok"
flush $boot_f
close $boot_f

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} {
    if {[catch {debug read memory $addr} value]} {
        return -1
    }
    return $value
}

proc mem16 {addr} {
    set lo [mem8 $addr]
    set hi [mem8 [expr {$addr + 1}]]
    if {$lo < 0 || $hi < 0} {
        return -1
    }
    return [expr {$lo | ($hi << 8)}]
}

proc state {tag} {
    global screen_addr player_x_addr player_y_addr
    set pc [reg PC]
    set sp [reg SP]
    set primary [mem8 0xFFFF]
    set p1 [mem8 0xC11B]
    set p2 [mem8 0xC11C]
    set p3 [mem8 0xC11D]
    set flow [mem8 0xC104]
    set screen [mem8 $screen_addr]
    set px [mem16 $player_x_addr]
    set py [mem16 $player_y_addr]
    set input [mem8 0xC000]
    set buttons [mem8 0xC002]
    logline [format "%s pc=%04X sp=%04X ffff=%02X banks=%02X/%02X/%02X flow=%02X screen=%02X input=%02X buttons=%02X player=%d,%d" $tag $pc $sp $primary $p1 $p2 $p3 $flow $screen $input $buttons $px $py]
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }

proc tap_space {tag} {
    state ${tag}_before
    down 1
    after time 0.20 [list state ${tag}_held]
    after time 0.28 [list up 1]
    after time 0.35 [list state ${tag}_after]
}

proc hold_right {tag} {
    state ${tag}_before
    down 128
    after time 0.70 [list state ${tag}_held]
    after time 0.90 [list up 128]
    after time 1.05 [list state ${tag}_after]
}

proc shot {name tag} {
    global shot_dir mode
    state $tag
    set path "$shot_dir/${mode}_${name}.png"
    if {[catch {screenshot $path} err]} {
        logline "SHOTERR $path $err"
    } else {
        logline "SHOTOK $path"
    }
}

debug set_bp 0x4010 {} {
    state "BP_4010"
    debug cont
}

debug set_bp 0x0000 {} {
    state "BP_0000"
    debug cont
}

after time 2.0  { shot "boot" "boot" }
after time 7.0  { tap_space "space1" }
after time 8.0  { shot "after_space1" "after_space1" }
after time 12.0 { tap_space "space2" }
after time 13.2 { shot "after_space2" "after_space2" }
after time 14.0 { hold_right "right" }
after time 15.3 { shot "after_right" "after_right" }
after time 17.0 { state "final"; close $f; exit }
