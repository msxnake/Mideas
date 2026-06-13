set ::hits_upload 0
set ::hits_input 0
set ::hits_stomp 0
debug set_bp 0x585F 1 { incr ::hits_upload }
debug set_bp 0x4E0F 1 { incr ::hits_input }
debug set_bp 0xAA18 1 { incr ::hits_stomp }
after time 6 {
    set fh [open "test/pc2.txt" w]
    puts $fh "input_gate_hits=$::hits_input upload_hits=$::hits_upload stomp_call_hits=$::hits_stomp"
    puts $fh "PC_now=[format %04X [reg PC]]"
    close $fh
    exit
}
