set base "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-platform"
set log [open "$base/shaft_log.txt" w]
proc dump {tag} {
    global log
    set py    [debug read memory 0xC000]
    set px    [debug read memory 0xC001]
    set room  [debug read memory 0xC00B]
    set rider [debug read memory 0xC0E8]
    set p0y   [debug read memory 0xC0EA]
    set p0id  [debug read memory 0xC0F4]
    set p1y   [debug read memory 0xC0F6]
    set p1id  [debug read memory 0xC100]
    set pend  [debug read memory 0xC101]
    puts $log "$tag room=$room py=$py px=$px rider=$rider s0y=$p0y s0id=$p0id s1y=$p1y s1id=$p1id pend=$pend"
    flush $log
}
proc shot {name} {
    global base
    screenshot $base/$name.png
}
for {set i 0} {$i < 48} {incr i} {
    after time [expr {4.0 + $i * 0.25}] "dump s$i"
}
after time 6.5  { shot shot1_roomA }
after time 9.6  { shot shot2_roomB }
after time 13.4 { shot shot3_roomC }
after time 16.0 {
    shot shot4_end
    close $log
    exit
}
