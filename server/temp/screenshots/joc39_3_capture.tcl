set logf [open {C:/Users/salam/Documents/Programacion/Mideas/server/temp/screenshots/joc39_3_manual_tcl.log} w]
puts $logf "capture script started"
flush $logf
after 6000 {
    global logf
    set path {C:/Users/salam/Documents/Programacion/Mideas/server/temp/screenshots/joc39_3_manual_tcl.png}
    puts $logf "capturing to $path"
    flush $logf
    if {[catch {screenshot $path} err]} {
        puts $logf "screenshot error: $err"
        if {[catch {savescreen $path} err2]} {
            puts $logf "savescreen error: $err2"
        } else {
            puts $logf "savescreen ok"
        }
    } else {
        puts $logf "screenshot ok"
    }
    flush $logf
    after 1000 { exit }
}
