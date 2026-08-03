set log [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-platform/loop_log.txt" w]
set a 0; set b 0; set c 0; set d 0
debug set_bp 0x455F {} { incr ::a }   ;# wait_vblank
debug set_bp 0x485C {} { incr ::b }   ;# update_sprite_sat
debug set_bp 0x5062 {} { incr ::c }   ;# bitmap_shaft_sat  (mio)
debug set_bp 0x43FB {} { incr ::d }   ;# step_room_composition
proc dump {tag} {
    global log
    puts $log "$tag vblank=$::a sprite_sat=$::b SHAFT_SAT=$::c step_comp=$::d | comp=[debug read memory 0xC0D1] slot=[debug read memory 0xC0E7]"
    flush $log
    set ::a 0; set ::b 0; set ::c 0; set ::d 0
}
after time 4.5 { dump "antes:  " }
after time 6.5 { dump "despues:" }
after time 7.0 { close $log; exit }
