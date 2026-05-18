set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas118_presentation_probe.log"
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
    set p1 [mem8 0xC053]
    set p2 [mem8 0xC054]
    set p3 [mem8 0xC055]
    set flow [mem8 0xC03B]
    set exit [mem8 0xC03D]
    set input [mem8 0xC000]
    set btn [mem8 0xC002]
    logline [format "%s pc=%04X sp=%04X p=%02X/%02X/%02X flow=%02X exit=%02X in=%02X btn=%02X" $tag $pc $sp $p1 $p2 $p3 $flow $exit $input $btn]
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

after time 1.5 { shot "atenas118_probe_01_boot.png" "boot_1_5" }
after time 3.0 { state "space_down"; down_space }
after time 3.3 { state "space_up"; up_space }
after time 4.2 { shot "atenas118_probe_02_after_space.png" "after_space_4_2" }
after time 6.0 { shot "atenas118_probe_03_later.png" "later_6_0" }
after time 7.0 { close $f; exit }
