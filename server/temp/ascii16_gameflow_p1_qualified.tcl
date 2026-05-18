set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/ascii16_gameflow_p1_qualified.log"
set f [open $log_path "w"]
array set hits {}
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} { set lo [mem8 $addr]; set hi [mem8 [expr {$addr+1}]]; return [expr {$lo | ($hi << 8)}] }
proc state {tag} {
 set pc [reg PC]; set sp [reg SP]; set a [reg A]; set f [reg F]; set b [reg B]; set c [reg C]; set h [reg H]; set l [reg L]; set d [reg D]; set e [reg E]
 set p1 [mem8 0xC11D]; set p3 [mem8 0xC11F]; set irq [mem16 0xE829]; set player [mem8 0xE195]
 logline [format "%s pc=%04X sp=%04X a=%02X f=%02X bc=%02X%02X hl=%02X%02X de=%02X%02X p1=%02X p3=%02X irq=%d player=%02X" $tag $pc $sp $a $f $b $c $h $l $d $e $p1 $p3 $irq $player]
}
proc qbp {name limit bank} { global hits; if {![info exists hits($name)]} {set hits($name) 0}; if {[mem8 0xC11D] == $bank} {incr hits($name); if {$hits($name) <= $limit} {state $name}}; debug cont }
proc bp {name limit} { global hits; if {![info exists hits($name)]} {set hits($name) 0}; incr hits($name); if {$hits($name) <= $limit} {state $name}; debug cont }
proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {tag} { state ${tag}_before; down 1; after time 0.22 [list up 1]; after time 0.32 [list state ${tag}_after] }

debug set_bp 0x6008 {} { qbp GF_START 8 6 }
debug set_bp 0x600E {} { qbp GF_EXEC 24 6 }
debug set_bp 0x603B {} { qbp GF_HANDLE_START 8 6 }
debug set_bp 0x6590 {} { qbp GF_HANDLE_PRESENTATION 8 6 }
debug set_bp 0x65CB {} { qbp GF_HANDLE_MUSIC 8 6 }
debug set_bp 0x60E3 {} { qbp GF_GET_DEFAULT 24 6 }
debug set_bp 0x6047 {} { qbp SCREEN_IMAGE 8 5 }
debug set_bp 0x4DC0 {} { bp SHOW_IMAGE_FAR 8 }
debug set_bp 0x48BD {} { bp RESOURCE_LOAD 20 }

after time 7.0 { tap_space SPC1 }
after time 12.0 { tap_space SPC2 }
after time 16.0 { state FINAL; global hits f; foreach k [lsort [array names hits]] {logline [format "COUNT %s %d" $k $hits($k)]}; close $f; exit }
