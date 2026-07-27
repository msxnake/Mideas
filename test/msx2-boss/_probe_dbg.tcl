set f [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/_probe_dbg.txt" "w"]
after time 6 {
    puts $f "debuggables: [debug list]"
    if {[catch {debug read VRAM 0x10000} err]} { puts $f "VRAM read failed: $err" } else { puts $f "VRAM ok" }
    flush $f
    exit
}
