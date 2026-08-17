# Deterministic snapshot of the complete SAT when the top-left ghost appears.

set out_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-lighting/t501/_codex_player_sat_probe.txt"
set log [open $out_path "w"]
proc vb {addr} { debug read VRAM $addr }
proc L {msg} { global log; puts $log $msg; flush $log }

proc dump_sat {tag} {
    set r5 [debug read "VDP regs" 5]
    set r11 [debug read "VDP regs" 11]
    set r15 [debug read "VDP regs" 15]
    L "$tag R5=[format %02X $r5] R11=[format %02X $r11] R15=[format %02X $r15]"
    for {set slot 0} {$slot < 12} {incr slot} {
        set base [expr {0xF600 + $slot * 4}]
        L [format "  %02d @%05X y=%02X x=%02X pat=%02X ec=%02X" $slot $base [vb $base] [vb [expr {$base+1}]] [vb [expr {$base+2}]] [vb [expr {$base+3}]]]
    }
}

foreach t {3 4 5 6 7 8} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t + 0.2}] "keymatrixup 8 0x01"
}

foreach t {9.90 9.95 9.98 9.99 10.00 10.01 10.02 10.05 10.10} {
    after time $t [list dump_sat "t$t"]
}
after time 10.00 { screenshot "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-lighting/t501/_codex_player_sat_t100.png" }
after time 10.2 { close $log; exit }
