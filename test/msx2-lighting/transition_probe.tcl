# Dark-room TRANSITION: walk east through the open passage into room 1 and
# measure every bitmap_light_paint_full (boot paint + the transition paint).
set tag $env(HALO_TAG)
set paint_addr [expr $env(PAINT)]
set rest_addr [expr $env(REST)]
set f [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-lighting/transition_$tag.txt" w]
proc logline {msg} { global f; puts $f $msg; flush $f }
set ::in_paint 0
set ::t0 0
set ::n 0
debug set_bp $paint_addr {} { set ::in_paint 1 ; set ::t0 [machine_info time] }
debug set_bp $rest_addr {} {
    if {$::in_paint} {
        set ::in_paint 0
        incr ::n
        logline [format "paint #%d : %6.1f ms   (room %d)" $::n \
            [expr {([machine_info time] - $::t0) * 1000.0}] [debug read memory 0xC00B]]
    }
}
after time 9  { screenshot -prefix tr_${tag}_0_start_ ; keymatrixdown 8 0x80 }
after time 18 { keymatrixup 8 0x80 }
after time 19 {
    logline "room now: [debug read memory 0xC00B]   paints: $::n"
    screenshot -prefix tr_${tag}_1_after_
    after time 1 { exit }
}
