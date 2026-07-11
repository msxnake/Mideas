set f [open "C:/Users/salam/Documents/Programacion/Mideas/server/temp/openmsx_debug_help.log" "w"]
proc log {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc trycmd {label cmd} {
    if {[catch {uplevel 1 $cmd} err]} {
        log "$label ERR $err"
    } else {
        log "$label OK $err"
    }
}
after time 1.0 {
    trycmd "help_debug" {help debug}
    trycmd "help_debug_read_block" {help "debug read_block"}
    trycmd "debug_read_block" {debug read_block VRAM 0x1800 16}
    trycmd "debug_read_bytes" {debug read_bytes VRAM 0x1800 16}
    close $f
    exit
}
