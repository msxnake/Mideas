set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas118_presentation_exit_probe.log"
set f [open $log_path "w"]
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/screenshots"

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} { return [debug read memory $addr] }

proc state {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set p1 [mem8 0xC151]
    set p2 [mem8 0xC152]
    set p3 [mem8 0xC153]
    set flow [mem8 0xC11C]
    set input [mem8 0xC000]
    set prev [mem8 0xC001]
    set btn [mem8 0xC002]
    set fire [mem8 0xC004]
    logline [format "%s pc=%04X sp=%04X p=%02X/%02X/%02X flow=%02X input=%02X prev=%02X btn=%02X fire=%02X" $tag $pc $sp $p1 $p2 $p3 $flow $input $prev $btn $fire]
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

proc down_space {} { keymatrixdown 8 1 }
proc up_space {} { keymatrixup 8 1 }

after time 5.8 { shot "atenas118_exit_probe_01_present.png" "present_5_8" }
after time 6.5 { down_space; state "space_down_6_5" }
after time 6.7 { state "space_held_6_7" }
after time 6.9 { up_space; state "space_up_6_9" }
after time 7.6 { shot "atenas118_exit_probe_02_after_space.png" "after_space_7_6" }
after time 9.5 { shot "atenas118_exit_probe_03_later.png" "later_9_5" }
after time 12.0 { shot "atenas118_exit_probe_04_final.png" "final_12_0" }
after time 12.5 { close $f; exit }
