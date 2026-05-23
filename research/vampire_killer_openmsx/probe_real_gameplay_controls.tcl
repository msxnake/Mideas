set out_dir "C:/Users/salam/Documents/Programacion/Mideas/research/vampire_killer_openmsx"
file mkdir $out_dir
set f [open "$out_dir/probe_real_gameplay_controls.log" "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc state {tag} { logline [format "%s PC=%04X SP=%04X AF=%04X BC=%04X DE=%04X HL=%04X IX=%04X IY=%04X" $tag [reg PC] [reg SP] [reg AF] [reg BC] [reg DE] [reg HL] [reg IX] [reg IY]] }
proc shot {name tag} { global out_dir; state $tag; screenshot "$out_dir/$name"; logline "SHOT $name" }
proc dump_bytes_to_file {space start len filename} {
    global out_dir
    set bf [open "$out_dir/$filename" "wb"]
    fconfigure $bf -translation binary
    for {set i 0} {$i < $len} {incr i} {
        set v [debug read $space [expr {$start + $i}]]
        puts -nonewline $bf [binary format c [expr {$v & 0xff}]]
    }
    close $bf
    logline [format "DUMP %s %s:%04X len=%d" $filename $space $start $len]
}
proc kd {row mask label} { keymatrixdown $row $mask; logline "KD row=$row mask=$mask $label" }
proc ku {row mask label} { keymatrixup $row $mask; logline "KU row=$row mask=$mask $label" }

logline "RUN real gameplay controls"

# Two-space sequence: first title prompt, second confirms PLAY START.
after time 9.0 { kd 8 1 "SPACE1" }
after time 9.2 { ku 8 1 "SPACE1" }
after time 12.0 { kd 8 1 "SPACE2" }
after time 12.2 { ku 8 1 "SPACE2" }

after time 22.0 {
    shot "realctl_22_start.png" "REAL_START"
    dump_bytes_to_file "memory" 0xC000 0x1000 "realctl_22_ram_c000_cfff.bin"
    dump_bytes_to_file "physical VRAM" 0x0000 0x2000 "realctl_22_vram_top.bin"
}

after time 22.2 { kd 8 128 "RIGHT" }
after time 24.2 { ku 8 128 "RIGHT" }
after time 24.4 { shot "realctl_24_after_right.png" "AFTER_RIGHT" }

after time 24.7 { kd 8 32 "UP" }
after time 25.2 { ku 8 32 "UP" }
after time 25.5 { shot "realctl_25_after_up.png" "AFTER_UP" }

after time 25.8 { kd 8 1 "SPACE" }
after time 26.3 { ku 8 1 "SPACE" }
after time 26.6 { shot "realctl_26_after_space.png" "AFTER_SPACE" }

after time 26.9 { kd 4 4 "M" }
after time 27.4 { ku 4 4 "M" }
after time 27.7 { shot "realctl_27_after_m.png" "AFTER_M" }

after time 28.0 { kd 4 8 "N" }
after time 28.5 { ku 4 8 "N" }
after time 28.8 { shot "realctl_28_after_n.png" "AFTER_N" }

after time 29.1 { kd 5 128 "Z" }
after time 29.6 { ku 5 128 "Z" }
after time 29.9 { shot "realctl_29_after_z.png" "AFTER_Z" }

after time 30.2 { kd 5 32 "X" }
after time 30.7 { ku 5 32 "X" }
after time 31.0 { shot "realctl_31_after_x.png" "AFTER_X" }

after time 31.2 {
    dump_bytes_to_file "memory" 0xC000 0x1000 "realctl_31_ram_c000_cfff.bin"
    dump_bytes_to_file "physical VRAM" 0x0000 0x2000 "realctl_31_vram_top.bin"
}

after time 31.8 { close $::f; exit }
