proc chikubi_probe_msx1_write {} {
    set output_path {C:/Users/salam/Documents/Programacion/Mideas/server/temp/chikubi_probe_msx1_output.txt}
    set out [open $output_path {WRONLY CREAT TRUNC}]

    puts $out [format "machine=%s" [machine]]
    puts $out ""

    if {[catch {set summary [rom_info]} err]} {
        puts $out [format "rom_info_error=%s" $err]
    } else {
        puts $out $summary
    }

    close $out
    exit
}

after realtime 1 chikubi_probe_msx1_write
