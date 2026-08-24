# Which rule is actually firing? The 1 Hz sample said "stuck", which is a
# symptom, not a cause: it cannot tell "the timer rule never runs" apart from
# "the timer rule runs and its condition is false". Counting the handlers can.
#
# Addresses from server/temp/behaviour_visual/dropper.sym of THIS build:
#   no_floor_ahead   0x622D
#   timer            0x6267
#   on_platform_tile 0x636C
#   turn_and_walk    0x643C
#   drop_through     0x657B

set OUT "C:/Users/salam/Documents/Programacion/Mideas/server/temp/behaviour_visual/dropper_rules.txt"
set LOG [open $OUT w]
proc say {s} { puts $::LOG $s; flush $::LOG }

set nofloor 0
set timer 0
set onplat 0
set taw 0
set drop 0
set n 0

debug set_bp 0x622D {} { incr ::nofloor }
debug set_bp 0x6267 {} { incr ::timer }
debug set_bp 0x636C {} { incr ::onplat }
debug set_bp 0x643C {} { incr ::taw }
debug set_bp 0x657B {} { incr ::drop }

proc rb {a} { return [debug read memory $a] }

proc tick {} {
    incr ::n
    say [format "%2ds | noFloor=%-6d timer=%-6d onPlatform=%-5d turnAndWalk=%-6d drop=%-4d | x=%d y=%d state=%d" \
        $::n $::nofloor $::timer $::onplat $::taw $::drop \
        [rb 0xD0D4] [rb 0xD0D5] [rb [expr {0xD0D4 + 25}]]]
    if {$::n >= 28} {
        say ""
        say "result=COMPLETE"
        close $::LOG
        exit
    }
    after time 1.0 tick
}

after time 4.0 tick
after time 60.0 { say "result=TIMEOUT"; close $::LOG; exit }
