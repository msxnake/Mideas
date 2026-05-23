set out_dir "C:/Users/salam/Documents/Programacion/Mideas/research/vampire_killer_openmsx"
file mkdir $out_dir
set f [open "$out_dir/probe_gameplay_inputs.log" "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc state {tag} {
    logline [format "%s PC=%04X SP=%04X AF=%04X BC=%04X DE=%04X HL=%04X IX=%04X IY=%04X" $tag [reg PC] [reg SP] [reg AF] [reg BC] [reg DE] [reg HL] [reg IX] [reg IY]]
}

proc shot {name tag} {
    global out_dir
    state $tag
    screenshot "$out_dir/$name"
    logline "SHOT $name"
}

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

proc key_down {mask label} {
    keymatrixdown 8 $mask
    logline "KEYDOWN $label mask=$mask"
}

proc key_up {mask label} {
    keymatrixup 8 $mask
    logline "KEYUP $label mask=$mask"
}

logline "RUN gameplay inputs"
after time 10.5 { key_down 1 "SPACE_START" }
after time 10.7 { key_up 1 "SPACE_START" }

after time 18.0 {
    shot "gameplay_18_start.png" "GAMEPLAY_18_START"
    dump_bytes_to_file "memory" 0xC000 0x1000 "gameplay_18_ram_c000_cfff.bin"
    dump_bytes_to_file "physical VRAM" 0x0000 0x2000 "gameplay_18_vram_top.bin"
}

after time 18.2 { key_down 128 "RIGHT" }
after time 20.2 { key_up 128 "RIGHT" }
after time 20.4 { shot "gameplay_20_after_right.png" "GAMEPLAY_20_AFTER_RIGHT" }

after time 20.6 { key_down 32 "UP" }
after time 21.0 { key_up 32 "UP" }
after time 21.2 { shot "gameplay_21_after_up.png" "GAMEPLAY_21_AFTER_UP" }

after time 21.4 { key_down 1 "SPACE_ACTION" }
after time 21.8 { key_up 1 "SPACE_ACTION" }
after time 22.0 { shot "gameplay_22_after_space.png" "GAMEPLAY_22_AFTER_SPACE" }

after time 22.2 { key_down 16 "LEFT" }
after time 23.6 { key_up 16 "LEFT" }
after time 23.8 { shot "gameplay_24_after_left.png" "GAMEPLAY_24_AFTER_LEFT" }

after time 24.0 { key_down 64 "DOWN" }
after time 24.5 { key_up 64 "DOWN" }
after time 24.7 { shot "gameplay_25_after_down.png" "GAMEPLAY_25_AFTER_DOWN" }

after time 25.0 {
    dump_bytes_to_file "memory" 0xC000 0x1000 "gameplay_25_ram_c000_cfff.bin"
    dump_bytes_to_file "physical VRAM" 0x0000 0x2000 "gameplay_25_vram_top.bin"
}

after time 25.5 {
    close $::f
    exit
}
