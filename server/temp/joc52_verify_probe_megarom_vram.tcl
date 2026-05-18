set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_verify_megarom_vram.log"
set f [open $log_path "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { if {[catch {debug read memory $addr} value]} { return -1 }; return $value }
proc vram8 {addr} {
    if {[catch {debug read VRAM $addr} value]} {
        if {[catch {debug read vram $addr} value2]} { return -1 }
        return $value2
    }
    return $value
}
proc row {addr count reader} {
    set values {}
    for {set i 0} {$i < $count} {incr i} {
        lappend values [format "%02X" [$reader [expr {$addr + $i}]]]
    }
    return [join $values " "]
}
proc state {tag} {
    set pc [reg PC]
    set p1 [mem8 0xC11B]
    set p2 [mem8 0xC11C]
    set p3 [mem8 0xC11D]
    logline [format "%s pc=%04X banks=%02X/%02X/%02X ram_bg12=%s vram_name12=%s pat8C=%s col8C=%s pat81=%s col81=%s" $tag $pc $p1 $p2 $p3 [row 0xC5D7 16 mem8] [row 0x1980 16 vram8] [row [expr {0x0000 + (0x8C * 8)}] 8 vram8] [row [expr {0x2000 + (0x8C * 8)}] 8 vram8] [row [expr {0x0000 + (0x81 * 8)}] 8 vram8] [row [expr {0x2000 + (0x81 * 8)}] 8 vram8]]
}
proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {tag} { state ${tag}_before; down 1; after time 0.20 [list state ${tag}_held]; after time 0.28 [list up 1]; after time 0.35 [list state ${tag}_after] }
proc hold_right {tag} { state ${tag}_before; down 128; after time 0.70 [list state ${tag}_held]; after time 0.90 [list up 128]; after time 1.05 [list state ${tag}_after] }

after time 7.0  { tap_space "space1" }
after time 12.0 { tap_space "space2" }
after time 13.2 { state "after_space2" }
after time 14.0 { hold_right "right" }
after time 15.3 { state "after_right" }
after time 17.0 { state "final"; close $f; exit }
