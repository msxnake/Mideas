set prefix "loop_capture"
if {[info exists ::env(MIDEAS_CAPTURE_PREFIX)]} {
    set prefix $::env(MIDEAS_CAPTURE_PREFIX)
}
set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/${prefix}.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_loop_shots"
file mkdir $shot_dir
set f [open $log_path "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8safe {addr} {
    if {[catch {debug read memory $addr} value]} {
        return -1
    }
    return $value
}

proc state {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set screen [mem8safe 0xE531]
    set player [mem8safe 0xE540]
    set boss [mem8safe 0xC015]
    set bx [mem8safe 0xC021]
    set by [mem8safe 0xC022]
    logline [format "%s pc=%04X sp=%04X screen=%02X player=%02X boss=%02X bossxy=%02X,%02X" $tag $pc $sp $screen $player $boss $bx $by]
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }

proc tap_space {tag} {
    state ${tag}_before
    down 1
    after time 0.22 [list up 1]
    after time 0.25 [list state ${tag}_after]
}

proc hold_right {tag duration} {
    state ${tag}_before
    down 128
    after time $duration [list up 128]
    after time [expr {$duration + 0.05}] [list state ${tag}_after]
}

proc shot {name tag} {
    global shot_dir prefix
    state $tag
    set path "$shot_dir/${prefix}_${name}.png"
    if {[catch {screenshot $path} err]} {
        logline "SHOTERR $path $err"
    } else {
        logline "SHOTOK $path"
    }
}

debug set_bp 0x4010 {} {
    state "BP_4010_RESET_OR_INIT"
    debug cont
}

after time 7.0  { tap_space "intro_space" }
after time 12.0 { tap_space "start_space" }
after time 12.8 { shot "game_early" "game_early" }
after time 13.5 { shot "game_late" "game_late" }
after time 14.0 { hold_right "right" 0.8 }
after time 15.0 { shot "after_right" "after_right" }
after time 16.0 { shot "final" "final"; close $f; exit }
