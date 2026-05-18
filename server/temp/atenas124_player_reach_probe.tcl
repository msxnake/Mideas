set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas124_player_reach_probe.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas124_player_reach_probe_shots"
file mkdir $shot_dir
set f [open $log_path "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} { return [debug read memory $addr] }
proc mem16_pair {loaddr hiaddr} {
    set lo [mem8 $loaddr]
    set hi [mem8 $hiaddr]
    return [expr {$lo | ($hi << 8)}]
}
proc mem16_seq {addr} {
    set lo [mem8 $addr]
    set hi [mem8 [expr {$addr + 1}]]
    return [expr {$lo | ($hi << 8)}]
}

proc state {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set exit [mem8 0xC11E]
    set sel [mem8 0xC11F]
    set ac [mem8 0xC0E7]
    set ae [mem8 0xC0F3]
    set aew [mem8 0xC0F4]
    set dialog [mem8 0xC0F7]
    set text [mem8 0xC0F9]
    set screen [mem8 0xDF7D]
    set engine [mem8 0xDF7E]
    set world [mem8 0xDF81]
    set smptr [mem16_pair 0xDB1E 0xDB3E]
    set smtim [mem16_pair 0xDB5E 0xDB7E]
    set px [mem16_seq 0xDF87]
    set py [mem16_seq 0xDF89]
    logline [format "%s pc=%04X sp=%04X exit=%02X sel=%02X ac=%02X ae=%02X aew=%02X dialog=%02X text=%02X screen=%02X engine=%02X world=%02X smptr=%04X smtim=%04X pxy=%d,%d" $tag $pc $sp $exit $sel $ac $ae $aew $dialog $text $screen $engine $world $smptr $smtim $px $py]
}

proc space_down {} {
    catch {keymatrixdown 8 1}
    catch {keymatrixdown SPACE}
}
proc space_up {} {
    catch {keymatrixup 8 1}
    catch {keymatrixup SPACE}
}
proc tap_space {tag} {
    state ${tag}_before
    space_down
    after time 0.35 { space_up }
    after time 0.55 [list state ${tag}_after]
}

proc force_done {tag} {
    debug write memory 0xC11F 4
    state ${tag}_forced_done
    tap_space $tag
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

for {set i 1} {$i <= 90} {incr i} {
    after time [expr {$i * 1.0}] [list state "t${i}"]
}

after time 5.0 { shot "t05_controls.png" "shot_t05" }
after time 6.0 { force_done "controls_done1" }
after time 8.0 { force_done "controls_done2" }
after time 10.0 { shot "t10_after_done.png" "shot_t10" }
after time 16.0 { shot "t16_dialog_or_world.png" "shot_t16" }

foreach t {20 24 28 32 36 40 44 48 52 56 60} {
    after time $t [list tap_space "dialog_space$t"]
}

after time 35.0 { shot "t35_mid.png" "shot_t35" }
after time 50.0 { shot "t50_late.png" "shot_t50" }
after time 70.0 { shot "t70_final.png" "shot_t70" }
after time 50.0 { shot "t50_final.png" "shot_t50"; close $f; exit }
