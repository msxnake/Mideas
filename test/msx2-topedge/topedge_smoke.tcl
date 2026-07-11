# Top-edge wrap fix smoke v4 (test39 / pant3 Este = room 3, south rail = 4).
# player_vy pokes only take effect while AIRBORNE (grounded forces vy=0), so
# every vy write happens mid-fall:
#   airborne up-move regression: start a fall, then inject vy=-2 -> y must dip
#   top-edge repro: mid-fall, teleport to y=0 with vy=-2 (x3 pulses) -> the up
#     step at y=0 hits the new guard; pre-fix it wrapped y to 255 and fired the
#     SOUTH transition (room 3 -> room 4).
set result_path "test/msx2-topedge/topedge_result.txt"
set fh_lines [list]
proc log_line {line} { global fh_lines; lappend fh_lines $line }
proc flush_report {} {
    global result_path fh_lines
    set fh [open $result_path w]
    foreach l $fh_lines { puts $fh $l }
    close $fh
    after time 1 { exit }
}

# Skip intro pages with SPACE taps.
after time 6  { keymatrixdown 8 0x01 }
after time 7  { keymatrixup 8 0x01 }
after time 8  { keymatrixdown 8 0x01 }
after time 9  { keymatrixup 8 0x01 }
after time 10 { keymatrixdown 8 0x01 }
after time 11 { keymatrixup 8 0x01 }
after time 14 { keymatrixdown 8 0x01 }
after time 15 { keymatrixup 8 0x01 }

# Airborne up-move regression: drop from y=50, inject vy=-2 mid-fall.
after time 18   { debug write memory 0xC000 50 ; debug write memory 0xC006 2 }
after time 18.2 { log_line "fall_y_before=[debug read memory 0xC000] (expect >50)"
                  debug write memory 0xC006 0xFE }
after time 18.3 { log_line "rise_y_mid=[debug read memory 0xC000] (expect < fall_y_before: up move committed)" }
after time 18.4 { log_line "rise_y_after=[debug read memory 0xC000]" }

# Top-edge repro: mid-fall pulses of y=0 + vy=-2 in room index 3.
after time 20    { debug write memory 0xC00B 3
                   debug write memory 0xC000 50 ; debug write memory 0xC006 2 }
after time 20.2  { debug write memory 0xC000 0 ; debug write memory 0xC006 0xFE }
after time 20.35 { debug write memory 0xC000 0 ; debug write memory 0xC006 0xFE }
after time 20.5  { debug write memory 0xC000 0 ; debug write memory 0xC006 0xFE }
after time 21 {
    log_line "repro_screen_index=[debug read memory 0xC00B] (expect 3, pre-fix went 4)"
    log_line "repro_composition=[debug read memory 0xC0D1] (expect 0)"
    log_line "repro_player_y=[debug read memory 0xC000] (expect <159)"
    flush_report
}
