set f [open "C:/Users/salam/Documents/Programacion/Mideas/server/temp/openmsx_vram_probe_syntax.log" "w"]
proc log {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc trycmd {label cmd} {
    if {[catch {uplevel 1 $cmd} err]} {
        log "$label ERR $err"
    } else {
        log "$label OK $err"
    }
}
after time 2.0 {
    trycmd "memory" {debug read memory 0xC000}
    trycmd "VRAM" {debug read VRAM 0x1800}
    trycmd "vram" {debug read vram 0x1800}
    trycmd "video RAM" {debug read "video RAM" 0x1800}
    trycmd "VDP VRAM" {debug read "VDP VRAM" 0x1800}
    trycmd "list" {debug list}
    close $f
    exit
}
