set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc60_mirror_mega_probe.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc60_mirror_mega_probe_shots"
file mkdir $shot_dir
set f [open $log_path "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} { set lo [mem8 $addr]; set hi [mem8 [expr {$addr + 1}]]; return [expr {$lo | ($hi << 8)}] }
proc bytes {addr count} {
    set out ""
    for {set i 0} {$i < $count} {incr i} {
        append out [format "%02X" [mem8 [expr {$addr + $i}]]]
        if {$i + 1 < $count} { append out "," }
    }
    return $out
}
proc state {tag} {
    set idx [mem8 0xDFAC]
    set facing [mem8 [expr {0xDC95 + $idx}]]
    set asset [mem8 [expr {0xDDB5 + $idx}]]
    set frame [mem8 [expr {0xDAD5 + $idx}]]
    set px [mem16 0xDFA7]
    set py [mem16 0xDFA9]
    set pack [mem8 0xDF1C]
    set banks [bytes 0xC11B 4]
    set oam [bytes 0xDF1D 16]
    set base [bytes 0xDF10 11]
    set left [bytes 0xDE36 11]
    set right [bytes 0xDE41 11]
    logline [format "%s pc=%04X idx=%02X facing=%02X asset=%02X frame=%02X pos=%d,%d pack=%02X banks=%s base=%s left=%s right=%s oam=%s" $tag [reg PC] $idx $facing $asset $frame $px $py $pack $banks $base $left $right $oam]
}
proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {tag} { state "${tag}_before"; down 1; after time 0.20 { up 1 }; after time 0.30 [list state "${tag}_after"] }
proc hold_key {tag mask duration} { state "${tag}_before"; down $mask; after time $duration [list up $mask]; after time [expr {$duration + 0.10}] [list state "${tag}_after"] }
proc shot {name tag} {
    global shot_dir
    state $tag
    if {[catch {screenshot "$shot_dir/$name"} err]} { logline "SHOTERR $err" } else { logline "SHOTOK $name" }
}

after time 7.0 { tap_space "space1" }
after time 9.0 { tap_space "space2" }
after time 12.0 { shot "mega_idle.png" "idle" }
after time 13.2 { hold_key "right" 128 1.0 }
after time 14.6 { shot "mega_right.png" "after_right" }
after time 15.2 { hold_key "left" 16 1.2 }
after time 16.9 { shot "mega_left.png" "after_left" }
after time 18.0 { state "final"; close $f; exit }
