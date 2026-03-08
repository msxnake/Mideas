set __out "C:/Users/salam/Documents/Programacion/Mideas/server/temp/juego_pato_pt3_probe.png"

after realtime 5000 { keymatrixdown DOWN }
after realtime 5120 { keymatrixup DOWN }
after realtime 6200 { keymatrixdown SPACE }
after realtime 6320 { keymatrixup SPACE }
after realtime 14000 {
    if {[catch {screenshot $__out} err]} {
        if {[catch {savescreen $__out} err2]} {
            puts "SCREENSHOT ERROR: $err / $err2"
        } else {
            puts "SCREENSHOT OK: $__out"
        }
    } else {
        puts "SCREENSHOT OK: $__out"
    }
}
after realtime 14300 { exit }
vwait __never_set
