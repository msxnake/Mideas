set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_timer_probe.log"
set f [open $log_path "w"]
proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} {
    set lo [debug read memory $addr]
    set hi [debug read memory [expr {$addr + 1}]]
    return [expr {$lo + ($hi * 256)}]
}
proc dump_timer {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set t [mem16 0xC04B]
    set lives [mem8 0xC04A]
    set gems [mem8 0xC049]
    set irq [mem16 0xEA88]
    set last [mem16 0xDCA5]
    set frames [mem8 0xDCA4]
    set exit [mem8 0xC03D]
    set state [mem8 0xC03F]
    set engine [mem8 0xE42C]
    set bankp1 [mem8 0xC053]
    set bankp2 [mem8 0xC054]
    set bankp3 [mem8 0xC055]
    set sm0 [expr {[mem8 0xE095] + ([mem8 0xE0B5] * 256)}]
    set sm1 [expr {[mem8 0xE096] + ([mem8 0xE0B6] * 256)}]
    set sm2 [expr {[mem8 0xE097] + ([mem8 0xE0B7] * 256)}]
    set x0 [mem8 0xDE94]
    set y0 [mem8 0xDEB4]
    set vy0 [mem8 0xDEF4]
    set ground0 [mem8 0xE5F1]
    set deadly0 [mem8 0xE654]
    set hp0 [mem8 0xE611]
    set mask0 [mem8 0xDF14]
    set maskhi0 [mem8 0xDF34]
    set collwith0 [mem8 0xE734]
    set hitw0 [mem8 0xE7B4]
    set hith0 [mem8 0xE7D4]
    set active_count [mem8 0xE9A5]
    set coll_count [mem8 0xEA0A]
    set active0 [mem8 0xE985]
    set active1 [mem8 0xE986]
    set active2 [mem8 0xE987]
    set coll0 [mem8 0xE9EA]
    set coll1 [mem8 0xE9EB]
    set coll2 [mem8 0xE9EC]
    set col [expr {$x0 / 8}]
    set row [expr {($y0 + 16) / 8}]
    set idx [expr {$row * 32 + $col}]
    set beh [mem8 [expr {0xCA90 + $idx}]]
    set behr1 [mem8 [expr {0xCA90 + (($row + 1) * 32) + $col}]]
    set behr2 [mem8 [expr {0xCA90 + (($row + 2) * 32) + $col}]]
    logline [format "%s pc=%04X sp=%04X time=%d lives=%d gems=%d frames=%d irq=%d last=%d exit=%02X state=%02X engine=%02X b1=%02X b2=%02X b3=%02X sm0=%04X sm1=%04X sm2=%04X x0=%d y0=%d vy0=%d g0=%02X deadly0=%02X hp0=%d mask0=%02X/%02X cw0=%02X hb0=%dx%d ac=%d al=%d,%d,%d cc=%d cl=%d,%d,%d beh(%d,%d)=%02X/%02X/%02X" $tag $pc $sp $t $lives $gems $frames $irq $last $exit $state $engine $bankp1 $bankp2 $bankp3 $sm0 $sm1 $sm2 $x0 $y0 $vy0 $ground0 $deadly0 $hp0 $mask0 $maskhi0 $collwith0 $hitw0 $hith0 $active_count $active0 $active1 $active2 $coll_count $coll0 $coll1 $coll2 $col $row $beh $behr1 $behr2]
}
proc tap_space {tag} {
    logline "${tag}_SPC_DOWN"
    keymatrixdown 8 1
    after time 0.18 {
        keymatrixup 8 1
    }
}
after time 6.8 { dump_timer "before_first_spc" }
after time 7.0 { tap_space "first" }
after time 8.1 { dump_timer "after_first_1s" }
after time 9.0 { dump_timer "before_second_spc" }
after time 9.2 { tap_space "second" }
after time 9.25 { dump_timer "second_0050ms" }
after time 9.40 { dump_timer "second_0200ms" }
after time 9.60 { dump_timer "second_0400ms" }
after time 9.80 { dump_timer "second_0600ms" }
after time 10.00 { dump_timer "second_0800ms" }
after time 10.20 { dump_timer "second_1000ms" }
after time 10.70 { dump_timer "second_1500ms" }
after time 11.20 { dump_timer "second_2000ms" }
after time 12.20 { dump_timer "second_3000ms" }
after time 12.25 {
    close $f
    exit
}
