set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/galious_mode_regs.log"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc sample {tag} {
    set vals {}
    for {set r 0} {$r <= 7} {incr r} { lappend vals [format "r%d=%02X" $r [vdpreg $r]] }
    logline "$tag [join $vals { }]"
}
after time 60 { sample t60 }
after time 68 { sample t68 }
after time 80 { sample t80 }
after time 88 { sample t88 }
after time 94 { sample t94 }
after time 96 { close $f; exit }
