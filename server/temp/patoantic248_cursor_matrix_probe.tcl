set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_cursor_matrix_probe.log"
set f [open $log_path "w"]
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/screenshots"

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

proc regs_line {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set p1 [mem8 0xC053]
    set p2 [mem8 0xC054]
    set p3 [mem8 0xC055]
    set flow [mem8 0xC03B]
    set exit [mem8 0xC03D]
    set screen [mem8 0xE531]
    set lives [mem8 0xE543]
    set timelo [mem8 0xDCA4]
    set timehi [mem8 0xDCA5]
    set pe [mem8 0xE540]
    set px [mem16 0xE53B]
    set py [mem16 0xE53D]
    set ex0 [mem8 0xDE94]
    set ey0 [mem8 0xDEB4]
    set spriteIdx0 [mem8 0xE2F5]
    set sat0 [mem8 0xE4B3]
    logline [format "%s pc=%04X sp=%04X p=%02X/%02X/%02X flow=%02X exit=%02X screen=%02X lives=%d time=%02X%02X player=%02X pxy=%d,%d e0=%d,%d sprite0=%02X pat0=%02X" $tag $pc $sp $p1 $p2 $p3 $flow $exit $screen $lives $timehi $timelo $pe $px $py $ex0 $ey0 $spriteIdx0 $sat0]
}

proc press_matrix {tag bit seconds} {
    regs_line "${tag}_before"
    logline "${tag}_DOWN bit=$bit"
    keymatrixdown 8 $bit
    after time $seconds [list keymatrixup 8 $bit]
}

proc tap_space {tag} {
    press_matrix $tag 1 0.24
}

proc capture {name tag} {
    global shot_dir
    regs_line $tag
    set out "$shot_dir/$name"
    if {[catch {screenshot $out} err]} {
        logline "SCREENSHOT_ERROR $out $err"
    } else {
        logline "SCREENSHOT_OK $out"
    }
}

debug set_bp 0x0000 {} {
    regs_line "BP_0000"
    debug cont
}
debug set_bp 0x4010 {} {
    regs_line "BP_init_rom"
    debug cont
}

after time 7.0 { tap_space "first" }
after time 12.0 { tap_space "start" }
after time 13.2 { capture "patoantic248_cursor_start.png" "shot_start" }
after time 14.0 { press_matrix "RIGHT" 128 1.4 }
after time 16.0 { capture "patoantic248_cursor_after_right.png" "shot_after_right" }
after time 17.0 { press_matrix "LEFT" 8 1.4 }
after time 19.0 { capture "patoantic248_cursor_after_left.png" "shot_after_left" }
after time 20.0 { press_matrix "UP" 16 1.0 }
after time 22.0 { capture "patoantic248_cursor_after_up.png" "shot_after_up" }
after time 23.0 { press_matrix "DOWN" 32 1.0 }
after time 25.0 { capture "patoantic248_cursor_after_down.png" "shot_after_down" }
after time 28.0 {
    capture "patoantic248_cursor_final.png" "final"
    close $f
    exit
}
