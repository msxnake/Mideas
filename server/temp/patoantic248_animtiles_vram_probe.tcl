set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_animtiles_vram_probe.log"
set f [open $log_path "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} { return [debug read memory $addr] }

proc vbytes {addr count} {
    set out ""
    for {set i 0} {$i < $count} {incr i} {
        append out [format "%02X" [debug read "VRAM" [expr {$addr + $i}]]]
        if {$i + 1 < $count} { append out " " }
    }
    return $out
}

proc snapshot {tag} {
    set timer [mem8 0xDCA7]
    set frame [mem8 0xDCA8]
    set speed [mem8 0xDCA9]
    set groups [mem8 0xE537]
    # Animated group 0 target char 134: pattern offset 134*8 = 0x0430.
    set gem_p0 [vbytes 0x0430 8]
    set gem_p1 [vbytes 0x0C30 8]
    set gem_p2 [vbytes 0x1430 8]
    set gem_c0 [vbytes 0x2430 8]
    # Transform/precomputed group target char 133: pattern offset 133*8 = 0x0428.
    set corda_p0 [vbytes 0x0428 8]
    set corda_c0 [vbytes 0x2428 8]
    logline [format "%s anim=%02X/%02X/%02X groups=%02X gem_p0=%s gem_p1=%s gem_p2=%s gem_c0=%s corda_p0=%s corda_c0=%s" $tag $timer $frame $speed $groups $gem_p0 $gem_p1 $gem_p2 $gem_c0 $corda_p0 $corda_c0]
}

proc tap_space {tag} {
    snapshot "${tag}_before"
    keymatrixdown 8 1
    after time 0.22 { keymatrixup 8 1 }
}

after time 7.0 { tap_space "first" }
after time 12.0 { tap_space "start" }
after time 13.1 { snapshot "game_13_1" }
after time 13.25 { snapshot "game_13_25" }
after time 13.4 { snapshot "game_13_4" }
after time 13.55 { snapshot "game_13_55" }
after time 13.7 { snapshot "game_13_7" }
after time 13.85 { snapshot "game_13_85" }
after time 14.0 {
    snapshot "game_14_0"
    close $f
    exit
}
