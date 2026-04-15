proc chikubi_probe_hex {addr size} {
    binary scan [debug read_block memory $addr $size] c* values
    set bytes {}
    foreach value $values {
        lappend bytes [format %02X [expr {$value & 0xFF}]]
    }
    return [join $bytes " "]
}

proc chikubi_probe_write {} {
    set output_path {C:/Users/salam/Documents/Programacion/Mideas/server/temp/chikubi_probe_output.txt}
    set out [open $output_path {WRONLY CREAT TRUNC}]

    puts $out [format "machine=%s" [machine]]
    puts $out ""

    if {[catch {set summary [rom_info]} err]} {
        puts $out [format "rom_info_error=%s" $err]
    } else {
        puts $out $summary
    }

    puts $out ""
    if {[catch {set romtype_info [openmsx_info romtype Mirrored]} err]} {
        puts $out [format "romtype_info_error=%s" $err]
    } else {
        puts $out "romtype=Mirrored"
        puts $out $romtype_info
    }

    puts $out ""
    foreach addr {0x0000 0x4000 0x8000 0xC000} {
        puts $out [format "mem[%s]=%s" $addr [chikubi_probe_hex $addr 16]]
    }

    puts $out ""
    foreach device [machine_info device] {
        if {[dict get [machine_info device $device] "type"] ne "ROM"} {
            continue
        }
        puts $out [format "device=%s" $device]
        puts $out [machine_info device $device]
        puts $out ""
    }

    close $out
    exit
}

after realtime 1 chikubi_probe_write
