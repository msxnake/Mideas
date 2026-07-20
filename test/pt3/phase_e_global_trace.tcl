set result_path "C:/Users/salam/Documents/Programacion/Mideas/test/pt3/out/phase_e_global_openmsx.txt"
set sym_path "C:/Users/salam/Documents/Programacion/Mideas/test/pt3/out/phase_e_global.sym"

array set ::syms {}
set sf [open $sym_path r]
while {[gets $sf line] >= 0} {
    if {[regexp {^(\S+):\s+equ\s+([0-9A-Fa-f]+)H} $line -> name hexval]} {
        set ::syms($name) [expr {"0x$hexval"}]
    }
}
close $sf
proc sym {name} { return $::syms($name) }
proc psg_reg {r} { return [debug read "PSG regs" $r] }
proc ram_byte {name} { return [debug read memory [sym $name]] }

set ::lines [list]
set ::frame_index 0
set ::r13_writes 0
proc flush_report {} {
    set fh [open $::result_path w]
    foreach line $::lines { puts $fh $line }
    close $fh
    exit
}

debug set_bp [sym psg_write] {} {
    if {[reg A] == 13} { incr ::r13_writes }
    debug cont
}

debug set_bp [sym phase_e_trace_marker] {} {
    set regs [list]
    for {set r 0} {$r < 14} {incr r} { lappend regs [psg_reg $r] }
    lappend ::lines "frame=$::frame_index regs=[join $regs ,] r13writes=$::r13_writes noiseadd=[ram_byte music_pt3_noise_add]"
    incr ::frame_index
    if {$::frame_index >= 6} { flush_report }
    debug cont
}

after time 15 {
    lappend ::lines "guard_timeout frames=$::frame_index"
    flush_report
}
