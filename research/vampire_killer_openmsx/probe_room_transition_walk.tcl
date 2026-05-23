set out_dir "C:/Users/salam/Documents/Programacion/Mideas/research/vampire_killer_openmsx"
file mkdir $out_dir
set f [open "$out_dir/probe_room_transition_walk.log" "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc state {tag} { logline [format "%s PC=%04X SP=%04X AF=%04X BC=%04X DE=%04X HL=%04X IX=%04X IY=%04X" $tag [reg PC] [reg SP] [reg AF] [reg BC] [reg DE] [reg HL] [reg IX] [reg IY]] }
proc shot {name tag} { global out_dir; state $tag; screenshot "$out_dir/$name"; logline "SHOT $name" }
proc m {addr} { return [debug read memory $addr] }
proc line {tag} {
    logline [format "%s vars C000=%02X C001=%02X C003=%02X C005=%02X C00F=%02X C426=%02X%02X C42E=%02X C42F=%02X C470=%02X:%02X:%02X:%02X C480=%02X:%02X:%02X:%02X" \
        $tag [m 0xC000] [m 0xC001] [m 0xC003] [m 0xC005] [m 0xC00F] [m 0xC427] [m 0xC426] [m 0xC42E] [m 0xC42F] \
        [m 0xC470] [m 0xC471] [m 0xC472] [m 0xC476] [m 0xC480] [m 0xC481] [m 0xC482] [m 0xC486]] 
}
proc kd {row mask label} { keymatrixdown $row $mask; logline "KD row=$row mask=$mask $label" }
proc ku {row mask label} { keymatrixup $row $mask; logline "KU row=$row mask=$mask $label" }

set ::map_count 0
set ::hud_count 0
set ::vdp99_count 0
debug set_watchpoint write_mem 0x6000 {} {
    incr ::map_count
    if {$::map_count <= 120} { logline [format "MAP_%03d 6000=%02X PC=%04X" $::map_count $::wp_last_value [reg PC]] }
    debug cont
}
debug set_watchpoint write_mem 0x8000 {} {
    incr ::map_count
    if {$::map_count <= 120} { logline [format "MAP_%03d 8000=%02X PC=%04X" $::map_count $::wp_last_value [reg PC]] }
    debug cont
}
debug set_watchpoint write_mem 0xA000 {} {
    incr ::map_count
    if {$::map_count <= 120} { logline [format "MAP_%03d A000=%02X PC=%04X" $::map_count $::wp_last_value [reg PC]] }
    debug cont
}

logline "RUN room transition walk"
after time 9.0 { kd 8 1 "SPACE1" }
after time 9.2 { ku 8 1 "SPACE1" }
after time 12.0 { kd 8 1 "SPACE2" }
after time 12.2 { ku 8 1 "SPACE2" }
after time 22.0 { shot "walktrans_22_start.png" "T22_START"; line "T22_START" }
after time 22.2 { kd 8 128 "RIGHT_LONG" }
after time 25.0 { shot "walktrans_25.png" "T25"; line "T25" }
after time 28.0 { shot "walktrans_28.png" "T28"; line "T28" }
after time 31.0 { shot "walktrans_31.png" "T31"; line "T31" }
after time 34.0 { shot "walktrans_34.png" "T34"; line "T34" }
after time 37.0 { shot "walktrans_37.png" "T37"; line "T37" }
after time 40.0 { ku 8 128 "RIGHT_LONG"; shot "walktrans_40_release.png" "T40_RELEASE"; line "T40_RELEASE" }
after time 41.0 { logline [format "COUNTS mapper=%d" $::map_count]; close $::f; exit }
