# HUD-jump horizontal traverse smoke (test51, room 0 = pant1, north rail = #FF).
# Bug: while player_y is wrapped above the top edge (#FF..#C0, jumping over the
# HUD with no north room), bitmap_try_move_x probes returned SOLID for the
# offscreen rows, freezing all horizontal movement at the jump apex.
# Expected post-fix: holding RIGHT while wrapped moves player_x; screen index
# stays 0 (no phantom transition).
# RAM (t51.sym): player_y=#C000 player_x=#C001 player_vy=#C006 player_flags=#C007
#                current_screen_index=#C00B bitmap_composition_state=#C0D1
set result_path "test/msx2-hudjump/hudjump_result.txt"
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

# Sanity: grounded RIGHT walk must still move (bottom-edge guard untouched).
after time 18   { log_line "screen_index_start=[debug read memory 0xC00B]"
                  log_line "ground_x_before=[debug read memory 0xC001]"
                  keymatrixdown 8 0x80 }
after time 18.5 { keymatrixup 8 0x80
                  log_line "ground_x_after=[debug read memory 0xC001] (expect > ground_x_before)" }

# Repro: wrap the player above the top edge mid-air and hold RIGHT.
# player_vy pokes only stick while airborne, so start a fall first, then pulse
# y=#F0 (-16) + vy=#FE every ~0.15s so the player stays in the wrapped band.
after time 20    { debug write memory 0xC000 50 ; debug write memory 0xC006 2 }
after time 20.2  { log_line "wrap_x_before=[debug read memory 0xC001]"
                   keymatrixdown 8 0x80
                   debug write memory 0xC000 0xF0 ; debug write memory 0xC006 0xFE }
after time 20.35 { log_line "wrap_y_mid1=[debug read memory 0xC000] (expect >= 192: still wrapped)"
                   debug write memory 0xC000 0xF0 ; debug write memory 0xC006 0xFE }
after time 20.5  { log_line "wrap_x_mid=[debug read memory 0xC001]"
                   debug write memory 0xC000 0xF0 ; debug write memory 0xC006 0xFE }
after time 20.6  { screenshot test/msx2-hudjump/hudjump_over_hud.png }
after time 20.65 { debug write memory 0xC000 0xF0 ; debug write memory 0xC006 0xFE }
after time 20.8  { keymatrixup 8 0x80
                   log_line "wrap_x_after=[debug read memory 0xC001] (expect > wrap_x_before: X moves while wrapped)"
                   log_line "wrap_y_end=[debug read memory 0xC000]" }
after time 22 {
    log_line "screen_index_end=[debug read memory 0xC00B] (expect == screen_index_start)"
    log_line "composition=[debug read memory 0xC0D1] (expect 0)"
    flush_report
}
