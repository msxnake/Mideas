set out_dir "C:/Users/salam/Documents/Programacion/Mideas/research/vampire_killer_openmsx"
file mkdir $out_dir
set f [open "$out_dir/probe_hud_vdp_trace.log" "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc state_short {} {
    return [format "PC=%04X AF=%04X BC=%04X DE=%04X HL=%04X IX=%04X IY=%04X" [reg PC] [reg AF] [reg BC] [reg DE] [reg HL] [reg IX] [reg IY]]
}

set ::active 0
set ::ctrl_phase 0
set ::ctrl_first 0
set ::vram_addr -1
set ::r14 0
set ::hud_data_count 0
set ::cmd_count 0
set ::addr_count 0

debug set_watchpoint write_io 0x99 {} {
    if {$::active} {
        set v $::wp_last_value
        if {$::ctrl_phase == 0} {
            set ::ctrl_first $v
            set ::ctrl_phase 1
        } else {
            set first $::ctrl_first
            set ::ctrl_phase 0
            if {($v & 0x80) != 0} {
                set reg [expr {$v & 0x3f}]
                if {$reg == 14} {
                    set ::r14 [expr {$first & 0x07}]
                    logline [format "VDP_REG14 val=%02X r14=%d %s" $first $::r14 [state_short]]
                }
                if {$reg >= 32 && $reg <= 46 && $::cmd_count < 220} {
                    incr ::cmd_count
                    logline [format "VDP_CMDREG_%03d R%02d=%02X %s" $::cmd_count $reg $first [state_short]]
                }
            } elseif {($v & 0x40) != 0} {
                set low14 [expr {$first | (($v & 0x3f) << 8)}]
                set ::vram_addr [expr {$low14 | ($::r14 << 14)}]
                if {$::vram_addr < 0x2000 && $::addr_count < 120} {
                    incr ::addr_count
                    logline [format "VDP_ADDR_%03d addr=%05X first=%02X second=%02X r14=%d %s" $::addr_count $::vram_addr $first $v $::r14 [state_short]]
                }
            }
        }
    }
    debug cont
}

debug set_watchpoint write_io 0x98 {} {
    if {$::active && $::vram_addr >= 0} {
        if {$::vram_addr < 0x2000 && $::hud_data_count < 320} {
            incr ::hud_data_count
            logline [format "HUD_DATA_%03d addr=%05X val=%02X %s" $::hud_data_count $::vram_addr $::wp_last_value [state_short]]
        }
        incr ::vram_addr
    }
    debug cont
}

after time 10.5 { keymatrixdown 8 1; logline "INPUT SPACE DOWN" }
after time 10.7 {
    keymatrixup 8 1
    set ::active 1
    logline "TRACE_ACTIVE_AFTER_SPACE"
}

after time 18.0 {
    screenshot "$out_dir/hud_trace_18s.png"
    logline [format "COUNTS hud_data=%d cmd=%d addr=%d" $::hud_data_count $::cmd_count $::addr_count]
    close $::f
    exit
}
