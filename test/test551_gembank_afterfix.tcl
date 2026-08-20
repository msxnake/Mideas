# Temporary post-fix probe: trace the actual bank helper and mapper setters.
# Unlike test551_gembank.tcl, this does not watch RAM at 8000/A000; it breaks
# on the routines that write the Konami mapper registers.
set SYMFILE "C:/Users/salam/AppData/Local/Temp/mideas-test551/test551_boss_claude.sym"
set LOG [open "C:/Users/salam/AppData/Local/Temp/mideas-test551/test551-gembank-afterfix.log" w]
proc say {m} { global LOG; puts $LOG $m; flush $LOG }
set SYM [dict create]
set fh [open $SYMFILE r]
foreach line [split [read $fh] "\n"] {
    if {[regexp {^([A-Za-z_.][A-Za-z0-9_.]*): equ ([0-9A-Fa-f]+)H} [string trim $line] -> name hex]} {
        scan $hex %x addr
        dict set SYM $name $addr
    }
}
close $fh
proc sym {n} { global SYM ; return [dict get $SYM $n] }
set A_gem   [sym bitmap_gem_room_table]
set A_rest  [sym bitmap_room_restore_resident_banks]
set A_p2    [sym mapper_set_bank_p2]
set A_p3    [sym mapper_set_bank_p3]
set A_copy  [sym bitmap_copy_banked_to_ram]
set A_staged [sym .gem_table_staged]
set R_stage [sym bitmap_gem_staged_room]
set R_table [sym bitmap_gem_table_buf]
set R_p2cur [sym mapper_bank_p2_current]
say [format "SYMS gem=%04X restore=%04X p2=%04X p3=%04X copy=%04X staged=%04X stage=%04X table=%04X" $A_gem $A_rest $A_p2 $A_p3 $A_copy $A_staged $R_stage $R_table]
proc p2_bp {} { global A_p2 ; say [format "P2 t=%.3f pc=%04X A=%02X" [machine_info time] [reg PC] [reg A]] ; debug cont }
proc p3_bp {} { global A_p3 ; say [format "P3 t=%.3f pc=%04X A=%02X" [machine_info time] [reg PC] [reg A]] ; debug cont }
proc rest_bp {} { say [format "RESTORE t=%.3f pc=%04X A=%02X" [machine_info time] [reg PC] [reg A]] ; debug cont }
proc copy_bp {} { say [format "COPY t=%.3f pc=%04X A=%02X HL=%04X DE=%04X BC=%04X" [machine_info time] [reg PC] [reg A] [reg HL] [reg DE] [reg BC]] ; debug cont }
proc staged_bp {} {
    global R_stage R_table
    set bytes ""
    for {set i 0} {$i < 16} {incr i} { append bytes [format "%02X" [debug read memory [expr {$R_table + $i}]]] }
    say [format "STAGED t=%.3f pc=%04X A=%02X B=%02X stage=%02X table=%s" [machine_info time] [reg PC] [reg A] [reg B] [debug read memory $R_stage] $bytes]
    debug cont
}
proc gem_bp {} {
    global R_stage R_table R_p2cur
    set bytes ""
    for {set i 0} {$i < 16} {incr i} { append bytes [format "%02X" [debug read memory [expr {$R_table + $i}]]] }
    set ptrraw [format "%02X%02X" [debug read memory [sym bitmap_gem_ptr_table]] [debug read memory [expr {[sym bitmap_gem_ptr_table] + 1}]]]
    set count [debug read memory [sym bitmap_gem_count_table]]
    set bank [debug read memory [sym bitmap_gem_bank_table]]
    say [format "GEM_TABLE t=%.3f pc=%04X A=%02X B=%02X stage=%02X p2cur=%02X p1=%02X p2=%02X p3=%02X p4=%02X ptr0=%s count0=%02X bank0=%02X table=%s" \
        [machine_info time] [reg PC] [reg A] [reg B] [debug read memory $R_stage] [debug read memory $R_p2cur] \
        [debug read memory 0xC053] [debug read memory 0xC054] [debug read memory 0xC055] [debug read memory 0xC056] \
        $ptrraw $count $bank $bytes]
    debug cont
}
debug set_bp $A_p2 {} { p2_bp }
debug set_bp $A_p3 {} { p3_bp }
debug set_bp $A_rest {} { rest_bp }
debug set_bp $A_copy {} { copy_bp }
debug set_bp $A_staged {} { staged_bp }
debug set_bp $A_gem {} { gem_bp }
after time 12.000 {
    say [format "END t=%.3f pc=%04X" [machine_info time] [reg PC]]
    close $::LOG
    after time 0.100 { exit }
}
debug cont
