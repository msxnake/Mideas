# Claude probe: does a room full of scripted enemies still run at 60 Hz?
#
# The project rule is hard: the player never drops below 60 fps. So the honest
# instrument is not a stopwatch on the interpreter, it is the frame rate itself.
#
# bitmap_update_enemies runs exactly once per video frame, so counting its
# entries over wall time IS the frame rate. The boot probe already showed it
# ticking at a clean 60/s on this ROM with the enemies idle, which is the
# baseline this measurement is compared against.
#
# Symbols from server/temp/behaviour_probe/behaviour4.sym (THIS build):
#   bitmap_update_enemies    0x5BDE   once per frame
#   bitmap_enemy_script_step 0x611F   once per scripted slot per logic tick
#   bitmap_enemy_count       0xD000
#
# Reported per second so a drop is visible as a number, not as a feeling.

set OUT "C:/Users/salam/Documents/Programacion/Mideas/server/temp/behaviour_probe/cost.txt"
set LOG [open $OUT w]
proc say {s} { puts $::LOG $s; flush $::LOG }

set frames 0
set steps 0
set lastf 0
set lasts 0
set n 0
set armed 0

proc rb {a} { return [debug read memory $a] }

debug set_bp 0x5BDE {} { incr ::frames }
debug set_bp 0x611F {} { incr ::steps }
say "probe loaded"

proc arm {} {
    set count [rb 0xD000]
    if {$count < 3} { after time 0.25 arm; return }
    set ::armed 1
    set slot2 [expr {0xD001 + 2 * 28}]
    say "instrument OK: enemy slots=$count  slot2.mode=[rb [expr {$slot2 + 13}]] interval=[rb [expr {$slot2 + 22}]]"
    say ""
    say "  s | frames/s | interpreter steps/s"
    set ::lastf $::frames
    set ::lasts $::steps
    after time 1.0 tick
}

proc tick {} {
    incr ::n
    set df [expr {$::frames - $::lastf}]
    set ds [expr {$::steps - $::lasts}]
    set ::lastf $::frames
    set ::lasts $::steps
    say [format "%3d |    %3d   |   %4d" $::n $df $ds]
    if {$::n >= 20} {
        say ""
        say "result=COMPLETE total_frames=$::frames total_steps=$::steps"
        close $::LOG
        exit
    }
    after time 1.0 tick
}

after time 3.0 arm
after time 45.0 { if {!$::armed} { say "result=FAILED-INSTRUMENT"; close $::LOG; exit } }
