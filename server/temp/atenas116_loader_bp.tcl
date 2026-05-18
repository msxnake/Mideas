set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas116_loader_bp.log"
set f [open $log_path "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} { return [debug read memory $addr] }

proc state {tag} {
    set p1 [mem8 0xC137]
    set p2 [mem8 0xC138]
    set p3 [mem8 0xC139]
    set p4 [mem8 0xC13A]
    set idx [expr {14 * 32 + 18}]
    set baddr [expr {0xC642 + $idx}]
    set taddr [expr {0xC942 + $idx}]
    set vaddr [expr {0xCC42 + $idx}]
    logline [format "%s pc=%04X p=%02X/%02X/%02X/%02X screen=%02X map18_14=%02X type=%02X val=%02X desc_id=%02X bank=%02X addr=%02X%02X size=%02X%02X raw=%02X%02X flags=%02X" \
        $tag [reg PC] $p1 $p2 $p3 $p4 \
        [mem8 0xDF7D] [mem8 $baddr] [mem8 $taddr] [mem8 $vaddr] \
        [mem8 0xC141] [mem8 0xC144] [mem8 0xC146] [mem8 0xC145] [mem8 0xC148] [mem8 0xC147] [mem8 0xC14A] [mem8 0xC149] [mem8 0xC14B]]
}

proc state_if_p1 {tag expected} {
    if {[mem8 0xC137] == $expected} {
        state $tag
    }
    debug cont
}

proc state_resload {} {
    set a [expr {([reg AF] >> 8) & 255}]
    set de [reg DE]
    logline [format "BP_resource_load_to_ram pc=%04X A=%02X DE=%04X p=%02X/%02X/%02X/%02X map=%02X type=%02X val=%02X" \
        [reg PC] $a $de [mem8 0xC137] [mem8 0xC138] [mem8 0xC139] [mem8 0xC13A] \
        [mem8 [expr {0xC642 + (14 * 32 + 18)}]] [mem8 [expr {0xC942 + (14 * 32 + 18)}]] [mem8 [expr {0xCC42 + (14 * 32 + 18)}]]]
    debug cont
}

proc state_dzx0 {} {
    logline [format "BP_dzx0 pc=%04X HL=%04X DE=%04X A=%02X p=%02X/%02X/%02X/%02X" \
        [reg PC] [reg HL] [reg DE] [expr {([reg AF] >> 8) & 255}] [mem8 0xC137] [mem8 0xC138] [mem8 0xC139] [mem8 0xC13A]]
    debug cont
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {tag} {
    state "${tag}_before"
    down 1
    after time 0.20 [list up 1]
    after time 0.30 [list state "${tag}_after"]
}

debug set_bp 0x6267 {} { state_if_p1 "BP_load_screen_pantalla1_entry" 9 }
debug set_bp 0x6300 {} { state_if_p1 "BP_load_screen_pantalla1_before_vram" 9 }
debug set_bp 0x47FF {} { state_resload }
debug set_bp 0x4749 {} { state_dzx0 }

after time 0.5 { state "t0_5" }
after time 2.0 { tap_space "space2" }
after time 4.0 { tap_space "space4" }
after time 6.0 { tap_space "space6" }
after time 8.0 { tap_space "space8" }
after time 10.0 { state "t10" }
after time 14.0 { state "t14" }
after time 18.0 {
    state "t18"
    close $f
    exit
}
