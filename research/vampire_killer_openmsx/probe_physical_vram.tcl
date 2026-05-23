set out_dir "C:/Users/salam/Documents/Programacion/Mideas/research/vampire_killer_openmsx"
file mkdir $out_dir
set f [open "$out_dir/probe_physical_vram.log" "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
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
proc dump_vdp_regs {} {
    set parts {}
    for {set i 0} {$i < 32} {incr i} { lappend parts [format "R%02d=%02X" $i [debug read "VDP regs" $i]] }
    logline "VDPREG [join $parts " "]"
}
after time 10.5 { keymatrixdown 8 1; logline "INPUT SPACE DOWN" }
after time 10.7 { keymatrixup 8 1; logline "INPUT SPACE UP" }
after time 22.0 {
    screenshot "$out_dir/physical_vram_22s.png"
    dump_vdp_regs
    dump_bytes_to_file "physical VRAM" 0x00000 0x20000 "game_22s_physical_vram.bin"
    close $::f
    exit
}
