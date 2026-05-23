set out_dir "C:/Users/salam/Documents/Programacion/Mideas/research/vampire_killer_openmsx"
file mkdir $out_dir
set f [open "$out_dir/probe_sat_update_trace.log" "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc state_short {} { return [format "PC=%04X AF=%04X BC=%04X DE=%04X HL=%04X IX=%04X IY=%04X" [reg PC] [reg AF] [reg BC] [reg DE] [reg HL] [reg IX] [reg IY]] }
proc state {tag} { logline [format "%s %s SP=%04X" $tag [state_short] [reg SP]] }
proc shot {name tag} { global out_dir; state $tag; screenshot "$out_dir/$name"; logline "SHOT $name" }
proc kd {row mask label} { keymatrixdown $row $mask; logline "KD row=$row mask=$mask $label" }
proc ku {row mask label} { keymatrixup $row $mask; logline "KU row=$row mask=$mask $label" }

proc dump_bytes_to_file {space start len filename} {
    global out_dir
    set bf [open "$out_dir/$filename" "wb"]
    fconfigure $bf -translation binary
    for {set i 0} {$i < $len} {incr i} {
        set v [debug read $space [expr {$start + $i}]]
        puts -nonewline $bf [binary format c [expr {$v & 0xff}]]
    }
    close $bf
    logline [format "DUMP %s %s:%05X len=%d" $filename $space $start $len]
}

proc dump_regs {} {
    set parts {}
    for {set i 0} {$i < 32} {incr i} { lappend parts [format "R%02d=%02X" $i [debug read "VDP regs" $i]] }
    logline "VDPREG [join $parts " "]"
}

proc dump_sat {base label} {
    logline [format "SAT %s physical VRAM:%05X" $label $base]
    for {set i 0} {$i < 32} {incr i} {
        set a [expr {$base + $i * 4}]
        set y [debug read "physical VRAM" $a]
        set x [debug read "physical VRAM" [expr {$a + 1}]]
        set p [debug read "physical VRAM" [expr {$a + 2}]]
        set c [debug read "physical VRAM" [expr {$a + 3}]]
        if {$y != 0xE0 || $x != 0x00 || $p != 0x00} {
            logline [format "SAT_%s_%02d y=%02X x=%02X pat=%02X col=%02X" $label $i $y $x $p $c]
        }
    }
}

set ::active 0
set ::ctrl_phase 0
set ::ctrl_first 0
set ::vram_addr -1
set ::r14 0
set ::sat_write_count 0
set ::sct_write_count 0
set ::sat_addr_count 0

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
                    if {$::sat_addr_count < 80} {
                        incr ::sat_addr_count
                        logline [format "VDP_REG14 val=%02X r14=%d %s" $first $::r14 [state_short]]
                    }
                }
            } elseif {($v & 0x40) != 0} {
                set low14 [expr {$first | (($v & 0x3f) << 8)}]
                set ::vram_addr [expr {$low14 | ($::r14 << 14)}]
                if {(($::vram_addr >= 0xF600 && $::vram_addr < 0xF680) || ($::vram_addr >= 0xF400 && $::vram_addr < 0xF600)) && $::sat_addr_count < 180} {
                    incr ::sat_addr_count
                    logline [format "VDP_ADDR_%03d addr=%05X first=%02X second=%02X r14=%d %s" $::sat_addr_count $::vram_addr $first $v $::r14 [state_short]]
                }
            }
        }
    }
    debug cont
}

debug set_watchpoint write_io 0x98 {} {
    if {$::active && $::vram_addr >= 0} {
        if {$::vram_addr >= 0xF600 && $::vram_addr < 0xF680 && $::sat_write_count < 260} {
            incr ::sat_write_count
            logline [format "SAT_DATA_%03d addr=%05X val=%02X %s" $::sat_write_count $::vram_addr $::wp_last_value [state_short]]
        } elseif {$::vram_addr >= 0xF400 && $::vram_addr < 0xF600 && $::sct_write_count < 180} {
            incr ::sct_write_count
            logline [format "SCT_DATA_%03d addr=%05X val=%02X %s" $::sct_write_count $::vram_addr $::wp_last_value [state_short]]
        }
        incr ::vram_addr
    }
    debug cont
}

logline "RUN SAT update trace"
after time 9.0 { kd 8 1 "SPACE1" }
after time 9.2 { ku 8 1 "SPACE1" }
after time 12.0 { kd 8 1 "SPACE2" }
after time 12.2 { ku 8 1 "SPACE2" }
after time 21.5 {
    set ::active 1
    shot "sat_trace_21_real_gameplay.png" "TRACE_ACTIVE_REAL_GAMEPLAY"
    dump_regs
    dump_sat 0xF600 "before_move"
    dump_bytes_to_file "physical VRAM" 0xF400 0x0200 "sat_trace_21_sct_f400.bin"
    dump_bytes_to_file "physical VRAM" 0xF600 0x0080 "sat_trace_21_sat_f600.bin"
}
after time 22.0 { kd 8 128 "RIGHT" }
after time 24.0 { ku 8 128 "RIGHT" }
after time 24.2 {
    shot "sat_trace_24_after_right.png" "AFTER_RIGHT"
    dump_regs
    dump_sat 0xF600 "after_right"
    dump_bytes_to_file "physical VRAM" 0xF400 0x0200 "sat_trace_24_sct_f400.bin"
    dump_bytes_to_file "physical VRAM" 0xF600 0x0080 "sat_trace_24_sat_f600.bin"
    logline [format "COUNTS sat_writes=%d sct_writes=%d tracked_addrs=%d" $::sat_write_count $::sct_write_count $::sat_addr_count]
    close $::f
    exit
}
