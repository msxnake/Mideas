set logpath "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-platform/first_frame_log.txt"
set log [open $logpath w]

# Walk right until the A(lit) -> B(dark) transition commits, sampling every
# frame. A dark room must never be observed with light_state = 0 (authored,
# i.e. the bright palette): that single frame is the "raster" flash.
after time 4.0 { keymatrixdown 8 0x80 }

proc watch {} {
    global log
    set room  [debug read memory 0xC00B]
    set state [debug read memory 0xC0F4]
    puts $log "room=$room light_state=$state"
    flush $log
    after frame watch
}

after time 4.0 { watch }

after time 9.0 {
    keymatrixup 8 0x80
    close $log
    exit
}
