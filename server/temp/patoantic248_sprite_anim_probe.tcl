set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_sprite_anim_probe.log"
set f [open $log_path "w"]
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/screenshots"

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} { return [debug read memory $addr] }

proc mem16 {addr} {
    set lo [mem8 $addr]
    set hi [mem8 [expr {$addr + 1}]]
    return [expr {$lo | ($hi << 8)}]
}

proc bytes {addr count} {
    set out ""
    for {set i 0} {$i < $count} {incr i} {
        append out [format "%02X" [mem8 [expr {$addr + $i}]]]
        if {$i + 1 < $count} { append out " " }
    }
    return $out
}

proc snapshot {tag} {
    set pc [reg PC]
    set p1 [mem8 0xC053]
    set p2 [mem8 0xC054]
    set p3 [mem8 0xC055]
    set flow [mem8 0xC03B]
    set curScreen [mem8 0xE531]
    set curAnimGroups [mem8 0xE537]
    set animTimer [mem8 0xDCA7]
    set animFrame [mem8 0xDCA8]
    set animSpeed [mem8 0xDCA9]
    set hero [mem8 0xEAAC]
    set player [mem8 0xE540]
    set prun [mem8 0xE53F]
    set px [mem16 0xE53B]
    set py [mem16 0xE53D]
    set entityX [bytes 0xDE94 8]
    set entityY [bytes 0xDEB4 8]
    set screenId [bytes 0xDF54 8]
    set comp [bytes 0xDF14 8]
    set spriteIdx [bytes 0xE2F5 8]
    set baseSlot [bytes 0xE49D 16]
    set sat [bytes 0xE4B1 48]
    set mactive [mem8 0xEB98]
    set mmuted [mem8 0xEB99]
    set mloop [mem8 0xEB9A]
    set mtrack [mem8 0xEB9B]
    set pt3setup [mem8 0xEBBF]
    set pt3mod [mem16 0xEBC0]
    set pt3delay [mem8 0xEBDB]
    set ayregs [bytes 0xECFF 14]
    logline [format "%s pc=%04X p=%02X/%02X/%02X flow=%02X screen=%02X animGroups=%02X anim=%02X/%02X/%02X hero=%02X player=%02X run=%02X pxy=%d,%d" $tag $pc $p1 $p2 $p3 $flow $curScreen $curAnimGroups $animTimer $animFrame $animSpeed $hero $player $prun $px $py]
    logline [format "  music active=%02X muted=%02X loop=%02X track=%02X pt3setup=%02X mod=%04X delay=%02X ay=%s" $mactive $mmuted $mloop $mtrack $pt3setup $pt3mod $pt3delay $ayregs]
    logline "  entityX=$entityX"
    logline "  entityY=$entityY"
    logline "  screenId=$screenId"
    logline "  comp=$comp"
    logline "  spriteIdx=$spriteIdx"
    logline "  baseSlot=$baseSlot"
    logline "  sat=$sat"
}

proc capture {name tag} {
    global shot_dir
    snapshot $tag
    set out "$shot_dir/$name"
    if {[catch {screenshot $out} err]} {
        logline "SCREENSHOT_ERROR $out $err"
    } else {
        logline "SCREENSHOT_OK $out"
    }
}

proc tap_space {tag} {
    snapshot "${tag}_before"
    keymatrixdown 8 1
    after time 0.22 { keymatrixup 8 1 }
}

after time 7.0 { tap_space "first" }
after time 12.0 { tap_space "start" }
after time 13.1 { capture "patoantic248_probe_game_13_1.png" "game_13_1" }
after time 13.6 { capture "patoantic248_probe_game_13_6.png" "game_13_6" }
after time 14.1 { capture "patoantic248_probe_game_14_1.png" "game_14_1" }
after time 14.6 { capture "patoantic248_probe_game_14_6.png" "game_14_6" }
after time 15.1 { capture "patoantic248_probe_game_15_1.png" "game_15_1" }
after time 15.6 {
    capture "patoantic248_probe_game_15_6.png" "game_15_6"
    close $f
    exit
}
