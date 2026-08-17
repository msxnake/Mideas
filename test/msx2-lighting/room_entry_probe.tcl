# Measures what a dark-room ENTRY costs: emulated time between
# bitmap_light_paint_full and the bitmap_light_restore_status that closes it.
#
#   HALO_TAG=base PAINT=0x4F62 REST=0x4FC5 openmsx ... -cart mina_opt.rom
#   HALO_TAG=dim  PAINT=0x4FA0 REST=0x4FE7 openmsx ... -cart mina_opt2.rom
#
# The player walks right until he crosses into the next room, so the first
# sample is the boot paint and the second is a real transition.

set tag $env(HALO_TAG)
set paint_addr [expr $env(PAINT)]
set rest_addr [expr $env(REST)]
set f [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-lighting/room_entry_$tag.txt" w]
proc logline {msg} { global f; puts $f $msg; flush $f }

set ::in_paint 0
set ::t0 0
set ::n 0

debug set_bp $paint_addr {} {
    set ::in_paint 1
    set ::t0 [machine_info time]
}
debug set_bp $rest_addr {} {
    if {$::in_paint} {
        set ::in_paint 0
        incr ::n
        logline [format "paint #%d : %.1f ms" $::n [expr {([machine_info time] - $::t0) * 1000.0}]]
    }
}

after time 9 { keymatrixdown 8 0x80 }
after time 20 { keymatrixup 8 0x80 }
after time 22 {
    logline "tag=$tag  paints seen: $::n"
    screenshot -prefix entry_${tag}_
    after time 1 { exit }
}
