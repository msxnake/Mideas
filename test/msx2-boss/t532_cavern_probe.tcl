# EXPERIMENT: short dimmed twin + post-atlas band pinned to its old row.
#
# The two builds differ in exactly two bytes -- the NY of the twin's commands --
# so anything that renders differently isolates the twin size as the cause, and
# anything that renders the same clears it.
#
# Walks the world logging current_screen_index and shooting a frame per room, so
# whichever screen the cavern turns out to be, there is a picture of it.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/out/t532_probe.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc mem8 {addr} { return [debug read memory $addr] }

set ::last_room -1

proc watch {} {
    set room [mem8 0xC00B]
    if {$room != $::last_room} {
        set ::last_room $room
        logline [format "room=%d x=%d y=%d" $room [mem8 0xC001] [mem8 0xC000]]
        screenshot -prefix t532_room${room}_
    }
    after time 0.5 watch
}

# Skip the presentation.
for {set t 4} {$t < 16} {incr t} {
    after time $t                "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}

after time 17 { watch }

# Explore: right for a while, then up, then right again. Rooms are logged as the
# index changes, so the route does not have to be exact.
for {set t 18} {$t < 40} {incr t} {
    after time $t                "keymatrixdown 8 0x80"
    after time [expr {$t + 0.8}] "keymatrixup 8 0x80"
}
for {set t 40} {$t < 60} {incr t} {
    after time $t                "keymatrixdown 8 0x20"
    after time [expr {$t + 0.8}] "keymatrixup 8 0x20"
}
for {set t 60} {$t < 80} {incr t} {
    after time $t                "keymatrixdown 8 0x80"
    after time [expr {$t + 0.8}] "keymatrixup 8 0x80"
}

after time 82 { logline "done" ; after time 1 { exit } }
