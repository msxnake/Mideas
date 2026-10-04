# Reader for the directed helper-test driver ROM (CONTRATO B/C2).
# The driver runs all cases at INIT and halts with DONE=#AA at #C510.
# Results: one byte per case at #C500..#C507 (0=OK; 1 vram; 2 guard; 4 IX; 8 IY).
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-screen5-c2trans/directed_reader.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
set throttle off
proc mem8 {a} { return [debug read memory $a] }
proc vram8 {a} { return [debug read VRAM $a] }

# ROM header / source hashes for the record (read from the file by the runner
# before launching; see run log). Addresses:
# SRC=#C000 RESULTS=#C500 DONE=#C510 HELPER=#45DE (patched build).

set t0 [machine_info time]
proc poll {} {
    global t0 f
    set dt [expr {[machine_info time] - $t0}]
    if {$dt >= 10} {
        set done [mem8 0xC510]
        set res {}
        for {set i 0} {$i < 8} {incr i} { lappend res [mem8 [expr {0xC500+$i}]] }
        # VRAM readback of the 8 dst areas: even cases #7800 (R14=1), odd #3000 (R14=0)
        set dump {}
        lappend dump "block1[format %02X [vram8 0x7800]] [format %02X [vram8 0x7801]] [format %02X [vram8 0x7802]]"
        lappend dump "block0[format %02X [vram8 0x3800]] [format %02X [vram8 0x3801]] [format %02X [vram8 0x3802]]"
        logline "results=$res done=[format %02X $done] $dump"
        logline [expr {($done == 0xAA && [lsearch -exact $res 0] >= 0 && [lsearch -exact $res -1] == -1 && [lsearch -exact $res 1] == -1 && [lsearch -exact $res 2] == -1 && [lsearch -exact $res 4] == -1 && [lsearch -exact $res 8] == -1) ? "VERDICT: PASS" : "VERDICT: FAIL"}]
        close $f
        exit
    }
    after time 1 poll
}
logline "directed reader start"
poll
