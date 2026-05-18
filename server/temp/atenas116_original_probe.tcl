set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas116_original_probe.log"
set f [open $log_path "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} { return [debug read memory $addr] }
proc write8 {addr value} { debug write memory $addr [expr {$value & 255}] }
proc mem16 {addr} {
    set lo [mem8 $addr]
    set hi [mem8 [expr {$addr + 1}]]
    return [expr {$lo | ($hi << 8)}]
}
proc write16 {addr value} {
    write8 $addr [expr {$value & 255}]
    write8 [expr {$addr + 1}] [expr {($value >> 8) & 255}]
}

proc state {tag} {
    set pidx [mem8 0xDCEE]
    set ex [expr {0xD74D + $pidx}]
    set ey [expr {0xD76D + $pidx}]
    set evy [expr {0xD7AD + $pidx}]
    set egv [expr {0xE18D + ($pidx * 2)}]
    set eground [expr {0xDEAA + $pidx}]
    set idx [expr {14 * 32 + 18}]
    set baddr [expr {0xC473 + $idx}]
    set taddr [expr {0xC773 + $idx}]
    set vaddr [expr {0xCA73 + $idx}]
    logline [format "%s pc=%04X screen=%02X pidx=%02X exy=%d,%d pxy=%d,%d evy=%02X gv=%02X%02X ground=%02X last=%02X/%02X at=%d,%d map18_14=%02X type=%02X val=%02X" \
        $tag [reg PC] [mem8 0xDCDF] $pidx [mem8 $ex] [mem8 $ey] [mem16 0xDCE9] [mem16 0xDCEB] [mem8 $evy] [mem8 [expr {$egv + 1}]] [mem8 $egv] [mem8 $eground] \
        [mem8 0xDCFC] [mem8 0xDCFD] [mem8 0xDCFF] [mem8 0xDD00] [mem8 $baddr] [mem8 $taddr] [mem8 $vaddr]]
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {tag} {
    state "${tag}_before"
    down 1
    after time 0.20 [list up 1]
    after time 0.25 [list state "${tag}_after"]
}

proc place_on_jumper {} {
    set pidx [mem8 0xDCEE]
    if {$pidx == 255} {
        set pidx 0
    }
    set x 136
    set y 104
    write8 [expr {0xD74D + $pidx}] $x
    write8 [expr {0xD76D + $pidx}] $y
    write16 0xDCE9 $x
    write16 0xDCEB $y
    write8 [expr {0xD7AD + $pidx}] 0
    write8 [expr {0xE18D + ($pidx * 2)}] 0
    write8 [expr {0xE18D + ($pidx * 2) + 1}] 0
    write8 [expr {0xDEAA + $pidx}] 1
    write8 [expr {0xE00D + $pidx}] 255
    state "placed_on_jumper"
}

debug set_bp 0x4010 {} {
    state "BP_4010"
    debug cont
}

after time 2.0 { state "boot_2s" }
after time 7.0 { tap_space "intro" }
after time 12.0 { tap_space "start" }
after time 13.5 { state "pre_place" }
after time 14.0 { place_on_jumper }
after time 14.2 { state "after_place_0_2" }
after time 14.5 { state "after_place_0_5" }
after time 15.0 { state "after_place_1_0" }
after time 16.0 { state "after_place_2_0"; close $f; exit }
