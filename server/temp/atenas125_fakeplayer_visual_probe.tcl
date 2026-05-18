set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas125_fakeplayer_visual_probe.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas125_fakeplayer_visual_probe_shots"
file mkdir $shot_dir
set f [open $log_path "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} { return [debug read memory $addr] }
proc state {tag} {
    set screen [mem8 0xDF7D]
    set engine [mem8 0xDF7E]
    set world [mem8 0xDF81]
    set dirty [mem8 0xDF52]
    set sprpack [mem8 0xDEFC]
    set e0x [mem8 0xDF87]
    set e0y [mem8 0xDFA7]
    set e1x [mem8 0xDF88]
    set e1y [mem8 0xDFA8]
    set f0 [mem8 0xDDDD]
    set f1 [mem8 0xDDDE]
    logline [format "%s screen=%02X engine=%02X world=%02X dirty=%02X sprpack=%02X e0=%d,%d e1=%d,%d frame=%02X/%02X" $tag $screen $engine $world $dirty $sprpack $e0x $e0y $e1x $e1y $f0 $f1]
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

after time 5.0 { shot "t05_controls.png" "t05" }
after time 6.0 { force_done "done" }
after time 10.0 { shot "t10_enter_fakeplayer.png" "t10" }
after time 14.0 { shot "t14_fakeplayer.png" "t14" }
after time 18.0 { shot "t18_fakeplayer.png" "t18" }
after time 22.0 { shot "t22_fakeplayer.png" "t22" }
after time 26.0 { shot "t26_fakeplayer.png" "t26" }
after time 30.0 { shot "t30_fakeplayer.png" "t30" }
after time 34.0 { shot "t34_fakeplayer.png" "t34"; close $f; exit }
