set out_dir "C:/Users/salam/Documents/Programacion/Mideas/research/vampire_killer_openmsx"
file mkdir $out_dir
set f [open "$out_dir/probe_sprite_color_candidates.log" "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc kd {row mask label} { keymatrixdown $row $mask; logline "KD $label" }
proc ku {row mask label} { keymatrixup $row $mask; logline "KU $label" }
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
after time 9.0 { kd 8 1 SPACE1 }
after time 9.2 { ku 8 1 SPACE1 }
after time 12.0 { kd 8 1 SPACE2 }
after time 12.2 { ku 8 1 SPACE2 }
after time 22.2 { kd 8 128 RIGHT }
after time 24.0 { ku 8 128 RIGHT }
after time 24.2 {
    screenshot "$out_dir/sprite_color_candidates_24.png"
    foreach addr {0xF000 0xF200 0xF400 0xF600 0xF800 0xFA00 0xFC00 0xFE00} {
        dump_bytes_to_file "physical VRAM" $addr 0x0200 [format "sprite_candidate_%05X.bin" $addr]
    }
    close $::f
    exit
}
