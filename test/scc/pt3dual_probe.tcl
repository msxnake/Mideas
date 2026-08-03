# PT3 dual-route noise probe (v2, error-capturing).
set result_path "C:/Users/salam/Documents/Programacion/Mideas/test/scc/pt3dual_probe.txt"
set lines [list]
proc L {s} { global lines; lappend lines $s }
proc flush_report {} { global result_path lines
    set fh [open $result_path w]; foreach l $lines { puts $fh $l }; close $fh; exit }
catch { set renderer none }
catch { set throttle off }
proc rd {addr} { return [debug read memory $addr] }
proc psg_reg {r} { return [debug read "PSG regs" $r] }

after time 8.0 { keymatrixdown 8 1 }
after time 9.0 { keymatrixup 8 1 }

set n 0
proc tick {} {
    global n
    incr n
    if {[catch {
        set row [rd 0xC4E5]
        set line "f=$n row=$row posA=[rd 0xC554] posB=[rd 0xC555] posC=[rd 0xC556]"
        append line " pt3m=[rd 0xC538],[rd 0xC539],[rd 0xC53A]"
        append line " vol=[rd 0xC50E],[rd 0xC50F],[rd 0xC510]"
        append line " nadd=[rd 0xC53E] nper=[rd 0xC4F1] mixsh=[format %02X [rd 0xC53B]]"
        append line " | R6=[psg_reg 6] R7=[format %02X [psg_reg 7]] R8=[psg_reg 8] R9=[psg_reg 9] R10=[psg_reg 10]"
        append line " R01=[psg_reg 0],[psg_reg 1] R23=[psg_reg 2],[psg_reg 3] R45=[psg_reg 4],[psg_reg 5]"
        append line " cd=[rd 0xC4E1] mut=[rd 0xC401],[rd 0xC4DE] bank=[rd 0xC4DC] trk=[rd 0xC403] rp=[format %04X [expr {[rd 0xC4EE]*256+[rd 0xC4ED]}]] tp=[format %04X [expr {[rd 0xC4F0]*256+[rd 0xC4EF]}]] sccrow=[rd 0xC40C]"
        L $line
    } err]} { L "TICK ERROR: $err"; flush_report }
    if {$n < 200} { after time 0.02 tick } else { flush_report }
}
proc poll_start {} {
    if {[catch {set act [rd 0xC4DD]} err]} { L "POLL ERROR: $err"; flush_report }
    if {$act == 1} {
        L "=== psg_music_active=1: per-frame log begins ==="
        after time 0.02 tick
    } else {
        after time 0.25 poll_start
    }
}
after time 9.5 poll_start
after time 120 { L "guard timeout n=$n"; flush_report }
