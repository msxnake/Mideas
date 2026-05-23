set out_dir "C:/Users/salam/Documents/Programacion/Mideas/research/vampire_killer_openmsx"
file mkdir $out_dir
set f [open "$out_dir/probe_sprite_tables.log" "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc state {tag} { logline [format "%s PC=%04X SP=%04X AF=%04X BC=%04X DE=%04X HL=%04X IX=%04X IY=%04X" $tag [reg PC] [reg SP] [reg AF] [reg BC] [reg DE] [reg HL] [reg IX] [reg IY]] }
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
proc dump_sat {space base label} {
    logline [format "SAT %s %s:%05X" $label $space $base]
    for {set i 0} {$i < 32} {incr i} {
        set a [expr {$base + $i * 4}]
        set y [debug read $space $a]
        set x [debug read $space [expr {$a+1}]]
        set p [debug read $space [expr {$a+2}]]
        set c [debug read $space [expr {$a+3}]]
        logline [format "SAT_%s_%02d y=%02X x=%02X pat=%02X col=%02X" $label $i $y $x $p $c]
    }
}

logline "RUN sprite table dump"
after time 9.0 { kd 8 1 "SPACE1" }
after time 9.2 { ku 8 1 "SPACE1" }
after time 12.0 { kd 8 1 "SPACE2" }
after time 12.2 { ku 8 1 "SPACE2" }
after time 22.0 {
    shot "sprites_22_start.png" "SPRITES_START"
    dump_regs
    dump_sat "physical VRAM" 0x7600 "phys7600"
    dump_sat "physical VRAM" 0xF600 "physF600"
    dump_sat "VRAM" 0x7600 "vram7600"
    dump_bytes_to_file "physical VRAM" 0xF600 0x0200 "sprites_22_sat_f600.bin"
    dump_bytes_to_file "physical VRAM" 0xF800 0x0800 "sprites_22_spt_f800.bin"
    dump_bytes_to_file "physical VRAM" 0x7600 0x0200 "sprites_22_phys7600.bin"
    dump_bytes_to_file "physical VRAM" 0x7800 0x0800 "sprites_22_phys7800.bin"
}
after time 22.2 { kd 8 128 "RIGHT" }
after time 24.0 { ku 8 128 "RIGHT" }
after time 24.2 {
    shot "sprites_24_after_right.png" "SPRITES_AFTER_RIGHT"
    dump_sat "physical VRAM" 0x7600 "phys7600_r"
    dump_sat "physical VRAM" 0xF600 "physF600_r"
    dump_bytes_to_file "physical VRAM" 0xF600 0x0200 "sprites_24_sat_f600.bin"
    dump_bytes_to_file "physical VRAM" 0x7600 0x0200 "sprites_24_phys7600.bin"
    close $::f
    exit
}
