set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/galious_bios_vram_calls.log"
set f [open $log_path "w"]
set active 0
set maxlog 240
set count 0
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} { return [expr {[mem8 $addr] | ([mem8 [expr {$addr+1}]] << 8)}] }
proc log_bios {name} {
    global active maxlog count
    if {!$active} { debug cont; return }
    if {$count >= $maxlog} { debug cont; return }
    set sp [reg SP]
    set ret [mem16 $sp]
    set callsite [expr {($ret - 3) & 0xFFFF}]
    set hl [reg HL]
    set de [reg DE]
    set bc [reg BC]
    set af [reg AF]
    incr count
    logline [format "%03d %s ret=%04X call=%04X HL=%04X DE=%04X BC=%04X AF=%04X" $count $name $ret $callsite $hl $de $bc $af]
    debug cont
}
debug set_bp 0x004D {} { log_bios WRTVRM }
debug set_bp 0x0053 {} { log_bios SETWRT }
debug set_bp 0x0056 {} { log_bios FILVRM }
debug set_bp 0x005C {} { log_bios LDIRVM }
after time 76 { set active 1; logline "ACTIVE" }
after time 96 { logline "DONE"; close $f; exit }
