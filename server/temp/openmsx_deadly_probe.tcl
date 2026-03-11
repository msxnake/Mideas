set ::probe_log [open "C:/Users/salam/Documents/Programacion/Mideas/server/temp/openmsx_deadly_probe.log" w]

proc dump_hero {label} {
    set x [peek 0xC6A0]
    set y [peek 0xC6C0]
    set deadly [peek 0xCDDC]
    set sprite [peek 0xCAC1]
    set sm_l [peek 0xC8A1]
    set sm_h [peek 0xC8C1]
    set sm [expr {$sm_h * 256 + $sm_l}]
    puts $::probe_log [format "%s x=%d y=%d deadly=%d sprite=%d sm=%04X" $label $x $y $deadly $sprite $sm]
    flush $::probe_log
}

puts $::probe_log "deadly-probe: booting"
flush $::probe_log

reset
after 1000
cart "C:/Users/salam/Downloads/diumenge5.rom"
puts $::probe_log "deadly-probe: rom loaded"
flush $::probe_log

after 5000
dump_hero "start"

keymatrixdown RIGHT
after 600
dump_hero "right_600"

after 300
dump_hero "right_900"

keymatrixup RIGHT
dump_hero "release"

after 700
dump_hero "post_release"

after 800
dump_hero "final"

close $::probe_log
exit


